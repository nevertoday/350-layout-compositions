// 暗房十一阶色阶仪状态模型（WebGL 3D 与 2D Canvas 降级完全共用）：
//   black ∈ [0.00..0.90]：黑场锚点（0 = 纯黑 #000，0.06 = 原海报炭墨 #10110e）
//   white ∈ [0.10..1.00]：白场锚点（0.93 = 原海报暖纸 #efe7dc，1.00 = 纯白 #fff）
//   key   ∈ [0.12..0.88]：明暗面积与调性重心（0.12 = 暗场主导低调，0.50 = 均衡对半，0.88 = 亮场主导高调）

import { clamp, contrastRatio, lerp, levelRgb, rgbHex } from "./palette.js";

export const MIN_GAP = 0.08;

export const SCENES = {
  split: { label: "海报母题", en: "Split Motif" },
  chiaroscuro: { label: "明暗雕塑", en: "Chiaroscuro" },
  editorial: { label: "版面样本", en: "Editorial" },
};

export const GRADATIONS = {
  notan: { label: "二值黑白", steps: 2 },
  five: { label: "五阶层次", steps: 5 },
  smooth: { label: "连续明暗", steps: 0 },
};

// 五个暗房典型曝光预设
export const PRESETS = [
  { id: "poster", label: "海报定标", black: 0.06, white: 0.93, key: 0.5 },
  { id: "flat", label: "平光灰雾", black: 0.36, white: 0.6, key: 0.5 },
  { id: "highkey", label: "高调通透", black: 0.24, white: 0.94, key: 0.78 },
  { id: "lowkey", label: "低调剧场", black: 0.04, white: 0.78, key: 0.22 },
  { id: "purebw", label: "纯黑白", black: 0.0, white: 1.0, key: 0.5 },
];

export const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

// 约束三点位置，保证黑场永远在白场左侧且保留最小间距
export function clampLevels(black, white, key) {
  let b = clamp(black, 0, 1 - MIN_GAP);
  let w = clamp(white, MIN_GAP, 1);
  if (w - b < MIN_GAP) {
    const mid = clamp((b + w) * 0.5, MIN_GAP * 0.5, 1 - MIN_GAP * 0.5);
    b = mid - MIN_GAP * 0.5;
    w = mid + MIN_GAP * 0.5;
  }
  return { black: b, white: w, key: clamp(key, 0.12, 0.88) };
}

// 松手时靠近关键暗房刻度轻轻吸附（拖动过程中不吸附，保证跟手）
export function snapHandle(which, val) {
  if (which === "black") {
    if (Math.abs(val - 0.06) < 0.025) return 0.06;
    if (val < 0.018) return 0;
    return val;
  }
  if (which === "white") {
    if (Math.abs(val - 0.93) < 0.025) return 0.93;
    if (val > 0.982) return 1;
    return val;
  }
  if (which === "key") {
    if (Math.abs(val - 0.5) < 0.03) return 0.5;
    if (Math.abs(val - 0.78) < 0.024) return 0.78;
    if (Math.abs(val - 0.22) < 0.024) return 0.22;
    return val;
  }
  return val;
}

// 实时计算 11 级明度区（Zone 0..X）的直方图分布高度（归一化到 0.03..1，严格落在 [zLo..zHi] 范围内）
export function computeHistogram(state) {
  const bins = new Array(11).fill(0);
  const zB = state.black * 10;
  const zW = state.white * 10;
  const zLo = Math.round(zB);
  const zHi = Math.round(zW);
  const lightW = clamp(state.key, 0.12, 0.88);
  const darkW = 1 - lightW;

  const addInRange = (center, sigma, weight) => {
    for (let i = zLo; i <= zHi; i++) {
      const d = (i - center) / sigma;
      bins[i] += weight * Math.exp(-0.5 * d * d);
    }
  };

  if (state.gradation === "notan") {
    bins[zLo] += darkW * 1.0;
    if (zLo + 1 < zHi) bins[zLo + 1] += darkW * 0.14;
    bins[zHi] += lightW * 1.0;
    if (zHi - 1 > zLo) bins[zHi - 1] += lightW * 0.14;
    if (state.scene === "split" && state.dot) {
      const dotIdx = clamp(Math.round(lerp(zLo, zHi, 0.36)), zLo, zHi);
      if (dotIdx !== zLo && dotIdx !== zHi) bins[dotIdx] += 0.16;
    }
  } else if (state.gradation === "five") {
    for (let s = 0; s < 5; s++) {
      const f = s / 4;
      const z = lerp(zB, zW, f);
      const bias = lerp(darkW, lightW, f);
      const edgeBoost = s === 0 || s === 4 ? 1.18 : 0.74;
      addInRange(z, 0.48, bias * edgeBoost);
    }
  } else {
    // 连续明暗：以调性重心为峰，向黑场与白场平滑铺开
    const peak = lerp(zB, zW, lightW);
    const spread = Math.max(0.85, (zW - zB) * 0.27);
    addInRange(peak, spread, 1.0);
    addInRange(zB, 0.65, darkW * 0.56);
    addInRange(zW, 0.65, lightW * 0.56);
  }

  const maxV = Math.max(...bins, 0.001);
  return bins.map((v, i) => (i < zLo || i > zHi ? 0.03 : clamp(v / maxV, 0.06, 1)));
}

// 由当前三点色阶算出完整光学指标
export function tonalMetrics(state) {
  const { black, white, key } = clampLevels(state.black, state.white, state.key);
  const span = white - black;
  const mid = lerp(black, white, key);
  const darkRgb = levelRgb(black);
  const lightRgb = levelRgb(white);
  const midRgb = levelRgb(mid);
  const ratio = contrastRatio(lightRgb, darkRgb);

  const zLo = Math.round(black * 10);
  const zMid = Math.round(mid * 10);
  const zHi = Math.round(white * 10);
  const lightPct = Math.round(key * 100);
  const darkPct = 100 - lightPct;

  const harshBlack = clamp((0.05 - black) / 0.05, 0, 1);
  const harshWhite = clamp((white - 0.94) / 0.06, 0, 1);
  const harsh = (harshBlack + harshWhite) * 0.5;

  let keyName = "均衡对半";
  if (key >= 0.64) keyName = "高调偏亮";
  else if (key <= 0.36) keyName = "低调偏暗";

  return {
    lo: black,
    hi: white,
    mid,
    span,
    key,
    harsh,
    darkRgb,
    lightRgb,
    midRgb,
    darkHex: rgbHex(darkRgb).toUpperCase(),
    lightHex: rgbHex(lightRgb).toUpperCase(),
    ratio,
    zLo,
    zMid,
    zHi,
    lightPct,
    darkPct,
    zoneLabel: zLo === zHi ? `Zone ${ROMAN[zLo]}` : `Zone ${ROMAN[zLo]}–${ROMAN[zHi]}`,
    keyName,
    histogram: computeHistogram({ ...state, black, white, key }),
  };
}

// 给出「观者会怎么看」的白话解释，不只报数字
export function describeState(state) {
  const m = tonalMetrics(state);
  const rTxt = `${m.ratio.toFixed(1)} : 1`;

  let badge = "均衡清晰";
  let status = "good";
  let title = "";
  let text = "";

  if (m.ratio < 2.4) {
    badge = "发灰失焦";
    status = "weak";
    title = "黑场抬太高、白场压太低，画面塌进一片中灰";
    text =
      "动态范围被挤在窄灰带里，对半圆、斜影与阶梯几乎融成平雾。观者第一眼抓不住入口——把左右两钳向外拉开，骨架才会立刻立起来。";
  } else if (m.ratio < 4.5) {
    badge = "柔和低反差";
    status = "soft";
    title = "氛围轻柔安静，但视觉冲击收着";
    text =
      "适合背景铺底或雾感情绪专题，但对比度低于正文 AA 可读门槛（4.5:1），要传达清晰信息时还需拉深黑场或提亮白场。";
  } else if (m.ratio < 11.5) {
    badge = "舒展层次";
    status = "good";
    title = `${m.keyName}（亮 ${m.lightPct}% / 暗 ${m.darkPct}%），层次分明且温和耐看`;
    text =
      m.key >= 0.64
        ? "亮纸面占了大半，少量深墨像镇纸一样稳住右侧重心，画面通透轻盈、有呼吸感。"
        : m.key <= 0.36
          ? "大片深暗把四周收静，窄幅亮面与阶梯像舞台追光一样跳出来，沉稳且自带悬念。"
          : "明暗已经明确分开，灰阶过渡清楚，兼顾第一眼识别度与长时间观看的舒适感。";
  } else if (m.ratio >= 18.8 || m.harsh > 0.55) {
    badge = "极限纯黑白";
    status = "extreme";
    title = "黑场与白场推到数字极限（近 21:1），力量最硬也最容易刺眼";
    text =
      "远距户外看板或大号标题靠它一秒抢眼；但发光屏幕上长读容易泛起眩光晕边。把两钳轻收到暖纸（Zone IX）与炭墨（Zone I），力量不减却温润得多。";
  } else {
    badge = "海报级力量";
    status = "peak";
    title =
      m.key <= 0.36
        ? "剧场式强明暗，大片暗场托出聚光焦点"
        : m.key >= 0.64
          ? "高调强反差，纸面留白托起锐利墨影"
          : "黑白两极拉开，视觉力量瞬间锁死";
    text =
      state.scene === "split"
        ? "暖纸与炭墨彻底分离，跨在中轴上的反色大圆把左右两半死死扣紧；透视阶梯从暗处递出纵深，整张画一秒就能读清骨架。"
        : state.scene === "chiaroscuro"
          ? "大光比把立体球的明暗交界线刻得锋利，斜影落在地台上，平面圆立刻长出沉甸甸的雕塑体积。"
          : "标题、正文与配图的明度梯队彻底立住，哪怕眯起眼或缩成拇指大小，阅读顺序也丝毫不乱。";
  }

  let note = "";
  if (state.scene === "split") {
    note = state.dot
      ? `当前明暗比 ${m.lightPct}/${m.darkPct}：朱红圆点是全图唯一的色相锚点，视线扫过黑白骨架后会立刻停在它身上。`
      : `当前明暗比 ${m.lightPct}/${m.darkPct}：关掉红点后回归纯黑白结构，左右两半张力更纯粹，少了最后的单点定锚。`;
  } else if (state.gradation === "notan") {
    note = "二值黑白（Notan）省去中间灰，最适合一眼检验版面黑白分布是否站得住。";
  } else if (state.gradation === "five") {
    note = "五阶层次在黑场与白场之间铺出五档清晰明度，呼应海报「由明到暗的过渡」。";
  } else {
    note = "连续明暗保留细腻光影过渡，适合雕塑体积感与摄影级明暗叙事。";
  }

  return { ...m, rTxt, badge, status, title, text, note };
}

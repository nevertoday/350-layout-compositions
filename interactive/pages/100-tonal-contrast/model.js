// 主角控制台状态模型：只存画框比例坐标 (u, v) ∈ [0..1]² 和选项。
//   u（横轴）：明暗反差跨度（0 = 扁平灰雾，0.78 = 原海报暖纸炭墨 16.4:1，0.95+ = 极限纯黑白 21:1）
//   v（纵轴）：画面调性重心（顶部 0 = 高调偏亮，中间 0.5 = 均衡对半，底部 1 = 低调偏暗）
// WebGL 3D 与 2D Canvas 降级版完全共用这份状态与计算。

import { clamp, contrastRatio, lerp, toneRgb } from "./palette.js";

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

// 四个可轻轻吸附的典型明暗定标点（默认海报定标落在 u=0.78，既留足左右拖动余量，又能向右继续拉到纯黑白 21:1）
export const PRESETS = [
  { id: "poster", label: "海报极对比", u: 0.78, v: 0.5 },
  { id: "highkey", label: "高调通透", u: 0.52, v: 0.2 },
  { id: "lowkey", label: "低调剧场", u: 0.74, v: 0.8 },
  { id: "flat", label: "低反差平光", u: 0.16, v: 0.5 },
];

export const SNAP_RADIUS = 0.05;

export function snapPoint(u, v) {
  const cu = clamp(u, 0.06, 0.95);
  const cv = clamp(v, 0.1, 0.9);
  let best = null;
  for (const p of PRESETS) {
    const d = Math.hypot(cu - p.u, cv - p.v);
    if (d < SNAP_RADIUS && (!best || d < best.d)) best = { ...p, d };
  }
  return best ? { u: best.u, v: best.v, preset: best } : { u: cu, v: cv, preset: null };
}

// 由 (u, v) 算出当前画面的亮端明度 hi、暗端明度 lo、中心灰 mid、真实对比度、区域跨度
export function tonalMetrics(u, v) {
  const cu = clamp(u, 0, 1);
  // 0..0.78 映射到海报暖纸与炭墨的全部跨度（0..1）；0.78..0.95 继续推向纯白 #fff 与纯黑 #000（21:1）
  const span = clamp(cu / 0.78, 0, 1);
  const harsh = clamp((cu - 0.78) / 0.17, 0, 1);

  const center = lerp(0.76, 0.24, clamp(v, 0, 1));
  const half = span * 0.52;
  let lo = center - half;
  let hi = center + half;
  if (lo < 0) {
    hi = Math.min(1, hi - lo);
    lo = 0;
  }
  if (hi > 1) {
    lo = Math.max(0, lo - (hi - 1));
    hi = 1;
  }
  lo = clamp(lo, 0, 1);
  hi = clamp(hi, 0, 1);
  const mid = (lo + hi) * 0.5;

  const baseLight = toneRgb(hi);
  const baseDark = toneRgb(lo);
  const lightRgb = baseLight.map((c) => Math.round(lerp(c, 255, harsh)));
  const darkRgb = baseDark.map((c) => Math.round(lerp(c, 0, harsh)));
  const ratio = contrastRatio(lightRgb, darkRgb);

  const zLo = Math.round(lo * 10);
  const zHi = Math.round(hi * 10);
  const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

  let keyName = "均衡对半";
  if (v < 0.34) keyName = "高调偏亮";
  else if (v > 0.66) keyName = "低调偏暗";

  return {
    lo,
    hi,
    mid,
    span,
    harsh,
    lightRgb,
    darkRgb,
    ratio,
    zLo,
    zHi,
    zoneLabel: zLo === zHi ? `Zone ${ROMAN[zLo]}` : `Zone ${ROMAN[zLo]}–${ROMAN[zHi]}`,
    keyName,
  };
}

// 给出「观者会怎么看」的白话解释，不只报数字
export function describeState(state) {
  const m = tonalMetrics(state.u, state.v);
  const rTxt = `${m.ratio.toFixed(1)} : 1`;

  let badge = "均衡清晰";
  let status = "good";
  let title = "";
  let text = "";

  if (m.ratio < 2.2) {
    badge = "发灰失焦";
    status = "weak";
    title = "画面塌进中灰，视线抓不住锚点";
    text =
      "亮部和暗部离得太近，圆体、阶梯和斜影几乎融成一片平雾。观者第一眼不知道该往哪儿落——哪怕图形再讲究，没有明暗差就立不起来。";
  } else if (m.ratio < 4.5) {
    badge = "柔和低反差";
    status = "soft";
    title = "情绪克制温柔，但冲击力收着";
    text =
      "画面的氛围安静、像雾中建筑，适合背景或情绪大片；但若承载正文信息，已低于可读门槛（4.5:1），重点元素需要额外提亮或压暗。";
  } else if (m.ratio < 11) {
    badge = "舒展层次";
    status = "good";
    title = `${m.keyName}，层次清楚又不过于刺眼`;
    text =
      state.v < 0.34
        ? "亮面积占优，画面轻盈透亮，少量暗部就能充当视线支点，适合简洁开阔的版面。"
        : state.v > 0.66
          ? "大片深暗把四周收静，少量亮面像舞台追光一样跳出来，沉稳而有悬念。"
          : "明暗已经拉开，过渡阶梯清晰可辨，文字和主体都能一眼读清，适合兼顾冲击力与耐看度的版式。";
  } else if (m.harsh > 0.45) {
    badge = "极限纯黑白";
    status = "extreme";
    title = "推到数字纯黑白（近 21:1），力量最硬也最容易刺眼";
    text =
      "远距离看板或极短标题能靠它一秒抢眼；但放进发光屏幕长读时，纯白会泛起眩光晕边。向左轻收回到暖纸炭墨（约 16:1），力量几乎不减，纸感温和得多。";
  } else {
    badge = "海报级力量";
    status = "peak";
    title = state.v > 0.66 ? "剧场式强明暗，焦点像一束聚光灯" : "黑白两极拉开，视觉力量瞬间锁死";
    text =
      state.scene === "split"
        ? "暖纸与炭墨彻底分离，跨越中轴的对半圆把左右死死锁成一体；阶梯从深暗里一步步递出纵深，整个画面一秒就能看清骨架。"
        : state.scene === "chiaroscuro"
          ? "强烈光比把球体的明暗交界线刻得锋利，投影斜劈地面，平面圆盘立刻长出沉甸甸的雕塑体积。"
          : "标题、正文与主体图形的明度梯队彻底立住，哪怕眯起眼或缩到拇指大小，层级依然一眼读清。";
  }

  const extras = [];
  if (state.scene === "split") {
    extras.push(
      state.dot
        ? "朱红圆点落在亮半圆内，是全图唯一的色相与小面积焦点，眼睛扫过黑白大骨架后会立刻停在它上面。"
        : "关掉红点后，画面回归纯粹黑白结构，左右两半张力更均等，但视线少了最后的定锚点。",
    );
  } else if (state.gradation === "notan") {
    extras.push("当前处于二值黑白（Notan），去掉一切中间灰，最适合检验版面大结构是否站得住。");
  } else if (state.gradation === "five") {
    extras.push("当前切为五阶层次，亮面、灰面、明暗交界与投影一层一层排开，呼应海报「由明到暗的过渡」。");
  } else {
    extras.push("连续明暗保留平滑过渡，体积更柔和自然，适合光影雕塑与摄影叙事。");
  }

  return { ...m, rTxt, badge, status, title, text, note: extras.join("") };
}

// 316 深远法 · 单一真源状态与几何/光学测算模块
// 所有画布渲染、Z 轴剖面轨、读数与诊单均只读取本模块算出的投影几何与光学数据。

export const INITIAL_BROKEN = Object.freeze({
  theme: "poster",        // "poster" | "song" | "garden"
  gates: 5,               // 2 | 4 | 5 | 7
  depthSpan: 0.14,        // 0.08 .. 1.00（开场压扁在 14% 浅层）
  attenuation: "flat",    // "flat" | "recede" | "mist" | "inverted" | "blackout"
  channel: "blocked",     // "blocked" | "aligned" | "offset" | "chaotic"
  vista: "void",          // "void" | "moon" | "glare"
  guides: true,           // 是否显示青蓝激光测绘线
  peekX: 0,               // -1 .. 1 轻微探身视差（仅视觉窥探，不改变结构合法性）
});

export const PRESET_POSTER = Object.freeze({
  theme: "poster",
  gates: 5,
  depthSpan: 0.66,
  attenuation: "recede",
  channel: "aligned",
  vista: "moon",
  guides: true,
  peekX: 0,
});

export const THEMES = Object.freeze({
  poster: {
    id: "poster",
    label: "原海报重门",
    en: "ARCHITECTURAL ENFILADE",
    vistaName: "青月远山",
    blockerLabel: "第 3 重实墙堵死",
  },
  song: {
    id: "song",
    label: "北宋重峦",
    en: "SONG OVERLAPPING PEAKS",
    vistaName: "幽谷远阁",
    blockerLabel: "中景岩壁封谷",
  },
  garden: {
    id: "garden",
    label: "江南漏窗",
    en: "GARDEN MOON-GATES",
    vistaName: "竹影月洞",
    blockerLabel: "照壁截断视廊",
  },
});

export const SWEET = Object.freeze({
  depthMin: 0.42,
  depthMax: 0.85,
  gatesValid: [4, 5],
  farWidthMinPct: 10,
  farWidthMaxPct: 28,
  clearMinPct: 55,
});

// 线性插值工具
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixRgb(a, b, t) {
  const c = clamp(t, 0, 1);
  return [
    Math.round(lerp(a[0], b[0], c)),
    Math.round(lerp(a[1], b[1], c)),
    Math.round(lerp(a[2], b[2], c)),
  ];
}

export function rgbCss(rgb, alpha = 1) {
  return alpha >= 0.999
    ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
    : `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha.toFixed(3)})`;
}

// 计算相对亮度（0..100 标度）
function relLumPct([r, g, b]) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return (0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)) * 100;
}

// 根据主题与明暗模式生成每一重门框的色值与实测亮度
function sampleGateColors(t, attenuation, theme) {
  // 基准色取自 316 原海报像素实采
  const ivoryBright = hexToRgb("#E7DBC4");
  const stoneWarm = hexToRgb("#C8B8A2");
  const stoneMid = hexToRgb("#6B7377");
  const slateDeep = hexToRgb("#213547");
  const inkDeep = hexToRgb("#10202D");
  const voidInk = hexToRgb("#07131E");
  const mistFront = theme === "song" ? hexToRgb("#182B3A") : hexToRgb("#1B2D3C");
  const mistMid = theme === "song" ? hexToRgb("#3D6274") : hexToRgb("#446A7B");
  const mistFar = theme === "song" ? hexToRgb("#7FB0BE") : hexToRgb("#86B6C4");
  const glareRear = hexToRgb("#F7F1E3");

  let face;
  let innerBevel;
  let floorBar;

  if (attenuation === "flat") {
    // 全部几乎同亮暖石，前后无退远阶差
    face = mixRgb(ivoryBright, hexToRgb("#DED2BB"), t * 0.25);
    innerBevel = mixRgb(hexToRgb("#CFC1AA"), hexToRgb("#C6B9A3"), t * 0.25);
    floorBar = mixRgb(hexToRgb("#E5D9C2"), hexToRgb("#DDD0B8"), t * 0.2);
  } else if (attenuation === "recede") {
    // 忠实复刻 316 原海报：前暖亮石 → 中灰石 → 深蓝重晦
    if (t < 0.35) {
      face = mixRgb(ivoryBright, stoneWarm, t / 0.35);
    } else if (t < 0.68) {
      face = mixRgb(stoneWarm, stoneMid, (t - 0.35) / 0.33);
    } else {
      face = mixRgb(stoneMid, slateDeep, (t - 0.68) / 0.32);
    }
    innerBevel = mixRgb(hexToRgb("#9B8E7F"), inkDeep, Math.pow(t, 0.82));
    floorBar = mixRgb(hexToRgb("#E5D9C2"), hexToRgb("#466474"), Math.pow(t, 0.85));
  } else if (attenuation === "mist") {
    // 烟岚递淡（空气透视合法解：前浓重实 → 后淡青低对比）
    if (t < 0.5) {
      face = mixRgb(mistFront, mistMid, t * 2);
    } else {
      face = mixRgb(mistMid, mistFar, (t - 0.5) * 2);
    }
    innerBevel = mixRgb(hexToRgb("#10202C"), hexToRgb("#638E9E"), t);
    floorBar = mixRgb(hexToRgb("#3A5869"), hexToRgb("#9ECAD5"), t);
  } else if (attenuation === "inverted") {
    // 前暗后刺：前门沉暗、后门骤亮抢跳
    face = mixRgb(hexToRgb("#1B2834"), glareRear, Math.pow(t, 0.9));
    innerBevel = mixRgb(hexToRgb("#0D1823"), hexToRgb("#D8CEBD"), t);
    floorBar = mixRgb(hexToRgb("#263544"), glareRear, t);
  } else {
    // blackout：第 2 重后急坠死黑，中景断档
    face = t < 0.08 ? ivoryBright : mixRgb(hexToRgb("#11202D"), voidInk, Math.min(1, (t - 0.08) * 2.2));
    innerBevel = t < 0.08 ? hexToRgb("#8A7E70") : voidInk;
    floorBar = t < 0.08 ? hexToRgb("#D5C8B0") : hexToRgb("#0A1723");
  }

  return {
    face,
    innerBevel,
    floorBar,
    lum: relLumPct(face),
  };
}

// 主单真源解算：输入 state，产出精确投影门框数组、视线净通道、光学阶差与四柱验收诊单
export function evaluate(state) {
  const count = state.gates;
  const span = clamp(state.depthSpan, 0.08, 1.0);
  const crowdBoost = count >= 7 ? 1.16 : 1.0;

  // 真实透视 Z 深度范围（z=1.0 为第一重门）
  const zNear = 1.0;
  const zFar = (1.0 + 0.18 + Math.pow(span, 1.42) * 5.65) * crowdBoost;
  const zVista = zFar * (1.14 + span * 0.14);

  // 基础外框在 z=1 处占画布的比例（忠实 316 原海报方拱比例）
  const baseOuterW = 0.80;
  const baseOuterH = 0.82;
  const wallRatio = 0.125; // 单侧门柱厚度占外框宽比例
  const vpX = 0.50 + (state.peekX || 0) * 0.035;
  const vpY = 0.565; // 略偏下的建筑视平线，让地面光带与顶部过梁自然展开

  const blockerIndex = count >= 3 ? Math.floor(count / 2) : -1;
  const chaoticPattern = [-0.145, 0.155, -0.14, 0.135, -0.11, 0.12, -0.09];

  const layers = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    // 门框沿 Z 轴等物理间隔排列，透视投影自然产生 1/z 步距疏密
    const z = lerp(zNear, zFar, t);
    const scale = 1 / z;

    let shiftX = 0;
    if (state.channel === "offset") {
      // 柔和 S 形幽窥：中景轻错半步，依然保留清晰贯通的中心视窗
      shiftX = Math.sin(t * Math.PI) * 0.034 * (i % 2 === 0 ? 1 : -0.65);
    } else if (state.channel === "chaotic") {
      shiftX = chaoticPattern[i % chaoticPattern.length] * (0.65 + 0.35 * (1 - t));
    }

    const cx = vpX + shiftX;
    const outerW = baseOuterW * scale;
    const outerH = baseOuterH * scale;
    // 顶部略高、底缘落向透视地板
    const outerTop = vpY - outerH * 0.58;
    const outerBot = vpY + outerH * 0.42;
    const outerLeft = cx - outerW / 2;
    const outerRight = cx + outerW / 2;

    const pillarW = outerW * wallRatio;
    const lintelH = outerH * 0.115;

    const innerLeft = outerLeft + pillarW;
    const innerRight = outerRight - pillarW;
    const innerTop = outerTop + lintelH;
    const innerBot = outerBot;
    const innerW = innerRight - innerLeft;
    const innerH = innerBot - innerTop;

    const colors = sampleGateColors(t, state.attenuation, state.theme);
    const isBlocked = state.channel === "blocked" && i === blockerIndex;

    layers.push({
      index: i,
      t,
      z,
      scale,
      cx,
      shiftX,
      outerLeft,
      outerRight,
      outerTop,
      outerBot,
      outerW,
      outerH,
      innerLeft,
      innerRight,
      innerTop,
      innerBot,
      innerW,
      innerH,
      pillarW,
      lintelH,
      isBlocked,
      ...colors,
    });
  }

  // 尽头远窗矩形（位于最后一重门之后）
  const vistaScale = 1 / zVista;
  const vistaW = baseOuterW * (1 - wallRatio * 2) * vistaScale;
  const vistaH = baseOuterH * 0.885 * vistaScale;
  const vistaCx = vpX + (state.channel === "offset" ? 0.012 : 0);
  const vistaRect = {
    cx: vistaCx,
    left: vistaCx - vistaW / 2,
    right: vistaCx + vistaW / 2,
    top: vpY - vistaH * 0.54,
    bot: vpY + vistaH * 0.46,
    w: vistaW,
    h: vistaH,
    z: zVista,
  };

  // 由真实各层投影内框算出：有效贯通视窗区间 [clearLeft, clearRight]
  let clearLeft = 0;
  let clearRight = 1;
  let blocked = false;
  for (const g of layers) {
    if (g.isBlocked) {
      blocked = true;
      break;
    }
    clearLeft = Math.max(clearLeft, g.innerLeft);
    clearRight = Math.min(clearRight, g.innerRight);
  }
  const lastInnerW = layers[layers.length - 1].innerW;
  const clearW = blocked ? 0 : Math.max(0, clearRight - clearLeft);
  const clearPct = Math.round(clamp(clearW / Math.max(0.001, lastInnerW), 0, 1) * 100);

  // 近远框宽比与远窗占画幅宽
  const nearFarRatio = layers[0].innerW / Math.max(0.001, lastInnerW);
  const farWindowPct = Math.round(lastInnerW * 100);

  // 相邻门框实测明度梯度
  const lumFirst = layers[0].lum;
  const lumLast = layers[layers.length - 1].lum;
  const lumDelta = Math.round(lumFirst - lumLast); // 正值=前明后晦，负值=前暗后亮
  let minMidStep = 999;
  for (let i = 1; i < layers.length; i++) {
    const step = Math.abs(layers[i].lum - layers[i - 1].lum);
    if (i >= 2 && step < minMidStep) minMidStep = step;
  }
  if (minMidStep === 999) minMidStep = Math.abs(lumDelta);

  // 四大核心支柱校验（多组合法解，绝非死板单一按钮）
  const depthShallow = span < SWEET.depthMin;
  const depthPinhole = span > SWEET.depthMax || farWindowPct < SWEET.farWidthMinPct;
  const gatesTooFew = count < 4;
  const gatesTooMany = count > 5;
  const advanceOk = !depthShallow && !depthPinhole && !gatesTooFew && !gatesTooMany;

  const toneOk = state.attenuation === "recede" || state.attenuation === "mist";
  const channelOk = !blocked && clearPct >= SWEET.clearMinPct && state.channel !== "chaotic";
  const vistaOk = state.vista === "moon";

  const pillars = {
    advance: {
      ok: advanceOk,
      tag: gatesTooFew
        ? `${count} 重断层`
        : gatesTooMany
        ? `${count} 重过密`
        : depthShallow
        ? `仅 ${Math.round(span * 100)}% 贴扁`
        : depthPinhole
        ? `远窗 ${farWindowPct}% 针孔`
        : `${count} 重 · ${nearFarRatio.toFixed(1)}×`,
    },
    recession: {
      ok: toneOk,
      tag:
        state.attenuation === "flat"
          ? `明度差 ${Math.abs(lumDelta)} 同亮`
          : state.attenuation === "inverted"
          ? "前暗后刺倒挂"
          : state.attenuation === "blackout"
          ? "中段死黑吞层"
          : state.attenuation === "mist"
          ? "烟岚递淡达标"
          : `前明后晦 差${Math.abs(lumDelta)}`,
    },
    inward: {
      ok: channelOk,
      tag: blocked
        ? "中门堵死 0%"
        : state.channel === "chaotic"
        ? `错位仅透 ${clearPct}%`
        : state.channel === "offset"
        ? `曲径幽窥 ${clearPct}%`
        : "正轴贯通 100%",
    },
    vista: {
      ok: vistaOk,
      tag:
        state.vista === "void"
          ? "尽头死黑空洞"
          : state.vista === "glare"
          ? "远景炸亮压前"
          : `${THEMES[state.theme].vistaName}落点`,
    },
  };

  const score = [advanceOk, toneOk, channelOk, vistaOk].filter(Boolean).length;

  // 定性纵深档位（不做虚假百分比精确度）
  let depthGrade = "贴扁（示意）";
  if (score === 4) depthGrade = "幽深贯通（经验带）";
  else if (depthPinhole || gatesTooMany) depthGrade = "过挤窒息（示意）";
  else if (blocked || state.channel === "chaotic") depthGrade = "中段受阻（示意）";
  else if (advanceOk && toneOk) depthGrade = "初具进深（示意）";
  else if (!depthShallow) depthGrade = "浅层未成（示意）";

  // 优先级明晰的 9 类错误白话诊单
  let diag;
  if (gatesTooFew) {
    diag = {
      kind: "warn",
      badge: "错态 · 层数断层",
      title: `只有 ${count} 重门框，前后之间空成一大段`,
      body: `深远法靠层层递进搭建视觉台阶。现在从第 1 重直接跳到最深处，中景没有过渡框替眼睛丈量距离，远处显得突兀而不是“走进去”的。`,
      action: "把重门层数调到 4 重或 5 重，补上中景的递进台阶。",
    };
  } else if (gatesTooMany) {
    diag = {
      kind: "warn",
      badge: "错态 · 层数过密",
      title: `堆进 ${count} 重门框，画面挤成细碎条纹`,
      body: `不是层越多就越深。${count} 重门把门柱压得太窄、尽头远窗只剩 ${farWindowPct}% 宽度，眼睛在密集边缘里打转，纵深感反倒变成眩晕压迫。`,
      action: "把重数收回 4 重或 5 重，每道门留出清晰的呼吸面。",
    };
  } else if (depthShallow) {
    diag = {
      kind: "warn",
      badge: "错态 · 门框贴扁",
      title: `纵深展幅只有 ${Math.round(span * 100)}%，五道门贴成一面平墙`,
      body: `近景到远景的门洞宽比仅 ${nearFarRatio.toFixed(2)}×（经验参考带约 2.8×–6.5×），门框彼此紧贴像平面套框，视线一步就撞到尽头，根本没有“步步深入”的空间进程。`,
      action: "向右拖动顶部「Z 轴重门剖面轨」（或直接在主画框右滑），把门框拉进 42%–85% 经验纵深带。",
    };
  } else if (depthPinhole) {
    diag = {
      kind: "warn",
      badge: "错态 · 井底针孔",
      title: `拉得太狠，尽头门洞缩成了 ${farWindowPct}% 的细针孔`,
      body: `把纵深展幅拉过 85% 后，远端门洞比缩到 ${nearFarRatio.toFixed(1)}×、宽仅占画幅 ${farWindowPct}%。过极端的隧道效应会带来井底偷窥般的压迫感，远景细节也被压没。`,
      action: "往左略收「Z 轴重门剖面轨」，把纵深展幅停回 42%–85% 之间，让远窗保有 11%–25% 的呼吸宽度。",
    };
  } else if (state.attenuation === "flat") {
    diag = {
      kind: "warn",
      badge: "错态 · 前后同亮",
      title: `五重门框亮度几乎一样（ΔL 仅 ${Math.abs(lumDelta)}），大脑读成平面线框`,
      body: `几何尺寸虽然缩小了，但从近到远都涂着同样的暖石亮色，缺少郭熙所说的「深远之色重晦」或空气散射衰减——前后层次互相粘平，立体感丢掉一半。`,
      action: "在明暗衰减里切到「前明后晦」（原海报重门退暗）或「烟岚递淡」（山水空气透视）。",
    };
  } else if (state.attenuation === "inverted") {
    diag = {
      kind: "warn",
      badge: "错态 · 前暗后刺",
      title: `深处门框反而比近处更亮更硬，前后景倒挂打架`,
      body: `视觉里高反差、高明度的硬边缘会本能地往前跳。现在前门发暗、后门骤亮，大脑同时收到“缩小=更远”和“跳亮=更近”两个相反信号，空间直接翻车。`,
      action: "把明暗衰减改为顺畅单调的「前明后晦」或低对比的「烟岚递淡」。",
    };
  } else if (state.attenuation === "blackout") {
    diag = {
      kind: "warn",
      badge: "错态 · 中段吞黑",
      title: `第 2 重之后亮度急坠死黑，中景台阶全被吞掉`,
      body: `重晦不是一黑到底。中段门框之间亮度差掉到 ${Math.round(minMidStep)}，退远阶梯在半路彻底隐身，眼睛只能看到孤零零的第一道框，看不到“层层后退”。`,
      action: "改用渐进的「前明后晦」或「烟岚递淡」，让每一重中景门框都保留可辨轮廓。",
    };
  } else if (blocked) {
    diag = {
      kind: "warn",
      badge: "错态 · 中门堵死",
      title: `${THEMES[state.theme].blockerLabel}，视线在半路硬生生撞墙`,
      body: `深远法最怕“有层无路”。第 ${blockerIndex + 1} 重门洞被实墙封死，通道穿透率跌到 0%，目光进到中景就被挡回，永远走不到后方的远景空间。`,
      action: "点击画布里的红色堵墙（或在通道里选「正轴套框」/「曲径幽窥」），打通向内视廊。",
    };
  } else if (state.channel === "chaotic") {
    diag = {
      kind: "warn",
      badge: "错态 · 错位断路",
      title: `各重门框左右乱晃，贯通视窗只剩 ${clearPct}%`,
      body: `深远允许柔和曲折，但不能让前门实壁把后门洞口遮死。现在各层门轴彼此错开过猛，有效透视窗塌陷到不足 55%，视线在左右墙面间不断折断。`,
      action: "把通道收束为「正轴套框」（对称贯通）或「曲径幽窥」（轻错半步但留足通道）。",
    };
  } else if (state.vista === "void") {
    diag = {
      kind: "warn",
      badge: "错态 · 尽头空洞",
      title: `重门都已排稳，但通道尽头是一片死黑空洞`,
      body: `视线好不容易穿过 ${count} 重门框走进最深处，却落在一无所有的黑暗里，没有停泊点。海报之所以在尽头放一轮微亮青月与远山，正是为了给目光一个“可望可入”的归宿。`,
      action: `将尽头落点切为「${THEMES[state.theme].vistaName}」，点亮深处的视觉归宿。`,
    };
  } else if (state.vista === "glare") {
    diag = {
      kind: "warn",
      badge: "错态 · 远景炸亮",
      title: `尽头强光炸白喧宾夺主，把前中景重门压扁了`,
      body: `远景落点应当克制柔和，让眼睛“穿过去”再“停下来”。现在尽头光团过亮过猛，视线一进画面就被强光拉死，完全跳过前中景的层层递进节奏。`,
      action: `把尽头落点调回克制微亮的「${THEMES[state.theme].vistaName}」。`,
    };
  } else {
    const toneDesc = state.attenuation === "mist" ? "烟岚空气透视递淡" : "前明后晦逐层退暗";
    const chDesc = state.channel === "offset" ? "曲径幽窥微错贯通" : "正轴重门直贯远窗";
    diag = {
      kind: "ok",
      badge: "已成深 · 4 / 4 达标",
      title: `${count} 重递进 + ${toneDesc} + ${chDesc}`,
      body: `近远门洞比 ${nearFarRatio.toFixed(1)}×、远窗占宽 ${farWindowPct}%、通道穿透 ${clearPct}%。目光顺着前框进入，踩着 1/z 地面节奏穿过每一重门洞，最终自然停在远处的${THEMES[state.theme].vistaName}。`,
      action: "试试切换顶部三种题材，或把纵深拖过 86% 亲眼看「井底针孔」何时出现。",
    };
  }

  return {
    layers,
    vistaRect,
    vpX,
    vpY,
    zNear,
    zFar,
    zVista,
    clearLeft,
    clearRight,
    clearPct,
    nearFarRatio,
    farWindowPct,
    lumDelta,
    minMidStep,
    pillars,
    score,
    depthGrade,
    diag,
    blockerIndex,
  };
}

// 第 03 节「重晦与烟岚」色阶切片单真源数据
export function evaluateTonalLab(mode, slope) {
  // mode: "corridor"（室内重门前明后晦） | "landscape"（山水烟岚前浓后淡）
  // slope: 0 .. 100（衰减坡度）
  const s = clamp(slope, 0, 100) / 100;
  const labels = ["第 1 重 · 近景", "第 2 重 · 前中", "第 3 重 · 中景", "第 4 重 · 远中", "第 5 重 · 远景"];
  const stops = [];
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    let rgb;
    if (mode === "corridor") {
      const target = mixRgb(hexToRgb("#E7DBC4"), hexToRgb("#10202D"), Math.pow(t, 0.92) * s);
      rgb = target;
    } else {
      const target = mixRgb(hexToRgb("#142432"), hexToRgb("#A7CDD7"), Math.pow(t, 0.88) * s);
      rgb = target;
    }
    const lum = Math.round(relLumPct(rgb));
    stops.push({
      label: labels[i],
      rgb,
      css: rgbCss(rgb),
      lum,
      textDark: lum > 18,
    });
  }
  const spanLum = Math.abs(stops[0].lum - stops[4].lum);
  let verdict;
  if (s < 0.28) {
    verdict = {
      status: "偏平",
      ok: false,
      text: `首尾明度差只有 ${spanLum}，五层几乎挤在同一条灰线上。没有明暗阶差，眼睛很难把前后分离开。`,
    };
  } else if (s > 0.92) {
    verdict = {
      status: "略急",
      ok: true,
      text: `首尾明度差拉满到 ${spanLum}，层次极鲜明；若用于多字版面，需留意中后景是否对比过强或过暗。`,
    };
  } else {
    verdict = {
      status: "层次清晰（经验带）",
      ok: true,
      text:
        mode === "corridor"
          ? `前门暖石明亮、逐层沉入深海蓝灰（首尾差 ${spanLum}），正是原海报与郭熙「深远之色重晦」的室内廊道写法。`
          : `近山墨色沉实、远山借空气散射渐入青岚（首尾差 ${spanLum}），符合宋代山水与达·芬奇空气透视规律。`,
    };
  }
  return { stops, spanLum, verdict };
}

// 第 06 节小练习真源答案（四选一，每项仅差单一变量）
export const QUIZ_OPTIONS = Object.freeze({
  A: {
    correct: false,
    short: "缺明度重晦衰减",
    title: "方案 A · 几何缩小了，但前后明度粘成同一平面",
    detail:
      "五重门框虽然按透视逐层缩小，却全部涂着完全一致的浅米石色（ΔL 接近 0）。缺少从明到晦的光学衰减后，人眼会把它读成贴在墙上的五个同心相框，而不是往深处退去的建筑廊道。",
  },
  B: {
    correct: true,
    short: "缩尺、重晦与贯通三者兼备",
    title: "选对了：方案 B 把视线稳稳带进深处",
    detail:
      "五重门框由近到远稳步缩尺，明度从暖石象牙逐层沉入深海蓝灰，地面光带按 1/z 近宽远窄递进，中轴敞通直达微亮的青月远山。每一项深度线索都在朝同一个方向发力。",
  },
  C: {
    correct: false,
    short: "中景实墙截断视线通道",
    title: "方案 C · 缩尺和明度都对，但第 3 重门洞被半腰堵死",
    detail:
      "深远法的关键是“可穿透的视通道”。方案 C 的前两重门造势很足，却在中景插进一道实墙挡住通道下半截，视线走到一半被迫折返，无法顺畅落到远处的月窗。",
  },
  D: {
    correct: false,
    short: "层数过密缩成井底针孔",
    title: "方案 D · 硬塞 9 重密框，把远窗挤成不足 5% 的针孔",
    detail:
      "很多人误以为“门框越多就越深”。方案 D 堆了 9 重细碎框架，通道过急收束成针孔隧道，密集竖线彼此抢戏，带来的是紧逼压迫感而不是沉静开阔的纵深空间。",
  },
});

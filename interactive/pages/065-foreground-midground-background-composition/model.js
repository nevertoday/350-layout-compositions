// 单一真源（model.js）：
// 3D 多平面舞台、WebGL 降级 2D 舞台、三色调控带和白话诊单全部读取本文件算出的同一组几何与亮度数。

import { PALETTE, mixHex, contrastRatio } from "./palette.js";

export const SCENES = {
  poster: {
    id: "poster",
    name: "原海报山居",
    fgLabel: "深松叶丛与暗灌木",
    midLabel: "钢青蓝丘陵、小径与山居小屋",
    bgLabel: "雾灰远山、暖云与浅金日轮",
    heroBox: { x0: 0.44, y0: 0.42, x1: 0.80, y1: 0.86 }, // 中景核心区（小径+树+小屋）
    skyHex: PALETTE.creamTop,
    fgBaseHex: PALETTE.fgLeafDark,
    midBaseHex: PALETTE.midHillDeep,
    bgRawDarkHex: "#153C38", // 空气退让为 0% 时，远山发黑硬抢的底色
    bgIdealHex: PALETTE.bgPeakNear,
  },
  boat: {
    id: "boat",
    name: "林径孤舟",
    fgLabel: "近岸芦苇与松枝",
    midLabel: "湖中木舟、水纹与背影船夫",
    bgLabel: "对岸雾峰与落日水天",
    heroBox: { x0: 0.38, y0: 0.50, x1: 0.70, y1: 0.84 },
    skyHex: "#F2E6D2",
    fgBaseHex: "#0B3228",
    midBaseHex: "#244C6E",
    bgRawDarkHex: "#163A3B",
    bgIdealHex: "#9BB5C8",
  },
  alley: {
    id: "alley",
    name: "街巷灯影",
    fgLabel: "近处石拱门柱与暗檐",
    midLabel: "青石巷道、暖灯招牌与行人背影",
    bgLabel: "巷尾淡雾钟楼与夜暮天光",
    heroBox: { x0: 0.36, y0: 0.38, x1: 0.68, y1: 0.86 },
    skyHex: "#EFE4D1",
    fgBaseHex: "#0C2D24",
    midBaseHex: "#2B5279",
    bgRawDarkHex: "#16383E",
    bgIdealHex: "#9DB2C4",
  },
};

export const FG_LAYOUTS = {
  center: { id: "center", label: "居中堵门" },
  flank: { id: "flank", label: "双侧让路" },
  corner: { id: "corner", label: "单侧压角" },
};

export const FOCUS_MODES = {
  flat: { id: "flat", label: "全层平权" },
  mid: { id: "mid", label: "焦落中景" },
  fg: { id: "fg", label: "焦落前景" },
  bg: { id: "bg", label: "焦落背景" },
};

// 开场刻意停在 0/4 翻车错态：前景巨大且居中堵住小屋、三层 Z 距压扁、远山黑硬反抢、焦点平权
export const BROKEN_STATE = {
  scene: "poster",
  fgScale: 0.86,      // 0..1 控制前景真实面积（0.86 时覆盖约 46% 画面且大面积堵住中景）
  fgLayout: "center", // center | flank | corner
  depthSpan: 0.06,    // 0..1.5（物理景片 Z 轴间距）
  atmoFade: 0.12,     // 0..1（0=远山死黑硬抢，0.68=原海报柔和雾蓝，0.98=淡到融进天空消失）
  focusMode: "flat",  // flat | mid | fg | bg
  camYaw: 12,         // -42..42 度（开场微斜露玻璃厚边，拖画布可平滑甩至 ±42° 拆层）
  sightPulse: 0,      // >0 时播放 1->2->3 视线光轨
};

// 标准参考解之一（供「复原错态」对比或自检，不在开场自动套用）
export const POSTER_IDEAL_STATE = {
  scene: "poster",
  fgScale: 0.44,
  fgLayout: "flank",
  depthSpan: 0.82,
  atmoFade: 0.68,
  focusMode: "mid",
  camYaw: 0,
};

export function createInitialState() {
  return { ...BROKEN_STATE };
}

// 依据当前状态实时算出三层实绘色值（供 artwork.js 与对比度核算共用）
export function computeLayerColors(state) {
  const sc = SCENES[state.scene] || SCENES.poster;
  const sky = sc.skyHex;

  // 背景远山随 atmoFade 在「死黑硬抢 -> 原海报柔和雾蓝 -> 几乎消失的淡米纸」间连续变化
  let bgNear, bgFar;
  if (state.atmoFade <= 0.68) {
    const t = state.atmoFade / 0.68;
    bgNear = mixHex(sc.bgRawDarkHex, sc.bgIdealHex, t);
    bgFar = mixHex(mixHex(sc.bgRawDarkHex, sc.midBaseHex, 0.28), PALETTE.bgPeakFar, t);
  } else {
    const t = (state.atmoFade - 0.68) / 0.32;
    bgNear = mixHex(sc.bgIdealHex, sky, t * 0.94);
    bgFar = mixHex(PALETTE.bgPeakFar, sky, t * 0.96);
  }

  // 中景在空气退让极低时发黑靠前，正常区保持清澈钢青蓝，焦落背景或平权时按焦段微调对比
  const midDarkPull = state.atmoFade < 0.25 ? (0.25 - state.atmoFade) * 0.45 : 0;
  let midDeep = mixHex(sc.midBaseHex, sc.fgBaseHex, midDarkPull);
  let midLight = mixHex(PALETTE.midHillLight, sc.midBaseHex, midDarkPull * 0.8);
  let midTree = mixHex(PALETTE.midTree, sc.midBaseHex, midDarkPull * 0.6);

  // 前景在正常情况下沉实饱满
  let fgDeep = sc.fgBaseHex;
  let fgMid = PALETTE.fgLeafMid;

  // 若用户选择「焦落中景」，前景略柔一点、中景小屋与轮廓更锐利；若「焦落背景」，前中景明显虚淡
  if (state.focusMode === "bg") {
    fgDeep = mixHex(fgDeep, sky, 0.22);
    midDeep = mixHex(midDeep, sky, 0.25);
  } else if (state.focusMode === "flat") {
    // 平权态下三层边界硬朗、色相接近
    midDeep = mixHex(midDeep, fgDeep, 0.22);
  }

  return { sky, fgDeep, fgMid, midDeep, midLight, midTree, bgNear, bgFar };
}

// 用归一化画布坐标 (u in [0,1], v in [0,1]) 精确描述前景灌木与叶片轮廓多边形
// artwork.js 和本文件遮挡率/占比采样读的是同一组几何包络！
export function getForegroundBlobs(state) {
  const s = Math.max(0, Math.min(1, state.fgScale));
  if (s < 0.02) return [];

  // 包络按椭圆/扇形圆簇建模，确保 2D/3D 绘图和面积/遮挡积分完全同源
  const blobs = [];
  if (state.fgLayout === "flank") {
    // 原海报经典双侧让路：左侧斜展松叶簇 + 右下圆润暗灌木，中路留给小径和小屋
    const lw = 0.14 + s * 0.32;
    const lh = 0.22 + s * 0.44;
    blobs.push({ kind: "fan", cx: 0.02, cy: 1.02, rx: lw, ry: lh, side: "left" });
    const rw = 0.16 + s * 0.34;
    const rh = 0.14 + s * 0.34;
    blobs.push({ kind: "bush", cx: 0.94, cy: 1.02, rx: rw, ry: rh, side: "right" });
    blobs.push({ kind: "bush", cx: 0.78 + (1 - s) * 0.12, cy: 1.04, rx: rw * 0.68, ry: rh * 0.68, side: "right2" });
  } else if (state.fgLayout === "corner") {
    // 单侧压角（古典推远法 Repoussoir）：仅左下大簇松叶与灌木压角，右半中景完全敞开
    const lw = 0.18 + s * 0.44;
    const lh = 0.26 + s * 0.56;
    blobs.push({ kind: "fan", cx: 0.04, cy: 1.02, rx: lw, ry: lh, side: "left" });
    blobs.push({ kind: "bush", cx: 0.18, cy: 1.05, rx: lw * 0.62, ry: lh * 0.44, side: "left2" });
  } else {
    // 居中堵门错态：茂密高大的叶丛和灌木直接横亘画面中下部，挡死中景小径与小屋
    const cw = 0.24 + s * 0.48;
    const ch = 0.24 + s * 0.52;
    blobs.push({ kind: "fan", cx: 0.48, cy: 1.02, rx: cw * 0.82, ry: ch, side: "center" });
    blobs.push({ kind: "bush", cx: 0.66, cy: 1.00, rx: cw * 0.64, ry: ch * 0.86, side: "centerR" });
    blobs.push({ kind: "bush", cx: 0.26, cy: 1.02, rx: cw * 0.55, ry: ch * 0.74, side: "centerL" });
  }
  return blobs;
}

function pointInBlob(u, v, b) {
  const dx = (u - b.cx) / Math.max(0.001, b.rx);
  const dy = (v - b.cy) / Math.max(0.001, b.ry);
  // 扇叶轮廓留少许叶隙，灌木较浑厚
  if (b.kind === "fan") {
    const d2 = dx * dx + dy * dy;
    if (d2 > 1) return false;
    const ang = Math.atan2(dy, dx);
    const wave = 0.88 + 0.12 * Math.sin(ang * 9);
    return Math.sqrt(d2) <= wave;
  }
  return dx * dx + dy * dy <= 1;
}

// 在 40×24 均匀网格上精确积分：前景实测占比 & 中景核心区被遮挡率
export function measureGeometry(state) {
  const blobs = getForegroundBlobs(state);
  const sc = SCENES[state.scene] || SCENES.poster;
  const hb = sc.heroBox;

  const cols = 40;
  const rows = 24;
  let fgHits = 0;
  let heroTotal = 0;
  let heroBlocked = 0;

  for (let iy = 0; iy < rows; iy++) {
    const v = (iy + 0.5) / rows;
    for (let ix = 0; ix < cols; ix++) {
      const u = (ix + 0.5) / cols;
      const inFg = blobs.some((b) => pointInBlob(u, v, b));
      if (inFg) fgHits++;
      if (u >= hb.x0 && u <= hb.x1 && v >= hb.y0 && v <= hb.y1) {
        heroTotal++;
        if (inFg) heroBlocked++;
      }
    }
  }

  const fgCoverPct = Math.round((fgHits / (cols * rows)) * 100);
  const heroBlockedPct = heroTotal ? Math.round((heroBlocked / heroTotal) * 100) : 0;
  return { fgCoverPct, heroBlockedPct };
}

// 计算三层真实 Z 轴世界坐标（供 Three.js 与 2D 透视降级共用）
export function computePlaneZ(depthSpan) {
  const d = Math.max(0, Math.min(1.5, depthSpan));
  // 基准中景在 Z = 0；前景朝镜头靠近 (+Z)，背景向远处退后 (-Z)
  return {
    fgZ: 0.04 + d * 1.18,
    midZ: 0,
    bgZ: -(0.04 + d * 1.28),
    spanTotal: +(0.08 + d * 2.46).toFixed(2),
  };
}

// 根据焦点模式给出三层光学模糊半径（像素示意值，0 表示完全清晰）
export function computeLayerBlur(state) {
  switch (state.focusMode) {
    case "mid":
      return { fg: 1.6, mid: 0, bg: 2.2 };
    case "fg":
      return { fg: 0, mid: 1.4, bg: 2.8 };
    case "bg":
      return { fg: 4.0, mid: 3.0, bg: 0 };
    default: // flat
      return { fg: 0, mid: 0, bg: 0 };
  }
}

// 完整单一真源诊断：算出 4 项支柱通过态、8 类具体错态、实测读数与白话解释
export function evaluate(state) {
  const colors = computeLayerColors(state);
  const { fgCoverPct, heroBlockedPct } = measureGeometry(state);
  const planes = computePlaneZ(state.depthSpan);
  const blur = computeLayerBlur(state);

  // 三层对天空米纸的真实相对亮度对比度
  const cFg = +contrastRatio(colors.fgDeep, colors.sky).toFixed(1);
  const cMid = +contrastRatio(colors.midDeep, colors.sky).toFixed(1);
  const cBg = +contrastRatio(colors.bgNear, colors.sky).toFixed(1);

  // 四项经验校验准则（严格按物理与视觉原理，允许双侧/单侧、焦落中景/焦落前景多组正当解）
  const fgTooSmall = fgCoverPct < 9;
  const fgTooBig = fgCoverPct > 34;
  const fgBlocksHero = heroBlockedPct > 24;
  const okFg = !fgTooSmall && !fgTooBig && !fgBlocksHero;

  const depthFlat = state.depthSpan < 0.36;
  const depthSplit = state.depthSpan > 1.26;
  const okDepth = !depthFlat && !depthSplit;

  // 对比梯子：前 > 中 > 后，且后景不能太硬抢戏（cBg <= 3.6）也不能彻底消失（cBg >= 1.22）
  const bgTooHarsh = state.atmoFade < 0.36 || cBg > 3.6 || cBg >= cMid - 0.8;
  const bgVanished = state.atmoFade > 0.88 || cBg < 1.22;
  const okContrast = !bgTooHarsh && !bgVanished && cFg > cMid + 1.2 && cMid > cBg + 1.0;

  const focusFlat = state.focusMode === "flat";
  const focusBgLost = state.focusMode === "bg";
  const okFocus = state.focusMode === "mid" || state.focusMode === "fg";

  const score = [okFg, okDepth, okContrast, okFocus].filter(Boolean).length;

  // 纵深分档（不用假精确百分比，用明确档位）
  const depthTier = depthFlat ? "贴扁" : depthSplit ? "脱节" : "衔接";

  // 按严重程度挑出当前最紧迫的一条实况诊断（覆盖全部 8 类失误）
  let code = "pass";
  let badge = "4 / 4 层次成立";
  let headline = "";
  let why = "";
  let tip = "";

  if (fgBlocksHero || fgTooBig) {
    code = "fg-block";
    badge = `错态 · 前景堵路 (${score}/4)`;
    headline = `前景吞掉 ${fgCoverPct}% 画面，还挡住了 ${heroBlockedPct}% 的中景主体`;
    why = "前景只该当「进门台阶」，不该当「拦路墙」。现在近处叶丛既过满又堵在中路，视线还没走到中景小屋就被黑绿大块彻底截断。";
    tip = "在深松绿「前景 LAYER 1」带里，切「双侧让路」或「单侧压角」，并把前景占比收到经验带 12%–30%。";
  } else if (fgTooSmall) {
    code = "fg-missing";
    badge = `错态 · 缺前景锚点 (${score}/4)`;
    headline = `前景只剩 ${fgCoverPct}%，画面失去近处「着陆点」`;
    why = "没有近处暗实元素当尺度参照，视线直接落到中景墙面上，整幅画会退化成平贴的远景明信片，沉浸感瞬间泄气。";
    tip = "把深松绿「前景 LAYER 1」带的占比推回到 12%–30%，让近处叶片在边角立住。";
  } else if (depthFlat) {
    code = "depth-flat";
    badge = `错态 · 三层贴扁 (${score}/4)`;
    headline = `三片景片挤在同一平面（Z 距仅 ${planes.spanTotal}）`;
    why = "前、中、后三层如果几乎贴在一起，横向晃动视角时没有视差错位，各层轮廓也拉不开前后重叠空间，立体感只剩纸面拼贴。";
    tip = "推开钢青蓝「中景 LAYER 2」带的「景片 Z 轴间距」到衔接区（0.45–1.20），顺手拖一下上方舞台看三层玻璃如何分开。";
  } else if (depthSplit) {
    code = "depth-split";
    badge = `错态 · 纵深断层 (${score}/4)`;
    headline = `三片景片拉得太散（Z 距 ${planes.spanTotal}），中景失去承上启下`;
    why = "间距过头后，远山缩成孤零零的小碎片，前景与中景之间出现空洞断档，观者感觉像隔着三层厚玻璃看拼装模型，节奏散架了。";
    tip = "把钢青蓝「中景 LAYER 2」带的「景片 Z 轴间距」收回到 0.45–1.20 衔接带。";
  } else if (bgTooHarsh) {
    code = "bg-harsh";
    badge = `错态 · 背景反抢戏 (${score}/4)`;
    headline = `远山对比度高达 ${cBg}:1，硬生生「扑」到了前景旁边`;
    why = "大脑默认高对比、深色调的物体离眼睛更近。远山画得和前景一样黑硬，空气透视失效，远景就会反客为主把整张画拍平。";
    tip = "向右拉动雾灰蓝「背景 LAYER 3」带的「空气退让」滑条到 40%–82%，让远山退成低对比的柔和雾蓝。";
  } else if (bgVanished) {
    code = "bg-vanished";
    badge = `错态 · 背景融空消失 (${score}/4)`;
    headline = `远山对比度掉到 ${cBg}:1，几乎融进米纸天空里`;
    why = "背景淡到看不出轮廓时，第三层空间实际上消失了——画面从前中后三层退化成两层，失去了远方山谷的氛围托底。";
    tip = "把雾灰蓝「背景 LAYER 3」带的「空气退让」往左收回到 40%–82%，留住淡淡的远山剪影。";
  } else if (focusFlat) {
    code = "focus-flat";
    badge = `错态 · 全层平权 (${score}/4)`;
    headline = "三层一样锐利抢眼，视线找不到第一落点";
    why = "前景叶脉、中景小屋和远山边线全都同样锐利时，大脑不知道该先停在哪里，视线会在三层之间反复打转。";
    tip = "在钢青蓝「中景 LAYER 2」带里选定焦点：「焦落中景」（主角居中景，经典风光）或「焦落前景」（入口点题，海报常用）。";
  } else if (focusBgLost) {
    code = "focus-bg";
    badge = `错态 · 焦点落空 (${score}/4)`;
    headline = "把焦点锁在最远处的模糊远山上，前中景全成遮挡噪点";
    why = "当大面积前景和中景都被虚化，只留远方极淡的山尖清晰时，观者会被前面模糊的大块暗影挡住视线，叙事重心落空。";
    tip = "把焦点切回「焦落中景」或「焦落前景」，让叙事主体承接视线。";
  } else {
    code = "pass";
    badge = "4 / 4 纵深成立";
    if (state.focusMode === "mid") {
      headline = "正当解 · 前景着陆让路，视线稳落中景主角";
      why = `前景以 ${fgCoverPct}% 实暗边角把眼睛请进画框，中景以 ${cMid}:1 清晰对比稳稳接住主角，背景退至 ${cBg}:1 雾灰蓝托出远方空气。拖动舞台斜看，三片玻璃层次井然。`;
      tip = "也可以试试把焦点切到「焦落前景」体验另一套正当解，或点「推演视线 1→2→3」看完整眼动路径。";
    } else {
      headline = "正当解 · 前景入口点题，中后景逐级铺开";
      why = `你用前景（${fgCoverPct}%、${cFg}:1 强对比）作为清晰视觉入口，再借中景过渡到 ${cBg}:1 柔和背景——正是 065 原海报强调的近实远虚入口路线。`;
      tip = "也可以切回「焦落中景」或切换「单侧压角 / 林径孤舟」，体会同一套三层秩序的不同节奏。";
    }
  }

  // 四枚底沿海报关键词徽状态（对应 DEPTH / LAYER / DISTANCE / FOCUS）
  const pillars = {
    depth: {
      ok: okDepth,
      text: depthFlat ? "贴扁" : depthSplit ? "脱节" : `Z ${planes.spanTotal}`,
    },
    layer: {
      ok: okFg,
      text: fgBlocksHero ? `遮主 ${heroBlockedPct}%` : fgTooSmall ? `仅 ${fgCoverPct}%` : fgTooBig ? `过满 ${fgCoverPct}%` : `占 ${fgCoverPct}%`,
    },
    distance: {
      ok: okContrast,
      text: bgTooHarsh ? `远山 ${cBg}:1 硬` : bgVanished ? `远山 ${cBg}:1 淡` : `${cFg}→${cMid}→${cBg}`,
    },
    focus: {
      ok: okFocus,
      text: focusFlat ? "平权无主" : focusBgLost ? "落空远山" : state.focusMode === "mid" ? "聚焦中景" : "聚焦前景",
    },
  };

  return {
    score,
    ok: score === 4,
    code,
    badge,
    headline,
    why,
    tip,
    colors,
    planes,
    blur,
    fgCoverPct,
    heroBlockedPct,
    contrast: { fg: cFg, mid: cMid, bg: cBg },
    depthTier,
    pillars,
    checks: { okFg, okDepth, okContrast, okFocus },
  };
}

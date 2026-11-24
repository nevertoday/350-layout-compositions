// 开场 3D 机位取景器和 SVG 降级版共用的状态与计算模型。
// 所有坐标都用相对画框的比例或归一化机位 (camX, camY ∈ [-1, 1], dist ∈ [0, 1])。

export const ASPECT = 4 / 5;

export const PALETTE = {
  bg: "#efe1d8",
  paper: "#f8f0ea",
  cream: "#fcf7f3",
  arch: "#dbbdb5",
  clay: "#c7928c",
  wall: "#b9847e",
  wallDark: "#7b4c49",
  wood: "#38201c",
  plum: "#8d3048",
  plumDeep: "#6b2236",
  terracotta: "#a66963",
  ink: "#2d1715",
  muted: "#82635f",
};

// 三种「现成的框」场景：都围绕同一庭院深处的梅花盆景，但外框的材质、明暗、完整度截然不同。
export const SCENES = {
  garden: {
    id: "garden",
    label: "园林拱门",
    en: "Arch & lattice",
    desc: "前景陶土拱门 + 中景花格窗，还原原海报的双层中式框景。",
    // 前景框开口范围（在相机正中、默认距离时的近似比例）
    outerOpen: { w: 0.72, h: 0.76 },
    innerOpen: { w: 0.44, h: 0.50 },
    target: { x: 0.0, y: 0.02 },
    darkFrame: false,
    partial: false,
  },
  doorway: {
    id: "doorway",
    label: "暗门廊",
    en: "Dark doorway",
    desc: "逆光暗室木门洞 + 院中亮窗，用强明暗把门里门外分成两个世界。",
    outerOpen: { w: 0.56, h: 0.76 },
    innerOpen: { w: 0.44, h: 0.48 },
    target: { x: 0.0, y: 0.02 },
    darkFrame: true,
    partial: false,
  },
  branch: {
    id: "branch",
    label: "竹枝半框",
    en: "Bamboo partial",
    desc: "左上垂竹枝 + 右下湖石与廊柱构成不完整的有机半框，框不必封死四边。",
    outerOpen: { w: 0.78, h: 0.78 },
    innerOpen: { w: 0.50, h: 0.52 },
    target: { x: 0.04, y: 0.04 },
    darkFrame: false,
    partial: true,
  },
};

export const SNAP_RADIUS = 0.13;

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 把机位 (x, y) 吸附到最佳套框站位附近
export function snapCamera(sceneId, x, y) {
  const sc = SCENES[sceneId] || SCENES.garden;
  const cx = clamp(x, -1, 1);
  const cy = clamp(y, -0.75, 0.75);
  const d = Math.hypot(cx - sc.target.x, cy - sc.target.y);
  if (d < SNAP_RADIUS) {
    return { x: sc.target.x, y: sc.target.y, snapped: true, dist: 0 };
  }
  return { x: cx, y: cy, snapped: false, dist: d };
}

// 计算在当前机位下，前景框、中景窗、背景盆景在 2D 画面里的投影偏移（供 SVG 降级与 HUD 计算共用）
// 相机右移 (+x) 时，前景比背景向左移得更快 -> 视差！
export function projectLayers(state) {
  const sc = SCENES[state.scene] || SCENES.garden;
  const x = state.cam.x;
  const y = state.cam.y;
  const z = state.dist; // 0 = 走近（框轻/视野宽）, 1 = 退远（框厚/洞口收小）

  // 走近时外框放大（往画面边缘退开），退远时外框缩小（框占面积更大）
  const outerScale = 1.20 - z * 0.34; // 1.20 .. 0.86
  const midScale = 1.12 - z * 0.24;   // 1.12 .. 0.88
  const bgScale = 1.05 - z * 0.14;    // 1.05 .. 0.91

  // 视差偏移：前景移得最多，中景次之，背景最少
  const outerShift = { u: -x * 0.26, v: y * 0.16 };
  const midShift = { u: -x * 0.11, v: y * 0.07 };
  const subjectPos = {
    u: 0.5 - x * 0.03,
    v: 0.56 + y * 0.025,
  };

  // 外框开口中心
  const outerCenter = { u: 0.5 + outerShift.u, v: 0.55 + outerShift.v };
  const midCenter = { u: 0.5 + midShift.u, v: 0.52 + midShift.v };

  // 主体相对外框和内框中心的偏离
  const dxOuter = subjectPos.u - outerCenter.u;
  const dyOuter = subjectPos.v - outerCenter.v;
  const dxMid = subjectPos.u - midCenter.u;
  const dyMid = subjectPos.v - midCenter.v;

  // 外框开口的归一化宽高
  const ow = sc.outerOpen.w * outerScale;
  const oh = sc.outerOpen.h * outerScale;
  const iw = sc.innerOpen.w * midScale;
  const ih = sc.innerOpen.h * midScale;

  // 前景框大约遮住了多少比例的画幅面积
  let frameCover;
  if (sc.partial) {
    frameCover = clamp(0.18 + z * 0.22 + Math.abs(x) * 0.06, 0.14, 0.52);
  } else {
    const openArea = clamp(ow, 0.2, 0.98) * clamp(oh, 0.2, 0.98);
    frameCover = clamp(1 - openArea * 0.88, 0.14, 0.78);
  }

  // 主体是否在两重框内清晰完整
  const alignErr = Math.hypot(x - sc.target.x, y - sc.target.y);
  let status;
  if (alignErr < 0.14) {
    status = z > 0.82 ? "tight" : z < 0.15 ? "loose" : "locked";
  } else if (Math.abs(x - sc.target.x) > 0.58) {
    status = "blocked";
  } else {
    status = "clipped";
  }

  return {
    sc,
    outerScale,
    midScale,
    bgScale,
    outerCenter,
    midCenter,
    subjectPos,
    ow,
    oh,
    iw,
    ih,
    dxOuter,
    dyOuter,
    dxMid,
    dyMid,
    frameCover,
    alignErr,
    status,
  };
}

// 给读数区生成「说人话、讲为什么」的即时反馈
export function describeView(state) {
  const p = projectLayers(state);
  const coverPct = `${Math.round(p.frameCover * 100)}%`;

  let badge = "已套准";
  let depthLabel = "三层清晰";
  let text = "";
  let tip = "";

  if (p.status === "locked") {
    badge = p.sc.partial ? "半框合围" : "双框套准";
    text = p.sc.darkFrame
      ? "人站在暗廊里正对门洞：门框压暗了四周杂物，视线顺着明暗反差直接钻进亮堂的庭院盆景。"
      : p.sc.partial
        ? "垂竹枝与石块只围住外缘，没把四边封死，视线既被轻轻拢向梅树，画面又保留了空气和呼吸感。"
        : "向前走一小步、左右微调机位后，前景拱门、中景花窗与庭院梅树叠成一条走廊，眼睛一路被送进花心。";
  } else if (p.status === "tight") {
    badge = "退得略远";
    text = "退后太多，前景门墙占了大半画面，洞口缩得很小：窥视感变强了，但主角也被压得有点局促。往前凑半步会更舒展。";
  } else if (p.status === "loose") {
    badge = "靠得太近";
    text = "机位贴门太近，前景框几乎退到了画幅边缘，只剩薄薄一条边——框的纵深与环境交代变弱了。退后一步试试。";
  } else if (p.status === "clipped") {
    const side = state.cam.x > p.sc.target.x ? "右" : "左";
    badge = "框线切角";
    depthLabel = "层次错位";
    text = `机位偏${side}了一截：前景的门缘正斜切过中景花窗，把完整的梅树割开。拍框中框最忌框线切在主体身上，往反方向挪半步就能套正。`;
  } else {
    badge = "主体被挡";
    depthLabel = "前景抢镜";
    text = "站得太偏，前景墙面或枝叶挡住了大半内景，主角反而躲到了门柱后面。把准星拖回中间附近，让前景为花树让出洞口。";
  }

  if (state.softFocus && state.darkRim) {
    tip = "已开启「前景微虚 + 暗框压光」：外框退成柔和剪影，主角的清晰度与亮度全拉开了。";
  } else if (state.softFocus) {
    tip = "已开启「前景微虚」：大光圈让近处门框略虚，眼睛不会停在前景砖纹上细看。";
  } else if (state.darkRim) {
    tip = "已开启「暗框压光」：前景退进阴影，明亮的内景像被一束光托起来。";
  }

  return {
    badge,
    coverPct,
    depthLabel,
    status: p.status,
    text,
    tip,
    proj: p,
  };
}

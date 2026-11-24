// 开场一点透视舞台的共享状态：只存画框比例坐标 (u, v) 与场景开关。
// Three.js 3D 版与无 WebGL SVG 版共同读取这份状态。

export const LIMITS = { uMin: 0.14, uMax: 0.86, vMin: 0.22, vMax: 0.72 };

export const PRESETS = {
  poster: {
    label: "偏右拉长",
    u: 0.74,
    v: 0.34,
    focal: "aligned",
  },
  center: {
    label: "正中深邃",
    u: 0.5,
    v: 0.44,
    focal: "aligned",
  },
  low: {
    label: "低机位仰视",
    u: 0.64,
    v: 0.62,
    focal: "aligned",
  },
  offset: {
    label: "主体错位",
    u: 0.72,
    v: 0.36,
    focal: "offset",
  },
};

export const SNAP_POINTS = [
  { u: 0.5, v: 0.44, name: "正中消失点" },
  { u: 0.74, v: 0.34, name: "海报右侧焦点" },
  { u: 0.333, v: 0.38, name: "左三分汇聚点" },
  { u: 0.667, v: 0.38, name: "右三分汇聚点" },
];

export const SNAP_RADIUS = 0.045;

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

export function nearestSnap(u, v) {
  let best = null;
  for (const p of SNAP_POINTS) {
    const d = Math.hypot(u - p.u, v - p.v);
    if (!best || d < best.d) best = { ...p, d };
  }
  return best;
}

export function classify(state) {
  const { u, v } = state.vp;
  if (state.focal === "offset") {
    return { kind: "offset", chip: "线与主体错位" };
  }
  if (u <= LIMITS.uMin + 0.05 || u >= LIMITS.uMax - 0.05 || v <= LIMITS.vMin + 0.04) {
    return { kind: "edge", chip: "贴边外泄" };
  }
  if (Math.abs(u - 0.5) < 0.06 && Math.abs(v - 0.44) < 0.09) {
    return { kind: "center", chip: "对称居中" };
  }
  if (v >= 0.56) {
    return { kind: "low", chip: "低机位压低" };
  }
  if (u > 0.58) {
    return { kind: "right", chip: "左下进 · 右上聚" };
  }
  if (u < 0.42) {
    return { kind: "left", chip: "右下进 · 左上聚" };
  }
  return { kind: "balanced", chip: "偏心汇聚" };
}

export function describe(state) {
  const zone = classify(state);
  const where = state.scene === "corridor" ? "走廊的立柱、梁线与地面边沿" : "路面的双色标线、路桩与架空线";
  const endObj = state.scene === "corridor" ? "远端门框里的人影" : "地平线上的橙色焦点与路人剪影";

  if (zone.kind === "offset") {
    return {
      ...zone,
      path: "前景进场 → 沿线直冲空消失点 → 折返寻找主体",
      text: `${where}全都汇向右侧消失点，但${endObj}却站偏到了左边。眼睛顺着线条冲进空洞，再回头找主角，画面里的力量互相打架。`,
    };
  }
  if (zone.kind === "edge") {
    return {
      ...zone,
      path: "前景进场 → 线条急转贴边 → 视线险些滑出画框",
      text: `消失点挤到了边缘附近：${where}还没来得及收拢稳妥，就被画框截断。主体被压在角落，眼睛看完很容易直接滑出画面。`,
    };
  }
  if (zone.kind === "center") {
    return {
      ...zone,
      path: "左右底部同时进场 → 两侧等距夹击 → 直抵正中主体",
      text: `所有平行线左右完全对称，把视线直接夹送进正中的${endObj}。纵深感和仪式感最强，但少了偏心构图的流动变化。`,
    };
  }
  if (zone.kind === "low") {
    return {
      ...zone,
      path: "底边近景贴地切入 → 上方空间大开 → 压低汇向主体",
      text: `消失点压低后，机位贴近地面，头顶留出大片呼吸空间；${where}从画面底部陡然展开，前景张力变强，带着视线平推向${endObj}。`,
    };
  }
  if (zone.kind === "right") {
    return {
      ...zone,
      path: "左下前景进场 → 两条主带斜穿画幅 → 收束于右上主体",
      text: `和 015 原海报一样的偏右汇聚：${where}从左下前景最宽处出发，一路收窄并提速，把眼睛顺着长路径送进右方的${endObj}。`,
    };
  }
  if (zone.kind === "left") {
    return {
      ...zone,
      path: "右下前景进场 → 主路径向左上方延伸 → 停在左侧主体",
      text: `消失点移到左侧后，右侧前景的线条拉长，视线从右下角切入，斜穿空间稳稳停在左方的${endObj}上。`,
    };
  }
  return {
    ...zone,
    path: "前景底角进场 → 多条透视线共同收拢 → 聚焦主体",
    text: `${where}从画面前缘自然起笔，由宽变窄、由近及远，把散落的注意力收拢到${endObj}处。`,
  };
}

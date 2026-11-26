// 304 群像构图 — 单真源几何投影与诊断模型
// 画布实绘剪影与全部文字读数、原则徽章、五步进度格均只读取本模块算出的同一组几何结果。
import { ROLE_META } from "./palette.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 单真源密度阈值：审计判定、原则徽章与白话诊单全部引用同一组常量
export const DENSITY_LIMITS = {
  minCov: 19,
  maxCov: 46,
  minCount: 6,
  maxNoGreyCount: 13,
  minGreyForLarge: 3,
};

// 15 位固定演员槽位模板，确保删减人数 (5..15) 时核心主角 (#0) 始终在场
const BASE_CAST = [
  { id: 0, name: "核心主角", variant: "hero" },
  { id: 1, name: "左后支点", variant: "tall" },
  { id: 2, name: "右后协从", variant: "tall" },
  { id: 3, name: "前左领队", variant: "std" },
  { id: 4, name: "中前听者", variant: "std" },
  { id: 5, name: "右中支点", variant: "bun" },
  { id: 6, name: "左远退景", variant: "bun" },
  { id: 7, name: "右远退景", variant: "std" },
  { id: 8, name: "前右前景", variant: "std" },
  { id: 9, name: "左前低位", variant: "small" },
  { id: 10, name: "右前低位", variant: "small" },
  { id: 11, name: "左翼补位", variant: "std" },
  { id: 12, name: "右翼补位", variant: "std" },
  { id: 13, name: "后排边缘 A", variant: "small" },
  { id: 14, name: "后排边缘 B", variant: "small" },
];

// 各预设状态：每条演员数据存相对坐标 x(0..1)、脚底纵深平面 y(0.56..0.96，越大越靠前越晚画)、
// 身高比例 h(0.22..0.66)、色层 role、群组归属 grp(0主/1左/2右)、朝向偏置 gaze(-1看左/0居中/+1看右/'lead'朝主角/'out'外逃)
function makeActors(specs) {
  return BASE_CAST.map((slot, i) => {
    const s = specs[i] || {
      x: 0.14 + ((i * 0.068) % 0.72),
      y: 0.78 + (i % 3) * 0.05,
      h: 0.30,
      role: i % 2 === 0 ? "grey" : "blue",
      grp: i % 2 === 0 ? 1 : 2,
      gaze: "lead",
    };
    return {
      ...slot,
      x: s.x,
      y: s.y,
      h: s.h,
      role: s.role,
      grp: s.grp ?? 0,
      gaze: s.gaze ?? "lead",
      variant: s.variant || slot.variant,
    };
  });
}

export const PRESETS = {
  // 开场坏态（0/5）：13人等高一字排队 + 4人朱红抢戏 + 机械等距 + 叠头粘连 + 零退景灰 + 视线外逃
  broken: {
    id: "broken",
    label: "开场坏态",
    count: 13,
    spread: 50,
    actors: makeActors([
      { x: 0.50, y: 0.79, h: 0.41, role: "red", grp: 0, gaze: "out" },
      { x: 0.11, y: 0.78, h: 0.40, role: "red", grp: 1, gaze: "out" },
      { x: 0.175, y: 0.79, h: 0.40, role: "blue", grp: 1, gaze: "out" },
      { x: 0.24, y: 0.78, h: 0.40, role: "black", grp: 1, gaze: "out" },
      { x: 0.305, y: 0.79, h: 0.41, role: "red", grp: 1, gaze: "out" },
      { x: 0.37, y: 0.78, h: 0.40, role: "blue", grp: 1, gaze: "out" },
      { x: 0.435, y: 0.79, h: 0.40, role: "black", grp: 0, gaze: "out" },
      { x: 0.565, y: 0.78, h: 0.40, role: "blue", grp: 0, gaze: "out" },
      { x: 0.63, y: 0.79, h: 0.41, role: "red", grp: 2, gaze: "out" },
      { x: 0.695, y: 0.78, h: 0.40, role: "black", grp: 2, gaze: "out" },
      { x: 0.76, y: 0.79, h: 0.40, role: "blue", grp: 2, gaze: "out" },
      { x: 0.825, y: 0.78, h: 0.40, role: "black", grp: 2, gaze: "out" },
      { x: 0.89, y: 0.79, h: 0.40, role: "blue", grp: 2, gaze: "out" },
      { x: 0.20, y: 0.80, h: 0.39, role: "black", grp: 1, gaze: "out" },
      { x: 0.80, y: 0.80, h: 0.39, role: "blue", grp: 2, gaze: "out" },
    ]),
  },

  // 合法解 1：1:1 复刻 304 原海报经典「集中凝聚式」金字塔剪纸群像 (5/5)
  poster: {
    id: "poster",
    label: "原海报·集中式",
    count: 11,
    spread: 24,
    actors: makeActors([
      // 中央高耸朱红核心主角（头顶三放射线）
      { x: 0.51, y: 0.80, h: 0.64, role: "red", grp: 0, gaze: 0, variant: "hero" },
      // 左后深墨高立支点
      { x: 0.39, y: 0.67, h: 0.46, role: "black", grp: 1, gaze: "lead", variant: "tall" },
      // 右后钴蓝高立协从
      { x: 0.64, y: 0.68, h: 0.46, role: "blue", grp: 2, gaze: "lead", variant: "tall" },
      // 左前钴蓝前景护翼
      { x: 0.31, y: 0.90, h: 0.44, role: "blue", grp: 1, gaze: "lead", variant: "std" },
      // 中前暖灰退景听者（降低前景彩度，托起后方红主角）
      { x: 0.51, y: 0.92, h: 0.33, role: "grey", grp: 0, gaze: "lead", variant: "std" },
      // 右中炭黑发髻剪影
      { x: 0.62, y: 0.84, h: 0.39, role: "black", grp: 2, gaze: "lead", variant: "bun" },
      // 最左中后暖灰发髻退景（错开左前钴蓝头顶，零叠头）
      { x: 0.27, y: 0.72, h: 0.36, role: "grey", grp: 1, gaze: "lead", variant: "bun" },
      // 最右中后暖灰退景
      { x: 0.72, y: 0.78, h: 0.36, role: "grey", grp: 2, gaze: "lead", variant: "std" },
      // 右前低位钴蓝收边
      { x: 0.67, y: 0.94, h: 0.28, role: "blue", grp: 2, gaze: "lead", variant: "small" },
      // 左前小体量朱红呼应（面积远小于主角，形成色彩节奏而不抢戏）
      { x: 0.40, y: 0.94, h: 0.28, role: "red", grp: 1, gaze: "lead", variant: "small" },
      // 右远小体量暖灰收束
      { x: 0.77, y: 0.88, h: 0.27, role: "grey", grp: 2, gaze: "lead", variant: "small" },
      { x: 0.21, y: 0.86, h: 0.28, role: "grey", grp: 1, gaze: "lead", variant: "small" },
      { x: 0.82, y: 0.75, h: 0.27, role: "grey", grp: 2, gaze: "lead", variant: "small" },
      { x: 0.44, y: 0.63, h: 0.30, role: "grey", grp: 0, gaze: "lead", variant: "small" },
      { x: 0.58, y: 0.63, h: 0.30, role: "grey", grp: 0, gaze: "lead", variant: "small" },
    ]),
  },

  // 合法解 2：电影长镜头「分散三群落式」叙事构图 (5/5)
  dispersed: {
    id: "dispersed",
    label: "分散式·三群落",
    count: 9,
    spread: 84,
    actors: makeActors([
      // 群落 1（左中核心组 3 人）：朱红主角 + 炭黑辅翼 + 暖灰前景
      { x: 0.34, y: 0.82, h: 0.60, role: "red", grp: 0, gaze: 1, variant: "hero" },
      { x: 0.23, y: 0.74, h: 0.42, role: "black", grp: 0, gaze: "lead", variant: "tall" },
      { x: 0.14, y: 0.88, h: 0.33, role: "grey", grp: 0, gaze: "lead", variant: "bun" },
      // 群落 2（中右钴蓝对话组 3 人，与左组隔出清晰呼吸走廊）
      { x: 0.62, y: 0.85, h: 0.42, role: "blue", grp: 2, gaze: "lead", variant: "std" },
      { x: 0.54, y: 0.73, h: 0.34, role: "grey", grp: 2, gaze: "lead", variant: "std" },
      { x: 0.69, y: 0.91, h: 0.31, role: "blue", grp: 2, gaze: "lead", variant: "small" },
      // 群落 3（远右双人轻墨尾音组 3 人，隔出第二条细走廊）
      { x: 0.84, y: 0.77, h: 0.35, role: "black", grp: 1, gaze: "lead", variant: "bun" },
      { x: 0.89, y: 0.89, h: 0.28, role: "grey", grp: 1, gaze: "lead", variant: "small" },
      { x: 0.39, y: 0.92, h: 0.28, role: "grey", grp: 0, gaze: "lead", variant: "small" },
      { x: 0.20, y: 0.93, h: 0.27, role: "grey", grp: 0, gaze: "lead", variant: "small" },
      { x: 0.60, y: 0.93, h: 0.26, role: "grey", grp: 2, gaze: "lead", variant: "small" },
      { x: 0.28, y: 0.65, h: 0.30, role: "grey", grp: 0, gaze: "lead", variant: "small" },
      { x: 0.66, y: 0.66, h: 0.29, role: "grey", grp: 2, gaze: "lead", variant: "small" },
      { x: 0.11, y: 0.76, h: 0.27, role: "grey", grp: 0, gaze: "lead", variant: "small" },
      { x: 0.90, y: 0.82, h: 0.26, role: "grey", grp: 1, gaze: "lead", variant: "small" },
    ]),
  },

  // 合法解 3：不对称「双阵营对峙式」 (5/5)
  confrontation: {
    id: "confrontation",
    label: "双阵营对峙解",
    count: 9,
    spread: 72,
    actors: makeActors([
      // 左翼阵营：红主领衔 + 钴蓝支撑 + 灰退景
      { x: 0.31, y: 0.84, h: 0.60, role: "red", grp: 1, gaze: 1, variant: "hero" },
      { x: 0.20, y: 0.74, h: 0.43, role: "blue", grp: 1, gaze: "lead", variant: "tall" },
      { x: 0.13, y: 0.89, h: 0.32, role: "grey", grp: 1, gaze: "lead", variant: "bun" },
      { x: 0.39, y: 0.92, h: 0.29, role: "blue", grp: 1, gaze: 1, variant: "small" },
      // 右翼阵营：墨黑群落隔空回应（留出中间戏剧走廊）
      { x: 0.71, y: 0.80, h: 0.44, role: "black", grp: 2, gaze: "lead", variant: "tall" },
      { x: 0.80, y: 0.88, h: 0.37, role: "black", grp: 2, gaze: "lead", variant: "std" },
      { x: 0.63, y: 0.91, h: 0.32, role: "grey", grp: 2, gaze: "lead", variant: "bun" },
      { x: 0.87, y: 0.75, h: 0.32, role: "grey", grp: 2, gaze: "lead", variant: "std" },
      { x: 0.75, y: 0.94, h: 0.27, role: "grey", grp: 2, gaze: "lead", variant: "small" },
      { x: 0.26, y: 0.93, h: 0.26, role: "grey", grp: 1, gaze: "lead", variant: "small" },
      { x: 0.68, y: 0.68, h: 0.30, role: "grey", grp: 2, gaze: "lead", variant: "small" },
      { x: 0.16, y: 0.66, h: 0.29, role: "grey", grp: 1, gaze: "lead", variant: "small" },
      { x: 0.84, y: 0.65, h: 0.28, role: "grey", grp: 2, gaze: "lead", variant: "small" },
      { x: 0.44, y: 0.74, h: 0.27, role: "grey", grp: 1, gaze: "lead", variant: "small" },
      { x: 0.58, y: 0.72, h: 0.27, role: "grey", grp: 2, gaze: "lead", variant: "small" },
    ]),
  },

  // 反向试错 1：多红抢戏
  errMultiRed: {
    id: "errMultiRed",
    label: "试错：多红抢戏",
    count: 10,
    spread: 42,
    actors: makeActors([
      { x: 0.50, y: 0.80, h: 0.54, role: "red", grp: 0, gaze: 0, variant: "hero" },
      { x: 0.33, y: 0.76, h: 0.50, role: "red", grp: 1, gaze: "lead", variant: "tall" },
      { x: 0.68, y: 0.77, h: 0.50, role: "red", grp: 2, gaze: "lead", variant: "tall" },
      { x: 0.22, y: 0.90, h: 0.36, role: "blue", grp: 1, gaze: "lead", variant: "std" },
      { x: 0.49, y: 0.92, h: 0.29, role: "grey", grp: 0, gaze: "lead", variant: "std" },
      { x: 0.78, y: 0.90, h: 0.35, role: "black", grp: 2, gaze: "lead", variant: "bun" },
      { x: 0.27, y: 0.68, h: 0.31, role: "grey", grp: 1, gaze: "lead", variant: "bun" },
      { x: 0.74, y: 0.68, h: 0.31, role: "grey", grp: 2, gaze: "lead", variant: "std" },
      { x: 0.39, y: 0.93, h: 0.26, role: "blue", grp: 1, gaze: "lead", variant: "small" },
      { x: 0.62, y: 0.93, h: 0.26, role: "black", grp: 2, gaze: "lead", variant: "small" },
    ]),
  },

  // 反向试错 2：主角被前景挡死
  errBlocked: {
    id: "errBlocked",
    label: "试错：主角被挡",
    count: 10,
    spread: 26,
    actors: makeActors([
      { x: 0.50, y: 0.66, h: 0.48, role: "red", grp: 0, gaze: 0, variant: "hero" },
      { x: 0.46, y: 0.88, h: 0.54, role: "black", grp: 0, gaze: "lead", variant: "tall" },
      { x: 0.55, y: 0.90, h: 0.53, role: "blue", grp: 0, gaze: "lead", variant: "tall" },
      { x: 0.30, y: 0.84, h: 0.38, role: "blue", grp: 1, gaze: "lead", variant: "std" },
      { x: 0.70, y: 0.84, h: 0.38, role: "black", grp: 2, gaze: "lead", variant: "bun" },
      { x: 0.22, y: 0.73, h: 0.32, role: "grey", grp: 1, gaze: "lead", variant: "bun" },
      { x: 0.78, y: 0.74, h: 0.32, role: "grey", grp: 2, gaze: "lead", variant: "std" },
      { x: 0.37, y: 0.92, h: 0.27, role: "grey", grp: 1, gaze: "lead", variant: "small" },
      { x: 0.64, y: 0.92, h: 0.27, role: "grey", grp: 2, gaze: "lead", variant: "small" },
      { x: 0.84, y: 0.88, h: 0.25, role: "grey", grp: 2, gaze: "lead", variant: "small" },
    ]),
  },

  // 反向试错 3：15人过满窒息
  errOvercrowded: {
    id: "errOvercrowded",
    label: "试错：过满窒息",
    count: 15,
    spread: 18,
    actors: makeActors([
      { x: 0.50, y: 0.80, h: 0.58, role: "red", grp: 0, gaze: 0, variant: "hero" },
      { x: 0.38, y: 0.74, h: 0.48, role: "black", grp: 1, gaze: "lead", variant: "tall" },
      { x: 0.62, y: 0.75, h: 0.48, role: "blue", grp: 2, gaze: "lead", variant: "tall" },
      { x: 0.26, y: 0.84, h: 0.46, role: "blue", grp: 1, gaze: "lead", variant: "std" },
      { x: 0.74, y: 0.84, h: 0.46, role: "black", grp: 2, gaze: "lead", variant: "bun" },
      { x: 0.44, y: 0.90, h: 0.44, role: "blue", grp: 0, gaze: "lead", variant: "std" },
      { x: 0.57, y: 0.91, h: 0.44, role: "black", grp: 0, gaze: "lead", variant: "std" },
      { x: 0.16, y: 0.82, h: 0.44, role: "red", grp: 1, gaze: "lead", variant: "std" },
      { x: 0.84, y: 0.82, h: 0.44, role: "blue", grp: 2, gaze: "lead", variant: "std" },
      { x: 0.32, y: 0.93, h: 0.42, role: "black", grp: 1, gaze: "lead", variant: "std" },
      { x: 0.68, y: 0.93, h: 0.42, role: "blue", grp: 2, gaze: "lead", variant: "std" },
      { x: 0.21, y: 0.94, h: 0.40, role: "blue", grp: 1, gaze: "lead", variant: "std" },
      { x: 0.79, y: 0.94, h: 0.40, role: "black", grp: 2, gaze: "lead", variant: "std" },
      { x: 0.47, y: 0.73, h: 0.45, role: "blue", grp: 0, gaze: "lead", variant: "std" },
      { x: 0.53, y: 0.73, h: 0.45, role: "black", grp: 0, gaze: "lead", variant: "std" },
    ]),
  },

  // 反向试错 4：过空散架（只有5个极小散点）
  errTooSparse: {
    id: "errTooSparse",
    label: "试错：过空散架",
    count: 5,
    spread: 96,
    actors: makeActors([
      { x: 0.50, y: 0.72, h: 0.30, role: "red", grp: 0, gaze: "out", variant: "hero" },
      { x: 0.11, y: 0.72, h: 0.25, role: "grey", grp: 1, gaze: "out", variant: "small" },
      { x: 0.31, y: 0.74, h: 0.24, role: "grey", grp: 1, gaze: "out", variant: "small" },
      { x: 0.69, y: 0.74, h: 0.24, role: "grey", grp: 2, gaze: "out", variant: "small" },
      { x: 0.89, y: 0.72, h: 0.25, role: "grey", grp: 2, gaze: "out", variant: "small" },
    ]),
  },
};

export function createInitialState() {
  return clonePreset("broken");
}

export function clonePreset(presetKey, prevState = null) {
  const p = PRESETS[presetKey] || PRESETS.broken;
  return {
    presetId: p.id,
    scenario: prevState?.scenario || "poster",
    count: p.count,
    spread: p.spread,
    baseSpread: p.spread,
    brush: prevState?.brush || "cycle",
    activeProbe: prevState?.activeProbe || null,
    selectedId: 0,
    showCallouts: prevState?.showCallouts ?? true,
    actors: p.actors.map((a) => ({ ...a })),
  };
}

// 将抽象群像状态投影到画布实际像素几何（画布渲染与单真源审计共用同一套输出）
export function projectActors(state, w, h) {
  const active = state.actors.slice(0, clamp(state.count, 5, 15));
  const deltaSpread = (state.spread - state.baseSpread) / 100; // -0.9 .. +0.9
  const leadRaw = active[0];
  const anchorX = leadRaw ? leadRaw.x : 0.5;

  const projected = active.map((a, idx) => {
    // 聚散连续变形：保持主角锚定，周围配角按所属群组向外散开或向主角聚拢
    let effX = a.x;
    if (idx > 0 && Math.abs(deltaSpread) > 0.001) {
      const dxFromAnchor = a.x - anchorX;
      // 聚拢（deltaSpread < 0）时向主角收束；分散（deltaSpread > 0）时按群组拉开走廊
      const grpBias = a.grp === 1 ? -0.14 : a.grp === 2 ? 0.14 : 0;
      const factor = deltaSpread >= 0
        ? 1 + deltaSpread * 0.58
        : Math.max(0.46, 1 + deltaSpread * 0.52);
      effX = anchorX + dxFromAnchor * factor + (deltaSpread > 0 ? grpBias * deltaSpread * 0.75 : 0);
    }
    effX = clamp(effX, 0.08, 0.92);

    const effY = clamp(a.y, 0.56, 0.95);
    const effH = clamp(a.h, 0.22, 0.65);

    const scaleH = Math.min(h, w * 0.88);
    const scaleW = Math.min(h, w * 0.56);
    const pxH = effH * scaleH;
    // 304 原海报标志性的饱满圆头 + 宽阔圆角剪纸肩部比例（竖屏窄画布按宽等比收束，杜绝撞头与压边）
    const headR = clamp(effH * scaleW * 0.152, 7.5, 42);
    const shoulderW = clamp(effH * scaleW * (a.variant === "hero" ? 0.50 : a.variant === "small" ? 0.52 : 0.48), 22, 175);
    const cx = effX * w;
    const baseY = effY * h;
    const topY = baseY - pxH;
    const headCy = topY + headR + 2;
    const torsoTop = headCy + headR + Math.max(4, pxH * 0.025);
    const torsoH = Math.max(16, baseY - torsoTop);

    return {
      ...a,
      index: idx,
      effX,
      effY,
      effH,
      cx,
      baseY,
      topY,
      pxH,
      headCx: cx,
      headCy,
      headR,
      shoulderW,
      torsoTop,
      torsoH,
      bbox: {
        x0: cx - shoulderW / 2,
        y0: topY,
        x1: cx + shoulderW / 2,
        y1: baseY,
      },
      // 越靠下（y 越大）越靠前景；相同 y 时小的在前、高的在后（原海报高主角在中后层耸立）
      zKey: effY * 10 - effH * 0.45 + idx * 0.0001,
    };
  });

  // 按景深从后往前排，赋予真实绘制顺序 zIndex
  const drawOrder = [...projected].sort((a, b) => a.zKey - b.zKey);
  drawOrder.forEach((p, z) => {
    p.zIndex = z;
  });

  // 计算实绘遮挡比、头部碰撞、实绘可见面积（在 36×24 轻量网格上用平方距离采样，无 sqrt、纯几何零估算）
  const GW = 36;
  const GH = 24;
  const ownerGrid = new Int16Array(GW * GH).fill(-1);
  const totalCells = new Int32Array(projected.length);
  const visibleCells = new Int32Array(projected.length);
  const headTotalCells = new Int32Array(projected.length);
  const headBlockedCells = new Int32Array(projected.length);

  // 预计算每个剪影的包围范围与头部平方半径，加速热循环
  const fast = drawOrder.map((p) => ({
    idx: p.index,
    z: p.zIndex,
    hx: p.headCx,
    hy: p.headCy,
    hr2: (p.headR * 1.04) ** 2,
    hrInner2: (p.headR * 0.96) ** 2,
    tx0: p.cx - p.shoulderW * 0.5,
    tx1: p.cx + p.shoulderW * 0.5,
    ty0: p.torsoTop,
    ty1: p.baseY,
  }));

  for (let gy = 0; gy < GH; gy++) {
    const py = ((gy + 0.5) / GH) * h;
    for (let gx = 0; gx < GW; gx++) {
      const px = ((gx + 0.5) / GW) * w;
      let topOwner = -1;
      let topZ = -1;
      for (let z = 0; z < fast.length; z++) {
        const f = fast[z];
        const dx = px - f.hx;
        const dy = py - f.hy;
        const inHead = dx * dx + dy * dy <= f.hr2;
        const inTorso = px >= f.tx0 && px <= f.tx1 && py >= f.ty0 && py <= f.ty1;
        if (inHead || inTorso) {
          totalCells[f.idx]++;
          if (inHead) headTotalCells[f.idx]++;
          topOwner = f.idx;
          topZ = f.z;
        }
      }
      if (topOwner >= 0) {
        ownerGrid[gy * GW + gx] = topOwner;
        visibleCells[topOwner]++;
        for (let z = 0; z < fast.length; z++) {
          const f = fast[z];
          if (f.idx === topOwner || f.z >= topZ) continue;
          const dx = px - f.hx;
          const dy = py - f.hy;
          if (dx * dx + dy * dy <= f.hrInner2) {
            headBlockedCells[f.idx]++;
          }
        }
      }
    }
  }

  let occupiedTotal = 0;
  for (let k = 0; k < ownerGrid.length; k++) {
    if (ownerGrid[k] >= 0) occupiedTotal++;
  }
  const coveragePct = Math.round((occupiedTotal / (GW * GH)) * 100);

  // 逐个写入可见面积、遮挡比与视觉权重
  for (const p of projected) {
    const tot = Math.max(1, totalCells[p.index]);
    const vis = visibleCells[p.index];
    p.occludedRatio = clamp(1 - vis / tot, 0, 1);
    p.headOccludedRatio = headTotalCells[p.index] > 0 ? headBlockedCells[p.index] / headTotalCells[p.index] : 0;
    p.visibleAreaPct = (vis / (GW * GH)) * 100;
    const chroma = ROLE_META[p.role]?.chroma ?? 1.0;
    const centerBoost = 1.12 - Math.min(0.28, Math.abs(p.effX - 0.5) * 0.55);
    const heightBoost = 0.72 + p.effH * 0.85;
    p.visualWeight = p.visibleAreaPct * chroma * centerBoost * heightBoost;
  }

  // 检测头部重度重叠（叠头撞脸）对
  const headCollisionPairs = [];
  for (let i = 0; i < projected.length; i++) {
    for (let j = i + 1; j < projected.length; j++) {
      const a = projected[i];
      const b = projected[j];
      const dist = Math.hypot(a.headCx - b.headCx, a.headCy - b.headCy);
      const minSafe = (a.headR + b.headR) * 0.88;
      if (dist < minSafe) {
        headCollisionPairs.push([a.index, b.index, dist / Math.max(1, minSafe)]);
      }
    }
  }

  return { projected, drawOrder, coveragePct, headCollisionPairs };
}

// 单真源诊断：从实绘几何算 5 条原则是否成立 + 具体原因与白话建议
export function evaluateEnsemble(state, w = 960, h = 560) {
  const { projected, drawOrder, coveragePct, headCollisionPairs } = projectActors(state, w, h);
  const n = projected.length;

  // 1. 按实绘视觉权重排序，找真正的主角
  const byWeight = [...projected].sort((a, b) => b.visualWeight - a.visualWeight);
  const topActor = byWeight[0];
  const secondActor = byWeight[1] || topActor;
  const weightRatio = secondActor.visualWeight > 0.001 ? topActor.visualWeight / secondActor.visualWeight : 2;

  const redActors = projected.filter((p) => p.role === "red").sort((a, b) => b.visualWeight - a.visualWeight);
  const greyCount = projected.filter((p) => p.role === "grey").length;
  const primaryLead = redActors[0] || topActor;

  // 检查是否「多红抢戏」：有第二位朱红人物且其视觉权重达到第一位红主的 56% 以上（而非小体量色彩呼应）
  const competingReds = redActors.filter(
    (p, i) => i > 0 && p.visualWeight >= primaryLead.visualWeight * 0.56
  );

  // 检查主角遮挡与贴边
  const leadBlocked = primaryLead.headOccludedRatio >= 0.16 || primaryLead.occludedRatio >= 0.36;
  const leadAtEdge = primaryLead.effX < 0.17 || primaryLead.effX > 0.83;
  const noClearLead = redActors.length === 0 && weightRatio < 1.48;
  const flatWeight = weightRatio < 1.30;

  let focalOk = true;
  let focalTag = "唯一聚焦";
  let focalFault = null;
  if (competingReds.length > 0) {
    focalOk = false;
    focalTag = `撞色 ${redActors.length}红`;
    focalFault = "multiRed";
  } else if (leadBlocked) {
    focalOk = false;
    focalTag = `遮挡 ${Math.round(Math.max(primaryLead.headOccludedRatio, primaryLead.occludedRatio) * 100)}%`;
    focalFault = "leadBlocked";
  } else if (leadAtEdge) {
    focalOk = false;
    focalTag = "主角贴边";
    focalFault = "leadEdge";
  } else if (noClearLead || flatWeight) {
    focalOk = false;
    focalTag = `拉平 ${weightRatio.toFixed(2)}×`;
    focalFault = "flatLead";
  }

  // 2. 主次层级 (Hierarchy)：头高落差 + 身高比例 + 主角确实占据第一视觉层级
  const heights = projected.map((p) => p.effH);
  const maxH = Math.max(...heights);
  const minH = Math.min(...heights);
  const heightRatio = maxH / Math.max(0.05, minH);
  const headYs = projected.map((p) => p.headCy / h);
  const headBandSpread = Math.max(...headYs) - Math.min(...headYs);
  const leadOutweighed = redActors.length > 0 && topActor.index !== primaryLead.index;

  let hierarchyOk = true;
  let hierarchyTag = `${heightRatio.toFixed(2)}× 阶梯`;
  let hierarchyFault = null;
  if (leadOutweighed) {
    hierarchyOk = false;
    hierarchyTag = "配角压主";
    hierarchyFault = "leadOutweighed";
  } else if (headBandSpread < 0.13 || heightRatio < 1.40) {
    hierarchyOk = false;
    hierarchyTag = `等高 ${heightRatio.toFixed(2)}×`;
    hierarchyFault = "flatHeights";
  }

  // 3. 队形组织 (Grouping) & 集中/分散极性判定
  const sortedX = [...projected].sort((a, b) => a.effX - b.effX);
  const spanX = sortedX[n - 1].effX - sortedX[0].effX;
  const gaps = [];
  for (let i = 1; i < n; i++) gaps.push(sortedX[i].effX - sortedX[i - 1].effX);
  const meanGap = gaps.reduce((s, g) => s + g, 0) / Math.max(1, gaps.length);
  const stdGap = Math.sqrt(gaps.reduce((s, g) => s + (g - meanGap) ** 2, 0) / Math.max(1, gaps.length));
  const gapCV = meanGap > 0.0001 ? stdGap / meanGap : 0;

  // 基于画幅无关的横向间距切分群落（相邻两人物中心距 >= 13.2% 画宽即形成清晰的组间呼吸走廊）
  const corridors = [];
  const clusters = [[sortedX[0]]];
  for (let i = 1; i < n; i++) {
    const prev = sortedX[i - 1];
    const curr = sortedX[i];
    const centerGap = curr.effX - prev.effX;
    if (centerGap >= 0.132) {
      corridors.push({
        x0: prev.effX,
        x1: curr.effX,
        width: centerGap,
      });
      clusters.push([curr]);
    } else {
      clusters[clusters.length - 1].push(curr);
    }
  }

  // 加权视觉重心 X（用真实视觉权重核算左右平衡）
  const totalWeight = projected.reduce((s, p) => s + p.visualWeight, 0) || 1;
  const comX = projected.reduce((s, p) => s + p.effX * p.visualWeight, 0) / totalWeight;
  const comOffset = comX - 0.5;

  // 队形模式归类：集中式（凝聚成 1 团核心金字塔，覆盖横向 <= 0.68 且重心稳）或 分散式（2-3 清晰群落）
  const isConcentrated = clusters.length === 1 && spanX <= 0.68 && headBandSpread >= 0.16 && n >= 6;
  const multiSizedClusters = clusters.filter((c) => c.length >= 2).length;
  const isDispersed = clusters.length >= 2 && clusters.length <= 4 && multiSizedClusters >= 2;
  const isPicketFence = clusters.length === 1 && gapCV < 0.16 && spanX > 0.64;

  let groupingOk = true;
  let groupingTag = isConcentrated ? "集中凝聚" : `分散 ${clusters.length} 组`;
  let groupingFault = null;
  if (isPicketFence) {
    groupingOk = false;
    groupingTag = "一字栅栏";
    groupingFault = "picketFence";
  } else if (Math.abs(comOffset) > 0.15) {
    groupingOk = false;
    groupingTag = comOffset > 0 ? `右沉 ${Math.round(comOffset * 100)}%` : `左沉 ${Math.round(-comOffset * 100)}%`;
    groupingFault = "offBalance";
  } else if (!isConcentrated && !isDispersed) {
    groupingOk = false;
    groupingTag = "散乱无组";
    groupingFault = "noClusters";
  }

  // 4. 聚散节奏 (Rhythm)：前后纵深层次 + 零叠头压撞 + 非死板等距
  const yValues = projected.map((p) => p.effY);
  const depthSpread = Math.max(...yValues) - Math.min(...yValues);
  const headCollisions = headCollisionPairs.length;

  let rhythmOk = true;
  let rhythmTag = depthSpread >= 0.18 ? "三层错落" : "疏密有致";
  let rhythmFault = null;
  if (headCollisions > 0) {
    rhythmOk = false;
    rhythmTag = `叠头 ${headCollisions} 处`;
    rhythmFault = "headCollision";
  } else if (depthSpread < 0.10) {
    rhythmOk = false;
    rhythmTag = "扁平贴墙";
    rhythmFault = "flatDepth";
  } else if (gapCV < 0.15 && !isConcentrated) {
    rhythmOk = false;
    rhythmTag = `等距 CV ${gapCV.toFixed(2)}`;
    rhythmFault = "rigidSpacing";
  }

  // 5. 信息密度 (Density)：双向检测过满窒息、全员高彩度过载、以及过空散架（共用 DENSITY_LIMITS 单真源）
  const greyRatio = greyCount / n;
  const covTooHigh = coveragePct > DENSITY_LIMITS.maxCov;
  const crowdNoRelief = n >= DENSITY_LIMITS.maxNoGreyCount && greyCount < DENSITY_LIMITS.minGreyForLarge;
  const tooCrowded = covTooHigh || crowdNoRelief;
  const chromaOverload = n >= 8 && greyCount < 2;
  const tooSparse = coveragePct < DENSITY_LIMITS.minCov || n < DENSITY_LIMITS.minCount;

  let densityOk = true;
  let densityTag = `覆盖 ${coveragePct}%`;
  let densityFault = null;
  if (tooCrowded) {
    densityOk = false;
    densityTag = covTooHigh ? `过满 ${coveragePct}%` : `过密 ${n}人`;
    densityFault = "overcrowded";
  } else if (chromaOverload) {
    densityOk = false;
    densityTag = "缺退景灰";
    densityFault = "chromaOverload";
  } else if (tooSparse) {
    densityOk = false;
    densityTag = `过空 ${coveragePct}%`;
    densityFault = "tooSparse";
  }

  const checks = {
    hierarchy: { ok: hierarchyOk, tag: hierarchyTag, fault: hierarchyFault },
    rhythm: { ok: rhythmOk, tag: rhythmTag, fault: rhythmFault },
    focal: { ok: focalOk, tag: focalTag, fault: focalFault },
    grouping: { ok: groupingOk, tag: groupingTag, fault: groupingFault },
    density: { ok: densityOk, tag: densityTag, fault: densityFault },
  };

  const score = Object.values(checks).filter((c) => c.ok).length;

  // 视线凝聚度（次要参考，用于演播动势与「引导视线」一步）
  const alignedCount = projected.filter((p, i) => i === 0 || p.gaze === "lead" || (p.gaze === 1 && p.effX < 0.5) || (p.gaze === -1 && p.effX > 0.5)).length;
  const gazeAligned = alignedCount >= Math.ceil(n * 0.7);

  // 极性判定：当前更接近原海报的「集中式」还是「分散式」
  const polarity = isDispersed ? "dispersed" : isConcentrated ? "concentrated" : "broken";

  // 按最高优先级给出单真源白话导演诊单（讲清「为什么观众会读乱」+「动手怎么改」）
  const diagnosis = buildDiagnosis({
    score,
    checks,
    primaryLead,
    redCount: redActors.length,
    weightRatio,
    heightRatio,
    headCollisions,
    coveragePct,
    n,
    greyCount,
    clusters,
    polarity,
    comOffset,
    depthSpread,
    gazeAligned,
  });

  // 对应原海报底部五步「关键要点」的实时达标状态
  const steps = [
    { id: "lead", ok: focalOk, title: "先定主角", en: "DEFINE LEAD" },
    { id: "hierarchy", ok: hierarchyOk, title: "安排层级", en: "BUILD HIERARCHY" },
    { id: "groups", ok: groupingOk, title: "组织队形", en: "ORGANIZE GROUPS" },
    { id: "density", ok: densityOk, title: "控制密度", en: "MANAGE DENSITY" },
    { id: "gaze", ok: gazeAligned && focalOk, title: "引导视线", en: "GUIDE VIEW" },
  ];

  return {
    projected,
    drawOrder,
    primaryLead,
    score,
    checks,
    steps,
    polarity,
    metrics: {
      count: n,
      coveragePct,
      weightRatio,
      heightRatio,
      headBandSpread,
      depthSpread,
      gapCV,
      clustersCount: clusters.length,
      corridors,
      clusters,
      headCollisions,
      headCollisionPairs,
      greyCount,
      greyRatio,
      comX,
      comOffset,
      gazeAligned,
    },
    diagnosis,
  };
}

function buildDiagnosis(d) {
  if (d.score === 5) {
    if (d.polarity === "dispersed") {
      return {
        badge: "5/5 · 分散式成立",
        headline: `1 位朱红主角领衔，${d.clusters.length} 个子群落疏密透气`,
        why: `画面实绘覆盖率 ${d.coveragePct}%、主次权重差 ${d.weightRatio.toFixed(2)}×，${d.greyCount} 位暖灰退景人物压住了色彩噪音。观众先落到信号朱红主角，再顺着群落间走廊扫视其余阵营，既有环境空间感又一眼读懂人物关系。`,
        action: "你已达成「分散式」合法解！也可以向左推低聚散滑杆，体会「集中凝聚式」如何把能量拧成一股。",
        fixPreset: null,
        fixLabel: "对比集中凝聚解",
        fixTarget: "poster",
      };
    }
    return {
      badge: "5/5 · 集中式成立",
      headline: `金字塔层级立稳，${d.count} 人合为一股视觉力量`,
      why: `主角以 ${d.weightRatio.toFixed(2)}× 视觉权重与 ${d.heightRatio.toFixed(2)}× 身高落差统领全局，白边剪纸层把前中后景切得干脆利落，${d.greyCount} 位暖灰人物主动让出彩度，覆盖率稳在 ${d.coveragePct}% 留足呼吸。`,
      action: "试试向右推开「聚散分布」切到分散多群落，或直接拖动人物与切换预设，观察哪一处一动就会塌掉。",
      fixPreset: null,
      fixLabel: "切换分散三群落",
      fixTarget: "dispersed",
    };
  }

  // 逐级命中当前最致命的几何病灶
  if (d.checks.focal.fault === "multiRed") {
    return {
      badge: `${d.score}/5 · 多红抢戏`,
      headline: `画面里同时站着 ${d.redCount} 位高体量朱红人物，眼球不知先看谁`,
      why: `人眼对高饱和暖红最敏感。当多位体量相近的人物都穿满饱和朱红时，焦点立刻分裂成互相拉扯的几个热点，整幅群像瞬间退回「谁都想当主角」的嘈杂合照。`,
      action: "直接点击画布上多余的红色人物把他们点染为蓝阵、黑支或暖灰，只留 1 位领衔主角（或点击一键校准）。",
      fixPreset: "poster",
      fixLabel: "一键收拢焦点并分层",
    };
  }

  if (d.checks.focal.fault === "leadBlocked") {
    return {
      badge: `${d.score}/5 · 主角被挡`,
      headline: `前景剪影压住了红主角 ${Math.round(Math.max(d.primaryLead.headOccludedRatio, d.primaryLead.occludedRatio) * 100)}% 的画面`,
      why: `前后叠层本是群像制造景深的利器，但前景人物一旦遮住主角的头部或胸肩核心区，主角的视觉权重会瞬间腰斩，观众只能盯着挡路配角的后脑勺。`,
      action: "把挡在前面的深色剪影向左右插空拉开，或把红主角往上提拔高度，让头部与胸肩完整露出。",
      fixPreset: "poster",
      fixLabel: "插空让出主角视野",
    };
  }

  if (d.checks.hierarchy.fault === "flatHeights") {
    return {
      badge: `${d.score}/5 · 等高排队`,
      headline: `${d.count} 位人物头顶拉成一条平线（身高比仅 ${d.heightRatio.toFixed(2)}×）`,
      why: `没有高低差与前后景切分的群像就像「罚站合唱团」：眼睛沿水平线从左扫到右没有任何停顿与纵深，读完十个人也记不住谁是主线人物。`,
      action: "按住主角向上提拔站位，再把几位配角往下拖入前景或退入后景，把高低跨度拉开到 1.45× 以上。",
      fixPreset: "poster",
      fixLabel: "拉开三层高差并校准",
    };
  }

  if (d.checks.rhythm.fault === "headCollision") {
    return {
      badge: `${d.score}/5 · 叠头粘连`,
      headline: `画布里出现 ${d.headCollisions} 处头部重叠压撞，人物轮廓糊成一团`,
      why: `剪影语言最怕「头压头」——两个圆头一旦贴死，观众必须费力拆解谁是谁。304 原海报即便在紧凑的集中式里，也让每个圆头落在相邻两肩的缝隙里。`,
      action: "拖动互相压头的剪影横向错开半个头距，或向右推开「聚散分布」给每张轮廓留出白边缝隙。",
      fixPreset: "poster",
      fixLabel: "错开叠头并理顺层次",
    };
  }

  if (d.checks.density.fault === "overcrowded") {
    const isCovHigh = d.coveragePct > DENSITY_LIMITS.maxCov;
    return {
      badge: `${d.score}/5 · ${isCovHigh ? "过满窒息" : "人多过密"}`,
      headline: isCovHigh
        ? `${d.count} 人占满画面 ${d.coveragePct}% 的面积（上限 ${DENSITY_LIMITS.maxCov}%），整张纸喘不过气`
        : `${d.count} 人同场却仅有 ${d.greyCount} 位退景灰，画面信息密度过载`,
      why: isCovHigh
        ? `群像不是「塞的人越多越热闹」。当剪影实绘覆盖率超过 ${DENSITY_LIMITS.maxCov}%，四周与人物缝隙的负空间被压碎，画面立刻沦为一堵密不透风的色块墙。`
        : `当在场人数达到 ${DENSITY_LIMITS.maxNoGreyCount} 人以上且退景灰少于 ${DENSITY_LIMITS.minGreyForLarge} 位时，几乎每个剪影都在争抢高对比度，观众很难一眼分清主次。`,
      action: `把「在场人数」降到 9–11 人，或把边缘几人点染成暖石灰退入背景，将实绘覆盖率收回 ${DENSITY_LIMITS.minCov}%–${DENSITY_LIMITS.maxCov}%。`,
      fixPreset: "poster",
      fixLabel: "精简人数并留出呼吸",
    };
  }

  if (d.checks.density.fault === "tooSparse") {
    return {
      badge: `${d.score}/5 · 过空散架`,
      headline: `画面覆盖率只剩 ${d.coveragePct}%（下限 ${DENSITY_LIMITS.minCov}%），${d.count} 个小点撑不起群像体量`,
      why: `留白过头同样是错态：人物太少且拉得太散时，彼此间失去了格式塔「邻近性」联系，观众看到的只是几枚互不相干的孤立小人，而不是一个有凝聚力的群像。`,
      action: `把人数加回到 ${DENSITY_LIMITS.minCount + 2}–11 人并向左推回「聚散分布」，让覆盖率回到 ${DENSITY_LIMITS.minCov}% 以上重新建立视觉关联。`,
      fixPreset: "dispersed",
      fixLabel: "补齐群落并恢复体量",
    };
  }

  if (d.checks.density.fault === "chromaOverload") {
    return {
      badge: `${d.score}/5 · 色彩过载`,
      headline: `全员都在高饱和抢话，画面缺少「退景暖灰」降噪层`,
      why: `注意看 304 原海报：11 个人里故意安排了 3 位暖灰剪影。把次要陪衬人物降饱和为中性灰，才能让红、蓝、黑三层色块彼此托举而不打架。`,
      action: "点击画布里 2–3 位边缘配角，把他们点染为「暖石浅灰·退景」层，画面瞬间就清爽了。",
      fixPreset: "poster",
      fixLabel: "退灰降噪并完成校准",
    };
  }

  if (d.checks.grouping.fault === "picketFence") {
    return {
      badge: `${d.score}/5 · 一字栅栏`,
      headline: `人物间距死板均分，既没聚成整体，也没分成小组`,
      why: `按格式塔邻近原则，间距完全相等时大脑读不出亲疏关系——谁和谁是一伙、谁在倾听谁全都消失了，只剩一条机械栅栏。`,
      action: "向左推低「聚散分布」聚成金字塔，或直接拖动左右几人拉出「组内紧、组间松」的 2–3 个小群落。",
      fixPreset: "dispersed",
      fixLabel: "按关系分出三群落",
    };
  }

  if (d.checks.grouping.fault === "offBalance") {
    const side = d.comOffset > 0 ? "右侧" : "左侧";
    return {
      badge: `${d.score}/5 · 重心偏沉`,
      headline: `视觉重量向${side}沉了 ${Math.round(Math.abs(d.comOffset) * 100)}%，另一边空塌了`,
      why: `即便采用不对称分散式，画面左右仍需要视觉配重。全员堆向一侧会让画框像失衡的跷跷板一样倾翻。`,
      action: `把 2–3 位配角拖向对侧形成轻巧配重，或把主角略微移回中轴附近。`,
      fixPreset: "confrontation",
      fixLabel: "摆出双翼配重平衡",
    };
  }

  if (d.checks.focal.fault === "leadEdge") {
    return {
      badge: `${d.score}/5 · 主角贴边`,
      headline: `核心主角被挤到画框边缘（X ${Math.round(d.primaryLead.effX * 100)}%），视觉重心滑出去了`,
      why: `主角靠边过近会被边框切迫，周围配角也失去可环绕的中心锚点。`,
      action: "直接把朱红主角往画面中段或三分线内侧拖回，让配角能从两侧护住他。",
      fixPreset: "poster",
      fixLabel: "将主角请回视觉核心",
    };
  }

  return {
    badge: `${d.score}/5 · 尚需调校`,
    headline: d.checks.hierarchy.fault === "leadOutweighed"
      ? "配角体量压过了红色主角，主次关系倒挂"
      : d.checks.rhythm.fault === "flatDepth"
      ? "所有人物站在同一浅平面上，缺少前中后景纵深"
      : "人物层级与群落边界还不够清晰，再理一理主次",
    why: `当前主次权重比 ${d.weightRatio.toFixed(2)}×、覆盖率 ${d.coveragePct}%、群落数 ${d.clusters.length} 组。按原海报口诀：先定唯一主角，再拉开三层高差，最后用退景灰和分组留白清场。`,
    action: "拖动人物调高差与分组，或轻点合法解预设按钮，直接观察三套成立的群像结构。",
    fixPreset: "poster",
    fixLabel: "一键套用原海报经典解",
  };
}

// 211 解构网格 · 单真源几何与诊判引擎
// 画布绘制、顶沿四符图例、三步视觉重构带、右侧单真源诊单、底部四栏核心逻辑
// 全部读取同一份 computeLayout(state) 实绘几何输出，绝无硬编码常量。

import { PALETTE } from "./palette.js";

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报构成",
    headlineBold: ["STRUCTURE", "IS FLEXIBLE,"],
    headlineLight: ["MEANING", "IS NOT."],
    subTag: "NO.211 · 5×5 FAULT PLATE",
    zhNote: "结构可变，意义不变",
    accentNote: "01–04",
  },
  biennale: {
    id: "biennale",
    label: "建筑双年展",
    headlineBold: ["FORM", "FRACTURES,"],
    headlineLight: ["SPACE", "HOLDS."],
    subTag: "VOID ARCHITECTURE · 10.12–11.20",
    zhNote: "空隙建筑双年展 · 主视觉",
    accentNote: "HALL B",
  },
  sonic: {
    id: "sonic",
    label: "实验音像刊",
    headlineBold: ["BREAK", "THE GRID,"],
    headlineLight: ["KEEP THE", "SIGNAL."],
    subTag: "ISSUE 09 · NONLINEAR PRINT",
    zhNote: "非线性音像特刊 · 封面版",
    accentNote: "VOL.09",
  },
};

// 开场刻意停在「过度粉碎 · 语义被压埋 · 重心倾覆」的典型反面误用态
export const START_STATE = {
  theme: "poster",
  fragments: 9,
  cutX: 0.5,
  cutY: 0.5,
  slip: 0.86,
  layerMode: "buried",
  balanceMode: "piled",
  showGhosts: true,
  showFlow: true,
};

// 多组合法解与三组教学试错态
export const PRESETS = {
  // 合法解 1：1:1 忠实 211 原海报四象限非对称断层构成
  posterSol: {
    label: "原海报重构解",
    kind: "good",
    patch: {
      fragments: 4,
      cutX: 0.63,
      cutY: 0.42,
      slip: 0.48,
      layerMode: "elevated",
      balanceMode: "poster",
    },
  },
  // 合法解 2：双片建筑纵切大留白解
  duoSol: {
    label: "双片留白解",
    kind: "good",
    patch: {
      fragments: 2,
      cutX: 0.61,
      cutY: 0.44,
      slip: 0.44,
      layerMode: "elevated",
      balanceMode: "minimal",
    },
  },
  // 合法解 3：对角剪力杂志跨页解
  diagSol: {
    label: "对角压舱解",
    kind: "good",
    patch: {
      fragments: 4,
      cutX: 0.37,
      cutY: 0.58,
      slip: 0.56,
      layerMode: "elevated",
      balanceMode: "diagonal",
    },
  },
  // 反错 1：退回 0% 完整未拆网格（双向试错的另一极）
  errRigid: {
    label: "试错：锁回整网",
    kind: "bad",
    patch: {
      fragments: 1,
      cutX: 0.5,
      cutY: 0.5,
      slip: 0.0,
      layerMode: "elevated",
      balanceMode: "poster",
    },
  },
  // 反错 2：正中均切 + 语义拍平
  errSym: {
    label: "试错：对称拍平",
    kind: "bad",
    patch: {
      fragments: 4,
      cutX: 0.5,
      cutY: 0.5,
      slip: 0.48,
      layerMode: "flat",
      balanceMode: "poster",
    },
  },
  // 反错 3：复原开场过度粉碎
  errChaos: {
    label: "复原粉碎错态",
    kind: "reset",
    patch: {
      fragments: START_STATE.fragments,
      cutX: START_STATE.cutX,
      cutY: START_STATE.cutY,
      slip: START_STATE.slip,
      layerMode: START_STATE.layerMode,
      balanceMode: START_STATE.balanceMode,
    },
  },
};

export function createInitialState() {
  return { ...START_STATE };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function rectIntersectArea(a, b) {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  if (x1 <= x0 || y1 <= y0) return 0;
  return (x1 - x0) * (y1 - y0);
}

function rectIntersectBox(a, b) {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  if (x1 <= x0 || y1 <= y0) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// 48×40 覆盖栅格实测版面净留白率（单真源，不靠估算）
const RASTER_W = 48;
const RASTER_H = 40;

function computeFreeSpacePct(plate, items) {
  let occupied = 0;
  const total = RASTER_W * RASTER_H;
  for (let iy = 0; iy < RASTER_H; iy++) {
    const py = plate.y + ((iy + 0.5) / RASTER_H) * plate.h;
    for (let ix = 0; ix < RASTER_W; ix++) {
      const px = plate.x + ((ix + 0.5) / RASTER_W) * plate.w;
      let hit = false;
      for (let k = 0; k < items.length; k++) {
        const r = items[k];
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
          hit = true;
          break;
        }
      }
      if (hit) occupied++;
    }
  }
  return Math.round(((total - occupied) / total) * 100);
}

// 判定 4 节点阅读动线是否出现来回交叉/逆行折返
function countFlowReversals(nodes) {
  let rev = 0;
  // 检测相邻段夹角是否出现剧烈折返（余弦 < -0.55）或首尾跳返压回原点
  for (let i = 1; i < nodes.length - 1; i++) {
    const ax = nodes[i].x - nodes[i - 1].x;
    const ay = nodes[i].y - nodes[i - 1].y;
    const bx = nodes[i + 1].x - nodes[i].x;
    const by = nodes[i + 1].y - nodes[i].y;
    const la = Math.hypot(ax, ay) || 1e-4;
    const lb = Math.hypot(bx, by) || 1e-4;
    const cos = (ax * bx + ay * by) / (la * lb);
    if (cos < -0.58) rev++;
  }
  return rev;
}

/**
 * 核心单真源几何解算函数
 * 输入 state，输出归一化 [0..1]×[0..1] 制图版面中的所有实绘碎片、色块、
 * 核心语义板、断层切线、遮挡交集框、阅读路径节点与实测诊断。
 */
export function computeLayout(state) {
  const theme = THEMES[state.theme] || THEMES.poster;
  const fragments = state.fragments;
  const slip = clamp(state.slip, 0, 1);
  const cutX = clamp(state.cutX, 0.28, 0.72);
  const cutY = clamp(state.cutY, 0.28, 0.72);

  // 基础 5×5 原始建筑底网区域（留出外围扩展线与错位余量）
  const baseGrid = { x: 0.14, y: 0.11, w: 0.72, h: 0.76 };
  const plate = { x: 0.04, y: 0.04, w: 0.92, h: 0.92 };

  // 1. 生成被断层切分后的真实网格板块 (shards)
  const shards = [];
  const gx0 = baseGrid.x;
  const gy0 = baseGrid.y;
  const gw = baseGrid.w;
  const gh = baseGrid.h;

  // 断层切口世界坐标
  const faultX = gx0 + gw * cutX;
  const faultY = gy0 + gh * cutY;

  if (fragments === 1) {
    shards.push({
      id: "S0",
      label: "完整 5×5",
      origRect: { ...baseGrid },
      rect: { ...baseGrid },
      dx: 0,
      dy: 0,
      cols: 5,
      rows: 5,
      angle: 0,
    });
  } else if (fragments === 2) {
    // 单条纵向断层：左片与右片沿竖缝上下错滑并略微拉缝
    const gapX = slip * 0.068;
    const shearY = slip * 0.116;
    const leftW = gw * cutX;
    const rightW = gw * (1 - cutX);
    const leftOrig = { x: gx0, y: gy0, w: leftW, h: gh };
    const rightOrig = { x: gx0 + leftW, y: gy0, w: rightW, h: gh };
    shards.push(
      {
        id: "W",
        label: "左板块",
        origRect: leftOrig,
        rect: { x: leftOrig.x - gapX * 0.65, y: leftOrig.y + shearY * 0.48, w: leftW, h: gh },
        dx: -gapX * 0.65,
        dy: shearY * 0.48,
        cols: Math.max(2, Math.round(5 * cutX)),
        rows: 5,
        angle: 0,
      },
      {
        id: "E",
        label: "右板块",
        origRect: rightOrig,
        rect: { x: rightOrig.x + gapX * 0.75, y: rightOrig.y - shearY * 0.56, w: rightW, h: gh },
        dx: gapX * 0.75,
        dy: -shearY * 0.56,
        cols: Math.max(2, 5 - Math.round(5 * cutX)),
        rows: 5,
        angle: 0,
      }
    );
  } else if (fragments === 4) {
    // 211 原海报结构：横纵双断层劈出 NW / NE / SW / SE 四块独立网格板块
    // 每块沿断层轴错位滑移，同时在水平/垂直方向保留隐形对齐回声
    const sx = slip * 0.072;
    const sy = slip * 0.076;
    const wL = gw * cutX;
    const wR = gw * (1 - cutX);
    const hT = gh * cutY;
    const hB = gh * (1 - cutY);

    const specs = [
      { id: "NW", label: "左上片", orig: { x: gx0, y: gy0, w: wL, h: hT }, dx: -sx * 0.78, dy: -sy * 0.35 },
      { id: "NE", label: "右上片", orig: { x: gx0 + wL, y: gy0, w: wR, h: hT }, dx: sx * 0.92, dy: -sy * 0.92 },
      { id: "SW", label: "左下片", orig: { x: gx0, y: gy0 + hT, w: wL, h: hB }, dx: -sx * 0.24, dy: sy * 0.78 },
      { id: "SE", label: "右下片", orig: { x: gx0 + wL, y: gy0 + hT, w: wR, h: hB }, dx: sx * 0.68, dy: sy * 0.42 },
    ];
    for (const s of specs) {
      shards.push({
        id: s.id,
        label: s.label,
        origRect: s.orig,
        rect: { x: s.orig.x + s.dx, y: s.orig.y + s.dy, w: s.orig.w, h: s.orig.h },
        dx: s.dx,
        dy: s.dy,
        cols: Math.max(2, Math.round((s.orig.w / gw) * 5)),
        rows: Math.max(2, Math.round((s.orig.h / gh) * 5)),
        angle: 0,
      });
    }
  } else {
    // fragments === 9：过度粉碎 3×3 碎块，各片失控乱飞
    const xs = [0, cutX * 0.56, 0.5 + (cutX - 0.5) * 0.4 + 0.19, 1];
    const ys = [0, cutY * 0.56, 0.5 + (cutY - 0.5) * 0.4 + 0.19, 1];
    const jitter = [
      [-1.05, -0.82], [0.22, -1.18], [1.12, -0.58],
      [-1.18, 0.34],  [0.52, -0.28], [1.24, 0.66],
      [-0.78, 1.06],  [0.14, 1.15],  [1.08, 0.96],
    ];
    let idx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const orig = {
          x: gx0 + gw * xs[c],
          y: gy0 + gh * ys[r],
          w: gw * (xs[c + 1] - xs[c]),
          h: gh * (ys[r + 1] - ys[r]),
        };
        const dx = jitter[idx][0] * slip * 0.095;
        const dy = jitter[idx][1] * slip * 0.095;
        shards.push({
          id: `F${idx + 1}`,
          label: `碎片 ${idx + 1}`,
          origRect: orig,
          rect: { x: orig.x + dx, y: orig.y + dy, w: orig.w, h: orig.h },
          dx,
          dy,
          cols: 2,
          rows: 2,
          angle: ((idx % 3) - 1) * slip * 4.5,
        });
        idx++;
      }
    }
  }

  // 取四个方向代表碎片（供色块挂载跟随真实断层运动）
  const pickShard = (pref) => {
    const found = shards.find((s) => s.id === pref);
    if (found) return found;
    if (shards.length === 1) return shards[0];
    if (shards.length === 2) return pref === "NE" || pref === "SE" ? shards[1] : shards[0];
    const map9 = { NW: 0, NE: 2, SW: 6, SE: 8 };
    return shards[map9[pref] ?? 4] || shards[0];
  };
  const sNW = pickShard("NW");
  const sNE = pickShard("NE");
  const sSW = pickShard("SW");
  const sSE = pickShard("SE");

  // 2. 核心银灰语义板（1:1 承袭原海报 "STRUCTURE IS FLEXIBLE, MEANING IS NOT."）
  const mShiftX = fragments === 1 ? 0 : (sSW.dx * 0.35 + (cutX - 0.55) * 0.14);
  const mShiftY = fragments === 1 ? 0 : (sSW.dy * 0.25 + (cutY - 0.45) * 0.1);
  const meaningSizeScale =
    state.layerMode === "elevated" ? 1.0 : state.layerMode === "flat" ? 0.86 : 0.92;
  const mw = 0.375 * meaningSizeScale;
  const mh = 0.37 * meaningSizeScale;
  const mx = clamp(0.28 + mShiftX, 0.12, 0.56);
  const my = clamp(0.37 + mShiftY, 0.22, 0.54);
  const meaningRect = { x: mx, y: my, w: mw, h: mh };
  // 文字净空保护区（内缩一点作为真实文字可读区）
  const protectedRect = {
    x: mx + mw * 0.09,
    y: my + mh * 0.14,
    w: mw * 0.82,
    h: mh * 0.72,
  };
  const meaningZ = state.layerMode === "elevated" ? 30 : state.layerMode === "flat" ? 15 : 5;

  // 3. 建筑功能色块与图元（1:1 原海报视觉词典，随平衡模式与断层真实位移）
  const blocks = [];
  const pushBlock = (id, label, kind, color, rect, zIndex, weight = 1) => {
    blocks.push({
      id,
      label,
      kind,
      color,
      rect,
      zIndex,
      area: rect.w * rect.h,
      weight,
    });
  };

  const buriedShift = state.layerMode === "buried" ? 1 : 0;

  if (state.balanceMode === "poster") {
    // 原海报经典对角压舱：右上青碧大方块 + 左下青碧衬角 + 右中珊瑚方 + 右下珊瑚横条 + 纯黑压舱
    pushBlock(
      "tealMain",
      "青碧主块",
      "rect",
      PALETTE.teal,
      {
        x: clamp(sNE.rect.x + sNE.rect.w * 0.12 - buriedShift * 0.14, 0.08, 0.78),
        y: clamp(sNE.rect.y + 0.02 + buriedShift * 0.24, 0.06, 0.72),
        w: 0.185,
        h: 0.205,
      },
      buriedShift ? 34 : 14,
      1.35
    );
    pushBlock(
      "tealCounter",
      "左下青碧锚",
      "rect",
      PALETTE.tealBright,
      {
        x: clamp(meaningRect.x - 0.062 + sSW.dx * 0.3, 0.06, 0.76),
        y: clamp(meaningRect.y + meaningRect.h - 0.11 + sSW.dy * 0.2, 0.1, 0.82),
        w: 0.115,
        h: 0.175,
      },
      10,
      1.05
    );
    pushBlock(
      "tealChip",
      "中右青碧折角",
      "rect",
      PALETTE.teal,
      {
        x: clamp(sSE.rect.x + sSE.rect.w * 0.18 - buriedShift * 0.16, 0.12, 0.82),
        y: clamp(sSE.rect.y + 0.08, 0.14, 0.76),
        w: 0.082,
        h: 0.14,
      },
      buriedShift ? 32 : 12,
      0.85
    );
    pushBlock(
      "coralChip",
      "珊瑚红方点",
      "rect",
      PALETTE.coral,
      {
        x: clamp(sNE.rect.x + sNE.rect.w * 0.34 - buriedShift * 0.18, 0.1, 0.86),
        y: clamp(sNE.rect.y + sNE.rect.h - 0.03 + buriedShift * 0.12, 0.1, 0.84),
        w: 0.062,
        h: 0.052,
      },
      buriedShift ? 36 : 22,
      1.15
    );
    pushBlock(
      "coralBar",
      "珊瑚红底横条",
      "rect",
      PALETTE.coral,
      {
        x: clamp(meaningRect.x + meaningRect.w * 0.68 - buriedShift * 0.18, 0.12, 0.74),
        y: clamp(meaningRect.y + meaningRect.h + 0.025 - buriedShift * 0.14, 0.18, 0.89),
        w: 0.19,
        h: 0.042,
      },
      buriedShift ? 36 : 22,
      1.15
    );
    pushBlock(
      "blackNotch",
      "纯黑切角锚",
      "rect",
      PALETTE.inkPure,
      {
        x: clamp(sNE.rect.x + sNE.rect.w * 0.12 - buriedShift * 0.14, 0.08, 0.82),
        y: clamp(sNE.rect.y + 0.15 + buriedShift * 0.24, 0.1, 0.82),
        w: 0.056,
        h: 0.075,
      },
      buriedShift ? 38 : 20,
      1.45
    );
    pushBlock(
      "blackBar",
      "右下纯黑压舱",
      "rect",
      PALETTE.inkPure,
      {
        x: clamp(sSE.rect.x + sSE.rect.w * 0.42, 0.14, 0.82),
        y: clamp(sSE.rect.y + sSE.rect.h * 0.56, 0.22, 0.88),
        w: 0.135,
        h: 0.052,
      },
      20,
      1.45
    );
  } else if (state.balanceMode === "diagonal") {
    // 合法解方向 B：左上青碧大锚 + 右下珊瑚/黑对角压舱
    pushBlock(
      "tealMain",
      "左上青碧锚",
      "rect",
      PALETTE.teal,
      {
        x: clamp(sNW.rect.x + 0.02 + buriedShift * 0.22, 0.06, 0.72),
        y: clamp(sNW.rect.y + 0.02 + buriedShift * 0.28, 0.06, 0.72),
        w: 0.19,
        h: 0.19,
      },
      buriedShift ? 34 : 14,
      1.35
    );
    pushBlock(
      "coralBar",
      "右下珊瑚横条",
      "rect",
      PALETTE.coral,
      {
        x: clamp(sSE.rect.x + sSE.rect.w * 0.12 - buriedShift * 0.2, 0.12, 0.74),
        y: clamp(sSE.rect.y + sSE.rect.h * 0.58 - buriedShift * 0.22, 0.18, 0.88),
        w: 0.20,
        h: 0.048,
      },
      buriedShift ? 36 : 22,
      1.2
    );
    pushBlock(
      "blackNotch",
      "左上纯黑切块",
      "rect",
      PALETTE.inkPure,
      {
        x: clamp(sNW.rect.x + 0.15 + buriedShift * 0.18, 0.08, 0.82),
        y: clamp(sNW.rect.y + 0.14 + buriedShift * 0.24, 0.1, 0.82),
        w: 0.06,
        h: 0.07,
      },
      buriedShift ? 38 : 20,
      1.45
    );
    pushBlock(
      "blackBar",
      "右下纯黑压舱",
      "rect",
      PALETTE.inkPure,
      {
        x: clamp(sSE.rect.x + sSE.rect.w * 0.34, 0.14, 0.82),
        y: clamp(sSE.rect.y + sSE.rect.h * 0.32, 0.22, 0.86),
        w: 0.13,
        h: 0.056,
      },
      20,
      1.4
    );
    pushBlock(
      "coralChip",
      "右上珊瑚标点",
      "rect",
      PALETTE.coral,
      {
        x: clamp(sNE.rect.x + sNE.rect.w * 0.45, 0.14, 0.86),
        y: clamp(sNE.rect.y + 0.08, 0.08, 0.82),
        w: 0.058,
        h: 0.052,
      },
      22,
      1.0
    );
  } else if (state.balanceMode === "minimal") {
    // 合法解方向 C：极简双块留白建筑解（大留白 + 一青一黑一珊瑚精确呼应）
    pushBlock(
      "tealMain",
      "青碧纵柱",
      "rect",
      PALETTE.teal,
      {
        x: clamp(sNE.rect.x + sNE.rect.w * 0.26 - buriedShift * 0.2, 0.1, 0.78),
        y: clamp(sNE.rect.y + 0.05 + buriedShift * 0.26, 0.06, 0.74),
        w: 0.145,
        h: 0.22,
      },
      buriedShift ? 34 : 14,
      1.3
    );
    pushBlock(
      "coralBar",
      "珊瑚红细杠",
      "rect",
      PALETTE.coral,
      {
        x: clamp(meaningRect.x - 0.045 + buriedShift * 0.15, 0.07, 0.76),
        y: clamp(meaningRect.y + meaningRect.h + 0.025 - buriedShift * 0.18, 0.18, 0.88),
        w: 0.17,
        h: 0.038,
      },
      buriedShift ? 36 : 22,
      1.15
    );
    pushBlock(
      "blackNotch",
      "纯黑锚块",
      "rect",
      PALETTE.inkPure,
      {
        x: clamp(sSW.rect.x + 0.05, 0.08, 0.82),
        y: clamp(sSW.rect.y + sSW.rect.h - 0.12, 0.12, 0.84),
        w: 0.085,
        h: 0.062,
      },
      20,
      1.45
    );
  } else {
    // "piled"：失衡错态 — 色块集中扎堆右侧并向中央语义板侵压
    const crush = state.layerMode === "buried" ? 1 : 0.35;
    pushBlock(
      "tealMain",
      "失控青碧块",
      "rect",
      PALETTE.teal,
      {
        x: clamp(meaningRect.x + meaningRect.w * (0.56 + (1 - crush) * 0.42), 0.14, 0.74),
        y: clamp(meaningRect.y - 0.02 + crush * 0.04, 0.08, 0.72),
        w: 0.22,
        h: 0.24,
      },
      state.layerMode === "buried" ? 36 : 14,
      1.65
    );
    pushBlock(
      "coralBar",
      "侵入珊瑚条",
      "rect",
      PALETTE.coral,
      {
        x: clamp(meaningRect.x + meaningRect.w * (0.34 + (1 - crush) * 0.62), 0.14, 0.72),
        y: clamp(meaningRect.y + meaningRect.h * (0.55 - (1 - crush) * 0.16), 0.16, 0.84),
        w: 0.24,
        h: 0.072,
      },
      state.layerMode === "buried" ? 38 : 22,
      1.45
    );
    pushBlock(
      "coralChip",
      "右侧珊瑚块",
      "rect",
      PALETTE.coral,
      {
        x: 0.79,
        y: 0.22,
        w: 0.105,
        h: 0.09,
      },
      22,
      1.4
    );
    pushBlock(
      "blackNotch",
      "右侧黑块 A",
      "rect",
      PALETTE.inkPure,
      {
        x: 0.76,
        y: 0.58,
        w: 0.14,
        h: 0.10,
      },
      20,
      1.85
    );
    pushBlock(
      "blackBar",
      "右侧黑块 B",
      "rect",
      PALETTE.inkPure,
      {
        x: 0.72,
        y: 0.74,
        w: 0.18,
        h: 0.072,
      },
      20,
      1.85
    );
  }

  // 原海报标志空心校准圆 + 右侧虚线 X 框（作为建筑构图基准母题，不计入色块遮挡）
  const calibCircle = {
    cx: clamp(faultX - 0.05 + (sNW.dx + sNE.dx) * 0.35, 0.24, 0.74),
    cy: clamp(faultY - 0.09 + sNW.dy * 0.5, 0.18, 0.56),
    r: 0.078,
  };
  const crossBox = {
    x: clamp(sSE.rect.x + sSE.rect.w * 0.38, 0.66, 0.82),
    y: clamp(sNE.rect.y + sNE.rect.h * 0.54, 0.28, 0.62),
    w: 0.12,
    h: 0.18,
  };

  // 4. 单真源精确几何实测
  // (a) 语义板遮挡率：仅统计图层在语义板之上/平级且与 protectedRect 真实相交的色块
  let occludedArea = 0;
  const collisions = [];
  for (const b of blocks) {
    if (b.zIndex >= meaningZ) {
      const box = rectIntersectBox(protectedRect, b.rect);
      if (box) {
        occludedArea += box.w * box.h;
        collisions.push({ blockId: b.id, label: b.label, box });
      }
    }
  }
  const protectedArea = protectedRect.w * protectedRect.h;
  const occlusionPct = Math.min(100, Math.round((occludedArea / protectedArea) * 100));

  // (b) 实测断层位移率（所有碎片相对原格平均位移占底网宽百分比）
  const avgDisp =
    shards.reduce((acc, s) => acc + Math.hypot(s.dx, s.dy), 0) / Math.max(1, shards.length);
  const slipRatioPct = Math.round((avgDisp / baseGrid.w) * 100);

  // (c) 实测切口非对称度（离 50% 中轴的距离）
  const asymX = Math.abs(cutX - 0.5);
  const asymY = fragments >= 4 ? Math.abs(cutY - 0.5) : asymX;
  const asymmetryPct = Math.round(Math.max(asymX, asymY) * 200); // 0% = 正中均切，44% = 强非对称

  // (d) 48×40 覆盖栅格实测净留白率（语义板 + 所有实心色块 + 右侧交叉框占幅，不含纯虚线底网）
  const solidRects = [meaningRect, crossBox, ...blocks.map((b) => b.rect)];
  const freeSpacePct = computeFreeSpacePct(plate, solidRects);

  // (e) 视觉重心偏移（色块面积×权重 + 语义板综合重心相对画幅光学中心 [0.50, 0.49]）
  let sumW = 0;
  let sumX = 0;
  let sumY = 0;
  const addMass = (rect, factor) => {
    const m = rect.w * rect.h * factor;
    sumW += m;
    sumX += (rect.x + rect.w * 0.5) * m;
    sumY += (rect.y + rect.h * 0.5) * m;
  };
  addMass(meaningRect, state.layerMode === "elevated" ? 0.9 : 0.65);
  for (const b of blocks) addMass(b.rect, b.weight * 1.45);
  const comX = sumW > 0 ? sumX / sumW : 0.5;
  const comY = sumW > 0 ? sumY / sumW : 0.49;
  const comMag = Math.hypot(comX - 0.5, comY - 0.49);
  const comOffsetPct = Math.round(comMag * 100);

  // (f) 非线性阅读路径 4 节点（按真实视觉权重排序）
  const tealMain = blocks.find((b) => b.id === "tealMain") || blocks[0];
  const coralMain = blocks.find((b) => b.id === "coralBar") || blocks[1] || tealMain;
  const blackMain = blocks.find((b) => b.id === "blackBar" || b.id === "blackNotch") || blocks[blocks.length - 1];

  const centerOf = (r) => ({ x: r.x + r.w * 0.5, y: r.y + r.h * 0.5 });
  const flowNodes =
    state.layerMode === "buried"
      ? [
          { step: 1, tag: "抢眼色块", ...centerOf(tealMain.rect) },
          { step: 2, tag: "冲突红条", ...centerOf(coralMain.rect) },
          { step: 3, tag: "被压主标", ...centerOf(meaningRect) },
          { step: 4, tag: "偏沉黑块", ...centerOf(blackMain.rect) },
        ]
      : [
          { step: 1, tag: "核心语义", ...centerOf(meaningRect) },
          { step: 2, tag: "青碧主势", ...centerOf(tealMain.rect) },
          { step: 3, tag: "珊瑚转折", ...centerOf(coralMain.rect) },
          { step: 4, tag: "纯黑压舱", ...centerOf(blackMain.rect) },
        ];
  const flowReversals = countFlowReversals(flowNodes);

  // 5. 七类双向失误单真源判定
  const issues = [];
  if (occlusionPct > 3) {
    issues.push({
      id: "occluded",
      badge: `压字 ${occlusionPct}%`,
      title: `色块压盖核心语义区 ${occlusionPct}%，结构破坏了可读性`,
      reason:
        "解构网格的底线是「结构可变，意义不变」。当青碧或珊瑚色块覆盖住核心标题，读者第一眼看到的不是信息，而是撞在一起的噪点。",
      action: "把「语义层级」抬升到「破层凌驾」，让银灰语义板脱离碎片掩埋。",
      fixLabel: "抬升语义板破层",
      fixPatch: { layerMode: "elevated" },
    });
  }
  if (fragments === 1 || slipRatioPct < 4) {
    issues.push({
      id: "rigid",
      badge: fragments === 1 ? "未拆整网" : `错位 ${slipRatioPct}%`,
      title:
        fragments === 1
          ? "5×5 网格保持完整未拆，尚未进入解构状态"
          : `断层错位仅 ${slipRatioPct}%，仍停在平淡表格感`,
      reason:
        "不切开底层骨架、也不拉开断层滑移，页面就只是规矩的模块化网格（196），缺乏解构网格应有的非对称张力与阅读节奏变化。",
      action: "切换到「4 片断层」或「2 片纵切」，并在画布上向右横拖拉开断层错位。",
      fixLabel: "切开 4 片非对称断层",
      fixPatch: {
        fragments: 4,
        cutX: Math.abs(cutX - 0.5) < 0.06 ? 0.63 : cutX,
        cutY: Math.abs(cutY - 0.5) < 0.06 ? 0.42 : cutY,
        slip: 0.48,
      },
    });
  }
  if (fragments === 9) {
    issues.push({
      id: "shattered",
      badge: "9 片碎裂",
      title: "网格被切得过碎（9 块散片），骨架彻底解体",
      reason:
        "新手最常把「解构」误当成「砸碎」。切成 9 块小碎屑后，每块都带不动大块留白与对齐回声，眼睛在碎线之间无处落脚。",
      action: "把切分档位收束到「4 片断层」或「2 片纵切」，保留成片的建筑尺度。",
      fixLabel: "收束为 4 片断层",
      fixPatch: { fragments: 4, cutX: 0.63, cutY: 0.42 },
    });
  }
  if (slipRatioPct > 11 && fragments !== 1) {
    issues.push({
      id: "overSlipped",
      badge: `飞散 ${slipRatioPct}%`,
      title: `断层滑移过猛（平均位移 ${slipRatioPct}%），板块断联飞散`,
      reason:
        "位移超过合理张力带后，原本共享的网格隐形延伸线全部断掉，板块之间不再有呼应关系，视线跨越宽沟时节奏断裂。",
      action: "在画布上向左回拖，把断层滑移收回到 35%–65% 的可控张力带。",
      fixLabel: "拉回可控断层带",
      fixPatch: { slip: 0.48 },
    });
  }
  if (fragments >= 4 && Math.abs(cutX - 0.5) < 0.055 && Math.abs(cutY - 0.5) < 0.055) {
    issues.push({
      id: "symmetricCut",
      badge: "对称均切",
      title: "横纵断层都压在正中 50%，四象限重量雷同",
      reason:
        "一刀正中对半切分依然在延续对称惯性，四个板块面积接近，难以建立清晰的主次体量反差。",
      action: "直接拖动画布中的青色横/纵断层切刀偏离中心，拉出约 6:4 非对称比例。",
      fixLabel: "移至非对称黄金切口",
      fixPatch: { cutX: 0.63, cutY: 0.42 },
    });
  }
  if (state.layerMode !== "elevated" && occlusionPct <= 3) {
    issues.push({
      id: "flatHierarchy",
      badge: "层级拍平",
      title: "核心语义板与底层断网拍平，第一眼抓不住主语",
      reason:
        "拆散网格后如果文字区没有更强的尺度、留白护城框与前台层级，读者的视线会被四周的青红几何块拉散。",
      action: "把「语义层级」切至「破层凌驾」，让主信息明确压住底网成为第一落点。",
      fixLabel: "开启破层主次层级",
      fixPatch: { layerMode: "elevated" },
    });
  }
  if (comOffsetPct >= 14 || state.balanceMode === "piled") {
    issues.push({
      id: "unbalanced",
      badge: `重心偏 ${comOffsetPct}%`,
      title: `色块扎堆单侧（重心偏移 ${comOffsetPct}%），拆开后未重构平衡`,
      reason:
        "解构的后半句是「重构平衡」。青、红、黑三组视觉重量挤在同一侧时，整张版面会向右倾倒，左侧空洞失重。",
      action: "将「压舱重构」切换为「原海报对角」「双轴对角」或「极简双锚」，重建对角压舱。",
      fixLabel: "建立对角压舱平衡",
      fixPatch: { balanceMode: "poster" },
    });
  }
  if (freeSpacePct < 24 || freeSpacePct > 86) {
    issues.push({
      id: "spaceOff",
      badge: `留白 ${freeSpacePct}%`,
      title: freeSpacePct < 24 ? `净留白仅 ${freeSpacePct}%，断片堵死呼吸` : `净留白高达 ${freeSpacePct}%，画面空散无力`,
      reason: "解构网格依靠留白在碎片之间形成停顿节奏；过堵会闷窒，过空则形不成张力对话。",
      action: "调回 4 片断层并配置对角压舱色块，使净留白保持在舒适呼吸带。",
      fixLabel: "恢复均衡留白",
      fixPatch: { fragments: 4, slip: 0.48, balanceMode: "poster", layerMode: "elevated" },
    });
  }

  const ok = issues.length === 0;
  let solutionName = "待重构校准";
  let tensionTier = "失序混乱（示意）";
  if (ok) {
    if (fragments === 2) solutionName = "双片建筑留白解";
    else if (state.balanceMode === "diagonal") solutionName = "对角剪力重构解";
    else if (state.balanceMode === "minimal") solutionName = "极简双锚呼吸解";
    else solutionName = "原海报非对称重构解";
    tensionTier = slipRatioPct >= 7 ? "高张力平衡（示意）" : "克制错层（示意）";
  } else if (fragments === 1 || slipRatioPct < 4) {
    tensionTier = "僵硬锁网（示意）";
  } else if (occlusionPct > 3) {
    tensionTier = "语义受损（示意）";
  }

  // 四枚原海报核心逻辑实况灯（严格对应 01 分解 / 02 非线性 / 03 层级重叠 / 04 重构秩序）
  const logicStatus = [
    {
      num: "01",
      key: "fragment",
      ok: fragments === 2 || fragments === 4,
      tag:
        fragments === 1
          ? "未拆整网"
          : fragments === 9
          ? "9 片过碎"
          : `${fragments} 片断层`,
    },
    {
      num: "02",
      key: "nonlinear",
      ok:
        slipRatioPct >= 4 &&
        slipRatioPct <= 11 &&
        !(fragments >= 4 && Math.abs(cutX - 0.5) < 0.055 && Math.abs(cutY - 0.5) < 0.055),
      tag:
        slipRatioPct < 4
          ? `错位 ${slipRatioPct}% 过小`
          : slipRatioPct > 11
          ? `位移 ${slipRatioPct}% 飞散`
          : fragments >= 4 && Math.abs(cutX - 0.5) < 0.055 && Math.abs(cutY - 0.5) < 0.055
          ? "正中均切"
          : `滑移 ${slipRatioPct}% · 非对称`,
    },
    {
      num: "03",
      key: "hierarchy",
      ok: occlusionPct <= 3 && state.layerMode === "elevated",
      tag:
        occlusionPct > 3
          ? `压字 ${occlusionPct}%`
          : state.layerMode !== "elevated"
          ? "层级拍平"
          : "0% 遮挡 · 破层",
    },
    {
      num: "04",
      key: "reconstruct",
      ok: comOffsetPct < 14 && state.balanceMode !== "piled" && freeSpacePct >= 24 && freeSpacePct <= 86,
      tag:
        comOffsetPct >= 14 || state.balanceMode === "piled"
          ? `重心偏 ${comOffsetPct}%`
          : `留白 ${freeSpacePct}% · 稳`,
    },
  ];

  // 当前所处原海报「视觉重构示意」三阶段索引（0 完整整网 / 1 分解错位 / 2 重构秩序）
  const reconStage =
    fragments === 1 || slipRatioPct < 4 ? 0 : ok ? 2 : 1;

  return {
    theme,
    baseGrid,
    plate,
    faultX,
    faultY,
    shards,
    meaningPlane: {
      rect: meaningRect,
      protectedRect,
      zIndex: meaningZ,
      layerMode: state.layerMode,
    },
    blocks,
    calibCircle,
    crossBox,
    collisions,
    flowNodes,
    metrics: {
      fragments,
      slipRatioPct,
      asymmetryPct,
      occlusionPct,
      freeSpacePct,
      comX,
      comY,
      comOffsetPct,
      flowReversals,
      tensionTier,
    },
    ok,
    solutionName,
    issues,
    primaryIssue: issues[0] || null,
    logicStatus,
    reconStage,
  };
}

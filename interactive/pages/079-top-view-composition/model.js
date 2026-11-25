// 079 顶视构图 · 单真源几何、3D 俯拍投影与构图评判模型
// 所有读数、圆度、碰撞净空、重心偏移、光影风险与评注均由当前实绘坐标直接计算，绝无写死常量。

export const MAT_RADIUS = 0.85; // 可摆拍圆台半径（归一化坐标 -1..1）
export const TABLE_MM = 600;    // 示意物理圆台直径 600mm，用于换算直觉净空毫米数

export const THEMES = {
  poster: {
    id: "poster",
    name: "原海报桌面",
    en: "POSTER FLAT-LAY",
    desc: "复刻 079 原海报六件静物：深绿笔记、姜黄相机、绿咖杯、多肉盆栽、圆垫与铅笔。",
    items: [
      { id: "notebook", name: "笔记本", kind: "rect", w: 0.34, h: 0.41, z: 0.055, style: "notebook" },
      { id: "camera", name: "相机", kind: "rect", w: 0.33, h: 0.23, z: 0.085, lensZ: 0.175, lensR: 0.082, style: "camera" },
      { id: "plant", name: "多肉盆栽", kind: "circle", r: 0.195, z: 0.14, style: "plant" },
      { id: "cup", name: "咖啡杯", kind: "circle", r: 0.125, z: 0.165, style: "cup" },
      { id: "coaster", name: "黄圆垫", kind: "circle", r: 0.088, z: 0.015, style: "coaster" },
      { id: "pencil", name: "铅笔", kind: "rect", w: 0.34, h: 0.044, z: 0.025, style: "pencil" },
    ],
  },
  dining: {
    id: "dining",
    name: "餐桌平面图",
    en: "ARCHITECTURAL PLAN",
    desc: "延展原海报左上 PLAN 图解：方桌垫、瓷餐盘、高花瓶、双椅背与餐巾刀叉。",
    items: [
      { id: "table", name: "深绿餐垫", kind: "rect", w: 0.38, h: 0.34, z: 0.03, style: "mat" },
      { id: "plate", name: "瓷餐盘", kind: "circle", r: 0.155, z: 0.045, style: "plate" },
      { id: "vase", name: "高陶瓷瓶", kind: "circle", r: 0.105, z: 0.195, style: "vase" },
      { id: "chairA", name: "北侧椅背", kind: "rect", w: 0.27, h: 0.11, z: 0.16, style: "chair" },
      { id: "chairB", name: "南侧椅背", kind: "rect", w: 0.27, h: 0.11, z: 0.16, style: "chairGold" },
      { id: "cutlery", name: "餐巾刀叉", kind: "rect", w: 0.13, h: 0.28, z: 0.025, style: "cutlery" },
    ],
  },
  knolling: {
    id: "knolling",
    name: "工具拆解台",
    en: "KNOLLING BENCH",
    desc: "致敬克罗梅洛与汤姆·萨克斯的 90° 工具整理：三角尺、胶卷盒、放大镜、量角器、美工刀与胶带。",
    items: [
      { id: "ruler", name: "三角尺", kind: "rect", w: 0.38, h: 0.23, z: 0.025, style: "ruler" },
      { id: "film", name: "胶卷盒", kind: "rect", w: 0.25, h: 0.21, z: 0.125, style: "film" },
      { id: "loupe", name: "放大镜", kind: "circle", r: 0.135, z: 0.165, style: "loupe" },
      { id: "protractor", name: "量角盘", kind: "circle", r: 0.165, z: 0.028, style: "protractor" },
      { id: "knife", name: "美工刀", kind: "rect", w: 0.35, h: 0.064, z: 0.035, style: "knife" },
      { id: "tape", name: "黄胶带", kind: "circle", r: 0.095, z: 0.095, style: "tape" },
    ],
  },
};

// 每套题材的预设摆位：开场故意停在「斜拍+堆挤粘连+长硬影」错态，以及多组合法解与试错态
export const LAYOUTS = {
  broken: {
    label: "开场错态",
    pitchDeg: 52,
    focalMm: 50,
    lightElev: 22,
    lightAzim: 34,
    lightSoft: false,
    poses: {
      poster: [
        { x: -0.38, y: 0.18, rot: -23 },
        { x: -0.18, y: 0.28, rot: 17 },
        { x: 0.04, y: 0.18, rot: 12 },
        { x: -0.46, y: -0.06, rot: -18 },
        { x: -0.10, y: -0.06, rot: 0 },
        { x: -0.26, y: 0.44, rot: -19 },
      ],
      dining: [
        { x: -0.36, y: 0.18, rot: 19 },
        { x: -0.14, y: 0.24, rot: 0 },
        { x: -0.48, y: -0.06, rot: 0 },
        { x: -0.28, y: -0.22, rot: -22 },
        { x: -0.06, y: 0.42, rot: 16 },
        { x: 0.06, y: 0.10, rot: -27 },
      ],
      knolling: [
        { x: -0.36, y: 0.20, rot: -24 },
        { x: -0.14, y: 0.28, rot: 19 },
        { x: -0.48, y: -0.04, rot: 0 },
        { x: 0.04, y: 0.10, rot: 14 },
        { x: -0.24, y: 0.44, rot: -17 },
        { x: -0.12, y: -0.08, rot: 0 },
      ],
    },
  },
  posterSol: {
    label: "原海报解",
    pitchDeg: 90,
    focalMm: 50,
    lightElev: 62,
    lightAzim: 42,
    lightSoft: true,
    poses: {
      poster: [
        { x: -0.39, y: 0.11, rot: -26 },
        { x: 0.09, y: 0.25, rot: 0 },
        { x: 0.47, y: 0.02, rot: 0 },
        { x: -0.44, y: -0.36, rot: -26 },
        { x: 0.36, y: -0.39, rot: 0 },
        { x: 0.16, y: 0.51, rot: -12 },
      ],
      dining: [
        { x: -0.28, y: 0.10, rot: 0 },
        { x: 0.24, y: 0.12, rot: 0 },
        { x: -0.36, y: -0.34, rot: 0 },
        { x: 0.02, y: -0.44, rot: 0 },
        { x: 0.02, y: 0.52, rot: 0 },
        { x: 0.52, y: -0.16, rot: 0 },
      ],
      knolling: [
        { x: -0.28, y: 0.16, rot: 0 },
        { x: 0.18, y: 0.22, rot: 0 },
        { x: -0.38, y: -0.26, rot: 0 },
        { x: 0.36, y: -0.22, rot: 0 },
        { x: 0.00, y: 0.50, rot: 0 },
        { x: 0.02, y: -0.42, rot: 0 },
      ],
    },
  },
  knollSol: {
    label: "90°秩序解",
    pitchDeg: 90,
    focalMm: 85,
    lightElev: 68,
    lightAzim: 45,
    lightSoft: true,
    poses: {
      poster: [
        { x: -0.32, y: 0.12, rot: 0 },
        { x: 0.18, y: 0.20, rot: 0 },
        { x: 0.36, y: -0.24, rot: 0 },
        { x: -0.32, y: -0.34, rot: 0 },
        { x: 0.00, y: -0.34, rot: 0 },
        { x: 0.18, y: 0.48, rot: 0 },
      ],
      dining: [
        { x: 0.00, y: 0.02, rot: 0 },
        { x: 0.46, y: 0.02, rot: 0 },
        { x: -0.44, y: -0.20, rot: 0 },
        { x: 0.00, y: -0.44, rot: 0 },
        { x: 0.00, y: 0.48, rot: 0 },
        { x: -0.44, y: 0.22, rot: 0 },
      ],
      knolling: [
        { x: -0.28, y: 0.16, rot: 0 },
        { x: 0.24, y: 0.16, rot: 0 },
        { x: -0.34, y: -0.26, rot: 0 },
        { x: 0.26, y: -0.26, rot: 0 },
        { x: 0.00, y: 0.48, rot: 0 },
        { x: -0.02, y: -0.44, rot: 0 },
      ],
    },
  },
  editorialSol: {
    label: "留白呼吸解",
    pitchDeg: 90,
    focalMm: 50,
    lightElev: 58,
    lightAzim: 38,
    lightSoft: true,
    poses: {
      poster: [
        { x: -0.22, y: 0.26, rot: 0 },
        { x: 0.24, y: 0.28, rot: 0 },
        { x: 0.38, y: -0.14, rot: 0 },
        { x: -0.04, y: -0.26, rot: 0 },
        { x: -0.38, y: -0.22, rot: 0 },
        { x: 0.04, y: 0.56, rot: 0 },
      ],
      dining: [
        { x: -0.16, y: 0.22, rot: 0 },
        { x: 0.34, y: 0.22, rot: 0 },
        { x: 0.34, y: -0.24, rot: 0 },
        { x: -0.16, y: -0.28, rot: 0 },
        { x: -0.16, y: 0.56, rot: 0 },
        { x: -0.50, y: 0.04, rot: 0 },
      ],
      knolling: [
        { x: -0.18, y: 0.24, rot: 0 },
        { x: 0.28, y: 0.24, rot: 0 },
        { x: 0.34, y: -0.22, rot: 0 },
        { x: -0.18, y: -0.24, rot: 0 },
        { x: 0.04, y: 0.54, rot: 0 },
        { x: -0.50, y: 0.02, rot: 0 },
      ],
    },
  },
};

export function createInitialState(themeId = "poster") {
  const base = LAYOUTS.broken;
  const theme = THEMES[themeId] || THEMES.poster;
  return {
    themeId: theme.id,
    pitchDeg: base.pitchDeg,
    focalMm: base.focalMm,
    lightElev: base.lightElev,
    lightAzim: base.lightAzim,
    lightSoft: base.lightSoft,
    contourMode: false,
    showZone: false,
    showOrder: false,
    selectedIndex: 1, // 默认选中相机/主焦点，方便键盘微调
    items: theme.items.map((spec, i) => ({
      ...spec,
      x: base.poses[theme.id][i].x,
      y: base.poses[theme.id][i].y,
      rot: base.poses[theme.id][i].rot,
    })),
  };
}

export function applyPreset(state, presetKey) {
  const themeId = state.themeId;
  if (presetKey === "errTilt") {
    applyPreset(state, "posterSol");
    state.pitchDeg = 46;
    return;
  }
  if (presetKey === "errWide") {
    applyPreset(state, "posterSol");
    state.pitchDeg = 90;
    state.focalMm = 24;
    return;
  }
  if (presetKey === "errCrowd") {
    applyPreset(state, "posterSol");
    state.items.forEach((it, i) => {
      it.x *= 0.48;
      it.y *= 0.48;
      if (i === 1) { it.x = -0.12; it.y = 0.16; }
    });
    return;
  }
  if (presetKey === "errHollow") {
    applyPreset(state, "posterSol");
    const angles = [-150, -90, -30, 30, 90, 150];
    state.items.forEach((it, i) => {
      const a = (angles[i] * Math.PI) / 180;
      const boundR = it.kind === "circle" ? it.r : Math.hypot(it.w, it.h) * 0.5;
      const ringR = Math.max(0.54, Math.min(0.66, 0.85 - boundR));
      it.x = Math.cos(a) * ringR;
      it.y = Math.sin(a) * ringR;
      it.rot = 0;
    });
    return;
  }
  if (presetKey === "errShadow") {
    applyPreset(state, "posterSol");
    state.lightElev = 18;
    state.lightSoft = false;
    return;
  }
  const p = LAYOUTS[presetKey] || LAYOUTS.broken;
  const poses = p.poses[themeId];
  state.pitchDeg = p.pitchDeg;
  state.focalMm = p.focalMm;
  state.lightElev = p.lightElev;
  state.lightAzim = p.lightAzim;
  state.lightSoft = p.lightSoft;
  state.items.forEach((it, i) => {
    it.x = poses[i].x;
    it.y = poses[i].y;
    it.rot = poses[i].rot;
  });
}

export function switchTheme(state, themeId) {
  const theme = THEMES[themeId] || THEMES.poster;
  state.themeId = theme.id;
  const curEval = evaluate(state);
  const presetKey = curEval.passCount === 4 ? "posterSol" : "broken";
  const poses = LAYOUTS[presetKey].poses[theme.id];
  state.items = theme.items.map((spec, i) => ({
    ...spec,
    x: poses[i].x,
    y: poses[i].y,
    rot: poses[i].rot,
  }));
  state.selectedIndex = 1;
}

// ---------- 真 3D 透视俯拍投影 ----------
// 将台面三维点 (x, y, z) 经俯角 pitchDeg 与焦段 focalMm 投影到 2D 画布归一化平面
export function projectPoint(x, y, z, pitchDeg, focalMm) {
  const a = (pitchDeg * Math.PI) / 180;
  const sinA = Math.sin(a);
  const cosA = Math.cos(a);
  // 俯角造成的纵轴压缩与高物侧壁位移
  const yCam = y * sinA - z * cosA;
  const depthOffset = y * cosA + z * sinA;
  // 焦段越短（24mm）机位越贴近台面，边沿物体越高越向外倾倒
  const D = focalMm / 13.5;
  const scale = D / Math.max(0.55, D - depthOffset);
  return { x: x * scale, y: yCam * scale, scale };
}

// 阴影在桌面平面 (z=0) 上的投影偏移向量
export function shadowVector(z, lightElev, lightAzim) {
  const elev = (Math.max(12, Math.min(88, lightElev)) * Math.PI) / 180;
  const az = (lightAzim * Math.PI) / 180;
  const len = z / Math.tan(elev);
  return { dx: Math.cos(az) * len, dy: Math.sin(az) * len, len };
}

// ---------- 精确 2D 碰撞与最小净空（圆 / 旋转矩形 OBB） ----------
export function itemArea(it) {
  return it.kind === "circle" ? Math.PI * it.r * it.r : it.w * it.h;
}

export function rectCorners(it) {
  const rad = (it.rot * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const hw = it.w / 2;
  const hh = it.h / 2;
  return [
    { x: it.x + (-hw * c - -hh * s), y: it.y + (-hw * s + -hh * c) },
    { x: it.x + (hw * c - -hh * s), y: it.y + (hw * s + -hh * c) },
    { x: it.x + (hw * c - hh * s), y: it.y + (hw * s + hh * c) },
    { x: it.x + (-hw * c - hh * s), y: it.y + (-hw * s + hh * c) },
  ];
}

function pointToSegDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const l2 = vx * vx + vy * vy || 1e-9;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l2));
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
}

function circleRectGap(cir, rect) {
  const rad = (-rect.rot * Math.PI) / 180;
  const dx = cir.x - rect.x;
  const dy = cir.y - rect.y;
  const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
  const hw = rect.w / 2;
  const hh = rect.h / 2;
  const cx = Math.max(-hw, Math.min(hw, lx));
  const cy = Math.max(-hh, Math.min(hh, ly));
  const distOut = Math.hypot(lx - cx, ly - cy);
  if (distOut > 0) return distOut - cir.r;
  // 圆心在矩形内部：负值表示侵入深度
  const pen = Math.min(hw - Math.abs(lx), hh - Math.abs(ly));
  return -(pen + cir.r);
}

function rectRectGap(a, b) {
  const pa = rectCorners(a);
  const pb = rectCorners(b);
  const axes = [];
  for (const poly of [pa, pb]) {
    for (let i = 0; i < 2; i++) {
      const ex = poly[i + 1].x - poly[i].x;
      const ey = poly[i + 1].y - poly[i].y;
      const len = Math.hypot(ex, ey) || 1;
      axes.push({ x: -ey / len, y: ex / len });
    }
  }
  let maxSep = -Infinity;
  for (const ax of axes) {
    let minA = Infinity, maxA = -Infinity;
    let minB = Infinity, maxB = -Infinity;
    for (const p of pa) {
      const v = p.x * ax.x + p.y * ax.y;
      if (v < minA) minA = v;
      if (v > maxA) maxA = v;
    }
    for (const p of pb) {
      const v = p.x * ax.x + p.y * ax.y;
      if (v < minB) minB = v;
      if (v > maxB) maxB = v;
    }
    const sep = Math.max(minB - maxA, minA - maxB);
    if (sep > maxSep) maxSep = sep;
  }
  if (maxSep <= 0) return maxSep; // 重叠
  // 分离时取精确边界最小距离
  let minD = Infinity;
  for (const p of pa) {
    for (let i = 0; i < 4; i++) {
      const q1 = pb[i], q2 = pb[(i + 1) % 4];
      const d = pointToSegDist(p.x, p.y, q1.x, q1.y, q2.x, q2.y);
      if (d < minD) minD = d;
    }
  }
  for (const p of pb) {
    for (let i = 0; i < 4; i++) {
      const q1 = pa[i], q2 = pa[(i + 1) % 4];
      const d = pointToSegDist(p.x, p.y, q1.x, q1.y, q2.x, q2.y);
      if (d < minD) minD = d;
    }
  }
  return minD;
}

export function pairGap(a, b) {
  if (a.kind === "circle" && b.kind === "circle") {
    return Math.hypot(a.x - b.x, a.y - b.y) - (a.r + b.r);
  }
  if (a.kind === "circle" && b.kind === "rect") return circleRectGap(a, b);
  if (a.kind === "rect" && b.kind === "circle") return circleRectGap(b, a);
  return rectRectGap(a, b);
}

export function itemMaxRadius(it) {
  if (it.kind === "circle") return Math.hypot(it.x, it.y) + it.r;
  let m = 0;
  for (const p of rectCorners(it)) {
    const d = Math.hypot(p.x, p.y);
    if (d > m) m = d;
  }
  return m;
}

export function clampItemToMat(it, limit = 0.88) {
  const r = itemMaxRadius(it);
  if (r > limit) {
    const excess = r - limit;
    const len = Math.hypot(it.x, it.y) || 1;
    it.x -= (it.x / len) * excess;
    it.y -= (it.y / len) * excess;
  }
}

export function hitTestItem(items, nx, ny) {
  // 从上层（后绘）往底层测命中
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    if (it.kind === "circle") {
      if (Math.hypot(nx - it.x, ny - it.y) <= it.r + 0.03) return i;
    } else {
      const rad = (-it.rot * Math.PI) / 180;
      const dx = nx - it.x;
      const dy = ny - it.y;
      const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
      if (Math.abs(lx) <= it.w / 2 + 0.03 && Math.abs(ly) <= it.h / 2 + 0.03) return i;
    }
  }
  return -1;
}

// 规范角度偏离最近 90° 轴的误差（0..45°）
function orthoDeviation(deg) {
  const m = ((deg % 90) + 90) % 90;
  return Math.min(m, 90 - m);
}

// ---------- 核心单真源构图诊断 ----------
export function evaluate(state) {
  const { items, pitchDeg, focalMm, lightElev, lightAzim, lightSoft } = state;

  // 1. 平面光学指标（俯角圆度 + 广角外翻）
  const pitchRad = (pitchDeg * Math.PI) / 180;
  const roundnessPct = Math.round(Math.sin(pitchRad) * 100);
  // 边缘高物体 (r=0.55, z=0.16) 的广角径向偏移比例
  const baseProj = projectPoint(0.55, 0, 0, 90, focalMm);
  const topProj = projectPoint(0.55, 0, 0.16, 90, focalMm);
  const radialLeanPct = Math.round(((topProj.x - baseProj.x) / 0.55) * 100);
  const pitchOk = pitchDeg >= 84;
  const lensOk = focalMm >= 45;
  const planOk = pitchOk && lensOk;

  // 2. 轮廓净空与碰撞（严格从当前实绘几何算）
  const overlapPairs = [];
  const crowdedPairs = [];
  let minGap = Infinity;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const g = pairGap(items[i], items[j]);
      if (g < minGap) minGap = g;
      if (g < -0.004) overlapPairs.push([i, j, g]);
      else if (g < 0.022) crowdedPairs.push([i, j, g]);
    }
  }
  const edgeClips = [];
  items.forEach((it, idx) => {
    if (itemMaxRadius(it) > MAT_RADIUS + 0.035) edgeClips.push(idx);
  });
  const minGapMm = Math.round(minGap * (TABLE_MM / 2));
  const contourOk = overlapPairs.length === 0 && crowdedPairs.length === 0 && edgeClips.length === 0;

  // 3. 分区、面积加权重心与疏密分布
  let sumA = 0, sumX = 0, sumY = 0, maxA = 0, minA = Infinity;
  let minCenterDist = Infinity;
  const quadCounts = [0, 0, 0, 0];
  for (const it of items) {
    const a = itemArea(it);
    sumA += a;
    sumX += it.x * a;
    sumY += it.y * a;
    if (a > maxA) maxA = a;
    if (a < minA) minA = a;
    const dc = Math.hypot(it.x, it.y);
    if (dc < minCenterDist) minCenterDist = dc;
    const qi = (it.x >= 0 ? 1 : 0) + (it.y >= 0 ? 2 : 0);
    quadCounts[qi]++;
  }
  const comX = sumX / sumA;
  const comY = sumY / sumA;
  const comOffset = Math.hypot(comX, comY);
  const comOffsetPct = Math.round(comOffset * 100);
  const hollowCenter = minCenterDist > 0.50;
  const activeQuads = quadCounts.filter((c) => c > 0).length;
  const coveragePct = Math.min(99, Math.round((sumA / (Math.PI * MAT_RADIUS * MAT_RADIUS)) * 100));
  const sizeRatio = +(maxA / Math.max(0.001, minA)).toFixed(1);
  const zoneOk = comOffset <= 0.22 && !hollowCenter && activeQuads >= 3;

  // 4. 轴向秩序与阴影清澈度
  const rectItems = items.filter((it) => it.kind === "rect");
  const orthoAlignedCount = rectItems.filter((it) => orthoDeviation(it.rot) <= 8).length;
  // 原海报允许至多 2 件斜角破局（笔记本+铅笔），只要其余主块守正且无全员乱斜
  const messyAngles = rectItems.filter((it) => orthoDeviation(it.rot) > 8).length;
  const angleOk = rectItems.length <= 2 ? messyAngles <= 1 : orthoAlignedCount >= 1 && messyAngles <= 2;

  // 阴影串扰检测：高物体阴影末端是否砸进邻近物体
  let shadowHits = 0;
  let maxShadowLen = 0;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const topZ = it.lensZ || it.z;
    const sv = shadowVector(topZ, lightElev, lightAzim);
    if (sv.len > maxShadowLen) maxShadowLen = sv.len;
    const ghost = { ...it, x: it.x + sv.dx * 0.72, y: it.y + sv.dy * 0.72 };
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      if (pairGap(ghost, items[j]) < -0.025 && !lightSoft && lightElev < 40) {
        shadowHits++;
      }
    }
  }
  const shadowRatio = +(maxShadowLen / 0.175).toFixed(2); // 影长/高物高度比
  const shadowOk = lightElev >= 42 && (lightSoft || lightElev >= 52) && shadowHits === 0;
  const orderOk = angleOk && shadowOk;

  const passCount = [planOk, contourOk, zoneOk, orderOk].filter(Boolean).length;

  // 判定当前命中的首要错态或合法解类型
  let statusCode = "pass";
  let statusBadge = "四维成立";
  let headline = "";
  let body = "";
  let hint = "";
  let fixType = "";
  let fixLabel = "";

  if (!pitchOk) {
    statusCode = "tilt";
    statusBadge = `斜拍 ${pitchDeg}°`;
    headline = `俯角只有 ${pitchDeg}°，圆口被压扁成 ${roundnessPct}% 椭圆`;
    body = "从斜上方俯拍时，杯身、书脊和镜头侧壁都会露出来，三维远近透视仍在抢戏，桌面还没进入「二维平面设计」的语言。";
    hint = "在台面空白处向右横拖，或把「机位俯角」滑轨推到 85°–90° 正顶。";
    fixType = "fixPitch";
    fixLabel = "抬正至 90° 顶视";
  } else if (!lensOk) {
    statusCode = "wide";
    statusBadge = `${focalMm}mm 广角外翻`;
    headline = `虽已 90° 垂直，但 ${focalMm}mm 广角把边沿器物扯斜了 ${radialLeanPct}%`;
    body = "这是顶视实拍最容易踩的光学坑：广角镜头离桌面太近，台面边缘的高物体（杯子、盆栽）依然会向四周外翻露出侧壁。";
    hint = "把「俯视平面」卡里的「镜头焦段」切到 50mm 标准或 85mm 准正交，压平边沿透视。";
    fixType = "fixLens";
    fixLabel = "换用 50mm 标准焦段";
  } else if (overlapPairs.length > 0) {
    const [a, b] = overlapPairs[0];
    statusCode = "overlap";
    statusBadge = `轮廓碰撞 ${overlapPairs.length} 处`;
    headline = `「${items[a].name}」与「${items[b].name}」叠在一起，边界糊成一团`;
    body = "顶视构图靠二维剪影说话。物体一贴死或压盖，观者第一眼读不出各自独立的轮廓，平面节奏瞬间变闷。";
    hint = "直接拖动台面上标红的器物拉开至少 8mm 呼吸缝，或打开「轮廓透视」检查剪影。";
    fixType = "fixSpread";
    fixLabel = "拉开器物轮廓缝";
  } else if (edgeClips.length > 0) {
    statusCode = "edge";
    statusBadge = `压边裁切 ${edgeClips.length} 件`;
    headline = `「${items[edgeClips[0]].name}」顶出圆台边沿，边界被强行切断`;
    body = "平面构图需要稳定的外框呼吸带。器物紧顶画框或被圆沿截断，会让视线滑出画面之外。";
    hint = "把贴边器物往圆台内侧拖回安全圈内。";
    fixType = "fixEdge";
    fixLabel = "收回台面安全圈";
  } else if (crowdedPairs.length > 0) {
    const [a, b] = crowdedPairs[0];
    statusCode = "crowd";
    statusBadge = `净空过窄 ${minGapMm}mm`;
    headline = `「${items[a].name}」离「${items[b].name}」只剩 ${minGapMm}mm，轮廓快粘在一起`;
    body = "虽未完全压叠，但过窄的缝隙在缩略图或手机小屏里会直接粘连成锯齿脏点，削弱平面利落感。";
    hint = "轻轻拖开靠太近的两件器物，让每件物体周围都有喘气白边。";
    fixType = "fixSpread";
    fixLabel = "微调拉开呼吸缝";
  } else if (hollowCenter) {
    statusCode = "hollow";
    statusBadge = "贴边空心";
    headline = "所有器物都退到圆台边沿，中央空成一块死洞";
    body = "留白不是把东西全推到墙角。圆台中心完全失守后，视线只能沿着边圈打转，缺少主视觉落脚点。";
    hint = "把主角（笔记或相机）往中心略偏处拖回，重建「明确重心」。";
    fixType = "fixZone";
    fixLabel = "重建中央视觉重心";
  } else if (!zoneOk) {
    statusCode = "lopsided";
    statusBadge = `重心偏 ${comOffsetPct}%`;
    headline = `视觉重心偏离圆心 ${comOffsetPct}%，台面明显向一侧沉坠`;
    body = "大面积深色与高体量器物全压在同一半区，另一侧变成无呼应的空壳，整张平面像失衡的跷跷板。";
    hint = "把一件中等体量器物拖往对角象限，用「面积 × 距离」把杠杆稳住。";
    fixType = "fixZone";
    fixLabel = "平衡对角视觉重心";
  } else if (!shadowOk) {
    statusCode = "shadow";
    statusBadge = `长硬影 ${shadowRatio}×`;
    headline = `低角 ${lightElev}° 硬光拖出 ${shadowRatio}× 长影，重新把轮廓焊成黑块`;
    body = "就算机位和摆位都对，低角度生硬侧光仍会在白纸台面上泼出杂乱黑影，破坏顶视最珍贵的平面纯净度。";
    hint = "把「分区」卡里的棚灯按钮切回「高柔光」，收短投影长度并柔化边缘。";
    fixType = "fixLight";
    fixLabel = "切回高侧柔光";
  } else if (!angleOk) {
    statusCode = "angle";
    statusBadge = "角度失序";
    headline = "多件方形器物各斜各的，平面秩序感散掉了";
    body = "顶视可以有一两件刻意斜摆的动态点缀，但如果三件以上方向全无规律，画面就会从「有设计的松弛」滑向「随手乱扔」。";
    hint = "选中斜歪的器物点「归正 0°」，建立水平/垂直基准轴。";
    fixType = "fixOrder";
    fixLabel = "归正基准轴向";
  } else {
    // 四维全部通过：识别具体属于哪种合法构图解
    const isStrictKnoll = messyAngles === 0 && focalMm >= 50;
    statusCode = "pass";
    statusBadge = isStrictKnoll ? "成立 · 90°秩序解" : "成立 · 顶视平面解";
    headline = isStrictKnoll
      ? "90° 正交秩序成立：每件器物都化作清晰的二维平面图形"
      : "顶视平面构图成立：重心稳固、轮廓干脆、疏密有节奏";
    body = isStrictKnoll
      ? `俯角 ${pitchDeg}° 配 ${focalMm}mm 焦段把圆口还原至 ${roundnessPct}% 真圆，全部直边守住正交轴，最小呼吸缝 ${minGapMm}mm，呈现典型的 Knolling 平面秩序。`
      : `俯角 ${pitchDeg}° 与 ${focalMm}mm 消除了立面透视干扰，轮廓最小净空 ${minGapMm}mm，重心稳落在距圆心 ${comOffsetPct}% 处，斜角点缀为安静秩序添了灵动节奏。`;
    hint = "可以切开「轮廓透视」检验纯剪影关系，或切换「试错」方案看破坏任一条件会发生什么。";
  }

  return {
    roundnessPct,
    radialLeanPct,
    minGap,
    minGapMm,
    overlapPairs,
    crowdedPairs,
    edgeClips,
    comX,
    comY,
    comOffset,
    comOffsetPct,
    hollowCenter,
    activeQuads,
    coveragePct,
    sizeRatio,
    orthoAlignedCount,
    messyAngles,
    shadowRatio,
    shadowHits,
    pillars: {
      plan: { ok: planOk, badge: planOk ? `${pitchDeg}° · ${focalMm}mm` : !pitchOk ? `斜 ${pitchDeg}°` : `${focalMm}mm 外翻` },
      contour: { ok: contourOk, badge: contourOk ? `净空 ${minGapMm}mm` : overlapPairs.length ? `碰撞 ${overlapPairs.length}` : edgeClips.length ? `压边 ${edgeClips.length}` : `过挤 ${minGapMm}mm` },
      zone: { ok: zoneOk, badge: zoneOk ? `偏心 ${comOffsetPct}%` : hollowCenter ? "中央空洞" : `沉偏 ${comOffsetPct}%` },
      order: { ok: orderOk, badge: orderOk ? (messyAngles === 0 ? "90° 正交" : "主轴稳固") : !shadowOk ? `长影 ${shadowRatio}×` : "角度散乱" },
    },
    keypoints: {
      center: { ok: zoneOk, read: hollowCenter ? "中空" : `偏 ${comOffsetPct}%` },
      density: { ok: contourOk && !hollowCenter, read: overlapPairs.length ? "粘连" : `缝 ${minGapMm}mm` },
      align: { ok: orderOk, read: !shadowOk ? "影乱" : messyAngles === 0 ? "全正交" : angleOk ? "主轴齐" : "散斜" },
      scale: { ok: sizeRatio >= 2.2 && overlapPairs.length === 0, read: `${sizeRatio}× 主次` },
    },
    passCount,
    statusCode,
    statusBadge,
    headline,
    body,
    hint,
    fixType,
    fixLabel,
  };
}

// 逐步修复动作（一次只解当前首要卡点，帮助用户观察每一步变化）
export function applySingleFix(state, fixType) {
  const sol = LAYOUTS.posterSol;
  const poses = sol.poses[state.themeId];
  if (fixType === "fixPitch") {
    state.pitchDeg = 90;
  } else if (fixType === "fixLens") {
    state.focalMm = 50;
  } else if (fixType === "fixLight") {
    state.lightElev = 62;
    state.lightSoft = true;
  } else if (fixType === "fixOrder") {
    state.items.forEach((it, i) => {
      it.rot = poses[i].rot;
    });
  } else if (fixType === "fixSpread" || fixType === "fixEdge" || fixType === "fixZone") {
    state.items.forEach((it, i) => {
      it.x = poses[i].x;
      it.y = poses[i].y;
    });
  }
}

// ---------- 第 06 节：双题单变量盲测练习数据 ----------
export const QUIZ_QUESTIONS = [
  {
    id: "q1",
    tag: "题 1 / 2 · 变量：平面摆位与重心",
    prompt: "四张图全部采用 90° 正顶、50mm 标准焦段与高侧柔光，物体大小完全一致，只改变了桌面摆位。哪一张最符合顶视构图的平面秩序？",
    correct: "D",
    options: [
      {
        key: "A",
        mode: "hollow",
        reason: "六件器物全被推向圆台最外圈，中间空出一整块死洞，视线沿着边缘打转，缺乏明确视觉重心。",
      },
      {
        key: "B",
        mode: "overlap",
        reason: "笔记本、相机与咖啡杯轮廓紧贴压叠，二维剪影粘成一团，丢失了顶视最核心的「清晰边界」。",
      },
      {
        key: "C",
        mode: "lopsided",
        reason: "每件器物之间虽留出了清晰缝隙，但六件物体全沉在左下侧，右上半区大面积空悬，面积重心偏离圆心达 28%，版面像要向左下倾翻。",
      },
      {
        key: "D",
        mode: "good",
        reason: "重心稳落在圆心附近，每件器物之间留出清晰呼吸缝，大块笔记、黄机身与星芒多肉形成清楚的大小与疏密节奏。",
      },
    ],
  },
  {
    id: "q2",
    tag: "题 2 / 2 · 变量：机位光学与布光",
    prompt: "四张图的桌面摆位完全相同，只改变了机位角度、焦段或灯光。哪一张真正拍出了干脆的平面设计感？",
    correct: "B",
    options: [
      {
        key: "A",
        mode: "tilt",
        reason: "机位停在 60° 半斜俯：咖啡杯口被压扁为 87% 椭圆，笔记本侧厚与镜头圆柱露出来，三维透视仍在干扰平面轮廓。",
      },
      {
        key: "B",
        mode: "goodOptic",
        reason: "90° 正顶垂直 + 50mm 标准焦段把圆口还原为真圆、消除边角外翻，配合高侧柔短影，既有微微立体厚度又保持纯净平面边界。",
      },
      {
        key: "C",
        mode: "wide",
        reason: "虽然垂直 90°，却用了 24mm 广角近距离贴拍：靠近圆台边缘的杯子与盆栽向外扯斜露底，平面秩序被边角畸变拉松。",
      },
      {
        key: "D",
        mode: "harshShadow",
        reason: "虽然机位垂直，但 18° 低角硬光把高物体的黑影拉长到邻近器物身上，原本分开的轮廓被影子重新焊成暗块。",
      },
    ],
  },
];

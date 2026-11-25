// 143 图片 窗口版式 — 单一真源几何模型与全页数据
// 所有窗口面积、遮挡比例、主次级差、主焦完整性与诊断文案均由此处同一套几何算法算出。

export const WALL_ASPECT = 0.96; // 固定逻辑宽高比 W / H，全端等比不拉伸

export const COLORS = {
  plaster: "#E6E9E8",
  plasterLight: "#F2F4F3",
  plasterMid: "#DCE3E0",
  sageWash: "#D9E4DF",
  warmPaper: "#EAE5DC",
  ink: "#232829",
  inkSoft: "#435254",
  teal: "#367876",
  tealDeep: "#215351",
  pine: "#19393C",
  slate: "#2B4249",
  skyTeal: "#44807A",
  sage: "#9FBEB3",
  sageLight: "#B9CDC2",
  cream: "#E8E3DA",
  alert: "#9A3B2D",
  alertSoft: "#F6E7E4",
  alertDark: "#F2B4A6",
  okBg: "#D7E8E3",
};

// 经验常量（统一标明「经验值」，读数与正文共用此唯一来源）
export const LIMITS = {
  openMin: 0.22,          // 最低有效开窗占比（过小则只见孤立色片，难触发补全）
  openMax: 0.64,          // 最高有效开窗占比（过高则素墙消失，滑向全幅大图 140）
  minHeroArea: 0.12,      // 最大单窗面积下限
  minHierarchyRatio: 1.65,// 多窗时最大窗与次大窗的经验面积倍数下限
  maxWindows: 4,          // 单页推荐窗口上限（超出易碎成多格拼图 145）
  minMullion: 0.022,      // 两扇窗之间素墙骨的最窄安全间距（占墙宽/高）
  sunIntactMin: 0.78,     // 主焦日轮在单窗内完整露出的最低比例
  minWinW: 0.14,
  minWinH: 0.12,
  maxWinW: 0.88,
  maxWinH: 0.86,
  wallPad: 0.04,
};

export const SHAPES = {
  rounded: { id: "rounded", label: "圆角方", short: "方", en: "Rounded", desc: "最均衡克制的建筑窗口，四周留白平稳，适合产品主图与核心场景。" },
  arch: { id: "arch", label: "拱形窗", short: "拱", en: "Arch", desc: "上半弧线天然向上提气，把视线兜向竖向主体，适合器皿、门廊与人物侧影。" },
  strip: { id: "strip", label: "横景条", short: "横", en: "Panoramic", desc: "横向压缩上下杂景、拉长水平动势，适合道路、溪流、地平线与细节局部条。" },
  circle: { id: "circle", label: "月洞圆", short: "圆", en: "Oculus", desc: "向心聚焦力最强，但周边墙面损耗最大，只宜少量点睛，不宜多圆并排。" },
};

export const SHAPE_ORDER = ["rounded", "arch", "strip", "circle"];

// 墙后连续画卷的三个语义地标（画布绘制与几何体检严格共用此坐标）
export const LANDMARKS = {
  sun: {
    id: "sun",
    label: "暖白日轮",
    role: "主视觉焦点",
    x: 0.69,
    y: 0.29,
    r: 0.105, // 占墙宽的比例（像素绘制用 W * r，保证严格正圆）
  },
  ridge: {
    id: "ridge",
    label: "松影山脊拐点",
    role: "中景层次锚点",
    x: 0.30,
    y: 0.48,
    r: 0.08,
  },
  path: {
    id: "path",
    label: "曲径溪流",
    role: "底部视线导引",
    x: 0.62,
    y: 0.83,
    r: 0.09,
  },
};

// 开场默认错版：6 扇 2×3 完全等大的矩形窗（面积比 1.0×，总开窗约 53%），且第一行与第二行之间的横墙梁（y=0.29..0.36）正好劈开位于 y=0.29 的暖白日轮！
export const INITIAL_BROKEN_WINDOWS = [
  { id: "w1", x: 0.06, y: 0.06, w: 0.39, h: 0.23, shape: "rounded" },
  { id: "w2", x: 0.55, y: 0.06, w: 0.39, h: 0.23, shape: "rounded" },
  { id: "w3", x: 0.06, y: 0.36, w: 0.39, h: 0.23, shape: "rounded" },
  { id: "w4", x: 0.55, y: 0.36, w: 0.39, h: 0.23, shape: "rounded" },
  { id: "w5", x: 0.06, y: 0.66, w: 0.39, h: 0.23, shape: "rounded" },
  { id: "w6", x: 0.55, y: 0.66, w: 0.39, h: 0.23, shape: "rounded" },
];

// 原海报四窗参考态：严格对应 143 海报右侧「大圆角主窗 + 竖拱窗 + 中方窗 + 横景曲径窗」（四处墙骨净距均 ≥ 0.04）
export const POSTER_REF_WINDOWS = [
  { id: "w1", x: 0.24, y: 0.05, w: 0.70, h: 0.39, shape: "rounded" },
  { id: "w2", x: 0.07, y: 0.48, w: 0.29, h: 0.24, shape: "arch" },
  { id: "w3", x: 0.41, y: 0.48, w: 0.53, h: 0.24, shape: "rounded" },
  { id: "w4", x: 0.16, y: 0.77, w: 0.78, h: 0.17, shape: "strip" },
];

export function cloneWindows(list) {
  return list.map((w) => ({ ...w }));
}

export function clampWindow(win) {
  const pad = LIMITS.wallPad;
  const w = Math.max(LIMITS.minWinW, Math.min(LIMITS.maxWinW, win.w));
  const h = Math.max(LIMITS.minWinH, Math.min(LIMITS.maxWinH, win.h));
  const x = Math.max(pad, Math.min(1 - pad - w, win.x));
  const y = Math.max(pad, Math.min(1 - pad - h, win.y));
  return { ...win, x, y, w, h };
}

// 计算单窗在像素空间 [0..W]×[0..H] 的真实几何参数
export function windowMetricsPx(win, W, H) {
  const x = win.x * W;
  const y = win.y * H;
  const w = win.w * W;
  const h = win.h * H;
  if (win.shape === "circle") {
    const r = Math.min(w, h) / 2;
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, r };
  }
  if (win.shape === "arch") {
    const topR = Math.min(w / 2, h * 0.52);
    const botR = Math.min(w, h) * 0.1;
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, topR, botR };
  }
  if (win.shape === "strip") {
    const r = Math.min(w, h) * 0.22;
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, r };
  }
  const r = Math.min(w, h) * 0.12;
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, r };
}

// 统一的路径绘制函数（主画布、阴影、剪裁、热区共用）
export function traceWindowPath(ctx, win, W, H) {
  const m = windowMetricsPx(win, W, H);
  ctx.beginPath();
  if (win.shape === "circle") {
    ctx.arc(m.cx, m.cy, m.r, 0, Math.PI * 2);
    ctx.closePath();
    return m;
  }
  if (win.shape === "arch") {
    const { x, y, w, h, topR, botR } = m;
    const midX = x + w / 2;
    const archY = y + topR;
    ctx.moveTo(x, archY);
    ctx.ellipse(midX, archY, w / 2, topR, 0, Math.PI, 0, false);
    ctx.lineTo(x + w, y + h - botR);
    ctx.quadraticCurveTo(x + w, y + h, x + w - botR, y + h);
    ctx.lineTo(x + botR, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - botR);
    ctx.closePath();
    return m;
  }
  // rounded / strip
  const { x, y, w, h, r } = m;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  return m;
}

// 精确计算窗口面积占比（以逻辑墙面 W = WALL_ASPECT, H = 1 计算，保证圆的真实面积）
export function windowAreaRatio(win) {
  const W = WALL_ASPECT;
  const H = 1;
  const w = win.w * W;
  const h = win.h * H;
  const total = W * H;
  if (win.shape === "circle") {
    const r = Math.min(w, h) / 2;
    return (Math.PI * r * r) / total;
  }
  if (win.shape === "arch") {
    const topR = Math.min(w / 2, h * 0.52);
    const botR = Math.min(w, h) * 0.1;
    // 上半椭圆拱（半径 w/2 × topR）+ 下半圆角矩形
    const topArea = 0.5 * Math.PI * (w / 2) * topR;
    const bodyArea = w * Math.max(0, h - topR) - 2 * (1 - Math.PI / 4) * botR * botR;
    return Math.max(0, topArea + bodyArea) / total;
  }
  const r = Math.min(w, h) * (win.shape === "strip" ? 0.22 : 0.12);
  const rectArea = w * h - (4 - Math.PI) * r * r;
  return Math.max(0, rectArea) / total;
}

// 点 (nx, ny) ∈ [0..1]×[0..1] 是否落在该窗口内部
export function pointInWindow(nx, ny, win) {
  const W = WALL_ASPECT;
  const H = 1;
  const px = nx * W;
  const py = ny * H;
  const x = win.x * W;
  const y = win.y * H;
  const w = win.w * W;
  const h = win.h * H;
  if (px < x || px > x + w || py < y || py > y + h) return false;

  if (win.shape === "circle") {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.min(w, h) / 2;
    return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
  }
  if (win.shape === "arch") {
    const topR = Math.min(w / 2, h * 0.52);
    const cx = x + w / 2;
    const archY = y + topR;
    if (py < archY) {
      const rx = w / 2;
      return ((px - cx) / rx) ** 2 + ((py - archY) / topR) ** 2 <= 1;
    }
    return true;
  }
  const r = Math.min(w, h) * (win.shape === "strip" ? 0.22 : 0.12);
  const dx = Math.max(x + r - px, 0, px - (x + w - r));
  const dy = Math.max(y + r - py, 0, py - (y + h - r));
  return dx * dx + dy * dy <= r * r;
}

// 计算两扇窗最小净墙骨间距（负值表示重叠）
export function windowsGap(a, b) {
  const dx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
  const dy = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
  if (dx < 0 && dy < 0) return Math.max(dx, dy); // 重叠深度（负值）
  if (dx >= 0 && dy >= 0) return Math.hypot(dx, dy);
  return Math.max(dx, dy);
}

// 25 点采样网格测主焦日轮在各窗内的完整露出比例
const SUN_SAMPLES = (() => {
  const pts = [{ dx: 0, dy: 0 }];
  for (const ring of [0.45, 0.85]) {
    const n = ring < 0.5 ? 8 : 16;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push({ dx: Math.cos(a) * ring, dy: Math.sin(a) * ring });
    }
  }
  return pts;
})();

function measureLandmarkCoverage(landmark, windows) {
  const rX = landmark.r;
  const rY = landmark.r * WALL_ASPECT;
  const perWin = windows.map(() => 0);
  let totalVisible = 0;
  for (const s of SUN_SAMPLES) {
    const px = landmark.x + s.dx * rX;
    const py = landmark.y + s.dy * rY;
    let seen = false;
    for (let i = 0; i < windows.length; i++) {
      if (pointInWindow(px, py, windows[i])) {
        perWin[i]++;
        seen = true;
      }
    }
    if (seen) totalVisible++;
  }
  const n = SUN_SAMPLES.length;
  const ratios = perWin.map((c) => c / n);
  let maxSingle = 0;
  let maxIdx = -1;
  ratios.forEach((v, i) => {
    if (v > maxSingle) {
      maxSingle = v;
      maxIdx = i;
    }
  });
  return {
    perWin: ratios,
    maxSingle,
    maxIdx,
    totalVisible: totalVisible / n,
  };
}

// 网格采样估算真实并集开窗面积占比（64×64 精细网格，即便重叠也不会虚高）
function measureUnionOpenRatio(windows) {
  if (!windows.length) return 0;
  const N = 64;
  let hits = 0;
  for (let iy = 0; iy < N; iy++) {
    const ny = (iy + 0.5) / N;
    for (let ix = 0; ix < N; ix++) {
      const nx = (ix + 0.5) / N;
      for (let k = 0; k < windows.length; k++) {
        if (pointInWindow(nx, ny, windows[k])) {
          hits++;
          break;
        }
      }
    }
  }
  return hits / (N * N);
}

// 核心体检函数：唯一真源
export function evaluateWall(windows) {
  const count = windows.length;
  const areas = windows.map((w) => windowAreaRatio(w));
  const openRatio = measureUnionOpenRatio(windows);
  const wallRatio = Math.max(0, 1 - openRatio);

  // 检查窗骨碰撞
  const collidingIds = new Set();
  let minGap = 1;
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const g = windowsGap(windows[i], windows[j]);
      if (g < minGap) minGap = g;
      if (g < LIMITS.minMullion) {
        collidingIds.add(windows[i].id);
        collidingIds.add(windows[j].id);
      }
    }
  }

  const sunCov = measureLandmarkCoverage(LANDMARKS.sun, windows);
  const pathCov = measureLandmarkCoverage(LANDMARKS.path, windows);
  const ridgeCov = measureLandmarkCoverage(LANDMARKS.ridge, windows);

  // 为每扇窗计算面积与视觉权重（用于排序 01 → 02 → 03）
  const details = windows.map((win, idx) => {
    const area = areas[idx];
    const sunShare = sunCov.perWin[idx] || 0;
    const pathShare = pathCov.perWin[idx] || 0;
    const ridgeShare = ridgeCov.perWin[idx] || 0;
    // 视觉先看顺序：面积为主 + 主焦日轮显著加权
    const weight = area + sunShare * 0.18 + ridgeShare * 0.04 + pathShare * 0.03;
    const isSliced = sunShare > 0.08 && sunShare < LIMITS.sunIntactMin;
    return {
      ...win,
      index: idx,
      area,
      sunShare,
      pathShare,
      ridgeShare,
      weight,
      isSliced,
      colliding: collidingIds.has(win.id),
    };
  });

  const sortedByArea = [...details].sort((a, b) => b.area - a.area);
  const largestArea = sortedByArea[0]?.area || 0;
  const secondArea = sortedByArea[1]?.area || 0;
  const heroToSecondRatio = count >= 2 && secondArea > 0 ? largestArea / secondArea : count === 1 ? Infinity : 0;

  const gazeOrder = [...details].sort((a, b) => b.weight - a.weight);
  const rankMap = new Map(gazeOrder.map((d, i) => [d.id, i + 1]));
  details.forEach((d) => {
    d.rank = rankMap.get(d.id);
    if (d.colliding) d.roleLabel = "撞窗";
    else if (d.isSliced) d.roleLabel = "劈主";
    else if (d.rank === 1 && (count === 1 || heroToSecondRatio >= LIMITS.minHierarchyRatio)) d.roleLabel = "主窗";
    else if (count >= 2 && heroToSecondRatio < LIMITS.minHierarchyRatio) d.roleLabel = "平权";
    else d.roleLabel = "辅窗";
  });

  const openPct = Math.round(openRatio * 100);
  const sunPct = Math.round(sunCov.maxSingle * 100);
  const ratioText = count === 0 ? "—" : count === 1 ? "独窗" : `${heroToSecondRatio.toFixed(1)}×`;

  // 四枚原海报关键词体检灯（严格按实测计算）
  const checks = {
    crop: count > 0 && sunCov.maxSingle >= LIMITS.sunIntactMin,
    window: count >= 1 && count <= LIMITS.maxWindows && collidingIds.size === 0 && openRatio >= LIMITS.openMin,
    preview: openRatio >= LIMITS.openMin && openRatio <= LIMITS.openMax,
    focus: count >= 1 && count <= LIMITS.maxWindows && collidingIds.size === 0 && sunCov.maxSingle >= LIMITS.sunIntactMin && (count === 1 || heroToSecondRatio >= LIMITS.minHierarchyRatio),
  };
  const passCount = Object.values(checks).filter(Boolean).length;

  // 严格优先级单报诊断
  let code = "OK_PATH";
  let statusKind = "ok"; // "error" | "warn" | "ok"
  let badge = "成立 · 聚焦路径成型";
  let headline = `${count} 扇窗形成 ${ratioText} 主次级差，视线先落主窗再循辅窗展开`;
  let why = `开窗占比 ${openPct}%、素墙保留 ${100 - openPct}%（落入经验甜区 22%–64%），暖白日轮完整落入主窗且窗骨干净。墙面遮挡制造出预览悬念，面积级差把目光稳稳领向主景。`;

  if (count === 0) {
    code = "ZERO_WINDOWS";
    statusKind = "error";
    badge = "错态 · 素墙全封";
    headline = "墙面一扇窗都没开，背后画卷被彻底挡住";
    why = "没有任何开口，画面退化成一块空白墙板。点「+ 开一扇窗」先挖出一块主视野，再决定藏起哪些边缘。";
  } else if (collidingIds.size > 0) {
    code = "COLLIDING";
    statusKind = "error";
    badge = "错态 · 窗棂坍塌";
    headline = "相邻窗口重叠或墙骨太窄，框景边界已经粘连";
    why = `两扇窗之间的素墙净距低于经验下限（${(LIMITS.minMullion * 100).toFixed(1)}% 墙幅）。窗口版式靠素墙分隔节奏，拖开粘连的窗口或封掉多余那一扇，让墙骨重新立住。`;
  } else if (openRatio > LIMITS.openMax) {
    code = "OVER_OPENED";
    statusKind = "error";
    badge = "错态 · 全墙掏空";
    headline = `开窗占比高达 ${openPct}%，素墙只剩细边，预览感消失`;
    why = `开口超过经验上限 ${Math.round(LIMITS.openMax * 100)}% 后，画面已经滑向全幅铺开的图片主导版式（140）。把辅窗收小或封掉一扇，留出至少 36% 素墙才能把杂景遮住、把好奇心留住。`;
  } else if (openRatio < LIMITS.openMin || (count <= 2 && largestArea < LIMITS.minHeroArea)) {
    code = "UNDER_OPENED";
    statusKind = "error";
    badge = "错态 · 针孔过闭";
    headline = openRatio < LIMITS.openMin
      ? `开窗总面积仅 ${openPct}%（低于经验下限 22%），露得太少认不出景`
      : `最大单窗仅占 ${Math.round(largestArea * 100)}%，主视野过小难以承载主体`;
    why = "窗口露出的局部太窄时，画面只剩几块孤立色片，眼睛拼不出墙外是山水还是色卡。拖拉右下角拉框柄把主窗扩开，至少给主体留出可辨认的语境。";
  } else if (sunCov.totalVisible < 0.18) {
    code = "SUBJECT_HIDDEN";
    statusKind = "error";
    badge = "错态 · 主焦被埋";
    headline = "画卷最亮的主焦日轮全被素墙遮在背面";
    why = "窗口只露出了边缘山坡，关键视觉钩子藏在墙后。按住「透视墙后」或空格键看清全图，把主窗拖到右上方日轮位置。";
  } else if (sunCov.maxSingle < LIMITS.sunIntactMin) {
    code = "SUBJECT_SLICED";
    statusKind = "error";
    badge = count > LIMITS.maxWindows && heroToSecondRatio < LIMITS.minHierarchyRatio ? "错态 · 碎窗劈主" : "错态 · 窗棂劈主";
    headline = count > LIMITS.maxWindows && heroToSecondRatio < LIMITS.minHierarchyRatio
      ? `${count} 扇等大碎窗（主次 ${ratioText}），横墙梁还把日轮主焦拦腰劈开`
      : `主焦日轮被窗框切开（单窗仅露 ${sunPct}%），产生截断焦虑`;
    why = count > LIMITS.maxWindows && heroToSecondRatio < LIMITS.minHierarchyRatio
      ? "每扇窗面积相同导致第一眼无处落脚，中间墙梁又正好切在日轮上。先点小窗右上 × 封掉 2–3 扇多余碎窗，再把主窗拉大并移过日轮，让主焦完整呼吸。"
      : `关键焦点卡在窗口硬边上会让读者觉得画面被误裁，而不是有意预览。拖动主窗或拉大角柄，让日轮在单窗内完整露出（≥ ${Math.round(LIMITS.sunIntactMin * 100)}%）。`;
  } else if (count > LIMITS.maxWindows) {
    code = "TOO_MANY_WINDOWS";
    statusKind = "error";
    badge = "错态 · 窗数过碎";
    headline = `同时开了 ${count} 扇窗，把同一幅画卷切成了碎格子`;
    why = `超过 ${LIMITS.maxWindows} 扇窗后，页面更像多格拼图而不是聚焦预览。封掉 1–2 扇次要小窗，素墙呼吸一出来，主窗立刻跳脱。`;
  } else if (count >= 2 && heroToSecondRatio < LIMITS.minHierarchyRatio) {
    code = "FLAT_HIERARCHY";
    statusKind = "error";
    badge = "错态 · 主次平权";
    headline = `${count} 扇窗面积太接近（最大/次大仅 ${ratioText}），谁都在抢第一眼`;
    why = `多窗并置时，最大主窗至少要达到次大窗的 ${LIMITS.minHierarchyRatio}×（经验值）才容易一眼分出主次。拉大含日轮的主窗，或把旁边辅窗收窄成细节预览条。`;
  } else if (count === 1) {
    code = "OK_SINGLE";
    statusKind = "ok";
    badge = "成立 · 独窗定焦";
    headline = `单主窗占墙 ${openPct}%，简洁直给、焦点无干扰`;
    why = "这是一扇克制有力的独窗（接近经典平面广告的 Picture-Window 构图）。若想复刻 143 原海报「主景 + 局部线索」的流动感，可再开 1–2 扇小辅窗形成面积级差。";
  }

  return {
    count,
    openRatio,
    wallRatio,
    openPct,
    wallPct: 100 - openPct,
    largestArea,
    secondArea,
    heroToSecondRatio,
    ratioText,
    sunMaxSingle: sunCov.maxSingle,
    sunTotalVisible: sunCov.totalVisible,
    sunPct,
    collidingIds,
    details,
    gazeOrder,
    checks,
    passCount,
    code,
    statusKind,
    badge,
    headline,
    why,
  };
}

// 寻找一个可安全插入新窗的空闲墙面位置
export function findNewWindowSlot(windows) {
  const candidates = [
    { x: 0.07, y: 0.50, w: 0.28, h: 0.24, shape: "arch" },
    { x: 0.16, y: 0.76, w: 0.66, h: 0.17, shape: "strip" },
    { x: 0.42, y: 0.50, w: 0.48, h: 0.20, shape: "rounded" },
    { x: 0.08, y: 0.08, w: 0.24, h: 0.24, shape: "circle" },
    { x: 0.66, y: 0.52, w: 0.26, h: 0.22, shape: "rounded" },
    { x: 0.10, y: 0.74, w: 0.34, h: 0.18, shape: "strip" },
  ];
  for (const c of candidates) {
    if (windows.every((w) => windowsGap(c, w) >= LIMITS.minMullion)) {
      return c;
    }
  }
  // 回退：找最不挤的小圆窗
  return { x: 0.07, y: 0.07, w: 0.20, h: 0.20, shape: "circle" };
}

// ---------- 正文各节数据 ----------

// 01 节：非模态补全遮挡拉帘
export const CURTAIN_SCENES = [
  {
    id: "pottery",
    label: "产品图 · 青釉陶壶",
    subject: "手拉坯青釉茶壶的壶嘴弧线与釉面高光",
    fullNote: "墙面全撤（遮挡 0%）：整把壶与桌面背景一览无余，信息最全，但少了凑近端详釉色工艺的聚焦钩子。",
    sweetNote: "适度遮挡（38%–68% 素墙）：窗口只放出壶肩、嘴弧与一小段握把——大脑按良好连续自动补完未见的器身轮廓，视线立刻锁定在最打动人的手作质感上。",
    pinholeNote: "遮挡过度（≥ 78% 素墙）：只露出一小块青灰反光，大脑凑不齐足够轮廓线索，根本辨认不出墙后是一把壶还是墙面瓷砖。",
  },
  {
    id: "archway",
    label: "案例图 · 拱廊庭院",
    subject: "混凝土拱廊与日光斜影交界处",
    fullNote: "墙面全撤（遮挡 0%）：整栋建筑立面平铺展开，像工程存档照，缺少建筑摄影借门洞切光的纵深邀请。",
    sweetNote: "适度遮挡（38%–68% 素墙）：框形开口截去四周杂乱天空与地面，只留拱券转折与一道斜阳——读者像站在一墙之隔向外窥见空间一角，天然产生想推门进去的预览感。",
    pinholeNote: "遮挡过度（≥ 78% 素墙）：只剩巴掌大的灰墙与斜线，空间尺度与透视全被切断，预览感变成猜谜。",
  },
  {
    id: "landscape",
    label: "导入页 · 松岭曲径",
    subject: "143 原海报同源山水：暖白日轮与蜿蜒溪径",
    fullNote: "墙面全撤（遮挡 0%）：天、山、路平权摊开，成了普通风景插画，页面缺少视觉停顿与文字落脚的素面墙。",
    sweetNote: "适度遮挡（38%–68% 素墙）：素墙把画卷整理成「主窗看日轮、下窗引曲径」两步节奏，遮住的留白正好安放章节标题与导语。",
    pinholeNote: "遮挡过度（≥ 78% 素墙）：连日轮边缘都被压死，画卷退化成几块抽象色片，导入页的氛围信号彻底断掉。",
  },
];

// 02 节：四型取景镜
export const APERTURE_SHAPES = [
  {
    id: "rounded",
    name: "圆角方窗",
    en: "Rounded Square",
    fit: "最稳的万用主窗：四角微柔化削弱硬框攻击性，适合产品主景、封面核心画幅与信息量大的主视觉。",
    caution: "四边等长容易显得中规中矩；做多窗组合时，圆角半径要统一，避免有的像胶囊、有的像直角框。",
    axis: "四向均衡 · 稳定停留",
  },
  {
    id: "arch",
    name: "拱形窗",
    en: "Architectural Arch",
    fit: "上半圆弧像建筑门洞，天然带「向内邀请」的纵深气质，最契合器皿、植物、楼梯、门廊等竖向修长主体。",
    caution: "别硬塞宽幅横景（如长河或横排产品群）——左右边缘会被竖框截断，上下又空出无意义的背景。",
    axis: "纵向提拉 · 门洞邀请",
  },
  {
    id: "strip",
    name: "横景长窗",
    en: "Panoramic Strip",
    fit: "像把视线压成一条宽银幕缝隙，专吃横向动势：蜿蜒道路、海岸线、产品局部特写条与材质截面。",
    caution: "高宽比一旦过扁（< 1:4），主体必须紧贴横向中轴，否则上下稍偏就会切掉识别部位。",
    axis: "水平延展 · 引导动线",
  },
  {
    id: "circle",
    name: "月洞圆窗",
    en: "Circular Oculus",
    fit: "源自中国园林月洞门与相机镜头，向心锁焦极强，单枚用来定住徽章、日轮或核心局部极其抓眼。",
    caution: "圆窗四周耗费的墙面边角最多，画面有效利用率低；同一版面堆三四个圆窗会像气泡墙，立刻失稳。",
    axis: "向心凝聚 · 单点定焦",
  },
];

// 03 节：窗数与主次压测预设
export const STRESS_COUNTS = [1, 2, 3, 4, 6, 9];

// 04 节：三类真实场景校样
export const SPREAD_CASES = [
  {
    id: "product",
    tab: "产品图 · 陶瓷手冲壶",
    eyebrow: "PRODUCT LAUNCH · 01",
    title: "青灰窑变手冲壶",
    subtitle: "高硼硅滤杯与粗陶手握的温差触感",
    meta: "容量 600 ml · 1280℃ 还原烧",
    goodTitle: "合理开窗：大拱窗锁壶身弧线 + 小横窗预览注水与窑标",
    goodWhy: "两扇窗面积比约 2.7×，总开窗 49%。大拱窗顺着壶体竖向曲线完整框出把柄与釉面高光，下方小横窗单拎出茶杯注水与 1280℃ 窑烧细节，左侧素墙安稳托住产品文案。",
    badTitle: "失误开窗：三扇等宽窄窗把一把壶拦腰切成三段",
    badWhy: "三窗等大（1.0×）且硬框正好切过壶嘴尖与握把接缝，读者既看不到完整器形，第一眼也被三处均等切口撕散。",
  },
  {
    id: "case",
    tab: "案例图 · 清水展馆",
    eyebrow: "ARCHITECTURE CASE · 02",
    title: "南岸灰砖美术馆",
    subtitle: "在老仓库立面切出三道自然采光缝",
    meta: "改建面积 1,840 ㎡ · 2024 建成",
    goodTitle: "合理开窗：主方窗定中庭挑高 + 竖窄窗借一段光影台阶",
    goodWhy: "主窗给出建筑尺度与采光关系，辅窗只截取台阶一角的材质与斜影；超过 45% 的素墙空间让建筑案例像策展画册，呼吸感十足。",
    badTitle: "失误开窗：窗框铺满 82% 且边缘硬卡在拱门正中",
    badWhy: "开窗面积过大让素墙退成细黑线，不仅丢了窗口预览的克制感，还把核心拱门竖切一半，构图立刻失重。",
  },
  {
    id: "entry",
    tab: "视觉导入页 · 海岸专辑",
    eyebrow: "CHAPTER OPENER · 03",
    title: "潮汐退去之后",
    subtitle: "第四章 · 礁石、盐雾与慢快门海岸线",
    meta: "卷首导入 · 共 6 组现场摄影",
    goodTitle: "合理开窗：大横窗切出远海地平线 + 月洞窗点出孤礁浪花",
    goodWhy: "导入页不需要把整章内容一次说完：一大一小两扇异形窗各司其职，露出约 44% 影像作为视觉预告，留出大片素墙让章节号与导语静静呼吸。",
    badTitle: "失误开窗：六扇小方窗塞满右页，提前剧透成缩略图墙",
    badWhy: "导入页一旦开出六个同等小窗，就从「吊胃口的门洞」退化成「目录缩略图索引」，神秘感与视觉停留点同时消失。",
  },
];

// 05 节：五代开窗史（全部经过原始文献核实）
export const HISTORY_PLATES = [
  {
    id: "alberti",
    year: "1435",
    who: "莱昂·巴蒂斯塔·阿尔伯蒂",
    work: "《论绘画》（De pictura）",
    tag: "敞开的窗 · Finestra aperta",
    summary: "阿尔伯蒂在拉丁文《论绘画》（1435 年完稿，1436 年自译意大利文版）第一卷提出影响深远的比喻：先在画布上画一个矩形，把它当作「一扇敞开的窗」，透过这扇窗去看背后连续展开的世界。西方视觉文化从此把画框确立为连接观者与画内空间的开口边界。",
  },
  {
    id: "jicheng",
    year: "1631–1634",
    who: "计成",
    work: "《园冶》（明崇祯刊本）",
    tag: "漏窗与尺幅窗 · 框景",
    summary: "晚明造园家计成在《园冶》中系统总结「巧于因借」与粉墙开窗之法：在整面素白粉墙上雕出尺幅窗、漏窗与洞门，刻意遮掉杂景，只框出墙外一枝翠竹或半角太湖石。墙面越大、洞口越精，窗内那一小截风景反而越像挂在墙上的活山水。",
  },
  {
    id: "ogilvy",
    year: "1963 / 1983",
    who: "大卫·奥格威",
    work: "《一个广告人的自白》与《奥美观点》",
    tag: "Picture-Window Layout",
    summary: "广告大师奥格威在两部著作中反复力推平面广告经典的「图片窗口版式」（Picture-Window Layout）：上方用一扇占幅约六七成的强故事感视觉主窗锁住目光，图注紧贴窗下，再接大标题与分栏正文，让读者的眼睛按「看窗→读注→进文」顺势下滑。",
  },
  {
    id: "munari",
    year: "1968",
    who: "布鲁诺·穆纳里",
    work: "《米兰的雾中》（Nella nebbia di Milano）",
    tag: "物理模切窗洞书页",
    summary: "意大利设计大师穆纳里在 1968 年由 Emme Edizioni 出版的绘本中，直接用半透明描图纸叠加实打实的模切孔洞。读者翻页前，只能透过纸上的小窗窥见下一页马戏团的半截色块与轮廓，翻开后全貌才陡然揭晓——把窗口版式的「预览感」做成了触手可及的纸面机关。",
  },
  {
    id: "kanizsa",
    year: "1979 / 1981",
    who: "卡尼萨 & 穆勒-布罗克曼",
    work: "《视觉组织》与《平面设计中的网格系统》",
    tag: "非模态补全 + 网格跨格窗",
    summary: "1979 年心理学家加埃塔诺·卡尼萨在《视觉组织》中系统阐明「非模态补全」——大脑会自动在遮挡背后把局部图形补成整体；1981 年瑞士设计师约瑟夫·穆勒-布罗克曼在《平面设计中的网格系统》里给出跨格合并法则，教设计师用模数精准拉开主窗与辅窗的大小比例。",
  },
];

// 06 节：什么时候别用窗口（四类反例）
export const ANTI_CASES = [
  {
    id: "manual",
    title: "装配说明与全局路线图",
    short: "缺一角就看不懂步骤",
    reason: "操作流程图、产品结构爆炸图、地铁线路图靠的是整体连通关系。用素墙裁掉任何一角都会截断理解链路，老老实实完整铺开更诚实（参看 140 图片主导版式）。",
  },
  {
    id: "group",
    title: "多人合影与密集数据图表",
    short: "硬套框口会削人头、切坐标",
    reason: "圆角或拱形窗口切过人物脸部和图表刻度轴是排版大忌；若确需同时展示多组独立镜头或数据块，应改用规则分格的 145 多面板版式或 146 蒙德里安版式。",
  },
  {
    id: "tiny",
    title: "手机窄列里的微缩略图",
    short: "素墙吃掉面积，画面缩成邮票",
    reason: "窗口版式靠「素墙面积」衬托开口。如果卡片本身宽不足 160 px，再留 40% 墙边，窗口里的主体就会缩到难以辨认——极小尺寸还是直接满框裁图更清楚。",
  },
  {
    id: "isolated",
    title: "本身已完全抠空的极简单品",
    short: "没有杂景可遮，硬开窗变画蛇添足",
    reason: "当物体已经置身纯白背景、没有任何背景信息可被遮挡和补全时，再套一道小窗反而生硬割裂；此时借轮廓外放张力的 148 剪影版式会自然得多。",
  },
];

// 07 节：小练习（严格单变量：同底图、同文字、同 3 窗数，仅差窗口比例与裁切落点）
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    correct: false,
    metrics: "3 窗 · 开窗 46% · 主次比 1.05×",
    verdict: "主次平权：三扇窗几乎等大，视线在瓶口、瓶腹与瓶底间来回打转",
    explain: "虽然总开窗占比（46%）落在了舒服区间，但三扇窗面积只差 1.05×，没有谁能稳稳接住第一眼。加上三扇窗硬把瓶身等距切三截，视觉重心分散。",
  },
  {
    id: "B",
    label: "方案 B",
    correct: false,
    metrics: "3 窗 · 开窗 84% · 主次比 4.8×",
    verdict: "全墙掏空：主窗几乎铺满右侧，素墙只剩细缝，预览悬念消失",
    explain: "大窗一口气吞下整只瓶子与 84% 墙面，下面两扇细缝沦为多余点缀。没有足够素墙遮挡，读者一眼就看尽全貌，失去了窗口版式「露局部、引人补全」的趣味。",
  },
  {
    id: "C",
    label: "方案 C",
    correct: true,
    metrics: "3 窗 · 开窗 52% · 主次比 2.6×",
    verdict: "判断准确！主次级差、素墙遮挡与主焦裁切同时成立",
    explain: "大拱形主窗顺应青釉长颈瓶的修长势态，完整兜住瓶肩高光与瓶颈曲线（主次面积比 2.6×）；下方两扇小圆角辅窗克制地预览器底落款与釉面开片；约 48% 素墙自然触发非模态补全，视线从大拱窗顺滑滑向细节预览。",
  },
  {
    id: "D",
    label: "方案 D",
    correct: false,
    metrics: "3 窗 · 开窗 51% · 主次比 2.5×",
    verdict: "窗棂劈主：比例与留白都很漂亮，但主窗顶边刚好劈断瓶颈与核心高光",
    explain: "这是一个极隐蔽的实战坑：主次比（2.5×）和素墙比例（49%）全都合规，但主窗位置偏低，把整件瓷器最具识别度的瓶口与釉肩高光卡死在窗框上沿，带来强烈的截断不适。",
  },
];

// 031 X形构图 · 单真源几何模型
// 所有夹角、双楔多边形顶点、左右楔面积比、通道占比、焦点偏距与 4 维检核、8 类失误诊断全部从此文件算出。

export const DEG = Math.PI / 180;
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 经验参考区间（明确在界面标注为经验参考带）
export const BANDS = {
  angleMin: 38,
  angleMax: 114,
  ratioMax: 1.38,
  channelMin: 0.16,
  channelMax: 0.68,
  focusMax: 0.085,
  crossXMin: 0.36,
  crossXMax: 0.64,
  crossYMin: 0.34,
  crossYMax: 0.66,
};

// 开场 0/4 翻车错态：扁塌夹角 + 左楔倾覆 + 通道阻断 + 焦圆脱核
export const PRESETS = {
  broken: {
    angle: 26,
    balance: -0.56,
    channel: 0.115,
    crossX: 0.50,
    crossY: 0.50,
    focusX: 0.25,
    focusY: 0.72,
    mode: "x",
    blocker: true,
    scene: "poster",
    flow: true,
    highlightDim: null,
  },
  // 经典对称 X 解（忠实呼应 031 原海报）
  classic: {
    angle: 62,
    balance: 0,
    channel: 0.115,
    crossX: 0.50,
    crossY: 0.50,
    focusX: 0.50,
    focusY: 0.50,
    mode: "x",
    blocker: false,
  },
  // 动感偏交 X 解（交点微上提偏右，双楔对冲仍稳）
  dynamic: {
    angle: 76,
    balance: 0.14,
    channel: 0.105,
    crossX: 0.55,
    crossY: 0.44,
    focusX: 0.55,
    focusY: 0.44,
    mode: "x",
    blocker: false,
  },
  // 紧凑锋刃 X 解（厚楔窄通道高冲击）
  blade: {
    angle: 50,
    balance: -0.06,
    channel: 0.072,
    crossX: 0.48,
    crossY: 0.52,
    focusX: 0.48,
    focusY: 0.52,
    mode: "x",
    blocker: false,
  },
};

export function createInitialState() {
  return { ...PRESETS.broken };
}

// 用 Sutherland-Hodgman 裁剪多边形到矩形 [0, w] x [0, h]
function clipPolygonToRect(pts, w, h) {
  const clipEdge = (poly, inside, intersect) => {
    if (!poly.length) return [];
    const out = [];
    let prev = poly[poly.length - 1];
    let prevIn = inside(prev);
    for (const curr of poly) {
      const currIn = inside(curr);
      if (currIn !== prevIn) out.push(intersect(prev, curr));
      if (currIn) out.push(curr);
      prev = curr;
      prevIn = currIn;
    }
    return out;
  };
  const ixX = (x) => (a, b) => {
    const t = (x - a[0]) / (b[0] - a[0] || 1e-9);
    return [x, a[1] + t * (b[1] - a[1])];
  };
  const ixY = (y) => (a, b) => {
    const t = (y - a[1]) / (b[1] - a[1] || 1e-9);
    return [a[0] + t * (b[0] - a[0]), y];
  };
  let p = pts;
  p = clipEdge(p, (q) => q[0] >= 0, ixX(0));
  p = clipEdge(p, (q) => q[0] <= w, ixX(w));
  p = clipEdge(p, (q) => q[1] >= 0, ixY(0));
  p = clipEdge(p, (q) => q[1] <= h, ixY(h));
  return p;
}

function polygonArea(pts) {
  if (pts.length < 3) return 0;
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(s) * 0.5;
}

// 直线与矩形边界相交，返回两个端点 [p1, p2]（沿方向向量排序）
function lineRectEndpoints(cx, cy, dx, dy, w, h) {
  const ts = [];
  if (Math.abs(dx) > 1e-7) {
    for (const xEdge of [0, w]) {
      const t = (xEdge - cx) / dx;
      const y = cy + t * dy;
      if (y >= -1e-4 && y <= h + 1e-4) ts.push(t);
    }
  }
  if (Math.abs(dy) > 1e-7) {
    for (const yEdge of [0, h]) {
      const t = (yEdge - cy) / dy;
      const x = cx + t * dx;
      if (x >= -1e-4 && x <= w + 1e-4) ts.push(t);
    }
  }
  if (ts.length < 2) return [[0, cy], [w, cy]];
  ts.sort((a, b) => a - b);
  const t0 = ts[0];
  const t1 = ts[ts.length - 1];
  return [
    [cx + t0 * dx, cy + t0 * dy],
    [cx + t1 * dx, cy + t1 * dy],
  ];
}

// 单真源：在指定逻辑画框 (w, h) 中计算全部真实几何体与诊断
export function evaluateState(state, w = 1000, h = 600) {
  const angle = clamp(state.angle, 16, 148);
  const halfRad = (angle * 0.5) * DEG;
  const bal = clamp(state.balance, -0.85, 0.85);
  const ch = clamp(state.channel, 0.035, 0.24);
  const cxN = clamp(state.crossX, 0.24, 0.76);
  const cyN = clamp(state.crossY, 0.24, 0.76);
  const fxN = clamp(state.focusX, 0.08, 0.92);
  const fyN = clamp(state.focusY, 0.10, 0.90);

  const cx = cxN * w;
  const cy = cyN * h;
  const fx = fxN * w;
  const fy = fyN * h;
  const diag = Math.hypot(w, h);
  const halfBand = ch * Math.min(w, h) * 0.58; // 单条斜通道半宽

  // 两条对角线方向单位向量
  // d1: 左上 -> 右下 (cos, sin)
  // d2: 左下 -> 右上 (cos, -sin)
  const cosA = Math.cos(halfRad);
  const sinA = Math.sin(halfRad);
  const d1 = [cosA, sinA];
  const d2 = state.mode === "parallel" ? [cosA, sinA] : [cosA, -sinA];

  // 计算画框内的轴线线段
  let axis1;
  let axis2 = null;
  if (state.mode === "parallel") {
    const sep = Math.min(w, h) * 0.19;
    const nx = -sinA;
    const ny = cosA;
    axis1 = lineRectEndpoints(cx + nx * sep, cy + ny * sep, d1[0], d1[1], w, h);
    axis2 = lineRectEndpoints(cx - nx * sep, cy - ny * sep, d1[0], d1[1], w, h);
  } else if (state.mode === "single") {
    axis1 = lineRectEndpoints(cx, cy, d1[0], d1[1], w, h);
  } else {
    axis1 = lineRectEndpoints(cx, cy, d1[0], d1[1], w, h);
    axis2 = lineRectEndpoints(cx, cy, d2[0], d2[1], w, h);
  }

  // 构建左右赤橘楔形多边形（真实多边形，直接用于 Canvas 绘制与面积核算！）
  // balance < 0 时左楔更肥厚压向中心、右楔退缩；balance > 0 时相反。
  // 按画布宽高比归一化尖端退距，确保手机近方画布与桌面宽幅画布的双楔比例都饱满稳定。
  const reach = diag * 1.45;
  const aspectScale = clamp(w / Math.max(h * 1.6, 1), 0.42, 1.15);
  const gapL = clamp((halfBand / Math.max(0.32, sinA)) * aspectScale, w * 0.042, w * 0.145);
  const leftAdvance = -bal * w * 0.115;
  const rightAdvance = bal * w * 0.115;

  let leftWedge = [];
  let rightWedge = [];

  if (state.mode === "x") {
    const tipLx = clamp(cx - gapL + leftAdvance, w * 0.08, cx + w * 0.18);
    const tipRx = clamp(cx + gapL - rightAdvance, cx - w * 0.18, w * 0.92);
    // 左楔：由尖端 (tipLx, cy) 向左上 (-cosA, -sinA) 和左下 (-cosA, +sinA) 放射
    // 再叠加轻度开口膨胀以直观表现左右体量差
    const baseHalf = Math.atan2(Math.sin(halfRad) * (h / Math.max(w * 0.48, 1)), Math.cos(halfRad));
    const wedgeHalf = clamp(baseHalf * 0.72 + halfRad * 0.38, 0.14, 1.32);
    const spreadL = clamp(wedgeHalf * (1 + Math.max(0, -bal) * 0.44 - Math.max(0, bal) * 0.28), 0.12, 1.38);
    const spreadR = clamp(wedgeHalf * (1 + Math.max(0, bal) * 0.44 - Math.max(0, -bal) * 0.28), 0.12, 1.38);

    const rawLeft = [
      [tipLx, cy],
      [tipLx - Math.cos(spreadL) * reach, cy - Math.sin(spreadL) * reach],
      [-reach, -reach],
      [-reach, h + reach],
      [tipLx - Math.cos(spreadL) * reach, cy + Math.sin(spreadL) * reach],
    ];
    const rawRight = [
      [tipRx, cy],
      [tipRx + Math.cos(spreadR) * reach, cy - Math.sin(spreadR) * reach],
      [w + reach, -reach],
      [w + reach, h + reach],
      [tipRx + Math.cos(spreadR) * reach, cy + Math.sin(spreadR) * reach],
    ];
    leftWedge = clipPolygonToRect(rawLeft, w, h);
    rightWedge = clipPolygonToRect(rawRight, w, h);
  } else if (state.mode === "single") {
    // 单斜模式：仅左下侧有一片大赤橘斜楔，右上敞空，呈现明显失重滑倒
    const nx = -sinA;
    const ny = cosA;
    const shift = halfBand * 1.15;
    const ox = cx + nx * shift;
    const oy = cy + ny * shift;
    const rawSingle = [
      [ox - d1[0] * reach, oy - d1[1] * reach],
      [ox + d1[0] * reach, oy + d1[1] * reach],
      [ox + d1[0] * reach + nx * reach, oy + d1[1] * reach + ny * reach],
      [ox - d1[0] * reach + nx * reach, oy - d1[1] * reach + ny * reach],
    ];
    leftWedge = clipPolygonToRect(rawSingle, w, h);
    rightWedge = [];
  } else {
    // 平行模式：两条平行斜带之间夹出一条斜赤橘条，无交叉
    const nx = -sinA;
    const ny = cosA;
    const sep = Math.min(w, h) * 0.12;
    const rawLeft = [
      [cx - d1[0] * reach + nx * sep, cy - d1[1] * reach + ny * sep],
      [cx + d1[0] * reach + nx * sep, cy + d1[1] * reach + ny * sep],
      [cx + d1[0] * reach + nx * (sep + reach), cy + d1[1] * reach + ny * (sep + reach)],
      [cx - d1[0] * reach + nx * (sep + reach), cy - d1[1] * reach + ny * (sep + reach)],
    ];
    const rawRight = [
      [cx - d1[0] * reach - nx * sep, cy - d1[1] * reach - ny * sep],
      [cx + d1[0] * reach - nx * sep, cy + d1[1] * reach - ny * sep],
      [cx + d1[0] * reach - nx * (sep + reach), cy + d1[1] * reach - ny * (sep + reach)],
      [cx - d1[0] * reach - nx * (sep + reach), cy - d1[1] * reach - ny * (sep + reach)],
    ];
    leftWedge = clipPolygonToRect(rawLeft, w, h);
    rightWedge = clipPolygonToRect(rawRight, w, h);
  }

  const totalArea = w * h;
  const areaL = polygonArea(leftWedge);
  const areaR = polygonArea(rightWedge);
  const wedgeShare = (areaL + areaR) / totalArea;
  const channelShare = clamp(1 - wedgeShare, 0, 1);

  // 左右楔面积比（大 / 小），并记录偏向哪一侧
  const minSide = Math.max(areaL, areaR) > 0 ? Math.max(Math.min(areaL, areaR), totalArea * 0.012) : 1;
  const wedgeRatio = state.mode === "single"
    ? 9.9
    : +(Math.max(areaL, areaR) / minSide).toFixed(2);
  const heavierSide = Math.abs(areaL - areaR) / totalArea < 0.025
    ? "balanced"
    : areaL > areaR ? "left" : "right";

  // 焦点与交汇中心归一化距离
  const focusOffset = state.mode === "parallel"
    ? 1
    : Math.hypot((fx - cx) / w, (fy - cy) / h);

  // 阻断块位置（稳稳落在右上斜通道 58% 处，远离中心交汇环与夹角标签，避免任何窄屏重叠）
  const rtEnd = axis2 ? axis2[1] : [w * 0.88, h * 0.18];
  const blockerPos = [
    clamp(cx + (rtEnd[0] - cx) * 0.60, Math.min(w - 64, cx + 105), w - 58),
    clamp(cy + (rtEnd[1] - cy) * 0.60, 44, Math.max(46, cy - 32)),
  ];

  // 四维达标判定（与原海报右框 4 项严格一一对应）
  const angleOk = state.mode === "x" && angle >= BANDS.angleMin && angle <= BANDS.angleMax;
  const crossInBounds = cxN >= BANDS.crossXMin && cxN <= BANDS.crossXMax && cyN >= BANDS.crossYMin && cyN <= BANDS.crossYMax;
  const balanceOk = state.mode === "x" && wedgeRatio <= BANDS.ratioMax && crossInBounds;
  const sightlinesOk = state.mode === "x" && !state.blocker && channelShare >= BANDS.channelMin && channelShare <= BANDS.channelMax;
  const focusOk = state.mode !== "parallel" && focusOffset <= BANDS.focusMax;

  const passedCount = [angleOk, balanceOk, sightlinesOk, focusOk].filter(Boolean).length;

  // 识别 8 类具体失误（按严重度排主诊断，同时返回所有现存错误）
  const faults = [];
  if (state.mode === "single") {
    faults.push({
      id: "single",
      dim: "tension",
      tag: "单斜滑倒",
      headline: "只剩一条斜线，画面正往一侧溜出去",
      why: "单条对角线有冲力却没有反作用力拉住它。人眼顺着斜坡一路滑到角边，留不住也停不下来。",
      fix: "在下方操控轨切回「对称 X」或「偏交 X」，补上第二条反向对角线完成互锁。",
    });
  }
  if (state.mode === "parallel") {
    faults.push({
      id: "parallel",
      dim: "sightlines",
      tag: "平行不交",
      headline: "两条斜线各自平行，视线永远碰不到一起",
      why: "平行斜线像两条并排铁轨，把注意力引向两个不同角落，画框里找不到统一的汇聚中心。",
      fix: "把模式切回「双斜交叉」，让两股视线在中心真正相逢。",
    });
  }
  if (state.mode === "x" && angle < BANDS.angleMin) {
    faults.push({
      id: "flat",
      dim: "tension",
      tag: "夹角扁塌",
      headline: `夹角只有 ${Math.round(angle)}°，X 快躺平成横带了`,
      why: "两条线太贴近水平，斜向动势几乎消失。人眼看到的不再是交锋的 X，而是被压扁的横向缝隙。",
      fix: "在画布上向右横向拖动（或按 → 键），把剪刀夹角拉开到 38°–114° 之间。",
    });
  }
  if (state.mode === "x" && angle > BANDS.angleMax) {
    faults.push({
      id: "pinched",
      dim: "tension",
      tag: "夹角过尖",
      headline: `夹角飙到 ${Math.round(angle)}°，中间通道被夹得喘不过气`,
      why: "两条斜线过于陡直，左右赤橘双楔几乎顶在一起，上下负形被挤成狭窄尖锥，张力变成局促感。",
      fix: "在画布上向左横向拖动（或按 ← 键），把夹角收回 38°–114° 舒展带。",
    });
  }
  if (state.mode === "x" && wedgeRatio > BANDS.ratioMax) {
    const sideText = heavierSide === "left" ? "左楔压得太沉" : "右楔压得太沉";
    faults.push({
      id: "unbalanced",
      dim: "balance",
      tag: "双楔倾覆",
      headline: `${sideText}，左右面积比达到 ${wedgeRatio.toFixed(1)}:1`,
      why: "X 构图之所以动而不乱，靠的是两翼体量互相托住。一侧过度肥大，画面立刻像断翅一样侧翻。",
      fix: "拖动下方「双楔配平」滑杆（或按 ↑/↓ 键），把左右楔面积比压回 1.38:1 以内。",
    });
  }
  if (!crossInBounds && state.mode === "x") {
    faults.push({
      id: "edge_cross",
      dim: "balance",
      tag: "交点贴边",
      headline: "交叉点偏得太靠边，另外两翼短得撑不起骨架",
      why: "交点可以略作黄金偏置制造活力，但一旦挤到边缘，X 就退化成单边岔口，失去四向牵引力。",
      fix: "把交汇中心移回画框中段（X 36%–64%，Y 34%–66%），让四条翼线都站得稳。",
    });
  }
  if (state.mode === "x" && state.blocker) {
    faults.push({
      id: "blocked",
      dim: "sightlines",
      tag: "通道截断",
      headline: "右上斜通道被杂块横腰拦断，视线半路撞停",
      why: "四条对角路径像四根引流管。任何一条被无关色块拦腰截住，视线在冲向中心前就会分心弹开。",
      fix: "直接点击画布右上方的深色「点此清障」阻断块（或点下方清障按钮），打通四翼通道。",
    });
  } else if (state.mode === "x" && channelShare < BANDS.channelMin) {
    faults.push({
      id: "choked",
      dim: "sightlines",
      tag: "通道窒息",
      headline: `X 通道仅占画面 ${Math.round(channelShare * 100)}%，负形空间被双楔吃光`,
      why: "通道窄到一定程度，两片红楔连成整面堵墙，斜向引导反而看不清，只剩沉闷压迫。",
      fix: "拉宽「通道开口」滑杆，让负形通道留白回到 16%–68% 经验参考带。",
    });
  } else if (state.mode === "x" && channelShare > BANDS.channelMax) {
    faults.push({
      id: "washed",
      dim: "sightlines",
      tag: "双楔过弱",
      headline: `通道散开到 ${Math.round(channelShare * 100)}%，双楔缩成边角碎屑`,
      why: "留白过散时，两条赤橘楔体抓不住视线边界，X 的视觉剪刀结构在纸面上散架。",
      fix: "收窄「通道开口」滑杆，让左右赤橘双楔重新切出清晰的对角边界。",
    });
  }
  if (state.mode !== "parallel" && focusOffset > BANDS.focusMax) {
    faults.push({
      id: "off_focus",
      dim: "focus",
      tag: "焦点脱核",
      headline: `深青焦圆偏离交汇中心 ${Math.round(focusOffset * 100)}%，中心发虚`,
      why: "四条斜线拼命把眼睛往交点送，结果交点空无一物，真正的主角却躲在角落里，大脑当场产生落空感。",
      fix: "直接把画布里带红环的深青焦圆拖回两条虚线交汇处，让视线一落地就接住主角。",
    });
  }

  // 识别达标后的正当解类型
  let solutionKind = null;
  if (passedCount === 4) {
    const crossDist = Math.hypot(cxN - 0.5, cyN - 0.5);
    if (crossDist <= 0.045 && wedgeRatio <= 1.2 && angle >= 48 && angle <= 86) {
      solutionKind = {
        tag: "达标 · 经典对称 X",
        headline: "四翼对冲稳锁中心，动感与平衡同时成立",
        why: `当前 ${Math.round(angle)}° 剪刀角清晰打破横竖静默，左右楔比 ${wedgeRatio.toFixed(2)}:1 彼此托住，四路视线直贯深青焦圆——这是最干脆的海报级 X 骨架。`,
        fix: "你也可以试试点「动感偏交解」或拖焦圆与交点同移，体会非对称 X 的另一种成立方式。",
      };
    } else if (crossDist > 0.045) {
      solutionKind = {
        tag: "达标 · 动感偏交 X",
        headline: "交点微偏打破机械感，张力照样收束不散",
        why: `交汇点落在 (${Math.round(cxN * 100)}%, ${Math.round(cyN * 100)}%)，四翼长短错落但左右楔比仍稳在 ${wedgeRatio.toFixed(2)}:1，焦圆紧扣交点，既有冲势又不呆板。`,
        fix: "试着切到「冲刺海报」或「城市天桥」题材，看看同一套偏交骨架在真实摄影里的威力。",
      };
    } else if (channelShare <= 0.34 || angle < 48 || angle > 86) {
      solutionKind = {
        tag: "达标 · 锋刃紧凑 X",
        headline: "双楔逼近压出锐利光道，视觉冲击更猛烈",
        why: `夹角 ${Math.round(angle)}° 配合 ${Math.round(channelShare * 100)}% 负形通道，把目光强力压缩进核心焦圆，很适合运动赛事与高爆发封面。`,
        fix: "注意别再继续压窄通道：留白一旦跌破 16%，锋刃感就会滑向局促拥堵。",
      };
    } else {
      solutionKind = {
        tag: "达标 · 自排成立解",
        headline: "四维全部过线，这套 X 构图完全立得住",
        why: `夹角 ${Math.round(angle)}°、楔比 ${wedgeRatio.toFixed(2)}:1、通道 ${Math.round(channelShare * 100)}%、焦偏 ${Math.round(focusOffset * 100)}%，四条指标互相撑住，人眼一眼就被锁进交点。`,
        fix: "可以故意拖偏某一项（比如切到「单斜」或压扁夹角），亲自验证它是怎么一秒散架的。",
      };
    }
  }

  // 心理张力档位（不造假精确百分比，改用清晰档位并标「示意」）
  let tensionLevel = "低 · 平缓（示意）";
  if (state.mode === "parallel") tensionLevel = "散 · 无汇聚（示意）";
  else if (state.mode === "single") tensionLevel = "偏 · 单向滑坠（示意）";
  else if (angle < 38) tensionLevel = "弱 · 近水平（示意）";
  else if (angle <= 84) tensionLevel = "强 · 黄金张力（示意）";
  else if (angle <= 114) tensionLevel = "锐 · 紧绷冲刺（示意）";
  else tensionLevel = "过紧 · 局促（示意）";

  // 四枚原海报右框检核条状态
  const dims = {
    tension: {
      ok: angleOk,
      badge: state.mode === "single" ? "单斜缺翼"
        : state.mode === "parallel" ? "平行无交"
        : angle < BANDS.angleMin ? `扁塌 ${Math.round(angle)}°`
        : angle > BANDS.angleMax ? `过尖 ${Math.round(angle)}°`
        : `稳锁 ${Math.round(angle)}°`,
    },
    balance: {
      ok: balanceOk,
      badge: state.mode === "single" ? "单侧失重"
        : !crossInBounds ? "交点贴边"
        : wedgeRatio > BANDS.ratioMax ? `${heavierSide === "left" ? "左沉" : "右沉"} ${wedgeRatio.toFixed(1)}:1`
        : `均衡 ${wedgeRatio.toFixed(2)}:1`,
    },
    sightlines: {
      ok: sightlinesOk,
      badge: state.mode === "parallel" ? "双轨并行"
        : state.mode === "single" ? "缺副通道"
        : state.blocker ? "右翼截断"
        : channelShare < BANDS.channelMin ? `过窄 ${Math.round(channelShare * 100)}%`
        : channelShare > BANDS.channelMax ? `过散 ${Math.round(channelShare * 100)}%`
        : `四翼通畅 ${Math.round(channelShare * 100)}%`,
    },
    focus: {
      ok: focusOk,
      badge: state.mode === "parallel" ? "无交汇点"
        : focusOffset > BANDS.focusMax ? `偏核 ${Math.round(focusOffset * 100)}%`
        : `落锁 ${Math.round(focusOffset * 100)}%`,
    },
  };

  const primary = faults[0] || solutionKind;

  return {
    w,
    h,
    angle,
    cx,
    cy,
    cxN,
    cyN,
    fx,
    fy,
    fxN,
    fyN,
    cosA,
    sinA,
    halfBand,
    axis1,
    axis2,
    leftWedge,
    rightWedge,
    areaL,
    areaR,
    wedgeRatio,
    heavierSide,
    channelShare,
    focusOffset,
    blockerPos,
    passedCount,
    faults,
    dims,
    primary,
    tensionLevel,
    isSolved: passedCount === 4,
  };
}

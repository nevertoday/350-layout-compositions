// 140 图片主导版式 · 单一真源几何与诊断引擎
// 画布绘制、面板读数、四项原则探针、多解与试错全部只读本模块的输出，绝不写死常量。

export const SUBJECTS = {
  poster140: {
    id: "poster140",
    label: "原海报 · 蓝球斜切",
    short: "蓝球斜切",
    titleZh: "图片主导版式",
    titleEn: "IMAGE-LED LAYOUT",
    c0: { zh: "视觉中心", en: "VISUAL CENTER" },
    c1: { zh: "图像优先", en: "IMAGE PRIORITY", body: "让图片成为视觉焦点" },
    c2: { zh: "注释引导", en: "ANNOTATION GUIDE", body: "用线条标注信息层级" },
    c3: { zh: "裁切处理", en: "CROPPING", body: "通过裁切强化构图" },
  },
  dome: {
    id: "dome",
    label: "建筑画报 · 螺旋穹顶",
    short: "螺旋穹顶",
    titleZh: "光穹构筑年展",
    titleEn: "OCULUS ARCHITECTURE",
    c0: { zh: "采光穹眼", en: "ZENITH OCULUS" },
    c1: { zh: "结构主图", en: "HERO STRUCTURE", body: "以建筑体量建立入口" },
    c2: { zh: "展期注记", en: "EXHIBITION NOTE", body: "细引线交代时间与展厅" },
    c3: { zh: "斜切留白", en: "DIAGONAL CROP", body: "切去冗余墙面放大尺度" },
  },
  chronograph: {
    id: "chronograph",
    label: "工业专刊 · 精密表盘",
    short: "精密表盘",
    titleZh: "机械时计特刊",
    titleEn: "CHRONOGRAPH ISSUE",
    c0: { zh: "擒纵核心", en: "ESCAPEMENT CORE" },
    c1: { zh: "微距主图", en: "MACRO DOMINANCE", body: "金属表圈主导第一眼" },
    c2: { zh: "工艺标注", en: "CRAFT CALLOUT", body: "引线直指表壳与红宝石轴" },
    c3: { zh: "破边裁切", en: "EDGE CROPPING", body: "裁去半圈让精密感外延" },
  },
};

export const PRESETS = {
  // 开场 0/4 四重错态：邮票缩图 + 零破边未裁 + 文案臃肿盖主图 + 注释引线交叉打结
  broken: {
    label: "复原开场错态",
    scale: 0.66,
    cx: 0.52,
    cy: 0.52,
    cutDepth: 0.06,
    copyScale: 1.28,
    vermilion: { u: 0.39, v: 0.86 },
    callouts: {
      c1: { u: 0.14, v: 0.72 }, // 放左下但指向球体左上 → 与 c2 物理交叉
      c2: { u: 0.15, v: 0.35 }, // 放左上但指向偏右下的朱红圆 → 与 c1 形成清晰 X 交叉
      c3: { u: 0.56, v: 0.36 }, // 直接压在球体正中亮面 → 文字盖主图
    },
  },
  // 合法解 1：1:1 复原 140 原海报经典平衡
  classic: {
    label: "原海报经典解",
    scale: 1.28,
    cx: 0.64,
    cy: 0.50,
    cutDepth: 0.34,
    copyScale: 0.90,
    vermilion: { u: 0.295, v: 0.855 },
    callouts: {
      c1: { u: 0.11, v: 0.33 },
      c2: { u: 0.11, v: 0.77 },
      c3: { u: 0.86, v: 0.84 },
    },
  },
  // 合法解 2：Willy Fleckhaus 式杂志特写大裁解
  closeup: {
    label: "特写大裁解",
    scale: 1.48,
    cx: 0.68,
    cy: 0.52,
    cutDepth: 0.25,
    copyScale: 0.82,
    vermilion: { u: 0.25, v: 0.86 },
    callouts: {
      c1: { u: 0.10, v: 0.30 },
      c2: { u: 0.10, v: 0.76 },
      c3: { u: 0.87, v: 0.87 },
    },
  },
  // 合法解 3：Alexey Brodovitch 式画廊舒展留白解
  gallery: {
    label: "画廊留白解",
    scale: 1.08,
    cx: 0.65,
    cy: 0.50,
    cutDepth: 0.26,
    copyScale: 0.86,
    vermilion: { u: 0.31, v: 0.84 },
    callouts: {
      c1: { u: 0.12, v: 0.34 },
      c2: { u: 0.12, v: 0.76 },
      c3: { u: 0.86, v: 0.86 },
    },
  },
  // 双向反例 1：邮票缩图
  failStamp: {
    label: "邮票缩图",
    scale: 0.54,
    cx: 0.50,
    cy: 0.52,
    cutDepth: 0.08,
    copyScale: 0.92,
    vermilion: { u: 0.29, v: 0.85 },
    callouts: {
      c1: { u: 0.11, v: 0.33 },
      c2: { u: 0.11, v: 0.77 },
      c3: { u: 0.86, v: 0.85 },
    },
  },
  // 双向反例 2：过裁失认（主体被边缘与斜切吃掉过半，辨识轮廓残缺）
  failOvercrop: {
    label: "过裁失认",
    scale: 1.80,
    cx: 0.76,
    cy: 0.56,
    cutDepth: 0.48,
    copyScale: 0.88,
    vermilion: { u: 0.24, v: 0.86 },
    callouts: {
      c1: { u: 0.11, v: 0.33 },
      c2: { u: 0.11, v: 0.77 },
      c3: { u: 0.86, v: 0.84 },
    },
  },
  // 双向反例 3：文字盖图喧宾夺主
  failTextCover: {
    label: "文字盖图",
    scale: 1.26,
    cx: 0.62,
    cy: 0.50,
    cutDepth: 0.32,
    copyScale: 1.42,
    vermilion: { u: 0.29, v: 0.85 },
    callouts: {
      c1: { u: 0.44, v: 0.46 },
      c2: { u: 0.13, v: 0.77 },
      c3: { u: 0.85, v: 0.84 },
    },
  },
  // 双向反例 4：引线打结
  failCross: {
    label: "引线打结",
    scale: 1.28,
    cx: 0.64,
    cy: 0.50,
    cutDepth: 0.34,
    copyScale: 0.90,
    vermilion: { u: 0.35, v: 0.87 },
    callouts: {
      c1: { u: 0.11, v: 0.77 },
      c2: { u: 0.11, v: 0.33 },
      c3: { u: 0.86, v: 0.84 },
    },
  },
};

export function createInitialState() {
  return clonePreset("broken", "poster140");
}

export function clonePreset(key, subject = "poster140") {
  const p = PRESETS[key] || PRESETS.broken;
  return {
    subject,
    scale: p.scale,
    cx: p.cx,
    cy: p.cy,
    cutDepth: p.cutDepth,
    copyScale: p.copyScale,
    vermilion: { u: p.vermilion.u, v: p.vermilion.v },
    callouts: {
      c1: { u: p.callouts.c1.u, v: p.callouts.c1.v },
      c2: { u: p.callouts.c2.u, v: p.callouts.c2.v },
      c3: { u: p.callouts.c3.u, v: p.callouts.c3.v },
    },
    activeDim: null,
    showGuides: true,
    glanceRemaining: 0,
    glanceDuration: 1.75,
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 精确二维线段相交判定（返回交点坐标或 null）
function segIntersect(a, b, c, d) {
  const rX = b.x - a.x, rY = b.y - a.y;
  const sX = d.x - c.x, sY = d.y - c.y;
  const denom = rX * sY - rY * sX;
  if (Math.abs(denom) < 1e-6) return null;
  const qpx = c.x - a.x, qpy = c.y - a.y;
  const t = (qpx * sY - qpy * sX) / denom;
  const u = (qpx * rY - qpy * rX) / denom;
  if (t > 0.03 && t < 0.97 && u > 0.03 && u < 0.97) {
    return { x: a.x + t * rX, y: a.y + t * rY };
  }
  return null;
}

function rectsOverlapArea(a, b) {
  const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return ox * oy;
}

// 将点 (px, py) 连接到矩形外框最近的边中点/角点，使黄线干净落边
function boxEdgePoint(box, target) {
  const cx = box.x + box.w * 0.5;
  const cy = box.y + box.h * 0.5;
  const dx = target.x - cx;
  const dy = target.y - cy;
  if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) return { x: cx, y: cy };
  const tx = dx !== 0 ? (box.w * 0.52) / Math.abs(dx) : 1e9;
  const ty = dy !== 0 ? (box.h * 0.52) / Math.abs(dy) : 1e9;
  const s = Math.min(tx, ty);
  return { x: cx + dx * s, y: cy + dy * s };
}

// 计算画面全部实绘几何与四维单真源评估（支持任意宽高的画布，圆永不压扁）
export function evaluateLayout(state, w = 800, h = 600) {
  const area = w * h;
  const areaUnit = Math.sqrt(area);
  const sub = SUBJECTS[state.subject] || SUBJECTS.poster140;

  // 1. 主图球体/圆形视觉核心几何（以 sqrt(w*h) 为等比尺，宽窄屏占比一致且永为正圆）
  const cx = state.cx * w;
  const cy = state.cy * h;
  const r = 0.42 * areaUnit * state.scale;

  // 2. 冰川浅蓝斜切面几何：满足 u + v >= thresh，其中 thresh = 2 - 2 * cutDepth
  const thresh = 2 - 2 * state.cutDepth;
  // 斜切线与画布四边的交点（用于绘制斜切刀刃与交互抓取柄）
  const cutLine = (() => {
    const pts = [];
    // 下边 v = 1 -> u = thresh - 1
    const uBot = thresh - 1;
    if (uBot >= 0 && uBot <= 1) pts.push({ x: uBot * w, y: h });
    // 左边 u = 0 -> v = thresh
    if (thresh >= 0 && thresh < 1) pts.push({ x: 0, y: thresh * h });
    // 右边 u = 1 -> v = thresh - 1
    const vRight = thresh - 1;
    if (vRight >= 0 && vRight <= 1) pts.push({ x: w, y: vRight * h });
    // 上边 v = 0 -> u = thresh
    if (thresh >= 0 && thresh < 1) pts.push({ x: thresh * w, y: 0 });
    // 排序：从左下到右上
    pts.sort((p, q) => p.x - q.x || q.y - p.y);
    const p1 = pts[0] || { x: w, y: h };
    const p2 = pts[pts.length - 1] || { x: w, y: h };
    const mid = { x: (p1.x + p2.x) * 0.5, y: (p1.y + p2.y) * 0.5 };
    return { p1, p2, mid, thresh };
  })();

  const inCutPlane = (x, y) => (x / w + y / h) >= thresh;

  // 3. 左下朱红锚点
  const vermR = clamp(areaUnit * 0.031, 10, 24);
  const verm = {
    x: clamp(state.vermilion.u * w, vermR + 12, w - vermR - 12),
    y: clamp(state.vermilion.v * h, vermR + 12, h - vermR - 12),
    r: vermR,
  };

  // 4. 刊头文字盒 + 视觉中心盒 + 3 个可拖动注释盒（尺寸随 copyScale 实变）
  const compact = w < 460;
  const cs = state.copyScale;
  const masthead = {
    x: w * 0.038,
    y: h * 0.038,
    w: clamp(w * 0.44 * (0.82 + 0.18 * cs), 130, w * 0.58),
    h: clamp(h * 0.13 * (0.85 + 0.15 * cs), 44, h * 0.21),
  };

  const c0Box = {
    id: "c0",
    x: w * 0.77,
    y: h * 0.045,
    w: clamp(w * 0.19, 76, 165),
    h: clamp(h * 0.09, 34, 62),
  };

  const baseBw = (compact ? w * 0.25 : w * 0.185) * cs;
  const baseBh = (compact ? h * 0.145 : h * 0.135) * cs;
  const makeCalloutBox = (id, pos) => {
    const bw = clamp(baseBw, compact ? 78 : 104, w * 0.34);
    const bh = clamp(baseBh, compact ? 48 : 58, h * 0.28);
    const x = clamp(pos.u * w - bw * 0.5, 10, w - bw - 10);
    const y = clamp(pos.v * h - bh * 0.5, 10, h - bh - 10);
    return { id, x, y, w: bw, h: bh, cx: x + bw * 0.5, cy: y + bh * 0.5 };
  };

  const boxes = {
    c1: makeCalloutBox("c1", state.callouts.c1),
    c2: makeCalloutBox("c2", state.callouts.c2),
    c3: makeCalloutBox("c3", state.callouts.c3),
  };

  // 5. 四枚实景锚点（永远贴在实绘几何的真实特征点上，而非写死坐标）
  // c0: 球体上右缘高光弧
  const a0Angle = -1.24; // ~ -71 deg
  const anchor0 = {
    x: clamp(cx + Math.cos(a0Angle) * r * 0.95, 20, w - 18),
    y: clamp(cy + Math.sin(a0Angle) * r * 0.95, 20, h - 18),
  };
  // c1: 球体左上受光侧脊
  const a1Angle = -2.52; // ~ -144 deg
  const anchor1 = {
    x: clamp(cx + Math.cos(a1Angle) * r * 0.86, 20, w - 18),
    y: clamp(cy + Math.sin(a1Angle) * r * 0.86, 20, h - 18),
  };
  // c2: 朱红锚点左侧缘
  const anchor2 = {
    x: clamp(verm.x - verm.r * 1.45, 14, w - 14),
    y: clamp(verm.y - verm.r * 0.45, 14, h - 14),
  };
  // c3: 斜切冰面刀刃中上点（紧贴斜切边）
  const cutLerp = 0.38;
  const anchor3 = {
    x: cutLine.p1.x + (cutLine.p2.x - cutLine.p1.x) * cutLerp,
    y: cutLine.p1.y + (cutLine.p2.y - cutLine.p1.y) * cutLerp,
  };

  const leaders = [
    { id: "c0", dashed: false, from: boxEdgePoint(c0Box, anchor0), to: anchor0 },
    { id: "c1", dashed: true, from: boxEdgePoint(boxes.c1, anchor1), to: anchor1 },
    { id: "c2", dashed: false, from: boxEdgePoint(boxes.c2, anchor2), to: anchor2 },
    { id: "c3", dashed: true, from: boxEdgePoint(boxes.c3, anchor3), to: anchor3 },
  ];

  // 6. 精确检测任意两条引线的交点
  const crossings = [];
  for (let i = 0; i < leaders.length; i++) {
    for (let j = i + 1; j < leaders.length; j++) {
      const pt = segIntersect(leaders[i].from, leaders[i].to, leaders[j].from, leaders[j].to);
      if (pt) crossings.push({ ...pt, a: leaders[i].id, b: leaders[j].id });
    }
  }

  // 7. 精确采样画布 32×24 = 768 点：计算主图占比、负空间占比、文字占地、文字盖主图占比
  const GX = 32, GY = 24;
  let subjectVisiblePts = 0;
  let textPts = 0;
  let textOnSubjectPts = 0;
  let calmNegPts = 0;
  const allTextBoxes = [masthead, c0Box, boxes.c1, boxes.c2, boxes.c3];
  const calloutOnlyBoxes = [boxes.c1, boxes.c2, boxes.c3];

  const ptInBox = (x, y, b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  const r2 = r * r;

  for (let iy = 0; iy < GY; iy++) {
    const py = ((iy + 0.5) / GY) * h;
    for (let ix = 0; ix < GX; ix++) {
      const px = ((ix + 0.5) / GX) * w;
      const inCut = inCutPlane(px, py);
      const inCircle = ((px - cx) * (px - cx) + (py - cy) * (py - cy)) <= r2;
      const inSubject = inCircle && !inCut;
      const inAnyText = allTextBoxes.some((b) => ptInBox(px, py, b));
      const inCallout = calloutOnlyBoxes.some((b) => ptInBox(px, py, b));

      if (inSubject) subjectVisiblePts++;
      if (inAnyText) textPts++;
      if (inSubject && inCallout) textOnSubjectPts++;
      if (!inSubject && !inAnyText) calmNegPts++;
    }
  }

  const totalCanvasPts = GX * GY;
  const visibleSubjectPct = Math.round((subjectVisiblePts / totalCanvasPts) * 100);
  const textAreaPct = Math.round((textPts / totalCanvasPts) * 100);
  const calmNegPct = Math.round((calmNegPts / totalCanvasPts) * 100);
  const textCoverSubjectPct = subjectVisiblePts > 0
    ? Math.round((textOnSubjectPts / subjectVisiblePts) * 100)
    : 0;

  // 8. 在圆的外接正方形内采样 24×24 点：精确计算破边裁切比、斜切裁切比与余形可辨识比
  const CG = 24;
  let circleTotal = 0;
  let circleEdgeOut = 0;
  let circleDiagCut = 0;
  let circleVisible = 0;
  for (let iy = 0; iy < CG; iy++) {
    const ny = ((iy + 0.5) / CG) * 2 - 1;
    for (let ix = 0; ix < CG; ix++) {
      const nx = ((ix + 0.5) / CG) * 2 - 1;
      if (nx * nx + ny * ny > 1) continue;
      circleTotal++;
      const px = cx + nx * r;
      const py = cy + ny * r;
      const outFrame = px < 0 || px > w || py < 0 || py > h;
      const sliced = inCutPlane(px, py);
      if (outFrame) circleEdgeOut++;
      else if (sliced) circleDiagCut++;
      else circleVisible++;
    }
  }
  const edgeBleedPct = Math.round((circleEdgeOut / Math.max(1, circleTotal)) * 100);
  const diagCutPct = Math.round((circleDiagCut / Math.max(1, circleTotal)) * 100);
  const totalCroppedPct = Math.min(100, edgeBleedPct + diagCutPct);
  const recognizableCorePct = Math.max(0, 100 - totalCroppedPct);

  // 9. 检查注释框碰撞（注释与注释、注释与刊头）
  let boxCollisions = 0;
  const checkPairs = [
    [boxes.c1, boxes.c2],
    [boxes.c1, boxes.c3],
    [boxes.c2, boxes.c3],
    [boxes.c1, masthead],
    [boxes.c2, masthead],
    [boxes.c3, masthead],
    [boxes.c3, c0Box],
  ];
  for (const [bA, bB] of checkPairs) {
    if (rectsOverlapArea(bA, bB) > 24) boxCollisions++;
  }

  // 10. 计算图文实绘占比（用于自示范标题的实时比例条）
  const ratioSum = Math.max(1, visibleSubjectPct + textAreaPct);
  const imageShare = Math.round((visibleSubjectPct / ratioSum) * 100);
  const textShare = 100 - imageShare;

  // 11. 四维度双向严审（单真源）
  // 维 1：图像优先 IMAGE PRIORITY
  let dimPriority;
  if (visibleSubjectPct < 42) {
    dimPriority = {
      ok: false,
      code: "stamp",
      badge: `缩图 ${visibleSubjectPct}%`,
      title: `主图仅占版面 ${visibleSubjectPct}%，退化成了文档配图`,
      detail: `图片主导版式通常以 45%–78%（经验值）的视觉体量压住全场。现在主图只占 ${visibleSubjectPct}%，与文字拉不开压倒性差距，眼睛进场没有明确落点。`,
      action: "在画布空白处向右横拖（或推大「主图尺度」滑杆），先把主体拉大到 45% 以上。",
    };
  } else if (visibleSubjectPct > 84 || calmNegPct < 11) {
    dimPriority = {
      ok: false,
      code: "suffocate",
      badge: `满塞 ${visibleSubjectPct}%`,
      title: `主图塞满 ${visibleSubjectPct}%，安静负空间仅剩 ${calmNegPct}%`,
      detail: "图像优先不等于把每一寸纸面塞死：四周没有至少 12% 的低对比负空间，标题和细注释就被逼着踩到画面纹理上，图文双输。",
      action: "稍微向左回拉主图尺度，或往右下推一点冰川斜切面，为四角留出安静落字区。",
    };
  } else {
    dimPriority = {
      ok: true,
      code: "ok",
      badge: `主图 ${visibleSubjectPct}%`,
      title: `主图占版面 ${visibleSubjectPct}%，压倒性视觉入口已成立`,
      detail: `画面保留了 ${calmNegPct}% 的纯净负空间承接刊头与注记，主次关系一眼分明。`,
      action: "",
    };
  }

  // 维 2：裁切处理 CROPPING
  let dimCropping;
  if (totalCroppedPct < 14 && state.cutDepth < 0.14) {
    dimCropping = {
      ok: false,
      code: "timid",
      badge: `未裁 ${totalCroppedPct}%`,
      title: `主体完整缩在框内（破边与斜切共 ${totalCroppedPct}%），缺乏张力`,
      detail: "把球体或建筑整颗完整放进画面，观者立刻估出它的边界，显得像静态证件照；果断让局部破出画框或被斜切面截断，格式塔闭合会让大脑脑补出比画纸更大的体量。",
      action: "把主图向右放大让外弧破出右缘，或向左上拖动右下冰川斜切刃切入 20%–42%。",
    };
  } else if (recognizableCorePct < 38 || diagCutPct > 48) {
    dimCropping = {
      ok: false,
      code: "overcrop",
      badge: `过裁 余${recognizableCorePct}%`,
      title: `裁切吃掉 ${totalCroppedPct}%，主体可辨识轮廓只剩 ${recognizableCorePct}%`,
      detail: "裁切过度会把核心造型切成难以辨认的抽象碎片，读者在第一眼无法瞬间识别「画的是什么」，视觉先于阅读的优势当场失效。",
      action: "回调斜切深度或收小主图尺度，让画面保留至少 40% 以上清晰可辨的主体轮廓。",
    };
  } else {
    dimCropping = {
      ok: true,
      code: "ok",
      badge: `裁切 ${totalCroppedPct}%`,
      title: `破边与斜切合力裁去 ${totalCroppedPct}%，留存 ${recognizableCorePct}% 完整识别度`,
      detail: `右缘出血 ${edgeBleedPct}% 叠加冰川斜切 ${diagCutPct}%，把主体体量撑出了画框之外。`,
      action: "",
    };
  }

  // 维 3：视觉中心 VISUAL CENTER（主体无遮挡 + 文案克制退让）
  let dimCenter;
  if (textCoverSubjectPct > 5) {
    dimCenter = {
      ok: false,
      code: "cover",
      badge: `盖图 ${textCoverSubjectPct}%`,
      title: `注释块压在主图上，遮挡焦点区域 ${textCoverSubjectPct}%`,
      detail: "把文案直接糊在主图受光面或核心结构上，是图片主导版式最常见的破坏：文字既抢走了视线重心，又把最精彩的明暗转折切碎了。",
      action: "直接拖动画布上压住主图的注释卡，把它们退回左侧深蓝或右下冰蓝安静区。",
    };
  } else if (textAreaPct > 28) {
    dimCenter = {
      ok: false,
      code: "bloat",
      badge: `字重 ${textAreaPct}%`,
      title: `文字块占地高达 ${textAreaPct}%，在和主图抢夺第一眼`,
      detail: `目前图文面积占比为 图 ${imageShare}% : 字 ${textShare}%，文案体量过于臃肿，画面滑向图文五五开。注释应当精短、退居次席。`,
      action: "调小「注释体量」滑杆到 1.0× 以下，把舞台还给主图。",
    };
  } else {
    dimCenter = {
      ok: true,
      code: "ok",
      badge: `遮挡 ${textCoverSubjectPct}%`,
      title: `焦点零遮挡，图文面积比达到 图 ${imageShare}% : 字 ${textShare}%`,
      detail: "标题与注记安分守在低对比负空间，人眼进入画面 13ms 内先锁定主图再读取信息。",
      action: "",
    };
  }

  // 维 4：注释引导 ANNOTATION GUIDE
  let dimAnnotation;
  if (crossings.length > 0) {
    dimAnnotation = {
      ok: false,
      code: "cross",
      badge: `交叉 ${crossings.length} 处`,
      title: `黄色注释引线在画中交叉打结 ${crossings.length} 处`,
      detail: "引线本该像安静的视线轨道把主图细节导向边缘说明；一旦交叉，读者必须顺着线头来回辨认「哪段字指哪一处」，层级指引立刻变噪音。",
      action: "拖动打结的注释卡互换上下或左右位置（如「图像优先」放左上、「注释引导」放左下、「裁切处理」放右下），解开交叉。",
    };
  } else if (boxCollisions > 0) {
    dimAnnotation = {
      ok: false,
      code: "collide",
      badge: `撞盒 ${boxCollisions} 处`,
      title: `有 ${boxCollisions} 处注释与刊头或邻近注记相互叠压`,
      detail: "边缘负空间里的注释之间同样需要留出呼吸间隔，贴在一起会让多个层级糊成一团。",
      action: "把重叠的注释卡往四周拉开，各自守住一片干净角落。",
    };
  } else {
    dimAnnotation = {
      ok: true,
      code: "ok",
      badge: "0 交叉",
      title: "四道柠檬黄引线零交叉，实线主锚与虚线副注清晰分流",
      detail: "每条细线都从安静负空间出发，精准钉在球体边缘、朱红配重点与冰川斜切刃上。",
      action: "",
    };
  }

  const dims = {
    priority: dimPriority,
    cropping: dimCropping,
    center: dimCenter,
    annotation: dimAnnotation,
  };
  const passCount = Object.values(dims).filter((d) => d.ok).length;

  // 主诊单优先报最致命的一项错态
  let primary;
  if (passCount === 4) {
    primary = {
      ok: true,
      pill: "4/4 · 图像主导成立",
      tag: "单真源实测通过（示意）",
      title: `主图占 ${visibleSubjectPct}%、裁切 ${totalCroppedPct}%、零盖图零交叉`,
      detail: `此刻图文实绘权重为 图 ${imageShare}% : 字 ${textShare}%，按 Space 触发 13ms 闪看验真，感受人眼如何在第一时间先被主图接住，再顺着黄色细引线读完四处注释。`,
      action: "你可以继续试试「特写大裁解」或「画廊留白解」，观察不同裁切强度下图片主导的多组合法形态。",
    };
  } else {
    const order = dimCropping.code === "overcrop"
      ? [dimCropping, dimPriority, dimCenter, dimAnnotation]
      : [dimPriority, dimCenter, dimAnnotation, dimCropping];
    const firstBad = order.find((d) => !d.ok);
    const badNames = {
      stamp: `缩图 ${visibleSubjectPct}%`,
      suffocate: `满塞 ${visibleSubjectPct}%`,
      timid: `未裁 ${totalCroppedPct}%`,
      overcrop: `过裁 余${recognizableCorePct}%`,
      cover: `盖图 ${textCoverSubjectPct}%`,
      bloat: `字重 ${textAreaPct}%`,
      cross: `交叉 ${crossings.length} 处`,
      collide: `撞盒 ${boxCollisions} 处`,
    };
    primary = {
      ok: false,
      pill: `${passCount}/4 · ${badNames[firstBad.code] || "结构失衡"}`,
      tag: `${4 - passCount} 处待校准（单真源实测）`,
      title: firstBad.title,
      detail: firstBad.detail,
      action: firstBad.action,
    };
  }

  return {
    w,
    h,
    areaUnit,
    sub,
    cx,
    cy,
    r,
    cutLine,
    verm,
    masthead,
    c0Box,
    boxes,
    anchors: { c0: anchor0, c1: anchor1, c2: anchor2, c3: anchor3 },
    leaders,
    crossings,
    metrics: {
      visibleSubjectPct,
      textAreaPct,
      calmNegPct,
      textCoverSubjectPct,
      edgeBleedPct,
      diagCutPct,
      totalCroppedPct,
      recognizableCorePct,
      boxCollisions,
      crossCount: crossings.length,
      imageShare,
      textShare,
    },
    dims,
    passCount,
    primary,
  };
}

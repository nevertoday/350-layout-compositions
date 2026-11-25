// 074 斜投影构图 · 单一真源几何模型（开场制图台 + 正文实验 + 小练习共用同一套投影方程）

export const INITIAL_STATE = Object.freeze({
  subject: "poster",        // "poster" | "radio" | "shelf"
  frontShearDeg: 14,        // 正面水平切斜角（°），0° = 严格正交 90° 真形
  angleDeg: 18,             // 斜向延展角 α（°），逆时针自 +X 轴起算（45° = 右上）
  depthRatio: 1.35,         // 进深缩放系数 k = 斜边长 / 正面真实边长（0.50 = 橱柜，1.00 = 骑士）
  companionOffsetDeg: 38,   // 副体斜角偏离主体的误差角 Δα（°），0° = 严格平行
});

export const PRESETS = {
  broken: {
    label: "复原 0/3 错态",
    frontShearDeg: 14,
    angleDeg: 18,
    depthRatio: 1.35,
    companionOffsetDeg: 38,
  },
  cabinet45: {
    label: "橱柜 45° · 0.5×",
    frontShearDeg: 0,
    angleDeg: 45,
    depthRatio: 0.50,
    companionOffsetDeg: 0,
  },
  cabinet30: {
    label: "展侧 30° · 0.58×",
    frontShearDeg: 0,
    angleDeg: 30,
    depthRatio: 0.58,
    companionOffsetDeg: 0,
  },
  cabinet135: {
    label: "左上 135° · 0.5×",
    frontShearDeg: 0,
    angleDeg: 135,
    depthRatio: 0.50,
    companionOffsetDeg: 0,
  },
  cavalier45: {
    label: "试看骑士 45° · 1.0×",
    frontShearDeg: 0,
    angleDeg: 45,
    depthRatio: 1.00,
    companionOffsetDeg: 0,
  },
};

export const RAD = Math.PI / 180;
export const DEG = 180 / Math.PI;

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 统一二维斜投影映射：将局部三维点 (x, y, z) 投到画布坐标
// 约定：x 向右为正，y 向上为正，z 向画面深处为正（从正面后退）
// frontShearDeg 模拟初学者把正面画歪（顶部沿 X 轴错切）
export function projectPoint(originX, originY, x, y, z, { frontShearDeg = 0, angleDeg = 45, depthRatio = 0.5 }) {
  const shear = Math.tan(frontShearDeg * RAD);
  const a = angleDeg * RAD;
  const px = originX + x + y * shear + z * depthRatio * Math.cos(a);
  const py = originY - y - z * depthRatio * Math.sin(a);
  return { x: px, y: py };
}

// 计算一个斜投影长方体的八个顶点、三个可见面、隐藏边与实测角
export function buildObliqueBox(originX, originY, w, h, d, params) {
  const P = (x, y, z) => projectPoint(originX, originY, x, y, z, params);
  const fbl = P(0, 0, 0);
  const fbr = P(w, 0, 0);
  const ftr = P(w, h, 0);
  const ftl = P(0, h, 0);

  const bbl = P(0, 0, d);
  const bbr = P(w, 0, d);
  const btr = P(w, h, d);
  const btl = P(0, h, d);

  const a = params.angleDeg * RAD;
  const goRight = Math.cos(a) >= 0;
  const goUp = Math.sin(a) >= 0;

  // 正面多边形（逆时针）
  const front = [fbl, fbr, ftr, ftl];
  // 顶面或底面
  const cap = goUp ? [ftl, ftr, btr, btl] : [fbl, fbr, bbr, bbl];
  // 右侧面或左侧面
  const side = goRight ? [fbr, bbr, btr, ftr] : [fbl, bbl, btl, ftl];

  // 从实绘顶点反算几何测量值（确保读数和画出来的像素绝对同一真源）
  const edgeBottom = { x: fbr.x - fbl.x, y: fbr.y - fbl.y };
  const edgeLeft = { x: ftl.x - fbl.x, y: ftl.y - fbl.y };
  const dotBL = edgeBottom.x * edgeLeft.x + edgeBottom.y * edgeLeft.y;
  const lenB = Math.hypot(edgeBottom.x, edgeBottom.y) || 1;
  const lenL = Math.hypot(edgeLeft.x, edgeLeft.y) || 1;
  const cornerDeg = Math.acos(clamp(dotBL / (lenB * lenL), -1, 1)) * DEG;

  // 斜向向量直接由实绘前顶右角→后顶右角量出
  const extVec = goRight
    ? { x: btr.x - ftr.x, y: ftr.y - btr.y }
    : { x: btl.x - ftl.x, y: ftl.y - btl.y };
  const extLen = Math.hypot(extVec.x, extVec.y);
  const measuredAngleDeg = ((Math.atan2(extVec.y, extVec.x) * DEG) + 360) % 360;
  const measuredDepthRatio = d > 0 ? extLen / d : 0;

  // 正面圆在切变矩阵 [[1, s], [0, 1]] 下的真实长短轴比（奇异值比）
  const s = Math.tan((params.frontShearDeg || 0) * RAD);
  const halfS = Math.abs(s) * 0.5;
  const sigmaMax = Math.sqrt(1 + halfS * halfS) + halfS;
  const sigmaMin = Math.max(0.01, Math.sqrt(1 + halfS * halfS) - halfS);
  const circleRatio = sigmaMax / sigmaMin;

  // 面积（鞋带公式）计算顶面与侧面实绘占比
  const polyArea = (pts) => {
    let sum = 0;
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i], p2 = pts[(i + 1) % pts.length];
      sum += p1.x * p2.y - p2.x * p1.y;
    }
    return Math.abs(sum) * 0.5;
  };
  const frontArea = polyArea(front);
  const capArea = polyArea(cap);
  const sideArea = polyArea(side);

  return {
    v: { fbl, fbr, ftr, ftl, bbl, bbr, btr, btl },
    front,
    cap,
    side,
    goRight,
    goUp,
    handleExtrude: goRight ? btr : btl,
    handleAnchor: goRight ? ftr : ftl,
    handleFront: ftl,
    measured: {
      cornerDeg,
      angleDeg: measuredAngleDeg,
      depthRatio: measuredDepthRatio,
      circleRatio,
      frontArea,
      capArea,
      sideArea,
    },
  };
}

// 计算整个开场制图台几何 + 单真源诊断（一次投影，画面与文字共用）
export function computeHeroScene(state, W, H, reveal = 1) {
  const narrow = W < 460;
  const unit = narrow
    ? Math.min(W * 0.21, H * 0.34)
    : Math.min(W * 0.195, H * 0.37);
  const mainW = unit;
  const mainH = unit;
  const mainD = unit;

  // 主体与副体坐标确保极端 1.35× 拉伸与 18° 浅角时后角手柄与延伸箭头全数留在画内
  const mainOriginX = narrow ? W * 0.36 : W * 0.37;
  const groundY = narrow ? H * 0.78 : H * 0.83;

  const compW = unit * 0.45;
  const compH = unit * 0.52;
  const compD = unit * 0.48;
  const compOriginX = Math.max(W * 0.055, mainOriginX - unit * 0.84);

  const effDepth = state.depthRatio * clamp(reveal, 0, 1);

  const mainBox = buildObliqueBox(mainOriginX, groundY, mainW, mainH, mainD, {
    frontShearDeg: state.frontShearDeg,
    angleDeg: state.angleDeg,
    depthRatio: effDepth,
  });

  const compAngle = clamp(state.angleDeg + state.companionOffsetDeg, 6, 174);
  const compBox = buildObliqueBox(compOriginX, groundY, compW, compH, compD, {
    frontShearDeg: 0, // 副体正面始终方正，聚焦凸显斜线平行冲突
    angleDeg: compAngle,
    depthRatio: Math.max(0.45, Math.min(1.05, effDepth)),
  });

  // 实测指标（按完整 reveal=1 的几何计算，确保动画中途读数就与目标态一致，不跳假数）
  const fullMain = reveal >= 0.999
    ? mainBox
    : buildObliqueBox(mainOriginX, groundY, mainW, mainH, mainD, state);
  const fullComp = reveal >= 0.999
    ? compBox
    : buildObliqueBox(compOriginX, groundY, compW, compH, compD, {
        frontShearDeg: 0,
        angleDeg: compAngle,
        depthRatio: Math.max(0.45, Math.min(1.05, state.depthRatio)),
      });

  const cornerDeg = fullMain.measured.cornerDeg;
  const angleDeg = fullMain.measured.angleDeg;
  const depthRatio = fullMain.measured.depthRatio;
  const circleRatio = fullMain.measured.circleRatio;

  let parallelDiff = Math.abs(fullComp.measured.angleDeg - fullMain.measured.angleDeg);
  if (parallelDiff > 180) parallelDiff = 360 - parallelDiff;

  // 三项核心结构判据
  const frontTrue = Math.abs(cornerDeg - 90) <= 1.5;
  const parallelOk = parallelDiff <= 2.0;

  // 有效斜角带：右上 24°–68° 或 左上 112°–156°（避开 0°/90°/180° 坍缩与过扁挤面）
  const angleInRightBand = angleDeg >= 24 && angleDeg <= 68;
  const angleInLeftBand = angleDeg >= 112 && angleDeg <= 156;
  const angleOk = angleInRightBand || angleInLeftBand;
  const angleCollapsed = angleDeg < 10 || angleDeg > 170 || Math.abs(angleDeg - 90) < 10;

  const depthTooFlat = depthRatio < 0.24;
  const depthBalanced = depthRatio >= 0.35 && depthRatio <= 0.82;
  const depthCavalier = depthRatio > 0.82 && depthRatio <= 1.08;
  const depthStretched = depthRatio > 1.08;

  const visualOk = angleOk && depthBalanced;
  const cavalierValid = frontTrue && parallelOk && angleOk && depthCavalier;
  const score = (frontTrue ? 1 : 0) + (parallelOk ? 1 : 0) + (visualOk ? 1 : 0);

  // 单真源诊断（先诊最硬的结构性错误，再诊体量与方向细节，明确说出「为什么」和「怎么改」）
  let severity = "err"; // "err" | "warn" | "ok"
  let badge = `${score} / 3 待校准`;
  let headline = "";
  let body = "";
  let hint = "";

  if (!frontTrue) {
    severity = "err";
    badge = `错态 · 正面歪斜 (${score}/3)`;
    headline = `正面内角被切歪成 ${cornerDeg.toFixed(1)}°，基准面不再真实`;
    body = `斜投影的第一条铁律是正面与画纸完全平行、四角守住 90°。现在正面切歪了 ${Math.abs(state.frontShearDeg).toFixed(0)}°，正圆被拉成 ${circleRatio.toFixed(2)}:1 的椭圆，读者一眼失去衡量尺度的基准。`;
    hint = "拖动正面左上角圆柄（或点画布「扳正正面」），把朱红正面拉回 90.0°。";
  } else if (!parallelOk) {
    severity = "err";
    badge = `错态 · 斜线打架 (${score}/3)`;
    headline = `副体与主体斜线相差 ${parallelDiff.toFixed(1)}°，空间秩序裂开`;
    body = `同一幅斜投影构图里，所有物体的进深斜线必须沿同一个平行方向延展。现在左侧副体按 ${fullComp.measured.angleDeg.toFixed(0)}° 伸出、主体按 ${angleDeg.toFixed(0)}° 伸出，两条斜轨彼此错交，画面像拼了两张方向冲突的图。`;
    hint = "直接点击或拖动左侧副体的赤红斜线手柄（或按「平行对齐」），把平行差归零。";
  } else if (depthTooFlat) {
    severity = "err";
    badge = `错态 · 深度坍平 (${score}/3)`;
    headline = `进深系数只剩 ${depthRatio.toFixed(2)}×，体量压回二维纸片`;
    body = "斜向长度太短时，顶面与侧面缩成极窄细缝，观众只能读到一块平面色块，立体厚度完全站不起来。";
    hint = "按住后角橙柄往右上（或左上）拉长，把进深系数推入 0.45×–0.70× 区间。";
  } else if (angleCollapsed) {
    severity = "err";
    badge = `错态 · 侧面坍缩 (${score}/3)`;
    headline = `斜角 ${angleDeg.toFixed(0)}° 贴近坐标轴，丢掉了一个立体面`;
    body = angleDeg < 10 || angleDeg > 170
      ? "斜线几乎水平贴地，顶面面积坍缩为零，画面只剩左右错移，看不出俯视空间层次。"
      : "斜线几乎垂直向上，侧面面积坍缩为零，方块像被压平的立面卡片，缺乏侧面厚度。";
    hint = "把后角橙柄扫向 30°–60°（或左上 120°–150°），让顶面与侧面同时清楚露出。";
  } else if (depthStretched) {
    severity = "err";
    badge = `错态 · 深度拉爆 (${score}/3)`;
    headline = `进深系数高达 ${depthRatio.toFixed(2)}×，正方体被拉成细长隧道`;
    body = "因为斜投影没有近大远小的透视收拢，人眼看斜线时天生会高估它的深度。进深超过真实边长（1.00×）后，等边立方体会严重显长，体量彻底失真。";
    hint = "把后角橙柄往回缩，收进 0.45×–0.65× 的橱柜比例（标准 0.50×）再看体量。";
  } else if (!angleOk) {
    severity = "warn";
    badge = `失衡 · 斜角偏窄 (${score}/3)`;
    headline = `斜角 ${angleDeg.toFixed(0)}° 偏极，顶面与侧面比例失衡`;
    const low = angleDeg < 24 || angleDeg > 156;
    body = low
      ? "斜角太扁，顶面被压得过窄，所有视觉重量都挤向侧面，整体显得紧促压抑。"
      : "斜角太陡，侧面被挤成窄边，块体像被从头顶硬压下去，失去轻快的斜向展开感。";
    hint = "拖动后角橙柄把斜角调进 24°–68°（经典 45°）或左上 112°–156° 区间。";
  } else if (cavalierValid) {
    severity = "warn";
    badge = "工程可量 · 骑士 1:1";
    headline = `骑士投影（k = ${depthRatio.toFixed(2)}×）：尺子量得准，肉眼仍觉偏长`;
    body = "三条几何规则都成立了，且 1:1 斜等测允许工程师拿尺直接量取进深；但因缺少透视缩窄，视觉上立方体会显得比实际长出一截。平面海报与插画里更常缩半成 0.50× 橱柜投影。";
    hint = "可以留在 1:1 体验骑士投影，也可以把后角柄往回缩到 0.50× 对比橱柜体量。";
  } else {
    severity = "ok";
    const dirName = angleDeg > 90 ? "左上延展" : (angleDeg < 37 ? "轻展侧面" : angleDeg > 53 ? "高展顶面" : "经典 45°");
    badge = "3 / 3 秩序成立";
    headline = `正面 90.0° 真形 + ${angleDeg.toFixed(0)}° 平行斜深（${dirName}）`;
    body = `正面的直角与正圆一毫不差，副体与主体严格保持 ${parallelDiff.toFixed(1)}° 平行，进深按 ${depthRatio.toFixed(2)}× 适度缩深抵消了拉长错觉——既有平面基准的利落，又有清晰稳妥的立体体量。`;
    hint = "试试切换「真圆表盘收音机」或「立面书架」，或拉向左上 135° 验证另一组合法解。";
  }

  return {
    W,
    H,
    unit,
    groundY,
    mainBox,
    compBox,
    metrics: {
      cornerDeg,
      angleDeg,
      depthRatio,
      circleRatio,
      parallelDiff,
      topToSideRatio: fullMain.measured.sideArea > 1
        ? fullMain.measured.capArea / fullMain.measured.sideArea
        : 99,
    },
    checks: {
      frontTrue,
      parallelOk,
      angleOk,
      depthBalanced,
      depthCavalier,
      visualOk,
      cavalierValid,
      score,
    },
    diagnosis: { severity, badge, headline, body, hint },
  };
}

// ---------- 第 03 节：四投影同体实时对照（同一单位立方体，四套投影方程） ----------
// 返回 { front[4], cap[4], side[4], circlePts[36], metrics }，坐标在归一化 [-1, 1] 空间
export function computeProjectionComparison(mode, cx, cy, size) {
  const s = size;
  const half = s * 0.5;
  const circleN = 40;

  if (mode === "oblique") {
    // 074 斜投影：正面 90° 真形 + 45° / 0.5× 平行斜深
    const a = 45 * RAD;
    const k = 0.5;
    const dx = s * k * Math.cos(a);
    const dy = -s * k * Math.sin(a);
    const ox = cx - half - dx * 0.45;
    const oy = cy + half - dy * 0.45;
    const fbl = { x: ox, y: oy };
    const fbr = { x: ox + s, y: oy };
    const ftr = { x: ox + s, y: oy - s };
    const ftl = { x: ox, y: oy - s };
    const bbr = { x: fbr.x + dx, y: fbr.y + dy };
    const btr = { x: ftr.x + dx, y: ftr.y + dy };
    const btl = { x: ftl.x + dx, y: ftl.y + dy };
    const circlePts = [];
    const r = s * 0.34;
    for (let i = 0; i < circleN; i++) {
      const th = (i / circleN) * Math.PI * 2;
      circlePts.push({ x: ox + half + Math.cos(th) * r, y: oy - half + Math.sin(th) * r });
    }
    return {
      front: [fbl, fbr, ftr, ftl],
      cap: [ftl, ftr, btr, btl],
      side: [fbr, bbr, btr, ftr],
      circlePts,
      vanishingPoints: [],
      metrics: {
        frontCorner: "90.0°（真直角）",
        circleShape: "1.00 : 1（真圆）",
        depthRays: "严格平行 · 无消失点",
        measurable: "正面全尺寸直接可量",
      },
      summary: "正面完全正对画纸，直角和正圆一毫不差；深度沿 45° 平行线向后缩半延展，最适合正面有文字、仪表盘或精确轮廓的主体。",
    };
  }

  if (mode === "isometric") {
    // 075 等距构图：三轴互成 120°，水平两轴上倾 30°，无正对画面的真形面
    const cos30 = Math.cos(30 * RAD);
    const sin30 = Math.sin(30 * RAD);
    const u = s * 0.78;
    const bot = { x: cx, y: cy + u * 0.88 };
    const mid = { x: cx, y: bot.y - u };
    const leftBot = { x: bot.x - u * cos30, y: bot.y - u * sin30 };
    const leftTop = { x: mid.x - u * cos30, y: mid.y - u * sin30 };
    const rightBot = { x: bot.x + u * cos30, y: bot.y - u * sin30 };
    const rightTop = { x: mid.x + u * cos30, y: mid.y - u * sin30 };
    const backTop = { x: cx, y: mid.y - 2 * u * sin30 };
    // 左前面上的圆投成标准等距椭圆
    const circlePts = [];
    const r = 0.34;
    for (let i = 0; i < circleN; i++) {
      const th = (i / circleN) * Math.PI * 2;
      const lx = 0.5 + Math.cos(th) * r;
      const ly = 0.5 + Math.sin(th) * r;
      circlePts.push({
        x: bot.x - lx * u * cos30,
        y: bot.y - lx * u * sin30 - ly * u,
      });
    }
    return {
      front: [leftBot, bot, mid, leftTop],
      cap: [leftTop, mid, rightTop, backTop],
      side: [bot, rightBot, rightTop, mid],
      circlePts,
      vanishingPoints: [],
      metrics: {
        frontCorner: "60.0° / 120.0°（菱形）",
        circleShape: "1.73 : 1（偏斜椭圆）",
        depthRays: "三组皆平行 · 30° 对称",
        measurable: "三轴等比，但无真直角面",
      },
      summary: "三个面机会均等，适合游戏沙盘与工业装配图；代价是没有一个面正对画纸，正面文字和正圆全部变成 30° 倾斜菱形与椭圆。",
    };
  }

  if (mode === "onepoint") {
    // 070 一点透视：正面仍保持 90° 真形，但所有纵深线汇聚到单个消失点 VP
    const ox = cx - s * 0.72;
    const oy = cy + s * 0.54;
    const fbl = { x: ox, y: oy };
    const fbr = { x: ox + s, y: oy };
    const ftr = { x: ox + s, y: oy - s };
    const ftl = { x: ox, y: oy - s };
    const vp = { x: cx + s * 1.15, y: cy - s * 0.88 };
    const t = 0.36;
    const lerp = (a, b) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    const bbr = lerp(fbr, vp);
    const btr = lerp(ftr, vp);
    const btl = lerp(ftl, vp);
    const circlePts = [];
    const r = s * 0.34;
    for (let i = 0; i < circleN; i++) {
      const th = (i / circleN) * Math.PI * 2;
      circlePts.push({ x: ox + half + Math.cos(th) * r, y: oy - half + Math.sin(th) * r });
    }
    return {
      front: [fbl, fbr, ftr, ftl],
      cap: [ftl, ftr, btr, btl],
      side: [fbr, bbr, btr, ftr],
      circlePts,
      vanishingPoints: [vp],
      metrics: {
        frontCorner: "90.0°（正面真直角）",
        circleShape: "1.00 : 1（正面真圆）",
        depthRays: "向单消失点汇聚",
        measurable: "仅最前立面同尺，后方缩窄",
      },
      summary: "和斜投影一样保住了正面 90° 真形，但纵深线不再平行而是收向一点——进深感更逼真，代价是前后不再等大、不能跨深度直接比尺寸。",
    };
  }

  // 071 两点透视：竖棱垂直，左右两立面同时分别收向左右两个消失点
  const hzY = cy - s * 0.64;
  const vpL = { x: cx - s * 1.95, y: hzY };
  const vpR = { x: cx + s * 1.75, y: hzY };
  const fBot = { x: cx - s * 0.08, y: cy + s * 0.68 };
  const fTop = { x: cx - s * 0.08, y: cy - s * 0.36 };
  const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const lBot = lerp(fBot, vpL, 0.38);
  const lTop = lerp(fTop, vpL, 0.38);
  const rBot = lerp(fBot, vpR, 0.34);
  const rTop = lerp(fTop, vpR, 0.34);
  // 求后顶角：lTop→vpR 与 rTop→vpL 交点
  const intersect = (p1, p2, p3, p4) => {
    const den = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (Math.abs(den) < 1e-6) return { x: cx, y: hzY };
    const px = ((p1.x * p2.y - p1.y * p2.x) * (p3.x - p4.x) - (p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x)) / den;
    const py = ((p1.x * p2.y - p1.y * p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x)) / den;
    return { x: px, y: py };
  };
  const backTop = intersect(lTop, vpR, rTop, vpL);
  // 双线性透视近似将圆投射到左前墙面
  const circlePts = [];
  const r = 0.34;
  const bilerp = (u, v) => {
    const botP = lerp(lBot, fBot, u);
    const topP = lerp(lTop, fTop, u);
    return lerp(botP, topP, v);
  };
  for (let i = 0; i < circleN; i++) {
    const th = (i / circleN) * Math.PI * 2;
    circlePts.push(bilerp(0.5 + Math.cos(th) * r, 0.5 + Math.sin(th) * r));
  }
  return {
    front: [lBot, fBot, fTop, lTop],
    cap: [lTop, fTop, rTop, backTop],
    side: [fBot, rBot, rTop, fTop],
    circlePts,
    vanishingPoints: [vpL, vpR],
    metrics: {
      frontCorner: "≈ 74° / 106°（透视梯形）",
      circleShape: "≈ 1.48 : 1（透视椭圆）",
      depthRays: "分汇左右两消失点",
      measurable: "仅竖直棱线平行，无真形面",
    },
    summary: "最贴近真实建筑街角摄影，但左右两堵墙全部斜退成梯形，圆与字都需要按透视网格重新变形。",
  };
}

// ---------- 第 07 节：小练习四组方案（完全相同的三块正面，单变量只改斜向向量） ----------
export const PRACTICE_OPTIONS = [
  {
    id: "A",
    correct: false,
    boxes: [
      { x: 0.14, y: 0.78, w: 0.21, h: 0.36, d: 0.22, angleDeg: 22, depthRatio: 0.52 },
      { x: 0.41, y: 0.80, w: 0.22, h: 0.26, d: 0.22, angleDeg: 46, depthRatio: 0.52 },
      { x: 0.68, y: 0.77, w: 0.17, h: 0.34, d: 0.20, angleDeg: 70, depthRatio: 0.52 },
    ],
    tag: "斜角各异：22° / 46° / 70°",
    reason: "三块正面虽然都是 90° 真形，但每块各自选了不同的斜角（22°、46°、70°），斜线互不平行，破坏了斜投影最核心的「方向一致」空间秩序。",
  },
  {
    id: "B",
    correct: false,
    boxes: [
      { x: 0.14, y: 0.78, w: 0.21, h: 0.36, d: 0.22, angleDeg: 34, depthRatio: 0.56, convergeTo: { x: 0.96, y: 0.16 } },
      { x: 0.41, y: 0.80, w: 0.22, h: 0.26, d: 0.22, angleDeg: 45, depthRatio: 0.56, convergeTo: { x: 0.96, y: 0.16 } },
      { x: 0.68, y: 0.77, w: 0.17, h: 0.34, d: 0.20, angleDeg: 61, depthRatio: 0.56, convergeTo: { x: 0.96, y: 0.16 } },
    ],
    tag: "斜线偷偷汇聚至右上一点",
    reason: "乍看很有纵深，但把延展虚线拉长就会发现它们交在右上角同一个消失点——这是线性透视而不是平行延展的斜投影，越靠右的块体越扭曲。",
  },
  {
    id: "C",
    correct: true,
    boxes: [
      { x: 0.14, y: 0.78, w: 0.21, h: 0.36, d: 0.22, angleDeg: 45, depthRatio: 0.50 },
      { x: 0.41, y: 0.80, w: 0.22, h: 0.26, d: 0.22, angleDeg: 45, depthRatio: 0.50 },
      { x: 0.68, y: 0.77, w: 0.17, h: 0.34, d: 0.20, angleDeg: 45, depthRatio: 0.50 },
    ],
    tag: "严格平行 45° · 0.50× 橱柜缩深",
    reason: "正确答案！三块正面保持严格 90° 真形，所有斜向边线全部互相平行在 45° 上，进深统一按 0.50× 橱柜比例缩半，空间秩序利落、体量自然。",
  },
  {
    id: "D",
    correct: false,
    boxes: [
      { x: 0.14, y: 0.78, w: 0.21, h: 0.36, d: 0.22, angleDeg: 45, depthRatio: 1.38 },
      { x: 0.41, y: 0.80, w: 0.22, h: 0.26, d: 0.22, angleDeg: 45, depthRatio: 1.38 },
      { x: 0.68, y: 0.77, w: 0.17, h: 0.34, d: 0.20, angleDeg: 45, depthRatio: 1.38 },
    ],
    tag: "虽平行 45°，但进深拉爆 1.38×",
    reason: "斜线确实平行在 45° 上，但进深系数被拉到了 1.38×，远超橱柜 0.50× 乃至骑士 1.00×，方块被扯成重叠挤撞的长条隧道，体量比例明显失真。",
  },
];

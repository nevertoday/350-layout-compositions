// 191 路径文字 · 单一几何真源（曲线弧长参数化、曲率、逐字排布与旋转包围盒 SAT 碰撞实测）
// 所有坐标在逻辑舞台 760×450 中定义，画布按等比缩放映射，保证各屏不畸变。

export const STAGE_W = 760;
export const STAGE_H = 450;

export const HERO_TEXT = "文字自然流动，形成清晰的阅读节奏与方向感，让版面更具层次与表现力。";
// 原海报以珊瑚朱橘高亮「阅读节奏与方向感，」（索引 11..19）
export const HIGHLIGHT_RANGE = [11, 19];

// 经验参考阈值（均在界面注明为经验参考值）
export const RULES = {
  minCurvatureRatio: 4.6,  // R_min / fontSize >= 4.6 避免方块汉字内凹挤撞与外凸扇裂（经验参考）
  minArchRatio: 0.10,      // 相对起止弦长的总峰谷摆幅 >= 10% 才成曲势，防拉成死直线
  maxAngleDeg: 58,         // 顺读切线倾角上限（超过易歪头，超过 90° 即倒立）
  minCoverage: 0.56,       // 字列至少铺展路径 56%，避免挤成一小坨
  maxCoverage: 0.96,
  idealBend: 0.44,         // 磁吸参考弯曲度
  snapBendRadius: 0.04,
};

export const PATH_PRESETS = {
  sCurve: {
    id: "sCurve",
    label: "S 形曲流",
    note: "原海报母题：左下起点兜底上扬，经舒缓 S 弯指向右上箭头。",
    p0: { x: 80, y: 358 },
    p3: { x: 680, y: 92 },
    // 所有控制柄均落于逻辑画布安全区内，虚线切杆始终与手柄圆心严丝合缝
    straightC1: { x: 280, y: 270 },
    straightC2: { x: 480, y: 180 },
    wildC1: { x: 722, y: 404 },
    wildC2: { x: 38, y: 44 },
    fontSize: 16.5,
  },
  arch: {
    id: "arch",
    label: "穹顶拱弧",
    note: "经典徽章与封面拱标：单向连续外凸弧，检验圆径与字距撑开。",
    p0: { x: 86, y: 358 },
    p3: { x: 674, y: 358 },
    straightC1: { x: 282, y: 358 },
    straightC2: { x: 478, y: 358 },
    wildC1: { x: 540, y: 24 },
    wildC2: { x: 220, y: 24 },
    fontSize: 16.5,
  },
  ribbon: {
    id: "ribbon",
    label: "双波丝带",
    note: "横向起伏飘带：起伏过深会令字行上下剧烈抖动、视线断续。",
    p0: { x: 68, y: 238 },
    p3: { x: 692, y: 212 },
    straightC1: { x: 276, y: 229 },
    straightC2: { x: 484, y: 221 },
    wildC1: { x: 320, y: 18 },
    wildC2: { x: 440, y: 432 },
    fontSize: 16.5,
  },
};

const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function controlsFromBend(presetId, bend) {
  const p = PATH_PRESETS[presetId] || PATH_PRESETS.sCurve;
  const b = clamp(bend, 0, 1);
  return {
    p0: { ...p.p0 },
    p3: { ...p.p3 },
    c1: { x: lerp(p.straightC1.x, p.wildC1.x, b), y: lerp(p.straightC1.y, p.wildC1.y, b) },
    c2: { x: lerp(p.straightC2.x, p.wildC2.x, b), y: lerp(p.straightC2.y, p.wildC2.y, b) },
  };
}

export function estimateBend(presetId, c1, c2) {
  const p = PATH_PRESETS[presetId] || PATH_PRESETS.sCurve;
  const v1x = p.wildC1.x - p.straightC1.x;
  const v1y = p.wildC1.y - p.straightC1.y;
  const v2x = p.wildC2.x - p.straightC2.x;
  const v2y = p.wildC2.y - p.straightC2.y;
  const d1 = (c1.x - p.straightC1.x) * v1x + (c1.y - p.straightC1.y) * v1y;
  const d2 = (c2.x - p.straightC2.x) * v2x + (c2.y - p.straightC2.y) * v2y;
  const n1 = v1x * v1x + v1y * v1y;
  const n2 = v2x * v2x + v2y * v2y;
  if (n1 + n2 < 1e-6) return 0;
  return clamp((d1 + d2) / (n1 + n2), 0, 1);
}

// 开场默认错态（0/4）：纯粹靠急弯内凹撞字 + 中段陡坡/倒立 + 急弯曲率 + 起点偏后末字出轨
export function createFaultState(presetId = "sCurve") {
  const bend = presetId === "sCurve" ? 0.96 : presetId === "arch" ? 0.94 : 0.96;
  const { c1, c2 } = controlsFromBend(presetId, bend);
  return {
    preset: presetId,
    bend,
    c1,
    c2,
    startOffset: presetId === "sCurve" ? 0.25 : presetId === "arch" ? 0.28 : 0.28,
    tracking: 0.02,
    side: "outside",
    baselineGap: 10,
    showNormals: true,
    activeHandle: "c1",
  };
}

export function createIdealState(presetId = "sCurve") {
  const bend = presetId === "sCurve" ? 0.44 : presetId === "arch" ? 0.36 : 0.48;
  const { c1, c2 } = controlsFromBend(presetId, bend);
  return {
    preset: presetId,
    bend,
    c1,
    c2,
    startOffset: 0.06,
    tracking: 0.06,
    side: "outside",
    baselineGap: 10,
    showNormals: false,
    activeHandle: "c1",
  };
}

export function evalCubic(p0, c1, c2, p3, t) {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  const x = uu * u * p0.x + 3 * uu * t * c1.x + 3 * u * tt * c2.x + tt * t * p3.x;
  const y = uu * u * p0.y + 3 * uu * t * c1.y + 3 * u * tt * c2.y + tt * t * p3.y;
  const dx = 3 * uu * (c1.x - p0.x) + 6 * u * t * (c2.x - c1.x) + 3 * tt * (p3.x - c2.x);
  const dy = 3 * uu * (c1.y - p0.y) + 6 * u * t * (c2.y - c1.y) + 3 * tt * (p3.y - c2.y);
  const ddx = 6 * u * (c2.x - 2 * c1.x + p0.x) + 6 * t * (p3.x - 2 * c2.x + c1.x);
  const ddy = 6 * u * (c2.y - 2 * c1.y + p0.y) + 6 * t * (p3.y - 2 * c2.y + c1.y);
  const speed = Math.hypot(dx, dy) || 1e-6;
  const tx = dx / speed;
  const ty = dy / speed;
  const nx = ty;
  const ny = -tx;
  const cross = dx * ddy - dy * ddx;
  const kappa = -cross / (speed * speed * speed);
  const angle = Math.atan2(dy, dx);
  return { t, x, y, dx, dy, tx, ty, nx, ny, kappa, angle };
}

export function buildCurveLUT(p0, c1, c2, p3, steps = 220) {
  const pts = new Array(steps + 1);
  let total = 0;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const e = evalCubic(p0, c1, c2, p3, t);
    if (i > 0) total += Math.hypot(e.x - pts[i - 1].x, e.y - pts[i - 1].y);
    pts[i] = { ...e, s: total };
  }
  return { pts, total };
}

export function evalAtArc(p0, c1, c2, p3, lut, sTarget) {
  const { pts, total } = lut;
  if (sTarget <= 0) return { ...pts[0], s: 0 };
  if (sTarget >= total) return { ...pts[pts.length - 1], s: total };
  let lo = 0;
  let hi = pts.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (pts[mid].s < sTarget) lo = mid;
    else hi = mid;
  }
  const a = pts[lo];
  const b = pts[hi];
  const f = (sTarget - a.s) / (b.s - a.s || 1e-6);
  const t = lerp(a.t, b.t, f);
  return { ...evalCubic(p0, c1, c2, p3, t), s: sTarget };
}

export function charWidthFactor(ch) {
  if ("，。、！？：；·".includes(ch)) return 0.62;
  if (ch === " ") return 0.42;
  if (ch.charCodeAt(0) < 128) return 0.62;
  return 1.0;
}

// 2D 定向包围盒 SAT 分离轴碰撞检测
function obbOverlap(a, b) {
  const corners = (box) => {
    const c = Math.cos(box.angle);
    const s = Math.sin(box.angle);
    const hw = box.w * 0.5;
    const hh = box.h * 0.5;
    const ux = c * hw, uy = s * hw;
    const vx = -s * hh, vy = c * hh;
    return [
      { x: box.cx - ux - vx, y: box.cy - uy - vy },
      { x: box.cx + ux - vx, y: box.cy + uy - vy },
      { x: box.cx + ux + vx, y: box.cy + uy + vy },
      { x: box.cx - ux + vx, y: box.cy - uy + vy },
    ];
  };
  const ca = corners(a);
  const cb = corners(b);
  const axes = [
    { x: Math.cos(a.angle), y: Math.sin(a.angle) },
    { x: -Math.sin(a.angle), y: Math.cos(a.angle) },
    { x: Math.cos(b.angle), y: Math.sin(b.angle) },
    { x: -Math.sin(b.angle), y: Math.cos(b.angle) },
  ];
  let minOverlap = Infinity;
  for (const ax of axes) {
    let minA = Infinity, maxA = -Infinity;
    for (const p of ca) {
      const proj = p.x * ax.x + p.y * ax.y;
      if (proj < minA) minA = proj;
      if (proj > maxA) maxA = proj;
    }
    let minB = Infinity, maxB = -Infinity;
    for (const p of cb) {
      const proj = p.x * ax.x + p.y * ax.y;
      if (proj < minB) minB = proj;
      if (proj > maxB) maxB = proj;
    }
    const ov = Math.min(maxA, maxB) - Math.max(minA, minB);
    if (ov <= 0) return 0;
    if (ov < minOverlap) minOverlap = ov;
  }
  return minOverlap;
}

function normDeg(rad) {
  let d = (rad * 180) / Math.PI;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

export function evaluateLayout(state) {
  const preset = PATH_PRESETS[state.preset] || PATH_PRESETS.sCurve;
  const p0 = preset.p0;
  const p3 = preset.p3;
  const c1 = state.c1;
  const c2 = state.c2;
  const fontSize = preset.fontSize;
  const lut = buildCurveLUT(p0, c1, c2, p3, 220);

  // 1. 计算相对起止弦长的总峰谷垂直摆幅（S 弯正负两侧叠加）
  const chordDx = p3.x - p0.x;
  const chordDy = p3.y - p0.y;
  const chordLen = Math.hypot(chordDx, chordDy) || 1;
  let maxPos = 0;
  let maxNeg = 0;
  for (const pt of lut.pts) {
    const signed = ((pt.x - p0.x) * chordDy - (pt.y - p0.y) * chordDx) / chordLen;
    if (signed > maxPos) maxPos = signed;
    if (signed < maxNeg) maxNeg = signed;
  }
  const archRatio = (maxPos - maxNeg) / chordLen;

  // 2. 沿弧长逐字排布
  const chars = [...HERO_TEXT];
  const sideSign = state.side === "inside" ? -1 : 1;
  const startMargin = 20;
  const endMargin = 30;
  const usableTotal = Math.max(120, lut.total - startMargin - endMargin);
  const startS = startMargin + clamp(state.startOffset, 0, 0.72) * usableTotal;
  const gapPx = state.tracking * fontSize;

  const glyphs = [];
  let cursor = startS;
  let overflowCount = 0;
  let maxAbsAngleDeg = 0;
  let upsideDownCount = 0;
  let steepCount = 0;
  let minRadius = Infinity;
  let sharpestPoint = null;
  let firstS = startS;
  let lastS = startS;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const wf = charWidthFactor(ch);
    const adv = fontSize * wf;
    const centerS = cursor + adv * 0.5;
    const isOverflow = centerS > lut.total - endMargin;

    if (isOverflow) {
      overflowCount++;
      const endPt = lut.pts[lut.pts.length - 1];
      const extra = centerS - (lut.total - endMargin);
      const bx = endPt.x + endPt.tx * extra;
      const by = endPt.y + endPt.ty * extra;
      const lift = state.baselineGap + fontSize * 0.48;
      const drawAngle = sideSign === 1 ? endPt.angle : endPt.angle + Math.PI;
      glyphs.push({
        index: i,
        ch,
        s: centerS,
        baseX: bx,
        baseY: by,
        cx: bx + endPt.nx * sideSign * lift,
        cy: by + endPt.ny * sideSign * lift,
        nx: endPt.nx * sideSign,
        ny: endPt.ny * sideSign,
        angle: drawAngle,
        deg: normDeg(drawAngle),
        w: adv * 0.88,
        h: fontSize * 0.88,
        fontSize,
        highlight: i >= HIGHLIGHT_RANGE[0] && i <= HIGHLIGHT_RANGE[1],
        overflow: true,
        collided: false,
        steep: false,
        upsideDown: Math.abs(normDeg(drawAngle)) > 90,
        radius: Infinity,
      });
    } else {
      const pt = evalAtArc(p0, c1, c2, p3, lut, centerS);
      const lift = state.baselineGap + fontSize * 0.48;
      const drawAngle = sideSign === 1 ? pt.angle : pt.angle + Math.PI;
      const deg = normDeg(drawAngle);
      const absDeg = Math.abs(deg);
      const isUpsideDown = absDeg > 90;
      const isSteep = absDeg > RULES.maxAngleDeg;
      if (absDeg > maxAbsAngleDeg) maxAbsAngleDeg = absDeg;
      if (isUpsideDown) upsideDownCount++;
      if (isSteep) steepCount++;

      const absK = Math.abs(pt.kappa);
      const r = absK > 1e-5 ? 1 / absK : 9999;
      if (r < minRadius) {
        minRadius = r;
        sharpestPoint = { x: pt.x, y: pt.y, r, nx: pt.nx, ny: pt.ny, kappa: pt.kappa };
      }

      glyphs.push({
        index: i,
        ch,
        s: centerS,
        baseX: pt.x,
        baseY: pt.y,
        cx: pt.x + pt.nx * sideSign * lift,
        cy: pt.y + pt.ny * sideSign * lift,
        nx: pt.nx * sideSign,
        ny: pt.ny * sideSign,
        angle: drawAngle,
        deg,
        w: adv * 0.88,
        h: fontSize * 0.88,
        fontSize,
        highlight: i >= HIGHLIGHT_RANGE[0] && i <= HIGHLIGHT_RANGE[1],
        overflow: false,
        collided: false,
        steep: isSteep,
        upsideDown: isUpsideDown,
        radius: r,
        concave: pt.kappa * sideSign > 0.002,
      });
      lastS = cursor + adv;
    }
    cursor += adv + gapPx;
  }

  // 3. 对相邻字符做精确 SAT 旋转包围盒碰撞检测
  const collisions = [];
  for (let i = 0; i < glyphs.length - 1; i++) {
    const a = glyphs[i];
    const b = glyphs[i + 1];
    if (a.overflow || b.overflow) continue;
    const ov = obbOverlap(a, b);
    if (ov > 0.6) {
      a.collided = true;
      b.collided = true;
      collisions.push({
        i,
        j: i + 1,
        depth: ov,
        x: (a.cx + b.cx) * 0.5,
        y: (a.cy + b.cy) * 0.5,
      });
    }
  }

  // 4. 核算 4 项核心指标
  const coveredSpan = Math.max(0, lastS - firstS);
  const coverage = clamp(coveredSpan / usableTotal, 0, 1.5);
  const curvatureRatio = minRadius / fontSize;

  const isStraight = archRatio < RULES.minArchRatio;
  const isTooSharp = curvatureRatio < RULES.minCurvatureRatio;
  const isTooLoose = state.tracking > 0.52;
  const isTooTight = state.tracking < -0.09;

  const checks = {
    noCollision: collisions.length === 0 && !isTooLoose,
    uprightRead: upsideDownCount === 0 && maxAbsAngleDeg <= RULES.maxAngleDeg,
    curveGrace: !isStraight && !isTooSharp,
    onTrack: overflowCount === 0 && coverage >= RULES.minCoverage && coverage <= RULES.maxCoverage && !isTooTight,
  };
  const passCount = Object.values(checks).filter(Boolean).length;

  // 5. 白话诊断（全部数字来自当前几何实测）
  let badge = "错态";
  let headline = "";
  let body = "";
  let tone = "warn";

  if (passCount === 4) {
    tone = "ok";
    badge = "顺读成势 · 4/4";
    headline = "曲线平滑领路，字字落轨零撞击";
    body = `最小曲率半径 ${Math.round(minRadius)}px（约 ${curvatureRatio.toFixed(1)}× 字号，高于经验值 ${RULES.minCurvatureRatio}×），最大切线倾角 ${Math.round(maxAbsAngleDeg)}°，整句舒展覆盖路径 ${Math.round(coverage * 100)}%。眼睛会沿切线顺势滑向终点箭头。`;
  } else if (upsideDownCount > 0) {
    badge = state.side === "inside" ? "翻边倒挂" : "急折倒立";
    headline = state.side === "inside"
      ? `文字翻到基线内侧，${upsideDownCount} 个字头朝下倒立`
      : `中段急弯折返，${upsideDownCount} 个字已倒立难读`;
    body = state.side === "inside"
      ? "直接把整条路径翻到内侧会让阅读方向与字身一起上下颠倒。先切回「基线外侧」，或像 03 节圆徽那样拆成两条独立反向路径。"
      : `当前最大切线角达 ${Math.round(maxAbsAngleDeg)}°（超过 90° 即头朝下），内弯还撞了 ${collisions.length} 处字。把下方「弯曲张力」拨珠往左推到绿色顺读带，再把朱橘起点圆往前拉。`;
  } else if (collisions.length > 0) {
    badge = `撞字 ${collisions.length} 处`;
    headline = `急弯内凹吞掉字距，${collisions.length} 对相邻字相撞`;
    body = `最急处曲率半径仅 ${Math.round(minRadius)}px（${curvatureRatio.toFixed(1)}× 字号，低于经验安全线 ${RULES.minCurvatureRatio}×）。内弯圆弧顶部比基线更短，汉字方块字顶必然互啃——拉宽弯弧或微调字距即可解开。`;
  } else if (isStraight) {
    badge = "退化直线";
    headline = `路径摆幅仅 ${Math.round(archRatio * 100)}%，已退化成普通横排`;
    body = `把曲线拉得过直确实不会撞字，但也丢掉了路径文字借弯弧制造动势与视线引导的本意。向右轻推「弯曲张力」或拉开控柄，让摆幅回到 ${Math.round(RULES.minArchRatio * 100)}% 以上。`;
  } else if (maxAbsAngleDeg > RULES.maxAngleDeg) {
    badge = `陡坡 ${Math.round(maxAbsAngleDeg)}°`;
    headline = `局部坡度达 ${Math.round(maxAbsAngleDeg)}°，读者得歪着头追字`;
    body = `汉字顺读经验舒适角在 ±${RULES.maxAngleDeg}° 以内，当前有 ${steepCount} 个字爬坡过陡。把中段控制柄向两侧舒展，放缓爬升斜率。`;
  } else if (isTooSharp) {
    badge = `急弯 R=${Math.round(minRadius)}px`;
    headline = `拐点半径过小（${curvatureRatio.toFixed(1)}× 字号），字头扇形撕裂`;
    body = `弯弧太急时，外凸侧字顶像折扇炸开、内凹侧字顶聚拢发黑。把曲率半径放宽到字号的 ${RULES.minCurvatureRatio} 倍以上。`;
  } else if (overflowCount > 0) {
    badge = `出轨 ${overflowCount} 字`;
    headline = `末尾 ${overflowCount} 个字冲出箭头终点被截断`;
    body = "路径起点太靠后或字距拉得太宽，后半句没地儿落脚。沿着曲线往左拖回朱橘「路径起点」圆点，或微收字距，把全句收回箭头之前。";
  } else if (isTooLoose) {
    badge = "字距散架";
    headline = `字距 +${state.tracking.toFixed(2)}em 过散，连不成一句`;
    body = "字距拉得太大时，格式塔邻近律失效，眼睛看到的是一串分散孤字。把字距收回到 +0.00em 至 +0.24em 之间。";
  } else if (isTooTight) {
    badge = "字距挤紧";
    headline = `沿轨字距 ${state.tracking.toFixed(2)}em 过挤，呼吸发闷`;
    body = "负字距让笔画在弯道上贴得过近。把沿轨字距拉回到 +0.00em 以上，让每个字都有透气余量。";
  } else {
    badge = "落轨偏短";
    headline = `字列只占路径 ${Math.round(coverage * 100)}%，尾巴大片空荡`;
    body = "整句话缩在轨道一截，后半条粗曲线空跑。稍微放宽字距或微调起点，让字列舒展铺满路径的 60%–92%。";
  }

  return {
    p0,
    p3,
    c1,
    c2,
    lut,
    glyphs,
    collisions,
    sharpestPoint,
    metrics: {
      totalLength: lut.total,
      minRadius: Math.min(999, minRadius),
      curvatureRatio,
      archRatio,
      maxAbsAngleDeg,
      upsideDownCount,
      steepCount,
      collisionCount: collisions.length,
      overflowCount,
      coverage,
    },
    checks,
    passCount,
    diagnosis: { tone, badge, headline, body },
  };
}

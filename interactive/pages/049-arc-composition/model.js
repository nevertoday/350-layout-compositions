// 049 弧形构图 · 单真源几何模型与评定引擎
// 所有读数、诊单、五圆徽探针、标题活弧与画布渲染都从同一份几何采样点算出来。

export const SCENES = {
  bay: {
    id: "bay",
    label: "原海报·暮湾归舟",
    short: "暮湾归舟",
    focusLabel: "落日孤舟",
    note: "还原 049 原海报的淡紫雾纸、深靛收锋大弧与暮色湾岸落日。",
  },
  bridge: {
    id: "bridge",
    label: "建筑·石拱长桥",
    short: "石拱长桥",
    focusLabel: "桥下灯舟",
    note: "石拱以单向跨弧托住桥下灯舟，水面倒影延展空间纵深。",
  },
  poster: {
    id: "poster",
    label: "海报·流光展讯",
    short: "流光展讯",
    focusLabel: "主焦圆光",
    note: "深靛海报内用一道起粗收细的杏桃大弧划分主标与焦圆层级。",
  },
};

export const CONTINUITY_MODES = {
  taper: { id: "taper", label: "粗细韵律", glyph: "taper", ok: true, tip: "起粗收细 + 伴生回响弧（原海报 TIPS ✓）" },
  smooth: { id: "smooth", label: "顺滑连贯", glyph: "smooth", ok: true, tip: "曲率自然连续无折角（原海报 TIPS ✓）" },
  dashed: { id: "dashed", label: "断续割裂", glyph: "dashed", ok: false, tip: "宽缺口虚断打碎连续性（原海报 TIPS ×）" },
  kinked: { id: "kinked", label: "僵直拼角", glyph: "kinked", ok: false, tip: "直段硬接出折角（原海报 TIPS ×）" },
};

// 开场刻意停在 0/4 四重坏态：扁平带硬折角 + 44% 短跨幅 + 焦点凸背弹飞 + 均粗死线
export const INITIAL_STATE = {
  scene: "bay",
  chordAngleDeg: -42, // 弦线方向角（度，屏幕坐标系右为 0，向上为负）
  bulge: 0.13, // 矢高/半弦比，对应 ~30° 偏扁包角（<38°），>0 向左上鼓起，凹侧在右下
  span: 0.44, // 弧弦跨幅占画布基准对角线比例（<58%，局促短跨幅）
  continuity: "kinked", // 开场带僵直折角
  taper: 1.0, // 均粗无收锋变化
  focus: { u: 0.33, v: 0.30 }, // 落在凸背外侧，形成明显的凸背弹飞错态
  highlightLayer: null, // 点击左侧五枚胶囊词或右侧五圆徽时高亮对应几何层
};

// 多组合法解（全部通过 4/4）与主动反向试错
export const PRESETS = {
  // 三组合法解
  posterSweep: {
    label: "原海报升弧解",
    valid: true,
    patch: {
      chordAngleDeg: -44,
      bulge: 0.46,
      span: 0.84,
      continuity: "taper",
      taper: 2.7,
      focus: { u: 0.57, v: 0.56 },
    },
  },
  domeArch: {
    label: "穹顶上拱解",
    valid: true,
    patch: {
      chordAngleDeg: 0,
      bulge: 0.56,
      span: 0.80,
      continuity: "taper",
      taper: 2.2,
      focus: { u: 0.50, v: 0.56 },
    },
  },
  cradleBowl: {
    label: "托盘下凹解",
    valid: true,
    patch: {
      chordAngleDeg: 0,
      bulge: -0.52,
      span: 0.82,
      continuity: "smooth",
      taper: 1.85,
      focus: { u: 0.50, v: 0.42 },
    },
  },
  // 四组主动反向试错
  errKink: {
    label: "试错：折角断流",
    valid: false,
    patch: {
      chordAngleDeg: -42,
      bulge: 0.44,
      span: 0.78,
      continuity: "kinked",
      taper: 1.15,
      focus: { u: 0.56, v: 0.56 },
    },
  },
  errFlat: {
    label: "试错：拉直失弧",
    valid: false,
    patch: {
      chordAngleDeg: -38,
      bulge: 0.06,
      span: 0.78,
      continuity: "smooth",
      taper: 1.8,
      focus: { u: 0.58, v: 0.58 },
    },
  },
  errClosed: {
    label: "试错：过弯封口",
    valid: false,
    patch: {
      chordAngleDeg: -10,
      bulge: 1.38,
      span: 0.66,
      continuity: "taper",
      taper: 2.4,
      focus: { u: 0.50, v: 0.52 },
    },
  },
  errConvex: {
    label: "试错：凸背弹飞",
    valid: false,
    patch: {
      chordAngleDeg: -44,
      bulge: 0.48,
      span: 0.82,
      continuity: "taper",
      taper: 2.5,
      focus: { u: 0.23, v: 0.27 },
    },
  },
  resetBad: {
    label: "复原开场错态",
    valid: false,
    patch: {
      chordAngleDeg: INITIAL_STATE.chordAngleDeg,
      bulge: INITIAL_STATE.bulge,
      span: INITIAL_STATE.span,
      continuity: INITIAL_STATE.continuity,
      taper: INITIAL_STATE.taper,
      focus: { ...INITIAL_STATE.focus },
    },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 统一在归一化正方形坐标 [0..1, 0..1] 中采样大弧，保证 2D Canvas 无论宽高比如何，
// 几何、角度与读数都严丝合缝且完全等比（通过渲染层映射到安全正方形/等比坐标系）。
export function computeArcGeometry(state) {
  const rad = (state.chordAngleDeg * Math.PI) / 180;
  const tx = Math.cos(rad);
  const ty = Math.sin(rad);
  // 屏幕坐标下 y 向下：当弦向右 (1, 0) 时，屏幕向上法向 U = (ty, -tx) = (0, -1)
  const ux = ty;
  const uy = -tx;

  // 弦中心略作自然平衡，避免大弓顶出画布裁切
  const b = clamp(state.bulge, -1.5, 1.5);
  const span = clamp(state.span, 0.28, 0.96);
  const halfChord = span * 0.48; // 归一化坐标下最大半弦约 0.46

  // 根据弓鼓方向轻微反移弦心，让大弧在画框内呼吸舒展
  const shift = clamp(-b * halfChord * 0.44, -0.18, 0.18);
  const mx = 0.5 + shift * ux;
  const my = 0.52 + shift * uy;

  const p0 = { u: mx - halfChord * tx, v: my - halfChord * ty };
  const p1 = { u: mx + halfChord * tx, v: my + halfChord * ty };
  const sagitta = b * halfChord;
  const apex = { u: mx + sagitta * ux, v: my + sagitta * uy };

  const absB = Math.abs(b);
  const signB = b >= 0 ? 1 : -1;
  // 凹侧法向指向弯心（与鼓起方向相反）
  const concaveDir = { x: -signB * ux, y: -signB * uy };

  const N = 40;
  const points = [];
  let radius = Infinity;
  let circleCenter = null;

  if (state.continuity === "kinked") {
    // 复刻原海报底沿第 4 个图示（×）：两段生硬直肩 + 中段折角硬梯台（—/‾\—）
    const s1 = { u: p0.u + (p1.u - p0.u) * 0.24, v: p0.v + (p1.v - p0.v) * 0.24 };
    const s2 = { u: p0.u + (p1.u - p0.u) * 0.76, v: p0.v + (p1.v - p0.v) * 0.76 };
    const peakLift = clamp(Math.max(Math.abs(sagitta), 0.062), 0.062, 0.22) * signB;
    const k1 = {
      u: p0.u + (p1.u - p0.u) * 0.39 + peakLift * ux,
      v: p0.v + (p1.v - p0.v) * 0.39 + peakLift * uy,
    };
    const k2 = {
      u: p0.u + (p1.u - p0.u) * 0.61 + peakLift * ux,
      v: p0.v + (p1.v - p0.v) * 0.61 + peakLift * uy,
    };
    const verts = [p0, s1, k1, k2, s2, p1];
    const segs = 5;
    const per = N / segs;
    for (let i = 0; i <= N; i++) {
      const seg = Math.min(segs - 1, Math.floor(i / per));
      const f = (i - seg * per) / per;
      const a = verts[seg];
      const c = verts[seg + 1];
      points.push({
        u: a.u + (c.u - a.u) * f,
        v: a.v + (c.v - a.v) * f,
        t: i / N,
      });
    }
  } else if (absB < 0.008) {
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      points.push({
        u: p0.u + (p1.u - p0.u) * t,
        v: p0.v + (p1.v - p0.v) * t,
        t,
      });
    }
  } else {
    // 精确圆弧公式：bulge b = tan(sweep / 4)
    radius = (halfChord * (1 + b * b)) / (2 * absB);
    const centerOff = ((1 - b * b) / (2 * b)) * halfChord;
    circleCenter = {
      u: mx - centerOff * ux,
      v: my - centerOff * uy,
    };
    const a0 = Math.atan2(p0.v - circleCenter.v, p0.u - circleCenter.u);
    const sweepRad = 4 * Math.atan(absB);
    // 验证旋转方向：从 p0 到 apex 应经过中点角
    const midCandidatePos = a0 + sweepRad * 0.5;
    const midCandidateNeg = a0 - sweepRad * 0.5;
    const dPos = Math.hypot(
      circleCenter.u + radius * Math.cos(midCandidatePos) - apex.u,
      circleCenter.v + radius * Math.sin(midCandidatePos) - apex.v,
    );
    const dNeg = Math.hypot(
      circleCenter.u + radius * Math.cos(midCandidateNeg) - apex.u,
      circleCenter.v + radius * Math.sin(midCandidateNeg) - apex.v,
    );
    const dir = dPos <= dNeg ? 1 : -1;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const ang = a0 + dir * sweepRad * t;
      points.push({
        u: circleCenter.u + radius * Math.cos(ang),
        v: circleCenter.v + radius * Math.sin(ang),
        t,
      });
    }
  }

  // 计算每点单位切向、内法向与实测转角跳变
  let totalTurnRad = 0;
  let maxTurnJumpDeg = 0;
  let arcLength = 0;
  const segAngles = [];
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].u - points[i].u;
    const dy = points[i + 1].v - points[i].v;
    arcLength += Math.hypot(dx, dy);
    segAngles.push(Math.atan2(dy, dx));
  }
  for (let i = 1; i < segAngles.length; i++) {
    let d = segAngles[i] - segAngles[i - 1];
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    const absD = Math.abs(d);
    totalTurnRad += absD;
    const deg = (absD * 180) / Math.PI;
    if (deg > maxTurnJumpDeg) maxTurnJumpDeg = deg;
  }

  // 实测端点弦长与画幅占比
  const chordLen = Math.hypot(p1.u - p0.u, p1.v - p0.v);
  // 真实跨幅占比（取实绘包围盒最大跨度或弦长相对 1.0 画框）
  let minU = 1, maxU = 0, minV = 1, maxV = 0;
  for (const pt of points) {
    if (pt.u < minU) minU = pt.u;
    if (pt.u > maxU) maxU = pt.u;
    if (pt.v < minV) minV = pt.v;
    if (pt.v > maxV) maxV = pt.v;
  }
  const extent = Math.hypot(maxU - minU, maxV - minV) / Math.SQRT2;
  const spanPct = Math.round(clamp(Math.max(chordLen / 0.96, extent), 0, 1.05) * 100);
  const sweepDeg = Math.round((4 * Math.atan(absB) * 180) / Math.PI);

  // 理想弯心参考锚点（凹侧口袋中心）
  const pocketDepth = clamp(Math.max(Math.abs(sagitta) * 0.55, 0.14), 0.13, 0.25);
  const cradleIdeal = {
    u: clamp(apex.u + concaveDir.x * (Math.abs(sagitta) * 0.58 + 0.14), 0.16, 0.84),
    v: clamp(apex.v + concaveDir.y * (Math.abs(sagitta) * 0.58 + 0.14), 0.16, 0.84),
  };

  // 为每点附上切向和指向凹侧的法向
  const frames = points.map((pt, idx) => {
    const prev = points[Math.max(0, idx - 1)];
    const next = points[Math.min(points.length - 1, idx + 1)];
    const dx = next.u - prev.u;
    const dy = next.v - prev.v;
    const len = Math.hypot(dx, dy) || 1;
    const tanX = dx / len;
    const tanY = dy / len;
    // 选与 concaveDir 同向的法向
    let nx = -tanY;
    let ny = tanX;
    if (nx * concaveDir.x + ny * concaveDir.y < 0) {
      nx = -nx;
      ny = -ny;
    }
    return { ...pt, tx: tanX, ty: tanY, nx, ny };
  });

  return {
    p0,
    p1,
    mid: { u: mx, v: my },
    apex: points[Math.floor(N / 2)],
    trueApex: apex,
    points: frames,
    radius,
    circleCenter,
    concaveDir,
    cradleIdeal,
    chordLen,
    arcLength,
    spanPct,
    sweepDeg,
    maxTurnJumpDeg: Math.round(maxTurnJumpDeg),
    totalTurnDeg: Math.round((totalTurnRad * 180) / Math.PI),
    pocketDepth,
    bounds: { minU, maxU, minV, maxV },
  };
}

// 从实绘弧线几何单真源核算 4 项核心判定 + 8 类双向错态 + 五圆徽探针状态
export function evaluateArc(state) {
  const geo = computeArcGeometry(state);
  const fx = state.focus.u;
  const fy = state.focus.v;

  // 1. 计算焦点到实绘弧线最近距离与有向凹/凸侧关系
  let minDist = Infinity;
  let nearest = geo.points[Math.floor(geo.points.length / 2)];
  let nearestIdx = Math.floor(geo.points.length / 2);
  for (let i = 0; i < geo.points.length; i++) {
    const pt = geo.points[i];
    const d = Math.hypot(fx - pt.u, fy - pt.v);
    if (d < minDist) {
      minDist = d;
      nearest = pt;
      nearestIdx = i;
    }
  }
  // 同时对弧脊中段方向做整体凹侧投影，避免两端外侧误判
  const vx = fx - nearest.u;
  const vy = fy - nearest.v;
  const signedLocal = vx * nearest.nx + vy * nearest.ny;
  const signedApex = (fx - geo.apex.u) * geo.concaveDir.x + (fy - geo.apex.v) * geo.concaveDir.y;

  // 焦点是否落在弧的纵向包容区间内（投影到弦向）
  const chordDx = geo.p1.u - geo.p0.u;
  const chordDy = geo.p1.v - geo.p0.v;
  const chordL2 = chordDx * chordDx + chordDy * chordDy || 1;
  const alongT = ((fx - geo.p0.u) * chordDx + (fy - geo.p0.v) * chordDy) / chordL2;

  const spineThreshold = 0.088; // 焦点视觉半径 + 弧脊净空
  const edgeClipped = fx < 0.10 || fx > 0.90 || fy < 0.10 || fy > 0.90;
  const tooDeepOut = minDist > 0.42 || alongT < -0.14 || alongT > 1.14;

  let cradleStatus = "cradled"; // cradled | sliced | convex | edge
  if (minDist < spineThreshold) {
    cradleStatus = "sliced";
  } else if (Math.abs(state.bulge) >= 0.12 && (signedLocal < -0.01 || signedApex < 0.015)) {
    cradleStatus = "convex";
  } else if (edgeClipped || tooDeepOut) {
    cradleStatus = "edge";
  }

  // 2. 四项核心条件（均来自实绘几何）
  const isKinked = state.continuity === "kinked" || geo.maxTurnJumpDeg >= 18;
  const isDashed = state.continuity === "dashed";
  const isFlat = geo.sweepDeg < 38;
  const isOverClosed = geo.sweepDeg > 182;

  const c1_flow = !isKinked && !isDashed && !isFlat && !isOverClosed;
  const c2_span = geo.spanPct >= 58;
  const c3_cradle = cradleStatus === "cradled" && !isFlat;
  const taperRatio = Number(state.taper.toFixed(2));
  const c4_rhythm = !isKinked && !isDashed && taperRatio >= 1.35;

  const score = [c1_flow, c2_span, c3_cradle, c4_rhythm].filter(Boolean).length;

  // 3. 确定首要错态（8 类双向真错态优先级）
  let primaryCode = "ok";
  let shortBadge = `${score}/4 · 弧势成立`;
  let headline = "开放大弧顺滑延展，焦点稳落凹侧弯心";
  let detail = `实测包角 ${geo.sweepDeg}° 落在开放区间，跨幅铺满画面的 ${geo.spanPct}%，${SCENES[state.scene].focusLabel}安放在凹侧弯心（距弧脊净空 ${Math.round(minDist * 100)}%），起粗收细 ${taperRatio.toFixed(1)}× 带出呼吸韵律。`;
  let actionHint = "你也可以试试「穹顶上拱解」或「托盘下凹解」，感受同一套道理在不同拱向下的情绪差别。";
  let fixAction = null;

  if (isKinked) {
    primaryCode = "kinked";
    shortBadge = `${score}/4 · 折角断流`;
    headline = `弧脊出现 ${geo.maxTurnJumpDeg}° 硬折角，视线当场卡顿`;
    detail = "原海报底沿 TIPS 第 4 个图示（×）专防这种「直段硬拼折角」。人眼依靠格式塔连续性沿曲线滑动，一旦遇到急转硬折，视觉皮层的局部关联场会瞬间断开，流畅感荡然无存。";
    actionHint = "把底部弧形模式切回「粗细韵律」或「顺滑连贯」，再按住大弧往外拉弯出自然包角。";
    fixAction = { label: "拉顺折角并弯出大弧", patch: PRESETS.posterSweep.patch };
  } else if (isDashed) {
    primaryCode = "dashed";
    shortBadge = `${score}/4 · 虚断泄气`;
    headline = "大弧被宽缺口切碎，眼睛接不上连续动势";
    detail = "对应原海报底沿 TIPS 第 3 个图示（×）。过度稀疏的断续虚线让每段短弧各自为战，读者必须反复重新定位下一笔，画面立刻失去一气呵成的流线延展力。";
    actionHint = "把弧形模式切为「粗细韵律」或「顺滑连贯」，让视觉主脊一笔贯通。";
    fixAction = { label: "接通连贯主弧", patch: { continuity: "taper", taper: Math.max(state.taper, 2.4) } };
  } else if (isFlat) {
    primaryCode = "flat";
    shortBadge = `${score}/4 · 拉直失弧`;
    headline = `当前包角只有 ${geo.sweepDeg}°，退化成了一根僵硬斜线`;
    detail = "包角低于 38° 时，弧线几乎没有凹侧与凸背之分，无法形成原海报强调的「包围感与韵律」——视线只是像走直尺一样划过，兜不住主体。";
    actionHint = "直接按住画布中央大弧向空白处拖弯，把实测包角拉开到 55°–155° 之间。";
    fixAction = { label: "拉弯至 100° 顺滑大弧", patch: { bulge: state.bulge < 0 ? -0.46 : 0.46 } };
  } else if (isOverClosed) {
    primaryCode = "closed";
    shortBadge = `${score}/4 · 过弯封口`;
    headline = `包角弯到了 ${geo.sweepDeg}°，快封死成闭合环形了`;
    detail = "弧形构图和 047 圆形 / 050 环形的分水岭就是「两端开放」。弯过 182° 后两端朝内合拢，把视线关进笼子，反而掐断了原海报第五条「延伸空间」的开阔气势。";
    actionHint = "把大弧往回松一点，让包角回到 50°–165° 的开放怀抱状态。";
    fixAction = { label: "松开包角恢复开放感", patch: { bulge: state.bulge < 0 ? -0.52 : 0.52 } };
  } else if (cradleStatus === "sliced") {
    primaryCode = "sliced";
    shortBadge = `${score}/4 · 弧脊斩焦`;
    headline = `${SCENES[state.scene].focusLabel}撞上弧脊（净空仅 ${Math.round(minDist * 100)}%），被拦腰切开`;
    detail = "主弧是引流骨架，主体需要坐在弧线围出的凹侧留白里。当主体压在弧脊线上时，线条与主体的边缘互相打架，焦点既不稳也不透气。";
    actionHint = `直接拖动画布里的${SCENES[state.scene].focusLabel}，把它挪进大弧内侧的柔软弯心里。`;
    fixAction = { label: "把焦点移入凹侧弯心", patch: { focus: { ...geo.cradleIdeal } } };
  } else if (cradleStatus === "convex") {
    primaryCode = "convex";
    shortBadge = `${score}/4 · 凸背弹飞`;
    headline = `${SCENES[state.scene].focusLabel}落在了大弧的凸背外侧，视线直接把它甩开了`;
    detail = "弧线的凹面负责怀抱、凸面负责推开。现在主体站在弧背外面，眼睛顺着大弧滑行时会被离心推开，主体和弧线各演各的戏。";
    actionHint = `拖动${SCENES[state.scene].focusLabel}跨过弧线，放进凹侧怀抱区里。`;
    fixAction = { label: "把焦点请回凹侧弯心", patch: { focus: { ...geo.cradleIdeal } } };
  } else if (cradleStatus === "edge") {
    primaryCode = "edge";
    shortBadge = `${score}/4 · 焦点出窝`;
    headline = `${SCENES[state.scene].focusLabel}离弯心太远或贴近画边，接不住弧线的引导`;
    detail = "即使在凹侧，如果主体缩到画框死角或彻底离开大弧的跨幅覆盖区，弧线画出的势能就会落空。";
    actionHint = `把${SCENES[state.scene].focusLabel}拖回大弧弯心正中区域，与弧脊保持舒适呼吸距。`;
    fixAction = { label: "焦点归位弯心", patch: { focus: { ...geo.cradleIdeal } } };
  } else if (!c2_span) {
    primaryCode = "short";
    shortBadge = `${score}/4 · 跨幅局促`;
    headline = `大弧跨幅只占画面的 ${geo.spanPct}%，像枚浮在半空的小括号`;
    detail = "原海报的大弧是从左下画边一路贯通到右上箭头的骨架，跨幅不够 58% 时，弧线退化成局部小装饰，撑不起整幅画面的空间延展。";
    actionHint = "拖动弧尾或箭头端点，或拉大「弧幅延展」滑杆到 65%–90%。";
    fixAction = { label: "拉展跨幅至 84%", patch: { span: 0.84 } };
  } else if (!c4_rhythm) {
    primaryCode = "uniform";
    shortBadge = `${score}/4 · 均粗呆板`;
    headline = `线条粗细比仅 ${taperRatio.toFixed(1)}×，少了起粗收细的节奏变化`;
    detail = "原海报底沿 TIPS 特别提醒：「注意弧度的粗细、方向与节奏变化，避免单调与僵硬」。等宽铁丝一样的弧线虽然通畅，但缺乏起点蓄力、终点轻扬的书法生命力。";
    actionHint = "调高「粗细收锋」至 1.5× 以上，或切换到「粗细韵律」模式。";
    fixAction = { label: "启用起粗收细韵律", patch: { continuity: "taper", taper: 2.5 } };
  }

  // 4. 五枚原海报右侧弧形错列圆徽探针（100% 源自上述几何指标）
  const cradleLabel =
    cradleStatus === "cradled"
      ? (isFlat ? "无弯心" : "凹侧稳托")
      : cradleStatus === "sliced"
        ? "弧脊斩焦"
        : cradleStatus === "convex"
          ? "凸背弹飞"
          : "贴边出窝";

  const probes = [
    {
      key: "direction",
      zh: "引导视线",
      en: "DIRECTION",
      color: "peach",
      ok: c1_flow && c3_cradle,
      tag: isKinked ? "折角受阻" : isDashed ? "虚断脱节" : isFlat ? `仅 ${geo.sweepDeg}°` : cradleStatus !== "cradled" ? "偏离焦点" : `顺导 ${geo.sweepDeg}°`,
      body: "弧线具有天然的方向性，从起点引导观看路径，自然聚焦视觉重点。",
    },
    {
      key: "rhythm",
      zh: "创造节奏",
      en: "RHYTHM",
      color: "lilac",
      ok: c4_rhythm,
      tag: isKinked ? "硬折卡拍" : isDashed ? "碎段无律" : c4_rhythm ? `收锋 ${taperRatio.toFixed(1)}×` : `均粗 ${taperRatio.toFixed(1)}×`,
      body: "通过弧线的起伏与重复，形成有韵律的节奏，增强画面的动感与层次。",
    },
    {
      key: "enclose",
      zh: "营造包围",
      en: "ENCLOSE",
      color: "peach",
      ok: c3_cradle && !isOverClosed,
      tag: isOverClosed ? "封死成环" : cradleLabel,
      body: "弧形具有包裹与环绕感，能突出主体，增强安全感与视觉凝聚力。",
    },
    {
      key: "flow",
      zh: "表现流动",
      en: "FLOW",
      color: "lilac",
      ok: !isKinked && !isDashed && !isFlat,
      tag: isKinked ? `硬折 ${geo.maxTurnJumpDeg}°` : isDashed ? "缺口割裂" : isFlat ? "直尺僵化" : "一气贯通",
      body: "弧线使画面更具流线感，表达运动、变化与延展，传递自然与生命力。",
    },
    {
      key: "sweep",
      zh: "延伸空间",
      en: "SWEEP",
      color: "peach",
      ok: c2_span && !isOverClosed,
      tag: isOverClosed ? "闭环锁死" : c2_span ? `跨幅 ${geo.spanPct}%` : `局促 ${geo.spanPct}%`,
      body: "利用大弧形延展视野，营造空间深度，让画面更开阔且富有想象力。",
    },
  ];

  // 整体态势档位（避免假精确百分比）
  const posture =
    score === 4
      ? (geo.sweepDeg > 135 ? "深怀宽拱（示意）" : state.bulge < 0 ? "轻托上扬（示意）" : "升弧舒展（示意）")
      : score >= 2
        ? "局部未顺（示意）"
        : "多重失序（示意）";

  return {
    geo,
    score,
    ok: score === 4,
    checks: { c1_flow, c2_span, c3_cradle, c4_rhythm },
    primaryCode,
    shortBadge,
    headline,
    detail,
    actionHint,
    fixAction,
    probes,
    cradleStatus,
    cradleLabel,
    nearest,
    nearestIdx,
    minDistPct: Math.round(minDist * 100),
    taperRatio,
    posture,
    isKinked,
    isDashed,
    isFlat,
    isOverClosed,
  };
}

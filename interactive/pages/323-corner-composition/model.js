// 323 边角式构图 — 单真源几何力学与诊断模型
// 全部画布绘制尺寸、方向角差、实景/留白占比、重心力矩与 8 类错态均从此模块唯一计算。

export const CORNERS = {
  br: { id: "br", label: "右下角", short: "右下", ax: 1, ay: 1, oppX: 0.24, oppY: 0.3, mood: "收尾压阵，沉稳而蓄势回望左上" },
  bl: { id: "bl", label: "左下角", short: "左下", ax: 0, ay: 1, oppX: 0.76, oppY: 0.3, mood: "如南宋马一角稳坐山基，顺势向右上方舒展" },
  tl: { id: "tl", label: "左上角", short: "左上", ax: 0, ay: 0, oppX: 0.76, oppY: 0.7, mood: "起势领读，贴合从左上进入画面的阅读起点" },
  tr: { id: "tr", label: "右上角", short: "右上", ax: 1, ay: 0, oppX: 0.24, oppY: 0.7, mood: "如悬崖垂枝，借高位斜势压向左下方空域" },
  center: { id: "center", label: "画面正中", short: "正中", ax: 0.5, ay: 0.5, oppX: 0.5, oppY: 0.5, mood: "退回中轴静平衡，已不再是边角式构图" },
};

export const THEMES = {
  poster: { id: "poster", label: "原海报几何", desc: "同心圆扇与三支虚线箭" },
  song: { id: "song", label: "南宋马一角", desc: "斜崖垂柳、无五官高士背影与题款" },
  modern: { id: "modern", label: "暗夜建筑展", desc: "压角建筑体块、光束与展讯留白" },
};

export const ECHOS = {
  none: { id: "none", label: "完全空寂", area: 0.0 },
  light: { id: "light", label: "轻度虚应", area: 0.045 },
  heavy: { id: "heavy", label: "抢戏重块", area: 0.22 },
};

// 经验参考带（统一单真源，正文与读数同源）
export const BANDS = {
  massMin: 0.18,
  massMax: 0.45,
  massNeedEcho: 0.36,
  voidMin: 0.52,
  inwardMaxDeg: 35,
  skimMaxDeg: 72,
};

// 开场故意停在 0/4 典型错态：右下撑得过满(58%) + 方向外逃撞墙(36°) + 对角塞重块
export const INITIAL_STATE = {
  corner: "br",
  mass: 0.58,
  angle: 36,
  echo: "heavy",
  theme: "poster",
  showGuides: true,
};

export const PRESETS = {
  poster: { label: "原海报右下解", corner: "br", mass: 0.31, angle: 217, echo: "light", theme: "poster" },
  song: { label: "马一角左下解", corner: "bl", mass: 0.29, angle: 323, echo: "light", theme: "song" },
  modern: { label: "左上起势解", corner: "tl", mass: 0.27, angle: 37, echo: "light", theme: "modern" },
  centerTrap: { label: "试错：居中死滞", corner: "center", mass: 0.30, angle: 0, echo: "none" },
  reset: { label: "复原 0/4 错态", ...INITIAL_STATE },
};

export function normDeg(d) {
  let a = d % 360;
  if (a < 0) a += 360;
  return a;
}

export function angleDiff(a, b) {
  const d = Math.abs(normDeg(a) - normDeg(b)) % 360;
  return d > 180 ? 360 - d : d;
}

// 计算四分之一圆（或中心全圆）在给定宽高比画框内精确对应的半径（相对画高 H=1，画宽 W=aspect）
export function radiusForMass(corner, mass, aspect = 4 / 3) {
  const areaTarget = Math.max(0.05, Math.min(0.85, mass)) * aspect;
  if (corner === "center") {
    return Math.min(0.46, Math.sqrt(areaTarget / Math.PI));
  }
  // 解四分之一圆与 [0, aspect] x [0, 1] 矩形交集面积 = areaTarget，二分求解，保证实绘面积与读数一致
  let lo = 0.05;
  let hi = Math.hypot(aspect, 1);
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) * 0.5;
    if (quarterCircleClipArea(mid, aspect, 1) < areaTarget) lo = mid;
    else hi = mid;
  }
  return (lo + hi) * 0.5;
}

// 精确解析：圆心在原点的第一象限四分之一圆与 [0, W] x [0, H] 矩形的交集面积
export function quarterCircleClipArea(R, W, H) {
  if (R <= 0) return 0;
  let area = 0.25 * Math.PI * R * R;
  // 减去超过 x = W 的弓形（半个弓形）
  if (R > W) {
    const thW = Math.acos(Math.min(1, W / R));
    area -= 0.5 * (R * R * thW - W * Math.sqrt(Math.max(0, R * R - W * W)));
  }
  // 减去超过 y = H 的弓形（半个弓形）
  if (R > H) {
    const thH = Math.acos(Math.min(1, H / R));
    area -= 0.5 * (R * R * thH - H * Math.sqrt(Math.max(0, R * R - H * H)));
  }
  // 如果圆半径大于对角线，整个矩形都在圆内
  if (R >= Math.hypot(W, H)) return W * H;
  return Math.max(0, Math.min(W * H, area));
}

// 射线从角点 (ax*W, ay*H) 沿 angle 射出，求落入矩形内有效穿行长度（占对角线比例 0..1）
export function rayInRect(ax, ay, deg, W, H) {
  const rad = (deg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const ox = ax * W;
  const oy = ay * H;
  // 若方向直接指向画框外侧，穿行距离为 0
  const eps = 1e-4;
  if ((ax === 0 && dx < -eps) || (ax === 1 && dx > eps) || (ay === 0 && dy < -eps) || (ay === 1 && dy > eps)) {
    return { t: 0, hitX: ox, hitY: oy, ratio: 0, outside: true };
  }
  let tMax = Infinity;
  if (dx > eps) tMax = Math.min(tMax, (W - ox) / dx);
  else if (dx < -eps) tMax = Math.min(tMax, (0 - ox) / dx);
  if (dy > eps) tMax = Math.min(tMax, (H - oy) / dy);
  else if (dy < -eps) tMax = Math.min(tMax, (0 - oy) / dy);
  if (!isFinite(tMax) || tMax < 0) tMax = 0;
  const diag = Math.hypot(W, H);
  return {
    t: tMax,
    hitX: ox + dx * tMax,
    hitY: oy + dy * tMax,
    ratio: Math.min(1, tMax / diag),
    outside: false,
  };
}

export function idealAngleForCorner(corner, aspect = 4 / 3) {
  if (corner === "center") return 0;
  const c = CORNERS[corner];
  const tx = (1 - c.ax) * aspect - c.ax * aspect;
  const ty = (1 - c.ay) * 1 - c.ay * 1;
  return normDeg((Math.atan2(ty, tx) * 180) / Math.PI);
}

// 综合单真源评估
export function evaluate(state, aspect = 4 / 3) {
  const c = CORNERS[state.corner] || CORNERS.br;
  const W = aspect;
  const H = 1;
  const R = radiusForMass(state.corner, state.mass, aspect);

  // 实绘主角面积占比
  const cornerArea = state.corner === "center"
    ? Math.min(W * H, Math.PI * R * R)
    : quarterCircleClipArea(R, W, H);
  const massRatio = cornerArea / (W * H);

  // 对角虚应面积占比（居中模式下不计对角块，或若有重块仍计）
  const echoDef = ECHOS[state.echo] || ECHOS.none;
  const echoRatio = state.corner === "center" && state.echo === "light" ? 0 : echoDef.area;

  const solidRatio = Math.min(0.96, massRatio + echoRatio);
  const voidRatio = Math.max(0.04, 1 - solidRatio);

  const idealDeg = idealAngleForCorner(state.corner, aspect);
  const deg = normDeg(state.angle);
  const delta = state.corner === "center" ? 0 : angleDiff(deg, idealDeg);
  const ray = state.corner === "center"
    ? { t: 0, ratio: 0, outside: false, hitX: W * 0.5, hitY: H * 0.5 }
    : rayInRect(c.ax, c.ay, deg, W, H);

  // 方向分类
  let vectorKind = "inward";
  if (state.corner === "center") {
    vectorKind = "center";
  } else if (ray.outside || delta > BANDS.skimMaxDeg) {
    vectorKind = "escape";
  } else if (delta > BANDS.inwardMaxDeg) {
    vectorKind = "skim";
  }

  // 计算面积加权视觉重心（归一化到画布 0..1）
  const dirX = c.ax === 0 ? 1 : c.ax === 1 ? -1 : 0;
  const dirY = c.ay === 0 ? 1 : c.ay === 1 ? -1 : 0;
  const centroidDist = Math.min(0.45, (4 * R) / (3 * Math.PI));
  const cxMain = state.corner === "center" ? 0.5 : Math.max(0.06, Math.min(0.94, c.ax + (dirX * centroidDist) / W));
  const cyMain = state.corner === "center" ? 0.5 : Math.max(0.06, Math.min(0.94, c.ay + dirY * centroidDist));

  const wMain = massRatio;
  const wEcho = echoRatio;
  const cogX = (cxMain * wMain + c.oppX * wEcho) / Math.max(0.01, wMain + wEcho);
  const cogY = (cyMain * wMain + c.oppY * wEcho) / Math.max(0.01, wMain + wEcho);
  const offsetFromCenter = Math.hypot(cogX - 0.5, cogY - 0.5);

  // 四项硬性检核
  const isCorner = state.corner !== "center";
  const anchorOk = isCorner && massRatio >= BANDS.massMin && massRatio <= BANDS.massMax;
  const vectorOk = isCorner && vectorKind === "inward";
  const voidOk = massRatio >= BANDS.massMin && massRatio <= BANDS.massMax && voidRatio >= BANDS.voidMin;
  const echoOk = state.echo !== "heavy" && !(isCorner && massRatio > BANDS.massNeedEcho && state.echo === "none");

  const passed = [anchorOk, vectorOk, voidOk, echoOk].filter(Boolean).length;

  // 诊断优先级：先纠最致命结构错误，再纠次级问题
  let faultId = "ok";
  let badge = "4/4 边角成立";
  let title = "";
  let body = "";
  let nextStep = "";
  let balanceTier = "非对称稳衡（示意）";

  if (!isCorner) {
    faultId = "center_stuck";
    badge = `${passed}/4 退回正中`;
    title = "主体漂在正中，四面平均没有边角张力";
    body = "把主体放在画框正中央是最省事的静平衡，眼睛落进来就停在原地，四周空白被均切成了四条窄边，不再有「一角定盘」的纵深与方向感。";
    nextStep = "直接点击画布四个角落任意一处角座（如右下角或左下角），先把重心压进边角。";
    balanceTier = "中央静滞（示意）";
  } else if (vectorKind === "escape") {
    faultId = "vector_escape";
    badge = `${passed}/4 视线外逃`;
    title = `主方向正朝${c.short}外框撞去，视线一进来就滑出画面`;
    body = `当前锚在${c.label}，方向角 ${Math.round(deg)}° 偏离对角内腹 ${Math.round(delta)}°，线条和势头直接顶向外墙。观者刚看到主体就被推出画外，对面 ${Math.round(voidRatio * 100)}% 的留白彻底失联。`;
    nextStep = `在画布上左右横拖（或按 ← / → 键），把绿色主箭头扳回画腹内侧（${Math.round(idealDeg)}° 附近）。`;
    balanceTier = "外泄失联（示意）";
  } else if (massRatio > BANDS.massMax) {
    faultId = "mass_overflow";
    badge = `${passed}/4 满溢吞白`;
    title = `一角膨胀到 ${Math.round(massRatio * 100)}%，把留白挤扁了`;
    body = `边角式构图的力量来自「实少虚多」的反差。现在角部实景跨越画幅近半（总实景 ${Math.round(solidRatio * 100)}%，留白仅剩 ${Math.round(voidRatio * 100)}%），画面发闷，退化成了偏沉的满构图。`;
    nextStep = "把「一角占比」滑杆往左收到 22%–42% 经验参考带，把呼吸感还给对角留白。";
    balanceTier = "角重憋闷（示意）";
  } else if (state.echo === "heavy") {
    faultId = "echo_heavy";
    badge = `${passed}/4 对角喧宾`;
    title = "对角塞了抢戏重块，一角定盘瓦解成两头扯平";
    body = `你在对面空域放了一块占 ${Math.round(echoRatio * 100)}% 的实景大块，和${c.label}主景形成近乎相等的对峙。观者视线在两头来回打架，孤清大留白的韵味消失了。`;
    nextStep = "点击画布对角红框块（或下方「对角虚应」切到「轻度虚应」），把对角缩成一笔轻点。";
    balanceTier = "两头拉扯（示意）";
  } else if (massRatio < BANDS.massMin) {
    faultId = "mass_tiny";
    badge = `${passed}/4 孤角失重`;
    title = `主体缩成 ${Math.round(massRatio * 100)}% 微粒，压不住大片夜底`;
    body = `留白虽然高达 ${Math.round(voidRatio * 100)}%，但${c.label}的锚点太小太轻，失去了画框角落应有的承重支点，整幅画看起来像没排完的空底板。`;
    nextStep = "把「一角占比」稍微放大到 22%–40%，让角部体量足以撑起对角留白。";
    balanceTier = "过轻孤悬（示意）";
  } else if (vectorKind === "skim") {
    faultId = "vector_skim";
    badge = `${passed}/4 贴边擦滑`;
    title = `方向贴着边框斜擦（偏内腹 ${Math.round(delta)}°），未能贯通画腹`;
    body = `虽然没有直接撞向外墙，但当前方向角 ${Math.round(deg)}° 紧贴着画框边缘溜走，没有把目光送进画面宽阔的中腹留白区，张力差了最后一口气。`;
    nextStep = `微调旋转方向（横拖画布或按 ← / →），再向画面对角方向收拢约 ${Math.max(5, Math.round(delta - 25))}°。`;
    balanceTier = "贴框微偏（示意）";
  } else if (!echoOk) {
    faultId = "echo_missing_heavy";
    badge = `${passed}/4 重角缺应`;
    title = `${c.short}体量偏沉（${Math.round(massRatio * 100)}%），对面完全空寂略显塌角`;
    body = `主体压在${c.label}已经足够扎实，但因为体量接近上限、而对角一物全无，画面微微向${c.short}沉坠。南宋画院常在对角留白处落一行小诗或两只远鸟，借四两拨千斤把重心拉平。`;
    nextStep = "把「对角虚应」切到「轻度虚应」（或略微收轻主体到 35% 以下），感受一下重心如何瞬间立住。";
    balanceTier = "单角偏沉（示意）";
  } else {
    faultId = "ok";
    badge = "4/4 一角成立";
    title = `${c.label}锚稳，视线直贯内腹，留白与张力咬合`;
    body = `角部实景占 ${Math.round(massRatio * 100)}%、净留白 ${Math.round(voidRatio * 100)}%，主方向 ${Math.round(deg)}° 仅偏理想对角 ${Math.round(delta)}°。${c.mood}。${state.echo === "light" ? "对角一笔轻虚应把大留白变成有空气的呼吸场。" : "克制的实景体量即便对角极简留白也能立住。"}`;
    nextStep = "试试点击另外三个角座或切换「南宋马一角 / 暗夜建筑展」，看同一套力学如何在不同题材里成立。";
    balanceTier = state.echo === "light" ? "四两拨千斤（示意）" : "孤清稳锚（示意）";
  }

  // 原海报左列三圆环的单项状态短签
  const pointsStatus = {
    anchor: !isCorner
      ? { ok: false, tag: "退回正中" }
      : massRatio > BANDS.massMax
        ? { ok: false, tag: `满溢 ${Math.round(massRatio * 100)}%` }
        : massRatio < BANDS.massMin
          ? { ok: false, tag: `过轻 ${Math.round(massRatio * 100)}%` }
          : { ok: true, tag: `${c.short} ${Math.round(massRatio * 100)}%` },
    vector: !isCorner
      ? { ok: false, tag: "无指向" }
      : vectorKind === "escape"
        ? { ok: false, tag: "撞墙外逃" }
        : vectorKind === "skim"
          ? { ok: false, tag: `擦边偏 ${Math.round(delta)}°` }
          : { ok: true, tag: `入腹 ${Math.round(deg)}°` },
    void: state.echo === "heavy"
      ? { ok: false, tag: "对角抢戏" }
      : voidRatio < BANDS.voidMin
        ? { ok: false, tag: `留白 ${Math.round(voidRatio * 100)}%` }
        : !echoOk
          ? { ok: false, tag: "重角缺应" }
          : { ok: true, tag: `留白 ${Math.round(voidRatio * 100)}%` },
  };

  return {
    corner: c,
    R,
    massPct: Math.round(massRatio * 100),
    echoPct: Math.round(echoRatio * 100),
    solidPct: Math.round(solidRatio * 100),
    voidPct: Math.round(voidRatio * 100),
    deg: Math.round(deg),
    idealDeg: Math.round(idealDeg),
    delta: Math.round(delta),
    vectorKind,
    ray,
    cog: { x: cogX, y: cogY, offset: offsetFromCenter },
    checks: { anchorOk, vectorOk, voidOk, echoOk },
    passed,
    ok: passed === 4,
    faultId,
    badge,
    title,
    body,
    nextStep,
    balanceTier,
    pointsStatus,
  };
}

// 331 开合构图 — 单真源几何投影与态势研判引擎
// 主舞台画布、DOM 实测读数、标题自示范变量与 06 节单变量练习共用同一套投影几何函数。

export const PORTAL = {
  hingeL: 0.11,
  hingeR: 0.89,
  leafDepth: 0.35,
  focalLen: 0.82,
  outerHalfH: 0.385,
  subjectRadius: 0.088, // 相对于门框宽度的主体圆半径（渲染时严格等比画正圆）
  minAngle: 18,         // 最合拢（几乎关死）
  maxAngle: 114,        // 最敞开（门扇沿视线退平消失）
};

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报·朱圆门庭",
    short: "原海报",
    subjectName: "主体焦点",
    subjectSub: "被包围，受保护",
  },
  scroll: {
    id: "scroll",
    label: "宋画·峡谷云门",
    short: "宋画峡谷",
    subjectName: "远峰云亭",
    subjectSub: "夹峡护主，云气吐纳",
  },
  cover: {
    id: "cover",
    label: "书封·折门海报",
    short: "展讯书封",
    subjectName: "展名主标",
    subjectSub: "双翼压阵，上下透气",
  },
};

// 开场刻意停在「四面逼塞 + 夹挤焦心」错态（绝不预先给答案）
export const INITIAL_STATE = {
  leftAngle: 28,
  rightAngle: 28,
  linked: true,
  topShut: true,
  botShut: true,
  showRays: true,
  theme: "poster",
};

export const PRESETS = {
  broken: {
    label: "复原开场",
    kind: "reset",
    leftAngle: 28,
    rightAngle: 28,
    linked: true,
    topShut: true,
    botShut: true,
  },
  classic: {
    label: "原海报双开",
    kind: "valid",
    leftAngle: 60,
    rightAngle: 60,
    linked: true,
    topShut: false,
    botShut: false,
  },
  skylight: {
    label: "天窗立轴解",
    kind: "valid",
    leftAngle: 56,
    rightAngle: 56,
    linked: true,
    topShut: false,
    botShut: true,
  },
  asymmetric: {
    label: "独扇偏开解",
    kind: "valid",
    leftAngle: 48,
    rightAngle: 78,
    linked: false,
    topShut: false,
    botShut: false,
  },
  failSealed: {
    label: "试错：四面逼塞",
    kind: "fail",
    leftAngle: 24,
    rightAngle: 24,
    linked: true,
    topShut: true,
    botShut: true,
  },
  failShallow: {
    label: "试错：全开浅露",
    kind: "fail",
    leftAngle: 108,
    rightAngle: 108,
    linked: true,
    topShut: false,
    botShut: false,
  },
  failPinch: {
    label: "试错：夹挤焦心",
    kind: "fail",
    leftAngle: 34,
    rightAngle: 34,
    linked: true,
    topShut: false,
    botShut: false,
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function projectLeaf(side, angleDeg) {
  const rad = (clamp(angleDeg, PORTAL.minAngle, PORTAL.maxAngle) * Math.PI) / 180;
  const isLeft = side === "left";
  const xHinge = isLeft ? PORTAL.hingeL : PORTAL.hingeR;
  const dir = isLeft ? 1 : -1;

  // 真实三维铰链旋转：z3d 深入中庭，f/(f+z3d) 决定透视收束
  const x3d = xHinge + dir * PORTAL.leafDepth * Math.cos(rad);
  const z3d = PORTAL.leafDepth * Math.sin(rad);
  const scale = PORTAL.focalLen / (PORTAL.focalLen + z3d);

  const rawInnerX = 0.5 + (x3d - 0.5) * scale;
  // 当门扇外旋超过视线切角时，投影宽度趋近 0（平贴外柱）
  const innerX = isLeft ? Math.max(xHinge, rawInnerX) : Math.min(xHinge, rawInnerX);
  const innerHalfH = PORTAL.outerHalfH * scale;
  const width = Math.abs(innerX - xHinge);
  const area = width * (PORTAL.outerHalfH + innerHalfH); // 梯形面积 (2*outerHalfH + 2*innerHalfH)*w/2

  const poly = [
    { x: xHinge, y: 0.5 - PORTAL.outerHalfH },
    { x: innerX, y: 0.5 - innerHalfH },
    { x: innerX, y: 0.5 + innerHalfH },
    { x: xHinge, y: 0.5 + PORTAL.outerHalfH },
  ];

  return {
    side,
    angle: clamp(angleDeg, PORTAL.minAngle, PORTAL.maxAngle),
    xHinge,
    innerX,
    outerTop: 0.5 - PORTAL.outerHalfH,
    outerBot: 0.5 + PORTAL.outerHalfH,
    innerTop: 0.5 - innerHalfH,
    innerBot: 0.5 + innerHalfH,
    width,
    area,
    scale,
    poly,
  };
}

// 从状态算出完整 2D 投影多边形与实测几何度量（唯一真源）
export function computeGeometry(state) {
  const left = projectLeaf("left", state.leftAngle);
  const right = projectLeaf("right", state.rightAngle);

  const totalSpan = PORTAL.hingeR - PORTAL.hingeL; // 0.78
  const apertureSpan = Math.max(0, right.innerX - left.innerX);
  const aperturePct = Math.round((apertureSpan / totalSpan) * 100);

  const subjectCx = 0.5;
  const subjectCy = 0.485;
  const r = PORTAL.subjectRadius;

  // 门锋到主体圆左右边缘的真实净空（占总跨度百分比；负值表示门锋已经压进主体！）
  const clearLeft = left.innerX <= subjectCx - r ? subjectCx - r - left.innerX : -(left.innerX - (subjectCx - r));
  const clearRight = right.innerX >= subjectCx + r ? right.innerX - (subjectCx + r) : -((subjectCx + r) - right.innerX);
  const minClearance = Math.min(clearLeft, clearRight);
  const minClearancePct = Math.round((minClearance / totalSpan) * 100);

  // 左右两翼投影面积占整个门框净面积之比
  const frameArea = totalSpan * (PORTAL.outerHalfH * 2);
  const wingAreaRatio = (left.area + right.area) / frameArea;
  const wingAreaPct = Math.round(wingAreaRatio * 100);

  // 上下气口状态（0 / 1 / 2 处打开）
  const openVents = (state.topShut ? 0 : 1) + (state.botShut ? 0 : 1);
  const ventOpenPct = openVents * 50;

  // 四周总围合周长占比（左、右门翼围合强度 + 上下封闸贡献）
  const leftHold = clamp(left.width / 0.25, 0, 1);
  const rightHold = clamp(right.width / 0.25, 0, 1);
  const sideEnclosure = (leftHold + rightHold) * 0.5;
  const topHold = state.topShut ? 1 : 0;
  const botHold = state.botShut ? 1 : 0;
  const enclosurePct = Math.round(((leftHold + rightHold + topHold + botHold) / 4) * 100);
  const releasePct = 100 - enclosurePct;

  // 左右偏衡（两翼角度差与宽度差）
  const angleDiff = Math.abs(left.angle - right.angle);
  const widthDiff = Math.abs(left.width - right.width);
  const minWingWidth = Math.min(left.width, right.width);
  const maxWingWidth = Math.max(left.width, right.width);

  // 上下虚线门楣坐标（连接两扇门内角）
  const topLine = { x1: left.innerX, y1: left.innerTop, x2: right.innerX, y2: right.innerTop };
  const botLine = { x1: left.innerX, y1: left.innerBot, x2: right.innerX, y2: right.innerBot };

  return {
    left,
    right,
    topLine,
    botLine,
    subject: { cx: subjectCx, cy: subjectCy, r },
    totalSpan,
    apertureSpan,
    aperturePct,
    clearLeft,
    clearRight,
    minClearance,
    minClearancePct,
    wingAreaRatio,
    wingAreaPct,
    openVents,
    ventOpenPct,
    sideEnclosure,
    enclosurePct,
    releasePct,
    angleDiff,
    widthDiff,
    minWingWidth,
    maxWingWidth,
  };
}

// 依据真实投影几何核算态势与白话诊断（6 类双向错态 + 4 类合法解）
export function evaluate(state) {
  const g = computeGeometry(state);
  const {
    aperturePct,
    minClearancePct,
    wingAreaPct,
    openVents,
    enclosurePct,
    releasePct,
    angleDiff,
    left,
    right,
  } = g;

  // 1. 最严重错态：四面逼塞（双翼过合 + 上下全封，或四周围合 >= 88%）
  if (openVents === 0 && (aperturePct < 34 || minClearancePct < 4)) {
    return {
      ok: false,
      code: "sealed-cramped",
      badge: "逼塞锁死 · 有合无开",
      headline: `四面合死、中庭仅剩 ${aperturePct}%，视线被关进闷盒`,
      why: `左右门扉掩合到 ${Math.round(left.angle)}° / ${Math.round(right.angle)}°，中庭紧逼主体（净空 ${minClearancePct}%），上下两处气口又同时封死。只有「合」的围堵、没有「开」的出口，空间纵深彻底塌扁——这正是王原祁所忌的「开合逼塞则生病」。`,
      action: "向右横拖画布推开双扉，再点开顶部或底部封口让视线透出画外。",
      quickFixLabel: "推开双扉并打开上下气口",
      quickFix: { leftAngle: 60, rightAngle: 60, linked: true, topShut: false, botShut: false },
      openStatus: "封死 · 0/2 口",
      closeStatus: `过逼 · 净空 ${minClearancePct}%`,
      contrastStatus: "闷塞失衡（示意）",
      rhythmLabel: "窒息停滞（示意）",
      metrics: g,
    };
  }

  // 2. 门锋夹挤主体（哪怕纵口已开，但门翼擦碰或切入主体圆缘）
  if (minClearancePct < 3) {
    return {
      ok: false,
      code: "pinch-subject",
      badge: "夹挤焦心 · 门锋压主",
      headline: `门锋压到主体边沿（净空 ${minClearancePct}%），围合变成挤压`,
      why: `「合」的作用是向内护持主体，而不是贴着主体皮肤挤压它。现在左右门锋距主体圆缘只剩 ${minClearancePct}%，焦点的呼吸空间被吞掉，人眼只觉得压迫，感受不到安全与秩序。`,
      action: "向右推开门扉，让中庭净宽拉开到 38% 以上，给主体留出舒展护城圈。",
      quickFixLabel: "向外推开留出护持净空",
      quickFix: { leftAngle: Math.max(58, left.angle), rightAngle: Math.max(58, right.angle), topShut: state.topShut && state.botShut ? false : state.topShut },
      openStatus: openVents === 0 ? "封死 · 0/2 口" : `已开 ${openVents}/2 口`,
      closeStatus: `夹挤 · 净空 ${minClearancePct}%`,
      contrastStatus: "过合压主（示意）",
      rhythmLabel: "局促紧绷（示意）",
      metrics: g,
    };
  }

  // 3. 四散浅露（双翼完全退平失守，有开无合）
  if (wingAreaPct < 14 && openVents >= 1) {
    return {
      ok: false,
      code: "shallow-exposed",
      badge: "四散浅露 · 有开无合",
      headline: `两翼围合仅剩 ${wingAreaPct}%，主体失去护持直接漂空`,
      why: `左右门扉已经甩开到 ${Math.round(left.angle)}° / ${Math.round(right.angle)}°，侧翼几乎退成细边，加上气口大敞（开放度 ${releasePct}%），视线一入画就顺着四边滑出画外。王原祁称这种没有收束的局面为「浅露」——看似空阔，实则留不住眼。`,
      action: "向左横拖画布把门翼往里收一收（约 50°–75°），立起左右护持。",
      quickFixLabel: "收拢双翼立起围合护持",
      quickFix: { leftAngle: 60, rightAngle: 60, linked: true, topShut: false, botShut: false },
      openStatus: `过敞 · 开放 ${releasePct}%`,
      closeStatus: `失守 · 围合 ${wingAreaPct}%`,
      contrastStatus: "失合散漫（示意）",
      rhythmLabel: "松散滑脱（示意）",
      metrics: g,
    };
  }

  // 4. 纵口全封（左右门翼已合度，但上下两口全封死）
  if (openVents === 0) {
    return {
      ok: false,
      code: "vents-sealed",
      badge: "纵口封死 · 闷顶闷底",
      headline: `左右护持已立，但上下封口全锁，气脉仍在盒内打转`,
      why: `两扇侧扉已经把中庭拉开到 ${aperturePct}%，主体有了安稳净空（${minClearancePct}%），可惜天口与地口同时被封死。画面像一段两头堵住的死走廊，眼睛被困在里面，缺少「向外延展，释放视线」的余韵。`,
      action: "点按画布顶部或底部的朱红封口条，至少打开一处气口（全开即原海报双开正局，只开上口即立轴天窗解）。",
      quickFixLabel: "打开上下吐纳气口",
      quickFix: { topShut: false, botShut: false },
      openStatus: "封死 · 0/2 口",
      closeStatus: `适度 · 净空 ${minClearancePct}%`,
      contrastStatus: "缺口闷堵（示意）",
      rhythmLabel: "闭气无余韵（示意）",
      metrics: g,
    };
  }

  // 5. 单翼倾覆（独扇模式下，一侧极度失守而另一侧重压）
  if (angleDiff > 44 && (left.angle > 96 || right.angle > 96)) {
    const weakSide = left.angle > right.angle ? "左扉" : "右扉";
    const strongSide = left.angle > right.angle ? "右扉" : "左扉";
    return {
      ok: false,
      code: "lopsided-collapse",
      badge: "单翼失守 · 偏压失衡",
      headline: `${weakSide}几乎退空而${strongSide}独压，围合阵势裂开半边`,
      why: `传统山水虽容许「一侧深合、一侧舒开」的偏势，但若一侧门翼完全退平消失（差角达 ${Math.round(angleDiff)}°），画面只剩单边推挤、失去回护呼应，中心主体会明显显得向敞口一侧滑落。`,
      action: `把退空的${weakSide}往回拉一些（约 72°–84°），留出呼应边势，即可成就「独扇偏开解」。`,
      quickFixLabel: "补回呼应门翼成偏开解",
      quickFix: {
        leftAngle: left.angle > right.angle ? 78 : clamp(left.angle, 48, 60),
        rightAngle: right.angle > left.angle ? 78 : clamp(right.angle, 48, 60),
        linked: false,
      },
      openStatus: `偏漏 · 开放 ${releasePct}%`,
      closeStatus: `单侧偏压 · 差角 ${Math.round(angleDiff)}°`,
      contrastStatus: "单边失衡（示意）",
      rhythmLabel: "倾侧滑坠（示意）",
      metrics: g,
    };
  }

  // 6. 开合温吞（双翼过于靠边且极浅 86°–96°，围合感偏弱）
  if (wingAreaPct < 20 && aperturePct > 68) {
    return {
      ok: false,
      code: "weak-contrast",
      badge: "开合温吞 · 反差不足",
      headline: `门翼退得太浅（围合仅 ${wingAreaPct}%），开与合的反差拉不开`,
      why: `现在上下虽已打开，但左右门翼只露出一窄条边，对中庭的「向内包围」力度太弱。开合构图迷人在「收得住、放得开」的对比张力——两翼再往内收 10°–20°，中庭立刻会沉稳下来。`,
      action: "略微向左拖动，把双扉收至 46°–80° 之间，让透视门翼真正立出体量。",
      quickFixLabel: "收紧门翼拉出开合反差",
      quickFix: { leftAngle: 62, rightAngle: 62 },
      openStatus: `偏敞 · ${openVents}/2 口`,
      closeStatus: `偏弱 · 围合 ${wingAreaPct}%`,
      contrastStatus: "反差平淡（示意）",
      rhythmLabel: "张力微弱（示意）",
      metrics: g,
    };
  }

  // === 四类合法构图解（均由真实几何自动识别，不止一个标准答案！） ===

  // 解 A：独扇偏开解（非对称但两侧都有呼应护持）
  if (angleDiff >= 14) {
    const deepSide = left.angle < right.angle ? "左" : "右";
    const openSide = left.angle < right.angle ? "右" : "左";
    return {
      ok: true,
      code: "valid-asymmetric",
      badge: "开合得法 · 独扇偏开解",
      headline: `${deepSide}翼深合蓄势、${openSide}翼舒张吐纳，偏中求活`,
      why: `两翼呈 ${Math.round(left.angle)}° / ${Math.round(right.angle)}° 错落开合（中庭 ${aperturePct}%，安全净空 ${minClearancePct}%），一侧以厚重折面托住重心，另一侧留出透气余地并与纵口呼应，颇得传统画「偏门迎客、一收一放」之趣。`,
      action: "已成偏开佳局；也可以试着关闭下口体会「下承上吐」，或拖回对称看原海报正局。",
      quickFixLabel: null,
      quickFix: null,
      openStatus: `畅达 · ${openVents}/2 口`,
      closeStatus: `错落护持 · 净空 ${minClearancePct}%`,
      contrastStatus: "动静对比鲜明（示意）",
      rhythmLabel: "灵动有致（示意）",
      metrics: g,
    };
  }

  // 解 B：天窗立轴解（单口封底或封顶，对向敞开）
  if (openVents === 1) {
    const openDir = !state.topShut ? "上口敞天、下口稳托" : "上口压檐、下口泄水";
    return {
      ok: true,
      code: "valid-skylight",
      badge: "开合得法 · 单口定向解",
      headline: `${openDir}，左右合抱成三面护持、单向强导流`,
      why: `中庭宽 ${aperturePct}%（主体净空 ${minClearancePct}%），三面围合先给足安全与秩序，唯一敞开的纵口则把视线像烟囱气流一样定向送出画外——立轴山水与人物海报常借此制造强烈的方向延伸感。`,
      action: "已成三面护持佳局；也可点开另一侧封口，对比双向延展的通透感。",
      quickFixLabel: null,
      quickFix: null,
      openStatus: !state.topShut ? "上开下承 · 1/2 口" : "上覆下泄 · 1/2 口",
      closeStatus: `三面护持 · 净空 ${minClearancePct}%`,
      contrastStatus: "定向张力强（示意）",
      rhythmLabel: "单向升腾（示意）",
      metrics: g,
    };
  }

  // 解 C：宽庭大开大合解（双翼 72°–86°，宽广仪式感）
  if ((left.angle + right.angle) / 2 >= 72) {
    return {
      ok: true,
      code: "valid-grand",
      badge: "开合得法 · 宽庭舒朗解",
      headline: `双扉广开至 ${Math.round((left.angle + right.angle) / 2)}°，中庭宽阔却仍见边势护持`,
      why: `中庭舒展至 ${aperturePct}%，主体周身拥有 ${minClearancePct}% 宽裕呼吸带；两侧透视折面虽较轻盈，仍以明确向内收束的斜边锁住视线，适合大气、留白充沛的现代画展海报与开阔风景。`,
      action: "已成舒朗佳局；再往里收 12° 可感受原海报更浓烈的戏剧包围感。",
      quickFixLabel: null,
      quickFix: null,
      openStatus: "双向通透 · 2/2 口",
      closeStatus: `舒朗护持 · 净空 ${minClearancePct}%`,
      contrastStatus: "开阔明朗（示意）",
      rhythmLabel: "舒缓呼吸（示意）",
      metrics: g,
    };
  }

  // 解 D：原海报双开正局（经典 42°–72° 对称围合 + 上下双开）
  return {
    ok: true,
    code: "valid-classic",
    badge: "开合得法 · 原海报正局",
    headline: `左右向内折围、上下双向打开，收放张力恰到好处`,
    why: `双扉停在 ${Math.round(left.angle)}° / ${Math.round(right.angle)}°，围合面积占 ${wingAreaPct}%，中庭留出 ${aperturePct}% 空间与 ${minClearancePct}% 安全净空：左右实面把视线牢牢拢回中央主体，上下开口又让气息顺畅延展到画框之外。`,
    action: "已复现 331 原海报经典开合平衡；试试切到「宋画峡谷」或「独扇偏开」探索其他解法。",
    quickFixLabel: null,
    quickFix: null,
    openStatus: "双向释放 · 2/2 口",
    closeStatus: `安稳护持 · 净空 ${minClearancePct}%`,
    contrastStatus: "收放对比饱满（示意）",
    rhythmLabel: "吐纳有律（示意）",
    metrics: g,
  };
}

// =========================================================================
// 01 节：四向门框解剖板（上/下/左/右 16 种围合拓扑单真源分析）
// =========================================================================
export function evaluateTopology(edges) {
  const { top, right, bottom, left } = edges;
  const closedCount = [top, right, bottom, left].filter(Boolean).length;
  const openCount = 4 - closedCount;
  const closedPct = closedCount * 25;
  const openPct = openCount * 25;

  if (closedCount === 4) {
    return {
      closedCount,
      openCount,
      closedPct,
      openPct,
      status: "fail",
      tag: "四面合死 · 逼塞",
      title: "四边全封：只有「合」没有「开」",
      body: "四周全是实墙，主体确实被框住了，但视线撞完一圈找不到任何出口，观感像被锁在狭小暗箱里。哪怕只撤掉一面墙，画面立刻就会开始呼吸。",
      escapeDirs: [],
    };
  }
  if (closedCount === 0) {
    return {
      closedCount,
      openCount,
      closedPct,
      openPct,
      status: "fail",
      tag: "四面全开 · 浅露",
      title: "四边全空：只有「开」没有「合」",
      body: "没有任何边界往里拢住视线，主体孤零零飘在敞开纸面上，眼睛扫过去很难停顿。极简纯留白虽可偶尔为之，但它靠的是留白比例，而不是开合张力。",
      escapeDirs: ["top", "right", "bottom", "left"],
    };
  }
  if (left && right && !top && !bottom) {
    return {
      closedCount,
      openCount,
      closedPct,
      openPct,
      status: "ideal",
      tag: "原海报式 · 夹道天窗",
      title: "左右合 × 上下开：最经典的双扉通道",
      body: "这正是 331 原海报的骨架——左右两扇竖向实壁像峡谷或折门一样夹护主体，上下两个宽口把视线朝天顶与近景双向释放，静稳中自带纵深势能。",
      escapeDirs: ["top", "bottom"],
    };
  }
  if (top && bottom && !left && !right) {
    return {
      closedCount,
      openCount,
      closedPct,
      openPct,
      status: "ideal",
      tag: "横卷走廊 · 上下夹护",
      title: "上下合 × 左右开：长卷与电影宽银幕的节奏",
      body: "上下压住天际与地基，把视线压缩成一条横向河道向左右延展。传统山水手卷与 2.39:1 电影宽画幅常用这种横开纵合，让人觉得画面在左右画框之外仍在延续。",
      escapeDirs: ["left", "right"],
    };
  }
  if (closedCount === 2) {
    const cornerName =
      (bottom && left && "左下合 × 右上开") ||
      (bottom && right && "右下合 × 左上开") ||
      (top && left && "左上合 × 右下开") ||
      "右上合 × 左下开";
    const escapeDirs = [
      !top && "top",
      !right && "right",
      !bottom && "bottom",
      !left && "left",
    ].filter(Boolean);
    return {
      closedCount,
      openCount,
      closedPct,
      openPct,
      status: "ideal",
      tag: "折角半围 · 边角取势",
      title: `${cornerName}：邻边托底、对角放远`,
      body: "两道相邻的边界围出一处安稳折角护住主体，对角两面彻底打开通向远空。南宋「马一角、夏半边」式的边角山水与现代非对称封面，走的正是这路半围半放。",
      escapeDirs,
    };
  }
  if (closedCount === 3) {
    const openName = !top ? "上口" : !bottom ? "下口" : !left ? "左口" : "右口";
    const escapeDirs = [!top && "top", !right && "right", !bottom && "bottom", !left && "left"].filter(Boolean);
    return {
      closedCount,
      openCount,
      closedPct,
      openPct,
      status: "good",
      tag: "三合单开 · 洞门定向",
      title: `三面围合 × 独留${openName}：强方向聚焦`,
      body: `三面实墙把干扰挡得严严实实，安全感与控制力最强；全部积蓄的视线张力都从唯一的${openName}喷薄而出。适合极强的叙事指向，但开口不能太窄，否则易滑向逼塞。`,
      escapeDirs,
    };
  }
  // closedCount === 1
  const wallName = top ? "顶边" : bottom ? "底边" : left ? "左边" : "右边";
  const escapeDirs = [!top && "top", !right && "right", !bottom && "bottom", !left && "left"].filter(Boolean);
  return {
    closedCount,
    openCount,
    closedPct,
    openPct,
    status: "warn",
    tag: "单壁偏轻 · 开重于合",
    title: `只靠${wallName}单面依傍：开阔有余、收束偏轻`,
    body: `只有${wallName}一面提供依靠，其余三面全面敞开。画面很轻盈通透，但「合」的包围感相对薄弱，需要主体本身分量够重或色彩反差极强，才压得住阵脚。`,
    escapeDirs,
  };
}

// =========================================================================
// 06 节：单变量练习（四张方案只改变左右门翼合拢角度与对称度，其余 100% 相同）
// =========================================================================
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    leftAngle: 98,
    rightAngle: 98,
    topShut: false,
    botShut: false,
    correct: false,
    verdict: "过开浅露：左右门翼退得太浅",
    detail: "只改变了门翼角度——两侧退到 98° 后，侧壁薄得像细边线，中庭敞到几乎毫无围护，主体圆盘像漂在裸白画框里，视线进画后顺势往四周散失。",
  },
  {
    id: "B",
    label: "方案 B",
    leftAngle: 37,
    rightAngle: 37,
    topShut: false,
    botShut: false,
    correct: false,
    verdict: "过合逼塞：左右门锋紧贴主体边沿",
    detail: "虽然上下气口是敞开的，但左右门翼合拢到 37°，门锋几乎贴死主体圆缘（净空逼近零）。主体显得被夹住而不是被保护，呼吸空间被压没了。",
  },
  {
    id: "C",
    label: "方案 C",
    leftAngle: 60,
    rightAngle: 60,
    topShut: false,
    botShut: false,
    correct: true,
    verdict: "判断准确：合而有护、开而有度",
    detail: "两扇门翼折入在 60° 左右，既用醒目的透视斜面把视线稳稳拢向中央主体，又在圆盘周围留出了舒展护持净空；配合上下敞开通道，同时成立了安全感与延伸张力。",
  },
  {
    id: "D",
    label: "方案 D",
    leftAngle: 38,
    rightAngle: 98,
    topShut: false,
    botShut: false,
    correct: false,
    verdict: "单翼偏压：左侧逼近主体而右侧近乎失守",
    detail: "左翼压到 38° 紧逼主体，右翼却甩开到 98° 几乎消失。非对称开合讲究「一深一浅仍有呼应」，像这样一边压顶、一边全漏，视觉重心会明显向右滑倾。",
  },
];

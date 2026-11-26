// 220 双向文字排版 · 单真源几何与诊断模型
// 所有画布实绘尺寸、轨道臂长、四象限面积占比、诊断文案与读数全部由此文件产出。

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报 · 十字共生",
    short: "原海报",
    hEn: "HORIZONTAL",
    hLeftTitle: "横向建立框架",
    hLeftTags: "概览 · 分类 · 并列 · 扩展",
    hRightTitle: "拓展关键信息",
    hRightTags: "理解 · 连接 · 延伸 · 转化",
    vTopEn: "VERTICAL",
    vTopTitle: "纵向阅读路径",
    vTopTags: ["层级", "节奏", "节制"],
    vBotTitle: "深化主题信息",
    vBotTags: ["强调", "方向", "深入"],
    vBotEn: "VERTICAL FLOW",
    quads: {
      nw: { title: "横向系统", body: "快速建立结构 引导整体浏览" },
      ne: { title: "交汇焦点", body: "两种方向的能量汇聚 形成视觉锚点" },
      sw: { title: "方向对比", body: "横向的铺陈 与纵向的深入形成张力" },
      se: { title: "信息切换", body: "根据阅读目标在两种方向间自由切换" },
    },
  },
  exhibition: {
    id: "exhibition",
    label: "展馆导览 · 建筑双年展",
    short: "展馆导览",
    hEn: "EXHIBITION AXIS",
    hLeftTitle: "城市更新脉络",
    hLeftTags: "街区 · 尺度 · 步行 · 共享",
    hRightTitle: "空间叙事展区",
    hRightTags: "模型 · 剖面 · 影像 · 访谈",
    vTopEn: "GALLERY",
    vTopTitle: "东翼三层主廊",
    vTopTags: ["入口", "序厅", "中庭"],
    vBotTitle: "垂直街巷特展",
    vBotTags: ["立面", "采光", "共生"],
    vBotEn: "VERTICAL WING",
    quads: {
      nw: { title: "横览动线", body: "按年代顺序扫清四大城市展章" },
      ne: { title: "中庭汇点", body: "主楼梯与空中连廊在焦点交汇" },
      sw: { title: "尺度对比", body: "宏观街区轴线与纵深立面呼应" },
      se: { title: "展厅切换", body: "观展者可随时转入专题纵廊" },
    },
  },
  strategy: {
    id: "strategy",
    label: "发布幻灯片 · 季度战略",
    short: "战略幻灯片",
    hEn: "OVERVIEW TRACK",
    hLeftTitle: "年度增长框架",
    hLeftTags: "获客 · 转化 · 留存 · 复用",
    hRightTitle: "关键业务里程",
    hRightTags: "产品 · 渠道 · 交付 · 复盘",
    vTopEn: "DEEP DIVE",
    vTopTitle: "核心破局路径",
    vTopTags: ["聚焦", "取舍", "节奏"],
    vBotTitle: "底层体验重构",
    vBotTags: ["速度", "稳定", "闭环"],
    vBotEn: "EXECUTION FLOW",
    quads: {
      nw: { title: "全盘概览", body: "三秒看清全年四段增长结构" },
      ne: { title: "决策锚点", body: "横向目标与纵向抓手在此对齐" },
      sw: { title: "轻重对比", body: "战略主轴厚实 专题纵深利落" },
      se: { title: "汇报切换", body: "横扫全局框架 纵看落地纵深" },
    },
  },
};

// 开场刻意停在 0/4 四重错态：交汇偏隅挤臂 + 五五打架 + 节奏拉平 + 归属割裂失锚
export const INITIAL_BROKEN_STATE = {
  specimen: "poster",
  hubX: 0.23,
  hubY: 0.27,
  axisBalance: 0.0,
  rhythmContrast: 1.05,
  hubScale: 1.0,
  unity: "split",
  readMode: "dual",
  highlightDim: null,
  showGuides: true,
};

// 多组合法解（全部可达 4/4）与双向反向试错预设
export const PRESETS = {
  classic: {
    label: "原海报经典解",
    kind: "valid",
    patch: { hubX: 0.5, hubY: 0.5, axisBalance: 0.46, rhythmContrast: 1.75, hubScale: 1.0, unity: "unified" },
  },
  verticalLead: {
    label: "纵轴领衔解",
    kind: "valid",
    patch: { hubX: 0.39, hubY: 0.5, axisBalance: -0.46, rhythmContrast: 1.82, hubScale: 0.96, unity: "unified" },
  },
  editorialOffset: {
    label: "非对称画报解",
    kind: "valid",
    patch: { hubX: 0.61, hubY: 0.44, axisBalance: 0.38, rhythmContrast: 1.62, hubScale: 0.94, unity: "unified" },
  },
  errCorner: {
    label: "偏边挤爆",
    kind: "error",
    patch: { hubX: 0.21, hubY: 0.26, axisBalance: 0.44, rhythmContrast: 1.72, hubScale: 1.0, unity: "unified" },
  },
  errTie: {
    label: "五五打架",
    kind: "error",
    patch: { hubX: 0.5, hubY: 0.52, axisBalance: 0.0, rhythmContrast: 1.72, hubScale: 1.0, unity: "unified" },
  },
  errSwallow: {
    label: "副轴吞没",
    kind: "error",
    patch: { hubX: 0.5, hubY: 0.52, axisBalance: 0.94, rhythmContrast: 1.75, hubScale: 1.0, unity: "unified" },
  },
  errHubBlot: {
    label: "枢纽压字",
    kind: "error",
    patch: { hubX: 0.5, hubY: 0.52, axisBalance: 0.44, rhythmContrast: 1.72, hubScale: 1.62, unity: "unified" },
  },
  errWashed: {
    label: "失锚灰糊",
    kind: "error",
    patch: { hubX: 0.5, hubY: 0.52, axisBalance: 0.44, rhythmContrast: 1.12, hubScale: 0.68, unity: "washed" },
  },
  reset: {
    label: "复原开场错态",
    kind: "reset",
    patch: { ...INITIAL_BROKEN_STATE },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function createState(overrides = {}) {
  return { ...INITIAL_BROKEN_STATE, ...overrides };
}

// 由当前状态与真实画布像素尺寸，一次性算出所有轨道矩形、字号、净空、四象限面积与四维诊断
export function computeLayout(state, width, height) {
  const w = Math.max(280, width);
  const h = Math.max(260, height);
  const compact = w < 560;
  const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;

  const padX = compact ? 14 : Math.round(clamp(w * 0.032, 22, 40));
  const padY = compact ? 16 : Math.round(clamp(h * 0.042, 18, 28));
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const hubX = clamp(state.hubX, 0.16, 0.84);
  const hubY = clamp(state.hubY, 0.22, 0.78);
  const axisBalance = clamp(state.axisBalance, -1.0, 1.0);
  const rhythmContrast = clamp(state.rhythmContrast, 1.0, 2.6);
  const hubScale = clamp(state.hubScale, 0.55, 1.7);

  // 轴权比：>1 横主导，<1 纵主导，~1 五五打架，>2.28 或 <0.44 副轴吞没
  const domRatio = Math.pow(2.6, axisBalance); // 0.38x ~ 2.60x
  const domDir = domRatio > 1.16 ? "horizontal" : domRatio < 0.86 ? "vertical" : "tie";

  // 按画布尺度与轴权实算横轨高与纵轨宽
  const baseUnit = compact ? clamp(Math.min(w, h) * 0.195, 58, 76) : clamp(Math.min(w * 0.115, h * 0.235), 74, 108);
  const hRailH = Math.round(clamp(baseUnit * Math.pow(domRatio, 0.34), compact ? 44 : 54, compact ? 104 : 148));
  const vRailW = Math.round(clamp(baseUnit * Math.pow(1 / domRatio, 0.34), compact ? 46 : 58, compact ? 104 : 148));

  // 枢纽坐标限制在安全框内，允许刻意拖入偏边触发真实挤臂
  const minCx = padX + vRailW * 0.5 + 18;
  const maxCx = w - padX - vRailW * 0.5 - 18;
  const minCy = padY + hRailH * 0.5 + 18;
  const maxCy = h - padY - hRailH * 0.5 - 18;
  const cx = clamp(padX + innerW * hubX, minCx, maxCx);
  const cy = clamp(padY + innerH * hubY, minCy, maxCy);

  // 交汇 + 方块实绘尺寸
  const hubBase = Math.round(Math.min(hRailH, vRailW) * 0.94);
  const hubW = Math.round(clamp(hubBase * hubScale, 32, Math.min(innerW * 0.34, innerH * 0.38)));
  const hubH = hubW;

  const hRail = { x: padX, y: cy - hRailH / 2, w: innerW, h: hRailH };
  const vRail = { x: cx - vRailW / 2, y: padY, w: vRailW, h: innerH };
  const hub = { x: cx - hubW / 2, y: cy - hubH / 2, w: hubW, h: hubH, cx, cy };

  // 四条臂实际可用排版框
  const capW = compact ? 18 : 26;
  const capH = compact ? 20 : 22;
  const leftArm = {
    x: padX + capW,
    y: hRail.y,
    w: Math.max(12, hub.x - (padX + capW)),
    h: hRail.h,
  };
  const rightArm = {
    x: hub.x + hub.w,
    y: hRail.y,
    w: Math.max(12, w - padX - capW - (hub.x + hub.w)),
    h: hRail.h,
  };
  const topArm = {
    x: vRail.x,
    y: padY + capH,
    w: vRail.w,
    h: Math.max(12, hub.y - (padY + capH)),
  };
  const botArm = {
    x: vRail.x,
    y: hub.y + hub.h,
    w: vRail.w,
    h: Math.max(12, h - padY - capH - (hub.y + hub.h)),
  };

  // 由主导轴权 + 节奏反差单真源推导出横竖实际字号、字重与字距（同时响应真实画布宽高）
  const baseHFont = compact ? 14.5 : clamp(w * 0.021, 18, 27);
  const baseVFont = compact ? 13.0 : clamp(h * 0.036, 14, 18.5);
  const contrastFactor = Math.sqrt(rhythmContrast); // 1.0 ~ 1.61
  let hFontSize;
  let vFontSize;
  let hWeight;
  let vWeight;
  let hTracking;
  let vStepRatio;

  if (domDir === "vertical") {
    vFontSize = baseVFont * clamp(0.95 + (contrastFactor - 1) * 0.24, 0.92, 1.12);
    hFontSize = baseHFont / clamp(contrastFactor * 0.96, 0.96, 1.44);
    vWeight = rhythmContrast >= 1.32 ? 900 : 700;
    hWeight = rhythmContrast >= 1.32 ? 500 : 700;
    hTracking = rhythmContrast >= 1.32 ? 0.14 : 0.02;
    vStepRatio = rhythmContrast >= 1.32 ? 1.08 : 1.03;
  } else if (domDir === "horizontal") {
    hFontSize = baseHFont * clamp(0.96 + (contrastFactor - 1) * 0.36, 0.92, 1.2);
    vFontSize = baseVFont / clamp(contrastFactor * 0.88, 0.95, 1.24);
    hWeight = rhythmContrast >= 1.32 ? 900 : 700;
    vWeight = rhythmContrast >= 1.32 ? 500 : 700;
    hTracking = rhythmContrast >= 1.32 ? 0.06 : 0.02;
    vStepRatio = rhythmContrast >= 1.32 ? 1.14 : 1.04;
  } else {
    // 五五打架：字号与粗细被拉近
    hFontSize = baseHFont * (0.92 + (contrastFactor - 1) * 0.12);
    vFontSize = baseVFont * (0.98 - (contrastFactor - 1) * 0.08);
    hWeight = 700;
    vWeight = 700;
    hTracking = 0.03;
    vStepRatio = 1.04;
  }

  // 限制物理可渲染边界并同步记账
  hFontSize = Number(clamp(hFontSize, 11, compact ? 20 : 32).toFixed(1));
  vFontSize = Number(clamp(vFontSize, 10.5, compact ? 15.5 : 19.5).toFixed(1));
  const scaleRatio = Number((Math.max(hFontSize, vFontSize) / Math.min(hFontSize, vFontSize)).toFixed(2));

  // 实测四臂字盒装填比（判断偏边或枢纽过胖导致的挤字/压字）
  const hPad = compact ? 6 : 14;
  const vPad = compact ? 4 : 8;
  const leftNeed = spec.hLeftTitle.length * hFontSize * (1 + hTracking * 0.65) + hPad * 2;
  const rightNeed = spec.hRightTitle.length * hFontSize * (1 + hTracking * 0.65) + hPad * 2;
  const topNeed = spec.vTopTitle.length * vFontSize * vStepRatio + vPad * 2;
  const botNeed = spec.vBotTitle.length * vFontSize * vStepRatio + vPad * 2;

  const armFits = {
    left: Number((leftArm.w / leftNeed).toFixed(2)),
    right: Number((rightArm.w / rightNeed).toFixed(2)),
    top: Number((topArm.h / topNeed).toFixed(2)),
    bot: Number((botArm.h / botNeed).toFixed(2)),
  };
  const minArmFit = Math.min(armFits.left, armFits.right, armFits.top, armFits.bot);

  // 枢纽相对轨道交叉口的外扩量（检测枢纽过胖压字）
  const hubOvershootPx = Math.round(Math.max(0, (hubW - Math.min(hRailH, vRailW) * 1.18) / 2));

  // 四象限净面积（实时计算占比）
  const nw = { x: padX, y: padY, w: Math.max(0, vRail.x - padX), h: Math.max(0, hRail.y - padY) };
  const ne = { x: vRail.x + vRail.w, y: padY, w: Math.max(0, w - padX - (vRail.x + vRail.w)), h: Math.max(0, hRail.y - padY) };
  const sw = { x: padX, y: hRail.y + hRail.h, w: Math.max(0, vRail.x - padX), h: Math.max(0, h - padY - (hRail.y + hRail.h)) };
  const se = { x: vRail.x + vRail.w, y: hRail.y + hRail.h, w: Math.max(0, w - padX - (vRail.x + vRail.w)), h: Math.max(0, h - padY - (hRail.y + hRail.h)) };
  const totalQ = Math.max(1, nw.w * nw.h + ne.w * ne.h + sw.w * sw.h + se.w * se.h);
  const quadPct = {
    nw: Math.round((nw.w * nw.h / totalQ) * 100),
    ne: Math.round((ne.w * ne.h / totalQ) * 100),
    sw: Math.round((sw.w * sw.h / totalQ) * 100),
    se: 0,
  };
  quadPct.se = Math.max(0, 100 - quadPct.nw - quadPct.ne - quadPct.sw);
  const minQuadPct = Math.min(quadPct.nw, quadPct.ne, quadPct.sw, quadPct.se);

  // ---- 四维双向单真源审计 ----
  const errors = [];

  // 1. 视觉重心 / 交汇枢纽
  const hubTooEdgeX = hubX < 0.32 || hubX > 0.68;
  const hubTooEdgeY = hubY < 0.32 || hubY > 0.70;
  const hubTooBig = hubScale > 1.38;
  const hubTooSmall = hubScale < 0.76 || state.unity === "washed";
  const armCrushed = minArmFit < 0.84;

  let anchorOk = true;
  let anchorTag = `X${Math.round(hubX * 100)}% Y${Math.round(hubY * 100)}%`;
  if (hubTooEdgeX || hubTooEdgeY || armCrushed) {
    anchorOk = false;
    const tightSide =
      hubX < 0.32 ? "左横臂" : hubX > 0.68 ? "右横臂" : hubY < 0.32 ? "上纵臂" : hubY > 0.70 ? "下纵臂" : "短轨臂";
    anchorTag = `${tightSide}挤窄`;
    errors.push({
      id: "edge",
      dim: "anchor",
      short: "交汇挤边",
      headline: `交汇点挤向边缘，${tightSide}被压到装不下完整词组`,
      why: `十字交汇中心目前停在 X ${Math.round(hubX * 100)}% · Y ${Math.round(hubY * 100)}%，最小象限仅剩 ${minQuadPct}%。${tightSide}可用宽度不足，文字被迫压缩叠挤，另一侧又留下空洞大片，视觉重心失去稳固锚定。`,
      fix: "在画布上把电光青「+」交汇点拖回 X 34%–66%、Y 34%–68% 的呼吸区间，让四条臂都有完整字距。",
    });
  } else if (hubTooBig) {
    anchorOk = false;
    anchorTag = `枢纽压字 +${hubOvershootPx}px`;
    errors.push({
      id: "hubBlot",
      dim: "anchor",
      short: "枢纽压字",
      headline: `中央「+」枢纽放大到 ${Math.round(hubScale * 100)}%，已经挤进相邻轨道字距`,
      why: `交汇枢纽的作用是做视觉转折锚点，不是把轨道截断成巨块。当前枢纽超出交叉口安全区约 ${hubOvershootPx}px，直接吞噬横纵两轴内侧呼吸缝，读者在切轨时会被厚重色块挡停。`,
      fix: "把「枢纽尺度」调回 85%–130% 区间，让「+」方块与横纵轨道内缘齐整咬合。",
    });
  } else if (hubTooSmall) {
    anchorOk = false;
    anchorTag = state.unity === "washed" ? "灰糊失锚" : "枢纽过小";
    errors.push({
      id: "hubLost",
      dim: "anchor",
      short: "交汇失锚",
      headline: state.unity === "washed" ? "去掉电光青锚点后，十字路口在灰雾里隐没了" : `交汇枢纽缩到 ${Math.round(hubScale * 100)}%，撑不起双轴视觉重心`,
      why: "双向排版里眼睛从横轴切换到纵轴，需要一个一眼锁定的中转点。失去高亮重心或枢纽缩得比轨道还窄时，视线会在交叉口直接滑过，两条路径脱节。",
      fix: "保持「同系共色」高亮电光青枢纽，并将枢纽尺度留在 85%–130%。",
    });
  }

  // 2. 横纵并置 / 明确主次（双向检测：五五打架 vs 副轴吞没）
  let domOk = true;
  let domTag = domDir === "horizontal" ? `横主 ${domRatio.toFixed(2)}×` : `纵主 ${(1 / domRatio).toFixed(2)}×`;
  if (domRatio >= 0.86 && domRatio <= 1.16) {
    domOk = false;
    domTag = `五五 ${domRatio.toFixed(2)}×`;
    errors.push({
      id: "tie",
      dim: "juxtapose",
      short: "五五打架",
      headline: `横纵轴权停在 ${domRatio.toFixed(2)}×，两条路径五五开互相抢入口`,
      why: "人眼进页的前半秒只能先顺着一条主路径扫入。现在横轨与纵轨一样宽、字一样重，横向建立框架和纵向深入主题同时喊话，读者站在十字路口不知先读哪一边。",
      fix: "直接点击画布上的「横向主轨」或「纵向轨柱」（或拖「主导轴权」滑杆），明确拉出 1.25×–2.10× 主次差。",
    });
  } else if (domRatio > 2.28 || domRatio < 0.44) {
    domOk = false;
    const weakAxis = domRatio > 2.28 ? "纵向副轴" : "横向副轴";
    domTag = `${weakAxis}吞没`;
    errors.push({
      id: "swallow",
      dim: "juxtapose",
      short: "副轴吞没",
      headline: `主轴过度膨胀（${domRatio > 1 ? domRatio.toFixed(2) : (1 / domRatio).toFixed(2)}×），${weakAxis}已被挤到难以成立`,
      why: `明确主次不等于消灭副轴。当主副轨权超过 2.3× 时，${weakAxis}缩成窄细饰条，原本「一版双向、信息共生」的对照结构直接退化回单向排版。`,
      fix: "把「主导轴权」收回适中档（1.25×–2.15×），让副轴保留稳定可读的轨道宽度。",
    });
  }

  // 3. 方向对比 / 节奏反差（双向检测：节奏拉平 vs 悬殊撕裂）
  let contrastOk = true;
  let contrastTag = `反差 ${rhythmContrast.toFixed(2)}×`;
  if (rhythmContrast < 1.32) {
    contrastOk = false;
    contrastTag = `拉平 ${rhythmContrast.toFixed(2)}×`;
    errors.push({
      id: "flat",
      dim: "contrast",
      short: "节奏拉平",
      headline: `横纵节奏反差仅 ${rhythmContrast.toFixed(2)}×，只是把同一种字转了 90°`,
      why: "如果横向与纵向采用几乎相同的字号、字重和字距，版面只是机械贴了个十字架，既没有横向铺陈的开阔感，也没有纵向深入的节制韵律。",
      fix: "向右推「节奏反差」滑杆到 1.40×–2.20×，拉开粗细、大小与疏密三层对比。",
    });
  } else if (rhythmContrast > 2.38) {
    contrastOk = false;
    contrastTag = `撕裂 ${rhythmContrast.toFixed(2)}×`;
    errors.push({
      id: "torn",
      dim: "contrast",
      short: "节奏撕裂",
      headline: `节奏反差拉到 ${rhythmContrast.toFixed(2)}×，次轴文字过小散碎`,
      why: "对比过头会让两条轨道脱离同一个阅读视距：读者看清主轴后必须凑近屏幕才辨认出副轴，双向自由切换的体验反而断裂。",
      fix: "将「节奏反差」收回到 1.40×–2.25× 区间，保证双轴在同一视距内都能顺畅辨认。",
    });
  }

  // 4. 信息切换 / 统一归属
  let unityOk = true;
  let unityTag = "同系统一";
  if (state.unity === "split") {
    unityOk = false;
    unityTag = "裂变杂拼";
    errors.push({
      id: "split",
      dim: "switching",
      short: "归属割裂",
      headline: "横纵两轴用了冲突配色与边框语言，像两张无关海报硬叠在一起",
      why: "海报底部的第三条要点明确写着「统一归属：色彩与元素保持整体一致性」。现在纵轴突然换上暖橘实心块，和横向的冷蓝黑线框彻底割裂，读者会误以为这是叠加上去的弹窗广告。",
      fix: "在底部控台把统一归属切回「同系共色」，用同一套曜黑、纯白与电光青语言把两轴焊成整体。",
    });
  } else if (state.unity === "washed") {
    unityOk = false;
    unityTag = "单色灰糊";
    errors.push({
      id: "washed",
      dim: "switching",
      short: "单色灰糊",
      headline: "全场退化成单调灰黑，双轴失去电光青引导与切换记号",
      why: "统一归属不是一团死灰。没有共同的强调色把横竖引导箭头与交汇枢纽串联起来，读者在横向浏览和纵向深入之间切换焦点时缺乏明确视觉暗号。",
      fix: "切换为「同系共色」，用电光青统一标注引导箭头、标签与交汇枢纽。",
    });
  }

  const dims = {
    juxtapose: { ok: domOk, tag: domTag },
    contrast: { ok: contrastOk, tag: contrastTag },
    switching: { ok: unityOk, tag: unityTag },
    anchor: { ok: anchorOk, tag: anchorTag },
  };
  const score = [domOk, contrastOk, unityOk, anchorOk].filter(Boolean).length;

  let diagnosis;
  if (score === 4) {
    const modeName =
      domDir === "vertical"
        ? "纵轴领衔共生"
        : Math.abs(hubX - 0.5) > 0.07 || Math.abs(hubY - 0.52) > 0.08
          ? "非对称平衡共生"
          : "原海报经典共生";
    diagnosis = {
      ok: true,
      short: `4/4 · ${modeName}`,
      headline: `双向系统成立：${domDir === "horizontal" ? "横轨铺陈框架" : "纵脊锚定主题"}，在「+」枢纽自由切换`,
      why: `交汇锚点稳落 X ${Math.round(hubX * 100)}% · Y ${Math.round(hubY * 100)}%（四象限 ${quadPct.nw}/${quadPct.ne}/${quadPct.sw}/${quadPct.se}%），主副轴权 ${domRatio >= 1 ? domRatio.toFixed(2) : (1 / domRatio).toFixed(2)}×、节奏反差 ${rhythmContrast.toFixed(2)}×，且共用一套电光青蓝图语法。按空格可实测视线在枢纽处 90° 平顺转轨。`,
      fix: "可以试着切到「纵轴领衔解」「非对称画报解」，或故意点下方反向试错看版面如何垮掉。",
    };
  } else {
    const first = errors[0];
    diagnosis = {
      ok: false,
      short: `${score}/4 · ${first.short}`,
      headline: first.headline,
      why: first.why,
      fix: first.fix,
    };
  }

  return {
    w,
    h,
    compact,
    spec,
    padX,
    padY,
    cx,
    cy,
    hubX,
    hubY,
    domRatio,
    domDir,
    rhythmContrast,
    hubScale,
    hRail,
    vRail,
    hub,
    leftArm,
    rightArm,
    topArm,
    botArm,
    hFontSize,
    vFontSize,
    hWeight,
    vWeight,
    hTracking,
    vStepRatio,
    scaleRatio,
    armFits,
    minArmFit,
    hubOvershootPx,
    quads: { nw, ne, sw, se },
    quadPct,
    minQuadPct,
    dims,
    errors,
    score,
    diagnosis,
  };
}

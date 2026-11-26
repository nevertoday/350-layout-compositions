// 339 比较幻灯片版式 — 单真源几何、规则核算与页面数据模型
// 画布绘制、顶栏四图例探针、白话诊单、数值指标全部读自 computeLayout() 的同一份输出。

export const PALETTE = {
  paper: "#F6EFE4",
  paperLight: "#FBF7F0",
  ink: "#0A0A08",
  inkSoft: "#4A4943",
  blue: "#1A4FE4",
  blueDeep: "#123EC2",
  blueTint: "#E7EEFC",
  green: "#22A37C",
  greenDeep: "#127154",
  greenTint: "#E4F3EC",
  sage: "#D7E3D1",
  sageLine: "#9DB597",
  danger: "#C62F24",
  dangerSoft: "#FBE9E7",
  slateA: "#7B828A",
  slateB: "#7E848C",
  clashA: "#C93326",
  clashB: "#D9661C",
  mutedA: "#6E757D",
};

export const DECKS = {
  poster: {
    id: "poster",
    label: "原海报 · 效率与质量",
    shortLabel: "原海报",
    optA: {
      badge: "方案 A",
      badgeEn: "OPTION A",
      focus: "强调效率",
      focusEn: "FOCUS ON EFFICIENCY",
      rows: [
        { dim: "速度", title: "处理速度快", en: "FAST PROCESSING", icon: "bolt" },
        { dim: "资源", title: "资源占用低", en: "LOW RESOURCE USAGE", icon: "bars" },
        { dim: "场景", title: "适合批量任务", en: "SUITABLE FOR BATCH TASKS", icon: "check" },
      ],
    },
    optB: {
      badge: "方案 B",
      badgeEn: "OPTION B",
      focus: "强调质量",
      focusEn: "FOCUS ON QUALITY",
      rows: [
        { dim: "速度", title: "输出更精确", en: "HIGHER ACCURACY", icon: "star" },
        { dim: "资源", title: "细节控制强", en: "STRONGER DETAIL CONTROL", icon: "rings" },
        { dim: "场景", title: "适合关键场景", en: "SUITABLE FOR CRITICAL SCENES", icon: "diamond" },
      ],
    },
    common: {
      title: "共性",
      en: "SIMILARITY",
      body: "都旨在解决问题、提升效果、服务目标受众。",
      bodyEn: "BOTH AIM TO SOLVE PROBLEMS, IMPROVE OUTCOMES, AND SERVE THE SAME AUDIENCE.",
    },
  },
  buildvsbuy: {
    id: "buildvsbuy",
    label: "产品选型 · 自研与采购",
    shortLabel: "自研与采购",
    optA: {
      badge: "方案 A",
      badgeEn: "IN-HOUSE",
      focus: "自研引擎",
      focusEn: "CUSTOM ENGINE",
      rows: [
        { dim: "周期", title: "首期研发 4 个月", en: "4-MONTH BUILD", icon: "bolt" },
        { dim: "成本", title: "长期边际成本低", en: "LOWER LONG-TERM COST", icon: "bars" },
        { dim: "边界", title: "深度适配核心流程", en: "DEEP WORKFLOW FIT", icon: "check" },
      ],
    },
    optB: {
      badge: "方案 B",
      badgeEn: "VENDOR SAAS",
      focus: "商业采购",
      focusEn: "TURNKEY VENDOR",
      rows: [
        { dim: "周期", title: "两周内快速上线", en: "2-WEEK LAUNCH", icon: "star" },
        { dim: "成本", title: "按年订阅可控", en: "PREDICTABLE ANNUAL FEE", icon: "rings" },
        { dim: "边界", title: "运维与合规托管", en: "MANAGED SLA & COMPLIANCE", icon: "diamond" },
      ],
    },
    common: {
      title: "共性",
      en: "SHARED BASELINE",
      body: "均须满足既有权限体系、数据落盘审计与 99.9% 可用性底线。",
      bodyEn: "BOTH MUST MEET EXISTING AUTH, DATA AUDIT, AND 99.9% UPTIME REQUIREMENTS.",
    },
  },
  uxflow: {
    id: "uxflow",
    label: "教学复盘 · 迭代前后",
    shortLabel: "迭代前后",
    optA: {
      badge: "旧版 A",
      badgeEn: "BEFORE",
      focus: "单页长表单",
      focusEn: "SINGLE LONG FORM",
      rows: [
        { dim: "步骤", title: "一次展开全部 14 项", en: "ALL 14 FIELDS AT ONCE", icon: "bolt" },
        { dim: "反馈", title: "提交后统一报错", en: "ERROR AFTER SUBMIT", icon: "bars" },
        { dim: "人群", title: "熟手录入一步到位", en: "FAST FOR POWER USERS", icon: "check" },
      ],
    },
    optB: {
      badge: "新版 B",
      badgeEn: "AFTER",
      focus: "分步引导流",
      focusEn: "GUIDED 3-STEP FLOW",
      rows: [
        { dim: "步骤", title: "拆成三步逐屏聚焦", en: "3 FOCUSED STAGES", icon: "star" },
        { dim: "反馈", title: "失焦即时提示纠错", en: "INLINE VALIDATION", icon: "rings" },
        { dim: "人群", title: "首次访客零门槛上手", en: "CLEAR FOR NEW VISITORS", icon: "diamond" },
      ],
    },
    common: {
      title: "共性",
      en: "UNCHANGED CORE",
      body: "最终采集同一组 14 项业务字段，后端校验与数据结构完全不变。",
      bodyEn: "COLLECTS THE EXACT SAME 14 FIELDS WITH ZERO BACKEND SCHEMA CHANGE.",
    },
  },
};

export const CODING_MODES = {
  same: {
    id: "same",
    label: "同码混糊",
    ok: false,
    short: "同码混糊",
    aBar: PALETTE.slateA,
    bBar: PALETTE.slateB,
    aShape: "square",
    bShape: "square",
    aFill: PALETTE.slateA,
    bFill: PALETTE.slateB,
    aStroke: null,
    bStroke: null,
    aTextOnPaper: "#51575E",
    bTextOnPaper: "#51575E",
  },
  classic: {
    id: "classic",
    label: "蓝圆 × 绿方",
    ok: true,
    short: "双码清晰",
    aBar: PALETTE.blue,
    bBar: PALETTE.green,
    aShape: "circle",
    bShape: "square",
    aFill: PALETTE.blue,
    bFill: PALETTE.green,
    aStroke: null,
    bStroke: null,
    aTextOnPaper: PALETTE.blueDeep,
    bTextOnPaper: PALETTE.greenDeep,
  },
  accessible: {
    id: "accessible",
    label: "蓝实圆 × 墨描方",
    ok: true,
    short: "色盲双形",
    aBar: PALETTE.blue,
    bBar: PALETTE.ink,
    aShape: "circle",
    bShape: "outlineSquare",
    aFill: PALETTE.blue,
    bFill: PALETTE.paper,
    aStroke: null,
    bStroke: PALETTE.ink,
    aTextOnPaper: PALETTE.blueDeep,
    bTextOnPaper: PALETTE.ink,
  },
  recommend: {
    id: "recommend",
    label: "弱灰旧 × 翠绿推",
    ok: true,
    short: "主推聚焦",
    aBar: PALETTE.mutedA,
    bBar: PALETTE.green,
    aShape: "circle",
    bShape: "square",
    aFill: PALETTE.mutedA,
    bFill: PALETTE.green,
    aStroke: null,
    bStroke: null,
    aTextOnPaper: "#4E545C",
    bTextOnPaper: PALETTE.greenDeep,
  },
  clash: {
    id: "clash",
    label: "双红互搏",
    ok: false,
    short: "双红告警",
    aBar: PALETTE.clashA,
    bBar: PALETTE.clashB,
    aShape: "square",
    bShape: "square",
    aFill: PALETTE.clashA,
    bFill: PALETTE.clashB,
    aStroke: null,
    bStroke: null,
    aTextOnPaper: "#A82419",
    bTextOnPaper: "#A4490E",
  },
};

export const AXIS_MODES = {
  none: { id: "none", label: "隐形无轴", ok: false, thickness: 0 },
  classic: { id: "classic", label: "细黑轴+节点", ok: true, thickness: 2 },
  dashed: { id: "dashed", label: "虚线轻轴", ok: true, thickness: 2 },
  wall: { id: "wall", label: "粗黑隔墙", ok: false, thickness: 22 },
};

export const COMMON_MODES = {
  hidden: { id: "hidden", label: "隐藏缺失", ok: false },
  band: { id: "band", label: "通栏共性带", ok: true },
  nested: { id: "nested", label: "塞进右栏", ok: false },
};

export const PRESETS = {
  broken: {
    label: "复原开场错态",
    rightOrder: [2, 0, 1],
    staggerY: 22,
    coupling: 0.78,
    coding: "same",
    axis: "none",
    common: "hidden",
  },
  classic: {
    label: "原海报经典解",
    rightOrder: [0, 1, 2],
    staggerY: 0,
    coupling: 0.36,
    coding: "classic",
    axis: "classic",
    common: "band",
  },
  accessible: {
    label: "色盲双形解",
    rightOrder: [0, 1, 2],
    staggerY: 0,
    coupling: 0.34,
    coding: "accessible",
    axis: "dashed",
    common: "band",
  },
  recommend: {
    label: "主推决断解",
    rightOrder: [0, 1, 2],
    staggerY: 0,
    coupling: 0.36,
    coding: "recommend",
    axis: "classic",
    common: "band",
  },
  errCross: {
    label: "试错：维度交叉",
    rightOrder: [1, 2, 0],
    staggerY: 16,
    coupling: 0.36,
    coding: "classic",
    axis: "classic",
    common: "band",
  },
  errCanyon: {
    label: "试错：断谷贴边",
    rightOrder: [0, 1, 2],
    staggerY: 0,
    coupling: 0.92,
    coding: "classic",
    axis: "classic",
    common: "band",
  },
  errWall: {
    label: "试错：粗墙撞轴",
    rightOrder: [0, 1, 2],
    staggerY: 0,
    coupling: 0.04,
    coding: "classic",
    axis: "wall",
    common: "band",
  },
  errBias: {
    label: "试错：双红偏袒",
    rightOrder: [0, 1, 2],
    staggerY: 0,
    coupling: 0.36,
    coding: "clash",
    axis: "classic",
    common: "nested",
  },
};

export function createInitialState() {
  return {
    deck: "poster",
    rightOrder: [...PRESETS.broken.rightOrder],
    staggerY: PRESETS.broken.staggerY,
    coupling: PRESETS.broken.coupling,
    coding: PRESETS.broken.coding,
    axis: PRESETS.broken.axis,
    common: PRESETS.broken.common,
    highlightLayer: null,
    showGuides: true,
    dragRow: null, // { slotIndex, yOffsetPx }
  };
}

// 2D 线段相交判定（不含端点重合），返回交点 { x, y } 或 null
function segmentIntersect(a, b, c, d) {
  const rX = b.x - a.x;
  const rY = b.y - a.y;
  const sX = d.x - c.x;
  const sY = d.y - c.y;
  const denom = rX * sY - rY * sX;
  if (Math.abs(denom) < 1e-6) return null;
  const qpX = c.x - a.x;
  const qpY = c.y - a.y;
  const t = (qpX * sY - qpY * sX) / denom;
  const u = (qpX * rY - qpY * rX) / denom;
  if (t > 0.03 && t < 0.97 && u > 0.03 && u < 0.97) {
    return { x: a.x + t * rX, y: a.y + t * rY };
  }
  return null;
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// 单真源几何与规则核算：输入 state 和逻辑画布尺寸，输出全部坐标 + 实测审计
export function computeLayout(state, W, H) {
  const deck = DECKS[state.deck] || DECKS.poster;
  const coding = CODING_MODES[state.coding] || CODING_MODES.classic;
  const axisMode = AXIS_MODES[state.axis] || AXIS_MODES.classic;
  const commonMode = COMMON_MODES[state.common] || COMMON_MODES.band;
  const compact = W < 560;
  const shortH = H < 380;

  const padX = compact ? Math.round(W * 0.03) : Math.round(W * 0.042);
  const topY = shortH ? 10 : compact ? 12 : 18;
  const cx = W / 2;

  // 顶部蓝/绿方案条 + 中央黑圆 VS
  const barH = shortH ? 34 : compact ? 40 : 52;
  const vsR = shortH ? 16 : compact ? 19 : 25;
  const barGapHalf = vsR + (compact || shortH ? 8 : 18);
  const barW = Math.max(80, cx - padX - barGapHalf);
  const barA = { x: padX, y: topY, w: barW, h: barH };
  const barB = { x: cx + barGapHalf, y: topY, w: barW, h: barH };
  const vs = { x: cx, y: topY + barH / 2, r: vsR };

  // 双形符号（蓝圆 vs 绿方）+ 阵营小标
  const shapeR = shortH ? 14 : compact ? 18 : 28;
  const shapeY = topY + barH + (shortH ? 20 : compact ? 26 : 40);
  const colCenterA = barA.x + barA.w / 2;
  const colCenterB = barB.x + barB.w / 2;
  const subY = shapeY + shapeR + (shortH ? 11 : compact ? 15 : 22);
  const underlineY = subY + (shortH ? 18 : compact ? 20 : 28);

  // 底部共性带区域预留
  const commonH = shortH ? 38 : compact ? 54 : 66;
  const bottomPad = shortH ? 8 : compact ? 10 : 16;
  const commonY = H - bottomPad - commonH;
  const commonRect = { x: padX, y: commonY, w: W - padX * 2, h: commonH };

  // 中段 3 行对读区：横拖 coupling 控制两栏围绕中央比较轴的眼动跨度
  const rowsTop = underlineY + (shortH ? 12 : compact ? 15 : 20);
  const rowsBottom = commonY - (shortH ? 10 : compact ? 14 : 24);
  const rowsAvailH = Math.max(96, rowsBottom - rowsTop);
  const rowH = shortH
    ? clamp(Math.floor((rowsAvailH - 12) / 3), 28, 34)
    : clamp(Math.floor((rowsAvailH - 16) / 3.15), compact ? 36 : 42, compact ? 44 : 54);
  const rowStep = Math.max(rowH + 4, (rowsAvailH - rowH) / 2);

  // coupling 0..1 映射为中央跨轴空隙占比（每栏宽度严格相等，绝不做 338 的左右不等宽）
  const minCenterSpan = compact ? W * 0.04 : W * 0.035;
  const maxCenterSpan = compact ? W * 0.28 : W * 0.56;
  const centerSpan = minCenterSpan + clamp(state.coupling, 0, 1) * (maxCenterSpan - minCenterSpan);
  const halfSpan = centerSpan / 2;
  const maxColW = cx - padX - minCenterSpan / 2;
  const rowW = clamp(
    compact ? Math.min(cx - padX - halfSpan, W * 0.44) : Math.min(cx - padX - halfSpan, W * 0.335),
    compact ? 126 : 176,
    maxColW
  );

  // 左右行卡沿中央对称展开：coupling 越大，左右行卡越向两侧外沿退散
  const leftX = clamp(cx - halfSpan - rowW, padX, cx - rowW - 2);
  const rightX = clamp(cx + halfSpan, cx + 2, W - padX - rowW);

  const leftRows = deck.optA.rows.map((item, i) => {
    const y = rowsTop + i * rowStep;
    return {
      slot: i,
      itemIdx: i,
      item,
      x: leftX,
      y,
      w: rowW,
      h: rowH,
      cy: y + rowH / 2,
      anchorX: leftX + rowW,
    };
  });

  // 纵向错牙限制在安全像素内，确保在横屏/窄屏下绝不压撞底带或相邻行
  const maxStagger = shortH ? 10 : Math.min(24, Math.max(12, (rowsAvailH - rowH * 3) * 0.55 + 14));
  const effStagger = clamp(state.staggerY, -maxStagger, maxStagger);

  const rightRows = state.rightOrder.map((itemIdx, slot) => {
    const item = deck.optB.rows[itemIdx];
    const baseY = rowsTop + slot * rowStep + effStagger;
    const isDragging = state.dragRow && state.dragRow.slot === slot;
    const y = isDragging
      ? clamp(baseY + state.dragRow.dy, rowsTop - 10, rowsBottom - rowH + 8)
      : clamp(baseY, rowsTop - 10, rowsBottom - rowH + 8);
    return {
      slot,
      itemIdx,
      item,
      x: rightX,
      y,
      w: rowW,
      h: rowH,
      cy: y + rowH / 2,
      anchorX: rightX,
      isDragging,
    };
  });

  // 中央比较轴（由 VS 圆下沿贯通到第 3 行下方，带向下箭头）
  const axisY1 = vs.y + vs.r;
  const axisY2 = Math.min(commonY - (compact ? 8 : 12), rowsBottom + (compact ? 4 : 8));

  // 逐维度建立视线匹配连线（左 i → 右侧同维度 itemIdx === i）
  const links = leftRows.map((lRow) => {
    const rRow = rightRows.find((r) => r.itemIdx === lRow.itemIdx) || rightRows[lRow.slot];
    const x1 = lRow.anchorX + 6;
    const y1 = lRow.cy;
    const x2 = rRow.anchorX - 6;
    const y2 = rRow.cy;
    const dyPx = rRow.cy - lRow.cy;
    const dxPx = Math.max(1, x2 - x1);
    const angleDeg = (Math.atan2(dyPx, dxPx) * 180) / Math.PI;
    const lenPx = Math.hypot(dxPx, dyPx);
    const midY = (y1 + y2) / 2;
    const slotMatch = lRow.slot === rRow.slot;
    const horizontalOk = slotMatch && Math.abs(dyPx) <= 4.5;
    return {
      dimIdx: lRow.itemIdx,
      dim: lRow.item.dim,
      x1,
      y1,
      x2,
      y2,
      midY,
      dyPx,
      dxPx,
      angleDeg,
      lenPx,
      slotMatch,
      horizontalOk,
    };
  });

  // 实测交叉交点
  const crossings = [];
  for (let i = 0; i < links.length; i++) {
    for (let j = i + 1; j < links.length; j++) {
      const pt = segmentIntersect(
        { x: links[i].x1, y: links[i].y1 },
        { x: links[i].x2, y: links[i].y2 },
        { x: links[j].x1, y: links[j].y1 },
        { x: links[j].x2, y: links[j].y2 }
      );
      if (pt) crossings.push(pt);
    }
  }

  // 实测关键几何指标（单真源！）
  const jumpPx = Math.round(rightX - (leftX + rowW));
  const jumpRatio = jumpPx / W;
  const jumpPct = Math.round(jumpRatio * 100);
  const axisClearancePx = Math.round((jumpPx - axisMode.thickness) / 2);
  const orderMatchedCount = leftRows.filter((l) => {
    const r = rightRows[l.slot];
    return r && r.itemIdx === l.itemIdx;
  }).length;
  const maxDyPx = Math.round(Math.max(...links.map((lk) => Math.abs(lk.dyPx))));
  const avgDyPx = Math.round(links.reduce((s, lk) => s + lk.dyPx, 0) / links.length);
  const scanPathPx = Math.round(
    links.reduce((s, lk) => s + lk.lenPx, 0) +
      Math.abs(leftRows[2].cy - leftRows[0].cy)
  );

  // --- 四大核心规则实测核算 ---
  // 1) 差异（形色双码）
  const diffOk = coding.ok;
  const diffBadge = coding.short;

  // 2) 视线匹配（同维顺序 + 水平基线对齐）
  const orderOk = orderMatchedCount === 3 && crossings.length === 0;
  const staggerOk = Math.abs(effStagger) <= 4;
  const alignOk = orderOk && staggerOk;
  const alignBadge = !orderOk
    ? `交叉 ${Math.max(1, crossings.length)} 处`
    : !staggerOk
      ? `错牙 ${avgDyPx >= 0 ? "+" : ""}${avgDyPx}px`
      : "3/3 齐平";

  // 3) 比较轴（轴线形态 + 眼动耦合跨度防断谷/防撞轴）
  const maxJumpRatio = compact ? 0.25 : 0.43;
  const minClearance = compact ? 9 : 18;
  const spanTooWide = jumpRatio > maxJumpRatio;
  const spanTooTight = axisClearancePx < minClearance;
  const axisOk = axisMode.ok && !spanTooWide && !spanTooTight;
  let axisBadge = "轴线导读";
  if (state.axis === "none") axisBadge = "无轴断联";
  else if (state.axis === "wall") axisBadge = "粗墙割裂";
  else if (spanTooTight) axisBadge = `撞轴 ${axisClearancePx}px`;
  else if (spanTooWide) axisBadge = `断谷 ${jumpPct}%`;

  // 4) 共性（底部通栏收敛）
  const commonOk = commonMode.ok;
  const commonBadge =
    state.common === "hidden" ? "缺失共性" : state.common === "nested" ? "偏袒右栏" : "通栏收敛";

  const score = [diffOk, alignOk, axisOk, commonOk].filter(Boolean).length;

  // 诊断优先级：找出最急迫的一条错态，说出「为什么」和「怎么改」
  let code = "PASS";
  let shortTag = `4/4 · 对读成立`;
  let headline = "比较轴、视线匹配与共性底座全部就位";
  let reason =
    "蓝圆与绿方在第一眼就划清两套阵营，中央比较轴把三条同维度指标锁在同一水平线上，观众只需横向跳扫三次就能判出差异，再落到底部鼠尾草共性带确认共同前提。";
  let actionTip =
    "可以试试切换「色盲双形解」「主推决断解」，或故意点「试错」按钮看看断谷与粗墙如何毁掉对读。";
  let fixLabel = "切到色盲双形解";
  let fixKind = "accessible";

  if (!orderOk) {
    code = "ROW_CROSSED";
    shortTag = `${score}/4 · 交叉 ${Math.max(1, crossings.length)} 处`;
    headline = `同维度行序错位，视线连线在轴心打结 ${Math.max(1, crossings.length)} 处`;
    reason =
      "比较页最忌「鸡同鸭讲」。右栏条目与左栏不是按同一维度逐行对应，观众扫完左侧「处理速度快」后，眼睛被迫斜穿中轴往下翻找「输出更精确」，工作记忆在反复折返里立刻耗尽。";
    actionTip =
      "直接上下拖动画布右侧行卡（或轻点错位行卡）换序配对，把速度对速度、资源对资源、场景对场景，或点下方按钮一键归位。";
    fixLabel = "一键校准全部错态";
    fixKind = "classic";
  } else if (!staggerOk) {
    code = "ROW_STAGGERED";
    shortTag = `${score}/4 · 错牙 ${avgDyPx >= 0 ? "+" : ""}${avgDyPx}px`;
    headline = `右侧整列纵向错牙 ${Math.abs(avgDyPx)}px，水平视线被迫斜跳`;
    reason =
      "虽然维度顺序对了，但左右行高基准没有锁平。原海报强调「保持元素高度对齐，形成清晰的视觉对应关系」——超过 4px 的落差就会让虚线倾斜，观众扫到对面时容易串到下一行。";
    actionTip = "把「右栏纵差 ΔY」滑杆拉回 0px，或按键盘 ↑ / ↓ 键微调齐平。";
    fixLabel = "把右栏基准对齐到 0px";
    fixKind = "fixStagger";
  } else if (state.axis === "none") {
    code = "AXIS_NONE";
    shortTag = `${score}/4 · 无轴断联`;
    headline = "缺少中央比较轴，两栏退化成互不相干的两张清单";
    reason =
      "没有垂直贯穿的比较轴与节点锚定，两列文字各自孤立。观众需要自己在大脑里拼凑「左边这一条到底在和右边哪一条比」，对比逻辑瞬间散架。";
    actionTip = "直接点击画布正中的 VS 区域，或在控制栏切回「细黑轴+节点」/「虚线轻轴」。";
    fixLabel = "补回中央细黑比较轴";
    fixKind = "fixAxis";
  } else if (state.axis === "wall") {
    code = "AXIS_WALL";
    shortTag = `${score}/4 · 粗墙割裂`;
    headline = `中央 ${axisMode.thickness}px 粗黑墙把一页劈成两半，拦断了水平视线`;
    reason =
      "比较轴是「导读轨道」而不是「柏林墙」。过粗的实心黑带会在视觉上形成强硬屏障，眼睛撞墙后更倾向于先把左半边从头读到底再看右半边，失去逐行横扫的意义。";
    actionTip = "点击中轴或切换为 2px 细黑轴 / 虚线轻轴，让虚线节点顺畅穿过中线。";
    fixLabel = "把粗墙收细为 2px 比较轴";
    fixKind = "fixAxis";
  } else if (spanTooTight) {
    code = "SPAN_TOO_TIGHT";
    shortTag = `${score}/4 · 撞轴 ${axisClearancePx}px`;
    headline = `两栏离比较轴只剩 ${axisClearancePx}px，左右文字几乎撞成一团`;
    reason =
      "为了缩短横跳距离把两栏硬贴到中轴上，结果虚线引导段彻底消失，左右文字在视觉中心互相粘连，分不清哪行属于方案 A、哪行属于方案 B。";
    actionTip = "在画布上向右横向拖动，给中央比较轴两侧留出清晰的虚线呼吸段。";
    fixLabel = "拉开至舒适眼动跨度";
    fixKind = "fixSpan";
  } else if (spanTooWide) {
    code = "SPAN_TOO_WIDE";
    shortTag = `${score}/4 · 断谷 ${jumpPct}%`;
    headline = `两栏被推向两侧外沿，水平跳距拉到画宽 ${jumpPct}%（${jumpPx}px）`;
    reason =
      "两列贴着画框边缘排布会在中间挖出一道空白峡谷。根据迈耶的空间邻近原则，对应信息隔得越远，眼睛横向扫描越容易中途迷失，必须放慢速度重新找行。";
    actionTip = "在画布上向左横向拖动，把两栏向中央比较轴收拢到 18%–36% 跨度区。";
    fixLabel = "收拢两栏至舒适跳距";
    fixKind = "fixSpan";
  } else if (!diffOk) {
    code = state.coding === "clash" ? "CODING_CLASH" : "CODING_SAME";
    shortTag = `${score}/4 · ${diffBadge}`;
    headline =
      state.coding === "clash"
        ? "两侧同用高饱和暖红告警色，页面像「两个报错在打架」"
        : "方案 A 与方案 B 同色同形，第一眼分不清谁是谁";
    reason =
      state.coding === "clash"
        ? "比较页追求冷静可判的理性对比。红配橙都是高唤醒警示色，同时大面积铺在两侧会抢光注意力，观众看不出客观权衡，只感到焦躁。"
        : "差异首先要靠视觉编码在 0.5 秒内立住。如果两个阵营都用一样的灰方块，观众必须把字全部读完才能分辨这是两套互斥方案。";
    actionTip =
      "点击画布顶部的方案条，切换成原海报的「蓝圆 × 绿方」或色盲友好的「蓝实圆 × 墨描方」。";
    fixLabel = "启用蓝圆 × 绿方形色双码";
    fixKind = "fixCoding";
  } else if (!commonOk) {
    code = state.common === "nested" ? "COMMON_LEAK" : "COMMON_HIDDEN";
    shortTag = `${score}/4 · ${commonBadge}`;
    headline =
      state.common === "nested"
        ? "共性文字被塞进了方案 B 一侧，暗中破坏了对等客观性"
        : "底部缺少「共性」收敛带，整页只剩对立、没有决策共识";
    reason =
      state.common === "nested"
        ? "把两者的共同前提缩进右栏角落，会利用格式塔「共同区域」原理让观众误以为只有方案 B 满足目标，悄悄把比较页变成了偏袒页。"
        : "原海报强调「突出差异，揭示共性」。如果不交待两套方案共同解决的问题和守住的底线，讨论很容易陷入无休止的细枝末节拉扯，难以收口决策。";
    actionTip = "点击画布底部提示区，或把「共性底带」切为通栏鼠尾草共性带。";
    fixLabel = "补回底部通栏共性带";
    fixKind = "fixCommon";
  }

  return {
    W,
    H,
    compact,
    shortH,
    padX,
    cx,
    deck,
    coding,
    axisMode,
    commonMode,
    barA,
    barB,
    vs,
    shapeA: { x: colCenterA, y: shapeY, r: shapeR },
    shapeB: { x: colCenterB, y: shapeY, r: shapeR },
    subA: { x: colCenterA, y: subY, underlineY },
    subB: { x: colCenterB, y: subY, underlineY },
    axis: { x: cx, y1: axisY1, y2: axisY2, thickness: axisMode.thickness },
    leftRows,
    rightRows,
    links,
    crossings,
    commonRect,
    rowsTop,
    rowsBottom,
    rowStep,
    rowH,
    effStagger,
    metrics: {
      matchedRows: orderMatchedCount,
      crossingsCount: crossings.length,
      staggerPx: Math.round(effStagger),
      maxDyPx,
      jumpPx,
      jumpPct,
      axisClearancePx,
      scanPathPx,
    },
    probes: {
      diff: { ok: diffOk, badge: diffBadge },
      common: { ok: commonOk, badge: commonBadge },
      axis: { ok: axisOk, badge: axisBadge },
      align: { ok: alignOk, badge: alignBadge },
    },
    audit: {
      code,
      score,
      total: 4,
      ok: score === 4,
      shortTag,
      headline,
      reason,
      actionTip,
      fixLabel,
      fixKind,
    },
  };
}

// ---------- 第 01 节：眼动回溯对比实验数据 ----------
export const SCAN_TASKS = [
  {
    id: "speed",
    question: "问题 1：谁交付更快，代价是什么？",
    targetRow: 0,
    serial: {
      hops: 4,
      pages: 2,
      verdict: "来回翻页 2 次、眼睛重定位 4 次，凭短时记忆硬拼差异。",
    },
    scrambled: {
      hops: 3,
      pages: 1,
      verdict: "同页但维度错序，眼睛斜穿全屏在右侧 3 行里逐条排查。",
    },
    aligned: {
      hops: 1,
      pages: 1,
      verdict: "沿第 1 行水平虚线 1 次短跳直达对岸，差值瞬间落袋。",
    },
  },
  {
    id: "resource",
    question: "问题 2：资源控制和细节精度怎么取舍？",
    targetRow: 1,
    serial: {
      hops: 5,
      pages: 2,
      verdict: "翻到 B 页时已忘掉 A 页第 2 条原话，不得不倒回再核对。",
    },
    scrambled: {
      hops: 3,
      pages: 1,
      verdict: "左栏中段对应的却是右栏底行，视线被迫拉出大斜角回扫。",
    },
    aligned: {
      hops: 1,
      pages: 1,
      verdict: "中轴第 2 枚黑圆节点把左右两行锁死，一次横扫即可权衡。",
    },
  },
  {
    id: "common",
    question: "问题 3：两套方案共同守住什么前提？",
    targetRow: 2,
    serial: {
      hops: 4,
      pages: 2,
      verdict: "共同前提被拆散在两页小字里，观众难以确认它们可比。",
    },
    scrambled: {
      hops: 2,
      pages: 1,
      verdict: "上方交叉连线已消耗注意力，容易忽略底部的共同目标。",
    },
    aligned: {
      hops: 1,
      pages: 1,
      verdict: "比较轴向下箭头自然引流到底部鼠尾草共性带，一锤收口。",
    },
  },
];

// ---------- 第 02 节：海报四层 X 光透视数据 ----------
export const XRAY_LAYERS = [
  {
    id: "coding",
    key: "差异 DIFFERENCE",
    color: PALETTE.blue,
    posterQuote: "方案 A（蓝圆·强调效率） VS 方案 B（绿方·强调质量）",
    withMsg: "色相（蓝/绿）叠加形状（圆/方）双重编码，0.5 秒划清阵营，即使投影褪色或色弱观众也能凭圆与方立刻分辨。",
    withoutMsg: "剥离形色双码后，两列视觉基因完全雷同，观众必须先读完标题小字才能意识到这是两套竞争方案。",
  },
  {
    id: "axis",
    key: "比较轴 COMPARISON AXIS",
    color: PALETTE.ink,
    posterQuote: "轴线引导阅读，帮助观众快速理解对比逻辑。",
    withMsg: "中央黑色 VS 圆徽引出垂直实线，三枚实心节点按序下挂，底部箭头顺势指向共性带，形成清晰纵向导轨。",
    withoutMsg: "抽走比较轴后，左右两栏在中间只剩无组织的空白带，页面退化成普通双栏清单，对比关系被大幅削弱。",
  },
  {
    id: "align",
    key: "视线匹配 ALIGNMENT",
    color: PALETTE.inkSoft,
    posterQuote: "保持元素高度对齐，形成清晰的视觉对应关系。",
    withMsg: "每对可对齐维度共享完全一致的 Y 坐标，配合细虚线穿过中轴节点，眼睛像沿铁轨横移一样零阻力对读。",
    withoutMsg: "拆掉水平匹配与基线锁定后，各行高低参差，跨栏跳读频频串行，大脑把算力全花在「找哪一行对应哪一行」。",
  },
  {
    id: "common",
    key: "共性 SIMILARITY",
    color: PALETTE.greenDeep,
    posterQuote: "都旨在解决问题、提升效果、服务目标受众。",
    withMsg: "通栏淡鼠尾草色带借「共同区域」原理将左右两列托在同一底座上，左侧黑白交叠双圆一目了然点破共同前提。",
    withoutMsg: "拿掉底部共性带后，页面只剩硬碰硬的对立项，缺乏共同评审标准，汇报现场极易陷入各说各话。",
  },
];

// ---------- 第 03 节：核实历史里程碑与同小类链接 ----------
export const MILESTONES = [
  {
    year: "1990",
    who: "Edward R. Tufte ·《Envisioning Information》",
    place: "Graphics Press",
    tag: "同视野对比",
    wireframe: "multiples",
    summary:
      "塔夫特在书中写下信息设计最著名的追问：“At the heart of quantitative reasoning is a single question: Compared to what?”（量化推理的核心只有一个问题：与什么相比？）。他提倡把对比对象放进同一视野跨度内并置，拒绝让读者靠翻页记忆对比。",
  },
  {
    year: "1992",
    who: "Stephen E. Palmer · 共同区域分组原理",
    place: "Cognitive Psychology, 24(3), 436–447",
    tag: "共性底带依据",
    wireframe: "common",
    summary:
      "帕尔默通过实验提出新的格式塔组织原则——「共同区域」（Common Region）：凡被包裹在同一闭合色块或框线内的元素，会被知觉优先归为一组，效力甚至压过空间距离。339 海报底部横跨双栏的鼠尾草「共性」带正是把分立的 A、B 重新收束进同一决策框架。",
  },
  {
    year: "1994 / 1997",
    who: "Dedre Gentner & Arthur B. Markman · 结构对齐理论",
    place: "Psychological Science 1994 · American Psychologist 1997",
    tag: "可对齐差异",
    wireframe: "align",
    summary:
      "根特纳与马克曼在 1994 年论文《No Difference Without Similarity》中证明：人类识别差异的前提是先完成结构对齐。只有建立共同维度槽位，差异才会变成「可对齐差异」（alignable differences）；否则左右两边只是互不搭界的特征噪音。",
  },
  {
    year: "2006–2008",
    who: "ECMA-376 / ISO 29500 与 Nancy Duarte《slide:ology》",
    place: "PresentationML twoTxTwoObj · O'Reilly Media 2008",
    tag: "幻灯片母版定型",
    wireframe: "ooxml",
    summary:
      "2006 年 12 月发布的 ECMA-376（2008 年批准为 ISO/IEC 29500）在幻灯片版式枚举 ST_SlideLayoutType 中，将「比较」版式正式定义为 twoTxTwoObj（双子标题 + 双内容区），从母版底层与 338 的 twoObj（仅双内容区）划清界限；同年 Nancy Duarte 在《slide:ology》中亦强调以清晰视觉隐喻与严格网格对齐呈现对比，取代密集文字表。",
  },
];

export const SIBLING_SLIDES = [
  { id: "335", name: "标题幻灯片", role: "整场演讲的封面开场与主副标题定调。" },
  { id: "336", name: "标题和内容", role: "最通用的单主区陈述页，适合单一论点展开。" },
  { id: "337", name: "节标题", role: "章节切换的视觉停顿页，负责清空认知负荷。" },
  { id: "338", name: "两项内容", role: "OOXML 为 twoObj，并放两块独立内容（如图配文），不强加逐行对照轴。" },
  { id: "340", name: "仅标题", role: "顶置标题并把下方整块画布完全交给自由图表或大图。" },
  { id: "341", name: "空白幻灯片", role: "撤除所有默认占位符，适合全出血视觉或定制构图。" },
  { id: "342", name: "内容与标题说明", role: "一侧放说明文字、一侧放大体量内容块的主从解说页。" },
  { id: "343", name: "图片与标题说明", role: "以高占比影像为主角、辅以精简图注的视觉叙事页。" },
];

// ---------- 第 04 节：场景分诊逻辑 ----------
export function triageScenario({ count, dims, relation }) {
  if (relation === "sequence") {
    return {
      verdict: "别用 339 · 改用时间轴 / 流程图",
      tone: "warn",
      badge: "因果时序",
      why: "你的内容存在明确先后步骤或因果演进。左右对称的比较轴会把「先→后」抹平成静态并列，观众会误以为两者是二选一替代方案。",
      layoutType: "timeline",
      tip: "建议改为横向 3–4 步流程箭头，或用前/后两组指标明确标注演进方向。",
    };
  }
  if (relation === "trend") {
    return {
      verdict: "别用 339 · 改用同轴折线图 / 柱图",
      tone: "warn",
      badge: "连续数值",
      why: "连续多期数值或分布差异用文字双栏写出来既臃肿又掩盖量级倍率，远不如共享同一坐标轴的折线或分组柱图一眼见高下。",
      layoutType: "chart",
      tip: "可借助 340「仅标题幻灯片版式」把下方整屏留给单张清晰数据图。",
    };
  }
  if (relation === "pair") {
    return {
      verdict: "别硬套 VS · 改用 338 两项内容",
      tone: "warn",
      badge: "非同维并列",
      why: "左图右结论、背景加行动计划并不是同一维度上的两套竞品。硬加中央 VS 比较轴会制造虚假对立，让观众困惑为什么它们在互相 PK。",
      layoutType: "twoObj",
      tip: "改用 338 两项内容版式（twoObj），通过明暗或面积主次建立互补关系。",
    };
  }
  if (count >= 4 || dims >= 6) {
    return {
      verdict: "超载预警 · 改用对比矩阵或拆页",
      tone: "warn",
      badge: `${count} 对象 × ${dims} 维度`,
      why: `当前要同时对照 ${count} 个对象、${dims} 条维度。超过「2–3 个对象、3–5 条核心维度」（演示经验区间）后，幻灯片字号被迫缩小，水平视线匹配会迅速失焦。`,
      layoutType: "matrix",
      tip: "建议精简到最决定胜负的 3–4 个维度，或改用高亮关键列的对比矩阵表并拆分多页。",
    };
  }
  if (count === 3) {
    return {
      verdict: "谨慎可用 · 三栏轻量化变体",
      tone: "caution",
      badge: `3 对象 × ${dims} 维度`,
      why: `3 个对象配 ${dims} 条简短维度仍在单页视距上限内，但中央单条 VS 轴不再适用，需改为两条等距细竖线，并把每条文案压在 8 字以内（经验值）。`,
      layoutType: "threeCol",
      tip: "若其中一栏是推荐方案，可用翠绿实底聚焦它，其余两栏退为轻描边。",
    };
  }
  return {
    verdict: "高度契合 · 直接用 339 比较幻灯片版式",
    tone: "good",
    badge: `${count} 对象 × ${dims} 维度`,
    why: `2 个明确对标方案配 ${dims} 条可对齐维度，恰好落在比较幻灯片版式的黄金区间：形色双码立辨阵营，中央比较轴与水平虚线让观众 3 秒扫清差异，底部通栏共性带完成决策收口。`,
    layoutType: "comp339",
    tip: "记得确保左右对应行字数尽量接近，避免一侧折成 3 行把下方虚线撑斜。",
  };
}

// ---------- 第 05 节：四类常见翻车病历 ----------
export const CLINIC_CASES = [
  {
    id: "apples",
    title: "鸡同鸭讲：左右维度根本没对齐",
    badTag: "未对齐特征",
    goodTag: "同维逐行对应",
    badNote: "左侧谈「速度 / 内存 / 并发」，右侧却聊「品牌 / 售后 / 界面」——看似工整对开，实则无法比较。",
    goodNote: "先抽出 3 个共同评审维度（效率、精度、适用面），让左右每行回答同一个问题，差异立刻可判。",
  },
  {
    id: "nobase",
    title: "只踩不托：漏掉共性变成拉踩页",
    badTag: "失衡拉踩",
    goodTag: "共性底座收口",
    badNote: "左边全是缺点红叉、右边全是优点绿勾，没有共同前提，高层听众反而会怀疑汇报夹带私货。",
    goodNote: "客观呈现两边各自长板，再在底部通栏共性带交代两者共同目标，克制的表达更有说服力。",
  },
  {
    id: "coloronly",
    title: "唯色辨别：灰阶或褪色投影直接糊成一片",
    badTag: "单靠颜色区分",
    goodTag: "色相 + 形状双码",
    badNote: "只靠红绿或蓝绿两块同形色条区分阵营，在低对比会议室投影或色弱观众眼中几乎同灰难辨。",
    goodNote: "像 339 原海报一样叠加「蓝圆 vs 绿方」双重编码——试着打开下方的「灰阶投影模拟」，双形依然一眼可辨。",
  },
  {
    id: "textwall",
    title: "字墙压斜：一侧 1 行、另一侧 4 行",
    badTag: "行高失控",
    goodTag: "等长提炼锁基线",
    badNote: "左栏每条写 6 个字、右栏粘进整段说明，第 2、3 条水平匹配线被硬生生撑歪，彻底破坏平行节奏。",
    goodNote: "把每条要点压成「4–8 字结论短语 + 必要副标」，口述细节留给演讲者，让三道水平视线严丝齐平。",
  },
];

// ---------- 第 06 节：小练习四选一（严格只差一个空间变量，中性标签） ----------
export const QUIZ_ITEMS = [
  {
    id: "A",
    label: "A · 构图甲",
    correct: false,
    varChanged: "右栏维度行序打乱",
    feedback:
      "构图甲保留了蓝圆/绿方双码、中央比较轴和底部共性带，但右侧 3 条维度的排列顺序与左侧不一致，导致水平视线匹配线在轴心斜向交叉，观众必须逐条来回核对，增加了不必要的搜索负担。",
  },
  {
    id: "B",
    label: "B · 构图乙",
    correct: true,
    varChanged: "四要素完整成立",
    feedback:
      "选对了！构图乙同时守住了比较幻灯片版式的四根骨架：蓝圆/绿方形色双码瞬间划清阵营，中央细黑 VS 比较轴与黑圆节点建立纵向阅读轨，三对同维度条目严丝水平齐平且虚线直连，底部通栏鼠尾草共性带托出共同目标，上台即可一扫看懂。",
  },
  {
    id: "C",
    label: "C · 构图丙",
    correct: false,
    varChanged: "撤掉比较轴且两栏贴外缘",
    feedback:
      "构图丙虽然维度顺序正确、也有共性带，但撤掉了中央比较轴，并把两栏推到幻灯片最左右外沿，中间留出大片空白断谷。眼睛横向跨越过宽的空白区时容易丢行，违背了空间邻近与比较轴导读原则。",
  },
  {
    id: "D",
    label: "D · 构图丁",
    correct: false,
    varChanged: "取消通栏共性带并塞进右栏",
    feedback:
      "构图丁删去了横跨双栏的底部共性带，把共同目标缩成小字塞进右侧方案 B 底部。共同区域分组会让观众下意识觉得该目标只属于方案 B，既丢失了全局收口，又暗中破坏了比较页的对等客观性。",
  },
];

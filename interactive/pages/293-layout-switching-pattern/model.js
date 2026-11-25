// 293 布局切换模式 — 单真源几何模型
// 所有双端矩形、最小卡宽、面积层级比、阅读/DOM 逆序数、CSS grid-template-areas 与结构研判全部由此文件统一计算。

export const PALETTE = {
  cream: "#FAF2E9",
  creamCard: "#FAF2E7",
  creamLight: "#FFFBF6",
  blush: "#F5C3D4",
  blushPale: "#FBEBF1",
  rose: "#EF649A",
  roseTab: "#F1699D",
  roseBanner: "#CF2F70",
  roseDeep: "#A61B55",
  roseBright: "#F68CB4",
  ink: "#0D0B0D",
  inkSoft: "#3B3439",
  inkDarkRoom: "#110E11",
  inkCard: "#1D171C",
  line: "#C9BFB6",
  lineDark: "#382D35",
  pass: "#0E6648",
  passDark: "#6EE7B7",
  err: "#AD1A35",
  errDark: "#FF8599",
};

export const SUBJECTS = {
  poster: {
    label: "原海报 · 几何模块",
    short: "原海报几何",
    modules: [
      { id: 0, code: "01", shape: "circle", title: "核心模块", sub: "PRIMARY BLOCK" },
      { id: 1, code: "02", shape: "square", title: "并列主卡", sub: "FEATURE CARD" },
      { id: 2, code: "03", shape: "triangle", title: "辅助对照", sub: "SIDE CONTEXT" },
      { id: 3, code: "04", shape: "hexagon", title: "收束底条", sub: "FOOTER STRIP" },
    ],
  },
  editorial: {
    label: "资讯首页 · 头条重组",
    short: "资讯首页",
    modules: [
      { id: 0, code: "01", shape: "circle", title: "封面深度", sub: "COVER STORY" },
      { id: 1, code: "02", shape: "square", title: "当日要闻", sub: "BRIEFING FEED" },
      { id: 2, code: "03", shape: "triangle", title: "编辑短评", sub: "FIELD NOTES" },
      { id: 3, code: "04", shape: "hexagon", title: "往期索引", sub: "ARCHIVE BAR" },
    ],
  },
  commerce: {
    label: "商品详情 · 转化重组",
    short: "商品详情",
    modules: [
      { id: 0, code: "01", shape: "circle", title: "主图画廊", sub: "HERO GALLERY" },
      { id: 1, code: "02", shape: "square", title: "规格加购", sub: "BUY BOX" },
      { id: 2, code: "03", shape: "triangle", title: "核心参数", sub: "KEY SPECS" },
      { id: 3, code: "04", shape: "hexagon", title: "实拍评价", sub: "REVIEWS" },
    ],
  },
};

// 四套宽屏重组蓝图：每个槽位在 0..1 归一化坐标内定义矩形
export const TEMPLATES = {
  linear: {
    id: "linear",
    label: "纯拉宽线性",
    en: "STRETCHED LINEAR",
    cols: 1,
    slots: [
      { x: 0, y: 0.0, w: 1, h: 0.225, colsInRow: 1, role: "linear" },
      { x: 0, y: 0.258, w: 1, h: 0.225, colsInRow: 1, role: "linear" },
      { x: 0, y: 0.516, w: 1, h: 0.225, colsInRow: 1, role: "linear" },
      { x: 0, y: 0.774, w: 1, h: 0.225, colsInRow: 1, role: "linear" },
    ],
    areasFor(order) {
      const n = order.map((m) => `m${m + 1}`);
      return `"${n[0]} ${n[0]}"\n"${n[1]} ${n[1]}"\n"${n[2]} ${n[2]}"\n"${n[3]} ${n[3]}"`;
    },
  },
  poster121: {
    id: "poster121",
    label: "原海报 1+2+1",
    en: "MODULAR 1+2+1",
    cols: 2,
    slots: [
      { x: 0, y: 0.0, w: 1, h: 0.39, colsInRow: 1, role: "hero" },
      { x: 0, y: 0.425, w: 0.60, h: 0.355, colsInRow: 2, role: "accent" },
      { x: 0.63, y: 0.425, w: 0.37, h: 0.355, colsInRow: 2, role: "support" },
      { x: 0, y: 0.815, w: 1, h: 0.185, colsInRow: 1, role: "footer" },
    ],
    areasFor(order) {
      const n = order.map((m) => `m${m + 1}`);
      return `"${n[0]} ${n[0]} ${n[0]} ${n[0]} ${n[0]}"\n"${n[1]} ${n[1]} ${n[1]} ${n[2]} ${n[2]}"\n"${n[3]} ${n[3]} ${n[3]} ${n[3]} ${n[3]}"`;
    },
  },
  sidebar13: {
    id: "sidebar13",
    label: "左主右三",
    en: "ASYMMETRIC SPLIT",
    cols: 2,
    slots: [
      { x: 0, y: 0.0, w: 0.56, h: 1.0, colsInRow: 2, role: "hero" },
      { x: 0.595, y: 0.0, w: 0.405, h: 0.305, colsInRow: 2, role: "accent" },
      { x: 0.595, y: 0.347, w: 0.405, h: 0.305, colsInRow: 2, role: "support" },
      { x: 0.595, y: 0.695, w: 0.405, h: 0.305, colsInRow: 2, role: "footer" },
    ],
    areasFor(order) {
      const n = order.map((m) => `m${m + 1}`);
      return `"${n[0]} ${n[0]} ${n[1]}"\n"${n[0]} ${n[0]} ${n[2]}"\n"${n[0]} ${n[0]} ${n[3]}"`;
    },
  },
  bento22: {
    id: "bento22",
    label: "错落双列",
    en: "OFFSET BENTO",
    cols: 2,
    slots: [
      { x: 0, y: 0.0, w: 0.61, h: 0.52, colsInRow: 2, role: "hero" },
      { x: 0.64, y: 0.0, w: 0.36, h: 0.52, colsInRow: 2, role: "accent" },
      { x: 0, y: 0.56, w: 0.37, h: 0.44, colsInRow: 2, role: "support" },
      { x: 0.40, y: 0.56, w: 0.60, h: 0.44, colsInRow: 2, role: "footer" },
    ],
    areasFor(order) {
      const n = order.map((m) => `m${m + 1}`);
      return `"${n[0]} ${n[0]} ${n[0]} ${n[1]} ${n[1]}"\n"${n[2]} ${n[2]} ${n[3]} ${n[3]} ${n[3]}"`;
    },
  },
};

export const VIEW_MIN = 360;
export const VIEW_MAX = 1200;
export const BP_MIN = 340;
export const BP_MAX = 1240;

// 开场刻意停在三重复合错态（非答案）：
// 1) 主次倒挂：04 占顶通栏主位，01 被挤进底条（视觉序与 DOM 产生 5 处逆序）
// 2) 断点过低：350px 导致 375px 手机屏也被硬挤出 2 列（最窄卡仅 127px）
// 3) 身份断锚：keepIdentity = false，切换后剥离 01–04 编号与几何标识
export function createInitialState() {
  return {
    subject: "poster",
    template: "poster121",
    slotOrder: [3, 1, 2, 0], // slot i 放置哪个模块 id (0..3)
    breakpoint: 350,
    viewportW: 960,
    keepIdentity: false,
    showFocusPath: true,
    selectedModule: -1, // 右侧直点互换时的选中模块 id
  };
}

// 线性基线槽位（任何模块按 DOM 01->02->03->04 顺序单列堆叠）
export const LINEAR_SLOTS = TEMPLATES.linear.slots;

// 按给定视口宽计算 4 个模块（按 DOM id 0..3 索引）的真实像素矩形
export function computeRectsForWidth(state, widthPx, heightPx = 360) {
  const padX = widthPx < 500 ? 16 : 28;
  const innerW = Math.max(200, widthPx - padX * 2);
  const innerH = heightPx;
  const switched = widthPx >= state.breakpoint;
  const tpl = switched ? TEMPLATES[state.template] : TEMPLATES.linear;
  const order = switched ? state.slotOrder : [0, 1, 2, 3];

  const byId = new Array(4);
  for (let s = 0; s < 4; s++) {
    const modId = order[s];
    const slot = tpl.slots[s];
    byId[modId] = {
      id: modId,
      slotIndex: s,
      x: padX + slot.x * innerW,
      y: slot.y * innerH,
      w: slot.w * innerW,
      h: slot.h * innerH,
      nx: slot.x,
      ny: slot.y,
      nw: slot.w,
      nh: slot.h,
      colsInRow: slot.colsInRow,
      role: slot.role,
      switched,
    };
  }
  return { switched, innerW, rects: byId };
}

// 从实际矩形排序得出视觉阅读序，并统计相对 DOM 顺序 [0,1,2,3] 的逆序对数
export function countReadingInversions(rects) {
  const ordered = [...rects].sort((a, b) => {
    // 同一视觉行（y 接近）按左到右；否则按上到下
    if (Math.abs(a.ny - b.ny) < 0.08) return a.nx - b.nx;
    return a.ny - b.ny;
  });
  const ids = ordered.map((r) => r.id);
  let inversions = 0;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      if (ids[i] > ids[j]) inversions++;
    }
  }
  return { visualOrder: ids, inversions };
}

// 单真源全面核算
export function evaluate(state) {
  const mobile = computeRectsForWidth(state, 375, 420);
  const wide = computeRectsForWidth(state, 1080, 420);
  const live = computeRectsForWidth(state, state.viewportW, 420);

  const mobileMinW = Math.round(Math.min(...mobile.rects.map((r) => r.w)));
  const wideCols = Math.max(...wide.rects.map((r) => r.colsInRow));
  const wideAreas = wide.rects.map((r) => r.w * r.h);
  const maxArea = Math.max(...wideAreas);
  const minArea = Math.min(...wideAreas);
  const areaRatio = +(maxArea / Math.max(1, minArea)).toFixed(2);

  const { visualOrder, inversions } = countReadingInversions(wide.rects);
  const heroRect = wide.rects[0]; // DOM 01
  const heroIsLargest = heroRect.w * heroRect.h >= maxArea * 0.92;
  const heroLeads = visualOrder[0] === 0 && heroIsLargest;

  // 三个核心阶段是否过关（直接驱动原海报三步流向灯）
  const mobileSafe = mobileMinW >= 220 && !mobile.switched;
  const desktopSwitches = wide.switched && wideCols >= 2 && areaRatio >= 1.25;
  const stepSwitch = mobileSafe && desktopSwitches && state.breakpoint >= 520 && state.breakpoint <= 980;
  const stepOrder = inversions === 0 && heroLeads;
  const stepIdentity = state.keepIdentity;

  const passed = stepSwitch && stepOrder && stepIdentity;

  // 诊断主结论：按危害优先级只说眼下最要紧的问题与“为什么”
  let code = "ok";
  let headline = "";
  let reason = "";
  let actionHint = "";

  if (mobile.switched && mobileMinW < 220) {
    code = "mobile_crush";
    headline = `断点设在 ${state.breakpoint}px，手机屏被硬挤成双列（最窄卡仅 ${mobileMinW}px）`;
    reason = `375px 窄屏已经越过 ${state.breakpoint}px 断点，系统过早切进多列模块网，最窄一格只剩 ${mobileMinW}px，正文会被折成三四个字一行的碎条。`;
    actionHint = "把切换断点向右拉到 600px–880px 区间，让手机端先稳稳保持单列线性阅读。";
  } else if (!wide.switched) {
    code = "bp_too_high";
    headline = `断点抬高到 ${state.breakpoint}px，桌面宽屏一直切不过去`;
    reason = `1080px 常规桌面窗口还没碰到 ${state.breakpoint}px 门槛，整页继续锁在单列线性列表里，宽屏横向空间全部被拉长浪费。`;
    actionHint = "把切换断点降回 600px–880px 之间，让平板横屏与桌面端能顺利触发重组。";
  } else if (wideCols < 2 || areaRatio < 1.25) {
    code = "fake_switch";
    headline = `宽屏只是拉扁的线性列表（主副面积比 ${areaRatio.toFixed(1)}×），并未真正切换`;
    reason = "四个模块在 1080px 下仍各占一整行，主次面积完全持平。这只是把窄屏内容机械撑宽，既没拉开视觉层级，也没让关联模块并肩对照。";
    actionHint = "把宽屏蓝图切换成「原海报 1+2+1」、「左主右三」或「错落双列」，真正重组结构。";
  } else if (inversions > 0 || !heroLeads) {
    const seqStr = visualOrder.map((i) => `0${i + 1}`).join("→");
    code = "order_conflict";
    headline = `主次倒挂：视觉变成 ${seqStr}，与 DOM 顺序冲突 ${inversions} 处`;
    reason = `键盘 Tab 与屏幕阅读器仍按 DOM 的 01→02→03→04 推进，但视觉上 0${visualOrder[0] + 1} 抢了主位、01 被挪到后面；焦点在画面里上下折返，读者会瞬间迷失位置。`;
    actionHint = "直接在切换后蓝图里依次点按「04」和「01」（或点「对调 01 / 04」）把两个槽位换回来，让 01 回到主视觉位。";
  } else if (!state.keepIdentity) {
    code = "identity_lost";
    headline = "结构已重组，但切换后剥离了 01–04 编号与几何标识";
    reason = "原海报里，01 圆、02 方、03 三角、04 六边形在切换前后一脉相承。如果一过断点就换色删标，用户根本看不出切换前的 01 跑去了切换后的哪一格。";
    actionHint = "打开「保留 01–04 身份锚点」，让跨断点形变守住用户的心理地图。";
  } else {
    const tpl = TEMPLATES[state.template];
    code = "ok";
    headline = `切换成立：${state.breakpoint}px 处重组为「${tpl.label}」，主次清晰且零焦点逆序`;
    reason = `375px 手机维持 ${mobileMinW}px 单列线性流；跨过 ${state.breakpoint}px 后重组为 ${wideCols} 列模块网，主副面积比拉开到 ${areaRatio.toFixed(1)}×，视觉顺序 01→02→03→04 与 DOM 完全一致。`;
    actionHint = "可以继续拖动中缝视口宽观察跨断点形变，或换一套「左主右三 / 错落双列」验证多解。";
  }

  const tpl = TEMPLATES[state.template];
  const cssCode =
    `@media (min-width: ${state.breakpoint}px) {\n` +
    `  .layout {\n` +
    `    display: grid;\n` +
    `    grid-template-areas:\n` +
    tpl
      .areasFor(state.slotOrder)
      .split("\n")
      .map((l) => `      ${l}`)
      .join("\n") +
    `;\n  }\n}`;

  return {
    mobile,
    wide,
    live,
    mobileMinW,
    wideCols,
    areaRatio,
    visualOrder,
    inversions,
    heroLeads,
    stepSwitch,
    stepOrder,
    stepIdentity,
    passed,
    code,
    headline,
    reason,
    actionHint,
    cssCode,
  };
}

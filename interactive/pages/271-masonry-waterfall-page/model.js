// 271 瀑布流页面：唯一状态与布局计算源
// 所有开场卡片坐标、空洞面积、列尾落差、单卡实宽、CLS 偏移与诊断文案都由此模块算出。

export const SWEET_RATIO = { min: 1.32, max: 1.85 }; // 经验值：约 3:4 竖图到温和竖卡之间
export const RATIO_RANGE = { min: 0.68, max: 3.05 };

// 原海报 8 张主题卡片（保留原海报配色语汇、图文位置与风物题材）
export const BASE_CARDS = [
  {
    id: "c1",
    order: 1,
    title: "自然之旅",
    body: "山川湖海，记录自然的每一处细节，感受世界的辽阔与宁静。",
    tags: "#旅行 #自然",
    tone: "cream",
    icon: "dot-terra",
    art: "desert",
    artPos: "bottom",
    naturalRatio: 1.38, // 高 / 宽（竖图）
    textLines: 4,
    kind: "photo",
  },
  {
    id: "c2",
    order: 2,
    title: "设计灵感",
    body: "收集全球优秀设计案例，激发你的创意火花。",
    tags: "#设计 #灵感",
    tone: "terracotta",
    icon: "bookmark",
    art: "bauhaus",
    artPos: "bottom",
    naturalRatio: 1.24,
    textLines: 3,
    kind: "graphic",
  },
  {
    id: "c3",
    order: 3,
    title: "生活记录",
    body: "日常点滴，随手记录，让平凡的日子也闪闪发光。",
    tags: "#生活 #记录",
    tone: "cream",
    icon: "dot-olive",
    art: "leaves",
    artPos: "top",
    naturalRatio: 0.96,
    textLines: 3,
    kind: "photo",
  },
  {
    id: "c4",
    order: 4,
    title: "摄影作品",
    body: "光影之间，定格每一个动人的瞬间。",
    tags: "#摄影 #作品",
    tone: "olive",
    icon: "lens",
    art: "stairs",
    artPos: "bottom",
    naturalRatio: 2.35, // 原图超长的垂直建筑长图，开场不限高时会拖出明显长尾
    textLines: 2,
    kind: "long-photo",
  },
  {
    id: "c5",
    order: 5,
    title: "徒步路线",
    body: "精选国内外经典徒步路线，难度、时长、风景一目了然。",
    tags: "#徒步 #路线",
    tone: "olive",
    icon: "peak",
    art: null,
    artPos: "none",
    naturalRatio: 0,
    textLines: 3,
    kind: "text",
  },
  {
    id: "c6",
    order: 6,
    title: "",
    body: "好的内容需要被看见，好的体验值得被探索。",
    tags: "",
    tone: "cream",
    icon: "quote",
    art: null,
    artPos: "none",
    naturalRatio: 0,
    textLines: 4,
    kind: "quote",
  },
  {
    id: "c7",
    order: 7,
    title: "视频精选",
    body: "优质视频内容推荐，沉浸式观看体验。",
    tags: "#视频 #推荐",
    tone: "espresso",
    icon: "play",
    art: "sea",
    artPos: "bottom",
    naturalRatio: 0.78, // 横向视频封面
    textLines: 2,
    kind: "video",
  },
  {
    id: "c8",
    order: 8,
    title: "好物推荐",
    body: "精心挑选品质好物，提升生活幸福感。",
    tags: "#好物 #推荐",
    tone: "cream",
    icon: "bag",
    art: null,
    artPos: "none",
    naturalRatio: 0,
    textLines: 3,
    kind: "goods",
  },
];

// 异步投放卡队列（点击「+ 投放新卡」逐张进入瀑布流）
export const EXTRA_CARDS = [
  {
    id: "c9",
    order: 9,
    title: "峡谷长卷",
    body: "从谷底拍到垭口的竖拼长图，没设限高就会瞬间拖垮整列。",
    tags: "#长图 #地貌",
    tone: "cream",
    icon: "dot-terra",
    art: "canyon",
    artPos: "top",
    naturalRatio: 2.6,
    textLines: 2,
    kind: "long-photo",
  },
  {
    id: "c10",
    order: 10,
    title: "海岸晨雾",
    body: "宽幅横向地平线，放在瀑布流里刚好充当轻盈的呼吸节拍。",
    tags: "#海边 #清晨",
    tone: "espresso",
    icon: "play",
    art: "coast",
    artPos: "bottom",
    naturalRatio: 0.66,
    textLines: 2,
    kind: "video",
  },
  {
    id: "c11",
    order: 11,
    title: "陶艺手记",
    body: "素坯修足与柴窑落灰记录，方正器物配等宽留白。",
    tags: "#器物 #手作",
    tone: "terracotta",
    icon: "bookmark",
    art: "pottery",
    artPos: "bottom",
    naturalRatio: 1.18,
    textLines: 2,
    kind: "graphic",
  },
  {
    id: "c12",
    order: 12,
    title: "旧书摘录",
    body: "短文字卡片在两张大图之间插空，不抢画面却能稳住列高。",
    tags: "#阅读 #摘抄",
    tone: "olive",
    icon: "peak",
    art: null,
    artPos: "none",
    naturalRatio: 0,
    textLines: 3,
    kind: "text",
  },
];

export function widthBounds(isCompact) {
  // 经验值：窄墙（手机/横屏右侧舞台）单卡 138–252px（2–3 列）；常规桌面单卡 205–430px 且不超过 5 列（超过 5 列视线易发散）
  return isCompact
    ? { min: 138, max: 252, maxCols: 3, idealCols: [2], label: "138–252px（窄屏经验值）" }
    : { min: 205, max: 430, maxCols: 5, idealCols: [3, 4], label: "205–430px（桌面经验值，且≤5列）" };
}

export function estimateTextHeight(card, colW, isCompact) {
  // 纯数学估算卡片文字区高度，保证 DOM 与 Canvas 读数 100% 同源、零排版抖动
  const pad = isCompact ? 18 : 24;
  const lineH = isCompact ? 16 : 19;
  const narrowFactor = colW < 150 ? 1.48 : colW < 195 ? 1.18 : 1.0;
  if (card.kind === "quote") {
    return Math.round(pad + (isCompact ? 24 : 30) + card.textLines * lineH * narrowFactor + 18);
  }
  const headH = card.title ? (isCompact ? 22 : 26) : 0;
  const tagH = card.tags ? (isCompact ? 18 : 22) : 0;
  const bodyH = Math.round(card.textLines * lineH * narrowFactor);
  return Math.round(pad + headH + bodyH + tagH + (card.art ? 6 : 12));
}

export function computeCardMetrics(card, colW, maxRatio, isCompact, isPendingUnreserved, measuredTextH) {
  const textH = measuredTextH || estimateTextHeight(card, colW, isCompact);
  if (!card.art || card.naturalRatio <= 0) {
    // 若已有真实文字高度，绝不强裁低于文字本身高度，防止文字溢出裁切
    const h = textH;
    return { mediaH: 0, textH: h, h, effectiveRatio: 0, clipped: false, unreservedPending: false };
  }
  const effectiveRatio = Math.min(card.naturalRatio, maxRatio);
  const clipped = card.naturalRatio > maxRatio + 0.06;
  const fullMediaH = Math.round(colW * effectiveRatio);
  const mediaH = isPendingUnreserved ? 0 : fullMediaH;
  const h = textH + mediaH;
  return {
    mediaH,
    fullMediaH,
    textH,
    h,
    effectiveRatio,
    clipped,
    unreservedPending: Boolean(isPendingUnreserved),
  };
}

export function computeWaterfall({
  wallWidth,
  cols,
  gap,
  packing,
  maxRatio,
  cards,
  measuredTextHeights = null,
  pendingIds = new Set(),
  reserveRatio = false,
  isCompact = false,
  lastShiftPx = 0,
  colJumpsOnAppend = 0,
  appendedCount = 0,
}) {
  const safeW = Math.max(240, wallWidth);
  const safeCols = Math.max(1, Math.min(6, cols));
  const colW = (safeW - gap * (safeCols - 1)) / safeCols;

  const items = cards.map((card, idx) => {
    const isPendingUnreserved = !reserveRatio && pendingIds.has(card.id);
    const measured = measuredTextHeights ? measuredTextHeights.get(card.id) : null;
    const m = computeCardMetrics(card, colW, maxRatio, isCompact, isPendingUnreserved, measured);
    return { card, idx, ...m, col: 0, x: 0, y: 0, w: colW };
  });

  const colHeights = new Array(safeCols).fill(0);
  const voidRects = [];
  const rowBaselines = [];

  if (packing === "grid") {
    // 刚性等高行锁：每行按该行最高卡片撑开，其余矮卡下方撕出明显空白空洞
    let yCursor = 0;
    for (let start = 0; start < items.length; start += safeCols) {
      const row = items.slice(start, start + safeCols);
      const rowH = Math.max(...row.map((it) => it.h));
      row.forEach((it, c) => {
        it.col = c;
        it.x = c * (colW + gap);
        it.y = yCursor;
        const waste = rowH - it.h;
        if (waste >= 14) {
          voidRects.push({
            x: it.x,
            y: it.y + it.h + 4,
            w: colW,
            h: waste - 4,
            waste,
            cardTitle: it.card.title || "引语卡",
          });
        }
        colHeights[c] = yCursor + rowH;
      });
      yCursor += rowH + gap;
      rowBaselines.push(yCursor - gap / 2);
    }
  } else if (packing === "columns") {
    // CSS Columns 纵列硬分：按顺序竖直填满第 1 列，再填第 2 列……
    const perCol = Math.ceil(items.length / safeCols);
    items.forEach((it, idx) => {
      const c = Math.min(safeCols - 1, Math.floor(idx / perCol));
      const y = colHeights[c] === 0 ? 0 : colHeights[c] + gap;
      it.col = c;
      it.x = c * (colW + gap);
      it.y = y;
      colHeights[c] = y + it.h;
    });
  } else {
    // 最短列补位（真瀑布流）：每来一张卡，落入当前水位最低的那一列
    items.forEach((it) => {
      let bestCol = 0;
      for (let c = 1; c < safeCols; c++) {
        if (colHeights[c] < colHeights[bestCol] - 1) bestCol = c;
      }
      const y = colHeights[bestCol] === 0 ? 0 : colHeights[bestCol] + gap;
      it.col = bestCol;
      it.x = bestCol * (colW + gap);
      it.y = y;
      colHeights[bestCol] = y + it.h;
    });
  }

  const totalHeight = Math.max(220, ...colHeights);
  const minColH = Math.min(...colHeights);
  const maxColH = Math.max(...colHeights);
  let shortestCol = 0;
  for (let c = 1; c < safeCols; c++) {
    if (colHeights[c] < colHeights[shortestCol]) shortestCol = c;
  }

  const tailGap = Math.max(0, Math.round(maxColH - minColH));
  const tailRatio = colW > 0 ? tailGap / colW : 0;

  // 计算行底空洞面积占比（仅 grid 存在）
  const voidArea = voidRects.reduce((sum, r) => sum + r.w * r.h, 0);
  const cardArea = items.reduce((sum, it) => sum + it.w * it.h, 0);
  const voidPct = cardArea + voidArea > 0 ? Math.round((voidArea / (cardArea + voidArea)) * 100) : 0;

  // 计算卡片高度参差起伏度（衡量是否真的“高度不一”）
  const heights = items.map((it) => it.h);
  const minH = Math.min(...heights);
  const maxH = Math.max(...heights);
  const heightSpan = Math.round(maxH - minH);
  const heightRatio = minH > 0 ? maxH / minH : 1;

  // 最长单卡高宽比
  const tallestMediaRatio = Math.max(...items.map((it) => it.effectiveRatio || 0));
  const clippedCount = items.filter((it) => it.clipped).length;
  const runawayCount = items.filter((it) => it.effectiveRatio > SWEET_RATIO.max + 0.08).length;

  // 检验 4 项原海报核心支柱
  const bounds = widthBounds(isCompact);
  const tooManyCols = safeCols > bounds.maxCols;
  const tooNarrow = colW < bounds.min || tooManyCols;
  const tooWide = colW > bounds.max;
  const widthOk = !tooNarrow && !tooWide;

  const tooFlat = maxRatio < SWEET_RATIO.min;
  const tooTall = maxRatio > SWEET_RATIO.max;

  const checkStagger = packing === "masonry" && voidPct === 0 && !tooFlat;
  const checkBrowse = packing === "masonry" && !tooFlat && !tooTall;
  const checkFlexible = widthOk;
  const checkRich = reserveRatio && lastShiftPx === 0;

  const checks = {
    stagger: {
      ok: checkStagger,
      label: "错落",
      en: "STAGGER",
      state:
        packing === "grid"
          ? `空洞 ${voidPct}%`
          : packing === "columns"
          ? "纵列跳序"
          : tooFlat
          ? "压扁齐平"
          : "咬合自然",
    },
    browse: {
      ok: checkBrowse,
      label: "浏览",
      en: "BROWSE",
      state:
        packing === "columns"
          ? "Z序断裂"
          : tooTall
          ? `长尾 ${tailGap}px`
          : tooFlat
          ? "无露半卡"
          : `落差 ${tailGap}px`,
    },
    flexible: {
      ok: checkFlexible,
      label: "弹性",
      en: "FLEXIBLE",
      state: tooManyCols && colW >= bounds.min
        ? `${safeCols}列发散`
        : tooNarrow
        ? `过窄 ${Math.round(colW)}px`
        : tooWide
        ? `过宽 ${Math.round(colW)}px`
        : `${safeCols}列·${Math.round(colW)}px`,
    },
    rich: {
      ok: checkRich,
      label: "丰富",
      en: "RICH",
      state:
        lastShiftPx > 0
          ? `跳动 +${lastShiftPx}px`
          : !reserveRatio
          ? "未写比例"
          : `零跳动·${items.length}卡`,
    },
  };

  const passedCount = [checkStagger, checkBrowse, checkFlexible, checkRich].filter(Boolean).length;

  // 按严格优先级给出单条主诊断（说明「为什么」以及「错在哪」）
  let severity = "bad";
  let badge = `${passedCount}/4 待修`;
  let headline = "";
  let detail = "";

  if (lastShiftPx > 0 && !reserveRatio) {
    badge = "CLS 跳动";
    headline = `新图解码把整列顶偏了 +${lastShiftPx}px`;
    detail =
      "没提前在容器上写入宽高比时，新卡落位按 0px 算；图片一到立刻把下方卡片往下踹，用户手指正要点收藏就会误触。切到「预写宽高比」再投一张对比。";
  } else if (packing === "grid") {
    badge = `空洞 ${voidPct}%`;
    headline = `等高行锁在矮卡下方撕出 ${voidRects.length} 处空白死角`;
    detail =
      "硬把不同高矮的图文绑在同一条水平底线上，每行都要迁就最高那张图。把排布切到「最短列补位」，拆掉水平行线让新卡往上咬合。";
  } else if (packing === "columns") {
    badge = colJumpsOnAppend > 0 ? "旧卡跳列" : "顺序倒挂";
    headline =
      colJumpsOnAppend > 0
        ? `追加新卡后，有 ${colJumpsOnAppend} 张旧卡被甩去了别的列`
        : "纵列硬分让 1→2→3 竖直往下排，打破了左右扫读";
    detail =
      "CSS Columns 虽然看起来参差，但它先把第 1 列塞满才开第 2 列：读者按左右扫读顺序全乱，无限加载新卡时更会把已经看过的旧卡整体重洗。改用「最短列补位」。";
  } else if (tooTall) {
    badge = "长图霸屏";
    headline = `限高闸放到了 ${maxRatio.toFixed(2)}×，超长竖图把列尾拖差 ${tailGap}px`;
    detail = `「摄影作品」等竖图高宽比冲到 ${tallestMediaRatio.toFixed(2)}×，单张卡霸占大半屏幕，把旁边几列甩在身后。把高宽比闸往左拉回 1.35×–1.85× 经验甜区，触发长图截断角标。`;
  } else if (tooFlat) {
    badge = "裁得太扁";
    headline = `限高闸压到 ${maxRatio.toFixed(2)}×，错落节奏退化成了平齐方砖`;
    detail =
      "把竖图硬裁成近似等高后，各列底缘重新齐平，既切掉了竖图构图，又丢掉了视口底部露出半张卡的下拉暗示。把限高闸往右放回到 1.35×–1.85× 区间。";
  } else if (tooNarrow) {
    badge = tooManyCols && colW >= bounds.min ? "列多发散" : "列密挤碎";
    headline =
      tooManyCols && colW >= bounds.min
        ? `${safeCols} 列同时扫读视线发散，建议控制在 ${bounds.maxCols} 列以内`
        : `${safeCols} 列下每张卡只剩 ${Math.round(colW)}px，图文挤成细纸条`;
    detail = `当前宽度下舒适经验范围是 ${bounds.label}。列数贪多会让标题折行、焦点分散；把列数减到 ${bounds.idealCols.join(" 或 ")} 列试试。`;
  } else if (tooWide) {
    badge = "单卡过宽";
    headline = `只排 ${safeCols} 列时单卡宽达 ${Math.round(colW)}px，丢失了多维浏览密度`;
    detail = `宽屏上卡片过宽，一屏只能塞进两三张，错落对比变弱。将列数增至 ${bounds.idealCols.join(" 或 ")} 列，让每张卡落回 ${bounds.label}。`;
  } else if (!reserveRatio) {
    badge = "缺预占位";
    headline = "画面错落已顺眼，但异步加载还没锁住宽高比";
    detail =
      "现在点击「+ 投放新卡」会亲眼看到图片解码把整列顶歪。先打开「预写宽高比」占位，再投新卡确认 0px 跳动，四柱即全部成立。";
  } else {
    severity = "ok";
    badge = "4/4 成立";
    headline = `最短列咬合 · 单卡 ${Math.round(colW)}px · 限高 ${maxRatio.toFixed(2)}× · 零跳动`;
    detail =
      appendedCount > 0
        ? `已稳妥接纳 ${appendedCount} 张新投卡片：超长图自动截断并贴「长图」标，列尾自然错落 ${tailGap}px 勾引继续下拉，图片预占位保持 0px 偏移。`
        : `四列自然参差（列尾差 ${tailGap}px），超长图自动截断保护视野，底沿刚好露半张卡勾着继续翻。再点「+ 投放新卡」验证追加也不跳列。`;
  }

  return {
    items,
    colW,
    cols: safeCols,
    gap,
    colHeights,
    totalHeight,
    shortestCol,
    tailGap,
    tailRatio,
    voidRects,
    rowBaselines,
    voidPct,
    heightSpan,
    clippedCount,
    passedCount,
    checks,
    severity,
    badge,
    headline,
    detail,
  };
}

// ---------- Section 01：单步落砖模拟器 ----------
export const STEP_BRICKS = [
  { id: 1, name: "沙漠竖照", h: 146, tone: "cream" },
  { id: 2, name: "几何灵感", h: 112, tone: "terracotta" },
  { id: 3, name: "午后叶影", h: 92, tone: "cream" },
  { id: 4, name: "拱门阶梯", h: 158, tone: "olive" },
  { id: 5, name: "徒步笔记", h: 74, tone: "olive" },
  { id: 6, name: "海面落日", h: 86, tone: "espresso" },
  { id: 7, name: "陶土器物", h: 124, tone: "terracotta" },
  { id: 8, name: "编辑引语", h: 78, tone: "cream" },
];

export function simulateStepPacking(count, strategy, cols = 4, gap = 8) {
  const heights = new Array(cols).fill(0);
  const placed = [];
  for (let i = 0; i < Math.min(count, STEP_BRICKS.length); i++) {
    const b = STEP_BRICKS[i];
    let col = 0;
    if (strategy === "round-robin") {
      col = i % cols;
    } else {
      for (let c = 1; c < cols; c++) {
        if (heights[c] < heights[col]) col = c;
      }
    }
    const y = heights[col] === 0 ? 0 : heights[col] + gap;
    placed.push({ ...b, col, y });
    heights[col] = y + b.h;
  }
  const minH = Math.min(...heights);
  const maxH = Math.max(...heights);
  let nextCol = 0;
  if (strategy === "round-robin") {
    nextCol = count % cols;
  } else {
    for (let c = 1; c < cols; c++) {
      if (heights[c] < heights[nextCol]) nextCol = c;
    }
  }
  return { placed, heights, tailDiff: maxH - minH, nextCol };
}

// ---------- Section 05：视口与列数经验对照 ----------
export const VIEWPORT_PRESETS = [
  {
    id: "phone",
    label: "手机 375px",
    width: 375,
    cols: 2,
    gap: 10,
    pad: 12,
    note: "双列刚好兼顾单图清晰度与同屏对比，再多到 3 列文字就会折碎；槽宽 8–12px（经验值）留出手指点击安全缝。",
  },
  {
    id: "tablet",
    label: "平板 768px",
    width: 768,
    cols: 3,
    gap: 16,
    pad: 24,
    note: "竖屏平板用 3 列，单卡落在约 229px，横图、竖图与短文字卡片彼此咬合得最从容。",
  },
  {
    id: "laptop",
    label: "笔记 1280px",
    width: 1280,
    cols: 4,
    gap: 20,
    pad: 32,
    note: "1280 宽正是 271 号原海报采用的经典四列比例：单卡约 289px，一屏能容下 6–8 张完整卡片加底沿半卡。",
  },
  {
    id: "wide",
    label: "宽屏 1920px",
    width: 1920,
    cols: 5,
    gap: 24,
    pad: 48,
    note: "超宽屏一般收在 5 列（外层设最大容器宽，如 1600–1760px），防止 7–8 列同时扫读引起视觉发散。",
  },
];

// ---------- Section 06：找第 7 条通知实验 ----------
export const FIND_ITEMS = [
  { no: "01", time: "15:10", title: "设计评审改至四楼", h: 108 },
  { no: "02", time: "14:55", title: "秋季图库素材包上传完成", h: 66 },
  { no: "03", time: "14:48", title: "首页字体子集化构建通过", h: 126 },
  { no: "04", time: "14:40", title: "摄影师补交 12 张横幅原图", h: 78 },
  { no: "05", time: "14:32", title: "移动端图片限高规则复核", h: 118 },
  { no: "06", time: "14:26", title: "周报排版样式更新说明", h: 68 },
  { no: "07", time: "14:20", title: "紧急：线上封面链接修正", h: 90, target: true },
  { no: "08", time: "14:05", title: "下周展签印刷打样确认", h: 104 },
];

// ---------- Section 07：小练习四选一 ----------
export const PRACTICE_OPTIONS = {
  A: {
    correct: false,
    title: "选 A 不太稳：放任超长竖图，拖出了悬殊断尾",
    body: "A 用对了双列和最短列补位，但没给单卡高宽比设上限——第 2 张超长竖图霸占左列近整屏，右列已经排完 4 张卡，左列底部依然拖出长尾空档，浏览节奏失衡。",
  },
  B: {
    correct: true,
    title: "选 B 正中要害：错落、限高、顺流三者都站住了",
    body: "B 采用最短列补位，把超长竖图裁在 3:4 上限并贴「长图」角标，横竖混排卡片自然咬合，双列底端保留轻度参差、露出半张新卡暗示下滑，同时阅读顺序依然从左到右推进。",
  },
  C: {
    correct: false,
    title: "选 C 藏着工程暗坑：CSS Columns 纵列硬分",
    body: "C 乍看和 B 一样参差好看，但编号 1→2→3 先把左列从头塞到底才开右列。读者视线左右扫读顺序错乱；更致命的是滑到底部加载新卡时，已有卡片会整体跨列重排。",
  },
  D: {
    correct: false,
    title: "选 D 退回了等高网格：失去了瀑布流的理由",
    body: "D 把全部图片硬裁成统一的 1:1 方块高度，底线重新排成一条横杠——既切坏了原本的竖图与宽图比例，又丢掉了底部参差露半卡带来的持续下拉动力。",
  },
};

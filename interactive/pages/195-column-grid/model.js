// 195 · 分栏网格 COLUMN GRID — 全页单一真源模型
// 开场拼版台、02 节解剖、03 节 12 栏切分、05 节响应式折栏、08 节小练习共用这里的几何与诊断逻辑。

export const LOGICAL_W = 960;
export const LOGICAL_H = 600;
export const BODY_FONT_PX = 14;
export const LINE_HEIGHT_PX = 20; // 基准行距，用于计算栏距/行距比（接近律临界参考）

export const TOPICS = {
  magazine: {
    id: "magazine",
    label: "杂志图文",
    short: "杂志",
    preferredCols: [2, 3],
    recommendedPreset: { cols: 2, weights: [1, 1], gutterPx: 28, marginPct: 9, heroSpan: 1 },
    recommendedText: "双栏 1 : 1 或三栏 1 : 2 : 1",
    kicker: "MAGAZINE SPREAD · 专题报道",
    headline: "沙漠建筑里的光线与秩序",
    lead: "风沙抹平了地平线，垂直分栏让大片摄影与长篇手记各安其位，视线先被热沙吸住，再顺着右栏文字平稳下行。",
    body: [
      "在宽阔的杂志跨页上，单行文字若横贯整页，眼睛从行尾折返时极易跳行。把画面按栏拆开，图片与正文就有了清晰的边界。",
      "左栏留给完整的地理影像，右栏收纳紧凑的访谈与田野记录，底部一枚金黄方标收住整页重心，图文彼此托衬而互不打架。",
      "当读者翻页浏览时，稳定的垂直轴线像乐谱里的小节线，哪怕图像大小变化，版面依然保持从容统一的呼吸节奏。",
      "好的分栏从不把版面锁成死格子，它先给出可靠的秩序起点，再让长短段落与跨栏引语在轨道里自然生长。"
    ],
    quote: "“秩序不是限制，而是让视线松弛下来的轨道。”",
    metrics: [
      { value: "1:1", label: "图文配比" },
      { value: "42", label: "经典行数" },
      { value: "28px", label: "安全栏缝" },
      { value: "1981", label: "瑞士范本" }
    ]
  },
  product: {
    id: "product",
    label: "产品三栏",
    short: "产品",
    preferredCols: [3, 2],
    recommendedPreset: { cols: 3, weights: [1, 2, 1], gutterPx: 26, marginPct: 8, heroSpan: 1 },
    recommendedText: "三栏 1 : 2 : 1 或等宽三栏",
    kicker: "PRODUCT SPECS · 核心能力",
    headline: "三组能力并列，一眼读清主次",
    lead: "当页面需要同时介绍多个并列特性，三栏把左辅、中主、右补自然拉开，读者扫一眼就能分清重点。",
    body: [
      "核心引擎：实时校准网格比例与基线对齐，自动检测窄栏断行与跨栏串行，输出可直接复用的栅格参数。",
      "多端适配：同一套逻辑栏轨可在宽屏舒展为三至四栏，进入平板与掌心屏幕时平滑折叠，保留阅读顺序。",
      "排版节奏：通过统一的页边距与栏缝呼吸，把图标、金黄短杠与说明文案锁定在垂直轴线上，利落克制。",
      "团队协作：把栏数、栏距和跨栏规则写成显性约定，设计师与工程师对齐同一把尺子，少走返工弯路。"
    ],
    quote: "“中间加宽一倍，主角立刻自己站出来。”",
    metrics: [
      { value: "01", label: "灵活适配" },
      { value: "02", label: "精准对齐" },
      { value: "03", label: "节奏留白" },
      { value: "04", label: "响应式" }
    ]
  },
  data: {
    id: "data",
    label: "数据四栏",
    short: "数据",
    preferredCols: [4, 3],
    recommendedPreset: { cols: 4, weights: [1, 1, 1, 1], gutterPx: 22, marginPct: 7, heroSpan: 2 },
    recommendedText: "四栏 1 : 1 : 1 : 1 等宽并列",
    kicker: "DATA BENCHMARK · 指标对照",
    headline: "四组指标并排，高低一目了然",
    lead: "短词、大数字与微型柱图不需宽行长，四栏等宽排布能在同一视平线上完成快速横向比对。",
    body: [
      "页面组件复用率在引入标准分栏体系后显著提升，卡片宽度统一，无需为每条指标单独手调留白。",
      "四栏等距为横向扫描建立稳定节拍，数字与微型柱状图对齐同一底部基线，高低趋势一眼可见。",
      "若在数据卡片页硬并成单栏长列表，用户必须上下滚动四次才能记忆对比，横向并列的优势荡然无存。",
      "需要展示摘要结论时，可让导语横跨前两栏，下方再回归四栏细目，做到总分有致、密而不乱。"
    ],
    quote: "“横向对齐是数字对比最省力的标尺。”",
    metrics: [
      { value: "128", label: "复用模块" },
      { value: "76%", label: "扫读提速" },
      { value: "3.2M", label: "月度页面" },
      { value: "18+", label: "适配断点" }
    ]
  },
  news: {
    id: "news",
    label: "新闻报道",
    short: "新闻",
    preferredCols: [3, 4],
    recommendedPreset: { cols: 3, weights: [1, 1, 1], gutterPx: 24, marginPct: 8, heroSpan: 3 },
    recommendedText: "三栏等宽或 1 : 2 : 1，通栏大标题",
    kicker: "DAILY EDITION · 深度版面",
    headline: "通栏标题破开全局，三栏正文平稳流淌",
    lead: "报刊的经典智慧：大标题横跨全部栏位宣告份量，正文收进等宽窄栏加速扫读，金黄引语框精准落进右栏。",
    body: [
      "清晨的通勤地铁上，读者通常只用三秒决定要不要读完一篇报道。通栏粗黑标题把最重要的一句话推到最前。",
      "正文随之折入三道等宽垂直通道，每行控制在十余个汉字，眼球几乎不需大幅摆头就能顺畅向下滑读。",
      "当报道出现关键人物发言或核心数据时，编排者把一枚金黄色引语块精准卡进最右一栏的栏线之间。",
      "它既打破了大段灰字的沉闷，又因为四条边紧咬网格栏线，整张版面依然稳如磐石、丝毫不乱。"
    ],
    quote: "“新闻分栏的核心，是让快读与深读共用一条骨架。”",
    metrics: [
      { value: "3栏", label: "经典报版" },
      { value: "18字", label: "单栏行长" },
      { value: "24px", label: "防串行缝" },
      { value: "100%", label: "贴栏对齐" }
    ]
  }
};

// 开场刻意停在 0 / 4 翻车错态：
// 1. 杂志图文硬切 4 栏 + 畸形栏宽比（中间两栏挤成 5 字断肠条）
// 2. 栏距压成 6px（远小于行距 20px → 跨栏串行！）
// 3. 页边距压成 3%（文字顶边窒息！）
// 4. 内容块脱栏悬空偏出 +18px（破坏垂直秩序轴！）
export const INITIAL_STATE = {
  topic: "magazine",
  cols: 4,
  weights: [1.65, 0.42, 0.43, 1.50],
  gutterPx: 6,
  marginPct: 3,
  aligned: false,
  heroSpan: 2,
  showGrid: true,
  showBaseline: true,
  activeDivider: 0 // 当前键盘焦点选中的栏缝编号
};

export function normalizeWeights(weights, cols) {
  const arr = [];
  for (let i = 0; i < cols; i++) {
    const v = Number(weights[i]);
    arr.push(Number.isFinite(v) && v > 0.12 ? v : 1);
  }
  const sum = arr.reduce((a, b) => a + b, 0);
  return arr.map((v) => (v / sum) * cols);
}

export function formatRatio(weights) {
  if (!weights || weights.length === 0) return "1";
  if (weights.length === 1) return "1";
  const minW = Math.min(...weights);
  if (minW <= 0) return weights.map(() => "1").join(" : ");
  const scaled = weights.map((w) => w / minW);
  // 检验是否接近简单整数比（乘 1 或 2 后误差 < 0.08）
  for (const mul of [1, 2, 3]) {
    const cand = scaled.map((v) => v * mul);
    if (cand.every((v) => Math.abs(v - Math.round(v)) < 0.09) && Math.max(...cand) <= 6) {
      const ints = cand.map((v) => Math.round(v));
      const g = ints.reduce((a, b) => gcd(a, b));
      return ints.map((v) => v / g).join(" : ");
    }
  }
  return scaled.map((v) => v.toFixed(1).replace(/\.0$/, "")).join(" : ");
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}

export function setColsPreserve(state, nextCols) {
  const cols = Math.max(1, Math.min(4, Math.round(nextCols)));
  let weights;
  if (cols === 1) weights = [1];
  else if (cols === 2) weights = [1, 1];
  else if (cols === 3) weights = state.topic === "product" ? [1, 2, 1] : [1, 1, 1];
  else weights = [1, 1, 1, 1];
  return {
    ...state,
    cols,
    weights: normalizeWeights(weights, cols),
    heroSpan: Math.min(Math.max(1, state.heroSpan), cols),
    activeDivider: Math.min(state.activeDivider, Math.max(0, cols - 2))
  };
}

// 拖动第 idx 条栏缝（0..cols-2），按逻辑坐标 deltaNorm 调整左右相邻两栏的权重
export function dragDivider(state, idx, nextBoundaryNorm) {
  if (state.cols < 2 || idx < 0 || idx >= state.cols - 1) return state;
  const w = normalizeWeights(state.weights, state.cols);
  const total = w.reduce((a, b) => a + b, 0);
  // 计算当前各栏累加归一化边界 [0, b1, b2, ..., 1]
  const bounds = [0];
  let acc = 0;
  for (let i = 0; i < w.length; i++) {
    acc += w[i] / total;
    bounds.push(acc);
  }
  const minTrack = 0.09; // 允许拖成极窄错态（最低 9% 总宽 ≈ 4–5 字），方便亲手试错！
  const lo = bounds[idx] + minTrack;
  const hi = bounds[idx + 2] - minTrack;
  let clamped = Math.max(lo, Math.min(hi, nextBoundaryNorm));

  // 轻度吸附到整洁网格点（1/2、1/3、2/3、1/4、3/4）方便用户精准对出 1:1、1:2:1 等
  const snapTargets = state.cols === 2 ? [0.5, 1 / 3, 2 / 3]
    : state.cols === 3 ? [0.25, 1 / 3, 0.5, 2 / 3, 0.75]
    : [0.25, 0.5, 0.75];
  for (const t of snapTargets) {
    if (t > lo + 0.01 && t < hi - 0.01 && Math.abs(clamped - t) < 0.014) {
      clamped = t;
      break;
    }
  }

  const nextBounds = [...bounds];
  nextBounds[idx + 1] = clamped;
  const nextWeights = [];
  for (let i = 0; i < state.cols; i++) {
    nextWeights.push((nextBounds[i + 1] - nextBounds[i]) * state.cols);
  }
  return {
    ...state,
    weights: normalizeWeights(nextWeights, state.cols),
    activeDivider: idx
  };
}

// 单一真源几何与诊断计算
export function evaluateBoard(state) {
  const cols = state.cols;
  const weights = normalizeWeights(state.weights, cols);
  const topic = TOPICS[state.topic] || TOPICS.magazine;
  const marginX = Math.round((LOGICAL_W * state.marginPct) / 100);
  const marginY = Math.round(Math.max(20, Math.min(64, marginX * 0.72)));
  const gutterPx = cols > 1 ? state.gutterPx : 0;
  const innerW = LOGICAL_W - marginX * 2;
  const innerH = LOGICAL_H - marginY * 2;
  const netColsW = Math.max(120, innerW - gutterPx * (cols - 1));
  const sumW = weights.reduce((a, b) => a + b, 0);

  const columns = [];
  const gutters = [];
  let cursorX = marginX;
  for (let i = 0; i < cols; i++) {
    const colW = (weights[i] / sumW) * netColsW;
    // 估算中文正文每行字数（减去左右 6px 光学微衬后除以 14px 字宽）
    const chars = Math.max(3, Math.floor((colW - 6) / BODY_FONT_PX));
    columns.push({
      index: i,
      x: cursorX,
      y: marginY,
      w: colW,
      h: innerH,
      weight: weights[i],
      chars
    });
    cursorX += colW;
    if (i < cols - 1) {
      gutters.push({
        index: i,
        x: cursorX,
        y: marginY,
        w: gutterPx,
        h: innerH,
        centerX: cursorX + gutterPx / 2,
        normBoundary: columns.slice(0, i + 1).reduce((s, c) => s + c.weight, 0) / sumW
      });
      cursorX += gutterPx;
    }
  }

  const charCounts = columns.map((c) => c.chars);
  const minChars = Math.min(...charCounts);
  const maxChars = Math.max(...charCounts);
  const minColW = Math.min(...columns.map((c) => c.w));
  const maxColW = Math.max(...columns.map((c) => c.w));
  const widthRatio = maxColW / Math.max(1, minColW);
  const gutterRatio = cols > 1 ? gutterPx / LINE_HEIGHT_PX : 0;
  const offGridPx = state.aligned ? 0 : 18;
  const ratioText = formatRatio(weights);

  // 4 项验收柱（直接对应 195 原海报底部四大设计要点）
  const topicColOk = topic.preferredCols.includes(cols);
  const minCharsFloor = cols >= 4 ? 9 : 10;
  const maxCharsCeil = cols === 1 ? 36 : 38;
  const fitOk = cols >= 2 && topicColOk && minChars >= minCharsFloor && maxChars <= maxCharsCeil;

  const alignOk = state.aligned === true;

  // 栏距秩序（对应「精准对齐 / 节奏与留白」中的接近律防串行，单栏不满足多栏网格）
  const gutterOk = cols >= 2 && gutterPx >= 20 && gutterPx <= 44;

  // 留白与平衡（页边距 6%–17% 且无极端畸形栏比 <= 2.6×）
  const rhythmOk = state.marginPct >= 6 && state.marginPct <= 17 && widthRatio <= 2.6 && cols >= 2;

  const checks = {
    fit: {
      ok: fitOk,
      label: "灵活适配",
      tag: cols === 1
        ? "退回单栏"
        : minChars < minCharsFloor
        ? `窄栏 ${minChars} 字`
        : !topicColOk
        ? `${cols} 栏错配`
        : maxChars > maxCharsCeil
        ? `宽栏 ${maxChars} 字`
        : `${cols} 栏 · ${ratioText}`
    },
    align: {
      ok: alignOk,
      label: "精准对齐",
      tag: alignOk ? "贴齐栏线 0px" : `脱栏 +${offGridPx}px`
    },
    gutter: {
      ok: gutterOk,
      label: "防串行栏缝",
      tag: cols === 1
        ? "无栏缝"
        : gutterPx < 20
        ? `仅 ${gutterPx}px 串行`
        : gutterPx > 44
        ? `${gutterPx}px 撕裂`
        : `${gutterPx}px (${gutterRatio.toFixed(1)}×)`
    },
    rhythm: {
      ok: rhythmOk,
      label: "节奏与留白",
      tag: state.marginPct < 6
        ? `边距 ${state.marginPct}% 窒息`
        : state.marginPct > 17
        ? `边距 ${state.marginPct}% 过宽`
        : widthRatio > 2.6
        ? `宽差 ${widthRatio.toFixed(1)}× 失衡`
        : `边距 ${state.marginPct}% · 均衡`
    }
  };

  const passCount = Object.values(checks).filter((c) => c.ok).length;

  // 按视觉灾难严重程度优先生成白话诊单
  let statusKind = "ok";
  let badge = "秩序就位 · 4 / 4";
  let title = `${topic.label}${cols}栏秩序成立（${ratioText}）`;
  let reason = `栏距 ${gutterPx}px（行距的 ${gutterRatio.toFixed(2)} 倍）稳稳隔开左右两栏，最窄栏能容 ${minChars} 字不断行，主图与金黄引语严丝合缝贴在栏线上，边距 ${state.marginPct}% 给整页留出了呼吸。`;
  let action = "试试切换其他题材（如产品三栏、数据四栏），或把栏缝故意拉窄到 10px 体验跨栏串行。";

  if (cols === 1) {
    statusKind = "error";
    badge = `错态 · 退回单栏 (${passCount}/4)`;
    title = `现在是单栏手稿，单行拉长到 ${maxChars} 字`;
    reason = `所有内容铺成一长条，横向对比和主次分层都消失了；每行 ${maxChars} 个汉字远超舒适扫读跨度，视线回扫吃力（单栏长文属于 194 手稿网格的范畴）。`;
    action = `点击画板上方的「2 栏」或「3 栏」按钮切回分栏结构（${topic.label}推荐 ${topic.recommendedText}）。`;
  } else if (gutterPx < 20) {
    statusKind = "error";
    badge = `错态 · 跨栏串行 (${passCount}/4)`;
    title = `栏缝只有 ${gutterPx}px，比正文行距（${LINE_HEIGHT_PX}px）还窄`;
    reason = `大脑按距离远近归组：左右两栏文字只隔 ${gutterPx}px，上下两行却隔 ${LINE_HEIGHT_PX}px。读者读完左栏第一行，视线会直接跳过窄缝串读到右栏同一行。`;
    action = `把画板下方「栏间距 Gutter」滑块拉到 20–36px（≥ 1.0× 行距），切断赤红串行线。`;
  } else if (gutterPx > 44) {
    statusKind = "error";
    badge = `错态 · 栏缝撕裂 (${passCount}/4)`;
    title = `栏缝拉到 ${gutterPx}px（行距 ${gutterRatio.toFixed(1)} 倍），页面散成孤柱`;
    reason = `栏间距大到像一条空白沟壑，各栏之间失去呼应，读起来不像同一篇文章或同一组对比，同时把栏内文字挤窄到只剩 ${minChars} 字/行。`;
    action = `把「栏间距 Gutter」收回到 22–36px 经验舒适带，让各栏既分明又互相照应。`;
  } else if (minChars < minCharsFloor) {
    statusKind = "error";
    badge = `错态 · 窄栏碎裂 (${passCount}/4)`;
    title = `最窄栏每行只剩 ${minChars} 个汉字，句子被切得支离破碎`;
    reason = `当前栏比 ${ratioText} 把局部栏宽压到仅 ${Math.round(minColW)}px。一句话刚起头就得换行，标点挤成一团，眼球高频折返极易疲劳。`;
    action = `直接在画布上左右拖动蓝色栏缝竖轨拉开窄栏，或换用更适合${topic.label}的栏数（${topic.recommendedText}）。`;
  } else if (!alignOk) {
    statusKind = "error";
    badge = `错态 · 元素脱栏 (${passCount}/4)`;
    title = `主图与金黄引语偏离栏线 +${offGridPx}px，卡在栏缝中央`;
    reason = `分栏之所以显得利落，是因为所有视觉边缘都落在同一套垂直栏轨上。元素一旦半悬在栏缝里，整页建立好的垂直秩序轴立刻发飘。`;
    action = `点击画板上方「吸附对齐栏线」（或直接点一下画布里的主图/引语块），让它们咔嗒贴齐栏边。`;
  } else if (state.marginPct < 6) {
    statusKind = "error";
    badge = `错态 · 贴边窒息 (${passCount}/4)`;
    title = `页边距仅 ${state.marginPct}%（${marginX}px），文字死顶着纸边`;
    reason = `四周几乎没有缓冲空白，外侧栏文字直接撞向画框边缘，压迫感极强，也难以把内容区与外界环境隔开。`;
    action = `把下方「页边距 Margin」滑块调到 7%–14%，让分栏骨架在纸面上喘口气。`;
  } else if (state.marginPct > 17) {
    statusKind = "error";
    badge = `错态 · 留白吞栏 (${passCount}/4)`;
    title = `页边距占到 ${state.marginPct}%，把多栏挤缩在中间`;
    reason = `左右两块空白切掉了 ${state.marginPct * 2}% 的总宽，多栏内容被迫缩窄，空间利用率大幅下降。`;
    action = `把「页边距 Margin」收回至 7%–15%，把空间还给分栏正文。`;
  } else if (!topicColOk) {
    statusKind = "error";
    badge = `错态 · 栏数错配 (${passCount}/4)`;
    title = `${topic.label}硬套 ${cols} 栏，节奏与信息结构不搭`;
    reason = state.topic === "magazine"
      ? `杂志图文既有大图又有连续段落，切成 4 栏后正文太碎、大图跨栏割裂；换用 2 栏（如 1:1）或 3 栏（如 1:2:1）才舒展。`
      : state.topic === "data"
      ? `四组数据指标需要横向并排比大小，当前 ${cols} 栏装不下完整并列，视觉扫读被迫折行。`
      : `${topic.label}更适合 ${topic.recommendedText}，当前 ${cols} 栏没能把内容层级摊开。`;
    action = `点击上方栏数按钮切换到 ${topic.preferredCols.join(" 或 ")} 栏，感受信息节奏立刻理顺。`;
  } else if (widthRatio > 2.6) {
    statusKind = "error";
    badge = `错态 · 栏比失衡 (${passCount}/4)`;
    title = `最宽栏是最窄栏的 ${widthRatio.toFixed(1)} 倍（${ratioText}）`;
    reason = `栏宽差距拉得过大，窄栏显得局促寒酸，宽栏又像一块突兀的大补丁，整页重心向一侧倾倒。`;
    action = `左右拖动蓝色栏缝，把宽窄栏差距收进 2.5 倍以内（如 1 : 2 : 1 或 2 : 1）。`;
  } else if (maxChars > maxCharsCeil) {
    statusKind = "error";
    badge = `错态 · 宽栏过长 (${passCount}/4)`;
    title = `最宽栏达到 ${maxChars} 字/行，接近单栏回扫疲劳线`;
    reason = `单栏过宽会削弱分栏缩短行长的好处，视线在行尾回头找下一行起点时容易串行。`;
    action = `把过宽的那一栏拖窄一些，或适当增加栏数把行长收回 12–30 字经验舒适带。`;
  }

  return {
    topic,
    cols,
    weights,
    ratioText,
    marginX,
    marginY,
    gutterPx,
    gutterRatio,
    innerW,
    innerH,
    columns,
    gutters,
    minChars,
    maxChars,
    minColW: Math.round(minColW),
    maxColW: Math.round(maxColW),
    widthRatio,
    offGridPx,
    checks,
    passCount,
    statusKind,
    badge,
    title,
    reason,
    action,
    crossReadRisk: cols >= 2 && gutterPx < 20,
    splitRisk: cols >= 2 && gutterPx > 44
  };
}

// 03 节：12 栏母网格切分计算
export function evaluate12Grid(cuts) {
  // cuts 是 1..11 之间的升序分割点（在 12 格里的列边界）
  const sorted = [...new Set(cuts.filter((c) => c >= 1 && c <= 11))].sort((a, b) => a - b);
  const pts = [0, ...sorted, 12];
  const spans = [];
  for (let i = 0; i < pts.length - 1; i++) spans.push(pts[i + 1] - pts[i]);
  const g = spans.reduce((a, b) => gcd(a, b));
  const ratio = spans.map((s) => s / g).join(" : ");
  const minSpan = Math.min(...spans);
  const equal = spans.every((s) => s === spans[0]);
  const symmetric = spans.every((s, i) => s === spans[spans.length - 1 - i]);

  let verdict = "";
  let fit = "";
  if (spans.length === 1) {
    verdict = "整页 12 格合并为单栏，适合沉浸长文（194 手稿网格），未发挥 12 栏拆分优势。";
    fit = "单栏通幅";
  } else if (minSpan === 1) {
    verdict = "出现仅占 1/12 宽的极窄栏（桌面 1200px 下仅约 70px），只能塞序号或图标，放正文必碎。";
    fit = "极窄辅助槽";
  } else if (spans.length === 2 && ratio === "1 : 1") {
    verdict = "6 + 6 均分双栏（海报建议 1 : 1）：左右权重完全对等，适合对比、访谈与图文并茂。";
    fit = "双栏均衡对比";
  } else if (spans.length === 2) {
    verdict = `${spans.join(" + ")} 非对称双栏（${ratio}）：一主一辅，宽栏走正文或大图，窄栏装目录、旁注或卡片。`;
    fit = "主文 + 侧栏";
  } else if (spans.length === 3 && ratio === "1 : 2 : 1") {
    verdict = "3 + 6 + 3 经典主次三栏（海报建议 1 : 2 : 1）：中间主内容区占一半宽度，两侧放导航、注释或延伸模块。";
    fit = "三栏主次分层";
  } else if (spans.length === 3 && equal) {
    verdict = "4 + 4 + 4 等宽三栏（1 : 1 : 1）：三组信息平权展开，最常用于产品特性与三栏报刊正文。";
    fit = "三栏并列特性";
  } else if (spans.length === 4 && equal) {
    verdict = "3 + 3 + 3 + 3 等宽四栏（海报建议 1 : 1 : 1 : 1）：紧凑高效，适合数据卡片、步骤流程与商品列表。";
    fit = "四栏密集对照";
  } else if (spans.length === 6 && equal) {
    verdict = "每栏 2 格的 6 栏高密骨架：适合图库缩略图、徽标墙或复合网格的细粒度切分。";
    fit = "六栏高密阵";
  } else if (spans.length > 6) {
    verdict = `已切成 ${spans.length} 栏，单栏普遍过窄，信息显得碎片化，建议合并部分断点回到 2–4 栏。`;
    fit = "切分过碎";
  } else {
    verdict = `${spans.length} 栏自定义组合（格数 ${spans.join(" / ")}，比例 ${ratio}）${symmetric ? "，左右对称" : "，呈非对称节奏"}——这正是 12 能同时被 2、3、4、6 整除的威力。`;
    fit = symmetric ? "对称多栏" : "非对称混栏";
  }

  return { spans, ratio, equal, symmetric, minSpan, verdict, fit };
}

// 05 节：视口变窄时的响应式折栏对比（单真源）
export function evaluateResponsive(viewportPx) {
  const vw = Math.max(360, Math.min(1440, Math.round(viewportPx)));
  // 方案 A：死扛 4 栏不折（硬等比缩）
  const fixedMargin = Math.round(vw * 0.05);
  const fixedGutter = Math.max(8, Math.round(vw * 0.018));
  const fixedColW = Math.round((vw - fixedMargin * 2 - fixedGutter * 3) / 4);
  const fixedChars = Math.max(2, Math.floor((fixedColW - 10) / 14));

  // 方案 B：按最小可读栏宽（约 240px）折栏：>= 960 四栏，>= 620 双栏，< 620 单栏
  const smartCols = vw >= 960 ? 4 : vw >= 620 ? 2 : 1;
  const smartMargin = vw >= 960 ? 48 : vw >= 620 ? 32 : 20;
  const smartGutter = smartCols === 1 ? 0 : vw >= 960 ? 24 : 20;
  const smartColW = Math.round((vw - smartMargin * 2 - smartGutter * (smartCols - 1)) / smartCols);
  const smartChars = Math.max(6, Math.floor((smartColW - 14) / 14));

  const device = vw >= 1120 ? "桌面宽屏" : vw >= 960 ? "小屏笔记本" : vw >= 620 ? "竖屏平板" : "手机竖屏";
  const fixedVerdict = fixedColW < 150
    ? `每栏缩成 ${fixedColW}px（仅 ${fixedChars} 字/行），标题断成竖条，完全不可读`
    : fixedColW < 210
    ? `每栏 ${fixedColW}px（约 ${fixedChars} 字/行），已经明显偏紧`
    : `每栏 ${fixedColW}px（约 ${fixedChars} 字/行），桌面下尚可`;
  const smartVerdict = smartCols === 4
    ? `4 栏全展开，每栏 ${smartColW}px（约 ${smartChars} 字），横向扫读效率高`
    : smartCols === 2
    ? `自动折成 2×2 双栏，每栏回到 ${smartColW}px（约 ${smartChars} 字），舒服耐读`
    : `自动合回单栏全宽 ${smartColW}px（约 ${smartChars} 字），手指竖滑无压力`;

  return {
    vw,
    device,
    fixed: { cols: 4, margin: fixedMargin, gutter: fixedGutter, colW: fixedColW, chars: fixedChars, bad: fixedColW < 170, verdict: fixedVerdict },
    smart: { cols: smartCols, margin: smartMargin, gutter: smartGutter, colW: smartColW, chars: smartChars, verdict: smartVerdict }
  };
}

// 08 节：小练习四选项单真源（标签全中性，只差单一关键变量）
export const QUIZ_OPTIONS = [
  {
    id: "A",
    ratio: [1, 2, 1],
    gutterPx: 12,
    aligned: true,
    label: "A · 1 : 2 : 1 · 栏距 12px · 贴齐栏线",
    correct: false,
    feedback: "比例和贴栏都没毛病，但陷阱藏在栏距里：正文行距是 24px，栏距却只有 12px（行距的一半）。按照接近律，相邻两栏的文字比上下两行更近，读完左栏第一行极易直接串读进中栏。"
  },
  {
    id: "B",
    ratio: [1, 2, 1],
    gutterPx: 32,
    aligned: true,
    label: "B · 1 : 2 : 1 · 栏距 32px · 贴齐栏线",
    correct: true,
    feedback: "选对了。栏距 32px 是行距（24px）的 1.33 倍，稳稳拉开栏际边界又不散架；1 : 2 : 1 让中栏主文行长从容、两侧辅栏收束利落；通栏标题与右栏引语全部紧贴栏线，秩序一目了然。"
  },
  {
    id: "C",
    ratio: [1, 2, 1],
    gutterPx: 96,
    aligned: true,
    label: "C · 1 : 2 : 1 · 栏距 96px · 贴齐栏线",
    correct: false,
    feedback: "为了防止串行把栏距拉得太猛了：96px 宽到正文行距的 4 倍，两道白沟把页面硬生生切成了三根互不关联的孤柱，反而挤窄了两侧辅栏的可读宽度。"
  },
  {
    id: "D",
    ratio: [1, 1, 1],
    gutterPx: 32,
    aligned: false,
    label: "D · 1 : 1 : 1 · 栏距 32px · 引语居中悬空",
    correct: false,
    feedback: "栏距本身合适，但犯了两个分栏大忌：引语框脱离开栏线直接横压在栏缝正中，垂直对齐轴被当场破坏；同时三栏 1 : 1 : 1 抹平了主文与双侧辅栏的轻重对比。"
  }
];

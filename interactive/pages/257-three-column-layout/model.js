// 257 三列页面 · 单真源几何、折行与诊断引擎（开场工作台、响应折叠台、练习题共用）

export const SCENARIOS = {
  editorial: {
    id: "editorial",
    label: "图文信息",
    en: "EDITORIAL TRIAD",
    siteTitle: "城市建筑季刊 · ISSUE 09",
    primaryMod: 1,
    modules: [
      {
        id: 0,
        role: "nav",
        roleLabel: "目录索引",
        tag: "INDEX",
        title: "本期章节导航",
        visual: "nav",
        body: "01 空间尺度与动线 · 02 自然采光与立面 · 03 混凝土结构节律 · 04 公共中庭案例",
        bullets: ["01 空间尺度与动线", "02 自然采光与立面", "03 混凝土结构节律", "04 公共中庭案例"],
      },
      {
        id: 1,
        role: "primary",
        roleLabel: "核心正文",
        tag: "FEATURE",
        title: "三列如何撑起长篇专题",
        visual: "arch",
        body: "把宽屏拆成左索引、中正文、右图注三段后，读者不用来回翻页就能同时看到目录坐标与配图细节，中轴正文也能稳稳落在舒适行宽内，视线节奏明快而不疲惫。",
        bullets: ["中轴正文保持舒适行宽", "左侧固定目录坐标", "右侧承接图注与延展"],
      },
      {
        id: 2,
        role: "aside",
        roleLabel: "配图延展",
        tag: "VISUAL",
        title: "立面采样与图注",
        visual: "media",
        body: "苏黎世现代主义出版物常以窄侧栏承接照片图注与尺寸标注，让主文呼吸从容，视线轻扫即可对照。",
        bullets: ["采样：南向立面透光率", "注解：柱网模数 1:2:1"],
      },
    ],
  },
  data: {
    id: "data",
    label: "数据展示",
    en: "COMPARISON MATRIX",
    siteTitle: "团队协作云 · 方案对照",
    primaryMod: 1,
    modules: [
      {
        id: 0,
        role: "tier",
        roleLabel: "基础版",
        tag: "STARTER",
        title: "标准协作方案",
        visual: "chart-a",
        metric: "¥98 / 月",
        body: "适合 3–8 人小型设计工作室，包含云端文档同步、基础版本回溯与三列看板模板。",
        bullets: ["5 位协作成员", "20 GB 素材空间", "30 天历史快照"],
      },
      {
        id: 1,
        role: "primary",
        roleLabel: "推荐主推",
        tag: "POPULAR",
        title: "专业团队方案",
        visual: "chart-b",
        metric: "¥268 / 月",
        body: "为跨职能设计团队准备的主推配置，提供完整组件库权限、实时审稿批注与多端预览。",
        bullets: ["25 位协作成员", "500 GB 共享库", "无限版本与审稿"],
      },
      {
        id: 2,
        role: "tier",
        roleLabel: "企业版",
        tag: "ENTERPRISE",
        title: "大型组织定制",
        visual: "chart-c",
        metric: "¥680 / 月",
        body: "面向多品牌事业部与研发集群，支持私有化审计日志、单点登录与专属技术顾问。",
        bullets: ["不限成员席位", "独立加密存储", "专属架构支持"],
      },
    ],
  },
  profile: {
    id: "profile",
    label: "人物介绍",
    en: "SPEAKER SHOWCASE",
    siteTitle: "字体与网格年会 · 主讲档案",
    primaryMod: 1,
    modules: [
      {
        id: 0,
        role: "aside",
        roleLabel: "人物剪影",
        tag: "PORTRAIT",
        title: "林叙白 · 编排顾问",
        visual: "silhouette",
        body: "十五年出版与数字系统网格经验，长期关注中文信息密度与跨端版面节奏。",
        bullets: ["常驻：上海 / 苏黎世", "研究：多栏阅读节奏"],
      },
      {
        id: 1,
        role: "primary",
        roleLabel: "经历与演讲",
        tag: "KEYNOTE",
        title: "从铅字栏架到屏幕轨道",
        visual: "timeline",
        body: "本次演讲梳理瑞士三栏出版网格如何过渡到现代网页多窗格工作台，拆解信息分区、对比克制与窄屏降级三条底线，带观众现场重排真实业务页面。",
        bullets: ["14:00 主题演讲 · 主会场", "15:20 现场版面改稿工坊"],
      },
      {
        id: 2,
        role: "aside",
        roleLabel: "代表亮点",
        tag: "HIGHLIGHTS",
        title: "代表作品与出版",
        visual: "badges",
        body: "主持过四套大型媒体客户端与百科阅读器改版，著有版式结构案例手册两册。",
        bullets: ["年度字体编排评委", "两套开源排版规范作者"],
      },
    ],
  },
};

export const INITIAL_STATE = {
  scenario: "editorial",
  s1: 0.49,
  s2: 0.67,
  gutter: 6,
  viewport: 1120,
  contrast: "flat", // "flat" | "focal" | "clash"
  aligned: false,
  order: [0, 1, 2],
  focusSlot: 1,
  showGuides: true,
};

export const PRESETS = {
  centerAxis: {
    label: "对称主轴解",
    hint: "24 : 52 : 24",
    kind: "good",
    apply: (cur) => ({
      ...cur,
      s1: 0.24,
      s2: 0.76,
      gutter: 24,
      viewport: 1200,
      contrast: "focal",
      aligned: true,
      order: [0, 1, 2],
      focusSlot: 1,
    }),
  },
  equalThirds: {
    label: "等宽对比解",
    hint: "33 : 34 : 33",
    kind: "good",
    apply: (cur) => ({
      ...cur,
      s1: 0.33,
      s2: 0.67,
      gutter: 24,
      viewport: 1200,
      contrast: "focal",
      aligned: true,
      order: [0, 1, 2],
      focusSlot: 1,
    }),
  },
  leftHeavy: {
    label: "左重主副解",
    hint: "48 : 28 : 24",
    kind: "good",
    apply: (cur) => ({
      ...cur,
      s1: 0.48,
      s2: 0.76,
      gutter: 22,
      viewport: 1200,
      contrast: "focal",
      aligned: true,
      order: [1, 0, 2],
      focusSlot: 0,
    }),
  },
  trapNarrow: {
    label: "试错：窄屏硬撑",
    kind: "trap",
    apply: (cur) => ({
      ...cur,
      s1: 0.33,
      s2: 0.67,
      gutter: 18,
      viewport: 560,
      contrast: "focal",
      aligned: true,
      order: [0, 1, 2],
      focusSlot: 1,
    }),
  },
  trapClash: {
    label: "试错：三列互抢",
    kind: "trap",
    apply: (cur) => ({
      ...cur,
      s1: 0.25,
      s2: 0.75,
      gutter: 24,
      viewport: 1200,
      contrast: "clash",
      aligned: true,
      order: [0, 1, 2],
      focusSlot: 1,
    }),
  },
  trapGap: {
    label: "试错：宽缝割裂",
    kind: "trap",
    apply: (cur) => ({
      ...cur,
      s1: 0.26,
      s2: 0.74,
      gutter: 52,
      viewport: 1200,
      contrast: "focal",
      aligned: true,
      order: [0, 1, 2],
      focusSlot: 1,
    }),
  },
  resetBroken: {
    label: "复原开场错态",
    kind: "reset",
    apply: (cur) => ({
      ...INITIAL_STATE,
      scenario: cur.scenario,
      showGuides: cur.showGuides,
    }),
  },
};

export function clampState(s) {
  const minW = 0.11;
  let s1 = Math.max(minW, Math.min(1 - 2 * minW, Number(s.s1) || 0.33));
  let s2 = Math.max(s1 + minW, Math.min(1 - minW, Number(s.s2) || 0.67));
  s1 = Math.round(s1 * 100) / 100;
  s2 = Math.round(s2 * 100) / 100;
  if (s2 - s1 < minW) {
    s2 = Math.min(1 - minW, Math.round((s1 + minW) * 100) / 100);
    s1 = Math.max(minW, Math.round((s2 - minW) * 100) / 100);
  }
  return {
    ...s,
    s1,
    s2,
    gutter: Math.max(4, Math.min(56, Math.round(Number(s.gutter) || 6))),
    viewport: Math.max(520, Math.min(1440, Math.round(Number(s.viewport) || 1120))),
    focusSlot: Math.max(0, Math.min(2, Number(s.focusSlot) || 0)),
  };
}

// 统一的逐字折行函数（供 model 估算行宽与 Canvas 实绘共用）
export function wrapTextUnits(text, maxChars) {
  const cap = Math.max(3, Math.floor(maxChars));
  const lines = [];
  let line = "";
  let units = 0;
  for (const ch of text) {
    const u = /[\u4e00-\u9fff\uff00-\uffef\u3000-\u303f]/.test(ch) ? 1 : 0.56;
    if (units + u > cap && line.length > 0) {
      lines.push(line);
      line = ch === " " ? "" : ch;
      units = ch === " " ? 0 : u;
    } else {
      line += ch;
      units += u;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// 单真源评估函数：从实算像素宽、行字数、双缝距、重心与角色配置推出所有读数与诊断
export function evaluateLayout(rawState) {
  const st = clampState(rawState);
  const sc = SCENARIOS[st.scenario] || SCENARIOS.editorial;
  const fracs = [st.s1, +(st.s2 - st.s1).toFixed(2), +(1 - st.s2).toFixed(2)];
  const pcts = [
    Math.round(fracs[0] * 100),
    Math.round(fracs[1] * 100),
    100 - Math.round(fracs[0] * 100) - Math.round(fracs[1] * 100),
  ];

  // 模拟网页内容区宽度（去掉外页边距）
  const innerW = Math.min(st.viewport - 48, 1180);
  const trackTotal = Math.max(300, innerW - st.gutter * 2);
  const colPx = fracs.map((f) => Math.round(trackTotal * f));
  const bodyFont = 14;
  const bodyLeading = 22;
  const padX = 28; // 每列左右内边距合计

  const cols = [0, 1, 2].map((slot) => {
    const mod = sc.modules[st.order[slot]];
    const px = colPx[slot];
    const textW = Math.max(48, px - padX);
    const cpl = Math.max(3, Math.round(textW / bodyFont));
    const lines = wrapTextUnits(mod.body, cpl);
    const isFocus = st.contrast === "focal" && st.focusSlot === slot;
    const isPrimary = mod.id === sc.primaryMod;
    // 视觉墨量权重：宽度占比 + 焦点色彩权重 + 图块/角色权重
    const fillBoost = st.contrast === "clash" ? 0.24 : isFocus ? 0.28 : 0.06;
    const roleBoost = isPrimary ? 0.16 : 0.09;
    const mass = fracs[slot] * 0.65 + fillBoost + roleBoost;
    const topOffset = st.aligned ? 0 : slot === 0 ? 0 : slot === 1 ? 26 : 12;
    return {
      slot,
      mod,
      pct: pcts[slot],
      frac: fracs[slot],
      px,
      cpl,
      lineCount: lines.length,
      lines,
      isFocus,
      isPrimary,
      mass,
      topOffset,
    };
  });

  const primaryCol = cols.find((c) => c.isPrimary) || cols[1];
  const minCol = cols.reduce((a, b) => (a.px < b.px ? a : b));
  const maxCol = cols.reduce((a, b) => (a.px > b.px ? a : b));

  // 视觉重心矩（-1 极左，0 居中，+1 极右）
  const totalMass = cols.reduce((a, c) => a + c.mass, 0);
  const cog = (cols[0].mass * -1 + cols[2].mass * 1) / Math.max(0.01, totalMass);

  // 识别结构模式
  const maxDiffPct = Math.max(...pcts) - Math.min(...pcts);
  const wingDiff = Math.abs(pcts[0] - pcts[2]);
  const isEqualMode = maxDiffPct <= 10;
  const isCenterAxis = wingDiff <= 9 && pcts[1] >= 38 && primaryCol.slot === 1;
  const isLeftLed = pcts[0] >= 40 && pcts[0] >= pcts[1] + 8 && Math.abs(pcts[1] - pcts[2]) <= 12 && primaryCol.slot === 0;
  const isRightLed = pcts[2] >= 40 && pcts[2] >= pcts[1] + 8 && Math.abs(pcts[0] - pcts[1]) <= 12 && primaryCol.slot === 2;

  const issues = [];

  // 1) 双缝距检查（双向：过窄串行 / 过宽割裂）
  const gutterRatio = +(st.gutter / bodyLeading).toFixed(2);
  let gutterOk = true;
  if (st.gutter < 14) {
    gutterOk = false;
    issues.push({
      id: "gutter_tight",
      pillar: "spacing",
      severity: 100,
      short: `双缝仅 ${st.gutter}px`,
      headline: `双道列缝仅 ${st.gutter}px，眼睛会横穿跨列串行`,
      why: `当前正文行距 ${bodyLeading}px，而列间缝距只有 ${st.gutter}px（仅行距的 ${gutterRatio}×）。按格式塔临近性原则，相邻两列的字距比上下行距还近，扫读时视线会直接横跳进隔壁列。`,
      action: "把「双缝距」拉开到 18–32px（约 0.9×–1.5× 行距），建立清晰透气走廊。",
      fixLabel: "拉开双缝距至 24px",
      fix: (s) => ({ ...s, gutter: 24 }),
    });
  } else if (st.gutter > 44) {
    gutterOk = false;
    issues.push({
      id: "gutter_wide",
      pillar: "spacing",
      severity: 85,
      short: `宽缝割裂 ${st.gutter}px`,
      headline: `双缝拉宽到 ${st.gutter}px，页面裂成三张孤立纸条`,
      why: `列缝太宽时，横向空间被白白吃掉 ${st.gutter * 2}px，三列之间的视觉联系被切断，眼睛在各列间横跳距离过长，节奏感散掉。`,
      action: "把「双缝距」收回 18–32px，既防串行又保住三列的整体连贯。",
      fixLabel: "收紧双缝距至 24px",
      fix: (s) => ({ ...s, gutter: 24 }),
    });
  }

  // 2) 栏宽与角色匹配（双向：过窄碎字 / 过宽超 WCAG / 角色倒挂）
  let widthsOk = true;
  if (minCol.px < 170) {
    widthsOk = false;
    const isViewportTooNarrow = st.viewport < 780;
    issues.push({
      id: isViewportTooNarrow ? "viewport_crunch" : "col_crushed",
      pillar: "roles",
      severity: 98,
      short: isViewportTooNarrow ? `窄屏挤碎 ${minCol.px}px` : `${minCol.mod.roleLabel}仅 ${minCol.px}px`,
      headline: isViewportTooNarrow
        ? `${st.viewport}px 窄屏还硬撑三列，单列被挤碎到 ${minCol.px}px（约 ${minCol.cpl} 字/行）`
        : `「${minCol.mod.roleLabel}」被压到 ${minCol.px}px（约 ${minCol.cpl} 字/行），断行过于细碎`,
      why: isViewportTooNarrow
        ? `桌面三列需要充裕的水平总宽；把视口缩到 ${st.viewport}px 还不折叠，三列每人只剩不到 170px，一句话要折成七八行，根本没法顺畅扫读。`
        : `这一列只剩 ${minCol.pct}% 宽度，正文一行装不下 ${minCol.cpl + 1} 个汉字，高频回车折行让阅读节奏支离破碎。`,
      action: isViewportTooNarrow
        ? "切回 1200px 宽屏环境，或在下方「04 屏幕变窄怎么折叠」把三列降级为两列/单列。"
        : "拖动画布上的两条轨缝，保证最窄功能列至少达到 175px 以上。",
      fixLabel: isViewportTooNarrow ? "切回 1200px 桌面视口" : "拉开被挤窄的列宽",
      fix: (s) => (isViewportTooNarrow ? { ...s, viewport: 1200 } : { ...s, s1: 0.24, s2: 0.76 }),
    });
  } else if (!isEqualMode && primaryCol.px < maxCol.px - 24) {
    widthsOk = false;
    issues.push({
      id: "role_inverted",
      pillar: "roles",
      severity: 92,
      short: "主次栏宽倒挂",
      headline: `核心列「${primaryCol.mod.roleLabel}」反倒比辅助列「${maxCol.mod.roleLabel}」更窄`,
      why: `辅助列占了 ${maxCol.pct}%（${maxCol.px}px），而真正承载主信息的「${primaryCol.mod.roleLabel}」只剩 ${primaryCol.pct}%（${primaryCol.px}px，约 ${primaryCol.cpl} 字/行）。功能分区和空间配额拧着来，读者一眼会先掉进配角里。`,
      action: "把最宽轨道让给核心内容（拖双轨缝调成 24:52:24，或点顶部槽位调换列序）。",
      fixLabel: "把主宽轨道还给核心列",
      fix: (s) => ({ ...s, s1: 0.24, s2: 0.76, order: [0, 1, 2], focusSlot: 1 }),
    });
  } else if (primaryCol.cpl > 40) {
    widthsOk = false;
    issues.push({
      id: "col_too_wide",
      pillar: "roles",
      severity: 80,
      short: `主列过宽 ${primaryCol.cpl}字/行`,
      headline: `主列单行达到 ${primaryCol.cpl} 字，超过 WCAG 1.4.8 的 40 汉字上限`,
      why: `主列吃掉了 ${primaryCol.pct}% 宽度，左右双翼被挤成细边，既丢掉了三列的分工优势，又让长行回扫容易跳行。`,
      action: "向内收窄主列比例到 45%–56% 左右，让双翼与中轴各自舒展。",
      fixLabel: "收回主列至 52% 黄金宽",
      fix: (s) => ({ ...s, s1: 0.24, s2: 0.76 }),
    });
  } else if (primaryCol.cpl < 14 && sc.id !== "data") {
    widthsOk = false;
    issues.push({
      id: "primary_narrow",
      pillar: "roles",
      severity: 86,
      short: `正文仅 ${primaryCol.cpl}字/行`,
      headline: `核心正文每行只有约 ${primaryCol.cpl} 个字，视线频繁折返`,
      why: `三列正文需要留足 15–38 字/行的舒适扫读带，当前只剩 ${primaryCol.px}px 宽，短句被切得零零碎碎。`,
      action: "拉宽核心列占比，让正文宽度回到 280px 以上。",
      fixLabel: "展宽核心正文列",
      fix: (s) => ({ ...s, s1: 0.24, s2: 0.76, order: [0, 1, 2] }),
    });
  }

  // 3) 视觉对比与主焦层级（双向：全平无差 / 三列互抢 / 焦点错指）
  let contrastOk = true;
  if (st.contrast === "flat") {
    contrastOk = false;
    issues.push({
      id: "contrast_flat",
      pillar: "hierarchy",
      severity: 90,
      short: "全平无主次",
      headline: "三列底色与字重完全拉平，眼球找不到第一落点",
      why: "三列天生比双列多一个信息通道；如果三列长相一模一样，读者进入页面得逐列读完标题才知道主角在哪，效率反而下降。",
      action: "把「视觉对比」切到「单主突显」，只让一列主角亮出信号橙/钴蓝焦点。",
      fixLabel: "开启「单主突显」焦点",
      fix: (s) => ({ ...s, contrast: "focal", focusSlot: s.order.indexOf(sc.primaryMod) }),
    });
  } else if (st.contrast === "clash") {
    contrastOk = false;
    issues.push({
      id: "contrast_clash",
      pillar: "hierarchy",
      severity: 94,
      short: "三列互抢过载",
      headline: "三列同时铺满重色块，每列都在喊「先看我」",
      why: "对比的本质是「少数突出、多数退让」。当左、中、右三列同时上满高饱和钴蓝与信号橙时，反而抵消了反差，满屏高噪点让视线无所适从。",
      action: "克制对比，收回配角底色，只保留核心那一列作为单主视觉焦点。",
      fixLabel: "收束为「单主突显」",
      fix: (s) => ({ ...s, contrast: "focal", focusSlot: s.order.indexOf(sc.primaryMod) }),
    });
  } else if (cols[st.focusSlot].mod.id !== sc.primaryMod && sc.id !== "data") {
    contrastOk = false;
    issues.push({
      id: "focus_mismatch",
      pillar: "hierarchy",
      severity: 76,
      short: "焦点落在配角",
      headline: `视觉高亮给到了配角「${cols[st.focusSlot].mod.roleLabel}」，抢走了主角风头`,
      why: `读者视线会本能先落到最显眼的橙/蓝高亮列，现在高亮块落在辅助列，核心内容「${primaryCol.mod.roleLabel}」被晾在旁边。`,
      action: `点击画布中「${primaryCol.mod.roleLabel}」列的聚焦按钮，让视觉重音回到主角。`,
      fixLabel: "把焦点移回核心列",
      fix: (s) => ({ ...s, focusSlot: primaryCol.slot }),
    });
  }

  // 4) 平衡感与一致性（齐顶 + 结构节奏自洽）
  let balanceOk = true;
  if (!st.aligned) {
    balanceOk = false;
    issues.push({
      id: "misaligned_top",
      pillar: "balance",
      severity: 82,
      short: "顶沿参差错位",
      headline: "三列卡片顶沿高低错位，模块化秩序散了",
      why: "三列最怕「各自为政」：顶部基线一参差，横向扫视就被锯齿打断，页面瞬间显得凌乱不专业。",
      action: "打开「顶沿一致：齐顶」，让三列共享同一条水平起跑线。",
      fixLabel: "一键对齐三列顶沿",
      fix: (s) => ({ ...s, aligned: true }),
    });
  } else if (!isEqualMode && !isCenterAxis && !isLeftLed && !isRightLed) {
    balanceOk = false;
    issues.push({
      id: "rhythm_ambiguous",
      pillar: "balance",
      severity: 78,
      short: `配比失衡 ${pcts.join(":")}`,
      headline: `三列配比停在 ${pcts.join(":")}，既不对称均分又没拉开清晰主次`,
      why: `左右翼相差 ${wingDiff}%（重心偏向${cog < 0 ? "左侧" : "右侧"}），读者能一眼察觉歪斜却看不出意图。好的三列要么「对称中轴」(如 24:52:24)，要么「等宽对照」(如 33:34:33)，要么「主列领航」(如 48:28:24)。`,
      action: "拖双轨缝收匀左右翼（对称主轴 / 等宽对比），或把主列明确放到一侧领跑。",
      fixLabel: "收匀为 24:52:24 对称主轴",
      fix: (s) => ({ ...s, s1: 0.24, s2: 0.76, order: [0, 1, 2], focusSlot: 1 }),
    });
  }

  issues.sort((a, b) => b.severity - a.severity);
  const score = (widthsOk ? 1 : 0) + (gutterOk ? 1 : 0) + (contrastOk ? 1 : 0) + (balanceOk ? 1 : 0);

  let modeLabel = "失衡待校";
  if (score === 4) {
    if (isEqualMode) modeLabel = "等宽三列对照解";
    else if (isCenterAxis) modeLabel = "对称中轴主次解";
    else if (isLeftLed) modeLabel = "左重阶梯主副解";
    else modeLabel = "右重非对称平衡解";
  }

  const topIssue = issues[0] || null;
  const cogText =
    Math.abs(cog) < 0.06 ? "居中稳态" : cog < 0 ? `偏左 ${Math.round(Math.abs(cog) * 100)}%` : `偏右 ${Math.round(cog * 100)}%`;

  // 顶部三柱实时状态（对应原海报「信息层次清晰」「功能分区明确」「视觉对比强烈」）
  const pillars = {
    hierarchy: contrastOk
      ? { ok: true, badge: "主焦清晰" }
      : { ok: false, badge: st.contrast === "flat" ? "全平无差" : st.contrast === "clash" ? "三列互抢" : "焦点偏位" },
    roles: widthsOk
      ? { ok: true, badge: `主列 ${primaryCol.cpl}字/行` }
      : { ok: false, badge: minCol.px < 170 ? `挤碎 ${minCol.px}px` : primaryCol.cpl > 40 ? `过宽 ${primaryCol.cpl}字` : "主次倒挂" },
    contrast: gutterOk && balanceOk
      ? { ok: true, badge: `缝 ${st.gutter}px · 齐顶` }
      : { ok: false, badge: !gutterOk ? (st.gutter < 14 ? `串行 ${st.gutter}px` : `割裂 ${st.gutter}px`) : !st.aligned ? "顶沿错位" : `偏重 ${pcts.join(":")}` },
  };

  // 生成实时对应 CSS Grid 代码
  const cssGrid = `grid-template-columns: ${pcts[0]}fr ${pcts[1]}fr ${pcts[2]}fr; gap: ${st.gutter}px;`;

  return {
    state: st,
    scenario: sc,
    pcts,
    innerW,
    colPx,
    cols,
    primaryCol,
    minCol,
    maxCol,
    cog,
    cogText,
    gutterRatio,
    score,
    ok: score === 4,
    modeLabel,
    topIssue,
    issues,
    pillars,
    cssGrid,
    checks: { widthsOk, gutterOk, contrastOk, balanceOk },
  };
}

// ---------- 第 04 节：屏幕变窄折叠策略单真源算子 ----------
export function evaluateCollapse(viewportPx, strategy) {
  const vw = Math.max(360, Math.min(1440, Math.round(viewportPx)));
  const pad = vw < 600 ? 24 : 48;
  const inner = vw - pad;
  const gap = vw < 640 ? 12 : vw < 960 ? 16 : 24;

  let layoutMode = "3-col";
  let boxes = [];
  let verdict = "";
  let status = "ok"; // "ok" | "warn" | "bad"
  let css = "";

  if (strategy === "force3") {
    const colW = Math.round((inner - gap * 2) / 3);
    const cpl = Math.max(2, Math.round((colW - 20) / 14));
    boxes = [
      { name: "左导航", w: colW, row: 0, span: 1, cpl },
      { name: "中正文", w: colW, row: 0, span: 1, cpl },
      { name: "右辅栏", w: colW, row: 0, span: 1, cpl },
    ];
    css = `grid-template-columns: repeat(3, 1fr); gap: ${gap}px; /* 不设断点 */`;
    if (colW < 170) {
      status = "bad";
      verdict = `硬撑三列崩溃：视口 ${vw}px 下每列仅剩 ${colW}px（约 ${cpl} 字/行），标题与正文全部竖切碎裂。`;
    } else if (colW < 230) {
      status = "warn";
      verdict = `三列开始发紧：单列 ${colW}px（约 ${cpl} 字/行），勉强能看但卡片内边距与图表已经局促。`;
    } else {
      status = "ok";
      verdict = `桌面空间充裕：单列 ${colW}px（约 ${cpl} 字/行），三列并排舒展。`;
    }
  } else if (strategy === "stepped") {
    if (vw >= 1024) {
      layoutMode = "3-col";
      const w0 = Math.round((inner - gap * 2) * 0.22);
      const w1 = Math.round((inner - gap * 2) * 0.52);
      const w2 = inner - gap * 2 - w0 - w1;
      boxes = [
        { name: "左导航", w: w0, row: 0, span: 1, cpl: Math.round((w0 - 20) / 14) },
        { name: "中正文", w: w1, row: 0, span: 1, cpl: Math.round((w1 - 20) / 14) },
        { name: "右辅栏", w: w2, row: 0, span: 1, cpl: Math.round((w2 - 20) / 14) },
      ];
      css = `/* ≥1024px 三列 */ grid-template-columns: 22% 1fr 26%; gap: ${gap}px;`;
      verdict = `桌面三列全开：中轴正文达 ${w1}px（约 ${boxes[1].cpl} 字/行），左右双翼各守其职。`;
    } else if (vw >= 680) {
      layoutMode = "2-col+drop";
      const w0 = Math.round((inner - gap) * 0.28);
      const w1 = inner - gap - w0;
      boxes = [
        { name: "左导航", w: w0, row: 0, span: 1, cpl: Math.round((w0 - 20) / 14) },
        { name: "中正文", w: w1, row: 0, span: 1, cpl: Math.round((w1 - 20) / 14) },
        { name: "右辅栏（下沉通栏）", w: inner, row: 1, span: 2, cpl: Math.round((inner - 20) / 14) },
      ];
      css = `/* 680–1023px 折为 2+1 */ grid-template-columns: 28% 1fr; /* 辅栏 grid-column: 1 / -1 */`;
      verdict = `平板自动降为 2+1：把右辅栏折到下方通栏，中正文反而保住 ${w1}px（约 ${boxes[1].cpl} 字/行）不缩水。`;
    } else {
      layoutMode = "1-col";
      boxes = [
        { name: "核心正文（置顶）", w: inner, row: 0, span: 1, cpl: Math.round((inner - 20) / 14) },
        { name: "左导航（折叠栏）", w: inner, row: 1, span: 1, cpl: Math.round((inner - 20) / 14) },
        { name: "右辅栏（底延展）", w: inner, row: 2, span: 1, cpl: Math.round((inner - 20) / 14) },
      ];
      css = `/* <680px 单列重排 */ grid-template-columns: 1fr; /* 主正文 order: -1 置顶 */`;
      verdict = `手机收拢单列：主正文优先顶上，单行宽 ${inner}px（约 ${boxes[0].cpl} 字/行），手指上下滑动零横滚。`;
    }
  } else {
    // drawer strategy
    if (vw >= 1100) {
      layoutMode = "3-col";
      const w0 = 210;
      const w2 = 250;
      const w1 = inner - gap * 2 - w0 - w2;
      boxes = [
        { name: "左定宽导航", w: w0, row: 0, span: 1, cpl: Math.round((w0 - 20) / 14) },
        { name: "中流式正文", w: w1, row: 0, span: 1, cpl: Math.round((w1 - 20) / 14) },
        { name: "右定宽辅栏", w: w2, row: 0, span: 1, cpl: Math.round((w2 - 20) / 14) },
      ];
      css = `/* ≥1100px */ grid-template-columns: 210px minmax(0, 1fr) 250px; gap: ${gap}px;`;
      verdict = `宽屏定宽双翼 + 流式中轴：中列吃到剩余全部 ${w1}px（约 ${boxes[1].cpl} 字/行）。`;
    } else if (vw >= 740) {
      layoutMode = "drawer+2";
      const w2 = 230;
      const w1 = inner - gap - w2;
      boxes = [
        { name: "左导航（收纳进菜单抽屉）", w: 0, row: -1, span: 0, cpl: 0, hidden: true },
        { name: "中流式正文", w: w1, row: 0, span: 1, cpl: Math.round((w1 - 20) / 14) },
        { name: "右定宽辅栏", w: w2, row: 0, span: 1, cpl: Math.round((w2 - 20) / 14) },
      ];
      css = `/* 740–1099px 左栏入抽屉 */ grid-template-columns: minmax(0, 1fr) 230px;`;
      verdict = `左导航收进顶部抽屉按钮，屏幕腾出空间给正文（${w1}px，约 ${boxes[1].cpl} 字/行）与右辅栏并排。`;
    } else {
      layoutMode = "drawer+1";
      boxes = [
        { name: "左导航（菜单抽屉）", w: 0, row: -1, span: 0, cpl: 0, hidden: true },
        { name: "中正文（全宽）", w: inner, row: 0, span: 1, cpl: Math.round((inner - 20) / 14) },
        { name: "右辅栏（底卡片）", w: inner, row: 1, span: 1, cpl: Math.round((inner - 20) / 14) },
      ];
      css = `/* <740px 抽屉 + 单列 */ grid-template-columns: 1fr;`;
      verdict = `窄屏仅保留核心正文（${inner}px，约 ${boxes[1].cpl} 字/行），导航入抽屉、辅栏放文末，绝不挤碎。`;
    }
  }

  return { vw, inner, gap, layoutMode, boxes, status, verdict, css };
}

// ---------- 第 06 节：单变量小练习数据（固定 1140px 视口、24px 双缝，只差宽比） ----------
export const QUIZ_OPTIONS = [
  {
    id: "A",
    ratioLabel: "33 : 33 : 34",
    pcts: [33, 33, 34],
    correct: false,
    verdictTitle: "机械均分：目录吃肥，正文反倒受挤",
    verdictBody:
      "在 1140px 内容宽减去 48px 双缝后，三列各分到约 360px。左侧章节目录字短，白白空出一大半；而中间核心长文每行只装下约 22 字且被迫拉长滚屏——等宽适合平行对比，不适合「索引 + 长文 + 图注」的主次分工。",
  },
  {
    id: "B",
    ratioLabel: "20 : 56 : 24",
    correct: true,
    pcts: [20, 56, 24],
    verdictTitle: "答对了：各司其宽，中轴正文稳落舒适带",
    verdictBody:
      "左目录约 218px 紧凑不空洞；中正文约 612px（去掉内边距每行约 36 字，低于 WCAG 1.4.8 的 40 汉字上限又足够舒展）；右图注约 262px 从容托住缩略图与说明。三列宽度严格跟随信息重量，既有中心焦点又保持左右平衡。",
  },
  {
    id: "C",
    ratioLabel: "44 : 36 : 20",
    correct: false,
    pcts: [44, 36, 20],
    verdictTitle: "主次倒挂：辅助目录比正文还宽",
    verdictBody:
      "左目录占到约 480px，视觉体量直接压过了中间约 393px 的核心正文。读者第一眼会被大片空荡的左栏截停，三列重心明显左倾，违背了「核心功能给核心宽度」的分区原则。",
  },
  {
    id: "D",
    ratioLabel: "12 : 74 : 14",
    correct: false,
    pcts: [12, 74, 14],
    verdictTitle: "双翼挤碎且中列过宽：退化成坏单列",
    verdictBody:
      "左目录只剩约 131px、右图注仅 153px，条目与图注被迫挤成每行六七字的竖条；同时中间正文宽达 808px（单行近 54 字，超出 WCAG 40 汉字上限），长行回扫极易串行。",
  },
];

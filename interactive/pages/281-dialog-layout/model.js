// 281 对话布局 · 单一真源数据与几何核算模型
// DOM 对话剧场、顶沿 2D Canvas 宽度标尺、视线动线叠加层、5 枚海报关键词标与实时诊单全部共用此模块。

export const SWEET_WIDTH = { min: 52, max: 72 };
export const MAX_CONCISE_CHARS = 56;

export const ROLE_MODES = {
  flat: {
    id: "flat",
    label: "同侧同色",
    ok: false,
    note: "双边全部压在左侧且同为浅灰块，发言人失去空间轨道。",
  },
  split: {
    id: "split",
    label: "极简左右",
    ok: true,
    note: "纯靠左右轨道与细框对比分工，克制留白，同样清晰。",
  },
  paired: {
    id: "paired",
    label: "左右双色",
    ok: true,
    note: "原海报解法：左白蓝、右暖杏珊瑚并配指向尾角，身份一扫即明。",
  },
  rainbow: {
    id: "rainbow",
    label: "五彩盲乱",
    ok: false,
    note: "每条气泡随机换色，色彩不再绑定角色，反而变成噪点。",
  },
};

export const PACING_MODES = {
  cramped: {
    id: "cramped",
    label: "粘连无界",
    inner: 6,
    outer: 6,
    ratio: 1.0,
    ok: false,
    note: "组内与换轮同为 6px（1.0×），三轮问答糊成一整堵墙。",
  },
  paired: {
    id: "paired",
    label: "成对分组",
    inner: 10,
    outer: 28,
    ratio: 2.8,
    ok: true,
    note: "同轮问答紧贴 10px，换轮拉开 28px（2.8×），成对关系一目了然。",
  },
  inverted: {
    id: "inverted",
    label: "问答脱节",
    inner: 38,
    outer: 10,
    ratio: 0.26,
    ok: false,
    note: "同轮内距 38px 反大于换轮距 10px（0.26×），上一轮回答被粘到下一轮问题上。",
  },
};

export const SCRIPTS = {
  poster: {
    id: "poster",
    label: "原海报 · 设计问答",
    leftRole: { name: "设计师", en: "DESIGNER" },
    rightRole: { name: "阅读者", en: "READER" },
    stages: [
      { id: 0, zh: "提问", en: "QUESTION" },
      { id: 1, zh: "解释", en: "EXPLAIN" },
      { id: 2, zh: "总结", en: "SUMMARY" },
    ],
    messages: [
      {
        id: 0,
        round: 0,
        speaker: "left",
        lead: "为什么使用对话布局？",
        body: "因为它符合人们自然的交流方式，能让信息更易理解与消化。",
      },
      {
        id: 1,
        round: 0,
        speaker: "right",
        lead: "如何实现有效的对话结构？",
        body: "通过左右交替、气泡区分、视觉动线，建立清晰的问答与回应关系。",
      },
      {
        id: 2,
        round: 1,
        speaker: "left",
        lead: "对话气泡有什么作用？",
        body: "气泡区分角色与语气，聚焦内容，形成视觉层次。",
      },
      {
        id: 3,
        round: 1,
        speaker: "right",
        lead: "怎样保持节奏与平衡？",
        body: "控制气泡长度与行宽，保持信息量平衡，营造稳定的阅读节奏。",
        wallBody:
          "在设计任何对话页面时都需要同时兼顾气泡宽度、单行字数、角色配色、头像大小、尾角朝向、时间戳精度以及移动端键盘弹出后的视口高度变化，如果把整篇设计规范不分段塞进同一条气泡里，读者就不得不停下来逐字啃读，原本轻快的一来一回立刻退化成沉重说明书。",
      },
      {
        id: 4,
        round: 2,
        speaker: "left",
        lead: "对话布局适合哪些场景？",
        body: "适用于问答、客服、教学、访谈、协作工具等交互场景。",
      },
      {
        id: 5,
        round: 2,
        speaker: "right",
        lead: "它带来的核心价值是什么？",
        body: "提升参与感与可读性，帮助用户在交流中快速获取关键信息。",
      },
    ],
    quickReplies: [
      {
        id: "group",
        chip: "追问：五人群聊怎么排？",
        userLead: "如果超过两个人同时群聊呢？",
        userBody: "五个人轮流发言时，还能严格一左一右吗？",
        replyLead: "多人群聊改用「他人统一居左，我居右」",
        replyBody: "把所有他人固定在左轨、用头像和姓名区分，右轨只留给「自己」，参照系才不会乱跳。",
      },
      {
        id: "mobile",
        chip: "追问：超宽屏会拉太开吗？",
        userLead: "2560 宽屏上左右分列会太远吗？",
        userBody: "如果气泡一左一右贴在屏幕两端，眼睛会不会来回甩头？",
        replyLead: "必须给对话轨道设最大容器宽度",
        replyBody: "经验上对话容器封顶约 720–880px，气泡上限约 52%–72%，宽屏才不会出现「乒乓球甩头」。",
      },
      {
        id: "long",
        chip: "追问：长表格也塞气泡里？",
        userLead: "AI 返回参数对比表时怎么办？",
        userBody: "把十列数据硬塞进右侧窄气泡，看起来总被挤变形。",
        replyLead: "结构化长内容应破出窄气泡",
        replyBody: "表格与代码宜转为独立宽卡或数据表格布局，气泡只留给轻快的自然语言轮次。",
      },
    ],
  },
  support: {
    id: "support",
    label: "客服 · 退换排查",
    leftRole: { name: "客服专员", en: "AGENT" },
    rightRole: { name: "顾客", en: "CUSTOMER" },
    stages: [
      { id: 0, zh: "核单", en: "VERIFY" },
      { id: 1, zh: "定位", en: "LOCATE" },
      { id: 2, zh: "处理", en: "RESOLVE" },
    ],
    messages: [
      {
        id: 0,
        round: 0,
        speaker: "left",
        lead: "您好，请确认订单尾号",
        body: "查到您昨天签收的陶瓷杯订单 4829，请问是哪一件需要协助？",
      },
      {
        id: 1,
        round: 0,
        speaker: "right",
        lead: "杯口有一道细裂纹",
        body: "开箱时外盒完好，但内胆泡沫偏松，白色那只杯口磕出一小道缝。",
      },
      {
        id: 2,
        round: 1,
        speaker: "left",
        lead: "已核验开箱照片，无需寄回",
        body: "看清破损位置了，这类运输瑕疵直接为您免费补发一只新品。",
      },
      {
        id: 3,
        round: 1,
        speaker: "right",
        lead: "补发大概什么时候能到？",
        body: "收货地址还是原地址就行，请问今天能发出吗？",
        wallBody:
          "我周四下午五点前还在公司工位，周五开始要出差去杭州两天，如果今天仓库来得及揽收并且走同城次日达的话就继续寄到浦东这个前台地址，要是需要等两天调货的话麻烦改成我家里小区丰巢柜顺便把快递单号同步短信发我一下免得漏签收。",
      },
      {
        id: 4,
        round: 2,
        speaker: "left",
        lead: "今晚 19 点前从上海仓发出",
        body: "同城次日达，明天午后送达原址，单号生成后直接推送在本窗口。",
      },
      {
        id: 5,
        round: 2,
        speaker: "right",
        lead: "太清楚了，谢谢处理",
        body: "不用来回寄件省事多了，我明天留意签收。",
      },
    ],
    quickReplies: [
      {
        id: "receipt",
        chip: "追问：发票需要重开吗？",
        userLead: "补发后电子发票会变吗？",
        userBody: "报销已经提交了原发票，补发会影响税号吗？",
        replyLead: "原发票继续有效",
        replyBody: "破损补发不产生新扣款，原有电子发票和订单金额保持不变，无需重新报销。",
      },
      {
        id: "pack",
        chip: "追问：这次会加固包装吗？",
        userLead: "补发那只怎么防磕碰？",
        userBody: "担心路上再压裂一次。",
        replyLead: "已备注双层气柱加厚箱",
        replyBody: "工单已勾选易碎品复检与双层气柱袋，发货前仓管会留存装箱记录。",
      },
    ],
  },
  teaching: {
    id: "teaching",
    label: "教学 · 排版诊室",
    leftRole: { name: "导师", en: "MENTOR" },
    rightRole: { name: "学员", en: "LEARNER" },
    stages: [
      { id: 0, zh: "起题", en: "PROMPT" },
      { id: 1, zh: "拆解", en: "CRITIQUE" },
      { id: 2, zh: "定稿", en: "RECAP" },
    ],
    messages: [
      {
        id: 0,
        round: 0,
        speaker: "left",
        lead: "先看你这稿聊天页的第一眼",
        body: "你把双方都放在左边后，读者第一秒分得出谁在问吗？",
      },
      {
        id: 1,
        round: 0,
        speaker: "right",
        lead: "好像全得先读名字前缀",
        body: "一屏扫过去全是白条，不盯着名字确实会看串行。",
      },
      {
        id: 2,
        round: 1,
        speaker: "left",
        lead: "把「回应」推去右轨试试",
        body: "再换一种暖浅底色，眼球靠左右位置就能跳过署名直接读正文。",
      },
      {
        id: 3,
        round: 1,
        speaker: "right",
        lead: "气泡宽窄怎么拿捏最稳？",
        body: "留出对面三分之一空白，既不折成细长条，也不会撞过中线。",
        wallBody:
          "我刚才在 Figma 里试着把气泡最大宽度先调到了 90% 发现两边在宽屏上几乎完全对齐看起来就像文章段落，后来又拉到 32% 发现一句二十几个字的话被折成了六行垂直细条，整个手机屏一屏只能放两条半消息，感觉宽了窄了都不顺眼所以特别想知道具体范围怎么定。",
      },
      {
        id: 4,
        round: 2,
        speaker: "left",
        lead: "再把同轮和换轮间距拉开",
        body: "同轮问答收紧，换话题时留出双倍以上呼吸空隙，节奏就立住了。",
      },
      {
        id: 5,
        round: 2,
        speaker: "right",
        lead: "明白了，我现在就按这套调",
        body: "双轨定角色、宽窄控节奏、间距锁成对，三步一下就通透了。",
      },
    ],
    quickReplies: [
      {
        id: "timestamp",
        chip: "追问：时间标签每条都加吗？",
        userLead: "每条气泡底下都要标几点几分吗？",
        userBody: "我看很多聊天软件三分钟内不会反复打时间戳。",
        replyLead: "按话题段落或时间跨度集中标一次",
        replyBody: "连续问答间省去重复时间，仅在间隔拉长或切换阶段时插入一条中轴锚点更清爽。",
      },
    ],
  },
};

export function createInitialState(scriptId = "poster") {
  return {
    scriptId,
    bubbleWidth: 88,
    roleMode: "flat",
    pacingMode: "cramped",
    orderIds: [0, 2, 1, 3, 4, 5],
    wallBloated: true,
    extraTurns: [],
    usedQuickIds: [],
    showScan: true,
    focusedIndex: -1,
  };
}

export function createPresetState(preset, currentScriptId = "poster") {
  const base = createInitialState(currentScriptId);
  if (preset === "poster") {
    return {
      ...base,
      bubbleWidth: 62,
      roleMode: "paired",
      pacingMode: "paired",
      orderIds: [0, 1, 2, 3, 4, 5],
      wallBloated: false,
    };
  }
  if (preset === "minimal") {
    return {
      ...base,
      bubbleWidth: 58,
      roleMode: "split",
      pacingMode: "paired",
      orderIds: [0, 1, 2, 3, 4, 5],
      wallBloated: false,
    };
  }
  return base;
}

export function getOrderedTurns(state) {
  const script = SCRIPTS[state.scriptId] || SCRIPTS.poster;
  const base = state.orderIds.map((id) => {
    const raw = script.messages[id];
    const isWall = !!(raw.wallBody && state.wallBloated);
    return {
      ...raw,
      displayBody: isWall ? raw.wallBody : raw.body,
      isWall,
      canToggleWall: !!raw.wallBody,
      isExtra: false,
    };
  });
  return [...base, ...state.extraTurns];
}

// 统一几何与诊断真源：DOM 与 Canvas 共同读取
export function evaluate(state, stageWidthPx = 820) {
  const script = SCRIPTS[state.scriptId] || SCRIPTS.poster;
  const turns = getOrderedTurns(state);
  const roleInfo = ROLE_MODES[state.roleMode] || ROLE_MODES.flat;
  const pacingInfo = PACING_MODES[state.pacingMode] || PACING_MODES.cramped;

  // 1. 轮次交替与相邻对核查
  let alternationBreaks = 0;
  const brokenTurnIndices = new Set();
  for (let i = 1; i < turns.length; i++) {
    if (turns[i].speaker === turns[i - 1].speaker) {
      alternationBreaks++;
      brokenTurnIndices.add(i - 1);
      brokenTurnIndices.add(i);
    }
  }

  let validPairs = 0;
  const totalPairs = Math.floor(turns.length / 2);
  const pairLinks = [];
  for (let i = 0; i + 1 < turns.length; i += 2) {
    const a = turns[i];
    const b = turns[i + 1];
    const opposite = a.speaker !== b.speaker;
    const sameRound = a.round === b.round;
    const rightStart = a.speaker === "left" && b.speaker === "right";
    const ok = opposite && sameRound && rightStart;
    if (ok) validPairs++;
    pairLinks.push({ fromIdx: i, toIdx: i + 1, ok, sameRound, opposite });
  }
  const orderOk = alternationBreaks === 0 && validPairs === totalPairs;

  // 2. 真实气泡宽、每行估算中文字数与留白通道
  const effectiveLanePx = Math.max(240, Math.min(stageWidthPx - 140, 860));
  const bubblePx = Math.round((effectiveLanePx * state.bubbleWidth) / 100);
  const textAreaPx = Math.max(88, bubblePx - 30);
  const estCharsPerLine = Math.max(5, Math.round(textAreaPx / 15));
  const laneClearancePct = Math.max(0, 100 - state.bubbleWidth);
  const overlapPct = Math.max(0, state.bubbleWidth * 2 - 100);

  const maxTurnChars = Math.max(...turns.map((t) => t.displayBody.length));
  const wallBroken = turns.some((t) => t.displayBody.length > MAX_CONCISE_CHARS);
  const widthTooNarrow = state.bubbleWidth < 44;
  const widthTooWide = state.bubbleWidth > 76;
  const widthInSweet = state.bubbleWidth >= SWEET_WIDTH.min && state.bubbleWidth <= SWEET_WIDTH.max;
  const widthAcceptable = !widthTooNarrow && !widthTooWide;
  const rhythmOk = widthAcceptable && !wallBroken;

  // 3. 角色与分组判定
  const roleOk = roleInfo.ok;
  const pacingOk = pacingInfo.ok;

  const passedCount = [roleOk, orderOk, rhythmOk, pacingOk].filter(Boolean).length;

  // 4. 8 类失误 + 多正当解白话诊单（按视觉破坏优先级排）
  let diagnosis;
  if (state.roleMode === "flat") {
    diagnosis = {
      severity: "error",
      code: "same_side",
      tag: `错态 · 角色塌陷 (${passedCount} / 4)`,
      headline: "双方全压在左边且同色，眼睛每行都要重新找署名",
      reason:
        "对话布局靠左右空间轨道让大脑「不用读名字就知道谁在说」。现在 6 条气泡全部靠左且同底色，视线只能像读旧式日志一样逐条核对身份，交流感立刻塌陷。",
      action: "把「角色区分」切到「左右双色（原海报解）」或「极简左右」，先拉开对话双轨。",
      tier: "归属模糊（示意）",
    };
  } else if (state.roleMode === "rainbow") {
    diagnosis = {
      severity: "error",
      code: "rainbow_noise",
      tag: `错态 · 五彩噪点 (${passedCount} / 4)`,
      headline: "气泡颜色不再绑定身份，读者被迫重新解码",
      reason:
        "色彩在对话里是身份锚点而不是装饰贴纸。每条气泡随机换色会打断「左白蓝 = 设计师、右暖杏 = 阅读者」的稳定映射，眼球在色块间来回分神。",
      action: "把「角色区分」切回「左右双色」或「极简左右」，恢复 1 对 1 的角色语义。",
      tier: "色噪干扰（示意）",
    };
  } else if (!orderOk) {
    diagnosis = {
      severity: "error",
      code: "broken_turn",
      tag: `错态 · 轮次错配 (${passedCount} / 4)`,
      headline: `出现 ${alternationBreaks} 处连续同边撞车，只有 ${validPairs}/${totalPairs} 组问答成对`,
      reason:
        "对话靠「问 → 答」相邻对推进。第 2、3 条错序后，前一个问题没等来回应就被下一问截断，视线只能拖着红虚线跨行回找答案，阅读动线打结。",
      action: "直接点击剧场里带红标的气泡「↕ 调顺轮次」（或点下方「一键理顺轮次」）。",
      tier: "跨行回找（示意）",
    };
  } else if (widthTooWide) {
    diagnosis = {
      severity: "error",
      code: "too_wide",
      tag: `错态 · 宽墙越界 (${passedCount} / 4)`,
      headline: `气泡拉宽到 ${state.bubbleWidth}%，左右跨过中线重叠了 ${overlapPct}%`,
      reason: `气泡太宽（约 ${estCharsPerLine} 字/行）会吃光对面的留白通道（仅剩 ${laneClearancePct}%），左右两侧在视觉上糊成一整列宽卡片，双轨对话的轻盈轮廓随之消失。`,
      action: "向左拖动顶沿「气泡宽度标尺」，把它收进 52%–72% 的节奏甜区。",
      tier: "过宽压迫（示意）",
    };
  } else if (widthTooNarrow) {
    diagnosis = {
      severity: "error",
      code: "too_narrow",
      tag: `错态 · 瘦条折行 (${passedCount} / 4)`,
      headline: `气泡缩到 ${state.bubbleWidth}%（约 ${estCharsPerLine} 字/行），短句被切成碎柱`,
      reason:
        "行宽过窄会让一句二十来字的话被迫折成 5–6 行，眼球垂直折返次数暴涨，整场对话高度被拉长，交流节奏变得结巴断续。",
      action: "向右拖动顶沿「气泡宽度标尺」，拉回 52%–72% 的舒适阅读带。",
      tier: "频繁折行（示意）",
    };
  } else if (wallBroken) {
    diagnosis = {
      severity: "error",
      code: "wall_of_text",
      tag: `错态 · 话痨塞墙 (${passedCount} / 4)`,
      headline: `单条气泡塞进 ${maxTurnChars} 字，把轻快对话拖成说明书`,
      reason:
        "对话气泡的魅力在于「一口气读完一轮」。单条超过约 55 字的密实段落会破坏双方轮次的体量平衡，让读者产生阅读压力。",
      action: "点击剧场内标红的长气泡「✂ 拆短气泡」，把长段还原成简洁回应。",
      tier: "体量失衡（示意）",
    };
  } else if (state.pacingMode === "inverted") {
    diagnosis = {
      severity: "error",
      code: "inverted_gaps",
      tag: `错态 · 问答脱节 (${passedCount} / 4)`,
      headline: `同轮内距 ${pacingInfo.inner}px 反大于换轮距 ${pacingInfo.outer}px（${pacingInfo.ratio.toFixed(2)}×）`,
      reason:
        "格式塔接近性原则决定「谁离得近，谁是一组」。现在上一轮回答反而贴紧下一轮问题，大脑会把不相干的两条气泡误配成一对。",
      action: "把「轮次间距」切到「成对分组（10 / 28px）」，让同轮紧密、换轮留气。",
      tier: "分组倒挂（示意）",
    };
  } else if (!pacingOk) {
    diagnosis = {
      severity: "error",
      code: "flat_gaps",
      tag: `错态 · 轮间粘连 (${passedCount} / 4)`,
      headline: `组内与换轮同为 ${pacingInfo.inner}px（1.0×），三轮话题粘成一片`,
      reason:
        "没有换轮留白，提问、解释、总结三组对话之间失去呼吸停顿，读者扫读时分不清哪里是一轮结束、哪里是新话题开始。",
      action: "把「轮次间距」切到「成对分组（10 / 28px）」，拉出清晰的轮次节拍。",
      tier: "缺少呼吸（示意）",
    };
  } else {
    const isMinimal = state.roleMode === "split";
    const widthNote = widthInSweet ? "甜区居中" : "可用边界";
    diagnosis = {
      severity: "pass",
      code: isMinimal ? "pass_minimal" : "pass_poster",
      tag: isMinimal ? "达标 · 极简空间解 (4 / 4)" : "达标 · 原海报双色解 (4 / 4)",
      headline: isMinimal
        ? `无须重彩，靠双轨空间与 ${state.bubbleWidth}% 行宽一样读得飞快`
        : `双轨角色、${validPairs}/${totalPairs} 成对问答与 ${state.bubbleWidth}% 节拍全部对齐`,
      reason: isMinimal
        ? `即使克制使用极简留白与描边，只要左右轨道明确、轮次成对且组间/组内距保持 ${pacingInfo.ratio.toFixed(1)}×（约 ${estCharsPerLine} 字/行 · ${widthNote}），Z 形动线依然顺畅。`
        : `白蓝与暖杏双色气泡锁定身份，约 ${estCharsPerLine} 字/行配合 ${laneClearancePct}% 对向留白与 ${pacingInfo.ratio.toFixed(1)}× 轮次呼吸感，读者无需反复核对署名。`,
      action: "试试点击底部快捷追问真实续聊一轮，或故意拖宽/换错色检验边界何时崩塌。",
      tier: "顺畅自然（示意）",
    };
  }

  // 5. 映射至原海报 5 枚关键词（交流 / 回应 / 成对 / 节奏 / 互动）
  const keywords = [
    {
      zh: "交流",
      en: "EXCHANGE",
      ok: roleOk,
      status: roleOk ? "双轨分明" : state.roleMode === "rainbow" ? "色噪乱频" : "同侧混堆",
    },
    {
      zh: "回应",
      en: "RESPONSE",
      ok: orderOk,
      status: orderOk ? "逐轮应答" : `${alternationBreaks} 处撞车`,
    },
    {
      zh: "成对",
      en: "PAIRING",
      ok: orderOk && pacingOk,
      status: orderOk && pacingOk ? `${validPairs}/${totalPairs} 成对` : !pacingOk ? "轮界不清" : "跨轮错配",
    },
    {
      zh: "节奏",
      en: "RHYTHM",
      ok: rhythmOk,
      status: rhythmOk ? `${state.bubbleWidth}% 适宽` : wallBroken ? "单条塞墙" : widthTooWide ? "宽墙越界" : "瘦条碎行",
    },
    {
      zh: "互动",
      en: "INTERACTION",
      ok: passedCount === 4,
      status: state.extraTurns.length > 0 ? `已续聊 +${state.extraTurns.length / 2} 轮` : passedCount === 4 ? "可续追问" : `${passedCount}/4 待理`,
    },
  ];

  return {
    script,
    turns,
    roleInfo,
    pacingInfo,
    alternationBreaks,
    brokenTurnIndices,
    pairLinks,
    validPairs,
    totalPairs,
    bubblePx,
    estCharsPerLine,
    laneClearancePct,
    overlapPct,
    maxTurnChars,
    wallBroken,
    widthTooNarrow,
    widthTooWide,
    widthInSweet,
    checks: { roleOk, orderOk, rhythmOk, pacingOk },
    passedCount,
    diagnosis,
    keywords,
  };
}

// ---------- 01 节：三态结构解剖 ----------
export const COMPARE_FORMATS = {
  irc: {
    id: "irc",
    label: "纯文本日志",
    era: "IRC · 1988",
    rechecks: "4 次逐行读前缀",
    eyeStyle: "直线回扫",
    summary: "所有发言者挤在同一垂直左缘，没有空间分轨也没有视觉容器；眼睛每读一行都必须先解析尖括号里的署名，高密对话里极易串行。",
  },
  stream: {
    id: "stream",
    label: "单侧同栏流",
    era: "协作频道 · 媒体对象",
    rechecks: "2–3 次看头像核名",
    eyeStyle: "左缘纵扫",
    summary: "把所有人都排在左对齐单栏（典型于团队群聊频道），适合 10 人以上多人讨论与长附件，但 1 对 1 问答的「一来一回」临场感弱于左右对话布局。",
  },
  dialog: {
    id: "dialog",
    label: "左右双侧气泡",
    era: "对话布局 · 281",
    rechecks: "0 次额外核名",
    eyeStyle: "Z 形自然往复",
    summary: "左右轨道 + 差异气泡色在阅读文字之前就完成了「谁在说」的预注意编码，眼睛顺着左问右答的斜向 Z 字推进，互动节奏最强。",
  },
};

export const COMPARE_SAMPLE = [
  { who: "设计师", role: "left", time: "10:02", text: "这页 FAQ 如果改成一问一答，阅读负担会不会轻一点？" },
  { who: "阅读者", role: "right", time: "10:02", text: "会明显轻很多，我不用在一大段说明里自己划重点了。" },
  { who: "设计师", role: "left", time: "10:03", text: "那每条回复大概控制在两三行以内最顺眼？" },
  { who: "阅读者", role: "right", time: "10:03", text: "对，一口气读完再看下一句，节奏刚好。" },
];

// ---------- 02 节：气泡里的五个零件 ----------
export const ANATOMY_PARTS = [
  {
    id: "avatar",
    num: "01",
    title: "抽象身份头像",
    en: "AVATAR ANCHOR",
    body: "锚定发言人轨道。教学演示或客服界面宜用清晰几何剪影、首字母或柔和图形标识，不必堆叠繁复细节；同人连发时只保留首条或末条头像。",
    tip: "头像与气泡外缘留 10–14px 呼吸缝，视觉归属稳而不挤。",
  },
  {
    id: "tail",
    num: "02",
    title: "气泡方向尾角",
    en: "DIRECTIONAL TAIL",
    body: "源自连环画对话球的小尾角，把文字容器明确「钉」向发言人一侧。连续发送多条时，仅首条或末条保留尾角，其余用小圆角平齐贴合。",
    tip: "尾角是轻提示，尖角过大或描边过粗会显得生硬。",
  },
  {
    id: "tint",
    num: "03",
    title: "冷暖语义配色",
    en: "ROLE TINTING",
    body: "281 原海报采用「白蓝对暖杏」的低饱和互补对比：左侧纯白冷静发问，右侧暖杏柔和回应，既保持 10:1 以上正文对比度，又避免高饱和色块晃眼。",
    tip: "切忌只靠色相区分——同时保留左右位置差，色觉障碍读者同样读得清。",
  },
  {
    id: "spine",
    num: "04",
    title: "中轴阶段锚点",
    en: "TURN MILESTONE",
    body: "在问答切换处用一条极细虚线加圆环标出「提问 / 解释 / 总结」（或实际聊天里的时间分组条），比给每条气泡重复贴时间戳干净得多。",
    tip: "3 分钟以内的连续对话无需逐条标时间，减少无意义的视觉碎屑。",
  },
  {
    id: "burst",
    num: "05",
    title: "连发折叠规则",
    en: "CONSECUTIVE BURST",
    body: "真实聊天常出现「一人连发三条短句」。若每条都重复大间距和头像，版面立刻支离破碎；把连发收紧到 4–6px 内距并合并头像，就能一眼看出仍是同一轮发言。",
    tip: "点旁边开关，对比「逐条重复」与「连发折叠」的屏效差距。",
  },
];

// ---------- 03 节：宽屏、窄屏与群聊 2D Canvas 仿真 ----------
export function evalViewportSim(mode, viewportWidth, capPct) {
  const safeVp = Math.max(320, Math.min(1280, viewportWidth));
  const containerW = Math.min(safeVp - 32, mode === "ai" ? 760 : safeVp >= 1000 ? 960 : safeVp - 28);
  const bubbleW = Math.round((containerW * capPct) / 100);
  const charsPerLine = Math.max(6, Math.round((bubbleW - 28) / 14.5));
  // 横向眼球往返跨度：两端对齐时从左气泡中心到右气泡中心的距离
  const leftCenter = bubbleW * 0.5;
  const rightCenter = containerW - bubbleW * 0.5;
  const saccadeSpanPx = mode === "ai" ? 0 : Math.max(0, Math.round(rightCenter - leftCenter));
  const neckStrain = mode !== "ai" && safeVp >= 1000 && saccadeSpanPx > 560;
  const tooCramped = bubbleW < 180;
  const tooWideOverlap = mode !== "ai" && capPct > 78 && safeVp >= 700;

  let verdict = "比例舒展";
  let tone = "ok";
  let detail = "";
  if (mode === "two") {
    if (neckStrain) {
      verdict = "宽屏甩头风险";
      tone = "warn";
      detail = `视口 ${safeVp}px 且未封顶容器宽，左右气泡中心跨度达 ${saccadeSpanPx}px；经验上桌面对话轨道宜限制 max-width 在 720–860px 内。`;
    } else if (tooCramped) {
      verdict = "气泡偏窄折行";
      tone = "warn";
      detail = `当前气泡宽 ${bubbleW}px（约 ${charsPerLine} 字/行），在 ${safeVp}px 屏上应把上限放宽至 74%–82%。`;
    } else if (tooWideOverlap) {
      verdict = "双轨边界变糊";
      tone = "warn";
      detail = `宽屏上气泡占到 ${capPct}%（${bubbleW}px），对面留白不足 22%，左右交替感减弱。`;
    } else {
      detail = `气泡宽 ${bubbleW}px（约 ${charsPerLine} 字/行），眼动往返 ${saccadeSpanPx}px，左右双轨清晰且不累眼。`;
    }
  } else if (mode === "group") {
    verdict = "他人统一居左，我居右";
    tone = tooCramped ? "warn" : "ok";
    detail = tooCramped
      ? `群聊气泡仅 ${bubbleW}px，姓名标与正文挤在一起；窄屏下宜将最大宽度放宽至 76%–82%。`
      : `5 人群聊不能按次序左右摇摆：林、陈、周、吴 4 位他人全部锁定左轨并用头像+姓名区隔，右轨只留给「我」，气泡 ${bubbleW}px（约 ${charsPerLine} 字/行）。`;
  } else {
    verdict = "短问用右泡，长答破宽栏";
    tone = capPct < 60 ? "warn" : "ok";
    detail =
      capPct < 60
        ? `AI 长回答被硬挤在 ${bubbleW}px（${capPct}%）窄气泡里，代码块与对比表被迫横向滚动。`
        : `用户短提问维持右侧气泡，AI 结构化长回答取消窄气泡框并展开至 ${bubbleW}px 阅读栏，兼顾交流感与长文可读性。`;
  }

  return { containerW, bubbleW, charsPerLine, saccadeSpanPx, verdict, tone, detail };
}

// ---------- 04 节：五个历史年代 ----------
export const HISTORY_ERAS = [
  {
    id: "1974",
    year: "1974",
    title: "会话轮次分析",
    sub: "Sacks, Schegloff & Jefferson · 《Language》",
    fact: "社会语言学家 Harvey Sacks、Emanuel A. Schegloff 与 Gail Jefferson 在期刊《Language》第 50 卷第 4 期发表经典论文，系统提出「话轮构建单位（TCU）」与「相邻对（问—答、寒暄—回应）」：自然对话的核心秩序是一次一人、尽量少重叠、成对呼应。",
    layoutNote: "这解释了为什么好的对话布局一定要成对成节拍，而不是把消息堆成流水账。",
  },
  {
    id: "1983",
    year: "1983",
    title: "Unix talk 上下分屏",
    sub: "4.2BSD 终端实时对聊",
    fact: "随 4.2BSD Unix 普及的 `talk` 命令是最早的实时文字对聊工具之一：它把终端硬劈成上下两半，上方逐字显示你的输入，下方显示对方输入。",
    layoutNote: "双方空间彻底隔离、不会混淆身份，但上下分屏丢失了「时间先后交错」的对话顺序，事后无法回读上下文。",
  },
  {
    id: "1988",
    year: "1988",
    title: "IRC 单栏时间日志",
    sub: "Jarkko Oikarinen · 奥卢大学（1993 RFC 1459）",
    fact: "1988 年 8 月，芬兰奥卢大学的 Jarkko Oikarinen 编写了互联网中继聊天（IRC），并于 1993 年与 Darren Reed 写进 RFC 1459。多人发言按时间从上往下排进单一终端流，每行前缀 `<昵称>`。",
    layoutNote: "它找回了时间顺序、支撑了全球群聊，但所有人挤在同一左缘，快节奏多线交谈极容易看串行。",
  },
  {
    id: "2002",
    year: "2002",
    title: "iChat 引入漫画气泡",
    sub: "Jens Alfke 1997 草图 → Mac OS X 10.2 Jaguar",
    fact: "1997 年 4 月 21 日，苹果工程师 Jens Alfke 因受够 IRC 纯文本刷屏，在 ClarisWorks 里画出以漫画对话球为核心的聊天界面草图：分边对齐、分色气泡、边缘头像与虚线「正在输入」思考泡。2002 年经 Steve Lemay 以 Aqua 视觉重绘，随 Mac OS X 10.2 iChat 正式发布。",
    layoutNote: "对话布局首次把「时间纵轴」与「空间左右分轨」合二为一，奠定了现代聊天界面的骨架。",
  },
  {
    id: "2007",
    year: "2007",
    title: "iPhone 重塑手机短信",
    sub: "2007 年 1 月发布 · 收发箱变对话线程",
    fact: "在 2007 年初代 iPhone 之前，功能机短信像电子邮件一样把「收件箱」与「发件箱」割裂在不同文件夹。iPhone 将 iChat 的左右气泡搬进 3.5 英寸多点触控屏，按联系人组织连续问答线程（2011 年 iOS 5 再引入蓝色 iMessage 气泡区分网络与运营商短信）。",
    layoutNote: "从此左右气泡成为跨越客服、社交、教学乃至 AI 助手的通用交互心智模型。",
  },
];

// ---------- 05 节：何时用 vs 何时别用 ----------
export const TRIAGE_CASES = [
  {
    id: "qa",
    title: "问答学习 / 教学互动",
    en: "Q&A & TEACHING",
    verdict: "use",
    verdictLabel: "最适合对话布局",
    posterTag: "原海报场景",
    why: "把抽象概念拆成「读者常问 → 导师精答」三到五轮，天然贴合大脑提问—解惑的认知节奏，降低畏难情绪。",
    alt: null,
  },
  {
    id: "cs",
    title: "客服对话 / 售后排查",
    en: "CUSTOMER SERVICE",
    verdict: "use",
    verdictLabel: "最适合对话布局",
    posterTag: "原海报场景",
    why: "一步一确认（核单 → 定位 → 给方案），配合快捷建议选项芯片（NN/g 建议减少用户自由输入负担），能快速推进任务并保留完整凭证。",
    alt: null,
  },
  {
    id: "interview",
    title: "访谈内容 / 协作沟通",
    en: "INTERVIEWS & COLLAB",
    verdict: "use",
    verdictLabel: "适合（注意分段）",
    posterTag: "原海报场景",
    why: "一问一答的专栏访谈或双人评审用左右结构很有现场感；若受访者单次发言长达数百字，宜拆成轻段落或改用编辑性问答栏。",
    alt: null,
  },
  {
    id: "form",
    title: "12 项税务或报销录入",
    en: "MULTI-FIELD ENTRY",
    verdict: "avoid",
    verdictLabel: "别用对话布局",
    posterTag: "误用高发",
    why: "把十几个字段硬拆成 24 轮一问一答，用户既看不到全貌、也无法跳回第 3 项随手修改，效率远低于表单。",
    alt: { num: "284", name: "表单布局", url: "https://layout.xiaoxiaodong.ai/284/play/" },
  },
  {
    id: "table",
    title: "多维度参数与价格对比",
    en: "DENSE COMPARISON",
    verdict: "avoid",
    verdictLabel: "别用对话布局",
    posterTag: "误用高发",
    why: "气泡是按时间纵向展开的，无法让眼睛沿同一列横向比对 8 款机型的电池、重量与价格。",
    alt: { num: "274", name: "数据表格布局", url: "https://layout.xiaoxiaodong.ai/274/play/" },
  },
  {
    id: "docs",
    title: "多层 API 文档与知识库",
    en: "DEEP REFERENCE DOCS",
    verdict: "avoid",
    verdictLabel: "别用对话布局",
    posterTag: "误用高发",
    why: "需要随机跳转与全局目录定位的资料放进线性聊天流，很快就会被滚出屏幕找不到入口；可配搜索或目录树，聊天仅作辅助入口。",
    alt: { num: "280", name: "树形浏览布局", url: "https://layout.xiaoxiaodong.ai/280/play/" },
  },
];

// ---------- 06 节：眼力小练习（中性选项，单变量区分） ----------
export const QUIZ_QUESTIONS = [
  {
    id: "q1",
    prompt: "下面四张两轮问答界面内容与配色完全一致。哪一张最容易一眼分辨「哪条答对应哪条问」且双轨清爽？",
    correct: "C",
    options: [
      {
        key: "A",
        label: "方案 A",
        kind: "inverted",
        feedback: "方案 A 的组内距（26px）反而大于换轮距（8px），第 1 轮回答和第 2 轮提问粘在一起，格式塔接近性倒挂。",
      },
      {
        key: "B",
        label: "方案 B",
        kind: "uniform",
        feedback: "方案 B 四条气泡一律 14px 等距排布，失去组间停顿，看不出两轮话题的分界线。",
      },
      {
        key: "C",
        label: "方案 C",
        kind: "ideal",
        feedback: "选对了。方案 C 用紧密组内距（8px）绑定每对问答、用宽敞换轮距（26px）切开轮次，并把气泡控制在约 62% 宽，留出清晰的左右对向留白。",
      },
      {
        key: "D",
        label: "方案 D",
        kind: "wide",
        feedback: "方案 D 的轮次间距虽然拉开了，但气泡宽度拉满到 92%，左右两侧越过中线严重重叠，双轨轮廓糊成一列。",
      },
    ],
  },
  {
    id: "q2",
    prompt: "产品要做一个 5 人项目群聊界面（含「我」与其他 4 位同事）。下面哪种轨道编排最不易看错发言人？",
    correct: "B",
    options: [
      {
        key: "A",
        label: "方案 A",
        kind: "zigzag_group",
        feedback: "方案 A 按发送先后强制一左一右，导致同一位同事一会儿在左、一会儿在右，位置锚点彻底失效。",
      },
      {
        key: "B",
        label: "方案 B",
        kind: "group_ideal",
        feedback: "选对了。多人对话应打破「机械左右交替」：把所有他人固定在左轨并靠头像+姓名区隔，右轨只留给「我」，自我参照系永远稳定。",
      },
      {
        key: "C",
        label: "方案 C",
        kind: "group_anon",
        feedback: "方案 C 把所有人都压在左侧、同色气泡且隐藏姓名，根本无法区分林、陈、周谁说了哪一句。",
      },
      {
        key: "D",
        label: "方案 D",
        kind: "group_chaos",
        feedback: "方案 D 用高饱和五色气泡配随机左右位置，强烈色噪压过文字本身，眼球无从锚定。",
      },
    ],
  },
];

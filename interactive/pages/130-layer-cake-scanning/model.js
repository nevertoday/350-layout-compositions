// 130 层蛋糕扫描模式 · 单真源数据模型与几何核算
// 所有画布坐标、标题/正文比例、层缝像素、眼动路径与 5 项原海报核心原则诊断全部由此文件统一计算。

export const LAYER_PALETTE = {
  overview: { bg: "#F6E5CF", chip: "#120A2F", chipText: "#FEEEDD", bar: "#120A2F", line: "#4A405C", accent: "#E45D44" },
  points:   { bg: "#F3CCB3", chip: "#120A2F", chipText: "#FEEEDD", bar: "#221840", line: "#594452", accent: "#D9563B" },
  detail:   { bg: "#F98F6F", chip: "#3B1B34", chipText: "#FEEEDD", bar: "#3B1B34", line: "#52253E", accent: "#120A2F" },
  verify:   { bg: "#FCB396", chip: "#E04A2E", chipText: "#FFF8F2", bar: "#B93D26", line: "#5B383B", accent: "#E04A2E" },
  action:   { bg: "#EFDECA", chip: "#120A2F", chipText: "#FEEEDD", bar: "#120A2F", line: "#4B4258", accent: "#E04A2E" },
};

export const ROLE_META = {
  overview: { role: "抓住大意", slotLabel: "主标题层", orderIndex: 0 },
  points:   { role: "提炼要点", slotLabel: "副标题层", orderIndex: 1 },
  detail:   { role: "补充细节", slotLabel: "要点摘要层", orderIndex: 2 },
  verify:   { role: "验证判断", slotLabel: "信息分块层", orderIndex: 3 },
  action:   { role: "决定行动", slotLabel: "行动引导层", orderIndex: 4 },
};

export const CANONICAL_ORDER = ["overview", "points", "detail", "verify", "action"];
export const BROKEN_ORDER = ["overview", "action", "detail", "verify", "points"];
export const SLOT_NUMBERS = ["第一层", "第二层", "第三层", "第四层", "第五层"];

export const THEMES = {
  poster: {
    id: "poster",
    label: "能源报告·原海报",
    shortLabel: "原海报",
    taskTarget: "清洁能源投资增速",
    taskPrompt: "扫读任务：3 秒找到「清洁能源投资增速」在哪一层",
    targetKey: "detail",
    layers: {
      overview: {
        clearHead: "全球能源转型加速推进",
        vagueHead: "一场正在改写格局的时代浪潮",
        tag: "年度趋势报告",
        preview: "2026 全球电力与减碳结构总览，涵盖装机与投资变化。",
        deep: "报告基于近五年全球电力并网与资本支出公开统计，先给出宏观趋势判断，再拆解核心数据源与区域差异，供决策者按需查阅。",
        hitText: "",
      },
      points: {
        clearHead: "可再生能源装机容量创历史新高",
        vagueHead: "值得反复品味的几个关键转折点",
        tag: "核心结论",
        preview: "光伏与风电占新增电力装机主力，传统煤电占比持续回落。",
        deep: "本年度全球新增可再生电力装机连续刷新纪录，光伏组件与风电整机成本同步下行，成为电网扩容的第一来源。",
        hitText: "",
      },
      detail: {
        clearHead: "投资增速：清洁能源投资增长 23%",
        vagueHead: "数字背后隐藏着的深层变化脉络",
        tag: "核心数据",
        preview: "清洁能源投资增长 23% · 太阳能和风能领跑 · 政策支持增强",
        deep: "实证数据：本周期清洁能源投资同比增长 23%，其中太阳能与风能领跑资金流入，多国并网补贴与绿色信贷政策支持力度持续增强。",
        hitText: "清洁能源投资增长 23%",
      },
      verify: {
        clearHead: "三项分块实证：光伏、风电与储能并网",
        vagueHead: "从不同侧面再来看一眼全局画面",
        tag: "验证依据",
        preview: "三栏对照：组件成本曲线 / 区域装机份额 / 储能调峰能力",
        deep: "分块核验：① 光伏度电成本十年降幅显著；② 欧美与亚太风电并网审批提速；③ 电化学储能装机翻倍缓解弃风弃光。",
        hitText: "",
      },
      action: {
        clearHead: "阅读全文，了解报告与趋势分析",
        vagueHead: "与我们一起迈向更美好的下一程",
        tag: "行动引导",
        preview: "下载完整版 PDF 数据附录或订阅季度能源简报 →",
        deep: "确认核心结论与数据依据符合你的关注点后，可在此获取完整报告正文、分国别数据集与原始图表来源。",
        hitText: "",
      },
    },
  },
  returns: {
    id: "returns",
    label: "退换货指南",
    shortLabel: "退换货",
    taskTarget: "拆封后能否 7 天退货",
    taskPrompt: "扫读任务：3 秒确认「拆封后能否 7 天退货」",
    targetKey: "detail",
    layers: {
      overview: {
        clearHead: "全品类退换货与售后规则总览",
        vagueHead: "让每一次选购都感到安心的承诺",
        tag: "售后帮助",
        preview: "签收后 7 天无理由退货、15 天质量换新与运费承担说明。",
        deep: "本页按申请条件、拆封判定、退款时效与寄回流程分层排列，你可以直接跳到对应小标题核对条款。",
        hitText: "",
      },
      points: {
        clearHead: "适用时限：签收次日起 7 天内可发起",
        vagueHead: "关于时间节点你最该留心的事",
        tag: "时限要点",
        preview: "以物流签收次日零点起算，超时订单仅支持质量保修。",
        deep: "普通商品签收后 7 个自然日内可在订单页提交退货申请，定制刻字及生鲜类商品除外。",
        hitText: "",
      },
      detail: {
        clearHead: "拆封判定：已拆封但完好不影响二次销售可退",
        vagueHead: "打开包装之后的那些细枝末节",
        tag: "拆封细则",
        preview: "外盒拆封可退 · 激活通电/撕毁封签不适用 7 天无理由",
        deep: "核对细则：仅为查验外观拆开外包装且配件齐全、未激活通电的，支持 7 天无理由退货；一次性防伪封签破损或已绑定账号的设备除外。",
        hitText: "已拆封但未激活且配件齐全可 7 天退货",
      },
      verify: {
        clearHead: "退款渠道与运费承担对照表",
        vagueHead: "大家经常顺手多问一句的补充项",
        tag: "费用核验",
        preview: "质量问题商家包运费 · 个人原因退回原路退款 1–3 个工作日",
        deep: "仓库签收验货通过后，款项原路退回原支付账户：微信/支付宝约 1 个工作日，信用卡约 3 个工作日。",
        hitText: "",
      },
      action: {
        clearHead: "立即提交退货申请并预约上门取件",
        vagueHead: "现在就开始你的无忧服务体验吧",
        tag: "发起售后",
        preview: "输入订单号自动校验资格，顺丰上门免填运单 →",
        deep: "确认拆封状态与时限符合要求后，点击此处进入订单选择退货原因并预约快递上门取件。",
        hitText: "",
      },
    },
  },
  pricing: {
    id: "pricing",
    label: "定价页对比",
    shortLabel: "定价页",
    taskTarget: "团队版是否支持单点登录",
    taskPrompt: "扫读任务：3 秒查明「团队版是否支持单点登录」",
    targetKey: "verify",
    layers: {
      overview: {
        clearHead: "云协作套件 2026 版本与价格方案",
        vagueHead: "为每一个成长阶段量身打造的可能",
        tag: "定价总览",
        preview: "个人免费版、团队专业版与企业专属版三档按席位计费。",
        deep: "所有版本均支持随时升降级与按月/按年切换，核心差异集中在成员上限、权限审计与安全认证能力。",
        hitText: "",
      },
      points: {
        clearHead: "核心档位：个人 ¥0 · 团队 ¥49/人/月 · 企业定制",
        vagueHead: "三种不同节奏的选择放在你面前",
        tag: "价格摘要",
        preview: "年付享 8 折，团队版支持 5–200 人协同，免费试用 14 天。",
        deep: "团队版包含无限文档空间、90 天版本历史与外部协作者邀请，无需绑定信用卡即可开启试用。",
        hitText: "",
      },
      detail: {
        clearHead: "存储与协同配额：单文件上限与 API 频次",
        vagueHead: "关于空间容量与日常效率的更多说明",
        tag: "配额细节",
        preview: "个人 5GB / 团队 1TB 共享空间 / 企业不限容量",
        deep: "团队版提供每分钟 600 次 OpenAPI 调用额度与自动化 Webhook 推送，满足研发与设计团队日常集成。",
        hitText: "",
      },
      verify: {
        clearHead: "安全与登录认证：SAML 单点登录仅限企业版",
        vagueHead: "把后顾之忧交给背后的技术团队",
        tag: "权限核验",
        preview: "团队版含双因素验证 · 单点登录 (SSO) 与审计日志仅企业版",
        deep: "安全对照：团队版提供邮箱/手机双因素认证与角色权限组；SAML 2.0 / OIDC 单点登录 (SSO) 与全量操作审计日志仅在企业专属版开放。",
        hitText: "团队版不含 SSO，单点登录仅企业版开放",
      },
      action: {
        clearHead: "开通 14 天团队版免费试用或预约企业演示",
        vagueHead: "迈出升级协作方式的第一步吧",
        tag: "开始试用",
        preview: "立即试用无需绑卡 · 企业安全评估 1 个工作日内响应 →",
        deep: "确定所需安全认证档位后，可直接开通团队版试用或联系方案顾问获取企业版 SSO 测试环境。",
        hitText: "",
      },
    },
  },
};

export function createInitialState() {
  return {
    theme: "poster",
    separation: 16,              // 0..100，刻意以 16% 塌陷糊墙错态开场
    headingMode: "vague",        // "vague" | "clear" | "allbold"
    rhythm: "poster",            // "poster" | "left" | "zigzag" | "dense8"
    order: [...BROKEN_ORDER],    // 刻意以第 5 层行动引导插队到第 2 位开场
    expandedKey: null,           // 当前点击展开深读的层 key
    viewMode: "gaze",            // "gaze" | "clean"
    selectedLayerIdx: -1,        // 键盘/点击最近聚焦的层
  };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 计算画布上每一层的真实绘制矩形、字体字号、层缝与控件点击区域
export function computeLayout(state, width, height) {
  const theme = THEMES[state.theme] || THEMES.poster;
  const compact = width < 560;
  const shortH = height < 320;
  const sep = clamp(state.separation, 0, 100);
  const sepT = sep / 100;

  // 真实排印参数随分离度连续变化
  const padTop = shortH ? 28 : compact ? 36 : 42;
  const padBottom = shortH ? 20 : compact ? 22 : 26;
  const padRight = compact ? 10 : 18;
  const ladderW = compact ? 64 : shortH ? 82 : 108;
  const ladderGap = compact ? 8 : shortH ? 10 : 16;

  const cakeX = ladderW + ladderGap;
  const cakeW = Math.max(180, width - cakeX - padRight);

  // 层数：正常 5 层；当节奏切为 dense8（过度切碎）时展示 8 条扁碎层
  const isDense8 = state.rhythm === "dense8";
  const orderKeys = isDense8
    ? [...state.order, "detail", "verify", "points"]
    : [...state.order];
  const n = orderKeys.length;

  // 真实层缝（像素）：0% -> 2px（糊墙粘连）；64% -> 14px（原海报清晰呼吸）；100% -> 28px（断层过大撑爆画幅）
  const baseGap = isDense8
    ? Math.max(2, Math.round(2 + sepT * 6))
    : Math.round(2 + sepT * (shortH ? 18 : 26));

  // 真实标题字号与正文字号（像素）
  const bodySize = shortH ? 10 : compact ? 10.5 : 12;
  // 分离度决定标题/正文阶差：0% -> 1.05x（几乎平权）；64% -> 1.68x；100% -> 2.15x（过度臃肿）
  const rawRatio = isDense8
    ? 1.08 + sepT * 0.24
    : state.headingMode === "allbold"
      ? 1.06 + sepT * 0.16
      : 1.04 + sepT * (shortH ? 0.85 : 1.12);
  const headingSize = +(bodySize * rawRatio).toFixed(1);

  const availH = Math.max(190, height - padTop - padBottom);
  const expandedExtra = state.expandedKey && !isDense8 ? (shortH ? 26 : compact ? 36 : 48) : 0;

  // 当分离度极高（>82%）时，层高 + 超宽缝隙会超出可见框下沿，真实体现「过宽断层、一屏扫不完」
  const bloatFactor = sep > 82 ? 1 + ((sep - 82) / 18) * 0.28 : 1;
  const rawLayerH = ((availH - baseGap * (n - 1) - expandedExtra) / n) * bloatFactor;
  const minLayerH = isDense8 ? (compact ? 24 : 28) : (shortH ? 34 : compact ? 42 : 52);
  const layerH = Math.max(minLayerH, rawLayerH);

  // 锯齿乱跳偏移
  const zigzagOffsets = [0, 0.14, -0.02, 0.19, 0.06, 0.16, 0.02, 0.12];
  const zigzagWidths  = [1, 0.80, 0.94, 0.74, 0.88, 0.78, 0.92, 0.82];

  const layers = [];
  let cursorY = padTop;

  for (let i = 0; i < n; i++) {
    const key = orderKeys[i];
    const data = theme.layers[key];
    const palette = LAYER_PALETTE[key];
    const roleMeta = ROLE_META[key];
    const isExtraSlice = i >= 5;
    const isExpanded = !isDense8 && !isExtraSlice && state.expandedKey === key;
    const h = layerH + (isExpanded ? expandedExtra : 0);

    let x = cakeX;
    let w = cakeW;
    let textIndent = compact ? 10 : 16;

    if (state.rhythm === "zigzag") {
      x = cakeX + Math.round(cakeW * zigzagOffsets[i % zigzagOffsets.length]);
      w = Math.round(cakeW * zigzagWidths[i % zigzagWidths.length]);
      if (x + w > width - padRight) w = width - padRight - x;
    } else if (state.rhythm === "left") {
      // 左锚齐眉：统一严谨左边界与内缩标尺，也是合法的优质层蛋糕解
      textIndent = compact ? 14 : 22;
    }

    const headingText = state.headingMode === "vague" ? data.vagueHead : data.clearHead;
    const padY = Math.max(5, Math.min(12, Math.round(h * 0.15)));
    const headY = cursorY + padY + headingSize * 0.85;
    const bodyY = headY + Math.max(8, Math.round(headingSize * 0.45 + sepT * 6));

    // 右侧上移/下移小按钮命中区（仅 5 层正常模式下显示）
    const ctrlW = compact ? 22 : 26;
    const ctrlH = compact ? 18 : 20;
    const ctrlX = x + w - ctrlW - (compact ? 6 : 10);
    const upRect = !isDense8 && i > 0
      ? { x: ctrlX - (i < n - 1 ? ctrlW + 4 : 0), y: cursorY + 6, w: ctrlW, h: ctrlH }
      : null;
    const downRect = !isDense8 && i < n - 1
      ? { x: ctrlX, y: cursorY + 6, w: ctrlW, h: ctrlH }
      : null;

    const isOverflow = cursorY + h > height - 6;

    layers.push({
      index: i,
      key,
      isExtraSlice,
      isTarget: !isExtraSlice && key === theme.targetKey,
      isExpanded,
      isOverflow,
      slotName: isExtraSlice ? `碎层 ${i + 1}` : SLOT_NUMBERS[i],
      roleLabel: isExtraSlice ? "重复切片" : roleMeta.role,
      slotTag: roleMeta.slotLabel,
      palette,
      headingText: isExtraSlice ? `子项 ${i - 4}：${data.tag}补充说明` : headingText,
      previewText: data.preview,
      deepText: data.deep,
      hitText: data.hitText,
      tag: data.tag,
      x,
      y: cursorY,
      w,
      h,
      headingSize,
      bodySize,
      textIndent,
      headRect: {
        x: x + textIndent,
        y: cursorY + padY,
        w: Math.max(80, w - textIndent - (compact ? 56 : 86)),
        h: headingSize + 4,
      },
      bodyRect: {
        x: x + textIndent,
        y: bodyY - bodySize * 0.7,
        w: Math.max(80, w - textIndent - 16),
        h: Math.max(12, cursorY + h - (bodyY - bodySize * 0.7) - 6),
      },
      upRect,
      downRect,
      ladderCenterY: cursorY + h * 0.5,
    });

    cursorY += h + baseGap;
  }

  const totalStackH = cursorY - baseGap - padTop;
  const overflowPx = Math.max(0, Math.round(cursorY - baseGap - (height - padBottom)));
  const visibleLayers = layers.filter((l) => l.y + l.h * 0.5 <= height - 8).length;

  return {
    width,
    height,
    compact,
    theme,
    padTop,
    padBottom,
    ladderW,
    cakeX,
    cakeW,
    gapPx: baseGap,
    headingSize,
    bodySize,
    sizeRatio: +(headingSize / bodySize).toFixed(2),
    layers,
    totalStackH,
    overflowPx,
    visibleLayers,
  };
}

// 检查层序是否符合「由泛到细，逐步深入」
// 接受多组合法解：标准 1→2→3→4→5，或「先验证后补细」1→2→4→3→5
export function evaluateOrder(order) {
  const idx = Object.fromEntries(order.map((k, i) => [k, i]));
  const overviewFirst = idx.overview === 0;
  const actionLast = idx.action === order.length - 1;
  const pointsBeforeMiddleEnd = idx.points === 1;
  const exactCanonical = CANONICAL_ORDER.every((k, i) => order[i] === k);
  const altProofFirst =
    order[0] === "overview" &&
    order[1] === "points" &&
    order[2] === "verify" &&
    order[3] === "detail" &&
    order[4] === "action";

  if (exactCanonical) {
    return { valid: true, variant: "canonical", issue: "", badge: "由泛到细" };
  }
  if (altProofFirst) {
    return { valid: true, variant: "proof-first", issue: "", badge: "先证后细" };
  }
  if (idx.action < idx.points || idx.action < idx.detail) {
    return {
      valid: false,
      variant: "cta-early",
      issue: `「决定行动」插队到第 ${idx.action + 1} 层，读者还没看清要点与依据就被催着点击`,
      badge: "行动越位",
    };
  }
  if (!overviewFirst) {
    return {
      valid: false,
      variant: "overview-buried",
      issue: `「抓住大意」沉到第 ${idx.overview + 1} 层，第一眼抓不住整页主题`,
      badge: "主标下沉",
    };
  }
  if (!actionLast) {
    return {
      valid: false,
      variant: "action-mid",
      issue: `「决定行动」没有收在底层，读者看完依据后找不到出口`,
      badge: "出口悬空",
    };
  }
  if (!pointsBeforeMiddleEnd) {
    return {
      valid: false,
      variant: "points-late",
      issue: `「提炼要点」排到了第 ${idx.points + 1} 层，读者被迫先啃细节再看结论`,
      badge: "要点后置",
    };
  }
  return { valid: true, variant: "valid", issue: "", badge: "分层成立" };
}

// 单真源综合研判：全部指标直接源自 layout 实测值与 state
export function evaluate(state, layout) {
  const sep = clamp(state.separation, 0, 100);
  const ratio = layout.sizeRatio;
  const gap = layout.gapPx;
  const orderEval = evaluateOrder(state.order);

  // 各维度独立实测判定
  const isDense8 = state.rhythm === "dense8";
  const isCollapsed = !isDense8 && (sep < 36 || ratio < 1.32 || gap < 8);
  const isShattered = !isDense8 && (sep > 84 || layout.overflowPx > 14);
  const isVague = state.headingMode === "vague";
  const isAllBold = state.headingMode === "allbold";
  const isZigzag = state.rhythm === "zigzag";

  // 1. 横向层读 LAYERS：要求清晰区分标题与正文、且不撑爆断层
  const passLayers = !isCollapsed && !isShattered && !isAllBold;
  // 2. 标题驱动 SKIM：要求前置信息型标题且标题明显强于正文
  const passSkim = state.headingMode === "clear" && !isCollapsed;
  // 3. 节奏重复 STRIPES：要求规则左锚或原海报满幅条带，无黏连无过碎无断层
  const passStripes = !isZigzag && !isDense8 && !isCollapsed && !isShattered;
  // 4. 快速定位 FOCUS：能在视窗内直接靠标题命中目标层
  const targetLayer = layout.layers.find((l) => l.isTarget);
  const targetVisible = targetLayer ? !targetLayer.isOverflow : false;
  const passFocus = passLayers && passSkim && passStripes && targetVisible;
  // 5. 信息分层 HIERARCHY：由泛到细，层序成立且未碎成 8 层
  const passHierarchy = orderEval.valid && !isDense8 && !isCollapsed;

  const principles = [
    {
      id: "layers",
      title: "横向层读",
      en: "LAYERS",
      posterBody: "按层次自上而下浏览",
      pass: passLayers,
      badge: isAllBold
        ? "全篇高喊"
        : isCollapsed
          ? `糊墙 ${ratio.toFixed(2)}×`
          : isShattered
            ? `断层 ${gap}px`
            : `层差 ${ratio.toFixed(2)}×`,
      reason: isAllBold
        ? "正文也满铺粗亮样式，奶油留白消失，视线分不出哪行是层。"
        : isCollapsed
          ? `标题只比正文大 ${ratio.toFixed(2)} 倍、层缝仅 ${gap}px，各层黏成一堵字墙。`
          : isShattered
            ? `层缝撑到 ${gap}px 且超出视窗 ${layout.overflowPx}px，上下层失去整体感。`
            : `标题/正文 ${ratio.toFixed(2)}× 配 ${gap}px 层缝，形成稳定水平蛋糕带。`,
    },
    {
      id: "skim",
      title: "标题驱动",
      en: "SKIM",
      posterBody: "先看标题与小标题",
      pass: passSkim,
      badge: isVague ? "标题失语" : isAllBold ? "满屏同权" : isCollapsed ? "弱对比" : "实词前置",
      reason: isVague
        ? "标题在卖关子，不点进正文根本不知道「" + layout.theme.taskTarget + "」藏在哪层。"
        : isAllBold
          ? "正文抢走了粗体权重，小标题不再是唯一视线落点。"
          : isCollapsed
            ? "文案虽直白，但字号反差不足，扫读时抓不住标题入口。"
            : "每层标题前几个字就标明主题，读者扫标题即可决定跳过还是深入。",
    },
    {
      id: "stripes",
      title: "节奏重复",
      en: "STRIPES",
      posterBody: "条带式重复信息结构",
      pass: passStripes,
      badge: isZigzag ? "锯齿错排" : isDense8 ? "8层过碎" : isCollapsed ? "黏连无缝" : isShattered ? "间隙断裂" : state.rhythm === "left" ? "左锚齐眉" : "等宽横带",
      reason: isZigzag
        ? "各层左右起点忽左忽右，眼睛每下移一层都要重新搜索左缘。"
        : isDense8
          ? "硬拆成 8 条过窄细带，标题疲劳抵消了扫读省力优势。"
          : isCollapsed
            ? "层缝过窄，五层融成一整块灰墙，失去重复条带节奏。"
            : isShattered
              ? "间隙大过层高本身，条带韵律被拉断。"
              : "五层保持一致的横向条带节奏，眼睛按固定节拍顺滑下滑。",
    },
    {
      id: "focus",
      title: "快速定位",
      en: "FOCUS",
      posterBody: "迅速锁定关键信息",
      pass: passFocus,
      badge: !targetVisible ? "目标被挤出" : passFocus ? `第 ${(targetLayer?.index ?? 2) + 1} 层直达` : "被迫盲挖",
      reason: !targetVisible
        ? "层缝撑得太大，目标层被挤出首屏扫视窗，不得不额外翻页。"
        : passFocus
          ? `仅沿标题扫至第 ${(targetLayer?.index ?? 2) + 1} 层即锁定「${layout.theme.taskTarget}」，其余正文全部略过。`
          : "缺少清晰的标题路标或层级切缝，视线只能逐段钻进正文试错。",
    },
    {
      id: "hierarchy",
      title: "信息分层",
      en: "HIERARCHY",
      posterBody: "由泛到细，逐步深入",
      pass: passHierarchy,
      badge: isDense8 ? "层级塌平" : isCollapsed ? "未分层" : orderEval.badge,
      reason: isDense8
        ? "同级碎条堆满屏幕，看不出大意、要点、细节与行动的递进。"
        : isCollapsed
          ? "视觉上尚未拉出层次，信息深浅混为一谈。"
          : !orderEval.valid
            ? orderEval.issue
            : orderEval.variant === "proof-first"
              ? "采用「大意 → 要点 → 验证 → 细节 → 行动」先证后细解，同样符合由泛到细。"
              : "严格遵循「抓住大意 → 提炼要点 → 补充细节 → 验证判断 → 决定行动」。",
    },
  ];

  const passCount = principles.filter((p) => p.pass).length;
  const isValid = passCount === 5;

  // 按优先级收集双向错态（用于白话研判和一键引导修错）
  const faults = [];
  if (isAllBold) {
    faults.push({
      code: "allbold",
      title: "正文全篇满加粗，奶油留白被刷成噪点",
      why: "层蛋糕之所以好扫，全靠「醒目标题（蛋糕）」和「安静正文（奶油）」的反差。把正文也铺满粗体高对比，等于把整块蛋糕搅成斑点噪点，眼睛到处乱撞。",
      hint: "把标题写法切回「前置信息型」，让正文退回细字克制态。",
      fixLabel: "恢复标题与正文反差",
      fixPatch: { headingMode: "clear" },
    });
  }
  if (isCollapsed) {
    faults.push({
      code: "collapsed",
      title: `切层仅 ${sep}%（字比 ${ratio.toFixed(2)}× · 层缝 ${gap}px），视线退回 F 型盲扫`,
      why: "当标题只比正文大一点、段间几乎没有呼吸缝，五层内容会黏成一堵连续文字墙。眼动研究证实，遇到这种页面，用户会立刻放弃逐层筛选，退化成 F 型只扫顶部和左侧，埋在中下层的核心数据被整片漏掉。",
      hint: "直接在画布上向右横拖，或拉动「切层分离度」到 44%–78% 区间。",
      fixLabel: "拉开至 64% 标准切层",
      fixPatch: { separation: 64 },
    });
  }
  if (isShattered) {
    faults.push({
      code: "shattered",
      title: `切层拉到 ${sep}%（层缝 ${gap}px），蛋糕断层且超出扫视窗`,
      why: "分层不是越宽越好。缝隙过宽、标题过度膨胀时，相邻两层脱离了同一眼动余光范围，底部信息被挤出视窗，原本一口气扫完的 5 层节奏碎成了几块孤岛。",
      hint: "在画布上向左横拖收拢缝隙，把切层分离度拉回 48%–76%。",
      fixLabel: "收拢至 64% 适中层缝",
      fixPatch: { separation: 64 },
    });
  }
  if (isVague) {
    faults.push({
      code: "vague",
      title: "小标题全是文艺空话，读者不得不逐段深挖正文",
      why: `即使横带排得再整齐，如果小标题写的是「一场正在改写格局的浪潮」「数字背后的脉络」，读者依然无法判断「${layout.theme.taskTarget}」藏在哪一层，只能每层都钻进去翻正文，层蛋糕的省时优势瞬间归零。`,
      hint: "把标题写法切换为「前置信息型」，让前几个字直接亮出主题实词。",
      fixLabel: "改用前置信息型标题",
      fixPatch: { headingMode: "clear" },
    });
  }
  if (isZigzag) {
    faults.push({
      code: "zigzag",
      title: "条带锯齿错排，视线每下一层都在找左边界",
      why: "层蛋糕靠重复的横向锚点建立节拍。每层起点左右乱跳时，眼睛向下跳读无法沿同一条垂直轨道滑落，扫读流畅度明显下降。",
      hint: "将条带节奏切回「原海报条带」或「左锚齐眉」。",
      fixLabel: "对齐统一左锚条带",
      fixPatch: { rhythm: "poster" },
    });
  }
  if (isDense8) {
    faults.push({
      code: "dense8",
      title: "强行劈成 8 层碎条，标题过多引发扫描疲劳",
      why: "如果每两句话就硬塞一条小标题，整屏堆满 8 条以上碎带，读者需要筛选的入口比正文还多，反而不愿意继续浏览。",
      hint: "合并回 5 层清晰结构（原海报条带或左锚齐眉）。",
      fixLabel: "收束为 5 层清晰结构",
      fixPatch: { rhythm: "poster" },
    });
  }
  if (!orderEval.valid) {
    faults.push({
      code: "order",
      title: `信息层序倒置：${orderEval.badge}`,
      why: `${orderEval.issue}。原海报强调「由泛到细，逐步深入」——先用第一层定大意、第二层给结论，再给细节与验证，最后落到行动。`,
      hint: "点画布上各层右侧的 ↑/↓ 按钮调顺，或点下方一键排顺。",
      fixLabel: "按由泛到细校正层序",
      fixPatch: { order: [...CANONICAL_ORDER] },
    });
  }

  // 模式分类与多组合法解评语
  let patternType = "layer-cake";
  let tierLabel = "层蛋糕成立";
  let headline = "";
  let explanation = "";
  let hint = "";
  let fixLabel = "";
  let fixPatch = null;

  if (isValid) {
    patternType = "layer-cake";
    const styleVariant = sep <= 54
      ? "紧凑快扫解"
      : sep >= 72
        ? "舒朗研报解"
        : state.rhythm === "left"
          ? "左锚齐眉解"
          : orderEval.variant === "proof-first"
            ? "先证后细解"
            : "原海报标准解";
    tierLabel = `5/5 · ${styleVariant}`;
    headline = `层蛋糕扫描成立（${styleVariant}）：眼睛沿标题横扫即锁定目标`;
    explanation = `标题/正文反差达 ${ratio.toFixed(2)}×，层间留白 ${gap}px，每层首词直指主题。视线只在 5 条横带标题上快速落点，精准命中第 ${(targetLayer?.index ?? 2) + 1} 层「${layout.theme.taskTarget}」，跳过其余约 72% 无关正文（示意）。点画布中任意一层可亲自体验「决定是否深入」。`;
    hint = "你也可以故意拖到 95% 试试「过宽断层」，或切到「锯齿乱跳 / 全篇满加粗」看看层蛋糕如何瓦解。";
  } else {
    const primary = faults[0];
    if (isAllBold) patternType = "spotted-noise";
    else if (isCollapsed) patternType = "f-fallback";
    else if (isShattered) patternType = "shattered";
    else if (isVague) patternType = "blind-dig";
    else patternType = "disrupted";

    const shortTag =
      primary.code === "collapsed" ? "塌陷糊墙" :
      primary.code === "shattered" ? "过宽断层" :
      primary.code === "vague" ? "标题失语" :
      primary.code === "allbold" ? "满屏高喊" :
      primary.code === "zigzag" ? "锯齿错排" :
      primary.code === "dense8" ? "过度切碎" : "层序倒置";

    tierLabel = `${passCount}/5 · ${shortTag}`;
    headline = primary.title;
    explanation = primary.why;
    hint = primary.hint;
    fixLabel = primary.fixLabel;
    fixPatch = primary.fixPatch;
  }

  // 模拟扫读耗时档位与跳过正文比例（明确标「示意」，杜绝假精确）
  let scanTier = "约 2.1 秒 · 逐层直达（示意）";
  let skipLabel = "约 72% 正文可略过（示意）";
  if (patternType === "f-fallback") {
    scanTier = "约 8.5 秒 · 退回 F 型盲找（示意）";
    skipLabel = "仅 18% 可略过（示意）";
  } else if (patternType === "blind-dig") {
    scanTier = "约 6.8 秒 · 逐层翻正文（示意）";
    skipLabel = "约 25% 可略过（示意）";
  } else if (patternType === "spotted-noise") {
    scanTier = "约 6.2 秒 · 斑点乱跳（示意）";
    skipLabel = "约 30% 可略过（示意）";
  } else if (patternType === "shattered") {
    scanTier = "约 4.9 秒 · 跨屏跳找（示意）";
    skipLabel = "约 52% 可略过（示意）";
  } else if (!isValid) {
    scanTier = "约 4.6 秒 · 节奏受阻（示意）";
    skipLabel = "约 48% 可略过（示意）";
  } else if (sep <= 54) {
    scanTier = "约 2.4 秒 · 紧凑快扫（示意）";
    skipLabel = "约 68% 正文可略过（示意）";
  } else if (sep >= 72) {
    scanTier = "约 2.3 秒 · 舒朗逐层（示意）";
    skipLabel = "约 74% 正文可略过（示意）";
  }

  // 原海报底沿四项「带来的价值」实况状态
  const values = [
    {
      id: "efficient",
      title: "高效浏览",
      en: "EFFICIENT",
      body: "更快完成筛选与判断",
      ok: passLayers && passSkim,
      status: passLayers && passSkim ? "横扫即判" : "被迫慢啃",
    },
    {
      id: "focused",
      title: "抓住重点",
      en: "FOCUSED",
      body: "不错过关键信息",
      ok: passFocus,
      status: passFocus ? "命中核心" : "容易漏读",
    },
    {
      id: "rhythm",
      title: "阅读流畅",
      en: "RHYTHM",
      body: "节奏清晰，减少负担",
      ok: passStripes,
      status: passStripes ? "条带顺滑" : "眼动颠簸",
    },
    {
      id: "actionable",
      title: "提升决策",
      en: "ACTIONABLE",
      body: "快速定位，指导行动",
      ok: passHierarchy && passFocus,
      status: passHierarchy && passFocus ? "出口顺承" : "决策受阻",
    },
  ];

  // 从实绘 layer 几何单真源生成眼动路径节点
  const gazeSteps = buildGazeSteps(patternType, layout, state);

  return {
    isValid,
    passCount,
    patternType,
    tierLabel,
    headline,
    explanation,
    hint,
    fixLabel,
    fixPatch,
    principles,
    values,
    faults,
    metrics: {
      sizeRatio: `${ratio.toFixed(2)}×`,
      gapPx: `${gap}px`,
      scanTier,
      skipLabel,
      orderLabel: orderEval.badge,
      sepPct: `${Math.round(sep)}%`,
    },
    gazeSteps,
  };
}

function buildGazeSteps(patternType, layout, state) {
  const layers = layout.layers;
  if (!layers.length) return [];

  // 1. 糊墙塌陷：真实的 F 型衰减轨迹（顶部横扫 → 次行短扫 → 左缘垂直下坠）
  if (patternType === "f-fallback") {
    const l0 = layers[0];
    const l1 = layers[Math.min(1, layers.length - 1)];
    const lLast = layers[Math.min(4, layers.length - 1)];
    return [
      { kind: "f-bar", x0: l0.headRect.x, y0: l0.headRect.y + l0.headingSize * 0.5, x1: l0.headRect.x + l0.headRect.w * 0.88, y1: l0.headRect.y + l0.headingSize * 0.5, layerIdx: 0 },
      { kind: "f-bar", x0: l1.headRect.x, y0: l1.headRect.y + l1.headingSize * 0.5, x1: l1.headRect.x + l1.headRect.w * 0.52, y1: l1.headRect.y + l1.headingSize * 0.5, layerIdx: 1 },
      { kind: "f-stem", x0: l0.headRect.x + 12, y0: l0.headRect.y + l0.headingSize * 0.5, x1: l0.headRect.x + 12, y1: Math.min(layout.height - 26, lLast.y + lLast.h * 0.72), layerIdx: 4 },
    ];
  }

  // 2. 全篇满加粗：斑点式无序乱跳
  if (patternType === "spotted-noise") {
    const spots = [];
    const fracs = [0.22, 0.74, 0.45, 0.16, 0.68, 0.35];
    for (let i = 0; i < Math.min(layers.length, 5); i++) {
      const l = layers[i];
      if (l.y > layout.height - 16) break;
      spots.push({
        kind: "spot",
        x0: l.x + l.w * fracs[i % fracs.length],
        y0: l.y + l.h * (i % 2 === 0 ? 0.36 : 0.68),
        x1: l.x + l.w * fracs[(i + 2) % fracs.length],
        y1: l.y + l.h * (i % 2 === 0 ? 0.68 : 0.42),
        layerIdx: i,
      });
    }
    return spots;
  }

  // 3. 标题卖关子：每层既扫标题又被迫钻进正文区域盲挖
  if (patternType === "blind-dig") {
    const steps = [];
    for (let i = 0; i < Math.min(layers.length, 5); i++) {
      const l = layers[i];
      if (l.y > layout.height - 18) break;
      steps.push({
        kind: "stripe-weak",
        x0: l.headRect.x,
        y0: l.headRect.y + l.headingSize * 0.5,
        x1: l.headRect.x + l.headRect.w * 0.62,
        y1: l.headRect.y + l.headingSize * 0.5,
        layerIdx: i,
      });
      steps.push({
        kind: "dig",
        x0: l.bodyRect.x + 6,
        y0: l.bodyRect.y + 8,
        x1: l.bodyRect.x + l.bodyRect.w * 0.76,
        y1: l.bodyRect.y + 8,
        layerIdx: i,
      });
      if (l.isTarget) break;
    }
    return steps;
  }

  // 4. 正常层蛋糕 / 锯齿 / 断层：沿每层标题横带扫读，跳过非目标层正文，遇到目标层或展开层时切入深读
  const steps = [];
  for (let i = 0; i < layers.length; i++) {
    const l = layers[i];
    if (l.y > layout.height - 14) break;
    const isHit = l.isTarget || l.isExpanded;
    const span = l.isTarget ? 0.90 : i === 0 ? 0.82 : 0.66;
    steps.push({
      kind: l.isTarget ? "stripe-hit" : "stripe",
      x0: l.headRect.x,
      y0: l.headRect.y + l.headingSize * 0.5,
      x1: l.headRect.x + l.headRect.w * span,
      y1: l.headRect.y + l.headingSize * 0.5,
      layerIdx: i,
    });
    if (isHit && state.headingMode === "clear") {
      steps.push({
        kind: "drill",
        x0: l.bodyRect.x,
        y0: l.bodyRect.y + 10,
        x1: l.bodyRect.x + l.bodyRect.w * 0.85,
        y1: l.bodyRect.y + 10,
        layerIdx: i,
      });
      if (l.isTarget && !state.expandedKey) break;
    }
  }
  return steps;
}

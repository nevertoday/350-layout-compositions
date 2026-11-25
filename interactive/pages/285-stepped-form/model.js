// 285 分步表单 · 单真源状态机与评估模型
// 全部切分、步数、语义断层、负荷档位、活体表单校验与各节交互共读同一真源。

export const DOMAIN_META = [
  { id: 0, name: "账户", full: "账户信息", sub: "填写登录与基础凭证", color: "#5E1949", tint: "#F4E5EF", stroke: "#8C3D72" },
  { id: 1, name: "个人", full: "个人信息", sub: "补充个人资料，帮助我们更好地为您服务。", color: "#D44E20", tint: "#FDEAE1", stroke: "#F47341" },
  { id: 2, name: "验证", full: "验证信息", sub: "完成身份核验，保障账户与交易安全。", color: "#9C5B0E", tint: "#FBF1DF", stroke: "#D48A2B" },
  { id: 3, name: "确认", full: "完成提交", sub: "核对已填资料并确认协议后提交。", color: "#1A6E4E", tint: "#E2F4EC", stroke: "#2F9670" },
];

export const SCENARIOS = {
  poster: {
    id: "poster",
    name: "原海报 · 账户注册",
    shortName: "账户注册",
    idealCuts: [3, 8, 10],
    compactCuts: [3, 8],
    lightCuts: [3, 6, 8, 10],
    domains: [
      { name: "账户信息", short: "账户", sub: "填写基本信息", icon: "user" },
      { name: "个人信息", short: "个人", sub: "补充个人资料，帮助我们更好地为您服务。", icon: "card" },
      { name: "验证信息", short: "验证", sub: "身份验证，保护账户归属安全。", icon: "shield" },
      { name: "完成提交", short: "提交", sub: "确认无误后正式提交开通。", icon: "check" },
    ],
    fields: [
      { id: "email", label: "登录邮箱", domain: 0, type: "email", required: true, weight: 1.1, placeholder: "name@studio.cn", hint: "用于接收开户通知与安全提醒", defaultVal: "lin.yu@studio.cn", check: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "请输入有效的邮箱格式（含 @ 与域名）" },
      { id: "pwd", label: "设置密码", domain: 0, type: "password", required: true, weight: 1.35, placeholder: "至少 8 位字母与数字", hint: "建议包含字母与数字，不少于 8 位", defaultVal: "Step2026!", check: (v) => v.trim().length >= 8 ? "" : "密码需不少于 8 位字符" },
      { id: "handle", label: "账户昵称", domain: 0, type: "text", required: true, weight: 0.9, placeholder: "展示用称呼", hint: "可随时在个人设置中修改", defaultVal: "林予", check: (v) => v.trim().length >= 2 ? "" : "昵称至少填写 2 个字符" },
      { id: "realname", label: "姓名", domain: 1, type: "text", required: true, weight: 0.95, placeholder: "请输入真实姓名", hint: "需与后续实名核验一致", defaultVal: "林予安", check: (v) => v.trim().length >= 2 ? "" : "请填写真实姓名" },
      { id: "gender", label: "性别", domain: 1, type: "radio", required: true, weight: 0.7, options: ["男", "女", "其他"], hint: "用于个性化称呼", defaultVal: "女", check: (v) => v ? "" : "请选择性别" },
      { id: "phone", label: "手机号", domain: 1, type: "tel", required: true, weight: 1.15, placeholder: "请输入 11 位手机号", hint: "用于接收下一步短信验证码", defaultVal: "139-208", check: (v) => /^1\d{10}$/.test(v.replace(/[\s-]/g, "")) ? "" : "手机号应为 11 位中国大陆号码（当前仅填了片段）" },
      { id: "city", label: "居住城市", domain: 1, type: "select", required: true, weight: 0.85, options: ["请选择城市", "上海", "北京", "深圳", "杭州", "成都"], hint: "用于匹配本地服务时区", defaultVal: "杭州", check: (v) => v && v !== "请选择城市" ? "" : "请选择常住城市" },
      { id: "bio", label: "简介", domain: 1, type: "textarea", required: false, maxLen: 120, weight: 0.75, placeholder: "简单介绍自己…", hint: "可先留空，开通后再补写", defaultVal: "交互设计师，专注复杂业务表单体验优化。", check: () => "" },
      { id: "idtail", label: "证件后四位", domain: 2, type: "text", required: true, weight: 1.4, placeholder: "如 482X", hint: "仅用于核对本人身份，加密传输", defaultVal: "482X", check: (v) => /^[0-9A-Za-z]{4}$/.test(v.trim()) ? "" : "请输入 4 位证件尾号" },
      { id: "sms", label: "短信验证码", domain: 2, type: "text", required: true, weight: 1.35, placeholder: "6 位数字", hint: "已发送至上一步填写的手机号（演示填 842910）", defaultVal: "842910", check: (v) => /^\d{6}$/.test(v.trim()) ? "" : "请输入 6 位数字验证码" },
      { id: "digest", label: "周报订阅", domain: 3, type: "select", required: false, weight: 0.65, options: ["仅重要通知", "每周产品更新", "暂不订阅"], hint: "可随时在消息中心退订", defaultVal: "仅重要通知", check: () => "" },
      { id: "agree", label: "确认协议", domain: 3, type: "checkbox", required: true, weight: 0.85, placeholder: "我已核对以上信息，并同意《用户协议》与《隐私声明》", hint: "提交前可点顶部步骤返回修改", defaultVal: true, check: (v) => v ? "" : "提交前需先勾选确认协议" },
    ],
  },
  checkout: {
    id: "checkout",
    name: "跨境电商结账",
    shortName: "电商结账",
    idealCuts: [3, 7, 10],
    compactCuts: [3, 7],
    lightCuts: [3, 5, 7, 10],
    domains: [
      { name: "收货地址", short: "收货", sub: "确认包裹投递人与送达地点。", icon: "user" },
      { name: "清关与物流", short: "物流", sub: "匹配跨境快递方式与清关申报。", icon: "card" },
      { name: "支付方式", short: "支付", sub: "选择扣款账户并校验安全码。", icon: "shield" },
      { name: "核对下单", short: "下单", sub: "核查含税总价与运费后确认支付。", icon: "check" },
    ],
    fields: [
      { id: "receiver", label: "收件人", domain: 0, type: "text", required: true, weight: 0.9, placeholder: "真实姓名", hint: "需与清关人一致", defaultVal: "周明远", check: (v) => v.trim().length >= 2 ? "" : "请填写收件人姓名" },
      { id: "mobile", label: "联系电话", domain: 0, type: "tel", required: true, weight: 1.1, placeholder: "11 位手机号", hint: "派送前短信通知", defaultVal: "138-09", check: (v) => /^1\d{10}$/.test(v.replace(/[\s-]/g, "")) ? "" : "请填写完整 11 位收件手机号" },
      { id: "addr", label: "详细街道", domain: 0, type: "text", required: true, weight: 1.2, placeholder: "区、路、门牌号", hint: "精确到楼栋门牌", defaultVal: "静安区延安中路 816 号", check: (v) => v.trim().length >= 5 ? "" : "请填写详细收货地址" },
      { id: "ship", label: "配送时效", domain: 1, type: "radio", required: true, weight: 0.85, options: ["保税直邮 3天", "标准跨境 7天"], hint: "运费与税费将实时透明展示", defaultVal: "保税直邮 3天", check: (v) => v ? "" : "请选择配送方式" },
      { id: "customs", label: "清关证件号", domain: 1, type: "text", required: true, weight: 1.45, placeholder: "身份证后 6 位", hint: "海关个人物品清关必填", defaultVal: "294810", check: (v) => /^[0-9A-Za-z]{6}$/.test(v.trim()) ? "" : "请输入 6 位清关证件尾号" },
      { id: "invoice", label: "发票抬头", domain: 1, type: "select", required: false, weight: 0.75, options: ["不开发票", "个人电子票", "企业增值税票"], hint: "选填，收货后 7 天内也可补开", defaultVal: "个人电子票", check: () => "" },
      { id: "note", label: "配送备注", domain: 1, type: "textarea", required: false, maxLen: 80, weight: 0.65, placeholder: "如：放驿站或周末派送…", hint: "选填", defaultVal: "工作日白天放前台即可。", check: () => "" },
      { id: "payway", label: "付款渠道", domain: 2, type: "radio", required: true, weight: 0.9, options: ["银行卡", "微信支付", "支付宝"], hint: "全程加密扣款", defaultVal: "银行卡", check: (v) => v ? "" : "请选择付款渠道" },
      { id: "card4", label: "卡号后四位", domain: 2, type: "text", required: true, weight: 1.35, placeholder: "4 位数字", hint: "用于确认已绑定卡片", defaultVal: "6618", check: (v) => /^\d{4}$/.test(v.trim()) ? "" : "请输入 4 位银行卡尾号" },
      { id: "cvv", label: "安全校验码", domain: 2, type: "password", required: true, weight: 1.4, placeholder: "3 位 CVV", hint: "卡片背面签名条旁 3 位数字", defaultVal: "529", check: (v) => /^\d{3}$/.test(v.trim()) ? "" : "请输入 3 位安全码" },
      { id: "coupon", label: "优惠券码", domain: 3, type: "text", required: false, weight: 0.7, placeholder: "选填优惠码", hint: "已自动减免运费 ¥18", defaultVal: "", check: () => "" },
      { id: "confirm", label: "确认含税总额", domain: 3, type: "checkbox", required: true, weight: 0.9, placeholder: "我已确认含税总价 ¥428.00（含运费 ¥0）并提交订单", hint: "不在最后一步藏匿额外费用", defaultVal: true, check: (v) => v ? "" : "请先勾选确认含税总额" },
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "云服务企业入驻",
    shortName: "企业入驻",
    idealCuts: [3, 7, 10],
    compactCuts: [3, 7],
    lightCuts: [3, 5, 7, 10],
    domains: [
      { name: "主体资质", short: "主体", sub: "核验企业主体与统一社会信用代码。", icon: "user" },
      { name: "管理员信息", short: "管理", sub: "指定主管理员与运维通知通道。", icon: "card" },
      { name: "集群配置", short: "集群", sub: "选定默认区域、合规等级与计费。", icon: "shield" },
      { name: "协议开通", short: "开通", sub: "复核配置清单并签署服务协议。", icon: "check" },
    ],
    fields: [
      { id: "org", label: "企业全称", domain: 0, type: "text", required: true, weight: 1.15, placeholder: "与营业执照一致", hint: "用于合同签署与对公结算", defaultVal: "青禾数字科技有限公司", check: (v) => v.trim().length >= 4 ? "" : "请填写完整企业全称" },
      { id: "credit", label: "信用代码", domain: 0, type: "text", required: true, weight: 1.45, placeholder: "18 位社会信用代码", hint: "示例：91310104MA1FL82K4X", defaultVal: "91310104MA1FL82K4X", check: (v) => /^[0-9A-Za-z]{18}$/.test(v.trim()) ? "" : "请输入 18 位统一社会信用代码" },
      { id: "industry", label: "所属行业", domain: 0, type: "select", required: true, weight: 0.85, options: ["请选择行业", "软件与互联网", "智能制造", "金融科技", "医疗健康"], hint: "用于推荐合规基线模板", defaultVal: "软件与互联网", check: (v) => v && v !== "请选择行业" ? "" : "请选择所属行业" },
      { id: "admin", label: "主管理员", domain: 1, type: "text", required: true, weight: 0.9, placeholder: "负责人姓名", hint: "拥有最高权限", defaultVal: "陈致远", check: (v) => v.trim().length >= 2 ? "" : "请填写主管理员姓名" },
      { id: "workmail", label: "企业邮箱", domain: 1, type: "email", required: true, weight: 1.1, placeholder: "admin@company.com", hint: "接收账单与告警", defaultVal: "ops@qinghe.cn", check: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "请输入有效的企业邮箱" },
      { id: "opsphone", label: "告警手机", domain: 1, type: "tel", required: true, weight: 1.15, placeholder: "11 位手机号", hint: "故障时短信直达", defaultVal: "186-00", check: (v) => /^1\d{10}$/.test(v.replace(/[\s-]/g, "")) ? "" : "请填写完整 11 位运维手机号" },
      { id: "dept", label: "所属团队", domain: 1, type: "text", required: false, weight: 0.7, placeholder: "如：基础架构部", hint: "选填", defaultVal: "平台工程组", check: () => "" },
      { id: "region", label: "主服务区", domain: 2, type: "radio", required: true, weight: 0.95, options: ["华东一区", "华北二区", "华南一区"], hint: "就近接入降低延迟", defaultVal: "华东一区", check: (v) => v ? "" : "请选择主服务区" },
      { id: "tier", label: "合规等级", domain: 2, type: "select", required: true, weight: 1.2, options: ["标准安全基线", "等保三级增强", "金融专有隔离"], hint: "开通后可在控制台升级", defaultVal: "标准安全基线", check: (v) => v ? "" : "请选择合规等级" },
      { id: "billing", label: "计费周期", domain: 2, type: "radio", required: true, weight: 0.9, options: ["按量付费", "包年包月"], hint: "无隐藏开通费", defaultVal: "按量付费", check: (v) => v ? "" : "请选择计费周期" },
      { id: "remark", label: "迁移备注", domain: 3, type: "textarea", required: false, maxLen: 100, weight: 0.7, placeholder: "是否需要架构师协助？", hint: "选填", defaultVal: "", check: () => "" },
      { id: "sla", label: "签署 SLA", domain: 3, type: "checkbox", required: true, weight: 0.9, placeholder: "我已核对企业主体与集群配置，确认签署《云服务协议》", hint: "开通后 5 分钟内生效", defaultVal: true, check: (v) => v ? "" : "需勾选签署服务协议" },
    ],
  },
};

export const PROGRESS_MODES = [
  { id: "hidden", label: "隐身盲走", ok: false },
  { id: "percent", label: "虚标百分比", ok: false },
  { id: "steps-numbered", label: "编号步骤轨", ok: true },
  { id: "compact-dots", label: "紧凑步数标", ok: true },
];

export const GUIDANCE_MODES = [
  { id: "late-dump", label: "末尾总算账", ok: false },
  { id: "over-nag", label: "未输先报红", ok: false },
  { id: "per-step", label: "单步校验+指引", ok: true },
  { id: "inline-assist", label: "就地提示+校验", ok: true },
];

export const CONTROL_MODES = [
  { id: "no-back-wipe", label: "禁退·丢草稿", ok: false },
  { id: "linear-locked", label: "单向锁前步", ok: false },
  { id: "save-and-back", label: "自存+随时回退", ok: true },
  { id: "review-before-submit", label: "保稿+末步复核", ok: true },
];

export function defaultValuesFor(scenarioId) {
  const sc = SCENARIOS[scenarioId] || SCENARIOS.poster;
  const out = {};
  for (const f of sc.fields) out[f.id] = f.defaultVal;
  return out;
}

export function createInitialState(scenarioId = "poster") {
  // 开场刻意停在 0/4 失序错态：正中 6|6 跨题硬劈 + 盲走 + 末尾算账 + 禁返回丢草稿
  return {
    scenarioId,
    cuts: [6], // 单切点在正中央（index 6 / 12 = 50%），直接横拖即能感受切分
    currentStep: 0,
    progressMode: "hidden",
    guidanceMode: "late-dump",
    controlMode: "no-back-wipe",
    values: defaultValuesFor(scenarioId),
    visitedSteps: [0],
    completedSteps: [],
    submitted: false,
    lateErrors: [],
    stepErrors: {},
    lastSavedAt: "",
    wipedNotice: "",
  };
}

export function normalizeCuts(cuts, total = 12) {
  const clean = [...new Set(cuts.map((c) => Math.round(c)).filter((c) => c >= 1 && c <= total - 1))].sort((a, b) => a - b);
  return clean;
}

export function buildSteps(scenario, rawCuts) {
  const fields = scenario.fields;
  const cuts = normalizeCuts(rawCuts, fields.length);
  const bounds = [0, ...cuts, fields.length];
  const steps = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const start = bounds[i];
    const end = bounds[i + 1];
    const slice = fields.slice(start, end);
    const domainCounts = new Map();
    for (const f of slice) domainCounts.set(f.domain, (domainCounts.get(f.domain) || 0) + 1);
    const domains = [...domainCounts.keys()].sort((a, b) => a - b);
    // 主语义域
    let primaryDomain = domains[0];
    let bestCount = -1;
    for (const [d, c] of domainCounts.entries()) {
      if (c > bestCount) { bestCount = c; primaryDomain = d; }
    }
    const rawLoad = slice.reduce((acc, f) => acc + f.weight, 0);
    // 多主题混装会额外增加认知切换成本（示意加权）
    const mixPenalty = Math.max(0, domains.length - 1) * 1.15;
    const loadScore = +(rawLoad + mixPenalty).toFixed(2);
    const domMeta = scenario.domains[primaryDomain];
    const title = domains.length === 1
      ? (slice.length === fields.filter((x) => x.domain === primaryDomain).length ? domMeta.name : `${domMeta.short} · 第${i + 1}段`)
      : domains.length === 2 && domains[0] === 2 && domains[1] === 3 && slice.length <= 5
        ? `${scenario.domains[2].short}与${scenario.domains[3].short}`
        : `${scenario.domains[domains[0]].short}＋${scenario.domains[domains[domains.length - 1]].short}混装`;
    const subtitle = domains.length === 1
      ? domMeta.sub
      : domains.length === 2 && domains[0] === 2 && domains[1] === 3 && slice.length <= 5
        ? "核验关键凭证并一次性确认提交。"
        : `该步混入了 ${domains.map((d) => scenario.domains[d].short).join("、")} 等 ${domains.length} 组不同主题字段。`;
    steps.push({
      index: i,
      start,
      end,
      fields: slice,
      count: slice.length,
      domains,
      primaryDomain,
      icon: domMeta.icon,
      title,
      subtitle,
      loadScore,
      loadBand: loadScore >= 6.8 || slice.length >= 6 ? "超载" : loadScore >= 4.8 ? "偏重" : loadScore >= 2.2 ? "适中" : "轻盈",
    });
  }
  return { cuts, steps };
}

export function evaluateFlow(state) {
  const scenario = SCENARIOS[state.scenarioId] || SCENARIOS.poster;
  const { cuts, steps } = buildSteps(scenario, state.cuts);
  const stepCount = steps.length;
  const counts = steps.map((s) => s.count);
  const maxFields = Math.max(...counts);
  const minFields = Math.min(...counts);
  const splitLabel = counts.join(" / ");

  // 检查「跨主题硬劈」：同一语义域跨多步出现，且其中至少一步还混装了别的语义域
  const domainSteps = new Map();
  for (const s of steps) {
    for (const d of s.domains) {
      if (!domainSteps.has(d)) domainSteps.set(d, []);
      domainSteps.get(d).push(s);
    }
  }
  const tornDomains = [];
  for (const [d, list] of domainSteps.entries()) {
    if (list.length > 1 && list.some((s) => s.domains.length > 1)) {
      tornDomains.push(scenario.domains[d].name);
    }
  }
  // 检查「生硬混装」：一步装进 >=3 个不同语义域，或者把账号/个人与后续主题跨界混装（唯一允许温和合并的是最后一步 核验+确认 且总项 <=5）
  const awkwardMixedSteps = steps.filter((s) => {
    if (s.domains.length <= 1) return false;
    const isCleanFinalMerge = s.index === steps.length - 1 && s.domains.length === 2 && s.domains[0] === 2 && s.domains[1] === 3 && s.count <= 5;
    return !isCleanFinalMerge;
  });

  const issues = [];
  // 1. 拆步与节奏检测
  if (stepCount === 1) {
    issues.push({
      code: "single_wall",
      dim: "chunking",
      badge: "1 步长墙",
      title: "12 个字段全摊在一屏，根本没有分步",
      body: "账户凭证、个人资料、身份核验和协议确认挤在同一张长表里。用户刚打开就看到密密麻麻 12 项，大脑工作记忆瞬间超载，还没开始填就想关掉页面。",
      fixHint: "在上方切分轨里横拖或在字段间隙点 2–3 下，按「账户 / 个人 / 验证 / 提交」拆成 3–5 步。",
    });
  } else if (stepCount >= 7) {
    issues.push({
      code: "over_fragmented",
      dim: "chunking",
      badge: `${stepCount} 步碎片`,
      title: `切得太碎（${stepCount} 步），点「下一步」比填字还累`,
      body: `平均每步只装 ${(12 / stepCount).toFixed(1)} 项，原本顺手一起填的关联项被拆散。用户不断等待切页、重复寻找按钮，产生明显的点击疲劳。`,
      fixHint: "点击切分轨里多余的竖向闸门把它合并掉，把步数收回到 3–5 步经验舒适带。",
    });
  } else {
    if (tornDomains.length > 0) {
      issues.push({
        code: "topic_split",
        dim: "chunking",
        badge: `断层 ${tornDomains.length} 处`,
        title: `切点把「${tornDomains[0]}」硬劈成两半`,
        body: `现在按 ${splitLabel} 切分，同一组相关字段被拆散进相邻两步，并和别的主题混装在一起。用户刚答完一半个人资料，翻页后还要接着补另一半，心智模型被打断。`,
        fixHint: "把切分轨里的竖向闸门横拖到色块交界处，或点「原海报 4 步解 / 3 步精简解」对比干净的语义边界。",
      });
    }
    if (maxFields >= 6) {
      issues.push({
        code: "step_overload",
        dim: "chunking",
        badge: `最重 ${maxFields} 项`,
        title: `单步塞了 ${maxFields} 个字段，局部变成小长表`,
        body: `当前切分 ${splitLabel} 中，最重的一步承载了 ${maxFields} 项输入（经验建议单步 2–5 项）。即使挂着分步外壳，走到这一步照样让人望而生畏。`,
        fixHint: "在切分轨里为最重那一段增设切点或挪动闸门，让每步控制在 2–5 项。",
      });
    }
    if (awkwardMixedSteps.length > 0 && tornDomains.length === 0) {
      issues.push({
        code: "topic_mix",
        dim: "chunking",
        badge: "跨题混装",
        title: `第 ${awkwardMixedSteps[0].index + 1} 步混装了 ${awkwardMixedSteps[0].domains.length} 组不同主题`,
        body: "每一步最好对应一件明确的小事。把毫无关联的阶段拼在同一屏，标题就写不清这一步到底要干嘛。",
        fixHint: "在两种色块的交界点增加一道切分闸门，让每步专注一个主题。",
      });
    }
    if (minFields === 1 && maxFields >= 3 * minFields && stepCount >= 3) {
      issues.push({
        code: "skewed_rhythm",
        dim: "chunking",
        badge: "轻重悬殊",
        title: `步骤节奏失衡（${splitLabel}），前轻后重像过山车`,
        body: `有的步骤只有 1 项，另一步却塞了 ${maxFields} 项。节奏忽轻忽重会让用户误判剩余工作量，以为快结束了却突然撞上一大页。`,
        fixHint: "横向调整切分闸门，让各步体量更均衡（例如 3 / 5 / 2 / 2 或 3 / 5 / 4）。",
      });
    }
  }

  // 2. 进度可见性
  if (state.progressMode === "hidden") {
    issues.push({
      code: "hidden_progress",
      dim: "progress",
      badge: "隐身盲走",
      title: "顶部藏起了总步数与后续步骤，用户像在钻黑隧道",
      body: "只给一个「下一步」却不说一共几步、后面还要交什么材料（比如证件号或短信验证码），用户不知道尽头在哪，随时可能半路放弃。",
      fixHint: "在下方控槽「② 进度展现」切成「编号步骤轨」或「紧凑步数标」，亮明当前位置与终点。",
    });
  } else if (state.progressMode === "percent") {
    issues.push({
      code: "fake_percent",
      dim: "progress",
      badge: "虚标进度",
      title: "只给跳变百分比，却不写每步名称与总步数",
      body: "写着「已完成 65%」却不交代后面还有「身份验证」，进度条既不均匀又藏信息，用户到了验证页突然被要求掏证件，信任感立刻掉底。",
      fixHint: "把「② 进度展现」换成能一一对应真实步骤的「编号步骤轨」或「紧凑步数标」。",
    });
  }

  // 3. 校验与指引
  if (state.guidanceMode === "late-dump") {
    issues.push({
      code: "late_validation",
      dim: "guidance",
      badge: "末尾总算账",
      title: "前步放行无提示，留到最后一步才统一报前面出错",
      body: "手机号填少了几位却一路绿灯放行，等用户辛辛苦苦填完提交，才冷冰冰甩出一句「前面步骤有错，请自行返回检查」，是最容易引发怒退的设计事故。",
      fixHint: "把「③ 校验指引」切到「单步校验+指引」或「就地提示+校验」，当步问题当步拦住。",
    });
  } else if (state.guidanceMode === "over-nag") {
    issues.push({
      code: "over_nagging",
      dim: "guidance",
      badge: "未输先报红",
      title: "还没动手输入就满屏标红，还把选填项硬锁成必填",
      body: "刚翻到新一步，所有空框立刻冒红错，连原海报标明「（可选）」的简介都被拦住不让过。把辅助指引做成了审讯感。",
      fixHint: "在「③ 校验指引」切到「单步校验+指引」或「就地提示+校验」，离焦或点下一步再温柔校验，并放行选填项。",
    });
  }

  // 4. 退路与草稿保全
  if (state.controlMode === "no-back-wipe") {
    issues.push({
      code: "no_escape_wipe",
      dim: "control",
      badge: "无退路丢稿",
      title: "既不给「上一步」退路，切步还会清空已填内容",
      body: "用户填到第 2 步想回头核对邮箱，发现没有返回按钮、顶部步骤也点不动；一旦强制重来，辛苦输入的内容全被抹光。原海报底栏专门提醒：每步自动保存、随时可返回。",
      fixHint: "把「④ 返回与草稿」切到「自存+随时回退」或「保稿+末步复核」，给用户安心的退路。",
    });
  } else if (state.controlMode === "linear-locked") {
    issues.push({
      code: "locked_back",
      dim: "control",
      badge: "锁死前步",
      title: "走过的步骤被单向锁死，发现写错也改不了",
      body: "虽然保存了草稿，但不允许点顶轨或返回去改前一步的手机号或地址。Baymard 结账可用性研究反复指出，用户天然会点击已完成的步骤节点回去纠错。",
      fixHint: "把「④ 返回与草稿」切到「自存+随时回退」或「保稿+末步复核」，开放已完成步骤回跳。",
    });
  }

  const chunkOk = !issues.some((x) => x.dim === "chunking");
  const progressOk = !issues.some((x) => x.dim === "progress");
  const guidanceOk = !issues.some((x) => x.dim === "guidance");
  const controlOk = !issues.some((x) => x.dim === "control");
  const passedCount = [chunkOk, progressOk, guidanceOk, controlOk].filter(Boolean).length;

  // 综合认知负荷档位（示意）
  const maxStepLoad = Math.max(...steps.map((s) => s.loadScore));
  let loadLevel = "适中";
  let loadClass = "ok";
  if (stepCount === 1 || maxFields >= 6 || maxStepLoad >= 7.2) {
    loadLevel = "超载";
    loadClass = "bad";
  } else if (stepCount >= 7 || tornDomains.length > 0 || awkwardMixedSteps.length > 0 || maxStepLoad >= 5.6) {
    loadLevel = "偏重";
    loadClass = "warn";
  } else if (maxFields <= 3 && chunkOk) {
    loadLevel = "轻盈";
    loadClass = "ok";
  }

  // 完单阻力（示意）
  const frictionLevel = passedCount === 4 ? "低" : passedCount >= 2 ? "中" : "高";

  // 判断通过方案名
  let solutionName = "自定义稳妥解";
  if (passedCount === 4) {
    if (cuts.join(",") === scenario.idealCuts.join(",")) solutionName = "原海报 4 步经典解";
    else if (stepCount === 3) solutionName = "3 步精简合并解";
    else if (stepCount === 5) solutionName = "5 步轻量拆分解";
  }

  const primary = issues[0] || {
    code: "all_ok",
    dim: "ok",
    badge: `4/4 · ${solutionName}`,
    title: `${stepCount} 步节奏清晰（${splitLabel}），进度、校验与退路全就位`,
    body: `12 个字段按自然语义分成 ${stepCount} 步，最重一步仅 ${maxFields} 项、跨主题断层 0 处；顶部步骤轨清楚告知剩余路程，当步问题当步拦截，且草稿自动留存、随时可回跳修改。试着在活体表单里真填一遍走到最后一步。`,
    fixHint: "还可以试试切到「3 步精简解」「跨境电商结账」或故意点「试错：12 步碎片」体会边界。",
  };

  // 左侧原海报「为什么分步？」三块实况
  const whyPills = {
    cognitive: chunkOk
      ? { ok: true, text: `每步 ≤${maxFields} 项 · ${loadLevel}` }
      : { ok: false, text: issues.find((x) => x.dim === "chunking")?.badge || "拆步失衡" },
    progress: progressOk
      ? { ok: true, text: state.progressMode === "steps-numbered" ? `${stepCount} 步全览` : `紧凑 ${stepCount} 步` }
      : { ok: false, text: state.progressMode === "hidden" ? "终点未知" : "虚标跳变" },
    completion: guidanceOk && controlOk
      ? { ok: true, text: "当步校验 · 自存可退" }
      : { ok: false, text: !controlOk ? "缺退路易弃" : "校验失时" },
  };

  return {
    scenario,
    cuts,
    steps,
    stepCount,
    splitLabel,
    maxFields,
    minFields,
    tornCount: tornDomains.length,
    tornDomains,
    awkwardMixedCount: awkwardMixedSteps.length,
    issues,
    primary,
    passedCount,
    checks: {
      chunking: { ok: chunkOk, badge: chunkOk ? `${stepCount} 步均衡` : (issues.find((x) => x.dim === "chunking")?.badge || "待调") },
      progress: { ok: progressOk, badge: progressOk ? (state.progressMode === "steps-numbered" ? "步轨透明" : "紧凑标明") : (state.progressMode === "hidden" ? "隐身盲走" : "虚标跳变") },
      guidance: { ok: guidanceOk, badge: guidanceOk ? "单步指引" : (state.guidanceMode === "late-dump" ? "末尾算账" : "未输报红") },
      control: { ok: controlOk, badge: controlOk ? (state.controlMode === "review-before-submit" ? "保稿+复核" : "自存可退") : (state.controlMode === "no-back-wipe" ? "禁退丢稿" : "单向锁步") },
    },
    metrics: {
      stepCount,
      splitLabel,
      maxFields,
      tornCount: tornDomains.length,
      loadLevel,
      loadClass,
      frictionLevel,
    },
    whyPills,
  };
}

// 校验指定步骤的字段
export function validateStepFields(fields, values, guidanceMode) {
  const errors = {};
  for (const f of fields) {
    const val = values[f.id];
    if (guidanceMode === "over-nag" && !f.required) {
      // 故意展示「选填被锁成必填」错态
      if (typeof val === "string" && !val.trim()) {
        errors[f.id] = `错态：选填项「${f.label}」被误标成必填，不填不让走`;
        continue;
      }
    }
    if (!f.required && (val === "" || val === undefined || val === null)) continue;
    const msg = f.check(val);
    if (msg) errors[f.id] = msg;
  }
  return errors;
}

// ---------- Section 03：条件分支与跳步模型 ----------
export function evaluateBranching({ entity, needInvoice, verified }) {
  const nodes = [
    { id: "identity", num: "01", title: "选择身份", fields: 2, active: true, reason: "入口分流题（1 个决定）" },
    { id: "company", num: "02", title: "企业资质", fields: 4, active: entity === "company", reason: entity === "company" ? "企业主体需营业执照与信用代码" : "个人用户自动跳过" },
    { id: "profile", num: "03", title: "基础资料", fields: 3, active: true, reason: "所有用户均需联系与称呼信息" },
    { id: "kyc", num: "04", title: "实名核验", fields: 3, active: !verified, reason: !verified ? "未完成实名，需补充证件核验" : "已实名认证，自动免填" },
    { id: "invoice", num: "05", title: "发票寄送", fields: 3, active: needInvoice, reason: needInvoice ? "勾选纸质票，展开抬头与寄送地址" : "无需纸质票，整步隐藏" },
    { id: "submit", num: "06", title: "核对提交", fields: 1, active: true, reason: "仅汇总实际走过的步骤" },
  ];
  const activeNodes = nodes.filter((n) => n.active);
  const skippedNodes = nodes.filter((n) => !n.active);
  const totalFields = nodes.reduce((s, n) => s + n.fields, 0);
  const activeFields = activeNodes.reduce((s, n) => s + n.fields, 0);
  const savedFields = totalFields - activeFields;
  return { nodes, activeNodes, skippedNodes, totalFields, activeFields, savedFields };
}

// ---------- Section 06：该不该分步？决策速诊模型 ----------
export function evaluateDecision({ fieldBand, hasBranch, freq, hasAsync }) {
  // fieldBand: "short" (<=6) | "mid" (7-14) | "long" (15+)
  // hasBranch: "no" | "yes"
  // freq: "novice" (低频新手) | "expert" (高频熟手)
  // hasAsync: "no" | "yes"
  if (fieldBand === "short" && hasBranch === "no" && hasAsync === "no") {
    return {
      verdict: "直接用单页表单（别硬拆步）",
      badge: "推荐 284 单页表单",
      tone: "avoid",
      why: "总共只有 3–6 个字段、没有条件跳步也没有外部验证码/支付中断。强行拆成 3 步只会徒增翻页与加载成本，用单页表单布局（284）一屏扫完反而最快。",
      linkId: "284",
      linkText: "去 284 表单布局看单页排布",
    };
  }
  if (freq === "expert" && hasAsync === "no" && fieldBand !== "long") {
    return {
      verdict: "改用分区单页或设置页，不要强制线性向导",
      badge: "专家免向导",
      tone: "caution",
      why: "熟手每天重复录入几十次，清楚每一项在哪；线性「上一步/下一步」会锁死他们的自由跳转。更适合带侧边锚点的设置页面（287）或可折叠单页分组，必要时再给新手留一条向导入口。",
      linkId: "287",
      linkText: "去 287 设置页面布局看分组直达",
    };
  }
  if (fieldBand === "mid" && hasBranch === "no" && hasAsync === "no" && freq === "novice") {
    return {
      verdict: "3–4 步分步表单 或 带摘要的手风琴单页",
      badge: "推荐 285 分步 / 手风琴",
      tone: "good",
      why: "7–14 个字段对低频用户已有明显压迫感。拆成 3–4 步并配齐清晰进度条与自动保存，可显著降低首屏恐惧；若业务追求单页不跳路由，也可做成手风琴展开，但已完成块必须保留可读摘要。",
      linkId: "285",
      linkText: "本页标准 3–4 步模式",
    };
  }
  if (freq === "expert" && (fieldBand === "long" || hasBranch === "yes")) {
    return {
      verdict: "双轨方案：默认新手向导 + 熟手直达总表",
      badge: "双轨共存",
      tone: "good",
      why: "任务确实庞大且含分支，但团队里又有高频老手。遵循 Nielsen Norman Group 的建议：给首次配置者走 4–5 步向导，同时为熟手提供「切换完整配置页 / 模板导入」逃生口。",
      linkId: "290",
      linkText: "结合 290 分层导航布局给专家开快通道",
    };
  }
  return {
    verdict: "标准 3–5 步分步表单（本页最佳主场）",
    badge: "强烈推荐 285 分步表单",
    tone: "best",
    why: `具备${fieldBand === "long" ? "高字段量" : "复合信息块"}${hasBranch === "yes" ? "、条件分支" : ""}${hasAsync === "yes" ? "、异步核验或支付环节" : ""}，最适合用分步表单按语义切分：入口先把无关分支滤掉，把高摩擦校验隔离在独立步骤，并在末步提供完整复核。`,
    linkId: "285",
    linkText: "按本页四项底线落地",
  };
}

// ---------- Section 07：练一练（单一变量：10 字段步骤切分边界） ----------
// 10 个固定医疗挂号字段：
// 0-2 挂号排班（科室、日期、时段）
// 3-6 就诊人资料（姓名、身份证、手机号、医保卡）
// 7-9 确认结算（症状简述、费用明细、确认支付）
export const PRACTICE_FIELDS = [
  { label: "科室", d: 0 }, { label: "日期", d: 0 }, { label: "时段", d: 0 },
  { label: "姓名", d: 1 }, { label: "证件", d: 1 }, { label: "手机", d: 1 }, { label: "医保", d: 1 },
  { label: "症状", d: 2 }, { label: "费用", d: 2 }, { label: "支付", d: 2 },
];

export const PRACTICE_OPTIONS = [
  {
    id: "A",
    cuts: [3, 7],
    label: "方案 A",
    neutralDesc: "3 步 · 3 / 4 / 3",
    stepNames: ["第1步：科室·日期·时段", "第2步：姓名·证件·手机·医保", "第3步：症状·费用·支付"],
    correct: true,
    verdictTitle: "选对了！方案 A 按自然语义边界切分，零断层且每步均衡。",
    verdictBody: "10 个字段正好对应「选号源（3）→ 填就诊人（4）→ 核对付款（3）」三件独立的事。每步负荷落在 3–4 项舒适区，所有同类信息都待在同一屏，费用与确认集中在最后一步一次核清。",
  },
  {
    id: "B",
    cuts: [5, 8],
    label: "方案 B",
    neutralDesc: "3 步 · 5 / 3 / 2",
    stepNames: ["第1步：科室·日期·时段·姓名·证件", "第2步：手机·医保·症状", "第3步：费用·支付"],
    correct: false,
    verdictTitle: "还差一点：方案 B 步数虽然是 3 步，但切点把「就诊人资料」劈成了两半。",
    verdictBody: "姓名和身份证被硬塞进第 1 步和排班混装，手机号和医保卡却留在第 2 步和症状混在一起。用户填一半个人资料就要翻页，还把无关的两组问题绑在了一起。再看方案 A 的三段色带，边界完全对齐主题。",
  },
  {
    id: "C",
    cuts: [1, 8],
    label: "方案 C",
    neutralDesc: "3 步 · 1 / 7 / 2",
    stepNames: ["第1步：科室", "第2步：日期·时段·姓名·证件·手机·医保·症状", "第3步：费用·支付"],
    correct: false,
    verdictTitle: "节奏失衡：方案 C 第 1 步过轻、第 2 步塞满 7 项变成小长表。",
    verdictBody: "单选一个科室就独占整步，紧接着第 2 步突然压下日期、时段、全部身份信息与症状 7 项，跨了三个语义组，单屏认知负荷瞬间飙升。对比方案 A 的 3 / 4 / 3，就能看出均衡拆步的差别。",
  },
  {
    id: "D",
    cuts: [2, 4, 6, 8],
    label: "方案 D",
    neutralDesc: "5 步 · 2 / 2 / 2 / 2 / 2",
    stepNames: ["第1步：科室·日期", "第2步：时段·姓名", "第3步：证件·手机", "第4步：医保·症状", "第5步：费用·支付"],
    correct: false,
    verdictTitle: "机械均分反伤体验：方案 D 为了每步都是 2 项，把每一组关联项都拆散了。",
    verdictBody: "选完「日期」不能当场选「时段」，翻页后「时段」又和「姓名」硬凑一屏，连「医保卡」和「症状」都被捆在一起。分步不是按人头均分，而是按语义成块——方案 A 的 3 / 4 / 3 少翻 2 次页、逻辑更顺。",
  },
];

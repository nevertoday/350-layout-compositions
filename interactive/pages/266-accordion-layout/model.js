// 266 手风琴布局 · 单真源状态与诊断模型
// 开场风箱画布、活体 HTML 手风琴、四栏要点探针、白话诊单全部从此模块读取同一组数据与判定。

export const CONTEXTS = {
  faq: {
    id: "faq",
    label: "售后 FAQ",
    desc: "典型高选择性查询场景：用户通常只找 6 项里的 1 条答案。",
    panels: [
      {
        id: "p1",
        code: "01",
        goodTitle: "七天无理由退货，往返运费由谁承担？",
        vagueTitle: "模块一 · 详情",
        meta: "退换规则",
        lines: 4,
        summary: "签收 7 日内保持完好可申请退货；非质量问题退回运费由买家承担，已赠运费险的订单按保额自动赔付。",
        subItem: {
          title: "运费险理赔与偏远地区补充说明（二级折叠）",
          body: "新疆、西藏与港澳台地区首重超出保额部分需按快递实付差额补齐，退货单号回填后 72 小时内到账。",
          lines: 3,
        },
      },
      {
        id: "p2",
        code: "02",
        goodTitle: "订单发货后如何修改收货地址或拦截包裹？",
        vagueTitle: "更多说明",
        meta: "物流变更",
        lines: 4,
        summary: "已出库未派送的包裹可在订单页提交「转寄申请」，快递网点确认改址后约增加 1 个工作日时效。",
        subItem: {
          title: "生鲜与定制商品拦截例外条款（二级折叠）",
          body: "冷链发出后不支持跨省转寄，定制刻字件进入生产工序即锁定收件信息。",
          lines: 3,
        },
      },
      {
        id: "p3",
        code: "03",
        goodTitle: "电子普通发票与增值税专用发票多久开具？",
        vagueTitle: "信息三 · 条款",
        meta: "财务票据",
        lines: 4,
        summary: "确认收货后系统自动推送数电普票至预留邮箱；企业专票需补全税号与开户行，3 个工作日内开出。",
        subItem: {
          title: "跨月换票与抬头修正流程（二级折叠）",
          body: "当月开票错误可直接红冲重开；跨自然月需在售后单附原票 PDF 复核。",
          lines: 3,
        },
      },
      {
        id: "p4",
        code: "04",
        goodTitle: "一年质保期内主机故障，寄修还是上门换新？",
        vagueTitle: "其他细节",
        meta: "硬件保修",
        lines: 4,
        summary: "主板、电源与屏幕非人为损坏 365 天免费换修；一线与新一线城市支持次日顺丰上门取件并提供备机。",
        subItem: {
          title: "易损配件保修周期清单（二级折叠）",
          body: "硅胶密封圈、编织线缆与外置电池享 180 天质保，外壳正常磨损不在免费更换范围。",
          lines: 3,
        },
      },
      {
        id: "p5",
        code: "05",
        goodTitle: "会员积分有效期与抵扣现金上限是多少？",
        vagueTitle: "相关内容",
        meta: "会员权益",
        lines: 4,
        summary: "每笔消费所得积分自次年起滚动有效 24 个月，单笔订单最高可用积分抵扣实付金额的 15%。",
        subItem: {
          title: "联名卡双倍积分规则（二级折叠）",
          body: "生日当月首单自动触发双倍积分，退款订单将同步扣回对应成长值。",
          lines: 3,
        },
      },
      {
        id: "p6",
        code: "06",
        goodTitle: "大宗企业采购如何申请阶梯报价与对公转账？",
        vagueTitle: "补充项目",
        meta: "政企通道",
        lines: 4,
        summary: "单次满 20 件自动解锁 92 折起阶梯报价，在线下载盖章报价单后支持 14 天账期或对公转账。",
        subItem: {
          title: "招投标资质文件自助下载（二级折叠）",
          body: "含 ISO9001 质量认证、3C 强制认证与法人授权书电子盖章版。",
          lines: 3,
        },
      },
    ],
  },
  docs: {
    id: "docs",
    label: "产品说明",
    desc: "模块化产品规格说明书：按章节浏览，无需一口气滑过整屏参数。",
    panels: [
      {
        id: "p1",
        code: "01",
        goodTitle: "光学镜组与传感器规格（全画幅 4500 万像素）",
        vagueTitle: "章节一",
        meta: "成像系统",
        lines: 4,
        summary: "背照式堆栈 CMOS 配合 14 档动态范围，双原生 ISO 100 / 800 可在弱光下保留暗部层次。",
        subItem: {
          title: "各感光度 RAW 宽容度实测附表（二级折叠）",
          body: "ISO 3200 以下彩色噪点极轻，建议夜景建筑优先启用 14-bit 无损压缩格式。",
          lines: 3,
        },
      },
      {
        id: "p2",
        code: "02",
        goodTitle: "五轴机身防抖与手持慢门补偿能力",
        vagueTitle: "技术二",
        meta: "稳定结构",
        lines: 4,
        summary: "机身协同光学防抖最高实现 7.5 档快门补偿，广角端手持 1 秒曝光依然清晰锐利。",
        subItem: {
          title: "三脚架自动识别关闭策略（二级折叠）",
          body: "检测到零微震超过 1.5 秒后自动锁定传感器位移机构，防止长曝光反漂移。",
          lines: 3,
        },
      },
      {
        id: "p3",
        code: "03",
        goodTitle: "双卡槽读写规格与 4K 60p 连续录制时长",
        vagueTitle: "参数三",
        meta: "存储散热",
        lines: 4,
        summary: "CFexpress Type B + SD UHS-II 双槽支持同步备份；石墨烯导热框架支持室温下 90 分钟持续录影。",
        subItem: {
          title: "推荐存储卡最低持续写入速度（二级折叠）",
          body: "10-bit 4:2:2 帧内编码需 V90 或 CFexpress 400MB/s 以上持续写入卡。",
          lines: 3,
        },
      },
      {
        id: "p4",
        code: "04",
        goodTitle: "全天候防尘防滴密封与工作温度范围",
        vagueTitle: "说明四",
        meta: "机身防护",
        lines: 4,
        summary: "镁合金骨架在 68 处按键与卡口缝隙内置硅胶密封圈，零下 10℃ 至 40℃ 稳定工作。",
        subItem: {
          title: "低温电池保暖使用建议（二级折叠）",
          body: "极寒环境建议将备用电池贴身存放，单块电池可维持约 320 张实拍。",
          lines: 3,
        },
      },
      {
        id: "p5",
        code: "05",
        goodTitle: "USB-C 供电接口与无线图传协议",
        vagueTitle: "扩展五",
        meta: "连接生态",
        lines: 4,
        summary: "支持 USB-PD 边充边拍与 UVC 免驱推流，双频 Wi-Fi 6 可在 2 秒内将原图直传平板。",
        subItem: {
          title: "FTP 自动回传服务器配置步骤（二级折叠）",
          body: "支持预设 5 组报社或影棚 FTP 节点，按星标筛选自动后台推送。",
          lines: 3,
        },
      },
      {
        id: "p6",
        code: "06",
        goodTitle: "包装清单与官方可选拓展配件",
        vagueTitle: "附加六",
        meta: "随盒附件",
        lines: 4,
        summary: "机身、原装电池、双槽座充、编织肩带与机身盖；竖拍电池手柄与冷靴麦克风需另购。",
        subItem: {
          title: "老款电池向下兼容清单（二级折叠）",
          body: "兼容上一代同型号电池用于静态拍摄，但高速连拍模式需使用新款高倍率电芯。",
          lines: 3,
        },
      },
    ],
  },
  settings: {
    id: "settings",
    label: "偏好设置",
    desc: "分组配置工作台：平时收起低频选项，需要调整时展开对应分类。",
    panels: [
      {
        id: "p1",
        code: "01",
        goodTitle: "账号安全与两步验证密钥",
        vagueTitle: "常规一",
        meta: "安全防护",
        lines: 4,
        summary: "已开启 Passkey 与验证器应用双重保护，新设备登录将触发邮件确认并记录 IP 地理位置。",
        subItem: {
          title: "10 组一次性恢复码管理（二级折叠）",
          body: "丢失手机时可用于紧急解锁账号，使用后请及时重新生成新批次恢复码。",
          lines: 3,
        },
      },
      {
        id: "p2",
        code: "02",
        goodTitle: "通知频率与勿扰时段（22:00 – 08:00）",
        vagueTitle: "常规二",
        meta: "消息提醒",
        lines: 4,
        summary: "仅即时推送被 @ 提及与安全告警；日报与周报汇总在每日上午 09:00 一次性发送。",
        subItem: {
          title: "按项目频道独立静音规则（二级折叠）",
          body: "可为归档项目单独关闭桌面横幅，仅在侧栏保留未读圆点提示。",
          lines: 3,
        },
      },
      {
        id: "p3",
        code: "03",
        goodTitle: "界面外观、字号缩放与减少动态效果",
        vagueTitle: "常规三",
        meta: "视觉无障碍",
        lines: 4,
        summary: "默认跟随系统浅色/深色切换，开启高对比度边线后焦点轮廓将同步加粗至 2px。",
        subItem: {
          title: "等宽代码区字号与连字开关（二级折叠）",
          body: "独立调整代码块字号（12px–18px），避免影响正文中文行宽节奏。",
          lines: 3,
        },
      },
      {
        id: "p4",
        code: "04",
        goodTitle: "快捷键映射与 WAI-ARIA 键盘导航",
        vagueTitle: "常规四",
        meta: "键盘效率",
        lines: 4,
        summary: "在折叠标题间支持 ↑/↓、Home/End 快速移动焦点，Enter 或 Space 原地展开收合当前区段。",
        subItem: {
          title: "与浏览器默认快捷键冲突避让（二级折叠）",
          body: "单键快捷操作在输入框聚焦时自动挂起，防止误触折叠当前编辑表单。",
          lines: 3,
        },
      },
      {
        id: "p5",
        code: "05",
        goodTitle: "云端自动备份与本地离线缓存上限",
        vagueTitle: "常规五",
        meta: "数据同步",
        lines: 4,
        summary: "文档每隔 30 秒静默增量同步，本地保留最近 30 天历史版本以供断网回溯。",
        subItem: {
          title: "手动导出全量 JSON 与 Markdown 归档（二级折叠）",
          body: "导出包包含全部正文与元数据，每 24 小时可触发一次完整快照下载。",
          lines: 3,
        },
      },
      {
        id: "p6",
        code: "06",
        goodTitle: "API 令牌与第三方 Webhook 集成",
        vagueTitle: "常规六",
        meta: "开发接口",
        lines: 4,
        summary: "当前存在 2 枚活跃只读令牌；建议每 90 天轮换密钥并为每个 Webhook 绑定独立签名。",
        subItem: {
          title: "最近 7 日推送失败重试日志（二级折叠）",
          body: "远端超时自动按指数退避重试 3 次，连续失败 20 次将暂停该端点。",
          lines: 3,
        },
      },
    ],
  },
};

// 开场刻意停在 0/4 四重翻车态：3 项同开 + 模糊标题 + 无折标 + 双层套娃 + 拉平过宽
export function createInitialState() {
  return {
    context: "faq",
    mode: "multi", // "exclusive" | "multi" | "all-open"
    openIds: ["p1", "p2", "p3"],
    nestedOpenIds: ["p1"],
    labelStyle: "vague", // "vague" | "concrete"
    signifier: "none", // "none" | "arrow" | "plus" | "caret"
    nested: true,
    bellowsSpan: 0.92, // 0.16 .. 1.00（风箱张开比例，直接由画布横拖控制）
    focusedIndex: 0,
    clicks: 0,
  };
}

// 多组合法解与双向试错预设
export const PRESETS = {
  exclusive: {
    label: "互斥单开解",
    kind: "good",
    apply: (s) => ({
      ...s,
      mode: "exclusive",
      openIds: ["p1"],
      nestedOpenIds: [],
      labelStyle: "concrete",
      signifier: "caret",
      nested: false,
      bellowsSpan: 0.62,
      focusedIndex: 0,
    }),
  },
  compare: {
    label: "双项对照解",
    kind: "good",
    apply: (s) => ({
      ...s,
      mode: "multi",
      openIds: ["p1", "p3"],
      nestedOpenIds: [],
      labelStyle: "concrete",
      signifier: "plus",
      nested: false,
      bellowsSpan: 0.72,
      focusedIndex: 0,
    }),
  },
  compact: {
    label: "全闭索引解",
    kind: "good",
    apply: (s) => ({
      ...s,
      mode: "exclusive",
      openIds: [],
      nestedOpenIds: [],
      labelStyle: "concrete",
      signifier: "caret",
      nested: false,
      bellowsSpan: 0.50,
      focusedIndex: 0,
    }),
  },
  "trap-reset": {
    label: "复原开场错态",
    kind: "bad",
    apply: (s) => ({
      ...createInitialState(),
      context: s.context,
    }),
  },
  "trap-all-open": {
    label: "全摊退化",
    kind: "bad",
    apply: (s) => ({
      ...s,
      mode: "all-open",
      openIds: ["p1", "p2", "p3", "p4", "p5", "p6"],
      nestedOpenIds: [],
      labelStyle: "concrete",
      signifier: "caret",
      nested: false,
      bellowsSpan: 0.94,
    }),
  },
  "trap-blind": {
    label: "全闭盲盒",
    kind: "bad",
    apply: (s) => ({
      ...s,
      mode: "exclusive",
      openIds: [],
      nestedOpenIds: [],
      labelStyle: "vague",
      signifier: "none",
      nested: false,
      bellowsSpan: 0.44,
    }),
  },
  "trap-arrow": {
    label: "右箭歧义",
    kind: "bad",
    apply: (s) => ({
      ...s,
      mode: "exclusive",
      openIds: ["p1"],
      nestedOpenIds: [],
      labelStyle: "concrete",
      signifier: "arrow",
      nested: false,
      bellowsSpan: 0.62,
    }),
  },
  "trap-nested": {
    label: "双层套娃",
    kind: "bad",
    apply: (s) => ({
      ...s,
      mode: "exclusive",
      openIds: ["p1"],
      nestedOpenIds: ["p1"],
      labelStyle: "concrete",
      signifier: "caret",
      nested: true,
      bellowsSpan: 0.62,
    }),
  },
  "trap-squeeze": {
    label: "风箱过挤",
    kind: "bad",
    apply: (s) => ({
      ...s,
      mode: "exclusive",
      openIds: ["p1"],
      nestedOpenIds: [],
      labelStyle: "concrete",
      signifier: "caret",
      nested: false,
      bellowsSpan: 0.20,
    }),
  },
};

export const SIGNIFIER_META = {
  none: { label: "无折标", closed: "", open: "", hint: "用户误判为跳转新页" },
  arrow: { label: "右箭 →", closed: "→", open: "→", hint: "像站内跳转，原地展开有歧义" },
  plus: { label: "加减 +/−", closed: "+", open: "−", hint: "明确传达展开/收起" },
  caret: { label: "角标 ▾/▴", closed: "▾", open: "▴", hint: "NN/g 实测最清晰的原地展开信号" },
};

// 切换某一项展开/收合
export function togglePanel(state, id) {
  if (state.mode === "all-open") {
    return { ...state, clicks: state.clicks + 1 };
  }
  const has = state.openIds.includes(id);
  let nextOpen;
  if (state.mode === "exclusive") {
    nextOpen = has ? [] : [id];
  } else {
    nextOpen = has ? state.openIds.filter((x) => x !== id) : [...state.openIds, id];
  }
  const panels = CONTEXTS[state.context].panels;
  const idx = Math.max(0, panels.findIndex((p) => p.id === id));
  return {
    ...state,
    openIds: nextOpen,
    focusedIndex: idx,
    clicks: state.clicks + 1,
  };
}

export function toggleNestedPanel(state, id) {
  const has = state.nestedOpenIds.includes(id);
  const next = has ? state.nestedOpenIds.filter((x) => x !== id) : [...state.nestedOpenIds, id];
  return { ...state, nestedOpenIds: next, clicks: state.clicks + 1 };
}

// 核心单真源审计：完全由当前状态与实际可见行数推导，零写死常量
export function auditAccordion(state) {
  const ctx = CONTEXTS[state.context];
  const panels = ctx.panels;
  const effectiveOpen =
    state.mode === "all-open" ? panels.map((p) => p.id) : state.openIds;
  const openCount = effectiveOpen.length;

  // 基于真实面板行数计算压缩比
  const headerLines = 1.4;
  let totalLines = 0;
  let visibleLines = 0;
  for (const p of panels) {
    const subExtra = state.nested ? 1.2 + p.subItem.lines : 0;
    totalLines += headerLines + p.lines + subExtra;
    visibleLines += headerLines;
    if (effectiveOpen.includes(p.id)) {
      visibleLines += p.lines;
      if (state.nested) {
        visibleLines += 1.2 + (state.nestedOpenIds.includes(p.id) ? p.subItem.lines : 0);
      }
    }
  }
  const savedPct = Math.max(0, Math.round((1 - visibleLines / totalLines) * 100));
  const spanPct = Math.round(state.bellowsSpan * 100);

  const tooSqueezed = state.bellowsSpan < 0.30;
  const tooFlat = state.bellowsSpan > 0.86;
  const spanOk = !tooSqueezed && !tooFlat;

  const signifierGood = state.signifier === "caret" || state.signifier === "plus";
  const scentGood = state.labelStyle === "concrete";
  const allOpenOverload = state.mode === "all-open" || openCount >= 3;
  const blindClosed = openCount === 0 && (!scentGood || !signifierGood);

  // 四大原海报原则各自独立判定
  const foldOk =
    !allOpenOverload &&
    !blindClosed &&
    spanOk;

  const rhythmOk =
    signifierGood &&
    !state.nested &&
    state.mode !== "all-open" &&
    spanOk;

  const hierarchyOk =
    !state.nested &&
    !allOpenOverload;

  const expandOk =
    scentGood &&
    signifierGood &&
    !tooSqueezed;

  const passCount = [foldOk, rhythmOk, hierarchyOk, expandOk].filter(Boolean).length;

  // 逐项四栏原海报短读数
  const foldNote = allOpenOverload
    ? `展开 ${openCount}/6 项 · 仅省 ${savedPct}%`
    : blindClosed
    ? "0 项展开 · 盲盒无入口"
    : tooSqueezed
    ? `风箱过挤 ${spanPct}%`
    : tooFlat
    ? `拉平失褶 ${spanPct}%`
    : openCount === 0
    ? `全闭索引 · 省高 ${savedPct}%`
    : `展开 ${openCount}/6 · 省高 ${savedPct}%`;

  const rhythmNote =
    state.signifier === "none"
      ? "无折标 · 像跳转链接"
      : state.signifier === "arrow"
      ? "右箭头 → 有跳转歧义"
      : state.nested
      ? "套娃打断收放节奏"
      : state.mode === "all-open"
      ? "全摊锁死无韵律"
      : tooSqueezed
      ? "折幅过窄节拍拥挤"
      : tooFlat
      ? "张力拉平缺折感"
      : state.mode === "exclusive"
      ? "互斥折返 · 节拍清晰"
      : "并行收放 · 节奏平稳";

  const hierarchyNote = state.nested
    ? "2 级套娃 · 点击翻倍"
    : allOpenOverload
    ? `${openCount} 项同抢焦点`
    : "单层 1 级 · 主次分明";

  const expandNote = !scentGood
    ? "盲盒标题 · 缺信息气味"
    : !signifierGood
    ? state.signifier === "none"
      ? "无展开提示 · 易漏点"
      : "右箭歧义 · 犹疑点击"
    : tooSqueezed
    ? "折宽截断标题字"
    : "标题具体 · 一眼知内容";

  // 收集当前全部缺陷（按教学严重度排序）
  const faults = [];
  if (!scentGood) {
    faults.push({
      key: "vague",
      short: "标题失明",
      headline: "标题写成了「模块一 / 更多说明」，读者只能逐条盲猜点开",
      why: "折叠一旦把正文藏起来，标题就是唯一的「信息气味」。笼统标签逼用户反复点击试错，把原本省空间的折叠变成额外的交互税。",
      next: "把「标题气味」切到「具体自解释标题」，让读者未点击就知道里面装着什么。",
    });
  }
  if (state.nested) {
    faults.push({
      key: "nested",
      short: "双层套娃",
      headline: "手风琴里再塞一层手风琴，位置记忆与点击效率当场翻倍损耗",
      why: "展开一层后还得再找下一层折叠项，用户很容易忘记自己身处哪一级目录；上层收合时子面板状态也会失踪（NN/g 将多层嵌套列为手风琴首要禁区）。",
      next: "关闭「双层套娃」，把结构拉平为单层 1 级目录。",
    });
  }
  if (state.signifier === "none") {
    faults.push({
      key: "no-icon",
      short: "无折标",
      headline: "行尾没有任何折叠指示器，读者会以为点了会跳转到新页面",
      why: "NN/g 2020 年折标实证研究表明：标题右侧缺失图标时，多数用户预期点击将导航离开当前页，而不是原地展开内容。",
      next: "把「折标指示器」设为「角标 ▾/▴」或「加减 +/−」，明确原地展开预期。",
    });
  } else if (state.signifier === "arrow") {
    faults.push({
      key: "arrow",
      short: "右箭歧义",
      headline: "右箭头「→」同时被用作跳转链接符号，展开预期含糊",
      why: "向右箭头在移动端列表与卡片里常代表「进入详情页」（见 267 列表—详情），把它放在手风琴上会让用户犹豫点击后会不会跳走。",
      next: "把「折标指示器」换成向下/向上「角标 ▾/▴」或「加减 +/−」。",
    });
  }
  if (allOpenOverload) {
    faults.push({
      key: "overload",
      short: state.mode === "all-open" ? "全摊锁死" : `${openCount} 项同开`,
      headline:
        state.mode === "all-open"
          ? "6 项全摊且禁止收起，退化成超长平铺页（压缩 0%）"
          : `同时展开了 ${openCount}/6 项，高度仅省 ${savedPct}%，失去折叠秩序`,
      why: "手风琴的价值在于让读者一次聚焦 1–2 段、其余收合为目录；超过半数面板同时摊开时，页面反而比直接用单列排版多出一堆多余边框与按钮。",
      next:
        state.mode === "all-open"
          ? "把展开策略切回「单开互斥」或「多开并行」，只保留 1–2 项展开。"
          : "切到「单开互斥」，或手动点收多余面板，只保留 1–2 项展开。",
    });
  }
  if (tooSqueezed) {
    faults.push({
      key: "squeezed",
      short: "风箱过挤",
      headline: `折页张开幅被压到 ${spanPct}%，标题栏过窄导致扫视受阻`,
      why: "过度追求收紧会把横向或纵向呼吸感挤干，每条标题被迫频繁换行截断，扫读速度不升反降。",
      next: "向右横拖上方朱橙风箱，把张开幅拉回 35%–82% 的清晰折面区间。",
    });
  } else if (tooFlat) {
    faults.push({
      key: "flat",
      short: "拉平失褶",
      headline: `风箱拉到了 ${spanPct}% 近乎摊平，连续折面的收放节奏消失`,
      why: "手风琴靠的是「收紧与展开」的对比节拍；把折页无限拉宽摊平后，各区段之间缺乏折叠层次与视觉顿挫。",
      next: "向左横拖上方朱橙风箱，收回到 45%–80% 让折面明暗与节奏显形。",
    });
  }

  // 汇总顶部短徽标与档位（示意）
  let badgeShort = "";
  let grade = "";
  let headline = "";
  let why = "";
  let next = "";
  let solutionName = "";

  if (passCount === 4) {
    if (openCount === 0) {
      solutionName = "全闭索引解";
      badgeShort = "4/4 · 极简索引";
      grade = "收放得当（示意）";
      headline = `6 项全闭成高密度目录（省高 ${savedPct}%），靠具体标题与折标稳稳导流`;
      why = "在手机端或高频 FAQ 首屏，全闭态能一屏亮出全部问题清单；只要标题信息气味够强且角标明确，读者一眼即可命中目标条目。";
      next = "可以点任意折面或按 Space 发射视线流光，观察展开单条后的节奏变化；也可以点下方试错按钮故意弄坏一项看看会发生什么。";
    } else if (state.mode === "multi" && openCount === 2) {
      solutionName = "双开对照解";
      badgeShort = "4/4 · 双项对照";
      grade = "并行对照成立（示意）";
      headline = `多开模式保留 2 项展开（省高 ${savedPct}%），兼顾压缩与跨项对照`;
      why = "当用户需要把两条规则或两组参数放在一起看时，多开模式配合清晰的展开标与单层结构，避免互斥模式反复开合来回丢失上下文。";
      next = "试试再多点开 2 项看看何时退化成「全摊过载」，或按 Space 检验视线流向。";
    } else {
      solutionName = "互斥单开解";
      badgeShort = "4/4 · 收放有序";
      grade = "结构成立（示意）";
      headline = `单层聚焦 1 项、其余收合（省高 ${savedPct}%），视线顺着折页自然推进`;
      why = "具体自解释标题负责「先看懂再点」，清晰折标传达「原地展开不跳页」，互斥单开保住首屏稳定节奏——这正是手风琴布局的黄金平衡点。";
      next = "点其他风箱折面体验顺滑折返，按 Space 放飞视线验读，或切到「双项对照解」与双向试错继续拆解边界。";
    }
  } else {
    const primary = faults[0];
    badgeShort = `${passCount}/4 · ${primary.short}`;
    grade =
      passCount === 0
        ? "四重翻车（示意）"
        : passCount <= 2
        ? "局部失衡（示意）"
        : "还差一处（示意）";
    headline = primary.headline;
    why = primary.why;
    next = primary.next;
  }

  return {
    passCount,
    isPass: passCount === 4,
    badgeShort,
    grade,
    solutionName,
    headline,
    why,
    next,
    faults,
    openCount,
    effectiveOpen,
    savedPct,
    spanPct,
    totalLines,
    visibleLines,
    pillars: {
      fold: { ok: foldOk, note: foldNote },
      rhythm: { ok: rhythmOk, note: rhythmNote },
      hierarchy: { ok: hierarchyOk, note: hierarchyNote },
      expand: { ok: expandOk, note: expandNote },
    },
  };
}

// ---------- Section 01：三类翻找任务单真源模型 ----------
export const TASK_SCENARIOS = {
  lookup: {
    id: "lookup",
    tab: "A · 查 1 条售后运费",
    userGoal: "用户带着明确问题进页：只想找到「7 天退货谁付运费」，其余 7 条根本不看。",
    sections: 8,
    needed: 1,
    linesPerSection: 6,
    headerLines: 1.5,
    accordion: {
      clicks: 1,
      skippedBlocks: 7,
      ctrlF: "命中首段 / 折叠内需展开或 hidden=until-found",
      verdict: "手风琴胜出",
      good: true,
      explain: (savedPct) =>
        `8 段内容叠成紧凑标题栈，首屏高度压缩 ${savedPct}%；用户扫读 8 行标题直接命中第 1 项，只需 1 次点击即可读完，彻底跳过 7 段无关文本。`,
    },
    flat: {
      clicks: 0,
      skippedBlocks: 0,
      ctrlF: "原生全文直搜",
      verdict: "滚动偏长",
      good: false,
      explain: "全文平铺需要滚过大量无关条款，尤其在 390px 手机屏上要滑 4–5 屏才能确认后面还有没有更贴切的说明。",
    },
  },
  contract: {
    id: "contract",
    tab: "B · 通读整份租房协议",
    userGoal: "签约前必须从第 1 条读到第 8 条，且经常按 Ctrl+F 搜「押金」「违约金」。",
    sections: 8,
    needed: 8,
    linesPerSection: 6,
    headerLines: 1.5,
    accordion: {
      clicks: 8,
      skippedBlocks: 0,
      ctrlF: "未展开段落可能搜不到或漏读",
      verdict: "手风琴反成障碍",
      good: false,
      explain: "读者本来就要读完全部 8 节，强行折叠等于平白制造 8 次重复点击、7 次阅读中断，还增加遗漏关键违约条款的风险。",
    },
    flat: {
      clicks: 0,
      skippedBlocks: 0,
      ctrlF: "全文一次 Ctrl+F 即刻定位",
      verdict: "单列平铺胜出（见 255）",
      good: true,
      explain: "零点击顺畅连续阅读，滚动比反复瞄准点击省力得多；配合清晰小标题与目录锚点，远胜折叠抽屉。",
    },
  },
  compare: {
    id: "compare",
    tab: "C · 横向对比 4 套方案",
    userGoal: "采购需要把基础版、专业版、团队版、企业版的配额与价格并排比对。",
    sections: 4,
    needed: 4,
    linesPerSection: 7,
    headerLines: 1.5,
    accordion: {
      clicks: 6,
      skippedBlocks: 0,
      ctrlF: "互斥手风琴无法同屏对照",
      verdict: "互斥折叠严重挫败",
      good: false,
      explain: "一旦点开「专业版」，「基础版」自动关上——人脑被迫靠短期记忆记住上一项的数字来回切换，点击次数飙升且极易看串。",
    },
    flat: {
      clicks: 0,
      skippedBlocks: 0,
      ctrlF: "同屏并列一目了然",
      verdict: "对照表 / 分栏胜出（见 267）",
      good: true,
      explain: "需要同时交叉核对的数据必须并置可见；实在受限于手机窄屏，也只能改用允许「多开并行」的折叠或标签切换。",
    },
  },
};

export function computeTaskMetrics(taskId) {
  const t = TASK_SCENARIOS[taskId];
  const fullHeightUnits = t.sections * (t.headerLines + t.linesPerSection);
  const accInitialUnits = t.sections * t.headerLines + t.linesPerSection; // 1 项展开
  const accVisiblePct = Math.round((accInitialUnits / fullHeightUnits) * 100);
  const accSavedPct = 100 - accVisiblePct;
  const accExplain =
    typeof t.accordion.explain === "function"
      ? t.accordion.explain(accSavedPct)
      : t.accordion.explain;
  return {
    ...t,
    accordion: { ...t.accordion, explain: accExplain },
    fullHeightUnits,
    accInitialUnits,
    accVisiblePct,
    accSavedPct,
  };
}

// ---------- Section 04：五代折叠演化史 ----------
export const LINEAGE_ITEMS = [
  {
    id: "sutra",
    era: "晚唐 · 五代 · 宋",
    short: "经折装",
    title: "经折装（折本）：人类最早的连续折叠阅读界面",
    fact: "从长卷「卷轴装」舒卷不便演化而来：把整幅纸卷按固定幅宽一正一反连续折叠，首尾贴硬板护封。翻到哪一折即可原地展读，合上又缩成一掌厚度——敦煌遗书与宋代大藏经（如故宫博物院、国家图书馆所藏宋刻折本）留下了大量实物见证。",
    linkNote: "物理原型对应 266 原海报的 7 折连续折页母题。",
    diagram: "sutra",
  },
  {
    id: "leporello",
    era: "19 世纪 · 欧洲",
    short: "风箱与折页册",
    title: "手风琴风箱与 Leporello 折页画册",
    fact: "风琴（Accordion）靠连贯褶皱风箱在拉展与压缩之间吞吐气流；同期欧洲出版界把风琴式连续折叠画册称作 Leporello 或 Concertina Book。它既能单折细读，又能整幅拉开形成横贯视线的节奏长卷。",
    linkNote: "「Accordion」由此同时承载了伸缩结构与韵律节拍两层意象。",
    diagram: "bellows",
  },
  {
    id: "carroll",
    era: "1984 · IBM Watson",
    short: "渐进披露实证",
    title: "John M. Carroll & Caroline Carrithers《Training Wheels in a User Interface》",
    fact: "发表于《Communications of the ACM》（1984 年 8 月，Vol. 27, No. 8）。两位研究者在商用文字处理软件中暂时收起新手容易误触的高级功能，实验证明受控界面显著加快了上手速度、减少了陷入错误恢复的时间——为界面「渐进式披露」奠定了实证基石。",
    linkNote: "核实 DOI：10.1145/358198.358218。",
    diagram: "wheels",
  },
  {
    id: "nielsen",
    era: "2006 · NN/g",
    short: "渐进披露定型",
    title: "Jakob Nielsen 系统界定 Progressive Disclosure 与 Web 折叠组件普及",
    fact: "2006 年 Jakob Nielsen 撰文界定「渐进式披露」：把次要或低频内容延后到次级展开层，让初学者不被界面淹没、专家又随时能取用全部细节。同期桌面大纲树与早期 DHTML / jQuery UI Accordion 将垂直堆叠标题栈普及到网页 FAQ 与设置页。",
    linkNote: "此后 NN/g 在 2014、2020、2023 年陆续发表桌面手风琴与折标专项研究。",
    diagram: "disclosure",
  },
  {
    id: "modern",
    era: "2014–2024 · W3C & HTML",
    short: "ARIA 与原生 details",
    title: "WAI-ARIA APG 契约与原生 HTML <details name> 互斥手风琴",
    fact: "W3C WAI-ARIA Authoring Practices Guide 将手风琴明确为「带 aria-expanded 与 aria-controls 的标题按钮栈」，统一键盘交互标准；2024 年起主流浏览器全部原生支持为多个 <details> 添加相同 name 属性，无需一行 JavaScript 即可实现原生互斥折叠。",
    linkNote: "现代 CSS 的 ::details-content 与 interpolate-size 更进一步补齐了原生高度平滑展开。",
    diagram: "native",
  },
];

// ---------- Section 06：单变量控制诊断练习 ----------
export const QUIZ_ITEMS = [
  {
    id: "q1",
    badge: "题目 1 / 2 · 移动端售后帮助页",
    prompt: "手机端商品页底部有 6 条相互独立的售后问答（退货运费、开发票、保修期等），绝大多数用户只查其中 1 条。下面四个方案视觉工艺完全相同、每项仅差一个结构变量，哪一个最合理？",
    correct: "A",
    options: [
      {
        key: "A",
        label: "方案 A",
        meta: "单层 6 项 · 完整问句标题 · ▾/▴ 角标",
        variant: "good",
        why: "正解！完全匹配高选择性查询任务：单层扁平避免嵌套、完整问句自带信息气味、▾/▴ 角标在 NN/g 实测中最清晰地传达「原地展开不跳页」。",
      },
      {
        key: "B",
        label: "方案 B",
        meta: "单层 6 项 · 精简序号标题 · ▾/▴ 角标",
        variant: "vague",
        why: "仅改了「标题气味」一个变量：精简成「规则一 / 更多说明 / 相关事项」后用户无法判断运费在哪一条，只能逐个试错点击，抵消了手风琴省时优势。",
      },
      {
        key: "C",
        label: "方案 C",
        meta: "单层 6 项 · 完整问句标题 · → 箭头",
        variant: "arrow",
        why: "仅改了「折标符号」一个变量：右箭头 → 在移动端更像「跳转进入新页面」，用户会产生离开当前商品页的顾虑，不如 ▾/▴ 角标直觉。",
      },
      {
        key: "D",
        label: "方案 D",
        meta: "两级分组折叠 · 完整问句标题 · ▾/▴ 角标",
        variant: "nested",
        why: "仅改了「嵌套层级」一个变量：6 条本可直接扫完的独立问题再包一层母手风琴，不仅每次查看多点一下，还打碎了首屏目录的全局感。",
      },
    ],
  },
  {
    id: "q2",
    badge: "题目 2 / 2 · 短篇服务协议确认页",
    prompt: "一款产品的 5 节简洁用户协议（总计约 600 字）需要用户在勾选同意前完整通读，且常有人用 Ctrl+F 检索「隐私」「退款」。下面四个展示方案只改变折叠策略，该选哪一个？",
    correct: "A",
    options: [
      {
        key: "A",
        label: "方案 A",
        meta: "全文展开单列 · 顶部目录锚点",
        variant: "flat-open",
        why: "正解！这是手风琴最重要的边界判断——当内容本来就不长且用户需要通读与全文检索时，不该强行折叠，直接用单列分段（255）才是最低成本的阅读体验。",
      },
      {
        key: "B",
        label: "方案 B",
        meta: "单开互斥折叠 · 默认展开第 1 节",
        variant: "exclusive-contract",
        why: "虽然省了几百像素高度，却逼着必须通读全部 5 节的用户多点 4 次，还会让后 4 节在浏览器查找与打印时被隐藏。",
      },
      {
        key: "C",
        label: "方案 C",
        meta: "多开并行折叠 · 默认全部收起",
        variant: "all-closed-contract",
        why: "5 节 600 字全部藏起来需要连点 5 次才能读全，为了省半屏滚动增加了无意义的点击疲劳。",
      },
      {
        key: "D",
        label: "方案 D",
        meta: "两级分组折叠 · 按大类收起",
        variant: "nested-contract",
        why: "既违背「通读不折叠」原则，又叠加了多层嵌套迷失感，是短协议最容易引起用户反感的反模式。",
      },
    ],
  },
];

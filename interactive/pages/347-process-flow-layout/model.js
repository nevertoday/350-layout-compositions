// 347 流程页幻灯片版式 — 单真源数据、几何布局与拓扑诊断模型
// 画布绘制、顶栏五要素匣、底栏四要点探针、白话诊单与信号流演播全部读取同一份计算结果

export const PALETTE = {
  forestDeep: "#001A11",
  forest: "#002C1D",
  forestPanel: "#063927",
  forestCard: "#09422E",
  forestLine: "#1B6349",
  emerald: "#0E6042",
  emeraldMid: "#176A4B",
  mint: "#8ADDBA",
  mintBright: "#9FEACC",
  mintSoft: "#65C8A7",
  mintMuted: "#4D9C82",
  dashed: "#C7DDD0",
  ivory: "#F9F5E6",
  ivoryBright: "#FEF9EF",
  ivoryInk: "#001C0F",
  ivorySub: "#264234",
  coral: "#FF7B66",
  coralBg: "#4B1B17",
  coralInk: "#FFD2CA",
  amber: "#F5C451",
  amberBg: "#3F300F",
};

export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "原海报 · 四步闭环",
    short: "原海报",
    slideTitle: "从输入到结果的四阶段闭环流程",
    inputTitle: "输入",
    inputItems: ["数据", "需求", "问题", "资源"],
    outputTitle: "结果",
    outputItems: ["价值", "方案", "成果", "影响"],
    loopLabel: "迭代优化",
    coreSteps: [
      {
        id: "discover",
        order: 1,
        title: "发现",
        en: "DISCOVER",
        icon: "search",
        bullets: ["识别问题与机会", "收集背景信息", "明确目标范围"],
        denseBullets: [
          "通过多轮跨部门访谈、客服工单抽样与历史埋点核查，系统梳理当前业务瓶颈与尚未覆盖的用户机会点",
          "汇总近三个季度竞品动态与背景资料，整理成可追溯的现状基线档案并同步相关方确认范围边界",
        ],
        sparseBullets: ["发现"],
      },
      {
        id: "analyze",
        order: 2,
        title: "分析",
        en: "ANALYZE",
        icon: "pie",
        bullets: ["拆解关键因素", "评估可行方案", "确定优先级"],
        denseBullets: [
          "将复杂现象按根因树拆分为技术、流程与成本三类因子，逐项测算投入产出比与潜在延期风险",
          "组织方案评审比对三套备选路径的可行性与约束条件，形成排期顺序与阶段验收标准",
        ],
        sparseBullets: ["分析"],
      },
      {
        id: "execute",
        order: 3,
        title: "执行",
        en: "EXECUTE",
        icon: "gear",
        bullets: ["制定行动计划", "分配资源与任务", "推进实施落地"],
        denseBullets: [
          "根据既定优先级拆解周级里程碑、责任人名单与协作接口，提前锁定研发、设计及运营人力配额",
          "按双周节拍跟踪任务推进进度与阻塞事项，及时调配资源确保核心节点按期稳定落地",
        ],
        sparseBullets: ["执行"],
      },
      {
        id: "output",
        order: 4,
        title: "输出",
        en: "OUTPUT",
        icon: "doc",
        bullets: ["产出结果与交付物", "验证与优化", "总结经验复盘"],
        denseBullets: [
          "交付完整上线版本、指标观测看板与操作说明文档，并对照初期目标逐项核验实际转化收益",
          "汇总实施过程中的有效做法与失误教训，沉淀可复用的标准模板反哺下一轮迭代优化",
        ],
        sparseBullets: ["输出"],
      },
    ],
    extraStep: {
      id: "review",
      order: 5,
      title: "沉淀",
      en: "SCALE",
      icon: "spark",
      bullets: ["固化方法模板", "跨团队推广", "建立长效看板"],
      denseBullets: [
        "把验证有效的流程动作整理为跨团队通用清单，并在季度复盘中持续跟踪长期留存效果",
      ],
      sparseBullets: ["沉淀"],
    },
    redundantSteps: [
      {
        id: "sync",
        order: 90,
        redundant: true,
        title: "临时对齐",
        en: "MEETING",
        icon: "chat",
        bullets: ["拉会同步口头进度", "抄送十余位干系人", "记录零散讨论纪要"],
        denseBullets: [
          "每周额外召开两次跨组口头同步会，重复汇报已知背景并把零散聊天记录直接塞进正式汇报页",
        ],
        sparseBullets: ["对齐"],
      },
      {
        id: "cc",
        order: 91,
        redundant: true,
        title: "二次抄送",
        en: "CC MAIL",
        icon: "mail",
        bullets: ["群发邮件留痕", "重复确认附件版本", "等待无期限回复"],
        denseBullets: [
          "在交付动作之外单独占用一张主流程卡展示邮件抄送与人工二次确认，稀释核心转化路径",
        ],
        sparseBullets: ["抄送"],
      },
    ],
  },
  course: {
    id: "course",
    label: "课程教学 · 实验探究",
    short: "课程教学",
    slideTitle: "一堂探究课的四步认知转化路径",
    inputTitle: "输入",
    inputItems: ["现象", "疑问", "器材", "前知"],
    outputTitle: "结果",
    outputItems: ["原理", "证据", "模型", "迁移"],
    loopLabel: "反思再测",
    coreSteps: [
      {
        id: "discover",
        order: 1,
        title: "观察",
        en: "OBSERVE",
        icon: "search",
        bullets: ["呈现反直觉现象", "记录关键变量", "提出可测问题"],
        denseBullets: [
          "先让学生在课堂现场观看对照实验现象并写下直觉预测，再逐项记录温度、时长与初始条件",
        ],
        sparseBullets: ["观察"],
      },
      {
        id: "analyze",
        order: 2,
        title: "假设",
        en: "HYPOTHESIZE",
        icon: "pie",
        bullets: ["拆分控制变量", "形成可证伪猜想", "设计对照分组"],
        denseBullets: [
          "引导学生区分自变量与无关干扰项，把模糊想法改写成可以通过单次对照实验证伪的明确假设",
        ],
        sparseBullets: ["假设"],
      },
      {
        id: "execute",
        order: 3,
        title: "实验",
        en: "TEST",
        icon: "gear",
        bullets: ["按序采集样本", "控制单一变量", "复核异常读数"],
        denseBullets: [
          "小组分工按步骤完成三次重复测量并记录原始数据表，发现偏离趋势时先排查仪器误差再重测",
        ],
        sparseBullets: ["实验"],
      },
      {
        id: "output",
        order: 4,
        title: "归纳",
        en: "CONCLUDE",
        icon: "doc",
        bullets: ["对照初始假设", "提炼规律表述", "完成新场景迁移"],
        denseBullets: [
          "将实测曲线与课前预测并排比对，用一句话概括规律并用生活案例检验学生是否真正会迁移应用",
        ],
        sparseBullets: ["归纳"],
      },
    ],
    extraStep: {
      id: "review",
      order: 5,
      title: "迁移",
      en: "APPLY",
      icon: "spark",
      bullets: ["抛出变式习题", "解释真实案例", "检验概念边界"],
      denseBullets: ["用脱离课本原例的新情境提问，确认学生掌握的是底层因果而不是死记步骤"],
      sparseBullets: ["迁移"],
    },
    redundantSteps: [
      {
        id: "sync",
        order: 90,
        redundant: true,
        title: "点名签到",
        en: "ROLL CALL",
        icon: "chat",
        bullets: ["核对课堂考勤", "分发空白签到表", "整理座位名单"],
        denseBullets: ["把与探究逻辑毫无关系的考勤点名与收发签到表当成核心教学阶段放上主流程"],
        sparseBullets: ["签到"],
      },
      {
        id: "cc",
        order: 91,
        redundant: true,
        title: "整理桌面",
        en: "CLEANUP",
        icon: "mail",
        bullets: ["回收多余废纸", "擦拭黑板粉笔灰", "关闭投影遥控"],
        denseBullets: ["将课后行政收尾杂务混入知识建构流程，使学生看不清真正产生认知飞跃的关键节点"],
        sparseBullets: ["收尾"],
      },
    ],
  },
  proposal: {
    id: "proposal",
    label: "方案策划 · 需求交付",
    short: "方案策划",
    slideTitle: "老客复购方案从诊断到交付闭环",
    inputTitle: "输入",
    inputItems: ["客群", "流失", "预算", "周期"],
    outputTitle: "结果",
    outputItems: ["复购", "留存", "口碑", "复利"],
    loopLabel: "数据复盘",
    coreSteps: [
      {
        id: "discover",
        order: 1,
        title: "诊断",
        en: "DIAGNOSE",
        icon: "search",
        bullets: ["定位流失节点", "分层沉默客群", "锁定核心痛点"],
        denseBullets: [
          "调取近半年首单与复购漏斗数据，拆出三十天与九十天两批流失客群并访谈未回流的核心原因",
        ],
        sparseBullets: ["诊断"],
      },
      {
        id: "analyze",
        order: 2,
        title: "策划",
        en: "DESIGN",
        icon: "pie",
        bullets: ["匹配权益梯度", "拟定触达节奏", "测算投入回报"],
        denseBullets: [
          "针对不同客单价分层设计差异化回访礼遇与触达时段，测算券后毛利空间避免陷入低价内耗",
        ],
        sparseBullets: ["策划"],
      },
      {
        id: "execute",
        order: 3,
        title: "试跑",
        en: "PILOT",
        icon: "gear",
        bullets: ["小流量灰度验证", "对照实验分组", "动态调优话术"],
        denseBullets: [
          "先抽取百分之十沉默会员跑两周灰度对照实验，逐日观测打开率与核销率并快速替换低效文案",
        ],
        sparseBullets: ["试跑"],
      },
      {
        id: "output",
        order: 4,
        title: "交付",
        en: "LAUNCH",
        icon: "doc",
        bullets: ["全量上线策略", "核算净增收益", "沉淀标准手册"],
        denseBullets: [
          "将灰度胜出方案全量推至目标客群，按月核算净增复购额并把触发规则写入自动化运营手册",
        ],
        sparseBullets: ["交付"],
      },
    ],
    extraStep: {
      id: "review",
      order: 5,
      title: "扩量",
      en: "EXPAND",
      icon: "spark",
      bullets: ["复制到新门店", "联动会员等级", "建立预警阈值"],
      denseBullets: ["将跑通的回访机制复制到其余区域门店，并用月度预警线自动触发新一轮诊断"],
      sparseBullets: ["扩量"],
    },
    redundantSteps: [
      {
        id: "sync",
        order: 90,
        redundant: true,
        title: "拉群通报",
        en: "GROUP PING",
        icon: "chat",
        bullets: ["新建项目沟通群", "转发历史截图", "反复确认参会人"],
        denseBullets: ["把日常沟通建群与转发截图塞成独立业务环节，掩盖了真正的客户价值转化节点"],
        sparseBullets: ["拉群"],
      },
      {
        id: "cc",
        order: 91,
        redundant: true,
        title: "打印存档",
        en: "ARCHIVE",
        icon: "mail",
        bullets: ["导出纸质备份", "手动编号入柜", "邮件抄送归档"],
        denseBullets: ["把后勤归档动作与核心增长步骤并列，导致决策层抓不住方案生效的关键杠杆"],
        sparseBullets: ["存档"],
      },
    ],
  },
};

export function cloneStep(step) {
  return { ...step, bullets: [...step.bullets], denseBullets: [...step.denseBullets], sparseBullets: [...step.sparseBullets] };
}

// 开场灾难初稿：0/4 失守（6 步含 2 冗余 + 执行/分析倒置 + 逆向箭头 + 缺输入结果锚 + 隐藏胶囊层级 + 密字拥挤）
export function createBrokenState(scenarioId = "poster") {
  const sc = SCENARIOS[scenarioId] || SCENARIOS.poster;
  const [s1, s2, s3, s4] = sc.coreSteps.map(cloneStep);
  const [r1, r2] = sc.redundantSteps.map(cloneStep);
  return {
    scenario: sc.id,
    steps: [s1, s3, s2, r1, s4, r2], // 执行(3)跑在分析(2)之前 + 混入2张冗余卡
    arrows: ["fwd", "rev", "fwd", "none", "fwd"], // 第 2->3 逆流 + 第 4->5 断连
    hasInput: false,
    hasOutput: false,
    showCaps: false,
    density: "dense",
    layoutMode: "linear",
    loopMode: "none",
    breath: 0.12, // 过挤留白
    selectedStepIdx: -1,
    highlightTarget: null,
  };
}

// 多组合法解预设（均可通过 4/4）
export function createPresetState(preset, scenarioId = "poster") {
  const sc = SCENARIOS[scenarioId] || SCENARIOS.poster;
  const cores = sc.coreSteps.map(cloneStep);
  const extra = cloneStep(sc.extraStep);

  if (preset === "poster-ideal") {
    return {
      scenario: sc.id,
      steps: cores,
      arrows: ["fwd", "fwd", "fwd"],
      hasInput: true,
      hasOutput: true,
      showCaps: true,
      density: "focused",
      layoutMode: "linear",
      loopMode: "clean",
      breath: 0.28,
      selectedStepIdx: -1,
      highlightTarget: null,
    };
  }
  if (preset === "exec-three") {
    return {
      scenario: sc.id,
      steps: [cores[0], cores[2], cores[3]],
      arrows: ["fwd", "fwd"],
      hasInput: true,
      hasOutput: true,
      showCaps: true,
      density: "focused",
      layoutMode: "linear",
      loopMode: "none",
      breath: 0.32,
      selectedStepIdx: -1,
      highlightTarget: null,
    };
  }
  if (preset === "five-linear") {
    return {
      scenario: sc.id,
      steps: [...cores, extra],
      arrows: ["fwd", "fwd", "fwd", "fwd"],
      hasInput: true,
      hasOutput: true,
      showCaps: true,
      density: "focused",
      layoutMode: "linear",
      loopMode: "none",
      breath: 0.25,
      selectedStepIdx: -1,
      highlightTarget: null,
    };
  }
  if (preset === "stepped-flow") {
    return {
      scenario: sc.id,
      steps: cores,
      arrows: ["fwd", "fwd", "fwd"],
      hasInput: true,
      hasOutput: true,
      showCaps: true,
      density: "focused",
      layoutMode: "stepped",
      loopMode: "clean",
      breath: 0.28,
      selectedStepIdx: -1,
      highlightTarget: null,
    };
  }
  // 反向试错预设（主动制造另一端翻车）
  if (preset === "err-bi") {
    return {
      ...createPresetState("poster-ideal", sc.id),
      arrows: ["bi", "bi", "bi"],
    };
  }
  if (preset === "err-two") {
    return {
      scenario: sc.id,
      steps: [cores[0], cores[3]],
      arrows: ["fwd"],
      hasInput: true,
      hasOutput: true,
      showCaps: true,
      density: "focused",
      layoutMode: "linear",
      loopMode: "none",
      breath: 0.30,
      selectedStepIdx: -1,
      highlightTarget: null,
    };
  }
  if (preset === "err-spaghetti") {
    return {
      ...createPresetState("poster-ideal", sc.id),
      loopMode: "spaghetti",
    };
  }
  if (preset === "err-sparse") {
    return {
      ...createPresetState("poster-ideal", sc.id),
      breath: 0.43,
      density: "empty",
    };
  }
  return createBrokenState(sc.id);
}

export function getStepLines(step, density) {
  if (density === "dense") return step.denseBullets;
  if (density === "empty") return step.sparseBullets;
  return step.bullets;
}

export function countStateChars(state) {
  let n = 0;
  for (const s of state.steps) {
    n += s.title.length;
    for (const line of getStepLines(s, state.density)) n += line.length;
  }
  if (state.hasInput) n += 10;
  if (state.hasOutput) n += 10;
  if (state.loopMode !== "none") n += 4;
  return n;
}

// 统一几何计算：同时供 Canvas 绘制与单真源诊断读取
export function computeLayout(state, width, height) {
  const n = state.steps.length;
  const compact = width < 620;
  // 窄屏且 5-6 步时自动采用两排折返布局（每排 3 卡），杜绝窄屏下卡片被挤成细条或叠压端锚
  const twoRow = compact && n >= 5;

  let cards = [];
  let arrowRects = [];
  let inputBox;
  let outputBox;
  let cardW = 120;
  let cardH = 180;
  let arrowGap = 24;
  let loopY = height - 24;
  let loopPill = { x: width / 2 - 44, y: loopY - 12, w: 88, h: 24 };

  if (twoRow) {
    // 窄屏双排：顶部水平放置「输入」与「结果」紧凑锚条，避免挤占左右宽度
    const padX = 12;
    const topBarY = 26;
    const anchorH = 26;
    const anchorW = Math.min(110, (width - padX * 2 - 16) * 0.44);
    inputBox = {
      x: padX,
      y: topBarY,
      w: anchorW,
      h: anchorH,
      pillH: anchorH,
      present: state.hasInput,
      inlineBar: true,
    };
    outputBox = {
      x: width - padX - anchorW,
      y: topBarY,
      w: anchorW,
      h: anchorH,
      pillH: anchorH,
      present: state.hasOutput,
      inlineBar: true,
    };

    const row1Count = Math.ceil(n / 2); // 5->3, 6->3
    const row2Count = n - row1Count;    // 5->2, 6->3
    const cols = Math.max(row1Count, row2Count);
    const gapX = Math.max(18, Math.min(34, 14 + state.breath * 42));
    arrowGap = gapX;
    const usableW = width - padX * 2;
    const extraSqueeze = state.breath > 0.37 ? (state.breath - 0.37) * 3.2 : 0;
    cardW = Math.max(66, ((usableW - gapX * (cols - 1)) / cols) * (1 - extraSqueeze * 0.35));

    const capH = state.showCaps ? 18 : 0;
    const capGap = state.showCaps ? 6 : 0;
    const contentTop = topBarY + anchorH + 12;
    const contentBot = height - (state.loopMode === "none" ? 10 : 34);
    const rowGap = Math.max(16, 12 + capH + capGap);
    cardH = Math.max(82, Math.min(126, (contentBot - contentTop - rowGap - capH - capGap) / 2));

    const rows = [
      { count: row1Count, startIdx: 0, y: contentTop + capH + capGap },
      { count: row2Count, startIdx: row1Count, y: contentTop + capH + capGap + cardH + rowGap },
    ];

    cards = [];
    for (const row of rows) {
      const span = row.count * cardW + (row.count - 1) * gapX;
      const sx = (width - span) / 2;
      for (let c = 0; c < row.count; c++) {
        const idx = row.startIdx + c;
        const step = state.steps[idx];
        const x = sx + c * (cardW + gapX);
        const y = row.y;
        const capW = Math.min(cardW * 0.84, 72);
        const capRect = { x: x + (cardW - capW) / 2, y: y - capGap - capH, w: capW, h: capH };
        const iconR = Math.min(cardW * 0.19, cardH * 0.16, 15);
        const iconCenter = { x: x + cardW / 2, y: y + Math.max(iconR + 8, cardH * 0.25), r: iconR };
        const delSize = 19;
        const delRect = step.redundant ? { x: x + cardW - delSize - 3, y: y + 3, w: delSize, h: delSize } : null;
        cards.push({ idx, step, x, y, w: cardW, h: cardH, cx: x + cardW / 2, cy: y + cardH / 2, capRect, iconCenter, delRect });
      }
    }

    arrowRects = [];
    for (let i = 0; i < n - 1; i++) {
      const a = cards[i];
      const b = cards[i + 1];
      const sameRow = Math.abs(a.y - b.y) < 10;
      if (sameRow) {
        const x1 = a.x + a.w + 2;
        const x2 = b.x - 2;
        const y1 = a.y + a.h * 0.38;
        const y2 = b.y + b.h * 0.38;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        arrowRects.push({
          idx: i,
          type: state.arrows[i] || "fwd",
          x1, y1, x2, y2, midX, midY,
          crossRow: false,
          hitRect: { x: midX - 24, y: midY - 18, w: 48, h: 52 },
        });
      } else {
        // 跨行折返短箭（上排末尾指往下排开头）
        const midX = width / 2;
        const midY = a.y + a.h + rowGap / 2;
        arrowRects.push({
          idx: i,
          type: state.arrows[i] || "fwd",
          x1: midX - 14, y1: midY, x2: midX + 14, y2: midY,
          midX, midY,
          crossRow: true,
          fromPt: { x: a.cx, y: a.y + a.h + 2 },
          toPt: { x: b.cx, y: b.y - (state.showCaps ? capH + capGap + 2 : 2) },
          hitRect: { x: midX - 24, y: midY - 14, w: 48, h: 28 },
        });
      }
    }

    loopY = height - 16;
    loopPill = { x: width / 2 - 42, y: loopY - 11, w: 84, h: 22 };
  } else {
    // 常规单排横向流水线（桌面 2-6 步，窄屏 2-4 步）
    const topAnchorMode = compact; // 手机窄屏 2-4 步同样把输入/结果放顶栏，留足卡片宽度！
    const padX = compact ? 12 : Math.max(18, width * (0.018 + state.breath * 0.12));
    const padTop = topAnchorMode ? 60 : 24;
    const padBottom = state.loopMode === "none" ? (compact ? 18 : 26) : (compact ? 42 : 54);

    const anchorW = topAnchorMode ? Math.min(116, (width - padX * 2 - 14) * 0.44) : Math.min(84, width * 0.068);
    const anchorGap = topAnchorMode ? 0 : Math.max(16, width * 0.018);
    const usableLeft = topAnchorMode ? padX : padX + anchorW + anchorGap;
    const usableRight = topAnchorMode ? width - padX : width - padX - anchorW - anchorGap;
    const usableW = Math.max(140, usableRight - usableLeft);

    const gapRatio = compact ? 0.05 + state.breath * 0.24 : 0.035 + state.breath * 0.24;
    arrowGap = n > 1
      ? Math.max(compact ? 18 : 24, Math.min(usableW * 0.16, (usableW * gapRatio) / Math.max(1, n - 1) * 1.42))
      : 0;
    const totalArrowGap = Math.max(0, n - 1) * arrowGap;

    const extraSqueeze = state.breath > 0.37 ? (state.breath - 0.37) * 4.5 : 0;
    const rawCardW = (usableW - totalArrowGap) / Math.max(1, n);
    const maxCardW = compact ? 128 : 220;
    cardW = Math.max(compact ? 56 : 76, Math.min(maxCardW, rawCardW * (1 - extraSqueeze * 0.45)));
    // 绝对不超出 usableW，防止覆盖端锚
    if (cardW * n + totalArrowGap > usableW) {
      cardW = Math.max(44, (usableW - totalArrowGap) / Math.max(1, n));
    }
    const totalSpan = cardW * n + totalArrowGap;
    const startX = usableLeft + (usableW - totalSpan) / 2;

    const capH = state.showCaps ? (compact ? 22 : 32) : 0;
    const capGap = state.showCaps ? (compact ? 8 : 13) : 0;
    const availCardH = height - padTop - padBottom - capH - capGap;
    const steppedLift = state.layoutMode === "stepped" ? Math.min(compact ? 18 : 30, availCardH * 0.14) : 0;
    cardH = Math.max(compact ? 132 : 172, Math.min(compact ? 224 : 254, availCardH - steppedLift));
    const baseCardY = padTop + capH + capGap + Math.max(0, (availCardH - steppedLift - cardH) * 0.44);

    cards = state.steps.map((step, i) => {
      const t = n > 1 ? i / (n - 1) : 0;
      const stepOffset = state.layoutMode === "stepped" ? (1 - t) * steppedLift : 0;
      const x = startX + i * (cardW + arrowGap);
      const y = baseCardY + stepOffset;
      const capW = Math.min(cardW * 0.84, compact ? 68 : 112);
      const capRect = {
        x: x + (cardW - capW) / 2,
        y: y - capGap - capH,
        w: capW,
        h: capH,
      };
      const iconR = Math.min(cardW * 0.26, cardH * 0.17, compact ? 20 : 34);
      const iconCenter = {
        x: x + cardW / 2,
        y: y + Math.max(iconR + 10, cardH * 0.25),
        r: iconR,
      };
      const delSize = compact ? 20 : 24;
      const delRect = step.redundant
        ? { x: x + cardW - delSize - 4, y: y + 4, w: delSize, h: delSize }
        : null;

      return {
        idx: i,
        step,
        x,
        y,
        w: cardW,
        h: cardH,
        cx: x + cardW / 2,
        cy: y + cardH / 2,
        capRect,
        iconCenter,
        delRect,
      };
    });

    arrowRects = [];
    for (let i = 0; i < n - 1; i++) {
      const a = cards[i];
      const b = cards[i + 1];
      const x1 = a.x + a.w + 3;
      const x2 = b.x - 3;
      const y1 = a.y + a.h * 0.30;
      const y2 = b.y + b.h * 0.30;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const hitW = Math.max(compact ? 34 : 58, x2 - x1 + 14);
      const hitH = compact ? 50 : 74;
      arrowRects.push({
        idx: i,
        type: state.arrows[i] || "fwd",
        x1,
        y1,
        x2,
        y2,
        midX,
        midY,
        crossRow: false,
        hitRect: { x: midX - hitW / 2, y: midY - hitH * 0.62, w: hitW, h: hitH },
      });
    }

    const firstCard = cards[0];
    const lastCard = cards[cards.length - 1];
    if (topAnchorMode) {
      inputBox = {
        x: padX,
        y: 26,
        w: anchorW,
        h: 26,
        pillH: 26,
        present: state.hasInput,
        inlineBar: true,
      };
      outputBox = {
        x: width - padX - anchorW,
        y: 26,
        w: anchorW,
        h: 26,
        pillH: 26,
        present: state.hasOutput,
        inlineBar: true,
      };
    } else {
      const anchorPillH = 30;
      inputBox = {
        x: padX,
        y: firstCard ? firstCard.y + firstCard.h * 0.24 : height * 0.35,
        w: anchorW,
        h: 122,
        pillH: anchorPillH,
        present: state.hasInput,
        inlineBar: false,
      };
      outputBox = {
        x: width - padX - anchorW,
        y: lastCard ? lastCard.y + lastCard.h * 0.24 : height * 0.35,
        w: anchorW,
        h: 122,
        pillH: anchorPillH,
        present: state.hasOutput,
        inlineBar: false,
      };
    }

    loopY = Math.min(height - (compact ? 17 : 24), Math.max(...cards.map((c) => c.y + c.h)) + (compact ? 22 : 34));
    const loopPillW = compact ? 78 : 106;
    const loopPillH = compact ? 22 : 28;
    loopPill = {
      x: width / 2 - loopPillW / 2,
      y: loopY - loopPillH / 2,
      w: loopPillW,
      h: loopPillH,
    };
  }

  // 单真源视觉呼吸留白率（按流程核心带内的间隙比与文案墨密度综合计算，跨所有屏幕口径 100% 自洽）
  const gapComfort = arrowGap / Math.max(1, cardW + arrowGap); // 间隙占比 ~0.11..0.38
  const densityPenalty = state.density === "dense" ? -0.10 : state.density === "empty" ? 0.08 : 0.02;
  const stepLoadPenalty = n >= 6 ? -0.06 : n <= 3 ? 0.04 : 0;
  const rawBreathRatio = state.breath * 0.72 + gapComfort * 0.45 + densityPenalty + stepLoadPenalty;
  const whitespacePct = Math.round(Math.max(10, Math.min(54, rawBreathRatio * 100)));

  return {
    width,
    height,
    compact,
    twoRow,
    cards,
    arrowRects,
    inputBox,
    outputBox,
    loopY,
    loopPill,
    cardW,
    cardH,
    arrowGap,
    whitespacePct,
    totalChars: countStateChars(state),
  };
}

// 模拟信号核从左端输入出发沿当前有向图穿行，返回真实到达情况与卡死位置
export function traceSignal(state) {
  const n = state.steps.length;
  if (!state.hasInput) {
    return {
      ok: false,
      blockedType: "missing-input",
      blockedStepIdx: -1,
      blockedArrowIdx: -1,
      reachedSteps: 0,
      reason: "信号找不到左端「输入」起点，观众不知道流程从哪里开始。",
    };
  }
  for (let i = 0; i < n - 1; i++) {
    const arr = state.arrows[i];
    if (arr === "rev") {
      return {
        ok: false,
        blockedType: "reverse-arrow",
        blockedStepIdx: i,
        blockedArrowIdx: i,
        reachedSteps: i + 1,
        reason: `信号走到第 ${i + 1}→${i + 2} 步被逆向箭头（←）迎面顶回，前进路径断链。`,
      };
    }
    if (arr === "none") {
      return {
        ok: false,
        blockedType: "broken-arrow",
        blockedStepIdx: i,
        blockedArrowIdx: i,
        reachedSteps: i + 1,
        reason: `第 ${i + 1} 步与第 ${i + 2} 步之间缺少推进箭头，视线在此悬空断开。`,
      };
    }
  }
  const allBi = state.arrows.length > 0 && state.arrows.every((a) => a === "bi");
  if (allBi) {
    return {
      ok: false,
      blockedType: "bi-loop",
      blockedStepIdx: 1,
      blockedArrowIdx: 0,
      reachedSteps: n,
      reason: "所有步骤间都是双向箭头（↔），信号来回震荡，失去单向推进感。",
    };
  }
  if (!state.hasOutput) {
    return {
      ok: false,
      blockedType: "missing-output",
      blockedStepIdx: n - 1,
      blockedArrowIdx: -1,
      reachedSteps: n,
      reason: "信号走完最后一步却找不到右端「结果」落点，观众看不到最终产出。",
    };
  }
  return {
    ok: true,
    blockedType: null,
    blockedStepIdx: -1,
    blockedArrowIdx: -1,
    reachedSteps: n,
    reason: state.loopMode === "clean"
      ? "信号从输入顺畅转化到结果，并沿底部虚线回环温和反馈至各阶段。"
      : "信号从输入沿单向箭头顺畅穿过各阶段，稳稳落入最终结果。",
  };
}

// 单真源全面诊断（检出 10 类正反错态 + 原海报 4 大版式要点 + 5 大流程要素）
export function diagnose(state, layout) {
  const n = state.steps.length;
  const revIndices = [];
  const noneIndices = [];
  let biCount = 0;
  state.arrows.forEach((a, i) => {
    if (a === "rev") revIndices.push(i);
    if (a === "none") noneIndices.push(i);
    if (a === "bi") biCount++;
  });

  // 检出核心步骤的逻辑倒置（只比较非冗余核心步）
  const coreSeq = state.steps
    .map((s, idx) => ({ ...s, idx }))
    .filter((s) => !s.redundant);
  let invertedPair = null;
  for (let i = 0; i < coreSeq.length - 1; i++) {
    if (coreSeq[i].order > coreSeq[i + 1].order) {
      invertedPair = [coreSeq[i], coreSeq[i + 1]];
      break;
    }
  }

  const redundantCards = state.steps
    .map((s, idx) => ({ ...s, idx }))
    .filter((s) => s.redundant);

  const totalChars = layout ? layout.totalChars : countStateChars(state);
  const whitespacePct = layout ? layout.whitespacePct : Math.round(state.breath * 110);
  const cardW = layout ? layout.cardW : 160;
  const estSec = Math.max(1.5, +(totalChars / 6.2).toFixed(1)); // 经验按约 6.2 字/秒扫读（示意）

  const issues = [];

  if (revIndices.length > 0) {
    const idx = revIndices[0];
    issues.push({
      code: "arrow_reverse",
      pillar: "direction",
      severity: 100,
      badge: "逆流断链",
      title: `第 ${idx + 1}→${idx + 2} 步箭头画反了，逻辑当场顶回`,
      why: `流程页最基本的视觉契约是「沿单一方向推进」。现在「${state.steps[idx].title}」指向「${state.steps[idx + 1].title}」的箭头倒指回左边，观众视线走到一半撞墙折返。`,
      fix: `直接点击画布上标红的「←」箭头把它扳回正向「→」。`,
      target: { kind: "arrow", idx },
    });
  }

  if (noneIndices.length > 0) {
    const idx = noneIndices[0];
    issues.push({
      code: "arrow_broken",
      pillar: "direction",
      severity: 95,
      badge: "连接断裂",
      title: `第 ${idx + 1} 步和第 ${idx + 2} 步之间少了推进箭头`,
      why: `少了方向箭头，这两张卡片就退化成并列信息块，观众看不出前一步的输出如何流向后一步。`,
      fix: `点击两张卡片之间的红色虚线缺口，重新接通正向箭头「→」。`,
      target: { kind: "arrow", idx },
    });
  }

  if (biCount >= Math.max(1, state.arrows.length - 1) && state.arrows.length >= 2) {
    issues.push({
      code: "arrow_bi_spam",
      pillar: "direction",
      severity: 90,
      badge: "全双向迷路",
      title: `全页挂满双向箭头（↔），流程失去推进方向`,
      why: `当每一步都在互相来回指，观众分不清起点与终点；需要表达迭代优化时，应保持主干单向推进，再在底部画一条轻虚线回环。`,
      fix: `点击画布上的「↔」箭头把主干改回单向「→」，需要复盘时开启底部「迭代回环」。`,
      target: { kind: "arrow", idx: 0 },
    });
  }

  if (invertedPair) {
    const [a, b] = invertedPair;
    issues.push({
      code: "order_inverted",
      pillar: "logic",
      severity: 88,
      badge: "逻辑倒置",
      title: `「${a.title}」跑到了「${b.title}」前面，先后因果颠倒`,
      why: `流程页靠空间顺序编码因果顺序。现在还没完成「${b.title}」就直接跳进「${a.title}」，观众边听讲边在脑内倒带重排，理解瞬间打结。`,
      fix: `在画布上按住「${a.title}」或「${b.title}」卡片左右拖动，把它们换回正确先后顺序。`,
      target: { kind: "card", idx: a.idx },
    });
  }

  if (!state.hasInput || !state.hasOutput) {
    const missingBoth = !state.hasInput && !state.hasOutput;
    const missLabel = missingBoth ? "「输入」与「结果」" : !state.hasInput ? "左端「输入」" : "右端「结果」";
    issues.push({
      code: "missing_anchors",
      pillar: "logic",
      severity: 84,
      badge: missingBoth ? "无头无尾" : !state.hasInput ? "缺少输入" : "缺少结果",
      title: `缺少${missLabel}端锚，观众看不出从哪来、到哪去`,
      why: `原海报一句话点破本质：「我们从哪里来，要到哪里去，如何到达」。只摆中间动作不标输入与产出，流程就变成没有目的地的空转清单。`,
      fix: `直接点击画布最左或最右的虚线缺口（或下方开关），补回「输入 / 结果」端锚。`,
      target: { kind: !state.hasInput ? "input" : "output" },
    });
  }

  if (redundantCards.length > 0 || n >= 6) {
    issues.push({
      code: "too_many_steps",
      pillar: "logic",
      severity: 82,
      badge: `${n} 步过载`,
      title: redundantCards.length > 0
        ? `混进了 ${redundantCards.length} 张非转化琐事卡（如「${redundantCards[0].title}」），总步数膨胀到 ${n} 步`
        : `单页硬塞 ${n} 个步骤，超出 3–5 步一目了然窗口`,
      why: `认知研究（Cowan 2001）表明人的工作记忆焦点一次约容纳 4 个组块。把开会、抄送等零散动作硬列成主步骤，不仅挤扁卡片，还会淹没真正产生价值转换的阶段。`,
      fix: redundantCards.length > 0
        ? `直接点击标红卡片右上角的「×」把「${redundantCards[0].title}」裁出主流程。`
        : `用下方「− 精简步骤」把单页主阶段收拢到 3–5 步。`,
      target: { kind: "card", idx: redundantCards[0] ? redundantCards[0].idx : n - 1 },
    });
  }

  if (n <= 2) {
    issues.push({
      code: "too_few_steps",
      pillar: "logic",
      severity: 80,
      badge: "仅剩 2 步",
      title: `只剩 ${n} 步就硬套流程图，大材小用`,
      why: `只有两步对比或单次因果转换时，直接用左右对比页或标题说明页更直接；流程页的价值在于理清 3–5 个承上启下的中间转换环节。`,
      fix: `点击下方「+ 增加步骤」，把中间核心转换阶段补齐到 3–5 步。`,
      target: { kind: "card", idx: 0 },
    });
  }

  if (!state.showCaps) {
    issues.push({
      code: "no_hierarchy",
      pillar: "hierarchy",
      severity: 76,
      badge: "主次塌平",
      title: `关掉了阶段胶囊与图形锚点，大阶段和细则糊成一片`,
      why: `原海报靠顶部薄荷胶囊 + 深绿图标圆徽 + 大黑体阶段名建立第一眼视觉层级，让后排听众先扫 4 个大词，再按需读细则。现在全卡一样平淡，抓不到主线。`,
      fix: `打开下方「阶段胶囊与图标层级」，把阶段名称从细则里拎出来。`,
      target: { kind: "card", idx: 0 },
    });
  }

  if (state.density === "dense") {
    issues.push({
      code: "text_wall",
      pillar: "hierarchy",
      severity: 75,
      badge: `密字 ${totalChars}字`,
      title: `卡片塞进 ${totalChars} 字长段落，听众低头读字就听不见你讲`,
      why: `按经验约 6 字/秒扫读速度，这一页至少需要约 ${estSec} 秒才能勉强读完（示意），流程页当场退化成密密麻麻的文档表。`,
      fix: `把下方「文案密度」切回「精炼短动词」（每卡 3 条、每条 5–8 字）。`,
      target: { kind: "card", idx: 0 },
    });
  } else if (state.density === "empty") {
    issues.push({
      code: "text_empty",
      pillar: "hierarchy",
      severity: 70,
      badge: "空壳缺说明",
      title: `每张卡只剩孤零零一个词，看不出怎么转化`,
      why: `精炼不等于删光。观众知道「发现→分析」这四个空词后，仍不知道每一步要交付什么动作；保留 2–3 条短动宾细则，流程才真正落地。`,
      fix: `把「文案密度」切回「精炼短动词」，给每一步补上关键动作。`,
      target: { kind: "card", idx: 0 },
    });
  }

  if (state.loopMode === "spaghetti") {
    issues.push({
      code: "loop_spaghetti",
      pillar: "direction",
      severity: 78,
      badge: "回环蛛网",
      title: `多条回环线横穿卡片正文，把版面割成蛛网`,
      why: `ISO 5807 流程图规范强调连线尽量不交叉、不遮挡节点文字。原海报的高明之处，是把「迭代优化」收束到底部一条统一的水平虚线通道里。`,
      fix: `把下方「迭代回环」改成「底部虚线回环」或「单向无回环」。`,
      target: { kind: "loop" },
    });
  }

  if (state.breath < 0.19 || whitespacePct < 22) {
    issues.push({
      code: "tight_breath",
      pillar: "breath",
      severity: 72,
      badge: `拥挤 ${whitespacePct}%`,
      title: `留白压到仅 ${whitespacePct}%，卡片和箭头贴成一堵墙`,
      why: `流程页既要展示「关系」，也要让每一步彼此独立。间距过紧会让相邻步骤的文字粘连在一起，失去呼吸感与专业节奏。`,
      fix: `向右横拖画布空白区（或推高「留白呼吸距」滑轨到 24%–36%）。`,
      target: { kind: "breath" },
    });
  } else if (state.breath > 0.38 || whitespacePct > 42 || (!layout?.compact && cardW < 105 && n <= 5)) {
    issues.push({
      code: "over_sparse",
      pillar: "breath",
      severity: 68,
      badge: `过散 ${whitespacePct}%`,
      title: `留白拉到 ${whitespacePct}% 过散，卡片被挤成细长竖条`,
      why: `留白适度不是越多越好。间距撑得过大时，步骤卡片被压缩变形、箭头拉得太长，视觉上的因果紧密度反而断开。`,
      fix: `向左微调「留白呼吸距」滑轨回到 22%–36% 舒适区间。`,
      target: { kind: "breath" },
    });
  }

  issues.sort((a, b) => b.severity - a.severity);

  // 汇总四大版式要点（1:1 对应原海报底部「版式要点」）
  const hasErr = (p) => issues.some((it) => it.pillar === p);
  const firstErr = (p) => issues.find((it) => it.pillar === p);

  const pillars = [
    {
      id: "hierarchy",
      title: "主次分明",
      posterBody: "用大小、颜色、位置区分信息层级",
      pass: !hasErr("hierarchy"),
      badge: hasErr("hierarchy") ? firstErr("hierarchy").badge : "层级清晰",
    },
    {
      id: "direction",
      title: "方向清晰",
      posterBody: "通过箭头与动线，引导阅读顺序",
      pass: !hasErr("direction"),
      badge: hasErr("direction") ? firstErr("direction").badge : "单向顺畅",
    },
    {
      id: "logic",
      title: "逻辑连贯",
      posterBody: "确保步骤间关系明确，环环相扣",
      pass: !hasErr("logic"),
      badge: hasErr("logic") ? firstErr("logic").badge : `${n} 步闭环`,
    },
    {
      id: "breath",
      title: "留白适度",
      posterBody: "给内容呼吸感，提升可读性与专业感",
      pass: !hasErr("breath"),
      badge: hasErr("breath") ? firstErr("breath").badge : `留白 ${whitespacePct}%`,
    },
  ];

  const score = pillars.filter((p) => p.pass).length;

  // 汇总原海报右上角「五要素实时检视匣」
  const stepsOk = n >= 3 && n <= 5 && redundantCards.length === 0;
  const dirOk = revIndices.length === 0 && noneIndices.length === 0 && !(biCount >= Math.max(1, state.arrows.length - 1) && state.arrows.length >= 2);
  const relOk = !invertedPair && state.loopMode !== "spaghetti";
  const transOk = state.hasInput && state.density === "focused" && state.showCaps;
  const resultOk = state.hasOutput;

  const fiveElements = [
    {
      key: "steps",
      label: "步骤",
      posterDesc: "将过程拆解为关键阶段",
      pass: stepsOk,
      status: redundantCards.length > 0 ? `含 ${redundantCards.length} 冗步` : n > 5 ? `${n} 步超载` : n < 3 ? `仅 ${n} 步` : `${n} 关键步`,
    },
    {
      key: "direction",
      label: "方向",
      posterDesc: "用箭头指明推进路径",
      pass: dirOk,
      status: revIndices.length > 0 ? "存在逆流" : noneIndices.length > 0 ? "箭头断连" : !dirOk ? "全双向" : "单向明确",
    },
    {
      key: "relation",
      label: "关系",
      posterDesc: "展示步骤间的逻辑关联",
      pass: relOk,
      status: invertedPair ? "先后倒置" : state.loopMode === "spaghetti" ? "回环交叉" : "环环相扣",
    },
    {
      key: "transform",
      label: "转换",
      posterDesc: "输入经过处理产生变化",
      pass: transOk,
      status: !state.hasInput ? "缺起点输入" : state.density === "dense" ? "密字淹没" : state.density === "empty" ? "缺动作细则" : !state.showCaps ? "无阶段层级" : "转化清晰",
    },
    {
      key: "result",
      label: "结果",
      posterDesc: "明确最终产出与价值",
      pass: resultOk,
      status: resultOk ? "产出明确" : "缺少终点",
    },
  ];

  const trace = traceSignal(state);

  // 档位文案（绝不写假精确百分比，统一用档位 + 示意）
  let gradeLabel = "多处阻塞（示意）";
  if (score === 4) {
    if (state.layoutMode === "stepped") gradeLabel = "阶梯推进解（示意）";
    else if (n === 3) gradeLabel = "三步极简解（示意）";
    else if (n === 5) gradeLabel = "五步纵深解（示意）";
    else if (state.loopMode === "clean") gradeLabel = "原海报闭环解（示意）";
    else gradeLabel = "四步直推解（示意）";
  } else if (score === 3) {
    gradeLabel = "仅差临门一脚（示意）";
  } else if (score >= 1) {
    gradeLabel = "路径仍有卡点（示意）";
  }

  let headline = "";
  let body = "";
  let nextStep = "";
  if (issues.length === 0) {
    headline = `${n} 步单向转化打通，观众一眼看懂从哪来到哪去`;
    body = `当前流程保留 ${n} 个核心转化阶段（约 ${totalChars} 字，扫读约 ${estSec} 秒，示意），留白占 ${whitespacePct}%，输入与结果双锚齐全。按下 Space 注入一颗信号核，看它顺畅走完全程。`;
    nextStep = `试试切换上方不同合法解（三步极简 / 五步纵深 / S 形阶梯），或点「反向试错」亲眼看看全双向箭头、蛛网回环怎样毁掉好流程。`;
  } else {
    const top = issues[0];
    headline = top.title;
    body = top.why;
    nextStep = top.fix;
  }

  return {
    score,
    pillars,
    fiveElements,
    issues,
    topIssue: issues[0] || null,
    trace,
    gradeLabel,
    headline,
    body,
    nextStep,
    metrics: {
      stepCount: n,
      whitespacePct,
      totalChars,
      estSec,
      cardW: Math.round(cardW),
    },
  };
}

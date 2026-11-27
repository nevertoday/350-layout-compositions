// 348 矩阵页 幻灯片版式 — 单一真源状态与评判引擎
// 画布绘制、顶栏状态、虚线蓝图诊单与五项探针全部从 evaluate(state) 读取同一份计算结果。

export const QUADRANTS = ["tl", "tr", "bl", "br"];

export const QUADRANT_LABELS = {
  tl: "左上象限",
  tr: "右上象限",
  bl: "左下象限",
  br: "右下象限",
};

export const SCENARIOS = {
  poster: {
    id: "poster",
    name: "原海报 · 紧急×重要",
    shortName: "原海报 · 四象限",
    meetingTag: "季度任务优先级拍板会",
    axes: {
      top: "重要性高",
      bottom: "重要性低",
      left: "紧急性低",
      right: "紧急性高",
      xLabel: "紧急性",
      yLabel: "重要性",
    },
    collinearAxes: {
      top: "价值度高",
      bottom: "价值度低",
      left: "重要性低",
      right: "重要性高",
      xLabel: "重要性",
      yLabel: "价值度",
    },
    recommendedFocus: ["tr", "tl"],
    focusRationales: {
      tr: "原海报高亮右上「重点聚焦区」：适合事故抢险或冲刺排期会，先把今天必须立刻突破的火情拉到台面。",
      tl: "高亮左上「长期规划区」：对应史蒂芬·柯维（1989）强调的第二象限杠杆解，适合季度战略会，避免团队整天救火。",
      br: "高亮右下「短期应对区」：适合流程提效与外包梳理会，集中清理可授权或自动化的高频杂务。",
      bl: "高亮左下「低优先区」：适合季度「止损清单」会议，明确停掉哪些不重要也不紧急的消耗项。",
    },
    quadrants: {
      tl: {
        title: "长期规划区",
        icon: "ribbon",
        trait: "重要但不紧急",
        detail: "适合长期投入与规划",
        strategy: "策略：提前布局，持续积累",
        dense:
          "该类工作直接决定团队未来两个季度的竞争壁垒与系统稳定性，虽然眼前没有外部倒计时催促，但如果长期被临时杂务挤压就会逐步演变成高成本危机，需要每周固定划出深度时段持续推进。",
      },
      tr: {
        title: "重点聚焦区",
        icon: "target",
        trait: "重要且紧急",
        detail: "需要立即行动，优先处理",
        strategy: "策略：集中精力，快速突破",
        dense:
          "此类事项同时具备高业务影响与严格截止时间，一旦延误会直接造成核心指标下滑、客户违约或线上故障扩散，必须立刻冻结外围非核心任务，由骨干成员集中兵力在限定节点前闭环交付。",
      },
      bl: {
        title: "低优先区",
        icon: "ban",
        trait: "不重要也不紧急",
        detail: "可适当减少投入或后置",
        strategy: "策略：减少干预，定期回顾",
        dense:
          "这类琐碎需求既不直接拉动季度主目标，也不存在真实的时间紧迫感，往往源自惯性报表或无明确收益的装饰性改动，应当从周计划中主动剔除，仅在月度复盘时批量确认是否彻底归档。",
      },
      br: {
        title: "短期应对区",
        icon: "bolt",
        trait: "紧急但不重要",
        detail: "可授权或简化处理",
        strategy: "策略：提高效率，减少耗时",
        dense:
          "多为临时插单、常规审批与跨部门信息核对，催促感强烈但对核心成果贡献有限；若由核心人员事必躬亲会严重挤占主航道精力，最佳做法是建立标准模板、工具自动化或明确授权分流。",
      },
    },
    items: [
      { id: "p1", label: "核心架构升级", orthoX: 0.19, orthoY: 0.39, colX: 0.56, colY: 0.41 },
      { id: "p2", label: "新人培养体系", orthoX: 0.38, orthoY: 0.42, colX: 0.46, colY: 0.58 },
      { id: "p3", label: "线上故障修复", orthoX: 0.66, orthoY: 0.39, colX: 0.86, colY: 0.24 },
      { id: "p4", label: "大客户续约方案", orthoX: 0.84, orthoY: 0.43, colX: 0.66, colY: 0.31 },
      { id: "p5", label: "旧文档美化", orthoX: 0.26, orthoY: 0.88, colX: 0.17, colY: 0.88 },
      { id: "p6", label: "临时数据报送", orthoX: 0.74, orthoY: 0.88, colX: 0.33, colY: 0.75 },
    ],
  },

  product: {
    id: "product",
    name: "产品排期 · 投入×影响",
    shortName: "产品 · 投入×影响",
    meetingTag: "下月需求排期评审会",
    axes: {
      top: "业务影响高",
      bottom: "业务影响低",
      left: "开发投入低",
      right: "开发投入高",
      xLabel: "开发投入",
      yLabel: "业务影响",
    },
    collinearAxes: {
      top: "用户收益高",
      bottom: "用户收益低",
      left: "业务价值低",
      right: "业务价值高",
      xLabel: "业务价值",
      yLabel: "用户收益",
    },
    recommendedFocus: ["tl", "tr"],
    focusRationales: {
      tl: "产品排期高亮左上「速赢突破区（低投入·高影响）」：打破「永远只亮右上角」的惯性，用最小研发成本先拿最大收益。",
      tr: "高亮右上「战略攻坚区（高投入·高影响）」：适合年度路线图评审，专门为重投入大项目申请专项人力。",
      br: "高亮右下「重投低产区」：适合需求砍项会，明确展示哪些大项目投入产出失衡、本季坚决不做。",
      bl: "高亮左下「顺手补丁区」：适合技术债清理周，挑几个不费工夫的小改进穿插上线。",
    },
    quadrants: {
      tl: {
        title: "速赢突破区",
        icon: "target",
        trait: "投入低且影响高",
        detail: "两周内可见明确回报",
        strategy: "策略：立刻排期，率先上线",
        dense:
          "这些改动研发周期短、依赖少，却直接打通核心转化漏斗或消除高频阻塞，投入产出比处于全盘最高档位，应该跳过冗长排期优先交付，用可见成果快速验证业务假设并建立团队信心。",
      },
      tr: {
        title: "战略攻坚区",
        icon: "ribbon",
        trait: "投入高且影响高",
        detail: "周期长但拉高长期上限",
        strategy: "策略：拆期立项，设里程碑",
        dense:
          "涉及底层数据重构或跨端能力建设，单一迭代无法闭环，但如果缺乏拆解直接一口吞下极易延期失控，必须明确阶段性验证口径与专项负责人，分两个版本渐进式释放价值。",
      },
      bl: {
        title: "顺手补丁区",
        icon: "bolt",
        trait: "投入低但影响低",
        detail: "锦上添花的轻量优化",
        strategy: "策略：空档穿插，不占主线",
        dense:
          "对核心营收或留存指标影响轻微，但实现成本仅需半天到一天，适合在版本提测空隙或新人热身阶段顺手清理，切忌在主会场上花大块时间反复争论其优先级。",
      },
      br: {
        title: "重投低产区",
        icon: "ban",
        trait: "投入高但影响低",
        detail: "成本高昂而回报稀薄",
        strategy: "策略：果断暂缓，拒绝立项",
        dense:
          "通常来自个别边缘场景的过度定制，需要耗费多个端侧团队数周开发且后续维护沉重，对绝大多数用户毫无感知，矩阵把它放到右下角正是为了给团队提供公开拒做的依据。",
      },
    },
    items: [
      { id: "r1", label: "结账步数减半", orthoX: 0.19, orthoY: 0.39, colX: 0.85, colY: 0.24 },
      { id: "r2", label: "首屏加载提速", orthoX: 0.38, orthoY: 0.43, colX: 0.65, colY: 0.33 },
      { id: "r3", label: "多端同步引擎", orthoX: 0.66, orthoY: 0.39, colX: 0.56, colY: 0.43 },
      { id: "r4", label: "开放插件生态", orthoX: 0.84, orthoY: 0.43, colX: 0.45, colY: 0.58 },
      { id: "r5", label: "深色图标微调", orthoX: 0.26, orthoY: 0.88, colX: 0.31, colY: 0.74 },
      { id: "r6", label: "3D皮肤商城", orthoX: 0.74, orthoY: 0.88, colX: 0.16, colY: 0.88 },
    ],
  },

  bcg: {
    id: "bcg",
    name: "波士顿 · 份额×增速",
    shortName: "波士顿 · 组合",
    meetingTag: "年度预算与业务组合会",
    axes: {
      top: "市场增速高",
      bottom: "市场增速低",
      left: "相对份额低",
      right: "相对份额高",
      xLabel: "相对市场份额",
      yLabel: "市场增速",
    },
    collinearAxes: {
      top: "营收规模高",
      bottom: "营收规模低",
      left: "相对份额低",
      right: "相对份额高",
      xLabel: "相对份额",
      yLabel: "营收规模",
    },
    recommendedFocus: ["tr", "br"],
    focusRationales: {
      tr: "高亮右上「明星业务区」：适合增长预算会，明确下一阶段重仓护航的主增长引擎。",
      br: "高亮右下「现金牛区」：适合利润守护会，提醒团队别为了追新而把最稳健的现金来源失守。",
      tl: "高亮左上「问号业务区」：适合赛道押注会，逐一决定哪些高增速低份额项目值得加注、哪些放弃。",
      bl: "高亮左下「瘦狗业务区」：适合业务瘦身会，推动低增速低份额产线的收缩或退出。",
    },
    quadrants: {
      tl: {
        title: "问号业务区",
        icon: "bolt",
        trait: "高增速但份额低",
        detail: "需重金验证能否突围",
        strategy: "策略：精选押注，否则止损",
        dense:
          "所处行业正在快速扩张，但自家产品尚未拿到头部份额，继续跟跑需要持续烧钱补齐渠道与产品短板，管理层必须在限定窗口内判断它能否跃迁为明星业务，切忌平均撒胡椒面。",
      },
      tr: {
        title: "明星业务区",
        icon: "target",
        trait: "高增速且份额高",
        detail: "赛道领跑但仍需资本护城",
        strategy: "策略：持续加码，巩固第一",
        dense:
          "兼具强劲市场需求与领先市场地位，虽然本身已经产生可观营收，但为抵御竞争对手跟进并承接行业红利仍需再投入，一旦行业增速放缓就会顺势沉淀为长期现金牛。",
      },
      bl: {
        title: "瘦狗业务区",
        icon: "ban",
        trait: "低增速且份额低",
        detail: "增长停滞又难摊薄成本",
        strategy: "策略：收缩战线，有序退出",
        dense:
          "市场整体趋于饱和，同时相对规模落后于头部对手，缺乏规模效应导致利润率承压，往往消耗大量管理注意力却难以回正现金流，应避免情感恋战并制定退出或剥离计划。",
      },
      br: {
        title: "现金牛区",
        icon: "ribbon",
        trait: "低增速但份额高",
        detail: "成熟赛道的高利润压舱石",
        strategy: "策略：守稳份额，反哺新星",
        dense:
          "市场增速已经放缓，新进入者意愿低，凭借高相对份额与经验曲线带来丰厚净现金流入；不需要盲目扩张产能，核心任务是保持运营效率，把盈余现金源源不断输血给明星与精选问号。",
      },
    },
    items: [
      { id: "b1", label: "AI 协作助手", orthoX: 0.19, orthoY: 0.39, colX: 0.46, colY: 0.58 },
      { id: "b2", label: "海外轻应用", orthoX: 0.38, orthoY: 0.43, colX: 0.32, colY: 0.74 },
      { id: "b3", label: "云端设计平台", orthoX: 0.66, orthoY: 0.39, colX: 0.85, colY: 0.24 },
      { id: "b4", label: "企业安全套件", orthoX: 0.84, orthoY: 0.43, colX: 0.65, colY: 0.33 },
      { id: "b5", label: "旧版离线插件", orthoX: 0.26, orthoY: 0.88, colX: 0.16, colY: 0.88 },
      { id: "b6", label: "旗舰订阅套件", orthoX: 0.74, orthoY: 0.88, colX: 0.56, colY: 0.43 },
    ],
  },
};

export const SPLIT_MIN = 0.22;
export const SPLIT_MAX = 0.78;
export const SPLIT_SAFE_MIN = 0.38;
export const SPLIT_SAFE_MAX = 0.62;
export const SNAP_CENTER = 0.5;
export const SNAP_RADIUS = 0.028;

export function cloneItemsForScenario(scenarioId, axisMode = "orthogonal") {
  const sc = SCENARIOS[scenarioId] || SCENARIOS.poster;
  return sc.items.map((it) => ({
    id: it.id,
    label: it.label,
    x: axisMode === "collinear" ? it.colX : it.orthoX,
    y: axisMode === "collinear" ? it.colY : it.orthoY,
  }));
}

// 开场刻意设为 0/5 复合坏态：同义假双轴 + 缺方向标 + 门槛右偏 74% + 四格全黄争亮 + 188字密字报表
export function createInitialState(scenarioId = "poster") {
  return {
    scenario: scenarioId,
    axisMode: "collinear", // "orthogonal" | "collinear"
    showAxisLabels: false, // true | false
    splitX: 0.74, // 0.22 .. 0.78，默认右偏把右侧两格挤成 26% 窄条
    splitY: 0.5, // 保持稳定中分，也可随预设微调
    focus: { tl: true, tr: true, bl: true, br: true }, // 4格全黄
    density: "dense", // "dense" | "concise" | "hollow"
    items: cloneItemsForScenario(scenarioId, "collinear"),
    scanActive: false,
    scanElapsed: 0,
    selectedItemId: null,
  };
}

export function applyPreset(state, presetName) {
  const sc = state.scenario;
  if (presetName === "broken") {
    const fresh = createInitialState(sc);
    Object.assign(state, fresh);
    return;
  }
  if (presetName === "poster_gold") {
    state.scenario = "poster";
    state.axisMode = "orthogonal";
    state.showAxisLabels = true;
    state.splitX = 0.5;
    state.splitY = 0.5;
    state.focus = { tl: false, tr: true, bl: false, br: false };
    state.density = "concise";
    state.items = cloneItemsForScenario("poster", "orthogonal");
    return;
  }
  if (presetName === "covey_q2") {
    state.scenario = "poster";
    state.axisMode = "orthogonal";
    state.showAxisLabels = true;
    state.splitX = 0.5;
    state.splitY = 0.5;
    state.focus = { tl: true, tr: false, bl: false, br: false };
    state.density = "concise";
    state.items = cloneItemsForScenario("poster", "orthogonal");
    return;
  }
  if (presetName === "product_quickwin") {
    state.scenario = "product";
    state.axisMode = "orthogonal";
    state.showAxisLabels = true;
    state.splitX = 0.5;
    state.splitY = 0.5;
    state.focus = { tl: true, tr: false, bl: false, br: false };
    state.density = "concise";
    state.items = cloneItemsForScenario("product", "orthogonal");
    return;
  }
  if (presetName === "bcg_star") {
    state.scenario = "bcg";
    state.axisMode = "orthogonal";
    state.showAxisLabels = true;
    state.splitX = 0.5;
    state.splitY = 0.5;
    state.focus = { tl: false, tr: true, bl: false, br: false };
    state.density = "concise";
    state.items = cloneItemsForScenario("bcg", "orthogonal");
    return;
  }
  // 校准当前剧本的标准正交单焦解
  if (presetName === "calibrate_current") {
    const targetFocus = sc === "product" ? "tl" : "tr";
    state.axisMode = "orthogonal";
    state.showAxisLabels = true;
    state.splitX = 0.5;
    state.splitY = 0.5;
    state.focus = { tl: targetFocus === "tl", tr: targetFocus === "tr", bl: false, br: false };
    state.density = "concise";
    state.items = cloneItemsForScenario(sc, "orthogonal");
    return;
  }
  // 反向试错预设（验证双向检错能力）
  if (presetName === "err_collinear") {
    applyPreset(state, "calibrate_current");
    state.axisMode = "collinear";
    state.items = cloneItemsForScenario(state.scenario, "collinear");
    return;
  }
  if (presetName === "err_nofocus") {
    applyPreset(state, "calibrate_current");
    state.focus = { tl: false, tr: false, bl: false, br: false };
    return;
  }
  if (presetName === "err_allfocus") {
    applyPreset(state, "calibrate_current");
    state.focus = { tl: true, tr: true, bl: true, br: true };
    return;
  }
  if (presetName === "err_skew_left") {
    applyPreset(state, "calibrate_current");
    state.splitX = 0.27;
    return;
  }
  if (presetName === "err_hollow") {
    applyPreset(state, "calibrate_current");
    state.density = "hollow";
    return;
  }
  if (presetName === "err_pileup") {
    applyPreset(state, "calibrate_current");
    state.items = state.items.map((it, idx) =>
      idx < 5
        ? { ...it, x: 0.60 + (idx % 3) * 0.13, y: 0.21 + Math.floor(idx / 3) * 0.16 }
        : { ...it, x: 0.26, y: 0.76 }
    );
    return;
  }
}

export function classifyItem(item, splitX, splitY) {
  const right = item.x >= splitX;
  const bottom = item.y >= splitY;
  if (!right && !bottom) return "tl";
  if (right && !bottom) return "tr";
  if (!right && bottom) return "bl";
  return "br";
}

export function cellCharCount(scenarioObj, density) {
  let total = 0;
  for (const q of QUADRANTS) {
    const info = scenarioObj.quadrants[q];
    if (density === "hollow") total += info.title.length;
    else if (density === "concise") total += info.title.length + info.trait.length + info.strategy.length;
    else total += info.title.length + info.dense.length;
  }
  return { total, avg: Math.round(total / 4) };
}

// 单一真源评估：所有画布视觉提示、诊单标题、五项探针与 5 秒扫视结果均源于此
export function evaluate(state) {
  const sc = SCENARIOS[state.scenario] || SCENARIOS.poster;
  const counts = { tl: 0, tr: 0, bl: 0, br: 0 };
  const itemQuadrant = {};

  for (const it of state.items) {
    const q = classifyItem(it, state.splitX, state.splitY);
    counts[q]++;
    itemQuadrant[it.id] = q;
  }

  const leftPct = Math.round(state.splitX * 100);
  const rightPct = 100 - leftPct;
  const focusList = QUADRANTS.filter((q) => state.focus[q]);
  const focusCount = focusList.length;
  const focusEmpty = focusCount === 1 && counts[focusList[0]] === 0;
  const emptyQuadrants = QUADRANTS.filter((q) => counts[q] === 0).length;
  const maxInOne = Math.max(...Object.values(counts));
  const chars = cellCharCount(sc, state.density);

  // 五项原海报支柱实时检测（分类 / 对比 / 象限 / 维度 / 聚焦）
  const dimOk = state.axisMode === "orthogonal" && state.showAxisLabels;
  const quadOk = state.splitX >= SPLIT_SAFE_MIN && state.splitX <= SPLIT_SAFE_MAX;
  const classifyOk = state.axisMode === "orthogonal" && emptyQuadrants <= 1 && maxInOne <= 4;
  const compareOk = state.density === "concise";
  const focusOk = focusCount === 1 && !focusEmpty;

  const pillars = {
    classify: {
      key: "classify",
      zh: "分类",
      posterSub: "按维度分组 · 结构清晰",
      ok: classifyOk,
      badge:
        state.axisMode === "collinear"
          ? `斜线塌陷·空${emptyQuadrants}格`
          : maxInOne >= 5
            ? `单格堆 ${maxInOne}/6`
            : emptyQuadrants >= 2
              ? `空置 ${emptyQuadrants} 格`
              : `${counts.tl}/${counts.tr}/${counts.bl}/${counts.br} 分布`,
    },
    compare: {
      key: "compare",
      zh: "对比",
      posterSub: "同类对照 · 差异明确",
      ok: compareOk,
      badge:
        state.density === "dense"
          ? `密字 ${chars.total} 字`
          : state.density === "hollow"
            ? "空壳缺策略"
            : `精炼 ${chars.avg} 字/格`,
    },
    quadrant: {
      key: "quadrant",
      zh: "象限",
      posterSub: "四象限呈现 · 平衡视角",
      ok: quadOk,
      badge:
        state.splitX < SPLIT_SAFE_MIN
          ? `左偏 ${leftPct}:${rightPct}`
          : state.splitX > SPLIT_SAFE_MAX
            ? `右偏 ${leftPct}:${rightPct}`
            : `均衡 ${leftPct}:${rightPct}`,
    },
    dimension: {
      key: "dimension",
      zh: "维度",
      posterSub: "双轴定位 · 多维思考",
      ok: dimOk,
      badge:
        state.axisMode === "collinear"
          ? "同义假双轴"
          : !state.showAxisLabels
            ? "缺方向极性"
            : `${sc.axes.xLabel}×${sc.axes.yLabel}`,
    },
    focus: {
      key: "focus",
      zh: "聚焦",
      posterSub: "高亮关键区 · 引导决策",
      ok: focusOk,
      badge:
        focusCount === 0
          ? "全蓝无焦点"
          : focusCount > 1
            ? `${focusCount} 格争亮`
            : focusEmpty
              ? "高亮了空区"
              : `锁定·${sc.quadrants[focusList[0]].title.slice(0, 4)}`,
    },
  };

  const score = Object.values(pillars).filter((p) => p.ok).length;

  // 双向收集全部问题（按对观众认知破坏优先级排序）
  const issues = [];
  if (state.axisMode === "collinear") {
    issues.push({
      code: "collinear",
      short: "同义假双轴",
      headline: `「${sc.collinearAxes.xLabel} × ${sc.collinearAxes.yLabel}」说的是一回事，矩阵退化成斜线`,
      why: `两条轴高度正相关时，高价值的事天然也重要，低价值的事也不重要——6 个议题挤向斜对角，另外两格变成空壳，花四格面积只表达了一个维度。`,
      nextStep: `在下方把「坐标维度」切回「正交双轴（${sc.axes.xLabel} × ${sc.axes.yLabel}）」，或直接点画布顶端标红的轴标签。`,
    });
  }
  if (!state.showAxisLabels) {
    issues.push({
      code: "no_labels",
      short: "坐标失向",
      headline: "十字轴四端没有标明「高 / 低」，听众 5 秒猜不出象限含义",
      why: "缺少方向箭头与正负极性时，听众必须先读完四格正文才能反推横纵轴方向，彻底失去了「看位置即知属性」的矩阵红利。",
      nextStep: "把「轴端方向标」打开，在上下左右四端标清高低极性。",
    });
  }
  if (focusCount > 1) {
    issues.push({
      code: "over_focus",
      short: `${focusCount} 格争亮`,
      headline: `${focusCount} 个象限同时涂满信号黄，等于一格也没高亮`,
      why: `黄色高亮靠的是与深钴蓝的面积反差。现在亮区铺开了 ${focusCount}/4 个象限，视觉信号互相抵消，听众根本不知道这场会要先拍板哪一格。`,
      nextStep: "直接点击画布上多余的黄色象限把它关回钴蓝，全页只留 1 个决策焦点区。",
    });
  } else if (focusCount === 0) {
    issues.push({
      code: "no_focus",
      short: "全蓝失焦",
      headline: "四个象限全铺深钴蓝，视野平铺找不到今天的主战场",
      why: "矩阵完成了分类，但没有给出会议立场。观众扫完四格后仍会反问：「所以这一页想让我们优先拍板哪一格？」",
      nextStep: "直接点击画布上最需要优先决策的那 1 个象限，给它涂上信号黄。",
    });
  } else if (focusEmpty) {
    const fq = focusList[0];
    issues.push({
      code: "empty_focus",
      short: "高亮空区",
      headline: `信号黄涂在了「${sc.quadrants[fq].title}」，但里面当前 0 个议题`,
      why: "全场最醒目的视觉焦点里空无一物，听众目光瞬间扑空——要么是门槛划偏了，要么高亮涂错了象限。",
      nextStep: "把相关议题筹码拖进黄色象限，或者改点有议题落位的象限作为主焦点。",
    });
  }
  if (state.splitX < SPLIT_SAFE_MIN) {
    issues.push({
      code: "skew_left",
      short: `门槛偏左 ${leftPct}%`,
      headline: `竖向门槛拖偏到左侧 ${leftPct}%，左侧两格被挤扁变形`,
      why: `左窄右宽（${leftPct}% : ${rightPct}%）破坏了四象限同权对比的视觉基准，还把本属左侧的议题硬划进了右侧。`,
      nextStep: "向右横拖画布中轴（或拉回门槛滑轨到 40%–60% 区间，靠近 50% 会轻轻吸附）。",
    });
  } else if (state.splitX > SPLIT_SAFE_MAX) {
    issues.push({
      code: "skew_right",
      short: `门槛偏右 ${leftPct}%`,
      headline: `竖向门槛偏右到 ${leftPct}%，右侧两格被压扁到仅剩 ${rightPct}% 宽`,
      why: `左侧膨胀到 ${leftPct}% 宽而右侧缩成细条，四象限的平衡视角失效，观众视线也会被严重偏斜的十字线带歪。`,
      nextStep: "向左横拖画布中轴（或拉回门槛滑轨到 50% 附近，让四格恢复均势）。",
    });
  }
  if (state.density === "dense") {
    issues.push({
      code: "dense",
      short: `密字 ${chars.total} 字`,
      headline: `四格塞进 ${chars.total} 字长段小作文，矩阵退化成难读的密集报表`,
      why: `平均每格 ${chars.avg} 字时，听众被迫逐行读句子，无法在 5 秒内完成四象限横向对比——这是演讲矩阵页最常见的超载翻车。`,
      nextStep: "把「格内文案」切到「精炼三行（区名 + 判定 + 策略）」，把展开解释留给口述。",
    });
  } else if (state.density === "hollow") {
    issues.push({
      code: "hollow",
      short: "空壳缺策",
      headline: "每格只剩 4–5 字象限标签，分完类却没有行动策略",
      why: "只写「长期规划区」「低优先区」这类名词，没有给出对应的资源投入与处理策略，矩阵只完成了命名，没能支持决策。",
      nextStep: "把「格内文案」切回「精炼三行」，补上「判定条件 + 策略动作」。",
    });
  }
  if (state.axisMode === "orthogonal" && (maxInOne >= 5 || emptyQuadrants >= 2)) {
    issues.push({
      code: "pileup",
      short: maxInOne >= 5 ? `单格堆 ${maxInOne}/6` : `空置 ${emptyQuadrants} 格`,
      headline:
        maxInOne >= 5
          ? `${maxInOne}/6 个议题全挤在同一个象限，四格分类失去区分度`
          : `有 ${emptyQuadrants} 个象限空无一物，当前分类粒度撑不起四象限`,
      why: "当绝大多数议题落入单一格位，双轴刻度没有真正把选项拉开距离；观众看到的其实是一张藏在框里的单列清单。",
      nextStep: "把扎堆的议题筹码拖散到对应的合理象限，或左右微调判定门槛重新切分。",
    });
  }

  let verdictTag = "矩阵失序";
  let headline = "";
  let why = "";
  let nextStep = "";
  let scanGrade = "迷航";

  if (score === 5) {
    const fq = focusList[0];
    const qInfo = sc.quadrants[fq];
    const isClassic = sc.recommendedFocus.includes(fq);
    verdictTag =
      sc.id === "poster" && fq === "tr"
        ? "原海报典范解"
        : sc.id === "poster" && fq === "tl"
          ? "柯维长期杠杆解"
          : sc.id === "product" && fq === "tl"
            ? "产品左上速赢解"
            : sc.id === "bcg" && fq === "tr"
              ? "波士顿明星解"
              : isClassic
                ? "正交单焦成立"
                : "定制单焦成立";
    headline = `5/5 成立：正交双轴明确，信号黄精准锁死「${qInfo.title}」`;
    why = `${sc.focusRationales[fq]} 四格保持 ${leftPct}:${rightPct} 均势对比，格均 ${chars.avg} 字，听众进页 5 秒内即可顺着坐标读懂取舍。`;
    nextStep = "按 Space 播放 5 秒会议扫视验真，或改点另一格信号黄、换一套剧本体验不同决策重心。";
    scanGrade = "5 秒锁定";
  } else {
    const primary = issues[0];
    verdictTag = primary ? primary.short : "尚待校准";
    headline = primary ? primary.headline : "矩阵仍有结构偏差";
    why = primary ? primary.why : "";
    nextStep = primary ? primary.nextStep : "";
    scanGrade = score >= 3 ? "迟疑跳读" : "视线迷航";
  }

  return {
    scenario: sc,
    counts,
    itemQuadrant,
    leftPct,
    rightPct,
    focusList,
    focusCount,
    focusEmpty,
    emptyQuadrants,
    maxInOne,
    chars,
    pillars,
    score,
    issues,
    verdictTag,
    headline,
    why,
    nextStep,
    scanGrade,
    ok: score === 5,
  };
}

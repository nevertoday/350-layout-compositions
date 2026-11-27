// 单真源时间线幻灯片数据模型（346 时间线页 幻灯片版式）
// 画布坐标、五要素实时探针、白话诊单、右上复古时钟指针与演播光点全部只读此模块算出的同一份结果。

export const AXIS_MODES = {
  slope: {
    id: "slope",
    label: "斜坡攀升",
    en: "ASCENDING S-CURVE",
    note: "承袭 346 原海报左下→右上蜿蜒上升路径，自带「推进与增长」情绪张力。",
  },
  horizontal: {
    id: "horizontal",
    label: "水平进程",
    en: "HORIZONTAL TRACK",
    note: "最符合 16:9 宽屏投影与左到右阅读惯性，适合 3–5 步横向路线图。",
  },
  vertical: {
    id: "vertical",
    label: "纵向阶梯",
    en: "VERTICAL CHRONICLE",
    note: "自上而下或错落分列，适合节点文案稍长或需要左右交替排布的编年页。",
  },
};

export const COPY_MODES = {
  dense: { id: "dense", label: "密字纪要", desc: "单节点 35+ 字，沦为投影文档墙" },
  concise: { id: "concise", label: "简洁聚焦", desc: "短题 + 一句 ≤16 字交付要点" },
  empty: { id: "empty", label: "过空标号", desc: "只留代号没有阶段结论，看不出发生了什么" },
};

export const SCENARIOS = {
  poster: {
    id: "poster",
    name: "原海报 · 产品上线",
    short: "原海报 · 上线",
    slideTitle: "核心产品从启动到上线五阶段路线",
    startContext: "Q1 启动 · 对齐业务目标与 6 人核心小组",
    conclusionText: "清晰的时间线能帮助观众快速理解过程、把握重点、增强说服力。",
    conclusionValue: "5 个里程碑串联 16 周交付，上线首月链路零中断",
    keywords: ["目标清晰", "过程可视", "价值强化"],
    nodes: [
      {
        id: "m1", order: 1, isCore: true, code: "01", time: "第 1 周",
        title: "起点", pill: "核心启动", icon: "flag",
        concise: "项目启动，明确目标，组建核心团队。",
        dense: "在第 1 周项目启动全员会上正式明确季度核心增长目标，组建跨职能核心研发与设计团队并同步资源盘点与排期初稿。",
        empty: "01",
      },
      {
        id: "m2", order: 2, isCore: true, code: "02", time: "第 3 周",
        title: "筹备阶段", pill: "目标定义", icon: "clipboard",
        concise: "完成需求调研，确立项目方向与范围。",
        dense: "历时两周深度访谈一线业务与重点客户完成全量需求调研，整理三十余条需求清单并正式确立项目方向与一期边界范围。",
        empty: "02",
      },
      {
        id: "m3", order: 3, isCore: true, code: "03", time: "第 7 周",
        title: "执行阶段", pill: "方案落地", icon: "search",
        concise: "推进关键任务，分阶段交付成果。",
        dense: "将交互方案与系统架构拆解为双周冲刺节奏，持续推进关键模块研发任务，每周组织评审同步分阶段可运行交付成果。",
        empty: "03",
      },
      {
        id: "m4", order: 4, isCore: true, code: "04", time: "第 12 周",
        title: "验证阶段", pill: "测试优化", icon: "plane",
        concise: "收集反馈，优化方案，确保质量达标。",
        dense: "邀请首批种子用户参与全流程体验走查并回收六十四条反馈意见，逐项修复缺陷与性能瓶颈确保上线前各项指标全部达标。",
        empty: "04",
      },
      {
        id: "m5", order: 5, isCore: true, code: "05", time: "第 16 周",
        title: "上线阶段", pill: "正式发布", icon: "star",
        concise: "产品上线，持续监测，保障稳定运行。",
        dense: "按灰度方案平稳切流完成产品正式上线发布，同步建立全天候告警与业务监测看板，持续追踪稳定性保障长期顺畅运行。",
        empty: "05",
      },
      {
        id: "n1", order: 2.4, isCore: false, code: "杂A", time: "第 4 周",
        title: "整理周报", pill: "琐碎支线", icon: "dot",
        concise: "周五汇总部门例会纪要与考勤记录。",
        dense: "每周五下午例行催收各小组常规工作周报、整理内部会议纪要发送邮件并核对项目群日常行政考勤打卡记录。",
        empty: "S1",
      },
      {
        id: "n2", order: 3.4, isCore: false, code: "杂B", time: "第 9 周",
        title: "改按钮圆角", pill: "琐碎支线", icon: "dot",
        concise: "次要按钮圆角由 4px 微调为 6px。",
        dense: "根据临时讨论意见把设置弹窗里次要辅助按钮的圆角从四像素微调为六像素，并重新导出三张局部切图同步给前端。",
        empty: "S2",
      },
      {
        id: "n3", order: 4.4, isCore: false, code: "杂C", time: "第 14 周",
        title: "网盘归档", pill: "琐碎支线", icon: "dot",
        concise: "把废弃草图打包上传共享网盘目录。",
        dense: "将前期评审阶段已经废弃的十七份旧版线框草图和历史色板文件逐个重命名打包上传至团队共享网盘归档目录。",
        empty: "S3",
      },
    ],
  },
  brand: {
    id: "brand",
    name: "品牌十年 · 关键转折",
    short: "品牌十年",
    slideTitle: "十年五次关键跃迁：从手工作坊到全球百店",
    startContext: "2016 起点 · 杭州 3 人工作室与首台原型机",
    conclusionText: "挑出真正改变命运的五个年份，观众十秒就能记住品牌护城河。",
    conclusionValue: "十年从 3 人作坊走到百城门店，自研结构成为核心壁垒",
    keywords: ["节点精炼", "十年跃迁", "结论收束"],
    nodes: [
      {
        id: "m1", order: 1, isCore: true, code: "2016", time: "2016",
        title: "创始起点", pill: "作坊起步", icon: "flag",
        concise: "三人创立工坊，手工打磨首代原型。",
        dense: "2016 年春季三名创始人租下四十平米旧厂房创立工坊，历时八个月纯手工反复打磨并验证了第一代功能样机原型。",
        empty: "2016",
      },
      {
        id: "m2", order: 2, isCore: true, code: "2018", time: "2018",
        title: "首款量产", pill: "产能突破", icon: "clipboard",
        concise: "建成自有产线，年交付首次破万。",
        dense: "完成首轮种子融资后自建标准化组装产线，攻克关键良率难题，首款旗舰型号推向市场当年即实现年交付量突破一万台。",
        empty: "2018",
      },
      {
        id: "m3", order: 3, isCore: true, code: "2021", time: "2021",
        title: "跨海出海", pill: "全球布局", icon: "search",
        concise: "进入欧洲六国，建立本地售后仓。",
        dense: "通过欧盟安全与环保认证正式登陆欧洲六国零售渠道，在柏林与鹿特丹设立本地备件与售后服务中心缩短履约时效。",
        empty: "2021",
      },
      {
        id: "m4", order: 4, isCore: true, code: "2024", time: "2024",
        title: "自研体系", pill: "技术壁垒", icon: "plane",
        concise: "核心结构获专利，返修率降至一半。",
        dense: "投入三年研发的模块化核心传动结构获得国际专利授权，整机故障率与售后返修成本相比上一代平台整体降低超过一半。",
        empty: "2024",
      },
      {
        id: "m5", order: 5, isCore: true, code: "2026", time: "2026",
        title: "全球百店", pill: "品牌跃升", icon: "star",
        concise: "直营与合作门店覆盖全球百城。",
        dense: "线下体验网络正式跨越全球一百座核心城市节点，直营旗舰空间与精选买手店形成稳定复购闭环并开启新十年计划。",
        empty: "2026",
      },
      {
        id: "n1", order: 2.4, isCore: false, code: "杂A", time: "2019",
        title: "换工牌挂绳", pill: "琐碎支线", icon: "dot",
        concise: "全员更换新版尼龙印字工牌挂绳。",
        dense: "行政部在年中统一采购了一批新的深绿色尼龙材质工牌挂绳并通知全体员工在前台登记签字领取替换旧款塑料卡套。",
        empty: "19B",
      },
      {
        id: "n2", order: 3.4, isCore: false, code: "杂B", time: "2022",
        title: "仓库搬货架", pill: "琐碎支线", icon: "dot",
        concise: "二楼杂物间货架重新编号整理。",
        dense: "物业配合将办公楼二层东侧杂物储藏间的六组旧货架调换朝向并贴上新的纸质标签方便日常存放快递纸箱与宣传页。",
        empty: "22B",
      },
      {
        id: "n3", order: 4.4, isCore: false, code: "杂C", time: "2025",
        title: "调整会议室名", pill: "琐碎支线", icon: "dot",
        concise: "把三间内部会议室改用山峰命名。",
        dense: "品牌组提议把总部原有的三间数字编号会议室统一更名为山峰名称并重新打印亚克力门牌张贴在玻璃隔断外侧。",
        empty: "25B",
      },
    ],
  },
  sprint: {
    id: "sprint",
    name: "季度冲刺 · 12 周交付",
    short: "12 周冲刺",
    slideTitle: "Q3 核心系统重构 12 周里程碑推进图",
    startContext: "W1 起点 · 冻结重构范围与压测目标",
    conclusionText: "以周次顺序对齐跨团队验收节点，汇报时风险与成果一目了然。",
    conclusionValue: "12 周分五步平滑切换，核心接口延迟下降 42%",
    keywords: ["周次有序", "节点可验", "成果落地"],
    nodes: [
      {
        id: "m1", order: 1, isCore: true, code: "W1", time: "第 1 周",
        title: "立项起点", pill: "范围冻结", icon: "flag",
        concise: "对齐业务指标，冻结重构一期边界。",
        dense: "召开跨研发、测试与运维三方立项评审会，明确性能与可用性验收底线，正式冻结本季度一期重构需求边界不再加塞。",
        empty: "W1",
      },
      {
        id: "m2", order: 2, isCore: true, code: "W3", time: "第 3 周",
        title: "原型评审", pill: "架构定稿", icon: "clipboard",
        concise: "核心数据模型与交互原型签字确认。",
        dense: "输出新版高并发数据模型草图与全链路可点击交互原型，组织业务负责人逐页评审并完成架构设计与接口契约签字确认。",
        empty: "W3",
      },
      {
        id: "m3", order: 3, isCore: true, code: "W6", time: "第 6 周",
        title: "核心联调", pill: "主干贯通", icon: "search",
        concise: "主链路跑通真实流量，完成首轮验收。",
        dense: "后端新引擎与前端新界面完成核心读写主链路联调对接，在预发环境回放真实生产流量样本并通过第一轮功能集成验收。",
        empty: "W6",
      },
      {
        id: "m4", order: 4, isCore: true, code: "W9", time: "第 9 周",
        title: "灰度压测", pill: "质量兜底", icon: "plane",
        concise: "千人灰度验证，压测定位三处瓶颈。",
        dense: "面向内部与首批千名真实用户开启灰度放量并执行峰值三倍压力测试，提前定位并消除三处慢查询与缓存抖动隐患。",
        empty: "W9",
      },
      {
        id: "m5", order: 5, isCore: true, code: "W12", time: "第 12 周",
        title: "全量发布", pill: "价值交付", icon: "star",
        concise: "全量切流上线，核心延迟下降四成。",
        dense: "周末低峰期完成百分之百流量无感切换并下线旧集群，上线首周监测核心接口平均响应延迟下降四成且零回滚事故。",
        empty: "W12",
      },
      {
        id: "n1", order: 2.4, isCore: false, code: "杂A", time: "第 4 周",
        title: "清理测试号", pill: "琐碎支线", icon: "dot",
        concise: "批量注销历史遗留的过期测试账号。",
        dense: "安排实习生整理预发环境过去两年遗留的三百多个无效测试账号并按规范批量注销以免测试列表翻页显得过于杂乱。",
        empty: "X1",
      },
      {
        id: "n2", order: 3.4, isCore: false, code: "杂B", time: "第 7 周",
        title: "统一图标命名", pill: "琐碎支线", icon: "dot",
        concise: "将内部图标库文件改为小写短横线。",
        dense: "前端小组利用周五下午将辅助工具栏里四十多个旧图标源文件命名规则从驼峰形式批量重命名为小写字母加短横线。",
        empty: "X2",
      },
      {
        id: "n3", order: 4.4, isCore: false, code: "杂C", time: "第 10 周",
        title: "更新周报模板", pill: "琐碎支线", icon: "dot",
        concise: "微调项目周报文档的表头底色样式。",
        dense: "项目管理同学更新了内部周报共享文档的表格表头配色和字号规范，方便大家下周填写日常进度时保持格式统一。",
        empty: "X3",
      },
    ],
  },
};

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// 生成刻意失守的开场坏态：0/5 五重翻车
// 1. 缺起点锚点 (hasStartAnchor: false)
// 2. 7 节点过载 (5 核心 + 2 支线) + 密字纪要 (copyMode: "dense")
// 3. 验证阶段 (m4) 与执行阶段 (m3) 沿轴位置逆序交叉！
// 4. 节点集中挤团在 0.34–0.61 区间（段距比 > 4x）
// 5. 右下结论卡空缺 (hasConclusion: false)
export function createBrokenState(scenarioId = "poster") {
  const sc = SCENARIOS[scenarioId] || SCENARIOS.poster;
  const activeIds = new Set(["m1", "m2", "m3", "m4", "m5", "n1", "n2"]);
  const brokenPos = {
    m1: 0.11,
    m2: 0.35,
    n1: 0.40,
    m4: 0.46, // 故意排在 m3 前面造成时间逆序折返！
    m3: 0.54,
    n2: 0.59,
    m5: 0.89,
    n3: 0.74,
  };
  return {
    scenarioId: sc.id,
    axis: "slope",
    hasStartAnchor: false,
    hasConclusion: false,
    copyMode: "dense",
    selectedId: "m4",
    playhead: 0, // 0..1 演播进度，同时驱动右上朱红复古时钟指针
    playing: false,
    rhythmTension: 0, // -1..1 通过空白处横拖调节的整体张力微调记录
    nodes: sc.nodes.map((n) => ({
      id: n.id,
      active: activeIds.has(n.id),
      pos: brokenPos[n.id] ?? 0.5,
    })),
  };
}

// 合法多解预设（用于验证与学习，但开场绝不自动跳进去）
export function createPresetState(presetId, scenarioId = "poster") {
  const sc = SCENARIOS[scenarioId] || SCENARIOS.poster;
  const make = (axis, activeList, posList, opts = {}) => {
    const posMap = {};
    activeList.forEach((id, i) => { posMap[id] = posList[i]; });
    return {
      scenarioId: sc.id,
      axis,
      hasStartAnchor: opts.hasStartAnchor ?? true,
      hasConclusion: opts.hasConclusion ?? true,
      copyMode: opts.copyMode ?? "concise",
      selectedId: activeList[0] || "m1",
      playhead: opts.playhead ?? 1,
      playing: false,
      rhythmTension: 0,
      nodes: sc.nodes.map((n, idx) => ({
        id: n.id,
        active: activeList.includes(n.id),
        pos: posMap[n.id] ?? clamp(0.14 + idx * 0.11, 0.1, 0.9),
      })),
    };
  };

  if (presetId === "poster-ideal") {
    return make("slope", ["m1", "m2", "m3", "m4", "m5"], [0.10, 0.30, 0.50, 0.70, 0.90]);
  }
  if (presetId === "horizontal-4") {
    return make("horizontal", ["m1", "m2", "m3", "m5"], [0.12, 0.37, 0.63, 0.88]);
  }
  if (presetId === "vertical-5") {
    return make("vertical", ["m1", "m2", "m3", "m4", "m5"], [0.11, 0.305, 0.50, 0.695, 0.89]);
  }
  // 反向试错预设（用户可一键体验各种典型翻车，验证双向检测）
  if (presetId === "err-too-few") {
    return make("horizontal", ["m1", "m5"], [0.22, 0.78]);
  }
  if (presetId === "err-empty") {
    return make("slope", ["m1", "m2", "m3", "m4", "m5"], [0.10, 0.30, 0.50, 0.70, 0.90], { copyMode: "empty" });
  }
  if (presetId === "err-reverse") {
    return make("slope", ["m1", "m2", "m4", "m3", "m5"], [0.10, 0.30, 0.50, 0.70, 0.90]);
  }
  if (presetId === "err-clump") {
    return make("horizontal", ["m1", "m2", "m3", "m4", "m5"], [0.09, 0.44, 0.50, 0.56, 0.91]);
  }
  if (presetId === "err-no-conclusion") {
    return make("slope", ["m1", "m2", "m3", "m4", "m5"], [0.10, 0.30, 0.50, 0.70, 0.90], { hasConclusion: false });
  }
  return createBrokenState(scenarioId);
}

// 统一将当前激活节点的沿轴坐标拉回理想均匀节奏（不改顺序，方便用户测试）
export function evenSpacingPositions(state) {
  const active = state.nodes
    .filter((n) => n.active)
    .sort((a, b) => a.pos - b.pos);
  const k = active.length;
  if (k === 0) return;
  const start = k <= 3 ? 0.15 : 0.10;
  const end = k <= 3 ? 0.85 : 0.90;
  active.forEach((n, i) => {
    n.pos = k === 1 ? 0.5 : start + ((end - start) * i) / (k - 1);
  });
}

// 统一把节点沿轴排序还原为真实时间先后顺序（保留当前间距或重新排布）
export function fixOrderOnly(state) {
  const sc = SCENARIOS[state.scenarioId];
  const metaMap = new Map(sc.nodes.map((m) => [m.id, m]));
  const active = state.nodes.filter((n) => n.active);
  const sortedPositions = active.map((n) => n.pos).sort((a, b) => a - b);
  const byTime = [...active].sort((a, b) => metaMap.get(a.id).order - metaMap.get(b.id).order);
  byTime.forEach((n, i) => {
    n.pos = sortedPositions[i];
  });
}

// 沿轴几何映射：t ∈ [0, 1] → 16:9 归一化画布坐标 (u, v) ∈ [0, 1]×[0, 1]
// 同时供画布绘制与点击/拖拽拾取使用，保证 100% 几何一致
export function axisPoint(axis, t) {
  const s = clamp(t, 0, 1);
  if (axis === "slope") {
    // 1:1 承袭 346 原海报左下→右上 S 形蜿蜒上升路径
    const u = 0.14 + s * 0.56 + Math.sin(s * Math.PI * 3.2) * 0.028;
    const v = 0.86 - s * 0.72 + Math.cos(s * Math.PI * 3.2) * 0.014;
    return { u, v };
  }
  if (axis === "horizontal") {
    const u = 0.08 + s * 0.84;
    const v = 0.52 + Math.sin(s * Math.PI * 2) * 0.012;
    return { u, v };
  }
  // vertical：自上而下清晰阶梯
  const u = 0.36 + Math.sin(s * Math.PI * 2.5) * 0.018;
  const v = 0.13 + s * 0.76;
  return { u, v };
}

// 把画布上的 (u, v) 投影回最接近的沿轴参数 t ∈ [0.05, 0.95]
export function projectToAxis(axis, u, v) {
  let bestT = 0.5;
  let bestD = Infinity;
  for (let i = 0; i <= 180; i++) {
    const t = 0.05 + (0.90 * i) / 180;
    const p = axisPoint(axis, t);
    const d = Math.hypot((p.u - u) * (16 / 9), p.v - v);
    if (d < bestD) {
      bestD = d;
      bestT = t;
    }
  }
  return clamp(bestT, 0.05, 0.95);
}

// 单真源诊断引擎：从当前状态实时计算全部 5 个维度、双向 10 类错态、扫读负荷与白话诊单
export function evaluateTimeline(state) {
  const sc = SCENARIOS[state.scenarioId] || SCENARIOS.poster;
  const metaMap = new Map(sc.nodes.map((m) => [m.id, m]));

  // 按沿轴物理位置从起点到终点排列激活节点
  const activeNodes = state.nodes
    .filter((n) => n.active)
    .map((n) => {
      const m = metaMap.get(n.id);
      const copy = m[state.copyMode] || m.concise;
      return {
        ...m,
        pos: n.pos,
        active: true,
        copy,
        charCount: copy.replace(/\s+/g, "").length,
        pt: axisPoint(state.axis, n.pos),
      };
    })
    .sort((a, b) => a.pos - b.pos);

  const count = activeNodes.length;
  const noiseCount = activeNodes.filter((n) => !n.isCore).length;
  const totalChars = activeNodes.reduce((s, n) => s + n.charCount, 0);
  const avgChars = count ? Math.round(totalChars / count) : 0;

  // 1. 顺序检测：统计沿轴相邻与全局逆序对
  const reversedPairs = [];
  let inversions = 0;
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      if (activeNodes[i].order > activeNodes[j].order) {
        inversions++;
        if (j === i + 1) {
          reversedPairs.push({ from: activeNodes[i], to: activeNodes[j] });
        }
      }
    }
  }
  // 额外检测：相邻逆序对若全局逆序存在但非相邻，找出第一个折返段
  if (inversions > 0 && reversedPairs.length === 0) {
    for (let i = 0; i < count - 1; i++) {
      if (activeNodes[i].order > activeNodes[i + 1].order) {
        reversedPairs.push({ from: activeNodes[i], to: activeNodes[i + 1] });
      }
    }
  }

  // 2. 节奏与间距实测（完全基于实绘沿轴坐标 pos）
  const gaps = [];
  for (let i = 0; i < count - 1; i++) {
    gaps.push(activeNodes[i + 1].pos - activeNodes[i].pos);
  }
  const minGap = gaps.length ? Math.min(...gaps) : 0;
  const maxGap = gaps.length ? Math.max(...gaps) : 0;
  const spreadRatio = gaps.length ? +(maxGap / Math.max(0.008, minGap)).toFixed(2) : 1;
  const firstPos = count ? activeNodes[0].pos : 0;
  const lastPos = count ? activeNodes[count - 1].pos : 0;
  const edgeCramped = count >= 2 && (firstPos < 0.06 || lastPos > 0.94);
  const bunchedCenter = count >= 2 && (lastPos - firstPos < 0.45);
  const minSafeGap = count >= 6 ? 0.105 : 0.13;
  const hasCollision = gaps.some((g) => g < minSafeGap);

  // 3. 五要素实时判定（对应原海报 5 项）
  const firstIsOrigin = count > 0 && activeNodes[0].order === 1;
  const startOk = state.hasStartAnchor && firstIsOrigin;
  const startStatus = !state.hasStartAnchor
    ? "缺起点锚"
    : !firstIsOrigin
      ? "起点失位"
      : "起点明确";

  const countOk = count >= 3 && count <= 5;
  const copyOk = state.copyMode === "concise";
  const nodesOk = countOk && copyOk;
  const nodesStatus = count >= 6
    ? `过载 ${count} 站`
    : count <= 2
      ? `仅 ${count} 站不成线`
      : state.copyMode === "dense"
        ? `密字 ${totalChars} 字`
        : state.copyMode === "empty"
          ? "过空无义"
          : `${count} 站聚焦`;

  const orderOk = inversions === 0 && count >= 2;
  const orderStatus = inversions > 0 ? `逆序 ${inversions} 处` : "顺叙连贯";

  const rhythmOk = count >= 3 && !hasCollision && !edgeCramped && !bunchedCenter && spreadRatio <= 1.75;
  const rhythmStatus = count < 3
    ? "缺节奏基数"
    : hasCollision
      ? `挤团 ${(minGap * 100).toFixed(0)}%`
      : edgeCramped
        ? "贴边挤压"
        : bunchedCenter
          ? "缩在中段"
          : spreadRatio > 1.75
            ? `疏密 ${spreadRatio}×`
            : `匀称 ${spreadRatio}×`;

  const lastIsFinale = count > 0 && activeNodes[count - 1].order >= 4;
  const conclusionOk = state.hasConclusion && lastIsFinale && inversions === 0;
  const conclusionStatus = !state.hasConclusion
    ? "缺终点结论"
    : inversions > 0
      ? "乱序失焦"
      : !lastIsFinale
        ? "终点未落地"
        : "价值收束";

  const checks = [
    { key: "start", title: "起点", ok: startOk, tag: startStatus },
    { key: "nodes", title: "节点", ok: nodesOk, tag: nodesStatus },
    { key: "order", title: "顺序", ok: orderOk, tag: orderStatus },
    { key: "rhythm", title: "节奏", ok: rhythmOk, tag: rhythmStatus },
    { key: "conclusion", title: "结论", ok: conclusionOk, tag: conclusionStatus },
  ];
  const score = checks.filter((c) => c.ok).length;

  // 4. 扫读时间负荷估算（明确标「示意」：按中文字幕约 4.8 字/秒 + 节点跳转眼动惩罚 + 逆序回扫惩罚）
  const baseSec = totalChars / 4.8 + count * 0.42;
  const penaltySec = inversions * 1.4 + (hasCollision ? 1.1 : 0) + (!state.hasConclusion ? 0.8 : 0);
  const estSeconds = +(baseSec + penaltySec).toFixed(1);
  const loadGrade = score === 5
    ? "一眼顺读（示意）"
    : estSeconds > 14 || inversions > 0
      ? "视线打结（示意）"
      : estSeconds > 8 || !rhythmOk
        ? "阅读偏重（示意）"
        : "还差临门一脚（示意）";

  // 5. 10 类双向问题优先队列 & 白话诊单
  let badge = `${score}/5`;
  let headline = "";
  let body = "";
  let nextStep = "";
  let solutionName = "";

  if (score === 5) {
    if (state.axis === "slope" && count === 5) solutionName = "原海报斜坡攀升解";
    else if (state.axis === "horizontal" && count <= 4) solutionName = "宽屏精简四步解";
    else if (state.axis === "horizontal") solutionName = "宽屏水平进程解";
    else if (state.axis === "vertical") solutionName = "纵向编年阶梯解";
    else solutionName = "清晰时间线合法解";

    badge = `5/5 · ${solutionName}`;
    headline = `${solutionName}成立：${count} 站顺叙推进，观众约 ${estSeconds} 秒扫完`;
    body = `起点背景交代清楚，${count} 个节点按先后顺序以 ${spreadRatio}× 均匀步幅展开，单节点平均 ${avgChars} 字一眼可读，终点收束到结论卡片。按 Space 或点右上时钟试试演播推进感。`;
    nextStep = "你也可以故意拖乱两个节点、点击「+ 增节点」塞到 7 个或切到「过空标号」，反向验证它怎么失守。";
  } else if (inversions > 0) {
    const p = reversedPairs[0];
    badge = `${score}/5 · 逆序交叉`;
    headline = p
      ? `「${p.from.title}」跑到了「${p.to.title}」前面，时间线当场折返`
      : `轴上有 ${inversions} 处先后次序颠倒，逻辑链条断裂`;
    body = "时间线页最核心的视觉契约是「空间位置 = 时间先后」。一旦较晚的阶段抢占较早的位置，观众视线推进到一半被迫倒退回扫，因果感立刻瓦解。";
    nextStep = p
      ? `直接在画布里把「${p.from.title}」往后拖过「${p.to.title}」（或点画布上的赤红折返标签一键对调）。`
      : "拖动错位节点恢复先后顺序，或点画布上的赤红折返标签纠偏。";
  } else if (count >= 6) {
    badge = `${score}/5 · ${count} 站过载`;
    headline = `一页塞进 ${count} 个节点（含 ${noiseCount} 条琐碎支线），节奏彻底挤爆`;
    body = "演讲幻灯片不是流水账明细表。超过 5 个节点后，相邻标签开始争抢空间，观众工作记忆（约 4±1 组块）瞬间溢满，反而记不住真正的关键转折。";
    nextStep = noiseCount > 0
      ? "直接点击画布里带红标的琐碎支线节点把它裁掉（或点右侧「- 裁冗余」压回 3–5 站）。"
      : "点右侧「- 裁冗余」把节点数收到 3–5 站，把其余细项留到口述或下一页。";
  } else if (count <= 2) {
    badge = `${score}/5 · 仅 ${count} 站不成线`;
    headline = `只剩 ${count} 个节点，拉不成「过程」与节奏`;
    body = "两点之间只能连成一根线段，看不出阶段演进与推进节奏；如果真的只有「之前 vs 现在」两步，直接用左右对比页会更有冲击力。";
    nextStep = "点右侧「+ 增节点」把关键里程碑补回 3–5 个。";
  } else if (state.copyMode === "dense") {
    badge = `${score}/5 · 密字 ${totalChars} 字`;
    headline = `单页堆了 ${totalChars} 字（平均 ${avgChars} 字/站），把幻灯片写成了纪要`;
    body = "当每个里程碑塞进三行以上长句，观众会低头逐字读屏幕而不再听你讲，视觉轴线本身也被密密麻麻的段落淹没。";
    nextStep = "把「文案密度」切到「简洁聚焦」，每个节点只保留一个阶段短标和一句 ≤ 16 字的核心动作。";
  } else if (state.copyMode === "empty") {
    badge = `${score}/5 · 过空无义`;
    headline = "只留年份或代号，观众看不出每个节点到底发生了什么";
    body = "精简不是删光信息。去掉所有阶段结果后，轴线退化成空壳装饰，观众离开你的口述就完全读不懂进展。";
    nextStep = "把「文案密度」切回「简洁聚焦」，补上一句精准交付要点。";
  } else if (!rhythmOk) {
    badge = `${score}/5 · ${rhythmStatus}`;
    headline = hasCollision
      ? `相邻节点挤到只剩 ${(minGap * 100).toFixed(0)}% 轴长，视觉节奏挤成一团`
      : edgeCramped
        ? "首尾节点贴死画框边缘，呼吸感与起落缓冲被压瘪"
        : bunchedCenter
          ? "全部节点缩在轴线中段，两头空出大片无效留白"
          : `最大段距是最小段距的 ${spreadRatio} 倍，视觉推进忽快忽慢`;
    body = "时间线的「节奏」来自节点间稳定的留白步幅。一段挤到碰头、另一段空出鸿沟，会让观众误以为空档期停滞或挤团处全都是同一件事。";
    nextStep = "在画布上把挤在一起的节点拖开，或在画布空白处向右横拖拉匀整体步幅（上限 1.75×）。";
  } else if (!startOk) {
    badge = `${score}/5 · ${startStatus}`;
    headline = !state.hasStartAnchor
      ? "没有交代起点与背景，观众一进页不知从何说起"
      : "真正最早的起点阶段被拖离了首位，锚点错位";
    body = "原海报把「起点」列在第一位：观众只有先知道故事从哪一天、什么目标出发，后面的推进才显得有方向、有分量。";
    nextStep = !state.hasStartAnchor
      ? "直接点击画布左下/起端虚线锚点（或点「补起点背景」）把起点交代清楚。"
      : "把最早的起始阶段拖回时间轴起点位置。";
  } else if (!conclusionOk) {
    badge = `${score}/5 · 缺终点结论`;
    headline = "画完了过程却没有终点结论，观众看完只剩一句「然后呢？」";
    body = "过程只是铺垫，结论才是决策者要带走的记忆点。原海报专门在右下角立起一张「结论」卡，用来把整条线的价值一句话钉死。";
    nextStep = "直接点击画布右下角虚线结论框（或点「点亮结论卡」），把最终价值收束出来。";
  }

  return {
    scenario: sc,
    activeNodes,
    count,
    noiseCount,
    totalChars,
    avgChars,
    inversions,
    reversedPairs,
    gaps,
    minGap,
    maxGap,
    spreadRatio,
    hasCollision,
    edgeCramped,
    bunchedCenter,
    checks,
    score,
    estSeconds,
    loadGrade,
    badge,
    headline,
    body,
    nextStep,
    solutionName,
  };
}

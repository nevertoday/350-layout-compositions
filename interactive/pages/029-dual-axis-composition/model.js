// 029 双轴构图 · 单一真源数据与几何评估模型
// 画布与读数、四项原则徽标、底沿蓝带诊单全部只读本模块的 evaluate(state)，绝不写死常量。

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报·几何四区",
    short: "原海报四区",
    quadNames: ["左上 · 主导区", "右上 · 呼应区", "左下 · 辅助区", "右下 · 收束区"],
    focusLabel: "焦点",
  },
  landscape: {
    id: "landscape",
    label: "山海孤帆·风景双轴",
    short: "山海孤帆",
    quadNames: ["左上 · 留白晴空", "右上 · 旭日远峰", "左下 · 静水横波", "右下 · 倒影压舱"],
    focusLabel: "白帆",
  },
  exhibition: {
    id: "exhibition",
    label: "展讯海报·信息编排",
    short: "展讯海报",
    quadNames: ["左上 · 展览主标", "右上 · 策展导语", "左下 · 展期坐标", "右下 · 馆藏主图"],
    focusLabel: "29",
  },
};

export const TONE_WEIGHT = {
  heavy: 1.0,  // 深钴蓝重块
  light: 0.50, // 暖杏纸轻块
  empty: 0.08, // 空置塌陷
};

export const TONE_LABEL = {
  heavy: "重块深蓝",
  light: "轻块暖杏",
  empty: "空置塌陷",
};

export function createInitialState() {
  // 开场刻意处于 0 / 4 翻车态：
  // 1) 垂直轴左挤 24%、水平轴沉底 76%；
  // 2) 两块深蓝重块全堆右侧 (Q2 + Q4)，左右严重右倾；
  // 3) 左下 Q3 空置塌陷，且开启跨轴挤叠；
  // 4) 垂直层级倒置（下重上虚）；
  // 5) 蓝金核心焦点圆脱轴漂移到右上角。
  return {
    theme: "poster",
    axisX: 0.24,
    axisY: 0.76,
    quads: ["light", "heavy", "empty", "heavy"], // [Q1左上, Q2右上, Q3左下, Q4右下]
    hierarchyOrder: "inverted", // "topdown" | "inverted"
    focusMode: "drifted", // "locked" | "drifted" | "hidden"
    focusPos: { u: 0.76, v: 0.28 },
    seamOverflow: true,
    showGuides: true,
    selectedQuad: -1,
  };
}

export function createClassicState(theme = "poster") {
  return {
    theme,
    axisX: 0.50,
    axisY: 0.50,
    quads: ["heavy", "light", "light", "heavy"],
    hierarchyOrder: "topdown",
    focusMode: "locked",
    focusPos: { u: 0.50, v: 0.50 },
    seamOverflow: false,
    showGuides: true,
    selectedQuad: -1,
  };
}

export function createOffsetBalancedState(theme = "poster") {
  // 合法非镜像双轴解：垂直轴左移至 35%，窄侧（35% 宽）以深钴蓝重块承重，宽侧（65% 宽）以暖杏轻块呼吸，左右视觉重量约 52:48（示意）依然均衡
  return {
    theme,
    axisX: 0.35,
    axisY: 0.45,
    quads: ["heavy", "light", "heavy", "light"],
    hierarchyOrder: "topdown",
    focusMode: "locked",
    focusPos: { u: 0.35, v: 0.45 },
    seamOverflow: false,
    showGuides: true,
    selectedQuad: -1,
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 与画布渲染严格共用的四象限矩形计算（全部在 board 坐标系内）
export function computeQuadrantRects(state, board) {
  const gap = Math.max(10, Math.round(Math.min(board.w, board.h) * 0.048));
  const ix = board.x + board.w * state.axisX;
  const iy = board.y + board.h * state.axisY;

  const leftW = Math.max(8, ix - board.x - gap * 0.5);
  const rightW = Math.max(8, board.x + board.w - ix - gap * 0.5);
  const topH = Math.max(8, iy - board.y - gap * 0.5);
  const botH = Math.max(8, board.y + board.h - iy - gap * 0.5);

  const rects = [
    { id: 0, code: "Q1", x: board.x, y: board.y, w: leftW, h: topH },
    { id: 1, code: "Q2", x: ix + gap * 0.5, y: board.y, w: rightW, h: topH },
    { id: 2, code: "Q3", x: board.x, y: iy + gap * 0.5, w: leftW, h: botH },
    { id: 3, code: "Q4", x: ix + gap * 0.5, y: iy + gap * 0.5, w: rightW, h: botH },
  ];
  return { ix, iy, gap, rects };
}

export function evaluate(state) {
  const x = clamp(state.axisX, 0.14, 0.86);
  const y = clamp(state.axisY, 0.14, 0.86);
  const q = state.quads;

  // 1. 四象限几何面积占比（总和 1.0）
  const areas = [
    x * y,             // Q1 左上
    (1 - x) * y,       // Q2 右上
    x * (1 - y),       // Q3 左下
    (1 - x) * (1 - y), // Q4 右下
  ];
  const minArea = Math.min(...areas);
  const maxArea = Math.max(...areas);

  // 2. 视觉重量分布（按实绘象限面积 × 色块密度，示意模型）
  const weights = areas.map((a, i) => a * (TONE_WEIGHT[q[i]] ?? 0.5));
  const leftW = weights[0] + weights[2];
  const rightW = weights[1] + weights[3];
  const topW = weights[0] + weights[1];
  const botW = weights[2] + weights[3];
  const totalW = Math.max(0.0001, leftW + rightW);

  const leftShare = leftW / totalW;
  const rightShare = rightW / totalW;
  const lrDiff = Math.abs(leftShare - rightShare); // 0 = 绝对均等, >0.18 明显倾斜
  const lrDirection = leftShare > rightShare + 0.04 ? "偏左" : rightShare > leftShare + 0.04 ? "偏右" : "均衡";

  const heavyCount = q.filter((t) => t === "heavy").length;
  const lightCount = q.filter((t) => t === "light").length;
  const emptyCount = q.filter((t) => t === "empty").length;

  // 3. 焦点相对双轴交点的偏差距离
  const actualFocus = state.focusMode === "locked" ? { u: x, v: y } : state.focusPos;
  const focusOffset = state.focusMode === "hidden" ? 1 : Math.hypot(actualFocus.u - x, actualFocus.v - y);

  // 4. 逐项检核原海报四大核心原则（每条严格依赖真实状态，支持多解）
  const axisXHealthy = x >= 0.32 && x <= 0.68;
  const axisYHealthy = y >= 0.30 && y <= 0.68;
  const zoneSizeHealthy = minArea >= 0.11;

  // 原则一：层级清晰 HIERARCHY（垂直轴建立由上而下主次）
  const bottomHeavyTrap = q[2] === "heavy" && q[3] === "heavy" && q[0] !== "heavy" && q[1] !== "heavy";
  const allSameTone = (heavyCount === 4 || lightCount === 4 || emptyCount === 4);
  const hierarchyOk =
    state.hierarchyOrder === "topdown" &&
    axisYHealthy &&
    !bottomHeavyTrap &&
    !allSameTone &&
    (q[0] === "heavy" || q[1] === "heavy");

  // 原则二：均衡稳定 BALANCE（水平轴平衡左右视觉重量，支持镜像对角或偏交配重补偿）
  const sameSideHeavy =
    (q[0] === "heavy" && q[2] === "heavy" && q[1] !== "heavy" && q[3] !== "heavy") ||
    (q[1] === "heavy" && q[3] === "heavy" && q[0] !== "heavy" && q[2] !== "heavy");
  const balanceOk =
    axisXHealthy &&
    lrDiff <= 0.18 &&
    !(sameSideHeavy && lrDiff > 0.12) &&
    emptyCount === 0;

  // 原则三：分区有序 ZONING（四区无空洞、无越界撞轴、无挤成狭缝、且有深浅分工）
  const zoningOk =
    axisXHealthy &&
    axisYHealthy &&
    zoneSizeHealthy &&
    emptyCount === 0 &&
    !state.seamOverflow &&
    !allSameTone &&
    heavyCount >= 1 &&
    lightCount >= 1;

  // 原则四：焦点明确 FOCUS（蓝金核心锚稳落双轴交点，且双轴未贴边）
  const focusOk =
    state.focusMode === "locked" &&
    focusOffset < 0.04 &&
    axisXHealthy &&
    axisYHealthy;

  const passed = [hierarchyOk, balanceOk, zoningOk, focusOk].filter(Boolean).length;

  // 5. 诊断优先级（8 类典型双轴错态，只说最紧要的那一个错因与下一步）
  let fault = null;
  if (!axisXHealthy || !axisYHealthy || !zoneSizeHealthy) {
    const edgeWhich =
      x < 0.32 ? `垂直轴挤偏到左 ${Math.round(x * 100)}%` :
      x > 0.68 ? `垂直轴挤偏到右 ${Math.round(x * 100)}%` :
      y < 0.30 ? `水平轴上提至 ${Math.round(y * 100)}%` :
      `水平轴下沉至 ${Math.round(y * 100)}%`;
    fault = {
      code: "axis-edge",
      tag: "错态 · 轴线贴边",
      headline: `${edgeWhich}，最小象限被压到只剩 ${Math.round(minArea * 100)}%`,
      why: "双轴构图靠两条轴切出都能站稳的四个功能区。轴线一旦贴边，靠边那两格会退化成塞不下正文的狭缝，双向骨架当场失去平衡。",
      hint: "在画布上横向拖移垂直轴，再拖底沿水平轴标尺，把交点拉回 34%–66% 的健康双轴带。",
    };
  } else if (emptyCount > 0 || state.seamOverflow) {
    fault = {
      code: emptyCount > 0 ? "zone-empty" : "zone-overflow",
      tag: emptyCount > 0 ? "错态 · 分区空洞" : "错态 · 跨轴撞叠",
      headline: emptyCount > 0
        ? `有 ${emptyCount} 个象限空置塌陷，四区分工出现断档`
        : "模块跨过双轴沟槽挤叠，分区边界被冲乱",
      why: "原海报强调「四区内容各有分工」。空着一块会让对应侧瞬间失重，而模块越过中缝则会把清晰的双轴通道糊成一团。",
      hint: emptyCount > 0
        ? "直接点击画布上带红虚线的空置象限，给它填回暖杏轻块或深蓝重块。"
        : "点击「清净轴缝」把溢出模块收进各自象限内，让十字轴道重新透亮。",
    };
  } else if (allSameTone) {
    fault = {
      code: "all-heavy",
      tag: heavyCount === 4 ? "错态 · 全重窒息" : "错态 · 平权无主",
      headline: heavyCount === 4 ? "四区全铺深钴重块，版面透不过气" : "四区全是同一轻度，看不出主次层级",
      why: "双轴不是把四格涂成一样重。需要用深钴重块立住主角与收束，再用暖杏轻块托住呼应与留白，层级和分区才会同时立起来。",
      hint: "点击画布中任意象限切换深蓝/暖杏，配出 2 深 2 浅（如对角蓝杏）或 1 深 3 浅的呼吸节奏。",
    };
  } else if (!balanceOk) {
    const heavySide = leftShare > rightShare ? "左" : "右";
    fault = {
      code: "balance-tilt",
      tag: "错态 · 左右倾覆",
      headline: `视觉重量约 ${Math.round(leftShare * 100)} : ${Math.round(rightShare * 100)}（示意），整幅画面明显向${heavySide}沉斜`,
      why: "水平轴的核心职责是平衡左右视觉重量。当重色块堆在同一侧，或者垂直轴偏移又缺少深色配重补偿时，人眼会感到画面往重边倾倒。",
      hint: "点击象限把一块深蓝重块换到对角象限，或横拖垂直轴用窄侧深块去抵消宽侧浅块。",
    };
  } else if (!hierarchyOk) {
    fault = {
      code: bottomHeavyTrap ? "bottom-heavy" : "hierarchy-inverted",
      tag: bottomHeavyTrap ? "错态 · 底重头轻" : "错态 · 层级倒置",
      headline: bottomHeavyTrap
        ? "两块深蓝重块全压在水平轴下方，上半区发虚"
        : "上下层级被倒挂，重要内容沉到底部小格",
      why: "垂直轴引导视线由上而下建立阅读顺序。如果上方只有轻飘附注、重量全坠在下方，眼睛进了画面会先往下掉，违背自然阅读层级。",
      hint: state.hierarchyOrder === "inverted"
        ? "点击「层级：倒置」切回「由上而下」，并保证水平轴上方至少有一块深蓝主导区。"
        : "点击左上或右上象限切为深蓝重块，让垂直轴上方先立起主层级。",
    };
  } else if (!focusOk) {
    fault = {
      code: state.focusMode === "hidden" ? "focus-missing" : "focus-drift",
      tag: state.focusMode === "hidden" ? "错态 · 焦点空心" : "错态 · 焦点脱轴",
      headline: state.focusMode === "hidden"
        ? "双轴交汇处空无一物，视线走到中心却无处停泊"
        : `蓝金焦点圆漂离交点 ${Math.round(focusOffset * 100)}%，和双轴骨架打架`,
      why: "两条垂直相交的轴天然把视线汇向交点。若核心视觉元素偏在一旁或彻底缺席，交点就会变成一个和主内容抢戏的空洞。",
      hint: "点击「焦点归交点」把蓝金圆核锚回双轴交汇处（也可拖动交点连带整体调轴）。",
    };
  }

  // 达标模式细分（鼓励多解！）
  let solveLabel = "待立双轴";
  let solveDetail = "";
  if (passed === 4) {
    const isClassicCenter = Math.abs(x - 0.5) <= 0.045 && Math.abs(y - 0.5) <= 0.045;
    const isMirrorDiag = q[1] === "heavy" && q[2] === "heavy" && q[0] === "light" && q[3] === "light";
    if (isClassicCenter && !isMirrorDiag) {
      solveLabel = "双轴成立 · 经典均分";
      solveDetail = "水平与垂直轴稳居画心，对角蓝杏互锁，四区重量与层级高度齐整——这正是 029 原海报的经典标准解。";
    } else if (isClassicCenter && isMirrorDiag) {
      solveLabel = "双轴成立 · 镜像对角";
      solveDetail = "左右镜像翻转为右上×左下深蓝对角，依然严守水平平衡、垂直层级与交点聚焦，证明双轴构图不止一种摆法。";
    } else {
      solveLabel = "双轴成立 · 偏交均衡";
      solveDetail = `交点轻移至 (${Math.round(x * 100)}%, ${Math.round(y * 100)}%)，依靠深蓝重块与暖杏轻块的面积配平稳住左右重量（${Math.round(leftShare * 100)}:${Math.round(rightShare * 100)} 示意），既有秩序又有现代呼吸感。`;
    }
  }

  return {
    x,
    y,
    areas,
    minArea,
    maxArea,
    leftShare,
    rightShare,
    topShare: topW / totalW,
    botShare: botW / totalW,
    lrDiff,
    lrDirection,
    focusOffset,
    heavyCount,
    lightCount,
    emptyCount,
    checks: {
      hierarchy: {
        ok: hierarchyOk,
        short: hierarchyOk ? "由上而下" : bottomHeavyTrap ? "底重头轻" : state.hierarchyOrder === "inverted" ? "层级倒置" : "缺主层级",
      },
      balance: {
        ok: balanceOk,
        short: balanceOk ? `${Math.round(leftShare * 100)}:${Math.round(rightShare * 100)} 稳` : `${Math.round(leftShare * 100)}:${Math.round(rightShare * 100)} ${lrDirection}`,
      },
      zoning: {
        ok: zoningOk,
        short: zoningOk ? `最小区 ${Math.round(minArea * 100)}%` : emptyCount > 0 ? `空置 ${emptyCount} 区` : state.seamOverflow ? "跨轴撞叠" : !zoneSizeHealthy ? "边区挤扁" : "缺深浅分工",
      },
      focus: {
        ok: focusOk,
        short: focusOk ? "稳落交点" : state.focusMode === "hidden" ? "交点空心" : `偏轴 ${Math.round(focusOffset * 100)}%`,
      },
    },
    passed,
    fault,
    solveLabel,
    solveDetail,
    // 原海报四条应用建议的逐条状态映射
    tipsOk: [focusOk, balanceOk, hierarchyOk, zoningOk],
  };
}

// ---------- 第 01 节：四类轴线解剖 ----------
export const AXIS_MODES = {
  horizontal: {
    id: "horizontal",
    label: "仅水平轴",
    en: "HORIZONTAL ONLY",
    link: { id: "021", label: "021 水平构图", href: "https://layout.xiaoxiaodong.ai/021/play/" },
    headline: "横向拉宽并稳住左右，但上下缺少阅读坡度",
    body: "只有水平轴时，画面开阔、宁静、适合表现地平线与舒展景致；可一旦要放多组信息，读者一眼横扫过去，分不清哪块该先看、哪块是补充。",
    metrics: ["宽阔稳度：强", "上下层级：弱", "分区能力：2 带"],
  },
  vertical: {
    id: "vertical",
    label: "仅垂直轴",
    en: "VERTICAL ONLY",
    link: { id: "022", label: "022 垂直构图", href: "https://layout.xiaoxiaodong.ai/022/play/" },
    headline: "纵向立出主次先后，但左右容易失重摇晃",
    body: "只有垂直轴时，标题、导语、正文的上下层级很干脆；但如果画面较宽，单靠一根竖脊难以约束两侧副元素，左右很容易一边挤满、一边发空。",
    metrics: ["宽阔稳度：弱", "上下层级：强", "分区能力：2 列"],
  },
  dual: {
    id: "dual",
    label: "双轴并行（029）",
    en: "DUAL-AXIS FRAMEWORK",
    link: null,
    headline: "横定平衡、纵定层级，交点锁焦点、四区各司其职",
    body: "两条正交轴同时发力：垂直轴管「先看什么后看什么」，水平轴管「左右体量别偏沉」，四个自然象限把复杂信息干净装盘，交汇处正好托起核心视觉。",
    metrics: ["宽阔稳度：强", "上下层级：强", "分区能力：4 象限 + 1 交点"],
  },
  cross: {
    id: "cross",
    label: "区分：十字构图",
    en: "VS. CROSS COMPOSITION",
    link: { id: "030", label: "030 十字构图", href: "https://layout.xiaoxiaodong.ai/030/play/" },
    headline: "双轴是「组织四区的隐形骨架」，十字是「被看见的十字主体」",
    body: "很多人把双轴和十字混为一谈：030 十字构图把横竖相交的实景线条（如窗棂、航迹、光束）直接当作视觉主角；029 双轴构图里轴线往往退为网格缝隙与留白通道，真正的主角是四个有序分区与中心焦点。",
    metrics: ["视觉主角：可见十字形", "四区分工：退为背景角", "更近几何徽标"],
  },
};

// ---------- 第 02 节：交点位置与非对称配重（所有百分比均由 evaluate() 单真源现算，不写死数字） ----------
export const CROSSING_PRESETS = [
  {
    id: "even",
    label: "50 / 50 经典均分",
    axisX: 0.50,
    axisY: 0.50,
    quads: ["heavy", "light", "light", "heavy"],
    verdict: "稳重对称基准",
    note: "四象限面积严格等大，对角两块深钴蓝互锁，最适合展览总览、双语海报与规则象限矩阵。",
  },
  {
    id: "offset-balance",
    label: "35 / 45 窄重宽轻",
    axisX: 0.35,
    axisY: 0.45,
    quads: ["heavy", "light", "heavy", "light"],
    verdict: "非镜像也能稳",
    note: "垂直轴左移让右侧成为大片暖杏呼吸区，而较窄左侧以深钴蓝重块承重，抵消面积差实现杠杆均衡——平衡靠的是视觉重量配平，不是死卡 50%。",
  },
  {
    id: "top-stage",
    label: "50 / 38 顶轻底展",
    axisX: 0.50,
    axisY: 0.38,
    quads: ["heavy", "light", "light", "heavy"],
    verdict: "杂志跨页常用",
    note: "水平轴略微上移，上方承担题头与索引，下方展开大幅图表与说明，垂直节奏拉开，仍保持左右平稳。",
  },
  {
    id: "tilt-trap",
    label: "34 / 50 宽侧堆重（错例）",
    axisX: 0.34,
    axisY: 0.50,
    quads: ["light", "heavy", "light", "heavy"],
    verdict: "双倍右倾翻车",
    note: "较宽的右侧又塞进两块深蓝重块，面积大且色块重，水平轴非但没稳住画面，反而把右坠感放大了一倍。",
  },
];

// ---------- 第 04 节：可核实的双轴谱系 ----------
export const LINEAGE_ITEMS = [
  {
    id: "timgad",
    year: "AD 100",
    title: "提姆加德古城 · 纵横正交街网",
    who: "罗马帝国图拉真时期营建 · 阿尔及利亚",
    summary: "古罗马殖民城市常以南北主轴（Cardo）与东西主轴（Decumanus）垂直相交定下全城骨架，交汇处设广场核心，四方街区井然展开——这正是双轴分区秩序最早的大尺度实物范本。",
    source: "UNESCO 世界遗产名录 #194（1982 年列入）",
    href: "https://whc.unesco.org/en/list/194/",
    diagram: "timgad",
  },
  {
    id: "rotonda",
    year: "1567",
    title: "圆厅别墅 · 双轴穿堂与中央焦点",
    who: "安德烈亚·帕拉第奥（Andrea Palladio）· 维琴察",
    summary: "四面完全一致的门廊引出两条垂直正交的通行轴线，在中央穹顶大厅汇成绝对视觉与空间焦点，把建筑平面严格分成四个平衡象限。",
    source: "UNESCO 世界遗产名录 #712（1994 年列入）",
    href: "https://whc.unesco.org/en/list/712/",
    diagram: "rotonda",
  },
  {
    id: "mondrian",
    year: "1937–1942",
    title: "《黄、蓝、红构图》· 正交动态平衡",
    who: "彼埃·蒙德里安（Piet Mondrian）· 新造型主义",
    summary: "只用纯粹的水平线与垂直线正交切分平面，却放弃机械对折——用小面积高纯度色块去平衡大片素白区域，证明双轴构图不必死守 50/50 镜像也能获得极高稳定感。",
    source: "英国泰特美术馆藏（T00648）",
    href: "https://www.tate.org.uk/art/artworks/mondrian-composition-with-yellow-blue-and-red-t00648",
    diagram: "mondrian",
  },
  {
    id: "grid",
    year: "1981",
    title: "《平面设计中的网格系统》· 双向出版骨架",
    who: "约瑟夫·米勒-布罗克曼（Josef Müller-Brockmann）",
    summary: "瑞士国际主义排版把垂直分栏（管横向对齐与平衡）和水平行带（管垂直层级与节奏）合编为系统网格，让海量图文在双轴坐标上瞬间各归其位。",
    source: "Verlag Niggli 首版（1981）",
    href: "https://niggli.ch/en/products/rastersysteme-fur-die-visuelle-gestaltung",
    diagram: "grid",
  },
  {
    id: "arnheim",
    year: "1982 / 1988",
    title: "《中心的力量》· 中心焦点 × 笛卡尔轴网",
    who: "鲁道夫·阿恩海姆（Rudolf Arnheim）",
    summary: "阿恩海姆系统阐明：人类看构图时同时依赖两套空间感知系统——向中心聚拢的「焦点系统」与受重力支配的「水平—垂直笛卡尔轴网」。双轴构图正是这两套力量的直接会师。",
    source: "加州大学出版社（1982 首版 / 1988 修订版）",
    href: "https://www.ucpress.edu/book/9780520261266/the-power-of-the-center",
    diagram: "arnheim",
  },
];

// ---------- 第 05 节：四类真实版面分工 ----------
export const SCENE_CASES = [
  {
    id: "exhibition",
    label: "美术馆展讯海报",
    badTitle: "失序混排：标题、展期、主图挤在同侧",
    badNote: "字图贴成一团，水平左右倾倒，读完标题还要满屏找时间地点。",
    goodTitle: "双轴分工：左上大标 / 右上导语 / 左下展期 / 右下藏品",
    goodNote: "垂直轴把标题和展期压出清晰先后，水平轴用右下主图托平左上大标，中心交点放一枚高纯度展期徽章。",
    qRoles: ["大标主视觉", "双语策展语", "时间与馆址", "藏品摄影区"],
  },
  {
    id: "matrix",
    label: "决策四象限图谱",
    badTitle: "失序混排：无中心原点、四区名称混叠",
    badNote: "重要度与紧急度没有清晰横纵标尺，条目飘在缝线上分不清归属。",
    goodTitle: "双轴分工：纵轴管优先级 / 横轴管投入度 / 交点立基线",
    goodNote: "垂直轴直指高层级，水平轴横向拉开对比，四象限结论一眼落位、极易记忆。",
    qRoles: ["高价值速赢", "核心战略项", "日常维护项", "低效待删减"],
  },
  {
    id: "editorial",
    label: "专题杂志跨页",
    badTitle: "失序混排：通栏长文撞大照、装订缝吃字",
    badNote: "跨页装订中缝正好劈断正文，上半页空洞、下半页塞爆。",
    goodTitle: "双轴分工：装订缝即垂直轴 / 引语带即水平轴",
    goodNote: "顺势借跨页中缝作天然垂直轴，再以一条水平引语带贯通两页，左上主图配右下正文对角配重，整张跨页稳而不板。",
    qRoles: ["跨页主摄影", "专题题头导言", "图注与年表", "双栏深度正文"],
  },
  {
    id: "photo",
    label: "山海风光与静物",
    badTitle: "失序混排：水际线倾斜、孤帆偏在杂乱边缘",
    badNote: "地平线歪斜让人眩晕，主体离开山脊倒影竖轴，画面散架。",
    goodTitle: "双轴分工：水平水际线稳幅 / 竖向山帆倒影定心",
    goodNote: "就像 029 原海报右上插画：平静水面构成水平轴拓展宽阔感，白帆与其倒影对齐山峰竖轴，交点处视觉瞬间安定。",
    qRoles: ["开阔浅晴空", "明黄旭日点睛", "平静水平波光", "深蓝山影压舱"],
  },
];

// ---------- 第 06 节：什么时候别用双轴 ----------
export const ANTI_CASES = [
  {
    id: "speed",
    title: "要速度、冲击与失重感",
    why: "水平与垂直正交天生代表重力、安定与秩序。强行把飙车、跳跃或冲突场面锁进双轴四格，动能会被立刻掐灭。",
    instead: "改用斜切动势：",
    links: [
      { label: "023 对角线构图", href: "https://layout.xiaoxiaodong.ai/023/play/" },
      { label: "025 汇聚线构图", href: "https://layout.xiaoxiaodong.ai/025/play/" },
    ],
    kind: "speed",
  },
  {
    id: "tiny",
    title: "极窄竖屏或微型图标卡",
    why: "当容器宽不到 200px 或信息只有一句话时，硬切水平+垂直四象限会把版面剁成四块读不清的碎豆腐干。",
    instead: "改用单点或单轴：",
    links: [
      { label: "016 居中构图", href: "https://layout.xiaoxiaodong.ai/016/play/" },
      { label: "022 垂直构图", href: "https://layout.xiaoxiaodong.ai/022/play/" },
    ],
    kind: "tiny",
  },
  {
    id: "poetic",
    title: "孤寂留白与悬念叙事",
    why: "四区都有分工且交点锁稳时，画面理性而饱满；如果你需要一大片空旷来烘托孤独或视线远望，双轴反而显得太满太工整。",
    instead: "改用偏置张力：",
    links: [
      { label: "017 偏心构图", href: "https://layout.xiaoxiaodong.ai/017/play/" },
      { label: "028 偏轴构图", href: "https://layout.xiaoxiaodong.ai/028/play/" },
    ],
    kind: "poetic",
  },
  {
    id: "scroll",
    title: "绵长连续的时间轴或长卷",
    why: "在连续横向推进的画卷或流程里，居中劈下一条垂直轴等于把连贯动线拦腰斩断，视线被迫停顿。",
    instead: "改用顺流延展：",
    links: [
      { label: "021 水平构图", href: "https://layout.xiaoxiaodong.ai/021/play/" },
      { label: "024 平行线构图", href: "https://layout.xiaoxiaodong.ai/024/play/" },
    ],
    kind: "scroll",
  },
];

// ---------- 第 07 节：两道严格单变量盲测练习 ----------
export const QUIZZES = [
  {
    id: "q1",
    index: "题 01",
    variable: "唯一变量：四象限深浅重量排布（轴线均锁定 50% / 50%，焦点均在正交中心）",
    prompt: "四张版面拥有完全相同的居中双轴与蓝金焦点，只改变了深钴蓝重块放在哪几个象限。哪一张同时满足「层级由上而下」与「水平左右平衡」？",
    answer: "C",
    options: [
      {
        key: "A",
        axisX: 0.5, axisY: 0.5,
        quads: ["heavy", "light", "heavy", "light"],
        focusMode: "locked",
        feedback: "方案 A 把两块深蓝重块全堆在左侧（左上 + 左下），左右配重比歪到约 67:33（示意），水平轴明显向左沉斜。",
      },
      {
        key: "B",
        axisX: 0.5, axisY: 0.5,
        quads: ["light", "light", "heavy", "heavy"],
        focusMode: "locked",
        feedback: "方案 B 虽然左右对称，但两块深蓝全压在水平轴下方，上半区发虚、底重头轻，破坏了垂直轴由上而下的层级引导。",
      },
      {
        key: "C",
        axisX: 0.5, axisY: 0.5,
        quads: ["heavy", "light", "light", "heavy"],
        focusMode: "locked",
        feedback: "正确！方案 C 采用原海报经典的对角互锁（左上深蓝立起主层级、右下深蓝稳住对角收束，右上与左下以暖杏轻块呼吸），左右严格 50:50 均衡，四区主次一眼分明。",
      },
      {
        key: "D",
        axisX: 0.5, axisY: 0.5,
        quads: ["heavy", "heavy", "heavy", "heavy"],
        focusMode: "locked",
        feedback: "方案 D 四区全铺深蓝重块，失去深浅对比与呼吸留白，眼睛分不清哪一格先看、哪一格退居辅助。",
      },
    ],
  },
  {
    id: "q2",
    index: "题 02",
    variable: "唯一变量：双轴交点位置与核心焦点落位（四区全部固定为对角蓝杏配重）",
    prompt: "四张版面都用了对角蓝杏配重，只改变了两条轴的交点位置和蓝金焦点圆的落点。哪一张构图成立？",
    answer: "D",
    options: [
      {
        key: "A",
        axisX: 0.5, axisY: 0.5,
        quads: ["heavy", "light", "light", "heavy"],
        focusMode: "drifted",
        focusPos: { u: 0.77, v: 0.25 },
        feedback: "方案 A 的轴线本身工整，但蓝金焦点圆漂到了右上角，把双轴交点留成空洞，视觉重心与正交骨架彼此拉扯。",
      },
      {
        key: "B",
        axisX: 0.19, axisY: 0.79,
        quads: ["heavy", "light", "light", "heavy"],
        focusMode: "locked",
        feedback: "方案 B 的双轴贴边挤成 19% / 79%，左下最小象限被压到只剩约 4% 面积，四区分工彻底失效。",
      },
      {
        key: "C",
        axisX: 0.5, axisY: 0.5,
        quads: ["heavy", "light", "light", "heavy"],
        focusMode: "hidden",
        feedback: "方案 C 撤掉了交点处的视觉核心，两条轴在正中划出空心十字，注意力落不到具体焦点上。",
      },
      {
        key: "D",
        axisX: 0.46, axisY: 0.47,
        quads: ["heavy", "light", "light", "heavy"],
        focusMode: "locked",
        feedback: "正确！双轴构图不必机械锁死 50.0%：方案 D 将交点轻移至 46% / 47%，四区面积依然健康、左右重量近乎齐平，且蓝金焦点稳稳锚在交汇点，兼得秩序与灵动。",
      },
    ],
  },
];

// 同小类其余 14 个编号（只在一句话处互链，不重讲它们的重点）
export const SIBLINGS = [
  { id: "016", name: "居中构图" },
  { id: "017", name: "偏心构图" },
  { id: "018", name: "对称构图" },
  { id: "019", name: "非对称构图" },
  { id: "020", name: "镜像构图" },
  { id: "021", name: "水平构图" },
  { id: "022", name: "垂直构图" },
  { id: "023", name: "对角线构图" },
  { id: "024", name: "平行线构图" },
  { id: "025", name: "汇聚线构图" },
  { id: "026", name: "交叉线构图" },
  { id: "027", name: "中轴构图" },
  { id: "028", name: "偏轴构图" },
  { id: "030", name: "十字构图" },
];

// 030 十字构图 · 单真源几何状态与视觉物理评判模型
// 页面所有画布绘制、四角注记、底带三图解与白话诊单均直接读取 evaluate(state)，绝不另写常量。

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报蓝图",
    en: "POSTER BLUEPRINT",
    coreName: "中心黑核",
    armNames: { N: "上臂标点", S: "下臂标点", W: "左臂标点", E: "右臂标点" },
  },
  atrium: {
    id: "atrium",
    label: "天窗中庭",
    en: "DOME ATRIUM",
    coreName: "穹顶圆井",
    armNames: { N: "北廊列柱", S: "南廊列柱", W: "西廊入口", E: "东廊展台" },
  },
  crossing: {
    id: "crossing",
    label: "城市十字",
    en: "URBAN CROSSING",
    coreName: "中心广场",
    armNames: { N: "北向主道", S: "南向主道", W: "西街广场", E: "东街地标" },
  },
};

// 经验参考阈值（界面和正文均注明为经验参考带）
export const LIMITS = {
  angleTol: 2.0,          // 正交允许容差 ±2°
  coreDistTol: 0.045,     // 黑核距交汇点允许偏差（按画幅比例）
  coreScaleMin: 0.15,     // 核径下限（占短边）
  coreScaleMax: 0.29,     // 核径上限（占短边）
  reachMin: 0.78,         // 轴臂延伸度下限
  hubYMin: 0.44,          // 交汇中心高度上限（略上提 6% 以内）
  hubYMax: 0.53,          // 交汇中心高度下限
  nodeInnerMin: 0.34,     // 次要节点距心下限（避开核心呼吸圈）
  nodeOuterMax: 0.87,     // 次要节点距心上限（避免贴边漏出）
  lrImbalanceMax: 0.16,   // 左右臂力矩允许偏差（示意）
};

export function createBrokenState(theme = "poster") {
  return {
    theme,
    angle: 19,               // 翻车①：轴斜 +19°，滑向斜交失稳
    hubY: 0.50,              // 几何中心（也可调到 0.47 光学微提）
    core: { u: 0.26, v: 0.66 }, // 翻车②：主核脱位左下象限，交汇处空心且各尺寸均不遮挡四臂槽位与角注
    coreScale: 0.21,         // 主核尺度适中（用户可主动压测过小/过大）
    reach: 0.50,             // 翻车③：四轴短截成孤立小加号
    clutter: [
      { id: 0, active: true, dx: -0.11, dy: -0.09, label: "多余注签" },
      { id: 1, active: true, dx: 0.11, dy: 0.09, label: "多余徽块" },
    ],
    nodes: {
      N: { active: true, r: 0.72, w: 1.35 },
      S: { active: false, r: 0.74, w: 1.00 },
      W: { active: false, r: 0.74, w: 1.00 },
      E: { active: true, r: 0.76, w: 1.40 },
    },
    guides: true,
    highlight: null,
    selectedArm: "E",
  };
}

export const PRESETS = {
  broken: (theme) => createBrokenState(theme),
  classic: (theme = "poster") => ({
    theme,
    angle: 0,
    hubY: 0.50,
    core: { u: 0.50, v: 0.50 },
    coreScale: 0.22,
    reach: 0.96,
    clutter: [
      { id: 0, active: false, dx: -0.11, dy: 0.09, label: "多余注签" },
      { id: 1, active: false, dx: 0.11, dy: -0.09, label: "多余徽块" },
    ],
    nodes: {
      N: { active: true, r: 0.58, w: 0.95 },
      S: { active: true, r: 0.62, w: 1.05 },
      W: { active: true, r: 0.60, w: 1.00 },
      E: { active: true, r: 0.60, w: 1.00 },
    },
    guides: true,
    highlight: null,
    selectedArm: "E",
  }),
  lever: (theme = "poster") => ({
    theme,
    angle: 0,
    hubY: 0.47,              // 光学微提 3%
    core: { u: 0.50, v: 0.47 },
    coreScale: 0.23,
    reach: 0.98,
    clutter: [
      { id: 0, active: false, dx: -0.11, dy: 0.09, label: "多余注签" },
      { id: 1, active: false, dx: 0.11, dy: -0.09, label: "多余徽块" },
    ],
    // 远轻近重杠杆配平：左臂近重 (0.48 × 1.32 ≈ 0.634) vs 右臂远轻 (0.76 × 0.84 ≈ 0.638)
    nodes: {
      N: { active: true, r: 0.54, w: 0.90 },
      S: { active: true, r: 0.66, w: 1.05 },
      W: { active: true, r: 0.48, w: 1.32 },
      E: { active: true, r: 0.76, w: 0.84 },
    },
    guides: true,
    highlight: null,
    selectedArm: "E",
  }),
};

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// 将某条臂的节点沿当前轴角换算为画布归一化坐标 (0..1)
// 画布可能是宽幅矩形，因此按画布像素宽/高在渲染时精确换算；模型中以标准半径 0..1 表征距心到画幅边缘的比例。
export function armMoment(node) {
  return node && node.active ? node.r * node.w : 0;
}

export function evaluate(state) {
  const angleAbs = Math.abs(state.angle);
  const coreDist = Math.hypot(state.core.u - 0.5, state.core.v - state.hubY);
  const clutterActive = state.clutter.filter((c) => c.active);
  const clutterCount = clutterActive.length;

  const arms = state.nodes;
  const activeKeys = Object.keys(arms).filter((k) => arms[k].active);
  const activeCount = activeKeys.length;

  const mN = armMoment(arms.N);
  const mS = armMoment(arms.S);
  const mW = armMoment(arms.W);
  const mE = armMoment(arms.E);

  const maxLR = Math.max(mW, mE);
  const lrDiff = maxLR > 0.01 ? Math.abs(mE - mW) / maxLR : 1;
  const lrSigned = maxLR > 0.01 ? (mE - mW) / maxLR : 0; // >0 偏右，<0 偏左

  const maxTB = Math.max(mN, mS);
  const tbSigned = maxTB > 0.01 ? (mS - mN) / maxTB : 0; // >0 下稳，<0 上重

  const tooCloseArms = activeKeys.filter((k) => arms[k].r < LIMITS.nodeInnerMin);
  const edgeLeakArms = activeKeys.filter((k) => arms[k].r > LIMITS.nodeOuterMax);
  const hasTooClose = tooCloseArms.length > 0;
  const hasEdgeLeak = edgeLeakArms.length > 0;

  const coreHollow = coreDist > LIMITS.coreDistTol || state.coreScale < LIMITS.coreScaleMin;
  const coreBloat = state.coreScale > LIMITS.coreScaleMax;
  const skewed = angleAbs > LIMITS.angleTol;
  const hubOff = state.hubY < LIMITS.hubYMin || state.hubY > LIMITS.hubYMax;
  const stubbed = state.reach < LIMITS.reachMin;
  const topHeavy = mN > mS * 1.28 + 0.14;
  const bottomDrop = mS > mN * 2.5 + 0.45;
  const lrUnbalanced = activeCount < 2 || (mW < 0.01 && mE < 0.01) || lrDiff > LIMITS.lrImbalanceMax;

  // 四项核心检核（对应 030 原海报四角圆徽）
  const focusOk = !coreHollow && !coreBloat && clutterCount === 0 && !hasTooClose;
  const directionOk = !stubbed && activeCount >= 2 && !hasTooClose && !hasEdgeLeak;
  const stabilityOk = !skewed && !hubOff;
  const tensionOk = activeCount >= 2 && !lrUnbalanced && !topHeavy && !bottomDrop && !hasEdgeLeak;

  const score = [focusOk, directionOk, stabilityOk, tensionOk].filter(Boolean).length;

  // 判断解法风味（全部 4/4 时区分多组合法解）
  const isLeverStyle =
    arms.W.active &&
    arms.E.active &&
    Math.abs(arms.W.w - arms.E.w) >= 0.22 &&
    Math.abs(arms.W.r - arms.E.r) >= 0.12 &&
    lrDiff <= LIMITS.lrImbalanceMax;
  const isOpticalLift = state.hubY <= 0.485 && state.hubY >= LIMITS.hubYMin;

  // 8 类失误按教学影响优先级诊断
  let flaw = null;
  if (skewed) {
    flaw = {
      code: "skew",
      tag: "错态 · 轴斜失稳",
      title: `主轴歪斜了 ${state.angle > 0 ? "+" : ""}${Math.round(state.angle)}°，稳定框架正在瓦解`,
      why: "十字构图靠 90° 水平垂直呼应重力直觉。轴线一歪，画面立刻失去建筑般的安定感，既不够稳重，又不如斜向交叉线干脆。",
      action: "在画布空白区左右横拖（或按 ← / →），把十字轴掰回 0° 水平垂直正交。",
    };
  } else if (coreHollow) {
    flaw = {
      code: "hollow",
      tag: "错态 · 交汇空心",
      title:
        state.coreScale < LIMITS.coreScaleMin
          ? `中心黑核缩到 ${Math.round(state.coreScale * 100)}%，镇不住交汇点`
          : `核心偏离交汇处 ${Math.round(coreDist * 100)}%，十字中心空了`,
      why: "两条主轴交汇会产生全画最强的视觉引力。核心躲在一旁或太细弱，视线沿轴冲到正中却扑了个空，焦点立刻散掉。",
      action:
        state.coreScale < LIMITS.coreScaleMin
          ? "把下方「核径」调回 16%–28% 经验带，让主视觉牢牢压住交汇处。"
          : "直接拖动黑色大圆核回到十字正中，靠近交汇点时会自动轻柔吸合。",
    };
  } else if (coreBloat) {
    flaw = {
      code: "bloat",
      tag: "错态 · 核膨吞臂",
      title: `中心黑核涨到 ${Math.round(state.coreScale * 100)}%，把十字骨架吃掉了`,
      why: "主核过大盖死了交汇口和内臂过渡，四条轴变成几截短短的尾巴，十字构图退化成了单纯的大圆居中，延伸感全无。",
      action: "把「核径」收回到 16%–28% 经验带，让冰蓝光晕与四条轴臂重新透出来。",
    };
  } else if (stubbed) {
    flaw = {
      code: "stub",
      tag: "错态 · 短截孤号",
      title: `轴臂只伸出 ${Math.round(state.reach * 100)}%，断成孤立的「+」符号`,
      why: "十字构图的引导力来自四臂贯通画幅并自然羽化。轴线半路截断，眼睛到头就被迫折回，整幅画僵成贴在纸中央的一枚小徽章。",
      action: "把「轴臂延伸」推到 78% 以上（接近原海报 96%），让视线沿四臂自然外扩。",
    };
  } else if (clutterCount > 0 || hasTooClose) {
    flaw = {
      code: "crowded",
      tag: "错态 · 轴心拥堵",
      title:
        clutterCount > 0
          ? `交汇环里塞了 ${clutterCount} 块杂物，焦点喘不过气`
          : `次要标点贴核太近（${Math.round(Math.min(...tooCloseArms.map((k) => arms[k].r)) * 100)}%），挤死中心留白`,
      why: "原海报特意在黑核外围留出一圈白环与冰蓝光晕。杂块或次要节点紧压交汇口，会把主次糊成一团，失去「保持留白与节奏」的呼吸感。",
      action:
        clutterCount > 0
          ? "直接点击画布中心红框杂块（或按「清杂块」），把交汇呼吸圈腾干净。"
          : "沿着轴臂把靠得太近的节点往外拖到 40%–82% 臂段，给主核让出白环呼吸。",
    };
  } else if (hasEdgeLeak) {
    flaw = {
      code: "edge",
      tag: "错态 · 贴边漏出",
      title: `次要标点被推到 ${Math.round(Math.max(...edgeLeakArms.map((k) => arms[k].r)) * 100)}% 臂端，视线顺轴滑出画框`,
      why: "元素紧贴边线会被画框边缘吸走，不再与中心黑核对话，四臂引导反倒变成了把观众眼球送出画外的滑梯。",
      action: "把贴边的臂节点往中心拉回 42%–82% 臂段，让它既借轴外延又回扣中心。",
    };
  } else if (hubOff) {
    flaw = {
      code: "huboff",
      tag: "错态 · 交汇失位",
      title: state.hubY < LIMITS.hubYMin ? "横轴提得过高，上臂被压扁" : "横轴沉得过低，画面发坠",
      why: "十字交汇允许比几何中点微提 2%–5% 来抵消视觉下沉感，但偏得太远就会打破四臂比例，滑向偏轴或单边分割。",
      action: "把交汇纵位切回「几何居中 50%」或「光学微提 47%」。",
    };
  } else if (topHeavy) {
    flaw = {
      code: "topheavy",
      tag: "错态 · 顶重脚轻",
      title: "上臂挂重、下臂偏空，整副十字架发飘",
      why: "重力直觉让我们习惯底部承重。上臂力矩明显大于下臂时，十字架像倒立的钟摆，怎么看都不踏实。",
      action: "点亮并沿下臂拖出配重节点（或把上臂节点往里收轻），让下臂稳稳托住上臂。",
    };
  } else if (lrUnbalanced || bottomDrop) {
    const side = lrSigned > 0.05 ? "右侧" : lrSigned < -0.05 ? "左侧" : "单侧";
    flaw = {
      code: "tilt",
      tag: "错态 · 单臂倾覆",
      title:
        activeCount < 2
          ? "四臂几乎全空，缺少次要元素的张力呼应"
          : `左右臂力矩差 ${Math.round(lrDiff * 100)}%（示意），重心朝${side}歪倒`,
      why: "只把信息堆在一条臂上，水平横梁就像一头挂满砝码的跷跷板。哪怕主核在正中，整张版面依然会向重侧倾倒。",
      action: "开启空置的对侧轴臂并沿臂拖移节点，可用等距对称，也可用「近重配远轻」拉平左右力矩。",
    };
  }

  let verdict;
  if (score === 4) {
    let styleTag = "达标 · 经典正交解";
    let title = "四臂稳正、核芯通透，十字框架完全立住了";
    let why =
      "横竖主轴严格 90° 正交，黑核稳锁交汇点且外围留白干净，四臂向外渐隐并彼此配平。如果想进一步破除工整感，可试试用一近重配一远轻的「杠杆张力解」。";
    if (isLeverStyle && isOpticalLift) {
      styleTag = "达标 · 杠杆张力 × 光学微提解";
      title = "横轴微提 3% 且左右「近重配远轻」，稳中带活";
      why =
        "交汇点落在人眼最舒展的光学中心，左右臂不靠机械等距，而是用距离换重量拉平力矩——既守住十字的端庄秩序，又保有鲜明的阅读节奏。";
    } else if (isLeverStyle) {
      styleTag = "达标 · 杠杆张力解";
      title = "左右臂以「近重配远轻」达成非对称等矩平衡";
      why =
        "十字构图不必僵成死对称。左近重块与右远轻点绕中心黑核形成力矩对冲，既有建筑般的结构稳固，又自带呼吸张力。";
    } else if (isOpticalLift) {
      styleTag = "达标 · 光学微提解";
      title = "交汇点略上提至光学中心，比纯几何中点更挺拔";
      why =
        "人眼看绝对 50% 中点常会觉得微微下坠；把横轴轻提 2%–5%（经验值），整副十字架既端正安稳，又透出向上托举的精气神。";
    }
    verdict = {
      ok: true,
      tag: styleTag,
      title,
      why,
      action: "你可以继续压测：故意推斜轴角、放大黑核、或单边移走节点，观察四项读数如何立刻预警。",
    };
  } else {
    verdict = {
      ok: false,
      ...(flaw || {
        code: "pending",
        tag: "待校十字",
        title: "尚有维度未落入稳定带",
        why: "继续微调轴角、核位与四臂配重，让四枚结构徽标全部校准。",
        action: "观察标红的角注，对应在画布上拖移校准。",
      }),
    };
  }

  // 四角注记状态（对应原海报左上/右上/左下/右下）
  const corners = {
    focus: {
      ok: focusOk,
      badge: coreHollow
        ? `偏核 ${Math.round(coreDist * 100)}%`
        : coreBloat
          ? `过胀 ${Math.round(state.coreScale * 100)}%`
          : clutterCount > 0
            ? `杂块 ${clutterCount}`
            : hasTooClose
              ? "靠核过紧"
              : "锚定清晰",
    },
    direction: {
      ok: directionOk,
      badge: stubbed
        ? `短截 ${Math.round(state.reach * 100)}%`
        : hasEdgeLeak
          ? "贴边漏出"
          : hasTooClose
            ? "内挤无延"
            : activeCount < 2
              ? "臂空无引"
              : `贯通 ${Math.round(state.reach * 100)}%`,
    },
    stability: {
      ok: stabilityOk,
      badge: skewed
        ? `倾角 ${state.angle > 0 ? "+" : ""}${Math.round(state.angle)}°`
        : hubOff
          ? `纵位 ${Math.round(state.hubY * 100)}%`
          : isOpticalLift
            ? "90° · 微提"
            : "90° 正交",
    },
    tension: {
      ok: tensionOk,
      badge: topHeavy
        ? "顶重脚轻"
        : lrUnbalanced
          ? `差 ${Math.round(lrDiff * 100)}% ${lrSigned >= 0 ? "偏右" : "偏左"}`
          : hasEdgeLeak
            ? "端拉失衡"
            : isLeverStyle
              ? "杠杆张力"
              : "四臂配平",
    },
  };

  return {
    score,
    ok: score === 4,
    angleAbs,
    coreDist,
    clutterCount,
    activeCount,
    mN,
    mS,
    mW,
    mE,
    lrDiff,
    lrSigned,
    tbSigned,
    focusOk,
    directionOk,
    stabilityOk,
    tensionOk,
    isLeverStyle,
    isOpticalLift,
    flawCode: flaw ? flaw.code : null,
    verdict,
    corners,
    readouts: {
      angleText: `${state.angle > 0 ? "+" : ""}${Math.round(state.angle)}°`,
      coreText: coreDist <= LIMITS.coreDistTol ? `居中 · 径${Math.round(state.coreScale * 100)}%` : `偏离 ${Math.round(coreDist * 100)}%`,
      reachText: `${Math.round(state.reach * 100)}%`,
      balanceText:
        activeCount < 2
          ? "臂空（示意）"
          : lrDiff <= LIMITS.lrImbalanceMax && !topHeavy
            ? isLeverStyle
              ? "近重远轻（示意）"
              : `稳衡 ${Math.round((1 - lrDiff) * 100)}%（示意）`
            : `${topHeavy ? "偏顶" : lrSigned >= 0 ? "偏右" : "偏左"} ${Math.round(lrDiff * 100)}%（示意）`,
    },
  };
}

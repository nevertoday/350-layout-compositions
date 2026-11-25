// 325 折枝式构图 · 单真源几何与视觉诊断引擎
// 所有画面折线、花晕、叶片、虚线引注与右侧/下方读数均由同一组实绘坐标算出。

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const ROOT_ANCHORS = {
  bl: { x: 0.0, y: 0.91, label: "左下出枝", short: "左下" },
  br: { x: 1.0, y: 0.89, label: "右下出枝", short: "右下" },
  tl: { x: 0.0, y: 0.13, label: "左上垂枝", short: "左上" },
  tr: { x: 1.0, y: 0.15, label: "右上悬枝", short: "右上" },
  floating: { x: 0.18, y: 0.77, label: "无根浮枝", short: "断根" },
};

export const THEMES = {
  poster: {
    id: "poster",
    name: "原海报 · 胭脂折枝",
    paper: "#EDE5D9",
    paperTint: "#E7DEC9",
    ink: "#1B1A16",
    halo: "#DFA596",
    core: "#8C2E27",
    petal: "#D68981",
    leaf: "#4F573F",
    leafDark: "#38422C",
    guide: "#3D4739",
    tipLabel: "端点聚焦",
    tipSub: "视觉停顿处 · 突出主题",
    shaftLabel: "斜向引导",
    shaftSub: "动势延伸 · 引导视线",
    voidLabel: "留白呼吸",
    voidSub: "大量留白 · 营造意境",
  },
  song: {
    id: "song",
    name: "宋人册页 · 寒梅来禽",
    paper: "#E8DCC5",
    paperTint: "#DFD0B5",
    ink: "#23201B",
    halo: "#F5F0E4",
    core: "#6B4236",
    petal: "#DFCBB2",
    leaf: "#5A614A",
    leafDark: "#3B422F",
    guide: "#4D4639",
    tipLabel: "枝端来禽",
    tipSub: "梅梢停雀 · 静中生趣",
    shaftLabel: "老梅屈铁",
    shaftSub: "一折生势 · 破开空绢",
    voidLabel: "宋绢计白",
    voidSub: "大片素绢 · 映出清寒",
  },
  editorial: {
    id: "editorial",
    name: "现代编排 · 诗集书封",
    paper: "#F3ECE1",
    paperTint: "#EAE0D0",
    ink: "#1E221D",
    halo: "#D79585",
    core: "#8E2D24",
    petal: "#C97F73",
    leaf: "#445441",
    leafDark: "#2E3B2C",
    guide: "#3D473B",
    tipLabel: "朱印主标",
    tipSub: "枝梢落眼 · 定住书名",
    shaftLabel: "斜势引线",
    shaftSub: "茶枝入页 · 牵引扫视",
    voidLabel: "版面气口",
    voidSub: "疏朗留白 · 托出副文",
  },
};

// 开场刻意停在初学三重错态（0/4）：直棍无折 + 端点居中 + 繁叶副花抢焦
export const INITIAL_STATE = {
  theme: "poster",
  rootEdge: "bl",
  tipX: 0.5,
  tipY: 0.5,
  jointT: 0.52,
  bend: 0.0,
  extraFoliage: true,
  dualFocus: true,
  showGuides: true,
};

export const PRESETS = {
  broken: { ...INITIAL_STATE },
  poster: {
    rootEdge: "bl",
    tipX: 0.735,
    tipY: 0.285,
    jointT: 0.54,
    bend: 0.105,
    extraFoliage: false,
    dualFocus: false,
  },
  overhang: {
    rootEdge: "tr",
    tipX: 0.285,
    tipY: 0.685,
    jointT: 0.52,
    bend: 0.095,
    extraFoliage: false,
    dualFocus: false,
  },
  reverse: {
    rootEdge: "br",
    tipX: 0.275,
    tipY: 0.285,
    jointT: 0.54,
    bend: -0.1,
    extraFoliage: false,
    dualFocus: false,
  },
  errFloating: {
    rootEdge: "floating",
    tipX: 0.7,
    tipY: 0.3,
    jointT: 0.54,
    bend: 0.09,
    extraFoliage: false,
    dualFocus: false,
  },
  errBreak: {
    rootEdge: "bl",
    tipX: 0.91,
    tipY: 0.13,
    jointT: 0.48,
    bend: 0.29,
    extraFoliage: false,
    dualFocus: false,
  },
};

export function createState() {
  return { ...INITIAL_STATE };
}

export function applyPreset(state, key) {
  const p = PRESETS[key];
  if (!p) return state;
  Object.assign(state, p);
  return state;
}

// 从 (root, tip, jointT, bend) 算出实绘拐点、分段角度、净留白、叶片与落瓣坐标
export function computeGeometry(state) {
  const anchor = ROOT_ANCHORS[state.rootEdge] || ROOT_ANCHORS.bl;
  const root = { x: anchor.x, y: anchor.y };
  const tip = {
    x: clamp(state.tipX, 0.07, 0.93),
    y: clamp(state.tipY, 0.07, 0.93),
  };

  const dx = tip.x - root.x;
  const dy = tip.y - root.y;
  const chordLen = Math.hypot(dx, dy) || 0.001;
  const ux = dx / chordLen;
  const uy = dy / chordLen;
  // 右手法线（对左下→右上而言指向右下，与 325 原海报拐弯方向一致）
  const nx = -uy;
  const ny = ux;

  const jt = clamp(state.jointT, 0.3, 0.7);
  const bend = clamp(state.bend, -0.34, 0.34);

  const joint = {
    x: clamp(root.x + dx * jt + nx * bend, 0.06, 0.94),
    y: clamp(root.y + dy * jt + ny * bend, 0.06, 0.94),
  };

  // 下段 root->joint 与上段 joint->tip 的实际矢量
  const v1x = joint.x - root.x;
  const v1y = joint.y - root.y;
  const l1 = Math.hypot(v1x, v1y) || 0.001;
  const v2x = tip.x - joint.x;
  const v2y = tip.y - joint.y;
  const l2 = Math.hypot(v2x, v2y) || 0.001;

  // 两段夹角（0°=完全笔直，越大拐得越急）
  const cosTurn = clamp((v1x * v2x + v1y * v2y) / (l1 * l2), -1, 1);
  const bendDeg = Math.round((Math.acos(cosTurn) * 180) / Math.PI);

  // 整体斜势倾角（相对水平线 0°–90°）
  const inclineDeg = Math.round(
    (Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI
  );

  // 画幅对角线占比（归一化单位正方形的对角线为 sqrt(2)）
  const spanPct = Math.round((chordLen / Math.SQRT2) * 100);

  // 花晕半径（与 325 原海报比例一致：直径约占画宽 21%）
  const haloR = state.theme === "song" ? 0.095 : 0.105;

  // 端点距画心 (0.5, 0.5) 的归一化距离（以半对角线 0.707 为基准或直接画幅百分比）
  const centerDist = Math.hypot(tip.x - 0.5, tip.y - 0.5);
  const centerOffsetPct = Math.round(centerDist * 100);

  // 端点距四边的最近距离（减去花晕半径即为净呼吸距）
  const edgeDist = Math.min(tip.x, 1 - tip.x, tip.y, 1 - tip.y);
  const haloClearance = edgeDist - haloR;

  // 主叶位置：两枚疏叶一低一高，挂在下段与上段两侧
  const pLower = {
    x: root.x + v1x * 0.58,
    y: root.y + v1y * 0.58,
    angle: Math.atan2(v1y, v1x) + 0.58,
    size: 0.088,
  };
  const pUpper = {
    x: joint.x + v2x * 0.62,
    y: joint.y + v2y * 0.62,
    angle: Math.atan2(v2y, v2x) + 0.65,
    size: 0.072,
  };

  // 三枚原海报风格落瓣点（位于上段外侧疏朗处）
  const u2x = v2x / l2;
  const u2y = v2y / l2;
  const n2x = -u2y;
  const n2y = u2x;
  const sideSign = tip.x >= 0.5 ? -1 : 1;
  const petals = [
    {
      x: clamp(joint.x + v2x * 0.66 + n2x * sideSign * 0.095, 0.06, 0.94),
      y: clamp(joint.y + v2y * 0.66 + n2y * sideSign * 0.095, 0.06, 0.94),
      r: 0.017,
    },
    {
      x: clamp(joint.x + v2x * 0.48 + n2x * sideSign * 0.068, 0.06, 0.94),
      y: clamp(joint.y + v2y * 0.48 + n2y * sideSign * 0.068, 0.06, 0.94),
      r: 0.0095,
    },
    {
      x: clamp(root.x + v1x * 0.86 + n2x * sideSign * 0.078, 0.06, 0.94),
      y: clamp(root.y + v1y * 0.86 + n2y * sideSign * 0.078, 0.06, 0.94),
      r: 0.012,
    },
  ];

  // 错态冗余丛叶（点击画布可逐一剪除）
  const clutterLeaves = state.extraFoliage
    ? [
        { x: root.x + v1x * 0.32, y: root.y + v1y * 0.32, angle: Math.atan2(v1y, v1x) - 0.72, size: 0.088 },
        { x: root.x + v1x * 0.78, y: root.y + v1y * 0.78, angle: Math.atan2(v1y, v1x) - 0.52, size: 0.092 },
        { x: joint.x + v2x * 0.25, y: joint.y + v2y * 0.25, angle: Math.atan2(v2y, v2x) + 0.82, size: 0.095 },
        { x: joint.x + v2x * 0.46, y: joint.y + v2y * 0.46, angle: Math.atan2(v2y, v2x) - 0.78, size: 0.088 },
        { x: joint.x + v2x * 0.78, y: joint.y + v2y * 0.78, angle: Math.atan2(v2y, v2x) - 0.55, size: 0.082 },
      ]
    : [];

  // 错态抢戏副花（与主花争端）
  const decoyBlossom = state.dualFocus
    ? {
        x: clamp(root.x + v1x * 0.74 - nx * 0.12, 0.13, 0.87),
        y: clamp(root.y + v1y * 0.74 - ny * 0.12, 0.13, 0.87),
        r: haloR * 0.82,
      }
    : null;

  // 枝干中段采样点（用于虚线引注「斜向引导」）
  const shaftAnchor = {
    x: joint.x + v2x * 0.34,
    y: joint.y + v2y * 0.34,
  };

  // 空域中心点（位于折枝对侧，用于虚线引注「留白呼吸」）
  const voidAnchor = {
    x: tip.x >= 0.5 ? 0.56 : 0.44,
    y: tip.y <= 0.5 ? 0.72 : 0.28,
  };

  // 解析面积估算（单真源：直接按实绘线条、花晕圆面积、叶片与繁乱干扰区累加）
  const branchArea = (l1 + l2) * 0.032;
  const blossomArea = Math.PI * haloR * haloR * 1.15;
  const baseLeafArea = 2 * 0.014;
  const clutterArea =
    clutterLeaves.length * 0.034 +
    (decoyBlossom ? Math.PI * decoyBlossom.r * decoyBlossom.r * 2.4 : 0);
  const occupied = clamp(branchArea + blossomArea + baseLeafArea + clutterArea, 0.10, 0.65);
  const whitespacePct = Math.round((1 - occupied) * 100);

  // 枝端前方的「迎势空域」：若太靠边或太靠心，空间感下降
  const whitespaceTier =
    whitespacePct >= 74 && haloClearance >= 0.03 && !state.extraFoliage && !state.dualFocus
      ? "舒朗"
      : whitespacePct >= 68 && haloClearance >= 0.015 && !state.extraFoliage
        ? "适中"
        : "憋闷";

  return {
    root,
    joint,
    tip,
    chordLen,
    l1,
    l2,
    bendDeg,
    inclineDeg,
    spanPct,
    haloR,
    centerDist,
    centerOffsetPct,
    edgeDist,
    haloClearance,
    leaves: [pLower, pUpper],
    petals,
    clutterLeaves,
    decoyBlossom,
    shaftAnchor,
    voidAnchor,
    whitespacePct,
    whitespaceTier,
    anchor,
  };
}

// 从实绘几何唯一核算 4 项准绳与 8 类错态
export function diagnose(state) {
  const g = computeGeometry(state);
  const errors = [];

  const isFloating = state.rootEdge === "floating";
  const isCentered = g.centerDist < 0.115;
  const isTangentEdge = g.haloClearance < 0.024;
  const isStraight = g.bendDeg < 10;
  const isAcuteBreak = g.bendDeg > 52;
  const isBadSlope = g.inclineDeg < 17 || g.inclineDeg > 73;
  const isTooShort = g.spanPct < 44;
  const isDualFocus = Boolean(state.dualFocus);
  const isOvercrowded = Boolean(state.extraFoliage) || g.whitespacePct < 68;

  if (isFloating) {
    errors.push({
      code: "floating",
      badge: "无根浮枝",
      title: "枝干悬在画内无根，失去了入画的来势",
      body: "折枝妙在「出枝于画外」——枝根贴着画框边缘探入，观者才会脑补画外还有整株花木。现在枝根飘在纸面中间，像一枚贴上去的标本贴纸，斜向推力当场泄气。",
      action: "在下方「出枝方位」点选左下、右下、左上或右上任一边角，让枝根重新咬住画框。",
    });
  }
  if (isStraight) {
    errors.push({
      code: "straight_stick",
      badge: "直棍无转",
      title: `枝干折角只有 ${g.bendDeg}°，像一根直尺斜捅过去`,
      body: "原海报讲「折枝一转，意在枝端」。完全笔直的斜杆没有节奏缓冲，眼睛顺着直线一滑就冲出画框，根本停不住；中段稍微顿挫一转，视线才会在转弯处放慢脚步，稳稳收进枝端。",
      action: "直接在画布上左右横拖（或拖动中段墨色「折节」圆点），掰出 12°–42° 的自然转折。",
    });
  }
  if (isAcuteBreak) {
    errors.push({
      code: "acute_break",
      badge: "死折断气",
      title: `拐角弯到 ${g.bendDeg}°，枝干像被生生折断`,
      body: "转折过猛（超过 52°）时，下段与上段失去了顺势贯通的弹力，视线撞在尖锐拐角上骤然卡死，后半段枝端反倒成了孤立的断梢。",
      action: "把中段「折节」往弦线方向轻轻收回来，让拐角回到 12°–45° 的挺拔区间。",
    });
  }
  if (isCentered) {
    errors.push({
      code: "centered",
      badge: "居中呆滞",
      title: `枝端停在画心附近（仅偏 ${g.centerOffsetPct}%），四周空域被切碎`,
      body: "海报尾句点破关键：「不居中央，方见风骨。」花心一压在正中，上下左右切成四块均等的窄空，既无长势延伸，也托不出大片留白的呼吸感。",
      action: "直接拖动画布上的胭脂花心，把它拉到离画心 15% 以上的对角偏侧区域。",
    });
  }
  if (isTangentEdge) {
    errors.push({
      code: "tangent_edge",
      badge: "撞边压框",
      title: "枝端花晕紧逼画框边缘，停顿被堵死了",
      body: "折枝端点需要一圈干净的纸面「迎势」来缓冲余韵。现在花晕已经擦边或溢出边框，观者的目光刚到枝端就一头撞墙，诗意停顿立刻变成逼仄挤压。",
      action: "把胭脂花心往画内轻收一点，让花晕外沿与四边至少留出一段舒朗留白。",
    });
  }
  if (isDualFocus) {
    errors.push({
      code: "dual_focus",
      badge: "双花争主",
      title: "中段多出一朵副花，把「意在枝端」劈成两半",
      body: "折枝靠单一端点收束全局视线。一旦枝腰再长出一朵体量接近的副花，眼睛就在半路与枝端之间来回拉扯，终点不再独尊。",
      action: "直接在画布上点击虚线红框标出的抢戏副花（或点下方「剪除副花」），只留一枝独秀。",
    });
  }
  if (isBadSlope) {
    errors.push({
      code: "bad_slope",
      badge: g.inclineDeg < 17 ? "横平无势" : "竖直僵立",
      title:
        g.inclineDeg < 17
          ? `斜势倾角仅 ${g.inclineDeg}°，近乎横平失去伸展动势`
          : `斜势倾角高达 ${g.inclineDeg}°，直上直下失了斜向律动`,
      body: "折枝式依赖斜向对角动势把视线从一边牵引到对侧。角度过平像一根搁板，过竖像一根电杆，都难以调动整个画面的纵横空域。",
      action: "拖动枝端花心，把整体斜势调整到 20°–68° 的斜向舒适带。",
    });
  }
  if (isTooShort) {
    errors.push({
      code: "too_short",
      badge: "枝怯力弱",
      title: `枝干跨度只有对角线的 ${g.spanPct}%，刚探头就缩回边角`,
      body: "枝势太短时，它只缩在入画一角，没有能力把观者的目光带入画面深处，整张宣纸大半成了与主体无关的空壳。",
      action: "把枝端花心朝对角方向再拉远一些，让枝干跨度超过对角线的 45%。",
    });
  }
  if (isOvercrowded) {
    errors.push({
      code: "overcrowded",
      badge: "繁乱压白",
      title: `中段丛叶拥挤，净留白被压到 ${g.whitespacePct}%`,
      body: "「枝简意丰，疏密有致」讲究留白托形。叶片一窝蜂堆满枝腰，墨块糊成一团，不仅吞掉了折枝的骨感，也让留白失去喘息余地。",
      action: "直接点击画布上的冗余杂叶（或点下方「修剪杂叶」），只保留一低一高两枚疏叶。",
    });
  }

  // 四条硬核准绳（对应海报 3 核心知识点 + 留白呼吸）
  const checks = {
    guide: !isFloating && !isStraight && !isAcuteBreak && !isBadSlope && !isTooShort,
    focus: !isCentered && !isTangentEdge && !isDualFocus,
    balance: !isOvercrowded && !isDualFocus,
    void: !isTangentEdge && !isCentered && g.whitespacePct >= 68,
  };
  const passedCount = Object.values(checks).filter(Boolean).length;
  const ok = errors.length === 0 && passedCount === 4;

  // 识别当前构成了哪种合法折枝流派解
  let solvedName = "自创折枝解";
  let solvedBody =
    "枝根咬住画边、斜势清劲、中段一转缓住眼速，单枚花心落在偏侧舒朗空域里，四条准绳全部合度。";
  if (ok) {
    if (state.rootEdge === "bl" && g.tip.x > 0.58 && g.tip.y < 0.45) {
      solvedName = "经典仰枝解";
      solvedBody =
        "承袭 325 原海报自左下起笔、中段蓄势一转、右上枝端收束的经典仰势：视线顺着由粗转细的墨枝斜升，在右上淡胭脂花晕处诗意停顿，左侧与下方大片留白从容呼吸。";
    } else if (state.rootEdge === "tr" || state.rootEdge === "tl") {
      solvedName = state.rootEdge === "tr" ? "右上悬枝解" : "左上垂枝解";
      solvedBody =
        "宋人团扇与宫廷立轴极爱悬垂折枝：枝干自上方边沿探下，借拐节回挑托起枝端主花，上方压势与下方空阔形成轻盈的悬停张力。";
    } else if (state.rootEdge === "br") {
      solvedName = "右下逆势解";
      solvedBody =
        "从右下角逆着习惯阅读方向斜出，经一转把视线拉向左上留白中的孤立端点，反常而不失稳，特别适合打破千篇一律的封面起手势。";
    } else {
      solvedName = "舒朗险势解";
      solvedBody =
        "出枝干脆、折转利落、枝端远离画心又与边框保持呼吸距，以不足三成的着墨面积撑起了整张宣纸的气韵。";
    }
  }

  const primary = ok
    ? {
        code: "ok",
        badge: `风骨已成 · 4/4`,
        title: `${solvedName}：一转缓势，端点孤立成焦`,
        body: solvedBody,
        action: "可以继续拖移枝端或切换四角出枝与三套题材，观察合法构图并不止唯一标准答案。",
      }
    : {
        ...errors[0],
        badge: `${passedCount}/4 · ${errors[0].badge}`,
      };

  return {
    g,
    ok,
    passedCount,
    checks,
    errors,
    primary,
    pointStatus: {
      guide: checks.guide
        ? `合度 · ${g.inclineDeg}° / 折 ${g.bendDeg}°`
        : isFloating
          ? "断根浮游"
          : isStraight
            ? `直棍 ${g.bendDeg}°`
            : isAcuteBreak
              ? `死折 ${g.bendDeg}°`
              : isBadSlope
                ? `倾角 ${g.inclineDeg}°`
                : `过短 ${g.spanPct}%`,
      focus: checks.focus
        ? `偏心 ${g.centerOffsetPct}% · 单焦`
        : isCentered
          ? `居心 ${g.centerOffsetPct}%`
          : isTangentEdge
            ? "花晕撞边"
            : "双花争主",
      balance: checks.balance
        ? `净留白 ${g.whitespacePct}% · ${g.whitespaceTier}`
        : isOvercrowded
          ? `繁叶压白 ${g.whitespacePct}%`
          : "宾主混杂",
    },
  };
}

// 供 03 节「墨砚暗室 · 题款与印章对角配重台」单真源核算视觉重心
export function computeColophonBalance({ sealPos = "empty-br", clearance = 22 }) {
  // 固定一枝经典折枝的实绘视觉重量重心（偏左下—中上：枝根左下重、花晕右上轻实）
  const branchMass = { x: 0.44, y: 0.54, w: 0.72 };
  const tipX = clamp(0.84 - clearance * 0.0045, 0.64, 0.84);
  const tipY = clamp(0.16 + clearance * 0.0045, 0.16, 0.36);

  const sealMap = {
    "empty-tl": { x: 0.18, y: 0.24, w: 0.26, label: "左上题款压空" },
    "empty-br": { x: 0.80, y: 0.78, w: 0.26, label: "右下朱印托势" },
    "crowd-tip": { x: clamp(tipX + 0.06, 0.15, 0.90), y: clamp(tipY + 0.08, 0.15, 0.85), w: 0.28, label: "紧压枝头题字" },
    none: { x: 0.5, y: 0.5, w: 0.0, label: "全幅无款" },
  };
  const seal = sealMap[sealPos] || sealMap["empty-br"];

  const totalW = branchMass.w + seal.w;
  const cogX = (branchMass.x * branchMass.w + seal.x * seal.w) / totalW;
  const cogY = (branchMass.y * branchMass.w + seal.y * seal.w) / totalW;
  const driftPct = Math.round(Math.hypot(cogX - 0.5, cogY - 0.5) * 100);
  const clearanceTooTight = clearance < 14;
  const clearanceTooDeep = clearance > 32;

  let verdict = "平衡";
  let note = "题款落在折枝对侧留白处，与斜枝形成「实枝对虚文」的杠杆平衡，同时保留了枝端四周干净的呼吸圈。";
  let status = "ok";

  if (sealPos === "crowd-tip") {
    verdict = "堵死枝端";
    status = "err";
    note = "题字与朱印直接糊在枝端主花旁边，把最宝贵的「端点留白」吞了个干净，视线刚要停下来就被字块打断。";
  } else if (clearanceTooTight) {
    verdict = "顶边局促";
    status = "err";
    note = `枝端距边缘留空仅 ${clearance}%，主花紧贴上右框边，就算对角有题款也救不回逼仄感。`;
  } else if (clearanceTooDeep) {
    verdict = "退缩靠心";
    status = "warn";
    note = `枝端回缩过深（留空 ${clearance}%），主花已逼近画幅中央，斜势与留白的反差明显变弱。`;
  } else if (sealPos === "none") {
    verdict = "偏轻微倾";
    status = "warn";
    note = `不落款时画面极简空灵，但整体视觉重心偏离画心 ${driftPct}%；若用于海报或书封，常在右下或左上补一段轻题字稳住天平。`;
  }

  return { tipX, tipY, seal, cogX, cogY, driftPct, verdict, note, status, clearance };
}

// 供 06 节「四枝定势」练习：四张图仅变「折转与端点落位」，单一变量
export const PRACTICE_CASES = [
  {
    id: "A",
    root: { x: 0.0, y: 0.9 },
    joint: { x: 0.38, y: 0.58 },
    tip: { x: 0.74, y: 0.28 }, // 几乎笔直 (bend ≈ 0°)
    correct: false,
    tag: "直杆无转",
    explain: "端点位置看着不错，但枝干从左下到右上几乎是一条 0° 笔直斜线。没有中段的「折枝一转」，视线像滑梯一样直冲右上角，缺少中国画讲究的顿挫与停顿感。",
  },
  {
    id: "B",
    root: { x: 0.0, y: 0.9 },
    joint: { x: 0.46, y: 0.65 },
    tip: { x: 0.74, y: 0.29 }, // 约 25° 折转 + 偏心右上留白充足
    correct: true,
    tag: "折转合度 · 端点舒朗",
    explain: "正确！左下入画，中下段自然一转（约 25°）缓住滑势，花心停在偏离画心约 32% 的右上空域，与边框留出充裕呼吸带，完整兑现「折枝一转，意在枝端；不居中央，方见风骨」。",
  },
  {
    id: "C",
    root: { x: 0.0, y: 0.9 },
    joint: { x: 0.34, y: 0.76 },
    tip: { x: 0.5, y: 0.5 }, // 有折转，但端点死停画心
    correct: false,
    tag: "端点居心",
    explain: "这一枝虽然有折转，但枝端花心刚好钉死在画幅正中央（50%, 50%），违背了「不居中央」原则。整张纸被切出四块破碎边角，失去了不对称留白的张力。",
  },
  {
    id: "D",
    root: { x: 0.0, y: 0.9 },
    joint: { x: 0.56, y: 0.64 },
    tip: { x: 0.91, y: 0.13 }, // 有折转，但花晕撞死右上边框
    correct: false,
    tag: "撞边压框",
    explain: "枝势拉得太满，胭脂花晕已经紧压右上两条边框。折枝端点需要一圈干净留白「迎势」，顶死边角会让诗意的停顿立刻变得急促憋闷。",
  },
];

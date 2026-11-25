// 312 三角调度 · 单一几何投影与三角评估真源
// 维护片场三维坐标 (x, z, posture)、机位环轨角度 (orbitDeg) 与焦段 (focalMm)，
// 为宽银幕取景框、俯视片场走位图、四原则检核带与导演实况诊单输出同一份实测数值。

export const STAGE_BOUNDS = {
  minX: -2.25,
  maxX: 2.25,
  minZ: -1.75,
  maxZ: 1.75,
};

export const POSTURES = {
  sit: { id: "sit", label: "坐姿", short: "坐", headY: 1.12, shoulderY: 0.88, width: 0.46 },
  stand: { id: "stand", label: "站姿", short: "站", headY: 1.72, shoulderY: 1.44, width: 0.44 },
  rise: { id: "rise", label: "登台", short: "登台", headY: 2.28, shoulderY: 2.0, width: 0.44, daisH: 0.56 },
};

export const LENSES = [35, 50, 85];

export const SCRIPTS = {
  upright: {
    id: "upright",
    label: "稳固正三角",
    en: "UPRIGHT PYRAMID",
    brief: "主角 A 居顶确立权威，B、C 分坐两侧筑宽底盘（对应 312 原海报正三角）。",
  },
  inverted: {
    id: "inverted",
    label: "压迫倒三角",
    en: "INVERTED WEDGE",
    brief: "B、C 高立两侧向内围压，主角 A 沉落底部孤立顶点，制造审讯与危机感。",
  },
  asymmetric: {
    id: "asymmetric",
    label: "偏心斜三角",
    en: "ASYMMETRIC TILT",
    brief: "主角 A 占领偏离中轴的高位顶点，两腰倾角拉出不对称，表现正在倾斜的权力。",
  },
};

export const VIEW_ASPECT = 1.82;

// 开场默认错态：三人齐高、同深度一字排开（0/4 成立）
export function createInitialState(script = "upright") {
  return {
    script,
    orbitDeg: 0,
    focalMm: 35,
    selected: "A",
    showPosterGuide: false,
    actors: {
      A: { id: "A", name: "主角 A", role: "核心", x: 0.0, z: 0.0, posture: "stand" },
      B: { id: "B", name: "配角 B", role: "左侧", x: -1.25, z: 0.0, posture: "stand" },
      C: { id: "C", name: "配角 C", role: "右侧", x: 1.25, z: 0.0, posture: "stand" },
    },
  };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 摄影机随焦段做温和距离补偿，保留镜头透视压缩差的同时让全员留在取景范围内
export function getCameraRig(orbitDeg, focalMm) {
  const rad = (orbitDeg * Math.PI) / 180;
  const dist = 4.95 * Math.pow(focalMm / 35, 0.72);
  const pos = {
    x: Math.sin(rad) * dist,
    y: 1.32,
    z: -Math.cos(rad) * dist,
  };
  const target = { x: 0, y: 1.30, z: 0 };

  const fx = target.x - pos.x;
  const fy = target.y - pos.y;
  const fz = target.z - pos.z;
  const fl = Math.hypot(fx, fy, fz) || 1;
  const fwd = { x: fx / fl, y: fy / fl, z: fz / fl };

  // Right = normalize(Up_world × fwd) → orbit=0 时 Right=(+1,0,0)
  const rx = fwd.z;
  const ry = 0;
  const rz = -fwd.x;
  const rl = Math.hypot(rx, ry, rz) || 1;
  const right = { x: rx / rl, y: 0, z: rz / rl };

  // Up = normalize(fwd × right)
  const ux = fwd.y * right.z - fwd.z * right.y;
  const uy = fwd.z * right.x - fwd.x * right.z;
  const uz = fwd.x * right.y - fwd.y * right.x;
  const ul = Math.hypot(ux, uy, uz) || 1;
  const up = { x: ux / ul, y: uy / ul, z: uz / ul };

  const halfTanH = 18 / focalMm; // 36mm 全画幅水平半角正切
  const halfTanV = halfTanH / VIEW_ASPECT;

  return { pos, target, fwd, right, up, dist, halfTanH, halfTanV, orbitDeg, focalMm };
}

export function projectPoint(cam, p) {
  const dx = p.x - cam.pos.x;
  const dy = p.y - cam.pos.y;
  const dz = p.z - cam.pos.z;
  const cx = dx * cam.right.x + dy * cam.right.y + dz * cam.right.z;
  const cy = dx * cam.up.x + dy * cam.up.y + dz * cam.up.z;
  const cz = dx * cam.fwd.x + dy * cam.fwd.y + dz * cam.fwd.z;
  const safeZ = Math.max(0.65, cz);
  const u = 0.5 + cx / (2 * safeZ * cam.halfTanH);
  const v = 0.5 - cy / (2 * safeZ * cam.halfTanV);
  return { u, v, cz, visible: cz > 0.75 };
}

export function projectActor(cam, actor) {
  const spec = POSTURES[actor.posture] || POSTURES.stand;
  const head = projectPoint(cam, { x: actor.x, y: spec.headY, z: actor.z });
  const shoulder = projectPoint(cam, { x: actor.x, y: spec.shoulderY, z: actor.z });
  const foot = projectPoint(cam, { x: actor.x, y: 0, z: actor.z });
  const daisTop = spec.daisH ? projectPoint(cam, { x: actor.x, y: spec.daisH, z: actor.z }) : foot;
  const bodyH = Math.max(0.05, foot.v - head.v);
  const shoulderHalfU = (spec.width * 0.5) / (2 * Math.max(0.65, head.cz) * cam.halfTanH);
  return {
    ...actor,
    spec,
    head,
    shoulder,
    foot,
    daisTop,
    bodyH,
    shoulderHalfU,
  };
}

function angleBetween(a, b, c) {
  // 顶点 a 处向量 ab 与 ac 的夹角（按画面宽高比修正成真实视觉角度）
  const v1x = (b.u - a.u) * VIEW_ASPECT;
  const v1y = b.v - a.v;
  const v2x = (c.u - a.u) * VIEW_ASPECT;
  const v2y = c.v - a.v;
  const m1 = Math.hypot(v1x, v1y);
  const m2 = Math.hypot(v2x, v2y);
  if (m1 < 1e-4 || m2 < 1e-4) return 180;
  const cos = clamp((v1x * v2x + v1y * v2y) / (m1 * m2), -1, 1);
  return (Math.acos(cos) * 180) / Math.PI;
}

function slopeDeg(a, b) {
  const dx = Math.abs(b.u - a.u) * VIEW_ASPECT;
  const dy = Math.abs(b.v - a.v);
  if (dx < 1e-4 && dy < 1e-4) return 0;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

// 统一评估：所有四原则灯、取景器标注、诊单文字均从此函数单源派生
export function evaluateState(state) {
  const cam = getCameraRig(state.orbitDeg, state.focalMm);
  const list = ["A", "B", "C"].map((id) => projectActor(cam, state.actors[id]));
  const byId = Object.fromEntries(list.map((p) => [p.id, p]));

  // 1. 画面边界与遮挡检测
  const outActors = list.filter(
    (p) => !p.head.visible || p.head.u < 0.06 || p.head.u > 0.94 || p.head.v < 0.07 || p.head.v > 0.88
  );
  const allInFrame = outActors.length === 0;

  const pairs = [
    [list[0], list[1]],
    [list[1], list[2]],
    [list[0], list[2]],
  ];
  let minPairDx = 1;
  let overlapPair = null;
  for (const [p1, p2] of pairs) {
    const dx = Math.abs(p1.head.u - p2.head.u);
    if (dx < minPairDx) {
      minPairDx = dx;
      overlapPair = [p1, p2];
    }
  }
  const noOverlap = minPairDx >= 0.095;

  // 2. 三角形朝向与顶点判定（按画面纵坐标 v 从高到低排序：v 越小位置越高）
  const sortedV = [...list].sort((p1, p2) => p1.head.v - p2.head.v);
  const highest = sortedV[0];
  const middle = sortedV[1];
  const lowest = sortedV[2];

  const topGap = middle.head.v - highest.head.v; // 最高点领先次高点
  const botGap = lowest.head.v - middle.head.v; // 最低点沉低于次低点
  const totalV = lowest.head.v - highest.head.v;

  // 判断当前自然几何形态是「正三角（单顶朝上）」还是「倒三角（单顶朝下）」
  const naturalOrientation =
    totalV < 0.06
      ? "flat"
      : topGap >= botGap
        ? "upright"
        : "inverted";

  // 按当前脚本期望方向挑选结构顶点与底/顶双锚点（若为 flat 则以最高点作为参考顶点）
  const useInvertedGeom =
    state.script === "inverted"
      ? naturalOrientation !== "upright"
      : naturalOrientation === "inverted";

  const apexActor = useInvertedGeom ? lowest : highest;
  const basePairRaw = list.filter((p) => p.id !== apexActor.id);
  const [baseLeft, baseRight] =
    basePairRaw[0].head.u <= basePairRaw[1].head.u
      ? [basePairRaw[0], basePairRaw[1]]
      : [basePairRaw[1], basePairRaw[0]];

  const baseSpan = Math.abs(baseRight.head.u - baseLeft.head.u);
  const baseMidV = (baseLeft.head.v + baseRight.head.v) * 0.5;
  const triH = Math.abs(baseMidV - apexActor.head.v);
  const apexLead = useInvertedGeom
    ? apexActor.head.v - Math.max(baseLeft.head.v, baseRight.head.v)
    : Math.min(baseLeft.head.v, baseRight.head.v) - apexActor.head.v;

  const apexDeg = angleBetween(apexActor.head, baseLeft.head, baseRight.head);
  const leftSlope = slopeDeg(apexActor.head, baseLeft.head);
  const rightSlope = slopeDeg(apexActor.head, baseRight.head);
  const slopeDiff = Math.abs(leftSlope - rightSlope);
  const apexOffset = Math.abs(apexActor.head.u - 0.5);
  const apexBetweenBase =
    apexActor.head.u >= baseLeft.head.u + 0.035 && apexActor.head.u <= baseRight.head.u - 0.035;

  // 面积占画框比例（鞋带公式）
  const [pA, pB, pC] = [byId.A.head, byId.B.head, byId.C.head];
  const areaPct =
    Math.abs((pB.u - pA.u) * (pC.v - pA.v) - (pC.u - pA.u) * (pB.v - pA.v)) * 50;

  // 重心
  const centroid = {
    u: (pA.u + pB.u + pC.u) / 3,
    v: (pA.v + pB.v + pC.v) / 3,
  };

  // 3. 检测三点在 3D 地板上是否近乎共线（用于解释「为何只转机位仍围不出三角」）
  const fA = state.actors.A;
  const fB = state.actors.B;
  const fC = state.actors.C;
  const floorArea =
    Math.abs((fB.x - fA.x) * (fC.z - fA.z) - (fC.x - fA.x) * (fB.z - fA.z)) * 0.5;
  const samePosture =
    fA.posture === fB.posture && fB.posture === fC.posture;
  const strictlyCollinear3D = floorArea < 0.16 && samePosture;

  // 4. 逐项评估原海报四原则（所有阈值均在界面标明「经验值」）
  const wantUpright = state.script === "upright";
  const wantInverted = state.script === "inverted";
  const wantAsym = state.script === "asymmetric";

  const orientationMatch =
    (wantUpright && naturalOrientation === "upright") ||
    (wantInverted && naturalOrientation === "inverted") ||
    (wantAsym && naturalOrientation === "upright");

  // 原则 1：稳定 STABILITY（底/顶跨度充分、朝向符合、顶点落位支撑成立）
  const stabilityOk =
    allInFrame &&
    orientationMatch &&
    baseSpan >= (wantAsym ? 0.28 : 0.30) &&
    triH >= 0.14 &&
    (wantAsym ? apexOffset >= 0.095 : apexBetweenBase);

  // 原则 2：引导 GUIDE（两腰有效汇聚，顶角在经验舒适带 36°–126°；偏心模式需两腰倾角差 ≥ 9°）
  const guideAngleOk = triH >= 0.14 && apexDeg >= 36 && apexDeg <= 126;
  const guideOk = guideAngleOk && (!wantAsym || slopeDiff >= 9);

  // 原则 3：层级 HIERARCHY（顶点明显领先次高/次低点 ≥ 8.5% 屏高，杜绝平头争顶）
  const hierarchyOk = orientationMatch && apexLead >= 0.085;

  // 原则 4：焦点 FOCUS（画面不裁切、角色不互挡、且主角 A 真正掌握该脚本所要求的顶点）
  const focusOk = allInFrame && noOverlap && orientationMatch && apexActor.id === "A" && apexLead >= 0.085;

  const passedCount = [stabilityOk, guideOk, hierarchyOk, focusOk].filter(Boolean).length;

  // 5. 生成白话因果诊断（明确区分 6 类错态与过关解）
  let code = "pass";
  let badge = "4/4 成立";
  let headline = "";
  let explanation = "";
  let hint = "";

  if (!allInFrame) {
    code = "out-of-frame";
    badge = `错态 · 切边出画（${passedCount}/4）`;
    const names = outActors.map((p) => p.name).join("、");
    headline = `${names}滑出了安全取景框，斜线断在画外`;
    explanation =
      "三角调度必须让三个顶点完整落在画框内，两侧汇聚线才能把目光收住。现在有角色被画框边缘挤住或切头，三角形缺了角。";
    hint = "把出画角色拖回俯视图中央区域，或把机位环轨拉回中段。";
  } else if (!noOverlap) {
    code = "overlap";
    badge = `错态 · 角色互挡（${passedCount}/4）`;
    headline = `${overlapPair[0].name}与${overlapPair[1].name}在镜头里叠成一线`;
    explanation = `两人在画面里的水平间距只剩 ${Math.round(minPairDx * 100)}%（经验下限 ≥ 10%），前后遮挡让三角形塌成两条重合的线段。`;
    hint = "拖动机位环轨换个侧面角度，或在俯视图中把两人横向拉开。";
  } else if (triH < 0.14 || apexDeg > 126) {
    code = "flat-line";
    badge = `错态 · 塌成一字（${passedCount}/4）`;
    if (strictlyCollinear3D && Math.abs(state.orbitDeg) >= 8) {
      headline = `机位已转到 ${state.orbitDeg > 0 ? "+" : ""}${Math.round(state.orbitDeg)}°，三人仍塌成一条斜线`;
      explanation =
        "三个人站在同一直线且身高齐平，摄影机怎么绕拍都只会拍出一条斜坡，永远围不出三角面（三角高仅 " +
        `${Math.round(triH * 100)}%）。`;
      hint = "先打破共线：点选「主角 A」切换「登台」，或让 B、C 切到「坐姿」并前移。";
    } else {
      headline = "三人几乎平排成一字，镜头里没有谁领头";
      explanation = `目前三角高度只有 ${Math.round(triH * 100)}%（顶角 ${Math.round(apexDeg)}°），两侧缺少向上或向下汇聚的斜线，观众视线只能在三人之间来回打转。`;
      hint = wantInverted
        ? "让 B、C 切到「登台」分立两侧，把主角 A 切到「坐姿」压在中间低位。"
        : "把主角 A 切到「登台」抬高（或让 B、C 切「坐姿」前移），立刻拉出三角形高度。";
    }
  } else if (baseSpan < (wantAsym ? 0.28 : 0.30) || apexDeg < 36) {
    code = "spiky";
    badge = `错态 · 挤成窄针（${passedCount}/4）`;
    headline = `底边只有 ${Math.round(baseSpan * 100)}% 画面宽，三角形像根细针`;
    explanation = `顶角被压尖到 ${Math.round(apexDeg)}°（经验舒适带 36°–126°），底部支撑过窄，画面显得局促发紧，撑不起稳固的视觉地基。`;
    hint = "在俯视图里把左右两名配角向外拉开，或切换到 35mm 广角放宽底盘。";
  } else if (!orientationMatch) {
    code = "wrong-orientation";
    badge = `错态 · 方向相反（${passedCount}/4）`;
    if (wantInverted) {
      headline = "摆出了稳固正三角，和「压迫倒三角」脚本正好相反";
      explanation =
        "现在单人高高立于顶角、两人低坐底边，镜头反而把权威交给了上方角色，压迫感完全消散。";
      hint = "把 B、C 切到「登台」形成高位双臂，把主角 A 切到「坐姿」沉入底角。";
    } else {
      headline = "摆出了悬空的倒三角，主角正在被两侧压迫";
      explanation =
        "两人高立上沿、单人沉在底角会把重力压向底部，产生审讯与危机感，不适合当前需要稳定主导权的脚本。";
      hint = "把主角 A 抬高到「登台」，把 B、C 降到「坐姿」作为宽底支撑（或改选「压迫倒三角」脚本）。";
    }
  } else if (apexLead < 0.085) {
    code = "tie-apex";
    badge = `错态 · 平头争顶（${passedCount}/4）`;
    headline = "两人高度几乎齐平，观众分不清谁是唯一顶点";
    explanation = `顶点只领先次点 ${Math.round(apexLead * 100)}% 画高（经验清晰差 ≥ 9%），形成双峰争焦，三角形的层级指向变模糊了。`;
    hint = "拉开主角与配角的姿态级差（例如一登台、两坐姿），让唯一顶点彻底跳出来。";
  } else if (apexActor.id !== "A") {
    code = "wrong-apex-owner";
    badge = `错态 · 配角抢顶（${passedCount}/4）`;
    headline = `三角形状成立了，但占领顶点的是${apexActor.name}而非主角 A`;
    explanation = `汇聚斜线会把第一视觉权重毫不留情地交给顶点角色。现在观众会先认定${apexActor.name}才是这场戏的焦点。`;
    hint = wantInverted
      ? "压迫倒三角里应把主角 A 压在底部低位，让 B、C 分立左右高位。"
      : "把「登台」让给主角 A，让配角退回两侧较低的底边位。";
  } else if (wantAsym && (apexOffset < 0.095 || slopeDiff < 9)) {
    code = "too-symmetric";
    badge = `错态 · 对称过正（${passedCount}/4）`;
    headline = "三角形过于对称端正，少了倾斜拉扯的动态势能";
    explanation = `现在顶点离中轴只偏 ${Math.round(apexOffset * 100)}%（两腰倾角差 ${Math.round(slopeDiff)}°），看起来像静止纪念碑，而非正在转向的权力关系。`;
    hint = "把主角 A 在俯视图里往左或往右挪开，或拖动机位环轨侧移 20°–35°。";
  } else if (!apexBetweenBase && !wantAsym) {
    code = "overhang";
    badge = `错态 · 重心外倾（${passedCount}/4）`;
    headline = "顶点甩出了底边支撑范围，三角形随时要侧翻";
    explanation =
      "正三角与倒三角的稳固锚点要求顶点落在另两人的水平投影区间内；一旦甩出外侧，视觉重量就会向一侧滑坠。";
    hint = "把主角 A 往 B、C 之间拉回一点，或顺手微调机位环轨把底边张开。";
  } else {
    code = "pass";
    badge = "4/4 成立 · 调度锁定";
    if (wantUpright) {
      headline = "底宽顶窄的正三角已锁定，目光自动聚向主角 A";
      explanation = `底宽占画幅 ${Math.round(baseSpan * 100)}%、顶角 ${Math.round(apexDeg)}°、主角 A 领高 +${Math.round(apexLead * 100)}%。宽底座承接视觉重量，两条斜线把注意力一步送上顶点。`;
      hint = "试试拖动机位环轨或切换 50mm / 85mm，观察镜头压缩如何改变这座三角的陡缓。";
    } else if (wantInverted) {
      headline = "高位围压的倒三角成立，主角 A 被锁死在底部焦点";
      explanation = `上沿跨度 ${Math.round(baseSpan * 100)}%、底角 ${Math.round(apexDeg)}°、主角下沉 ${Math.round(apexLead * 100)}%。上重下轻打破重力安全感，两人斜向俯视形成天然审讯压力。`;
      hint = "切回「稳固正三角」或让主角起身「登台」，体会一秒翻转权力关系的戏剧力量。";
    } else {
      headline = "偏心斜三角成立，静态秩序里藏着向一侧牵引的张力";
      explanation = `顶点偏轴 ${Math.round(apexOffset * 100)}%、两腰倾角差 ${Math.round(slopeDiff)}°、顶角 ${Math.round(apexDeg)}°。不对称斜率让观众隐约感到局势即将变盘。`;
      hint = "继续推动机位环轨，看同一个片场站位如何从对称纪念碑滑向动态斜三角。";
    }
  }

  // 四原则各自短评（直接上墙到原海报底部四原则栏）
  const principles = [
    {
      key: "stability",
      zh: "稳定",
      en: "STABILITY",
      ok: stabilityOk,
      status: !allInFrame
        ? "出画缺角"
        : !orientationMatch && triH >= 0.14
          ? wantInverted
            ? "错成正三角"
            : "倒悬失稳"
          : triH < 0.14
            ? "塌成一字"
            : baseSpan < (wantAsym ? 0.28 : 0.30)
              ? `底窄 ${Math.round(baseSpan * 100)}%`
              : wantAsym
                ? apexOffset < 0.095
                  ? `偏轴仅 ${Math.round(apexOffset * 100)}%`
                  : `偏轴 ${Math.round(apexOffset * 100)}%`
                : !apexBetweenBase
                  ? "重心外倾"
                  : `底宽 ${Math.round(baseSpan * 100)}%`,
    },
    {
      key: "guide",
      zh: "引导",
      en: "GUIDE",
      ok: guideOk,
      status:
        triH < 0.14 || apexDeg > 126
          ? `平角 ${Math.round(apexDeg)}°`
          : apexDeg < 36
            ? `尖角 ${Math.round(apexDeg)}°`
            : wantAsym && slopeDiff < 9
              ? `腰差仅 ${Math.round(slopeDiff)}°`
              : `顶角 ${Math.round(apexDeg)}°`,
    },
    {
      key: "hierarchy",
      zh: "层级",
      en: "HIERARCHY",
      ok: hierarchyOk,
      status:
        triH < 0.06
          ? "三人平头"
          : !orientationMatch
            ? "上下倒置"
            : apexLead < 0.085
              ? `仅差 ${Math.round(apexLead * 100)}%`
              : `领差 +${Math.round(apexLead * 100)}%`,
    },
    {
      key: "focus",
      zh: "焦点",
      en: "FOCUS",
      ok: focusOk,
      status: !allInFrame
        ? "切头出画"
        : !noOverlap
          ? `${overlapPair[0].id}·${overlapPair[1].id} 互挡`
          : !orientationMatch || apexLead < 0.085
            ? "焦点分散"
            : apexActor.id !== "A"
              ? `${apexActor.id} 抢占顶点`
              : "A 独掌顶点",
    },
  ];

  return {
    cam,
    actors: list,
    byId,
    apexActor,
    baseLeft,
    baseRight,
    useInvertedGeom,
    naturalOrientation,
    allInFrame,
    noOverlap,
    minPairDx,
    baseSpan,
    triH,
    apexLead,
    apexDeg,
    leftSlope,
    rightSlope,
    slopeDiff,
    apexOffset,
    areaPct,
    centroid,
    passedCount,
    principles,
    diagnosis: { code, badge, headline, explanation, hint },
  };
}

// 334 欲正关系构图（敧正关系构图）——单真源几何与静力学平衡模型
// 所有画面几何顶点、重心投影、角度弧、五项核心指标与白话诊单均由此模块同一份数据算出。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报·碑柱",
    short: "原海报",
    caption: "暖宣正柱垂立定轴，玄墨巨碑斜倚承球，1:1 承袭 334 原海报力学构成。",
    uprightName: "暖宣正柱",
    tiltedName: "玄墨斜碑",
    ballName: "黑球支点",
  },
  pine: {
    id: "pine",
    label: "山水·奇松倚壁",
    short: "奇松倚壁",
    caption: "竖直峭壁与垂瀑定下正轴，苍黑古松斜探破静，崖根磐石锚定重心。",
    uprightName: "直壁垂瀑",
    tiltedName: "斜探古松",
    ballName: "磐石压脚",
  },
  editorial: {
    id: "editorial",
    label: "海报·斜切宣言",
    short: "斜切宣言",
    caption: "端正书栏与竖排索引稳住版心，黑色斜切主视觉块拉出方向与张力。",
    uprightName: "端正主栏",
    tiltedName: "斜切黑版",
    ballName: "底锚圆印",
  },
  tower: {
    id: "tower",
    label: "建筑·悬挑塔楼",
    short: "悬挑塔楼",
    caption: "垂直核心筒承担结构重量，斜倾钢构塔翼制造天际动势，基墩稳托底角。",
    uprightName: "垂直主塔",
    tiltedName: "斜倾副翼",
    ballName: "承重基墩",
  },
};

export const PRESETS = {
  opening: {
    id: "opening",
    label: "复原开场错态",
    kind: "reset",
    state: { tiltDeg: 2, uprightTiltDeg: 0, uprightWeight: 0.50, ballOffset: 0.19 },
  },
  classic: {
    id: "classic",
    label: "原海报经典解",
    kind: "good",
    state: { tiltDeg: 20, uprightTiltDeg: 0, uprightWeight: 0.50, ballOffset: 0.0 },
  },
  daring: {
    id: "daring",
    label: "险中求平解",
    kind: "good",
    state: { tiltDeg: 28, uprightTiltDeg: 0, uprightWeight: 0.58, ballOffset: 0.02 },
  },
  reverse: {
    id: "reverse",
    label: "反势清雅解",
    kind: "good",
    state: { tiltDeg: -15, uprightTiltDeg: 0, uprightWeight: 0.48, ballOffset: -0.01 },
  },
  errFlat: {
    id: "errFlat",
    label: "试错：全正僵死",
    kind: "bad",
    state: { tiltDeg: 0, uprightTiltDeg: 0, uprightWeight: 0.50, ballOffset: 0.0 },
  },
  errAllTilt: {
    id: "errAllTilt",
    label: "试错：全斜失锚",
    kind: "bad",
    state: { tiltDeg: 18, uprightTiltDeg: 16, uprightWeight: 0.50, ballOffset: 0.0 },
  },
  errOver: {
    id: "errOver",
    label: "试错：过斜倾覆",
    kind: "bad",
    state: { tiltDeg: 42, uprightTiltDeg: 0, uprightWeight: 0.42, ballOffset: -0.14 },
  },
  errWeak: {
    id: "errWeak",
    label: "试错：正轻斜压",
    kind: "bad",
    state: { tiltDeg: 22, uprightTiltDeg: 0, uprightWeight: 0.24, ballOffset: 0.0 },
  },
};

export const INITIAL_STATE = {
  scene: "poster",
  tiltDeg: 2,          // 刻意停在 2° 似正非正误歪死区
  uprightTiltDeg: 0,   // 正柱初始端正，可点歪验证全斜失锚
  uprightWeight: 0.50, // 正柱承重份量（0.22–0.62）
  ballOffset: 0.19,    // 黑球初始脱空偏右
  showVectors: true,   // 显示重心垂线、角度弧与支撑区间
};

export const LIMITS = {
  tiltMin: -44,
  tiltMax: 46,
  weightMin: 0.22,
  weightMax: 0.62,
  ballMin: -0.22,
  ballMax: 0.24,
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function rotPt(x, y, cx, cy, rad) {
  const dx = x - cx;
  const dy = y - cy;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
}

function polyCentroid(pts) {
  let sx = 0, sy = 0;
  for (const p of pts) { sx += p.x; sy += p.y; }
  return { x: sx / pts.length, y: sy / pts.length };
}

// 统一逻辑坐标系：宽 1.00，高 0.72；地平黑线在 y = 0.625。
// 绘制时按等比 unit 缩放，确保任何视口下黑球严格正圆、角度严格真实。
export const WORLD = {
  w: 1.0,
  h: 0.72,
  groundY: 0.625,
  ballR: 0.036,
};

export function computeGeometry(state) {
  const tiltDeg = clamp(state.tiltDeg, LIMITS.tiltMin, LIMITS.tiltMax);
  const uprightTiltDeg = clamp(state.uprightTiltDeg || 0, -24, 24);
  const uprightWeight = clamp(state.uprightWeight, LIMITS.weightMin, LIMITS.weightMax);
  const ballOffset = clamp(state.ballOffset, LIMITS.ballMin, LIMITS.ballMax);

  const groundY = WORLD.groundY;
  const ballR = WORLD.ballR;

  // 1) 正立暖宣巨柱：宽随 uprightWeight 变化，高稳健
  const uW = 0.14 + (uprightWeight - 0.22) * 0.56; // weight=0.50 -> uW=0.297
  const uH = 0.485;
  const uBaseCx = 0.345;
  const uRad = (uprightTiltDeg * Math.PI) / 180;

  const uLocal = [
    { x: uBaseCx - uW / 2, y: groundY - uH },
    { x: uBaseCx + uW / 2, y: groundY - uH },
    { x: uBaseCx + uW / 2, y: groundY },
    { x: uBaseCx - uW / 2, y: groundY },
  ];
  const uprightQuad = uLocal.map((p) => rotPt(p.x, p.y, uBaseCx, groundY, uRad));
  const uprightCenter = polyCentroid(uprightQuad);
  const uprightArea = uW * uH;

  // 正柱垂直虚线轴顶底点（超出正柱上下各一段，复刻原海报顶底黑方块）
  const axisTop = rotPt(uBaseCx, groundY - uH - 0.085, uBaseCx, groundY, uRad);
  const axisBot = rotPt(uBaseCx, groundY + 0.042, uBaseCx, groundY, uRad);

  // 2) 纯黑倾斜巨碑：宽度与高度忠实原海报比例
  const tW = 0.235;
  const tH = 0.465;
  const tRad = (tiltDeg * Math.PI) / 180;

  // 斜碑的枢轴落点：
  // 右倾（tiltDeg >= 0）时，顺时针旋转使底边左高右低、顶部向右展开，底部刚好抬起留出黑球支点空间而不戳穿地平线；
  // 左倾（tiltDeg < 0）时，逆时针旋转使顶部向左展开、左低右高，黑球稳托左缘下方。
  const rightPivotX = uBaseCx + uW * 0.14;
  const leftPivotX = uBaseCx + uW * 0.56 + tW * 0.64;

  let pivotX;
  let pivotY;
  let tiltedLocal;
  const baseLineY = groundY + ballR * 1.15;
  if (tiltDeg >= 0) {
    // 计算旋转后右下角下降量 tW * sin(tRad)，保证右下角始终稳在 baseLineY 上方（贴球不穿地）
    const drop = Math.sin(tRad) * tW;
    const clearance = ballR * 1.35;
    pivotX = rightPivotX + Math.max(0, (tiltDeg - 26) * 0.0022);
    pivotY = Math.min(groundY - 0.006, baseLineY - clearance - drop * 0.58);
    tiltedLocal = [
      { x: pivotX, y: pivotY - tH },
      { x: pivotX + tW, y: pivotY - tH },
      { x: pivotX + tW, y: pivotY },
      { x: pivotX, y: pivotY },
    ];
  } else {
    const drop = Math.sin(-tRad) * tW;
    const clearance = ballR * 1.35;
    pivotX = leftPivotX - Math.max(0, (-tiltDeg - 26) * 0.002);
    pivotY = Math.min(groundY - 0.006, baseLineY - clearance - drop * 0.58);
    tiltedLocal = [
      { x: pivotX - tW, y: pivotY - tH },
      { x: pivotX, y: pivotY - tH },
      { x: pivotX, y: pivotY },
      { x: pivotX - tW, y: pivotY },
    ];
  }

  const tiltedQuad = tiltedLocal.map((p) => rotPt(p.x, p.y, pivotX, pivotY, tRad));
  const tiltedCenter = polyCentroid(tiltedQuad);
  const tiltedArea = tW * tH;

  // 3) 底部黑球支点：稳压在黑色地平基线 baseLineY 上，恰好垫在斜碑底边下方
  const botLeft = tiltedQuad[3];
  const botRight = tiltedQuad[2];
  // 理想支点位置：位于斜碑底边中段偏向受力侧
  const idealBallX = tiltDeg >= 0
    ? botLeft.x + (botRight.x - botLeft.x) * 0.56
    : botLeft.x + (botRight.x - botLeft.x) * 0.44;
  const ballX = clamp(idealBallX + ballOffset, 0.14, 0.89);
  const ballY = baseLineY - ballR;

  // 4) 合成面积与加权重心（视觉权重：纯黑斜碑吸睛密度略高于米白正柱，按 1.15× 计视觉份量）
  const visualU = uprightArea * 1.0;
  const visualT = tiltedArea * 1.12;
  const totalV = visualU + visualT;
  const uprightShare = visualU / totalV;

  const comX = (uprightCenter.x * visualU + tiltedCenter.x * visualT) / totalV;
  const comY = (uprightCenter.y * visualU + tiltedCenter.y * visualT) / totalV;

  // 5) 有效底基支撑范围：由正柱底边左缘至最右侧有效承托点（黑球或正柱右缘）
  const uMinX = Math.min(uprightQuad[2].x, uprightQuad[3].x);
  const uMaxX = Math.max(uprightQuad[2].x, uprightQuad[3].x);
  const tBotMinX = Math.min(botLeft.x, botRight.x);
  const tBotMaxX = Math.max(botLeft.x, botRight.x);

  // 黑球是否真的托住了斜碑底缘（偏差以理想托点算）
  const ballErr = ballX - idealBallX;
  const ballEngaged = Math.abs(ballErr) <= 0.085 && ballX >= tBotMinX - 0.035 && ballX <= tBotMaxX + 0.035;

  // 若黑球托住，支点拓宽底基支撑；若黑球脱空，支撑仅剩正柱与斜碑着地角
  const supportLeft = ballEngaged ? Math.min(uMinX, ballX - ballR) : uMinX;
  const supportRight = ballEngaged
    ? Math.max(uMaxX, ballX + ballR * 1.15)
    : Math.max(uMaxX, tiltDeg >= 0 ? botLeft.x + 0.04 : botRight.x);

  // 斜碑自身重心相对于支点组合的倾覆余量
  const tOverhang = tiltDeg >= 0
    ? tiltedCenter.x - (ballEngaged ? ballX + 0.095 : uMaxX + 0.035)
    : (ballEngaged ? ballX - 0.095 : uMinX - 0.035) - tiltedCenter.x;

  const comInsideSupport = comX >= supportLeft + 0.015 && comX <= supportRight - 0.015;
  const overToppled = Math.abs(tiltDeg) > 33 || tOverhang > 0.045 || !comInsideSupport;

  // 6) 原海报白色斜向贯通箭头：从左下向右上贯穿斜碑中轴（左倾时从右下向左上）
  const arrowStart = tiltDeg >= 0
    ? { x: botLeft.x - Math.sin(tRad) * 0.04, y: botLeft.y + Math.cos(tRad) * 0.04 }
    : { x: botRight.x - Math.sin(tRad) * 0.04, y: botRight.y + Math.cos(tRad) * 0.04 };
  const topCorner = tiltDeg >= 0 ? tiltedQuad[1] : tiltedQuad[0];
  const vx = topCorner.x - arrowStart.x;
  const vy = topCorner.y - arrowStart.y;
  const vLen = Math.hypot(vx, vy) || 1;
  const arrowEnd = {
    x: topCorner.x + (vx / vLen) * 0.072,
    y: topCorner.y + (vy / vLen) * 0.072,
  };

  // 相对夹角（真实对比角度）
  const deltaAngle = Math.abs(tiltDeg - uprightTiltDeg);
  const absTilt = Math.abs(tiltDeg);
  const absUpright = Math.abs(uprightTiltDeg);

  return {
    tiltDeg,
    uprightTiltDeg,
    uprightWeight,
    ballOffset,
    uW,
    uH,
    tW,
    tH,
    groundY,
    baseLineY,
    ballR,
    uprightQuad,
    uprightCenter,
    axisTop,
    axisBot,
    tiltedQuad,
    tiltedCenter,
    ballX,
    ballY,
    idealBallX,
    ballErr,
    ballEngaged,
    comX,
    comY,
    supportLeft,
    supportRight,
    comInsideSupport,
    overToppled,
    tOverhang,
    arrowStart,
    arrowEnd,
    uprightShare,
    deltaAngle,
    absTilt,
    absUpright,
  };
}

export function evaluate(state) {
  const g = computeGeometry(state);
  const sceneInfo = SCENES[state.scene] || SCENES.poster;

  const uprightSteady = g.absUpright <= 4;
  const uprightHeavyEnough = g.uprightShare >= 0.38;
  const stableOk = uprightSteady && uprightHeavyEnough;

  const tiltInRange = g.absTilt >= 10 && g.absTilt <= 32;
  const contrastOk = uprightSteady && g.deltaAngle >= 10 && g.absTilt <= 34;
  const tensionOk = contrastOk && !g.overToppled;
  const balanceOk = stableOk && tiltInRange && g.ballEngaged && !g.overToppled;

  const passedCount = [stableOk, tiltInRange, contrastOk, tensionOk, balanceOk].filter(Boolean).length;

  // 张力档位（用档位标示意，不造假精确百分比）
  let tensionTier = "适中蓄势（示意）";
  if (!uprightSteady) tensionTier = "失锚晕眩（示意）";
  else if (g.absTilt < 1) tensionTier = "静止无势（示意）";
  else if (g.absTilt < 9) tensionTier = "微歪犹疑（示意）";
  else if (g.absTilt <= 25) tensionTier = "明快均衡（示意）";
  else if (g.absTilt <= 33) tensionTier = "高张险绝（示意）";
  else tensionTier = "过斜失控（示意）";

  // 判定主要错态或合法解类型
  let code = "balanced_classic";
  let ok = false;
  let badge = "";
  let headline = "";
  let body = "";
  let action = "";
  let fixLabel = "";
  let fixState = null;

  if (!uprightSteady) {
    code = "upright_tilted";
    badge = `${passedCount}/5 · 全斜失锚`;
    headline = `${sceneInfo.uprightName}也歪了 ${Math.round(g.absUpright)}°，正斜参照系彻底塌了`;
    body = `两者角度差只剩 ${Math.round(g.deltaAngle)}°。没有端正的垂直轴作标尺，斜体就失去对比支点——人眼不再感到张力，只会觉得整张画挂歪了。`;
    action = `点一下${sceneInfo.uprightName}把它扶回 0°，让稳正骨架先立住。`;
    fixLabel = "扶正参考主柱";
    fixState = { uprightTiltDeg: 0 };
  } else if (!uprightHeavyEnough) {
    code = "upright_weak";
    badge = `${passedCount}/5 · 正轻斜压`;
    headline = `${sceneInfo.uprightName}份量仅占 ${Math.round(g.uprightShare * 100)}%，扛不住斜体侧推`;
    body = `原海报「设计提示」说得很直白：稳定的元素要承担结构与重量。正柱削得太瘦，黑色斜碑压过来时头重脚轻，秩序立刻失守。`;
    action = `把正柱份量加厚到 45% 以上，让结构重新压住阵脚。`;
    fixLabel = "加厚正柱承重";
    fixState = { uprightWeight: 0.52 };
  } else if (g.absTilt < 1) {
    code = "flat_dead";
    badge = `${passedCount}/5 · 全正僵死`;
    headline = `倾角 ${Math.round(g.tiltDeg)}° 完全笔直，稳是稳了却一潭死水`;
    body = `${sceneInfo.uprightName}与${sceneInfo.tiltedName}肩并肩垂直伫立，角度差为 0°。水平与垂直全是稳态，眼睛进场没有落差可循，画面沉闷呆板。`;
    action = `在画布上向右横拖扳开斜碑，把它拉进 10°–25° 动势区间。`;
    fixLabel = "拉开至 20° 经典斜势";
    fixState = { tiltDeg: 20, ballOffset: 0 };
  } else if (g.absTilt < 10) {
    code = "awkward_micro";
    badge = `${passedCount}/5 · 似正非正`;
    headline = `只斜了 ${Math.round(g.absTilt)}°——既不端正又不决断，像没摆齐`;
    body = `1°–9° 是最尴尬的「误歪死区」：人眼对垂直线极度敏感（斜效应），这点微斜够不成动势宣言，反倒像施工贴歪了的强迫症现场。`;
    action = `向右横拖画布果断推过 10°（推荐 14°–24°），并把黑球滑回底缘托稳。`;
    fixLabel = "一键推至原海报 20° 平衡";
    fixState = { tiltDeg: 20, ballOffset: 0 };
  } else if (g.overToppled) {
    code = "over_topple";
    badge = `${passedCount}/5 · 过斜倾覆`;
    headline = `倾角冲到 ${Math.round(g.absTilt)}°，重心越界、整块要栽倒`;
    body = `倾斜过了临界线，${sceneInfo.tiltedName}的重心投影甩出底基支撑面，视觉拉扯变成随时翻倒的不安感——有「险」无「平」，对比失衡。`;
    action = `往回收角到 12°–30° 内，同时检查底部${sceneInfo.ballName}是否垫在重心下。`;
    fixLabel = "收角回稳至 22°";
    fixState = { tiltDeg: 22, ballOffset: 0 };
  } else if (!g.ballEngaged) {
    code = "ball_missing";
    badge = `${passedCount}/5 · 支点脱空`;
    headline = `倾角 ${Math.round(g.tiltDeg)}° 很利落，但底部${sceneInfo.ballName}脱空了`;
    body = `斜势已经拉开，可底部${sceneInfo.ballName}偏离承托位 ${Math.round(Math.abs(g.ballErr) * 100)}% 舞台宽，斜碑底角悬空无依，画面少了一口「稳稳接住」的实感。`;
    action = `直接横拖底部黑色圆球，滑到斜碑底缘中段下方顶住它。`;
    fixLabel = "黑球归位托底";
    fixState = { ballOffset: 0 };
  } else {
    ok = true;
    if (g.tiltDeg < 0) {
      code = "balanced_reverse";
      badge = `5/5 · 反势清雅`;
      headline = `反向左倾 ${Math.round(g.absTilt)}° 同样成立：正柱承重、斜势生风`;
      body = `敧正不限于右斜。${sceneInfo.uprightName}保持 0° 垂直定轴，${sceneInfo.tiltedName}反向借势，底部${sceneInfo.ballName}稳托左缘，重心安稳落在支撑带内。`;
      action = `你也可以试着把正柱点歪，或把角度推过 34°，亲眼看平衡怎样瞬间瓦解。`;
    } else if (g.absTilt > 25) {
      code = "balanced_daring";
      badge = `5/5 · 险中求平`;
      headline = `${Math.round(g.absTilt)}° 陡势高张，靠厚重正柱与支点稳稳兜住`;
      body = `虽然超出了原海报常标 10°–25° 甜区，但因为正柱份量占到 ${Math.round(g.uprightShare * 100)}% 且支点咬合扎实，合成重心仍在支撑区内，构成高张力的动态平衡。`;
      action = `再往右推几度就会越过倾覆临界——试试找到险与倒的精确分界。`;
    } else {
      code = "balanced_classic";
      badge = `5/5 · 敧正相安`;
      headline = `正柱 0° 定轴 × 斜碑 ${Math.round(g.absTilt)}° 导势，张力与平衡合一`;
      body = `${sceneInfo.uprightName}稳稳吃下结构重量，${sceneInfo.tiltedName}以清晰角度切开平静，${sceneInfo.ballName}在底线精准托举——视线顺白箭冲出又被正轴收住。`;
      action = `试着点歪正柱或抽走黑球，验证「两者相互依赖」为什么缺一不可。`;
    }
  }

  // 五项核心指标实时读数（同步驱动左侧 5 枚原海报黑圆徽 + 底沿五项公式栏）
  const pillars = {
    stable: {
      ok: stableOk,
      tag: !uprightSteady
        ? `歪 ${Math.round(g.absUpright)}°`
        : !uprightHeavyEnough
          ? `偏轻 ${Math.round(g.uprightShare * 100)}%`
          : `正轴 0°`,
    },
    tilt: {
      ok: tiltInRange,
      tag: g.absTilt < 1
        ? "0° 僵直"
        : g.absTilt < 10
          ? `${Math.round(g.tiltDeg)}° 误歪`
          : g.absTilt > 32
            ? `${Math.round(g.tiltDeg)}° 过陡`
            : `${g.tiltDeg > 0 ? "+" : ""}${Math.round(g.tiltDeg)}°`,
    },
    contrast: {
      ok: contrastOk,
      tag: !uprightSteady
        ? "参照失锚"
        : `夹角 ${Math.round(g.deltaAngle)}°`,
    },
    tension: {
      ok: tensionOk,
      tag: tensionTier.replace("（示意）", ""),
    },
    balance: {
      ok: balanceOk,
      tag: g.overToppled
        ? "重心越界"
        : !g.ballEngaged
          ? "支点脱空"
          : balanceOk
            ? "重心落稳"
            : "待调平衡",
    },
  };

  return {
    geometry: g,
    code,
    ok,
    passedCount,
    badge,
    headline,
    body,
    action,
    fixLabel,
    fixState,
    tensionTier,
    pillars,
    metrics: {
      tiltText: `${g.tiltDeg > 0 ? "+" : ""}${Math.round(g.tiltDeg)}°`,
      deltaText: `${Math.round(g.deltaAngle)}°`,
      weightText: `${Math.round(g.uprightShare * 100)}%`,
      supportText: g.overToppled ? "越界失稳" : g.ballEngaged ? "托底咬合" : "偏离脱空",
    },
  };
}

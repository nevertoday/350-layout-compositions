// 034 V形构图 — 单真源几何与诊断引擎
// 所有状态均存在无量纲规范场坐标中：场高 = 1，中心 x = 0，y ∈ [0, 1]（顶到底）。
// 画布渲染、读数面板、圆徽状态灯、键盘微调与自检脚本全部读取这一份真源。

export const FIELD = {
  pivotX: 0.32,     // 左右光翼旋转枢轴距中轴的物理距离（以场高 = 1 计）
  pivotYDown: 0.26, // 正 V 模式下双翼枢轴纵深
  pivotYUp: 0.74,   // 倒 V 模式下双翼枢轴纵深
  minTilt: 10,      // 单翼最小倾角（距竖轴，度）
  maxTilt: 68,      // 单翼最大倾角（度）
  minWeight: 0.45,
  maxWeight: 1.45,
};

// 经验参考带（统一唯一定义，正文、滑杆标注与判定全部引用此处）
export const BANDS = {
  angleMin: 54,     // V 谷内角舒适下限（°）
  angleMax: 88,     // V 谷内角舒适上限（°）
  angleSharp: 44,   // 尖锐压迫阈值
  angleFlat: 94,    // 浅盘散光阈值
  asymMax: 12,      // 左右翼倾角容许差（°）
  offsetMax: 0.095, // 焦点偏离几何交点的容许距（占场高）
  focalYMin: 0.58,  // 重心下沉纵深下限
  focalYMax: 0.85,  // 底部安全区上限
  weightMin: 0.84,  // 底焦承重最小尺度
  weightMax: 1.32,  // 底焦承重最大尺度
};

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报光束",
    focalName: "视觉焦点",
    focalEn: "FOCAL POINT",
    note: "品红与香槟双叠斜光翼直落 45° 菱形焦点",
  },
  launch: {
    id: "launch",
    label: "发布会舞台",
    focalName: "主舞台展台",
    focalEn: "KEYNOTE STAGE",
    note: "两侧斜幕光墙聚拢至底部中央新品展台",
  },
  ceremony: {
    id: "ceremony",
    label: "颁奖礼拱廊",
    focalName: "荣耀奖座",
    focalEn: "AWARD PODIUM",
    note: "礼仪双侧斜柱与聚光引导全场注视奖座",
  },
};

// 初始 0/4 错态 + 多组合法解 + 典型试错态
export const PRESETS = {
  broken: {
    label: "复原 0/4 错态",
    leftDeg: 62,
    rightDeg: 38,
    focalX: -0.31,
    focalY: 0.44,
    focalWeight: 0.58,
    rebels: [true, true], // 两枚离心逆向干扰块初始均激活
    mode: "down",
  },
  classic: {
    label: "盛典经典解",
    leftDeg: 37,
    rightDeg: 37,
    focalX: 0,
    focalY: 0.685,
    focalWeight: 1.08,
    rebels: [false, false],
    mode: "down",
  },
  deep: {
    label: "深谷仪式解",
    leftDeg: 31,
    rightDeg: 31,
    focalX: 0,
    focalY: 0.792,
    focalWeight: 1.02,
    rebels: [false, false],
    mode: "down",
  },
  asymmetric: {
    label: "微偏动感解",
    leftDeg: 33,
    rightDeg: 41,
    focalX: -0.048,
    focalY: 0.681,
    focalWeight: 1.12,
    rebels: [false, false],
    mode: "down",
  },
  sharp: {
    label: "试错：窄刺压迫",
    leftDeg: 18,
    rightDeg: 18,
    focalX: 0,
    focalY: 0.78,
    focalWeight: 0.96,
    rebels: [false, false],
    mode: "down",
  },
  inverted: {
    label: "试错：倒 V 升腾",
    leftDeg: 36,
    rightDeg: 36,
    focalX: 0,
    focalY: 0.74,
    focalWeight: 1.04,
    rebels: [false, false],
    mode: "up",
  },
};

export function createInitialState() {
  return {
    scene: "poster",
    showGuides: true,
    ...structuredClonePreset(PRESETS.broken),
  };
}

function structuredClonePreset(p) {
  return {
    leftDeg: p.leftDeg,
    rightDeg: p.rightDeg,
    focalX: p.focalX,
    focalY: p.focalY,
    focalWeight: p.focalWeight,
    rebels: [...p.rebels],
    mode: p.mode,
  };
}

export function applyPreset(state, key) {
  const p = PRESETS[key];
  if (!p) return;
  Object.assign(state, structuredClonePreset(p));
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rad = (d) => (d * Math.PI) / 180;

// 解析几何求双翼斜线精确交点与射线段
export function solveGeometry(state) {
  const { pivotX, pivotYDown, pivotYUp } = FIELD;
  const isUp = state.mode === "up";
  const py = isUp ? pivotYUp : pivotYDown;
  const dirY = isUp ? -1 : 1;

  const lRad = rad(state.leftDeg);
  const rRad = rad(state.rightDeg);
  const tanL = Math.tan(lRad);
  const tanR = Math.tan(rRad);

  // 左线过 (-pivotX, py)，方向 (+sinL, dirY * cosL)
  // 右线过 (+pivotX, py)，方向 (-sinR, dirY * cosR)
  // 联立：-pivotX + dy * tanL = +pivotX - dy * tanR => dy = 2 * pivotX / (tanL + tanR)
  const denom = Math.max(0.08, tanL + tanR);
  const dy = (2 * pivotX) / denom;
  const apexY = py + dirY * dy;
  const apexX = -pivotX + dy * tanL;
  const vAngle = state.leftDeg + state.rightDeg;
  const asymDeg = Math.abs(state.leftDeg - state.rightDeg);
  const tiltSign = state.leftDeg > state.rightDeg ? "右" : state.leftDeg < state.rightDeg ? "左" : "中";

  // 焦点到解析交点的欧氏距离（归一化场高单位）
  const focalOffset = Math.hypot(state.focalX - apexX, state.focalY - apexY);
  const rebelCount = state.rebels.filter(Boolean).length;

  // 光翼顶部/外侧起端（画到远端外框 y = -0.06 或 y = 1.06）
  const outerY = isUp ? 1.08 : -0.08;
  const dyOut = Math.abs(outerY - py);
  const leftOuter = { x: -pivotX - dyOut * tanL, y: outerY };
  const rightOuter = { x: pivotX + dyOut * tanR, y: outerY };

  // 光翼把手位置（落在可见舒适区间，便于拖拽）
  const handleDy = 0.08;
  const leftHandle = {
    x: -pivotX + handleDy * tanL,
    y: py + dirY * handleDy,
  };
  const rightHandle = {
    x: pivotX - handleDy * tanR,
    y: py + dirY * handleDy,
  };

  // 两枚逆向离心干扰块的规范坐标
  const rebelSpots = [
    { id: 0, x: -0.34, y: isUp ? 0.40 : 0.62, side: "left", label: "离心偏标", sub: "点此归顺向底" },
    { id: 1, x: 0.34, y: isUp ? 0.38 : 0.60, side: "right", label: "逆向横条", sub: "点此归顺向底" },
  ];

  // 四项单真源达标判定
  const apexInFrame = !isUp && apexY >= 0.54 && apexY <= 0.89;
  const okAngle = !isUp && vAngle >= BANDS.angleMin && vAngle <= BANDS.angleMax && apexInFrame;
  const okSym = !isUp && asymDeg <= BANDS.asymMax;
  const okFocalAlign = !isUp && focalOffset <= BANDS.offsetMax;
  const okFocalDepth = !isUp && state.focalY >= BANDS.focalYMin && state.focalY <= BANDS.focalYMax;
  const okFocalWeight = state.focalWeight >= BANDS.weightMin && state.focalWeight <= BANDS.weightMax;
  const okFocal = okFocalAlign && okFocalDepth && okFocalWeight;
  const okUnity = rebelCount === 0;

  const passed = [okAngle, okSym, okFocal, okUnity].filter(Boolean).length;

  // 8 类失误优先级诊断
  let code = "ok";
  let badge = "4 / 4 聚光成立";
  let headline = "";
  let reason = "";
  let action = "";
  let tone = "ok"; // "error" | "warn" | "ok"

  if (isUp) {
    code = "inverted";
    tone = "error";
    badge = `错态 · 倒 V 升腾 (${passed}/4)`;
    headline = "双翼翻成了倒 V（∧），视线被抬离底部焦点";
    reason = `现在两条斜线在上方 ${Math.round(clamp(apexY, 0, 1) * 100)}% 处交汇，形成类似金字塔的向上升腾感。底部展台完全接不到两道光翼送来的动势，变成了孤立底座。`;
    action = "点「切回正 V（∨）」把光翼倒扣回来，让视线重新沿双翼沉向底部焦点。";
  } else if (vAngle < BANDS.angleSharp || apexY > 0.92) {
    code = "sharp";
    tone = "error";
    badge = `错态 · 窄刺出底 (${passed}/4)`;
    headline = `夹角缩到 ${Math.round(vAngle)}°，双翼直穿画底发紧`;
    reason = `两道斜线太陡，理论交点已经落到画面底部 ${Math.round(apexY * 100)}% 处，几乎刺出画框。过尖的下指 V 不仅挤扁了中央标题空间，还自带生硬的紧绷与压迫感。`;
    action = "在画布向右横拖（或按 → 键），把 V 谷夹角张开到 54°–88° 经验参考带。";
  } else if (vAngle > BANDS.angleFlat || apexY < 0.54) {
    code = "flat";
    tone = "error";
    badge = `错态 · 浅盘散光 (${passed}/4)`;
    headline = `夹角摊平到 ${Math.round(vAngle)}°，像一只兜不住视线的浅盘`;
    reason = `斜线张得太开，交点被提到了画面 ${Math.round(apexY * 100)}% 高度。视线刚沿斜翼滑进来就几乎横穿过去，既沉不下去，也给不了底部焦点足够冲力。`;
    action = "在画布向左横拖（或按 ← 键），把双翼夹角收进 54°–88° 经验参考带。";
  } else if (!okSym) {
    code = "skew";
    tone = "error";
    badge = `错态 · 偏斜滑坡 (${passed}/4)`;
    headline = `左右倾角相差 ${Math.round(asymDeg)}°，V 谷向${tiltSign}侧滑坡`;
    reason = `左翼 ${Math.round(state.leftDeg)}°、右翼 ${Math.round(state.rightDeg)}°，两股视觉推力不对等，交点被拖偏至水平 ${Math.round((0.5 + apexX / 1.4) * 100)}% 处。正 V 原本靠对称夹持来对抗尖端摇晃，一歪就立刻失去盛典的端庄稳重。`;
    action = "拖动画布中红圈标注的灯翼圆柄，把左右翼倾角差收进 12° 以内（或微调下方单翼滑杆）。";
  } else if (!okAngle) {
    code = "angle-edge";
    tone = "warn";
    badge = `待微调 · 夹角贴边 (${passed}/4)`;
    headline = `夹角 ${Math.round(vAngle)}° 刚好擦过经验舒适带边缘`;
    reason = `两条斜线已经能往下带视线，但稍偏${vAngle < BANDS.angleMin ? "尖锐发紧" : "宽平发散"}。再挪动几度，中央 V 谷的纵深与底焦承托会更从容。`;
    action = "左右微调画布或夹角滑杆，落入 54°–88° 经验参考带。";
  } else if (!okFocalAlign) {
    code = "focal-miss";
    tone = "error";
    badge = `错态 · 视线扑空 (${passed}/4)`;
    headline = `底部焦点偏离交点 ${Math.round(focalOffset * 100)}%，汇聚落空`;
    reason = "两条强斜线把观众的眼睛一路高速推送到 V 谷最底端，结果主角菱形焦点躲在旁边。眼睛落进空谷找不到着落，就会顺着惯性直接滑出画框底边。";
    action = "直接拖动舞台里的菱形焦点，把它稳稳放回双线交汇的虚线环心。";
  } else if (!okFocalDepth) {
    code = "focal-float";
    tone = "error";
    badge = `错态 · 重心${state.focalY < BANDS.focalYMin ? "上浮" : "压底"} (${passed}/4)`;
    headline = state.focalY < BANDS.focalYMin
      ? `焦点吊在 ${Math.round(state.focalY * 100)}% 偏高处，重心沉不下来`
      : `焦点沉到 ${Math.round(state.focalY * 100)}% 贴死底边，喘不过气`;
    reason = state.focalY < BANDS.focalYMin
      ? "V 形构图的信任感来自「重心下沉」。交点与焦点停在上半截时，底部留出一大片无依托的空洞，稳重感瞬间打折。"
      : "焦点压得太贴底框，下方留白被挤穿，手机端还极易被底部操作栏遮挡。";
    action = "微调双翼夹角并拖移焦点，让交点与焦点一起落在画面 58%–85% 纵深区。";
  } else if (!okFocalWeight) {
    code = "focal-light";
    tone = "warn";
    badge = `错态 · ${state.focalWeight < BANDS.weightMin ? "底焦太轻" : "底焦臃肿"} (${passed}/4)`;
    headline = state.focalWeight < BANDS.weightMin
      ? `底焦体量仅 ${state.focalWeight.toFixed(2)}×，压不住双翼冲力`
      : `底焦膨胀到 ${state.focalWeight.toFixed(2)}×，淹没了斜线引导`;
    reason = state.focalWeight < BANDS.weightMin
      ? "正 V 形「上宽下窄」，上方标题和两条宽光翼视觉分量很重；如果底部焦点缩成一小点，画面就会头重脚轻、像随时会倒的陀螺。"
      : "底部焦点过大把两条斜线的收束通道堵死了，画面退化成居中大图，失去了斜线引导的呼吸感。";
    action = "把下方「底焦体量」调到 0.84×–1.32× 经验参考带。";
  } else if (!okUnity) {
    code = "rebel";
    tone = "warn";
    badge = `错态 · 逆向分流 (${passed}/4)`;
    headline = `场内还有 ${rebelCount} 处朝外逃逸的干扰块，把视线截走了`;
    reason = "原海报强调「统一方向：所有元素朝向底部中心」。现在斜翼旁藏着朝画外反飞的视觉模块，观众视线滑到半路就被扯偏，仪式聚焦被打散。";
    action = "直接点击画布里带红虚框的离心干扰块，把它们归顺为沿 V 臂向底收敛的秩序。";
  } else {
    tone = "ok";
    const styleName = asymDeg >= 4
      ? "微偏动感正 V 解"
      : vAngle <= 66
        ? "深邃仪式正 V 解"
        : vAngle >= 78
          ? "宽幕盛典正 V 解"
          : "经典对称正 V 解";
    badge = `4 / 4 · ${styleName}`;
    headline = `双翼以 ${Math.round(vAngle)}° 稳稳锁住底焦，重心沉实有仪式感`;
    reason = asymDeg >= 4
      ? `左右倾角保留了 ${Math.round(asymDeg)}° 轻微差值，焦点顺着真实交点精准偏移承托，既保住了向底汇聚的秩序，又多了一分灵动的戏剧张力。`
      : `两条斜线对称收束于纵深 ${Math.round(apexY * 100)}% 处，焦点体量 ${state.focalWeight.toFixed(2)}× 稳稳托住 V 谷尖端，视线沿着「汇聚 → 聚焦 → 仪式感 → 重心下沉」一次落定。`;
    action = "可以继续试试换场景、拉出不同合法夹角，或故意点「试错」观察翻车过程。";
  }

  // 语义档位（不搞假精确百分比）
  const funnelTier = isUp
    ? "向上发散"
    : okAngle && okSym && okFocal && okUnity
      ? "强力锁焦"
      : okAngle && okFocalAlign
        ? "中度汇流"
        : vAngle < BANDS.angleSharp
          ? "过尖穿底"
          : "散光外滑";

  const weightTier = isUp
    ? "顶聚底空"
    : !okFocalDepth
      ? state.focalY < BANDS.focalYMin ? "重心偏高" : "压边闷堵"
      : !okFocalWeight
        ? state.focalWeight < BANDS.weightMin ? "头重脚轻" : "底重堵谷"
        : "重心沉稳";

  // 对应原海报 6 枚玫红圆徽实况
  const pills = {
    dualGuide: {
      ok: okAngle,
      tag: isUp ? "倒 V 抬升" : okAngle ? `${Math.round(vAngle)}° 顺流` : vAngle < BANDS.angleMin ? `${Math.round(vAngle)}° 过陡` : `${Math.round(vAngle)}° 过平`,
    },
    unity: {
      ok: okUnity && !isUp,
      tag: isUp ? "反向朝顶" : okUnity ? "全员向底" : `${rebelCount} 处离心`,
    },
    stability: {
      ok: okSym && okFocalWeight && !isUp,
      tag: isUp ? "尖端朝上" : !okSym ? `偏斜 ${Math.round(asymDeg)}°` : !okFocalWeight ? "底承不足" : asymDeg <= 2 ? "对称稳固" : `微偏 ${Math.round(asymDeg)}°`,
    },
    focus: {
      ok: okFocalAlign && !isUp,
      tag: isUp ? "焦点脱轨" : okFocalAlign ? "精准锁焦" : `偏距 ${Math.round(focalOffset * 100)}%`,
    },
    ceremony: {
      ok: okAngle && okSym && okUnity && !isUp,
      tag: okAngle && okSym && okUnity && !isUp ? "庄重聚光" : "气场未聚",
    },
    weight: {
      ok: okFocalDepth && okFocalWeight && !isUp,
      tag: weightTier,
    },
  };

  return {
    isUp,
    py,
    dirY,
    apexX,
    apexY,
    vAngle,
    asymDeg,
    tiltSign,
    focalOffset,
    rebelCount,
    leftOuter,
    rightOuter,
    leftHandle,
    rightHandle,
    rebelSpots,
    checks: { okAngle, okSym, okFocal, okUnity },
    passed,
    code,
    tone,
    badge,
    headline,
    reason,
    action,
    funnelTier,
    weightTier,
    pills,
  };
}

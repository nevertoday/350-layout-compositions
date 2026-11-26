// 089 静态构图 · 单真源几何与力学模型
// 所有实绘几何坐标、视觉重量、力矩偏差、柱距变异系数、接地空隙和诊断文案都从这里算出，
// Canvas 渲染、底部四柱探针、诊单条、键盘和预设按钮共享同一份真相。

export const PALETTE = {
  paper: "#E8E1D4",
  paperLight: "#F4EFE6",
  paperWarm: "#EFE9DE",
  cardStone: "#E1DACD",
  stoneMid: "#DAD0C1",
  stonePillar: "#D4CBBA",
  hatchDisc: "#DFD8CA",
  whiteDisc: "#E8E2D6",
  slateArc: "#51656A",
  slateDeep: "#4A5E63",
  slateInk: "#2B3E44",
  slateSphere: "#6D7B7E",
  sageCol: "#8B9081",
  sageBadge: "#84897C",
  sageInk: "#3D4A3B",
  ink: "#232021",
  inkMuted: "#494643",
  plinth: "#414544",
  blockDark: "#505152",
  rule: "#9C968B",
  ruleSoft: "#C6C0B3",
  bad: "#9E2F24",
  badFill: "rgba(158, 47, 36, 0.14)",
  ok: "#215E49",
  okFill: "rgba(33, 94, 73, 0.14)",
  darkRoom: "#202D31",
  darkCard: "#29393E",
  darkInk: "#F2ECE1",
  darkBad: "#F28477",
  darkOk: "#7ED6B6",
};

export const SCENES = {
  monolith: {
    id: "monolith",
    label: "原海报 · 石碑圣坛",
    shortLabel: "石碑圣坛",
    caption: "1:1 转译 089 原海报：灰绿高塔、青石墩、暖白圆与双翼镇石球坐落炭黑地基梁。",
    pillarCountPerSide: 4,
    defaultPreset: "classic",
  },
  garden: {
    id: "garden",
    label: "京都 · 枯山水石庭",
    shortLabel: "枯山水石庭",
    caption: "三组卧石压在水平白砂耙纹基床上，验证非对称力矩同样能营造静谧安稳。",
    pillarCountPerSide: 4,
    defaultPreset: "asymmetric",
  },
  gallery: {
    id: "gallery",
    label: "美术馆 · 典藏展墙",
    shortLabel: "典藏展墙",
    caption: "水平踢脚地基、居中主碑与双侧静画展柜，还原展陈与出版排版的秩序感。",
    pillarCountPerSide: 4,
    defaultPreset: "wide",
  },
};

// 固定扰动种子，让同一 rhythmJitter 数值产生可复现、连续渐变的乱拍柱廊
const PILLAR_JITTER_DX = [-0.52, 0.68, -0.35, 0.48, 0.62, -0.46, 0.38, -0.58];
const PILLAR_JITTER_DH = [0.34, -0.28, 0.42, -0.32, -0.25, 0.46, -0.36, 0.28];

export const PRESETS = {
  openBad: {
    id: "openBad",
    label: "复原开场错态",
    tilt: 13.5,
    leftX: -0.23,
    rightX: 0.345,
    rightScale: 1.24,
    centerShift: 0.055,
    leftFloat: 0.16,
    rightFloat: 0.22,
    centerFloat: 0.18,
    rhythmJitter: 0.72,
  },
  classic: {
    id: "classic",
    label: "原海报对称解",
    tilt: 0,
    leftX: -0.272,
    rightX: 0.272,
    rightScale: 1.0,
    centerShift: 0,
    leftFloat: 0,
    rightFloat: 0,
    centerFloat: 0,
    rhythmJitter: 0,
  },
  asymmetric: {
    id: "asymmetric",
    label: "非对称杠杆解",
    tilt: 0,
    leftX: -0.33,
    rightX: 0.236,
    rightScale: 1.22,
    centerShift: 0.005,
    leftFloat: 0,
    rightFloat: 0,
    centerFloat: 0,
    rhythmJitter: 0.06,
  },
  wide: {
    id: "wide",
    label: "宽翼沉稳解",
    tilt: 0,
    leftX: -0.332,
    rightX: 0.332,
    rightScale: 0.96,
    centerShift: 0,
    leftFloat: 0,
    rightFloat: 0,
    centerFloat: 0,
    rhythmJitter: 0,
  },
  failTilt: {
    id: "failTilt",
    label: "斜轴动势",
    tilt: -15.5,
    leftX: -0.272,
    rightX: 0.272,
    rightScale: 1.0,
    centerShift: 0,
    leftFloat: 0,
    rightFloat: 0,
    centerFloat: 0,
    rhythmJitter: 0,
  },
  failTorque: {
    id: "failTorque",
    label: "右翼偏沉",
    tilt: 0,
    leftX: -0.195,
    rightX: 0.365,
    rightScale: 1.32,
    centerShift: 0.095,
    leftFloat: 0,
    rightFloat: 0,
    centerFloat: 0,
    rhythmJitter: 0,
  },
  failFloat: {
    id: "failFloat",
    label: "悬空散架",
    tilt: 0,
    leftX: -0.272,
    rightX: 0.272,
    rightScale: 1.0,
    centerShift: 0,
    leftFloat: 0.19,
    rightFloat: 0.23,
    centerFloat: 0.21,
    rhythmJitter: 0,
  },
  failRhythm: {
    id: "failRhythm",
    label: "柱廊乱拍",
    tilt: 0,
    leftX: -0.272,
    rightX: 0.272,
    rightScale: 1.0,
    centerShift: 0,
    leftFloat: 0,
    rightFloat: 0,
    centerFloat: 0,
    rhythmJitter: 0.88,
  },
};

export const LIMITS = {
  tilt: [-22, 22],
  leftX: [-0.38, -0.165],
  rightX: [0.165, 0.38],
  rightScale: [0.76, 1.34],
  centerShift: [-0.14, 0.14],
  float: [0, 0.24],
  rhythmJitter: [0, 1],
};

export const THRESHOLDS = {
  tiltDeg: 1.5,       // |倾角| <= 1.5° 判为水平垂直正交成立
  torquePct: 5.5,     // |视觉力矩偏移| <= 5.5% 判为左右均衡成立
  cogMaxPct: 48.0,    // 垂直视觉重心高度比 <= 48% 判为重心沉稳不浮高
  rhythmCvPct: 12.0,  // 柱廊间距/高度变异系数 <= 12% 判为平静节奏成立
  floatPct: 2.5,      // 最大石件悬空隙 <= 2.5% 判为坐实地基成立
};

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function createInitialState(scene = "monolith") {
  return {
    scene,
    ...PRESETS.openBad,
    showGuides: true,
    pulseT: 0, // >0 时播放重力微震沉降测试
  };
}

// 计算色彩视觉暗度权重（深色视觉重量大于浅色，依据 Arnheim 明度权重原则，作为示意权重系数）
function hexToneWeight(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // 越暗视觉分量越沉，浅石也有基础体量
  return 0.42 + (1 - luma) * 1.15;
}

// 在建筑立面归一化坐标系里生成全部实绘几何体：
// 原点 (0, 0) 为炭黑地基梁顶面正中；x 向右为正（半宽 ~0.50），y 向上为正（顶高 ~0.62）。
export function computeLayout(state) {
  const scene = state.scene || "monolith";
  const tiltDeg = clamp(state.tilt, LIMITS.tilt[0], LIMITS.tilt[1]);
  const leftX = clamp(state.leftX, LIMITS.leftX[0], LIMITS.leftX[1]);
  const rightX = clamp(state.rightX, LIMITS.rightX[0], LIMITS.rightX[1]);
  const rightScale = clamp(state.rightScale, LIMITS.rightScale[0], LIMITS.rightScale[1]);
  const centerShift = clamp(state.centerShift, LIMITS.centerShift[0], LIMITS.centerShift[1]);
  const leftFloat = clamp(state.leftFloat, LIMITS.float[0], LIMITS.float[1]);
  const rightFloat = clamp(state.rightFloat, LIMITS.float[0], LIMITS.float[1]);
  const centerFloat = clamp(state.centerFloat, LIMITS.float[0], LIMITS.float[1]);
  const jitter = clamp(state.rhythmJitter, LIMITS.rhythmJitter[0], LIMITS.rhythmJitter[1]);

  // 1. 最底深炭黑地基梁（Plinth）
  const plinth = {
    id: "plinth",
    kind: "rect",
    x: -0.435,
    y: -0.036,
    w: 0.87,
    h: 0.036,
    color: scene === "garden" ? "#5A5C57" : PALETTE.plinth,
    weightRole: "base",
  };

  // 2. 左右外翼百叶竖柱（每侧 4 根，严格镜像基线 + jitter 扰动）
  const pillars = [];
  const baseOuterStart = 0.398;
  const baseStep = 0.0315;
  const baseW = 0.0185;
  const baseH = scene === "garden" ? 0.165 : scene === "gallery" ? 0.275 : 0.242;

  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 4; i++) {
      const idx = side < 0 ? i : i + 4;
      // 原海报外翼柱靠近中心稍宽一点点但保持匀称
      const nominalW = i === 3 ? baseW * 1.18 : baseW;
      const nominalCx = side * (baseOuterStart - i * baseStep);
      const dx = PILLAR_JITTER_DX[idx] * jitter * 0.017;
      const dh = PILLAR_JITTER_DH[idx] * jitter * 0.095;
      const w = nominalW * (1 + PILLAR_JITTER_DX[idx] * jitter * 0.22);
      const h = Math.max(0.085, baseH + dh);
      const cx = nominalCx + dx;
      pillars.push({
        id: `pillar-${side < 0 ? "L" : "R"}-${i}`,
        side,
        index: i,
        kind: "rect",
        x: cx - w / 2,
        y: 0,
        w,
        h,
        cx,
        color: scene === "garden" ? "#CFC7B6" : PALETTE.stonePillar,
      });
    }
  }

  // 3. 背景中层双暖石墙块
  const midBlockH = scene === "garden" ? 0.25 : scene === "gallery" ? 0.36 : 0.375;
  const midBlocks = [
    {
      id: "mid-left",
      kind: "rect",
      x: -0.285,
      y: 0,
      w: 0.195,
      h: midBlockH,
      color: PALETTE.stoneMid,
    },
    {
      id: "mid-right",
      kind: "rect",
      x: 0.09,
      y: 0,
      w: 0.195,
      h: midBlockH,
      color: PALETTE.stoneMid,
    },
  ];

  // 4. 中央鼠尾草灰绿高塔柱
  const towerW = scene === "garden" ? 0.24 : 0.188;
  const towerH = scene === "garden" ? 0.34 : scene === "gallery" ? 0.495 : 0.545;
  const centerTower = {
    id: "center-tower",
    kind: "rect",
    x: centerShift * 0.45 - towerW / 2,
    y: 0,
    w: towerW,
    h: towerH,
    color: PALETTE.sageCol,
  };

  // 5. 中央深青石板方墩（前景）
  const slabW = scene === "garden" ? 0.31 : 0.304;
  const slabH = scene === "garden" ? 0.155 : 0.245;
  const centerSlab = {
    id: "center-slab",
    kind: "rect",
    x: centerShift * 0.65 - slabW / 2,
    y: 0,
    w: slabW,
    h: slabH,
    color: PALETTE.slateDeep,
  };

  // 6. 中央暖白大圆（可拖动：横移 centerShift / 纵压 centerFloat）
  const discR = scene === "garden" ? 0.088 : scene === "gallery" ? 0.084 : 0.096;
  const discRestCy = slabH - discR * 0.02;
  const centerDisc = {
    id: "center-disc",
    draggable: true,
    label: scene === "garden" ? "中庭白石" : scene === "gallery" ? "主碑圆徽" : "中央暖白圆",
    kind: "circle",
    cx: centerShift,
    cy: discRestCy + centerFloat,
    restCy: discRestCy,
    r: discR,
    floatGap: centerFloat,
    color: scene === "gallery" ? "#F1EBE0" : PALETTE.whiteDisc,
  };

  // 7. 左翼深炭黑方座 + 青石板镇石球（可拖动：横移 leftX / 纵压 leftFloat）
  const leftCubeW = 0.132;
  const leftCubeH = scene === "garden" ? 0.068 : 0.088;
  const leftSphereR = scene === "garden" ? 0.058 : 0.072;
  const leftCube = {
    id: "left-cube",
    draggable: true,
    group: "left",
    kind: "rect",
    x: leftX - leftCubeW / 2,
    y: leftFloat * 0.55,
    restY: 0,
    w: leftCubeW,
    h: leftCubeH,
    floatGap: leftFloat,
    color: PALETTE.blockDark,
  };
  const leftSphere = {
    id: "left-sphere",
    draggable: true,
    group: "left",
    label: scene === "garden" ? "左卧石" : scene === "gallery" ? "左展柜石球" : "左青石球座",
    kind: "circle",
    cx: leftX,
    cy: leftCube.y + leftCubeH + leftSphereR + 0.004 + leftFloat * 0.45,
    restCy: leftCubeH + leftSphereR + 0.004,
    r: leftSphereR,
    floatGap: leftFloat,
    color: PALETTE.slateSphere,
  };

  // 8. 右翼深炭黑方座 + 青石板镇石球（可拖动：横移 rightX / 纵压 rightFloat；体积受 rightScale 影响）
  const rightCubeW = 0.132 * (0.72 + 0.28 * rightScale);
  const rightCubeH = (scene === "garden" ? 0.068 : 0.088) * (0.8 + 0.2 * rightScale);
  const rightSphereR = (scene === "garden" ? 0.058 : 0.072) * rightScale;
  const rightCube = {
    id: "right-cube",
    draggable: true,
    group: "right",
    kind: "rect",
    x: rightX - rightCubeW / 2,
    y: rightFloat * 0.55,
    restY: 0,
    w: rightCubeW,
    h: rightCubeH,
    floatGap: rightFloat,
    color: PALETTE.blockDark,
  };
  const rightSphere = {
    id: "right-sphere",
    draggable: true,
    group: "right",
    label: scene === "garden" ? "右立石" : scene === "gallery" ? "右展柜石球" : "右青石球座",
    kind: "circle",
    cx: rightX,
    cy: rightCube.y + rightCubeH + rightSphereR + 0.004 + rightFloat * 0.45,
    restCy: rightCubeH + rightSphereR + 0.004,
    r: rightSphereR,
    floatGap: rightFloat,
    color: PALETTE.slateSphere,
  };

  const shapes = [
    ...pillars,
    ...midBlocks,
    centerTower,
    centerSlab,
    leftCube,
    leftSphere,
    rightCube,
    rightSphere,
    centerDisc,
    plinth,
  ];

  return {
    scene,
    tiltDeg,
    plinth,
    pillars,
    midBlocks,
    centerTower,
    centerSlab,
    centerDisc,
    leftCube,
    leftSphere,
    rightCube,
    rightSphere,
    shapes,
    params: {
      tiltDeg,
      leftX,
      rightX,
      rightScale,
      centerShift,
      leftFloat,
      rightFloat,
      centerFloat,
      rhythmJitter: jitter,
    },
  };
}

// 单真源评估：所有数字、通过数、错态文案、四柱探针标签均由此函数直接从 layout 实绘几何算出
export function evaluate(state) {
  const layout = computeLayout(state);
  const { tiltDeg, pillars, centerDisc, leftSphere, rightSphere, shapes } = layout;

  // 1. 稳定感：偏离 0° 水平/90° 垂直正交基准的实测角度
  const absTilt = Math.abs(tiltDeg);
  const stabilityOk = absTilt <= THRESHOLDS.tiltDeg;

  // 2. 均衡性：从全部非地基实绘几何体的面积 × 暗度重量算出视觉力矩与垂直重心
  let totalW = 0;
  let momentX = 0;
  let momentY = 0;
  const maxHeight = 0.56;
  for (const s of shapes) {
    if (s.id === "plinth") continue;
    let area = 0;
    let cx = 0;
    let cy = 0;
    if (s.kind === "rect") {
      area = s.w * s.h;
      cx = s.x + s.w / 2;
      cy = s.y + s.h / 2;
    } else {
      area = Math.PI * s.r * s.r;
      cx = s.cx;
      cy = s.cy;
    }
    const w = area * hexToneWeight(s.color);
    totalW += w;
    momentX += w * cx;
    momentY += w * cy;
  }
  const cogX = totalW > 0 ? momentX / totalW : 0;
  const cogY = totalW > 0 ? momentY / totalW : 0.2;
  // 归一化到 [-100%, +100%] 相对半跨 (0.145 是实际几何敏感跨度)
  const torquePct = clamp((cogX / 0.145) * 100, -45, 45);
  const cogYRatioPct = clamp((cogY / maxHeight) * 100, 15, 78);
  const absTorque = Math.abs(torquePct);
  const topHeavy = cogYRatioPct > THRESHOLDS.cogMaxPct;
  const balanceOk = absTorque <= THRESHOLDS.torquePct && !topHeavy;

  // 3. 平静节奏：直接测量左右 4+4 根百叶柱的真实中心间距数组与高度数组变异系数 (CV%)
  const leftPillars = pillars.filter((p) => p.side < 0).sort((a, b) => a.cx - b.cx);
  const rightPillars = pillars.filter((p) => p.side > 0).sort((a, b) => a.cx - b.cx);
  const gaps = [];
  for (let i = 1; i < leftPillars.length; i++) gaps.push(leftPillars[i].cx - leftPillars[i - 1].cx);
  for (let i = 1; i < rightPillars.length; i++) gaps.push(rightPillars[i].cx - rightPillars[i - 1].cx);
  const meanGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const gapStd = Math.sqrt(gaps.reduce((a, g) => a + (g - meanGap) ** 2, 0) / gaps.length);
  const heights = pillars.map((p) => p.h);
  const meanH = heights.reduce((a, b) => a + b, 0) / heights.length;
  const hStd = Math.sqrt(heights.reduce((a, h) => a + (h - meanH) ** 2, 0) / heights.length);
  const rhythmCvPct = clamp(((gapStd / Math.max(0.001, meanGap)) * 0.6 + (hStd / Math.max(0.001, meanH)) * 0.4) * 180, 0, 68);
  const rhythmOk = rhythmCvPct <= THRESHOLDS.rhythmCvPct;

  // 4. 秩序结构：实测三组可动石件相对基座顶边的悬浮裂隙率
  const maxFloat = Math.max(leftSphere.floatGap, rightSphere.floatGap, centerDisc.floatGap);
  const avgFloat = (leftSphere.floatGap + rightSphere.floatGap + centerDisc.floatGap) / 3;
  const floatPct = (maxFloat / 0.24) * 100;
  const orderOk = floatPct <= THRESHOLDS.floatPct;

  const passedCount = [stabilityOk, balanceOk, rhythmOk, orderOk].filter(Boolean).length;

  // 识别当前错态列表（双向真检出）
  const faults = [];
  if (!stabilityOk) {
    faults.push({
      code: tiltDeg > 0 ? "tilt-right" : "tilt-left",
      pill: `地基倾 ${tiltDeg > 0 ? "+" : ""}${tiltDeg.toFixed(1)}°`,
      headline: `地基向${tiltDeg > 0 ? "右" : "左"}倾斜 ${absTilt.toFixed(1)}°，整座立面滑入动态倾势`,
      why: `人眼对 0° 水平线与 90° 垂线极度敏感（斜线效应）。一旦地基偏离水平超过 1.5°，所有竖柱同时失去重力支点，观众的大脑会自动产生「要往${tiltDeg > 0 ? "右" : "左"}滑倒」的紧张感，沉稳气场立刻瓦解。`,
      action: `在画布空白处向${tiltDeg > 0 ? "左" : "右"}横拖（或把底部气泡水平仪拉回 0°），先把地基放平。`,
    });
  }
  if (!orderOk) {
    faults.push({
      code: "float-loose",
      pill: `悬空 +${Math.round(floatPct)}%`,
      headline: `核心石件浮离基座 ${Math.round(floatPct)}%，画面悬在半空没坐实`,
      why: "静态构图依靠清晰模块间的承托关系建立秩序。现在圆石与方座脱节浮起，眼睛找不到承重支点，结构立刻变成零散漂浮的碎片。",
      action: "直接按住画布上浮起的青石球或白圆向下压回基座（或把「接地落位」拉到 0%）。",
    });
  }
  if (!balanceOk) {
    if (topHeavy) {
      faults.push({
        code: "top-heavy",
        pill: `重心浮高 ${Math.round(cogYRatioPct)}%`,
        headline: `视觉重心浮高至 ${Math.round(cogYRatioPct)}%（示意），头重脚轻`,
        why: "在视觉重力里，下方理应更沉厚、上方更轻盈。重块悬得太高会让画面像倒立的石碑，越看越心慌。",
        action: "把浮起的石块向下压实到地基梁，让深炭与青石重量沉回下三分之一区域。",
      });
    } else {
      const sideWord = torquePct > 0 ? "右" : "左";
      faults.push({
        code: torquePct > 0 ? "torque-right" : "torque-left",
        pill: `偏${sideWord} ${torquePct > 0 ? "+" : ""}${Math.round(torquePct)}%`,
        headline: `视觉力矩向${sideWord}沉塌（ΔM ${torquePct > 0 ? "+" : ""}${Math.round(torquePct)}% 示意）`,
        why: `右侧与左侧的视觉重量×力臂没有抵消，底梁下方的支点天平明显向${sideWord}侧下坠。静态构图不强制镜像复制，但左右力矩必须互相托住。`,
        action: `把${sideWord}翼青石球座向中轴微收，或把另一侧石球向外推开加长力臂，让下方天平指针回到 0% 附近。`,
      });
    }
  }
  if (!rhythmOk) {
    faults.push({
      code: "rhythm-chaos",
      pill: `柱距乱拍 ${Math.round(rhythmCvPct)}%`,
      headline: `两侧柱廊宽窄参差（变异度 ${Math.round(rhythmCvPct)}%），打断平静节奏`,
      why: "外翼重复竖柱的作用是像建筑列柱一样输出均匀呼吸。当柱距忽挤忽松、高低错落时，视线被迫反复停顿跳跃，平静感变成噪点。",
      action: "直接点击画布两侧暖石竖柱一键梳理，或把下方「柱廊乱拍度」拉回到 12% 以内。",
    });
  }

  // 识别具体达成了哪种合法静构解
  let solutionKind = null;
  if (passedCount === 4) {
    const lrDiff = Math.abs(Math.abs(layout.params.leftX) - Math.abs(layout.params.rightX));
    const scaleDiff = Math.abs(layout.params.rightScale - 1.0);
    if (lrDiff < 0.025 && scaleDiff < 0.08 && Math.abs(layout.params.centerShift) < 0.025) {
      if (Math.abs(layout.params.leftX) >= 0.315) {
        solutionKind = {
          code: "pass-wide",
          tag: "4/4 · 宽翼沉稳解",
          headline: "4/4 静态稳固 — 宽翼柱廊展幅，气场低平舒展",
          why: `地基严守 ${tiltDeg.toFixed(1)}° 水平，双翼镇石坐宽且力矩仅差 ${Math.round(absTorque)}%（示意），重心稳落 ${Math.round(cogYRatioPct)}% 低区，像古典神庙台基一样端庄稳重。`,
          action: "按 Space 试一次「重力沉降测试」，验证横向扰动下整座立面依然纹丝不动。",
        };
      } else {
        solutionKind = {
          code: "pass-classic",
          tag: "4/4 · 对称圣坛解",
          headline: "4/4 静态稳固 — 达成 089 原海报经典对称秩序",
          why: `水平倾角 ${tiltDeg.toFixed(1)}°、左右视觉力矩 ΔM ${Math.round(torquePct)}%（示意）、柱廊变异度 ${Math.round(rhythmCvPct)}%、块件全部坐实地基，完美呈现安定、均衡、平静、有序四重静构特征。`,
          action: "还可以试试「非对称杠杆解」或手动拉近重球、推远轻球：不镜像照样能 4/4 静稳！",
        };
      }
    } else {
      solutionKind = {
        code: "pass-asym",
        tag: "4/4 · 非对称均衡解",
        headline: "4/4 静态稳固 — 不靠死对称，一样端平视觉天平",
        why: `左右块件位置与体量并不镜像，但通过「大块靠轴、小块远伸」的杠杆抵消，实测力矩偏差仅 ${Math.round(absTorque)}%（示意），同时守住水平基线、均匀柱廊与落地承托。`,
        action: "这正是阿恩海姆与蒙德里安推崇的静态均衡：安静，但绝不呆板。",
      };
    }
  }

  const primary = faults[0] || solutionKind;

  return {
    layout,
    passedCount,
    totalChecks: 4,
    metrics: {
      tiltDeg,
      absTilt,
      torquePct,
      absTorque,
      cogX,
      cogY,
      cogYRatioPct,
      rhythmCvPct,
      floatPct,
      avgFloatPct: (avgFloat / 0.24) * 100,
    },
    checks: {
      stability: {
        ok: stabilityOk,
        badge: stabilityOk ? `正交 ${tiltDeg.toFixed(1)}°` : `倾 ${tiltDeg > 0 ? "+" : ""}${tiltDeg.toFixed(1)}°`,
      },
      balance: {
        ok: balanceOk,
        badge: balanceOk
          ? `ΔM ${torquePct >= 0 ? "+" : ""}${Math.round(torquePct)}%`
          : topHeavy
            ? `重心 ${Math.round(cogYRatioPct)}%`
            : `偏${torquePct > 0 ? "右" : "左"} ${Math.round(absTorque)}%`,
      },
      rhythm: {
        ok: rhythmOk,
        badge: rhythmOk ? `匀拍 ${Math.round(rhythmCvPct)}%` : `乱拍 ${Math.round(rhythmCvPct)}%`,
      },
      order: {
        ok: orderOk,
        badge: orderOk ? "坐实地基" : `悬空 ${Math.round(floatPct)}%`,
      },
    },
    faults,
    primary,
    statusPill:
      passedCount === 4
        ? solutionKind.tag
        : `${passedCount}/4 · ${faults[0].pill}`,
  };
}

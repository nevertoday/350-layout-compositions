// 175 双边系统 · 单真源几何与双向诊断模型
// 画布绘制、顶栏三词状态、底部圆形徽章与文字诊单全部从同一组实绘几何计算，零写死常量。

export const PALETTE = {
  paper: "#F7E9D2",
  paperLight: "#FCF4E7",
  paperSand: "#F2E4CC",
  paperDeep: "#EFE0C6",
  green: "#113F29",
  greenSoft: "#1A5639",
  greenDarkRoom: "#0C2A1B",
  greenChamber: "#143B27",
  greenMint: "#7CE0A8",
  orange: "#ED731C",
  orangeTextLight: "#A63F04",
  orangeTextDark: "#FF9A52",
  ink: "#0F0F0E",
  inkMuted: "#363C38",
  dangerLight: "#B6261E",
  dangerDark: "#FF7A70",
  rule: "#CBBCA4",
};

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报 · 双半圆对话",
    shortLabel: "原海报",
    caption: "1:1 复原 175 原海报的深松双半圆、对望橘核、外侧点阵与双翼四道排印线",
  },
  titlepage: {
    id: "titlepage",
    label: "古典扉页 · 轴心排印",
    shortLabel: "古典扉页",
    caption: "呼应阿尔杜斯、博多尼与奇肖尔德的居中扉页，演示断行轮廓与轴心居中",
  },
  dialogue: {
    id: "dialogue",
    label: "双栏对谈 · 展册镜像",
    shortLabel: "双栏对谈",
    caption: "左栏中文靠轴右齐、右栏英文靠轴左齐，在中缝两侧展开对等对话",
  },
};

export const PRESETS = {
  broken: {
    label: "复原开场错态",
    kind: "reset",
    state: {
      axisX: 0.61,
      corridorGap: 0.28,
      rightWeight: 0.58,
      verticalDelta: -32,
      orbMode: "outward",
      alignMode: "flush-left",
      opticalVariant: "mirror",
    },
  },
  classic: {
    label: "原海报经典解",
    kind: "solution",
    state: {
      axisX: 0.50,
      corridorGap: 0.14,
      rightWeight: 1.00,
      verticalDelta: 0,
      orbMode: "facing",
      alignMode: "bilateral",
      opticalVariant: "mirror",
    },
  },
  airy: {
    label: "舒展留气解",
    kind: "solution",
    state: {
      axisX: 0.50,
      corridorGap: 0.20,
      rightWeight: 0.96,
      verticalDelta: 0,
      orbMode: "facing",
      alignMode: "bilateral",
      opticalVariant: "mirror",
    },
  },
  optical: {
    label: "异形光学配重解",
    kind: "solution",
    state: {
      axisX: 0.50,
      corridorGap: 0.13,
      rightWeight: 1.00,
      verticalDelta: 0,
      orbMode: "facing",
      alignMode: "bilateral",
      opticalVariant: "optical-pair",
    },
  },
  errAxisLeft: {
    label: "试错：左偏失轴",
    kind: "error",
    state: {
      axisX: 0.37,
      corridorGap: 0.14,
      rightWeight: 1.00,
      verticalDelta: 0,
      orbMode: "facing",
      alignMode: "bilateral",
      opticalVariant: "mirror",
    },
  },
  errCrush: {
    label: "试错：中缝撞死",
    kind: "error",
    state: {
      axisX: 0.50,
      corridorGap: 0.01,
      rightWeight: 1.00,
      verticalDelta: 0,
      orbMode: "colliding",
      alignMode: "bilateral",
      opticalVariant: "mirror",
    },
  },
  errRightHeavy: {
    label: "试错：右沉错牙",
    kind: "error",
    state: {
      axisX: 0.50,
      corridorGap: 0.14,
      rightWeight: 1.44,
      verticalDelta: 28,
      orbMode: "facing",
      alignMode: "bilateral",
      opticalVariant: "mirror",
    },
  },
  errFlat: {
    label: "试错：僵砖无阶",
    kind: "error",
    state: {
      axisX: 0.50,
      corridorGap: 0.14,
      rightWeight: 1.00,
      verticalDelta: 0,
      orbMode: "facing",
      alignMode: "flat-slab",
      opticalVariant: "mirror",
    },
  },
};

export function createInitialState() {
  return {
    specimen: "poster",
    mirrorLock: true,
    highlightKey: null,
    showGuides: true,
    ...PRESETS.broken.state,
  };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function sanitizeState(s) {
  s.axisX = clamp(Number(s.axisX) || 0.5, 0.32, 0.68);
  s.corridorGap = clamp(Number(s.corridorGap) || 0.14, 0.0, 0.34);
  s.rightWeight = clamp(Number(s.rightWeight) || 1.0, 0.45, 1.55);
  s.verticalDelta = clamp(Math.round(Number(s.verticalDelta) || 0), -44, 44);
  if (!["facing", "outward", "colliding"].includes(s.orbMode)) s.orbMode = "facing";
  if (!["bilateral", "flush-left", "flat-slab"].includes(s.alignMode)) s.alignMode = "bilateral";
  if (!["mirror", "optical-pair"].includes(s.opticalVariant)) s.opticalVariant = "mirror";
  if (!SPECIMENS[s.specimen]) s.specimen = "poster";
  return s;
}

/**
 * 从当前状态与画布逻辑尺寸计算唯一真源实绘几何
 */
export function computeLayout(state, W, H) {
  const s = sanitizeState({ ...state });
  const padX = Math.max(24, W * 0.055);
  const padTop = Math.max(22, H * 0.07);
  const padBot = Math.max(20, H * 0.07);

  const axisPx = W * s.axisX;
  const centerY = H * 0.455;
  const halfGapPx = (W * s.corridorGap) / 2;

  // 基准半径自适应横竖画布
  const baseRadius = Math.min(H * 0.295, W * 0.175);
  const leftRadius = baseRadius;
  const rightScale = Math.sqrt(s.rightWeight); // 面积随 rightWeight 线性变化
  const rightRadius = clamp(baseRadius * rightScale, baseRadius * 0.62, baseRadius * 1.28);

  const leftChordX = axisPx - halfGapPx;
  const rightChordX = axisPx + halfGapPx;

  const leftCenterY = centerY;
  const rightCenterY = centerY + (s.verticalDelta / 44) * Math.min(44, H * 0.11);

  const leftOrbR = leftRadius * 0.255;
  const rightOrbR = rightRadius * 0.255;

  // 橘核位置：facing 在内切弦上对望；outward 背到弧外缘失联；colliding 撞向中轴重叠
  let leftOrbX = leftChordX;
  let rightOrbX = rightChordX;
  if (s.orbMode === "outward") {
    leftOrbX = leftChordX - leftRadius * 0.98;
    rightOrbX = rightChordX + rightRadius * 0.98;
  } else if (s.orbMode === "colliding") {
    const pull = Math.min(halfGapPx, Math.max(leftOrbR * 0.45, halfGapPx * 0.85));
    leftOrbX = axisPx - Math.max(4, leftOrbR * 0.35) + (halfGapPx < leftOrbR ? 2 : 0) - (pull < 0 ? 0 : 0);
    rightOrbX = axisPx + Math.max(4, rightOrbR * 0.35);
  }

  // 外侧点阵外框（贴紧半圆外缘）
  const leftDotW = leftRadius * 1.18;
  const leftDotH = leftRadius * 1.92;
  const leftDotBox = {
    x: leftChordX - leftRadius * 1.38,
    y: leftCenterY - leftDotH / 2,
    w: leftDotW,
    h: leftDotH,
  };
  const rightDotW = rightRadius * 1.18;
  const rightDotH = rightRadius * 1.92;
  const rightDotBox = {
    x: rightChordX + rightRadius * 0.2,
    y: rightCenterY - rightDotH / 2,
    w: rightDotW,
    h: rightDotH,
  };

  // 底部四道水平排印线（实绘宽度与位置）
  const barGap = Math.max(9, H * 0.025);
  const barThickness = Math.max(3, H * 0.011);
  const leftBarBaseY = leftCenterY + leftRadius + Math.max(18, H * 0.055);
  const rightBarBaseY = rightCenterY + rightRadius + Math.max(18, H * 0.055);

  const leftBarFullW = leftRadius * 1.38;
  const rightBarFullW = rightRadius * 1.38;

  const barProfiles =
    s.alignMode === "flat-slab"
      ? [1, 1, 1, 1]
      : s.alignMode === "flush-left"
      ? [1.0, 0.72, 0.88, 0.56]
      : [1.0, 0.96, 0.92, 0.84];

  const leftBars = barProfiles.map((ratio, idx) => {
    const bw = leftBarFullW * ratio;
    const bx = s.alignMode === "flush-left" ? leftDotBox.x : leftChordX - bw;
    return { x: bx, y: leftBarBaseY + idx * barGap, w: bw, h: barThickness };
  });
  const rightBars = barProfiles.map((ratio, idx) => {
    const bw = rightBarFullW * ratio;
    const bx = s.alignMode === "flush-left" ? rightChordX + (rightBarFullW - bw) * 0.25 : rightChordX;
    return { x: bx, y: rightBarBaseY + idx * barGap, w: bw, h: barThickness };
  });

  // 实绘光学墨面积积分（单真源配重计算！）
  // 左翼：半圆面积 + 橘核等效视觉重量 + 4 条排线墨面积
  const leftSemiArea = 0.5 * Math.PI * leftRadius * leftRadius;
  const leftOrbArea = Math.PI * leftOrbR * leftOrbR * 1.35; // 暖高饱和橘红视觉权重系数 1.35×
  const leftBarsArea = leftBars.reduce((acc, b) => acc + b.w * b.h * 2.4, 0);
  const leftInkArea = leftSemiArea + leftOrbArea + leftBarsArea;

  // 右翼：如果是 optical-pair（异形光学配重），右翼绘成深松建筑双拱框 + 充实排印块，
  // 通过单真源真实面积求和验证「不同形状依然能达到光学平衡」！
  let rightInkArea;
  if (s.opticalVariant === "optical-pair") {
    const archStrokeArea = Math.PI * rightRadius * (rightRadius * 0.26); // 厚实外框墨面积
    const innerRectArea = rightRadius * rightRadius * 0.72; // 内部深松碑块 + 细线密度
    const rightOrbArea = Math.PI * rightOrbR * rightOrbR * 1.35;
    const rightBarsArea = rightBars.reduce((acc, b) => acc + b.w * b.h * 2.4, 0);
    rightInkArea = archStrokeArea + innerRectArea + rightOrbArea + rightBarsArea;
  } else {
    const rightSemiArea = 0.5 * Math.PI * rightRadius * rightRadius;
    const rightOrbArea = Math.PI * rightOrbR * rightOrbR * 1.35;
    const rightBarsArea = rightBars.reduce((acc, b) => acc + b.w * b.h * 2.4, 0);
    rightInkArea = rightSemiArea + rightOrbArea + rightBarsArea;
  }

  // 外边界安全检测（是否冲出或贴死画布边沿）
  const leftOuterX = Math.min(leftChordX - leftRadius, leftDotBox.x);
  const rightOuterX = Math.max(rightChordX + rightRadius, rightDotBox.x + rightDotBox.w);
  const leftMarginRatio = leftOuterX / W;
  const rightMarginRatio = (W - rightOuterX) / W;
  const minMarginRatio = Math.min(leftMarginRatio, rightMarginRatio);
  const marginOverflow = minMarginRatio < 0.015;

  // 古典扉页标本实绘行几何（受完全同一组状态驱动）
  const titleLines = [
    { text: "双 边 秩 序 论", role: "title", baseW: 0.42, size: 32 },
    { text: "ON BILATERAL TYPOGRAPHY", role: "sub", baseW: 0.34, size: 13 },
    { text: "轴 心 · 配 重 · 对 话", role: "lead", baseW: 0.28, size: 15 },
    { text: "阿尔杜斯与博多尼之居中传统", role: "body", baseW: 0.36, size: 14 },
    { text: "VENICE · PARMA · BASEL", role: "meta", baseW: 0.22, size: 11 },
    { text: "MDCCCXVIII", role: "colophon", baseW: 0.14, size: 11 },
  ].map((row, idx) => {
    const lineW = W * (s.alignMode === "flat-slab" ? 0.38 : row.baseW);
    const skew = ((s.rightWeight - 1) * 46) * (idx % 2 === 0 ? 1 : -0.65);
    const leftEdge =
      s.alignMode === "flush-left"
        ? axisPx - W * 0.26
        : axisPx - lineW / 2 + skew;
    const y = padTop + H * 0.14 + idx * Math.max(36, H * 0.115) + (idx >= 3 ? (s.verticalDelta / 44) * 14 : 0);
    return { ...row, x: leftEdge, y, w: lineW, centerX: leftEdge + lineW / 2 };
  });

  // 实测指标（全部从上述实绘坐标算出！）
  const axisOffsetPct = Math.round((s.axisX - 0.5) * 100);
  const actualCorridorPx = Math.max(0, rightChordX - leftChordX);
  const corridorRatioPct = Math.round((actualCorridorPx / W) * 100);
  const weightRatioPct = Math.round((rightInkArea / Math.max(1, leftInkArea)) * 100);
  const deltaYPx = Math.round(rightCenterY - leftCenterY);
  const orbDistPx = Math.round(Math.hypot(rightOrbX - leftOrbX, rightCenterY - leftCenterY));
  const orbTouching = orbDistPx < (leftOrbR + rightOrbR) * 1.15;

  // 四项单真源硬校验
  const axisOk = Math.abs(s.axisX - 0.5) <= 0.025;
  const levelOk = Math.abs(deltaYPx) <= 8;
  const symmetryOk = axisOk && levelOk && !marginOverflow;
  const balanceOk = weightRatioPct >= 88 && weightRatioPct <= 112;
  const corridorOk = corridorRatioPct >= 5 && corridorRatioPct <= 23;
  const orbOk = s.orbMode === "facing" && !orbTouching;
  const dialogueOk = corridorOk && orbOk;
  const typeOk = s.alignMode === "bilateral";

  const checks = {
    symmetry: symmetryOk,
    balance: balanceOk,
    dialogue: dialogueOk,
    typography: typeOk,
  };
  const passedCount = Object.values(checks).filter(Boolean).length;
  const allPass = passedCount === 4;

  // 双向错态诊断（按结构优先级输出白话原因与纠偏动作）
  let fault = null;
  if (!axisOk) {
    const dir = axisOffsetPct > 0 ? "右" : "左";
    const opp = axisOffsetPct > 0 ? "左" : "右";
    fault = {
      id: axisOffsetPct > 0 ? "axis-right" : "axis-left",
      badge: `轴偏${dir} ${Math.abs(axisOffsetPct)}%`,
      title: `垂直中轴向${dir}偏了 ${Math.abs(axisOffsetPct)}%，双边秩序当场歪斜`,
      why: `人眼对垂直镜像轴极其敏感（Wagemans, 1997）：一旦中轴离开画心 50%，版面既失去了双边的端正安稳，又不够决绝到像不对称构图那样造势，只会显得「没对齐」。`,
      action: `拖动画布底端中轴柄（或调中轴位置滑轨）向${opp}回到画心 50%（靠近中线会轻轻吸附）。`,
    };
  } else if (marginOverflow) {
    fault = {
      id: "margin-choke",
      badge: "外缘冲框",
      title: `两翼外侧已贴死画框边缘，呼吸留白被榨干`,
      why: `双边系统靠四周对称留白托住中心仪式感；当两翼撑破页边安全区，中轴的汇聚力立刻散掉，整张图变得局促压迫。`,
      action: `把中缝距适当往回缩，或把右翼体量降回 100% 附近，留出外侧护边气口。`,
    };
  } else if (!levelOk) {
    const dir = deltaYPx < 0 ? "上提" : "下坠";
    fault = {
      id: "vertical-misalign",
      badge: `纵错 ${deltaYPx > 0 ? "+" : ""}${deltaYPx}px`,
      title: `右翼相对左翼${dir}了 ${Math.abs(deltaYPx)}px，水平镜像基线断开`,
      why: `双边对话需要共同的水平视线地平线。左右两翼高低错牙超过 8px 后，眼球来回对照时不断上下跳跃，平静稳定的对称感立刻解体。`,
      action: `把「纵位错差 ΔY」调回 0px，或直接在画布上微调右翼回到中位水平线。`,
    };
  } else if (!balanceOk) {
    const heavier = weightRatioPct < 88 ? "左重右轻" : "右重左轻";
    fault = {
      id: weightRatioPct < 88 ? "weight-left" : "weight-right",
      badge: `${heavier} ${weightRatioPct}%`,
      title: `左右实绘墨重比失衡（右翼占左翼 ${weightRatioPct}%），天平向${weightRatioPct < 88 ? "左" : "右"}翻倒`,
      why: `双边系统的核心是视觉力矩相等。现在一侧体量明显压过另一侧，视线会被重翼单向拖走，原本的对等关系退化成一强一弱的偏瘫版式。`,
      action: `调节「右翼配重比」滑轨（或拖右翼外缘把手），让左右光学墨重比落在 88%–112% 之间。`,
    };
  } else if (corridorRatioPct < 5 || s.orbMode === "colliding" || orbTouching) {
    fault = {
      id: "corridor-crush",
      badge: `中缝挤撞 ${corridorRatioPct}%`,
      title: `中缝仅剩 ${corridorRatioPct}%（橘核相撞），两翼糊成一团`,
      why: `双边系统不是把两半粘成一个大圆。失去清晰中缝后，垂直轴线被图形吞没，两翼之间没有呼吸与对望余地，「对话」退化成拥堵。`,
      action: `在画布上向右横拖拉开中缝至 7%–22%，并点击橘核切回「向轴对望」。`,
    };
  } else if (corridorRatioPct > 23) {
    fault = {
      id: "corridor-split",
      badge: `中缝撕裂 ${corridorRatioPct}%`,
      title: `中缝拉宽到 ${corridorRatioPct}%，左右两翼断成两张孤立半图`,
      why: `视觉对话依赖适度的邻近耦合。一旦中缝跨度过大，眼球跨轴跳跃成本骤增，左侧和右侧不再互相呼应，双边整体感彻底散架。`,
      action: `在画布上向左横拖收拢中缝距，回到 7%–22% 的清晰对话带。`,
    };
  } else if (s.orbMode === "outward") {
    fault = {
      id: "orb-outward",
      badge: "橘核背离",
      title: `双橘核翻到了外背，两翼背对背拒绝交流`,
      why: `原海报最精妙的一笔，是两枚炙柿橘红圆核紧贴内侧直弦隔轴相望，把视线牢牢锁在中轴走廊里；翻到外缘后，焦点向左右逃散，中轴立刻变空。`,
      action: `直接点击画布上的橘红圆核（或下方按钮），把它们翻回「向轴对望」。`,
    };
  } else if (s.alignMode === "flush-left") {
    fault = {
      id: "align-broken",
      badge: "单向左齐破轴",
      title: `底部排印线硬套单向左齐，拉偏了对称轴的视觉重心`,
      why: `当图形围绕中轴镜像排布，底部文字却一律机械左齐时，左翼字行远离中轴、右翼贴紧中轴，排印重心和图形中轴互相打架。`,
      action: `把排印语法切回「向轴对称 / 靠轴对望」，让文字也顺着中轴展开对话。`,
    };
  } else if (s.alignMode === "flat-slab") {
    fault = {
      id: "align-flat",
      badge: "等宽僵砖",
      title: `所有行强行齐平拉成死板方块，双边排印失去了轮廓韵律`,
      why: `金伯利·伊拉姆（2007）提醒：纯对称最怕沦为毫无呼吸的墓碑块。没有长短收束与层级落差，读者一眼扫过去找不到入口。`,
      action: `切换「向轴对称」恢复逐行自然收束的轮廓节奏。`,
    };
  }

  // 多种合法解精准命名
  let passKind = "pass-custom";
  let passTitle = "双边系统全部成立：对称、平衡与对话达成同拍";
  let passWhy = "中轴稳居画心、左右光学配重均衡、橘核隔轴相望且排印语法顺从中心轴。按下空格发射对称脉冲波，可以看到左右两翼在同一拍收到视觉回响。";
  if (allPass) {
    if (s.opticalVariant === "optical-pair") {
      passKind = "pass-optical";
      passTitle = "异形光学配重解成立：形态不同，天平依然端平";
      passWhy = `左翼实心深松半圆与右翼建筑双拱字块形态迥异，但实测光学墨重比落在 ${weightRatioPct}%——印证了奇肖尔德的观点：双边平衡讲的是视觉重量对等，而不只是机械复制。`;
    } else if (corridorRatioPct >= 18) {
      passKind = "pass-airy";
      passTitle = "舒展留气解成立：中缝开阔而不失对望张力";
      passWhy = `中缝占宽 ${corridorRatioPct}%，留白比经典构图更通透，适合画廊展签、典籍封面与高级品牌纪念页；同时橘核对望保持了跨越中缝的向心联系。`;
    } else {
      passKind = "pass-classic";
      passTitle = "原海报经典解成立：严格镜像下的稳定与友好对话";
      passWhy = `中轴稳锁 50%（偏移 ${axisOffsetPct}%）、左右墨重比 ${weightRatioPct}%、中缝 ${corridorRatioPct}% 且橘核隔轴对望，完整复现 175 原海报的克制秩序。`;
    }
  }

  // 右下角活体圆形双边徽章的实时倾角与偏心
  const weightError = (weightRatioPct - 100) / 100; // 负=左重，正=右重
  const emblemTiltDeg = clamp(weightError * 26 + (deltaYPx / 44) * 10, -24, 24);
  const emblemAxisShift = clamp((s.axisX - 0.5) * 48, -14, 14);

  const severityLabel = allPass
    ? "4/4 双边秩序成立"
    : passedCount === 0
    ? "四重破轴（示意）"
    : `尚有 ${4 - passedCount} 处失衡（示意）`;

  const pillarStatus = {
    symmetry: {
      ok: symmetryOk,
      tag: !axisOk
        ? `偏${axisOffsetPct > 0 ? "右" : "左"} ${Math.abs(axisOffsetPct)}%`
        : !levelOk
        ? `错牙 ${deltaYPx > 0 ? "+" : ""}${deltaYPx}px`
        : marginOverflow
        ? "外缘冲框"
        : "中轴端正",
    },
    balance: {
      ok: balanceOk,
      tag: balanceOk
        ? s.opticalVariant === "optical-pair"
          ? `光学 ${weightRatioPct}%`
          : `对等 ${weightRatioPct}%`
        : `${weightRatioPct < 88 ? "左沉" : "右沉"} ${weightRatioPct}%`,
    },
    dialogue: {
      ok: dialogueOk && typeOk,
      tag:
        corridorRatioPct < 5 || s.orbMode === "colliding" || orbTouching
          ? `挤撞 ${corridorRatioPct}%`
          : corridorRatioPct > 23
          ? `撕裂 ${corridorRatioPct}%`
          : s.orbMode === "outward"
          ? "橘核失联"
          : !typeOk
          ? s.alignMode === "flush-left"
            ? "左齐破轴"
            : "僵砖无阶"
          : `对话 ${corridorRatioPct}%`,
    },
  };

  return {
    state: s,
    W,
    H,
    padX,
    padTop,
    padBot,
    axisPx,
    centerY,
    halfGapPx,
    leftWing: {
      chordX: leftChordX,
      centerY: leftCenterY,
      radius: leftRadius,
      orbX: leftOrbX,
      orbY: leftCenterY,
      orbR: leftOrbR,
      dotBox: leftDotBox,
      bars: leftBars,
      inkArea: leftInkArea,
      outerX: leftOuterX,
    },
    rightWing: {
      chordX: rightChordX,
      centerY: rightCenterY,
      radius: rightRadius,
      orbX: rightOrbX,
      orbY: rightCenterY,
      orbR: rightOrbR,
      dotBox: rightDotBox,
      bars: rightBars,
      inkArea: rightInkArea,
      outerX: rightOuterX,
    },
    titleLines,
    metrics: {
      axisOffsetPct,
      weightRatioPct,
      corridorRatioPct,
      deltaYPx,
      orbDistPx,
      minMarginPct: Math.round(minMarginRatio * 100),
    },
    checks,
    audit: {
      passedCount,
      total: 4,
      allPass,
      passKind,
      badgeText: allPass ? `4/4 · ${s.opticalVariant === "optical-pair" ? "光学配重" : "双边成立"}` : `${passedCount}/4 · ${fault.badge}`,
      severityLabel,
      faultId: fault ? fault.id : null,
      title: allPass ? passTitle : fault.title,
      why: allPass ? passWhy : fault.why,
      action: allPass ? "试试切到「异形光学配重」或拖移中轴与右翼，亲手感受打破边界的临界点。" : fault.action,
      emblemTiltDeg,
      emblemAxisShift,
      pillarStatus,
    },
  };
}

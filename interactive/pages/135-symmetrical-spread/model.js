// 135 对称跨页 · 单真源几何模型与诊断引擎
// 画布绘制、读数指标、四柱探针与诊单建议全部从此模块实时算出，杜绝硬编码常量。

export const PALETTE = {
  obsidian: "#050606",
  obsidianSoft: "#0C0F0E",
  pageDark: "#0B0E0D",
  pageCream: "#F5EFE2",
  emerald: "#0A6554",
  emeraldBright: "#2EB59A",
  emeraldDeep: "#064E40",
  rose: "#F2486A",
  roseBright: "#FF708D",
  roseDeep: "#B01D3D",
  ivory: "#EFE6D2",
  ivoryBright: "#F8F3E8",
  ivoryMuted: "#9F9D92",
  hairline: "#343936",
  ok: "#39C6A8",
  warn: "#F2B654",
  bad: "#FF637E",
};

// 物理装订参数（以标准 210mm 单页宽画册为经验换算基准）
export const BINDINGS = {
  perfect: {
    id: "perfect",
    label: "胶装紧订",
    en: "PERFECT BOUND",
    curvePct: 9.8,      // 单页宽度内被弯折与阴影侵蚀的经验占比（约 20.5mm 弯折影响区，安全线 ~21mm）
    safeInnerPct: 10.0, // 安全内订口下限（%）
    valleyDepth: 25,    // 画布顶部与底部脊线弯折深度
    shadowAlpha: 0.72,
    note: "书脊厚且胶层硬，近中缝约 10% 页宽会向下弯折并落入阴影（经验估算）。",
  },
  saddle: {
    id: "saddle",
    label: "骑马订",
    en: "SADDLE-STITCH",
    curvePct: 6.2,
    safeInnerPct: 7.0,
    valleyDepth: 13,
    shadowAlpha: 0.44,
    note: "薄刊中缝骑钉，摊开较顺畅，但仍需留出约 7% 订口防视觉粘连（经验估算）。",
  },
  layflat: {
    id: "layflat",
    label: "锁线平摊",
    en: "SMYTH LAY-FLAT",
    curvePct: 3.4,
    safeInnerPct: 5.5,
    valleyDepth: 5,
    shadowAlpha: 0.24,
    note: "锁线精装几乎可 180° 平摊，中缝折损极小，内订口只需保留呼吸余量（经验估算）。",
  },
};

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报·几何典籍",
    en: "POSTER 135 FOLIO",
    theme: "dark",
    baseInnerPct: 11.5,
    baseOuterPct: 9.2,
    topPct: 8.5,
    bottomPct: 10.0,
    leftLabel: "左页 VERSO · 几何母题",
    rightLabel: "右页 RECTO · 镜像呼应",
    titleL: "轴线 · 平衡",
    titleR: "镜像 · 秩序",
  },
  architecture: {
    id: "architecture",
    label: "建筑画册·双页展",
    en: "ARCHITECTURAL MONOGRAPH",
    theme: "dark",
    baseInnerPct: 12.2,
    baseOuterPct: 10.6,
    topPct: 9.5,
    bottomPct: 12.0,
    leftLabel: "FIG. 01 · 东立面拱廊",
    rightLabel: "FIG. 02 · 西立面拱廊",
    titleL: "空间轴度",
    titleR: "对称立面",
  },
  codex: {
    id: "codex",
    label: "古典书卷·双页章",
    en: "CLASSICAL CODEX",
    theme: "cream",
    baseInnerPct: 11.1, // 经典 1/9 内订口
    baseOuterPct: 20.5, // 宽裕外切口拇指位
    topPct: 11.1,
    bottomPct: 20.0,
    leftLabel: "LIBER IV · 典籍左页",
    rightLabel: "CAPUT II · 典籍右页",
    titleL: "双页同构",
    titleR: "对唱几何",
  },
};

export const MODES = {
  translation: { id: "translation", label: "平移复制（错）", en: "TRANSLATION" },
  mirror: { id: "mirror", label: "中轴镜像", en: "AXIAL MIRROR" },
  counterweight: { id: "counterweight", label: "异形等重", en: "COUNTERWEIGHT" },
};

// 开场刻意停在 0/4 复合错态：平移复制 + 胶装紧订吞噬订口 + 跨缝基线错牙 + 右页偏轻失重
export const INITIAL_STATE = {
  specimen: "poster",
  mode: "translation",
  binding: "perfect",
  rectoShift: -7.2, // 拉进胶装阴影区（inner 塌缩至 ~4.3%，远低于 10% 门槛）
  deltaY: 22,       // 跨缝水平基线错位 +22px
  rectoScale: 0.66, // 右页玫红主圆偏轻，天平左倾
  foldOpen: false,
  guides: true,
};

// 多组合法解与主动试错预设
export const PRESETS = {
  posterMirror: {
    label: "原海报镜像解",
    kind: "good",
    patch: { specimen: "poster", mode: "mirror", binding: "layflat", rectoShift: 0, deltaY: 0, rectoScale: 1.0 },
  },
  counterweightGood: {
    label: "异形等重解",
    kind: "good",
    patch: { specimen: "architecture", mode: "counterweight", binding: "saddle", rectoShift: 0, deltaY: 0, rectoScale: 1.0 },
  },
  codexClassic: {
    label: "古典宽边解",
    kind: "good",
    patch: { specimen: "codex", mode: "mirror", binding: "perfect", rectoShift: 0.4, deltaY: 0, rectoScale: 1.0 },
  },
  errTranslate: {
    label: "试错：平移复制",
    kind: "bad",
    patch: { mode: "translation", binding: "layflat", rectoShift: 0, deltaY: 0, rectoScale: 1.0 },
  },
  errSwallow: {
    label: "试错：订口吞字",
    kind: "bad",
    patch: { mode: "mirror", binding: "perfect", rectoShift: -8.2, deltaY: 0, rectoScale: 1.0 },
  },
  errHeavy: {
    label: "试错：右重倾塌",
    kind: "bad",
    patch: { mode: "mirror", binding: "saddle", rectoShift: 1.2, deltaY: -18, rectoScale: 1.38 },
  },
  resetBroken: {
    label: "复原开场错态",
    kind: "reset",
    patch: { ...INITIAL_STATE, foldOpen: false },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 在统一逻辑坐标系下生成真实几何、计算吞噬量、力矩与 8 类双向诊断
// compact=true 时（手机竖屏）切为古典 2:3 窄高书卷比例，消除上下黑边并保持全部圆形 strictly 1:1
export function computeSpread(raw, opts = {}) {
  const compact = Boolean(opts.compact);
  const s = {
    specimen: SPECIMENS[raw.specimen] ? raw.specimen : "poster",
    mode: MODES[raw.mode] ? raw.mode : "translation",
    binding: BINDINGS[raw.binding] ? raw.binding : "perfect",
    rectoShift: clamp(Number(raw.rectoShift ?? 0), -10.5, 11.5),
    deltaY: clamp(Number(raw.deltaY ?? 0), -34, 34),
    rectoScale: clamp(Number(raw.rectoScale ?? 1), 0.56, 1.44),
    foldOpen: Boolean(raw.foldOpen),
    guides: raw.guides !== false,
  };

  const spec = SPECIMENS[s.specimen];
  const bind = BINDINGS[s.binding];

  // 逻辑画幅几何（宽屏为舒展宽幅画册，竖屏为经典 2:3 书卷；顶部留出 32px 净空给订口实测标尺，底部留足光学天平最大倾角余量）
  const W = compact ? 740 : 1040;
  const H = compact ? 630 : 492;
  const spineX = W * 0.5;
  const pageW = compact ? 336 : 458;
  const pageH = compact ? 504 : 384;
  const bookTop = compact ? 34 : 32;
  const bookBottom = bookTop + pageH;
  const leftEdge = spineX - pageW;
  const rightEdge = spineX + pageW;

  const gutterBandPx = (bind.curvePct / 100) * pageW;
  const safeInnerPx = (bind.safeInnerPct / 100) * pageW;

  // 左页（Verso）基准边距（固定为参考页）
  const versoInnerPct = spec.baseInnerPct;
  const versoOuterPct = spec.baseOuterPct;
  const versoInnerPx = (versoInnerPct / 100) * pageW;
  const versoOuterPx = (versoOuterPct / 100) * pageW;
  const versoBox = {
    x: leftEdge + versoOuterPx,
    y: bookTop + (spec.topPct / 100) * pageH,
    w: pageW - versoInnerPx - versoOuterPx,
    h: pageH * (1 - (spec.topPct + spec.bottomPct) / 100),
  };

  // 右页（Recto）真实边距（受 rectoShift 与 deltaY 驱动）
  const shiftPx = (s.rectoShift / 100) * pageW;
  const rectoInnerPx = clamp(versoInnerPx + shiftPx, 4, pageW * 0.34);
  const actualShiftPx = rectoInnerPx - versoInnerPx;
  const rectoInnerPct = (rectoInnerPx / pageW) * 100;

  // 右页版芯框（保持宽度不变以便观察推拉导致的订口挤压与切口挤出）
  const rectoBox = {
    x: spineX + rectoInnerPx,
    y: versoBox.y + s.deltaY,
    w: versoBox.w,
    h: versoBox.h,
  };
  const rectoOuterPx = rightEdge - (rectoBox.x + rectoBox.w);
  const rectoOuterPct = (rectoOuterPx / pageW) * 100;

  // 生成左页真实构件（归一化局部坐标 u ∈ [0, 1] 从外切口向内订口延伸，v ∈ [0, 1] 从顶到底）
  // u = 0 是左页外切口，u = 1 是左页内订口
  const versoParts = buildVersoParts(spec, versoBox);
  const rectoParts = buildRectoParts(spec, rectoBox, s.mode, s.rectoScale);

  // 单真源实测几何边界
  const versoMaxX = Math.max(...versoParts.map((p) => p.maxX));
  const rectoMinX = Math.min(...rectoParts.map((p) => p.minX));
  const rectoMaxX = Math.max(...rectoParts.map((p) => p.maxX));

  const actualVersoInnerPx = spineX - versoMaxX;
  const actualRectoInnerPx = rectoMinX - spineX;
  const actualRectoOuterPx = rightEdge - rectoMaxX;

  const actualVersoInnerPct = (actualVersoInnerPx / pageW) * 100;
  const actualRectoInnerPct = (actualRectoInnerPx / pageW) * 100;
  const actualRectoOuterPct = (actualRectoOuterPx / pageW) * 100;

  // 以单页宽 210mm 做经验毫米换算
  const pxToMm = 210 / pageW;
  const rectoInnerMm = actualRectoInnerPx * pxToMm;
  const safeInnerMm = safeInnerPx * pxToMm;
  const gutterIntrusionPx = Math.max(0, gutterBandPx - actualRectoInnerPx);
  const gutterIntrusionMm = gutterIntrusionPx * pxToMm;
  const outerClipPx = Math.max(0, 15 - actualRectoOuterPx); // 少于约 7.2mm 即压切口

  // 视觉量级与相对中轴力矩（真实面积 × 色块视觉权重）
  const versoMass = versoParts.reduce((acc, p) => acc + p.mass, 0);
  const rectoMass = rectoParts.reduce((acc, p) => acc + p.mass, 0);
  const massRatio = rectoMass / Math.max(1, versoMass);

  const versoTorque = versoParts.reduce((acc, p) => acc + p.mass * Math.max(12, spineX - p.cx), 0);
  const rectoTorque = rectoParts.reduce((acc, p) => acc + p.mass * Math.max(12, p.cx - spineX), 0);
  const torqueRatio = rectoTorque / Math.max(1, versoTorque);

  // 对折验镜重合度估算（把左页沿 spineX 镜像到右页后，比对主图形中心与朝向）
  const mirrorFitPct = computeMirrorFit(versoParts, rectoParts, spineX, s.mode, s.deltaY, s.rectoScale, actualShiftPx);

  // 底部光学天平倾角（负为左沉，正为右沉）
  const beamTiltDeg = clamp((torqueRatio - 1) * 26, -14, 14);

  // 左右订口偏差（绝对百分点）
  const innerDiffPct = Math.abs(actualRectoInnerPct - actualVersoInnerPct);
  const innerGapPct = actualVersoInnerPct + actualRectoInnerPct;

  // ========== 8 类双向真错态评估 ==========
  const errors = [];

  if (s.mode === "translation") {
    errors.push({
      id: "translation",
      pillar: "mirror",
      severity: 100,
      badge: "平移未镜像",
      title: "右页是「平移复制」，不是沿书脊的中轴镜像",
      why: "很多排版新手把左页整体复制右移，导致左页贴外切的深绿竖条与文字块，在右页却撞进书脊中缝，半圆弧也背道而驰。对称跨页的本质是沿装订轴对折反射，点击中轴 ○ 做「对折验镜」就能一眼看穿错位。",
      action: "把「镜像构造」切为「中轴镜像」（或「异形等重」），让左右两页朝向书脊彼此呼应。",
      fixLabel: "切回中轴镜像",
      fixPatch: { mode: "mirror" },
    });
  }

  if (actualRectoInnerPct < bind.safeInnerPct - 0.15) {
    errors.push({
      id: "gutter_swallow",
      pillar: "axis",
      severity: 95,
      badge: `订口吞噬 ${gutterIntrusionMm.toFixed(1)}mm`,
      title: `右页内订口仅 ${rectoInnerMm.toFixed(1)}mm，正被「${bind.label}」书脊吃掉`,
      why: `在${bind.label}下，近中缝约 ${safeInnerMm.toFixed(0)}mm 区域会向下弯折并落入阴影（经验估算）。现在右页版芯陷进装订弯折带 ${gutterIntrusionMm.toFixed(1)}mm，读者必须用力掰平书脊才能勉强看清内侧边线与半圆。`,
      action: `向右横拖画布把右页拉出阴影区，或切换为「锁线平摊」装订降低中缝弯折损耗。`,
      fixLabel: "把右页拉回安全订口",
      fixPatch: { rectoShift: 0 },
    });
  }

  if (actualRectoOuterPct < 3.6) {
    errors.push({
      id: "outer_cramp",
      pillar: "axis",
      severity: 86,
      badge: `外切压边 ${Math.max(0, actualRectoOuterPct).toFixed(1)}%`,
      title: "右页版芯被推向裁切外沿，拇指一翻就会压住画面",
      why: `书籍右页外切口同时承担裁切容差与读者右手拇指握持空间。当前外边距只剩 ${Math.max(0, actualRectoOuterPct * 2.1).toFixed(1)}mm，不仅版面透不过气，而且把装订中缝拉成了割裂的宽谷。`,
      action: "向左横拖画布，让右页外切口与左页对称齐平。",
      fixLabel: "收回右页对齐外边距",
      fixPatch: { rectoShift: 0 },
    });
  } else if (actualRectoInnerPct > spec.baseInnerPct + 6.5) {
    errors.push({
      id: "gutter_chasm",
      pillar: "axis",
      severity: 82,
      badge: `裂谷过宽 ${rectoInnerMm.toFixed(0)}mm`,
      title: "右页偏离书脊太远，整幅跨页被劈成两张孤页",
      why: `中缝两侧留白合起来已达单页宽的 ${innerGapPct.toFixed(0)}%，远远超过左右外切口。视觉凝聚力在中轴处彻底断开，读者不再把这两页看作同一幅对称画面。`,
      action: "向左横拖画布，收拢右页订口使左右两页围绕书脊重新聚拢。",
      fixLabel: "收拢中缝归中",
      fixPatch: { rectoShift: 0 },
    });
  } else if (innerDiffPct > 2.6) {
    const dir = actualRectoInnerPct < actualVersoInnerPct ? "偏左挤缝" : "偏右脱轴";
    errors.push({
      id: "axis_drift",
      pillar: "axis",
      severity: 70,
      badge: `偏轴 ${dir}`,
      title: `左右内订口差了 ${innerDiffPct.toFixed(1)}%，装订中轴失去镜像基准`,
      why: `左页距书脊 ${actualVersoInnerPct.toFixed(1)}%，右页却在 ${actualRectoInnerPct.toFixed(1)}%。人眼对中轴两侧距离极度敏感，哪怕几毫米偏差也会让整个跨页显得「装歪了」。`,
      action: "微调画布横向位置，让右页订口回到与左页相等的距离。",
      fixLabel: "对齐双页中轴",
      fixPatch: { rectoShift: 0 },
    });
  }

  if (Math.abs(s.deltaY) > 5) {
    const dirWord = s.deltaY > 0 ? "下沉" : "上飘";
    errors.push({
      id: "baseline_misalign",
      pillar: "order",
      severity: 78,
      badge: `基线错牙 ${s.deltaY > 0 ? "+" : ""}${Math.round(s.deltaY)}px`,
      title: `右页水平基线比左页${dirWord}了 ${Math.abs(Math.round(s.deltaY))}px，跨缝视线卡顿`,
      why: "读者横扫对称跨页时，依靠同一条隐形水平基线把左页与右页连成整体。右页错牙后，原本应该遥相呼应的色块与字行上下台阶式断开，秩序感瞬间瓦解。",
      action: "把「跨缝基线差 ΔY」调回 0px，或在右页按 ↑ / ↓ 方向键微调齐平。",
      fixLabel: "拉平跨缝基线",
      fixPatch: { deltaY: 0 },
    });
  }

  if (massRatio < 0.84) {
    errors.push({
      id: "weight_light",
      pillar: "balance",
      severity: 74,
      badge: `左重右轻 ${massRatio.toFixed(2)}×`,
      title: `右页视觉分量只有左页的 ${Math.round(massRatio * 100)}%，天平向左沉塌`,
      why: "对称跨页未必每条线都一模一样，但左右两翼的视觉重心必须势均力敌。当前右页玫红主圆与墨量偏小，整本书看起来像左侧压了一块铅坠。",
      action: "点击画布右侧玫红圆，或向右推「右页视觉量级」至 0.90×–1.12× 区间。",
      fixLabel: "补齐右页视觉分量",
      fixPatch: { rectoScale: 1.0 },
    });
  } else if (massRatio > 1.18) {
    errors.push({
      id: "weight_heavy",
      pillar: "balance",
      severity: 74,
      badge: `右重左轻 ${massRatio.toFixed(2)}×`,
      title: `右页视觉分量涨到左页的 ${Math.round(massRatio * 100)}%，跨页向右倾倒`,
      why: "右页主视觉块过度膨胀，把原本稳坐书脊中央的重心硬生生拽向右侧，左页沦为单薄陪衬，破坏双页对唱式的沉稳气场。",
      action: "点击画布右侧玫红圆，或回调「右页视觉量级」让底部天平回归水平。",
      fixLabel: "收回右页分量至平衡",
      fixPatch: { rectoScale: 1.0 },
    });
  }

  errors.sort((a, b) => b.severity - a.severity);

  // 4 柱实时体检（对应原海报：轴线 / 镜像 / 平衡 / 秩序）
  const axisOk =
    actualRectoInnerPct >= bind.safeInnerPct - 0.15 &&
    actualRectoOuterPct >= 3.6 &&
    innerDiffPct <= 2.6;
  const mirrorOk = s.mode === "mirror" || s.mode === "counterweight";
  const balanceOk = massRatio >= 0.84 && massRatio <= 1.18;
  const orderOk = Math.abs(s.deltaY) <= 5 && actualRectoInnerPct >= bind.safeInnerPct - 0.15;

  const pillars = {
    axis: {
      ok: axisOk,
      chip: axisOk
        ? `订口 ${rectoInnerMm.toFixed(0)}mm`
        : actualRectoInnerPct < bind.safeInnerPct - 0.15
        ? `吞噬 ${gutterIntrusionMm.toFixed(1)}mm`
        : actualRectoOuterPct < 3.6
        ? "外切压边"
        : `偏轴 ${innerDiffPct.toFixed(1)}%`,
    },
    mirror: {
      ok: mirrorOk,
      chip:
        s.mode === "mirror"
          ? "中轴反射"
          : s.mode === "counterweight"
          ? "异形等重"
          : "平移错位",
    },
    balance: {
      ok: balanceOk,
      chip: balanceOk
        ? `量级 ${massRatio.toFixed(2)}×`
        : massRatio < 0.84
        ? `左重 ${massRatio.toFixed(2)}×`
        : `右重 ${massRatio.toFixed(2)}×`,
    },
    order: {
      ok: orderOk,
      chip: orderOk
        ? "基线齐平"
        : Math.abs(s.deltaY) > 5
        ? `错牙 ${s.deltaY > 0 ? "+" : ""}${Math.round(s.deltaY)}px`
        : "订口受侵",
    },
  };

  const passCount = [axisOk, mirrorOk, balanceOk, orderOk].filter(Boolean).length;
  const primaryError = errors[0] || null;

  let diagnosis;
  if (passCount === 4) {
    const modeDesc =
      s.mode === "counterweight"
        ? "异形等重对称成立：左右构件形态不同，却共享镜像边距、水平基线与均衡视觉力矩"
        : s.specimen === "codex"
        ? "古典书卷双页对称成立：内订口避开书脊弯折，外切口留出宽裕拇指空间"
        : "中轴对称跨页成立：左右镜像呼应，装订净空与光学天平全部归位";
    diagnosis = {
      ok: true,
      badge: `4/4 · ${s.mode === "counterweight" ? "异形等重解" : "对称成立"}`,
      title: modeDesc,
      why: `当前采用「${bind.label}」，实测右页内订口 ${rectoInnerMm.toFixed(1)}mm（高于 ${safeInnerMm.toFixed(0)}mm 安全线），跨缝基线差 ${Math.abs(Math.round(s.deltaY))}px，左右视觉量级比 ${massRatio.toFixed(2)}×。你也可以切到「胶装紧订」或点「对折验镜」继续压力测试。`,
      action: "试试切换「异形等重」或「古典书卷」，观察多种同样成立的对称跨页解法。",
      fixLabel: s.foldOpen ? "摊平跨页" : "对折验镜核对",
      fixPatch: { foldOpen: !s.foldOpen },
      isFoldAction: true,
    };
  } else {
    diagnosis = {
      ok: false,
      badge: `${passCount}/4 · ${primaryError.badge}`,
      title: primaryError.title,
      why: primaryError.why,
      action: primaryError.action,
      fixLabel: primaryError.fixLabel,
      fixPatch: primaryError.fixPatch,
      isFoldAction: false,
    };
  }

  // 整体态势档位（诚实标注示意，绝不造假精确分）
  let postureLabel = "多重失序（示意）";
  if (passCount === 4) postureLabel = s.mode === "counterweight" ? "异形均衡（示意）" : "镜像稳态（示意）";
  else if (passCount === 3) postureLabel = "差一步归位（示意）";
  else if (passCount === 2) postureLabel = "局部失衡（示意）";

  return {
    state: s,
    spec,
    bind,
    geom: {
      W,
      H,
      spineX,
      pageW,
      pageH,
      bookTop,
      bookBottom,
      leftEdge,
      rightEdge,
      gutterBandPx,
      safeInnerPx,
      versoBox,
      rectoBox,
      versoParts,
      rectoParts,
      actualShiftPx,
      outerClipPx,
    },
    metrics: {
      versoInnerPct: actualVersoInnerPct,
      rectoInnerPct: actualRectoInnerPct,
      rectoOuterPct: actualRectoOuterPct,
      rectoInnerMm,
      safeInnerMm,
      gutterIntrusionMm,
      innerDiffPct,
      massRatio,
      torqueRatio,
      beamTiltDeg,
      mirrorFitPct,
      postureLabel,
      passCount,
    },
    pillars,
    errors,
    diagnosis,
  };
}

// ---------- 构件几何生成器（与渲染共用同一套坐标） ----------

function buildVersoParts(spec, box) {
  const parts = [];
  const x0 = box.x;
  const y0 = box.y;
  const w = box.w;
  const h = box.h;

  if (spec.id === "poster") {
    // 1:1 复刻 135 原海报左页构件，并严格占满 versoBox 宽度的 0%–100%（外切到内订口精确落位）
    const barW = w * 0.17;
    const barH = h * 0.28;
    parts.push(makeRect("v-top-bar", x0, y0 + h * 0.02, barW, barH, PALETTE.emerald, 1.0));

    const semiR = Math.min(w * 0.36, h * 0.165);
    const semiX = x0 + w * 0.22;
    const semiY = y0 + h * 0.195;
    parts.push(makeSemi("v-top-semi", semiX, semiY, semiR, "right", PALETTE.emerald, 1.05));

    parts.push(makeLines("v-lines", x0, y0 + h * 0.34, w * 0.34, h * 0.11, 6, 0.35));

    // 中部珊瑚玫红主圆：边缘稳稳延伸至版芯内沿（u ≈ 0.98），让订口实测严格忠于几何边界
    const discR = Math.min(w * 0.32, h * 0.168);
    const discCx = x0 + w - discR - 2;
    const discCy = y0 + h * 0.56;
    parts.push(makeDisc("v-rose-disc", discCx, discCy, discR, PALETTE.rose, 1.55, 8));

    const sqW = w * 0.38;
    const sqH = h * 0.21;
    parts.push(makeRect("v-bot-sq", x0, y0 + h * 0.74, sqW, sqH, PALETTE.emerald, 1.0));

    const botSemiR = Math.min(w * 0.35, h * 0.158);
    parts.push(makeSemi("v-bot-semi", x0 + w - botSemiR, y0 + h * 0.855, botSemiR, "right", PALETTE.emerald, 1.05));
  } else if (spec.id === "architecture") {
    // 建筑画册：拱门立面图版 + 珊瑚索引圆 + 双语注脚细线（同样铺满 0%–100% 版芯）
    parts.push(makeRect("v-arch-col", x0, y0 + h * 0.04, w * 0.22, h * 0.54, PALETTE.emerald, 1.0));
    const archR = Math.min(w * 0.38, h * 0.19);
    parts.push(makeSemi("v-arch-dome", x0 + w * 0.28, y0 + h * 0.27, archR, "right", PALETTE.emerald, 1.1));
    const discR = Math.min(w * 0.27, h * 0.145);
    parts.push(makeDisc("v-arch-rose", x0 + w - discR - 2, y0 + h * 0.62, discR, PALETTE.rose, 1.5, 7));
    parts.push(makeLines("v-arch-cap", x0, y0 + h * 0.70, w * 0.54, h * 0.22, 7, 0.42));
  } else {
    // 古典书卷：双页正文版芯 + 外缘批注 + 珊瑚章印 + 顶部眉题（铺满 0%–100% 版芯）
    parts.push(makeLines("v-codex-head", x0, y0 + h * 0.02, w, h * 0.04, 2, 0.35));
    parts.push(makeRect("v-codex-drop", x0, y0 + h * 0.11, w * 0.28, h * 0.22, PALETTE.emerald, 1.05));
    parts.push(makeLines("v-codex-body1", x0 + w * 0.34, y0 + h * 0.11, w * 0.66, h * 0.22, 6, 0.55));
    const discR = Math.min(w * 0.24, h * 0.125);
    parts.push(makeDisc("v-codex-seal", x0 + w - discR - 2, y0 + h * 0.52, discR, PALETTE.rose, 1.45, 6));
    parts.push(makeLines("v-codex-body2", x0, y0 + h * 0.40, w * 0.52, h * 0.48, 10, 0.58));
    const tailR = Math.min(w * 0.28, h * 0.135);
    parts.push(makeSemi("v-codex-tail", x0 + w - tailR, y0 + h * 0.78, tailR, "right", PALETTE.emerald, 1.0));
  }

  return parts;
}

function buildRectoParts(spec, box, mode, scale) {
  const x0 = box.x;
  const y0 = box.y;
  const w = box.w;
  const h = box.h;

  // 若是「异形等重」，右页改用异形构造（优雅正文栏 + 纤细松绿铭牌 + 均衡玫红主圆 + 细压舱底条），不机械镜像但与左页视觉量级持平
  if (mode === "counterweight") {
    const parts = [];
    parts.push(makeLines("r-cw-head", x0, y0 + h * 0.03, w, h * 0.04, 2, 0.28));
    parts.push(makeLines("r-cw-col", x0, y0 + h * 0.12, w * 0.64, h * 0.30, 7, 0.34));
    parts.push(makeRect("r-cw-plinth", x0 + w * 0.78, y0 + h * 0.12, w * 0.22, h * 0.30, PALETTE.emerald, 0.92));
    const baseR = Math.min(w * 0.26, h * 0.148) * scale;
    parts.push(makeDisc("r-cw-disc", x0 + w * 0.48, y0 + h * 0.56, baseR, PALETTE.rose, 1.42, -8));
    parts.push(makeRect("r-cw-foot", x0, y0 + h * 0.82, w, h * 0.10, PALETTE.emerald, 0.88));
    return parts;
  }

  // 生成镜像基准或平移错位
  const mirror = mode === "mirror";
  const src = buildVersoParts(spec, { x: 0, y: 0, w, h });
  return src.map((p) => {
    const isFocal = p.kind === "disc";
    const sc = isFocal ? scale : 0.86 + 0.14 * scale;
    if (p.kind === "rect") {
      const nw = p.w * (isFocal ? sc : 1);
      const nh = p.h * (0.9 + 0.1 * scale);
      const nx = mirror ? x0 + (w - (p.x + nw)) : x0 + p.x;
      const ny = y0 + p.y + (p.h - nh) * 0.5;
      return makeRect(p.id.replace("v-", "r-"), nx, ny, nw, nh, p.color, p.density);
    }
    if (p.kind === "semi") {
      const nr = p.r * (0.88 + 0.12 * scale);
      const nx = mirror ? x0 + (w - p.x) : x0 + p.x;
      const ny = y0 + p.y;
      const dir = mirror ? (p.dir === "right" ? "left" : "right") : p.dir;
      return makeSemi(p.id.replace("v-", "r-"), nx, ny, nr, dir, p.color, p.density);
    }
    if (p.kind === "disc") {
      const nr = p.r * scale;
      const ncx = mirror ? x0 + (w - p.cx) : x0 + p.cx;
      const ncy = y0 + p.cy;
      const haloDx = mirror ? -p.haloDx : p.haloDx;
      return makeDisc(p.id.replace("v-", "r-"), ncx, ncy, nr, p.color, p.density, haloDx);
    }
    // lines
    const nx = mirror ? x0 + (w - (p.x + p.w)) : x0 + p.x;
    const ny = y0 + p.y;
    return makeLines(p.id.replace("v-", "r-"), nx, ny, p.w, p.h, p.count, p.density);
  });
}

function makeRect(id, x, y, w, h, color, density) {
  return {
    id,
    kind: "rect",
    x,
    y,
    w,
    h,
    cx: x + w * 0.5,
    cy: y + h * 0.5,
    minX: x,
    maxX: x + w,
    color,
    density,
    mass: w * h * density,
  };
}

function makeSemi(id, x, y, r, dir, color, density) {
  // x 为直边位置，y 为圆心纵坐标；dir="right" 表示半圆弧朝右（中轴）
  const minX = dir === "right" ? x : x - r;
  const maxX = dir === "right" ? x + r : x;
  const cx = dir === "right" ? x + (4 * r) / (3 * Math.PI) : x - (4 * r) / (3 * Math.PI);
  return {
    id,
    kind: "semi",
    x,
    y,
    r,
    dir,
    cx,
    cy: y,
    minX,
    maxX,
    color,
    density,
    mass: 0.5 * Math.PI * r * r * density,
  };
}

function makeDisc(id, cx, cy, r, color, density, haloDx) {
  return {
    id,
    kind: "disc",
    cx,
    cy,
    r,
    haloDx,
    minX: cx - r,
    maxX: cx + r,
    color,
    density,
    mass: Math.PI * r * r * density,
  };
}

function makeLines(id, x, y, w, h, count, density) {
  return {
    id,
    kind: "lines",
    x,
    y,
    w,
    h,
    count,
    cx: x + w * 0.5,
    cy: y + h * 0.5,
    minX: x,
    maxX: x + w,
    density,
    mass: w * h * density,
  };
}

function computeMirrorFit(versoParts, rectoParts, spineX, mode, deltaY, scale, shiftPx) {
  if (mode === "counterweight") {
    const posPenalty = Math.min(45, Math.abs(shiftPx) * 0.9 + Math.abs(deltaY) * 1.1);
    const massPenalty = Math.min(40, Math.abs(scale - 1) * 95);
    return Math.round(clamp(96 - posPenalty - massPenalty, 18, 98));
  }
  let penalty = 0;
  if (mode === "translation") penalty += 54;
  penalty += Math.min(28, Math.abs(shiftPx) * 0.8);
  penalty += Math.min(22, Math.abs(deltaY) * 0.9);
  penalty += Math.min(24, Math.abs(scale - 1) * 68);
  // 额外检查主圆镜像中心距
  const vDisc = versoParts.find((p) => p.kind === "disc");
  const rDisc = rectoParts.find((p) => p.kind === "disc");
  if (vDisc && rDisc) {
    const targetX = spineX + (spineX - vDisc.cx);
    const errDist = Math.hypot(rDisc.cx - targetX, rDisc.cy - vDisc.cy);
    penalty = Math.max(penalty, Math.min(72, errDist * 0.42));
  }
  return Math.round(clamp(100 - penalty, 12, 100));
}

// ---------- 供第 03 节「装订中缝弯折模拟仪」共用的纯几何经验模型 ----------
export function computeGutterProfile({ pages, binding, innerMm }) {
  const p = clamp(Number(pages || 240), 48, 480);
  const b = BINDINGS[binding] ? binding : "perfect";
  const m = clamp(Number(innerMm || 16), 6, 30);

  // 经验估算：纸张越厚、装订越紧，中缝弯折不可平读区越大
  const thicknessFactor = (p - 48) / (480 - 48); // 0..1
  let baseLoss = 4.0;
  let maxExtra = 14.0;
  let archHeight = 10;
  if (b === "perfect") {
    baseLoss = 9.0;
    maxExtra = 13.0;
    archHeight = 18 + thicknessFactor * 20;
  } else if (b === "saddle") {
    baseLoss = 5.5;
    maxExtra = 6.5;
    archHeight = 9 + thicknessFactor * 10;
  } else {
    baseLoss = 3.0;
    maxExtra = 3.5;
    archHeight = 4 + thicknessFactor * 5;
  }

  const lossMm = baseLoss + thicknessFactor * maxExtra; // 经验弯折损失（mm）
  const recommendedMm = Math.ceil(lossMm + 3);
  const clearanceMm = m - lossMm;
  const status = clearanceMm >= 2.5 ? "safe" : clearanceMm >= -0.5 ? "tight" : "swallow";

  let verdict = "";
  if (status === "safe") {
    verdict = `安全净空 +${clearanceMm.toFixed(1)}mm：版芯完全避开书脊弯折区，平视即可通读。`;
  } else if (status === "tight") {
    verdict = `贴近弯折临界（余量 ${clearanceMm.toFixed(1)}mm）：略微合拢就会起阴影，建议加到 ${recommendedMm}mm 以上。`;
  } else {
    verdict = `已遭中缝吞噬 ${Math.abs(clearanceMm).toFixed(1)}mm：内侧字行卷进装订阴影，读者必须用力按压书脊。`;
  }

  return {
    pages: p,
    binding: b,
    innerMm: m,
    lossMm,
    recommendedMm,
    clearanceMm,
    archHeight,
    status,
    verdict,
  };
}

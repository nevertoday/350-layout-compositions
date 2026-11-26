// 137 通版跨页 · 单真源几何、物理装订与诊断模型
// 画布绘制、交互命中、读数指标、四维探针与诊单文案全部从同一组几何数算出。

export const SPREAD_WIDTH_MM = 420; // 标准杂志开本：两页 210mm × 280mm
export const SPREAD_HEIGHT_MM = 280;

export const PALETTE = {
  indigo: "#230B4E",
  indigoDeep: "#1B093E",
  indigoCard: "#2D145E",
  indigoBorder: "#4B3080",
  spineDot: "#886FA7",
  rose: "#F46D9F",
  roseBright: "#FF87B4",
  roseDeep: "#D94C82",
  mint: "#A3E7BE",
  mintBar: "#8ED5B7",
  mintDots: "#90E2BB",
  cream: "#FCF3F4",
  ivory: "#F8F4E5",
  splitRight: "#3A3140", // 错态：右页偏暖灰紫，与左页深紫靛底场割裂
  splitRibbon: "#B38A9A", // 错态：右页灰暗断调色带
  ok: "#6EE7A8",
  warn: "#FFB86C",
  danger: "#FF6B7F",
};

export const BINDINGS = {
  perfect: {
    id: "perfect",
    label: "胶装紧订",
    en: "PERFECT BOUND",
    gutterMm: 14,
    openAngle: 128,
    dipDepth: 0.085, // 书脊下陷深度比例（剖面示意）
    dangerHalfNorm: 0.030, // ±3.0% 跨页宽（约 25mm 强弯折暗谷）
    desc: "书脊铣背上胶紧锁，翻开呈 V 形深谷，中缝两侧各约 5–7 mm 被拉入弯折区，跨脊小字与人像极易压折。",
  },
  saddle: {
    id: "saddle",
    label: "骑马订",
    en: "SADDLE-STITCH",
    gutterMm: 5,
    openAngle: 162,
    dipDepth: 0.032,
    dangerHalfNorm: 0.013, // ±1.3%（约 11mm 轻折缝）
    desc: "对折套帖装订，适合 64 页以内的薄刊；中缝展开较平顺，但页数一厚需留意内页外切爬移。",
  },
  layflat: {
    id: "layflat",
    label: "锁线平摊",
    en: "SMYTH-SEWN LAY-FLAT",
    gutterMm: 1.5,
    openAngle: 178,
    dipDepth: 0.008,
    dangerHalfNorm: 0.005, // ±0.5%（近乎 180° 平铺）
    desc: "锁线装帧或蝴蝶装可接近 180° 完全摊平，中缝画面损耗极小，是摄影画册与全幅通版的理想工艺。",
  },
};

export const SPECIMENS = {
  poster: {
    id: "poster",
    name: "原海报·粉带通流",
    shortName: "原海报",
    headlineChars: ["通", "版", " ", "跨", "页"], // 居中时空格刚好骑缝，偏移时汉字撞进书脊
    subEn: "FULL-SPREAD LAYOUT",
    leftCaption: ["视觉元素", "贯穿左右页面", "信息连续传达", "强化整体叙事"],
    rightTag: ["THROUGH", "UNIFIED", "EXTENDED", "COHERENT"],
    groundLeft: "#230B4E",
    groundRightUnified: "#230B4E",
    groundRightSplit: "#3D3142",
    ribbonFill: "#F46D9F",
    ribbonSplitRight: "#C27D99",
    accent: "#A3E7BE",
    inkOnRibbon: "#FCF3F4",
    bodySample: "当视觉流无缝越过装订线，两页便合成一块完整银幕",
  },
  glacier: {
    id: "glacier",
    name: "地理摄影·冰川全景",
    shortName: "冰川全景",
    headlineChars: ["冰", "原", " ", "横", "断"],
    subEn: "POLAR HORIZON · 66°N",
    leftCaption: ["东经 14°", "冰盖退缩纪实", "全景宽幅视野", "双页一气横扫"],
    rightTag: ["HORIZON", "CONTINUUM", "WIDE", "FIELD"],
    groundLeft: "#181442",
    groundRightUnified: "#181442",
    groundRightSplit: "#3F3739",
    ribbonFill: "#E86A9C",
    ribbonSplitRight: "#8E879E",
    accent: "#9AE6C7",
    inkOnRibbon: "#FCF3F4",
    bodySample: "摄影师沿冰舌布设一条贯通双页的地平线与科考路线",
  },
  architecture: {
    id: "architecture",
    name: "建筑展册·长卷立面",
    shortName: "建筑长卷",
    headlineChars: ["长", "廊", " ", "剖", "面"],
    subEn: "ELEVATION CONTINUUM",
    leftCaption: ["1:200 立面", "横向柱列展开", "贯通展厅序列", "秩序绵延到底"],
    rightTag: ["AXIS", "SPAN", "SECTION", "FLOW"],
    groundLeft: "#210E4B",
    groundRightUnified: "#210E4B",
    groundRightSplit: "#3D354A",
    ribbonFill: "#F0699A",
    ribbonSplitRight: "#9C849A",
    accent: "#A3E7BE",
    inkOnRibbon: "#FCF3F4",
    bodySample: "长达四十米的清水混凝土长廊只能在通版里完整展开",
  },
};

export const INITIAL_STATE = {
  specimen: "poster",
  seamShear: 0.17,      // +48mm 右页下错断流
  spanReach: 0.56,      // 56% 困在页框内未延展
  ribbonWidth: 0.27,    // 27% 适中带宽
  titleOffset: -0.058,  // 左偏让「跨」字正中撞进 14mm 胶装折谷
  binding: "perfect",   // 胶装紧订（14mm 暗谷）
  unifyGround: "split", // 左右底场割裂
  bodyCross: true,      // 细正文硬穿胶装中缝
  showGuides: true,
  highlightDim: null,   // "through" | "unified" | "extended" | "coherent" | null
};

export const PRESETS = {
  broken: {
    label: "复原开场错态",
    kind: "reset",
    patch: {
      seamShear: 0.17,
      spanReach: 0.56,
      ribbonWidth: 0.27,
      titleOffset: -0.058,
      binding: "perfect",
      unifyGround: "split",
      bodyCross: true,
    },
  },
  classic: {
    label: "原海报经典解",
    kind: "valid",
    patch: {
      seamShear: 0,
      spanReach: 1.0,
      ribbonWidth: 0.28,
      titleOffset: 0.0,
      binding: "saddle",
      unifyGround: "unified",
      bodyCross: false,
    },
  },
  layflat: {
    label: "锁线全景解",
    kind: "valid",
    patch: {
      seamShear: 0,
      spanReach: 1.0,
      ribbonWidth: 0.34,
      titleOffset: 0.015,
      binding: "layflat",
      unifyGround: "unified",
      bodyCross: false,
    },
  },
  perfectSafe: {
    label: "胶装避脊解",
    kind: "valid",
    patch: {
      seamShear: 0,
      spanReach: 0.96,
      ribbonWidth: 0.24,
      titleOffset: 0.175,
      binding: "perfect",
      unifyGround: "unified",
      bodyCross: false,
    },
  },
  errReverseShear: {
    label: "试错：反向错牙",
    kind: "error",
    patch: {
      seamShear: -0.16,
      spanReach: 0.96,
      ribbonWidth: 0.28,
      titleOffset: 0.0,
      binding: "saddle",
      unifyGround: "unified",
      bodyCross: false,
    },
  },
  errTooFat: {
    label: "试错：过肥窒息",
    kind: "error",
    patch: {
      seamShear: 0,
      spanReach: 1.0,
      ribbonWidth: 0.54,
      titleOffset: 0.0,
      binding: "layflat",
      unifyGround: "unified",
      bodyCross: false,
    },
  },
  errTooThin: {
    label: "试错：过细断气",
    kind: "error",
    patch: {
      seamShear: 0,
      spanReach: 0.96,
      ribbonWidth: 0.09,
      titleOffset: 0.0,
      binding: "layflat",
      unifyGround: "unified",
      bodyCross: false,
    },
  },
  errGutterTrap: {
    label: "试错：胶装吞字",
    kind: "error",
    patch: {
      seamShear: 0,
      spanReach: 1.0,
      ribbonWidth: 0.28,
      titleOffset: -0.058,
      binding: "perfect",
      unifyGround: "unified",
      bodyCross: true,
    },
  },
};

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// 137 原海报核心 S 形通流中心线方程（归一化坐标 x ∈ [0, 1], y ∈ [0, 1]）
// 从左页左下（约 y=0.80）平缓上扬，过中缝（x=0.50, y=0.52）形成优雅 S 弯，延展至右页右上（约 y=0.26）
export function baseRibbonY(nx) {
  // 平滑单调上升 + 中段微微 S 形滞留，高度还原 137 原海报粉红丝带的韵律
  const base = 0.80 - 0.56 * nx;
  const sWave = 0.068 * Math.sin((nx - 0.5) * Math.PI * 2.15) * Math.exp(-Math.pow((nx - 0.5) / 0.42, 2));
  return clamp(base + sWave, 0.14, 0.88);
}

// 含右页错牙偏移后的实际曲线中心 y（x < 0.5 为左页，x >= 0.5 为右页）
export function actualRibbonY(nx, seamShear) {
  const y0 = baseRibbonY(nx);
  if (nx < 0.5) return y0;
  return clamp(y0 + seamShear, 0.10, 0.90);
}

// 曲线切线斜率 dy/dx（用于沿色带排布跨页大标角度）
export function ribbonSlope(nx, seamShear) {
  const eps = 0.005;
  const side = nx < 0.5 ? -1 : 1;
  const x1 = clamp(nx - (side < 0 ? eps : 0), 0.01, 0.495);
  const x2 = clamp(nx + (side > 0 ? eps : 0), 0.505, 0.99);
  if (nx < 0.5) {
    const a = clamp(nx - eps, 0.01, 0.498);
    const b = clamp(nx + eps, 0.01, 0.498);
    return (baseRibbonY(b) - baseRibbonY(a)) / Math.max(0.001, b - a);
  }
  const a = clamp(nx - eps, 0.502, 0.99);
  const b = clamp(nx + eps, 0.502, 0.99);
  return (actualRibbonY(b, seamShear) - actualRibbonY(a, seamShear)) / Math.max(0.001, b - a);
}

// 计算单真源几何与 8 类双向诊断
export function evaluateSpread(state) {
  const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;
  const bind = BINDINGS[state.binding] || BINDINGS.perfect;

  const spanReach = clamp(state.spanReach, 0.36, 1.0);
  const seamShear = clamp(state.seamShear, -0.26, 0.26);
  const ribbonWidth = clamp(state.ribbonWidth, 0.08, 0.56);
  const titleOffset = clamp(state.titleOffset, -0.28, 0.28);

  // 色带左右起止归一化 x 坐标（围绕中缝对称延展）
  const startX = clamp(0.5 - spanReach * 0.5, 0, 0.42);
  const endX = clamp(0.5 + spanReach * 0.5, 0.58, 1.0);

  // 左右页实际覆盖占比（单页宽 0.5）
  const leftReach = (0.5 - startX) / 0.5;
  const rightReach = (endX - 0.5) / 0.5;

  // 实算中缝接缝坐标与毫米错牙
  const leftExitY = baseRibbonY(0.499);
  const rightEntryY = actualRibbonY(0.501, seamShear);
  const shearNorm = rightEntryY - leftExitY;
  const shearMm = Math.round(shearNorm * SPREAD_HEIGHT_MM);
  const absShearMm = Math.abs(shearMm);

  // 实算色带实际覆盖面积与底场净留白比例（按 40 段梯形数值积分，非写死常量！）
  let ribbonArea = 0;
  const steps = 40;
  const dx = (endX - startX) / steps;
  for (let i = 0; i < steps; i++) {
    const mx = startX + (i + 0.5) * dx;
    const cy = actualRibbonY(mx, seamShear);
    // 带宽随 137 原海报特征在中腹微宽、两端微收（乘以 0.92..1.08 光学弧度）
    const swell = 0.92 + 0.16 * Math.exp(-Math.pow((mx - 0.52) / 0.28, 2));
    const halfH = (ribbonWidth * swell) * 0.5;
    const top = Math.max(0, cy - halfH);
    const bot = Math.min(1, cy + halfH);
    ribbonArea += Math.max(0, bot - top) * dx;
  }
  // 加上左上角标区与右下关键词区约 0.09 信息占位，得到底场净留白占比
  const fieldWhiteRatio = clamp(1 - ribbonArea - 0.09, 0.05, 0.88);
  const fieldWhitePct = Math.round(fieldWhiteRatio * 100);
  const ribbonAreaPct = Math.round(ribbonArea * 100);

  // 实算跨页大标每个字符的精确坐标与书脊折谷碰撞检测
  const chars = spec.headlineChars;
  const charStep = 0.056; // 每字符沿跨页的水平跨距（归一化）
  const titleCenterX = clamp(0.5 + titleOffset, 0.18, 0.82);
  const firstCharX = titleCenterX - ((chars.length - 1) * charStep) / 2;
  const dangerHalf = bind.dangerHalfNorm;

  const glyphBoxes = chars.map((ch, idx) => {
    const cx = firstCharX + idx * charStep;
    const cy = actualRibbonY(cx, seamShear);
    const isSpace = ch === " ";
    const halfW = isSpace ? 0.010 : 0.023;
    const minX = cx - halfW;
    const maxX = cx + halfW;
    // 是否落入书脊危险折谷
    const overlapSpine = !isSpace && maxX > 0.5 - dangerHalf && minX < 0.5 + dangerHalf;
    // 在书脊折谷内的被压缩比例（供画布视觉压窄使用，同一真源！）
    const distFromSpine = Math.abs(cx - 0.5);
    const pinchFactor = overlapSpine
      ? clamp(1 - (1 - distFromSpine / (dangerHalf + halfW)) * (bind.id === "perfect" ? 0.52 : bind.id === "saddle" ? 0.22 : 0.06), 0.42, 1)
      : 1;
    // 检查字符是否落在色带横向范围内
    const outOfRibbon = !isSpace && (cx < startX + 0.02 || cx > endX - 0.02);
    return {
      ch,
      idx,
      cx,
      cy,
      halfW,
      isSpace,
      overlapSpine,
      pinchFactor,
      outOfRibbon,
    };
  });

  const trappedGlyphs = glyphBoxes.filter((g) => g.overlapSpine);
  const detachedGlyphs = glyphBoxes.filter((g) => g.outOfRibbon);
  const bodyTrapped = state.bodyCross && bind.id === "perfect";
  const titleTooExtreme = Math.abs(titleOffset) > 0.22;

  // 四大原海报维度实算判定
  // 1. 贯穿 THROUGH：中缝错牙 ≤ 6mm 且带宽 ≥ 14%
  const passThrough = absShearMm <= 6 && ribbonWidth >= 0.14;

  // 2. 统一 UNIFIED：双页底场统一且带宽未膨胀窒息（≤ 46% 且底场留白 ≥ 34%）
  const passUnified = state.unifyGround === "unified" && ribbonWidth <= 0.46 && fieldWhiteRatio >= 0.34;

  // 3. 延展 EXTENDED：跨页延展 ≥ 84% 且左右页各自覆盖充分
  const passExtended = spanReach >= 0.84 && leftReach >= 0.68 && rightReach >= 0.68;

  // 4. 连贯 COHERENT：零字符掉进装订折谷、无细正文硬跨胶装、标题紧贴主通流不过偏
  const passCoherent = trappedGlyphs.length === 0 && !bodyTrapped && detachedGlyphs.length === 0 && !titleTooExtreme;

  const score = [passThrough, passUnified, passExtended, passCoherent].filter(Boolean).length;

  // 汇总所有触发的错态（按严重优先级排序）
  const issues = [];
  if (absShearMm > 6) {
    issues.push({
      code: seamShear > 0 ? "seam_shear_down" : "seam_shear_up",
      dim: "through",
      shortTag: seamShear > 0 ? `下错 +${absShearMm}mm` : `上错 -${absShearMm}mm`,
      title: seamShear > 0
        ? `中缝向下错牙 +${absShearMm}mm，跨页通流在书脊处直接撞断`
        : `中缝反向向上错牙 -${absShearMm}mm，视线跨脊时像踩空台阶`,
      why: "通版跨页靠格式塔「良好连续性」把两页焊成一块画布。只要左右页色带在中缝处的高度错开超过 6mm，大脑就会立刻把画面重新拆回两张互不相干的拼贴单页。",
      fix: "上下拖动中缝处的「接缝节点」，把左右两段丝带对齐到 0mm（靠近中线会轻轻吸附）。",
      actionLabel: "对齐中缝至 0mm",
      actionPatch: { seamShear: 0 },
    });
  }
  if (ribbonWidth < 0.14) {
    issues.push({
      code: "ribbon_too_thin",
      dim: "through",
      shortTag: `过细 ${Math.round(ribbonWidth * 100)}%`,
      title: `通流带宽仅 ${Math.round(ribbonWidth * 100)}%，过细撑不起跨页骨架`,
      why: "跨过书脊的主视觉流必须具备足够体量才能压住装订折痕。低于 14% 的细线一遇到书脊阴影就会显得脆弱发飘，跨页标题也无处依附。",
      fix: "把「通流带宽」拉回到 18%–38% 经验区间，让色带既托住标题又不吞没留白。",
      actionLabel: "调带宽至 28%",
      actionPatch: { ribbonWidth: 0.28 },
    });
  }
  if (state.unifyGround !== "unified") {
    issues.push({
      code: "ground_split",
      dim: "unified",
      shortTag: "底场割裂",
      title: "左右两页底场色调割裂，视觉退化成两张拼贴单页",
      why: "通版跨页要求先「统一」再「贯穿」。左页深紫靛、右页偏灰褐时，中缝会变成一道生硬的分界墙，读者潜意识会把左右页当成两篇不同栏目来读。",
      fix: "点击画布右页深色背景（或下方开关），把双页恢复成统一的深紫靛通底。",
      actionLabel: "统一双页底场",
      actionPatch: { unifyGround: "unified" },
    });
  }
  if (ribbonWidth > 0.46 || fieldWhiteRatio < 0.34) {
    issues.push({
      code: "ribbon_suffocate",
      dim: "unified",
      shortTag: `过肥 留白${fieldWhitePct}%`,
      title: `色带过度膨胀，底场净留白只剩 ${fieldWhitePct}%`,
      why: "通版不是把整张跨页从头到脚糊满色块。当主通流膨胀超过 46% 高度时，原海报四周沉静的深紫靛静默场被吃空，标题与关键词互相挤撞，反而失去呼吸节奏。",
      fix: "把「通流带宽」回调至 22%–36%，让深紫靛底场保留至少 35% 以上的呼吸留白。",
      actionLabel: "收窄带宽留出呼吸",
      actionPatch: { ribbonWidth: 0.28 },
    });
  }
  if (spanReach < 0.84) {
    issues.push({
      code: "span_cramped",
      dim: "extended",
      shortTag: `困框 ${Math.round(spanReach * 100)}%`,
      title: `主视觉只延展到 ${Math.round(spanReach * 100)}%，被困在页框里没撑开`,
      why: "通版跨页之所以有电影宽银幕的气势，在于主视觉从左页外切边一路滑向右页外切边。如果两边早早缩进页边距内收尾，它看起来就只是中缝上贴了一张小图。",
      fix: "在画布开放区向右横拖（或拉高「贯穿延展度」至 85% 以上），把丝带一路送抵外切边。",
      actionLabel: "拉满边到边延展",
      actionPatch: { spanReach: 1.0 },
    });
  }
  if (trappedGlyphs.length > 0) {
    const trappedStr = trappedGlyphs.map((g) => `「${g.ch}」`).join("");
    issues.push({
      code: "gutter_trap_char",
      dim: "coherent",
      shortTag: `压脊 ${trappedGlyphs.map((g) => g.ch).join("")}`,
      title: `关键字符${trappedStr}落入 ${bind.gutterMm}mm ${bind.label}折谷，翻开时被压折`,
      why: `${bind.label}在翻开时书脊会向下弯折形成暗谷。色带和背景风景可以放心跨缝，但汉字笔画一旦落在折谷正中，纸面弯折会让字形变窄失真甚至被胶水吞掉。`,
      fix: bind.id === "perfect"
        ? "向右拖动跨页大标滑到右页肩区避开 14mm 暗谷，或把装订切换为「骑马订 / 锁线平摊」并用字间距骑缝。"
        : "微调「标题跨脊位」，让词组中央的空隙而不是实心笔画正好经过书脊线。",
      actionLabel: bind.id === "perfect" ? "标题避脊滑入肩区" : "用字间隙骑跨书脊",
      actionPatch: bind.id === "perfect" ? { titleOffset: 0.175, bodyCross: false } : { titleOffset: 0.0, bodyCross: false },
    });
  }
  if (bodyTrapped) {
    issues.push({
      code: "gutter_trap_body",
      dim: "coherent",
      shortTag: "小字穿胶装",
      title: "细小正文行硬穿 14mm 胶装暗谷，阅读视线被卡死",
      why: "大色块和巨幅照片能承受几毫米的装订损耗，但 10–12pt 的细小正文横跨胶装书脊时，行中总有一两个字沉在深折里，读者不得不双手使劲压平书页才能勉强认字。",
      fix: "关掉「正文跨缝」把说明文字收回到左/右单页安全栏内，或将装订换为锁线平摊。",
      actionLabel: "正文退回单页安全区",
      actionPatch: { bodyCross: false },
    });
  }
  if (detachedGlyphs.length > 0 || titleTooExtreme) {
    issues.push({
      code: "title_detached",
      dim: "coherent",
      shortTag: "标题偏离通流",
      title: "标题滑得太偏，脱离了跨页主通流的视觉牵引",
      why: "通版跨页讲究图文与标题沿同一条视觉流协同前进。若把标题硬推到最边缘甚至掉出色带，双页之间就少了把视线从左牵到右的叙事纽带。",
      fix: "把「标题跨脊位」拉回中轴或适度肩区（-18% 至 +18% 之间），让文字稳稳骑在色带之上。",
      actionLabel: "拉回标题至安全肩区",
      actionPatch: { titleOffset: bind.id === "perfect" ? 0.175 : 0.0 },
    });
  }

  // 生成单真源诊单对象
  const topIssue = issues[0] || null;
  let badgeText = "";
  let headline = "";
  let body = "";
  let tip = "";
  let quickActionLabel = "";
  let quickActionPatch = null;
  let postureLabel = ""; // 档位式描述，不假精确

  if (score === 4) {
    const modeName =
      bind.id === "layflat"
        ? "锁线平摊全景通版"
        : bind.id === "perfect"
        ? "胶装避脊肩排通版"
        : "原海报经典跨脊通版";
    badgeText = `4/4 · ${bind.id === "layflat" ? "全景平摊" : bind.id === "perfect" ? "胶装避脊" : "通流贯通"}`;
    headline = `通版成立：${modeName}`;
    body = `左右底场完全统一，主色带以 0mm 接缝误差一路延展至 ${Math.round(spanReach * 100)}% 宽幅，实测底场留白 ${fieldWhitePct}%，且零字符落入 ${bind.label}（${bind.gutterMm}mm）折谷。按空格键可演练薄荷光流如何一气横扫双页。`;
    tip = "现在可以点下方「试错」按钮观察反向错牙、过肥窒息或胶装吞字是如何破坏通版的，或切到另外两套出版标本验证。";
    quickActionLabel = "推演薄荷光流";
    quickActionPatch = null; // 触发光流演练
    postureLabel = "整体连贯（示意）";
  } else {
    badgeText = `${score}/4 · ${topIssue.shortTag}`;
    headline = topIssue.title;
    body = topIssue.why;
    tip = topIssue.fix;
    quickActionLabel = topIssue.actionLabel;
    quickActionPatch = topIssue.actionPatch;
    postureLabel = score === 0 ? "四重断裂（示意）" : score === 1 ? "严重失联（示意）" : score === 2 ? "半通半断（示意）" : "仅差临门一步（示意）";
  }

  // 四枚原海报右下角活体探针状态
  const probes = [
    {
      id: "through",
      icon: "arrow",
      zh: "贯穿",
      en: "THROUGH",
      ok: passThrough,
      tag: absShearMm > 6 ? (seamShear > 0 ? `下错 +${absShearMm}mm` : `上错 -${absShearMm}mm`) : ribbonWidth < 0.14 ? `过细 ${Math.round(ribbonWidth * 100)}%` : `齐缝 ${absShearMm}mm`,
      note: "视觉流过脊零错牙、不断气",
    },
    {
      id: "unified",
      icon: "circle",
      zh: "统一",
      en: "UNIFIED",
      ok: passUnified,
      tag: state.unifyGround !== "unified" ? "左右裂底" : fieldWhiteRatio < 0.34 ? `留白 ${fieldWhitePct}%` : `通底 · 留白${fieldWhitePct}%`,
      note: "双页同场同调、保留呼吸留白",
    },
    {
      id: "extended",
      icon: "wave",
      zh: "延展",
      en: "EXTENDED",
      ok: passExtended,
      tag: `延展 ${Math.round(spanReach * 100)}%`,
      note: "左右撑抵外切边，成宽幅视界",
    },
    {
      id: "coherent",
      icon: "dash",
      zh: "连贯",
      en: "COHERENT",
      ok: passCoherent,
      tag: trappedGlyphs.length > 0 ? `压字 ${trappedGlyphs.map((g) => g.ch).join("")}` : bodyTrapped ? "小字跨胶装" : titleTooExtreme || detachedGlyphs.length ? "标题偏离" : `避脊 ${bind.gutterMm}mm`,
      note: "关键文字与主体安然避开折谷",
    },
  ];

  return {
    spec,
    bind,
    score,
    spanReach,
    spanPct: Math.round(spanReach * 100),
    seamShear,
    shearMm,
    absShearMm,
    ribbonWidth,
    ribbonWidthPct: Math.round(ribbonWidth * 100),
    titleOffset,
    titleOffsetPct: Math.round(titleOffset * 100),
    startX,
    endX,
    leftExitY,
    rightEntryY,
    ribbonAreaPct,
    fieldWhitePct,
    glyphBoxes,
    trappedGlyphs,
    bodyTrapped,
    passThrough,
    passUnified,
    passExtended,
    passCoherent,
    issues,
    probes,
    badgeText,
    headline,
    body,
    tip,
    quickActionLabel,
    quickActionPatch,
    postureLabel,
  };
}

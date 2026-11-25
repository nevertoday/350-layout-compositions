// 119 图底关系原则 · 单真源几何与光度模型
// 所有实绘色值、WCAG 对比度、面积百分比、边界归属与错态诊断都从同一份状态算出。

export const POSTER_COLORS = {
  paper: "#FEF9F3",
  paperSub: "#F3ECE2",
  sand: "#E8DED1",
  navy: "#0E2044",
  navyDark: "#0A1733",
  ink: "#0A0A0A",
  orange: "#F04B00",
  orangeText: "#B83700",
  green: "#1C5320",
  red: "#B62020",
};

export const SCENES = {
  rubin: {
    id: "rubin",
    label: "原海报 · 鲁宾双关",
    short: "鲁宾双关",
    darkName: "两侧侧影",
    lightName: "中央花瓶",
    axisLabel: "花瓶区占比",
  },
  wordmark: {
    id: "wordmark",
    label: "品牌 · 负空间字标",
    short: "负空间字标",
    darkName: "字母正形",
    lightName: "隐藏箭头",
    axisLabel: "负形通道宽",
  },
  poster: {
    id: "poster",
    label: "海报 · 图文分离",
    short: "图文分离",
    darkName: "前景主块",
    lightName: "四周留白底",
    axisLabel: "前景体量比",
  },
};

export const GOALS = {
  reversible: {
    id: "reversible",
    label: "目标：双关转换",
    short: "双关转换",
    desc: "让图与底势均力敌、高反差且外框完整，视线可在两种解读间自由切换。",
  },
  clear: {
    id: "clear",
    label: "目标：清晰主从",
    short: "清晰主从",
    desc: "让前景小而明确、被背景完整包围，绝不陷入五五僵持或喧宾夺主。",
  },
};

export const PALETTES = {
  "navy-ivory": { label: "深藏青 × 暖象牙", dark: "#0E2044", light: "#FEF9F3" },
  "navy-sand": { label: "深藏青 × 暖米砂", dark: "#0E2044", light: "#E8DED1" },
  "ink-ivory": { label: "纯墨黑 × 暖象牙", dark: "#0A0A0A", light: "#FEF9F3" },
};

// ---------- W3C WCAG 2.1 相对亮度与对比度 ----------
export function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const n = parseInt(clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

export function mixHex(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const k = Math.max(0, Math.min(1, t));
  return rgbToHex([
    a[0] + (b[0] - a[0]) * k,
    a[1] + (b[1] - a[1]) * k,
    a[2] + (b[2] - a[2]) * k,
  ]);
}

export function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA, hexB) {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

// ---------- 初始错态与合法/试错预设 ----------
export function createInitialState() {
  return {
    scene: "rubin",       // "rubin" | "wordmark" | "poster"
    goal: "reversible",   // "reversible" | "clear"
    palette: "navy-ivory",
    balance: 0.17,        // 0.14..0.82 横拖画布直接操控的共享轮廓位置
    contrast: 18,         // 0..100 明暗反差（18 对应 ~1.4:1 灰雾错态）
    noise: 2,             // 0 纯净 | 1 轻纹 | 2 强斜纹夺主
    frameOpen: true,      // true 外框破缺泄气 | false 闭合完整
    inverted: false,      // false 原海报极性(外深内浅) | true 反相极性(外浅内深)
    focusSide: "center",  // "center" | "outer" 用户点击画布测试的边界归属注视侧
    showNormals: true,    // 是否显示边界归属法线短针
  };
}

export const PRESETS = {
  broken: {
    label: "复原 0/4 错态",
    state: {
      scene: "rubin",
      goal: "reversible",
      palette: "navy-ivory",
      balance: 0.17,
      contrast: 18,
      noise: 2,
      frameOpen: true,
      inverted: false,
      focusSide: "center",
    },
  },
  posterClassic: {
    label: "原海报经典解",
    state: {
      scene: "rubin",
      goal: "reversible",
      palette: "navy-ivory",
      balance: 0.43,
      contrast: 100,
      noise: 0,
      frameOpen: false,
      inverted: false,
      focusSide: "center",
    },
  },
  invertedSolve: {
    label: "反相双关解",
    state: {
      scene: "rubin",
      goal: "reversible",
      palette: "navy-sand",
      balance: 0.46,
      contrast: 96,
      noise: 0,
      frameOpen: false,
      inverted: true,
      focusSide: "outer",
    },
  },
  clearSolve: {
    label: "清晰主从解",
    state: {
      scene: "poster",
      goal: "clear",
      palette: "navy-ivory",
      balance: 0.28,
      contrast: 100,
      noise: 0,
      frameOpen: false,
      inverted: false,
      focusSide: "center",
    },
  },
  trapStalemate: {
    label: "试错：五五僵持",
    state: {
      scene: "poster",
      goal: "clear",
      palette: "navy-ivory",
      balance: 0.50,
      contrast: 100,
      noise: 0,
      frameOpen: false,
      inverted: false,
      focusSide: "center",
    },
  },
  trapOverfill: {
    label: "试错：撑破倒挂",
    state: {
      scene: "poster",
      goal: "clear",
      palette: "navy-ivory",
      balance: 0.78,
      contrast: 100,
      noise: 0,
      frameOpen: false,
      inverted: false,
      focusSide: "outer",
    },
  },
};

// ---------- 实时色值（从同一 contrast 滑轨生成，实绘与读数同源） ----------
export function resolveColors(state) {
  const pal = PALETTES[state.palette] || PALETTES["navy-ivory"];
  const mid = "#89919E"; // 中性冷灰雾，对比度趋近 1:1
  const k = Math.max(0, Math.min(1, state.contrast / 100));
  // 使用非线性曲线让低端到高端的对比度分布更细腻
  const t = Math.pow(k, 0.92);
  const darkCol = mixHex(mid, pal.dark, t);
  const lightCol = mixHex(mid, pal.light, t);
  const outer = state.inverted ? lightCol : darkCol;
  const inner = state.inverted ? darkCol : lightCol;
  const ratio = contrastRatio(outer, inner);
  return {
    darkCol,
    lightCol,
    outer,
    inner,
    ratio,
    outerIsDark: relativeLuminance(outer) < relativeLuminance(inner),
  };
}

// ---------- 1:1 原海报鲁宾花瓶 / 双侧影剪影轮廓（零五官纯剪影） ----------
// 返回归一化半宽数组：每项 { y: 0..1, halfW: 0..0.48 }（从花瓶顶沿到座底）
// 轮廓忠实还原 119 原海报：宽喇叭杯口 -> 额头眉弓 -> 鼻梁鼻尖 -> 上下唇 -> 下巴 -> 细颈 -> 宽杯座
const BASE_RUBIN_KEYFRAMES = [
  [0.03, 0.43], // 宽平花瓶顶沿（紧贴上缘）
  [0.07, 0.38],
  [0.12, 0.25], // 额头外凸（侧影向外，瓶口向内收）
  [0.18, 0.16], // 额头圆弧
  [0.25, 0.14], // 眉弓略收
  [0.31, 0.155], // 眼窝微凹（纯外轮廓，不画五官）
  [0.37, 0.12], // 鼻梁斜出
  [0.43, 0.085], // 鼻尖最凸（两鼻尖最接近处）
  [0.46, 0.125], // 鼻下人中
  [0.50, 0.095], // 上唇微凸
  [0.535, 0.122], // 唇缝回凹
  [0.565, 0.102], // 下唇微凸
  [0.60, 0.132], // 颏唇沟
  [0.645, 0.108], // 下巴圆凸
  [0.71, 0.155], // 下颌回转
  [0.77, 0.175], // 喉颈最舒展处（杯颈收窄对应双肩前倾）
  [0.83, 0.24], // 颈肩转折
  [0.89, 0.32], // 杯座展开
  [0.97, 0.36], // 杯座底部
];

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

export function sampleRubinProfile(balance, steps = 72) {
  // balance = 0.43 对应原海报经典比例；低于或高于它时平滑压缩/膨胀中央花瓶半宽
  // 当 balance 极小时，鼻尖几乎贴死，花瓶压成枯柴；当 balance 极大时，侧影被挤到画框外缘
  const scale = balance / 0.43;
  const pts = [];
  const kf = BASE_RUBIN_KEYFRAMES;
  for (let i = 0; i <= steps; i++) {
    const y = kf[0][0] + (kf[kf.length - 1][0] - kf[0][0]) * (i / steps);
    // 找区间
    let seg = 0;
    while (seg < kf.length - 2 && y > kf[seg + 1][0]) seg++;
    const y0 = kf[seg][0];
    const y1 = kf[seg + 1][0];
    const lt = y1 > y0 ? (y - y0) / (y1 - y0) : 0;
    const w0 = kf[Math.max(0, seg - 1)][1];
    const w1 = kf[seg][1];
    const w2 = kf[seg + 1][1];
    const w3 = kf[Math.min(kf.length - 1, seg + 2)][1];
    const baseW = catmullRom(w0, w1, w2, w3, lt);
    // 在极端挤压时保留微小的结构起伏，但允许鼻尖间距收缩至极窄或宽展
    let halfW = baseW * scale;
    // 对顶沿和底沿做柔和钳位，防止冲出画框
    halfW = Math.max(0.018, Math.min(0.475, halfW));
    pts.push({ y, halfW });
  }
  return pts;
}

// 从实绘轮廓采样点直接积分计算中央花瓶面积占比（单真源！）
export function computeRubinArea(pts) {
  let area = 0;
  for (let i = 1; i < pts.length; i++) {
    const dy = pts[i].y - pts[i - 1].y;
    const avgW = (pts[i].halfW + pts[i - 1].halfW); // 左右合计宽度 = 2 * avgHalfW
    area += dy * avgW;
  }
  return Math.max(0.04, Math.min(0.95, area));
}

// 统一计算当前题材的实际图形几何指标（全部从实绘参数单真源推导）
export function computeGeometry(state) {
  if (state.scene === "rubin") {
    const pts = sampleRubinProfile(state.balance);
    const centerRatio = computeRubinArea(pts);
    const outerRatio = 1 - centerRatio;
    // 最小颈/鼻间距（反映花瓶是否被挤断）
    let minGap = 1;
    let maxHalfW = 0;
    for (const p of pts) {
      if (p.halfW * 2 < minGap) minGap = p.halfW * 2;
      if (p.halfW > maxHalfW) maxHalfW = p.halfW;
    }
    return {
      pts,
      innerPct: Math.round(centerRatio * 100),
      outerPct: Math.round(outerRatio * 100),
      minGapPct: Math.round(minGap * 100),
      marginLeftPct: Math.round((0.5 - maxHalfW) * 100),
    };
  }
  if (state.scene === "wordmark") {
    // 负空间字标 F → X：balance 直接控制两字之间的缝隙 / 箭头成型度
    // 最佳咬合点在 0.40..0.54；太小 (<0.28) 字母粘连压扁箭头；太大 (>0.62) 缝隙裂开箭头散掉
    const innerPct = Math.round(Math.max(10, Math.min(82, state.balance * 100)));
    return {
      pts: null,
      innerPct,
      outerPct: 100 - innerPct,
      arrowClarity: Math.max(0, Math.round(100 - Math.abs(state.balance - 0.46) * 260)),
    };
  }
  // poster: 图文海报，balance 直接控制前景主色块的面积占比（占画框宽×高）
  const innerPct = Math.round(Math.max(12, Math.min(85, state.balance * 100)));
  return {
    pts: null,
    innerPct,
    outerPct: 100 - innerPct,
    touchesEdge: state.balance > 0.68,
  };
}

// ---------- 核心诊断评估（8 类错态 + 4 项原海报关键词实况灯） ----------
export function evaluate(state) {
  const colors = resolveColors(state);
  const geom = computeGeometry(state);
  const ratio = colors.ratio;
  const pct = geom.innerPct;
  const isReversible = state.goal === "reversible";

  // 4 项硬检查（严格对应 119 原海报底部四个关键词：图形 / 背景 / 正负形 / 转换）
  const contrastOk = ratio >= 4.5;
  const groundOk = state.noise === 0;

  let proportionOk = false;
  let proportionIssue = null;

  if (isReversible) {
    if (state.scene === "rubin") {
      if (pct < 30) proportionIssue = "vase_crushed";
      else if (pct > 57) proportionIssue = "faces_crushed";
      else proportionOk = true;
    } else if (state.scene === "wordmark") {
      if (pct < 34) proportionIssue = "arrow_crushed";
      else if (pct > 58) proportionIssue = "arrow_split";
      else proportionOk = true;
    } else {
      if (pct < 36) proportionIssue = "vase_crushed";
      else if (pct > 58) proportionIssue = "faces_crushed";
      else proportionOk = true;
    }
  } else {
    // 清晰主从模式：必须避开 44%-56% 的五五僵持，且不能 >68% 撑破画框导致图底倒挂
    if (pct >= 44 && pct <= 56) proportionIssue = "accidental_ambiguity";
    else if (pct > 66) proportionIssue = "overfill_inversion";
    else if (pct < 16) proportionIssue = "too_tiny";
    else proportionOk = true;
  }

  const enclosureOk = !state.frameOpen;

  const passedCount = [contrastOk, groundOk, proportionOk, enclosureOk].filter(Boolean).length;

  // 判定当前首要错态（按严重度排序）
  let code = "ok";
  let badge = "4 / 4 图底成立";
  let tone = "ok"; // "error" | "warn" | "ok"
  let headline = "";
  let explain = "";
  let action = "";

  if (ratio < 3.0) {
    code = "low_contrast";
    tone = "error";
    badge = `错态 · 对比融化 (${passedCount}/4)`;
    headline = `图与底亮度只差 ${ratio.toFixed(1)}:1，轮廓完全融在雾里`;
    explain = "人眼分离图形与背景的第一道门槛是明暗反差。当前前景色与底色亮度过于接近（低于 WCAG 图形 3.0:1 底线），视觉系统抓不住共享边界，无论怎么看都糊成一团灰。";
    action = "把「明暗反差」滑轨往右推高到 4.5:1 以上，让深藏青与暖象牙真正拉开亮度差。";
  } else if (ratio < 4.5) {
    code = "mid_contrast";
    tone = "error";
    badge = `错态 · 反差偏虚 (${passedCount}/4)`;
    headline = `对比度 ${ratio.toFixed(1)}:1 勉强见大形，细轮廓与小字仍发虚`;
    explain = "虽然跨过了 3.0:1 大图形底线，但还没达到 WCAG 2.1 正文 4.5:1 的清晰门槛。边缘转折处（如鼻尖、字角）仍显软弱，图底层次不够利落。";
    action = `继续提高「明暗反差」至 ≥ 4.5:1（原海报深藏青配暖象牙高达 ${contrastRatio(POSTER_COLORS.navy, POSTER_COLORS.paper).toFixed(1)}:1）。`;
  } else if (state.noise > 0) {
    code = "noise_hijack";
    tone = "error";
    badge = `错态 · 噪底夺主 (${passedCount}/4)`;
    headline = state.noise === 2 ? "背景高对比斜纹喧宾夺主，把共享轮廓切碎了" : "底纹仍有明显干扰，背景不肯老实退后";
    explain = "背景之所以能退在后面，是因为它足够均匀、低频、不抢边界。当底上布满高反差条纹时，大脑被迫把条纹当成前景，真正的主体反倒被切散。";
    action = "直接点击画布里的朱橘提示标（或把「背景纯净度」切到「纯底无噪」），让背景安静下来。";
  } else if (proportionIssue === "vase_crushed") {
    code = "vase_crushed";
    tone = "error";
    badge = `错态 · 负形挤死 (${passedCount}/4)`;
    headline = `中央浅区被挤到只剩 ${pct}%，花瓶瘪成细缝无法反转`;
    explain = "要让双关图形自由转换，正负两方的体量与轮廓必须势均力敌。现在两侧深区吞掉了 " + geom.outerPct + "% 画幅，中央空间细到只剩一条裂缝，大脑只能死锁在侧影一侧。";
    action = "在画布上向右横拖（或按 → 键），把共享轮廓往外推开，让中央花瓶占到 34%–52%。";
  } else if (proportionIssue === "faces_crushed") {
    code = "faces_crushed";
    tone = "error";
    badge = `错态 · 外形挤薄 (${passedCount}/4)`;
    headline = `中央胀到 ${pct}%，两侧剪影被压成窄边失去人形`;
    explain = "中央区域抢走了过大比例，两侧只剩贴边的薄条，额头与鼻唇的凹凸特征全部压平。图底退化成普通的单向「白瓶黑边」，双关魅力消失了。";
    action = "在画布上向左横拖（或按 ← 键），把中央占比收回到 34%–52% 平衡带。";
  } else if (proportionIssue === "arrow_crushed") {
    code = "arrow_crushed";
    tone = "error";
    badge = `错态 · 字距挤死 (${passedCount}/4)`;
    headline = `字母间距压得太死（${pct}%），中间负空间箭头被挤扁`;
    explain = "负空间字标靠字与字之间恰到好处的缝隙长出第二层图形。间距过窄时两笔几乎粘连，隐藏箭头变形塌陷。";
    action = "在画布上向右横拖，把字距拉到 36%–56% 之间，看中间向右箭头完整浮现。";
  } else if (proportionIssue === "arrow_split") {
    code = "arrow_split";
    tone = "error";
    badge = `错态 · 负形散裂 (${passedCount}/4)`;
    headline = `字母分得太开（${pct}%），中间空白退回散漫背景`;
    explain = "两个字母离得太远，夹在中间的空白不再被双侧轮廓共同闭合，眼睛只看见一条空沟，看不出隐藏箭头。";
    action = "在画布上向左横拖，让两侧字形靠近咬合，把负空间重新锁进 36%–56%。";
  } else if (proportionIssue === "accidental_ambiguity") {
    code = "accidental_ambiguity";
    tone = "error";
    badge = `错态 · 五五僵持 (${passedCount}/4)`;
    headline = `图与底打成 ${pct}% : ${geom.outerPct}% 平手，日常版面陷入意外双关`;
    explain = "在需要一眼读懂主次的排版里，最怕前景和背景面积势均力敌。现在两者各占约一半，眼睛不知道该先看哪一块，阅读起点来回跳动。";
    action = "在画布上向左横拖，把前景收拢到 18%–38%，让大片干净背景稳稳托住主角。";
  } else if (proportionIssue === "overfill_inversion") {
    code = "overfill_inversion";
    tone = "error";
    badge = `错态 · 包围倒挂 (${passedCount}/4)`;
    headline = `前景撑满 ${pct}% 顶破画框，原来的底反客为主抢成了图`;
    explain = "格式塔包围法则指出：被包围的小区域优先被认作「图」。前景膨胀过度把背景挤成四边零碎白角时，小块留白反而跳到前面抢镜，图底彻底倒挂。";
    action = "在画布上向左横拖，把前景体量压回 18%–38%，还给背景完整连续的包围圈。";
  } else if (proportionIssue === "too_tiny") {
    code = "too_tiny";
    tone = "error";
    badge = `错态 · 主体过孤 (${passedCount}/4)`;
    headline = `前景缩到只剩 ${pct}%，在大片背景里显得微弱失焦`;
    explain = "虽然背景足够干净，但主体体量太小，视觉重力撑不起整张画面，容易被当成纸面上的误印斑点。";
    action = "在画布上向右横拖，把前景体量推回 18%–38% 稳健区。";
  } else if (!enclosureOk) {
    code = "border_cut";
    tone = "error";
    badge = `错态 · 外框破缺 (${passedCount}/4)`;
    headline = "外框上下边界破缺泄气，正负形闭合场没兜住";
    explain = "鲁宾杯或负空间标志依赖清晰封闭的外框边界把「底」和「图」关在同一个舞台里。外框漏口时，浅色区域直接流进页面白底，丧失独立形体感。";
    action = "点击画布里的朱橘「外框破缺 · 闭合」标（或打开「外框闭合」开关），封严正负形边界。";
  } else {
    // 全部 4/4 通过！区分不同合法解
    tone = "ok";
    const modeNote = state.inverted ? "（反相极性）" : "（原海报极性）";
    if (isReversible) {
      badge = `4 / 4 双关成立`;
      if (state.scene === "rubin") {
        headline = state.focusSide === "center"
          ? `双关成立${modeNote}：现把共享边界判给了「中央花瓶」`
          : `双关成立${modeNote}：现把共享边界判给了「两侧侧影」`;
        explain = `对比度 ${ratio.toFixed(1)}:1、纯底无噪、外框严密、中央占比 ${pct}% 与两侧 ${geom.outerPct}% 势均力敌。直点画布深/浅两区，或按「图⇄底反演」，都能看到同一条轮廓线瞬间倒戈。`;
      } else if (state.scene === "wordmark") {
        headline = `负空间字标成立${modeNote}：字母与隐藏箭头双向共生`;
        explain = `字距落入 ${pct}% 咬合区，正形字母稳重可辨，中间负空间自然锁出一只锐利向右箭头，对比度 ${ratio.toFixed(1)}:1 清晰利落。`;
      } else {
        headline = `正负平衡成立${modeNote}：几何块与留白形成双关张力`;
        explain = `对比度 ${ratio.toFixed(1)}:1、占比 ${pct}% : ${geom.outerPct}%，深浅两块都能各自成图。若用于日常信息页，可切到「目标：清晰主从」体验为何平时要避开五五平手。`;
      }
      action = "试试点击画布另一侧切换边界归属，或切换「目标：清晰主从」看同一比例为何立刻变成错态。";
    } else {
      badge = `4 / 4 主从清晰`;
      headline = `清晰主从成立${modeNote}：小面积主体被纯底稳稳托住`;
      explain = `前景占 ${pct}%、背景占 ${geom.outerPct}% 并形成完整包围，对比度高达 ${ratio.toFixed(1)}:1，零噪底干扰。人眼零犹豫锁定主体，完全避免五五僵持。`;
      action = "试试点击「试错：五五僵持」或把前景拉大到 75% 以上，亲眼看图底如何突然倒挂。";
    }
  }

  // 四枚原海报关键词实况灯状态（图形 / 背景 / 正负形 / 转换）
  const pills = [
    {
      key: "figure",
      zh: "图形",
      en: "FIGURE",
      ok: contrastOk && enclosureOk,
      status: !contrastOk ? `反差 ${ratio.toFixed(1)}:1` : !enclosureOk ? "边界破缺" : `${ratio.toFixed(1)}:1 清晰`,
    },
    {
      key: "ground",
      zh: "背景",
      en: "GROUND",
      ok: groundOk,
      status: state.noise === 2 ? "斜纹抢戏" : state.noise === 1 ? "轻纹扰边" : "纯底退后",
    },
    {
      key: "posneg",
      zh: "正负形",
      en: "POSITIVE/NEGATIVE",
      ok: proportionOk,
      status: proportionOk
        ? (isReversible ? `${pct}:${geom.outerPct} 势均` : `${pct}:${geom.outerPct} 主从`)
        : (proportionIssue === "accidental_ambiguity"
            ? `${pct}:${geom.outerPct} 僵持`
            : proportionIssue === "overfill_inversion"
              ? `${pct}% 倒挂`
              : `${pct}% 失衡`),
    },
    {
      key: "transform",
      zh: "转换",
      en: "TRANSFORMATION",
      ok: passedCount === 4,
      status: passedCount === 4
        ? (isReversible ? (state.inverted ? "反相可逆" : "双向可逆") : "稳定单向")
        : "归属未稳",
    },
  ];

  // WCAG 等级短标
  let wcagGrade = "未达标";
  if (ratio >= 7.0) wcagGrade = "AAA 极清";
  else if (ratio >= 4.5) wcagGrade = "AA 正文达标";
  else if (ratio >= 3.0) wcagGrade = "仅大字达标";

  return {
    code,
    tone,
    badge,
    passedCount,
    headline,
    explain,
    action,
    colors,
    geom,
    ratio,
    wcagGrade,
    pills,
    checks: { contrastOk, groundOk, proportionOk, enclosureOk },
  };
}

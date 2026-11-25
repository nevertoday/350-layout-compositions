// 111 交替节奏组织 · 单一真源计算模型
// 所有几何排布、真实相对亮度对比度、周期分析、层间相位与诊断文案全部出自本模块。

export const POSTER_COLORS = {
  vermilion: "#FC4E0B",
  vermilionDeep: "#A82900",
  inkA: "#070706",
  creamB: "#F5E4CC",
  hairline: "#FF9E71",
  okLight: "#0B6B56",
  okDark: "#5CE0BC",
};

const RGB_A = [7, 7, 6];
const RGB_B_MUD = [38, 32, 27];
const RGB_B_CREAM = [245, 228, 204];

export const INITIAL_STATE = {
  // 开场 0/4 翻车态：真无周期断律（5A:3B 含第 4–6 拍三连 A 撞车）+ 发闷 1.6:1 灰褐 + 64° 错牙 + 78:22 强吞弱
  beats: ["A", "A", "B", "A", "A", "A", "B", "B"],
  contrast: 0.14,
  phaseDeg: 64,
  dutyA: 0.78,
  mode: "normal", // "normal" | "glare" | "chaos"
  scanner: true,
  selectedBeat: 3,
};

export const POSTER_SOLUTION = {
  beats: ["A", "B", "A", "B", "A", "B", "A", "B"],
  contrast: 1.0,
  phaseDeg: 180,
  dutyA: 0.5,
  mode: "normal",
  scanner: true,
  selectedBeat: 0,
};

export const PRESET_PATTERNS = {
  ab: { label: "AB 交替", beats: ["A", "B", "A", "B", "A", "B", "A", "B"] },
  aabb: { label: "AABB 双拍", beats: ["A", "A", "B", "B", "A", "A", "B", "B"] },
  allA: { label: "全 A 重复", beats: ["A", "A", "A", "A", "A", "A", "A", "A"] },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function mixRgb(c1, c2, t) {
  const k = clamp(t, 0, 1);
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * k),
    Math.round(c1[1] + (c2[1] - c1[1]) * k),
    Math.round(c1[2] + (c2[2] - c1[2]) * k),
  ];
}

export function rgbToHex([r, g, b]) {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export function relativeLuminance([r, g, b]) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatioRgb(c1, c2) {
  const l1 = relativeLuminance(c1);
  const l2 = relativeLuminance(c2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function computeColorB(contrast) {
  // 用温和伽马曲线让滑杆前段能直观看到灰闷区、后段直达原海报暖米白
  const t = clamp(contrast, 0, 1) ** 1.25;
  return mixRgb(RGB_B_MUD, RGB_B_CREAM, t);
}

// 由当前 8 拍序列与 dutyA 算出每格真实起止比例 [0..1]，画布与诊断共用同一组数
export function computeCells(beats, dutyA) {
  const dA = clamp(dutyA, 0.2, 0.8);
  const dB = 1 - dA;
  const weights = beats.map((b) => (b === "A" ? dA : dB));
  const total = weights.reduce((s, w) => s + w, 0) || 1;
  let x = 0;
  return beats.map((type, index) => {
    const w = weights[index] / total;
    const cell = { index, type, x0: x, x1: x + w, w, cx: x + w * 0.5 };
    x += w;
    return cell;
  });
}

// 周期与连拍分析（在 8 拍环上实算）
export function analyzeBeats(beats) {
  const n = beats.length;
  const countA = beats.filter((b) => b === "A").length;
  const countB = n - countA;

  let switches = 0;
  for (let i = 0; i < n; i++) {
    if (beats[i] !== beats[(i + 1) % n]) switches++;
  }

  let period = 0;
  for (const p of [1, 2, 4]) {
    let ok = true;
    for (let i = 0; i < n; i++) {
      if (beats[i] !== beats[(i + p) % n]) {
        ok = false;
        break;
      }
    }
    if (ok) {
      period = p;
      break;
    }
  }

  // 找出线性视图内所有连续 >= 3 拍同态的撞车区段
  const longRuns = [];
  let i = 0;
  while (i < n) {
    let j = i + 1;
    while (j < n && beats[j] === beats[i]) j++;
    if (j - i >= 3) longRuns.push({ type: beats[i], start: i, end: j - 1, len: j - i });
    i = j;
  }

  // 统计所有线性连段长度集合
  const runLens = [];
  for (let k = 0; k < n; ) {
    let m = k + 1;
    while (m < n && beats[m] === beats[k]) m++;
    runLens.push(m - k);
    k = m;
  }

  const balancedCounts = countA === 4 && countB === 4;
  const code = beats.join("");

  let status = "ok";
  if (switches === 0) status = "monotone";
  else if (period === 0) status = "aperiodic";
  else if (!balancedCounts) status = "unbalanced";

  let patternName = "不规则断拍";
  if (switches === 0) patternName = countA === n ? "全 A 重复" : "全 B 重复";
  else if (period === 2) patternName = beats[0] === "A" ? "1:1 标准 AB" : "1:1 反起 BA";
  else if (period === 4 && balancedCounts) {
    const first4 = code.slice(0, 4);
    if (first4 === "AABB" || first4 === "BBAA") patternName = "2:2 双拍交替";
    else patternName = "4 拍回文交替";
  } else if (period === 4) {
    patternName = `${countA}:${countB} 偏重循环`;
  }

  return {
    code,
    countA,
    countB,
    switches,
    period,
    longRuns,
    runLens,
    balancedCounts,
    status,
    patternName,
    ok: status === "ok",
  };
}

// 相位靠近 0° 或 180° 时提供轻微吸附辅助（仅拖动释放或端点判定时使用）
export function snapPhase(deg) {
  const d = clamp(Math.round(deg), 0, 180);
  if (d <= 6) return 0;
  if (d >= 174) return 180;
  return d;
}

export function diagnose(state) {
  const rgbB = computeColorB(state.contrast);
  const colorA = rgbToHex(RGB_A);
  const colorB = rgbToHex(rgbB);
  const lumRatio = contrastRatioRgb(RGB_A, rgbB);
  const beatInfo = analyzeBeats(state.beats);
  const cells = computeCells(state.beats, state.dutyA);
  const dutyPctA = Math.round(clamp(state.dutyA, 0.2, 0.8) * 100);
  const dutyPctB = 100 - dutyPctA;
  const phase = Math.round(clamp(state.phaseDeg, 0, 180));

  // 四柱单真源验收
  const altOk = beatInfo.ok;
  const contrastOk = lumRatio >= 4.2 && state.mode !== "glare";
  const phaseCounter = phase >= 156;
  const phaseAligned = phase <= 24;
  const phaseOk = phaseCounter || phaseAligned;
  const dutyOk = dutyPctA >= 36 && dutyPctA <= 64;
  const orderOk = dutyOk && state.mode === "normal";

  const pillars = {
    alternation: {
      key: "alternation",
      zh: "交替",
      en: "ALTERNATION",
      ok: altOk,
      tag: altOk
        ? beatInfo.period === 2
          ? "2 拍稳态"
          : "4 拍稳态"
        : beatInfo.status === "monotone"
          ? "0 次切换"
          : beatInfo.status === "unbalanced"
            ? `${beatInfo.countA}A:${beatInfo.countB}B 失衡`
            : "周期断裂",
      value: beatInfo.patternName,
    },
    contrast: {
      key: "contrast",
      zh: "对比",
      en: "CONTRAST",
      ok: contrastOk,
      tag:
        state.mode === "glare"
          ? "24 拍眩光"
          : contrastOk
            ? `${lumRatio.toFixed(1)}:1 清晰`
            : `${lumRatio.toFixed(1)}:1 发闷`,
      value: `${lumRatio.toFixed(1)}:1`,
    },
    phase: {
      key: "phase",
      zh: "切换",
      en: "SWITCH",
      ok: phaseOk,
      tag: phaseCounter ? `${phase}° 反相` : phaseAligned ? `${phase}° 同相` : `${phase}° 错牙`,
      value: `${phase}°`,
    },
    order: {
      key: "order",
      zh: "秩序",
      en: "ORDER",
      ok: orderOk,
      tag:
        state.mode === "chaos"
          ? "4 维乱切"
          : state.mode === "glare"
            ? "过密过载"
            : dutyOk
              ? `${dutyPctA}:${dutyPctB} 稳态`
              : `${dutyPctA}:${dutyPctB} 吞没`,
      value: `${dutyPctA}:${dutyPctB}`,
    },
  };

  const passedCount = [altOk, contrastOk, phaseOk, orderOk].filter(Boolean).length;

  // 主诊断文案：永远讲清“眼睛为什么这样感受”与下一步操作，不含方位词
  let primary;
  if (state.mode === "glare") {
    primary = {
      status: "fault",
      code: "GLARE",
      badge: `错态 · 高频眩光 (${passedCount} / 4)`,
      headline: "24 拍高反差密条挤在一起，静止画面开始发抖",
      body: "交替不是切得越密越有活力。当黑白等宽条纹被压进极高的空间频率，视皮层会出现过载与虚影闪烁，读图迅速疲劳（见第 06 节视觉不适实验）。",
      action: "点按「8 拍原海报」退出高频压测，把密度收回到人眼能逐拍辨认的舒朗节拍。",
    };
  } else if (state.mode === "chaos") {
    primary = {
      status: "fault",
      code: "CHAOS",
      badge: `错态 · 多维乱切 (${passedCount} / 4)`,
      headline: "明暗、大小、倾角与实虚四路各换各的，秩序彻底散架",
      body: "交替节奏靠「大部分稳定、只切一两项」才读得出节拍。四条视觉通道同时独立翻跳，大脑找不到基准锚点，整张海报立刻退化成视觉噪点。",
      action: "切回「8 拍原海报」锁定纯净双极通道，让每次切换都清晰可预期。",
    };
  } else if (!altOk) {
    if (beatInfo.status === "monotone") {
      primary = {
        status: "fault",
        code: "MONOTONE",
        badge: `错态 · 单调重复 (${passedCount} / 4)`,
        headline: `8 拍全是 ${state.beats[0]}，交替次数为 0——已经退化成纯重复`,
        body: "所有单元一模一样时，视觉神经很快适应并失去起伏，这属于「107 重复原则」的领地，而非一呼一应的交替节奏。",
        action: "直接在四轨画布上点翻间隔拍位（或用下方 8 拍按钮），排成 A-B-A-B 或 A-A-B-B 循环。",
      };
    } else if (beatInfo.status === "unbalanced") {
      primary = {
        status: "fault",
        code: "UNBALANCED",
        badge: `错态 · 拍数失衡 (${passedCount} / 4)`,
        headline: `A 与 B 数量悬殊（${beatInfo.countA} : ${beatInfo.countB}），弱极缩成了偶发点缀`,
        body: "虽然存在重复周期，但一方占了绝大多数拍位，另一方只在缝隙里闪现一次，双眼感知到的是「重复加零星异常」，而不是势均力敌的双向对话。",
        action: "点击占优那一方的拍块，把 8 拍调回 4A : 4B（如 A-B-A-B-A-B-A-B 或 A-A-B-B-A-A-B-B）。",
      };
    } else {
      const run = beatInfo.longRuns[0];
      const runNote = run
        ? `第 ${run.start + 1}–${run.end + 1} 拍连撞了 ${run.len} 个 ${run.type}`
        : `连拍长度在 ${Math.min(...beatInfo.runLens)} 拍与 ${Math.max(...beatInfo.runLens)} 拍之间乱跳`;
      primary = {
        status: "fault",
        code: "APERIODIC",
        badge: `错态 · 周期断律 (${passedCount} / 4)`,
        headline: `${runNote}，视线刚猜出节拍就被当场绊住`,
        body: "交替节奏的第一条铁律是「可预期」。拍型忽长忽短时，人眼每扫过两三格就要重新解码，韵律感在半路断裂。",
        action: "直接点按画布上带虚线标记的撞车拍（或点下方 8 拍公式块）翻转 A/B，排出完整循环。",
      };
    }
  } else if (!contrastOk) {
    primary = {
      status: "fault",
      code: "LOW_CONTRAST",
      badge: `错态 · 对比发闷 (${passedCount} / 4)`,
      headline: `A 与 B 真实亮度比仅 ${lumRatio.toFixed(1)}:1，两极糊成一团暗影`,
      body: "即使 8 拍序列已经排齐，B 极却暗得几乎融进墨黑 A 里。交替必须依赖一眼可辨的感官反差，对比不足时，结构只在图纸上存在、不在眼睛里生效。",
      action: "向右拉动「A/B 亮度反差」滑杆，把 B 极提亮至暖骨米白（经验参考 ≥ 4.2:1，原海报达 16.2:1）。",
    };
  } else if (!phaseOk) {
    primary = {
      status: "fault",
      code: "PHASE_SKEW",
      badge: `错态 · 层间错牙 (${passedCount} / 4)`,
      headline: `三角轨与圆点轨错开了 ${phase}°，上下两层像卡住的齿轮`,
      body: "多轨并行交替时，上下两层的相位要么齐列（0°）、要么彻底反相咬合（180°）。停在中间歪斜角度时，垂直关系既不对齐也不互锁，视线在轨间来回打滑。",
      action: "拖动底沿「层间相位轨」（或直接横向拖移三角/波纹轨）推向 180° 原海报反相咬合，或拉回 0° 同相齐列。",
    };
  } else if (!orderOk) {
    const heavy = dutyPctA > 64 ? "墨黑 A" : "米白 B";
    const thin = dutyPctA > 64 ? "米白 B" : "墨黑 A";
    const thinPct = Math.min(dutyPctA, dutyPctB);
    primary = {
      status: "fault",
      code: "DUTY_IMBALANCE",
      badge: `错态 · 拍宽吞没 (${passedCount} / 4)`,
      headline: `${heavy} 霸占了 ${Math.max(dutyPctA, dutyPctB)}% 拍宽，${thin} 被挤成 ${thinPct}% 细缝`,
      body: "过分悬殊的拍宽让弱势一方退化成装饰边线，双极来回切换的呼吸感被强行压扁。",
      action: "把「A:B 拍宽比」调回经验均衡带（36%–64%，原海报为 50:50 等拍）。",
    };
  } else {
    const phaseDesc = phaseCounter
      ? "上下轨 180° 反相咬合——黑圆正对米白三角、米白圆正对黑三角，横向与纵向同时涌现棋盘张力（原海报结构）。"
      : "上下轨 0° 同相齐列——黑白纵列直落到底，行进感更庄重沉稳，比 180° 反相少一分跳跃、多一分列阵秩序。";
    const beatDesc =
      beatInfo.period === 2
        ? "1:1 紧密二拍交替建立起干脆明快的脉冲"
        : "4 拍分组交替建立起宽厚顿挫的复拍韵律";
    primary = {
      status: "pass",
      code: "CALIBRATED",
      badge: `稳态 · 节拍成立 (4 / 4)`,
      headline: `${beatInfo.patternName} · ${phaseCounter ? "180° 反相咬合" : "0° 同相列阵"}`,
      body: `${beatDesc}；A/B 实测亮度比 ${lumRatio.toFixed(1)}:1、拍宽 ${dutyPctA}:${dutyPctB}，${phaseDesc}`,
      action: "想验证边界？可点「24 拍眩光」或「4 维乱切」看交替失控，或拖相位轨对比 0° 与 180° 的观感差。",
    };
  }

  return {
    passedCount,
    allPass: passedCount === 4,
    pillars,
    primary,
    metrics: {
      periodLabel: beatInfo.patternName,
      lumRatio,
      lumRatioText: `${lumRatio.toFixed(1)}:1`,
      phase,
      phaseLabel: `${phase}°`,
      dutyPctA,
      dutyPctB,
      dutyLabel: `${dutyPctA}:${dutyPctB}`,
      switches: beatInfo.switches,
      colorA,
      colorB,
      rgbB,
      cells,
      beatInfo,
    },
  };
}

// ---------- 第 02 节：五维度通道叠加评估 ----------
export const DIMENSIONS = [
  { id: "value", name: "明暗", en: "VALUE", desc: "墨黑与米白明度对撞，最先被视网膜捕获。" },
  { id: "shape", name: "形态", en: "SHAPE", desc: "圆形与方/三角交替，色彩受限时依旧清晰。" },
  { id: "scale", name: "体量", en: "SCALE", desc: "宽主块与窄辅块交替，拉出强弱拍主次。" },
  { id: "orient", name: "方向", en: "ORIENT", desc: "正倒三角或横竖条切换，带出动势折返。" },
  { id: "solid", name: "虚实", en: "VOID", desc: "实心块与细线框交替，给高密版面留气口。" },
];

export function diagnoseChannels(activeSet) {
  const n = activeSet.size;
  if (n === 0) {
    return {
      level: "fault",
      tag: "0 通道 · 静止重复",
      title: "没有开启任何差异通道，8 格全部一模一样",
      text: "零差异等于纯重复（107 重复原则）：整齐有余，却没有 A 与 B 的对话。先勾开 1 个主通道试试。",
    };
  }
  if (n === 1) {
    const only = DIMENSIONS.find((d) => activeSet.has(d.id));
    return {
      level: "pass",
      tag: "1 通道 · 极简清晰",
      title: `仅用「${only.name}」单一维度交替，秩序最利落`,
      text: "其他四个属性全部锁死不变，视线 0.2 秒内就能读出规律，最适合导航、条纹海报与功能型列表。",
    };
  }
  if (n === 2) {
    const names = DIMENSIONS.filter((d) => activeSet.has(d.id)).map((d) => d.name).join(" + ");
    return {
      level: "pass",
      tag: "2 通道 · 双重强化（推荐）",
      title: `「${names}」同步交替，识别度与丰富度双赢`,
      text: "两条通道锁定同一套 AB 拍序（类似原海报圆点+三角），即使在黑白打印或色弱视野下依然稳固。",
    };
  }
  if (n === 3) {
    return {
      level: "warn",
      tag: "3 通道 · 逼近上限",
      title: "三个维度一起翻跳，装饰味开始盖过结构",
      text: "在艺术海报里勉强可控，但放进信息排版时，读者已经需要分神去猜哪一项才是主层级。",
    };
  }
  return {
    level: "fault",
    tag: `${n} 通道 · 变量过载`,
    title: `${n} 个属性同时切换，交替节奏开始滑向视觉噪点`,
    text: "经验边界是锁死 1–2 个主导通道。一旦超过 3 项，每个单元看起来都像独立异物，整体周期感被彻底稀释。",
  };
}

// ---------- 第 03 节：拍型与错相织机 ----------
export const METERS = {
  ab: {
    id: "ab",
    name: "1:1 二拍 AB",
    code: "A-B-A-B-A-B",
    seq: ["A", "B", "A", "B", "A", "B"],
    feel: "最干脆的钟摆节拍：明快、直白、无主次偏颇，适合双栏卡片与海报主视觉。",
  },
  aab: {
    id: "aab",
    name: "2:1 强弱 AAB",
    code: "A-A-B-A-A-B",
    seq: ["A", "A", "B", "A", "A", "B"],
    feel: "像华尔兹的「强-强-弱」三拍：两块稳重主内容配一块轻盈留白或插图，推进感极强。",
  },
  aabb: {
    id: "aabb",
    name: "2:2 双拍 AABB",
    code: "A-A-B-B-A-A",
    seq: ["A", "A", "B", "B", "A", "A"],
    feel: "步幅放大一倍，节奏慢下来显得厚重庄严，类似教堂双跨拱券的成对呼吸。",
  },
  abba: {
    id: "abba",
    name: "1:2:1 回文 ABBA",
    code: "A-B-B-A-B-B",
    seq: ["A", "B", "B", "A", "B", "B"],
    feel: "中心聚拢、两翼收束的对称回文感，适合杂志跨页中段制造焦点停顿。",
  },
};

// ---------- 第 07 节：单变量练习题真源 ----------
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    correct: false,
    tag: "对比 1.6:1 发闷",
    state: {
      beats: ["A", "B", "A", "B", "A", "B", "A", "B"],
      contrast: 0.14,
      phaseDeg: 180,
      dutyA: 0.5,
      mode: "normal",
    },
    reason: "拍序（ABAB）、180° 反相与 50:50 拍宽全都规矩，但唯独 B 极明度过暗，与墨黑 A 亮度比仅 1.6:1——两极糊成暗块，交替在眼睛里失效。",
  },
  {
    id: "B",
    label: "方案 B",
    correct: false,
    tag: "周期断裂",
    state: {
      beats: ["A", "A", "B", "A", "B", "B", "B", "A"],
      contrast: 1.0,
      phaseDeg: 180,
      dutyA: 0.5,
      mode: "normal",
    },
    reason: "对比度、反相与拍宽都拉满，但 8 拍排成 A-A-B-A-B-B-B-A，中后段出现三连 B 堵拍，打破可预期循环，节奏当场绊脚。",
  },
  {
    id: "C",
    label: "方案 C",
    correct: true,
    tag: "四项均稳 ✓",
    state: {
      beats: ["A", "B", "A", "B", "A", "B", "A", "B"],
      contrast: 1.0,
      phaseDeg: 180,
      dutyA: 0.5,
      mode: "normal",
    },
    reason: "唯一同时守住四条规律的排布：ABAB 稳定二拍、墨黑与米白 16.2:1 清晰反差、上下两层 180° 反相咬合，且 50:50 拍宽均衡，视线顺滑有韵律。",
  },
  {
    id: "D",
    label: "方案 D",
    correct: false,
    tag: "拍宽 82:18 吞没",
    state: {
      beats: ["A", "B", "A", "B", "A", "B", "A", "B"],
      contrast: 1.0,
      phaseDeg: 180,
      dutyA: 0.82,
      mode: "normal",
    },
    reason: "拍序、对比与反相都正确，但 A 独占了 82% 宽度、把 B 挤压成 18% 的细缝——视觉上只剩大黑块夹白丝，失去了双极往复的呼吸感。",
  },
];

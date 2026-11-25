// 101 色彩对比 · 纯前端色彩数学与感知模型
// 所有色彩计算（HSL/RGB/HEX、WCAG 2.1 相对亮度、色觉模拟矩阵、歌德–伊顿面积比）均不依赖外部库。

export const POSTER = {
  paper: "#f7f0e5",
  paper2: "#efe6d6",
  paperHi: "#fbf7f0",
  ink: "#10100e",
  inkSoft: "#4f4b44",
  blue: "#0f42d5",
  orange: "#f5590e",
  orangeInk: "#b83b00",
  lens: "#1c1917",
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;

// HSL (h: 0..360, s: 0..100, l: 0..100) -> [r, g, b] (0..255)
export function hslToRgb(h, s, l) {
  const hn = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0, g = 0, b = 0;
  if (hn < 60) [r, g, b] = [c, x, 0];
  else if (hn < 120) [r, g, b] = [x, c, 0];
  else if (hn < 180) [r, g, b] = [0, c, x];
  else if (hn < 240) [r, g, b] = [0, x, c];
  else if (hn < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

export function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]) {
  return (
    "#" +
    [r, g, b]
      .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function rgbCss([r, g, b], a = 1) {
  return a >= 1
    ? `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
    : `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}

// sRGB -> linear (WCAG 2.1 定义)
function toLinear(c8) {
  const s = clamp(c8, 0, 255) / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function fromLinear(lin) {
  const c = clamp(lin, 0, 1);
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(clamp(s, 0, 1) * 255);
}

export function relativeLuminance(rgb) {
  return 0.2126 * toLinear(rgb[0]) + 0.7152 * toLinear(rgb[1]) + 0.0722 * toLinear(rgb[2]);
}

export function contrastRatio(rgbA, rgbB) {
  const l1 = relativeLuminance(rgbA);
  const l2 = relativeLuminance(rgbB);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

// 自动为色块选出对比度更高的字色（米白纸色或深墨黑）
export function bestInkOn(rgb) {
  const paper = hexToRgb(POSTER.paper);
  const ink = hexToRgb(POSTER.ink);
  return contrastRatio(rgb, paper) >= contrastRatio(rgb, ink) ? POSTER.paper : POSTER.ink;
}

// 线性 RGB 空间的色觉缺陷与灰度模拟（Viénot 1999 简化变换矩阵）
const CVD_MATRICES = {
  deutan: [
    [0.29275, 0.70725, 0.0],
    [0.29275, 0.70725, 0.0],
    [-0.02234, 0.02234, 1.0],
  ],
  protan: [
    [0.11238, 0.88762, 0.0],
    [0.11238, 0.88762, 0.0],
    [0.00401, -0.00401, 1.0],
  ],
};

export function simulateVision(rgb, mode) {
  if (mode === "normal") return rgb;
  const lr = toLinear(rgb[0]);
  const lg = toLinear(rgb[1]);
  const lb = toLinear(rgb[2]);
  if (mode === "gray") {
    const y = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
    const g = fromLinear(y);
    return [g, g, g];
  }
  const m = CVD_MATRICES[mode];
  if (!m) return rgb;
  const nr = m[0][0] * lr + m[0][1] * lg + m[0][2] * lb;
  const ng = m[1][0] * lr + m[1][1] * lg + m[1][2] * lb;
  const nb = m[2][0] * lr + m[2][1] * lg + m[2][2] * lb;
  return [fromLinear(nr), fromLinear(ng), fromLinear(nb)];
}

// 减色混合近似（模仿原海报底部的「蓝圆 + 橙圆 = 交叠深暗」颜料中和感）
export function subtractiveMix(rgbA, rgbB) {
  return [
    Math.round(((rgbA[0] * rgbB[0]) / 255) * 0.82 + 12),
    Math.round(((rgbA[1] * rgbB[1]) / 255) * 0.82 + 10),
    Math.round(((rgbA[2] * rgbB[2]) / 255) * 0.82 + 10),
  ];
}

// ---------- 开场原海报六维对照模型（0–180° 色相夹角 + 明度拉开度 + 面积分缝 + 抽灰检验） ----------
export const SNAP_ANGLES = [0, 30, 60, 90, 120, 150, 180];

export function snapDelta(raw) {
  const d = clamp(Math.round(raw), 0, 180);
  for (const mark of SNAP_ANGLES) {
    if (Math.abs(d - mark) <= 5) return { delta: mark, snapped: true };
  }
  return { delta: d, snapped: false };
}

export const MOOD_MODES = {
  calm: {
    id: "calm",
    label: "理性冷静",
    delta: 26,
    satLeft: 38,
    satRight: 44,
    lumSpread: 68,
    ratio: 66,
  },
  retro: {
    id: "retro",
    label: "复古暖调",
    delta: 146,
    satLeft: 30,
    satRight: 64,
    lumSpread: 54,
    ratio: 62,
  },
  vivid: {
    id: "vivid",
    label: "高能撞色",
    delta: 180,
    satLeft: 90,
    satRight: 92,
    lumSpread: 0,
    ratio: 50,
  },
};

// 点击原海报六条标注各自切入的演示状态
export const AXIS_PRESETS = {
  warmcool: {
    id: "warmcool",
    zh: "冷暖",
    en: "WARM & COOL",
    motto: "冷色后退 · 暖色前进",
    delta: 168,
    satLeft: 86,
    satRight: 92,
    lumSpread: 16,
    ratio: 64,
  },
  complementary: {
    id: "complementary",
    zh: "互补",
    en: "COMPLEMENTARY",
    motto: "色相相对 · 形成强对比",
    delta: 180,
    satLeft: 90,
    satRight: 92,
    lumSpread: 0,
    ratio: 50,
  },
  saturation: {
    id: "saturation",
    zh: "饱和",
    en: "SATURATION",
    motto: "高饱和更醒目 · 低饱和更平衡",
    delta: 180,
    satLeft: 20,
    satRight: 94,
    lumSpread: 8,
    ratio: 64,
  },
  brightness: {
    id: "brightness",
    zh: "明度",
    en: "BRIGHTNESS",
    motto: "明暗对比 · 增强层次",
    delta: 180,
    satLeft: 82,
    satRight: 88,
    lumSpread: 86,
    ratio: 50,
  },
  proportion: {
    id: "proportion",
    zh: "面积",
    en: "PROPORTION",
    motto: "主次分明 · 对比更有效",
    delta: 180,
    satLeft: 90,
    satRight: 92,
    lumSpread: 0,
    ratio: 72,
  },
  mood: {
    id: "mood",
    zh: "情绪",
    en: "MOOD",
    motto: "色彩影响感受 · 传递情绪信息",
    ...MOOD_MODES.calm,
  },
};

// 计算开场分色大圆的左右真实色值与抽灰后色值
export function computeHeroColors(state) {
  const baseH = 224; // 海报钴蓝
  const d = clamp(state.delta, 0, 180);
  const satL = clamp(state.satLeft, 12, 100);
  const satR = clamp(state.satRight, 12, 100);
  const spread = clamp(state.lumSpread, 0, 100) / 100;

  // 0° -> 180° 单向扫过色轮半周：钴蓝(224°) -> 青蓝 -> 翠绿(122°) -> 金黄 -> 海报朱橙(19°)
  const hB = ((baseH - (d / 180) * 205) % 360 + 360) % 360;

  // 基准明度随 lumSpread 向两极拉开：spread=0 为原海报等明度区 (CR 2.29:1)，spread=0.86 可达 CR ~9.5:1
  const lA = lerp(45, 19, spread);
  const baseLB = lerp(45, 51, d / 180);
  const lB = lerp(baseLB, 76, spread);

  // 落在原海报正互补点时精准返回海报采样色 #0f42d5 与 #f5590e
  const exactPoster =
    Math.abs(d - 180) < 0.6 &&
    satL >= 88 &&
    satR >= 88 &&
    spread < 0.02;

  const rgbA = exactPoster ? hexToRgb(POSTER.blue) : hslToRgb(baseH, satL, lA);
  const rgbB = exactPoster ? hexToRgb(POSTER.orange) : hslToRgb(hB, satR, lB);

  const grayA = simulateVision(rgbA, "gray");
  const grayB = simulateVision(rgbB, "gray");
  const dispRgbA = state.gray ? grayA : rgbA;
  const dispRgbB = state.gray ? grayB : rgbB;

  const lensReal = subtractiveMix(rgbA, rgbB);
  const lensDisp = state.gray ? simulateVision(lensReal, "gray") : lensReal;
  const lumRatio = contrastRatio(rgbA, rgbB);

  return {
    hA: baseH,
    hB: Math.round(hB),
    sep: Math.round(d),
    rgbA,
    rgbB,
    hexA: rgbToHex(rgbA),
    hexB: rgbToHex(rgbB),
    dispRgbA,
    dispRgbB,
    dispHexA: rgbToHex(dispRgbA),
    dispHexB: rgbToHex(dispRgbB),
    lensHex: rgbToHex(lensDisp),
    lumRatio,
    satGap: Math.round(Math.abs(satR - satL)),
  };
}

// 根据当前激活的海报维度、0–180° 夹角、面积比与是否抽灰，生成「读数 + 一句为什么」
export function describeHero(state, colors) {
  const { axis, ratio, satLeft, satRight, lumSpread, mood, gray } = state;
  const { sep, lumRatio } = colors;
  const cr = lumRatio.toFixed(2);
  const leftPct = Math.round(ratio);
  const rightPct = 100 - leftPct;

  // 通用明度等级标签（始终直白呈现，不埋角落）
  let crTag = "不可互相当字色";
  let crKind = "warn";
  if (lumRatio >= 4.5) {
    crTag = "正文达标 ≥4.5:1";
    crKind = "good";
  } else if (lumRatio >= 3.0) {
    crTag = "仅大字可用 ≥3:1";
    crKind = "calm";
  }

  // 1) 抽成灰度开启：立刻说出灰度下看到的真相
  if (gray) {
    if (lumRatio < 3.0 && sep >= 120) {
      return {
        metric: `灰度实测 · 亮度对比 ${cr}:1（ΔH ${sep}°）`,
        badge: "两半几乎一样灰",
        kind: "warn",
        crTag,
        crKind,
        why: `抽成灰度后两半几乎一样灰（仅 ${cr}:1）——色相拉满，明度没拉开，所以这对颜色只能做色块，不能互相当字色。点「明度」看看把明暗拉开后的区别。`,
      };
    }
    if (lumRatio < 3.0) {
      return {
        metric: `灰度实测 · 亮度对比 ${cr}:1（ΔH ${sep}°）`,
        badge: "灰调融成一片",
        kind: "warn",
        crTag,
        crKind,
        why: `抽成灰度后两半几乎融成一片（${cr}:1）：不仅色相相近，明度也没拉开，图形边缘与文字层级都会同时塌掉。`,
      };
    }
    if (lumRatio < 4.5) {
      return {
        metric: `灰度实测 · 亮度对比 ${cr}:1（ΔH ${sep}°）`,
        badge: "灰度隐约可分",
        kind: "calm",
        crTag,
        crKind,
        why: `抽成灰度后能分出深浅两块（${cr}:1），大图形和大标题还撑得住，但小号正文依然达不到 WCAG 4.5:1，容易读累。`,
      };
    }
    return {
      metric: `灰度实测 · 亮度对比 ${cr}:1（ΔH ${sep}°）`,
      badge: "抽灰依旧锐利",
      kind: "good",
      crTag,
      crKind,
      why: `就算抽掉全部彩色，两半依然黑白分明（${cr}:1，超过正文 4.5:1 标准）——因为明度差真的拉开了，这组配色才能扛住文字阅读和色盲检验。`,
    };
  }

  // 2) 面积维度（或用户拖动圆内面积分缝）：明确说清哪一边成了主角、为什么
  if (axis === "proportion") {
    if (leftPct >= 62) {
      return {
        metric: `左冷 ${leftPct}% : 右暖 ${rightPct}% · 亮度 ${cr}:1`,
        badge: "右暖成为主角",
        kind: "good",
        crTag,
        crKind,
        why: `冷色占 ${leftPct}% 退成大舞台，暖色缩到 ${rightPct}% 成了绝对主角——因为稀缺制造聚焦，小面积高饱和暖色把全场视线吸到一点，比五五对分更有力量。`,
      };
    }
    if (rightPct >= 62) {
      return {
        metric: `左冷 ${leftPct}% : 右暖 ${rightPct}% · 亮度 ${cr}:1`,
        badge: "左冷成为锚点",
        kind: "good",
        crTag,
        crKind,
        why: `暖色铺到 ${rightPct}% 主导了整张画面的炽热情绪，冷色缩到 ${leftPct}% 成了冷静主角锚点——大暖定气氛、小冷压边界，视觉重心立刻清晰。`,
      };
    }
    if (Math.abs(leftPct - 50) <= 6) {
      return {
        metric: `左冷 ${leftPct}% : 右暖 ${rightPct}% · 亮度 ${cr}:1`,
        badge: "五五分 · 互相抢戏",
        kind: "warn",
        crTag,
        crKind,
        why: `左右面积接近五五开（${leftPct}:${rightPct}），谁都没让步、谁都不是主角——因为等面积高纯色视觉重量互相打架，眼睛在中缝左右摇摆。拖向 70:30 试试。`,
      };
    }
    const lead = leftPct > 50 ? "冷色" : "暖色";
    const star = leftPct > 50 ? "暖色" : "冷色";
    return {
      metric: `左冷 ${leftPct}% : 右暖 ${rightPct}% · 亮度 ${cr}:1`,
      badge: `${star}渐成焦点`,
      kind: "calm",
      crTag,
      crKind,
      why: `${lead}已略占大面，${star}开始收拢成焦点主角——再把比例推向 70:30 或 80:20，主次反差会更利落。`,
    };
  }

  // 3) 互补维度（默认进入的原海报状态）
  if (axis === "complementary") {
    if (sep >= 155) {
      return {
        metric: `色相夹角 ${sep}° · 亮度对比 ${cr}:1`,
        badge: lumRatio < 3.0 ? "色相拉满 · 明度偏近" : "强互补 + 高明度",
        kind: lumRatio < 3.0 ? "warn" : "good",
        crTag,
        crKind,
        why:
          lumRatio < 3.0
            ? `色相拉满到 ${sep}°，蓝把橙衬得最炽热，但两色亮度对比只有 ${cr}:1——所以这对颜色只能做色块碰撞，不能互相当字色。点「抽成灰度」一眼看穿。`
            : `色相相对（${sep}°）又拉开了明度差（${cr}:1），既炸眼又能把图形与文字层次站稳。`,
      };
    }
    if (sep >= 95) {
      return {
        metric: `色相夹角 ${sep}° · 亮度对比 ${cr}:1`,
        badge: "大跨度对比",
        kind: "good",
        crTag,
        crKind,
        why: `两色在色轮上拉开 ${sep}°，对比已经很鲜明但比 180° 少一分紧绷；目前亮度对比 ${cr}:1，若要直接叠文字仍需再拉深浅。`,
      };
    }
    if (sep >= 40) {
      return {
        metric: `色相夹角 ${sep}° · 亮度对比 ${cr}:1`,
        badge: "中度对比 · 偏柔和",
        kind: "calm",
        crTag,
        crKind,
        why: `夹角收窄到 ${sep}°，蓝与青绿之间能轻松区分区域，情绪明显缓和下来，适合多分类图解而不抢走主焦点。`,
      };
    }
    return {
      metric: `色相夹角 ${sep}° · 亮度对比 ${cr}:1`,
      badge: "几乎同色 · 零冲突",
      kind: "warn",
      crTag,
      crKind,
      why: `夹角只有 ${sep}°，左右快融成同一块色——没有色相差时，眼睛找不到落脚点，必须靠「明度」把深浅拉开才撑得起层级。`,
    };
  }

  // 4) 冷暖维度
  if (axis === "warmcool") {
    const isWarmRight = sep >= 120;
    return {
      metric: `色相 ${sep}° · 冷 ${leftPct}% : 暖 ${rightPct}% · 亮度 ${cr}:1`,
      badge: isWarmRight ? "冷退暖进成形" : "温差减弱",
      kind: isWarmRight ? "good" : "calm",
      crTag,
      crKind,
      why: isWarmRight
        ? `大块冷蓝视觉后退作空间背景，暖橙向前凸出抓住视线——因为人眼对短波蓝与长波橙的折射与大气透视经验不同；但若明度太近（${cr}:1），抽灰后纵深会立刻变平。`
        : `夹角拖小到 ${sep}° 后右侧已偏离暖区，两半同处冷调，前推与后退的层次感随之消失。`,
    };
  }

  // 5) 饱和维度
  if (axis === "saturation") {
    if (satLeft <= 35 && satRight >= 80) {
      return {
        metric: `左底纯度 ${satLeft}% : 右焦点 ${satRight}%`,
        badge: "低纯衬高纯 · 最醒目",
        kind: "good",
        crTag,
        crKind,
        why: `左半压到 ${satLeft}% 灰蓝变成静音场，右半 ${satRight}% 朱橙立刻像聚光灯一样跳出来——因为高饱和只有在低饱和的克制里才显得珍贵。`,
      };
    }
    if (satLeft >= 78) {
      return {
        metric: `左底纯度 ${satLeft}% : 右焦点 ${satRight}%`,
        badge: "双高饱和 · 视觉发吵",
        kind: "warn",
        crTag,
        crKind,
        why: `两边纯度都拉到 ${satLeft}% 以上，每个角落都在大喊大叫，反而没人听清重点；试着把底色纯度往左拉低，画面立刻安静又有焦点。`,
      };
    }
    return {
      metric: `左底纯度 ${satLeft}% : 右焦点 ${satRight}%`,
      badge: "纯度过渡区间",
      kind: "calm",
      crTag,
      crKind,
      why: `底色纯度降到 ${satLeft}% 后，高纯度暖色开始浮出画面——纯度差越大，主次越分明，越久看越不累。`,
    };
  }

  // 6) 明度维度
  if (axis === "brightness") {
    if (lumRatio >= 4.5) {
      return {
        metric: `明暗拉开 ${lumSpread}% · 亮度对比 ${cr}:1`,
        badge: "层级稳固 · 抽灰不塌",
        kind: "good",
        crTag,
        crKind,
        why: `深靛底与高亮暖黄拉开 ${cr}:1（远超 WCAG 正文线 4.5:1）——因为人眼辨认形状和文字首先靠亮度通道，哪怕点「抽成灰度」层级依旧纹丝不动。`,
      };
    }
    if (lumRatio >= 3.0) {
      return {
        metric: `明暗拉开 ${lumSpread}% · 亮度对比 ${cr}:1`,
        badge: "中等明度差",
        kind: "calm",
        crTag,
        crKind,
        why: `当前亮度对比 ${cr}:1，大图形和大标题已经能分清，再把明暗滑块往右推一点跨过 4.5:1，小号文字也能轻松直读。`,
      };
    }
    return {
      metric: `明暗拉开 ${lumSpread}% · 亮度对比 ${cr}:1`,
      badge: "等明度陷阱",
      kind: "warn",
      crTag,
      crKind,
      why: `明暗差缩回 ${cr}:1：哪怕色相完全相对，一旦抽成灰度两半几乎一样灰——这正是不能直接拿蓝橙互相当字色的原因。`,
    };
  }

  // 7) 情绪维度
  const moodMap = {
    calm: {
      badge: "理性冷静 · 低唤醒",
      kind: "calm",
      why: `图形一笔没改，只把色相收窄到 ${sep}°、纯度压低并拉开明度（${cr}:1），整张海报立刻从街头冲击切换成安静理性的工具与编辑气质。`,
    },
    retro: {
      badge: "复古暖调 · 纸本温度",
      kind: "good",
      why: `保留大跨度冷暖关系（${sep}°），但把冷底降纯成灰青、暖色收成陶土橙，情绪从刺目促销转成克制温润的手工画册感。`,
    },
    vivid: {
      badge: "高能撞色 · 强唤醒",
      kind: "warn",
      why: `满饱和 180° 蓝橙正面撞击，生理唤醒度最高，半秒就能从远距离抓住目光——适合活动主视觉，却不适合久读正文。`,
    },
  };
  const m = moodMap[mood] || moodMap.calm;
  return {
    metric: `色相 ${sep}° · 纯度 ${satLeft}/${satRight}% · 亮度 ${cr}:1`,
    badge: m.badge,
    kind: m.kind,
    crTag,
    crKind,
    why: m.why,
  };
}

// 歌德（1810）光值与伊顿（1961）面积平衡比
export const GOETHE_PAIRS = {
  bo: {
    id: "bo",
    nameA: "钴蓝",
    nameB: "朱橙",
    en: "BLUE × ORANGE",
    hexA: "#0f42d5",
    hexB: "#f5590e",
    lightA: 4,
    lightB: 8,
    idealA: 67,
    ratioLabel: "蓝 2 : 橙 1",
    goetheNote: "歌德给纯橙打光值 8、纯蓝打光值 4（2:1），伊顿反推面积应给蓝约 2/3、橙约 1/3，视觉才不一边倒。",
  },
  vy: {
    id: "vy",
    nameA: "深紫",
    nameB: "明黄",
    en: "VIOLET × YELLOW",
    hexA: "#5824b8",
    hexB: "#f5c400",
    lightA: 3,
    lightB: 9,
    idealA: 75,
    ratioLabel: "紫 3 : 黄 1",
    goetheNote: "明黄光值高达 9，深紫只有 3（3:1）。同样面积下黄色会完全淹没紫色；给紫色 3/4、黄色 1/4，画面才会稳下来。",
  },
  gr: {
    id: "gr",
    nameA: "深绿",
    nameB: "正红",
    en: "GREEN × RED",
    hexA: "#168a4d",
    hexB: "#d92b2b",
    lightA: 6,
    lightB: 6,
    idealA: 50,
    ratioLabel: "绿 1 : 红 1",
    goetheNote: "红与绿在歌德标尺里同为光值 6，等面积时视觉重量相近；但实际排版中 50:50 的纯红绿容易刺眼且对色盲不友好，通常仍要拉开主次。",
  },
};

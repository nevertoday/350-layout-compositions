// 奇数法则的共享模型：状态只存画框里的数量、焦点位置（0..1）与变化模式。
// 3D 舞台（scene-3d.js）与关掉 WebGL 后的 SVG 降级版（scene-flat.js）共用这份几何与视觉解读。

export const PALETTE = {
  bg: "#120b2e",
  bgSoft: "#1c143e",
  plinth: "#251a50",
  plinthRim: "#463280",
  pink: "#f06c92",
  pinkSoft: "#f79db7",
  orange: "#f29356",
  cream: "#f4dfc2",
  lavender: "#936ec4",
  peach: "#f6b28b",
  plum: "#6d52a8",
  ink: "#f6efe4",
  muted: "#b7accf",
};

// 从原海报的「橙方 + 粉圆 + 米三角 + 紫圆」延续出的几何家族
const CATALOG = [
  { shape: "cube", color: PALETTE.orange, name: "方体" },
  { shape: "sphere", color: PALETTE.pink, name: "球体" },
  { shape: "cone", color: PALETTE.cream, name: "锥体" },
  { shape: "cylinder", color: PALETTE.lavender, name: "柱体" },
  { shape: "octa", color: PALETTE.peach, name: "菱体" },
  { shape: "capsule", color: PALETTE.plum, name: "胶囊" },
  { shape: "torus", color: PALETTE.pinkSoft, name: "环体" },
  { shape: "cube", color: PALETTE.cream, name: "方体" },
  { shape: "cone", color: PALETTE.orange, name: "锥体" },
];

// 为每个数量 N 指定最接近海报气质的造型顺序（奇数时让珊瑚粉球体落在正中）
function blueprint(count) {
  if (count === 1) return [CATALOG[1]];
  if (count === 2) return [CATALOG[0], CATALOG[1]];
  if (count === 3) return [CATALOG[0], CATALOG[1], CATALOG[2]]; // 完全呼应原海报：橙方、粉圆、米三角
  if (count === 4) return [CATALOG[0], CATALOG[1], CATALOG[2], CATALOG[3]]; // 完全呼应原海报「偶数平淡」4 件套
  if (count === 5) return [CATALOG[0], CATALOG[3], CATALOG[1], CATALOG[2], CATALOG[4]];
  if (count === 6) return [CATALOG[0], CATALOG[3], CATALOG[1], CATALOG[2], CATALOG[4], CATALOG[5]];
  if (count === 7) return [CATALOG[0], CATALOG[3], CATALOG[4], CATALOG[1], CATALOG[2], CATALOG[5], CATALOG[6]];
  if (count === 8) return [CATALOG[0], CATALOG[3], CATALOG[4], CATALOG[1], CATALOG[2], CATALOG[5], CATALOG[6], CATALOG[7]];
  return [CATALOG[0], CATALOG[3], CATALOG[4], CATALOG[5], CATALOG[1], CATALOG[2], CATALOG[6], CATALOG[7], CATALOG[8]];
}

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// 返回所有槽位的横向归一化位置 u (0..1)
export function slots(count) {
  if (count === 1) return [0.5];
  const margins = { 2: 0.31, 3: 0.21, 4: 0.16, 5: 0.135, 6: 0.12, 7: 0.105, 8: 0.095, 9: 0.088 };
  const pad = margins[count] ?? 0.1;
  const span = 1 - pad * 2;
  return Array.from({ length: count }, (_, i) => pad + (span * i) / (count - 1));
}

// 放开把手时轻轻吸附到最近的元素槽位（或偶数时的中心空缝）
export function snapFocus(count, u) {
  const s = slots(count);
  const targets = count % 2 === 0 && count <= 6 ? [...s, 0.5] : s;
  let best = u;
  let minD = Infinity;
  for (const t of targets) {
    const d = Math.abs(u - t);
    if (d < minD) {
      minD = d;
      best = t;
    }
  }
  const radius = Math.min(0.055, count > 1 ? (s[1] - s[0]) * 0.34 : 0.1);
  return minD < radius ? best : clamp(u, 0.08, 0.92);
}

// 计算当前画面中每个元素的归一化位置、体量、景深和视觉角色
export function layout(state) {
  const { count, focusU, variation } = state;
  const bp = blueprint(count);
  const us = slots(count);
  const isOdd = count % 2 === 1;
  const isCrowd = count >= 8;
  const isUniform = variation === "uniform";
  const spacing = count > 1 ? us[1] - us[0] : 0.4;

  // 在偶数 2/4/6 且焦点落在中间空缝附近时，呈现典型的「两两对峙、没有胜出者」
  const inEvenSeam = !isOdd && !isCrowd && Math.abs(focusU - 0.5) < Math.min(0.055, spacing * 0.26);

  // 基础缩放随数量收窄，保证 9 个也能呼吸从容、不打架
  const baseScale = count <= 3 ? 1.0 : count === 4 ? 0.88 : count === 5 ? 0.8 : count === 6 ? 0.72 : count === 7 ? 0.65 : count === 8 ? 0.58 : 0.53;
  const sigma = Math.max(0.09, spacing * 0.62);

  let maxWeight = -1;
  let domIndex = -1;

  const raw = bp.map((spec, i) => {
    const u = us[i];
    const dist = Math.abs(u - focusU);
    const weight = isUniform || isCrowd || inEvenSeam ? 0 : Math.exp(-(dist * dist) / (2 * sigma * sigma));
    if (weight > maxWeight) {
      maxWeight = weight;
      domIndex = i;
    }
    return { index: i, u, spec, weight };
  });

  // 只有在非均匀、非群组、非偶数死缝且权重足够高时，才存在明确的主导元素
  const hasDominant = !isUniform && !isCrowd && !inEvenSeam && (count === 1 || maxWeight > 0.55);

  const items = raw.map((it) => {
    const { index, u, spec, weight } = it;
    const isDom = hasDominant && index === domIndex;
    // 自然的微错落，避免陪衬元素排成死直线
    const wave = count > 2 && !isUniform ? Math.sin(((index + 0.5) / count) * Math.PI * 2) * 0.022 : 0;

    let scale = baseScale;
    let v = 0.56; // 画面竖向基准线（0 上 .. 1 下）
    let depth = 0; // 3D 前后层次（正为靠前）
    let shape = spec.shape;
    let color = spec.color;

    if (isUniform) {
      scale = baseScale * 0.86;
      v = 0.57;
      depth = 0;
      shape = "sphere"; // 等大平排时统一形态与高度，凸显「缺变化」
      color = PALETTE.pinkSoft;
    } else if (isCrowd) {
      scale = baseScale * (0.94 + 0.08 * Math.sin(index * 1.7));
      v = 0.56 + wave * 0.6;
      depth = Math.cos(index * 1.3) * 0.08;
    } else if (inEvenSeam) {
      // 偶数均分：体量几乎一样，成对并列在平直基线上
      scale = baseScale * 0.94;
      v = 0.565;
      depth = (index % 2 === 0 ? -0.04 : 0.04);
    } else {
      // 有焦点时的主次层次：靠近 focusU 的元素变大、微升、向前突出
      scale = baseScale * (0.76 + 0.54 * weight);
      v = 0.585 - 0.085 * weight + wave * (1 - weight);
      depth = -0.18 + 0.44 * weight;
    }

    return {
      index,
      u,
      v,
      scale,
      depth,
      weight,
      isDom,
      shape,
      color,
      name: spec.name,
    };
  });

  // 视线扫描路径点（按人眼阅读顺序排列的索引）
  let scanOrder = [];
  if (count === 1) {
    scanOrder = [0];
  } else if (isUniform) {
    scanOrder = items.map((x) => x.index);
  } else if (isCrowd) {
    scanOrder = [0, Math.floor(count / 2), count - 1];
  } else if (inEvenSeam) {
    // 偶数平分：眼睛在左右半区之间来回跳
    const midL = count / 2 - 1;
    const midR = count / 2;
    scanOrder = [midL, midR, 0, count - 1];
  } else if (hasDominant) {
    // 先落主角，再向两侧交替扫视支持元素，最后回落主角
    scanOrder.push(domIndex);
    for (let step = 1; step < count; step++) {
      if (domIndex - step >= 0) scanOrder.push(domIndex - step);
      if (domIndex + step < count) scanOrder.push(domIndex + step);
    }
    scanOrder.push(domIndex);
  } else {
    scanOrder = items.map((x) => x.index);
  }

  return {
    count,
    focusU,
    isOdd,
    isCrowd,
    isUniform,
    inEvenSeam,
    hasDominant,
    domIndex: hasDominant ? domIndex : -1,
    items,
    scanOrder,
  };
}

// 把当前画面状态翻译成白话，说清「这样摆眼睛会怎么看」
export function describe(L) {
  const { count, isOdd, isCrowd, isUniform, inEvenSeam, hasDominant, domIndex } = L;

  if (count === 1) {
    return {
      kind: "solo",
      badge: "单元素 · 独白焦点",
      structure: "1 主",
      eye: "直落一点",
      text: "画面只有一个主角，视线进来就直接停住——很稳，但还没有元素之间的节奏和呼应。按「+」添几个，看看单双数的差别。",
    };
  }

  if (isUniform) {
    return {
      kind: "flat",
      badge: isOdd ? `${count} 个等大平排 · 缺主次` : `${count} 个等大平排 · 平均呆板`,
      structure: `${count} 等分`,
      eye: "从左扫到右",
      text: isOdd
        ? `虽然数量是奇数（${count} 个），但大小、高低和样子全都一样，眼睛只能像点名一样逐个扫过去。奇数只是底子，拉开主次变化才出节奏。`
        : `${count} 个一模一样排成一横排，既没有焦点又被眼睛对半切开，是最容易显得平淡的摆法。`,
    };
  }

  if (isCrowd) {
    return {
      kind: "crowd",
      badge: `${count} 个 · 超出瞬时点数`,
      structure: "整体群组",
      eye: "先看外轮廓",
      text: `超过 7 个以后，眼睛不会再费劲数单数还是双数，而是把这 ${count} 个元素合并成一片「群组轮廓」来读。此时该管的是整体疏密，不是凑单数。`,
    };
  }

  if (inEvenSeam) {
    const half = count / 2;
    const detail =
      count === 2
        ? "两个体量接近的元素放在一起，眼睛会像看乒乓球一样在左右之间来回蹦，正中间留下一道空缝。"
        : count === 4
          ? "4 个元素很容易被眼睛自动配成左 2 + 右 2 两对。两边势均力敌，中间落空，视线没有一个最终落脚点。"
          : "6 个元素会被分成左 3 + 右 3（或三对）对称数组，整齐但少了主角，画面显得偏平。";
    return {
      kind: "even",
      badge: `偶数 ${count} · 两两配对`,
      structure: `${half} | ${half} 对分`,
      eye: "左右来回跳",
      text: `${detail}试着把中间把手往左或右拖，或点「+ / −」换成奇数看看变化。`,
    };
  }

  if (!isOdd && hasDominant) {
    return {
      kind: "even-forced",
      badge: `偶数 ${count} · 强行偏心`,
      structure: `1 主 + ${count - 1} 辅`,
      eye: "偏侧聚焦",
      text: `你把第 ${domIndex + 1} 个硬拉成了主角，打破了 ${count} 个元素的平均对称——偶数也能做出主次，但你得额外靠体量或位置去「纠偏」，不像奇数在居中时自然就稳。`,
    };
  }

  // 奇数 3 / 5 / 7 且有明确主角
  const centered = domIndex === Math.floor(count / 2);
  const sideCount = count - 1;
  const noteByN = {
    3: centered
      ? "3 个拆不成两半：中间那个自然成了主导元素，左右两个一退一衬，眼睛先停在中心，再沿弧线扫过两侧，稳当又活络。"
      : `你把主导元素移到了第 ${domIndex + 1} 位：3 个元素形成了一大带两小的斜向节奏，比居中更有动势。`,
    5: centered
      ? "5 个是奇数里最丰盛的一档：中间主角稳住阵脚，左右各两件高低错落，既有层次变化，又还没多到数不清。"
      : `5 个元素里第 ${domIndex + 1} 位成为锚点，左右不等长的陪衬拉出一条起伏的韵律线。`,
    7: centered
      ? "7 个已经逼近一眼看清个数的上限：正中大主角仍能压住场子，两侧各三件形成宽阔的波浪节奏；再往上加就会读成一整片群组。"
      : `7 个元素里由第 ${domIndex + 1} 位领头，形成长短不一的波峰与波谷；如果陪衬再多，主次就会开始模糊。`,
  };

  return {
    kind: "odd",
    badge: `奇数 ${count} · 自然焦点`,
    structure: `1 主 + ${sideCount} 辅`,
    eye: centered ? "中 → 两侧 → 回中" : "主角 → 周边扫视",
    text: noteByN[count] || "奇数组合自然留出一个主导锚点，其余作为支持元素陪衬出层次与节奏。",
  };
}

// 110 渐变组织 · 开场「活体梯度坡面与流向罗盘台」单一真源模型
// 状态仅保存归一化坐标与结构参数；所有步阶坐标、重叠加碰、尺寸跨比、轴向与彩度留存全部实算。

import { interpolateColor, midChromaRetention, oklabToOklch, rgbToOklab, rgbToHex } from "./color.js";

export const COLOR_MODES = {
  srgb: {
    id: "srgb",
    label: "sRGB 灰泥",
    startHex: "#5B6CE6",
    endHex: "#F55B1E",
    space: "srgb",
    note: "直接按 RGB 通道线性混合，跨色相中段彩度塌陷发灰",
  },
  oklch: {
    id: "oklch",
    label: "Oklch 霞光",
    startHex: "#8D62C8",
    endHex: "#F55B1E",
    space: "oklch",
    note: "沿感知均匀色环穿过玫瑰粉与蜜桃色，复刻 110 原海报霞光",
  },
  oklab: {
    id: "oklab",
    label: "Oklab 柔顺",
    startHex: "#8D62C8",
    endHex: "#F55B1E",
    space: "oklab",
    note: "按感知均匀平面直线过渡，亮度平稳、不跳色",
  },
  clash: {
    id: "clash",
    label: "补色对撞",
    startHex: "#00B8A9",
    endHex: "#F5334F",
    space: "srgb",
    note: "高饱和互补色直接硬接，边界刺眼发振、中段浑浊发死",
  },
};

export const MOTIF_MODES = {
  poster: { id: "poster", label: "原海报阵" },
  circles: { id: "circles", label: "圆径纵深" },
  morph: { id: "morph", label: "形态演进" },
};

// 开场默认：0/4 翻车态（3阶硬切 + 逆序折返 + 1.10×扁平 + 短距压平 + sRGB灰泥）
export function createBrokenState() {
  return {
    start: { x: 0.33, y: 0.46 },
    end: { x: 0.67, y: 0.54 },
    steps: 3,
    curveExp: 0.42,
    sizeRatio: 1.1,
    alphaSpan: 0.06,
    colorMode: "srgb",
    disordered: true,
    motif: "poster",
  };
}

// 参考达标解：还原 110 原海报由左上丁香轻端向右下炽橙重端舒展推进
export function createPosterSolution() {
  return {
    start: { x: 0.15, y: 0.16 },
    end: { x: 0.85, y: 0.82 },
    steps: 7,
    curveExp: 1.48,
    sizeRatio: 3.4,
    alphaSpan: 0.64,
    colorMode: "oklch",
    disordered: false,
    motif: "poster",
  };
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// 角度转自然方向词与标准八向箭头
export function describeDirection(deg) {
  const a = ((deg % 360) + 360) % 360;
  const dirs = [
    { name: "向右平推", arrow: "→" },
    { name: "右下斜展", arrow: "↘" },
    { name: "向下沉降", arrow: "↓" },
    { name: "左下斜扫", arrow: "↙" },
    { name: "向左回推", arrow: "←" },
    { name: "左上回升", arrow: "↖" },
    { name: "向上攀升", arrow: "↑" },
    { name: "右上扬升", arrow: "↗" },
  ];
  const idx = Math.round(a / 45) % 8;
  return { ...dirs[idx], deg: Math.round(a) };
}

// 按状态和画布尺寸（CSS 像素）精确算出每一阶的几何位置、半径、色彩、重叠率与 4 项诊断
export function evaluate(state, width = 920, height = 430) {
  const W = Math.max(240, width);
  const H = Math.max(180, height);
  const diag = Math.hypot(W, H);
  const steps = clamp(Math.round(state.steps), 3, 14);
  const curveExp = clamp(state.curveExp, 0.3, 3.2);
  const sizeRatio = clamp(state.sizeRatio, 1.0, 9.0);
  const alphaSpan = clamp(state.alphaSpan, 0, 0.82);
  const palette = COLOR_MODES[state.colorMode] || COLOR_MODES.oklch;

  const sx = clamp(state.start.x, 0.06, 0.94) * W;
  const sy = clamp(state.start.y, 0.08, 0.92) * H;
  const ex = clamp(state.end.x, 0.06, 0.94) * W;
  const ey = clamp(state.end.y, 0.08, 0.92) * H;

  const dx = ex - sx;
  const dy = ey - sy;
  const axisLen = Math.hypot(dx, dy);
  const spanRatio = axisLen / diag;
  const spanPct = Math.round(spanRatio * 100);
  const angleRad = Math.atan2(dy, dx);
  const angleDeg = (angleRad * 180) / Math.PI;
  const dirInfo = describeDirection(angleDeg);

  // 垂直于主渐变轴的单位向量（用于在「原海报阵」模式里把 3 条平行渐进几何带展开成扇形斜坡）
  const ux = axisLen > 1 ? dx / axisLen : 1;
  const uy = axisLen > 1 ? dy / axisLen : 0;
  const px = -uy;
  const py = ux;

  // 基准最大半径随画布短边自适应，确保 390 与 1440 均为正圆/等比几何
  const baseScale = Math.min(W, H);
  const maxR = clamp(baseScale * 0.088, 17, 36);
  const minR = maxR / sizeRatio;
  const maxAlpha = 0.97;
  const minAlpha = clamp(maxAlpha - alphaSpan, 0.14, 0.97);

  // 每一阶的单调理想进度 u_i -> 幂指数曲线 e_i
  const rawNodes = [];
  for (let i = 0; i < steps; i++) {
    const u = steps === 1 ? 1 : i / (steps - 1);
    const eased = u ** curveExp;
    rawNodes.push({ index: i, u, eased });
  }

  // 若处于逆序错态，把中间一阶的视觉强度往回折返，制造真实可读的顺序倒挂
  const disorderedIdx = state.disordered ? Math.max(1, Math.min(steps - 2, Math.floor(steps / 2))) : -1;
  const items = rawNodes.map((n, i) => {
    let val = n.eased;
    let isDisorderedNode = false;
    if (i === disorderedIdx) {
      // 令该阶退回接近起点，但仍落在中段位置，形成「小→突然变大/变小→再跳」的真实错序
      val = steps <= 3 ? 0.06 : Math.max(0.05, rawNodes[Math.max(0, i - 1)].eased * 0.32);
      isDisorderedNode = true;
    }
    // 元素沿轴线的位置同时受线性位置与微弱曲线推进影响（让曲线拖拉同时牵动疏密与大小）
    const posT = clamp(n.u * 0.72 + n.eased * 0.28, 0, 1);
    const cx = sx + dx * posT;
    const cy = sy + dy * posT;
    const radius = minR + (maxR - minR) * val;
    const alpha = minAlpha + (maxAlpha - minAlpha) * val;
    const rgb = interpolateColor(palette.startHex, palette.endHex, val, palette.space);
    const hex = rgbToHex(rgb);
    const lch = oklabToOklch(rgbToOklab(rgb));

    // 在「原海报阵」模式里，每阶派生上中下 3 枚协同几何（复刻原海报圆/三角/菱形/方/环多层扇形展开）
    // 上排（圆点）、中排（主形：随进阶从圆→三角→菱形→圆环→实圆）、下排（方块）
    const fanSpread = baseScale * (0.045 + 0.155 * val);
    return {
      index: i,
      u: n.u,
      val,
      posT,
      cx,
      cy,
      radius,
      alpha,
      rgb,
      hex,
      chroma: lch.C,
      lightness: lch.L,
      fanSpread,
      isDisorderedNode,
    };
  });

  // 计算真实相邻碰撞重叠率 & 画布边缘裁切
  let maxOverlapRatio = 0;
  const overlapPairs = [];
  for (let i = 0; i < items.length - 1; i++) {
    const a = items[i];
    const b = items[i + 1];
    const dist = Math.hypot(b.cx - a.cx, b.cy - a.cy);
    const sumR = a.radius + b.radius;
    const overlap = sumR > 0 ? Math.max(0, (sumR - dist) / Math.min(a.radius, b.radius) * 0.5) : 0;
    if (overlap > maxOverlapRatio) maxOverlapRatio = overlap;
    if (overlap >= 0.12) overlapPairs.push([i, i + 1]);
  }
  const maxOverlapPct = Math.round(clamp(maxOverlapRatio, 0, 1.5) * 100);

  let edgeClipped = false;
  const margin = 8;
  for (const it of items) {
    if (it.cx - it.radius < margin || it.cx + it.radius > W - margin || it.cy - it.radius < margin || it.cy + it.radius > H - margin) {
      edgeClipped = true;
      break;
    }
  }

  // 真实彩度留存率与有效渐变维度统计
  const chromaRetention = midChromaRetention(palette.startHex, palette.endHex, palette.space);
  const chromaPct = Math.round(chromaRetention * 100);
  const isClash = state.colorMode === "clash";
  const isMuddy = !isClash && chromaRetention < 0.72;

  let activeDims = 1; // 色彩变化始终算 1 维
  if (sizeRatio >= 1.8) activeDims++;
  if (alphaSpan >= 0.35) activeDims++;
  if (state.motif === "poster" || state.motif === "morph") activeDims++;

  // 四大原海报关键词单源达标判据（每项对应左书脊一条色杠）
  const transitionOk = !state.disordered && steps >= 5 && steps <= 9 && curveExp >= 1.05 && curveExp <= 2.15 && maxOverlapPct < 12;
  const layeringOk = sizeRatio >= 2.35 && sizeRatio <= 5.8 && alphaSpan >= 0.38 && maxOverlapPct < 12;
  const directionOk = spanRatio >= 0.44 && spanRatio <= 0.86 && !edgeClipped;
  const changeOk = !isClash && !isMuddy && activeDims >= 3;

  const score = [transitionOk, layeringOk, directionOk, changeOk].filter(Boolean).length;

  // 左书脊四词短签（单真源同步）
  const transitionTag = state.disordered
    ? "逆序折返"
    : steps < 5
      ? `仅 ${steps} 阶硬切`
      : steps > 9 || maxOverlapPct >= 12
        ? `${steps} 阶过密粘连`
        : curveExp < 1.05
          ? `前陡 p=${curveExp.toFixed(2)}`
          : curveExp > 2.15
            ? `尾爆 p=${curveExp.toFixed(2)}`
            : `${steps} 阶顺滑`;

  const layeringTag =
    sizeRatio < 2.35 || alphaSpan < 0.38
      ? `平权 ${sizeRatio.toFixed(1)}×`
      : sizeRatio > 5.8
        ? `${sizeRatio.toFixed(1)}× 起点隐身`
        : maxOverlapPct >= 12
          ? `压叠 ${maxOverlapPct}%`
          : `${sizeRatio.toFixed(1)}× 纵深`;

  const directionTag = edgeClipped
    ? "末端裁边"
    : spanRatio < 0.44
      ? `跨距过短 ${spanPct}%`
      : spanRatio > 0.86
        ? `拉满贴边 ${spanPct}%`
        : `${dirInfo.arrow} ${dirInfo.deg}° 汇聚`;

  const changeTag = isClash
    ? "补色振颤"
    : isMuddy
      ? `sRGB 灰泥 ${chromaPct}%`
      : activeDims < 3
        ? `仅 ${activeDims} 维单调`
        : `${palette.label} · ${activeDims} 维`;

  // 8 类失误白话诊断（讲清「为什么眼睛会这样看」+ 明确下一步）
  let diagBadge = "通透成坡 · 4 / 4";
  let diagKind = "ok";
  let diagTitle = "离散元素连成了可预期的纵深斜坡";
  let diagWhy = `当前 ${steps} 阶沿 ${dirInfo.arrow} ${dirInfo.deg}° 舒展推进，尺寸跨比 ${sizeRatio.toFixed(1)}×、变化率指数 p=${curveExp.toFixed(2)}，在 ${palette.label} 空间里中段彩度保住 ${chromaPct}%。眼睛无需思考便从轻盈起端顺滑落向炽重焦点。`;
  let diagNext = "试试故意把步阶推到 13 阶、把变化率拉到 2.8，或切回 sRGB，亲眼验证渐变是如何从顺滑走向翻车的。";

  if (state.disordered) {
    diagKind = "err";
    diagBadge = `错态 · 逆序折返 (${score} / 4)`;
    diagTitle = `第 ${disorderedIdx + 1} 阶突然退回变小，视线半路被绊住`;
    diagWhy = "渐变组织成立的第一条铁律是「单调可预期」。一旦中间某一阶反向跳回小尺寸与浅色，大脑就会把它当成异常孤点，连续过渡当场断裂。";
    diagNext = "直接在画布上点击带红虚环的错序图形（或按下方「理顺顺序」），把它重新编回递增序列。";
  } else if (steps < 5) {
    diagKind = "err";
    diagBadge = `错态 · 断层硬切 (${score} / 4)`;
    diagTitle = `只有 ${steps} 阶，看起来像硬拼色块而非渐变`;
    diagWhy = "步阶过少（少于 5 阶）时，相邻两阶的跨跳幅度太大，人眼只能看到孤立的「大中小」三个台阶，感受不到平滑流动的过渡坡度。";
    diagNext = "把步阶数加到 5–9 阶（如 7 阶），观察相邻图形如何开始咬合成连续斜坡。";
  } else if (maxOverlapPct >= 12 || steps > 9) {
    diagKind = "err";
    diagBadge = `错态 · 过密粘连 (${score} / 4)`;
    diagTitle = steps > 9 ? `塞进 ${steps} 阶过密粘连，糊成一团实心条` : `相邻图形重叠加碰达 ${maxOverlapPct}%，呼吸缝消失`;
    diagWhy = "渐变不是阶数越多越好：超过 10 阶或起止跨距太紧时，图形边缘相互吃进彼此，独立模块的轮廓边界糊成浑浊长带，反而失去了层次感。";
    diagNext = steps > 9 ? "把步阶收回到 6–8 阶，给每一步留出清晰空气缝。" : "拖动起点或终点锚点拉长轴距，解开重叠加碰。";
  } else if (curveExp < 1.05) {
    diagKind = "err";
    diagBadge = `错态 · 头重断崖 (${score} / 4)`;
    diagTitle = `变化率曲线偏平（p=${curveExp.toFixed(2)}），前两步跳太猛、后段停滞`;
    diagWhy = "人眼对尺寸变化接近对数感知：幂指数过低时，前几阶一步暴涨、后几阶几乎一样大，视觉推进在半路提前泄气。";
    diagNext = "向右拖动坡面底沿的「变化率弧点」（经验舒适带 p=1.15–2.00），让每一步按接近等比的节奏匀加速放大。";
  } else if (curveExp > 2.15) {
    diagKind = "err";
    diagBadge = `错态 · 尾端爆冲 (${score} / 4)`;
    diagTitle = `变化率过陡（p=${curveExp.toFixed(2)}），前半段空虚、末两阶猛撞`;
    diagWhy = "指数拉得过高时，前面大半截元素被压成微尘几乎停滞，所有视觉重量全部砸在最后两阶上，坡面变成悬崖。";
    diagNext = "向左把底沿「变化率弧点」拉回 1.15–2.00 的柔和等比带。";
  } else if (sizeRatio < 2.35 || alphaSpan < 0.38) {
    diagKind = "err";
    diagBadge = `错态 · 平权扁平 (${score} / 4)`;
    diagTitle = `首尾体量仅差 ${sizeRatio.toFixed(1)}×，拉不出前后层次`;
    diagWhy = "没有足够的尺寸与通透级差，全部元素会停在同一个浅平面上平权排排坐，退化成单调重复，无法唤起由远及近的空间深度。";
    diagNext = "把「纵深级差」切到 3.4×（经验参考 2.4×–5.6×），让轻端通透远退、重端沉实逼近。";
  } else if (sizeRatio > 5.8) {
    diagKind = "err";
    diagBadge = `错态 · 起点隐身 (${score} / 4)`;
    diagTitle = `体量跨比高达 ${sizeRatio.toFixed(1)}×，最前端几乎缩成针尖消失`;
    diagWhy = "跨比失控超过 6 倍时，最小阶在手机屏上缩成难以识别的噪点，起始锚点断线，读者找不到视觉滑梯从哪起步。";
    diagNext = "把「纵深级差」收回 3.4×–4.5×，让起点既轻盈又清晰可辨。";
  } else if (edgeClipped) {
    diagKind = "err";
    diagBadge = `错态 · 末端溢出 (${score} / 4)`;
    diagTitle = "渐变轴端点顶到了画框边缘，最重一阶被裁切";
    diagWhy = "渐变汇集的终点往往承载最强视觉重量，一旦贴边被裁掉一角，整条视线滑梯的落点就显得局促憋闷。";
    diagNext = "把靠近边界的锚点轻轻往画布内侧拖回一点，给末端重图形留出呼吸边。";
  } else if (spanRatio < 0.44 || spanRatio > 0.86) {
    diagKind = "err";
    diagBadge = spanRatio < 0.44 ? `错态 · 跨距受挤 (${score} / 4)` : `错态 · 贴边满溢 (${score} / 4)`;
    diagTitle = spanRatio < 0.44 ? `渐变轴仅占画幅 ${spanPct}%，方向势能挤在画心` : `渐变轴拉到 ${spanPct}%，四周留白被吃光`;
    diagWhy = spanRatio < 0.44
      ? "跨度太短时，所有阶梯挤成一团小块，整幅画布的斜向导引势能完全铺展不开。"
      : "起止两端拉得过满，画幅失去周边呼吸空间，方向引导反而显得急促压迫。";
    diagNext = spanRatio < 0.44
      ? "直接拖拽画布里的起点（○）向左上、终点（◉）向右下铺开（经验跨距 45%–84%）。"
      : "把起点或终点锚向内微收，让跨距回到 55%–80% 的舒展区间。";
  } else if (isClash) {
    diagKind = "err";
    diagBadge = `错态 · 补色振颤 (${score} / 4)`;
    diagTitle = "高饱和互补色硬撞，中段发死且边缘刺眼";
    diagWhy = "青绿与烈红分处色环正对面，直接拉渐变必然穿过零彩度灰区，同时高纯度边界让视网膜反复对焦抖动，破坏自然过渡。";
    diagNext = "把色域切到「Oklch 霞光」或「Oklab 柔顺」，沿相邻暖弧平滑渡色。";
  } else if (isMuddy) {
    diagKind = "err";
    diagBadge = `错态 · sRGB 灰泥 (${score} / 4)`;
    diagTitle = `sRGB 线性混色让中段彩度塌陷到 ${chromaPct}%，透出脏灰`;
    diagWhy = "蓝紫与炽橙在 sRGB 通道里简单算术平均时，中点绿红蓝趋于接近而失掉纯度，生出浑浊的灰褐泥带，清透霞光瞬间变脏。";
    diagNext = "点下方「Oklch 霞光」或「Oklab 柔顺」，看中段如何经由玫瑰粉重新透亮起来。";
  }

  return {
    W,
    H,
    sx,
    sy,
    ex,
    ey,
    ux,
    uy,
    px,
    py,
    axisLen,
    spanRatio,
    spanPct,
    angleRad,
    angleDeg,
    dirInfo,
    steps,
    curveExp,
    sizeRatio,
    alphaSpan,
    palette,
    items,
    disorderedIdx,
    maxOverlapPct,
    overlapPairs,
    edgeClipped,
    chromaRetention,
    chromaPct,
    activeDims,
    pillars: {
      transition: { ok: transitionOk, tag: transitionTag },
      layering: { ok: layeringOk, tag: layeringTag },
      direction: { ok: directionOk, tag: directionTag },
      change: { ok: changeOk, tag: changeTag },
    },
    score,
    diag: {
      kind: diagKind,
      badge: diagBadge,
      title: diagTitle,
      why: diagWhy,
      next: diagNext,
    },
  };
}

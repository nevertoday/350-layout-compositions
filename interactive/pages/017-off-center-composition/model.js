// 开场「通栏活体海报重心台」的唯一状态与合成重心计算模型。
// 所有五个元素（珊瑚红圆、左下暗弧、左上标题字重、右上 5×5 点阵、右下 45° 珊瑚斜线）
// 共同决定整张海报的合成视觉重心 (gx, gy)，三态（居中 / 偏心 / 过偏）完全由这个合成重心判断。

export const LIMITS = {
  circleMin: 0.045,
  circleMax: 0.24,
  arcMin: 0,
  arcMax: 1,
};

export const TITLE_WEIGHTS = [400, 700, 900];

export const DEFAULT_STATE = {
  circleR: 0.14,     // 珊瑚圆半径系数（相对画幅基准边）
  arcThick: 0.62,    // 左下暗弧厚度（0 = 收起，1 = 满厚）
  titleWeight: 900,  // 左上标题字重（400 细 / 700 粗 / 900 极粗）
  showDots: true,    // 右上 5×5 白点阵
  showHatches: true, // 右下 45° 珊瑚斜线
};

export function clamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x));
}

export function clampState(s) {
  return {
    circleR: clamp(Number(s.circleR), LIMITS.circleMin, LIMITS.circleMax),
    arcThick: clamp(Number(s.arcThick), LIMITS.arcMin, LIMITS.arcMax),
    titleWeight: TITLE_WEIGHTS.includes(Number(s.titleWeight)) ? Number(s.titleWeight) : 900,
    showDots: Boolean(s.showDots),
    showHatches: Boolean(s.showHatches),
  };
}

// 统一返回五组元素的画幅相对位置（桌面横幅 vs 手机竖幅自动适配，确保零遮挡且几何一致）
export function getLayoutAnchors(isPortrait) {
  if (isPortrait) {
    return {
      title: { u: 0.22, v: 0.14 },
      circle: { u: 0.76, v: 0.355 },
      dots: { u: 0.87, v: 0.11 },
      hatches: { u: 0.85, v: 0.85 },
      crosshair: { u: 0.54, v: 0.55 },
      arcBase: { u: 0.11, v: 0.85, du: 0.08, dv: -0.08 },
    };
  }
  return {
    title: { u: 0.21, v: 0.19 },
    circle: { u: 0.755, v: 0.40 },
    dots: { u: 0.915, v: 0.145 },
    hatches: { u: 0.905, v: 0.855 },
    crosshair: { u: 0.625, v: 0.54 },
    arcBase: { u: 0.12, v: 0.85, du: 0.08, dv: -0.08 },
  };
}

// 实时计算全部五个元素的视觉权重与合成重心（经验类比模型，用于建立整体平衡直觉）
export function analyzePoster(rawState, isPortrait = false) {
  const s = clampState(rawState);
  const a = getLayoutAnchors(isPortrait);

  // 高纯度珊瑚红圆是海报视觉主核，感知份量随面积增长
  const wCircle = 86 * Math.pow(s.circleR / 0.14, 1.85);
  // 左上极粗白字标题形成左上配重，字重越粗墨量越重
  const wTitle = s.titleWeight === 400 ? 8 : s.titleWeight === 700 ? 15 : 22;
  // 左下暗弧低对比但大面积，随厚度线性托住左下象限
  const wArc = s.arcThick * 28;
  // 右上点阵与右下斜线是远角细节份量
  const wDots = s.showDots ? 11 : 0;
  const wHatches = s.showHatches ? 13 : 0;

  const arcU = a.arcBase.u + a.arcBase.du * s.arcThick;
  const arcV = a.arcBase.v + a.arcBase.dv * s.arcThick;

  const items = [
    { id: "circle", label: "珊瑚圆", u: a.circle.u, v: a.circle.v, w: wCircle },
    { id: "title", label: "标题", u: a.title.u, v: a.title.v, w: wTitle },
    { id: "arc", label: "暗弧", u: arcU, v: arcV, w: wArc },
    { id: "dots", label: "点阵", u: a.dots.u, v: a.dots.v, w: wDots },
    { id: "hatches", label: "斜线", u: a.hatches.u, v: a.hatches.v, w: wHatches },
  ];

  const totalW = items.reduce((sum, it) => sum + it.w, 0) || 1;
  const gx = items.reduce((sum, it) => sum + it.u * it.w, 0) / totalW;
  const gy = items.reduce((sum, it) => sum + it.v * it.w, 0) / totalW;

  const dx = gx - 0.5;
  const dy = gy - 0.5;
  const ecc = Math.hypot(dx, dy);
  const eccPct = Math.round(ecc * 100);

  // 左右两侧相对画心的水平拉力对照（直白回答「对侧抵消了主侧拉力的百分之多少」）
  let rightPull = 0;
  let leftPull = 0;
  for (const it of items) {
    if (it.u >= 0.5) rightPull += it.w * (it.u - 0.5);
    else leftPull += it.w * (0.5 - it.u);
  }
  const rightHeavy = rightPull >= leftPull;
  const mainPull = Math.max(rightPull, leftPull, 0.001);
  const oppPull = Math.min(rightPull, leftPull);
  const offsetPct = Math.min(100, Math.round((oppPull / mainPull) * 100));

  // 偏移方位（给白话诊断用）
  const horizDir = dx > 0.025 ? "右" : dx < -0.025 ? "左" : "";
  const vertDir = dy < -0.025 ? "上" : dy > 0.025 ? "下" : "";
  const dirLabel = horizDir || vertDir ? `${horizDir}${vertDir}` : "画心";

  // 三态判定完全取决于合成视觉重心距画心的距离（本页自定经验阈值：居中 < 6.5%，偏心 6.5%–17.5%，过偏 > 17.5%）
  let zone = "sweet";
  let badge = "偏心 · 动态平衡";
  let headline = "合起来的重量，刚好偏而不倒";
  let reason = "";

  if (ecc < 0.065) {
    zone = "center";
    badge = "居中 · 静态";
    headline = "合成重心回到画心，拉力几乎归零";
    reason = `对侧抵消了主侧拉力的 ${offsetPct}%，五组元素在中心附近打成平手——画面稳重安静，但失去了偏心的流动张力。试着把珊瑚圆拉大，或把左下暗弧收薄。`;
  } else if (ecc > 0.175) {
    zone = "over";
    badge = "过偏 · 失衡";
    headline = `合成重心滑向${dirLabel}，画面开始倾倒`;
    if (rightHeavy) {
      const tip =
        s.arcThick < 0.25
          ? "左下暗弧太薄甚至已收起，把暗弧往外拖厚或点掉右侧点阵与斜线，就能把重心拉回来。"
          : s.circleR > 0.18
            ? "珊瑚圆体量压倒了左半幅，把圆缘往内收小一点，或加重标题与暗弧来对冲。"
            : "右侧零碎元素叠在一起加重了偏坠，试着点掉点阵或斜线，或加粗左上标题。";
      reason = `左侧只抵消了右侧拉力的 ${offsetPct}%，重心偏离画心 ${eccPct}%。${tip}`;
    } else {
      reason = `右侧只抵消了左侧拉力的 ${offsetPct}%，左侧暗弧与粗体标题反而压过了极小的珊瑚圆；把珊瑚圆拉大一点即可恢复平衡。`;
    }
  } else {
    zone = "sweet";
    badge = "偏心 · 动态平衡";
    headline = rightHeavy ? `重心稳偏${dirLabel}，对侧托得住` : `重心反偏${dirLabel}，仍有张力`;
    const cwParts = [];
    if (s.arcThick > 0.15) cwParts.push("左下暗弧");
    if (s.titleWeight >= 700) cwParts.push(`${s.titleWeight === 900 ? "极粗" : "粗体"}标题`);
    const cwNames = cwParts.length ? cwParts.join("与") : "左半留白与细字标题";
    reason = rightHeavy
      ? `${cwNames}抵消了右侧拉力的 ${offsetPct}%，把合成重心稳留在偏离画心 ${eccPct}% 的位置——视线先冲向珊瑚圆，再顺着对角回落。`
      : `缩小主圆后重心转到${dirLabel}偏离 ${eccPct}%，右侧元素拉住 ${offsetPct}% 的余力，版面依旧保持非对称活力。`;
  }

  const counterText = rightHeavy
    ? `左侧抵消右侧拉力 ${offsetPct}%`
    : `右侧抵消左侧拉力 ${offsetPct}%`;

  const circlePct = Math.round(((s.circleR - LIMITS.circleMin) / (LIMITS.circleMax - LIMITS.circleMin)) * 100);
  const arcPct = Math.round(s.arcThick * 100);

  return {
    state: s,
    gx,
    gy,
    dx,
    dy,
    ecc,
    eccPct,
    offsetPct,
    rightHeavy,
    dirLabel,
    counterText,
    zone,
    badge,
    headline,
    reason,
    circlePct,
    arcPct,
    weights: { circle: wCircle, title: wTitle, arc: wArc, dots: wDots, hatches: wHatches, total: totalW },
    anchors: a,
  };
}

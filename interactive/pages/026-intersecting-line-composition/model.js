// 026 交叉线构图 · 单一几何与评判真源
// 所有坐标归一化到画框 [0, 1] × [0, 1]，所有夹角、四象限真实面积占比、留白、交点数与四项验收灯全部从此算出。

export const SCENES = {
  construct: {
    id: "construct",
    label: "建构海报",
    en: "CONSTRUCTIVIST",
    note: "化用 026 原海报的炭黑主梁、朱红次梁、松青与朱红配重双圆及极细折线标注。",
  },
  arch: {
    id: "arch",
    label: "建筑钢构",
    en: "ARCHITECTURE",
    note: "同一组交叉骨架映射为美术馆钢桁架与天桥斜梁，观察结构与天光切面。",
  },
  editorial: {
    id: "editorial",
    label: "书展封面",
    en: "EDITORIAL COVER",
    note: "文字自动落入当前实测面积最大的负空间象限，检验交叉骨架能否托住真实排版。",
  },
};

export const JOINTS = {
  muddy: { id: "muddy", label: "泥浊叠压", short: "混色泥浊" },
  over: { id: "over", label: "主压次遮挡", short: "黑压红 T 型" },
  knockout: { id: "knockout", label: "反白镂空", short: "原海报菱窗" },
};

export const CLUTTERS = {
  web: { id: "web", label: "4 条杂线", short: "等粗铁丝网", count: 4 },
  guide: { id: "guide", label: "极细辅线", short: "原海报构造线", count: 2 },
  pure: { id: "pure", label: "纯净双梁", short: "仅主次两梁", count: 0 },
};

// 开场刻意停在 0/4 翻车态：夹角过锐(14°)、主次等粗(1.00×)、交汇贴边(0.84, 0.24)、4条杂线成网、泥浊叠压
export const PRESETS = {
  broken: {
    label: "复原错态",
    u: 0.84,
    v: 0.24,
    angleA: -36, // 黑主梁倾角（度，屏幕坐标系：0° 水平向右，-48° 为左下向右上）
    angleB: -50, // 红次梁倾角，与黑梁仅差 14° 尖锐粘连
    ratio: 1.0,  // 黑梁宽 / 红梁宽 = 1.00× 等粗打架
    joint: "muddy",
    clutter: "web",
  },
  poster: {
    label: "原海报构图",
    u: 0.48,
    v: 0.43,
    angleA: -49,
    angleB: 53,  // 夹角约 78°，经典强劲交叉
    ratio: 2.35,
    joint: "knockout",
    clutter: "guide",
  },
  acute: {
    label: "尖刺锐角",
    u: 0.46,
    v: 0.44,
    angleA: -42,
    angleB: -56, // 仅 14° 夹角
    ratio: 2.2,
    joint: "knockout",
    clutter: "guide",
  },
  ortho: {
    label: "死板正交",
    u: 0.5,
    v: 0.5,
    angleA: 0,
    angleB: 90,
    ratio: 1.0,
    joint: "over",
    clutter: "pure",
  },
  clutter: {
    label: "蜘蛛网过载",
    u: 0.48,
    v: 0.45,
    angleA: -46,
    angleB: 48,
    ratio: 1.2,
    joint: "muddy",
    clutter: "web",
  },
};

export function createInitialState() {
  return {
    scene: "construct",
    ...PRESETS.broken,
  };
}

export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

export function normalizeDeg(deg) {
  let a = ((deg + 90) % 180 + 180) % 180 - 90;
  if (a <= -90) a += 180;
  return a; // (-90, 90]
}

export function acuteAngleDeg(aDeg, bDeg) {
  let d = Math.abs(normalizeDeg(aDeg) - normalizeDeg(bDeg));
  if (d > 90) d = 180 - d;
  return d;
}

// 设定夹角（保持黑梁 A 不动，调整红梁 B 到给定锐角方向）
export function setThetaOnState(state, targetTheta) {
  const theta = clamp(targetTheta, 6, 90);
  // 选择离当前 angleB 更近的一侧，确保推拉丝滑不乱跳
  const cand1 = normalizeDeg(state.angleA + theta);
  const cand2 = normalizeDeg(state.angleA - theta);
  const diff = (x, y) => {
    let d = Math.abs(normalizeDeg(x) - normalizeDeg(y));
    return Math.min(d, 180 - d);
  };
  // 倾向于把红梁往左上→右下（正角度）展开，符合 026 原海报动势
  const currentDelta = normalizeDeg(state.angleB - state.angleA);
  const pick = Math.abs(currentDelta) < 22 ? cand1 : (diff(cand1, state.angleB) <= diff(cand2, state.angleB) ? cand1 : cand2);
  return { ...state, angleB: pick };
}

// 直线方程：过 (u, v)，方向角 deg（弧度 rad），单位方向向量 (dx, dy)，法向量 (-dy, dx)
export function lineFromPointAngle(u, v, deg, aspect = 1.56) {
  // 在视觉等距空间中（x = u * aspect, y = v）以真实像素视觉角度定义直线，保证画布上量角器度数 100% 吻合！
  const rad = (deg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const px = u * aspect;
  const py = v;
  // 隐式方程 a*x + b*y + c = 0（视觉坐标 x in [0, aspect], y in [0, 1]）
  const a = -dy;
  const b = dx;
  const c = -(a * px + b * py);
  return { u, v, px, py, deg, rad, dx, dy, a, b, c };
}

// 裁剪直线到视觉矩形 [0, aspect] × [0, 1]，返回归一化端点 [{u,v}, {u,v}]
export function clipLineToRect(line, aspect) {
  const pts = [];
  const { px, py, dx, dy } = line;
  const pushIf = (t) => {
    const x = px + t * dx;
    const y = py + t * dy;
    if (x >= -1e-5 && x <= aspect + 1e-5 && y >= -1e-5 && y <= 1 + 1e-5) {
      const u = clamp(x / aspect, 0, 1);
      const v = clamp(y, 0, 1);
      if (!pts.some((p) => Math.hypot(p.u - u, p.v - v) < 1e-4)) {
        pts.push({ u, v, x, y, t });
      }
    }
  };
  if (Math.abs(dx) > 1e-6) {
    pushIf((0 - px) / dx);
    pushIf((aspect - px) / dx);
  }
  if (Math.abs(dy) > 1e-6) {
    pushIf((0 - py) / dy);
    pushIf((1 - py) / dy);
  }
  if (pts.length < 2) return null;
  pts.sort((p, q) => p.t - q.t);
  return [pts[0], pts[pts.length - 1]];
}

// Sutherland-Hodgman 半平面裁剪：保留 sign * (a*x + b*y + c) >= 0 的多边形部分
function clipPolygonHalfPlane(poly, a, b, c, sign) {
  if (!poly.length) return [];
  const out = [];
  const val = (p) => sign * (a * p.x + b * p.y + c);
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const prev = poly[(i + poly.length - 1) % poly.length];
    const vc = val(cur);
    const vp = val(prev);
    const insideCur = vc >= -1e-7;
    const insidePrev = vp >= -1e-7;
    if (insideCur !== insidePrev) {
      const t = vp / (vp - vc);
      out.push({ x: prev.x + t * (cur.x - prev.x), y: prev.y + t * (cur.y - prev.y) });
    }
    if (insideCur) out.push(cur);
  }
  return out;
}

function polygonAreaAndCentroid(poly) {
  if (poly.length < 3) return { area: 0, cx: 0, cy: 0 };
  let a2 = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const cross = p.x * q.y - q.x * p.y;
    a2 += cross;
    cx += (p.x + q.x) * cross;
    cy += (p.y + q.y) * cross;
  }
  const area = Math.abs(a2) / 2;
  if (area < 1e-7) return { area: 0, cx: poly[0].x, cy: poly[0].y };
  return { area, cx: cx / (3 * a2), cy: cy / (3 * a2) };
}

// 生成杂线或辅线（坐标与角度固定相对布局，保证每帧稳定可复现）
export function buildAuxLines(state, aspect) {
  if (state.clutter === "pure") return [];
  if (state.clutter === "guide") {
    // 026 原海报特有的 2 条极细构造辅助线（低视觉权，不抢主交汇）
    return [
      { kind: "guide", color: "ink", widthFrac: 0.0028, line: lineFromPointAngle(clamp(state.u - 0.14, 0.08, 0.92), clamp(state.v - 0.06, 0.08, 0.92), state.angleB + 8, aspect) },
      { kind: "guide", color: "red", widthFrac: 0.0028, line: lineFromPointAngle(clamp(state.u + 0.16, 0.08, 0.92), clamp(state.v + 0.10, 0.08, 0.92), state.angleA - 5, aspect) },
    ];
  }
  // web：4 条等粗干扰杂线，形成混乱的蜘蛛网
  const baseThick = 0.036;
  return [
    { kind: "clutter", color: "ink", widthFrac: baseThick, line: lineFromPointAngle(0.26, 0.34, 24, aspect) },
    { kind: "clutter", color: "red", widthFrac: baseThick * 0.92, line: lineFromPointAngle(0.62, 0.68, -18, aspect) },
    { kind: "clutter", color: "teal", widthFrac: baseThick * 0.88, line: lineFromPointAngle(0.38, 0.72, -74, aspect) },
    { kind: "clutter", color: "ink", widthFrac: baseThick * 0.85, line: lineFromPointAngle(0.68, 0.30, 76, aspect) },
  ];
}

function intersectTwoLines(l1, l2, aspect) {
  const det = l1.a * l2.b - l2.a * l1.b;
  if (Math.abs(det) < 1e-4) return null;
  const x = (l1.b * l2.c - l2.b * l1.c) / det;
  const y = (l2.a * l1.c - l1.a * l2.c) / det;
  if (x >= 0.02 * aspect && x <= 0.98 * aspect && y >= 0.02 && y <= 0.98) {
    return { x, y, u: x / aspect, v: y };
  }
  return null;
}

// 完整分析单真源：画布、读数、四圆章与诊断全部只调这个函数
export function analyzeComposition(state, aspect = 1.56) {
  const u = clamp(state.u, 0.08, 0.92);
  const v = clamp(state.v, 0.08, 0.92);
  const ratio = clamp(state.ratio, 1.0, 4.2);

  // 黑主梁和红次梁视觉宽度（相对画布高度的比例）
  // 基准：主梁宽 0.082，次梁宽 = 主梁宽 / ratio
  const widthA = 0.082;
  const widthB = widthA / ratio;

  const lineA = lineFromPointAngle(u, v, state.angleA, aspect);
  const lineB = lineFromPointAngle(u, v, state.angleB, aspect);
  const segA = clipLineToRect(lineA, aspect);
  const segB = clipLineToRect(lineB, aspect);
  const theta = acuteAngleDeg(state.angleA, state.angleB);

  // 计算 4 块真实负空间多边形（视觉坐标系 [0, aspect] × [0, 1]，总面积 = aspect）
  const framePoly = [
    { x: 0, y: 0 },
    { x: aspect, y: 0 },
    { x: aspect, y: 1 },
    { x: 0, y: 1 },
  ];
  const signs = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  const totalArea = aspect;
  const quadrants = signs.map(([sA, sB], idx) => {
    const p1 = clipPolygonHalfPlane(framePoly, lineA.a, lineA.b, lineA.c, sA);
    const p2 = clipPolygonHalfPlane(p1, lineB.a, lineB.b, lineB.c, sB);
    const { area, cx, cy } = polygonAreaAndCentroid(p2);
    return {
      id: idx,
      poly: p2,
      areaFrac: area / totalArea,
      cu: cx / aspect,
      cv: cy,
    };
  });

  const activeQuads = quadrants.filter((q) => q.areaFrac > 0.005);
  const sortedQuads = [...quadrants].sort((a, b) => b.areaFrac - a.areaFrac);
  const maxQuad = sortedQuads[0]?.areaFrac || 0;
  const minQuad = activeQuads.length >= 4 ? Math.min(...activeQuads.map((q) => q.areaFrac)) : 0;
  const quadRatio = minQuad > 0.005 ? maxQuad / minQuad : 99;
  const largestQuad = sortedQuads[0];

  // 计算所有重线条（含杂线）的真实画内交点
  const auxLines = buildAuxLines(state, aspect);
  const heavyLines = [
    { id: "A", line: lineA },
    { id: "B", line: lineB },
    ...auxLines.filter((x) => x.kind === "clutter").map((x, i) => ({ id: `C${i}`, line: x.line })),
  ];
  const heavyPoints = [];
  for (let i = 0; i < heavyLines.length; i++) {
    for (let j = i + 1; j < heavyLines.length; j++) {
      const pt = intersectTwoLines(heavyLines[i].line, heavyLines[j].line, aspect);
      if (pt) {
        heavyPoints.push({
          ...pt,
          isMain: i === 0 && j === 1,
        });
      }
    }
  }

  // 估算墨色覆盖面积（按视觉坐标系解析估算：两梁带面积 - 菱形交区 + 两配重圆 + 杂线）
  const lenA = segA ? Math.hypot(segA[1].x - segA[0].x, segA[1].y - segA[0].y) : 1;
  const lenB = segB ? Math.hypot(segB[1].x - segB[0].x, segB[1].y - segB[0].y) : 1;
  const sinT = Math.max(Math.sin((theta * Math.PI) / 180), 0.14);
  const overlapArea = Math.min(lenA * widthA, lenB * widthB, (widthA * widthB) / sinT);
  const beamInk = lenA * widthA + lenB * widthB - (state.joint === "knockout" ? 2 * overlapArea : overlapArea);
  // 建构海报里的松青圆与朱红圆（建筑和封面模式对应轻辅色块）
  const circlesInk = state.scene === "construct" ? Math.PI * (0.145 ** 2 + 0.165 ** 2) * 0.72 : Math.PI * (0.11 ** 2) * 0.65;
  let clutterInk = 0;
  for (const ax of auxLines) {
    if (ax.kind === "clutter") {
      const s = clipLineToRect(ax.line, aspect);
      if (s) clutterInk += Math.hypot(s[1].x - s[0].x, s[1].y - s[0].y) * ax.widthFrac * 0.85;
    }
  }
  const rawInkFrac = clamp((beamInk + circlesInk + clutterInk) / totalArea, 0.08, 0.82);
  const whitespacePct = Math.round((1 - rawInkFrac) * 100);

  // 判断距离中心与边缘
  const distEdge = Math.min(u, 1 - u, v, 1 - v);
  const distCenter = Math.hypot((u - 0.5) * aspect, v - 0.5);
  const nearEdge = distEdge < 0.16;
  const deadCenterEven = distCenter < 0.065 && quadRatio < 1.28;
  // 正交且接近水平/垂直贴框
  const nearAxisA = Math.min(Math.abs(normalizeDeg(state.angleA)), Math.abs(Math.abs(normalizeDeg(state.angleA)) - 90)) < 7;
  const nearAxisB = Math.min(Math.abs(normalizeDeg(state.angleB)), Math.abs(Math.abs(normalizeDeg(state.angleB)) - 90)) < 7;
  const staticOrtho = theta >= 84 && nearAxisA && nearAxisB;
  const tooAcute = theta < 24;
  const tooOrthoAngle = theta > 84;
  const equalWidth = ratio < 1.45;
  const overThin = ratio > 4.0;
  const cluttered = state.clutter === "web";
  const muddyJoint = state.joint === "muddy";
  const chokedSpace = whitespacePct < 48 || minQuad < 0.06;

  // 原海报四枚核心要点验收灯（严格单源）
  const checks = {
    intersection: !nearEdge && !deadCenterEven && !muddyJoint,
    structure: !cluttered && minQuad >= 0.065,
    contrast: !equalWidth && !overThin,
    tension: !tooAcute && !tooOrthoAngle && !staticOrtho && whitespacePct >= 48,
  };
  const score = Object.values(checks).filter(Boolean).length;

  // 逐一状态短签（给 4 枚原海报圆章显示）
  const badges = {
    intersection: nearEdge
      ? "贴边外坠"
      : muddyJoint
        ? "泥浊叠压"
        : deadCenterEven
          ? "正中均分"
          : "焦点明确",
    structure: cluttered
      ? `${heavyPoints.length} 处杂交`
      : minQuad < 0.065
        ? "分块挤死"
        : "骨架利落",
    contrast: equalWidth
      ? `${ratio.toFixed(1)}× 等粗`
      : overThin
        ? "次梁过细"
        : `${ratio.toFixed(1)}× 主次明`,
    tension: tooAcute
      ? `${Math.round(theta)}° 过锐`
      : staticOrtho || tooOrthoAngle
        ? `${Math.round(theta)}° 静滞`
        : whitespacePct < 48
          ? `留白 ${whitespacePct}%`
          : `${Math.round(theta)}° 动势`,
  };

  // 生成唯一、精准且白话的实时诊断
  let diag;
  if (tooAcute) {
    diag = {
      level: "error",
      tag: `错态 · 夹角 ${Math.round(theta)}° 过锐`,
      headline: `两道斜梁夹成 ${Math.round(theta)}° 尖刺，几乎粘成一条线`,
      reason: `经验舒适交叉角在 28°–82°。此刻夹角只有 ${Math.round(theta)}°，双梁像没张开的剪刀，交汇口拖出一道刺眼的细长白缝，视线顺着平行方向滑走，立不起碰撞张力。`,
      action: "向右推拉画布下方的「交角绞剪尺」（或直接拖动红梁两端），把两梁夹角掰开到 35°–80°。",
    };
  } else if (cluttered) {
    diag = {
      level: "error",
      tag: `错态 · ${heavyPoints.length} 处等粗交点`,
      headline: `画面被杂线割出 ${heavyPoints.length} 个交点，视线在铁丝网里迷路`,
      reason: `交叉线构图最怕「为了交叉而加线」。现在 4 条等粗杂线与主次梁混成一团，大脑同时接到 ${heavyPoints.length} 处同等权重的焦点信号，反而谁也留不住人眼。`,
      action: "在折线控台的「骨架层级」切到「极细辅线」或「纯净双梁」，把干扰线退成极细构造线。",
    };
  } else if (equalWidth) {
    diag = {
      level: "error",
      tag: `错态 · 宽比 ${ratio.toFixed(2)}× 平权`,
      headline: `黑梁与红梁 ${ratio.toFixed(2)}× 等粗互抢，看不出主次层级`,
      reason: `原海报特别提醒「比例：主次线条的粗细和长度对比，确立视觉层级」。两条粗细相近的梁相撞时，两股向量势均力敌，焦点在黑红之间来回拉扯。`,
      action: "把折线控台的「主次宽比」拉到 1.5×–3.2×，让黑主梁撑骨架、红次梁做穿刺。",
    };
  } else if (nearEdge) {
    diag = {
      level: "error",
      tag: "错态 · 交汇贴边",
      headline: `交汇点贴近画框边缘（距边仅 ${Math.round(distEdge * 100)}%），重心向外坠落`,
      reason: `交汇处是全画的能量核心，把它挤到边角会让半截主梁被画框截碎，一侧负空间压成窄缝（最小区仅 ${Math.round(minQuad * 100)}%），另一侧大片空荡。`,
      action: "直接按住画布中央的交汇点，往画面中腹的偏心区（距四边 ≥ 18%）拖回。",
    };
  } else if (muddyJoint) {
    diag = {
      level: "error",
      tag: "错态 · 交点泥浊",
      headline: "两道重色粗梁实压混成暗块，交汇中心发闷",
      reason: "浓黑与高饱和朱红直接叠印混色，会在全画最抢眼的交汇点糊出一块暗褐污斑，既分不清前后层次，又堵住了中枢的透气口。",
      action: "把「交汇处理」切到「反白镂空」（026 原海报同款菱形光窗）或「主压次遮挡」。",
    };
  } else if (staticOrtho || tooOrthoAngle) {
    diag = {
      level: "warn",
      tag: `偏静 · ${Math.round(theta)}° 正交`,
      headline: `夹角 ${Math.round(theta)}° 趋近垂直正交，动势张力正在熄火`,
      reason: "横竖 90° 贴合重力与地平线，带来稳定秩序，更接近「030 十字构图」的静谧端庄；想要交叉线构图标志性的冲撞能量，需要偏离正交的斜角张力。",
      action: "把「交角绞剪尺」稍向左收回，或拖动梁端微旋，让夹角落在 35°–80° 的斜交动势带。",
    };
  } else if (deadCenterEven) {
    diag = {
      level: "warn",
      tag: `偏死 · 四区 ${quadRatio.toFixed(2)}× 均分`,
      headline: "交汇落死正中且四块留白几乎一样大，像贴了四格瓷砖",
      reason: `四块负空间最大与最小之比仅 ${quadRatio.toFixed(2)}×（经验建议 ≥ 1.35×）。画面一旦完全四等分，眼睛进来便停在中心不动，不再沿斜线游走。`,
      action: "直接把交汇点向偏心方向轻挪 6%–15%，立刻拉出大小错落的呼吸留白。",
    };
  } else if (chokedSpace) {
    diag = {
      level: "warn",
      tag: `偏闷 · 留白 ${whitespacePct}%`,
      headline: "负空间被切得过碎或占比偏低，版面透气不足",
      reason: `当前净留白 ${whitespacePct}%、最小分块 ${Math.round(minQuad * 100)}%。调整交汇落点或拉大主次梁粗细差，能让四块负空间既有主次又不挤成窄角。`,
      action: "把交汇点挪离尖角区域，或适当加大「主次宽比」释放负空间。",
    };
  } else {
    const posture =
      u < 0.45 ? "左偏心构成" : u > 0.56 ? "右偏心构成" : v < 0.45 ? "上偏心构成" : "黄金动势偏心";
    const jointDesc = state.joint === "knockout" ? "反白镂空菱窗让中心迸出光感" : "黑压红 T 型遮挡建立了明确前后纵深";
    diag = {
      level: "ok",
      tag: `4 / 4 成立 · ${posture}`,
      headline: `${Math.round(theta)}° 斜交 × ${ratio.toFixed(1)}× 宽比，骨架、焦距与负空间全部咬合`,
      reason: `${jointDesc}；两梁把暖纸切出 ${Math.round(maxQuad * 100)}% 至 ${Math.round(minQuad * 100)}% 大小错落的四块负空间（净留白约 ${whitespacePct}%），视线顺黑梁切入、在交汇处停驻、再沿红梁延伸。`,
      action: "可以继续拖交点试不同偏心解，或切到「建筑钢构 / 书展封面」看这套骨架怎样托起真实题材。",
    };
  }

  return {
    u,
    v,
    ratio,
    theta,
    widthA,
    widthB,
    lineA,
    lineB,
    segA,
    segB,
    auxLines,
    quadrants,
    largestQuad,
    maxQuad,
    minQuad,
    quadRatio,
    heavyPoints,
    whitespacePct,
    checks,
    score,
    badges,
    diag,
    aspect,
  };
}

// 02 节：波根多夫（Poggendorff, 1860）交叉错觉纯数学模型
// 给定画布宽 W、高 H、遮挡黑梁宽 barW、斜线倾角 angleDeg（相对水平，22°–68°）
export function computePoggendorff({ barW = 92, angleDeg = 38, userOffsetPx = -24, W = 520, H = 300 }) {
  const cx = W * 0.5;
  const cy = H * 0.5;
  const xL = cx - barW * 0.5;
  const xR = cx + barW * 0.5;
  const rad = (angleDeg * Math.PI) / 180;
  // 斜线从左下往右上穿（y 向下增大，所以 dy/dx = -tan(rad)）
  const slope = -Math.tan(rad);
  // 左侧入口固定在 (xL, yL)
  const yL = cy + (barW * 0.5) * Math.tan(rad);
  // 真实几何出口在 (xR, yTrue)
  const yTrue = yL + slope * barW;
  // 用户调节后的右侧红线起点 (xR, yUser)
  const yUser = clamp(yTrue + userOffsetPx, 28, H - 28);
  const deltaPx = yUser - yTrue; // 负值表示用户接得偏高（经典波根多夫错觉方向！大脑把锐角看大，故习惯把右端往上移）
  const segLen = 135;
  const dx = Math.cos(rad) * segLen;
  const dy = -Math.sin(rad) * segLen;
  return {
    cx,
    cy,
    xL,
    xR,
    yL,
    yTrue,
    yUser,
    deltaPx,
    dx,
    dy,
    barW,
    angleDeg,
    W,
    H,
    acuteDeg: 90 - angleDeg, // 与竖梁形成的锐角
  };
}

// 07 节：实战盲测小练习（两道严格单变量盲测题，选项标签纯中性 A/B/C/D）
export const QUIZ_ITEMS = [
  {
    id: "q1",
    title: "第一题 · 建筑展览海报（单变量：交角与主次粗细）",
    prompt: "下面四版海报的交汇位置、纸底与文字块完全一致，只改变了交叉线的角度、宽比与线数。哪一版最能用交叉线立住焦点、主次与动势？",
    correct: 1,
    options: [
      {
        key: "A",
        label: "方案 A",
        meta: "90° · 1.0×",
        cfg: { u: 0.44, v: 0.43, angleA: 0, angleB: 90, ratio: 1.0, joint: "over", clutter: "pure" },
        why: "两道粗梁 1.0× 等粗且以 90° 横竖正交，像规整的十字路牌，画面稳重有余而动态张力偏弱，也缺少主次层级。",
      },
      {
        key: "B",
        label: "方案 B",
        meta: "68° · 2.4×",
        cfg: { u: 0.44, v: 0.43, angleA: -48, angleB: 64, ratio: 2.4, joint: "knockout", clutter: "guide" },
        why: "答对了！68° 爽脆斜交激发动态张力，2.4× 粗细级差一眼分出主次，交汇处反白镂空既锁住视觉中心，又给周围留下从容负空间。",
      },
      {
        key: "C",
        label: "方案 C",
        meta: "12° · 2.4×",
        cfg: { u: 0.44, v: 0.43, angleA: -42, angleB: -54, ratio: 2.4, joint: "knockout", clutter: "pure" },
        why: "两梁夹角仅 12°，几乎贴身并行，中间挤出尖窄白缝，既刺眼又缺少方向碰撞带来的视觉刹车感。",
      },
      {
        key: "D",
        label: "方案 D",
        meta: "多线等粗",
        cfg: { u: 0.44, v: 0.43, angleA: -46, angleB: 48, ratio: 1.15, joint: "muddy", clutter: "web" },
        why: "叠加过多等粗斜线后，画面冒出近十个权重相等的交点，视线像掉进蜘蛛网里四处乱撞，主体反而被淹没。",
      },
    ],
  },
  {
    id: "q2",
    title: "第二题 · 艺术季主视觉（单变量：交汇落点与负空间）",
    prompt: "四版共用同一组 66° 夹角、2.3× 主次宽比的双梁，唯一不同是两梁的交汇位置。哪一版切出的四块负空间最有呼吸感与版面弹性？",
    correct: 2,
    options: [
      {
        key: "A",
        label: "方案 A",
        meta: "贴右下角",
        cfg: { u: 0.87, v: 0.82, angleA: -48, angleB: 66, ratio: 2.3, joint: "knockout", clutter: "pure" },
        why: "交汇点被挤到右下角（距边仅 13%），半截梁体被画框切碎，右下象限几乎窒息，左上大片空荡失去咬合。",
      },
      {
        key: "B",
        label: "方案 B",
        meta: "正中对称",
        cfg: { u: 0.5, v: 0.5, angleA: -45, angleB: 45, ratio: 2.3, joint: "knockout", clutter: "pure" },
        why: "交点落死正中 (50%, 50%) 且 45° 对称斜切，四块负空间面积几乎相等，画面一眼定格，缺少大小对比的节奏。",
      },
      {
        key: "C",
        label: "方案 C",
        meta: "偏心黄金区",
        cfg: { u: 0.43, v: 0.41, angleA: -49, angleB: 65, ratio: 2.3, joint: "knockout", clutter: "guide" },
        why: "答对了！交汇落于中腹偏心区，自然切出面积错落的四块负空间，右侧与下方从容承接标题与配重，既有焦点又留足呼吸。",
      },
      {
        key: "D",
        label: "方案 D",
        meta: "交点出框",
        cfg: { u: 1.16, v: 0.14, angleA: -48, angleB: 66, ratio: 2.3, joint: "knockout", clutter: "pure", outside: true },
        why: "两梁交点滑到画框之外，画内只剩两段各自贴边擦过的孤立斜带，没有相遇就失去了交叉构图的核心锚点。",
      },
    ],
  },
];

// 311 平面调度 · 单一真相源（画布坐标、阿恩海姆杠杆计算、对齐与疏密判定、预设与小练习共用）
// 所有坐标均采用归一化平面坐标系：u ∈ [0, 1]（左到右），v ∈ [0, 1]（上到下），画布固定逻辑比例 16:10。

export const LOGICAL_W = 800;
export const LOGICAL_H = 500;
export const ASPECT = LOGICAL_W / LOGICAL_H; // 1.6

export const PALETTE = {
  paper: "#E5DDD2",
  paperLight: "#F3EEE5",
  paperStone: "#DAD0C2",
  pine: "#1E3B2F",
  pineDark: "#162C22",
  ink: "#0F1F18",
  inkMuted: "#3E4F47",
  terracotta: "#D95C3D",
  terracottaText: "#A83B20",
  terracottaBright: "#F07A5B",
  line: "rgba(15, 31, 24, 0.28)",
  lineStrong: "rgba(15, 31, 24, 0.72)",
  ok: "#1E5B43",
  okSoft: "rgba(30, 91, 67, 0.14)",
  warn: "#B83B1E",
  warnSoft: "rgba(184, 59, 30, 0.12)",
};

// 固定深松绿主场域（对应 311 原海报中央大方块）
export const FIELD = {
  x: 0.30,
  y: 0.16,
  w: 0.40,
  h: 0.68,
  weight: 2.2, // 稳重底面权重（靠近画幅中心，为其余构件提供参照平面）
};

// 四个可调度构件的几何尺寸与阿恩海姆视觉权重（经验值：面积 × 色相/明度吸引系数）
export const PIECE_DEFS = {
  accentCircle: {
    id: "accentCircle",
    label: "朱红大圆",
    cinemaLabel: "红衣主角",
    kind: "circle",
    r: 0.135, // 占画布高度比例（换算宽度需除以 ASPECT）
    weight: 3.1,
    color: PALETTE.terracotta,
    role: "热色重焦点",
  },
  cutoutCircle: {
    id: "cutoutCircle",
    label: "米白穿孔圆",
    cinemaLabel: "圆形壁窗",
    kind: "circle",
    r: 0.095,
    weight: 1.15,
    color: PALETTE.paper,
    role: "负形图底穿孔",
  },
  warmBar: {
    id: "warmBar",
    label: "朱红横条",
    cinemaLabel: "暖红门楣",
    kind: "rect",
    w: 0.255,
    h: 0.056,
    weight: 1.95,
    color: PALETTE.terracotta,
    role: "远端配重横轴",
  },
  darkBar: {
    id: "darkBar",
    label: "深绿竖条",
    cinemaLabel: "立柱配角",
    kind: "rect",
    w: 0.052,
    h: 0.31,
    weight: 1.65,
    color: PALETTE.pine,
    role: "竖向节奏支点",
  },
};

export const PIECE_ORDER = ["accentCircle", "cutoutCircle", "warmBar", "darkBar"];

// 经验门槛常量（正文、读数与判定统一读取，不写死第二份）
export const RULES = {
  maxAngleDeg: 2.0,          // 立面归正允许误差（°）
  snapAngleDeg: 2.2,         // 靠近 0° 轻柔磁吸区间
  alignTol: 0.015,           // 共享边/中轴对齐容差（归一化单位）
  minAlignPairs: 2,          // 至少形成 2 组对齐秩序
  maxBalanceX: 0.055,        // 水平重心偏移经验平衡带 ±5.5%
  maxBalanceY: 0.085,        // 垂直重心偏移经验平衡带 ±8.5%（基准视觉中心 v=0.51）
  visualCenterY: 0.51,
  minCutoutInside: 0.72,     // 穿孔圆落在深绿场域内的最低面积覆盖
  minWarmGap: 0.026,         // 朱红横条与朱红大圆间最小净距（防同色粘连）
  minPieceGap: 0.012,        // 任意两个独立色块间的防撞净距（穿孔圆除外，它嵌入深绿场域）
  minSpanX: 0.42,            // 平面横向展开最低跨度（防缩成一团）
  minRhythmCV: 0.20,         // 间距变异系数下限（防机械等距平铺）
  edgeMargin: 0.035,         // 离画框外沿的最小安全呼吸距离
};

// 预设状态：开场错态（斜拍挤堆 0/5）、第二错态（机械均分）、原海报参考轮廓（通关解锁叠看）
export const PRESETS = {
  skewed: {
    cameraAngle: 26,
    pieces: {
      accentCircle: { u: 0.742, v: 0.698 },
      cutoutCircle: { u: 0.858, v: 0.232 },
      warmBar: { u: 0.663, v: 0.573 },
      darkBar: { u: 0.833, v: 0.612 },
    },
  },
  uniform: {
    cameraAngle: 0,
    pieces: {
      warmBar: { u: 0.175, v: 0.50 },
      cutoutCircle: { u: 0.395, v: 0.50 },
      accentCircle: { u: 0.615, v: 0.50 },
      darkBar: { u: 0.835, v: 0.50 },
    },
  },
  reference: {
    cameraAngle: 0,
    pieces: {
      accentCircle: { u: 0.61, v: 0.65 },
      cutoutCircle: { u: 0.53, v: 0.32 },
      warmBar: { u: 0.275, v: 0.248 },
      darkBar: { u: 0.785, v: 0.50 },
    },
  },
};

export function clonePreset(name) {
  const src = PRESETS[name] || PRESETS.skewed;
  const pieces = {};
  for (const id of PIECE_ORDER) pieces[id] = { ...src.pieces[id] };
  return { cameraAngle: src.cameraAngle, pieces };
}

// 获取构件的归一化包围盒（考虑 16:10 宽高比，圆在水平方向半径为 r / ASPECT）
export function pieceBounds(id, pos) {
  const def = PIECE_DEFS[id];
  if (def.kind === "circle") {
    const rx = def.r / ASPECT;
    const ry = def.r;
    return {
      left: pos.u - rx,
      right: pos.u + rx,
      top: pos.v - ry,
      bottom: pos.v + ry,
      cx: pos.u,
      cy: pos.v,
      rx,
      ry,
      w: rx * 2,
      h: ry * 2,
    };
  }
  return {
    left: pos.u - def.w / 2,
    right: pos.u + def.w / 2,
    top: pos.v - def.h / 2,
    bottom: pos.v + def.h / 2,
    cx: pos.u,
    cy: pos.v,
    w: def.w,
    h: def.h,
  };
}

// 限制构件不拖出画布可见区域
export function clampPiecePos(id, u, v) {
  const def = PIECE_DEFS[id];
  const halfW = def.kind === "circle" ? def.r / ASPECT : def.w / 2;
  const halfH = def.kind === "circle" ? def.r : def.h / 2;
  const pad = 0.015;
  return {
    u: Math.max(halfW + pad, Math.min(1 - halfW - pad, u)),
    v: Math.max(halfH + pad, Math.min(1 - halfH - pad, v)),
  };
}

// 估算圆落在矩形内的面积占比（5×5 网格采样，快速且确定性 100%）
function circleInsideRectRatio(cx, cy, r, rect) {
  let inside = 0;
  let total = 0;
  const steps = 7;
  const rx = r / ASPECT;
  for (let i = -steps; i <= steps; i++) {
    for (let j = -steps; j <= steps; j++) {
      const dx = i / steps;
      const dy = j / steps;
      if (dx * dx + dy * dy <= 1) {
        total++;
        const px = cx + dx * rx;
        const py = cy + dy * r;
        if (px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h) {
          inside++;
        }
      }
    }
  }
  return total ? inside / total : 0;
}

// 计算圆与矩形之间的欧式净距（像素比例高度单位，负值表示穿透重叠）
function circleRectGap(cPos, r, rBounds) {
  const rx = r / ASPECT;
  const nearX = Math.max(rBounds.left, Math.min(cPos.u, rBounds.right));
  const nearY = Math.max(rBounds.top, Math.min(cPos.v, rBounds.bottom));
  const dx = (cPos.u - nearX) * ASPECT;
  const dy = cPos.v - nearY;
  const dist = Math.hypot(dx, dy);
  if (cPos.u >= rBounds.left && cPos.u <= rBounds.right && cPos.v >= rBounds.top && cPos.v <= rBounds.bottom) {
    return -r;
  }
  return dist - r;
}

// 计算两圆之间的净距（高度单位）
function circleCircleGap(p1, r1, p2, r2) {
  const d = Math.hypot((p1.u - p2.u) * ASPECT, p1.v - p2.v);
  return d - (r1 + r2);
}

// 计算两矩形之间的净距（高度单位）
function rectRectGap(b1, b2) {
  const dx = Math.max(0, b1.left - b2.right, b2.left - b1.right) * ASPECT;
  const dy = Math.max(0, b1.top - b2.bottom, b2.top - b1.bottom);
  if (dx === 0 && dy === 0) {
    const ox = Math.min(b1.right, b2.right) - Math.max(b1.left, b2.left);
    const oy = Math.min(b1.bottom, b2.bottom) - Math.max(b1.top, b2.top);
    return -Math.min(ox * ASPECT, oy);
  }
  return Math.hypot(dx, dy);
}

// 统一计算两个构件之间的视觉净距
function gapBetween(id1, pos1, b1, id2, pos2, b2) {
  const d1 = PIECE_DEFS[id1];
  const d2 = PIECE_DEFS[id2];
  if (d1.kind === "circle" && d2.kind === "circle") return circleCircleGap(pos1, d1.r, pos2, d2.r);
  if (d1.kind === "circle" && d2.kind === "rect") return circleRectGap(pos1, d1.r, b2);
  if (d1.kind === "rect" && d2.kind === "circle") return circleRectGap(pos2, d2.r, b1);
  return rectRectGap(b1, b2);
}

// 收集共享边与中轴对齐线
function computeAlignments(boundsMap) {
  const fieldAnchorsX = [
    { val: FIELD.x, tag: "主块左缘" },
    { val: FIELD.x + FIELD.w / 2, tag: "主块中轴" },
    { val: FIELD.x + FIELD.w, tag: "主块右缘" },
  ];
  const fieldAnchorsY = [
    { val: FIELD.y, tag: "主块顶缘" },
    { val: FIELD.y + FIELD.h / 2, tag: "主块中线" },
    { val: FIELD.y + FIELD.h, tag: "主块底缘" },
  ];

  const lines = [];
  const seenKey = new Set();
  const addLine = (axis, val, a, b, label) => {
    const bucket = `${axis}:${Math.round(val * 40)}`;
    if (seenKey.has(bucket)) return;
    seenKey.add(bucket);
    lines.push({ axis, val, a, b, label });
  };

  // 1) 构件与深绿主场域边线/中轴对齐
  for (const id of PIECE_ORDER) {
    const b = boundsMap[id];
    const xs = [b.left, b.cx, b.right];
    const ys = [b.top, b.cy, b.bottom];
    for (const ax of fieldAnchorsX) {
      for (const x of xs) {
        if (Math.abs(x - ax.val) <= RULES.alignTol) {
          addLine("x", ax.val, id, "field", `${PIECE_DEFS[id].label}对齐${ax.tag}`);
          break;
        }
      }
    }
    for (const ay of fieldAnchorsY) {
      for (const y of ys) {
        if (Math.abs(y - ay.val) <= RULES.alignTol) {
          addLine("y", ay.val, id, "field", `${PIECE_DEFS[id].label}对齐${ay.tag}`);
          break;
        }
      }
    }
  }

  // 2) 构件两两之间的共线对齐（边线或中心轴）
  for (let i = 0; i < PIECE_ORDER.length; i++) {
    for (let j = i + 1; j < PIECE_ORDER.length; j++) {
      const id1 = PIECE_ORDER[i];
      const id2 = PIECE_ORDER[j];
      const b1 = boundsMap[id1];
      const b2 = boundsMap[id2];
      const xs1 = [b1.left, b1.cx, b1.right];
      const xs2 = [b2.left, b2.cx, b2.right];
      const ys1 = [b1.top, b1.cy, b1.bottom];
      const ys2 = [b2.top, b2.cy, b2.bottom];
      outerX: for (const x1 of xs1) {
        for (const x2 of xs2) {
          if (Math.abs(x1 - x2) <= RULES.alignTol) {
            addLine("x", (x1 + x2) / 2, id1, id2, `${PIECE_DEFS[id1].label}与${PIECE_DEFS[id2].label}竖向共线`);
            break outerX;
          }
        }
      }
      outerY: for (const y1 of ys1) {
        for (const y2 of ys2) {
          if (Math.abs(y1 - y2) <= RULES.alignTol) {
            addLine("y", (y1 + y2) / 2, id1, id2, `${PIECE_DEFS[id1].label}与${PIECE_DEFS[id2].label}横向共线`);
            break outerY;
          }
        }
      }
    }
  }

  return lines;
}

// 寻找拖动时的轻柔磁吸目标（靠近深绿场域边线/中轴或其他构件轴线）
export function findSnapPosition(id, rawU, rawV, pieces) {
  const clamped = clampPiecePos(id, rawU, rawV);
  const def = PIECE_DEFS[id];
  const halfW = def.kind === "circle" ? def.r / ASPECT : def.w / 2;
  const halfH = def.kind === "circle" ? def.r : def.h / 2;
  const snapTol = 0.014;

  const targetsX = [FIELD.x, FIELD.x + FIELD.w / 2, FIELD.x + FIELD.w];
  const targetsY = [FIELD.y, FIELD.y + FIELD.h / 2, FIELD.y + FIELD.h];
  for (const otherId of PIECE_ORDER) {
    if (otherId === id) continue;
    const ob = pieceBounds(otherId, pieces[otherId]);
    targetsX.push(ob.cx, ob.left, ob.right);
    targetsY.push(ob.cy, ob.top, ob.bottom);
  }

  let bestU = clamped.u;
  let bestDx = snapTol;
  for (const tx of targetsX) {
    for (const offset of [0, -halfW, halfW]) {
      const candidate = tx - offset;
      const d = Math.abs(clamped.u - candidate);
      if (d < bestDx) {
        bestDx = d;
        bestU = candidate;
      }
    }
  }

  let bestV = clamped.v;
  let bestDy = snapTol;
  for (const ty of targetsY) {
    for (const offset of [0, -halfH, halfH]) {
      const candidate = ty - offset;
      const d = Math.abs(clamped.v - candidate);
      if (d < bestDy) {
        bestDy = d;
        bestV = candidate;
      }
    }
  }

  return clampPiecePos(id, bestU, bestV);
}

// 主评判引擎：同一份实测结果供画布、四向圆点引注、阿恩海姆天平尺与白话诊断共用
export function evaluatePlanar(state) {
  const angle = Math.round(state.cameraAngle * 10) / 10;
  const absAngle = Math.abs(angle);
  const planeOk = absAngle <= RULES.maxAngleDeg;

  const bounds = {};
  for (const id of PIECE_ORDER) bounds[id] = pieceBounds(id, state.pieces[id]);

  // 1) 阿恩海姆杠杆视觉重心（含固定深绿主块 + 4 构件；穿孔圆移出深绿块外权重下降）
  const cutoutInside = circleInsideRectRatio(
    state.pieces.cutoutCircle.u,
    state.pieces.cutoutCircle.v,
    PIECE_DEFS.cutoutCircle.r,
    FIELD
  );
  const effectiveCutoutWeight = PIECE_DEFS.cutoutCircle.weight * (0.45 + 0.55 * cutoutInside);

  let sumW = FIELD.weight;
  let sumWX = (FIELD.x + FIELD.w / 2) * FIELD.weight;
  let sumWY = (FIELD.y + FIELD.h / 2) * FIELD.weight;

  for (const id of PIECE_ORDER) {
    const pos = state.pieces[id];
    const baseW = id === "cutoutCircle" ? effectiveCutoutWeight : PIECE_DEFS[id].weight;
    // 阿恩海姆位置权重微增：离中心越远，杠杆心理拉扯越明显
    const leverBoost = 1 + 0.35 * Math.hypot((pos.u - 0.5) * 1.2, pos.v - 0.5);
    const w = baseW * leverBoost;
    sumW += w;
    sumWX += pos.u * w;
    sumWY += pos.v * w;
  }
  const cx = sumWX / sumW;
  const cy = sumWY / sumW;
  const dx = cx - 0.5;
  const dy = cy - RULES.visualCenterY;
  const dxPct = Math.round(dx * 100);
  const dyPct = Math.round(dy * 100);
  const balanceOk = Math.abs(dx) <= RULES.maxBalanceX && Math.abs(dy) <= RULES.maxBalanceY;

  // 2) 对齐秩序（机位未归正至二维立面时，斜收投影不计为平面共线）
  const alignLines = planeOk ? computeAlignments(bounds) : [];
  const alignCount = alignLines.length;
  const alignOk = planeOk && alignCount >= RULES.minAlignPairs;

  // 3) 对比与图底清晰度
  const warmGap = gapBetween(
    "accentCircle",
    state.pieces.accentCircle,
    bounds.accentCircle,
    "warmBar",
    state.pieces.warmBar,
    bounds.warmBar
  );
  const warmDarkGap = gapBetween(
    "accentCircle",
    state.pieces.accentCircle,
    bounds.accentCircle,
    "darkBar",
    state.pieces.darkBar,
    bounds.darkBar
  );
  const barsGap = gapBetween(
    "warmBar",
    state.pieces.warmBar,
    bounds.warmBar,
    "darkBar",
    state.pieces.darkBar,
    bounds.darkBar
  );
  const circlesGap = gapBetween(
    "accentCircle",
    state.pieces.accentCircle,
    bounds.accentCircle,
    "cutoutCircle",
    state.pieces.cutoutCircle,
    bounds.cutoutCircle
  );

  const cutoutOk = cutoutInside >= RULES.minCutoutInside;
  const warmSeparated = warmGap >= RULES.minWarmGap;
  const noHardClash =
    warmSeparated &&
    warmDarkGap >= RULES.minPieceGap &&
    barsGap >= RULES.minPieceGap &&
    circlesGap >= 0.01;

  const clippedEdge = PIECE_ORDER.some((id) => {
    const b = bounds[id];
    return b.left < 0.02 || b.right > 0.98 || b.top < 0.02 || b.bottom > 0.98;
  });

  const contrastOk = cutoutOk && noHardClash && !clippedEdge;

  // 4) 疏密节奏（防止死板等距、防止挤堆、防止偏缩一角）
  const centers = PIECE_ORDER.map((id) => state.pieces[id]);
  const pairDists = [];
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) {
      pairDists.push(Math.hypot((centers[i].u - centers[j].u) * ASPECT, centers[i].v - centers[j].v));
    }
  }
  const sortedX = [...centers].sort((a, b) => a.u - b.u);
  const xGaps = [];
  for (let i = 1; i < sortedX.length; i++) xGaps.push(sortedX[i].u - sortedX[i - 1].u);
  const spanX = sortedX[sortedX.length - 1].u - sortedX[0].u;
  const yVals = centers.map((p) => p.v);
  const spanY = Math.max(...yVals) - Math.min(...yVals);

  const meanDist = pairDists.reduce((a, b) => a + b, 0) / pairDists.length;
  const stdDist = Math.sqrt(pairDists.reduce((s, d) => s + (d - meanDist) ** 2, 0) / pairDists.length);
  const cvDist = meanDist > 0 ? stdDist / meanDist : 0;

  const meanXGap = xGaps.reduce((a, b) => a + b, 0) / xGaps.length;
  const stdXGap = Math.sqrt(xGaps.reduce((s, g) => s + (g - meanXGap) ** 2, 0) / xGaps.length);
  const cvXGap = meanXGap > 0 ? stdXGap / meanXGap : 0;

  // 判定是否陷入「死板等距」：纵向几乎全在一条水平线上且横向间距过于均匀
  const tooUniform = (spanY < 0.09 && cvXGap < 0.22) || (cvDist < RULES.minRhythmCV && cvXGap < 0.18);
  const tooCramped = !noHardClash;
  const tooNarrow = spanX < RULES.minSpanX;
  const rhythmOk = !tooUniform && !tooCramped && !tooNarrow;

  // 汇总四向引注与总体诊断
  const passedCount = [planeOk, alignOk, balanceOk, contrastOk, rhythmOk].filter(Boolean).length;
  const allOk = passedCount === 5;

  // 生成四向圆点虚线短标签
  const callouts = {
    align: {
      ok: alignOk,
      value: !planeOk ? "待立面归正" : alignOk ? `${alignCount} 组共线` : `仅 ${alignCount} 组`,
      detail: !planeOk ? "先归正 0° 再锁边轴" : alignOk ? "共享边线与中轴清晰" : "至少对齐 2 组边或轴",
    },
    balance: {
      ok: balanceOk,
      value: balanceOk
        ? `居中 ${dxPct >= 0 ? "+" : ""}${dxPct}%`
        : `${dxPct > 0 ? "右倾 +" : dxPct < 0 ? "左倾 " : dyPct > 0 ? "下坠 +" : "上浮 "}${
            Math.abs(dx) > RULES.maxBalanceX ? dxPct : dyPct
          }%`,
      detail: balanceOk ? "阿恩海姆力矩平衡" : "远端轻条可配平大块",
    },
    contrast: {
      ok: contrastOk,
      value: contrastOk
        ? "图底清晰"
        : !cutoutOk
        ? "穿孔滑出"
        : !warmSeparated
        ? "暖块撞叠"
        : !noHardClash
        ? "边缘压挤"
        : "贴边截断",
      detail: contrastOk ? "实空与冷暖分离利落" : "穿孔圆入深绿、各件留缝",
    },
    rhythm: {
      ok: rhythmOk,
      value: rhythmOk
        ? "疏密有致"
        : tooCramped
        ? "挤成一团"
        : tooUniform
        ? "死板均分"
        : "展开不足",
      detail: rhythmOk ? `跨度 ${Math.round(spanX * 100)}% · 有聚有散` : "拉开主次空隙忌等距",
    },
  };

  // 按严格优先级生成唯一主诊断（解释「为什么」与「下一步怎么做」）
  let diagnosis;
  if (!planeOk) {
    diagnosis = {
      level: "error",
      tag: `错态 · 斜拍 ${angle > 0 ? "+" : ""}${angle}°`,
      headline: `机位偏斜 ${absAngle.toFixed(0)}°，透视斜线正在抢走二维秩序`,
      body: "背景深绿墙面正往远处斜收，眼睛会顺着透视线往纵深里滑，没法把元素当作一张平面构成来读。先把「镜头立面角」游标拖到 0° 垂直立面，压平空间后再调平面关系。",
    };
  } else if (!cutoutOk) {
    diagnosis = {
      level: "error",
      tag: "错态 · 穿孔失效",
      headline: `米白穿孔圆滑出深绿场域（仅 ${Math.round(cutoutInside * 100)}% 在内）`,
      body: "浅纸底上的米白圆几乎隐身，失去了深绿大块上的负形穿孔反差。把米白穿孔圆拖回深松绿主块内部，让明暗对比重新把中上方透气打开。",
    };
  } else if (!warmSeparated) {
    diagnosis = {
      level: "error",
      tag: "错态 · 同色撞叠",
      headline: "朱红横条与朱红大圆粘连撞色，焦点轮廓变糊",
      body: "两块同色暖调挤在一起会融成一块怪形，反而削弱主角大圆的辨识度。把朱红横条往左上拉开，既清出轮廓缝隙，又能借远端力臂去平衡右侧重量。",
    };
  } else if (!noHardClash) {
    diagnosis = {
      level: "error",
      tag: "错态 · 构件压挤",
      headline: "构件边缘相撞，平面失去呼吸缝隙",
      body: "元素挤撞在一起时，眼睛分不清谁是主、谁是次。把粘住的色块拉开至少一道清晰缝隙，让每个几何形有独立轮廓。",
    };
  } else if (clippedEdge) {
    diagnosis = {
      level: "error",
      tag: "错态 · 贴边窒息",
      headline: "有构件紧贴画框边缘，视线被边线卡住",
      body: "二维平面调度需要四边留出呼吸余地；把贴边的构件往画幅内收一点，免得看起来像没排下被裁断。",
    };
  } else if (!balanceOk) {
    const dirX = dx > RULES.maxBalanceX ? "右侧" : dx < -RULES.maxBalanceX ? "左侧" : "";
    const dirY = dy > RULES.maxBalanceY ? "下方" : dy < -RULES.maxBalanceY ? "上方" : "";
    const dirText = dirX || dirY;
    diagnosis = {
      level: "warn",
      tag: `失衡 · 偏${dirText.slice(0, 1)} ${Math.abs(dirX ? dxPct : dyPct)}%`,
      headline: `视觉重心坠向${dirText}，画幅天平正在倾斜`,
      body:
        dirX === "右侧"
          ? `朱红大圆与深绿主块/竖条合力把重心拉偏 +${dxPct}%（超出 ±5.5% 经验平衡带）。不必把大圆挪回正中——试着把朱红横条往左上方拉远，靠阿恩海姆杠杆用小体量配平大重量。`
          : dirX === "左侧"
          ? `左侧视觉力矩过重（偏左 ${dxPct}%，超出 ±5.5% 经验平衡带）。把右侧深绿竖条或朱红大圆适当外放，把视觉天平拉回中线。`
          : `垂直重心偏${dirY}（${dyPct >= 0 ? "+" : ""}${dyPct}%），把上方或下方的横竖条顺轴微调，让画面落稳。`,
    };
  } else if (tooUniform) {
    diagnosis = {
      level: "warn",
      tag: "错态 · 死板均分",
      headline: "四件排成机械等距，秩序退化成了墙砖感",
      body: "重心虽在中线，但每件间距和高度都太平均，眼睛一扫而过没有任何停顿与主次。把两件拉近结组、另一侧留出明显大留白，同时错开高低层次，疏密节奏才会活起来。",
    };
  } else if (tooNarrow) {
    diagnosis = {
      level: "warn",
      tag: "错态 · 缩成一团",
      headline: `构件横向只展开了 ${Math.round(spanX * 100)}%，大片平面空置`,
      body: "元素都缩在中央深绿块附近，外侧纸面成了无意义的死白。把横条与竖条分别向左右两侧推展，激活整张二维平面的张力。",
    };
  } else if (!alignOk) {
    diagnosis = {
      level: "warn",
      tag: `待齐 · 仅 ${alignCount} 组共线`,
      headline: "重心已稳，但构件边缘各自散落缺少对齐轴线",
      body: "没有共享边线或中轴的平面看起来像随手摆上去的。轻轻拖近深松绿主块的顶缘、中轴或与另一构件齐平，凑齐至少 2 组对齐线即可锁住秩序。",
    };
  } else {
    diagnosis = {
      level: "ok",
      tag: "平面秩序成立 · 5/5",
      headline: "立面归正、杠杆配平、图底分明、疏密有致",
      body: `0° 垂直平面下形成了 ${alignCount} 组清晰对齐轴，阿恩海姆重心落在中轴 ${
        dxPct >= 0 ? "+" : ""
      }${dxPct}% 经验平衡带内，暖焦点与负形穿孔各自透气。下方已解锁「叠加 311 原海报轮廓」，可对比原版大师排布。`,
    };
  }

  return {
    angle,
    planeOk,
    alignOk,
    alignCount,
    alignLines,
    balanceOk,
    cx,
    cy,
    dxPct,
    dyPct,
    contrastOk,
    cutoutInside,
    rhythmOk,
    spanX,
    cvDist,
    passedCount,
    allOk,
    callouts,
    diagnosis,
    bounds,
  };
}

// 07 节小练习四版方案（全部使用同一套元素与尺寸，仅变动平面排布，标签严格中性）
export const QUIZ_OPTIONS = [
  {
    key: "A",
    title: "方案 A",
    subtitle: "右缘对齐 · 同侧集中",
    correct: false,
    state: {
      cameraAngle: 0,
      pieces: {
        accentCircle: { u: 0.68, v: 0.68 },
        cutoutCircle: { u: 0.60, v: 0.30 },
        warmBar: { u: 0.72, v: 0.19 },
        darkBar: { u: 0.82, v: 0.50 },
      },
    },
    explain:
      "这一版对齐很工整、穿孔圆也在深绿块内，但朱红横条、朱红大圆与深绿竖条全部堆在右侧，阿恩海姆重心大幅右坠，左侧留出大片无回应的空纸，视觉天平明显倾倒。",
  },
  {
    key: "B",
    title: "方案 B",
    subtitle: "中线平铺 · 等距并列",
    correct: false,
    state: {
      cameraAngle: 0,
      pieces: {
        warmBar: { u: 0.175, v: 0.50 },
        cutoutCircle: { u: 0.395, v: 0.50 },
        accentCircle: { u: 0.615, v: 0.50 },
        darkBar: { u: 0.835, v: 0.50 },
      },
    },
    explain:
      "重心虽稳在正中，但四件严格等距并排在同一水平线上：疏密变化归零，画面变成呆板排队；且左右高低全无错落，缺乏视觉节奏与层级引导。",
  },
  {
    key: "C",
    title: "方案 C",
    subtitle: "左远右近 · 错落配平",
    correct: true,
    state: {
      cameraAngle: 0,
      pieces: {
        accentCircle: { u: 0.61, v: 0.65 },
        cutoutCircle: { u: 0.53, v: 0.32 },
        warmBar: { u: 0.275, v: 0.248 },
        darkBar: { u: 0.785, v: 0.50 },
      },
    },
    explain:
      "正确答案。朱红大圆沉稳锚定右下方，体积较小的朱红横条向左上方远端伸展，用更长力臂稳稳托平视觉天平；米白穿孔圆在深绿场域内破开呼吸口，并有多组边线对齐与聚散节奏。",
  },
  {
    key: "D",
    title: "方案 D",
    subtitle: "中区聚拢 · 重叠交错",
    correct: false,
    state: {
      cameraAngle: 0,
      pieces: {
        accentCircle: { u: 0.535, v: 0.59 },
        cutoutCircle: { u: 0.445, v: 0.345 },
        warmBar: { u: 0.472, v: 0.545 },
        darkBar: { u: 0.648, v: 0.53 },
      },
    },
    explain:
      "这一版重心同样落在中轴附近，但朱红横条直接压进朱红大圆内部造成同色粘连，四件又全部缩在中央狭窄地带（横向跨度不足），轮廓发闷且大片纸面缺乏呼吸节奏。",
  },
];

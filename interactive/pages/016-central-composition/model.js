// 016 居中构图 · 装裱师裁卡纸几何模型、真实外接框留白与双轴视觉力学
// 展品固定于画廊展墙中心 (cx, cy)，四条卡纸内沿以同一物理尺度（mm，1mm = min(W,H)/176 px）独立裁切：
//   win = { left, right, top, bottom } 表示四条卡纸内沿距展墙中心「+」的毫米距离。
// 横向与纵向采用完全相同的像素比例尺，确保「四边留白相等」在像素与读数上严格一致，换展品时真实外接框留白随之改变。

export const STAGE_MINOR_MM = 176; // 舞台短边折合 176 mm，让装裱画框占舞台高度约 75%–82%，主体醒目

// 经验值：装裱里的「下边加宽（bottom weighting）」让下留白比上留白多出约 12 mm，
// 对应主体视觉中点较窗口几何中点上提约 3%–5%（经验值）。
export const BOTTOM_WEIGHT_EXTRA_MM = 12;
export const EQUAL_MARGIN_DEFAULT_MM = 38;
export const WEIGHTED_MARGIN_BASE_MM = 30;

export const MIN_CLEARANCE_MM = 10; // 卡纸内沿距展品外接框最小保留间隙
export const MAX_EDGE_V_MM = 78; // 垂直方向距展墙中心最大裁切半径（为上下 44px 把手留足余量）
export const SNAP_MM = 3.5; // 磁吸容差（mm）

// 三件展品的真实外接框（单位 mm，相对展品固定中心「+」的左/右/上/下外扩距离）
// WebGL 三维展品与 SVG 降级展品严格按此尺寸绘制，使卡尺读数与画面像素完全一致。
export const SUBJECTS = {
  sphere: {
    id: "sphere",
    label: "朱红圆体",
    en: "DISC",
    directional: false,
    bounds: { left: 33, right: 33, top: 33, bottom: 33 },
    note: "纯圆四向等半径（直径 66 mm）：裁出四边等宽即画框中心与「+」重合，再把下边加宽约 12 mm 即落入光学舒适区。",
  },
  arch: {
    id: "arch",
    label: "正立拱门",
    en: "FRONTAL ARCH",
    directional: false,
    bounds: { left: 26, right: 26, top: 36, bottom: 36 },
    note: "拱门窄而高（52 × 72 mm）：从圆体切过来时，左右留白立刻变宽、上下变窄——按实际外接框重裁四边才会真正匀称。",
  },
  boat: {
    id: "boat",
    label: "侧向纸舟",
    en: "DIRECTIONAL",
    directional: true,
    bounds: { left: 32, right: 39, top: 33, bottom: 23 },
    note: "纸舟横长且船头朝右（左 32 / 右 39 mm）：死守左右等宽时船头前方偏局促，把右卡纸再往外裁宽一截会立刻通气。",
  },
};

export const GUIDES = {
  caliper: { id: "caliper", label: "留白卡尺", hud: "CALIPER" },
  optical: { id: "optical", label: "光学参考", hud: "OPTICAL 3–5%" },
  arnheim: { id: "arnheim", label: "力场", hud: "STRUCTURAL FIELD" },
};

// 开场默认状态：卡纸明显裁歪（画框中心相对「+」向左下偏离，主体被挤向右上），且三件边缘杂物全部在场。
// 对朱红圆体（r=33mm）：左 45 · 右 23 · 上 20 · 下 45 mm，窗口占舞台高度约 74%–82%。
export const INITIAL_WIN = { left: 78, right: 56, top: 53, bottom: 78 };
export const INITIAL_CLUTTER_MASK = [true, true, true];

// 装裱窗口内的三件角落干扰物（dx, dy 表示位于窗口内侧的角落方向，可逐件点掉清场）
export const CLUTTER_ITEMS = [
  { id: 0, corner: "tr", dx: 1, dy: -1, weight: 0.28, kind: "block", label: "右上黑角标" },
  { id: 1, corner: "br", dx: 1, dy: 1, weight: 0.22, kind: "circle", label: "右下朱红章" },
  { id: 2, corner: "bl", dx: -1, dy: 1, weight: 0.14, kind: "ring", label: "左下墨圆环" },
];

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

export function activeClutter(clutterMask) {
  const mask = Array.isArray(clutterMask) ? clutterMask : [false, false, false];
  return CLUTTER_ITEMS.filter((_, i) => Boolean(mask[i]));
}

export function subjectBounds(subjectId) {
  return (SUBJECTS[subjectId] || SUBJECTS.sphere).bounds;
}

export function edgeLimits(W, H, subjectId) {
  const b = subjectBounds(subjectId);
  const pxPerMm = Math.min(Math.max(1, W), Math.max(1, H)) / STAGE_MINOR_MM;
  const halfWMm = W / 2 / Math.max(0.01, pxPerMm);
  const maxH = clamp(Math.floor(halfWMm - 10), 74, 108);
  const maxV = MAX_EDGE_V_MM;
  return {
    leftMin: b.left + MIN_CLEARANCE_MM,
    leftMax: maxH,
    rightMin: b.right + MIN_CLEARANCE_MM,
    rightMax: maxH,
    topMin: b.top + MIN_CLEARANCE_MM,
    topMax: maxV,
    bottomMin: b.bottom + MIN_CLEARANCE_MM,
    bottomMax: maxV,
  };
}

export function clampWin(win, W, H, subjectId) {
  const lim = edgeLimits(W, H, subjectId);
  return {
    left: clamp(win.left, lim.leftMin, lim.leftMax),
    right: clamp(win.right, lim.rightMin, lim.rightMax),
    top: clamp(win.top, lim.topMin, lim.topMax),
    bottom: clamp(win.bottom, lim.bottomMin, lim.bottomMax),
  };
}

// 预设 1：四边等宽（几何居中）—— 按当前展品真实外接框计算四条内沿
export function equalPresetWin(subjectId, marginMm = EQUAL_MARGIN_DEFAULT_MM, W = 500, H = 480) {
  const b = subjectBounds(subjectId);
  return clampWin(
    {
      left: b.left + marginMm,
      right: b.right + marginMm,
      top: b.top + marginMm,
      bottom: b.bottom + marginMm,
    },
    W,
    H,
    subjectId
  );
}

// 预设 2：下边加宽（装裱里的 bottom weighting）—— 左右与上边等宽，下边加宽 12mm，上提约 3%–5%（经验值）
export function weightedPresetWin(subjectId, baseMm = WEIGHTED_MARGIN_BASE_MM, W = 500, H = 480) {
  const b = subjectBounds(subjectId);
  return clampWin(
    {
      left: b.left + baseMm,
      right: b.right + baseMm,
      top: b.top + baseMm,
      bottom: b.bottom + baseMm + BOTTOM_WEIGHT_EXTRA_MM,
    },
    W,
    H,
    subjectId
  );
}

// 计算当前展品真实外接框到四条卡纸内沿的留白（单位 mm，横纵完全同尺度）
export function realMargins(win, subjectId) {
  const b = subjectBounds(subjectId);
  const left = Math.max(0, win.left - b.left);
  const right = Math.max(0, win.right - b.right);
  const top = Math.max(0, win.top - b.top);
  const bottom = Math.max(0, win.bottom - b.bottom);
  const winW = win.left + win.right;
  const winH = win.top + win.bottom;
  // 主体视觉中点（外接框中心）落在卡纸窗口内的归一化坐标 (u, v)
  const subCx = (b.right - b.left) / 2;
  const subCy = (b.bottom - b.top) / 2;
  const u = clamp((win.left + subCx) / Math.max(1, winW), 0.08, 0.92);
  const v = clamp((win.top + subCy) / Math.max(1, winH), 0.08, 0.92);
  // 画框几何中心相对「+」（展墙中心）的偏移（单位 mm）：
  // frameOffsetX > 0 表示主体落在画框几何中点右侧（横轴偏右）；
  // frameOffsetY > 0 表示主体落在画框几何中点上方（纵轴偏高/光学上提）。
  const frameOffsetX = (win.left - win.right) / 2;
  const frameOffsetY = (win.bottom - win.top) / 2;
  const frameOffsetDist = Math.hypot(frameOffsetX, frameOffsetY);
  // 光学上提幅度（% 窗口高）：正值表示主体视觉中点高于窗口几何中点
  const opticalLiftPct = (0.5 - v) * 100;
  return {
    left,
    right,
    top,
    bottom,
    leftR: Math.round(left),
    rightR: Math.round(right),
    topR: Math.round(top),
    bottomR: Math.round(bottom),
    winW,
    winH,
    u,
    v,
    frameOffsetX,
    frameOffsetY,
    frameOffsetDist,
    opticalLiftPct,
  };
}

// 把四边留白与展品固定坐标映射到舞台像素（WebGL 3D、SVG 降级与覆盖层共用）
export function layoutGeometry(W, H, win, subjectId) {
  const pxPerMm = Math.min(Math.max(1, W), Math.max(1, H)) / STAGE_MINOR_MM;
  const cx = W * 0.5;
  const cy = H * 0.5;
  const b = subjectBounds(subjectId);

  const winLeft = cx - win.left * pxPerMm;
  const winRight = cx + win.right * pxPerMm;
  const winTop = cy - win.top * pxPerMm;
  const winBottom = cy + win.bottom * pxPerMm;
  const mw = winRight - winLeft;
  const mh = winBottom - winTop;
  const mx = (winLeft + winRight) * 0.5;
  const my = (winTop + winBottom) * 0.5;

  const subLeft = cx - b.left * pxPerMm;
  const subRight = cx + b.right * pxPerMm;
  const subTop = cy - b.top * pxPerMm;
  const subBottom = cy + b.bottom * pxPerMm;

  // 干扰物紧贴卡纸内角（与四条中点把手、中心主体保持安全距离，绝不被卡纸裁切遮挡）
  const insetX = clamp(Math.min(mw, mh) * 0.13, 14, 34);
  const insetY = clamp(Math.min(mw, mh) * 0.13, 14, 34);
  const clutter = CLUTTER_ITEMS.map((item) => {
    const x = item.dx > 0 ? winRight - insetX : winLeft + insetX;
    const y = item.dy > 0 ? winBottom - insetY : winTop + insetY;
    const u = clamp((x - winLeft) / Math.max(1, mw), 0.05, 0.95);
    const v = clamp((y - winTop) / Math.max(1, mh), 0.05, 0.95);
    return {
      ...item,
      x,
      y,
      u,
      v,
      r: clamp(Math.min(mw, mh) * 0.05, 10, 17),
    };
  });

  // 四条卡纸内沿把手中心坐标（落在每条内沿的中点）
  const handles = {
    left: { x: winLeft, y: my },
    right: { x: winRight, y: my },
    top: { x: mx, y: winTop },
    bottom: { x: mx, y: winBottom },
  };

  const margins = realMargins(win, subjectId);

  return {
    W,
    H,
    pxPerMm,
    cx,
    cy,
    mw,
    mh,
    mx,
    my,
    winLeft,
    winRight,
    winTop,
    winBottom,
    subLeft,
    subRight,
    subTop,
    subBottom,
    bounds: b,
    clutter,
    handles,
    margins,
  };
}

// 拖动某一条卡纸内沿时的磁吸：
// - 拖左/右沿：吸附「左右等宽」，若此时接近上留白也顺手吸附「四边等宽」
// - 拖上/下沿：吸附「四边等宽（上下相等）」和「下边加宽（bottom weighting，下比上宽 12mm）」两档
export function snapEdge(side, win, subjectId, W, H) {
  const next = { ...win };
  const b = subjectBounds(subjectId);
  const m = realMargins(next, subjectId);

  if (side === "left") {
    if (Math.abs(m.left - m.right) <= SNAP_MM) {
      next.left = b.left + m.right;
    } else if (Math.abs(m.left - m.top) <= SNAP_MM) {
      next.left = b.left + m.top;
    }
  } else if (side === "right") {
    if (Math.abs(m.right - m.left) <= SNAP_MM) {
      next.right = b.right + m.left;
    } else if (Math.abs(m.right - m.top) <= SNAP_MM) {
      next.right = b.right + m.top;
    }
  } else if (side === "top") {
    const equalTarget = m.bottom;
    const weightedTarget = m.bottom - BOTTOM_WEIGHT_EXTRA_MM;
    const horizTarget = (m.left + m.right) / 2;
    const candidates = [equalTarget, weightedTarget, horizTarget];
    let best = null;
    for (const c of candidates) {
      const d = Math.abs(m.top - c);
      if (d <= SNAP_MM && (!best || d < best.d)) best = { val: c, d };
    }
    if (best) next.top = b.top + best.val;
  } else if (side === "bottom") {
    const equalTarget = m.top;
    const weightedTarget = m.top + BOTTOM_WEIGHT_EXTRA_MM;
    const candidates = [equalTarget, weightedTarget];
    let best = null;
    for (const c of candidates) {
      const d = Math.abs(m.bottom - c);
      if (d <= SNAP_MM && (!best || d < best.d)) best = { val: c, d };
    }
    if (best) next.bottom = b.bottom + best.val;
  }

  return clampWin(next, W, H, subjectId);
}

// 计算整幅装裱窗口内的综合视觉重心（主体 + 仍在场内的干扰物，归一化到窗口 0..1）
export function visualCentroid(geom, clutterMask) {
  const { u, v } = geom.margins;
  const mask = Array.isArray(clutterMask) ? clutterMask : [false, false, false];
  const active = geom.clutter.filter((_, i) => Boolean(mask[i]));
  if (!active.length) return { u, v, shift: 0, dx: 0, dy: 0 };

  const mainW = 1.0;
  let sumW = mainW;
  let sumU = u * mainW;
  let sumV = v * mainW;
  for (const item of active) {
    sumW += item.weight;
    sumU += item.u * item.weight;
    sumV += item.v * item.weight;
  }
  const cu = sumU / sumW;
  const cv = sumV / sumW;
  return {
    u: cu,
    v: cv,
    dx: cu - u,
    dy: cv - v,
    shift: Math.hypot(cu - u, cv - v),
  };
}

// 双轴天平倾角（同时反映横向与纵向：负=偏左/偏高，正=偏右/偏沉，0=平衡）
// 既反映画框中心相对「+」的偏离，也反映场内干扰物把综合视觉重心拉偏的分量。
export function dualBalance(geom, clutterMask) {
  const c = visualCentroid(geom, clutterMask);
  const m = geom.margins;
  const tiltX = clamp((c.u - 0.5) * 64, -18, 18);
  const tiltY = clamp((c.v - 0.5) * 64, -18, 18);
  const diffH = Math.round(m.left - m.right); // >0 左宽右紧（主体偏右）
  const diffV = Math.round(m.bottom - m.top); // >0 下宽上紧（主体偏上/bottom weighting）
  return {
    tiltX,
    tiltY,
    diffH,
    diffV,
    offsetXMm: Math.round(m.frameOffsetX),
    offsetYMm: Math.round(m.frameOffsetY),
    offsetDistMm: Math.round(m.frameOffsetDist),
    centroid: c,
  };
}

// 阿恩海姆「正方形隐性结构」示意力向量（教学示意模型，用于直观感受拉扯方向）
export function arnheimForce(u, v) {
  const du = u - 0.5;
  const dv = v - 0.5;
  const r = Math.hypot(du, dv);

  let fx = 0;
  let fy = 0;
  if (r > 0.004) {
    const centerPull = r < 0.22 ? Math.sin((r / 0.22) * Math.PI) * 0.95 : 0.12 * Math.exp(-(r - 0.22) * 5);
    fx += (-du / r) * centerPull;
    fy += (-dv / r) * centerPull;
  }

  const edgePull = (d) => Math.max(0, (0.22 - d) / 0.22) ** 2 * 1.15;
  fx -= edgePull(u);
  fx += edgePull(1 - u);
  fy -= edgePull(v);
  fy += edgePull(1 - v);

  const mag = Math.min(1, Math.hypot(fx, fy));
  return { fx, fy, mag };
}

export function classify(state, geom) {
  const m = geom.margins;
  const active = activeClutter(state.clutterMask);
  const clutterCount = active.length;
  const bal = dualBalance(geom, state.clutterMask);
  const force = arnheimForce(m.u, m.v);

  const absH = Math.abs(m.left - m.right);
  const absV = Math.abs(m.top - m.bottom);
  const bottomExtra = m.bottom - m.top; // 正数表示下留白更宽

  const horizBalanced = absH <= 3;
  const vertEqual = absV <= 3;
  const allEqual = horizBalanced && vertEqual && Math.abs(m.left - m.top) <= 4;
  // 下边加宽（bottom weighting）：左右齐平，且下留白比上留白宽约 8–20 mm（对应光学上提约 3%–5% 经验值）
  const bottomWeighted =
    horizBalanced &&
    bottomExtra >= 8 &&
    bottomExtra <= 20 &&
    Math.abs((m.left + m.right) / 2 - m.top) <= 6;
  const horizVertCloseEqual = horizBalanced && vertEqual;

  const nearEdge =
    m.left <= MIN_CLEARANCE_MM + 3 ||
    m.right <= MIN_CLEARANCE_MM + 3 ||
    m.top <= MIN_CLEARANCE_MM + 3 ||
    m.bottom <= MIN_CLEARANCE_MM + 3;

  let zone = "skewed";
  let badge = "卡纸偏斜";
  let headline = "四边未匀，画框中心偏离「+」";
  let body =
    "上下左右的呼吸边距失衡，主体被挤向窄边一侧。先点掉画框里的杂物清场，再拖动四条卡纸内沿把手，让画框中心回到「+」或略微下沉形成下边加宽。";
  let framingDone = false;
  let framingLabel = "待裁匀";

  if (nearEdge) {
    zone = "edge";
    badge = "卡纸贴边";
    headline = "某一侧卡纸裁得太紧，快压住展品了";
    body =
      "窄缝一侧失去缓冲场，视线会顺着紧贴的边沿溜走。把过紧的那条卡纸内沿往外拉宽，给主角留出呼吸余地。";
  } else if (bottomWeighted) {
    zone = "weighted";
    framingDone = true;
    framingLabel = "下边加宽";
    badge = clutterCount ? "已裁好 · 待清场" : "下边加宽 · 光学居中";
    headline = clutterCount
      ? "下边加宽已就位，但角落杂物还在拉偏天平"
      : `下留白加宽 ${Math.round(bottomExtra)} mm，托起光学稳重感`;
    body = clutterCount
      ? `左、右、上三边齐平，下卡纸略宽（装裱里的 bottom weighting），但场内仍有 ${clutterCount} 件杂物分走重量——直接点掉它们清场。`
      : `左、右、上留白均等，画框中心落在「+」下方 ${Math.round(bottomExtra / 2)} mm（主体视觉上提约 ${m.opticalLiftPct.toFixed(1)}%，落入 3%–5% 经验区间），抵消底部下沉错觉。`;
  } else if (allEqual) {
    zone = "equal";
    framingDone = true;
    framingLabel = "四边等宽";
    badge = clutterCount ? "已裁好 · 待清场" : "四边等宽 · 几何居中";
    headline = clutterCount
      ? "四边已经裁匀，但杂物把重心拖歪了"
      : `四边同为 ${m.leftR} mm，画框中心与「+」重合`;
    body = clutterCount
      ? `上下左右留白完全均等，但画框角落还留着 ${clutterCount} 件干扰物，天平仍未归零——直接点画框里的杂物逐件请出去。`
      : "按展品真实外接框量出四向完全相等的留白，画框中心与「+」重合，横纵天平同时归零。也可以试试把下边再拉宽一档，感受装裱里的「下边加宽」。";
  } else if (horizVertCloseEqual) {
    zone = "equal";
    framingDone = true;
    framingLabel = "对边齐平";
    badge = clutterCount ? "对边齐平 · 待清场" : "对边齐平 · 居中平衡";
    headline = clutterCount
      ? "左右与上下各自对齐，但角落杂物仍在抢戏"
      : `左右同为 ${m.leftR} mm、上下同为 ${m.topR} mm，双轴归中`;
    body = clutterCount
      ? `主体已落回窗口正中，但场内还有 ${clutterCount} 件边缘杂物拉偏综合重心——点掉它们把四周请空。`
      : "左右等距、上下等距，画框中心回到「+」点，横纵两条天平同时归零。若想让四向余白完全一致，可再微调让横纵毫米数也拉齐，或把下边适当加宽。";
  } else if (horizBalanced && bottomExtra < -4) {
    zone = "sunk";
    badge = "重心下沉";
    headline = "左右已齐，但上宽下窄显得发沉";
    body =
      `左右留白已经对齐，但下留白（${m.bottomR} mm）反而比上留白（${m.topR} mm）窄——画框中心高出「+」，主体像被重力拽向底边。把下卡纸往下拉宽，或把上卡纸往下收一收。`;
  } else if (absH <= 10 && absV <= 10) {
    zone = "awkward";
    badge = "微妙偏离";
    headline = "差之毫厘：最像「没裁正」的焦躁区";
    body =
      `四边只差几毫米却没对齐（左 ${m.leftR} / 右 ${m.rightR}，上 ${m.topR} / 下 ${m.bottomR} mm），画框中心仍偏离「+」约 ${bal.offsetDistMm} mm，眼睛立刻会觉得装裱歪了。`;
  }

  let extra = SUBJECTS[state.subject].note;
  if (state.subject === "boat") {
    if (allEqual || bottomWeighted || horizVertCloseEqual) {
      badge = clutterCount ? "朝向局促 · 待清场" : "朝向局促";
      headline = "侧向纸舟四边硬卡等宽，船头前方偏紧";
      body =
        "船头明确朝右，左右余白死守相等时，前方航道反倒显得局促；把右卡纸内沿再往外拉宽一点，让船头面向更充裕的空白。";
    } else if (m.right - m.left >= 10 && absV <= 16) {
      zone = "inward";
      framingDone = true;
      framingLabel = "顺应朝向";
      badge = clutterCount ? "航道已留 · 待清场" : "顺应朝向";
      headline = "右侧卡纸裁宽，船头腾出航道";
      body = clutterCount
        ? `右留白（${m.rightR} mm）已明显宽于左留白（${m.leftR} mm），船头不再撞框；再点掉剩余 ${clutterCount} 件杂物就干净了。`
        : `给朝右的船头多留出 ${Math.round(m.right - m.left)} mm 前方空间，比死卡等宽更顺眼——这正是视觉心理研究里的「向内偏好」。`;
    } else if (m.left - m.right >= 10) {
      badge = "船头撞框";
      headline = "右卡纸压得太近，船头快撞墙了";
      body =
        `纸舟本就朝右，右留白却只剩 ${m.rightR} mm（左留白达 ${m.leftR} mm），船头前方的呼吸空间被挤扁了。`;
    }
  }

  if (clutterCount > 0) {
    extra = `第一步先清场：画框角落还有 ${clutterCount} 件干扰物，正把综合重心拉偏约 ${Math.round(bal.centroid.shift * 100)}% 窗幅；直接点掉它们再把四边裁匀。`;
  }

  const locked =
    framingDone &&
    clutterCount === 0 &&
    (state.subject !== "boat" || zone === "inward");

  return {
    zone,
    badge,
    headline,
    body,
    extra,
    margins: m,
    balance: bal,
    force,
    clutterCount,
    framingDone,
    framingLabel,
    locked,
  };
}

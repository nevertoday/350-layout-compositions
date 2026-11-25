// 328 虚实 相生构图 · 单真源几何与三态占比核算模型
// 所有实/虚/过渡占比、穿插叠合率、环眼虚空与焦点锚定，均从同一组归一化几何坐标与 48×36 实绘栅格掩码直接算出。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报 · 玉环阶屏",
    short: "玉环阶屏",
    note: "忠实 328 原海报结构：瓷白圆环、阶梯实体、半透翠玉方屏、淡青雾圆、三道水雾波纹与朱橙焦点。",
  },
  landscape: {
    id: "landscape",
    label: "山水 · 雾锁孤峰",
    short: "雾锁孤峰",
    note: "南宋边角山水意象：瓷白孤峰与山谷留空为实中含虚，横贯云岚透屏穿插山脚，朱印锚定水岸门槛。",
  },
  editorial: {
    id: "editorial",
    label: "版面 · 虚实海报",
    short: "虚实海报",
    note: "当代展演海报告示：粗实大字环廓、磨砂导览透卡与大片深青呼吸域交织，朱橙展期印锁定入口。",
  },
};

export const PRESETS = {
  broken: {
    label: "复原 0/4 错态",
    veilX: 0.15,
    veilY: 0.70,
    solidMass: 0.92,
    aperture: 0.06,
    veilOpacity: 0.44,
    focusAnchor: "stray",
    focusX: 0.90,
    focusY: 0.12,
    waveFlow: false,
    multiFocus: false,
  },
  poster_sol: {
    label: "原海报解",
    veilX: 0.49,
    veilY: 0.64,
    solidMass: 0.50,
    aperture: 0.44,
    veilOpacity: 0.48,
    focusAnchor: "rim",
    focusX: 0.76,
    focusY: 0.50,
    waveFlow: true,
    multiFocus: false,
  },
  sparse_sol: {
    label: "大虚孤实解",
    veilX: 0.48,
    veilY: 0.62,
    solidMass: 0.34,
    aperture: 0.46,
    veilOpacity: 0.42,
    focusAnchor: "rim",
    focusX: 0.74,
    focusY: 0.49,
    waveFlow: true,
    multiFocus: false,
  },
  mist_sol: {
    label: "轻雾高透解",
    veilX: 0.52,
    veilY: 0.60,
    solidMass: 0.44,
    aperture: 0.50,
    veilOpacity: 0.32,
    focusAnchor: "rim",
    focusX: 0.76,
    focusY: 0.50,
    waveFlow: true,
    multiFocus: false,
  },
  err_heavy: {
    label: "试错：实满",
    veilX: 0.47,
    veilY: 0.64,
    solidMass: 0.96,
    aperture: 0.06,
    veilOpacity: 0.46,
    focusAnchor: "buried",
    focusX: 0.74,
    focusY: 0.48,
    waveFlow: true,
    multiFocus: false,
  },
  err_smother: {
    label: "试错：吞实",
    veilX: 0.64,
    veilY: 0.46,
    solidMass: 0.48,
    aperture: 0.42,
    veilOpacity: 0.88,
    focusAnchor: "rim",
    focusX: 0.76,
    focusY: 0.495,
    waveFlow: true,
    multiFocus: false,
  },
};

export function resolvePreset(key, aspect = 4 / 3) {
  const p = PRESETS[key];
  if (!p) return null;
  const next = {
    veilX: p.veilX,
    veilY: p.veilY,
    solidMass: p.solidMass,
    aperture: p.aperture,
    veilOpacity: p.veilOpacity,
    focusX: p.focusX,
    focusY: p.focusY,
    waveFlow: p.waveFlow,
    multiFocus: p.multiFocus,
    soloLayer: "all",
  };
  if (p.focusAnchor === "rim") {
    const g = computeGeometry({ scene: "poster", ...next }, aspect);
    next.focusX = +g.idealFocus.x.toFixed(4);
    next.focusY = +g.idealFocus.y.toFixed(4);
  }
  return next;
}

export function createInitialState() {
  return {
    scene: "poster",
    soloLayer: "all", // "all" | "solid" | "void" | "transition"
    ...PRESETS.broken,
  };
}

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// 从状态派生唯一几何定义（所有坐标归一化到 0..1 画布；按面积不变因子 areaScale 保持全屏占比一致且圆永远为正圆不裁边）
export function computeGeometry(state, aspect = 4 / 3) {
  const mass = clamp(state.solidMass, 0.15, 1.0);
  const ap = clamp(state.aperture, 0.04, 0.80);
  const areaScale = clamp(Math.sqrt(aspect / 1.333), 0.82, 1.24);

  // 主体瓷白圆环（居中偏右上，与 328 原海报对应；窄竖屏微左收，严防右沿/顶沿被画布裁切）
  const ringCx = aspect < 1.05 ? 0.625 : 0.66;
  const ringCy = aspect < 1.05 ? 0.405 : 0.455;
  const maxRByTop = ringCy - 0.045;
  const maxRByRight = (0.955 - ringCx) * aspect;
  // 按画布高度归一化半径（带面积不变与安全边界校正，确保全尺寸下圆永为正圆、永不贴边裁切）
  const outerR = Math.min(maxRByTop, maxRByRight, (0.185 + mass * 0.225) * areaScale);
  const innerR = outerR * ap;

  // 阶梯实体（严格忠实 328 原海报：上沿 45° 像素斜坡顺接圆环左下，下沿两级 90° 锐利直角台阶）
  const stairH = clamp((0.155 + mass * 0.11) * areaScale, 0.15, 0.27);
  const stairW = (stairH * 0.98) / aspect;
  const stairBottom = 0.835;
  const ringTouchX = ringCx - (outerR * 0.34) / aspect;
  const stairLeft = clamp(ringTouchX - stairW * 0.90, 0.365, 0.50);

  // 朱橙基座（阶梯左下压脚，原海报实橙矩形）
  const baseH = clamp((0.062 + mass * 0.018) * areaScale, 0.058, 0.084);
  const baseW = clamp(((0.11 + mass * 0.035) * areaScale) / aspect, 0.085, 0.155);
  const baseRect = {
    x: stairLeft - baseW * 0.22,
    y: stairBottom - baseH,
    w: baseW,
    h: baseH,
  };

  // 半透翠玉方屏（可拖动的「过渡 · 虚实」层，始终严格保持 1:1 正方形；窄竖屏控宽确保开场 0% 脱开）
  const veilH = Math.min(clamp(0.375 * areaScale, 0.28, 0.42), 0.275 * aspect);
  const veilW = veilH / aspect;
  const veilX = clamp(state.veilX, 0.03 + veilW * 0.5, 0.96 - veilW * 0.5);
  const veilY = clamp(state.veilY, 0.14 + veilH * 0.5, 0.91 - veilH * 0.5);
  const veilRect = {
    x: veilX - veilW * 0.5,
    y: veilY - veilH * 0.5,
    w: veilW,
    h: veilH,
    cx: veilX,
    cy: veilY,
  };

  // 左上雾化虚圆（随环眼虚空与透屏状态舒展）
  const mistCx = ringCx - (outerR * 1.15) / aspect;
  const mistCy = ringCy - outerR * 0.52;
  const mistR = (0.052 + ap * 0.108) * areaScale;

  // 朱橙视觉焦点（可拖动的「视觉焦点 · 实」）
  const focusX = clamp(state.focusX, 0.06, 0.94);
  const focusY = clamp(state.focusY, 0.08, 0.92);
  const focusR = 0.022 * areaScale;

  // 原海报最经典的视觉焦点锚点：圆环内孔右下沿（或环外沿/阶梯转折）
  const rimAngle = 0.52; // 右下 30°
  const idealFocus = {
    x: ringCx + (Math.cos(rimAngle) * innerR) / aspect,
    y: ringCy + Math.sin(rimAngle) * innerR,
  };

  // 第二个干扰焦点（试错多焦抢戏时出现）
  const decoyFocus = {
    x: 0.24,
    y: 0.28,
    r: focusR,
  };

  // 阶梯多边形（忠实原海报：左斜 45° 上升直插圆环腹，右下方两级 crisp 90° 台阶落回基座顶）
  const baseTopY = stairBottom - baseH;
  const slopeTopY = baseTopY - stairH * 0.74;
  const slopeTopX = stairLeft + (stairH * 0.74) / aspect;
  const stepRightX = slopeTopX + (stairH * 0.36) / aspect;
  const stepMidY = baseTopY - stairH * 0.36;
  const stepMidX = stairLeft + (stairH * 0.64) / aspect;
  const stairPoly = [
    { x: stairLeft, y: baseTopY },
    { x: slopeTopX, y: slopeTopY },
    { x: stepRightX, y: slopeTopY + stairH * 0.34 },
    { x: stepRightX, y: stepMidY },
    { x: stepMidX, y: stepMidY },
    { x: stepMidX, y: baseTopY },
  ];

  // 对角导流斜线（从左下雾波沿阶梯 45° 斜坡直穿圆环心）
  const diag = {
    x1: stairLeft - (0.14 / aspect),
    y1: baseTopY + 0.14,
    x2: ringCx + (outerR * 0.92) / aspect,
    y2: ringCy - outerR * 0.92,
  };

  // 虚线构造外框与细白构造大圆
  const guideCircle = {
    cx: ringCx - (0.09 / aspect),
    cy: ringCy + 0.05,
    r: Math.min(0.275, outerR * 1.15 + 0.04),
  };

  return {
    aspect,
    ring: { cx: ringCx, cy: ringCy, outerR, innerR },
    stair: { left: stairLeft, bottom: stairBottom, w: stairW, h: stairH, poly: stairPoly },
    baseRect,
    veil: veilRect,
    mist: { cx: mistCx, cy: mistCy, r: mistR },
    focus: { x: focusX, y: focusY, r: focusR },
    idealFocus,
    decoyFocus,
    diag,
    guideCircle,
  };
}

function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = (yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// 48×36 三态掩码单真源核算（直接对同一几何逐格采样）
// 同时根据当前场景（poster / landscape / editorial）保持一致的三态物理判据
export function evaluate(state, aspect = 4 / 3) {
  const g = computeGeometry(state, aspect);
  const cols = 48;
  const rows = 36;
  let solidOnly = 0;
  let solidUnderVeil = 0;
  let veilOverVoid = 0;
  let mistOverVoid = 0;
  let pureVoid = 0;

  for (let r = 0; r < rows; r++) {
    const py = (r + 0.5) / rows;
    for (let c = 0; c < cols; c++) {
      const px = (c + 0.5) / cols;

      // 1) 是否命中实体（圆环实体壁 / 阶梯实体 / 朱橙基座 / 朱橙焦点）
      const dRing = Math.hypot((px - g.ring.cx) * aspect, py - g.ring.cy);
      const inRingWall = dRing <= g.ring.outerR && dRing >= g.ring.innerR;
      const inStair = pointInPoly(px, py, g.stair.poly);
      const inBase = pointInRect(px, py, g.baseRect);
      const inFocus = Math.hypot((px - g.focus.x) * aspect, py - g.focus.y) <= g.focus.r * 1.15;

      // 场景 2（山水）在实块形态上增加远岸与孤舟实影；场景 3（版面）增加左栏实标与底注块
      let extraSolid = false;
      if (state.scene === "landscape") {
        // 山体左翼延伸（与环壁/阶梯同体量缩放）
        const ridgeH = 0.14 + state.solidMass * 0.12;
        const inLeftRidge = px > 0.36 && px < 0.56 && py > 0.78 - ridgeH * (1 - Math.abs(px - 0.47) * 4.5) && py < 0.78;
        const inBoat = px > 0.20 && px < 0.33 && py > 0.74 && py < 0.775;
        extraSolid = inLeftRidge || inBoat;
      } else if (state.scene === "editorial") {
        const inTopTag = px > 0.14 && px < 0.34 && py > 0.16 && py < 0.23;
        extraSolid = inTopTag;
      }

      const isSolid = inRingWall || inStair || inBase || inFocus || extraSolid;

      // 2) 是否命中过渡层（半透翠玉方屏 或 雾化淡青虚圆有效区）
      const inVeil = pointInRect(px, py, g.veil);
      const dMist = Math.hypot((px - g.mist.cx) * aspect, py - g.mist.cy);
      const inMist = dMist <= g.mist.r * 0.85;

      if (isSolid) {
        if (inVeil) solidUnderVeil++;
        else solidOnly++;
      } else if (inVeil) {
        veilOverVoid++;
      } else if (inMist) {
        mistOverVoid++;
      } else {
        pureVoid++;
      }
    }
  }

  const total = cols * rows;
  const totalSolidCells = solidOnly + solidUnderVeil;
  // 过渡区 = 透屏穿插区 + 透屏虚覆区 + 雾化虚圆区
  const transCells = solidUnderVeil + veilOverVoid + mistOverVoid;
  // 实/虚/过渡三项总和严格为 100%（把被透屏半盖的实块按半透归入过渡，让用户清楚看到三层之和 = 100%）
  const solidPct = Math.round((solidOnly / total) * 100);
  const transPct = Math.round((transCells / total) * 100);
  const voidPct = Math.max(0, 100 - solidPct - transPct);

  // 总实形体量占比（含被透屏叠压的实体部分，用来衡量「实满堵气 vs 虚浮无骨」）
  const rawSolidPct = Math.round((totalSolidCells / total) * 100);
  // 实体穿插率 = 有多少百分比的实体被半透方屏温柔穿插
  const overlapPct = totalSolidCells > 0 ? Math.round((solidUnderVeil / totalSolidCells) * 100) : 0;

  // 焦点与实虚边界距离（按画布高度算）：
  // 合法边界包括：圆环内孔边沿、圆环外缘、阶梯与透屏交界
  const dToCenter = Math.hypot((g.focus.x - g.ring.cx) * aspect, g.focus.y - g.ring.cy);
  const distInnerRim = Math.abs(dToCenter - g.ring.innerR);
  const distOuterRim = Math.abs(dToCenter - g.ring.outerR);
  // 阶梯右折角门槛
  const stairHingeX = g.stair.left + g.stair.w * 0.68;
  const stairHingeY = g.stair.bottom - g.stair.h * 0.56;
  const distStairHinge = Math.hypot((g.focus.x - stairHingeX) * aspect, g.focus.y - stairHingeY);

  const nearEdge = g.focus.x < 0.07 || g.focus.x > 0.93 || g.focus.y < 0.09 || g.focus.y > 0.91;
  const focusUnderVeil = pointInRect(g.focus.x, g.focus.y, g.veil) && state.veilOpacity > 0.72;
  const onInnerRim = g.ring.innerR >= 0.04 && distInnerRim <= 0.055;
  const onOuterRim = distOuterRim <= 0.042 && g.focus.x > 0.46 && g.focus.y > 0.20;
  const onStairHinge = distStairHinge <= 0.062;
  const buriedInWhite = dToCenter < g.ring.outerR - 0.04 && dToCenter > g.ring.innerR + 0.04;

  let focusZone = "void_stray";
  if (state.multiFocus) focusZone = "multi_clash";
  else if (nearEdge) focusZone = "edge_slip";
  else if (focusUnderVeil) focusZone = "buried_veil";
  else if (onInnerRim || onOuterRim || onStairHinge) focusZone = "hinge";
  else if (buriedInWhite) focusZone = "buried_solid";

  // 四大判据（经全屏幕纵横比单真源校验，呼应传统「三实七虚」经验区间 12%–29%）
  const contrastOk = rawSolidPct >= 12 && rawSolidPct <= 29;
  const interplayOk = overlapPct >= 14 && overlapPct <= 60 && state.veilOpacity >= 0.22 && state.veilOpacity <= 0.76;
  const apertureOk = state.aperture >= 0.24 && state.aperture <= 0.66;
  const hierarchyOk = focusZone === "hinge" && !state.multiFocus && state.waveFlow;

  const passed = [contrastOk, interplayOk, apertureOk, hierarchyOk].filter(Boolean).length;

  // 收集全部错态，按最紧迫的一条给出白话诊断（含「为什么」与可行动下一步）
  const faults = [];

  if (!interplayOk) {
    if (overlapPct < 14) {
      faults.push({
        id: "veil_detached",
        short: "虚实割裂",
        badge: `穿插 ${overlapPct}%`,
        title: `透屏离体过远，实体穿插只有 ${overlapPct}%`,
        why: "328 原海报的关键不只在「有实有虚」，而在「穿插与重叠」。现在半透翠玉屏退在边角，瓷白实体和深青空白生硬贴成两张纸，画面没有前后层次。",
        action: "向右上方拖动半透翠玉方屏，让它切入瓷白圆环与阶梯左下约 20%–50% 的区域。",
        canvasTag: { x: g.veil.cx, y: g.veil.y - 0.03, text: `× 穿插 ${overlapPct}% · 拖入环域` },
        fix: { veilX: 0.48, veilY: 0.65, veilOpacity: 0.48 },
      });
    } else if (state.veilOpacity > 0.76 || overlapPct > 60) {
      faults.push({
        id: "veil_smother",
        short: "雾气吞实",
        badge: state.veilOpacity > 0.76 ? `过浊 ${Math.round(state.veilOpacity * 100)}%` : `盖实 ${overlapPct}%`,
        title: state.veilOpacity > 0.76
          ? `透屏浓度高达 ${Math.round(state.veilOpacity * 100)}%，把实形蒙灰了`
          : `透屏覆盖了 ${overlapPct}% 的实体，实虚对比被糊平`,
        why: "过渡层的作用是柔化交界，不是替主角盖被子。屏太浊或盖太满，实体锐度一垮，空白也失去了反衬的对象。",
        action: "把翠玉透屏往左下轻移，或把「透屏浓度」降到 30%–65%，留出干脆的瓷白实边。",
        canvasTag: { x: g.veil.cx, y: g.veil.y - 0.03, text: "× 雾气吞实 · 左移减浊" },
        fix: { veilX: 0.48, veilY: 0.65, veilOpacity: 0.46 },
      });
    } else {
      faults.push({
        id: "veil_faint",
        short: "透屏隐身",
        badge: `过淡 ${Math.round(state.veilOpacity * 100)}%`,
        title: `透屏浓度仅 ${Math.round(state.veilOpacity * 100)}%，过渡层几乎看不见`,
        why: "半透层淡到与底色融为一体时，硬白边直接撞上深青底，前后交错的呼吸台阶消失了。",
        action: "把「透屏浓度」调到 30%–65%，让交叠处显出温润的翠玉半透色。",
        canvasTag: { x: g.veil.cx, y: g.veil.y - 0.03, text: "× 透屏过淡 · 提浓度" },
        fix: { veilOpacity: 0.46 },
      });
    }
  }

  if (!apertureOk) {
    if (state.aperture < 0.24) {
      faults.push({
        id: "solid_choked",
        short: "实心闷死",
        badge: `环眼 ${Math.round(state.aperture * 100)}%`,
        title: `圆环内孔仅 ${Math.round(state.aperture * 100)}%，右上堵成实心白饼`,
        why: "原海报第二条写着「虚为实之形，实为虚之用」。实体内部若不留一口深青虚眼，视觉重量就会在右上角憋闷卡死，失去「实中有虚」的通透感。",
        action: "把「环眼虚空」滑到 30%–58%，从白环内部透出深青呼吸孔。",
        canvasTag: { x: g.ring.cx, y: g.ring.cy, text: "× 实心闷死 · 点开虚眼" },
        fix: { aperture: 0.44 },
      });
    } else {
      faults.push({
        id: "solid_broken",
        short: "实壁崩碎",
        badge: `环眼 ${Math.round(state.aperture * 100)}%`,
        title: `环眼挖到 ${Math.round(state.aperture * 100)}%，实环细成铁丝撑不住场`,
        why: "「实景清而空景现」——实形一旦被掏空得只剩细丝，就托不起整片深青留白，整幅画面跟着飘散。",
        action: "把「环眼虚空」收回 30%–58%，恢复瓷白实壁的分量。",
        canvasTag: { x: g.ring.cx, y: g.ring.cy, text: "× 实壁过薄 · 收回环眼" },
        fix: { aperture: 0.44 },
      });
    }
  }

  if (!contrastOk) {
    if (rawSolidPct > 29) {
      faults.push({
        id: "mass_heavy",
        short: "满堵失气",
        badge: `实占 ${rawSolidPct}%`,
        title: `总实占幅冲到 ${rawSolidPct}%，深青空白被挤得喘不过气`,
        why: "虚实对比依赖「少实衬多虚」（传统常言三实七虚）。实体逼近或超过三成时，余白退化成边角碎缝，不再是能承载想象的开阔空间。",
        action: "向左收小「实块体量」（或打开环眼），让总实占幅回到 12%–29% 的清爽区间。",
        canvasTag: { x: g.ring.cx - 0.14, y: g.ring.cy - 0.20, text: `× 实满 ${rawSolidPct}% · 减体量` },
        fix: { solidMass: 0.48, aperture: Math.max(state.aperture, 0.42) },
      });
    } else {
      faults.push({
        id: "mass_thin",
        short: "虚浮无骨",
        badge: `实占 ${rawSolidPct}%`,
        title: `总实占幅只剩 ${rawSolidPct}%，深青底沦为孤立空场`,
        why: "大片空白本身不会自动生出意境——没有足够扎实的主形立住骨架，空白就只是一块没画完的空地。",
        action: "向右增厚「实块体量」，让总实占幅达到 12%–29%。",
        canvasTag: { x: g.ring.cx, y: g.ring.cy - 0.16, text: `× 实弱 ${rawSolidPct}% · 增体量` },
        fix: { solidMass: 0.48 },
      });
    }
  }

  if (!hierarchyOk) {
    if (state.multiFocus) {
      faults.push({
        id: "focus_multi",
        short: "双焦打架",
        badge: "2 枚橙点",
        title: "画面里同时冒出两枚等重朱橙点，视线左右撕扯",
        why: "视觉焦点（实）贵在唯一。两处高饱和朱橙彼此抢戏，原海报「强化主体，聚焦视线」的收敛节奏立即散掉。",
        action: "关掉「双焦试错」开关，只留一枚朱橙锚点落在实虚交界处。",
        canvasTag: { x: g.decoyFocus.x, y: g.decoyFocus.y + 0.06, text: "× 多点抢焦 · 点此撤除" },
        fix: { multiFocus: false },
      });
    } else if (focusZone !== "hinge") {
      const msg = focusZone === "edge_slip"
        ? "朱橙焦点贴着画边，眼睛刚追过去就滑出画框"
        : focusZone === "buried_veil"
          ? "朱橙焦点被浓透屏盖死，最强视觉钉子变暗了"
          : focusZone === "buried_solid"
            ? "朱橙焦点孤零零嵌在白块深处，脱开了虚实交界线"
            : "朱橙焦点悬空飘在空白里，跟主体没有借力关系";
      faults.push({
        id: "focus_stray",
        short: focusZone === "edge_slip" ? "焦点滑边" : focusZone === "buried_veil" ? "焦点被遮" : "焦点悬空",
        badge: "脱开边界",
        title: msg,
        why: "最有力量的视觉焦点往往钉在「实与虚交接的门槛」上——比如圆环内孔边沿。一边是深青虚空，一边是瓷白实体，朱橙一点落在这里立刻稳住全场。",
        action: "把朱橙圆点拖回瓷白环的内孔边缘（或阶梯转折处），让它成为实虚交汇的钉子。",
        canvasTag: { x: g.focus.x, y: g.focus.y + 0.065, text: "× 焦点脱界 · 拖回环边" },
        fix: { focusX: g.idealFocus.x, focusY: g.idealFocus.y },
      });
    } else if (!state.waveFlow) {
      faults.push({
        id: "flow_missing",
        short: "导流断拍",
        badge: "缺雾波引线",
        title: "左下雾波与斜向导流线关着，视线缺少「由虚入实」的入口",
        why: "原海报第三条是「层次引导：虚实节奏引导视线流动」。左下三道渐隐水雾波纹连着细斜线，把目光轻柔地从空白托进阶梯、穿过透屏、最后落到朱橙焦点。",
        action: "点按画布红标或「引流雾波」开关，接通从左下空白通往右上环心的视线路径。",
        canvasTag: { x: 0.24, y: 0.80, text: "× 缺引流雾波 · 点此接通" },
        fix: { waveFlow: true },
      });
    }
  }

  // 生成总体节奏档位（定性档位，绝不造假精确百分比；简短 4 字不折行）
  let rhythmTier = "相生平衡";
  if (passed === 4) {
    if (rawSolidPct <= 17) rhythmTier = "大虚精实";
    else if (state.veilOpacity <= 0.38) rhythmTier = "轻雾高透";
    else rhythmTier = "三七穿插";
  } else if (faults[0]?.id === "veil_detached") {
    rhythmTier = "实虚割裂";
  } else if (faults[0]?.id === "veil_smother") {
    rhythmTier = "雾浊吞实";
  } else if (faults[0]?.id === "solid_choked" || faults[0]?.id === "mass_heavy") {
    rhythmTier = "满堵滞气";
  } else {
    rhythmTier = "节奏待调";
  }

  const primary = faults[0] || {
    id: "ok",
    short: "虚实相生",
    badge: "4/4 成立",
    title: rawSolidPct <= 17
      ? "大虚托孤实：不到两成的实体立住了整幅空间"
      : state.veilOpacity <= 0.38
        ? "轻雾高透解：淡翠透屏柔化交界，实形依旧利落"
        : "实、虚、过渡三层咬合，视线自左下入画归于环心",
    why: `实测总实占幅 ${rawSolidPct}%（其中 ${overlapPct}% 与透屏穿插叠合；画布可见三态为露实 ${solidPct}% / 纯虚 ${voidPct}% / 过渡 ${transPct}%）、环眼虚空 ${Math.round(state.aperture * 100)}%。瓷白实形内含深青虚眼，半透翠玉屏把阶梯与圆环织成前后两进，朱橙焦点钉在实虚门槛上——不靠死套一种参数，只要四条秩序同在，画面便自然成立。`,
    action: "试试切换上方「山水 · 雾锁孤峰」或「版面 · 虚实海报」，也可以故意把透屏拖开或加浊，观察秩序何时瓦解。",
    canvasTag: null,
    fix: null,
  };

  // 原海报三大核心知识点的实时状态徽
  const principles = [
    {
      key: "contrast",
      ok: contrastOk && apertureOk,
      status: !apertureOk
        ? (state.aperture < 0.24 ? "实心闷死" : "实壁崩碎")
        : !contrastOk
          ? (rawSolidPct > 29 ? `过满 ${rawSolidPct}%` : `过弱 ${rawSolidPct}%`)
          : `总实 ${rawSolidPct}% · 成立`,
    },
    {
      key: "interdependence",
      ok: interplayOk,
      status: !interplayOk
        ? (overlapPct < 14 ? `割裂 ${overlapPct}%` : state.veilOpacity > 0.76 ? "过浊吞实" : `盖实 ${overlapPct}%`)
        : `穿插 ${overlapPct}% · 成立`,
    },
    {
      key: "hierarchy",
      ok: hierarchyOk,
      status: state.multiFocus
        ? "双焦抢戏"
        : focusZone !== "hinge"
          ? "焦点脱界"
          : !state.waveFlow
            ? "缺雾波导流"
            : "锚定 · 成立",
    },
  ];

  return {
    geom: g,
    solidPct,
    voidPct,
    transPct,
    rawSolidPct,
    overlapPct,
    aperturePct: Math.round(state.aperture * 100),
    veilOpacityPct: Math.round(state.veilOpacity * 100),
    focusZone,
    passed,
    contrastOk,
    interplayOk,
    apertureOk,
    hierarchyOk,
    rhythmTier,
    primary,
    faults,
    principles,
  };
}

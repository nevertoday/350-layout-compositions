// 314 多层前景调度 — 单一物理与几何真源（透视视差、实测遮挡面积、叠压链、切边检测、对焦虚实）

export const PALETTE = {
  paper: "#EDE1D3",
  paperLight: "#F6EFE6",
  paperSand: "#E3D4C0",
  sunDisc: "#E4D1B8",
  ink: "#12241F",
  inkMid: "#2D453E",
  inkMuted: "#4A625A",
  pine: "#18322E",
  pineDeep: "#112622",
  palm: "#0A2824",
  agave: "#33493D",
  archFront: "#D7998E",
  archSide: "#9D6759",
  archInner: "#AA7466",
  sphereLit: "#DF948B",
  sphereBase: "#D58279",
  sphereShade: "#B2665E",
  pedestalLight: "#E4D5C1",
  pedestalMid: "#C9B69E",
  pedestalSide: "#A78F70",
  stepTop: "#C2AA8B",
  stepFront: "#A08565",
  roseDot: "#D4988D",
  roseTextLight: "#944037",
  roseTextDark: "#E8A69C",
  creamOnDark: "#F3EAE0",
  sandOnDark: "#C9BCB0",
  warnLight: "#A82D24",
  warnDark: "#F59184",
  okLight: "#1F5E4B",
  okDark: "#8ED1B8",
};

// 五层景片的真实物理纵深（米）与透视视差系数
export const PLANES = [
  { id: "L1", key: "palm", label: "L1 棕榈暗叶", short: "棕榈叶", en: "EXTREME FG", z: 1.1, draggable: true },
  { id: "L2", key: "wall", label: "L2 深松阶墙", short: "深松墙", en: "NEAR FG", z: 2.3, draggable: true },
  { id: "L3", key: "arch", label: "L3 陶红拱门", short: "陶红拱", en: "MID FRAME", z: 4.8, draggable: true },
  { id: "L4", key: "subject", label: "L4 阶台焦点", short: "焦点层", en: "FOCAL PLANE", z: 6.6, draggable: true },
  { id: "L5", key: "sun", label: "L5 远景日盘", short: "远景层", en: "FAR BG", z: 14.0, draggable: false },
];

export const FOCUS_MODES = {
  L1: { label: "对焦 L1 前景叶", targetZ: 1.1, fStop: 2.0 },
  L3: { label: "对焦 L3 拱门框", targetZ: 4.8, fStop: 2.4 },
  L4: { label: "对焦 L4 焦点层", targetZ: 6.6, fStop: 2.2 },
  deep: { label: "全景深 f/11", targetZ: 6.0, fStop: 11.0 },
};

// 开场故意停在 0/4 错态（绝不先给答案）
export const BROKEN_STATE = Object.freeze({
  palmX: 0.59,
  palmY: 0.50,
  wallX: 0.0,
  wallY: 0.86, // 落得太低，与拱门完全脱离、缺乏近前景压角
  archX: 0.35, // 明显偏左，焦点球落在拱门右侧外缘形成切边相切
  subX: 0.60,
  focus: "L1", // 误对焦在前景棕榈叶，焦点球反被虚化
  camX: 0, // -1 .. +1 机位横向视差偏移
  activeLayer: "palm",
  sceneMode: "poster", // "poster" | "cinema"
  showGuide: false,
});

// 仅用于对照参考的平衡态坐标（不提供一键过关按钮，用于第 01/03 节示意或叠看参考线）
export const POSTER_REF = Object.freeze({
  palmX: 0.45,
  palmY: 0.89,
  wallX: 0.0,
  wallY: 0.57,
  archX: 0.54,
  subX: 0.54,
  focus: "L4",
});

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function createState() {
  return { ...BROKEN_STATE };
}

// 计算某景片在当前机位横移 camX 下的画面横向视差位移（比例画宽）
export function parallaxShift(z, camX) {
  // 相机右移（camX > 0）时，前景物向左急退、远景慢移
  const gain = 0.255;
  return -camX * (gain / z);
}

// 依据当前对焦面与光圈，计算各景片的离焦模糊半径（CSS/Canvas px 示意，基于薄透镜弥散圆比例）
export function layerBlurPx(z, focusKey) {
  const fm = FOCUS_MODES[focusKey] || FOCUS_MODES.L4;
  if (focusKey === "deep") {
    return z < 1.5 ? 0.5 : 0;
  }
  const diopterDiff = Math.abs(1 / z - 1 / fm.targetZ);
  // 经验光学弥散换算：f/2.2 下 L1(1.1m) 对焦 L4(6.6m) 时约 3.8px 柔焦
  const coc = (diopterDiff * 11.2) / fm.fStop;
  return clamp(coc, 0, 5.4);
}

// 深松阶墙在归一化 x 处的上缘 y（四级建筑折阶，呼应 314 原海报左高右低的阶台轮廓）
export function wallTopYAt(nx, wallX, wallY, camX) {
  const shift = parallaxShift(2.3, camX);
  const lx = nx - wallX - shift;
  // 海报阶墙：左段最高(wallY - 0.10)，逐步下阶到右下(wallY + 0.30)
  const base = wallY;
  if (lx < 0.24) return base - 0.095 + lx * 0.14;
  if (lx < 0.37) return base - 0.015 + (lx - 0.24) * 0.20;
  if (lx < 0.72) return base + 0.045 + (lx - 0.37) * 0.28;
  if (lx < 0.89) return base + 0.195 + (lx - 0.72) * 0.22;
  return base + 0.275 + (lx - 0.89) * 0.24;
}

// 拱门投影几何（严格单一坐标真源，渲染器与判定器共用）
export function getArchGeom(state) {
  const shift = parallaxShift(4.8, state.camX);
  const cx = state.archX + shift;
  const w = 0.375;
  const left = cx - w / 2;
  const right = cx + w / 2;
  const top = 0.245;
  const bottom = 0.79;
  const openW = 0.195;
  const openLeft = cx - openW / 2;
  const openRight = cx + openW / 2;
  const openSpringY = 0.455; // 半圆拱起拱高度
  const openRadius = openW / 2;
  const openTop = openSpringY - openRadius;
  return { cx, w, left, right, top, bottom, openW, openLeft, openRight, openSpringY, openRadius, openTop };
}

// 焦点主体几何（海报球体 / 片场人物剪影共用中心与有效包围半径）
export function getSubjectGeom(state) {
  const shift = parallaxShift(6.6, state.camX);
  const cx = state.subX + shift;
  const cy = 0.545;
  const r = 0.062;
  return { cx, cy, r, pedestalTop: cy + r - 0.005 };
}

// 极前景棕榈暗叶由 7 片呈扇形辐射的叶片组成，几何点采样与绘制共用同一参数表
export const PALM_FRONDS = [
  { angle: -2.42, len: 0.24, width: 0.036, curve: -0.04 },
  { angle: -2.06, len: 0.30, width: 0.040, curve: -0.025 },
  { angle: -1.72, len: 0.33, width: 0.042, curve: -0.01 },
  { angle: -1.36, len: 0.31, width: 0.040, curve: 0.015 },
  { angle: -1.02, len: 0.27, width: 0.036, curve: 0.03 },
  { angle: -0.66, len: 0.22, width: 0.030, curve: 0.04 },
  { angle: -2.76, len: 0.19, width: 0.028, curve: -0.035 },
];

export function getPalmAnchor(state) {
  const shift = parallaxShift(1.1, state.camX);
  return { x: state.palmX + shift, y: state.palmY };
}

// 精确判断归一化坐标 (nx, ny) 是否落在 L1 棕榈暗叶投影内（纵横比 16:10 修正）
export function pointInPalm(nx, ny, state, aspect = 1.6) {
  const anchor = getPalmAnchor(state);
  const dx = (nx - anchor.x) * aspect;
  const dy = ny - anchor.y;
  const dist2 = dx * dx + dy * dy;
  if (dist2 > 0.38 * 0.38) return false;
  if (dist2 < 0.035 * 0.035) return true;
  for (let i = 0; i < PALM_FRONDS.length; i++) {
    const f = PALM_FRONDS[i];
    const ca = Math.cos(f.angle);
    const sa = Math.sin(f.angle);
    // 沿叶脉投影 u ∈ [0, len]，垂直叶脉距离 v
    const u = dx * ca + dy * sa;
    if (u < 0 || u > f.len) continue;
    const t = u / f.len;
    const vRaw = -dx * sa + dy * ca;
    const bend = f.curve * t * t * f.len * 3.0;
    const halfW = f.width * Math.sin(Math.PI * Math.pow(t, 0.72)) * (1 - 0.12 * t);
    if (Math.abs(vRaw - bend) <= halfW) return true;
  }
  return false;
}

// 判断点是否在 L3 陶红拱门实墙内（排除中央拱洞）
export function pointInArchSolid(nx, ny, arch, aspect = 1.6) {
  if (nx < arch.left || nx > arch.right || ny < arch.top || ny > arch.bottom) return false;
  // 拱洞内部挖空检查
  if (nx > arch.openLeft && nx < arch.openRight) {
    if (ny >= arch.openSpringY) return false;
    const dx = (nx - arch.cx) * aspect;
    const dy = ny - arch.openSpringY;
    const rx = arch.openRadius * aspect;
    const ry = arch.openRadius * 1.15;
    if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) < 1) return false;
  }
  return true;
}

// 预计算焦点圆内 49 个均匀采样偏移（确定性、零随机抖动）
const DISC_SAMPLES = (() => {
  const pts = [];
  for (let ix = -3; ix <= 3; ix++) {
    for (let iy = -3; iy <= 3; iy++) {
      const ux = ix / 3.4;
      const uy = iy / 3.4;
      if (ux * ux + uy * uy <= 0.96) pts.push([ux, uy]);
    }
  }
  return pts;
})();

// 单一真源评测函数：所有读数、验收灯、画布警示线与白话诊断全由此产出
export function evaluateState(state, aspect = 1.6) {
  const arch = getArchGeom(state);
  const sub = getSubjectGeom(state);
  const palm = getPalmAnchor(state);

  // 1. 实测焦点主体被 L1 / L2 / L3 遮挡的精确百分比
  let nPalm = 0;
  let nWall = 0;
  let nArch = 0;
  let nAny = 0;
  const rx = sub.r / aspect; // 圆在归一化宽上的半径
  const ry = sub.r;
  for (let i = 0; i < DISC_SAMPLES.length; i++) {
    const [ux, uy] = DISC_SAMPLES[i];
    const px = sub.cx + ux * rx;
    const py = sub.cy + uy * ry;
    const hitPalm = pointInPalm(px, py, state, aspect);
    const hitWall = py >= wallTopYAt(px, state.wallX, state.wallY, state.camX);
    const hitArch = pointInArchSolid(px, py, arch, aspect);
    if (hitPalm) nPalm++;
    if (hitWall) nWall++;
    if (hitArch) nArch++;
    if (hitPalm || hitWall || hitArch) nAny++;
  }
  const totalSubPts = DISC_SAMPLES.length;
  const palmBlockPct = Math.round((nPalm / totalSubPts) * 100);
  const wallBlockPct = Math.round((nWall / totalSubPts) * 100);
  const archBlockPct = Math.round((nArch / totalSubPts) * 100);
  const subjectOcclusionPct = Math.round((nAny / totalSubPts) * 100);

  // 2. 实测前景总占地与 L1∩L2、L2∩L3 真实叠压面积（28×18 均匀网格）
  const GX = 28;
  const GY = 18;
  let fgCells = 0;
  let palmCells = 0;
  let wallCells = 0;
  let palmOnWallCells = 0;
  let wallOnArchCells = 0;
  let archCells = 0;
  for (let ix = 0; ix < GX; ix++) {
    const nx = (ix + 0.5) / GX;
    const wy = wallTopYAt(nx, state.wallX, state.wallY, state.camX);
    for (let iy = 0; iy < GY; iy++) {
      const ny = (iy + 0.5) / GY;
      const inWall = ny >= wy;
      const inPalm = pointInPalm(nx, ny, state, aspect);
      const inArch = pointInArchSolid(nx, ny, arch, aspect);
      if (inWall || inPalm) fgCells++;
      if (inPalm) palmCells++;
      if (inWall) wallCells++;
      if (inPalm && inWall) palmOnWallCells++;
      if (inArch) archCells++;
      if (inWall && inArch) wallOnArchCells++;
    }
  }
  const totalCells = GX * GY;
  const fgCoveragePct = Math.round((fgCells / totalCells) * 100);
  const palmAreaPct = +((palmCells / totalCells) * 100).toFixed(1);
  const wallAreaPct = Math.round((wallCells / totalCells) * 100);
  const palmWallOverlapPct = palmCells > 0 ? Math.round((palmOnWallCells / palmCells) * 100) : 0;
  const wallArchOverlapPct = archCells > 0 ? Math.round((wallOnArchCells / archCells) * 100) : 0;

  // 3. 中层拱门画内框与切边相切实测
  const subLeft = sub.cx - rx;
  const subRight = sub.cx + rx;
  const leftClear = subLeft - arch.openLeft;
  const rightClear = arch.openRight - subRight;
  const minInnerClear = Math.min(leftClear, rightClear);
  const inOpening = sub.cx > arch.openLeft && sub.cx < arch.openRight;
  const nearOuterLeft = Math.abs(subRight - arch.left) < 0.025 || Math.abs(subLeft - arch.left) < 0.025;
  const nearOuterRight = Math.abs(subLeft - arch.right) < 0.025 || Math.abs(subRight - arch.right) < 0.025;
  const nearInnerJamb = inOpening && minInnerClear < 0.018 && minInnerClear > -0.025;
  const tangentClash = nearInnerJamb || (!inOpening && (nearOuterLeft || nearOuterRight));
  const jambMarginPct = Math.round(minInnerClear * 1000) / 10; // 百分比（可为负，表示被门柱咬住）

  // 4. 叠压链与对焦状态
  const palmPresent = palmAreaPct >= 3.2;
  const wallPresent = wallAreaPct >= 10;
  const link12 = palmPresent && wallPresent && palmWallOverlapPct >= 14;
  const link23 = wallPresent && wallArchOverlapPct >= 5;
  const overlapLinks = (link12 ? 1 : 0) + (link23 ? 1 : 0) + (inOpening && minInnerClear >= 0.018 ? 1 : 0);

  const focusOnSubject = state.focus === "L4" || state.focus === "deep";
  const subjectBlur = layerBlurPx(6.6, state.focus);
  const palmBlur = layerBlurPx(1.1, state.focus);

  // 5. 四项原海报验收准则（与原海报四标注 1:1 同源）
  const passForeground = palmPresent && fgCoveragePct >= 18 && fgCoveragePct <= 54 && subjectOcclusionPct <= 5;
  const passOverlap = inOpening && minInnerClear >= 0.018 && archBlockPct <= 3 && !tangentClash;
  const passDepth = link12 && link23 && wallAreaPct >= 12 && wallAreaPct <= 48;
  const passEmphasis = focusOnSubject && subjectOcclusionPct <= 5 && inOpening;

  const score = [passForeground, passOverlap, passDepth, passEmphasis].filter(Boolean).length;

  // 6. 诊断优先级（总是讲清「为什么」与下一步具体动作）
  let code = "ok";
  let badge = "四层成立 · 4 / 4";
  let headline = "前景遮挡、中层拱框与深处焦点完整成立";
  let reason =
    "极前景棕榈暗叶压稳底角并叠压深松阶墙，阶墙斜切咬住陶红拱门底座，形成清晰的前→中→深三段单眼叠压链；拱门居中框住清晰无遮挡的焦点，视线自然穿层直抵深处。";
  let nextHint = "左右拖动下方「机位视差滑轨」，感受五层景片近快远慢的真实空间视差，或切到「片场走廊」验看人物镜头。";

  if (palmBlockPct >= 6 || wallBlockPct >= 6) {
    code = "fg-block";
    badge = `错态 · 前景挡死焦点 (${score}/4)`;
    const culprit = palmBlockPct >= wallBlockPct ? "L1 棕榈暗叶" : "L2 深松阶墙";
    headline = `${culprit}遮住了焦点 ${Math.max(palmBlockPct, wallBlockPct)}% 的面积`;
    reason = `当前前景层直接跨过深处焦点轮廓（总遮挡 ${subjectOcclusionPct}%）。多层前景的职责是搭出空间门槛与引导边缘，一旦盖住核心主体，遮挡就从「纵深线索」沦为「挡镜头失误」。`;
    nextHint =
      palmBlockPct >= wallBlockPct
        ? "在画布里把「L1 棕榈暗叶」向下或向侧边拖离拱洞中央，同时让叶基继续压在深松阶墙上。"
        : "把「L2 深松阶墙」略微下压，露出完整拱洞与焦点主体。";
  } else if (fgCoveragePct > 54) {
    code = "fg-suffocate";
    badge = `错态 · 前景过满窒息 (${score}/4)`;
    headline = `暗前景吞掉了 ${fgCoveragePct}% 的画幅，画面发闷`;
    reason =
      "前景占比超过约 54%（经验上限）时，观者不再感到「透过前景看景深」，而像被堵在狭缝里偷窥，中层拱门与空气留白被过度挤压。";
    nextHint = "把「L2 深松阶墙」向下拉回 22%–46% 占比区间，留出透气的天幕与拱门立面。";
  } else if (!inOpening || archBlockPct > 3 || tangentClash) {
    code = !inOpening ? "arch-miss" : "arch-tangent";
    const parallaxHint = Math.abs(state.camX) > 0.25 ? "（机位横移后已发生视差撞框）" : "";
    badge = `错态 · ${!inOpening ? "中框跑偏" : "切边相切"} (${score}/4)`;
    headline = !inOpening
      ? `焦点落在了陶红拱门洞外${parallaxHint}`
      : `门柱边缘紧贴焦点相切，深度瞬间粘连${parallaxHint}`;
    reason = !inOpening
      ? "中层拱门没有把焦点收进画内框（aperture），反而把主体甩在框外或被实心门墙切掉，中层框架的汇聚作用完全失效。"
      : `当前焦点距门柱内缘净隙仅 ${jambMarginPct.toFixed(1)}%。当近处门柱与远处主体轮廓相切时，大脑会把两个不同景深面粘合在同一个平面上，纵深感瞬间坍塌。`;
    nextHint = "拖动「L3 陶红拱门」或「L4 阶台焦点」，让主体稳居中轴并给左右门柱各留 ≥ 2.5% 呼吸余量。";
  } else if (!palmPresent || !wallPresent || !link12 || !link23) {
    code = "chain-broken";
    badge = `错态 · 景层断链 (${score}/4)`;
    const brokenWhere = !palmPresent
      ? "极前景 L1 棕榈暗叶已经退出画框"
      : !wallPresent
        ? "近前景 L2 深松阶墙高度不足"
        : !link23
          ? "L2 深松阶墙没有叠压到 L3 陶红拱门底座"
          : "L1 棕榈暗叶与 L2 深松阶墙彼此分离，没有形成叠压交界";
    headline = `${brokenWhere}，纵深叠压链断开了`;
    reason =
      "单眼叠压（interposition）靠的是前层轮廓打断后层轮廓。如果景片之间各漂各的、互不交叠，人眼就无法确定前后顺序，画面会退化成几张贴纸。";
    nextHint = !link23
      ? "选中「L2 深松阶墙」向上抬升至画面中下段，让阶墙斜切叠压住陶红拱门左下方。"
      : "把「L1 棕榈暗叶」移回深松阶墙前沿，使叶片与阶墙产生清晰的前后交叠。";
  } else if (!focusOnSubject) {
    code = "focus-wrong";
    badge = `错态 · 对焦错落前景 (${score}/4)`;
    headline = `镜头焦点锁在了 ${state.focus === "L1" ? "L1 前景叶" : "L3 拱门框"}，主体反而发虚`;
    reason = `当前焦点层离焦虚化（示意模糊 ${subjectBlur.toFixed(1)}px），而前景叶片锐利抢戏。多层前景必须甘当配角——前景越抢细节，眼睛越难穿过前景抵达深处焦点。`;
    nextHint = "点击右侧「对焦 L4 焦点层」（或「全景深 f/11」），让前景适度柔和、深处焦点清晰锐利。";
  }

  return {
    arch,
    sub,
    palm,
    palmBlockPct,
    wallBlockPct,
    archBlockPct,
    subjectOcclusionPct,
    fgCoveragePct,
    palmAreaPct,
    wallAreaPct,
    palmWallOverlapPct,
    wallArchOverlapPct,
    jambMarginPct,
    inOpening,
    tangentClash,
    link12,
    link23,
    overlapLinks,
    focusOnSubject,
    subjectBlur,
    palmBlur,
    checks: {
      foreground: passForeground,
      overlap: passOverlap,
      depth: passDepth,
      emphasis: passEmphasis,
    },
    score,
    code,
    badge,
    headline,
    reason,
    nextHint,
  };
}

// ---------- 第 03 节：四种中层框架模式数据 ----------
export const APERTURE_MODES = {
  arch: {
    id: "arch",
    name: "拱门居中框",
    en: "CENTERED ARCH",
    openPct: 36,
    tangent: false,
    mood: "庄重聚焦 · 通道感强",
    desc: "圆拱天然把四角压暗收拢，留出约三成半的明亮洞口，视线像顺着隧道自然落到中央主体上，既稳重又不压抑。",
  },
  doorway: {
    id: "doorway",
    name: "暗门框阈值",
    en: "DOORWAY THRESHOLD",
    openPct: 24,
    tangent: false,
    mood: "内外阻隔 · 窥视孤立",
    desc: "约翰·福特《搜索者》式的黑门框压缩洞口至四分之一左右，极暗前景把观者留在室内阴影中，强烈划分出「屋内」与「屋外」两个心理世界。",
  },
  double: {
    id: "double",
    name: "双层连廊框",
    en: "NESTED CORRIDOR",
    openPct: 28,
    tangent: false,
    mood: "纵深加速 · 步步深入",
    desc: "连续两道一近一远的框架套叠，近框大且深暗、远框小且明朗，透视收缩率翻倍，常用于长镜头揭示纵深空间。",
  },
  tangent: {
    id: "tangent",
    name: "切边相切反例",
    en: "TANGENT CLASH",
    openPct: 36,
    tangent: true,
    mood: "平面粘连 · 深度崩塌",
    desc: "框架位置稍微偏移，近处门柱刚好贴死远处主体的肩线或边缘。这个微小的「切边相切」会欺骗大脑把两层合并成同一平面，前功尽弃。",
  },
};

// ---------- 第 04 节：历史演进四里程碑（全部已上网核实） ----------
export const HISTORY_ERAS = [
  {
    id: "vermeer",
    year: "c. 1666–1668",
    title: "维米尔与荷兰压角法",
    en: "REPOUSSOIR CURTAIN",
    source: "维米尔《绘画艺术》（维也纳艺术史博物馆藏）",
    desc: "17 世纪荷兰画派广泛运用法语所称的「压角法（repoussoir，意为向后推）」。维米尔在画面极左前景拉开一道沉重深暗的织锦帷幕，瞬间将观者挡在画室门外，把中景背坐的画家与沐浴光线的模特推向深处。",
  },
  {
    id: "disney",
    year: "1937",
    title: "迪士尼垂直多平面摄影机",
    en: "MULTIPLANE CAMERA",
    source: "威廉·加里蒂研制，首试于《老磨坊》（1937）",
    desc: "为了打破手绘赛璐珞动画的扁平感，迪士尼技师威廉·加里蒂建造了高达数米的垂直多平面摄影机，将手绘玻璃景片分成多达七层悬在镜头下。镜头下推时，近处树叶急掠、远处磨坊缓移，首次在动画中实现物理级多层前景遮挡与视差。",
  },
  {
    id: "ford",
    year: "1956",
    title: "约翰·福特的门框门槛",
    en: "DOORWAY THRESHOLD",
    source: "约翰·福特《搜索者》（1956）开场与收尾镜头",
    desc: "开场木门向明亮荒原推开，终场木门缓缓合上，将独行者伊桑永远隔在门廊之外。福特用极暗的室内墙体作第一层前景、门框作中层框架，让多层前景不再只是好看的装饰，而直接化作人物归属与隔绝的叙事边界。",
  },
  {
    id: "theory",
    year: "1950–2005",
    title: "单眼叠压与孔径构图理论",
    en: "INTERPOSITION & APERTURE",
    source: "吉布森（1950）/ 布洛克（2001）/ 波德维尔（2005）",
    desc: "心理学家吉布森在《视觉世界的知觉》（1950）剖析叠压（interposition）与动态遮挡线索；布鲁斯·布洛克在《视觉故事》（2001）将重叠平面列为建立深空间的首要工具；波德维尔则在《光影轨迹》（2005）归纳了费雅德、沟口健二与侯孝贤等导演通过门窗孔径（aperture framing）组织多层前景的精微调度。",
  },
];

// ---------- 第 05 节：同小类五种调度法对比 ----------
export const SIBLING_STAGING = {
  310: {
    id: "310",
    name: "310 深度调度",
    en: "DEPTH STAGING",
    focus: "沿镜头纵深 Z 轴把人物与戏剧动作铺到前、中、后三层，一镜并置多方关系。",
    diff: "重点在「全场人物分置前中后」；本页 314 则专注「主体之前叠多层前景框与遮挡」。",
    url: "https://layout.xiaoxiaodong.ai/310/play/",
  },
  311: {
    id: "311",
    name: "311 平面调度",
    en: "PLANAR ARRANGEMENT",
    focus: "镜头垂直正对立面、主动压平透视，靠二维图形的对齐、平衡与疏密节奏建立秩序。",
    diff: "311 刻意抹平纵深追求建筑平面感；314 恰好相反，用叠压前景拼命撑开纵深层次。",
    url: "https://layout.xiaoxiaodong.ai/311/play/",
  },
  312: {
    id: "312",
    name: "312 三角调度",
    en: "TRIANGULAR ARRANGEMENT",
    focus: "借三点高低错落与收敛斜线把视觉重量收束至稳定顶点，明确主次层级。",
    diff: "312 靠几何外轮廓的稳定三角汇聚；314 靠前后多层叠压与中层洞口穿透引导。",
    url: "https://layout.xiaoxiaodong.ai/312/play/",
  },
  313: {
    id: "313",
    name: "313 横向调度",
    en: "HORIZONTAL ARRANGEMENT",
    focus: "以宽银幕水平地平轴串联人物或元素，靠横向展幅与呼吸间距引导视线左右流动。",
    diff: "313 沿 X 轴横向铺展视野；314 沿 Z 轴层层叠加前景向纵深钻入焦点。",
    url: "https://layout.xiaoxiaodong.ai/313/play/",
  },
  314: {
    id: "314",
    name: "314 多层前景调度（本页）",
    en: "MULTI-LAYER FOREGROUND",
    focus: "在镜头与核心主体之间叠置多层前景遮挡物与中层框架，用明度、虚实和视差锁住深处焦点。",
    diff: "前层暗遮挡 + 中层画内框 + 深层清晰焦点三者缺一不可。",
    url: null,
  },
};

// ---------- 第 07 节：小练习四选一数据（只差一个构图变量，选项名绝不剧透） ----------
export const QUIZ_OPTIONS = {
  A: {
    correct: false,
    title: "选 A：前景暗叶盖住了人物头肩",
    detail:
      "这一帧的四层顺序、拱门居中与明度阶梯都在线，但唯一破绽是 L1 棕榈暗叶伸得太高，直接横切过人物剪影的头肩部——前景抢了主体的戏，视线被枝叶拦在门外。",
  },
  B: {
    correct: false,
    title: "选 B：三层景片各自飘浮、缺少叠压链",
    detail:
      "人物没有被遮挡、拱门也端正，但唯一破绽是前景叶、深松墙与陶红拱门彼此完全错开，没有任何前后交叠边。缺少单眼叠压线索，空间纵深立刻变平，像三块互不相关的贴纸。",
  },
  C: {
    correct: true,
    title: "选 C（正确）：四层叠压链完整、中框呼吸稳、焦点无阻",
    detail:
      "极前景暗叶轻压左下并叠压深松阶墙，深松阶墙斜切咬住陶红拱门底座，建立起连续的 A→B→C 前后遮挡；拱门以均衡余量框住清晰明亮的人物剪影，明度由暗渐亮、焦点毫无遮挡。",
  },
  D: {
    correct: false,
    title: "选 D：中层拱门右偏，门柱内缘与人物切边相切",
    detail:
      "前景叠压与明度阶梯都和 C 一样稳妥，但唯一破绽是中层拱门偏右，右侧门柱刚好紧贴人物右肩形成切边相切——近处门框与远处人物瞬间粘在同一平面，纵深被破坏。",
  },
};

// 046 矩形构图 — 单一真源几何与诊断模型
// 所有画布坐标、面积占比、四柱状态、迷你徽章与白话诊单全部由 computeLayout + evaluate 算出，不写死常量。

export const PALETTE = {
  paper: "#F7F3ED",
  paperBright: "#FCFBF8",
  parchment: "#F0EAE3",
  stone: "#ECE4D9",
  hairline: "#D6CEC3",
  ink: "#252A36",
  inkSoft: "#4D5564",
  frame: "#1C1C1C",
  slate: "#31434F",
  slateDark: "#1E262E",
  slatePanel: "#27323C",
  red: "#D35443",
  redFill: "#C44332",
  redAccent: "#DE644F",
  redText: "#B03222",
  redDarkBright: "#FF8773",
  ok: "#1B6652",
  okDark: "#73D6B8",
  err: "#B2281D",
  errDark: "#FF8275",
  sky: "#C3CDD3",
  wallShadow: "#591C15",
  wallLit: "#E86A50",
  steps: "#545A5F",
  dot: "#CFC7BE",
};

// 原海报 046.webp (1086×1448) 中央「红墙行者」实景照片的精确净裁区域
export const POSTER_PHOTO_CROP = { sx: 373, sy: 482, sw: 420, sh: 288 };

export const SPECIMENS = [
  {
    id: "poster",
    label: "原海报·红墙行者",
    shortLabel: "原海报",
    focusTitle: "视觉焦点",
    focusBody: "在矩形范围内突出主题元素，形成明确的视觉重心。",
    supportTitle: "信息支撑",
    supportBody: "利用矩形区域承载辅助信息，平衡画面节奏。",
    guideTitle: "引导视线",
    guideBody: "借助矩形的横向或纵向延展性，引导视线自然移动，增强画面的流动感与方向感。",
    sceneTag: "ARCHITECTURAL FRAME",
  },
  {
    id: "magazine",
    label: "建筑特刊跨页",
    shortLabel: "建筑特刊",
    focusTitle: "红砖光影",
    focusBody: "以高饱和色块锁住入画第一眼，为整页定下清晰标题锚点。",
    supportTitle: "策展索引",
    supportBody: "2026 秋季特展 · 展厅 03 · 每日 10:00–18:00 开放。",
    guideTitle: "动线导览",
    guideBody: "沿着长轴展廊向右侧索引推进，读者在跨页间自然完成由图入文的阅读。",
    sceneTag: "EDITORIAL SPREAD",
  },
  {
    id: "cinema",
    label: "宽银幕分镜",
    shortLabel: "宽银幕",
    focusTitle: "场次 04",
    focusBody: "长焦定格红墙阶梯，用明确画框切出人物前行的空间余量。",
    supportTitle: "镜头备注",
    supportBody: "2.35:1 变形宽银幕 · 固定机位 · 行人由左向右穿过影线。",
    guideTitle: "运动矢量",
    guideBody: "画面向右留出开阔前行通道，横向矩形本身放大了行进中的时间感。",
    sceneTag: "WIDE CINEMA FRAME",
  },
  {
    id: "brand",
    label: "器物品牌展陈",
    shortLabel: "品牌展陈",
    focusTitle: "新作发布",
    focusBody: "红陶釉面器物与几何底座互为边界，主体在稳重框线里立刻跳脱。",
    supportTitle: "材质参数",
    supportBody: "高温粗陶 · 雾面铁釉 · 高度 240mm · 限量编号发行。",
    guideTitle: "浏览路径",
    guideBody: "底部参数条横向贯通，引导目光从主器物自然过渡到右侧规格卡片。",
    sceneTag: "BRAND DISPLAY",
  },
];

// 开场默认：刻意停在 0/4 复合错态（绝不先给答案）
export const INITIAL_STATE = {
  specimen: "poster",
  aspect: 1.08,     // 暧昧近方，既非 1:1 亦未拉出方向延展
  x1: 0.36,         // 内部隔断接近平分
  x2: 0.69,
  y1: 0.55,
  gutter: 0,        // 0px 铁笼贴死（有框而拘）
  borderOn: true,
  flowDir: "reversed", // 叙事逆流
  showGuides: true,
  selectedZone: null,
};

export const PRESETS = {
  poster_classic: {
    label: "原海报横幅解",
    kind: "good",
    patch: { aspect: 2.07, x1: 0.285, x2: 0.81, y1: 0.765, gutter: 12, borderOn: true, flowDir: "forward" },
  },
  cinema_wide: {
    label: "宽银幕长卷解",
    kind: "good",
    patch: { aspect: 2.35, x1: 0.22, x2: 0.83, y1: 0.80, gutter: 10, borderOn: true, flowDir: "forward" },
  },
  editorial_spread: {
    label: "跨页平衡解",
    kind: "good",
    patch: { aspect: 1.50, x1: 0.32, x2: 0.82, y1: 0.76, gutter: 14, borderOn: true, flowDir: "forward" },
  },
  vertical_poster: {
    label: "竖向画报解",
    kind: "good",
    patch: { aspect: 0.72, x1: 0.56, x2: 0.84, y1: 0.56, gutter: 12, borderOn: true, flowDir: "forward" },
  },
  err_cage: {
    label: "试错：铁笼贴死",
    kind: "bad",
    patch: { aspect: 2.00, x1: 0.28, x2: 0.81, y1: 0.76, gutter: 0, borderOn: true, flowDir: "forward" },
  },
  err_scatter: {
    label: "试错：无框散架",
    kind: "bad",
    patch: { aspect: 2.00, x1: 0.28, x2: 0.81, y1: 0.76, gutter: 34, borderOn: false, flowDir: "forward" },
  },
  err_even: {
    label: "试错：均分死表",
    kind: "bad",
    patch: { aspect: 1.95, x1: 0.36, x2: 0.71, y1: 0.54, gutter: 12, borderOn: true, flowDir: "forward" },
  },
  err_sliver: {
    label: "试错：极扁裂缝",
    kind: "bad",
    patch: { aspect: 2.82, x1: 0.26, x2: 0.82, y1: 0.74, gutter: 10, borderOn: true, flowDir: "forward" },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function normalizeState(raw) {
  const s = { ...INITIAL_STATE, ...raw };
  s.aspect = clamp(Number(s.aspect) || 1.08, 0.50, 2.88);
  s.gutter = clamp(Math.round(Number(s.gutter) || 0), 0, 38);
  s.borderOn = Boolean(s.borderOn);
  s.flowDir = s.flowDir === "reversed" ? "reversed" : "forward";
  s.showGuides = Boolean(s.showGuides);

  const vertical = s.aspect < 0.88;
  if (!vertical) {
    s.x2 = clamp(Number(s.x2) || 0.81, 0.52, 0.90);
    s.x1 = clamp(Number(s.x1) || 0.285, 0.14, s.x2 - 0.14);
    s.y1 = clamp(Number(s.y1) || 0.765, 0.42, 0.88);
  } else {
    s.y1 = clamp(Number(s.y1) || 0.56, 0.26, 0.72);
    s.x1 = clamp(Number(s.x1) || 0.56, 0.26, 0.76);
    s.x2 = clamp(Number(s.x2) || 0.84, Math.max(s.y1 + 0.14, 0.66), 0.92);
  }
  return s;
}

/**
 * 在给定画布像素区域 (canvasW, canvasH) 内，算出：
 * - 外框矩形 frame { x, y, w, h }
 * - 四个子矩形 zones: { focus, scene, support, guide }
 * - 三条可拖隔断刃 rails: { x1, x2, y1 }
 * - 外围左右底标尺锚点
 */
export function computeLayout(rawState, canvasW, canvasH) {
  const s = normalizeState(rawState);
  const vertical = s.aspect < 0.88;

  // 为左侧纵向标尺、右侧信息分区引注、底部横向标尺留出整洁画廊边槽
  const padL = clamp(canvasW * 0.082, 40, 88);
  const padR = clamp(canvasW * 0.082, 36, 86);
  const padT = clamp(canvasH * 0.055, 16, 28);
  const padB = clamp(canvasH * 0.115, 36, 52);

  const availW = Math.max(120, canvasW - padL - padR);
  const availH = Math.max(120, canvasH - padT - padB);

  let fw, fh;
  if (availW / availH > s.aspect) {
    fh = availH;
    fw = fh * s.aspect;
  } else {
    fw = availW;
    fh = fw / s.aspect;
  }
  const fx = padL + (availW - fw) * 0.5;
  const fy = padT + (availH - fh) * 0.5;

  // 按画框尺度等比折算呼吸缝与外框内边距，使 390px 到 1680px 视觉比例统一
  const scaleRef = clamp(Math.min(fw, fh) / 360, 0.55, 1.35);
  const gPx = s.gutter * scaleRef;
  const padPx = s.gutter > 0 ? gPx * 1.05 : 0;

  const ix = fx + padPx;
  const iy = fy + padPx;
  const iw = Math.max(60, fw - padPx * 2);
  const ih = Math.max(60, fh - padPx * 2);

  let zones;
  let rails;

  if (!vertical) {
    // 原海报横幅 / 近方四区正交断裁：
    // 右柱 support 通高；左侧分为上排 (focus | scene) 与底带 (guide)
    const x2Pos = ix + iw * s.x2;
    const leftW = Math.max(30, x2Pos - ix - gPx * 0.5);
    const rightX = x2Pos + gPx * 0.5;
    const rightW = Math.max(24, ix + iw - rightX);

    const x1Pos = ix + iw * s.x1;
    const col1W = Math.max(20, x1Pos - ix - gPx * 0.5);
    const col2X = x1Pos + gPx * 0.5;
    const col2W = Math.max(20, ix + leftW - col2X);

    const y1Pos = iy + ih * s.y1;
    const topH = Math.max(24, y1Pos - iy - gPx * 0.5);
    const botY = y1Pos + gPx * 0.5;
    const botH = Math.max(20, iy + ih - botY);

    // 若叙事逆流（开场错态），把红焦块放到靠右压尾，视觉焦点和暗灰信息柱互挤
    const focusRect = s.flowDir === "reversed"
      ? { x: col2X, y: iy, w: col2W, h: topH }
      : { x: ix, y: iy, w: col1W, h: topH };
    const sceneRect = s.flowDir === "reversed"
      ? { x: ix, y: iy, w: col1W, h: topH }
      : { x: col2X, y: iy, w: col2W, h: topH };

    zones = {
      focus: { id: "focus", ...focusRect },
      scene: { id: "scene", ...sceneRect },
      support: { id: "support", x: rightX, y: iy, w: rightW, h: ih },
      guide: { id: "guide", x: ix, y: botY, w: leftW, h: botH },
    };

    rails = {
      x1: { axis: "x", pos: x1Pos, x1: x1Pos, y1: iy, x2: x1Pos, y2: iy + topH, label: "主断刃" },
      x2: { axis: "x", pos: x2Pos, x1: x2Pos, y1: iy, x2: x2Pos, y2: iy + ih, label: "信息刃" },
      y1: { axis: "y", pos: y1Pos, x1: ix, y1: y1Pos, x2: ix + leftW, y2: y1Pos, label: "导流刃" },
    };
  } else {
    // 竖向画报四区正交断裁：
    // 上方通宽 scene（纵向主景）→ 中部左右分置 focus / support → 底部通宽 guide
    const y1Pos = iy + ih * s.y1;
    const y2Pos = iy + ih * s.x2; // 复用 x2 控件表示下横刃位置
    const x1Pos = ix + iw * s.x1;

    const topH = Math.max(30, y1Pos - iy - gPx * 0.5);
    const midY = y1Pos + gPx * 0.5;
    const midH = Math.max(24, y2Pos - midY - gPx * 0.5);
    const botY = y2Pos + gPx * 0.5;
    const botH = Math.max(20, iy + ih - botY);

    const leftW = Math.max(24, x1Pos - ix - gPx * 0.5);
    const rightX = x1Pos + gPx * 0.5;
    const rightW = Math.max(24, ix + iw - rightX);

    const focusRect = s.flowDir === "reversed"
      ? { x: rightX, y: midY, w: rightW, h: midH }
      : { x: ix, y: midY, w: leftW, h: midH };
    const supportRect = s.flowDir === "reversed"
      ? { x: ix, y: midY, w: leftW, h: midH }
      : { x: rightX, y: midY, w: rightW, h: midH };

    zones = {
      scene: { id: "scene", x: ix, y: iy, w: iw, h: topH },
      focus: { id: "focus", ...focusRect },
      support: { id: "support", ...supportRect },
      guide: { id: "guide", x: ix, y: botY, w: iw, h: botH },
    };

    rails = {
      y1: { axis: "y", pos: y1Pos, x1: ix, y1: y1Pos, x2: ix + iw, y2: y1Pos, label: "主景刃" },
      x1: { axis: "x", pos: x1Pos, x1: x1Pos, y1: midY, x2: x1Pos, y2: midY + midH, label: "焦支刃" },
      x2: { axis: "y", pos: y2Pos, x1: ix, y1: y2Pos, x2: ix + iw, y2: y2Pos, label: "底导刃" },
    };
  }

  // 计算每个子区的实绘面积与占比（占全部四区实绘总面积）
  const totalZoneArea = Object.values(zones).reduce((sum, z) => sum + z.w * z.h, 0);
  const frameArea = fw * fh;
  const breathingRatio = clamp((frameArea - totalZoneArea) / frameArea, 0, 1);

  for (const z of Object.values(zones)) {
    z.area = z.w * z.h;
    z.share = totalZoneArea > 0 ? z.area / totalZoneArea : 0.25;
    z.cx = z.x + z.w * 0.5;
    z.cy = z.y + z.h * 0.5;
  }

  // 实绘视觉重量重心（红焦块 1.35、深灰信息柱 1.15、主图 1.05、导流浅带 0.55）
  const weights = { focus: 1.35, scene: 1.05, support: 1.15, guide: 0.55 };
  let wSum = 0, wx = 0, wy = 0;
  for (const [k, z] of Object.entries(zones)) {
    const wt = z.area * weights[k];
    wSum += wt;
    wx += z.cx * wt;
    wy += z.cy * wt;
  }
  const centroid = {
    x: (wx / wSum - fx) / fw,
    y: (wy / wSum - fy) / fh,
  };
  const centroidDrift = Math.hypot(centroid.x - 0.5, centroid.y - 0.5);

  return {
    state: s,
    vertical,
    frame: { x: fx, y: fy, w: fw, h: fh, ratio: fw / fh },
    inner: { x: ix, y: iy, w: iw, h: ih },
    gPx,
    padPx,
    zones,
    rails,
    breathingRatio,
    centroid,
    centroidDrift,
  };
}

/**
 * 单真源诊断核算：从 computeLayout 的实绘矩形直接判定四柱状态与 8 类双向错态。
 */
export function evaluate(rawState, canvasW = 960, canvasH = 440) {
  const layout = computeLayout(rawState, canvasW, canvasH);
  const { state: s, vertical, frame, zones, breathingRatio, centroidDrift } = layout;

  const shares = [
    { id: "scene", name: "视觉主图", share: zones.scene.share },
    { id: "focus", name: "焦点色块", share: zones.focus.share },
    { id: "support", name: "信息支撑", share: zones.support.share },
    { id: "guide", name: "引导视线", share: zones.guide.share },
  ].sort((a, b) => b.share - a.share);

  const maxZone = shares[0];
  const secondZone = shares[1];
  const minZone = shares[shares.length - 1];
  const domRatio = maxZone.share / Math.max(0.01, secondZone.share);
  const sceneShare = zones.scene.share;
  const focusShare = zones.focus.share;
  const supportShare = zones.support.share;
  const guideShare = zones.guide.share;

  // --- 柱 1：框定 FRAMING（有框而不拘）---
  let framingOk = true;
  let framingTag = `缝 ${s.gutter}px · 稳框`;
  let framingIssue = null;
  if (!s.borderOn) {
    framingOk = false;
    framingTag = "外框缺失";
    framingIssue = {
      code: "NO_FRAME",
      severity: 1,
      short: "外框缺失",
      headline: "外框撤掉后，四个色块漂散成互不相干的碎卡片",
      reason: "矩形构图的第一步是「框定边界」。没有清晰的外框收束，视线不会把四个区域读成一个整体，而是分别跳着看。",
      fixHint: "重新打开外框边界，并把框内呼吸缝收回到 8–20px，让整体立刻聚拢。",
      fixLabel: "恢复外框与呼吸缝",
      fixPatch: { borderOn: true, gutter: clamp(s.gutter, 10, 16) },
    };
  } else if (s.gutter < 5) {
    framingOk = false;
    framingTag = s.gutter === 0 ? "0px 铁笼闷死" : `${s.gutter}px 过挤`;
    framingIssue = {
      code: "CAGE_TIGHT",
      severity: 2,
      short: "有框而拘",
      headline: `框内呼吸缝仅 ${s.gutter}px，色块顶死边框像被关进铁笼`,
      reason: "原海报 TIPS 提醒「有框而不拘」：边界用来收住整体，但色块与色块、色块与外框之间必须留出通透缝隙，否则视觉压力会互相顶撞。",
      fixHint: "把「框内呼吸缝」拉到 8–20px 区间，画面立刻松出画廊呼吸感。",
      fixLabel: "拉开呼吸缝到 12px",
      fixPatch: { gutter: 12, borderOn: true },
    };
  } else if (s.gutter > 26) {
    framingOk = false;
    framingTag = `${s.gutter}px 缝宽散架`;
    framingIssue = {
      code: "GUTTER_WIDE",
      severity: 2,
      short: "缝宽散架",
      headline: `框内缝隙拉到 ${s.gutter}px，内部四区快从画框里散开了`,
      reason: "隔断缝过宽时，留白反客为主把区域切成四座孤岛，原本连贯的视觉框架被拆散。",
      fixHint: "把「框内呼吸缝」收回到 8–20px，重新粘合四个功能区的视觉关系。",
      fixLabel: "收拢呼吸缝至 12px",
      fixPatch: { gutter: 12 },
    };
  }

  // --- 柱 2：延展 EXTENSION（明确长短轴势能）---
  const r = frame.ratio;
  let extensionOk = true;
  let extensionTag = vertical ? `竖轴 ${r.toFixed(2)}:1` : `横轴 ${r.toFixed(2)}:1`;
  let extensionIssue = null;
  if (r >= 0.85 && r <= 1.24) {
    extensionOk = false;
    extensionTag = `暧昧近方 ${r.toFixed(2)}:1`;
    extensionIssue = {
      code: "NEAR_SQUARE",
      severity: 1,
      short: `暧昧方框 ${r.toFixed(2)}:1`,
      headline: `框比停在 ${r.toFixed(2)}:1，既不方正又拉不出延展方向`,
      reason: "045 方形构图靠严格 1:1 锁住静态中立；矩形构图则必须让长短边拉开明确落差（横向 ≥ 1.28:1 或纵向 ≤ 0.82:1），眼睛才会顺着长轴往前流动。",
      fixHint: "把「画幅长宽比」向右拉到 1.45–2.35:1 建立横向叙事，或向左推到 0.65–0.80:1 建立竖向画报。",
      fixLabel: "拉至原海报 2.07:1 横框",
      fixPatch: { aspect: 2.07 },
    };
  } else if (r > 2.60) {
    extensionOk = false;
    extensionTag = `极扁裂缝 ${r.toFixed(2)}:1`;
    extensionIssue = {
      code: "TOO_WIDE",
      severity: 2,
      short: `极扁 ${r.toFixed(2)}:1`,
      headline: `画框被压成 ${r.toFixed(2)}:1 细裂缝，纵向层级被压扁`,
      reason: "长宽比超过 2.60:1 后，上下分区高度缩水，标题、照片和导流带叠在一起喘不过气。",
      fixHint: "把画幅比例收回 1.45–2.40:1 区间，同时保住横向延伸与纵向呼吸。",
      fixLabel: "收回 2.15:1 宽幅",
      fixPatch: { aspect: 2.15 },
    };
  } else if (r < 0.54) {
    extensionOk = false;
    extensionTag = `极瘦狭条 ${r.toFixed(2)}:1`;
    extensionIssue = {
      code: "TOO_TALL",
      severity: 2,
      short: `极瘦 ${r.toFixed(2)}:1`,
      headline: `画框挤成 ${r.toFixed(2)}:1 窄长条，左右并置区被夹断`,
      reason: "画幅过瘦会让内部焦点与辅助列失去横向展开空间，只能退化成单一窄带。",
      fixHint: "把竖框放宽到 0.62–0.82:1（如 3:4 或 1:√2），让竖向构图从容落位。",
      fixLabel: "调回 0.72:1 竖画报",
      fixPatch: { aspect: 0.72 },
    };
  }

  // --- 柱 3：分区 ZONING（不等大主次清晰，且不窒息辅区）---
  let zoningOk = true;
  let zoningTag = `主区 ${Math.round(maxZone.share * 100)}% · ${domRatio.toFixed(2)}×`;
  let zoningIssue = null;
  if (sceneShare < 0.28 || (maxZone.share < 0.36 && domRatio < 1.32)) {
    zoningOk = false;
    zoningTag = sceneShare < 0.28 ? `主图偏小 ${Math.round(sceneShare * 100)}%` : `平权 ${domRatio.toFixed(2)}×`;
    zoningIssue = {
      code: "EVEN_SPLIT",
      severity: 2,
      short: "分区平权",
      headline: `四块面积接近打平（主图仅占 ${Math.round(sceneShare * 100)}%，最大/次大比 ${domRatio.toFixed(2)}×）`,
      reason: "把矩形切得差不多大，画面就像一张无主次的表格：视觉焦点、主图与信息栏互相抢戏，观众不知道第一眼该停在哪儿。",
      fixHint: "左右拖动画布里的竖向隔断刃，把主图区放宽到 36%–60%，拉出清晰的面积落差。",
      fixLabel: "拉出主次错落分区",
      fixPatch: vertical
        ? { y1: 0.56, x1: 0.56, x2: 0.84 }
        : { x1: 0.285, x2: 0.81, y1: 0.765 },
    };
  } else if (maxZone.share > 0.72 || minZone.share < 0.085) {
    zoningOk = false;
    zoningTag = `${minZone.name}仅 ${Math.round(minZone.share * 100)}%`;
    zoningIssue = {
      code: "CRUSHED_ZONE",
      severity: 2,
      short: "辅区窒息",
      headline: `「${minZone.name}」被挤到只剩 ${Math.round(minZone.share * 100)}%，信息承载失效`,
      reason: "矩形分区的目的是「各司其职」。主区过度膨胀会把辅助信息或导流带压成一条细缝，文字根本装不下。",
      fixHint: "往回微调对应隔断刃，让每个功能区至少保住 9% 以上有效面积。",
      fixLabel: "恢复各区易读配比",
      fixPatch: vertical
        ? { y1: 0.56, x1: 0.56, x2: 0.84 }
        : { x1: 0.285, x2: 0.81, y1: 0.765 },
    };
  } else if (domRatio < 1.25) {
    zoningOk = false;
    zoningTag = `落差不足 ${domRatio.toFixed(2)}×`;
    zoningIssue = {
      code: "WEAK_HIERARCHY",
      severity: 3,
      short: "层级偏平",
      headline: `第一大区与第二大区只差 ${domRatio.toFixed(2)} 倍，主次感偏弱`,
      reason: "主区面积至少比次区高出约 1.25 倍以上，一眼扫过去才能立刻分出「主角」与「配角」。",
      fixHint: "拖开隔断刃，把主图区拉大一档，同时收紧辅助信息柱。",
      fixLabel: "拉开主次面积比",
      fixPatch: vertical
        ? { y1: 0.58, x1: 0.56, x2: 0.84 }
        : { x1: 0.27, x2: 0.82, y1: 0.77 },
    };
  }

  // --- 柱 4：叙事 NARRATIVE（视线流向连贯 + 视觉重量平衡）---
  let narrativeOk = true;
  let narrativeTag = vertical ? "自上而下顺流" : "左起右承顺流";
  let narrativeIssue = null;
  if (s.flowDir === "reversed") {
    narrativeOk = false;
    narrativeTag = "动线逆流";
    narrativeIssue = {
      code: "FLOW_REVERSED",
      severity: 1,
      short: "叙事逆流",
      headline: "视觉焦点压在后段、导流箭反向顶回，阅读路径打架",
      reason: "中文阅读和画面中的行者都指向同一前进方向；现在红块焦点压向深灰信息柱、底部虚箭又往回指，视线刚进来就被堵回原点。",
      fixHint: "点击画布里的朱红焦点块（或按「顺转叙事动线」），让焦点起势、主图延展、信息柱稳稳收尾。",
      fixLabel: "顺转叙事动线",
      fixPatch: { flowDir: "forward" },
    };
  } else if (centroidDrift > 0.165) {
    narrativeOk = false;
    narrativeTag = `重心偏 ${Math.round(centroidDrift * 100)}%`;
    narrativeIssue = {
      code: "WEIGHT_DRIFT",
      severity: 3,
      short: "重心偏塌",
      headline: `视觉重量重心偏移画心 ${Math.round(centroidDrift * 100)}%，整张画框一边发沉`,
      reason: "朱红高饱和块与深靛灰块分量最重；当两个重块面积过度悬殊时，矩形一端会往下坠，平稳的叙事节奏被打歪。",
      fixHint: "适当平衡左侧朱红焦块与右侧深靛灰信息柱的宽度，把重心拉回画心附近。",
      fixLabel: "微调左右分量平衡",
      fixPatch: vertical
        ? { x1: 0.56, y1: 0.56, x2: 0.84 }
        : { x1: 0.285, x2: 0.81, y1: 0.765 },
    };
  }

  const pillars = [
    { id: "framing", zh: "框定", en: "FRAMING", ok: framingOk, tag: framingTag },
    { id: "extension", zh: "延展", en: "EXTENSION", ok: extensionOk, tag: extensionTag },
    { id: "zoning", zh: "分区", en: "ZONING", ok: zoningOk, tag: zoningTag },
    { id: "narrative", zh: "叙事", en: "NARRATIVE", ok: narrativeOk, tag: narrativeTag },
  ];

  const passCount = pillars.filter((p) => p.ok).length;
  const issues = [extensionIssue, framingIssue, zoningIssue, narrativeIssue].filter(Boolean);
  issues.sort((a, b) => a.severity - b.severity);

  let diagnosis;
  if (passCount === 4) {
    const modeName = vertical
      ? "竖向纵轴叙事成立"
      : r >= 2.2
        ? "宽银幕横向长卷成立"
        : r >= 1.85
          ? "原海报级横幅构图成立"
          : "非对称跨页平衡成立";
    diagnosis = {
      ok: true,
      badge: `4/4 · ${modeName}`,
      headline: `${modeName}——有框、有势、有主次、有呼吸`,
      reason: `实绘外框 ${r.toFixed(2)}:1 拉出了清晰的${vertical ? "纵向" : "横向"}延展势能，主图占 ${Math.round(sceneShare * 100)}% 领衔全局，焦点（${Math.round(focusShare * 100)}%）与信息支撑（${Math.round(supportShare * 100)}%）层次分明，${s.gutter}px 呼吸缝做到「有框而不拘」。`,
      fixHint: "你可以继续拖拽任意隔断刃、切换竖向 3:4 或试错按钮，感受临界点在哪里崩塌。",
      fixLabel: "换看竖向 3:4 合法解",
      fixPatch: vertical ? PRESETS.poster_classic.patch : PRESETS.vertical_poster.patch,
      statusLevel: vertical ? "纵轴顺流（示意）" : "横轴顺流（示意）",
    };
  } else {
    const primary = issues[0];
    diagnosis = {
      ok: false,
      badge: `${passCount}/4 · ${primary.short}`,
      headline: primary.headline,
      reason: primary.reason,
      fixHint: primary.fixHint,
      fixLabel: primary.fixLabel,
      fixPatch: primary.fixPatch,
      statusLevel: passCount === 0 ? "四重失序（示意）" : passCount <= 2 ? "结构失衡（示意）" : "接近成立（示意）",
    };
  }

  return {
    layout,
    pillars,
    passCount,
    issues,
    diagnosis,
    metrics: {
      aspectText: `${r.toFixed(2)}:1`,
      axisLabel: vertical ? "纵向延展" : r <= 1.24 ? "方向暧昧" : "横向延展",
      domRatioText: `${domRatio.toFixed(2)}×`,
      sceneSharePct: Math.round(sceneShare * 100),
      focusSharePct: Math.round(focusShare * 100),
      supportSharePct: Math.round(supportShare * 100),
      guideSharePct: Math.round(guideShare * 100),
      gutterText: `${s.gutter}px`,
      breathingPct: Math.round(breathingRatio * 100),
      centroidDriftPct: Math.round(centroidDrift * 100),
    },
  };
}

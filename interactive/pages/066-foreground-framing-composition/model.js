// 066 前景框架构图 — 单真源几何与视觉评估模型
// 画布与读数全部读写同一组几何定义（归一化画布坐标 u, v ∈ [0, 1]）。
import { PALETTE, contrastRatio } from "./palette.js";

export const ARCHETYPES = {
  arch: {
    id: "arch",
    label: "拱形框架",
    en: "ARCH",
    note: "圆拱与月洞门向内收拢视线，仪式感与纵深感最强，对应原海报主画面。",
  },
  natural: {
    id: "natural",
    label: "自然框架",
    en: "NATURAL",
    note: "枝叶、花丛或岩壁围出不规则有机框口，氛围松弛自然，最常用于风景与园林。",
  },
  geometric: {
    id: "geometric",
    label: "几何框架",
    en: "GEOMETRIC",
    note: "菱形、矩形窗格等硬朗直线围合，秩序感强，适合现代建筑与平面海报。",
  },
  occlude: {
    id: "occlude",
    label: "遮挡框架",
    en: "OCCLUDE",
    note: "仅靠局部门廊与墙体做半围合遮挡，不画满四边，观感克制、少有摆拍痕迹。",
  },
};

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报月门",
    subjectName: "孤峰与浅粉日轮",
    bgHex: PALETTE.archInner,
    subjectHex: PALETTE.peakMaroon,
  },
  garden: {
    id: "garden",
    label: "苏园漏窗",
    subjectName: "水榭飞檐与石拱桥",
    bgHex: "#F7EDE0",
    subjectHex: "#4A1822",
  },
  corridor: {
    id: "corridor",
    label: "暗室门廊",
    subjectName: "逆光远影与亮窗",
    bgHex: "#FBF1E3",
    subjectHex: "#3C0D17",
  },
};

export const TONE_MODES = {
  busy: {
    id: "busy",
    label: "花纹亮框",
    frameHex: "#F4B8A8",
    noisy: true,
    note: "高反差亮底加高频斜纹装饰，边框比主体更吵。",
  },
  rose: {
    id: "rose",
    label: "纯平玫瑰框",
    frameHex: PALETTE.archCoral,
    noisy: false,
    note: "原海报同款纯平玫瑰珊瑚色，无杂纹干扰，稳稳托出深色山峰。",
  },
  dark: {
    id: "dark",
    label: "深酒红暗框",
    frameHex: PALETTE.pillarBurgundy,
    noisy: false,
    note: "暗室门廊与巴洛克推远法经典做法，压暗前景让亮框口自然吸睛。",
  },
  ghost: {
    id: "ghost",
    label: "透明幽灵框",
    frameHex: PALETTE.ghostFrame,
    noisy: false,
    note: "前景明度与内景几乎融平，失去前后遮挡的层次边界。",
  },
};

// 开场刻意停在 0 / 4 翻车错态
export const ERROR_STATE = {
  archetype: "arch",
  scene: "poster",
  stanceX: -0.34,     // 摄影师偏左，视差导致拱门偏左、右壁狠切山峰
  apertureSize: 0.28, // 窄针孔（开口面积约 15%）
  clutter: true,      // 框内混入杂乱斜枝干扰主体
  toneMode: "busy",   // 高反差花纹亮框反客为主
  showGuides: true,
  highlightPart: null,
};

// 原海报参考解（合法解之一）
export const POSTER_SOLUTION = {
  archetype: "arch",
  scene: "poster",
  stanceX: 0.04,
  apertureSize: 0.64,
  clutter: false,
  toneMode: "rose",
  showGuides: true,
  highlightPart: null,
};

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// 真实近远三层视差位移（以 stanceX ∈ [-0.46, 0.46] 驱动）
export function parallaxLayers(stanceX) {
  return {
    frameShiftX: stanceX * 0.58,   // 近景框架位移最大
    midShiftX: stanceX * 0.18,     // 中景丘陵/水面次之
    subjectShiftX: stanceX * 0.06, // 远景主体位移最小
  };
}

// 计算每种框架在归一化画布上的精确中心与尺寸（供绘制和测算共用）
export function apertureGeometry(state, aspect = 1.18) {
  const { frameShiftX } = parallaxLayers(state.stanceX);
  const s = clamp(state.apertureSize, 0.22, 0.95);
  // 让圆形在任意画幅比例下都按最短边计量，绝不拉成椭圆；同时高开度时能真实撑爆至 >75% 触发「失框」
  const minUnit = aspect >= 1 ? 1 : aspect;
  const cx = 0.52 + frameShiftX;
  const cy = state.archetype === "arch" ? 0.50 : state.archetype === "occlude" ? 0.47 : 0.49;

  if (state.archetype === "arch") {
    const rY = (0.08 + s * 0.56) * minUnit;
    const rX = rY / aspect;
    return { kind: "arch", cx, cy, rX, rY, s, aspect };
  }
  if (state.archetype === "natural") {
    const rY = (0.08 + s * 0.55) * minUnit;
    const rX = rY / aspect;
    return { kind: "natural", cx, cy, rX, rY, s, aspect };
  }
  if (state.archetype === "geometric") {
    const halfY = (0.14 + s * 0.64) * minUnit;
    const halfX = (halfY * 1.02) / aspect;
    return { kind: "geometric", cx, cy, halfX, halfY, s, aspect };
  }
  const w = 0.22 + s * 0.74;
  const h = 0.24 + s * 0.72;
  const left = cx - w * 0.48;
  const right = left + w;
  const top = cy - h * 0.50;
  const bottom = top + h;
  return { kind: "occlude", cx: (left + right) / 2, cy: (top + bottom) / 2, left, right, top, bottom, w, h, s, aspect };
}

// 有符号距离函数：返回 > 0 表示位于框口内部（可见），<= 0 表示被前景遮挡。
// 单位按画布高度归一化，保证各方向尺度一致。
export function signedDistInAperture(u, v, geom) {
  const { aspect } = geom;
  if (geom.kind === "arch") {
    const dx = (u - geom.cx) * aspect;
    const dy = v - geom.cy;
    const dCircle = geom.rY - Math.hypot(dx, dy);
    // 拱门底沿微切平（在圆心下 0.88 rY 处留稳重门槛，贴合原海报圆拱收脚）
    const dFloor = geom.cy + geom.rY * 0.92 - v;
    return Math.min(dCircle, dFloor);
  }
  if (geom.kind === "natural") {
    const dx = (u - geom.cx) * aspect;
    const dy = v - geom.cy;
    const ang = Math.atan2(dy, dx);
    // 与绘制叶冠边缘完全同式的 5 瓣有机波动
    const wobble = 1 + 0.085 * Math.cos(ang * 3 + 0.5) + 0.055 * Math.sin(ang * 5 - 0.8);
    return geom.rY * wobble - Math.hypot(dx, dy);
  }
  if (geom.kind === "geometric") {
    // 菱形：|dx|/halfX_scaled + |dy|/halfY <= 1
    const ax = Math.abs(u - geom.cx) * aspect;
    const ay = Math.abs(v - geom.cy);
    const hx = geom.halfX * aspect;
    const hy = geom.halfY;
    const norm = Math.hypot(hy, hx);
    return (hx * hy - (ax * hy + ay * hx)) / norm;
  }
  // occlude：不对称 L 形半围合 + 右下斜坡建筑遮挡（精确对应 066 原海报第 4 图）
  const dLeft = (u - geom.left) * aspect;
  const dRight = (geom.right - u) * aspect;
  const dTop = v - geom.top;
  const dBottom = geom.bottom - v;
  // 右下角斜切遮挡墙（从下中偏右斜向右中）
  const slopeLine = (geom.right - u) * aspect * 0.52 + (geom.bottom - v) * 0.85 - 0.09 * (1 - geom.s * 0.35);
  return Math.min(dLeft, dRight, dTop, dBottom, slopeLine);
}

// 框内主体的真实几何采样点集（绘制和评测共用同一锚点）
export function subjectBlueprint(state, aspect = 1.18) {
  const { subjectShiftX } = parallaxLayers(state.stanceX);
  const cx = 0.53 + subjectShiftX;

  if (state.scene === "poster") {
    // 原海报核心主体：深酒红三角山峰 + 上方浅粉日轮
    const sun = { u: cx, v: 0.39, rY: 0.072 };
    const peak = {
      tip: { u: cx, v: 0.465 },
      left: { u: cx - 0.145 / aspect, v: 0.625 },
      right: { u: cx + 0.155 / aspect, v: 0.625 },
    };
    const pts = [];
    // 日轮轮廓 12 点
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      pts.push({ u: sun.u + (Math.cos(a) * sun.rY) / aspect, v: sun.v + Math.sin(a) * sun.rY });
    }
    // 山峰三角实心网格 24 点
    for (let row = 0; row <= 4; row++) {
      const t = row / 4;
      const v = peak.tip.v + t * (peak.left.v - peak.tip.v);
      const uL = peak.tip.u + t * (peak.left.u - peak.tip.u);
      const uR = peak.tip.u + t * (peak.right.u - peak.tip.u);
      const cols = Math.max(1, row + 1);
      for (let c = 0; c < cols; c++) {
        const f = cols === 1 ? 0.5 : c / (cols - 1);
        pts.push({ u: uL + f * (uR - uL), v });
      }
    }
    return { cx, cy: 0.505, sun, peak, pts, radiusY: 0.165 };
  }

  if (state.scene === "garden") {
    // 苏园漏窗：中远景六角水榭剪影 + 拱桥倒影 + 浅月
    const moon = { u: cx + 0.055 / aspect, v: 0.36, rY: 0.052 };
    const pavilion = { u: cx - 0.01 / aspect, v: 0.53, w: 0.22 / aspect, h: 0.16 };
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      pts.push({ u: moon.u + (Math.cos(a) * moon.rY) / aspect, v: moon.v + Math.sin(a) * moon.rY });
    }
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        pts.push({
          u: pavilion.u - pavilion.w * 0.45 + (c / 4) * pavilion.w * 0.9,
          v: pavilion.v - pavilion.h * 0.5 + (r / 4) * pavilion.h,
        });
      }
    }
    return { cx, cy: 0.495, moon, pavilion, pts, radiusY: 0.165 };
  }

  // corridor：暗室门廊尽头的亮窗与静立人物背影（无五官纯剪影）
  const windowBox = { u: cx, v: 0.48, w: 0.22 / aspect, h: 0.28 };
  const figure = { u: cx, v: 0.54, w: 0.085 / aspect, h: 0.18 };
  const pts = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 4; c++) {
      pts.push({
        u: figure.u - figure.w * 0.55 + (c / 3) * figure.w * 1.1,
        v: windowBox.v - windowBox.h * 0.38 + (r / 5) * windowBox.h * 0.82,
      });
    }
  }
  return { cx, cy: 0.50, windowBox, figure, pts, radiusY: 0.16 };
}

// 主评估函数：从实绘几何单真源算出所有指标、4 项支柱与白话诊单
export function evaluate(state, aspect = 1.18) {
  const geom = apertureGeometry(state, aspect);
  const subj = subjectBlueprint(state, aspect);
  const tone = TONE_MODES[state.toneMode] || TONE_MODES.rose;
  const sceneMeta = SCENES[state.scene] || SCENES.poster;

  // 1. 实测框口有效开口面积占比与开口真实几何质心（28×22 均匀采样）
  const GX = 28;
  const GY = 22;
  let openHits = 0;
  let sumU = 0;
  let sumV = 0;
  for (let iy = 0; iy < GY; iy++) {
    const v = (iy + 0.5) / GY;
    for (let ix = 0; ix < GX; ix++) {
      const u = (ix + 0.5) / GX;
      if (signedDistInAperture(u, v, geom) > 0) {
        openHits++;
        sumU += u;
        sumV += v;
      }
    }
  }
  const openRatio = openHits / (GX * GY);
  const apertureCentroid = openHits > 0 ? { u: sumU / openHits, v: sumV / openHits } : { u: geom.cx, v: geom.cy };

  // 2. 实测主体被前景框裁切占比 & 最小内缘呼吸净距
  let clippedCount = 0;
  let minDist = Infinity;
  for (const p of subj.pts) {
    const d = signedDistInAperture(p.u, p.v, geom);
    if (d <= 0) clippedCount++;
    if (d < minDist) minDist = d;
  }
  const clipRatio = clippedCount / subj.pts.length;
  const minMargin = minDist; // > 0 为呼吸留白，<= 0 为撞边/裁切

  // 3. 框口质心与主体重心水平/欧氏偏移
  const gazeOffset = Math.hypot((apertureCentroid.u - subj.cx) * aspect, apertureCentroid.v - subj.cy);

  // 4. 前景框与内景明度反差
  const frameBgContrast = contrastRatio(tone.frameHex, sceneMeta.bgHex);
  const subjectBgContrast = contrastRatio(sceneMeta.subjectHex, sceneMeta.bgHex);

  // 5. 四项核心支柱判定（经验参考带）
  const openTooSmall = openRatio < 0.25;
  const openTooLarge = openRatio > 0.69;
  const okFrame = !openTooSmall && !openTooLarge;

  const subjectClipped = clipRatio > 0.05;
  const subjectTangent = !subjectClipped && minMargin < 0.024;
  const okEnclose = !subjectClipped && !subjectTangent && !state.clutter;

  const gazeOffAxis = gazeOffset > 0.145;
  const okGuide = !subjectClipped && !gazeOffAxis && openRatio >= 0.23 && openRatio <= 0.72;

  const frameBusy = tone.noisy;
  const frameGhost = !tone.noisy && frameBgContrast < 1.38;
  const okEmphasis = !frameBusy && !frameGhost && !state.clutter;

  const passedCount = [okFrame, okEnclose, okGuide, okEmphasis].filter(Boolean).length;

  // 6. 按轻重缓急生成白话单真源诊单（先报最致命的视觉失败）
  let code = "ok";
  let badge = "已成框 · 4 / 4";
  let headline = "前景退让成框，视线一眼落到画心";
  let why = `框口占画面 ${Math.round(openRatio * 100)}%，主体完整落入框内且四周留出 ${Math.round(Math.max(0, minMargin) * 100)}% 呼吸缝；${tone.label}无杂纹干扰（与内景反差 ${frameBgContrast.toFixed(1)}:1），让观者自然穿过前景直奔${sceneMeta.subjectName}。`;
  let action = "可以切换底部另外三种「形式示例」或换套远景题材，验证同一道理在不同框架里同样成立。";

  if (subjectClipped) {
    code = "clipped";
    badge = `错态 · 切主 ${Math.round(clipRatio * 100)}%`;
    headline = `前景边框削掉了 ${Math.round(clipRatio * 100)}% 的主体`;
    const dir = subj.cx > apertureCentroid.u ? "向右" : "向左";
    why = openTooSmall
      ? `此时框口只占 ${Math.round(openRatio * 100)}% 且机位偏斜，${ARCHETYPES[state.archetype].label}从「引路窗」变成了「挡路墙」，${sceneMeta.subjectName}被硬生生切掉近半。`
      : `机位偏离了视线通道，近景框架因视差滑到主体一侧，边缘直接切进${sceneMeta.subjectName}，破坏了主体的完整轮廓。`;
    action = openTooSmall
      ? `先在画布上${dir}横拖借视差对准主体，再拉宽「构建框架」框口到 28%–66% 经验带。`
      : `在画布上${dir}轻拖（或按方向键），利用近远视差把${sceneMeta.subjectName}完整送回框口呼吸区。`;
  } else if (openTooSmall) {
    code = "pinhole";
    badge = `错态 · 针孔 ${Math.round(openRatio * 100)}%`;
    headline = `框口仅占 ${Math.round(openRatio * 100)}%，变成井底窥天`;
    why = "前景实体吞掉了四分之三以上的画面，主体虽勉强塞在洞里却毫无喘息余地，压迫感盖过了空间层次。";
    action = "把「运用要点」里的「构建框架」滑杆往右拉阔，让框口面积回到 28%–66% 经验参考带。";
  } else if (openTooLarge) {
    code = "vanished";
    badge = `错态 · 失框 ${Math.round(openRatio * 100)}%`;
    headline = `框口撑到 ${Math.round(openRatio * 100)}%，前景框架已消失`;
    why = "前景被推到画幅最外圈成了一条细边，眼睛感受不到「隔着近景往里看」的遮挡关系，画面退回普通裸景。";
    action = "把「构建框架」滑杆向左收拢至 28%–66%，重新立住可见的前景遮罩体量。";
  } else if (state.clutter) {
    code = "clutter";
    badge = "错态 · 框内杂乱";
    headline = "框口里横插杂枝，挡散了画心留白";
    why = "原海报强调「让框内空间简洁，主体清晰可见，避免干扰」。一旦杂物探进框口，前景和主体粘成一团，框的净化作用当场失效。";
    action = "点「包围主体」里的「清净框内」，撤掉伸入框口的杂枝干扰。";
  } else if (frameBusy) {
    code = "busy";
    badge = "错态 · 前景抢戏";
    headline = "花哨亮纹边框比画心还吵，反客为主";
    why = "前景本该退居幕后当「视觉漏斗」。现在前景铺满高频亮斜纹，对比与纹理密度强过远方主体，观者第一眼反而死盯边框不放。";
    action = "在「强调重点」切到「纯平玫瑰框」或「深酒红暗框」，让前景安静退让。";
  } else if (frameGhost) {
    code = "ghost";
    badge = `错态 · 对比 ${frameBgContrast.toFixed(1)}:1`;
    headline = "前景与内景明度几乎融平，框感苍白";
    why = `当前前景与内景反差只有 ${frameBgContrast.toFixed(1)}:1，人眼分不清哪层在近处、哪层在远处，前景遮罩无法把外围杂讯隔离开。`;
    action = "在「强调重点」切到「纯平玫瑰框」或「深酒红暗框」，拉开前景与框口的层次反差。";
  } else if (subjectTangent) {
    code = "tangent";
    badge = "错态 · 贴边切线";
    headline = "主体紧贴框口内缘，卡出了难受切线";
    why = "主体虽然没被切掉，但边缘和框壁只差不到 2% 净距，视觉上像卡死在门缝里，框内呼吸感荡然无存。";
    action = "微调画布横移机位或略微放宽框口，让主体四周留出 3% 以上的干净留白缝。";
  } else if (gazeOffAxis) {
    code = "offaxis";
    badge = `错态 · 偏移 ${Math.round(gazeOffset * 100)}%`;
    headline = `主体偏离框口导向心 ${Math.round(gazeOffset * 100)}%`;
    why = "前景框的边缘天然会把视线往框口中央汇拢，主体躲在角落边缘会让视线扑空、落点发散。";
    action = "在画布上左右微拖机位，让框口中心与主体重心重新靠拢。";
  }

  // 三枚原海报左栏引注的实时状态标签
  const callouts = {
    frame: {
      ok: okFrame,
      status: openTooSmall
        ? `过窄 ${Math.round(openRatio * 100)}%`
        : openTooLarge
          ? `失框 ${Math.round(openRatio * 100)}%`
          : `开口 ${Math.round(openRatio * 100)}%`,
    },
    enclose: {
      ok: okEnclose,
      status: subjectClipped
        ? `切主 ${Math.round(clipRatio * 100)}%`
        : state.clutter
          ? "框内有杂枝"
          : subjectTangent
            ? "贴边无呼吸"
            : "完整留白",
    },
    guide: {
      ok: okGuide,
      status: subjectClipped
        ? "遮挡断流"
        : gazeOffAxis
          ? `偏心 ${Math.round(gazeOffset * 100)}%`
          : !okFrame
            ? "框口失导"
            : "直指画心",
    },
    emphasis: {
      ok: okEmphasis,
      status: frameBusy
        ? "花框抢戏"
        : frameGhost
          ? `反差 ${frameBgContrast.toFixed(1)}:1`
          : state.clutter
            ? "杂枝夺焦"
            : `${tone.label}退让`,
    },
  };

  return {
    geom,
    subj,
    tone,
    sceneMeta,
    openRatio,
    clipRatio,
    minMargin,
    gazeOffset,
    apertureCentroid,
    frameBgContrast,
    subjectBgContrast,
    pillars: { okFrame, okEnclose, okGuide, okEmphasis },
    passedCount,
    isPass: passedCount === 4,
    code,
    badge,
    headline,
    why,
    action,
    callouts,
  };
}

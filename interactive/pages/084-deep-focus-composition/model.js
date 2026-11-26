// 084 深焦构图 · 光学超焦距、艾里斑衍射与三景空间布景单真源模型
// 全画幅 36×24mm 标准清晰弥散圆基准 c = 0.030 mm，可见光绿光中心波长 λ = 550 nm

export const COC_LIMIT = 0.030;         // 几何弥散圆基准 (mm)
export const SHARP_SIGMA = 0.035;       // 综合模糊斑清晰阈值 (几何 ⊕ 衍射, mm)
export const AIRY_WARN = 0.028;         // 艾里斑衍射显著软化警戒线 (~f/21, mm)
export const WAVELENGTH_MM = 0.00055;   // λ = 550 nm

export const FOCAL_OPTIONS = [20, 24, 28, 35, 50, 85];
export const APERTURE_STOPS = [2.0, 2.8, 4.0, 5.6, 8.0, 11, 14, 16, 22, 32];

// 场景固定三层物距 (m) 与基准包围盒 (归一化 0–1 画幅坐标)
export const SCENES = {
  alpine: {
    id: "alpine",
    name: "原海报·阿尔卑斯谷",
    short: "原海报山谷",
    planes: {
      bg: { label: "远景", en: "BACKGROUND", distM: 120, baseX: 0.64, anchorY: 0.25, w: 0.28, h: 0.24, subject: "雪峰与湖畔教堂" },
      mg: { label: "中景", en: "MIDGROUND", distM: 6.0, baseX: 0.50, anchorY: 0.50, w: 0.34, h: 0.19, subject: "石拱桥与河岸屋舍" },
      fg: { label: "前景", en: "FOREGROUND", distM: 1.5, baseX: 0.50, anchorY: 0.77, w: 0.30, h: 0.34, subject: "木栏杆与野花小径" },
    },
  },
  cinema: {
    id: "cinema",
    name: "电影厅堂·公民凯恩式",
    short: "电影厅堂",
    planes: {
      bg: { label: "远景", en: "BACKGROUND", distM: 45, baseX: 0.56, anchorY: 0.28, w: 0.22, h: 0.24, subject: "雪地窗外孩童剪影" },
      mg: { label: "中景", en: "MIDGROUND", distM: 4.8, baseX: 0.50, anchorY: 0.50, w: 0.28, h: 0.30, subject: "厅中对峙双人剪影" },
      fg: { label: "前景", en: "FOREGROUND", distM: 1.4, baseX: 0.50, anchorY: 0.74, w: 0.29, h: 0.36, subject: "案头契约与铜台灯" },
    },
  },
  garden: {
    id: "garden",
    name: "古典长廊·园林借景",
    short: "园林借景",
    planes: {
      bg: { label: "远景", en: "BACKGROUND", distM: 90, baseX: 0.62, anchorY: 0.25, w: 0.22, h: 0.24, subject: "远山孤塔与云岚" },
      mg: { label: "中景", en: "MIDGROUND", distM: 6.2, baseX: 0.50, anchorY: 0.51, w: 0.32, h: 0.21, subject: "曲桥水榭与垂柳" },
      fg: { label: "前景", en: "FOREGROUND", distM: 1.5, baseX: 0.50, anchorY: 0.76, w: 0.30, h: 0.34, subject: "月洞漏窗与青竹" },
    },
  },
};

// 开场故意停在 1/5 复合错态：50mm + f/2.8 + 误对远景 120m + 前景居中遮挡石桥 + 三层垂直叠车
export const INITIAL_STATE = {
  scene: "alpine",
  viewMode: "unified", // "unified" 合像取景 | "split" 三景剖片
  focalMm: 50,
  aperture: 2.8,
  focusM: 120,
  fgOffset: 0.0,       // [-0.30, +0.30]，0 为居中挡桥
  mgOffset: 0.0,       // [-0.26, +0.26]
  bgOffset: -0.14,     // [-0.24, +0.24]，使开场三层几乎纵轴堆叠
  toneSep: 0.78,       // [0.15, 1.00] 三景明暗冷暖分层力度
  fgEnabled: true,
  activePlane: "fg",   // "bg" | "mg" | "fg"
  showGuides: true,
};

// 多组合法解与典型试错预设（用户还可任意自由拖拽组合出自己的合法解）
export const PRESETS = {
  posterClassic: {
    label: "原海报经典解 24mm f/11",
    kind: "good",
    patch: { focalMm: 24, aperture: 11, focusM: 1.85, fgOffset: -0.25, mgOffset: 0.08, bgOffset: 0.06, toneSep: 0.82, fgEnabled: true },
  },
  wideSFlow: {
    label: "广角 S 径解 28mm f/11",
    kind: "good",
    patch: { focalMm: 28, aperture: 11, focusM: 2.40, fgOffset: 0.24, mgOffset: -0.10, bgOffset: 0.12, toneSep: 0.84, fgEnabled: true },
  },
  cinemaDeep: {
    label: "叙事深焦解 35mm f/14",
    kind: "good",
    patch: { focalMm: 35, aperture: 14, focusM: 2.95, fgOffset: -0.24, mgOffset: 0.11, bgOffset: -0.12, toneSep: 0.78, fgEnabled: true },
  },
  errDiffraction: {
    label: "试错：缩死 f/32 衍射",
    kind: "bad",
    patch: { focalMm: 24, aperture: 32, focusM: 1.20, fgOffset: -0.25, mgOffset: 0.08, bgOffset: 0.06, toneSep: 0.82, fgEnabled: true },
  },
  errFocusInf: {
    label: "试错：误对 ∞ 前景虚",
    kind: "bad",
    patch: { focalMm: 35, aperture: 8, focusM: 120, fgOffset: -0.25, mgOffset: 0.08, bgOffset: 0.06, toneSep: 0.82, fgEnabled: true },
  },
  errClutter: {
    label: "试错：全清却平反差",
    kind: "bad",
    patch: { focalMm: 24, aperture: 11, focusM: 1.85, fgOffset: -0.24, mgOffset: 0.08, bgOffset: 0.06, toneSep: 0.20, fgEnabled: true },
  },
  resetBroken: {
    label: "复原开场错态",
    kind: "reset",
    patch: { ...INITIAL_STATE },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 焦段 f(mm) 与光圈 N 的超焦距 H(m)：H = f + f^2 / (N * c)
export function hyperfocalM(focalMm, aperture, coc = COC_LIMIT) {
  const fM = focalMm / 1000;
  return fM + (focalMm * focalMm) / (aperture * coc * 1000);
}

// 艾里斑衍射直径 (mm)：d = 2.44 * λ * N
export function airyDiameterMm(aperture) {
  return 2.44 * WAVELENGTH_MM * aperture;
}

// 几何弥散圆直径 (mm)：c = f^2 * |s - u| / (N * (u - f) * s)
export function geomCocMm(focalMm, aperture, focusM, subjectM) {
  const fM = focalMm / 1000;
  const u = Math.max(focusM, fM * 2.5);
  const s = Math.max(subjectM, fM * 2.5);
  const num = focalMm * focalMm * Math.abs(s - u);
  const den = aperture * (u - fM) * s * 1000;
  return num / Math.max(den, 1e-6);
}

// 合成模糊斑 (mm)：几何弥散圆 ⊕ 衍射艾里斑（方和根）
export function totalBlurMm(focalMm, aperture, focusM, subjectM) {
  const geom = geomCocMm(focalMm, aperture, focusM, subjectM);
  const airy = airyDiameterMm(aperture);
  return {
    geom,
    airy,
    total: Math.hypot(geom, airy),
  };
}

// 景深近限 / 远限 (m)
export function dofLimitsM(focalMm, aperture, focusM) {
  const H = hyperfocalM(focalMm, aperture);
  const fM = focalMm / 1000;
  const u = Math.max(focusM, fM * 2.5);
  const near = (H * u) / (H + (u - fM));
  const far = u >= H ? Infinity : (H * u) / Math.max(H - (u - fM), 1e-6);
  return { H, near, far };
}

// 对数标尺映射 (0.6m – 120m) 供滑轨与景深尺双向换算
const LOG_MIN = Math.log(0.6);
const LOG_MAX = Math.log(120);
export function focusToNorm(m) {
  return clamp((Math.log(clamp(m, 0.6, 120)) - LOG_MIN) / (LOG_MAX - LOG_MIN), 0, 1);
}
export function normToFocus(t) {
  const v = Math.exp(LOG_MIN + clamp(t, 0, 1) * (LOG_MAX - LOG_MIN));
  return v >= 115 ? 120 : +v.toFixed(2);
}
export function formatDist(m) {
  if (!Number.isFinite(m) || m >= 115) return "∞";
  if (m >= 10) return `${m.toFixed(0)} m`;
  return `${m.toFixed(2)} m`;
}

// 计算实绘三层包围盒与前景→中景真实遮挡率
export function computeGeometry(state) {
  const scene = SCENES[state.scene] || SCENES.alpine;
  const p = scene.planes;
  const bgCx = clamp(p.bg.baseX + state.bgOffset, 0.18, 0.84);
  const mgCx = clamp(p.mg.baseX + state.mgOffset, 0.22, 0.78);
  const fgCx = clamp(p.fg.baseX + state.fgOffset, 0.18, 0.82);

  // 合像取景时前景木栏/花簇向上探入中景高度，产生真实的遮挡重叠区
  const fgBox = {
    cx: fgCx,
    cy: p.fg.anchorY,
    x0: fgCx - p.fg.w / 2,
    x1: fgCx + p.fg.w / 2,
    y0: 0.43, // 栏杆柱顶/前景高枝伸到画面中部高度
    y1: 0.96,
  };
  const mgBox = {
    cx: mgCx,
    cy: p.mg.anchorY,
    x0: mgCx - p.mg.w / 2,
    x1: mgCx + p.mg.w / 2,
    y0: p.mg.anchorY - p.mg.h / 2,
    y1: p.mg.anchorY + p.mg.h / 2,
  };
  const bgBox = {
    cx: bgCx,
    cy: p.bg.anchorY,
    x0: bgCx - p.bg.w / 2,
    x1: bgCx + p.bg.w / 2,
    y0: p.bg.anchorY - p.bg.h / 2,
    y1: p.bg.anchorY + p.bg.h / 2,
  };

  let occlusionPct = 0;
  let overlapRect = null;
  if (state.fgEnabled) {
    const ox0 = Math.max(fgBox.x0, mgBox.x0);
    const ox1 = Math.min(fgBox.x1, mgBox.x1);
    const oy0 = Math.max(fgBox.y0, mgBox.y0);
    const oy1 = Math.min(fgBox.y1, mgBox.y1);
    if (ox1 > ox0 && oy1 > oy0) {
      const ovArea = (ox1 - ox0) * (oy1 - oy0);
      const mgArea = (mgBox.x1 - mgBox.x0) * (mgBox.y1 - mgBox.y0);
      // 栏杆实体占前景框约 72% 实体投影，映射到中景主体的有效遮挡率
      occlusionPct = Math.round(clamp((ovArea / mgArea) * 82, 0, 100));
      overlapRect = { x0: ox0, y0: oy0, x1: ox1, y1: oy1 };
    }
  }

  // 三层横向错落跨度与是否纵轴叠车
  const dxFM = Math.abs(fgCx - mgCx);
  const dxMB = Math.abs(mgCx - bgCx);
  const xs = state.fgEnabled ? [fgCx, mgCx, bgCx] : [mgCx, bgCx];
  const spread = Math.max(...xs) - Math.min(...xs);
  const alignedStack = state.fgEnabled && dxFM < 0.13 && dxMB < 0.13;

  // S 形 / Z 形视线路径点 (由近到远)
  const pathPts = [
    { x: fgCx, y: 0.80, plane: "fg" },
    { x: mgCx, y: 0.52, plane: "mg" },
    { x: bgCx, y: 0.25, plane: "bg" },
  ];

  return {
    scene,
    bgBox,
    mgBox,
    fgBox,
    occlusionPct,
    overlapRect,
    dxFM,
    dxMB,
    spread,
    alignedStack,
    pathPts,
  };
}

// 完整评估：统一产出光学数据、空间遮挡、5 项清单、四徽章与白话诊单
export function evaluate(state) {
  const geo = computeGeometry(state);
  const { planes } = geo.scene;
  const dof = dofLimitsM(state.focalMm, state.aperture, state.focusM);
  const airy = airyDiameterMm(state.aperture);

  const fgOpt = totalBlurMm(state.focalMm, state.aperture, state.focusM, planes.fg.distM);
  const mgOpt = totalBlurMm(state.focalMm, state.aperture, state.focusM, planes.mg.distM);
  const bgOpt = totalBlurMm(state.focalMm, state.aperture, state.focusM, planes.bg.distM);

  const diffractionFail = airy > AIRY_WARN;
  const fgSharp = state.fgEnabled && fgOpt.total <= SHARP_SIGMA && !diffractionFail;
  const mgSharp = mgOpt.total <= SHARP_SIGMA && !diffractionFail;
  const bgSharp = bgOpt.total <= SHARP_SIGMA && !diffractionFail;
  const unblocked = geo.occlusionPct <= 14;
  const toneOk = state.toneSep >= 0.48;
  const guideOk = state.fgEnabled && !geo.alignedStack && geo.spread >= 0.18 && geo.dxFM >= 0.14;

  // 1:1 原海报「快速检查清单」5 项
  const checklist = [
    {
      id: "fg",
      label: "前景突出且清晰",
      ok: fgSharp,
      tag: !state.fgEnabled
        ? "前景缺位"
        : diffractionFail
          ? `衍射 ${Math.round(airy * 1000)}μm`
          : fgSharp
            ? `清晰 ${fgOpt.total.toFixed(3)}mm`
            : `失焦 ${fgOpt.total.toFixed(3)}mm`,
    },
    {
      id: "mg",
      label: "中景内容丰富",
      ok: mgSharp && unblocked,
      tag: !unblocked
        ? `被遮 ${geo.occlusionPct}%`
        : diffractionFail
          ? "衍射发软"
          : mgSharp
            ? `清晰 ${mgOpt.total.toFixed(3)}mm`
            : `失焦 ${mgOpt.total.toFixed(3)}mm`,
    },
    {
      id: "bg",
      label: "远景延展空间",
      ok: bgSharp,
      tag: diffractionFail
        ? "衍射发软"
        : bgSharp
          ? `清晰 ${bgOpt.total.toFixed(3)}mm`
          : `失焦 ${bgOpt.total.toFixed(3)}mm`,
    },
    {
      id: "layer",
      label: "层次过渡自然",
      ok: toneOk && guideOk,
      tag: !state.fgEnabled
        ? "缺近景锚"
        : !toneOk
          ? "明暗拉平"
          : !guideOk
            ? "纵轴叠车"
            : "S 径疏朗",
    },
    {
      id: "clarity",
      label: "信息完整清晰",
      ok: fgSharp && mgSharp && bgSharp && unblocked && toneOk,
      tag:
        fgSharp && mgSharp && bgSharp && unblocked && toneOk
          ? "三景贯通"
          : diffractionFail
            ? "全画发肉"
            : !unblocked
              ? "遮挡损息"
              : !toneOk
                ? "噪点打架"
                : "局部失焦",
    },
  ];

  const passCount = checklist.filter((c) => c.ok).length;

  // 4 枚顶部圆徽实况（原海报 CLARITY / LAYERS / DEPTH / GUIDE）
  const badges = {
    clarity: fgSharp && mgSharp && bgSharp && !diffractionFail,
    layers: toneOk && state.fgEnabled && unblocked,
    depth: fgSharp && bgSharp && state.fgEnabled,
    guide: guideOk && unblocked,
  };

  // 按严重程度排序单真源白话诊单（7 类双向真错态 + 多组合法解成立态）
  let code = "pass";
  let shortStatus = `${passCount}/5 · 深焦成立`;
  let headline = "三层景深贯通，画面由近及远清晰有序";
  let reason = `当前 ${state.focalMm}mm · f/${state.aperture} 对焦 ${formatDist(state.focusM)}（超焦距 H = ${dof.H.toFixed(2)}m），清晰带覆及 ${formatDist(dof.near)}–${formatDist(dof.far)}；前景（${fgOpt.total.toFixed(3)}mm）、中景（${mgOpt.total.toFixed(3)}mm）与远景（${bgOpt.total.toFixed(3)}mm）全落在清晰上限 ${SHARP_SIGMA.toFixed(3)}mm 内，且前景错位让出中景（遮挡 ${geo.occlusionPct}%），明暗梯级清爽不乱。`;
  let actionHint = "试着切到「三景剖片」逐层复核，或换 28mm / 35mm 组合试试另一套深焦解。";
  let fixLabel = "切三景剖片复核";
  let fixType = "toggleView";

  if (diffractionFail) {
    code = "diffraction";
    shortStatus = `${passCount}/5 · 衍射发肉`;
    headline = `缩到 f/${state.aperture}，艾里斑衍射让三层一起变软`;
    reason = `很多人误以为光圈越小越清晰。当光圈缩到 f/${state.aperture}，光线穿过极窄叶片发生波动衍射，艾里斑直径膨大到 ${(airy * 1000).toFixed(0)} μm（超过 ${Math.round(AIRY_WARN * 1000)} μm 软化线），前景、中景、远景虽然都在景深里，精细纹理却被整体抹糊。`;
    actionHint = "把光圈放回 f/8–f/14 黄金甜区，配合广角与超焦距即可既深又锐。";
    fixLabel = "回退到 f/11 黄金光圈";
    fixType = "fixDiffraction";
  } else if (!state.fgEnabled) {
    code = "no-fg";
    shortStatus = `${passCount}/5 · 缺少前景`;
    headline = "抽掉前景后，空间入口消失，画面塌成平片";
    reason = `原海报把前景定位为「提供立体感与引导线」。现在 ${planes.fg.subject} 被撤空，观众只能隔着屏幕远远张望中远景，没有近处参照物锚定尺度，再清晰的景深也显得平淡扁平。`;
    actionHint = "重新打开前景锚点，并把它错位摆在左侧或右侧引导视线入画。";
    fixLabel = "恢复前景锚点";
    fixType = "fixFgEnable";
  } else if (!fgSharp && !bgSharp) {
    code = "shallow";
    shortStatus = `${passCount}/5 · 景深过浅`;
    headline = `${state.focalMm}mm · f/${state.aperture} 景深太窄，前远两头全虚`;
    reason = `当前清晰范围只有 ${formatDist(dof.near)}–${formatDist(dof.far)}，盖不住 ${planes.fg.distM}m 的前景（模糊斑 ${fgOpt.total.toFixed(3)}mm）和 ${formatDist(planes.bg.distM)} 的远景（${bgOpt.total.toFixed(3)}mm）。这已经落入浅景深的领地，而不是深焦构图。`;
    actionHint = "换用 24–35mm 广角、收小光圈至 f/8–f/14，再把对焦落到超焦距 H 附近。";
    fixLabel = "切换 24mm f/11 超焦距";
    fixType = "fixOptics";
  } else if (!fgSharp) {
    code = "fg-blur";
    shortStatus = `${passCount}/5 · 前景失焦`;
    headline =
      state.focusM >= 30
        ? `误对 ${formatDist(state.focusM)}，把一半景深白白浪费在无限远背后`
        : `清晰近限停在 ${formatDist(dof.near)}，前景 ${planes.fg.distM}m 糊掉了`;
    reason =
      state.focusM >= 30
        ? `新手拍深焦常直接把焦点拧到远山（${formatDist(state.focusM)}）。按超焦距公式，当前超焦距 H = ${dof.H.toFixed(2)}m，对焦无限远只会让清晰带从 ${formatDist(dof.near)} 才开始，位于 ${planes.fg.distM}m 的${planes.fg.subject}弥散斑飙到 ${fgOpt.total.toFixed(3)}mm，脚下先失守。`
        : `目前 ${state.focalMm}mm · f/${state.aperture} 的清晰近限在 ${formatDist(dof.near)}，还没覆盖到 ${planes.fg.distM}m 的前景（综合模糊斑 ${fgOpt.total.toFixed(3)}mm > ${SHARP_SIGMA}mm）。`;
    actionHint =
      dof.H / 2 > planes.fg.distM
        ? `当前焦段/光圈的理论超焦近限（${(dof.H / 2).toFixed(2)}m）仍大于前景 ${planes.fg.distM}m：先换更广焦段（24–28mm）或收小光圈到 f/11，再对准超焦距。`
        : `把对焦面拉回超焦距 H ≈ ${dof.H.toFixed(2)}m，清晰近限立刻前探到 ${(dof.H / 2).toFixed(2)}m，远景依然清晰。`;
    fixLabel = dof.H / 2 > planes.fg.distM ? "调广角小光圈并定超焦" : `拉回超焦距 ${dof.H.toFixed(2)}m`;
    fixType = "fixOptics";
  } else if (!bgSharp) {
    code = "bg-blur";
    shortStatus = `${passCount}/5 · 远景失焦`;
    headline = `对焦太近（${formatDist(state.focusM)}），远景${planes.bg.subject}散焦了`;
    reason = `把焦点钉在前景附近后，景深远限在 ${formatDist(dof.far)} 就提前收尾，远景弥散斑扩大到 ${bgOpt.total.toFixed(3)}mm。没有清晰延展的远景，画面失去纵深交待，退回成了局部浅景深。`;
    actionHint = `把对焦推进到超焦距 H = ${dof.H.toFixed(2)}m，让景深远限一口气延伸到 ∞。`;
    fixLabel = `推到超焦距 ${dof.H.toFixed(2)}m`;
    fixType = "fixHyperfocal";
  } else if (!unblocked) {
    code = "occluded";
    shortStatus = `${passCount}/5 · 前景遮中景`;
    headline = `虽然全都对实，但前景挡住了中景 ${geo.occlusionPct}%`;
    reason = `深焦最怕「光学全清晰、布景却打架」。现在${planes.fg.subject}直挺挺立在正中，把后方的${planes.mg.subject}拦腰截断（实测包围盒遮挡 ${geo.occlusionPct}%），违反了海报「避免遮挡影响信息传达」的底线。`;
    actionHint = "直接在画布上把前景往左或往右拖开，或反向移开中景，让桥身完整露面。";
    fixLabel = "横向错开前景遮挡";
    fixType = "fixBlocking";
  } else if (!guideOk) {
    code = "stacked";
    shortStatus = `${passCount}/5 · 纵轴叠车`;
    headline = "前中远挤在同一条竖线上，视线进不去纵深";
    reason = `三层主体水平跨度只有画幅宽度的 ${Math.round(geo.spread * 100)}%，前、中、远像糖葫芦一样竖直叠在一起，缺少由近及远的斜向牵引，读者一眼扫不到从前景进入远方的路线。`;
    actionHint = "在画布上横向微调前、中、远三层位置，摆成左前→右中→左远（或对称反 S）的错落递进。";
    fixLabel = "理出 S 形纵深错位";
    fixType = "fixBlocking";
  } else if (!toneOk) {
    code = "flat-clutter";
    shortStatus = `${passCount}/5 · 全清杂乱`;
    headline = "三层明暗拉平后，全清晰反而黏成一团噪点";
    reason = `失去了虚化帮忙隔离背景，深焦必须靠前景深暖、中景明快、远景微亮的明暗层次来区分前后。现在分层力度仅 ${Math.round(state.toneSep * 100)}%，前景木栏和中景石桥撞在同一灰阶里，满屏细节互相抢戏。`;
    actionHint = "把「三景明暗层次」推回 60% 以上，让前景稳压、中景承托、远景透亮。";
    fixLabel = "拉开三景明暗梯级";
    fixType = "fixTone";
  }

  // 曝光代价示意（以 f/2.8 为 0 EV 基准，小光圈需补光/慢门/高 ISO）
  const evCost = +(2 * Math.log2(state.aperture / 2.8)).toFixed(1);

  return {
    geo,
    dof,
    airy,
    planes: {
      fg: { ...planes.fg, opt: fgOpt, sharp: fgSharp, enabled: state.fgEnabled },
      mg: { ...planes.mg, opt: mgOpt, sharp: mgSharp, occluded: !unblocked },
      bg: { ...planes.bg, opt: bgOpt, sharp: bgSharp },
    },
    diffractionFail,
    checklist,
    passCount,
    badges,
    allPass: passCount === 5,
    evCost,
    diagnosis: {
      code,
      shortStatus,
      headline,
      reason,
      actionHint,
      fixLabel,
      fixType,
    },
  };
}

// 一键分步纠偏（针对当前首要病灶修复，不会直接跳终点抢走探索乐趣）
export function applyStepFix(state, evalResult) {
  const { fixType } = evalResult.diagnosis;
  if (fixType === "fixDiffraction") {
    const H = hyperfocalM(state.focalMm, 11);
    return { ...state, aperture: 11, focusM: clamp(+H.toFixed(2), 0.8, 20) };
  }
  if (fixType === "fixFgEnable") {
    return { ...state, fgEnabled: true };
  }
  if (fixType === "fixOptics") {
    const nextF = state.focalMm > 35 ? 24 : state.focalMm;
    const nextN = state.aperture < 8 || state.aperture > 16 ? 11 : state.aperture;
    const H = hyperfocalM(nextF, nextN);
    return { ...state, focalMm: nextF, aperture: nextN, focusM: clamp(+(H * 1.04).toFixed(2), 0.8, 25) };
  }
  if (fixType === "fixHyperfocal") {
    const H = hyperfocalM(state.focalMm, state.aperture);
    return { ...state, focusM: clamp(+(H * 1.04).toFixed(2), 0.8, 25) };
  }
  if (fixType === "fixBlocking") {
    return { ...state, fgOffset: -0.25, mgOffset: 0.08, bgOffset: 0.06 };
  }
  if (fixType === "fixTone") {
    return { ...state, toneSep: 0.82 };
  }
  if (fixType === "toggleView") {
    return { ...state, viewMode: state.viewMode === "unified" ? "split" : "unified" };
  }
  return state;
}

// 供第 06 节测验直接调用的单真源参数（每题严格只差一个变量）
export const QUIZ_QUESTIONS = [
  {
    id: "q1",
    tab: "第 1 题 · 对焦落点",
    prompt: "同一条阿尔卑斯山谷（前景花径 1.5 m、中景石桥 6 m、远景雪峰 120 m），统一固定 28mm 广角与 f/11 光圈，只改合焦距离。哪一张能从近到远都落在清晰带里？",
    variable: "唯一变量：合焦距离 u",
    options: [
      { key: "A", caption: "28mm · f/11 · u = 0.70 m", state: { scene: "alpine", focalMm: 28, aperture: 11, focusM: 0.70, fgOffset: -0.25, mgOffset: 0.08, bgOffset: 0.06, toneSep: 0.82, fgEnabled: true } },
      { key: "B", caption: "28mm · f/11 · u = 2.45 m", state: { scene: "alpine", focalMm: 28, aperture: 11, focusM: 2.45, fgOffset: -0.25, mgOffset: 0.08, bgOffset: 0.06, toneSep: 0.82, fgEnabled: true } },
      { key: "C", caption: "28mm · f/11 · u = ∞ (120 m)", state: { scene: "alpine", focalMm: 28, aperture: 11, focusM: 120, fgOffset: -0.25, mgOffset: 0.08, bgOffset: 0.06, toneSep: 0.82, fgEnabled: true } },
      { key: "D", caption: "28mm · f/11 · u = 0.40 m", state: { scene: "alpine", focalMm: 28, aperture: 11, focusM: 0.40, fgOffset: -0.25, mgOffset: 0.08, bgOffset: 0.06, toneSep: 0.82, fgEnabled: true } },
    ],
    answer: "B",
    explain: "28mm 配 f/11 的超焦距 H ≈ 2.40 m。选 B（对焦 2.45 m）时，清晰近限前探到约 1.22 m、远限直达 ∞，1.5 m 前景花径与远方雪峰同时落入清晰带。最容易误选的是 C：直接对焦 ∞ 时，清晰近限退到 2.36 m 以后，前景 1.5 m 木栏与白花明显发虚；A 与 D 对焦过近，把中远景推离清晰带。",
  },
  {
    id: "q2",
    tab: "第 2 题 · 前中错位",
    prompt: "光学参数完全一致（24mm · f/11 · 对焦 1.85 m，三层都锐利），只改前景栏杆与中景石桥的横向布位。哪一张信息最完整、纵深引导最顺？",
    variable: "唯一变量：三层空间布位",
    options: [
      { key: "A", caption: "布位方案 A", state: { scene: "alpine", focalMm: 24, aperture: 11, focusM: 1.85, fgOffset: 0.0, mgOffset: 0.0, bgOffset: -0.12, toneSep: 0.82, fgEnabled: true } },
      { key: "B", caption: "布位方案 B", state: { scene: "alpine", focalMm: 24, aperture: 11, focusM: 1.85, fgOffset: -0.25, mgOffset: 0.04, bgOffset: 0.06, toneSep: 0.82, fgEnabled: false } },
      { key: "C", caption: "布位方案 C", state: { scene: "alpine", focalMm: 24, aperture: 11, focusM: 1.85, fgOffset: -0.25, mgOffset: 0.09, bgOffset: 0.06, toneSep: 0.82, fgEnabled: true } },
      { key: "D", caption: "布位方案 D", state: { scene: "alpine", focalMm: 24, aperture: 11, focusM: 1.85, fgOffset: 0.14, mgOffset: 0.14, bgOffset: 0.02, toneSep: 0.82, fgEnabled: true } },
    ],
    answer: "C",
    explain: "光学清晰只是前半程。方案 C 把前景木栏花径放在左下方引导视线入画，中景石拱桥完整露在右中承接，远景雪峰与教堂居上方呼应，零遮挡且形成 S 形纵深递进；A 与 D 都让前景直接挡住石桥主拱，B 撤空了前景导致近处失去空间入口。",
  },
  {
    id: "q3",
    tab: "第 3 题 · 光圈权衡",
    prompt: "同一条山谷与同一错位布景，固定 24mm 广角并始终把焦点对在各自光圈对应的超焦距上，只改光圈档位。哪一张在三层景深与微反差锐度之间最平衡？",
    variable: "唯一变量：光圈档位 N",
    options: [
      { key: "A", caption: "24mm · f/2.0 · 对焦超焦距", state: { scene: "alpine", focalMm: 24, aperture: 2.0, focusM: 9.6, fgOffset: -0.25, mgOffset: 0.08, bgOffset: 0.06, toneSep: 0.82, fgEnabled: true } },
      { key: "B", caption: "24mm · f/4.0 · 对焦超焦距", state: { scene: "alpine", focalMm: 24, aperture: 4.0, focusM: 4.8, fgOffset: -0.25, mgOffset: 0.08, bgOffset: 0.06, toneSep: 0.82, fgEnabled: true } },
      { key: "C", caption: "24mm · f/11 · 对焦超焦距", state: { scene: "alpine", focalMm: 24, aperture: 11, focusM: 1.85, fgOffset: -0.25, mgOffset: 0.08, bgOffset: 0.06, toneSep: 0.82, fgEnabled: true } },
      { key: "D", caption: "24mm · f/32 · 对焦超焦距", state: { scene: "alpine", focalMm: 24, aperture: 32, focusM: 0.65, fgOffset: -0.25, mgOffset: 0.08, bgOffset: 0.06, toneSep: 0.82, fgEnabled: true } },
    ],
    answer: "C",
    explain: "f/2.0 与 f/4.0 的超焦近限仍在 4.8 m 和 2.4 m 之外，盖不住 1.5 m 前景；而盲目缩到 f/32 虽然几何景深拉满，艾里斑衍射直径却涨到 43 μm，把三层纹理一起抹软。f/11 恰好处于「覆盖 1.5 m–∞ 且衍射尚未吞噬细节」的深焦黄金区。",
  },
];

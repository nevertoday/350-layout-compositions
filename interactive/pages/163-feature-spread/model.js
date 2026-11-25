// 163 特写 跨页（FEATURE SPREAD）单真源几何与版式评估模型
// 画布绘制、红笔批注坐标、编辑部诊单、原海报三枚金徽状态全部读取本文件同一份实算结果。

export const SPREAD_W_MM = 440; // 对开双页总宽（单页 220mm × 297mm，经典期刊开本）
export const SPREAD_H_MM = 297;
export const SPREAD_ASPECT = SPREAD_W_MM / SPREAD_H_MM; // ≈ 1.4815
export const BLEED_MM = 3;

export const BINDINGS = {
  perfect: {
    id: "perfect",
    label: "无线胶装 · 240页",
    shortLabel: "胶装深缝 14mm",
    gutterHalfMm: 14,
    safeClearMm: 28,
    openAngle: 126,
    archDepthMm: 15,
    note: "厚刊胶装无法完全摊平，书脊两侧各约 14mm 会向下弯进深槽，关键焦心至少距中缝 28mm。",
  },
  saddle: {
    id: "saddle",
    label: "骑马钉 · 48页",
    shortLabel: "骑马钉 4mm",
    gutterHalfMm: 4,
    safeClearMm: 15,
    openAngle: 174,
    archDepthMm: 3,
    note: "薄刊骑马钉接近完全摊平，中缝仅吃掉约 4mm，但核心细节与小字仍需避开正中折痕线。",
  },
};

export const STORIES = {
  poster: {
    id: "poster",
    tab: "原海报 · 巨环几何",
    issue: "NO. 163 · FEATURE SPREAD",
    folioLeft: "42   版式设计原理",
    folioRight: "FEATURE SPREAD   43",
    title: "特写 跨页",
    titleEn: "FEATURE SPREAD",
    deck: "放大关键视觉局部，在大面积裁切中建立张力，以简洁文字提供必要信息。",
    captionTag: "视觉母题 · 暖奶白巨环与镉金斜楔",
    wallCols: [
      "特写跨页是现代杂志和画册中极具冲击力的出版功能页面。当编辑希望在一连串平铺直叙的栏式正文之后制造情绪峰值时，往往会把对开两页合并成同一块视觉舞台，不再受单页栏宽束缚。",
      "不过在实际排印中，许多版面虽然占用了双页面积，却依然把主体完整装在四条白框之内，甚至把视觉重心直接压在书脊中缝线上，旁边再堆满密密麻麻的解释正文，结果两页既没有局部特写的临场张力，又失去了图像主导的呼吸节奏。",
    ],
    focalOffset: { du: 0, dv: -0.015 },
    baseRadiusV: 0.255,
  },
  bowl: {
    id: "bowl",
    tab: "器物特写 · 曜变茶碗",
    issue: "CRAFT QUARTERLY · VOL. 18",
    folioLeft: "68   器物与修补",
    folioRight: "KINTSUGI MACRO   69",
    title: "金缮 裂纹",
    titleEn: "SCAR IN GOLD",
    deck: "把建盏的旧裂推近到跨页尺幅，一道贴金漆痕就撑起整篇匠人故事的入口。",
    captionTag: "摄影纪实 · 局部金缮裂纹与拉坯旋纹",
    wallCols: [
      "这只宋式黑釉茶碗在去年冬天的窑变展中不慎磕出一条斜裂，京都修复工坊花了整整七周，以生漆粘合、反复阴干打磨，最后在最细的漆脊上敷了一道极薄的纯金粉，使破损处呈现温润的光泽。",
      "如果按照传统商品图录的做法，摄影师会退后两米把茶碗连同底座完整收入画面正中，并在旁边列出器高、口径、胎土产地与烧成温度等十二项参数；但作为专题特写跨页，真正打动读者的不是整只碗的轮廓，而是这道金色裂痕本身。",
    ],
    focalOffset: { du: -0.018, dv: 0.01 },
    baseRadiusV: 0.25,
  },
  oculus: {
    id: "oculus",
    tab: "建筑纪实 · 穹顶天窗",
    issue: "ARCH MONOGRAPH · NO. 09",
    folioLeft: "114  光与混凝土",
    folioRight: "OCULUS LIGHT   115",
    title: "穹顶 光柱",
    titleEn: "SHAFT OF DAYLIGHT",
    deck: "三十米高空切下的斜光与底端微小背影对照，一翻页就能感到尺度的重量。",
    captionTag: "空间特写 · 拱肋天窗与地面微影尺度",
    wallCols: [
      "这座改建自旧粮仓的美术馆中庭保留了原有的混凝土拱肋，建筑师只在穹顶偏心处切开一枚直径九米的圆窗。正午之后，阳光沿四十二度斜角切进深暗的室腔，像一把锋利的尺子量出整座空间的纵深。",
      "在整套建筑专刊里，前后几页已经给出了完整的平面图、剖面图与外立面远景；这一对开跨页的任务不是重复交代建筑全貌，而是让读者在翻开书页的一瞬间，直接站在光柱落地的尺度里感受它的沉默与压迫感。",
    ],
    focalOffset: { du: 0.01, dv: -0.03 },
    baseRadiusV: 0.258,
  },
};

export const PRESETS = {
  flaw: {
    label: "复原开场错态",
    kind: "reset",
    patch: { zoom: 0.62, focusU: 0.50, bleed: false, textLoad: "wall", textPlace: "quiet", binding: "perfect" },
  },
  posterRight: {
    label: "原海报右页解",
    kind: "solve",
    patch: { zoom: 2.16, focusU: 0.78, bleed: true, textLoad: "concise", textPlace: "quiet", binding: "perfect" },
  },
  leftMacro: {
    label: "左页特写解",
    kind: "solve",
    patch: { zoom: 2.16, focusU: 0.24, bleed: true, textLoad: "concise", textPlace: "quiet", binding: "perfect" },
  },
  fullBleed: {
    label: "跨页双出血解",
    kind: "solve",
    patch: { zoom: 2.16, focusU: 0.68, bleed: true, textLoad: "concise", textPlace: "quiet", binding: "saddle" },
  },
  failSpine: {
    label: "试错：中缝劈焦",
    kind: "fail",
    patch: { zoom: 1.66, focusU: 0.50, bleed: true, textLoad: "concise", textPlace: "quiet", binding: "perfect" },
  },
  failOverzoom: {
    label: "试错：过切失认",
    kind: "fail",
    patch: { zoom: 2.38, focusU: 0.78, bleed: true, textLoad: "concise", textPlace: "quiet", binding: "perfect" },
  },
};

export function createInitialState() {
  return {
    story: "poster",
    zoom: 0.62,
    focusU: 0.50,
    focusV: 0.49,
    bleed: false,
    textLoad: "wall", // "wall" | "concise" | "none"
    textPlace: "quiet", // "quiet" | "over"
    binding: "perfect", // "perfect" | "saddle"
    showGuides: true,
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 单真源几何核算：由同一份参数推出画面上每一个真实框体、焦心坐标、出血边数、面积占比与诊断结论
export function evaluateSpread(state) {
  const story = STORIES[state.story] || STORIES.poster;
  const binding = BINDINGS[state.binding] || BINDINGS.perfect;
  const zoom = clamp(state.zoom, 0.48, 2.5);
  const focusU = clamp(state.focusU, 0.14, 0.86);
  const focusV = clamp(state.focusV ?? 0.49, 0.34, 0.66);

  // 实体出血与留白裁切安全框（归一化到跨页 [0..1]×[0..1]）
  const marginU = 0.048;
  const marginV = 0.072;

  // 主体有效外半径（在跨页归一化坐标系里，保持严格正圆等比）
  const rV = story.baseRadiusV * zoom;
  const rU = rV / SPREAD_ASPECT;

  // 若关闭出血，图像被锁在留白画框之内（框体随倍率微调但严格止步于页边距内，永不越边）
  let clipRect;
  if (!state.bleed) {
    const halfW = clamp(rU * 1.16, 0.14, 0.5 - marginU - 0.02);
    const halfH = clamp(rV * 1.12, 0.22, 0.5 - marginV);
    const cx = clamp(focusU, marginU + halfW, 1 - marginU - halfW);
    const cy = clamp(focusV, marginV + halfH, 1 - marginV - halfH);
    clipRect = {
      u0: cx - halfW,
      v0: cy - halfH,
      u1: cx + halfW,
      v1: cy + halfH,
    };
  } else {
    const bU = BLEED_MM / SPREAD_W_MM;
    const bV = BLEED_MM / SPREAD_H_MM;
    clipRect = { u0: -bU, v0: -bV, u1: 1 + bU, v1: 1 + bV };
  }

  // 实际绘制出的主体圆心与关键焦心坐标（与画布 1:1 共用）
  const subjU = !state.bleed
    ? (clipRect.u0 + clipRect.u1) * 0.5
    : focusU;
  const subjV = !state.bleed
    ? (clipRect.v0 + clipRect.v1) * 0.5
    : focusV;

  // 在留白装框模式下，画面里的主体半径受画框内边距限制，不可能突破白框
  const drawnRV = !state.bleed
    ? Math.min(rV, (clipRect.v1 - clipRect.v0) * 0.43, (clipRect.u1 - clipRect.u0) * 0.43 * SPREAD_ASPECT)
    : rV;
  const drawnRU = drawnRV / SPREAD_ASPECT;

  const focalU = subjU + story.focalOffset.du * zoom;
  const focalV = subjV + story.focalOffset.dv * zoom;

  // 1. 实算跨边出血边数与擦边发紧（严格按主体实绘轮廓与跨页四条裁切边求交）
  const edgeOver = {
    left: 0 - (subjU - drawnRU),
    right: (subjU + drawnRU) - 1,
    top: 0 - (subjV - drawnRV),
    bottom: (subjV + drawnRV) - 1,
  };
  let bleedEdges = 0;
  let tangentEdge = null;
  if (state.bleed) {
    for (const [edgeName, over] of Object.entries(edgeOver)) {
      if (over >= 0.022) {
        bleedEdges += 1;
      } else if (over > -0.018 && over < 0.022) {
        if (!tangentEdge) tangentEdge = edgeName;
      }
    }
    // 兼计斜楔底边出血：当放大且出血开启、底楔切出底边超过 28% 跨页宽度时计为有效出血边（不重复计数）
    if (edgeOver.bottom < 0.022 && zoom >= 1.15 && subjV + drawnRV * 0.86 > 0.72) {
      bleedEdges = Math.min(4, bleedEdges + 1);
    }
  }

  // 2. 用 24×16 实测网格精确计算：主视觉占跨页面积比例 & 主体轮廓留存可辨识比例
  let spreadCovered = 0;
  const gx = 24;
  const gy = 16;
  const totalGrid = gx * gy;
  const wedgeSlope = 0.62; // 对应原海报斜楔斜率
  const wedgeStartU = subjU - drawnRU * 0.78;
  for (let iy = 0; iy < gy; iy++) {
    const v = (iy + 0.5) / gy;
    for (let ix = 0; ix < gx; ix++) {
      const u = (ix + 0.5) / gx;
      if (u < clipRect.u0 || u > clipRect.u1 || v < clipRect.v0 || v > clipRect.v1) continue;
      if (!state.bleed) {
        // 留白装框模式下，整块装框图板即是主图在跨页上的视觉占地
        spreadCovered += 1;
        continue;
      }
      const du = (u - subjU) / Math.max(0.001, drawnRU);
      const dv = (v - subjV) / Math.max(0.001, drawnRV);
      const inMain = du * du + dv * dv <= 1.04;
      // 镉金黄斜楔属于主体视觉构成的一部分（出血开启且主图放大时形成跨页斜切场）
      const inWedge = v > 0.44 && (u - wedgeStartU) > (1 - v) * wedgeSlope * 0.55 && u > subjU - drawnRU * 1.05;
      if (inMain || inWedge) spreadCovered += 1;
    }
  }
  const coveragePct = Math.round((spreadCovered / totalGrid) * 100);

  // 主体轮廓留存率：采样主体圆盘内部有多少比例落在跨页裁切线 [0..1]×[0..1] 内
  let diskInside = 0;
  let diskTotal = 0;
  for (let iy = -7; iy <= 7; iy++) {
    for (let ix = -7; ix <= 7; ix++) {
      const nu = ix / 7;
      const nv = iy / 7;
      if (nu * nu + nv * nv > 1) continue;
      diskTotal += 1;
      const u = subjU + nu * drawnRU;
      const v = subjV + nv * drawnRV;
      if (u >= 0 && u <= 1 && v >= 0 && v <= 1) diskInside += 1;
    }
  }
  const visibleSubjectPct = Math.round((diskInside / Math.max(1, diskTotal)) * 100);

  // 3. 物理书脊中缝核算
  const gutterHalfU = binding.gutterHalfMm / SPREAD_W_MM;
  const safeClearU = binding.safeClearMm / SPREAD_W_MM;
  const spineDistU = Math.abs(focalU - 0.5);
  const spineDistMm = Math.round(spineDistU * SPREAD_W_MM);
  const gutterSwallowed = spineDistU <= gutterHalfU + 0.004;
  const gutterTight = !gutterSwallowed && spineDistU < safeClearU;
  const gutterHit = gutterSwallowed || gutterTight;

  // 4. 文字块真实矩形与图文冲突核算（供画布 1:1 渲染）
  const quietSide = subjU >= 0.5 ? "left" : "right";
  const textSide = state.textPlace === "over"
    ? (subjU >= 0.5 ? "right" : "left")
    : quietSide;

  let textRect = null;
  let textAreaPct = 0;
  if (state.textLoad === "wall") {
    // 长文压图：双栏正文强占半页并延伸到底部
    textRect = textSide === "left"
      ? { u0: 0.045, v0: 0.11, u1: 0.455, v1: 0.89 }
      : { u0: 0.545, v0: 0.11, u1: 0.955, v1: 0.89 };
    textAreaPct = Math.round((textRect.u1 - textRect.u0) * (textRect.v1 - textRect.v0) * 100);
  } else if (state.textLoad === "concise") {
    if (state.textPlace === "over") {
      // 刻意叠在主视觉焦心附近
      const cx = clamp(subjU, 0.22, 0.78);
      textRect = { u0: cx - 0.145, v0: 0.28, u1: cx + 0.145, v1: 0.68 };
    } else {
      textRect = quietSide === "left"
        ? { u0: 0.055, v0: 0.15, u1: 0.345, v1: 0.76 }
        : { u0: 0.655, v0: 0.15, u1: 0.945, v1: 0.76 };
    }
    textAreaPct = Math.round((textRect.u1 - textRect.u0) * (textRect.v1 - textRect.v0) * 100);
  }

  // 检查文字块是否和主视觉高光环体发生严重重压
  let textOverlapRatio = 0;
  if (textRect) {
    let hit = 0;
    let tot = 0;
    for (let iy = 0; iy < 6; iy++) {
      const v = textRect.v0 + ((iy + 0.5) / 6) * (textRect.v1 - textRect.v0);
      for (let ix = 0; ix < 6; ix++) {
        const u = textRect.u0 + ((ix + 0.5) / 6) * (textRect.u1 - textRect.u0);
        tot += 1;
        const du = (u - subjU) / Math.max(0.001, drawnRU);
        const dv = (v - subjV) / Math.max(0.001, drawnRV);
        const r2 = du * du + dv * dv;
        // 落在亮奶白环带内（或主体高对比核心上）
        if (r2 >= 0.22 && r2 <= 1.02) hit += 1;
      }
    }
    textOverlapRatio = hit / tot;
  }
  const textClash = state.textLoad === "concise" && (state.textPlace === "over" || textOverlapRatio > 0.36);

  // 5. 三枚原海报金徽单真源判定（全部双向可错）
  const tooSmall = coveragePct < 44 || zoom < 1.15;
  const tooLarge = zoom > 2.22 || visibleSubjectPct < 24;
  const focusOk = !tooSmall && !tooLarge;

  const noBleed = !state.bleed || bleedEdges < 2;
  const cropOk = !noBleed && !gutterHit && !tangentEdge;

  const isWall = state.textLoad === "wall";
  const isNoText = state.textLoad === "none";
  const captionOk = !isWall && !isNoText && !textClash;

  const passedCount = (focusOk ? 1 : 0) + (cropOk ? 1 : 0) + (captionOk ? 1 : 0);

  // 6. 单一最高优先级的白话看样诊单 + 就地修错动作
  let badge = "";
  let headline = "";
  let body = "";
  let nudge = "";
  let fixLabel = "";
  let fixPatch = null;
  let gradeLabel = "";

  if (tooSmall && !state.bleed) {
    badge = `${passedCount}/3 · 缩框失势`;
    headline = `主图仅占跨页 ${coveragePct}%，被白框锁成了普通插图`;
    body = `当前倍率只有 ${zoom.toFixed(2)}× 且关闭了出血，主体整块缩在安全框里。读者翻到这一页时看不到跨页扑面而来的尺幅震撼，更像普通的图文内页。`;
    nudge = "在摊开的杂志跨页上向右横拖（把倍率推到 1.45× 以上），并切开「跨边出血」，让画面干脆冲出裁切线。";
    fixLabel = "放大并切开出血";
    fixPatch = { zoom: 2.16, bleed: true };
    gradeLabel = "平庸插图（示意）";
  } else if (tooSmall) {
    badge = `${passedCount}/3 · 放大不足`;
    headline = `倍率 ${zoom.toFixed(2)}× 偏拘谨，主图仅占 ${coveragePct}%`;
    body = "虽然切开了出血通道，但主体还没放大到能压住双页气场的尺幅。特写跨页的第一条铁律是「敢于拉近」——先把最有戏的局部推到跨页一半以上。";
    nudge = "继续在画布上向右横拖（或按方向键 →），将放大倍率推到 1.40×–2.18× 甜点区。";
    fixLabel = "推近到特写尺幅";
    fixPatch = { zoom: 2.16 };
    gradeLabel = "力度不足（示意）";
  } else if (tooLarge) {
    badge = `${passedCount}/3 · 过切失认`;
    headline = `放大到 ${zoom.toFixed(2)}× 过头，主体轮廓仅留 ${visibleSubjectPct}%`;
    body = "特写不是无上限拉大。当关键轮廓被裁掉四分之三以上，读者大脑无法补全画外形态，整张跨页会塌缩成一块看不出原物的抽象底纹。";
    nudge = "在画布上向左微退（按方向键 ←），把倍率收回 1.35×–2.18×，留出足够辨认原物的标志弧线。";
    fixLabel = "退回可辨识尺幅";
    fixPatch = { zoom: 2.16 };
    gradeLabel = "过切失认（示意）";
  } else if (gutterSwallowed) {
    badge = `${passedCount}/3 · 中缝劈焦`;
    headline = `关键焦心距中缝仅 ${spineDistMm}mm，正被${binding.shortLabel}吃掉`;
    body = `${binding.note} 眼下焦心直接压在书脊折痕正中，印刷成书后最关键的局部会被中缝折弯吞噬、从视觉上硬生生劈成两半。`;
    nudge = "向右（或向左）拖动底沿「中缝避让」标尺，把焦心推到距书脊 30mm 以外的单页安全区。";
    fixLabel = "把焦心移出中缝";
    fixPatch = { focusU: 0.78 };
    gradeLabel = "中缝劈裂（示意）";
  } else if (gutterTight) {
    badge = `${passedCount}/3 · 紧贴书脊`;
    headline = `焦心距书脊仅 ${spineDistMm}mm，仍在装订阴影带内`;
    body = `当前使用「${binding.label}」，书页在书脊附近有明显弧度弯曲。焦心离开正中还不够远（建议 ≥ ${binding.safeClearMm}mm），翻阅时视线依然会掉进折痕里。`;
    nudge = "继续将焦心往右页或左页推远一点（或切换成可摊平的骑马钉装订对比差异）。";
    fixLabel = "推入单页安全区";
    fixPatch = { focusU: focusU >= 0.5 ? 0.78 : 0.24 };
    gradeLabel = "逼近折痕（示意）";
  } else if (noBleed) {
    badge = `${passedCount}/3 · 裁切未破边`;
    headline = `有效出血边仅 ${bleedEdges}/4，画外张力没立起来`;
    body = "海报第二要点写着「裁切张力 CROP」：至少让放大后的主体干脆越过两条以上裁切边，大脑才会顺着被截断的弧线去脑补画外更大的空间。";
    nudge = "打开「跨边出血」并微调放大倍率或落位，让主体至少干脆切出 2 条裁切边。";
    fixLabel = "切出三边出血";
    fixPatch = { bleed: true, zoom: 2.16, focusU: focusU >= 0.5 ? 0.78 : 0.24 };
    gradeLabel = "封闭缺张力（示意）";
  } else if (tangentEdge) {
    const edgeCN = { left: "左", right: "右", top: "顶", bottom: "底" }[tangentEdge] || "";
    badge = `${passedCount}/3 · 擦边发紧`;
    headline = `主体轮廓刚好擦着${edgeCN}裁切边，像没裁干净`;
    body = "平面编排里最忌「似裁非裁」：轮廓边缘距离裁切线只有几毫米，印刷裁纸刀只要漂移 1–2mm 就会变成意外削角，显得犹豫局促。";
    nudge = "稍微再放大一点干脆切出去，或退回一点留足呼吸，不要停在裁切边上试探。";
    fixLabel = "干脆切过裁切边";
    fixPatch = { zoom: 2.16 };
    gradeLabel = "擦边犹豫（示意）";
  } else if (isWall) {
    badge = `${passedCount}/3 · 长文压图`;
    headline = `文字区占去 ${textAreaPct}% 版面，喧宾夺主抢走节奏`;
    body = "图像已经放得够大，但旁边塞着 240 字双栏正文。特写跨页靠图像主导第一眼阅读节奏，大段论述应该留给翻页后的正文栏，这一页只留钩子和必要信息。";
    nudge = "将「文字负载」切换到「精炼题注」，让文字退守安静的留白侧，把舞台还给特写画面。";
    fixLabel = "收成精炼标题短注";
    fixPatch = { textLoad: "concise", textPlace: "quiet" };
    gradeLabel = "文字过载（示意）";
  } else if (isNoText) {
    badge = `${passedCount}/3 · 无字失锚`;
    headline = "彻底删光文字（0 字），读者不知道这一页讲什么";
    body = "海报原文写得很准：「以简洁文字提供必要信息」。一字不留会让跨页退化成纯装饰插画，读者被画面吸住后却找不到进入这篇专题的标题与语境锚点。";
    nudge = "把「文字负载」切回「精炼题注」，用大标 + 一句短导语完成图文协同。";
    fixLabel = "补上简洁标题短注";
    fixPatch = { textLoad: "concise", textPlace: "quiet" };
    gradeLabel = "缺主题锚点（示意）";
  } else if (textClash) {
    badge = `${passedCount}/3 · 文字撞焦`;
    headline = "文字硬叠在主图高亮区上，图文互相打架";
    body = "精炼的文字同样要挑安静的落脚点。把标题和短注直接盖在暖奶白高光环体与焦心上，既破坏特写细节的完整度，也让浅色字在亮底上失焦难读。";
    nudge = "将「文字落位」切回「静区留白」，把文字安放到主图对侧的深松静区。";
    fixLabel = "移回静区留白";
    fixPatch = { textPlace: "quiet" };
    gradeLabel = "图文互扰（示意）";
  } else {
    // 全部三项成立！识别具体属于哪一种合法版式解
    let solName = "跨页特写成立";
    if (subjU <= 0.38 && quietSide === "right") solName = "左页特写静区解";
    else if (state.binding === "saddle" && subjU - drawnRU < 0.36) solName = "跨页双出血解";
    else if (subjU >= 0.62 && quietSide === "left") solName = "原海报右页巨环解";
    else solName = "跨页出血偏焦解";

    badge = `3/3 · ${solName}`;
    headline = `图像主导成立：占跨页 ${coveragePct}%，${bleedEdges} 边出血，焦心避缝 ${spineDistMm}mm`;
    body = `你调出了一套经得起印厂检验的「${solName}」：主体放得干脆（${zoom.toFixed(2)}×）且留存 ${visibleSubjectPct}% 可辨识轮廓，焦心稳居单页安全区，文字退守${quietSide === "left" ? "左页" : "右页"}静区仅占 ${textAreaPct}%。你也可以试着把焦心移到另一页或切「胶装 / 骑马钉」，验证还有不止一种合法解法。`;
    nudge = "试试把焦心推去另一页（左页特写解），或者点「试错：过切失认 / 中缝劈焦」看看边界在哪。";
    fixLabel = "";
    fixPatch = null;
    gradeLabel = "沉浸主导（示意）";
  }

  // 画布内可直接点击的红笔批注标签（最多 2 个，避免遮挡整个画面）
  const annotations = [];
  if (tooSmall || !state.bleed) {
    annotations.push({
      id: "fix-scale",
      u: clamp(subjU, 0.28, 0.78),
      v: clamp(subjV - drawnRV - 0.055, 0.12, 0.24),
      label: !state.bleed ? "× 缩在框内 · 点切出血" : "× 缩成配图 · 点拉特写",
      patch: { zoom: 1.72, bleed: true },
    });
  } else if (tooLarge) {
    annotations.push({
      id: "fix-overzoom",
      u: 0.62,
      v: 0.16,
      label: `× 过切仅留 ${visibleSubjectPct}% · 点回退`,
      patch: { zoom: 1.72 },
    });
  }
  if (gutterHit) {
    annotations.push({
      id: "fix-gutter",
      u: 0.50,
      v: 0.50,
      label: `× 焦心压中缝 (${spineDistMm}mm) · 点移避脊`,
      patch: { focusU: 0.74 },
    });
  }
  if (isWall && textRect) {
    annotations.push({
      id: "fix-wall",
      u: (textRect.u0 + textRect.u1) * 0.5,
      v: 0.80,
      label: "× 240字长文压图 · 点收简注",
      patch: { textLoad: "concise", textPlace: "quiet" },
    });
  } else if (isNoText) {
    annotations.push({
      id: "fix-notext",
      u: quietSide === "left" ? 0.20 : 0.80,
      v: 0.45,
      label: "× 无字失锚 · 点补题注",
      patch: { textLoad: "concise", textPlace: "quiet" },
    });
  } else if (textClash && textRect) {
    annotations.push({
      id: "fix-clash",
      u: (textRect.u0 + textRect.u1) * 0.5,
      v: textRect.v0 - 0.05,
      label: "× 文字硬叠主图 · 点移静区",
      patch: { textPlace: "quiet" },
    });
  }

  return {
    story,
    binding,
    zoom,
    focusU,
    focusV,
    subjU,
    subjV,
    drawnRU,
    drawnRV,
    focalU,
    focalV,
    clipRect,
    gutterHalfU,
    safeClearU,
    spineDistMm,
    bleedEdges,
    tangentEdge,
    coveragePct,
    visibleSubjectPct,
    textRect,
    textAreaPct,
    quietSide,
    textSide,
    focusOk,
    cropOk,
    captionOk,
    gutterHit,
    gutterSwallowed,
    passedCount,
    focusTag: tooSmall ? `仅占 ${coveragePct}%` : tooLarge ? `过切 ${visibleSubjectPct}%` : `占比 ${coveragePct}%`,
    cropTag: !state.bleed ? "0 边出血" : gutterHit ? `压缝 ${spineDistMm}mm` : tangentEdge ? "擦边发紧" : `${bleedEdges}边 · 避脊`,
    captionTag: isWall ? `长文 ${textAreaPct}%` : isNoText ? "0字失锚" : textClash ? "撞焦难读" : `静区 ${textAreaPct}%`,
    badge,
    headline,
    body,
    nudge,
    fixLabel,
    fixPatch,
    gradeLabel,
    annotations: annotations.slice(0, 3),
  };
}

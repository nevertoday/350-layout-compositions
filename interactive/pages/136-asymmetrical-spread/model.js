// 136 非对称跨页 —— 单真源几何、视觉力矩与双向错态诊断模型
// 坐标系：摊开跨页标准化画幅 W = 1.0, H = 0.64（双页高宽比 1.5625:1，书脊中缝位于 x = 0.50）
// 所有界面读数、四项原海报探针、天平梁倾角与画布绘制均只消费此模块的 computeSpread(state) 输出。

export const SPREAD_H = 0.64;
export const PIVOT_X = 0.5;
export const GUTTER_HALF = 0.032; // 中缝安全避让半宽（[0.468, 0.532] 属于装订折弯区）

export const SPECIMENS = {
  poster: {
    id: "poster",
    name: "原海报·蓝弧对开",
    tag: "POSTER SPECIMEN",
    titleZh: "非对称跨页",
    titleEn: "ASYMMETRICAL SPREAD",
    subZh: "重心偏移，创造张力与动态平衡",
    captionHead: "图像与留白的对话",
    captionEn: "DIALOGUE BETWEEN IMAGE AND WHITE SPACE",
    detailHead: "细节与节奏",
    guideHead: "引导视线",
    anchorDensity: 1.18,
    photoDensity: 0.78,
    coralDensity: 2.35,
    primaryColor: "#2250CD",
    primaryDeep: "#173BA3",
  },
  photo: {
    id: "photo",
    name: "摄影画册·留白叙事",
    tag: "PHOTO MONOGRAPH",
    titleZh: "海堤与光影",
    titleEn: "SEAWALL & LIGHT",
    subZh: "大片压左，让对页空白替画面呼吸",
    captionHead: "东岸潮汐记录 · 04",
    captionEn: "EAST COAST TIDE ARCHIVE",
    detailHead: "曝光笔记",
    guideHead: "画册页序",
    anchorDensity: 1.24,
    photoDensity: 0.82,
    coralDensity: 2.3,
    primaryColor: "#1B3F9E",
    primaryDeep: "#122B70",
  },
  arch: {
    id: "arch",
    name: "建筑年刊·跨缝错位",
    tag: "ARCHITECTURAL ANNUAL",
    titleZh: "斜切立面研究",
    titleEn: "OBLIQUE FACADE STUDY",
    subZh: "体量越过装订线，以小配重稳住长跨页",
    captionHead: "混凝土悬挑剖面",
    captionEn: "CANTILEVER ELEVATION",
    detailHead: "结构标尺",
    guideHead: "阅读指向",
    anchorDensity: 1.16,
    photoDensity: 0.84,
    coralDensity: 2.4,
    primaryColor: "#2049BC",
    primaryDeep: "#16358C",
  },
};

export const CORAL_LABELS = ["关（无配重）", "细点配重", "原海报半圆", "过重红海"];
export const TEXT_LABELS = {
  wall: "满塞字墙",
  tiered: "1宽2窄阶梯",
  minimal: "极简留白注",
  centered: "居中对称排",
};

export const PRESETS = {
  // 开场刻意停在 0/4 复合错态：蓝弧压过中缝撞字 + 右图偏大靠脊 + 无朱红配重 + 满塞字墙（两页油墨平摊、留白窒息）
  initial: {
    specimen: "poster",
    flipped: false,
    anchorReach: 0.575,
    photoX: 0.61,
    photoY: 0.35,
    photoScale: 1.18,
    coralSize: 0,
    coralX: 0.64,
    textMode: "wall",
    showGuides: true,
  },
  // 合法解 1：136 原海报经典平衡解（蓝弧恰切中缝黑支点 ● + 适度留白阶梯 + 底沿外侧珊瑚朱红半圆配平）
  sol_poster: {
    specimen: "poster",
    flipped: false,
    anchorReach: 0.495,
    photoX: 0.76,
    photoY: 0.30,
    photoScale: 0.92,
    coralSize: 2,
    coralX: 0.78,
    textMode: "tiered",
    showGuides: true,
  },
  // 合法解 2：跨缝牵引平衡解（主视觉越过书脊侵入右页 12% 缝合双页，右页让给大块留白 + 远力臂朱红半圆 + 极简短注）
  sol_bridge: {
    specimen: "arch",
    flipped: false,
    anchorReach: 0.56,
    photoX: 0.82,
    photoY: 0.27,
    photoScale: 0.76,
    coralSize: 2,
    coralX: 0.86,
    textMode: "minimal",
    showGuides: true,
  },
  // 合法解 3：右重左疏反拍解（验证「不限定左重」，只要偏移明确且对侧留白+暖色力臂平衡即可 4/4）
  sol_flip: {
    specimen: "photo",
    flipped: true,
    anchorReach: 0.50,
    photoX: 0.76,
    photoY: 0.31,
    photoScale: 0.88,
    coralSize: 2,
    coralX: 0.80,
    textMode: "tiered",
    showGuides: true,
  },
  // 反向试错 1：伪对称退化（左右体量近 1:1，重心不偏）
  err_sym: {
    specimen: "poster",
    flipped: false,
    anchorReach: 0.34,
    photoX: 0.75,
    photoY: 0.32,
    photoScale: 1.18,
    coralSize: 1,
    coralX: 0.75,
    textMode: "centered",
    showGuides: true,
  },
  // 反向试错 2：无配重左坠（只偏不平）
  err_left: {
    specimen: "poster",
    flipped: false,
    anchorReach: 0.51,
    photoX: 0.61,
    photoY: 0.31,
    photoScale: 0.80,
    coralSize: 0,
    coralX: 0.62,
    textMode: "minimal",
    showGuides: true,
  },
  // 反向试错 3：红海右倾反噬（暖色配重过大，喧宾夺主）
  err_right: {
    specimen: "poster",
    flipped: false,
    anchorReach: 0.42,
    photoX: 0.81,
    photoY: 0.28,
    photoScale: 1.16,
    coralSize: 3,
    coralX: 0.84,
    textMode: "tiered",
    showGuides: true,
  },
  // 反向试错 4：满塞字墙 + 跨缝吞字
  err_wall: {
    specimen: "poster",
    flipped: false,
    anchorReach: 0.59,
    photoX: 0.63,
    photoY: 0.36,
    photoScale: 1.0,
    coralSize: 2,
    coralX: 0.78,
    textMode: "wall",
    showGuides: true,
  },
};

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function rectOverlapArea(a, b) {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  return x1 > x0 && y1 > y0 ? (x1 - x0) * (y1 - y0) : 0;
}

// 将标准化坐标按是否左右反拍（flipped）映射为屏幕实绘坐标
function mapX(x, flipped) {
  return flipped ? 1 - x : x;
}
function mapRect(r, flipped) {
  return flipped
    ? { x: 1 - (r.x + r.w), y: r.y, w: r.w, h: r.h }
    : { ...r };
}

/**
 * 从当前状态计算完整的实绘几何、真实栅格留白率、光学力矩与 4 项探针诊单。
 * 单真源：画布、天平梁、四探针、诊单、按钮提示全部源自本返回值。
 */
export function computeSpread(rawState) {
  const s = {
    specimen: SPECIMENS[rawState.specimen] ? rawState.specimen : "poster",
    flipped: !!rawState.flipped,
    anchorReach: clamp(Number(rawState.anchorReach ?? 0.57), 0.24, 0.66),
    photoX: clamp(Number(rawState.photoX ?? 0.62), 0.52, 0.86),
    photoY: clamp(Number(rawState.photoY ?? 0.37), 0.19, 0.48),
    photoScale: clamp(Number(rawState.photoScale ?? 0.96), 0.60, 1.24),
    coralSize: clamp(Math.round(Number(rawState.coralSize ?? 0)), 0, 3),
    coralX: clamp(Number(rawState.coralX ?? 0.64), 0.54, 0.91),
    textMode: TEXT_LABELS[rawState.textMode] ? rawState.textMode : "wall",
    showGuides: rawState.showGuides !== false,
  };
  const spec = SPECIMENS[s.specimen];

  // 1. 主视觉几何（逻辑上在左侧，再根据 flipped 镜像到实绘坐标）
  // 原海报标本为左缘切入的大椭圆弧（顶点恰切 x = anchorReach）；摄影/建筑标本为满出血大色图幅
  const arcTop = 0.04;
  const arcBot = SPREAD_H - 0.04;
  const arcCy = SPREAD_H * 0.5;
  const arcRy = (arcBot - arcTop) * 0.5;
  // 椭圆中心定在左缘外侧一点，使其右缘恰落在 x = s.anchorReach
  const anchorCenterX = s.specimen === "poster" ? s.anchorReach - 0.56 : 0;
  const anchorRx = 0.56;
  const anchorLogical =
    s.specimen === "poster"
      ? { type: "arc", reach: s.anchorReach, cx: anchorCenterX, cy: arcCy, rx: anchorRx, ry: arcRy, top: arcTop, bot: arcBot }
      : { type: "rect", x: 0.0, y: s.specimen === "photo" ? 0.0 : 0.05, w: s.anchorReach, h: s.specimen === "photo" ? SPREAD_H : SPREAD_H - 0.10 };

  // 2. 右页暖灰中图框（逻辑上在右页）
  const basePhotoW = 0.29 * s.photoScale;
  const basePhotoH = 0.195 * s.photoScale;
  const photoLogical = {
    x: clamp(s.photoX - basePhotoW * 0.5, 0.505, 0.96 - basePhotoW),
    y: clamp(s.photoY - basePhotoH * 0.5, 0.09, SPREAD_H - 0.16 - basePhotoH),
    w: basePhotoW,
    h: basePhotoH,
  };
  // 记录规范后的中心
  const photoCxLogical = photoLogical.x + photoLogical.w * 0.5;
  const photoCyLogical = photoLogical.y + photoLogical.h * 0.5;

  // 3. 右页文字块（严格依据 textMode 生成实绘矩形，墙式会越界侵占订口并挤满右页）
  let textBlocksLogical = [];
  if (s.textMode === "wall") {
    textBlocksLogical = [
      { id: "lead", x: 0.482, y: 0.055, w: 0.485, h: 0.145, lines: 5, dense: true },
      { id: "mid", x: 0.485, y: photoLogical.y + photoLogical.h - 0.015, w: 0.482, h: 0.135, lines: 5, dense: true },
      { id: "foot", x: 0.485, y: SPREAD_H - 0.105, w: 0.482, h: 0.088, lines: 4, dense: true },
    ];
  } else if (s.textMode === "tiered") {
    // 1:1 复刻原海报右页顶部说明 + 下方 1宽2窄阶梯结构
    const topEnd = Math.min(photoLogical.y - 0.022, 0.175);
    const tierTop = clamp(photoLogical.y + photoLogical.h + 0.028, 0.36, 0.44);
    textBlocksLogical = [
      { id: "intro", x: 0.56, y: 0.085, w: 0.36, h: Math.max(0.068, topEnd - 0.085), lines: 3, dense: false },
      { id: "wide", x: 0.56, y: tierTop, w: 0.36, h: 0.056, lines: 2, dense: false },
      { id: "subL", x: 0.56, y: tierTop + 0.074, w: 0.165, h: 0.072, lines: 4, dense: false },
      { id: "subR", x: 0.755, y: tierTop + 0.074, w: 0.165, h: 0.072, lines: 0, diagram: true, dense: false },
    ];
  } else if (s.textMode === "minimal") {
    const noteY = clamp(photoLogical.y + photoLogical.h + 0.036, 0.37, 0.47);
    textBlocksLogical = [
      { id: "note", x: 0.62, y: noteY, w: 0.28, h: 0.068, lines: 2, dense: false },
    ];
  } else {
    // centered：传统居中对称排，与左页等宽等高镜像
    textBlocksLogical = [
      { id: "symTop", x: 0.60, y: 0.09, w: 0.28, h: 0.065, lines: 2, dense: false },
      { id: "symBot", x: 0.60, y: photoLogical.y + photoLogical.h + 0.03, w: 0.28, h: 0.11, lines: 4, dense: false },
    ];
  }

  // 4. 珊瑚朱红配重锚点（原海报底缘半圆）
  const coralRadiusTable = [0, 0.042, 0.084, 0.168];
  const coralR = coralRadiusTable[s.coralSize];
  const coralLogical = {
    size: s.coralSize,
    r: coralR,
    cx: clamp(s.coralX, 0.55 + coralR * 0.4, 0.94 - coralR * 0.4),
    cy: SPREAD_H, // 贴底缘探出的半圆
  };

  // 5. 高精度栅格积分（64 × 40 = 2560 采样格，单次耗时 < 0.08ms！）
  // 直接从真实覆盖像素算：面积、质心、净视觉力矩、实测留白率、重叠碰撞面积
  const NX = 64;
  const NY = 40;
  const cellW = 1 / NX;
  const cellH = SPREAD_H / NY;
  const cellArea = cellW * cellH;
  const totalSpreadArea = 1 * SPREAD_H;

  let anchorArea = 0;
  let anchorSumX = 0;

  let photoArea = 0;
  let photoSumX = 0;

  let textArea = 0;
  let textSumX = 0;

  let coralArea = 0;
  let coralSumX = 0;

  let coveredCells = 0;
  let leftInkCells = 0;
  let rightInkCells = 0;
  let overlapCells = 0;
  let textInGutterCells = 0;
  let anchorTextCrashCells = 0;

  for (let iy = 0; iy < NY; iy++) {
    const y = (iy + 0.5) * cellH;
    for (let ix = 0; ix < NX; ix++) {
      const x = (ix + 0.5) * cellW;

      // 是否命中主视觉
      let inAnchor = false;
      if (anchorLogical.type === "arc") {
        const dx = (x - anchorLogical.cx) / anchorLogical.rx;
        const dy = (y - anchorLogical.cy) / anchorLogical.ry;
        inAnchor = dx * dx + dy * dy <= 1 && y >= anchorLogical.top && y <= anchorLogical.bot;
      } else {
        inAnchor =
          x >= anchorLogical.x &&
          x <= anchorLogical.x + anchorLogical.w &&
          y >= anchorLogical.y &&
          y <= anchorLogical.y + anchorLogical.h;
      }

      // 是否命中暖灰图框
      const inPhoto =
        x >= photoLogical.x &&
        x <= photoLogical.x + photoLogical.w &&
        y >= photoLogical.y &&
        y <= photoLogical.y + photoLogical.h;

      // 是否命中正文块
      let inText = false;
      for (let k = 0; k < textBlocksLogical.length; k++) {
        const tb = textBlocksLogical[k];
        if (x >= tb.x && x <= tb.x + tb.w && y >= tb.y && y <= tb.y + tb.h) {
          inText = true;
          break;
        }
      }

      // 是否命中珊瑚配重半圆
      let inCoral = false;
      if (coralR > 0) {
        const cdx = x - coralLogical.cx;
        const cdy = y - coralLogical.cy;
        inCoral = cdx * cdx + cdy * cdy <= coralR * coralR && y <= SPREAD_H;
      }

      let layers = 0;

      if (inAnchor) {
        anchorArea += cellArea;
        anchorSumX += x * cellArea;
        layers++;
      }
      if (inPhoto) {
        photoArea += cellArea;
        photoSumX += x * cellArea;
        layers++;
      }
      if (inText) {
        textArea += cellArea;
        textSumX += x * cellArea;
        layers++;
        if (Math.abs(x - PIVOT_X) < GUTTER_HALF) textInGutterCells++;
      }
      if (inCoral) {
        coralArea += cellArea;
        coralSumX += x * cellArea;
        layers++;
      }

      if (layers > 0) {
        coveredCells++;
        if (x < PIVOT_X) leftInkCells++;
        else rightInkCells++;
      }
      if (layers >= 2) {
        overlapCells++;
        if (inAnchor && inText) anchorTextCrashCells++;
      }
    }
  }

  // 右页图与珊瑚/文字也做精确矩形检查，避免小块遗漏
  let photoTextCrashArea = 0;
  for (const tb of textBlocksLogical) {
    photoTextCrashArea += rectOverlapArea(photoLogical, tb);
  }

  const totalCells = NX * NY;
  const whitespacePct = Math.round(((totalCells - coveredCells) / totalCells) * 100);
  const rightWhitespacePct = Math.round(((totalCells * 0.5 - rightInkCells) / (totalCells * 0.5)) * 100);
  const overlapPct = Math.round((overlapCells / Math.max(1, coveredCells)) * 100);

  // 各元素实绘面积质心横坐标
  const anchorCx = anchorArea > 0 ? anchorSumX / anchorArea : 0.25;
  const photoCx = photoArea > 0 ? photoSumX / photoArea : photoCxLogical;
  const textCx = textArea > 0 ? textSumX / textArea : 0.74;
  const coralCx = coralArea > 0 ? coralSumX / coralArea : coralLogical.cx;

  // 视觉重量与光学力矩核算（基于阿恩海姆视知觉重量：面积呈亚线性幂律，高饱和暖色孤立锚点享强前进权重）
  const anchorWeight = anchorArea > 0 ? Math.pow(anchorArea, 0.62) * spec.anchorDensity : 0;
  const photoWeight = photoArea > 0 ? Math.pow(photoArea, 0.68) * spec.photoDensity : 0;
  const textWeight = textArea > 0 ? Math.pow(textArea, 0.72) * (s.textMode === "wall" ? 0.68 : 0.44) : 0;
  // 孤立留白加成：对页拥有主动留白场时，孤立暖色朱红锚点的视觉拉力显著增强
  const isolationBoost = rightWhitespacePct >= 42 ? 1.28 : rightWhitespacePct >= 34 ? 1.12 : 0.92;
  const coralWeight = coralArea > 0 ? Math.pow(coralArea, 0.52) * spec.coralDensity * 1.18 * isolationBoost : 0;

  const anchorMoment = anchorWeight * (anchorCx - PIVOT_X);
  const photoMoment = photoWeight * (photoCx - PIVOT_X);
  const textMoment = textWeight * (textCx - PIVOT_X);
  const coralMomentBoosted = coralWeight * (coralCx - PIVOT_X);

  const totalWeight = anchorWeight + photoWeight + textWeight + coralWeight;
  // 逻辑净力矩（负值表示偏向主视觉所在的逻辑左侧；正值表示偏向配重所在的逻辑右侧）
  const netMomentLogical = anchorMoment + photoMoment + textMoment + coralMomentBoosted;
  // 归一化力矩偏衡：除以（总重量 × 半页特征臂 0.24），得到直观示意偏移百分比
  const torqueRatioLogical = totalWeight > 0 ? netMomentLogical / (totalWeight * 0.24) : 0;
  // 映射到真实屏幕方向（flipped 时左重变右重）
  const screenTorqueRatio = s.flipped ? -torqueRatioLogical : torqueRatioLogical;
  const torqueImbalancePct = Math.round(clamp(screenTorqueRatio * 100, -95, 95));

  // 视觉重心横坐标（0–1，0.50 为中缝支点）
  const cgXLogical = totalWeight > 0 ? PIVOT_X + netMomentLogical / totalWeight : PIVOT_X;
  const cgX = mapX(cgXLogical, s.flipped);

  // 面积体量比（主视觉 vs 副图）与左右油墨面积不对称度
  const anchorPct = Math.round((anchorArea / totalSpreadArea) * 100);
  const photoPct = Math.round((photoArea / totalSpreadArea) * 100);
  const contrastRatio = photoArea > 0 ? Number((anchorArea / photoArea).toFixed(2)) : 4.0;
  const leftShare = leftInkCells / Math.max(1, leftInkCells + rightInkCells);
  const rightShare = rightInkCells / Math.max(1, leftInkCells + rightInkCells);
  // 屏幕左右实际面积占比
  const screenLeftShare = Math.round((s.flipped ? rightShare : leftShare) * 100);
  const screenRightShare = 100 - screenLeftShare;
  const asymmetryGap = Math.abs(leftShare - rightShare); // 0 = 完全五五对称，越大越偏

  // 检查文字或图片撞击与压脊
  const textHitsGutter = textInGutterCells > 0;
  const hasCrash = anchorTextCrashCells > 1 || overlapPct >= 6 || photoTextCrashArea > 0.002;
  const anchorInvadesTooFar = s.anchorReach > 0.61;
  const isPseudoSym =
    (s.textMode === "centered" && asymmetryGap < 0.24) ||
    (asymmetryGap < 0.14 && contrastRatio < 1.75);
  const isTooEmpty = whitespacePct > 77;
  // 对页留白不足（或整页满塞 < 25%）判为留白窒息
  const isSuffocated = rightWhitespacePct < 34 || whitespacePct < 25;
  const heavySideTilt = Math.abs(torqueImbalancePct) > 16;
  const coralOverpowers = s.coralSize === 3 && coralWeight >= anchorWeight * 0.62;

  // 6. 四项原海报关键词实时探针判定
  // (1) 重心 CENTER OF GRAVITY：主视觉体量明确偏置（不退化成伪对称，且不被右页墙式铺满拉平油墨占比）
  const gravityOk = !isPseudoSym && !isTooEmpty && anchorPct >= 25 && asymmetryGap >= 0.16 && !isSuffocated;
  // (2) 张力 TENSION：主次体量拉出反差 + 主动留白对话 + 无图文相撞
  const tensionOk = contrastRatio >= 1.65 && !isSuffocated && !hasCrash && !coralOverpowers;
  // (3) 偏移 OFFSET：文字避开书脊吞噬带，蓝弧/主视觉跨缝不撞字、不过度侵入
  const offsetOk = !textHitsGutter && !anchorInvadesTooFar && anchorTextCrashCells === 0;
  // (4) 动态平衡 DYNAMIC BALANCE：在偏移前提下，靠力臂与暖色配重稳住净力矩（|失衡| ≤ 15%）
  const balanceOk = !heavySideTilt && !coralOverpowers && (s.coralSize >= 1 || Math.abs(torqueImbalancePct) <= 12);

  const checks = { gravity: gravityOk, tension: tensionOk, offset: offsetOk, balance: balanceOk };
  const passCount = [gravityOk, tensionOk, offsetOk, balanceOk].filter(Boolean).length;

  // 7. 单真源诊单（覆盖 8 类双向真错态 + 多组合法解识别）
  let code = "ok";
  let badge = `${passCount}/4 · 动态平衡`;
  let title = "";
  let why = "";
  let action = "";
  let fixLabel = "";
  let fixAction = "sol_poster";
  let tone = "ok"; // "ok" | "bad"

  if (textHitsGutter || anchorTextCrashCells > 2) {
    code = "gutter_crash";
    tone = "bad";
    badge = `${passCount}/4 · 跨缝压字`;
    title = "文字跌进装订中缝，还被主视觉弧边压住";
    why =
      "实体跨页的中缝在翻开时会向书脊折弯。纯色大弧或背景风景可以跨缝缝合双页，但正文一旦越进中缝 3% 折谷或与色块相撞，阅读动线会立刻卡死。";
    action = "把右页文字切换为「1宽2窄阶梯」避开书脊安全带，并把主视觉蓝弧回拉至中缝黑支点 ● 附近。";
    fixLabel = "避开书脊并理出阶梯";
    fixAction = "fix_gutter";
  } else if (isPseudoSym) {
    code = "pseudo_sym";
    tone = "bad";
    badge = `${passCount}/4 · 退化对称`;
    title = "左右体量近乎平权，退化成了静态对称";
    why = `目前屏幕左右油墨占比约 ${screenLeftShare}:${screenRightShare}，主次面积比只有 ${contrastRatio}×。重心没有真正移开，版面既少了非对称的跨缝张力，也不像严谨的镜像对称。`;
    action = "把主视觉大弧向右推至书脊黑圆支点 ●（约 48%–56%），并把右侧改为错落阶梯，拉开主次反差。";
    fixLabel = "推开重心反差";
    fixAction = "fix_asym";
  } else if (isSuffocated) {
    code = "suffocated";
    tone = "bad";
    badge = `${passCount}/4 · 留白窒息`;
    title = `右页留白仅剩 ${rightWhitespacePct}%，图像失去了呼吸对手`;
    why =
      "非对称跨页的核心不是用字填满另一页，而是「图像与留白的对话」。把对页塞成密不透风的字墙后，左页大色块的体量优势被彻底闷死。";
    action = "点击画布右页正文或下方按钮，切换为「1宽2窄阶梯」或「极简留白注」，腾出至少 35% 以上的呼吸空白。";
    fixLabel = "腾出右页呼吸留白";
    fixAction = "fix_whitespace";
  } else if (hasCrash) {
    code = "overlap";
    tone = "bad";
    badge = `${passCount}/4 · 图文叠撞`;
    title = "暖灰图像框与其他模块相撞，秩序被打断";
    why = `当前实测元素叠压占已铺面积的 ${overlapPct}%。非对称不是随手乱堆，模块之间必须保住清晰的留白走廊，视线才能从主视觉顺滑过渡到文字与配重。`;
    action = "直接在画布上拖动暖灰图像框向上或向外切边挪开，清出图文之间的呼吸缝。";
    fixLabel = "拉开图文间距";
    fixAction = "fix_overlap";
  } else if (coralOverpowers || (heavySideTilt && torqueRatioLogical > 0)) {
    code = "right_tilt";
    tone = "bad";
    badge = `${passCount}/4 · 配重反噬`;
    title = `${s.flipped ? "左侧" : "右侧"}暖色配重过头，喧宾夺主（示意偏衡 ${torqueImbalancePct > 0 ? "+" : ""}${torqueImbalancePct}%）`;
    why =
      "高饱和珊瑚朱红在视知觉中属于「前进的暖色」，单位面积的光学重量远高于冷色蓝弧。配重块放得太大时，它会抢走主视觉的领头地位，把天平反向压翻。";
    action = "点击珊瑚朱红半圆将其收回到「原海报半圆」或「细点配重」，让小而浓烈的暖色稳稳托住而非压垮大蓝弧。";
    fixLabel = "收小珊瑚暖色配重";
    fixAction = "fix_coral_down";
  } else if (heavySideTilt && torqueRatioLogical < 0) {
    code = "left_tilt";
    tone = "bad";
    badge = `${passCount}/4 · ${s.flipped ? "右坠失衡" : "左坠失衡"}`;
    title = `重心只偏不平，跨页向${s.flipped ? "右" : "左"}沉坠（示意偏衡 ${torqueImbalancePct}%）`;
    why =
      s.coralSize === 0
        ? "一侧压着大面积群青色块，对侧却没有高饱和暖色锚点来拉住力矩，整本摊开的书像要从重的一侧滑下桌沿。"
        : "虽然加了配重，但它靠书脊太近（力臂太短），杠杆力矩还不足以托住对侧的大体量色块。";
    action =
      s.coralSize === 0
        ? "点击下方「原海报半圆」加上底缘珊瑚朱红配重，或把它拖向远离书脊的外切边拉长力臂。"
        : "直接拖动底缘的珊瑚朱红半圆向外切边滑动，拉长光学力臂直到天平梁归平。";
    fixLabel = s.coralSize === 0 ? "加上底缘珊瑚配重" : "拉长配重力臂";
    fixAction = "fix_balance";
  } else if (anchorInvadesTooFar) {
    code = "invade_far";
    tone = "bad";
    badge = `${passCount}/4 · 跨缝过深`;
    title = "主视觉越过书脊太深，挤压了对页舞台";
    why = "跨缝牵引通常控制在对页的 8%–18% 即可打破书脊隔断；侵入过深会挤碎右侧图文的留白结构。";
    action = "横拖蓝弧前沿回退一点，留出从容的对页空白场。";
    fixLabel = "收束跨缝深度";
    fixAction = "fix_reach";
  } else if (isTooEmpty) {
    code = "too_empty";
    tone = "bad";
    badge = `${passCount}/4 · 空荡散架`;
    title = `整页留白达 ${whitespacePct}%，跨页断成了两张孤纸`;
    why = "留白过头且元素彼此太远时，眼睛无法在两页之间建立跨缝引力，张力随之消失。";
    action = "把主视觉向右推近书脊支点 ●，适当放大中图框让两翼彼此呼应。";
    fixLabel = "拉近跨页引力";
    fixAction = "fix_empty";
  } else if (contrastRatio < 1.65) {
    code = "flat_scale";
    tone = "bad";
    badge = `${passCount}/4 · 主次拉平`;
    title = `主视觉与副图面积比仅 ${contrastRatio}×，缺乏第一落点`;
    why = "大小太接近的两个色块会让视线在左右之间犹豫打架。非对称跨页需要先用大块头稳稳抓住眼睛，再把视线递给精致的次级细节。";
    action = "把主视觉推宽或略微收小暖灰图像框，拉出 1.7× 以上的体量反差。";
    fixLabel = "拉开主次反差";
    fixAction = "fix_contrast";
  } else {
    // 4/4 全通过 —— 识别具体合法解类型
    tone = "ok";
    const modeName = s.flipped
      ? "右重左疏反拍解"
      : s.anchorReach > 0.525
      ? "跨缝牵引平衡解"
      : s.specimen === "poster" && s.textMode === "tiered"
      ? "原海报经典平衡解"
      : "动态平衡合法解";
    badge = `4/4 · ${modeName}`;
    title = `${modeName}成立：重心偏移而力矩稳住`;
    why = `屏幕左右油墨面积呈 ${screenLeftShare}:${screenRightShare} 的清晰反差，主次体量差达 ${contrastRatio}×，同时依靠远力臂暖色配重与 ${whitespacePct}% 的主动呼吸留白，将净视觉偏衡稳稳收束在 ${torqueImbalancePct > 0 ? "+" : ""}${torqueImbalancePct}%（示意）。`;
    action = "你还可以切换「右重左疏反拍」「跨缝牵引」或按 Space 演练视线流，验证多组合法解如何共用同一套光学杠杆。";
    fixLabel = "演练跨页视线流";
    fixAction = "play_flow";
  }

  // 8. 探针短状态签（与诊单单真源严格一致）
  const probeTags = {
    gravity: {
      ok: gravityOk,
      label: gravityOk
        ? `${s.flipped ? "右重" : "左重"} ${Math.max(screenLeftShare, screenRightShare)}:${Math.min(screenLeftShare, screenRightShare)}`
        : isPseudoSym
        ? "退化对称"
        : isTooEmpty
        ? "空荡失重"
        : "偏移不足",
    },
    tension: {
      ok: tensionOk,
      label: tensionOk
        ? `反差 ${contrastRatio}×`
        : isSuffocated
        ? `留白 ${rightWhitespacePct}%`
        : hasCrash
        ? "图文叠撞"
        : coralOverpowers
        ? "红块抢戏"
        : `拉平 ${contrastRatio}×`,
    },
    offset: {
      ok: offsetOk,
      label: offsetOk
        ? s.anchorReach > 0.525
          ? `跨缝 +${Math.round((s.anchorReach - 0.5) * 100)}%`
          : "切轴避脊"
        : textHitsGutter
        ? "压脊吞字"
        : "侵入过深",
    },
    balance: {
      ok: balanceOk,
      label: balanceOk
        ? `力矩 ${torqueImbalancePct > 0 ? "+" : ""}${torqueImbalancePct}%`
        : torqueImbalancePct < 0
        ? `左坠 ${torqueImbalancePct}%`
        : `右坠 +${torqueImbalancePct}%`,
    },
  };

  // 9. 映射为屏幕实绘几何（供 Canvas 渲染与点击命中测试直接消费）
  const screenPhoto = mapRect(photoLogical, s.flipped);
  const screenTextBlocks = textBlocksLogical.map((tb) => ({ ...tb, ...mapRect(tb, s.flipped) }));
  const screenCoral = {
    size: coralLogical.size,
    r: coralLogical.r,
    cx: mapX(coralLogical.cx, s.flipped),
    cy: coralLogical.cy,
  };
  const screenAnchor =
    anchorLogical.type === "arc"
      ? {
          type: "arc",
          flipped: s.flipped,
          reachX: mapX(anchorLogical.reach, s.flipped),
          cx: mapX(anchorLogical.cx, s.flipped),
          cy: anchorLogical.cy,
          rx: anchorLogical.rx,
          ry: anchorLogical.ry,
          top: anchorLogical.top,
          bot: anchorLogical.bot,
        }
      : {
          type: "rect",
          flipped: s.flipped,
          ...mapRect(anchorLogical, s.flipped),
          reachX: mapX(anchorLogical.w, s.flipped),
        };

  // 视线演练关键节点（沿原海报：主视觉核心 → 书脊黑支点 → 暖灰中图 → 阶梯正文 → 珊瑚配重）
  const flowPoints = [
    { x: mapX(clamp(s.anchorReach * 0.48, 0.14, 0.36), s.flipped), y: SPREAD_H * 0.44, tag: "主视觉锚" },
    { x: PIVOT_X, y: SPREAD_H * 0.48, tag: "书脊支点" },
    { x: screenPhoto.x + screenPhoto.w * 0.5, y: screenPhoto.y + screenPhoto.h * 0.5, tag: "图白对话" },
    {
      x: screenTextBlocks[0] ? screenTextBlocks[0].x + screenTextBlocks[0].w * 0.5 : mapX(0.74, s.flipped),
      y: screenTextBlocks[screenTextBlocks.length - 1]
        ? screenTextBlocks[screenTextBlocks.length - 1].y + 0.03
        : 0.47,
      tag: "细节节奏",
    },
    {
      x: coralR > 0 ? screenCoral.cx : mapX(0.86, s.flipped),
      y: coralR > 0 ? SPREAD_H - coralR * 0.52 : SPREAD_H - 0.05,
      tag: coralR > 0 ? "暖色配重" : "视线滑出",
    },
  ];

  // 态势档位（不假精确，给出清晰档位）
  const stanceLabel =
    passCount === 4
      ? "动态平衡（示意）"
      : passCount >= 2
      ? "局部失衡（示意）"
      : "多重失序（示意）";

  return {
    state: s,
    spec,
    geom: {
      anchor: screenAnchor,
      photo: screenPhoto,
      textBlocks: screenTextBlocks,
      coral: screenCoral,
      photoCxLogical,
      photoCyLogical,
      flowPoints,
    },
    metrics: {
      whitespacePct,
      rightWhitespacePct,
      overlapPct,
      anchorPct,
      photoPct,
      contrastRatio,
      screenLeftShare,
      screenRightShare,
      torqueImbalancePct,
      cgX,
      coralArmPct: Math.round(Math.abs(coralLogical.cx - PIVOT_X) * 200), // 距书脊半页占比 0–100%
      textHitsGutter,
      hasCrash,
      stanceLabel,
    },
    checks,
    passCount,
    probeTags,
    diag: { code, tone, badge, title, why, action, fixLabel, fixAction },
  };
}

/**
 * 一步纠偏执行器：点击诊单按钮时只修正当前最高优先级问题，让读者一步步看见因果变化。
 */
export function applyFix(state, fixAction) {
  const next = { ...state };
  switch (fixAction) {
    case "fix_gutter":
      next.textMode = "tiered";
      next.anchorReach = 0.495;
      next.photoX = 0.76;
      next.photoY = 0.30;
      next.photoScale = 0.92;
      return next;
    case "fix_asym":
      next.anchorReach = 0.495;
      next.textMode = "tiered";
      next.photoScale = 0.92;
      return next;
    case "fix_whitespace":
      next.textMode = "tiered";
      if (next.photoY > 0.33) next.photoY = 0.30;
      return next;
    case "fix_overlap":
      next.photoX = 0.76;
      next.photoY = 0.29;
      next.photoScale = 0.90;
      return next;
    case "fix_coral_down":
      next.coralSize = 2;
      next.coralX = 0.76;
      return next;
    case "fix_balance":
      next.coralSize = 2;
      next.coralX = 0.78;
      if (next.photoX < 0.72) next.photoX = 0.76;
      return next;
    case "fix_reach":
      next.anchorReach = 0.54;
      return next;
    case "fix_empty":
      next.anchorReach = 0.495;
      next.photoScale = 0.92;
      next.coralSize = 2;
      return next;
    case "fix_contrast":
      next.anchorReach = Math.max(0.49, next.anchorReach);
      next.photoScale = 0.88;
      return next;
    default:
      return { ...PRESETS.sol_poster, specimen: state.specimen };
  }
}

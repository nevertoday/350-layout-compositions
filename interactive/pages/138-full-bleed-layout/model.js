// 138 满出血 版式 · 单真源几何与印前裁切评估引擎
// 所有画布坐标、毫米读数、四项原海报探针与白话诊单均由此处同一套几何运算派生。

export const SHEET = {
  trimW: 210, // A4 成品宽 (mm)
  trimH: 297, // A4 成品高 (mm)
  rawW: 236,  // 含出血与角标余量的展示印张宽 (mm, 参考 ISO 217 SRA4 225×320mm)
  rawH: 324,  // 展示印张高 (mm)
  titleXBase: 0,
  titleY: 42,
  titleW: 68, // 左侧大标区实测占宽 (mm)
  titleH: 76, // 大标区占高 (mm)
};

export const SPECIMENS = {
  poster: {
    id: "poster",
    name: "原海报 · 红黑构成",
    short: "原海报构成",
    tag: "ISO A4 · 210×297mm",
    bg: "#F72F02",
    fg: "#070707",
    accent: "#F5F3EE",
    mark: "#001CE7",
    headline: ["满出血", "版式"],
    subEn: ["FULL-BLEED", "LAYOUT"],
  },
  arch: {
    id: "arch",
    name: "建筑画册 · 巨构摄影",
    short: "建筑画册",
    tag: "MONOGRAPH · 210×297mm",
    bg: "#19242E",
    fg: "#F5F3EE",
    accent: "#F72F02",
    mark: "#5D8BFF",
    headline: ["巨构", "边界"],
    subEn: ["CONCRETE", "HORIZON"],
  },
  festival: {
    id: "festival",
    name: "音乐节 · 满版海报",
    short: "音乐节海报",
    tag: "POSTER · 210×297mm",
    bg: "#0B0B0D",
    fg: "#F5F3EE",
    accent: "#F72F02",
    mark: "#3861FF",
    headline: ["声浪", "破界"],
    subEn: ["SONIC EDGE", "LIVE 2026"],
  },
};

export const INITIAL_STATE = {
  specimen: "poster",
  bleedMm: -10.0,   // 退缩 10mm 白框（非满出血坏态）
  cropPct: 0,       // 主体黑圆缩在框内 0% 破边
  safeMm: 1.5,      // 标题紧贴左刀口 1.5mm（切字险）
  bladeTol: 1.2,    // 常见商业切纸机走刀公差 ±1.2mm
  trimmed: false,   // false = 展开印张检视；true = 已落刀实切
  showGuides: true, // 显示三道印前线与裁切角标
};

export const PRESETS = {
  classic: {
    id: "classic",
    label: "原海报经典解",
    bleedMm: 3.5,
    cropPct: 44,
    safeMm: 12.0,
    bladeTol: 1.2,
  },
  boldCrop: {
    id: "boldCrop",
    label: "强沉浸大破边解",
    bleedMm: 4.5,
    cropPct: 52,
    safeMm: 10.0,
    bladeTol: 1.2,
  },
  airySafe: {
    id: "airySafe",
    label: "宽安全留气解",
    bleedMm: 3.0,
    cropPct: 26,
    safeMm: 15.0,
    bladeTol: 1.2,
  },
  errZeroBleed: {
    id: "errZeroBleed",
    label: "试错：0mm 假满版",
    bleedMm: 0.0,
    cropPct: 40,
    safeMm: 12.0,
    bladeTol: 1.2,
  },
  errTextChop: {
    id: "errTextChop",
    label: "试错：贴边切字",
    bleedMm: 3.5,
    cropPct: 40,
    safeMm: 1.0,
    bladeTol: 1.2,
  },
  errOverCrop: {
    id: "errOverCrop",
    label: "试错：过裁失认",
    bleedMm: 3.5,
    cropPct: 64,
    safeMm: 12.0,
    bladeTol: 1.2,
  },
  errCollide: {
    id: "errCollide",
    label: "试错：退过头撞图",
    bleedMm: 3.5,
    cropPct: 26,
    safeMm: 24.0,
    bladeTol: 1.2,
  },
  errOverBleed: {
    id: "errOverBleed",
    label: "试错：过放侵角标",
    bleedMm: 9.5,
    cropPct: 40,
    safeMm: 12.0,
    bladeTol: 1.2,
  },
  resetBroken: {
    id: "resetBroken",
    label: "复原开场坏态",
    ...INITIAL_STATE,
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round1 = (v) => Math.round(v * 10) / 10;

export function createState() {
  return { ...INITIAL_STATE };
}

// 计算主体圆形/巨构块在 A4 坐标系（0..210, 0..297）里的真实位置与实测破边比
export function computeSubjectGeom(cropPct, bleedMm) {
  const c = clamp(cropPct, 0, 66);
  // cropPct = 0 时，主体胆怯缩小并躲在色块右缘内侧；随 cropPct 增加，圆面扩大并向右侧刀口推出
  const r = 44 + 44 * Math.min(1, c / 38); // 44mm -> 88mm
  const insetRight = Math.min(0, bleedMm); // 负出血时色块右缘内缩
  let cx;
  if (c <= 6) {
    const t = c / 6;
    const cagedCx = SHEET.trimW + insetRight - 10 - r;
    const touchCx = SHEET.trimW - r;
    cx = cagedCx + (touchCx - cagedCx) * t;
  } else {
    const overFrac = (c - 6) / 100; // 0..0.60 -> 实际破边最高 ~62%
    const overhang = overFrac * (2 * r) * 1.08;
    cx = SHEET.trimW - r + overhang;
  }
  const cy = SHEET.trimH * 0.505;
  const leftMm = cx - r;
  const rightMm = cx + r;
  const overhangMm = Math.max(0, rightMm - SHEET.trimW);
  const actualCropPct = Math.round(clamp((overhangMm / (2 * r)) * 100, 0, 75));
  return { cx, cy, r, leftMm, rightMm, overhangMm, actualCropPct };
}

// 单真源综合评估：所有指标、状态徽标与白话原因均由此产出
export function evaluate(state) {
  const bleedMm = round1(clamp(state.bleedMm, -14, 10));
  const safeMm = round1(clamp(state.safeMm, -1, 24));
  const bladeTol = round1(clamp(state.bladeTol, 0, 1.8));
  const cropPct = Math.round(clamp(state.cropPct, 0, 66));

  // 1. 实绘色块范围与成品覆盖率
  const artLeft = -bleedMm;
  const artTop = -bleedMm;
  const artRight = SHEET.trimW + bleedMm;
  const artBottom = SHEET.trimH + bleedMm;

  const visW = clamp(Math.min(SHEET.trimW, artRight) - Math.max(0, artLeft), 0, SHEET.trimW);
  const visH = clamp(Math.min(SHEET.trimH, artBottom) - Math.max(0, artTop), 0, SHEET.trimH);
  const coveragePct = Math.round((visW * visH) / (SHEET.trimW * SHEET.trimH) * 100);

  // 2. 纸堆在切纸机压纸器下整体偏移 ±bladeTol 时的实测物理后果：
  //    右/下刀口偏向画外 +bladeTol → 若 bleedMm < bladeTol，立刻撕开露白缝
  //    左/上刀口偏向画内 +bladeTol → 若 safeMm < bladeTol，直接切掉标题笔画
  const whiteMarginMm = bleedMm < 0 ? round1(Math.abs(bleedMm)) : 0;
  const sliverMm = bleedMm < 0
    ? round1(Math.abs(bleedMm) + bladeTol)
    : round1(Math.max(0, bladeTol - bleedMm));

  const minBleedRequired = round1(Math.max(2.5, bladeTol + 1.0));
  const maxBleedAllowed = 8.0;

  // 3. 主体几何与破边实测
  const subject = computeSubjectGeom(cropPct, bleedMm);
  const actualCropPct = subject.actualCropPct;

  // 4. 文字包围盒与安全距 / 撞图检测
  const textBox = {
    x: safeMm,
    y: SHEET.titleY,
    w: SHEET.titleW,
    h: SHEET.titleH,
    right: round1(safeMm + SHEET.titleW),
  };
  const safeAfterShiftMm = round1(safeMm - bladeTol);
  const textChoppedMm = round1(Math.max(0, bladeTol - safeMm));
  const minSafeRequired = round1(Math.max(5.5, bladeTol + 4.0));
  const textGapToSubjectMm = round1(subject.leftMm - textBox.right);
  const textCollides = textGapToSubjectMm < 4.0;

  // 5. 四大维度真值判定（严格对应 138 原海报四词：边缘 / 裁切 / 沉浸 / 冲击）
  const isMarginTrapped = bleedMm < 0;
  const isZeroBleedRisk = !isMarginTrapped && bleedMm < minBleedRequired;
  const isOverBleed = bleedMm > maxBleedAllowed;
  const edgeOk = !isMarginTrapped && !isZeroBleedRisk && !isOverBleed;

  const isTextDanger = safeMm < minSafeRequired;
  const safeOk = !isTextDanger && !textCollides;

  const isTimidCrop = actualCropPct < 16;
  const isOverCrop = actualCropPct > 56;
  const immersionOk = !isTimidCrop && !isOverCrop;

  const impactOk = coveragePct === 100 && sliverMm === 0 && edgeOk && immersionOk && !textCollides;

  const passedCount = [edgeOk, safeOk, immersionOk, impactOk].filter(Boolean).length;

  // 6. 最高优先级错态诊断（双向 8 类真错态）
  let issueCode = "ok";
  let badge = "4/4 · 满出血成立";
  let headline = "四面稳压刀口，外破边、内守界";
  let why = `色块越过裁切线 +${bleedMm.toFixed(1)}mm，完整吞掉 ±${bladeTol.toFixed(1)}mm 走刀公差；核心主体大胆破边 ${actualCropPct}% 带来无限延展感，同时标题稳守在 ${safeMm.toFixed(1)}mm 安全区内，距黑圆还有 ${textGapToSubjectMm.toFixed(1)}mm 呼吸缝。`;
  let actionHint = state.trimmed
    ? "已落刀验真：四边零露白、文字零裁损。可点击「展开印张」继续换标本或做反向试错。"
    : "按空格或点击「落刀裁切」，亲眼看钢刀切下废纸边后的零露白成品。";
  let fixPreset = null;
  let fixLabel = "落刀验真成品";
  let posture = "满出血成立（示意）";

  if (isMarginTrapped) {
    issueCode = "margin-trapped";
    badge = `${passedCount}/4 · 白框锁边 ${whiteMarginMm.toFixed(1)}mm`;
    headline = `画面内缩 ${whiteMarginMm.toFixed(1)}mm，被白边框关在盒子里`;
    why = `现在有效视觉只占成品纸面的 ${coveragePct}%，四周露出整圈白框——这已经退化成「无出血版式」，眼睛看到的是纸上贴着一张小画，完全没有满出血的破界沉浸感。`;
    actionHint = "在印前实切台上直接向右横拖，把朱红底面越过蓝虚线裁切口，一直推到 +3mm 红色出血带里。";
    fixPreset = "classic";
    fixLabel = "一键校准标准 3.5mm 满出血";
    posture = passedCount === 0 ? "四重失守（示意）" : "白框受限（示意）";
  } else if (isZeroBleedRisk) {
    issueCode = "zero-bleed-sliver";
    badge = `${passedCount}/4 · ${sliverMm > 0 ? `露白 ${sliverMm.toFixed(1)}mm` : "余量不足"}`;
    headline = sliverMm > 0
      ? `出血仅 +${bleedMm.toFixed(1)}mm，一落刀就撕开 ${sliverMm.toFixed(1)}mm 露白边`
      : `出血 +${bleedMm.toFixed(1)}mm 离 ±${bladeTol.toFixed(1)}mm 走刀公差太近`;
    why = `在电脑屏幕上 0mm 顶边看起来像满出血，但胶印机压纸叠切时切刀必然有 ±${bladeTol.toFixed(1)}mm 机械漂移。只要色块没提前外扩至少 ${minBleedRequired.toFixed(1)}mm，成品边缘就会露出刺眼的白纸丝。`;
    actionHint = `把背景出血继续向外推到 +3.0mm 至 +5.0mm（国际通行标准 3mm / 1/8 in），再落刀实切看白缝彻底消失。`;
    fixPreset = "classic";
    fixLabel = "外扩至 +3.5mm 吞掉公差";
    posture = "露白高危（示意）";
  } else if (isOverBleed) {
    issueCode = "over-bleed";
    badge = `${passedCount}/4 · 过放 +${bleedMm.toFixed(1)}mm`;
    headline = `出血放到了 +${bleedMm.toFixed(1)}mm，把裁切角标都吞掉了`;
    why = `满出血不是放得越宽越好。超出 8mm 后，外扩色块会盖住四角裁切线与套准标，不仅干扰印厂对刀，还会挤占大张拼版（如 SRA4/SRA3）的纸张利用率、平白增加废纸成本。`;
    actionHint = "把背景出血收回 3.0mm–6.0mm 标准区间，让裁切角线与套准标清楚露在印张白边上。";
    fixPreset = "classic";
    fixLabel = "收回到 +3.5mm 标准出血";
    posture = "过度放血（示意）";
  } else if (isTextDanger) {
    issueCode = "text-chopped";
    badge = `${passedCount}/4 · ${textChoppedMm > 0 ? `切字 ${textChoppedMm.toFixed(1)}mm` : `距刀 ${safeMm.toFixed(1)}mm`}`;
    headline = textChoppedMm > 0
      ? `标题距刀口仅 ${safeMm.toFixed(1)}mm，走刀一偏直接削掉笔画`
      : `文字只退进 ${safeMm.toFixed(1)}mm，贴着纸边喘不过气`;
    why = `满出血只让背景与装饰图形越界，绝不让文字跟着顶边。当前走刀公差 ±${bladeTol.toFixed(1)}mm，左刀向内偏一点，标题净余仅 ${safeAfterShiftMm.toFixed(1)}mm，既容易切字又会让读者觉得版面紧绷失手。`;
    actionHint = `向右拖动「满出血 版式」标题块，或把文字安全距调到 ${minSafeRequired.toFixed(1)}mm 以上（印前经验值 6–12mm）。`;
    fixPreset = "classic";
    fixLabel = "把文字拉回 12mm 安全区";
    posture = "切字警报（示意）";
  } else if (textCollides) {
    issueCode = "text-collide";
    badge = `${passedCount}/4 · 文字撞图`;
    headline = `安全距退过头了，标题一头撞上右侧黑圆`;
    why = `文字右缘（${textBox.right.toFixed(1)}mm）与主图形左缘（${subject.leftMm.toFixed(1)}mm）之间只剩 ${textGapToSubjectMm.toFixed(1)}mm，黑字压进黑圆立刻糊成一团。安全距要「护字不撞主图」，不能盲目往中间硬塞。`;
    actionHint = "把标题往左微调回 10–14mm，或者把右侧主图形继续向外推破边界，重新拉出干净的朱红呼吸带。";
    fixPreset = "classic";
    fixLabel = "拉开标题与主图形间距";
    posture = "反向撞图（示意）";
  } else if (isTimidCrop) {
    issueCode = "no-crop-timid";
    badge = `${passedCount}/4 · 主体缩框 ${actualCropPct}%`;
    headline = `底色虽然满出血了，但主体黑圆还缩在框里不敢破边`;
    why = `只是把纯色底铺到边远远不够。现在核心主体仅破边 ${actualCropPct}%，整张图仍像在红纸上放了一枚小贴纸；只有让主图形大胆穿过刀口、由大脑在纸外补全完整轮廓，沉浸感与冲击力才会真正炸开。`;
    actionHint = "直接抓住画布里的黑色大圆往右刀口拖出去，把破边裁切推到 20%–52%。";
    fixPreset = "classic";
    fixLabel = "推出主图形破边 44%";
    posture = "张力不足（示意）";
  } else if (isOverCrop) {
    issueCode = "over-cropped";
    badge = `${passedCount}/4 · 过裁 ${actualCropPct}%`;
    headline = `主体被切掉了 ${actualCropPct}%，画面失去完整锚点`;
    why = `破边裁切讲求「切而不残」：读者要能从留下的弧面或结构瞬间脑补出整件物体。现在超过一半主体滑出裁切线，画面只剩边缘一道黑边，视觉重心反而坍塌了。`;
    actionHint = "把主图形往画内拉回一点，让破边裁切停在 20%–52% 之间，既破界又保辨识度。";
    fixPreset = "classic";
    fixLabel = "拉回主图形至 44% 破边";
    posture = "过裁失认（示意）";
  }

  // 7. 原海报四词探针状态（边缘 / 裁切 / 沉浸 / 冲击）
  const probes = [
    {
      key: "edge",
      zh: "边缘",
      en: "EDGE",
      ok: edgeOk,
      tag: isMarginTrapped
        ? `白框 ${whiteMarginMm.toFixed(1)}mm`
        : isOverBleed
          ? `过放 +${bleedMm.toFixed(1)}mm`
          : isZeroBleedRisk
            ? `露白险 ${sliverMm.toFixed(1)}mm`
            : `+${bleedMm.toFixed(1)}mm 稳压`,
      desc: "底色越过裁切线至少 3mm，吃掉机械走刀误差。",
    },
    {
      key: "crop",
      zh: "裁切",
      en: "CROP",
      ok: safeOk,
      tag: isTextDanger
        ? `切字险 ${safeMm.toFixed(1)}mm`
        : textCollides
          ? `撞图 ${textGapToSubjectMm.toFixed(1)}mm`
          : `安全 ${safeMm.toFixed(1)}mm`,
      desc: "文字与识别信息内守安全区，绝不和刀口或主图相撞。",
    },
    {
      key: "immersion",
      zh: "沉浸",
      en: "IMMERSION",
      ok: immersionOk,
      tag: isTimidCrop
        ? `缩框 ${actualCropPct}%`
        : isOverCrop
          ? `过裁 ${actualCropPct}%`
          : `破边 ${actualCropPct}%`,
      desc: "主体图形大胆跨越纸边，靠视觉完形把空间延伸到画外。",
    },
    {
      key: "impact",
      zh: "冲击",
      en: "IMPACT",
      ok: impactOk,
      tag: impactOk
        ? `满幅 100%`
        : coveragePct < 100
          ? `仅占 ${coveragePct}%`
          : sliverMm > 0
            ? `白缝 ${sliverMm.toFixed(1)}mm`
            : "张力未齐",
      desc: "消除白框隔阂与杂乱边线，让视觉面积全开、主次分明。",
    },
  ];

  return {
    bleedMm,
    safeMm,
    bladeTol,
    cropPct,
    actualCropPct,
    coveragePct,
    whiteMarginMm,
    sliverMm,
    safeAfterShiftMm,
    textChoppedMm,
    minBleedRequired,
    minSafeRequired,
    textGapToSubjectMm,
    textCollides,
    subject,
    textBox,
    artRect: { x: artLeft, y: artTop, w: artRight - artLeft, h: artBottom - artTop },
    edgeOk,
    safeOk,
    immersionOk,
    impactOk,
    passedCount,
    allOk: passedCount === 4,
    issueCode,
    badge,
    headline,
    why,
    actionHint,
    fixPreset,
    fixLabel,
    posture,
    probes,
  };
}

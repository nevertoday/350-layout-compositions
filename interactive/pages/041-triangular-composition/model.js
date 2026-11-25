// 041 三角构图 · 单真源几何模型（画布、读数、左侧四圆徽、右上 4×4 点阵、底部 1→2→3 三步图共用同一份结果）

export const ASPECT = 1.0; // 等比正方逻辑测绘坐标系，任何屏幕宽窄都不拉伸变形，60° 永远是视觉 60°

export const SCENES = [
  {
    id: "landscape",
    label: "风景摄影",
    en: "LANDSCAPE",
    desc: "山峰脊线自然形成显性三角，宽底托起沉稳，顶点引向晴空日轮。",
  },
  {
    id: "portrait",
    label: "人物构图",
    en: "PORTRAIT",
    desc: "人物头顶落顶点、双肩与伴随剪影铺开底边，目光与手势暗合闭合三角。",
  },
  {
    id: "poster",
    label: "视觉设计",
    en: "VISUAL DESIGN",
    desc: "主视觉居中锁焦、标题与底角注释分守三点，信息层级一目了然。",
  },
];

export const PRESETS = {
  // 开场刻意停在 0/4 塌陷歪基 + 层次扁平 + 焦点外逃错态
  initial: {
    id: "initial",
    label: "复原初始",
    a: { x: 0.48, y: 0.51 },
    b: { x: 0.14, y: 0.80 },
    c: { x: 0.86, y: 0.57 },
    f: { x: 0.24, y: 0.25 },
    hierarchy: 1.0,
    showGuide: true,
  },
  // 解法 1：1:1 复刻 041 原海报等腰雪山正峰解
  poster: {
    id: "poster",
    label: "原海报正峰解",
    a: { x: 0.50, y: 0.17 },
    b: { x: 0.14, y: 0.84 },
    c: { x: 0.86, y: 0.84 },
    f: { x: 0.50, y: 0.63 },
    hierarchy: 1.95,
    showGuide: true,
  },
  // 解法 2：偏心斜冲叙事解（稳底 + 右倾推进动势）
  dynamic: {
    id: "dynamic",
    label: "斜冲叙事解",
    a: { x: 0.64, y: 0.16 },
    b: { x: 0.14, y: 0.83 },
    c: { x: 0.84, y: 0.81 },
    f: { x: 0.54, y: 0.56 },
    hierarchy: 2.15,
    showGuide: true,
  },
  // 解法 3：宽基登顶聚焦解（焦点上提至顶峰高潮区）
  apex: {
    id: "apex",
    label: "登顶聚焦解",
    a: { x: 0.50, y: 0.18 },
    b: { x: 0.12, y: 0.84 },
    c: { x: 0.88, y: 0.84 },
    f: { x: 0.50, y: 0.31 },
    hierarchy: 2.05,
    showGuide: true,
  },
  // 试错 A：倒挂翻覆（滑向 043 倒三角）
  errInvert: {
    id: "errInvert",
    label: "试错：倒挂翻覆",
    a: { x: 0.50, y: 0.83 },
    b: { x: 0.16, y: 0.22 },
    c: { x: 0.84, y: 0.22 },
    f: { x: 0.50, y: 0.44 },
    hierarchy: 1.8,
    showGuide: true,
  },
  // 试错 B：窄针失衡（底边过窄、顶角过锐）
  errNeedle: {
    id: "errNeedle",
    label: "试错：窄针尖刺",
    a: { x: 0.50, y: 0.14 },
    b: { x: 0.38, y: 0.85 },
    c: { x: 0.62, y: 0.85 },
    f: { x: 0.50, y: 0.58 },
    hierarchy: 1.85,
    showGuide: true,
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function cloneState(preset, scene = "landscape") {
  return {
    a: { ...preset.a },
    b: { ...preset.b },
    c: { ...preset.c },
    f: { ...preset.f },
    hierarchy: preset.hierarchy,
    showGuide: preset.showGuide ?? true,
    scene,
    highlight: null,
  };
}

// 转换到等比欧氏平面坐标 (x * ASPECT, y)
function toMetric(p) {
  return { x: p.x * ASPECT, y: p.y };
}

function distM(p, q) {
  const dx = (p.x - q.x) * ASPECT;
  const dy = p.y - q.y;
  return Math.hypot(dx, dy);
}

// 点到线段的距离（等比欧氏空间）
function distPointToSegM(p, v, w) {
  const pm = toMetric(p);
  const vm = toMetric(v);
  const wm = toMetric(w);
  const vx = wm.x - vm.x;
  const vy = wm.y - vm.y;
  const l2 = vx * vx + vy * vy;
  if (l2 < 1e-8) return Math.hypot(pm.x - vm.x, pm.y - vm.y);
  const t = clamp(((pm.x - vm.x) * vx + (pm.y - vm.y) * vy) / l2, 0, 1);
  return Math.hypot(pm.x - (vm.x + t * vx), pm.y - (vm.y + t * vy));
}

// 计算焦点在三角形内的重心坐标
function barycentric(p, a, b, c) {
  const det = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
  if (Math.abs(det) < 1e-6) return { la: -1, lb: -1, lc: -1 };
  const la = ((b.y - c.y) * (p.x - c.x) + (c.x - b.x) * (p.y - c.y)) / det;
  const lb = ((c.y - a.y) * (p.x - c.x) + (a.x - c.x) * (p.y - c.y)) / det;
  const lc = 1 - la - lb;
  return { la, lb, lc };
}

// 单真源全面几何核算：每次状态变更仅经由此函数产出所有判定与文案
export function evaluateTriangle(state) {
  const { a, b, c, f, hierarchy } = state;

  // 保证左右底角逻辑有序（用于底边倾角和支撑段计算，同时保留用户原始拖动点）
  const leftBase = b.x <= c.x ? b : c;
  const rightBase = b.x <= c.x ? c : b;

  const lenAB = distM(a, b);
  const lenAC = distM(a, c);
  const lenBC = distM(b, c);

  // 顶角 ∠A（度）
  const abx = (b.x - a.x) * ASPECT;
  const aby = b.y - a.y;
  const acx = (c.x - a.x) * ASPECT;
  const acy = c.y - a.y;
  const denom = Math.max(1e-6, lenAB * lenAC);
  const cosA = clamp((abx * acx + aby * acy) / denom, -1, 1);
  const apexDeg = (Math.acos(cosA) * 180) / Math.PI;

  // 底边倾角（度，绝对值）与水平跨度占画幅比
  const baseDxM = (rightBase.x - leftBase.x) * ASPECT;
  const baseDyM = rightBase.y - leftBase.y;
  const baseTiltDeg = Math.abs((Math.atan2(baseDyM, Math.max(1e-4, baseDxM)) * 180) / Math.PI);
  const baseSpanRatio = Math.abs(rightBase.x - leftBase.x); // 占画布宽比 0..1

  // 有效垂直高跨（底边中点到顶点，正值表示顶点在上，负值表示倒置）
  const baseMidY = (b.y + c.y) * 0.5;
  const signedHeight = baseMidY - a.y;
  const isInverted = a.y >= Math.min(b.y, c.y) - 0.02 || signedHeight <= 0.03;

  // 面积占画布比例（0..1）
  const areaNorm = Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) * 0.5;
  const areaPct = areaNorm * 100;

  // 重心 G 与重心水平投影在底边上的相对位置 u（0=左底角, 1=右底角）
  const centroid = {
    x: (a.x + b.x + c.x) / 3,
    y: (a.y + b.y + c.y) / 3,
  };
  const baseSpanSafe = Math.max(0.001, rightBase.x - leftBase.x);
  const cgBaseU = (centroid.x - leftBase.x) / baseSpanSafe;
  const cgInsideSafe = cgBaseU >= 0.14 && cgBaseU <= 0.86;
  const cgDropY = leftBase.y + clamp(cgBaseU, 0, 1) * (rightBase.y - leftBase.y);

  // 内心（原海报大金圆自然位置参考）
  const perim = Math.max(1e-5, lenAB + lenAC + lenBC);
  const incenter = {
    x: (lenBC * a.x + lenAC * b.x + lenAB * c.x) / perim,
    y: (lenBC * a.y + lenAC * b.y + lenAB * c.y) / perim,
  };

  // 顶点与边界余量
  const minMargin = Math.min(
    a.x, 1 - a.x, a.y, 1 - a.y,
    b.x, 1 - b.x, b.y, 1 - b.y,
    c.x, 1 - c.x, c.y, 1 - c.y
  );
  const crowdedEdge = minMargin < 0.045;

  // 顶点偏心度（0 为纯等腰，越大越斜冲）
  const baseMidX = (leftBase.x + rightBase.x) * 0.5;
  const apexSkew = baseSpanRatio > 0.05 ? (a.x - baseMidX) / baseSpanRatio : 0;

  // 焦点位置（重心坐标、距顶点距离、距最近边距离）
  const bary = barycentric(f, a, b, c);
  const minBary = Math.min(bary.la, bary.lb, bary.lc);
  const distToApex = distM(f, a);
  const distToEdge = Math.min(
    distPointToSegM(f, a, b),
    distPointToSegM(f, a, c),
    distPointToSegM(f, b, c)
  );
  const focusAtApexZone = !isInverted && distToApex <= 0.18 && f.y >= a.y - 0.03 && minBary >= -0.05;
  const focusInsideCore = !isInverted && minBary >= 0.04 && distToEdge >= 0.048;
  const focusOutside = minBary < -0.025 && !focusAtApexZone;
  const focusPinched = !focusOutside && !focusInsideCore && !focusAtApexZone;

  // === 四大核心维度判定（对应原海报左侧四枚圆徽） ===
  // 1. 稳定 STABILITY
  const baseWideEnough = baseSpanRatio >= 0.36;
  const baseLevelEnough = baseTiltDeg <= 13.5;
  const stabilityOk = !isInverted && baseWideEnough && baseLevelEnough && cgInsideSafe;
  let stabilityTag = "宽底稳固";
  let stabilityDetail = `底宽 ${Math.round(baseSpanRatio * 100)}%，重心稳落支撑段内。`;
  if (isInverted) {
    stabilityTag = "倒置悬垂";
    stabilityDetail = "顶点落到了底边下方，结构已滑向倒三角的不安悬垂态。";
  } else if (!baseLevelEnough) {
    stabilityTag = `底倾 ${baseTiltDeg.toFixed(0)}°`;
    stabilityDetail = `底边倾斜 ${baseTiltDeg.toFixed(1)}°，底座仿佛随时要向低处滑移。`;
  } else if (!baseWideEnough) {
    stabilityTag = `底窄 ${Math.round(baseSpanRatio * 100)}%`;
    stabilityDetail = "底边过窄，视觉支撑面不足，整座形体像立不稳的尖柱。";
  } else if (!cgInsideSafe) {
    stabilityTag = "重心偏出";
    stabilityDetail = "视觉重心水平投影逼近底角外缘，两侧重量失衡。";
  }

  // 2. 引导 GUIDANCE
  const apexNotFlat = apexDeg <= 108;
  const apexNotNeedle = apexDeg >= 28;
  const heightOk = signedHeight >= 0.30;
  const guidanceOk = !isInverted && apexNotFlat && apexNotNeedle && heightOk;
  let guidanceTag = `顶角 ${Math.round(apexDeg)}°`;
  let guidanceDetail = `双斜边以 ${Math.round(apexDeg)}° 收敛，视线自然沿腰线登顶。`;
  if (isInverted) {
    guidanceTag = "向下收拢";
    guidanceDetail = "两条斜边改为朝下聚拢，视线被拉向底部而非向上攀升。";
  } else if (!apexNotFlat || !heightOk) {
    guidanceTag = `钝顶 ${Math.round(apexDeg)}°`;
    guidanceDetail = `顶角张到 ${Math.round(apexDeg)}° 过分扁平，视线横向一滑而过。`;
  } else if (!apexNotNeedle) {
    guidanceTag = `过锐 ${Math.round(apexDeg)}°`;
    guidanceDetail = `顶角缩到 ${Math.round(apexDeg)}° 过分狭尖，左右斜边几乎挤成竖线。`;
  }

  // 3. 层次 HIERARCHY
  const areaAdequate = areaPct >= 13 && areaPct <= 48;
  const tierEnough = hierarchy >= 1.3;
  const hierarchyOk = !isInverted && areaAdequate && tierEnough && !crowdedEdge;
  let hierarchyTag = `阶差 ${hierarchy.toFixed(1)}×`;
  let hierarchyDetail = `体量阶差 ${hierarchy.toFixed(1)}×，面积占 ${areaPct.toFixed(0)}%，主次远近分明。`;
  if (!tierEnough) {
    hierarchyTag = `平权 ${hierarchy.toFixed(1)}×`;
    hierarchyDetail = "三点与主体体量近乎等大（< 1.3×），看不出主次层次。";
  } else if (crowdedEdge) {
    hierarchyTag = "顶框发紧";
    hierarchyDetail = "有锚点紧贴画布边缘，呼吸留白被挤没了。";
  } else if (areaPct < 13) {
    hierarchyTag = `偏小 ${areaPct.toFixed(0)}%`;
    hierarchyDetail = `三角形面积仅占 ${areaPct.toFixed(0)}%，在画幅中略显孤弱。`;
  } else if (areaPct > 48) {
    hierarchyTag = `满溢 ${areaPct.toFixed(0)}%`;
    hierarchyDetail = `三角形撑满 ${areaPct.toFixed(0)}% 画面，外围缺乏衬托空间。`;
  }

  // 4. 焦点 FOCUS
  const focusOk = focusInsideCore || focusAtApexZone;
  let focusTag = focusAtApexZone ? "顶峰锁焦" : "内心稳坐";
  let focusDetail = focusAtApexZone
    ? "焦点精准落在顶峰高潮区，两条斜边把视线直接送达主角。"
    : "焦点坐镇三角形内部核心区，周围三边形成稳固的视线围合。";
  if (focusOutside) {
    focusTag = "焦点脱框";
    focusDetail = "日轮焦点漂落在三角形外部空地，斜边引导出的视线扑了个空。";
  } else if (focusPinched) {
    focusTag = "贴边发紧";
    focusDetail = "焦点紧压在三角形边线上，与骨架边界相互挤撞、发散精力。";
  } else if (isInverted) {
    focusTag = "随架倒悬";
    focusDetail = "框架已经倒置，焦点随之悬空失去承托。";
  }

  const passedCount = [stabilityOk, guidanceOk, hierarchyOk, focusOk].filter(Boolean).length;

  // === 最高优先级白话诊单（明确说「为什么」+「一步怎么改」） ===
  let issueCode = "ok";
  let headline = "";
  let explanation = "";
  let actionHint = "";
  let fixType = "none";
  let fixLabel = "";
  let badgeShort = "";
  let stabilityGrade = "稳固均衡（示意）";

  if (isInverted) {
    issueCode = "inverted";
    badgeShort = "倒置翻覆";
    headline = "你把顶点拖到了底边下方，它变成了倒三角";
    explanation = "当宽边在上、尖顶朝下时，视觉重量悬在高空，构图立刻滑向 043 倒三角构图的悬垂张力。要建立 041 的稳定有力感，必须让宽底在下承托。";
    actionHint = "把金色日轮顶点向上拖过底边（或点一步扶正），重新支起宽底正峰。";
    fixType = "fixInvert";
    fixLabel = "把顶点拉回上方";
    stabilityGrade = "倒悬失稳（示意）";
  } else if (!baseLevelEnough) {
    issueCode = "baseTilt";
    badgeShort = `底倾 ${baseTiltDeg.toFixed(0)}°`;
    headline = `底边倾斜 ${baseTiltDeg.toFixed(1)}°，底座像在斜坡上打滑`;
    explanation = "三角形之所以稳，靠的是宽阔底边贴近水平地基。底边倾角超过 13.5° 后，整个山体就像要顺坡翻滚，安定感立刻瓦解。";
    actionHint = "把右下绿锚点往下拖平（与左下锚点接近同一高度），或在画布空白处向右横拖。";
    fixType = "fixBase";
    fixLabel = "扶平底边地基";
    stabilityGrade = "斜倾不稳（示意）";
  } else if (!apexNotFlat || !heightOk) {
    issueCode = "tooFlat";
    badgeShort = `钝顶 ${Math.round(apexDeg)}°`;
    headline = `顶角张到 ${Math.round(apexDeg)}° 过分扁塌，斜边拉不动视线`;
    explanation = "原海报讲「线条指向顶点，引导视线自然聚焦」。现在三点几乎压成一条横带，两侧斜率太缓，眼睛只会左右平扫，不会被推向顶峰。";
    actionHint = "向上拖动顶部金色日轮（或向右横拖画布），把顶角收紧到 45°–88° 区间。";
    fixType = "fixApex";
    fixLabel = "拔高顶峰锐度";
    stabilityGrade = "扁塌乏力（示意）";
  } else if (!baseWideEnough || !apexNotNeedle) {
    issueCode = "tooNarrow";
    badgeShort = `过窄 ${Math.round(apexDeg)}°`;
    headline = `顶角仅 ${Math.round(apexDeg)}° 且底宽不足，瘦成一根立不稳的针`;
    explanation = "底边跨度低于画幅 36% 或顶角过锐时，三角形退化成一根高瘦竖棒，失去横向支撑面，既容易晃倒又装不下内部层次。";
    actionHint = "向两侧拉宽底角两枚深松绿圆点，让底边撑开到画幅 45%–72%。";
    fixType = "fixBaseWidth";
    fixLabel = "撑宽底边跨度";
    stabilityGrade = "窄基摇晃（示意）";
  } else if (!cgInsideSafe) {
    issueCode = "cgOut";
    badgeShort = "重心偏出";
    headline = "重心垂线逼近底角外缘，整座三角向一侧倾倒";
    explanation = "即使底边是平的，如果顶点甩得太靠边，视觉重心 G 就会偏离底边支撑段。留出至少 14% 的底边缓冲，偏心三角才能既有冲势又不翻车。";
    actionHint = "把顶部金色日轮往底边中段略微拉回，看重心垂线 G 落进底边安全绿段。";
    fixType = "fixCg";
    fixLabel = "拉回重心落点";
    stabilityGrade = "侧偏失衡（示意）";
  } else if (focusOutside) {
    issueCode = "focusOut";
    badgeShort = "焦点脱框";
    headline = "金色焦点漂在三角形外面，两条斜边白忙活了";
    explanation = "原海报强调「主体置于三角中心或关键位置，自然成为视觉焦点」。现在两腰把视线稳稳送进山峰，主角却躲在左上空白处，视线与焦点彻底脱节。";
    actionHint = "直接拖动金色「焦点」大圆进入三角形内心，或上提锁定顶峰高潮区。";
    fixType = "fixFocus";
    fixLabel = "焦点归入三角";
    stabilityGrade = "架稳焦散（示意）";
  } else if (focusPinched) {
    issueCode = "focusEdge";
    badgeShort = "焦点贴边";
    headline = "焦点紧压在三角形边线上，显得局促发紧";
    explanation = "当核心主体擦在三角边界上时，轮廓线会切开焦点能量，观者会感觉「差点滑出去」。往内心挪进几步，或干脆坐上顶峰节点，呼吸感立刻出来。";
    actionHint = "把金色焦点大圆往三角形重心方向轻挪一点，离开边线压迫区。";
    fixType = "fixFocus";
    fixLabel = "移离边线压迫";
    stabilityGrade = "边缘发紧（示意）";
  } else if (!hierarchyOk) {
    issueCode = "flatHierarchy";
    badgeShort = crowdedEdge ? "顶框爆边" : !tierEnough ? "层次拉平" : "面积欠佳";
    headline = crowdedEdge
      ? "锚点紧贴画框边缘，三角形透不过气"
      : !tierEnough
      ? `体量阶差仅 ${hierarchy.toFixed(1)}×，三点平权没有层次`
      : "三角形在画面里占比失当，撑不起空间节奏";
    explanation = crowdedEdge
      ? "四边至少要保留 5% 以上的呼吸余量，否则锐角顶撞画框会产生意外的割裂紧张。"
      : !tierEnough
      ? "原海报第三要点讲「利用大小、位置变化，建立清晰的层次」。把层级阶差拉开，前景底锚、主体焦点与远景顶峰才会错落立体。"
      : "三角面积太小显孤弱、撑太满又失去背景对比，15%–42% 之间最容易兼顾稳重与呼吸感。";
    actionHint = !tierEnough
      ? "向右拨动「层级阶差」滑杆至 1.5× 以上，拉开三点主次大小。"
      : "微调三枚顶点，让三角从容舒展在画幅中央留白里。";
    fixType = "fixHierarchy";
    fixLabel = !tierEnough ? "拉开层级阶差" : "留出呼吸余白";
    stabilityGrade = "层次待开（示意）";
  } else {
    // 全部 4/4 通过！按几何风味区分多组合法解
    const isSkewed = Math.abs(apexSkew) >= 0.14;
    if (focusAtApexZone) {
      badgeShort = "登顶聚焦解";
      headline = "成立 · 宽基登顶聚焦解（视线直推顶点高潮）";
      explanation = `顶角 ${Math.round(apexDeg)}°、底宽 ${Math.round(baseSpanRatio * 100)}%、底倾仅 ${baseTiltDeg.toFixed(1)}°。两条斜边像聚光轨道把目光推到最高点，适合人像头肩与峻峰仰拍。`;
      stabilityGrade = "稳固登顶（示意）";
    } else if (isSkewed) {
      badgeShort = "斜冲叙事解";
      headline = `成立 · ${apexSkew > 0 ? "右倾" : "左倾"}斜冲叙事解（稳底兼具动势）`;
      explanation = `底边稳稳贴地，顶点顺势${apexSkew > 0 ? "向右" : "向左"}偏移 ${Math.round(Math.abs(apexSkew) * 100)}%，重心 G 仍牢牢锁在支撑段内——既有安定根基，又带出浪漫主义画作般的推进叙事力。`;
      stabilityGrade = "稳中带势（示意）";
    } else {
      badgeShort = "原海报正峰解";
      headline = "成立 · 等腰正峰稳固解（经典纪念碑平衡）";
      explanation = `底宽 ${Math.round(baseSpanRatio * 100)}% 水平托底，顶角 ${Math.round(apexDeg)}° 端正指向日轮，日轮焦点稳坐内心，重心垂线 G 居中直落——1:1 重现了原海报稳定而有力的视觉秩序。`;
      stabilityGrade = "经典稳固（示意）";
    }
    actionHint = "你也可以关掉「显性框架」检验隐性三角，或试着把顶点拖到底边下方体验倒三角失稳临界点。";
  }

  // 底部原海报三步活体图示进度（1. 建立三角框架 / 2. 放置主要元素 / 3. 强化焦点与层次）
  const step1Done = stabilityOk && guidanceOk;
  const step2Done = step1Done && hierarchyOk;
  const step3Done = step2Done && focusOk;

  return {
    a, b, c, f,
    leftBase, rightBase,
    centroid, incenter, cgDropY, cgBaseU, cgInsideSafe,
    apexDeg, baseTiltDeg, baseSpanRatio, signedHeight, areaPct, apexSkew,
    isInverted, crowdedEdge,
    focusAtApexZone, focusInsideCore, focusOutside, focusPinched,
    passedCount,
    checks: {
      stability: { ok: stabilityOk, tag: stabilityTag, detail: stabilityDetail },
      guidance: { ok: guidanceOk, tag: guidanceTag, detail: guidanceDetail },
      hierarchy: { ok: hierarchyOk, tag: hierarchyTag, detail: hierarchyDetail },
      focus: { ok: focusOk, tag: focusTag, detail: focusDetail },
    },
    steps: [step1Done, step2Done, step3Done],
    issueCode,
    badgeShort,
    headline,
    explanation,
    actionHint,
    fixType,
    fixLabel,
    stabilityGrade,
  };
}

// 一步纠偏：按当前最优先问题给出目标状态（用于平滑缓动）
export function computeFixTarget(state, evalRes) {
  const next = cloneState(state, state.scene);
  switch (evalRes.fixType) {
    case "fixInvert":
      next.a = { x: clamp(state.a.x, 0.34, 0.66), y: 0.17 };
      next.b = { x: 0.14, y: 0.84 };
      next.c = { x: 0.86, y: 0.84 };
      break;
    case "fixBase": {
      const avgY = clamp((state.b.y + state.c.y) * 0.5 + 0.10, 0.79, 0.85);
      next.b = { x: clamp(Math.min(state.b.x, state.c.x), 0.12, 0.22), y: avgY };
      next.c = { x: clamp(Math.max(state.b.x, state.c.x), 0.78, 0.88), y: avgY };
      break;
    }
    case "fixApex":
      next.a = { x: clamp(state.a.x, 0.36, 0.64), y: 0.17 };
      break;
    case "fixBaseWidth":
      next.b = { x: 0.14, y: clamp(state.b.y, 0.79, 0.85) };
      next.c = { x: 0.86, y: clamp(state.c.y, 0.79, 0.85) };
      break;
    case "fixCg": {
      const midX = (state.b.x + state.c.x) * 0.5;
      next.a = { x: clamp(midX + (state.a.x > midX ? 0.08 : -0.08), 0.34, 0.66), y: clamp(state.a.y, 0.15, 0.26) };
      break;
    }
    case "fixFocus":
      next.f = { x: evalRes.incenter.x, y: evalRes.incenter.y };
      break;
    case "fixHierarchy":
      next.hierarchy = Math.max(state.hierarchy, 1.95);
      next.a = { x: clamp(state.a.x, 0.22, 0.78), y: clamp(state.a.y, 0.16, 0.28) };
      next.b = { x: clamp(state.b.x, 0.12, 0.28), y: clamp(state.b.y, 0.78, 0.85) };
      next.c = { x: clamp(state.c.x, 0.72, 0.88), y: clamp(state.c.y, 0.78, 0.85) };
      break;
    default:
      return cloneState(PRESETS.poster, state.scene);
  }
  return next;
}

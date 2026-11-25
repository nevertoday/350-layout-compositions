// 024 平行线构图 — 单一几何与评判真源
// 开场舞台、四柱动态图腾、读数与诊断全部从 computeModel() 产出的真实线段数组计算，不写死常量。

export const THRESHOLDS = {
  maxParallelSpreadDeg: 1.5, // 组内散角经验容差（±1.5°）
  snapSpreadDeg: 1.2,        // 靠近 0° 时的轻磁吸半径
  minLines: 9,               // 经验舒适带下限（形成格式塔群组重复）
  maxLines: 20,              // 经验舒适带上限（避免高反差栅格眩晕与莫尔频闪）
  minSpacingRatio: 1.25,     // 疏密比下限（脱离 1:1 防盗窗机械等距）
  maxSpacingRatio: 2.45,     // 疏密比上限（防止上下断层割裂）
  minAnchorEdge: 0.16,       // 破局锚点距画框最小安全边距（16%）
};

export const SCENES = {
  pavilion: {
    id: "pavilion",
    label: "水岸静屋",
    en: "WATER PAVILION",
    desc: "对应原海报主景：夜空酸绿平行线、水平亮线与极简灰白建筑倒影。",
    defaultAnchorU: 0.68,
  },
  sail: {
    id: "sail",
    label: "帆影海面",
    en: "CALM HORIZON",
    desc: "对应原海报示例一：水平延伸的海浪平行线与定住空阔海面的小帆。",
    defaultAnchorU: 0.36,
  },
  corridor: {
    id: "corridor",
    label: "廊道光门",
    en: "LIGHT PORTAL",
    desc: "对应原海报示例三：平行墙面与地砖线槽把视线引向酸绿光门与孤影。",
    defaultAnchorU: 0.28,
  },
};

export const ORIENTATIONS = {
  horizontal: { id: "horizontal", label: "水平 0°", baseDeg: 0, note: "横向延展，宁静开阔" },
  vertical: { id: "vertical", label: "竖向 90°", baseDeg: 90, note: "柱列挺拔，建筑秩序" },
  diagonal: { id: "diagonal", label: "斜向 28°", baseDeg: 28, note: "同向斜阵，克制动势" },
};

// 开场刻意停在 0/4 错态：散斜汇聚 + 过密条纹 + 机械等距 + 无锚墙纸
export function createBrokenState(scene = "pavilion") {
  return {
    scene,
    orient: "horizontal",
    divergence: 13.0,
    lineCount: 32,
    spacingGrad: 0.0,
    anchorOn: false,
    anchorU: SCENES[scene]?.defaultAnchorU ?? 0.68,
    cadenceOn: false,
  };
}

export function createBalancedState(scene = "pavilion", orient = "horizontal") {
  return {
    scene,
    orient,
    divergence: 0.0,
    lineCount: 15,
    spacingGrad: 0.42,
    anchorOn: true,
    anchorU: SCENES[scene]?.defaultAnchorU ?? 0.68,
    cadenceOn: true,
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 将 0..1 的梳轨位置映射为几何公比目标 R（1.00× 到 3.80×）
export function gradToTargetRatio(spacingGrad) {
  const g = clamp(spacingGrad, 0, 1);
  return 1 + 2.8 * Math.pow(g, 1.35);
}

// 生成 N 条从 0 到 1 单调排布的归一化位置，使最大相邻距 / 最小相邻距精确等于 targetRatio
export function geometricPositions(count, targetRatio) {
  const n = Math.max(2, Math.round(count));
  const gaps = n - 1;
  if (gaps === 1) return [0, 1];
  const r = Math.abs(targetRatio - 1) < 1e-4 ? 1 : Math.pow(targetRatio, 1 / (gaps - 1));
  const rawGaps = [];
  let sum = 0;
  for (let i = 0; i < gaps; i++) {
    const g = Math.pow(r, i);
    rawGaps.push(g);
    sum += g;
  }
  const pos = [0];
  let acc = 0;
  for (let i = 0; i < gaps; i++) {
    acc += rawGaps[i] / sum;
    pos.push(i === gaps - 1 ? 1 : acc);
  }
  return pos;
}

// 核心单源计算：根据状态生成真实线段几何（归一化坐标系 u,v ∈ [0,1]），再从这些真实线段测量一切读数
export function computeModel(state) {
  const count = clamp(Math.round(state.lineCount), 3, 36);
  const spreadDeg = clamp(state.divergence, -18, 18);
  const spacingGrad = clamp(state.spacingGrad, 0, 1);
  const anchorU = clamp(state.anchorU, 0.06, 0.94);
  const orient = ORIENTATIONS[state.orient] || ORIENTATIONS.horizontal;
  const scene = SCENES[state.scene] || SCENES.pavilion;

  const targetRatio = gradToTargetRatio(spacingGrad);

  // 将 N 条线按主基线（水岸/廊道底线）分为「主区」（约占 68%）和「映区」（约占 32%）
  // 在主区与映区内各自按同一几何公比自基线向外渐疏展开，确保整体视觉与原海报一致且测量精确
  const mainCount = Math.max(2, Math.round(count * 0.66));
  const subCount = Math.max(1, count - mainCount);
  const seam = state.orient === "horizontal" ? 0.62 : state.orient === "vertical" ? 0.36 : 0.56;

  // 生成统一单调位置列表（0..1，用于横向垂直法向坐标 s）
  // 为了让疏密比在整幅上直观且可从实际间距精准回测，直接以 seam 为密核向两侧展开
  const upPos = geometricPositions(mainCount, targetRatio); // 0 在 seam，1 在顶边
  const downPos = subCount > 1 ? geometricPositions(subCount, Math.max(1, targetRatio * 0.72)) : [0.55];

  const mainSpan = seam - 0.08;
  const subSpan = 0.92 - seam;

  // 汇总每条线的法向归一化位置 s ∈ [0.06, 0.94]（不含基线本身重复）
  const normals = [];
  for (let i = 0; i < mainCount; i++) {
    const t = upPos[i]; // 0 紧贴基线，1 靠外缘
    const s = seam - t * mainSpan;
    normals.push({ s, zone: "main", idx: i, normT: t });
  }
  for (let i = 0; i < subCount; i++) {
    const t = subCount > 1 ? downPos[i] : 0.52;
    const s = seam + (0.14 + t * 0.86) * subSpan;
    normals.push({ s, zone: "sub", idx: i, normT: t });
  }
  normals.sort((a, b) => a.s - b.s);

  // 从法向坐标生成真实线段端点（先在基准水平局部系中算扇形偏折，再按 orient.baseDeg 旋转）
  const baseRad = (orient.baseDeg * Math.PI) / 180;
  const cosB = Math.cos(baseRad);
  const sinB = Math.sin(baseRad);

  const sMin = normals[0].s;
  const sMax = normals[normals.length - 1].s;
  const sRange = Math.max(1e-4, sMax - sMin);

  const lines = normals.map((item, idx) => {
    const centered = ((item.s - sMin) / sRange) * 2 - 1; // 精确覆盖 -1..+1，确保最顶与最底线真实夹角恰好等于 spreadDeg
    const deltaDeg = centered * (spreadDeg * 0.5);
    const deltaRad = (deltaDeg * Math.PI) / 180;

    // 韵律开启时引入微幅线长起落与粗细/明暗呼吸（像五线谱与音点，不破坏平行）
    const wave = state.cadenceOn ? Math.sin(idx * 0.85 + 0.4) : 0;
    const insetL = state.cadenceOn && item.zone === "main" && item.normT > 0.25 ? Math.max(0, wave * 0.11) : 0;
    const insetR = state.cadenceOn && item.zone === "main" && item.normT > 0.35 ? Math.max(0, -wave * 0.09) : 0;

    // 局部坐标：x ∈ [-0.85, +0.85] 确保旋转后仍贯通画框，y = item.s - 0.5
    const xL = -0.82 + insetL;
    const xR = 0.82 - insetR;
    const yMid = item.s - 0.5;
    // 绕画幅中心横向基准旋转 deltaRad
    const dyL = (xL) * Math.tan(deltaRad);
    const dyR = (xR) * Math.tan(deltaRad);

    const rot = (lx, ly) => ({
      u: 0.5 + lx * cosB - ly * sinB,
      v: 0.5 + lx * sinB + ly * cosB,
    });
    const p1 = rot(xL, yMid + dyL);
    const p2 = rot(xR, yMid + dyR);

    const isHorizon = item.zone === "main" && item.idx === 0;
    const isAccent = isHorizon || (state.cadenceOn && idx % 4 === 1 && item.zone === "main");
    const weight = isHorizon ? 2.8 : isAccent ? 1.65 : item.zone === "main" ? 1.15 : 1.0;
    const alpha = isHorizon
      ? 1.0
      : item.zone === "main"
        ? state.cadenceOn
          ? clamp(0.32 + (1 - item.normT) * 0.52 + wave * 0.14, 0.22, 0.92)
          : clamp(0.45 + (1 - item.normT) * 0.35, 0.35, 0.85)
        : clamp(0.30 + (1 - item.normT) * 0.30, 0.20, 0.62);

    return {
      index: idx,
      zone: item.zone,
      s: item.s,
      normT: item.normT,
      u1: p1.u,
      v1: p1.v,
      u2: p2.u,
      v2: p2.v,
      angleDeg: orient.baseDeg + deltaDeg,
      deltaDeg,
      weight,
      alpha,
      isHorizon,
      isAccent,
    };
  });

  // ===== 从真实线段数组反向实测各项指标（单一真源） =====
  const angles = lines.map((l) => l.angleDeg);
  const minAngle = Math.min(...angles);
  const maxAngle = Math.max(...angles);
  const measuredSpreadDeg = Number(((maxAngle - minAngle) * (spreadDeg < 0 ? -1 : 1)).toFixed(1));
  const absSpread = Math.abs(measuredSpreadDeg);

  // 测量主区相邻间距，计算真实最大/最小疏密比
  const mainNormals = lines.filter((l) => l.zone === "main").map((l) => l.s).sort((a, b) => a - b);
  const mainGaps = [];
  for (let i = 1; i < mainNormals.length; i++) {
    mainGaps.push(mainNormals[i] - mainNormals[i - 1]);
  }
  const minGap = mainGaps.length ? Math.min(...mainGaps) : 0.1;
  const maxGap = mainGaps.length ? Math.max(...mainGaps) : 0.1;
  const measuredRatio = mainGaps.length ? maxGap / Math.max(minGap, 1e-5) : 1.0;

  // 示意视觉频段估算（按 360px 典型舞台视高估算条纹密度；仅作示意与警示档位，非临床实测）
  const avgGapNorm = mainGaps.length ? mainGaps.reduce((a, b) => a + b, 0) / mainGaps.length : 0.15;
  const stripeDensityScore = count / (0.85 + (measuredRatio - 1) * 0.22);
  let glareBand = "舒缓";
  if (count > THRESHOLDS.maxLines) {
    glareBand = measuredRatio < 1.25 ? "高频炫光警示" : "偏密易颤";
  } else if (count < THRESHOLDS.minLines) {
    glareBand = "过疏零散";
  }

  // ===== 四柱判定（对应原海报 重复 / 间距 / 秩序 / 韵律） =====
  const orderOk = absSpread <= THRESHOLDS.maxParallelSpreadDeg;
  const repTooFew = count < THRESHOLDS.minLines;
  const repTooMany = count > THRESHOLDS.maxLines;
  const repOk = !repTooFew && !repTooMany;

  const spaceTooEven = measuredRatio < THRESHOLDS.minSpacingRatio;
  const spaceTooBroken = measuredRatio > THRESHOLDS.maxSpacingRatio;
  const spaceOk = !spaceTooEven && !spaceTooBroken;

  const edgeMargin = Math.min(anchorU, 1 - anchorU);
  const anchorEdgeCrash = state.anchorOn && edgeMargin < THRESHOLDS.minAnchorEdge;
  const cadenceOk = state.anchorOn && !anchorEdgeCrash && state.cadenceOn;

  const pillars = {
    repetition: {
      ok: repOk,
      status: repOk ? "群组稳固" : repTooMany ? "过密炫光" : "孤线过少",
      value: `${count} 条 · ${glareBand}`,
    },
    spacing: {
      ok: spaceOk,
      status: spaceOk ? "呼吸匀畅" : spaceTooEven ? "等距栅栏" : "断层割裂",
      value: `${measuredRatio.toFixed(2)}× 疏密比`,
    },
    order: {
      ok: orderOk,
      status: orderOk ? `${orient.label.slice(0, 2)}齐平` : spreadDeg > 0 ? `右收 +${absSpread.toFixed(1)}°` : `左散 -${absSpread.toFixed(1)}°`,
      value: `散角 ${measuredSpreadDeg > 0 ? "+" : ""}${measuredSpreadDeg.toFixed(1)}°`,
    },
    cadence: {
      ok: cadenceOk,
      status: cadenceOk
        ? "锚定生韵"
        : !state.anchorOn
          ? "空洞墙纸"
          : anchorEdgeCrash
            ? "锚点贴边"
            : "缺音阶起落",
      value: state.anchorOn ? `锚点 ${Math.round(anchorU * 100)}% · ${state.cadenceOn ? "律动开" : "平铺"}` : "无破局锚点",
    },
  };

  const passCount = [repOk, spaceOk, orderOk, cadenceOk].filter(Boolean).length;

  // ===== 优先级清晰的「为什么」白话诊断 =====
  let diagTag = "";
  let diagHeadline = "";
  let diagBody = "";
  let diagHint = "";
  let diagLevel = "warn";

  if (passCount === 4) {
    diagLevel = "pass";
    diagTag = `4 / 4 成立 · ${orient.label}`;
    diagHeadline = `${count} 条${orient.label.slice(0, 2)}平行线稳成秩序场，疏密 ${measuredRatio.toFixed(2)}× 且破局锚点稳落 ${Math.round(anchorU * 100)}%`;
    diagBody = `线条彼此散角归零，大脑借格式塔相似性与连续性把整组线收束为平静延展的背景；${measuredRatio.toFixed(2)}× 渐疏变化留出呼吸，${scene.label}锚点与轻重律动让视线停驻而不滑出画框。`;
    diagHint = "你还可以切换「竖向 90° / 斜向 28°」或换一套原海报静景，验证平行线不止水平一种答案。";
  } else if (!orderOk) {
    diagTag = `错态 · 散角 ${measuredSpreadDeg > 0 ? "+" : ""}${measuredSpreadDeg.toFixed(1)}°（${passCount}/4）`;
    diagHeadline = `线束${spreadDeg > 0 ? "向右收拢" : "向左发散"} ${absSpread.toFixed(1)}°，平行秩序正在坍塌`;
    diagBody = "只要同组线条之间出现超过 ±1.5° 的偏折差，人眼就会按线性透视去追远处的消失点，画面从安静延伸滑向「汇聚线构图」的纵深压迫感。";
    diagHint = "先把「秩序」栏的组内散角归到 0.0°（靠近 0° 会轻磁吸锁平），也可以直接拖动画布右侧的酸绿校准标把。";
  } else if (!repOk && repTooMany) {
    diagTag = `错态 · 过密 ${count} 条（${passCount}/4）`;
    diagHeadline = `${count} 条高反差平行线挤成高频栅格，眼睛开始发花微颤`;
    diagBody = "当大量等宽、高对比平行线挤在有限画幅里时，条纹密度逼近人眼视觉皮层最敏感的中高频栅格区（Wilkins 1984 指出约 3 周/度峰值），容易诱发视觉不适与小屏莫尔干涉。";
    diagHint = "把「重复」栏的线束数量降回 9–20 条经验舒适带，既保留群组连贯感，又让背景沉静下来。";
  } else if (!repOk && repTooFew) {
    diagTag = `错态 · 仅 ${count} 条（${passCount}/4）`;
    diagHeadline = `画面只有 ${count} 条孤线，撑不起平行线的群体节奏`;
    diagBody = "平行线构图靠重复把单根线变成有方向的视觉场；少于 9 条时，眼睛把它们当成几根孤立分割线，而不是连绵延展的秩序背景。";
    diagHint = "把「重复」栏的线束数量增至 9–20 条经验带，观察线群如何聚合成安静的秩序场。";
  } else if (!spaceOk && spaceTooEven) {
    diagTag = `错态 · 疏密比 ${measuredRatio.toFixed(2)}×（${passCount}/4）`;
    diagHeadline = `线距比仅 ${measuredRatio.toFixed(2)}×，满屏机械等距像防盗窗铁栅栏`;
    diagBody = "方向齐一只是平行线的底线。所有间距完全相同，视线没有疏密起伏可循，画面立刻显得呆板僵硬，缺乏呼吸感。";
    diagHint = "左右拖动舞台底沿的「间距疏密梳轨」，把疏密比拉进 1.25×–2.45× 经验呼吸带。";
  } else if (!spaceOk && spaceTooBroken) {
    diagTag = `错态 · 疏密比 ${measuredRatio.toFixed(2)}×（${passCount}/4）`;
    diagHeadline = `疏密比拉爆到 ${measuredRatio.toFixed(2)}×，线群撕裂成上下两段`;
    diagBody = "间距渐变跨度过大时，密区挤成一团亮带、疏区彻底空断，格式塔邻近性被撕开，原本连贯的延展秩序断成互不相关的两半。";
    diagHint = "把舞台底沿的「间距疏密梳轨」往回拉，将疏密比收束在 1.25×–2.45× 经验带内。";
  } else if (!state.anchorOn) {
    diagTag = `错态 · 无破局锚点（${passCount}/4）`;
    diagHeadline = "平行秩序立住了，却没有破局锚点兜住视线——沦为空洞墙纸";
    diagBody = "全幅只有无限延伸的平行线时，眼睛顺着线槽左右滑出画框，找不到停留处。原海报的建筑静屋、小帆与光门，正是为了在秩序海里钉住落眼点。";
    diagHint = "在「韵律」栏打开「破局锚点」并开启「线长/明暗律动」，再直接在画布上左右拖动锚点找呼吸位。";
  } else if (anchorEdgeCrash) {
    diagTag = `错态 · 锚点贴边 ${Math.round(anchorU * 100)}%（${passCount}/4）`;
    diagHeadline = `破局锚点被挤在边缘 ${Math.round(anchorU * 100)}%，刚拦住视线就被画框截断`;
    diagBody = "破局主体离画框太近（小于 16%）时，一侧平行线完全失去延展余地，画面发憋失衡。";
    diagHint = "直接在画布上拖动主体（或按方向键），把它移回 16%–84% 呼吸区。";
  } else {
    diagTag = `差一步 · 缺律动起伏（${passCount}/4）`;
    diagHeadline = "锚点已稳落画内，再给线束加上轻重长短的韵律起伏";
    diagBody = "原海报第四要点强调「细微的间距与长度变化形成流动的视觉韵律」。给部分平行线微幅长短错落与明暗轻重，静态队列立刻像五线谱一样活起来。";
    diagHint = "点击「韵律」栏的「线长/明暗律动」开关，完成全部四项校准。";
  }

  return {
    state: { ...state, lineCount: count, divergence: spreadDeg, spacingGrad, anchorU },
    scene,
    orient,
    seam,
    lines,
    metrics: {
      lineCount: count,
      spreadDeg: measuredSpreadDeg,
      absSpread,
      spacingRatio: Number(measuredRatio.toFixed(2)),
      avgGapNorm,
      stripeDensityScore: Number(stripeDensityScore.toFixed(1)),
      glareBand,
      anchorPct: Math.round(anchorU * 100),
      edgeMarginPct: Math.round(edgeMargin * 100),
      passCount,
    },
    pillars,
    diagnosis: {
      level: diagLevel,
      tag: diagTag,
      headline: diagHeadline,
      body: diagBody,
      hint: diagHint,
    },
  };
}

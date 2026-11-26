// 043 倒三角构图 · 单真源几何、视觉重心与失衡托衡物理模型
// 所有读数、左侧三条引注、右侧四枚徽章与实时诊单全部由同一组实绘顶点算出，绝无硬编码假数据。

export const STAGE_W = 1000;
export const STAGE_H = 740;
export const TOP_Y = 0.095;
export const BOTTOM_Y = 0.845;
export const APERTURE_H = BOTTOM_Y - TOP_Y; // 0.75

export const INITIAL_STATE = Object.freeze({
  topSpan: 0.44,      // 上边宽占画布比例 (0.24 - 0.90)
  bottomMouth: 0.46,  // 底口宽占画布比例 (0.00 - 0.64)，0 表示收束于一点
  apexX: 0.39,        // 底部落点/底口中心水平位置 (0.22 - 0.78)
  horizonY: 0.30,     // 吃水线/主体基准高度 (0.27 - 0.64)
  anchorLevel: "off", // 'off' | 'soft' | 'focus' | 'glare'
  scene: "iceberg",   // 'iceberg' | 'stage' | 'diving' | 'product'
  showGuides: true,
});

export const PRESETS = Object.freeze({
  classic: {
    label: "原海报经典解",
    note: "对称倒三角 · 宽阔冰空 · 强对比水纹落点",
    state: { topSpan: 0.76, bottomMouth: 0.0, apexX: 0.50, horizonY: 0.45, anchorLevel: "focus" },
  },
  panoramic: {
    label: "宽境俯冲解",
    note: "更大顶部展翼与开放呼吸域，适合宏阔自然风光",
    state: { topSpan: 0.88, bottomMouth: 0.0, apexX: 0.50, horizonY: 0.49, anchorLevel: "focus" },
  },
  dynamic: {
    label: "险峻动势解",
    note: "锐利收束 + 轻度偏轴（仍在重心安全锥内），适合舞台与运动",
    state: { topSpan: 0.66, bottomMouth: 0.0, apexX: 0.56, horizonY: 0.43, anchorLevel: "focus" },
  },
  errBox: {
    label: "试错：直筒散框",
    state: { topSpan: 0.48, bottomMouth: 0.48, apexX: 0.50, horizonY: 0.45, anchorLevel: "focus" },
  },
  errUpright: {
    label: "试错：反转正三角",
    state: { topSpan: 0.08, bottomMouth: 0.72, apexX: 0.50, horizonY: 0.56, anchorLevel: "focus" },
  },
  errTilt: {
    label: "试错：偏心倾覆",
    state: { topSpan: 0.76, bottomMouth: 0.0, apexX: 0.28, horizonY: 0.45, anchorLevel: "focus" },
  },
  errGlare: {
    label: "试错：底大夺主",
    state: { topSpan: 0.74, bottomMouth: 0.0, apexX: 0.50, horizonY: 0.46, anchorLevel: "glare" },
  },
  reset: {
    label: "复原错态",
    state: { ...INITIAL_STATE },
  },
});

export const SCENES = Object.freeze({
  iceberg: {
    id: "iceberg",
    name: "自然风光",
    sub: "原海报 · 极地冰山",
    subjectPeakOffset: 0.165,
    desc: "冰峰傲立海平面之上，水下巨大冰体顺两侧斜线向深渊收束，把目光压向底端水纹落点。",
  },
  stage: {
    id: "stage",
    name: "戏剧舞台",
    sub: "顶灯聚光 · 足尖独舞",
    subjectPeakOffset: 0.155,
    desc: "顶部宽阔剧场吊杆与双束冷青追光斜向下收拢，全部能量聚焦于舞台中央立于足尖的剪影。",
  },
  diving: {
    id: "diving",
    name: "运动瞬间",
    sub: "十米跳台 · 破水一刹",
    subjectPeakOffset: 0.16,
    desc: "高处开阔天幕与跳台拉开势能，向下加速的轨迹线与入水落点激起一瞬屏息的动势。",
  },
  product: {
    id: "product",
    name: "产品展示",
    sub: "顶光柔幕 · 棱面香氛",
    subjectPeakOffset: 0.15,
    desc: "上方大面积柔光留白建立奢华呼吸感，左右暗面折翼向内收束，托起底端晶透瓶身的高光落点。",
  },
});

export const ANCHOR_META = Object.freeze({
  off: { label: "隐没无锚", weight: 0.0, contrastText: "无落点" },
  soft: { label: "柔和微光", weight: 0.05, contrastText: "弱对比" },
  focus: { label: "强对比落点", weight: 0.10, contrastText: "强聚焦" },
  glare: { label: "过曝夺主", weight: 0.42, contrastText: "底斑过曝" },
});

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function sanitizeState(raw) {
  const topSpan = clamp(Number(raw.topSpan ?? INITIAL_STATE.topSpan), 0.06, 0.90);
  const bottomMouth = clamp(Number(raw.bottomMouth ?? INITIAL_STATE.bottomMouth), 0.0, 0.74);
  const halfB = bottomMouth / 2;
  const apexX = clamp(Number(raw.apexX ?? INITIAL_STATE.apexX), Math.max(0.20, 0.06 + halfB), Math.min(0.80, 0.94 - halfB));
  const horizonY = clamp(Number(raw.horizonY ?? INITIAL_STATE.horizonY), 0.27, 0.64);
  const anchorLevel = ANCHOR_META[raw.anchorLevel] ? raw.anchorLevel : "off";
  const scene = SCENES[raw.scene] ? raw.scene : "iceberg";
  const showGuides = raw.showGuides !== false;
  return { topSpan, bottomMouth, apexX, horizonY, anchorLevel, scene, showGuides };
}

// 从状态计算实绘多边形、倾角、面积比、视觉重心、力矩偏离与 4 项原海报核心原则
export function evaluate(rawState) {
  const s = sanitizeState(rawState);
  const sc = SCENES[s.scene];

  // 四个规范化顶点（当 bottomMouth === 0 时，BL 与 BR 重合为底端单点）
  const tl = { x: 0.5 - s.topSpan / 2, y: TOP_Y };
  const tr = { x: 0.5 + s.topSpan / 2, y: TOP_Y };
  const bl = { x: s.apexX - s.bottomMouth / 2, y: BOTTOM_Y };
  const br = { x: s.apexX + s.bottomMouth / 2, y: BOTTOM_Y };

  // 像素坐标
  const toPx = (p) => ({ x: p.x * STAGE_W, y: p.y * STAGE_H });
  const px = { tl: toPx(tl), tr: toPx(tr), bl: toPx(bl), br: toPx(br) };

  const heightPx = APERTURE_H * STAGE_H;
  const topWidthPx = px.tr.x - px.tl.x;
  const bottomWidthPx = px.br.x - px.bl.x;

  // 两侧斜边相对于竖直向下的收拢角（正值=向下收拢，0=竖直平行，负值=向下张开成正三角）
  const angLeft = Math.atan2(px.bl.x - px.tl.x, heightPx);
  const angRight = Math.atan2(px.tr.x - px.br.x, heightPx);
  const convergeDeg = ((angLeft + angRight) * 180) / Math.PI;
  const convergeDegRound = Math.round(convergeDeg);

  // 上下半区面积比（精确梯形积分：纯倒三角恒为 3.00×，矩形为 1.00×，正三角为 0.33×）
  const midSpan = (s.topSpan + s.bottomMouth) / 2;
  const upperArea = 0.5 * (s.topSpan + midSpan) * (APERTURE_H / 2);
  const lowerArea = 0.5 * (midSpan + s.bottomMouth) * (APERTURE_H / 2);
  const upperLowerRatio = upperArea / Math.max(0.001, lowerArea);

  // 几何质心 (梯形公式)
  const a = s.topSpan;
  const b = s.bottomMouth;
  const denom = Math.max(0.001, a + b);
  const geomCy = TOP_Y + (APERTURE_H * (a + 2 * b)) / (3 * denom);
  const geomCx = (0.5 * (2 * a + b) + s.apexX * (a + 2 * b)) / (3 * denom);

  // 上方主体与顶部留白
  const subjectPeakY = s.horizonY - sc.subjectPeakOffset;
  const headroomPct = Math.round(((subjectPeakY - TOP_Y) / APERTURE_H) * 100);
  const subjectMassX = 0.50;
  const subjectMassY = clamp(s.horizonY - 0.03, TOP_Y + 0.08, BOTTOM_Y - 0.12);

  // 综合视觉重心（综合几何窗面 35% + 主体体量 55% + 底部落点光影权重）
  const anchorW = ANCHOR_META[s.anchorLevel].weight;
  const totalW = 0.35 + 0.55 + anchorW;
  const visualCx = (0.35 * geomCx + 0.55 * subjectMassX + anchorW * s.apexX) / totalW;
  const visualCy = (0.35 * geomCy + 0.55 * subjectMassY + anchorW * BOTTOM_Y) / totalW;

  // 视觉重心离底端高度（%）：倒三角典型落在 54%–76% 区间（偏上但受落点牵引）
  const centroidHeightPct = Math.round(((BOTTOM_Y - visualCy) / APERTURE_H) * 100);

  // 上方主体视觉中心与底部支点之间的水平偏移（力矩偏角来源）
  const upperMassX = (0.38 * geomCx + 0.62 * subjectMassX);
  const plumbDelta = s.apexX - upperMassX; // 正=落点偏右，负=落点偏左
  const plumbOffsetPct = Math.round(plumbDelta * 100);
  const absPlumb = Math.abs(plumbOffsetPct);

  // 倾覆力矩示意角（deg）：超出 10% 安全锥后明显倾斜
  const tiltDeg = absPlumb <= 10 ? plumbDelta * 14 : Math.sign(plumbDelta) * (1.4 + (absPlumb - 10) * 0.85);

  // 顶底收束比（底口越接近 0，收束越尖锐）
  const mouthPct = Math.round(s.bottomMouth * 100);
  const topSpanPct = Math.round(s.topSpan * 100);

  // 四大原海报准则单真源判定
  const isConverged = s.bottomMouth <= 0.055;
  const isAngleGood = convergeDeg >= 38 && convergeDeg <= 104;
  const isHeadroomGood = headroomPct >= 13 && headroomPct <= 39;
  const isOpenTop = s.topSpan >= 0.58 && isHeadroomGood && convergeDeg >= 36;
  const isAnchorValid = s.anchorLevel === "focus" || (s.anchorLevel === "soft" && absPlumb <= 6);
  const isBalanced = isConverged && isAngleGood && absPlumb <= 10 && isAnchorValid && centroidHeightPct >= 52 && centroidHeightPct <= 78;

  const pillars = {
    openness: {
      ok: isOpenTop,
      tag: s.topSpan < 0.58
        ? `顶宽偏窄 ${topSpanPct}%`
        : headroomPct < 13
          ? `压顶 ${headroomPct}%`
          : headroomPct > 39
            ? `主体下沉`
            : `开放 ${topSpanPct}% · 留白 ${headroomPct}%`,
    },
    guidance: {
      ok: isConverged && isAngleGood,
      tag: convergeDeg < -4
        ? `反成正三角 ${convergeDegRound}°`
        : !isConverged
          ? `底口未收 ${mouthPct}%`
          : convergeDeg < 38
            ? `过锐 ${convergeDegRound}°`
            : convergeDeg > 104
              ? `扁平 ${convergeDegRound}°`
              : `收束角 ${convergeDegRound}°`,
    },
    focus: {
      ok: isConverged && isAnchorValid && upperLowerRatio >= 2.2,
      tag: !isConverged
        ? `散底无点`
        : s.anchorLevel === "off"
          ? `隐没漏底`
          : s.anchorLevel === "glare"
            ? `底斑夺主`
            : s.anchorLevel === "soft" && absPlumb > 6
              ? `微光托不住`
              : `${ANCHOR_META[s.anchorLevel].contrastText} · ${upperLowerRatio.toFixed(1)}×`,
    },
    balance: {
      ok: isBalanced,
      tag: convergeDeg < -4
        ? `正三角静稳`
        : !isConverged
          ? `失V无势`
          : absPlumb > 10
            ? `${plumbOffsetPct < 0 ? "左倾" : "右倾"} ${absPlumb}%`
            : s.anchorLevel === "off"
              ? `悬空无托`
              : s.anchorLevel === "glare"
                ? `上下抢焦`
                : centroidHeightPct < 52
                  ? `重心落底`
                  : absPlumb >= 4
                    ? `动势托衡`
                    : `失衡中平衡`,
    },
  };

  const passCount = Object.values(pillars).filter((p) => p.ok).length;

  // 8 类双向错态 + 多组合法解白话诊断
  let faultId = "ok";
  let badgeText = "4/4 · 失衡中平衡";
  let tierLabel = "悬停张力（示意）";
  let headline = "上阔下收、落点稳托，倒三角张力成立";
  let detail = `顶边展开 ${topSpanPct}%、上方留白 ${headroomPct}%，两侧以 ${convergeDegRound}° 向下收束成单一落点（上下区面积比 ${upperLowerRatio.toFixed(2)}×）。底部高对比锚点稳稳托住位于 ${centroidHeightPct}% 高处的视觉重心。`;
  let hint = "试着继续把底部落点向左或右拖出 11%，或改弱落点光影，亲眼看看「失衡中的平衡」何时断裂。";
  let fixLabel = "";
  let fixShort = "";
  let fixPatch = null;

  if (convergeDeg < -4) {
    faultId = "inverted_flip";
    badgeText = `${passCount}/4 · 反转正三角`;
    tierLabel = "正立静稳（示意）";
    headline = `下宽上窄（夹角 ${convergeDegRound}°），已反转为正三角构图`;
    detail = `底宽大于顶宽后，上下区面积比跌到 ${upperLowerRatio.toFixed(2)}×，结构退化成底部宽厚的正立金字塔。画面虽然沉稳，却彻底失去了倒三角特有的「上方开阔 + 向下冲刺」张力。`;
    hint = "向右横拖画布展开上方双翼，或点纠偏按钮收拢底口。";
    fixLabel = "收束为经典倒三角";
    fixShort = "收束倒三角";
    fixPatch = { topSpan: 0.76, bottomMouth: 0.0, apexX: 0.50, horizonY: 0.45, anchorLevel: "focus" };
  } else if (!isConverged) {
    faultId = "open_mouth";
    badgeText = `${passCount}/4 · 直筒散框`;
    tierLabel = "散框滞涩（示意）";
    headline = `底口敞开 ${mouthPct}% 未收尖，视线在下沿横向散开`;
    detail = `目前上下宽接近（面积比仅 ${upperLowerRatio.toFixed(2)}×），两侧线条几乎平行甚至外扩，缺乏向内收拢的漏斗势能。${headroomPct < 13 ? `同时顶部留白仅 ${headroomPct}%，冰峰紧压上沿。` : ""}眼睛扫完主体后找不到唯一的底部聚焦落点。`;
    hint = "直接向右横拖画布收拢底口并展开上翼，或拖动底口滑轨归零至一点。";
    fixLabel = "收尖底口并打开上空";
    fixShort = "收尖底口";
    fixPatch = { topSpan: 0.76, bottomMouth: 0.0, horizonY: Math.max(s.horizonY, 0.44) };
  } else if (convergeDeg < 38) {
    faultId = "too_narrow";
    badgeText = `${passCount}/4 · 锐刺窒息`;
    tierLabel = "过锐局促（示意）";
    headline = `底角锐至 ${convergeDegRound}°，斜壁夹挤上方主体`;
    detail = `虽然底端收成一点，但顶边只展开了 ${topSpanPct}%，画面窄成一根细长倒锥。上方主体两侧没有呼吸余地，违背原海报第一条「上方留白更宽，营造开放与呼吸感」。`;
    hint = "向外拖开顶角两枚青色箭头，把顶宽扩至 62%–88%（底角 46°–88° 区间）。";
    fixLabel = "展开上方双翼";
    fixShort = "展开双翼";
    fixPatch = { topSpan: 0.76 };
  } else if (convergeDeg > 104) {
    faultId = "too_flat";
    badgeText = `${passCount}/4 · 扁碗泄势`;
    tierLabel = "平缓泄势（示意）";
    headline = `底角钝至 ${convergeDegRound}°，斜坡太平缓留不住视线`;
    detail = `顶部拉得过宽或斜边角度太平，视觉动势倾向左右横逸而不是向下俯冲，底端尖点的汇聚感大打折扣。`;
    hint = "略微收窄上方双翼，让收束底角回到 46°–92° 的有力漏斗区间。";
    fixLabel = "收回到有力收束角";
    fixShort = "收束坡角";
    fixPatch = { topSpan: 0.78 };
  } else if (headroomPct < 13) {
    faultId = "cramped_top";
    badgeText = `${passCount}/4 · 压顶窒息`;
    tierLabel = "闷顶拥挤（示意）";
    headline = `顶部留白仅 ${headroomPct}%，主体顶死上框失去开放感`;
    detail = `倒三角靠上方宽广的环境留白换取自由与呼吸感。现在吃水线抬得太高，主体直顶画框上沿，整个画面像被封在盖子底下。`;
    hint = "向下拖动蓝色吃水线或调节「吃水高度」，把顶部呼吸空间留到 15%–32%。";
    fixLabel = "留出上方宽阔空间";
    fixShort = "留出上空";
    fixPatch = { horizonY: 0.45 };
  } else if (s.anchorLevel === "glare") {
    faultId = "glare_anchor";
    badgeText = `${passCount}/4 · 底大夺主`;
    tierLabel = "上下抢焦（示意）";
    headline = "底部光斑过曝抢戏，反压上方宽阔主体";
    detail = `底部落点是为了「收束于一点」而非喧宾夺主。过大的底端亮斑把视觉重心生生拉低到 ${centroidHeightPct}%，把倒三角硬生生撕成上下两个互相打架的焦点。`;
    hint = "把「落点光影」调回克制锐利的「强对比落点」。";
    fixLabel = "收敛底部高光尺度";
    fixShort = "收敛光斑";
    fixPatch = { anchorLevel: "focus" };
  } else if (headroomPct > 39 || centroidHeightPct < 52) {
    faultId = "sunken_mass";
    badgeText = `${passCount}/4 · 主体下沉`;
    tierLabel = "下坠沉闷（示意）";
    headline = `主体沉入下半区（视觉重心跌至 ${centroidHeightPct}%）`;
    detail = `主体放得太低后，顶部只剩大片空壳，重量全部堆进狭窄的尖角里，违背了「主体位于画面上方」的核心前提。`;
    hint = "向上拉回吃水线，让主体稳稳占据上半宽阔区。";
    fixLabel = "抬升主体回上方宽区";
    fixShort = "抬升主体";
    fixPatch = { horizonY: 0.45 };
  } else if (absPlumb > 10) {
    faultId = "off_axis_tip";
    badgeText = `${passCount}/4 · 偏心倾覆`;
    tierLabel = "失稳倾倒（示意）";
    headline = `底部落点向${plumbOffsetPct < 0 ? "左" : "右"}偏离重心垂线 ${absPlumb}%，结构倾覆`;
    detail = `倒三角天生「上重下轻」，全靠底部支点落在上方视觉重心的安全锥内才能立住。现在支点偏出 ±10% 临界线，底部水纹斜裂，画面产生真实要倒下去的不安感。`;
    hint = "拖动底部发光圆点回到上方冰峰重心垂线正下方（偏心 ≤ 10%）。";
    fixLabel = "把落点移回重心垂线";
    fixShort = "落点归中";
    fixPatch = { apexX: 0.50 };
  } else if (s.anchorLevel === "off") {
    faultId = "weak_anchor";
    badgeText = `${passCount}/4 · 悬空漏底`;
    tierLabel = "漏底无锚（示意）";
    headline = "底部聚焦落点隐没，视线顺斜线直接滑出底边";
    detail = `两侧 ${convergeDegRound}° 的斜线已经把目光高速送到底端，但最下方漆黑无物。正如原海报提示所说，缺少对比、色彩或光影的落点，势能就像水流进漏斗却没有容器接住。`;
    hint = "把「落点光影」切到「强对比落点」，让高光圆点与水纹稳稳接住视线。";
    fixLabel = "点亮底部聚焦落点";
    fixShort = "点亮落点";
    fixPatch = { anchorLevel: "focus" };
  } else if (s.anchorLevel === "soft" && absPlumb > 6) {
    faultId = "soft_off";
    badgeText = `${passCount}/4 · 锚力偏弱`;
    tierLabel = "微晃待定（示意）";
    headline = `轻度偏轴 ${absPlumb}% 时，柔和微光托不住斜向势能`;
    detail = "当倒三角采用非对称偏轴营造更强动势时，底部支点需要更高对比度的亮斑或色块才能锁住平衡。";
    hint = "开启「强对比落点」，或将落点移回居中垂线。";
    fixLabel = "强化落点对比度";
    fixShort = "强化落点";
    fixPatch = { anchorLevel: "focus" };
  } else {
    // 多组合法解分型描述
    if (absPlumb >= 4) {
      badgeText = "4/4 · 险峻动势解";
      tierLabel = "险峻动势（示意）";
      headline = `偏轴 ${absPlumb}% 仍在重心安全锥内，形成犀利斜冲张力`;
      detail = `两侧以 ${convergeDegRound}° 锐利收拢，轻微偏轴带来戏剧与运动场面的前冲势能，强对比落点稳稳锁住 ${centroidHeightPct}% 高位的视觉重心。`;
    } else if (s.topSpan >= 0.83) {
      badgeText = "4/4 · 宽境俯冲解";
      tierLabel = "宏阔俯冲（示意）";
      headline = `顶部广展 ${topSpanPct}%，宏阔天空与尖端落点拉出剧烈反差`;
      detail = `宽广上空赋予极强呼吸感（留白 ${headroomPct}%），上下区面积比达到 ${upperLowerRatio.toFixed(2)}×，视线如滑翔般直坠底端焦点。`;
    } else {
      badgeText = "4/4 · 原海报经典解";
      tierLabel = "失衡中平衡（示意）";
    }
  }

  return {
    state: s,
    scene: sc,
    pts: { tl, tr, bl, br },
    px,
    metrics: {
      topSpanPct,
      mouthPct,
      convergeDeg: convergeDegRound,
      upperLowerRatio: Number(upperLowerRatio.toFixed(2)),
      headroomPct,
      centroidHeightPct,
      plumbOffsetPct,
      absPlumb,
      tiltDeg,
      visualCx,
      visualCy,
      upperMassX,
      subjectPeakY,
    },
    pillars,
    passCount,
    ok: passCount === 4 && faultId === "ok",
    faultId,
    badgeText,
    tierLabel,
    headline,
    detail,
    hint,
    fixLabel,
    fixShort,
    fixPatch,
  };
}

// ---------- 第 01 节：三构图物理稳态对比数据 ----------
export const COMPARE_MODES = Object.freeze({
  centered: {
    id: "centered",
    name: "居中式构图",
    en: "CENTERED",
    tags: "平衡 / 稳定 / 静态",
    damping: 0.9,
    maxTilt: 1.5,
    note: "重心与画框中心重合，四向力量彼此抵消。轻推几乎不晃，适合端庄纪念照与极简标志，但缺少方向速度。",
  },
  upright: {
    id: "upright",
    name: "三角形构图",
    en: "TRIANGULAR",
    tags: "稳定 / 指向 / 聚焦",
    damping: 0.85,
    maxTilt: 4.5,
    note: "宽底稳贴下方，视觉重心偏低（约 1/3 处）。轻推后立刻稳重回正，传递庄严、信赖与向上指峰感。",
  },
  inverted: {
    id: "inverted",
    name: "倒三角构图",
    en: "INVERTED TRIANGLE",
    tags: "张力 / 引导 / 开放",
    damping: 0.94,
    maxTilt: 12.5,
    note: "宽体悬于上方，重心高达 2/3 处，全凭尖端落点支立。轻推会产生悬停摆荡再回定——这就是「失衡中的平衡」带来的吸睛张力。",
  },
});

// ---------- 第 02 节：三层骨架抽层解体数据 ----------
export const ANATOMY_ZONES = Object.freeze([
  {
    id: "open",
    title: "宽阔空间",
    en: "OPEN UPPER FIELD",
    posterQuote: "上方留白更宽，营造开放与呼吸感，强化环境与氛围。",
    offTitle: "抽掉「宽阔空间」→ 顶边窒息",
    offExplain: "主体直接抵死画框上沿，空气被抽干。即使下面仍是倒三角，读者感到的也是被压迫的局促，而非开放与延展。",
  },
  {
    id: "guide",
    title: "视觉引导",
    en: "CONVERGING SLOPES",
    posterQuote: "两侧线条向内收拢，自然引导视线向下聚焦。",
    offTitle: "抽掉「视觉引导」→ 矩形滞涩",
    offExplain: "两侧不再向内收拢而竖直垂落，视线失去斜坡加速度，停在上方左右游荡，倒三角最核心的向下拉力瞬间消失。",
  },
  {
    id: "point",
    title: "聚焦落点",
    en: "ANCHORED FOCAL TIP",
    posterQuote: "收束于一点，形成强烈聚焦，强化主题与张力。",
    offTitle: "抽掉「聚焦落点」→ 悬空漏底",
    offExplain: "两侧斜线把全部视觉能量引向最底端，可底端空无一物或对比微弱，目光直接滑出画框下沿，结构像漏了底的漏斗。",
  },
]);

// ---------- 第 03 节：查证过的历史与建筑脉络（1903–1991） ----------
export const LINEAGE_ITEMS = Object.freeze([
  {
    year: "1903",
    author: "Henry Rankin Poore",
    workZh: "",
    workEn: "Pictorial Composition and the Critical Judgment of Pictures",
    workNote: "",
    short: "金字塔稳态与支点秤杆",
    body: "普尔在古典构图讲义中把宽底正立的金字塔（pyramid）视为画面物理稳定的原型，并以「秤杆原理（steelyard）」解析画面体量绕支点的平衡；倒三角正是故意翻转宽底原型，把重量推向高处而由底端单一支点承托，以此换取强烈的视觉张力。",
    diagram: "poore",
  },
  {
    year: "1926",
    author: "Wassily Kandinsky",
    workZh: "《点线面》",
    workEn: "Punkt und Linie zu Fläche",
    workNote: "包豪斯丛书第 9 卷",
    short: "上方轻盈 · 锐角张力",
    body: "康定斯基在基本平面分析中区分了「上方」的轻盈、松弛与自由感，以及「下方」的致密、沉重与约束感；当更宽大的体量悬于上方、斜线与锐角向下聚拢时，违背自然重力预期便激发出强烈的内在张力（Spannung）。",
    diagram: "kandinsky",
  },
  {
    year: "1954 / 1974",
    author: "Rudolf Arnheim",
    workZh: "《艺术与视知觉》",
    workEn: "Art and Visual Perception",
    workNote: "加州大学出版社",
    short: "格式塔视觉重量与上重感",
    body: "阿恩海姆用格式塔心理学说明：人类受重力经验支配，习惯画面下重上轻。当主要体量放在上方而下方收窄，视觉重量被抬高，就会激发出鲜明的势能与悬停张力。",
    diagram: "arnheim",
  },
  {
    year: "1959",
    author: "Frank Lloyd Wright",
    workZh: "纽约古根海姆美术馆",
    workEn: "Solomon R. Guggenheim Museum",
    workNote: "",
    short: "倒置金字塔建筑空间",
    body: "赖特刻意把传统上窄下宽的阶梯金字塔翻转成「倒置金字塔（inverted ziggurat）」：建筑越往上越开阔，顶部玻璃穹顶洒下天光，观众乘梯登顶再顺螺旋坡道盘旋向下看展。",
    diagram: "wright",
  },
  {
    year: "1991",
    author: "Molly Bang",
    workZh: "",
    workEn: "Picture This: How Pictures Work",
    workNote: "2016 年 25 周年修订版",
    short: "平底安稳 vs 尖端警觉",
    body: "莫莉·邦用极简剪纸向读者证明：平底三角因稳贴地面而令人安心，而把尖角朝下支立或以斜线收束会立刻触发警觉、悬念与向下运动预期。",
    diagram: "bang",
  },
]);

// ---------- 第 04 节：四类高光场景实景样张 ----------
export const APPLICATIONS = Object.freeze([
  {
    id: "nature",
    label: "自然风光",
    en: "GLACIAL LANDSCAPE",
    title: "极地冰山 · 深海潜影",
    caption: "大面积天幕在上方舒展，水面下冰基向下收成一点，把宏大静谧压缩为深邃张力。",
    cta: "EXPLORE 78°N",
    kicker: "ARCTIC MONOGRAPH · 043",
  },
  {
    id: "stage",
    label: "戏剧舞台",
    en: "THEATER SPOTLIGHT",
    title: "黑匣剧场 · 追光独舞",
    caption: "剧场顶部双束冷光呈 V 字切落暗幕，全部观众视线直锁舞台中央踮起的足尖。",
    cta: "ACT III · 20:00",
    kicker: "NATIONAL STAGE SEASON",
  },
  {
    id: "sport",
    label: "运动瞬间",
    en: "KINETIC MOTION",
    title: "十米高台 · 破水一刹",
    caption: "上方悬挑跳台与开阔天空制造势能落差，高速坠落轨迹直指池面唯一的溅水光点。",
    cta: "0.42s ENTRY",
    kicker: "AQUATIC FINALS",
  },
  {
    id: "web",
    label: "网页首屏 & 产品",
    en: "HERO FUNNEL / PRODUCT",
    title: "先给大视野，再收单一行动点",
    caption: "宽幅大标题 + 短一行副标 + 唯一按钮：网页首屏漏斗本质上就是排版版的倒三角构图。",
    cta: "立即预约体验",
    kicker: "NOIR CRYSTAL · EDITION",
  },
]);

// ---------- 第 05 节：什么时候别用（含同小类单句互链） ----------
export const ANTIPATTERNS = Object.freeze([
  {
    id: "authority",
    badTitle: "需要稳重、权威、长期信赖感",
    badDesc: "机构年报、建筑纪念碑、金融信任页强行用倒三角，上重下尖的悬停感反而让人潜意识觉得「摇摇欲坠」。",
    fixTitle: "改用正立三角或阶梯金字塔",
    fixDesc: "把宽阔基座放回底部承托，视觉重量落回地面。",
    links: [
      { id: "041", name: "041 三角构图", href: "https://layout.xiaoxiaodong.ai/041/play/" },
      { id: "042", name: "042 金字塔构图", href: "https://layout.xiaoxiaodong.ai/042/play/" },
    ],
  },
  {
    id: "heavy_footer",
    badTitle: "画面底部必须塞进大段说明或并排按钮",
    badDesc: "倒三角底部最窄，只容得下单一焦点。若在最下方铺开三列参数表或长段落，整个 V 形收束会被硬生生踩扁。",
    fixTitle: "改用矩形网格或四象限均分",
    fixDesc: "上下同宽或分区明确的框架才能稳妥承载等权信息块。",
    links: [
      { id: "046", name: "046 矩形构图", href: "https://layout.xiaoxiaodong.ai/046/play/" },
      { id: "056", name: "056 四象限构图", href: "https://layout.xiaoxiaodong.ai/056/play/" },
    ],
  },
  {
    id: "bidirectional",
    badTitle: "需要上下对称收尖，或四面柔和包裹",
    badDesc: "倒三角天生只向下方单点俯冲；若主题需要上下呼应、向中心凝聚或温和无棱角，硬套单向倒锥会显得生硬尖锐。",
    fixTitle: "按聚散方向换用菱形、向心或圆形",
    fixDesc: "上下双尖看菱形，四周向中聚看向心，温和围合看圆形，向外爆发看放射。",
    links: [
      { id: "044", name: "044 菱形构图", href: "https://layout.xiaoxiaodong.ai/044/play/" },
      { id: "053", name: "053 向心式构图", href: "https://layout.xiaoxiaodong.ai/053/play/" },
      { id: "047", name: "047 圆形构图", href: "https://layout.xiaoxiaodong.ai/047/play/" },
      { id: "052", name: "052 放射式构图", href: "https://layout.xiaoxiaodong.ai/052/play/" },
    ],
  },
  {
    id: "multi_equal",
    badTitle: "多个同等权重的主角需要平权并列",
    badDesc: "当顶部并排塞进四五个同等亮眼的商品或人物，又想强行收束到底部一点时，顶部失去统一主轴，两侧斜线根本收不住目光。",
    fixTitle: "合并为单一顶群，或退回方形秩序",
    fixDesc: "多主角平权展示更适合稳定均衡的方形秩序，而非单点收束。",
    links: [
      { id: "045", name: "045 方形构图", href: "https://layout.xiaoxiaodong.ai/045/play/" },
    ],
  },
]);

// ---------- 第 06 节：单变量小练习（上方冰山与对称 V 翼完全相同，仅差「底部聚焦落点」一变量） ----------
export const QUIZ_OPTIONS = Object.freeze([
  {
    key: "A",
    label: "方案 A",
    correct: false,
    apexDx: -0.17,
    anchorMode: "focus",
    verdict: "落点左偏脱离 V 尖，视线扑空且重心失衡",
    explain: "四张图的对称 V 形斜线和冰峰位置完全一致，但方案 A 把底部探照灯落点向左挪离了交汇尖端与重心垂线。眼睛顺斜线冲到底尖却落空，焦点与收束轴分裂，画面产生向左倾倒的不安感。",
  },
  {
    key: "B",
    label: "方案 B",
    correct: false,
    apexDx: 0,
    anchorMode: "none",
    verdict: "落点隐没暗水，视线漏出底边",
    explain: "上方空间与两侧 V 形斜线都做对了，却漏掉了原海报第三条关键动作——底部只留一道几乎融进暗水的微弱暗记，缺乏高对比。视线顺斜线冲到底端后直接滑出画框下沿，势能悬空散掉。",
  },
  {
    key: "C",
    label: "方案 C",
    correct: true,
    apexDx: 0,
    anchorMode: "focus",
    verdict: "唯一稳立：重心垂线 + 克制高对比落点",
    explain: "四张图里上方冰山、留白与对称 V 形斜线完全一致。唯独方案 C 把克制而高对比的聚焦落点稳稳安在冰山视觉重心垂线与 V 翼交汇尖端正下方，既接住了俯冲视线，又保住了「上宽下尖」的锐度。",
  },
  {
    key: "D",
    label: "方案 D",
    correct: false,
    apexDx: 0,
    anchorMode: "glare",
    verdict: "底部光带过宽反压顶部主体",
    explain: "把底部聚焦点铺成横跨下沿的宽亮光带与巨型泛光后，底端视觉体量暴涨，和上方冰山互相抢夺第一眼注意力，彻底削弱了「收束于一点」的尖端锐度。",
  },
]);

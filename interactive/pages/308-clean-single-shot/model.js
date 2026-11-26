// 308 净单人镜头 · 单真源几何、光学与诊断模型
// 开场取景台、左侧五枚原海报圆徽、底部圆角诊单盒、06 小练习全部从这里取同一组计算结果。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报·月轮侧影",
    shortLabel: "月轮侧影",
    bgHex: "#FCBCA6",
    bgShadowHex: "#9F5A4C",
    discHex: "#FCE7D0",
    silHex: "#050707",
    wallToneLum: 0.20,
    caption: "暖珊瑚棚背景 × 淡奶黄圆形逆光光池",
  },
  theater: {
    id: "theater",
    label: "暗台·剧场独白",
    shortLabel: "剧场独白",
    bgHex: "#3C1A20",
    bgShadowHex: "#200C10",
    discHex: "#F7DEC6",
    silHex: "#050707",
    wallToneLum: 0.05,
    caption: "剧场暗酒红幕布 × 追光圆形托底",
  },
  window: {
    id: "window",
    label: "静室·窗畔凝思",
    shortLabel: "窗畔凝思",
    bgHex: "#E8B7A2",
    bgShadowHex: "#8D5A4C",
    discHex: "#FFF2E2",
    silHex: "#060808",
    wallToneLum: 0.18,
    caption: "柔和室壁 × 晨光软箱逆光",
  },
};

// 开场刻意设为 0/4 四重复合错态（绝不先给答案）
export const INITIAL_STATE = {
  scene: "poster",
  fgShoulder: true,   // 左侧闯入同伴前肩（滑向 309 脏单人）
  bgExtra: true,      // 右侧背景路人剪影（画面不再只剩一人）
  bgPole: true,       // 背景竖杆直插头顶（Merger 轮廓叠线）
  bgClutter: true,    // 背景杂乱亮灯与墙框
  haloX: 0.85,        // 光池偏离到最右，脸部侧影陷在暗底里
  haloY: 0.46,
  haloRadius: 0.31,
  haloBright: 0.52,   // 光池偏暗
  aperture: 8.0,      // f/8.0 深景深把杂乱背景全拍锐利
  subjectX: 0.34,     // 人物偏左面壁窒息
  shotScale: 0.84,
  showGuides: true,
  highlightBadge: -1,
};

// 多组合法 4/4 解（验证并非只有唯一固定参数才算对）
export const VALID_PRESETS = {
  classic: {
    label: "原海报经典解",
    note: "忠实复现 308 原海报：全面清场、柔和奶黄圆月托起侧影、目光前方舒展留白。",
    patch: {
      fgShoulder: false,
      bgExtra: false,
      bgPole: false,
      bgClutter: false,
      haloX: 0.62,
      haloY: 0.45,
      haloRadius: 0.35,
      haloBright: 0.86,
      aperture: 2.8,
      subjectX: 0.62,
      shotScale: 0.86,
    },
  },
  closeup: {
    label: "情绪特写解",
    note: "更紧凑的特写景别配合 f/1.8 浅景深，轻微墙纹已被光学溶化，情绪浓度更高。",
    patch: {
      fgShoulder: false,
      bgExtra: false,
      bgPole: false,
      bgClutter: true, // 用 f/1.8 浅景深溶化背景轻杂物，展现光学解！
      haloX: 0.58,
      haloY: 0.44,
      haloRadius: 0.37,
      haloBright: 0.88,
      aperture: 1.8,
      subjectX: 0.58,
      shotScale: 0.96,
    },
  },
  breath: {
    label: "留白呼吸解",
    note: "主体稳落右侧偏外，前方让出近半幅呼吸负空间，克制寂静。",
    patch: {
      fgShoulder: false,
      bgExtra: false,
      bgPole: false,
      bgClutter: false,
      haloX: 0.68,
      haloY: 0.46,
      haloRadius: 0.33,
      haloBright: 0.84,
      aperture: 4.0,
      subjectX: 0.69,
      shotScale: 0.78,
    },
  },
};

// 双向试错对照（每一项都能稳定复现明确单真源错态）
export const FAIL_PRESETS = {
  dirty: {
    label: "脏边抢戏",
    patch: {
      fgShoulder: true,
      bgExtra: false,
      bgPole: false,
      bgClutter: false,
      haloX: 0.62,
      haloY: 0.45,
      haloRadius: 0.35,
      haloBright: 0.86,
      aperture: 2.8,
      subjectX: 0.62,
      shotScale: 0.86,
    },
  },
  merger: {
    label: "切头叠线",
    patch: {
      fgShoulder: false,
      bgExtra: false,
      bgPole: true,
      bgClutter: false,
      haloX: 0.62,
      haloY: 0.45,
      haloRadius: 0.35,
      haloBright: 0.86,
      aperture: 8.0,
      subjectX: 0.62,
      shotScale: 0.86,
    },
  },
  shortside: {
    label: "面壁窒息",
    patch: {
      fgShoulder: false,
      bgExtra: false,
      bgPole: false,
      bgClutter: false,
      haloX: 0.27,
      haloY: 0.45,
      haloRadius: 0.34,
      haloBright: 0.86,
      aperture: 2.8,
      subjectX: 0.27,
      shotScale: 0.86,
    },
  },
  darkmerge: {
    label: "暗底粘连",
    patch: {
      fgShoulder: false,
      bgExtra: false,
      bgPole: false,
      bgClutter: false,
      haloX: 0.16,
      haloY: 0.45,
      haloRadius: 0.24,
      haloBright: 0.30,
      aperture: 2.8,
      subjectX: 0.64,
      shotScale: 0.86,
    },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function relativeLuminance([r, g, b]) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(lumA, lumB) {
  const L1 = Math.max(lumA, lumB);
  const L2 = Math.min(lumA, lumB);
  return (L1 + 0.05) / (L2 + 0.05);
}

export function mixRgb(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

// 统一计算人物侧影在归一化画框 (0..1 × 0..1) 里的实绘几何与关键轮廓采样点
export function computeGeometry(state, aspect = 1.28) {
  const s = clamp(state.shotScale, 0.42, 1.16);
  // 人物盒高度相对画框高，保持绝对等比（aspect 用于保证圆月在任意画幅都是正圆）
  const boxH = 0.90 * s;
  const boxW = (boxH * 0.80) / aspect;
  const cx = clamp(state.subjectX, 0.16, 0.92);
  const bottomY = 1.02 + Math.max(0, (s - 0.86) * 0.12);
  const topY = bottomY - boxH;
  const leftX = cx - boxW * 0.5;

  // 基于实测原海报 308 侧影在裁剪盒内的相对坐标
  const headTopY = topY + boxH * 0.05;
  const noseX = leftX + boxW * 0.22;
  const noseY = topY + boxH * 0.30;
  const foreheadX = leftX + boxW * 0.29;
  const foreheadY = topY + boxH * 0.18;
  const chinX = leftX + boxW * 0.23;
  const chinY = topY + boxH * 0.41;
  const bunX = leftX + boxW * 0.90;
  const bunY = topY + boxH * 0.27;
  const crownX = leftX + boxW * 0.56;
  const eyeLineY = topY + boxH * 0.24;

  // 圆月光池以画框高度为基准半径（确保任何宽高比屏幕永远正圆）
  const haloRx = state.haloRadius / aspect;
  const haloRy = state.haloRadius;
  const haloCx = clamp(state.haloX, 0.10, 0.90);
  const haloCy = clamp(state.haloY, 0.24, 0.64);

  // 干扰元素在归一化空间里的点击热区与几何位置
  const fgShoulderRect = { x: 0.0, y: 0.36, w: 0.25, h: 0.64 };
  // 穿头竖杆贴合头顶上方附近
  const poleX = clamp(crownX + 0.015, 0.18, 0.88);
  const bgPoleRect = { x: poleX - 0.025, y: 0.0, w: 0.05, h: 0.72, poleX };
  const bgExtraRect = { x: Math.min(0.84, Math.max(0.76, cx + boxW * 0.52)), y: 0.44, w: 0.15, h: 0.56 };
  const bgClutterRect = { x: 0.12, y: 0.10, w: 0.22, h: 0.28 };

  const profileSamples = [
    { name: "forehead", x: foreheadX, y: foreheadY },
    { name: "brow", x: leftX + boxW * 0.26, y: topY + boxH * 0.24 },
    { name: "nose", x: noseX, y: noseY },
    { name: "lips", x: leftX + boxW * 0.24, y: topY + boxH * 0.36 },
    { name: "chin", x: chinX, y: chinY },
    { name: "bun", x: bunX, y: bunY },
  ];

  return {
    aspect,
    box: { x: leftX, y: topY, w: boxW, h: boxH },
    cx,
    headTopY,
    noseX,
    noseY,
    chinX,
    chinY,
    bunX,
    bunY,
    crownX,
    eyeLineY,
    halo: { cx: haloCx, cy: haloCy, r: state.haloRadius, rx: haloRx, ry: haloRy },
    fgShoulderRect,
    bgPoleRect,
    bgExtraRect,
    bgClutterRect,
    profileSamples,
  };
}

// 模拟薄透镜弥散圆背景虚化像素（示意物理规律）
export function computeBlurPx(aperture) {
  const f = clamp(aperture, 1.4, 16);
  // f/1.4 -> ~13px, f/2.0 -> ~9px, f/2.8 -> ~6.2px, f/5.6 -> ~2.6px, f/8 -> ~1.5px, f/11 -> ~0.8px
  return +(18.5 / f - 0.7).toFixed(1);
}

// 完整单真源诊断：输出 4 项硬指标、5 枚海报圆徽实时状态、实测读数与精准白话诊单
export function evaluate(state, aspect = 1.28) {
  const sc = SCENES[state.scene] || SCENES.poster;
  const g = computeGeometry(state, aspect);
  const blurPx = Math.max(0.4, computeBlurPx(state.aperture));

  // 1. 计算脸部侧影轮廓实际像素明度比（同一套颜色直接算，绝不写死常量）
  const baseBgRgb = hexToRgb(sc.bgHex);
  const shadowRgb = hexToRgb(sc.bgShadowHex);
  const discRgb = hexToRgb(sc.discHex);
  const silLum = relativeLuminance(hexToRgb(sc.silHex));

  // 背景未照到光池处（光池暗时底面压暗拉低轮廓分离；光池点亮到正常档时回到原海报纯正暖珊瑚 #FCBCA6）
  const ambientFactor = state.scene === "theater" ? 0.15 : clamp((state.haloBright - 0.35) / 0.50, 0.12, 1.0);
  const unlitRgb = mixRgb(shadowRgb, baseBgRgb, clamp(ambientFactor, 0, 1));
  const litRgb = mixRgb(unlitRgb, discRgb, clamp(state.haloBright, 0, 1));
  const unlitLum = relativeLuminance(unlitRgb);
  const litLum = relativeLuminance(litRgb);

  let litCount = 0;
  let facialContrastSum = 0;
  let facialCount = 0;
  const sampleResults = g.profileSamples.map((pt) => {
    const dx = (pt.x - g.halo.cx) * aspect;
    const dy = pt.y - g.halo.cy;
    const dist = Math.hypot(dx, dy);
    const inDisc = dist <= g.halo.r * 0.98;
    const edgeFall = dist <= g.halo.r ? 1 : clamp(1 - (dist - g.halo.r) / 0.08, 0, 1);
    const bgLum = unlitLum + (litLum - unlitLum) * edgeFall;
    const ratio = contrastRatio(bgLum, silLum);
    if (pt.name !== "bun") {
      facialContrastSum += ratio;
      facialCount++;
      if (inDisc && state.haloBright >= 0.56) litCount++;
    }
    return { ...pt, inDisc, ratio: +ratio.toFixed(1) };
  });

  const contourRatio = +(facialContrastSum / Math.max(1, facialCount)).toFixed(1);
  const profileLitPct = Math.round((litCount / Math.max(1, facialCount)) * 100);

  // 2. 视线呼吸空间与裁切几何（主角面向左）
  const rawLookRoomPct = Math.round(clamp(g.noseX, 0, 1) * 100);
  const fgIntrudeRight = state.fgShoulder ? g.fgShoulderRect.w * 0.88 : 0;
  const effectiveLookRoomPct = Math.round(clamp(g.noseX - fgIntrudeRight, 0, 1) * 100);
  const rearMarginPct = Math.round((1 - g.bunX) * 100);
  const headroomPct = Math.round(g.headTopY * 100);
  const subjectHeightPct = Math.round(clamp(1 - g.headTopY, 0, 1) * 100);

  // 3. 四大核心条件核验
  // (A) 主体纯净：不能有前景脏肩，不能有背景第二人
  const cleanSubjectOk = !state.fgShoulder && !state.bgExtra;

  // (B) 背景简化：不能有穿头竖杆叠线；背景杂墙亮灯要么物理清掉，要么用 f/2.2 以内大光圈光学溶化
  const clutterDissolvedByDof = state.bgClutter && state.aperture <= 2.2;
  const cleanBackgroundOk = !state.bgPole && (!state.bgClutter || clutterDissolvedByDof);

  // (C) 边缘清晰：脸部侧影轮廓落在光池亮区且对比度足够（≥ 8.8:1 且 ≥ 60% 脸部轮廓被圆月托起），且不过曝刺眼、发髻未被右框硬切
  const overblown = state.haloBright > 0.96 && state.haloRadius > 0.41;
  const clippedRight = g.bunX > 0.965;
  const clippedLeft = g.noseX < 0.08;
  const clippedTop = g.headTopY < 0.04;
  const silhouetteOk =
    !state.bgPole &&
    contourRatio >= (state.scene === "theater" ? 7.8 : 9.2) &&
    profileLitPct >= 60 &&
    !overblown &&
    !clippedRight &&
    !clippedLeft;

  // (D) 画面呼吸与情绪集中：前方视线留白舒展（≥ 32% 且 ≤ 68%）、景别不过远蚁缩（人物高 ≥ 58%）也不顶额裁头
  const suffocatedLeft = effectiveLookRoomPct < 30;
  const tooSmall = subjectHeightPct < 58;
  const tooTight = clippedTop || state.shotScale > 1.06;
  const breathingOk = !suffocatedLeft && !clippedRight && !tooSmall && !tooTight;

  const passedCount = [cleanSubjectOk, cleanBackgroundOk, silhouetteOk, breathingOk].filter(Boolean).length;

  // 4. 按严重度列出所有当前命中的真实错态（支持 9 类双向错态）
  const issues = [];
  if (state.fgShoulder) {
    issues.push({
      code: "fg-shoulder",
      short: "脏边前肩",
      title: "左缘闯入同伴黑肩，镜头已滑成脏单人",
      body: `左侧前景被另一人的肩影占去约 ${Math.round(fgIntrudeRight * 100)}% 画幅。观众一眼先问「对面站着谁」，注意力不再属于主角一人（想讲双人关系请改用 309 脏单人镜头）。`,
      action: "直接点击画布左侧的虚线红框黑肩（或关掉「前肩干扰」），把同伴请出画框。",
    });
  }
  if (state.bgExtra) {
    issues.push({
      code: "bg-extra",
      short: "背景路人",
      title: "画面里多出第二个人影，情绪被一分为二",
      body: "净单人镜头的核心是「一人 · 一瞬 · 一画面」。右侧背景徘徊的路人虽然面积不大，但人脑对人形轮廓极其敏感，会不断把视线从主角脸上拉走。",
      action: "直接点击画布右侧的背景路人剪影（或关掉「背景路人」），清场只留一人。",
    });
  }
  if (state.bgPole) {
    issues.push({
      code: "bg-pole",
      short: "穿头叠线",
      title: "背景竖杆从头顶穿出，轮廓发生视觉粘连",
      body: "摄影棚里最常见的「穿脑叠线（Merger）」：一条高对比暗竖线紧贴主角发顶延伸出去，眼睛在瞬间识别时会把它误判成头顶长出的杂物，破坏剪影纯净度。",
      action: "直接点击主角头顶的暗竖杆将其撤掉（清场比后期修图快十倍）。",
    });
  }
  if (state.bgClutter && !clutterDissolvedByDof) {
    issues.push({
      code: "bg-clutter",
      short: "杂墙亮灯",
      title: `后墙亮灯与杂框在 f/${state.aperture.toFixed(1)} 下清晰抢戏`,
      body: `当前光圈 f/${state.aperture.toFixed(1)}（背景虚化仅 ${blurPx}px，示意），后墙的矩形画框与发光壁灯边缘锐利，直接与主角面部侧影争抢第一落点。`,
      action: "点击画布左上角的亮灯壁框撤除杂物，或把光圈开大到 f/2.2 以内用浅景深将其溶化。",
    });
  }
  if (clippedRight) {
    issues.push({
      code: "clip-right",
      short: "右框切影",
      title: "人物过分贴向右缘，后脑发髻已被画框切缺",
      body: `当前后脑距右框仅余 ${rearMarginPct}% ，发髻轮廓被生生截断。边缘一旦残缺，剪影的整体识别力和画面呼吸感同时崩塌。`,
      action: "把「主体落位」往左回调到 52%–72% 区间，让整颗头部轮廓完整留在框内。",
    });
  }
  if (profileLitPct < 60 || contourRatio < (state.scene === "theater" ? 7.8 : 9.2)) {
    issues.push({
      code: "dark-merge",
      short: `对比 ${contourRatio}:1`,
      title: `圆月光池偏离侧影，面部轮廓与底色糊在一起（${contourRatio}:1）`,
      body: `目前只有 ${profileLitPct}% 的面部侧影轮廓落在亮光池上，额头到鼻尖的剪影边缘陷在偏暗底色里，鲁宾图底分离变弱，一眼读不出利落侧脸。`,
      action: "在画布上左右拖动淡奶黄圆月光池，移到主角脸侧正后方，并把光池亮度推到 68% 以上。",
    });
  }
  if (overblown) {
    issues.push({
      code: "overblown",
      short: "光池过爆",
      title: "逆光光池过亮过满，刺眼溢光吞掉层次",
      body: "背景光池开到极亮又铺得过满时，强反差边缘在真实镜头里会产生溢光晕染，反而失去了原海报柔润温暖的奶油底托感。",
      action: "把光池亮度稍微收回 76%–92%，或略收光池半径留出外围珊瑚底呼吸感。",
    });
  }
  if (suffocatedLeft) {
    issues.push({
      code: "short-side",
      short: `面壁 ${effectiveLookRoomPct}%`,
      title: `视线前方仅剩 ${effectiveLookRoomPct}% 空间，人物像面壁窒息`,
      body: `主角面向左侧，鼻尖却挤在左框附近，目光刚离开眼睛就撞到画面边界；而脑后留出大片空洞，违背「画面有呼吸」的视线余量经验值（34%–62%）。`,
      action: "把「主体落位」向右滑到 54%–72%，顺着目光朝向打开舒展的呼吸留白。",
    });
  }
  if (tooSmall) {
    issues.push({
      code: "too-small",
      short: `过远 ${subjectHeightPct}%`,
      title: `人物仅占画高 ${subjectHeightPct}%，情绪被空房间吞没`,
      body: "镜头退得太远时，虽然背景干净，但人物剪影缩成画面一角，观众读不到细微姿态与呼吸节奏（交代大环境请改用 307 客观视角构图）。",
      action: "推进「景别尺度」让主体稳稳撑起 68%–94% 的视觉存在感。",
    });
  }
  if (tooTight) {
    issues.push({
      code: "too-tight",
      short: "顶框压头",
      title: `头顶距上框仅 ${headroomPct}%，画面顶额发闷`,
      body: "景别推得过死把发顶挤到上框边缘，头顶没有一丝空气，观众会感到窒息而不是克制的静谧。",
      action: "稍微回调「景别尺度」，给头顶留出 8%–22% 的呼吸空间（经验值）。",
    });
  }

  // 生成顶部与底部诊断文
  let headline, body, action, badgeTag;
  if (passedCount === 4) {
    const styleDesc = clutterDissolvedByDof
      ? `（背景轻纹已由 f/${state.aperture.toFixed(1)} 浅景深光学溶化）`
      : "（空间清场干净彻底）";
    headline = "一人 · 一瞬 · 一画面：净单人镜头稳稳成立";
    body = `画框内零干扰人物${styleDesc}，淡奶黄光池把侧影轮廓明度比推到 ${contourRatio}:1，视线前方留出 ${effectiveLookRoomPct}% 呼吸余量。眼睛在 0.3 秒内直接锁住主角，不需要任何多余解释。`;
    action = "按 Space 跑一次「0.8s 读图验真」，或点下方「双向试错」故意破坏某一项，看看画面如何瞬间失衡。";
    badgeTag = `4/4 · 净单人成立`;
  } else {
    const primary = issues[0];
    headline = primary.title;
    body = primary.body;
    action = primary.action;
    badgeTag = `${passedCount}/4 · ${primary.short}`;
  }

  // 对应原海报左栏 5 枚酒红圆徽实时探针
  const posterBadges = [
    {
      index: 0,
      zh: "主体纯净",
      en: "CLEAN SUBJECT",
      posterBody: "只保留一个主体，避免干扰元素。",
      ok: cleanSubjectOk,
      status: cleanSubjectOk
        ? "仅余 1 人"
        : state.fgShoulder && state.bgExtra
          ? "前肩+路人"
          : state.fgShoulder
            ? "脏边前肩"
            : "多出路人",
    },
    {
      index: 1,
      zh: "背景简化",
      en: "SIMPLIFIED BACKGROUND",
      posterBody: "去繁就简，让背景为主体服务。",
      ok: cleanBackgroundOk,
      status: cleanBackgroundOk
        ? clutterDissolvedByDof
          ? `f/${state.aperture.toFixed(1)} 溶化`
          : "背景纯净"
        : state.bgPole && state.bgClutter
          ? "竖杆+杂墙"
          : state.bgPole
            ? "穿头竖杆"
            : `f/${state.aperture.toFixed(1)} 过锐`,
    },
    {
      index: 2,
      zh: "边缘清晰",
      en: "SILHOUETTE",
      posterBody: "轮廓明确，利于识别与聚焦。",
      ok: silhouetteOk,
      status: silhouetteOk
        ? `对比 ${contourRatio}:1`
        : state.bgPole
          ? "竖杆断边"
          : clippedRight
            ? "右框切影"
            : overblown
              ? "过爆溢光"
              : `对比 ${contourRatio}:1`,
    },
    {
      index: 3,
      zh: "情绪集中",
      en: "EMOTION FOCUS",
      posterBody: "减少信息干扰，强化情绪表达。",
      ok: breathingOk && cleanSubjectOk,
      status: breathingOk && cleanSubjectOk
        ? `视线留白 ${effectiveLookRoomPct}%`
        : suffocatedLeft
          ? `面壁 ${effectiveLookRoomPct}%`
          : tooSmall
            ? `过远 ${subjectHeightPct}%`
            : tooTight
              ? "顶框发闷"
              : "干扰分神",
    },
    {
      index: 4,
      zh: "可读性",
      en: "READABILITY",
      posterBody: "构图简洁，层次清楚，一眼读懂。",
      ok: passedCount === 4,
      status: passedCount === 4 ? "一眼读懂" : `${4 - passedCount} 处阻读`,
    },
  ];

  // 计算 0.8s 读图眼动模拟落点（杂乱时目光跳动，干净时一拍落脸并顺势进入前方呼吸空间）
  const gazeNodes = [];
  if (state.fgShoulder) gazeNodes.push({ x: 0.14, y: 0.62, label: "前肩拉走" });
  if (state.bgClutter && !clutterDissolvedByDof) gazeNodes.push({ x: 0.22, y: 0.22, label: "亮灯抢眼" });
  if (state.bgExtra) gazeNodes.push({ x: g.bgExtraRect.x + 0.06, y: 0.58, label: "路人分神" });
  if (state.bgPole) gazeNodes.push({ x: g.bgPoleRect.poleX, y: Math.max(0.10, g.headTopY - 0.02), label: "竖杆割眼" });
  gazeNodes.push({ x: g.noseX + 0.04, y: g.eyeLineY + 0.03, label: passedCount === 4 ? "0.2s 锁定侧影" : "迟滞回落主体" });
  if (passedCount === 4) {
    gazeNodes.push({
      x: Math.max(0.16, g.noseX * 0.48),
      y: g.eyeLineY + 0.02,
      label: "视线舒展呼吸",
    });
  }

  return {
    geometry: g,
    scene: sc,
    blurPx,
    contourRatio,
    profileLitPct,
    lookRoomPct: effectiveLookRoomPct,
    rawLookRoomPct,
    rearMarginPct,
    headroomPct,
    subjectHeightPct,
    cleanSubjectOk,
    cleanBackgroundOk,
    silhouetteOk,
    breathingOk,
    clutterDissolvedByDof,
    passedCount,
    issues,
    headline,
    body,
    action,
    badgeTag,
    posterBadges,
    sampleResults,
    gazeNodes,
  };
}

// 06 小练习的严格单变量四选项（全部干净背景、85mm f/2.0、光池紧贴人物，仅变 subjectX 水平落位）
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "构图 A",
    correct: false,
    state: {
      ...INITIAL_STATE,
      scene: "poster",
      fgShoulder: false,
      bgExtra: false,
      bgPole: false,
      bgClutter: false,
      aperture: 2.0,
      shotScale: 0.86,
      subjectX: 0.25,
      haloX: 0.26,
      haloY: 0.45,
      haloRadius: 0.34,
      haloBright: 0.86,
      showGuides: false,
    },
    reason: "人物面向左侧却被推到最左（视线前方净空仅约 11%），鼻尖几乎贴死左框，背后空出整片无意义留白，画面发堵窒息。",
  },
  {
    id: "B",
    label: "构图 B",
    correct: false,
    state: {
      ...INITIAL_STATE,
      scene: "poster",
      fgShoulder: false,
      bgExtra: false,
      bgPole: false,
      bgClutter: false,
      aperture: 2.0,
      shotScale: 0.86,
      subjectX: 0.37,
      haloX: 0.38,
      haloY: 0.45,
      haloRadius: 0.34,
      haloBright: 0.86,
      showGuides: false,
    },
    reason: "最容易迷惑的一帧：轮廓虽完整、鼻尖未撞边，但前方视线空间仍明显窄于脑后空隙（约 23%），情绪仍被左框隐约挡住。",
  },
  {
    id: "C",
    label: "构图 C",
    correct: true,
    state: {
      ...INITIAL_STATE,
      scene: "poster",
      fgShoulder: false,
      bgExtra: false,
      bgPole: false,
      bgClutter: false,
      aperture: 2.0,
      shotScale: 0.86,
      subjectX: 0.62,
      haloX: 0.62,
      haloY: 0.45,
      haloRadius: 0.34,
      haloBright: 0.86,
      showGuides: false,
    },
    reason: "正解：人物稳落右侧三分呼吸位，顺着向左的目光展开近半幅舒展负空间，整颗侧影与发髻完整被奶黄圆月托起，真正做到「主体清晰，画面有呼吸」。",
  },
  {
    id: "D",
    label: "构图 D",
    correct: false,
    state: {
      ...INITIAL_STATE,
      scene: "poster",
      fgShoulder: false,
      bgExtra: false,
      bgPole: false,
      bgClutter: false,
      aperture: 2.0,
      shotScale: 0.86,
      subjectX: 0.88,
      haloX: 0.84,
      haloY: 0.45,
      haloRadius: 0.34,
      haloBright: 0.86,
      showGuides: false,
    },
    reason: "为了留左侧空白把主体挤向右缘过头，后脑发髻已被右框生生裁缺一角，违背原海报「边缘清晰、轮廓完整」的底线。",
  },
];

// 139 无出血版式 · 单真源几何核算模型
// 所有实印尺寸基于 ISO 216 A4 成品纸（210 × 297 mm），画布、读数、探针与印检章全部从此模块实时算出。

export const SHEET = {
  w: 210, // mm (ISO 216 A4 width)
  h: 297, // mm (ISO 216 A4 height)
};

export const PRESSES = {
  laser: {
    id: "laser",
    label: "办公激光",
    short: "4.23 mm 死区",
    dead: { top: 4.23, right: 4.23, bottom: 4.23, left: 4.23 },
    defaultDrift: 1.8,
    summary: "Brother/HP 等桌面激光机滚轴与定影器须避开纸边约 4.23 mm，落入死区的内容会被硬件直接裁白。",
  },
  copier: {
    id: "copier",
    label: "图文快印",
    short: "双面 ±2.5 mm",
    dead: { top: 4.5, right: 4.5, bottom: 4.5, left: 4.5 },
    defaultDrift: 2.5,
    summary: "快印店高速双面进纸常出现 ±1.8–2.5 mm 走纸偏移，细边框若离纸边过近会立刻显得歪斜。",
  },
  offset: {
    id: "offset",
    label: "胶印咬口",
    short: "前缘 10 mm 咬口",
    dead: { top: 10.0, right: 4.0, bottom: 4.5, left: 4.0 },
    defaultDrift: 1.2,
    summary: "单张纸胶印机前缘需留 8–12 mm 机械咬口供金属咬牙叼纸走过滚筒，天头不能落墨。",
  },
};

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报 · 典藏版画",
    short: "原海报版画",
    en: "ARCHIVAL SPECIMEN",
  },
  memo: {
    id: "memo",
    label: "办公激光 · 正式公函",
    short: "激光公函",
    en: "OFFICE LASER BRIEF",
  },
  book: {
    id: "book",
    label: "经典书籍 · 单页版心",
    short: "书页版心",
    en: "BOOK TYPE AREA",
  },
};

export const DRIFT_PRESETS = [
  { value: 1.2, label: "±1.2 mm", note: "精密单张" },
  { value: 1.8, label: "±1.8 mm", note: "办公激光" },
  { value: 2.5, label: "±2.5 mm", note: "快印双面" },
];

// 开场默认坏态（0/4 四重失守：绝非答案）
export const OPEN_BAD_STATE = {
  specimen: "poster",
  press: "laser",
  driftMm: 1.8,
  sideMm: 3.5,
  topMm: 13.0,
  bottomMm: 4.5,
  innerPadMm: 1.0,
  highlight: null,
};

// 多组合法解（全部由同一几何方程算出 4/4）
export const SOLUTIONS = {
  poster: {
    label: "原海报典藏解",
    sideMm: 15,
    topMm: 16,
    bottomMm: 19,
    innerPadMm: 9,
  },
  office: {
    label: "公文稳妥解",
    sideMm: 20,
    topMm: 22,
    bottomMm: 26,
    innerPadMm: 8,
  },
  book: {
    label: "古典书页解",
    sideMm: 16,
    topMm: 18,
    bottomMm: 30,
    innerPadMm: 9,
  },
};

// 双向试错标本（展示不足与过头两类坏态）
export const FAILURE_CASES = {
  clip: {
    label: "死区吞边",
    press: "laser",
    driftMm: 1.8,
    sideMm: 3.5,
    topMm: 13.0,
    bottomMm: 4.5,
    innerPadMm: 1.0,
  },
  skew: {
    label: "细边露歪",
    press: "copier",
    driftMm: 2.5,
    sideMm: 8.0,
    topMm: 14.0,
    bottomMm: 16.0,
    innerPadMm: 8.0,
  },
  stamp: {
    label: "缩成邮票",
    press: "laser",
    driftMm: 1.8,
    sideMm: 41.0,
    topMm: 42.0,
    bottomMm: 48.0,
    innerPadMm: 10.0,
  },
  gripper: {
    label: "咬口撞边",
    press: "offset",
    driftMm: 1.2,
    sideMm: 16.0,
    topMm: 8.0,
    bottomMm: 20.0,
    innerPadMm: 9.0,
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const round1 = (v) => Math.round(v * 10) / 10;
export const round2 = (v) => Math.round(v * 100) / 100;

// 单真源几何核算：传入 state，输出纸张、死区、偏移后边界、版心占比、歪斜放大倍率与四项实时诊断
export function evaluate(state) {
  const press = PRESSES[state.press] || PRESSES.laser;
  const dead = press.dead;
  const sideMm = clamp(Number(state.sideMm), 2, 44);
  const topMm = clamp(Number(state.topMm), 2, 48);
  const bottomMm = clamp(Number(state.bottomMm), 2, 52);
  const innerPadMm = clamp(Number(state.innerPadMm), 0, 22);
  const driftMm = clamp(Number(state.driftMm), 0, 3.2);

  // 进纸偏斜模拟：横向偏移 -driftMm（左侧变窄、右侧变宽），纵向偏移 +driftMm*0.55（底边变窄、顶边变宽）
  const shiftX = -driftMm;
  const shiftY = round1(driftMm * 0.55);
  const tiltDeg = round1(driftMm * 0.22);

  // 标称外框（纸面坐标系 mm）
  const nominalFrame = {
    x: sideMm,
    y: topMm,
    w: Math.max(20, SHEET.w - sideMm * 2),
    h: Math.max(30, SHEET.h - topMm - bottomMm),
  };

  // 实际进纸偏移后的四边剩余白边（mm）
  const effLeft = round1(sideMm + shiftX);
  const effRight = round1(sideMm - shiftX);
  const effTop = round1(topMm + shiftY);
  const effBottom = round1(bottomMm - shiftY);

  // 实际偏移后的外框矩形
  const shiftedFrame = {
    x: effLeft,
    y: effTop,
    w: nominalFrame.w,
    h: nominalFrame.h,
  };

  // 安全内区（核心图文包围盒）
  const innerBox = {
    x: shiftedFrame.x + innerPadMm,
    y: shiftedFrame.y + innerPadMm,
    w: Math.max(10, shiftedFrame.w - innerPadMm * 2),
    h: Math.max(14, shiftedFrame.h - innerPadMm * 2),
  };

  // 各边侵占硬件死区的毫米数（> 0 即物理裁缺）
  const clipLeft = Math.max(0, round1(dead.left - effLeft));
  const clipRight = Math.max(0, round1(dead.right - effRight));
  const clipTop = Math.max(0, round1(dead.top - effTop));
  const clipBottom = Math.max(0, round1(dead.bottom - effBottom));
  const maxClip = round1(Math.max(clipLeft, clipRight, clipTop, clipBottom));
  const topGripperHit = press.id === "offset" && (topMm < dead.top + 1.5 || effTop < dead.top + 0.5);

  // 与硬件死区的最小净余量
  const clearances = {
    left: round1(effLeft - dead.left),
    right: round1(effRight - dead.right),
    top: round1(effTop - dead.top),
    bottom: round1(effBottom - dead.bottom),
  };
  const minClearance = round1(Math.min(clearances.left, clearances.right, clearances.top, clearances.bottom));

  // 左右实印白边歪斜放大倍率（同一机械偏移下，边距越窄比值越刺眼）
  const skewRatio =
    effLeft <= 0.4
      ? 9.9
      : round2(Math.max(effLeft, effRight) / Math.max(0.4, Math.min(effLeft, effRight)));

  // 版心与核心内区占整纸面积比
  const sheetArea = SHEET.w * SHEET.h;
  const frameAreaPct = Math.round(((nominalFrame.w * nominalFrame.h) / sheetArea) * 100);
  const innerAreaPct = Math.round(((innerBox.w * innerBox.h) / sheetArea) * 100);

  // 光学重心差（底边 - 顶边；传统无出血页地脚应等于或略厚于天头，防止视觉下坠）
  const footLiftMm = round1(bottomMm - topMm);

  // ---------- 四项独立单真源判据 ----------
  // 1. 硬件印刷安全（印刷 PRINTING / 印刷友好）
  const printOk = maxClip === 0 && minClearance >= 1.0 && !topGripperHit;
  let printCode = "ok";
  let printTag = `余量 +${minClearance.toFixed(1)}mm`;
  if (topGripperHit) {
    printCode = "gripper";
    printTag = `咬口撞边 ${topMm.toFixed(1)}mm`;
  } else if (maxClip > 0) {
    printCode = "clip";
    printTag = `死区吞边 ${maxClip.toFixed(1)}mm`;
  } else if (minClearance < 1.0) {
    printCode = "tight-dead";
    printTag = `贴死区 +${minClearance.toFixed(1)}mm`;
  }

  // 2. 走偏可控性（安全区 SAFE ZONE / 安全可控）
  const skewOk = skewRatio <= 1.38 && effBottom >= dead.bottom + 1.0 && effLeft >= dead.left + 1.0;
  let skewCode = "ok";
  let skewTag = `走偏比 ${skewRatio.toFixed(2)}×`;
  if (effLeft <= 0.6 || effBottom <= 0.6) {
    skewCode = "offsheet";
    skewTag = "走偏出纸";
  } else if (skewRatio > 1.38) {
    skewCode = "skew";
    skewTag = `歪斜 ${skewRatio.toFixed(2)}×`;
  } else if (!skewOk) {
    skewCode = "tight-shift";
    skewTag = "底边吃紧";
  }

  // 3. 边距明确与光学比例（边距 MARGIN / 边距明确）
  const tooSmall = sideMm < 10 || topMm < 10 || bottomMm < 11;
  const opticalDrop = footLiftMm < -0.5;
  const tooFloating = bottomMm > topMm * 2.45 || topMm > 35;
  const postageStamp = frameAreaPct < 45 || sideMm > 35 || bottomMm > 46;
  const marginOk = !tooSmall && !opticalDrop && !tooFloating && !postageStamp;

  let marginCode = "ok";
  let marginTag = `版心 ${frameAreaPct}%`;
  if (postageStamp) {
    marginCode = "stamp";
    marginTag = `缩成邮票 ${frameAreaPct}%`;
  } else if (tooSmall) {
    marginCode = "narrow";
    marginTag = `外边过窄 ${Math.min(sideMm, topMm, bottomMm).toFixed(1)}mm`;
  } else if (opticalDrop) {
    marginCode = "drop";
    marginTag = `光学下坠 ${footLiftMm.toFixed(1)}mm`;
  } else if (tooFloating) {
    marginCode = "float";
    marginTag = "顶高悬空";
  }

  // 4. 框内气口克制（克制 CONTROL）
  const innerChoked = innerPadMm < 4.5;
  const innerCrushed = innerPadMm > 18.5 || innerAreaPct < 30;
  const controlOk = !innerChoked && !innerCrushed;

  let controlCode = "ok";
  let controlTag = `内气口 ${innerPadMm.toFixed(1)}mm`;
  if (innerChoked) {
    controlCode = "choke";
    controlTag = `内框顶死 ${innerPadMm.toFixed(1)}mm`;
  } else if (innerCrushed) {
    controlCode = "crush";
    controlTag = `内区压扁 ${innerAreaPct}%`;
  }

  const passed = [marginOk, skewOk, printOk, controlOk].filter(Boolean).length;

  // ---------- 白话原因诊断（优先级按真实危害排序，绝不报假精确） ----------
  let headline = "";
  let reason = "";
  let action = "";
  let statusBadge = `${passed}/4`;

  if (passed === 4) {
    statusBadge = "4/4 · 印检合格";
    headline = "四边稳避死区，走纸偏斜被白边彻底消化";
    reason = `当前最小死区净余 +${minClearance.toFixed(1)} mm，在 ±${driftMm.toFixed(1)} mm 走纸偏移下左右白边比仅为 ${skewRatio.toFixed(2)}×，人眼几乎察觉不到偏斜；版心占整纸 ${frameAreaPct}%，地脚比天头稳托 ${footLiftMm >= 0 ? "+" : ""}${footLiftMm.toFixed(1)} mm，克制而从容。`;
    action = "可继续切换「办公公函」「书页版心」或调高走偏到 ±2.5 mm，检验同一边距在不同机台下的余量。";
  } else if (topGripperHit) {
    statusBadge = `${passed}/4 · 咬口撞边`;
    headline = `天头仅 ${topMm.toFixed(1)}\u00A0mm，撞进了 ${dead.top.toFixed(0)}\u00A0mm 胶印咬口带`;
    reason = "单张纸胶印机的金属咬牙必须夹住纸张前缘 8–12 mm 拉纸过滚筒，这一带物理上无法着墨。你的顶部双绿框与抬头会直接在印张上缺掉一条。";
    action = "向下拖开顶部绿框（或拉大「天头边距」滑轨），让天头至少退到 14 mm 以上。";
  } else if (maxClip > 0) {
    statusBadge = `${passed}/4 · 死区吞边`;
    headline = `外框压进硬件不可印区，实印被截缺 ${maxClip.toFixed(1)}\u00A0mm`;
    reason = `${press.label}的物理不可印死区为 ${dead.left.toFixed(2)} mm，叠加 ±${driftMm.toFixed(1)} mm 进纸偏移后，实印绿框外线直接撞进机器无法定影/着墨的盲带，印出来会少掉一条边。`;
    action = "在画布上向内横拖左右绿框（或把左右与底边扩到 14 mm 以上），先彻底离开红色斜线死区。";
  } else if (postageStamp) {
    statusBadge = `${passed}/4 · 缩成邮票`;
    headline = `边距留得过头，安全版心被挤成 ${frameAreaPct}% 的小邮票`;
    reason = "无出血讲的是「克制」而不是「胆怯」。四周白边超过 36 mm 后，整张 A4 一半以上沦为空洞浪费，标题和画面体量瞬间缩水。";
    action = "把绿框往外推回 15–24 mm 区间，让安全版心回到 50%–76% 的舒服尺度。";
  } else if (skewCode === "skew") {
    statusBadge = `${passed}/4 · 细边露歪`;
    headline = `躲过了死区，但 ±${driftMm.toFixed(1)}\u00A0mm 偏移把左右边拉成 ${skewRatio.toFixed(2)}× 歪框`;
    reason = `左右白边实印后变成 ${effLeft.toFixed(1)} mm 对 ${effRight.toFixed(1)} mm。边距越窄，同一次机器走偏占边距的比例就越大，人眼会顺着绿框外线一眼看出「印歪了」。`;
    action = "向右扩大「左右边距」到 14 mm 以上（快印 ±2.5 mm 建议 ≥ 17 mm），把左右比压到 1.38× 以内。";
  } else if (opticalDrop) {
    statusBadge = `${passed}/4 · 光学下坠`;
    headline = `底边 ${bottomMm.toFixed(1)}\u00A0mm 比天头 ${topMm.toFixed(1)}\u00A0mm 还窄，整幅画往下滑`;
    reason = "人眼对几何中心有向下的重力错觉。无出血页没有出血色块锁边，若地脚反比天头更窄，整个版心就会显得摇摇欲坠、马上要滑出纸底。";
    action = "向上拖起底部绿框，让地脚至少等于或比天头多出 3–8 mm，把视觉重心稳稳托住。";
  } else if (tooFloating) {
    statusBadge = `${passed}/4 · 顶高悬空`;
    headline = "地脚过厚或天头过沉，版心在纸面上失去了锚点";
    reason = `当前天头 ${topMm.toFixed(1)} mm、地脚 ${bottomMm.toFixed(1)} mm，上下比例拉得过开，画面像被推到纸角悬空，破坏了居中证书的端庄秩序。`;
    action = "把地脚收回到天头的 1.1–1.8 倍之间，保持稳妥的底托即可。";
  } else if (innerChoked) {
    statusBadge = `${passed}/4 · 内框顶死`;
    headline = `框内留白只有 ${innerPadMm.toFixed(1)}\u00A0mm，图文死死顶在绿线上`;
    reason = "无出血的优雅来自双层缓冲：外白边隔离纸缘风险，内气口让画面在双细框里自由呼吸。贴死边框会让整页像被硬塞进小盒子里。";
    action = "拉大「框内气口」到 6–12 mm，让山日画框与两侧暖金立柱舒展开来。";
  } else if (innerCrushed) {
    statusBadge = `${passed}/4 · 内区压扁`;
    headline = `框内气口塞到 ${innerPadMm.toFixed(1)} mm，把主体画面挤得只剩 ${innerAreaPct}%`;
    reason = "外边距与内气口双重叠加过厚，真正传达信息的图文窗口被一再压缩，变成「只有边框没有内容」。";
    action = "把「框内气口」收回 6–13 mm，把舞台还给核心图文。";
  } else if (tooSmall || printCode === "tight-dead") {
    statusBadge = `${passed}/4 · 边距偏紧`;
    headline = "离纸边与死区仍太近，稍微换台机器就会失手";
    reason = `当前四边最小仅 ${Math.min(sideMm, topMm, bottomMm).toFixed(1)} mm，离硬件死区余量不足 1 mm。只要纸盒受潮或双面翻页多偏半毫米，立刻就会裁缺。`;
    action = "把四边统一扩到 12 mm 以上，留出真正从容的安全缓冲。";
  } else {
    statusBadge = `${passed}/4 · 仍待校准`;
    headline = "个别边距维度尚未落在安全区，继续微调即可合格";
    reason = "检查左右走偏比、天头地脚托举与内框气口，四项同时达标即刻盖上深绿印检章。";
    action = "拖动绿框边线或调整右侧滑轨，观察实时毫米读数。";
  }

  return {
    press,
    dead,
    sideMm,
    topMm,
    bottomMm,
    innerPadMm,
    driftMm,
    shiftX,
    shiftY,
    tiltDeg,
    nominalFrame,
    shiftedFrame,
    innerBox,
    effLeft,
    effRight,
    effTop,
    effBottom,
    clipLeft,
    clipRight,
    clipTop,
    clipBottom,
    maxClip,
    minClearance,
    skewRatio,
    frameAreaPct,
    innerAreaPct,
    footLiftMm,
    checks: {
      margin: { ok: marginOk, code: marginCode, tag: marginTag },
      safe: { ok: skewOk, code: skewCode, tag: skewTag },
      print: { ok: printOk, code: printCode, tag: printTag },
      control: { ok: controlOk, code: controlCode, tag: controlTag },
    },
    passed,
    allPass: passed === 4,
    statusBadge,
    headline,
    reason,
    action,
  };
}

// 第四节：实用场景与装订退让经验值计算器（行业经验值，标明来源性质）
export const RECIPES = {
  office: {
    id: "office",
    title: "A4 办公激光合同 / 报告",
    size: "210 × 297 mm",
    w: 210,
    h: 297,
    base: { top: 22, bottom: 25, inner: 20, outer: 20 },
    dead: 4.23,
    note: "面向任意办公激光机直接双面打印，四边 ≥ 20 mm 既避开 4.23 mm 死区，又能容纳装订打孔与手写批注。",
  },
  book: {
    id: "book",
    title: "A5 书籍内页（单页版心）",
    size: "148 × 210 mm",
    w: 148,
    h: 210,
    base: { top: 16, bottom: 26, inner: 16, outer: 20 },
    dead: 4.0,
    note: "承袭古典书页上轻下重、外宽托拇指的比例；切到胶装时内口自动加厚，避免订口吞字。",
  },
  certificate: {
    id: "certificate",
    title: "A3 / 3:4 典藏证书与版画",
    size: "297 × 420 mm",
    w: 297,
    h: 420,
    base: { top: 26, bottom: 32, inner: 24, outer: 24 },
    dead: 5.0,
    note: "类似 139 原海报的双细框格局：白边即画框，既便于直接装裱，又能承受大幅面进纸偏差。",
  },
  flyer: {
    id: "flyer",
    title: "A4 图文快印活动单页",
    size: "210 × 297 mm",
    w: 210,
    h: 297,
    base: { top: 14, bottom: 17, inner: 14, outer: 14 },
    dead: 4.5,
    note: "快印店急件免二次裁切的最稳底线：≥ 14 mm 四周白边可吃掉 ±2 mm 走纸偏移，不显歪斜。",
  },
};

export const BINDINGS = {
  none: { id: "none", label: "单张无装订", innerAdd: 0, note: "四边对称或地脚微厚，无需订口退让。" },
  saddle: { id: "saddle", label: "骑马订（+3 mm 内口）", innerAdd: 3, note: "书页平摊度好，内口略加 3 mm 防中缝压字。" },
  perfect: { id: "perfect", label: "无线胶装（+8 mm 订口）", innerAdd: 8, note: "胶装翻开时书脊会吃掉约 6–10 mm 深度，内口必须明显退让。" },
};

export function calcRecipe(recipeId, bindingId) {
  const r = RECIPES[recipeId] || RECIPES.office;
  const b = BINDINGS[bindingId] || BINDINGS.none;
  const top = r.base.top;
  const bottom = r.base.bottom;
  const inner = r.base.inner + b.innerAdd;
  const outer = r.base.outer;
  const safeW = Math.max(20, r.w - inner - outer);
  const safeH = Math.max(20, r.h - top - bottom);
  const areaPct = Math.round(((safeW * safeH) / (r.w * r.h)) * 100);
  const minEdge = Math.min(top, bottom, inner, outer);
  const skewAt18 = round2((minEdge + 1.8) / Math.max(1, minEdge - 1.8));
  return { r, b, top, bottom, inner, outer, safeW, safeH, areaPct, skewAt18 };
}

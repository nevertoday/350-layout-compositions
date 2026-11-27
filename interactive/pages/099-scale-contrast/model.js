// 099 尺度对比（SCALE CONTRAST）单真源状态与几何评审模型
// 所有画布坐标、面积比、史蒂文斯感知比、五项海报探针与白话诊断均由此文件统一计算。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报 · 巨日行者",
    short: "原海报",
    caption: "1:1 转译 099 原海报：深炭黑夜幕、斑驳矿物金巨球、弧形暗丘与山脊微光行者。",
    macroName: "金色巨球",
    microName: "山脊小人",
    midNames: ["左上方灰金中球", "右前方浮空杂块"],
  },
  boullee: {
    id: "boullee",
    label: "建筑 · 牛顿巨穹",
    short: "牛顿巨穹",
    caption: "致敬 1784 布雷《牛顿纪念碑》：以整座巨穹球面压缩台基上的微缩观者群像。",
    macroName: "纪念碑巨穹",
    microName: "台基观者",
    midNames: ["中景侧塔", "遮挡浮碑"],
  },
  type: {
    id: "type",
    label: "海报 · 巨字微注",
    short: "巨字微注",
    caption: "平面排版里的字号断崖：超巨金字「巨」与细小信息注脚拉开极端视觉优先级。",
    macroName: "巨型主字",
    microName: "微字注脚",
    midNames: ["中号副标块", "冗余装饰徽"],
  },
};

export const INITIAL_STATE = {
  scene: "poster",
  macroScale: 0.34,         // 主物占画高比例 (0.20..0.96)
  microScale: 0.25,         // 参照物占画高比例 (0.015..0.42)
  refVisible: true,         // 人类尺标 / 微参照是否存在
  midClutter: [true, true], // 2 枚填平断崖的中号过渡干扰物
  horizonOn: false,         // 开场关闭暗丘光池，空间感扁平
  gapOffset: 0.08,          // 主物外缘与参照之间的相对水平净隙
};

export const SOLUTIONS = {
  poster: {
    id: "poster",
    label: "原海报典范",
    state: {
      macroScale: 0.66,
      microScale: 0.082,
      refVisible: true,
      midClutter: [false, false],
      horizonOn: true,
      gapOffset: 0.10,
    },
  },
  epic: {
    id: "epic",
    label: "破框史诗解",
    state: {
      macroScale: 0.80,
      microScale: 0.062,
      refVisible: true,
      midClutter: [false, false],
      horizonOn: true,
      gapOffset: 0.125,
    },
  },
  abyss: {
    id: "abyss",
    label: "极简深渊解",
    state: {
      macroScale: 0.54,
      microScale: 0.056,
      refVisible: true,
      midClutter: [false, false],
      horizonOn: true,
      gapOffset: 0.155,
    },
  },
};

export const FAILURES = {
  badStart: {
    id: "badStart",
    label: "温吞平权",
    state: { ...INITIAL_STATE, midClutter: [true, true] },
  },
  noRef: {
    id: "noRef",
    label: "撤掉尺标",
    state: {
      macroScale: 0.68,
      microScale: 0.082,
      refVisible: false,
      midClutter: [false, false],
      horizonOn: true,
      gapOffset: 0.10,
    },
  },
  suffocate: {
    id: "suffocate",
    label: "巨物塞爆",
    state: {
      macroScale: 0.94,
      microScale: 0.075,
      refVisible: true,
      midClutter: [false, false],
      horizonOn: true,
      gapOffset: -0.02,
    },
  },
  vanish: {
    id: "vanish",
    label: "微元失踪",
    state: {
      macroScale: 0.66,
      microScale: 0.02,
      refVisible: true,
      midClutter: [false, false],
      horizonOn: true,
      gapOffset: 0.11,
    },
  },
  inverted: {
    id: "inverted",
    label: "主次倒挂",
    state: {
      macroScale: 0.24,
      microScale: 0.36,
      refVisible: true,
      midClutter: [false, false],
      horizonOn: true,
      gapOffset: 0.08,
    },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 暗丘弧线在横坐标 u (0..1) 处的 y 比例 (0..1)
export function hillYRatio(u) {
  const peakU = 0.44;
  const dx = u - peakU;
  return 0.845 + dx * dx * 0.145;
}

// 估算圆与画幅 [0,W]×[0,H] 相交的可视面积（8×8 网格采样，快速且单真源）
function visibleCircleArea(cx, cy, r, W, H) {
  if (cx - r >= 0 && cx + r <= W && cy - r >= 0 && cy + r <= H) {
    return Math.PI * r * r;
  }
  const N = 16;
  const x0 = Math.max(0, cx - r);
  const x1 = Math.min(W, cx + r);
  const y0 = Math.max(0, cy - r);
  const y1 = Math.min(H, cy + r);
  if (x1 <= x0 || y1 <= y0) return 0;
  const dw = (x1 - x0) / N;
  const dh = (y1 - y0) / N;
  const r2 = r * r;
  let inside = 0;
  for (let i = 0; i < N; i++) {
    const px = x0 + (i + 0.5) * dw;
    const dx2 = (px - cx) * (px - cx);
    for (let j = 0; j < N; j++) {
      const py = y0 + (j + 0.5) * dh;
      if (dx2 + (py - cy) * (py - cy) <= r2) inside++;
    }
  }
  return inside * dw * dh;
}

// 统一计算画布上所有主、次、中号干扰元素的真实像素几何
export function computeGeometry(state, W, H) {
  const minDim = Math.min(W, H);
  const macroD = clamp(state.macroScale, 0.2, 0.96) * H;
  const macroR = macroD * 0.5;

  // 当主物更大时，圆心向左上略微推进，如原海报般允许气势逼近左沿而不碾压右侧小人
  const tBig = clamp((state.macroScale - 0.34) / 0.56, 0, 1);
  const cx = W * (0.37 - tBig * 0.035);
  const hillBaseAtCenter = hillYRatio(cx / W) * H;
  // 巨球悬停在暗丘上方留一线极薄夜隙，过大时自然向上微抬并允许局部破框
  const desiredCy = hillBaseAtCenter - macroR - H * (0.042 - tBig * 0.014);
  const cy = Math.max(H * 0.37, Math.min(H * 0.55, desiredCy));

  const microH = clamp(state.microScale, 0.015, 0.42) * H;
  const microW =
    state.scene === "type"
      ? Math.max(microH * 2.2, W * 0.14)
      : state.scene === "boullee"
        ? microH * 1.15
        : microH * 0.36;

  // 参照物站位：紧随巨球右缘，加上用户净隙偏移（当净隙为正时自然避开人物半宽，负净隙则允许制造压叠错态）
  const rawMicroX =
    cx + macroR + (state.gapOffset >= 0 ? microW * 0.55 : 0) + state.gapOffset * W;
  const microX = clamp(rawMicroX, W * 0.54, W * 0.88);
  const microU = microX / W;
  const footY = state.horizonOn ? hillYRatio(microU) * H : H * 0.78;
  const microTopY = footY - microH;

  // 中号过渡干扰体：摆在巨球上方与右侧空档，绝不压在人物剪影身上，且刻意用中号尺寸填平巨—微断崖
  const midRadius0 = clamp(macroR * 0.42, minDim * 0.068, minDim * 0.13);
  const midRadius1 = clamp(macroR * 0.34, minDim * 0.056, minDim * 0.108);
  const mids = [
    {
      index: 0,
      active: !!state.midClutter[0],
      x: clamp(cx + macroR * 0.85, W * 0.48, W * 0.66),
      y: clamp(H * 0.24, H * 0.19, H * 0.30),
      r: midRadius0,
    },
    {
      index: 1,
      active: !!state.midClutter[1],
      x: clamp(Math.max(microX + microW * 0.75 + midRadius1, W * 0.80), W * 0.76, W * 0.88),
      y: clamp(H * 0.36, H * 0.28, H * 0.44),
      r: midRadius1,
    },
  ];

  // 计算主物与参照物之间的真实最小净隙（px）
  const microCenterX = microX;
  const microCenterY = footY - microH * 0.5;
  const closestX = clamp(cx, microCenterX - microW * 0.5, microCenterX + microW * 0.5);
  const closestY = clamp(cy, microTopY, footY);
  const distToMacroCenter = Math.hypot(closestX - cx, closestY - cy);
  const edgeGapPx = distToMacroCenter - macroR;
  const edgeGapRatio = edgeGapPx / minDim;

  // 面积与史蒂文斯感知比（基于实际可见面积）
  const macroFullArea =
    state.scene === "type" ? macroD * macroD * 0.74 : Math.PI * macroR * macroR;
  const macroVisArea =
    state.scene === "type"
      ? Math.min(macroFullArea, W * H * 0.88)
      : visibleCircleArea(cx, cy, macroR, W, H);
  const microArea =
    state.scene === "type"
      ? microW * microH * 0.55
      : state.scene === "boullee"
        ? microH * microH * 0.42
        : microH * microH * 0.24;

  const activeMids = mids.filter((m) => m.active);
  const midArea = activeMids.reduce((s, m) => s + Math.PI * m.r * m.r, 0);
  const totalInkArea = Math.min(
    W * H * 0.98,
    macroVisArea + (state.refVisible ? microArea : 0) + midArea
  );
  const darkSpacePct = clamp(1 - totalInkArea / (W * H), 0.02, 0.98);
  const heightRatio = macroD / Math.max(1, microH);
  const areaRatio = macroVisArea / Math.max(1, microArea);
  // Stevens (1957) 视觉面积压缩幂定律：psi ~ A^0.7（示意值）
  const perceivedRatio = Math.pow(Math.max(0.05, areaRatio), 0.7);

  return {
    W,
    H,
    minDim,
    macro: { cx, cy, r: macroR, d: macroD, visArea: macroVisArea, fullArea: macroFullArea },
    micro: {
      x: microX,
      y: microTopY,
      footY,
      w: microW,
      h: microH,
      cx: microCenterX,
      cy: microCenterY,
      area: microArea,
    },
    mids,
    activeMidCount: activeMids.length,
    edgeGapPx,
    edgeGapRatio,
    darkSpacePct,
    heightRatio,
    areaRatio,
    perceivedRatio,
  };
}

// 单真源双向评估：检测 9 类错态 + 输出 4 项核心判据 + 联动海报右侧 5 枚要点探针
export function evaluate(state, W = 760, H = 560) {
  const geo = computeGeometry(state, W, H);
  const sceneMeta = SCENES[state.scene] || SCENES.poster;

  const isNoRef = !state.refVisible;
  const isInverted = !isNoRef && geo.heightRatio < 1.15;
  const isSuffocate = state.macroScale > 0.85 || geo.darkSpacePct < 0.22;
  const isVanished = !isNoRef && state.microScale < 0.036;
  const isCollide = !isNoRef && geo.edgeGapRatio < 0.022;
  const isTepid = !isNoRef && !isInverted && (geo.heightRatio < 4.2 || geo.perceivedRatio < 13);
  const isCluttered = geo.activeMidCount > 0;
  const isFlatDepth = !state.horizonOn;
  const isTooSparse = state.macroScale < 0.48;

  const checks = {
    size: !isNoRef && !isInverted && !isTepid && !isSuffocate && !isTooSparse,
    ref: !isNoRef && !isInverted && !isVanished && state.microScale <= 0.145,
    cliff: !isCluttered && !isCollide,
    depth: !isFlatDepth && !isSuffocate && geo.darkSpacePct >= 0.22,
  };
  const passCount = Object.values(checks).filter(Boolean).length;

  let code = "pass";
  let badge = "4/4 · 尺度成立";
  let tier = "强烈巨微冲击（示意）";
  let headline = "极端巨微落差与清晰尺标同时成立";
  let why = `主物高度已是参照的 ${geo.heightRatio.toFixed(1)}×（物理面积 ${Math.round(geo.areaRatio)}×，按史蒂文斯 0.7 幂定律主观感知约 ${Math.round(geo.perceivedRatio)}×，示意）。大面积深黑留白托起巨物，山脊微光参照立住空间纵深。`;
  let hint = "按 Space 叠印物理/感知面积对比环与透视锥，或切到「牛顿巨穹 / 巨字微注」检验同一原理。";

  if (isNoRef) {
    code = "no-ref";
    badge = `${passCount}/4 · 无参照失尺`;
    tier = "尺标缺席（示意）";
    headline = "抽走参照物后，巨球立刻退化成一块普通黄圆";
    why = "视觉心理学里「大」不能独自存在（Dondis 1973）。没有一眼能认出真实体量的小参照，大脑无从估算这颗球究竟是一粒纽扣还是一颗恒星。";
    hint = `点击「恢复${sceneMeta.microName}」把人类尺标请回画面，立刻看到巨感重现。`;
  } else if (isInverted) {
    code = "inverted";
    badge = `${passCount}/4 · 主次倒挂`;
    tier = "主次颠倒（示意）";
    headline = `${sceneMeta.microName}反而盖过${sceneMeta.macroName}，焦点彻底反客为主`;
    why = `当前主/次高度比跌到 ${geo.heightRatio.toFixed(2)}×。人眼会先扑向体量更大的配角，原定主视觉被降级成无足轻重的背景点缀。`;
    hint = `向右横拖画布把${sceneMeta.macroName}拉大到 58% 以上，同时把${sceneMeta.microName}压回 6%–10%。`;
  } else if (isSuffocate) {
    code = "suffocate";
    badge = `${passCount}/4 · 巨物窒息`;
    tier = "画幅塞爆（示意）";
    headline = `${sceneMeta.macroName}把画幅塞满，留黑只剩 ${Math.round(geo.darkSpacePct * 100)}%`;
    why = "巨物需要深黑留白来承托体量感。一旦主形扩张到吞噬整个视野，黄色就从「主角」滑落成「背景底色」，冲击力反倒瓦解。";
    hint = `向左拖回「主物尺度」至 55%–82% 区间，为暗场腾出至少 25% 以上的呼吸空间。`;
  } else if (isVanished) {
    code = "vanish";
    badge = `${passCount}/4 · 微元失踪`;
    tier = "尺标不可辨（示意）";
    headline = `${sceneMeta.microName}缩到仅 ${(state.microScale * 100).toFixed(1)}%，沦为难以识别的噪点`;
    why = "微小不等于隐身。参照物一旦小到看不出人形轮廓或字形结构，尤其是在手机小屏上，观者会把它当成屏幕灰尘而忽略，尺标就此失效。";
    hint = `向上拖动${sceneMeta.microName}（或拉「参照尺度」至 5%–11%），保证一眼能认出轮廓。`;
  } else if (isCollide) {
    code = "collide";
    badge = `${passCount}/4 · 主次粘连`;
    tier = "边缘碾压（示意）";
    headline = `${sceneMeta.macroName}直接压到${sceneMeta.microName}身上，轮廓糊成一团`;
    why = "极端尺度对比需要一道干净的暗色空隙把巨物与微元分开。彼此相切或压叠会让前景尺标被巨物亮面吞没，空间前后关系立刻塌平。";
    hint = `把「主次净隙」拉宽，或稍微回调${sceneMeta.macroName}直径，给微光参照留出独立暗区。`;
  } else if (isTepid) {
    code = "tepid";
    badge = `${passCount}/4 · 温吞平权`;
    tier = "落差不足（示意）";
    headline = `高差仅 ${geo.heightRatio.toFixed(1)}×，人眼感知压缩后几乎像「差不多大」`;
    why = `物理面积虽有 ${geo.areaRatio.toFixed(1)}×，但按史蒂文斯 0.7 幂律（示意）主观只觉约 ${geo.perceivedRatio.toFixed(1)}×。温和差异属于 098 比例原则的范畴，远不足以构成尺度对比的瞬间冲击。`;
    hint = `在画布上向右横拖拉大${sceneMeta.macroName}，再把${sceneMeta.microName}压小到 6%–10%，把高差拉开到 5× 以上。`;
  } else if (isCluttered) {
    code = "mid-clutter";
    badge = `${passCount}/4 · 中阶堵断崖`;
    tier = "断崖被填平（示意）";
    headline = `画面里夹着 ${geo.activeMidCount} 枚中号过渡物，把巨微反差稀释成了温和阶梯`;
    why = "尺度对比最有力的写法是「跳过中间档」，直接让极大对话极小。一旦塞进半大不小的过渡块，视线就会停在中间体上分流，震撼感被磨平。";
    hint = "直接点击画布上标红的「中号干扰」块把它们撤走，让画面只剩极端两极。";
  } else if (isFlatDepth) {
    code = "flat-depth";
    badge = `${passCount}/4 · 漂浮失纵深`;
    tier = "缺少空间锚（示意）";
    headline = "主次都悬在纯黑平面里，缺少远近与体量的真实空间锚";
    why = "原海报下方那道微光暗丘并非装饰——它把微光行者踩实在地平面上，把巨球推向高远天幕，尺差才瞬间转化成距离感与敬畏感。";
    hint = "打开「暗丘光池」开关，立刻看见空间纵深与地平反光把尺度锁死。";
  } else if (isTooSparse) {
    code = "too-sparse";
    badge = `${passCount}/4 · 巨物偏弱`;
    tier = "冲击偏轻（示意）";
    headline = `${sceneMeta.macroName}在画幅里占比偏小，尚未形成压迫性视觉焦点`;
    why = `当前暗场空域高达 ${Math.round(geo.darkSpacePct * 100)}%，虽然主次比已够大，但主物本身尚未在画框内撑起「压场」的体量感。`;
    hint = `继续放大${sceneMeta.macroName}至 52%–80%，让它成为画幅无可争议的主宰。`;
  }

  // 与 099 原海报右侧 5 大要点 1:1 单真源联动
  const pillars = [
    {
      key: "size",
      title: "大小",
      en: "SIZE",
      posterBody: "极端的大小差异 形成强烈视觉反差",
      ok: !isNoRef && !isInverted && !isTepid && !isVanished,
      status: isNoRef
        ? "无参照"
        : isInverted
          ? `倒挂 ${geo.heightRatio.toFixed(1)}×`
          : isVanished
            ? "微元失读"
            : `高差 ${geo.heightRatio.toFixed(1)}×`,
    },
    {
      key: "hierarchy",
      title: "主次",
      en: "HIERARCHY",
      posterBody: "通过尺度决定视觉 优先级，明确重点",
      ok: !isNoRef && !isInverted && !isTepid && !isCluttered,
      status: isInverted
        ? "配角夺主"
        : isCluttered
          ? `中阶干扰 ${geo.activeMidCount}`
          : isTepid
            ? "平权拉锯"
            : "主焦锁死",
    },
    {
      key: "impact",
      title: "冲击",
      en: "IMPACT",
      posterBody: "巨大元素带来张力 瞬间抓住注意力",
      ok: state.macroScale >= 0.5 && !isSuffocate && !isNoRef,
      status: isSuffocate
        ? "溢满窒息"
        : state.macroScale < 0.5
          ? `占比 ${Math.round(state.macroScale * 100)}%`
          : `占高 ${Math.round(state.macroScale * 100)}%`,
    },
    {
      key: "levels",
      title: "层级",
      en: "LEVELS",
      posterBody: "大小差异建立信息 层级与阅读顺序",
      ok: !isCluttered && !isCollide && !isNoRef && !isVanished,
      status: isCluttered
        ? `中阶 ${geo.activeMidCount} 处`
        : isCollide
          ? "粘连糊边"
          : isNoRef
            ? "断层缺失"
            : "两极清晰",
    },
    {
      key: "depth",
      title: "远近",
      en: "DEPTH",
      posterBody: "尺度对比营造空间 感与距离感",
      ok: checks.depth && !isNoRef && !isCollide,
      status: isFlatDepth
        ? "平面悬浮"
        : isSuffocate
          ? `留黑 ${Math.round(geo.darkSpacePct * 100)}%`
          : `留黑 ${Math.round(geo.darkSpacePct * 100)}%`,
    },
  ];

  return {
    geo,
    checks,
    passCount,
    passed: passCount === 4,
    code,
    badge,
    tier,
    headline,
    why,
    hint,
    pillars,
  };
}

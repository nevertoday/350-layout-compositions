// 022 垂直构图 · 单一真源数据与光学/构图实算模型
// 所有画面渲染、四原则亮灯、数值读数与文字诊断均同源于此，不写死展示常量。

export const EMPIRICAL = {
  // 经验阈值（页面内均标明「经验值」）
  pitchPassDeg: 1.0,       // 机背俯仰容差 ±1.0°
  pitchSnapDeg: 0.75,      // 靠近 0° 的轻磁吸半径
  slantPassDeg: 0.8,       // 外侧主柱实测投影倾角容差
  headroomMinPct: 9.0,     // 顶部净留白下限（低于此视为憋顶/削顶）
  headroomMaxPct: 30.0,    // 顶部净留白上限（高于此显矮缩空虚）
  baseDoorMaxV: 0.90,      // 金门/底座上沿不能跌出底框（>90% 视为底座掉出失根）
  baseDoorMinV: 0.62,      // 底座上沿不能抬得太高（<62% 说明下半幅被无意义空地占满）
  baseFootMinV: 0.84,      // 前景踏步底脚要稳落画框下半段
  rhythmCvMin: 0.16,       // 柱群宽窄/高低节奏变异系数阈值（低于此视为等宽栅栏，退台三题材实测 0.19–0.21）
};

export const ASPECTS = {
  "3:4": { label: "3:4 竖幅", ratio: 0.75, viewH: 1.56, note: "纵长画幅顺应竖线延展，高耸感最完整" },
  "1:1": { label: "1:1 方幅", ratio: 1.0, viewH: 1.32, note: "方幅收敛纵向延伸，高耸张力有所缓和" },
  "16:9": { label: "16:9 横幅", ratio: 16 / 9, viewH: 0.92, note: "扁宽画幅腰斩竖向空间，垂直构图极易局促" },
};

export const SCENES = {
  monument: { label: "建筑群", sub: "原海报纪念碑", desc: "退台建筑群与拾级金门，垂直秩序的经典原型" },
  forest: { label: "针叶林", sub: "原海报景观示例", desc: "成片高直树干向上伸展，林间缝隙构成纵深节奏" },
  music: { label: "音乐海报", sub: "原海报平面示例", desc: "高低宽窄的竖向琴键与音柱，将声音转译为视觉节拍" },
};

export const RHYTHMS = {
  fence: { label: "等宽栅栏", desc: "等宽等高平齐排列，像铁栏杆或条形码" },
  chaotic: { label: "高低断轴", desc: "主峰偏斜且宽窄无序，重心晃动失衡" },
  stepped: { label: "退台主峰", desc: "中央主峰贯通金线，两侧宽窄高低退台呼应" },
};

// 开场刻意处于三重典型翻车态（0 / 4，绝非答案）
export const HERO_INITIAL = {
  pitchDeg: 18.0,      // 抬头仰拍 +18° → 外柱内倾汇聚约 6.8°
  shift: 0.0,          // 未做前组移轴（初始憋顶，拉平机背后塔尖立即冲出上框被削顶）
  rhythm: "fence",     // 等宽铁栅栏（缺少主峰与退台层次）
  scene: "monument",   // 原海报纪念碑建筑群
  aspect: "3:4",       // 3:4 竖幅
};

// 三种节奏对应的 9 根立柱几何（世界坐标：x 中心、w 宽、h 顶高、z 景深、tone 材质层级、goldLine 是否贯通细金线）
export function getColumnsSpec(rhythm, scene) {
  if (rhythm === "fence") {
    // 7 根几乎等宽、等高、等距的死板栅栏
    const cols = [];
    const n = 7;
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1)) * 2 - 1; // -1 .. 1
      cols.push({
        id: `f${i}`,
        x: t * 0.56,
        w: 0.125,
        h: 1.98,
        z: 1.46,
        tone: i % 2 === 0 ? "deepGreen" : "charcoal",
        goldLine: false,
        isPrimary: i === 3,
      });
    }
    return cols;
  }

  if (rhythm === "chaotic") {
    // 宽窄跳跃剧烈、主峰歪在一侧、重心倾偏
    return [
      { id: "c0", x: -0.58, w: 0.24, h: 1.84, z: 1.38, tone: "charcoal", goldLine: false, isPrimary: true },
      { id: "c1", x: -0.30, w: 0.07, h: 0.96, z: 1.62, tone: "sand", goldLine: false, isPrimary: false },
      { id: "c2", x: -0.14, w: 0.16, h: 1.34, z: 1.50, tone: "midGreen", goldLine: false, isPrimary: false },
      { id: "c3", x: 0.08, w: 0.06, h: 1.78, z: 1.44, tone: "deepGreen", goldLine: true, isPrimary: false },
      { id: "c4", x: 0.26, w: 0.21, h: 1.12, z: 1.40, tone: "taupe", goldLine: false, isPrimary: false },
      { id: "c5", x: 0.49, w: 0.08, h: 1.54, z: 1.58, tone: "charcoal", goldLine: false, isPrimary: false },
      { id: "c6", x: 0.63, w: 0.10, h: 0.84, z: 1.66, tone: "cream", goldLine: false, isPrimary: false },
    ];
  }

  // stepped：严格承袭 022 原海报的退台主峰 + 前中远三层深浅层次
  if (scene === "forest") {
    return [
      { id: "t0", x: -0.56, w: 0.08, h: 1.16, z: 1.64, tone: "taupe", goldLine: false, isPrimary: false },
      { id: "t1", x: -0.43, w: 0.11, h: 1.42, z: 1.46, tone: "charcoal", goldLine: false, isPrimary: false },
      { id: "t2", x: -0.27, w: 0.10, h: 1.64, z: 1.56, tone: "midGreen", goldLine: false, isPrimary: false },
      { id: "t3", x: -0.14, w: 0.11, h: 1.50, z: 1.38, tone: "charcoal", goldLine: false, isPrimary: false },
      { id: "t4", x: 0.0, w: 0.15, h: 1.94, z: 1.48, tone: "deepGreen", goldLine: true, isPrimary: true },
      { id: "t5", x: 0.16, w: 0.09, h: 1.68, z: 1.58, tone: "sand", goldLine: false, isPrimary: false },
      { id: "t6", x: 0.30, w: 0.13, h: 1.52, z: 1.42, tone: "charcoal", goldLine: false, isPrimary: false },
      { id: "t7", x: 0.45, w: 0.10, h: 1.32, z: 1.54, tone: "midGreen", goldLine: false, isPrimary: false },
      { id: "t8", x: 0.58, w: 0.07, h: 1.08, z: 1.66, tone: "taupe", goldLine: false, isPrimary: false },
    ];
  }

  if (scene === "music") {
    return [
      { id: "m0", x: -0.55, w: 0.11, h: 1.24, z: 1.56, tone: "sand", goldLine: false, isPrimary: false },
      { id: "m1", x: -0.42, w: 0.09, h: 1.56, z: 1.42, tone: "charcoal", goldLine: false, isPrimary: false },
      { id: "m2", x: -0.28, w: 0.12, h: 1.44, z: 1.54, tone: "midGreen", goldLine: false, isPrimary: false },
      { id: "m3", x: -0.14, w: 0.08, h: 1.74, z: 1.40, tone: "charcoal", goldLine: false, isPrimary: false },
      { id: "m4", x: 0.0, w: 0.18, h: 1.94, z: 1.48, tone: "deepGreen", goldLine: true, isPrimary: true },
      { id: "m5", x: 0.16, w: 0.08, h: 1.70, z: 1.40, tone: "charcoal", goldLine: true, isPrimary: false },
      { id: "m6", x: 0.30, w: 0.13, h: 1.48, z: 1.54, tone: "taupe", goldLine: false, isPrimary: false },
      { id: "m7", x: 0.44, w: 0.09, h: 1.36, z: 1.44, tone: "midGreen", goldLine: false, isPrimary: false },
      { id: "m8", x: 0.56, w: 0.10, h: 1.14, z: 1.60, tone: "cream", goldLine: false, isPrimary: false },
    ];
  }

  // monument：忠实于 022 原海报退台纪念碑塔群（按 z 从远到近绘制）
  return [
    { id: "b0", x: -0.56, w: 0.13, h: 1.12, z: 1.64, tone: "taupe", goldLine: false, isPrimary: false },
    { id: "b1", x: -0.46, w: 0.14, h: 1.32, z: 1.46, tone: "charcoal", goldLine: false, isPrimary: false },
    { id: "b2", x: -0.35, w: 0.16, h: 1.60, z: 1.62, tone: "sand", goldLine: false, isPrimary: false },
    { id: "b3", x: -0.22, w: 0.13, h: 1.74, z: 1.44, tone: "charcoal", goldLine: false, isPrimary: false },
    { id: "b4", x: -0.32, w: 0.13, h: 1.02, z: 1.38, tone: "midGreen", goldLine: false, isPrimary: false },
    { id: "b5", x: 0.0, w: 0.24, h: 1.94, z: 1.48, tone: "deepGreen", goldLine: true, isPrimary: true },
    { id: "b6", x: 0.19, w: 0.11, h: 1.72, z: 1.60, tone: "taupe", goldLine: false, isPrimary: false },
    { id: "b7", x: 0.29, w: 0.16, h: 1.54, z: 1.42, tone: "charcoal", goldLine: true, isPrimary: false },
    { id: "b8", x: 0.43, w: 0.14, h: 1.40, z: 1.62, tone: "cream", goldLine: false, isPrimary: false },
    { id: "b9", x: 0.40, w: 0.13, h: 1.28, z: 1.40, tone: "midGreen", goldLine: false, isPrimary: false },
    { id: "b10", x: 0.56, w: 0.12, h: 1.08, z: 1.64, tone: "taupe", goldLine: false, isPrimary: false },
  ];
}

// 真实 3D 针孔相机 + 大画幅前组移轴（Rising Front）投影
// 返回画框归一化坐标 u (0..1 左→右), v (0..1 上→下)
export function projectPoint(X, Y, Z, state) {
  const camY = 0.28;
  const f = 0.86;
  const th = (state.pitchDeg * Math.PI) / 180;
  const dx = X;
  const dy = Y - camY;
  const dz = Z;
  const yp = dy * Math.cos(th) - dz * Math.sin(th);
  const zp = Math.max(0.25, dy * Math.sin(th) + dz * Math.cos(th));
  const ndcX = (f * dx) / zp;
  const ndcY = (f * yp) / zp;

  const asp = ASPECTS[state.aspect] || ASPECTS["3:4"];
  const viewH = asp.viewH;
  const viewW = viewH * asp.ratio;
  // shift ∈ [0, 1]：向上推升镜头前组（Rising Front），使视窗中心 camCenterNdc 升高
  const camCenterNdc = -0.14 + state.shift * 1.04;

  const u = 0.5 + ndcX / viewW;
  const v = 0.5 - (ndcY - camCenterNdc) / viewH;
  return { u, v, zp };
}

// 投影整组柱子并直接从投影结果实测所有构图指标
export function evaluateHero(state) {
  const asp = ASPECTS[state.aspect] || ASPECTS["3:4"];
  const cols = getColumnsSpec(state.rhythm, state.scene);

  const projected = cols.map((col) => {
    const xL = col.x - col.w / 2;
    const xR = col.x + col.w / 2;
    const bl = projectPoint(xL, 0, col.z, state);
    const br = projectPoint(xR, 0, col.z, state);
    const tl = projectPoint(xL, col.h, col.z, state);
    const tr = projectPoint(xR, col.h, col.z, state);
    const topMid = projectPoint(col.x, col.h, col.z, state);
    const botMid = projectPoint(col.x, 0, col.z, state);
    return { ...col, bl, br, tl, tr, topMid, botMid };
  });

  // 1. 实测外侧主柱顶底投影倾角（度数，正值=向内顶部汇聚，负值=俯拍倒梯形）
  const refBot = projectPoint(-0.56, 0, 1.46, state);
  const refTop = projectPoint(-0.56, 1.72, 1.46, state);
  const dxScreen = (refTop.u - refBot.u) * asp.ratio;
  const dyScreen = Math.max(0.001, refBot.v - refTop.v);
  const slantDeg = (Math.atan2(dxScreen, dyScreen) * 180) / Math.PI;

  // 2. 实测主峰顶部净留白（%）：所有柱子最高点的最小 v 值
  const minTopV = Math.min(...projected.map((p) => Math.min(p.tl.v, p.tr.v)));
  const headroomPct = minTopV * 100;

  // 3. 实测底部阶梯/基座稳固度：从金门门槛 (Y=0.40, Z=1.40) 到踏步最前端 (Y=0, Z=1.12)
  const doorBase = projectPoint(0, 0.40, 1.40, state);
  const stairFront = projectPoint(0, 0.0, 1.12, state);
  const baseSupportPct = Math.max(0, Math.min(100, (1 - doorBase.v) * 100));

  // 4. 实测柱列节奏感：计算高度变异系数与中心主峰显著度
  const hs = cols.map((c) => c.h);
  const ws = cols.map((c) => c.w);
  const meanH = hs.reduce((a, b) => a + b, 0) / hs.length;
  const stdH = Math.sqrt(hs.reduce((a, b) => a + (b - meanH) ** 2, 0) / hs.length);
  const cvH = stdH / meanH;
  const meanW = ws.reduce((a, b) => a + b, 0) / ws.length;
  const stdW = Math.sqrt(ws.reduce((a, b) => a + (b - meanW) ** 2, 0) / ws.length);
  const cvW = stdW / meanW;
  // 质量重心偏离中心程度（检查 chaotic 是否严重偏重）
  const totalArea = cols.reduce((a, c) => a + c.w * c.h, 0);
  const centerX = cols.reduce((a, c) => a + c.x * c.w * c.h, 0) / totalArea;
  const rhythmSpread = +(cvH * 0.65 + cvW * 0.35).toFixed(2);

  // 5. 四项原海报构图原则实检（全部从投影几何算出）
  const plumbOk = Math.abs(state.pitchDeg) <= EMPIRICAL.pitchPassDeg && Math.abs(slantDeg) <= EMPIRICAL.slantPassDeg;
  const headroomOk = headroomPct >= EMPIRICAL.headroomMinPct && headroomPct <= EMPIRICAL.headroomMaxPct;
  const baseOk = doorBase.v <= EMPIRICAL.baseDoorMaxV && doorBase.v >= EMPIRICAL.baseDoorMinV && stairFront.v >= EMPIRICAL.baseFootMinV;
  const aspectOk = state.aspect !== "16:9";
  const rhythmOk = rhythmSpread >= EMPIRICAL.rhythmCvMin && Math.abs(centerX) < 0.075 && state.rhythm === "stepped";

  const ascentOk = headroomOk && aspectOk;       // 上升：顶留白 + 纵画幅不被压矮
  const dignityOk = plumbOk;                     // 庄重：垂线绝对铅直不倾倒
  const orderOk = baseOk && Math.abs(centerX) < 0.075; // 秩序：底座稳固扎根 + 轴线均衡
  const rhythmPrincipleOk = rhythmOk;            // 节奏：宽窄高低有主峰层次

  const passCount = [ascentOk, dignityOk, orderOk, rhythmPrincipleOk].filter(Boolean).length;

  // 6. 严格优先级主诊断（一次只说清当前最致命的一个问题与为什么）
  let code = "pass";
  let badge = "4/4 垂直秩序成立";
  let headline = "垂线笔直、底稳顶松、退台成韵";
  let reason = "机背铅直让柱群稳稳承托重力，前组移轴同时守住了底部阶梯与主峰上方的呼吸留白，宽窄退台又把单调重复化为向上延伸的建筑节奏。";
  let nextHint = "可切换「针叶林 / 音乐海报」或「16:9 横幅」，验证同一套垂直骨架在不同题材与画幅里的表现。";

  if (!plumbOk) {
    if (state.pitchDeg > 0) {
      code = "tilt-up";
      badge = `仰拍 +${state.pitchDeg.toFixed(1)}° · 垂线内倾`;
      headline = `建筑竖线向天顶汇聚 ${Math.abs(slantDeg).toFixed(1)}°，庄重感正在垮塌`;
      reason = `相机抬头仰拍 +${state.pitchDeg.toFixed(1)}° 时，像面与楼面不再平行，两侧立柱顶部向内倾斜 ${Math.abs(slantDeg).toFixed(1)}°——整座建筑像向后倾倒的梯形，滑向「汇聚线」的压迫感。`;
      nextHint = "先拖动「机背仰角拨尺」归回 0.0° 立直竖线，再看楼顶发生了什么变化。";
    } else {
      code = "tilt-down";
      badge = `俯拍 ${state.pitchDeg.toFixed(1)}° · 倒梯失稳`;
      headline = `底座收窄成倒梯形（外扩 ${Math.abs(slantDeg).toFixed(1)}°），头重脚轻`;
      reason = `镜头向下俯角 ${state.pitchDeg.toFixed(1)}° 让柱身上宽下窄，底部阶梯视觉收细，彻底违背垂直构图「底部稳重、向上收束」的重力秩序。`;
      nextHint = "把「机背仰角拨尺」拉回 0.0° 基准线，让竖柱重新垂直于底边。";
    }
  } else if (!aspectOk) {
    code = "aspect-flat";
    badge = "16:9 横幅 · 竖势腰斩";
    headline = "横幅画框压矮了垂直延伸，上下两头顾此失彼";
    reason = "16:9 宽银幕把纵向高度压得过浅：想保底座，塔尖立刻被上框削断；想收塔尖，底座又跌出底沿。垂直构图需要纵长或方正画幅给竖线留出奔跑的距离。";
    nextHint = "把画幅切回「3:4 竖幅」或「1:1 方幅」，再微调移轴位置。";
  } else if (headroomPct < EMPIRICAL.headroomMinPct) {
    code = "cramped-top";
    badge = headroomPct <= 0 ? `塔尖削顶 ${headroomPct.toFixed(0)}%` : `顶白仅 ${headroomPct.toFixed(0)}% · 憋顶`;
    headline = headroomPct <= 0
      ? "竖线直了，但主塔顶部冲出画框被一刀削平"
      : "主峰顶死上框沿，上升视线撞上了天花板";
    reason = `刚把机背放平到 0.0° 时，普通未移轴镜头只能拍到下半截建筑，实测顶部净留白仅 ${headroomPct.toFixed(1)}%（经验甜区 9%–30%）。没有顶部留白，视线升到顶端就被死死截停。`;
    nextHint = "保持 0.0° 不动，向上推动画框旁边的「前组移轴（Rising Front）」标尺，把塔尖收进画框并留出天空。";
  } else if (doorBase.v > EMPIRICAL.baseDoorMaxV) {
    code = "lost-base";
    badge = "移轴过头 · 底座失根";
    headline = "头顶空出一大截，可底部阶梯与稳基掉出了画框";
    reason = `前组移轴推得太高（顶部留白达 ${headroomPct.toFixed(0)}%，底座落到画框底部 ${Math.round(doorBase.v * 100)}% 以下），建筑失去落脚点变成悬空锯齿——正踩中原海报 TIP「注意元素底部的稳定感」的大忌。`;
    nextHint = "把「前组移轴」稍微往下回拉，让暖白阶梯与金门稳稳托回画框下沿。";
  } else if (headroomPct > EMPIRICAL.headroomMaxPct || doorBase.v < EMPIRICAL.baseDoorMinV) {
    code = "too-loose";
    badge = `顶白 ${headroomPct.toFixed(0)}% · 主体矮缩`;
    headline = "建筑缩得太靠下，高耸气势被空天稀释了";
    reason = `实测顶部空出 ${headroomPct.toFixed(0)}%（超过 30% 经验上限），柱群显得矮小退缩，失去了垂直构图顶天立地的压场力量。`;
    nextHint = "把「前组移轴」往下微调回 45%–68% 区间，让主峰顶白落在 12%–24% 之间。";
  } else if (state.rhythm === "fence") {
    code = "fence";
    badge = "等宽铁栅栏 · 缺节奏";
    headline = "竖线直了、顶底也稳，但 7 根柱子像一排铁栏杆";
    reason = `当前柱群高度与宽度变异度为 ${rhythmSpread.toFixed(2)}（经验值需 ≥ ${EMPIRICAL.rhythmCvMin}）：每根柱子等宽等高、平齐排列，只有机械重复，没有主峰引导也没有前中远纵深。`;
    nextHint = "把柱列节奏切换到「退台主峰」，观察宽窄交替与高低层级如何把栅栏变成交响乐。";
  } else if (state.rhythm === "chaotic" || Math.abs(centerX) >= 0.075) {
    code = "chaotic";
    badge = "高低断轴 · 秩序松散";
    headline = "有高差变化，但主峰偏倒左侧、宽窄杂乱无章";
    reason = `柱群视觉重心左偏 ${(Math.abs(centerX) * 100).toFixed(0)}%，高柱挤在边缘而中段塌陷，破坏了原海报强调的「通过对齐、间距与比例建立稳定有序的关系」。`;
    nextHint = "把柱列节奏切换到「退台主峰」，让中央高塔领衔、两侧阶梯呼应。";
  } else if (!baseOk) {
    code = "base-off";
    badge = "底座未稳 · 需微调移轴";
    headline = "底部阶梯尚未稳落在理想支撑带";
    reason = `当前底座支撑占比 ${Math.round(baseSupportPct)}%，可微调「前组移轴」让暖白阶梯稳稳托在画框底部。`;
    nextHint = "轻轻上下滑动右侧移轴轨至 48%–68% 甜区。";
  } else if (!rhythmPrincipleOk) {
    code = "rhythm-weak";
    badge = `节奏反差 ${rhythmSpread.toFixed(2)} · 偏弱`;
    headline = "柱群高低宽窄对比还不够鲜明";
    reason = `当前节奏反差 ${rhythmSpread.toFixed(2)}（经验值需 ≥ ${EMPIRICAL.rhythmCvMin}），建议切至「退台主峰」拉开主次层次。`;
    nextHint = "选择「退台主峰」查看原海报标准的宽窄退台秩序。";
  }

  return {
    projected,
    slantDeg,
    headroomPct,
    baseSupportPct,
    doorBaseV: doorBase.v,
    stairFrontV: stairFront.v,
    rhythmSpread,
    centerX,
    principles: {
      ascent: { ok: ascentOk, label: "上升", en: "ASCENT", value: !aspectOk ? "横幅截断" : `顶白 ${Math.round(headroomPct)}%` },
      dignity: { ok: dignityOk, label: "庄重", en: "DIGNITY", value: `柱倾 ${slantDeg >= 0 ? "+" : ""}${slantDeg.toFixed(1)}°` },
      order: { ok: orderOk, label: "秩序", en: "ORDER", value: doorBase.v > EMPIRICAL.baseDoorMaxV ? "底座出画" : `稳基 ${Math.round(baseSupportPct)}%` },
      rhythm: { ok: rhythmPrincipleOk, label: "节奏", en: "RHYTHM", value: state.rhythm === "stepped" ? "退台主峰" : state.rhythm === "fence" ? "等宽栅栏" : "偏心散乱" },
    },
    passCount,
    code,
    badge,
    headline,
    reason,
    nextHint,
  };
}

// ==================== 01 节：菲克垂直—水平错觉数据 ====================
export const FICK_MODES = {
  invT: {
    id: "invT",
    label: "倒 T 字形（⊥）",
    hint: "竖线居中立在横线中点，垂直高估 + 横线被平分双效应叠加，错觉最强。",
    typicalOverPct: "15%–25%",
  },
  Lshape: {
    id: "Lshape",
    label: "直角 L 形",
    hint: "取消平分效应，仅保留纯粹的竖向—横向视角差异，人眼仍会高估竖线。",
    typicalOverPct: "6%–12%",
  },
  frame: {
    id: "frame",
    label: "建筑门框",
    hint: "真实几何正方形看起来总像竖长方形，这正是 1851 年菲克最初注意到的现象。",
    typicalOverPct: "5%–10%",
  },
};

export function evaluateFick(vLen, hLen = 200) {
  // 若用户把竖线调成 vLen 认为它等于 hLen=200，则说明人眼把 vLen 感知成了 200
  // 感知高估率 = (hLen - vLen) / vLen * 100%
  const diffPx = vLen - hLen;
  const overPct = ((hLen - vLen) / Math.max(40, vLen)) * 100;
  let verdict = "";
  if (overPct >= 4) {
    verdict = `你把竖线调短了 ${Math.abs(diffPx)} 单位才觉得等长——也就是说，你的眼睛把竖线高估了约 ${overPct.toFixed(1)}%。这就是垂直构图天然显高、显挺拔的生理底牌。`;
  } else if (overPct <= -4) {
    verdict = `你反过来把竖线拉长了 ${Math.abs(diffPx)} 单位（低估 ${Math.abs(overPct).toFixed(1)}%），说明你已经有意对抗直觉在做反向补偿！`;
  } else {
    verdict = `误差仅 ${Math.abs(diffPx)} 单位（${Math.abs(overPct).toFixed(1)}%），你的眼力相当精准！多数人盲测时会把竖线调短 10%–20%。`;
  }
  return { diffPx, overPct, verdict };
}

// ==================== 02 节：视觉重力翻转实验（底稳 + 顶白 + 收分 + 明暗） ====================
export function evaluateGravity(flags) {
  // flags: { baseAnchored, topBreathing, taperUp, lightTop }
  // 每项 true=+1（强化向上升腾），false=-1（转向压抑/悬空/下坠）
  let score = 0;
  score += flags.baseAnchored ? 1 : -1;
  score += flags.topBreathing ? 1 : -1;
  score += flags.taperUp ? 1 : -1;
  score += flags.lightTop ? 1 : -1;

  let tier = "中性平衡";
  let dir = "up"; // up | flat | down
  let msg = "";
  if (score >= 3) {
    tier = "稳健升腾 · 向上感拉满";
    dir = "up";
    msg = "宽厚底基稳稳吃住重力，柱身由下至上收窄变亮，再加上顶部留白，视线一路顺畅攀升——这才是海报所说的「上升与力量感」。";
  } else if (score >= 1) {
    tier = "略有升势 · 尚存牵制";
    dir = "up";
    msg = !flags.topBreathing
      ? "底部与形体都在往上托，但顶部被画框死死压住，视线刚提起来就撞了天花板。"
      : !flags.baseAnchored
        ? "上段线条轻盈，可惜底脚悬空没有着落，整组竖柱像挂在半空的帘子，少了纪念碑般的稳重。"
        : "大方向仍往上走，但收分或明暗还在往下拽，抵消了一部分上升气势。";
  } else if (score <= -2) {
    tier = "视觉下坠 · 压迫与失重";
    dir = "down";
    msg = "同样全是垂直线，但上宽下窄、上暗下空且底脚失根，视线立刻掉头向下坠落！这证明竖线本身并不自动等于「向上」，方向感全靠重心、收分与留白决定。";
  } else {
    tier = "上下拉扯 · 方向模糊";
    dir = "flat";
    msg = "向上与向下的视觉线索互相抵消：一半在托举，一半在下坠，读者看不出画面想升腾还是下沉。";
  }
  return { score, tier, dir, msg };
}

// ==================== 03 节：7 柱垂直节奏编排器 ====================
export const RHYTHM_PRESETS = {
  fence: {
    label: "死板铁栅栏",
    cols: [
      { w: 2, h: 4, d: 1 },
      { w: 2, h: 4, d: 1 },
      { w: 2, h: 4, d: 1 },
      { w: 2, h: 4, d: 1 },
      { w: 2, h: 4, d: 1 },
      { w: 2, h: 4, d: 1 },
      { w: 2, h: 4, d: 1 },
    ],
  },
  colonnade: {
    label: "古典柱廊节拍",
    cols: [
      { w: 1, h: 3, d: 2 },
      { w: 3, h: 4, d: 1 },
      { w: 1, h: 3, d: 2 },
      { w: 3, h: 5, d: 0 },
      { w: 1, h: 3, d: 2 },
      { w: 3, h: 4, d: 1 },
      { w: 1, h: 3, d: 2 },
    ],
  },
  monument: {
    label: "原海报退台主峰",
    cols: [
      { w: 1, h: 2, d: 2 },
      { w: 2, h: 3, d: 0 },
      { w: 1, h: 4, d: 2 },
      { w: 3, h: 5, d: 1 },
      { w: 1, h: 4, d: 2 },
      { w: 2, h: 3, d: 0 },
      { w: 1, h: 2, d: 2 },
    ],
  },
};

export function evaluateBeat(cols) {
  const ws = cols.map((c) => c.w);
  const hs = cols.map((c) => c.h);
  const ds = cols.map((c) => c.d);
  const wRange = Math.max(...ws) - Math.min(...ws);
  const hRange = Math.max(...hs) - Math.min(...hs);
  const uniqueDepths = new Set(ds).size;
  const maxH = Math.max(...hs);
  const peakCount = hs.filter((h) => h === maxH).length;

  let level = "机械均分（栅栏态）";
  let ok = false;
  let note = "7 根竖柱几乎等宽等高、缺乏层次，眼睛扫过去像在看条形码或栅栏。试着点击几根柱子调出宽窄高差与深浅层级。";
  if (wRange === 0 && hRange === 0) {
    level = "完全等距铁栅栏";
    note = "宽窄、高差全为零，只剩单调重复，完全丧失视觉主峰与纵深呼吸感。";
  } else if (peakCount >= 5) {
    level = "平顶齐头 · 主峰不明";
    note = "大多数柱子一样高，天际线被削成一条直线，视线不知道该停在哪一根。";
  } else if (uniqueDepths === 1) {
    level = "有起伏 · 缺前后层次";
    note = "已经有了宽窄和高差，但所有柱子明暗一致贴在同一平面上；切换几根柱子的景深（深松绿 / 炭墨 / 暖石），空间纵深会立刻浮出来。";
  } else if (wRange >= 1 && hRange >= 2 && peakCount <= 2 && uniqueDepths >= 2) {
    level = "主次分明 · 节奏与层次并进";
    ok = true;
    note = `宽窄落差 ${Math.max(...ws)}:${Math.min(...ws)}、清晰主峰配 ${uniqueDepths} 重明暗景深：重复建立秩序，变化生出韵律。`;
  } else {
    level = "初步错落 · 可再拉大反差";
    note = "已跳出死板栅栏，再明确一根主峰并拉开宽窄反差，节奏会更响亮。";
  }
  return { wRange, hRange, uniqueDepths, peakCount, level, ok, note };
}

// ==================== 05 节：垂直构图从哪来（经核实的历史脉络） ====================
export const HISTORY_ITEMS = [
  {
    id: "fick1851",
    year: "1851",
    title: "菲克发现垂直—水平错觉",
    who: "阿道夫·菲克（Adolf Eugen Fick）· 马尔堡大学博士论文",
    work: "Tractatus de errore optico quodam asymmetria bulbi oculi effecto",
    body: "22 岁的德国生理学家阿道夫·菲克在马尔堡大学的拉丁文博士论文中，首次科学描述了「等长线段竖放看起来比横放更长、标准正方形看起来像竖长方形」的现象。这一发现拉开几何光学错觉研究的序幕，也解释了为何垂直构图天生自带修长与拔高感。",
    diagram: "fick",
  },
  {
    id: "sullivan1896",
    year: "1896",
    title: "沙利文确立摩天楼三段式竖向语法",
    who: "路易·沙利文（Louis H. Sullivan）· 《利平科特杂志》第 57 卷",
    work: "The Tall Office Building Artistically Considered（1896 年 3 月）",
    body: "钢框架与高速电梯催生了高层建筑，但早期建筑师仍习惯用横向腰线把高楼切碎。沙利文大声疾呼：高楼应该「每一寸都是骄傲而高耸的存在」（a proud and soaring thing），并提出仿照古典立柱的底座（Base）—竖向标准层（Shaft）—顶冠（Attic）三段秩序——与 022 海报「稳基 + 竖柱 + 顶白」如出一辙。",
    diagram: "sullivan",
  },
  {
    id: "kandinsky1926",
    year: "1926",
    title: "康定斯基写下垂直线的形式语义",
    who: "瓦西里·康定斯基（Wassily Kandinsky）· 包豪斯丛书第 9 卷",
    work: "Punkt und Linie zu Fläche（《点线面》，慕尼黑 Albert Langen 出版）",
    body: "康定斯基在包豪斯教材《点线面》中将直线按方向剖析：水平线贴合地面，代表低伏、支撑与冷色调的静止；垂直线摆脱地面支撑、指向高处，携带向上、明亮、温暖的升腾张力。这套形式心理学直接奠定了 20 世纪平面海报的线条语法。",
    diagram: "kandinsky",
  },
  {
    id: "mies1958",
    year: "1958",
    title: "西格拉姆大厦：广场稳基与青铜竖肋",
    who: "密斯·凡·德·罗（Ludwig Mies van der Rohe）与菲利普·约翰逊 · 纽约公园大道 375 号",
    work: "Seagram Building（1958 年落成，38 层）",
    body: "密斯没有把 38 层塔楼贴死街道红线，而是退让出开阔的花岗岩广场与水池作为稳固台基，并在玻璃幕墙外通体镶嵌非承重古铜色工字钢竖向肋条。精密的竖向重复节奏配沉稳台基，让这栋大楼成为现代垂直秩序与庄重感的教科书。",
    diagram: "seagram",
  },
];

// ==================== 06 节：什么时候用，什么时候别用 ====================
export const USAGE_CASES = [
  {
    id: "museum",
    tab: "建筑展竖幅海报",
    verdict: "天生对口 · 放心用",
    good: true,
    badTitle: "如果强拆成横幅平铺",
    badNote: "3:4 展厅竖廊空间里硬排横向色块，观众抬头仰观的气势被一刀压矮，丢失建筑题材的高耸仪式感。",
    goodTitle: "用垂直构图：稳基 + 退台竖柱 + 顶白",
    goodNote: "竖向文字与塔楼柱群同频向上，底部展讯托稳重心，顶部留白承接抬头视线。",
    linkHtml: "适合本页的垂直骨架；若追求严格左右等重，可配合 <a href=\"https://layout.xiaoxiaodong.ai/018/play/\" target=\"_blank\" rel=\"noopener\">018 对称构图</a> 或 <a href=\"https://layout.xiaoxiaodong.ai/027/play/\" target=\"_blank\" rel=\"noopener\">027 中轴构图</a>。",
  },
  {
    id: "prairie",
    tab: "宽银幕草原远景",
    verdict: "千万别硬套 · 改水平",
    good: false,
    badTitle: "硬塞竖向边框与竖柱分割",
    badNote: "在 2.39:1 或宽银幕风光里硬加几道竖栏，辽阔的地平线被砍成碎片，呼吸感与远方延展全毁。",
    goodTitle: "顺应横势，让地平线连贯贯穿",
    goodNote: "把垂直栅格拿掉，让水平线主导画面，只用远处一两处极小竖锚点缀。",
    linkHtml: "这类开阔、宁静的横向题材直接交给隔壁的 <a href=\"https://layout.xiaoxiaodong.ai/021/play/\" target=\"_blank\" rel=\"noopener\">021 水平构图</a>。",
  },
  {
    id: "sprint",
    tab: "极限竞速动作海报",
    verdict: "容易僵硬 · 改对角线",
    good: false,
    badTitle: "把冲刺赛车关进笔直竖栏里",
    badNote: "90° 铅直竖线天生传达稳重、静止与肃穆，放在赛车或极限运动画面里，就像给狂奔的主体装了一排栏杆，速度感当场熄火。",
    goodTitle: "倾斜骨架，用对角动势撕开画面",
    goodNote: "打破重力铅垂线，让运动方向与倾斜主轴重合，画面才真的冲起来。",
    linkHtml: "需要速度、冲突与失衡张力时，立刻转向 <a href=\"https://layout.xiaoxiaodong.ai/023/play/\" target=\"_blank\" rel=\"noopener\">023 对角线构图</a> 或 <a href=\"https://layout.xiaoxiaodong.ai/025/play/\" target=\"_blank\" rel=\"noopener\">025 汇聚线构图</a>。",
  },
  {
    id: "narrowText",
    tab: "6 窄栏中文长文页",
    verdict: "阅读灾难 · 别切片",
    good: false,
    badTitle: "为了「垂直感」把文章切成 6 条细柱",
    badNote: "每行只装得下 5–6 个汉字，眼睛读两秒就得换行折返，高频换行把整段逻辑切得支离破碎。",
    goodTitle: "正文守住舒适行长，把垂直感留给留白与边栏",
    goodNote: "长文区保持 1–2 栏舒适行宽，只在页边索引、章号竖线或标题区克制点出垂直秩序。",
    linkHtml: "若要强调多条并列导向而不伤正文，可参考 <a href=\"https://layout.xiaoxiaodong.ai/024/play/\" target=\"_blank\" rel=\"noopener\">024 平行线构图</a> 与 <a href=\"https://layout.xiaoxiaodong.ai/028/play/\" target=\"_blank\" rel=\"noopener\">028 偏轴构图</a>。",
  },
];

// ==================== 07 节：小练习（两题，每题 4 选 1，严格单变量差、标签完全中性） ====================
export const QUIZZES = {
  q1: {
    id: "q1",
    tab: "第 1 题 · 管风琴音乐厅竖幅海报",
    prompt: "某交响音乐厅要印一张 3:4 竖幅演出海报，用墨绿与暖石管风琴音管传达「高耸、庄重、有韵律的上升感」。四稿配色、字号与底栏文案完全相同，只差一个构图变量——哪一稿最站得住？",
    correct: "C",
    options: [
      {
        key: "A",
        label: "方案 A",
        mode: "fence",
        explain: "问题在「等宽等高栅栏」：7 根音管完全一样宽、一样高、平顶齐切，虽然竖线笔直也有留白，但只剩铁栏杆般的机械重复，没有主峰与节奏起伏。",
      },
      {
        key: "B",
        label: "方案 B",
        mode: "tilted",
        explain: "问题在「垂线失守内倾」：音管虽然做了宽窄退台，但整体向顶部内倾汇聚 11°，破坏了 90° 铅直骨架，显得摇晃不稳，削弱了音乐厅的庄重秩序。",
      },
      {
        key: "C",
        label: "方案 C",
        mode: "ideal",
        explain: "成立！全部主竖线严格 0° 铅直，音管宽窄高低退台指向中央金线主峰，底部厚实台基托住演出信息，主峰上方留出约 18% 天空让视线自然延伸。",
      },
      {
        key: "D",
        label: "方案 D",
        mode: "cramped",
        explain: "问题在「顶死憋头 + 底脚悬空」：音管直冲画框上沿（顶部留白 0%）堵死上升空间，同时底部悬离底座，同时踩中了原海报 TIP 的两个禁区。",
      },
    ],
  },
  q2: {
    id: "q2",
    tab: "第 2 题 · 城市建筑年鉴封面",
    prompt: "一本城市建筑年鉴需要 3:4 竖幅封面，要求庄重挺拔且有清晰的向上视线引导。四稿同样使用 5 根严格铅直的退台立柱与相同题字，仅改变重心与分割方式——选出最妥当的一稿：",
    correct: "B",
    options: [
      {
        key: "A",
        label: "方案 A",
        mode: "topHeavy",
        explain: "问题在「上重下轻倒悬」：最深最宽的墨块全压在顶部，柱脚削细悬空，视觉重力瞬间翻转向下坠，把垂直上升做成了压顶感。",
      },
      {
        key: "B",
        label: "方案 B",
        mode: "idealCover",
        explain: "成立！深墨绿厚底座稳稳压住底缘，中段松绿与暖石立柱逐级收窄向上，主柱顶端留出约 20% 暖米天空与金圆呼应，重心稳、升势清。",
      },
      {
        key: "C",
        label: "方案 C",
        mode: "crossBar",
        explain: "问题在「粗横带拦腰截断」：一条满宽的粗墨绿横条硬生生切在画面正中，把原本连贯向上的竖向视线一刀砍成上下两截。",
      },
      {
        key: "D",
        label: "方案 D",
        mode: "choppedTop",
        explain: "问题在「主塔顶出裁切且底座偏空」：最高柱直接顶破上边线截断，视觉在顶部受阻，下端留出大片无锚定的空白纸面显得轻飘。",
      },
    ],
  },
};

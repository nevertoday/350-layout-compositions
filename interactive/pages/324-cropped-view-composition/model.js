// 324 截景式构图 —— 单真源几何与诊断模型
// 所有画布绘制、缩略解剖图、读数数字与白话诊单全部从这里同一套实绘坐标算出。

export const FRAME_ASPECT = 4 / 3; // 取景框宽高比（画布内取景区）

// 三套题材：均以归一化局部坐标定义（主体中心为 (0,0)，半径/半宽约为 0.44）
// 所有人像均采用纯粹剪影轮廓，不画五官细节。
export const SUBJECTS = {
  poster: {
    id: "poster",
    label: "原海报·双环",
    shortLabel: "双环巨瞳",
    subtitle: "1:1 化用 324 原海报暖象牙大环与炭黑内核",
    directional: false,
    dirX: 0,
    dirY: 0,
    // 默认开场错态：主体缩小且外缘紧贴右框线（约 0.8% 擦边切线，未真正切入）
    badStart: { cx: 0.722, cy: 0.51, scale: 0.80 },
    // 几个代表性的合法解（模型接受任意达标位置，不限于预设）
    presets: {
      poster: { label: "原海报解", cx: 0.79, cy: 0.54, scale: 1.44 },
      diagonal: { label: "对角迫近解", cx: 0.14, cy: 0.84, scale: 1.38 },
      overcrop: { label: "试错：切碎", cx: 1.24, cy: 0.52, scale: 1.48 },
      trapped: { label: "试错：闷死", cx: 0.50, cy: 0.50, scale: 2.08 },
    },
    // 主体几何（局部坐标，单位相对于取景框高度 H）
    outerRadius: 0.45,
    coreOffset: { x: 0.055, y: 0.03 },
    coreRadius: 0.17,
    // 外轮廓包络采样判断函数（输入为缩放前局部坐标 lx, ly）
    inOuter(lx, ly) {
      return lx * lx + ly * ly <= 0.45 * 0.45;
    },
    inCore(lx, ly) {
      const dx = lx - 0.055;
      const dy = ly - 0.03;
      return dx * dx + dy * dy <= 0.17 * 0.17;
    },
    // 禁切关节/核心线（对于双环，就是核心圆周本身由 coreKeep 监控）
    jointLines: [],
  },
  ink: {
    id: "ink",
    label: "潘氏·孤石寒梅",
    shortLabel: "孤石寒梅",
    subtitle: "国画近景截石斜梅：截山不见顶、截干不见根",
    directional: true,
    dirX: 1,
    dirY: -0.25,
    badStart: { cx: 0.56, cy: 0.55, scale: 0.72 },
    presets: {
      poster: { label: "左切造险解", cx: 0.16, cy: 0.62, scale: 1.34 },
      diagonal: { label: "底角压境解", cx: 0.24, cy: 0.82, scale: 1.38 },
      overcrop: { label: "试错：切碎", cx: -0.22, cy: 0.62, scale: 1.42 },
      trapped: { label: "试错：闷死", cx: 0.48, cy: 0.52, scale: 2.15 },
    },
    outerRadius: 0.46,
    coreOffset: { x: 0.10, y: -0.05 }, // 石脊与朱梅交结焦眼
    coreRadius: 0.16,
    // 不规则巨石 + 斜出梅枝包络
    inOuter(lx, ly) {
      // 主体巨石（偏左下的折面块体）
      const inRock =
        lx >= -0.44 && lx <= 0.24 &&
        ly >= -0.28 + 0.35 * (lx + 0.1) && ly <= 0.42 &&
        (lx + 0.08) * (lx + 0.08) / (0.42 * 0.42) + (ly - 0.08) * (ly - 0.08) / (0.38 * 0.38) <= 1.05;
      // 斜出梅枝及花簇（朝右上伸展）
      const distBranch = Math.abs((ly + 0.06) + 0.48 * (lx - 0.08)) / Math.hypot(1, 0.48);
      const inBranch = lx >= -0.05 && lx <= 0.48 && ly >= -0.36 && ly <= 0.12 && distBranch <= 0.095;
      return inRock || inBranch;
    },
    inCore(lx, ly) {
      const dx = lx - 0.10;
      const dy = ly + 0.05;
      return dx * dx + dy * dy <= 0.155 * 0.155;
    },
    jointLines: [
      { axis: "x", val: 0.08, name: "梅石交结主干" },
    ],
  },
  street: {
    id: "street",
    label: "街头·疾驰单车",
    shortLabel: "疾驰单车",
    subtitle: "向右冲出的无五官骑手侧影：截后留前、避开脖颈车轴",
    directional: true,
    dirX: 1,
    dirY: 0,
    badStart: { cx: 0.68, cy: 0.54, scale: 0.74 },
    presets: {
      poster: { label: "截后疾驰解", cx: 0.20, cy: 0.58, scale: 1.32 },
      diagonal: { label: "低机位冲出解", cx: 0.22, cy: 0.76, scale: 1.42 },
      overcrop: { label: "试错：截前堵死", cx: 0.84, cy: 0.56, scale: 1.32 },
      trapped: { label: "试错：切中关节", cx: 0.30, cy: 0.277, scale: 1.32 },
    },
    outerRadius: 0.48,
    coreOffset: { x: 0.16, y: -0.02 }, // 车头、车把与前轮上缘
    coreRadius: 0.165,
    inOuter(lx, ly) {
      // 后轮
      const backWheel = (lx + 0.28) ** 2 + (ly - 0.17) ** 2 <= 0.18 ** 2;
      // 前轮
      const frontWheel = (lx - 0.27) ** 2 + (ly - 0.17) ** 2 <= 0.18 ** 2;
      // 车架与骑手前倾侧影（无五官）
      const body = lx >= -0.34 && lx <= 0.30 && ly >= -0.34 && ly <= 0.20 &&
        ((lx + 0.03) ** 2 / (0.36 ** 2) + (ly + 0.06) ** 2 / (0.30 ** 2) <= 1.0);
      return backWheel || frontWheel || body;
    },
    inCore(lx, ly) {
      const dx = lx - 0.16;
      const dy = ly + 0.02;
      return dx * dx + dy * dy <= 0.165 * 0.165;
    },
    // 典型关节禁切位：脖颈高度 y=-0.22、前轮轴 x=0.27、后轮轴 x=-0.28
    jointLines: [
      { axis: "x", val: 0.27, name: "前轮轴心" },
      { axis: "y", val: -0.21, name: "骑手脖颈关节" },
    ],
  },
};

export function createInitialState() {
  const s = SUBJECTS.poster.badStart;
  return {
    subject: "poster",
    cx: s.cx,       // 主体中心在取景框中的归一化 X（0=左框，1=右框，可超出 0..1）
    cy: s.cy,       // 主体中心在取景框中的归一化 Y（0=上框，1=下框）
    scale: s.scale, // 贴近倍率（0.55..2.35）
    xray: true,     // 是否显影画外空间（hors-champ）
  };
}

// 预生成确定性采样网格（在主体局部包围盒 [-0.52, 0.52]^2 上采样，快速且完全确定）
const SAMPLE_N = 28;
const SAMPLES_CACHE = {};

function getSubjectSamples(subjectId) {
  if (SAMPLES_CACHE[subjectId]) return SAMPLES_CACHE[subjectId];
  const subj = SUBJECTS[subjectId];
  const outer = [];
  const core = [];
  const step = 1.04 / SAMPLE_N;
  let minLx = Infinity, maxLx = -Infinity, minLy = Infinity, maxLy = -Infinity;
  for (let iy = 0; iy < SAMPLE_N; iy++) {
    const ly = -0.52 + (iy + 0.5) * step;
    for (let ix = 0; ix < SAMPLE_N; ix++) {
      const lx = -0.52 + (ix + 0.5) * step;
      if (subj.inOuter(lx, ly)) {
        outer.push([lx, ly]);
        if (lx < minLx) minLx = lx;
        if (lx > maxLx) maxLx = lx;
        if (ly < minLy) minLy = ly;
        if (ly > maxLy) maxLy = ly;
      }
      if (subj.inCore(lx, ly)) {
        core.push([lx, ly]);
      }
    }
  }
  const data = { outer, core, cellArea: step * step, minLx, maxLx, minLy, maxLy };
  SAMPLES_CACHE[subjectId] = data;
  return data;
}

const pct = (v) => `${Math.round(v * 100)}%`;

// 从实绘坐标单真源计算所有几何指标、三项检查与白话诊单（按同帧同状态缓存避免重复采样）
let lastEvalKey = "";
let lastEvalResult = null;

export function evaluateCrop(state) {
  const key = `${state.subject}|${state.cx.toFixed(4)}|${state.cy.toFixed(4)}|${state.scale.toFixed(3)}`;
  if (key === lastEvalKey && lastEvalResult) return lastEvalResult;
  const subj = SUBJECTS[state.subject] || SUBJECTS.poster;
  const samples = getSubjectSamples(subj.id);
  const s = state.scale;
  const invAspect = 1 / FRAME_ASPECT;

  // 局部坐标 -> 取景框归一化坐标 [0..1, 0..1]
  // 注意：主体缩放基准为取景框高度 H，所以水平坐标要乘 (1 / FRAME_ASPECT) 保持正圆不变形！
  const toU = (lx) => state.cx + lx * s * invAspect;
  const toV = (ly) => state.cy + ly * s;

  // 精确包络边界（在取景框坐标系中）
  const uMin = toU(samples.minLx);
  const uMax = toU(samples.maxLx);
  const vMin = toV(samples.minLy);
  const vMax = toV(samples.maxLy);

  // 统计外轮廓和核心落在取景框内的点数
  let outerIn = 0;
  let outLeft = 0, outRight = 0, outTop = 0, outBottom = 0;
  for (let i = 0; i < samples.outer.length; i++) {
    const [lx, ly] = samples.outer[i];
    const u = toU(lx);
    const v = toV(ly);
    const inX = u >= 0 && u <= 1;
    const inY = v >= 0 && v <= 1;
    if (inX && inY) {
      outerIn++;
    } else {
      if (u < 0) outLeft++;
      if (u > 1) outRight++;
      if (v < 0) outTop++;
      if (v > 1) outBottom++;
    }
  }

  let coreIn = 0;
  for (let i = 0; i < samples.core.length; i++) {
    const [lx, ly] = samples.core[i];
    const u = toU(lx);
    const v = toV(ly);
    if (u >= 0 && u <= 1 && v >= 0 && v <= 1) coreIn++;
  }

  const totalOuter = Math.max(1, samples.outer.length);
  const totalCore = Math.max(1, samples.core.length);
  const keepRatio = outerIn / totalOuter;
  const cutRatio = 1 - keepRatio;
  const coreKeep = coreIn / totalCore;

  // 画内占幅面积比（每格在归一化框内的面积 = cellArea * s^2 / FRAME_ASPECT）
  const inFrameCoverage = Math.min(1, outerIn * samples.cellArea * s * s * invAspect);

  // 各边切入深度（>0 表示穿过该边，接近 0 表示擦边）
  const penLeft = -uMin;
  const penRight = uMax - 1;
  const penTop = -vMin;
  const penBottom = vMax - 1;

  const cutEdges = {
    left: penLeft > 0.015,
    right: penRight > 0.015,
    top: penTop > 0.015,
    bottom: penBottom > 0.015,
  };
  const cutEdgeList = Object.entries(cutEdges).filter(([, on]) => on).map(([k]) => k);
  const cutEdgeCount = cutEdgeList.length;

  // 擦边（Tangent）检测：外轮廓紧贴某条框线 [-0.036, +0.022]，或总截除率在尴尬削皮带 (0.01..0.11)
  const nearEdge = (pen) => pen >= -0.036 && pen <= 0.024;
  const tangentEdges = [];
  if (nearEdge(penLeft)) tangentEdges.push("左框");
  if (nearEdge(penRight)) tangentEdges.push("右框");
  if (nearEdge(penTop)) tangentEdges.push("上框");
  if (nearEdge(penBottom)) tangentEdges.push("下框");

  // 反侧呼吸留白（未切开方向上最大连续底色宽度）
  const clearLeft = Math.max(0, uMin);
  const clearRight = Math.max(0, 1 - uMax);
  const clearTop = Math.max(0, vMin);
  const clearBottom = Math.max(0, 1 - vMax);
  const maxBreathing = Math.max(clearLeft, clearRight, clearTop, clearBottom);

  // 焦核中心在画框中的位置
  const coreU = toU(subj.coreOffset.x);
  const coreV = toV(subj.coreOffset.y);
  const coreCenterDist = Math.hypot((coreU - 0.5) * FRAME_ASPECT, coreV - 0.5);

  // 关节/敏感线被框边直劈检测
  let severedJoint = null;
  for (const j of subj.jointLines) {
    if (j.axis === "x") {
      const ju = toU(j.val);
      if (Math.abs(ju - 0) < 0.035 || Math.abs(ju - 1) < 0.035) {
        severedJoint = j.name;
        break;
      }
    } else {
      const jv = toV(j.val);
      if (Math.abs(jv - 0) < 0.035 || Math.abs(jv - 1) < 0.035) {
        severedJoint = j.name;
        break;
      }
    }
  }

  // 动势前方是否被堵死（仅对有向右方向性的题材生效）
  const frontBlocked = subj.directional && (
    (penRight > 0.03 && clearLeft > 0.18) ||
    (clearRight < 0.11 && penLeft <= 0.02)
  );

  // 外延矢量方向（指向截出最多的一侧）
  const vx = outRight - outLeft;
  const vy = outBottom - outTop;
  const vLen = Math.hypot(vx, vy);
  const extendVec = vLen > 0 ? { x: vx / vLen, y: vy / vLen } : { x: 0, y: 0 };
  const edgeZh = { left: "左", right: "右", top: "上", bottom: "下" };
  let extendLabel = "无外延";
  if (cutEdgeCount === 4) extendLabel = "四面闷堵";
  else if (cutEdgeCount > 0) extendLabel = `${cutEdgeList.map((e) => edgeZh[e]).join("·")}侧外延`;

  // 三项核心标准（与 324 海报三圆徽一一对应：截取 CROP / 延伸 EXTEND / 聚焦 FOCUS）
  const isOvercropped = cutRatio > 0.64 || coreKeep < 0.35;
  const isUncropped = cutRatio < 0.04;
  const isSliver = !isUncropped && cutRatio < 0.13;
  const isTangentOnly = isUncropped && tangentEdges.length > 0;
  const isTimidScale = !isUncropped && !isOvercropped && inFrameCoverage < 0.19;
  const isFourSides = cutEdgeCount === 4 || (cutEdgeCount >= 3 && maxBreathing < 0.12);
  const isCoreSevered = (coreKeep >= 0.35 && coreKeep < 0.80) || Boolean(severedJoint);
  const isCenterDead = cutEdgeCount >= 2 && coreCenterDist < 0.065 && Math.abs(penLeft - penRight) < 0.05 && Math.abs(penTop - penBottom) < 0.05;

  const cropOk = !isUncropped && !isSliver && !isOvercropped && !isTimidScale && cutEdgeCount >= 1 && cutEdgeCount <= 3;
  const extendOk = cutEdgeCount >= 1 && !isFourSides && maxBreathing >= 0.17 && !frontBlocked && !isCenterDead;
  const focusOk = coreKeep >= 0.80 && !severedJoint && !isOvercropped && !isCenterDead;

  const passedCount = (cropOk ? 1 : 0) + (extendOk ? 1 : 0) + (focusOk ? 1 : 0);
  const pass = cropOk && extendOk && focusOk;

  // 逐级确定首要错态与白话诊单
  let code = "pass";
  let badge = "3/3 截景成立";
  let headline = "";
  let body = "";
  let nextStep = "";
  let tensionTier = "饱满（示意）";

  if (pass) {
    code = "pass";
    badge = "3/3 截景成立";
    headline = `${extendLabel}切入 ${pct(cutRatio)}，焦核稳留画内`;
    body = `画框果断切开${subj.shortLabel}外轮廓 ${pct(cutRatio)}（经验参考带 16%–58%），画内占幅 ${pct(inFrameCoverage)} 带来贴脸临场感；对侧留出 ${pct(maxBreathing)} 呼吸底面，人脑顺着切口自然向画外补完余势，同时核心留存 ${pct(coreKeep)}，眼睛一进画就能定锚。`;
    nextStep = "再试试把主体推到左框、底角，或切到「潘氏·孤石寒梅」「街头·疾驰单车」体验不同题材的截法。";
    tensionTier = cutRatio > 0.42 ? "强迫近（示意）" : "饱满（示意）";
  } else if (isTangentOnly) {
    code = "tangent";
    badge = `${passedCount}/3 擦边犹豫`;
    headline = `轮廓刚好舔在${tangentEdges[0]}线上（截除 ${pct(cutRatio)}），视觉发紧卡顿`;
    body = `主体缩在框内且离${tangentEdges[0]}几乎贴平，既没有退远留白，又没敢一刀切下去。视觉设计里把这种轮廓紧舔框线的现象称作「擦边切线（Tangent）」——观者会怀疑是排版没对齐或拍照没装下，憋屈而小气。`;
    nextStep = "拖着右侧白色虚线刀刃往左切入（或在画布上向右横拖、按 → 键），同时调高「贴近倍率」，让轮廓干脆跨过刀框至少切掉 16% 以上。";
    tensionTier = "擦边卡顿（示意）";
  } else if (isUncropped) {
    code = "uncropped";
    badge = `${passedCount}/3 全收无截`;
    headline = `主体完整缩在框内（截除 ${pct(cutRatio)}），画外空间还没被唤醒`;
    body = `此时四条框线把${subj.shortLabel}严严实实包在画里，画框只起到「向心封闭」作用。它是一张普通完整构图，缺少截景式构图贴近逼人的紧迫感与向画外延续的想象。`;
    nextStep = "在画布上横拖把主体推过任意一条虚线框边，或把「贴近倍率」拉到 1.25× 以上。";
    tensionTier = "平静封闭（示意）";
  } else if (isOvercropped) {
    code = "overcrop";
    badge = `${passedCount}/3 切碎失认`;
    headline = `截除高达 ${pct(cutRatio)}，主体与核心被切碎难辨`;
    body = `截景借的是「见局部知全体」的脑补力。现在画内只剩 ${pct(keepRatio)} 轮廓，焦核也仅留 ${pct(coreKeep)}，特征信息断链，观者只能看到残块色面，无法在脑中复原它原本的体量。`;
    nextStep = "反向拖回主体或略微调小倍率，把截除比例收回 16%–58% 经验参考带，并保住识别核心。";
    tensionTier = "过载失认（示意）";
  } else if (isFourSides) {
    code = "four_sides_trapped";
    badge = `${passedCount}/3 四边闷死`;
    headline = `四边同时切满（反侧净空仅 ${pct(maxBreathing)}），画面憋成色砖`;
    body = `截景需要「一面猛切、对侧留气」才能拉出向外冲出的方向感。现在主体放大至 ${s.toFixed(2)}× 把四周全部顶死，视线无处透气，外延矢量互相抵消，只剩压抑窒息。`;
    nextStep = "调小「贴近倍率」并把主体往一侧挪，在对面腾出至少 18% 的纯净底色呼吸区。";
    tensionTier = "憋堵窒息（示意）";
  } else if (frontBlocked) {
    code = "wrong_direction";
    badge = `${passedCount}/3 截前留后`;
    headline = `把行进/出枝前方切死了（前方净空 ${pct(clearRight)}），动势迎面撞墙`;
    body = `${subj.shortLabel}带有鲜明向右冲出的趋势。此时右侧前路被画框直接挡断，大片空地却浪费在身后，观者会觉得画面被硬生生刹停。截景动势应「截尾留前」：切掉后半截，把呼吸留给前进方向。`;
    nextStep = "在画布上向左横拖（或按 ← 键），改从左框切入主体后半段，让右侧前方留出 ≥ 18% 的冲刺空间。";
    tensionTier = "撞墙受阻（示意）";
  } else if (severedJoint || isCoreSevered) {
    code = "focus_severed";
    badge = `${passedCount}/3 ${severedJoint ? "切中关节" : "焦核被劈"}`;
    headline = severedJoint
      ? `画框边线正劈在「${severedJoint}」上，视觉突兀折断`
      : `识别核心被框线劈开（仅留 ${pct(coreKeep)}），落眼处残缺`;
    body = severedJoint
      ? `截取人物或器物时，最忌在关节、脖颈、车轴或主干交结处一刀齐断——大脑会将其误读为残缺折断。应该避开关节中段，改切在更宽阔的肢段或后半体块上。`
      : `截景切的是外围体量，留的是最抓眼的焦点。现在识别核心有一半压在框线上，视线刚落下来就被框边切断，找不到安稳停留处。`;
    nextStep = "微调横纵位置或略收倍率，让识别核心完整退回画框内部（留存 ≥ 82%），只让外围轮廓跨过框线。";
    tensionTier = "焦点撕裂（示意）";
  } else if (isSliver) {
    code = "tangent";
    badge = `${passedCount}/3 削皮犹豫`;
    headline = `只削掉了 ${pct(cutRatio)} 薄边，像失手裁坏而非有意截景`;
    body = `最尴尬的裁切不是没切，而是「只切掉一小条皮」。截除低于 13% 时，观者直觉会觉得你构图没居中对齐；想做截景，下刀必须明确干脆，一眼就能看清你是故意的。`;
    nextStep = "再往外推一把或加大倍率，把截除深度推进到 16%–58% 的明确区间。";
    tensionTier = "犹豫削皮（示意）";
  } else if (isTimidScale) {
    code = "timid_scale";
    badge = `${passedCount}/3 体量太怯`;
    headline = `画内只探进 ${pct(inFrameCoverage)} 体量，滑成了远观边角`;
    body = `虽然外缘被框边切开了 ${pct(cutRatio)}，但主体本身偏小，画面空荡，缺少截景式构图应有的迫近压迫与大局部质感——这种轻退一隅的呼吸感更接近边角式构图。`;
    nextStep = "调高「贴近倍率」把主体推近镜头，让画内实景占幅达到 24% 以上。";
    tensionTier = "单薄偏弱（示意）";
  } else {
    code = "center_dead";
    badge = `${passedCount}/3 居中死切`;
    headline = `核心卡死画心且两边均切，失去单向延伸势`;
    body = `核心距画心仅 ${pct(coreCenterDist)}，左右切口几乎对称，画面像被平均装裱在框里。把焦点稍微偏置，让一侧重切、另一侧敞开，截景的临场拉扯感才会立刻出来。`;
    nextStep = "向左或向右横拖画布，打破对称均切，建立一侧压境、对侧留气的不对称节奏。";
    tensionTier = "僵滞对称（示意）";
  }

  // 三圆徽实时短签
  const cropTag = isUncropped
    ? `未截 ${pct(cutRatio)}`
    : isSliver
      ? `削皮 ${pct(cutRatio)}`
      : isOvercropped
        ? `切碎 ${pct(cutRatio)}`
        : isTimidScale
          ? `偏小 ${pct(inFrameCoverage)}`
          : cutEdgeCount === 4
            ? "四边顶死"
            : `切入 ${pct(cutRatio)}`;

  const extendTag = isUncropped
    ? "封闭未延"
    : isFourSides
      ? "无路透气"
      : frontBlocked
        ? "前方堵死"
        : isCenterDead
          ? "对称失势"
          : maxBreathing < 0.17
            ? `留气 ${pct(maxBreathing)}`
            : extendLabel;

  const focusTag = severedJoint
    ? `劈中${severedJoint.slice(0, 2)}`
    : isOvercropped
      ? `失认 ${pct(coreKeep)}`
      : coreKeep < 0.80
        ? `核心残 ${pct(coreKeep)}`
        : isCenterDead
          ? "卡死正中"
          : `核心稳 ${pct(coreKeep)}`;

  const res = {
    subj,
    uMin, uMax, vMin, vMax,
    coreU, coreV,
    cutRatio,
    keepRatio,
    inFrameCoverage,
    coreKeep,
    maxBreathing,
    clearLeft, clearRight, clearTop, clearBottom,
    cutEdges,
    cutEdgeList,
    cutEdgeCount,
    tangentEdges,
    severedJoint,
    frontBlocked,
    extendVec,
    extendLabel,
    tensionTier,
    checks: { crop: cropOk, extend: extendOk, focus: focusOk },
    tags: { crop: cropTag, extend: extendTag, focus: focusTag },
    passedCount,
    pass,
    code,
    badge,
    headline,
    body,
    nextStep,
  };
  lastEvalKey = key;
  lastEvalResult = res;
  return res;
}

// 02 节：切刃落点标尺数据（无五官立姿剪影 & 传统长颈陶瓶）
export const BLADE_LAB = {
  figure: {
    id: "figure",
    label: "立姿剪影（无五官）",
    hint: "点击左侧任意裁切刻度，观察「安全肢段」与「禁切关节」的观感差异",
    cuts: [
      {
        id: "head-top",
        y: 0.17,
        label: "切额顶以上",
        tag: "大胆特写 · 可用",
        ok: true,
        title: "果断切过额顶：迫近视线，突出神态气场",
        desc: "在近景肖像里，果断切掉头顶上方一小段反而比恰好擦过头皮更自然。人脑顺着头颅弧线自动补全轮廓，重心立刻沉向面部轮廓与肩线（经验做法，需保留主要头部神态与特征区）。",
      },
      {
        id: "neck",
        y: 0.31,
        label: "平切脖颈处",
        tag: "禁切关节 · 忌用",
        ok: false,
        title: "切在脖颈最细处：强烈的「斩断感」",
        desc: "脖颈是头与躯干的连接窄口。画框底边刚好落在这里时，头部像被搁在框沿上，毫无支撑，视觉极其刺目。应往下多留半个肩部，或直接推近到胸肩中段。",
      },
      {
        id: "mid-chest",
        y: 0.45,
        label: "切胸腹中段",
        tag: "安全肢段 · 稳妥",
        ok: true,
        title: "落在上臂与胸腔中段：半身截景经典落刀位",
        desc: "画框切过饱满的躯干与上臂中段，双肩结构完整，既有近距离面对面的临场感，又让观者自然补全画外身姿，没有任何截肢错觉。",
      },
      {
        id: "wrist",
        y: 0.63,
        label: "平切手腕/腰胯节",
        tag: "禁切关节 · 忌用",
        ok: false,
        title: "切在手腕与肘弯边缘：手掌半截悬空",
        desc: "垂落的手掌刚好被底框切在腕关节上，或留出半截手指尖贴在框边——这是人像与广告摄影最常犯的「关节削边」失误，显得手脚残缺、裁切草率。",
      },
      {
        id: "mid-thigh",
        y: 0.77,
        label: "切大腿中段",
        tag: "安全肢段 · 稳妥",
        ok: true,
        title: "切在大腿中段（避开膝盖与脚踝）",
        desc: "影视与时尚海报里的七分景（American Shot / 中近景）通常落在大腿中段而非膝关节。只要避开膝盖与脚踝这两个转折点，躯干向画外延伸的节奏就非常利落。",
      },
    ],
  },
  vessel: {
    id: "vessel",
    label: "大漆长颈瓶",
    hint: "器物同样有「瓶颈、瓶肩、圈足」转折线，下刀避开擦边与细颈口",
    cuts: [
      {
        id: "lip-tangent",
        y: 0.16,
        label: "擦过瓶口边沿",
        tag: "擦边切线 · 忌用",
        ok: false,
        title: "画框上沿刚舔着瓶口：憋屈卡顿",
        desc: "瓶口既没留出透气空白，也没被果断切掉，刚好贴在顶边线上。观者第一反应是「图顶到头了、排版失误」，紧张感变成了压迫的不适感。",
      },
      {
        id: "neck-narrow",
        y: 0.30,
        label: "平切细瓶颈处",
        tag: "结构窄口 · 慎用",
        ok: false,
        title: "拦腰切在瓶颈转折：器型辨识断裂",
        desc: "长颈瓶的颈部是造型识别的关键过渡区。如果框线刚好落在颈肩交界处，观者看不清上面是敞口瓶还是葫芦壶，形态猜想断链。",
      },
      {
        id: "belly-cut",
        y: 0.56,
        label: "果断切过瓶腹弧面",
        tag: "饱满曲面 · 推荐",
        ok: true,
        title: "切在饱满瓶腹中段：器物材质与体量感倍增",
        desc: "把最宽阔的曲面弧线推过画框，既完整交代了瓶口与肩线，又靠硕大的被截弧腹暗示器物沉重厚实的实体感，这正是 324 原海报大环的同源逻辑。",
      },
      {
        id: "foot-sliver",
        y: 0.87,
        label: "仅削掉圈足一薄片",
        tag: "削皮犹豫 · 忌用",
        ok: false,
        title: "只切掉底足 5%：像失手没拍全",
        desc: "整只瓶子几乎都画完了，唯独最底下那道圈足被削掉一半——既无特写冲击力，又失了完整器物的端庄，两头落空。",
      },
    ],
  },
};

// 03 节：历史里程碑与伯奇画外六空间
export const HISTORY_ITEMS = [
  {
    id: "hiroshige",
    year: "1857",
    who: "歌川广重",
    work: "《名所江户百景·龟户梅屋敷》",
    museum: "布鲁克林博物馆藏（30.1478.30）",
    activeZones: ["left", "top", "front"],
    summary: "将前景老梅粗干推到近乎贴脸的位置，被左右与顶框狠狠截断，透过梅枝缝隙遥望远方梅园——用极近的「截景前景」拉出前所未有的空间纵深，1887 年被梵高临摹，直接震动欧洲画坛。",
  },
  {
    id: "degas",
    year: "1874–1875",
    who: "埃德加·德加",
    work: "《舞台上的芭蕾排练》与《协和广场》",
    museum: "大都会艺术博物馆（29.160.26）/ 冬宫博物馆",
    activeZones: ["left", "right", "bottom"],
    summary: "受浮世绘与早期快拍摄影启发，德加打破学院派把人物完整居中的清规，故意让画框腰斩行人、马车与舞者裙摆，使画布不再是封闭舞台，而是生活瞬间流过的一扇窗。",
  },
  {
    id: "pantianshou",
    year: "1955 / 1980",
    who: "潘天寿",
    work: "《灵岩涧一角》与《听天阁画谈随笔》",
    museum: "中国美术馆藏 / 上海人民美术出版社 1980 首版",
    activeZones: ["bottom", "left", "right"],
    summary: "在《灵岩涧一角》中不画飞瀑全景，只截取溪涧巨石与幽花的一隅，把方硬巨石大力顶出画边。他在画论中强调经营「四边四角」、以截景造险，将中国画的局部张力推向现代构成的高度。",
  },
  {
    id: "burch",
    year: "1951 / 1969",
    who: "巴赞 & 伯奇",
    work: "〈绘画与电影〉与《电影实践理论》",
    museum: "加州大学出版社 / 普林斯顿大学出版社",
    activeZones: ["left", "right", "top", "bottom", "front", "back"],
    summary: "巴赞指出油画的「画框（cadre）」是向心封闭的，电影银幕的「遮幅（cache）」是离心外延的；伯奇进一步把画外空间（hors-champ）精确划分为六个方位，阐明被截边缘如何激活画外世界。",
  },
];

export const BURCH_ZONES = {
  top: { label: "① 上框之外", role: "高空、屋顶、画外垂落之物（如广重顶框截枝）" },
  right: { label: "② 右框之外", role: "人物去向、视线尽头或即将冲出的延伸方向（324 原海报主外延侧）" },
  bottom: { label: "③ 下框之外", role: "地面承托、未画出的躯干下半部与近景踏脚处" },
  left: { label: "④ 左框之外", role: "来路与源头：如德加被左框腰斩的入画行人、巨石山根" },
  front: { label: "⑤ 镜后空间", role: "观者/摄影机所站的位置：主体贴脸逼近时，仿佛正朝观者扑来" },
  back: { label: "⑥ 景后空间", role: "被前景巨物遮挡在背后的隐藏世界（如巨梅背后的梅园人群）" },
};

// 04 节：同一小类五式对照
export const SIBLING_MODES = [
  {
    id: "321",
    name: "全景式构图",
    en: "Panoramic",
    url: "https://layout.xiaoxiaodong.ai/321/play/",
    isCurrent: false,
    rule: "拉远取全貌",
    desc: "退后一步装下完整山势与水天辽阔，核心是「宏阔包容」，主体绝不强行切出画框。",
  },
  {
    id: "322",
    name: "一河两岸式",
    en: "Riverbank",
    url: "https://layout.xiaoxiaodong.ai/322/play/",
    isCurrent: false,
    rule: "中水分两岸",
    desc: "以中轴水域划开左右两岸，借大小疏密与近实远虚形成遥相呼应，核心是「两岸对话」。",
  },
  {
    id: "323",
    name: "边角式构图",
    en: "Corner",
    url: "https://layout.xiaoxiaodong.ai/323/play/",
    isCurrent: false,
    rule: "退角留大片",
    desc: "将主体收束在一角、对面留出大片空寂与视线导引，核心是「以空衬实」的清旷余韵。",
  },
  {
    id: "324",
    name: "截景式构图",
    en: "Cropped View",
    url: "https://layout.xiaoxiaodong.ai/324/play/",
    isCurrent: true,
    rule: "贴脸切轮廓",
    desc: "本页主角：把主体放大贴近，故意让画框干脆切开外缘，借画外脑补制造紧迫感与临场冲击。",
  },
  {
    id: "325",
    name: "折枝式构图",
    en: "Cut-Branch",
    url: "https://layout.xiaoxiaodong.ai/325/play/",
    isCurrent: false,
    rule: "摘枝成完景",
    desc: "截取花木一枝独立成画，通常讲究四周留清气、枝叶起承完整，重清雅品赏而非破框压迫。",
  },
];

// 05 节：六大实战场景裁决
export const SCENARIOS = [
  {
    id: "poster-thriller",
    title: "悬疑片先导海报",
    brief: "只取半张侧脸剪影与一截紧握门把的手，其余压入暗部。",
    fit: true,
    reason: "非常适合。隐藏的另一半刚好制造悬念，让观者主动脑补门外发生了什么，紧迫感与临场感拉满。",
  },
  {
    id: "ecom-spec",
    title: "新品陶瓷杯详情首图",
    brief: "顾客还没见过杯子全貌，主图只裁出半只杯柄和局部釉色。",
    fit: false,
    reason: "不宜用在首图。购买决策第一步需要看清完整器型、比例与容量；材质釉面截景应放在第 3–4 张细节图里。",
  },
  {
    id: "sneaker-kv",
    title: "竞速跑鞋发布会主视觉",
    brief: "把鞋底碳板与后跟气垫放大到斜切冲出右框，鞋头直指前方。",
    fit: true,
    reason: "非常适合。把最核心的科技结构放大迫近，切掉部分后跟反而强化向前冲刺的速度感与体量感。",
  },
  {
    id: "fire-map",
    title: "商场消防逃生平面图",
    brief: "为了画面张力，只截取当前楼层中庭一角并把楼梯口裁掉一半。",
    fit: false,
    reason: "绝对禁用。功能导视、地图、工程结构图的第一任务是无歧义交代全局与出口位置，截景会直接造成认知与安全事故。",
  },
  {
    id: "coffee-menu",
    title: "手冲咖啡馆季刊封面",
    brief: "俯拍只截半只铜壶嘴与冲入粉层的细水流，对面留出干净书名区。",
    fit: true,
    reason: "非常适合。器物轮廓人人熟悉，即使只露一半也能瞬间认出，同时在暖调静谧里制造扑面而来的香气与亲密临场感。",
  },
  {
    id: "id-badge",
    title: "博物馆文物档案标准照",
    brief: "给青铜鼎建档入库时，故意把一侧鼎耳与双足裁在画外。",
    fit: false,
    reason: "必须全貌。文物建档、标本图鉴与产品规范需要记录完整边界与尺寸关系，截景只适用于展览宣传海报，不能替代档案照。",
  },
];

// 06 节：小练习（四张仅差裁切位置与深度的大漆器物展海报）
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    meta: "右框齐边 · 截除 0%",
    cx: 0.665,
    cy: 0.60,
    scale: 0.80,
    correct: false,
    verdict: "外沿紧贴右框却没切开，形成尴尬的「擦边切线」。",
    detail: "大漆圆盘被推到右边，外弧刚好舔在右框线上（截除 0%）。这种既不留呼吸缝、又不干脆切掉的边界最容易让观者感到卡顿，以为是排版偏移了。",
  },
  {
    id: "B",
    label: "方案 B",
    meta: "右切三成 · 核稳留内",
    cx: 0.725,
    cy: 0.60,
    scale: 1.18,
    correct: true,
    verdict: "最准确：果断切开外环约 32%，盘心墨核完整定锚，左留呼吸。",
    detail: "圆盘放大后干脆跨过右框，人脑会自动向画外补出硕大的完整圆周；同时左侧留出清晰朱砂底面形成反侧透气，盘心墨核完整留在画内且与右框留出干净余地——「截取、延伸、聚焦」三者同时成立。",
  },
  {
    id: "C",
    label: "方案 C",
    meta: "右切六成 · 劈开盘心",
    cx: 1.08,
    cy: 0.60,
    scale: 1.24,
    correct: false,
    verdict: "下刀过深：盘心墨核被右框一刀劈开，视觉落点残缺。",
    detail: "截除超过六成且直接切过最吸睛的盘心墨核，观者视线刚落到黑核就被框边截断，大盘的完整圆形弧度也开始含糊，容易退化成单纯的弯条色块。",
  },
  {
    id: "D",
    label: "方案 D",
    meta: "居中放大 · 四边齐切",
    cx: 0.50,
    cy: 0.50,
    scale: 1.72,
    correct: false,
    verdict: "四边同时切满：画面塞成色砖，失去了外延的方向与呼吸。",
    detail: "虽然主体很大，但上下左右四条边同时切过外环，四周几乎没有底色余地，外延力量向四面抵消，画面变得闷堵呆板，反而不如单侧猛切来得有张力。",
  },
];

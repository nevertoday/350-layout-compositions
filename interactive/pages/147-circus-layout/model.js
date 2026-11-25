// 147 马戏团版式 · 单一几何与视觉诊断真源
// 逻辑舞台坐标系：W = 720, H = 540（4:3 马戏海报画幅）
// 渲染画布、碰撞提示框、视线跳步曲线、踩球团长倾角、四支柱徽标与票根诊单全部读取本文件算出的同一份结果。

export const STAGE_W = 720;
export const STAGE_H = 540;

export const THEMES = {
  circus: {
    id: "circus",
    label: "大篷夜演",
    headlineA: "大篷夜演",
    headlineB: "星光马戏",
    ribbon: "AERIAL SHOW · 惊险空中飞人",
    stampTop: "周六 19:30",
    stampSub: "仅演三场 · ¥38",
    note: "红白帐篷准时亮灯，前排入座送彩球纪念票。",
    starKind: "ringmaster",
  },
  market: {
    id: "market",
    label: "周末市集",
    headlineA: "复古大集",
    headlineB: "周末开摆",
    ribbon: "OPEN MARKET · 80 家手作摊",
    stampTop: "10:00-21:00",
    stampSub: "旧厂房广场 · 免费",
    note: "黑胶唱片、木活字印画与热红酒全天不打烊。",
    starKind: "ringmaster",
  },
  festival: {
    id: "festival",
    label: "音乐现场",
    headlineA: "噪浪现场",
    headlineB: "夏夜开唱",
    ribbon: "LIVE STAGE · 十二支独立乐队",
    stampTop: "7月18日",
    stampSub: "草坪主舞台 · ¥98",
    note: "日落开场至午夜，自带野餐垫直冲前排音浪。",
    starKind: "ringmaster",
  },
};

export const TILT_MODES = {
  flat: { id: "flat", label: "全 0° 死直", headline: 0, ribbon: 0, stamp: 0, note: 0 },
  same: { id: "same", label: "同向滑坡", headline: 12, ribbon: 11, stamp: 13, note: 9 },
  counter: { id: "counter", label: "反向互锁", headline: -7, ribbon: 5, stamp: -5, note: 0 },
  wild: { id: "wild", label: "±24° 狂转", headline: -24, ribbon: 22, stamp: -26, note: 18 },
};

export const FOCUS_MODES = {
  chaos: { id: "chaos", label: "全员抢戏" },
  spotlight: { id: "spotlight", label: "聚光主次" },
  muted: { id: "muted", label: "失色冷淡" },
};

// 开场故意落在 0/4 翻车态：平码字号 + 全 0° 死直 + 全员高饱和实底抢戏 + 92% 彩屑淹字
export function createInitialState() {
  return {
    theme: "circus",
    jumpRatio: 1.18,
    tiltMode: "flat",
    focusMode: "chaos",
    clutter: 92,
    showPath: true,
    selectedId: "headline",
    offsets: {
      headline: { dx: 0, dy: 0 },
      ribbon: { dx: 0, dy: 0 },
      stamp: { dx: 0, dy: 0 },
      star: { dx: 0, dy: 0 },
      note: { dx: 0, dy: 0 },
    },
    angleDeltas: {
      headline: 0,
      ribbon: 0,
      stamp: 0,
      note: 0,
    },
  };
}

// 预设两套典型错版方便用户主动体验翻车（不提供一键过关！）
export const FAILURE_PRESETS = {
  allLoud: {
    jumpRatio: 1.25,
    tiltMode: "same",
    focusMode: "chaos",
    clutter: 90,
  },
  wildSpin: {
    jumpRatio: 5.3,
    tiltMode: "wild",
    focusMode: "spotlight",
    clutter: 44,
  },
};

// 固定种子的 28 枚嘉年华装饰道具（1..16 分布在外缘安全呼吸带，17..28 越过 58% 浓度后闯入中央文字区制造真噪音遮挡）
const PROP_SEEDS = [
  // 外缘欢腾点缀（前 16 枚，安全落在边角与大篷气口，默认甜区 0 压字）
  { x: 126, y: 98, r: 10, kind: "diamond", color: "ink" },
  { x: 672, y: 78, r: 10, kind: "dot", color: "red" },
  { x: 36, y: 214, r: 9, kind: "dot", color: "red" },
  { x: 684, y: 214, r: 12, kind: "diamond", color: "blue" },
  { x: 38, y: 448, r: 10, kind: "dot", color: "gold" },
  { x: 670, y: 468, r: 18, kind: "star5", color: "blue" },
  { x: 472, y: 86, r: 9, kind: "diamond", color: "ink" },
  { x: 492, y: 146, r: 8, kind: "dot", color: "blue" },
  { x: 484, y: 318, r: 11, kind: "diamond", color: "blue" },
  { x: 472, y: 454, r: 10, kind: "star5", color: "ink" },
  { x: 96, y: 506, r: 13, kind: "star8", color: "blue" },
  { x: 432, y: 58, r: 8, kind: "dot", color: "gold" },
  { x: 678, y: 148, r: 8, kind: "dot", color: "red" },
  { x: 32, y: 342, r: 8, kind: "dot", color: "blue" },
  { x: 356, y: 504, r: 9, kind: "star5", color: "red" },
  { x: 516, y: 502, r: 8, kind: "dot", color: "gold" },
  // 过载区（17..28 枚，clutter > 57% 时涌入核心文字区，实测压字！）
  { x: 210, y: 175, r: 26, kind: "star8", color: "gold", loud: true },
  { x: 318, y: 228, r: 24, kind: "ball", color: "red", loud: true },
  { x: 154, y: 294, r: 22, kind: "star8", color: "blue", loud: true },
  { x: 286, y: 326, r: 26, kind: "ball", color: "gold", loud: true },
  { x: 382, y: 280, r: 22, kind: "star5", color: "red", loud: true },
  { x: 196, y: 386, r: 24, kind: "ball", color: "blue", loud: true },
  { x: 328, y: 416, r: 22, kind: "star8", color: "red", loud: true },
  { x: 118, y: 210, r: 22, kind: "ball", color: "gold", loud: true },
  { x: 252, y: 132, r: 21, kind: "star5", color: "blue", loud: true },
  { x: 412, y: 198, r: 23, kind: "ball", color: "red", loud: true },
  { x: 244, y: 446, r: 21, kind: "star8", color: "gold", loud: true },
  { x: 138, y: 342, r: 23, kind: "ball", color: "red", loud: true },
];

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 计算旋转矩形的四个顶点
function obbCorners(box) {
  const rad = (box.deg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const hw = box.w / 2;
  const hh = box.h / 2;
  return [
    { x: box.cx + (-hw * c - -hh * s), y: box.cy + (-hw * s + -hh * c) },
    { x: box.cx + (hw * c - -hh * s), y: box.cy + (hw * s + -hh * c) },
    { x: box.cx + (hw * c - hh * s), y: box.cy + (hw * s + hh * c) },
    { x: box.cx + (-hw * c - hh * s), y: box.cy + (-hw * s + hh * c) },
  ];
}

// SAT 分离轴法精确检测两个旋转矩形是否重叠（允许极小 4px 视觉贴缝容差）
function obbOverlap(a, b, pad = -4) {
  const shrink = (box) => ({ ...box, w: Math.max(6, box.w + pad * 2), h: Math.max(6, box.h + pad * 2) });
  const ca = obbCorners(shrink(a));
  const cb = obbCorners(shrink(b));
  const axes = [];
  for (const poly of [ca, cb]) {
    for (let i = 0; i < 2; i++) {
      const p1 = poly[i];
      const p2 = poly[i + 1];
      const ex = p2.x - p1.x;
      const ey = p2.y - p1.y;
      const len = Math.hypot(ex, ey) || 1;
      axes.push({ x: -ey / len, y: ex / len });
    }
  }
  for (const ax of axes) {
    let minA = Infinity, maxA = -Infinity;
    for (const p of ca) {
      const proj = p.x * ax.x + p.y * ax.y;
      if (proj < minA) minA = proj;
      if (proj > maxA) maxA = proj;
    }
    let minB = Infinity, maxB = -Infinity;
    for (const p of cb) {
      const proj = p.x * ax.x + p.y * ax.y;
      if (proj < minB) minB = proj;
      if (proj > maxB) maxB = proj;
    }
    if (maxA <= minB || maxB <= minA) return false;
  }
  return true;
}

// 点是否落在旋转矩形内（用于测试道具压字、以及画布点击命中）
export function pointInBox(px, py, box, extra = 0) {
  const rad = (-box.deg * Math.PI) / 180;
  const dx = px - box.cx;
  const dy = py - box.cy;
  const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
  return Math.abs(lx) <= box.w / 2 + extra && Math.abs(ly) <= box.h / 2 + extra;
}

// 核心求解函数：由 state 推出一切几何、碰撞、留白、示意权重、四柱达标与白话诊单
export function evaluateStage(state) {
  const theme = THEMES[state.theme] || THEMES.circus;
  const tiltBase = TILT_MODES[state.tiltMode] || TILT_MODES.flat;
  const ratio = clamp(Number(state.jumpRatio) || 1.18, 1.0, 5.8);
  const clutter = clamp(Number(state.clutter) || 0, 0, 100);

  // 1. 真实字号阶梯（逻辑像素）
  const noteSize = 15;
  const headlineSize = Math.round(clamp(noteSize * ratio, 17, 94));
  const ribbonSize = Math.round(clamp(noteSize * (1 + (ratio - 1) * 0.28), 16, 28));
  const stampSize = Math.round(clamp(noteSize * (1 + (ratio - 1) * 0.18), 15, 22));
  const actualRatio = +(headlineSize / noteSize).toFixed(2);

  // 2. 五大演出模块的几何盒子（cx, cy, w, h, deg）
  // 注意：当 jumpRatio 拉到极端 > 4.7 时，大标自然膨胀并压向下方蓝缎带与时间票章，形成真实撞车！
  const hlW = clamp(headlineSize * 4.25 + 34, 150, 448);
  const hlH = clamp(headlineSize * 2.18 + 18, 56, 224);
  const hlDeg = clamp(tiltBase.headline + (state.angleDeltas.headline || 0), -34, 34);
  const rbDeg = clamp(tiltBase.ribbon + (state.angleDeltas.ribbon || 0), -34, 34);
  const stDeg = clamp(tiltBase.stamp + (state.angleDeltas.stamp || 0), -34, 34);
  const ntDeg = clamp(tiltBase.note + (state.angleDeltas.note || 0), -34, 34);

  const off = (id) => state.offsets[id] || { dx: 0, dy: 0 };

  const headline = {
    id: "headline",
    label: "主角大标",
    cx: clamp(238 + off("headline").dx, 120, 460),
    cy: clamp(190 + off("headline").dy, 118, 300),
    w: hlW,
    h: hlH,
    deg: hlDeg,
    fontSize: headlineSize,
    textA: theme.headlineA,
    textB: theme.headlineB,
  };

  const ribbon = {
    id: "ribbon",
    label: "卖点蓝缎带",
    cx: clamp(248 + off("ribbon").dx, 130, 460),
    cy: clamp(326 + off("ribbon").dy, 230, 420),
    w: clamp(ribbonSize * 12.6 + 64, 248, 396),
    h: clamp(ribbonSize * 1.9 + 12, 42, 62),
    deg: rbDeg,
    fontSize: ribbonSize,
    text: theme.ribbon,
  };

  const stamp = {
    id: "stamp",
    label: "时间票章",
    cx: clamp(144 + off("stamp").dx, 86, 360),
    cy: clamp(432 + off("stamp").dy, 330, 488),
    w: clamp(stampSize * 8.2 + 24, 148, 206),
    h: clamp(stampSize * 3.1 + 14, 62, 82),
    deg: stDeg,
    fontSize: stampSize,
    top: theme.stampTop,
    sub: theme.stampSub,
  };

  const note = {
    id: "note",
    label: "细目说明",
    cx: clamp(346 + off("note").dx, 220, 470),
    cy: clamp(434 + off("note").dy, 340, 492),
    w: 174,
    h: 56,
    deg: ntDeg,
    fontSize: noteSize,
    text: theme.note,
  };

  // 右侧踩球无五官马戏团长剪影（随主次与比例微调体量）
  const starScale = clamp(0.84 + (ratio - 1.18) * 0.06, 0.84, 1.08);
  const star = {
    id: "star",
    label: "踩球主角",
    cx: clamp(580 + off("star").dx, 480, 646),
    cy: clamp(296 + off("star").dy, 210, 368),
    w: Math.round(146 * starScale),
    h: Math.round(256 * starScale),
    deg: 0,
    scale: starScale,
  };

  const modules = { headline, ribbon, stamp, note, star };
  const moduleList = [headline, ribbon, stamp, note, star];

  // 3. 实测模块间碰撞（特别是大标压住蓝缎带/团长，或用户拖块叠在一起）
  const collisionPairs = [];
  const checkPairs = [
    ["headline", "ribbon"],
    ["headline", "stamp"],
    ["headline", "star"],
    ["ribbon", "stamp"],
    ["ribbon", "note"],
    ["ribbon", "star"],
    ["stamp", "note"],
    ["note", "star"],
  ];
  for (const [aId, bId] of checkPairs) {
    if (obbOverlap(modules[aId], modules[bId], -4)) {
      collisionPairs.push([aId, bId]);
    }
  }

  // 4. 活跃道具层与压字实测
  const propCount = Math.round((clutter / 100) * PROP_SEEDS.length);
  const activeProps = PROP_SEEDS.slice(0, propCount);
  const textBoxes = [headline, ribbon, stamp, note];
  let propsBlockingText = 0;
  const blockedPropIndices = [];
  activeProps.forEach((p, idx) => {
    const hits = textBoxes.some((b) => pointInBox(p.x, p.y, b, p.r * 0.45));
    if (hits) {
      propsBlockingText++;
      blockedPropIndices.push(idx);
    }
  });

  // 5. 网格采样实测暖奶油纸白占比（36×27 = 972 点，每次求解 < 0.08ms）
  const cols = 36;
  const rows = 27;
  let covered = 0;
  const hasRays = clutter >= 20;
  const rayStrength = clutter > 65 ? 0.22 : hasRays ? 0.1 : 0;
  const padChaos = state.focusMode === "chaos" ? 14 : 0;
  for (let iy = 0; iy < rows; iy++) {
    const py = ((iy + 0.5) / rows) * STAGE_H;
    for (let ix = 0; ix < cols; ix++) {
      const px = ((ix + 0.5) / cols) * STAGE_W;
      let hit = false;
      // 顶部大篷边与底部小波浪边
      if (py < 36 || (py > STAGE_H - 34 && (px < 190 || px > 470))) hit = true;
      if (!hit) {
        for (const m of moduleList) {
          if (pointInBox(px, py, m, 2 + padChaos)) {
            hit = true;
            break;
          }
        }
      }
      if (!hit) {
        for (const p of activeProps) {
          if ((px - p.x) ** 2 + (py - p.y) ** 2 <= (p.r + 2) ** 2) {
            hit = true;
            break;
          }
        }
      }
      // 过载背景放射条纹计入视觉覆盖压迫
      if (!hit && rayStrength > 0 && (clutter > 62 ? py < 250 : py < 82)) {
        const ang = Math.atan2(py + 30, px - STAGE_W * 0.54);
        if (Math.floor((ang + Math.PI) / 0.22) % 2 === 0) hit = true;
      }
      if (hit) covered++;
    }
  }
  const whitespacePct = Math.round(((cols * rows - covered) / (cols * rows)) * 100);

  // 6. 示意视觉权重（面积 × 色彩显眼系数，仅作结构强弱示意）
  const colorFactor = (id) => {
    if (state.focusMode === "muted") return id === "headline" ? 0.55 : 0.48;
    if (state.focusMode === "chaos") {
      // 全员挂高饱和实底色块，权重拉平互相抢戏
      return id === "headline" ? 0.88 : id === "star" ? 0.82 : 1.24;
    }
    // spotlight 聚光主次：主标最强，踩球次之，蓝缎带居中承托，票章点睛，说明安静落纸白
    if (id === "headline") return 1.82;
    if (id === "star") return 0.92;
    if (id === "ribbon") return 0.96;
    if (id === "stamp") return 0.72;
    return 0.34;
  };

  const rawWeights = moduleList.map((m) => {
    const areaFactor = Math.pow((m.w * m.h) / 1000, 0.78);
    return { id: m.id, label: m.label, raw: areaFactor * colorFactor(m.id), cx: m.cx, cy: m.cy };
  });
  const sumRaw = rawWeights.reduce((s, x) => s + x.raw, 0) || 1;
  const weights = rawWeights
    .map((x) => ({ ...x, share: Math.round((x.raw / sumRaw) * 100) }))
    .sort((a, b) => b.share - a.share);

  const topItem = weights[0];
  const secondItem = weights[1];
  const leadGap = topItem.share - secondItem.share;
  const headlineShare = weights.find((w) => w.id === "headline")?.share || 0;

  // 7. 原海报四支柱判定（经验参考区间，与读数严格同源）
  // (1) 跳跃 JUMP：字号跳差 2.4×–4.6× 且无撞框
  let jumpStatus = "ok";
  let jumpNote = `${actualRatio.toFixed(1)}× 落差清`;
  if (collisionPairs.length > 0) {
    jumpStatus = "bad";
    jumpNote = `撞框 ${collisionPairs.length} 处`;
  } else if (actualRatio < 2.4) {
    jumpStatus = "bad";
    jumpNote = `${actualRatio.toFixed(1)}× 过平`;
  } else if (actualRatio > 4.6) {
    jumpStatus = "bad";
    jumpNote = `${actualRatio.toFixed(1)}× 过胀`;
  }

  // (2) 夸张 EXAGGERATION：反向倾角互锁（主标与缎带异号，3°–15°）且不过度狂转
  const maxAbsDeg = Math.max(Math.abs(hlDeg), Math.abs(rbDeg), Math.abs(stDeg), Math.abs(ntDeg));
  const minMainDeg = Math.min(Math.abs(hlDeg), Math.abs(rbDeg));
  const oppositeTilt = hlDeg * rbDeg < 0;
  let exagStatus = "ok";
  let exagNote = `${hlDeg > 0 ? "+" : ""}${hlDeg}° / ${rbDeg > 0 ? "+" : ""}${rbDeg}° 互锁`;
  if (maxAbsDeg < 2.5) {
    exagStatus = "bad";
    exagNote = "0° 死直";
  } else if (maxAbsDeg > 17) {
    exagStatus = "bad";
    exagNote = `${Math.round(maxAbsDeg)}° 难读`;
  } else if (!oppositeTilt || minMainDeg < 2.5) {
    exagStatus = "bad";
    exagNote = hlDeg > 0 && rbDeg > 0 ? "同向右溜" : hlDeg < 0 && rbDeg < 0 ? "同向左倒" : "单块偏斜";
  }

  // (3) 节奏 RHYTHM：道具活跃但不压字、奶油纸白落在 36%–68%
  let rhythmStatus = "ok";
  let rhythmNote = `留白 ${whitespacePct}%`;
  if (propsBlockingText > 0 || clutter > 60 || whitespacePct < 36) {
    rhythmStatus = "bad";
    rhythmNote = propsBlockingText > 0 ? `压字 ${propsBlockingText} 处` : `留白仅 ${whitespacePct}%`;
  } else if (clutter < 18 || whitespacePct > 68) {
    rhythmStatus = "bad";
    rhythmNote = `道具 ${clutter}% 过冷`;
  }

  // (4) 吸引 APPEAL：聚光主次、主角鲜明（头号主角占 34%–62%，领先次焦 ≥ 8%，且主角是大标）
  let appealStatus = "ok";
  let appealNote = `主角 ${headlineShare}%（示意）`;
  if (state.focusMode === "muted") {
    appealStatus = "bad";
    appealNote = "无彩冷淡";
  } else if (state.focusMode === "chaos" || leadGap < 8 || topItem.id !== "headline") {
    appealStatus = "bad";
    appealNote = topItem.id !== "headline" ? `${topItem.label}抢戏` : `均势差 ${leadGap}%`;
  }

  const pillars = {
    jump: { ok: jumpStatus === "ok", note: jumpNote },
    exaggeration: { ok: exagStatus === "ok", note: exagNote },
    rhythm: { ok: rhythmStatus === "ok", note: rhythmNote },
    appeal: { ok: appealStatus === "ok", note: appealNote },
  };
  const passCount = Object.values(pillars).filter((p) => p.ok).length;

  // 8. 踩球团长实时摇晃角（翻车时摇摇欲坠，4/4 稳稳平衡张臂）
  let ringmasterLean = 0;
  if (passCount < 4) {
    if (exagStatus === "bad" && hlDeg > 4 && rbDeg > 4) ringmasterLean = 19;
    else if (exagStatus === "bad" && hlDeg < -4 && rbDeg < -4) ringmasterLean = -19;
    else if (maxAbsDeg > 17) ringmasterLean = -24;
    else if (collisionPairs.length > 0) ringmasterLean = 17;
    else if (propsBlockingText > 0) ringmasterLean = -14;
    else if (actualRatio < 2.4) ringmasterLean = 10;
    else ringmasterLean = -11;
  }

  // 9. 最高优先级白话诊断（讲清「观众为什么会这样看」+ 下一步怎么做）
  let verdictTag = "翻车单";
  let verdictTitle = "";
  let verdictBody = "";
  let verdictHint = "";

  if (passCount === 4) {
    verdictTag = "满堂彩";
    verdictTitle = `四柱站稳：${actualRatio.toFixed(1)}× 跳字领跑，留白 ${whitespacePct}% 会呼吸`;
    verdictBody = `观众第一眼直接被大标截停（示意占比 ${headlineShare}%），紧接着沿反向咬合的蓝缎带滑向踩球团长与票价章；${activeProps.length} 枚外缘星点烘托热闹，却一处也没遮挡正文。`;
    verdictHint = "试着把压杆再往右推过头，或把彩屑拖到 80%，看看热闹是如何一秒变凌乱的。";
  } else if (collisionPairs.length > 0) {
    const [aId, bId] = collisionPairs[0];
    verdictTag = "撞框叠字";
    verdictTitle = `${modules[aId].label}压住了${modules[bId].label}，字面挤成一团`;
    verdictBody = `跳跃字号超过安全余量或模块拖得过近，两个信息块叠在一起打架，读者一眼分不清先读哪行，马戏的轻快感立刻变成拥挤感。`;
    verdictHint = actualRatio > 4.6
      ? "把下方「字号跳跃压杆」往左收回 2.8×–4.2× 甜区，或在画布里拖开重叠块。"
      : "直接在画布上把红框报警的模块拉开一点空隙。";
  } else if (actualRatio < 2.4) {
    verdictTag = "平码无跳";
    verdictTitle = `字号落差只有 ${actualRatio.toFixed(1)}×，像一张平淡的楼道通知`;
    verdictBody = `大标（${headlineSize}px）与细目说明（${noteSize}px）几乎一样大，眼睛在画面里找不到非看不可的入口，更谈不上马戏团海报的街头号召力（经验跳差建议 2.4×–4.6×）。`;
    verdictHint = "向右拖动舞台下方的「字号跳跃倍率压杆」，把主标拉到 3.0×–4.2×。";
  } else if (actualRatio > 4.6) {
    verdictTag = "巨字压场";
    verdictTitle = `主标胀到 ${actualRatio.toFixed(1)}×，把副标和说明挤得喘不过气`;
    verdictBody = `对比拉过头以后，整张纸几乎只剩大标呼啸而过，时间地点等关键信息退化得难以辨认，传播只剩半截。`;
    verdictHint = "把「字号跳跃压杆」略往回调回 2.8×–4.2× 经验甜区。";
  } else if (propsBlockingText > 0 || clutter > 60 || whitespacePct < 36) {
    verdictTag = "彩屑淹字";
    verdictTitle = propsBlockingText > 0
      ? `${propsBlockingText} 枚星屑彩球正压在字上，留白跌到 ${whitespacePct}%`
      : `装饰塞得太满，奶油纸白只剩 ${whitespacePct}%`;
    verdictBody = `马戏团版式最容易踩的坑就是把热闹当成塞满。星点、彩球一旦漫进文字腹地，眼睛在底纹和笔画之间来回打滑，整张单子沦为街头牛皮癣。`;
    verdictHint = "把「热闹道具密度」往左收回到 25%–52%，让奶油纸白回到 36%–68%。";
  } else if (exagStatus === "bad") {
    if (maxAbsDeg < 2.5) {
      verdictTag = "死直僵硬";
      verdictTitle = "所有文字块全锁在 0°，横平竖直像财务报表";
      verdictBody = "字号虽然拉开了，但每一块都板板正正水平排开，失去了马戏大篷那种轻快摇摆的动势和舞台张力。";
      verdictHint = "把倾角节拍切到「反向互锁」，让大标左扬、蓝缎带右压彼此咬住。";
    } else if (maxAbsDeg > 17) {
      verdictTag = "狂转难读";
      verdictTitle = `倾角甩到 ${Math.round(maxAbsDeg)}°，读者得歪着脖子认字`;
      verdictBody = "夸张不等于把字拧翻。当倾斜超过约 17° 时，中文方块的识别速度明显下降，活泼感会迅速翻车成阅读阻力。";
      verdictHint = "将倾角切回「反向互锁」，或选中红框块用单块微调拧回 ±12° 内。";
    } else {
      verdictTag = "同向滑坡";
      verdictTitle = "主标和蓝缎带朝同一侧歪倒，重心往一边滑出画面";
      verdictBody = "马戏团的倾斜靠一左一右的力矩互锁站稳。几大块集体往同一个方向倾斜，就像没绑稳的舞台布景，随时要溜出画框。";
      verdictHint = "把倾角节拍切到「反向互锁」（如主标 -7°、蓝缎带 +5°），稳住左右张力。";
    }
  } else if (appealStatus === "bad") {
    if (state.focusMode === "muted") {
      verdictTag = "失色冷淡";
      verdictTitle = "抽干红蓝黄原色后，马戏大篷变成了冷淡灰稿";
      verdictBody = "马戏团版式天生服务于三米外截停路人的欢腾场景。全灰素纸虽然克制，却卸掉了最直接的情绪感染力。";
      verdictHint = "把聚光主次切回「聚光主次」，让红黑大标与深蓝燕尾缎带重新亮起来。";
    } else {
      verdictTag = "全员抢戏";
      verdictTitle = "五块全都挂满高饱和色块，像五个人拿着喇叭同时喊";
      verdictBody = `主标（示意 ${headlineShare}%）与次要信息势均力敌（前两名仅差 ${leadGap}%），当每个元素都想当主角时，结果就是谁也不是主角。`;
      verdictHint = "把色彩分配切到「聚光主次」，让大标独占头号焦点，细目说明退回干净奶油纸。";
    }
  } else {
    verdictTag = "过于冷清";
    verdictTitle = `装饰道具只剩 ${clutter}%，画面太素少了嘉年华拍子`;
    verdictBody = `纸白留到 ${whitespacePct}%，版面虽然干净，但缺少外缘星点与彩旗串的强弱节拍，看起来更像普通的纯文字大标题海报。`;
    verdictHint = "把「热闹道具密度」往右推到 28%–52%，在四周空白处点出欢腾节奏。";
  }

  return {
    theme,
    ratio: actualRatio,
    clutter,
    modules,
    moduleList,
    collisionPairs,
    activeProps,
    blockedPropIndices,
    propsBlockingText,
    whitespacePct,
    weights,
    leadGap,
    headlineShare,
    pillars,
    passCount,
    ringmasterLean,
    verdict: {
      tag: verdictTag,
      title: verdictTitle,
      body: verdictBody,
      hint: verdictHint,
    },
  };
}

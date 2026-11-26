// 044 菱形构图 · 单一真源几何模型
// 所有实绘顶点坐标、四边实测长度差、纵横轴比、安全裁切、焦点偏距、四项原海报指标、
// 四步构建状态与白话诊单均由此模块单源核算，画布渲染与界面读数共用同一份结果。

export const SCENES = [
  {
    id: "mountain",
    label: "雪山原海报",
    short: "雪山",
    en: "ALPINE PEAK",
    desc: "暮紫雪峰立于菱心，云海与天光沿四条斜边向峰顶收拢。",
  },
  {
    id: "gem",
    label: "宝石切面",
    short: "宝石",
    en: "FACETED GEM",
    desc: "对称刻面放大折光焦点，适合珠宝、香水与徽章主视觉。",
  },
  {
    id: "stage",
    label: "舞台剪影",
    short: "舞台",
    en: "STAGE POISE",
    desc: "独舞剪影与上下束光构成隐性菱轴，凸显仪式感与张力。",
  },
  {
    id: "dome",
    label: "建筑穹顶",
    short: "穹顶",
    en: "GLASS DOME",
    desc: "仰拍对称菱格采光顶，借斜向结构肋把目光拉向天顶中心。",
  },
];

// 开场刻意停在 0/4 复合错态：16° 歪框 + 0.58 压扁 + 24% 顶点偏斜不等边 + 核心脱靶 + 四角抢戏
export const INITIAL_STATE = {
  scene: "mountain",
  rot: 16,        // 0°=正放方框, 45°=标准立菱, 90°=正放方框
  aspect: 0.58,   // 纵横轴比 H/W (0.48..1.76)
  skew: 0.24,     // 顶点对称偏斜 (-0.36..+0.36)
  scale: 0.78,    // 菱形尺度 (0.42..1.04)
  focusX: 0.20,   // 视觉核心相对中心横向偏移 (-0.34..+0.34)
  focusY: -0.15,  // 视觉核心相对中心纵向偏移 (-0.34..+0.34)
  clutter: true,  // 四角高对比干扰物开关
  showFlow: true, // 实时向心汇聚光流开关
};

export const PRESETS = {
  poster: {
    label: "原海报立菱解",
    kind: "good",
    patch: { rot: 45, aspect: 1.24, skew: 0, scale: 0.80, focusX: 0, focusY: 0, clutter: false },
  },
  square: {
    label: "等边正菱解",
    kind: "good",
    patch: { rot: 45, aspect: 1.00, skew: 0, scale: 0.78, focusX: 0, focusY: 0, clutter: false },
  },
  wide: {
    label: "宽境展翼解",
    kind: "good",
    patch: { rot: 45, aspect: 0.78, skew: 0, scale: 0.80, focusX: 0, focusY: 0, clutter: false },
  },
  flatSquare: {
    label: "试错：躺平正方",
    kind: "bad",
    patch: { rot: 0, aspect: 1.00, skew: 0, scale: 0.78, focusX: 0, focusY: 0, clutter: false },
  },
  needle: {
    label: "试错：过尖刺针",
    kind: "bad",
    patch: { rot: 45, aspect: 1.72, skew: 0, scale: 0.84, focusX: 0, focusY: 0, clutter: false },
  },
  clipped: {
    label: "试错：破框切角",
    kind: "bad",
    patch: { rot: 45, aspect: 1.22, skew: 0, scale: 1.02, focusX: 0, focusY: 0, clutter: false },
  },
  broken: {
    label: "复原开场错态",
    kind: "reset",
    patch: { ...INITIAL_STATE },
  },
};

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function normalizeState(raw) {
  return {
    scene: SCENES.some((s) => s.id === raw.scene) ? raw.scene : "mountain",
    rot: clamp(Number(raw.rot ?? INITIAL_STATE.rot), 0, 90),
    aspect: clamp(Number(raw.aspect ?? INITIAL_STATE.aspect), 0.48, 1.76),
    skew: clamp(Number(raw.skew ?? INITIAL_STATE.skew), -0.36, 0.36),
    scale: clamp(Number(raw.scale ?? INITIAL_STATE.scale), 0.42, 1.04),
    focusX: clamp(Number(raw.focusX ?? INITIAL_STATE.focusX), -0.34, 0.34),
    focusY: clamp(Number(raw.focusY ?? INITIAL_STATE.focusY), -0.34, 0.34),
    clutter: Boolean(raw.clutter),
    showFlow: raw.showFlow !== false,
  };
}

// 计算规范化坐标 [-1, 1] 下的四个实绘顶点 [T, R, B, L] 与核心位置
export function computeGeometry(state) {
  const s = normalizeState(state);
  const rx = s.scale * 0.77 / Math.pow(s.aspect, 0.45);
  const ry = s.scale * 0.77 * Math.pow(s.aspect, 0.55);

  // 未旋转前的四顶点：skew = 0 时严格对称、四边严格等长
  const rawVerts = [
    { id: "T", x: s.skew * rx * 1.15, y: -ry },
    { id: "R", x: rx, y: s.skew * ry * 0.42 },
    { id: "B", x: -s.skew * rx * 0.42, y: ry },
    { id: "L", x: -rx, y: -s.skew * ry * 0.20 },
  ];

  // rot = 45° 时旋转角 delta = 0°（正立菱形）；rot = 0° 时 delta = -45°（水平垂直正放方框）
  const deltaRad = ((s.rot - 45) * Math.PI) / 180;
  const c = Math.cos(deltaRad);
  const sn = Math.sin(deltaRad);

  const verts = rawVerts.map((v) => ({
    id: v.id,
    x: v.x * c - v.y * sn,
    y: v.x * sn + v.y * c,
  }));

  const edges = [];
  for (let i = 0; i < 4; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % 4];
    edges.push(Math.hypot(b.x - a.x, b.y - a.y));
  }
  const meanEdge = edges.reduce((acc, v) => acc + v, 0) / 4;
  const maxEdge = Math.max(...edges);
  const minEdge = Math.min(...edges);
  const edgeSpreadPct = meanEdge > 0 ? ((maxEdge - minEdge) / meanEdge) * 100 : 0;

  // 多边形面积（鞋带公式）与占画幅比例
  let area2 = 0;
  for (let i = 0; i < 4; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % 4];
    area2 += a.x * b.y - b.x * a.y;
  }
  const polyArea = Math.abs(area2) * 0.5;
  // 画幅有效矩形按 [-0.88, 0.88]^2 计
  const frameArea = 1.76 * 1.76;
  const fillRatioPct = clamp((polyArea / frameArea) * 100, 4, 96);
  const cornerRoomPct = clamp(100 - fillRatioPct, 4, 96);

  // 安全画框边界 [-0.87, 0.87]
  const maxExtent = Math.max(...verts.map((v) => Math.max(Math.abs(v.x), Math.abs(v.y))));
  const clipped = maxExtent > 0.875;
  const tooSmall = s.scale < 0.54;

  // 实测两条对角线交点（当四边对称时为 (0,0)）
  const diagCenter = intersectLines(verts[0], verts[2], verts[1], verts[3]) || { x: 0, y: 0 };
  const focus = { x: s.focusX, y: s.focusY };
  const focusDist = Math.hypot(focus.x - diagCenter.x, focus.y - diagCenter.y);

  // 斜边与水平轴夹角（取第一条边，0°/90° 为平直边，35°–58° 为高能斜边）
  const axisAngleErr = Math.abs(((s.rot % 90) + 90) % 90 - 45);
  const topEdgeAngle = Math.abs((Math.atan2(verts[1].y - verts[0].y, verts[1].x - verts[0].x) * 180) / Math.PI);
  const slopeDeg = Math.round(topEdgeAngle > 90 ? 180 - topEdgeAngle : topEdgeAngle);

  return {
    state: s,
    rx,
    ry,
    verts,
    edges,
    meanEdge,
    edgeSpreadPct,
    polyArea,
    fillRatioPct,
    cornerRoomPct,
    maxExtent,
    clipped,
    tooSmall,
    diagCenter,
    focus,
    focusDist,
    axisAngleErr,
    slopeDeg,
  };
}

function intersectLines(p1, p2, p3, p4) {
  const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(denom) < 1e-6) return null;
  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
  return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
}

// 统一诊断模型：输出四项指标、四步状态、错态分类、白话诊单与单步纠偏建议
export function evaluate(rawState) {
  const g = computeGeometry(rawState);
  const s = g.state;

  const angleOk = g.axisAngleErr <= 7.5;
  const flatSquare = g.axisAngleErr >= 34;
  const skewOk = g.edgeSpreadPct <= 8.5;
  const aspectFlat = s.aspect < 0.70;
  const aspectNeedle = s.aspect > 1.56;
  const aspectOk = !aspectFlat && !aspectNeedle;
  const scaleOk = !g.clipped && !g.tooSmall;
  const focusOk = g.focusDist <= 0.095;
  const cornerOk = !s.clutter;

  // 四项原海报核心原则（与四周四条细弧引注一一对应）
  const pillars = {
    convergence: {
      id: "convergence",
      zh: "向内汇聚",
      en: "CONVERGENCE",
      ok: angleOk && cornerOk && focusOk,
      tag: !angleOk
        ? (flatSquare ? "平框无汇聚" : `偏斜 ${Math.round(g.axisAngleErr)}°`)
        : !cornerOk
          ? "四角外泄"
          : !focusOk
            ? "交点落空"
            : "四向聚心",
    },
    diagonal: {
      id: "diagonal",
      zh: "斜向引导",
      en: "DIAGONAL",
      ok: angleOk && aspectOk && scaleOk,
      tag: !angleOk
        ? `斜角 ${g.slopeDeg}° 失势`
        : g.clipped
          ? "顶点切框"
          : g.tooSmall
            ? "画幅过小"
            : aspectFlat
              ? `扁菱 ${s.aspect.toFixed(2)}:1`
              : aspectNeedle
                ? `尖针 ${s.aspect.toFixed(2)}:1`
                : `斜率 ${g.slopeDeg}° 得法`,
    },
    balance: {
      id: "balance",
      zh: "稳定平衡",
      en: "BALANCE",
      ok: angleOk && skewOk && aspectOk,
      tag: !skewOk
        ? `边差 ${Math.round(g.edgeSpreadPct)}%`
        : !angleOk
          ? "轴线未正"
          : !aspectOk
            ? `轴比 ${s.aspect.toFixed(2)}:1`
            : `等边差 ${Math.round(g.edgeSpreadPct)}%`,
    },
    focus: {
      id: "focus",
      zh: "集中焦点",
      en: "FOCUS",
      ok: focusOk && cornerOk,
      tag: !focusOk
        ? `偏心 ${Math.round(g.focusDist * 100)}%`
        : !cornerOk
          ? "角标抢戏"
          : "正落腹心",
    },
  };

  const passed = Object.values(pillars).filter((p) => p.ok).length;

  // 原海报四步构建状态
  const steps = [
    {
      num: 1,
      title: "设定菱形框架",
      done: angleOk && skewOk && scaleOk,
      fix: { rot: 45, skew: 0, scale: clamp(s.scale, 0.72, 0.84) },
    },
    {
      num: 2,
      title: "布置对角线",
      done: angleOk && aspectOk,
      fix: { rot: 45, aspect: clamp(s.aspect, 0.96, 1.24) },
    },
    {
      num: 3,
      title: "放置视觉核心",
      done: focusOk,
      fix: { focusX: 0, focusY: 0 },
    },
    {
      num: 4,
      title: "完善与强化",
      done: cornerOk && scaleOk && passed === 4,
      fix: { clutter: false, scale: clamp(s.scale, 0.76, 0.84) },
    },
  ];

  // 汇聚效能（明标示意，避免假精确）
  let est = 100;
  est -= Math.min(46, g.axisAngleErr * 1.1);
  est -= Math.min(26, g.edgeSpreadPct * 0.9);
  if (aspectFlat) est -= (0.70 - s.aspect) * 85;
  if (aspectNeedle) est -= (s.aspect - 1.56) * 70;
  if (g.clipped) est -= 20;
  if (g.tooSmall) est -= 18;
  est -= Math.min(28, g.focusDist * 115);
  if (s.clutter) est -= 22;
  const convergenceEst = Math.round(clamp(est, 8, 98));
  const convergenceBand =
    passed === 4 ? "强汇聚（示意）" : convergenceEst >= 62 ? "半聚偏散（示意）" : "散焦失稳（示意）";

  // 诊断优先级：先纠角、再纠等边、再纠轴比/裁边、再纠核心与四角
  let code = "pass";
  let statusBadge = "4/4 · 立菱聚心";
  let headline = "";
  let body = "";
  let hint = "";
  let fixLabel = "";
  let fixPatch = null;

  if (flatSquare) {
    code = "flat-square";
    statusBadge = `${passed}/4 · 退化方框`;
    headline = `旋角停在 ${Math.round(s.rot)}°，四边躺平成了静态方框`;
    body = "四条边贴着水平与垂直轴时，眼睛只在平直边框里打转，失去了斜线往腹心推压的动势——这已经落进 045 方形构图，而非菱形构图。";
    hint = "直接在画布开放区横向拖动，把分度环转到 45° 立菱刻度。";
    fixLabel = "旋至 45° 立菱";
    fixPatch = { rot: 45 };
  } else if (!angleOk) {
    code = "crooked-tilt";
    statusBadge = `${passed}/4 · 歪菱倾倒`;
    headline = `画框停在 ${Math.round(s.rot)}° 半歪角，偏离立菱 ${Math.round(g.axisAngleErr)}°`;
    body = "既没有 0° 方框的横平竖直，又没转足 45° 让上下顶点对齐竖轴。眼睛一进画面先觉得整幅图挂歪了，四条斜边根本汇不到一个稳点。";
    hint = "向右横拖画布，让上下两枚深靛紫顶点竖直对齐到 45°。";
    fixLabel = "摆正 45° 立菱";
    fixPatch = { rot: 45 };
  } else if (!skewOk) {
    code = "skew-uneven";
    statusBadge = `${passed}/4 · 四边不等`;
    headline = `四条边长相差 ${Math.round(g.edgeSpreadPct)}%，立菱歪成了偏心斜筝`;
    body = "菱形之所以能在单点站立时依旧显得庄重，全靠左右与上下四条边长度一致。现在顶点偏斜，两侧拉力一重一轻，视线顺着长边滑走。";
    hint = "拖动顶部或底部靛紫圆锚归中，或把「顶点偏斜」调回 0%。";
    fixLabel = "归正四边等长";
    fixPatch = { skew: 0 };
  } else if (g.clipped) {
    code = "clip-edge";
    statusBadge = `${passed}/4 · 破框切角`;
    headline = "菱形放得过大，尖角已被画幅硬切";
    body = "四个顶点被裁出画框外，闭合的菱形瞬间断成四条孤立斜杠。观者看不到汇聚的起点，四角原本该留出的呼吸空间也全被挤死。";
    hint = "把菱形尺度收回到 74%–84%，让四枚圆锚与呼吸留白完整露在框内。";
    fixLabel = "收回安全画幅";
    fixPatch = { scale: 0.80 };
  } else if (g.tooSmall) {
    code = "too-tiny";
    statusBadge = `${passed}/4 · 缩菱失势`;
    headline = `菱形仅占画幅 ${Math.round(g.fillRatioPct)}%，拉不动满屏视线`;
    body = "外框缩得太小，四周空荡荡的白边反客为主，四条斜边太短、视觉推力微弱，像一枚孤零零贴在白纸上的小邮票。";
    hint = "往外拉大任一顶点圆锚，或把尺度拉到 76%–84%。";
    fixLabel = "放大至充盈尺度";
    fixPatch = { scale: 0.80 };
  } else if (aspectFlat) {
    code = "aspect-flat";
    statusBadge = `${passed}/4 · 压扁失势`;
    headline = `纵横轴比仅 ${s.aspect.toFixed(2)}:1，菱形被压成了扁缝`;
    body = "上下距离太窄、斜边过于平缓，视线左右横滑却聚不拢，居中主体像被两块倾斜天花板硬生生夹扁。";
    hint = "向上拉高顶部圆锚，或把纵横轴比调到 0.78–1.40 之间。";
    fixLabel = "拉高纵横轴比";
    fixPatch = { aspect: 1.24 };
  } else if (aspectNeedle) {
    code = "aspect-needle";
    statusBadge = `${passed}/4 · 过尖刺针`;
    headline = `纵横轴比高达 ${s.aspect.toFixed(2)}:1，菱形拉成了细尖针`;
    body = "左右两翼挤得太窄，中间塞不下完整主体，左右外侧却露出两片巨大的空三角，画面显得急促尖锐而非稳重聚焦。";
    hint = "向外拉宽左右圆锚，把纵横轴比收回到 0.78–1.40。";
    fixLabel = "舒展菱形两翼";
    fixPatch = { aspect: 1.20 };
  } else if (!focusOk) {
    code = "focus-off";
    statusBadge = `${passed}/4 · 核心脱靶`;
    headline = `视觉核心偏离对角交点 ${Math.round(g.focusDist * 100)}%，汇聚落空`;
    body = "四条斜边与四支玫红内指箭拼命把眼睛往正中推送，可真正的主角却歪在一旁顶着斜边，观者视线撞墙反弹，中心反而空了一块。";
    hint = "直接拖动菱形中央的玫红「视觉核心」标，吸回两条虚对角线的交点。";
    fixLabel = "焦点归回腹心";
    fixPatch = { focusX: 0, focusY: 0 };
  } else if (!cornerOk) {
    code = "corner-clutter";
    statusBadge = `${passed}/4 · 四角抢戏`;
    headline = "四角高对比杂物正在把视线往外扯散";
    body = "菱形外框本身已经立稳，但外侧四个三角角落塞满抢眼贴标，把原本应该向内汇聚的目光硬生生分流到边角，中心存在感大打折扣。";
    hint = "直接点击画布四角的干扰标牌清除，或关闭「四角杂物」。";
    fixLabel = "清空四角干扰";
    fixPatch = { clutter: false };
  } else {
    // 全部 4/4 达标：区分多种合法解
    const variant =
      s.aspect >= 1.12
        ? {
            badge: "4/4 · 经典立菱解",
            head: `高挑立菱（${s.aspect.toFixed(2)}:1）成立，四边把目光锁死在腹心`,
            desc: "与 044 原海报同一路数：45° 对称立菱让四边等长、上下挺拔，外侧留出约 " +
              `${Math.round(g.cornerRoomPct)}% 净角呼吸，所有斜向势能精准交汇于主体正中。`,
          }
        : s.aspect >= 0.90
          ? {
              badge: "4/4 · 等边正菱解",
              head: `正方转角 45° 正菱（${s.aspect.toFixed(2)}:1）成立，四向拉力均衡`,
              desc: "四条边与水平轴严守 45° 夹角，像一枚对称切割的宝石切面：兼具动态斜线与绝对均衡，适合唱片封面、徽章与单品主视觉。",
            }
          : {
              badge: "4/4 · 宽境展翼解",
              head: `宽幅展翼菱（${s.aspect.toFixed(2)}:1）成立，横屏舒展且不散焦`,
              desc: "在保留四边等长与 45° 轴对称的前提下放宽横翼，既适配横向版面与包装展陈，又稳稳把视觉重心托在腹心。",
            };
    code = "pass";
    statusBadge = variant.badge;
    headline = variant.head;
    body = variant.desc;
    hint = "试试拖顶点改轴比、或点「试错」看躺平/尖针/切角如何瞬间破功。";
    fixLabel = "再试宽境展翼解";
    fixPatch = s.aspect >= 0.95 ? PRESETS.wide.patch : PRESETS.poster.patch;
  }

  return {
    geom: g,
    pillars,
    passed,
    steps,
    convergenceEst,
    convergenceBand,
    diagnosis: {
      code,
      statusBadge,
      headline,
      body,
      hint,
      fixLabel,
      fixPatch,
    },
  };
}

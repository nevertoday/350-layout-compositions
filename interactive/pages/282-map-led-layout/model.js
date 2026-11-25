// 282 地图主导布局 · 单真源几何模型与全页数据
// 画布渲染、读数诊断、图层卡状态与练习判据全部共用这份状态与几何计算。

export const PALETTE = {
  paper: "#FCF5E8",
  paperCard: "#FEFDF9",
  paperTray: "#F5EFE1",
  mist: "#EEF6F2",
  sand: "#F6EFE0",
  ink: "#063329",
  inkBody: "#16302B",
  inkMuted: "#435E58",
  teal: "#08756E",
  tealDeep: "#065E58",
  tealBadge: "#0A453A",
  mintCircle: "#BFDED4",
  sea: "#A0D7CF",
  seaWave: "#DFF4F0",
  sage: "#D6DFC2",
  wetland: "#DBE3CA",
  citySand: "#F4E7CF",
  stone: "#E2DAD5",
  nightBg: "#08241E",
  nightCard: "#0F352D",
  error: "#C0322B",
  errorSoft: "#FCE8E6",
  errorDark: "#FF857A",
  pass: "#0B6B56",
  passSoft: "#E1F4EE",
  passDark: "#5CE0BD",
  amber: "#E59500",
  amberInk: "#855000",
};

// 海湾半岛统一归一化地形多边形（0..1，直接复刻 282 原海报斜角海岸格局）
export const TERRAIN = {
  // 外框斜切地形剪裁轮廓（让地图保持原海报的立体岛岸呼吸留白）
  clipPoly: [
    [0.14, 0.24], [0.58, 0.08], [0.74, 0.08], [0.91, 0.22],
    [0.92, 0.56], [0.89, 0.78], [0.76, 0.90], [0.58, 0.91],
    [0.34, 0.84], [0.11, 0.66], [0.10, 0.44],
  ],
  // 左侧滨海湾水域多边形（用于实时判断主锚点是否拖进海里）
  seaPoly: [
    [0.08, 0.20], [0.58, 0.06], [0.54, 0.22], [0.55, 0.31],
    [0.45, 0.37], [0.47, 0.46], [0.39, 0.50], [0.33, 0.56],
    [0.24, 0.56], [0.11, 0.55], [0.08, 0.36],
  ],
  // 四大功能陆地区域多边形
  zones: [
    {
      id: "north",
      name: "北山生态",
      posterFill: "#D6DFC2",
      minimalFill: "#D6DFC2",
      monoFill: "#DFDFDC",
      rainbowFill: "#32D74B",
      poly: [
        [0.54, 0.08], [0.74, 0.08], [0.91, 0.22], [0.91, 0.37],
        [0.64, 0.38], [0.52, 0.35], [0.54, 0.22],
      ],
    },
    {
      id: "city",
      name: "核心城区",
      posterFill: "#F4E7CF",
      minimalFill: "#F4E7CF",
      monoFill: "#E4E4E0",
      rainbowFill: "#FF9F0A",
      poly: [
        [0.45, 0.37], [0.64, 0.38], [0.91, 0.37], [0.92, 0.56],
        [0.68, 0.60], [0.51, 0.56], [0.47, 0.46],
      ],
    },
    {
      id: "west",
      name: "西部产业",
      posterFill: "#E2DAD5",
      minimalFill: "#F4E7CF",
      monoFill: "#D9D9D6",
      rainbowFill: "#BF5AF2",
      poly: [
        [0.11, 0.55], [0.33, 0.56], [0.47, 0.46], [0.51, 0.56],
        [0.47, 0.87], [0.34, 0.84], [0.11, 0.66],
      ],
    },
    {
      id: "south",
      name: "南岸湿地",
      posterFill: "#DBE3CA",
      minimalFill: "#D6DFC2",
      monoFill: "#E0E0DC",
      rainbowFill: "#FF375F",
      poly: [
        [0.51, 0.56], [0.68, 0.60], [0.92, 0.56], [0.89, 0.78],
        [0.76, 0.90], [0.58, 0.91], [0.47, 0.87],
      ],
    },
  ],
  // 7 色过载时叠加的三块刺眼分割补丁，使色区数实打实达到 7 种
  rainbowPatches: [
    { fill: "#FF2D55", poly: [[0.55, 0.16], [0.76, 0.15], [0.72, 0.28], [0.55, 0.27]] },
    { fill: "#0A84FF", poly: [[0.22, 0.57], [0.44, 0.55], [0.41, 0.72], [0.20, 0.68]] },
    { fill: "#FFD60A", poly: [[0.62, 0.42], [0.86, 0.40], [0.85, 0.54], [0.63, 0.55]] },
  ],
  // 蜿蜒入海湿地溪流
  river: [
    [0.90, 0.59], [0.77, 0.62], [0.68, 0.66], [0.63, 0.73],
    [0.64, 0.82], [0.69, 0.90],
  ],
  // 浅海波纹线位
  waves: [
    [0.24, 0.30], [0.40, 0.25], [0.20, 0.43], [0.35, 0.46],
  ],
  // 针叶林点位
  trees: [
    [0.61, 0.18], [0.64, 0.22], [0.78, 0.29], [0.83, 0.32],
    [0.75, 0.34], [0.55, 0.76], [0.58, 0.79], [0.78, 0.75],
  ],
  // 帆船坐标
  boat: [0.27, 0.48],
};

// 3 套真实应用场景（共用同一地形骨架，切换图标/文案/语义，证明规则跨产品成立）
export const SCENARIOS = {
  coastal: {
    id: "coastal",
    label: "原海报 · 滨海新城",
    shortLabel: "滨海新城",
    scaleText: "1:25,000",
    coordText: "N 31°14' · E 121°29'",
    hubName: "中心枢纽",
    hubSub: "主锚点 · 全城交汇",
    nodes: [
      {
        id: "coast",
        name: "滨海码头",
        tag: "COAST",
        anchorLabel: "ANCHOR: CONNECT",
        desc: "交通枢纽，连接海上航线与城市岸线。",
        icon: "anchor",
        color: "#028E93",
        tagBg: "#D7F1F0",
        tagInk: "#056065",
        pin: { u: 0.38, v: 0.41 },
        cleanCard: { u: 0.25, v: 0.27 },
        brokenCard: { u: 0.56, v: 0.85 }, // 甩到底部中偏右造成跨图远跳且不压邻卡
        cleanCtrl: { u: 0.45, v: 0.43 },
        brokenCtrl: { u: 0.34, v: 0.68 }, // 向南大绕造成交叉
      },
      {
        id: "north",
        name: "山地公园",
        tag: "NORTH",
        anchorLabel: "ANCHOR: NATURE",
        desc: "生态景观区，适合徒步与自然体验。",
        icon: "mountain",
        color: "#49763F",
        tagBg: "#E2ECD9",
        tagInk: "#34592C",
        pin: { u: 0.66, v: 0.21 },
        cleanCard: { u: 0.81, v: 0.19 },
        brokenCard: { u: 0.81, v: 0.19 },
        cleanCtrl: { u: 0.59, v: 0.33 },
        brokenCtrl: { u: 0.79, v: 0.49 }, // 向东下弯切过城区线
      },
      {
        id: "city",
        name: "城市中心",
        tag: "CITY",
        anchorLabel: "ANCHOR: ACTIVITY",
        desc: "核心功能区，商业、文化与服务聚集地。",
        icon: "city",
        color: "#E59500",
        tagBg: "#FBECC7",
        tagInk: "#855000",
        pin: { u: 0.71, v: 0.48 },
        cleanCard: { u: 0.84, v: 0.43 },
        brokenCard: { u: 0.23, v: 0.23 }, // 甩到左上角海面造成远跳
        cleanCtrl: { u: 0.62, v: 0.50 },
        brokenCtrl: { u: 0.61, v: 0.30 }, // 向上隆起与北山线交叉
      },
      {
        id: "south",
        name: "生态湿地",
        tag: "SOUTH",
        anchorLabel: "ANCHOR: ECOLOGY",
        desc: "生态保育区，维持水系与生物多样性。",
        icon: "leaf",
        color: "#4C7941",
        tagBg: "#E3EEDB",
        tagInk: "#33582B",
        pin: { u: 0.66, v: 0.73 },
        cleanCard: { u: 0.81, v: 0.70 },
        brokenCard: { u: 0.81, v: 0.70 },
        cleanCtrl: { u: 0.58, v: 0.66 },
        brokenCtrl: { u: 0.35, v: 0.65 }, // 向西甩与产业园线交叉
      },
      {
        id: "west",
        name: "产业园区",
        tag: "WEST",
        anchorLabel: "ANCHOR: INDUSTRY",
        desc: "产业集聚区，支撑制造与创新发展。",
        icon: "factory",
        color: "#5A5466",
        tagBg: "#E8E4EC",
        tagInk: "#433E4D",
        pin: { u: 0.30, v: 0.62 },
        cleanCard: { u: 0.26, v: 0.78 },
        brokenCard: { u: 0.26, v: 0.78 },
        cleanCtrl: { u: 0.41, v: 0.58 },
        brokenCtrl: { u: 0.44, v: 0.44 }, // 向上抬与码头线交叉
      },
    ],
  },
  citystay: {
    id: "citystay",
    label: "城市找房 · 地图筛选",
    shortLabel: "地图找房",
    scaleText: "1:12,000",
    coordText: "N 31°12' · E 121°27'",
    hubName: "地铁换乘站",
    hubSub: "主锚点 · 通勤圆心",
    nodes: [
      {
        id: "coast",
        name: "江景公寓 ¥520",
        tag: "RIVER",
        anchorLabel: "WALK 8 MIN",
        desc: "临江露台房，步行 8 分钟到渡口。",
        icon: "anchor",
        color: "#028E93",
        tagBg: "#D7F1F0",
        tagInk: "#056065",
        pin: { u: 0.38, v: 0.41 },
        cleanCard: { u: 0.25, v: 0.27 },
        brokenCard: { u: 0.56, v: 0.85 },
        cleanCtrl: { u: 0.45, v: 0.43 },
        brokenCtrl: { u: 0.34, v: 0.68 },
      },
      {
        id: "north",
        name: "山麓民宿 ¥390",
        tag: "HILL",
        anchorLabel: "QUIET 4.9★",
        desc: "靠北坡绿道，安静通风适合长住。",
        icon: "mountain",
        color: "#49763F",
        tagBg: "#E2ECD9",
        tagInk: "#34592C",
        pin: { u: 0.66, v: 0.21 },
        cleanCard: { u: 0.81, v: 0.19 },
        brokenCard: { u: 0.81, v: 0.19 },
        cleanCtrl: { u: 0.59, v: 0.33 },
        brokenCtrl: { u: 0.79, v: 0.49 },
      },
      {
        id: "city",
        name: "商圈loft ¥640",
        tag: "CBD",
        anchorLabel: "SUBWAY 3 MIN",
        desc: "楼下餐饮咖啡密集，夜归方便。",
        icon: "city",
        color: "#E59500",
        tagBg: "#FBECC7",
        tagInk: "#855000",
        pin: { u: 0.71, v: 0.48 },
        cleanCard: { u: 0.84, v: 0.43 },
        brokenCard: { u: 0.23, v: 0.23 },
        cleanCtrl: { u: 0.62, v: 0.50 },
        brokenCtrl: { u: 0.61, v: 0.30 },
      },
      {
        id: "south",
        name: "湿地木屋 ¥460",
        tag: "PARK",
        anchorLabel: "FAMILY FIT",
        desc: "近南岸公园与水道，亲子首选。",
        icon: "leaf",
        color: "#4C7941",
        tagBg: "#E3EEDB",
        tagInk: "#33582B",
        pin: { u: 0.66, v: 0.73 },
        cleanCard: { u: 0.81, v: 0.70 },
        brokenCard: { u: 0.81, v: 0.70 },
        cleanCtrl: { u: 0.58, v: 0.66 },
        brokenCtrl: { u: 0.35, v: 0.65 },
      },
      {
        id: "west",
        name: "创客公寓 ¥330",
        tag: "TECH",
        anchorLabel: "BUS DIRECT",
        desc: "紧邻西区办公园，通勤性价比高。",
        icon: "factory",
        color: "#5A5466",
        tagBg: "#E8E4EC",
        tagInk: "#433E4D",
        pin: { u: 0.30, v: 0.62 },
        cleanCard: { u: 0.26, v: 0.78 },
        brokenCard: { u: 0.26, v: 0.78 },
        cleanCtrl: { u: 0.41, v: 0.58 },
        brokenCtrl: { u: 0.44, v: 0.44 },
      },
    ],
  },
  park: {
    id: "park",
    label: "国家公园 · 徒步导览",
    shortLabel: "徒步导览",
    scaleText: "1:50,000",
    coordText: "N 30°08' · E 118°10'",
    hubName: "游客中心",
    hubSub: "主锚点 · 补给起点",
    nodes: [
      {
        id: "coast",
        name: "观潮灯塔",
        tag: "SHORE",
        anchorLabel: "TRAIL 1.4 KM",
        desc: "木栈道尽头看日落，风大注意保暖。",
        icon: "anchor",
        color: "#028E93",
        tagBg: "#D7F1F0",
        tagInk: "#056065",
        pin: { u: 0.38, v: 0.41 },
        cleanCard: { u: 0.25, v: 0.27 },
        brokenCard: { u: 0.56, v: 0.85 },
        cleanCtrl: { u: 0.45, v: 0.43 },
        brokenCtrl: { u: 0.34, v: 0.68 },
      },
      {
        id: "north",
        name: "云杉观景台",
        tag: "PEAK",
        anchorLabel: "ELEV 680 M",
        desc: "北坡缓升步道，可俯瞰整片海湾。",
        icon: "mountain",
        color: "#49763F",
        tagBg: "#E2ECD9",
        tagInk: "#34592C",
        pin: { u: 0.66, v: 0.21 },
        cleanCard: { u: 0.81, v: 0.19 },
        brokenCard: { u: 0.81, v: 0.19 },
        cleanCtrl: { u: 0.59, v: 0.33 },
        brokenCtrl: { u: 0.79, v: 0.49 },
      },
      {
        id: "city",
        name: "林间营地",
        tag: "CAMP",
        anchorLabel: "WATER + REST",
        desc: "平缓草坪露营与饮水补给点。",
        icon: "city",
        color: "#E59500",
        tagBg: "#FBECC7",
        tagInk: "#855000",
        pin: { u: 0.71, v: 0.48 },
        cleanCard: { u: 0.84, v: 0.43 },
        brokenCard: { u: 0.23, v: 0.23 },
        cleanCtrl: { u: 0.62, v: 0.50 },
        brokenCtrl: { u: 0.61, v: 0.30 },
      },
      {
        id: "south",
        name: "白鹭木桥",
        tag: "MARSH",
        anchorLabel: "BIRD WATCH",
        desc: "南岸湿地观鸟栈道，禁止喧哗。",
        icon: "leaf",
        color: "#4C7941",
        tagBg: "#E3EEDB",
        tagInk: "#33582B",
        pin: { u: 0.66, v: 0.73 },
        cleanCard: { u: 0.81, v: 0.70 },
        brokenCard: { u: 0.81, v: 0.70 },
        cleanCtrl: { u: 0.58, v: 0.66 },
        brokenCtrl: { u: 0.35, v: 0.65 },
      },
      {
        id: "west",
        name: "旧矿石博物馆",
        tag: "HERITAGE",
        anchorLabel: "INDOOR 40 MIN",
        desc: "西麓地质展馆，雨天避雨休整点。",
        icon: "factory",
        color: "#5A5466",
        tagBg: "#E8E4EC",
        tagInk: "#433E4D",
        pin: { u: 0.30, v: 0.62 },
        cleanCard: { u: 0.26, v: 0.78 },
        brokenCard: { u: 0.26, v: 0.78 },
        cleanCtrl: { u: 0.41, v: 0.58 },
        brokenCtrl: { u: 0.44, v: 0.44 },
      },
    ],
  },
};

export const HUB_CLEAN = { u: 0.52, v: 0.50 };
export const HUB_START = { u: 0.50, v: 0.50 }; // 落在画布正中，data-perf-drag 起始即命中主锚点

export function createInitialState(scenarioId = "coastal") {
  const sc = SCENARIOS[scenarioId] || SCENARIOS.coastal;
  return {
    scenarioId: sc.id,
    hub: { ...HUB_START },
    anchorMode: "flat", // flat(错:平权) | balanced(正:主次分明) | giant(错:巨钉遮图)
    regionPalette: "rainbow7", // rainbow7(错:7色过载) | mono0(错:0色无分区) | poster4(正:4色柔区) | minimal3(正:3色海陆城)
    routeTopology: "custom", // custom(可拖拐点) | radial(正:中心放射) | loop(正:沿海环线) | mesh(错:全连蛛网) | none(错:无动线)
    contextLevel: "balanced", // blank(错:纯白无语境) | balanced(正:原海报地形) | contour(正:等高线极简) | noisy(错:重噪压字)
    selectedId: "hub", // 'hub' | nodeId
    hoverId: null,
    cards: Object.fromEntries(sc.nodes.map((n) => [n.id, { ...n.brokenCard }])),
    ctrls: Object.fromEntries(sc.nodes.map((n) => [n.id, { ...n.brokenCtrl }])),
  };
}

export function applyPreset(state, presetId) {
  const sc = SCENARIOS[state.scenarioId] || SCENARIOS.coastal;
  if (presetId === "broken") {
    return createInitialState(state.scenarioId);
  }
  if (presetId === "poster") {
    return {
      ...state,
      hub: { ...HUB_CLEAN },
      anchorMode: "balanced",
      regionPalette: "poster4",
      routeTopology: "radial",
      contextLevel: "balanced",
      cards: Object.fromEntries(sc.nodes.map((n) => [n.id, { ...n.cleanCard }])),
      ctrls: Object.fromEntries(sc.nodes.map((n) => [n.id, { ...n.cleanCtrl }])),
    };
  }
  if (presetId === "loop") {
    return {
      ...state,
      hub: { ...HUB_CLEAN },
      anchorMode: "balanced",
      regionPalette: "minimal3",
      routeTopology: "loop",
      contextLevel: "balanced",
      cards: Object.fromEntries(sc.nodes.map((n) => [n.id, { ...n.cleanCard }])),
      ctrls: Object.fromEntries(sc.nodes.map((n) => [n.id, { ...n.cleanCtrl }])),
    };
  }
  if (presetId === "contour") {
    return {
      ...state,
      hub: { ...HUB_CLEAN },
      anchorMode: "balanced",
      regionPalette: "minimal3",
      routeTopology: "radial",
      contextLevel: "contour",
      cards: Object.fromEntries(sc.nodes.map((n) => [n.id, { ...n.cleanCard }])),
      ctrls: Object.fromEntries(sc.nodes.map((n) => [n.id, { ...n.cleanCtrl }])),
    };
  }
  return state;
}

// ---------- 纯几何计算工具 ----------
export function pointInPolygon(u, v, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = (yi > v) !== (yj > v) && u < ((xj - xi) * (v - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function sampleQuad(p0, pc, p1, steps = 14) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    pts.push({
      u: mt * mt * p0.u + 2 * mt * t * pc.u + t * t * p1.u,
      v: mt * mt * p0.v + 2 * mt * t * pc.v + t * t * p1.v,
    });
  }
  return pts;
}

function orient(a, b, c) {
  return (b.u - a.u) * (c.v - a.v) - (b.v - a.v) * (c.u - a.u);
}

// 两线段严格内交点（排除共享端点附近）
export function segmentIntersect(a1, a2, b1, b2) {
  const o1 = orient(a1, a2, b1);
  const o2 = orient(a1, a2, b2);
  const o3 = orient(b1, b2, a1);
  const o4 = orient(b1, b2, a2);
  if (o1 * o2 < 0 && o3 * o4 < 0) {
    const denom = (a1.u - a2.u) * (b1.v - b2.v) - (a1.v - a2.v) * (b1.u - b2.u);
    if (Math.abs(denom) < 1e-9) return null;
    const t = ((a1.u - b1.u) * (b1.v - b2.v) - (a1.v - b1.v) * (b1.u - b2.u)) / denom;
    return { u: a1.u + t * (a2.u - a1.u), v: a1.v + t * (a2.v - a1.v) };
  }
  return null;
}

// 依据当前拓扑生成全部待绘路线与折线点列
export function buildRoutes(state) {
  const sc = SCENARIOS[state.scenarioId] || SCENARIOS.coastal;
  const nodes = sc.nodes;
  if (state.routeTopology === "none") return [];

  if (state.routeTopology === "loop") {
    // 顺时针海岸-北山-城区-湿地-西区环线 + 一条中心接入线，天然零交叉
    const order = ["coast", "north", "city", "south", "west"];
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const routes = [];
    for (let i = 0; i < order.length; i++) {
      const a = byId[order[i]];
      const b = byId[order[(i + 1) % order.length]];
      const mid = { u: (a.pin.u + b.pin.u) * 0.5, v: (a.pin.v + b.pin.v) * 0.5 };
      // 微微向外弓起绕开主锚点
      const dx = mid.u - state.hub.u;
      const dy = mid.v - state.hub.v;
      const len = Math.hypot(dx, dy) || 1;
      const ctrl = { u: mid.u + (dx / len) * 0.04, v: mid.v + (dy / len) * 0.04 };
      routes.push({
        id: `loop-${a.id}-${b.id}`,
        nodeId: a.id,
        color: a.color,
        p0: a.pin,
        pc: ctrl,
        p1: b.pin,
        pts: sampleQuad(a.pin, ctrl, b.pin, 14),
        draggableCtrl: false,
      });
    }
    // 中心枢纽接入城市中心，建立起讫锚定
    const cNode = byId.city;
    const ctrlHub = { u: (state.hub.u + cNode.pin.u) * 0.5, v: (state.hub.v + cNode.pin.v) * 0.5 };
    routes.push({
      id: "loop-hub",
      nodeId: "city",
      color: PALETTE.teal,
      p0: state.hub,
      pc: ctrlHub,
      p1: cNode.pin,
      pts: sampleQuad(state.hub, ctrlHub, cNode.pin, 10),
      draggableCtrl: false,
    });
    return routes;
  }

  if (state.routeTopology === "mesh") {
    // 反例：全部 5 个外围节点两两直连 + 全连主锚，形成典型蛛网乱线
    const routes = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const mid = { u: (a.pin.u + b.pin.u) * 0.5, v: (a.pin.v + b.pin.v) * 0.5 };
        routes.push({
          id: `mesh-${a.id}-${b.id}`,
          nodeId: a.id,
          color: a.color,
          p0: a.pin,
          pc: mid,
          p1: b.pin,
          pts: sampleQuad(a.pin, mid, b.pin, 8),
          draggableCtrl: false,
        });
      }
    }
    return routes;
  }

  // radial 或 custom（均可直接拖拐点）
  return nodes.map((n) => {
    const ctrl = state.routeTopology === "radial"
      ? {
          u: (state.hub.u + n.pin.u) * 0.5 + (n.cleanCtrl.u - (HUB_CLEAN.u + n.pin.u) * 0.5),
          v: (state.hub.v + n.pin.v) * 0.5 + (n.cleanCtrl.v - (HUB_CLEAN.v + n.pin.v) * 0.5),
        }
      : state.ctrls[n.id];
    return {
      id: `route-${n.id}`,
      nodeId: n.id,
      color: n.color,
      p0: state.hub,
      pc: ctrl,
      p1: n.pin,
      pts: sampleQuad(state.hub, ctrl, n.pin, 16),
      draggableCtrl: true,
    };
  });
}

// 精确计算所有路线之间的真实几何交点（剔除节点周边 0.032 共享端点半径）
export function findCrossings(routes, pins) {
  const hits = [];
  const nearAnyPin = (pt) => pins.some((p) => Math.hypot(pt.u - p.u, pt.v - p.v) < 0.036);
  for (let i = 0; i < routes.length; i++) {
    for (let j = i + 1; j < routes.length; j++) {
      const A = routes[i].pts;
      const B = routes[j].pts;
      let foundPair = false;
      for (let a = 1; a < A.length - 1 && !foundPair; a++) {
        for (let b = 1; b < B.length - 1 && !foundPair; b++) {
          const hit = segmentIntersect(A[a], A[a + 1], B[b], B[b + 1]);
          if (hit && !nearAnyPin(hit)) {
            // 去重相近交点
            if (!hits.some((h) => Math.hypot(h.u - hit.u, h.v - hit.v) < 0.025)) {
              hits.push({ ...hit, rA: routes[i].nodeId, rB: routes[j].nodeId });
            }
            foundPair = true;
          }
        }
      }
    }
  }
  return hits;
}

// 统一卡片尺寸（归一化宽、高）与引线 / 重叠核算
export const CARD_BOX = { w: 0.215, h: 0.145 };

export function computeCardMetrics(state) {
  const sc = SCENARIOS[state.scenarioId] || SCENARIOS.coastal;
  const items = sc.nodes.map((n) => {
    const c = state.cards[n.id];
    const hw = CARD_BOX.w * 0.5;
    const hh = CARD_BOX.h * 0.5;
    // 卡片边框离锚点最近的点
    const cx = Math.max(c.u - hw, Math.min(n.pin.u, c.u + hw));
    const cy = Math.max(c.v - hh, Math.min(n.pin.v, c.v + hh));
    const edgeDist = Math.hypot(cx - n.pin.u, cy - n.pin.v);
    const centerDist = Math.hypot(c.u - n.pin.u, c.v - n.pin.v);
    // 判断卡片是否压住任何一枚锚点（含主锚）
    const coversOwnPin = Math.abs(n.pin.u - c.u) < hw + 0.012 && Math.abs(n.pin.v - c.v) < hh + 0.015;
    const coversHub = Math.abs(state.hub.u - c.u) < hw + 0.018 && Math.abs(state.hub.v - c.v) < hh + 0.022;
    const coversOtherPin = sc.nodes.some(
      (m) => m.id !== n.id && Math.abs(m.pin.u - c.u) < hw + 0.012 && Math.abs(m.pin.v - c.v) < hh + 0.015
    );
    const tooFar = edgeDist > 0.16 || centerDist > 0.27;
    return {
      id: n.id,
      name: n.name,
      card: c,
      pin: n.pin,
      anchorPt: { u: cx, v: cy },
      edgeDist,
      centerDist,
      tooFar,
      coversPin: coversOwnPin || coversHub || coversOtherPin,
    };
  });

  // 检测卡片之间相互遮压
  const cardPairs = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i].card, b = items[j].card;
      if (Math.abs(a.u - b.u) < CARD_BOX.w * 0.88 && Math.abs(a.v - b.v) < CARD_BOX.h * 0.84) {
        cardPairs.push([items[i].id, items[j].id]);
      }
    }
  }
  const overlappingCardIds = new Set(cardPairs.flat());
  for (const it of items) {
    it.cardOverlap = overlappingCardIds.has(it.id);
    it.ok = !it.tooFar && !it.coversPin && !it.cardOverlap;
  }

  const maxEdge = Math.max(...items.map((x) => x.edgeDist));
  const avgEdge = items.reduce((s, x) => s + x.edgeDist, 0) / items.length;
  const farCount = items.filter((x) => x.tooFar).length;
  const overlapCount = items.filter((x) => x.coversPin || x.cardOverlap).length;
  return { items, maxEdge, avgEdge, farCount, overlapCount, cardPairs };
}

// ---------- 核心单真源总评 ----------
export function evaluateMap(state) {
  const sc = SCENARIOS[state.scenarioId] || SCENARIOS.coastal;
  const hubInSea = pointInPolygon(state.hub.u, state.hub.v, TERRAIN.seaPoly);
  const hubAtEdge = state.hub.u < 0.16 || state.hub.u > 0.84 || state.hub.v < 0.15 || state.hub.v > 0.84;

  // 1. 位置锚点检定
  let anchorPass = false;
  let anchorCode = "ok";
  let anchorBadge = "主次清晰 1.6×";
  let anchorHeadline = "主锚点落位核心陆地，层级一眼锁定";
  let anchorWhy = "主锚比次级锚大 1.6 倍并带波纹环，视线一进画面先稳稳落心，再向五区扩散。";
  let anchorAction = "拖动中央主锚可随时调整放射重心。";

  if (hubInSea) {
    anchorCode = "sea";
    anchorBadge = "主锚落海";
    anchorHeadline = "主锚点漂进海湾水面了";
    anchorWhy = "地图布局的锚点必须附着在真实可达的核心地点上。主锚落进开阔海面后，五条陆路动线全部失去地理依据，读者会立刻怀疑整张图的可信度。";
    anchorAction = "把中央主锚拖回半岛陆地中心（陆海交汇枢纽附近）。";
  } else if (hubAtEdge) {
    anchorCode = "edge";
    anchorBadge = "贴边失衡";
    anchorHeadline = "主锚点被挤到画框边缘，动线单边拉长";
    anchorWhy = "核心参照贴边时，所有连线只能朝一侧挤压，既容易打结，也让对侧区域失去向心联系。";
    anchorAction = "把主锚点拖回半岛中腹地带，让各向路线自然舒展。";
  } else if (state.anchorMode === "flat") {
    anchorCode = "flat";
    anchorBadge = "平权失焦 1.0×";
    anchorHeadline = "六枚锚点一般大，眼睛找不到起点";
    anchorWhy = "所有锚点用同样大小和灰红平铺时，主枢纽和外围次级节点没有视觉阶梯。用户打开页面只能逐个挨着扫，地图失去了组织层级的能力。";
    anchorAction = "在「位置锚点」图层卡里把主锚切到「主次 1.6×」。";
  } else if (state.anchorMode === "giant") {
    anchorCode = "giant";
    anchorBadge = "巨钉遮图 2.3×";
    anchorHeadline = "主锚点放大过度（2.3×），把周边路网全盖住了";
    anchorWhy = "突出主锚不等于无限做大。锚点体量超标后会直接吞掉核心路网交汇处和周边海岸轮廓，反过来毁掉地图语境。";
    anchorAction = "把主锚点退回「主次 1.6×」，留出周边路网呼吸空间。";
  } else {
    anchorPass = true;
  }

  // 2. 区域分组检定
  const regionMap = {
    rainbow7: { count: 7, pass: false, badge: "7 色过载", label: "7 色刺眼" },
    mono0: { count: 0, pass: false, badge: "0 色糊底", label: "全灰无分" },
    poster4: { count: 4, pass: true, badge: "4 色柔区", label: "4 色柔区" },
    minimal3: { count: 3, pass: true, badge: "3 色海陆城", label: "3 色海陆城" },
  };
  const reg = regionMap[state.regionPalette] || regionMap.rainbow7;
  let regionHeadline = `${reg.count} 色低饱和分区，空间归属一眼读清`;
  let regionWhy = "区域色块压低饱和度退居背景层，让深色锚点与虚线路径稳稳浮在前景。";
  let regionAction = "也可试切「3 色海陆城」对比更精简的分组方案。";
  if (state.regionPalette === "rainbow7") {
    regionHeadline = "底图切成 7 种高饱和撞色，把锚点和路线彻底淹没";
    regionWhy = "高饱和多色底图会和前景锚点抢夺注意力，远超「区域色彩不超过 4 种」的快速扫读上限，读者看见的是一块块花哨色斑而非空间归属。";
    regionAction = "在「区域分组」切到「4 色柔区」或「3 色海陆城」，让底图安静下来。";
  } else if (state.regionPalette === "mono0") {
    regionHeadline = "整片半岛涂成同一块冷灰，空间归属完全消失";
    regionWhy = "完全放弃区域着色后，山林、城区、产业园和湿地糊成一片灰，用户必须逐字读完每张卡片才能猜出哪边是生态、哪边是城区。";
    regionAction = "在「区域分组」启用「4 色柔区」或「3 色海陆城」，用柔和色块拉开区域边界。";
  }

  // 3. 路径动线检定
  const routes = buildRoutes(state);
  const allPins = [state.hub, ...sc.nodes.map((n) => n.pin)];
  const crossings = findCrossings(routes, allPins);
  let routePass = false;
  let routeBadge = "0 处交叉";
  let routeHeadline = state.routeTopology === "loop" ? "沿海环线零交叉，游览顺序一目了然" : "五条放射动线零交叉，视线顺畅流转";
  let routeWhy = "路线互不打结，视线从主锚点出发可以毫不犹豫地滑向对应分区。";
  let routeAction = "可继续拖拽拐点环或切换「沿海环线」检验不同动线拓扑。";

  if (state.routeTopology === "none") {
    routeBadge = "无路径孤岛";
    routeHeadline = "锚点之间没有动线，画面散成六个孤岛";
    routeWhy = "缺少路径引导时，地图只能告诉你「东西在哪」，却无法回答「先看哪、怎么走」，视觉节奏断档。";
    routeAction = "在「路径引导」开启「中心放射」或「沿海环线」。";
  } else if (state.routeTopology === "mesh") {
    routeBadge = `蛛网交叉 ${crossings.length} 处`;
    routeHeadline = `节点两两全连形成 ${crossings.length} 处乱线交叉，地图变成蜘蛛网`;
    routeWhy = "把所有节点都连起来是最常见的过度连线误区。视线每走半寸就撞上岔路口，反而什么路线都读不出来。";
    routeAction = "改用「中心放射」或「沿海环线」，只保留主干动线。";
  } else if (crossings.length > 0) {
    routeBadge = `交叉 ${crossings.length} 处`;
    routeHeadline = `虚线动线存在 ${crossings.length} 处真实交叉，视线走到交点就打结`;
    routeWhy = "两条路线在途中相交时，人眼很容易顺着另一条线滑偏方向。保持路线简单直接、互不穿插，阅读速度会成倍提升。";
    routeAction = "点画布上的红色「×」交点章直接理顺，或拖动画布上的空心拐点环掰直路线。";
  } else {
    routePass = true;
  }

  // 4. 信息就近 & 场景语境检定
  const cardMeta = computeCardMetrics(state);
  let proxPass = false;
  let proxBadge = "就近 · 语境佳";
  let proxHeadline = "五张注释卡紧贴各自锚点，底图语境克制清晰";
  let proxWhy = "注释卡片与锚点间距短且零遮挡，海岸线、等高线与绿林提供恰到好处的空间代入感。";
  let proxAction = "可故意把卡片拖远或切「重噪路网」，观察可读性如何骤降。";

  if (state.contextLevel === "blank") {
    proxBadge = "纯白失语境";
    proxHeadline = "拿掉海岸线与地形底图，页面退化成悬空散点";
    proxWhy = "没有地图背景交代哪里靠海、哪里靠山，空间位置就失去了上下文意义——既然不借地形语境，直接排成卡片列表反而更清楚。";
    proxAction = "在「场景语境」恢复「原海报地形」或「等高线极简」。";
  } else if (state.contextLevel === "noisy") {
    proxBadge = "底图过噪";
    proxHeadline = "密密麻麻的路网和杂标抢占前景，注释快看不清了";
    proxWhy = "把原始导航级路网原封不动塞进信息图底图，深色线条与杂字会和前景卡片打架，视觉噪音飙升。";
    proxAction = "在「场景语境」退回「原海报地形」或「等高线极简」，只留必要地标线索。";
  } else if (cardMeta.farCount > 0) {
    const farNames = cardMeta.items.filter((x) => x.tooFar).map((x) => x.name).join("、");
    proxBadge = `远跳 ${cardMeta.farCount} 张`;
    proxHeadline = `「${farNames}」卡片被甩到远处，眼睛得跨图找锚点`;
    proxWhy = `最长引线已达画布宽度的 ${Math.round(cardMeta.maxEdge * 100)}%。每次读完卡片说明，视线都要跨越半张半岛重新确认对应位置，认知摩擦剧增。`;
    proxAction = `直接把画布上带红框的「${farNames}」卡片拖回对应锚点旁（或点「卡片就近归位」）。`;
  } else if (cardMeta.overlapCount > 0) {
    proxBadge = `遮压 ${cardMeta.overlapCount} 处`;
    proxHeadline = `有 ${cardMeta.overlapCount} 张卡片压住了锚点或彼此撞车`;
    proxWhy = "注释卡盖住锚点或叠在一起时，会直接抹掉用户用来定位的地理坐标。就近贴靠的原则是「靠近但不遮盖」。";
    proxAction = "把带红框的卡片往旁边轻挪一小格，露出下方锚点即可。";
  } else {
    proxPass = true;
    proxBadge = state.contextLevel === "contour" ? "就近 · 等高线" : "就近 · 语境佳";
  }

  const checks = {
    anchor: { pass: anchorPass, badge: anchorBadge, code: anchorCode, headline: anchorHeadline, why: anchorWhy, action: anchorAction },
    region: { pass: reg.pass, badge: reg.badge, code: state.regionPalette, headline: regionHeadline, why: regionWhy, action: regionAction },
    route: { pass: routePass, badge: routeBadge, code: state.routeTopology, headline: routeHeadline, why: routeWhy, action: routeAction },
    proximity: { pass: proxPass, badge: proxBadge, code: state.contextLevel, headline: proxHeadline, why: proxWhy, action: proxAction },
  };

  const passCount = [anchorPass, reg.pass, routePass, proxPass].filter(Boolean).length;
  const allPass = passCount === 4;

  // 按最迫切影响阅读的顺序挑选主诊单
  let diagnosis;
  if (!anchorPass) {
    diagnosis = { kind: "error", tag: `错态 · 位置锚点 (${passCount}/4)`, ...checks.anchor };
  } else if (!reg.pass) {
    diagnosis = { kind: "error", tag: `错态 · 区域分组 (${passCount}/4)`, ...checks.region };
  } else if (!routePass) {
    diagnosis = { kind: "error", tag: `错态 · 路径动线 (${passCount}/4)`, ...checks.route };
  } else if (!proxPass) {
    diagnosis = { kind: "error", tag: `错态 · 就近与语境 (${passCount}/4)`, ...checks.proximity };
  } else {
    const styleName =
      state.routeTopology === "loop"
        ? "环线游览合法解"
        : state.contextLevel === "contour"
          ? "等高线极简合法解"
          : "原海报放射合法解";
    diagnosis = {
      kind: "pass",
      tag: `达标 · ${styleName} (4/4)`,
      headline: "空间骨架已立住：先定锚点、柔色分区、零交叉动线、就近注释",
      why: "此刻眼睛进画面 1 秒内就能完成四步读图：先落中央主锚，再扫清柔和色区归属，顺着无交叉虚线直达各区，并在锚点手边直接读到说明。",
      action: "试试故意把主锚拖入海湾、把路线切到全连蛛网，或把卡片拖远，亲眼验证每一条规矩失守时的视觉坍塌。",
    };
  }

  return {
    checks,
    passCount,
    allPass,
    diagnosis,
    routes,
    crossings,
    cardMeta,
    metrics: {
      anchorRatio: state.anchorMode === "balanced" ? "1.6×" : state.anchorMode === "giant" ? "2.3×" : "1.0×",
      hubTerrain: hubInSea ? "海湾水面（越界）" : hubAtEdge ? "画框边缘（失衡）" : "半岛枢纽（可达）",
      regionCount: reg.count,
      crossingCount: crossings.length,
      maxLeaderPct: Math.round(cardMeta.maxEdge * 100),
      avgLeaderPct: Math.round(cardMeta.avgEdge * 100),
      overlapCount: cardMeta.overlapCount,
      contextLabel:
        state.contextLevel === "balanced"
          ? "原海报地形"
          : state.contextLevel === "contour"
            ? "等高线极简"
            : state.contextLevel === "blank"
              ? "纯白无语境"
              : "重噪路网",
    },
  };
}

// ---------- 第 02 节数据：缩放聚合 + 地图×列表双向联动 ----------
// 28 处真实滨海城区点位（带价格、分类、坐标），支持按 Z10..Z16 真实空间网格聚合
export const POI_POINTS = [
  { id: "p01", name: "海湾渡口民宿", area: "滨海码头", price: 520, score: "4.9", u: 0.28, v: 0.36, color: "#028E93" },
  { id: "p02", name: "灯塔观海房", area: "滨海码头", price: 580, score: "4.8", u: 0.31, v: 0.41, color: "#028E93" },
  { id: "p03", name: "潮汐艺术旅舍", area: "滨海码头", price: 410, score: "4.7", u: 0.25, v: 0.44, color: "#028E93" },
  { id: "p04", name: "白帆咖啡公馆", area: "滨海码头", price: 490, score: "4.9", u: 0.34, v: 0.38, color: "#028E93" },
  { id: "p05", name: "码头仓栈 loft", area: "滨海码头", price: 450, score: "4.6", u: 0.32, v: 0.45, color: "#028E93" },
  { id: "p06", name: "松涛山居", area: "山地公园", price: 390, score: "4.9", u: 0.62, v: 0.20, color: "#49763F" },
  { id: "p07", name: "北坡云杉木屋", area: "山地公园", price: 460, score: "4.8", u: 0.68, v: 0.24, color: "#49763F" },
  { id: "p08", name: "林间徒步驿站", area: "山地公园", price: 320, score: "4.7", u: 0.65, v: 0.28, color: "#49763F" },
  { id: "p09", name: "清风半山院", area: "山地公园", price: 540, score: "5.0", u: 0.74, v: 0.26, color: "#49763F" },
  { id: "p10", name: "石阶茶宿", area: "山地公园", price: 420, score: "4.8", u: 0.59, v: 0.26, color: "#49763F" },
  { id: "p11", name: "中轴广场酒店", area: "城市中心", price: 680, score: "4.8", u: 0.64, v: 0.46, color: "#E59500" },
  { id: "p12", name: "美术馆旁公寓", area: "城市中心", price: 610, score: "4.9", u: 0.70, v: 0.49, color: "#E59500" },
  { id: "p13", name: "老钟楼精品房", area: "城市中心", price: 590, score: "4.7", u: 0.67, v: 0.52, color: "#E59500" },
  { id: "p14", name: "书店街阁楼", area: "城市中心", price: 470, score: "4.8", u: 0.73, v: 0.44, color: "#E59500" },
  { id: "p15", name: "南门地铁优选", area: "城市中心", price: 530, score: "4.6", u: 0.62, v: 0.51, color: "#E59500" },
  { id: "p16", name: "中心食集上居", area: "城市中心", price: 640, score: "4.9", u: 0.68, v: 0.45, color: "#E59500" },
  { id: "p17", name: "湿地观鸟小筑", area: "生态湿地", price: 480, score: "4.9", u: 0.65, v: 0.73, color: "#4C7941" },
  { id: "p18", name: "芦苇水岸别墅", area: "生态湿地", price: 720, score: "4.9", u: 0.70, v: 0.76, color: "#4C7941" },
  { id: "p19", name: "白鹭桥畔营地", area: "生态湿地", price: 360, score: "4.7", u: 0.61, v: 0.78, color: "#4C7941" },
  { id: "p20", name: "南溪生态客栈", area: "生态湿地", price: 430, score: "4.8", u: 0.74, v: 0.71, color: "#4C7941" },
  { id: "p21", name: "西园智造公寓", area: "产业园区", price: 330, score: "4.6", u: 0.29, v: 0.63, color: "#5A5466" },
  { id: "p22", name: "创客广场单间", area: "产业园区", price: 290, score: "4.5", u: 0.34, v: 0.66, color: "#5A5466" },
  { id: "p23", name: "红砖厂房 loft", area: "产业园区", price: 370, score: "4.8", u: 0.25, v: 0.67, color: "#5A5466" },
  { id: "p24", name: "研发大道轻居", area: "产业园区", price: 350, score: "4.7", u: 0.38, v: 0.62, color: "#5A5466" },
];

// 根据缩放级别 zoom (10..16) 和聚合开关，实时计算屏幕可见标记与互相遮挡数
export function computeZoomView(zoom, clusterEnabled) {
  // 视口缩进：zoom=10 全览 (0..1)；zoom=16 聚焦城心与码头片区
  const t = (zoom - 10) / 6; // 0..1
  const span = 1 - t * 0.56; // 1.0 → 0.44
  const cx = 0.50 + t * 0.08;
  const cy = 0.50 - t * 0.02;
  const minU = cx - span * 0.5;
  const minV = cy - span * 0.5;

  const projected = POI_POINTS.map((p) => ({
    ...p,
    su: (p.u - minU) / span,
    sv: (p.v - minV) / span,
  })).filter((p) => p.su >= 0.04 && p.su <= 0.96 && p.sv >= 0.04 && p.sv <= 0.96);

  // 聚合半径随 zoom 减小（Z10 聚合半径 0.21，Z14+ 退回 0 自动完全解聚）
  const clusterRadius = clusterEnabled ? Math.max(0, (14.4 - zoom) * 0.048) : 0;
  const markers = [];
  const used = new Set();

  if (clusterRadius > 0.02) {
    for (const p of projected) {
      if (used.has(p.id)) continue;
      const group = [p];
      used.add(p.id);
      for (const q of projected) {
        if (used.has(q.id)) continue;
        if (Math.hypot(p.su - q.su, p.sv - q.sv) <= clusterRadius) {
          group.push(q);
          used.add(q.id);
        }
      }
      if (group.length > 1) {
        const avgU = group.reduce((s, x) => s + x.su, 0) / group.length;
        const avgV = group.reduce((s, x) => s + x.sv, 0) / group.length;
        const avgPrice = Math.round(group.reduce((s, x) => s + x.price, 0) / group.length);
        markers.push({
          type: "cluster",
          id: `cl-${group[0].id}`,
          count: group.length,
          area: group[0].area,
          avgPrice,
          color: group[0].color,
          su: avgU,
          sv: avgV,
          members: group,
        });
      } else {
        markers.push({ type: "pin", ...p });
      }
    }
  } else {
    for (const p of projected) markers.push({ type: "pin", ...p });
  }

  // 计算标记在画布上的真实互相重叠碰撞数（无聚合低缩放时立刻飙高）
  let collisions = 0;
  const hitR = 0.072;
  for (let i = 0; i < markers.length; i++) {
    for (let j = i + 1; j < markers.length; j++) {
      if (Math.hypot(markers[i].su - markers[j].su, markers[i].sv - markers[j].sv) < hitR) {
        collisions++;
      }
    }
  }

  return { zoom, projected, markers, collisions, span, minU, minV };
}

// ---------- 第 03 节数据：地理实距 ↔ 贝克 45°/90° 拓扑连续形变 ----------
export const TOPO_STATIONS = [
  { id: "s1", name: "北湾渡口", line: "A", geo: [0.16, 0.24], sch: [0.14, 0.22], core: false },
  { id: "s2", name: "老海关", line: "A", geo: [0.43, 0.43], sch: [0.32, 0.40], core: true },
  { id: "s3", name: "钟楼广场", line: "AB", geo: [0.49, 0.48], sch: [0.50, 0.40], core: true },
  { id: "s4", name: "市政厅", line: "AB", geo: [0.53, 0.51], sch: [0.50, 0.60], core: true },
  { id: "s5", name: "文化中心", line: "A", geo: [0.58, 0.55], sch: [0.68, 0.60], core: true },
  { id: "s6", name: "东岸新区", line: "A", geo: [0.88, 0.78], sch: [0.86, 0.78], core: false },
  { id: "s7", name: "西山林场", line: "B", geo: [0.22, 0.79], sch: [0.24, 0.78], core: false },
  { id: "s8", name: "北岭公园", line: "B", geo: [0.79, 0.19], sch: [0.76, 0.22], core: false },
];

export const TOPO_LINES = [
  { id: "A", label: "滨海线", color: "#5CE0BD", stops: ["s1", "s2", "s3", "s4", "s5", "s6"] },
  { id: "B", label: "山城线", color: "#F7B733", stops: ["s7", "s4", "s3", "s8"] },
];

export function interpolateTopo(morph, width = 760, height = 360) {
  const pts = TOPO_STATIONS.map((s) => {
    const u = s.geo[0] + (s.sch[0] - s.geo[0]) * morph;
    const v = s.geo[1] + (s.sch[1] - s.geo[1]) * morph;
    return { ...s, u, v, x: u * width, y: v * height };
  });
  const corePts = pts.filter((p) => p.core);
  let minCoreGap = Infinity;
  let labelOverlaps = 0;
  for (let i = 0; i < corePts.length; i++) {
    for (let j = i + 1; j < corePts.length; j++) {
      const d = Math.hypot(corePts[i].x - corePts[j].x, corePts[i].y - corePts[j].y);
      if (d < minCoreGap) minCoreGap = d;
      if (Math.abs(corePts[i].x - corePts[j].x) < 76 && Math.abs(corePts[i].y - corePts[j].y) < 30) {
        labelOverlaps++;
      }
    }
  }
  return { pts, minCoreGap: Math.round(minCoreGap), labelOverlaps };
}

// ---------- 第 04 节数据：四座真实历史里程碑 ----------
export const LINEAGE_ITEMS = [
  {
    id: "snow",
    year: "1854–1855",
    who: "John Snow",
    work: "伦敦宽街霍乱地图",
    source: "《论霍乱的传播方式》第二版（1855 年 1 月）",
    summary: "1854 年秋伦敦 Soho 爆发霍乱，医师约翰·斯诺把每户死亡病例以黑色短条直接摞在街区地图上。无需冗长表格，黑条瞬间在宽街水泵四周聚成尖峰——用空间邻近本身揭示了水源传播的真相。",
    legacy: "留给界面的铁律：把数据锚定到真实空间位置，空间聚集本身就是最强视觉叙事。",
  },
  {
    id: "beck",
    year: "1933",
    who: "Harry Beck",
    work: "伦敦地铁口袋示意图",
    source: "1933 年 1 月试印 75 万份",
    summary: "工程制图员哈里·贝克借鉴电路图，把纠缠在真实街道上的地铁线路拉直为水平、垂直与 45° 斜线，刻意放大拥挤市中心并压缩郊区。事实证明，通勤者要的是站点顺序和换乘关系，而非等比例距离。",
    legacy: "留给界面的铁律：地图是为了任务服务的，必要时敢于用拓扑简化替代测绘精确。",
  },
  {
    id: "bertin",
    year: "1967",
    who: "Jacques Bertin",
    work: "《图形符号学》视觉变量",
    source: "Sémiologie Graphique（1967）",
    summary: "法国制图理论家雅克·贝尔坦系统归纳了位置、尺寸、明度、纹理、色相、方向、形状七大视觉变量：色相适合做并列分类（区域分组），尺寸与明度才天然表达主次与数量级（主锚点大而深、次级锚小而轻）。",
    legacy: "留给界面的铁律：不同变量各司其职——别拿彩虹色相去表高低，也别拿等大圆点去表主次。",
  },
  {
    id: "gmaps",
    year: "1996 / 2005",
    who: "Ben Shneiderman & Google Maps",
    work: "总览缩放箴言与可拖拽瓦片地图",
    source: "IEEE VL 1996；Google Maps 2005 年 2 月 8 日上线",
    summary: "1996 年 Shneiderman 提出「先总览、再缩放过滤、按需看详情」；2005 年 2 月 8 日 Google Maps 以 256×256 瓦片和异步加载打破「点箭头整页刷新」，十天后 Ajax 获名，地图正式跃升为现代 Web 应用的交互主骨架。",
    legacy: "留给界面的铁律：用缩放、聚合与按需展开卡片，把海量空间信息驯服在一张可漫游的视口里。",
  },
];

// ---------- 第 05 节数据：什么时候别用（4 题翻牌分流仪） ----------
export const NOT_USE_CASES = [
  {
    id: "c1",
    title: "对比 12 款笔记本电脑的 CPU、重量与价格",
    scene: "电商参数横评页",
    shouldUseMap: false,
    verdict: "千万别用地图主导",
    reason: "硬件参数之间没有任何地理坐标关系，硬塞地图只会沦为多余装饰。多维精准比对、排序与筛选应直接交给数据表格或搜索结果页。",
    siblingText: "改用 274 数据表格布局或 286 搜索结果布局",
    siblingLinks: [
      { id: "274", label: "274 数据表格布局" },
      { id: "286", label: "286 搜索结果布局" },
    ],
  },
  {
    id: "c2",
    title: "调度骑手查看全城 4 个片区的实时取餐与送达路线",
    scene: "即时配送运营台",
    shouldUseMap: true,
    verdict: "正是地图主导的主场",
    reason: "距离远近、片区冷热和路径是否顺路全是纯空间决策。以低饱和底图承载实时锚点与路线，一眼就能判断是否顺路并单。",
    siblingText: "若还需汇总全局履约指标，可在边栏配合 273 仪表盘布局",
    siblingLinks: [{ id: "273", label: "273 仪表盘布局" }],
  },
  {
    id: "c3",
    title: "讲清一家设计工作室从 2016 到 2026 的十件大事",
    scene: "品牌大事记专题页",
    shouldUseMap: false,
    verdict: "别硬套地图",
    reason: "核心主线是「时间先后」而非「东西南北」。强行在地图上连线会让视线来回折返，打断叙事连贯性。",
    siblingText: "时间脉络交给 277 时间线布局，图文流览看 269 信息流布局",
    siblingLinks: [
      { id: "277", label: "277 时间线布局" },
      { id: "269", label: "269 信息流布局" },
    ],
  },
  {
    id: "c4",
    title: "团队梳理下季度 40 项开发任务的待办与进展状态",
    scene: "项目管理协作台",
    shouldUseMap: false,
    verdict: "别用地图主导",
    reason: "任务流转依赖状态列（待办 / 进行中 / 已完成）或父子目录层级，强行借用地图隐喻只会徒增认知翻译成本。",
    siblingText: "流程推进用 278 看板布局，目录层级用 280 树形浏览布局，自由摆布看 283 画布工作区布局",
    siblingLinks: [
      { id: "278", label: "278 看板布局" },
      { id: "280", label: "280 树形浏览布局" },
      { id: "283", label: "283 画布工作区布局" },
    ],
  },
];

// ---------- 第 06 节数据：单变量对照小练习（中性标签 A/B/C/D） ----------
export const QUIZ_ITEMS = [
  {
    id: "q1",
    prompt: "下面四张海湾导览图底图、色块与路线完全一致，只改变了四张说明卡片的摆放位置。哪一版视觉跳跃最小、最易读？",
    variable: "唯一变量：注释卡片位置与引线",
    answer: "B",
    options: [
      { key: "A", label: "方案 A", kind: "cards-left-stack", explain: "四张卡片全压在最左侧排成一列，右侧锚点必须拉出四条长引线横穿整张半岛并互相交叉，眼睛来回跑断腿。" },
      { key: "B", label: "方案 B", kind: "cards-near", explain: "每张说明卡紧靠对应锚点外侧，引线短直、互不穿越，既不遮压锚点又能一眼对应位置——严格落实「信息就近」。" },
      { key: "C", label: "方案 C", kind: "cards-on-pin", explain: "卡片直接盖在锚点头上，挡住了地理落点和路线接口，空间坐标线索被自己抹平。" },
      { key: "D", label: "方案 D", kind: "cards-swapped", explain: "卡片顺时针错位挂到相邻分区外侧，引线跨区斜拉，读者扫一眼卡片就会误认归属区域。" },
    ],
  },
  {
    id: "q2",
    prompt: "同样一组 1 主 4 次锚点与放射路线，只改变底图区域着色方式。哪一版最利于快速分清区域又让锚点跳出来？",
    variable: "唯一变量：区域着色策略",
    answer: "C",
    options: [
      { key: "A", label: "方案 A", kind: "color-7loud", explain: "切出 7 块高饱和刺眼撞色，色块本身比前景锚点和虚线更抢眼，破坏了图形与背景的层次分离。" },
      { key: "B", label: "方案 B", kind: "color-mono", explain: "全图统一涂成单一冷灰，虽然锚点清楚，但水域、绿地、城区边界全部消失，丧失区域分组功能。" },
      { key: "C", label: "方案 C", kind: "color-3calm", explain: "用 3 种低饱和柔和色（浅海青、鼠尾草绿、暖沙色）划分区域，既不超过 4 色经验上限，又让深色主锚与彩针瞬间浮出。" },
      { key: "D", label: "方案 D", kind: "color-dark-clash", explain: "高饱和暗底色与同明度深色锚点明度差不足，前景标志陷进底图里难以分辨。" },
    ],
  },
  {
    id: "q3",
    prompt: "五个景点已按地理方位固定，只改变连接它们之间的路线方式。哪一版动线最清楚、最不会看花眼？",
    variable: "唯一变量：路径连接结构",
    answer: "B",
    options: [
      { key: "A", label: "方案 A", kind: "route-mesh", explain: "五个节点两两全连产生 10 条线段、交错成网，视觉节奏瞬间瓦解。" },
      { key: "B", label: "方案 B", kind: "route-radial", explain: "从中心主锚点向外放射连接四处次级锚点，路线简短直接且 0 处交叉，主次与游览起点一目了然。" },
      { key: "C", label: "方案 C", kind: "route-cross2", explain: "外圈折返绕行产生 2 处明显交错，人眼沿线扫读到交叉点时极易串线。" },
      { key: "D", label: "方案 D", kind: "route-none", explain: "完全去掉连接路线后只剩孤立点位，缺少动线引导与游览顺序。" },
    ],
  },
];

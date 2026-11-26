// 303 三人构图 — 单真源几何、主次权重、视线拓扑与导演诊断引擎
// 舞台画布绘制、左侧五项原则探针、底部快速检查清单与白话诊单全部只读本模块输出的同一份实测结果。

export const ACTOR_IDS = ["lead", "sideA", "sideB"];

// 严格承袭 303 原海报底部「应用场景」的五个场景与对应的三角色叙事语境
export const SCENARIOS = {
  stage: {
    id: "stage",
    label: "舞台表演",
    en: "STAGE",
    note: "聚光灯与台阶落差最易拉开顶点主角与两翼配角",
    roles: {
      lead: { name: "顶点主体", sub: "领衔主角 · 情绪中心" },
      sideA: { name: "侧点主体 A", sub: "左翼呼应 · 承接互动" },
      sideB: { name: "侧点主体 B", sub: "右翼配重 · 闭环收束" },
    },
  },
  dialogue: {
    id: "dialogue",
    label: "对话场景",
    en: "DIALOGUE",
    note: "三人谈话靠三角站位与视线传递，避免一字横排像审讯",
    roles: {
      lead: { name: "话语核心", sub: "主导议题 · 顶点控场" },
      sideA: { name: "提问者 A", sub: "推动冲突 · 视线牵引" },
      sideB: { name: "旁听者 B", sub: "态度砝码 · 平衡画面" },
    },
  },
  landscape: {
    id: "landscape",
    label: "风光人文",
    en: "LANDSCAPE",
    note: "借山坡或建筑纵深把三人错开，既交代环境又不散架",
    roles: {
      lead: { name: "高坡引路者", sub: "远峰呼应 · 视觉锚点" },
      sideA: { name: "前行旅人 A", sub: "中景过渡 · 拉伸纵深" },
      sideB: { name: "同行旅人 B", sub: "近景压角 · 稳住底边" },
    },
  },
  family: {
    id: "family",
    label: "家庭合影",
    en: "FAMILY",
    note: "打破站成一排的证件照感，用高低错落做出亲密聚拢",
    roles: {
      lead: { name: "居中长辈", sub: "亲情轴心 · 略高落位" },
      sideA: { name: "左侧家人 A", sub: "侧身内收 · 眼神相连" },
      sideB: { name: "右侧家人 B", sub: "自然呼应 · 稳固底座" },
    },
  },
  street: {
    id: "street",
    label: "街头纪实",
    en: "STREET",
    note: "抓拍街头偶遇的瞬间斜三角，让偶发路人读出戏剧关联",
    roles: {
      lead: { name: "逆光行者", sub: "光线切中 · 视觉抓手" },
      sideA: { name: "驻足路人 A", sub: "前景框角 · 建立层次" },
      sideB: { name: "街角观察 B", sub: "远侧呼应 · 构成呼应" },
    },
  },
};

export const LIGHT_LEVELS = [
  { value: 1.0, label: "主光", tag: "主" },
  { value: 0.66, label: "辅光", tag: "辅" },
  { value: 0.46, label: "弱光", tag: "衬" },
];

export const GAZE_CYCLE = {
  lead: ["sideA", "sideB", "outR", "outL"],
  sideA: ["sideB", "lead", "outL", "outR"],
  sideB: ["lead", "sideA", "outR", "outL"],
};

export const PRESETS = {
  // 开场刻意坏帧：0/5 三点等高排队共线 + 重心右倾 + 主光拉平 + 视线外逃
  opening: {
    label: "复原开场",
    cameraYaw: 0,
    actors: {
      lead: { u: 0.52, v: 0.67, light: 0.66, gaze: "outR", silhouette: "standing" },
      sideA: { u: 0.66, v: 0.65, light: 0.66, gaze: "outL", silhouette: "coat" },
      sideB: { u: 0.82, v: 0.68, light: 0.66, gaze: "outR", silhouette: "suit" },
    },
  },
  // 合法解 1：1:1 呼应 303 原海报的正三角结构
  posterPyramid: {
    label: "原海报正三角解",
    cameraYaw: 0,
    actors: {
      lead: { u: 0.51, v: 0.37, light: 1.0, gaze: "sideA", silhouette: "standing" },
      sideA: { u: 0.28, v: 0.77, light: 0.66, gaze: "sideB", silhouette: "coat" },
      sideB: { u: 0.74, v: 0.77, light: 0.54, gaze: "lead", silhouette: "suit" },
    },
  },
  // 合法解 2：电影纵深不等边斜三角解
  depthScalene: {
    label: "电影纵深斜三角解",
    cameraYaw: 0,
    actors: {
      lead: { u: 0.31, v: 0.78, light: 1.0, gaze: "sideB", silhouette: "standing" },
      sideA: { u: 0.73, v: 0.63, light: 0.66, gaze: "lead", silhouette: "coat" },
      sideB: { u: 0.53, v: 0.35, light: 0.46, gaze: "lead", silhouette: "suit" },
    },
  },
  // 合法解 3：2 对 1 叙事博弈杠杆平衡解
  coalition2v1: {
    label: "2 对 1 博弈解",
    cameraYaw: 0,
    actors: {
      lead: { u: 0.73, v: 0.54, light: 1.0, gaze: "sideA", silhouette: "standing" },
      sideA: { u: 0.26, v: 0.79, light: 0.66, gaze: "lead", silhouette: "coat" },
      sideB: { u: 0.36, v: 0.43, light: 0.46, gaze: "lead", silhouette: "suit" },
    },
  },
  // 主动试错 1：人物重叠遮挡
  errOverlap: {
    label: "试错：叠人遮挡",
    cameraYaw: 0,
    actors: {
      lead: { u: 0.49, v: 0.55, light: 1.0, gaze: "sideB", silhouette: "standing" },
      sideA: { u: 0.52, v: 0.60, light: 0.66, gaze: "lead", silhouette: "coat" },
      sideB: { u: 0.72, v: 0.74, light: 0.46, gaze: "lead", silhouette: "suit" },
    },
  },
  // 主动试错 2：三人撑爆各占角落散架
  errDispersed: {
    label: "试错：三角散架",
    cameraYaw: 0,
    actors: {
      lead: { u: 0.50, v: 0.24, light: 1.0, gaze: "sideA", silhouette: "standing" },
      sideA: { u: 0.11, v: 0.84, light: 0.66, gaze: "sideB", silhouette: "coat" },
      sideB: { u: 0.89, v: 0.84, light: 0.46, gaze: "lead", silhouette: "suit" },
    },
  },
  // 主动试错 3：头重脚轻倒尖失稳
  errInverted: {
    label: "试错：倒尖失稳",
    cameraYaw: 0,
    actors: {
      lead: { u: 0.26, v: 0.35, light: 1.0, gaze: "sideB", silhouette: "standing" },
      sideA: { u: 0.76, v: 0.36, light: 0.66, gaze: "sideB", silhouette: "coat" },
      sideB: { u: 0.60, v: 0.81, light: 0.46, gaze: "lead", silhouette: "suit" },
    },
  },
  // 主动试错 4：主次拉平无焦点
  errFlatRank: {
    label: "试错：主次拉平",
    cameraYaw: 0,
    actors: {
      lead: { u: 0.50, v: 0.43, light: 0.66, gaze: "sideA", silhouette: "standing" },
      sideA: { u: 0.30, v: 0.72, light: 0.66, gaze: "sideB", silhouette: "coat" },
      sideB: { u: 0.70, v: 0.72, light: 0.66, gaze: "lead", silhouette: "suit" },
    },
  },
};

export function clonePreset(key) {
  const src = PRESETS[key] || PRESETS.opening;
  return {
    cameraYaw: src.cameraYaw,
    actors: {
      lead: { ...src.actors.lead },
      sideA: { ...src.actors.sideA },
      sideB: { ...src.actors.sideB },
    },
  };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 将角色舞台坐标 (u, v) 经由机位绕拍偏角 cameraYaw 投影到银幕归一化坐标 (sx, sy)
export function projectPoint(u, v, cameraYaw = 0) {
  const rad = (cameraYaw * Math.PI) / 180;
  const cx = 0.5;
  const cz = 0.58;
  const dx = u - cx;
  const dz = v - cz;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  // 绕舞台地板中心横向轨道绕拍：左右偏移混合景深位移，真实模拟机位侧移导致的叠人与张角变化
  const sx = cx + dx * cos - dz * sin * 0.92;
  const sy = cz + dx * sin * 0.34 + dz * cos;
  return { sx: clamp(sx, 0.04, 0.96), sy: clamp(sy, 0.19, 0.90) };
}

// 反向投影：在任意 cameraYaw 下直接拖动人物时，光标与人物脚盘 1:1 严丝合缝跟随
export function unprojectPoint(sx, sy, cameraYaw = 0) {
  const rad = (cameraYaw * Math.PI) / 180;
  const cx = 0.5;
  const cz = 0.58;
  const px = sx - cx;
  const pz = sy - cz;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  // 2×2 线性矩阵 [cos, -0.92*sin; 0.34*sin, cos] 求逆
  const det = cos * cos + 0.92 * 0.34 * sin * sin;
  const dx = (cos * px + 0.92 * sin * pz) / det;
  const dz = (-0.34 * sin * px + cos * pz) / det;
  return {
    u: clamp(cx + dx, 0.09, 0.91),
    v: clamp(cz + dz, 0.23, 0.85),
  };
}

function boxOverlapRatio(a, b) {
  const x0 = Math.max(a.left, b.left);
  const x1 = Math.min(a.right, b.right);
  const y0 = Math.max(a.top, b.top);
  const y1 = Math.min(a.bottom, b.bottom);
  if (x1 <= x0 || y1 <= y0) return 0;
  const inter = (x1 - x0) * (y1 - y0);
  const areaA = (a.right - a.left) * (a.bottom - a.top);
  const areaB = (b.right - b.left) * (b.bottom - b.top);
  return inter / Math.max(1e-6, Math.min(areaA, areaB));
}

function dist(a, b) {
  return Math.hypot(a.sx - b.sx, a.sy - b.sy);
}

// 核心单真源评估函数：直接产出画布几何、视觉权重、视线网络、5 项原则与白话诊单
export function evaluateStage(state) {
  const yaw = state.cameraYaw || 0;
  const scenario = SCENARIOS[state.scenario] || SCENARIOS.stage;

  // 1. 实绘人物几何与视觉权重（大小 × 主光亮度 × 站位势能）
  const nodes = {};
  for (const id of ACTOR_IDS) {
    const a = state.actors[id];
    const { sx, sy } = projectPoint(a.u, a.v, yaw);
    // 人物剪影实绘身高（以画布高度计）：主光略显高大挺拔，贴近原海报比例
    const lightNorm = clamp((a.light - 0.46) / 0.54, 0, 1);
    const height = 0.22 + lightNorm * 0.052 + (sy - 0.55) * 0.032;
    const width = height * 0.30;
    const box = {
      left: sx - width * 0.5,
      right: sx + width * 0.5,
      top: sy - height,
      bottom: sy + 0.018, // 含脚下椭圆站盘底沿
    };
    // 视觉权重（基于实绘面积、亮度对比与高位顶点势能）
    const elevationBoost = 1 + clamp((0.68 - sy) * 0.65, -0.14, 0.28);
    const lumBoost = 0.58 + a.light * 0.92;
    const weight = (width * height * 16) * lumBoost * elevationBoost;
    nodes[id] = {
      id,
      name: scenario.roles[id].name,
      sub: scenario.roles[id].sub,
      u: a.u,
      v: a.v,
      sx,
      sy,
      light: a.light,
      gaze: a.gaze,
      silhouette: a.silhouette,
      width,
      height,
      headX: sx,
      headY: sy - height * 0.85,
      discRx: width * 1.18,
      discRy: 0.024,
      box,
      weight,
    };
  }

  const list = ACTOR_IDS.map((id) => nodes[id]);
  const [p0, p1, p2] = list;

  // 2. 三角形几何真源
  const triArea = 0.5 * Math.abs(
    p0.sx * (p1.sy - p2.sy) +
    p1.sx * (p2.sy - p0.sy) +
    p2.sx * (p0.sy - p1.sy)
  );
  const areaPct = +(triArea * 100).toFixed(1);
  const d01 = dist(p0, p1);
  const d12 = dist(p1, p2);
  const d20 = dist(p2, p0);
  const maxEdge = Math.max(d01, d12, d20, 1e-4);
  const minEdge = Math.min(d01, d12, d20);
  const meanEdge = (d01 + d12 + d20) / 3;
  // 最短高（判断三点是否压扁成直线）
  const minAltitude = (2 * triArea) / maxEdge;

  // 3. 视觉重心 `+` 与偏斜度
  const totalW = list.reduce((s, n) => s + n.weight, 0);
  const centroid = {
    sx: list.reduce((s, n) => s + n.sx * n.weight, 0) / totalW,
    sy: list.reduce((s, n) => s + n.sy * n.weight, 0) / totalW,
  };
  const tiltX = centroid.sx - 0.5;
  const tiltPct = Math.round(Math.abs(tiltX) * 100);
  const tiltDir = tiltX > 0.01 ? "右倾" : tiltX < -0.01 ? "左倾" : "居中";

  // 4. 人物叠撞遮挡与画框边缘净空
  const pairs = [
    [p0, p1],
    [p1, p2],
    [p2, p0],
  ];
  let maxOverlap = 0;
  let overlapPair = null;
  for (const [a, b] of pairs) {
    const ov = boxOverlapRatio(a.box, b.box);
    if (ov > maxOverlap) {
      maxOverlap = ov;
      overlapPair = [a, b];
    }
  }
  const hasOcclusion = maxOverlap > 0.20 || minEdge < 0.11;

  let minMargin = 1;
  let crampedActor = null;
  for (const n of list) {
    const m = Math.min(n.box.left, 1 - n.box.right, n.box.top, 1 - n.box.bottom);
    if (m < minMargin) {
      minMargin = m;
      crampedActor = n;
    }
  }
  const isEdgeCramped = minMargin < 0.036;

  // 5. 三角形态判别（共线 / 散架 / 倒尖失稳 / 正三角 / 斜三角 / 2对1）
  const isCollinear = triArea < 0.038 || minAltitude < 0.095;
  const isDispersed = meanEdge > 0.60 && (isEdgeCramped || minEdge > 0.52);

  const byY = [...list].sort((a, b) => a.sy - b.sy);
  const topGapY = byY[1].sy - byY[0].sy;
  const botGapY = byY[2].sy - byY[1].sy;
  const topWidth = Math.abs(byY[1].sx - byY[0].sx);
  // 两人在高处宽幅压顶、单人落在低处且底点不稳：倒尖失稳
  const isInvertedShape = !isCollinear && topGapY < 0.10 && botGapY > 0.19 && topWidth > 0.34;
  const isInvertedUnstable = isInvertedShape && (Math.abs(byY[2].sx - (byY[0].sx + byY[1].sx) * 0.5) > 0.06 || byY[2].weight < byY[0].weight * 0.72);

  // 6. 主体排序与视觉权重落差
  const byWeight = [...list].sort((a, b) => b.weight - a.weight);
  const primary = byWeight[0];
  const secondary = byWeight[1];
  const tertiary = byWeight[2];
  const rankRatio = +(primary.weight / Math.max(1e-4, secondary.weight)).toFixed(2);
  const thirdShare = tertiary.weight / totalW;
  const isFlatHierarchy = rankRatio < 1.18;
  const isOverDominant = rankRatio > 2.55 && thirdShare < 0.14;

  // 7. 视线循环与连接拓扑
  const inDeg = { lead: 0, sideA: 0, sideB: 0 };
  const outActors = [];
  for (const n of list) {
    if (ACTOR_IDS.includes(n.gaze)) {
      inDeg[n.gaze] += 1;
    } else {
      outActors.push(n);
    }
  }
  const outCount = outActors.length;
  const isStrictCycle =
    outCount === 0 &&
    inDeg.lead === 1 &&
    inDeg.sideA === 1 &&
    inDeg.sideB === 1;
  const isConvergent = outCount === 0 && !isStrictCycle;
  const gazeOk = outCount === 0;
  const gazeLabel = isStrictCycle
    ? "三点闭环"
    : isConvergent
      ? "向心汇聚"
      : outCount === 3
        ? "全员外逃"
        : `${outCount} 人外逃`;

  // 8. 归类形态名称（用于读数与结构态势）
  let formName = "稳固正三角";
  if (isCollinear) formName = "三点共线塌缩";
  else if (hasOcclusion) formName = "人物叠撞遮挡";
  else if (isDispersed) formName = "角落拉散断联";
  else if (isInvertedUnstable) formName = "倒尖高悬失稳";
  else if (Math.abs(byY[2].sy - byY[1].sy) < 0.08 && byY[1].sy - byY[0].sy > 0.20) formName = "经典正三角";
  else if (minEdge < maxEdge * 0.62) formName = "2 对 1 博弈三角";
  else formName = "纵深斜三角";

  // 9. 原海报五大原则独立判定（无写死常量，全从上方真源派生）
  const pTriangle = !isCollinear && !isDispersed && !hasOcclusion;
  const pHierarchy = !isFlatHierarchy && !isOverDominant;
  const pGaze = gazeOk;
  const pStability = Math.abs(tiltX) <= 0.115 && !isEdgeCramped && !isInvertedUnstable;
  const pStory = pTriangle && pGaze && !isFlatHierarchy && !isOverDominant;

  const principles = {
    triangle: {
      pass: pTriangle,
      badge: isCollinear
        ? `共线 ${areaPct}%`
        : hasOcclusion
          ? `遮挡 ${Math.round(maxOverlap * 100)}%`
          : isDispersed
            ? "过散断联"
            : `面积 ${areaPct}%`,
    },
    hierarchy: {
      pass: pHierarchy,
      badge: isFlatHierarchy
        ? `拉平 ${rankRatio.toFixed(2)}×`
        : isOverDominant
          ? `过霸 ${rankRatio.toFixed(2)}×`
          : `落差 ${rankRatio.toFixed(2)}×`,
    },
    gaze: {
      pass: pGaze,
      badge: gazeLabel,
    },
    stability: {
      pass: pStability,
      badge: isInvertedUnstable
        ? "倒尖失稳"
        : isEdgeCramped
          ? "贴边挤压"
          : Math.abs(tiltX) > 0.115
            ? `${tiltDir} ${tiltPct}%`
            : tiltPct <= 3
              ? "重心居中"
              : `${tiltDir} ${tiltPct}%`,
    },
    story: {
      pass: pStory,
      badge: pStory ? formName : "关系断裂",
    },
  };

  // 原海报 5 条「快速检查清单」原句逐条对应
  const checklist = [
    { key: "triangle", text: "三人是否形成清晰的三角关系？", pass: pTriangle },
    { key: "hierarchy", text: "是否有明确的主次与视觉重心？", pass: pHierarchy },
    { key: "gaze", text: "视线是否形成自然的循环或指向？", pass: pGaze },
    { key: "stability", text: "结构是否稳固，有无倾斜或断裂？", pass: pStability },
    { key: "story", text: "人物之间是否存在互动与故事？", pass: pStory },
  ];

  const score = checklist.filter((c) => c.pass).length;

  // 10. 优先级排序的导演白话诊单（说清「为什么」与「怎么改」）
  let issueCode = "pass";
  let headline = "";
  let reason = "";
  let action = "";
  let fixLabel = "校准为原海报正三角";
  let fixType = "posterPyramid";

  if (isCollinear) {
    issueCode = "collinear";
    headline = `三人排成一条横线，三角面积塌到只剩 ${areaPct}%`;
    reason = `三位人物站在相近高度上（最短高仅占画高 ${Math.round(minAltitude * 100)}%），画面失去立体承托面，看起来像僵硬的排队合影。${!pGaze ? "加上视线各自飞向画外，人物之间完全读不出戏剧关联。" : ""}`;
    action = `直接把「${nodes.lead.name}」向上拖高撑起顶点，或拉开前后高低差，让三角面积回到 5% 以上。`;
    fixLabel = "撑开顶点并一键校准";
  } else if (hasOcclusion) {
    issueCode = "occlusion";
    headline = `「${overlapPair[0].name}」与「${overlapPair[1].name}」叠撞遮挡（重叠 ${Math.round(maxOverlap * 100)}%）`;
    reason = yaw !== 0
      ? `当前机位绕拍至 ${yaw > 0 ? "+" : ""}${Math.round(yaw)}°，侧向视角把原本错开的两人压在了同一条视线上，主体轮廓糊成一团。`
      : `两位人物站得太近发生身体遮挡，观众无法在第一时间分辨谁主谁次，三人构图被压成了「两人加一团」。`;
    action = yaw !== 0
      ? "横向拖动空白舞台把机位转回开阔角度，或直接拖开重叠的人物站盘。"
      : `直接拖开「${overlapPair[0].name}」或「${overlapPair[1].name}」，给两人的轮廓留出呼吸通道。`;
    fixLabel = "拉开遮挡并归位";
  } else if (isDispersed) {
    issueCode = "dispersed";
    headline = "三人被拉到画面极端边角，三角纽带已经散架";
    reason = `三位人物平均间距达到画宽 ${Math.round(meanEdge * 100)}%，各自孤立在边角里，眼睛在三点间跳跃成本太高，画面从「一组人的故事」碎成了三张独立肖像。`;
    action = "把靠近边缘的侧点人物向内收拢，让三角形底边保持在画幅中段，四周留出呼吸暗场。";
    fixLabel = "向内收拢三角底边";
  } else if (isEdgeCramped) {
    issueCode = "edge";
    headline = `「${crampedActor.name}」紧贴画框边缘，呼吸空间被压死`;
    reason = `该角色距离画框边界仅剩 ${Math.max(0, Math.round(minMargin * 100))}%，极易在剪辑或不同画幅裁切中被切掉肩膀，同时让整幅画面像要滑出框外。`;
    action = `把「${crampedActor.name}」往画面内侧轻拖，留出至少 5% 以上的安全边留白。`;
    fixLabel = "把贴边人物拉回安全区";
  } else if (isInvertedUnstable) {
    issueCode = "inverted";
    headline = "头重脚轻的倒尖三角，底部支点撑不住画面";
    reason = "两位权重更高的角色悬在上沿左右，底端只剩偏弱的孤点承托，像一根随时倾倒的陀螺。除非剧情刻意拍悬疑失控，否则观感会持续紧张发飘。";
    action = "把底部人物拉高作顶点，或把上方一翼压低回落到底边，重建稳固底座。";
    fixLabel = "翻转成稳固正三角";
  } else if (Math.abs(tiltX) > 0.115) {
    issueCode = "tilt";
    headline = `三人视觉重心${tiltDir} ${tiltPct}%，另一侧空落落失衡`;
    reason = `按面积、主光与高位加权后的中心「+」落在画幅 ${Math.round(centroid.sx * 100)}% 处，画框像翘起来的跷跷板，观众视线会被拖向一侧边缘。`;
    action = `把重的一侧人物往回轻拉，或给轻的一侧补强主光，把中央「+」拉回中轴 ±11% 以内。`;
    fixLabel = "校准视觉重心回中";
  } else if (isFlatHierarchy) {
    issueCode = "flatRank";
    headline = `三人主次拉平（权重比仅 ${rankRatio.toFixed(2)}×），眼睛不知道先看谁`;
    reason = "三个主体的大小、主光亮度与站位高度过于接近，视觉注意力在三者间来回打转。三人构图不是平均分配，必须让一个人先抓眼，再带出另外两人。";
    action = "点击下方主光开关把主角提至「主光」、另两人降为「辅光/弱光」，或把主角抬到更高顶点。";
    fixLabel = "拉开主光与顶点主次";
  } else if (isOverDominant) {
    issueCode = "overDominant";
    headline = `主角权重过霸（${rankRatio.toFixed(2)}×），第三人被边缘化成背景`;
    reason = `最弱角色的视觉占比跌破 ${Math.round(thirdShare * 100)}%，画面实际上已经退化成双人或单人构图，第三人的存在失去叙事必要性。`;
    action = "把最暗或最偏的第三人往三角重心挪近，或将主光落差收敛到适度区间。";
    fixLabel = "恢复三方均衡主次";
  } else if (!pGaze) {
    issueCode = "gaze";
    headline = `${outCount === 3 ? "三人视线全部飞向画外" : `有 ${outCount} 位人物望向画外`}，视觉循环在此断线`;
    reason = `人物视线是画面里看不见的引导线。当「${outActors[0].name}」把目光丢向画框之外，观众的注意力会顺着它的眼神直接溜出画面，三人的互动故事立刻漏气。`;
    action = `直接轻点画布上标红的「${outActors[0].name}」，把它的视线转回另外两人之一，再按空格演播视线脉冲。`;
    fixLabel = "闭合三人视线循环";
    fixType = "closeGaze";
  } else {
    issueCode = "pass";
    headline = `${formName}成立：主次分明，视线在三角内自然回环`;
    reason = `当前三角占画幅 ${areaPct}%，领衔角色「${primary.name}」以 ${rankRatio.toFixed(2)}× 视觉权重锁定第一眼，重心「+」${tiltPct <= 3 ? "稳居中轴" : `${tiltDir}仅 ${tiltPct}%`}，${isStrictCycle ? "三人视线首尾相接形成完整闭环" : "两翼视线向核心聚焦并得到回应"}。`;
    action = "试试切换「电影纵深斜三角解」或「2 对 1 博弈解」，感受不同三角形态如何改写戏剧权力。";
    fixLabel = "演播视线循环";
    fixType = "playGaze";
  }

  // 供顶部印章显示的短状态
  const statusShort =
    score === 5
      ? `5/5 · ${formName}`
      : `${score}/5 · ${
          issueCode === "collinear"
            ? "三点共线"
            : issueCode === "occlusion"
              ? "人物遮挡"
              : issueCode === "dispersed"
                ? "三角散架"
                : issueCode === "edge"
                  ? "贴边挤压"
                  : issueCode === "inverted"
                    ? "倒尖失稳"
                    : issueCode === "tilt"
                      ? `重心${tiltDir}`
                      : issueCode === "flatRank"
                        ? "主次拉平"
                        : issueCode === "overDominant"
                          ? "一霸压死"
                          : "视线外逃"
        }`;

  return {
    nodes,
    list,
    triArea,
    areaPct,
    minAltitude,
    meanEdge,
    maxEdge,
    minEdge,
    centroid,
    tiltX,
    tiltPct,
    tiltDir,
    maxOverlap,
    overlapPair,
    hasOcclusion,
    minMargin,
    crampedActor,
    isEdgeCramped,
    isCollinear,
    isDispersed,
    isInvertedUnstable,
    primary,
    secondary,
    tertiary,
    rankRatio,
    isFlatHierarchy,
    isOverDominant,
    outActors,
    outCount,
    isStrictCycle,
    isConvergent,
    gazeOk,
    gazeLabel,
    formName,
    principles,
    checklist,
    score,
    issueCode,
    statusShort,
    headline,
    reason,
    action,
    fixLabel,
    fixType,
  };
}

// ---------------------------------------------------------------------------
// 03 节「片场平面：I / L / A 调度」单真源俯视→银幕投影模型
// ---------------------------------------------------------------------------
export const FORMATIONS_03 = {
  A: {
    id: "A",
    name: "A 形 · 三角对峙",
    en: "A-FORMATION",
    desc: "三人呈开放三角落位，任何机位都能自然带出前景与后景两层空间，切正反打不易越轴。",
    // 俯视世界坐标 (wx: -1..1 左右, wz: 0.2..1.8 前近后远)
    actors: [
      { id: "A", label: "主", wx: 0.0, wz: 1.48, facing: Math.PI * 0.5, light: 1.0 },
      { id: "B", label: "左", wx: -0.68, wz: 0.68, facing: -0.58, light: 0.68 },
      { id: "C", label: "右", wx: 0.68, wz: 0.68, facing: Math.PI + 0.58, light: 0.56 },
    ],
  },
  L: {
    id: "L",
    name: "L 形 · 二对一转折",
    en: "L-FORMATION",
    desc: "两人并肩站成直角一臂，第三人在转折处面向两人——最适合表现联盟、说服或三方谈判。",
    actors: [
      { id: "A", label: "主", wx: 0.62, wz: 1.32, facing: Math.PI * 0.85, light: 1.0 },
      { id: "B", label: "盟1", wx: -0.62, wz: 1.24, facing: 0.08, light: 0.68 },
      { id: "C", label: "盟2", wx: -0.56, wz: 0.46, facing: -0.62, light: 0.54 },
    ],
  },
  I: {
    id: "I",
    name: "I 形 · 一字横排",
    en: "I-FORMATION",
    desc: "三人排在同一直线上：正面平拍极易呆板扁平，往往需要移到斜侧机位借透视重新拉开纵深。",
    actors: [
      { id: "A", label: "中", wx: 0.0, wz: 1.06, facing: Math.PI * 0.5, light: 0.72 },
      { id: "B", label: "左", wx: -0.74, wz: 1.06, facing: Math.PI * 0.5, light: 0.72 },
      { id: "C", label: "右", wx: 0.74, wz: 1.06, facing: Math.PI * 0.5, light: 0.72 },
    ],
  },
};

export const CAMERAS_03 = {
  master: {
    id: "master",
    label: "机位 1 · 正面定场",
    cx: 0.0,
    cz: -0.72,
    tx: 0.0,
    tz: 1.05,
    note: "标准主镜：把三人整体几何一次交代清楚",
  },
  angle: {
    id: "angle",
    label: "机位 2 · 45° 斜角纵深",
    cx: -1.18,
    cz: -0.25,
    tx: 0.08,
    tz: 1.02,
    note: "斜角切入：能把 I 队形拍出斜线纵深，也能强化 L 阵前景压迫",
  },
  side: {
    id: "side",
    label: "机位 3 · 侧向贴线",
    cx: -1.68,
    cz: 1.02,
    tx: 0.15,
    tz: 1.06,
    note: "贴近轴线侧拍：I 队形会立刻发生严重叠人遮挡",
  },
};

// 将俯视世界坐标经由针孔透视模型（受焦段 focalMm 24–85mm 影响）投影到银幕帧
export function projectFormation03(formationKey, camKey, focalMm = 35) {
  const form = FORMATIONS_03[formationKey] || FORMATIONS_03.A;
  const cam = CAMERAS_03[camKey] || CAMERAS_03.master;
  const fwdX = cam.tx - cam.cx;
  const fwdZ = cam.tz - cam.cz;
  const fwdLen = Math.hypot(fwdX, fwdZ) || 1;
  const fx = fwdX / fwdLen;
  const fz = fwdZ / fwdLen;
  // 右手系水平右轴
  const rx = fz;
  const rz = -fx;
  // 焦段影响视角缩放与透视压缩：长焦需拉远机位保持画面构图近似，但景深前后大小差急剧变小
  const dollyBoost = (focalMm - 35) * 0.042;
  const effCx = cam.cx - fx * dollyBoost;
  const effCz = cam.cz - fz * dollyBoost;
  const fovScale = focalMm / 34;

  const projected = form.actors.map((a) => {
    const vx = a.wx - effCx;
    const vz = a.wz - effCz;
    const depth = Math.max(0.45, vx * fx + vz * fz);
    const lateral = vx * rx + vz * rz;
    const sx = 0.5 + (lateral / depth) * fovScale * 0.62;
    const scale = clamp((1.55 / depth) * (0.64 + focalMm * 0.0115), 0.42, 1.48);
    // 透视地平线在 0.46，越近脚越靠下
    const sy = clamp(0.46 + (0.66 / depth) * (0.72 + focalMm * 0.0085), 0.56, 0.88);
    return { ...a, depth, sx, sy, scale };
  });

  // 实测银幕三角面积、前后大小落差与遮挡
  const [p0, p1, p2] = projected;
  const screenArea = 0.5 * Math.abs(
    p0.sx * (p1.sy - p2.sy) +
    p1.sx * (p2.sy - p0.sy) +
    p2.sx * (p0.sy - p1.sy)
  );
  const scales = projected.map((p) => p.scale);
  const sizeRatio = +(Math.max(...scales) / Math.max(0.01, Math.min(...scales))).toFixed(2);
  let minGapX = 1;
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      minGapX = Math.min(minGapX, Math.abs(projected[i].sx - projected[j].sx));
    }
  }
  const clipped = projected.some((p) => p.sx < 0.09 || p.sx > 0.91);
  const occluded = minGapX < 0.095;

  let verdict = "";
  let tone = "good";
  if (occluded) {
    tone = "bad";
    verdict = `贴线叠人：最小横距仅 ${Math.round(minGapX * 100)}%，前后人物互相挡住轮廓`;
  } else if (clipped) {
    tone = "bad";
    verdict = "焦段偏长或站位过宽，边缘人物已被画框切出";
  } else if (screenArea < 0.018) {
    tone = "warn";
    verdict = `画面压平：三角高差几乎消失（近远尺比仅 ${sizeRatio.toFixed(2)}×），呈平面队列感`;
  } else if (sizeRatio < 1.18 && focalMm >= 65) {
    tone = "warn";
    verdict = `${focalMm}mm 长焦强压缩：近远人物尺比收窄至 ${sizeRatio.toFixed(2)}×，立体纵深变薄`;
  } else {
    tone = "good";
    verdict = `空间清晰：近远人物尺比 ${sizeRatio.toFixed(2)}×，三点在银幕撑出立体三角`;
  }

  return {
    form,
    cam,
    focalMm,
    effCx,
    effCz,
    projected,
    screenAreaPct: +(screenArea * 100).toFixed(1),
    sizeRatio,
    occluded,
    clipped,
    tone,
    verdict,
  };
}

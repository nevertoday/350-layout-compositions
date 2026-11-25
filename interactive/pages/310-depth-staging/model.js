// 310 深度调度 DEPTH STAGING — 唯一真源状态机与光学透视投影模型
// 3D 舞台（Three.js）、2D 降级画布、纵深剖面滑轨与实时体检读数共用此模块，无第二套常量。

export const Z_MIN = 2.8;
export const Z_MAX = 25.5;
export const LANE_MIN = -0.78;
export const LANE_MAX = 0.78;

// 物理与镜头基准（Super 35 / 36x24mm 传感器高度 24mm，标准深度调度参考焦段 35mm）
export const SENSOR_H = 24;
export const REF_FOCAL = 35;
export const REF_Z = 9.5;
export const ASPECT = 16 / 10;
export const PERSON_H = 1.76; // 米
export const PERSON_W = 0.52; // 肩宽，米
export const CAM_Y = 1.54;    // 机位眼高，米

// 三个景层划分边界（经验划分，供滑轨色片、引注与诊断共用）
export const ZONE_FG_MAX = 5.6;   // ≤ 5.6m 归入前景
export const ZONE_MG_MIN = 6.6;   // 6.6–14.8m 归入中景
export const ZONE_MG_MAX = 14.8;
export const ZONE_BG_MIN = 16.2;  // ≥ 16.2m 归入后景

export const FOCALS = [24, 35, 85, 135];

export const ACTORS_META = [
  { id: "A", name: "执信者", short: "A 执信者", en: "COURIER", prop: "briefcase", color: "#8AD6CB", ink: "#051126" },
  { id: "B", name: "中间人", short: "B 中间人", en: "WATCHER", prop: "coat",      color: "#69A9C2", ink: "#08142E" },
  { id: "C", name: "远岸影", short: "C 远岸影", en: "WITNESS", prop: "hat",       color: "#C4B1E1", ink: "#120E30" },
];

export const SCRIPTS = {
  dialogue: {
    id: "dialogue",
    label: "层次对话",
    en: "LAYER DIALOGUE",
    brief: "把三人拉开到前、中、后三个景层，且左右留出视线走廊，让观众一眼同时读出三方关系。",
    goal: "前 / 中 / 后三层各驻 1 人，身高比 ≥ 2.5×，无遮挡",
    initial: {
      focal: 35,
      actors: {
        A: { z: 9.2, lane: -0.13 },
        B: { z: 10.3, lane: 0.01 },
        C: { z: 11.4, lane: 0.14 },
      },
    },
    reference: {
      focal: 35,
      actors: {
        A: { z: 3.4, lane: 0.34 },
        B: { z: 9.8, lane: -0.06 },
        C: { z: 22.0, lane: 0.24 },
      },
    },
  },
  farToNear: {
    id: "farToNear",
    label: "由远及近",
    en: "FAR TO NEAR",
    brief: "先由远岸确立氛围，再把故事核心 A（执信者）拉入前景锁住注意力，B 留在中景承接。",
    goal: "A 占前景（≤ 5.6m）、B 占中景、C 占后景，视线畅通",
    initial: {
      focal: 35,
      actors: {
        A: { z: 12.2, lane: 0.04 },
        B: { z: 11.2, lane: -0.06 },
        C: { z: 13.0, lane: 0.16 },
      },
    },
    reference: {
      focal: 35,
      actors: {
        A: { z: 3.3, lane: 0.32 },
        B: { z: 10.2, lane: -0.18 },
        C: { z: 22.4, lane: 0.14 },
      },
    },
  },
  nearToFar: {
    id: "nearToFar",
    label: "由近及远",
    en: "NEAR TO FAR",
    brief: "以 B 或 C 站进前景一侧做视觉锚框，把真正关键的 A（执信者）推入中后景深处走廊，且不能被近景挡住。",
    goal: "B 或 C 站前景作锚、A 在深处（≥ 10.5m）且三层齐备无遮挡",
    initial: {
      focal: 35,
      actors: {
        A: { z: 4.0, lane: 0.06 },
        B: { z: 4.8, lane: -0.08 },
        C: { z: 9.5, lane: 0.04 },
      },
    },
    reference: {
      focal: 35,
      actors: {
        A: { z: 19.6, lane: -0.04 },
        B: { z: 3.6, lane: -0.44 },
        C: { z: 9.6, lane: 0.32 },
      },
    },
  },
};

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export function classifyZone(z) {
  if (z <= ZONE_FG_MAX) return "fg";
  if (z >= ZONE_BG_MIN) return "bg";
  if (z >= ZONE_MG_MIN && z <= ZONE_MG_MAX) return "mg";
  // 过渡边带就近归类并标记为 edge
  return z < ZONE_MG_MIN ? "fg-edge" : "bg-edge";
}

export function zoneLabel(zone) {
  switch (zone) {
    case "fg": return "前景";
    case "mg": return "中景";
    case "bg": return "后景";
    case "fg-edge": return "前/中过渡";
    case "bg-edge": return "中/后过渡";
    default: return "中景";
  }
}

// 镜头焦段变化时，为保持中景参考面（REF_Z=9.5m）等大，机位沿 Z 轴的物理退距
// 这让 24mm 贴近拉开近大远小，135mm 退远真实呈现空间压扁，而不会原地把前景截成纯黑块
export function cameraShiftZ(focal) {
  const raw = REF_Z * (focal / REF_FOCAL - 1);
  // 广角时保证前景 2.8m 仍有至少 1.55m 物距，避免穿模
  return Math.max(-1.25, raw);
}

// 给定世界坐标 (wx, wy, wz) 投影到归一化画框 [0, 1] x [0, 1]（u 左0右1，v 上0下1）
export function projectPoint(wx, wy, wz, focal) {
  const camZ = -cameraShiftZ(focal); // 机位在世界坐标里的位置（负值=往后退）
  const dz = Math.max(0.6, wz - camZ);
  const tanHalfV = (SENSOR_H / 2) / focal;
  const tanHalfH = tanHalfV * ASPECT;
  const u = 0.5 + wx / (2 * dz * tanHalfH);
  const v = 0.5 - (wy - CAM_Y) / (2 * dz * tanHalfV);
  return { u, v, dz };
}

// 水桥上的通道比例 lane ∈ [-0.78, 0.78] 对应的世界横向米数 wx
// 以参考焦段 35mm 下该深度处半视宽的 64% 映射，让角色在标准焦段里稳落水桥与安全画面内
export function laneToWorldX(lane, z) {
  const refTanH = ((SENSOR_H / 2) / REF_FOCAL) * ASPECT;
  const halfSpan = z * refTanH * 0.62;
  return lane * halfSpan;
}

export function worldXToLane(wx, z) {
  const refTanH = ((SENSOR_H / 2) / REF_FOCAL) * ASPECT;
  const halfSpan = Math.max(0.4, z * refTanH * 0.62);
  return clamp(wx / halfSpan, LANE_MIN, LANE_MAX);
}

// 计算某一帧所有角色的精确屏幕投影、遮挡率与诊断结论
export function evaluateState(state) {
  const focal = state.focal;
  const shift = cameraShiftZ(focal);
  const tanHalfV = (SENSOR_H / 2) / focal;
  const tanHalfH = tanHalfV * ASPECT;

  const projected = ACTORS_META.map((meta) => {
    const pos = state.actors[meta.id];
    const z = clamp(pos.z, Z_MIN, Z_MAX);
    const lane = clamp(pos.lane, LANE_MIN, LANE_MAX);
    const wx = laneToWorldX(lane, z);
    const foot = projectPoint(wx, 0, z, focal);
    const head = projectPoint(wx, PERSON_H, z, focal);
    const hFrac = Math.max(0.02, foot.v - head.v);
    const wFrac = (PERSON_W / (2 * foot.dz * tanHalfH));
    const uMin = foot.u - wFrac * 0.5;
    const uMax = foot.u + wFrac * 0.5;
    const vTop = head.v;
    const vBot = foot.v;
    const clipped = uMin < 0.01 || uMax > 0.99 || vTop < 0.02;
    const zone = classifyZone(z);
    return {
      ...meta,
      z,
      lane,
      wx,
      dz: foot.dz,
      u: foot.u,
      vFoot: foot.v,
      vHead: head.v,
      hFrac,
      wFrac,
      uMin,
      uMax,
      vTop,
      vBot,
      clipped,
      zone,
    };
  });

  // 按深度从近到远排
  const byDepth = [...projected].sort((a, b) => a.z - b.z);
  const nearest = byDepth[0];
  const farthest = byDepth[byDepth.length - 1];
  const depthSpan = +(farthest.z - nearest.z).toFixed(1);
  const heightRatio = +(nearest.hFrac / Math.max(0.01, farthest.hFrac)).toFixed(2);

  // 计算每对角色的真实屏幕横向与面积遮挡（前景挡后景）
  let worstOverlap = 0;
  let blockerPair = null;
  for (let i = 0; i < byDepth.length; i++) {
    for (let j = i + 1; j < byDepth.length; j++) {
      const front = byDepth[i];
      const back = byDepth[j];
      const interU = Math.max(0, Math.min(front.uMax, back.uMax) - Math.max(front.uMin, back.uMin));
      const interV = Math.max(0, Math.min(front.vBot, back.vBot) - Math.max(front.vTop, back.vTop));
      const backW = Math.max(0.001, back.uMax - back.uMin);
      const backH = Math.max(0.001, back.vBot - back.vTop);
      // 只要纵向有交叠，横向重叠覆盖远景人物身体比例即为遮挡度
      const uCov = interU / backW;
      const vCov = interV / backH;
      const eff = vCov > 0.18 ? uCov * Math.min(1, vCov * 1.35) : 0;
      if (eff > worstOverlap) {
        worstOverlap = eff;
        blockerPair = { front, back, pct: Math.round(eff * 100) };
      }
    }
  }
  const overlapPct = Math.round(worstOverlap * 100);

  // 三层覆盖判定
  const fgActors = projected.filter((p) => p.zone === "fg");
  const mgActors = projected.filter((p) => p.zone === "mg");
  const bgActors = projected.filter((p) => p.zone === "bg");
  const layersFilled = (fgActors.length > 0 ? 1 : 0) + (mgActors.length > 0 ? 1 : 0) + (bgActors.length > 0 ? 1 : 0);

  // 脚本特定角色站位检查
  const actorA = projected.find((p) => p.id === "A");
  const actorB = projected.find((p) => p.id === "B");
  const actorC = projected.find((p) => p.id === "C");

  let scriptRoleOk = true;
  let scriptRoleIssue = "";
  if (state.script === "farToNear") {
    if (actorA.zone !== "fg") {
      scriptRoleOk = false;
      scriptRoleIssue = `「由远及近」要把核心 A（执信者）推进前景（≤ ${ZONE_FG_MAX}m），当前 A 在 ${actorA.z.toFixed(1)}m（${zoneLabel(actorA.zone)}）。`;
    } else if (actorC.zone !== "bg") {
      scriptRoleOk = false;
      scriptRoleIssue = `后景需要 C（远岸影）交代远方环境（≥ ${ZONE_BG_MIN}m），当前 C 在 ${actorC.z.toFixed(1)}m。`;
    }
  } else if (state.script === "nearToFar") {
    if (actorA.z < 10.5) {
      scriptRoleOk = false;
      scriptRoleIssue = `「由近及远」要把真相人物 A（执信者）放到中后景深处（≥ 10.5m），当前 A 停在近处 ${actorA.z.toFixed(1)}m。`;
    } else if (actorB.zone !== "fg" && actorC.zone !== "fg") {
      scriptRoleOk = false;
      scriptRoleIssue = `近处缺少前景锚点：请把 B 或 C 拉入前景一侧（≤ ${ZONE_FG_MAX}m），再透过走廊望向深处的 A。`;
    }
  }

  // 检查四大条件
  const condLayers = layersFilled === 3 && fgActors.length === 1 && mgActors.length === 1 && bgActors.length === 1;
  const condPerspective = heightRatio >= 2.5 && focal <= 50;
  const condSightline = overlapPct < 38;
  const condScript = scriptRoleOk;

  // 严格按优先级报出单一清晰状态（先物理大错，再层次、走廊、镜头、脚本）
  let status = "ok";
  let badge = "深度调度成立";
  let headline = "三层纵深拉开，视线走廊通畅";
  let reason = "";
  let hint = "";

  if (depthSpan < 6.0 || (heightRatio < 1.85 && focal <= 50)) {
    status = "flat";
    badge = "错态 · 平面挤墙";
    headline = `三人都挤在 ${nearest.z.toFixed(1)}–${farthest.z.toFixed(1)}m，画面压成一面平墙`;
    reason = `最近与最远人物身高比只有 ${heightRatio.toFixed(1)}×（低于 2.5× 纵深门槛），眼睛无法从大小差里分出谁主导当下、谁只是背景。`;
    hint = "先在下方景片滑轨里把一人拉进前景（≤ 5.6m），再把另一人推到后景（≥ 16.2m）。";
  } else if (focal >= 85 && depthSpan >= 8.0 && heightRatio < 2.5) {
    status = "compressed";
    badge = "错态 · 长焦压扁";
    headline = `纵深已站开 ${depthSpan}m，但 ${focal}mm 长焦把空间压平了`;
    reason = `为了保住中景构图，${focal}mm 镜头迫使机位退远 ${shift.toFixed(1)}m，把近远身高比压缩到仅 ${heightRatio.toFixed(1)}×——纵深走位被光学抹平了。`;
    hint = "把焦段切回 24mm 或 35mm，让近大远小的透视差重新撑开三层空间。";
  } else if (!condSightline && blockerPair) {
    status = "blocked";
    badge = "错态 · 前后挡死";
    headline = `${blockerPair.front.short}把深处的${blockerPair.back.short}挡住了（重叠 ${overlapPct}%）`;
    reason = "深度调度不是把人叠成一串糖葫芦：前景体量大，只要和后景落在同一条中轴线上，远处交代关系的线索就会被剪影吃掉。";
    hint = `直接在画面里左右拖动${blockerPair.front.short}或${blockerPair.back.short}（或选中滑块按 ↑/↓），错开横向视线走廊。`;
  } else if (!condLayers) {
    status = "missing";
    const missingNames = [];
    if (fgActors.length === 0) missingNames.push("前景");
    if (mgActors.length === 0) missingNames.push("中景");
    if (bgActors.length === 0) missingNames.push("后景");
    if (missingNames.length === 0) {
      badge = "错态 · 过渡踩线";
      headline = "有角色停在景层过渡缝上，三层归属不够干脆";
      reason = "有人落在两层交界的模糊带里，导致层次节奏偏黏连。把三人明确放进前景（≤ 5.6m）、中景（6.6–14.8m）与后景（≥ 16.2m）。";
    } else {
      badge = `错态 · 缺${missingNames.join("与")}`;
      headline = `目前缺少${missingNames.join("与")}，空间叙事断档`;
      reason = missingNames.includes("中景")
        ? "只有一近一远、漏掉中景「承上启下」，观众视线在前景与后景间突然跳空，故事少了中间的桥梁。"
        : `三个景层须各司其职（前景领视、中景承接、后景造境），请把一名角色移入${missingNames[0]}带。`;
    }
    hint = "对照下方三片景片色区，让 A、B、C 在前/中/后三层各占一席。";
  } else if (!condScript) {
    status = "role";
    badge = "错态 · 角色错层";
    headline = "三层景深已拉开，但没对准当前脚本的主次分工";
    reason = scriptRoleIssue;
    hint = "注意看脚本要求哪位角色负责领视、哪位负责远景交代，对调他们的纵深位置。";
  } else {
    status = "ok";
    badge = "调度成立 · 3/3 层";
    headline = `${focal}mm 下拉开 ${depthSpan}m 纵深，近远身高比 ${heightRatio.toFixed(1)}×`;
    reason =
      state.script === "nearToFar"
        ? `${fgActors[0].short}在前景一侧立住锚框，目光穿过干净走廊一路落向深处的 ${actorA.short}——无需切镜，悬念已在画面纵深里自己浮现。`
        : `${fgActors[0].short}在前景确立体量主次，${mgActors[0].short}于中景承上启下，${bgActors[0].short}在远岸圆月下交代环境；视线沿透视桥面顺滑推进，三方关系一帧读清。`;
    hint = "试着切到 135mm 感受长焦压扁纵深，或切换另两套脚本挑战不同主次排布。";
  }

  // 视线层级摘要（简洁防溢框：1人报精确米距，2人报双编号，3人挤同层报拥挤）
  const fmtLayer = (arr) => {
    if (arr.length === 0) return "空缺";
    if (arr.length === 1) return `${arr[0].id} ${arr[0].z.toFixed(1)}m`;
    if (arr.length === 2) return `${arr[0].id}·${arr[1].id} 同层`;
    return "A·B·C 拥挤";
  };
  const layerMap = {
    fg: fmtLayer(fgActors),
    mg: fmtLayer(mgActors),
    bg: fmtLayer(bgActors),
  };

  return {
    focal,
    shift,
    projected,
    byDepth,
    depthSpan,
    heightRatio,
    overlapPct,
    blockerPair,
    layersFilled,
    layerMap,
    checks: {
      layers: condLayers,
      perspective: condPerspective,
      sightline: condSightline,
      script: condScript,
    },
    status,
    badge,
    headline,
    reason,
    hint,
  };
}

export function createStore() {
  const init = SCRIPTS.dialogue.initial;
  const state = {
    script: "dialogue",
    focal: init.focal,
    selected: "A",
    showGuides: true,
    actors: {
      A: { ...init.actors.A },
      B: { ...init.actors.B },
      C: { ...init.actors.C },
    },
  };
  const listeners = new Set();
  const notify = () => {
    const snap = evaluateState(state);
    for (const fn of listeners) fn(state, snap);
  };

  return {
    get state() { return state; },
    eval() { return evaluateState(state); },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    setActorZ(id, z) {
      if (!state.actors[id]) return;
      state.selected = id;
      state.actors[id].z = clamp(z, Z_MIN, Z_MAX);
      notify();
    },
    setActorLane(id, lane) {
      if (!state.actors[id]) return;
      state.selected = id;
      state.actors[id].lane = clamp(lane, LANE_MIN, LANE_MAX);
      notify();
    },
    setActorPos(id, z, lane) {
      if (!state.actors[id]) return;
      state.selected = id;
      state.actors[id].z = clamp(z, Z_MIN, Z_MAX);
      state.actors[id].lane = clamp(lane, LANE_MIN, LANE_MAX);
      notify();
    },
    selectActor(id) {
      if (!state.actors[id]) return;
      state.selected = id;
      notify();
    },
    setFocal(focal) {
      if (!FOCALS.includes(focal)) return;
      state.focal = focal;
      notify();
    },
    toggleGuides() {
      state.showGuides = !state.showGuides;
      notify();
    },
    setScript(scriptId) {
      const sc = SCRIPTS[scriptId];
      if (!sc) return;
      state.script = scriptId;
      state.focal = sc.initial.focal;
      state.selected = "A";
      for (const k of ["A", "B", "C"]) {
        state.actors[k] = { ...sc.initial.actors[k] };
      }
      notify();
    },
    resetInitial() {
      this.setScript(state.script);
    },
    applyReference() {
      const sc = SCRIPTS[state.script];
      state.focal = sc.reference.focal;
      for (const k of ["A", "B", "C"]) {
        state.actors[k] = { ...sc.reference.actors[k] };
      }
      notify();
    },
  };
}

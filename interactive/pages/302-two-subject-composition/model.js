// 302 双人构图 · 单真源几何与导演诊断模型
// 所有画布投影、俯视 180° 机位盘、原则实况灯、诊单文字与读数全部由这份实绘几何派生。

export const SCENES = {
  salon: {
    id: "salon",
    label: "原海报·双人沙龙",
    en: "POSTER SALON",
    roleA: "人物 A（左座）",
    roleB: "人物 B（右座）",
    seatStyle: "bench",
    hint: "暖杏纸底与柔白穹顶光晕，还原 302 原海报经典对坐空间。",
  },
  cafe: {
    id: "cafe",
    label: "咖啡馆博弈",
    en: "CAFE NEGOTIATION",
    roleA: "主导方 A",
    roleB: "回应方 B",
    seatStyle: "table",
    hint: "隔桌对谈，桌沿与高矮座姿直接放大主次气场。",
  },
  platform: {
    id: "platform",
    label: "站台并肩",
    en: "STATION PLATFORM",
    roleA: "同行者 A",
    roleB: "同行者 B",
    seatStyle: "standing",
    hint: "站姿纵深与同向远眺，考验前方留白与视线方向。",
  },
};

// 开场刻意设为 0/5 复合错态：挤撞窒息 + 整体右偏失衡 + 视线背离错高 + 主次拉平 + 副机越轴
export const INITIAL_STATE = {
  scene: "salon",
  ax: 0.05,
  az: 0.0,
  ay: 0.0,
  bx: 0.25,
  bz: 0.0,
  by: 0.0,
  aGaze: "away",
  bGaze: "away",
  aPitch: 0.08,
  bPitch: -0.07,
  camOrbit: 0,
  camBAngle: 142, // 超过 ±90°，落在 180° 轴线对侧（越轴禁区）
  activeCam: "A", // "A" 主机位 | "B" 副机位正反打
  overlay: "all", // "all" | "hierarchy" | "axis" | "eyeline" | "breathing" | "balance"
};

// 五种原海报「常见双人构图形式」均为合法多解，另有三组教学试错态
export const PRESETS = {
  symmetrical: {
    id: "symmetrical",
    name: "对称对话",
    en: "SYMMETRICAL DIALOGUE",
    valid: true,
    note: "原海报主图解：两人势均力敌、平视对望，中间留足呼吸空间，机位稳守轴线同侧。",
    state: {
      ax: -0.32, az: 0.0, ay: 0.0,
      bx: 0.32, bz: 0.0, by: 0.0,
      aGaze: "toward", bGaze: "toward",
      aPitch: 0, bPitch: 0,
      camOrbit: 0, camBAngle: -42, activeCam: "A",
    },
  },
  offset: {
    id: "offset",
    name: "错位对话",
    en: "OFFSET DIALOGUE",
    valid: true,
    note: "高低与前景微微错落，视线沿斜轴自然相连，既交代对话又拉开主次节奏。",
    state: {
      ax: -0.30, az: -0.08, ay: -0.06,
      bx: 0.28, bz: 0.08, by: 0.15,
      aGaze: "toward", bGaze: "toward",
      aPitch: 0, bPitch: 0,
      camOrbit: 4, camBAngle: 44, activeCam: "A",
    },
  },
  layered: {
    id: "layered",
    name: "前后层次",
    en: "LAYERED DEPTH",
    valid: true,
    note: "拉开前后景深，前景大剪影定主视角、后景小剪影做回应，单镜头就有戏剧纵深。",
    state: {
      ax: -0.18, az: -0.32, ay: 0.0,
      bx: 0.28, bz: 0.34, by: 0.0,
      aGaze: "toward", bGaze: "toward",
      aPitch: 0, bPitch: 0,
      camOrbit: -6, camBAngle: 42, activeCam: "A",
    },
  },
  samedir: {
    id: "samedir",
    name: "同向观看",
    en: "SAME DIRECTION",
    valid: true,
    note: "两人望向画外同一目标，右侧留出宽阔视线空间，亲密并行而呼吸通透。",
    state: {
      ax: -0.30, az: -0.14, ay: 0.02,
      bx: -0.04, bz: 0.14, by: 0.0,
      aGaze: "same-right", bGaze: "same-right",
      aPitch: 0, bPitch: 0,
      camOrbit: -8, camBAngle: -34, activeCam: "A",
    },
  },
  diagonal: {
    id: "diagonal",
    name: "对角线构图",
    en: "DIAGONAL BALANCE",
    valid: true,
    note: "一高远一低近斜跨画幅，对角视线拉伸空间张力，用对角重量达成动态平衡。",
    state: {
      ax: -0.30, az: 0.08, ay: 0.24,
      bx: 0.30, bz: -0.08, by: -0.14,
      aGaze: "toward", bGaze: "toward",
      aPitch: 0, bPitch: 0,
      camOrbit: -6, camBAngle: -46, activeCam: "A",
    },
  },
  err_cross: {
    id: "err_cross",
    name: "试错：越轴穿帮",
    en: "JUMP THE LINE",
    valid: false,
    note: "把副机位拖过 180° 轴线后切镜，两人屏幕左右瞬间颠倒，观众立刻迷失方向。",
    state: {
      ax: -0.30, az: 0.0, ay: 0.0,
      bx: 0.30, bz: 0.0, by: 0.0,
      aGaze: "toward", bGaze: "toward",
      aPitch: 0, bPitch: 0,
      camOrbit: 12, camBAngle: 146, activeCam: "B",
    },
  },
  err_crush: {
    id: "err_crush",
    name: "试错：挤撞窒息",
    en: "CRUSHED SPACE",
    valid: false,
    note: "两人间距被压到不足屏宽 8%，缺少负空间缓冲，画面发闷且轮廓险些黏连。",
    state: {
      ax: -0.09, az: -0.04, ay: 0.0,
      bx: 0.10, bz: 0.04, by: 0.0,
      aGaze: "toward", bGaze: "toward",
      aPitch: 0, bPitch: 0,
      camOrbit: 8, camBAngle: -38, activeCam: "A",
    },
  },
  err_split: {
    id: "err_split",
    name: "试错：贴边割裂",
    en: "EDGE SPLIT",
    valid: false,
    note: "两人被推到左右边缘贴框，中间空洞过宽、边缘窒息，像两张互不相干的单人照。",
    state: {
      ax: -0.45, az: 0.0, ay: 0.0,
      bx: 0.45, bz: 0.0, by: 0.0,
      aGaze: "same-left", bGaze: "same-right",
      aPitch: 0, bPitch: 0,
      camOrbit: 0, camBAngle: -40, activeCam: "A",
    },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 将世界坐标 (x, z, y) 按指定机位角 angleDeg（0°=正南正视，±180°=正北越轴反视）投影到归一化画框 [0..1]
export function projectActor(actor, angleDeg, seatStyle = "bench") {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  // 相机绕原点旋转：从正面 (0, -D) 绕 Y 轴旋转 angleDeg
  // 当 angleDeg = 0°：cx = x, cz = z（右为 +x，远为 +z）
  // 当 angleDeg = 180°：cx = -x, cz = -z（彻底越轴反看，左右彻底互换！）
  const cx = actor.x * cos - actor.z * sin;
  const cz = actor.x * sin + actor.z * cos;

  const D = 2.45;
  const depthClamp = clamp(cz, -0.72, 0.85);
  const persp = clamp(D / (D + depthClamp * 1.12), 0.62, 1.48);

  const u = 0.5 + cx * persp * 0.96;
  const bodyW = (seatStyle === "standing" ? 0.135 : 0.175) * persp;
  const bodyH = (seatStyle === "standing" ? 0.56 : 0.52) * persp;

  // 基准落脚/坐底线：越远地平越略高，加上人物自身高度抬升 ay/by
  const floorV = 0.84 - depthClamp * 0.075 - actor.y * 0.44;
  const topV = floorV - bodyH;
  const eyeV = topV + bodyH * 0.145;

  return {
    cx,
    cz: depthClamp,
    persp,
    u,
    left: u - bodyW * 0.5,
    right: u + bodyW * 0.5,
    top: topV,
    bottom: floorV,
    w: bodyW,
    h: bodyH,
    eyeU: u,
    eyeV,
    area: bodyW * bodyH,
  };
}

// 计算两位人物在当前渲染机位下的屏幕朝向（+1 朝右，-1 朝左）
function resolveScreenFacing(actorId, gaze, projA, projB) {
  const aIsLeft = projA.u <= projB.u;
  if (gaze === "toward") {
    if (actorId === "A") return aIsLeft ? 1 : -1;
    return aIsLeft ? -1 : 1;
  }
  if (gaze === "away") {
    if (actorId === "A") return aIsLeft ? -1 : 1;
    return aIsLeft ? 1 : -1;
  }
  if (gaze === "same-right") return 1;
  if (gaze === "same-left") return -1;
  return actorId === "A" ? 1 : -1;
}

export function evaluate(state) {
  const scene = SCENES[state.scene] || SCENES.salon;
  const renderAngle = state.activeCam === "B" ? state.camBAngle : state.camOrbit;

  const actorA = { x: state.ax, z: state.az, y: state.ay };
  const actorB = { x: state.bx, z: state.bz, y: state.by };

  const a = projectActor(actorA, renderAngle, scene.seatStyle);
  const b = projectActor(actorB, renderAngle, scene.seatStyle);

  // 视线朝向（含仰俯偏移后的视线落点）
  const dirA = resolveScreenFacing("A", state.aGaze, a, b);
  const dirB = resolveScreenFacing("B", state.bGaze, a, b);
  a.facing = dirA;
  b.facing = dirB;
  a.eyeU = a.u + dirA * a.w * 0.16;
  b.eyeU = b.u + dirB * b.w * 0.16;
  a.pitch = state.aPitch || 0;
  b.pitch = state.bPitch || 0;

  // 在主视图（Camera A）下也投影一份，用于判定轴线是否被 Camera B 翻转
  const aRef = projectActor(actorA, state.camOrbit, scene.seatStyle);
  const bRef = projectActor(actorB, state.camOrbit, scene.seatStyle);
  const mainLeftIsA = aRef.u <= bRef.u;
  const curLeftIsA = a.u <= b.u;

  // 180° 轴线几何（世界平面）
  const dxW = state.bx - state.ax;
  const dzW = state.bz - state.az;
  const axisAngleRad = Math.atan2(dzW, dxW || 0.0001);
  // 两个机位在世界平面中的位置（围绕中点半径 R=1.15）
  const midX = (state.ax + state.bx) * 0.5;
  const midZ = (state.az + state.bz) * 0.5;
  const camPos = (deg) => {
    const r = (deg * Math.PI) / 180;
    return { x: midX + Math.sin(r) * 1.15, z: midZ - Math.cos(r) * 1.15 };
  };
  const camAWorld = camPos(state.camOrbit);
  const camBWorld = camPos(state.camBAngle);

  // 叉积判断 Camera A 与 Camera B 是否位于对话轴线同侧
  const crossSide = (p) => (p.x - state.ax) * dzW - (p.z - state.az) * dxW;
  const sideA = crossSide(camAWorld);
  const sideB = crossSide(camBWorld);
  const axisCrossed = sideA * sideB < -0.0004 || Math.abs(state.camBAngle) > 92;

  // 左右排序
  const leftP = a.u <= b.u ? a : b;
  const rightP = a.u <= b.u ? b : a;

  // 净间距（两人投影包围盒边缘之间的留白占屏宽比例；若重叠则为负值）
  const rawGap = rightP.left - leftP.right;
  const gapPct = Math.round(rawGap * 100);
  const overlapPct = rawGap < 0 ? Math.round((-rawGap / Math.min(a.w, b.w)) * 100) : 0;

  // 左右画框边缘留白
  const edgeLeft = Math.round(leftP.left * 100);
  const edgeRight = Math.round((1 - rightP.right) * 100);
  const edgeClipped = edgeLeft < 3 || edgeRight < 3 || a.top < 0.03 || b.top < 0.03;

  // 主次面积比（视觉体量比）
  const bigArea = Math.max(a.area, b.area);
  const smallArea = Math.max(0.001, Math.min(a.area, b.area));
  const areaRatio = +(bigArea / smallArea).toFixed(2);
  const dominant = Math.abs(a.area - b.area) < 0.006 ? "equal" : a.area > b.area ? "A" : "B";

  // 视线角度与匹配判断
  const eyeDx = b.eyeU - a.eyeU;
  const eyeDy = b.eyeV - a.eyeV;
  const sightlineDeg = Math.round((Math.atan2(Math.abs(eyeDy), Math.max(0.001, Math.abs(eyeDx))) * 180) / Math.PI);

  const isMutualFacing = dirA !== dirB && ((a.u < b.u && dirA === 1 && dirB === -1) || (a.u > b.u && dirA === -1 && dirB === 1));
  const isSameDir = dirA === dirB;
  const isDiverging = !isMutualFacing && !isSameDir;

  // 同向观看时的前方视线空间（Lead Room）
  const leadRoomPct = isSameDir
    ? Math.round((dirA > 0 ? 1 - rightP.right : leftP.left) * 100)
    : 0;

  // 视线匹配检测：互相看时不能有刻意俯仰错高；同向看时前方不能撞框（>=24%）
  const pitchError = Math.abs(a.pitch) > 0.035 || Math.abs(b.pitch) > 0.035;
  const sameDirBlocked = isSameDir && leadRoomPct < 24;
  const eyelineBroken = isDiverging || pitchError || sameDirBlocked;

  // 视觉重心（面积加权横坐标，加上同向视线延展的心理补偿）
  const totalW = a.area + b.area;
  let comU = (a.u * a.area + b.u * b.area) / totalW;
  // 同向观看时，视线投向前方留白会自然拉动视觉心理平衡（约 0.14 屏宽补偿）
  if (isSameDir && leadRoomPct >= 24) {
    comU += dirA * 0.14;
  }
  const comOffsetPct = Math.round((comU - 0.5) * 100);
  const absComOffset = Math.abs(comOffsetPct);

  // 对称均势判定（用于对称对话合理化 1:1 均等主次）
  const isSymmetricalPoise =
    isMutualFacing &&
    areaRatio <= 1.12 &&
    absComOffset <= 6 &&
    Math.abs(a.eyeV - b.eyeV) < 0.04 &&
    gapPct >= 20 &&
    gapPct <= 54;

  // 5 项原海报核心原则逐一单真源核定
  const pBreathing = (() => {
    if (overlapPct > 8) return { ok: false, tag: `重叠 ${overlapPct}%`, level: "error" };
    if (edgeClipped) return { ok: false, tag: "贴框裁切", level: "error" };
    if (isSameDir) {
      if (gapPct < 5) return { ok: false, tag: `并肩过挤 ${gapPct}%`, level: "error" };
      if (leadRoomPct < 24) return { ok: false, tag: `前空仅 ${leadRoomPct}%`, level: "error" };
      if (gapPct > 42) return { ok: false, tag: `疏离 ${gapPct}%`, level: "warn" };
      return { ok: true, tag: `前空 ${leadRoomPct}%`, level: "pass" };
    }
    if (gapPct < 12) return { ok: false, tag: `挤撞 ${gapPct}%`, level: "error" };
    if (gapPct > 58) return { ok: false, tag: `空洞 ${gapPct}%`, level: "error" };
    return { ok: true, tag: `呼吸 ${gapPct}%`, level: "pass" };
  })();

  const pAxis = (() => {
    if (axisCrossed) return { ok: false, tag: `越轴 ${Math.round(Math.abs(state.camBAngle))}°`, level: "error" };
    if (isDiverging) return { ok: false, tag: "背离断轴", level: "error" };
    if (overlapPct > 12) return { ok: false, tag: "侧拍重影", level: "error" };
    return { ok: true, tag: isSameDir ? "同向共轴" : `同侧 ${sightlineDeg}°`, level: "pass" };
  })();

  const pEyeline = (() => {
    if (isDiverging) return { ok: false, tag: "视线背离", level: "error" };
    if (pitchError) return { ok: false, tag: "视线错高", level: "error" };
    if (sameDirBlocked) return { ok: false, tag: "面框撞墙", level: "error" };
    return { ok: true, tag: isSameDir ? "共视画外" : "视线锁定", level: "pass" };
  })();

  const pBalance = (() => {
    if (edgeClipped) return { ok: false, tag: "边缘失衡", level: "error" };
    if (absComOffset > 12) return { ok: false, tag: `${comOffsetPct > 0 ? "右" : "左"}倾 ${absComOffset}%`, level: "error" };
    return { ok: true, tag: absComOffset <= 3 ? "居中稳衡" : `微偏 ${absComOffset}%`, level: "pass" };
  })();

  const pHierarchy = (() => {
    if (overlapPct > 12) return { ok: false, tag: "互相遮挡", level: "error" };
    if (isSymmetricalPoise) return { ok: true, tag: "均势对称", level: "pass" };
    const heightDiff = Math.abs(a.eyeV - b.eyeV);
    if (areaRatio >= 1.15 || heightDiff >= 0.065) {
      return { ok: true, tag: `主次 ${areaRatio.toFixed(2)}×`, level: "pass" };
    }
    return { ok: false, tag: `拉平 ${areaRatio.toFixed(2)}×`, level: "error" };
  })();

  const principles = {
    hierarchy: pHierarchy,
    axis: pAxis,
    eyeline: pEyeline,
    breathing: pBreathing,
    balance: pBalance,
  };

  const score = Object.values(principles).filter((p) => p.ok).length;

  // 识别成立时的双人构图形式（严格由实绘几何派生）
  let recognized = null;
  if (score === 5) {
    if (isSameDir) recognized = "同向观看";
    else if (isSymmetricalPoise) recognized = "对称对话";
    else if (sightlineDeg >= 13 && Math.abs(a.eyeV - b.eyeV) >= 0.11) recognized = "对角线构图";
    else if (areaRatio >= 1.55) recognized = "前后层次";
    else if (Math.abs(a.eyeV - b.eyeV) >= 0.045 || areaRatio >= 1.15) recognized = "错位对话";
    else recognized = "平衡双人解";
  }

  // 主关系张力档位（诚实标注示意，不用假精确百分比）
  let moodBand = "失序待调（示意）";
  if (score === 5) {
    if (recognized === "对称对话") moodBand = "平等对峙 · 安定（示意）";
    else if (recognized === "前后层次") moodBand = "主客分明 · 纵深（示意）";
    else if (recognized === "同向观看") moodBand = "亲密并行 · 展望（示意）";
    else if (recognized === "对角线构图") moodBand = "斜轴拉扯 · 张力（示意）";
    else moodBand = "错落自然 · 流动（示意）";
  } else if (axisCrossed) {
    moodBand = "跳轴错乱（示意）";
  } else if (overlapPct > 12 || gapPct < 12) {
    moodBand = "逼仄窒息（示意）";
  } else if (isDiverging) {
    moodBand = "各看一方 · 疏离（示意）";
  }

  // 单真源白话诊断（按最致命错误优先排序）
  let diag;
  if (score === 5) {
    diag = {
      status: "pass",
      badge: `5/5 · ${recognized}`,
      title: `成立：${recognized}关系清楚，呼吸与轴线都立住了`,
      body:
        recognized === "对称对话"
          ? `两位人物间距占屏宽 ${gapPct}%，眼线水平锁定，画面重心偏差仅 ${absComOffset}%，正反打副机位稳守 180° 安全半圆——与 302 原海报一样沉稳对等。`
          : recognized === "同向观看"
          ? `两人并肩望向同一侧，前方留出 ${leadRoomPct}% 视线空间，既交代同行默契，又不压迫画框边缘，重心借由视线方向自然稳住。`
          : `画面形成 ${areaRatio.toFixed(2)}× 主次层次，间距 ${gapPct}% 透气不疏离，对话轴线夹角 ${sightlineDeg}° 清晰连通，切到副机位也能严丝合缝接住视线。`,
      hint: "你可以继续横向拖画布绕拍，或切换下方五格原海报形式对比不同戏剧情绪。",
      fixLabel: "切镜验证正反打",
      fixAction: "toggleCut",
    };
  } else if (overlapPct > 12) {
    diag = {
      status: "error",
      badge: `${score}/5 · 人物重影`,
      title: `机位绕得太侧，两人轮廓重叠了 ${overlapPct}%`,
      body: `现在视角几乎沿着两人连线看过去，前景人物直接把后景人物挡成一团黑影，观众分不清谁在说话、目光落在哪里。`,
      hint: "横向往回拖画布把机位拉回安全角，或直接拖开一位人物让出透气缝隙。",
      fixLabel: "拉回机位避开遮挡",
      fixAction: "fixOverlap",
    };
  } else if (axisCrossed && state.activeCam === "B") {
    diag = {
      status: "error",
      badge: `${score}/5 · 越轴穿帮`,
      title: `副机位停在 ${Math.round(state.camBAngle)}°，切镜瞬间两人左右彻底颠倒`,
      body: `副机位越过了两人之间的 180° 对话轴线。主机位里原本在${mainLeftIsA ? "左" : "右"}边的人物 A，切到副机位突然跳到了${curLeftIsA ? "左" : "右"}边，观众的大脑空间地图会瞬间断片。`,
      hint: "在俯视机位盘上把橙色副机位 B 拖回 180° 轴线的暖色安全半圆内。",
      fixLabel: "把副机位拉回安全半圆",
      fixAction: "fixAxis",
    };
  } else if (edgeClipped) {
    diag = {
      status: "error",
      badge: `${score}/5 · 贴边割裂`,
      title: `人物贴到画框边缘（左 ${edgeLeft}% / 右 ${edgeRight}%），画面裂成两半`,
      body: `把两个人硬推向左右边框，中间空出 ${gapPct}% 的死区，边缘却毫无喘息余地——观众看不到互动，只看到两张互不相干的裁剪单人照。`,
      hint: "向画布中央轻拖人物 A 或 B，让边缘留足空间、两人回到可对话的距离。",
      fixLabel: "收拢至舒适对话距",
      fixAction: "fixSplit",
    };
  } else if (!isSameDir && gapPct < 12) {
    diag = {
      status: "error",
      badge: `${score}/5 · 挤撞窒息`,
      title: `两人间距仅占屏宽 ${gapPct}%，负空间被彻底压扁`,
      body: `开场这帧把两人挤在狭小缝隙里，${absComOffset > 12 ? `整体重心还向${comOffsetPct > 0 ? "右" : "左"}倾了 ${absComOffset}%，` : ""}${isDiverging ? "视线也各自背离，" : ""}画框像装不下两个人，互动既发闷又失去方向感。`,
      hint: "直接拖动人物 A 向左拉开呼吸负空间，再点击人物把视线重新对准彼此。",
      fixLabel: "一键拉开呼吸空间并校准",
      fixAction: "fixAllSym",
    };
  } else if (isDiverging || pitchError) {
    diag = {
      status: "error",
      badge: `${score}/5 · 视线脱轴`,
      title: isDiverging ? "两人视线背离外望，对话轴线断掉了" : "两位人物眼线俯仰错偏，目光对不到一块",
      body: isDiverging
        ? "双人构图里最强的隐形连线就是视线。现在两人各看各的画外，中间空有距离却没有来往，观众会误以为冷战或互不认识。"
        : "说话者的目光高过或低过对方眼睛，像在盯着头顶或地板讲话，互动立刻显得僵硬出戏。",
      hint: "直接点击画布中的人物切换朝向，或点下方按钮把视线重新锁定到同一条轴线上。",
      fixLabel: "校准双方对话视线",
      fixAction: "fixEyeline",
    };
  } else if (sameDirBlocked) {
    diag = {
      status: "error",
      badge: `${score}/5 · 视线撞框`,
      title: `两人同向注视，前方却只剩 ${leadRoomPct}% 空间`,
      body: "同向观看的戏眼在「画外共同目标」。现在两人面朝窄边几乎贴墙，目光刚发出就被画框硬截断，闷得透不过气。",
      hint: "把两人整体往反方向拖移，或切换朝向，让目光前方至少留出 28% 以上空间。",
      fixLabel: "为同向视线让出前方留白",
      fixAction: "fixSameDir",
    };
  } else if (axisCrossed) {
    diag = {
      status: "error",
      badge: `${score}/5 · 副机越轴`,
      title: `主画面虽稳，但副机位 B 越过了 180° 轴线（${Math.round(state.camBAngle)}°）`,
      body: "只要你现在切到正反打副机位，人物 A 和 B 就会在银幕上左右互换。开拍前在机位图里就把所有机位锁在同一侧，剪辑台才不会返工。",
      hint: "在俯视机位盘上把副机位 B 拖回暖色安全半圆，或点下方按钮归位。",
      fixLabel: "副机位回归 180° 同侧",
      fixAction: "fixAxis",
    };
  } else if (absComOffset > 12) {
    diag = {
      status: "error",
      badge: `${score}/5 · 重心偏斜`,
      title: `视觉重心向${comOffsetPct > 0 ? "右" : "左"}偏移 ${absComOffset}%，另一侧空塌`,
      body: `两位人物的面积合力偏向画幅一侧，${comOffsetPct > 0 ? "左" : "右"}半边大片留白没有视线或结构承接，画面像翘起的跷跷板。`,
      hint: "横向微调机位角，或把其中一人往空侧拖移几步，把 + 重心符号拉回画幅中段。",
      fixLabel: "回正画面视觉平衡",
      fixAction: "fixBalance",
    };
  } else if (!pHierarchy.ok) {
    diag = {
      status: "error",
      badge: `${score}/5 · 主次拉平`,
      title: `非对称站位下两人体量几乎 1:1（${areaRatio.toFixed(2)}×），主次不明`,
      body: "如果画面不是严谨的对称均势构图，却又把两人拍得一样大、一样高，观众的目光会在两人之间犹豫打转，不知道该先看谁。",
      hint: "横拖画布绕开一点机位制造前后大小层次，或上下拖动一人做出高低错位，或者归正成严谨对称对话。",
      fixLabel: "拉开前后主次层次",
      fixAction: "fixHierarchy",
    };
  } else {
    diag = {
      status: "error",
      badge: `${score}/5 · 空间疏离`,
      title: `两人间距拉到 ${gapPct}%，中段空洞开始削弱对话感`,
      body: "负空间能透气，但拉得太宽会把一条对话拆成两座孤岛；除非剧情刻意表达决裂冷战，常规双人对话建议把净距收在 18%–52% 之间。",
      hint: "把任意一人朝中间靠拢一点，让对话轴线重新紧绷起来。",
      fixLabel: "收紧至自然对话距",
      fixAction: "fixAllSym",
    };
  }

  return {
    scene,
    renderAngle,
    a,
    b,
    leftP,
    rightP,
    camAWorld,
    camBWorld,
    axisAngleRad,
    axisCrossed,
    mainLeftIsA,
    curLeftIsA,
    isMutualFacing,
    isSameDir,
    isDiverging,
    isSymmetricalPoise,
    metrics: {
      gapPct,
      overlapPct,
      edgeLeft,
      edgeRight,
      leadRoomPct,
      areaRatio,
      dominant,
      sightlineDeg,
      comU,
      comOffsetPct,
      moodBand,
    },
    principles,
    score,
    recognized,
    diag,
  };
}

// 03 节专用：360° 正反打剪辑台单真源计算
export function evaluateCutLab(cut) {
  // 人物 A 固定在 (-0.34, 0)，人物 B 固定在 (+0.34, 0)，180° 轴线即水平 X 轴 (z = 0)
  // 机位 A 固定在安全南侧 -38°（偏向 A 过肩拍 B，A 在左、B 在右，A 朝右看）
  // 机位 B 角度 angleB 在 -180°..+180°（0°=正南，±90°=正踩轴线，>90° 或 <-90° = 越轴北侧）
  const absB = Math.abs(cut.angleB);
  const crossed = absB > 92;
  const onAxis = absB >= 84 && absB <= 96;
  const pitchDiff = cut.eyeMismatch; // -1 低看 | 0 平齐 | +1 过顶

  // 在 Cut 1（机位 A）里，A 始终在屏幕左，朝右看 (+1)
  // 在 Cut 2（机位 B）里：若未越轴，B 在右、朝左看 (-1)，与 A 对望；若越轴，B 跑到左、朝右看 (+1)，同向穿帮！
  const cut2BOnRight = !crossed;
  const cut2BFacing = crossed ? 1 : -1;

  let verdict, headline, detail;
  if (crossed) {
    verdict = "error";
    headline = `已越过 180° 轴线（${Math.round(cut.angleB)}°）：切镜瞬间左右颠倒`;
    detail = "镜头 1 里人物 A 朝右看；切到越轴的镜头 2 后，人物 B 也变成了朝右看，且屏幕左右方位翻转。观众会瞬间怀疑 B 身后是不是又站了第三个人。";
  } else if (onAxis) {
    verdict = "warn";
    headline = `机位踩在轴线临界点（${Math.round(cut.angleB)}°）：中性过渡位`;
    detail = "相机几乎贴着两人连线拍摄（正对镜头或极窄侧影）。在电影剪辑里，中性轴线镜头常被用作「安全过轴的缓冲跳板」，但直接正反打容易显得人物重叠。";
  } else if (pitchDiff !== 0) {
    verdict = "error";
    headline = `轴线同侧成立，但眼线高度错位（${pitchDiff > 0 ? "偏高盯额头" : "偏低看桌面"}）`;
    detail = "虽然两台机位都守在 180° 安全区，但镜头 2 的视线俯仰和镜头 1 对不上——切过去时，人物 B 像在越过 A 的头顶看空气或低头躲避。";
  } else {
    verdict = "pass";
    headline = `180° 同侧 + 视线匹配成立（机位 B：${Math.round(cut.angleB)}°）`;
    detail = "镜头 1 中人物 A 居左望向右画外，切到镜头 2 中人物 B 居右望向左画外，眼线高度齐平。哪怕两人分拍两张单人镜头，观众脑中也会自动缝合成一场自然面对面交谈。";
  }

  return {
    crossed,
    onAxis,
    pitchDiff,
    cut2BOnRight,
    cut2BFacing,
    verdict,
    headline,
    detail,
  };
}

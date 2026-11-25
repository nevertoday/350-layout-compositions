// 075 等距构图 · 单真源几何与投影模型
// 所有视角投影、三轴夹角、缩短比、前后像素尺度比与状态诊断均由同一组三维投影方程实算。

export const ISO_PITCH = (Math.asin(1 / Math.sqrt(3)) * 180) / Math.PI; // 35.26438968°
export const ISO_SCALE = Math.sqrt(2 / 3); // 0.81649658
export const PIXEL_DIMETRIC_PITCH = 30; // sin(30°)=0.5 -> 地平面斜率 1:2 (26.565°)
export const ISO_YAWS = [45, 135, 225, 315];

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

export function normAngle(deg) {
  return ((deg % 360) + 360) % 360;
}

export function angleDiff(a, b) {
  let d = ((a - b + 540) % 360) - 180;
  return d;
}

// 统一的三维→屏幕二维投影（+X 右前，+Y 竖直向上，+Z 左前）
// 返回屏幕归一化坐标 (sx, sy)（+sx 向右，+sy 向下）与相机深度 zc（越大越近）及透视缩放系数 factor
export function projectPoint(p, { yaw, pitch, persp = 0, scale = 1, cx = 0, cy = 0 }) {
  const th = yaw * DEG;
  const ph = pitch * DEG;
  const ct = Math.cos(th);
  const st = Math.sin(th);
  const cp = Math.cos(ph);
  const sp = Math.sin(ph);

  const x1 = p.x * ct - p.z * st;
  const z1 = p.x * st + p.z * ct;
  const y1 = p.y;

  const xc = x1;
  const yc = y1 * cp - z1 * sp;
  const zc = y1 * sp + z1 * cp;

  // persp in [0, 1]：0 为严格平行投影，>0 为针孔透视汇聚
  const k = persp * 0.19;
  const denom = Math.max(0.28, 1 - k * zc);
  const factor = 1 / denom;

  return {
    sx: cx + xc * factor * scale,
    sy: cy - yc * factor * scale,
    xc,
    yc,
    zc,
    factor,
  };
}

// 计算当前相机视向单位向量（指向观察者）
export function viewVector(yaw, pitch) {
  const th = yaw * DEG;
  const ph = pitch * DEG;
  return {
    x: Math.sin(th) * Math.cos(ph),
    y: Math.sin(ph),
    z: Math.cos(th) * Math.cos(ph),
  };
}

// 从正交投影方向实算三条世界主轴在屏幕上的角度、夹角与缩短比（单真源）
export function computeAxesMetrics(yaw, pitch) {
  const o = projectPoint({ x: 0, y: 0, z: 0 }, { yaw, pitch, persp: 0, scale: 1 });
  // 选择朝向观察者的两条水平正半轴（确保在四个等角象限 45/135/225/315 都测得一致的三岔轴）
  const v = viewVector(yaw, pitch);
  const sxDir = v.x >= 0 ? 1 : -1;
  const szDir = v.z >= 0 ? 1 : -1;

  const pY = projectPoint({ x: 0, y: 1, z: 0 }, { yaw, pitch, persp: 0, scale: 1 });
  const pA = projectPoint({ x: sxDir, y: 0, z: 0 }, { yaw, pitch, persp: 0, scale: 1 });
  const pB = projectPoint({ x: 0, y: 0, z: szDir }, { yaw, pitch, persp: 0, scale: 1 });

  const vec = (p) => {
    const dx = p.sx - o.sx;
    const dy = p.sy - o.sy; // +y 向下
    const len = Math.hypot(dx, dy);
    const deg = normAngle(Math.atan2(dy, dx) * RAD);
    return { dx, dy, len, deg };
  };

  const aY = vec(pY);
  const a1 = vec(pA);
  const a2 = vec(pB);

  // 分清屏幕右下轴 (rightAxis) 和左下轴 (leftAxis)
  const rightAxis = a1.dx >= a2.dx ? a1 : a2;
  const leftAxis = a1.dx >= a2.dx ? a2 : a1;

  const sep = (u, w) => {
    const dot = (u.dx * w.dx + u.dy * w.dy) / (Math.max(1e-6, u.len) * Math.max(1e-6, w.len));
    return Math.acos(Math.max(-1, Math.min(1, dot))) * RAD;
  };

  const angYR = sep(aY, rightAxis);
  const angYL = sep(aY, leftAxis);
  const angRL = 360 - angYR - angYL;

  // 地平面两条边与水平线的夹角（标准等角为 30° / 30°，2:1 像素为 26.57° / 26.57°）
  const groundRight = Math.abs(Math.atan2(Math.abs(rightAxis.dy), Math.max(1e-6, Math.abs(rightAxis.dx))) * RAD);
  const groundLeft = Math.abs(Math.atan2(Math.abs(leftAxis.dy), Math.max(1e-6, Math.abs(leftAxis.dx))) * RAD);

  const scales = [aY.len, rightAxis.len, leftAxis.len];
  const maxScale = Math.max(...scales);
  const minScale = Math.min(...scales);
  const scaleSpread = maxScale - minScale;
  const maxAngleDev = Math.max(Math.abs(angYR - 120), Math.abs(angYL - 120), Math.abs(angRL - 120));

  return {
    aY,
    rightAxis,
    leftAxis,
    angYR,
    angYL,
    angRL,
    groundRight,
    groundLeft,
    scaleY: aY.len,
    scaleR: rightAxis.len,
    scaleL: leftAxis.len,
    scaleRatioMinMax: minScale / Math.max(1e-6, maxScale),
    scaleSpread,
    maxAngleDev,
  };
}

// 三个可选的模块化场景题材
export const PRESETS = {
  poster: {
    id: "poster",
    label: "原海报 · 等距塔",
    center: { x: 1.5, y: 1.35, z: 1.5 },
    // 1:1 承袭 075 原海报的奶油/电光紫/翡翠绿/深靛蓝模块堆叠，带「等距构图」字块与右侧阶梯
    voxels: [
      // 底层基座
      { x: 0, y: 0, z: 0, tone: "mint" },
      { x: 1, y: 0, z: 0, tone: "indigo" },
      { x: 2, y: 0, z: 0, tone: "mint" },
      { x: 0, y: 0, z: 1, tone: "mint" },
      { x: 1, y: 0, z: 1, tone: "violet" },
      { x: 2, y: 0, z: 1, tone: "mint" },
      { x: 0, y: 0, z: 2, tone: "violet" },
      { x: 1, y: 0, z: 2, tone: "violet", arch: true },
      { x: 2, y: 0, z: 2, tone: "mint" },
      { x: 3, y: 0, z: 1, tone: "violet", stair: true },
      { x: 3, y: 0, z: 2, tone: "violet" },
      // 二层主体与「等」「距」「构」「图」海报立体字面
      { x: 0, y: 1, z: 0, tone: "indigo" },
      { x: 1, y: 1, z: 0, tone: "violet" },
      { x: 2, y: 1, z: 0, tone: "mint" },
      { x: 0, y: 1, z: 1, tone: "cream", glyphLeft: "等" },
      { x: 1, y: 1, z: 1, tone: "cream", glyphLeft: "距" },
      { x: 2, y: 1, z: 1, tone: "cream", glyphLeft: "构", glyphRight: "构" },
      { x: 2, y: 1, z: 0, tone: "mint", glyphRight: "图" },
      // 三层塔顶
      { x: 0, y: 2, z: 0, tone: "violet" },
      { x: 1, y: 2, z: 0, tone: "mint" },
      { x: 0, y: 2, z: 1, tone: "violet" },
      // 四层顶块
      { x: 0, y: 3, z: 0, tone: "violet" },
    ],
    rogueTarget: { x: 3, y: 1, z: 2, tone: "violet" },
  },
  pavilion: {
    id: "pavilion",
    label: "阶梯展馆",
    center: { x: 1.5, y: 1.15, z: 1.5 },
    voxels: [
      { x: 0, y: 0, z: 0, tone: "mint" },
      { x: 1, y: 0, z: 0, tone: "mint" },
      { x: 2, y: 0, z: 0, tone: "violet" },
      { x: 3, y: 0, z: 0, tone: "mint" },
      { x: 0, y: 0, z: 1, tone: "indigo" },
      { x: 1, y: 0, z: 1, tone: "cream" },
      { x: 2, y: 0, z: 1, tone: "mint" },
      { x: 3, y: 0, z: 1, tone: "violet", stair: true },
      { x: 0, y: 0, z: 2, tone: "violet" },
      { x: 1, y: 0, z: 2, tone: "mint" },
      { x: 2, y: 0, z: 2, tone: "violet", arch: true },
      { x: 0, y: 1, z: 0, tone: "violet" },
      { x: 1, y: 1, z: 0, tone: "cream", glyphLeft: "秩" },
      { x: 2, y: 1, z: 0, tone: "cream", glyphLeft: "序", glyphRight: "模" },
      { x: 0, y: 1, z: 1, tone: "mint" },
      { x: 0, y: 2, z: 0, tone: "cream" },
      { x: 1, y: 2, z: 0, tone: "violet" },
    ],
    rogueTarget: { x: 3, y: 0, z: 2, tone: "violet" },
  },
  workshop: {
    id: "workshop",
    label: "像素工坊",
    center: { x: 1.5, y: 1.2, z: 1.5 },
    voxels: [
      { x: 0, y: 0, z: 0, tone: "indigo" },
      { x: 1, y: 0, z: 0, tone: "mint" },
      { x: 2, y: 0, z: 0, tone: "mint" },
      { x: 0, y: 0, z: 1, tone: "violet" },
      { x: 1, y: 0, z: 1, tone: "cream" },
      { x: 2, y: 0, z: 1, tone: "violet" },
      { x: 0, y: 0, z: 2, tone: "mint" },
      { x: 1, y: 0, z: 2, tone: "violet", arch: true },
      { x: 2, y: 0, z: 2, tone: "mint" },
      { x: 3, y: 0, z: 0, tone: "violet", stair: true },
      { x: 0, y: 1, z: 0, tone: "cream", glyphLeft: "等" },
      { x: 1, y: 1, z: 0, tone: "cream", glyphLeft: "比", glyphRight: "块" },
      { x: 2, y: 1, z: 2, tone: "violet" },
      { x: 0, y: 1, z: 2, tone: "cream" },
      { x: 0, y: 2, z: 0, tone: "mint" },
      { x: 2, y: 2, z: 2, tone: "cream" },
    ],
    rogueTarget: { x: 3, y: 0, z: 2, tone: "violet" },
  },
};

// 去重构建体素数组副本（避免 poster 预设里坐标重叠）
export function clonePresetVoxels(presetId) {
  const src = PRESETS[presetId] || PRESETS.poster;
  const map = new Map();
  for (const v of src.voxels) {
    const key = `${v.x},${v.y},${v.z}`;
    const prev = map.get(key);
    map.set(key, prev ? { ...prev, ...v } : { ...v });
  }
  return [...map.values()];
}

// 开场默认处于 0/3 错态（透视未归零 + 三轴偏角 + 偏轴游离块）
export function createInitialState(presetId = "poster") {
  return {
    preset: presetId,
    yaw: 27, // 偏离 45° 等角位
    pitch: 19, // 偏离 35.26° 等角俯仰
    persp: 0.48, // 48% 透视汇聚（前后体量明显不等）
    rogueFixed: false, // 右前角紫块偏转 +18° 脱离三轴网格
    tool: "add", // "add" | "remove"
    showGrid: true,
    showRays: true,
    voxels: clonePresetVoxels(presetId),
    addedCount: 0,
  };
}

// 吸附检测：靠近 4 组对称等角方位 (45/135/225/315) 与 35.264° 俯角时轻柔归位
export function snapAngles(yaw, pitch) {
  let ny = normAngle(yaw);
  let np = Math.max(8, Math.min(68, pitch));
  for (const target of ISO_YAWS) {
    if (Math.abs(angleDiff(ny, target)) <= 2.6) {
      ny = target;
      break;
    }
  }
  if (Math.abs(np - ISO_PITCH) <= 2.0) np = ISO_PITCH;
  return { yaw: ny, pitch: np };
}

// 从当前实绘的所有方块里，实算最前排与最远端标准 1×1×1 方块在屏幕上的垂直边像素高度比
export function measureFrontBackScale(state, unitScale = 56) {
  const preset = PRESETS[state.preset] || PRESETS.poster;
  const c = preset.center;
  let nearH = 0;
  let farH = 0;
  let maxZc = -Infinity;
  let minZc = Infinity;

  for (const v of state.voxels) {
    const pBot = projectPoint(
      { x: v.x + 0.5 - c.x, y: v.y - c.y, z: v.z + 0.5 - c.z },
      { yaw: state.yaw, pitch: state.pitch, persp: state.persp, scale: unitScale }
    );
    const pTop = projectPoint(
      { x: v.x + 0.5 - c.x, y: v.y + 1 - c.y, z: v.z + 0.5 - c.z },
      { yaw: state.yaw, pitch: state.pitch, persp: state.persp, scale: unitScale }
    );
    const pxH = Math.hypot(pTop.sx - pBot.sx, pTop.sy - pBot.sy);
    if (pBot.zc > maxZc) {
      maxZc = pBot.zc;
      nearH = pxH;
    }
    if (pBot.zc < minZc) {
      minZc = pBot.zc;
      farH = pxH;
    }
  }

  const ratio = farH > 1e-3 ? nearH / farH : 1;
  return { nearH, farH, ratio };
}

// 单真源诊断器：同时检查三项硬指标并识别 7 类几何状态
export function diagnose(state, unitScale = 56) {
  const axes = computeAxesMetrics(state.yaw, state.pitch);
  const fb = measureFrontBackScale(state, unitScale);

  // 三项达标条件（支持 4 个等角象限任意合法解）
  const nearestIsoYaw = ISO_YAWS.reduce((best, y) =>
    Math.abs(angleDiff(state.yaw, y)) < Math.abs(angleDiff(state.yaw, best)) ? y : best
  );
  const yawErr = Math.abs(angleDiff(state.yaw, nearestIsoYaw));
  const pitchErr = Math.abs(state.pitch - ISO_PITCH);

  const okPersp = state.persp <= 0.025;
  const okAngles = axes.maxAngleDev <= 2.2 && axes.scaleSpread <= 0.03;
  const okModular = state.rogueFixed;

  const score = (okPersp ? 1 : 0) + (okAngles ? 1 : 0) + (okModular ? 1 : 0);

  // 特别识别：2:1 像素二等轴测（方位近 45°，俯角近 30° ± 2.2°）
  const isPixelDimetric = yawErr <= 3.5 && Math.abs(state.pitch - PIXEL_DIMETRIC_PITCH) <= 2.2 && !okAngles;
  const isTooFlat = state.pitch < 14;
  const isTooSteep = state.pitch > 54;

  let code = "pass";
  let badge = `3/3 等距就位 · ${nearestIsoYaw}° 象限`;
  let headline = "三轴 120° 等角锁定，近远体量误差归零";
  let body = `当前方位 ${Math.round(normAngle(state.yaw))}°、俯仰 ${state.pitch.toFixed(1)}°、透视汇聚 0%，三条空间轴屏幕夹角 ${axes.angYR.toFixed(0)}° / ${axes.angYL.toFixed(0)}° / ${axes.angRL.toFixed(0)}°，三轴缩短比一致为 ${axes.scaleY.toFixed(3)}（约 0.816）。最前排与最远端标准方块屏幕高度同为 ${fb.nearH.toFixed(1)}px（1.00 : 1），点击任意模块面可继续自由搭装扩展。`;
  let nextTip = "试着直接点击远处与近处方块表面叠加新模块，观察它们始终保持完全相同的屏幕边长；也可以拖到 135° / 225° / 315° 检验另三组等角解。";
  let severity = "ok";

  if (!okPersp) {
    code = "perspective";
    severity = "err";
    badge = `${score}/3 错态 · 透视汇聚 ${Math.round(state.persp * 100)}%`;
    headline = `前后同尺寸模块差了 ${fb.ratio.toFixed(2)} 倍，平行线正在收拢`;
    body = `透视汇聚仍开在 ${Math.round(state.persp * 100)}%，最前排立方体高 ${fb.nearH.toFixed(1)}px，最远端缩水到 ${fb.farH.toFixed(1)}px。只要存在消失点，同一块标准模块挪到后排就得重画缩放，破坏等距构图「无透视汇聚、保持体量一致」的根基。`;
    nextTip = "先把「透视汇聚」滑轨拖到 0%，让所有红色收敛射线退向无穷远、重归严格平行。";
  } else if (isTooFlat) {
    code = "flat";
    severity = "err";
    badge = `${score}/3 错态 · 俯角过平 ${state.pitch.toFixed(1)}°`;
    headline = `俯仰角仅 ${state.pitch.toFixed(1)}°，奶油顶面被压成细条`;
    body = `俯角太接近水平立面，垂直轴几乎不缩短（${axes.scaleY.toFixed(2)}），顶面却失去展开空间，画面滑向扁平正立面，三轴无法呈现均衡的立体模块关系。`;
    nextTip = "在画布向下拖（或把「俯仰角」推到 35.3°），抬高视点直到奶油顶面与紫/绿双侧面面积完全相等。";
  } else if (isTooSteep) {
    code = "steep";
    severity = "err";
    badge = `${score}/3 错态 · 俯角过陡 ${state.pitch.toFixed(1)}°`;
    headline = `俯角高达 ${state.pitch.toFixed(1)}°，竖直高度严重压短`;
    body = `视点压得太像俯视平面图，竖直轴缩短到 ${axes.scaleY.toFixed(2)}，建筑层高显得矮胖，三轴等比关系（0.816 : 0.816 : 0.816）被打破。`;
    nextTip = "把「俯仰角」降回 35.3°，让三条坐标轴在屏幕上均分 120°。";
  } else if (isPixelDimetric) {
    code = "dimetric";
    severity = "warn";
    badge = `${score}/3 近似 · 2:1 像素二等轴测`;
    headline = `你停在了游戏像素常用的 2:1 二等轴测（底边 ${axes.groundRight.toFixed(1)}°）`;
    body = `在 30.0° 俯角下，底边倾角恰好是 arctan(1/2) ≈ 26.6°，能走出干净的「横 2 竖 1」像素阶梯；但它不是严格等角——竖直轴缩短比 ${axes.scaleY.toFixed(3)} 大于水平轴 ${axes.scaleR.toFixed(3)}，三轴夹角为 ${axes.angYR.toFixed(1)}° / ${axes.angYL.toFixed(1)}° / ${axes.angRL.toFixed(1)}°。`;
    nextTip = "把「俯仰角」从 30.0° 微抬到 35.3°，亲眼看三轴锁死 120° 且缩短比同时收敛到 0.816。";
  } else if (!okAngles) {
    code = "angles";
    severity = "err";
    badge = `${score}/3 错态 · 三轴偏斜 ${axes.maxAngleDev.toFixed(0)}°`;
    headline = `三轴夹角是 ${axes.angYR.toFixed(0)}° / ${axes.angYL.toFixed(0)}° / ${axes.angRL.toFixed(0)}°，尚未均分 120°`;
    body = `当前方位 ${Math.round(normAngle(state.yaw))}°、俯仰 ${state.pitch.toFixed(1)}°，三轴缩短比分别为 ${axes.scaleY.toFixed(2)} / ${axes.scaleR.toFixed(2)} / ${axes.scaleL.toFixed(2)}。左右两面宽窄失衡，正方体看起来像被压歪的斜柱。`;
    nextTip = `直接在画布横向拖动把方位旋到 ${nearestIsoYaw}°（45°/135°/225°/315° 任一象限皆可），并把俯仰调至 35.3°。`;
  } else if (!okModular) {
    code = "rogue";
    severity = "err";
    badge = `${score}/3 错态 · 1 枚模块偏轴 +18°`;
    headline = "右前角游离紫块脱离了三轴晶格，打断平行秩序";
    body = "海报「等距逻辑」强调「所有线条平行于三条等角轴方向」。即便相机已锁死 120°，画面里只要有一块脱离三轴斜率、私自歪转 +18°，整体模块化秩序就会瞬间漏气。";
    nextTip = "直接点击画布上带莓红虚线标牌的偏轴紫块（或点「归位偏轴块」），把它吸附回等角晶格。";
  }

  return {
    axes,
    fb,
    okPersp,
    okAngles,
    okModular,
    isPixelDimetric,
    score,
    code,
    severity,
    badge,
    headline,
    body,
    nextTip,
    nearestIsoYaw,
  };
}

// ---------- Section 01：三种制图标准对比数据 ----------
export const STANDARDS = {
  trueIso: {
    id: "trueIso",
    label: "严格等角投影（ISO）",
    en: "TRUE ISOMETRIC PROJECTION",
    groundDeg: 30,
    pitchDeg: ISO_PITCH,
    scaleXYZ: [0.816, 0.816, 0.816],
    pixelNote: "底边 30°（斜率 tan 30° ≈ 0.577）落在整数像素网格上会产生 2-2-1-2 的不规则锯齿。",
    summary: "把三维物体绕纵轴转 45°、再前倾 35.264° 正交投影得到：三轴夹角严格 120°，每条轴等比缩短为 √(2/3) ≈ 0.816。",
  },
  isoDrawing: {
    id: "isoDrawing",
    label: "1:1 等距画法（简化）",
    en: "1:1 ISOMETRIC DRAWING",
    groundDeg: 30,
    pitchDeg: ISO_PITCH,
    scaleXYZ: [1.0, 1.0, 1.0],
    pixelNote: "轮廓倾角同为 30°，但设计师免去乘 0.816 的麻烦，直接按 1:1 实长画轴——成品等比放大 √(3/2) ≈ 1.225 倍。",
    summary: "工程与平面设计中最常用的快捷画法：保留 120° 等角与三轴等比，直接用原尺寸量取，视觉比例与严格投影完全一致。",
  },
  pixel21: {
    id: "pixel21",
    label: "2:1 像素二等轴测",
    en: "2:1 PIXEL DIMETRIC",
    groundDeg: 26.565,
    pitchDeg: 30,
    scaleXYZ: [0.791, 0.866, 0.791],
    pixelNote: "底边严格走「横 2 格、竖 1 格」（arctan 1/2 ≈ 26.565°），每级像素台阶均匀利落，零杂齿。",
    summary: "经典 2D 等距游戏的行业秘密：它其实是「二等轴测」而非真等角，两水平轴等长（0.791）但竖直轴略长（0.866），用 3.4° 的角度微调换取屏幕像素绝对锐利。",
  },
};

// ---------- Section 03：4×4 模块化地块初始布局 ----------
export const TILE_TYPES = [
  { id: "cube", label: "立方体", en: "CUBE" },
  { id: "stair", label: "阶梯", en: "STAIR" },
  { id: "arch", label: "拱门", en: "ARCH" },
  { id: "tower", label: "双层柱", en: "TOWER" },
  { id: "empty", label: "清空", en: "CLEAR" },
];

export const INITIAL_GRID_4X4 = [
  ["tower", "cube", "cube", "empty"],
  ["cube", "arch", "stair", "empty"],
  ["cube", "empty", "cube", "cube"],
  ["empty", "stair", "cube", "empty"],
];

// ---------- Section 05：核实后的两百年历史节点 ----------
export const TIMELINE = [
  {
    id: "farish",
    year: "1820 / 1822",
    who: "William Farish · 剑桥大学",
    title: "模块化机械教具催生「等距透视」",
    summary:
      "剑桥化学与力学教授 William Farish 在课堂上习惯用标准金属模块化零件现搭机械模型，下课后再拆散复原。为了让助手不靠口头叮嘱就能按图重装，他于 1820 年 2–3 月在剑桥哲学学会宣读、1822 年正式发表《On Isometrical Perspective》，首次把三轴等角、三轴等比的平行投影公式化——等距从诞生第一天起就为「模块化复用」而生。",
    detail: "文献出处：Transactions of the Cambridge Philosophical Society, Vol. 1 (1822), pp. 1–20。",
    diagram: "farish",
  },
  {
    id: "penrose",
    year: "1934 / 1958",
    who: "Reutersvärd & Penrose 父子",
    title: "没有近大远小，便诞生不可能图形",
    summary:
      "1934 年瑞典艺术家 Oscar Reutersvärd 用 9 枚等距立方体拼出最早的不可能三角；1958 年 Lionel 与 Roger Penrose 父子在《英国心理学杂志》发表经典论文，系统阐释无透视深度线索如何让相距遥远的两端在平面上严丝合缝闭合。荷兰版画家 M. C. Escher 读后创作了名作《瀑布》（1961）。",
    detail: "文献出处：British Journal of Psychology, Vol. 49, Issue 1 (1958), pp. 31–33。",
    diagram: "penrose",
  },
  {
    id: "arcade",
    year: "1982",
    who: "Zaxxon & Q*bert · 街机黄金时代",
    title: "2D 屏幕用等距模块撑出 3D 空间",
    summary:
      "1982 年世嘉推出横向卷轴射击游戏《Zaxxon》，用等距俯视画出立体太空堡垒，并首创用「机身地面投影 + 高度表」破解等距高度歧义；同年 Gottlieb 的《Q*bert》把整个金字塔做成可逐格踩亮的标准等距方块，甚至把街机摇杆斜装 45° 来贴合两条斜轴。",
    detail: "随后大量 2D 策略与像素游戏进一步采用 2:1 二等轴测（26.57°），消除 30° 边线像素锯齿。",
    diagram: "arcade",
  },
  {
    id: "iso",
    year: "1996 / 2014",
    who: "ISO 5456-3 & Monument Valley",
    title: "国际工程规范与当代交互设计复兴",
    summary:
      "国际标准化组织发布 ISO 5456-3:1996，确立等角、二等轴测与斜轴测在机械、建筑与产品工程制图中的统一法则；2014 年 ustwo games 的《纪念碑谷》把等距架构与埃舍尔视错觉结合，重新引爆当代品牌插画、SaaS 产品信息图与架构图中的等距设计热潮。",
    detail: "标准全称：ISO 5456-3:1996 Technical drawings — Projection methods — Part 3: Axonometric representations。",
    diagram: "iso",
  },
];

// ---------- Section 06：原海报四大应用领域 ----------
export const APPLICATIONS = {
  product: {
    id: "product",
    label: "产品设计",
    en: "PRODUCT DESIGN",
    good: "工业装配爆炸图、硬件接口拆解、家具组装说明书：同一颗螺丝、同一块挡板挪到任何装配位都尺寸一致，装配工人可以直接拿尺核对相对比例。",
    watch: "切忌把弯曲人体工学手柄的微弱弧度只靠一张等距图交代，必须补充正视图与剖面图。",
  },
  arch: {
    id: "arch",
    label: "建筑与空间",
    en: "ARCHITECTURE",
    good: "园区总平、室内分层剖切图、地铁换乘动线图：无透视变形意味着每一层楼板面积直观可比，能一眼看清多栋楼宇的衔接关系。",
    watch: "不要用等距去卖「挑高大堂的宏伟震撼感」——缺少近大远小，高楼只会像桌面积木模型。",
  },
  info: {
    id: "info",
    label: "信息图表",
    en: "INFOGRAPHICS",
    good: "云架构拓扑、供应链节点、城市基建流程：用标准底座、连接管道与功能模块搭出可扩展的系统地图，增删节点几乎零重排成本。",
    watch: "绝不要把密密麻麻的数据标签和柱状图数值斜贴 30° 印在菱形面上——结构用等距，文字与数据一律保持水平标注。",
  },
  game: {
    id: "game",
    label: "游戏美术",
    en: "GAME ART",
    good: "战棋、城市建造、模拟经营：一套 1×1 地块素材拼出几百格地图，前排后排像素精度完全一致，玩家一眼掌握全局战术距离。",
    watch: "只要涉及跳跃或飞行，务必像《Zaxxon》一样补上清晰的垂直落影或脚底光圈，否则玩家永远判不准落点高度。",
  },
};

// ---------- Section 07：四选一小练习（仅差单一变量，标签全中性） ----------
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    mode: "flatTone",
    correct: false,
    reason:
      "三轴夹角与零汇聚都达标了，但三面明度几乎拉不开（顶、左、右全挤在相近浅灰绿里）。没有透视缩小时，人眼全靠「顶亮、左深、右中」的三面明暗差来分辨折角与前后遮挡；明度一平，四座展馆立刻粘成扁平色块。",
  },
  {
    id: "B",
    label: "方案 B",
    mode: "perspLeak",
    correct: false,
    reason:
      "三面光影清晰、排布也很整齐，但画面悄悄混进了约 28% 的透视汇聚：后排展馆明显缩水，本该严格平行的屋檐边也在往画外收拢。一旦破了「无透视汇聚」，园区后续想直接复用同尺寸模块加建就会穿帮。",
  },
  {
    id: "C",
    label: "方案 C",
    mode: "valid",
    correct: true,
    reason:
      "完全合规：三条坐标轴严守 120° 等角与零透视汇聚，四座展馆前排后排像素边长完全一致；顶/左/右三面保持稳定明暗分层，且空中连廊正下方落有清晰的地面投影，彻底消除了等距视角最怕的浮空高度歧义。",
  },
  {
    id: "D",
    label: "方案 D",
    mode: "offAxis",
    correct: false,
    reason:
      "相机视角与三面配色都没问题，但右侧那座展馆底面私自偏转了 +16°，脱离了三条等角轴方向。原海报的「等距逻辑」点明所有主边必须平行于三轴，单独歪扭一块会把整个模块化系统的秩序感瞬间扯松。",
  },
];

// 080 平视构图 · 单真源三维针孔透视与实测研判模型
// 画布绘制与全部读数、要点状态灯、诊单评注共享同一份 3D 投影结果，无写死常量。

export const SCENES = {
  plaza: {
    id: "plaza",
    label: "原海报广场",
    short: "站姿广场",
    subjectName: "站立行人",
    targetEyeY: 1.62,
    subjectPos: { x: -1.18, z: 6.2 },
    farPeerPos: { x: 1.38, z: 10.6 },
    desc: "站立行人眼高 1.62m，与远景拱门前同行者同处一条水平眼平线。",
  },
  bench: {
    id: "bench",
    label: "长椅对谈",
    short: "坐姿对谈",
    subjectName: "坐姿对话者",
    targetEyeY: 1.12,
    subjectPos: { x: 1.05, z: 5.5 },
    farPeerPos: { x: -1.25, z: 5.8 },
    desc: "两位对话者落座后眼高降至 1.12m，摄影师须蹲低才能平等对坐。",
  },
  child: {
    id: "child",
    label: "孩童与小狗",
    short: "蹲拍孩童",
    subjectName: "孩童",
    targetEyeY: 0.85,
    subjectPos: { x: -0.78, z: 5.0 },
    farPeerPos: { x: 0.25, z: 5.15 },
    desc: "孩童眼高仅 0.85m，大人站着拍只会看见头顶和地砖，必须俯身平视。",
  },
};

export const INITIAL_STATE = {
  sceneId: "plaza",
  camY: 2.26,
  pitch: -9.5,
  roll: 4.0,
  focal: 50,
  showGuides: true,
};

export const PRESETS = {
  posterOk: {
    label: "原海报标准解",
    sceneId: "plaza",
    camY: 1.62,
    pitch: 0,
    roll: 0,
    focal: 50,
  },
  benchOk: {
    label: "坐姿平视解",
    sceneId: "bench",
    camY: 1.12,
    pitch: 0,
    roll: 0,
    focal: 50,
  },
  childOk: {
    label: "蹲拍齐眼解",
    sceneId: "child",
    camY: 0.85,
    pitch: 0,
    roll: 0,
    focal: 35,
  },
  wideOk: {
    label: "28mm 广角解",
    sceneId: "plaza",
    camY: 1.62,
    pitch: 0,
    roll: 0,
    focal: 28,
  },
  errHighDown: {
    label: "试错：居高俯拍",
    camY: 2.35,
    pitch: -17,
    roll: 0,
  },
  errLowUp: {
    label: "试错：低角仰拍",
    camY: 0.62,
    pitch: 16,
    roll: 0,
  },
  errStandChild: {
    label: "试错：站拍孩童",
    sceneId: "child",
    camY: 1.72,
    pitch: 0,
    roll: 0,
    focal: 50,
  },
  errRoll: {
    label: "试错：歪斜地平",
    pitch: 0,
    roll: -6.5,
  },
};

export const LIMITS = {
  camY: [0.45, 2.6],
  pitch: [-24, 24],
  roll: [-8, 8],
};

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const DEG = Math.PI / 180;

// 统一垂直视场焦距换算：锚定画布高度（35mm 竖边 24mm），宽屏横向更开阔、竖屏自动微缩防裁切
export function focalPx(focal, w, h) {
  const aspect = w / Math.max(1, h);
  const aspectAdj = aspect < 1.25 ? Math.max(0.68, aspect * 0.78) : 1;
  return (focal / 24) * h * 0.68 * aspectAdj;
}

// 真实三维针孔透视投影：世界 (x 右, y 上, z 前) -> 屏幕 (sx, sy, depth)
export function projectPoint(x, y, z, state, w, h) {
  const f = focalPx(state.focal, w, h);
  const dx = x;
  const dy = y - state.camY;
  const dz = z;

  const pr = state.pitch * DEG;
  const cp = Math.cos(pr);
  const sp = Math.sin(pr);
  const y1 = dy * cp - dz * sp;
  const z1 = dy * sp + dz * cp;

  const safeZ = Math.max(0.25, z1);
  const px0 = (dx / safeZ) * f;
  const py0 = -(y1 / safeZ) * f;

  const rr = state.roll * DEG;
  const cr = Math.cos(rr);
  const sr = Math.sin(rr);
  const sx = w * 0.5 + px0 * cr - py0 * sr;
  const sy = h * 0.5 + px0 * sr + py0 * cr;
  return { x: sx, y: sy, z: z1, visible: z1 > 0.25 };
}

// 眼平线（无穷远地平线）在画布左右边缘的精确端点
export function horizonSegment(state, w, h) {
  const f = focalPx(state.focal, w, h);
  const py0 = Math.tan(state.pitch * DEG) * f;
  const rr = state.roll * DEG;
  const cr = Math.cos(rr);
  const sr = Math.sin(rr);

  // 旋转前水平线 y = py0 上任一点 (u, py0) 经 roll 旋转后为：
  // x = cx + u*cr - py0*sr, y = cy + u*sr + py0*cr
  const cx = w * 0.5 - py0 * sr;
  const cy = h * 0.5 + py0 * cr;
  const span = Math.max(w, h) * 1.4;
  return {
    cx,
    cy,
    x1: cx - span * cr,
    y1: cy - span * sr,
    x2: cx + span * cr,
    y2: cy + span * sr,
    ratio: cy / h,
    // 画布可见左右两端的精准 y
    yAt(x) {
      return Math.abs(cr) < 1e-4 ? cy : cy + ((x - cx) * sr) / cr;
    },
  };
}

// 从同一套 3D 场景几何单真源核算全部光学读数与双向错态诊断
export function evaluate(state, w = 960, h = 420) {
  const scene = SCENES[state.sceneId] || SCENES.plaza;
  const horiz = horizonSegment(state, w, h);

  // 1. 拱门左右外墙柱（真实 3D 坐标：x = ±2.05m, y = 0..4.15m, z = 11.5m）
  const leftBot = projectPoint(-2.05, 0, 11.5, state, w, h);
  const leftTop = projectPoint(-2.05, 4.15, 11.5, state, w, h);
  const rightBot = projectPoint(2.05, 0, 11.5, state, w, h);
  const rightTop = projectPoint(2.05, 4.15, 11.5, state, w, h);

  // 左墙柱偏离绝对竖直线的角度（度）：正值=顶部向右内收（仰拍），负值=顶部向左外翻（俯拍）
  const leftAngle = Math.atan2(leftTop.x - leftBot.x, leftBot.y - leftTop.y) / DEG;
  const rightAngle = Math.atan2(rightBot.x - rightTop.x, rightBot.y - rightTop.y) / DEG;
  // 纯收敛倾角（不含 roll）与含 roll 的最大实测倾角
  const convergeDeg = (leftAngle + rightAngle) * 0.5;
  const wallTiltMax = Math.max(Math.abs(leftAngle), Math.abs(rightAngle));

  // 2. 地面占比：拱门脚线 y 到画布底边占总高的比例
  const baseMidY = (leftBot.y + rightBot.y) * 0.5;
  const groundRatio = clamp((h - baseMidY) / h, 0, 1);

  // 3. 当前主体的眼睛投影坐标与眼平线的垂直偏差
  const subEye = projectPoint(scene.subjectPos.x, scene.targetEyeY, scene.subjectPos.z, state, w, h);
  const subFoot = projectPoint(scene.subjectPos.x, 0, scene.subjectPos.z, state, w, h);
  const horizonAtSub = horiz.yAt(subEye.x);
  const eyeDiffPx = subEye.y - horizonAtSub; // >0 主体眼睛在眼平线下方（机位偏高）
  const eyeDiffPct = (eyeDiffPx / h) * 100;
  const heightDiff = state.camY - scene.targetEyeY; // 米：正=机位高于主体眼

  // 4. 逐项判定 6 类双向失误
  const issues = [];
  if (state.pitch < -3.0) {
    issues.push({
      id: "pitch_down",
      badge: `俯拍 ${state.pitch.toFixed(1)}°`,
      headline: `镜头低头 ${Math.abs(state.pitch).toFixed(1)}°，拱门墙柱向下收拢倾斜 ${wallTiltMax.toFixed(1)}°`,
      why: `光轴向下俯拍时，砖红眼平线被推高到画框 ${Math.round(horiz.ratio * 100)}% 处，广场地砖抢占了 ${Math.round(groundRatio * 100)}% 画面。观者被迫居高俯视主体，建筑垂直线失去端正稳重感。`,
      action: "向右横拖画布，或将「光轴俯仰」调回 0° 水平线，亲眼看两侧墙柱重新立直。",
      fixLabel: "端平镜头至 0°",
      fix: { pitch: 0 },
    });
  } else if (state.pitch > 3.0) {
    issues.push({
      id: "pitch_up",
      badge: `仰拍 +${state.pitch.toFixed(1)}°`,
      headline: `镜头抬头 +${state.pitch.toFixed(1)}°，墙柱向天顶汇聚 ${wallTiltMax.toFixed(1)}°`,
      why: `光轴上扬使眼平线沉到画框 ${Math.round(horiz.ratio * 100)}% 处，建筑垂直边向上内倾，画面滑向虫视仰拍的戏剧压迫，不再是平实克制的日常叙事。`,
      action: "向左横拖画布，或将「光轴俯仰」回落到 0° 水平，让垂直建筑回归平直。",
      fixLabel: "压平镜头至 0°",
      fix: { pitch: 0 },
    });
  }

  if (Math.abs(state.roll) > 1.3) {
    issues.push({
      id: "roll_tilted",
      badge: `地平斜 ${state.roll > 0 ? "+" : ""}${state.roll.toFixed(1)}°`,
      headline: `地平线倾斜 ${Math.abs(state.roll).toFixed(1)}°，画面重心向${state.roll > 0 ? "右" : "左"}侧滑落`,
      why: "平视构图最讲究稳定可靠。即便俯仰接近水平，只要横向水准没端平，整条砖红眼平线和远山都在倾斜，观者视线会不由自主跟着歪头。",
      action: "把「地平横滚」归零到 0.0°，或点下方一键扶正。",
      fixLabel: "扶正地平至 0°",
      fix: { roll: 0 },
    });
  }

  if (heightDiff > 0.24) {
    issues.push({
      id: "height_high",
      badge: `机位偏高 +${heightDiff.toFixed(2)}m`,
      headline: `机位 ${state.camY.toFixed(2)}m 高过${scene.subjectName}眼高 ${heightDiff.toFixed(2)}m`,
      why: `当前「${scene.label}」的主体眼高在 ${scene.targetEyeY.toFixed(2)}m。站得过高会让眼平线从主体头顶上方掠过（偏离画高 ${Math.abs(eyeDiffPct).toFixed(0)}%），哪怕镜头已经端平，依然带着路人居高临下的疏离感。`,
      action: `向下拖动画布或右侧身高标尺，把机位蹲降到 ${scene.targetEyeY.toFixed(2)}m 附近。`,
      fixLabel: `蹲至 ${scene.targetEyeY.toFixed(2)}m 齐眼`,
      fix: { camY: scene.targetEyeY },
    });
  } else if (heightDiff < -0.24) {
    const isOzuStyle = state.sceneId === "plaza" && Math.abs(state.pitch) <= 2.5 && state.camY >= 0.72 && state.camY <= 1.15;
    issues.push({
      id: "height_low",
      badge: isOzuStyle ? `低平视 ${state.camY.toFixed(2)}m` : `机位偏低 ${heightDiff.toFixed(2)}m`,
      headline: isOzuStyle
        ? `低机位水平视点（${state.camY.toFixed(2)}m）：像小津的榻榻米高度，但低于站姿主体眼平`
        : `机位 ${state.camY.toFixed(2)}m 低于${scene.subjectName}眼高 ${Math.abs(heightDiff).toFixed(2)}m`,
      why: isOzuStyle
        ? `镜头虽端平 0°、墙柱依然笔直，但机位比站立行人眼高矮了 ${Math.abs(heightDiff).toFixed(2)}m，眼平线落在胸腹以下，观者处于低座旁观而非平等对视。`
        : `相机压得太低时，眼平线落到主体腰腿位置（偏离画高 ${Math.abs(eyeDiffPct).toFixed(0)}%），地面细节被压缩成细线，观者被迫抬头看人，失去了平视的亲近感。`,
      action: `向上拖动画布或右侧身高标尺，抬升机位至 ${scene.targetEyeY.toFixed(2)}m 齐眼。`,
      fixLabel: `抬至 ${scene.targetEyeY.toFixed(2)}m 齐眼`,
      fix: { camY: scene.targetEyeY },
    });
  }

  if ((horiz.ratio < 0.16 || horiz.ratio > 0.84) && !issues.some((x) => x.id.startsWith("pitch"))) {
    issues.push({
      id: "horizon_edge",
      badge: "眼平线贴边",
      headline: "眼平线被挤出画框舒适带",
      why: "眼平线紧贴画面顶部或底边时，天地比例严重失衡，无法同时交代主体与环境关系。",
      action: "把俯仰角调回 0°，让眼平线回到画框中段。",
      fixLabel: "恢复中段眼平",
      fix: { pitch: 0, roll: 0 },
    });
  }

  const ok = issues.length === 0;
  const primary = issues[0] || null;

  // 成立时的差异化专业点评（接受多种焦段与三题材多组合法解）
  let okHeadline = "平视成立：垂直线端正，眼平线精准贯目";
  let okWhy = `当前相机高度 ${state.camY.toFixed(2)}m 正好贴合「${scene.label}」主体视线（${scene.targetEyeY.toFixed(2)}m），光轴俯仰 ${state.pitch.toFixed(1)}°、拱门墙柱倾角仅 ${wallTiltMax.toFixed(1)}°。`;
  if (state.focal <= 35) {
    okHeadline = `${state.focal}mm 广角平视成立：环境开阔，临场感强`;
    okWhy += " 广角焦段纳入了更多广场石板、小树与长椅，在保持垂直端正的前提下突出主体与周围街景的互动关系。";
  } else if (state.focal >= 85) {
    okHeadline = `${state.focal}mm 中长焦平视成立：背景拉近，人物亲密`;
    okWhy += " 85mm 焦段让拱门与远山柔和靠拢到主体身后，视线毫无压迫地聚焦在人物身上，最适合肖像与对谈。";
  } else {
    okHeadline = `50mm 标准平视成立：最贴近人眼自然观感`;
    okWhy += " 标准焦段与水平光轴叠加，远近比例不夸大也不压缩，忠实复现人站在广场对面平望的安定与亲近。";
  }

  // 四枚原海报要点灯实时单真源状态（稳定 / 叙事自然 / 亲近感 / 信息清晰）
  const balanceOk = Math.abs(state.pitch) <= 2.5 && Math.abs(state.roll) <= 1.2;
  const narrativeOk = Math.abs(heightDiff) <= 0.22 && Math.abs(state.pitch) <= 3.5;
  const comfortOk = Math.abs(heightDiff) <= 0.22 && Math.abs(state.pitch) <= 2.5;
  const clarityOk = balanceOk && groundRatio >= 0.14 && groundRatio <= 0.52 && horiz.ratio >= 0.28 && horiz.ratio <= 0.72;

  const pillars = {
    balance: {
      ok: balanceOk,
      tag: balanceOk ? `垂直 ${wallTiltMax.toFixed(1)}°` : Math.abs(state.roll) > 1.2 ? `地平斜 ${Math.abs(state.roll).toFixed(1)}°` : `墙柱倾 ${wallTiltMax.toFixed(1)}°`,
    },
    narrative: {
      ok: narrativeOk,
      tag: narrativeOk ? "视角平等" : heightDiff > 0.22 ? `俯压 +${heightDiff.toFixed(2)}m` : heightDiff < -0.22 ? `偏低 ${heightDiff.toFixed(2)}m` : "俯仰干预",
    },
    comfort: {
      ok: comfortOk,
      tag: comfortOk ? `${state.focal}mm 亲近` : Math.abs(heightDiff) > 0.22 ? "身高有距" : "视线错开",
    },
    clarity: {
      ok: clarityOk,
      tag: clarityOk ? `地坪 ${Math.round(groundRatio * 100)}%` : groundRatio > 0.52 ? "地面抢戏" : groundRatio < 0.14 ? "地面丢失" : "层次偏斜",
    },
  };

  return {
    ok,
    scene,
    horiz,
    leftBot,
    leftTop,
    rightBot,
    rightTop,
    subEye,
    subFoot,
    leftAngle,
    rightAngle,
    convergeDeg,
    wallTiltMax,
    groundRatio,
    heightDiff,
    eyeDiffPx,
    eyeDiffPct,
    issues,
    primary,
    headline: ok ? okHeadline : primary.headline,
    why: ok ? okWhy : primary.why,
    action: ok ? "可以切换不同题材（坐姿/孩童）或换用 28mm/85mm 焦段，继续检验不同平视合法解。" : primary.action,
    badge: ok ? `平视成立 · ${state.focal}mm` : primary.badge,
    pillars,
  };
}

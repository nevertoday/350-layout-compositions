// 307 客观视角构图 · 单真源 3D 透视投影与双向客观性核算模型
// 所有实绘几何、读数、五联档案卡状态与白话诊单均来自此模块的同一套投影与测量数据。

export const PALETTE = {
  paper: "#FDEDD2",
  paperLight: "#FDF5E6",
  plaza: "#FAE9D1",
  plazaLine: "#DECBB0",
  ink: "#022037",
  inkDeep: "#01213C",
  door: "#2B4256",
  slateLeft: "#8694A2",
  slateRight: "#84929F",
  stairs: "#8B9AA2",
  window: "#939BA6",
  stone: "#E7DACA",
  stoneShade: "#D6C8B4",
  gold: "#E6A826",
  treeGold: "#E4AD33",
  eyeGold: "#DFA92D",
  goldText: "#855300",
  ok: "#136650",
  okDark: "#5ED4B4",
  bad: "#B52B22",
  badDark: "#FF7E70",
  night: "#071726",
  nightCard: "#0E253A",
};

export const FOCAL_OPTIONS = [
  { mm: 24, label: "24mm", tag: "超广角", aperture: 8, blurFactor: 0.0, distortFactor: 1.0, desc: "广角拉大透视，近距建筑边缘易外倾变形" },
  { mm: 35, label: "35mm", tag: "客观全景", aperture: 8, blurFactor: 0.0, distortFactor: 0.12, desc: "纪录片与客观全景主力焦段，空间宽阔且线条端正" },
  { mm: 50, label: "50mm", tag: "标准人眼", aperture: 8, blurFactor: 0.05, distortFactor: 0.0, desc: "接近肉眼自然透视，不夸大也不压缩纵深" },
  { mm: 105, label: "105mm", tag: "长焦浅景", aperture: 2.0, blurFactor: 1.0, distortFactor: 0.0, desc: "压缩纵深并大幅虚化后景，把主体从环境中孤立出来" },
];

export const SCENES = {
  plaza: {
    id: "plaza",
    name: "原海报·石阶广场",
    shortName: "石阶广场",
    en: "CIVIC PLAZA",
    summary: "1:1 承袭原海报：左侧暗靛大楼、中央石阶主馆、右侧金黄秋树与广场 6 位剪影行人。",
    actors: [
      { id: "lead", role: "前景观察主体", x: 0.0, z: 4.0, h: 1.78, pose: "back", vx: 0.0, vz: 0.05, weight: 2.2, draggable: true },
      { id: "rightMid", role: "右前转身者", x: 3.55, z: 6.8, h: 1.74, pose: "stand", vx: -0.08, vz: -0.04, weight: 1.5 },
      { id: "leftWalk", role: "左中步行者", x: -3.4, z: 8.6, h: 1.72, pose: "walkR", vx: 0.38, vz: 0.02, weight: 1.25 },
      { id: "leftFar", role: "左侧台阶路人", x: -2.35, z: 12.2, h: 1.68, pose: "stand", vx: 0.14, vz: 0.0, weight: 0.75 },
      { id: "rightDoor", role: "入口驻足者", x: 1.65, z: 12.4, h: 1.70, pose: "stand", vx: -0.1, vz: 0.0, weight: 0.75 },
      { id: "rightFar", role: "树旁行者", x: 4.55, z: 10.6, h: 1.68, pose: "bag", vx: -0.22, vz: 0.03, weight: 0.9 },
    ],
    tree: { x: 6.4, z: 10.8, h: 5.4, r: 2.05 },
    door: { x: 0, z: 15.2, w: 3.1, h: 2.75 },
  },
  gallery: {
    id: "gallery",
    name: "美术馆·中庭走廊",
    shortName: "美术馆中庭",
    en: "MUSEUM ATRIUM",
    summary: "对称建筑中庭、两列立柱、主展墙、暖金灯柱与三组缓步观展的剪影人物。",
    actors: [
      { id: "lead", role: "中庭驻足观者", x: -0.2, z: 4.2, h: 1.76, pose: "back", vx: 0.05, vz: 0.04, weight: 2.2, draggable: true },
      { id: "rightMid", role: "右侧讲解听众", x: 3.15, z: 7.2, h: 1.72, pose: "stand", vx: -0.12, vz: 0.0, weight: 1.45 },
      { id: "leftWalk", role: "左廊巡展者", x: -3.3, z: 7.8, h: 1.70, pose: "walkR", vx: 0.34, vz: 0.02, weight: 1.3 },
      { id: "leftFar", role: "画前远观者", x: -1.8, z: 12.0, h: 1.68, pose: "stand", vx: 0.12, vz: 0.0, weight: 0.8 },
      { id: "rightDoor", role: "策展记录者", x: 1.45, z: 11.8, h: 1.70, pose: "stand", vx: -0.06, vz: 0.0, weight: 0.8 },
      { id: "rightFar", role: "灯柱旁离场者", x: 4.35, z: 10.0, h: 1.68, pose: "bag", vx: -0.26, vz: 0.04, weight: 0.85 },
    ],
    tree: { x: 6.1, z: 10.4, h: 5.2, r: 1.65 },
    door: { x: 0, z: 15.0, w: 3.6, h: 2.85 },
  },
  station: {
    id: "station",
    name: "车站·玻璃候车厅",
    shortName: "玻璃候车厅",
    en: "GLASS CONCOURSE",
    summary: "致敬塔蒂 70mm 客观全景：通透玻璃幕墙、金黄时刻柱与奔走/等待/重逢的多线行人。",
    actors: [
      { id: "lead", role: "检票口凝望者", x: 0.15, z: 4.1, h: 1.78, pose: "back", vx: -0.04, vz: 0.05, weight: 2.2, draggable: true },
      { id: "rightMid", role: "提箱赶车者", x: 3.45, z: 6.4, h: 1.74, pose: "bag", vx: -0.44, vz: -0.02, weight: 1.55 },
      { id: "leftWalk", role: "穿厅旅客", x: -3.65, z: 8.2, h: 1.72, pose: "walkR", vx: 0.48, vz: 0.03, weight: 1.3 },
      { id: "leftFar", role: "候车同伴", x: -2.1, z: 12.1, h: 1.68, pose: "stand", vx: 0.08, vz: 0.0, weight: 0.75 },
      { id: "rightDoor", role: "站台接站者", x: 1.7, z: 12.2, h: 1.70, pose: "stand", vx: -0.14, vz: 0.0, weight: 0.75 },
      { id: "rightFar", role: "时刻柱旁读者", x: 4.5, z: 10.3, h: 1.68, pose: "stand", vx: -0.18, vz: 0.01, weight: 0.9 },
    ],
    tree: { x: 6.2, z: 10.5, h: 5.5, r: 1.85 },
    door: { x: 0, z: 15.2, w: 3.8, h: 2.9 },
  },
};

// 开场刻意停在 0/4 复合坏态（贴脸过近 + 仰拍偏见 + 荷兰倾角 + 105mm 浅景深 + 主角偏右叠撞，同时画幅内人物与建筑清晰可辨）
export const INITIAL_BROKEN = {
  scene: "plaza",
  distance: 7.4,   // 米（相机位于主角前方，7.4m 贴近切脚但主角与周围建筑仍清晰在框）
  pitch: -12,      // 度：负值=仰拍，0=平视，正值=俯拍
  tilt: 9,         // 度：荷兰倾角
  focal: 105,      // mm：24 / 35 / 50 / 105
  leadX: 1.55,     // 米：前景主角横坐标，0 为居中平衡，+1.55 明显偏右挤近配角
  peek: false,     // 是否打开「障碍物偷窥」反例
  playing: false,  // 是否正在演播静机长镜头
  playTime: 0,
  highlightCard: null, // 点击下方五联档案卡时高亮的维度 id
};

// 多组合法 4/4 解（均经同一 model.js 实测达标）
export const SOLUTIONS = {
  poster: {
    id: "poster",
    label: "原海报经典解",
    note: "35mm · 18.0m · 平视 0° · 对称全景",
    patch: { distance: 18.0, pitch: 0, tilt: 0, focal: 35, leadX: 0.0, peek: false },
  },
  tati: {
    id: "tati",
    label: "塔蒂宽广群像解",
    note: "35mm · 22.8m · 微平视 +2° · 多点并置",
    patch: { distance: 22.8, pitch: 2, tilt: 0, focal: 35, leadX: -0.8, peek: false },
  },
  ozu: {
    id: "ozu",
    label: "小津克制低平解",
    note: "50mm · 15.2m · 低平视 -3° · 标准人眼",
    patch: { distance: 15.2, pitch: -3, tilt: 0, focal: 50, leadX: 0.35, peek: false },
  },
};

// 反向与边界试错预设
export const FAIL_PRESETS = {
  tooFar: {
    id: "tooFar",
    label: "试错：过远蚁人",
    patch: { distance: 32.5, pitch: 1, tilt: 0, focal: 24, leadX: 0.0, peek: false },
  },
  godView: {
    id: "godView",
    label: "试错：上帝俯视",
    patch: { distance: 17.0, pitch: 23, tilt: 0, focal: 35, leadX: 0.0, peek: false },
  },
  shallow: {
    id: "shallow",
    label: "试错：长焦糊背景",
    patch: { distance: 13.5, pitch: 0, tilt: 0, focal: 105, leadX: 0.0, peek: false },
  },
  peek: {
    id: "peek",
    label: "试错：偷窥挡镜",
    patch: { distance: 17.5, pitch: 0, tilt: 0, focal: 35, leadX: 0.0, peek: true },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function createState() {
  return { ...INITIAL_BROKEN };
}

// 计算当前帧中 6 位人物的真实世界坐标（长镜头播放时按真实空间速率穿行）
export function getWorldActors(state) {
  const sc = SCENES[state.scene] || SCENES.plaza;
  const t = state.playTime || 0;
  return sc.actors.map((a, idx) => {
    // 使用平滑往返周期，避免人物走飞出广场外
    const phase = Math.sin(t * 0.42 + idx * 0.85);
    const dx = idx === 0 ? state.leadX : a.x + a.vx * phase * 3.8;
    const dz = a.z + a.vz * phase * 2.2;
    return { ...a, wx: dx, wz: dz };
  });
}

// 核心 3D 透视投影函数（所有画布绘制与 model.js 诊断共用！）
// 世界坐标约定：
//   x: 左右（米，0 为广场正中，左负右正）
//   y: 高度（米，0 为地面，向上为正）
//   z: 纵深（米，主角基准约 z=4，台阶约 z=11~14，主馆大门约 z=15.2）
// 相机位于 (0, camY, camZ)，其中 camZ = 4.0 - distance（distance 越大相机越靠后退远）
export function makeCamera(state, width, height) {
  const aspect = width / Math.max(1, height);
  // 遵循电影摄影机按垂直视场角（fovY）定标：fy 绑定画布高度，fx === fy 严格等比（绝不拉扁），
  // 从而保证 2560/1440 宽银幕与 390 竖屏下前景人物高度占比与建筑构图高度完全一致！
  const focalInfo = FOCAL_OPTIONS.find((f) => f.mm === state.focal) || FOCAL_OPTIONS[1];
  const focalMult = state.focal <= 24 ? 1.18 : state.focal <= 35 ? 1.62 : state.focal <= 50 ? 2.02 : 2.38;
  // 窄画幅（竖屏）略收 0.78× 放宽水平包容度，同时维持 fx === fy 绝对等比
  const narrowComp = aspect < 1.25 ? 0.78 : aspect < 1.7 ? 0.9 : 1.0;
  const fy = height * focalMult * narrowComp;
  const fx = fy;

  const camZ = 4.0 - state.distance;
  // 俯仰角联动机位高度：平视约人眼 1.52m；俯拍升高到高台，仰拍低机位贴地
  const pitchRad = (state.pitch * Math.PI) / 180;
  const camY = clamp(1.52 + Math.sin(pitchRad) * Math.min(state.distance * 0.34, 5.8), 0.52, 7.6);
  const tiltRad = (state.tilt * Math.PI) / 180;
  const cosP = Math.cos(pitchRad);
  const sinP = Math.sin(pitchRad);
  const cosT = Math.cos(tiltRad);
  const sinT = Math.sin(tiltRad);
  const cx = width * 0.5;
  const cy = height * 0.52;

  function project(wx, wy, wz) {
    const dx = wx;
    const dy = wy - camY;
    const dz = wz - camZ;
    // 绕 X 轴俯仰旋转（pitch > 0 为低头俯拍，地平线上移）
    const ry = dy * cosP + dz * sinP;
    const rz = -dy * sinP + dz * cosP;
    if (rz <= 0.25) return { visible: false, rz, sx: cx, sy: cy, scale: 0 };

    // 24mm 超广角近距轻微桶形/仰俯垂直线畸变
    const nx0 = dx / rz;
    const ny0 = ry / rz;
    const r2 = nx0 * nx0 + ny0 * ny0;
    const kDist = focalInfo.distortFactor * (state.distance < 15 ? 0.16 : 0.05);
    const nx = nx0 * (1 + kDist * r2);
    const ny = ny0 * (1 + kDist * r2);

    // 相机平面坐标（未倾斜）
    const ux = nx * fx;
    const uy = -ny * fy;
    // 荷兰倾角绕光轴旋转
    const sx = cx + ux * cosT - uy * sinT;
    const sy = cy + ux * sinT + uy * cosT;
    const scale = fx / rz;
    return { visible: true, sx, sy, rz, scale, u: sx / width, v: sy / height };
  }

  // 地平线屏幕 Y 坐标（无限远处 y=camY 的投影）
  const horizonY = cy - Math.tan(pitchRad) * fy;

  return {
    width,
    height,
    aspect,
    camY,
    camZ,
    fx,
    fy,
    pitchRad,
    tiltRad,
    horizonY,
    focalInfo,
    project,
  };
}

// 计算景深模糊半径（像素，单真源供渲染器与诊断器共同读取）
export function computeBlurPx(state, targetZ) {
  const focusZ = 4.0; // 对焦落在前景主体平面
  const fInfo = FOCAL_OPTIONS.find((f) => f.mm === state.focal) || FOCAL_OPTIONS[1];
  const depthDiff = Math.abs(targetZ - focusZ);
  if (fInfo.blurFactor <= 0.06) return 0;
  // 长焦 f/2.0 下背景柔和虚化，距离越近散景越明显
  const distFactor = clamp(15 / Math.max(state.distance, 5.0), 0.72, 1.85);
  return +(clamp(depthDiff * 0.44 * fInfo.blurFactor * distFactor, 0, 7.2)).toFixed(1);
}

// 主核算函数：在固定逻辑参考画幅（或实时画布比例）上投影全部角色与关键建筑，核算 4 项维度与 10 类双向错态
export function evaluate(state, viewW = 1200, viewH = 470) {
  const cam = makeCamera(state, viewW, viewH);
  const sc = SCENES[state.scene] || SCENES.plaza;
  const actors = getWorldActors(state);

  const projectedActors = actors.map((a) => {
    const foot = cam.project(a.wx, 0, a.wz);
    const head = cam.project(a.wx, a.h, a.wz);
    const mid = cam.project(a.wx, a.h * 0.55, a.wz);
    const hPx = foot.visible && head.visible ? Math.abs(foot.sy - head.sy) : 0;
    const wPx = hPx * 0.34;
    const inX = mid.visible && mid.sx >= viewW * 0.05 && mid.sx <= viewW * 0.95;
    const fullBodyInFrame =
      foot.visible && head.visible &&
      foot.sy <= viewH * 0.985 && head.sy >= viewH * 0.04 &&
      inX;
    const visibleAtAll =
      mid.visible &&
      mid.sx >= viewW * 0.02 && mid.sx <= viewW * 0.98 &&
      ((foot.sy >= 0 && head.sy <= viewH) || (head.sy >= 0 && head.sy <= viewH));
    return {
      ...a,
      foot,
      head,
      mid,
      hPx,
      wPx,
      hRatio: hPx / Math.max(1, viewH),
      u: mid.sx / viewW,
      inX,
      fullBodyInFrame,
      visibleAtAll,
    };
  });

  const lead = projectedActors[0];
  const visibleCount = projectedActors.filter((a) => a.visibleAtAll).length;
  const fullBodyCount = projectedActors.filter((a) => a.fullBodyInFrame).length;

  // 检验主馆大门与金黄秋树是否清晰完整入框
  const doorL = cam.project(sc.door.x - sc.door.w * 0.5, sc.door.h * 0.5, sc.door.z);
  const doorR = cam.project(sc.door.x + sc.door.w * 0.5, sc.door.h * 0.5, sc.door.z);
  const doorInFrame =
    doorL.visible && doorR.visible &&
    doorL.sx > viewW * 0.06 && doorR.sx < viewW * 0.94 &&
    doorL.sy > viewH * 0.05 && doorL.sy < viewH * 0.95;

  const treeCenter = cam.project(sc.tree.x, sc.tree.h * 0.52, sc.tree.z);
  const treeInFrame =
    treeCenter.visible &&
    treeCenter.sx > viewW * 0.04 && treeCenter.sx < viewW * 0.97 &&
    treeCenter.sy > viewH * 0.04 && treeCenter.sy < viewH * 0.95;

  const bgBlurPx = computeBlurPx(state, 13.0);

  // 检查前景主角是否压叠其他中景人物（水平屏幕距过近）
  const overlapsOther = projectedActors.slice(1).some((o) => {
    if (!o.visibleAtAll || !lead.visibleAtAll) return false;
    return Math.abs(o.mid.sx - lead.mid.sx) < (lead.wPx + o.wPx) * 0.58;
  });

  // 计算画面视觉重心偏移（含建筑左右权重 + 6 人物实际可见面积力矩，0% 为完全均衡）
  let sumW = 0;
  let sumWU = 0;
  for (const a of projectedActors) {
    if (!a.visibleAtAll) continue;
    const visWeight = a.weight * clamp(a.hRatio * 2.5, 0.25, 1.5);
    sumW += visWeight;
    sumWU += visWeight * (a.u - 0.5);
  }
  // 秋树为右侧视觉配重，左侧暗靛大楼为左侧视觉配重（在全景中两者相互平衡）
  if (treeInFrame) {
    sumW += 1.05;
    sumWU += 1.05 * (treeCenter.u - 0.5);
    // 左建筑呼应
    const leftBldg = cam.project(-7.4, 2.8, 10.5);
    if (leftBldg.visible && leftBldg.u > -0.1) {
      sumW += 1.1;
      sumWU += 1.1 * (clamp(leftBldg.u, 0.06, 0.4) - 0.5);
    }
  }
  const balanceOffset = sumW > 0 ? sumWU / sumW : 0; // -0.5..+0.5
  const balancePct = Math.round(Math.abs(balanceOffset) * 200); // 0..100%，越小越均衡

  // 检查宽角近距建筑外倾畸变
  const wideDistort = state.focal <= 24 && state.distance < 15.5;
  const leadCut = !lead.fullBodyInFrame;
  const leadTooTiny = lead.hRatio < 0.125;
  const leadTooHuge = lead.hRatio > 0.62;

  // ----------- 10 类双向错态检测 -----------
  const issues = [];
  if (state.peek) {
    issues.push({
      id: "peek",
      dim: "detachment",
      severity: 100,
      badge: "前景偷窥挡镜",
      headline: "镜头躲在前景柱影后面偷看，失去了坦荡的客观旁观感",
      body: "前景大块暗影挡住近三分之一画幅，观众瞬间从「中立旁观者」变成「躲在柱后的偷窥者」——这已经滑向脏单人或偷窥镜头，不再是坦然呈现关系的客观视角。",
      fix: "关闭「偷窥挡镜」开关（或点击「退回客观 4/4」），让摄影机站回无遮挡的中立位置。",
    });
  }
  if (state.distance < 11.0 || leadTooHuge) {
    const missingParts = [];
    if (!doorInFrame) missingParts.push("建筑入口");
    if (!treeInFrame) missingParts.push("右侧秋树");
    if (leadCut) missingParts.push("前景主角下半身");
    const cutPhrase = missingParts.length ? `${missingParts.join("与")}已截断` : "边缘空间被压迫裁切";
    issues.push({
      id: "tooClose",
      dim: "clarity",
      severity: 96,
      badge: `过近 ${state.distance.toFixed(1)}m`,
      headline: `机位贴到 ${state.distance.toFixed(1)} m，人物切脚、场地与同伴被挤出画外`,
      body: `此刻画框里只容下 ${visibleCount}/6 位人物，${cutPhrase}。观众只看到背影近景，看不清「人在哪、走向谁、周围发生了什么」。`,
      fix: "在画布上向右横拖（或拖动画幅底沿的相机标尺向右退到 14–25 m），拉开旁观安全距离。",
    });
  } else if (state.distance > 26.5 || leadTooTiny) {
    issues.push({
      id: "tooFar",
      dim: "detachment",
      severity: 86,
      badge: `过远 ${state.distance.toFixed(1)}m`,
      headline: `机位退到 ${state.distance.toFixed(1)} m 过远，人物缩成 ${Math.round(lead.hRatio * 100)}% 高的小黑点`,
      body: "「保持距离」不是越远越好。主体高度跌破画幅 13% 时，人物动作朝向与呼应关系变得模糊，画面会退化成冷漠的高空监控图，失去人的温度与叙事张力。",
      fix: "在画布上向左横拖（或把画幅底沿的相机标尺拉回 14–25 m 之间），让前景人物稳占画高 18%–44%。",
    });
  }

  if (Math.abs(state.tilt) > 3) {
    issues.push({
      id: "tilt",
      dim: "neutral",
      severity: 92,
      badge: `倾角 ${state.tilt > 0 ? "+" : ""}${Math.round(state.tilt)}°`,
      headline: `地平线歪了 ${Math.abs(Math.round(state.tilt))}°，镜头偷偷塞进了不安与戏剧干预`,
      body: "倾斜的地平线（荷兰角）是典型的心理暗示手法，它直接告诉观众「这里失控了、要出事了」。客观构图要求水平基准纹丝不动，把情绪判断留给事件本身。",
      fix: "把「镜头倾角」滑轨归到 0°（±2° 内会自动轻吸水平），让建筑垂线与地平线完全端正。",
    });
  }

  if (state.pitch < -6) {
    issues.push({
      id: "lowAngle",
      dim: "neutral",
      severity: 90,
      badge: `仰拍 ${Math.round(state.pitch)}°`,
      headline: `机位压低仰拍 ${Math.abs(Math.round(state.pitch))}°，画面带上了仰望与压迫偏见`,
      body: "低机位大幅仰拍会把前景人物拍得高大威严、压缩广场地砖空间，悄悄替观众做出了「此人居于支配地位」的价值判断，违背原海报第一条「以客观立场观察」。",
      fix: "在画布上向下纵拖（或把「机位俯仰」调回 -5° 至 +6° 的平视中立带）。",
    });
  } else if (state.pitch > 8) {
    issues.push({
      id: "highAngle",
      dim: "neutral",
      severity: 88,
      badge: `俯拍 +${Math.round(state.pitch)}°`,
      headline: `机位抬高俯拍 +${Math.round(state.pitch)}°，沦为居高临下的「上帝审视」`,
      body: "过高的俯视角会把人物压扁在地面石板上，制造出「渺小、被监视、受摆布」的评价态度，不再是与人物平起平坐的中立旁观者。",
      fix: "在画布上向上纵拖（或把「机位俯仰」拉回 -5° 至 +6° 平视区间），回到人的自然视平线。",
    });
  }

  if (bgBlurPx >= 3.2) {
    issues.push({
      id: "shallowDof",
      dim: "spatial",
      severity: 89,
      badge: `${state.focal}mm 糊化`,
      headline: `${state.focal}mm 长焦浅景深把后景糊化（${bgBlurPx.toFixed(1)}px），割裂了人与环境`,
      body: "长焦大光圈只留前景主体清晰，中远景人物、石阶和大门全融成色块。巴赞指出，抹掉背景清晰度等于替观众剥夺了观察空间联系的权利，不符合客观构图的「空间关系」与「信息完整」。",
      fix: "把镜头切回 35mm 客观全景或 50mm 标准深焦，让前、中、远三层人物与建筑同时清晰可读。",
    });
  }

  if (wideDistort) {
    issues.push({
      id: "wideDistort",
      dim: "spatial",
      severity: 82,
      badge: "24mm 畸变",
      headline: "24mm 超广角近距拍摄，建筑垂直线条向外倾斜变形",
      body: "超广角贴近主体时会夸大近大远小、拉歪左右墙体边缘，空间显得紧张失真。客观视角需要忠实还原建筑比例，除非拉开足够距离或改用 35mm / 50mm。",
      fix: "切到 35mm / 50mm 焦段，或把机位退远到 16 m 以外以减弱透视夸张。",
    });
  }

  if (!doorInFrame || !treeInFrame || visibleCount < 5 || leadCut) {
    if (!issues.some((x) => x.id === "tooClose")) {
      issues.push({
        id: "incomplete",
        dim: "clarity",
        severity: 84,
        badge: `信息残缺 ${visibleCount}/6`,
        headline: `画面交代不完整（可见 ${visibleCount}/6 人${leadCut ? " · 主角切边" : ""}），环境头尾缺失`,
        body: "原海报强调「画面信息清晰完整，有头有尾，有交代」。当前主体靠近画框边缘或关键地标残缺，观众无法一次读出起点、去向与场地全貌。",
        fix: "微调机位距离到 14–25 m，并将前景主角拉回广场中央呼吸带（-1.8m ~ +1.8m）。",
      });
    }
  }

    if (overlapsOther || Math.abs(state.leadX) > 1.45 || balancePct > 28) {
    issues.push({
      id: "staging",
      dim: "staging",
      severity: 80,
      badge: overlapsOther ? "人物叠撞" : `调度偏载 ${balancePct}%`,
      headline: overlapsOther
        ? "前景主角叠压在右侧配角身上，前后关系混成一团"
        : `人物站位偏斜 ${balancePct}%，广场左右视觉重心失衡`,
      body: "客观视角不靠特写剪辑，全靠场面调度维持秩序。前景主体与其他人影叠撞或偏向一侧时，画面节奏立刻失衡，观众难以分辨各组人物的独立位置。",
      fix: "直接在画布上左右拖动前景主角（或调「主角站位」滑轨）回到 -1.4m ~ +1.4m 之间的错落留气位。",
    });
  }

  // ----------- 五张原海报档案卡实时状态（对应 4 核心达标维度 + 5 卡片精准探针）-----------
  const neutralOk = Math.abs(state.tilt) <= 3 && state.pitch >= -6 && state.pitch <= 8;
  const spatialOk = bgBlurPx < 3.2 && !wideDistort && doorInFrame && treeInFrame;
  const clarityOk = visibleCount >= 5 && !leadCut && doorInFrame && treeInFrame && bgBlurPx < 3.2;
  const detachmentOk = !state.peek && state.distance >= 11.0 && state.distance <= 26.5 && !leadTooTiny && !leadTooHuge;
  const stagingOk = !overlapsOther && Math.abs(state.leadX) <= 1.45 && balancePct <= 28 && !leadCut;

  // 4 项总分制（与四步链路和总状态徽章严丝对应）：中立立场 / 旁观距离 / 空间完整 / 场面调度
  const checks = [
    { id: "neutral", label: "中立立场", ok: neutralOk },
    { id: "detachment", label: "旁观距离", ok: detachmentOk },
    { id: "clarity", label: "空间完整", ok: spatialOk && clarityOk },
    { id: "staging", label: "场面调度", ok: stagingOk },
  ];
  const score = checks.filter((c) => c.ok).length;

  const cards = [
    {
      id: "neutral",
      title: "中立观察",
      en: "NEUTRAL VIEW",
      posterBody: "以客观立场观察，不带情绪与偏见。",
      ok: neutralOk,
      status: neutralOk
        ? `平视 ${state.pitch >= 0 ? "+" : ""}${Math.round(state.pitch)}° · 水平`
        : Math.abs(state.tilt) > 3
          ? `倾角 ${state.tilt > 0 ? "+" : ""}${Math.round(state.tilt)}°`
          : state.pitch < -6
            ? `仰拍 ${Math.round(state.pitch)}°`
            : `俯拍 +${Math.round(state.pitch)}°`,
    },
    {
      id: "spatial",
      title: "空间关系",
      en: "SPATIAL RELATION",
      posterBody: "关注主体与环境、前后左右的空间联系。",
      ok: spatialOk,
      status: spatialOk
        ? `${state.focal}mm 深焦联动`
        : bgBlurPx >= 3.2
          ? `后景糊化 ${bgBlurPx.toFixed(1)}px`
          : wideDistort
            ? "24mm 边缘畸变"
            : "场地关系截断",
    },
    {
      id: "clarity",
      title: "信息完整",
      en: "CLARITY",
      posterBody: "画面信息清晰完整，有头有尾，有交代。",
      ok: clarityOk,
      status: clarityOk
        ? `全员 ${visibleCount}/6 · 全景`
        : !doorInFrame || !treeInFrame
          ? `缺地标 · 见 ${visibleCount}/6`
          : bgBlurPx >= 3.2
            ? "背景信息糊失"
            : `可见 ${visibleCount}/6 人`,
    },
    {
      id: "detachment",
      title: "旁观感",
      en: "DETACHMENT",
      posterBody: "保持旁观者的位置，不介入事件。",
      ok: detachmentOk,
      status: state.peek
        ? "前景偷窥挡镜"
        : state.distance < 11.0
          ? `贴近 ${state.distance.toFixed(1)}m`
          : state.distance > 26.5
            ? `过远 ${state.distance.toFixed(1)}m`
            : `安全距 ${state.distance.toFixed(1)}m`,
    },
    {
      id: "staging",
      title: "场面调度",
      en: "STAGING",
      posterBody: "安排元素与节奏，让画面有秩序与平衡。",
      ok: stagingOk,
      status: stagingOk
        ? `平衡 · 偏载 ${balancePct}%`
        : overlapsOther
          ? "前景叠撞配角"
          : leadCut
            ? "主角切边出框"
            : `重心偏斜 ${balancePct}%`,
    },
  ];

  // 汇总主诊断
  issues.sort((a, b) => b.severity - a.severity);
  let diagnosis;
  if (score === 4 && issues.length === 0) {
    let styleName = "自定义客观平衡解";
    if (Math.abs(state.distance - 18) < 2 && state.focal === 35 && Math.abs(state.pitch) <= 2 && Math.abs(state.leadX) < 0.4) {
      styleName = "原海报经典全景解";
    } else if (state.distance >= 21) {
      styleName = "塔蒂式宽广群像解";
    } else if (state.focal === 50 && state.pitch <= -1) {
      styleName = "小津式克制低平解";
    }
    diagnosis = {
      ok: true,
      badge: `4/4 · ${styleName}`,
      headline: `客观视角已成立（${styleName}）：距离克制、平视端正、关系完整`,
      body: `摄影机停在 ${state.distance.toFixed(1)} m 旁观位，${state.focal}mm 深焦让全部 ${visibleCount}/6 位人物、石阶大门与秋树同时清晰在框。观众不被人按着头看特写，而是自己读出广场上的距离与关系。`,
      fix: "按空格键（Space）开启「静机长镜头」观察人物在不动画框内如何自然穿行，或尝试其它合法解与试错边界。",
    };
  } else {
    const top = issues[0] || {
      badge: `${score}/4 · 待校准`,
      headline: "机位尚未完全进入客观旁观平衡区",
      body: "检查距离、平视基准、焦段景深与人物站位，让四项客观维度同时亮绿。",
      fix: "微调相机标尺或俯仰、倾角与焦段，让画幅回到克制均衡的全景。",
    };
    diagnosis = {
      ok: false,
      badge: `${score}/4 · ${top.badge}`,
      headline: top.headline,
      body: top.body,
      fix: top.fix,
    };
  }

  // 四步底带推理链实时状态：👤 旁观站位 → 👁 中立凝视 → 🖼 完整画幅 → ✔ 真实成立
  const chain = [
    { id: "observer", label: "旁观站位", ok: detachmentOk },
    { id: "neutral", label: "中立凝视", ok: neutralOk },
    { id: "frame", label: "完整画幅", ok: spatialOk && clarityOk && stagingOk },
    { id: "truth", label: "真实成立", ok: score === 4 },
  ];

  // 计算底部相机标尺 0..1 归一化位置（左端近距介入 4m，右端远距 34m）
  const rulerNorm = clamp((state.distance - 4.0) / 30.0, 0, 1);

  return {
    cam,
    actors: projectedActors,
    lead,
    visibleCount,
    fullBodyCount,
    doorInFrame,
    treeInFrame,
    bgBlurPx,
    overlapsOther,
    balancePct,
    score,
    checks,
    cards,
    issues,
    diagnosis,
    chain,
    rulerNorm,
    leadHeightPct: Math.round(lead.hRatio * 100),
  };
}

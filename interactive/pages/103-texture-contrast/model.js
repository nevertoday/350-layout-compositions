// 103 质感对比 · 单一状态与物理材质评估模型
// 3D WebGL 展台、2D 降级画布、折线引注与实时诊断读数全部从这份模型读取，保证画面与数字严丝合缝。

export const MATERIAL_ORDER = ["rough", "smooth", "grainy", "paper", "metal"];

export const MATERIALS = {
  rough: {
    id: "rough",
    zh: "粗糙",
    full: "粗糙砂岩",
    en: "ROUGH",
    posterDesc: "表面不平整，产生摩擦感",
    roughness: 0.94,
    metalness: 0.0,
    bumpScale: 0.14,
    quiet: false,
    temp: "暖粗",
    hex: "#C2AB8C",
    inkOn: "#1F1B17",
  },
  smooth: {
    id: "smooth",
    zh: "光滑",
    full: "光滑漆面",
    en: "SMOOTH",
    posterDesc: "表面平整细腻，反射光线清晰",
    roughness: 0.08,
    metalness: 0.06,
    bumpScale: 0.0,
    quiet: true,
    temp: "温润",
    hex: "#3E2614",
    inkOn: "#F5EBDC",
  },
  grainy: {
    id: "grainy",
    zh: "颗粒",
    full: "粗粒陶土",
    en: "GRAINY",
    posterDesc: "颗粒感突出，增强肌理变化",
    roughness: 0.90,
    metalness: 0.0,
    bumpScale: 0.12,
    quiet: false,
    temp: "炽干",
    hex: "#B45323",
    inkOn: "#FAF3E8",
  },
  paper: {
    id: "paper",
    zh: "纸感",
    full: "手工棉纸",
    en: "PAPER-LIKE",
    posterDesc: "纤维可见，柔和自然",
    roughness: 0.84,
    metalness: 0.0,
    bumpScale: 0.032,
    quiet: true,
    temp: "柔暖",
    hex: "#E5D9C7",
    inkOn: "#1F1B17",
  },
  metal: {
    id: "metal",
    zh: "金属",
    full: "拉丝冷钢",
    en: "METALLIC",
    posterDesc: "金属光泽，冷硬且坚固",
    roughness: 0.26,
    metalness: 0.88,
    bumpScale: 0.048,
    quiet: false,
    temp: "冷硬",
    hex: "#6B6D70",
    inkOn: "#F6F4F0",
  },
};

// 按原海报 103 的五块叠放位置与前后层级（从底层到顶层）
// u, v 为正方形逻辑桌台上的 0..1 坐标，桌面和手机等比缩放绝不变形
export const SLOTS = [
  {
    id: "disc",
    name: "大圆底盘",
    short: "大圆",
    shape: "disc",
    u: 0.455,
    v: 0.345,
    r: 0.205,
    z: 0.06,
    posterMat: "rough",
    calloutSide: "left",
    calloutAnchor: { u: 0.315, v: 0.27 },
  },
  {
    id: "sheet",
    name: "纸页衬底",
    short: "右方",
    shape: "sheet",
    u: 0.655,
    v: 0.595,
    r: 0.155,
    z: 0.14,
    posterMat: "paper",
    calloutSide: "right",
    calloutAnchor: { u: 0.725, v: 0.605 },
  },
  {
    id: "tile",
    name: "方砖中层",
    short: "左方",
    shape: "tile",
    u: 0.315,
    v: 0.545,
    r: 0.165,
    z: 0.22,
    posterMat: "grainy",
    calloutSide: "left",
    calloutAnchor: { u: 0.205, v: 0.54 },
  },
  {
    id: "prism",
    name: "三角前景",
    short: "三角",
    shape: "prism",
    u: 0.438,
    v: 0.695,
    r: 0.162,
    z: 0.32,
    posterMat: "metal",
    calloutSide: "left",
    calloutAnchor: { u: 0.365, v: 0.725 },
  },
  {
    id: "sphere",
    name: "球体主体",
    short: "圆球",
    shape: "sphere",
    u: 0.628,
    v: 0.435,
    r: 0.132,
    z: 0.44,
    posterMat: "smooth",
    calloutSide: "right",
    calloutAnchor: { u: 0.65, v: 0.355 },
  },
];

export const SLOT_MAP = Object.fromEntries(SLOTS.map((s) => [s.id, s]));

// 六处真实物理叠放接触缝（用来检测邻接是否撞材粘连）
export const SEAMS = [
  ["disc", "tile"],
  ["disc", "sphere"],
  ["disc", "sheet"],
  ["tile", "prism"],
  ["sheet", "sphere"],
  ["sheet", "prism"],
];

// 开场故意落在「同质发平 + 邻接撞材 + 顶平顺光」错态，轮廓清楚但全哑光缺反差，绝不提前给答案
export const INITIAL_SLOTS = {
  disc: "rough",
  sheet: "paper",
  tile: "rough",
  prism: "paper",
  sphere: "paper",
};

export const POSTER_SLOTS = Object.fromEntries(SLOTS.map((s) => [s.id, s.posterMat]));

export const CLUTTER_SLOTS = {
  disc: "rough",
  sheet: "grainy",
  tile: "grainy",
  prism: "metal",
  sphere: "rough",
};

export const INITIAL_LIGHT = 0.5; // 正顶平光（74°），压平微影与高光
export const POSTER_LIGHT = 0.19; // 原海报左上方 34° 掠射侧光

export function createInitialState() {
  return {
    slots: { ...INITIAL_SLOTS },
    selected: "sphere",
    lightParam: INITIAL_LIGHT,
  };
}

// 将 0..1 弧轨参数转为真实方位角、仰角与单位光照方向向量
// p = 0.5 居中为 74° 顶平光；拖向左侧（0..0.34）或右侧（0.66..1）降为 22°–54° 掠射侧光
export function lightGeometry(param) {
  const p = Math.max(0, Math.min(1, param));
  const offset = (p - 0.5) * 2; // -1 .. +1
  const dist = Math.abs(offset);
  const elevDeg = Math.round(74 - 52 * Math.pow(dist, 0.85)); // 74° at center -> 22° at edges
  const azimDeg = Math.round(offset * 56); // -56° left .. +56° right
  const elevRad = (elevDeg * Math.PI) / 180;
  const azimRad = (azimDeg * Math.PI) / 180;
  // 光线来向（Three.js 坐标系：+X 右，+Y 上，+Z 朝向镜头）
  const horiz = Math.cos(elevRad);
  const lx = Math.sin(azimRad) * horiz;
  const ly = Math.cos(azimRad) * horiz * 0.72 + 0.14;
  const lz = Math.sin(elevRad);
  const len = Math.hypot(lx, ly, lz) || 1;
  return {
    param: p,
    elevDeg,
    azimDeg,
    dir: { x: lx / len, y: ly / len, z: lz / len },
    isRaking: elevDeg <= 60,
    isFlat: elevDeg > 64,
    sideLabel: dist < 0.16 ? "正顶顺光" : offset < 0 ? "左侧掠射光" : "右侧掠射光",
  };
}

// 统一从当前 5 块真实粗糙度、安静面比例、6 条接触缝与侧光角度算出诊断，不写死任何假分数
export function evaluate(state) {
  const mats = SLOTS.map((s) => MATERIALS[state.slots[s.id]]);
  const roughs = mats.map((m) => m.roughness);
  const minR = Math.min(...roughs);
  const maxR = Math.max(...roughs);
  const span = +(maxR - minR).toFixed(2);

  const distinctIds = new Set(mats.map((m) => m.id));
  const distinctCount = distinctIds.size;
  const quietCount = mats.filter((m) => m.quiet).length;
  const activeCount = mats.length - quietCount;
  const hasReflective = mats.some((m) => m.roughness <= 0.30 || m.metalness >= 0.5);
  const hasTactileGrit = mats.some((m) => m.roughness >= 0.85 && m.bumpScale >= 0.10);

  const collidedSeams = [];
  for (const [a, b] of SEAMS) {
    if (state.slots[a] === state.slots[b]) {
      collidedSeams.push([a, b]);
    }
  }
  const cleanSeams = SEAMS.length - collidedSeams.length;
  const light = lightGeometry(state.lightParam);

  const contrastOk = span >= 0.60 && distinctCount >= 3 && hasReflective && hasTactileGrit;
  const harmonyOk = quietCount >= 1 && quietCount <= 3 && activeCount >= 2;
  const layerOk = cleanSeams >= 5;
  const lightOk = !light.isFlat;

  let status = "pass";
  let badge = "质感成立";
  let headline = "粗滑互补、留有静面，侧光让五层触感同时立起";
  let why = `当前粗糙度跨度 ${minR.toFixed(2)}→${maxR.toFixed(2)}（差 ${span.toFixed(2)}），${quietCount} 块安静面托住 ${activeCount} 块强肌理，${cleanSeams}/6 处重叠边界分离；${light.elevDeg}° ${light.sideLabel}拉出微影与高光，人眼一眼就能分清先后层次与冷暖触感。`;

  if (quietCount === 0) {
    status = "clutter";
    badge = "堆料过载 · 破协调";
    headline = "五块全是强肌理互相抢戏，画面退化成满屏噪点";
    why = "此刻没有一块「手工棉纸」或「光滑漆面」留白休止，粗糙砂岩、颗粒陶土与冷钢全在高频发声，打破了原海报第二条「协调」。把底盘或衬底换回安静材质，焦点才会浮出来。";
  } else if (activeCount === 0 || !hasTactileGrit) {
    status = "flat";
    badge = "同质发平 · 缺摩擦";
    headline = "全是细腻柔面，表面拉不开触觉摩擦与粗细落差";
    why = `粗糙度仅落在 ${minR.toFixed(2)}–${maxR.toFixed(2)} 或缺少粗糙/颗粒锚点，视线顺着光滑与柔纸一滑而过。试着给底层大圆或中层方砖换上「粗糙砂岩」或「粗粒陶土」，再配光滑或金属形成反差。`;
  } else if (!contrastOk) {
    status = "flat";
    badge = "反差偏弱 · 缺光泽";
    headline = `粗糙度挤在 ${minR.toFixed(2)}–${maxR.toFixed(2)}，缺少光滑或金属拉开反射差`;
    why = "画面里只有哑光与哑光对话，反射光线方式过于接近，焦点抓不住眼睛。给前景三角或圆球换上「光滑漆面」或「拉丝冷钢」，立刻会出现利落高光与哑面的对话。";
  } else if (!layerOk) {
    const [a, b] = collidedSeams[0];
    const mName = MATERIALS[state.slots[a]].full;
    status = "seam";
    badge = "邻接撞材 · 层差粘连";
    headline = `「${SLOT_MAP[a].name}」与「${SLOT_MAP[b].name}」同用${mName}，交界处发糊`;
    why = `虽然整体材质跨度拉开了，但 6 处重叠缝里只有 ${cleanSeams} 处材质分离——紧挨叠放的「${SLOT_MAP[a].name}」和「${SLOT_MAP[b].name}」质地相同，削弱了原海报第三条「层次」。换掉其中一块，让每条压边都跨过材质边界。`;
  } else if (!lightOk) {
    status = "overhead";
    badge = "顺光压平 · 肌理藏身";
    headline = `材质配方已经成立，但 ${light.elevDeg}° 顶平光把凹凸微影抹平了`;
    why = "表面质感靠光线的斜射微影与高光锐度显形——正顶光会同时照亮凹坑和凸面，让砂岩与陶土显得发平。把顶部黄铜测光灯拖向左侧或右侧低角度，看微影与拉丝光泽怎么瞬间醒过来。";
  }

  return {
    status,
    badge,
    headline,
    why,
    light,
    checks: {
      contrast: contrastOk,
      harmony: harmonyOk,
      layer: layerOk,
      light: lightOk,
    },
    metrics: {
      minR,
      maxR,
      span,
      distinctCount,
      quietCount,
      activeCount,
      cleanSeams,
      totalSeams: SEAMS.length,
      collidedSeams,
      elevDeg: light.elevDeg,
    },
  };
}

// 2D 命中检测（按顶层到底层逆序，用于鼠标/触摸点选桌台上的任意标本）
export function hitTestSlot(u, v) {
  for (let i = SLOTS.length - 1; i >= 0; i--) {
    const s = SLOTS[i];
    if (s.shape === "disc" || s.shape === "sphere") {
      if (Math.hypot(u - s.u, v - s.v) <= s.r * 1.04) return s.id;
    } else if (s.shape === "tile" || s.shape === "sheet") {
      if (Math.abs(u - s.u) <= s.r * 1.02 && Math.abs(v - s.v) <= s.r * 1.02) return s.id;
    } else if (s.shape === "prism") {
      // 等边三角形命中检测
      const ax = s.u;
      const ay = s.v - s.r * 1.12;
      const bx = s.u - s.r * 1.05;
      const by = s.v + s.r * 0.68;
      const cx = s.u + s.r * 1.05;
      const cy = s.v + s.r * 0.68;
      if (pointInTri(u, v, ax, ay, bx, by, cx, cy)) return s.id;
    }
  }
  return null;
}

function pointInTri(px, py, ax, ay, bx, by, cx, cy) {
  const s1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const s2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const s3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const hasNeg = s1 < 0 || s2 < 0 || s3 < 0;
  const hasPos = s1 > 0 || s2 > 0 || s3 > 0;
  return !(hasNeg && hasPos);
}

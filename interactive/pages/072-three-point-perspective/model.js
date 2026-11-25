// 072 三点透视 · 共享几何与相机状态模型
// 开场 WebGL 3D、2D Canvas 降级、透视射线 HUD、三点雷达、第 03 节垂心画板与第 07 节练习
// 全部共用同一套真实 35 mm 针孔成像模型（统一以画框短边 = 24 mm 换算等效焦距）。

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

// 全页统一阈值（唯一来源：开场诊断、倾角仪警示带、第 02 节光学剖面、第 06 节移轴实验与正文保持一致）
export const THRESHOLDS = {
  levelEps: 2,       // |pitch| < 2° 视为端平两点透视
  awkwardMax: 18,    // 经验值：2°–18° 为「微仰/微俯歪楼区」
  ultraWideMax: 16,  // ≤ 16 mm 实拍超广角区
  normalMin: 35,     // ≥ 35 mm 常规/中长焦（3:4 画幅落入 60° 视觉锥内）
};

export const LIMITS = {
  pitchMin: -48,
  pitchMax: 52,
  yawMin: -42,
  yawMax: 42,
  focalMin: 8,       // 8 mm 为教学示意极超广角（真实 35 mm 针孔下三点全部同框的极限）
  focalMax: 85,
};

// 开场初始状态：停在最易翻车的微仰 +10° 歪楼区（不直接给出 +44° 答案，邀读者动手拨正或拉高）
export const INITIAL_STATE = {
  pitch: 10,
  yaw: -8,
  focal: 18,
  scene: "monolith",
  showRays: true,
  preset: "",
};

export const PRESETS = {
  poster: {
    id: "poster",
    label: "原海报仰视",
    short: "海报 +44°",
    pitch: 44,
    yaw: 0,
    focal: 8,
    scene: "monolith",
    note: "还原 072 号海报的教学夸大视角：按真实 35 mm 针孔换算约 8 mm（短边视角 ≈ 113°），三枚消失点才能全部同框。",
  },
  heroic: {
    id: "heroic",
    label: "建筑广角",
    short: "广角 +32°",
    pitch: 32,
    yaw: -6,
    focal: 24,
    scene: "monolith",
    note: "实拍更常用的 24 mm 仰视：左右消失点退到画框外，高耸冲天且不尖嘴变形。",
  },
  level: {
    id: "level",
    label: "平视两点",
    short: "平视 0°",
    pitch: 0,
    yaw: -6,
    focal: 28,
    scene: "monolith",
    note: "镜头放平的瞬间，第三消失点退至无穷远，垂直棱线彻底平行，退回两点透视。",
  },
  abyss: {
    id: "abyss",
    label: "高空俯视",
    short: "俯视 -42°",
    pitch: -42,
    yaw: 6,
    focal: 16,
    scene: "monolith",
    note: "镜头向下俯冲，视平线升至顶端，第三消失点落到底部变成天底消失点 VP↓。",
  },
};

export const SCENES = {
  monolith: { id: "monolith", label: "海报独塔", en: "MONOLITH" },
  cluster: { id: "cluster", label: "摩天塔群", en: "SKYLINE" },
  atrium: { id: "atrium", label: "天井峡谷", en: "CANYON" },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 竖向倾角仪百分比（顶部 = +52° → 0%，底部 = -48° → 100%），供轨道、警示带、刻度与游标唯一共用
export function pitchToPct(p) {
  return ((LIMITS.pitchMax - p) / (LIMITS.pitchMax - LIMITS.pitchMin)) * 100;
}

// 横向倾角条百分比（左侧 = -48° → 0%，右侧 = +52° → 100%），供移动端首屏横向俯仰条唯一共用
export function pitchToHorizPct(p) {
  return ((p - LIMITS.pitchMin) / (LIMITS.pitchMax - LIMITS.pitchMin)) * 100;
}

export function createState() {
  return { ...INITIAL_STATE };
}

// 真实 35 mm 针孔成像模型（统一以画框短边 = 24 mm 换算等效焦距）
// 横幅/方幅 (aspect >= 1)：短边为高 H = 24 mm → 半高 12 mm → fy = f / 12, fx = fy / aspect
// 竖幅 (aspect < 1)：短边为宽 W = 24 mm → 半宽 12 mm → fx = f / 12, fy = fx * aspect
// 像素焦距 fPx = (W / 2) * fx = (H / 2) * fy = Math.min(W, H) * (f / 24)
export function focalFactors(focalMm, aspect) {
  const a = clamp(aspect || 1.25, 0.4, 3.0);
  const s = focalMm / 12;
  const fy = a >= 1 ? s : s * a;
  const fx = a >= 1 ? s / a : s;
  const vFov = 2 * Math.atan(1 / fy) * RAD;
  const hFov = 2 * Math.atan(1 / fx) * RAD;
  return { fx, fy, vFov, hFov, aspect: a };
}

// 构建世界坐标系下的相机正交基 (R, U, F) 与机位 C
// 主塔坐标：前棱在 (0, y, 0)，左立面沿 -X (宽 W)，右立面沿 -Z (深 D)，高沿 +Y (0..H)
export function computeCamera(state, aspect) {
  const theta = clamp(state.pitch, LIMITS.pitchMin, LIMITS.pitchMax) * DEG;
  const phi = (45 + clamp(state.yaw, LIMITS.yawMin, LIMITS.yawMax)) * DEG;
  const { fx, fy, vFov, hFov } = focalFactors(state.focal, aspect);

  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);

  // 相机视线方向 F（指向塔体）、右向量 R、上向量 U（满足 R × U = -F，与 Three.js 右手相机严格一致）
  const F = [-sinP * cosT, sinT, -cosP * cosT];
  const R = [cosP, 0, -sinP];
  const U = [sinP * sinT, cosT, cosP * sinT];

  // Dolly 缩放：随 fy 线性退远，让塔体在手机 1:1、桌面 16:10 与超宽屏、以及 8–85 mm 全焦段下都饱满居画
  const sceneScale = state.scene === "cluster" ? 1.18 : state.scene === "atrium" ? 0.92 : 1.0;
  const dist = (3.4 + 8.6 * fy) * sceneScale;

  // 观察目标始终稳锁塔身中段，避免把塔抬飞出画框或在手机端留下大块空地面
  const H = 13.0;
  const s = sinT;
  const targetY = state.scene === "atrium"
    ? 6.5 - 1.1 * s
    : 6.4 - 0.85 * s;
  const targetOffset = state.scene === "atrium" ? 0.0 : -1.55;
  const T = [targetOffset, targetY, targetOffset];

  const C = [
    T[0] - F[0] * dist,
    T[1] - F[1] * dist,
    T[2] - F[2] * dist,
  ];

  return { C, T, F, R, U, fx, fy, vFov, hFov, aspect, theta, phi, dist, H };
}

// 精确针孔投影：世界点 P → 归一化屏幕坐标 { u, v, z }（u∈[0,1]左到右，v∈[0,1]上到下，z>0 在镜头前）
export function projectPoint(cam, p) {
  const vx = p[0] - cam.C[0];
  const vy = p[1] - cam.C[1];
  const vz = p[2] - cam.C[2];
  const cz = vx * cam.F[0] + vy * cam.F[1] + vz * cam.F[2];
  if (cz <= 0.02) return null;
  const cx = vx * cam.R[0] + vy * cam.R[1] + vz * cam.R[2];
  const cy = vx * cam.U[0] + vy * cam.U[1] + vz * cam.U[2];
  return {
    u: 0.5 + 0.5 * (cx * cam.fx) / cz,
    v: 0.5 - 0.5 * (cy * cam.fy) / cz,
    z: cz,
  };
}

// 精确计算三个消失点与视平线（含垂直平行的退化态）
export function vanishingPoints(cam) {
  const cosT = Math.cos(cam.theta);
  const sinT = Math.sin(cam.theta);
  const tanT = Math.tan(cam.theta);
  const cosP = Math.cos(cam.phi);
  const sinP = Math.sin(cam.phi);

  const hlV = 0.5 + 0.5 * tanT * cam.fy;

  // 左侧消失点 VP←（沿世界 -X 方向）
  const left = Math.abs(sinP) < 0.015
    ? { u: -1e4, v: hlV, infinite: true, label: "VP←" }
    : {
        u: 0.5 - 0.5 * ((cosP / sinP) / cosT) * cam.fx,
        v: hlV,
        infinite: false,
        label: "VP←",
      };

  // 右侧消失点 VP→（沿世界 -Z 方向）
  const right = Math.abs(cosP) < 0.015
    ? { u: 1e4, v: hlV, infinite: true, label: "VP→" }
    : {
        u: 0.5 + 0.5 * ((sinP / cosP) / cosT) * cam.fx,
        v: hlV,
        infinite: false,
        label: "VP→",
      };

  // 第三消失点 VP↑（仰视）或 VP↓（俯视）；|pitch| < levelEps 视为平视两点透视（VP → ∞）
  const isLevel = Math.abs(cam.theta * RAD) < THRESHOLDS.levelEps;
  const vertical = isLevel
    ? {
        u: 0.5,
        v: -1e4,
        infinite: true,
        dir: "level",
        label: "VP∞",
      }
    : {
        u: 0.5,
        v: 0.5 - 0.5 * (cosT / sinT) * cam.fy,
        infinite: false,
        dir: sinT > 0 ? "up" : "down",
        label: sinT > 0 ? "VP↑" : "VP↓",
      };

  const inFrame = (pt, pad = 0.02) =>
    !pt.infinite && pt.u >= pad && pt.u <= 1 - pad && pt.v >= pad && pt.v <= 1 - pad;

  return {
    hlV,
    left: { ...left, inside: inFrame(left) },
    right: { ...right, inside: inFrame(right) },
    vertical: { ...vertical, inside: inFrame(vertical) },
    isLevel,
  };
}

// 获取当前场景的全部建筑体块描述（WebGL 与 2D Canvas 共用同一份几何）
export function sceneBoxes(sceneId) {
  if (sceneId === "cluster") {
    return [
      { id: "main", x0: -3.2, x1: 0, y0: 0, y1: 13.0, z0: -3.2, z1: 0, floors: 18, cols: 5, primary: true },
      { id: "left", x0: -8.2, x1: -5.2, y0: 0, y1: 9.6, z0: -4.2, z1: -1.4, floors: 13, cols: 4, primary: false },
      { id: "right", x0: -4.2, x1: -1.4, y0: 0, y1: 10.4, z0: -8.2, z1: -5.2, floors: 14, cols: 4, primary: false },
      { id: "back", x0: -9.4, x1: -6.2, y0: 0, y1: 14.5, z0: -9.4, z1: -6.2, floors: 20, cols: 4, primary: false },
    ];
  }
  if (sceneId === "atrium") {
    return [
      { id: "nw", x0: -5.6, x1: -2.0, y0: 0, y1: 13.2, z0: -5.6, z1: -2.0, floors: 18, cols: 4, primary: true },
      { id: "ne", x0: 2.0, x1: 5.6, y0: 0, y1: 12.6, z0: -5.6, z1: -2.0, floors: 17, cols: 4, primary: false },
      { id: "sw", x0: -5.6, x1: -2.0, y0: 0, y1: 12.6, z0: 2.0, z1: 5.6, floors: 17, cols: 4, primary: false },
      { id: "se", x0: 2.0, x1: 5.6, y0: 0, y1: 11.4, z0: 2.0, z1: 5.6, floors: 15, cols: 4, primary: false },
    ];
  }
  return [
    { id: "main", x0: -3.2, x1: 0, y0: 0, y1: 13.0, z0: -3.2, z1: 0, floors: 18, cols: 5, primary: true },
  ];
}

// 根据实时状态与真实消失点几何生成「为什么」建筑与视觉心理诊断
export function diagnose(state, vps, cam) {
  const p = Math.round(state.pitch);
  const f = Math.round(state.focal);
  const y = Math.round(state.yaw);
  const absP = Math.abs(p);
  const fovDeg = cam ? Math.round(Math.min(cam.vFov, cam.hFov)) : Math.round(2 * Math.atan(12 / f) * RAD);
  const allInside = vps.left.inside && vps.right.inside && vps.vertical.inside;

  let badge = "仰视三点 · 崇高张力";
  let tone = "accent";
  let headline = "三向收束拉高楼体，视线直冲天顶";
  let body = "";

  if (absP < THRESHOLDS.levelEps) {
    badge = "平视 0° · 退回两点透视";
    tone = "neutral";
    headline = "第三消失点退至无穷远，竖线恢复平行";
    body = `相机端平在 ${p}°，垂直棱线与画框左右边严格平行，只剩视平线上的左右两枚消失点——高耸压迫感瞬间收起，回到冷静稳重的两点透视。`;
  } else if (p > 0 && p <= THRESHOLDS.awkwardMax) {
    badge = `微仰 +${p}° · 尴尬歪楼区`;
    tone = "warn";
    headline = "仰角不够干脆，像楼往后倒、相机没端平";
    body = `抬头 +${p}° 落在经验上最易翻车的 2°–${THRESHOLDS.awkwardMax}° 微仰区：VP↑ 还悬在画框上方之外，竖线只是轻微内斜，既无震撼气势又显失稳。试着拉过 +30° 唤出冲天仰视，或归 0° 扶直。`;
  } else if (p > THRESHOLDS.awkwardMax) {
    if (allInside) {
      badge = "极广角三点同框 · 072 海报级张力";
      tone = "accent";
      headline = "三枚消失点全部拉进画内，极强锐角冲击";
      body = `仰角 +${p}° 配 ${f} mm（短边视角约 ${fovDeg}°）的极端针孔广角，三枚消失点同时落入画框内——072 号原海报正是借这种超出常规实拍镜头的教学视角，一眼亮出完整三点结构。`;
    } else if (f <= THRESHOLDS.ultraWideMax) {
      badge = "超广角仰视 · 强楔形冲击";
      tone = "accent";
      headline = "实拍超广角仰拍，垂直收束猛烈";
      body = `仰角 +${p}° 配 ${f} mm 实拍超广角（短边视角约 ${fovDeg}°），${vps.vertical.inside ? "VP↑ 已落进画内" : "VP↑ 紧悬画框上沿外"}，左右消失点已退至框外——真实 14 mm 镜头其实很难把三点全装进一帧，想看海报式三点同框需推到 8–9 mm。`;
    } else if (f >= THRESHOLDS.normalMin) {
      badge = "中长焦仰视 · 克制收敛";
      tone = "accent";
      headline = "仰视成立，但消失点退远、体量更庄重";
      body = `${f} mm（短边视角约 ${fovDeg}°）退后取景，三向收束依然存在，只是三枚消失点都远退至画框之外：少了超广角的尖锐拉伸，楼体更厚实端正。`;
    } else {
      badge = "标准仰视三点 · 平衡高耸";
      tone = "accent";
      headline = "清晰仰视高度感，且左右角不过度尖锐";
      body = `+${p}° 仰角配合 ${f} mm 建筑广角（短边视角约 ${fovDeg}°），左右消失点退到画框外缘，既保留垂直收束的冲天势头，又避免了极超广角把墙角拉成尖嘴的畸变。`;
    }
  } else if (p < 0 && absP <= THRESHOLDS.awkwardMax) {
    badge = `微俯 ${p}° · 轻微失稳`;
    tone = "warn";
    headline = "略微低头让楼体上宽下窄，显得摇晃";
    body = `俯角 ${p}° 让竖线刚有一点向下收束，既看不出高空俯瞰的戏剧性，又破坏了建筑站立的稳固感。想拍出临渊俯视，不妨压到 -30° 以下。`;
  } else {
    badge = "俯视三点 · 深渊眩晕";
    tone = "accent";
    headline = "第三消失点翻到底部（VP↓），崇高转为失重";
    body = `原海报只讲了仰视，但把镜头压到 ${p}° 同样是标准三点透视：视平线升至画面上沿，垂直幕墙一路向下方天底消失点 VP↓ 坠落，观众瞬间变成悬在楼顶边缘的俯瞰者。`;
  }

  let yawNote = "";
  if (Math.abs(y) > 30) {
    yawNote = `当前偏航 ${y > 0 ? "+" : ""}${y}°，正快转成正面单墙，另一侧消失点已大幅甩出画外。`;
  } else if (Math.abs(y) < 3) {
    yawNote = "左右两面墙体对称平分，偏稳重；稍微侧转 8°–15° 能拉开主次立面反差。";
  } else {
    yawNote = y < 0
      ? "左侧亮面占幅更宽、右侧暗面收窄，明暗体量形成主次节奏。"
      : "右侧暗面展开更宽、左侧亮面压缩，阴影压迫感更强。";
  }

  const vpStatus = vps.isLevel
    ? "VP↑ → ∞（垂直线严格平行）"
    : allInside
      ? "三枚消失点均落入画内（极广角示意）"
      : `${vps.vertical.label} ${vps.vertical.inside ? "在画内" : "在画外"} · 左右点${vps.left.inside || vps.right.inside ? "近框边" : "在画外（低畸变）"}`;

  return { badge, tone, headline, body, yawNote, vpStatus };
}

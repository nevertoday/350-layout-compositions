// 016 居中构图的核心状态与视觉力学模型
// 所有坐标均以画框归一化比例表示：u ∈ [0, 1]（左→右），v ∈ [0, 1]（上→下）。
// WebGL 三维舞台与降级 SVG 舞台只读这一份状态，交互与读数完全一致。

export const GEOMETRIC_CENTER = { u: 0.5, v: 0.5 };
export const OPTICAL_CENTER = { u: 0.5, v: 0.465 }; // 略高于几何中心约 3.5%（经验值）

export const LIMITS = { uMin: 0.12, uMax: 0.88, vMin: 0.14, vMax: 0.86 };
export const SNAP_RADIUS = 0.045;

export const SUBJECTS = {
  sphere: {
    id: "sphere",
    label: "朱红圆体",
    en: "SPHERE",
    directional: false,
    note: "无方向性的纯圆，正中落点四向等距，最能呈现海报 016 的纯粹聚焦。",
  },
  arch: {
    id: "arch",
    label: "正立拱门",
    en: "FRONTAL ARCH",
    directional: false,
    note: "建筑正立面唯有居中平视才显庄严；哪怕偏离几厘米，透视一歪就会像没拍正。",
  },
  boat: {
    id: "boat",
    label: "侧向纸舟",
    en: "DIRECTIONAL",
    directional: true,
    note: "船头明确朝右：它自带前冲趋势，死卡正中反而会让船头显得局促。",
  },
};

export const GUIDES = {
  crosshair: { id: "crosshair", label: "十字准星", hud: "CROSSHAIR" },
  arnheim: { id: "arnheim", label: "阿恩海姆力场", hud: "STRUCTURAL FIELD" },
  optical: { id: "optical", label: "光学中心", hud: "OPTICAL +3.5%" },
};

// 边缘干扰物（打开时放在角落，直观拉偏视觉重心）
export const CLUTTER_ITEMS = [
  { u: 0.85, v: 0.21, w: 0.11, h: 0.11, weight: 0.26, kind: "block" },
  { u: 0.84, v: 0.79, w: 0.085, h: 0.085, weight: 0.18, kind: "circle" },
  { u: 0.16, v: 0.81, w: 0.075, h: 0.075, weight: 0.13, kind: "ring" },
];

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// 计算整幅画面的综合视觉重心（主体 + 边缘干扰物）
export function visualCentroid(pos, clutter) {
  if (!clutter) return { u: pos.u, v: pos.v, shift: 0 };
  const mainWeight = 1.0;
  let sumW = mainWeight;
  let sumU = pos.u * mainWeight;
  let sumV = pos.v * mainWeight;
  for (const item of CLUTTER_ITEMS) {
    sumW += item.weight;
    sumU += item.u * item.weight;
    sumV += item.v * item.weight;
  }
  const cu = sumU / sumW;
  const cv = sumV / sumW;
  const shift = Math.hypot(cu - pos.u, cv - pos.v);
  return { u: cu, v: cv, shift };
}

// 阿恩海姆「正方形隐性结构」示意力向量（教学模型，帮助直观感受拉扯方向）
// 在正中 (0.5, 0.5) 处合力为 0；轻微偏离时被中心强烈拉回；靠近边缘或四角时被边界吸附。
export function arnheimForce(u, v) {
  const du = u - 0.5;
  const dv = v - 0.5;
  const r = Math.hypot(du, dv);

  // 1. 中心引力（轻微偏移时拉回最强，过远后衰减）
  let fx = 0;
  let fy = 0;
  if (r > 0.004) {
    const centerPull = r < 0.22 ? Math.sin((r / 0.22) * Math.PI) * 0.95 : 0.12 * Math.exp(-(r - 0.22) * 5);
    fx += (-du / r) * centerPull;
    fy += (-dv / r) * centerPull;
  }

  // 2. 四边边界吸附力（越贴边越有被画框吸住的局促感）
  const edgePull = (d) => Math.max(0, (0.22 - d) / 0.22) ** 2 * 1.15;
  fx -= edgePull(u);
  fx += edgePull(1 - u);
  fy -= edgePull(v);
  fy += edgePull(1 - v);

  // 3. 中线与对角线微弱张力（体现不落轴时的不安分感）
  const mag = Math.min(1, Math.hypot(fx, fy));
  return { fx, fy, mag };
}

export function snapTarget(u, v, guide) {
  const candidates =
    guide === "optical"
      ? [OPTICAL_CENTER, GEOMETRIC_CENTER]
      : [GEOMETRIC_CENTER, OPTICAL_CENTER];
  let best = null;
  for (const c of candidates) {
    const d = Math.hypot(u - c.u, v - c.v);
    if (!best || d < best.d) best = { ...c, d };
  }
  return best && best.d < SNAP_RADIUS ? best : null;
}

export function classify(state) {
  const { u, v } = state.pos;
  const dGeo = Math.hypot(u - GEOMETRIC_CENTER.u, v - GEOMETRIC_CENTER.v);
  const dOpt = Math.hypot(u - OPTICAL_CENTER.u, v - OPTICAL_CENTER.v);
  const nearEdge = u < 0.2 || u > 0.8 || v < 0.2 || v > 0.8;
  const force = arnheimForce(u, v);
  const centroid = visualCentroid(state.pos, state.clutter);

  let zone = "eccentric";
  let badge = "已偏离中心";
  let headline = "进入偏心张力区";
  let body =
    "主体明显离开中点，静止平衡让位于方向与留白对比——这时画面的重心已经交给偏心构图去主导。";

  if (nearEdge) {
    zone = "edge";
    badge = "贴边失衡";
    headline = "被画框边缘吸住";
    body =
      "主体靠边太近，四周原本均匀托住它的缓冲场消失了，视线容易顺着窄缝直接滑出画面。";
  } else if (dOpt < 0.024 && state.guide === "optical") {
    zone = "optical";
    badge = "光学中心";
    headline = "略高于中点，更显挺拔";
    body =
      "比几何中心上提约 3.5%（经验值），抵消人眼对下方「重力下坠」的错觉，主体看着轻盈而稳固。";
  } else if (dGeo < 0.026) {
    zone = "center";
    badge = state.clutter ? "中心被干扰" : "正中锁定";
    headline = state.clutter ? "主体居中，但重心已偏" : "四向等距，零拉扯聚焦";
    body = state.clutter
      ? "主体本身稳在十字交点，可角落里的干扰块正在分走视觉重量——居中成立的前提是四周纯净。"
      : "上下左右边距完全均等，隐性结构力在此归零；目光进框便直接停在主体上，安定、庄重、毫无犹疑。";
  } else if (dOpt < 0.028 && v < 0.49) {
    zone = "optical";
    badge = "光学中心";
    headline = "落在视觉最挺拔的位置";
    body =
      "虽然比数学正中略高一点点，但在视觉上反而比死卡 50% 更稳当——许多海报与装裱都在这个区间微调。";
  } else if (dGeo < 0.13) {
    zone = "awkward";
    badge = "微妙偏离";
    headline = "像「没放正」的焦躁区";
    body =
      "离正中太近、又没对齐，阿恩海姆力场在这里拉扯最明显：眼睛既得不到居中的安稳，也看不出你是刻意偏心。";
  }

  // 针对带明确朝向的主体（侧向纸舟）给出帕尔默「向内偏好」提示
  let extra = SUBJECTS[state.subject].note;
  if (state.subject === "boat") {
    if (zone === "center" || zone === "optical") {
      badge = "朝向局促";
      headline = "侧向主体硬卡正中，前方略憋屈";
      body =
        "纸舟船头明确朝右。把它锁在正中时，前方和后方一样宽，船像停在原地；往左稍退一步，前方腾出航道，画面立刻通气。";
    } else if (u < 0.46 && u >= 0.24 && Math.abs(v - 0.5) < 0.16) {
      zone = "inward";
      badge = "顺应朝向";
      headline = "船尾稍退，前方留出航道";
      body =
        "有明确朝向的单主体往反方向退开一点、面向画面内部，比死卡正中更顺眼——这正是视觉心理研究里的「向内偏好」。";
    } else if (u > 0.56) {
      badge = "撞框感";
      headline = "朝向贴近右框，像快要撞墙";
      body =
        "船头本就朝右，再往右侧挪，前方空间被迅速挤扁，画面显得发紧。";
    }
  }

  // 叠加边缘杂物带来的重心漂移提示
  if (state.clutter && zone !== "center") {
    extra = `当前角落杂物把整幅画的视觉重心拉偏了约 ${Math.round(centroid.shift * 100)}% 画宽；关掉干扰物，立刻就能感觉到中心分量的回归。`;
  } else if (state.clutter && zone === "center") {
    extra = `右上与下方的杂物把视觉重心悄悄拉向右下约 ${Math.round(centroid.shift * 100)}% 画宽，破坏了四周的静默场。`;
  }

  const offsetX = Math.round((u - 0.5) * 100);
  const offsetY = Math.round((0.5 - v) * 100); // 正值表示高于几何中心
  const distPct = Math.round(dGeo * 100);

  return {
    zone,
    badge,
    headline,
    body,
    extra,
    force,
    centroid,
    offsetX,
    offsetY,
    distPct,
    locked: (zone === "center" || zone === "optical") && !state.clutter && state.subject !== "boat",
  };
}

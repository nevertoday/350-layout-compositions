// 048 椭圆构图 · 单真源几何模型与诊断核算
// 所有画布坐标、读数、五枚原海报圆徽状态、四步演化灯与诊断结论都从同一份实绘几何算出来。

export const SCENES = {
  river: {
    id: "river",
    label: "原海报·烟波孤舟",
    short: "烟波孤舟",
    subjectName: "孤舟渔人",
    copyTitle: "主体焦点",
    copyLines: ["将核心内容置于椭圆焦点，", "其余元素围绕支撑，", "形成自然的视觉秩序。"],
    skyTop: "#F3E4D9",
    skyMid: "#E6DDD4",
    lakeTop: "#9EB2AD",
    lakeBot: "#5E7B78",
    mtnFar: "#A7BDB7",
    mtnMid: "#617D76",
    mtnNear: "#1E4B49",
  },
  cameo: {
    id: "cameo",
    label: "宫廷·浮雕侧影",
    short: "浮雕侧影",
    subjectName: "剪影侧像",
    copyTitle: "柔和包裹",
    copyLines: ["舍去生硬直角边界，", "让头肩轮廓顺应弧线，", "在椭圆里安静落位。"],
    skyTop: "#F8E9E4",
    skyMid: "#EED6D1",
    lakeTop: "#DFC0BC",
    lakeBot: "#C69A9B",
    mtnFar: "#E6C7C4",
    mtnMid: "#CFA4A5",
    mtnNear: "#533046",
  },
  vessel: {
    id: "vessel",
    label: "画册·青瓷静物",
    short: "青瓷静物",
    subjectName: "青瓷长颈瓶",
    copyTitle: "优雅流动",
    copyLines: ["长轴牵引视线缓步游走，", "器物与标题分落两焦，", "留白呼吸一气呵成。"],
    skyTop: "#F6EFE7",
    skyMid: "#E6ECE9",
    lakeTop: "#C6D7D2",
    lakeBot: "#8AA8A2",
    mtnFar: "#CFE0DB",
    mtnMid: "#89A69F",
    mtnNear: "#2C5E5A",
  },
};

// 开场默认停在 0/4 四重失格态：绝不预给答案
export const INITIAL_STATE = {
  scene: "river",
  ratio: 1.04,          // 近似正圆，长短轴几乎无落差
  tilt: 12,             // 暧昧微倾
  scale: 1.24,          // 撑爆外框，上下弧顶被硬生生削平
  subj: { u: 0.03, v: 0.04 },   // 钉在几何死正中
  copy: { u: 0.14, v: -0.17 },  // 与主体挤在同一侧并贴脸碰撞
  marginMode: "cut",    // 四周塞入硬角切块，关闭顺形导流弧
  showGuides: true,
};

// 多组合法解（均通过 4/4，对应不同构图气质）
export const PRESETS = {
  poster: {
    label: "原海报斜势解",
    note: "约 58° 斜置椭圆 · 1.40:1 · 孤舟与标题分落双焦",
    patch: {
      ratio: 1.40,
      tilt: 58,
      scale: 0.85,
      subj: { u: -0.40, v: 0.12 },
      copy: { u: 0.42, v: -0.05 },
      marginMode: "curved",
    },
  },
  wide: {
    label: "横卧舒展解",
    note: "0° 水平扁椭圆 · 1.66:1 · 宽阔从容的风景长卷",
    patch: {
      ratio: 1.66,
      tilt: 0,
      scale: 0.79,
      subj: { u: -0.44, v: 0.14 },
      copy: { u: 0.44, v: -0.12 },
      marginMode: "curved",
    },
  },
  tall: {
    label: "竖立修长解",
    note: "90° 竖椭圆 · 1.48:1 · 优雅挺拔的肖像与封面",
    patch: {
      ratio: 1.48,
      tilt: 90,
      scale: 0.81,
      subj: { u: -0.38, v: 0.04 },
      copy: { u: 0.46, v: -0.04 },
      marginMode: "curved",
    },
  },
  // 主动试错按钮（验证反向也会报错）
  errRound: {
    label: "试错：塌成近圆",
    patch: { ratio: 1.05, scale: 0.86, tilt: 45, subj: { u: -0.36, v: 0.1 }, copy: { u: 0.4, v: -0.06 }, marginMode: "curved" },
  },
  errNeedle: {
    label: "试错：压成窄缝",
    patch: { ratio: 2.55, scale: 0.82, tilt: 54, subj: { u: -0.38, v: 0.1 }, copy: { u: 0.4, v: -0.06 }, marginMode: "curved" },
  },
  errClip: {
    label: "试错：切边破环",
    patch: { ratio: 1.40, scale: 1.28, tilt: 58, subj: { u: -0.38, v: 0.1 }, copy: { u: 0.42, v: -0.06 }, marginMode: "curved" },
  },
  errCenter: {
    label: "试错：死居中",
    patch: { ratio: 1.42, scale: 0.85, tilt: 58, subj: { u: 0.0, v: 0.0 }, copy: { u: 0.58, v: -0.04 }, marginMode: "curved" },
  },
};

export const LIMITS = {
  ratioMin: 1.00,
  ratioMax: 2.70,
  tiltMin: -45,
  tiltMax: 90,
  scaleMin: 0.50,
  scaleMax: 1.28,
  propGoodMin: 1.20,
  propGoodMax: 2.15,
  marginSafeFrac: 0.036,
  areaMinFrac: 0.21,
  centerDeadU: 0.16,
  centerDeadR: 0.18,
  rimMaxSubj: 0.72,
  rimMaxCopy: 0.74,
  pairMinDist: 0.56,
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 把状态和画布实测尺寸（CSS 像素）映射成唯一几何对象
export function computeGeometry(state, width, height) {
  const w = Math.max(240, width || 640);
  const h = Math.max(240, height || 500);
  const framePad = Math.round(clamp(Math.min(w, h) * 0.035, 10, 18));
  const matX = framePad;
  const matY = framePad;
  const matW = w - framePad * 2;
  const matH = h - framePad * 2;
  const cx = matX + matW * 0.5;
  const cy = matY + matH * 0.5;
  const S = Math.min(matW, matH);

  const ratio = clamp(state.ratio, LIMITS.ratioMin, LIMITS.ratioMax);
  const scale = clamp(state.scale, LIMITS.scaleMin, LIMITS.scaleMax);
  const tiltDeg = clamp(state.tilt, LIMITS.tiltMin, LIMITS.tiltMax);
  // 画布坐标 y 向下，因此让正倾角指向右上（+58° 对应原海报斜向右上）
  const alpha = (-tiltDeg * Math.PI) / 180;
  const cosA = Math.cos(alpha);
  const sinA = Math.sin(alpha);

  const rBase = S * 0.425 * scale;
  const a = rBase * Math.sqrt(ratio); // 半长轴
  const b = rBase / Math.sqrt(ratio); // 半短轴
  const e = ratio > 1.0001 ? Math.sqrt(Math.max(0, 1 - 1 / (ratio * ratio))) : 0; // 数学偏心率
  const c = a * e; // 半焦距

  // 旋转椭圆的精确外接矩形半宽、半高
  const halfW = Math.hypot(a * cosA, b * sinA);
  const halfH = Math.hypot(a * sinA, b * cosA);

  const marginLeft = (cx - halfW) - matX;
  const marginRight = (matX + matW) - (cx + halfW);
  const marginTop = (cy - halfH) - matY;
  const marginBottom = (matY + matH) - (cy + halfH);
  const minMarginPx = Math.min(marginLeft, marginRight, marginTop, marginBottom);
  const minMarginFrac = minMarginPx / S;
  const clipPx = Math.max(0, -minMarginPx);

  const areaFrac = (Math.PI * a * b) / (matW * matH);

  // 局部椭圆坐标 (u, v) <-> 画布像素 (x, y)
  const toCanvas = (u, v) => ({
    x: cx + u * a * cosA - v * b * sinA,
    y: cy + u * a * sinA + v * b * cosA,
  });
  const toLocal = (px, py) => {
    const dx = px - cx;
    const dy = py - cy;
    const rx = dx * cosA + dy * sinA;
    const ry = -dx * sinA + dy * cosA;
    return { u: rx / a, v: ry / b };
  };

  // 两枚真实数学焦点 F1（负半轴，原海报孤舟侧）与 F2（正半轴，原海报标题侧）
  const f1 = toCanvas(-e, 0);
  const f2 = toCanvas(e, 0);
  // 视觉推荐焦区中心（当 e 过大时向内回缩，避免顶撞弧尖）
  const visualFocalU = clamp(e * 0.64, 0.28, 0.50);
  const vf1 = toCanvas(-visualFocalU, 0);
  const vf2 = toCanvas(visualFocalU, 0);

  const subjPos = toCanvas(state.subj.u, state.subj.v);
  const copyPos = toCanvas(state.copy.u, state.copy.v);
  const crownPos = toCanvas(1, 0); // 长轴正端调柄
  const minorPos = toCanvas(0, -1);

  // 检测哪几条边发生裁切（用于画布精准标注切口）
  const clippedSides = {
    top: marginTop < 1,
    bottom: marginBottom < 1,
    left: marginLeft < 1,
    right: marginRight < 1,
  };

  return {
    w, h, framePad, matX, matY, matW, matH, cx, cy, S,
    ratio, scale, tiltDeg, alpha, cosA, sinA,
    a, b, e, c, halfW, halfH,
    marginLeft, marginRight, marginTop, marginBottom,
    minMarginPx, minMarginFrac, clipPx, areaFrac, clippedSides,
    f1, f2, vf1, vf2, visualFocalU,
    subjPos, copyPos, crownPos, minorPos,
    toCanvas, toLocal,
  };
}

// 统一诊断：返回 4 项规则、8 类精确错态、五枚原海报圆徽读数、四步演化进度、一键修补方案
export function evaluate(state, width, height) {
  const g = computeGeometry(state, width, height);
  const { u: su, v: sv } = state.subj;
  const { u: cu, v: cv } = state.copy;

  const subjR = Math.hypot(su, sv);
  const copyR = Math.hypot(cu, cv);
  const pairDist = Math.hypot(su - cu, sv - cv);

  // 1. 长短轴比例（双向检验）
  const tooRound = g.ratio < LIMITS.propGoodMin;
  const tooNeedle = g.ratio > LIMITS.propGoodMax;
  const propOk = !tooRound && !tooNeedle;

  // 2. 弧环完整性与分量（双向检验）
  const isClipped = g.minMarginPx < 1;
  const isTight = !isClipped && g.minMarginFrac < LIMITS.marginSafeFrac;
  const isTooSmall = g.areaFrac < LIMITS.areaMinFrac;
  const ringOk = !isClipped && !isTight && !isTooSmall;

  // 3. 双焦主次落位（双向检验）
  const subjDeadCenter = Math.abs(su) < LIMITS.centerDeadU && subjR < LIMITS.centerDeadR;
  const subjRimHit = subjR > LIMITS.rimMaxSubj;
  const copyRimHit = copyR > LIMITS.rimMaxCopy;
  const pairCollide = pairDist < LIMITS.pairMinDist;
  const sameSide = su * cu > -0.02;
  const focusOk = !subjDeadCenter && !subjRimHit && !copyRimHit && !pairCollide && !sameSide;

  // 4. 顺形留白与导流弧
  const flowOk = state.marginMode === "curved";

  const score = [propOk, ringOk, focusOk, flowOk].filter(Boolean).length;

  // 收集按严重度排序的精确问题清单
  const issues = [];
  if (isClipped) {
    issues.push({
      code: "clipped",
      tag: `切边 −${Math.max(1, Math.round(g.clipPx))}px`,
      headline: `椭圆弧线被外框削平了 ${Math.max(1, Math.round(g.clipPx))}px，包裹感瞬间泄气`,
      why: "原海报 TIPS 3 提醒「留白应顺应椭圆外形，避免切割曲线的完整性」。闭合弧线一旦被直框切平，眼睛顺着曲线绕行到切口处会直接滑出画外，椭圆容器就破了。",
      how: "把「椭圆尺度」往左收回至 78%–88%，让整圈弧线四周都留出顺形呼吸余量。",
      fixLabel: "收回尺度并恢复完整弧环",
      fixPatch: { scale: 0.85 },
    });
  } else if (isTight) {
    issues.push({
      code: "tight",
      tag: `贴边 ${Math.round(g.minMarginPx)}px`,
      headline: `弧缘离画框只剩 ${Math.round(g.minMarginPx)}px，曲线喘不过气`,
      why: "椭圆和矩形外框之间若几乎贴死，弧线会显得被塞进过小的盒子里，优雅的舒展感变成紧绷的挤压感。",
      how: "稍微缩小「椭圆尺度」，在弧顶和外框之间留出清晰可呼吸的余白。",
      fixLabel: "留出安全顺形边距",
      fixPatch: { scale: clamp(state.scale - 0.10, 0.72, 0.86) },
    });
  } else if (isTooSmall) {
    issues.push({
      code: "tiny",
      tag: `占比 ${Math.round(g.areaFrac * 100)}%`,
      headline: `椭圆缩得太小（仅占 ${Math.round(g.areaFrac * 100)}%），撑不起主视觉容器`,
      why: "椭圆构图靠曲线围合形成视觉舞台。缩得过小后，画面沦为大片空纸中央的一枚小贴纸，包裹和引导力都散掉了。",
      how: "把「椭圆尺度」向右推到 78%–90%，让椭圆成为无可争议的画面主容器。",
      fixLabel: "放大椭圆建立包裹分量",
      fixPatch: { scale: 0.85 },
    });
  }

  if (tooRound) {
    issues.push({
      code: "round",
      tag: `近圆 ${g.ratio.toFixed(2)}:1`,
      headline: `长短轴比只有 ${g.ratio.toFixed(2)}:1，几乎塌成一枚画歪的正圆`,
      why: "047 圆形构图靠严格 1:1 锁定静态向心；椭圆构图必须把长短轴拉开明显落差（建议 1.25:1–2.05:1），两枚焦点才会分开，画面才有方向和修长韵味。",
      how: "向右拖动「长短轴比」滑杆（或拉动画布上的长轴端柄），拉出清晰的椭圆舒展感。",
      fixLabel: "拉开 1.40:1 优雅椭圆比例",
      fixPatch: { ratio: 1.40, tilt: Math.abs(state.tilt) < 18 ? 58 : state.tilt },
    });
  } else if (tooNeedle) {
    issues.push({
      code: "needle",
      tag: `过扁 ${g.ratio.toFixed(2)}:1`,
      headline: `长短轴比拉到 ${g.ratio.toFixed(2)}:1，内腔被压成一道窄缝`,
      why: "虽然原海报说「越修长越具动感」，但超过约 2.2:1 后，短轴空间被彻底压扁，主体和文字被迫贴墙挤在一起，动感反倒变成了窒息感。",
      how: "把「长短轴比」往左回收到 1.30:1–1.90:1，让柔和曲率重新撑开内部空间。",
      fixLabel: "收回比例撑开内部空间",
      fixPatch: { ratio: 1.50 },
    });
  }

  if (subjRimHit || copyRimHit) {
    const who = subjRimHit ? SCENES[state.scene].subjectName : "标题块";
    issues.push({
      code: "rimHit",
      tag: "撞壁越界",
      headline: `${who}顶到了椭圆弧壁，曲线包裹被硬生生撑破`,
      why: "椭圆边缘的曲率会自然把视线往里收拢；把主体或标题推到弧壁边缘甚至越出弧外，会在曲线最柔和的地方制造刺眼的碰撞。",
      how: `直接把画布里的${who}往内部焦区拖回（远离弧边），保持清晰的内圈余白。`,
      fixLabel: "把元素收回双焦安全区",
      fixPatch: {
        subj: { u: -0.40, v: 0.11 },
        copy: { u: 0.42, v: -0.06 },
      },
    });
  } else if (subjDeadCenter && !pairCollide) {
    issues.push({
      code: "center",
      tag: "死居中",
      headline: "主体钉在几何正中，浪费了椭圆独有的双焦张力",
      why: "几何正中属于正圆的静态锁死点。放在椭圆里，主体偏离中心落向一侧焦区（同时让标题或留白在另一侧焦区呼应），视线才会在两焦之间轻柔回旋。",
      how: "拖动画布里的主体滑向 F1 焦区（负半轴偏下或偏左），感受画面立刻松活下来。",
      fixLabel: "把主体轻推入 F1 焦区",
      fixPatch: {
        subj: { u: -0.40, v: 0.11 },
        copy: { u: 0.42, v: -0.06 },
      },
    });
  } else if (pairCollide) {
    issues.push({
      code: "collide",
      tag: "主次撞车",
      headline: "主体与标题挤在一起，椭圆的另一半完全落空",
      why: "椭圆天生拥有两枚焦点 F1 与 F2。把主体和说明文字堆在同一点上，既互相遮挡抢戏，又让长轴另一端空荡失衡。",
      how: "在画布上把主体拖向一端焦区（F1），把标题块拖向另一端焦区（F2），形成对角呼应。",
      fixLabel: "沿长轴分置双焦呼应",
      fixPatch: {
        subj: { u: -0.40, v: 0.11 },
        copy: { u: 0.42, v: -0.06 },
      },
    });
  } else if (sameSide) {
    issues.push({
      code: "sameSide",
      tag: "单侧失重",
      headline: "主体与标题落在了椭圆同一侧，画面一头沉",
      why: "两个视觉重量压在同一端焦点附近，椭圆像一艘船头压水的木舟；把次要标题移到对面焦点区域，整枚椭圆的重心就会立刻稳住。",
      how: "把标题块拖过短轴中线，安放到与主体相对的另一枚焦区附近。",
      fixLabel: "把标题移至对面焦点平衡",
      fixPatch: {
        copy: { u: su <= 0 ? 0.42 : -0.42, v: -0.06 },
      },
    });
  }

  if (!flowOk) {
    issues.push({
      code: "hardCorner",
      tag: "硬角破形",
      headline: "四周硬角块切进留白，打断了椭圆的顺形呼吸",
      why: "椭圆的魅力在于通体连续的柔和曲率。在四角堆入生硬直角块、又拿掉贴弧导流线，眼睛会被生硬折角拉走，柔和与流动感荡然无存。",
      how: "将「外围留白」切为「顺形留白 + 导流弧」，让空白与装饰顺着椭圆弧线自然生长。",
      fixLabel: "切换顺形留白与导流弧",
      fixPatch: { marginMode: "curved" },
    });
  }

  // 根据倾角与比例归类当前椭圆的视觉气质（明确标「示意」）
  let postureLabel = "斜势优雅（示意）";
  if (score < 4) {
    postureLabel = score === 0 ? "四重失序（示意）" : `${4 - score} 项待修（示意）`;
  } else if (Math.abs(g.tiltDeg) <= 18) {
    postureLabel = g.ratio >= 1.55 ? "横卧舒展（示意）" : "平稳横弧（示意）";
  } else if (Math.abs(g.tiltDeg) >= 72) {
    postureLabel = "竖立修长（示意）";
  } else {
    postureLabel = "斜势流韵（示意）";
  }

  const primary = issues[0] || {
    code: "ok",
    tag: "4/4 成立",
    headline: `${g.ratio.toFixed(2)}:1 椭圆包裹完整，主次沿双焦自然呼应`,
    why: Math.abs(g.tiltDeg) <= 18
      ? "水平扁椭圆放宽了左右视野，弧环四周顺形透气；主体与标题分镇左右两焦，视线在柔弧里舒展往复，正合原海报「越扁平越舒展」的节奏。"
      : Math.abs(g.tiltDeg) >= 72
      ? "竖立修长椭圆拉出向上的优雅势能，弧线完整未遭裁切；主体坐稳下焦、标题轻悬上焦，重心从容不坠。"
      : "斜置长轴为静止画面注入轻柔流动感，外环导流虚弧与顺形留白完整托住主体，双焦一实一虚，正是 048 椭圆构图的精髓。",
    how: "还可以继续试着切「横卧舒展解」「竖立修长解」，或点「演播视线流」看眼动轨迹如何顺弧循环。",
    fixLabel: "演播视线流",
    fixPatch: null,
  };

  // 五枚原海报关键词圆徽的实时探针读数
  const badges = [
    {
      key: "softness",
      zh: "柔和",
      en: "SOFTNESS",
      desc: "曲线过渡，减少视觉冲突，舒适自然。",
      tone: "teal",
      ok: propOk && flowOk,
      chip: !flowOk ? "硬角冲突" : tooNeedle ? `过窄 ${g.ratio.toFixed(2)}:1` : tooRound ? "缺椭圆弧" : "曲率柔和",
      layer: "contour",
    },
    {
      key: "enclosure",
      zh: "包裹",
      en: "ENCLOSURE",
      desc: "形成视觉容器，突出主体，增强聚焦。",
      tone: "coral",
      ok: ringOk,
      chip: isClipped ? `切边 −${Math.max(1, Math.round(g.clipPx))}px` : isTight ? `贴边 ${Math.round(g.minMarginPx)}px` : isTooSmall ? "容器过小" : `余量 ${Math.round(g.minMarginPx)}px`,
      layer: "margin",
    },
    {
      key: "guidance",
      zh: "引导",
      en: "GUIDANCE",
      desc: "顺应椭圆的方向，自然引导视线流动。",
      tone: "plum",
      ok: propOk && focusOk,
      chip: tooRound ? "无长轴向" : focusOk ? `倾角 ${Math.round(g.tiltDeg)}°` : (subjDeadCenter ? "死居中" : pairCollide ? "主次撞车" : sameSide ? "单侧失重" : "撞壁越界"),
      layer: "foci",
    },
    {
      key: "elegance",
      zh: "优雅",
      en: "ELEGANCE",
      desc: "比例修长，节奏舒缓，传达高级与平衡之美。",
      tone: "teal",
      ok: propOk && ringOk,
      chip: `${g.ratio.toFixed(2)}:1 · e=${g.e.toFixed(2)}`,
      layer: "axes",
    },
    {
      key: "flow",
      zh: "流动",
      en: "FLOW",
      desc: "连续的曲线节奏，带来动态与生命力。",
      tone: "coral",
      ok: flowOk && !isClipped,
      chip: isClipped ? "切口断流" : !flowOk ? "导流中断" : "闭环流畅",
      layer: "flow",
    },
  ];

  // 原海报底沿「如何运用」四步活体进度
  const steps = [
    { id: 1, title: "1. 元素散乱无序", done: true, active: score === 0 },
    { id: 2, title: "2. 确定椭圆路径", done: propOk && ringOk, active: score > 0 && !(propOk && ringOk) },
    { id: 3, title: "3. 突出主体 焦点明确", done: focusOk, active: propOk && ringOk && !focusOk },
    { id: 4, title: "4. 完成 优雅统一", done: score === 4, active: score === 4 },
  ];

  return {
    g,
    score,
    propOk,
    ringOk,
    focusOk,
    flowOk,
    isClipped,
    isTight,
    isTooSmall,
    tooRound,
    tooNeedle,
    subjDeadCenter,
    subjRimHit,
    copyRimHit,
    pairCollide,
    sameSide,
    subjR,
    copyR,
    pairDist,
    postureLabel,
    primary,
    issues,
    badges,
    steps,
  };
}

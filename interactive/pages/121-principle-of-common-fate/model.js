// 121 共同命运原则 · 单真源运动模型
// 所有粒子实时坐标、速度矢量、夹角散度、快慢比、动静占比与 8 类错态全部从本模块算出。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报弧线编队",
    shortLabel: "原海报编队",
    note: "还原 121 号海报的 3 颗朱橘运动点与 12 颗松绿 / 樱粉 / 暖砂静止点。",
  },
  camouflage: {
    id: "camouflage",
    label: "纯墨破伪装盲测",
    shortLabel: "纯墨盲测",
    note: "拿掉颜色差异，15 颗完全相同的墨黑圆点里，仅靠同向同步运动就能瞬间剥离编队。",
  },
  kanban: {
    id: "kanban",
    label: "多选卡片拖移",
    shortLabel: "多选拖移",
    note: "真实看板交互：被勾选的多张任务卡同向齐移，未选卡片静定作底，一眼确认哪几张被带走。",
  },
};

// 15 颗点精确对应 121 原海报的构图分布（归一化坐标 u, v 处于 0..1）
// 索引 0..2 为原海报中央 3 颗朱橘运动体，3..14 为 12 颗静止背景点（松绿 / 樱粉 / 暖砂）
export const BASE_DOTS = [
  { id: 0, u: 0.44, v: 0.34, role: "orange", r: 0.044, card: "核对首屏动效", tag: "A-01", seed: 0.12 },
  { id: 1, u: 0.37, v: 0.50, role: "orange", r: 0.044, card: "统一缓动曲线", tag: "A-02", seed: 0.58 },
  { id: 2, u: 0.33, v: 0.66, role: "orange", r: 0.044, card: "添加暂停开关", tag: "A-03", seed: 0.91 },
  { id: 3, u: 0.13, v: 0.18, role: "green", r: 0.041, card: "字体子集打包", tag: "B-04", seed: 0.22 },
  { id: 4, u: 0.29, v: 0.24, role: "sand", r: 0.043, card: "色彩对比复查", tag: "B-05", seed: 0.77 },
  { id: 5, u: 0.43, v: 0.16, role: "sand", r: 0.038, card: "窄屏溢出测试", tag: "B-06", seed: 0.35 },
  { id: 6, u: 0.69, v: 0.22, role: "green", r: 0.040, card: "键盘焦点动线", tag: "B-07", seed: 0.64 },
  { id: 7, u: 0.08, v: 0.35, role: "pink", r: 0.042, card: "海报灯箱拖拽", tag: "B-08", seed: 0.48 },
  { id: 8, u: 0.19, v: 0.44, role: "sand", r: 0.040, card: "触屏纵向滚动", tag: "B-09", seed: 0.83 },
  { id: 9, u: 0.68, v: 0.42, role: "sand", r: 0.040, card: "降级静态轨迹", tag: "B-10", seed: 0.19 },
  { id: 10, u: 0.09, v: 0.59, role: "green", r: 0.042, card: "图标字形校对", tag: "B-11", seed: 0.71 },
  { id: 11, u: 0.61, v: 0.61, role: "pink", r: 0.042, card: "引注坐标联动", tag: "B-12", seed: 0.29 },
  { id: 12, u: 0.18, v: 0.84, role: "green", r: 0.041, card: "矢量读数核验", tag: "B-13", seed: 0.52 },
  { id: 13, u: 0.36, v: 0.85, role: "pink", r: 0.041, card: "离线单文件检", tag: "B-14", seed: 0.94 },
  { id: 14, u: 0.56, v: 0.81, role: "green", r: 0.042, card: "帧率节流实测", tag: "B-15", seed: 0.41 },
];

// 看板模式下的 4×3 整洁排布（取前 12 项）
export const KANBAN_SLOTS = Array.from({ length: 12 }, (_, idx) => {
  const col = idx % 3;
  const row = Math.floor(idx / 3);
  return {
    u: 0.11 + col * 0.20,
    v: 0.19 + row * 0.20,
  };
});

// 初始 0/4 错态：超速过载 + 方向散射 + 速度脱队/相位错拍 + 背景躁动（四维全红，绝不先给答案）
export function createInitialState() {
  return {
    scene: "poster",
    headingDeg: -24,     // 基准方向角（度），-24° 指向右上方
    spreadDeg: 52,       // 编队内方向散度（0 = 齐向，>18 = 散射，>=110 = 逆向对撞）
    curve: -0.26,        // 轨迹曲率（负值上拱，还原原海报柔和上扬弧线）
    baseSpeed: 248,      // 基准速度（px/s 示意量，45..225 为舒适带，>230 为超速过载）
    speedRatio: 2.55,    // 组内最快/最慢速度比（1.0 = 严格同速）
    phaseLag: 62,        // 起止同步相位差（0..100%，<=18% 为同步）
    bgNoise: 58,         // 背景静止点躁动度（0..100%，<=15% 为静定背景）
    memberFlags: BASE_DOTS.map((_, i) => i < 3),
    paused: false,
    showGuides: true,
    activePreset: "broken",
  };
}

export const PRESETS = {
  broken: {
    label: "复原 0/4 错态",
    kind: "reset",
    patch: () => ({
      scene: "poster",
      headingDeg: -24,
      spreadDeg: 52,
      curve: -0.26,
      baseSpeed: 248,
      speedRatio: 2.55,
      phaseLag: 62,
      bgNoise: 58,
      memberFlags: BASE_DOTS.map((_, i) => i < 3),
      paused: false,
      activePreset: "broken",
    }),
  },
  posterSolution: {
    label: "原海报弧线解",
    kind: "valid",
    patch: () => ({
      scene: "poster",
      headingDeg: -26,
      spreadDeg: 0,
      curve: -0.28,
      baseSpeed: 122,
      speedRatio: 1.0,
      phaseLag: 0,
      bgNoise: 0,
      memberFlags: BASE_DOTS.map((_, i) => i < 3),
      paused: false,
      activePreset: "posterSolution",
    }),
  },
  camoSolution: {
    label: "纯墨破伪装解",
    kind: "valid",
    patch: () => ({
      scene: "camouflage",
      headingDeg: -16,
      spreadDeg: 4,
      curve: -0.14,
      baseSpeed: 134,
      speedRatio: 1.05,
      phaseLag: 4,
      bgNoise: 0,
      memberFlags: BASE_DOTS.map((_, i) => i === 0 || i === 1 || i === 2 || i === 8),
      paused: false,
      activePreset: "camoSolution",
    }),
  },
  horizontalSolution: {
    label: "水平多选解",
    kind: "valid",
    patch: () => ({
      scene: "kanban",
      headingDeg: 0,
      spreadDeg: 0,
      curve: 0,
      baseSpeed: 118,
      speedRatio: 1.0,
      phaseLag: 0,
      bgNoise: 0,
      memberFlags: BASE_DOTS.map((_, i) => i === 0 || i === 4 || i === 8),
      paused: false,
      activePreset: "horizontalSolution",
    }),
  },
  trapAllMove: {
    label: "试错：全员齐动",
    kind: "trap",
    patch: () => ({
      scene: "poster",
      headingDeg: -22,
      spreadDeg: 2,
      curve: -0.2,
      baseSpeed: 126,
      speedRatio: 1.0,
      phaseLag: 0,
      bgNoise: 0,
      memberFlags: BASE_DOTS.map((_, i) => i < 13),
      paused: false,
      activePreset: "trapAllMove",
    }),
  },
  trapDesync: {
    label: "试错：同向脱队",
    kind: "trap",
    patch: () => ({
      scene: "poster",
      headingDeg: -26,
      spreadDeg: 0,
      curve: -0.26,
      baseSpeed: 136,
      speedRatio: 2.8,
      phaseLag: 78,
      bgNoise: 0,
      memberFlags: BASE_DOTS.map((_, i) => i < 3),
      paused: false,
      activePreset: "trapDesync",
    }),
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function degToRad(d) {
  return (d * Math.PI) / 180;
}

// 周期性循环行程：0..1 内优雅滑行，带起步柔缓，确保视觉编队不断重复展示共同命运轨迹
export function computeCycleProgress(simTime, speedPx, phaseFrac) {
  if (speedPx < 6) return 0.56;
  const period = clamp(320 / speedPx, 1.05, 5.2);
  const raw = ((simTime / period) - phaseFrac + 10) % 1;
  // 留 0.14s 末段微停顿与起手，便于肉眼捕获每次齐步出发的“同步起跑”
  const p = clamp(raw / 0.88, 0, 1);
  // 轻柔的 easeInOutCubic 混合线性，兼顾等速感与起止信号
  const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  return 0.65 * p + 0.35 * ease;
}

// 沿着弧线轨道计算位置与切线角（严格复刻 121 海报弧形虚线，亦支持直线）
export function sampleArcPoint(startU, startV, lengthU, headingRad, curveAmt, s) {
  const ux = Math.cos(headingRad);
  const uy = Math.sin(headingRad);
  // 法线方向
  const nx = -uy;
  const ny = ux;
  // 控制点偏移：让曲率在上拱时呈现海报那样柔和向右上弯折的弧度
  const bend = curveAmt * lengthU * 0.62;
  const p0x = startU;
  const p0y = startV;
  const p1x = startU + ux * lengthU * 0.48 + nx * bend;
  const p1y = startV + uy * lengthU * 0.48 + ny * bend;
  const p2x = startU + ux * lengthU;
  const p2y = startV + uy * lengthU;

  const t = clamp(s, 0, 1);
  const mt = 1 - t;
  const u = mt * mt * p0x + 2 * mt * t * p1x + t * t * p2x;
  const v = mt * mt * p0y + 2 * mt * t * p1y + t * t * p2y;

  const du = 2 * mt * (p1x - p0x) + 2 * t * (p2x - p1x);
  const dv = 2 * mt * (p1y - p0y) + 2 * t * (p2y - p1y);
  const tangentRad = Math.atan2(dv, du);

  return { u, v, tangentRad, p0x, p0y, p1x, p1y, p2x, p2y };
}

// 计算当前时刻所有实绘粒子数据（被 canvas 与 diagnose 共同消费，杜绝读数与画面脱节）
export function computeParticles(state, simTime) {
  const isKanban = state.scene === "kanban";
  const count = isKanban ? 12 : BASE_DOTS.length;
  const activeIndices = [];
  for (let i = 0; i < count; i++) {
    if (state.memberFlags[i]) activeIndices.push(i);
  }
  const activeN = activeIndices.length;

  const items = [];
  for (let i = 0; i < count; i++) {
    const base = BASE_DOTS[i];
    const inFlock = !!state.memberFlags[i];
    const slot = isKanban ? KANBAN_SLOTS[i] : { u: base.u, v: base.v };

    if (inFlock) {
      const rank = activeIndices.indexOf(i);
      const normRank = activeN <= 1 ? 0 : (rank / (activeN - 1)) * 2 - 1; // -1 .. +1
      // 每个编队成员按 spreadDeg 对称分配偏航角；当 spreadDeg >= 110 时中间成员出现反向对撞
      let deltaDeg = normRank * (state.spreadDeg * 0.5);
      if (state.spreadDeg >= 110 && rank % 2 === 1) {
        deltaDeg = 180 - Math.max(0, 130 - state.spreadDeg);
      }
      const memberHeadingDeg = state.headingDeg + deltaDeg;
      const memberHeadingRad = degToRad(memberHeadingDeg);

      // 速度比按 rank 从慢到快分布，使得 max/min 精确等于 state.speedRatio
      const speedFactor = activeN <= 1
        ? 1
        : Math.pow(state.speedRatio, normRank * 0.5);
      const memberSpeed = state.baseSpeed * speedFactor;

      // 相位差按 rank 错开（0..0.46 周期）
      const phaseFrac = activeN <= 1
        ? 0
        : ((rank / Math.max(1, activeN - 1)) * (state.phaseLag / 100) * 0.46);

      const s = computeCycleProgress(simTime, memberSpeed, phaseFrac);

      // 轨迹起点和行程长度（保证圆点在画布中央舒适区内飞跃）
      const travelU = isKanban ? 0.24 : 0.34;
      const startU = isKanban
        ? slot.u
        : clamp(slot.u - Math.cos(memberHeadingRad) * travelU * 0.62, 0.08, 0.72);
      const startV = isKanban
        ? slot.v
        : clamp(slot.v - Math.sin(memberHeadingRad) * travelU * 0.62, 0.14, 0.88);

      const curveEff = isKanban ? state.curve * 0.35 : state.curve;
      const sample = sampleArcPoint(startU, startV, travelU, memberHeadingRad, curveEff, s);

      // 计算三连残影点（严格还原 121 原海报「运动 MOTION」的三连渐隐残影）
      const ghostStep = clamp((memberSpeed / 140) * 0.095, 0.025, 0.12);
      const ghosts = state.baseSpeed < 6 ? [] : [
        sampleArcPoint(startU, startV, travelU, memberHeadingRad, curveEff, Math.max(0, s - ghostStep * 2.1)),
        sampleArcPoint(startU, startV, travelU, memberHeadingRad, curveEff, Math.max(0, s - ghostStep * 1.05)),
      ];

      items.push({
        id: base.id,
        role: base.role,
        card: base.card,
        tag: base.tag,
        r: base.r,
        inFlock: true,
        u: sample.u,
        v: sample.v,
        startU,
        startV,
        travelU,
        curveEff,
        headingDeg: memberHeadingDeg,
        headingRad: memberHeadingRad,
        tangentRad: sample.tangentRad,
        speed: memberSpeed,
        phaseFrac,
        progress: s,
        ghosts,
        arc: {
          p0x: sample.p0x, p0y: sample.p0y,
          p1x: sample.p1x, p1y: sample.p1y,
          p2x: sample.p2x, p2y: sample.p2y,
        },
        vx: Math.cos(memberHeadingRad) * memberSpeed,
        vy: Math.sin(memberHeadingRad) * memberSpeed,
      });
    } else {
      // 背景点：正常情况静定不动；当 bgNoise > 0 时按各自随机方向躁动摇摆
      const noiseNorm = state.bgNoise / 100;
      const noiseAngle = (base.seed * Math.PI * 2) + simTime * (0.9 + base.seed * 0.8);
      const noiseAmp = noiseNorm * (isKanban ? 0.022 : 0.036);
      const jitterDir = (base.seed * 360) + (i * 71);
      const jitterSpeed = noiseNorm * 92 * (0.65 + 0.55 * base.seed);
      const isNoisy = noiseNorm > 0.04 && (i % 2 === 1 || noiseNorm > 0.45);
      const dx = isNoisy ? Math.cos(noiseAngle) * noiseAmp : 0;
      const dy = isNoisy ? Math.sin(noiseAngle * 1.3 + base.seed * 4) * noiseAmp : 0;

      items.push({
        id: base.id,
        role: base.role,
        card: base.card,
        tag: base.tag,
        r: base.r,
        inFlock: false,
        u: clamp(slot.u + dx, 0.05, 0.94),
        v: clamp(slot.v + dy, 0.09, 0.91),
        anchorU: slot.u,
        anchorV: slot.v,
        headingDeg: jitterDir % 360,
        headingRad: degToRad(jitterDir),
        tangentRad: noiseAngle + Math.PI * 0.5,
        speed: isNoisy ? jitterSpeed : 0,
        isNoisy,
        ghosts: [],
        vx: isNoisy ? Math.cos(noiseAngle + 1.57) * jitterSpeed : 0,
        vy: isNoisy ? Math.sin(noiseAngle + 1.57) * jitterSpeed : 0,
      });
    }
  }

  return items;
}

function angularDiffDeg(a, b) {
  let d = Math.abs((a - b) % 360);
  if (d > 180) d = 360 - d;
  return d;
}

// 单真源诊断：完全从实绘粒子数组与当前参数算出 4 维度与 8 类错态
export function diagnose(state, simTime = 0.8) {
  const particles = computeParticles(state, simTime);
  const total = particles.length;
  const flock = particles.filter((p) => p.inFlock);
  const bg = particles.filter((p) => !p.inFlock);
  const flockCount = flock.length;
  const flockShare = Math.round((flockCount / total) * 100);

  // 1) 从实际编队成员的单位速度矢量算最大夹角差 & 合矢量长度 R (0..1)
  let maxAngleSpan = 0;
  let sumUx = 0;
  let sumUy = 0;
  for (let i = 0; i < flock.length; i++) {
    sumUx += Math.cos(flock[i].headingRad);
    sumUy += Math.sin(flock[i].headingRad);
    for (let j = i + 1; j < flock.length; j++) {
      const diff = angularDiffDeg(flock[i].headingDeg, flock[j].headingDeg);
      if (diff > maxAngleSpan) maxAngleSpan = diff;
    }
  }
  const vectorCoherence = flockCount >= 2 ? Math.hypot(sumUx, sumUy) / flockCount : (flockCount === 1 ? 1 : 0);
  const avgSpeed = flockCount ? flock.reduce((s, p) => s + p.speed, 0) / flockCount : 0;
  const minSpeed = flockCount ? Math.min(...flock.map((p) => p.speed)) : 0;
  const maxSpeed = flockCount ? Math.max(...flock.map((p) => p.speed)) : 0;
  const actualSpeedRatio = minSpeed > 1 ? maxSpeed / minSpeed : 1;
  const noisyBgCount = bg.filter((p) => p.isNoisy).length;

  // 四大原海报维度的逐项评估
  // 维度 1：运动 MOTION
  let motionStatus = "ok";
  let motionTag = `${Math.round(avgSpeed)} px/s`;
  if (state.baseSpeed < 15 || flockCount === 0) {
    motionStatus = "error";
    motionTag = "全员静止";
  } else if (state.baseSpeed > 230) {
    motionStatus = "error";
    motionTag = `过载 ${Math.round(avgSpeed)}`;
  }

  // 维度 2：方向 DIRECTION
  let directionStatus = "ok";
  let directionTag = `散度 ${Math.round(maxAngleSpan)}°`;
  if (flockCount < 2) {
    directionStatus = "error";
    directionTag = "缺编队";
  } else if (maxAngleSpan >= 110) {
    directionStatus = "error";
    directionTag = `逆向 ${Math.round(maxAngleSpan)}°`;
  } else if (maxAngleSpan > 18) {
    directionStatus = "error";
    directionTag = `散射 ${Math.round(maxAngleSpan)}°`;
  }

  // 维度 3：同步 SYNC
  let syncStatus = "ok";
  let syncTag = `1.0× · 齐拍`;
  if (flockCount < 2 || state.baseSpeed < 15) {
    syncStatus = "error";
    syncTag = state.baseSpeed < 15 ? "未启动" : "孤点";
  } else if (actualSpeedRatio > 1.32) {
    syncStatus = "error";
    syncTag = `脱队 ${actualSpeedRatio.toFixed(1)}×`;
  } else if (state.phaseLag > 20) {
    syncStatus = "error";
    syncTag = `错拍 ${Math.round(state.phaseLag)}%`;
  } else {
    syncTag = `${actualSpeedRatio.toFixed(1)}× · 齐拍`;
  }

  // 维度 4：整体 UNITY
  let unityStatus = "ok";
  let unityTag = `${flockCount}/${total} 编队`;
  if (flockCount < 2) {
    unityStatus = "error";
    unityTag = `仅 ${flockCount} 枚`;
  } else if (flockCount / total > 0.72) {
    unityStatus = "error";
    unityTag = `全动 ${flockShare}%`;
  } else if (state.bgNoise > 16 && noisyBgCount > 0) {
    unityStatus = "error";
    unityTag = `底噪 ${noisyBgCount} 枚`;
  }

  const passed = [motionStatus, directionStatus, syncStatus, unityStatus].filter((x) => x === "ok").length;

  // 收集 8 类错态列表（按最致命的优先排在首位）
  const issues = [];
  if (flockCount < 2) {
    issues.push({
      code: "too-few",
      badge: "不足成群",
      title: `目前只有 ${flockCount} 枚元素在运动，凑不出共同命运`,
      body: "共同命运描述的是「多个元素」的群体归属。单颗圆点独自移动只是视线焦点，无法形成成组关系。",
      next: "直接在画布上点选 2 到 4 颗圆点把它们拉入编队，或点下方「原海报弧线解」。",
      fixAction: "addMembers",
      fixLabel: "补齐 3 枚编队",
    });
  }
  if (state.baseSpeed < 15) {
    issues.push({
      code: "static",
      badge: "全员静止",
      title: "基准速度归零，时间维度的共同命运尚未启动",
      body: "画面完全停住时，大脑只能退回颜色相似或距离邻近去猜分组——尤其在纯墨盲测模式下，3 颗编队点会彻底融进背景里。",
      next: "把「推进速度」调到 80–180 px/s，或在画布上向右横拖唤醒编队。",
      fixAction: "fixSpeed",
      fixLabel: "恢复柔和推进",
    });
  }
  if (maxAngleSpan >= 110 && flockCount >= 2) {
    issues.push({
      code: "opposite",
      badge: "逆向对撞",
      title: `编队内出现 ${Math.round(maxAngleSpan)}° 反向运动，阵营当场劈裂`,
      body: "方向相反的元素会被视觉系统知觉为相互对抗的两股力量，不仅无法归成一组，还会把读者注意力拉向两端。",
      next: "在画布上向右横拖（或拉低「方向散度」到 15° 以内），把所有编队成员扭回同一航向。",
      fixAction: "fixDirection",
      fixLabel: "点此统一航向",
    });
  } else if (maxAngleSpan > 18 && flockCount >= 2) {
    issues.push({
      code: "scatter",
      badge: "方向散射",
      title: `编队航向散开 ${Math.round(maxAngleSpan)}°，轨迹各自劈叉无法成组`,
      body: `海报第一条写着「共同的运动方向使这些元素被知觉为一组」。现在 ${flockCount} 枚成员朝不同角度飞散，眼睛会把它们拆成互不相干的散点。`,
      next: "直接在画布上向右横拖把航向理顺到 15° 以内，或点击画布上的红警签一步齐向。",
      fixAction: "fixDirection",
      fixLabel: `散射 ${Math.round(maxAngleSpan)}° · 点此齐向`,
    });
  }
  if (actualSpeedRatio > 1.32 && flockCount >= 2 && state.baseSpeed >= 15) {
    issues.push({
      code: "speed-split",
      badge: "速度脱队",
      title: `组内最快与最慢相差 ${actualSpeedRatio.toFixed(1)}×，刚起步就拉断`,
      body: "即使朝同一个方向飞，领头元素也会在不到一秒内甩开慢速成员。大脑感知不到刚性的整体位移，只能把它们看成前后掉队的个体。",
      next: "把「速度差」拉回 1.0×–1.2×，让编队成员保持等速并进。",
      fixAction: "fixSync",
      fixLabel: `脱队 ${actualSpeedRatio.toFixed(1)}× · 点此同速`,
    });
  }
  if (state.phaseLag > 20 && flockCount >= 2 && state.baseSpeed >= 15) {
    issues.push({
      code: "phase-lag",
      badge: "相位错拍",
      title: `起止相位错开 ${Math.round(state.phaseLag)}%，整块编队裂成了先后多米诺`,
      body: "先后错峰太久会让眼睛把元素读成「一前一后的顺序流程」，而不是同时归属一体的「同一组」。",
      next: "把「相位错拍」降到 15% 以内，让它们齐步出发、齐步停靠。",
      fixAction: "fixPhase",
      fixLabel: `错拍 ${Math.round(state.phaseLag)}% · 点此齐拍`,
    });
  }
  if (flockCount / total > 0.72) {
    issues.push({
      code: "all-move",
      badge: "全员齐动",
      title: `${flockCount}/${total}（${flockShare}%）都在一起移，画面丢掉了静止背景`,
      body: "海报第三条提醒「其余静止的元素被视为背景」。当几乎整个屏幕都在同向滑动，大脑以为是镜头在平移而非某一组元素在运动，分组边界彻底消失。",
      next: "在画布上点几颗外围圆点让它们停下来当静止背景，把运动占比压回 15%–55%。",
      fixAction: "fixShare",
      fixLabel: `占比 ${flockShare}% · 留出静底`,
    });
  }
  if (state.bgNoise > 16 && noisyBgCount > 0 && flockCount / total <= 0.72) {
    issues.push({
      code: "bg-noise",
      badge: "背景躁动",
      title: `有 ${noisyBgCount} 枚背景元素也在乱晃，静锚失稳搅浑了编队`,
      body: "共同命运依赖「静」与「动」的强烈反差。外围无关元素持续抖动会抢走余光注意，削弱主角编队的整体浮现感。",
      next: "把「背景躁动」降到 0%，让其余元素安静退居背景。",
      fixAction: "fixBg",
      fixLabel: `底噪 ${noisyBgCount} 枚 · 定静背景`,
    });
  }
  if (state.baseSpeed > 230) {
    issues.push({
      code: "overload",
      badge: "超速过载",
      title: `速度拉到 ${Math.round(avgSpeed)} px/s，轨迹糊成残影且易引起眩晕`,
      body: "过快的大幅平移不但让眼睛来不及追踪组群轮廓，还会触发前庭敏感用户的不适。动效服务于分组，不是比谁飞得快。",
      next: "把「推进速度」调回 70–200 px/s 的温和节奏。",
      fixAction: "fixSpeed",
      fixLabel: "降回温和速度",
    });
  }

  // 定性感知档位（绝不造假精确百分比）
  let unityTier = "清晰整体";
  if (passed === 4) {
    unityTier = state.scene === "camouflage" ? "破伪装成组" : "齐步成组";
  } else if (passed === 3) {
    unityTier = "临近成组";
  } else if (passed >= 1) {
    unityTier = "松散分裂";
  } else {
    unityTier = "一盘散沙";
  }

  let primary;
  if (passed === 4) {
    const dirDesc = Math.abs(state.headingDeg) < 8
      ? "水平向右"
      : state.headingDeg < 0
        ? `向右上方 ${Math.abs(Math.round(state.headingDeg))}°`
        : `向右下方 ${Math.round(state.headingDeg)}°`;
    const curveDesc = Math.abs(state.curve) > 0.12 ? "沿着平行弧轨" : "沿着平行直轨";
    const sceneBonus = state.scene === "camouflage"
      ? "尽管 15 颗黑点外观一模一样，你依然一眼把这组运动点从背景里剥离了出来。"
      : state.scene === "kanban"
        ? "被勾选的卡片齐步右滑、未选卡片稳稳锚定，操作归属零歧义。"
        : "这正是 121 号原海报的视觉真相：同向、同轨、同拍，其余静止圆点自动退成背景。";
    primary = {
      code: "valid",
      badge: `达标 · ${unityTier} (4/4)`,
      title: `${flockCount} 枚元素${curveDesc}${dirDesc}齐步滑行，瞬间凝成整体`,
      body: `最大方向散度仅 ${Math.round(maxAngleSpan)}°、快慢比 ${actualSpeedRatio.toFixed(1)}×、其余 ${total - flockCount} 枚保持静定。${sceneBonus}`,
      next: "继续试试切换到「纯墨盲测」看去掉颜色后分组还稳不稳，或点下方「试错」亲手拆散它。",
    };
  } else {
    const top = issues[0];
    primary = {
      code: top.code,
      badge: `错态 · ${top.badge} (${passed}/4)`,
      title: top.title,
      body: top.body,
      next: top.next,
    };
  }

  return {
    particles,
    passed,
    isValid: passed === 4,
    total,
    flockCount,
    bgCount: total - flockCount,
    flockShare,
    maxAngleSpan: Math.round(maxAngleSpan),
    vectorCoherence,
    avgSpeed: Math.round(avgSpeed),
    actualSpeedRatio: +actualSpeedRatio.toFixed(2),
    noisyBgCount,
    unityTier,
    dims: {
      motion: { status: motionStatus, tag: motionTag },
      direction: { status: directionStatus, tag: directionTag },
      sync: { status: syncStatus, tag: syncTag },
      unity: { status: unityStatus, tag: unityTag },
    },
    issues,
    primary,
  };
}

// 供画布内红警签一键修单项
export function applyQuickFix(state, action) {
  switch (action) {
    case "fixDirection":
      return { ...state, spreadDeg: 0, activePreset: "custom" };
    case "fixSync":
      return { ...state, speedRatio: 1.0, phaseLag: 0, activePreset: "custom" };
    case "fixPhase":
      return { ...state, phaseLag: 0, activePreset: "custom" };
    case "fixBg":
      return { ...state, bgNoise: 0, activePreset: "custom" };
    case "fixSpeed":
      return { ...state, baseSpeed: 124, activePreset: "custom" };
    case "fixShare":
      return { ...state, memberFlags: BASE_DOTS.map((_, i) => i < 3), activePreset: "custom" };
    case "addMembers":
      return { ...state, memberFlags: BASE_DOTS.map((_, i) => i < 3), activePreset: "custom" };
    default:
      return state;
  }
}

// 125 疏密对比原则 · 58 枚活体粒子物理与单真源密度场模型
// 状态仅保存在归一化二维坐标 (u, v) ∈ [0, 1] 与尺码 dotScale 中，
// 所有读数、四柱状态、剖面波、虚线折箭锚点与文字评述全部由此文件单真源算出。

export const PARTICLE_COUNT = 60;
export const REF_ASPECT = 2.25; // 等比度量空间宽/高比（宽度 2.25，高度 1.0）
export const GRID_COLS = 12;
export const GRID_ROWS = 4;
const BASE_RADIUS = 0.042; // 等比空间下的标准圆点半径（高度 1.0）
const SIGMA = 0.145; // 高斯核平滑半径
const INV_2SIG2 = 1 / (2 * SIGMA * SIGMA);

// 三套载体题材的微缩符号数据（同一密度场可切换呈现抽象圆点 / 杂志排印 / 展览导览）
export const CARRIERS = {
  dots: {
    id: "dots",
    label: "原海报 · 五色点群",
    short: "五色点群",
    desc: "承袭原海报五色渐变圆点阵，60 枚粒子按实时局部密度自动呈现深靛蓝→深松绿→朱橘→樱粉→暖沙米五色。",
  },
  type: {
    id: "type",
    label: "杂志 · 排印字块",
    short: "排印字块",
    desc: "把圆点换成印刷文字块与短杠，一眼看懂高密聚成标题群与栏块、稀疏留出阅读边白。",
  },
  exhibit: {
    id: "exhibit",
    label: "展讯 · 图文单元",
    short: "图文单元",
    desc: "模拟海报里的展期标签、几何徽章与导览碎点，体会视觉重心如何收束整张海报。",
  },
};

export const TOOLS = {
  attract: { id: "attract", label: "磁聚 · 收紧重心", short: "磁聚", verb: "按住拖抹把附近元素收紧成密核" },
  repel: { id: "repel", label: "风散 · 拨开留白", short: "风散", verb: "按住拖抹把元素推开造呼吸空区" },
  gradient: { id: "gradient", label: "拉链 · 推拉梯度", short: "推拉梯度", verb: "左右横拖连续推拉从均铺到强疏密的极化程度" },
};

// 稳定伪随机，确保预设格局每次复现一致且零闪烁
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- 7 组真实格局生成器（包含开场均质错态、3 组多向合法解、3 组典型错态） ----------

function makeUniform() {
  // 开场默认：10 列 × 6 行严丝合缝的等距平铺矩阵（60 颗），死板均质零起伏
  const pts = [];
  for (let r = 0; r < 6; r++) {
    const v = 0.12 + (r / 5) * 0.76;
    for (let c = 0; c < 10; c++) {
      const u = 0.055 + (c / 9) * 0.89;
      pts.push({ u, v });
    }
  }
  return { points: pts, dotScale: 1.0 };
}

function makePosterLeft() {
  // 复刻 125 原海报「左密右疏」渐变星群（60 颗）：
  // 左侧 6 行 × 4 列深靛蓝阵 (24) + 次密深松绿 (15) + 中过渡朱橘 (10) + 渐疏樱粉 (7) + 极疏暖沙米 (4) = 60
  const pts = [];
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 6; r++) {
      pts.push({ u: 0.045 + c * 0.046, v: 0.13 + r * 0.146 });
    }
  }
  const greenCoords = [
    [0.232, 0.14], [0.285, 0.145], [0.340, 0.16],
    [0.236, 0.28], [0.292, 0.275], [0.355, 0.285],
    [0.238, 0.42], [0.298, 0.43], [0.352, 0.415],
    [0.235, 0.56], [0.288, 0.58], [0.348, 0.55],
    [0.242, 0.70], [0.295, 0.72], [0.258, 0.855],
  ];
  for (const [u, v] of greenCoords) pts.push({ u, v });
  const orangeCoords = [
    [0.418, 0.155], [0.495, 0.215], [0.442, 0.315],
    [0.412, 0.455], [0.488, 0.44], [0.440, 0.595],
    [0.402, 0.715], [0.472, 0.74], [0.365, 0.85], [0.335, 0.695],
  ];
  for (const [u, v] of orangeCoords) pts.push({ u, v });
  const pinkCoords = [
    [0.585, 0.205], [0.672, 0.295], [0.555, 0.425],
    [0.620, 0.535], [0.552, 0.655], [0.658, 0.79],
    [0.735, 0.56],
  ];
  for (const [u, v] of pinkCoords) pts.push({ u, v });
  pts.push({ u: 0.805, v: 0.29 }, { u: 0.865, v: 0.74 }, { u: 0.942, v: 0.50 }, { u: 0.775, v: 0.84 });
  return { points: pts, dotScale: 1.0 };
}

function makeRadialCenter() {
  // 合法解 2：核密周疏（中心强凝聚，四周由密到疏呈星云渐散，四周广留白）
  const pts = [];
  const rand = mulberry32(12502);
  const rings = [
    { count: 1, rx: 0, ry: 0 },
    { count: 6, rx: 0.044, ry: 0.098 },
    { count: 12, rx: 0.088, ry: 0.195 },
    { count: 15, rx: 0.148, ry: 0.305 },
    { count: 15, rx: 0.245, ry: 0.385 },
    { count: 11, rx: 0.395, ry: 0.425 },
  ];
  for (let ri = 0; ri < rings.length; ri++) {
    const { count, rx, ry } = rings[ri];
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + ri * 0.42 + (rand() - 0.5) * 0.22;
      const jit = ri >= 3 ? (rand() - 0.5) * 0.05 : 0;
      const u = clamp(0.5 + Math.cos(ang) * (rx + jit), 0.05, 0.95);
      const v = clamp(0.5 + Math.sin(ang) * (ry + jit * 0.8), 0.10, 0.90);
      pts.push({ u, v });
    }
  }
  return { points: pts.slice(0, PARTICLE_COUNT), dotScale: 1.0 };
}

function makeDiagonalTopRight() {
  // 合法解 3：右上聚落 → 左下渐疏（镜像斜向，验证合法解绝不锁死单一方向）
  const base = makePosterLeft();
  const pts = base.points.map(({ u, v }) => ({
    u: clamp(1 - u, 0.05, 0.95),
    v: clamp(v * 0.92 + 0.03 + (u - 0.5) * 0.08, 0.10, 0.90),
  }));
  return { points: pts, dotScale: 1.0 };
}

function makeCrowded() {
  // 错态演示：全盘窒息拥挤（满屏铺散且占空尺码拉大至 1.52×，呼吸区归零）
  const base = makeUniform();
  const rand = mulberry32(12505);
  const pts = base.points.map(({ u, v }) => ({
    u: clamp(u + (rand() - 0.5) * 0.035, 0.05, 0.95),
    v: clamp(v + (rand() - 0.5) * 0.045, 0.10, 0.90),
  }));
  return { points: pts, dotScale: 1.52 };
}

function makeCliff() {
  // 错态演示：死角断崖（全部 58 颗挤死在最左 26% 窄带里，右侧 74% 一刀切全空，零渐变过渡）
  const pts = [];
  for (let c = 0; c < 10; c++) {
    for (let r = 0; r < 6; r++) {
      if (pts.length >= PARTICLE_COUNT) break;
      pts.push({
        u: 0.036 + c * 0.030,
        v: 0.125 + r * 0.148,
      });
    }
  }
  return { points: pts, dotScale: 0.95 };
}

function makeSplitThree() {
  // 错态演示：三团互搏（左、中、右均匀聚出 3 团势均力敌的密核，每团 20 颗）
  const pts = [];
  const centers = [0.13, 0.50, 0.87];
  const counts = [20, 20, 20];
  const rand = mulberry32(12507);
  for (let k = 0; k < 3; k++) {
    const cx = centers[k];
    const n = counts[k];
    for (let i = 0; i < n; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const u = clamp(cx + (col - 1.5) * 0.044 + (rand() - 0.5) * 0.008, 0.04, 0.96);
      const v = clamp(0.22 + row * 0.135 + (rand() - 0.5) * 0.012, 0.10, 0.90);
      pts.push({ u, v });
    }
  }
  return { points: pts, dotScale: 1.0 };
}

export const PRESETS = {
  uniform: { id: "uniform", label: "均匀平铺", tag: "开场", build: makeUniform },
  poster: { id: "poster", label: "左密右疏", tag: "原海报", build: makePosterLeft },
  radial: { id: "radial", label: "核密周疏", tag: "向心", build: makeRadialCenter },
  diagonal: { id: "diagonal", label: "右上聚落", tag: "对角", build: makeDiagonalTopRight },
  crowded: { id: "crowded", label: "满盘拥挤", tag: "过密", build: makeCrowded },
  cliff: { id: "cliff", label: "死角断崖", tag: "缺过渡", build: makeCliff },
  split: { id: "split", label: "三团互搏", tag: "多重心", build: makeSplitThree },
};

export function clamp(val, lo, hi) {
  return Math.max(lo, Math.min(hi, val));
}

// 创建粒子初始数组
export function createParticles(presetId = "uniform") {
  const { points, dotScale } = (PRESETS[presetId] || PRESETS.uniform).build();
  const particles = points.map((p, idx) => ({
    id: idx,
    u: p.u,
    v: p.v,
    tu: p.u, // 过渡目标坐标（仅在点预设切换时激活）
    tv: p.v,
    vx: 0,
    vy: 0,
    density: 0,
    normDensity: 0.5,
  }));
  return { particles, dotScale };
}

// 将粒子向目标点做柔和防重叠松弛（保证圆点颗颗分明、不糊成一团）
export function relaxParticles(particles, dotScale, iterations = 2) {
  const r = BASE_RADIUS * dotScale;
  const minDist = r * 2.08;
  const minDistSq = minDist * minDist;
  const marginU = clamp((r * 1.15) / REF_ASPECT, 0.025, 0.08);
  const marginV = clamp(r * 1.15, 0.06, 0.14);

  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        let dx = (b.u - a.u) * REF_ASPECT;
        let dy = b.v - a.v;
        let d2 = dx * dx + dy * dy;
        if (d2 < minDistSq) {
          if (d2 < 1e-6) {
            dx = ((i % 2 ? 1 : -1) * 0.005);
            dy = ((j % 2 ? 1 : -1) * 0.005);
            d2 = dx * dx + dy * dy;
          }
          const d = Math.sqrt(d2);
          const push = (minDist - d) * 0.42;
          const nx = dx / d;
          const ny = dy / d;
          const du = (nx * push) / REF_ASPECT;
          const dv = ny * push;
          a.u -= du;
          a.v -= dv;
          b.u += du;
          b.v += dv;
        }
      }
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.u = clamp(p.u, marginU, 1 - marginU);
      p.v = clamp(p.v, marginV, 1 - marginV);
    }
  }
}

// 画布手势笔刷施力：磁聚（attract）/ 风散（repel）/ 梯度拉链（gradient）
export function applyBrush(particles, tool, u, v, prevU, dotScale, dt = 0.016) {
  const step = Math.min(0.05, Math.max(0.008, dt));
  if (tool === "gradient") {
    // 左右横拖：u 越靠左越向左侧聚拢、u 越靠右则把点群向反方向或居中铺开，形成实时可连续推拉的极化场
    const du = u - (prevU ?? u);
    const pivot = clamp(u, 0.08, 0.92);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      // 按粒子序号与当前坐标构造平滑非线性疏密极化
      const rank = i / (particles.length - 1);
      // 当拖到左侧 (pivot < 0.45)，向左密右疏极化；拖到右侧 (pivot > 0.55)，向右密左疏极化；中间趋向均铺
      const polarity = (0.5 - pivot) * 2; // [-0.84, +0.84]
      const strength = Math.abs(polarity);
      const power = 1 + strength * 2.15;
      const targetU = polarity >= 0
        ? 0.045 + Math.pow(rank, power) * 0.90
        : 0.955 - Math.pow(rank, power) * 0.90;
      const follow = Math.min(0.28, step * 7.5 + Math.abs(du) * 1.6);
      p.u += (targetU - p.u) * follow;
      // 垂直微动保持呼吸韵律
      const spread = 0.14 + (0.86 - 0.14) * ((i * 7) % 11) / 10;
      p.v += (spread - p.v) * follow * 0.22;
    }
    relaxParticles(particles, dotScale, 2);
    return;
  }

  const radius = tool === "attract" ? 0.52 : 0.46;
  const force = (tool === "attract" ? 1.85 : -2.15) * step;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const dx = (u - p.u) * REF_ASPECT;
    const dy = v - p.v;
    const d = Math.hypot(dx, dy);
    if (d < radius && d > 0.004) {
      const falloff = Math.pow(1 - d / radius, 1.35);
      const pull = force * falloff;
      const nx = dx / d;
      const ny = dy / d;
      p.u += (nx * pull) / REF_ASPECT;
      p.v += ny * pull;
    }
  }
  relaxParticles(particles, dotScale, 2);
}

// 键盘方向键：把整个密核朝指定方向微移或聚拢
export function nudgeFocus(particles, dirU, dirV, tool, dotScale) {
  const cx = clamp(0.5 + dirU * 0.34, 0.12, 0.88);
  const cy = clamp(0.5 + dirV * 0.30, 0.18, 0.82);
  for (let k = 0; k < 4; k++) {
    applyBrush(particles, tool === "gradient" ? "attract" : tool, cx, cy, cx, dotScale, 0.032);
  }
}

// ---------- 单真源核心：直接从 58 枚粒子实绘坐标计算密度场与诊断结论 ----------

export function analyzeField(particles, dotScale = 1.0) {
  const scaleW = dotScale * dotScale;
  const n = particles.length;

  // 1. 计算每颗粒子的真实局部近邻密度（自贡献 + 周围粒子高斯贡献）
  let minP = Infinity;
  let maxP = -Infinity;
  for (let i = 0; i < n; i++) {
    const a = particles[i];
    let sum = 0.65 * scaleW;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const b = particles[j];
      const dx = (a.u - b.u) * REF_ASPECT;
      const dy = a.v - b.v;
      const d2 = dx * dx + dy * dy;
      if (d2 < 0.36) sum += Math.exp(-d2 * INV_2SIG2) * scaleW;
    }
    a.density = sum;
    if (sum < minP) minP = sum;
    if (sum > maxP) maxP = sum;
  }

  // 2. 在 12×4 = 48 个等面积空间网格中心采样连续密度场
  const cells = new Float32Array(GRID_COLS * GRID_ROWS);
  const profile12 = new Array(GRID_COLS).fill(0);
  let maxCell = 0;
  let minCell = Infinity;
  let sumCell = 0;

  let peakCol = 0;
  let peakRow = 0;
  let sparseCol = GRID_COLS - 1;
  let sparseRow = 1;

  for (let r = 0; r < GRID_ROWS; r++) {
    const gv = (r + 0.5) / GRID_ROWS;
    for (let c = 0; c < GRID_COLS; c++) {
      const gu = (c + 0.5) / GRID_COLS;
      let val = 0;
      for (let i = 0; i < n; i++) {
        const p = particles[i];
        const dx = (gu - p.u) * REF_ASPECT;
        const dy = gv - p.v;
        const d2 = dx * dx + dy * dy;
        if (d2 < 0.42) val += Math.exp(-d2 * INV_2SIG2) * scaleW;
      }
      const idx = r * GRID_COLS + c;
      cells[idx] = val;
      profile12[c] += val / GRID_ROWS;
      sumCell += val;
      if (val > maxCell) {
        maxCell = val;
        peakCol = c;
        peakRow = r;
      }
      if (val < minCell) {
        minCell = val;
        sparseCol = c;
        sparseRow = r;
      }
    }
  }

  // 3. 统计高密 / 过渡 / 稀疏三区面积占比（固定物理感知阈值，绝不随预设作弊）
  const SPARSE_TH = 1.35; // 低于此值：开阔透气呼吸区
  const DENSE_TH = 4.45;  // 高于此值：强视觉重心密核区
  let denseCount = 0;
  let midCount = 0;
  let sparseCount = 0;

  const sorted = Array.from(cells).sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    const v = sorted[i];
    if (v >= DENSE_TH) denseCount++;
    else if (v < SPARSE_TH) sparseCount++;
    else midCount++;
  }

  const totalCells = cells.length;
  const densePct = Math.round((denseCount / totalCells) * 100);
  const midPct = Math.round((midCount / totalCells) * 100);
  const sparsePct = Math.round((sparseCount / totalCells) * 100);

  // 疏密落差倍率：最密前 15%（7 格）均值 ÷ 最疏后 35%（17 格）均值（分母保护防除零）
  const topK = 7;
  const botK = 17;
  let topSum = 0;
  for (let i = totalCells - topK; i < totalCells; i++) topSum += sorted[i];
  let botSum = 0;
  for (let i = 0; i < botK; i++) botSum += sorted[i];
  const topMean = topSum / topK;
  const botMean = botSum / botK;
  const contrastRatio = topMean / Math.max(0.42, botMean);
  const ratioRounded = Math.round(contrastRatio * 10) / 10;

  // 全局覆盖估算（面积充填比，用于检测全盘挤爆窒息）
  const areaCoverage = (n * Math.PI * (BASE_RADIUS * dotScale) ** 2) / REF_ASPECT;
  const coveragePct = Math.min(99, Math.round(areaCoverage * 100));

  // 4. 连通分量 BFS：检测独立高密核团数（用相对高阈与绝对阈值取大，防小波动假团）
  const clusterTh = Math.max(4.45, maxCell * 0.62);
  const visited = new Uint8Array(totalCells);
  const clusterList = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const start = r * GRID_COLS + c;
      if (visited[start] || cells[start] < clusterTh) continue;
      const queue = [start];
      visited[start] = 1;
      let peak = 0;
      let size = 0;
      let su = 0;
      let sv = 0;
      let wsum = 0;
      while (queue.length) {
        const cur = queue.pop();
        const cr = Math.floor(cur / GRID_COLS);
        const cc = cur % GRID_COLS;
        const val = cells[cur];
        size++;
        if (val > peak) peak = val;
        su += ((cc + 0.5) / GRID_COLS) * val;
        sv += ((cr + 0.5) / GRID_ROWS) * val;
        wsum += val;
        const nbrs = [
          [cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1],
          [cr - 1, cc - 1], [cr - 1, cc + 1], [cr + 1, cc - 1], [cr + 1, cc + 1],
        ];
        for (const [nr, nc] of nbrs) {
          if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) continue;
          const ni = nr * GRID_COLS + nc;
          if (!visited[ni] && cells[ni] >= clusterTh) {
            visited[ni] = 1;
            queue.push(ni);
          }
        }
      }
      clusterList.push({ peak, size, u: su / wsum, v: sv / wsum });
    }
  }
  clusterList.sort((a, b) => b.peak * Math.sqrt(b.size) - a.peak * Math.sqrt(a.size));
  // 过滤掉远弱于主团的碎屑小峰
  const strongClusters = clusterList.filter((cl, idx) => idx === 0 || (cl.peak >= clusterList[0].peak * 0.68 && cl.size >= 2));

  // 5. 计算画布标注三锚点（最密重心 / 过渡带中枢 / 最疏呼吸点）
  const focalPos = strongClusters.length
    ? { u: strongClusters[0].u, v: strongClusters[0].v }
    : { u: (peakCol + 0.5) / GRID_COLS, v: (peakRow + 0.5) / GRID_ROWS };
  const sparsePos = { u: (sparseCol + 0.5) / GRID_COLS, v: (sparseRow + 0.5) / GRID_ROWS };

  // 过渡带锚点：挑选密度最接近 (SPARSE_TH + DENSE_TH)/2 且尽量靠近 focal→sparse 连线的格子
  let bestMidScore = Infinity;
  let transPos = { u: 0.5, v: 0.5 };
  const targetMid = 2.35;
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const val = cells[r * GRID_COLS + c];
      if (val < SPARSE_TH || val > DENSE_TH) continue;
      const gu = (c + 0.5) / GRID_COLS;
      const gv = (r + 0.5) / GRID_ROWS;
      const dMid = Math.abs(val - targetMid);
      const centerBias = Math.abs(gv - 0.52) * 0.6;
      const score = dMid + centerBias;
      if (score < bestMidScore) {
        bestMidScore = score;
        transPos = { u: gu, v: gv };
      }
    }
  }

  // 6. 给每颗粒子写入归一化密度 [0, 1] 与全局分化系数（驱动五色实时渐变）
  // 分化系数在 contrastRatio <= 1.85 时为 0（均质灰绿），拉出疏密后迅速绽放原海报五色
  const differentiation = clamp((contrastRatio - 1.85) / 1.75, 0, 1);
  const normLow = 0.9;
  const normHigh = Math.max(5.2, maxP);
  for (let i = 0; i < n; i++) {
    const p = particles[i];
    p.normDensity = clamp((p.density - normLow) / Math.max(0.8, normHigh - normLow), 0, 1);
  }

  // 7. 识别格局方向名（仅在有清晰主核时）
  const dirLabel = describeRegion(focalPos.u, focalPos.v);
  let patternName = `${dirLabel}聚核`;
  if (focalPos.u < 0.34 && sparsePos.u > 0.68) patternName = "左密右疏（原海报方向）";
  else if (focalPos.u > 0.66 && sparsePos.u < 0.32) patternName = "右密左疏（反向渐疏）";
  else if (focalPos.u >= 0.34 && focalPos.u <= 0.66 && sparsePct >= 26) patternName = "核密周疏（向心聚焦）";
  else if (Math.abs(focalPos.u - sparsePos.u) > 0.42 && Math.abs(focalPos.v - sparsePos.v) > 0.22) patternName = "对角渐疏（斜向张力）";

  // 8. 严格多方向单真源研判（5 类错态 + 1 类多向合法成立）
  let status = "balanced";
  let badge = "节奏成立";
  let headline = "";
  let body = "";
  let actionHint = "";

  if (maxCell < 2.25) {
    status = "empty";
    badge = "稀碎失焦";
    headline = "全幅元素偏散偏细，撑不起视觉重心";
    body = `当前最密区域的聚合度只有 ${maxCell.toFixed(1)}（未达密核门槛），元素像撒开的细沙飘在纸面上，视线扫过去找不到第一落脚点。`;
    actionHint = "切到「磁聚」在你想突出的区域多拢几下，或把「元素占空」调回 0.9× 以上。";
  } else if (sparsePct < 18 && (areaCoverage >= 0.24 || densePct >= 62)) {
    status = "crowded";
    badge = "全盘窒息";
    headline = `呼吸空区仅剩 ${sparsePct}%，画面被均匀塞满`;
    body = `高占空（约 ${coveragePct}%）叠加上全盘铺开，四周没有给视网膜留出解除视觉拥挤的稀疏带。元素互相争抢注意力，第一眼只觉发闷。`;
    actionHint = "用「风散」把一侧彻底拨空留出至少四分之一呼吸空间，或回调「元素占空」滑块。";
  } else if (contrastRatio < 2.55) {
    status = "uniform";
    badge = "均质平铺";
    headline = `疏密落差仅 ${ratioRounded.toFixed(1)}×，全盘一样密、没有主角`;
    body = "元素在纸面上几乎等距排布，底部的密度剖面波拉成一条平线。因为没有哪里更密、也没有哪里更空，眼睛不知从何看起，看完也留不下层次记忆。";
    actionHint = "直接在纸面上拖动「磁聚」把一侧收拢成深靛蓝密核，再用「风散」拨开对侧留白。";
  } else if (strongClusters.length >= 3) {
    status = "split";
    badge = "多团互搏";
    headline = `聚出 ${strongClusters.length} 个势均力敌的密团，视线来回拉扯`;
    body = `虽然落差达到 ${ratioRounded.toFixed(1)}×，但画布里同时存在 ${strongClusters.length} 处高密重核互相抢戏。眼睛在几团之间反复横跳，反而丢掉了主次顺序。`;
    actionHint = "把其中一两团用「风散」打散成中段过渡点，让画面只留 1 处明确主核（或一主一辅）。";
  } else if (midPct < 10) {
    status = "cliff";
    badge = "断崖割裂";
    headline = `中段过渡带仅 ${midPct}%，密区与空区一刀切断`;
    body = `虽然落差高达 ${ratioRounded.toFixed(1)}×、留白也有 ${sparsePct}%，但元素全挤死在一隅，其余纸面骤然真空。画面显得僵硬撕裂，缺少「由密到疏」的渐进呼吸节奏。`;
    actionHint = "用「风散」轻轻把密核外缘向外拖出几颗过渡点，铺出深绿→朱橘→樱粉的渐散阶梯。";
  } else {
    status = "balanced";
    badge = "疏密成立";
    headline = `${patternName}：落差 ${ratioRounded.toFixed(1)}×，重心与呼吸同时到位`;
    body = `主密集区稳稳落在${dirLabel}抓住第一眼，对侧留出 ${sparsePct}% 稀疏呼吸空区解除拥挤，中间还有 ${midPct}% 由密到疏的渐变过渡把视线自然带过去。`;
    actionHint = "你也可以继续把重心拖到另一侧、中央或对角，或者换一种载体，观察同一套疏密如何撑起真实排版。";
  }

  // 9. 原海报底栏四柱（密集 / 稀疏 / 节奏 / 重心）单真源状态
  const pillars = {
    dense: {
      value: maxCell >= DENSE_TH ? `${densePct}% 强核` : `${densePct}% 偏弱`,
      tone: status === "crowded" ? "warn" : (maxCell >= DENSE_TH ? "ok" : "warn"),
      note: status === "crowded" ? "过满发闷" : (maxCell >= DENSE_TH ? "形成视觉抓手" : "还没聚出密核"),
    },
    sparse: {
      value: `${sparsePct}% 留白`,
      tone: sparsePct >= 22 ? "ok" : "warn",
      note: sparsePct >= 22 ? "眼睛有处喘气" : "呼吸空间不足",
    },
    rhythm: {
      value: status === "balanced" ? "渐变流畅（示意）" : status === "cliff" ? "断崖跳变" : status === "uniform" ? "平线无波" : "节奏受阻",
      tone: status === "balanced" ? "ok" : "warn",
      note: `过渡带占 ${midPct}%`,
    },
    focal: {
      value: strongClusters.length === 0 ? "未成形" : strongClusters.length >= 3 ? `${strongClusters.length} 核互抢` : `${dirLabel}主核`,
      tone: strongClusters.length >= 1 && strongClusters.length <= 2 && contrastRatio >= 2.55 ? "ok" : "warn",
      note: `落差 ${ratioRounded.toFixed(1)}×`,
    },
  };

  return {
    status,
    badge,
    headline,
    body,
    actionHint,
    patternName,
    contrastRatio: ratioRounded,
    densePct,
    midPct,
    sparsePct,
    coveragePct,
    peakDensity: Math.round(maxCell * 10) / 10,
    clusters: strongClusters.length,
    differentiation,
    focalPos,
    sparsePos,
    transPos,
    profile12,
    pillars,
  };
}

function describeRegion(u, v) {
  const h = u < 0.36 ? "左侧" : u > 0.64 ? "右侧" : "中央";
  const vert = v < 0.34 ? "偏上" : v > 0.66 ? "偏下" : "";
  if (h === "中央" && !vert) return "中央";
  if (h === "中央") return `中${vert.slice(1)}`;
  return vert ? `${h[0]}${vert[1]}` : h;
}

// 171 正文 01–07 全部互动模块（各自独立控件形态，off-screen 自动停绘）

import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, mulberry32 } from "./model.js";

const FONT_ZH = '"Noto Sans SC", system-ui, sans-serif';
const FONT_MONO = '"Space Mono", monospace';
const FONT_EN = '"Bricolage Grotesque", sans-serif';

// ==================== 01 高尔顿落珠与三态对照台 ====================
export function initGaltonLab() {
  const canvas = document.getElementById("galton-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const readout = document.getElementById("galton-readout");
  const btnOne = document.getElementById("galton-one");
  const btnBurst = document.getElementById("galton-burst");
  const btnClear = document.getElementById("galton-clear");
  const modeBtns = [...document.querySelectorAll("[data-gmode]")];

  const ROWS = 8;
  const BINS = ROWS + 1;
  let mode = "moderate"; // ordered | moderate | chaotic
  let counts = new Array(BINS).fill(0);
  let total = 0;
  let falling = []; // { x, y, step, bin, color, prog }
  let rng = mulberry32(17101);
  let dirty = true;

  function sampleBin() {
    if (mode === "ordered") return Math.floor(BINS / 2);
    if (mode === "chaotic") return Math.floor(rng() * BINS);
    // moderate: 二项分布（每层 50/50 偏折，汇聚为正态钟形）
    let right = 0;
    for (let r = 0; r < ROWS; r++) if (rng() < 0.5) right++;
    return right;
  }

  function seedInitial(n) {
    counts.fill(0);
    total = 0;
    falling = [];
    for (let i = 0; i < n; i++) {
      counts[sampleBin()]++;
      total++;
    }
    updateReadout();
    dirty = true;
  }

  function dropBeads(n, animate = true) {
    const cols = [PALETTE.ink, PALETTE.cobalt, PALETTE.red, PALETTE.limeSafeText];
    if (!animate || n > 30) {
      // 大批量直接加少量视觉落珠 + 立刻汇总大部分，保证低端机 60fps
      const visual = Math.min(18, n);
      for (let i = 0; i < n - visual; i++) {
        counts[sampleBin()]++;
        total++;
      }
      for (let i = 0; i < visual; i++) {
        const bin = sampleBin();
        falling.push({ bin, prog: -i * 0.04, color: cols[(total + i) % cols.length] });
      }
    } else {
      for (let i = 0; i < n; i++) {
        const bin = sampleBin();
        falling.push({ bin, prog: 0, color: cols[(total + i) % cols.length] });
      }
    }
    updateReadout();
    dirty = true;
    runner.draw();
  }

  function updateReadout() {
    const modeDesc =
      mode === "ordered"
        ? "完全有序（所有珠子锁死在同一中槽：100% 可预测，毫无形态弹性）"
        : mode === "chaotic"
          ? "完全随机（槽位完全拉平或乱跳，没有视觉重心与主次聚焦）"
          : "适度随机（单颗路径无法预判，但群体稳定聚出对称钟形趋势）";
    readout.textContent = `当前已落 ${total} 颗 · ${modeDesc}`;
  }

  function render(t, dt, { still }) {
    if (falling.length) {
      const next = [];
      for (const b of falling) {
        b.prog += still ? 2 : Math.max(0.03, dt * 2.4);
        if (b.prog >= 1) {
          counts[b.bin]++;
          total++;
        } else {
          next.push(b);
        }
      }
      falling = next;
      if (!falling.length) updateReadout();
      dirty = true;
    }

    if (!dirty) return;
    dirty = false;

    const dpr = pixelRatio(2);
    const W = 600, H = 330;
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = PALETTE.card;
    ctx.fillRect(0, 0, W, H);

    // 1. 钉板区（上半部分）
    const pegTop = 34;
    const pegStepY = 18;
    const pegStepX = 46;
    const midX = W / 2;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= r; c++) {
        const px = midX + (c - r / 2) * pegStepX;
        const py = pegTop + r * pegStepY;
        ctx.fillStyle = mode === "ordered" && Math.abs(c - r / 2) < 0.6 ? PALETTE.cobalt : "#2B2E35";
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 顶部投口标
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 11px ${FONT_MONO}`;
    ctx.textAlign = "center";
    ctx.fillText("INPUT DROP", midX, 16);

    // 2. 底部 9 槽柱状直方图
    const binTop = 194;
    const binBottom = 304;
    const maxH = binBottom - binTop;
    const maxCount = Math.max(12, ...counts);
    const binW = 44;
    const startX = midX - (BINS * binW) / 2;

    // 槽隔线
    ctx.strokeStyle = "#CFC9BA";
    ctx.lineWidth = 1;
    for (let i = 0; i <= BINS; i++) {
      const x = startX + i * binW;
      ctx.beginPath();
      ctx.moveTo(x, binTop);
      ctx.lineTo(x, binBottom);
      ctx.stroke();
    }

    // 柱子与数字
    const barColor = mode === "ordered" ? PALETTE.lime : mode === "chaotic" ? PALETTE.red : PALETTE.cobalt;
    for (let i = 0; i < BINS; i++) {
      const h = (counts[i] / maxCount) * (maxH - 8);
      const x = startX + i * binW + 5;
      const w = binW - 10;
      ctx.fillStyle = barColor;
      ctx.fillRect(x, binBottom - h, w, h);

      ctx.fillStyle = PALETTE.inkMuted;
      ctx.font = `700 10px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.fillText(String(counts[i]), x + w / 2, binBottom + 14);
    }

    // 叠加理论包络虚线（适度随机模式）
    if (mode === "moderate" && total > 0) {
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < BINS; i++) {
        const z = (i - (BINS - 1) / 2) / 1.45;
        const g = Math.exp(-0.5 * z * z);
        const y = binBottom - g * (maxH - 14);
        const x = startX + (i + 0.5) * binW;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 3. 正在下落的滚珠
    for (const b of falling) {
      if (b.prog < 0) continue;
      const targetX = startX + (b.bin + 0.5) * binW;
      const wobble = mode === "ordered" ? 0 : Math.sin(b.prog * Math.PI * 6 + b.bin) * 14 * (1 - b.prog);
      const px = midX + (targetX - midX) * b.prog + wobble;
      const py = 24 + b.prog * (binTop - 16);
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  const runner = loop(canvas, render);
  seedInitial(64);
  runner.draw();

  btnOne?.addEventListener("click", () => dropBeads(1, true));
  btnBurst?.addEventListener("click", () => dropBeads(120, true));
  btnClear?.addEventListener("click", () => {
    counts.fill(0);
    total = 0;
    falling = [];
    updateReadout();
    dirty = true;
    runner.draw();
  });
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.gmode;
      modeBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      seedInitial(64);
      runner.draw();
    });
  });
}

// ==================== 02 三种概率分布标本与散点同步台 ====================
export function initDistributionLab() {
  const canvas = document.getElementById("dist-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const cards = [...document.querySelectorAll("[data-dspec]")];
  const nRange = document.getElementById("dist-n-range");
  const nVal = document.getElementById("dist-n-val");
  const btnResample = document.getElementById("dist-resample");
  const readout = document.getElementById("dist-readout");

  let spec = "normal"; // normal | exponential | uniform
  let sampleN = 72;
  let seed = 2026;

  function draw() {
    const dpr = pixelRatio(2);
    const W = 960, H = 290;
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = PALETTE.card;
    ctx.fillRect(0, 0, W, H);

    const rng = mulberry32(seed * 997 + sampleN * 13 + spec.charCodeAt(0));
    const samples = [];
    for (let i = 0; i < sampleN; i++) {
      let x = 0.5, y = 0.5;
      if (spec === "normal") {
        const g1 = Math.sqrt(-2 * Math.log(Math.max(1e-5, rng()))) * Math.cos(2 * Math.PI * rng());
        const g2 = Math.sqrt(-2 * Math.log(Math.max(1e-5, rng()))) * Math.cos(2 * Math.PI * rng());
        x = Math.max(0.03, Math.min(0.97, 0.5 + g1 * 0.165));
        y = Math.max(0.06, Math.min(0.94, 0.5 + g2 * 0.18));
      } else if (spec === "exponential") {
        const u = Math.max(1e-4, Math.min(0.996, rng()));
        x = Math.min(0.97, -Math.log(1 - u) / 4.2 + 0.03);
        y = 0.08 + rng() * 0.84;
      } else {
        x = 0.04 + rng() * 0.92;
        y = 0.08 + rng() * 0.84;
      }
      samples.push({ x, y, r: 3.5 + rng() * 5.5, isAccent: i % 6 === 0 });
    }

    // 左半：理论 PDF 曲线 + 实采直方图
    const lx = 36, ly = 36, lw = 400, lh = 216;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx, ly + lh);
    ctx.lineTo(lx + lw, ly + lh);
    ctx.stroke();

    // 16 槽直方图
    const B = 16;
    const hist = new Array(B).fill(0);
    for (const s of samples) {
      const idx = Math.min(B - 1, Math.floor(s.x * B));
      hist[idx]++;
    }
    const maxHist = Math.max(4, ...hist);
    const colMain = spec === "normal" ? PALETTE.cobalt : spec === "exponential" ? PALETTE.red : PALETTE.limeSafeText;
    const colFill = spec === "normal" ? "rgba(22,59,238,0.18)" : spec === "exponential" ? "rgba(237,59,33,0.18)" : "rgba(181,215,23,0.42)";

    for (let i = 0; i < B; i++) {
      const bh = (hist[i] / maxHist) * (lh - 26);
      const bx = lx + (i / B) * lw + 2;
      const bw = lw / B - 4;
      ctx.fillStyle = colFill;
      ctx.fillRect(bx, ly + lh - bh, bw, bh);
    }

    // 理论 PDF 光滑曲线
    ctx.strokeStyle = colMain;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (let k = 0; k <= 80; k++) {
      const u = k / 80;
      let val = 0;
      if (spec === "normal") {
        const z = (u - 0.5) / 0.165;
        val = Math.exp(-0.5 * z * z);
      } else if (spec === "exponential") {
        val = Math.exp(-u * 4.2);
      } else {
        val = 0.56;
      }
      const px = lx + u * lw;
      const py = ly + lh - val * (lh - 34) - 4;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 12px ${FONT_ZH}`;
    ctx.textAlign = "left";
    ctx.fillText("理论概率曲线 vs 实采直方图", lx + 8, ly + 12);

    // 右半：映射到真实版面框里的散点性格
    const rx = 486, ry = 32, rw = 440, rh = 224;
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#6F6B60";
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.restore();

    let midShare = 0;
    let leftShare = 0;
    for (const s of samples) {
      if (s.x >= 0.25 && s.x <= 0.75) midShare++;
      if (s.x < 0.35) leftShare++;
      const px = rx + s.x * rw;
      const py = ry + s.y * rh;
      ctx.fillStyle = s.isAccent ? colMain : PALETTE.ink;
      ctx.globalAlpha = s.isAccent ? 0.92 : 0.78;
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 12px ${FONT_ZH}`;
    ctx.fillText("映射到版面上的空间落点形态", rx + 10, ry - 10);

    const midPct = Math.round((midShare / sampleN) * 100);
    const leftPct = Math.round((leftShare / sampleN) * 100);
    if (spec === "normal") {
      readout.textContent = `正态分布 N=${sampleN} · 中央 50% 宽度聚拢了 ${midPct}% 的元素，四角自然留出呼吸边距。`;
    } else if (spec === "exponential") {
      readout.textContent = `指数分布 N=${sampleN} · 左侧前 35% 宽度就占了 ${leftPct}% 的元素，右侧形成稀疏长尾（需注意配重）。`;
    } else {
      readout.textContent = `均匀分布 N=${sampleN} · 中段占 ${midPct}%、左段占 ${leftPct}%，全幅无中心王座，需靠字号反差立入口。`;
    }

    ctx.restore();
  }

  cards.forEach((c) => {
    c.addEventListener("click", () => {
      spec = c.dataset.dspec;
      cards.forEach((b) => {
        const active = b === c;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      draw();
    });
  });

  nRange?.addEventListener("input", () => {
    sampleN = Number(nRange.value);
    nVal.textContent = String(sampleN);
    draw();
  });

  btnResample?.addEventListener("click", () => {
    seed += 1;
    draw();
  });

  draw();
}

// ==================== 03 四种建模暗室（离散 / 连续 / 马尔可夫 / 蒙特卡洛） ====================
export function initModelDarkroom() {
  const canvas = document.getElementById("model-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const tiles = [...document.querySelectorAll("[data-mmodel]")];
  const btnStep = document.getElementById("model-step");
  const btnBurst = document.getElementById("model-burst");
  const btnReset = document.getElementById("model-reset");
  const readout = document.getElementById("model-readout");
  const mkWrap = document.getElementById("markov-matrix-wrap");
  const mkGrid = document.getElementById("markov-grid");

  let activeModel = "discrete";
  let rng = mulberry32(17103);

  // 4 套独立实验状态
  let discreteCounts = [0, 0, 0, 0, 0, 0];
  let continuousSamples = []; // angles in [-30, 30]
  // 马尔可夫 3 状态：0 大字块(钴蓝) / 1 小字条(酸柠) / 2 呼吸留白(白框)
  const MK_NAMES = ["大字块", "小字条", "留白拍"];
  const MK_COLORS = ["#8BA8FF", "#D0F028", "#FF7B66"];
  let mkMatrix = [
    [0.10, 0.55, 0.35],
    [0.45, 0.20, 0.35],
    [0.65, 0.25, 0.10],
  ];
  let mkSeq = [0];
  let mcPoints = []; // { x, y, inside }
  let mcInside = 0;

  function stepModel(n) {
    if (activeModel === "discrete") {
      for (let i = 0; i < n; i++) discreteCounts[Math.floor(rng() * 6)]++;
    } else if (activeModel === "continuous") {
      for (let i = 0; i < n; i++) {
        const g = Math.sqrt(-2 * Math.log(Math.max(1e-5, rng()))) * Math.cos(2 * Math.PI * rng());
        continuousSamples.push(Math.max(-30, Math.min(30, g * 10)));
      }
      if (continuousSamples.length > 600) continuousSamples = continuousSamples.slice(-600);
    } else if (activeModel === "markov") {
      const steps = Math.min(n, 24);
      for (let i = 0; i < steps; i++) {
        const cur = mkSeq[mkSeq.length - 1];
        const row = mkMatrix[cur];
        const u = rng();
        let next = 2;
        if (u < row[0]) next = 0;
        else if (u < row[0] + row[1]) next = 1;
        mkSeq.push(next);
      }
      if (mkSeq.length > 48) mkSeq = mkSeq.slice(-48);
    } else if (activeModel === "montecarlo") {
      for (let i = 0; i < n; i++) {
        const x = rng() * 2 - 1;
        const y = rng() * 2 - 1;
        const inside = x * x + y * y <= 1;
        if (inside) mcInside++;
        mcPoints.push({ x, y, inside });
      }
      if (mcPoints.length > 2400) {
        // 保留抽样点用于渲染，精确计数仍用 mcInside / mcTotal
        mcPoints = mcPoints.slice(-1600);
      }
    }
    draw();
  }

  let mcTotal = 0;
  const origStep = stepModel;
  function runSteps(n) {
    if (activeModel === "montecarlo") mcTotal += n;
    origStep(n);
  }

  function resetCurrent() {
    if (activeModel === "discrete") {
      discreteCounts = [0, 0, 0, 0, 0, 0];
      runSteps(36);
    } else if (activeModel === "continuous") {
      continuousSamples = [];
      runSteps(60);
    } else if (activeModel === "markov") {
      mkSeq = [0];
      runSteps(18);
    } else {
      mcPoints = [];
      mcInside = 0;
      mcTotal = 0;
      runSteps(180);
    }
  }

  function buildMarkovUI() {
    if (!mkGrid) return;
    mkGrid.innerHTML = "";
    const corner = document.createElement("div");
    corner.className = "mk-head";
    corner.textContent = "当前 ↓ / 下一 →";
    mkGrid.appendChild(corner);
    MK_NAMES.forEach((name) => {
      const h = document.createElement("div");
      h.className = "mk-head";
      h.textContent = name;
      mkGrid.appendChild(h);
    });
    mkMatrix.forEach((row, rIdx) => {
      const lbl = document.createElement("div");
      lbl.className = "mk-row-lbl";
      lbl.textContent = MK_NAMES[rIdx];
      mkGrid.appendChild(lbl);
      row.forEach((prob, cIdx) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "mk-cell" + (prob >= 0.4 ? " is-hi" : "");
        b.textContent = `${Math.round(prob * 100)}%`;
        b.addEventListener("click", () => {
          // 点按增强该转移权重并重新归一该行
          const weights = mkMatrix[rIdx].slice();
          weights[cIdx] = weights[cIdx] > 0.65 ? 0.12 : weights[cIdx] + 0.25;
          const s = weights.reduce((a, x) => a + x, 0);
          mkMatrix[rIdx] = weights.map((x) => +(x / s).toFixed(2));
          buildMarkovUI();
          mkSeq = [rIdx];
          runSteps(18);
        });
        mkGrid.appendChild(b);
      });
    });
  }

  function draw() {
    const dpr = pixelRatio(2);
    const W = 760, H = 360;
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = PALETTE.darkCard;
    ctx.fillRect(0, 0, W, H);

    if (activeModel === "discrete") {
      const sum = Math.max(1, discreteCounts.reduce((a, b) => a + b, 0));
      const maxC = Math.max(8, ...discreteCounts);
      const padX = 64, baseY = 296, topY = 58, spanW = W - padX * 2;
      const slotW = spanW / 6;

      // 理论均匀线 16.7%（标签置于顶部左角，绝不撞柱顶百分比）
      const theoY = baseY - ((sum / 6) / maxC) * (baseY - topY);
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = "#D0F028";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padX, theoY);
      ctx.lineTo(W - padX, theoY);
      ctx.stroke();
      ctx.fillStyle = "#D0F028";
      ctx.font = `700 11px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.fillText("— — 理论等概率线 16.7%", padX, 28);
      ctx.restore();

      const labels = ["1 · 细标", "2 · 正文", "3 · 副题", "4 · 引语", "5 · 主标", "6 · 巨字"];
      for (let i = 0; i < 6; i++) {
        const h = (discreteCounts[i] / maxC) * (baseY - topY);
        const x = padX + i * slotW + 14;
        const bw = slotW - 28;
        ctx.fillStyle = i % 2 === 0 ? "#8BA8FF" : "#D0F028";
        ctx.fillRect(x, baseY - h, bw, h);
        ctx.fillStyle = "#F4F1E9";
        ctx.font = `700 12px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.fillText(`${((discreteCounts[i] / sum) * 100).toFixed(1)}%`, x + bw / 2, baseY - h - 8);
        ctx.font = `700 12px ${FONT_ZH}`;
        ctx.fillStyle = "#C2C7D2";
        ctx.fillText(labels[i], x + bw / 2, baseY + 22);
      }
      readout.textContent = `离散随机变量：已掷签 ${sum} 次（6 个离散排印字级档位），实测频率随次数增加贴近 16.7% 理论线。`;
    } else if (activeModel === "continuous") {
      // 连续角度区间 [-30°, +30°] 密度刻度 + 扇面可视化
      const cx = 210, cy = 195, r = 128;
      ctx.strokeStyle = "#3A4050";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI * 0.72, -Math.PI * 0.28);
      ctx.stroke();

      for (const deg of continuousSamples.slice(-140)) {
        const rad = ((deg - 90) * Math.PI) / 180;
        ctx.strokeStyle = Math.abs(deg) <= 18 ? "rgba(208,240,40,0.35)" : "rgba(255,123,102,0.55)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(rad) * r, cy + Math.sin(rad) * r);
        ctx.stroke();
      }
      ctx.fillStyle = "#F4F1E9";
      ctx.font = `700 12px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.fillText("CONTINUOUS ANGLE [-30°, +30°]", cx, 326);

      // 右侧连续直方密度
      const rx = 400, ry = 54, rw = 320, rh = 240;
      const B = 20;
      const bins = new Array(B).fill(0);
      for (const d of continuousSamples) {
        const idx = Math.min(B - 1, Math.max(0, Math.floor(((d + 30) / 60) * B)));
        bins[idx]++;
      }
      const m = Math.max(4, ...bins);
      ctx.fillStyle = "rgba(208,240,40,0.22)";
      ctx.beginPath();
      ctx.moveTo(rx, ry + rh);
      for (let i = 0; i < B; i++) {
        const px = rx + ((i + 0.5) / B) * rw;
        const py = ry + rh - (bins[i] / m) * (rh - 24);
        ctx.lineTo(px, py);
      }
      ctx.lineTo(rx + rw, ry + rh);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#D0F028";
      ctx.lineWidth = 2.2;
      ctx.stroke();

      const safeCount = continuousSamples.filter((d) => Math.abs(d) <= 18).length;
      const pct = continuousSamples.length ? Math.round((safeCount / continuousSamples.length) * 100) : 0;
      readout.textContent = `连续随机变量：已连续采样 ${continuousSamples.length} 个实数倾角，其中 ${pct}% 落在 [-18°, +18°] 可读区间内。`;
    } else if (activeModel === "markov") {
      // 上半：3 节点状态转移有向图；下半：生成出的版面节奏序列条
      const nodes = [
        { x: 185, y: 105, name: "大字块", col: MK_COLORS[0] },
        { x: 380, y: 80, name: "小字条", col: MK_COLORS[1] },
        { x: 575, y: 105, name: "留白拍", col: MK_COLORS[2] },
      ];
      // 画边权重
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (i === j) continue;
          const p = mkMatrix[i][j];
          const a = nodes[i], b = nodes[j];
          ctx.strokeStyle = `rgba(244,241,233,${0.12 + p * 0.72})`;
          ctx.lineWidth = 1 + p * 3.2;
          ctx.beginPath();
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2 + (i < j ? -22 : 24);
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(mx, my, b.x, b.y);
          ctx.stroke();
        }
      }
      const latest = mkSeq[mkSeq.length - 1];
      nodes.forEach((nd, i) => {
        ctx.fillStyle = i === latest ? nd.col : "#232836";
        ctx.strokeStyle = nd.col;
        ctx.lineWidth = i === latest ? 3 : 2;
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = i === latest ? "#0B0C0E" : "#F4F1E9";
        ctx.font = `800 13px ${FONT_ZH}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(nd.name, nd.x, nd.y);
      });

      // 下半：按马尔可夫链生出的排印块序列
      ctx.textAlign = "left";
      ctx.fillStyle = "#C2C7D2";
      ctx.font = `700 12px ${FONT_ZH}`;
      ctx.fillText(`生成出的版面节奏序列（最近 ${mkSeq.length} 步，每一步只看前一块）：`, 42, 198);

      const startX = 42, y0 = 226;
      const cellW = Math.min(28, (W - 84) / Math.max(16, mkSeq.length));
      mkSeq.forEach((st, idx) => {
        const x = startX + idx * cellW;
        const h = st === 0 ? 78 : st === 1 ? 44 : 18;
        ctx.fillStyle = MK_COLORS[st];
        if (st === 2) {
          ctx.strokeStyle = MK_COLORS[st];
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 2, y0 + 78 - h, cellW - 5, h);
        } else {
          ctx.fillRect(x + 2, y0 + 78 - h, cellW - 5, h);
        }
      });
      readout.textContent = `马尔可夫过程：当前停在「${MK_NAMES[latest]}」，下一步跳向 大字 ${Math.round(mkMatrix[latest][0] * 100)}% / 小字 ${Math.round(mkMatrix[latest][1] * 100)}% / 留白 ${Math.round(mkMatrix[latest][2] * 100)}%。`;
    } else {
      // 蒙特卡洛：正方形内切圆随机投点估算 π
      const size = 264;
      const sx = 64, sy = 48;
      ctx.strokeStyle = "#8BA8FF";
      ctx.lineWidth = 1.8;
      ctx.strokeRect(sx, sy, size, size);
      ctx.strokeStyle = "#D0F028";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(sx + size / 2, sy + size / 2, size / 2, 0, Math.PI * 2);
      ctx.stroke();

      for (const p of mcPoints) {
        const px = sx + ((p.x + 1) / 2) * size;
        const py = sy + ((p.y + 1) / 2) * size;
        ctx.fillStyle = p.inside ? "#D0F028" : "#FF7B66";
        ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
      }

      // 右侧收敛读数面板
      const estPi = mcTotal > 0 ? (4 * mcInside) / mcTotal : 0;
      const err = Math.abs(estPi - Math.PI);
      const rx = 382;
      ctx.fillStyle = "#C2C7D2";
      ctx.font = `700 12px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.fillText("MONTE CARLO ESTIMATOR", rx, 82);
      ctx.fillStyle = "#D0F028";
      ctx.font = `700 46px ${FONT_MONO}`;
      ctx.fillText(`π ≈ ${estPi.toFixed(4)}`, rx, 144);
      ctx.fillStyle = "#F4F1E9";
      ctx.font = `700 14px ${FONT_ZH}`;
      ctx.fillText(`真实 π = 3.1416 · 当前误差 ${err.toFixed(4)}`, rx, 186);
      ctx.fillStyle = "#C2C7D2";
      ctx.font = `500 13.5px ${FONT_ZH}`;
      ctx.fillText(`总投点数：${mcTotal}（圆内 ${mcInside} 点 / 圆外 ${mcTotal - mcInside} 点）`, rx, 222);
      ctx.fillText("多点几次「批量 +120」，观察随机点如何逼近精确面积。", rx, 256);

      readout.textContent = `蒙特卡洛模拟：已投放 ${mcTotal} 枚随机点，圆内占比 ${((mcInside / Math.max(1, mcTotal)) * 100).toFixed(1)}%，估算 π ≈ ${estPi.toFixed(4)}。`;
    }

    ctx.restore();
  }

  tiles.forEach((tile) => {
    tile.addEventListener("click", () => {
      activeModel = tile.dataset.mmodel;
      tiles.forEach((t) => {
        const active = t === tile;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
      });
      if (mkWrap) mkWrap.hidden = activeModel !== "markov";
      draw();
    });
  });

  btnStep?.addEventListener("click", () => runSteps(1));
  btnBurst?.addEventListener("click", () => runSteps(120));
  btnReset?.addEventListener("click", resetCurrent);

  buildMarkovUI();
  // 初始化四套数据，切任何一枚图瓦都立刻有清晰内容
  discreteCounts = [5, 7, 6, 5, 7, 6];
  for (let i = 0; i < 60; i++) {
    const g = Math.sqrt(-2 * Math.log(Math.max(1e-5, rng()))) * Math.cos(2 * Math.PI * rng());
    continuousSamples.push(Math.max(-30, Math.min(30, g * 10)));
  }
  for (let i = 0; i < 18; i++) {
    const cur = mkSeq[mkSeq.length - 1];
    const row = mkMatrix[cur];
    const u = rng();
    mkSeq.push(u < row[0] ? 0 : u < row[0] + row[1] ? 1 : 2);
  }
  for (let i = 0; i < 240; i++) {
    const x = rng() * 2 - 1, y = rng() * 2 - 1;
    const inside = x * x + y * y <= 1;
    if (inside) mcInside++;
    mcTotal++;
    mcPoints.push({ x, y, inside });
  }
  draw();
}

// ==================== 04 历史档案抽屉 + 定制 SVG 原理图 ====================
export function initHistoryArchive() {
  const btns = [...document.querySelectorAll("[data-era]")];
  const svgBox = document.getElementById("era-svg-box");
  const meta = document.getElementById("era-meta");
  const title = document.getElementById("era-title");
  const body = document.getElementById("era-body");
  const note = document.getElementById("era-note");
  if (!btns.length || !svgBox) return;

  const ERAS = {
    galton: {
      meta: "1889 · Francis Galton · 《Natural Inheritance》",
      title: "把无数次不可测的碰撞，装进一台看得见曲线的木箱",
      body: "弗朗西斯·高尔顿在 1889 年出版的《Natural Inheritance》中用五点梅花钉板（quincunx，今称高尔顿板）直观演示：单颗滚珠撞上每排钉子时的左右偏折完全随机，但成百上千颗滚珠落下后，几乎必然汇聚出对称的正态钟形曲线。",
      note: "对排版的启发：随机系统的可控性不在每一笔落点，而在你给它们铺设的「钉板规则」。",
      svg: `<svg viewBox="0 0 240 160" width="230" height="152"><g fill="#0B0C0E">${[0,1,2,3,4].map(r => Array.from({length:r+1},(_,c)=>`<circle cx="${120+(c-r/2)*26}" cy="${22+r*18}" r="3"/>`).join("")).join("")}</g><path d="M24 146 C 72 145, 92 98, 120 98 C 148 98, 168 145, 216 146" fill="rgba(22,59,238,0.2)" stroke="#163BEE" stroke-width="2.5"/><line x1="18" y1="146" x2="222" y2="146" stroke="#0B0C0E" stroke-width="1.5"/></svg>`,
    },
    markov: {
      meta: "1913 · Andrey Markov · 圣彼得堡皇家科学院讲演",
      title: "手数普希金长诗两万字母，证明随机序列也会「记着上一步」",
      body: "1913 年 1 月，俄国数学家安德烈·马尔可夫统计了普希金诗体小说《叶甫盖尼·奥涅金》开头 20,000 个字母的元音与辅音交替：元音后再出现元音的概率仅 12.8%，辅音后出现元音则高达 66.3%——由此提出不要求事件彼此独立的马尔可夫链。",
      note: "对排版的启发：让「下一块版面元素只依赖当前块」就能防止连续撞出三块大字或连续空拍。",
      svg: `<svg viewBox="0 0 240 160" width="230" height="152"><path d="M72 64 Q120 26 168 64" fill="none" stroke="#ED3B21" stroke-width="2.6"/><path d="M168 96 Q120 134 72 96" fill="none" stroke="#163BEE" stroke-width="2.6"/><circle cx="66" cy="80" r="26" fill="#0B0C0E"/><circle cx="174" cy="80" r="26" fill="#BFDC1C" stroke="#0B0C0E" stroke-width="1.5"/><text x="66" y="84" fill="#fff" font-size="13" font-weight="700" text-anchor="middle">元音 V</text><text x="174" y="84" fill="#0B0C0E" font-size="13" font-weight="700" text-anchor="middle">辅音 C</text><text x="120" y="38" fill="#C42A14" font-size="11" font-weight="700" text-anchor="middle">87.2%</text><text x="120" y="138" fill="#1234CC" font-size="11" font-weight="700" text-anchor="middle">66.3%</text></svg>`,
    },
    arp: {
      meta: "1916–17 · Jean (Hans) Arp（MoMA 37013） & 1920 · Tristan Tzara",
      title: "把纸片撒落地面、把词条放进纸袋摇匀，再凭眼睛微调收束",
      body: "苏黎世达达时期，让·阿尔普撕下彩色方纸任其自由飘落并粘贴成《按偶然法则排列的方形拼贴》（1916–17，纽约现代艺术博物馆藏）；1920 年特里斯坦·查拉发表《如何写一首达达诗》，将剪碎的报纸词条放进袋中随机抽出。MoMA 策展研究同时指出，阿尔普在落纸后仍留有轻微挪动与胶水痕迹——艺术史称之为「辅助偶发」。",
      note: "对排版的启发：开场玩具里的「拖移字片贴胶带锁定」正是在致敬这种「先放手、再收束」的手感。",
      svg: `<svg viewBox="0 0 240 160" width="230" height="152"><rect x="26" y="18" width="188" height="124" fill="#FDFBF9" stroke="#0B0C0E" stroke-width="1.2" stroke-dasharray="4 3"/><rect x="46" y="34" width="36" height="44" fill="#163BEE" transform="rotate(-7 64 56)"/><rect x="102" y="28" width="42" height="38" fill="#0B0C0E" transform="rotate(5 123 47)"/><rect x="152" y="54" width="38" height="48" fill="#BFDC1C" transform="rotate(-4 171 78)"/><rect x="64" y="88" width="46" height="34" fill="#ED3B21" transform="rotate(8 87 105)"/><rect x="92" y="22" width="26" height="8" fill="rgba(111,129,230,0.75)" transform="rotate(-12 105 26)"/></svg>`,
    },
    mc: {
      meta: "1949 · Nicholas Metropolis & Stanislaw Ulam · 《JASA》 Vol.44",
      title: "用成千上万次随机试验，直接量出算不出来的复杂结构",
      body: "1949 年 9 月，梅特罗波利斯与乌拉姆在《美国统计学会会刊》正式发表论文《The Monte Carlo Method》，总结了在洛斯阿拉莫斯实验室借大规模随机抽样逼近高维积分与中子扩散的方法——以摩纳哥蒙特卡洛赌场命名。",
      note: "对排版的启发：当手工枚举所有组合成本太高时，用带约束的随机采样批量试样、挑出最优解反而更快。",
      svg: `<svg viewBox="0 0 240 160" width="230" height="152"><rect x="60" y="20" width="120" height="120" fill="#FDFBF9" stroke="#163BEE" stroke-width="2"/><circle cx="120" cy="80" r="60" fill="rgba(181,215,23,0.22)" stroke="#4A5E00" stroke-width="2"/><g>${Array.from({length:28},(_,i)=>{const a=i*2.39996;const r=(i%5+1)*11;const x=120+Math.cos(a)*r;const y=80+Math.sin(a)*r;const inside=Math.hypot(x-120,y-80)<=60;return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.8" fill="${inside?'#163BEE':'#ED3B21'}"/>`;}).join("")}</g></svg>`,
    },
    molnar: {
      meta: "1969–74 · Vera Molnár · 《(Des)Ordres》（V&A 博物馆 E.271-2011）",
      title: "在严密嵌套的方框里，只注入一点点随机扰动",
      body: "匈牙利裔法国计算机艺术先驱维拉·莫尔纳在 1969 年《Interruptions》与 1974 年《(Des)Ordres》中，用早期计算机绘图仪把规整的同心方阵加入轻微随机偏移。作品法文名双关「无序（désordres）」与「某些秩序（des ordres）」，她常强调那关键的「1% 无序」足以让僵硬的几何结构瞬间活起来。",
      note: "对排版的启发：开场里的「莫尔纳微扰解（27% 扰动）」正是这种克制而迷人的秩序边界。",
      svg: `<svg viewBox="0 0 240 160" width="230" height="152"><g fill="none" stroke="#0B0C0E" stroke-width="1.3">${[0,1,2].map(col=>[0,1].map(row=>{const cx=54+col*66,cy=46+row*68;return [14,22,30].map((s,k)=>`<rect x="${cx-s+(k===1?2:-1)}" y="${cy-s+(k===2?-2:1)}" width="${s*2}" height="${s*2}" transform="rotate(${(col+row+k)%2?k*2.5:-k*2.2} ${cx} ${cy})" stroke="${k===2?'#163BEE':'#0B0C0E'}"/>`).join("");}).join("")).join("")}</g></svg>`,
    },
    elam: {
      meta: "1992 · David Carson《Ray Gun》 & 2007 · Kimberly Elam《Typographic Systems》",
      title: "从反叛网格到系统归类：随机也是八大字体组织系统之一",
      body: "1992 年大卫·卡森主持《Ray Gun》杂志，用大胆重叠、截切与失衡排印冲击瑞士网格传统；2007 年金伯莉·伊拉姆在普林斯顿建筑出版社出版《Typographic Systems》，将「随机系统」正式与轴线、放射、扩张、网格、模块、过渡、双边并列为八大字体组织框架，强调视觉反差与层次依然是随机排版的生命线。",
      note: "对排版的启发：随机不是反设计，而是与网格并列的八种版面语法之一，看题材选工具。",
      svg: `<svg viewBox="0 0 240 160" width="230" height="152"><rect x="20" y="18" width="200" height="124" fill="#FDFBF9" stroke="#0B0C0E" stroke-width="1.4"/><text x="48" y="68" font-size="34" font-weight="900" fill="#0B0C0E" transform="rotate(-11 48 68)">TYPE</text><rect x="128" y="42" width="76" height="26" fill="#BFDC1C" transform="rotate(8 166 55)"/><text x="166" y="59" font-size="11" font-weight="800" fill="#0B0C0E" text-anchor="middle" transform="rotate(8 166 55)">SYSTEM 04</text><line x1="34" y1="108" x2="188" y2="96" stroke="#163BEE" stroke-width="3"/><text x="44" y="128" font-size="11" font-weight="700" fill="#C42A14" transform="rotate(4 90 128)">CONTRAST = ENTRY</text></svg>`,
    },
  };

  function selectEra(key) {
    const item = ERAS[key];
    if (!item) return;
    meta.textContent = item.meta;
    title.textContent = item.title;
    body.textContent = item.body;
    note.textContent = item.note;
    svgBox.innerHTML = item.svg;
    btns.forEach((b) => {
      const active = b.dataset.era === key;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", String(active));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => selectEra(b.dataset.era)));
  selectEra("galton");
}

// ==================== 05 真实载体压力测试（拨动开关看适合 vs 灾难） ====================
export function initStressLab() {
  const toggle = document.getElementById("stress-toggle");
  const tabs = [...document.querySelectorAll("[data-carrier]")];
  const mockup = document.getElementById("stress-mockup");
  const vBox = document.getElementById("stress-verdict");
  const vTitle = document.getElementById("stress-v-title");
  const vBody = document.getElementById("stress-v-body");
  if (!toggle || !mockup) return;

  let carrier = "concert";

  const CARRIERS = {
    concert: {
      good: true,
      onTitle: "适合使用：情绪与探索欲大于秒级查表速度",
      onBody: "街头海报靠一秒内抓住眼球取胜。适度错落的大字与倾斜便签能立刻传达现场即兴感，只要主标题最大、时间地点不撞字，读者乐意顺着节奏读完。",
      offTitle: "关闭随机后：信息整齐，但像一份普通通知单",
      offBody: "全部对齐排成四行居中文字当然可读，但在满墙海报里很容易失去先锋与即兴气质——这类文化实验场景正适合用受控随机拉开辨识度。",
      render(isRand) {
        return isRand
          ? `<div style="position:relative;min-height:196px;font-family:var(--f-zh)">
              <span style="position:absolute;left:188px;top:24px;width:9px;height:9px;border-radius:50%;background:#163BEE"></span>
              <span style="position:absolute;left:220px;top:64px;width:7px;height:7px;border-radius:50%;background:#ED3B21"></span>
              <span style="position:absolute;left:162px;top:92px;width:11px;height:11px;border-radius:50%;background:#BFDC1C"></span>
              <div style="font-size:38px;font-weight:900;line-height:1;transform:rotate(-7deg);display:inline-block;margin:6px 0 0 8px">声浪现场</div>
              <div style="position:absolute;right:8px;top:14px;background:#BFDC1C;padding:6px 10px;font-size:12px;font-weight:800;transform:rotate(6deg);border:1px solid #0B0C0E">10.18–20 · 3F</div>
              <div style="position:absolute;left:22px;bottom:34px;border:1.5px solid #163BEE;color:#1234CC;padding:4px 10px;font-size:12.5px;font-weight:700;transform:rotate(4deg);background:#fff">12 组实验即兴合成</div>
              <div style="position:absolute;right:18px;bottom:14px;background:#0B0C0E;color:#D0F028;padding:4px 10px;font-family:var(--f-mono);font-size:11.5px;transform:rotate(-5deg)">FREE ENTRY · VOL.4</div>
            </div>`
          : `<div style="text-align:center;padding:24px 10px;display:grid;gap:10px">
              <div style="font-size:28px;font-weight:900">声浪现场</div>
              <div style="font-size:13.5px;color:#3A3E46">10.18–20 · 黑胶工坊 3F</div>
              <div style="font-size:13.5px;color:#3A3E46">12 组实验即兴合成 · 免费预约入场</div>
            </div>`;
      },
    },
    ticket: {
      good: true,
      onTitle: "适合使用：同规则换种子，让每张限量票根独一无二",
      onBody: "把票号、入场时间锁在固定安全读数带，仅让装饰图形、印章倾角与色彩散点按统计规则随机生成——既 100% 保证核验效率，又赋予每张票收藏价值。",
      offTitle: "关闭随机后：全部一模一样，少了限量手作感",
      offBody: "常规统一印刷没有错，但失去了「每张都有专属随机分布图案」的互动记忆点。",
      render(isRand) {
        return isRand
          ? `<div style="display:grid;grid-template-columns:1fr 94px;gap:12px;align-items:stretch;min-height:190px">
              <div style="position:relative;border-right:1.5px dashed #8F8A7D;padding-right:10px">
                <div style="font-family:var(--f-mono);font-size:11px;color:#1234CC;font-weight:700">EDITION #084 / 300</div>
                <div style="font-size:24px;font-weight:900;margin:8px 0 4px;transform:rotate(-3deg)">偶发艺术展</div>
                <div style="display:inline-block;background:#BFDC1C;padding:3px 8px;font-size:12px;font-weight:700;transform:rotate(3deg)">B 馆 · 14:00 入场</div>
                <div style="margin-top:24px;display:flex;gap:8px;align-items:center">
                  <span style="width:14px;height:14px;border-radius:50%;background:#163BEE;display:inline-block"></span>
                  <span style="width:10px;height:10px;background:#ED3B21;display:inline-block;transform:rotate(25deg)"></span>
                  <span style="width:16px;height:16px;border-radius:50%;background:#BFDC1C;display:inline-block"></span>
                  <span style="font-family:var(--f-mono);font-size:11px;color:#3A3E46">SEED 84B</span>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:var(--f-mono);font-size:12px;font-weight:700;background:#F4F1E9;padding:8px">
                <span>GATE</span><span style="font-size:26px;color:#1234CC">03</span><span>检票联</span>
              </div>
            </div>`
          : `<div style="display:grid;grid-template-columns:1fr 94px;gap:12px;min-height:190px;align-items:center">
              <div style="border-right:1.5px dashed #8F8A7D;padding-right:10px">
                <div style="font-family:var(--f-mono);font-size:11px;color:#3A3E46">EDITION #084 / 300</div>
                <div style="font-size:22px;font-weight:900;margin:8px 0">偶发艺术展</div>
                <div style="font-size:13px;color:#3A3E46">B 馆 · 14:00 入场</div>
              </div>
              <div style="text-align:center;font-family:var(--f-mono);font-size:12px;font-weight:700">GATE 03</div>
            </div>`;
      },
    },
    medicine: {
      good: false,
      onTitle: "坚决别用！随机错位直接威胁用药安全",
      onBody: "患者和老人必须在 2 秒内准确核对「单次剂量」与「禁用提示」。一旦把剂量、频次和禁忌打散倾斜，读者极易把「每日 1 次」错读成「每次 3 片」——此处必须回归严格的网格或轴线列表。",
      offTitle: "关闭随机（正确做法）：纵横对齐，2 秒零误读",
      offBody: "用法用量、禁忌与规格严格按表格网格左齐分栏，用清晰红框锁住警示——这才是医疗信息应有的版面语法。",
      render(isRand) {
        return isRand
          ? `<div style="position:relative;min-height:196px;border:2px dashed #ED3B21;padding:10px">
              <div style="font-size:13px;font-weight:900;color:#C42A14;transform:rotate(-16deg);position:absolute;left:12px;top:16px">⚠ 孕妇禁用</div>
              <div style="font-size:24px;font-weight:900;transform:rotate(11deg);position:absolute;right:14px;top:24px">布洛芬缓释胶囊</div>
              <div style="background:#BFDC1C;padding:4px 8px;font-size:13px;font-weight:800;transform:rotate(-9deg);position:absolute;left:36px;top:92px">一次 1 粒 · 12 小时一次</div>
              <div style="font-size:12.5px;font-weight:700;color:#1234CC;transform:rotate(18deg);position:absolute;right:20px;bottom:24px">24h 不超过 2 粒</div>
              <div style="position:absolute;left:10px;bottom:8px;font-size:11.5px;color:#C42A14;font-weight:800">× 视线迷路：剂量与禁忌难以对应</div>
            </div>`
          : `<div style="display:grid;gap:8px;font-size:13px">
              <div style="font-size:17px;font-weight:900;border-bottom:2px solid #0B0C0E;padding-bottom:4px">布洛芬缓释胶囊 · 用法用量</div>
              <div style="display:grid;grid-template-columns:84px 1fr;gap:6px"><b>成人剂量</b><span>口服，一次 1 粒，每 12 小时 1 次</span></div>
              <div style="display:grid;grid-template-columns:84px 1fr;gap:6px"><b>每日上限</b><span>24 小时内不超过 2 粒</span></div>
              <div style="background:#FCECE8;color:#C42A14;padding:6px 10px;font-weight:700;border-left:3px solid #ED3B21">禁忌：孕妇及哺乳期妇女禁用</div>
            </div>`;
      },
    },
    boarding: {
      good: false,
      onTitle: "坚决别用！赶飞机时没人想解谜找登机口",
      onBody: "登机牌属于高压力瞬时检索场景，登机口、座位号与截载时间必须有固定视觉锚点。套用随机系统会直接拉高误机风险，应交给模块系统（173）或网格系统（172）。",
      offTitle: "关闭随机（正确做法）：关键字段分格锁定，一眼抓准",
      offBody: "航班号、登机口 B14、登机时间 14:20 各占独立固定模块，高对比黑字一扫即得。",
      render(isRand) {
        return isRand
          ? `<div style="position:relative;min-height:196px;border:2px dashed #ED3B21;padding:10px">
              <div style="font-family:var(--f-mono);font-size:22px;font-weight:700;transform:rotate(14deg);position:absolute;left:18px;top:18px">CA1502</div>
              <div style="font-family:var(--f-mono);font-size:18px;font-weight:700;color:#1234CC;transform:rotate(-19deg);position:absolute;right:24px;top:38px">GATE B14</div>
              <div style="font-family:var(--f-mono);font-size:15px;font-weight:700;background:#BFDC1C;padding:3px 7px;transform:rotate(9deg);position:absolute;left:42px;top:102px">SEAT 18A</div>
              <div style="font-family:var(--f-mono);font-size:13px;font-weight:700;color:#C42A14;transform:rotate(-11deg);position:absolute;right:18px;bottom:34px">BOARD 14:20</div>
              <div style="position:absolute;left:10px;bottom:8px;font-size:11.5px;color:#C42A14;font-weight:800">× 检票扫描与乘客核对耗时翻倍</div>
            </div>`
          : `<div style="display:grid;gap:10px">
              <div style="display:flex;justify-content:space-between;font-family:var(--f-mono);font-weight:700;border-bottom:2px solid #0B0C0E;padding-bottom:6px"><span>SHA → PEK</span><span>CA1502</span></div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-family:var(--f-mono)">
                <div style="background:#F4F1E9;padding:8px"><div style="font-size:11px;color:#3A3E46">GATE</div><div style="font-size:20px;font-weight:700;color:#1234CC">B14</div></div>
                <div style="background:#F4F1E9;padding:8px"><div style="font-size:11px;color:#3A3E46">BOARD</div><div style="font-size:20px;font-weight:700">14:20</div></div>
                <div style="background:#F4F1E9;padding:8px"><div style="font-size:11px;color:#3A3E46">SEAT</div><div style="font-size:20px;font-weight:700">18A</div></div>
              </div>
            </div>`;
      },
    },
  };

  function renderStress() {
    const item = CARRIERS[carrier];
    const isRand = toggle.checked;
    mockup.innerHTML = item.render(isRand);
    vTitle.textContent = isRand ? item.onTitle : item.offTitle;
    vBody.textContent = isRand ? item.onBody : item.offBody;
    vBox.classList.toggle("is-danger", isRand && !item.good);
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      carrier = t.dataset.carrier;
      tabs.forEach((b) => {
        const active = b === t;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      renderStress();
    });
  });

  toggle.addEventListener("change", renderStress);
  renderStress();
}

// ==================== 06 深炭考场：四张同文同色微型海报单变量辨识 ====================
export function initQuiz() {
  const opts = [...document.querySelectorAll(".quiz-opt")];
  const fb = document.getElementById("quiz-feedback");
  const fbVerdict = document.getElementById("qf-verdict");
  const fbSummary = document.getElementById("qf-summary");
  const fbBreak = document.getElementById("qf-breakdown");
  const btnReset = document.getElementById("quiz-reset");
  if (!opts.length) return;

  // 四版严格同一套元素、同一字号反差、同一色板，只改空间分布与扰动规则
  const CONFIGS = {
    A: {
      // 完全有序：0° 死对齐居中列表，零动势
      items: [
        { kind: "big", text: "声", x: 0.36, y: 0.24, a: 0, col: PALETTE.ink },
        { kind: "big", text: "景", x: 0.64, y: 0.24, a: 0, col: PALETTE.cobalt },
        { kind: "card", text: "秋日声音实验展", x: 0.50, y: 0.46, a: 0, bg: PALETTE.card, tape: "cobalt" },
        { kind: "sticky", text: "10.18 — 10.20", x: 0.50, y: 0.64, a: 0 },
        { kind: "chip", text: "SOUND LAB · 3F", x: 0.50, y: 0.80, a: 0 },
      ],
      dots: [[0.2,0.12],[0.35,0.12],[0.5,0.12],[0.65,0.12],[0.8,0.12]],
      reason: "方案 A：零撞字、层级也对，但 0° 居中对齐彻底退化成传统对称列表，失去了随机系统的偶发变化与动态节奏。",
    },
    B: {
      // 正解：适度扰动 + 正态聚焦均衡 + 无叠压 + 安全边距
      items: [
        { kind: "big", text: "声", x: 0.31, y: 0.27, a: -11, col: PALETTE.ink },
        { kind: "big", text: "景", x: 0.67, y: 0.36, a: 8, col: PALETTE.cobalt },
        { kind: "card", text: "秋日声音实验展", x: 0.42, y: 0.56, a: -6, bg: PALETTE.card, tape: "cobalt" },
        { kind: "sticky", text: "10.18 — 10.20", x: 0.66, y: 0.72, a: 7 },
        { kind: "chip", text: "SOUND LAB · 3F", x: 0.34, y: 0.82, a: -4 },
      ],
      dots: [[0.18,0.16],[0.82,0.20],[0.52,0.18],[0.19,0.68],[0.84,0.54],[0.58,0.88]],
      reason: "方案 B（正解）：倾角收在 ±11° 以内、零撞字叠压、主大字形成明确第一入口，且整张版面的视觉重心稳居中腹、四周留白呼吸充分。",
    },
    C: {
      // 隐蔽错项：倾角克制且严格零撞字，但重心严重坠向右下角，左上大片空洞！
      items: [
        { kind: "big", text: "声", x: 0.56, y: 0.44, a: -7, col: PALETTE.ink },
        { kind: "big", text: "景", x: 0.80, y: 0.48, a: 6, col: PALETTE.cobalt },
        { kind: "card", text: "秋日声音实验展", x: 0.65, y: 0.64, a: -4, bg: PALETTE.card, tape: "cobalt" },
        { kind: "sticky", text: "10.18 — 10.20", x: 0.69, y: 0.77, a: 5 },
        { kind: "chip", text: "SOUND LAB · 3F", x: 0.61, y: 0.88, a: -3 },
      ],
      dots: [[0.78,0.34],[0.88,0.44],[0.54,0.36],[0.86,0.72],[0.82,0.88]],
      reason: "方案 C：虽然没有叠字、倾角也温和，但几乎全部视觉重量都坠积在右下方，左上方留下大块空洞——没有守住「关注整体分布」的重心平衡。",
    },
    D: {
      // 混乱失控：倾角过大 + 文字相互叠压遮挡 + 擦边
      items: [
        { kind: "big", text: "声", x: 0.44, y: 0.39, a: -42, col: PALETTE.ink },
        { kind: "big", text: "景", x: 0.54, y: 0.46, a: 38, col: PALETTE.cobalt },
        { kind: "card", text: "秋日声音实验展", x: 0.48, y: 0.44, a: 28, bg: PALETTE.card, tape: "red" },
        { kind: "sticky", text: "10.18 — 10.20", x: 0.56, y: 0.55, a: -35 },
        { kind: "chip", text: "SOUND LAB · 3F", x: 0.84, y: 0.12, a: 44 },
      ],
      dots: [[0.34,0.34],[0.48,0.52],[0.62,0.42],[0.40,0.60],[0.58,0.34]],
      reason: "方案 D：把「狂转和撞字」当成了随机。主字与展名、日期互相压盖，倾角超过 ±35°，信息可读性被直接摧毁。",
    },
  };

  function drawMiniPoster(canvas, cfg) {
    const dpr = pixelRatio(2);
    const W = 280, H = 340;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#BDB6A7";
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(12, 12, W - 24, H - 24);
    ctx.setLineDash([]);

    const dotCols = [PALETTE.ink, PALETTE.cobalt, PALETTE.red, PALETTE.lime];
    cfg.dots.forEach(([nx, ny], i) => {
      ctx.fillStyle = dotCols[i % dotCols.length];
      ctx.beginPath();
      ctx.arc(nx * W, ny * H, 3.6, 0, Math.PI * 2);
      ctx.fill();
    });

    for (const it of cfg.items) {
      ctx.save();
      ctx.translate(it.x * W, it.y * H);
      ctx.rotate((it.a * Math.PI) / 180);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (it.kind === "big") {
        ctx.font = `900 54px ${FONT_ZH}`;
        ctx.fillStyle = it.col;
        ctx.fillText(it.text, 0, 0);
      } else if (it.kind === "card") {
        ctx.fillStyle = it.bg;
        ctx.fillRect(-66, -18, 132, 36);
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-66, -18, 132, 36);
        ctx.fillStyle = it.tape === "red" ? PALETTE.redTape : PALETTE.cobaltTape;
        ctx.fillRect(-18, -23, 36, 9);
        ctx.fillStyle = PALETTE.ink;
        ctx.font = `700 13px ${FONT_ZH}`;
        ctx.fillText(it.text, 0, 1);
      } else if (it.kind === "sticky") {
        ctx.fillStyle = PALETTE.limeSticky;
        ctx.fillRect(-54, -15, 108, 30);
        ctx.fillStyle = PALETTE.ink;
        ctx.beginPath();
        ctx.moveTo(44, 15); ctx.lineTo(44, 5); ctx.lineTo(54, 5); ctx.closePath();
        ctx.fill();
        ctx.font = `700 12px ${FONT_MONO}`;
        ctx.fillText(it.text, -2, 1);
      } else {
        ctx.fillStyle = PALETTE.ink;
        ctx.fillRect(-56, -12, 112, 24);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 10.5px ${FONT_MONO}`;
        ctx.fillText(it.text, 0, 0.5);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  document.querySelectorAll(".quiz-canvas").forEach((c) => {
    const key = c.dataset.qopt;
    if (CONFIGS[key]) drawMiniPoster(c, CONFIGS[key]);
  });

  function answer(pick) {
    const right = pick === "B";
    opts.forEach((btn) => {
      const k = btn.dataset.opt;
      btn.setAttribute("aria-checked", String(k === pick));
      btn.classList.remove("is-picked", "is-correct", "is-wrong");
      const st = btn.querySelector(".opt-state");
      if (k === "B") {
        btn.classList.add("is-correct");
        st.textContent = "✓ 正解";
      } else if (k === pick) {
        btn.classList.add("is-wrong");
        st.textContent = "× 待修正";
      } else {
        st.textContent = "";
      }
    });

    fb.hidden = false;
    fbVerdict.textContent = right ? "判断准确！方案 B 守住了「可控随机」的三道底线" : `你选了方案 ${pick}，真正成立的是方案 B`;
    fbSummary.textContent = right
      ? "你没有被方案 A 的「整齐」或方案 C 的「无叠字」迷惑——可控的随机系统既要有扰动动势，又要兼顾全局重心平衡与清晰可读。"
      : CONFIGS[pick].reason;
    fbBreak.innerHTML = ["A", "B", "C", "D"].map((k) => `<li>${CONFIGS[k].reason}</li>`).join("");
  }

  opts.forEach((btn) => btn.addEventListener("click", () => answer(btn.dataset.opt)));
  btnReset?.addEventListener("click", () => {
    fb.hidden = true;
    opts.forEach((btn) => {
      btn.setAttribute("aria-checked", "false");
      btn.classList.remove("is-picked", "is-correct", "is-wrong");
      btn.querySelector(".opt-state").textContent = "";
    });
  });
}

// ==================== 07 原海报灯箱（点击放大、拖移、滚轮缩放、Esc 关） ====================
export function initPosterLightbox() {
  const openBtn = document.getElementById("poster-open-btn");
  const posterImg = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const lbZoomRead = document.getElementById("lb-zoom-read");
  const btnIn = document.getElementById("lb-in");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");
  if (!openBtn || !lb || !lbImg || !posterImg) return;

  let scale = 1, tx = 0, ty = 0;
  let drag = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    lbZoomRead.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    // 复用页面内联的 poster.webp，不额外存第二份图
    if (!lbImg.src) lbImg.src = posterImg.currentSrc || posterImg.src;
    scale = 1; tx = 0; ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => { scale = Math.min(3.2, +(scale + 0.35).toFixed(2)); applyTransform(); });
  btnOut.addEventListener("click", () => { scale = Math.max(0.6, +(scale - 0.35).toFixed(2)); applyTransform(); });
  btnReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.6, Math.min(3.2, +(scale + (e.deltaY < 0 ? 0.16 : -0.16)).toFixed(2)));
    applyTransform();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage) { close(); return; }
    drag = { sx: e.clientX, sy: e.clientY, tx0: tx, ty0: ty };
    lbStage.setPointerCapture(e.pointerId);
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = drag.tx0 + (e.clientX - drag.sx);
    ty = drag.ty0 + (e.clientY - drag.sy);
    applyTransform();
  });
  lbStage.addEventListener("pointerup", () => { drag = null; });
  lbStage.addEventListener("pointercancel", () => { drag = null; });

  window.addEventListener("keydown", (e) => {
    if (!lb.hidden && e.key === "Escape") close();
  });
}

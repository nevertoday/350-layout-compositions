// 095 正文 01–07 各节独立互动实验（相邻两节绝不复用同一类控件）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE } from "./model.js";

// =========================================================================
// 01 三级阶梯怎么分：SVG 阶梯剥离解剖台
// =========================================================================
export function initSecTiers() {
  const svg = document.getElementById("tier-peel-svg");
  const modeBtns = [...document.querySelectorAll("[data-peel]")];
  const readout = document.getElementById("peel-readout");
  const focusTitle = document.getElementById("peel-focus-title");
  if (!svg) return;

  const MODES = {
    all: {
      title: "完整三阶 · 强中弱各就各位",
      text: "主要层级先截住视线，次要层级顺势补充语境，第三层级把细则静静托在底端。三档重量递减（示意比例约 100 : 52 : 24），扫一眼就能决定要不要继续往下读。",
      op: [1, 1, 1],
      flat: false,
    },
    t1: {
      title: "只剩主要层级 · 够醒目却缺下文",
      text: "只保留最大最重的标题确实一眼就能看到，但时间、地点与辅助信息全被抽空——观者被吸引进来后，却没有下一步能落脚的支撑信息。",
      op: [1, 0.14, 0.14],
      flat: false,
    },
    not1: {
      title: "抽走主要层级 · 失去视觉入口",
      text: "没有最强的一级锚点领头，次要说明与细则平铺在纸面上，读者一时摸不清这张版面的主旨，只能被迫从第一行逐字找重点。",
      op: [0.14, 1, 1],
      flat: false,
    },
    flat: {
      title: "三级压成同一档 · 灰墙平权",
      text: "把主、次、细全都设成相近字号与明暗后，逻辑上的重要次序在视觉上彻底消失。文字内容一字没少，理解成本却立刻成倍上升。",
      op: [1, 1, 1],
      flat: true,
    },
  };

  let curMode = "all";

  function draw() {
    const m = MODES[curMode];
    const [o1, o2, o3] = m.op;
    const f = m.flat;

    svg.innerHTML = `
      <rect x="0" y="0" width="640" height="330" fill="${PALETTE.ivory}"/>
      <!-- 1. 主要层级 -->
      <g opacity="${o1}">
        <polygon points="18,32 52,18 52,102 18,116" fill="${f ? PALETTE.oliveFold : PALETTE.charcoalFold}"/>
        <polygon points="52,18 202,18 184,102 52,102" fill="${f ? PALETTE.olive : PALETTE.charcoal}"/>
        <rect x="184" y="18" width="438" height="84" fill="${f ? PALETTE.stone : "#F8EBD4"}" stroke="#CFC3AD" stroke-width="1"/>
        <text x="68" y="56" fill="#FCF5E8" font-family="Noto Sans SC, sans-serif" font-weight="${f ? 500 : 800}" font-size="${f ? 15 : 19}">主要层级</text>
        <text x="68" y="79" fill="${f ? "#E5DEC9" : PALETTE.gold}" font-family="Archivo, sans-serif" font-weight="700" font-size="11" letter-spacing="1.4">PRIMARY</text>
        <text x="214" y="48" fill="${PALETTE.ink}" font-family="Noto Sans SC, sans-serif" font-weight="${f ? 500 : 900}" font-size="${f ? 15 : 22}">核心主题 · 第一眼入口</text>
        <text x="214" y="75" fill="${PALETTE.inkSoft}" font-family="Noto Sans SC, sans-serif" font-size="12.5">${f ? "字号被压低，与下方说明几乎拉不开差距" : "最大字号 + 最强明暗对比，3 秒内先锁定注意力"}</text>
        <g transform="translate(514, 30)">
          <rect x="0" y="0" width="90" height="60" fill="${PALETTE.ivory}" stroke="#C7BBA6"/>
          <rect x="7" y="7" width="76" height="${f ? 9 : 18}" fill="${f ? PALETTE.olive : PALETTE.charcoal}"/>
          <rect x="7" y="30" width="34" height="${f ? 12 : 22}" fill="${f ? "#C4BCB0" : PALETTE.gold}"/>
          <line x1="47" y1="34" x2="82" y2="34" stroke="#9B968D" stroke-width="2"/>
          <line x1="47" y1="42" x2="78" y2="42" stroke="#9B968D" stroke-width="2"/>
          <line x1="47" y1="50" x2="72" y2="50" stroke="#9B968D" stroke-width="2"/>
        </g>
      </g>
      <!-- 2. 次要层级 -->
      <g opacity="${o2}">
        <polygon points="18,130 52,116 52,200 18,214" fill="${f ? PALETTE.oliveFold : PALETTE.terraFold}"/>
        <polygon points="52,116 202,116 184,200 52,200" fill="${f ? PALETTE.olive : PALETTE.terra}"/>
        <rect x="184" y="116" width="438" height="84" fill="${f ? PALETTE.stone : PALETTE.apricot}" stroke="#CFC3AD" stroke-width="1"/>
        <text x="68" y="154" fill="#FCF5E8" font-family="Noto Sans SC, sans-serif" font-weight="${f ? 500 : 700}" font-size="${f ? 15 : 17}">次要层级</text>
        <text x="68" y="177" fill="#FCF5E8" font-family="Archivo, sans-serif" font-weight="700" font-size="11" letter-spacing="1.4">SECONDARY</text>
        <text x="214" y="146" fill="${PALETTE.ink}" font-family="Noto Sans SC, sans-serif" font-weight="${f ? 500 : 700}" font-size="${f ? 15 : 17}">支撑核心 · 导语与分组</text>
        <text x="214" y="173" fill="${PALETTE.inkSoft}" font-family="Noto Sans SC, sans-serif" font-size="12.5">中等字号与适度对比，紧邻主层把语境补充清楚</text>
        <g transform="translate(514, 128)">
          <rect x="0" y="0" width="90" height="60" fill="${PALETTE.ivory}" stroke="#C7BBA6"/>
          <rect x="7" y="8" width="24" height="20" fill="${f ? "#C4BCB0" : PALETTE.terra}"/>
          <line x1="37" y1="12" x2="82" y2="12" stroke="${PALETTE.charcoal}" stroke-width="3"/>
          <line x1="37" y1="19" x2="76" y2="19" stroke="#686C64" stroke-width="2"/>
          <line x1="37" y1="26" x2="70" y2="26" stroke="#9B968D" stroke-width="2"/>
          <rect x="7" y="36" width="23" height="15" fill="#D5C8B5"/>
          <rect x="34" y="36" width="23" height="15" fill="#D5C8B5"/>
          <rect x="61" y="36" width="22" height="15" fill="#D5C8B5"/>
        </g>
      </g>
      <!-- 3. 次要次要层级 -->
      <g opacity="${o3}">
        <polygon points="18,228 52,214 52,298 18,312" fill="${PALETTE.oliveFold}"/>
        <polygon points="52,214 202,214 184,298 52,298" fill="${PALETTE.olive}"/>
        <rect x="184" y="214" width="438" height="84" fill="${PALETTE.stone}" stroke="#CFC3AD" stroke-width="1"/>
        <text x="64" y="252" fill="#FCF5E8" font-family="Noto Sans SC, sans-serif" font-weight="500" font-size="15">次要次要层级</text>
        <text x="68" y="275" fill="#E5DEC9" font-family="Archivo, sans-serif" font-weight="700" font-size="11" letter-spacing="1.4">TERTIARY</text>
        <text x="214" y="244" fill="${PALETTE.ink}" font-family="Noto Sans SC, sans-serif" font-weight="500" font-size="15">补充细节 · 正文与注脚</text>
        <text x="214" y="271" fill="${PALETTE.inkSoft}" font-family="Noto Sans SC, sans-serif" font-size="12.5">较小字号与较低对比，退居次位绝不抢戏</text>
        <g transform="translate(514, 226)">
          <rect x="0" y="0" width="90" height="60" fill="${PALETTE.ivory}" stroke="#C7BBA6"/>
          ${[14, 25, 36, 47]
            .map(
              (yy) => `<circle cx="13" cy="${yy}" r="2.4" fill="${PALETTE.olive}"/><line x1="21" y1="${yy}" x2="80" y2="${yy}" stroke="#9B968D" stroke-width="1.8"/>`
            )
            .join("")}
        </g>
      </g>
    `;

    modeBtns.forEach((b) => {
      const on = b.dataset.peel === curMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (focusTitle) focusTitle.textContent = m.title;
    if (readout) readout.textContent = m.text;
  }

  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      curMode = b.dataset.peel;
      draw();
    })
  );
  draw();
}

// =========================================================================
// 02 一眼抓人的六个杠杆：前注意「跳出」计时小测（Treisman & Gelade 1980）
// =========================================================================
export function initSecLevers() {
  const grid = document.getElementById("popout-grid");
  const leverBtns = [...document.querySelectorAll("[data-lever]")];
  const shuffleBtn = document.getElementById("popout-shuffle");
  const taskPrompt = document.getElementById("popout-prompt");
  const timeOut = document.getElementById("popout-time");
  const compareOut = document.getElementById("popout-compare");
  const noteOut = document.getElementById("popout-note");
  if (!grid) return;

  const LEVERS = {
    size: {
      name: "字号尺度",
      prompt: "点出唯一一枚【最大号的石块】",
      note: "尺度差异在视网膜早期通道并行检出，无需逐个扫描，通常半秒内就能锁定。",
    },
    tone: {
      name: "明暗反差",
      prompt: "点出唯一一枚【深炭黑石块】",
      note: "高明暗亮度差是最稳健的层级杠杆——即便去掉色彩（或色弱人群阅读）依然一眼生效。",
    },
    color: {
      name: "暖色点睛",
      prompt: "点出唯一一枚【陶红石块】",
      note: "在一片中性灰里投入单一暖色，会立刻触发跳出效应；但暖色一旦超过两三处，优势就会迅速稀释。",
    },
    space: {
      name: "留白隔离",
      prompt: "点出唯一一枚【四周留空的孤石】",
      note: "不用变大也不用变色，只要清开周围的干扰物，空间隔离本身就能把目标抬上第一层级。",
    },
    position: {
      name: "位置置顶",
      prompt: "点出处于【左上起读高位】的石块",
      note: "顺应从上到下、从左到右的阅读起点，把核心放在入口处能省去眼睛往返寻路的时间。",
    },
    conjunction: {
      name: "组合干扰（对照）",
      prompt: "点出唯一一枚【陶红 + 窄竖椭圆】的石块",
      note: "特里斯曼与格拉德（1980）指出：当目标必须靠「颜色 + 形状」组合才能认出时，跳出效应消失，大脑被迫退回慢速逐项搜寻。",
    },
  };

  let curLever = "color";
  let targetIdx = 14;
  let startedAt = 0;
  let solved = false;
  let bestSingleMs = null;
  let lastConjMs = null;
  let roundSeed = 1;

  function pickIndex(lever) {
    roundSeed = (roundSeed * 7 + 5) % 29;
    if (lever === "position") return 0;
    if (lever === "space") return 8 + (roundSeed % 4); // 第 2 行中段，周围清空形成留白区
    // 避开第 0 格，让读者真找一下
    return 4 + (roundSeed % 22);
  }

  function renderArena(resetClock = true) {
    solved = false;
    targetIdx = pickIndex(curLever);
    if (resetClock) startedAt = performance.now();

    leverBtns.forEach((b) => {
      const on = b.dataset.lever === curLever;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (taskPrompt) taskPrompt.textContent = LEVERS[curLever].prompt;
    if (noteOut) noteOut.textContent = LEVERS[curLever].note;
    if (timeOut) timeOut.textContent = "等待点选…";

    // 计算留白模式需要清空的邻格
    const tr = Math.floor(targetIdx / 6);
    const tc = targetIdx % 6;
    const isNeighbor = (idx) => {
      const r = Math.floor(idx / 6);
      const c = idx % 6;
      return idx !== targetIdx && Math.abs(r - tr) <= 1 && Math.abs(c - tc) <= 1;
    };

    const cells = [];
    for (let i = 0; i < 30; i++) {
      if (curLever === "space" && isNeighbor(i)) {
        cells.push(`<span class="pop-blank" aria-hidden="true"></span>`);
        continue;
      }
      const isTarget = i === targetIdx;
      let fill = PALETTE.olive;
      let rx = 14;
      let ry = 10;
      if (curLever === "size") {
        fill = PALETTE.charcoal;
        rx = isTarget ? 21 : 10;
        ry = isTarget ? 15 : 7;
      } else if (curLever === "tone") {
        fill = isTarget ? PALETTE.charcoal : "#D7CCB8";
        rx = 15;
        ry = 10;
      } else if (curLever === "color") {
        fill = isTarget ? PALETTE.terra : "#8D9087";
        rx = 14;
        ry = 10;
      } else if (curLever === "space") {
        fill = PALETTE.charcoal;
        rx = 14;
        ry = 10;
      } else if (curLever === "position") {
        fill = isTarget ? PALETTE.goldDeep : "#8D9087";
        rx = 15;
        ry = 10;
      } else if (curLever === "conjunction") {
        // 干扰项一半是陶红宽扁石，一半是炭黑窄竖石；唯独目标是陶红窄竖石！
        if (isTarget) {
          fill = PALETTE.terra;
          rx = 8;
          ry = 16;
        } else if ((i + roundSeed) % 2 === 0) {
          fill = PALETTE.terra;
          rx = 16;
          ry = 8;
        } else {
          fill = PALETTE.charcoal;
          rx = 8;
          ry = 16;
        }
      }

      cells.push(`
        <button type="button" class="pop-cell" data-pop-idx="${i}" aria-label="石块 ${i + 1}">
          <svg viewBox="0 0 48 40" width="44" height="36" aria-hidden="true">
            <ellipse cx="24" cy="20" rx="${rx}" ry="${ry}" fill="${fill}"/>
          </svg>
        </button>
      `);
    }
    grid.innerHTML = cells.join("");
  }

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pop-idx]");
    if (!btn || solved) return;
    const idx = Number(btn.dataset.popIdx);
    if (idx === targetIdx) {
      solved = true;
      const ms = Math.max(80, Math.round(performance.now() - startedAt));
      btn.classList.add("is-hit");
      if (timeOut) timeOut.textContent = `命中：${ms} ms`;
      if (curLever === "conjunction") {
        lastConjMs = ms;
      } else {
        bestSingleMs = bestSingleMs == null ? ms : Math.min(bestSingleMs, ms);
      }
      if (compareOut) {
        if (bestSingleMs != null && lastConjMs != null) {
          compareOut.textContent = `单特征最快 ${bestSingleMs} ms vs 组合干扰 ${lastConjMs} ms`;
        } else if (curLever === "conjunction") {
          compareOut.textContent = `组合干扰 ${ms} ms · 再切一个单特征杠杆比比看`;
        } else {
          compareOut.textContent = `单特征 ${ms} ms · 再切「组合干扰」体验耗时拉长`;
        }
      }
    } else {
      btn.classList.add("is-miss");
      if (timeOut) timeOut.textContent = "点偏了，再找目标石块";
    }
  });

  leverBtns.forEach((b) =>
    b.addEventListener("click", () => {
      curLever = b.dataset.lever;
      renderArena(true);
    })
  );
  shuffleBtn?.addEventListener("click", () => renderArena(true));
  renderArena(true);
}

// =========================================================================
// 03 F 与 Z 扫视的真相（深炭暗室）：2D Canvas 眼动热力与扫视轨迹推演台
// =========================================================================
export function initSecScan() {
  const canvas = document.getElementById("scan-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const modeBtns = [...document.querySelectorAll("[data-scan-mode]")];
  const timeSlider = document.getElementById("scan-time");
  const timeOut = document.getElementById("scan-time-out");
  const playBtn = document.getElementById("scan-play");
  const heatBtn = document.getElementById("scan-heat");
  const patternName = document.getElementById("scan-pattern-name");
  const missOut = document.getElementById("scan-miss");
  const explainOut = document.getElementById("scan-explain");

  const MODES = {
    fwall: {
      name: "F 型扫视（缺乏层级的无奈捷径）",
      miss: "右半与右下漏读风险：高（示意）",
      explain: "没有小标题与层级留白时，读者为了省力只横扫前两行，随后顺着左侧边缘垂直下滑——页面右下方大片正文根本不会被看到（Nielsen 2006 / Pernice 2017）。",
      // 模拟眼动注视点 [x(0..1), y(0..1), r, tStart(0..5)]
      fixations: [
        [0.14, 0.14, 42, 0.0], [0.34, 0.14, 38, 0.3], [0.56, 0.14, 34, 0.6], [0.76, 0.15, 28, 0.95],
        [0.14, 0.28, 36, 1.35], [0.32, 0.29, 32, 1.7], [0.48, 0.30, 24, 2.05],
        [0.14, 0.45, 30, 2.45], [0.16, 0.58, 28, 2.9], [0.15, 0.72, 26, 3.4], [0.16, 0.85, 22, 4.0],
      ],
    },
    layercake: {
      name: "千层糕式扫视（清晰三级层级的理想态）",
      miss: "关键小节漏读风险：低（示意）",
      explain: "把正文切分为带粗体小标题与清晰留白的章节后，读者逐层扫过每条小标题，只在自己关心的那一层停下来深读——既省时又不错过重点。",
      fixations: [
        [0.15, 0.14, 40, 0.0], [0.42, 0.14, 36, 0.35], [0.68, 0.14, 30, 0.7],
        [0.16, 0.39, 36, 1.2], [0.44, 0.39, 34, 1.6], [0.64, 0.39, 26, 2.0],
        [0.16, 0.65, 38, 2.55], [0.38, 0.65, 34, 2.95], [0.62, 0.65, 28, 3.35],
        [0.32, 0.78, 30, 3.9], [0.58, 0.79, 26, 4.4],
      ],
    },
    zposter: {
      name: "Z 型扫视（信息稀疏的海报 / 卡片）",
      miss: "核心节点覆盖：首尾落点清晰（示意）",
      explain: "当画面只有少量大块视觉元素（海报、落地页首屏）时，视线常从左上标识横扫至右上主焦，再斜穿到左下导语，最后稳落在右下行动入口。",
      fixations: [
        [0.16, 0.16, 38, 0.0], [0.48, 0.16, 32, 0.5], [0.80, 0.17, 42, 1.0],
        [0.52, 0.48, 36, 1.85],
        [0.18, 0.80, 36, 2.7], [0.50, 0.81, 30, 3.45], [0.80, 0.81, 44, 4.15],
      ],
    },
  };

  let mode = "fwall";
  let curSec = 3.6;
  let playing = !reducedMotion.matches;
  let showHeat = true;
  const W = 620;
  const H = 370;

  function drawSpecimen(c) {
    // 模拟纸面基底
    c.fillStyle = "#1D2021";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#F5EAD4";
    c.fillRect(24, 18, W - 48, H - 36);

    const lx = 48;
    const rw = W - 96;
    if (mode === "fwall") {
      // 无层级密集文字墙
      for (let i = 0; i < 14; i++) {
        const y = 38 + i * 21;
        c.fillStyle = i === 0 ? "#4D4A44" : "#8A857B";
        c.fillRect(lx, y, rw * (i % 4 === 3 ? 0.68 : 0.96), 7);
      }
      // 标注右下方盲区提示
      c.save();
      c.strokeStyle = "rgba(184, 41, 30, 0.55)";
      c.setLineDash([5, 4]);
      c.lineWidth = 1.5;
      c.strokeRect(W * 0.52, H * 0.42, W * 0.36, H * 0.42);
      c.fillStyle = "#9F3514";
      c.font = `700 11px "Noto Sans SC", sans-serif`;
      c.fillText("右下方常被跳过（盲区）", W * 0.55, H * 0.64);
      c.restore();
    } else if (mode === "layercake") {
      // 清晰三级千层糕小节
      const sections = [38, 134, 230];
      sections.forEach((sy, idx) => {
        c.fillStyle = idx === 0 ? PALETTE.charcoal : PALETTE.terra;
        c.fillRect(lx, sy, rw * (idx === 0 ? 0.66 : 0.52), 14);
        c.fillStyle = "#9B968D";
        c.fillRect(lx, sy + 24, rw * 0.92, 6);
        c.fillRect(lx, sy + 38, rw * 0.86, 6);
        c.fillRect(lx, sy + 52, rw * 0.62, 6);
      });
    } else {
      // Z 型疏朗海报构图
      c.fillStyle = PALETTE.charcoal;
      c.fillRect(lx, 40, 140, 22);
      c.fillStyle = PALETTE.gold;
      c.beginPath();
      c.arc(W - 110, 62, 26, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#C7BBA6";
      c.fillRect(lx + 70, 118, rw - 140, 110);
      c.fillStyle = PALETTE.charcoal;
      c.fillRect(lx + 96, 156, 210, 18);
      c.fillStyle = "#7D7970";
      c.fillRect(lx + 96, 184, 170, 8);
      c.fillStyle = "#7D7970";
      c.fillRect(lx, 274, 190, 10);
      c.fillRect(lx, 294, 150, 8);
      c.fillStyle = PALETTE.terra;
      c.fillRect(W - 168, 270, 118, 36);
      c.fillStyle = "#FCF5E8";
      c.font = `700 12px "Noto Sans SC", sans-serif`;
      c.fillText("立即查看 →", W - 142, 292);
    }
  }

  function frame(t, dt, { still }) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const dpr = pixelRatio(2);
    const pw = Math.round(rect.width * dpr);
    const ph = Math.round(rect.height * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }

    if (playing && !still) {
      curSec += (dt || 0.016) * 0.85;
      if (curSec > 5.0) curSec = 0;
      if (timeSlider) timeSlider.value = String(Math.round(curSec * 10));
      if (timeOut) timeOut.textContent = `${curSec.toFixed(1)}s`;
    } else if (still) {
      curSec = 4.6;
    }

    const sx = rect.width / W;
    const sy = rect.height / H;
    ctx.save();
    ctx.setTransform(dpr * sx, 0, 0, dpr * sy, 0, 0);

    drawSpecimen(ctx);

    const fixs = MODES[mode].fixations.filter((f) => f[3] <= curSec);

    // 热力云
    if (showHeat) {
      for (const [fx, fy, r, t0] of fixs) {
        const age = Math.min(1, (curSec - t0) / 0.55);
        const gx = 24 + fx * (W - 48);
        const gy = 18 + fy * (H - 36);
        const rad = r * (0.65 + age * 0.45);
        const g = ctx.createRadialGradient(gx, gy, 2, gx, gy, rad);
        g.addColorStop(0, "rgba(225, 100, 60, 0.72)");
        g.addColorStop(0.5, "rgba(239, 178, 49, 0.42)");
        g.addColorStop(1, "rgba(239, 178, 49, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(gx, gy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 眼跳路径连线与顺位点
    if (fixs.length > 0) {
      ctx.save();
      ctx.strokeStyle = PALETTE.charcoal;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      fixs.forEach(([fx, fy], i) => {
        const gx = 24 + fx * (W - 48);
        const gy = 18 + fy * (H - 36);
        if (i === 0) ctx.moveTo(gx, gy);
        else ctx.lineTo(gx, gy);
      });
      ctx.stroke();
      ctx.restore();

      fixs.forEach(([fx, fy], i) => {
        const gx = 24 + fx * (W - 48);
        const gy = 18 + fy * (H - 36);
        const isHead = i === fixs.length - 1;
        ctx.beginPath();
        ctx.arc(gx, gy, isHead ? 11 : 8, 0, Math.PI * 2);
        ctx.fillStyle = isHead ? PALETTE.terra : PALETTE.charcoal;
        ctx.fill();
        ctx.strokeStyle = "#FCF5E8";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = "#FCF5E8";
        ctx.font = `700 ${isHead ? 10 : 9}px "DM Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), gx, gy + 0.5);
        ctx.textAlign = "left";
      });
    }

    ctx.restore();
  }

  const ctrl = loop(canvas, frame);

  function sync() {
    const m = MODES[mode];
    modeBtns.forEach((b) => {
      const on = b.dataset.scanMode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (patternName) patternName.textContent = m.name;
    if (missOut) missOut.textContent = m.miss;
    if (explainOut) explainOut.textContent = m.explain;
    if (playBtn) {
      playBtn.textContent = playing ? "暂停推演" : "继续推演";
      playBtn.setAttribute("aria-pressed", String(playing));
    }
    if (heatBtn) {
      heatBtn.textContent = showHeat ? "热力图：开" : "热力图：关";
      heatBtn.setAttribute("aria-pressed", String(showHeat));
    }
    if (timeOut) timeOut.textContent = `${curSec.toFixed(1)}s`;
    ctrl.draw();
  }

  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.scanMode;
      curSec = reducedMotion.matches ? 4.6 : 0.4;
      sync();
    })
  );
  timeSlider?.addEventListener("input", () => {
    playing = false;
    curSec = Number(timeSlider.value) / 10;
    sync();
  });
  playBtn?.addEventListener("click", () => {
    playing = !playing;
    if (playing && curSec >= 4.9) curSec = 0;
    sync();
  });
  heatBtn?.addEventListener("click", () => {
    showHeat = !showHeat;
    sync();
  });

  sync();
}

// =========================================================================
// 04 从朱书抄本到瑞士网格：四时代同文重排标本切换器
// =========================================================================
export function initSecHistory() {
  const btns = [...document.querySelectorAll("[data-era]")];
  const specimen = document.getElementById("era-specimen");
  const cuesEl = document.getElementById("era-cues");
  const captionEl = document.getElementById("era-caption");
  if (!specimen) return;

  const ERAS = {
    rubric: {
      cues: "核心手段：朱红墨水变色（Rubrication） + 放大首字母",
      caption: "中世纪羊皮纸手抄本字号几乎一致，抄写员改用朱红墨水标出题纲与大首字母，让读者在连绵黑体字海里找到章节入口。",
      html: `
        <div class="spec-rubric">
          <p class="spec-rubric-head">【朱书提纲】秋季陶艺器物展 · 南岸美术馆三层</p>
          <p class="spec-rubric-body"><span class="spec-dropcap">器</span>物与泥土展览自十月十八日起至十一月二十四日开放，汇集三十二位手作匠人近三年烧制的日常陶皿与建筑陶板，免费预约入场，观展请勿开启闪光灯。</p>
        </div>`,
    },
    newtype: {
      cues: "核心手段：不对称编排 + 巨大字号差 + 粗黑分割杠（1928）",
      caption: "杨·奇肖尔德《新字体排印》（1928）抛弃古典居中对称，把最重要的词推到超大粗体，并用粗黑几何横杠切开主次信息。",
      html: `
        <div class="spec-newtype">
          <div class="spec-nt-top">
            <strong class="spec-nt-title">器物与泥土</strong>
            <span class="spec-nt-date" lang="en">10.18—11.24</span>
          </div>
          <div class="spec-nt-bar"></div>
          <div class="spec-nt-grid">
            <p class="spec-nt-sub">南岸美术馆三层 · 32 位手作匠人</p>
            <p class="spec-nt-fine">免费预约入场 · 禁止闪光灯 · 10:00–18:00</p>
          </div>
        </div>`,
    },
    swiss: {
      cues: "核心手段：严密网格栏线 + 灰阶明度 + 负空间呼吸（1967）",
      caption: "埃米尔·鲁德尔《字体排印设计手册》（1967）把层级纳入精确网格：不靠花哨装饰，单用字重、灰阶深浅和留白比例就建立出冷静秩序。",
      html: `
        <div class="spec-swiss">
          <div class="spec-sw-col1">
            <span class="spec-sw-no" lang="en">EX / 095</span>
            <p class="spec-sw-fine">免费预约入场<br>请勿使用闪光灯</p>
          </div>
          <div class="spec-sw-col2">
            <strong class="spec-sw-title">器物与泥土</strong>
            <p class="spec-sw-sub">南岸美术馆三层展厅 · 10.18 — 11.24</p>
            <p class="spec-sw-body">精选近三年烧制的日常陶皿与建筑陶板，呈现从粗泥塑形到高温窑变的器物肌理。</p>
          </div>
        </div>`,
    },
    digital: {
      cues: "核心手段：语义三阶卡片 + 留白分组 + 唯一主操作入口（现代）",
      caption: "现代界面继承了印刷排版的三级字阶，并把「行动入口」纳入视觉层级：让用户在手机小屏的几秒扫视内立刻看清主旨并找到下一步。",
      html: `
        <div class="spec-digital">
          <span class="spec-dg-kicker">南岸美术馆 · 10.18 — 11.24</span>
          <strong class="spec-dg-title">器物与泥土：年度器物展</strong>
          <p class="spec-dg-body">精选 32 位手作匠人的日常陶皿与建筑陶板原作，免费预约即可入场。</p>
          <div class="spec-dg-foot">
            <span class="spec-dg-cta">预约观展</span>
            <span class="spec-dg-note">周二至周日 10:00–18:00 · 禁用闪光灯</span>
          </div>
        </div>`,
    },
  };

  let cur = "rubric";
  function render() {
    const e = ERAS[cur];
    btns.forEach((b) => {
      const on = b.dataset.era === cur;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    specimen.innerHTML = e.html;
    if (cuesEl) cuesEl.textContent = e.cues;
    if (captionEl) captionEl.textContent = e.caption;
  }

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      cur = b.dataset.era;
      render();
    })
  );
  render();
}

// =========================================================================
// 05 什么时候别拉太开：「强调通胀」压力测试 + 刻意平权场景对照
// =========================================================================
export function initSecAvoid() {
  const modeBtns = [...document.querySelectorAll("[data-avoid-mode]")];
  const paneInflate = document.getElementById("pane-inflation");
  const paneEqual = document.getElementById("pane-equal");
  const checks = [...document.querySelectorAll("[data-inflate]")];
  const card = document.getElementById("inflate-card");
  const pctEl = document.getElementById("inflate-pct");
  const barEl = document.getElementById("inflate-bar");
  const verdictEl = document.getElementById("inflate-verdict");
  const eqBtns = [...document.querySelectorAll("[data-equal-case]")];
  const eqBox = document.getElementById("equal-preview");
  const eqNote = document.getElementById("equal-note");
  if (!card) return;

  const WEIGHTS = { title: 16, sub: 14, date: 15, perks: 16, fine: 17 };

  function updateInflation() {
    const on = {};
    let total = 0;
    let count = 0;
    checks.forEach((ch) => {
      const k = ch.dataset.inflate;
      on[k] = ch.checked;
      if (ch.checked) {
        total += WEIGHTS[k] || 15;
        count++;
      }
      card.classList.toggle(`hi-${k}`, ch.checked);
    });
    if (pctEl) pctEl.textContent = `${total}%（${count}/5 处高光）`;
    if (barEl) {
      barEl.style.width = `${Math.min(100, total)}%`;
      barEl.dataset.level = total <= 22 ? "ok" : total <= 44 ? "mid" : "bad";
    }
    if (verdictEl) {
      if (count === 0) {
        verdictEl.textContent = "目前全无色块高光，只靠基础字号分出轻重——干净克制，但远看冲击力略弱。";
      } else if (total <= 22) {
        verdictEl.textContent = "克制聚焦（经验安全区）：仅 1 处核心高亮，视线一秒锁定，其余信息安静托底。";
      } else if (total <= 45) {
        verdictEl.textContent = "开始互相抢戏：已经有多个亮点同时拉扯眼睛，读者得停下来判断到底哪句最重要。";
      } else {
        verdictEl.textContent = "层级崩塌（全员第一 = 全员静音）：超过半张卡片都在高声尖叫，反而没有任何一句能脱颖而出。";
      }
    }
  }

  const EQUAL_CASES = {
    contract: {
      note: "法务协议与知情同意书不能把关键限制藏进极小浅灰字里——刻意弱化重要条款属于误导性的「暗黑模式」，各条款必须保持平等可读的字号与明暗。",
      html: `
        <div class="eq-doc">
          <div class="eq-doc-head">服务条款与退费细则（平权排布）</div>
          <p><strong>第一条 服务范围：</strong>本订阅按自然月计费，生效后可访问站内全部归档内容。</p>
          <p><strong>第二条 自动续费：</strong>到期前 24 小时可随时取消；取消后当期权益仍保留至周期结束。</p>
          <p><strong>第三条 退费说明：</strong>未产生下载记录的订单在 7 日内支持原路全额退回，不收手续费。</p>
        </div>`,
    },
    novel: {
      note: "长篇小说、散文与深度随笔追求连续的沉浸心流。如果在正文里频繁插入超大字号、彩色底块或跳跃卡片，每翻两页就把读者从故事里拽出来一次。",
      html: `
        <div class="eq-doc eq-novel">
          <div class="eq-doc-head">第四章 · 暮色里的旧车站</div>
          <p>火车进站时天已经黑透，站台尽头只剩两盏昏黄的灯。他把衣领竖起来，听见铁轨发出很轻的嗡鸣，像是远方山谷里传来的回声。</p>
          <p>月台石阶还留着白日里雨水的湿气，鞋底踩上去几乎没有声音。他没有急着走出检票口，只是靠着柱子站了一会儿，等人群先散进夜色里。</p>
        </div>`,
    },
    table: {
      note: "客观参数对比表与并列目录需要公正展示各选项，不应靠字号悬殊替读者暗中偏袒某一项（并列展示详见 105 并置原则）。",
      html: `
        <div class="eq-doc">
          <div class="eq-doc-head">三款纸张克重与表面参数对照</div>
          <div class="eq-table">
            <div><span>纸种</span><span>克重</span><span>表面质感</span><span>常见用途</span></div>
            <div><span>道林纸</span><span>100g</span><span>哑光细腻</span><span>书籍内页</span></div>
            <div><span>牛皮纸</span><span>180g</span><span>粗纤维</span><span>封套包装</span></div>
            <div><span>铜版纸</span><span>157g</span><span>光滑高反光</span><span>画册插页</span></div>
          </div>
        </div>`,
    },
  };

  let curEq = "contract";
  function renderEq() {
    const c = EQUAL_CASES[curEq];
    eqBtns.forEach((b) => {
      const on = b.dataset.equalCase === curEq;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (eqBox) eqBox.innerHTML = c.html;
    if (eqNote) eqNote.textContent = c.note;
  }

  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const m = b.dataset.avoidMode;
      modeBtns.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      if (paneInflate) paneInflate.hidden = m !== "inflation";
      if (paneEqual) paneEqual.hidden = m !== "equal";
    })
  );

  checks.forEach((ch) => ch.addEventListener("change", updateInflation));
  eqBtns.forEach((b) =>
    b.addEventListener("click", () => {
      curEq = b.dataset.equalCase;
      renderEq();
    })
  );

  updateInflation();
  renderEq();
}

// =========================================================================
// 06 小练习：挑出层级最稳的一版（深炭考场，中性标签 + 单变量 4 选 1）
// =========================================================================
export function initSecQuiz() {
  const qTabs = [...document.querySelectorAll("[data-quiz-q]")];
  const promptEl = document.getElementById("quiz-prompt");
  const gridEl = document.getElementById("quiz-grid");
  const fbEl = document.getElementById("quiz-feedback");
  if (!gridEl) return;

  const QUESTIONS = [
    {
      prompt: "题目 1 / 2 · 同一张「秋季陶艺展」信息卡，文案、配色、左对齐位置完全一致，仅三级视觉重量不同。请先眯眼扫一遍，再挑出层级秩序最稳的一版：",
      answer: "C",
      options: [
        {
          id: "A",
          label: "方案 A",
          sub: "版本 01",
          ok: false,
          reason: "方案 A 的问题是「一二级粘连」：主标题和展期字号几乎一样大、明暗又一样重，眯眼一看前两块糊成一片，拉不开主次断层。正确答案是方案 C。",
          ranks: [
            { x: 224, y: 34, n: "1" },
            { x: 224, y: 74, n: "1" },
            { x: 224, y: 138, n: "3" },
          ],
          svg: `
            <rect x="0" y="0" width="250" height="164" fill="#FCF5E8"/>
            <rect x="16" y="18" width="184" height="28" fill="#212526"/>
            <text x="24" y="37" fill="#FCF5E8" font-family="Noto Sans SC, sans-serif" font-weight="700" font-size="14">秋季陶艺展</text>
            <rect x="16" y="56" width="196" height="28" fill="#212526"/>
            <text x="24" y="75" fill="#FCF5E8" font-family="Noto Sans SC, sans-serif" font-weight="700" font-size="13">10.18 — 11.24 · 南岸三层</text>
            <text x="16" y="114" fill="#52564E" font-family="Noto Sans SC, sans-serif" font-size="10.5">32 位手作匠人日常器物与陶板原作</text>
            <text x="16" y="142" fill="#686C64" font-family="Noto Sans SC, sans-serif" font-size="10">免费预约入场 · 禁止使用闪光灯</text>
          `,
        },
        {
          id: "B",
          label: "方案 B",
          sub: "版本 02",
          ok: false,
          reason: "方案 B 犯了「重点倒挂」：最底部的免费须知套上高饱和陶红大色块和加粗大字后，第一眼直接被拽到卡片底边，反而把正上方的展览主题压成第二眼。正确答案是方案 C。",
          ranks: [
            { x: 224, y: 136, n: "1" },
            { x: 224, y: 36, n: "2" },
            { x: 224, y: 76, n: "3" },
          ],
          svg: `
            <rect x="0" y="0" width="250" height="164" fill="#FCF5E8"/>
            <text x="16" y="40" fill="#3B3935" font-family="Noto Sans SC, sans-serif" font-weight="700" font-size="17">秋季陶艺展</text>
            <text x="16" y="70" fill="#686C64" font-family="Noto Sans SC, sans-serif" font-size="11.5">10.18 — 11.24 · 南岸三层</text>
            <text x="16" y="96" fill="#686C64" font-family="Noto Sans SC, sans-serif" font-size="10.5">32 位手作匠人日常器物与陶板原作</text>
            <rect x="14" y="114" width="222" height="36" fill="#D5522D" stroke="#212526" stroke-width="2"/>
            <text x="24" y="137" fill="#FCF5E8" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="14.5">免费预约入场 · 禁用闪光灯</text>
          `,
        },
        {
          id: "C",
          label: "方案 C",
          sub: "版本 03",
          ok: true,
          reason: "答对了！方案 C 建立了清晰的三阶断层：主标题（1）稳稳接住第一眼，展期地点（2）用中等体量顺势支撑，免费预约细则（3）退居橄榄灰底端，强调占比克制在约 16%。",
          ranks: [
            { x: 224, y: 36, n: "1" },
            { x: 224, y: 80, n: "2" },
            { x: 224, y: 138, n: "3" },
          ],
          svg: `
            <rect x="0" y="0" width="250" height="164" fill="#FCF5E8"/>
            <rect x="16" y="18" width="4" height="36" fill="#212526"/>
            <text x="28" y="42" fill="#1A1818" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="22">秋季陶艺展</text>
            <text x="16" y="79" fill="#9F3514" font-family="Noto Sans SC, sans-serif" font-weight="700" font-size="13">10.18 — 11.24 · 南岸三层</text>
            <line x1="16" y1="95" x2="234" y2="95" stroke="#D8CCB7" stroke-width="1"/>
            <text x="16" y="114" fill="#52564E" font-family="Noto Sans SC, sans-serif" font-size="10.5">32 位手作匠人日常器物与陶板原作</text>
            <text x="16" y="142" fill="#686C64" font-family="Noto Sans SC, sans-serif" font-size="10">免费预约入场 · 禁止使用闪光灯</text>
          `,
        },
        {
          id: "D",
          label: "方案 D",
          sub: "版本 04",
          ok: false,
          reason: "方案 D 属于「过度强调」：四层信息全部加满暖金与陶红高亮条，强调区占满大半画面，结果全员互抢、眼睛无处停靠。正确答案是方案 C。",
          ranks: [
            { x: 224, y: 30, n: "1" },
            { x: 224, y: 66, n: "1" },
            { x: 224, y: 102, n: "1" },
          ],
          svg: `
            <rect x="0" y="0" width="250" height="164" fill="#FCF5E8"/>
            <rect x="14" y="14" width="222" height="28" fill="#E1643C"/>
            <text x="22" y="33" fill="#FCF5E8" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="16">秋季陶艺展</text>
            <rect x="14" y="48" width="222" height="26" fill="#EFB231"/>
            <text x="22" y="65" fill="#1A1818" font-family="Noto Sans SC, sans-serif" font-weight="700" font-size="12.5">10.18 — 11.24 · 南岸三层</text>
            <rect x="14" y="80" width="222" height="26" fill="#212526"/>
            <text x="22" y="97" fill="#EFB231" font-family="Noto Sans SC, sans-serif" font-weight="700" font-size="11">32 位手作匠人日常器物与陶板</text>
            <rect x="14" y="112" width="222" height="28" fill="#E1643C"/>
            <text x="22" y="131" fill="#FCF5E8" font-family="Noto Sans SC, sans-serif" font-weight="700" font-size="11.5">免费预约入场 · 禁止闪光灯</text>
          `,
        },
      ],
    },
    {
      prompt: "题目 2 / 2 · 同一篇三节网页导读，栏宽与正文完全一致，仅小标题与段落层级信号不同。哪一版最便于读者快速跳读而不漏重点？",
      answer: "B",
      options: [
        {
          id: "A",
          label: "方案 A",
          sub: "版本 01",
          ok: false,
          reason: "方案 A 把三节揉成一整块密集灰墙，正是逼出 F 型扫视的典型反例——下半段信息大概率被读者直接跳过。正确答案是方案 B。",
          ranks: [
            { x: 224, y: 26, n: "1" },
            { x: 224, y: 74, n: "…" },
          ],
          svg: `
            <rect x="0" y="0" width="250" height="164" fill="#FCF5E8"/>
            <rect x="16" y="20" width="126" height="7" fill="#212526"/>
            <rect x="148" y="20" width="84" height="7" fill="#9A9488"/>
            ${[34, 48, 62, 76, 90, 104, 118, 132, 146]
              .map((y, i) => `<rect x="16" y="${y}" width="${i % 3 === 2 ? 168 : 216}" height="6" fill="#9A9488"/>`)
              .join("")}
          `,
        },
        {
          id: "B",
          label: "方案 B",
          sub: "版本 02",
          ok: true,
          reason: "答对了！方案 B 用小标题字重 + 清晰段前留白把长文切成三层「千层糕」：视线可以顺着 1→2→3 轻松定位关心的小节，再沉进正文细读。",
          ranks: [
            { x: 224, y: 26, n: "1" },
            { x: 224, y: 74, n: "2" },
            { x: 224, y: 122, n: "3" },
          ],
          svg: `
            <rect x="0" y="0" width="250" height="164" fill="#FCF5E8"/>
            ${[20, 68, 116]
              .map(
                (y, idx) => `
              <rect x="16" y="${y}" width="4" height="11" fill="${idx === 0 ? "#212526" : "#E1643C"}"/>
              <rect x="25" y="${y}" width="${idx === 0 ? 118 : 96}" height="10" fill="#212526"/>
              <rect x="16" y="${y + 17}" width="214" height="5.5" fill="#9A9488"/>
              <rect x="16" y="${y + 27}" width="184" height="5.5" fill="#9A9488"/>
            `
              )
              .join("")}
          `,
        },
        {
          id: "C",
          label: "方案 C",
          sub: "版本 03",
          ok: false,
          reason: "方案 C 形成了「反层级」：本应起路标作用的小标题对比度比正文还弱，扫视时眼睛根本抓不到章节分界。正确答案是方案 B。",
          ranks: [
            { x: 224, y: 40, n: "1" },
            { x: 224, y: 92, n: "2" },
          ],
          svg: `
            <rect x="0" y="0" width="250" height="164" fill="#FCF5E8"/>
            ${[20, 68, 116]
              .map(
                (y) => `
              <rect x="16" y="${y}" width="92" height="6" fill="#C9C0AF"/>
              <rect x="16" y="${y + 14}" width="214" height="7" fill="#3C3A36"/>
              <rect x="16" y="${y + 26}" width="188" height="7" fill="#3C3A36"/>
            `
              )
              .join("")}
          `,
        },
        {
          id: "D",
          label: "方案 D",
          sub: "版本 04",
          ok: false,
          reason: "方案 D 的随机散点高光把视线撕成碎片：眼睛在红色补丁之间乱跳，却仍然看不出整段文章的结构骨架。正确答案是方案 B。",
          ranks: [
            { x: 224, y: 36, n: "!" },
            { x: 224, y: 112, n: "!" },
          ],
          svg: `
            <rect x="0" y="0" width="250" height="164" fill="#FCF5E8"/>
            ${[20, 36, 52, 68, 84, 100, 116, 132, 148]
              .map((y) => `<rect x="16" y="${y}" width="216" height="6.5" fill="#9A9488"/>`)
              .join("")}
            <rect x="58" y="19" width="42" height="8" fill="#E1643C"/>
            <rect x="150" y="51" width="48" height="8" fill="#E1643C"/>
            <rect x="26" y="83" width="52" height="8" fill="#E1643C"/>
            <rect x="128" y="99" width="44" height="8" fill="#E1643C"/>
            <rect x="74" y="131" width="54" height="8" fill="#E1643C"/>
          `,
        },
      ],
    },
  ];

  let curQ = 0;
  const picked = [null, null];

  function render() {
    const q = QUESTIONS[curQ];
    const ans = picked[curQ];
    qTabs.forEach((b) => {
      const on = Number(b.dataset.quizQ) === curQ;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (promptEl) promptEl.textContent = q.prompt;

    gridEl.innerHTML = q.options
      .map((opt) => {
        const chosen = ans === opt.id;
        let cls = "quiz-card";
        if (ans) {
          if (opt.ok) cls += " is-correct";
          else if (chosen) cls += " is-wrong";
          else cls += " is-dim";
        }
        const overlay = ans
          ? opt.ranks
              .map(
                (rk) => `
              <g>
                <circle cx="${rk.x}" cy="${rk.y}" r="11" fill="${opt.ok ? PALETTE.pass : PALETTE.terra}"/>
                <text x="${rk.x}" y="${rk.y + 4}" text-anchor="middle" fill="#FCF5E8" font-family="DM Mono, monospace" font-weight="700" font-size="11">${rk.n}</text>
              </g>`
              )
              .join("")
          : "";
        return `
          <button type="button" class="${cls}" data-quiz-opt="${opt.id}" aria-pressed="${chosen}">
            <span class="quiz-head">
              <strong class="quiz-tag">${opt.label}</strong>
              <span class="quiz-desc">${opt.sub}</span>
            </span>
            <svg class="quiz-svg" viewBox="0 0 250 164" aria-hidden="true">${opt.svg}${overlay}</svg>
          </button>
        `;
      })
      .join("");

    if (fbEl) {
      if (!ans) {
        fbEl.textContent = "先眯一眼这四张卡片，再点击你认为层级最稳、阅读最省力的一版。";
        fbEl.dataset.state = "idle";
      } else {
        const chosenObj = q.options.find((x) => x.id === ans);
        fbEl.textContent = chosenObj.reason;
        fbEl.dataset.state = chosenObj.ok ? "ok" : "warn";
      }
    }
  }

  gridEl.addEventListener("click", (e) => {
    const card = e.target.closest("[data-quiz-opt]");
    if (!card) return;
    picked[curQ] = card.dataset.quizOpt;
    render();
  });
  qTabs.forEach((b) =>
    b.addEventListener("click", () => {
      curQ = Number(b.dataset.quizQ);
      render();
    })
  );
  render();
}

// =========================================================================
// 07 原海报灯箱（点击放大、拖拽平移、Esc 关闭，draggable="false"）
// =========================================================================
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const zoomResetBtn = document.getElementById("lb-zoom-reset");
  const stage = document.getElementById("lightbox-stage");
  if (!poster || !lb || !lbImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let lastFocus = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomResetBtn) zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    lastFocus = document.activeElement;
    lbImg.src = poster.currentSrc || poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    closeBtn?.focus();
  }

  function close() {
    lb.hidden = true;
    lastFocus?.focus?.();
  }

  poster.addEventListener("click", open);
  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  lb.addEventListener("click", (e) => {
    if (e.target === lb) close();
  });
  document.addEventListener("keydown", (e) => {
    if (!lb.hidden && e.key === "Escape") close();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.35).toFixed(2));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener(
    "wheel",
    (e) => {
      if (lb.hidden) return;
      e.preventDefault();
      scale = Math.max(0.8, Math.min(3.2, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
      applyTransform();
    },
    { passive: false }
  );

  lbImg.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    try { lbImg.setPointerCapture(e.pointerId); } catch {}
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  lbImg.addEventListener("pointerup", () => { dragging = false; });
  lbImg.addEventListener("pointercancel", () => { dragging = false; });
}

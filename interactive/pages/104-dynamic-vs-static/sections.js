// 104 动静对比 —— 正文七节交互模块（01 搜索计时 / 02 四层解剖 / 03 八拍节奏 / 04 历史图版 / 05 动效预算 / 06 练习 / 07 海报查看器）
import { pixelRatio } from "../../lib/stage.js";
import {
  QUIZ_ITEMS,
  diagnoseAnatomy,
  diagnoseRhythm,
  diagnoseUiBudget,
} from "./model.js";

// ============================================================
// 01 节：5×5 一秒找异类 · 搜索不对称实测（Treisman & Gormican 1988）
// ============================================================
export function initSearchLab() {
  const grid = document.getElementById("search-grid");
  const btnA = document.getElementById("search-mode-a");
  const btnB = document.getElementById("search-mode-b");
  const btnStart = document.getElementById("search-start");
  const outA = document.getElementById("time-a");
  const outB = document.getElementById("time-b");
  const readout = document.getElementById("search-readout");

  let mode = "A"; // A: 静场找 1 斜；B: 乱场找 1 正
  let targetIdx = 12;
  let startTime = 0;
  let solved = false;
  let lastA = null;
  let lastB = null;

  // 确定性伪随机角度偏移，既自然又可复现
  const tiltAngles = [24, -28, 34, -22, 30, -35, 26, -30, 38, -25, 29, -32, 36, -27, 23, -34, 31, -26, 35, -29, 27, -33, 32, -24, 28];

  function buildRound(seedShift) {
    solved = false;
    // 避开中心与上一次相同的位置
    const candidates = [2, 6, 8, 11, 13, 16, 18, 21, 7, 17, 9, 14];
    const next = candidates[seedShift % candidates.length];
    targetIdx = next === targetIdx ? candidates[(seedShift + 3) % candidates.length] : next;

    grid.innerHTML = "";
    for (let i = 0; i < 25; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "s-tile";
      btn.dataset.idx = String(i);
      const isTarget = i === targetIdx;
      const rot = mode === "A"
        ? (isTarget ? 34 : 0)
        : (isTarget ? 0 : tiltAngles[(i + seedShift) % tiltAngles.length]);
      btn.style.setProperty("--rot", `${rot}deg`);
      btn.setAttribute("aria-label", `第 ${i + 1} 格`);
      const bar = document.createElement("span");
      bar.className = "s-bar";
      btn.appendChild(bar);
      btn.addEventListener("click", () => handlePick(i, btn));
      grid.appendChild(btn);
    }
    startTime = performance.now();
    readout.textContent = mode === "A"
      ? "当前是「静场找 1 斜」：在 24 根竖直静条里，立刻点出唯一倾斜的那一根。"
      : "当前是「乱场找 1 正」：在 24 根各斜一方的动条里，找出唯一端正竖直的那一根。";
  }

  let roundSeq = 1;
  function handlePick(idx, btn) {
    if (solved) return;
    if (idx === targetIdx) {
      solved = true;
      const sec = Math.max(0.05, (performance.now() - startTime) / 1000);
      btn.classList.add("is-hit");
      if (mode === "A") {
        lastA = sec;
        outA.textContent = `${sec.toFixed(2)}s`;
      } else {
        lastB = sec;
        outB.textContent = `${sec.toFixed(2)}s`;
      }
      if (lastA !== null && lastB !== null) {
        const ratio = (lastB / Math.max(0.05, lastA)).toFixed(1);
        readout.textContent = lastB > lastA
          ? `对比出来了：静场寻斜只用了 ${lastA.toFixed(2)}s，乱场寻正用了 ${lastB.toFixed(2)}s（慢约 ${ratio}×）。静态秩序越齐，唯一动态破局者越像自带聚光灯。`
          : `两次实测：静场寻斜 ${lastA.toFixed(2)}s，乱场寻正 ${lastB.toFixed(2)}s。再换几组多测两次，能明显感到「静场里斜条直接跳进眼帘，乱场里正条需要逐排扫描」。`;
      } else {
        readout.textContent = mode === "A"
          ? `命中！耗时 ${sec.toFixed(2)}s。现在切到旁边的「乱场找 1 正」，亲自试一试当 24 根都在斜时有多难找。`
          : `命中！耗时 ${sec.toFixed(2)}s。切回「静场找 1 斜」对比一下第一眼的速度差。`;
      }
    } else {
      btn.classList.add("is-miss");
      setTimeout(() => btn.classList.remove("is-miss"), 320);
      readout.textContent = mode === "A"
        ? "那一根是竖直的静条，再找找唯一斜着的那一根。"
        : "那一根也是斜的——当满场都是斜线，大脑不得不逐行排查才能认出唯一竖直的那一根。";
    }
  }

  btnA.addEventListener("click", () => {
    mode = "A";
    btnA.classList.add("active");
    btnA.setAttribute("aria-pressed", "true");
    btnB.classList.remove("active");
    btnB.setAttribute("aria-pressed", "false");
    buildRound(++roundSeq);
  });

  btnB.addEventListener("click", () => {
    mode = "B";
    btnB.classList.add("active");
    btnB.setAttribute("aria-pressed", "true");
    btnA.classList.remove("active");
    btnA.setAttribute("aria-pressed", "false");
    buildRound(++roundSeq);
  });

  btnStart.addEventListener("click", () => buildRound(++roundSeq));
  buildRound(roundSeq);
}

// ============================================================
// 02 节：四层解剖台（Canvas 实时图层拆解）
// ============================================================
export function initAnatomyLab() {
  const canvas = document.getElementById("anatomy-canvas");
  const ctx = canvas.getContext("2d");
  const badge = document.getElementById("an-badge");
  const text = document.getElementById("an-text");
  const checks = {
    grid: document.getElementById("layer-grid"),
    orb: document.getElementById("layer-orb"),
    streaks: document.getElementById("layer-streaks"),
    space: document.getElementById("layer-space"),
  };

  function getLayers() {
    return {
      grid: checks.grid.checked,
      orb: checks.orb.checked,
      streaks: checks.streaks.checked,
      space: checks.space.checked,
    };
  }

  function draw() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(240, Math.round(r.width));
    const h = Math.max(180, Math.round(r.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const layers = getLayers();
    const diag = diagnoseAnatomy(layers);
    badge.dataset.kind = diag.kind;
    badge.textContent = diag.status;
    text.textContent = diag.text;

    ctx.fillStyle = "#010833";
    ctx.fillRect(0, 0, w, h);

    // 淡坐标底线
    ctx.strokeStyle = "rgba(112, 199, 171, 0.10)";
    ctx.lineWidth = 1;
    for (let x = 24; x < w; x += 36) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 24; y < h; y += 36) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const u = Math.min(w, h);
    const gridSize = u * 0.48;
    const gap = gridSize * 0.055;
    const cell = (gridSize - gap * 2) / 3;
    const gx = layers.space ? w * 0.16 : w * 0.25;
    const gy = h * 0.26;
    const px = gx + cell * 1.02;
    const py = gy + gridSize * 0.96;

    // 空间张力关闭时，圆球被压缩回方格近旁，失去暗场空隙
    const ox = layers.space ? w * 0.72 : gx + gridSize * 0.92;
    const oy = layers.space ? h * 0.28 : gy + gridSize * 0.16;
    const orbR = u * 0.135;

    // Layer 4: 暗场空间张力虚环
    if (layers.space) {
      ctx.save();
      ctx.strokeStyle = "rgba(148, 228, 202, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(w * 0.65, h * 0.68, u * 0.145, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else {
      // 关掉空间张力时画紧缩压迫边界线
      ctx.save();
      ctx.strokeStyle = "rgba(235, 95, 51, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(gx - 12, gy - 12, gridSize + orbR + 18, gridSize + 24);
      ctx.restore();
    }

    // Layer 1: 稳定的 3×3 结构
    if (layers.grid) {
      ctx.fillStyle = "#70C7AB";
      for (let i = 0; i < 9; i++) {
        const rr = Math.floor(i / 3), cc = i % 3;
        ctx.fillRect(gx + cc * (cell + gap), gy + rr * (cell + gap), cell, cell);
      }
    }

    // Layer 3: 方向与速度（光束 + 轨迹线）
    if (layers.streaks) {
      const dx = ox - px, dy = oy - py;
      const len = Math.max(1, Math.hypot(dx, dy));
      const ux = dx / len, uy = dy / len;
      const nx = -uy, ny = ux;

      // 速度细线
      for (let s = -3; s <= 3; s++) {
        const off = s * orbR * 0.45;
        ctx.strokeStyle = s === 2 ? "#EB5F33" : s === -2 ? "#70C7AB" : "rgba(238, 236, 225, 0.7)";
        ctx.lineWidth = s === 2 ? 2.2 : 1.2;
        ctx.beginPath();
        ctx.moveTo(px + ux * len * 0.1 + nx * off, py + uy * len * 0.1 + ny * off);
        ctx.lineTo(ox + ux * u * 0.18 + nx * off, oy + uy * u * 0.18 + ny * off);
        ctx.stroke();
      }

      // 象牙主光束
      ctx.fillStyle = "#EEECE1";
      ctx.beginPath();
      ctx.moveTo(px + nx * 6, py + ny * 6);
      ctx.lineTo(ox + nx * orbR * 0.72, oy + ny * orbR * 0.72);
      ctx.lineTo(ox - nx * orbR * 0.72, oy - ny * orbR * 0.72);
      ctx.lineTo(px - nx * 6, py - ny * 6);
      ctx.closePath();
      ctx.fill();

      // 橘红发射点
      ctx.fillStyle = "#EB5F33";
      ctx.beginPath();
      ctx.arc(px, py, u * 0.052, 0, Math.PI * 2);
      ctx.fill();
    }

    // Layer 2: 打破平衡的圆球
    if (layers.orb) {
      ctx.fillStyle = "#76CEB3";
      ctx.beginPath();
      ctx.arc(ox, oy, orbR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  Object.values(checks).forEach((el) => el.addEventListener("change", draw));
  new ResizeObserver(draw).observe(canvas);
  draw();
}

// ============================================================
// 03 节：八拍节奏谱与线束密率
// ============================================================
export function initRhythmLab() {
  const canvas = document.getElementById("rhythm-canvas");
  const ctx = canvas.getContext("2d");
  const beatBtns = [...document.querySelectorAll("#rhythm-beats .beat")];
  const densityInput = document.getElementById("rhythm-density");
  const densityVal = document.getElementById("rhythm-density-val");
  const presetBtns = [...document.querySelectorAll("[data-rpreset]")];
  const tierEl = document.getElementById("rr-tier");
  const statEl = document.getElementById("rr-stat");
  const textEl = document.getElementById("rr-text");

  // 默认：蓄势一破（前 5 拍静，第 6 拍动，后 2 拍静）
  let beats = [false, false, false, false, false, true, false, false];
  let density = Number(densityInput.value) || 64;

  function syncUI() {
    beatBtns.forEach((btn, i) => {
      const dyn = beats[i];
      btn.classList.toggle("is-dyn", dyn);
      btn.setAttribute("aria-pressed", String(dyn));
      btn.textContent = dyn ? "动" : "静";
    });
    densityVal.textContent = `${density}%`;
    const d = diagnoseRhythm(beats, density);
    tierEl.dataset.kind = d.kind;
    tierEl.textContent = d.tier;
    statEl.textContent = `静拍 ${d.statPct}% · 连续静 ${d.maxRun} 拍 · ${d.speedTier}`;
    textEl.textContent = d.text;
  }

  function draw() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(r.width));
    const h = Math.max(150, Math.round(r.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#010833";
    ctx.fillRect(0, 0, w, h);

    const padX = Math.max(16, w * 0.04);
    const colW = (w - padX * 2) / 8;
    const baseY = h * 0.80;
    const topY = h * 0.16;
    const barH = baseY - topY;

    // 底部水平基准线
    ctx.strokeStyle = "rgba(112, 199, 171, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, baseY + 6);
    ctx.lineTo(w - padX, baseY + 6);
    ctx.stroke();

    const lineLines = 2 + Math.round((density / 100) * 6);
    const streakRatio = 0.45 + (density / 100) * 0.65;

    for (let i = 0; i < 8; i++) {
      const cx = padX + colW * i + colW * 0.5;
      if (!beats[i]) {
        // 静拍：稳固正交薄荷方柱
        const bw = Math.max(12, colW * 0.54);
        const bh = barH * 0.68;
        ctx.fillStyle = "#70C7AB";
        ctx.fillRect(cx - bw * 0.5, baseY - bh, bw, bh);
        // 顶部细微象牙刻度
        ctx.fillStyle = "#EEECE1";
        ctx.fillRect(cx - bw * 0.5, baseY - bh, bw, 3);
      } else {
        // 动拍：斜向高速光束 + 随密度变化的平行加速线束 + 橘红圆心
        ctx.save();
        const x0 = cx - colW * 0.34;
        const y0 = baseY - 2;
        const x1 = cx + colW * 0.48 * streakRatio;
        const y1 = topY + barH * (0.28 - (density / 100) * 0.22);

        // 平行速度细线（线束间距与宽屏按比例舒展，不被主束遮挡）
        const spread = Math.max(6, colW * 0.085) * (0.65 + (1 - density / 100) * 0.65);
        for (let k = 0; k < lineLines; k++) {
          const idxOff = k - (lineLines - 1) / 2;
          const shift = idxOff * spread;
          const lenScale = 0.72 + ((k * 37) % 10) * 0.035;
          ctx.strokeStyle = k === 0 ? "#EB5F33" : k % 2 === 0 ? "#EEECE1" : "#70C7AB";
          ctx.lineWidth = k === 0 ? 2.4 : 1.4;
          ctx.beginPath();
          ctx.moveTo(x0 + shift * 0.75, y0 - Math.abs(idxOff) * 3);
          ctx.lineTo(
            x0 + (x1 - x0) * lenScale + shift * 0.95,
            y0 + (y1 - y0) * lenScale + Math.abs(idxOff) * 2
          );
          ctx.stroke();
        }

        // 象牙斜主束
        ctx.strokeStyle = "#EEECE1";
        ctx.lineWidth = Math.max(4, Math.min(9.5, colW * 0.068));
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();

        // 顶部橘红突破圆点
        ctx.fillStyle = "#EB5F33";
        ctx.beginPath();
        ctx.arc(x1, y1, Math.min(13, colW * 0.16), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 拍号
      ctx.fillStyle = "rgba(148, 228, 202, 0.75)";
      ctx.font = `500 11px "DM Mono", monospace`;
      ctx.textAlign = "center";
      ctx.fillText(`0${i + 1}`, cx, baseY + 22);
    }
  }

  beatBtns.forEach((btn, i) => {
    btn.addEventListener("click", () => {
      beats[i] = !beats[i];
      syncUI();
      draw();
    });
  });

  densityInput.addEventListener("input", () => {
    density = Number(densityInput.value);
    syncUI();
    draw();
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = btn.dataset.rpreset;
      if (p === "burst") {
        beats = [false, false, false, false, false, true, false, false];
        density = 68;
      } else if (p === "still") {
        beats = [false, false, false, false, false, false, false, false];
        density = 30;
      } else {
        beats = [true, true, false, true, true, true, true, false];
        density = 92;
      }
      densityInput.value = String(density);
      syncUI();
      draw();
    });
  });

  new ResizeObserver(draw).observe(canvas);
  syncUI();
  draw();
}

// ============================================================
// 04 节：百年动静之争 · 四幅历史图版对照
// ============================================================
export function initHistoryPlates() {
  const svg = document.getElementById("history-svg");
  const tabs = [...document.querySelectorAll(".era-btn")];
  const gridToggle = document.getElementById("history-grid-toggle");
  const capEl = document.getElementById("history-plate-cap");
  const titleEl = document.getElementById("era-title");
  const bodyEl = document.getElementById("era-body");
  const srcEl = document.getElementById("era-source");

  const ERAS = {
    mondrian: {
      cap: "1920s · NEOPLASTICISM",
      title: "蒙德里安：只用横与竖守住绝对静止",
      body: "皮特·蒙德里安（Piet Mondrian）在荷兰风格派时期确立了「新造型主义（Neoplasticism）」：画面只允许出现 90° 相交的水平与垂直线，拒绝任何斜线与曲线。在他看来，横竖正交代表普遍、永恒、稳固的静态平衡——但也正因为这份极致克制的静，后来的破格斜线才显得格外震撼。",
      source: "核实出处：荷兰风格派（De Stijl）新造型主义档案与 MoMA / Stedelijk 藏品说明。",
      render(showGrid) {
        return `
          <rect width="420" height="340" fill="#040B3D"/>
          <rect x="70" y="30" width="280" height="280" fill="#F0EFE6"/>
          <rect x="70" y="30" width="110" height="120" fill="#EB5F33"/>
          <rect x="278" y="216" width="72" height="94" fill="#70C7AB"/>
          <path d="M180 30 V310 M278 30 V310 M70 150 H350 M70 216 H350" stroke="#020836" stroke-width="7"/>
          ${showGrid ? `<g stroke="#70C7AB" stroke-dasharray="5 4" stroke-width="1.4" opacity="0.9">
            <line x1="210" y1="12" x2="210" y2="328"/><line x1="36" y1="170" x2="384" y2="170"/>
            <text x="218" y="24" fill="#8FE0C5" font-size="11" font-family="DM Mono, monospace">90° ORTHOGONAL</text>
          </g>` : ""}
        `;
      },
    },
    doesburg: {
      cap: "1924–30 · ELEMENTARISM",
      title: "杜斯伯格把线条斜了 45°，风格派因此决裂",
      body: "1924 年起，风格派另一位创始人特奥·凡·杜斯伯格（Theo van Doesburg）在《反构图 V》（阿姆斯特丹市立博物馆藏）与 1929–30 年的《同时反构图》（纽约现代艺术博物馆 MoMA 藏，馆藏号 588.1967）中把内部色块与黑线旋转 45°，提出「要素主义（Elementarism）」。当正交画框保持不动、内部线条斜切而出时，画面立刻爆发出前所未有的现代动势——蒙德里安视其为背叛，两人就此分道扬镳。",
      source: "核实出处：MoMA 藏品《Simultaneous Counter-Composition》（1929–30，馆藏号 588.1967）与 Stedelijk Museum 藏《Counter-Composition V》（1924）。",
      render(showGrid) {
        return `
          <rect width="420" height="340" fill="#040B3D"/>
          <defs><clipPath id="h-clip"><rect x="70" y="30" width="280" height="280"/></clipPath></defs>
          <rect x="70" y="30" width="280" height="280" fill="#F0EFE6"/>
          <g clip-path="url(#h-clip)">
            <g transform="rotate(-45 210 170)">
              <rect x="50" y="30" width="145" height="145" fill="#70C7AB"/>
              <rect x="205" y="185" width="150" height="145" fill="#EB5F33"/>
              <rect x="195" y="-20" width="12" height="380" fill="#020836"/>
              <rect x="10" y="172" width="400" height="12" fill="#020836"/>
              <rect x="275" y="-20" width="10" height="380" fill="#020836"/>
            </g>
          </g>
          <rect x="70" y="30" width="280" height="280" fill="none" stroke="#8FE0C5" stroke-width="2"/>
          ${showGrid ? `<g stroke="#FF7B54" stroke-dasharray="5 4" stroke-width="1.5">
            <rect x="70" y="30" width="280" height="280" fill="none"/>
            <line x1="210" y1="14" x2="210" y2="326" stroke="#8FE0C5"/>
            <line x1="42" y1="170" x2="378" y2="170" stroke="#8FE0C5"/>
            <path d="M210 170 L276 104" stroke="#FF7B54" stroke-width="2.2" stroke-dasharray="none"/>
            <rect x="256" y="72" width="84" height="20" fill="#020836" stroke="#FF7B54" stroke-width="1" stroke-dasharray="none"/>
            <text x="298" y="86" text-anchor="middle" fill="#FF7B54" font-size="11" stroke="none" font-family="DM Mono, monospace">45° BREAK</text>
          </g>` : ""}
        `;
      },
    },
    kandinsky: {
      cap: "1926 · POINT & LINE TO PLANE",
      title: "康定斯基：水平冷静、竖直暖静、斜线生张力",
      body: "1926 年，瓦西里·康定斯基（Wassily Kandinsky）在包豪斯丛书第 9 册《点、线、面》（Punkt und Linie zu Fläche）里系统归纳了线条与「基面」的关系：水平线是「冷的静止」，贴着地面平展；垂直线是「暖的静止」，挺立对抗重力；一旦脱离水平与垂直转为对角线，线条便携带着与画框正交骨架相抗衡的内部张力（Spannung）。",
      source: "核实出处：Wassily Kandinsky, Punkt und Linie zu Fläche, Bauhausbücher 9, 1926。",
      render(showGrid) {
        return `
          <rect width="420" height="340" fill="#040B3D"/>
          <rect x="64" y="34" width="292" height="272" fill="#010833" stroke="#70C7AB" stroke-width="1.5"/>
          <line x1="90" y1="244" x2="330" y2="244" stroke="#70C7AB" stroke-width="5"/>
          <line x1="126" y1="68" x2="126" y2="274" stroke="#EEECE1" stroke-width="4"/>
          <line x1="96" y1="264" x2="320" y2="74" stroke="#EB5F33" stroke-width="6"/>
          <circle cx="320" cy="74" r="14" fill="#EB5F33"/>
          <circle cx="126" cy="244" r="7" fill="#010833" stroke="#EEECE1" stroke-width="3"/>
          <text x="270" y="264" fill="#8FE0C5" font-size="11" font-family="Noto Sans SC, sans-serif">水平 · 冷静</text>
          <text x="136" y="84" fill="#EEECE1" font-size="11" font-family="Noto Sans SC, sans-serif">竖直 · 暖静</text>
          <text x="228" y="132" fill="#FF7B54" font-size="11" font-family="Noto Sans SC, sans-serif">对角 · 张力</text>
          ${showGrid ? `<path d="M64 170 H356 M210 34 V306" stroke="#70C7AB" stroke-dasharray="4 5" stroke-width="1" opacity="0.6"/>` : ""}
        `;
      },
    },
    arnheim: {
      cap: "1954 / 1963 · PERCEPTION & BAUHAUS",
      title: "阿恩海姆与伊顿：动静是一对必须成双的对比",
      body: "心理学家鲁道夫·阿恩海姆（Rudolf Arnheim）在《艺术与视知觉》（加州大学出版社 1954 首版、1974 修订版）中指出：斜向之所以显得充满动势，是因为人眼会自动以画框的横竖「结构骨架」为静止参照，感知到形体偏离平衡的拉力。几乎同一时期，约翰内斯·伊顿（Johannes Itten）在总结魏玛包豪斯基础课的《设计、形态与包豪斯基础课》（1963 德文首版 / 1964 英译 Design and Form）里，正式把「静与动（still–moving）」列为设计师必须成对训练的基础对比。",
      source: "核实出处：Rudolf Arnheim, Art and Visual Perception (UC Press, 1954/1974); Johannes Itten, Mein Vorkurs am Bauhaus (1963) / Design and Form (1964)。",
      render(showGrid) {
        return `
          <rect width="420" height="340" fill="#040B3D"/>
          <rect x="64" y="34" width="292" height="272" fill="#010833" stroke="#3B4C96" stroke-width="1.5"/>
          ${showGrid ? `<g stroke="#70C7AB" stroke-dasharray="4 4" stroke-width="1.2" opacity="0.72">
            <line x1="64" y1="34" x2="356" y2="306"/>
            <line x1="356" y1="34" x2="64" y2="306"/>
            <line x1="210" y1="34" x2="210" y2="306"/>
            <line x1="64" y1="170" x2="356" y2="170"/>
            <circle cx="210" cy="170" r="66" fill="none"/>
          </g>` : ""}
          <rect x="96" y="128" width="84" height="84" fill="#70C7AB" opacity="0.9"/>
          <g transform="translate(268 158) rotate(-32)">
            <rect x="-32" y="-32" width="64" height="64" fill="#EB5F33"/>
          </g>
          <path d="M180 170 H218 M212 164 L220 170 L212 176" stroke="#EEECE1" stroke-width="2" fill="none"/>
          <text x="108" y="232" fill="#8FE0C5" font-size="11" font-family="Noto Sans SC, sans-serif">贴合骨架 · 静</text>
          <text x="234" y="232" fill="#FF7B54" font-size="11" font-family="Noto Sans SC, sans-serif">偏离骨架 · 动</text>
        `;
      },
    },
  };

  let current = "doesburg";
  function render() {
    const era = ERAS[current];
    capEl.textContent = era.cap;
    titleEl.textContent = era.title;
    bodyEl.textContent = era.body;
    srcEl.textContent = era.source;
    svg.innerHTML = era.render(gridToggle.checked);
    tabs.forEach((b) => {
      const on = b.dataset.era === current;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", String(on));
    });
  }

  tabs.forEach((b) => {
    b.addEventListener("click", () => {
      current = b.dataset.era;
      render();
    });
  });
  gridToggle.addEventListener("change", render);
  render();
}

// ============================================================
// 05 节：网页动效预算诊断器（WCAG 2.2.2）
// ============================================================
export function initUiBudgetLab() {
  const mock = document.getElementById("uib-mock");
  const badge = document.getElementById("uib-badge");
  const calmEl = document.getElementById("uib-calm");
  const diagEl = document.getElementById("uib-diag");
  const inputs = {
    ctaHover: document.getElementById("ui-cta"),
    carousel: document.getElementById("ui-carousel"),
    badge: document.getElementById("ui-badge"),
    ticker: document.getElementById("ui-ticker"),
  };

  function update() {
    const flags = {
      ctaHover: inputs.ctaHover.checked,
      carousel: inputs.carousel.checked,
      badge: inputs.badge.checked,
      ticker: inputs.ticker.checked,
    };
    mock.classList.toggle("anim-cta", flags.ctaHover);
    mock.classList.toggle("anim-carousel", flags.carousel);
    mock.classList.toggle("anim-badge", flags.badge);
    mock.classList.toggle("anim-ticker", flags.ticker);

    const res = diagnoseUiBudget(flags);
    badge.dataset.kind = res.kind;
    badge.textContent = res.wcag;
    calmEl.textContent = `${res.calmPct}%`;
    diagEl.textContent = res.text;
  }

  Object.values(inputs).forEach((el) => el.addEventListener("change", update));
  update();
}

// ============================================================
// 06 节：四张夜跑海报练习（单一变量：动静关系）
// ============================================================
export function initQuiz() {
  const cards = [...document.querySelectorAll("#quiz-grid .quiz-card")];
  const vTitle = document.getElementById("qv-title");
  const vText = document.getElementById("qv-text");

  function drawPosters(revealed) {
    // 共同基础：2026 NIGHT RUN，同样的深蓝底、薄荷信息格、暖象牙文字、橘红元素
    const overlay = (label, angleText, color) =>
      revealed
        ? `<g>
            <rect x="8" y="8" width="194" height="264" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="4 3"/>
            <rect x="12" y="244" width="186" height="22" fill="#010833" opacity="0.92"/>
            <text x="105" y="259" text-anchor="middle" fill="${color}" font-size="10.5" font-family="DM Mono, monospace">${angleText}</text>
          </g>`
        : "";

    // A: 全静正交网格，无任何斜冲
    document.getElementById("q-svg-A").innerHTML = `
      <rect width="210" height="280" fill="#020836"/>
      <text x="18" y="42" fill="#F0EFE6" font-size="22" font-weight="900" font-family="Noto Sans SC, sans-serif">城市夜跑</text>
      <text x="18" y="58" fill="#70C7AB" font-size="9.5" letter-spacing="2" font-family="Sora, sans-serif">NIGHT RUN 2026</text>
      <g fill="#70C7AB">
        <rect x="18" y="76" width="52" height="44"/><rect x="78" y="76" width="52" height="44"/><rect x="138" y="76" width="52" height="44"/>
        <rect x="18" y="128" width="52" height="44"/><rect x="78" y="128" width="52" height="44"/><rect x="138" y="128" width="52" height="44"/>
      </g>
      <rect x="18" y="184" width="172" height="16" fill="#EB5F33"/>
      <circle cx="176" cy="192" r="7" fill="#F0EFE6"/>
      <rect x="18" y="214" width="76" height="6" fill="#70C7AB"/><rect x="18" y="226" width="124" height="5" fill="#70C7AB" opacity="0.7"/>
      ${overlay("A", "0° STATIC ONLY", "#F4C453")}
    `;

    // B: 正确——75% 稳定信息格 + 1 条 45° 橘红/象牙冲刺光带突破右上暗场
    document.getElementById("q-svg-B").innerHTML = `
      <rect width="210" height="280" fill="#020836"/>
      <text x="18" y="42" fill="#F0EFE6" font-size="22" font-weight="900" font-family="Noto Sans SC, sans-serif">城市夜跑</text>
      <text x="18" y="58" fill="#70C7AB" font-size="9.5" letter-spacing="2" font-family="Sora, sans-serif">NIGHT RUN 2026</text>
      <g fill="#70C7AB">
        <rect x="18" y="84" width="38" height="38"/><rect x="61" y="84" width="38" height="38"/><rect x="104" y="84" width="38" height="38"/>
        <rect x="18" y="127" width="38" height="38"/><rect x="61" y="127" width="38" height="38"/><rect x="104" y="127" width="38" height="38"/>
        <rect x="18" y="170" width="38" height="38"/><rect x="61" y="170" width="38" height="38"/>
      </g>
      <circle cx="152" cy="192" r="24" fill="none" stroke="#70C7AB" stroke-dasharray="4 4" stroke-width="1.4"/>
      <polygon points="44,202 154,84 176,104 52,208" fill="#F0EFE6"/>
      <line x1="60" y1="214" x2="188" y2="86" stroke="#EB5F33" stroke-width="2.5"/>
      <line x1="94" y1="158" x2="180" y2="72" stroke="#70C7AB" stroke-width="1.3"/>
      <circle cx="166" cy="94" r="22" fill="#76CEB3"/>
      <circle cx="48" cy="204" r="10" fill="#EB5F33"/>
      <rect x="18" y="226" width="90" height="5" fill="#70C7AB" opacity="0.8"/>
      ${overlay("B", "78% STATIC + 45° BREAK", "#70C7AB")}
    `;

    // C: 全动失锚——连标题、方格、文字全部倾斜乱飞（保持文字在画幅内完整可见）
    document.getElementById("q-svg-C").innerHTML = `
      <rect width="210" height="280" fill="#020836"/>
      <g transform="rotate(-18 105 140)">
        <text x="32" y="54" fill="#F0EFE6" font-size="22" font-weight="900" font-family="Noto Sans SC, sans-serif">城市夜跑</text>
        <text x="32" y="70" fill="#70C7AB" font-size="9.5" letter-spacing="2" font-family="Sora, sans-serif">NIGHT RUN 2026</text>
        <rect x="18" y="96" width="44" height="34" fill="#70C7AB" transform="rotate(14 40 113)"/>
        <rect x="78" y="84" width="44" height="34" fill="#EB5F33" transform="rotate(-18 100 101)"/>
        <rect x="136" y="102" width="44" height="34" fill="#70C7AB" transform="rotate(22 158 119)"/>
        <rect x="38" y="148" width="44" height="34" fill="#F0EFE6" transform="rotate(-22 60 165)"/>
        <rect x="108" y="152" width="44" height="34" fill="#70C7AB" transform="rotate(18 130 169)"/>
        <line x1="4" y1="214" x2="206" y2="74" stroke="#EB5F33" stroke-width="3.5"/>
        <line x1="22" y1="48" x2="188" y2="226" stroke="#F0EFE6" stroke-width="2.5"/>
        <circle cx="154" cy="116" r="18" fill="#76CEB3"/>
        <circle cx="54" cy="202" r="11" fill="#EB5F33"/>
        <rect x="30" y="226" width="90" height="5" fill="#70C7AB" opacity="0.8"/>
      </g>
      ${overlay("C", "ALL TILTED · NO ANCHOR", "#FF7B54")}
    `;

    // D: 暧昧 9° 微斜且缩在方格内，没有暗场张力
    document.getElementById("q-svg-D").innerHTML = `
      <rect width="210" height="280" fill="#020836"/>
      <text x="18" y="42" fill="#F0EFE6" font-size="22" font-weight="900" font-family="Noto Sans SC, sans-serif">城市夜跑</text>
      <text x="18" y="58" fill="#70C7AB" font-size="9.5" letter-spacing="2" font-family="Sora, sans-serif">NIGHT RUN 2026</text>
      <g fill="#70C7AB">
        <rect x="18" y="84" width="48" height="38"/><rect x="72" y="84" width="48" height="38"/><rect x="126" y="84" width="48" height="38"/>
        <rect x="18" y="128" width="48" height="38"/><rect x="72" y="128" width="48" height="38"/><rect x="126" y="128" width="48" height="38"/>
        <rect x="18" y="172" width="48" height="38"/><rect x="72" y="172" width="48" height="38"/><rect x="126" y="172" width="48" height="38"/>
      </g>
      <polygon points="56,174 138,160 140,172 58,182" fill="#F0EFE6"/>
      <circle cx="138" cy="166" r="16" fill="#76CEB3" stroke="#020836" stroke-width="2"/>
      <circle cx="58" cy="178" r="8" fill="#EB5F33"/>
      <rect x="18" y="226" width="90" height="5" fill="#70C7AB" opacity="0.8"/>
      ${overlay("D", "9° SHALLOW · TRAPPED", "#F4C453")}
    `;
  }

  cards.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.pick;
      const item = QUIZ_ITEMS[pick];
      cards.forEach((c) => {
        const p = c.dataset.pick;
        c.setAttribute("aria-pressed", String(p === pick));
        c.classList.toggle("is-picked", p === pick);
        c.classList.toggle("is-right", QUIZ_ITEMS[p].correct);
      });
      drawPosters(true);
      vTitle.textContent = item.title;
      vText.textContent = item.text;
    });
  });

  drawPosters(false);
}

// ============================================================
// 07 节：原海报大图查看器（缩放、拖动、Esc 收起）
// ============================================================
export function initPosterViewer() {
  const openBtn = document.getElementById("poster-open");
  const thumb = document.getElementById("poster");
  const dialog = document.getElementById("viewer");
  const scrollBox = document.getElementById("viewer-scroll");
  const img = document.getElementById("viewer-img");
  const zoomOut = document.getElementById("zoom-out");
  const zoomIn = document.getElementById("zoom-in");
  const zoomVal = document.getElementById("zoom-val");
  const closeBtn = document.getElementById("viewer-close");

  let zoom = 1;
  function applyZoom() {
    zoom = Math.max(0.6, Math.min(2.6, Math.round(zoom * 10) / 10));
    const baseW = Math.min(680, window.innerWidth * 0.84);
    img.style.width = `${Math.round(baseW * zoom)}px`;
    zoomVal.textContent = `${Math.round(zoom * 100)}%`;
  }

  openBtn.addEventListener("click", () => {
    // 复用同一张内联 data URI，不重复打包海报
    if (!img.src) img.src = thumb.src;
    zoom = 1;
    applyZoom();
    dialog.showModal();
  });

  closeBtn.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) dialog.close();
  });

  zoomIn.addEventListener("click", () => { zoom += 0.25; applyZoom(); });
  zoomOut.addEventListener("click", () => { zoom -= 0.25; applyZoom(); });

  // 放大后鼠标拖拽平移
  let panning = false, sx = 0, sy = 0, sl = 0, st = 0;
  scrollBox.addEventListener("pointerdown", (e) => {
    panning = true;
    sx = e.clientX;
    sy = e.clientY;
    sl = scrollBox.scrollLeft;
    st = scrollBox.scrollTop;
  });
  window.addEventListener("pointermove", (e) => {
    if (!panning) return;
    scrollBox.scrollLeft = sl - (e.clientX - sx);
    scrollBox.scrollTop = st - (e.clientY - sy);
  });
  window.addEventListener("pointerup", () => { panning = false; });
}

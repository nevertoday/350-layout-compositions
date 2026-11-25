import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  CHUNK_GROUPS,
  PHASES,
  QUIZ_OPTIONS,
  SCENARIOS,
  createBrokenHeroState,
  evaluateChunkLab,
  evaluateHero,
  evaluateOrientation,
  evaluateScaleLab,
  orderedIndices,
} from "./model.js";

// =========================================================================
// 工具：在 2D Canvas 上画原海报风格白色线描图标（无人物五官）
// =========================================================================
function drawNodeIcon(ctx, icon, cx, cy, r, color) {
  ctx.save();
  ctx.translate(cx, cy);
  const s = r * 0.56;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, r * 0.09);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (icon === "bulb") {
    ctx.beginPath();
    ctx.arc(0, -s * 0.18, s * 0.52, Math.PI * 0.78, Math.PI * 2.22);
    ctx.lineTo(s * 0.28, s * 0.48);
    ctx.lineTo(-s * 0.28, s * 0.48);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.24, s * 0.75);
    ctx.lineTo(s * 0.24, s * 0.75);
    ctx.stroke();
  } else if (icon === "pencil") {
    ctx.beginPath();
    ctx.moveTo(-s * 0.58, s * 0.58);
    ctx.lineTo(-s * 0.42, s * 0.12);
    ctx.lineTo(s * 0.34, -s * 0.64);
    ctx.lineTo(s * 0.64, -s * 0.34);
    ctx.lineTo(-s * 0.12, s * 0.42);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.55, s * 0.72);
    ctx.lineTo(s * 0.55, s * 0.72);
    ctx.stroke();
  } else if (icon === "gear") {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.32, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * s * 0.52, Math.sin(a) * s * 0.52);
      ctx.lineTo(Math.cos(a) * s * 0.76, Math.sin(a) * s * 0.76);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.56, 0, Math.PI * 2);
    ctx.stroke();
  } else if (icon === "rocket") {
    ctx.beginPath();
    ctx.moveTo(s * 0.58, -s * 0.58);
    ctx.quadraticCurveTo(s * 0.52, s * 0.12, -s * 0.18, s * 0.48);
    ctx.lineTo(-s * 0.48, s * 0.18);
    ctx.quadraticCurveTo(-s * 0.12, -s * 0.52, s * 0.58, -s * 0.58);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s * 0.12, -s * 0.12, s * 0.14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.36, s * 0.36);
    ctx.lineTo(-s * 0.66, s * 0.66);
    ctx.stroke();
  } else if (icon === "trophy") {
    ctx.beginPath();
    ctx.moveTo(-s * 0.46, -s * 0.55);
    ctx.lineTo(s * 0.46, -s * 0.55);
    ctx.lineTo(s * 0.34, s * 0.06);
    ctx.quadraticCurveTo(0, s * 0.38, -s * 0.34, s * 0.06);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, s * 0.24);
    ctx.lineTo(0, s * 0.66);
    ctx.moveTo(-s * 0.36, s * 0.66);
    ctx.lineTo(s * 0.36, s * 0.66);
    ctx.stroke();
  } else if (icon === "search") {
    ctx.beginPath();
    ctx.arc(-s * 0.14, -s * 0.14, s * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.18, s * 0.18);
    ctx.lineTo(s * 0.62, s * 0.62);
    ctx.stroke();
  } else if (icon === "layers") {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.55);
    ctx.lineTo(s * 0.62, -s * 0.18);
    ctx.lineTo(0, s * 0.18);
    ctx.lineTo(-s * 0.62, -s * 0.18);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.58, s * 0.22);
    ctx.lineTo(0, s * 0.56);
    ctx.lineTo(s * 0.58, s * 0.22);
    ctx.stroke();
  } else if (icon === "flag") {
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, -s * 0.62);
    ctx.lineTo(-s * 0.4, s * 0.68);
    ctx.moveTo(-s * 0.4, -s * 0.54);
    ctx.lineTo(s * 0.52, -s * 0.24);
    ctx.lineTo(-s * 0.4, s * 0.08);
    ctx.stroke();
  } else if (icon === "check") {
    ctx.beginPath();
    ctx.moveTo(-s * 0.52, s * 0.04);
    ctx.lineTo(-s * 0.12, s * 0.46);
    ctx.lineTo(s * 0.56, -s * 0.42);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// =========================================================================
// HERO：活体时间轴编排台
// =========================================================================
const heroState = createBrokenHeroState();
const heroCanvas = document.getElementById("hero-spine-canvas");
const heroCtx = heroCanvas.getContext("2d");
const cardsListEl = document.getElementById("station-cards");
const phaseRibbonEl = document.getElementById("phase-ribbon");

let heroW = 900;
let heroH = 124;
let heroDpr = 1;
let evalResult = evaluateHero(heroState, heroW);
let displayXs = [...evalResult.xs];
let reveal = reducedMotion.matches ? 1 : 0;
let heroDirty = true;
let isScrubbing = false;
let lastRenderedDay = -1;
let lastRenderedActive = -1;

function syncHeroCanvasSize() {
  const rect = heroCanvas.getBoundingClientRect();
  const w = Math.max(260, Math.round(rect.width));
  const h = Math.max(96, Math.round(rect.height));
  const dpr = pixelRatio(2);
  if (w !== heroW || h !== heroH || dpr !== heroDpr) {
    heroW = w;
    heroH = h;
    heroDpr = dpr;
    heroCanvas.width = Math.round(w * dpr);
    heroCanvas.height = Math.round(h * dpr);
    heroDirty = true;
  }
}

function renderStationCards(ev) {
  const n = ev.items.length;
  cardsListEl.style.setProperty("--cols", String(n));
  cardsListEl.classList.toggle("is-dense", n >= 9);

  const invSet = new Set();
  for (const r of ev.reversals) {
    invSet.add(r.fromSlot);
    invSet.add(r.toSlot);
  }

  cardsListEl.innerHTML = "";
  ev.items.forEach((item, slot) => {
    const li = document.createElement("li");
    li.className = "station-card";
    const isSelected = heroState.selectedSlot === slot;
    const isActive = heroState.focusMode === "on" && slot === ev.activeSlot;
    const isDone = heroState.focusMode === "on" && slot < ev.activeSlot && ev.inversions === 0;
    const isFuture = heroState.focusMode === "on" && slot > ev.activeSlot && ev.inversions === 0;
    const isInv = invSet.has(slot);

    if (isSelected) li.classList.add("is-selected");
    if (isActive) {
      li.classList.add("is-active-step");
      li.setAttribute("aria-current", "step");
    }
    if (isInv) li.classList.add("is-inverted");
    if (isFuture) li.classList.add("is-future");

    const stateLabel = isInv
      ? "顺序错位"
      : heroState.focusMode === "off"
        ? "平权无焦"
        : isActive
          ? "当前推进"
          : isDone
            ? "已完成"
            : "待启动";
    const stateCls = isInv
      ? "is-err"
      : isActive
        ? "is-active"
        : isDone
          ? "is-done"
          : "";

    li.innerHTML = `
      <button type="button" class="sc-main-btn" data-slot="${slot}" aria-label="${item.num} ${item.stage}，${item.dateLabel}，点击选中或与另一张互换顺序">
        <div class="sc-head" style="background:${item.cardHeadBg};color:${item.cardHeadInk}">
          <div class="sc-head-top">
            <span class="sc-title">${item.num} ${item.stage}</span>
            <span class="sc-day">${item.dateLabel}</span>
          </div>
          <span class="sc-sub">${item.subtitle}</span>
        </div>
        <div class="sc-body-wrap">
          <span class="sc-rule" aria-hidden="true"></span>
          <p class="sc-body">${item.body}</p>
        </div>
      </button>
      <div class="sc-foot">
        <span class="sc-state-tag ${stateCls}">${stateLabel}</span>
        <div class="sc-move-btns">
          <button type="button" class="sc-move-btn" data-move="-1" data-slot="${slot}" aria-label="将 ${item.num} ${item.stage} 左移一位" ${slot === 0 ? "disabled" : ""}>←</button>
          <button type="button" class="sc-move-btn" data-move="1" data-slot="${slot}" aria-label="将 ${item.num} ${item.stage} 右移一位" ${slot === n - 1 ? "disabled" : ""}>→</button>
        </div>
      </div>
    `;
    cardsListEl.append(li);
  });
}

function renderPhaseRibbon(ev) {
  if (!heroState.phaseBar) {
    phaseRibbonEl.className = "phase-ribbon is-off";
    phaseRibbonEl.textContent = "宏阶段归组带已关闭（当前 5 站平铺，打开后收束为「准备 → 实施 → 收尾」3 组记忆块）";
    return;
  }
  phaseRibbonEl.className = "phase-ribbon";
  // 按当前槽位分组（如果乱序导致阶段交错，诚实渲染出撕裂段并告警！）
  const runs = [];
  for (const item of ev.items) {
    const last = runs[runs.length - 1];
    if (last && last.phase === item.phase) {
      last.count++;
    } else {
      runs.push({ phase: item.phase, count: 1 });
    }
  }
  const torn = ev.phaseBreaks > 0;
  phaseRibbonEl.innerHTML = runs
    .map((run, idx) => {
      const p = PHASES[run.phase];
      const arrow = idx < runs.length - 1 ? `<span class="phase-connector" aria-hidden="true">→</span>` : "";
      return `<div class="phase-pill-seg ${torn ? "is-torn" : ""}" style="flex:${run.count};background:${p.color};color:${p.ink}"><span class="phase-dot" aria-hidden="true"></span><span>${p.name}${torn ? "（交错）" : ""}</span></div>${arrow}`;
    })
    .join("");
}

function renderHeroTelemetry(ev) {
  // 1. 顶眉与时钟圆环进度
  const mastScore = document.getElementById("masthead-score");
  mastScore.textContent = ev.score === 4 ? "4 / 4 已理顺" : `${ev.score} / 4 待理顺`;
  mastScore.className = `score-pill ${ev.score === 4 ? "is-pass" : ev.score >= 2 ? "is-warn" : "is-error"}`;

  const ring = document.getElementById("clock-progress-ring");
  if (ring) {
    ring.setAttribute("stroke-dashoffset", String(Math.round(220 * (1 - ev.score / 4))));
  }

  // 2. 标题旁 5 点缩微示范条同步主舞台状态
  const miniRail = document.getElementById("mini-title-rail");
  if (miniRail) {
    miniRail.classList.toggle("is-broken", heroState.spineMode === "broken");
    const dots = miniRail.querySelectorAll(".mini-node");
    const mappedIdx = Math.round((ev.activeSlot / Math.max(1, ev.items.length - 1)) * (dots.length - 1));
    dots.forEach((d, i) => {
      d.classList.toggle("is-active", heroState.focusMode === "on" && i === mappedIdx);
      d.classList.toggle("is-err", ev.inversions > 0 && (i === 1 || i === 3));
    });
  }

  // 3. 右上编年读数戳
  const activeItem = ev.items[ev.activeSlot];
  document.getElementById("stamp-day").textContent = `第 ${ev.scrubDay} 天`;
  document.getElementById("stamp-station").textContent = `${activeItem.num} ${activeItem.stage}`;
  const orderEl = document.getElementById("stamp-order");
  orderEl.textContent = ev.inversions > 0 ? `逆序 ${ev.inversions} 处` : "顺向 0 逆序";
  orderEl.className = `stamp-v ${ev.inversions > 0 ? "is-err" : "is-ok"}`;

  const scaleNames = { clustered: "日期挤堆", even: "节奏均分", "broken-axis": "断轴压缩" };
  document.getElementById("stage-meta-pill").textContent = `${ev.items.length} 站 · ${scaleNames[heroState.scaleMode]}`;

  // 4. 原海报 5 枚椭圆关键词胶囊
  document.querySelectorAll("#hero-kw-pills .kw-pill").forEach((el) => {
    el.classList.toggle("is-ok", Boolean(ev.keywords[el.dataset.kw]));
  });

  // 5. 白话诊单
  const diagBadge = document.getElementById("diag-badge");
  diagBadge.textContent = ev.diagnosis.badge;
  diagBadge.className = `diag-badge ${ev.diagnosis.level === "pass" ? "is-pass" : ev.diagnosis.level === "warn" ? "is-warn" : "is-error"}`;
  document.getElementById("diag-gap-stat").textContent = `最小净距 ${ev.minGapPct.toFixed(0)}% · 撞车 ${ev.collisions} 处`;
  document.getElementById("diag-headline").textContent = ev.diagnosis.headline;
  document.getElementById("diag-detail").textContent = ev.diagnosis.detail;
  const actEl = document.getElementById("diag-action");
  actEl.textContent = ev.diagnosis.action;
  actEl.classList.toggle("is-pass", ev.diagnosis.level === "pass");

  // 6. 四柱检核芯片
  document.querySelectorAll("#pillar-strip .pillar-chip").forEach((chip) => {
    const key = chip.dataset.pillar;
    const info = ev.pillars[key];
    chip.classList.toggle("is-ok", info.ok);
    chip.querySelector(".pillar-val").textContent = info.tag;
  });

  // 7. 操控按钮状态
  document.querySelectorAll("[data-ctrl]").forEach((btn) => {
    const k = btn.dataset.ctrl;
    const v = k === "granularity" ? Number(btn.dataset.val) : btn.dataset.val;
    btn.classList.toggle("is-active", heroState[k] === v);
  });
  const btnFocus = document.getElementById("btn-focus");
  btnFocus.setAttribute("aria-pressed", String(heroState.focusMode === "on"));
  btnFocus.textContent = heroState.focusMode === "on" ? "进度焦标：开" : "进度焦标：关";

  const btnPhase = document.getElementById("btn-phase");
  btnPhase.setAttribute("aria-pressed", String(heroState.phaseBar));
  btnPhase.textContent = heroState.phaseBar ? "三段阶段带：开" : "三段阶段带：关";

  // 8. 同步无障碍 slider 值
  heroCanvas.setAttribute("aria-valuenow", String(ev.scrubDay));
  heroCanvas.setAttribute("aria-valuetext", `第 ${ev.scrubDay} 天，靠近 ${activeItem.num} ${activeItem.stage}`);
}

function updateHero(fullDom = true) {
  evalResult = evaluateHero(heroState, heroW);
  if (displayXs.length !== evalResult.xs.length) {
    displayXs = [...evalResult.xs];
  }
  if (fullDom) {
    renderStationCards(evalResult);
    renderPhaseRibbon(evalResult);
    renderHeroTelemetry(evalResult);
    lastRenderedDay = evalResult.scrubDay;
    lastRenderedActive = evalResult.activeSlot;
  } else {
    // 高频拖拽时仅当天数或活跃站真正改变才更新轻量 DOM，守住 60fps
    if (evalResult.scrubDay !== lastRenderedDay || evalResult.activeSlot !== lastRenderedActive) {
      lastRenderedDay = evalResult.scrubDay;
      lastRenderedActive = evalResult.activeSlot;
      const activeItem = evalResult.items[evalResult.activeSlot];
      document.getElementById("stamp-day").textContent = `第 ${evalResult.scrubDay} 天`;
      document.getElementById("stamp-station").textContent = `${activeItem.num} ${activeItem.stage}`;
      heroCanvas.setAttribute("aria-valuenow", String(evalResult.scrubDay));
      heroCanvas.setAttribute("aria-valuetext", `第 ${evalResult.scrubDay} 天，靠近 ${activeItem.num} ${activeItem.stage}`);
      if (heroState.focusMode === "on") {
        renderStationCards(evalResult);
        renderHeroTelemetry(evalResult);
      }
    }
  }
  heroDirty = true;
}

// 2D Canvas 主轴绘制（单一真源坐标 displayXs，复刻 277 原海报主轴美学）
function drawHeroSpine(t, dt, { still }) {
  syncHeroCanvasSize();
  if (still) {
    reveal = 1;
    displayXs = [...evalResult.xs];
  } else if (reveal < 1) {
    reveal = Math.min(1, reveal + (dt || 0.016) * 1.15);
    heroDirty = true;
  }

  // 节点水平坐标平滑过渡（切换刻度模式时节点真正滑行！）
  let moving = false;
  const lerpK = still ? 1 : Math.min(1, (dt || 0.016) * 11);
  for (let i = 0; i < evalResult.xs.length; i++) {
    const diff = evalResult.xs[i] - (displayXs[i] ?? evalResult.xs[i]);
    if (Math.abs(diff) > 0.0008) {
      displayXs[i] = (displayXs[i] ?? evalResult.xs[i]) + diff * lerpK;
      moving = true;
    } else {
      displayXs[i] = evalResult.xs[i];
    }
  }

  const animateChevron = !still && heroState.spineMode === "directed" && evalResult.inversions === 0;
  if (!heroDirty && !moving && !isScrubbing && !animateChevron && reveal >= 1) return;
  heroDirty = false;

  const ctx = heroCtx;
  const w = heroW;
  const h = heroH;
  ctx.save();
  ctx.scale(heroDpr, heroDpr);
  ctx.clearRect(0, 0, w, h);

  const compact = w < 520;
  const padL = compact ? 38 : 66;
  const padR = compact ? 34 : 62;
  const trackW = Math.max(120, w - padL - padR);
  const railY = Math.round(h * 0.56);
  const nodeR = compact ? (evalResult.items.length >= 9 ? 13 : 17) : (evalResult.items.length >= 9 ? 16 : 23);

  const easeReveal = 1 - Math.pow(1 - reveal, 3);
  const posX = (nx) => padL + nx * trackW;

  // 1. 顶部时间刻度尺底纹（暴露日期跨度与空洞）
  ctx.save();
  ctx.strokeStyle = "#E8CEBD";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, 20);
  ctx.lineTo(padL + trackW, 20);
  ctx.stroke();

  const tickCount = compact ? 4 : 6;
  ctx.fillStyle = "#7D5B52";
  ctx.font = `700 ${compact ? 10 : 11}px "Archivo", "Noto Sans SC", sans-serif`;
  ctx.textAlign = "center";
  for (let i = 0; i <= tickCount; i++) {
    const tx = padL + (i / tickCount) * trackW;
    ctx.beginPath();
    ctx.moveTo(tx, 16);
    ctx.lineTo(tx, 23);
    ctx.stroke();
  }
  ctx.restore();

  // 2. 起点播放帽 ▶ 与终点箭头 ►（仅在有向主轴模式下出现！）
  if (heroState.spineMode === "directed") {
    const startX = padL - (compact ? 22 : 38);
    const capR = compact ? 10 : 13;
    ctx.fillStyle = "#A11B24";
    ctx.beginPath();
    ctx.arc(startX, railY, capR * easeReveal, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FDF3E7";
    ctx.beginPath();
    ctx.moveTo(startX - capR * 0.25, railY - capR * 0.42);
    ctx.lineTo(startX + capR * 0.48, railY);
    ctx.lineTo(startX - capR * 0.25, railY + capR * 0.42);
    ctx.closePath();
    ctx.fill();

    // 终点实心箭头 ►
    const endX = padL + trackW + (compact ? 22 : 38);
    ctx.strokeStyle = "#A11B24";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(padL + trackW, railY);
    ctx.lineTo(endX - 11, railY);
    ctx.stroke();

    ctx.fillStyle = "#A11B24";
    ctx.beginPath();
    ctx.moveTo(endX, railY);
    ctx.lineTo(endX - 13, railY - 8);
    ctx.lineTo(endX - 13, railY + 8);
    ctx.closePath();
    ctx.fill();
  }

  // 3. 主轴连线（断链 / 无向实线 / 有向进度轴）
  const playX = posX(heroState.playhead);
  if (heroState.spineMode === "broken") {
    // 断链虚空提示：各站之间只留极淡断口标记
    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "rgba(180, 90, 80, 0.35)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < displayXs.length - 1; i++) {
      const x0 = posX(displayXs[i]) + nodeR + 6;
      const x1 = posX(displayXs[i + 1]) - nodeR - 6;
      if (x1 > x0 + 10) {
        const mid = (x0 + x1) / 2;
        ctx.beginPath();
        ctx.moveTo(mid - 7, railY - 5);
        ctx.lineTo(mid - 2, railY + 5);
        ctx.moveTo(mid + 2, railY - 5);
        ctx.lineTo(mid + 7, railY + 5);
        ctx.stroke();
      }
    }
    ctx.restore();
  } else {
    const startLineX = heroState.spineMode === "directed" ? padL - (compact ? 12 : 25) : padL;
    const drawEndX = startLineX + (padL + trackW - startLineX) * easeReveal;

    // 底轨
    ctx.strokeStyle = heroState.focusMode === "on" ? "#E8C3B0" : "#A11B24";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(startLineX, railY);
    ctx.lineTo(drawEndX, railY);
    ctx.stroke();

    // 已推进深漆红高亮轨
    if (heroState.focusMode === "on") {
      ctx.strokeStyle = "#A11B24";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(startLineX, railY);
      ctx.lineTo(Math.min(drawEndX, playX), railY);
      ctx.stroke();
    }

    // 断轴压缩 // 符号（当 scaleMode === "broken-axis" 且确实折叠了长空白时）
    if (evalResult.hasBreak && evalResult.breakGap) {
      const bx0 = posX(displayXs[evalResult.breakGap.leftIdx]);
      const bx1 = posX(displayXs[evalResult.breakGap.rightIdx]);
      const bMid = (bx0 + bx1) / 2;
      ctx.save();
      ctx.fillStyle = "#FDF3E7";
      ctx.fillRect(bMid - 12, railY - 11, 24, 22);
      ctx.strokeStyle = "#A11B24";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(bMid - 7, railY + 9);
      ctx.lineTo(bMid - 1, railY - 9);
      ctx.moveTo(bMid + 1, railY + 9);
      ctx.lineTo(bMid + 7, railY - 9);
      ctx.stroke();
      ctx.fillStyle = "#78000F";
      ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`省略 ${evalResult.breakGap.daysSkipped} 天`, bMid, railY + 23);
      ctx.restore();
    }

    // 原海报标志性三重 >>> 推进符（仅在有向主轴模式下）
    if (heroState.spineMode === "directed") {
      const pulse = still ? 0 : (t * 1.4) % 1;
      for (let i = 0; i < displayXs.length - 1; i++) {
        if (evalResult.hasBreak && evalResult.breakGap && i === evalResult.breakGap.leftIdx) continue;
        const x0 = posX(displayXs[i]) + nodeR + 8;
        const x1 = posX(displayXs[i + 1]) - nodeR - 8;
        if (x1 - x0 < 24) continue;
        const mid = (x0 + x1) / 2;
        ctx.save();
        ctx.lineWidth = 1.7;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let k = -1; k <= 1; k++) {
          const cx = mid + k * 7;
          const phase = (pulse - (k + 1) * 0.22 + 1) % 1;
          const alpha = evalResult.inversions === 0 ? 0.35 + 0.65 * Math.max(0, 1 - Math.abs(phase - 0.5) * 3) : 0.35;
          ctx.strokeStyle = `rgba(198, 76, 53, ${alpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.moveTo(cx - 2.5, railY - 12);
          ctx.lineTo(cx + 2.5, railY - 8);
          ctx.lineTo(cx - 2.5, railY - 4);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  // 4. 挤堆碰撞红框提示（当真实日期模式发生节点撞车时）
  if (evalResult.collisions > 0) {
    for (const [a, b] of evalResult.collidedPairs) {
      const xa = posX(displayXs[a]);
      const xb = posX(displayXs[b]);
      ctx.save();
      ctx.strokeStyle = "rgba(185, 28, 28, 0.72)";
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(xa - nodeR - 3, railY - nodeR - 3, xb - xa + nodeR * 2 + 6, nodeR * 2 + 6);
      ctx.restore();
    }
    // 右侧荒原警示标尺
    if (evalResult.maxGapPct >= 50) {
      const lx = posX(displayXs[displayXs.length - 2]) + nodeR + 10;
      const rx = posX(displayXs[displayXs.length - 1]) - nodeR - 10;
      if (rx - lx > 80) {
        const mx = (lx + rx) / 2;
        ctx.save();
        ctx.fillStyle = "#9F1820";
        ctx.font = `700 ${compact ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(`长空白荒原 ${evalResult.maxGapPct.toFixed(0)}%`, mx, railY - 14);
        ctx.restore();
      }
    }
  }

  // 5. 逆序时间倒流折返弧（一目了然指出哪里时间倒流！）
  if (evalResult.reversals.length > 0) {
    for (const rev of evalResult.reversals) {
      const xFrom = posX(displayXs[rev.fromSlot]);
      const xTo = posX(displayXs[rev.toSlot]);
      const midX = (xFrom + xTo) / 2;
      const arcTopY = 12;
      ctx.save();
      ctx.strokeStyle = "#B8141E";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(xFrom, railY - nodeR - 2);
      ctx.quadraticCurveTo(midX, arcTopY, xTo, railY - nodeR - 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // 指向左方的倒流小箭头
      ctx.fillStyle = "#B8141E";
      ctx.beginPath();
      ctx.moveTo(midX - 6, arcTopY + 12);
      ctx.lineTo(midX + 3, arcTopY + 7);
      ctx.lineTo(midX + 3, arcTopY + 17);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // 顶部居中醒目倒流标签
    const r0 = evalResult.reversals[0];
    const lblX = (posX(displayXs[r0.fromSlot]) + posX(displayXs[r0.toSlot])) / 2;
    const clampedX = Math.max(76, Math.min(w - 76, lblX));
    ctx.save();
    const txt = `← 倒流 -${evalResult.totalBackDays}天`;
    ctx.font = `700 11px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(txt).width + 16;
    ctx.fillStyle = "#9F1820";
    ctx.beginPath();
    ctx.roundRect(clampedX - tw / 2, 3, tw, 20, 10);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(txt, clampedX, 13);
    ctx.restore();
  }

  // 6. 圆形里程碑徽章 + 垂直挂针（精准对齐到卡片上方）
  const invSlots = new Set();
  for (const r of evalResult.reversals) {
    invSlots.add(r.fromSlot);
    invSlots.add(r.toSlot);
  }

  evalResult.items.forEach((item, idx) => {
    const cx = posX(displayXs[idx]);
    const isActive = heroState.focusMode === "on" && idx === evalResult.activeSlot;
    const isFuture = heroState.focusMode === "on" && idx > evalResult.activeSlot && evalResult.inversions === 0;
    const isInv = invSlots.has(idx);
    const localScale = Math.min(1, Math.max(0.2, easeReveal * 1.15 - idx * 0.04));
    const r = nodeR * localScale;

    // 垂针与落点小圆（复刻原海报）
    ctx.strokeStyle = isFuture ? "#D8B9A6" : item.medallionBg;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx, railY + r);
    ctx.lineTo(cx, h - 7);
    ctx.stroke();

    ctx.fillStyle = isFuture ? "#D8B9A6" : item.medallionBg;
    ctx.beginPath();
    ctx.arc(cx, h - 7, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // 当前聚焦外环
    if (isActive) {
      ctx.save();
      ctx.strokeStyle = "#78000F";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, railY, r + 5.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 主圆徽
    ctx.save();
    ctx.fillStyle = isFuture ? "#EBD8C8" : item.medallionBg;
    ctx.strokeStyle = isInv ? "#78000F" : "#FDF3E7";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, railY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 徽章线描图标
    const icoColor = isFuture ? "#6A4B44" : "#FFFFFF";
    drawNodeIcon(ctx, item.icon, cx, railY, r, icoColor);

    // 底部小日期标（带浅纸底罩，不与垂针穿线打架）
    if (!compact || evalResult.items.length <= 5) {
      const dTxt = `D${item.day}`;
      ctx.font = `700 10.5px "Archivo", "Noto Sans SC", sans-serif`;
      const dtw = ctx.measureText(dTxt).width + 8;
      const dy = railY + r + 11;
      ctx.fillStyle = "#FDF3E7";
      ctx.beginPath();
      ctx.roundRect(cx - dtw / 2, dy - 6.5, dtw, 13, 5);
      ctx.fill();
      ctx.fillStyle = isInv ? "#9F1820" : "#5F423C";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(dTxt, cx, dy);
    }
    ctx.restore();
  });

  // 7. 顶沿可拖拽编年游标（Crimson Playhead Scrubber，手绘三角图标避免缺字）
  ctx.save();
  ctx.strokeStyle = "rgba(120, 0, 15, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(playX, 24);
  ctx.lineTo(playX, h - 4);
  ctx.stroke();
  ctx.setLineDash([]);

  const pLabel = `D${evalResult.scrubDay}`;
  ctx.font = `700 11px "Archivo", "Noto Sans SC", sans-serif`;
  const pw = Math.max(50, ctx.measureText(pLabel).width + 24);
  const clampedPX = Math.max(pw / 2 + 4, Math.min(w - pw / 2 - 4, playX));
  ctx.fillStyle = "#78000F";
  ctx.beginPath();
  ctx.roundRect(clampedPX - pw / 2, 24, pw, 20, 10);
  ctx.fill();
  // 矢量小三角
  const triX = clampedPX - pw / 2 + 9;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(triX, 30.5);
  ctx.lineTo(triX + 5.5, 34);
  ctx.lineTo(triX, 37.5);
  ctx.closePath();
  ctx.fill();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(pLabel, triX + 9, 34.5);
  ctx.restore();

  ctx.restore();
}

// 绑定主轴拖动（同时兼容鼠标 Pointer 与触屏 Touch，保证 perf.mjs 的 touchMove 帧帧重画！）
function setPlayheadFromClientX(clientX) {
  const rect = heroCanvas.getBoundingClientRect();
  const compact = rect.width < 520;
  const padL = compact ? 38 : 66;
  const padR = compact ? 34 : 62;
  const trackW = Math.max(120, rect.width - padL - padR);
  const nx = (clientX - rect.left - padL) / trackW;
  heroState.playhead = Math.max(0, Math.min(1, nx));
  updateHero(false);
}

heroCanvas.addEventListener("pointerdown", (e) => {
  isScrubbing = true;
  heroCanvas.setPointerCapture?.(e.pointerId);
  setPlayheadFromClientX(e.clientX);
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!isScrubbing) return;
  setPlayheadFromClientX(e.clientX);
});

const stopScrub = () => {
  if (!isScrubbing) return;
  isScrubbing = false;
  updateHero(true);
};
heroCanvas.addEventListener("pointerup", stopScrub);
heroCanvas.addEventListener("pointercancel", stopScrub);

// 触屏补强（不阻断纵向滚屏，只在横向拖游标时实时响应）
let touchStartX = 0;
let touchStartY = 0;
let touchLockedH = false;
heroCanvas.addEventListener(
  "touchstart",
  (e) => {
    if (!e.touches.length) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchLockedH = false;
    isScrubbing = true;
    setPlayheadFromClientX(touchStartX);
  },
  { passive: true }
);
heroCanvas.addEventListener(
  "touchmove",
  (e) => {
    if (!e.touches.length) return;
    const tx = e.touches[0].clientX;
    const ty = e.touches[0].clientY;
    if (!touchLockedH) {
      if (Math.abs(tx - touchStartX) > Math.abs(ty - touchStartY) + 3) {
        touchLockedH = true;
      } else if (Math.abs(ty - touchStartY) > 10) {
        isScrubbing = false;
        return;
      }
    }
    if (touchLockedH) {
      e.preventDefault();
      isScrubbing = true;
      setPlayheadFromClientX(tx);
    }
  },
  { passive: false }
);
heroCanvas.addEventListener("touchend", stopScrub, { passive: true });
heroCanvas.addEventListener("touchcancel", stopScrub, { passive: true });

// 键盘操作主轴游标
heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    heroState.playhead = Math.min(1, heroState.playhead + 0.08);
    updateHero(true);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    heroState.playhead = Math.max(0, heroState.playhead - 0.08);
    updateHero(true);
  }
});

// 卡片互换与左右移位事件委托
cardsListEl.addEventListener("click", (e) => {
  const moveBtn = e.target.closest(".sc-move-btn");
  if (moveBtn) {
    const slot = Number(moveBtn.dataset.slot);
    const dir = Number(moveBtn.dataset.move);
    const target = slot + dir;
    if (target >= 0 && target < heroState.order.length) {
      const next = [...heroState.order];
      [next[slot], next[target]] = [next[target], next[slot]];
      heroState.order = next;
      heroState.selectedSlot = -1;
      updateHero(true);
    }
    return;
  }

  const cardBtn = e.target.closest(".sc-main-btn");
  if (cardBtn) {
    const slot = Number(cardBtn.dataset.slot);
    if (heroState.selectedSlot === -1) {
      heroState.selectedSlot = slot;
      // 同步把游标轻吸到所选站，方便查看
      heroState.playhead = evalResult.xs[slot] ?? heroState.playhead;
      updateHero(true);
    } else if (heroState.selectedSlot === slot) {
      heroState.selectedSlot = -1;
      updateHero(true);
    } else {
      const next = [...heroState.order];
      [next[heroState.selectedSlot], next[slot]] = [next[slot], next[heroState.selectedSlot]];
      heroState.order = next;
      heroState.selectedSlot = -1;
      updateHero(true);
    }
  }
});

// 操控台按钮绑定
document.querySelectorAll("[data-ctrl]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.ctrl;
    const v = k === "granularity" ? Number(btn.dataset.val) : btn.dataset.val;
    if (k === "granularity") {
      heroState.granularity = v;
      heroState.order = v === 5 ? [...orderedIndices(5)] : orderedIndices(v);
      heroState.selectedSlot = -1;
    } else {
      heroState[k] = v;
    }
    updateHero(true);
  });
});

document.getElementById("btn-focus").addEventListener("click", () => {
  heroState.focusMode = heroState.focusMode === "on" ? "off" : "on";
  updateHero(true);
});

document.getElementById("btn-phase").addEventListener("click", () => {
  heroState.phaseBar = !heroState.phaseBar;
  updateHero(true);
});

document.getElementById("btn-fix-order").addEventListener("click", () => {
  heroState.order = orderedIndices(heroState.order.length);
  heroState.selectedSlot = -1;
  updateHero(true);
});

document.getElementById("btn-reset-broken").addEventListener("click", () => {
  Object.assign(heroState, createBrokenHeroState());
  updateHero(true);
});

// 初始化 Hero 与循环
syncHeroCanvasSize();
updateHero(true);
const heroLoop = loop(heroCanvas, drawHeroSpine);
heroLoop.draw();
window.addEventListener("resize", () => {
  syncHeroCanvasSize();
  updateHero(true);
  heroLoop.draw();
});

// =========================================================================
// 01 节：四层结构解剖透视台
// =========================================================================
const anatomyState = { axis: true, nodes: true, phases: true, gradient: true };
const anatomySvg = document.getElementById("anatomy-svg");
const anatomyReadout = document.getElementById("anatomy-readout");

function renderAnatomy() {
  document.getElementById("an-layer-axis").classList.toggle("is-hidden", !anatomyState.axis);
  document.getElementById("an-layer-nodes").classList.toggle("is-hidden", !anatomyState.nodes);
  document.getElementById("an-layer-phases").classList.toggle("is-hidden", !anatomyState.phases);

  const origMeds = ["#A11B24", "#DF4E42", "#E87C63", "#EE9E74", "#A81B1E"];
  const origHeads = ["#9F1820", "#C83632", "#EA8469", "#F2AE83", "#A4191D"];
  const origInks = ["#FFFFFF", "#FFFFFF", "#3A080C", "#3A080C", "#FFFFFF"];
  const origBars = ["#A11B24", "#C64C35", "#A81B1E"];

  anatomySvg.querySelectorAll(".an-node").forEach((g, i) => {
    g.querySelector(".an-med").setAttribute("fill", anatomyState.gradient ? origMeds[i] : "#6E5D59");
    g.querySelector(".an-head").setAttribute("fill", anatomyState.gradient ? origHeads[i] : "#6E5D59");
    g.querySelector(".an-htxt").setAttribute("fill", anatomyState.gradient ? origInks[i] : "#FFFFFF");
    const mtxt = g.querySelector(".an-mtxt");
    if (mtxt) mtxt.setAttribute("fill", anatomyState.gradient ? origInks[i] : "#FFFFFF");
  });
  anatomySvg.querySelectorAll(".an-pbar").forEach((bar, i) => {
    bar.setAttribute("fill", anatomyState.gradient ? origBars[i] : "#6E5D59");
  });

  const missing = [];
  if (!anatomyState.axis) missing.push("缺少「方向主轴」：五张卡片悬空脱节，眼球只能当普通横排卡片墙看");
  if (!anatomyState.nodes) missing.push("缺少「里程碑节点」：只剩一条空线，看不出每个关键拐点发生了什么");
  if (!anatomyState.phases) missing.push("缺少「阶段归组带」：失去准备/实施/收尾的二次分块，长流程扫描变慢");
  if (!anatomyState.gradient) missing.push("抽掉「红杏递进色」：五站陷入灰调平权，失去了原海报冷暖过渡的演进节奏感");

  anatomyReadout.textContent = missing.length
    ? missing.join("；") + "。"
    : "四层齐备：主轴给方向、圆徽标关键节点、红杏渐进色暗示推进温度、底部三段把 5 站收束为 3 个阶段块。试着关掉其中任意一层。";
}

document.querySelectorAll(".layer-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.layer;
    anatomyState[key] = !anatomyState[key];
    btn.classList.toggle("is-on", anatomyState[key]);
    btn.setAttribute("aria-pressed", String(anatomyState[key]));
    renderAnatomy();
  });
});
renderAnatomy();

// =========================================================================
// 02 节：刻度与节奏 2D Canvas 变形台
// =========================================================================
const scaleCanvas = document.getElementById("scale-lab-canvas");
const scaleCtx = scaleCanvas.getContext("2d");
const scaleRange = document.getElementById("scale-blend-range");
const scaleBreakBtn = document.getElementById("scale-break-btn");

let scaleBlend = 0;
let scaleAxisBreak = false;
let scaleW = 700;
let scaleH = 176;
let scaleDpr = 1;
let scaleEval = evaluateScaleLab(scaleBlend, scaleAxisBreak);
let scaleDispXs = [...scaleEval.xs];
let scaleDirty = true;

function syncScaleCanvasSize() {
  const rect = scaleCanvas.getBoundingClientRect();
  const w = Math.max(260, Math.round(rect.width));
  const h = Math.max(140, Math.round(rect.height));
  const dpr = pixelRatio(2);
  if (w !== scaleW || h !== scaleH || dpr !== scaleDpr) {
    scaleW = w;
    scaleH = h;
    scaleDpr = dpr;
    scaleCanvas.width = Math.round(w * dpr);
    scaleCanvas.height = Math.round(h * dpr);
    scaleDirty = true;
  }
}

function updateScaleLab() {
  scaleEval = evaluateScaleLab(scaleBlend, scaleAxisBreak);
  const pct = Math.round(scaleBlend * 100);
  document.getElementById("scale-blend-val").textContent =
    pct === 0 ? "0%（严格等比）" : pct === 100 ? "100%（纯视觉均距）" : `${pct}% 混合过渡`;
  const tierEl = document.getElementById("scale-tier");
  tierEl.textContent = scaleEval.scaleTier;
  tierEl.className = `s-v ${scaleEval.collisions > 0 ? "is-err" : scaleAxisBreak ? "is-ok" : ""}`;
  document.getElementById("scale-mingap").textContent = `${scaleEval.minGapPct.toFixed(0)}%`;
  const colEl = document.getElementById("scale-collisions");
  colEl.textContent = `${scaleEval.collisions} 处`;
  colEl.className = `s-v ${scaleEval.collisions > 0 ? "is-err" : "is-ok"}`;
  document.getElementById("scale-verdict").textContent = scaleEval.verdict;
  scaleDirty = true;
}

function drawScaleLab(t, dt, { still }) {
  syncScaleCanvasSize();
  let moving = false;
  const k = still ? 1 : Math.min(1, (dt || 0.016) * 12);
  for (let i = 0; i < scaleEval.xs.length; i++) {
    const d = scaleEval.xs[i] - scaleDispXs[i];
    if (Math.abs(d) > 0.0008) {
      scaleDispXs[i] += d * k;
      moving = true;
    } else {
      scaleDispXs[i] = scaleEval.xs[i];
    }
  }
  if (!scaleDirty && !moving) return;
  scaleDirty = false;

  const ctx = scaleCtx;
  const w = scaleW;
  const h = scaleH;
  ctx.save();
  ctx.scale(scaleDpr, scaleDpr);
  ctx.clearRect(0, 0, w, h);

  const compact = w < 460;
  const padX = compact ? 36 : 58;
  const trackW = w - padX * 2;
  const axisY = Math.round(h * 0.56);

  // 背景月度网格竖线
  ctx.strokeStyle = "rgba(245, 170, 128, 0.14)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i++) {
    const gx = padX + (i / 6) * trackW;
    ctx.beginPath();
    ctx.moveTo(gx, 22);
    ctx.lineTo(gx, h - 22);
    ctx.stroke();
  }

  // 主轴
  ctx.strokeStyle = "#F5AA80";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(padX, axisY);
  ctx.lineTo(padX + trackW, axisY);
  ctx.stroke();

  // 断轴 // 标记（D24 与 D180 之间）
  if (scaleAxisBreak) {
    const x4 = padX + scaleDispXs[4] * trackW;
    const x5 = padX + scaleDispXs[5] * trackW;
    const mid = (x4 + x5) / 2;
    ctx.fillStyle = "#1E070B";
    ctx.fillRect(mid - 14, axisY - 12, 28, 24);
    ctx.strokeStyle = "#6CD4AD";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(mid - 8, axisY + 10);
    ctx.lineTo(mid - 2, axisY - 10);
    ctx.moveTo(mid + 2, axisY + 10);
    ctx.lineTo(mid + 8, axisY - 10);
    ctx.stroke();
    ctx.fillStyle = "#6CD4AD";
    ctx.font = `700 11px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("断轴省略 156 天", mid, axisY - 18);
  } else {
    const x4 = padX + scaleDispXs[4] * trackW;
    const x5 = padX + scaleDispXs[5] * trackW;
    if (x5 - x4 > 90) {
      ctx.fillStyle = scaleEval.collisions > 0 ? "#FF8E80" : "#E6C7BC";
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`156 天等待（占视觉宽 ${((scaleDispXs[5] - scaleDispXs[4]) * 100).toFixed(0)}%）`, (x4 + x5) / 2, axisY - 18);
    }
  }

  // 撞车区红色底框提示
  if (scaleEval.collisions > 0) {
    const xStart = padX + scaleDispXs[0] * trackW - 14;
    const xEnd = padX + scaleDispXs[4] * trackW + 14;
    ctx.save();
    ctx.strokeStyle = "rgba(255, 110, 96, 0.65)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(xStart, axisY - 40, Math.max(40, xEnd - xStart), 82);
    ctx.restore();
  }

  // 绘制 6 个发版节点与撞车高亮
  const colors = ["#A11B24", "#D23B35", "#E87C63", "#F2AE83", "#F5AA80", "#6CD4AD"];
  scaleEval.events.forEach((ev, i) => {
    const cx = padX + scaleDispXs[i] * trackW;
    const prevGap = i > 0 ? (scaleDispXs[i] - scaleDispXs[i - 1]) * 100 : 100;
    const nextGap = i < scaleEval.events.length - 1 ? (scaleDispXs[i + 1] - scaleDispXs[i]) * 100 : 100;
    const jammed = prevGap < 10.5 || nextGap < 10.5;

    ctx.fillStyle = jammed ? "#FF5D52" : colors[i];
    ctx.strokeStyle = "#1E070B";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, axisY, compact ? 7.5 : 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 标签上下错开，但严重撞车时依然真实暴露拥挤
    const labelY = i % 2 === 0 ? axisY + 28 : axisY - 24;
    ctx.strokeStyle = jammed ? "rgba(255, 142, 128, 0.7)" : "rgba(230, 199, 188, 0.45)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, axisY + (i % 2 === 0 ? 10 : -10));
    ctx.lineTo(cx, labelY + (i % 2 === 0 ? -12 : 8));
    ctx.stroke();

    ctx.fillStyle = jammed ? "#FF8E80" : "#FDF3E7";
    ctx.font = `700 ${compact ? 10.5 : 12}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(ev.label, cx, labelY);
  });

  ctx.restore();
}

scaleRange.addEventListener("input", () => {
  scaleBlend = Number(scaleRange.value) / 100;
  updateScaleLab();
  scaleLoop.draw();
});

scaleBreakBtn.addEventListener("click", () => {
  scaleAxisBreak = !scaleAxisBreak;
  scaleBreakBtn.setAttribute("aria-pressed", String(scaleAxisBreak));
  scaleBreakBtn.textContent = scaleAxisBreak ? "插入断轴 //：开" : "插入断轴 //：关";
  updateScaleLab();
  scaleLoop.draw();
});

syncScaleCanvasSize();
updateScaleLab();
const scaleLoop = loop(scaleCanvas, drawScaleLab);
scaleLoop.draw();
window.addEventListener("resize", () => {
  syncScaleCanvasSize();
  scaleLoop.draw();
});

// =========================================================================
// 03 节：15 节点两级阶段折叠器
// =========================================================================
const openChunkIds = new Set(["prep", "exec", "close"]); // 开场故意全部摊开（15 项过载），让用户亲手折叠体会认知卸压
const chunkAccEl = document.getElementById("chunk-accordion");

function renderChunkLab() {
  const res = evaluateChunkLab([...openChunkIds]);
  const badge = document.getElementById("chunk-tier");
  badge.textContent = res.loadTier;
  badge.className = `chunk-badge ${res.openGroups <= 1 ? "is-ok" : res.openGroups === 2 ? "is-warn" : ""}`;
  document.getElementById("chunk-counts").textContent = `顶层 3 阶段 · 当前露出 ${res.expandedEvents} / ${res.totalEvents} 细项`;
  document.getElementById("chunk-verdict").textContent = res.verdict;

  chunkAccEl.innerHTML = "";
  CHUNK_GROUPS.forEach((group) => {
    const isOpen = openChunkIds.has(group.id);
    const wrap = document.createElement("div");
    wrap.className = "chunk-group";
    wrap.innerHTML = `
      <button type="button" class="chunk-group-btn phase-${group.phase}" data-group="${group.id}" aria-expanded="${isOpen}">
        <span class="cg-left">
          <span class="cg-title">${group.title}</span>
          <span class="cg-range">${group.range} · ${group.summary}</span>
        </span>
        <span class="cg-right">${group.events.length} 站 · ${isOpen ? "收起 ▲" : "展开 ▼"}</span>
      </button>
      <ol class="chunk-list" ${isOpen ? "" : "hidden"}>
        ${group.events
          .map(
            (ev) =>
              `<li class="chunk-item"><span><strong>${ev.code}</strong> ${ev.title}</span><span class="chunk-item-date">${ev.date}</span></li>`
          )
          .join("")}
      </ol>
    `;
    chunkAccEl.append(wrap);
  });
}

chunkAccEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".chunk-group-btn");
  if (!btn) return;
  const id = btn.dataset.group;
  if (openChunkIds.has(id)) openChunkIds.delete(id);
  else openChunkIds.add(id);
  renderChunkLab();
});

document.getElementById("chunk-focus-btn").addEventListener("click", () => {
  openChunkIds.clear();
  openChunkIds.add("exec");
  renderChunkLab();
});
document.getElementById("chunk-all-btn").addEventListener("click", () => {
  CHUNK_GROUPS.forEach((g) => openChunkIds.add(g.id));
  renderChunkLab();
});
document.getElementById("chunk-fold-btn").addEventListener("click", () => {
  openChunkIds.clear();
  renderChunkLab();
});
renderChunkLab();

// =========================================================================
// 04 节：横轴 vs 纵轴（原海报四大场景 × 模拟屏宽）
// =========================================================================
const orientState = { scenario: "pm", width: 340, mode: "horizontal" };
const orientVp = document.getElementById("orient-viewport");
const orientList = document.getElementById("orient-list");

function renderOrientationLab() {
  const sc = SCENARIOS.find((s) => s.id === orientState.scenario) || SCENARIOS[0];
  const ev = evaluateOrientation(orientState.width, orientState.mode);

  orientVp.style.maxWidth = `${orientState.width}px`;
  document.getElementById("orient-vp-title").textContent = `${sc.name} · ${sc.posterNote}`;
  document.getElementById("orient-vp-size").textContent = `${orientState.width} px`;

  orientList.className = `orient-list mode-${orientState.mode}`;
  orientList.innerHTML = sc.items
    .map(
      (it, idx) => `
      <li class="ol-item state-${it.state}" ${it.state === "active" ? 'aria-current="step"' : ""}>
        <span class="ol-dot" aria-hidden="true">${it.state === "done" ? "✓" : idx + 1}</span>
        <div class="ol-card">
          <span class="ol-tag">${it.tag}</span>
          <div class="ol-title">${it.title}</div>
          <p class="ol-desc">${it.desc}</p>
        </div>
      </li>`
    )
    .join("");

  const diag = document.getElementById("orient-diag");
  diag.className = `orient-diag is-${ev.status}`;
  document.getElementById("orient-diag-title").textContent = ev.headline;
  document.getElementById("orient-diag-body").textContent = ev.detail;

  document.querySelectorAll("[data-scenario]").forEach((b) => b.classList.toggle("is-active", b.dataset.scenario === orientState.scenario));
  document.querySelectorAll("[data-width]").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.width) === orientState.width));
  document.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("is-active", b.dataset.mode === orientState.mode));
}

document.querySelectorAll("[data-scenario]").forEach((b) =>
  b.addEventListener("click", () => {
    orientState.scenario = b.dataset.scenario;
    renderOrientationLab();
  })
);
document.querySelectorAll("[data-width]").forEach((b) =>
  b.addEventListener("click", () => {
    orientState.width = Number(b.dataset.width);
    renderOrientationLab();
  })
);
document.querySelectorAll("[data-mode]").forEach((b) =>
  b.addEventListener("click", () => {
    orientState.mode = b.dataset.mode;
    renderOrientationLab();
  })
);
renderOrientationLab();

// =========================================================================
// 05 节：时间线演化史（4 纪元 SVG 标本台）
// =========================================================================
const ERAS = [
  {
    title: "1753 · 巴尔博-迪堡《世界编年卷轴》",
    body: "法国医生 Jacques Barbeu-Dubourg 在 1753 年设计了 Chronographie universelle：把人类历史画在长达 54 英尺的纸卷上，装进带手摇曲柄的木盒里。摇动木轴，历史就沿着统一线性刻度从窗格前缓缓滚过——这是最早把「均匀空间距离」直接等同于「均匀时间流逝」的印刷装置之一。",
    note: "来源考据：Daniel Rosenberg & Anthony Grafton, Cartographies of Time (Princeton Architectural Press, 2010)",
    svg: `<svg viewBox="0 0 540 240" role="img" aria-label="1753 摇柄编年卷轴示意">
      <rect width="540" height="240" rx="12" fill="#1D080B"/>
      <rect x="44" y="48" width="452" height="144" rx="10" fill="#2E1015" stroke="#8C493F" stroke-width="2"/>
      <rect x="78" y="66" width="384" height="108" fill="#FDF3E7" rx="4"/>
      <line x1="94" y1="96" x2="446" y2="96" stroke="#A11B24" stroke-width="2"/>
      <g stroke="#A11B24" stroke-width="1.5">
        <line x1="110" y1="88" x2="110" y2="104"/><line x1="175" y1="88" x2="175" y2="104"/>
        <line x1="240" y1="88" x2="240" y2="104"/><line x1="305" y1="88" x2="305" y2="104"/>
        <line x1="370" y1="88" x2="370" y2="104"/><line x1="435" y1="88" x2="435" y2="104"/>
      </g>
      <g fill="#5F423C" font-size="11" font-weight="700" text-anchor="middle">
        <text x="110" y="82">1500</text><text x="175" y="82">1550</text><text x="240" y="82">1600</text>
        <text x="305" y="82">1650</text><text x="370" y="82">1700</text><text x="435" y="82">1750</text>
      </g>
      <g fill="#78000F" font-size="12" font-weight="700">
        <text x="108" y="132">匀速刻度卷轴（全长 54 英尺）</text>
        <text x="108" y="154" fill="#5F423C" font-size="11">左右曲柄卷动历史，首次将表格拉成连续纸带</text>
      </g>
      <rect x="26" y="76" width="24" height="88" rx="6" fill="#C64C35"/>
      <rect x="490" y="76" width="24" height="88" rx="6" fill="#C64C35"/>
    </svg>`,
  },
  {
    title: "1765 · 约瑟夫·普利斯特里《传记图表》",
    body: "英国学者 Joseph Priestley 在沃灵顿学院教学时，于 1765 年出版了 A Chart of Biography，用水平线段按等比时间轴并置公元前 1200 年至公元 1800 年约 2000 位历史人物的生卒，并按政治家、学者、诗人等六栏分轨；1769 年又推出 A New Chart of History 描绘帝国兴衰。他用最简洁的水平条把「谁与谁同时代」变得一眼可见，奠定了现代时间线的视觉语法。",
    note: "来源考据：Joseph Priestley, A Chart of Biography (1765), David Rumsey Map Collection",
    svg: `<svg viewBox="0 0 540 240" role="img" aria-label="1765 普利斯特里传记图表水平生卒条示意">
      <rect width="540" height="240" rx="12" fill="#1D080B"/>
      <rect x="28" y="24" width="484" height="192" rx="8" fill="#FDF3E7"/>
      <g stroke="#E5C8B5" stroke-width="1">
        <line x1="90" y1="48" x2="90" y2="196"/><line x1="175" y1="48" x2="175" y2="196"/>
        <line x1="260" y1="48" x2="260" y2="196"/><line x1="345" y1="48" x2="345" y2="196"/>
        <line x1="430" y1="48" x2="430" y2="196"/>
      </g>
      <g fill="#78000F" font-size="11" font-weight="700" text-anchor="middle">
        <text x="90" y="42">1500</text><text x="175" y="42">1580</text><text x="260" y="42">1660</text>
        <text x="345" y="42">1740</text><text x="430" y="42">1800</text>
      </g>
      <g font-size="11" font-weight="700" fill="#2B1A18">
        <rect x="108" y="72" width="112" height="10" rx="5" fill="#A11B24"/><text x="108" y="66">伽利略 (1564–1642)</text>
        <rect x="196" y="114" width="128" height="10" rx="5" fill="#C64C35"/><text x="196" y="108">牛顿 (1643–1727)</text>
        <rect x="292" y="156" width="136" height="10" rx="5" fill="#E87C63"/><text x="292" y="150">富兰克林 (1706–1790)</text>
      </g>
      <text x="270" y="206" text-anchor="middle" fill="#5F423C" font-size="11">水平等比条长 = 寿命，纵向对齐一眼看清同时代交集</text>
    </svg>`,
  },
  {
    title: "1896–1919 · 协调图与甘特生产进度图",
    body: "把时间线从史学搬进工厂与项目管理，有两位关键先驱：波兰工程师 Karol Adamiecki 在 1896 年发明了用于工序排班的 Harmonogram（1903 年起以波兰语与俄语发表）；美国机械工程师 Henry Laurence Gantt 在 1910 年代独立发展出水平生产进度图（1919 年出版 Organizing for Work，后经同事 Wallace Clark 1922 年专著广泛传播），让「计划进度 vs 实际完成」在同一时间轴上实时对照。",
    note: "来源考据：Karol Adamiecki (1896) 与 Henry L. Gantt, Organizing for Work (1919)",
    svg: `<svg viewBox="0 0 540 240" role="img" aria-label="甘特图水平条与计划实际对照示意">
      <rect width="540" height="240" rx="12" fill="#1D080B"/>
      <rect x="26" y="24" width="488" height="192" rx="8" fill="#2D0F14" stroke="#6E313A" stroke-width="1.5"/>
      <g stroke="rgba(245,170,128,0.2)" stroke-width="1">
        <line x1="140" y1="48" x2="140" y2="196"/><line x1="230" y1="48" x2="230" y2="196"/>
        <line x1="320" y1="48" x2="320" y2="196"/><line x1="410" y1="48" x2="410" y2="196"/>
      </g>
      <g fill="#E6C7BC" font-size="11" font-weight="700">
        <text x="140" y="42" text-anchor="middle">第 1 周</text><text x="230" y="42" text-anchor="middle">第 2 周</text>
        <text x="320" y="42" text-anchor="middle">第 3 周</text><text x="410" y="42" text-anchor="middle">第 4 周</text>
        <text x="44" y="84">准备备料</text><text x="44" y="128">主件加工</text><text x="44" y="172">总装验收</text>
      </g>
      <rect x="140" y="70" width="110" height="20" rx="4" fill="#6CD4AD"/>
      <rect x="215" y="114" width="155" height="20" rx="4" fill="rgba(245,170,128,0.28)" stroke="#F5AA80"/>
      <rect x="215" y="114" width="105" height="20" rx="4" fill="#F5AA80"/>
      <rect x="350" y="158" width="120" height="20" rx="4" fill="rgba(245,170,128,0.22)" stroke="#E6C7BC" stroke-dasharray="4 3"/>
      <line x1="320" y1="50" x2="320" y2="194" stroke="#FF8E80" stroke-width="2" stroke-dasharray="4 4"/>
      <text x="320" y="208" text-anchor="middle" fill="#FF8E80" font-size="11" font-weight="700">当前检查线（计划 vs 实际）</text>
    </svg>`,
  },
  {
    title: "当代网页与 App · 状态追踪器与进度轴",
    body: "进入屏幕时代后，时间线不再只是静态史料图，而成了直接安抚用户等待焦虑的交互组件。Nielsen Norman Group 将其拆成「主动查看的状态追踪器（如订单物流轴）」与「系统推送的进度提醒」两类协同机制；W3C WAI 规范则要求用有序列表语义与 aria-current=\"step\" 明确告诉屏幕阅读器当前停在第几步。",
    note: "来源考据：Nielsen Norman Group (Status Trackers) 与 W3C WAI Multi-page Forms Tutorial",
    svg: `<svg viewBox="0 0 540 240" role="img" aria-label="现代界面状态追踪时间线示意">
      <rect width="540" height="240" rx="12" fill="#1D080B"/>
      <rect x="34" y="34" width="472" height="172" rx="12" fill="#FDF3E7"/>
      <line x1="94" y1="104" x2="446" y2="104" stroke="#E5C8B5" stroke-width="4"/>
      <line x1="94" y1="104" x2="270" y2="104" stroke="#A11B24" stroke-width="4"/>
      <circle cx="94" cy="104" r="16" fill="#A11B24"/><text x="94" y="109" text-anchor="middle" fill="#FFFFFF" font-size="13" font-weight="700">✓</text>
      <circle cx="182" cy="104" r="16" fill="#A11B24"/><text x="182" y="109" text-anchor="middle" fill="#FFFFFF" font-size="13" font-weight="700">✓</text>
      <circle cx="270" cy="104" r="21" fill="#FDF3E7" stroke="#A11B24" stroke-width="3.5"/>
      <circle cx="270" cy="104" r="13" fill="#E87C63"/>
      <circle cx="358" cy="104" r="15" fill="#FDF3E7" stroke="#C99684" stroke-width="2.5"/>
      <circle cx="446" cy="104" r="15" fill="#FDF3E7" stroke="#C99684" stroke-width="2.5"/>
      <g fill="#2B1A18" font-size="12" font-weight="700" text-anchor="middle">
        <text x="94" y="144">已下单</text><text x="182" y="144">已揽收</text>
        <text x="270" y="146" fill="#78000F">干线运输中</text>
        <text x="358" y="144" fill="#644640">派送中</text><text x="446" y="144" fill="#644640">已签收</text>
      </g>
      <rect x="206" y="52" width="128" height="24" rx="12" fill="#78000F"/>
      <text x="270" y="68" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="700">aria-current="step"</text>
    </svg>`,
  },
];

function renderEra(idx) {
  const era = ERAS[idx] || ERAS[0];
  document.getElementById("era-visual").innerHTML = era.svg;
  document.getElementById("era-text").innerHTML = `
    <h3>${era.title}</h3>
    <p>${era.body}</p>
    <p class="era-source-note">${era.note}</p>
  `;
  document.querySelectorAll(".era-tab").forEach((tab) => {
    const active = Number(tab.dataset.era) === idx;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
}

document.querySelectorAll(".era-tab").forEach((tab) => {
  tab.addEventListener("click", () => renderEra(Number(tab.dataset.era)));
});
renderEra(0);

// =========================================================================
// 06 节：单变量诊断小练习
// =========================================================================
function buildQuizSvg(id) {
  // 5 站位置与视觉变量：仅改变题目所述唯一变量，保证公平真实
  const months = ["1月 立项", "2月 原型", "4月 内测", "5月 预售", "9月 量产"];
  const evenX = [46, 118, 190, 262, 334];
  const clusteredX = [46, 82, 152, 188, 334];
  const xs = id === "C" ? clusteredX : evenX;
  const hasSpine = id !== "D";
  const hasStates = id !== "A";

  const spineMarkup = hasSpine
    ? `<line x1="36" y1="42" x2="348" y2="42" stroke="${hasStates ? "#E2C1B0" : "#A11B24"}" stroke-width="3"/>
       ${hasStates ? `<line x1="36" y1="42" x2="${xs[2]}" y2="42" stroke="#A11B24" stroke-width="3.5"/>` : ""}
       <polygon points="346,36 360,42 346,48" fill="#A11B24"/>`
    : "";

  const nodesMarkup = xs
    .map((x, i) => {
      let fill = "#A11B24";
      let stroke = "#FFFBF5";
      let ring = "";
      let cardBg = "#FFFBF5";
      if (hasStates) {
        if (i < 2) {
          fill = "#A11B24";
        } else if (i === 2) {
          fill = "#E87C63";
          ring = `<circle cx="${x}" cy="42" r="14" fill="none" stroke="#78000F" stroke-width="2"/>`;
          cardBg = "#FCE8DC";
        } else {
          fill = "#FFFBF5";
          stroke = "#B98B7C";
        }
      }
      const cardW = id === "C" && i < 4 ? 54 : 58;
      return `
        ${ring}
        <circle cx="${x}" cy="42" r="9.5" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
        <rect x="${x - cardW / 2}" y="62" width="${cardW}" height="34" rx="6" fill="${cardBg}" stroke="${id === "C" && i === 2 ? "#B8141E" : "#E5C8B5"}" stroke-width="1.2"/>
        <text x="${x}" y="82" text-anchor="middle" fill="#2B1A18" font-size="10.5" font-weight="700">${months[i]}</text>
      `;
    })
    .join("");

  return `<svg viewBox="0 0 380 112" role="img" aria-label="方案 ${id} 示意图">
    <rect width="380" height="112" rx="8" fill="#FDF3E7"/>
    ${spineMarkup}
    ${nodesMarkup}
  </svg>`;
}

const quizGrid = document.getElementById("quiz-grid");
const quizFeedback = document.getElementById("quiz-feedback");
let pickedQuizId = null;

function renderQuiz() {
  quizGrid.innerHTML = "";
  QUIZ_OPTIONS.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-opt";
    btn.setAttribute("role", "radio");
    const isPicked = pickedQuizId === opt.id;
    btn.setAttribute("aria-checked", String(isPicked));
    if (isPicked) btn.classList.add(opt.correct ? "is-picked-ok" : "is-picked-err");
    btn.innerHTML = `
      <div class="quiz-opt-head">
        <span class="quiz-opt-label">${opt.label}</span>
        <span class="quiz-opt-tag">${isPicked ? (opt.correct ? "✓ 合理" : "× 有明显短板") : ""}</span>
      </div>
      ${buildQuizSvg(opt.id)}
      <p class="quiz-opt-cap">${opt.caption}</p>
    `;
    btn.addEventListener("click", () => {
      pickedQuizId = opt.id;
      renderQuiz();
      quizFeedback.className = `quiz-feedback ${opt.correct ? "is-ok" : "is-err"}`;
      quizFeedback.innerHTML = `<strong>${opt.label}：</strong>${opt.reason}`;
    });
    quizGrid.append(btn);
  });
}
renderQuiz();

// =========================================================================
// 07 节：原版海报放大灯箱（复用 #poster.src，支持缩放、拖拽平移、Esc 关闭）
// =========================================================================
const lightbox = document.getElementById("poster-lightbox");
const lbViewport = document.getElementById("lb-viewport");
const lbImg = document.getElementById("lb-img");
const lbScaleEl = document.getElementById("lb-scale");
const posterOpenBtn = document.getElementById("poster-open-btn");
const posterEl = document.getElementById("poster");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbScaleEl.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterEl.src;
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
  lightbox.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterOpenBtn.focus();
}

posterOpenBtn.addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-zoom-in").addEventListener("click", () => {
  lbScale = Math.min(3, lbScale + 0.35);
  applyLbTransform();
});
document.getElementById("lb-zoom-out").addEventListener("click", () => {
  lbScale = Math.max(0.75, lbScale - 0.35);
  applyLbTransform();
});
document.getElementById("lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
});

lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target === lbViewport && lbScale <= 1) {
    closeLightbox();
    return;
  }
  lbDrag = { x: e.clientX - lbTx, y: e.clientY - lbTy };
  lbViewport.classList.add("is-dragging");
  lbViewport.setPointerCapture?.(e.pointerId);
});

lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbTx = e.clientX - lbDrag.x;
  lbTy = e.clientY - lbDrag.y;
  applyLbTransform();
});

const endLbDrag = () => {
  lbDrag = null;
  lbViewport.classList.remove("is-dragging");
};
lbViewport.addEventListener("pointerup", endLbDrag);
lbViewport.addEventListener("pointercancel", endLbDrag);

lbViewport.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    lbScale = Math.max(0.75, Math.min(3, lbScale + (e.deltaY < 0 ? 0.18 : -0.18)));
    applyLbTransform();
  },
  { passive: false }
);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) {
    closeLightbox();
  }
});

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  ANATOMY_PARTS,
  COMPARE_FORMATS,
  COMPARE_SAMPLE,
  HISTORY_ERAS,
  PACING_MODES,
  QUIZ_QUESTIONS,
  SCRIPTS,
  SWEET_WIDTH,
  TRIAGE_CASES,
  createInitialState,
  createPresetState,
  evalViewportSim,
  evaluate,
} from "./model.js";

// ---------- 工具 ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const KW_ICONS = [
  // 交流
  `<svg class="kw-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 10h6.5l-1.8-1.8M15.5 14H9l1.8 1.8"/></svg>`,
  // 回应
  `<svg class="kw-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11.5a6.5 6.5 0 0 1 13 0c0 3.6-2.9 6.5-6.5 6.5-1.1 0-2.2-.3-3.1-.8L5 18.5l1.1-3.1A6.4 6.4 0 0 1 5 11.5Z"/><circle cx="9.2" cy="11.5" r=".7" fill="currentColor"/><circle cx="12" cy="11.5" r=".7" fill="currentColor"/><circle cx="14.8" cy="11.5" r=".7" fill="currentColor"/></svg>`,
  // 成对
  `<svg class="kw-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="7" height="14" rx="2"/><rect x="13" y="5" width="7" height="14" rx="2"/></svg>`,
  // 节奏
  `<svg class="kw-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 12v2M9 8v8M13 6v12M17 9v6M21 11v2"/></svg>`,
  // 互动
  `<svg class="kw-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8.5" r="2.8"/><path d="M4.5 18.5c0-2.6 2-4.5 4.5-4.5s4.5 1.9 4.5 4.5"/><circle cx="16" cy="9.5" r="2.2"/><path d="M14.5 18.5c.3-2 1.7-3.4 3.7-3.4 1.2 0 2.2.5 2.8 1.4"/></svg>`,
];

function avatarMarkup(side, muted = false) {
  if (muted) {
    return `<svg class="avatar-svg" viewBox="0 0 56 56" width="44" height="44" aria-hidden="true">
      <circle cx="28" cy="28" r="23" fill="#D4DFEE"/>
      <path d="M28 11 A17 17 0 0 1 28 45 Z" fill="#8C9DB8"/>
      <circle cx="45" cy="43" r="5" fill="#FFFFFF"/>
      <circle cx="45" cy="43" r="3.2" fill="#8C9DB8"/>
    </svg>`;
  }
  if (side === "left") {
    return `<svg class="avatar-svg" viewBox="0 0 56 56" width="44" height="44" aria-hidden="true">
      <circle cx="28" cy="28" r="23" fill="#96BEFC"/>
      <path d="M28 11 A17 17 0 0 1 28 45 Z" fill="#1171FD" transform="rotate(180 28 28)"/>
      <circle cx="45" cy="43" r="5.5" fill="#FFFFFF"/>
      <circle cx="45" cy="43" r="3.5" fill="#1171FD"/>
    </svg>`;
  }
  return `<svg class="avatar-svg" viewBox="0 0 56 56" width="44" height="44" aria-hidden="true">
    <circle cx="28" cy="28" r="23" fill="#FFE1D9"/>
    <path d="M28 11 A17 17 0 0 1 28 45 Z" fill="#FE754F"/>
    <circle cx="11" cy="43" r="5.5" fill="#FFFFFF"/>
    <circle cx="11" cy="43" r="3.5" fill="#FE754F"/>
  </svg>`;
}

// =========================================================================
// HERO：活体双轨对话剧场 + 2D Canvas 宽度标尺 + 视线动线层
// =========================================================================
let state = createInitialState("poster");
let pendingReplyTimer = 0;
let isTypingReply = false;
let lastEval = null;
let cachedRowBoxes = [];

const elTopPill = $("#top-status-pill");
const elKwStrip = $("#hero-kw-strip");
const elRulerCanvas = $("#width-ruler");
const elRulerReadout = $("#ruler-readout");
const elDialogViewport = $("#dialog-viewport");
const elDialogStage = $("#dialog-stage");
const elSaccadeCanvas = $("#saccade-canvas");
const elMilestones = $("#spine-milestones");
const elThread = $("#dialog-thread");
const elDiagCard = $("#diag-card");
const elDiagTag = $("#diag-tag");
const elDiagHeadline = $("#diag-headline");
const elDiagReason = $("#diag-reason");
const elDiagAction = $("#diag-action");
const elDiagMetrics = $("#diag-metrics");
const elComposerChips = $("#composer-chips");
const elBtnScan = $("#btn-scan-toggle");
const elBtnFixOrder = $("#btn-fix-order");
const elBtnToggleWall = $("#btn-toggle-wall");

function stageWidth() {
  return elDialogStage.clientWidth || 860;
}

function sizeCanvas(canvas, w, h) {
  const dpr = pixelRatio(2);
  const cw = Math.max(1, Math.round(w * dpr));
  const ch = Math.max(1, Math.round(h * dpr));
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function drawRuler(ev) {
  const rect = elRulerCanvas.getBoundingClientRect();
  const w = Math.max(200, rect.width);
  const h = Math.max(40, rect.height);
  const ctx = sizeCanvas(elRulerCanvas, w, h);

  ctx.clearRect(0, 0, w, h);
  const padX = 14;
  const trackW = w - padX * 2;
  const compact = h <= 42;
  const trackY = compact ? 10 : 13;
  const trackH = compact ? 13 : 16;
  const minW = 28;
  const maxW = 96;
  const xOf = (pct) => padX + ((pct - minW) / (maxW - minW)) * trackW;

  // 背景分区：过窄红、过渡浅蓝、甜区绿、过宽红
  const zones = [
    { a: 28, b: 44, fill: "#FCE8E8", label: "瘦柱 <44%" },
    { a: 44, b: 52, fill: "#EAF2FE", label: "" },
    { a: 52, b: 72, fill: "#DFF5EE", label: "经验甜区 52%–72%" },
    { a: 72, b: 76, fill: "#EAF2FE", label: "" },
    { a: 76, b: 96, fill: "#FCE8E8", label: "宽墙 >76%" },
  ];

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(padX, trackY, trackW, trackH, 8);
  ctx.clip();
  for (const z of zones) {
    const x0 = xOf(z.a);
    const x1 = xOf(z.b);
    ctx.fillStyle = z.fill;
    ctx.fillRect(x0, trackY, x1 - x0, trackH);
  }
  ctx.restore();

  // 边框与甜区刻度线
  ctx.strokeStyle = "#C7DCF8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(padX, trackY, trackW, trackH, 8);
  ctx.stroke();

  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = "#0D735C";
  for (const mark of [SWEET_WIDTH.min, SWEET_WIDTH.max]) {
    const mx = xOf(mark);
    ctx.beginPath();
    ctx.moveTo(mx, trackY - 2);
    ctx.lineTo(mx, trackY + trackH + 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 分区底标
  ctx.font = '600 10.5px "Manrope", "Noto Sans SC", sans-serif';
  ctx.textBaseline = "top";
  const labelY = trackY + trackH + (compact ? 3 : 4);
  ctx.textAlign = "left";
  ctx.fillStyle = "#B02828";
  ctx.fillText("瘦条折行", padX + 2, labelY);
  ctx.textAlign = "center";
  ctx.fillStyle = "#0D735C";
  ctx.fillText("甜区 52%–72%", (xOf(52) + xOf(72)) / 2, labelY);
  ctx.textAlign = "right";
  ctx.fillStyle = "#B02828";
  ctx.fillText("宽墙越界", padX + trackW - 2, labelY);

  // 实时左右通道缩微预演条（标尺顶沿微线）
  const leftBarW = Math.min(trackW * 0.45, ((state.bubbleWidth / 100) * trackW) * 0.46);
  ctx.fillStyle = ev.widthTooWide || ev.widthTooNarrow ? "rgba(194,45,45,0.28)" : "rgba(17,113,253,0.3)";
  ctx.fillRect(padX, compact ? 3 : 5, leftBarW, 3.5);
  ctx.fillStyle = ev.widthTooWide || ev.widthTooNarrow ? "rgba(194,45,45,0.28)" : "rgba(254,117,79,0.38)";
  ctx.fillRect(padX + trackW - leftBarW, compact ? 3 : 5, leftBarW, 3.5);

  // 可拖手柄胶囊
  const tx = clamp(xOf(state.bubbleWidth), padX + 22, padX + trackW - 22);
  const pillW = 52;
  const pillH = compact ? 19 : 22;
  const pillY = trackY + trackH / 2 - pillH / 2;
  const okWidth = !ev.widthTooWide && !ev.widthTooNarrow;
  ctx.fillStyle = okWidth ? "#0A4EC4" : "#C22D2D";
  ctx.beginPath();
  ctx.roundRect(tx - pillW / 2, pillY, pillW, pillH, 11);
  ctx.fill();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = '800 11.5px "Manrope", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`↔ ${state.bubbleWidth}%`, tx, trackY + trackH / 2 + 0.5);
}

function measureRowBoxes() {
  const stageRect = elDialogStage.getBoundingClientRect();
  const rows = $$(".turn-row", elThread);
  cachedRowBoxes = rows.map((row) => {
    const bub = $(".bubble-card", row);
    const br = bub ? bub.getBoundingClientRect() : row.getBoundingClientRect();
    return {
      x: br.left - stageRect.left,
      y: br.top - stageRect.top,
      w: br.width,
      h: br.height,
      cx: br.left - stageRect.left + br.width / 2,
      cy: br.top - stageRect.top + br.height / 2,
      speaker: row.dataset.speaker,
      round: Number(row.dataset.round),
      idx: Number(row.dataset.idx),
    };
  });

  // 将原海报 3 枚中轴阶段节点对齐到每轮气泡中段
  const ev = lastEval;
  if (!ev) return;
  const stages = ev.script.stages;
  elMilestones.innerHTML = "";
  if (state.roleMode === "flat") return;
  for (let r = 0; r < stages.length; r++) {
    const pairRows = cachedRowBoxes.filter((b) => b.round === r);
    if (!pairRows.length) continue;
    const midY = pairRows.reduce((acc, b) => acc + b.cy, 0) / pairRows.length;
    const tag = document.createElement("div");
    tag.className = "spine-tag";
    tag.style.top = `${Math.round(midY)}px`;
    tag.innerHTML = `<span class="ring"></span><span>${stages[r].zh}</span><em>${stages[r].en}</em>`;
    elMilestones.appendChild(tag);
  }
}

function drawSaccade(t, still) {
  const w = elDialogStage.clientWidth || 860;
  const h = elDialogStage.scrollHeight || 360;
  const ctx = sizeCanvas(elSaccadeCanvas, w, h);
  ctx.clearRect(0, 0, w, h);
  if (!cachedRowBoxes.length || !lastEval) return;

  const ev = lastEval;
  const midX = w / 2;

  // 1. 中央虚线节奏轴（呼应 281 原海报）
  if (state.roleMode !== "flat") {
    ctx.save();
    ctx.strokeStyle = ev.checks.pacingOk ? "rgba(17, 113, 253, 0.34)" : "rgba(194, 45, 45, 0.32)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(midX, 16);
    ctx.lineTo(midX, Math.max(40, h - 16));
    ctx.stroke();
    ctx.restore();
  }

  if (!state.showScan) return;

  // 2. 视线动线：沿气泡外侧通道清晰标出 Z 形往复或错态回找，不遮挡气泡文字
  const pts = cachedRowBoxes.map((b) => ({
    x:
      state.roleMode === "flat"
        ? Math.max(10, b.x - 6)
        : b.speaker === "left"
        ? Math.min(w - 18, b.x + b.w + 8)
        : Math.max(18, b.x - 8),
    y: b.cy,
    speaker: b.speaker,
    round: b.round,
  }));

  const progress = still ? 1 : Math.min(1, t / 0.75);
  const segCount = Math.max(0, pts.length - 1);

  for (let i = 0; i < segCount; i++) {
    const segStart = i / Math.max(1, segCount);
    const segEnd = (i + 1) / Math.max(1, segCount);
    const localP = clamp((progress - segStart) / Math.max(0.01, segEnd - segStart), 0, 1);
    if (localP <= 0) continue;

    const p0 = pts[i];
    const p1 = pts[i + 1];
    const sameSideClash = state.roleMode === "flat" || p0.speaker === p1.speaker;
    const isRoundJump = i % 2 === 1;
    const bad = sameSideClash || (!isRoundJump && p0.round !== p1.round);

    const ex = p0.x + (p1.x - p0.x) * localP;
    const ey = p0.y + (p1.y - p0.y) * localP;

    ctx.save();
    ctx.lineWidth = bad ? 2 : isRoundJump ? 1.5 : 2.2;
    ctx.strokeStyle = bad
      ? "rgba(194, 45, 45, 0.75)"
      : isRoundJump
      ? "rgba(10, 78, 196, 0.32)"
      : "rgba(17, 113, 253, 0.56)";
    if (bad || isRoundJump) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    if (bad && state.roleMode !== "flat") {
      const cpx = midX + (p0.speaker === "left" ? -34 : 34);
      ctx.quadraticCurveTo(cpx, (p0.y + p1.y) / 2, ex, ey);
    } else {
      ctx.lineTo(ex, ey);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 节点与克制的扫读光点
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const isBadNode = ev.brokenTurnIndices.has(i) || state.roleMode === "flat";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = isBadNode ? "#C22D2D" : p.speaker === "left" ? "#1171FD" : "#FE754F";
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  if (!still && pts.length > 1) {
    const cycle = (t * 0.28) % 1;
    const fIdx = cycle * (pts.length - 1);
    const i0 = Math.floor(fIdx);
    const i1 = Math.min(pts.length - 1, i0 + 1);
    const frac = fIdx - i0;
    const fx = pts[i0].x + (pts[i1].x - pts[i0].x) * frac;
    const fy = pts[i0].y + (pts[i1].y - pts[i0].y) * frac;
    ctx.beginPath();
    ctx.arc(fx, fy, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = ev.passedCount === 4 ? "rgba(13, 115, 92, 0.26)" : "rgba(194, 45, 45, 0.26)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fx, fy, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = ev.passedCount === 4 ? "#0D735C" : "#C22D2D";
    ctx.fill();
  }
}

function renderThread(ev) {
  elThread.className = `dialog-thread mode-${state.roleMode}`;
  elThread.style.setProperty("--bubble-max", `${state.bubbleWidth}%`);
  const { inner, outer } = ev.pacingInfo;
  const mutedAv = state.roleMode === "flat";

  const htmlParts = ev.turns.map((turn, idx) => {
    const role = turn.speaker === "left" ? ev.script.leftRole : ev.script.rightRole;
    const isBrokenOrder = ev.brokenTurnIndices.has(idx);
    const isBrokenCard = isBrokenOrder || turn.isWall || state.roleMode === "flat" || state.roleMode === "rainbow";
    const mt = idx === 0 ? 0 : idx % 2 === 1 ? inner : outer;

    const actions = [];
    if (!turn.isExtra && idx < 5) {
      const alertCls = isBrokenOrder ? " is-alert" : "";
      const swapTxt = isBrokenOrder ? "↕ 调顺轮次" : "↕ 换序";
      actions.push(`<button type="button" class="inline-chip${alertCls}" data-swap-idx="${idx}">${swapTxt}</button>`);
    }
    if (turn.canToggleWall) {
      actions.push(
        `<button type="button" class="inline-chip${turn.isWall ? " is-alert" : ""}" data-wall-toggle="1">${
          turn.isWall ? `✂ 拆短 (${turn.displayBody.length}字)` : "压测长段"
        }</button>`
      );
    }

    return `<div class="turn-row is-${turn.speaker}" data-idx="${idx}" data-speaker="${turn.speaker}" data-round="${turn.round}" style="margin-top:${mt}px">
      <div class="avatar-col">
        ${avatarMarkup(turn.speaker, mutedAv)}
        <span class="avatar-name">${role.name}</span>
        <span class="avatar-en">${role.en}</span>
      </div>
      <div class="bubble-lane">
        <div class="bubble-card${isBrokenCard ? " is-broken" : ""}">
          <div class="bubble-top">
            <p class="bubble-lead">${turn.lead}</p>
            ${actions.length ? `<div class="bubble-actions">${actions.join("")}</div>` : ""}
          </div>
          <p class="bubble-body">${turn.displayBody}</p>
        </div>
      </div>
    </div>`;
  });

  if (isTypingReply) {
    htmlParts.push(`<div class="typing-row">
      ${avatarMarkup("left", mutedAv)}
      <div class="typing-bubble">正在回复 • • •</div>
    </div>`);
  }

  elThread.innerHTML = htmlParts.join("");
}

let lastKwSig = "";
let dragMeasureRaf = 0;

function renderHeroUI(fullRebuild = true) {
  const ev = evaluate(state, stageWidth());
  lastEval = ev;

  // 顶眉状态胶囊
  const isPass = ev.passedCount === 4;
  const pillText = isPass ? "4 / 4 节奏清晰" : `${ev.passedCount} / 4 待理对话`;
  if (elTopPill.textContent !== pillText) elTopPill.textContent = pillText;
  elTopPill.classList.toggle("is-pass", isPass);
  elTopPill.classList.toggle("is-error", !isPass);

  // 5 枚原海报关键词实时状态（仅在状态变化时重建，避免拖动期无谓 DOM 重排）
  const kwSig = ev.keywords.map((k) => `${k.ok}:${k.status}`).join("|");
  if (kwSig !== lastKwSig) {
    lastKwSig = kwSig;
    elKwStrip.innerHTML = ev.keywords
      .map(
        (k, i) => `<li class="kw-pill ${k.ok ? "is-ok" : "is-bad"}">
          ${KW_ICONS[i]}
          <span class="kw-meta">
            <span class="kw-top"><span class="kw-zh">${k.zh}</span><span class="kw-en">${k.en}</span></span>
            <span class="kw-state">${k.status}</span>
          </span>
        </li>`
      )
      .join("");
  }

  // 标尺读数与 ARIA
  const wStatus = ev.widthTooWide ? "宽墙越界" : ev.widthTooNarrow ? "瘦条折行" : ev.widthInSweet ? "节奏甜区" : "可用边界";
  elRulerReadout.textContent = `${state.bubbleWidth}% · 约 ${ev.estCharsPerLine} 字/行 · 对向留白 ${ev.laneClearancePct}% · ${wStatus}`;
  elRulerReadout.classList.toggle("is-ok", !ev.widthTooWide && !ev.widthTooNarrow);
  elRulerCanvas.setAttribute("aria-valuenow", String(state.bubbleWidth));

  // 剧场内容（拖动宽度时只改 CSS 变量与标尺/动线，避免整树重建）
  if (fullRebuild) {
    renderThread(ev);
  } else {
    elThread.style.setProperty("--bubble-max", `${state.bubbleWidth}%`);
  }

  // 诊单更新
  elDiagCard.classList.toggle("is-pass", ev.diagnosis.severity === "pass");
  elDiagCard.classList.toggle("is-error", ev.diagnosis.severity !== "pass");
  elDiagTag.textContent = ev.diagnosis.tag;
  elDiagHeadline.textContent = ev.diagnosis.headline;
  elDiagReason.textContent = ev.diagnosis.reason;
  elDiagAction.textContent = ev.diagnosis.action;

  elDiagMetrics.innerHTML = `
    <div class="m-cell"><span class="m-k">气泡宽度</span><span class="m-v ${!ev.widthTooWide && !ev.widthTooNarrow ? "is-ok" : "is-bad"}">${state.bubbleWidth}%</span></div>
    <div class="m-cell"><span class="m-k">估约字/行</span><span class="m-v">${ev.estCharsPerLine} 字</span></div>
    <div class="m-cell"><span class="m-k">成对匹配</span><span class="m-v ${ev.checks.orderOk ? "is-ok" : "is-bad"}">${ev.validPairs} / ${ev.totalPairs}</span></div>
    <div class="m-cell"><span class="m-k">组间/内比</span><span class="m-v ${ev.checks.pacingOk ? "is-ok" : "is-bad"}">${ev.pacingInfo.ratio.toFixed(1)}×</span></div>
  `;

  if (fullRebuild) {
    $$("[data-script]").forEach((b) => {
      const on = b.dataset.script === state.scriptId;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    $$("[data-role]").forEach((b) => {
      const on = b.dataset.role === state.roleMode;
      b.classList.toggle("is-active", on);
      b.classList.toggle("is-wrong", on && !ev.checks.roleOk);
    });
    $$("[data-pacing]").forEach((b) => {
      const on = b.dataset.pacing === state.pacingMode;
      b.classList.toggle("is-active", on);
      b.classList.toggle("is-wrong", on && !ev.checks.pacingOk);
    });

    elBtnScan.classList.toggle("is-on", state.showScan);
    elBtnScan.setAttribute("aria-pressed", String(state.showScan));
    elBtnScan.textContent = `视线动线: ${state.showScan ? "开" : "关"}`;
    elBtnFixOrder.textContent = ev.checks.orderOk ? "打乱轮次试错" : "一键理顺轮次";
    elBtnToggleWall.textContent = state.wallBloated ? "拆短长段气泡" : "还原长段压测";

    elComposerChips.innerHTML = ev.script.quickReplies
      .map((q) => {
        const used = state.usedQuickIds.includes(q.id);
        return `<button type="button" class="reply-chip" data-quick="${q.id}" ${used ? "disabled" : ""}>${used ? "✓ 已发送：" : ""}${q.chip}</button>`;
      })
      .join("");
  }

  drawRuler(ev);
  if (fullRebuild) {
    measureRowBoxes();
    heroLoop.draw();
  } else if (!dragMeasureRaf) {
    dragMeasureRaf = requestAnimationFrame(() => {
      dragMeasureRaf = 0;
      measureRowBoxes();
      heroLoop.draw();
    });
  }
}

// 顶沿 2D Canvas 标尺拖拽（鼠标 / 触屏 / 键盘方向键，无卡顿）
function updateWidthFromClientX(clientX) {
  const rect = elRulerCanvas.getBoundingClientRect();
  const padX = 14;
  const ratio = clamp((clientX - rect.left - padX) / Math.max(1, rect.width - padX * 2), 0, 1);
  let nextW = Math.round(28 + ratio * (96 - 28));
  if (Math.abs(nextW - 62) <= 1) nextW = 62; // 靠近原海报推荐甜点轻吸
  if (nextW !== state.bubbleWidth) {
    state.bubbleWidth = nextW;
    renderHeroUI(false);
  } else {
    // 即使整数值未跳变，拖动时也轻刷标尺确保 perf 拖动手感顺滑
    drawRuler(lastEval);
  }
}

let draggingRuler = false;
elRulerCanvas.addEventListener("pointerdown", (e) => {
  draggingRuler = true;
  elRulerCanvas.setPointerCapture?.(e.pointerId);
  updateWidthFromClientX(e.clientX);
});
elRulerCanvas.addEventListener("pointermove", (e) => {
  if (!draggingRuler) return;
  updateWidthFromClientX(e.clientX);
});
const stopRulerDrag = () => {
  draggingRuler = false;
};
elRulerCanvas.addEventListener("pointerup", stopRulerDrag);
elRulerCanvas.addEventListener("pointercancel", stopRulerDrag);

// 兼容 CDP touch 事件直接调度
elRulerCanvas.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches[0]) {
      draggingRuler = true;
      updateWidthFromClientX(e.touches[0].clientX);
    }
  },
  { passive: true }
);
elRulerCanvas.addEventListener(
  "touchmove",
  (e) => {
    if (!draggingRuler || !e.touches[0]) return;
    e.preventDefault();
    updateWidthFromClientX(e.touches[0].clientX);
  },
  { passive: false }
);
elRulerCanvas.addEventListener("touchend", stopRulerDrag, { passive: true });

elRulerCanvas.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 6 : 2;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.bubbleWidth = clamp(state.bubbleWidth - step, 28, 96);
    renderHeroUI(false);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.bubbleWidth = clamp(state.bubbleWidth + step, 28, 96);
    renderHeroUI(false);
  }
});

// 剧场按钮与气泡内直点交互
$$("[data-script]").forEach((btn) => {
  btn.addEventListener("click", () => {
    clearTimeout(pendingReplyTimer);
    isTypingReply = false;
    state = createInitialState(btn.dataset.script);
    renderHeroUI(true);
  });
});

$("#btn-preset-poster").addEventListener("click", () => {
  clearTimeout(pendingReplyTimer);
  isTypingReply = false;
  state = createPresetState("poster", state.scriptId);
  renderHeroUI(true);
});

$("#btn-preset-minimal").addEventListener("click", () => {
  clearTimeout(pendingReplyTimer);
  isTypingReply = false;
  state = createPresetState("minimal", state.scriptId);
  renderHeroUI(true);
});

$("#btn-preset-broken").addEventListener("click", () => {
  clearTimeout(pendingReplyTimer);
  isTypingReply = false;
  state = createInitialState(state.scriptId);
  renderHeroUI(true);
});

elBtnScan.addEventListener("click", () => {
  state.showScan = !state.showScan;
  elBtnScan.classList.toggle("is-on", state.showScan);
  elBtnScan.setAttribute("aria-pressed", String(state.showScan));
  elBtnScan.textContent = `视线动线: ${state.showScan ? "开" : "关"}`;
  heroLoop.draw();
});

$$("[data-role]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.roleMode = btn.dataset.role;
    renderHeroUI(true);
  });
});

$$("[data-pacing]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.pacingMode = btn.dataset.pacing;
    renderHeroUI(true);
  });
});

elBtnFixOrder.addEventListener("click", () => {
  const ev = evaluate(state, stageWidth());
  state.orderIds = ev.checks.orderOk ? [0, 2, 1, 3, 4, 5] : [0, 1, 2, 3, 4, 5];
  renderHeroUI(true);
});

elBtnToggleWall.addEventListener("click", () => {
  state.wallBloated = !state.wallBloated;
  renderHeroUI(true);
});

// 剧场内部直点气泡：对调相邻轮次 / 拆短长气泡
elThread.addEventListener("click", (e) => {
  const swapBtn = e.target.closest("[data-swap-idx]");
  if (swapBtn) {
    const idx = Number(swapBtn.dataset.swapIdx);
    const nextIdx = idx < state.orderIds.length - 1 ? idx + 1 : idx - 1;
    const copy = [...state.orderIds];
    [copy[idx], copy[nextIdx]] = [copy[nextIdx], copy[idx]];
    state.orderIds = copy;
    renderHeroUI(true);
    return;
  }
  const wallBtn = e.target.closest("[data-wall-toggle]");
  if (wallBtn) {
    state.wallBloated = !state.wallBloated;
    renderHeroUI(true);
  }
});

// 底部快捷追问：发出真实的新一轮一问一答
elComposerChips.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-quick]");
  if (!chip || chip.disabled) return;
  const qid = chip.dataset.quick;
  const script = SCRIPTS[state.scriptId];
  const item = script.quickReplies.find((x) => x.id === qid);
  if (!item) return;

  state.usedQuickIds.push(qid);
  const newRound = 3 + state.extraTurns.length / 2;
  state.extraTurns.push({
    id: 100 + state.extraTurns.length,
    round: newRound,
    speaker: "right",
    lead: item.userLead,
    body: item.userBody,
    displayBody: item.userBody,
    isWall: false,
    canToggleWall: false,
    isExtra: true,
  });

  const pushReply = () => {
    isTypingReply = false;
    state.extraTurns.push({
      id: 100 + state.extraTurns.length,
      round: newRound,
      speaker: "left",
      lead: item.replyLead,
      body: item.replyBody,
      displayBody: item.replyBody,
      isWall: false,
      canToggleWall: false,
      isExtra: true,
    });
    renderHeroUI(true);
    elDialogViewport.scrollTop = elDialogViewport.scrollHeight;
  };

  if (reducedMotion.matches) {
    pushReply();
  } else {
    isTypingReply = true;
    renderHeroUI(true);
    elDialogViewport.scrollTop = elDialogViewport.scrollHeight;
    clearTimeout(pendingReplyTimer);
    pendingReplyTimer = setTimeout(pushReply, 420);
  }
});

const heroLoop = loop(elDialogStage, (t, _dt, { still }) => {
  drawSaccade(t, still);
});

// =========================================================================
// 01 节：三态结构解剖镜
// =========================================================================
const elXrayStage = $("#xray-stage");
const elXraySvg = $("#xray-svg");
const elXrayFacts = $("#xray-facts");

function renderXray(formatId) {
  const f = COMPARE_FORMATS[formatId] || COMPARE_FORMATS.dialog;
  $$(".xray-tab").forEach((b) => {
    const on = b.dataset.format === formatId;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });

  const stageHead = `<div class="xray-stage-head">同一段 4 轮对话 · 当前排法：${f.label}</div>`;
  if (formatId === "irc") {
    elXrayStage.innerHTML =
      stageHead +
      COMPARE_SAMPLE.map(
        (m) => `<div class="xray-irc-line">[${m.time}] <span class="nick">&lt;${m.who}&gt;</span> ${m.text}</div>`
      ).join("");
    elXraySvg.innerHTML = `
      <rect x="12" y="14" width="296" height="172" rx="10" fill="#F8FAFD" stroke="#D5E2F5"/>
      <path d="M46 42 L262 42 L46 82 L262 82 L46 122 L262 122 L46 162 L248 162" fill="none" stroke="#C22D2D" stroke-width="2" stroke-dasharray="5 4"/>
      ${[42, 82, 122, 162].map((y) => `<circle cx="46" cy="${y}" r="5" fill="#C22D2D"/><text x="58" y="${y + 4}" font-size="11" fill="#334366">核对署名</text>`).join("")}
    `;
  } else if (formatId === "stream") {
    elXrayStage.innerHTML =
      stageHead +
      COMPARE_SAMPLE.map(
        (m) => `<div class="xray-stream-item">
          <span class="mini-dot-av ${m.role === "right" ? "is-r" : ""}" aria-hidden="true"></span>
          <div><strong>${m.who}</strong> <small style="color:#4f6082">${m.time}</small><div style="font-size:13.5px;color:#334366">${m.text}</div></div>
        </div>`
      ).join("");
    elXraySvg.innerHTML = `
      <rect x="12" y="14" width="296" height="172" rx="10" fill="#F8FAFD" stroke="#D5E2F5"/>
      <line x1="56" y1="36" x2="56" y2="164" stroke="#0A4EC4" stroke-width="2" stroke-dasharray="4 4"/>
      ${[42, 82, 122, 162]
        .map(
          (y, i) => `<circle cx="56" cy="${y}" r="6" fill="${i % 2 ? "#FE754F" : "#1171FD"}"/>
          <rect x="74" y="${y - 10}" width="196" height="20" rx="6" fill="#EAF2FE"/>`
        )
        .join("")}
    `;
  } else {
    elXrayStage.innerHTML =
      stageHead +
      COMPARE_SAMPLE.map(
        (m) => `<div class="xray-bubble-row ${m.role === "right" ? "is-r" : ""}">
          <div class="xray-bubble">${m.text}</div>
        </div>`
      ).join("");
    elXraySvg.innerHTML = `
      <rect x="12" y="14" width="296" height="172" rx="10" fill="#F4F9FF" stroke="#C7DCF8"/>
      <line x1="160" y1="24" x2="160" y2="176" stroke="#9FC3F9" stroke-width="1.4" stroke-dasharray="4 4"/>
      <path d="M98 44 L222 82 L98 122 L222 160" fill="none" stroke="#1171FD" stroke-width="2.4"/>
      <rect x="30" y="30" width="112" height="26" rx="12" fill="#FFFFFF" stroke="#96BEFC"/>
      <rect x="178" y="69" width="112" height="26" rx="12" fill="#FFF2E6" stroke="#F3D0B3"/>
      <rect x="30" y="109" width="112" height="26" rx="12" fill="#FFFFFF" stroke="#96BEFC"/>
      <rect x="178" y="147" width="112" height="26" rx="12" fill="#FFF2E6" stroke="#F3D0B3"/>
      <circle cx="98" cy="44" r="4.5" fill="#1171FD"/><circle cx="222" cy="82" r="4.5" fill="#FE754F"/>
      <circle cx="98" cy="122" r="4.5" fill="#1171FD"/><circle cx="222" cy="160" r="4.5" fill="#FE754F"/>
    `;
  }

  elXrayFacts.innerHTML = `
    <div class="xray-badges">
      <span class="fact-pill">${f.era}</span>
      <span class="fact-pill">核名负担：${f.rechecks}</span>
      <span class="fact-pill">动线：${f.eyeStyle}</span>
    </div>
    <p>${f.summary}</p>
  `;
}

$$(".xray-tab").forEach((b) => b.addEventListener("click", () => renderXray(b.dataset.format)));

// =========================================================================
// 02 节：气泡五个零件解剖 + 连发折叠
// =========================================================================
let activePartId = "avatar";
let burstGrouped = false;
const elBurstZone = $("#spec-burst-zone");
const elBurstItems = $("#spec-burst-items");
const elAnatomyDetail = $("#anatomy-detail");
const elBtnBurst = $("#btn-burst-toggle");

const BURST_LINES = [
  "先确认每条发言的长度",
  "超过两三句就拆成轻短句",
  "连续发三条时头像只需落一次，画面瞬间干净",
];

function renderAnatomy() {
  elBurstZone.dataset.grouped = String(burstGrouped);
  elBtnBurst.setAttribute("aria-pressed", String(burstGrouped));
  elBtnBurst.textContent = burstGrouped ? "已合并连发（4px 内距）· 点此切回逐条重复" : "连发 3 条：逐条重复 → 切为合并折叠";

  elBurstItems.innerHTML = BURST_LINES.map((txt, i) => {
    const showAv = !burstGrouped || i === BURST_LINES.length - 1;
    const pinTint = i === 0 ? `<button type="button" class="pin-btn pin-corner${activePartId === "tint" ? " is-active" : ""}" data-part="tint" aria-label="03 冷暖语义配色">03</button>` : "";
    const pinBurst = i === 2 ? `<button type="button" class="pin-btn pin-corner${activePartId === "burst" ? " is-active" : ""}" data-part="burst" aria-label="05 连发折叠规则">05</button>` : "";
    return `<div class="burst-item">
      <div class="burst-bubble">${pinTint}${pinBurst}${txt}</div>
      ${showAv ? avatarMarkup("right", false) : `<span class="burst-av-spacer" aria-hidden="true"></span>`}
    </div>`;
  }).join("");

  $$(".pin-btn", $("#specimen-canvas")).forEach((p) => {
    p.classList.toggle("is-active", p.dataset.part === activePartId);
  });

  const part = ANATOMY_PARTS.find((p) => p.id === activePartId) || ANATOMY_PARTS[0];
  elAnatomyDetail.innerHTML = `
    <div class="part-tabs" role="tablist" aria-label="气泡解剖零件列表">
      ${ANATOMY_PARTS.map(
        (p) => `<button type="button" class="part-tab${p.id === part.id ? " is-active" : ""}" data-part="${p.id}">${p.num}</button>`
      ).join("")}
    </div>
    <div>
      <span class="detail-en">${part.num} · ${part.en}</span>
      <h3 class="detail-title">${part.title}</h3>
    </div>
    <p class="detail-body">${part.body}</p>
    <p class="detail-tip">${part.tip}</p>
  `;
}

$("#sec-02").addEventListener("click", (e) => {
  const partBtn = e.target.closest("[data-part]");
  if (partBtn) {
    activePartId = partBtn.dataset.part;
    renderAnatomy();
  }
});

elBtnBurst.addEventListener("click", () => {
  burstGrouped = !burstGrouped;
  activePartId = "burst";
  renderAnatomy();
});

// =========================================================================
// 03 节：2D Canvas 屏宽与群聊演练台
// =========================================================================
let simMode = "two";
let simVp = 1200;
let simCap = 64;

const elSimCanvas = $("#sim-canvas");
const elSimCapRange = $("#sim-cap-range");
const elSimCapVal = $("#sim-cap-val");
const elSimVerdict = $("#sim-verdict");

function drawSimCanvas() {
  const res = evalViewportSim(simMode, simVp, simCap);
  const rect = elSimCanvas.getBoundingClientRect();
  const w = Math.max(260, rect.width);
  const h = Math.max(260, rect.height);
  const ctx = sizeCanvas(elSimCanvas, w, h);

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#08112B";
  ctx.fillRect(0, 0, w, h);

  // 缩放模拟设备框
  const pad = 20;
  const availW = w - pad * 2;
  const availH = h - pad * 2 - 22;
  const scale = Math.min(availW / simVp, availH / 520, 1);
  const frameW = Math.max(150, Math.round(simVp * scale));
  const frameH = availH;
  const fx = Math.round((w - frameW) / 2);
  const fy = 18;

  // 设备外框
  ctx.fillStyle = "#101E46";
  ctx.strokeStyle = "#355196";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(fx, fy, frameW, frameH, 14);
  ctx.fill();
  ctx.stroke();

  // 顶栏文字
  ctx.fillStyle = "#9DBAF2";
  ctx.font = '700 11px "Chivo", "Noto Sans SC", sans-serif';
  ctx.textAlign = "left";
  ctx.fillText(`模拟视口 ${simVp}px`, fx + 12, fy + 20);
  ctx.textAlign = "right";
  ctx.fillStyle = res.tone === "warn" ? "#FF9A90" : "#6CE3C4";
  ctx.fillText(`气泡 ${res.bubbleW}px (${simCap}%)`, fx + frameW - 12, fy + 20);

  // 内部对话轨道
  const innerPad = 12;
  const laneX = fx + innerPad;
  const laneW = frameW - innerPad * 2;
  const drawBubW = Math.max(60, Math.round((laneW * simCap) / 100));

  const samples =
    simMode === "two"
      ? [
          { side: "left", name: "设计师", lines: 2, color: "#EBF4FF", stroke: "#5B95F9" },
          { side: "right", name: "阅读者", lines: 2, color: "#FFF0E2", stroke: "#FE754F" },
          { side: "left", name: "设计师", lines: 2, color: "#EBF4FF", stroke: "#5B95F9" },
          { side: "right", name: "阅读者", lines: 2, color: "#FFF0E2", stroke: "#FE754F" },
        ]
      : simMode === "group"
      ? [
          { side: "left", name: "林 · 交互", lines: 1, color: "#EBF4FF", stroke: "#5B95F9" },
          { side: "left", name: "陈 · 研发", lines: 2, color: "#E6F4F1", stroke: "#48B59B" },
          { side: "right", name: "我（唯一右轨）", lines: 1, color: "#FFF0E2", stroke: "#FE754F" },
          { side: "left", name: "周 · 视觉", lines: 2, color: "#F1ECFF", stroke: "#9982F5" },
        ]
      : [
          { side: "right", name: "我 · 短提问", lines: 1, color: "#FFF0E2", stroke: "#FE754F", narrow: true },
          { side: "full", name: "AI 助手 · 宽栏结构化回答（含对照表）", lines: 4, color: "#172B60", stroke: "#69A3FF" },
          { side: "right", name: "我 · 追问", lines: 1, color: "#FFF0E2", stroke: "#FE754F", narrow: true },
        ];

  let curY = fy + 38;
  const centers = [];

  for (const s of samples) {
    const bw = s.side === "full" ? drawBubW : s.narrow ? Math.min(drawBubW, laneW * 0.56) : drawBubW;
    const bh = 22 + s.lines * 13;
    const bx = s.side === "right" ? laneX + laneW - bw : laneX;
    if (curY + bh > fy + frameH - 12) break;

    ctx.fillStyle = s.color;
    ctx.strokeStyle = s.stroke;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(bx, curY, bw, bh, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = s.side === "full" ? "#DCEBFF" : "#091334";
    ctx.font = '700 10.5px "Noto Sans SC", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(s.name, bx + 9, curY + 15);

    // 模拟文本横条
    for (let l = 0; l < s.lines; l++) {
      const lw = Math.max(24, (bw - 18) * (l === s.lines - 1 ? 0.68 : 0.94));
      ctx.fillStyle = s.side === "full" ? "rgba(180,206,247,0.45)" : "rgba(18,34,76,0.28)";
      ctx.fillRect(bx + 9, curY + 22 + l * 11, lw, 5);
    }

    centers.push({ x: bx + bw / 2, y: curY + bh / 2 });
    curY += bh + 12;
  }

  // 画眼动跨度参考线
  if (centers.length >= 2 && simMode !== "ai") {
    ctx.save();
    ctx.strokeStyle = res.tone === "warn" ? "rgba(255,154,144,0.85)" : "rgba(108,227,196,0.72)";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    centers.forEach((c, i) => (i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y)));
    ctx.stroke();
    ctx.restore();
  }

  // 底沿水平标尺注记
  ctx.fillStyle = "#B3C6EA";
  ctx.font = '600 11px "Manrope", "Noto Sans SC", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(
    simMode === "ai"
      ? `宽栏阅读模式 · 气泡展开至 ${res.bubbleW}px（约 ${res.charsPerLine} 字/行）`
      : `左右中心眼动跨度约 ${res.saccadeSpanPx}px · 约 ${res.charsPerLine} 字/行`,
    w / 2,
    h - 8
  );

  // 更新右侧实测结论
  elSimCapVal.textContent = `${simCap}%`;
  elSimVerdict.innerHTML = `
    <span class="sim-verdict-badge ${res.tone === "warn" ? "is-warn" : ""}">${res.verdict}</span>
    <p>${res.detail}</p>
    <div class="sim-nums">
      <div class="sim-num-cell"><span>实绘气泡宽</span><strong>${res.bubbleW} px</strong></div>
      <div class="sim-num-cell"><span>约每行字数</span><strong>${res.charsPerLine} 字</strong></div>
      <div class="sim-num-cell"><span>横向眼动</span><strong>${res.saccadeSpanPx} px</strong></div>
    </div>
  `;
}

$$("[data-sim-mode]").forEach((b) =>
  b.addEventListener("click", () => {
    simMode = b.dataset.simMode;
    $$("[data-sim-mode]").forEach((x) => x.classList.toggle("is-active", x === b));
    if (simMode === "ai" && simCap < 72) {
      simCap = 82;
      elSimCapRange.value = "82";
    }
    drawSimCanvas();
  })
);

$$("[data-sim-vp]").forEach((b) =>
  b.addEventListener("click", () => {
    simVp = Number(b.dataset.simVp);
    $$("[data-sim-vp]").forEach((x) => x.classList.toggle("is-active", x === b));
    drawSimCanvas();
  })
);

elSimCapRange.addEventListener("input", () => {
  simCap = Number(elSimCapRange.value);
  drawSimCanvas();
});

// =========================================================================
// 04 节：五个历史年代标本机
// =========================================================================
const elEraNav = $("#era-nav");
const elEraStory = $("#era-story");
const elEraMock = $("#era-mockup");
const elEraMockCap = $("#era-mock-cap");

function renderEra(eraId) {
  const era = HISTORY_ERAS.find((x) => x.id === eraId) || HISTORY_ERAS[0];
  elEraNav.innerHTML = HISTORY_ERAS.map(
    (e) => `<button type="button" class="era-btn${e.id === era.id ? " is-active" : ""}" data-era="${e.id}" role="tab" aria-selected="${e.id === era.id}">
      <strong>${e.year}</strong>
      <span>${e.title}</span>
    </button>`
  ).join("");

  elEraStory.innerHTML = `
    <span class="era-year-tag">${era.year} · ${era.sub}</span>
    <h3>${era.title}</h3>
    <p>${era.fact}</p>
    <p class="era-lesson">${era.layoutNote}</p>
  `;

  elEraMock.className = `era-mockup m-${era.id}`;
  elEraMockCap.textContent = `${era.year} 界面形态还原 · 同一段问答`;

  if (era.id === "1974") {
    elEraMock.innerHTML = `
      <div style="font-size:13px;color:#6E5A42">Language Vol. 50, No. 4 (1974) · 相邻对标注</div>
      <div><strong>01 A（提问 TCU）：</strong>今天下午三点评审改稿吗？</div>
      <div style="padding-left:18px;color:#B13812">→ <strong>TRP 转换相关位置</strong>（提问点名下一发言人）</div>
      <div><strong>02 B（回应 TCU）：</strong>好，三点会议室见。</div>
    `;
  } else if (era.id === "1983") {
    elEraMock.innerHTML = `
      <div class="talk-pane"><div>[上半屏 · 你正在敲字]</div><div>今天下午三点评审改稿吗？_</div></div>
      <div class="talk-div">══════════ 4.2BSD talk 水平分隔线 ══════════</div>
      <div class="talk-pane"><div>[下半屏 · 对方实时同步]</div><div>好，三点会议室见。_</div></div>
    `;
  } else if (era.id === "1988") {
    elEraMock.innerHTML = `
      <div>*** Joined channel #layout (RFC 1459)</div>
      <div>[14:02] &lt;designer&gt; 今天下午三点评审改稿吗？</div>
      <div>[14:02] &lt;reader&gt; 好，三点会议室见。</div>
      <div>[14:03] &lt;designer&gt; 我把气泡稿提前发你。</div>
    `;
  } else if (era.id === "2002") {
    elEraMock.innerHTML = `
      <div class="aqua-b"><strong>设计师：</strong>今天下午三点评审改稿吗？</div>
      <div class="aqua-b is-r"><strong>阅读者：</strong>好，三点会议室见。</div>
      <div class="aqua-thought">○ ○ 对方正在输入思考泡（1997 草图 → 2002 iChat）</div>
    `;
  } else {
    elEraMock.innerHTML = `
      <div class="sms-b">今天下午三点评审改稿吗？</div>
      <div class="sms-b is-r">好，三点会议室见。</div>
      <div class="sms-b">告别收件箱/发件箱割裂，按联系人连续成串。</div>
    `;
  }
}

elEraNav.addEventListener("click", (e) => {
  const b = e.target.closest("[data-era]");
  if (b) renderEra(b.dataset.era);
});

// =========================================================================
// 05 节：场景分诊矩阵
// =========================================================================
const elTriageGrid = $("#triage-grid");

function renderTriage(filter = "all") {
  $$("[data-triage]").forEach((b) => b.classList.toggle("is-active", b.dataset.triage === filter));
  const list = filter === "all" ? TRIAGE_CASES : TRIAGE_CASES.filter((c) => c.verdict === filter);
  elTriageGrid.innerHTML = list
    .map(
      (c) => `<article class="triage-card is-${c.verdict}">
        <div class="triage-head">
          <span class="verdict-chip">${c.verdictLabel}</span>
          <span class="poster-mini-tag">${c.posterTag}</span>
        </div>
        <h3>${c.title}</h3>
        <p>${c.why}</p>
        ${
          c.alt
            ? `<div class="alt-link-box">更稳妥的替代：<a href="${c.alt.url}" target="_blank" rel="noopener">${c.alt.num} ${c.alt.name} →</a></div>`
            : `<div class="alt-link-box" style="color:#0d735c">贴合左右轮次与成对呼吸节奏</div>`
        }
      </article>`
    )
    .join("");
}

$$("[data-triage]").forEach((b) => b.addEventListener("click", () => renderTriage(b.dataset.triage)));

// =========================================================================
// 06 节：眼力小练习（中性选项，单变量对比）
// =========================================================================
let activeQuizIdx = 0;
const quizAnswers = {};
const elQuizPrompt = $("#quiz-prompt");
const elQuizGrid = $("#quiz-grid");
const elQuizFeedback = $("#quiz-feedback");
const elQuizScore = $("#quiz-score");

function miniPreviewHtml(kind) {
  if (kind === "inverted") {
    return `<div class="mini-chat-preview">
      <div class="mq-row"><div class="mq-bub" style="width:62%">气泡作用是什么？</div></div>
      <div class="mq-row is-r" style="margin-top:24px"><div class="mq-bub is-peach" style="width:62%">区分角色与语气。</div></div>
      <div class="mq-row" style="margin-top:6px"><div class="mq-bub" style="width:62%">行宽怎么控？</div></div>
      <div class="mq-row is-r" style="margin-top:24px"><div class="mq-bub is-peach" style="width:62%">留出对向呼吸白。</div></div>
    </div>`;
  }
  if (kind === "uniform") {
    return `<div class="mini-chat-preview">
      <div class="mq-row"><div class="mq-bub" style="width:62%">气泡作用是什么？</div></div>
      <div class="mq-row is-r" style="margin-top:14px"><div class="mq-bub is-peach" style="width:62%">区分角色与语气。</div></div>
      <div class="mq-row" style="margin-top:14px"><div class="mq-bub" style="width:62%">行宽怎么控？</div></div>
      <div class="mq-row is-r" style="margin-top:14px"><div class="mq-bub is-peach" style="width:62%">留出对向呼吸白。</div></div>
    </div>`;
  }
  if (kind === "ideal") {
    return `<div class="mini-chat-preview">
      <div class="mq-row"><div class="mq-bub" style="width:62%">气泡作用是什么？</div></div>
      <div class="mq-row is-r" style="margin-top:7px"><div class="mq-bub is-peach" style="width:62%">区分角色与语气。</div></div>
      <div class="mq-row" style="margin-top:24px"><div class="mq-bub" style="width:62%">行宽怎么控？</div></div>
      <div class="mq-row is-r" style="margin-top:7px"><div class="mq-bub is-peach" style="width:62%">留出对向呼吸白。</div></div>
    </div>`;
  }
  if (kind === "wide") {
    return `<div class="mini-chat-preview">
      <div class="mq-row"><div class="mq-bub" style="width:93%">气泡作用是什么？</div></div>
      <div class="mq-row is-r" style="margin-top:7px"><div class="mq-bub is-peach" style="width:93%">区分角色与语气。</div></div>
      <div class="mq-row" style="margin-top:24px"><div class="mq-bub" style="width:93%">行宽怎么控？</div></div>
      <div class="mq-row is-r" style="margin-top:7px"><div class="mq-bub is-peach" style="width:93%">留出对向呼吸白。</div></div>
    </div>`;
  }
  if (kind === "zigzag_group") {
    return `<div class="mini-chat-preview">
      <div class="mq-row"><div class="mq-bub" style="width:68%"><span class="mq-sender">林</span>初稿已上传。</div></div>
      <div class="mq-row is-r" style="margin-top:8px"><div class="mq-bub is-peach" style="width:68%"><span class="mq-sender">陈</span>我来看间距。</div></div>
      <div class="mq-row" style="margin-top:8px"><div class="mq-bub" style="width:68%"><span class="mq-sender">陈</span>第 3 屏偏挤。</div></div>
      <div class="mq-row is-r" style="margin-top:8px"><div class="mq-bub is-peach" style="width:68%"><span class="mq-sender">我</span>收到，马上调。</div></div>
    </div>`;
  }
  if (kind === "group_ideal") {
    return `<div class="mini-chat-preview">
      <div class="mq-row"><div class="mq-bub" style="width:68%"><span class="mq-sender">林 · 交互</span>初稿已上传。</div></div>
      <div class="mq-row" style="margin-top:8px"><div class="mq-bub" style="width:68%"><span class="mq-sender">陈 · 研发</span>第 3 屏偏挤。</div></div>
      <div class="mq-row" style="margin-top:8px"><div class="mq-bub" style="width:68%"><span class="mq-sender">周 · 视觉</span>宽屏要封顶。</div></div>
      <div class="mq-row is-r" style="margin-top:10px"><div class="mq-bub is-peach" style="width:62%"><span class="mq-sender">我</span>收到，马上调。</div></div>
    </div>`;
  }
  if (kind === "group_anon") {
    return `<div class="mini-chat-preview">
      <div class="mq-row"><div class="mq-bub" style="width:72%">初稿已上传。</div></div>
      <div class="mq-row" style="margin-top:8px"><div class="mq-bub" style="width:72%">第 3 屏偏挤。</div></div>
      <div class="mq-row" style="margin-top:8px"><div class="mq-bub" style="width:72%">宽屏要封顶。</div></div>
      <div class="mq-row" style="margin-top:8px"><div class="mq-bub" style="width:72%">收到，马上调。</div></div>
    </div>`;
  }
  return `<div class="mini-chat-preview">
    <div class="mq-row"><div class="mq-bub is-c1" style="width:70%">林：初稿已上传。</div></div>
    <div class="mq-row is-r" style="margin-top:8px"><div class="mq-bub is-c2" style="width:70%">陈：第 3 屏偏挤。</div></div>
    <div class="mq-row" style="margin-top:8px"><div class="mq-bub is-c3" style="width:70%">周：宽屏要封顶。</div></div>
    <div class="mq-row is-r" style="margin-top:8px"><div class="mq-bub is-peach" style="width:70%">我：收到，马上调。</div></div>
  </div>`;
}

function renderQuiz() {
  const q = QUIZ_QUESTIONS[activeQuizIdx];
  const picked = quizAnswers[q.id];
  const answeredCount = Object.keys(quizAnswers).length;
  const correctCount = QUIZ_QUESTIONS.filter((x) => quizAnswers[x.id] === x.correct).length;

  $$("[data-quiz]").forEach((b) => {
    const on = Number(b.dataset.quiz) === activeQuizIdx;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });

  elQuizScore.textContent = answeredCount ? `已答 ${answeredCount} / 2 题 · 答对 ${correctCount} 题` : "已答 0 / 2 题";
  elQuizPrompt.textContent = q.prompt;

  elQuizGrid.innerHTML = q.options
    .map((o) => {
      let cls = "";
      let mark = "";
      if (picked) {
        if (o.key === q.correct) {
          cls = " is-right";
          mark = "✓ 正解";
        } else if (o.key === picked) {
          cls = " is-wrong";
          mark = "× 偏差";
        }
      }
      return `<button type="button" class="quiz-opt${cls}" data-pick="${o.key}">
        <div class="quiz-opt-head">
          <span class="quiz-opt-label">${o.label}</span>
          <span class="quiz-opt-mark">${mark}</span>
        </div>
        ${miniPreviewHtml(o.kind)}
      </button>`;
    })
    .join("");

  if (!picked) {
    elQuizFeedback.className = "quiz-feedback";
    elQuizFeedback.textContent = "点击上面四张预览卡中的任意一张作答，选后会拆解它只差哪一个结构变量。";
  } else {
    const opt = q.options.find((o) => o.key === picked);
    const isOk = picked === q.correct;
    elQuizFeedback.className = `quiz-feedback ${isOk ? "is-right" : "is-wrong"}`;
    elQuizFeedback.textContent = opt.feedback;
  }
}

$$("[data-quiz]").forEach((b) =>
  b.addEventListener("click", () => {
    activeQuizIdx = Number(b.dataset.quiz);
    renderQuiz();
  })
);

elQuizGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-pick]");
  if (!btn) return;
  const q = QUIZ_QUESTIONS[activeQuizIdx];
  quizAnswers[q.id] = btn.dataset.pick;
  renderQuiz();
});

// =========================================================================
// 07 节：原海报看图器（只复用 #poster.src，不重复内联）
// =========================================================================
const elLightbox = $("#lightbox");
const elLbImg = $("#lb-img");
const elLbStage = $("#lb-stage");
const elLbScale = $("#lb-scale");
let lbZoom = 1;
let lbPanX = 0;
let lbPanY = 0;
let lbDrag = null;

function applyLbTransform() {
  elLbImg.style.transform = `translate(${lbPanX}px, ${lbPanY}px) scale(${lbZoom})`;
  elLbScale.textContent = `${Math.round(lbZoom * 100)}%`;
}

function openLightbox() {
  elLbImg.src = $("#poster").src;
  lbZoom = 1;
  lbPanX = 0;
  lbPanY = 0;
  applyLbTransform();
  elLightbox.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  elLightbox.hidden = true;
  $("#poster-open").focus();
}

$("#poster-open").addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => {
  lbZoom = clamp(lbZoom + 0.4, 1, 3);
  applyLbTransform();
});
$("#lb-zoom-out").addEventListener("click", () => {
  lbZoom = clamp(lbZoom - 0.4, 1, 3);
  if (lbZoom === 1) {
    lbPanX = 0;
    lbPanY = 0;
  }
  applyLbTransform();
});
$("#lb-reset").addEventListener("click", () => {
  lbZoom = 1;
  lbPanX = 0;
  lbPanY = 0;
  applyLbTransform();
});

elLbStage.addEventListener("pointerdown", (e) => {
  lbDrag = { x: e.clientX - lbPanX, y: e.clientY - lbPanY };
  elLbStage.classList.add("is-dragging");
  elLbStage.setPointerCapture?.(e.pointerId);
});
elLbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbPanX = e.clientX - lbDrag.x;
  lbPanY = e.clientY - lbDrag.y;
  applyLbTransform();
});
const endLbDrag = () => {
  lbDrag = null;
  elLbStage.classList.remove("is-dragging");
};
elLbStage.addEventListener("pointerup", endLbDrag);
elLbStage.addEventListener("pointercancel", endLbDrag);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !elLightbox.hidden) closeLightbox();
});

// ---------- 初始化与窗口缩放同步 ----------
let resizeRaf = 0;
window.addEventListener("resize", () => {
  if (resizeRaf) return;
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = 0;
    if (lastEval) {
      drawRuler(lastEval);
      measureRowBoxes();
      heroLoop.draw();
    }
    drawSimCanvas();
  });
});

renderHeroUI(true);
renderXray("dialog");
renderAnatomy();
drawSimCanvas();
renderEra("1974");
renderTriage("all");
renderQuiz();

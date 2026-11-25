import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  VIEWPORT_MIN,
  VIEWPORT_MAX,
  SAMPLE_DEVICES,
  WIDTH_CHOICES,
  THEMES,
  MATRIX_MODULES,
  MATRIX_DEFAULT,
  TIMELINE,
  SCENARIOS,
  QUIZ_OPTIONS,
  createInitialState,
  clonePreset,
  calcColWidth,
  resolveAtViewport,
  evaluateState,
  evalCompare,
  evalMatrixTier,
  evalDelivery,
  evalQuizOption,
} from "./model.js";

// ---------- 工具 ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function glyphSvg(shape) {
  if (shape === "square-blue") {
    return `<svg viewBox="0 0 36 36" aria-hidden="true"><rect x="4" y="4" width="28" height="28" fill="#123ACC"/></svg>`;
  }
  if (shape === "circle-black") {
    return `<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="14" fill="#070504"/></svg>`;
  }
  if (shape === "tri-blue") {
    return `<svg viewBox="0 0 36 36" aria-hidden="true"><polygon points="18,4 33,32 3,32" fill="#123ACC"/></svg>`;
  }
  return `<svg viewBox="0 0 36 36" aria-hidden="true"><rect x="4" y="4" width="28" height="28" fill="#070504"/></svg>`;
}

// ---------- 主状态与单真源渲染 ----------
let state = createInitialState();
let mobileFocusTier = "M";
let lastStructKey = "";
let railDirty = true;
let introDone = reducedMotion.matches;
let introProgress = introDone ? 1 : 0;

// 开场 DOM 缓存
const heroEl = $(".hero");
const topBadge = $("#top-badge");
const titleChip = $("#title-tier-chip");
const railCanvas = $("#rail-canvas");
const railRead = $("#rail-read");
const diagPanel = $(".diag-panel");
const diagBadge = $("#diag-badge");
const diagTitle = $("#diag-title");
const diagBody = $("#diag-body");
const diagTip = $("#diag-tip");
const mHit = $("#m-hit");
const mOv = $("#m-ov");
const mCov = $("#m-cov");
const mCols = $("#m-cols");
const slTm = $("#sl-tm");
const slTl = $("#sl-tl");
const valTm = $("#val-tm");
const valTl = $("#val-tl");
const lblTm = $("#lbl-tm");
const lblTl = $("#lbl-tl");
const liveCode = $("#live-code");

function renderTemplateCards(ev) {
  const theme = THEMES[state.theme] || THEMES.poster;
  const tiers = ["S", "M", "L"];

  // 窄屏聚焦跟随当前命中（或用户手动切签）
  if (ev.current.tier !== mobileFocusTier && !manualTabHold) {
    mobileFocusTier = ev.current.tier;
  }

  for (const t of tiers) {
    const tpl = state.templates[t];
    const slot = $(`#slot-${t}`);
    const hitBadge = $(`#hit-${t}`);
    const pxEl = $(`#px-${t}`);
    const navEl = $(`#nav-${t}`);
    const bannerEl = $(`#banner-${t}`);
    const gridEl = $(`#grid-${t}`);
    const ovEl = $(`#ov-${t}`);
    const colBtn = $(`[data-cycle-cols="${t}"]`, slot);
    const navBtn = $(`[data-toggle-nav="${t}"]`, slot);
    const colMeta = $(`#colmeta-${t}`);

    pxEl.textContent = `${tpl.width}px`;
    const isHit = state.mode === "stepped" && ev.current.tier === t;
    const isStretchedHit = state.mode === "stretch" && t === "L";
    const isOverflowHere = isHit && ev.current.overflow > 0;

    slot.classList.toggle("is-hit", isHit || isStretchedHit);
    slot.classList.toggle("is-dim", !(isHit || isStretchedHit));
    slot.classList.toggle("is-overflow", isOverflowHere);
    slot.classList.toggle("is-mobile-show", mobileFocusTier === t);

    if (isStretchedHit) {
      hitBadge.textContent = `硬拉 ${Math.round(ev.current.scale * 100)}%`;
    } else if (isOverflowHere) {
      hitBadge.textContent = `溢出 +${ev.current.overflow}px`;
    } else if (isHit) {
      hitBadge.textContent = `命中 · ${state.viewport}px`;
    } else {
      hitBadge.textContent = "待命";
    }

    // 模板导航
    const navBad = (t === "S" && tpl.nav === "bar") || (t === "L" && tpl.nav === "burger");
    if (tpl.nav === "burger") {
      navEl.innerHTML = `<span class="nav-burger" aria-hidden="true"><i></i><i></i><i></i></span>`;
    } else {
      navEl.innerHTML = `<span class="nav-links${t === "S" ? " is-cramped" : ""}">${theme.navItems.map((n) => `<span>${n}</span>`).join("")}</span>`;
    }

    // 题材横幅
    bannerEl.innerHTML = `<b class="tb-title">${theme.heroTitle}</b><span class="tb-sub">${theme.heroSub}</span>`;

    // 卡片网格（单列实宽）
    const colW = calcColWidth(tpl.width, tpl.cols);
    const colBad =
      (t === "S" && colW < 118) ||
      (t === "M" && (colW < 190 || colW > 400)) ||
      (t === "L" && (colW > 420 || colW < 210));

    gridEl.className = `tpl-grid cols-${tpl.cols}`;
    const count = tpl.cols;
    let html = "";
    for (let i = 0; i < count; i++) {
      const card = theme.cards[i % theme.cards.length];
      html += `<div class="tpl-item${colBad ? " is-bad" : ""}">
        <div class="tpl-glyph">${glyphSvg(card.shape)}</div>
        <span class="tpl-it-title">${card.title}</span>
        <span class="tpl-it-sub">${card.sub}</span>
      </div>`;
    }
    gridEl.innerHTML = html;

    if (colMeta) {
      colMeta.textContent = `单列 ${colW}px`;
      colMeta.classList.toggle("is-bad", colBad);
    }
    colBtn.textContent = `${tpl.cols} 列 · 换`;
    colBtn.classList.toggle("is-bad", colBad);
    navBtn.textContent = tpl.nav === "burger" ? "折叠导航" : "展开顶栏";
    navBtn.classList.toggle("is-bad", navBad);

    if (isOverflowHere) {
      ovEl.hidden = false;
      ovEl.textContent = `视口 ${state.viewport}px < 模板 ${tpl.width}px：右侧溢出 +${ev.current.overflow}px`;
    } else if (isStretchedHit) {
      ovEl.hidden = false;
      ovEl.textContent = `硬拉伸模式：把 ${tpl.width}px 模板直接缩成 ${Math.round(ev.current.scale * 100)}%`;
    } else {
      ovEl.hidden = true;
    }
  }

  // 更新手机切槽状态
  for (const btn of $$(".mtab")) {
    btn.setAttribute("aria-selected", String(btn.dataset.focusTier === mobileFocusTier));
  }

  // 更新卡间门槛数字与警示状态
  const gM = $("#gate-M");
  const gL = $("#gate-L");
  $("#gate-M-val").textContent = `${state.tM}`;
  $("#gate-L-val").textContent = `${state.tL}`;
  gM.classList.toggle("is-bad", state.tM < state.templates.M.width || ev.inverted);
  gL.classList.toggle("is-bad", state.tL < state.templates.L.width || ev.inverted);
}

// 轻量高频更新（拖动视口指针时只改必要的读数与高亮，不重造整棵卡片子树）
function syncUI(forceCards = false) {
  const ev = evaluateState(state);
  railDirty = true;

  // 决定是否需要重绘模板卡片内部 DOM
  const structKey = [
    state.theme,
    state.mode,
    ev.current.tier,
    ev.current.overflow > 0 ? 1 : 0,
    state.tM,
    state.tL,
    state.templates.S.width, state.templates.S.cols, state.templates.S.nav,
    state.templates.M.width, state.templates.M.cols, state.templates.M.nav,
    state.templates.L.width, state.templates.L.cols, state.templates.L.nav,
    mobileFocusTier,
  ].join("|");

  if (forceCards || structKey !== lastStructKey) {
    lastStructKey = structKey;
    renderTemplateCards(ev);
  } else {
    // 仅刷新命中卡上的当前视口像素文字
    const t = state.mode === "stretch" ? "L" : ev.current.tier;
    const hitBadge = $(`#hit-${t}`);
    const ovEl = $(`#ov-${t}`);
    if (state.mode === "stretch") {
      hitBadge.textContent = `硬拉 ${Math.round(ev.current.scale * 100)}%`;
      ovEl.hidden = false;
      ovEl.textContent = `硬拉伸模式：把 ${state.templates.L.width}px 模板直接缩成 ${Math.round(ev.current.scale * 100)}%`;
    } else if (ev.current.overflow > 0) {
      hitBadge.textContent = `溢出 +${ev.current.overflow}px`;
      ovEl.hidden = false;
      ovEl.textContent = `视口 ${state.viewport}px < 模板 ${ev.current.templateWidth}px：右侧溢出 +${ev.current.overflow}px`;
    } else {
      hitBadge.textContent = `命中 · ${state.viewport}px`;
      ovEl.hidden = true;
    }
  }

  // 标题态与顶眉徽章
  heroEl.classList.toggle("is-stepped", state.mode === "stepped");
  heroEl.classList.toggle("is-stretch", state.mode === "stretch");

  topBadge.textContent = ev.passedCount === 4 ? "4 / 4 换装就绪" : `${ev.passedCount} / 4 待校模板`;
  topBadge.classList.toggle("is-ok", ev.passedCount === 4);

  const tierLabel = state.mode === "stretch"
    ? `硬拉伸 ${Math.round(ev.current.scale * 100)}%`
    : ev.current.overflow > 0
    ? `${ev.current.tier} 档溢出 +${ev.current.overflow}px`
    : `命中 ${ev.current.tier} 档 ${ev.current.templateWidth}px`;
  titleChip.textContent = `当前 · ${state.viewport}px ${tierLabel}`;
  titleChip.classList.toggle("is-ok", ev.passedCount === 4);

  // 示波轨右上读数
  railRead.textContent = `VP ${state.viewport}px → ${tierLabel}`;
  railRead.className = `rail-read ${ev.current.overflow > 0 || state.mode === "stretch" ? "is-bad" : ev.passedCount === 4 ? "is-ok" : ""}`;
  railCanvas.setAttribute("aria-valuenow", String(state.viewport));

  // 6 台抽样设备按钮状态
  for (const btn of $$(".dev-btn")) {
    const w = Number(btn.dataset.vp);
    const s = ev.samples.find((x) => x.width === w);
    btn.classList.toggle("is-active", Math.abs(state.viewport - w) <= 4);
    btn.classList.toggle("is-overflow", !!(s && s.res.overflow > 0));
    btn.classList.toggle("is-gap", !!(s && s.res.overflow === 0 && s.res.coverage < 0.68 && state.mode === "stepped"));
  }

  // 单真源白话诊单
  diagPanel.classList.toggle("is-ok", ev.primary.ok);
  diagBadge.className = `diag-badge ${ev.primary.ok ? "is-ok" : "is-bad"}`;
  diagBadge.textContent = ev.primary.badge;
  diagTitle.textContent = ev.primary.title;
  diagBody.textContent = ev.primary.body;
  diagTip.textContent = ev.primary.action;

  mHit.textContent = state.mode === "stretch"
    ? `${state.viewport}px → 硬拉`
    : `${state.viewport}px → ${ev.current.tier} (${ev.current.templateWidth}px)`;
  mHit.className = state.mode === "stretch" || ev.current.overflow > 0 ? "is-bad" : "is-ok";

  mOv.textContent = ev.maxZoneOverflow > 0 ? `+${ev.maxZoneOverflow}px` : "0px 无溢出";
  mOv.className = ev.maxZoneOverflow > 0 || ev.inverted ? "is-bad" : "is-ok";

  mCov.textContent = state.mode === "stretch" ? "强拉失真" : `${ev.minCoveragePct}% (${ev.minSample.width}px)`;
  mCov.className = ev.checks.coverage && state.mode === "stepped" ? "is-ok" : "is-bad";

  mCols.textContent = `${ev.colS} / ${ev.colM} / ${ev.colL}px`;
  mCols.className = ev.checks.tailored ? "is-ok" : "is-bad";

  // 控槽数值与状态
  for (const b of $$("[data-mode]")) {
    const isThis = b.dataset.mode === state.mode;
    b.classList.toggle("is-on", isThis && state.mode === "stepped");
    b.classList.toggle("is-bad", isThis && state.mode === "stretch");
  }
  for (const b of $$("[data-theme]")) {
    b.classList.toggle("is-on", b.dataset.theme === state.theme);
  }
  slTm.value = String(state.tM);
  slTl.value = String(state.tL);
  valTm.textContent = `${state.tM}px`;
  valTl.textContent = `${state.tL}px`;
  lblTm.textContent = `${state.tM}px（须 ≥ ${state.templates.M.width}）`;
  lblTl.textContent = `${state.tL}px（须 ≥ ${state.templates.L.width}）`;
  $("#wb-S").textContent = String(state.templates.S.width);
  $("#wb-M").textContent = String(state.templates.M.width);
  $("#wb-L").textContent = String(state.templates.L.width);

  // 实时生成规则预览（和当前状态严格同步）
  if (state.mode === "stretch") {
    liveCode.textContent =
`/* [!] 伪自适应：单套定宽模板强行缩放 */
.shell { width: ${state.templates.L.width}px; transform: scale(${ev.current.scale.toFixed(2)}); }`;
  } else {
    const mWarn = state.tM < state.templates.M.width ? ` /* [!] < ${state.templates.M.width}px 溢出 */` : "";
    const lWarn = state.tL < state.templates.L.width ? ` /* [!] < ${state.templates.L.width}px 溢出 */` : "";
    liveCode.textContent =
`.shell { width: ${state.templates.S.width}px; grid-cols: ${state.templates.S.cols}; }
@media (min-width: ${state.tM}px) { .shell { width: ${state.templates.M.width}px; cols: ${state.templates.M.cols}; } }${mWarn}
@media (min-width: ${state.tL}px) { .shell { width: ${state.templates.L.width}px; cols: ${state.templates.L.cols}; } }${lWarn}`;
  }

  // 原海报底沿三支柱实况同步
  const pilPreset = $("#pil-preset");
  const pilSwitch = $("#pil-switch");
  const pilTarget = $("#pil-target");
  const psPreset = $("#ps-preset");
  const psSwitch = $("#ps-switch");
  const psTarget = $("#ps-target");

  const presetOk = ev.checks.coverage && !ev.inverted;
  const switchOk = ev.checks.discrete && ev.checks.noOverflow;
  const targetOk = ev.checks.tailored;

  pilPreset.classList.toggle("is-ok", presetOk);
  pilSwitch.classList.toggle("is-ok", switchOk);
  pilTarget.classList.toggle("is-ok", targetOk);

  psPreset.textContent =
    state.mode === "stretch"
      ? "当前硬拉伸 · 未启三档"
      : presetOk
      ? `6 屏最低占宽 ${ev.minCoveragePct}% ✓`
      : `最低占宽 ${ev.minCoveragePct}% · 有断档`;
  psSwitch.textContent = switchOk
    ? `阶梯跳档 · 0 溢出 ✓`
    : !ev.checks.discrete
    ? "当前硬拉伸 · 未换模板"
    : `门槛溢出 +${ev.maxZoneOverflow}px`;
  psTarget.textContent = targetOk
    ? `${state.templates.S.cols} / ${state.templates.M.cols} / ${state.templates.L.cols} 列定制就绪 ✓`
    : "列数或导航未按屏定制";
}

// ---------- 2D Canvas：阶梯响应示波轨（原海报贯穿白虚线 + 白环黑芯节点升格版） ----------
const railCtx = railCanvas.getContext("2d");
let railLayout = { padL: 38, padR: 20, padT: 16, padB: 26, w: 300, h: 116 };

function vpToX(vp) {
  const { padL, padR, w } = railLayout;
  return padL + ((vp - VIEWPORT_MIN) / (VIEWPORT_MAX - VIEWPORT_MIN)) * (w - padL - padR);
}
function xToVp(x) {
  const { padL, padR, w } = railLayout;
  const ratio = clamp((x - padL) / Math.max(1, w - padL - padR), 0, 1);
  return Math.round((VIEWPORT_MIN + ratio * (VIEWPORT_MAX - VIEWPORT_MIN)) / 2) * 2;
}
function twToY(tw) {
  const { padT, padB, h } = railLayout;
  const ratio = clamp((tw - 200) / (1440 - 200), 0, 1);
  return h - padB - ratio * (h - padT - padB);
}

function drawRailCanvas() {
  const rect = railCanvas.getBoundingClientRect();
  if (rect.width < 20 || rect.height < 20) return;
  const dpr = pixelRatio(2);
  const cw = Math.round(rect.width * dpr);
  const ch = Math.round(rect.height * dpr);
  if (railCanvas.width !== cw || railCanvas.height !== ch) {
    railCanvas.width = cw;
    railCanvas.height = ch;
  }
  railLayout = { padL: 44, padR: 18, padT: 14, padB: 24, w: rect.width, h: rect.height };
  const ctx = railCtx;
  ctx.save();
  ctx.scale(dpr, dpr);

  const { padL, padR, padT, padB, w, h } = railLayout;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const baseLineY = h - padB;

  // 背景漆黑
  ctx.fillStyle = "#0B0908";
  ctx.fillRect(0, 0, w, h);

  // 细参考格线（320 / 768 / 1200 水平模板高度线）
  ctx.font = `600 10px "JetBrains Mono", monospace`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const refW of [320, 768, 1200]) {
    const y = twToY(refW);
    ctx.strokeStyle = "rgba(244, 232, 209, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();
    ctx.fillStyle = "rgba(244, 232, 209, 0.65)";
    ctx.fillText(`${refW}`, padL - 6, y);
  }

  // y = x 流体斜线（虚线参照：超过这条线的上方区域即 templateWidth > viewport → 溢出红区！）
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(vpToX(VIEWPORT_MIN), twToY(VIEWPORT_MIN));
  ctx.lineTo(vpToX(VIEWPORT_MAX), twToY(VIEWPORT_MAX));
  ctx.lineTo(vpToX(VIEWPORT_MIN), padT);
  ctx.closePath();
  ctx.fillStyle = "rgba(180, 28, 28, 0.14)";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(244, 232, 209, 0.42)";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(vpToX(VIEWPORT_MIN), twToY(VIEWPORT_MIN));
  ctx.lineTo(vpToX(VIEWPORT_MAX), twToY(VIEWPORT_MAX));
  ctx.stroke();
  ctx.restore();

  // 画出阶梯函数曲线（受 introProgress 控制左向右展开）
  const maxDrawX = padL + plotW * introProgress;
  ctx.save();
  ctx.beginPath();
  ctx.rect(padL - 2, 0, Math.max(0, maxDrawX - padL + 4), h);
  ctx.clip();

  if (state.mode === "stretch") {
    // 伪自适应：贴着斜线硬拉（带红色虚警）
    ctx.strokeStyle = "#FF8A7A";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(vpToX(VIEWPORT_MIN), twToY(VIEWPORT_MIN));
    ctx.lineTo(vpToX(VIEWPORT_MAX), twToY(VIEWPORT_MAX));
    ctx.stroke();
  } else {
    // 真自适应阶梯方波！
    const { S, M, L } = state.templates;
    const tM = state.tM;
    const tL = state.tL;

    // 标出区间溢出红块（当 tM < M.width 或 tL < L.width）
    if (tM < tL && tM < M.width) {
      const x1 = vpToX(tM);
      const x2 = vpToX(Math.min(M.width, tL));
      ctx.fillStyle = "rgba(255, 84, 62, 0.34)";
      ctx.fillRect(x1, twToY(M.width), Math.max(2, x2 - x1), baseLineY - twToY(M.width));
    }
    if (tL < L.width) {
      const x1 = vpToX(tL);
      const x2 = vpToX(L.width);
      ctx.fillStyle = "rgba(255, 84, 62, 0.34)";
      ctx.fillRect(x1, twToY(L.width), Math.max(2, x2 - x1), baseLineY - twToY(L.width));
    }

    ctx.strokeStyle = "#F8420B";
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (tM >= tL) {
      ctx.moveTo(vpToX(VIEWPORT_MIN), twToY(S.width));
      ctx.lineTo(vpToX(tL), twToY(S.width));
      ctx.lineTo(vpToX(tL), twToY(L.width));
      ctx.lineTo(vpToX(VIEWPORT_MAX), twToY(L.width));
    } else {
      ctx.moveTo(vpToX(VIEWPORT_MIN), twToY(S.width));
      ctx.lineTo(vpToX(tM), twToY(S.width));
      ctx.lineTo(vpToX(tM), twToY(M.width));
      ctx.lineTo(vpToX(tL), twToY(M.width));
      ctx.lineTo(vpToX(tL), twToY(L.width));
      ctx.lineTo(vpToX(VIEWPORT_MAX), twToY(L.width));
    }
    ctx.stroke();
  }
  ctx.restore();

  // M / L 两道可拖拽门槛竖旗标
  for (const gate of [
    { key: "tM", val: state.tM, label: `M ${state.tM}`, bad: state.tM < state.templates.M.width || state.tM >= state.tL },
    { key: "tL", val: state.tL, label: `L ${state.tL}`, bad: state.tL < state.templates.L.width || state.tM >= state.tL },
  ]) {
    const gx = vpToX(gate.val);
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = gate.bad ? "#FF8A7A" : "#7EA2FF";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(gx, padT);
    ctx.lineTo(gx, baseLineY);
    ctx.stroke();
    ctx.restore();

    // 顶旗胶囊
    ctx.fillStyle = gate.bad ? "#B41C1C" : "#123ACC";
    const tw = 46;
    const fx = clamp(gx - tw / 2, padL, w - padR - tw);
    ctx.fillRect(fx, 2, tw, 15);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `600 10px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(gate.label, fx + tw / 2, 10);
  }

  // 原海报底沿贯穿白色虚线轨道 + 6 台设备刻度点
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(244, 232, 209, 0.78)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padL, baseLineY);
  ctx.lineTo(w - padR, baseLineY);
  ctx.stroke();
  ctx.restore();

  ctx.font = `600 10px "JetBrains Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const dev of SAMPLE_DEVICES) {
    const dx = vpToX(dev.width);
    const res = resolveAtViewport(state, dev.width);
    // 复刻原海报白环黑芯节点
    ctx.beginPath();
    ctx.arc(dx, baseLineY, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#F4E8D1";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(dx, baseLineY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = res.overflow > 0 ? "#B41C1C" : "#070504";
    ctx.fill();

    if (!(w < 440 && dev.width === 390)) {
      ctx.fillStyle = res.overflow > 0 ? "#FF8A7A" : "rgba(244, 232, 209, 0.8)";
      ctx.fillText(`${dev.width}`, dx, baseLineY + 7);
    }
  }

  // 当前来访视口活动探针（垂直亮线 + 曲线落点圆 + 大号白环黑芯手柄）
  const vx = vpToX(state.viewport);
  const cur = resolveAtViewport(state, state.viewport);
  const vy = twToY(cur.templateWidth);

  ctx.strokeStyle = "#F4E8D1";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(vx, padT);
  ctx.lineTo(vx, baseLineY);
  ctx.stroke();

  // 曲线落点圆
  ctx.beginPath();
  ctx.arc(vx, vy, 5.5, 0, Math.PI * 2);
  ctx.fillStyle = cur.overflow > 0 || state.mode === "stretch" ? "#FF8A7A" : "#5EE3B8";
  ctx.fill();
  ctx.strokeStyle = "#070504";
  ctx.lineWidth = 2;
  ctx.stroke();

  // 底部轨道大白环黑芯手柄
  ctx.beginPath();
  ctx.arc(vx, baseLineY, 8.5, 0, Math.PI * 2);
  ctx.fillStyle = "#F4E8D1";
  ctx.fill();
  ctx.strokeStyle = "#123ACC";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(vx, baseLineY, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "#070504";
  ctx.fill();

  ctx.restore();
}

// 用 lib/stage.js 的 loop() 驱动开场进场动画与按需重绘（停在屏外/隐藏标签时完全休眠）
const railLoop = loop(railCanvas, (t, dt, { still }) => {
  if (still) {
    introProgress = 1;
    introDone = true;
    drawRailCanvas();
    railDirty = false;
    return;
  }
  if (!introDone) {
    introProgress = Math.min(1, introProgress + (dt || 0.016) * 1.45);
    if (introProgress >= 1) introDone = true;
    drawRailCanvas();
    railDirty = false;
    return;
  }
  if (railDirty) {
    drawRailCanvas();
    railDirty = false;
  }
});

// 轨道交互：支持拖动视口探针、拖动 M / L 门槛旗标，兼容触屏横滑与竖滚不冲突
let dragTarget = null; // "vp" | "tM" | "tL"
let touchStartPt = null;
let manualTabHold = false;

function hitTestRail(localX, localY) {
  const xM = vpToX(state.tM);
  const xL = vpToX(state.tL);
  // 若点在顶旗区域 0–24px 内，优先抓取最近的 M / L 门槛旗标
  if (localY <= 26) {
    if (Math.abs(localX - xM) <= 26) return "tM";
    if (Math.abs(localX - xL) <= 26) return "tL";
  }
  return "vp";
}

function applyDragX(localX) {
  const vp = xToVp(localX);
  if (dragTarget === "tM") {
    state.tM = clamp(vp, 420, 1100);
    // 吸附到 M 定宽
    if (Math.abs(state.tM - state.templates.M.width) <= 8) state.tM = state.templates.M.width;
  } else if (dragTarget === "tL") {
    state.tL = clamp(vp, 880, 1440);
    if (Math.abs(state.tL - state.templates.L.width) <= 8) state.tL = state.templates.L.width;
  } else {
    state.viewport = clamp(vp, VIEWPORT_MIN, VIEWPORT_MAX);
    manualTabHold = false;
    // 靠近抽样设备宽度轻微吸附
    for (const d of SAMPLE_DEVICES) {
      if (Math.abs(state.viewport - d.width) <= 6) { state.viewport = d.width; break; }
    }
  }
  syncUI(false);
  drawRailCanvas();
  railDirty = false;
}

railCanvas.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") return; // 触屏交给 touch 事件，以便区分横拖与竖滚
  const rect = railCanvas.getBoundingClientRect();
  dragTarget = hitTestRail(e.clientX - rect.left, e.clientY - rect.top);
  railCanvas.setPointerCapture?.(e.pointerId);
  applyDragX(e.clientX - rect.left);
});

railCanvas.addEventListener("pointermove", (e) => {
  if (!dragTarget || e.pointerType === "touch") return;
  const rect = railCanvas.getBoundingClientRect();
  applyDragX(e.clientX - rect.left);
});

const endPointerDrag = () => { dragTarget = null; };
railCanvas.addEventListener("pointerup", endPointerDrag);
railCanvas.addEventListener("pointercancel", endPointerDrag);

// 触屏专属：横向滑动拖探针（且满足 perf.mjs 触屏拖测），竖向滑动放行页面滚动
railCanvas.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  const t = e.touches[0];
  const rect = railCanvas.getBoundingClientRect();
  touchStartPt = { x: t.clientX, y: t.clientY, decided: false, horizontal: false };
  dragTarget = hitTestRail(t.clientX - rect.left, t.clientY - rect.top);
  applyDragX(t.clientX - rect.left);
}, { passive: true });

railCanvas.addEventListener("touchmove", (e) => {
  if (!touchStartPt || !e.touches.length) return;
  const t = e.touches[0];
  const dx = Math.abs(t.clientX - touchStartPt.x);
  const dy = Math.abs(t.clientY - touchStartPt.y);
  if (!touchStartPt.decided && (dx > 4 || dy > 4)) {
    touchStartPt.decided = true;
    touchStartPt.horizontal = dx >= dy;
  }
  if (!touchStartPt.decided || touchStartPt.horizontal) {
    e.preventDefault();
    const rect = railCanvas.getBoundingClientRect();
    applyDragX(t.clientX - rect.left);
  }
}, { passive: false });

railCanvas.addEventListener("touchend", () => {
  touchStartPt = null;
  dragTarget = null;
});

railCanvas.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 40 : 12;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.viewport = clamp(state.viewport - step, VIEWPORT_MIN, VIEWPORT_MAX);
    manualTabHold = false;
    syncUI(false);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.viewport = clamp(state.viewport + step, VIEWPORT_MIN, VIEWPORT_MAX);
    manualTabHold = false;
    syncUI(false);
  }
});

// ---------- 开场其余按钮与滑杆事件 ----------
for (const btn of $$("[data-theme]")) {
  btn.addEventListener("click", () => {
    state.theme = btn.dataset.theme;
    syncUI(true);
  });
}

for (const btn of $$("[data-preset]")) {
  btn.addEventListener("click", () => {
    state = clonePreset(btn.dataset.preset, state.theme);
    manualTabHold = false;
    syncUI(true);
  });
}

for (const btn of $$(".dev-btn")) {
  btn.addEventListener("click", () => {
    state.viewport = Number(btn.dataset.vp);
    manualTabHold = false;
    syncUI(false);
  });
}

for (const btn of $$(".mtab")) {
  btn.addEventListener("click", () => {
    mobileFocusTier = btn.dataset.focusTier;
    manualTabHold = true;
    syncUI(true);
  });
}

for (const btn of $$("[data-mode]")) {
  btn.addEventListener("click", () => {
    state.mode = btn.dataset.mode;
    syncUI(true);
  });
}

slTm.addEventListener("input", () => {
  state.tM = Number(slTm.value);
  syncUI(true);
});

slTl.addEventListener("input", () => {
  state.tL = Number(slTl.value);
  syncUI(true);
});

for (const btn of $$("[data-cycle-width]")) {
  btn.addEventListener("click", () => {
    const t = btn.dataset.cycleWidth;
    const list = WIDTH_CHOICES[t];
    const idx = list.indexOf(state.templates[t].width);
    state.templates[t].width = list[(idx + 1) % list.length];
    syncUI(true);
  });
}

for (const btn of $$("[data-cycle-cols]")) {
  btn.addEventListener("click", () => {
    const t = btn.dataset.cycleCols;
    const cur = state.templates[t].cols;
    state.templates[t].cols = (cur % 4) + 1;
    syncUI(true);
  });
}

for (const btn of $$("[data-toggle-nav]")) {
  btn.addEventListener("click", () => {
    const t = btn.dataset.toggleNav;
    state.templates[t].nav = state.templates[t].nav === "burger" ? "bar" : "burger";
    syncUI(true);
  });
}

// ---------- 01 节：海报三把锁解剖 ----------
const PDECK_DATA = [
  {
    quote: "“提前设计多套布局模板，覆盖不同屏幕范围。”",
    copy: "设计师不用去猜 513px 或 947px 时每一像素该怎么拉伸，而是集中精力打磨少数几个基准版心（原海报示范 320px、768px、1200px）。定宽带来极强的构图确定性：标题字号、图文比例、广告位与留白都能按印刷级精度敲定。",
    rule: "核心约束：档位数量不能太少，否则相邻两档跨度过大，落在夹缝里的设备会空出大片留白。",
  },
  {
    quote: "“根据屏幕宽度自动识别，切换对应布局模板。”",
    copy: "系统量出当前视口属于哪一档，立刻整套切入对应预设。切档既可以由浏览器端 CSS 媒体查询或脚本完成，也可以由服务端提前识别设备并直出该档 HTML。同一档内画面稳态锁定，跨过门槛时整套切换。",
    rule: "核心约束：切入某档模板的阈值绝不能小于该模板自身宽度（T ≥ W），否则临界屏幕直接横向溢出。",
  },
  {
    quote: "“针对内容特点定制模板，满足多样化信息展示。”",
    copy: "多套模板真正的威力不只是增减列数：手机端可以把顶部复杂导航收成抽屉、把主操作放进底部拇指区、直接删去桌面辅助挂件；大屏端则展开左侧筛选、四列矩阵与全局顶栏，让每一端顺着设备习惯长出最合适的层级。",
    rule: "核心约束：每一套独立模板都意味着一份长期维护责任，改动业务功能时需同步校准各档。",
  },
];

for (const tab of $$(".pdeck-tab")) {
  tab.addEventListener("click", () => {
    const idx = Number(tab.dataset.pdeck);
    for (const t of $$(".pdeck-tab")) {
      const on = t === tab;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-selected", String(on));
    }
    const item = PDECK_DATA[idx];
    $("#pdeck-quote").textContent = item.quote;
    $("#pdeck-copy").textContent = item.copy;
    $("#pdeck-rule").textContent = item.rule;
  });
}

// ---------- 02 节：同步压测对比（响应式连续斜线 vs 自适应阶梯方波） ----------
const cmpSlider = $("#cmp-slider");
const cmpCanvas = $("#cmp-canvas");
const cmpCtx = cmpCanvas.getContext("2d");
let cmpVp = 740;
let cmpDirty = true;

function drawCmpCanvas() {
  const rect = cmpCanvas.getBoundingClientRect();
  if (rect.width < 20 || rect.height < 20) return;
  const dpr = pixelRatio(2);
  const cw = Math.round(rect.width * dpr);
  const ch = Math.round(rect.height * dpr);
  if (cmpCanvas.width !== cw || cmpCanvas.height !== ch) {
    cmpCanvas.width = cw;
    cmpCanvas.height = ch;
  }
  const ctx = cmpCtx;
  ctx.save();
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padL = 44, padR = 16, padT = 18, padB = 24;
  const xOf = (v) => padL + ((v - 320) / (1440 - 320)) * (w - padL - padR);
  const yOf = (v) => h - padB - ((v - 200) / (1440 - 200)) * (h - padT - padB);

  ctx.fillStyle = "#0B0908";
  ctx.fillRect(0, 0, w, h);

  // 参考线
  ctx.font = `600 10px "JetBrains Mono", monospace`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const r of [320, 768, 1200]) {
    const y = yOf(r);
    ctx.strokeStyle = "rgba(244, 232, 209, 0.14)";
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();
    ctx.fillStyle = "rgba(244, 232, 209, 0.7)";
    ctx.fillText(`${r}`, padL - 6, y);
  }

  // 蓝色连续斜线（响应式 100% 宽度）
  ctx.strokeStyle = "#7EA2FF";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(xOf(320), yOf(320));
  ctx.lineTo(xOf(1440), yOf(1440));
  ctx.stroke();

  // 朱红橘阶梯线（自适应 320 / 768 / 1200）
  ctx.strokeStyle = "#F8420B";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(xOf(320), yOf(320));
  ctx.lineTo(xOf(768), yOf(320));
  ctx.lineTo(xOf(768), yOf(768));
  ctx.lineTo(xOf(1200), yOf(768));
  ctx.lineTo(xOf(1200), yOf(1200));
  ctx.lineTo(xOf(1440), yOf(1200));
  ctx.stroke();

  // 当前测试视口竖线与双落点
  const c = evalCompare(cmpVp);
  const cx = xOf(cmpVp);
  ctx.strokeStyle = "#F4E8D1";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, padT);
  ctx.lineTo(cx, h - padB);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, yOf(c.resp.outer), 5, 0, Math.PI * 2);
  ctx.fillStyle = "#7EA2FF";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, yOf(c.adap.outer), 5, 0, Math.PI * 2);
  ctx.fillStyle = "#F8420B";
  ctx.fill();

  // 图例
  ctx.textAlign = "left";
  ctx.fillStyle = "#7EA2FF";
  ctx.fillText("— 响应式（连续斜线）", padL + 6, 10);
  ctx.fillStyle = "#FF8A5B";
  ctx.fillText("— 自适应（离散阶梯）", padL + 150, 10);

  // X 轴标注
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(244, 232, 209, 0.72)";
  for (const xv of [320, 600, 768, 960, 1200, 1440]) {
    ctx.fillText(`${xv}`, xOf(xv), h - padB + 6);
  }
  ctx.restore();
}

function renderCompare() {
  const c = evalCompare(cmpVp);
  $("#cmp-vp-val").textContent = `${cmpVp}px`;
  cmpSlider.value = String(cmpVp);

  $("#cmp-r-meta").textContent = `${c.resp.cols} 列 · 单卡 ${c.resp.cardW}px · 0px 空边`;
  $("#cmp-r-note").textContent = `在 ${cmpVp}px 视口下，卡片铺满全宽并连续伸缩，每行约 ${c.resp.chars} 字；每拖动 10px，排版都会细微重折。`;

  $("#cmp-a-meta").textContent = `${c.adap.tier} 档 ${c.adap.outer}px · ${c.adap.cols} 列 · 空边 ${c.adap.margin}px`;
  $("#cmp-a-note").textContent =
    c.adap.margin >= 280
      ? `停在 ${c.adap.outer}px 模板等待下一档，卡片定格为 ${c.adap.cardW}px 不变，但左右空出 ${c.adap.margin}px 留白。`
      : `稳稳命中 ${c.adap.outer}px 定宽模板，单卡严格锁在 ${c.adap.cardW}px（约 ${c.adap.chars} 字/行），构图比例零走样。`;

  // 渲染可视化微缩框（按比例映射进模拟盒）
  const rInner = `<div class="cmp-inner" style="width:100%;grid-template-columns:repeat(${c.resp.cols},minmax(0,1fr))">${Array.from({ length: c.resp.cols }, (_, i) => `<div class="cmp-block${i % 2 ? " is-alt" : ""}">${c.resp.cardW}px</div>`).join("")}</div>`;
  const aPct = Math.max(24, Math.min(100, Math.round((c.adap.outer / cmpVp) * 100)));
  const aInner = `<div class="cmp-inner" style="width:${aPct}%;grid-template-columns:repeat(${c.adap.cols},minmax(0,1fr))">${Array.from({ length: c.adap.cols }, (_, i) => `<div class="cmp-block${i % 2 ? " is-alt" : ""}">${c.adap.cardW}px</div>`).join("")}</div>`;

  $("#cmp-sim-r").innerHTML = rInner;
  $("#cmp-sim-a").innerHTML = aInner;
  cmpDirty = true;
  drawCmpCanvas();
}

cmpSlider.addEventListener("input", () => {
  cmpVp = Number(cmpSlider.value);
  renderCompare();
});
for (const btn of $$("[data-cmp-vp]")) {
  btn.addEventListener("click", () => {
    cmpVp = Number(btn.dataset.cmpVp);
    renderCompare();
  });
}

loop(cmpCanvas, (_t, _dt, { still }) => {
  if (still || cmpDirty) {
    drawCmpCanvas();
    cmpDirty = false;
  }
});

// ---------- 03 节：模板剪裁矩阵 ----------
let matrixTier = "S";
let matrixPicks = {
  S: { ...MATRIX_DEFAULT.S },
  M: { ...MATRIX_DEFAULT.M },
  L: { ...MATRIX_DEFAULT.L },
};

function renderMatrix() {
  for (const t of $$(".mx-tab")) {
    const on = t.dataset.mxTier === matrixTier;
    t.classList.toggle("is-on", on);
    t.setAttribute("aria-selected", String(on));
  }

  const picks = matrixPicks[matrixTier];
  const container = $("#matrix-rows");
  container.innerHTML = MATRIX_MODULES.map((mod) => {
    const cur = picks[mod.id] ?? 0;
    return `<div class="mx-row">
      <div class="mx-row-head"><b>${mod.name}</b><span>满载约 ${mod.weightKB} KB</span></div>
      <div class="mx-opts" role="group" aria-label="${mod.name}处理方式">
        ${mod.opts.map((label, idx) => `<button type="button" class="mx-opt${cur === idx ? " is-on" : ""}" data-mx-mod="${mod.id}" data-mx-val="${idx}">${label}</button>`).join("")}
      </div>
    </div>`;
  }).join("");

  const ev = evalMatrixTier(matrixTier, picks);
  $("#mx-kb").textContent = `${ev.kb} KB / ${ev.fullKB} KB`;
  $("#mx-saved").textContent = `${ev.savedPct}%`;
  $("#mx-verdict").textContent = ev.verdict;
  $("#mx-bar-fill").style.width = `${Math.max(8, Math.round((ev.kb / ev.fullKB) * 100))}%`;
}

for (const tab of $$(".mx-tab")) {
  tab.addEventListener("click", () => {
    matrixTier = tab.dataset.mxTier;
    renderMatrix();
  });
}

$("#matrix-rows").addEventListener("click", (e) => {
  const btn = e.target.closest(".mx-opt");
  if (!btn) return;
  matrixPicks[matrixTier][btn.dataset.mxMod] = Number(btn.dataset.mxVal);
  renderMatrix();
});

$("#mx-reset").addEventListener("click", () => {
  matrixPicks[matrixTier] = { ...MATRIX_DEFAULT[matrixTier] };
  renderMatrix();
});

// ---------- 04 节：客户端 / 服务端 Dynamic Serving / RESS 链路 ----------
const delState = { arch: "dynamic", device: "mobile", varyOn: true };

function renderDelivery() {
  const res = evalDelivery(delState);
  for (const b of $$("[data-arch]")) b.classList.toggle("is-on", b.dataset.arch === delState.arch);
  for (const b of $$("[data-dev]")) b.classList.toggle("is-on", b.dataset.dev === delState.device);
  const varyBtn = $("#btn-vary");
  varyBtn.setAttribute("aria-pressed", String(delState.varyOn));
  varyBtn.classList.toggle("is-on", delState.varyOn);
  varyBtn.classList.toggle("is-off", !delState.varyOn);
  varyBtn.textContent = delState.varyOn ? "Vary: User-Agent 开" : "Vary: User-Agent 关（险）";
  varyBtn.disabled = delState.arch === "client";

  $("#del-pipeline").innerHTML = res.steps
    .map((s, i) => `<li class="del-step${s.tag.includes("×") ? " is-bad" : ""}"><small>0${i + 1} · ${s.who}</small><b>${s.tag}</b></li>`)
    .join("");

  const box = $("#del-result");
  box.classList.toggle("is-bad", res.cacheRisk);
  $("#del-title").textContent = res.resultTitle;
  $("#del-note").textContent = res.resultNote;
  $("#del-headers").textContent = res.headers;
}

for (const b of $$("[data-arch]")) {
  b.addEventListener("click", () => { delState.arch = b.dataset.arch; renderDelivery(); });
}
for (const b of $$("[data-dev]")) {
  b.addEventListener("click", () => { delState.device = b.dataset.dev; renderDelivery(); });
}
$("#btn-vary").addEventListener("click", () => {
  delState.varyOn = !delState.varyOn;
  renderDelivery();
});

// ---------- 05 节：核实史实编年轴 ----------
let tlIdx = 1; // 默认落到 2011 Aaron Gustafson《Adaptive Web Design》

function renderTimeline() {
  const rail = $("#tl-rail");
  rail.innerHTML = TIMELINE.map((item, i) =>
    `<button type="button" class="tl-btn${i === tlIdx ? " is-on" : ""}" data-tl="${i}" role="tab" aria-selected="${i === tlIdx}">${item.year}</button>`
  ).join("");
  const cur = TIMELINE[tlIdx];
  $("#tl-date").textContent = cur.date;
  $("#tl-who").textContent = cur.who;
  $("#tl-title").textContent = cur.title;
  $("#tl-body").textContent = cur.body;
  $("#tl-code").textContent = cur.snippet;
}

$("#tl-rail").addEventListener("click", (e) => {
  const btn = e.target.closest(".tl-btn");
  if (!btn) return;
  tlIdx = Number(btn.dataset.tl);
  renderTimeline();
});

// ---------- 06 节：四道场景决策卡 ----------
const openScens = new Set(["legacy"]);

function renderScenarios() {
  const grid = $("#scen-grid");
  grid.innerHTML = SCENARIOS.map((s) => {
    const open = openScens.has(s.id);
    return `<button type="button" class="scen-card" data-scen="${s.id}" aria-expanded="${open}">
      <span class="scen-tag">${s.tag} · ${open ? "已展开结论" : "点此看取舍"}</span>
      <span class="scen-q">${s.title}</span>
      ${open ? `<div class="scen-ans"><span class="scen-verdict${s.tone === "warn" ? " is-warn" : ""}">${s.verdict}</span><p class="scen-reason">${s.reason}</p></div>` : ""}
    </button>`;
  }).join("");
}

$("#scen-grid").addEventListener("click", (e) => {
  const card = e.target.closest(".scen-card");
  if (!card) return;
  const id = card.dataset.scen;
  if (openScens.has(id)) openScens.delete(id);
  else openScens.add(id);
  renderScenarios();
});

// ---------- 07 节：小练习 ----------
let pickedQuiz = null;

function renderQuiz() {
  const optsEl = $("#quiz-opts");
  optsEl.innerHTML = QUIZ_OPTIONS.map((o) => {
    const isPicked = pickedQuiz === o.id;
    let cls = "quiz-opt";
    if (isPicked) cls += o.correct ? " is-right" : " is-wrong";
    else if (pickedQuiz && o.correct) cls += " is-right";
    return `<button type="button" class="${cls}" data-quiz="${o.id}" role="radio" aria-checked="${isPicked}">
      <span class="qo-letter" lang="en">${o.label}</span>
      <span class="qo-params" lang="en">${o.params}</span>
    </button>`;
  }).join("");

  const fb = $("#quiz-fb");
  if (!pickedQuiz) {
    fb.hidden = true;
    return;
  }
  const opt = QUIZ_OPTIONS.find((o) => o.id === pickedQuiz);
  const bars = evalQuizOption(opt);
  fb.hidden = false;
  fb.className = `quiz-fb ${opt.correct ? "is-right" : "is-wrong"}`;
  $("#qfb-head").textContent = opt.correct
    ? `答对了 · 选项 ${opt.label}（${opt.params}）四台设备全部零溢出`
    : `选项 ${opt.label} 存在隐患 · 正确答案是 B（M ≥ 768px · L ≥ 1200px）`;
  $("#qfb-body").textContent = opt.why;
  $("#qfb-bars").innerHTML = bars.map((b) => {
    const pct = b.overflow > 0 ? 100 : b.coverage;
    const note = b.overflow > 0 ? `溢出 +${b.overflow}px` : `占宽 ${b.coverage}%`;
    return `<div class="qfb-bar is-${b.status}">
      <b>${b.vp}px → ${b.tier} (${b.w}px)</b>
      <div class="qfb-track"><i style="width:${pct}%"></i></div>
      <span>${note}</span>
    </div>`;
  }).join("");
}

$("#quiz-opts").addEventListener("click", (e) => {
  const btn = e.target.closest(".quiz-opt");
  if (!btn) return;
  pickedQuiz = btn.dataset.quiz;
  renderQuiz();
});

// ---------- 08 节：原海报放大灯箱（复用 #poster.src，不重复内联图片） ----------
const posterBtn = $("#poster-btn");
const posterImg = $("#poster");
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbClose = $("#lb-close");
let lbState = { scale: 1, tx: 0, ty: 0, dragging: false, sx: 0, sy: 0 };

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbState.tx}px, ${lbState.ty}px) scale(${lbState.scale})`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbState = { scale: 1.15, tx: 0, ty: 0, dragging: false, sx: 0, sy: 0 };
  applyLbTransform();
  lightbox.hidden = false;
  posterBtn.setAttribute("aria-expanded", "true");
  lbClose.focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterBtn.setAttribute("aria-expanded", "false");
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbStage.addEventListener("click", (e) => {
  if (e.target === lbStage) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const next = clamp(lbState.scale + (e.deltaY < 0 ? 0.18 : -0.18), 0.7, 3.2);
  lbState.scale = next;
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target !== lbImg) return;
  lbState.dragging = true;
  lbState.sx = e.clientX - lbState.tx;
  lbState.sy = e.clientY - lbState.ty;
  lbStage.setPointerCapture?.(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbState.dragging) return;
  lbState.tx = e.clientX - lbState.sx;
  lbState.ty = e.clientY - lbState.sy;
  applyLbTransform();
});
const stopLbDrag = () => { lbState.dragging = false; };
lbStage.addEventListener("pointerup", stopLbDrag);
lbStage.addEventListener("pointercancel", stopLbDrag);

// ---------- 视口变更时重画画布 ----------
let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    railDirty = true;
    cmpDirty = true;
    railLoop.draw();
    drawCmpCanvas();
  }, 60);
});

// ---------- 首次初始化 ----------
syncUI(true);
renderCompare();
renderMatrix();
renderDelivery();
renderTimeline();
renderScenarios();
renderQuiz();
railLoop.draw();

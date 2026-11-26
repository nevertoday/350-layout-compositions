import { EVEN_BAND_Y, PRESETS, createInitialState } from "./model.js";
import { mountHeroStage } from "./stage-hero.js";
import { mountSections } from "./sections.js";

let state = createInitialState("poster");

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const canvas = $("#hero-canvas");
const ctrlAxis = $("#ctrl-axis");
const ctrlWidth = $("#ctrl-width");
const ctrlClearance = $("#ctrl-clearance");
const ctrlScale = $("#ctrl-scale");

const valAxis = $("#val-axis");
const valWidth = $("#val-width");
const valClearance = $("#val-clearance");
const valScale = $("#val-scale");

const btnTethers = $("#btn-tethers");
const btnEven = $("#btn-even");
const btnBalance = $("#btn-balance");
const btnSightline = $("#btn-sightline");

const auditCard = $("#audit-card");
const auditBadge = $("#audit-badge");
const auditTitle = $("#audit-title");
const auditWhy = $("#audit-why");
const auditHow = $("#audit-how");
const auditFix = $("#audit-fix");
const auditReset = $("#audit-reset");
const heroStatusPill = $("#hero-status-pill");
const mAxis = $("#m-axis");
const mClearance = $("#m-clearance");
const mGap = $("#m-gap");
const mRatio = $("#m-ratio");
const mMood = $("#m-mood");
const heroCss = $("#hero-css");

let latestEval = null;
const setText = (el, txt) => { if (el && el.textContent !== txt) el.textContent = txt; };

function setState(patch, { deferDraw = false } = {}) {
  state = { ...state, ...patch };
  syncControlsFromState();
  stage.requestDraw(deferDraw);
}

function syncControlsFromState() {
  const axStr = String(Math.round(state.axisX * 100));
  const wStr = String(Math.round(state.spineWidth * 100));
  const cStr = String(Math.round(state.clearance));
  const sStr = String(Math.round(state.spineScale * 100));
  if (ctrlAxis && ctrlAxis.value !== axStr) ctrlAxis.value = axStr;
  if (ctrlWidth && ctrlWidth.value !== wStr) ctrlWidth.value = wStr;
  if (ctrlClearance && ctrlClearance.value !== cStr) ctrlClearance.value = cStr;
  if (ctrlScale && ctrlScale.value !== sStr) ctrlScale.value = sStr;

  setText(valAxis, `${axStr}%`);
  setText(valWidth, `${wStr}%`);
  setText(valClearance, `${cStr}px`);
  setText(valScale, `${state.spineScale.toFixed(2)}×`);

  $$("[data-specimen]").forEach((b) => {
    const active = String(b.dataset.specimen === state.specimen);
    if (b.getAttribute("aria-pressed") !== active) b.setAttribute("aria-pressed", active);
  });

  if (btnTethers) {
    const on = String(state.tethers);
    if (btnTethers.getAttribute("aria-pressed") !== on) btnTethers.setAttribute("aria-pressed", on);
    setText(btnTethers, state.tethers ? "虚线引连：开" : "虚线引连：关");
  }
  if (btnSightline) {
    const on = String(state.sightline);
    if (btnSightline.getAttribute("aria-pressed") !== on) btnSightline.setAttribute("aria-pressed", on);
    setText(btnSightline, state.sightline ? "演播视线：开" : "演播视线：关");
  }
}

function renderAudit(ev) {
  latestEval = ev;
  const { verdict, metrics, checks, passCount } = ev;

  if (heroStatusPill) {
    setText(heroStatusPill, verdict.short);
    heroStatusPill.classList.toggle("is-pass", verdict.pass);
    heroStatusPill.classList.toggle("is-fail", !verdict.pass);
  }

  if (auditCard) {
    auditCard.classList.toggle("is-pass", verdict.pass);
    auditCard.classList.toggle("is-fail", !verdict.pass);
  }
  setText(auditBadge, `${passCount} / 4 · ${verdict.pass ? "纵横贯通" : verdict.short.split("·")[1]?.trim() || "待校准"}`);
  setText(auditTitle, verdict.title);
  setText(auditWhy, verdict.why);
  setText(auditHow, verdict.how);
  setText(auditFix, verdict.cta);

  setText(mAxis, metrics.axisOffsetPct <= 1 ? "居中 50%" : `${metrics.axisDir} ${metrics.axisOffsetPct}%`);
  setText(mClearance, `${metrics.clearancePx}px`);
  setText(mGap, `最小 ${metrics.minGapLogical}px / 差 ${metrics.gapSpreadLogical}px`);
  setText(mRatio, `${metrics.hierarchyRatio}× · 柱 ${metrics.spineWidthPct}%`);
  setText(mMood, verdict.statusMood);
  setText(heroCss, metrics.cssSnippet);

  // 同步原海报四枚绿圆徽实况探针
  for (const key of ["axis", "bands", "cross", "emphasis"]) {
    const el = document.querySelector(`[data-probe="${key}"]`);
    if (!el) continue;
    const c = checks[key];
    el.classList.toggle("is-ok", c.ok);
    el.classList.toggle("is-err", !c.ok);
    setText(el.querySelector(".probe-pill"), c.badge);
  }

  // 同步顶部自示范 H1 的垂轴偏移视觉暗示（微弱呼应画布）
  const mastAxis = $("#mast-axis-line");
  if (mastAxis) {
    const shift = Math.max(-18, Math.min(18, (state.axisX - 0.5) * 70));
    const tf = `translateX(${shift.toFixed(1)}px)`;
    if (mastAxis.style.transform !== tf) mastAxis.style.transform = tf;
    mastAxis.classList.toggle("is-skew", metrics.axisOffsetPct > 5);
  }
}

const stage = mountHeroStage(canvas, () => state, setState, renderAudit);

// 标本切换
$$("[data-specimen]").forEach((btn) => {
  btn.addEventListener("click", () => {
    setState({ specimen: btn.dataset.specimen });
  });
});

// 精控滑杆
ctrlAxis?.addEventListener("input", () => {
  let v = Number(ctrlAxis.value) / 100;
  if (Math.abs(v - 0.5) < 0.015) v = 0.5;
  setState({ axisX: v });
});
ctrlWidth?.addEventListener("input", () => setState({ spineWidth: Number(ctrlWidth.value) / 100 }));
ctrlClearance?.addEventListener("input", () => setState({ clearance: Number(ctrlClearance.value) }));
ctrlScale?.addEventListener("input", () => setState({ spineScale: Number(ctrlScale.value) / 100 }));

// 功能开关与整排快捷动作
btnTethers?.addEventListener("click", () => setState({ tethers: !state.tethers }));
btnEven?.addEventListener("click", () => setState({ bandY: [...EVEN_BAND_Y] }));
btnBalance?.addEventListener("click", () => setState({ bandMode: ["both", "both", "both", "both"] }));
btnSightline?.addEventListener("click", () => setState({ sightline: !state.sightline }));

// 诊单主操作键（按单真源诊断精准修复当前头号病灶，过关后切下一合法解）
auditFix?.addEventListener("click", () => {
  if (latestEval?.verdict?.fix) {
    setState({ ...latestEval.verdict.fix });
  }
});

auditReset?.addEventListener("click", () => {
  const fresh = createInitialState(state.specimen);
  state = fresh;
  syncControlsFromState();
  stage.requestDraw();
});

// 合法解与主动试错预设
$$("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    setState({
      ...p.patch,
      bandY: p.patch.bandY ? [...p.patch.bandY] : state.bandY,
      bandMode: p.patch.bandMode ? [...p.patch.bandMode] : state.bandMode,
    });
  });
});

$("#btn-reset")?.addEventListener("click", () => {
  const fresh = createInitialState(state.specimen);
  state = fresh;
  syncControlsFromState();
  stage.requestDraw();
});

// 键盘操作支持：聚焦画布时 ←/→ 移轴、↑/↓ 调避柱净空、空格切换演播视线
canvas?.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    setState({ axisX: Math.max(0.24, +(state.axisX - 0.02).toFixed(3)) });
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    setState({ axisX: Math.min(0.76, +(state.axisX + 0.02).toFixed(3)) });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setState({ clearance: Math.min(64, state.clearance + 4) });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    setState({ clearance: Math.max(0, state.clearance - 4) });
  } else if (e.key === " ") {
    e.preventDefault();
    setState({ sightline: !state.sightline });
  }
});

// 首次同步并启动正文 01–07 互动模块
syncControlsFromState();
stage.requestDraw();
mountSections();

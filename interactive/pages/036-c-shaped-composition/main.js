// 036 C形构图 · 页面总入口（单真源同步刊头活体大C、Hero画布、白话诊单、四要点脊与全部七节）
import {
  PRESETS,
  createInitialState,
  evaluate,
  clamp,
} from "./model.js";
import { mountHeroStage } from "./hero.js";
import {
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection06,
  initPosterLightbox,
} from "./sections.js";

const DEG = Math.PI / 180;

// 刊头自示范活体大字母「C」随画布包裹角与开口方向实时变形
function updateLiveCGlyph(ev) {
  const path = document.getElementById("liveCArcPath");
  const dot = document.getElementById("liveCFocusDot");
  if (!path || !dot) return;

  const cx = 44;
  const cy = 44;
  const r = 31;
  // 限制在 70°..345° 之间，确保字母 C 轮廓清晰又有即时反馈
  const span = clamp(ev.wrapDeg, 70, 345);
  const gapHalf = ((360 - span) * DEG) / 2;
  const openRad = ev.openDeg * DEG;
  const startRad = openRad + gapHalf;
  const endRad = openRad + Math.PI * 2 - gapHalf;

  const sx = cx + Math.cos(startRad) * r;
  const sy = cy + Math.sin(startRad) * r;
  const ex = cx + Math.cos(endRad) * r;
  const ey = cy + Math.sin(endRad) * r;
  const largeArc = span > 180 ? 1 : 0;

  path.setAttribute(
    "d",
    `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`
  );
  path.setAttribute("stroke", ev.severity === "error" ? "#B91C1C" : "#0B1622");
  dot.setAttribute("fill", ev.score === 4 ? "#11694E" : "#EA6B37");
}

function initHeroApp() {
  const state = createInitialState();
  const canvas = document.getElementById("heroCanvas");

  const heroScorePill = document.getElementById("heroScorePill");
  const hudWrap = document.getElementById("hudWrap");
  const hudOpen = document.getElementById("hudOpen");
  const hudScore = document.getElementById("hudScore");

  const diagCard = document.getElementById("diagCard");
  const diagBadge = document.getElementById("diagBadge");
  const diagHeadline = document.getElementById("diagHeadline");
  const diagBody = document.getElementById("diagBody");
  const diagHint = document.getElementById("diagHint");
  const metWrap = document.getElementById("metWrap");
  const metMargin = document.getElementById("metMargin");
  const metFocus = document.getElementById("metFocus");
  const metFlow = document.getElementById("metFlow");

  const rangeWrap = document.getElementById("rangeWrap");
  const rangeOpen = document.getElementById("rangeOpen");
  const valWrap = document.getElementById("valWrap");
  const valOpen = document.getElementById("valOpen");
  const btnBlocker = document.getElementById("btnToggleBlocker");
  const btnRays = document.getElementById("btnToggleRays");
  const btnCenterFocus = document.getElementById("btnCenterFocus");

  const stEnclose = document.getElementById("stEnclose");
  const stHold = document.getElementById("stHold");
  const stSoft = document.getElementById("stSoft");
  const stFlow = document.getElementById("stFlow");
  const spineItems = [...document.querySelectorAll(".spine-item")];

  const themeBtns = [...document.querySelectorAll(".theme-btn")];
  const presetBtns = [...document.querySelectorAll(".preset-btn")];
  const kwBtns = [...document.querySelectorAll(".pill-kw")];

  let stage = null;

  function syncUI(skipDraw = false) {
    const aspect = stage ? stage.getAspect() : 1.45;
    const ev = evaluate(state, aspect);

    updateLiveCGlyph(ev);

    // 顶栏得分胶囊
    heroScorePill.textContent = ev.score === 4 ? `4 / 4 弧抱畅通` : `${ev.score} / 4 待理顺`;
    heroScorePill.className =
      "meta-pill " +
      (ev.severity === "ok"
        ? "meta-pill--ok"
        : ev.severity === "warn"
          ? "meta-pill--warn"
          : "meta-pill--error");

    // 画布 HUD
    hudWrap.textContent = `包裹 ${ev.wrapDeg}°`;
    hudOpen.textContent = `开口 ${ev.openDeg}° ${ev.orientation.arrow} · 余白 ${ev.openMarginPct}%`;
    hudScore.textContent = `${ev.score}/4`;

    // 白话诊单
    diagCard.className = `diag-card diag-card--${ev.severity}`;
    diagBadge.textContent = ev.badge;
    diagHeadline.textContent = ev.headline;
    diagBody.textContent = ev.body;
    diagHint.textContent = ev.hint;
    metWrap.textContent = `${ev.wrapDeg}°`;
    metMargin.textContent = `${ev.openMarginPct}%`;
    metFocus.textContent = `${ev.focusOffsetPct}%`;
    metFlow.textContent = ev.flowGrade;

    // 滑杆与按钮
    rangeWrap.value = String(ev.wrapDeg);
    rangeOpen.value = String(ev.openDeg);
    valWrap.textContent = `${ev.wrapDeg}°`;
    valOpen.textContent = `${ev.openDeg}° ${ev.orientation.arrow}`;

    btnBlocker.textContent = state.blockerOn ? "挡口块：开" : "挡口块：关";
    btnBlocker.setAttribute("aria-pressed", String(state.blockerOn));
    btnBlocker.classList.toggle("is-warn", state.blockerOn);

    btnRays.textContent = state.showRays ? "放射视线：开" : "放射视线：关";
    btnRays.setAttribute("aria-pressed", String(state.showRays));
    btnRays.classList.toggle("is-on", state.showRays);

    // 左脊四要点实况同步
    stEnclose.textContent = ev.checks.enclose.status;
    stHold.textContent = ev.checks.hold.status;
    stSoft.textContent = ev.checks.soft.status;
    stFlow.textContent = ev.checks.flow.status;
    spineItems.forEach((li) => {
      const key = li.dataset.check;
      const ok = ev.checks[key]?.ok;
      li.classList.toggle("is-ok", Boolean(ok));
      li.classList.toggle("is-fail", !ok);
    });

    // 题材切换状态
    themeBtns.forEach((btn) => {
      const on = btn.dataset.theme === state.theme;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });

    // 关键词高亮状态
    kwBtns.forEach((btn) => {
      btn.classList.toggle("is-active", state.highlightKey === btn.dataset.kw);
    });

    if (!skipDraw && stage) stage.draw();
  }

  stage = mountHeroStage(canvas, state, (fromResize) => syncUI(Boolean(fromResize)));

  rangeWrap.addEventListener("input", () => {
    state.wrapDeg = Number(rangeWrap.value);
    syncUI();
  });

  rangeOpen.addEventListener("input", () => {
    state.openDeg = Number(rangeOpen.value);
    syncUI();
  });

  btnBlocker.addEventListener("click", () => {
    state.blockerOn = !state.blockerOn;
    syncUI();
  });

  btnRays.addEventListener("click", () => {
    state.showRays = !state.showRays;
    syncUI();
  });

  btnCenterFocus.addEventListener("click", () => {
    state.focus.u = state.arcCenter.u;
    state.focus.v = state.arcCenter.v;
    syncUI();
  });

  themeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.theme = btn.dataset.theme;
      syncUI();
    });
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = PRESETS[btn.dataset.preset];
      if (!p) return;
      state.wrapDeg = p.wrapDeg;
      state.openDeg = p.openDeg;
      state.arcCenter = { ...p.arcCenter };
      state.focus = { ...p.focus };
      state.blockerOn = p.blockerOn;
      syncUI();
    });
  });

  // 底部原海报胶囊关键词与四要点按钮点击高亮画布对应元素
  const toggleHighlight = (key) => {
    state.highlightKey = state.highlightKey === key ? null : key;
    syncUI();
  };

  kwBtns.forEach((btn) => btn.addEventListener("click", () => toggleHighlight(btn.dataset.kw)));
  document.querySelectorAll(".spine-btn").forEach((btn) =>
    btn.addEventListener("click", () => toggleHighlight(btn.dataset.highlight))
  );

  syncUI();
}

initHeroApp();
initSection01();
initSection02();
initSection03();
initSection04();
initSection06();
initPosterLightbox();

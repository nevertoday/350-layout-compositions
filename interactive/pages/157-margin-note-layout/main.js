// 157 边注版式 — 页面主入口：联动活体校注台、撕边诊单、自示范大标与正文 01–07 节
import { PRESETS, clamp, createInitialState, evaluate } from "./model.js";
import { mountHeroStage } from "./stage.js";
import {
  initAvoidMatrix,
  initEyePathLab,
  initHistoryStage,
  initPosterLightbox,
  initQuiz,
  initResponsiveLab,
  initRoleAnatomy,
} from "./sections.js";

const state = createInitialState();

const canvas = document.getElementById("hero-canvas");
const topStatus = document.getElementById("top-status");
const titleLiveNote = document.getElementById("title-live-note");
const diagCard = document.getElementById("diag-card");
const diagBadge = document.getElementById("diag-badge");
const diagHeadline = document.getElementById("diag-headline");
const diagBody = document.getElementById("diag-body");
const diagAction = document.getElementById("diag-action");
const metricCross = document.getElementById("m-cross");
const metricDrift = document.getElementById("m-drift");
const metricRatio = document.getElementById("m-ratio");
const metricMobile = document.getElementById("m-mobile");

const ratioSlider = document.getElementById("ctrl-ratio");
const ratioVal = document.getElementById("ctrl-ratio-val");
const noteYSlider = document.getElementById("ctrl-notey");
const noteYVal = document.getElementById("ctrl-notey-val");
const notePickerBtns = [...document.querySelectorAll("[data-pick-note]")];
const themeBtns = [...document.querySelectorAll("[data-theme]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const scaleBtns = [...document.querySelectorAll("[data-scale]")];
const linkBtns = [...document.querySelectorAll("[data-link]")];
const mobileBtns = [...document.querySelectorAll("[data-mobile]")];
const alignAllBtn = document.getElementById("btn-align-all");
const roleTags = [...document.querySelectorAll("[data-role-live]")];

let stage = null;
let dragTimer = 0;
let lastDomSync = 0;

function setTxt(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}

function syncUI(ev) {
  // 连续拖动时节流 DOM 重排（松手立刻全量同步），保障慢手机与软件渲染 ≥50fps
  if (ev === "drag") {
    const now = performance.now();
    if (now - lastDomSync >= 90) {
      lastDomSync = now;
      applyDOM();
    } else if (!dragTimer) {
      dragTimer = setTimeout(() => {
        dragTimer = 0;
        lastDomSync = performance.now();
        applyDOM();
      }, 90);
    }
    return;
  }
  if (dragTimer) {
    clearTimeout(dragTimer);
    dragTimer = 0;
  }
  lastDomSync = performance.now();
  applyDOM();
}

function applyDOM() {
  const lay = stage ? stage.getLayout() : evaluate(state);
  const { diag, score, crossings, overlaps, maxDriftPx, bodyPct, marginPct, checks } = lay;

  // 顶部眉签实况徽章
  setTxt(topStatus, `${score} / 4 · ${diag.ok ? "注疏合度" : diag.badge.split("·")[1]?.trim().replace(/\s*\(\d\/4\)/, "") || "注疏失序"}`);
  topStatus.classList.toggle("is-ok", diag.ok);

  // 标题旁自示范实时迷你边注批签
  setTxt(
    titleLiveNote,
    diag.ok
      ? `主 ${bodyPct}% : 注 ${marginPct}% · 齐`
      : crossings.length > 0
      ? `交叉 ${crossings.length} 处 · 注 ${marginPct}%`
      : overlaps.length > 0
      ? `撞车 ${overlaps.length} 处 · 注 ${marginPct}%`
      : `主 ${bodyPct}% : 注 ${marginPct}% · ${score}/4`
  );
  titleLiveNote.classList.toggle("is-ok", diag.ok);

  // 撕边单真源诊单
  diagCard.classList.toggle("is-ok", diag.ok);
  setTxt(diagBadge, diag.badge);
  setTxt(diagHeadline, diag.headline);
  setTxt(diagBody, diag.body);
  setTxt(diagAction, diag.action);

  // 四项单真源读数
  setTxt(metricCross, crossings.length ? `${crossings.length} 处交叉` : overlaps.length ? `${overlaps.length} 处撞车` : "0 交叉");
  metricCross.classList.toggle("is-bad", crossings.length > 0 || overlaps.length > 0);
  setTxt(metricDrift, `${maxDriftPx}px`);
  metricDrift.classList.toggle("is-bad", !checks.alignOk);
  setTxt(metricRatio, `${bodyPct} : ${marginPct}`);
  metricRatio.classList.toggle("is-bad", !checks.ratioOk);
  setTxt(
    metricMobile,
    state.mobileMode === "squeeze"
      ? `挤 ${lay.mobileNotePx}px`
      : state.mobileMode === "hidden"
      ? "小屏丢失"
      : state.mobileMode === "inline-toggle"
      ? "⊕ 折叠"
      : "段下轻注"
  );
  metricMobile.classList.toggle("is-bad", !checks.mobileOk);

  // 滑块同步
  const mStr = String(marginPct);
  if (ratioSlider.value !== mStr) ratioSlider.value = mStr;
  setTxt(ratioVal, `${marginPct}%`);
  const selCard = lay.cards[state.selectedNote];
  const yStr = String(Math.round(state.noteY[state.selectedNote] * 100));
  if (noteYSlider.value !== yStr) noteYSlider.value = yStr;
  setTxt(noteYVal, `${selCard.role} · 偏 ${selCard.driftNormPx}px`);

  // 按钮激活态
  themeBtns.forEach((b) => {
    const on = b.dataset.theme === state.theme;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  notePickerBtns.forEach((b) => {
    const on = Number(b.dataset.pickNote) === state.selectedNote;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  scaleBtns.forEach((b) => {
    const on = b.dataset.scale === state.scaleMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  linkBtns.forEach((b) => {
    const on = b.dataset.link === state.linkStyle;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  mobileBtns.forEach((b) => {
    const on = b.dataset.mobile === state.mobileMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 五枚原海报边注职责实况灯
  lay.roleStates.forEach((rs, idx) => {
    const el = roleTags[idx];
    if (!el) return;
    setTxt(el, rs.tag);
    el.classList.toggle("is-ok", rs.ok);
    el.classList.toggle("is-bad", !rs.ok);
  });
}

// 绑定四维案头控件
themeBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.theme = b.dataset.theme;
    stage.redraw();
    applyDOM();
  })
);

presetBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    state.marginRatio = p.marginRatio;
    state.noteY = [...p.noteY];
    state.scaleMode = p.scaleMode;
    state.linkStyle = p.linkStyle;
    state.mobileMode = p.mobileMode;
    state.selectedNote = p.selectedNote;
    stage.redraw();
    applyDOM();
  })
);

ratioSlider.addEventListener("input", () => {
  state.marginRatio = clamp(Number(ratioSlider.value) / 100, 0.14, 0.44);
  stage.redraw();
  applyDOM();
});

noteYSlider.addEventListener("input", () => {
  const i = state.selectedNote;
  const lay = stage.getLayout();
  let ny = clamp(Number(noteYSlider.value) / 100, 0.10, 0.90);
  const ay = lay.theme.notes[i].anchorY;
  if (Math.abs(ny - ay) < 0.02) ny = ay;
  state.noteY[i] = +ny.toFixed(4);
  stage.redraw();
  applyDOM();
});

notePickerBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.selectedNote = Number(b.dataset.pickNote);
    stage.redraw();
    applyDOM();
  })
);

alignAllBtn.addEventListener("click", () => {
  const lay = stage.getLayout();
  state.noteY = lay.theme.notes.map((n) => n.anchorY);
  stage.redraw();
  applyDOM();
});

scaleBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.scaleMode = b.dataset.scale;
    stage.redraw();
    applyDOM();
  })
);

linkBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.linkStyle = b.dataset.link;
    stage.redraw();
    applyDOM();
  })
);

mobileBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.mobileMode = b.dataset.mobile;
    stage.redraw();
    applyDOM();
  })
);

// 挂载开场舞台与正文 01–07 节
stage = mountHeroStage(canvas, state, syncUI);
applyDOM();

initEyePathLab();
initRoleAnatomy();
initHistoryStage();
initResponsiveLab();
initAvoidMatrix();
initQuiz();
initPosterLightbox();

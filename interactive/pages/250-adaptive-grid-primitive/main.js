// 250 自适应网格原语 —— 主入口：单真源驱动开场活体网格 + 01–07 节交互

import { DEVICES, INITIAL_STATE, PRESETS, evaluateState } from "./model.js";
import { createGridStage } from "./stage.js";
import {
  initPosterLightbox,
  initSection1,
  initSection2,
  initSection3,
  initSection4,
  initSection5,
  initSection6,
} from "./sections.js";

const state = { ...INITIAL_STATE, expanded: [...INITIAL_STATE.expanded] };

// DOM 引用
const topBadge = document.getElementById("top-badge");
const mastMark = document.getElementById("mast-mark");
const coreFormula = document.getElementById("core-formula");
const coreBlue = document.getElementById("core-blue");
const coreOrange = document.getElementById("core-orange");
const stageDim = document.getElementById("stage-dim");
const btnBaseline = document.getElementById("btn-baseline");

const diagBadge = document.getElementById("diag-badge");
const diagTitle = document.getElementById("diag-title");
const diagBody = document.getElementById("diag-body");
const diagAction = document.getElementById("diag-action");
const diagFix = document.getElementById("diag-fix");
const mTrack = document.getElementById("m-track");
const mWorst = document.getElementById("m-worst");
const mClip = document.getElementById("m-clip");
const mDrift = document.getElementById("m-drift");
const liveCss = document.getElementById("live-css");

const ctlMin = document.getElementById("ctl-min");
const valMin = document.getElementById("val-min");
const ctlGap = document.getElementById("ctl-gap");
const valGap = document.getElementById("val-gap");
const ctlCount = document.getElementById("ctl-count");
const valCount = document.getElementById("val-count");

const themeBtns = [...document.querySelectorAll("[data-theme]")];
const modeBtns = [...document.querySelectorAll("[data-mode]")];
const heightBtns = [...document.querySelectorAll("[data-height]")];
const alignBtns = [...document.querySelectorAll("[data-align]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const deviceBtns = [...document.querySelectorAll("[data-device]")];
const pillarCards = [...document.querySelectorAll("[data-pillar]")];

let latestEval = null;

const stage = createGridStage(document.getElementById("grid-canvas"), {
  onResize(nextW) {
    state.viewportWidth = nextW;
    syncAll();
  },
  onToggleExpand(id) {
    const idx = state.expanded.indexOf(id);
    if (idx >= 0) state.expanded.splice(idx, 1);
    else state.expanded.push(id);
    syncAll();
  },
  onApplyPatch(patch) {
    applyPatch(patch);
  },
});

function applyPatch(patch) {
  Object.assign(state, patch);
  if (patch.expanded) state.expanded = [...patch.expanded];
  syncAll();
}

let lastMarkKey = "";
function renderMastMark(cols) {
  const c = Math.max(1, Math.min(4, cols));
  const cells = Math.max(c * 2, Math.min(8, state.itemCount));
  const key = `${c}:${cells}`;
  if (key === lastMarkKey) return;
  lastMarkKey = key;
  mastMark.style.gridTemplateColumns = `repeat(${c}, 1fr)`;
  let html = "";
  for (let i = 0; i < cells; i++) html += "<span></span>";
  mastMark.innerHTML = html;
}

const lastDevCellKey = {};
function renderDevices(devices) {
  devices.forEach((d) => {
    const btn = document.querySelector(`[data-device="${d.id}"]`);
    const stat = document.getElementById(`dev-stat-${d.id}`);
    const mini = document.getElementById(`dev-mini-${d.id}`);
    if (!btn || !stat || !mini) return;

    const isBad = d.status !== "ok";
    const isNear = Math.abs(state.viewportWidth - d.width) < 70;
    btn.classList.toggle("is-bad", isBad);
    btn.classList.toggle("is-current", isNear);

    const wPx = Math.round(d.layout.tracks.trackW);
    const statTxt =
      d.status === "overflow"
        ? `溢 +${d.layout.tracks.overflowPx}px`
        : d.status === "crushed"
          ? `${d.layout.tracks.cols}列·${wPx}px碎`
          : d.status === "clipped"
            ? `${d.layout.tracks.cols}列·裁切`
            : d.status === "drift"
              ? `${d.layout.tracks.cols}列·错齿`
              : `${d.layout.tracks.cols}列·${wPx}px`;
    if (stat.textContent !== statTxt) stat.textContent = statTxt;

    const c = Math.max(1, Math.min(4, d.layout.tracks.cols));
    const n = Math.min(6, state.itemCount);
    const cellKey = `${c}:${n}`;
    if (lastDevCellKey[d.id] !== cellKey) {
      lastDevCellKey[d.id] = cellKey;
      mini.style.gridTemplateColumns = `repeat(${c}, 1fr)`;
      let cells = "";
      for (let i = 0; i < n; i++) cells += "<i></i>";
      mini.innerHTML = cells;
    }
  });
}

function setText(el, str) {
  if (el && el.textContent !== str) el.textContent = str;
}

function syncAll() {
  const ev = evaluateState(state);
  latestEval = ev;
  const cur = ev.current;
  const pass = ev.code === "pass";

  // 顶部与刊头活体自示范（仅在变化时写 DOM，避免拖动触发无谓重排）
  setText(topBadge, ev.badge);
  topBadge.classList.toggle("is-pass", pass);
  renderMastMark(cur.tracks.cols);

  const trackW = Math.round(cur.tracks.trackW);
  setText(stageDim, `视口 ${Math.round(state.viewportWidth)}px · ${cur.tracks.cols} 列 × ${trackW}px`);
  setText(coreFormula, `${Math.round(state.viewportWidth)}px → ${cur.tracks.cols} 列 × ${trackW}px`);

  // 原海报右上蓝方橘圆微联动：列数变化时蓝方随实得列数轻微呼吸，保持几何对齐
  if (coreBlue && coreOrange) {
    const bw = String(Math.max(18, Math.min(44, 16 + cur.tracks.cols * 6)));
    if (coreBlue.getAttribute("width") !== bw) coreBlue.setAttribute("width", bw);
    const ox = String(pass ? 68 : 62);
    if (coreOrange.getAttribute("cx") !== ox) coreOrange.setAttribute("cx", ox);
  }

  // 单真源白话诊单与四维读数
  setText(diagBadge, ev.badge);
  diagBadge.classList.toggle("is-pass", pass);
  setText(diagTitle, ev.headline);
  setText(diagBody, ev.body);
  setText(diagAction, ev.actionText);

  if (ev.fixAction) {
    diagFix.hidden = false;
    setText(diagFix, ev.fixAction.label);
  } else {
    diagFix.hidden = true;
  }

  setText(mTrack, `${trackW}px (${cur.tracks.cols}列)`);
  mTrack.className = `mono ${trackW < 148 ? "is-bad" : "is-ok"}`;

  setText(mWorst, ev.worstOverflow > 0 ? `溢出 +${ev.worstOverflow}px` : `${ev.worstTrackW}px`);
  mWorst.className = `mono ${ev.worstOverflow > 0 || ev.worstTrackW < 148 ? "is-bad" : "is-ok"}`;

  setText(mClip, cur.maxClipPx > 0 ? `-${cur.maxClipPx}px` : "0px 完整");
  mClip.className = `mono ${cur.maxClipPx > 0 ? "is-bad" : "is-ok"}`;

  setText(mDrift, cur.maxBaselineDrift > 0 ? `${cur.maxBaselineDrift}px` : "0px 齐平");
  mDrift.className = `mono ${cur.maxBaselineDrift > 0 ? "is-bad" : "is-ok"}`;

  setText(liveCss, ev.css);

  // 三端同步缩略
  renderDevices(ev.devices);

  // 原海报第四行四支柱实时角标
  ev.pillars.forEach((p) => {
    const card = document.querySelector(`[data-pillar="${p.id}"]`);
    const tag = document.getElementById(`p-state-${p.id}`);
    if (card) card.classList.toggle("is-ok", p.ok);
    setText(tag, p.tag);
  });

  // 同步所有原生控件状态
  themeBtns.forEach((b) => {
    const on = b.dataset.theme === state.theme;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  modeBtns.forEach((b) => {
    const on = b.dataset.mode === state.mode;
    b.classList.toggle("is-active", on);
    b.classList.toggle("is-danger-opt", on && (state.mode === "fixed4" || state.mode === "bare-minmax"));
    b.setAttribute("aria-pressed", String(on));
  });
  heightBtns.forEach((b) => {
    const on = b.dataset.height === state.heightMode;
    b.classList.toggle("is-active", on);
    b.classList.toggle("is-danger-opt", on && state.heightMode === "fixed");
    b.setAttribute("aria-pressed", String(on));
  });
  alignBtns.forEach((b) => {
    const on = b.dataset.align === state.alignMode;
    b.classList.toggle("is-active", on);
    b.classList.toggle("is-danger-opt", on && state.alignMode === "rogue");
    b.setAttribute("aria-pressed", String(on));
  });

  btnBaseline.classList.toggle("is-active", state.showBaseline);
  btnBaseline.setAttribute("aria-pressed", String(state.showBaseline));
  btnBaseline.textContent = state.showBaseline ? "基线透视：开" : "基线透视：关";

  ctlMin.value = String(state.minWidth);
  valMin.textContent = `${state.minWidth}px`;
  ctlGap.value = String(state.gap);
  valGap.textContent = `${state.gap}px`;
  ctlCount.value = String(state.itemCount);
  valCount.textContent = `${state.itemCount} 块`;

  stage.update(state, ev);
}

// 事件绑定
themeBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.theme = b.dataset.theme;
    syncAll();
  }),
);
modeBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.mode = b.dataset.mode;
    syncAll();
  }),
);
heightBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.heightMode = b.dataset.height;
    syncAll();
  }),
);
alignBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.alignMode = b.dataset.align;
    syncAll();
  }),
);
btnBaseline.addEventListener("click", () => {
  state.showBaseline = !state.showBaseline;
  syncAll();
});

ctlMin.addEventListener("input", () => {
  state.minWidth = Number(ctlMin.value);
  syncAll();
});
ctlGap.addEventListener("input", () => {
  state.gap = Number(ctlGap.value);
  syncAll();
});
ctlCount.addEventListener("input", () => {
  state.itemCount = Number(ctlCount.value);
  syncAll();
});

diagFix.addEventListener("click", () => {
  if (latestEval && latestEval.fixAction) applyPatch(latestEval.fixAction.patch);
});

presetBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (p) applyPatch(p.patch);
  }),
);

deviceBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const dev = DEVICES.find((d) => d.id === b.dataset.device);
    if (dev) {
      state.viewportWidth = dev.width;
      syncAll();
    }
  }),
);

// 点击原海报四支柱卡直接演示或修复对应支柱
pillarCards.forEach((card) =>
  card.addEventListener("click", () => {
    const id = card.dataset.pillar;
    if (id === "flexible") applyPatch({ mode: "auto-fit", minWidth: 210 });
    else if (id === "consistent") applyPatch({ alignMode: "unified", showBaseline: true });
    else if (id === "rhythm") applyPatch({ gap: 16 });
    else if (id === "content") applyPatch({ heightMode: "auto" });
  }),
);

// 初始化开场与 01–07 节
syncAll();
initSection1();
initSection2();
initSection3();
initSection4();
initSection5();
initSection6();
initPosterLightbox();

// 260 圣杯布局 — 主入口：单真源状态驱动画布、标题示范条、外挂标尺、四探针与诊单

import {
  BROKEN_STATE,
  VALID_PRESETS,
  ANTI_PRESETS,
  computeFrame,
  buildPrimaryFix,
  clamp,
} from "./model.js";
import { createHeroCanvas } from "./hero-canvas.js";
import {
  initSec01EraTimeline,
  initSec02RoleAudit,
  initSec03BreakpointLab,
  initSec04DecisionTree,
  initSec05MisuseCompare,
  initSec06Quiz,
  initPosterLightbox,
} from "./sections.js";

const state = { ...BROKEN_STATE };
let frame = computeFrame(state);

const els = {
  canvas: document.getElementById("hero-canvas"),
  heroStatusBadge: document.getElementById("hero-status-badge"),
  tdbLeft: document.getElementById("tdb-left"),
  tdbMain: document.getElementById("tdb-main"),
  tdbRight: document.getElementById("tdb-right"),

  railHeader: document.getElementById("rail-header-live"),
  railBody: document.getElementById("rail-body-live"),
  railFooter: document.getElementById("rail-footer-live"),

  ctrlVw: document.getElementById("ctrl-vw"),
  ctrlLw: document.getElementById("ctrl-lw"),
  ctrlRw: document.getElementById("ctrl-rw"),
  ctrlHh: document.getElementById("ctrl-hh"),
  valVw: document.getElementById("val-vw"),
  valLw: document.getElementById("val-lw"),
  valRw: document.getElementById("val-rw"),
  valHh: document.getElementById("val-hh"),

  togSticky: document.getElementById("tog-sticky"),
  togResp: document.getElementById("tog-resp"),
  togSource: document.getElementById("tog-source"),
  togLeft: document.getElementById("tog-left"),
  togRight: document.getElementById("tog-right"),
  btnSourceOverlay: document.getElementById("btn-source-overlay"),

  auditBadge: document.getElementById("audit-badge"),
  auditTitle: document.getElementById("audit-title"),
  auditWhy: document.getElementById("audit-why"),
  auditHint: document.getElementById("audit-hint"),
  btnFixOne: document.getElementById("btn-fix-one"),
  btnFixAll: document.getElementById("btn-fix-all"),
  btnResetBroken: document.getElementById("btn-reset-broken"),

  mRatio: document.getElementById("m-ratio"),
  mMain: document.getElementById("m-main"),
  mDh: document.getElementById("m-dh"),
  mFoot: document.getElementById("m-foot"),
};

let heroCtrl = null;
let uiSyncTimer = 0;
let lastUiSync = 0;

// 只在文本确实变化时才写入 DOM，避免拖拽时触发无谓重排与 MutationObserver 风暴
function setText(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}
function setVal(el, val) {
  const s = String(val);
  if (el && el.value !== s) el.value = s;
}
function setClass(el, cls, on) {
  if (el) el.classList.toggle(cls, on);
}

function patchState(patch, fromDrag = false, forceSync = false) {
  let changed = false;
  for (const [k, v] of Object.entries(patch)) {
    if (state[k] !== v) {
      state[k] = v;
      changed = true;
    }
  }
  if (!changed && !forceSync) return;
  frame = computeFrame(state);
  heroCtrl?.notify(forceSync);
  if (!fromDrag || forceSync) {
    if (uiSyncTimer) {
      clearTimeout(uiSyncTimer);
      uiSyncTimer = 0;
    }
    lastUiSync = performance.now();
    syncUI();
    return;
  }
  // 拖拽中：Canvas 每帧 60fps 实时刷新，画布外大块 DOM 节流 120ms 刷新以防软件渲染全屏重排
  const now = performance.now();
  if (now - lastUiSync >= 120) {
    lastUiSync = now;
    syncUI();
  } else if (!uiSyncTimer) {
    uiSyncTimer = setTimeout(() => {
      uiSyncTimer = 0;
      lastUiSync = performance.now();
      syncUI();
    }, 120);
  }
}

function syncUI() {
  const allOk = frame.passedCount === 4;

  // 1. 顶带状态章 + 自示范标题比例条
  setText(els.heroStatusBadge, frame.statusBadge);
  setClass(els.heroStatusBadge, "is-ok", allOk);
  setClass(els.heroStatusBadge, "is-err", !allOk);

  if (els.tdbLeft && els.tdbMain && els.tdbRight) {
    const lb = `${frame.leftPct}%`;
    const rb = `${frame.rightPct}%`;
    if (els.tdbLeft.style.flexBasis !== lb) els.tdbLeft.style.flexBasis = lb;
    els.tdbLeft.style.opacity = frame.leftPct > 0 ? "1" : "0";
    setText(els.tdbLeft, frame.leftPct >= 12 ? lb : "");
    setText(els.tdbMain, `主 ${frame.mainPct}%`);
    if (els.tdbRight.style.flexBasis !== rb) els.tdbRight.style.flexBasis = rb;
    els.tdbRight.style.opacity = frame.rightPct > 0 ? "1" : "0";
    setText(els.tdbRight, frame.rightPct >= 12 ? rb : "");
  }

  // 2. 四枚原海报核心概念探针
  for (const p of frame.probes) {
    const btn = document.querySelector(`.probe-btn[data-probe="${p.id}"]`);
    const stEl = document.querySelector(`[data-probe-state="${p.id}"]`);
    setClass(btn, "is-ok", p.ok);
    setClass(btn, "is-focused", state.focusZone === p.focus);
    setText(stEl, p.badge);
  }

  // 3. 左侧原海报三段外挂标尺实况
  if (els.railHeader) {
    const hdrBad = frame.headerH > 102 || frame.headerPct > 19;
    setText(els.railHeader, `高 ${frame.headerH}px（${frame.headerPct}%）`);
    setClass(els.railHeader, "is-err", hdrBad);
    setClass(els.railHeader, "is-ok", !hdrBad);
  }
  if (els.railBody) {
    const bodyBad = frame.issues.some((i) =>
      ["rigid-narrow", "main-squeezed", "main-overwide", "sidebar-crushed", "fat-wing"].includes(i.id)
    );
    setText(
      els.railBody,
      frame.stackedMobile ? `单列主区 ${frame.effMainW}px` : `主 ${frame.mainPct}% · ${frame.effMainW}px`
    );
    setClass(els.railBody, "is-err", bodyBad);
    setClass(els.railBody, "is-ok", !bodyBad);
  }
  if (els.railFooter) {
    const ftrBad = frame.footerGap > 18 || frame.heightGap > 18;
    setText(
      els.railFooter,
      frame.footerGap > 18
        ? `悬空 ${frame.footerGap}px`
        : frame.heightGap > 18
          ? `参差 ΔH ${frame.heightGap}px`
          : "等高贴底 ✓"
    );
    setClass(els.railFooter, "is-err", ftrBad);
    setClass(els.railFooter, "is-ok", !ftrBad);
  }

  document.querySelectorAll("[data-focus-btn]").forEach((btn) => {
    setClass(btn, "is-active", state.focusZone === btn.dataset.focusBtn);
  });

  // 4. 场景切签与视口快捷按钮
  document.querySelectorAll("#scene-tabs button[data-scene]").forEach((b) => {
    const on = b.dataset.scene === state.scene;
    setClass(b, "is-active", on);
    if (b.getAttribute("aria-pressed") !== String(on)) b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll(".vp-btn[data-vp]").forEach((b) => {
    setClass(b, "is-active", Math.abs(Number(b.dataset.vp) - frame.vw) <= 6);
  });
  if (els.btnSourceOverlay) {
    setClass(els.btnSourceOverlay, "is-active", state.showSourceOverlay);
    if (els.btnSourceOverlay.getAttribute("aria-pressed") !== String(state.showSourceOverlay)) {
      els.btnSourceOverlay.setAttribute("aria-pressed", String(state.showSourceOverlay));
    }
    setText(els.btnSourceOverlay, state.showSourceOverlay ? "源码流：开 [Space]" : "源码流 [Space]");
  }

  // 5. 滑块与开关（全部与计算后的单真源对齐）
  setVal(els.ctrlVw, frame.vw);
  setVal(els.ctrlLw, state.leftW);
  setVal(els.ctrlRw, state.rightW);
  setVal(els.ctrlHh, frame.headerH);

  setText(els.valVw, `${frame.vw}px`);
  setText(els.valLw, state.leftOpen ? `${state.leftW}px` : "已收起");
  setText(els.valRw, frame.autoFoldedRight ? "平板折收" : state.rightOpen ? `${state.rightW}px` : "已收起");
  setText(els.valHh, `${frame.headerH}px`);

  if (els.togSticky) {
    setText(els.togSticky, `等高与粘底锁：${state.equalSticky ? "开" : "关"}`);
    setClass(els.togSticky, "is-active", state.equalSticky);
    setClass(els.togSticky, "is-warn", !state.equalSticky && (frame.footerGap > 18 || frame.heightGap > 18));
    els.togSticky.setAttribute("aria-pressed", String(state.equalSticky));
  }
  if (els.togResp) {
    setText(els.togResp, `响应式折翼：${state.responsive ? "开" : "关"}`);
    setClass(els.togResp, "is-active", state.responsive);
    setClass(els.togResp, "is-warn", !state.responsive && frame.vw < 900);
    els.togResp.setAttribute("aria-pressed", String(state.responsive));
  }
  if (els.togSource) {
    const mainFirst = state.sourceOrder === "main-first";
    setText(els.togSource, `源码序：${mainFirst ? "主内容优先" : "左栏先读"}`);
    setClass(els.togSource, "is-active", mainFirst);
    setClass(els.togSource, "is-warn", !mainFirst);
    els.togSource.setAttribute("aria-pressed", String(mainFirst));
  }
  if (els.togLeft) {
    setText(els.togLeft, `左侧栏：${state.leftOpen ? "开" : "收"}`);
    setClass(els.togLeft, "is-active", state.leftOpen);
    els.togLeft.setAttribute("aria-pressed", String(state.leftOpen));
  }
  if (els.togRight) {
    setText(els.togRight, `右侧栏：${state.rightOpen ? "开" : "收"}`);
    setClass(els.togRight, "is-active", state.rightOpen);
    els.togRight.setAttribute("aria-pressed", String(state.rightOpen));
  }
  document.querySelectorAll(".len-btn[data-len]").forEach((b) => {
    setClass(b, "is-active", b.dataset.len === state.contentLen);
  });

  // 6. 深梅紫单真源诊单舱
  setText(els.auditBadge, frame.statusBadge);
  setClass(els.auditBadge, "is-ok", allOk);
  setClass(els.auditBadge, "is-err", !allOk);
  setText(els.auditTitle, frame.verdictTitle);
  setText(els.auditWhy, frame.verdictWhy);
  setText(els.auditHint, frame.verdictHint);
  if (els.btnFixOne) {
    if (frame.primary) {
      els.btnFixOne.hidden = false;
      setText(els.btnFixOne, `${frame.primary.fixLabel}（剩 ${frame.issues.length} 处）`);
    } else {
      els.btnFixOne.hidden = true;
    }
  }

  // 7. 实测几何读数卡
  setText(
    els.mRatio,
    frame.stackedMobile ? "单列流 100%" : `${frame.leftPct}% : ${frame.mainPct}% : ${frame.rightPct}%`
  );
  setText(els.mMain, `${frame.effMainW}px · 约${frame.charsPerLine}字/行`);
  setText(els.mDh, frame.heightGap > 0 ? `参差 ${frame.heightGap}px` : "0px（等高齐底）");
  setText(
    els.mFoot,
    `${frame.footerGap > 0 ? `悬空 ${frame.footerGap}px` : "贴底"} · ${state.sourceOrder === "main-first" ? "主先" : "左先"}`
  );
}

// 启动开场 2D Canvas
if (els.canvas) {
  heroCtrl = createHeroCanvas(
    els.canvas,
    () => state,
    () => frame,
    (patch, fromDrag, forceSync) => patchState(patch, fromDrag, forceSync),
    (zone) => patchState({ focusZone: zone })
  );
}

// 绑定开场交互控件
document.getElementById("scene-tabs")?.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-scene]");
  if (b) patchState({ scene: b.dataset.scene });
});

document.querySelector(".vp-quick")?.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-vp]");
  if (b) patchState({ viewportW: Number(b.dataset.vp) });
});

els.btnSourceOverlay?.addEventListener("click", () => {
  patchState({ showSourceOverlay: !state.showSourceOverlay });
});

document.getElementById("hero-probes")?.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-focus]");
  if (!b) return;
  const f = b.dataset.focus;
  patchState({ focusZone: state.focusZone === f ? null : f });
});

document.querySelector(".callout-rail")?.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-focus-btn]");
  if (!b) return;
  const f = b.dataset.focusBtn;
  patchState({ focusZone: state.focusZone === f ? null : f });
});

els.ctrlVw?.addEventListener("input", () => patchState({ viewportW: Number(els.ctrlVw.value) }));
els.ctrlLw?.addEventListener("input", () => patchState({ leftW: Number(els.ctrlLw.value), leftOpen: true }));
els.ctrlRw?.addEventListener("input", () => patchState({ rightW: Number(els.ctrlRw.value), rightOpen: true }));
els.ctrlHh?.addEventListener("input", () => patchState({ headerH: Number(els.ctrlHh.value) }));

els.togSticky?.addEventListener("click", () => patchState({ equalSticky: !state.equalSticky }));
els.togResp?.addEventListener("click", () => patchState({ responsive: !state.responsive }));
els.togSource?.addEventListener("click", () =>
  patchState({ sourceOrder: state.sourceOrder === "main-first" ? "nav-first" : "main-first" })
);
els.togLeft?.addEventListener("click", () => patchState({ leftOpen: !state.leftOpen }));
els.togRight?.addEventListener("click", () => patchState({ rightOpen: !state.rightOpen }));

document.querySelector(".len-group")?.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-len]");
  if (b) patchState({ contentLen: b.dataset.len });
});

els.btnFixOne?.addEventListener("click", () => {
  const patch = buildPrimaryFix(state, frame);
  if (patch) patchState(patch);
});

els.btnFixAll?.addEventListener("click", () => {
  patchState({ ...VALID_PRESETS.classic.patch, focusZone: null });
});

els.btnResetBroken?.addEventListener("click", () => {
  patchState({ ...BROKEN_STATE, scene: state.scene });
});

document.getElementById("valid-presets")?.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-valid]");
  if (b && VALID_PRESETS[b.dataset.valid]) {
    patchState({ ...VALID_PRESETS[b.dataset.valid].patch, focusZone: null });
  }
});

document.getElementById("anti-presets")?.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-anti]");
  if (b && ANTI_PRESETS[b.dataset.anti]) {
    patchState({ ...ANTI_PRESETS[b.dataset.anti].patch, focusZone: null });
  }
});

// 画布键盘操作（←/→ 调视口宽、↑/↓ 调双翼宽、Space 开关源码流透视）
els.canvas?.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    patchState({ viewportW: clamp(state.viewportW - 30, 360, 1360) });
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    patchState({ viewportW: clamp(state.viewportW + 30, 360, 1360) });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    patchState({
      leftW: clamp(state.leftW + 12, 100, 340),
      rightW: clamp(state.rightW + 12, 100, 340),
    });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    patchState({
      leftW: clamp(state.leftW - 12, 100, 340),
      rightW: clamp(state.rightW - 12, 100, 340),
    });
  } else if (e.key === " ") {
    e.preventDefault();
    patchState({ showSourceOverlay: !state.showSourceOverlay });
  }
});

// 初始同步 + 初始化 01–07 七大节互动
syncUI();
heroCtrl?.notify(true);
initSec01EraTimeline();
initSec02RoleAudit();
initSec03BreakpointLab();
initSec04DecisionTree();
initSec05MisuseCompare();
initSec06Quiz();
initPosterLightbox();

// 259 分屏布局（SPLIT-SCREEN LAYOUT）主入口：联结单真源模型、开场 2D 调度台与七节正文互动
import { auditState, clampSplit, INITIAL_STATE, PRESETS } from "./model.js";
import { createHeroStage } from "./hero-stage.js";
import { initSections } from "./sections.js";

const state = { ...INITIAL_STATE };
const canvas = document.getElementById("hero-canvas");

const els = {
  statusPill: document.getElementById("hero-status-pill"),
  tsbLeft: document.getElementById("tsb-left"),
  tsbRight: document.getElementById("tsb-right"),
  diagScore: document.getElementById("diag-score"),
  diagHeadline: document.getElementById("diag-headline"),
  diagBody: document.getElementById("diag-body"),
  diagHint: document.getElementById("diag-hint"),
  btnFix: document.getElementById("btn-fix"),
  btnPulse: document.getElementById("btn-pulse"),
  btnReset: document.getElementById("btn-reset"),
  splitRange: document.getElementById("split-range"),
  splitVal: document.getElementById("split-val"),
  btnGuides: document.getElementById("btn-guides"),
  probeContrast: document.getElementById("probe-contrast"),
  probeDialogue: document.getElementById("probe-dialogue"),
  probeTension: document.getElementById("probe-tension"),
  probeClarity: document.getElementById("probe-clarity"),
};

let stage;

function syncUI() {
  const audit = auditState(state);

  // 刊头状态与自示范实时分屏条
  els.statusPill.textContent = audit.badge;
  els.statusPill.classList.toggle("is-pass", audit.score === 4);

  const leftBarPct = audit.stacked ? 50 : audit.splitPctL;
  const rightBarPct = 100 - leftBarPct;
  els.tsbLeft.style.width = `${leftBarPct}%`;
  els.tsbLeft.querySelector("span").textContent = audit.stacked ? "TOP 50%" : `L ${leftBarPct}%`;
  els.tsbRight.querySelector("span").textContent = audit.stacked ? "BOT 50%" : `R ${rightBarPct}%`;

  // 诊断盒
  els.diagScore.textContent = audit.badge;
  els.diagScore.classList.toggle("is-pass", audit.score === 4);
  els.diagHeadline.textContent = audit.headline;
  els.diagBody.textContent = audit.body;
  els.diagHint.textContent = audit.actionHint;
  els.btnFix.textContent = audit.fixLabel;

  // 四枚设计要点实况探针
  const axisMap = [
    ["contrast", els.probeContrast],
    ["dialogue", els.probeDialogue],
    ["tension", els.probeTension],
    ["clarity", els.probeClarity],
  ];
  for (const [key, badgeEl] of axisMap) {
    const info = audit.axes[key];
    badgeEl.textContent = info.tag;
    const item = badgeEl.closest(".kp-item");
    if (item) {
      item.classList.toggle("is-pass", info.ok);
      item.classList.toggle("is-fail", !info.ok);
    }
  }

  // 同步所有原生控件
  els.splitRange.value = String(audit.splitPctL);
  els.splitVal.textContent = audit.stacked ? "上下 50:50" : `${audit.splitPctL} : ${audit.splitPctR}`;
  els.btnGuides.textContent = state.showGuides ? "标尺：开" : "标尺：关";
  els.btnGuides.classList.toggle("is-active", state.showGuides);
  els.btnGuides.setAttribute("aria-pressed", String(state.showGuides));

  document.querySelectorAll("[data-specimen]").forEach((b) => {
    const on = b.dataset.specimen === state.specimen;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  document.querySelectorAll("[data-vp]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.vp === state.viewportMode);
  });
  document.querySelectorAll("[data-left-tone]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.leftTone === state.leftTone);
  });
  document.querySelectorAll("[data-right-tone]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.rightTone === state.rightTone);
  });
  document.querySelectorAll("[data-bridge]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.bridge === state.bridge);
  });
  document.querySelectorAll("[data-density]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.density === state.density);
  });
  document.querySelectorAll("[data-mobile]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.mobile === state.mobileMode);
  });
}

function patchState(patch) {
  Object.assign(state, patch);
  state.split = clampSplit(state.split);
  syncUI();
  stage.invalidate();
}

stage = createHeroStage(canvas, () => state, patchState);

// 事件绑定
document.getElementById("specimen-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-specimen]");
  if (!btn) return;
  patchState({ specimen: btn.dataset.specimen });
});

document.getElementById("viewport-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-vp]");
  if (!btn) return;
  patchState({ viewportMode: btn.dataset.vp });
});

document.getElementById("left-tone-chips").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-left-tone]");
  if (!btn) return;
  patchState({ leftTone: btn.dataset.leftTone });
});

document.getElementById("right-tone-chips").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-right-tone]");
  if (!btn) return;
  patchState({ rightTone: btn.dataset.rightTone });
});

document.getElementById("bridge-chips").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-bridge]");
  if (!btn) return;
  patchState({ bridge: btn.dataset.bridge });
});

document.getElementById("density-chips").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-density]");
  if (!btn) return;
  patchState({ density: btn.dataset.density });
});

document.getElementById("mobile-chips").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-mobile]");
  if (!btn) return;
  patchState({ viewportMode: "mobile390", mobileMode: btn.dataset.mobile });
});

els.splitRange.addEventListener("input", () => {
  patchState({ split: Number(els.splitRange.value) / 100 });
});

els.btnGuides.addEventListener("click", () => {
  patchState({ showGuides: !state.showGuides });
});

els.btnFix.addEventListener("click", () => {
  const audit = auditState(state);
  if (audit.fixPatch) {
    patchState(audit.fixPatch);
  } else {
    stage.triggerPulse();
  }
});

els.btnPulse.addEventListener("click", () => {
  stage.triggerPulse();
});

els.btnReset.addEventListener("click", () => {
  patchState({ ...INITIAL_STATE, specimen: state.specimen });
});

document.getElementById("preset-row").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-preset]");
  if (!btn) return;
  const preset = PRESETS[btn.dataset.preset];
  if (!preset) return;
  patchState(preset.patch);
});

// 键盘操作：←/→ 调中缝比例，↑/↓ 切换中缝桥接，Space 演播视线
document.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  const lb = document.getElementById("lightbox");
  if (lb && !lb.hidden) return;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    patchState({ split: state.split - 0.02 });
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    patchState({ split: state.split + 0.02 });
  } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    if (document.activeElement === canvas || window.scrollY < 260) {
      e.preventDefault();
      const order = ["broken", "linked", "wall"];
      const i = order.indexOf(state.bridge);
      patchState({ bridge: order[(i + (e.key === "ArrowUp" ? 1 : 2)) % order.length] });
    }
  } else if (e.key === " ") {
    if (window.scrollY < 450 && tag !== "BUTTON" && tag !== "A") {
      e.preventDefault();
      stage.triggerPulse();
    }
  }
});

syncUI();
initSections();

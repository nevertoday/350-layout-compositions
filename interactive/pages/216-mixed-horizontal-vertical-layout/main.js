// 216 横直混排 · 主控脚本
import {
  createInitialState,
  computeLayout,
  auditLayout,
  PRESET_SOLUTIONS,
  PRESET_TRAPS,
  SPECIMENS,
} from "./model.js";
import { mountComposer } from "./stage.js";
import {
  initRoleSorter,
  initSeamMicroscope,
  initHistoryTimeline,
  initMediaLab,
  initAvoidCards,
  initQuiz,
  initPosterLightbox,
} from "./sections.js";

let state = createInitialState();
let lastAudit = null;

const els = {
  canvas: document.getElementById("hero-canvas"),
  statusPill: document.getElementById("hero-status-pill"),
  statusPillMobile: document.getElementById("hero-status-mobile"),
  axisNode: document.getElementById("cross-axis-node"),
  axisHVal: document.getElementById("axis-h-val"),
  axisVVal: document.getElementById("axis-v-val"),
  diagTag: document.getElementById("diag-tag"),
  diagHeadline: document.getElementById("diag-headline"),
  diagReason: document.getElementById("diag-reason"),
  diagHint: document.getElementById("diag-hint"),
  diagFixBtn: document.getElementById("diag-fix-btn"),
  diagBox: document.getElementById("diag-box"),
  diagMetrics: document.getElementById("diag-metrics"),
  diagCss: document.getElementById("diag-css"),
  ratioRange: document.getElementById("ctrl-ratio"),
  ratioVal: document.getElementById("ctrl-ratio-val"),
  guidesBtn: document.getElementById("ctrl-guides"),
  scanBtn: document.getElementById("ctrl-scan"),
  resetBtn: document.getElementById("ctrl-reset"),
  specimenBtns: [...document.querySelectorAll("[data-specimen]")],
  transBtns: [...document.querySelectorAll("[data-trans]")],
  hierBtns: [...document.querySelectorAll("[data-hier]")],
  dirBtns: [...document.querySelectorAll("[data-dir-block]")],
  solBtns: [...document.querySelectorAll("[data-solution]")],
  trapBtns: [...document.querySelectorAll("[data-trap]")],
  principleRows: [...document.querySelectorAll("[data-principle]")],
};

function syncUI(layout) {
  const lay = layout || computeLayout(state, 640, 460);
  const audit = auditLayout(lay, state);
  lastAudit = audit;

  // 顶部状态徽章（桌面+移动端同步）
  for (const pill of [els.statusPill, els.statusPillMobile]) {
    if (!pill) continue;
    pill.textContent = audit.statusTag;
    pill.classList.toggle("is-ok", audit.passed);
    pill.classList.toggle("is-err", !audit.passed);
  }

  // 顶沿原海报活体十字信息流交点联动
  if (els.axisNode) {
    const leftPct = Math.max(18, Math.min(82, lay.leftSharePct));
    els.axisNode.style.left = `${leftPct}%`;
    els.axisNode.classList.toggle("is-err", !audit.passed);
  }
  if (els.axisHVal) els.axisHVal.textContent = `${lay.leftSharePct}%`;
  if (els.axisVVal) els.axisVVal.textContent = `${lay.rightSharePct}%`;

  // 左翼深松绿竖旗 5 项设计要点实况灯
  els.principleRows.forEach((row) => {
    const key = row.dataset.principle;
    const item = audit.principles.find((p) => p.key === key);
    if (!item) return;
    row.classList.toggle("is-ok", item.ok);
    row.classList.toggle("is-err", !item.ok);
    const badge = row.querySelector("[data-p-badge]");
    if (badge) badge.textContent = item.badge;
  });

  // 单真源诊单
  els.diagBox.classList.toggle("is-ok", audit.passed);
  els.diagBox.classList.toggle("is-err", !audit.passed);
  els.diagTag.textContent = audit.statusTag;
  els.diagHeadline.textContent = audit.headline;
  els.diagReason.textContent = audit.reason;
  els.diagHint.textContent = audit.fixHint;
  els.diagFixBtn.textContent = audit.fixLabel;

  // 4 项实测读数（全自 computeLayout，无假精确百分比）
  els.diagMetrics.innerHTML = `
    <div><span>横纵实占比</span><strong>${audit.metrics.ratioText}</strong></div>
    <div><span>交界实净空</span><strong>${audit.metrics.seamText}</strong></div>
    <div><span>90° 转向</span><strong>${audit.metrics.turnsText}</strong></div>
    <div><span>主次态势</span><strong>${audit.posture}（示意）</strong></div>
  `;
  els.diagCss.textContent = audit.cssSnippet;

  // 同步所有控台按钮激活态
  els.ratioRange.value = String(Math.round(state.ratio * 100));
  els.ratioVal.textContent = `${lay.leftSharePct}% : ${lay.rightSharePct}%`;

  els.specimenBtns.forEach((b) => {
    const on = b.dataset.specimen === state.specimen;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  els.transBtns.forEach((b) => {
    const on = b.dataset.trans === state.transition;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  els.hierBtns.forEach((b) => {
    const on = b.dataset.hier === state.hierarchy;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  els.dirBtns.forEach((b) => {
    const k = b.dataset.dirBlock;
    const isV = state.dirs[k] === "V";
    b.classList.toggle("is-vert", isV);
    b.setAttribute("aria-pressed", String(isV));
    const tag = b.querySelector("em");
    if (tag) tag.textContent = isV ? "竖 V" : "横 H";
  });
  els.guidesBtn.textContent = state.showGuides ? "标尺：开" : "标尺：关";
  els.guidesBtn.setAttribute("aria-pressed", String(state.showGuides));
}

function setState(updater) {
  state = typeof updater === "function" ? updater(state) : { ...state, ...updater };
  composer.redraw();
  const cur = composer.getLayout();
  const W = cur ? cur.W : 640;
  const H = cur ? cur.H : 460;
  syncUI(computeLayout(state, W, H));
}

const composer = mountComposer(
  els.canvas,
  () => state,
  (updater) => setState(updater),
  (layout) => {
    // 仅在尺寸变化或首次算完时同步数值，不触发额外重绘
    if (!lastAudit) syncUI(layout);
  }
);

// 绑定所有开场控台交互
els.specimenBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const key = b.dataset.specimen;
    if (!SPECIMENS[key]) return;
    setState((s) => ({ ...s, specimen: key }));
  })
);

els.ratioRange.addEventListener("input", () => {
  const v = Number(els.ratioRange.value) / 100;
  setState((s) => ({ ...s, ratio: v }));
});

els.transBtns.forEach((b) =>
  b.addEventListener("click", () => setState((s) => ({ ...s, transition: b.dataset.trans })))
);

els.hierBtns.forEach((b) =>
  b.addEventListener("click", () => setState((s) => ({ ...s, hierarchy: b.dataset.hier })))
);

els.dirBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const k = b.dataset.dirBlock;
    setState((s) => ({
      ...s,
      selected: k,
      dirs: { ...s.dirs, [k]: s.dirs[k] === "H" ? "V" : "H" },
    }));
  })
);

els.solBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const p = PRESET_SOLUTIONS[b.dataset.solution];
    if (!p) return;
    setState((s) => ({
      ...s,
      ...p.patch,
      dirs: { ...p.patch.dirs },
    }));
  })
);

els.trapBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const p = PRESET_TRAPS[b.dataset.trap];
    if (!p) return;
    setState((s) => ({
      ...s,
      ...p.patch,
      dirs: { ...p.patch.dirs },
    }));
  })
);

els.diagFixBtn.addEventListener("click", () => {
  if (lastAudit && lastAudit.fixAction) {
    setState(lastAudit.fixAction);
  } else {
    composer.playScan();
  }
});

els.guidesBtn.addEventListener("click", () => {
  setState((s) => ({ ...s, showGuides: !s.showGuides }));
});

els.scanBtn.addEventListener("click", () => {
  composer.playScan();
});

els.resetBtn.addEventListener("click", () => {
  const spec = state.specimen;
  setState(() => ({ ...createInitialState(), specimen: spec }));
});

// 初始化首帧 UI + 正文六大节交互
syncUI(composer.getLayout());
initRoleSorter();
initSeamMicroscope();
initHistoryTimeline();
initMediaLab();
initAvoidCards();
initQuiz();
initPosterLightbox();

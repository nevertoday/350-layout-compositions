// 173 模块系统 · 主入口：连接 Hero 拼装工作台、单真源诊单、快捷键与 01–07 节交互
import {
  ROLE_NAMES,
  makeBrokenState,
  makeSolutionState,
  makeAntiPreset,
  snapStateToGrid,
  expandSelectedTile,
  splitSelectedTile,
  cycleSelectedRole,
  injectNewModule,
  moveTileSnapped,
} from "./model.js";
import { createWorkbench } from "./workbench.js";
import {
  initBuildSteps,
  initReflowWall,
  initGerstner58,
  initProximityLab,
  initAvoidFlip,
  initQuiz,
  initPosterLightbox,
} from "./sections.js";

// ---------- 全局单真源状态 ----------
let state = makeBrokenState("4x4", "poster");
let lastAudit = null;
let lastUiSignature = "";

// DOM 引用
const heroCanvas = document.getElementById("heroCanvas");
const heroStatusBadge = document.getElementById("heroStatusBadge");
const auditBadge = document.getElementById("auditBadge");
const auditHeadline = document.getElementById("auditHeadline");
const auditBody = document.getElementById("auditBody");
const auditHint = document.getElementById("auditHint");
const primaryFixBtn = document.getElementById("primaryFixBtn");
const resetBrokenBtn = document.getElementById("resetBrokenBtn");

const mSnapErr = document.getElementById("mSnapErr");
const mGapStat = document.getElementById("mGapStat");
const mAreaRatio = document.getElementById("mAreaRatio");
const mGoldShare = document.getElementById("mGoldShare");

const selectedTileTag = document.getElementById("selectedTileTag");
const gapSlider = document.getElementById("gapSlider");
const gapReadout = document.getElementById("gapReadout");
const lockToggleBtn = document.getElementById("lockToggleBtn");
const gapToggleBtn = document.getElementById("gapToggleBtn");
const gridToggleBtn = document.getElementById("gridToggleBtn");

const probeModule = document.getElementById("probeModule");
const probeCombination = document.getElementById("probeCombination");
const probeVariation = document.getElementById("probeVariation");

const specimenBtns = [...document.querySelectorAll("[data-specimen]")];
const formatBtns = [...document.querySelectorAll("[data-format]")];
const solBtns = [...document.querySelectorAll("[data-sol]")];
const antiBtns = [...document.querySelectorAll("[data-anti]")];
const pillarBtns = [...document.querySelectorAll("[data-pillar]")];

function syncControlsUI(audit) {
  const sel = state.tiles.find((t) => t.id === state.selectedId) || state.tiles[0];
  const selDim = sel
    ? `${Number.isInteger(sel.gw) ? sel.gw : sel.gw.toFixed(2)}×${Number.isInteger(sel.gh) ? sel.gh : sel.gh.toFixed(2)}u · ${ROLE_NAMES[sel.role] || "模块"}`
    : "未选中";

  const sig = JSON.stringify([
    audit.badge,
    audit.headline,
    audit.actionLabel,
    audit.maxSnapErr.toFixed(2),
    Math.round(audit.minGapPx),
    Math.round(audit.maxGapPx),
    audit.areaRatio.toFixed(2),
    Math.round(audit.goldShare * 100),
    audit.pillars.module.tag,
    audit.pillars.combination.tag,
    audit.pillars.variation.tag,
    selDim,
    state.gapPx,
    state.unitLock,
    state.uniformGap,
    state.showGrid,
    state.specimen,
    state.format,
    state.highlightPillar,
  ]);
  if (sig === lastUiSignature) return;
  lastUiSignature = sig;

  const statusCls = audit.pass ? "is-ok" : "is-err";
  heroStatusBadge.textContent = audit.badge;
  heroStatusBadge.className = `status-pill ${statusCls}`;
  auditBadge.textContent = audit.badge;
  auditBadge.className = `audit-pill ${statusCls}`;

  auditHeadline.textContent = audit.headline;
  auditBody.textContent = audit.body;
  auditHint.textContent = audit.hint;
  primaryFixBtn.textContent = audit.actionLabel;

  mSnapErr.textContent = `${audit.maxSnapErr.toFixed(2)}u`;
  const effectiveMinGap = audit.overlaps.length > 0 ? 0 : Math.round(audit.minGapPx);
  const effectiveMaxGap = Math.round(audit.maxGapPx);
  mGapStat.textContent =
    effectiveMinGap === effectiveMaxGap
      ? `${Math.round(audit.avgGapPx)}px`
      : `${effectiveMinGap}–${effectiveMaxGap}px`;
  mAreaRatio.textContent = `${audit.areaRatio.toFixed(2)}×`;
  mGoldShare.textContent = `${Math.round(audit.goldShare * 100)}%`;

  selectedTileTag.textContent = `当前：${selDim}`;
  gapSlider.value = String(state.gapPx);
  gapReadout.textContent = `${state.gapPx}px`;

  lockToggleBtn.textContent = `模数锁定：${state.unitLock ? "开" : "关"}`;
  lockToggleBtn.classList.toggle("is-on", state.unitLock);
  lockToggleBtn.setAttribute("aria-pressed", String(state.unitLock));

  gapToggleBtn.textContent = `统一缝隙：${state.uniformGap ? "开" : "关"}`;
  gapToggleBtn.classList.toggle("is-on", state.uniformGap);
  gapToggleBtn.setAttribute("aria-pressed", String(state.uniformGap));

  gridToggleBtn.textContent = `底网：${state.showGrid ? "开" : "关"}`;
  gridToggleBtn.classList.toggle("is-on", state.showGrid);
  gridToggleBtn.setAttribute("aria-pressed", String(state.showGrid));

  probeModule.textContent = audit.pillars.module.tag;
  probeModule.className = `triad-probe ${audit.pillars.module.ok ? "is-ok" : "is-err"}`;
  probeCombination.textContent = audit.pillars.combination.tag;
  probeCombination.className = `triad-probe ${audit.pillars.combination.ok ? "is-ok" : "is-err"}`;
  probeVariation.textContent = audit.pillars.variation.tag;
  probeVariation.className = `triad-probe ${audit.pillars.variation.ok ? "is-ok" : "is-err"}`;

  specimenBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.specimen === state.specimen));
  formatBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.format === state.format));
  pillarBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.pillar === state.highlightPillar)));
}

const bench = createWorkbench(heroCanvas, {
  getState: () => state,
  setState: (next) => {
    state = next;
  },
  onAudit: (audit) => {
    lastAudit = audit;
    syncControlsUI(audit);
  },
});

function update(next) {
  state = next;
  bench.draw();
}

// ---------- 顶条标本、画幅重组与 +1 注入 ----------
specimenBtns.forEach((b) =>
  b.addEventListener("click", () => {
    update({ ...state, specimen: b.dataset.specimen });
  })
);

formatBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const fmt = b.dataset.format;
    if (state.unitLock && state.uniformGap) {
      update(makeSolutionState("poster", fmt, state.specimen));
    } else {
      update(makeBrokenState(fmt, state.specimen));
    }
  })
);

document.getElementById("addModuleBtn")?.addEventListener("click", () => {
  update(injectNewModule(state));
});

// ---------- 选中块编辑操作 ----------
document.getElementById("expandXBtn")?.addEventListener("click", () => {
  update(expandSelectedTile(state, "x"));
});
document.getElementById("expandYBtn")?.addEventListener("click", () => {
  update(expandSelectedTile(state, "y"));
});
document.getElementById("splitBtn")?.addEventListener("click", () => {
  update(splitSelectedTile(state));
});
document.getElementById("roleBtn")?.addEventListener("click", () => {
  update(cycleSelectedRole(state));
});

// ---------- 缝隙与开关 ----------
gapSlider?.addEventListener("input", () => {
  update({ ...state, gapPx: Number(gapSlider.value) });
});

lockToggleBtn?.addEventListener("click", () => {
  if (!state.unitLock) {
    update(snapStateToGrid(state));
  } else {
    update({ ...state, unitLock: false });
  }
});

gapToggleBtn?.addEventListener("click", () => {
  const nextUniform = !state.uniformGap;
  const nextGap = nextUniform && (state.gapPx < 4 || state.gapPx > 20) ? 10 : state.gapPx;
  update({ ...state, uniformGap: nextUniform, gapPx: nextGap });
});

gridToggleBtn?.addEventListener("click", () => {
  update({ ...state, showGrid: !state.showGrid });
});

// ---------- 多组合法解与反向试错 ----------
solBtns.forEach((b) =>
  b.addEventListener("click", () => {
    update(makeSolutionState(b.dataset.sol, state.format, state.specimen));
  })
);

antiBtns.forEach((b) =>
  b.addEventListener("click", () => {
    update(makeAntiPreset(b.dataset.anti, state.format, state.specimen));
  })
);

// ---------- 诊单主操作与复原 ----------
primaryFixBtn?.addEventListener("click", () => {
  const act = lastAudit?.actionType || "fix-modulus";
  if (act === "fix-modulus") {
    update(snapStateToGrid(state));
  } else if (act === "fix-gap") {
    update({ ...state, uniformGap: true, gapPx: 10 });
  } else if (act === "fix-variation" || act === "fix-accent") {
    update(makeSolutionState("poster", state.format, state.specimen));
  } else if (act === "add-module") {
    update(injectNewModule({ ...state, unitLock: true, uniformGap: true }));
  } else if (act === "reflow-3x5") {
    const nextFmt = state.format === "3x5" ? "6x3" : state.format === "6x3" ? "4x4" : "3x5";
    update(makeSolutionState("poster", nextFmt, state.specimen));
  }
});

resetBrokenBtn?.addEventListener("click", () => {
  update(makeBrokenState(state.format, state.specimen));
});

// ---------- 三支柱卡片点击联动高亮 ----------
pillarBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const p = b.dataset.pillar;
    update({ ...state, highlightPillar: state.highlightPillar === p ? null : p });
  })
);

// ---------- 键盘操控（方向键移格、[ / ] 改宽、Space 切底网） ----------
document.addEventListener("keydown", (e) => {
  if (/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || "")) return;
  if (!document.getElementById("posterLightbox")?.hidden) return;
  const sel = state.tiles.find((t) => t.id === state.selectedId);
  if (!sel) return;

  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
    const rect = heroCanvas.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    e.preventDefault();
    const step = state.unitLock ? 1 : 0.15;
    const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
    const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
    if (state.unitLock) {
      update(moveTileSnapped(state, sel.id, sel.gx + dx, sel.gy + dy));
    } else {
      const tiles = state.tiles.map((t) =>
        t.id === sel.id
          ? {
              ...t,
              gx: +Math.max(0, Math.min(state.cols - t.gw, t.gx + dx)).toFixed(2),
              gy: +Math.max(0, Math.min(state.rows - t.gh, t.gy + dy)).toFixed(2),
            }
          : t
      );
      update({ ...state, tiles });
    }
  } else if (e.key === "]") {
    e.preventDefault();
    update(expandSelectedTile(state, "x"));
  } else if (e.key === "[") {
    e.preventDefault();
    update(splitSelectedTile(state));
  } else if (e.key === " ") {
    const rect = heroCanvas.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    if (e.target?.tagName === "BUTTON") return;
    e.preventDefault();
    update({ ...state, showGrid: !state.showGrid });
  }
});

// ---------- 初始化 01–07 节专属交互 ----------
initBuildSteps();
initReflowWall();
initGerstner58();
initProximityLab();
initAvoidFlip();
initQuiz();
initPosterLightbox();
bench.draw();

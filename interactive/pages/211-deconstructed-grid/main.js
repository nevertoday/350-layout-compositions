// 211 解构网格 DECONSTRUCTED GRID · 主入口
// 连接单真源 model.js、开场 2D 画布、顶沿四符图例、三步重构带、右侧诊单与 01–07 节交互。

import {
  PRESETS,
  START_STATE,
  clamp,
  computeLayout,
  createInitialState,
} from "./model.js";
import { mountHeroStage } from "./hero-stage.js";
import {
  mountSection01,
  mountSection02,
  mountSection03,
  mountSection04,
  mountSection05,
  mountSection06,
} from "./sections-viz.js";

let state = createInitialState();

const canvas = document.getElementById("hero-canvas");
const statusChip = document.getElementById("hero-status-chip");
const heroH1 = document.getElementById("hero-h1");
const diagCard = document.getElementById("diag-card");
const diagBadge = document.getElementById("diag-badge");
const diagTitle = document.getElementById("diag-title");
const diagReason = document.getElementById("diag-reason");
const diagNext = document.getElementById("diag-next");
const diagFixBtn = document.getElementById("diag-fix-btn");
const mSlip = document.getElementById("m-slip");
const mOcc = document.getElementById("m-occ");
const mFree = document.getElementById("m-free");
const mCom = document.getElementById("m-com");
const mTier = document.getElementById("m-tier");
const slipSlider = document.getElementById("slip-slider");
const ctrlSlipVal = document.getElementById("ctrl-slip-val");
const ctrlFragVal = document.getElementById("ctrl-frag-val");
const toggleGhosts = document.getElementById("toggle-ghosts");
const toggleFlow = document.getElementById("toggle-flow");

const stage = mountHeroStage(
  canvas,
  () => state,
  (patch) => updateState(patch)
);

function syncHeroUI() {
  const lay = computeLayout(state);
  const { metrics, ok, issues, primaryIssue, logicStatus, reconStage } = lay;

  // 1. 自示范大标题「解构网格」：随断层状态与是否成立微调字位，直观演示「解构而不乱」
  const chars = heroH1.querySelectorAll(".h1-ch");
  if (ok) {
    // 克制建筑错层：在「解构｜网格」之间形成优雅的断层微阶
    const offsets = [
      "translate(0px, 0px)",
      "translate(0px, -2px)",
      "translate(4px, 2px)",
      "translate(4px, 0px)",
    ];
    chars.forEach((el, i) => (el.style.transform = offsets[i] || ""));
  } else if (state.fragments === 1 || metrics.slipRatioPct < 4) {
    chars.forEach((el) => (el.style.transform = "translate(0px, 0px)"));
  } else {
    // 过碎错态下形成轻微裂口提示
    const chaos = [
      "translate(0px, 0px)",
      "translate(1px, -3px)",
      "translate(5px, 3px)",
      "translate(6px, -1px)",
    ];
    chars.forEach((el, i) => (el.style.transform = chaos[i] || ""));
  }

  // 2. 顶部状态条
  statusChip.dataset.state = ok ? "ok" : "warn";
  statusChip.textContent = ok ? `✓ ${lay.solutionName}` : `${issues.length} 项待重构`;

  // 3. 右上四符活体图例 & 底部四栏核心逻辑实况灯（同源数据！）
  for (const item of logicStatus) {
    const legRow = document.querySelector(`[data-legend="${item.key}"]`);
    const legLive = document.querySelector(`[data-leg-live="${item.key}"]`);
    if (legRow) legRow.dataset.ok = String(item.ok);
    if (legLive) legLive.textContent = item.tag;

    const logicCard = document.querySelector(`[data-logic="${item.key}"]`);
    const logicLive = document.querySelector(`[data-logic-live="${item.key}"]`);
    if (logicCard) logicCard.dataset.ok = String(item.ok);
    if (logicLive) logicLive.textContent = item.tag;
  }

  // 4. 三步「视觉重构示意」高亮同步
  document.querySelectorAll("[data-recon-jump]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(Number(btn.dataset.reconJump) === reconStage));
  });

  // 5. 旁侧银灰单真源诊单
  diagCard.dataset.state = ok ? "ok" : "warn";
  if (ok) {
    diagBadge.textContent = `✓ ${lay.solutionName}`;
    diagTitle.textContent = "网格已沿非对称断层拆解，核心语义与新平衡同时成立";
    diagReason.textContent = `实测 ${metrics.fragments} 块非对称断层平均位移 ${metrics.slipRatioPct}%，语义板 0% 遮挡凌驾前景，净留白 ${metrics.freeSpacePct}% 且重心仅偏 ${metrics.comOffsetPct}%——真正做到了「结构可变，意义不变」。`;
    diagNext.textContent = "可以继续拖动断层切线或切换「双片留白解 / 锁回整网」验证另一端边界。";
    diagFixBtn.textContent = "试错对比：锁回整网";
  } else {
    diagBadge.textContent = primaryIssue.badge;
    diagTitle.textContent = primaryIssue.title;
    diagReason.textContent = primaryIssue.reason;
    diagNext.textContent = primaryIssue.action;
    diagFixBtn.textContent = primaryIssue.fixLabel;
  }

  mSlip.textContent = `${metrics.slipRatioPct}%`;
  mOcc.textContent = `${metrics.occlusionPct}%`;
  mFree.textContent = `${metrics.freeSpacePct}%`;
  mCom.textContent = `${metrics.comOffsetPct}%`;
  mTier.textContent = metrics.tensionTier;

  // 6. 控件状态同步
  slipSlider.value = String(Math.round(state.slip * 100));
  ctrlSlipVal.textContent = `${Math.round(state.slip * 100)}%`;
  ctrlFragVal.textContent =
    state.fragments === 1 ? "完整整网" : `${state.fragments} 片板块`;

  document.querySelectorAll("[data-theme]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.theme === state.theme))
  );
  document.querySelectorAll("[data-frag]").forEach((b) =>
    b.setAttribute("aria-pressed", String(Number(b.dataset.frag) === state.fragments))
  );
  document.querySelectorAll("[data-layer]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.layer === state.layerMode))
  );
  document.querySelectorAll("[data-bal]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.bal === state.balanceMode))
  );
  toggleGhosts.setAttribute("aria-pressed", String(state.showGhosts));
  toggleFlow.setAttribute("aria-pressed", String(state.showFlow));
}

function updateState(patch) {
  state = { ...state, ...patch };
  stage.notify();
  syncHeroUI();
}

// 绑定题材、切分、滑移、层级、压舱、预设与三步重构跳转
document.querySelectorAll("[data-theme]").forEach((b) =>
  b.addEventListener("click", () => updateState({ theme: b.dataset.theme }))
);

document.querySelectorAll("[data-frag]").forEach((b) =>
  b.addEventListener("click", () => {
    const f = Number(b.dataset.frag);
    const patch = { fragments: f };
    if (f === 1) patch.slip = 0;
    else if (state.slip < 0.12) patch.slip = 0.46;
    updateState(patch);
  })
);

slipSlider.addEventListener("input", () => {
  const s = Number(slipSlider.value) / 100;
  const patch = { slip: s };
  if (state.fragments === 1 && s > 0.08) {
    patch.fragments = 4;
    patch.cutX = 0.63;
    patch.cutY = 0.42;
  }
  updateState(patch);
});

toggleGhosts.addEventListener("click", () =>
  updateState({ showGhosts: !state.showGhosts })
);
toggleFlow.addEventListener("click", () =>
  updateState({ showFlow: !state.showFlow })
);

document.querySelectorAll("[data-layer]").forEach((b) =>
  b.addEventListener("click", () => updateState({ layerMode: b.dataset.layer }))
);
document.querySelectorAll("[data-bal]").forEach((b) =>
  b.addEventListener("click", () => updateState({ balanceMode: b.dataset.bal }))
);

document.querySelectorAll("[data-preset]").forEach((b) =>
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (p) updateState(p.patch);
  })
);

diagFixBtn.addEventListener("click", () => {
  const lay = computeLayout(state);
  if (lay.ok) {
    updateState(PRESETS.errRigid.patch);
  } else if (lay.primaryIssue && lay.primaryIssue.fixPatch) {
    updateState(lay.primaryIssue.fixPatch);
  }
});

// 点击三步「视觉重构示意」直接切换展示对应演进阶段
document.querySelectorAll("[data-recon-jump]").forEach((b) =>
  b.addEventListener("click", () => {
    const idx = Number(b.dataset.reconJump);
    if (idx === 0) updateState(PRESETS.errRigid.patch);
    else if (idx === 1)
      updateState({
        fragments: 4,
        cutX: 0.62,
        cutY: 0.44,
        slip: 0.64,
        layerMode: "flat",
        balanceMode: "piled",
      });
    else updateState(PRESETS.posterSol.patch);
  })
);

// 键盘操作画布：←/→ 微调断层滑移，↑/↓ 微调切线位置，L 切层级，R 复原错态
canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    const next = clamp(state.slip + 0.05, 0, 1);
    updateState({
      slip: Number(next.toFixed(2)),
      ...(state.fragments === 1 ? { fragments: 4, cutX: 0.63, cutY: 0.42 } : {}),
    });
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    updateState({ slip: Number(clamp(state.slip - 0.05, 0, 1).toFixed(2)) });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    updateState({ cutY: Number(clamp(state.cutY - 0.04, 0.28, 0.72).toFixed(2)) });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    updateState({ cutY: Number(clamp(state.cutY + 0.04, 0.28, 0.72).toFixed(2)) });
  } else if (e.key === "l" || e.key === "L") {
    const order = ["buried", "flat", "elevated"];
    const next = order[(order.indexOf(state.layerMode) + 1) % order.length];
    updateState({ layerMode: next });
  } else if (e.key === "r" || e.key === "R") {
    updateState({ ...START_STATE, theme: state.theme });
  }
});

// 初始化 01–06 各节交互
mountSection01(document.getElementById("sec-01"));
mountSection02(document.querySelector("[data-s2-root]"));
mountSection03(document.querySelector("[data-s3-root]"));
mountSection04(document.querySelector("[data-s4-root]"));
mountSection05(document.querySelector("[data-s5-root]"));
mountSection06(document.querySelector("[data-s6-root]"));

// 初始化 07 原海报灯箱（复用 #poster src，零重复内联；支持缩放、拖拽、Esc 关闭）
(function initLightbox() {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const lbZoomVal = document.getElementById("lb-zoom-val");
  const btnIn = document.getElementById("lb-in");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");

  let zoom = 1;
  let tx = 0;
  let ty = 0;
  let panning = false;
  let px0 = 0;
  let py0 = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
    lbZoomVal.textContent = `${Math.round(zoom * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    zoom = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => {
    zoom = clamp(zoom + 0.35, 0.7, 4);
    applyTransform();
  });
  btnOut.addEventListener("click", () => {
    zoom = clamp(zoom - 0.35, 0.7, 4);
    applyTransform();
  });
  btnReset.addEventListener("click", () => {
    zoom = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbStage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoom = clamp(zoom + (e.deltaY < 0 ? 0.2 : -0.2), 0.7, 4);
      applyTransform();
    },
    { passive: false }
  );

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage && zoom <= 1.05) {
      close();
      return;
    }
    panning = true;
    px0 = e.clientX - tx;
    py0 = e.clientY - ty;
    lbStage.setPointerCapture(e.pointerId);
  });

  lbStage.addEventListener("pointermove", (e) => {
    if (!panning) return;
    tx = e.clientX - px0;
    ty = e.clientY - py0;
    applyTransform();
  });

  lbStage.addEventListener("pointerup", () => {
    panning = false;
  });

  window.addEventListener("keydown", (e) => {
    if (!lb.hidden && e.key === "Escape") close();
  });
})();

syncHeroUI();

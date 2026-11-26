// 176 左对齐右参差 · 主入口控制器
// 把单真源排字模型、开场排字修边台、右侧原海报活体几何仪（朱红巨圆 + 竖黑轴 + 10×11 参差波形点阵）
// 与 01–07 全部互动章节串联起来。

import { INITIAL_STATE, VALID_PRESETS, FAIL_PRESETS } from "./model.js";
import { createHeroStage } from "./hero-stage.js";
import {
  initReturnSweepLab,
  initRagAnatomy,
  initScriptComparator,
  initHistoryDrawer,
  initAntiExamples,
  initQuiz,
  initPosterLightbox,
} from "./sections.js";

const state = { ...INITIAL_STATE, pushes: {} };

// 构造原海报右下角 10×11 朱红点阵（活体映射到排字台的每一行宽度轮廓！）
function buildPosterDotMatrix() {
  const host = document.getElementById("dotMatrix");
  if (!host) return [];
  const rows = 11;
  const cols = 10;
  const cells = [];
  const frag = document.createDocumentFragment();
  for (let r = 0; r < rows; r++) {
    const rowEl = [];
    for (let c = 0; c < cols; c++) {
      const dot = document.createElement("span");
      dot.className = "gm-dot";
      dot.setAttribute("aria-hidden", "true");
      frag.appendChild(dot);
      rowEl.push(dot);
    }
    cells.push(rowEl);
  }
  host.appendChild(frag);
  return cells;
}

const dotRows = buildPosterDotMatrix();

// DOM 引用
const canvas = document.getElementById("heroCanvas");
const topBadge = document.getElementById("heroStatusBadge");
const diagCard = document.getElementById("diagCard");
const diagTag = document.getElementById("diagTag");
const diagMeta = document.getElementById("diagMeta");
const diagHeadline = document.getElementById("diagHeadline");
const diagBody = document.getElementById("diagBody");
const diagHint = document.getElementById("diagHint");

const badgeStartTag = document.getElementById("badgeStartTag");
const badgeReadingTag = document.getElementById("badgeReadingTag");
const badgeRhythmTag = document.getElementById("badgeRhythmTag");
const badgeStartItem = document.getElementById("badgeStartItem");
const badgeReadingItem = document.getElementById("badgeReadingItem");
const badgeRhythmItem = document.getElementById("badgeRhythmItem");

const motifAxis = document.getElementById("motifAxis");
const motifCaption = document.getElementById("motifCaption");

const measureSlider = document.getElementById("measureSlider");
const measureVal = document.getElementById("measureVal");
const leadingSlider = document.getElementById("leadingSlider");
const leadingVal = document.getElementById("leadingVal");

const specimenBtns = [...document.querySelectorAll("[data-specimen]")];
const alignBtns = [...document.querySelectorAll("[data-align]")];
const validBtns = [...document.querySelectorAll("[data-valid]")];
const failBtns = [...document.querySelectorAll("[data-fail]")];
const sweepBtn = document.getElementById("sweepToggleBtn");
const overlayBtn = document.getElementById("overlayToggleBtn");
const fixBtn = document.getElementById("quickFixBtn");
const resetBtn = document.getElementById("resetBadBtn");
const clearPushBtn = document.getElementById("clearPushBtn");

let lastAuditSig = "";

function syncControls() {
  specimenBtns.forEach((b) => {
    const on = b.dataset.specimen === state.specimen;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  alignBtns.forEach((b) => {
    const on = b.dataset.align === state.align;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  if (measureSlider) measureSlider.value = String(Math.round(state.measure * 100));
  if (measureVal) measureVal.textContent = `${Math.round(state.measure * 100)}%`;
  if (leadingSlider) leadingSlider.value = String(Math.round(state.leading * 100));
  if (leadingVal) leadingVal.textContent = state.leading.toFixed(2);
  if (sweepBtn) {
    sweepBtn.classList.toggle("is-active", state.sweepActive);
    sweepBtn.setAttribute("aria-pressed", String(state.sweepActive));
    sweepBtn.textContent = state.sweepActive ? "停止回扫 [Space]" : "回扫实测 [Space]";
  }
  if (overlayBtn) {
    overlayBtn.classList.toggle("is-active", state.showOverlay);
    overlayBtn.setAttribute("aria-pressed", String(state.showOverlay));
    overlayBtn.textContent = state.showOverlay ? "透视轮廓：开" : "透视轮廓：关";
  }
  if (clearPushBtn) {
    const pushCount = Object.keys(state.pushes || {}).length;
    clearPushBtn.hidden = pushCount === 0;
    clearPushBtn.textContent = `清除修边 (${pushCount})`;
  }
}

// 将单真源实绘结果同步至 DOM 诊单、三红圆徽与右侧原海报活体朱红巨圆/点阵
function syncAuditUI(layout) {
  const { audit, lines } = layout;
  const sig = `${audit.statusTag}|${audit.headline}|${audit.body}|${audit.ragPct}|${audit.badges.start.tag}|${audit.badges.reading.tag}|${audit.badges.rhythm.tag}|${lines.map((l) => Math.round(l.ratio * 100)).join(",")}`;
  if (sig === lastAuditSig) return;
  lastAuditSig = sig;

  const toneClass = audit.passCount === 4 ? "is-pass" : audit.severity === "warn" ? "is-warn" : "is-error";
  if (topBadge) {
    topBadge.textContent = audit.statusTag;
    topBadge.className = `status-pill ${toneClass}`;
  }
  if (diagCard) diagCard.className = `diag-bar ${toneClass}`;
  if (diagTag) diagTag.textContent = audit.statusTag;
  if (diagMeta) {
    diagMeta.textContent = `${audit.lenText} · 行距 ${state.leading.toFixed(2)} · 右缘起伏 ${audit.ragPct}% · 实绘`;
  }
  if (diagHeadline) diagHeadline.textContent = audit.headline;
  if (diagBody) diagBody.textContent = audit.body;
  if (diagHint) diagHint.textContent = audit.hint;

  // 原海报三枚朱红圆徽实时探针
  if (badgeStartTag) badgeStartTag.textContent = audit.badges.start.tag;
  if (badgeReadingTag) badgeReadingTag.textContent = audit.badges.reading.tag;
  if (badgeRhythmTag) badgeRhythmTag.textContent = audit.badges.rhythm.tag;
  badgeStartItem?.classList.toggle("is-ok", audit.badges.start.ok);
  badgeReadingItem?.classList.toggle("is-ok", audit.badges.reading.ok);
  badgeRhythmItem?.classList.toggle("is-ok", audit.badges.rhythm.ok);

  // 右侧活体原海报几何母题：竖黑轴反映起线偏移，10×10 红点阵实时映照左侧参差波形
  if (motifAxis) {
    const offsetPct = state.align === "left" || state.align === "justify" ? 50 : state.align === "center" ? 56 : 63;
    motifAxis.style.left = `${offsetPct}%`;
    motifAxis.classList.toggle("is-skew", state.align !== "left");
  }
  if (motifCaption) {
    motifCaption.textContent =
      audit.passCount === 4
        ? "点阵同步右缘：轻快起伏 · 秩序成立"
        : state.align === "justify"
        ? "点阵同步右缘：硬拉平齐 · 内部裂河"
        : state.align !== "left"
        ? "点阵同步左缘：起线离散 · 失锚抖动"
        : `点阵同步右缘：${audit.badges.rhythm.tag}`;
  }

  // 把实绘各行宽占比实时映射到 10×11 原海报红点阵（仅在类名真变化时改 DOM，零多余重排）
  for (let r = 0; r < dotRows.length; r++) {
    const ln = lines[r];
    const row = dotRows[r];
    if (!ln) {
      for (let c = 0; c < row.length; c++) {
        if (row[c].className !== "gm-dot is-ghost") row[c].className = "gm-dot is-ghost";
      }
      continue;
    }
    const startCol = Math.round((ln.x0 / Math.max(1, layout.measurePx)) * 10);
    const endCol = Math.max(startCol + 1, Math.min(10, Math.round((ln.x1 / Math.max(1, layout.measurePx)) * 10)));
    const isAlert = !audit.checks.rag || !audit.checks.spacing || !audit.checks.start;
    for (let c = 0; c < row.length; c++) {
      const lit = c >= startCol && c < endCol;
      const cls = lit ? (isAlert && c === endCol - 1 ? "gm-dot is-alert" : "gm-dot is-lit") : "gm-dot";
      if (row[c].className !== cls) row[c].className = cls;
    }
  }
}

let stage = null;

function mutateState(patch, opts = {}) {
  Object.assign(state, patch);
  syncControls();
  if (!opts.silent && stage) stage.draw();
}

if (canvas) {
  stage = createHeroStage(canvas, () => state, mutateState, syncAuditUI);
}

// 绑定全部 Hero 控件
specimenBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    mutateState({ specimen: btn.dataset.specimen, pushes: {} });
  })
);
alignBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    mutateState({ align: btn.dataset.align, pushes: {} });
  })
);
measureSlider?.addEventListener("input", () => {
  mutateState({ measure: Number(measureSlider.value) / 100, pushes: {} });
});
leadingSlider?.addEventListener("input", () => {
  mutateState({ leading: Number(leadingSlider.value) / 100 });
});
validBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    const p = VALID_PRESETS[btn.dataset.valid];
    if (p) mutateState({ align: p.align, measure: p.measure, leading: p.leading, pushes: {} });
  })
);
failBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    const p = FAIL_PRESETS[btn.dataset.fail];
    if (p) mutateState({ align: p.align, measure: p.measure, leading: p.leading, pushes: {} });
  })
);
sweepBtn?.addEventListener("click", () => {
  if (state.sweepActive) mutateState({ sweepActive: false });
  else stage?.startSweep();
});
overlayBtn?.addEventListener("click", () => {
  mutateState({ showOverlay: !state.showOverlay });
});
fixBtn?.addEventListener("click", () => {
  const p = VALID_PRESETS.poster;
  mutateState({ align: p.align, measure: p.measure, leading: p.leading, pushes: {} });
});
resetBtn?.addEventListener("click", () => {
  mutateState({
    align: INITIAL_STATE.align,
    measure: INITIAL_STATE.measure,
    leading: INITIAL_STATE.leading,
    pushes: {},
    sweepActive: false,
  });
});
clearPushBtn?.addEventListener("click", () => {
  mutateState({ pushes: {} });
});

// 全局空格触发回扫实测（仅在焦点不在按钮/输入框且首屏在视口附近时）
document.addEventListener("keydown", (ev) => {
  if (ev.code !== "Space") return;
  const tag = document.activeElement?.tagName;
  if (tag === "BUTTON" || tag === "INPUT" || tag === "A" || document.activeElement === canvas) return;
  const heroRect = canvas?.getBoundingClientRect();
  if (heroRect && heroRect.bottom > 80 && heroRect.top < window.innerHeight - 60) {
    ev.preventDefault();
    if (state.sweepActive) mutateState({ sweepActive: false });
    else stage?.startSweep();
  }
});

syncControls();
stage?.draw();
// 内联字体就绪后清空缓存并强制按真实字宽重算一次，保证首帧与全部视口单真源数值 100% 一致
document.fonts?.ready?.then(() => {
  lastAuditSig = "";
  stage?.invalidateFonts();
});

// 启动正文 01–07 全部独立互动模块
initReturnSweepLab();
initRagAnatomy();
initScriptComparator();
initHistoryDrawer();
initAntiExamples();
initQuiz();
initPosterLightbox();

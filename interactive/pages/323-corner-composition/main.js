// 323 边角式构图 — 主入口：连接单真源 model.js、活体主画布与七大交互小节
import { INITIAL_STATE, PRESETS, evaluate } from "./model.js";
import { mountHeroCanvas } from "./hero-canvas.js";
import {
  FORCE_MODES,
  MASTERWORKS,
  QUAD_CARDS,
  QUIZ_QUESTIONS,
  USE_CASES,
  renderQuadSVG,
  renderScaleCards,
} from "./figures.js";

const state = { ...INITIAL_STATE };
const heroCanvas = document.getElementById("hero-canvas");

// ---------- 1. 开场「一角定盘·扇弧定向仪」联动 ----------
const elTitleBlock = document.getElementById("title-block");
const elStatusPill = document.getElementById("hero-status-pill");
const elDiagStrip = document.getElementById("diag-strip");
const elDiagBadge = document.getElementById("diag-badge");
const elDiagTitle = document.getElementById("diag-title");
const elDiagBody = document.getElementById("diag-body");
const elDiagNext = document.getElementById("diag-next");
const elMMass = document.getElementById("m-mass");
const elMVoid = document.getElementById("m-void");
const elMAngle = document.getElementById("m-angle");
const elMTier = document.getElementById("m-tier");

const elRangeAngle = document.getElementById("range-angle");
const elRangeMass = document.getElementById("range-mass");
const elValAngle = document.getElementById("val-angle");
const elValMass = document.getElementById("val-mass");
const elBtnGuides = document.getElementById("btn-guides");

const elPPAnchor = document.getElementById("pp-anchor");
const elPPVector = document.getElementById("pp-vector");
const elPPVoid = document.getElementById("pp-void");
const elTagAnchor = document.getElementById("tag-anchor");
const elTagVector = document.getElementById("tag-vector");
const elTagVoid = document.getElementById("tag-void");

let heroApi = null;
const setText = (el, v) => { if (el.textContent !== v) el.textContent = v; };

function syncHeroUI() {
  const aspect = heroApi ? heroApi.getAspect() : 4 / 3;
  const ev = evaluate(state, aspect);

  // 自示范标题四角标记同步
  if (elTitleBlock.dataset.corner !== state.corner) elTitleBlock.dataset.corner = state.corner;

  // 顶栏状态徽章与诊单（按需更新 DOM，拖动期间零多余回流）
  setText(elStatusPill, ev.badge);
  elStatusPill.classList.toggle("is-warn", !ev.ok);

  elDiagStrip.classList.toggle("is-warn", !ev.ok);
  setText(elDiagBadge, ev.badge);
  setText(elDiagTitle, ev.title);
  setText(elDiagBody, ev.body);
  setText(elDiagNext, `试着改一步：${ev.nextStep}`);

  setText(elMMass, `${ev.massPct}%`);
  setText(elMVoid, `${ev.voidPct}%`);
  setText(elMAngle, state.corner === "center" ? "无指向" : `偏 ${ev.delta}°`);
  setText(elMTier, ev.balanceTier);

  // 原海报三圆环要点状态灯同步
  elPPAnchor.classList.toggle("is-warn", !ev.pointsStatus.anchor.ok);
  setText(elTagAnchor, ev.pointsStatus.anchor.tag);
  elPPVector.classList.toggle("is-warn", !ev.pointsStatus.vector.ok);
  setText(elTagVector, ev.pointsStatus.vector.tag);
  elPPVoid.classList.toggle("is-warn", !ev.pointsStatus.void.ok);
  setText(elTagVoid, ev.pointsStatus.void.tag);

  // 控件状态同步
  const degStr = String(ev.deg);
  if (elRangeAngle.value !== degStr) elRangeAngle.value = degStr;
  setText(elValAngle, `${ev.deg}°`);
  const massStr = String(Math.round(state.mass * 100));
  if (elRangeMass.value !== massStr) elRangeMass.value = massStr;
  setText(elValMass, `${ev.massPct}%`);

  elBtnGuides.setAttribute("aria-pressed", String(state.showGuides));
  setText(elBtnGuides, `引导线：${state.showGuides ? "开" : "关"}`);

  for (const b of document.querySelectorAll("[data-theme]")) {
    b.classList.toggle("is-active", b.dataset.theme === state.theme);
  }
  for (const b of document.querySelectorAll("[data-corner]")) {
    b.classList.toggle("is-active", b.dataset.corner === state.corner);
  }
  for (const b of document.querySelectorAll("[data-echo]")) {
    b.classList.toggle("is-active", b.dataset.echo === state.echo);
  }

  heroApi?.draw();
}

function patchState(patch) {
  Object.assign(state, patch);
  syncHeroUI();
}

heroApi = mountHeroCanvas(heroCanvas, () => state, patchState);

for (const b of document.querySelectorAll("[data-theme]")) {
  b.addEventListener("click", () => patchState({ theme: b.dataset.theme }));
}
for (const b of document.querySelectorAll("[data-preset]")) {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    const { label, ...rest } = p;
    patchState(rest);
  });
}
for (const b of document.querySelectorAll("[data-corner]")) {
  b.addEventListener("click", () => {
    const nextCorner = b.dataset.corner;
    if (nextCorner === state.corner) return;
    const rect = heroCanvas.getBoundingClientRect();
    const aspect = rect.width && rect.height ? rect.width / rect.height : 4 / 3;
    const oldEv = evaluate(state, aspect);
    const patch = { corner: nextCorner };
    if (nextCorner !== "center" && state.corner !== "center") {
      const newIdeal = evaluate({ ...state, corner: nextCorner }, aspect).idealDeg;
      const signed = ((state.angle - oldEv.idealDeg + 540) % 360) - 180;
      patch.angle = ((newIdeal + signed) % 360 + 360) % 360;
    }
    patchState(patch);
  });
}
for (const b of document.querySelectorAll("[data-echo]")) {
  b.addEventListener("click", () => patchState({ echo: b.dataset.echo }));
}

elRangeAngle.addEventListener("input", () => patchState({ angle: Number(elRangeAngle.value) }));
elRangeMass.addEventListener("input", () => patchState({ mass: Number(elRangeMass.value) / 100 }));
elBtnGuides.addEventListener("click", () => patchState({ showGuides: !state.showGuides }));

// ---------- 2. 01 节：四态结构力线剖面 ----------
const forceSvgBox = document.getElementById("force-svg-box");
const forceTag = document.getElementById("force-tag");
const forceTitle = document.getElementById("force-title");
const forceBody = document.getElementById("force-body");

function showForce(key) {
  const m = FORCE_MODES[key] || FORCE_MODES.inward;
  forceSvgBox.innerHTML = m.svg;
  forceTag.textContent = m.tag;
  forceTitle.textContent = m.title;
  forceBody.textContent = m.body;
  for (const b of document.querySelectorAll("[data-force]")) {
    const on = b.dataset.force === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  }
}

for (const b of document.querySelectorAll("[data-force]")) {
  b.addEventListener("click", () => showForce(b.dataset.force));
}
showForce("inward");

// ---------- 3. 02 节：南宋马远三件名作解剖 ----------
const workSvgBox = document.getElementById("work-svg-box");
const workName = document.getElementById("work-name");
const workCorner = document.getElementById("work-corner");
const workMeta = document.getElementById("work-meta");
const workAnalysis = document.getElementById("work-analysis");
const workVoid = document.getElementById("work-void");

function showMasterwork(idx) {
  const w = MASTERWORKS[idx] || MASTERWORKS[0];
  workSvgBox.innerHTML = w.svg;
  workName.textContent = `${w.name} · ${w.artist}`;
  workCorner.textContent = w.corner;
  workMeta.textContent = w.meta;
  workAnalysis.textContent = w.analysis;
  workVoid.textContent = w.voidNote;
  for (const b of document.querySelectorAll("[data-work]")) {
    const on = Number(b.dataset.work) === idx;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  }
}

for (const b of document.querySelectorAll("[data-work]")) {
  b.addEventListener("click", () => showMasterwork(Number(b.dataset.work)));
}
showMasterwork(0);

// ---------- 4. 03 节：2×2 四角翻转矩阵 ----------
const quadGrid = document.getElementById("quad-grid");
const btnQuadIn = document.getElementById("btn-quad-in");
const btnQuadOut = document.getElementById("btn-quad-out");
let quadEscaped = false;

function renderQuads() {
  btnQuadIn.classList.toggle("is-active", !quadEscaped);
  btnQuadIn.setAttribute("aria-pressed", String(!quadEscaped));
  btnQuadOut.classList.toggle("is-active", quadEscaped);
  btnQuadOut.setAttribute("aria-pressed", String(quadEscaped));

  quadGrid.innerHTML = QUAD_CARDS.map((card) => `
    <article class="quad-card ${quadEscaped ? "is-escaped" : ""}">
      ${renderQuadSVG(card, quadEscaped)}
      <h3>${card.name}</h3>
      <p>${quadEscaped ? card.outDesc : card.inDesc}</p>
    </article>
  `).join("");
}

btnQuadIn.addEventListener("click", () => { quadEscaped = false; renderQuads(); });
btnQuadOut.addEventListener("click", () => { quadEscaped = true; renderQuads(); });
renderQuads();

// ---------- 5. 04 节：三媒介留白占比标尺 ----------
const scaleRange = document.getElementById("scale-range");
const scalePctRead = document.getElementById("scale-pct-read");
const scaleVerdict = document.getElementById("scale-verdict");
const scalePhoto = document.getElementById("scale-photo");
const scaleBook = document.getElementById("scale-book");
const scaleApp = document.getElementById("scale-app");

function syncScale(pct) {
  const res = renderScaleCards(pct);
  scalePctRead.textContent = `${pct}% 实 / ${res.voidPct}% 白`;
  scaleVerdict.textContent = res.verdict;
  scaleVerdict.classList.toggle("is-warn", res.tone === "warn");
  scalePhoto.innerHTML = res.photoSvg;
  scaleBook.innerHTML = res.bookSvg;
  scaleApp.innerHTML = res.appSvg;
}

scaleRange.addEventListener("input", () => syncScale(Number(scaleRange.value)));
syncScale(32);

// ---------- 6. 05 节：场景问诊筛查器 ----------
const casePills = document.getElementById("case-pills");
const caseDetail = document.getElementById("case-detail");
const cdBadge = document.getElementById("cd-badge");
const cdTitle = document.getElementById("cd-title");
const cdReason = document.getElementById("cd-reason");
const cdTip = document.getElementById("cd-tip");

casePills.innerHTML = USE_CASES.map((u, i) => `
  <button type="button" class="case-pill ${u.tone === "avoid" ? "is-avoid" : ""} ${i === 0 ? "is-active" : ""}" role="tab" aria-selected="${i === 0}" data-case="${u.id}">
    <span>${u.label}</span>
    <span class="cp-mark">${u.verdict}</span>
  </button>
`).join("");

function showCase(id) {
  const u = USE_CASES.find((x) => x.id === id) || USE_CASES[0];
  caseDetail.classList.toggle("is-avoid", u.tone === "avoid");
  cdBadge.textContent = u.verdict;
  cdTitle.textContent = u.label;
  cdReason.textContent = u.reason;
  cdTip.textContent = `落手建议：${u.tip}`;
  for (const b of casePills.querySelectorAll("[data-case]")) {
    const on = b.dataset.case === u.id;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  }
}

casePills.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-case]");
  if (btn) showCase(btn.dataset.case);
});
showCase(USE_CASES[0].id);

// ---------- 7. 06 节：眼力小练习 ----------
const quizPrompt = document.getElementById("quiz-prompt");
const quizOptions = document.getElementById("quiz-options");
const quizFeedback = document.getElementById("quiz-feedback");
const qfVerdict = document.getElementById("qf-verdict");
const qfExplain = document.getElementById("qf-explain");
const quizReset = document.getElementById("quiz-reset");

let activeQ = 0;
const answers = [null, null];

function renderQuiz() {
  const q = QUIZ_QUESTIONS[activeQ];
  const picked = answers[activeQ];

  for (const b of document.querySelectorAll("[data-q]")) {
    const on = Number(b.dataset.q) === activeQ;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  }

  quizPrompt.textContent = q.prompt;
  quizOptions.innerHTML = q.options.map((opt) => {
    const isPicked = picked === opt.key;
    const isRight = opt.key === q.correct;
    let cls = "";
    let mark = "";
    if (picked) {
      if (isRight) {
        cls = "is-correct";
        mark = "正解";
      } else if (isPicked) {
        cls = "is-wrong";
        mark = "再看一眼";
      }
    }
    return `
      <button type="button" class="quiz-opt ${cls}" data-opt="${opt.key}" aria-pressed="${isPicked}">
        ${picked ? opt.overlaySvg : opt.svg}
        <span class="qo-label">
          <span>${opt.label}</span>
          <span class="qo-mark">${mark}</span>
        </span>
      </button>
    `;
  }).join("");

  if (picked) {
    const chosen = q.options.find((o) => o.key === picked);
    const right = picked === q.correct;
    quizFeedback.hidden = false;
    quizFeedback.classList.toggle("is-wrong", !right);
    qfVerdict.textContent = right ? `选对了（${chosen.label}）` : `你选了 ${chosen.label}，更稳的是方案 ${q.correct}`;
    qfExplain.textContent = chosen.explain;
  } else {
    quizFeedback.hidden = true;
  }
}

quizOptions.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-opt]");
  if (!btn) return;
  answers[activeQ] = btn.dataset.opt;
  renderQuiz();
});

for (const b of document.querySelectorAll("[data-q]")) {
  b.addEventListener("click", () => {
    activeQ = Number(b.dataset.q);
    renderQuiz();
  });
}

quizReset.addEventListener("click", () => {
  answers[activeQ] = null;
  renderQuiz();
});
renderQuiz();

// ---------- 8. 07 节：原海报灯箱（缩放、拖动、Esc 关闭，单次复用 poster.webp） ----------
const posterImg = document.getElementById("poster");
const posterOpen = document.getElementById("poster-open");
const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbScale = document.getElementById("lb-scale");
const lbIn = document.getElementById("lb-in");
const lbOut = document.getElementById("lb-out");
const lbReset = document.getElementById("lb-reset");
const lbClose = document.getElementById("lb-close");

let lbZoom = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = false;
let lbStartX = 0;
let lbStartY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbZoom})`;
  lbScale.textContent = `${Math.round(lbZoom * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbZoom = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  lbClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterOpen.focus();
}

posterOpen.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbIn.addEventListener("click", () => { lbZoom = Math.min(3.5, +(lbZoom + 0.35).toFixed(2)); applyLbTransform(); });
lbOut.addEventListener("click", () => { lbZoom = Math.max(0.7, +(lbZoom - 0.35).toFixed(2)); applyLbTransform(); });
lbReset.addEventListener("click", () => { lbZoom = 1; lbX = 0; lbY = 0; applyLbTransform(); });

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.2 : -0.2;
  lbZoom = Math.max(0.7, Math.min(3.5, +(lbZoom + delta).toFixed(2)));
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  lbDrag = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  lbStage.classList.add("is-grabbing");
  lbStage.setPointerCapture?.(e.pointerId);
});

lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbStartX;
  lbY = e.clientY - lbStartY;
  applyLbTransform();
});

lbStage.addEventListener("pointerup", () => {
  lbDrag = false;
  lbStage.classList.remove("is-grabbing");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// 初始同步
syncHeroUI();

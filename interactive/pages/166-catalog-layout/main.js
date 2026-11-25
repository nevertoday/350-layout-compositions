// 166 图录版式（CATALOG LAYOUT）主控模块
// 连接单真源 model.js、活体印张画布 hero-canvas.js，以及 01–07 全部交互实验室与原海报灯箱。

import { loop } from "../../lib/stage.js";
import {
  THEMES,
  PRESETS,
  createInitialState,
  computeLayout,
  evaluateVsPair,
  clamp,
} from "./model.js";
import { createHeroCanvas } from "./hero-canvas.js";

// ======================== 开场活体图录印张主状态 ========================
const state = createInitialState();

const heroCanvasEl = document.getElementById("hero-canvas");
let cachedLayout = null;
let lastW = 800;
let lastH = 480;

function getLayout(w, h) {
  lastW = w || lastW;
  lastH = h || lastH;
  cachedLayout = computeLayout(state, lastW, lastH);
  return cachedLayout;
}

const elBadgeMod = document.getElementById("badge-module");
const elBadgeCap = document.getElementById("badge-caption");
const elBadgeRhy = document.getElementById("badge-rhythm");
const elSpineMod = document.getElementById("spine-val-module");
const elSpineCap = document.getElementById("spine-val-caption");
const elSpineRhy = document.getElementById("spine-val-rhythm");
const elStamp = document.getElementById("verdict-stamp");
const elVTitle = document.getElementById("verdict-title");
const elVWhy = document.getElementById("verdict-why");
const elFixBtn = document.getElementById("btn-fix-one");
const elMJitter = document.getElementById("m-jitter");
const elMCap = document.getElementById("m-cap");
const elMRatio = document.getElementById("m-ratio");
const elMVs = document.getElementById("m-vs");
const elRange = document.getElementById("scale-range");
const elRangeRead = document.getElementById("scale-readout");
const elVsToggle = document.getElementById("btn-vs-toggle");
const elPathSpark = document.getElementById("path-spark");

// 差分写文本，避免拖动中每帧重写未变动的 DOM 触发浏览器样式与布局抖动
function setText(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}

let lastSparkKey = "";
function renderPathSpark(layout) {
  if (!elPathSpark) return;
  const key = layout.verdict.pass ? "pass" : "fail";
  if (key === lastSparkKey) return;
  lastSparkKey = key;
  if (layout.verdict.pass) {
    // 原海报同款蓝色虚线轻盈跃迁波
    elPathSpark.innerHTML = `
      <path d="M10 24 Q34 8 62 17 T118 16 T166 10" fill="none" stroke="#164FB4" stroke-width="2" stroke-dasharray="4 3" />
      <circle cx="10" cy="24" r="4.5" fill="#164FB4" />
      <circle cx="62" cy="17" r="4" fill="#164FB4" />
      <circle cx="118" cy="16" r="3.5" fill="#10795C" />
      <polyline points="159,8 168,9 164,17" fill="none" stroke="#164FB4" stroke-width="2" />
    `;
  } else {
    // 错态时呈现上下抖动折返红线
    elPathSpark.innerHTML = `
      <polyline points="10,25 38,8 66,27 96,10 128,26 164,15" fill="none" stroke="#B3261A" stroke-width="2" stroke-dasharray="3 3" />
      <circle cx="10" cy="25" r="4" fill="#B3261A" />
      <circle cx="66" cy="27" r="3.5" fill="#B3261A" />
      <circle cx="128" cy="26" r="3.5" fill="#B3261A" />
    `;
  }
}

const triadBtns = [...document.querySelectorAll(".triad-item")];
const spineBtns = [...document.querySelectorAll(".spine-item")];
const themeBtns = [...document.querySelectorAll("[data-theme]")];
const gridBtns = [...document.querySelectorAll("[data-grid]")];
const capBtns = [...document.querySelectorAll("[data-cap]")];

function syncHeroUI(forceMeasure = false) {
  const { w, h } = heroCanvas.getSize(forceMeasure);
  const layout = getLayout(w, h);
  const { pillarStatus, metrics, verdict } = layout;

  const keys = ["module", "caption", "rhythm"];
  keys.forEach((k, i) => {
    triadBtns[i]?.classList.toggle("is-ok", pillarStatus[k].ok);
    spineBtns[i]?.classList.toggle("is-ok", pillarStatus[k].ok);
    spineBtns[i]?.classList.toggle("is-focus", state.highlightGroup === k);
  });

  setText(elBadgeMod, pillarStatus.module.text);
  setText(elBadgeCap, pillarStatus.caption.text);
  setText(elBadgeRhy, pillarStatus.rhythm.text);
  setText(elSpineMod, pillarStatus.module.text);
  setText(elSpineCap, pillarStatus.caption.text);
  setText(elSpineRhy, pillarStatus.rhythm.text);

  setText(elStamp, verdict.tag);
  elStamp.classList.toggle("is-pass", verdict.pass);
  setText(elVTitle, verdict.title);
  setText(elVWhy, verdict.why);
  if (verdict.actionLabel && verdict.fixPatch) {
    if (elFixBtn.hidden) elFixBtn.hidden = false;
    setText(elFixBtn, verdict.actionLabel);
  } else if (!elFixBtn.hidden) {
    elFixBtn.hidden = true;
  }

  setText(elMJitter, `${metrics.baselineJitterPx}px`);
  setText(
    elMCap,
    state.captionMode === "none"
      ? "缺签 0 行"
      : state.captionMode === "overlay"
      ? `遮图 ${metrics.maxOcclusionPct}%`
      : `差 ${metrics.captionLineSpread} 行`
  );
  setText(elMRatio, `${metrics.measuredAreaRatio.toFixed(2)}×`);
  setText(
    elMVs,
    !state.vsEnabled
      ? "已关闭"
      : metrics.vsQuality === "strong"
      ? "反差成立"
      : metrics.vsQuality === "same"
      ? "同图自比"
      : "同质弱差"
  );

  themeBtns.forEach((btn) => {
    const on = btn.dataset.theme === state.theme;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  });
  gridBtns.forEach((btn) => {
    const on = btn.dataset.grid === state.gridMode;
    const isErr = on && (state.gridMode === "jagged" || state.gridMode === "dense6");
    btn.classList.toggle("is-active", on && !isErr);
    btn.classList.toggle("is-active-err", isErr);
  });
  capBtns.forEach((btn) => {
    const on = btn.dataset.cap === state.captionMode;
    const isErr = on && state.captionMode !== "standard";
    btn.classList.toggle("is-active", on && !isErr);
    btn.classList.toggle("is-active-err", isErr);
  });

  const srStr = String(state.scaleRatio);
  if (elRange.value !== srStr) elRange.value = srStr;
  setText(elRangeRead, `${state.scaleRatio.toFixed(2)}×`);
  setText(elVsToggle, state.vsEnabled ? "VS：开" : "VS：关");
  elVsToggle.classList.toggle("is-active", state.vsEnabled);
  elVsToggle.setAttribute("aria-pressed", String(state.vsEnabled));

  renderPathSpark(layout);
}

let uiDirty = false;
function updateState(patch, { fromDrag = false } = {}) {
  Object.assign(state, patch);
  heroCanvas.markDirty();
  if (!fromDrag || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    syncHeroUI();
    heroLoop.draw();
  } else {
    uiDirty = true;
  }
}

const heroCanvas = createHeroCanvas(heroCanvasEl, {
  getState: () => state,
  getLayout,
  onUpdate: (patch, opts) => updateState(patch, opts),
});

const heroLoop = loop(heroCanvasEl, (t, dt, meta) => {
  if (uiDirty) {
    uiDirty = false;
    syncHeroUI();
  }
  heroCanvas.draw(t, dt, meta);
});

// 绑定开场全部控件
document.querySelectorAll("[data-theme]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ theme: btn.dataset.theme }));
});

document.querySelectorAll("[data-grid]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ gridMode: btn.dataset.grid }));
});

document.querySelectorAll("[data-cap]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ captionMode: btn.dataset.cap }));
});

elRange.addEventListener("input", () => {
  updateState({ scaleRatio: clamp(parseFloat(elRange.value) || 1, 1.0, 3.2) });
});

elVsToggle.addEventListener("click", () => {
  updateState({ vsEnabled: !state.vsEnabled });
});

elFixBtn.addEventListener("click", () => {
  if (cachedLayout?.verdict?.fixPatch) {
    updateState(cachedLayout.verdict.fixPatch);
  }
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) updateState({ ...p.state, vsPair: [...p.state.vsPair] });
  });
});

document.querySelectorAll("[data-focus-pillar]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.focusPillar;
    updateState({ highlightGroup: state.highlightGroup === k ? null : k });
  });
});

// 键盘微调（避免劫持输入框和按钮滚动）
window.addEventListener("keydown", (ev) => {
  if (ev.target && /^(INPUT|TEXTAREA|SELECT)$/i.test(ev.target.tagName)) return;
  if (document.getElementById("lightbox")?.hidden === false) return;
  if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") {
    const rect = heroCanvasEl.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      ev.preventDefault();
      const delta = ev.key === "ArrowRight" ? 0.08 : -0.08;
      updateState({ scaleRatio: clamp(+(state.scaleRatio + delta).toFixed(2), 1.0, 3.2) });
    }
  }
});

window.addEventListener("resize", () => {
  syncHeroUI(true);
  heroLoop.draw();
});

// 首次同步渲染
syncHeroUI(true);
heroLoop.draw();

// ======================== 共用 SVG 微缩图形生成器（01–04 节使用） ========================
function miniSpecimenSvg(kind) {
  switch (kind) {
    case "central":
      return `<svg viewBox="0 0 120 90" aria-hidden="true"><rect width="120" height="90" fill="#F0E6D4"/><line x1="12" y1="45" x2="108" y2="45" stroke="#8C8272" stroke-dasharray="3 3"/><line x1="60" y1="8" x2="60" y2="82" stroke="#8C8272" stroke-dasharray="3 3"/><circle cx="60" cy="45" r="24" fill="#E14B21"/><circle cx="104" cy="76" r="4" fill="#0F1114"/></svg>`;
    case "diagonal":
      return `<svg viewBox="0 0 120 90" aria-hidden="true"><rect width="120" height="90" fill="#10795C"/><polygon points="0,90 22,90 118,0 94,0" fill="#EEB71E"/><line x1="50" y1="74" x2="102" y2="22" stroke="#FAF4EA" stroke-width="2.2"/><polyline points="92,22 102,22 102,32" fill="none" stroke="#FAF4EA" stroke-width="2.2"/></svg>`;
    case "scattered":
      return `<svg viewBox="0 0 120 90" aria-hidden="true"><rect width="120" height="90" fill="#0E1011"/><circle cx="28" cy="24" r="5" fill="#1C52C7"/><circle cx="58" cy="40" r="10" fill="#1C52C7"/><circle cx="96" cy="36" r="6" fill="#1C52C7"/><circle cx="22" cy="64" r="7" fill="#1C52C7"/><circle cx="88" cy="70" r="5" fill="#1C52C7"/><path d="M68 16h8M72 12v8M40 66h6M43 63v6" stroke="#DCE7FA" stroke-width="1.4"/></svg>`;
    case "triangular":
      return `<svg viewBox="0 0 120 90" aria-hidden="true"><rect width="120" height="90" fill="#E85324"/><polygon points="60,8 10,90 110,90" fill="#F2E8D7"/><circle cx="60" cy="34" r="7" fill="#0F1114"/></svg>`;
    case "ninegrid":
      return `<svg viewBox="0 0 120 90" aria-hidden="true"><rect width="120" height="90" fill="#1B4DBD"/><g stroke="#FAF4EA" stroke-width="1" fill="none"><rect x="10" y="8" width="100" height="74"/><line x1="43.3" y1="8" x2="43.3" y2="82"/><line x1="76.6" y1="8" x2="76.6" y2="82"/><line x1="10" y1="32.6" x2="110" y2="32.6"/><line x1="10" y1="57.3" x2="110" y2="57.3"/></g><rect x="48" y="36" width="24" height="18" fill="#EEB71E"/><circle cx="60" cy="20" r="6" fill="#F5EDE0"/><circle cx="60" cy="70" r="6" fill="#F5EDE0"/><circle cx="27" cy="45" r="6" fill="#F5EDE0"/><circle cx="93" cy="45" r="6" fill="#F5EDE0"/></svg>`;
    case "enveloping":
      return `<svg viewBox="0 0 120 90" aria-hidden="true"><rect width="120" height="90" fill="#F1B6C3"/><polyline points="28,44 28,16 92,16 92,74 44,74" fill="none" stroke="#EFE6D8" stroke-width="9"/><circle cx="60" cy="50" r="15" fill="#EE6799"/></svg>`;
    case "curvilinear":
      return `<svg viewBox="0 0 120 90" aria-hidden="true"><rect width="120" height="90" fill="#2C1B4A"/><path d="M0,22 C36,12 30,62 66,42 C88,30 100,38 120,52" fill="none" stroke="#CA70A1" stroke-width="7" stroke-linecap="round"/><circle cx="78" cy="64" r="9" fill="#EE6799"/></svg>`;
    case "segmentation":
      return `<svg viewBox="0 0 120 90" aria-hidden="true"><rect width="120" height="90" fill="#F9C42B"/><line x1="50" y1="0" x2="50" y2="90" stroke="#0F1114"/><line x1="50" y1="45" x2="120" y2="45" stroke="#0F1114"/><text x="14" y="54" font-family="Chivo,sans-serif" font-weight="900" font-size="30" fill="#0F1114">A</text><text x="60" y="28" font-family="Chivo,sans-serif" font-weight="900" font-size="18" fill="#0F1114">B</text><text x="60" y="72" font-family="Chivo,sans-serif" font-weight="900" font-size="18" fill="#0F1114">C</text></svg>`;
    default:
      return `<svg viewBox="0 0 120 90" aria-hidden="true"><rect width="120" height="90" fill="#F0E7D6"/><line x1="0" y1="0" x2="120" y2="90" stroke="#8C8476" stroke-dasharray="3 3"/><line x1="120" y1="0" x2="0" y2="90" stroke="#8C8476" stroke-dasharray="3 3"/><path d="M0,0 L22,0 A22,22 0 0,1 0,22 Z M120,0 L120,22 A22,22 0 0,1 98,0 Z M120,90 L98,90 A22,22 0 0,1 120,68 Z M0,90 L0,68 A22,22 0 0,1 22,90 Z" fill="#0C8268"/><path d="M52,45 H68 M60,37 V53" stroke="#0F1114" stroke-width="2"/></svg>`;
  }
}

// ======================== 01 节：眼动寻卡测验台 ========================
(() => {
  const board = document.getElementById("s1-board");
  const svg = document.getElementById("s1-svg");
  const statusEl = document.getElementById("s1-status");
  let mode = "messy";
  let hits = new Set();
  let misses = 0;
  let path = [];

  const cardsData = [
    { id: "central", name: "中心构图", target: true, blurb: "红圆居正中央，最经典的聚焦方式，可配留白" },
    { id: "diagonal", name: "对角线", target: false, blurb: "斜向切割" },
    { id: "ninegrid", name: "九宫格", target: false, blurb: "三乘三网格" },
    { id: "triangular", name: "三角形", target: true, blurb: "米白三角中嵌独立黑圆焦点" },
    { id: "segmentation", name: "分割式", target: false, blurb: "A/B/C 三栏直切版面，常用于报刊头版" },
    { id: "enveloping", name: "包围式", target: true, blurb: "折框围合中心玫红实圆" },
    { id: "scattered", name: "散点式", target: false, blurb: "星点扩散" },
    { id: "fourcorner", name: "四角式", target: false, blurb: "退居四角" },
  ];

  function drawOverlay() {
    const wrapRect = board.parentElement.getBoundingClientRect();
    const w = Math.max(200, Math.round(wrapRect.width));
    const h = Math.max(160, Math.round(wrapRect.height));
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    if (path.length < 2) {
      svg.innerHTML = "";
      return;
    }
    const pts = path
      .map((idx) => {
        const el = board.querySelector(`[data-s1-idx="${idx}"]`);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left - wrapRect.left + r.width / 2, y: r.top - wrapRect.top + r.height / 2 };
      })
      .filter(Boolean);
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const col = mode === "catalog" ? "#164FB4" : "#B3261A";
    svg.innerHTML = `
      <path d="${d}" fill="none" stroke="${col}" stroke-width="2.4" stroke-dasharray="5 4" />
      ${pts
        .map(
          (p, i) =>
            `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="9" fill="${col}" /><text x="${p.x.toFixed(
              1
            )}" y="${(p.y + 4).toFixed(1)}" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="11" font-weight="600" fill="#FAF4EA">${
              i + 1
            }</text>`
        )
        .join("")}
    `;
  }

  function updateStatus() {
    const modeNote =
      mode === "catalog"
        ? "格位齐整、基线一致，眼睛走直线即可逐排扫出"
        : mode === "messy"
        ? "高矮错牙加碎语干扰，扫读被迫反复折返"
        : "6 列挤成邮票，圆心细节几乎被缩没";
    statusEl.textContent = `已找到 ${hits.size} / 3 张目标 · 误点 ${misses} 次（${modeNote}）`;
  }

  function render() {
    board.className = `scan-board mode-${mode}`;
    const list = mode === "crowded" ? [...cardsData, ...cardsData.slice(0, 4)] : cardsData;
    board.innerHTML = list
      .map((c, idx) => {
        const messyPad = mode === "messy" ? `style="margin-top:${[0, 18, 8, 22, 0, 14, 10, 4][idx % 8]}px"` : "";
        const isHit = hits.has(idx);
        return `
          <button type="button" class="scan-card ${isHit ? "is-hit" : ""}" data-s1-idx="${idx}" data-target="${c.target}" ${messyPad}>
            ${miniSpecimenSvg(c.id)}
            <span class="scan-card-cap">
              ${c.name}
              ${mode === "messy" ? `<small>${c.blurb}</small>` : mode === "catalog" ? `<small>CAT.0${(idx % 8) + 1}</small>` : ""}
            </span>
          </button>
        `;
      })
      .join("");

    board.querySelectorAll(".scan-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.s1Idx);
        const isTarget = btn.dataset.target === "true";
        path.push(idx);
        if (isTarget) {
          hits.add(idx);
          btn.classList.add("is-hit");
        } else {
          misses++;
          btn.classList.add("is-miss");
        }
        updateStatus();
        drawOverlay();
      });
    });
    updateStatus();
    requestAnimationFrame(drawOverlay);
  }

  document.querySelectorAll("[data-s1-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.s1Mode;
      hits = new Set();
      misses = 0;
      path = [];
      document.querySelectorAll("[data-s1-mode]").forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  document.getElementById("s1-demo").addEventListener("click", () => {
    hits = new Set([0, 3, 5]);
    path = mode === "messy" ? [0, 2, 3, 4, 5] : [0, 3, 5];
    misses = mode === "messy" ? 2 : 0;
    render();
  });

  document.getElementById("s1-reset").addEventListener("click", () => {
    hits = new Set();
    misses = 0;
    path = [];
    render();
  });

  render();
})();

// ======================== 02 节：四法装裱检视板 ========================
(() => {
  const gallery = document.getElementById("s2-gallery");
  const summaryEl = document.getElementById("s2-summary");
  const titleEl = document.getElementById("s2-ins-title");
  const descEl = document.getElementById("s2-ins-desc");
  const aspectEl = document.getElementById("s2-ins-aspect");
  const cropEl = document.getElementById("s2-ins-crop");
  const padEl = document.getElementById("s2-ins-pad");
  const alignEl = document.getElementById("s2-ins-align");

  let fitMode = "contain";
  let selectedIdx = 0;

  function drawArtifactShape(kind, x, y, w, h, color) {
    const cx = x + w / 2;
    if (kind === "vase") {
      // 长颈青瓷瓶：细口沿 + 长颈 + 圆腹 + 圈足
      return `<g fill="${color}">
        <rect x="${(cx - w * 0.24).toFixed(1)}" y="${y.toFixed(1)}" width="${(w * 0.48).toFixed(1)}" height="${(h * 0.08).toFixed(1)}"/>
        <rect x="${(cx - w * 0.16).toFixed(1)}" y="${(y + h * 0.07).toFixed(1)}" width="${(w * 0.32).toFixed(1)}" height="${(h * 0.34).toFixed(1)}"/>
        <ellipse cx="${cx.toFixed(1)}" cy="${(y + h * 0.64).toFixed(1)}" rx="${(w * 0.48).toFixed(1)}" ry="${(h * 0.26).toFixed(1)}"/>
        <rect x="${(cx - w * 0.28).toFixed(1)}" y="${(y + h * 0.88).toFixed(1)}" width="${(w * 0.56).toFixed(1)}" height="${(h * 0.12).toFixed(1)}"/>
      </g>`;
    }
    if (kind === "ding") {
      // 三足圆鼎：双立耳 + 圆腹 + 三柱足
      return `<g fill="${color}">
        <rect x="${(x + w * 0.14).toFixed(1)}" y="${y.toFixed(1)}" width="${(w * 0.14).toFixed(1)}" height="${(h * 0.18).toFixed(1)}" fill="none" stroke="${color}" stroke-width="2.4"/>
        <rect x="${(x + w * 0.72).toFixed(1)}" y="${y.toFixed(1)}" width="${(w * 0.14).toFixed(1)}" height="${(h * 0.18).toFixed(1)}" fill="none" stroke="${color}" stroke-width="2.4"/>
        <path d="M${(x + w * 0.1).toFixed(1)},${(y + h * 0.2).toFixed(1)} H${(x + w * 0.9).toFixed(1)} V${(y + h * 0.48).toFixed(1)} A${(w * 0.4).toFixed(1)},${(h * 0.28).toFixed(1)} 0 0,1 ${(x + w * 0.1).toFixed(1)},${(y + h * 0.48).toFixed(1)} Z"/>
        <rect x="${(x + w * 0.18).toFixed(1)}" y="${(y + h * 0.68).toFixed(1)}" width="${(w * 0.12).toFixed(1)}" height="${(h * 0.32).toFixed(1)}"/>
        <rect x="${(cx - w * 0.06).toFixed(1)}" y="${(y + h * 0.72).toFixed(1)}" width="${(w * 0.12).toFixed(1)}" height="${(h * 0.28).toFixed(1)}"/>
        <rect x="${(x + w * 0.7).toFixed(1)}" y="${(y + h * 0.68).toFixed(1)}" width="${(w * 0.12).toFixed(1)}" height="${(h * 0.32).toFixed(1)}"/>
      </g>`;
    }
    if (kind === "pan") {
      // 浅腹双耳盘：宽平口沿 + 浅腹 + 矮圈足
      return `<g fill="${color}">
        <polygon points="${x.toFixed(1)},${(y + h * 0.16).toFixed(1)} ${(x + w).toFixed(1)},${(y + h * 0.16).toFixed(1)} ${(x + w * 0.84).toFixed(1)},${(y + h * 0.74).toFixed(1)} ${(x + w * 0.16).toFixed(1)},${(y + h * 0.74).toFixed(1)}"/>
        <rect x="${(x + w * 0.26).toFixed(1)}" y="${(y + h * 0.74).toFixed(1)}" width="${(w * 0.48).toFixed(1)}" height="${(h * 0.26).toFixed(1)}"/>
      </g>`;
    }
    if (kind === "scroll") {
      // 宋代立轴：天杆 + 绫边画心 + 地轴
      return `<g>
        <rect x="${(x + w * 0.04).toFixed(1)}" y="${y.toFixed(1)}" width="${(w * 0.92).toFixed(1)}" height="${(h * 0.07).toFixed(1)}" fill="#0F1114"/>
        <rect x="${(x + w * 0.12).toFixed(1)}" y="${(y + h * 0.07).toFixed(1)}" width="${(w * 0.76).toFixed(1)}" height="${(h * 0.84).toFixed(1)}" fill="${color}"/>
        <circle cx="${cx.toFixed(1)}" cy="${(y + h * 0.34).toFixed(1)}" r="${(Math.min(w, h) * 0.16).toFixed(1)}" fill="#FAF4EA"/>
        <rect x="${x.toFixed(1)}" y="${(y + h * 0.91).toFixed(1)}" width="${w.toFixed(1)}" height="${(h * 0.09).toFixed(1)}" fill="#0F1114"/>
      </g>`;
    }
    if (kind === "zun") {
      // 折肩青铜尊：敞口 + 折肩 + 圈足
      return `<g fill="${color}">
        <polygon points="${(x + w * 0.06).toFixed(1)},${y.toFixed(1)} ${(x + w * 0.94).toFixed(1)},${y.toFixed(1)} ${(x + w * 0.76).toFixed(1)},${(y + h * 0.34).toFixed(1)} ${(x + w * 0.24).toFixed(1)},${(y + h * 0.34).toFixed(1)}"/>
        <rect x="${(x + w * 0.18).toFixed(1)}" y="${(y + h * 0.34).toFixed(1)}" width="${(w * 0.64).toFixed(1)}" height="${(h * 0.34).toFixed(1)}"/>
        <polygon points="${(x + w * 0.24).toFixed(1)},${(y + h * 0.68).toFixed(1)} ${(x + w * 0.76).toFixed(1)},${(y + h * 0.68).toFixed(1)} ${(x + w * 0.86).toFixed(1)},${(y + h).toFixed(1)} ${(x + w * 0.14).toFixed(1)},${(y + h).toFixed(1)}"/>
      </g>`;
    }
    // 汉代画像砖：长方浮雕框
    return `<g>
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}"/>
      <rect x="${(x + w * 0.09).toFixed(1)}" y="${(y + h * 0.14).toFixed(1)}" width="${(w * 0.82).toFixed(1)}" height="${(h * 0.72).toFixed(1)}" fill="none" stroke="#FAF4EA" stroke-width="2"/>
      <line x1="${(x + w * 0.22).toFixed(1)}" y1="${(y + h * 0.5).toFixed(1)}" x2="${(x + w * 0.78).toFixed(1)}" y2="${(y + h * 0.5).toFixed(1)}" stroke="#FAF4EA" stroke-width="2"/>
    </g>`;
  }

  const artifacts = [
    { name: "长颈青瓷瓶", ratio: 0.56, label: "9 : 16 瘦高", color: "#10795C", shape: "vase" },
    { name: "商代三足鼎", ratio: 1.0, label: "1 : 1 方正", color: "#164FB4", shape: "ding" },
    { name: "浅腹双耳盘", ratio: 1.85, label: "16 : 9 宽扁", color: "#E14B21", shape: "pan" },
    { name: "宋代立轴画", ratio: 0.62, label: "5 : 8 竖幅", color: "#4B2E6B", shape: "scroll" },
    { name: "折肩青铜尊", ratio: 0.88, label: "7 : 8 略高", color: "#0F1114", shape: "zun" },
    { name: "汉代画像砖", ratio: 1.65, label: "5 : 3 横幅", color: "#C99206", shape: "brick" },
  ];

  function vesselSvg(item, mode) {
    const boxR = 4 / 3;
    if (mode === "contain") {
      let w;
      let h;
      if (item.ratio < boxR) {
        h = 74;
        w = h * item.ratio;
      } else {
        w = 104;
        h = w / item.ratio;
      }
      const x = (120 - w) / 2;
      const y = 84 - h;
      return `<svg viewBox="0 0 120 90" aria-hidden="true">
        <line x1="8" y1="84" x2="112" y2="84" stroke="#164FB4" stroke-width="1" stroke-dasharray="3 2"/>
        ${drawArtifactShape(item.shape, x, y, w, h, item.color)}
      </svg>`;
    }
    if (mode === "cover") {
      // 放大填满 120×90，让细颈口沿/底座或盘沿真实溢出被 SVG 视口一刀切掉
      let w;
      let h;
      if (item.ratio < boxR) {
        w = 112;
        h = w / item.ratio;
      } else {
        h = 84;
        w = h * item.ratio;
      }
      const x = (120 - w) / 2;
      const y = (90 - h) / 2;
      const croppedV = item.ratio < boxR;
      const croppedH = item.ratio > 1.5;
      return `<svg viewBox="0 0 120 90" aria-hidden="true">
        ${drawArtifactShape(item.shape, x, y, w, h, item.color)}
        ${
          croppedV
            ? `<rect x="0" y="0" width="120" height="14" fill="rgba(179,38,26,0.72)"/><rect x="0" y="76" width="120" height="14" fill="rgba(179,38,26,0.72)"/><text x="60" y="10.5" text-anchor="middle" font-size="9" fill="#FAF4EA" font-family="Noto Sans SC,sans-serif">上下被裁</text>`
            : croppedH
            ? `<rect x="0" y="0" width="16" height="90" fill="rgba(179,38,26,0.72)"/><rect x="104" y="0" width="16" height="90" fill="rgba(179,38,26,0.72)"/><text x="60" y="14" text-anchor="middle" font-size="9" fill="#B3261A" font-weight="700" font-family="Noto Sans SC,sans-serif">左右耳沿被裁</text>`
            : ""
        }
      </svg>`;
    }
    const hBox = Math.round(clamp(90 / item.ratio, 48, 134));
    return `<svg viewBox="0 0 120 ${hBox}" aria-hidden="true">
      ${drawArtifactShape(item.shape, 10, 8, 100, hBox - 16, item.color)}
    </svg>`;
  }

  function statsOf(item, mode) {
    const boxR = 4 / 3;
    if (mode === "contain") {
      const fillRatio = item.ratio < boxR ? item.ratio / boxR : boxR / item.ratio;
      return {
        crop: "0%（完整）",
        pad: `${Math.round((1 - fillRatio) * 100)}%`,
        align: "0px 齐平",
        desc: `外框锁死 4:3 基准格，器物按 ${item.label} 完整落在地平基线上。虽然框内留出 ${Math.round(
          (1 - fillRatio) * 100
        )}% 呼吸边，但口沿与底座零损伤，横向扫读一眼就能比出高矮。`,
      };
    }
    if (mode === "cover") {
      const kept = item.ratio < boxR ? item.ratio / boxR : boxR / item.ratio;
      const loss = Math.round((1 - kept) * 100);
      return {
        crop: loss > 8 ? `损失 ${loss}%` : `微裁 ${loss}%`,
        pad: "0%",
        align: "0px 齐平",
        desc:
          loss > 15
            ? `满框裁切把「${item.name}」的上下或左右直接切掉了 ${loss}%！外观看着整齐满幅，但对博物馆器物、建筑立面或字体标本而言属于严重失真。`
            : `「${item.name}」与 4:3 接近，满框裁切只损失 ${loss}%，适合氛围型摄影画册，但和瘦高/宽扁展品混排时仍会误伤其它卡片。`,
      };
    }
    if (mode === "masonry") {
      return {
        crop: "0%（完整）",
        pad: "0%",
        align: "错差 38px",
        desc: `瀑布流虽然保住了「${item.name}」的完整原图，但相邻卡片底边高低参差 38px，标注文字跟着上下乱跳，读者无法横向排排坐比对器形。`,
      };
    }
    return {
      crop: "0%（完整）",
      pad: "无统一框",
      align: "散乱失序",
      desc: "直接按原图比例散摆，既没有统一网格外框，也没有共享地平线，整页迅速退化成贴满杂图的草稿板。",
    };
  }

  function render() {
    const sumMap = {
      contain: "基线偏差 0px · 原图完整 100%（推荐用于器物/标本图录）",
      cover: "基线偏差 0px · 瘦高/宽扁展品最高裁损 58%（仅适合氛围图）",
      masonry: "原图完整 100% · 行底错差 38px（破坏横向对照）",
      raw: "无统一模数 · 秩序感瓦解",
    };
    summaryEl.textContent = sumMap[fitMode];

    gallery.innerHTML = artifacts
      .map((item, idx) => {
        const st = statsOf(item, fitMode);
        const fixed = fitMode === "contain" || fitMode === "cover";
        return `
          <button type="button" class="fit-card ${idx === selectedIdx ? "is-selected" : ""}" data-s2-idx="${idx}">
            <div class="fit-frame ${fixed ? "frame-fixed" : ""}">
              ${vesselSvg(item, fitMode)}
            </div>
            <span class="fit-card-title">${item.name}</span>
            <span class="fit-card-sub">${st.crop}</span>
          </button>
        `;
      })
      .join("");

    const cur = artifacts[selectedIdx];
    const st = statsOf(cur, fitMode);
    titleEl.textContent = `当前透视：${cur.name}（${cur.label}）`;
    descEl.textContent = st.desc;
    aspectEl.textContent = cur.label;
    cropEl.textContent = st.crop;
    padEl.textContent = st.pad;
    alignEl.textContent = st.align;

    gallery.querySelectorAll("[data-s2-idx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedIdx = Number(btn.dataset.s2Idx);
        render();
      });
    });
  }

  document.querySelectorAll("[data-s2-fit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      fitMode = btn.dataset.s2Fit;
      document.querySelectorAll("[data-s2-fit]").forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  render();
})();

// ======================== 03 节：标注系统拼装器（深钴蓝暗室） ========================
(() => {
  const fields = new Set(["dot", "zh", "en"]);
  let mount = "aligned"; // aligned | free | overlay

  const previewEl = document.getElementById("s3-preview");
  const badgeEl = document.getElementById("s3-badge");
  const whyEl = document.getElementById("s3-why");
  const mFieldsEl = document.getElementById("s3-m-fields");
  const mRatioEl = document.getElementById("s3-m-ratio");
  const mDriftEl = document.getElementById("s3-m-drift");

  const samples = [
    {
      id: "central",
      dot: "#E14B21",
      code: "FIG.01",
      zh: "中心构图",
      en: "CENTRAL",
      spec: "1:1 · 焦点型",
      blurb: "主体居画框中心，搭配大面积留白，视觉一秒锁死，最常用于单品封面。",
    },
    {
      id: "diagonal",
      dot: "#10795C",
      code: "FIG.02",
      zh: "对角线构图",
      en: "DIAGONAL",
      spec: "4:3 · 动势型",
      blurb: "斜线贯穿画面。",
    },
    {
      id: "ninegrid",
      dot: "#164FB4",
      code: "FIG.05",
      zh: "九宫格构图",
      en: "NINE-GRID",
      spec: "3×3 · 秩序型",
      blurb: "等分九格均衡排布，既能展示九件同级对象，也能靠中心格强化视觉锚点，扩展性强。",
    },
    {
      id: "curvilinear",
      dot: "#4B2E6B",
      code: "FIG.07",
      zh: "曲线式构图",
      en: "CURVILINEAR",
      spec: "1:1 · 引导型",
      blurb: "柔和弧线带动视线缓行。",
    },
  ];

  function render() {
    const count = fields.size;
    const hasBlurb = fields.has("blurb");
    const minH = count === 0 ? 0 : hasBlurb ? 94 : 20 + count * 11;

    previewEl.innerHTML = samples
      .map((s) => {
        const mainLine =
          fields.has("dot") || fields.has("code") || fields.has("zh")
            ? `<div class="cap-line-main">
                ${fields.has("dot") ? `<span class="cap-dot" style="background:${s.dot}"></span>` : ""}
                ${fields.has("code") ? `<span class="cap-code">${s.code}</span>` : ""}
                ${fields.has("zh") ? `<span>${s.zh}</span>` : ""}
              </div>`
            : "";
        const metaHtml =
          count === 0
            ? ""
            : `<div class="cap-demo-meta ${mount === "overlay" ? "is-overlay" : mount === "aligned" ? "is-aligned" : ""}" style="--cap-min-h:${minH}px">
                ${mainLine}
                ${fields.has("en") ? `<div class="cap-sub">${s.en}</div>` : ""}
                ${fields.has("spec") ? `<div class="cap-spec">${s.spec}</div>` : ""}
                ${fields.has("blurb") ? `<div class="cap-blurb">${s.blurb}</div>` : ""}
              </div>`;

        return `
          <div class="cap-demo-card">
            <div class="cap-demo-thumb">${miniSpecimenSvg(s.id)}</div>
            ${metaHtml}
          </div>
        `;
      })
      .join("");

    // 单真源评估
    const textPct = count === 0 ? 0 : mount === "overlay" ? 32 : clamp(Math.round(12 + count * 8 + (hasBlurb ? 18 : 0)), 14, 58);
    const imgPct = 100 - textPct;
    const driftPx = mount === "free" && hasBlurb ? 34 : mount === "free" && count >= 4 ? 12 : 0;

    mFieldsEl.textContent = `${count} 项`;
    mRatioEl.textContent = `${imgPct} : ${textPct}`;
    mDriftEl.textContent = `${driftPx}px`;

    let ok = true;
    let badge = "规范成立";
    let why = `保留 ${count} 项紧凑槽位并定槽齐行，图文面积比 ${imgPct}:${textPct}，每张卡同一位置对应同一含义，横向扫读阻力最低。`;

    if (count === 0) {
      ok = false;
      badge = "裸图无签";
      why = "关掉全部标注字段后，缩略图失去编号与名称，读者认不出构图名也没法索引回查。";
    } else if (mount === "overlay") {
      ok = false;
      badge = "浮标遮图";
      why = "把标注直接压在缩略图下部，遮掉了约 32% 的构图画面；图录里标注必须退居画框之外。";
    } else if (hasBlurb) {
      ok = false;
      badge = "碎语过载";
      why = `塞进长段鉴赏碎语后，文字占走 ${textPct}% 高度${
        driftPx > 0 ? `且四张卡底边错差达 ${driftPx}px` : ""
      }，图录退化成说明文卡片；深度解释应移去详情页或图版后注。`;
    } else if (count >= 5) {
      ok = false;
      badge = "字段偏多";
      why = `单卡同时塞入 ${count} 项字段，小缩略图下显得拥挤；建议控制在 2–4 个稳定槽位（如色点 + 编号/主名 + 副标）。`;
    } else if (!fields.has("zh") && !fields.has("code")) {
      ok = false;
      badge = "缺少主名";
      why = "缺少中文主名或编目货号作为主键，仅有辅助标签时读者仍无法迅速定位单件标本。";
    }

    badgeEl.textContent = badge;
    badgeEl.classList.toggle("is-warn", !ok);
    whyEl.textContent = why;
  }

  document.querySelectorAll("#s3-fields .toggle-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.field;
      if (fields.has(f)) fields.delete(f);
      else fields.add(f);
      btn.classList.toggle("is-on", fields.has(f));
      btn.setAttribute("aria-pressed", String(fields.has(f)));
      render();
    });
  });

  document.querySelectorAll("[data-s3-mount]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mount = btn.dataset.s3Mount;
      document.querySelectorAll("[data-s3-mount]").forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  render();
})();

// ======================== 04 节：跨页节拍器 + VS 对照显微镜 ========================
(() => {
  const beatStage = document.getElementById("s4-beat-stage");
  const beatNote = document.getElementById("s4-beat-note");
  const vsLens = document.getElementById("s4-vs-lens");
  let beat = "tiered";
  let pair = [0, 2];

  const beatMeta = {
    tiered: {
      note: "【3+3+5 原海报阶梯】前两行用大卡稳住主体节奏，第三行加快密度并用 VS 收尾——眼睛经历「稳看 → 速览 → 对比定格」三拍呼吸。",
      svg: `<svg viewBox="0 0 360 190" aria-hidden="true">
        <rect x="6" y="6" width="110" height="62" fill="#E14B21" opacity="0.88"/><rect x="125" y="6" width="110" height="62" fill="#10795C" opacity="0.88"/><rect x="244" y="6" width="110" height="62" fill="#0F1114" opacity="0.88"/>
        <rect x="6" y="76" width="110" height="58" fill="#E85324" opacity="0.82"/><rect x="125" y="76" width="110" height="58" fill="#164FB4" opacity="0.88"/><rect x="244" y="76" width="110" height="58" fill="#EE6799" opacity="0.82"/>
        <rect x="6" y="144" width="60" height="40" fill="#4B2E6B"/><rect x="74" y="144" width="60" height="40" fill="#EEB71E"/><rect x="142" y="144" width="60" height="40" fill="#0C8268"/>
        <rect x="212" y="140" width="144" height="46" fill="none" stroke="#164FB4" stroke-width="1.5" stroke-dasharray="4 3"/>
        <rect x="218" y="144" width="54" height="38" fill="#E14B21"/><text x="284" y="167" text-anchor="middle" font-family="Chivo,sans-serif" font-weight="900" font-size="11" fill="#164FB4">VS</text><rect x="296" y="144" width="54" height="38" fill="#0F1114"/>
      </svg>`,
    },
    equal: {
      note: "【4+4 严谨等大墙】八格完全等权，客观、中立、好查货号，适合博物馆总目录；但若连续十几页毫无大小变化，读者很容易看困。",
      svg: `<svg viewBox="0 0 360 190" aria-hidden="true">
        ${[0, 1]
          .map((r) =>
            [0, 1, 2, 3]
              .map(
                (c) =>
                  `<rect x="${8 + c * 88}" y="${10 + r * 88}" width="80" height="76" fill="${
                    ["#164FB4", "#10795C", "#E14B21", "#0F1114"][(r * 4 + c) % 4]
                  }" opacity="0.82"/>`
              )
              .join("")
          )
          .join("")}
      </svg>`,
    },
    anchor: {
      note: "【1 主 + 6 细览】左半页给一件压轴代表作，右半页排六件衍生变体或细节局部——适合年度策展画册与单品系列专题页。",
      svg: `<svg viewBox="0 0 360 190" aria-hidden="true">
        <rect x="8" y="8" width="160" height="174" fill="#164FB4" opacity="0.9"/>
        <text x="88" y="100" text-anchor="middle" font-family="Noto Sans SC,sans-serif" font-weight="900" font-size="14" fill="#FAF4EA">主展品 1</text>
        ${[0, 1, 2]
          .map((r) =>
            [0, 1]
              .map(
                (c) =>
                  `<rect x="${180 + c * 88}" y="${8 + r * 60}" width="82" height="54" fill="${
                    ["#E14B21", "#10795C", "#EEB71E", "#4B2E6B", "#EE6799", "#0F1114"][r * 2 + c]
                  }" opacity="0.85"/>`
              )
              .join("")
          )
          .join("")}
      </svg>`,
    },
  };

  function renderBeat() {
    beatStage.innerHTML = beatMeta[beat].svg;
    beatNote.textContent = beatMeta[beat].note;
  }

  function renderVs() {
    const items = THEMES.poster.items;
    const a = items[pair[0]];
    const b = items[pair[1]];
    const ev = evaluateVsPair("poster", pair);
    const weak = ev.quality !== "strong";
    vsLens.innerHTML = `
      <div class="vs-duo-row">
        <div class="vs-card-box">
          ${miniSpecimenSvg(a.id)}
          <strong>${a.zh}</strong>
          <small>${a.en} · ${a.roleNote}</small>
        </div>
        <span class="vs-mark ${weak ? "is-weak" : ""}">VS</span>
        <div class="vs-card-box">
          ${miniSpecimenSvg(b.id)}
          <strong>${b.zh}</strong>
          <small>${b.en} · ${b.roleNote}</small>
        </div>
      </div>
      <div class="vs-verdict-line ${weak ? "is-weak" : ""}">
        <strong>${weak ? "对照偏弱：" : "有效反差对照："}</strong>${ev.reason}。
      </div>
    `;
  }

  document.querySelectorAll("[data-s4-beat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      beat = btn.dataset.s4Beat;
      document.querySelectorAll("[data-s4-beat]").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderBeat();
    });
  });

  document.querySelectorAll("[data-s4-pair]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pair = btn.dataset.s4Pair.split("-").map(Number);
      document.querySelectorAll("[data-s4-pair]").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderVs();
    });
  });

  renderBeat();
  renderVs();
})();

// ======================== 05 节：从哪来 · 百年演进 ========================
(() => {
  const stage = document.getElementById("s5-stage");
  const ERAS = {
    song: {
      title: "北宋《宣和博古图》（约 1120 年编成）",
      body: "北宋徽宗朝系统编纂皇家收藏的 839 件商周青铜礼器（大都会艺术博物馆藏有 1588 年明万历重刻十六卷本）。全书为每一件铜器建立严密统一的模块体例：先绘等比例器形线图，再录铭文拓片，接着固定标注器高、口径、容积与重量，最后附源流考释——让读者跨越几十卷仍能用同一把尺子比较商周器型演进。",
      legacy: "奠定原则：统一体例模块 + 固定维度标注",
      svg: `<svg viewBox="0 0 240 180" aria-hidden="true">
        <rect x="6" y="6" width="228" height="168" fill="#F6EEDC" stroke="#8C7E66" stroke-width="1.5"/>
        <rect x="14" y="14" width="212" height="152" fill="none" stroke="#8C7E66" stroke-width="1"/>
        <line x1="120" y1="14" x2="120" y2="166" stroke="#8C7E66" stroke-dasharray="3 2"/>
        <!-- 右叶：线描青铜鼎器形 -->
        <ellipse cx="172" cy="78" rx="28" ry="22" fill="none" stroke="#1E1B16" stroke-width="2"/>
        <rect x="148" y="42" width="10" height="14" fill="none" stroke="#1E1B16" stroke-width="1.8"/>
        <rect x="186" y="42" width="10" height="14" fill="none" stroke="#1E1B16" stroke-width="1.8"/>
        <line x1="154" y1="96" x2="150" y2="132" stroke="#1E1B16" stroke-width="2.2"/>
        <line x1="172" y1="100" x2="172" y2="132" stroke="#1E1B16" stroke-width="2.2"/>
        <line x1="190" y1="96" x2="194" y2="132" stroke="#1E1B16" stroke-width="2.2"/>
        <text x="172" y="154" text-anchor="middle" font-family="Noto Sans SC,sans-serif" font-size="10" fill="#46433D">器形线图 · 统一度量</text>
        <!-- 左叶：铭文与直排尺寸标注 -->
        <rect x="30" y="28" width="38" height="44" fill="#1E1B16" opacity="0.88"/>
        <path d="M40,38 H58 M49,38 V62 M40,52 H58" stroke="#F6EEDC" stroke-width="1.6" fill="none"/>
        <g stroke="#5A5042" stroke-width="1.4">
          <line x1="88" y1="28" x2="88" y2="146"/><line x1="98" y1="28" x2="98" y2="146"/><line x1="108" y1="28" x2="108" y2="120"/>
        </g>
        <text x="66" y="156" text-anchor="middle" font-family="Noto Sans SC,sans-serif" font-size="10" fill="#46433D">拓片 + 尺寸考释</text>
      </svg>`,
    },
    warburg: {
      title: "Aby Warburg《记忆女神图集》（1924–1929）",
      body: "德国艺术史家 Aby Warburg 在生命最后五年里，把几百张来自古典雕塑、文艺复兴版画、天文星图与报刊照片的黑白图像，成组钉在几十块蒙黑布的木展板上，几乎不写正文，单靠大小缩放与邻近并置，让跨越两千年的图像姿势自己彼此呼应。这种「用并置替代冗长解释」的思维，正是现代图录 VS 对照块的思想源头。",
      legacy: "奠定原则：并置对照让视觉关系自行显现",
      svg: `<svg viewBox="0 0 240 180" aria-hidden="true">
        <rect x="6" y="6" width="228" height="168" fill="#191B20"/>
        <rect x="20" y="20" width="54" height="68" fill="#E9E0CE"/><rect x="86" y="24" width="66" height="46" fill="#DED3BF"/><rect x="164" y="20" width="56" height="58" fill="#E9E0CE"/>
        <rect x="24" y="102" width="84" height="54" fill="#D5C8B1"/><rect x="122" y="88" width="96" height="68" fill="#EFE7D8"/>
        <path d="M74,54 C92,54 88,92 122,114" fill="none" stroke="#EEB71E" stroke-width="1.8" stroke-dasharray="4 3"/>
        <circle cx="74" cy="54" r="3.5" fill="#EEB71E"/><circle cx="122" cy="114" r="3.5" fill="#EEB71E"/>
        <text x="120" y="170" text-anchor="middle" font-family="Chivo,sans-serif" font-size="9.5" fill="#D5DCEB">BILDERATLAS MNEMOSYNE · BLACK PANEL</text>
      </svg>`,
    },
    ikea: {
      title: "宜家商品图录（1951 首印 — 2020 停印）",
      body: "1951 年 Ingvar Kamprad 在瑞典编印第一册 68 页宜家图录（首印 28.5 万册），此后整整七十年把「场景大图 + 规整单品缩略网格 + 统一货号尺寸价格标注」打磨到家喻户晓，2016 年高峰期发行约两亿册，直至 2020 年 12 月正式画上句号。它向全世界证明：好的图录既能让人在几秒内比价选型，又能用大小节奏讲出生活画面。",
      legacy: "奠定原则：大场景定调 + 规范货号网格选型",
      svg: `<svg viewBox="0 0 240 180" aria-hidden="true">
        <rect x="6" y="6" width="228" height="168" fill="#FAF4EA" stroke="#B8AE9B"/>
        <line x1="120" y1="6" x2="120" y2="174" stroke="#B8AE9B"/>
        <!-- 左页场景大图 -->
        <rect x="14" y="14" width="98" height="114" fill="#164FB4" opacity="0.88"/>
        <rect x="26" y="76" width="56" height="36" fill="#EEB71E"/>
        <rect x="14" y="136" width="60" height="8" fill="#0F1114"/>
        <rect x="14" y="150" width="90" height="6" fill="#B8AE9B"/>
        <!-- 右页 2x2 货号网格 -->
        ${[0, 1]
          .map((r) =>
            [0, 1]
              .map(
                (c) => `
              <rect x="${130 + c * 50}" y="${16 + r * 74}" width="44" height="44" fill="${
                  ["#E14B21", "#10795C", "#0F1114", "#164FB4"][r * 2 + c]
                }" opacity="0.82"/>
              <rect x="${130 + c * 50}" y="${64 + r * 74}" width="32" height="5" fill="#0F1114"/>
              <rect x="${130 + c * 50}" y="${73 + r * 74}" width="22" height="4" fill="#B3310D"/>`
              )
              .join("")
          )
          .join("")}
      </svg>`,
    },
    swiss: {
      title: "Wim Crouwel（1963–1985）与 Müller-Brockmann（1981）",
      body: "1963 至 1985 年，荷兰设计师 Wim Crouwel 为阿姆斯特丹市立博物馆（Stedelijk Museum）用统一精密网格设计了三百余本展览图录，把页边距、图像坐标与说明字级彻底制度化；1981 年瑞士平面大师 Josef Müller-Brockmann 由 Niggli 出版社出版《Grid Systems in Graphic Design》，系统示范了 8 至 32 格网如何把繁杂展品收进可预测的理性秩序。",
      legacy: "奠定原则：理性网格体系支撑跨册秩序",
      svg: `<svg viewBox="0 0 240 180" aria-hidden="true">
        <rect x="6" y="6" width="228" height="168" fill="#FAF4EA" stroke="#164FB4" stroke-width="1.5"/>
        <g stroke="#164FB4" stroke-opacity="0.28" stroke-width="1">
          <line x1="62" y1="6" x2="62" y2="174"/><line x1="120" y1="6" x2="120" y2="174"/><line x1="178" y1="6" x2="178" y2="174"/>
          <line x1="6" y1="62" x2="234" y2="62"/><line x1="6" y1="118" x2="234" y2="118"/>
        </g>
        <rect x="14" y="14" width="100" height="42" fill="#0F1114"/>
        <rect x="126" y="14" width="46" height="98" fill="#164FB4"/>
        <rect x="184" y="14" width="42" height="42" fill="#E14B21"/>
        <rect x="14" y="68" width="42" height="96" fill="#10795C"/>
        <rect x="68" y="68" width="46" height="44" fill="#EEB71E"/>
        <rect x="126" y="124" width="100" height="40" fill="none" stroke="#0F1114" stroke-width="1.5"/>
      </svg>`,
    },
  };

  function renderEra(key) {
    const e = ERAS[key];
    stage.innerHTML = `
      <div class="hist-diagram">${e.svg}</div>
      <div class="hist-copy">
        <h3>${e.title}</h3>
        <p>${e.body}</p>
        <span class="hist-legacy">${e.legacy}</span>
      </div>
    `;
  }

  document.querySelectorAll(".hist-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".hist-tab").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      renderEra(btn.dataset.era);
    });
  });

  renderEra("song");
})();

// ======================== 06 节：委托单判断翻牌台 ========================
(() => {
  const grid = document.getElementById("s6-grid");
  const scoreEl = document.getElementById("s6-score");
  const cases = [
    {
      title: "唐代三彩器物特展画册（64 件）",
      brief: "展品年代跨越百年，策展方希望观众能横向比较釉色、器型与尺寸铭文。",
      useCatalog: true,
      explain: "非常适合！用统一外框含留白保住器物廓形，加固定编号/年代/尺寸标注，并在每章末尾加器型演变 VS 对照。",
    },
    {
      title: "建筑师个人深度访谈长文",
      brief: "六千字对谈配 3 张现场黑白大照，重点是层层递进的创作观念与金句。",
      useCatalog: false,
      explain: "别用图录！多格缩略会割裂叙事张力，应改用 163 特写跨页或 167 引语主导版式。",
    },
    {
      title: "单一旗舰相机发布会主视觉页",
      brief: "整页只讲一台机器的核心工业设计与一句口号，没有多型号对比需求。",
      useCatalog: false,
      explain: "别用图录！只有 1 个主角硬塞网格显得零碎降格，应交给 160 封面版式或 161 章节扉页。",
    },
    {
      title: "前端设计系统 36 枚组件标本库",
      brief: "设计师和工程师要一屏扫完按钮、表单、弹窗的变体并对比正反规范。",
      useCatalog: true,
      explain: "非常适合！统一模块框展示组件形态，统一标注名与状态码，再配「推荐 VS 避免」对照，效率极高。",
    },
  ];
  const answered = new Map();

  function render() {
    let correct = 0;
    answered.forEach((v, i) => {
      if (v === cases[i].useCatalog) correct++;
    });
    scoreEl.textContent = `已审 ${answered.size} / ${cases.length} 份 · 判断准确 ${correct} 份`;

    grid.innerHTML = cases
      .map((c, idx) => {
        const picked = answered.has(idx) ? answered.get(idx) : null;
        const isRight = picked === c.useCatalog;
        return `
          <article class="triage-card">
            <strong>${c.title}</strong>
            <p>${c.brief}</p>
            ${
              picked === null
                ? `<div class="triage-btns">
                    <button type="button" class="ctrl-btn" data-triage="${idx}:yes">该用图录</button>
                    <button type="button" class="ctrl-btn" data-triage="${idx}:no">别用图录</button>
                  </div>`
                : `<div class="triage-ans ${isRight ? "" : "is-wrong"}">
                    <strong>${isRight ? "判断准确：" : "再想一下："}</strong>${c.explain}
                  </div>`
            }
          </article>
        `;
      })
      .join("");

    grid.querySelectorAll("[data-triage]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [iStr, ans] = btn.dataset.triage.split(":");
        answered.set(Number(iStr), ans === "yes");
        render();
      });
    });
  }

  render();
})();

// ======================== 07 节：四选一微缩图录小练习（仅差装裱与标注单一变量，中性签） ========================
(() => {
  const quizEl = document.getElementById("s7-quiz");
  const fbEl = document.getElementById("s7-feedback");
  let pickedKey = null;

  // 陶瓷器形微缩绘制（长颈瓶 / 圆腹壶 / 浅口盘 / 折肩尊）
  function ceramicGlyph(type, cx, bottomY, scale, color) {
    if (type === 0) {
      // 长颈青瓷瓶（高瘦）
      const h = 42 * scale;
      const y = bottomY - h;
      return `<g fill="${color}">
        <rect x="${(cx - 5 * scale).toFixed(1)}" y="${y.toFixed(1)}" width="${(10 * scale).toFixed(1)}" height="${(3 * scale).toFixed(1)}"/>
        <rect x="${(cx - 3.2 * scale).toFixed(1)}" y="${(y + 2.5 * scale).toFixed(1)}" width="${(6.4 * scale).toFixed(1)}" height="${(15 * scale).toFixed(1)}"/>
        <ellipse cx="${cx.toFixed(1)}" cy="${(y + 26 * scale).toFixed(1)}" rx="${(10 * scale).toFixed(1)}" ry="${(11 * scale).toFixed(1)}"/>
        <rect x="${(cx - 6.5 * scale).toFixed(1)}" y="${(bottomY - 4.5 * scale).toFixed(1)}" width="${(13 * scale).toFixed(1)}" height="${(4.5 * scale).toFixed(1)}"/>
      </g>`;
    }
    if (type === 1) {
      // 圆腹壶（中宽）
      const h = 28 * scale;
      const y = bottomY - h;
      return `<g fill="${color}">
        <rect x="${(cx - 6 * scale).toFixed(1)}" y="${y.toFixed(1)}" width="${(12 * scale).toFixed(1)}" height="${(5 * scale).toFixed(1)}"/>
        <ellipse cx="${cx.toFixed(1)}" cy="${(y + 15 * scale).toFixed(1)}" rx="${(13 * scale).toFixed(1)}" ry="${(10 * scale).toFixed(1)}"/>
        <rect x="${(cx - 8 * scale).toFixed(1)}" y="${(bottomY - 4 * scale).toFixed(1)}" width="${(16 * scale).toFixed(1)}" height="${(4 * scale).toFixed(1)}"/>
      </g>`;
    }
    if (type === 2) {
      // 浅腹宽盘（宽矮）
      const h = 15 * scale;
      const y = bottomY - h;
      return `<g fill="${color}">
        <polygon points="${(cx - 17 * scale).toFixed(1)},${y.toFixed(1)} ${(cx + 17 * scale).toFixed(1)},${y.toFixed(1)} ${(cx + 12 * scale).toFixed(1)},${(bottomY - 4 * scale).toFixed(1)} ${(cx - 12 * scale).toFixed(1)},${(bottomY - 4 * scale).toFixed(1)}"/>
        <rect x="${(cx - 8 * scale).toFixed(1)}" y="${(bottomY - 4 * scale).toFixed(1)}" width="${(16 * scale).toFixed(1)}" height="${(4 * scale).toFixed(1)}"/>
      </g>`;
    }
    // 折肩尊（中高）
    const h = 34 * scale;
    const y = bottomY - h;
    return `<g fill="${color}">
      <polygon points="${(cx - 11 * scale).toFixed(1)},${y.toFixed(1)} ${(cx + 11 * scale).toFixed(1)},${y.toFixed(1)} ${(cx + 7 * scale).toFixed(1)},${(y + 11 * scale).toFixed(1)} ${(cx - 7 * scale).toFixed(1)},${(y + 11 * scale).toFixed(1)}"/>
      <rect x="${(cx - 9 * scale).toFixed(1)}" y="${(y + 11 * scale).toFixed(1)}" width="${(18 * scale).toFixed(1)}" height="${(14 * scale).toFixed(1)}"/>
      <rect x="${(cx - 7 * scale).toFixed(1)}" y="${(bottomY - 9 * scale).toFixed(1)}" width="${(14 * scale).toFixed(1)}" height="${(9 * scale).toFixed(1)}"/>
    </g>`;
  }

  const options = [
    {
      key: "A",
      correct: false,
      svg: `<svg viewBox="0 0 220 150" aria-hidden="true">
        <defs>
          ${[0, 1, 2, 3].map((i) => `<clipPath id="qa-${i}"><rect x="${8 + i * 52}" y="10" width="46" height="48"/></clipPath>`).join("")}
          ${[0, 1, 2, 3].map((i) => `<clipPath id="qa2-${i}"><rect x="${8 + i * 52}" y="86" width="46" height="40"/></clipPath>`).join("")}
        </defs>
        <rect width="220" height="150" fill="#F2E8D7"/>
        ${[0, 1, 2, 3]
          .map((i) => {
            const x = 8 + i * 52;
            const cols = ["#10795C", "#164FB4", "#E14B21", "#4B2E6B"];
            return `
              <rect x="${x}" y="10" width="46" height="48" fill="#FAF4EA" stroke="#B8AE9B"/>
              <g clip-path="url(#qa-${i})">${ceramicGlyph(i, x + 23, 66, 1.55, cols[i])}</g>
              <rect x="${x}" y="64" width="34" height="4.5" fill="#0F1114"/>
              <rect x="${x}" y="72" width="24" height="3.5" fill="#164FB4"/>
              <rect x="${x}" y="86" width="46" height="40" fill="#FAF4EA" stroke="#B8AE9B"/>
              <g clip-path="url(#qa2-${i})">${ceramicGlyph((i + 1) % 4, x + 23, 134, 1.45, cols[(i + 2) % 4])}</g>
              <rect x="${x}" y="132" width="34" height="4.5" fill="#0F1114"/>
              <rect x="${x}" y="140" width="24" height="3.5" fill="#164FB4"/>`;
          })
          .join("")}
      </svg>`,
      explain:
        "方案 A 外框和标注都极齐整，但为了放大填满矩形格采用了满框裁切（Cover），细看会发现长颈瓶与折肩尊的口沿、圈足全被裁在了画框之外。对博物馆器物图录来说，切坏完整廓形属于硬伤。",
    },
    {
      key: "B",
      correct: true,
      svg: `<svg viewBox="0 0 220 150" aria-hidden="true">
        <rect width="220" height="150" fill="#F2E8D7"/>
        ${[0, 1, 2, 3]
          .map((i) => {
            const x = 8 + i * 52;
            const cols = ["#10795C", "#164FB4", "#E14B21", "#4B2E6B"];
            return `
              <rect x="${x}" y="10" width="46" height="48" fill="#FAF4EA" stroke="#B8AE9B"/>
              <line x1="${x + 4}" y1="54" x2="${x + 42}" y2="54" stroke="#164FB4" stroke-opacity="0.32"/>
              ${ceramicGlyph(i, x + 23, 54, 0.92, cols[i])}
              <rect x="${x}" y="64" width="34" height="4.5" fill="#0F1114"/>
              <rect x="${x}" y="72" width="24" height="3.5" fill="#164FB4"/>
              <rect x="${x}" y="86" width="46" height="40" fill="#FAF4EA" stroke="#B8AE9B"/>
              <line x1="${x + 4}" y1="122" x2="${x + 42}" y2="122" stroke="#164FB4" stroke-opacity="0.32"/>
              ${ceramicGlyph((i + 1) % 4, x + 23, 122, 0.78, cols[(i + 2) % 4])}
              <rect x="${x}" y="132" width="34" height="4.5" fill="#0F1114"/>
              <rect x="${x}" y="140" width="24" height="3.5" fill="#164FB4"/>`;
          })
          .join("")}
      </svg>`,
      explain:
        "完全正确！方案 B 用统一的外框网格锁住全页秩序，框内按真实比例完整留白并统一落在同一条地平基线上——既绝不切坏任何口沿圈足，又能一眼横向比较高矮胖瘦，底部两行定槽标注也让编号年代扫读极快。",
    },
    {
      key: "C",
      correct: false,
      svg: `<svg viewBox="0 0 220 150" aria-hidden="true">
        <rect width="220" height="150" fill="#F2E8D7"/>
        ${[
          [8, 10, 46, 56, 0, "#10795C", 0.96],
          [60, 10, 46, 36, 1, "#164FB4", 0.88],
          [112, 10, 46, 26, 2, "#E14B21", 0.85],
          [164, 10, 46, 46, 3, "#4B2E6B", 0.92],
          [8, 82, 46, 40, 1, "#C99206", 0.85],
          [60, 62, 46, 52, 0, "#0C8268", 0.9],
          [112, 52, 46, 48, 3, "#164FB4", 0.88],
          [164, 72, 46, 32, 2, "#E14B21", 0.86],
        ]
          .map(
            ([x, y, w, h, tp, c, sc]) => `
            <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FAF4EA" stroke="#B8AE9B"/>
            ${ceramicGlyph(tp, x + w / 2, y + h - 4, sc, c)}
            <rect x="${x}" y="${y + h + 4}" width="32" height="4" fill="#0F1114"/>`
          )
          .join("")}
      </svg>`,
      explain:
        "方案 C 虽然保留了完整器形，但采用高低错落的瀑布流拼排，底边基线全部错位。读者想横向比较两件陶瓷谁更高、编号各是多少时，视线被迫上下大幅跳跃。",
    },
    {
      key: "D",
      correct: false,
      svg: `<svg viewBox="0 0 220 150" aria-hidden="true">
        <rect width="220" height="150" fill="#F2E8D7"/>
        ${[0, 1, 2, 3]
          .map((i) => {
            const x = 8 + i * 52;
            const lines = [5, 2, 6, 3][i];
            const cols = ["#10795C", "#164FB4", "#E14B21", "#4B2E6B"];
            return `
              <rect x="${x}" y="10" width="46" height="44" fill="#FAF4EA" stroke="#B8AE9B"/>
              ${ceramicGlyph(i, x + 23, 50, 0.84, cols[i])}
              ${Array.from({ length: lines })
                .map((_, l) => `<rect x="${x}" y="${60 + l * 8}" width="${l === lines - 1 ? 26 : 44}" height="4" fill="${l === 0 ? "#0F1114" : "#6B655B"}"/>`)
                .join("")}`;
          })
          .join("")}
      </svg>`,
      explain:
        "方案 D 外框与完整留白都做对了，但把长短悬殊的四五行鉴赏评语直接塞进卡片底下且字段不齐，导致文字篇幅喧宾夺主、下半页参差撕裂，失去了图录快速比对的节奏。",
    },
  ];

  function render() {
    quizEl.innerHTML = options
      .map((opt) => {
        const picked = pickedKey === opt.key;
        const cls = picked ? (opt.correct ? "is-correct" : "is-wrong") : pickedKey && opt.correct ? "is-correct" : "";
        return `
          <button type="button" class="quiz-opt ${cls}" data-quiz="${opt.key}" aria-pressed="${picked}">
            <span class="quiz-opt-head">
              <span>方案 ${opt.key}</span>
              <span>${picked ? (opt.correct ? "✓ 正确" : "× 再看细节") : "点选"}</span>
            </span>
            ${opt.svg}
          </button>
        `;
      })
      .join("");

    quizEl.querySelectorAll("[data-quiz]").forEach((btn) => {
      btn.addEventListener("click", () => {
        pickedKey = btn.dataset.quiz;
        const chosen = options.find((o) => o.key === pickedKey);
        fbEl.hidden = false;
        fbEl.className = `quiz-feedback ${chosen.correct ? "" : "is-wrong"}`;
        fbEl.innerHTML = `<strong>你选了方案 ${chosen.key}：</strong>${chosen.explain}`;
        render();
      });
    });
  }

  render();
})();

// ======================== 原海报放大拖拽灯箱（复用 #poster.src，不重复内联图片） ========================
(() => {
  const openBtn = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const lbZoom = document.getElementById("lb-zoom");
  const btnIn = document.getElementById("lb-in");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let ox = 0;
  let oy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    lbZoom.textContent = `${Math.round(scale * 100)}%`;
  }

  function openLightbox() {
    lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function closeLightbox() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", openLightbox);
  btnClose.addEventListener("click", closeLightbox);
  btnIn.addEventListener("click", () => {
    scale = clamp(+(scale + 0.35).toFixed(2), 0.75, 3.5);
    applyTransform();
  });
  btnOut.addEventListener("click", () => {
    scale = clamp(+(scale - 0.35).toFixed(2), 0.75, 3.5);
    applyTransform();
  });
  btnReset.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbStage.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    const delta = ev.deltaY < 0 ? 0.2 : -0.2;
    scale = clamp(+(scale + delta).toFixed(2), 0.75, 3.5);
    applyTransform();
  });

  lbStage.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0 && ev.pointerType === "mouse") return;
    dragging = true;
    sx = ev.clientX;
    sy = ev.clientY;
    ox = tx;
    oy = ty;
    lbStage.setPointerCapture(ev.pointerId);
  });

  lbStage.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    tx = ox + (ev.clientX - sx);
    ty = oy + (ev.clientY - sy);
    applyTransform();
  });

  const stopDrag = (ev) => {
    dragging = false;
    try {
      if (lbStage.hasPointerCapture(ev.pointerId)) lbStage.releasePointerCapture(ev.pointerId);
    } catch {}
  };
  lbStage.addEventListener("pointerup", stopDrag);
  lbStage.addEventListener("pointercancel", stopDrag);

  window.addEventListener("keydown", (ev) => {
    if (!lb.hidden && ev.key === "Escape") {
      ev.preventDefault();
      closeLightbox();
    }
  });
})();

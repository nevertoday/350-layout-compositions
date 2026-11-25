// 238 固定宽度布局 — 主交互逻辑与全页 7 节控制

import { loop, reducedMotion } from "../../lib/stage.js";
import {
  createInitialState,
  evaluate,
  snapWidth,
  clamp,
  WIDTH_MIN,
  WIDTH_MAX,
  analyzeGridDivisors,
} from "./model.js";
import { createHeroRenderer } from "./stage-canvas.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ================================================================
   开场：活体固定容器制图台 × 五屏同步压测
   ================================================================ */
const state = createInitialState();
let report = evaluate(state);
let draggingCanvas = false;

const heroCanvas = $("#heroCanvas");
const renderer = createHeroRenderer(heroCanvas);

const els = {
  topScore: $("#topScore"),
  titleWidthTag: $("#titleWidthTag"),
  railLeftNote: $("#railLeftNote"),
  railRightNote: $("#railRightNote"),
  diagBox: $("#diagBox"),
  diagBadge: $("#diagBadge"),
  diagHeadline: $("#diagHeadline"),
  diagReason: $("#diagReason"),
  diagHint: $("#diagHint"),
  mBoxW: $("#mBoxW"),
  mMargins: $("#mMargins"),
  mChars: $("#mChars"),
  mOverflow: $("#mOverflow"),
  widthSlider: $("#widthSlider"),
  widthVal: $("#widthVal"),
  cssLive: $("#cssLive"),
  legFixed: $("#legFixed"),
  legMargin: $("#legMargin"),
  legControl: $("#legControl"),
};

let heroLoop = null;
let uiDirty = true;
let lastDragUiAt = 0;

function setTxt(el, val) {
  if (el.textContent !== val) el.textContent = val;
}

function flushHeroUI() {
  uiDirty = false;
  report = evaluate(state);
  const cur = report.current;

  // Topbar badge & masthead live brackets
  const topSt = report.severity === "pass" ? "pass" : "error";
  if (els.topScore.dataset.state !== topSt) els.topScore.dataset.state = topSt;
  setTxt(els.topScore, report.severity === "pass" ? "4 / 4 达标" : `${report.score} / 4 待校容器`);
  setTxt(els.titleWidthTag, `${state.containerWidth}px`);
  setTxt(els.railLeftNote, cur.overflowPx > 0 ? "溢出无左留白" : `← ${cur.leftMargin}px →`);
  setTxt(els.railRightNote, cur.overflowPx > 0 ? `+${cur.overflowPx}px 冲出` : `← ${cur.rightMargin}px →`);

  // Diagnostic card
  if (els.diagBox.dataset.state !== report.severity) els.diagBox.dataset.state = report.severity;
  setTxt(els.diagBadge, report.badge);
  setTxt(els.diagHeadline, report.headline);
  setTxt(els.diagReason, report.reason);
  setTxt(els.diagHint, report.hint);

  // Four single-source live metrics
  setTxt(els.mBoxW, `${cur.boxW}px`);
  const boxCls = `metric-v ${report.pillars.widthOk && cur.overflowPx === 0 ? "good" : "bad"}`;
  if (els.mBoxW.className !== boxCls) els.mBoxW.className = boxCls;

  setTxt(els.mMargins, cur.overflowPx > 0 ? `0 / 溢出` : `${cur.leftMargin} / ${cur.rightMargin}px`);
  const marCls = `metric-v ${report.pillars.centerOk && cur.overflowPx === 0 ? "good" : "bad"}`;
  if (els.mMargins.className !== marCls) els.mMargins.className = marCls;

  setTxt(els.mChars, state.scenario === "article" ? `约 ${cur.cjkPerLine} 字/行` : `单栏 ${cur.colW}px`);
  const chCls = `metric-v ${report.pillars.widthOk ? "good" : ""}`;
  if (els.mChars.className !== chCls) els.mChars.className = chCls;

  setTxt(els.mOverflow, report.overflowScreens.length > 0 ? `${report.overflowScreens.length} 屏溢出` : `五屏 0 溢出`);
  const ovCls = `metric-v ${report.overflowScreens.length > 0 ? "bad" : "good"}`;
  if (els.mOverflow.className !== ovCls) els.mOverflow.className = ovCls;

  // Sync slider & toggle buttons
  const wStr = String(state.containerWidth);
  if (els.widthSlider.value !== wStr) els.widthSlider.value = wStr;
  setTxt(els.widthVal, `${state.containerWidth}px`);

  $$("[data-scenario]").forEach((b) => {
    const v = String(b.dataset.scenario === state.scenario);
    if (b.getAttribute("aria-pressed") !== v) b.setAttribute("aria-pressed", v);
  });
  $$("[data-lock]").forEach((b) => {
    const v = String(b.dataset.lock === state.lockMode);
    if (b.getAttribute("aria-pressed") !== v) b.setAttribute("aria-pressed", v);
  });
  $$("[data-align]").forEach((b) => {
    const v = String(b.dataset.align === state.align);
    if (b.getAttribute("aria-pressed") !== v) b.setAttribute("aria-pressed", v);
  });
  $$("[data-gutter]").forEach((b) => {
    const v = String(Number(b.dataset.gutter) === state.gutter);
    if (b.getAttribute("aria-pressed") !== v) b.setAttribute("aria-pressed", v);
  });

  // Live CSS preview
  setTxt(els.cssLive, report.cssLines.join("\n"));

  // Poster bottom 3-circle legend
  const ls = report.legendStatus;
  setTxt(els.legFixed, ls.fixed.text);
  if (els.legFixed.dataset.ok !== String(ls.fixed.ok)) els.legFixed.dataset.ok = String(ls.fixed.ok);
  setTxt(els.legMargin, ls.margin.text);
  if (els.legMargin.dataset.ok !== String(ls.margin.ok)) els.legMargin.dataset.ok = String(ls.margin.ok);
  setTxt(els.legControl, ls.control.text);
  if (els.legControl.dataset.ok !== String(ls.control.ok)) els.legControl.dataset.ok = String(ls.control.ok);
}

function syncHeroUI({ deferDraw = false } = {}) {
  renderer.markDirty();
  if (deferDraw && !reducedMotion.matches) {
    // 拖拽中把 DOM 与画布合并到下一帧 rAF 单次执行，避免同帧双绘
    uiDirty = true;
    return;
  }
  flushHeroUI();
  if (heroLoop && reducedMotion.matches) heroLoop.draw();
}

// Canvas loop managed via lib/stage.js (auto pauses offscreen/hidden/reduced-motion)
heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  if (uiDirty) {
    const now = performance.now();
    if (!draggingCanvas || now - lastDragUiAt >= 120) {
      lastDragUiAt = now;
      flushHeroUI();
    }
  }
  renderer.render(state, report, t, dt, { still, dragging: draggingCanvas });
});

// Pointer + Touch direct drag on canvas (data-perf-drag) & click on 5-screen strip
let dragOriginX = 0;
let dragStartW = state.containerWidth;
let pointerDown = false;
let movedEnough = false;
let activePointerId = null;

function localPos(e) {
  const rect = heroCanvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

heroCanvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  const { x, y } = localPos(e);
  const hitVp = renderer.hitTestStrip(x, y);
  if (hitVp !== null) {
    state.viewport = hitVp;
    syncHeroUI();
    return;
  }
  pointerDown = true;
  draggingCanvas = true;
  movedEnough = false;
  activePointerId = e.pointerId;
  dragOriginX = e.clientX;
  dragStartW = state.containerWidth;
  try {
    heroCanvas.setPointerCapture(e.pointerId);
  } catch {}
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!pointerDown || e.pointerId !== activePointerId) return;
  const dx = e.clientX - dragOriginX;
  if (Math.abs(dx) > 2) movedEnough = true;
  const deltaW = renderer.deltaPxToWidthDelta(dx);
  const next = snapWidth(dragStartW + deltaW, !e.shiftKey);
  if (next !== state.containerWidth) {
    state.containerWidth = next;
    syncHeroUI({ deferDraw: true });
  } else {
    renderer.markDirty();
  }
});

function endPointer(e) {
  if (!pointerDown) return;
  if (activePointerId !== null && e.pointerId !== activePointerId) return;
  pointerDown = false;
  draggingCanvas = false;
  activePointerId = null;
  syncHeroUI();
}
heroCanvas.addEventListener("pointerup", endPointer);
heroCanvas.addEventListener("pointercancel", endPointer);

// Fallback native touch listeners so synthetic CDP TouchEvents (perf.mjs) always drag smoothly!
let touchStartX = 0;
let touchStartY = 0;
let touchStartW = state.containerWidth;
let touchLockedHoriz = null;

heroCanvas.addEventListener(
  "touchstart",
  (e) => {
    if (!e.touches.length) return;
    const t0 = e.touches[0];
    const rect = heroCanvas.getBoundingClientRect();
    const x = t0.clientX - rect.left;
    const y = t0.clientY - rect.top;
    const hitVp = renderer.hitTestStrip(x, y);
    if (hitVp !== null) {
      state.viewport = hitVp;
      syncHeroUI();
      touchLockedHoriz = false;
      return;
    }
    touchStartX = t0.clientX;
    touchStartY = t0.clientY;
    touchStartW = state.containerWidth;
    touchLockedHoriz = null;
    draggingCanvas = true;
  },
  { passive: true },
);

heroCanvas.addEventListener(
  "touchmove",
  (e) => {
    if (!e.touches.length || touchLockedHoriz === false) return;
    const t0 = e.touches[0];
    const dx = t0.clientX - touchStartX;
    const dy = t0.clientY - touchStartY;
    if (touchLockedHoriz === null && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      touchLockedHoriz = Math.abs(dx) >= Math.abs(dy);
    }
    if (!touchLockedHoriz) return;
    const deltaW = renderer.deltaPxToWidthDelta(dx);
    const next = clamp(Math.round(touchStartW + deltaW), WIDTH_MIN, WIDTH_MAX);
    if (next !== state.containerWidth) {
      state.containerWidth = next;
      syncHeroUI({ deferDraw: true });
    } else {
      renderer.markDirty();
    }
  },
  { passive: true },
);

heroCanvas.addEventListener(
  "touchend",
  () => {
    draggingCanvas = false;
    touchLockedHoriz = null;
    syncHeroUI();
  },
  { passive: true },
);

// Keyboard support on hero canvas
heroCanvas.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 40 : 10;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.containerWidth = clamp(state.containerWidth - step, WIDTH_MIN, WIDTH_MAX);
    syncHeroUI();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.containerWidth = clamp(state.containerWidth + step, WIDTH_MIN, WIDTH_MAX);
    syncHeroUI();
  } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    const widths = [375, 768, 1024, 1440, 1920];
    const idx = widths.indexOf(state.viewport);
    const nextIdx = e.key === "ArrowUp" ? Math.min(widths.length - 1, idx + 1) : Math.max(0, idx - 1);
    state.viewport = widths[nextIdx];
    syncHeroUI();
  }
});

// Control bar & workbench events
$$("[data-scenario]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scenario = btn.dataset.scenario;
    syncHeroUI();
  });
});

els.widthSlider.addEventListener("input", () => {
  state.containerWidth = Number(els.widthSlider.value);
  syncHeroUI();
});

$$("[data-lock]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.lockMode = btn.dataset.lock;
    syncHeroUI();
  });
});

$$("[data-align]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.align = btn.dataset.align;
    syncHeroUI();
  });
});

$$("[data-gutter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.gutter = Number(btn.dataset.gutter);
    syncHeroUI();
  });
});

$("#preset960").addEventListener("click", () => {
  state.containerWidth = state.scenario === "article" ? 680 : 960;
  state.lockMode = "max";
  state.align = "center";
  state.gutter = 24;
  syncHeroUI();
});

$("#preset1120").addEventListener("click", () => {
  state.containerWidth = state.scenario === "article" ? 720 : 1120;
  state.lockMode = "min";
  state.align = "center";
  state.gutter = 24;
  syncHeroUI();
});

$("#presetBroken").addEventListener("click", () => {
  Object.assign(state, createInitialState());
  syncHeroUI();
});

window.addEventListener("resize", () => {
  renderer.markDirty();
  if (heroLoop && reducedMotion.matches) heroLoop.draw();
});

syncHeroUI();

/* ================================================================
   01 节：三支柱解剖面板
   ================================================================ */
const PILLAR_DATA = {
  fixed: {
    title: "宽度恒定：给视线修一条不随屏幕乱跑的轨道",
    desc: "在大显示器上，文字行长和列宽一旦随浏览器无限制撑开，版面节奏会彻底散架。设定固定上限（例如 960px 或 680px），就是不管显示器是 1440px 还是 2560px，读者眼里看到的版心始终是同一副熟悉比例。",
    code: `.container {\n  width: 100%;\n  max-width: 960px; /* 宽屏稳锁 960，窄屏不硬撑 */\n}`,
    svg: `<svg viewBox="0 0 420 185" role="img" aria-label="固定容器上限宽度剖面图">
      <rect x="8" y="14" width="404" height="156" fill="#F6EFE2" stroke="#08274E" stroke-width="1.6"/>
      <line x1="90" y1="8" x2="90" y2="176" stroke="#08274E" stroke-dasharray="4 4" stroke-width="1.3"/>
      <line x1="330" y1="8" x2="330" y2="176" stroke="#08274E" stroke-dasharray="4 4" stroke-width="1.3"/>
      <rect x="90" y="34" width="240" height="116" fill="#FAF5EA" stroke="#08274E" stroke-width="2.2"/>
      <rect x="164" y="24" width="92" height="20" rx="10" fill="#08274E"/>
      <text x="210" y="37" fill="#FAF5EA" font-size="11" font-family="IBM Plex Mono, Noto Sans SC" text-anchor="middle" font-weight="600">max-width 960</text>
      <path d="M104 94 H316 M104 94 L114 88 M104 94 L114 100 M316 94 L306 88 M316 94 L306 100" stroke="#E7561C" stroke-width="2.2" fill="none"/>
      <text x="210" y="124" fill="#08274E" font-size="12" font-family="Noto Sans SC" text-anchor="middle" font-weight="700">阅读路径恒定，不随超宽屏拉长</text>
    </svg>`,
  },
  margin: {
    title: "边距稳定：宽屏靠外留白，窄屏靠内护垫",
    desc: "原海报中间的斜纹图示画出了固定宽度最容易被忽略的双层防线：屏幕宽于容器时，左右对称的外留白承接多余空间；屏幕窄于容器时，外留白归零，立刻由 padding-inline 安全护垫接手，防止文字擦着屏幕边缘走。",
    code: `.container {\n  margin-inline: auto;  /* 宽屏：左右留白均分 */\n  padding-inline: 24px; /* 窄屏：内垫托住文字不贴边 */\n}`,
    svg: `<svg viewBox="0 0 420 185" role="img" aria-label="左右留白与内边距护垫剖面图">
      <defs>
        <pattern id="h1" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#E59D7D" stroke-width="2"/>
        </pattern>
      </defs>
      <rect x="8" y="14" width="404" height="156" fill="#F6EFE2" stroke="#08274E" stroke-width="1.6"/>
      <rect x="10" y="16" width="88" height="152" fill="url(#h1)"/>
      <rect x="322" y="16" width="88" height="152" fill="url(#h1)"/>
      <rect x="98" y="28" width="224" height="128" fill="#FAF5EA" stroke="#08274E" stroke-width="2"/>
      <rect x="100" y="30" width="18" height="124" fill="rgba(11,107,86,0.2)"/>
      <rect x="302" y="30" width="18" height="124" fill="rgba(11,107,86,0.2)"/>
      <text x="54" y="96" fill="#B3380A" font-size="11.5" font-family="Noto Sans SC" text-anchor="middle" font-weight="700">左留白</text>
      <text x="366" y="96" fill="#B3380A" font-size="11.5" font-family="Noto Sans SC" text-anchor="middle" font-weight="700">右留白</text>
      <text x="210" y="92" fill="#08274E" font-size="12" font-family="Noto Sans SC" text-anchor="middle" font-weight="700">内垫 24px 护住正文</text>
      <text x="210" y="112" fill="#0B6B56" font-size="11" font-family="IBM Plex Mono" text-anchor="middle">padding-inline: 24px</text>
    </svg>`,
  },
  control: {
    title: "内容居中：让视觉轴线永远落在屏幕中点",
    desc: "早期不少老网站只写了固定宽度却忘了居中，结果在宽屏上整页内容像一块补丁贴在左上角。加上 margin-inline: auto 后，浏览器自动把剩余宽度对半拆分，页面瞬间获得建筑立面般的端正重心。",
    code: `.container {\n  width: min(960px, 100% - 48px);\n  margin-inline: auto; /* 逻辑属性，自动适配书写方向 */\n}`,
    svg: `<svg viewBox="0 0 420 185" role="img" aria-label="内容居中轴线对称示意图">
      <rect x="8" y="14" width="404" height="156" fill="#F6EFE2" stroke="#08274E" stroke-width="1.6"/>
      <line x1="210" y1="8" x2="210" y2="176" stroke="#E7561C" stroke-dasharray="5 4" stroke-width="1.6"/>
      <rect x="104" y="34" width="212" height="116" fill="#FAF5EA" stroke="#08274E" stroke-width="2"/>
      <rect x="122" y="54" width="44" height="38" fill="#08274E"/>
      <rect x="178" y="56" width="120" height="6" fill="#08274E"/>
      <rect x="178" y="70" width="106" height="5" fill="#5D6B7E"/>
      <rect x="178" y="83" width="114" height="5" fill="#5D6B7E"/>
      <rect x="122" y="106" width="176" height="5" fill="#5D6B7E"/>
      <rect x="122" y="119" width="142" height="5" fill="#5D6B7E"/>
      <circle cx="210" cy="34" r="5" fill="#E7561C"/>
      <text x="210" y="164" fill="#B3380A" font-size="11" font-family="IBM Plex Mono, Noto Sans SC" text-anchor="middle" font-weight="600">中轴对齐 · 左右偏差 0px</text>
    </svg>`,
  },
};

function renderPillar(key) {
  const d = PILLAR_DATA[key];
  if (!d) return;
  $$(".pillar-card").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.pillar === key)));
  $("#anatomySvg").innerHTML = d.svg;
  $("#anatomyTitle").textContent = d.title;
  $("#anatomyDesc").textContent = d.desc;
  $("#anatomyCode").textContent = d.code;
}
$$(".pillar-card").forEach((b) => b.addEventListener("click", () => renderPillar(b.dataset.pillar)));
renderPillar("fixed");

/* ================================================================
   02 节：行长与眼动回扫真排印工作台
   ================================================================ */
const measureState = { width: 680, fontSize: 16, lang: "zh" };
const MEASURE_COPY = {
  zh: {
    title: "为什么书页从不铺满整张书桌？",
    text: "当我们阅读一段连续文字时，眼球并不是匀速滑行，而是做一连串短促的跳读。读到一行末尾准备折返下一行开头时，行宽一旦超长，视线在空旷的横向距离里很容易偏上一行或掉到下一行。固定最大宽度就是给阅读筑起隐形护栏，让每一行长度落进眼睛最省力的节奏带。",
  },
  en: {
    title: "Choose a Comfortable Measure",
    text: "Anything from 45 to 75 characters is widely regarded as a satisfactory length of line for a single-column page set in a serifed text face in a text size. When lines stretch across a wide monitor unchecked, the return sweep from one line ending back to the next beginning loses accuracy and tires the reader.",
  },
};

function updateMeasureLab() {
  const { width, fontSize, lang } = measureState;
  const copy = MEASURE_COPY[lang];
  const box = $("#measureBox");
  const ruler = $("#measureRuler");
  const textEl = $("#measureText");

  const innerW = Math.max(120, width - 44);
  const chars = lang === "zh" ? Math.round(innerW / fontSize) : Math.round(innerW / (fontSize * 0.5));
  const emRatio = (innerW / fontSize).toFixed(1);

  let verdict = "good";
  let grade = "理想阅读带";
  let msg = "";
  if (lang === "zh") {
    if (chars < 22) {
      verdict = "bad";
      grade = "过窄碎行";
      msg = `单行仅约 ${chars} 个汉字，句子被频繁折断，眼睛刚起步就要换行，阅读节奏破碎。`;
    } else if (chars > 44) {
      verdict = "bad";
      grade = "超宽易串行";
      msg = `单行拉长到约 ${chars} 个汉字（超出 WCAG 1.4.8 建议的 40 字上限），从行尾回扫下一行开头容易落偏重读。`;
    } else {
      verdict = "good";
      grade = "舒适经验带";
      msg = `单行约 ${chars} 个汉字（处于中文经验带 28–42 字与 WCAG 40 字参考范围内），回扫干脆、节奏从容。`;
    }
  } else {
    if (chars < 45) {
      verdict = "bad";
      grade = "Too Narrow";
      msg = `约 ${chars} 西文字符/行（低于 Bringhurst 建议的 45 字符下限），单词频繁换行且右侧参差剧烈。`;
    } else if (chars > 75) {
      verdict = "bad";
      grade = "Too Wide";
      msg = `约 ${chars} 西文字符/行（超出 Bringhurst 建议的 45–75 字符带），大屏横向回扫负担明显加重。`;
    } else {
      verdict = "good";
      grade = "Bringhurst 理想带";
      msg = `约 ${chars} 西文字符/行，正好落在 Bringhurst（1992）提出的 45–75 字符舒适区间内。`;
    }
  }

  $("#measureWidthOut").textContent = `${width}px`;
  ruler.style.width = `${width}px`;
  ruler.textContent = `← 容器宽 ${width}px · 字号 ${fontSize}px →`;
  box.style.width = `${width}px`;
  box.dataset.verdict = verdict;

  $("#measureTitle").textContent = copy.title;
  textEl.textContent = copy.text;
  textEl.style.fontSize = `${fontSize}px`;
  textEl.classList.toggle("en-mode", lang === "en");

  $("#mrInner").textContent = `${innerW}px`;
  $("#mrChars").textContent = lang === "zh" ? `约 ${chars} 汉字` : `约 ${chars} 字符`;
  $("#mrCh").textContent = `${emRatio} em`;
  $("#mrGrade").textContent = grade;

  const vb = $("#measureVerdict");
  vb.dataset.verdict = verdict;
  vb.textContent = msg;

  $$("[data-fsize]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.fsize) === fontSize)));
  $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
}

$("#measureRange").addEventListener("input", (e) => {
  measureState.width = Number(e.target.value);
  updateMeasureLab();
});
$$("[data-fsize]").forEach((b) =>
  b.addEventListener("click", () => {
    measureState.fontSize = Number(b.dataset.fsize);
    updateMeasureLab();
  }),
);
$$("[data-lang]").forEach((b) =>
  b.addEventListener("click", () => {
    measureState.lang = b.dataset.lang;
    updateMeasureLab();
  }),
);
updateMeasureLab();

/* ================================================================
   03 节：深海蓝暗室 · WCAG 1.4.10 缩放重排实测
   ================================================================ */
const reflowState = { recipe: "hard", zoom: 400 };
const ZOOM_VP = { 100: 1280, 200: 640, 400: 320 };

function updateReflowLab() {
  const { recipe, zoom } = reflowState;
  const vpPx = ZOOM_VP[zoom];
  const frame = $("#simFrame");
  const inner = $("#simInnerPage");
  const status = $("#reflowStatus");

  // Visual frame width scales proportionally so 320px visibly narrows vs 640px/1280px
  const visualFrameW = zoom === 400 ? 300 : zoom === 200 ? 480 : 620;
  frame.style.width = `${visualFrameW}px`;

  let fail = false;
  if (recipe === "hard") {
    const hardOverflow = vpPx < 960;
    fail = hardOverflow;
    // Scale simulated 960px box inside the visible port so real horizontal scrollbar triggers when vpPx < 960!
    inner.style.width = hardOverflow ? `${Math.round((960 / vpPx) * 100)}%` : "82%";
    inner.style.marginInline = "auto";
    inner.style.paddingInline = "16px";
    $("#simOverflowLabel").textContent = hardOverflow ? `溢出 +${960 - vpPx}px（可横滑）` : "当前不溢（缩放即炸）";
    status.textContent = hardOverflow
      ? `未通过 WCAG 1.4.10：在 ${zoom}% 缩放（等效 ${vpPx}px）下，硬锁 width: 960px 冲出视口 +${960 - vpPx}px。试着横向拖动上方模拟框，就能体会读完一行还要来回滑屏的折磨。`
      : `在 100%（1280px）下暂时风平浪静——但这正是硬锁写法最隐蔽的陷阱。点一下「200%」或「400%」就能看见它当场裂开。`;
  } else if (recipe === "max") {
    fail = false;
    inner.style.width = vpPx > 960 ? "82%" : "100%";
    inner.style.marginInline = "auto";
    inner.style.paddingInline = "20px";
    $("#simOverflowLabel").textContent = "0px 溢出 · 自动重排";
    status.textContent = `通过 WCAG 1.4.10：1280px 下锁定 960px 上限；切到 ${zoom}%（${vpPx}px）时自动退回 100% 并保留 24px 安全内边距，单向竖滑即可读完 [END]。`;
  } else {
    fail = false;
    inner.style.width = vpPx > 960 ? "82%" : "calc(100% - 32px)";
    inner.style.marginInline = "auto";
    inner.style.paddingInline = "14px";
    $("#simOverflowLabel").textContent = "0px 溢出 · min() 护栏";
    status.textContent = `通过 WCAG 1.4.10：CSS min(960px, 100% - 48px) 用一行同时声明宽屏上限与窄屏双侧留白，${zoom}%（${vpPx}px）下零横向滚动条，且框外自带呼吸边。`;
  }

  $("#simVpLabel").textContent = `视口 ${vpPx}px（${zoom}% 缩放）`;
  status.dataset.fail = String(fail);
  $("#simScrollPort").scrollLeft = 0;

  $$("[data-recipe]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.recipe === recipe)));
  $$("[data-zoom]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.zoom) === zoom)));
}

$$("[data-recipe]").forEach((b) =>
  b.addEventListener("click", () => {
    reflowState.recipe = b.dataset.recipe;
    updateReflowLab();
  }),
);
$$("[data-zoom]").forEach((b) =>
  b.addEventListener("click", () => {
    reflowState.zoom = Number(b.dataset.zoom);
    updateReflowLab();
  }),
);
updateReflowLab();

/* ================================================================
   04 节：960 整除因子列网剖分交互尺（纯 SVG，窄屏永不裁字）
   ================================================================ */
const divState = { base: 960, cols: 12 };

function updateDivisorLab() {
  const res = analyzeGridDivisors(divState.base, divState.cols, 20);
  const W = 720;
  const H = 92;
  const padX = 12;
  const usableW = W - padX * 2;
  const unitW = usableW / res.cols;
  const gutterFrac = Math.min(0.28, 20 / Math.max(24, res.rawCol));
  const gutterDraw = unitW * gutterFrac;
  const colFill = res.exactInner ? "rgba(8, 39, 78, 0.14)" : "rgba(185, 28, 28, 0.14)";
  const colStroke = res.exactInner ? "#08274E" : "#B91C1C";
  const txtCol = res.exactInner ? "#08274E" : "#B91C1C";

  let rects = "";
  for (let i = 0; i < res.cols; i++) {
    const x0 = padX + i * unitW + gutterDraw / 2;
    const cw = Math.max(4, unitW - gutterDraw);
    rects += `<rect x="${x0.toFixed(1)}" y="14" width="${cw.toFixed(1)}" height="54" fill="${colFill}" stroke="${colStroke}" stroke-width="1.3"/>`;
    if (res.cols <= 12) {
      rects += `<text x="${(x0 + cw / 2).toFixed(1)}" y="45" fill="${txtCol}" font-size="${res.cols > 8 ? 10 : 12}" font-family="IBM Plex Mono, monospace" text-anchor="middle" font-weight="600">${res.exactInner ? res.netCol : res.netCol.toFixed(1)}</text>`;
    } else {
      rects += `<text x="${(x0 + cw / 2).toFixed(1)}" y="45" fill="${txtCol}" font-size="9.5" font-family="IBM Plex Mono, monospace" text-anchor="middle" font-weight="600">${i + 1}</text>`;
    }
  }
  const rulerText = `${res.containerPx}px ÷ ${res.cols} 列（含每列 20px 栏沟） → 单列净宽 ${res.netLabel}`;

  $("#divisorSvgBox").innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${rulerText}">
    <rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="#FAF5EA" stroke="#CFC4B1" stroke-width="1"/>
    ${rects}
    <text x="${W / 2}" y="84" fill="#3B4656" font-size="11.5" font-family="IBM Plex Mono, Noto Sans SC" text-anchor="middle">${rulerText}</text>
  </svg>`;

  $("#divisorFormula").textContent = `${res.containerPx} ÷ ${res.cols} = ${res.rawLabel} / 格（扣 20px 栏沟后单列净宽 ${res.netLabel}）`;
  const badge = $("#divisorBadge");
  badge.dataset.exact = String(res.exactInner);
  badge.textContent = res.exactInner ? "整除 · 零亚像素误差" : "除不尽 · 产生小数像素";

  $$("[data-base]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.base) === divState.base)));
  $$("[data-cols]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.cols) === divState.cols)));
}

$$("[data-base]").forEach((b) =>
  b.addEventListener("click", () => {
    divState.base = Number(b.dataset.base);
    updateDivisorLab();
  }),
);
$$("[data-cols]").forEach((b) =>
  b.addEventListener("click", () => {
    divState.cols = Number(b.dataset.cols);
    updateDivisorLab();
  }),
);
updateDivisorLab();

/* ================================================================
   05 节：6 类真实业务场景选型诊断器
   ================================================================ */
const USECASES = {
  docs: {
    flagClass: "use",
    flag: "强烈推荐 · 固定阅读上限",
    title: "技术文档与深度专栏：把正文锁在 680–760px",
    body: "连续段落最怕超宽屏把句子拉成面条。即使外层带左侧目录与右侧大纲，中间正文轨道依然应设死 max-width（或 65ch），让眼球回扫节奏始终稳健。",
    code: `.prose {\n  width: 100%;\n  max-width: 720px;\n  margin-inline: auto;\n  padding-inline: 24px;\n}`,
    svg: `<svg viewBox="0 0 320 140" role="img" aria-label="文档居中单栏示意图">
      <rect x="4" y="4" width="312" height="132" fill="#F6EFE2" stroke="#08274E" stroke-width="1.5"/>
      <rect x="82" y="16" width="156" height="108" fill="#FAF5EA" stroke="#0B6B56" stroke-width="2"/>
      <rect x="96" y="30" width="96" height="8" fill="#08274E"/>
      <rect x="96" y="48" width="128" height="4" fill="#5B6778"/>
      <rect x="96" y="59" width="122" height="4" fill="#5B6778"/>
      <rect x="96" y="70" width="126" height="4" fill="#5B6778"/>
      <rect x="96" y="81" width="104" height="4" fill="#5B6778"/>
      <text x="160" y="112" fill="#0B6B56" font-size="10.5" font-family="IBM Plex Mono" text-anchor="middle">max-width: 720px</text>
    </svg>`,
  },
  checkout: {
    flagClass: "use",
    flag: "强烈推荐 · 窄容器聚精会神",
    title: "表单与结账页：520–640px 收束填写视线",
    body: "输入地址、卡号或注册步骤时，拉满 1440px 的输入框会让标签与填写区相隔千里。用 560px 左右的居中容器能把用户注意力牢牢留在一列动作上。",
    code: `.checkout {\n  width: min(560px, 100% - 32px);\n  margin-inline: auto;\n}`,
    svg: `<svg viewBox="0 0 320 140" role="img" aria-label="居中表单容器示意图">
      <rect x="4" y="4" width="312" height="132" fill="#F6EFE2" stroke="#08274E" stroke-width="1.5"/>
      <rect x="102" y="16" width="116" height="108" fill="#FAF5EA" stroke="#08274E" stroke-width="2"/>
      <rect x="114" y="30" width="92" height="14" fill="#F6EFE2" stroke="#08274E"/>
      <rect x="114" y="52" width="92" height="14" fill="#F6EFE2" stroke="#08274E"/>
      <rect x="114" y="74" width="92" height="14" fill="#F6EFE2" stroke="#08274E"/>
      <rect x="114" y="96" width="92" height="18" fill="#C9430E"/>
      <text x="160" y="108" fill="#FFF" font-size="10" font-family="Noto Sans SC" text-anchor="middle">确认提交</text>
    </svg>`,
  },
  story: {
    flagClass: "hybrid",
    flag: "混合方案 · 固定版心 + 全宽破格",
    title: "品牌故事页：文字守住 1120px，关键大图全宽破格",
    body: "正文与导航稳坐居中固定容器，但在需要气势的大图或通栏数据带用全宽背景破出护栏（Full-Bleed Breakout），既有秩序又有电影张力。",
    code: `.band-inner {\n  width: min(1120px, 100% - 48px);\n  margin-inline: auto;\n}\n.full-bleed { width: 100%; }`,
    svg: `<svg viewBox="0 0 320 140" role="img" aria-label="固定版心加全宽破格示意图">
      <rect x="4" y="4" width="312" height="132" fill="#F6EFE2" stroke="#08274E" stroke-width="1.5"/>
      <rect x="64" y="14" width="192" height="24" fill="#FAF5EA" stroke="#08274E" stroke-width="1.5"/>
      <rect x="6" y="46" width="308" height="44" fill="#08274E"/>
      <text x="160" y="72" fill="#FAF5EA" font-size="11" font-family="Noto Sans SC" text-anchor="middle">全宽破格大图 / 横幅</text>
      <rect x="64" y="98" width="192" height="28" fill="#FAF5EA" stroke="#08274E" stroke-width="1.5"/>
    </svg>`,
  },
  email: {
    flagClass: "use",
    flag: "历史特例 · 600px 固定容器",
    title: "HTML 邮件简报：至今仍常用 600px 居中框",
    body: "因为各家桌面邮件客户端的预览窗格普遍偏窄且 CSS 支持碎片化，600px 左右（带手机端 max-width: 100% 退路）仍是行业公认的稳妥画幅。",
    code: `.mail-wrap {\n  width: 100%;\n  max-width: 600px;\n  margin: 0 auto;\n}`,
    svg: `<svg viewBox="0 0 320 140" role="img" aria-label="600px 邮件简报示意图">
      <rect x="4" y="4" width="312" height="132" fill="#EFE5D3" stroke="#08274E" stroke-width="1.5"/>
      <rect x="96" y="14" width="128" height="112" fill="#FAF5EA" stroke="#08274E" stroke-width="2"/>
      <rect x="96" y="14" width="128" height="28" fill="#C9430E"/>
      <text x="160" y="31" fill="#FFF" font-size="10.5" font-family="IBM Plex Mono" text-anchor="middle">600px MAIL</text>
      <rect x="108" y="54" width="104" height="5" fill="#08274E"/>
      <rect x="108" y="66" width="96" height="4" fill="#5B6778"/>
      <rect x="108" y="76" width="100" height="4" fill="#5B6778"/>
      <rect x="108" y="92" width="60" height="18" fill="#08274E"/>
    </svg>`,
  },
  sheet: {
    flagClass: "avoid",
    flag: "别用固定宽 · 改用流体工作台",
    title: "多列数据表与 ERP 后台：硬锁 960px 是浪费大屏",
    body: "运营人员买 27 寸宽屏就是为了少拖横向滚动条、一眼扫完 18 列字段。把重型数据台困在 960px 居中小盒子里，两侧白留大块空白反而降低效率。",
    code: `.workspace {\n  width: 100%;\n  padding-inline: 20px;\n}`,
    svg: `<svg viewBox="0 0 320 140" role="img" aria-label="全宽多列表格工作台示意图">
      <rect x="4" y="4" width="312" height="132" fill="#FAF5EA" stroke="#B91C1C" stroke-width="1.6"/>
      <rect x="12" y="14" width="296" height="22" fill="#08274E"/>
      <text x="160" y="28" fill="#FAF5EA" font-size="10.5" font-family="Noto Sans SC" text-anchor="middle">100% 全宽数据列（充分利用 2560 大屏）</text>
      <g stroke="#CFC4B1" stroke-width="1">
        <line x1="12" y1="54" x2="308" y2="54"/>
        <line x1="12" y1="74" x2="308" y2="74"/>
        <line x1="12" y1="94" x2="308" y2="94"/>
        <line x1="12" y1="114" x2="308" y2="114"/>
        <line x1="72" y1="36" x2="72" y2="128"/>
        <line x1="132" y1="36" x2="132" y2="128"/>
        <line x1="192" y1="36" x2="192" y2="128"/>
        <line x1="252" y1="36" x2="252" y2="128"/>
      </g>
    </svg>`,
  },
  canvas: {
    flagClass: "avoid",
    flag: "别用固定宽 · 贴满整屏视口",
    title: "设计画板、地图与时间轴：需要全视口自由空间",
    body: "地图导航、视频剪辑轨或节点画布属于二维空间工具，每一寸屏幕都能多看一段视野。这类产品应直接铺满 100vw 并在四周停靠工具栏。",
    code: `.canvas-app {\n  width: 100%;\n  height: 100dvh;\n  display: grid;\n  grid-template-columns: 56px 1fr 260px;\n}`,
    svg: `<svg viewBox="0 0 320 140" role="img" aria-label="全视口画布工具界面示意图">
      <rect x="4" y="4" width="312" height="132" fill="#071E3D" stroke="#08274E" stroke-width="1.5"/>
      <rect x="8" y="8" width="26" height="124" fill="#0D2C55"/>
      <rect x="250" y="8" width="62" height="124" fill="#0D2C55"/>
      <rect x="40" y="16" width="204" height="108" fill="#13386A" stroke="#5CE0BD" stroke-dasharray="4 3"/>
      <text x="142" y="74" fill="#FAF5EA" font-size="11" font-family="Noto Sans SC" text-anchor="middle">全视口无限工作区</text>
    </svg>`,
  },
};

function renderUsecase(key) {
  const d = USECASES[key];
  if (!d) return;
  $$("[data-usecase]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.usecase === key)));
  const flag = $("#scFlag");
  flag.className = `scene-flag ${d.flagClass}`;
  flag.textContent = d.flag;
  $("#scTitle").textContent = d.title;
  $("#scBody").textContent = d.body;
  $("#scCode").textContent = d.code;
  $("#scDiagram").innerHTML = d.svg;
}
$$("[data-usecase]").forEach((b) => b.addEventListener("click", () => renderUsecase(b.dataset.usecase)));
renderUsecase("docs");

/* ================================================================
   06 节：小练习（单变量对比四选一，中性标签，含双屏微型图解）
   ================================================================ */
const QUIZ_SVGS = {
  A: `<svg viewBox="0 0 280 74" role="img" aria-label="方案 A 桌面与手机对照图">
    <rect x="4" y="6" width="160" height="60" fill="#FAF5EA" stroke="#08274E" stroke-width="1.3"/>
    <rect x="44" y="14" width="80" height="44" fill="rgba(8,39,78,0.16)" stroke="#08274E" stroke-width="1.4"/>
    <text x="84" y="40" fill="#08274E" font-size="10" font-family="IBM Plex Mono" text-anchor="middle">1440px</text>
    <rect x="184" y="6" width="44" height="60" fill="#FAF5EA" stroke="#08274E" stroke-width="1.3"/>
    <rect x="184" y="14" width="82" height="44" fill="rgba(8,39,78,0.16)" stroke="#08274E" stroke-width="1.4"/>
    <line x1="228" y1="6" x2="228" y2="66" stroke="#08274E" stroke-dasharray="3 2" stroke-width="1.3"/>
    <text x="206" y="40" fill="#08274E" font-size="9.5" font-family="IBM Plex Mono" text-anchor="middle">375px</text>
  </svg>`,
  B: `<svg viewBox="0 0 280 74" role="img" aria-label="方案 B 桌面与手机对照图">
    <rect x="4" y="6" width="160" height="60" fill="#FAF5EA" stroke="#08274E" stroke-width="1.3"/>
    <rect x="44" y="14" width="80" height="44" fill="rgba(8,39,78,0.16)" stroke="#08274E" stroke-width="1.4"/>
    <text x="84" y="40" fill="#08274E" font-size="10" font-family="IBM Plex Mono" text-anchor="middle">1440px</text>
    <rect x="184" y="6" width="44" height="60" fill="#FAF5EA" stroke="#08274E" stroke-width="1.3"/>
    <rect x="188" y="14" width="36" height="44" fill="rgba(8,39,78,0.16)" stroke="#08274E" stroke-width="1.4"/>
    <text x="206" y="40" fill="#08274E" font-size="9.5" font-family="IBM Plex Mono" text-anchor="middle">375px</text>
  </svg>`,
  C: `<svg viewBox="0 0 280 74" role="img" aria-label="方案 C 桌面与手机对照图">
    <rect x="4" y="6" width="160" height="60" fill="#FAF5EA" stroke="#08274E" stroke-width="1.3"/>
    <rect x="10" y="14" width="148" height="44" fill="rgba(8,39,78,0.16)" stroke="#08274E" stroke-width="1.4"/>
    <text x="84" y="40" fill="#08274E" font-size="10" font-family="IBM Plex Mono" text-anchor="middle">1440px</text>
    <rect x="184" y="6" width="44" height="60" fill="#FAF5EA" stroke="#08274E" stroke-width="1.3"/>
    <rect x="188" y="14" width="36" height="44" fill="rgba(8,39,78,0.16)" stroke="#08274E" stroke-width="1.4"/>
    <text x="206" y="40" fill="#08274E" font-size="9.5" font-family="IBM Plex Mono" text-anchor="middle">375px</text>
  </svg>`,
  D: `<svg viewBox="0 0 280 74" role="img" aria-label="方案 D 桌面与手机对照图">
    <rect x="4" y="6" width="160" height="60" fill="#FAF5EA" stroke="#08274E" stroke-width="1.3"/>
    <rect x="4" y="14" width="80" height="44" fill="rgba(8,39,78,0.16)" stroke="#08274E" stroke-width="1.4"/>
    <text x="44" y="40" fill="#08274E" font-size="9.5" font-family="IBM Plex Mono" text-anchor="middle">1440px</text>
    <rect x="184" y="6" width="44" height="60" fill="#FAF5EA" stroke="#08274E" stroke-width="1.3"/>
    <rect x="188" y="14" width="36" height="44" fill="rgba(8,39,78,0.16)" stroke="#08274E" stroke-width="1.4"/>
    <text x="206" y="40" fill="#08274E" font-size="9.5" font-family="IBM Plex Mono" text-anchor="middle">375px</text>
  </svg>`,
};

$$("[data-qsvg]").forEach((el) => {
  el.innerHTML = QUIZ_SVGS[el.dataset.qsvg] || "";
});

const QUIZ_ANSWERS = {
  A: {
    ok: false,
    head: "选 A 不稳妥：只差「宽度锁法」这一个变量",
    body: "桌面 1440px 下居中与 720px 行长都对，但写死了 width: 720px 而没用 max-width，在 375px 手机上会直接横向冲出 +345px，触发横向滚动条并违背 WCAG 1.4.10。",
  },
  B: {
    ok: true,
    head: "答对了！方案 B 四根支柱全部落地",
    body: "1440px 桌面上限稳锁在 720px（扣掉左右 24px 护垫后净宽 672px，16px 正文约 42 汉字/行），margin-inline: auto 让左右留白精准对称；切到 375px 手机时自动退回 100% 宽度并保留 24px 安全护垫，零横向滚动。",
  },
  C: {
    ok: false,
    head: "选 C 不稳妥：只差「上限宽度」这一个变量",
    body: "它居中、有护垫、手机也不溢出，但把单栏长文的 max-width 放宽到 1360px。在 1440px 桌面上每行飙到 80+ 个汉字，读完一行折返下一行时极易串行疲劳。",
  },
  D: {
    ok: false,
    head: "选 D 不稳妥：只差「水平居中」这一个变量",
    body: "720px 行长和手机重排都没毛病，但 margin: 0 把整栏内容死贴屏幕左侧，1440px 桌面上右侧白白悬空 720px，失去固定宽度布局最关键的左右平衡与视觉重心。",
  },
};

$$(".quiz-opt").forEach((btn) => {
  btn.addEventListener("click", () => {
    const pick = btn.dataset.opt;
    const ans = QUIZ_ANSWERS[pick];
    $$(".quiz-opt").forEach((b) => {
      b.removeAttribute("data-picked");
      b.setAttribute("aria-pressed", String(b === btn));
    });
    btn.dataset.picked = ans.ok ? "correct" : "wrong";
    if (!ans.ok) {
      const rightBtn = $('.quiz-opt[data-opt="B"]');
      if (rightBtn) rightBtn.dataset.picked = "correct";
    }
    const fb = $("#quizFeedback");
    fb.dataset.state = ans.ok ? "correct" : "wrong";
    fb.innerHTML = `<strong>${ans.head}</strong><span>${ans.body}</span>`;
  });
});

/* ================================================================
   07 节：原海报点击放大、拖拽平移与 Esc 关闭灯箱
   ================================================================ */
const lightbox = $("#lightbox");
const lbImg = $("#lbImg");
const lbStage = $("#lbStage");
const posterImg = $("#poster");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDragging = false;
let lbStartX = 0;
let lbStartY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  $("#lbZoomReset").textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  $("#lbClose").focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  $("#posterOpen").focus();
}

$("#posterOpen").addEventListener("click", openLightbox);
$("#lbClose").addEventListener("click", closeLightbox);
$("#lbZoomIn").addEventListener("click", () => {
  lbScale = clamp(lbScale + 0.35, 1, 3.2);
  applyLbTransform();
});
$("#lbZoomOut").addEventListener("click", () => {
  lbScale = clamp(lbScale - 0.35, 1, 3.2);
  if (lbScale === 1) {
    lbX = 0;
    lbY = 0;
  }
  applyLbTransform();
});
$("#lbZoomReset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lbScale === 1) {
    closeLightbox();
    return;
  }
  lbDragging = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  try {
    lbStage.setPointerCapture(e.pointerId);
  } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDragging) return;
  lbX = e.clientX - lbStartX;
  lbY = e.clientY - lbStartY;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => {
  lbDragging = false;
});
lbStage.addEventListener("pointercancel", () => {
  lbDragging = false;
});
lbStage.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.2);
    if (lbScale === 1) {
      lbX = 0;
      lbY = 0;
    }
    applyLbTransform();
  },
  { passive: false },
);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) {
    e.preventDefault();
    closeLightbox();
  }
});

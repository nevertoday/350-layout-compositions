// 345 引语页幻灯片版式 · 主入口控制器
// 协调单一真源 model.js、16:9 活体幻灯片画布、四周原海报虚线引注、胶片切页与正文七节交互。

import { INITIAL_STATE, PRESETS, SCENARIOS, evaluate, getStageForTrim } from "./model.js";
import { createSlideCanvas } from "./stage-canvas.js";
import { initSections } from "./sections.js";

const MARK_CYCLE = ["straight", "arc", "crushing", "bar"];
const SPACE_CYCLE = ["cramped", "balanced", "island"];
const AUTHOR_CYCLE = ["vague", "clear", "bloated", "none"];

const state = {
  ...INITIAL_STATE,
  highlights: [...INITIAL_STATE.highlights],
};

// DOM 引用
const canvas = document.getElementById("quote-canvas");
const topStatus = document.getElementById("top-status");
const trimRange = document.getElementById("trim-range");
const trimReadout = document.getElementById("trim-readout");
const diagBadge = document.getElementById("diag-badge");
const diagMeta = document.getElementById("diag-meta");
const diagHead = document.getElementById("diag-head");
const diagBody = document.getElementById("diag-body");
const diagFix = document.getElementById("diag-fix");
const factNote = document.getElementById("fact-note");
const rehearseBtn = document.getElementById("btn-rehearse");
const rehearseTopBtn = document.getElementById("btn-rehearse-top");

const scenarioBtns = [...document.querySelectorAll("[data-scenario]")];
const slideBtns = [...document.querySelectorAll("[data-deck-slide]")];
const markBtns = [...document.querySelectorAll("[data-mark]")];
const spaceBtns = [...document.querySelectorAll("[data-space]")];
const authorBtns = [...document.querySelectorAll("[data-author]")];
const alignBtns = [...document.querySelectorAll("[data-align]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const calloutBtns = {
  mark: document.getElementById("co-mark"),
  focus: document.getElementById("co-focus"),
  space: document.getElementById("co-space"),
  author: document.getElementById("co-author"),
};

// 切换场景或提纯档位时，清理已不在当前句中的高亮词
function pruneHighlights() {
  const { stage } = getStageForTrim(state.scenario, state.trim);
  const valid = new Set();
  for (const line of stage.lines) for (const seg of line) valid.add(seg.t);
  state.highlights = state.highlights.filter((t) => valid.has(t));
}

function defaultHighlightForCurrent() {
  const { stage } = getStageForTrim(state.scenario, state.trim);
  if (stage.defaultHighlight) return [...stage.defaultHighlight];
  for (const line of stage.lines) {
    for (const seg of line) {
      if (seg.em) return [seg.t];
    }
  }
  return [];
}

function toggleSmartFocus() {
  const { stage } = getStageForTrim(state.scenario, state.trim);
  const candidates = [];
  for (const line of stage.lines) {
    for (const seg of line) {
      if (seg.t.replace(/[，。！？、；：“”‘’\s]/g, "").length >= 2) candidates.push(seg.t);
    }
  }
  if (!state.highlights.length) {
    state.highlights = defaultHighlightForCurrent();
  } else if (state.highlights.length === 1 && candidates.length >= 2) {
    // 演示双向错态：全句高亮
    state.highlights = candidates;
  } else {
    state.highlights = [];
  }
}

let stageApi = null;
let lastBadge = "";
let lastOk = "";
let lastMeta = "";
let lastHead = "";
let lastBody = "";
let lastFix = "";
let lastFact = "";
let lastTrimText = "";
let lastPillarKeys = "";
let lastBtnState = "";

function syncUI(fromDrag = false) {
  const ev = evaluate(state);
  const isOk = ev.score === 4;
  const okStr = isOk ? "1" : "0";

  // 仅在值真变时写 DOM，避免 60Hz 拖拽下反复触发浏览器样式重算
  const trimStr = String(state.trim);
  if (trimRange.value !== trimStr) trimRange.value = trimStr;
  const nextTrimText = `${state.trim}% · ${ev.chars} 字 · 约 ${ev.readSec}s`;
  if (lastTrimText !== nextTrimText) {
    trimReadout.textContent = nextTrimText;
    lastTrimText = nextTrimText;
  }

  if (lastBadge !== ev.badge || lastOk !== okStr) {
    topStatus.textContent = ev.badge;
    topStatus.dataset.ok = okStr;
    diagBadge.textContent = ev.badge;
    diagBadge.dataset.ok = okStr;
    lastBadge = ev.badge;
    lastOk = okStr;
  }

  const nextMeta = `留白 ${ev.whitespacePct}% · 投影等效 ${ev.fontPt}pt（示意）`;
  if (lastMeta !== nextMeta) {
    diagMeta.textContent = nextMeta;
    lastMeta = nextMeta;
  }

  const nextHead = isOk ? ev.okHeadline : ev.primaryFault.headline;
  const nextBody = isOk ? ev.okWhy : ev.primaryFault.why;
  const nextFix = isOk
    ? "你也可以继续拖过 90% 测试「过度删空」，或点击不同预设对照三种合法构图。"
    : `下一步：${ev.primaryFault.fix}`;
  if (lastHead !== nextHead) { diagHead.textContent = nextHead; lastHead = nextHead; }
  if (lastBody !== nextBody) { diagBody.textContent = nextBody; lastBody = nextBody; }
  if (lastFix !== nextFix) { diagFix.textContent = nextFix; lastFix = nextFix; }
  if (lastFact !== ev.scenario.factNote) {
    factNote.textContent = ev.scenario.factNote;
    lastFact = ev.scenario.factNote;
  }

  const pillarSig = ["mark", "focus", "space", "author"].map((k) => `${ev.pillars[k].ok}:${ev.pillars[k].tag}`).join("|");
  if (lastPillarKeys !== pillarSig) {
    lastPillarKeys = pillarSig;
    for (const key of ["mark", "focus", "space", "author"]) {
      const el = calloutBtns[key];
      if (!el) continue;
      const p = ev.pillars[key];
      el.dataset.ok = p.ok ? "1" : "0";
      const chip = el.querySelector(".co-chip");
      if (chip) chip.textContent = p.ok ? `✓ ${p.tag}` : `× ${p.tag}`;
    }
    document.documentElement.style.setProperty("--hero-calm", (ev.score / 4).toFixed(2));
  }

  const btnSig = `${state.scenario}|${state.deckSlide}|${state.mark}|${state.space}|${state.author}|${state.align}`;
  if (lastBtnState !== btnSig) {
    lastBtnState = btnSig;
    scenarioBtns.forEach((b) => {
      const on = b.dataset.scenario === state.scenario;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    slideBtns.forEach((b) => {
      const on = Number(b.dataset.deckSlide) === state.deckSlide;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    markBtns.forEach((b) => {
      const on = b.dataset.mark === state.mark;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    spaceBtns.forEach((b) => {
      const on = b.dataset.space === state.space;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    authorBtns.forEach((b) => {
      const on = b.dataset.author === state.author;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    alignBtns.forEach((b) => {
      const on = b.dataset.align === state.align;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  // 拖拽中由 rAF 合并单次重绘，避免单帧重画 3–4 遍
  if (fromDrag) stageApi?.invalidate();
  else stageApi?.draw();
}

// 初始化 16:9 活体幻灯片画布
stageApi = createSlideCanvas(canvas, () => state, {
  onTrim(nextTrim) {
    if (nextTrim === state.trim && state.deckSlide === 1) return;
    const prevStage = getStageForTrim(state.scenario, state.trim).index;
    state.deckSlide = 1;
    state.trim = nextTrim;
    const nextStage = getStageForTrim(state.scenario, state.trim).index;
    if (prevStage !== nextStage) {
      pruneHighlights();
      if (state.highlights.length > 0 && nextStage === 3) {
        state.highlights = defaultHighlightForCurrent();
      }
    }
    syncUI(true);
  },
  onCycleMark() {
    state.deckSlide = 1;
    const idx = MARK_CYCLE.indexOf(state.mark);
    state.mark = MARK_CYCLE[(idx + 1) % MARK_CYCLE.length];
    if (state.mark === "bar" && state.align === "center") state.align = "left";
    syncUI();
  },
  onCycleSpace() {
    state.deckSlide = 1;
    const idx = SPACE_CYCLE.indexOf(state.space);
    state.space = SPACE_CYCLE[(idx + 1) % SPACE_CYCLE.length];
    syncUI();
  },
  onCycleAuthor() {
    state.deckSlide = 1;
    const idx = AUTHOR_CYCLE.indexOf(state.author);
    state.author = AUTHOR_CYCLE[(idx + 1) % AUTHOR_CYCLE.length];
    syncUI();
  },
  onTogglePhrase(text) {
    state.deckSlide = 1;
    const i = state.highlights.indexOf(text);
    if (i >= 0) state.highlights.splice(i, 1);
    else state.highlights.push(text);
    syncUI();
  },
  onReturnToQuote() {
    state.deckSlide = 1;
    syncUI();
  },
  onRehearsalEnd() {
    rehearseBtn?.classList.remove("is-running");
    rehearseTopBtn?.classList.remove("is-running");
  },
});

// 绑定控件事件
trimRange.addEventListener("input", () => {
  stageApi.stopRehearsal();
  state.deckSlide = 1;
  state.trim = Number(trimRange.value);
  pruneHighlights();
  syncUI();
});

scenarioBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const key = b.dataset.scenario;
    if (!SCENARIOS[key]) return;
    stageApi.stopRehearsal();
    const hadHighlights = state.highlights.length > 0;
    state.scenario = key;
    state.deckSlide = 1;
    state.highlights = hadHighlights ? defaultHighlightForCurrent() : [];
    syncUI();
  });
});

slideBtns.forEach((b) => {
  b.addEventListener("click", () => {
    stageApi.stopRehearsal();
    state.deckSlide = Number(b.dataset.deckSlide);
    syncUI();
  });
});

markBtns.forEach((b) => {
  b.addEventListener("click", () => {
    stageApi.stopRehearsal();
    state.deckSlide = 1;
    state.mark = b.dataset.mark;
    syncUI();
  });
});

spaceBtns.forEach((b) => {
  b.addEventListener("click", () => {
    stageApi.stopRehearsal();
    state.deckSlide = 1;
    state.space = b.dataset.space;
    syncUI();
  });
});

authorBtns.forEach((b) => {
  b.addEventListener("click", () => {
    stageApi.stopRehearsal();
    state.deckSlide = 1;
    state.author = b.dataset.author;
    syncUI();
  });
});

alignBtns.forEach((b) => {
  b.addEventListener("click", () => {
    stageApi.stopRehearsal();
    state.deckSlide = 1;
    state.align = b.dataset.align;
    syncUI();
  });
});

presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    stageApi.stopRehearsal();
    Object.assign(state, p.patch);
    if (p.patch.highlights === null) {
      state.highlights = defaultHighlightForCurrent();
    } else {
      state.highlights = [...p.patch.highlights];
    }
    syncUI();
  });
});

// 四周原海报虚线引注直接可点修复或试错
calloutBtns.mark?.addEventListener("click", () => {
  stageApi.stopRehearsal();
  state.deckSlide = 1;
  state.mark = state.mark === "arc" ? "bar" : state.mark === "bar" ? "crushing" : state.mark === "crushing" ? "straight" : "arc";
  syncUI();
});
calloutBtns.focus?.addEventListener("click", () => {
  stageApi.stopRehearsal();
  state.deckSlide = 1;
  const ev = evaluate(state);
  if (ev.chars > 32 || ev.chars < 7) {
    state.trim = 78;
    state.highlights = defaultHighlightForCurrent();
  } else {
    toggleSmartFocus();
  }
  syncUI();
});
calloutBtns.space?.addEventListener("click", () => {
  stageApi.stopRehearsal();
  state.deckSlide = 1;
  const idx = SPACE_CYCLE.indexOf(state.space);
  state.space = SPACE_CYCLE[(idx + 1) % SPACE_CYCLE.length];
  syncUI();
});
calloutBtns.author?.addEventListener("click", () => {
  stageApi.stopRehearsal();
  state.deckSlide = 1;
  const idx = AUTHOR_CYCLE.indexOf(state.author);
  state.author = AUTHOR_CYCLE[(idx + 1) % AUTHOR_CYCLE.length];
  syncUI();
});

const triggerRehearsal = () => {
  state.deckSlide = 1;
  syncUI();
  rehearseBtn?.classList.add("is-running");
  rehearseTopBtn?.classList.add("is-running");
  stageApi.startRehearsal();
};

rehearseBtn?.addEventListener("click", triggerRehearsal);
rehearseTopBtn?.addEventListener("click", triggerRehearsal);

// 键盘操作：Space 触发 3 秒实境翻页演练；画布聚焦时 ←/→ 步进删词提纯
window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (e.code === "Space" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "BUTTON") {
    const lb = document.getElementById("poster-lb");
    if (lb && !lb.hidden) return;
    e.preventDefault();
    triggerRehearsal();
  }
});

canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    state.deckSlide = 1;
    state.trim = Math.min(100, state.trim + 6);
    pruneHighlights();
    syncUI();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.deckSlide = 1;
    state.trim = Math.max(0, state.trim - 6);
    pruneHighlights();
    syncUI();
  } else if (e.key === "Enter") {
    e.preventDefault();
    toggleSmartFocus();
    syncUI();
  }
});

syncUI();
initSections();

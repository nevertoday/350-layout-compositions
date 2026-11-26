// 340 仅标题 幻灯片版式 · 主入口：连接开场单真源模型、削字投影台与 01–07 节交互。

import {
  createInitialState,
  CLUTTER_KEYS,
  DECKS,
  PRESETS,
  clamp,
} from "./model.js";
import { mountHeroStage } from "./stage.js";
import {
  initSec01Channels,
  initSec02ScaleLab,
  initSec03Timeline,
  initSec04FourWall,
  initSec05Triage,
  initSec06Quiz,
  initSec07Poster,
} from "./sections.js";

const state = createInitialState("poster");

// DOM 引用
const heroCanvas = document.getElementById("hero-canvas");
const scoreBadge = document.getElementById("hero-score-badge");
const scoreBadgeMobile = document.getElementById("hero-score-mobile");
const mWs = document.getElementById("m-ws");
const mChars = document.getElementById("m-chars");
const mGlance = document.getElementById("m-glance");
const mFont = document.getElementById("m-font");

const diagWrap = document.getElementById("hero-diag");
const diagTitle = document.getElementById("diag-title");
const diagBody = document.getElementById("diag-body");
const diagHint = document.getElementById("diag-hint");
const spokenList = document.getElementById("spoken-tray-list");
const heroRedSvg = document.getElementById("hero-red-svg");

const deckBtns = [...document.querySelectorAll("[data-deck]")];
const clutterBtns = [...document.querySelectorAll("[data-clutter]")];
const tierBtns = [...document.querySelectorAll("[data-tier]")];
const postureBtns = [...document.querySelectorAll("[data-posture]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const noiseBtn = document.getElementById("btn-noise");
const flashBtn = document.getElementById("btn-flash");
const stripAllBtn = document.getElementById("btn-strip-all");
const resetBtn = document.getElementById("btn-reset");

const pillarEls = {
  minimal: document.getElementById("pillar-minimal"),
  focus: document.getElementById("pillar-focus"),
  whitespace: document.getElementById("pillar-whitespace"),
  presence: document.getElementById("pillar-presence"),
};

function syncUI(geom, ev) {
  if (!geom || !ev) return;

  // 顶部与窄屏分数徽章（单真源同步，按四项完整检出首个未达标项）
  const firstFailTag = !ev.checks.minimal.ok
    ? ev.checks.minimal.tag
    : !ev.checks.focus.ok
      ? ev.checks.focus.tag
      : !ev.checks.whitespace.ok
        ? ev.checks.whitespace.tag
        : ev.checks.presence.tag;
  const badgeText = ev.passed
    ? `${ev.score}/4 · 留白 ${geom.whitespacePct}%`
    : `${ev.score}/4 · ${firstFailTag}`;

  [scoreBadge, scoreBadgeMobile].forEach((el) => {
    if (!el) return;
    el.textContent = badgeText;
    el.classList.toggle("is-pass", ev.passed);
  });

  // 顶部紧凑实测指标
  if (mWs) mWs.textContent = `${geom.whitespacePct}%`;
  if (mChars) mChars.textContent = `${geom.charCount} 字`;
  if (mGlance) mGlance.textContent = `${geom.glanceSec}s（示意）`;
  if (mFont) mFont.textContent = `${geom.fontSize}px`;

  // 左栏白纸细红左线单真源诊单
  if (diagWrap) diagWrap.classList.toggle("is-pass", ev.passed);
  if (diagTitle) diagTitle.textContent = ev.verdictTitle;
  if (diagBody) diagBody.textContent = ev.verdictBody;
  if (diagHint) diagHint.textContent = ev.actionHint;

  // 自示范主标右上 45° 红圆斜线随状态微调呼应
  if (heroRedSvg) {
    heroRedSvg.classList.toggle("is-pass", ev.passed);
  }

  // 四枚原海报竖线关键词实时探针
  for (const key of Object.keys(pillarEls)) {
    const el = pillarEls[key];
    if (!el) continue;
    const chk = ev.checks[key];
    el.classList.toggle("is-pass", chk.ok);
    const tag = el.querySelector(".pillar-tag");
    if (tag) tag.textContent = chk.tag;
  }

  // 剧本切换按钮
  deckBtns.forEach((b) => {
    const on = b.dataset.deck === state.deckId;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 四块冗余剥离按钮状态（ON = 仍在屏幕上需删，OFF = 已归口播）
  clutterBtns.forEach((b) => {
    const k = b.dataset.clutter;
    const present = state.clutter[k];
    b.classList.toggle("is-present", present);
    b.classList.toggle("is-peeled", !present);
    b.setAttribute("aria-pressed", String(!present));
    const prefix = present ? "× " : "✓ ";
    const base = geom.deck.clutter[k].short;
    b.textContent = `${prefix}${base}`;
  });

  // 4 档文案提纯按钮（直接由实际有效字数实时生成，保证与读数条和画布角标 100% 同源）
  const tierSuffix = ["公文", "解释", "主张", "空口号"];
  tierBtns.forEach((b) => {
    const idx = Number(b.dataset.tier);
    const on = state.wordTier === idx;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
    const tObj = geom.deck.titles[idx];
    if (tObj) {
      const n = tObj.lines.join("").replace(/[\s，。、：；！？,.!?:;·]/g, "").length;
      b.textContent = `${n}字${tierSuffix[idx] || ""}`;
    }
  });

  // 构图轴线按钮
  postureBtns.forEach((b) => {
    const on = b.dataset.posture === state.posture;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 干扰底纹反例开关
  if (noiseBtn) {
    noiseBtn.classList.toggle("is-warn-on", state.noisyBg);
    noiseBtn.setAttribute("aria-pressed", String(state.noisyBg));
    noiseBtn.textContent = state.noisyBg ? "花纹底噪：开" : "试错：加底纹";
  }

  // 归口述提示区（显示已剥离回演讲者口中的内容）
  if (spokenList) {
    const peeled = CLUTTER_KEYS.filter((k) => !state.clutter[k]);
    if (!peeled.length) {
      spokenList.textContent = "待剥离：点击上方画布虚线块或冗余按钮，将辅助信息交还演讲者口述。";
    } else if (peeled.length === 4) {
      spokenList.textContent =
        "已全部归口述（副标、要点、配图、页脚）：屏幕清场，由你的声音负责展开细节。";
    } else {
      const lastKey = state.lastPeeled && !state.clutter[state.lastPeeled] ? state.lastPeeled : peeled[peeled.length - 1];
      spokenList.textContent = `已归口述（${peeled.length}/4）· ${geom.deck.clutter[lastKey].spokenCue}`;
    }
  }
}

const stage = heroCanvas ? mountHeroStage(heroCanvas, state, syncUI) : null;

// 绑定开场控件
deckBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.deckId = b.dataset.deck;
    state.flashActive = false;
    stage?.draw();
  })
);

clutterBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const k = b.dataset.clutter;
    state.clutter[k] = !state.clutter[k];
    if (!state.clutter[k]) state.lastPeeled = k;
    state.flashActive = false;
    stage?.draw();
  })
);

tierBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.wordTier = Number(b.dataset.tier);
    state.flashActive = false;
    stage?.draw();
  })
);

postureBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.posture = b.dataset.posture;
    if (state.posture === "takahashi" && state.fontSize < 74) {
      state.fontSize = 82;
    }
    state.flashActive = false;
    stage?.draw();
  })
);

presetBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    state.wordTier = p.wordTier;
    state.fontSize = p.fontSize;
    state.posture = p.posture;
    state.clutter = { ...p.clutter };
    state.noisyBg = p.noisyBg;
    state.flashActive = false;
    stage?.draw();
  })
);

noiseBtn?.addEventListener("click", () => {
  state.noisyBg = !state.noisyBg;
  state.flashActive = false;
  stage?.draw();
});

stripAllBtn?.addEventListener("click", () => {
  // 一键校准到当前剧本的原海报经典解
  const p = PRESETS.classic;
  state.wordTier = p.wordTier;
  state.fontSize = p.fontSize;
  state.posture = p.posture;
  state.clutter = { ...p.clutter };
  state.noisyBg = false;
  state.flashActive = false;
  stage?.draw();
});

resetBtn?.addEventListener("click", () => {
  const p = PRESETS.broken;
  state.wordTier = p.wordTier;
  state.fontSize = p.fontSize;
  state.posture = p.posture;
  state.clutter = { ...p.clutter };
  state.noisyBg = false;
  state.flashActive = false;
  stage?.draw();
});

flashBtn?.addEventListener("click", () => {
  stage?.triggerFlash();
});

// 全局空格快捷键（仅当未聚焦输入框或按钮时触发 3 秒上屏实测）
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON" || tag === "A") return;
    // 仅当开场区域在屏幕内时拦截空格
    const rect = heroCanvas?.getBoundingClientRect();
    if (rect && rect.bottom > 60 && rect.top < window.innerHeight) {
      e.preventDefault();
      stage?.triggerFlash();
    }
  }
});

// 节内所有交互模块初始化
initSec01Channels();
initSec02ScaleLab();
initSec03Timeline();
initSec04FourWall();
initSec05Triage();
initSec06Quiz();
initSec07Poster();

// 258 侧边栏页面 — 主入口与全页七节互动编排
import { loop } from "../../lib/stage.js";
import { createInitialState, PRESETS, computeLayout, auditLayout } from "./model.js";
import { createBench } from "./bench.js";
import { mountScanLab, HISTORY_ERAS, QUIZ_QUESTIONS } from "./diagrams.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ================= 1. 开场活体侧边栏工作台 =================
let state = createInitialState();
const heroCanvas = $("#hero-canvas");

let bench;
let heroLoop;

function syncUI() {
  const rect = heroCanvas.getBoundingClientRect();
  const box = { w: Math.max(260, Math.round(rect.width || 720)), h: Math.max(240, Math.round(rect.height || 380)) };
  const layout = computeLayout(state, box);
  const audit = auditLayout(state, layout);

  // 顶部与手机刊头状态徽
  const pillText = audit.ok ? audit.passPattern : `${audit.passedCount}/4 · ${audit.primary.badge}`;
  for (const el of [$("#hero-status"), $("#mb-status"), $("#audit-badge")]) {
    if (!el) continue;
    el.textContent = pillText;
    el.classList.toggle("is-ok", audit.ok);
    el.classList.toggle("is-err", !audit.ok);
  }

  // 原海报左上星芒微转呼应当前达标进度
  const star = $("#hero-star-badge");
  if (star) star.style.transform = `rotate(${audit.passedCount * 22.5}deg)`;

  // 原海报左侧深焙黑四支柱实时探针 + 手机后置四支柱
  const pillarCopy = {
    navClear: audit.pillars.navClear
      ? "定位清晰"
      : (layout.isTruncated ? "文字截断" : (layout.visibleNavCount < 4 ? `滚丢 ${4 - layout.visibleNavCount} 项` : "窄屏挤爆")),
    hierarchy: audit.pillars.hierarchy
      ? "层级明确"
      : (!state.highlight ? "无高亮" : "右置偏重"),
    emphasis: audit.pillars.emphasis
      ? `主区 ${audit.pctMain}%`
      : (state.viewport <= 480 && state.mode === "full" ? "手机挤死" : `过肥 ${audit.pctRail}%`),
    support: audit.pillars.support
      ? "辅助清爽"
      : (state.clutter ? "杂物抢焦" : "未锚定"),
  };

  for (const key of ["navClear", "hierarchy", "emphasis", "support"]) {
    const ok = audit.pillars[key];
    const tag = $(`#p-${key}`);
    if (tag) {
      tag.textContent = pillarCopy[key];
      tag.classList.toggle("is-ok", ok);
      tag.classList.toggle("is-err", !ok);
    }
    const li = $(`.rp-item[data-pillar="${key}"]`);
    if (li) li.classList.toggle("is-ok", ok);
    const mpp = $(`.mpp-item[data-mp="${key}"]`);
    if (mpp) mpp.classList.toggle("is-ok", ok);
  }

  // 单真源白话诊单卡
  const card = $("#audit-card");
  card.classList.toggle("is-ok", audit.ok);
  if (audit.ok) {
    $("#audit-title").textContent = "侧边栏与主内容各安其位，结构成立！";
    $("#audit-why").textContent = audit.passSummary;
    $("#audit-how").textContent = "你可以继续切换「手机 390」或点旁侧反向试错，看看同一个侧栏在窄屏或未锚定时会如何翻车。";
    $("#btn-fix-step").textContent = "切到手机 390 测窄屏";
    $("#btn-fix-step").dataset.nextAction = "test-mobile";
  } else {
    $("#audit-title").textContent = audit.primary.title;
    $("#audit-why").textContent = audit.primary.why;
    $("#audit-how").textContent = `怎么改：${audit.primary.how}`;
    $("#btn-fix-step").textContent = audit.primary.fixLabel;
    $("#btn-fix-step").dataset.nextAction = "fix-primary";
  }

  // 单真源 4 项实测指标
  $("#m-rail").textContent = state.mode === "drawer"
    ? "抽屉 0px"
    : `${audit.pctRail}% · ${layout.railSimPx}px`;
  $("#m-cpl").textContent = `约 ${layout.mainCpl} 字/行`;
  $("#m-vis").textContent = `${layout.visibleNavCount} / 4 项`;
  $("#m-posture").textContent = audit.posture;

  // 同步硬件精控台控件值
  const slW = $("#sl-width");
  slW.value = String(Math.round(state.railRatio * 100));
  slW.disabled = state.mode !== "full";
  $("#out-width").textContent = state.mode === "full"
    ? `${audit.pctRail}% · ${layout.railSimPx}px`
    : (state.mode === "rail" ? `图标轨 · ${layout.railSimPx}px` : "抽屉 · 按需呼出");

  const slS = $("#sl-scroll");
  slS.value = String(Math.round(state.scroll * 100));
  $("#out-scroll").textContent = `${Math.round(state.scroll * 100)}%`;

  $$("#scene-tabs button").forEach((b) => b.classList.toggle("is-active", b.dataset.scene === state.scene));
  $$("#vp-tabs button").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.vp) === state.viewport));
  $$("#mode-btns button").forEach((b) => b.classList.toggle("is-active", b.dataset.mode === state.mode));
  $$("#side-btns button").forEach((b) => b.classList.toggle("is-active", b.dataset.side === state.side));

  const tSticky = $("#tog-sticky");
  tSticky.setAttribute("aria-pressed", String(state.sticky));
  tSticky.classList.toggle("is-on", state.sticky);
  tSticky.textContent = `固定锚定 Sticky：${state.sticky ? "开" : "关"}`;

  const tHi = $("#tog-highlight");
  tHi.setAttribute("aria-pressed", String(state.highlight));
  tHi.classList.toggle("is-on", state.highlight);
  tHi.textContent = `当前位高亮：${state.highlight ? "开" : "关"}`;

  const tCl = $("#tog-clutter");
  tCl.setAttribute("aria-pressed", String(state.clutter));
  tCl.classList.toggle("is-warn", state.clutter);
  tCl.classList.toggle("is-on", !state.clutter);
  tCl.textContent = `侧栏冗余杂物：${state.clutter ? "有" : "已清空"}`;
}

function patchState(patch, opts = {}) {
  state = { ...state, ...patch };
  bench.markDirty(!!opts.pulse);
  syncUI();
  heroLoop.draw();
}

bench = createBench(heroCanvas, () => state, patchState);
heroLoop = loop(heroCanvas, (t, dt, meta) => bench.render(t, dt, meta));

// 绑定开场控件
$("#scene-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-scene]");
  if (btn) patchState({ scene: btn.dataset.scene, activeNav: 0 }, { pulse: true });
});
$("#vp-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-vp]");
  if (btn) patchState({ viewport: Number(btn.dataset.vp) });
});
$("#sl-width").addEventListener("input", (e) => {
  patchState({ mode: "full", railRatio: Number(e.target.value) / 100 });
});
$("#sl-scroll").addEventListener("input", (e) => {
  patchState({ scroll: Number(e.target.value) / 100 });
});
$("#mode-btns").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-mode]");
  if (btn) patchState({ mode: btn.dataset.mode, drawerOpen: false });
});
$("#side-btns").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-side]");
  if (btn) patchState({ side: btn.dataset.side });
});
$("#tog-sticky").addEventListener("click", () => patchState({ sticky: !state.sticky }));
$("#tog-highlight").addEventListener("click", () => patchState({ highlight: !state.highlight }));
$("#tog-clutter").addEventListener("click", () => patchState({ clutter: !state.clutter }));

$("#btn-fix-step").addEventListener("click", () => {
  const act = $("#btn-fix-step").dataset.nextAction;
  if (act === "test-mobile") {
    patchState({ viewport: 390, mode: "full", railRatio: 0.34 });
    return;
  }
  const rect = heroCanvas.getBoundingClientRect();
  const layout = computeLayout(state, { w: Math.max(260, rect.width || 720), h: Math.max(240, rect.height || 380) });
  const audit = auditLayout(state, layout);
  if (audit.primary && audit.primary.fixPatch) {
    patchState(audit.primary.fixPatch, { pulse: true });
  }
});
$("#btn-reset-bad").addEventListener("click", () => {
  state = createInitialState();
  bench.markDirty(true);
  syncUI();
  heroLoop.draw();
});
$("#preset-list").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-preset]");
  if (!btn) return;
  const p = PRESETS[btn.dataset.preset];
  if (p) patchState(p.patch, { pulse: true });
});

window.addEventListener("resize", () => {
  bench.markDirty();
  syncUI();
  heroLoop.draw();
  scanLab.render();
});

// ================= 2. 01 节：眼动扫读对比实验室 =================
const scanCanvas = $("#scan-canvas");
const scanLab = mountScanLab(scanCanvas, {
  onResult({ target, topFix, sideFix }) {
    $("#scan-readout").textContent = `寻找「${target}」：顶部双行需横向折返约 ${topFix} 次示意注视；左侧对齐列表沿纵轴直扫约 ${sideFix} 次即可命中。`;
  },
});
const scanLoop = loop(scanCanvas, (t, dt, meta) => scanLab.tick(t, dt, meta));
$("#scan-btns").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-target]");
  if (!btn) return;
  $$("#scan-btns button").forEach((b) => b.classList.toggle("is-active", b === btn));
  scanLab.setTarget(Number(btn.dataset.target), true);
  scanLoop.draw();
});
$("#scan-replay").addEventListener("click", () => {
  scanLab.replay();
  scanLoop.draw();
});

// ================= 3. 02 节：CSS 滚读锚定对照台 =================
const SCROLL_MODES = {
  sticky: {
    badge: "双轨独立 · 稳健",
    ok: true,
    code: `.shell {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
}
.sidebar {
  position: sticky;
  top: 0;
  max-height: 100dvh;
  overflow-y: auto;
}`,
    explain: "正文再长，侧边栏都稳贴视口顶边；目录条目超过一屏时，鼠标移到侧栏就能单独上下滑，两不耽误。",
  },
  static: {
    badge: "失误 A · 随滚丢失",
    ok: false,
    code: `.shell {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
}
.sidebar {
  /* 忘记加 position: sticky */
  position: static;
}`,
    explain: "现在把左侧微缩框往下滚试试：侧栏跟着正文一路往上滚走，读到第四段时顶部 01–06 节已经彻底滚出视野。",
  },
  clipped: {
    badge: "失误 B · 底项被裁",
    ok: false,
    code: `.sidebar {
  position: sticky;
  top: 0;
  max-height: 100dvh;
  /* 错写成 hidden，超过一屏的条目再也点不到 */
  overflow: hidden;
}`,
    explain: "虽然前几节一直留在左上角，但因为没有给侧栏独立滚动条，底部的 10–12 节被硬生生裁掉，用户永远够不到最后一节。",
  },
};
$("#scroll-mode-btns").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-smode]");
  if (!btn) return;
  const mode = btn.dataset.smode;
  const info = SCROLL_MODES[mode];
  $$("#scroll-mode-btns button").forEach((b) => b.classList.toggle("is-active", b === btn));
  $("#mini-browser").dataset.smode = mode;
  $("#ccb-code").textContent = info.code;
  $("#ccb-explain").textContent = info.explain;
  const badge = $("#ccb-badge");
  badge.textContent = info.badge;
  badge.classList.toggle("is-ok", info.ok);
  badge.classList.toggle("is-err", !info.ok);
  // 切到失误 A 时自动滚到中段方便立刻看到侧栏消失
  $("#mb-scrollport").scrollTop = mode === "static" ? 185 : 0;
});

// ================= 4. 03 节：五十年侧轨史切换 =================
function renderEra(idx) {
  const era = HISTORY_ERAS[idx] || HISTORY_ERAS[0];
  $("#era-visual").innerHTML = era.svg;
  $("#era-place").textContent = `${era.year} · ${era.place}`;
  $("#era-title").textContent = era.title;
  $("#era-fact").textContent = era.fact;
  $$("#era-tabs button").forEach((b) => {
    const active = Number(b.dataset.era) === idx;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
}
$("#era-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-era]");
  if (btn) renderEra(Number(btn.dataset.era));
});
renderEra(0);

// ================= 5. 04 节：360–1440px 连续断点变形滑轨 =================
function updateMorph(px) {
  const dev = $("#morph-device");
  const pctWidth = Math.round(34 + ((px - 360) / (1440 - 360)) * 66);
  dev.style.width = `${pctWidth}%`;
  $("#md-dim").textContent = `${px}px`;

  let tier = "desktop";
  let label = "完整侧边栏";
  let title = "桌面宽屏（≥1024px）：常驻完整文字侧栏";
  let desc = "屏幕充裕，侧栏稳占 220–260px，图标与完整中文标题并排显示，一眼定位且正文依然舒展。";
  if (px < 680) {
    tier = "mobile";
    label = "顶部入口 + 抽屉";
    title = "手机窄屏（<680px）：收拢为顶部入口 + 导航抽屉";
    desc = "窄屏下把常驻侧栏彻底撤出正文流，顶部留出清晰「目录」抽屉按钮按需滑出，让正文完整独占 100% 宽度。";
  } else if (px < 1024) {
    tier = "tablet";
    label = "窄图标轨 Rail";
    title = "平板中等屏（680–1023px）：折叠为 56–72px 图标轨";
    desc = "参照 Material Design 3 Navigation Rail 规范：保留 3–7 个高频主入口的高识别图标，省下近两百像素还给右侧内容卡片。";
  }
  dev.dataset.tier = tier;
  $("#out-morph").textContent = `${px}px · ${label}`;
  $("#morph-tier-title").textContent = title;
  $("#morph-tier-desc").textContent = desc;
}
$("#sl-morph").addEventListener("input", (e) => updateMorph(Number(e.target.value)));
updateMorph(1280);

// ================= 6. 05 节：30 秒业务选型开关诊断器 =================
function updateDecision() {
  const picked = new Set($$("#dc-checks input:checked").map((i) => i.value));
  const many = picked.has("many");
  const jump = picked.has("jump");
  const wide = picked.has("wide");
  const canvasHeavy = picked.has("canvas");

  let tag, title, body;
  if (!wide) {
    tag = "窄屏优先：折叠抽屉或底部导航";
    title = "用 263 导航抽屉 / 264 底部导航替代常驻侧栏";
    body = "主要用户都在手机竖屏上，常驻侧栏只会把正文挤扁；入口 ≤5 项放底部导航，入口多则收进顶部抽屉。";
  } else if (!many && !jump) {
    tag = "不必硬加侧边栏";
    title = "改用 255 单列页面或 262 顶部导航";
    body = "入口少且用户只需顺着主线从头读到尾时，侧边栏只会白占两成宽度并分散注意力。";
  } else if (canvasHeavy) {
    tag = "宽画布兼顾：可折叠窄图标轨";
    title = "默认 64px 图标轨 + 一键展开开关";
    body = "表格、时间轴或绘图画布极度珍视水平宽度，默认收成高识别图标轨，需要找冷门模块时再展开文字。";
  } else if (many && jump) {
    tag = "强烈推荐：常驻左侧边栏";
    title = "完整固定侧栏（200–260px，配 Sticky 与高亮）";
    body = "入口多、跨页跳动频繁且屏幕宽裕，把导航固定在左侧既方便未来扩展又能稳住定位；记得在 768px 以下自动退让。";
  } else {
    tag = "折中方案：顶部导航 + 右侧轻量大纲";
    title = "顶部主入口配窄辅助侧栏（≤21%）";
    body = "如果只是长文需要页内目录跳转，可把全局主入口留在顶栏，仅在右侧放一条极克制的固定页内大纲。";
  }
  $("#dcr-tag").textContent = tag;
  $("#dcr-title").textContent = title;
  $("#dcr-body").textContent = body;
}
$("#dc-checks").addEventListener("change", updateDecision);
updateDecision();

// ================= 7. 06 节：双题单变量小练习 =================
let curQ = 0;
function renderQuiz(qIdx) {
  curQ = qIdx;
  const q = QUIZ_QUESTIONS[qIdx];
  $("#quiz-kicker").textContent = q.title;
  $("#quiz-stem").textContent = q.stem;
  $$("#quiz-switch button").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.q) === qIdx));

  const grid = $("#quiz-grid");
  grid.innerHTML = q.options.map((opt) => `
    <button type="button" class="quiz-opt" data-opt="${opt.key}">
      <span class="qo-head"><span>${opt.label}</span><span class="qo-mark" lang="en">${opt.key}</span></span>
      ${opt.svg}
    </button>
  `).join("");
  const fb = $("#quiz-feedback");
  fb.hidden = true;
  fb.classList.remove("is-wrong");
}

$("#quiz-switch").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-q]");
  if (btn) renderQuiz(Number(btn.dataset.q));
});

$("#quiz-grid").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-opt]");
  if (!btn) return;
  const q = QUIZ_QUESTIONS[curQ];
  const pick = btn.dataset.opt;
  const right = pick === q.correct;

  $$("#quiz-grid .quiz-opt").forEach((b) => {
    b.classList.remove("is-right", "is-wrong");
    if (b.dataset.opt === q.correct) b.classList.add("is-right");
    else if (b.dataset.opt === pick) b.classList.add("is-wrong");
  });

  const fb = $("#quiz-feedback");
  fb.hidden = false;
  fb.classList.toggle("is-wrong", !right);
  const chosenOpt = q.options.find((o) => o.key === pick);
  const rightOpt = q.options.find((o) => o.key === q.correct);
  $("#qf-head").textContent = right ? `答对了！正是 ${rightOpt.label}` : `选了 ${chosenOpt.label}，再对照看看 ${rightOpt.label}`;
  $("#qf-body").textContent = right ? rightOpt.whyRight : chosenOpt.whyWrong;
  $("#qf-breakdown").innerHTML = q.options.map((o) => `
    <li><strong>${o.label}：</strong>${o.key === q.correct ? o.whyRight : o.whyWrong}</li>
  `).join("");
});
renderQuiz(0);

// ================= 8. 07 节：原海报放大灯箱（支持缩放、拖动、Esc 关） =================
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
let lbScale = 1, lbX = 0, lbY = 0, lbDrag = false, lbSX = 0, lbSY = 0;

function applyLb() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  $("#lb-scale").textContent = `${Math.round(lbScale * 100)}%`;
}
function openLb() {
  lbImg.src = $("#poster").src;
  lbScale = 1; lbX = 0; lbY = 0;
  applyLb();
  lightbox.hidden = false;
  $("#lb-close").focus();
}
function closeLb() {
  lightbox.hidden = true;
  $("#poster-open").focus();
}

$("#poster-open").addEventListener("click", openLb);
$("#lb-close").addEventListener("click", closeLb);
$("#lb-in").addEventListener("click", () => { lbScale = Math.min(3.5, lbScale + 0.35); applyLb(); });
$("#lb-out").addEventListener("click", () => { lbScale = Math.max(0.6, lbScale - 0.35); applyLb(); });
$("#lb-reset").addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLb(); });

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = Math.max(0.6, Math.min(3.5, lbScale + (e.deltaY < 0 ? 0.18 : -0.18)));
  applyLb();
}, { passive: false });
lbStage.addEventListener("pointerdown", (e) => {
  lbDrag = true;
  lbSX = e.clientX - lbX;
  lbSY = e.clientY - lbY;
  lbStage.classList.add("is-dragging");
  lbStage.setPointerCapture(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbSX;
  lbY = e.clientY - lbSY;
  applyLb();
});
lbStage.addEventListener("pointerup", () => {
  lbDrag = false;
  lbStage.classList.remove("is-dragging");
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLb();
});

// ================= 启动初始化 =================
syncUI();
heroLoop.draw();
scanLab.render();

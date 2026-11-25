// 243 堆栈 STACK · 主交互控制器
// 所有读数、生成 CSS、三支柱状态与白话诊断均由 model.js 单真源计算。

import {
  COLLAPSE_MODES,
  MUTATION_ACTIONS,
  QUIZ_OPTIONS,
  SCENARIOS,
  THEMES,
  TIMELINE,
  createHealthyPreset,
  createInitialState,
  evaluateNesting,
  evaluateStack,
} from "./model.js";
import { mountGapCaliper, mountNestingCanvas } from "./caliper-canvas.js";

// =========================================================================
// 原海报风格 SVG 图标（人物严格采用无五官纯剪影，符合海报与规范）
// =========================================================================
function blockIconSvg(kind) {
  if (kind === "person") {
    return `<svg viewBox="0 0 36 36" aria-hidden="true" fill="none">
      <circle cx="18" cy="12" r="5.5" fill="#101010"/>
      <path d="M8 29 C8 22.5 12.4 19 18 19 C23.6 19 28 22.5 28 29 Z" fill="#101010"/>
    </svg>`;
  }
  if (kind === "doc") {
    return `<svg viewBox="0 0 36 36" aria-hidden="true" fill="none">
      <rect x="8" y="6" width="20" height="24" rx="2.5" fill="#101010"/>
      <rect x="12" y="11" width="12" height="2.4" rx="1" fill="#F3E6CF"/>
      <rect x="12" y="16" width="12" height="2.4" rx="1" fill="#F3E6CF"/>
      <rect x="12" y="21" width="6" height="5.5" rx="1" fill="#F396A0"/>
    </svg>`;
  }
  if (kind === "gear") {
    return `<svg viewBox="0 0 36 36" aria-hidden="true" fill="none">
      <path d="M15.8 5 H20.2 L21 8.8 A9.8 9.8 0 0 1 23.8 10 L27.1 7.9 L30.1 10.9 L28 14.2 A9.8 9.8 0 0 1 29.2 17 L33 17.8 V22.2 L29.2 23 A9.8 9.8 0 0 1 28 25.8 L30.1 29.1 L27.1 32.1 L23.8 30 A9.8 9.8 0 0 1 21 31.2 L20.2 35 H15.8 L15 31.2 A9.8 9.8 0 0 1 12.2 30 L8.9 32.1 L5.9 29.1 L8 25.8 A9.8 9.8 0 0 1 6.8 23 L3 22.2 V17.8 L6.8 17 A9.8 9.8 0 0 1 8 14.2 L5.9 10.9 L8.9 7.9 L12.2 10 A9.8 9.8 0 0 1 15 8.8 Z" fill="#101010"/>
      <circle cx="18" cy="20" r="4.6" fill="#F398A1"/>
    </svg>`;
  }
  if (kind === "note") {
    return `<svg viewBox="0 0 36 36" aria-hidden="true" fill="none">
      <rect x="7" y="8" width="22" height="20" rx="3" fill="#101010"/>
      <rect x="11" y="13" width="14" height="2.4" rx="1" fill="#F3E6CF"/>
      <rect x="11" y="18" width="10" height="2.4" rx="1" fill="#F396A0"/>
      <rect x="11" y="23" width="7" height="2.4" rx="1" fill="#F3E6CF"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 36 36" aria-hidden="true" fill="none">
    <circle cx="18" cy="18" r="11" fill="#101010"/>
    <path d="M13 18.5 L16.5 22 L23.5 14.5" stroke="#F3E6CF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

const DOTS_HTML = `<span class="slab-dots" aria-hidden="true">${"<i></i>".repeat(12)}</span>`;

// =========================================================================
// 开场活体垂直堆栈状态与渲染
// =========================================================================
let state = createInitialState("poster");
let currentEval = evaluateStack(state);

const els = {
  browStatus: document.getElementById("brow-status"),
  mastheadStack: document.getElementById("masthead-stack"),
  caliperCanvas: document.getElementById("gap-caliper"),
  caliperReadout: document.getElementById("caliper-readout"),
  leakTop: document.getElementById("leak-top"),
  leakTopText: document.getElementById("leak-top-text"),
  leakBottom: document.getElementById("leak-bottom"),
  leakBottomText: document.getElementById("leak-bottom-text"),
  stackList: document.getElementById("stack-list"),
  clipCurtain: document.getElementById("clip-curtain"),
  clipLabel: document.getElementById("clip-label"),
  btnAdd: document.getElementById("btn-add-block"),
  btnFixOrder: document.getElementById("btn-fix-order"),
  btnQuickGap: document.getElementById("btn-quick-gap"),
  btnQuickAuto: document.getElementById("btn-quick-auto"),
  btnResetBroken: document.getElementById("btn-reset-broken"),
  btnSplitLast: document.getElementById("btn-split-last"),
  pVertical: document.getElementById("pillar-vertical"),
  pOrder: document.getElementById("pillar-order"),
  pSpacing: document.getElementById("pillar-spacing"),
  diagBadge: document.getElementById("diag-badge"),
  diagTitle: document.getElementById("diag-title"),
  diagBody: document.getElementById("diag-body"),
  diagNext: document.getElementById("diag-next-text"),
  mSeam: document.getElementById("m-seam"),
  mLeak: document.getElementById("m-leak"),
  mSize: document.getElementById("m-size"),
  liveCss: document.getElementById("live-css"),
};

// 记录结构签名：拖动游标尺只改间距时绝不重建卡片 DOM，避免重排抖动，确保 60 FPS
let lastStructKey = "";

function buildStackDom(ev) {
  const frag = document.createDocumentFragment();
  const blocks = ev.blocks;
  const n = blocks.length;

  blocks.forEach((b, idx) => {
    if (idx > 0) {
      const seam = ev.seams[idx - 1];
      const band = document.createElement("div");
      band.className = "seam-band";
      band.dataset.seamIdx = String(idx - 1);
      band.dataset.kind = seam.kind;
      const pill = document.createElement("span");
      pill.className = "seam-pill";
      pill.textContent = seam.detail;
      band.appendChild(pill);
      frag.appendChild(band);
    }

    const slab = document.createElement("div");
    slab.className = "stack-slab";
    slab.dataset.tone = b.tone;
    slab.dataset.blockIdx = String(idx);
    slab.innerHTML = `
      <div class="slab-icon">${blockIconSvg(b.icon)}</div>
      <div class="slab-copy">
        <div class="slab-title-row">
          <h3 class="slab-title">${b.title}</h3>
          <span class="slab-chip">${b.chip}</span>
        </div>
        <span class="slab-bar" aria-hidden="true"></span>
        <p class="slab-sub">${b.sub}</p>
      </div>
      <div class="slab-right">
        ${DOTS_HTML}
        <div class="slab-ctrls">
          <button type="button" class="slab-act" data-act="up" data-idx="${idx}" ${idx === 0 ? "disabled" : ""} aria-label="上移 ${b.title}">↑</button>
          <button type="button" class="slab-act" data-act="down" data-idx="${idx}" ${idx === n - 1 ? "disabled" : ""} aria-label="下移 ${b.title}">↓</button>
          <button type="button" class="slab-act slab-del" data-act="del" data-idx="${idx}" ${n <= 1 ? "disabled" : ""} aria-label="删除 ${b.title}">×</button>
        </div>
      </div>
    `;
    frag.appendChild(slab);
  });

  els.stackList.replaceChildren(frag);
}

function renderHero(fromDrag = false) {
  currentEval = evaluateStack(state);
  const ev = currentEval;

  // 刊头自示范动态间距（仅非连续拖动帧更新，避免重排整个标题区）
  if (!fromDrag) {
    const headGap = Math.round(3 + (ev.gap / 48) * 11);
    els.mastheadStack.style.setProperty("--masthead-gap", `${headGap}px`);
  }

  // 顶眉状态与游标尺数值
  const nextTone = ev.allOk ? "ok" : "err";
  if (els.browStatus.dataset.tone !== nextTone) els.browStatus.dataset.tone = nextTone;
  const nextBrow = ev.allOk ? "4 / 4 堆栈成立" : `${ev.passedCount} / 4 待理顺`;
  if (els.browStatus.textContent !== nextBrow) els.browStatus.textContent = nextBrow;
  els.caliperCanvas.setAttribute("aria-valuenow", String(ev.gap));
  const nextReadout =
    ev.owner === "negative"
      ? "负边距 -18px（撞车）"
      : ev.owner === "child-margin"
      ? `子项乱写（标尺 ${ev.gap}px）`
      : `gap ${ev.gap}px · 经验带 12–32px`;
  if (els.caliperReadout.textContent !== nextReadout) els.caliperReadout.textContent = nextReadout;

  // 卡片 DOM：仅在块序列变化时重建；拖游标尺只更新高度和标签文本
  const structKey = `${state.themeId}|${ev.blocks.map((b) => b.id).join(",")}`;
  if (structKey !== lastStructKey) {
    buildStackDom(ev);
    lastStructKey = structKey;
  }

  // 更新每张卡的错序 / 撞车标记（拖动标尺不改顺序和归属，仅非拖动帧同步）
  if (!fromDrag) {
    const slabs = els.stackList.querySelectorAll(".stack-slab");
    slabs.forEach((slab, idx) => {
      const b = ev.blocks[idx];
      const prevRank = idx > 0 ? ev.blocks[idx - 1].rank : 0;
      const nextRank = idx < ev.blocks.length - 1 ? ev.blocks[idx + 1].rank : 99;
      const misordered = !ev.orderOk && (b.rank < prevRank || b.rank > nextRank);
      slab.classList.toggle("is-misordered", misordered);
      slab.classList.toggle("is-overlap", idx > 0 && ev.owner === "negative");
    });
  }

  const bands = els.stackList.querySelectorAll(".seam-band");
  bands.forEach((band, idx) => {
    const seam = ev.seams[idx];
    if (!seam) return;
    if (band.dataset.kind !== seam.kind) band.dataset.kind = seam.kind;
    if (ev.owner === "negative") {
      band.style.display = "none";
    } else {
      if (band.style.display !== "flex") band.style.display = "flex";
      const visH = Math.max(seam.size <= 6 ? 16 : 18, Math.min(seam.kind === "split" ? 64 : 46, seam.size));
      const nextH = `${visH}px`;
      if (band.style.height !== nextH) band.style.height = nextH;
      const pill = band.querySelector(".seam-pill");
      if (pill && pill.textContent !== seam.detail) pill.textContent = seam.detail;
    }
  });

  // 顶底漏边提示条
  els.leakTop.hidden = ev.topLeak <= 0;
  if (ev.topLeak > 0) {
    const t = `顶块 margin-top 穿透容器顶边 +${ev.topLeak}px`;
    if (els.leakTopText.textContent !== t) els.leakTopText.textContent = t;
  }
  els.leakBottom.hidden = ev.bottomLeak <= 0;
  if (ev.bottomLeak > 0) {
    const t = `底块 margin-bottom 拖出多余尾白 +${ev.bottomLeak}px`;
    if (els.leakBottomText.textContent !== t) els.leakBottomText.textContent = t;
  }

  // 写死定高截断帘
  const showClip = ev.heightMode === "fixed" && ev.clippedPx > 0;
  els.clipCurtain.hidden = !showClip;
  if (showClip) {
    const t = `height: 216px 写死截断 · 裁掉 ${ev.clippedPx}px`;
    if (els.clipLabel.textContent !== t) els.clipLabel.textContent = t;
  }

  if (!fromDrag) {
    // 插入模块按钮上限（最多 5 块，免得拉太长）
    const theme = THEMES[state.themeId];
    const remainingExtras = theme.extras.filter((ex) => !state.blocks.some((b) => b.id === ex.id));
    els.btnAdd.disabled = remainingExtras.length === 0;
    els.btnAdd.textContent = remainingExtras.length ? `+ 插入「${remainingExtras[0].title}」` : "已插满 5 个模块";
  }

  // 原海报三彩圆支柱实况灯
  els.pVertical.dataset.ok = String(ev.pillars.vertical.ok);
  if (els.pVertical.textContent !== ev.pillars.vertical.tag) els.pVertical.textContent = ev.pillars.vertical.tag;
  els.pOrder.dataset.ok = String(ev.pillars.order.ok);
  if (els.pOrder.textContent !== ev.pillars.order.tag) els.pOrder.textContent = ev.pillars.order.tag;
  els.pSpacing.dataset.ok = String(ev.pillars.spacing.ok);
  if (els.pSpacing.textContent !== ev.pillars.spacing.tag) els.pSpacing.textContent = ev.pillars.spacing.tag;

  // 暖奶油单真源诊单
  els.diagBadge.dataset.tone = ev.diag.tone;
  if (els.diagBadge.textContent !== ev.diag.badge) els.diagBadge.textContent = ev.diag.badge;
  if (els.diagTitle.textContent !== ev.diag.title) els.diagTitle.textContent = ev.diag.title;
  if (els.diagBody.textContent !== ev.diag.body) els.diagBody.textContent = ev.diag.body;
  if (els.diagNext.textContent !== ev.diag.next) els.diagNext.textContent = ev.diag.next;

  const seamTxt =
    ev.owner === "negative"
      ? "叠撞 -18px"
      : ev.seamSpread > 0
      ? `不均（差 ${ev.seamSpread}px）`
      : `全等 ${ev.gap}px`;
  if (els.mSeam.textContent !== seamTxt) els.mSeam.textContent = seamTxt;
  const leakTxt = ev.topLeak + ev.bottomLeak > 0 ? `漏 ${ev.topLeak + ev.bottomLeak}px` : "0px · 齐平";
  if (els.mLeak.textContent !== leakTxt) els.mLeak.textContent = leakTxt;
  const sizeTxt =
    ev.heightMode === "fixed" && ev.clippedPx > 0
      ? `${ev.blocks.length} 块 · 裁 ${ev.clippedPx}px`
      : `${ev.blocks.length} 块 · 自然流`;
  if (els.mSize.textContent !== sizeTxt) els.mSize.textContent = sizeTxt;

  if (els.liveCss.textContent !== ev.cssSnippet) {
    els.liveCss.textContent = ev.cssSnippet;
  }

  if (!fromDrag) {
    // 同步所有控槽按钮按下状态
    document.querySelectorAll("[data-theme]").forEach((btn) => {
      const active = btn.dataset.theme === state.themeId;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-owner]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.owner === state.owner));
    });
    document.querySelectorAll("[data-height]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.height === state.heightMode));
    });
    els.btnSplitLast.setAttribute("aria-pressed", String(state.splitLast));
    els.btnSplitLast.textContent = state.splitLast ? "末项推底 auto：开" : "末项推底 auto：关";

    if (caliperApi) caliperApi.sync();
  }
}

const caliperApi = mountGapCaliper(els.caliperCanvas, {
  getEval: () => currentEval,
  onGapInput(nextGap) {
    if (nextGap === state.gap) return;
    state.gap = nextGap;
    renderHero(true);
  },
  onGapCommit(nextGap) {
    state.gap = nextGap;
    renderHero(false);
  },
});

// 卡片内部 ↑ / ↓ / × 按钮事件委托
els.stackList.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const idx = Number(btn.dataset.idx);
  const act = btn.dataset.act;
  if (act === "up" && idx > 0) {
    const copy = [...state.blocks];
    [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
    state.blocks = copy;
    renderHero();
  } else if (act === "down" && idx < state.blocks.length - 1) {
    const copy = [...state.blocks];
    [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
    state.blocks = copy;
    renderHero();
  } else if (act === "del" && state.blocks.length > 1) {
    state.blocks = state.blocks.filter((_, i) => i !== idx);
    renderHero();
  }
});

// 插入模块（智能插在内容区位，验证自由扩展）
els.btnAdd.addEventListener("click", () => {
  const theme = THEMES[state.themeId];
  const nextExtra = theme.extras.find((ex) => !state.blocks.some((b) => b.id === ex.id));
  if (!nextExtra) return;
  const actionIdx = state.blocks.findIndex((b) => b.rank === 3);
  const copy = [...state.blocks];
  if (actionIdx > 0) copy.splice(actionIdx, 0, { ...nextExtra });
  else copy.push({ ...nextExtra });
  state.blocks = copy;
  renderHero();
});

// 理顺当前全部模块顺序
els.btnFixOrder.addEventListener("click", () => {
  state.blocks = [...state.blocks].sort((a, b) => a.rank - b.rank);
  renderHero();
});

// 手机首屏快捷按钮
els.btnQuickGap.addEventListener("click", () => {
  state.owner = "gap";
  if (state.gap < 12) state.gap = 20;
  renderHero();
});
els.btnQuickAuto.addEventListener("click", () => {
  state.heightMode = "auto";
  renderHero();
});

// 复原 0/4 错态
els.btnResetBroken.addEventListener("click", () => {
  state = createInitialState(state.themeId);
  renderHero();
});

// 切换题材
document.querySelectorAll("[data-theme]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const nextTheme = btn.dataset.theme;
    if (nextTheme === state.themeId) return;
    const theme = THEMES[nextTheme];
    const byId = Object.fromEntries(theme.blocks.map((b) => [b.id, b]));
    const extraById = Object.fromEntries(theme.extras.map((b) => [b.id, b]));
    // 保留当前顺序结构与参数，只替换卡片题材文案
    state.themeId = nextTheme;
    state.blocks = state.blocks.map((b) => ({ ...(byId[b.id] || extraById[b.id] || theme.blocks[0]) }));
    renderHero();
  });
});

// 间距归属切控
document.querySelectorAll("[data-owner]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.owner = btn.dataset.owner;
    renderHero();
  });
});

// 容器高度切控
document.querySelectorAll("[data-height]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.heightMode = btn.dataset.height;
    renderHero();
  });
});

// 末项推底切控
els.btnSplitLast.addEventListener("click", () => {
  state.splitLast = !state.splitLast;
  if (state.splitLast && state.heightMode === "fixed") state.heightMode = "auto";
  if (state.splitLast && !["gap", "owl"].includes(state.owner)) state.owner = "gap";
  renderHero();
});

// 多组正当解参考预设
document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state = createHealthyPreset(state.themeId, btn.dataset.preset);
    renderHero();
  });
});

// =========================================================================
// 01 节：三步维护动作对照器
// =========================================================================
const diffLeftTitle = document.getElementById("diff-left-title");
const diffRightTitle = document.getElementById("diff-right-title");
const diffLeftBox = document.getElementById("diff-left-box");
const diffRightBox = document.getElementById("diff-right-box");
const diffSummary = document.getElementById("diff-summary");

function renderMutationDiff(actionId) {
  const data = MUTATION_ACTIONS[actionId] || MUTATION_ACTIONS.baseline;
  diffLeftTitle.textContent = data.leftTitle;
  diffRightTitle.textContent = data.rightTitle;
  diffSummary.textContent = data.summary;

  diffLeftBox.innerHTML = `<div class="diff-stack-bad">${data.leftItems
    .map((it) => {
      const marginStyle = it.tailLeak ? "margin-bottom:0;" : `margin-bottom:${it.mb ? 14 : 0}px;`;
      return `
        <div class="diff-card" data-tone="${it.tone}" style="${marginStyle}">
          <span>${it.name}</span>
          ${it.crash ? `<span class="diff-crash-tag">0px 撞车</span>` : `<small>mb: ${it.mb}px</small>`}
        </div>
        ${it.tailLeak ? `<div class="diff-tail-leak">多余尾白 +20px（底边不齐）</div>` : ""}
      `;
    })
    .join("")}</div>`;

  diffRightBox.innerHTML = `<div class="diff-stack-clean">${data.rightItems
    .map(
      (it) => `<div class="diff-card" data-tone="${it.tone}"><span>${it.name}</span><small>margin: 0</small></div>`
    )
    .join("")}</div>`;

  document.querySelectorAll("[data-mut]").forEach((btn) => {
    const active = btn.dataset.mut === data.id;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
}

document.querySelectorAll("[data-mut]").forEach((btn) => {
  btn.addEventListener("click", () => renderMutationDiff(btn.dataset.mut));
});

// =========================================================================
// 02 节：双层嵌套堆栈滑尺 + 2D 剖面画布
// =========================================================================
const slOuter = document.getElementById("sl-outer");
const slInner = document.getElementById("sl-inner");
const outOuter = document.getElementById("out-outer");
const outInner = document.getElementById("out-inner");
const nestVerdict = document.getElementById("nest-verdict");
const nestTitle = document.getElementById("nest-title");
const nestRatio = document.getElementById("nest-ratio");
const nestDetail = document.getElementById("nest-detail");
const nestLiveCard = document.getElementById("nest-live-card");
const nestingCanvas = document.getElementById("nesting-canvas");

let nestState = { outer: 28, inner: 10 };
let nestEval = evaluateNesting(nestState.outer, nestState.inner);

const nestingCanvasApi = mountNestingCanvas(nestingCanvas, {
  getNesting: () => nestEval,
});

function renderNesting() {
  nestEval = evaluateNesting(nestState.outer, nestState.inner);
  slOuter.value = String(nestEval.outer);
  slInner.value = String(nestEval.inner);
  outOuter.textContent = `${nestEval.outer}px`;
  outInner.textContent = `${nestEval.inner}px`;
  nestVerdict.dataset.tone = nestEval.tone;
  nestTitle.textContent = nestEval.verdict;
  nestRatio.textContent = `${nestEval.ratio.toFixed(1)}×`;
  nestDetail.textContent = nestEval.detail;
  nestLiveCard.style.setProperty("--nest-outer", `${nestEval.outer}px`);
  nestLiveCard.style.setProperty("--nest-inner", `${nestEval.inner}px`);
  nestingCanvasApi.sync();
}

slOuter.addEventListener("input", () => {
  nestState.outer = Number(slOuter.value);
  renderNesting();
});
slInner.addEventListener("input", () => {
  nestState.inner = Number(slInner.value);
  renderNesting();
});
document.querySelectorAll("[data-nest]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const [o, i] = btn.dataset.nest.split(",").map(Number);
    nestState = { outer: o, inner: i };
    renderNesting();
  });
});

// =========================================================================
// 03 节：外边距塌陷暗室
// =========================================================================
const xrayTopLeak = document.getElementById("xray-top-leak");
const xrayBotLeak = document.getElementById("xray-bot-leak");
const xraySeam1 = document.getElementById("xray-seam-1");
const xraySeam2 = document.getElementById("xray-seam-2");
const xrayBadge = document.getElementById("xray-badge");
const xrayCode = document.getElementById("xray-code");
const xrayExplain = document.getElementById("xray-explain");

function renderCollapse(modeId) {
  const m = COLLAPSE_MODES[modeId] || COLLAPSE_MODES["block-margin"];
  const hasLeak = m.topLeak > 0;
  xrayTopLeak.classList.toggle("is-clean", !hasLeak);
  xrayTopLeak.textContent = hasLeak ? `父子塌陷顶漏：+${m.topLeak}px 穿透容器顶边` : "容器顶边：0px 零漏边";
  xrayBotLeak.classList.toggle("is-clean", !hasLeak);
  xrayBotLeak.textContent = hasLeak ? `父子塌陷底漏：+${m.bottomLeak}px 穿透容器底边` : "容器底边：0px 齐平收口";

  xraySeam1.classList.toggle("is-err", m.tone === "err");
  xraySeam1.style.minHeight = `${Math.max(26, m.seam1)}px`;
  xraySeam1.innerHTML = `<span>${m.seam1Formula}</span>`;

  xraySeam2.classList.toggle("is-err", m.tone === "err");
  xraySeam2.style.minHeight = `${Math.max(26, m.seam2)}px`;
  xraySeam2.innerHTML = `<span>${m.seam2Formula}</span>`;

  xrayBadge.dataset.tone = m.tone;
  xrayBadge.textContent = m.badge;
  xrayCode.textContent = m.code;
  xrayExplain.textContent = m.explain;

  document.querySelectorAll("[data-cmode]").forEach((btn) => {
    const active = btn.dataset.cmode === m.id;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });
}

document.querySelectorAll("[data-cmode]").forEach((btn) => {
  btn.addEventListener("click", () => renderCollapse(btn.dataset.cmode));
});

// =========================================================================
// 04 节：历史时间轴档案夹
// =========================================================================
const timelineRail = document.getElementById("timeline-rail");
const timelineDetail = document.getElementById("timeline-detail");

function renderTimeline(activeIdx = 3) {
  timelineRail.innerHTML = TIMELINE.map(
    (item, i) => `
      <button type="button" class="tl-btn ${i === activeIdx ? "is-active" : ""}" role="tab" aria-selected="${i === activeIdx}" data-tl="${i}">
        <span class="tl-year">${item.year}</span>
        <span class="tl-tag">${item.tag}</span>
      </button>
    `
  ).join("");

  const cur = TIMELINE[activeIdx];
  timelineDetail.innerHTML = `
    <span class="td-meta">${cur.year} · ${cur.who}</span>
    <h3>${cur.title}</h3>
    <p>${cur.body}</p>
  `;
}

timelineRail.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-tl]");
  if (!btn) return;
  renderTimeline(Number(btn.dataset.tl));
});

// =========================================================================
// 05 节：场景判定翻卡
// =========================================================================
const scenarioGrid = document.getElementById("scenario-grid");
const revealedScens = new Set();

function renderScenarios() {
  scenarioGrid.innerHTML = SCENARIOS.map((sc) => {
    const open = revealedScens.has(sc.id);
    return `
      <article class="scen-card">
        <div class="scen-head">
          <h3>${sc.title}</h3>
        </div>
        <p class="scen-clue">${sc.clue}</p>
        <button type="button" class="scen-toggle" data-scen="${sc.id}" aria-expanded="${open}">
          ${open ? "收起判断" : "翻开看该不该用堆栈"}
        </button>
        ${
          open
            ? `<div class="scen-answer">
                <span class="scen-verdict ${sc.useStack ? "is-yes" : "is-no"}">${sc.verdict}</span>
                <p>${sc.why} → <a class="inline-link" href="https://layout.xiaoxiaodong.ai/${sc.linkId}/play/">${sc.linkName}</a></p>
              </div>`
            : ""
        }
      </article>
    `;
  }).join("");
}

scenarioGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-scen]");
  if (!btn) return;
  const id = btn.dataset.scen;
  if (revealedScens.has(id)) revealedScens.delete(id);
  else revealedScens.add(id);
  renderScenarios();
});

// =========================================================================
// 06 节：单变量四选一小练习（中性标签 A/B/C/D）
// =========================================================================
const quizGrid = document.getElementById("quiz-grid");
const quizFeedback = document.getElementById("quiz-feedback");
let pickedQuiz = null;

function buildQuizMockHtml(p) {
  const sOuter = Math.round(p.outer * 0.68);
  const sInner = Math.round(p.inner * 0.68);
  if (p.mode === "nested") {
    return `
      <div class="quiz-mock-slot">
        <div class="quiz-mock" style="gap:${sOuter}px">
          <div style="display:flex;flex-direction:column;gap:${sInner}px">
            <div class="qm-title"></div>
            <div class="qm-line"></div>
            <div class="qm-line short"></div>
          </div>
          <div class="qm-btn"></div>
        </div>
      </div>
    `;
  }
  const pb = p.tail > 0 ? 14 + Math.round(p.tail * 0.72) : 14;
  return `
    <div class="quiz-mock-slot">
      <div class="quiz-mock" style="gap:${sOuter}px;padding-bottom:${pb}px">
        <div class="qm-title"></div>
        <div class="qm-line"></div>
        <div class="qm-line short"></div>
        <div class="qm-btn"></div>
      </div>
    </div>
  `;
}

function renderQuiz() {
  quizGrid.innerHTML = QUIZ_OPTIONS.map((opt) => {
    const picked = pickedQuiz === opt.id;
    const cls = picked ? (opt.correct ? "is-picked-ok" : "is-picked-err") : "";
    return `
      <button type="button" class="quiz-card ${cls}" data-quiz="${opt.id}" aria-pressed="${picked}">
        <div class="quiz-head">
          <span class="quiz-label">${opt.label}</span>
          <span class="quiz-meta">${opt.meta}</span>
        </div>
        ${buildQuizMockHtml(opt.preview)}
      </button>
    `;
  }).join("");

  if (!pickedQuiz) {
    quizFeedback.hidden = true;
    return;
  }
  const opt = QUIZ_OPTIONS.find((o) => o.id === pickedQuiz);
  quizFeedback.hidden = false;
  quizFeedback.dataset.ok = String(opt.correct);
  quizFeedback.innerHTML = `
    <strong>${opt.correct ? `选对了（${opt.label}）` : `再对比一下（你选了 ${opt.label}）`}</strong>
    <p>${opt.explain}</p>
  `;
}

quizGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-quiz]");
  if (!btn) return;
  pickedQuiz = btn.dataset.quiz;
  renderQuiz();
});

// =========================================================================
// 07 节：原海报灯箱（放大、缩小、拖拽、Esc 关闭，只复用 #poster 的 src）
// =========================================================================
const posterImg = document.getElementById("poster");
const openLbBtn = document.getElementById("open-lightbox");
const lb = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbViewport = document.getElementById("lb-viewport");
const lbScale = document.getElementById("lb-scale");
const lbIn = document.getElementById("lb-in");
const lbOut = document.getElementById("lb-out");
const lbReset = document.getElementById("lb-reset");
const lbClose = document.getElementById("lb-close");

let lbState = { scale: 1, x: 0, y: 0, dragging: false, sx: 0, sy: 0, ox: 0, oy: 0 };

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbState.x}px, ${lbState.y}px) scale(${lbState.scale})`;
  lbScale.textContent = `${Math.round(lbState.scale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbState = { scale: 1, x: 0, y: 0, dragging: false, sx: 0, sy: 0, ox: 0, oy: 0 };
  applyLbTransform();
  lb.hidden = false;
  lbClose.focus();
}

function closeLightbox() {
  lb.hidden = true;
  openLbBtn.focus();
}

openLbBtn.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbIn.addEventListener("click", () => {
  lbState.scale = Math.min(3, +(lbState.scale + 0.25).toFixed(2));
  applyLbTransform();
});
lbOut.addEventListener("click", () => {
  lbState.scale = Math.max(0.75, +(lbState.scale - 0.25).toFixed(2));
  applyLbTransform();
});
lbReset.addEventListener("click", () => {
  lbState.scale = 1;
  lbState.x = 0;
  lbState.y = 0;
  applyLbTransform();
});

lbViewport.addEventListener("pointerdown", (e) => {
  lbState.dragging = true;
  lbState.sx = e.clientX;
  lbState.sy = e.clientY;
  lbState.ox = lbState.x;
  lbState.oy = lbState.y;
  lbViewport.classList.add("is-dragging");
  try {
    lbViewport.setPointerCapture(e.pointerId);
  } catch {}
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbState.dragging) return;
  lbState.x = lbState.ox + (e.clientX - lbState.sx);
  lbState.y = lbState.oy + (e.clientY - lbState.sy);
  applyLbTransform();
});
const stopLbDrag = () => {
  lbState.dragging = false;
  lbViewport.classList.remove("is-dragging");
};
lbViewport.addEventListener("pointerup", stopLbDrag);
lbViewport.addEventListener("pointercancel", stopLbDrag);

lb.addEventListener("click", (e) => {
  if (e.target === lbViewport) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lb.hidden) closeLightbox();
});

// 初始化全部模块
renderHero();
renderMutationDiff("baseline");
renderNesting();
renderCollapse("block-margin");
renderTimeline(3);
renderScenarios();
renderQuiz();

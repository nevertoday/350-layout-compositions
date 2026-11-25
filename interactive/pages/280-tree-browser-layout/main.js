// 280 树形浏览布局 · 主控入口：活体知识库三栏树形浏览器 + 60fps 缩进标尺 + WAI-ARIA 键盘协议
import {
  NODE_META,
  createBrokenState,
  createPosterIdealState,
  createWideIdealState,
  evaluateState,
  getDisplayLabel,
} from "./model.js";
import { createIndentRuler, drawCascadeConnectors, updateTitleTwigSvg } from "./artwork.js";
import { initLabs } from "./labs.js";
import { loop } from "../../lib/stage.js";

function esc(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

const ICO = {
  root: `<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M3 9.5L10 3.5l7 6V17h-4.5v-4.5h-5V17H3z" fill="currentColor"/></svg>`,
  folder: `<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h4l1.5 1.5H16A1.5 1.5 0 0 1 17.5 7v7.5A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5z" fill="currentColor"/></svg>`,
  doc: `<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M5 3h7l3 3v11H5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.5 9.5h5M7.5 12.5h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  input: `<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><rect x="2.5" y="5.5" width="15" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6.5 8v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  bland: `<svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true"><circle cx="8" cy="8" r="3.5" fill="currentColor"/></svg>`,
};

// 初始化全局状态（开场刻意停在 0/4 翻车错态）
let state = createBrokenState();
let lastEval = evaluateState(state);

const els = {
  topChip: document.getElementById("top-score-chip"),
  titleTwig: document.getElementById("title-twig"),
  btnIdeal: document.getElementById("btn-ideal-poster"),
  btnBroken: document.getElementById("btn-reset-broken"),
  stage: document.getElementById("hero-stage"),
  linksSvg: document.getElementById("cascade-links"),
  treeWin: document.getElementById("tree-window"),
  crumb: document.getElementById("hero-crumb"),
  search: document.getElementById("hero-search"),
  rulerCanvas: document.getElementById("indent-ruler"),
  rulerReadout: document.getElementById("ruler-readout"),
  treeRoot: document.getElementById("hero-tree"),
  cascadeCol: document.getElementById("cascade-col"),
  c1: document.getElementById("cascade-card-1"),
  c2: document.getElementById("cascade-card-2"),
  c3: document.getElementById("cascade-card-3"),
  diagCard: document.getElementById("diag-card"),
  diagBadge: document.getElementById("diag-badge"),
  diagTitle: document.getElementById("diag-title"),
  diagBody: document.getElementById("diag-body"),
  diagAction: document.getElementById("diag-action"),
  statDepth: document.getElementById("stat-depth"),
  statIndent: document.getElementById("stat-indent"),
  statVisible: document.getElementById("stat-visible"),
  statScan: document.getElementById("stat-scan"),
  bpHierarchy: document.getElementById("bp-hierarchy"),
  bpDisclosure: document.getElementById("bp-disclosure"),
  bpSemantic: document.getElementById("bp-semantic"),
  bpFeedback: document.getElementById("bp-feedback"),
  bpAdaptive: document.getElementById("bp-adaptive"),
  bpTagHierarchy: document.getElementById("bp-tag-hierarchy"),
  bpTagDisclosure: document.getElementById("bp-tag-disclosure"),
  bpTagSemantic: document.getElementById("bp-tag-semantic"),
  bpTagFeedback: document.getElementById("bp-tag-feedback"),
  bpTagAdaptive: document.getElementById("bp-tag-adaptive"),
  ctrlBtns: [...document.querySelectorAll("[data-ctrl]")],
  spotBtns: [...document.querySelectorAll("[data-spot]")],
};

// 初始化 2D Canvas 缩进标尺（受 lib/stage.js loop 托管，自动按屏内可见与省电控制帧率）
const rulerCtrl = createIndentRuler(els.rulerCanvas);
const rulerLoop = loop(els.rulerCanvas, (t, dt, meta) => {
  rulerCtrl.render(lastEval, t, dt, meta);
});

function measurePaneWidth() {
  if (!els.treeWin) return;
  const w = Math.round(els.treeWin.getBoundingClientRect().width);
  if (w >= 240 && Math.abs(w - state.paneWidth) > 4) {
    state.paneWidth = w;
  }
}

function isSpotMatch(row, spot) {
  if (!spot) return false;
  if (spot === "root") return row.depth === 1;
  if (spot === "branch") return row.depth > 1 && row.hasChildren;
  if (spot === "node") return !row.hasChildren;
  if (spot === "expand") return row.hasChildren;
  if (spot === "category") return row.depth === 2;
  return false;
}

// 渲染面包屑、树节点、中栏级联三卡、右栏单真源诊单与底沿五柱实检
function renderAll(focusSelected = false) {
  measurePaneWidth();
  document.documentElement.style.setProperty("--indent-px", `${state.indentPx}px`);
  lastEval = evaluateState(state);
  const ev = lastEval;

  // 1. 顶眉胶囊 & 标题旁活体树枝徽
  els.topChip.textContent = ev.allOk ? "4 / 4 秩序就位" : `${ev.passedCount} / 4 待理树`;
  els.topChip.classList.toggle("is-ok", ev.allOk);
  els.topChip.classList.toggle("is-err", !ev.allOk);
  updateTitleTwigSvg(els.titleTwig, ev);

  // 2. 窗顶面包屑
  const isBlind = state.feedbackMode === "blind";
  els.crumb.classList.toggle("is-blind", isBlind);
  if (isBlind) {
    els.crumb.innerHTML = `<span class="crumb-sep">面包屑已隐藏（盲态）</span>`;
  } else {
    els.crumb.innerHTML = ev.breadcrumb
      .map(
        (b, i) =>
          `${i > 0 ? `<span class="crumb-sep" aria-hidden="true">/</span>` : ""}<button type="button" class="crumb-btn" data-crumb-id="${b.id}">${esc(b.label)}</button>`
      )
      .join("");
  }

  // 3. 缩进标尺读数与 ARIA
  els.rulerReadout.textContent = `缩进 ${state.indentPx}px · 深度 ${ev.metrics.maxDepth} 层${ev.metrics.clippedCount ? ` · 截字 ${ev.metrics.clippedCount} 处` : ""}`;
  els.rulerCanvas.setAttribute("aria-valuenow", String(state.indentPx));

  // 4. 真实 WAI-ARIA 知识库目录树
  els.treeRoot.className = `tree-root fb-${state.feedbackMode}`;
  const showIcons = state.namingMode === "clear" || state.namingMode === "verbose";
  const showCounts = state.namingMode !== "cryptic";

  els.treeRoot.innerHTML = ev.visible
    .map((row) => {
      const lbl = getDisplayLabel(row.meta, state.namingMode);
      const isSel = row.id === ev.selected.id;
      const isClip = ev.clippedIds.has(row.id);
      const isSpot = isSpotMatch(row, state.spotlightPart);
      const depthStep = row.depth - 1;

      // 纵横引导线：完全依赖 CSS 变量 --indent-px，拖动标尺时 0 DOM 重建丝滑平移
      let guidesHtml = "";
      if (row.depth > 1) {
        for (let k = 0; k < row.depth - 2; k++) {
          if (row.guides[k]) {
            guidesHtml += `<span class="guide-v" style="left:calc(22px + ${k} * var(--indent-px))"></span>`;
          }
        }
        guidesHtml += `<span class="guide-elbow" style="left:calc(22px + ${row.depth - 2} * var(--indent-px));width:max(8px,calc(var(--indent-px) - 8px))"></span>`;
      }

      const icoCls = showIcons ? `is-${row.meta.kind}` : "is-bland";
      const icoHtml = showIcons ? ICO[row.meta.kind] || ICO.doc : ICO.bland;
      const toggleHtml = row.hasChildren
        ? `<button type="button" class="tree-toggle" data-toggle-id="${row.id}" aria-label="${row.isExpanded ? "收起" : "展开"} ${esc(lbl.zh)}" tabindex="-1">${row.isExpanded ? "−" : "+"}</button>`
        : `<span class="tree-toggle is-spacer" aria-hidden="true"></span>`;

      const promoteHtml = row.meta.redundant
        ? `<button type="button" class="node-promote" data-promote-id="${row.id}" title="合并此冗余空壳，提升下级目录层级">↑ 提级</button>`
        : "";

      return `
        <div class="tree-row${isSel ? " is-selected" : ""}${row.meta.redundant ? " is-redundant" : ""}${isClip ? " is-clipped" : ""}${row.matched ? " is-matched" : ""}${isSpot ? " is-spot" : ""}"
          role="treeitem"
          data-node-id="${row.id}"
          data-depth="${row.depth}"
          tabindex="${isSel ? "0" : "-1"}"
          aria-level="${row.depth}"
          aria-setsize="${row.setSize}"
          aria-posinset="${row.posInSet}"
          ${row.hasChildren ? `aria-expanded="${row.isExpanded}"` : ""}
          aria-selected="${isSel}"
          style="--depth-step:${depthStep}">
          <span class="tree-guides" aria-hidden="true">${guidesHtml}</span>
          ${toggleHtml}
          <button type="button" class="tree-node-btn" data-select-id="${row.id}" tabindex="-1">
            <span class="node-ico ${icoCls}">${icoHtml}</span>
            <span class="node-text">
              <span class="node-zh">${esc(lbl.zh)}</span>
              <span class="node-en" lang="en">${esc(lbl.en)}</span>
            </span>
          </button>
          ${promoteHtml}
          ${showCounts && !row.meta.redundant ? `<span class="node-count">${row.meta.count}</span>` : ""}
        </div>
      `;
    })
    .join("");

  if (focusSelected) {
    els.treeRoot.querySelector(`[data-node-id="${ev.selected.id}"]`)?.focus({ preventScroll: true });
  }

  // 5. 中栏三级联详情卡
  renderCascadeCards(ev);

  // 6. 右栏单真源诊单 & 读数
  updateDiagnosisAndControls(ev);

  // 7. 重绘 Canvas 标尺与跨栏肘形连线
  rulerLoop.draw();
  requestAnimationFrame(() => drawCascadeConnectors(els.linksSvg, els.stage, els.treeWin, els.cascadeCol, lastEval));
}

function renderCascadeCards(ev) {
  const { card1, card2, card3 } = ev.cascade;
  els.c1.innerHTML = `
    <div class="cascade-card-head">
      <span class="cc-ico">${ICO.folder}</span>
      <h3 class="cc-title">${esc(card1.title)}<span class="cc-en" lang="en">/ ${esc(card1.en)}</span></h3>
    </div>
    <p class="cc-desc">${esc(card1.desc)}</p>
    <ul class="cc-list">
      ${card1.items
        .map(
          (it) => `
        <li>
          <button type="button" class="cc-row-btn${it.active ? " is-active" : ""}" data-cascade-jump="${it.id}">
            <span>${esc(it.label)}</span>
            <span class="cc-cnt">${it.count} 项</span>
          </button>
        </li>`
        )
        .join("")}
    </ul>
    <p class="cc-foot">${esc(card1.footer)}</p>
  `;

  if (card2) {
    els.c2.hidden = false;
    els.c2.innerHTML = `
      <div class="cascade-card-head">
        <span class="cc-ico is-doc">${ICO.doc}</span>
        <h3 class="cc-title">${esc(card2.title)}<span class="cc-en" lang="en">/ ${esc(card2.en)}</span></h3>
      </div>
      <p class="cc-desc">${esc(card2.desc)}</p>
      <ul class="cc-list">
        ${card2.items
          .map(
            (it) => `
          <li class="cc-row-static${it.active ? " is-active" : ""}">
            <span>• ${esc(it.label)}</span>
            <span class="cc-cnt">${it.count} 项</span>
          </li>`
          )
          .join("")}
      </ul>
      <p class="cc-foot">${esc(card2.footer)}</p>
    `;
  } else {
    els.c2.hidden = true;
  }

  els.c3.innerHTML = `
    <div class="cascade-card-head">
      <span class="cc-ico is-doc">${ICO.input}</span>
      <h3 class="cc-title">${esc(card3.title)}<span class="cc-en" lang="en">/ ${esc(card3.en)}</span></h3>
    </div>
    <p class="cc-desc">${esc(card3.desc)}</p>
    <div class="cc-tags">${card3.tags.map((t) => `<span class="cc-tag">${esc(t)}</span>`).join("")}</div>
    <p class="cc-foot">${esc(card3.footer)}</p>
  `;
}

function updateDiagnosisAndControls(ev) {
  els.diagCard.classList.toggle("is-ok", ev.diagnosis.ok);
  els.diagBadge.classList.toggle("is-ok", ev.diagnosis.ok);
  els.diagBadge.textContent = ev.diagnosis.badge;
  els.diagTitle.textContent = ev.diagnosis.title;
  els.diagBody.textContent = ev.diagnosis.body;
  els.diagAction.textContent = ev.diagnosis.action;

  els.statDepth.textContent = `${ev.metrics.maxDepth} 层`;
  els.statIndent.textContent = `${ev.metrics.indentPx}px`;
  els.statVisible.textContent = `${ev.metrics.visibleCount}/${ev.metrics.totalCount}`;
  els.statScan.textContent = ev.metrics.scanTier;

  // 五柱原则带实时联动
  const syncBp = (wrapEl, tagEl, chk) => {
    wrapEl?.classList.toggle("is-ok", chk.ok);
    if (tagEl) tagEl.textContent = chk.tag;
  };
  syncBp(els.bpHierarchy, els.bpTagHierarchy, ev.checks.hierarchy);
  syncBp(els.bpDisclosure, els.bpTagDisclosure, ev.checks.disclosure);
  syncBp(els.bpSemantic, els.bpTagSemantic, ev.checks.semantic);
  syncBp(els.bpFeedback, els.bpTagFeedback, ev.checks.feedback);
  syncBp(els.bpAdaptive, els.bpTagAdaptive, ev.checks.adaptive);

  // 同步四组控参按钮激活态
  const expandPreset =
    !state.expandedIds.has("root")
      ? "none"
      : ev.metrics.visibleCount >= 12 || ev.metrics.openBranchCount >= 4
        ? "all"
        : "focus";

  els.ctrlBtns.forEach((b) => {
    const grp = b.dataset.ctrl;
    const val = b.dataset.val;
    let active = false;
    let wrong = false;
    if (grp === "depth") {
      active = state.depthMode === val || (state.depthMode === "nested5" && val === "nested6");
      wrong = val === "nested6" || val === "flat1";
    } else if (grp === "expand") {
      active = expandPreset === val;
      wrong = val === "all" || val === "none";
    } else if (grp === "naming") {
      active = state.namingMode === val;
      wrong = val !== "clear";
    } else if (grp === "feedback") {
      active = state.feedbackMode === val;
      wrong = val !== "clear";
    }
    b.classList.toggle("is-active", active);
    b.classList.toggle("is-wrong-choice", active && wrong);
    b.setAttribute("aria-pressed", String(active));
  });

  // 同步结构要素高亮按钮
  els.spotBtns.forEach((b) => {
    b.setAttribute("aria-pressed", String(state.spotlightPart === b.dataset.spot));
  });
}

// ============================================================
// 高频 60fps 缩进拖动快路径（只更新 CSS 变量与 Canvas 标尺，零整树 DOM 重建！）
// ============================================================
function updateIndentFast(newPx) {
  const clamped = Math.max(4, Math.min(40, Math.round(newPx)));
  const changed = clamped !== state.indentPx;
  state.indentPx = clamped;
  document.documentElement.style.setProperty("--indent-px", `${clamped}px`);
  els.rulerCanvas.setAttribute("aria-valuenow", String(clamped));

  if (changed) {
    lastEval = evaluateState(state);
    els.rulerReadout.textContent = `缩进 ${clamped}px · 深度 ${lastEval.metrics.maxDepth} 层${lastEval.metrics.clippedCount ? ` · 截字 ${lastEval.metrics.clippedCount} 处` : ""}`;
    els.topChip.textContent = lastEval.allOk ? "4 / 4 秩序就位" : `${lastEval.passedCount} / 4 待理树`;
    els.topChip.classList.toggle("is-ok", lastEval.allOk);
    els.topChip.classList.toggle("is-err", !lastEval.allOk);
    // 仅同步截字标记类，不重建树 DOM
    els.treeRoot.querySelectorAll("[data-node-id]").forEach((rowEl) => {
      rowEl.classList.toggle("is-clipped", lastEval.clippedIds.has(rowEl.dataset.nodeId));
    });
    updateDiagnosisAndControls(lastEval);
    updateTitleTwigSvg(els.titleTwig, lastEval);
  }
  rulerLoop.draw();
}

// 绑定 Canvas 标尺拖拽（兼容桌面 Pointer、移动端 Touch 及 tools/perf.mjs 的 60Hz TouchMove）
let rulerDragging = false;
els.rulerCanvas.addEventListener("pointerdown", (e) => {
  rulerDragging = true;
  els.rulerCanvas.setPointerCapture?.(e.pointerId);
  updateIndentFast(rulerCtrl.xToValue(e.clientX));
});
els.rulerCanvas.addEventListener("pointermove", (e) => {
  if (!rulerDragging) return;
  updateIndentFast(rulerCtrl.xToValue(e.clientX));
});
els.rulerCanvas.addEventListener("pointerup", () => {
  if (!rulerDragging) return;
  rulerDragging = false;
  drawCascadeConnectors(els.linksSvg, els.stage, els.treeWin, els.cascadeCol, lastEval);
});
els.rulerCanvas.addEventListener("pointercancel", () => {
  rulerDragging = false;
});
// 额外显式监听 touchmove，保证合成 touch 事件在任意移动模拟器下都能稳定驱动重绘
els.rulerCanvas.addEventListener(
  "touchstart",
  (e) => {
    if (!e.touches.length) return;
    rulerDragging = true;
    updateIndentFast(rulerCtrl.xToValue(e.touches[0].clientX));
  },
  { passive: true }
);
els.rulerCanvas.addEventListener(
  "touchmove",
  (e) => {
    if (!rulerDragging || !e.touches.length) return;
    updateIndentFast(rulerCtrl.xToValue(e.touches[0].clientX));
  },
  { passive: true }
);
els.rulerCanvas.addEventListener("touchend", () => {
  rulerDragging = false;
});
els.rulerCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    updateIndentFast(state.indentPx - 2);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    updateIndentFast(state.indentPx + 2);
  } else if (e.key === "Home") {
    e.preventDefault();
    updateIndentFast(4);
  } else if (e.key === "End") {
    e.preventDefault();
    updateIndentFast(40);
  }
});

// ============================================================
// 树节点点击、展开、提级去套娃与 WAI-ARIA 键盘协议
// ============================================================
els.treeRoot.addEventListener("click", (e) => {
  const promoteBtn = e.target.closest("[data-promote-id]");
  if (promoteBtn) {
    // 逐步消除单子冗余空壳：6层 → 5层 → 4层原海报
    if (state.depthMode === "nested6") state.depthMode = "nested5";
    else if (state.depthMode === "nested5") state.depthMode = "poster4";
    state.selectedId = "components";
    renderAll(false);
    return;
  }

  const toggleBtn = e.target.closest("[data-toggle-id]");
  if (toggleBtn) {
    const id = toggleBtn.dataset.toggleId;
    if (state.expandedIds.has(id)) state.expandedIds.delete(id);
    else state.expandedIds.add(id);
    state.selectedId = id;
    renderAll(false);
    return;
  }

  const selBtn = e.target.closest("[data-select-id]");
  if (selBtn) {
    const id = selBtn.dataset.selectId;
    const node = lastEval.byId.get(id);
    if (state.selectedId === id && node?.hasChildren) {
      if (state.expandedIds.has(id)) state.expandedIds.delete(id);
      else state.expandedIds.add(id);
    } else {
      state.selectedId = id;
    }
    renderAll(true);
  }
});

els.treeRoot.addEventListener("keydown", (e) => {
  const keys = ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End", "*"];
  if (!keys.includes(e.key)) return;
  e.preventDefault();

  const vis = lastEval.visible;
  const idx = vis.findIndex((v) => v.id === lastEval.selected.id);
  const cur = vis[idx] || vis[0];

  if (e.key === "ArrowDown" && idx < vis.length - 1) {
    state.selectedId = vis[idx + 1].id;
  } else if (e.key === "ArrowUp" && idx > 0) {
    state.selectedId = vis[idx - 1].id;
  } else if (e.key === "ArrowRight") {
    if (cur.hasChildren && !cur.isExpanded) state.expandedIds.add(cur.id);
    else if (cur.hasChildren && cur.isExpanded) state.selectedId = cur.childrenIds[0];
  } else if (e.key === "ArrowLeft") {
    if (cur.hasChildren && cur.isExpanded) state.expandedIds.delete(cur.id);
    else if (cur.parentId) state.selectedId = cur.parentId;
  } else if (e.key === "Home") {
    state.selectedId = vis[0].id;
  } else if (e.key === "End") {
    state.selectedId = vis[vis.length - 1].id;
  } else if (e.key === "*") {
    const parent = cur.parentId ? lastEval.byId.get(cur.parentId) : null;
    const sibs = parent ? parent.childrenIds : ["root"];
    sibs.forEach((sid) => {
      if (lastEval.byId.get(sid)?.hasChildren) state.expandedIds.add(sid);
    });
  }
  renderAll(true);
});

// 面包屑点击跳回上级
els.crumb.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-crumb-id]");
  if (!btn) return;
  state.selectedId = btn.dataset.crumbId;
  state.expandedIds.add(state.selectedId);
  renderAll(false);
});

// 顶部搜索实时筛选（保留祖先路径）
els.search.addEventListener("input", () => {
  state.searchQuery = els.search.value;
  renderAll(false);
});

// 中栏级联卡片点击子项反选左树
els.cascadeCol.addEventListener("click", (e) => {
  const jump = e.target.closest("[data-cascade-jump]");
  if (!jump) return;
  const id = jump.dataset.cascadeJump;
  if (lastEval.byId.has(id)) {
    state.selectedId = id;
    lastEval.byId.get(id).ancestors.forEach((aid) => state.expandedIds.add(aid));
    renderAll(false);
  }
});

// 四维控参按钮
els.ctrlBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const grp = btn.dataset.ctrl;
    const val = btn.dataset.val;
    if (grp === "depth") {
      state.depthMode = val;
      if (val === "wide3") {
        state.expandedIds = new Set(["root", "components"]);
        state.selectedId = "components";
      } else if (val === "poster4") {
        if (!state.expandedIds.has("root")) state.expandedIds.add("root");
        state.expandedIds.add("design");
        state.expandedIds.add("components");
        state.selectedId = "components";
      } else if (val === "flat1") {
        state.expandedIds = new Set(["root"]);
        state.selectedId = "form";
      } else if (val === "nested6") {
        state.expandedIds.add("root");
        state.expandedIds.add("design");
        state.expandedIds.add("wrap1");
        state.expandedIds.add("wrap2");
        state.expandedIds.add("components");
      }
    } else if (grp === "expand") {
      if (val === "all") {
        const allB = new Set();
        lastEval.allNodes.forEach((n) => {
          if (n.hasChildren) allB.add(n.id);
        });
        state.expandedIds = allB;
      } else if (val === "none") {
        state.expandedIds = new Set();
        state.selectedId = "root";
      } else {
        // 按需展开：仅展开到当前核心分支（组件库），收起开发/运营/项目
        const keep = new Set(["root"]);
        const target = lastEval.byId.get("components") || lastEval.selected;
        target.ancestors.forEach((a) => keep.add(a));
        if (target.hasChildren) keep.add(target.id);
        state.expandedIds = keep;
      }
    } else if (grp === "naming") {
      state.namingMode = val;
    } else if (grp === "feedback") {
      state.feedbackMode = val;
    }
    renderAll(false);
  });
});

// 结构要素五项点按反查高亮左树
els.spotBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const part = btn.dataset.spot;
    state.spotlightPart = state.spotlightPart === part ? null : part;
    renderAll(false);
  });
});

// 顶部一键按钮（载入原海报解 / 复原 0/4 错态）
els.btnIdeal.addEventListener("click", () => {
  state = createPosterIdealState(state.paneWidth);
  els.search.value = "";
  renderAll(false);
});

els.btnBroken.addEventListener("click", () => {
  state = createBrokenState();
  state.paneWidth = Math.round(els.treeWin?.getBoundingClientRect().width || 440);
  els.search.value = "";
  renderAll(false);
});

// 监听窗口尺寸变化重测树窗宽度与跨栏肘形连线
if (typeof ResizeObserver !== "undefined" && els.treeWin) {
  new ResizeObserver(() => {
    const w = Math.round(els.treeWin.getBoundingClientRect().width);
    if (w >= 240 && Math.abs(w - state.paneWidth) > 8) {
      state.paneWidth = w;
      lastEval = evaluateState(state);
      updateDiagnosisAndControls(lastEval);
    }
    rulerLoop.draw();
    drawCascadeConnectors(els.linksSvg, els.stage, els.treeWin, els.cascadeCol, lastEval);
  }).observe(els.treeWin);
}

els.treeWin?.querySelector(".tree-scroll")?.addEventListener("scroll", () => {
  drawCascadeConnectors(els.linksSvg, els.stage, els.treeWin, els.cascadeCol, lastEval);
});

// 启动开场与全部正文实验
renderAll(false);
initLabs();

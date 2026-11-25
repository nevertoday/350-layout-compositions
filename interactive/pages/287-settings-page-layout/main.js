// 287 设置页面布局 · 完整交互与单真源控制器（main.js）
import {
  ALIGN_LABELS_BY_SCENARIO,
  CONTROL_TASKS,
  DENSITY_SPECS,
  ERAS,
  FIND_FLAT_ORDER,
  FIND_LAB_ITEMS,
  FIND_TARGETS,
  LAYOUT_MODES_BY_SCENARIO,
  QUIZ_OPTIONS,
  SCENARIOS,
  SIDEBAR_NAV,
  TOGGLES_BY_SCENARIO,
  createInitialState,
  diagnose,
} from "./model.js";
import { createCommitTimeline, createHeroPreview, createSpacingBlueprint } from "./preview.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// =========================================================================
// 1. HERO · 活体三栏设置应用诊修台
// =========================================================================
const state = createInitialState("layout");

const els = {
  scorePill: $("#heroScorePill"),
  titleSwitch: $("#titleSwitchBadge"),
  diagCard: $("#heroDiagCard"),
  diagBadge: $("#diagBadge"),
  diagTitle: $("#diagTitle"),
  diagBody: $("#diagBody"),
  diagNext: $("#diagNext"),
  mGroups: $("#mGroups"),
  mMismatch: $("#mMismatch"),
  mRatio: $("#mRatio"),
  mHick: $("#mHick"),
  mobileDiagStrip: $("#mobileDiagStrip"),
  mobileDiagBadge: $("#mobileDiagBadge"),
  mobileDiagText: $("#mobileDiagText"),
  coGroupState: $("#coGroupState"),
  coHierState: $("#coHierState"),
  coFbState: $("#coFbState"),
  coSpaceState: $("#coSpaceState"),
  appWindow: $("#appWindow"),
  sbNavList: $("#sbNavList"),
  navSearchInput: $("#navSearchInput"),
  btnResetAll: $("#btnResetAll"),
  paneTitle: $("#paneTitle"),
  paneSub: $("#paneSub"),
  controlsFlow: $("#controlsFlow"),
  pvTitle: $("#pvTitle"),
  pvHint: $("#pvHint"),
  pvCanvas: $("#heroPreviewCanvas"),
  infoMode: $("#infoMode"),
  infoMainLbl: $("#infoMainLbl"),
  infoSideLbl: $("#infoSideLbl"),
  infoMainW: $("#infoMainW"),
  infoSideW: $("#infoSideW"),
  infoDensity: $("#infoDensity"),
  infoDirty: $("#infoDirty"),
  toastStack: $("#toastStack"),
  blockerBox: $("#blockerBox"),
  blockerMsg: $("#blockerMsg"),
  btnBlockConfirm: $("#btnBlockConfirm"),
  btnBlockCancel: $("#btnBlockCancel"),
  btnSave: $("#btnSave"),
  btnCancel: $("#btnCancel"),
};

let pendingAction = null;

function navIconSvg(kind) {
  const paths = {
    gear: '<path fill="currentColor" d="M10 6.8a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zm7.4 3.9l-1.3-.9c.1-.5.1-1.1 0-1.6l1.3-.9-1.2-2.1-1.5.4c-.4-.4-.9-.7-1.4-.9L12.8 3h-2.4l-.5 1.7c-.5.2-1 .5-1.4.9L7 5.2 5.8 7.3l1.3.9c-.1.5-.1 1.1 0 1.6l-1.3.9 1.2 2.1 1.5-.4c.4.4.9.7 1.4.9l.5 1.7h2.4l.5-1.7c.5-.2 1-.5 1.4-.9l1.5.4 1.2-2.1z"/>',
    grid: '<rect x="3" y="3" width="6" height="6" rx="1" fill="currentColor"/><rect x="11" y="3" width="6" height="6" rx="1" fill="currentColor"/><rect x="3" y="11" width="6" height="6" rx="1" fill="currentColor"/><rect x="11" y="11" width="6" height="6" rx="1" fill="currentColor"/>',
    palette: '<circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="7.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="12" cy="8" r="1.3" fill="currentColor"/><circle cx="12.5" cy="12" r="1.3" fill="currentColor"/>',
    type: '<path fill="currentColor" d="M4 5h12v2.2h-4.8V16H8.8V7.2H4V5z"/>',
    pointer: '<path fill="currentColor" d="M5 3l10 6.5-4.3 1.2L9.5 15 5 3z"/>',
    sync: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M4.5 10a5.5 5.5 0 019.6-3.6M15.5 10a5.5 5.5 0 01-9.6 3.6"/>',
    info: '<circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="currentColor" d="M9.1 8.8h1.8V14H9.1V8.8zm0-3h1.8v1.8H9.1V5.8z"/>',
  };
  return `<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">${paths[kind] || paths.gear}</svg>`;
}

function modeIconSvg(id) {
  if (id === "single") return '<svg viewBox="0 0 36 28" width="34" height="26" aria-hidden="true"><rect x="7" y="3" width="22" height="22" rx="2" fill="#8B969D"/></svg>';
  if (id === "dual") return '<svg viewBox="0 0 36 28" width="34" height="26" aria-hidden="true"><rect x="4" y="3" width="8" height="22" rx="1.5" fill="#9AA5AC"/><rect x="14" y="3" width="18" height="22" rx="1.5" fill="#6F7C84"/></svg>';
  if (id === "triple") return '<svg viewBox="0 0 36 28" width="34" height="26" aria-hidden="true"><rect x="3" y="3" width="7" height="22" rx="1.5" fill="#9AA5AC"/><rect x="12" y="3" width="12" height="22" rx="1.5" fill="#6F7C84"/><rect x="26" y="3" width="7" height="22" rx="1.5" fill="#9AA5AC"/></svg>';
  return '<svg viewBox="0 0 36 28" width="34" height="26" aria-hidden="true"><rect x="4" y="4" width="28" height="20" rx="2" fill="none" stroke="#8B969D" stroke-width="1.8" stroke-dasharray="4 3"/></svg>';
}

// 拦阻演示辅助：当 feedback === "blocking-modal" 时，每次改值先拦截一次！
function applySettingChange(label, fn) {
  if (state.feedback === "blocking-modal") {
    pendingAction = fn;
    state.pendingBlockMsg = `确认框打断：你刚刚调整了「${label}」，是否确认应用？`;
    els.blockerMsg.textContent = state.pendingBlockMsg;
    els.blockerBox.hidden = false;
    updateDiagnosisAndPreview();
    return;
  }
  els.blockerBox.hidden = true;
  pendingAction = null;
  fn();
  state.lastEvent = "edited";
  renderHeroControls();
  updateDiagnosisAndPreview();
}

function renderSidebarNav() {
  const q = state.navQuery.trim().toLowerCase();
  const list = SIDEBAR_NAV.filter((item) => !q || item.label.includes(q) || item.desc.includes(q));
  els.sbNavList.innerHTML = list.length
    ? list
        .map(
          (item) => `
      <li>
        <button type="button" class="sb-nav-btn${item.id === state.activeNav ? " is-active" : ""}" data-nav-id="${item.id}">
          ${navIconSvg(item.icon)}
          <span>${item.label}</span>
        </button>
      </li>`
        )
        .join("")
    : `<li style="padding:10px 14px;font-size:12px;color:#A6B7C1">无匹配分类</li>`;
}

// 渲染中间设置面板（按 grouping / hierarchy / density / scenario 实时重构）
function renderHeroControls() {
  const sc = SCENARIOS[state.scenario];
  const modes = LAYOUT_MODES_BY_SCENARIO[state.scenario];
  const toggles = TOGGLES_BY_SCENARIO[state.scenario];
  const alignMeta = ALIGN_LABELS_BY_SCENARIO[state.scenario];
  const vals = state.values;
  const sidePct = 100 - Math.round(vals.mainWidth);
  const fragCls = state.grouping === "overfragmented" ? " is-frag" : "";

  els.paneTitle.textContent = sc.paneTitle;
  els.paneSub.textContent = sc.paneSub;
  els.pvTitle.textContent = sc.previewTitle;
  els.pvHint.textContent = sc.dragHint;
  els.infoMainLbl.textContent = state.scenario === "layout" ? "主内容区宽度" : state.scenario === "notify" ? "活跃提醒占比" : "私有保护占比";
  els.infoSideLbl.textContent = sc.dragLabel;

  // 1. 布局模式组（根据 hierarchy 切：图标卡 / 错配复选框 / 全员下拉框）
  let modeHtml = "";
  if (state.hierarchy === "mismatched") {
    modeHtml = `
      <div class="mismatch-checks" role="group" aria-label="错配的复选框模式">
        ${modes
          .map(
            (m) => `
          <label class="mc-item">
            <input type="checkbox" data-mode-pick="${m.id}" ${vals.layoutMode === m.id ? "checked" : ""}>
            <span>${m.label}（错用多选框）</span>
          </label>`
          )
          .join("")}
      </div>`;
  } else if (state.hierarchy === "all-dropdown") {
    modeHtml = `
      <div class="ctrl-row${fragCls}">
        <span class="cr-label">结构模式</span>
        <select class="ui-select" data-select-key="layoutMode" aria-label="选择布局模式">
          ${modes.map((m) => `<option value="${m.id}" ${vals.layoutMode === m.id ? "selected" : ""}>${m.label} — ${m.hint}</option>`).join("")}
        </select>
      </div>`;
  } else {
    modeHtml = `
      <div class="mode-tiles" role="radiogroup" aria-label="选择布局模式">
        ${modes
          .map(
            (m) => `
          <button type="button" class="mode-tile${vals.layoutMode === m.id ? " is-active" : ""}" role="radio" aria-checked="${vals.layoutMode === m.id}" data-mode-pick="${m.id}">
            ${modeIconSvg(m.id)}
            <span>${m.label}</span>
            <span class="mt-check" aria-hidden="true">✓</span>
          </button>`
          )
          .join("")}
      </div>`;
  }

  const groupMode = `
    <section class="ctrl-group" data-group-id="mode">
      <h4 class="cg-title">${state.scenario === "layout" ? "布局模式" : state.scenario === "notify" ? "提醒策略" : "可见范围"}</h4>
      ${modeHtml}
    </section>`;

  // 2. 内容区域宽度滑块组
  const groupArea = `
    <section class="ctrl-group" data-group-id="area">
      <h4 class="cg-title">${state.scenario === "layout" ? "内容区域设置" : state.scenario === "notify" ? "时段占比分配" : "公开与私有比例"}</h4>
      <div class="ctrl-row${fragCls}">
        <label class="cr-label" for="mainWidthRange">${els.infoMainLbl.textContent}</label>
        <div class="cr-slider-wrap">
          <input type="range" id="mainWidthRange" class="cr-range" min="50" max="88" value="${Math.round(vals.mainWidth)}">
          <span class="cr-num-badge mono" id="mainWidthVal">${Math.round(vals.mainWidth)}%</span>
        </div>
      </div>
      <div class="ctrl-row${fragCls}">
        <label class="cr-label" for="sideWidthRange">${sc.dragLabel}</label>
        <div class="cr-slider-wrap">
          <input type="range" id="sideWidthRange" class="cr-range" min="12" max="50" value="${sidePct}">
          <span class="cr-num-badge mono" id="sideWidthVal">${sidePct}%</span>
        </div>
      </div>
      <div class="ctrl-row${fragCls}">
        <label class="cr-label" for="maxWidthRange">内容最大宽度</label>
        <div class="cr-slider-wrap">
          <input type="range" id="maxWidthRange" class="cr-range" min="960" max="1600" step="40" value="${vals.maxWidth}">
          <span class="cr-num-badge mono" id="maxWidthVal">${vals.maxWidth}px</span>
        </div>
      </div>
    </section>`;

  // 3. 模块显示控制（左 3 开关 + 右 3 复选框）
  const groupModules = `
    <section class="ctrl-group" data-group-id="modules">
      <h4 class="cg-title">${state.scenario === "layout" ? "模块显示控制" : state.scenario === "notify" ? "推送渠道开关" : "安全防护项"}</h4>
      <div class="toggles-grid">
        ${toggles
          .map((item) => {
            const on = !!vals[item.key];
            if (state.hierarchy === "all-dropdown") {
              return `
                <div class="toggle-item${fragCls}">
                  <span>${item.label}</span>
                  <select class="ui-select" data-bool-select="${item.key}" aria-label="${item.label}">
                    <option value="true" ${on ? "selected" : ""}>开启</option>
                    <option value="false" ${!on ? "selected" : ""}>关闭</option>
                  </select>
                </div>`;
            }
            const btn =
              item.kind === "switch"
                ? `<button type="button" class="sw-btn" role="switch" aria-checked="${on}" aria-label="${item.label}" data-toggle-key="${item.key}"><span></span></button>`
                : `<button type="button" class="chk-btn" role="checkbox" aria-checked="${on}" aria-label="${item.label}" data-toggle-key="${item.key}">✓</button>`;
            return `<div class="toggle-item${fragCls}"><span>${item.label}</span>${btn}</div>`;
          })
          .join("")}
      </div>
    </section>`;

  // 4. 间距与对齐
  const alignCtrl =
    state.hierarchy === "all-dropdown"
      ? `<select class="ui-select" data-select-key="align" aria-label="${alignMeta.title}">
          ${alignMeta.items.map(([id, lb]) => `<option value="${id}" ${vals.align === id ? "selected" : ""}>${lb}</option>`).join("")}
        </select>`
      : `<div class="seg-inline" role="group" aria-label="${alignMeta.title}">
          ${alignMeta.items.map(([id, lb]) => `<button type="button" class="${vals.align === id ? "is-active" : ""}" data-align-pick="${id}">${lb}</button>`).join("")}
        </div>`;

  const densSegCtrl =
    state.hierarchy === "all-dropdown"
      ? `<select class="ui-select" data-density-select aria-label="模块间距密度">
          ${["compact", "standard", "loose"].map((id) => `<option value="${id}" ${state.density === id ? "selected" : ""}>${DENSITY_SPECS[id].label}</option>`).join("")}
        </select>`
      : `<div class="seg-inline" role="group" aria-label="模块间距密度">
          ${["compact", "standard", "loose"]
            .map((id) => `<button type="button" class="${state.density === id ? "is-active" : ""}" data-density-pick="${id}">${DENSITY_SPECS[id].label}</button>`)
            .join("")}
        </div>`;

  const groupSpacing = `
    <section class="ctrl-group" data-group-id="spacing">
      <h4 class="cg-title">间距与对齐</h4>
      <div class="ctrl-row${fragCls}">
        <span class="cr-label">${alignMeta.title}</span>
        ${alignCtrl}
      </div>
      <div class="ctrl-row${fragCls}">
        <span class="cr-label">模块间距</span>
        ${densSegCtrl}
      </div>
    </section>`;

  // 5. 高级选项（渐进披露：语义分级时折叠在底部；错配态时强行摊开挤在最顶！）
  const advOpen = state.hierarchy === "mismatched" ? true : state.advancedOpen;
  const advBadge = state.hierarchy === "mismatched" ? '<span class="cg-badge">低频项误置顶部</span>' : "";
  const groupAdvanced = `
    <section class="ctrl-group" data-group-id="advanced">
      ${
        state.hierarchy === "progressive"
          ? `<button type="button" class="adv-toggle" id="btnAdvToggle" aria-expanded="${advOpen}">
              <span>高级选项（响应断点 · 容器样式 · 行宽上限）</span>
              <span class="mono">${advOpen ? "收起 ▲" : "展开 ▼"}</span>
            </button>`
          : `<h4 class="cg-title">高级选项 ${advBadge}</h4>`
      }
      <div class="adv-body" ${advOpen ? "" : "hidden"}>
        <div class="ctrl-row${fragCls}">
          <span class="cr-label">响应断点 / 策略</span>
          <select class="ui-select" data-select-key="breakpoint" aria-label="响应式断点">
            <option value="${vals.breakpoint}" selected>${vals.breakpoint}</option>
            <option value="1440 / 1024 / 768 / 390">1440 / 1024 / 768 / 390</option>
          </select>
        </div>
        <div class="ctrl-row${fragCls}">
          <span class="cr-label">容器样式</span>
          <select class="ui-select" data-select-key="containerStyle" aria-label="容器样式">
            ${["圆角卡片", "直角线框", "柔和浮层"].map((opt) => `<option value="${opt}" ${vals.containerStyle === opt ? "selected" : ""}>${opt}</option>`).join("")}
          </select>
        </div>
        <div class="ctrl-row${fragCls}">
          <label class="cr-label" for="lineCharsRange">内容区最大行宽</label>
          <div class="cr-slider-wrap">
            <input type="range" id="lineCharsRange" class="cr-range" min="45" max="95" value="${vals.maxLineChars}">
            <span class="cr-num-badge mono" id="lineCharsVal">${vals.maxLineChars} 字符</span>
          </div>
        </div>
      </div>
    </section>`;

  // 错配态时把「高级选项」恶意推到顶部抢戏，其他态沉在底部！
  els.controlsFlow.innerHTML =
    state.hierarchy === "mismatched"
      ? [groupAdvanced, groupMode, groupArea, groupModules, groupSpacing].join("")
      : [groupMode, groupArea, groupModules, groupSpacing, groupAdvanced].join("");
}

function updateDiagnosisAndPreview() {
  const d = diagnose(state);
  const modes = LAYOUT_MODES_BY_SCENARIO[state.scenario];
  const curMode = modes.find((m) => m.id === state.values.layoutMode) || modes[1];

  // 应用窗体 data 属性同步 CSS 密度与层级
  els.appWindow.dataset.grouping = state.grouping;
  els.appWindow.dataset.hierarchy = state.hierarchy;
  els.appWindow.dataset.density = state.density;

  // 刊头状态徽 & 自示范微开关
  els.scorePill.textContent = d.badge;
  els.scorePill.className = `live-pill mono is-${d.tone}`;
  els.titleSwitch.classList.toggle("is-on", d.allPass);

  // 诊单卡（桌面）+ 紧凑条（手机）
  els.diagCard.className = `diag-card is-${d.tone}`;
  els.diagBadge.textContent = d.badge;
  els.diagTitle.textContent = d.headline;
  els.diagBody.textContent = d.explain;
  els.diagNext.textContent = `下一步：${d.nextStep}`;
  els.mGroups.textContent = `${d.pillars.group.count} 组`;
  els.mMismatch.textContent = `${d.pillars.hierarchy.mismatchCount} 处`;
  els.mRatio.textContent = `${d.pillars.spacing.ratio}×`;
  els.mHick.textContent = `${d.hickBits} bit`;

  els.mobileDiagStrip.className = `mobile-diag-strip is-${d.tone}`;
  els.mobileDiagBadge.textContent = d.badge;
  els.mobileDiagText.textContent = d.headline;

  // 左侧原海报四标注 + 底部原海报四原则实况同步
  els.coGroupState.textContent = d.pillars.group.status;
  els.coHierState.textContent = d.pillars.hierarchy.status;
  els.coFbState.textContent = d.pillars.feedback.status;
  els.coSpaceState.textContent = d.pillars.spacing.status;

  const mapPass = {
    grouping: d.pillars.group.ok,
    hierarchy: d.pillars.hierarchy.ok,
    feedback: d.pillars.feedback.ok,
    density: d.pillars.spacing.ok,
  };
  $$(".p-callout").forEach((el) => el.classList.toggle("is-pass", !!mapPass[el.dataset.focusAxis]));

  const pillarPass = {
    group: d.pillars.group.ok,
    hierarchy: d.pillars.hierarchy.ok,
    feedback: d.pillars.feedback.ok,
    spacing: d.pillars.spacing.ok,
  };
  $$("#principlesList .pr-item").forEach((el) => el.classList.toggle("is-pass", !!pillarPass[el.dataset.pillar]));

  // 顶部架构按钮激活态
  $$("#archToolbar .abtn").forEach((btn) => {
    const active = state[btn.dataset.axis] === btn.dataset.val;
    btn.classList.toggle("is-active", active);
    const badVals = new Set(["flat", "overfragmented", "mismatched", "all-dropdown", "silent", "blocking-modal", "cramped", "gapped-out"]);
    btn.classList.toggle("is-bad", active && badVals.has(btn.dataset.val));
  });

  // 底部密度三卡高亮
  $$(".dens-card").forEach((c) => c.classList.toggle("is-active", c.dataset.densityPick === state.density));

  // 右侧「当前信息」同步
  els.infoMode.textContent = curMode.label;
  els.infoMainW.textContent = `${d.widthInfo.mainPct}%`;
  els.infoSideW.textContent = d.widthInfo.sideActive ? `${d.widthInfo.sidePct}%` : "已隐藏";
  els.infoDensity.textContent = d.densitySpec.label;
  els.infoDirty.textContent = d.dirtyCount > 0 ? `${d.dirtyCount} 项未存` : "已同步";
  els.pvCanvas.setAttribute("aria-valuenow", String(Math.round(state.values.mainWidth)));

  // 右侧「操作反馈」队列
  if (state.feedback === "silent") {
    els.toastStack.innerHTML = `<div class="toast-item is-silent">（当前为静默模式：所有提示与警告已被屏蔽）</div>`;
  } else {
    const icons = { ok: "✓", warn: "!", info: "i" };
    els.toastStack.innerHTML = d.toasts
      .map(
        (t) => `<div class="toast-item is-${t.kind}"><span class="t-dot mono" aria-hidden="true">${icons[t.kind] || "i"}</span><span>${t.text}</span></div>`
      )
      .join("");
  }

  heroPreview.draw();
}

// 仅在持续拖拽画布时轻量更新数值与画布（零整棵控件 DOM 重建，保证 60fps！）
let lastDragThreshold = "";
function handleCanvasDrag(nextMainWidth, commitFull) {
  const clamped = Math.max(50, Math.min(88, Math.round(nextMainWidth)));
  if (clamped === state.values.mainWidth && !commitFull) return;
  state.values.mainWidth = clamped;
  if (state.values.layoutMode === "single") state.values.layoutMode = "dual";
  state.values.showSidebar = true;
  state.lastEvent = "edited";

  const sidePct = 100 - clamped;
  const mwRange = $("#mainWidthRange");
  const swRange = $("#sideWidthRange");
  const mwVal = $("#mainWidthVal");
  const swVal = $("#sideWidthVal");
  if (mwRange) mwRange.value = String(clamped);
  if (swRange) swRange.value = String(sidePct);
  if (mwVal) mwVal.textContent = `${clamped}%`;
  if (swVal) swVal.textContent = `${sidePct}%`;
  els.infoMainW.textContent = `${clamped}%`;
  els.infoSideW.textContent = `${sidePct}%`;
  els.pvCanvas.setAttribute("aria-valuenow", String(clamped));

  const zone = sidePct < 18 ? "narrow" : sidePct > 44 ? "wide" : "ok";
  if (commitFull || zone !== lastDragThreshold) {
    lastDragThreshold = zone;
    updateDiagnosisAndPreview();
  }
}

const heroPreview = createHeroPreview(els.pvCanvas, () => state, handleCanvasDrag);

// 绑定 Hero 事件
$$("[data-scenario]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.scenario;
    const sc = SCENARIOS[id];
    if (!sc) return;
    state.scenario = id;
    state.activeNav = sc.navId;
    state.values = { ...sc.defaults, mainWidth: state.values.mainWidth };
    state.saved = { ...sc.defaults };
    state.lastEvent = "none";
    $$("[data-scenario]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderSidebarNav();
    renderHeroControls();
    updateDiagnosisAndPreview();
  });
});

$$("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = btn.dataset.preset;
    const sc = SCENARIOS[state.scenario];
    els.blockerBox.hidden = true;
    pendingAction = null;
    if (p === "broken") {
      state.grouping = "flat";
      state.hierarchy = "mismatched";
      state.feedback = "silent";
      state.density = "cramped";
      state.values = { ...sc.brokenStart };
      state.saved = { ...sc.defaults };
      state.lastEvent = "none";
    } else {
      state.grouping = "grouped";
      state.hierarchy = "progressive";
      state.feedback = "instant-live";
      state.density = p; // standard | compact | loose
      state.values = { ...sc.defaults };
      state.saved = { ...sc.defaults };
      state.lastEvent = "saved";
    }
    renderHeroControls();
    updateDiagnosisAndPreview();
  });
});

$("#archToolbar").addEventListener("click", (e) => {
  const btn = e.target.closest(".abtn");
  if (!btn) return;
  const { axis, val } = btn.dataset;
  state[axis] = val;
  if (axis === "feedback" && val !== "blocking-modal") {
    els.blockerBox.hidden = true;
    pendingAction = null;
  }
  renderHeroControls();
  updateDiagnosisAndPreview();
});

// 点击左侧原海报四标注，聚焦并高亮对应架构控制行
$$(".p-callout").forEach((li) => {
  li.querySelector(".callout-btn").addEventListener("click", () => {
    const axis = li.dataset.focusAxis;
    $$(".arch-group").forEach((g) => g.classList.toggle("is-highlight", g.dataset.axis === axis));
    const target = $(`.arch-group[data-axis="${axis}"] .abtn`);
    if (target) target.focus();
  });
});

// 底部原海报密度三卡点击
$$(".dens-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.density = btn.dataset.densityPick;
    renderHeroControls();
    updateDiagnosisAndPreview();
  });
});

// 侧边导航点击与搜索过滤
els.navSearchInput.addEventListener("input", (e) => {
  state.navQuery = e.target.value;
  renderSidebarNav();
});
els.sbNavList.addEventListener("click", (e) => {
  const btn = e.target.closest(".sb-nav-btn");
  if (!btn) return;
  state.activeNav = btn.dataset.navId;
  if (btn.dataset.navId === "layout") state.scenario = "layout";
  else if (btn.dataset.navId === "interact") state.scenario = "notify";
  else if (btn.dataset.navId === "sync") state.scenario = "privacy";
  $$("[data-scenario]").forEach((b) => b.classList.toggle("is-active", b.dataset.scenario === state.scenario));
  renderSidebarNav();
  renderHeroControls();
  updateDiagnosisAndPreview();
});

// 中间控件区委托事件（滑块、模式、开关、分段钮、高级折叠）
els.controlsFlow.addEventListener("click", (e) => {
  const modeBtn = e.target.closest("[data-mode-pick]");
  if (modeBtn && modeBtn.tagName === "BUTTON") {
    const id = modeBtn.dataset.modePick;
    applySettingChange("布局模式", () => {
      state.values.layoutMode = id;
      state.values.showSidebar = id !== "single";
    });
    return;
  }
  const tog = e.target.closest("[data-toggle-key]");
  if (tog) {
    const key = tog.dataset.toggleKey;
    applySettingChange(tog.getAttribute("aria-label") || "开关", () => {
      state.values[key] = !state.values[key];
    });
    return;
  }
  const al = e.target.closest("[data-align-pick]");
  if (al) {
    const id = al.dataset.alignPick;
    applySettingChange("对齐方式", () => {
      state.values.align = id;
    });
    return;
  }
  const dp = e.target.closest("[data-density-pick]");
  if (dp) {
    state.density = dp.dataset.densityPick;
    renderHeroControls();
    updateDiagnosisAndPreview();
    return;
  }
  if (e.target.closest("#btnAdvToggle")) {
    state.advancedOpen = !state.advancedOpen;
    renderHeroControls();
  }
});

els.controlsFlow.addEventListener("change", (e) => {
  const el = e.target;
  if (el.matches('input[type="checkbox"][data-mode-pick]')) {
    const id = el.dataset.modePick;
    applySettingChange("布局模式", () => {
      state.values.layoutMode = id;
      state.values.showSidebar = id !== "single";
    });
  } else if (el.matches("[data-select-key]")) {
    const k = el.dataset.selectKey;
    const v = el.value;
    applySettingChange(k, () => {
      state.values[k] = v;
      if (k === "layoutMode") state.values.showSidebar = v !== "single";
    });
  } else if (el.matches("[data-bool-select]")) {
    const k = el.dataset.boolSelect;
    const v = el.value === "true";
    applySettingChange(k, () => {
      state.values[k] = v;
    });
  } else if (el.matches("[data-density-select]")) {
    state.density = el.value;
    renderHeroControls();
    updateDiagnosisAndPreview();
  }
});

els.controlsFlow.addEventListener("input", (e) => {
  const el = e.target;
  if (el.id === "mainWidthRange") {
    handleCanvasDrag(Number(el.value), true);
  } else if (el.id === "sideWidthRange") {
    handleCanvasDrag(100 - Number(el.value), true);
  } else if (el.id === "maxWidthRange") {
    state.values.maxWidth = Number(el.value);
    const out = $("#maxWidthVal");
    if (out) out.textContent = `${state.values.maxWidth}px`;
    state.lastEvent = "edited";
    updateDiagnosisAndPreview();
  } else if (el.id === "lineCharsRange") {
    state.values.maxLineChars = Number(el.value);
    const out = $("#lineCharsVal");
    if (out) out.textContent = `${state.values.maxLineChars} 字符`;
    state.lastEvent = "edited";
    updateDiagnosisAndPreview();
  }
});

// 弹窗拦截试错按钮
els.btnBlockConfirm.addEventListener("click", () => {
  if (pendingAction) pendingAction();
  pendingAction = null;
  els.blockerBox.hidden = true;
  state.lastEvent = "edited";
  renderHeroControls();
  updateDiagnosisAndPreview();
});
els.btnBlockCancel.addEventListener("click", () => {
  pendingAction = null;
  els.blockerBox.hidden = true;
  state.pendingBlockMsg = "已取消刚才修改（这就是弹窗拦截带来的折返成本）";
  updateDiagnosisAndPreview();
});

// 保存 / 取消 / 重置
els.btnSave.addEventListener("click", () => {
  state.saved = { ...state.values };
  state.lastEvent = "saved";
  updateDiagnosisAndPreview();
});
els.btnCancel.addEventListener("click", () => {
  state.values = { ...state.saved };
  state.lastEvent = "canceled";
  renderHeroControls();
  updateDiagnosisAndPreview();
});
els.btnResetAll.addEventListener("click", () => {
  const sc = SCENARIOS[state.scenario];
  state.values = { ...sc.defaults };
  state.saved = { ...sc.defaults };
  state.lastEvent = "reset";
  renderHeroControls();
  updateDiagnosisAndPreview();
});

renderSidebarNav();
renderHeroControls();
updateDiagnosisAndPreview();

// =========================================================================
// 2. SECTION 01 · 限时找设置秒表挑战
// =========================================================================
const findState = {
  mode: "flat", // flat | grouped | deep
  targetIdx: 0,
  running: false,
  startedAt: 0,
  clicks: 0,
  openGroups: new Set(),
  records: { flat: null, grouped: null, deep: null },
  timerId: 0,
};

const findBoard = $("#findBoard");
const findTimer = $("#findTimer");
const findTargetName = $("#findTargetName");
const findFeedback = $("#findFeedback");

function currentFindTarget() {
  const id = FIND_TARGETS[findState.targetIdx % FIND_TARGETS.length];
  return FIND_LAB_ITEMS.find((x) => x.id === id);
}

function stopFindTimer() {
  if (findState.timerId) {
    clearInterval(findState.timerId);
    findState.timerId = 0;
  }
  findState.running = false;
}

function startFindRound(advance = false) {
  stopFindTimer();
  if (advance) findState.targetIdx = (findState.targetIdx + 1) % FIND_TARGETS.length;
  findState.clicks = 0;
  findState.openGroups.clear();
  findState.startedAt = performance.now();
  findState.running = true;
  findTargetName.textContent = currentFindTarget().label;
  findTimer.textContent = "0.00 s";
  findState.timerId = setInterval(() => {
    if (!findState.running) return;
    const s = ((performance.now() - findState.startedAt) / 1000).toFixed(2);
    findTimer.textContent = `${s} s`;
  }, 60);
  renderFindBoard();
}

function renderFindBoard() {
  const byId = Object.fromEntries(FIND_LAB_ITEMS.map((x) => [x.id, x]));
  if (findState.mode === "flat") {
    findBoard.innerHTML = `<div class="fb-flat-grid">${FIND_FLAT_ORDER.map(
      (id) => `<button type="button" class="fb-item" data-find-id="${id}">${byId[id].label}</button>`
    ).join("")}</div>`;
  } else if (findState.mode === "grouped") {
    const groups = [...new Set(FIND_LAB_ITEMS.map((x) => x.group))];
    findBoard.innerHTML = `<div class="fb-groups">${groups
      .map(
        (g) => `
      <div class="fb-grp">
        <h4 class="fb-grp-h">${g}</h4>
        ${FIND_LAB_ITEMS.filter((x) => x.group === g)
          .map((item) => `<button type="button" class="fb-item" data-find-id="${item.id}">${item.label}</button>`)
          .join("")}
      </div>`
      )
      .join("")}</div>`;
  } else {
    // 三级深折叠：故意把 4 个组折叠起来，且再藏一层子分类按钮！
    const groups = [...new Set(FIND_LAB_ITEMS.map((x) => x.group))];
    findBoard.innerHTML = groups
      .map((g) => {
        const open = findState.openGroups.has(g);
        const items = FIND_LAB_ITEMS.filter((x) => x.group === g);
        return `
        <div class="fb-deep-acc">
          <button type="button" class="fb-deep-btn" data-deep-grp="${g}" aria-expanded="${open}">
            <span>${g}（${items.length} 项已折叠）</span>
            <span class="mono">${open ? "−" : "+"}</span>
          </button>
          ${
            open
              ? `<div class="fb-deep-body">${items
                  .map((item) => `<button type="button" class="fb-item" data-find-id="${item.id}">${item.path} · ${item.label}</button>`)
                  .join("")}</div>`
              : ""
          }
        </div>`;
      })
      .join("");
  }
}

$$("[data-find-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    findState.mode = btn.dataset.findMode;
    $$("[data-find-mode]").forEach((b) => b.classList.toggle("is-active", b === btn));
    stopFindTimer();
    findState.openGroups.clear();
    findTimer.textContent = "0.00 s";
    renderFindBoard();
    findFeedback.textContent = `已切换到「${btn.textContent}」——点「开始找下一项」或直接点列表项开测。`;
  });
});

$("#btnStartFind").addEventListener("click", () => startFindRound(true));

findBoard.addEventListener("click", (e) => {
  const deepBtn = e.target.closest("[data-deep-grp]");
  if (deepBtn) {
    if (!findState.running) {
      findState.startedAt = performance.now();
      findState.running = true;
      findState.clicks = 0;
      findState.timerId = setInterval(() => {
        if (findState.running) findTimer.textContent = `${((performance.now() - findState.startedAt) / 1000).toFixed(2)} s`;
      }, 60);
    }
    findState.clicks++;
    const g = deepBtn.dataset.deepGrp;
    if (findState.openGroups.has(g)) findState.openGroups.delete(g);
    else findState.openGroups.add(g);
    renderFindBoard();
    return;
  }

  const itemBtn = e.target.closest("[data-find-id]");
  if (!itemBtn) return;
  if (!findState.running) {
    findState.startedAt = performance.now();
    findState.running = true;
    findState.clicks = 0;
  }
  findState.clicks++;
  const target = currentFindTarget();
  if (itemBtn.dataset.findId === target.id) {
    const sec = Math.max(0.08, (performance.now() - findState.startedAt) / 1000);
    stopFindTimer();
    const text = `${sec.toFixed(2)} s（${findState.clicks} 步）`;
    findTimer.textContent = `${sec.toFixed(2)} s`;
    itemBtn.classList.add("is-hit");
    findState.records[findState.mode] = text;
    $("#recFlat").textContent = findState.records.flat || "未测";
    $("#recGrouped").textContent = findState.records.grouped || "未测";
    $("#recDeep").textContent = findState.records.deep || "未测";
    findFeedback.textContent = `找到了「${target.label}」！用时 ${sec.toFixed(2)} 秒、共点 ${findState.clicks} 次。切换另一种结构测同一套 16 项，差异立刻能体感出来。`;
  } else {
    itemBtn.classList.add("is-miss");
    findFeedback.textContent = `点到的是「${itemBtn.textContent}」，目标在找「${target.label}」——继续找。`;
  }
});

renderFindBoard();

// =========================================================================
// 3. SECTION 02 · 控件配对诊台
// =========================================================================
const matchState = {
  idx: 0,
  solved: new Set(),
  picked: {},
};

function renderMatcher() {
  const task = CONTROL_TASKS[matchState.idx];
  $("#matcherTasks").innerHTML = CONTROL_TASKS.map(
    (t, i) => `
    <button type="button" class="mtask-btn${i === matchState.idx ? " is-active" : ""}${matchState.solved.has(t.id) ? " is-solved" : ""}" role="tab" aria-selected="${i === matchState.idx}" data-mtask="${i}">
      <span class="mtask-dot" aria-hidden="true"></span>
      <span>任务 0${i + 1}</span>
    </button>`
  ).join("");

  $("#mpIdx").textContent = `TASK 0${matchState.idx + 1} / 0${CONTROL_TASKS.length}`;
  $("#mpText").textContent = task.prompt;
  const pick = matchState.picked[task.id];

  $$("#controlPalette .ctrl-tile").forEach((tile) => {
    const c = tile.dataset.ctrl;
    tile.classList.toggle("is-picked-ok", pick === c && task.verdicts[c].ok);
    tile.classList.toggle("is-picked-bad", pick === c && !task.verdicts[c].ok);
  });

  const vbox = $("#matcherVerdict");
  if (!pick) {
    vbox.className = "matcher-verdict";
    $("#mvBadge").textContent = "待配对";
    $("#mvTitle").textContent = "点选上方任意控件，立刻看它的可用性诊断";
    $("#mvBody").textContent = "每一种控件都自带用户早已习得的心理契约，选对控件比在旁边写三行解释文字更管用。";
  } else {
    const v = task.verdicts[pick];
    vbox.className = `matcher-verdict ${v.ok ? "is-ok" : "is-bad"}`;
    $("#mvBadge").textContent = v.ok ? "匹配恰当" : "控件错配";
    $("#mvTitle").textContent = v.title;
    $("#mvBody").textContent = v.body;
  }
  $("#mvScore").textContent = `已答对 ${matchState.solved.size} / ${CONTROL_TASKS.length}`;
}

$("#matcherTasks").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-mtask]");
  if (!btn) return;
  matchState.idx = Number(btn.dataset.mtask);
  renderMatcher();
});
$("#controlPalette").addEventListener("click", (e) => {
  const tile = e.target.closest(".ctrl-tile");
  if (!tile) return;
  const task = CONTROL_TASKS[matchState.idx];
  const ctrl = tile.dataset.ctrl;
  matchState.picked[task.id] = ctrl;
  if (task.verdicts[ctrl].ok) matchState.solved.add(task.id);
  renderMatcher();
});
renderMatcher();

// =========================================================================
// 4. SECTION 03 · 生效模型与反馈时序模拟仪
// =========================================================================
const simState = {
  mode: "instant", // instant | explicit | silent
  slowNet: false,
  conflict: false,
  on: true,
  savedClicked: false,
  triggeredAt: 0,
};

const simToggleBtn = $("#simToggleBtn");
const simStatusText = $("#simStatusText");
const simSaveBtn = $("#simSaveBtn");
const simExplain = $("#simExplain");
const commitCtrl = createCommitTimeline($("#commitCanvas"), () => simState);

function updateSimUI(justToggled = false) {
  simToggleBtn.setAttribute("aria-checked", String(simState.on));
  simSaveBtn.hidden = simState.mode !== "explicit";

  if (simState.mode === "instant") {
    simExplain.textContent = "即时自动保存：拨动开关后立刻在 UI 上反馈新状态，网络略慢时显示轻态「保存中…」，冲突则当场回滚并说明原因。";
    if (justToggled) {
      if (simState.conflict) {
        simStatusText.className = "dsim-status is-warn";
        simStatusText.textContent = "⚠ 检测到权限冲突，已自动回滚原状态并保留提示";
        simState.on = !simState.on;
        simToggleBtn.setAttribute("aria-checked", String(simState.on));
      } else {
        simStatusText.className = "dsim-status";
        simStatusText.textContent = simState.slowNet
          ? `保存中（600ms 延迟）→ 已自动保存：${simState.on ? "开启" : "关闭"}`
          : `✓ 已即时生效并自动保存：${simState.on ? "开启" : "关闭"}`;
      }
    } else {
      simStatusText.className = "dsim-status";
      simStatusText.textContent = `当前：${simState.on ? "已开启" : "已关闭"} · 即时生效模式`;
    }
  } else if (simState.mode === "explicit") {
    simExplain.textContent = "草稿 + 显式保存：适合多字段联动或高风险配置。修改后立刻亮起「有未保存更改」，点击「保存更改」后给出明确回执。";
    if (justToggled && !simState.savedClicked) {
      simStatusText.className = "dsim-status is-warn";
      simStatusText.textContent = "● 有 1 项未保存更改 — 请点右侧「保存更改」提交";
    } else if (simState.savedClicked) {
      simStatusText.className = simState.conflict ? "dsim-status is-err" : "dsim-status";
      simStatusText.textContent = simState.conflict ? "× 保存失败：服务器校验冲突，请调整后重试" : "✓ 更改已显式保存生效";
    } else {
      simStatusText.className = "dsim-status";
      simStatusText.textContent = "当前草稿与已保存状态一致";
    }
  } else {
    simExplain.textContent = "静默混用陷阱：界面既不告诉用户是不是立刻生效，也不亮未保存提示；拨完开关后用户心里没底，往往反复多点甚至直接误关页面。";
    simStatusText.className = "dsim-status is-err";
    simStatusText.textContent = justToggled ? "（无任何反馈……刚才那一下到底存没存上？）" : "当前处于无反馈模式：点一下右侧开关试试";
  }
  commitCtrl.trigger(!justToggled && !simState.savedClicked);
}

$$("[data-sim-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    simState.mode = btn.dataset.simMode;
    simState.savedClicked = false;
    $$("[data-sim-mode]").forEach((b) => b.classList.toggle("is-active", b === btn));
    updateSimUI(false);
  });
});
$("#simSlowNet").addEventListener("change", (e) => {
  simState.slowNet = e.target.checked;
  updateSimUI(false);
});
$("#simConflict").addEventListener("change", (e) => {
  simState.conflict = e.target.checked;
  updateSimUI(false);
});
simToggleBtn.addEventListener("click", () => {
  simState.on = !simState.on;
  simState.savedClicked = false;
  updateSimUI(true);
});
simSaveBtn.addEventListener("click", () => {
  simState.savedClicked = true;
  updateSimUI(false);
});
updateSimUI(false);

// =========================================================================
// 5. SECTION 04 · 双滑杆留白蓝图 + 44px 触控靶区
// =========================================================================
const gapState = { innerGap: 12, outerGap: 24, showTouch: false };
const gapInnerSlider = $("#gapInnerSlider");
const gapOuterSlider = $("#gapOuterSlider");
const spacingCtrl = createSpacingBlueprint($("#spacingCanvas"), () => gapState);

function updateGapUI() {
  $("#gapInnerVal").textContent = `${gapState.innerGap} px`;
  $("#gapOuterVal").textContent = `${gapState.outerGap} px`;
  const ratio = gapState.outerGap / Math.max(1, gapState.innerGap);
  $("#gapRatioReadout").textContent = `外 / 内 = ${ratio.toFixed(2)}×`;

  const vBox = $("#gapVerdict");
  const vTxt = $("#gapVerdictText");
  if (ratio < 1.05) {
    vBox.className = "gap-verdict is-err";
    vTxt.textContent = "归属倒挂：组内行距几乎等于或宽于组间外距，眼睛分不清哪几条属于同一组。";
  } else if (ratio < 1.55) {
    vBox.className = "gap-verdict is-warn";
    vTxt.textContent = "边界偏弱：外距与内距拉得不够开，分组视觉边界发粘，需要靠重边框硬撑。";
  } else if (gapState.innerGap < 8 && gapState.showTouch) {
    vBox.className = "gap-verdict is-warn";
    vTxt.textContent = "比例尚可，但开启 44px 靶区后可见相邻开关在触屏上发生红圈重叠，手指易误触。";
  } else {
    vBox.className = "gap-verdict";
    vTxt.textContent = "处于经验舒适带（外距 ≥ 1.6×–2.5× 内距），组内凝聚、组间界限自然成立。";
  }
  spacingCtrl.draw();
}

gapInnerSlider.addEventListener("input", () => {
  gapState.innerGap = Number(gapInnerSlider.value);
  updateGapUI();
});
gapOuterSlider.addEventListener("input", () => {
  gapState.outerGap = Number(gapOuterSlider.value);
  updateGapUI();
});
$("#toggleTouchHalo").addEventListener("change", (e) => {
  gapState.showTouch = e.target.checked;
  updateGapUI();
});
const GAP_PRESETS = { compact: [8, 20], standard: [12, 24], loose: [16, 32], invert: [24, 12] };
$$("[data-gap-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const [i, o] = GAP_PRESETS[btn.dataset.gapPreset];
    gapState.innerGap = i;
    gapState.outerGap = o;
    gapInnerSlider.value = String(i);
    gapOuterSlider.value = String(o);
    $$("[data-gap-preset]").forEach((b) => b.classList.toggle("is-active", b === btn));
    updateGapUI();
  });
});
updateGapUI();

// =========================================================================
// 6. SECTION 05 · 四代设置架构演化器
// =========================================================================
let eraIdx = 0;

function eraWireframeSvg(kind) {
  if (kind === "sheet") {
    // 1981 Xerox Star 属性表：黑白线框弹窗 + 反显选项块
    return `<svg class="ew-box" viewBox="0 0 380 205" aria-hidden="true">
      <rect x="20" y="10" width="340" height="185" fill="#FFF" stroke="#1A2024" stroke-width="2"/>
      <rect x="20" y="10" width="340" height="26" fill="#1A2024"/>
      <text x="34" y="27" fill="#FFF" font-size="11" font-family="Space Mono, monospace">PARAGRAPH PROPERTY SHEET</text>
      <text x="34" y="60" fill="#1A2024" font-size="11" font-family="IBM Plex Sans, sans-serif" font-weight="700">ALIGNMENT</text>
      <rect x="130" y="45" width="54" height="22" fill="#1A2024"/><text x="143" y="60" fill="#FFF" font-size="11">Left</text>
      <rect x="190" y="45" width="60" height="22" fill="#FFF" stroke="#1A2024"/><text x="202" y="60" fill="#1A2024" font-size="11">Center</text>
      <rect x="256" y="45" width="56" height="22" fill="#FFF" stroke="#1A2024"/><text x="268" y="60" fill="#1A2024" font-size="11">Right</text>
      <line x1="34" y1="84" x2="344" y2="84" stroke="#CBD3D8"/>
      <text x="34" y="108" fill="#1A2024" font-size="11" font-weight="700">MARGINS</text>
      <rect x="130" y="94" width="62" height="22" fill="#FFF" stroke="#1A2024"/><text x="145" y="109" fill="#1A2024" font-size="11" font-family="Space Mono, monospace">24 pt</text>
      <rect x="204" y="94" width="62" height="22" fill="#FFF" stroke="#1A2024"/><text x="219" y="109" fill="#1A2024" font-size="11" font-family="Space Mono, monospace">24 pt</text>
      <rect x="236" y="156" width="52" height="24" fill="#1A2024"/><text x="249" y="172" fill="#FFF" font-size="11">Done</text>
      <rect x="296" y="156" width="52" height="24" fill="#FFF" stroke="#1A2024"/><text x="304" y="172" fill="#1A2024" font-size="11">Cancel</text>
    </svg>`;
  }
  if (kind === "mac84") {
    // 1984 Macintosh 图形控制面板：零文字乌龟/兔子滑轨 + 像素底纹格
    return `<svg class="ew-box" viewBox="0 0 380 205" aria-hidden="true">
      <rect x="18" y="10" width="344" height="185" rx="8" fill="#FFF" stroke="#1A2024" stroke-width="2"/>
      <line x1="18" y1="34" x2="362" y2="34" stroke="#1A2024" stroke-width="1.5"/>
      <text x="190" y="26" text-anchor="middle" fill="#1A2024" font-size="11" font-family="Space Mono, monospace">CONTROL PANEL (1984)</text>
      <rect x="32" y="48" width="142" height="132" rx="4" fill="#F2F4F6" stroke="#1A2024"/>
      <text x="103" y="70" text-anchor="middle" fill="#525E66" font-size="11">像素桌面底纹</text>
      <rect x="58" y="82" width="90" height="72" fill="#FFFFFF" stroke="#1A2024"/>
      <g fill="#1A2024"><rect x="66" y="90" width="12" height="12"/><rect x="90" y="90" width="12" height="12"/><rect x="114" y="90" width="12" height="12"/><rect x="78" y="102" width="12" height="12"/><rect x="102" y="102" width="12" height="12"/><rect x="126" y="102" width="12" height="12"/><rect x="66" y="114" width="12" height="12"/><rect x="90" y="114" width="12" height="12"/><rect x="114" y="114" width="12" height="12"/></g>
      <rect x="188" y="48" width="160" height="60" rx="4" fill="#F2F4F6" stroke="#1A2024"/>
      <text x="200" y="72" fill="#1A2024" font-size="11">慢(龟)</text><text x="306" y="72" fill="#1A2024" font-size="11">快(兔)</text>
      <line x1="204" y1="90" x2="334" y2="90" stroke="#1A2024" stroke-width="3"/>
      <rect x="266" y="81" width="12" height="18" fill="#098781"/>
      <rect x="188" y="118" width="160" height="62" rx="4" fill="#F2F4F6" stroke="#1A2024"/>
      <text x="204" y="142" fill="#525E66" font-size="11">音量 0–7（零文字图符）</text>
      <rect x="204" y="154" width="126" height="12" fill="#FFF" stroke="#1A2024"/>
      <rect x="204" y="154" width="82" height="12" fill="#1A2024"/>
    </svg>`;
  }
  if (kind === "grid2001") {
    // 2001 System Preferences 图标宫格
    return `<svg class="ew-box" viewBox="0 0 380 205" aria-hidden="true">
      <rect x="16" y="10" width="348" height="185" rx="8" fill="#FFF" stroke="#B6C0C7" stroke-width="1.5"/>
      <rect x="16" y="10" width="348" height="28" rx="8" fill="#E3E8EC"/>
      <text x="32" y="28" fill="#283238" font-size="11" font-weight="700">显示全部 · System Preferences</text>
      <rect x="26" y="46" width="328" height="64" rx="5" fill="#F6F8F9"/>
      <text x="36" y="61" fill="#505C65" font-size="10.5" font-weight="700">个人</text>
      <g fill="#098781"><rect x="44" y="70" width="24" height="24" rx="6"/><rect x="116" y="70" width="24" height="24" rx="6" fill="#283238"/><rect x="188" y="70" width="24" height="24" rx="6" fill="#FDBE02"/><rect x="260" y="70" width="24" height="24" rx="6" fill="#526570"/></g>
      <rect x="26" y="118" width="328" height="66" rx="5" fill="#F6F8F9"/>
      <text x="36" y="133" fill="#505C65" font-size="10.5" font-weight="700">硬件与系统</text>
      <g fill="#7D8C96"><rect x="44" y="142" width="24" height="24" rx="6"/><rect x="116" y="142" width="24" height="24" rx="6"/><rect x="188" y="142" width="24" height="24" rx="6" fill="#098781"/><rect x="260" y="142" width="24" height="24" rx="6"/></g>
    </svg>`;
  }
  // 2022 现代侧栏 + 分组卡片 + 预览
  return `<svg class="ew-box" viewBox="0 0 380 205" aria-hidden="true">
    <rect x="16" y="10" width="348" height="185" rx="9" fill="#FFF" stroke="#CBD4DA" stroke-width="1.5"/>
    <path d="M25 10 H108 V195 H25 A9 9 0 0 1 16 186 V19 A9 9 0 0 1 25 10 Z" fill="#283238"/>
    <rect x="26" y="24" width="72" height="14" rx="4" fill="#1A2227"/>
    <rect x="22" y="48" width="80" height="18" rx="4" fill="#098781"/>
    <rect x="26" y="74" width="60" height="10" rx="3" fill="#475661"/>
    <rect x="26" y="92" width="66" height="10" rx="3" fill="#475661"/>
    <rect x="26" y="110" width="54" height="10" rx="3" fill="#475661"/>
    <rect x="122" y="24" width="144" height="52" rx="6" fill="#F6F8F9" stroke="#DCE3E8"/>
    <rect x="132" y="34" width="64" height="7" rx="2" fill="#283238"/>
    <rect x="132" y="50" width="124" height="14" rx="4" fill="#E4F3F1"/>
    <rect x="122" y="88" width="144" height="92" rx="6" fill="#F6F8F9" stroke="#DCE3E8"/>
    <rect x="132" y="100" width="82" height="7" rx="2" fill="#525E66"/>
    <rect x="232" y="96" width="24" height="13" rx="6.5" fill="#098781"/>
    <rect x="132" y="126" width="76" height="7" rx="2" fill="#525E66"/>
    <rect x="232" y="122" width="24" height="13" rx="6.5" fill="#098781"/>
    <rect x="278" y="24" width="74" height="156" rx="6" fill="#F4F6F7" stroke="#DCE3E8"/>
    <rect x="286" y="34" width="58" height="14" rx="3" fill="#098781"/>
    <rect x="286" y="56" width="58" height="44" rx="3" fill="#8FC6C4"/>
    <rect x="286" y="116" width="58" height="16" rx="4" fill="#E4F2EC"/>
    <rect x="286" y="152" width="58" height="18" rx="4" fill="#098781"/>
  </svg>`;
}

function renderEra() {
  const era = ERAS[eraIdx];
  $("#eraTabs").innerHTML = ERAS.map(
    (e, i) => `
    <button type="button" class="era-tab${i === eraIdx ? " is-active" : ""}" role="tab" aria-selected="${i === eraIdx}" data-era-idx="${i}">
      <span class="mono">${e.year}</span>
      <strong>${e.name.split("·")[1]?.trim() || e.name}</strong>
    </button>`
  ).join("");
  $("#eraWireframe").innerHTML = eraWireframeSvg(era.layoutKind);
  $("#eraYear").textContent = era.year;
  $("#eraEn").textContent = era.en;
  $("#eraName").textContent = era.name;
  $("#eraPeople").textContent = era.people;
  $("#eraSummary").textContent = era.summary;
  $("#eraPros").textContent = era.pros;
  $("#eraLimit").textContent = era.limit;
}

$("#eraTabs").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-era-idx]");
  if (!btn) return;
  eraIdx = Number(btn.dataset.eraIdx);
  renderEra();
});
renderEra();

// =========================================================================
// 7. SECTION 06 · 单变量四选一小练习
// =========================================================================
let quizPicked = null;

function quizWireSvg(id) {
  if (id === "A") {
    return `<svg class="q-svg" viewBox="0 0 180 96" aria-hidden="true">
      <rect x="24" y="10" width="132" height="9" rx="2" fill="#99A6AE"/>
      <rect x="24" y="23" width="132" height="9" rx="2" fill="#99A6AE"/>
      <rect x="24" y="36" width="132" height="9" rx="2" fill="#99A6AE"/>
      <rect x="24" y="49" width="132" height="9" rx="2" fill="#99A6AE"/>
      <rect x="24" y="62" width="132" height="9" rx="2" fill="#C4CED4"/>
      <rect x="24" y="75" width="132" height="9" rx="2" fill="#C4CED4"/>
    </svg>`;
  }
  if (id === "B") {
    return `<svg class="q-svg" viewBox="0 0 180 96" aria-hidden="true">
      <rect x="20" y="8" width="140" height="52" rx="5" fill="#FFF" stroke="#B6C3CA"/>
      <rect x="28" y="14" width="56" height="6" rx="2" fill="#098781"/>
      <rect x="28" y="24" width="124" height="6" rx="2" fill="#99A6AE"/>
      <rect x="28" y="34" width="124" height="6" rx="2" fill="#99A6AE"/>
      <rect x="28" y="44" width="124" height="6" rx="2" fill="#99A6AE"/>
      <rect x="20" y="72" width="140" height="16" rx="5" fill="#E8EEF1" stroke="#B6C3CA"/>
      <rect x="28" y="77" width="66" height="6" rx="2" fill="#525E66"/>
      <text x="144" y="83" fill="#525E66" font-size="9">▼</text>
    </svg>`;
  }
  if (id === "C") {
    return `<svg class="q-svg" viewBox="0 0 180 96" aria-hidden="true">
      <rect x="14" y="10" width="48" height="76" rx="4" fill="#283238"/>
      <rect x="20" y="16" width="36" height="7" rx="2" fill="#098781"/>
      <rect x="20" y="27" width="32" height="6" rx="2" fill="#5B6B75"/>
      <rect x="20" y="37" width="32" height="6" rx="2" fill="#5B6B75"/>
      <rect x="20" y="47" width="32" height="6" rx="2" fill="#5B6B75"/>
      <rect x="20" y="57" width="32" height="6" rx="2" fill="#5B6B75"/>
      <rect x="20" y="67" width="32" height="6" rx="2" fill="#5B6B75"/>
      <rect x="70" y="10" width="96" height="76" rx="4" fill="#FFF" stroke="#CBD4DA"/>
      <rect x="82" y="24" width="72" height="12" rx="3" fill="#99A6AE"/>
    </svg>`;
  }
  return `<svg class="q-svg" viewBox="0 0 180 96" aria-hidden="true">
    <rect x="10" y="12" width="48" height="72" rx="4" fill="#FFF" stroke="#CBD4DA"/>
    <rect x="16" y="20" width="36" height="7" rx="2" fill="#99A6AE"/>
    <rect x="16" y="32" width="36" height="7" rx="2" fill="#99A6AE"/>
    <rect x="18" y="66" width="32" height="10" rx="2" fill="#098781"/>
    <rect x="66" y="12" width="48" height="72" rx="4" fill="#FFF" stroke="#CBD4DA"/>
    <rect x="72" y="20" width="36" height="7" rx="2" fill="#99A6AE"/>
    <rect x="72" y="32" width="36" height="7" rx="2" fill="#99A6AE"/>
    <rect x="74" y="66" width="32" height="10" rx="2" fill="#098781"/>
    <rect x="122" y="12" width="48" height="72" rx="4" fill="#FFF" stroke="#CBD4DA"/>
    <rect x="128" y="20" width="36" height="7" rx="2" fill="#99A6AE"/>
    <rect x="128" y="32" width="36" height="7" rx="2" fill="#99A6AE"/>
    <rect x="130" y="66" width="32" height="10" rx="2" fill="#098781"/>
  </svg>`;
}

function renderQuiz() {
  $("#quizGrid").innerHTML = QUIZ_OPTIONS.map((opt) => {
    const picked = quizPicked === opt.id;
    let cls = "q-opt";
    if (picked) cls += opt.correct ? " is-correct" : " is-wrong";
    else if (quizPicked && opt.correct) cls += " is-correct";
    return `
      <button type="button" class="${cls}" role="radio" aria-checked="${picked}" data-quiz-id="${opt.id}">
        <span class="q-lbl mono">${opt.label}</span>
        ${quizWireSvg(opt.id)}
        <span class="q-title">${opt.title}</span>
        <span class="q-desc">${opt.desc}</span>
      </button>`;
  }).join("");

  const res = $("#quizResult");
  if (!quizPicked) {
    res.hidden = true;
  } else {
    const opt = QUIZ_OPTIONS.find((x) => x.id === quizPicked);
    res.hidden = false;
    res.className = `quiz-result ${opt.correct ? "is-ok" : "is-bad"}`;
    res.innerHTML = `<strong>${opt.correct ? "✓ 选择正确" : `× 你选了 ${opt.label}（更佳解是方案 B）`}</strong>：${opt.feedback}`;
  }
}

$("#quizGrid").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-quiz-id]");
  if (!btn) return;
  quizPicked = btn.dataset.quizId;
  renderQuiz();
});
renderQuiz();

// =========================================================================
// 8. SECTION 07 · 原海报放大灯箱（支持缩放、鼠标/触摸拖拽、Esc 关闭）
// =========================================================================
const lb = $("#lightbox");
const lbImg = $("#lbImg");
const lbStage = $("#lbStage");
const lbScaleEl = $("#lbScale");
const posterEl = $("#poster");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbScaleEl.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.getAttribute("src")) lbImg.src = posterEl.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lb.hidden = false;
  $("#lbClose").focus();
}

function closeLightbox() {
  lb.hidden = true;
  $("#posterOpenBtn").focus();
}

$("#posterOpenBtn").addEventListener("click", openLightbox);
$("#lbClose").addEventListener("click", closeLightbox);
$("#lbZoomIn").addEventListener("click", () => {
  lbScale = Math.min(3, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
$("#lbZoomOut").addEventListener("click", () => {
  lbScale = Math.max(0.6, +(lbScale - 0.35).toFixed(2));
  applyLbTransform();
});
$("#lbReset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) {
    closeLightbox();
    return;
  }
  lbDrag = { x: e.clientX - lbX, y: e.clientY - lbY };
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbDrag.x;
  lbY = e.clientY - lbDrag.y;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => { lbDrag = null; });
lbStage.addEventListener("pointercancel", () => { lbDrag = null; });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lb.hidden) closeLightbox();
});

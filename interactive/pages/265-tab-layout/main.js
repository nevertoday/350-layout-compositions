import { loop, pixelRatio } from "../../lib/stage.js";
import {
  CONTEXTS,
  QUIZ_ITEMS,
  auditState,
  computeBudgetModel,
  createFreshTabMemory,
  createInitialState,
  evaluateDecision,
} from "./model.js";

// ---------- 简洁线绘图标（1:1 承袭 265 原海报风格） ----------
const ICONS = {
  pie: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 4v8h8"/></svg>`,
  folder: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>`,
  user: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8.5" r="3.5"/><path d="M5.5 19.5c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.9 5.9l1.6 1.6M16.5 16.5l1.6 1.6M18.1 5.9l-1.6 1.6M7.5 16.5l-1.6 1.6"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3.5l7 3v5.5c0 4.2-2.9 7.3-7 8.5-4.1-1.2-7-4.3-7-8.5V6.5l7-3z"/></svg>`,
  key: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8.5" cy="12" r="3.5"/><path d="M12 12h8.5M17.5 12v3M20 12v2.2"/></svg>`,
  dots: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="6.5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="17.5" cy="12" r="1.8"/></svg>`,
};

// ==================== 全局状态（开场工作台） ====================
const state = createInitialState();
let currentAudit = auditState(state);
let lastDomWidth = state.containerWidth;
let heroDraw = () => {};

const $ = (id) => document.getElementById(id);

const elFolderFrame = $("folder-frame");
const elTabbarSim = $("tabbar-sim");
const elTabbarLimitTag = $("tabbar-limit-tag");
const elTablist = $("hero-tablist");
const elTabpanel = $("hero-tabpanel");
const elRulerReadout = $("ruler-readout");
const elViewTitle = $("view-title");
const elViewSummary = $("view-summary");
const elViewFilters = $("view-filters");
const elViewDraft = $("view-draft");
const elContextBadge = $("context-badge");
const elMetricsInline = $("view-metrics-inline");
const elCanvasWVal = $("canvas-w-val");
const elWidthSlider = $("width-slider");
const elWidthSliderVal = $("width-slider-val");
const elBtnAddTab = $("btn-add-tab");
const elBtnToggleContext = $("btn-toggle-context");
const elTopStatusPill = $("top-status-pill");
const elMobileStatusPill = $("mobile-status-pill");
const elDiagAlertBox = $("diag-alert-box");
const elDiagGrade = $("diag-grade");
const elDiagScoreBadge = $("diag-score-badge");
const elDiagSlotMeta = $("diag-slot-meta");
const elDiagHeadline = $("diag-headline");
const elDiagWhy = $("diag-why");
const elDiagNext = $("diag-next");
const elHeroCanvas = $("hero-canvas");

// ---------- 工具：同步宽度条视觉比例 ----------
function syncTabbarWidthVisual() {
  const hostW = elTabbarSim.parentElement?.clientWidth || 920;
  // 按 320..920 映射到 38%..100% 的轨道宽度，同时不超过真实可用宽，桌面 2560 与 1440 都饱满齐整
  const ratio = 0.38 + ((state.containerWidth - 320) / (920 - 320)) * 0.62;
  const targetPx = Math.min(hostW, Math.max(240, Math.round(hostW * ratio)));
  elTabbarSim.style.maxWidth = `${targetPx}px`;
  if (elTabbarLimitTag) {
    elTabbarLimitTag.textContent = `模拟宽 ${state.containerWidth}px`;
  }
}

// ---------- 切换当前标签（真实检验上下文留存） ----------
function activateTab(nextId, focusBtn = false) {
  if (!state.tabIds.includes(nextId)) return;
  const prevId = state.activeId;
  if (prevId !== nextId) {
    if (!state.keepContext) {
      const prevMem = state.perTabState[prevId];
      if (prevMem && (prevMem.filterIdx !== 0 || prevMem.draft.trim().length > 0)) {
        state.lostEdits += 1;
      }
      state.perTabState[prevId] = { filterIdx: 0, draft: "", touched: false };
    }
    state.activeId = nextId;
    state.switchCount += 1;
  }
  renderHeroAll();
  if (focusBtn) {
    const btn = elTablist.querySelector(`[data-tab-id="${nextId}"]`);
    if (btn) btn.focus();
  }
}

function removeTab(tabId) {
  if (state.tabIds.length <= 1) return;
  const idx = state.tabIds.indexOf(tabId);
  if (idx < 0) return;
  state.tabIds.splice(idx, 1);
  if (state.activeId === tabId) {
    state.activeId = state.tabIds[Math.max(0, idx - 1)];
  }
  renderHeroAll();
}

function addOneTabBack() {
  const ctx = CONTEXTS[state.contextId];
  const missing = ctx.tabs.find((t) => !state.tabIds.includes(t.id));
  if (!missing) return;
  state.tabIds.push(missing.id);
  renderHeroAll();
}

let lastTabStructureKey = "";

function renderTabBarDOM() {
  const g = currentAudit.geom;
  elTablist.className = `hero-tablist mode-${state.overflowMode}`;
  elFolderFrame.dataset.activeStyle = state.activeStyle;
  elFolderFrame.classList.toggle("state-broken", currentAudit.tone === "bad");
  syncTabbarWidthVisual();

  const compactSlot = g.minSlotPx < 102;
  const veryCramped = g.minSlotPx < 74;
  const structKey = `${state.contextId}|${state.labelMode}|${state.tabIds.join(",")}`;

  // 结构未变时原地更新状态与属性，绝不销毁当前获焦按钮，保证焦点、过渡与读屏连续
  if (structKey === lastTabStructureKey && elTablist.children.length === g.tabs.length) {
    g.tabs.forEach((tab, idx) => {
      const wrap = elTablist.children[idx];
      const btn = wrap?.querySelector(".ftab-btn");
      const isAct = tab.id === state.activeId;
      if (wrap) {
        wrap.className = `ftab-wrap${isAct ? " is-active" : ""}${compactSlot ? " is-compact" : ""}${veryCramped ? " is-very-cramped" : ""}`;
      }
      if (btn) {
        btn.setAttribute("aria-selected", isAct ? "true" : "false");
        btn.setAttribute("tabindex", isAct ? "0" : "-1");
      }
    });
    elTabpanel.setAttribute("aria-labelledby", `htab-${state.activeId}`);
    return;
  }

  lastTabStructureKey = structKey;
  const frag = document.createDocumentFragment();

  for (const tab of g.tabs) {
    const isAct = tab.id === state.activeId;
    const wrap = document.createElement("div");
    wrap.className = `ftab-wrap${isAct ? " is-active" : ""}${compactSlot ? " is-compact" : ""}${veryCramped ? " is-very-cramped" : ""}`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ftab-btn";
    btn.id = `htab-${tab.id}`;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", isAct ? "true" : "false");
    btn.setAttribute("aria-controls", "hero-tabpanel");
    btn.setAttribute("tabindex", isAct ? "0" : "-1");
    btn.dataset.tabId = tab.id;

    const labelStr = state.labelMode === "verbose" ? tab.verbose : tab.short;
    btn.innerHTML = `
      <span class="ftab-icon" aria-hidden="true">${ICONS[tab.icon] || ICONS.dots}</span>
      <span class="ftab-texts">
        <span class="ftab-zh">${labelStr}</span>
        <span class="ftab-en" lang="en">${tab.en}</span>
      </span>
    `;
    btn.addEventListener("click", () => activateTab(tab.id, true));
    btn.addEventListener("keydown", (e) => {
      const ids = state.tabIds;
      const pos = ids.indexOf(tab.id);
      if (e.key === "ArrowRight") {
        e.preventDefault();
        activateTab(ids[(pos + 1) % ids.length], true);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        activateTab(ids[(pos - 1 + ids.length) % ids.length], true);
      } else if (e.key === "Home") {
        e.preventDefault();
        activateTab(ids[0], true);
      } else if (e.key === "End") {
        e.preventDefault();
        activateTab(ids[ids.length - 1], true);
      }
    });

    wrap.appendChild(btn);

    if (g.count > 1) {
      const del = document.createElement("button");
      del.type = "button";
      del.className = "ftab-del";
      del.setAttribute("aria-label", `移除标签 ${tab.short}`);
      del.title = `移除「${tab.short}」`;
      del.textContent = "×";
      del.addEventListener("click", (ev) => {
        ev.stopPropagation();
        removeTab(tab.id);
      });
      wrap.appendChild(del);
    }

    frag.appendChild(wrap);
  }
  elTablist.replaceChildren(frag);
  elTabpanel.setAttribute("aria-labelledby", `htab-${state.activeId}`);
}

function renderActivePanel() {
  const ctx = CONTEXTS[state.contextId];
  const tab = ctx.tabs.find((t) => t.id === state.activeId) || ctx.tabs[0];
  const mem = state.perTabState[tab.id] || { filterIdx: 0, draft: "", touched: false };

  elViewTitle.textContent = tab.viewTitle;
  elViewSummary.textContent = tab.summary;

  elContextBadge.textContent = state.keepContext
    ? "上下文已留存"
    : state.lostEdits > 0
      ? `切页已清空 ${state.lostEdits} 次`
      : "切页清空状态";
  elContextBadge.className = `ctx-mem-pill ${state.keepContext ? "is-on" : "is-off"}`;

  // 筛选芯片
  const fFrag = document.createDocumentFragment();
  tab.filters.forEach((label, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `fchip-btn${mem.filterIdx === idx ? " is-active" : ""}`;
    b.textContent = label;
    b.addEventListener("click", () => {
      state.perTabState[tab.id].filterIdx = idx;
      state.perTabState[tab.id].touched = true;
      renderActivePanel();
      heroDraw();
    });
    fFrag.appendChild(b);
  });
  elViewFilters.replaceChildren(fFrag);

  elViewDraft.placeholder = tab.placeholder;
  if (elViewDraft.value !== mem.draft) {
    elViewDraft.value = mem.draft;
  }

  // 指标行
  elMetricsInline.innerHTML = tab.metrics
    .map((m) => `<span class="metric-chip">${m.label}<strong>${m.value}</strong></span>`)
    .join("");
}

function renderDiagnosisAndSyncControls() {
  const a = currentAudit;
  const g = a.geom;
  const toneCls = a.tone === "ok" ? "is-ok" : a.tone === "warn" ? "is-warn" : "is-bad";

  // 顶部与手机状态徽
  elTopStatusPill.textContent = a.badge;
  elTopStatusPill.className = `status-pill ${toneCls}`;
  elMobileStatusPill.textContent = a.badge;
  elMobileStatusPill.className = `status-pill ${toneCls} mobile-only-pill`;

  // 标尺读数
  elRulerReadout.textContent = `WIDTH ${g.width}px · ${g.count} TABS · ${g.rows} ${g.rows > 1 ? "ROWS" : "ROW"} · MIN ${g.minSlotPx}px`;
  elCanvasWVal.textContent = `${g.width}px`;
  elWidthSlider.value = String(g.width);
  elWidthSliderVal.textContent = `${g.width}px`;

  // 右侧豆绿诊单卡
  elDiagAlertBox.className = `diag-alert-box ${toneCls}`;
  elDiagScoreBadge.textContent = a.badge;
  elDiagScoreBadge.className = `score-badge ${toneCls}`;
  elDiagGrade.textContent = a.grade;
  elDiagSlotMeta.textContent = `SLOT ${g.minSlotPx}px`;
  elDiagHeadline.textContent = a.headline;
  elDiagWhy.textContent = a.why;
  elDiagNext.textContent = `下一步：${a.nextAction}`;

  // 四条设计要点状态
  for (const key of ["grouping", "discoverable", "context", "efficiency"]) {
    const ok = a.pillars[key];
    const row = $(`kp-${key}`);
    const st = $(`kp-${key}-st`);
    row.classList.toggle("is-pass", ok);
    st.textContent = ok ? "已成立" : "待修";
  }

  // 顶部三圆徽探针
  for (const key of ["grouping", "switching", "context"]) {
    const info = a.medallions[key];
    const chip = $(`med-${key}-val`);
    chip.textContent = info.text;
    chip.className = `med-chip ${info.ok ? "is-ok" : "is-bad"}`;
  }

  // 控制条按钮高亮同步
  document.querySelectorAll("[data-ctx]").forEach((b) => b.classList.toggle("is-active", b.dataset.ctx === state.contextId));
  document.querySelectorAll("[data-label-mode]").forEach((b) => b.classList.toggle("is-active", b.dataset.labelMode === state.labelMode));
  document.querySelectorAll("[data-active-style]").forEach((b) => b.classList.toggle("is-active", b.dataset.activeStyle === state.activeStyle));
  document.querySelectorAll("[data-overflow]").forEach((b) => b.classList.toggle("is-active", b.dataset.overflow === state.overflowMode));

  elBtnToggleContext.setAttribute("aria-pressed", state.keepContext ? "true" : "false");
  elBtnToggleContext.className = `toggle-pill ${state.keepContext ? "is-on" : "is-off"}`;
  elBtnToggleContext.textContent = state.keepContext ? "保留位置与输入" : "切页清空";

  const ctx = CONTEXTS[state.contextId];
  elBtnAddTab.disabled = state.tabIds.length >= ctx.tabs.length;
  elBtnAddTab.textContent = state.tabIds.length >= ctx.tabs.length ? "标签已全显" : `+ 补回标签 (${state.tabIds.length}/${ctx.tabs.length})`;
}

function renderHeroAll() {
  currentAudit = auditState(state);
  lastDomWidth = state.containerWidth;
  renderTabBarDOM();
  renderActivePanel();
  renderDiagnosisAndSyncControls();
  heroDraw();
}

// ---------- 轻量宽度拖更（供画布拖动 60fps 顺滑更新） ----------
function setContainerWidthLive(px) {
  const clamped = Math.max(320, Math.min(920, Math.round(px)));
  if (clamped === state.containerWidth) {
    heroDraw();
    return;
  }
  state.containerWidth = clamped;
  currentAudit = auditState(state);
  elCanvasWVal.textContent = `${clamped}px`;
  elWidthSlider.value = String(clamped);
  elWidthSliderVal.textContent = `${clamped}px`;

  if (Math.abs(clamped - lastDomWidth) >= 6) {
    lastDomWidth = clamped;
    renderTabBarDOM();
    renderDiagnosisAndSyncControls();
  } else {
    syncTabbarWidthVisual();
    elRulerReadout.textContent = `WIDTH ${currentAudit.geom.width}px · ${currentAudit.geom.count} TABS · ${currentAudit.geom.rows} ${currentAudit.geom.rows > 1 ? "ROWS" : "ROW"} · MIN ${currentAudit.geom.minSlotPx}px`;
  }
  heroDraw();
}

// ==================== HERO 2D CANVAS（原海报图景 + 宽尺卡轨 + Space 视线验真） ====================
function drawRoundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function initHeroCanvas() {
  const ctx2d = elHeroCanvas.getContext("2d");
  if (!ctx2d) return;

  let intro = 0;

  const drawFrame = (t, dt, { still }) => {
    const rect = elHeroCanvas.getBoundingClientRect();
    const cssW = Math.max(240, rect.width);
    const cssH = Math.max(130, rect.height);
    const dpr = pixelRatio(2);
    if (elHeroCanvas.width !== Math.round(cssW * dpr) || elHeroCanvas.height !== Math.round(cssH * dpr)) {
      elHeroCanvas.width = Math.round(cssW * dpr);
      elHeroCanvas.height = Math.round(cssH * dpr);
    }

    if (still) {
      intro = 1;
    } else {
      intro = Math.min(1, intro + (dt || 0.016) * 1.45);
      if (state.traceActive) {
        state.traceProgress += (dt || 0.016) * 0.72;
        if (state.traceProgress >= 1.15) {
          state.traceActive = false;
          state.traceProgress = 0;
        }
      }
    }

    ctx2d.save();
    ctx2d.scale(dpr, dpr);
    ctx2d.clearRect(0, 0, cssW, cssH);

    // 淡紫温润底面（承袭原海报图表底板）
    ctx2d.fillStyle = "#f1ecf7";
    ctx2d.fillRect(0, 0, cssW, cssH);

    const g = currentAudit.geom;
    const isOk = currentAudit.tone === "ok";
    const isBad = currentAudit.tone === "bad";
    const curCtx = CONTEXTS[state.contextId];
    const curTab = curCtx.tabs.find((x) => x.id === state.activeId) || curCtx.tabs[0];
    const mem = state.perTabState[curTab.id] || { filterIdx: 0 };

    // 1. 顶部：容器宽尺压测轨 + 实时槽块缩略带
    const padX = 14;
    const railY = 14;
    const railW = cssW - padX * 2;
    const normW = (g.width - 320) / (920 - 320);
    const activeRailW = Math.max(88, Math.round(railW * (0.34 + 0.66 * normW)));

    // 轨道底槽
    drawRoundedRect(ctx2d, padX, railY, railW, 30, 8);
    ctx2d.fillStyle = "#e4dcf0";
    ctx2d.fill();

    // 当前模拟容器框
    drawRoundedRect(ctx2d, padX, railY, activeRailW, 30, 8);
    ctx2d.fillStyle = "#fffdf9";
    ctx2d.fill();
    ctx2d.strokeStyle = isBad ? "#c23b2b" : "#785ec8";
    ctx2d.lineWidth = 1.5;
    ctx2d.stroke();

    // 在模拟容器内按真实行排绘制每个标签槽
    const innerPad = 4;
    const slotAreaW = activeRailW - innerPad * 2;
    const count = Math.max(1, g.count);
    const rows = g.rows;
    const rowH = rows > 1 ? 10 : 20;
    const activeIndex = Math.max(0, state.tabIds.indexOf(state.activeId));
    let activeTabCenter = { x: padX + 30, y: railY + 15 };

    if (rows > 1) {
      const firstRowCount = g.rowBreakIndices[0] || Math.ceil(count / 2);
      const secondRowCount = Math.max(1, count - firstRowCount);
      for (let i = 0; i < count; i++) {
        const r = i < firstRowCount ? 0 : 1;
        const cIdx = r === 0 ? i : i - firstRowCount;
        const cTotal = r === 0 ? firstRowCount : secondRowCount;
        const sw = Math.max(10, (slotAreaW - (cTotal - 1) * 3) / cTotal);
        const sx = padX + innerPad + cIdx * (sw + 3);
        const sy = railY + 4 + r * 12;
        drawRoundedRect(ctx2d, sx, sy, sw, rowH, 3);
        ctx2d.fillStyle = i === activeIndex ? (state.activeStyle === "broken" ? "#b83324" : "#624bb3") : "#d5e0cf";
        ctx2d.fill();
        if (i === activeIndex) activeTabCenter = { x: sx + sw / 2, y: sy + rowH / 2 };
      }
    } else {
      const visibleCount = Math.max(1, count - g.hiddenCount);
      const sw = Math.max(12, (slotAreaW - (visibleCount - 1) * 3) / visibleCount);
      for (let i = 0; i < visibleCount; i++) {
        const sx = padX + innerPad + i * (sw + 3);
        const sy = railY + 5;
        drawRoundedRect(ctx2d, sx, sy, sw, rowH, 5);
        const isCur = i === activeIndex;
        if (isCur) {
          ctx2d.fillStyle = state.activeStyle === "broken" ? "#cac5bc" : "#624bb3";
          activeTabCenter = { x: sx + sw / 2, y: sy + rowH / 2 };
        } else {
          ctx2d.fillStyle = g.minSlotPx < 68 ? "#f0c8c3" : "#d3dfd0";
        }
        ctx2d.fill();
      }
    }

    // 紫色可拖拽卡尺柄（提示左右拖动）
    const handleX = padX + activeRailW;
    drawRoundedRect(ctx2d, handleX - 8, railY - 3, 16, 36, 6);
    ctx2d.fillStyle = isBad ? "#b83324" : "#624bb3";
    ctx2d.fill();
    ctx2d.strokeStyle = "#ffffff";
    ctx2d.lineWidth = 1.6;
    ctx2d.beginPath();
    ctx2d.moveTo(handleX - 2.5, railY + 9);
    ctx2d.lineTo(handleX - 2.5, railY + 21);
    ctx2d.moveTo(handleX + 2.5, railY + 9);
    ctx2d.lineTo(handleX + 2.5, railY + 21);
    ctx2d.stroke();

    // 2. 下半部：1:1 原海报紫色扇形饼图 + 淡紫圆角波形曲线卡
    const bodyY = railY + 46;
    const bodyH = cssH - bodyY - 12;
    const pieR = Math.min(38, bodyH * 0.38);
    const pieCx = padX + pieR + 14;
    const pieCy = bodyY + bodyH * 0.5;

    // 饼图底圆（淡紫）
    ctx2d.beginPath();
    ctx2d.arc(pieCx, pieCy, pieR, 0, Math.PI * 2);
    ctx2d.fillStyle = "#dfd2ef";
    ctx2d.fill();

    // 紫罗兰高亮扇区（随筛选芯片和开场动画变化）
    const shift = mem.filterIdx * 0.08;
    const wedgeRatio = Math.min(0.75, Math.max(0.18, (curTab.pie[0] + shift) * intro));
    ctx2d.beginPath();
    ctx2d.moveTo(pieCx, pieCy);
    ctx2d.arc(pieCx, pieCy, pieR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * wedgeRatio);
    ctx2d.closePath();
    ctx2d.fillStyle = state.activeStyle === "broken" ? "#9d96ac" : "#7c62cc";
    ctx2d.fill();

    // 扇形右侧波浪折线面板（1:1 呼应原海报下部紫色波纹框）
    const waveX = pieCx + pieR + 20;
    const waveW = Math.max(90, cssW - waveX - padX);
    drawRoundedRect(ctx2d, waveX, bodyY + 4, waveW, bodyH - 8, 10);
    ctx2d.fillStyle = "#e6dcef";
    ctx2d.fill();

    // 绘制平滑紫色波形
    const pts = curTab.wave.map((v, i) => {
      const adj = Math.min(0.92, Math.max(0.14, v + (mem.filterIdx - 1) * 0.06 * ((i % 2) ? 1 : -1)));
      const px = waveX + 16 + (i / (curTab.wave.length - 1)) * (waveW - 32);
      const py = bodyY + bodyH - 18 - adj * (bodyH - 36) * intro;
      return { x: px, y: py };
    });

    ctx2d.beginPath();
    ctx2d.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i - 1].x + pts[i].x) / 2;
      ctx2d.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, mx, (pts[i - 1].y + pts[i].y) / 2);
    }
    const lastPt = pts[pts.length - 1];
    ctx2d.lineTo(lastPt.x, lastPt.y);
    ctx2d.strokeStyle = isBad ? "#a95248" : "#624bb3";
    ctx2d.lineWidth = 2.2;
    ctx2d.stroke();

    // 末端紫色高亮圆点（原海报标志细节）
    ctx2d.beginPath();
    ctx2d.arc(lastPt.x, lastPt.y, 5.5, 0, Math.PI * 2);
    ctx2d.fillStyle = isBad ? "#b83324" : "#624bb3";
    ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.arc(lastPt.x, lastPt.y, 9.5, 0, Math.PI * 2);
    ctx2d.fillStyle = isBad ? "rgba(184,51,36,0.18)" : "rgba(98,75,179,0.22)";
    ctx2d.fill();

    // 右上角微状态标签
    ctx2d.font = `600 11px "DM Mono", monospace`;
    ctx2d.fillStyle = isOk ? "#166642" : "#b83324";
    ctx2d.textAlign = "right";
    ctx2d.fillText(`${g.width}px · ${g.rows}R`, waveX + waveW - 10, bodyY + 20);
    ctx2d.textAlign = "left";

    // 3. Space 切页注意力路径验真动画
    if (state.traceActive || (still && state.traceProgress > 0)) {
      const p = Math.min(1, state.traceProgress || 1);
      ctx2d.save();
      ctx2d.setLineDash([6, 4]);
      ctx2d.lineWidth = 2.5;
      ctx2d.strokeStyle = isOk ? "#166642" : "#b83324";

      const targetX = pieCx;
      const targetY = pieCy;
      ctx2d.beginPath();
      ctx2d.moveTo(activeTabCenter.x, activeTabCenter.y + 8);
      if (isOk) {
        // 顺滑弧线从当前标签直达内容中心与曲线端点
        const midX = (activeTabCenter.x + targetX) * 0.5;
        const midY = (activeTabCenter.y + targetY) * 0.5 + 10;
        const ex = activeTabCenter.x + (lastPt.x - activeTabCenter.x) * p;
        const ey = activeTabCenter.y + (lastPt.y - activeTabCenter.y) * p;
        ctx2d.quadraticCurveTo(midX, midY, ex, ey);
        ctx2d.stroke();
        ctx2d.setLineDash([]);
        ctx2d.beginPath();
        ctx2d.arc(ex, ey, 6, 0, Math.PI * 2);
        ctx2d.fillStyle = "#166642";
        ctx2d.fill();
      } else {
        // 错态折返碰撞路径：在顶栏来回扫视并撞在隔断线上
        const zig1 = { x: padX + activeRailW * 0.85, y: railY + 14 };
        const zig2 = { x: padX + 26, y: railY + 38 };
        const zig3 = { x: activeTabCenter.x, y: railY + 40 };
        ctx2d.lineTo(zig1.x, zig1.y);
        if (p > 0.35) ctx2d.lineTo(zig2.x, zig2.y);
        if (p > 0.65) ctx2d.lineTo(zig3.x, zig3.y);
        ctx2d.stroke();
        ctx2d.setLineDash([]);
        const dot = p < 0.35 ? zig1 : p < 0.65 ? zig2 : zig3;
        ctx2d.beginPath();
        ctx2d.arc(dot.x, dot.y, 6, 0, Math.PI * 2);
        ctx2d.fillStyle = "#b83324";
        ctx2d.fill();
      }
      ctx2d.restore();
    }

    ctx2d.restore();
  };

  const ctl = loop(elHeroCanvas, drawFrame);
  heroDraw = ctl.draw;
  heroDraw();

  // 水平拖动宽尺：同时原生支持鼠标与触屏（竖滑自动放行滚动页面）
  let dragMode = null; // "mouse" | "touch"
  let startX = 0;
  let startY = 0;
  let startW = state.containerWidth;
  let lockedAxis = null; // "x" | "y" | null

  const applyDeltaX = (dx) => {
    const cssW = Math.max(240, elHeroCanvas.getBoundingClientRect().width);
    const scale = 600 / Math.max(180, cssW * 0.66);
    setContainerWidthLive(startW + dx * scale);
  };

  elHeroCanvas.addEventListener("mousedown", (e) => {
    dragMode = "mouse";
    startX = e.clientX;
    startW = state.containerWidth;
  });

  window.addEventListener("mousemove", (e) => {
    if (dragMode !== "mouse") return;
    applyDeltaX(e.clientX - startX);
  });

  window.addEventListener("mouseup", () => {
    if (dragMode === "mouse") {
      dragMode = null;
      renderHeroAll();
    }
  });

  elHeroCanvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      dragMode = "touch";
      lockedAxis = null;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startW = state.containerWidth;
    },
    { passive: true },
  );

  elHeroCanvas.addEventListener(
    "touchmove",
    (e) => {
      if (dragMode !== "touch" || !e.touches.length) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (!lockedAxis && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        lockedAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
      if (lockedAxis === "x") {
        e.preventDefault();
        applyDeltaX(dx);
      }
    },
    { passive: false },
  );

  elHeroCanvas.addEventListener("touchend", () => {
    if (dragMode === "touch") {
      dragMode = null;
      lockedAxis = null;
      renderHeroAll();
    }
  });
}

// ==================== 绑定 HERO 控件事件 ====================
function bindHeroEvents() {
  // 语境切签
  document.querySelectorAll("[data-ctx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nextCtx = btn.dataset.ctx;
      if (!CONTEXTS[nextCtx] || nextCtx === state.contextId) return;
      const keepCount = state.tabIds.length;
      state.contextId = nextCtx;
      const ctx = CONTEXTS[nextCtx];
      state.tabIds = ctx.tabs.slice(0, Math.min(keepCount, ctx.tabs.length)).map((t) => t.id);
      state.activeId = state.tabIds[0];
      state.perTabState = createFreshTabMemory(ctx);
      renderHeroAll();
    });
  });

  // 草稿输入实时写入 perTabState
  elViewDraft.addEventListener("input", () => {
    if (state.perTabState[state.activeId]) {
      state.perTabState[state.activeId].draft = elViewDraft.value;
      state.perTabState[state.activeId].touched = true;
    }
  });

  // 宽度滑轨
  elWidthSlider.addEventListener("input", () => {
    state.containerWidth = Number(elWidthSlider.value);
    renderHeroAll();
  });

  // 命名长短
  document.querySelectorAll("[data-label-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.labelMode = btn.dataset.labelMode;
      renderHeroAll();
    });
  });

  // 当前态连通样式
  document.querySelectorAll("[data-active-style]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeStyle = btn.dataset.activeStyle;
      renderHeroAll();
    });
  });

  // 溢出策略
  document.querySelectorAll("[data-overflow]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.overflowMode = btn.dataset.overflow;
      renderHeroAll();
    });
  });

  // 上下文记忆开关
  elBtnToggleContext.addEventListener("click", () => {
    state.keepContext = !state.keepContext;
    renderHeroAll();
  });

  // 补回标签
  elBtnAddTab.addEventListener("click", addOneTabBack);

  // 一键校准原海报解 & 复原开场坏态
  $("btn-fix-poster").addEventListener("click", () => applyPreset("poster-4"));
  $("btn-reset-broken").addEventListener("click", () => {
    const fresh = createInitialState();
    const keepCtx = state.contextId;
    Object.assign(state, fresh);
    state.contextId = keepCtx;
    const ctx = CONTEXTS[keepCtx];
    state.tabIds = ctx.tabs.map((t) => t.id);
    state.activeId = ctx.tabs[0].id;
    state.perTabState = createFreshTabMemory(ctx);
    renderHeroAll();
  });

  // 多组合法解 & 双向试错预设
  document.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
  });

  // 切页路径验真（按钮 + Space 快捷键）
  const triggerTrace = () => {
    state.traceActive = true;
    state.traceProgress = 0.04;
    heroDraw();
  };
  $("btn-trace").addEventListener("click", triggerTrace);

  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space") return;
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON" || tag === "A") return;
    if (!$("lightbox").hidden) return;
    const heroRect = document.querySelector(".hero")?.getBoundingClientRect();
    if (heroRect && heroRect.bottom > 120 && heroRect.top < window.innerHeight) {
      e.preventDefault();
      triggerTrace();
    }
  });
}

function applyPreset(name) {
  const ctx = CONTEXTS[state.contextId];
  const ids = ctx.tabs.map((t) => t.id);
  if (name === "poster-4") {
    state.tabIds = ids.slice(0, 4);
    state.activeId = ids[0];
    state.containerWidth = 680;
    state.labelMode = "concise";
    state.activeStyle = "folder";
    state.overflowMode = "single";
    state.keepContext = true;
  } else if (name === "minimal-3") {
    state.tabIds = ids.slice(0, 3);
    state.activeId = ids[0];
    state.containerWidth = 600;
    state.labelMode = "concise";
    state.activeStyle = "underline";
    state.overflowMode = "single";
    state.keepContext = true;
  } else if (name === "mobile-3") {
    state.tabIds = ids.slice(0, 3);
    state.activeId = ids[0];
    state.containerWidth = 360;
    state.labelMode = "concise";
    state.activeStyle = "folder";
    state.overflowMode = "single";
    state.keepContext = true;
  } else if (name === "wide-5") {
    state.tabIds = ids.slice(0, 5);
    state.activeId = ids[0];
    state.containerWidth = 820;
    state.labelMode = "concise";
    state.activeStyle = "folder";
    state.overflowMode = "single";
    state.keepContext = true;
  } else if (name === "err-single") {
    state.tabIds = ids.slice(0, 1);
    state.activeId = ids[0];
    state.containerWidth = 600;
    state.labelMode = "concise";
    state.activeStyle = "folder";
    state.overflowMode = "single";
    state.keepContext = true;
  } else if (name === "err-scroll") {
    state.tabIds = ids.slice(0, 7);
    state.activeId = ids[0];
    state.containerWidth = 440;
    state.labelMode = "verbose";
    state.activeStyle = "folder";
    state.overflowMode = "scroll";
    state.keepContext = true;
  } else if (name === "err-cramped") {
    state.tabIds = ids.slice(0, 5);
    state.activeId = ids[0];
    state.containerWidth = 330;
    state.labelMode = "concise";
    state.activeStyle = "folder";
    state.overflowMode = "single";
    state.keepContext = true;
  } else if (name === "err-lost") {
    state.tabIds = ids.slice(0, 4);
    state.activeId = ids[0];
    state.containerWidth = 680;
    state.labelMode = "concise";
    state.activeStyle = "folder";
    state.overflowMode = "single";
    state.keepContext = false;
  }
  renderHeroAll();
}

// ==================== 01 纸夹隐喻与解剖 ====================
function initAnatomySection() {
  const specimen = $("anatomy-specimen");
  const titleEl = $("ana-part-title");
  const descEl = $("ana-part-desc");

  const STYLE_META = {
    folder: {
      name: "档案夹连通",
      seam: "原海报采用的就是经典档案夹形态：紫色当前页签底边与下方内容框融为一体，顶缘配一枚小圆点加强落点，未选页签退成柔和豆绿。哪怕闭眼扫过，也不会错认归属。",
    },
    underline: {
      name: "现代底线",
      seam: "常见于 Material Design 3 与 Web 文档：用 3px 高对比紫线贴住当前标签底缘，画面更轻盈，但务必让底线贴齐整条分割轨，避免浮空。",
    },
    pill: {
      name: "胶囊分段",
      seam: "把 2–4 个短标签装进浅豆绿外框，当前项以实心紫胶囊浮出；适合局部小组件（如按周/月/年切换），不适合承载庞杂的大模块。",
    },
    vertical: {
      name: "左侧竖签",
      seam: "当标签数增长到 6–8 组或标签词偏长时，把顶排转到左侧竖排，每条都能舒展展示文字，不再受横向宽度挤压。",
    },
  };

  const PART_DESC = {
    tablist: "标签列表只放同级平行主题，所有候选入口一目了然；用户不需要靠猜才知道还有哪些视图可看。",
    label: "标签名称是内容预告，用 2–4 个清晰名词或动宾短语即可，切忌把「其他」或冗长前缀塞进页签。",
    panel: "同一时刻只呈现当前激活的一块内容面板，让用户的注意力与任务上下文始终留在同一个空间坐标里。",
  };

  let curStyle = "folder";
  let curPart = "seam";

  const updateAnatomy = () => {
    specimen.className = `anatomy-specimen style-${curStyle}`;
    specimen.dataset.focusPart = curPart;
    document.querySelectorAll("[data-ana-style]").forEach((b) => b.classList.toggle("is-active", b.dataset.anaStyle === curStyle));
    document.querySelectorAll(".hotspot-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.part === curPart));

    if (curPart === "seam") {
      titleEl.textContent = `${STYLE_META[curStyle].name} · 视觉连通锚定当前面板`;
      descEl.textContent = STYLE_META[curStyle].seam;
    } else if (curPart === "tablist") {
      titleEl.textContent = `${STYLE_META[curStyle].name} · 同级列表一目了然`;
      descEl.textContent = PART_DESC.tablist;
    } else if (curPart === "label") {
      titleEl.textContent = `${STYLE_META[curStyle].name} · 简短预告降低猜测成本`;
      descEl.textContent = PART_DESC.label;
    } else {
      titleEl.textContent = `${STYLE_META[curStyle].name} · 单一面板稳住上下文`;
      descEl.textContent = PART_DESC.panel;
    }
  };

  document.querySelectorAll("[data-ana-style]").forEach((btn) => {
    btn.addEventListener("click", () => {
      curStyle = btn.dataset.anaStyle;
      updateAnatomy();
    });
  });

  document.querySelectorAll(".hotspot-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      curPart = btn.dataset.part;
      updateAnatomy();
    });
  });

  updateAnatomy();
}

// ==================== 02 槽宽与数量预算 2D Canvas 实测仪 ====================
function initBudgetSection() {
  const canvas = $("budget-canvas");
  const ctx2d = canvas.getContext("2d");
  const countVal = $("budget-count-val");
  const pill = $("budget-status-dot");
  const explain = $("budget-explain");
  const decBtn = $("budget-dec");
  const incBtn = $("budget-inc");

  const bState = { count: 4, vp: 375, verbose: false };

  const renderCanvas = () => {
    const m = computeBudgetModel(bState.count, bState.vp, bState.verbose);
    countVal.textContent = `${bState.count} 个`;
    decBtn.disabled = bState.count <= 2;
    incBtn.disabled = bState.count >= 9;

    pill.textContent = m.verdict;
    pill.className = `b-pill is-${m.status}`;
    explain.textContent = m.explain;

    if (!ctx2d) return;
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(260, rect.width);
    const cssH = Math.max(180, rect.height);
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }

    ctx2d.save();
    ctx2d.scale(dpr, dpr);
    ctx2d.clearRect(0, 0, cssW, cssH);
    ctx2d.fillStyle = "#fcf8f0";
    ctx2d.fillRect(0, 0, cssW, cssH);

    // 将模拟视口按比例居中映射进画布
    const padOuter = 20;
    const maxDrawW = cssW - padOuter * 2;
    const scale = Math.min(1, maxDrawW / 960);
    const frameW = Math.max(210, Math.min(maxDrawW, bState.vp * Math.max(scale, 0.72)));
    const fx = (cssW - frameW) / 2;
    const fy = 36;

    // 顶部标尺线
    ctx2d.strokeStyle = "#856bd1";
    ctx2d.lineWidth = 1.2;
    ctx2d.beginPath();
    ctx2d.moveTo(fx, 18);
    ctx2d.lineTo(fx + frameW, 18);
    ctx2d.moveTo(fx, 13);
    ctx2d.lineTo(fx, 23);
    ctx2d.moveTo(fx + frameW, 13);
    ctx2d.lineTo(fx + frameW, 23);
    ctx2d.stroke();

    ctx2d.fillStyle = "#493594";
    ctx2d.font = `600 12px "DM Mono", monospace`;
    ctx2d.textAlign = "center";
    ctx2d.fillText(`模拟容器 ${bState.vp}px · 单槽实算 ${m.slotW}px`, cssW / 2, 14);

    // 模拟卡片外框
    drawRoundedRect(ctx2d, fx, fy, frameW, cssH - fy - 18, 12);
    ctx2d.fillStyle = "#fffdf9";
    ctx2d.fill();
    ctx2d.strokeStyle = m.status === "bad" ? "#b83324" : "#856bd1";
    ctx2d.lineWidth = 1.6;
    ctx2d.stroke();

    // 画模拟标签排
    const padIn = 10;
    const barW = frameW - padIn * 2;
    const gap = 4;
    const rows = m.wrapRows > 1 ? 2 : 1;
    const perRow = rows === 2 ? Math.ceil(m.labels.length / 2) : m.labels.length;
    const tabH = rows === 2 ? 28 : 34;

    for (let i = 0; i < m.labels.length; i++) {
      const r = rows === 2 && i >= perRow ? 1 : 0;
      const col = r === 0 ? i : i - perRow;
      const colCount = r === 0 ? perRow : m.labels.length - perRow;
      const tw = (barW - gap * (colCount - 1)) / colCount;
      const tx = fx + padIn + col * (tw + gap);
      const ty = fy + 10 + r * (tabH + 4);

      drawRoundedRect(ctx2d, tx, ty, tw, tabH, 7);
      const isFirst = i === 0;
      ctx2d.fillStyle = isFirst ? (m.status === "bad" ? "#b83324" : "#624bb3") : m.status === "bad" ? "#f4d7d4" : "#dce4d4";
      ctx2d.fill();

      ctx2d.save();
      ctx2d.beginPath();
      ctx2d.rect(tx + 3, ty, Math.max(4, tw - 6), tabH);
      ctx2d.clip();
      ctx2d.font = `700 12px "Noto Sans SC", sans-serif`;
      ctx2d.fillStyle = isFirst ? "#ffffff" : m.status === "bad" ? "#8c2318" : "#161b18";
      ctx2d.textAlign = "center";
      ctx2d.textBaseline = "middle";
      ctx2d.fillText(m.labels[i], tx + tw / 2, ty + tabH / 2);
      ctx2d.restore();
    }

    // 下方面板骨架示意 + 68px 舒适点击线
    const paneY = fy + 10 + rows * (tabH + 4) + 6;
    const paneH = Math.max(36, cssH - paneY - 30);
    drawRoundedRect(ctx2d, fx + padIn, paneY, barW, paneH, 8);
    ctx2d.fillStyle = m.status === "bad" ? "#fdf0ee" : "#f1ecf7";
    ctx2d.fill();

    // 标尺进度条：展示单槽宽相对于 68px 经验舒适下限的位置
    const meterY = paneY + paneH / 2;
    const meterW = Math.max(100, barW - 28);
    const meterX = fx + padIn + 14;
    drawRoundedRect(ctx2d, meterX, meterY - 5, meterW, 10, 5);
    ctx2d.fillStyle = "#e3d9ef";
    ctx2d.fill();

    const fillRatio = Math.min(1, m.slotW / 160);
    drawRoundedRect(ctx2d, meterX, meterY - 5, Math.max(8, meterW * fillRatio), 10, 5);
    ctx2d.fillStyle = m.status === "ok" ? "#166642" : m.status === "warn" ? "#8f5008" : "#b83324";
    ctx2d.fill();

    // 68px 经验警戒线
    const safeX = meterX + meterW * (68 / 160);
    ctx2d.strokeStyle = "#161b18";
    ctx2d.lineWidth = 1.5;
    ctx2d.setLineDash([3, 3]);
    ctx2d.beginPath();
    ctx2d.moveTo(safeX, meterY - 12);
    ctx2d.lineTo(safeX, meterY + 12);
    ctx2d.stroke();
    ctx2d.setLineDash([]);

    ctx2d.font = `600 11px "DM Mono", monospace`;
    ctx2d.fillStyle = "#35403a";
    ctx2d.textAlign = "left";
    ctx2d.textBaseline = "top";
    ctx2d.fillText("68px 触控舒适下限（经验值）", Math.min(safeX + 5, fx + frameW - 170), meterY + 11);

    ctx2d.restore();
  };

  const budgetLoop = loop(canvas, () => renderCanvas());

  decBtn.addEventListener("click", () => {
    if (bState.count > 2) {
      bState.count--;
      budgetLoop.draw();
    }
  });
  incBtn.addEventListener("click", () => {
    if (bState.count < 9) {
      bState.count++;
      budgetLoop.draw();
    }
  });

  document.querySelectorAll("[data-bvp]").forEach((btn) => {
    btn.addEventListener("click", () => {
      bState.vp = Number(btn.dataset.bvp);
      document.querySelectorAll("[data-bvp]").forEach((b) => b.classList.toggle("is-active", b === btn));
      budgetLoop.draw();
    });
  });

  document.querySelectorAll("[data-blen]").forEach((btn) => {
    btn.addEventListener("click", () => {
      bState.verbose = btn.dataset.blen === "long";
      document.querySelectorAll("[data-blen]").forEach((b) => b.classList.toggle("is-active", b === btn));
      budgetLoop.draw();
    });
  });

  renderCanvas();
}

// ==================== 03 四大暗礁交互微诊台 ====================
function initPitfallsSection() {
  // 1. 双排跳层
  let mrFixed = false;
  let mrSwapped = false;
  let mrActive = "概览";
  const renderMR = () => {
    const card = $("pit-multirow");
    const demo = $("pit-multirow-demo");
    card.dataset.fixed = String(mrFixed);
    card.querySelector(".pit-toggle").textContent = mrFixed ? "回到错态" : "看修复方案";
    if (mrFixed) {
      demo.innerHTML = `
        <div class="demo-row">
          ${["概览", "数据", "成员", "设置"]
            .map((n) => `<button type="button" class="mini-tab${mrActive === n ? " is-on" : ""}" data-mr="${n}">${n}</button>`)
            .join("")}
        </div>
        <div class="demo-pane">安全与权限分别收纳进「设置 / 成员」内部；顶栏始终稳守单排 4 签，点哪一个都不会跳行。</div>
      `;
    } else {
      const topRow = mrSwapped ? ["概览", "数据", "成员", "设置"] : ["安全", "权限", "账单"];
      const botRow = mrSwapped ? ["安全", "权限", "账单"] : ["概览", "数据", "成员", "设置"];
      demo.innerHTML = `
        <div class="demo-multirow-box">
          <div class="demo-row">
            ${topRow.map((n) => `<button type="button" class="mini-tab${mrActive === n ? " is-on" : ""}" data-mr="${n}" data-mr-row="back">${n}</button>`).join("")}
          </div>
          <div class="demo-row">
            ${botRow.map((n) => `<button type="button" class="mini-tab${mrActive === n ? " is-on" : ""}" data-mr="${n}" data-mr-row="front">${n}</button>`).join("")}
          </div>
          <div class="demo-pane">${mrSwapped ? `你点了后排「${mrActive}」，整排突然跳到前排！刚记住的「概览」位置全乱了。` : "点后排「安全 / 权限 / 账单」试试：整排会突然上下换位！"}</div>
        </div>
      `;
    }
    demo.querySelectorAll("[data-mr]").forEach((b) => {
      b.addEventListener("click", () => {
        mrActive = b.dataset.mr;
        if (!mrFixed && b.dataset.mrRow === "back") mrSwapped = !mrSwapped;
        renderMR();
      });
    });
  };

  // 2. 流程步骤误用标签
  let stepFixed = false;
  let stepIdx = 0;
  const renderSteps = () => {
    const card = $("pit-steps");
    const demo = $("pit-steps-demo");
    card.dataset.fixed = String(stepFixed);
    card.querySelector(".pit-toggle").textContent = stepFixed ? "回到错态" : "看修复方案";
    const names = ["1. 填写地址", "2. 选择支付", "3. 确认提交"];
    if (stepFixed) {
      demo.innerHTML = `
        <div class="demo-steps-tabs">
          ${names
            .map((n, i) => `<button type="button" class="mini-tab${i < stepIdx ? " is-step-done" : i === stepIdx ? " is-on" : ""}" data-st="${i}">${n}</button>`)
            .join("")}
        </div>
        <div class="demo-pane">
          步骤条按顺序引导：当前停在第 ${stepIdx + 1} 步「${names[stepIdx]}」。
          <button type="button" class="mini-tab is-on" id="step-next-btn" style="margin-left:8px;border-radius:6px">${stepIdx < 2 ? "完成并下一步 →" : "重新演示"}</button>
        </div>
      `;
      demo.querySelector("#step-next-btn").addEventListener("click", () => {
        stepIdx = (stepIdx + 1) % 3;
        renderSteps();
      });
    } else {
      demo.innerHTML = `
        <div class="demo-steps-tabs">
          ${["填写地址", "选择支付", "确认提交"]
            .map((n, i) => `<button type="button" class="mini-tab${stepIdx === i ? " is-on" : ""}" data-st="${i}">${n}</button>`)
            .join("")}
        </div>
        <div class="demo-pane">${stepIdx === 2 ? "注意：还没填地址和付款方式，却直接点进了「确认提交」并看到一堆报错！" : "点第三个标签「确认提交」试试：平行标签会诱导用户跳过前置步骤。"}</div>
      `;
    }
    demo.querySelectorAll("[data-st]").forEach((b) => {
      b.addEventListener("click", () => {
        const next = Number(b.dataset.st);
        if (!stepFixed || next <= stepIdx + 1) {
          stepIdx = next;
          renderSteps();
        }
      });
    });
  };

  // 3. 对比数据强拆标签
  let cmpFixed = false;
  let cmpTab = "a";
  let cmpFlips = 0;
  const renderCmp = () => {
    const card = $("pit-compare");
    const demo = $("pit-compare-demo");
    card.dataset.fixed = String(cmpFixed);
    card.querySelector(".pit-toggle").textContent = cmpFixed ? "回到错态" : "看修复方案";
    if (cmpFixed) {
      demo.innerHTML = `
        <div class="demo-split-fixed">
          <div class="demo-plan-col"><strong>基础版 · ¥49/月</strong>席位 5 人 · 留存 30 天</div>
          <div class="demo-plan-col"><strong>专业版 · ¥129/月</strong>席位 25 人 · 留存 365 天</div>
        </div>
      `;
    } else {
      demo.innerHTML = `
        <div class="demo-steps-tabs">
          <button type="button" class="mini-tab${cmpTab === "a" ? " is-on" : ""}" data-cmp="a">基础版套餐</button>
          <button type="button" class="mini-tab${cmpTab === "b" ? " is-on" : ""}" data-cmp="b">专业版套餐</button>
        </div>
        <div class="demo-pane">${
          cmpTab === "a"
            ? `<strong>基础版：</strong>月费 ¥49 · 席位 5 人 · 历史留存 30 天（已来回翻找 <span class="mono-num">${cmpFlips}</span> 次）`
            : `<strong>专业版：</strong>月费 ¥129 · 席位 25 人 · 历史留存 365 天（刚才基础版席位是多少？已来回翻找 <span class="mono-num">${cmpFlips}</span> 次）`
        }</div>
      `;
      demo.querySelectorAll("[data-cmp]").forEach((b) => {
        b.addEventListener("click", () => {
          if (cmpTab !== b.dataset.cmp) {
            cmpTab = b.dataset.cmp;
            cmpFlips++;
            renderCmp();
          }
        });
      });
    }
  };

  // 4. 水平套水平套娃
  let nestFixed = false;
  let n1 = 0;
  let n2 = 0;
  const renderNest = () => {
    const card = $("pit-nested");
    const demo = $("pit-nested-demo");
    card.dataset.fixed = String(nestFixed);
    card.querySelector(".pit-toggle").textContent = nestFixed ? "回到错态" : "看修复方案";
    const projs = ["项目 A", "项目 B", "项目 C"];
    const views = ["概览", "数据", "成员"];
    if (nestFixed) {
      demo.innerHTML = `
        <div class="demo-sidebar-fixed">
          <div class="demo-side-col">
            ${projs.map((p, i) => `<button type="button" class="mini-tab${n1 === i ? " is-on" : ""}" style="border-radius:6px" data-n1="${i}">${p}</button>`).join("")}
          </div>
          <div>
            <div class="demo-row">
              ${views.map((v, i) => `<button type="button" class="mini-tab${n2 === i ? " is-on" : ""}" data-n2="${i}">${v}</button>`).join("")}
            </div>
            <div class="demo-pane">左侧目录管「哪个项目」，顶部标签管「${projs[n1]} 的 ${views[n2]}」，层级一眼分清。</div>
          </div>
        </div>
      `;
    } else {
      demo.innerHTML = `
        <div class="demo-nested-wrap">
          <div class="demo-row">${projs.map((p, i) => `<button type="button" class="mini-tab${n1 === i ? " is-on" : ""}" data-n1="${i}">${p}</button>`).join("")}</div>
          <div class="demo-row is-inner">${views.map((v, i) => `<button type="button" class="mini-tab${n2 === i ? " is-on" : ""}" data-n2="${i}">${v}</button>`).join("")}</div>
          <div class="demo-pane">两排同向水平标签叠在一起：现在看的是「${projs[n1]} → ${views[n2]}」，但上下从属关系非常模糊。</div>
        </div>
      `;
    }
    demo.querySelectorAll("[data-n1]").forEach((b) => b.addEventListener("click", () => { n1 = Number(b.dataset.n1); renderNest(); }));
    demo.querySelectorAll("[data-n2]").forEach((b) => b.addEventListener("click", () => { n2 = Number(b.dataset.n2); renderNest(); }));
  };

  document.querySelectorAll(".pit-toggle[data-pit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.pit;
      if (k === "multirow") { mrFixed = !mrFixed; renderMR(); }
      else if (k === "steps") { stepFixed = !stepFixed; renderSteps(); }
      else if (k === "compare") { cmpFixed = !cmpFixed; renderCmp(); }
      else if (k === "nested") { nestFixed = !nestFixed; renderNest(); }
    });
  });

  renderMR();
  renderSteps();
  renderCmp();
  renderNest();
}

// ==================== 04 WAI-ARIA 键盘无障碍演练台 ====================
function initAriaSection() {
  const tabs = [...document.querySelectorAll("#aria-tablist .aria-tab")];
  const panel = $("aria-panel-live");
  const pTitle = $("aria-panel-title");
  const pDesc = $("aria-panel-desc");
  const inspector = $("aria-inspector");

  const NAMES = ["概览", "数据", "成员", "设置"];
  let mode = "auto"; // "auto" | "manual"
  let selectedIdx = 0;
  let focusIdx = 0;
  let lastKey = "初始状态";

  const renderAria = (doRealFocus = false) => {
    tabs.forEach((t, i) => {
      const isSel = i === selectedIdx;
      const isFoc = i === focusIdx;
      t.setAttribute("aria-selected", isSel ? "true" : "false");
      t.setAttribute("tabindex", isFoc ? "0" : "-1");
      t.classList.toggle("is-focused-sim", isFoc);
      if (doRealFocus && isFoc) t.focus();
    });

    panel.setAttribute("aria-labelledby", `atab-${selectedIdx}`);
    pTitle.textContent = `当前激活面板：${NAMES[selectedIdx]}`;
    pDesc.textContent =
      mode === "auto"
        ? `自动激活模式（${lastKey}）：方向键移动焦点时立刻同步切换面板；仅焦点标签 tabindex="0"，按 Tab 直接跳进内容面板。`
        : focusIdx === selectedIdx
          ? `手动激活模式（${lastKey}）：焦点与激活面板都在「${NAMES[selectedIdx]}」。按方向键只会移动黄色焦点框，按 Enter 才真正切换面板。`
          : `手动激活模式（${lastKey}）：焦点已移到「${NAMES[focusIdx]}」，但面板仍停在「${NAMES[selectedIdx]}」（适合面板需远程加载时防误触发），点 Enter 激活。`;

    const lines = tabs.map((t, i) => {
      const mark = i === focusIdx ? " <- FOCUS" : "";
      return `  <button role="tab" aria-selected="${i === selectedIdx}" tabindex="${i === focusIdx ? "0" : "-1"}">${NAMES[i]}</button>${mark}`;
    });
    inspector.textContent = `<div role="tablist">\n${lines.join("\n")}\n</div>\n<div role="tabpanel" aria-labelledby="atab-${selectedIdx}">...</div>`;
  };

  const handleKey = (key, doRealFocus) => {
    if (key === "ArrowRight") {
      focusIdx = (focusIdx + 1) % tabs.length;
      if (mode === "auto") selectedIdx = focusIdx;
      lastKey = "按 →";
    } else if (key === "ArrowLeft") {
      focusIdx = (focusIdx - 1 + tabs.length) % tabs.length;
      if (mode === "auto") selectedIdx = focusIdx;
      lastKey = "按 ←";
    } else if (key === "Home") {
      focusIdx = 0;
      if (mode === "auto") selectedIdx = 0;
      lastKey = "按 Home";
    } else if (key === "End") {
      focusIdx = tabs.length - 1;
      if (mode === "auto") selectedIdx = focusIdx;
      lastKey = "按 End";
    } else if (key === "Enter" || key === " ") {
      selectedIdx = focusIdx;
      lastKey = "按 Enter 激活";
    }
    renderAria(doRealFocus);
  };

  tabs.forEach((t, i) => {
    t.addEventListener("click", () => {
      focusIdx = i;
      selectedIdx = i;
      lastKey = `点击「${NAMES[i]}」`;
      renderAria(false);
    });
    t.addEventListener("keydown", (e) => {
      if (["ArrowRight", "ArrowLeft", "Home", "End", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        handleKey(e.key, true);
      }
    });
  });

  document.querySelectorAll("[data-vkey]").forEach((btn) => {
    btn.addEventListener("click", () => handleKey(btn.dataset.vkey, false));
  });

  document.querySelectorAll("[data-aria-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.ariaMode;
      document.querySelectorAll("[data-aria-mode]").forEach((b) => b.classList.toggle("is-active", b === btn));
      if (mode === "auto") selectedIdx = focusIdx;
      lastKey = mode === "auto" ? "切到自动激活" : "切到手动激活";
      renderAria(false);
    });
  });

  renderAria(false);
}

// ==================== 05 决策矩阵 ====================
function initDecisionSection() {
  const flags = { compare: false, sequential: false, many: false, thumbNav: false };
  const resultBox = $("decision-result");
  const titleEl = $("dec-title");
  const reasonEl = $("dec-reason");
  const linkEl = $("dec-link");

  const renderDec = () => {
    const res = evaluateDecision(flags);
    resultBox.className = `decision-result ${res.useTabs ? "is-tabs" : "is-switch"}`;
    titleEl.textContent = res.title;
    reasonEl.textContent = res.reason;
    linkEl.href = res.url;
    linkEl.textContent = res.useTabs ? "留在当前页 · 265 标签页布局" : `前往对应版式页（No. ${res.target}）→`;
    document.querySelectorAll(".dec-chip").forEach((b) => {
      b.setAttribute("aria-pressed", flags[b.dataset.flag] ? "true" : "false");
    });
  };

  document.querySelectorAll(".dec-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.flag;
      flags[k] = !flags[k];
      renderDec();
    });
  });

  $("dec-reset").addEventListener("click", () => {
    for (const k of Object.keys(flags)) flags[k] = false;
    renderDec();
  });

  renderDec();
}

// ==================== 06 眼力小练习 ====================
function initQuizSection() {
  const cards = [...document.querySelectorAll(".quiz-card")];
  const fb = $("quiz-feedback");
  const verdict = $("qf-verdict");
  const pickedExp = $("qf-picked-explain");
  const allList = $("qf-all-list");

  const resetQuiz = () => {
    cards.forEach((c) => {
      c.classList.remove("is-picked-ok", "is-picked-bad", "is-reveal-ok");
      c.disabled = false;
    });
    fb.hidden = true;
  };

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const choice = card.dataset.choice;
      const item = QUIZ_ITEMS.find((q) => q.key === choice);
      if (!item) return;

      cards.forEach((c) => {
        c.classList.remove("is-picked-ok", "is-picked-bad", "is-reveal-ok");
        if (c.dataset.choice === "A") c.classList.add("is-reveal-ok");
      });
      card.classList.add(item.correct ? "is-picked-ok" : "is-picked-bad");

      verdict.textContent = item.correct ? `✓ 答对了！${item.title} 最稳妥` : `× 再细看一处：你选了 ${item.title}，正确答案是方案 A`;
      pickedExp.textContent = item.explain;
      allList.innerHTML = QUIZ_ITEMS.map((q) => `<li><strong>${q.title}${q.correct ? "（正确）" : ""}：</strong>${q.explain}</li>`).join("");
      fb.hidden = false;
    });
  });

  $("quiz-retry").addEventListener("click", resetQuiz);
}

// ==================== 07 原海报放大灯箱 ====================
function initPosterLightbox() {
  const posterImg = $("poster");
  const openBtn = $("poster-open");
  const lb = $("lightbox");
  const lbImg = $("lb-img");
  const lbStage = $("lb-stage");
  const zoomVal = $("lb-zoom-val");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  const applyTransform = () => {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomVal.textContent = `${Math.round(scale * 100)}%`;
  };

  const openLightbox = () => {
    lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    $("lb-close").focus();
  };

  const closeLightbox = () => {
    lb.hidden = true;
    openBtn.focus();
  };

  openBtn.addEventListener("click", openLightbox);
  $("lb-close").addEventListener("click", closeLightbox);
  $("lb-zoom-in").addEventListener("click", () => {
    scale = Math.min(3.5, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  $("lb-zoom-out").addEventListener("click", () => {
    scale = Math.max(0.6, +(scale - 0.35).toFixed(2));
    applyTransform();
  });
  $("lb-reset").addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbStage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = Math.max(0.6, Math.min(3.5, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
      applyTransform();
    },
    { passive: false },
  );

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage) {
      closeLightbox();
      return;
    }
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbStage.setPointerCapture(e.pointerId);
  });

  lbStage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });

  lbStage.addEventListener("pointerup", () => {
    dragging = false;
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) closeLightbox();
  });
}

// ==================== 启动 ====================
initHeroCanvas();
bindHeroEvents();
renderHeroAll();
initAnatomySection();
initBudgetSection();
initPitfallsSection();
initAriaSection();
initDecisionSection();
initQuizSection();
initPosterLightbox();
window.addEventListener("resize", () => {
  syncTabbarWidthVisual();
  heroDraw();
});

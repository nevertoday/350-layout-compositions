// 131 斑点扫描模式 · 全页交互总控
import {
  SCENES,
  PRESETS,
  createInitialState,
  applyPreset,
  evaluate,
} from "./model.js";
import { reducedMotion } from "../../lib/stage.js";
import { mountHeroStage } from "./stage-hero.js";
import { SCAN_MODES, mountModesStage } from "./stage-modes.js";

// ==================== 1. 开场星图主舞台与单真源 UI 同步 ====================
let state = createInitialState();
let heroStage = null;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const heroCanvas = $("#hero-canvas");
const contrastSlider = $("#contrast-slider");
const contrastValue = $("#contrast-value");
const statusPill = $("#hero-status-pill");
const diagTag = $("#diag-tag");
const diagTitle = $("#diag-title");
const diagWhy = $("#diag-why");
const diagAction = $("#diag-action");
const diagFixBtn = $("#diag-fix-btn");
const diagMetrics = $("#diag-metrics");
const selectedInfo = $("#selected-node-info");
const principlesGrid = $("#principles-grid");
const tipWave = $("#tip-wave-path");
const tipEndRing = $("#tip-end-ring");
const heroTitleDots = $("#hero-title-spots");
const taskHintEl = $("#scene-task-hint");
const quickDiagText = $("#quick-diag-text");
const quickDiagBtn = $("#quick-diag-btn");

const PRINCIPLE_ICONS = {
  multiEntry: `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="20" cy="20" r="7" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>`,
  jumpBrowse: `<svg viewBox="0 0 44 40" aria-hidden="true"><circle cx="6" cy="26" r="3" fill="#F4F7FA"/><path d="M8 23 Q15 11 22 23" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M23 23 Q31 6 38 23" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="38" cy="26" r="3" fill="#F4F7FA"/></svg>`,
  dispersed: `<svg viewBox="0 0 44 40" aria-hidden="true"><circle cx="10" cy="14" r="3" fill="#0D3CFB"/><circle cx="20" cy="10" r="3.4" fill="currentColor"/><circle cx="32" cy="12" r="2.8" fill="currentColor"/><circle cx="14" cy="25" r="3.2" fill="currentColor"/><circle cx="26" cy="22" r="2.6" fill="#0D3CFB"/><circle cx="35" cy="26" r="3.4" fill="currentColor"/><circle cx="21" cy="31" r="2.6" fill="#8449EF"/></svg>`,
  signalBoost: `<svg viewBox="0 0 44 40" aria-hidden="true"><path d="M5 20 Q22 7 39 20 Q22 33 5 20 Z" fill="currentColor"/><circle cx="22" cy="20" r="5" fill="#06080B"/></svg>`,
  freeRhythm: `<svg viewBox="0 0 44 40" aria-hidden="true"><path d="M6 12 Q14 7 22 12 T38 12" fill="none" stroke="#F4F7FA" stroke-width="2.4" stroke-linecap="round"/><path d="M6 20 Q14 15 22 20 T38 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M6 28 Q14 23 22 28 T38 28" fill="none" stroke="#F4F7FA" stroke-width="2.4" stroke-linecap="round"/></svg>`,
};

let cachedW = 1000, cachedH = 520;
let uiTimer = 0;
let lastUiSync = 0;
let lastPrinciplesHtml = "";
let lastMetricsHtml = "";
let lastSelectedHtml = "";

function setState(updater, fromDrag = false) {
  state = typeof updater === "function" ? updater(state) : updater;
  if (fromDrag) {
    // 拖动期间 Canvas 始终以 60fps 渲染实时几何与 HUD，外围大块 DOM 说明卡节流 120ms 同步以保持慢机软件渲染 60fps
    const now = performance.now();
    if (now - lastUiSync >= 120) {
      lastUiSync = now;
      if (uiTimer) { clearTimeout(uiTimer); uiTimer = 0; }
      syncHeroUI(false);
      if (reducedMotion.matches) heroStage?.draw();
    } else if (!uiTimer) {
      uiTimer = setTimeout(() => {
        uiTimer = 0;
        lastUiSync = performance.now();
        syncHeroUI(false);
        if (reducedMotion.matches) heroStage?.draw();
      }, 120);
    }
  } else {
    if (uiTimer) { clearTimeout(uiTimer); uiTimer = 0; }
    lastUiSync = performance.now();
    syncHeroUI(true);
    if (reducedMotion.matches) heroStage?.draw();
  }
}

function applySmartFix(fixType) {
  if (fixType === "raiseContrast") {
    setState((s) => ({ ...s, contrast: 72, signalMode: "compound" }));
  } else if (fixType === "clearDecoys") {
    setState((s) => ({
      ...s,
      hollowTrap: false,
      nodes: {
        ...s.nodes,
        decoy1: { ...s.nodes.decoy1, tier: 0 },
        decoy2: { ...s.nodes.decoy2, tier: 0 },
      },
    }));
  } else if (fixType === "trimOverload") {
    setState((s) => ({
      ...s,
      contrast: Math.min(76, Math.max(58, s.contrast)),
      hollowTrap: false,
      nodes: {
        ...s.nodes,
        entry: { ...s.nodes.entry, tier: 1 },
        title: { ...s.nodes.title, tier: 1 },
        hot2: { ...s.nodes.hot2, tier: 0 },
        hot3: { ...s.nodes.hot3, tier: 0 },
        strong: { ...s.nodes.strong, tier: 2 },
        data: { ...s.nodes.data, tier: 1 },
        visual: { ...s.nodes.visual, tier: 0 },
        exit: { ...s.nodes.exit, tier: 1 },
        decoy1: { ...s.nodes.decoy1, tier: 0 },
        decoy2: { ...s.nodes.decoy2, tier: 0 },
      },
    }));
  } else if (fixType === "spreadNodes") {
    const base = PRESETS.posterBalanced.nodes;
    setState((s) => {
      const nextNodes = {};
      for (const [id, v] of Object.entries(s.nodes)) {
        const b = base[id] || v;
        nextNodes[id] = { ...v, x: b.x, y: b.y };
      }
      return { ...s, nodes: nextNodes };
    });
  } else if (fixType === "setCompound") {
    setState((s) => ({ ...s, signalMode: "compound" }));
  } else if (fixType === "boostOne") {
    setState((s) => ({
      ...s,
      nodes: { ...s.nodes, strong: { ...s.nodes.strong, tier: 2 } },
    }));
  } else if (fixType === "nextEntry") {
    const ev = evaluate(state);
    const candidates = ev.valueActive;
    if (candidates.length > 1) {
      const idx = candidates.findIndex((n) => n.id === state.entryId);
      const next = candidates[(idx + 1) % candidates.length];
      setState((s) => ({ ...s, entryId: next.id, selectedId: next.id }));
    }
  } else {
    setState((s) => applyPreset(s, "posterBalanced"));
  }
}

function syncHeroUI(measure = true) {
  if (measure) {
    const rect = heroCanvas.getBoundingClientRect();
    cachedW = Math.max(320, Math.round(rect.width || 1000));
    cachedH = Math.max(240, Math.round(rect.height || 520));
  }
  const ev = evaluate(state, cachedW, cachedH);
  const scene = SCENES[state.sceneId] || SCENES.poster;

  if (taskHintEl) taskHintEl.textContent = scene.taskHint;
  if (contrastSlider) contrastSlider.value = String(state.contrast);
  if (contrastValue) contrastValue.textContent = `${state.contrast}%`;

  // 顶部状态徽与自示范标题斑点响应
  if (statusPill) {
    statusPill.textContent = `${ev.passedCount}/5 · ${ev.grade}`;
    statusPill.dataset.tone = ev.gradeTone;
  }
  if (heroTitleDots) {
    heroTitleDots.dataset.state = ev.gradeTone;
    heroTitleDots.style.setProperty("--snr", (state.contrast / 100).toFixed(2));
  }

  // 右下电光青诊断框（单真源）
  if (diagTag) {
    diagTag.textContent = ev.primary.tag;
    diagTag.dataset.tone = ev.gradeTone;
  }
  if (diagTitle) diagTitle.textContent = ev.primary.title;
  if (diagWhy) diagWhy.textContent = ev.primary.why;
  if (diagAction) diagAction.textContent = ev.primary.actionHint;
  if (diagFixBtn) {
    diagFixBtn.textContent = ev.primary.fixLabel;
    diagFixBtn.dataset.fix = ev.primary.fixType;
  }
  if (quickDiagText) {
    quickDiagText.textContent = ev.primary.title;
    quickDiagText.dataset.tone = ev.gradeTone;
  }
  if (quickDiagBtn) {
    quickDiagBtn.textContent = ev.primary.fixLabel;
    quickDiagBtn.dataset.fix = ev.primary.fixType;
  }

  if (diagMetrics) {
    const pathNames = ev.jumpPath.length
      ? ev.jumpPath.slice(0, 4).map((n) => n.pill).join(" → ") + (ev.jumpPath.length > 4 ? " …" : "")
      : "无清晰跳跃路径";
    const mHtml = `
      <div class="metric-cell"><span>活跃真热点</span><strong>${ev.valueActive.length} 枚${ev.decoyActive.length ? ` (+${ev.decoyActive.length}空壳)` : ""}</strong></div>
      <div class="metric-cell"><span>最小边界净距</span><strong>${ev.minGapPct}%</strong></div>
      <div class="metric-cell"><span>视觉捕获</span><strong>${ev.captureTier}</strong></div>
      <div class="metric-cell metric-wide"><span>当前非线跃迁</span><strong>${pathNames}</strong></div>
    `;
    if (mHtml !== lastMetricsHtml) {
      lastMetricsHtml = mHtml;
      diagMetrics.innerHTML = mHtml;
    }
  }

  // 选中节点微控栏
  const sel = ev.nodes.find((n) => n.id === state.selectedId) || ev.nodes[0];
  if (selectedInfo && sel) {
    const tierName = sel.tier === 2 ? "强信号核" : sel.tier === 1 ? "常规热点" : "退隐背景";
    const sHtml = `
      <span class="sel-badge" data-tier="${sel.tier}">${sel.isDecoy ? "空壳点" : tierName}</span>
      <strong>${sel.pill}</strong>
      <span class="sel-desc">${sel.desc}</span>
    `;
    if (sHtml !== lastSelectedHtml) {
      lastSelectedHtml = sHtml;
      selectedInfo.innerHTML = sHtml;
    }
    const btnEntry = $("#btn-set-entry");
    if (btnEntry) {
      btnEntry.disabled = sel.tier === 0 || Boolean(sel.isDecoy);
      btnEntry.textContent = state.entryId === sel.id ? "当前起跳入口" : "设为起跳入口";
    }
    $$("[data-node-tier]").forEach((btn) => {
      const t = Number(btn.dataset.nodeTier);
      btn.setAttribute("aria-pressed", String(sel.tier === t));
    });
  }

  // 场景、信号通道、空壳诱饵、图例按钮状态同步
  $$("[data-scene]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.scene === state.sceneId));
  });
  $$("[data-signal-mode]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.signalMode === state.signalMode));
  });
  const hollowBtn = $("#btn-hollow-toggle");
  if (hollowBtn) {
    hollowBtn.setAttribute("aria-pressed", String(state.hollowTrap));
    hollowBtn.textContent = state.hollowTrap ? "空壳诱饵：开 (2)" : "空壳诱饵：关";
  }
  $$("[data-legend]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.legend === state.legendFilter));
  });

  // 左下原海报 5 枚「核心原则」活体体检带
  if (principlesGrid) {
    const pHtml = ev.principles
      .map(
        (p) => `
      <div class="principle-card" data-ok="${p.ok}">
        <div class="principle-icon">${PRINCIPLE_ICONS[p.id] || ""}</div>
        <div class="principle-name">${p.title}</div>
        <div class="principle-sub">${p.sub}</div>
        <div class="principle-stat">${p.ok ? "✓ " : "× "}${p.metric}</div>
      </div>`
      )
      .join("");
    if (pHtml !== lastPrinciplesHtml) {
      lastPrinciplesHtml = pHtml;
      principlesGrid.innerHTML = pHtml;
    }
  }

  // 底沿原海报青色波浪线连通度（过载或平灰时变为断裂虚线提示）
  if (tipWave && tipEndRing) {
    tipWave.setAttribute("stroke", ev.gradeTone === "ok" ? "#38DAF5" : "#FF6B5B");
    tipWave.setAttribute("stroke-dasharray", ev.gradeTone === "ok" ? "none" : "6 6");
    tipEndRing.setAttribute("stroke", ev.gradeTone === "ok" ? "#38DAF5" : "#FF6B5B");
  }
}

function initHeroControls() {
  heroStage = mountHeroStage(heroCanvas, () => state, (updater, fromDrag) => setState(updater, fromDrag));
  window.addEventListener("resize", () => syncHeroUI(true));

  contrastSlider?.addEventListener("input", (e) => {
    const val = Number(e.target.value);
    setState((s) => ({ ...s, contrast: val }));
  });

  $$("[data-scene]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setState((s) => ({ ...s, sceneId: btn.dataset.scene }));
    });
  });

  $$("[data-signal-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setState((s) => ({ ...s, signalMode: btn.dataset.signalMode }));
    });
  });

  $("#btn-hollow-toggle")?.addEventListener("click", () => {
    setState((s) => {
      const next = !s.hollowTrap;
      return {
        ...s,
        hollowTrap: next,
        nodes: {
          ...s.nodes,
          decoy1: { ...s.nodes.decoy1, tier: next ? 2 : 0 },
          decoy2: { ...s.nodes.decoy2, tier: next ? 1 : 0 },
        },
      };
    });
  });

  $$("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setState((s) => applyPreset(s, btn.dataset.preset));
    });
  });

  diagFixBtn?.addEventListener("click", () => {
    applySmartFix(diagFixBtn.dataset.fix || "posterBalanced");
  });
  quickDiagBtn?.addEventListener("click", () => {
    applySmartFix(quickDiagBtn.dataset.fix || "posterBalanced");
  });

  $$("[data-node-tier]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = Number(btn.dataset.nodeTier);
      setState((s) => {
        const cur = s.nodes[s.selectedId];
        if (!cur) return s;
        return { ...s, nodes: { ...s.nodes, [s.selectedId]: { ...cur, tier: t } } };
      });
    });
  });

  $("#btn-set-entry")?.addEventListener("click", () => {
    setState((s) => {
      const cur = s.nodes[s.selectedId];
      if (!cur || cur.tier === 0 || s.selectedId.startsWith("decoy")) return s;
      return { ...s, entryId: s.selectedId };
    });
  });

  // 右上原海报图例：点击高亮筛选该类元素，再次点击还原全览
  $$("[data-legend]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.legend;
      setState((s) => ({ ...s, legendFilter: s.legendFilter === key ? "all" : key }));
    });
  });

  // 右下电光青卡：实况诊断 / 何时使用 Tab 切换（桌面默认都清晰可读，也可快速切看原海报四条对勾）
  $$("[data-panel-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.panelTab;
      $$("[data-panel-tab]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      $$("[data-panel-body]").forEach((p) => {
        p.hidden = p.dataset.panelBody !== tab;
      });
    });
  });

  // 键盘操作星图：方向键调信号反差或挪节点，Tab / Enter / Space 切层级
  heroCanvas?.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setState((s) => ({ ...s, contrast: Math.min(100, s.contrast + 4) }));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setState((s) => ({ ...s, contrast: Math.max(0, s.contrast - 4) }));
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setState((s) => {
        const cur = s.nodes[s.selectedId];
        if (!cur) return s;
        const nextTier = (cur.tier + 1) % 3;
        return { ...s, nodes: { ...s.nodes, [s.selectedId]: { ...cur, tier: nextTier } } };
      });
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const ev = evaluate(state);
      const ids = ev.nodes.map((n) => n.id);
      const i = ids.indexOf(state.selectedId);
      const nextId = ids[(i + (e.key === "ArrowDown" ? 1 : -1) + ids.length) % ids.length];
      setState((s) => ({ ...s, selectedId: nextId }));
    }
  });

  syncHeroUI();
}

// ==================== 2. 第 01 节：200ms 前注意弹出找靶实验室 ====================
function initPopoutLab() {
  const board = $("#popout-board");
  const statusEl = $("#popout-status");
  const logEl = $("#popout-log");
  if (!board) return;

  const MODES = {
    color: {
      name: "单色弹出",
      desc: "47 枚深蓝灰圆点里藏 1 枚电光青圆点——只需单通道色彩，大脑并行弹出，几乎瞬间定位。",
      target: { shape: "circle", tone: "cyan" },
      makeDistractor: () => ({ shape: "circle", tone: "slate" }),
    },
    shape: {
      name: "纯形弹出",
      desc: "47 枚深蓝灰圆点里藏 1 枚同色三角形——单一轮廓差异也能触发前注意弹出。",
      target: { shape: "tri", tone: "slate" },
      makeDistractor: () => ({ shape: "circle", tone: "slate" }),
    },
    dual: {
      name: "色 + 形双强",
      desc: "1 枚电光青三角形嵌在灰圆阵中——双重冗余特征让目标稳健突出，色弱环境也有效。",
      target: { shape: "tri", tone: "cyan" },
      makeDistractor: () => ({ shape: "circle", tone: "slate" }),
    },
    conjunction: {
      name: "色形混杂（联合搜索）",
      desc: "在电光青圆点与深紫三角混杂的阵列里，找「电光青三角形」——必须动用聚焦注意逐个绑定排查，耗时陡增！",
      target: { shape: "tri", tone: "cyan" },
      makeDistractor: (i) => (i % 2 === 0 ? { shape: "circle", tone: "cyan" } : { shape: "tri", tone: "violet" }),
    },
  };

  let modeKey = "color";
  let targetIdx = 17;
  let startedAt = 0;
  let running = false;
  const records = {};

  function glyphSvg(item) {
    const fills = { cyan: "#008EA8", violet: "#6D35D8", slate: "#475569" };
    const fill = fills[item.tone] || "#475569";
    if (item.shape === "tri") {
      return `<svg viewBox="0 0 28 28" aria-hidden="true"><polygon points="14,3 25,24 3,24" fill="${fill}"/></svg>`;
    }
    return `<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="9.5" fill="${fill}"/></svg>`;
  }

  function renderBoard(startTimer = false) {
    const cfg = MODES[modeKey];
    const total = 48;
    // 避开极端角落，落在中腹区域便于测试
    targetIdx = Math.floor(Math.random() * 36) + 6;
    const cells = [];
    for (let i = 0; i < total; i++) {
      const item = i === targetIdx ? cfg.target : cfg.makeDistractor(i);
      cells.push(
        `<button type="button" class="pop-cell" data-idx="${i}" aria-label="格 ${i + 1}">${glyphSvg(item)}</button>`
      );
    }
    board.innerHTML = cells.join("");
    $("#popout-mode-desc").textContent = cfg.desc;
    if (startTimer) {
      startedAt = performance.now();
      running = true;
      statusEl.textContent = `计时中：请立刻点出唯一目标（${cfg.name}）`;
      statusEl.dataset.tone = "active";
    } else {
      running = false;
      startedAt = performance.now();
      statusEl.textContent = `直接点出画面里唯一不同的目标，或点「换一局测速」重新计时。`;
      statusEl.dataset.tone = "idle";
    }
  }

  function renderRecords() {
    if (!logEl) return;
    logEl.innerHTML = Object.entries(MODES)
      .map(([k, m]) => {
        const ms = records[k];
        return `<div class="pop-rec" data-active="${k === modeKey}"><span>${m.name}</span><strong>${ms != null ? `${ms} ms` : "未测"}</strong></div>`;
      })
      .join("");
  }

  board.addEventListener("click", (e) => {
    const btn = e.target.closest(".pop-cell");
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    if (idx === targetIdx) {
      const elapsed = Math.max(120, Math.round(performance.now() - startedAt));
      records[modeKey] = elapsed;
      btn.classList.add("is-hit");
      const hint =
        modeKey === "conjunction"
          ? `命中！耗时 ${elapsed} ms——因为颜色和形状被拆散在干扰项里，大脑不得不退回慢速逐个排查。`
          : `命中！耗时 ${elapsed} ms——单一突出特征触发前注意并行弹出，这正是斑点信号抓眼的生理基础。`;
      statusEl.textContent = hint;
      statusEl.dataset.tone = "ok";
      running = false;
      renderRecords();
    } else {
      btn.classList.add("is-miss");
      statusEl.textContent = "点偏了——再仔细看哪一枚同时符合唯一特征！";
      statusEl.dataset.tone = "warn";
    }
  });

  $$("[data-popout-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      modeKey = btn.dataset.popoutMode;
      $$("[data-popout-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      renderBoard(true);
      renderRecords();
    });
  });

  $("#btn-popout-restart")?.addEventListener("click", () => {
    renderBoard(true);
  });

  renderBoard(false);
  renderRecords();
}

// ==================== 3. 第 02 节：五种热点信号 × 四层通道拆层器 ====================
function initSignalAnatomy() {
  const preview = $("#anatomy-preview");
  const noteEl = $("#anatomy-layer-note");
  if (!preview) return;

  const layers = { color: true, shape: true, space: true, scent: true };

  function update() {
    preview.dataset.color = String(layers.color);
    preview.dataset.shape = String(layers.shape);
    preview.dataset.space = String(layers.space);
    preview.dataset.scent = String(layers.scent);

    const off = [];
    if (!layers.color) off.push("失去色彩对比，热点亮度退进灰底");
    if (!layers.shape) off.push("失去独特几何与大号字形，五类节点缩成千篇一律的方条");
    if (!layers.space) off.push("撤掉周围呼吸留白，热点彼此紧贴撞成一团");
    if (!layers.scent) off.push("抽空独立信息气味，只剩空洞装饰标，读者跳过去立刻落空");

    if (off.length === 0) {
      noteEl.textContent = "四层通道齐备：色彩抓第一眼、形状分清节点角色、留白隔出缓冲区、真实信息气味兑现每一次跳跃。";
      noteEl.dataset.tone = "ok";
    } else {
      noteEl.textContent = `当前关闭了 ${off.length} 层通道：${off.join("；")}。`;
      noteEl.dataset.tone = "warn";
    }
  }

  $$("[data-layer-toggle]").forEach((cb) => {
    cb.addEventListener("change", () => {
      layers[cb.dataset.layerToggle] = cb.checked;
      update();
    });
  });
  update();
}

// ==================== 4. 第 03 节：同一页面四种心智眼动对照仪 ====================
function initModesCompare() {
  const canvas = $("#modes-canvas");
  if (!canvas) return;
  let activeMode = "spotted";
  const stage = mountModesStage(canvas, () => activeMode);

  function sync() {
    const m = SCAN_MODES[activeMode];
    $("#mode-task").textContent = m.task;
    $("#mode-note").textContent = m.note;
    $$("[data-scan-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scanMode === activeMode)));
    stage.draw();
  }

  $$("[data-scan-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeMode = btn.dataset.scanMode;
      sync();
    });
  });
  sync();
}

// ==================== 5. 第 04 节：学术源流五阶时间轴 ====================
function initOriginsTimeline() {
  const items = [
    {
      year: "1980",
      who: "Anne Treisman & Garry Gelade",
      work: "《A Feature-Integration Theory of Attention》（Cognitive Psychology, Vol. 12, No. 1）",
      finding: "提出特征整合理论：颜色、方向、大小等基本视觉特征在「前注意阶段」全视野并行处理，单一突出特征会瞬间弹出；而多特征组合则必须依赖慢速串行的聚焦注意。",
      takeaway: "想让节点触发自由跳跃，必须用干净、少数的突出特征建立高反差，绝不能堆砌五花八门的多维样式逼用户逐个辨认。",
      url: "https://pubmed.ncbi.nlm.nih.gov/7351125/",
      urlText: "PubMed 论文记录（PMID: 7351125）",
    },
    {
      year: "1997",
      who: "Jakob Nielsen & John Morkes",
      work: "《How Users Read on the Web》（Nielsen Norman Group，1997 年 9 月）",
      finding: "早期可用性实测发现约 79% 的网页受试者都在扫读而非逐字精读，提出用加粗关键词、清晰小标题、项目符号与简洁段落提升网页可扫读性。",
      takeaway: "屏幕阅读天生就是非线性跳读，版面设计应当顺应扫读、提前把关键事实做成一眼可读的锚点。",
      url: "https://www.nngroup.com/articles/how-users-read-on-the-web/",
      urlText: "NN/g 1997 年原始研究文章",
    },
    {
      year: "1999",
      who: "Peter Pirolli & Stuart K. Card",
      work: "《Information Foraging》（Psychological Review, Vol. 106, No. 4, pp. 643–675）",
      finding: "提出「信息觅食理论」与「信息气味（Information Scent）」：人找信息就像动物觅食，不断凭眼前的近端线索估算哪个斑块回报最高，决定留下来还是立刻跳走。",
      takeaway: "每个斑点热点不仅是视觉装饰，更是「信息气味源」——必须独立表达实质价值，否则读者扑空一次就会弃页。",
      url: "https://doi.org/10.1037/0033-295X.106.4.643",
      urlText: "APA Psychological Review DOI",
    },
    {
      year: "2000–2020",
      who: "Colin Ware",
      work: "《Information Visualization: Perception for Design》（初版 2000，第 4 版 2019/2020）",
      finding: "系统整理可在 200–250 毫秒内被大脑自动捕获的前注意属性家族：色彩（色相与明度）、形态（尺寸、形状、朝向、围合）、空间位置与动态。",
      takeaway: "同时组合「色 + 形 + 空间留白」比单靠换颜色稳健得多，这也是 131 原海报将圆点、衬线大 T、环形图与双峰图形分门别类的底层逻辑。",
      url: "https://www.nngroup.com/articles/information-scent/",
      urlText: "NN/g 延伸条目：信息气味与视觉线索",
    },
    {
      year: "2009 / 2019",
      who: "Jakob Nielsen & Kara Pernice",
      work: "《Eyetracking Web Usability》（2009）与 NN/g《Text Scanning Patterns: Eyetracking Evidence》（2019-08-25）",
      finding: "通过十余年跨设备眼动仪追踪，正式把「Spotted Pattern（斑点扫描模式）」确立为四大网页扫读模式之一，指出读者会跳过成块文字，直接锁定数字、链接、加粗词、特殊字形等高辨识斑点。",
      takeaway: "斑点扫描本来就是用户在信息海里自发演化出的高效策略；设计师的任务是顺势把真正的重点放进热点，而不是放任页面退化成盲目的 F 型。",
      url: "https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/",
      urlText: "NN/g 2019 年眼动实证原文",
    },
  ];

  const tabs = $$("[data-origin-idx]");
  const box = $("#origin-detail");
  if (!tabs.length || !box) return;

  function render(idx) {
    const it = items[idx] || items[0];
    tabs.forEach((b, i) => b.setAttribute("aria-pressed", String(i === idx)));
    box.innerHTML = `
      <div class="origin-meta"><span class="mono-pill">${it.year}</span><strong>${it.who}</strong></div>
      <h3 class="origin-work">${it.work}</h3>
      <p class="origin-finding">${it.finding}</p>
      <p class="origin-takeaway"><strong>对 131 的直接启发：</strong>${it.takeaway}</p>
      <p class="origin-link"><a href="${it.url}" target="_blank" rel="noopener">核实来源：${it.urlText} ↗</a></p>
    `;
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => render(Number(btn.dataset.originIdx)));
  });
  render(4); // 默认先亮起 2009/2019 正式定名节点，点任意年份立刻切换
}

// ==================== 6. 第 05 节：何时用与什么时候别用 · 6 场景分诊快测 ====================
function initTriageBoard() {
  const cases = [
    {
      id: "c1",
      title: "音乐节 30 支乐队阵容与舞台分布专题页",
      desc: "观众各有所爱，有人只找压轴乐队，有人只看周日电子舞台或早鸟票价。",
      best: "use",
      why: "高度契合斑点扫描：模块独立、主题多元、用户目的各不相同。用日期、舞台色标和头牌头像做成疏朗热点，观众能按兴趣自由跳抓。",
    },
    {
      id: "c2",
      title: "医疗保险理赔免责条款与续保协议",
      desc: "第 3 条的豁免条件直接决定了第 8 条能否获赔，每段之间有严格逻辑前提。",
      best: "avoid",
      why: "千万别用斑点扫描！强行挑几个亮眼短语做成跳读斑点，会让投保人跳过关键前置条件。这类文稿应采用清晰的层级章节与完整线性精读（配合 130 层蛋糕目录索引）。",
    },
    {
      id: "c3",
      title: "旗舰耳机新品特性概览墙（Bento 风格）",
      desc: "汇总降噪深度、续航小时数、重量、空间音频与价格等 6 项独立亮点。",
      best: "use",
      why: "非常适合斑点扫描：每张卡片承载一条可独立理解的数字或视觉线索，买主无需按固定顺序，先跳去看自己最在意的 2 项即可建立决策。",
    },
    {
      id: "c4",
      title: "跨境汇款五步风控与验证结账流",
      desc: "必须严格按「选币种 → 填收款人 → 核汇率 → 短信验签 → 确认汇出」依次完成。",
      best: "avoid",
      why: "不适用斑点扫描！多点跳跃会诱使视线提前跳去底部的确认按钮，漏看汇率手续费。流程任务应改用清晰的线性步骤或单路径引导（可参照 128 Z 型单向收束）。",
    },
    {
      id: "c5",
      title: "地铁通勤时刷到的「城市周末展览快报」",
      desc: "手机小屏、读者只有 40 秒碎片时间，只想一眼扫到离家近、免费或本周截止的展。",
      best: "use",
      why: "完全契合原海报「移动端或碎片化阅读场景」：把「免费」「本周日截止」「地铁 2 号线」做成高对比小节点，读者 5 秒就能挑中想去的场馆。",
    },
    {
      id: "c6",
      title: "推理短篇小说或人物深度特稿正文",
      desc: "依靠铺垫、情绪递进与结尾反转建立沉浸体验，读者希望一气呵成读下去。",
      best: "avoid",
      why: "不适用斑点扫描！在长叙事里乱塞高饱和色块和感叹号热点，就像读书时旁边有人不断拿荧光笔乱划，会直接剧透并打断沉浸节奏。",
    },
  ];

  const list = $("#triage-list");
  const scoreEl = $("#triage-score");
  if (!list) return;

  const picked = {};

  function render() {
    const done = Object.keys(picked).length;
    const right = cases.filter((c) => picked[c.id] === c.best).length;
    if (scoreEl) {
      scoreEl.textContent = done === 0 ? "点击下方每个场景的判定按钮，测试你的场景直觉" : `已判断 ${done}/${cases.length} 项 · 准确 ${right} 项`;
    }
    list.innerHTML = cases
      .map((c) => {
        const ans = picked[c.id];
        const isCorrect = ans && ans === c.best;
        return `
        <article class="triage-item" data-state="${ans ? (isCorrect ? "ok" : "miss") : "idle"}">
          <div class="triage-head">
            <h4>${c.title}</h4>
            <p>${c.desc}</p>
          </div>
          <div class="triage-actions">
            <button type="button" class="triage-btn" data-cid="${c.id}" data-pick="use" aria-pressed="${ans === "use"}">适合斑点扫描</button>
            <button type="button" class="triage-btn" data-cid="${c.id}" data-pick="avoid" aria-pressed="${ans === "avoid"}">别用·改线性/层读</button>
          </div>
          ${
            ans
              ? `<div class="triage-feedback"><strong>${isCorrect ? "判断准确" : "换个角度看"}：</strong>${c.why}</div>`
              : ""
          }
        </article>`;
      })
      .join("");
  }

  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".triage-btn");
    if (!btn) return;
    picked[btn.dataset.cid] = btn.dataset.pick;
    render();
  });
  render();
}

// ==================== 7. 第 06 节：2 道单变量等比例 SVG 版面诊断练习 ====================
function initQuiz() {
  const QUESTIONS = [
    {
      id: "q1",
      title: "第 1 题 · 单一变量：热点信号的密度与空间分配",
      prompt: "以下 4 套「城市设计展导览首屏」使用完全相同的文字信息与版面网格，唯一区别在于高对比热点信号的分布方式。哪一套最符合斑点扫描的有效结构？",
      answer: "B",
      options: [
        {
          key: "A",
          label: "方案 A",
          svg: `<svg viewBox="0 0 240 150" aria-hidden="true">
            <rect width="240" height="150" fill="#0B0F15"/>
            ${[18, 34, 50, 66, 82, 98, 114, 130].map((y) => `<rect x="16" y="${y}" width="208" height="6" rx="2" fill="#323C4B"/>`).join("")}
          </svg>`,
          explain: "方案 A 没有任何前注意信号：全部信息以同等字号与灰度铺开，眼睛抓不到入口，只能退回耗力的 F 型盲扫。",
        },
        {
          key: "B",
          label: "方案 B",
          svg: `<svg viewBox="0 0 240 150" aria-hidden="true">
            <rect width="240" height="150" fill="#0B0F15"/>
            <rect x="16" y="16" width="84" height="5" rx="2" fill="#232B36"/><rect x="16" y="26" width="66" height="4" rx="2" fill="#1B222C"/>
            <rect x="134" y="16" width="90" height="5" rx="2" fill="#232B36"/><rect x="134" y="26" width="72" height="4" rx="2" fill="#1B222C"/>
            <rect x="16" y="114" width="82" height="4" rx="2" fill="#1B222C"/><rect x="138" y="114" width="82" height="4" rx="2" fill="#1B222C"/>
            <circle cx="42" cy="48" r="14" fill="#0D3CFB"/><circle cx="42" cy="48" r="4.5" fill="#F4F7FA"/>
            <circle cx="122" cy="76" r="17" fill="#8449EF"/><rect x="120.5" y="67" width="3" height="11" fill="#FFF"/><circle cx="122" cy="83" r="2" fill="#FFF"/>
            <rect x="168" y="38" width="52" height="24" rx="5" fill="#111722" stroke="#38DAF5" stroke-width="1.4"/><text x="194" y="54" fill="#38DAF5" font-size="11" text-anchor="middle" font-family="DM Mono,monospace">10.18</text>
            <rect x="166" y="102" width="54" height="22" rx="11" fill="#28C5E2"/><text x="193" y="116" fill="#041016" font-size="10" font-weight="700" text-anchor="middle">免费预约</text>
            <path d="M58 50 Q86 48 102 68 M141 72 Q156 62 166 54 M134 94 Q152 108 164 111" fill="none" stroke="#38DAF5" stroke-width="1.4" stroke-dasharray="3 4"/>
          </svg>`,
          explain: "正确！方案 B 只保留 4 处疏朗核心热点（1 枚中央强紫核 + 3 枚色/数/行动辅节点），分布在四个象限且周围留白充足，信噪比清晰，读者可以按兴趣自由起跳。",
        },
        {
          key: "C",
          label: "方案 C",
          svg: `<svg viewBox="0 0 240 150" aria-hidden="true">
            <rect width="240" height="150" fill="#0B0F15"/>
            <rect x="14" y="14" width="64" height="24" rx="5" fill="#38DAF5"/><rect x="86" y="14" width="66" height="24" rx="5" fill="#8449EF"/><rect x="160" y="14" width="66" height="24" rx="5" fill="#0D3CFB"/>
            <rect x="14" y="46" width="50" height="24" rx="5" fill="#8449EF"/><rect x="72" y="46" width="76" height="24" rx="5" fill="#38DAF5"/><rect x="156" y="46" width="70" height="24" rx="5" fill="#FF6B5B"/>
            <rect x="14" y="78" width="72" height="24" rx="5" fill="#0D3CFB"/><rect x="94" y="78" width="62" height="24" rx="5" fill="#38DAF5"/><rect x="164" y="78" width="62" height="24" rx="5" fill="#8449EF"/>
            <rect x="14" y="110" width="98" height="24" rx="5" fill="#FF6B5B"/><rect x="120" y="110" width="106" height="24" rx="5" fill="#38DAF5"/>
          </svg>`,
          explain: "方案 C 是典型的「过载争宠」：11 块全员高饱和亮色铺满画布，信号与背景的反差归零，全是重点等于没重点。",
        },
        {
          key: "D",
          label: "方案 D",
          svg: `<svg viewBox="0 0 240 150" aria-hidden="true">
            <rect width="240" height="150" fill="#0B0F15"/>
            <circle cx="32" cy="30" r="13" fill="#0D3CFB"/><circle cx="56" cy="34" r="14" fill="#8449EF"/>
            <rect x="20" y="48" width="44" height="18" rx="9" fill="#38DAF5"/><circle cx="76" cy="54" r="12" fill="#0D3CFB"/>
            <rect x="44" y="64" width="46" height="16" rx="8" fill="#8449EF"/>
            <rect x="122" y="24" width="100" height="4" rx="2" fill="#1D2530"/><rect x="122" y="38" width="88" height="4" rx="2" fill="#1D2530"/>
            <rect x="122" y="92" width="96" height="4" rx="2" fill="#1D2530"/><rect x="122" y="106" width="84" height="4" rx="2" fill="#1D2530"/>
          </svg>`,
          explain: "方案 D 的 5 枚热点全部粘连挤压在左上角同一小块，彼此缺乏隔离留白形成视觉糊团，而画面右下大半区域完全没有入口。",
        },
      ],
    },
    {
      id: "q2",
      title: "第 2 题 · 单一变量：热点承载的信息气味",
      prompt: "以下 4 套「新机发布特性墙」的网格、配色、字号和 4 处热点位置完全一模一样，唯一区别是热点里写的内容。哪一套能让读者「每一次跳跃都有收获」？",
      answer: "B",
      options: [
        {
          key: "A",
          label: "方案 A",
          svg: `<svg viewBox="0 0 240 150" aria-hidden="true">
            <rect width="240" height="150" fill="#0B0F15"/>
            <rect x="16" y="16" width="98" height="54" rx="7" fill="#121822" stroke="#2D3746"/><text x="65" y="40" fill="#38DAF5" font-size="13" font-weight="700" text-anchor="middle">重磅升级</text><rect x="28" y="52" width="74" height="4" rx="2" fill="#303A49"/>
            <rect x="126" y="16" width="98" height="54" rx="7" fill="#121822" stroke="#8449EF"/><text x="175" y="40" fill="#B792FF" font-size="13" font-weight="700" text-anchor="middle">震撼突破</text><rect x="138" y="52" width="74" height="4" rx="2" fill="#303A49"/>
            <rect x="16" y="80" width="98" height="54" rx="7" fill="#121822" stroke="#2D3746"/><text x="65" y="104" fill="#38DAF5" font-size="13" font-weight="700" text-anchor="middle">极致美学</text><rect x="28" y="116" width="74" height="4" rx="2" fill="#303A49"/>
            <rect x="126" y="80" width="98" height="54" rx="7" fill="#121822" stroke="#2D3746"/><text x="175" y="104" fill="#6C8EFF" font-size="13" font-weight="700" text-anchor="middle">非凡体验</text><rect x="138" y="116" width="74" height="4" rx="2" fill="#303A49"/>
          </svg>`,
          explain: "方案 A 把最昂贵的视觉热点全浪费在「重磅」「震撼」「极致」这类空泛形容词上——眼睛跳完四个点仍然不知道这台手机到底强在哪。",
        },
        {
          key: "B",
          label: "方案 B",
          svg: `<svg viewBox="0 0 240 150" aria-hidden="true">
            <rect width="240" height="150" fill="#0B0F15"/>
            <rect x="16" y="16" width="98" height="54" rx="7" fill="#121822" stroke="#2D3746"/><text x="65" y="40" fill="#38DAF5" font-size="12.5" font-weight="700" text-anchor="middle">48h 续航</text><rect x="28" y="52" width="74" height="4" rx="2" fill="#303A49"/>
            <rect x="126" y="16" width="98" height="54" rx="7" fill="#121822" stroke="#8449EF"/><text x="175" y="40" fill="#B792FF" font-size="12.5" font-weight="700" text-anchor="middle">0.3s 抓拍</text><rect x="138" y="52" width="74" height="4" rx="2" fill="#303A49"/>
            <rect x="16" y="80" width="98" height="54" rx="7" fill="#121822" stroke="#2D3746"/><text x="65" y="104" fill="#38DAF5" font-size="12.5" font-weight="700" text-anchor="middle">182g 钛框</text><rect x="28" y="116" width="74" height="4" rx="2" fill="#303A49"/>
            <rect x="126" y="80" width="98" height="54" rx="7" fill="#121822" stroke="#2D3746"/><text x="175" y="104" fill="#6C8EFF" font-size="12.5" font-weight="700" text-anchor="middle">卫星直连</text><rect x="138" y="116" width="74" height="4" rx="2" fill="#303A49"/>
          </svg>`,
          explain: "正确！方案 B 的 4 枚热点各自携带独立、具体、可验证的信息气味（数字 + 名词），哪怕读者不读任何灰字小文，随便跳中哪一格都能直接带走一条硬结论。",
        },
        {
          key: "C",
          label: "方案 C",
          svg: `<svg viewBox="0 0 240 150" aria-hidden="true">
            <rect width="240" height="150" fill="#0B0F15"/>
            <rect x="16" y="16" width="98" height="54" rx="7" fill="#121822" stroke="#2D3746"/><text x="65" y="42" fill="#38DAF5" font-size="16" font-weight="700" text-anchor="middle" font-family="DM Mono,monospace">01</text><rect x="28" y="52" width="74" height="4" rx="2" fill="#303A49"/>
            <rect x="126" y="16" width="98" height="54" rx="7" fill="#121822" stroke="#8449EF"/><text x="175" y="42" fill="#B792FF" font-size="16" font-weight="700" text-anchor="middle" font-family="DM Mono,monospace">02</text><rect x="138" y="52" width="74" height="4" rx="2" fill="#303A49"/>
            <rect x="16" y="80" width="98" height="54" rx="7" fill="#121822" stroke="#2D3746"/><text x="65" y="106" fill="#38DAF5" font-size="16" font-weight="700" text-anchor="middle" font-family="DM Mono,monospace">03</text><rect x="28" y="116" width="74" height="4" rx="2" fill="#303A49"/>
            <rect x="126" y="80" width="98" height="54" rx="7" fill="#121822" stroke="#2D3746"/><text x="175" y="106" fill="#6C8EFF" font-size="16" font-weight="700" text-anchor="middle" font-family="DM Mono,monospace">04</text><rect x="138" y="116" width="74" height="4" rx="2" fill="#303A49"/>
          </svg>`,
          explain: "方案 C 只放了 01–04 纯序号，没有任何主题线索——读者无法凭兴趣跳跃，反而被迫按 1→2→3→4 老实钻进灰字正文，浪费了斑点结构。",
        },
        {
          key: "D",
          label: "方案 D",
          svg: `<svg viewBox="0 0 240 150" aria-hidden="true">
            <rect width="240" height="150" fill="#0B0F15"/>
            <rect x="16" y="16" width="98" height="54" rx="7" fill="#121822" stroke="#2D3746"/><polygon points="65,24 71,36 83,38 74,46 76,58 65,52 54,58 56,46 47,38 59,36" fill="#38DAF5"/>
            <rect x="126" y="16" width="98" height="54" rx="7" fill="#121822" stroke="#8449EF"/><rect x="163" y="29" width="24" height="24" transform="rotate(45 175 41)" fill="#8449EF"/>
            <rect x="16" y="80" width="98" height="54" rx="7" fill="#121822" stroke="#2D3746"/><circle cx="65" cy="105" r="14" fill="none" stroke="#38DAF5" stroke-width="3"/>
            <rect x="126" y="80" width="98" height="54" rx="7" fill="#121822" stroke="#2D3746"/><polygon points="175,91 190,118 160,118" fill="#6C8EFF"/>
          </svg>`,
          explain: "方案 D 用四个抽象装饰几何占住了最强的视觉通道，却不传递任何语义含义——视觉上很抢眼，信息气味却接近于零。",
        },
      ],
    },
  ];

  const host = $("#quiz-host");
  if (!host) return;
  const answers = {};

  function render() {
    host.innerHTML = QUESTIONS.map((q) => {
      const chosen = answers[q.id];
      const chosenOpt = q.options.find((o) => o.key === chosen);
      const isRight = chosen === q.answer;
      return `
      <div class="quiz-block" data-qid="${q.id}">
        <div class="quiz-q-head">
          <h3>${q.title}</h3>
          <p>${q.prompt}</p>
        </div>
        <div class="quiz-grid">
          ${q.options
            .map((opt) => {
              let stateAttr = "idle";
              if (chosen) {
                if (opt.key === q.answer) stateAttr = "correct";
                else if (opt.key === chosen) stateAttr = "wrong";
                else stateAttr = "dim";
              }
              return `
              <button type="button" class="quiz-card" data-qid="${q.id}" data-opt="${opt.key}" data-state="${stateAttr}" aria-pressed="${chosen === opt.key}">
                <div class="quiz-svg">${opt.svg}</div>
                <div class="quiz-card-foot">
                  <span class="quiz-letter">${opt.key}</span>
                  <span>${opt.label}</span>
                </div>
              </button>`;
            })
            .join("")}
        </div>
        ${
          chosenOpt
            ? `<div class="quiz-explain" data-ok="${isRight}">
                <strong>${isRight ? `✓ 选对了（${chosen}）` : `× 你选了 ${chosen}，最佳答案是 ${q.answer}`}：</strong>
                <span>${chosenOpt.explain}</span>
                ${!isRight ? `<p class="quiz-why-right"><strong>为什么选 ${q.answer}：</strong>${q.options.find((o) => o.key === q.answer).explain}</p>` : ""}
              </div>`
            : ""
        }
      </div>`;
    }).join("");
  }

  host.addEventListener("click", (e) => {
    const btn = e.target.closest(".quiz-card");
    if (!btn) return;
    answers[btn.dataset.qid] = btn.dataset.opt;
    render();
  });
  render();
}

// ==================== 8. 第 07 节：原海报全屏灯箱（缩放 + 拖拽平移 + Esc 关） ====================
function initPosterLightbox() {
  const thumbBtn = $("#poster-open-btn");
  const thumbImg = $("#poster");
  const box = $("#poster-lightbox");
  const vp = $("#lightbox-viewport");
  const img = $("#lightbox-img");
  if (!thumbBtn || !thumbImg || !box || !vp || !img) return;

  let scale = 1, tx = 0, ty = 0;
  let drag = null;

  function applyTransform() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    const resetBtn = $("#lightbox-reset");
    if (resetBtn) resetBtn.textContent = `${Math.round(scale * 100)}%`;
  }

  function openBox() {
    if (!img.getAttribute("src")) img.src = thumbImg.currentSrc || thumbImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    box.hidden = false;
    document.body.style.overflow = "hidden";
    $("#lightbox-close")?.focus();
  }

  function closeBox() {
    if (box.hidden) return;
    box.hidden = true;
    document.body.style.overflow = "";
    thumbBtn.focus();
  }

  thumbBtn.addEventListener("click", openBox);
  $("#lightbox-close")?.addEventListener("click", closeBox);
  $("#lightbox-in")?.addEventListener("click", () => { scale = Math.min(3.2, +(scale + 0.35).toFixed(2)); applyTransform(); });
  $("#lightbox-out")?.addEventListener("click", () => { scale = Math.max(0.6, +(scale - 0.35).toFixed(2)); applyTransform(); });
  $("#lightbox-reset")?.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  vp.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.18 : -0.18;
    scale = Math.max(0.6, Math.min(3.5, +(scale + delta).toFixed(2)));
    applyTransform();
  }, { passive: false });

  vp.addEventListener("pointerdown", (e) => {
    if (e.target === vp && scale <= 1.05) {
      closeBox();
      return;
    }
    drag = { sx: e.clientX, sy: e.clientY, ox: tx, oy: ty, id: e.pointerId };
    vp.setPointerCapture?.(e.pointerId);
  });
  vp.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = drag.ox + (e.clientX - drag.sx);
    ty = drag.oy + (e.clientY - drag.sy);
    applyTransform();
  });
  vp.addEventListener("pointerup", () => { drag = null; });
  vp.addEventListener("pointercancel", () => { drag = null; });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) closeBox();
  });
}

// 启动全部模块
initHeroControls();
initPopoutLab();
initSignalAnatomy();
initModesCompare();
initOriginsTimeline();
initTriageBoard();
initQuiz();
initPosterLightbox();

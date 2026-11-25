// 248 切换器 SWITCHER · 全页交互总控
import {
  MICRO_STATES,
  PRESETS,
  createInitialState,
  evaluate,
} from "./model.js";
import { mountHeroStage } from "./stage-hero.js";

const state = createInitialState();

// ==================== 1. 开场活体切换器控制台 ====================
const heroCanvas = document.getElementById("hero-canvas");
const elStatusPill = document.getElementById("hero-status-pill");
const elMasterToggle = document.getElementById("hero-master-toggle");
const elToggleLabel = document.getElementById("hero-toggle-label");
const elDiagBadge = document.getElementById("diag-badge");
const elDiagTitle = document.getElementById("diag-title");
const elDiagBody = document.getElementById("diag-body");
const elDiagNext = document.getElementById("diag-next");
const elMDelta = document.getElementById("m-delta");
const elMSlot = document.getElementById("m-slot");
const elMRows = document.getElementById("m-rows");
const elMLat = document.getElementById("m-lat");

const elPillarState = document.getElementById("pillar-state");
const elPillarActive = document.getElementById("pillar-active");
const elPillarResp = document.getElementById("pillar-response");
const elPTagState = document.getElementById("ptag-state");
const elPTagActive = document.getElementById("ptag-active");
const elPTagResp = document.getElementById("ptag-response");

const ctrlCount = document.getElementById("ctrl-count");
const valCount = document.getElementById("val-count");
const ctrlOverflow = document.getElementById("ctrl-overflow");
const ctrlHl = document.getElementById("ctrl-hl");
const ctrlCaret = document.getElementById("ctrl-caret");
const ctrlResp = document.getElementById("ctrl-resp");
const ctrlLatency = document.getElementById("ctrl-latency");
const valLatency = document.getElementById("val-latency");
const ctrlMicro = document.getElementById("ctrl-micro");
const ctrlActivation = document.getElementById("ctrl-activation");
const valActMode = document.getElementById("val-act-mode");
const microProbeList = document.getElementById("micro-probe-list");
const microProbeNote = document.getElementById("micro-probe-note");

// 原海报底部 6 枚微型状态标记 SVG 图标（1:1 复刻原海报样式）
function microIconSvg(id) {
  if (id === "active") {
    return `<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="9" fill="#FFCA1C"/></svg>`;
  }
  if (id === "inactive") {
    return `<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="9" fill="none" stroke="#FFFFFF" stroke-width="2"/></svg>`;
  }
  if (id === "hover") {
    return `<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="9" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="3.5 3"/></svg>`;
  }
  if (id === "focus") {
    return `<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="9" fill="none" stroke="#FFFFFF" stroke-width="2"/><circle cx="13" cy="13" r="4" fill="#FFFFFF"/></svg>`;
  }
  if (id === "loading") {
    return `<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="9.5" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-dasharray="3 2.5"/><circle cx="13" cy="13" r="5.5" fill="#FFCA1C"/></svg>`;
  }
  return `<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="9" fill="none" stroke="#FFFFFF" stroke-width="2"/><path d="M9 13.2l2.8 2.8L17.2 10.5" fill="none" stroke="#FFFFFF" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

MICRO_STATES.forEach((m) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "micro-btn";
  btn.dataset.probe = m.id;
  btn.innerHTML = `${microIconSvg(m.id)}<strong>${m.zh}</strong><span>${m.en}</span>`;
  btn.addEventListener("click", () => {
    const next = state.probeState === m.id ? null : m.id;
    state.probeState = next;
    if (next && state.microStates === "none" && (next === "hover" || next === "focus" || next === "loading" || next === "done")) {
      state.microStates = "full";
    }
    microProbeNote.textContent = next ? `正在画布演示「${m.zh} ${m.en}」：${m.tip}` : "已退出单态演示，恢复自由操作。";
    syncHeroUI();
    heroStage.draw();
  });
  microProbeList.appendChild(btn);
});

let heroStage = null;

function syncHeroUI() {
  const barW = heroStage ? heroStage.getBarWidth() : 820;
  const ev = evaluate(state, barW);

  elStatusPill.textContent = ev.badgeText;
  elStatusPill.className = `status-pill ${ev.allPass ? "is-ok" : "is-err"}`;

  const linked = state.responseMode === "synced";
  elMasterToggle.setAttribute("aria-pressed", String(linked));
  elToggleLabel.textContent = linked ? "联动已通" : "联动已断";

  elDiagBadge.textContent = ev.badgeText;
  elDiagBadge.className = `diag-badge ${ev.allPass ? "is-ok" : "is-err"}`;
  elDiagTitle.textContent = ev.headline;
  elDiagBody.textContent = ev.body;
  elDiagNext.textContent = ev.nextStep;

  elMDelta.textContent = `ΔE ${ev.deltaE}`;
  elMSlot.textContent = `${ev.slotWidthPx}px`;
  elMRows.textContent = `${ev.rows} 排`;
  elMLat.textContent = `${state.latencyMs}ms`;

  elPillarState.classList.toggle("is-ok", ev.pillars.state.ok);
  elPillarActive.classList.toggle("is-ok", ev.pillars.active.ok);
  elPillarResp.classList.toggle("is-ok", ev.pillars.response.ok);
  elPTagState.textContent = ev.pillars.state.tag;
  elPTagActive.textContent = ev.pillars.active.tag;
  elPTagResp.textContent = ev.pillars.response.tag;

  ctrlCount.value = String(state.itemCount);
  valCount.textContent = `${state.itemCount} 项`;
  ctrlLatency.value = String(state.latencyMs);
  valLatency.textContent = `${state.latencyMs}ms`;

  ctrlCaret.setAttribute("aria-pressed", String(state.pointerCaret));
  ctrlCaret.textContent = state.pointerCaret ? "指向尖角：开" : "指向尖角：关";

  for (const b of ctrlOverflow.querySelectorAll("button")) {
    b.classList.toggle("is-on", b.dataset.val === state.overflowMode);
  }
  for (const b of ctrlHl.querySelectorAll("button")) {
    b.classList.toggle("is-on", b.dataset.val === state.highlightStyle);
  }
  for (const b of ctrlResp.querySelectorAll("button")) {
    b.classList.toggle("is-on", b.dataset.val === state.responseMode);
  }
  for (const b of ctrlMicro.querySelectorAll("[data-micro]")) {
    b.classList.toggle("is-on", b.dataset.micro === state.microStates);
  }

  const isManual = state.activation === "manual";
  ctrlActivation.classList.toggle("is-manual", isManual);
  ctrlActivation.textContent = isManual ? "手动确认中" : "切手动确认";
  valActMode.textContent = isManual ? "手动激活 (Enter)" : "自动激活";

  for (const b of document.querySelectorAll("#scene-tabs .scene-btn")) {
    b.classList.toggle("is-active", b.dataset.scene === state.scene);
  }
  for (const b of microProbeList.querySelectorAll(".micro-btn")) {
    b.classList.toggle("is-active", b.dataset.probe === state.probeState);
  }
}

heroStage = mountHeroStage(heroCanvas, state, {
  onSyncUI: syncHeroUI,
  onResize: syncHeroUI,
});

// 绑定开场控件事件
elMasterToggle.addEventListener("click", () => {
  const nextSynced = state.responseMode !== "synced";
  state.responseMode = nextSynced ? "synced" : "frozen";
  state.toggleMaster = nextSynced;
  if (nextSynced) state.renderedIdx = state.activeIdx;
  syncHeroUI();
  heroStage.draw();
});

document.getElementById("scene-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-scene]");
  if (!btn) return;
  state.scene = btn.dataset.scene;
  state.overflowMenuOpen = false;
  syncHeroUI();
  heroStage.draw();
});

document.querySelector(".quick-presets").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-preset]");
  if (!btn) return;
  const preset = PRESETS[btn.dataset.preset];
  if (!preset) return;
  Object.assign(state, preset.patch);
  const ev = evaluate(state, heroStage.getBarWidth());
  state.activeIdx = Math.min(state.activeIdx, ev.visibleSlots.length - 1);
  state.cursorPos = state.activeIdx;
  state.renderedIdx = state.responseMode === "synced" ? state.activeIdx : 0;
  state.loading = false;
  syncHeroUI();
  heroStage.draw();
});

ctrlCount.addEventListener("input", () => {
  state.itemCount = Number(ctrlCount.value);
  const ev = evaluate(state, heroStage.getBarWidth());
  state.activeIdx = Math.min(state.activeIdx, ev.visibleSlots.length - 1);
  state.cursorPos = state.activeIdx;
  if (state.responseMode === "synced") state.renderedIdx = state.activeIdx;
  state.overflowMenuOpen = false;
  syncHeroUI();
  heroStage.draw();
});

ctrlOverflow.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-val]");
  if (!btn) return;
  state.overflowMode = btn.dataset.val;
  const ev = evaluate(state, heroStage.getBarWidth());
  state.activeIdx = Math.min(state.activeIdx, ev.visibleSlots.length - 1);
  state.cursorPos = state.activeIdx;
  if (state.responseMode === "synced") state.renderedIdx = state.activeIdx;
  syncHeroUI();
  heroStage.draw();
});

ctrlHl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-val]");
  if (!btn) return;
  state.highlightStyle = btn.dataset.val;
  syncHeroUI();
  heroStage.draw();
});

ctrlCaret.addEventListener("click", () => {
  state.pointerCaret = !state.pointerCaret;
  syncHeroUI();
  heroStage.draw();
});

ctrlResp.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-val]");
  if (!btn) return;
  state.responseMode = btn.dataset.val;
  state.toggleMaster = state.responseMode === "synced";
  if (state.responseMode === "synced") state.renderedIdx = state.activeIdx;
  syncHeroUI();
  heroStage.draw();
});

ctrlLatency.addEventListener("input", () => {
  state.latencyMs = Number(ctrlLatency.value);
  syncHeroUI();
  heroStage.draw();
});

ctrlMicro.addEventListener("click", (e) => {
  const mBtn = e.target.closest("[data-micro]");
  if (mBtn) {
    state.microStates = mBtn.dataset.micro;
    syncHeroUI();
    heroStage.draw();
    return;
  }
  if (e.target.closest("#ctrl-activation")) {
    state.activation = state.activation === "auto" ? "manual" : "auto";
    syncHeroUI();
    heroStage.draw();
  }
});

syncHeroUI();
heroStage.draw();

// ==================== 2. 01 节：三步闭环时序脉冲实验 ====================
(() => {
  const tabsWrap = document.getElementById("s1-tabs");
  const modesWrap = document.getElementById("s1-modes");
  const f1 = document.getElementById("s1-f1");
  const f2 = document.getElementById("s1-f2");
  const f3 = document.getElementById("s1-f3");
  const m1 = document.getElementById("s1-m1");
  const m2 = document.getElementById("s1-m2");
  const m3 = document.getElementById("s1-m3");
  const preview = document.getElementById("s1-preview");
  const vTitle = document.getElementById("s1-view-title");
  const vChip = document.getElementById("s1-status-chip");
  const vDesc = document.getElementById("s1-view-desc");
  const step3 = document.querySelector('#s1-board [data-step="response"]');

  const PANELS = [
    { name: "面板 A · 概览视图", info: "汇总关键指标与今日状态，用户一进页面最常落脚的起点。" },
    { name: "面板 B · 明细视图", info: "展开逐条记录与时间戳，承接用户从概览往下深挖的需求。" },
    { name: "面板 C · 对比视图", info: "并排对照两个周期的增减曲线，帮助做出判断。" },
    { name: "面板 D · 日志视图", info: "按发生顺序保留每次变更审计轨迹，便于回溯排错。" },
  ];

  const MODES = {
    instant: { ms: 90, warn: false, chip: "同步完成 · 90ms", explain: "90 毫秒落在人眼感知的「即时响应」经验区间（约 100ms 以内）：手指刚离开鼠标，高亮块与下方内容同时落位。" },
    async: { ms: 620, warn: false, chip: "加载环过渡 · 620ms", explain: "数据跨越网络耗时 620ms，但点击第 16ms 就立刻点亮高亮与 LOADING 虚线环，用户清楚知道系统正在拉数据而非卡死。" },
    stall: { ms: 1400, warn: true, chip: "静默卡顿 · 1400ms", explain: "超过 1 秒既无加载环也不改高亮，绝大多数用户会在第 0.6 秒怀疑自己没点中而反复连点，直接打碎上下文连贯感。" },
  };

  let curTab = 0;
  let curMode = "instant";
  let timer = 0;

  function trigger(tabIdx, modeKey) {
    clearTimeout(timer);
    curTab = tabIdx;
    curMode = modeKey;
    const cfg = MODES[curMode];
    const p = PANELS[curTab];

    for (const b of tabsWrap.querySelectorAll("button")) {
      const on = Number(b.dataset.tab) === curTab;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", String(on));
    }
    for (const b of modesWrap.querySelectorAll("button")) {
      b.classList.toggle("is-on", b.dataset.mode === curMode);
    }

    step3.classList.toggle("is-warn", cfg.warn);
    preview.classList.toggle("is-warn", cfg.warn);

    m1.textContent = "0 ms";
    m2.textContent = cfg.warn ? "等待中…" : "16 ms";
    m3.textContent = `${cfg.ms} ms`;

    f1.style.width = "100%";
    f2.style.width = cfg.warn ? "22%" : "100%";
    f3.style.width = "18%";
    vChip.textContent = cfg.warn ? "等待无反馈…" : (cfg.ms > 200 ? "LOADING 加载中…" : "同步中…");

    timer = setTimeout(() => {
      f2.style.width = "100%";
      f3.style.width = "100%";
      m2.textContent = cfg.warn ? "1400 ms（失联）" : "16 ms";
      vTitle.textContent = p.name;
      vChip.textContent = cfg.chip;
      vDesc.textContent = `${p.info} ${cfg.explain}`;
    }, Math.min(480, cfg.ms * 0.45));
  }

  tabsWrap.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (b) trigger(Number(b.dataset.tab), curMode);
  });
  modesWrap.addEventListener("click", (e) => {
    const b = e.target.closest("[data-mode]");
    if (b) trigger(curTab, b.dataset.mode);
  });
})();

// ==================== 3. 02 节：WAI-ARIA Roving Tabindex 活体实验室 ====================
(() => {
  const modeWrap = document.getElementById("s2-act-mode");
  const tablist = document.getElementById("s2-tablist");
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panel = document.getElementById("s2-panel");
  const pTitle = document.getElementById("s2-panel-title");
  const pBody = document.getElementById("s2-panel-body");
  const dump = document.getElementById("s2-dom-dump");
  const evTag = document.getElementById("s2-event-tag");
  const ruleNote = document.getElementById("s2-rule-note");

  const CONTENT = [
    { t: "设计规范 · 已激活", b: "本地数据切换无网络开销时，W3C APG 推荐自动激活：方向键每移一格，焦点和选中态同步推进，手眼零延迟。" },
    { t: "交互键盘 · 已激活", b: "Roving Tabindex 确保整排切换器只占 1 个 Tab 停靠点；焦点进栏后用 ← / → 游走，按 Tab 立刻跳过其余标签进入正文。" },
    { t: "加载反馈 · 已激活", b: "如果每切一个标签都要发起远程查询，请切到「手动激活」：方向键只挪焦点不发请求，等用户按 Enter 或 Space 才触发加载。" },
    { t: "完成回音 · 已激活", b: "激活后把 aria-labelledby 绑定到当前标签 ID，屏幕阅读器会清晰报出新面板归属，与视觉高亮保持一致。" },
  ];

  let mode = "auto";
  let selected = 0;
  let focused = 0;

  function renderDump(eventLabel) {
    evTag.textContent = eventLabel;
    const lines = tabs.map((el, idx) => {
      const isSel = idx === selected;
      const isFoc = idx === focused;
      const cls = isSel ? "hl-line" : "";
      const mark = isFoc ? " ◀ focus" : "";
      return `<div class="${cls}">&lt;button role="tab" aria-selected="${isSel}" tabindex="${isSel ? 0 : -1}"&gt;${el.textContent}&lt;/button&gt;${mark}</div>`;
    });
    dump.innerHTML = lines.join("");
    ruleNote.innerHTML = mode === "auto"
      ? `当前为<strong>自动激活</strong>：按 <code>←</code>/<code>→</code> 立即改变 <code>aria-selected="true"</code> 与 <code>tabindex="0"</code>，面板同步切换。`
      : `当前为<strong>手动激活</strong>：按 <code>←</code>/<code>→</code> 只移动焦点（注意 ◀ focus 跑到了未选中项上），按下 <code>Enter</code> 或 <code>Space</code> 才真正切换面板。`;
  }

  function activate(idx, reason) {
    selected = idx;
    focused = idx;
    tabs.forEach((el, i) => {
      const on = i === selected;
      el.classList.toggle("is-active", on);
      el.setAttribute("aria-selected", String(on));
      el.setAttribute("tabindex", on ? "0" : "-1");
    });
    panel.setAttribute("aria-labelledby", tabs[selected].id);
    pTitle.textContent = CONTENT[selected].t;
    pBody.textContent = CONTENT[selected].b;
    renderDump(reason);
  }

  modeWrap.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    mode = b.dataset.act;
    for (const x of modeWrap.querySelectorAll("button")) {
      x.classList.toggle("is-on", x.dataset.act === mode);
    }
    renderDump(mode === "auto" ? "切至自动激活" : "切至手动激活");
  });

  tablist.addEventListener("click", (e) => {
    const idx = tabs.indexOf(e.target.closest('[role="tab"]'));
    if (idx >= 0) activate(idx, `点击第 ${idx + 1} 项`);
  });

  tablist.addEventListener("keydown", (e) => {
    const n = tabs.length;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "Home" || e.key === "End") {
      e.preventDefault();
      if (e.key === "ArrowRight") focused = (focused + 1) % n;
      else if (e.key === "ArrowLeft") focused = (focused - 1 + n) % n;
      else if (e.key === "Home") focused = 0;
      else if (e.key === "End") focused = n - 1;
      tabs[focused].focus();
      if (mode === "auto") activate(focused, `键盘 ${e.key} 自动激活`);
      else renderDump(`键盘 ${e.key} 仅移焦点（待确认）`);
    } else if ((e.key === "Enter" || e.key === " ") && mode === "manual") {
      e.preventDefault();
      activate(focused, `按键 ${e.key === " " ? "Space" : "Enter"} 手动确认`);
    }
  });

  renderDump("初始态 · 第 1 项激活");
})();

// ==================== 4. 03 节：原海报四种形态真实数据解剖 ====================
(() => {
  const bar = document.getElementById("s3-morph-bar");
  const demo = document.getElementById("s3-demo");
  const spec = document.getElementById("s3-spec");

  const RECORDS = [
    { name: "登录弹窗规范", cat: "组件", status: "已上线", prio: "P0" },
    { name: "支付结果回执", cat: "流程", status: "评审中", prio: "P1" },
    { name: "列表空状态插画", cat: "组件", status: "已上线", prio: "P2" },
    { name: "导出 CSV 进度条", cat: "流程", status: "开发中", prio: "P1" },
    { name: "夜间模式对比度", cat: "主题", status: "已上线", prio: "P0" },
    { name: "字体缩放边界值", cat: "主题", status: "开发中", prio: "P2" },
  ];

  const MORPHS = {
    segmented: {
      title: "分段切换器 · Segmented Control",
      quote: "原海报原话：「通过切换在不同选项间快速切换当前视图。」",
      body: "像实体拨片开关的延伸，所有选项装进一条闭合胶囊轨，适合 2–5 个高频互斥态（如状态筛选：全部 / 已上线 / 开发中）。",
      count: "2–5 项",
      cost: "极低 · 单排紧凑",
      sub: ["全部", "已上线", "开发中"],
    },
    tabs: {
      title: "标签页 · Tabs",
      quote: "原海报原话：「以标签形式组织内容，便于分类与导航。」",
      body: "以底线或上凸耳页直接衔接下方整块内容容器，适合承载完整子面板、独立表单或大段分类文档。",
      count: "2–6 项",
      cost: "中 · 占整栏顶沿",
      sub: ["组件", "流程", "主题"],
    },
    view: {
      title: "视图切换 · View Switcher",
      quote: "原海报原话：「在不同视图模式之间切换，改变信息呈现。」",
      body: "过滤条件完全不变，只改变同一份数据的排版容器：网格适合扫图与概览，列表适合逐行比对字段。",
      count: "2–3 种形态",
      cost: "极低 · 图标按钮组",
      sub: ["网格视图", "列表视图"],
    },
    overflow: {
      title: "更多选项 · Overflow Switcher",
      quote: "原海报原话：「展开更多可选项，保持界面简洁。」",
      body: "当同级分类超过 5 项时，把最常用的 3 项留在前台单排，把长尾项折叠进第 4 格「更多 ▼」——宁可多一次点击，也不折成双排。",
      count: "前台 3 项 + 溢出",
      cost: "低 · 守住单排底线",
      sub: ["全部", "P0 紧急", "P1 常规", "更多：仅 P2"],
    },
  };

  let curMorph = "segmented";
  let curSub = 0;

  function render() {
    const m = MORPHS[curMorph];
    for (const b of bar.querySelectorAll("button")) {
      const on = b.dataset.morph === curMorph;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", String(on));
    }

    let list = RECORDS;
    if (curMorph === "segmented") {
      if (curSub === 1) list = RECORDS.filter((r) => r.status === "已上线");
      if (curSub === 2) list = RECORDS.filter((r) => r.status !== "已上线");
    } else if (curMorph === "tabs") {
      const cat = m.sub[curSub];
      list = RECORDS.filter((r) => r.cat === cat);
    } else if (curMorph === "overflow") {
      if (curSub === 1) list = RECORDS.filter((r) => r.prio === "P0");
      else if (curSub === 2) list = RECORDS.filter((r) => r.prio === "P1");
      else if (curSub === 3) list = RECORDS.filter((r) => r.prio === "P2");
    }

    const isList = curMorph === "view" && curSub === 1;
    const subBtns = m.sub
      .map((s, i) => `<button type="button" class="demo-pill ${i === curSub ? "is-on" : ""}" data-sub="${i}">${s}</button>`)
      .join("");
    const cardsHtml = list
      .map((r) => `<div class="demo-rec"><strong>${r.name}</strong><span class="demo-rec-tag">${r.cat} · ${r.status} · ${r.prio}</span></div>`)
      .join("");

    demo.innerHTML = `
      <div class="demo-subbar" role="group" aria-label="${m.title}实景切换">${subBtns}</div>
      <div class="${isList ? "demo-items-list" : "demo-items-grid"}">${cardsHtml}</div>
    `;

    spec.innerHTML = `
      <div>
        <h3>${m.title}</h3>
        <p style="margin-top:8px;color:#FFCA1C;font-weight:700">${m.quote}</p>
        <p style="margin-top:10px">${m.body}</p>
      </div>
      <div class="morph-stats">
        <div class="morph-stat"><span>建议容量</span><strong>${m.count}</strong></div>
        <div class="morph-stat"><span>空间代价</span><strong>${m.cost}</strong></div>
      </div>
    `;
  }

  bar.addEventListener("click", (e) => {
    const b = e.target.closest("[data-morph]");
    if (!b) return;
    curMorph = b.dataset.morph;
    curSub = 0;
    render();
  });

  demo.addEventListener("click", (e) => {
    const b = e.target.closest("[data-sub]");
    if (!b) return;
    curSub = Number(b.dataset.sub);
    render();
  });

  render();
})();

// ==================== 5. 04 节：Every Layout Switcher 实时容器拉伸 ====================
(() => {
  const sW = document.getElementById("s4-width");
  const sT = document.getElementById("s4-thresh");
  const vW = document.getElementById("s4-width-val");
  const vT = document.getElementById("s4-thresh-val");
  const mathBox = document.getElementById("s4-math");
  const vpN = document.getElementById("s4-vp-normal");
  const vpS = document.getElementById("s4-vp-sw");
  const swBox = document.getElementById("s4-sw-box");
  const stN = document.getElementById("s4-normal-state");
  const stS = document.getElementById("s4-sw-state");

  function update() {
    const laneInner = Math.max(250, Math.floor((vpN.parentElement?.clientWidth || 720) - 28));
    if (Number(sW.max) !== Math.min(720, Math.max(300, laneInner))) {
      const cap = Math.min(720, Math.max(300, laneInner));
      sW.max = String(cap);
      if (Number(sW.value) > cap) sW.value = String(cap);
    }
    const w = Math.min(Number(sW.value), laneInner);
    const t = Number(sT.value);
    vW.textContent = `${w}px`;
    vT.textContent = `${t}px`;
    vpN.style.width = `${w}px`;
    vpS.style.width = `${w}px`;
    swBox.style.setProperty("--threshold", `${t}px`);

    // 真实读取实绘子卡片的 offsetTop 判断排布结果（单真源，不靠猜）
    const measureRows = (box) => {
      const tops = [...box.children].map((c) => Math.round(c.getBoundingClientRect().top));
      const rows = new Map();
      tops.forEach((y) => {
        const key = [...rows.keys()].find((k) => Math.abs(k - y) < 8) ?? y;
        rows.set(key, (rows.get(key) || 0) + 1);
      });
      return [...rows.values()];
    };

    requestAnimationFrame(() => {
      const rNorm = measureRows(document.getElementById("s4-normal-box"));
      const rSw = measureRows(swBox);
      const isOrphan = rNorm.length === 2 && rNorm[1] === 1;
      stN.className = `alba-state ${isOrphan ? "is-orphan" : ""}`;
      stN.textContent = isOrphan
        ? "孤儿行：上 2 下 1！"
        : (rNorm.length === 1 ? "横排 3 列" : "竖叠 3 行");

      stS.className = "alba-state is-hl";
      stS.textContent = rSw.length === 1 ? "横排 3 列（零孤行）" : "全体同步竖叠 3 行";
    });

    const diff = t - w;
    const prod = diff * 999;
    mathBox.innerHTML = diff <= 0
      ? `(${t}px - ${w}px) × 999 = <strong>${prod}px（负值）</strong><br>CSS 钳制负 flex-basis → flex-grow:1 均分横排`
      : `(${t}px - ${w}px) × 999 = <strong>+${prod}px（极大正值）</strong><br>每项撑满 100% 容器宽 → 全体同步切竖排`;
  }

  sW.addEventListener("input", update);
  sT.addEventListener("input", update);
  window.addEventListener("resize", update);
  update();
})();

// ==================== 6. 05 节：从索引卡到分段控件年代标本 ====================
(() => {
  const rail = document.getElementById("s5-rail");
  const spec = document.getElementById("s5-specimen");
  const elYear = document.getElementById("s5-year");
  const elTitle = document.getElementById("s5-title");
  const elDesc = document.getElementById("s5-desc");
  const elTake = document.getElementById("s5-takeaway");

  const ERAS = [
    {
      year: "1982",
      title: "WordVision：最早把纸质索引耳搬进商用软件",
      desc: "由 Jim Edlin 与 Thomas A. Crispin 创立的 Bruce & James 为 IBM PC 推出的文字处理软件 WordVision，在鼠标尚未普及的文本屏幕里借用了实体活页卡片的「页耳」隐喻，让用户用功能键在不同文档与设置面板间原地切换。",
      take: "奠基启示：切换器从诞生第一天起，核心就是「不丢空间上下文的原地翻页」。",
      svg: `<svg viewBox="0 0 340 160"><rect x="6" y="6" width="328" height="148" rx="6" fill="#0B1324"/><rect x="20" y="20" width="300" height="120" fill="none" stroke="#6CE0B3" stroke-width="1.5"/><rect x="28" y="28" width="84" height="24" fill="#6CE0B3"/><text x="70" y="44" text-anchor="middle" font-family="JetBrains Mono" font-size="11" font-weight="700" fill="#0B1324">F1 SCROLL</text><text x="165" y="44" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#6CE0B3">F2 FORMAT</text><text x="262" y="44" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#6CE0B3">F3 FILES</text><line x1="20" y1="54" x2="320" y2="54" stroke="#6CE0B3" stroke-width="1.5"/><text x="34" y="82" font-family="JetBrains Mono" font-size="11" fill="#D4F5E8">WORDVISION (1982) · IBM PC</text><rect x="34" y="96" width="220" height="8" fill="#6CE0B3" opacity="0.35"/><rect x="34" y="112" width="160" height="8" fill="#6CE0B3" opacity="0.2"/></svg>`,
    },
    {
      year: "1985",
      title: "Boeing Calc：三维多页工作表铺路",
      desc: "波音计算机服务公司推出的 Boeing Calc 打破了平面二维电子表格的限制，把成百上千张工作表纵向叠成「三维工作簿」，直接启发了后来 Quattro Pro 与 Microsoft Excel 底部成排的工作表切换标签。",
      take: "奠基启示：当同构数据存在多个并行切面时，页签切换远胜于把全部字段摊成一张巨表。",
      svg: `<svg viewBox="0 0 340 160"><rect x="6" y="6" width="328" height="148" rx="8" fill="#EEF2FA"/><rect x="44" y="18" width="260" height="90" rx="4" fill="#CBD5EA" stroke="#7A89A8"/><rect x="32" y="28" width="260" height="90" rx="4" fill="#DDE4F4" stroke="#5A6C94"/><rect x="20" y="38" width="260" height="90" rx="4" fill="#FFFFFF" stroke="#0031ED" stroke-width="2"/><line x1="20" y1="62" x2="280" y2="62" stroke="#D2DBF0"/><line x1="90" y1="38" x2="90" y2="128" stroke="#D2DBF0"/><line x1="185" y1="38" x2="185" y2="128" stroke="#D2DBF0"/><rect x="28" y="128" width="66" height="20" rx="3" fill="#0031ED"/><text x="61" y="142" text-anchor="middle" font-size="10" font-weight="700" fill="#FFFFFF">PAGE 1</text><rect x="98" y="128" width="66" height="20" rx="3" fill="#D5DCEF"/><text x="131" y="142" text-anchor="middle" font-size="10" fill="#2A3550">PAGE 2</text><rect x="168" y="128" width="66" height="20" rx="3" fill="#D5DCEF"/><text x="201" y="142" text-anchor="middle" font-size="10" fill="#2A3550">PAGE 3</text></svg>`,
    },
    {
      year: "1995",
      title: "Windows 95 Property Sheets：大众桌面标准成形",
      desc: "Windows 95 在系统属性对话框与控制面板中全面推行带斜角凸起边框的「属性页（Property Sheets）」。当前页签直接与下方灰白面板连成一片无缝纸板，让上亿电脑用户彻底学会了标签切换器的空间隐喻。",
      take: "奠基启示：选中页签与面板融为一体（去掉底部隔线），至今仍是建立空间归属最强的一招。",
      svg: `<svg viewBox="0 0 340 160"><rect x="6" y="6" width="328" height="148" fill="#C0C0C0" stroke="#404040" stroke-width="2"/><rect x="10" y="10" width="320" height="22" fill="#000080"/><text x="18" y="25" font-size="11" font-weight="700" fill="#FFFFFF">Display Properties</text><rect x="20" y="42" width="76" height="24" fill="#DFDFDF" stroke="#FFFFFF" stroke-width="1.5"/><text x="58" y="58" text-anchor="middle" font-size="11" font-weight="700" fill="#000000">外观</text><rect x="98" y="46" width="74" height="20" fill="#B5B5B5" stroke="#808080"/><text x="135" y="60" text-anchor="middle" font-size="11" fill="#202020">背景</text><rect x="174" y="46" width="74" height="20" fill="#B5B5B5" stroke="#808080"/><text x="211" y="60" text-anchor="middle" font-size="11" fill="#202020">设置</text><rect x="20" y="65" width="300" height="78" fill="#DFDFDF" stroke="#808080"/><rect x="21" y="64" width="74" height="4" fill="#DFDFDF"/><rect x="36" y="82" width="130" height="10" fill="#808080" opacity="0.5"/><rect x="36" y="100" width="210" height="10" fill="#808080" opacity="0.3"/></svg>`,
    },
    {
      year: "1997",
      title: "Mac OS 8 Platinum：精致化的系统标签与分段控件基因",
      desc: "苹果在 1997 年发布的 Mac OS 8 Platinum 外观体系中，把标签页控件纳入系统级人机界面标准；随后在 macOS 与 iPhone 时代提炼出更轻盈、无需大块页框的 Segmented Control，并明确提出移动单排不超过约 5 项的容量建议。",
      take: "奠基启示：从拟物文件夹耳走向扁平分段胶囊，视觉越轻，越要靠高反差底色区分当前项。",
      svg: `<svg viewBox="0 0 340 160"><rect x="6" y="6" width="328" height="148" rx="10" fill="#E8EAF0" stroke="#9AA3B8" stroke-width="1.5"/><rect x="44" y="34" width="252" height="36" rx="10" fill="#CFD5E3"/><rect x="47" y="37" width="82" height="30" rx="8" fill="#FFFFFF"/><text x="88" y="56" text-anchor="middle" font-size="12" font-weight="700" fill="#0B1226">全部</text><text x="170" y="56" text-anchor="middle" font-size="12" fill="#424B63">文档</text><text x="252" y="56" text-anchor="middle" font-size="12" fill="#424B63">图片</text><rect x="44" y="84" width="252" height="52" rx="10" fill="#FFFFFF" stroke="#CFD5E3"/><rect x="60" y="98" width="110" height="8" rx="4" fill="#0031ED"/><rect x="60" y="114" width="180" height="6" rx="3" fill="#CBD3E6"/></svg>`,
    },
    {
      year: "2007",
      title: "NN/g《Tabs, Used Right》与移动触控标准",
      desc: "Jakob Nielsen 在 2007 年系统总结了标签页可用性铁律（后续持续更新）：严禁双排标签、严禁把跨站导航伪装成切换器、每项标签精简为一两个词、选中态必须和下方内容区强视觉绑定。",
      take: "奠基启示：绝大多数失败的切换器不是写不出代码，而是塞了太多项、折了第二排。",
      svg: `<svg viewBox="0 0 340 160"><rect x="6" y="6" width="328" height="148" rx="12" fill="#0031ED"/><rect x="24" y="24" width="292" height="36" rx="10" fill="#EBEBED"/><rect x="24" y="24" width="73" height="36" rx="10" fill="#FFCA1C"/><polygon points="60,60 53,60 60,68 67,60" fill="#FFCA1C"/><text x="60" y="46" text-anchor="middle" font-size="12" font-weight="900" fill="#140700">当前项</text><text x="133" y="46" text-anchor="middle" font-size="12" fill="#252C3F">选项二</text><text x="206" y="46" text-anchor="middle" font-size="12" fill="#252C3F">选项三</text><text x="279" y="46" text-anchor="middle" font-size="12" fill="#252C3F">更多</text><rect x="24" y="76" width="292" height="62" rx="10" fill="#FFFFFF"/><text x="42" y="102" font-size="12.5" font-weight="700" fill="#0B1226">单排 ≤ 5 项 · 清晰高亮 · 原地更新</text><text x="42" y="122" font-size="11" fill="#46526E">Jakob Nielsen (2007) · Apple HIG · Material 3</text></svg>`,
    },
    {
      year: "2019",
      title: "Every Layout The Switcher 与 W3C APG 现代规范",
      desc: "2019 年 Heydon Pickering 与 Andy Bell 出版《Every Layout》，以 Flexbox 阈值公式赋予「Switcher」布局原语的新含义（横排与全员竖排自动翻转）；同时 W3C WAI-ARIA APG 完备了标签切换器的 Roving Tabindex 与自动/手动激活标准。",
      take: "奠基启示：今天的「切换器」同时关照视觉交互体验、键盘无障碍语义，以及容器自响应排版。",
      svg: `<svg viewBox="0 0 340 160"><rect x="6" y="6" width="328" height="148" rx="12" fill="#07164D"/><rect x="22" y="22" width="142" height="52" rx="8" fill="#0031ED"/><text x="34" y="44" font-size="11" font-weight="700" fill="#FFCA1C">UI 交互切换器</text><text x="34" y="62" font-size="10" fill="#E3EBFF">ARIA Tabs · 6 微状态</text><rect x="176" y="22" width="142" height="52" rx="8" fill="#142B80" stroke="#FFCA1C" stroke-width="1.5"/><text x="188" y="44" font-size="11" font-weight="700" fill="#FFFFFF">布局原语 Switcher</text><text x="188" y="62" font-size="10" fill="#FFCA1C">calc((T-100%)*999)</text><rect x="22" y="88" width="296" height="48" rx="8" fill="rgba(255,255,255,0.08)"/><text x="170" y="116" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#7FFFD4">状态清晰 × 键盘可达 × 窄屏不留孤行</text></svg>`,
    },
  ];

  function show(idx) {
    const e = ERAS[idx];
    for (const b of rail.querySelectorAll("button")) {
      const on = Number(b.dataset.era) === idx;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", String(on));
    }
    elYear.textContent = e.year;
    elTitle.textContent = e.title;
    elDesc.textContent = e.desc;
    elTake.textContent = e.take;
    spec.innerHTML = e.svg;
  }

  rail.addEventListener("click", (e) => {
    const b = e.target.closest("[data-era]");
    if (b) show(Number(b.dataset.era));
  });

  show(0);
})();

// ==================== 7. 06 节：场景诊断切换板 ====================
(() => {
  const list = document.getElementById("s6-list");
  const card = document.getElementById("s6-verdict");
  const pill = document.getElementById("s6-pill");
  const alt = document.getElementById("s6-alt");
  const title = document.getElementById("s6-title");
  const why = document.getElementById("s6-why");
  const tip = document.getElementById("s6-tip");

  const SCENARIOS = [
    {
      ok: true,
      alt: "推荐形态：分段切换器（3 项）",
      title: "教科书级场景：日 / 周 / 月互斥时间粒度",
      why: "三个选项天然互斥、数量极克制（3 项）、共享同一张折线图容器，用户切换后只需要看最新粒度的曲线而不必同时叠看三张图。",
      tip: "做法建议：默认高亮最常看的「周」，本地缓存三份数据让切换落进 100ms 内，体验丝滑。",
    },
    {
      ok: false,
      alt: "别用切换器 · 改用并排对比表",
      title: "反例：强行把需要对照的两个套餐藏进切换器",
      why: "买方要逐行对比「基础版」与「专业版」的价格与额度。塞进切换器等于每看一行就得来回点一次，全靠人脑短时记忆硬扛，转化率直接掉血。",
      tip: "做法建议：直接并排呈现两列；窄屏可借 04 节的 Every Layout Switcher 或横向对比表保留同屏对照能力。",
    },
    {
      ok: true,
      alt: "推荐形态：视图切换（2 项）",
      title: "完美匹配：同一批商品的网格 ⇄ 列表切换",
      why: "数据完全同源，只换视觉呈现密度——挑款式看网格大图，比价格与库存看列表字段。原海报第三张卡片「视图切换」正是为此而生。",
      tip: "做法建议：切换视图后记住用户偏好并保持滚动位置或已选筛选条件不丢失。",
    },
    {
      ok: false,
      alt: "别用切换器 · 改用 247 侧栏原语",
      title: "反例：把 14 个后台一级业务模块硬塞进顶部切换器",
      why: "超过 7 项后无论折成双排还是缩成极窄碎片，扫描效率都会崩塌；况且一级模块之间跨度大，本质上是全局站点导航而非局部视图切换。",
      tip: "做法建议：交给可分组、可折叠的侧栏导航（参见 247 侧栏原语），切换器只留给具体业务页内部的 2–5 个二级切面。",
    },
    {
      ok: false,
      alt: "别用切换器 · 改用多选筛选标签簇",
      title: "反例：把可同时生效的筛选条件做成互斥切换器",
      why: "「包邮」「现货」「降价」之间不是非此即彼，用户往往想同时勾选两项。切换器的心智模型是「单选互斥」，用它做多选会让用户彻底困惑。",
      tip: "做法建议：改用可独立开关的多选芯片组（参见 246 簇群 的水平紧凑排布），并配清晰「已选数量 + 清空」。",
    },
    {
      ok: false,
      alt: "别用切换器 · 改用步骤条 Stepper",
      title: "反例：用自由跳转的切换器代替强顺序结账流程",
      why: "填地址 → 选配送 → 核对发票 → 支付有严格的前置校验依赖。切换器暗示「可以随便点任意一格」，用户直接跳到第 4 格却撞上一堆红字报错。",
      tip: "做法建议：改用线性步骤条，清晰标出「已完成 / 当前步 / 待解锁」，把自由度留给真正无顺序依赖的同级视图。",
    },
  ];

  function select(idx) {
    const s = SCENARIOS[idx];
    for (const b of list.querySelectorAll(".sc-item")) {
      b.classList.toggle("is-on", Number(b.dataset.sc) === idx);
    }
    card.classList.toggle("is-no", !s.ok);
    pill.textContent = s.ok ? "✓ 适合用切换器" : "× 别用切换器";
    alt.textContent = s.alt;
    title.textContent = s.title;
    why.textContent = s.why;
    tip.textContent = s.tip;
  }

  list.addEventListener("click", (e) => {
    const b = e.target.closest("[data-sc]");
    if (b) select(Number(b.dataset.sc));
  });

  select(0);
})();

// ==================== 8. 07 节：小练习单变量判题 ====================
(() => {
  const quiz = document.getElementById("s7-quiz");
  const fb = document.getElementById("s7-feedback");
  const fbTitle = document.getElementById("s7-fb-title");
  const fbBody = document.getElementById("s7-fb-body");

  const EXPLAIN = {
    A: {
      ok: false,
      title: "方案 A 容易出空间断裂（正确答案是方案 C）",
      body: "双排标签是 Jakob Nielsen 在《Tabs, Used Right》里重点点名的反模式：当用户点中上排的「总览」时，它和下方内容区之间硬生生夹着下排三个未选标签，视觉归属被切断；若为了连在一起把两排互换顺序，整个按钮位置乱跳会更让人崩溃。",
    },
    B: {
      ok: false,
      title: "方案 B 把字和触控区都挤碎了（正确答案是方案 C）",
      body: "在 375px 手机屏里强塞 7 格，除去左右边距每格宽不到 48px，汉字被截成「总… / 流…」，用户根本猜不出含义，拇指稍歪就误触隔壁。",
    },
    C: {
      ok: true,
      title: "答对了！方案 C 守住了单排、可读性与高频直达",
      body: "把最高频的 3 项稳留在单排前台，每格宽约 85px、完整显示词义且零折行；其余 4 项收进原海报第 4 张卡倡导的「更多 ▼」溢出入口，并在选中长尾项时于第 4 格高亮回显当前视图名，兼顾效率与秩序。",
    },
    D: {
      ok: false,
      title: "方案 D 藏得太深，丢掉了切换器的效率优势（正确答案是方案 C）",
      body: "把全部 7 项都塞进右上角菜单确实不挤，但日常 80% 的时间里用户只是在「总览 / 流量 / 转化」之间切来切去——每次都要多点一次展开菜单、多找一次入口，把一眼可达的切换器退化成了隐藏下拉框。",
    },
  };

  quiz.addEventListener("click", (e) => {
    const card = e.target.closest("[data-opt]");
    if (!card) return;
    const pick = card.dataset.opt;
    const res = EXPLAIN[pick];

    for (const c of quiz.querySelectorAll(".quiz-card")) {
      const opt = c.dataset.opt;
      c.setAttribute("aria-pressed", String(opt === pick));
      c.classList.remove("is-correct", "is-wrong");
      if (opt === "C") c.classList.add("is-correct");
      else if (opt === pick && !res.ok) c.classList.add("is-wrong");
    }
    fb.hidden = false;
    fb.className = `quiz-feedback ${res.ok ? "is-ok" : "is-err"}`;
    fbTitle.textContent = res.title;
    fbBody.textContent = res.body;
  });
})();

// ==================== 9. 08 节：原海报放大拖拽灯箱 ====================
(() => {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbVp = document.getElementById("lb-viewport");
  const lbScale = document.getElementById("lb-scale");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = false;
  let sx = 0;
  let sy = 0;

  function apply() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    lbScale.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => { scale = Math.min(3.5, +(scale + 0.35).toFixed(2)); apply(); });
  btnOut.addEventListener("click", () => { scale = Math.max(0.6, +(scale - 0.35).toFixed(2)); apply(); });
  btnReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; apply(); });

  lbVp.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    scale = Math.max(0.6, Math.min(3.5, +(scale + delta).toFixed(2)));
    apply();
  }, { passive: false });

  lbVp.addEventListener("pointerdown", (e) => {
    if (e.target === lbVp) { close(); return; }
    drag = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    try { lbVp.setPointerCapture(e.pointerId); } catch {}
  });
  lbVp.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    apply();
  });
  lbVp.addEventListener("pointerup", () => { drag = false; });
  lbVp.addEventListener("pointercancel", () => { drag = false; });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
})();

// 349 数据图表页 · 入口编排器
import {
  SCENARIOS,
  CHART_TYPES,
  PALETTE_MODES,
  createBrokenState,
  applyPreset,
  evaluate,
} from "./model.js";
import { mountHeroCanvas } from "./hero-canvas.js";
import { mountAllSections } from "./sections.js";

let state = createBrokenState("poster");

const $ = (id) => document.getElementById(id);

const els = {
  topBadge: $("top-status-badge"),
  titleBars: $("title-mini-bars"),
  principlesList: $("hero-principles"),
  scenarioWrap: $("scenario-tabs"),
  concHeadline: $("conc-headline"),
  concSubline: $("conc-subline"),
  concFixBtn: $("conc-fix-btn"),
  concStrip: $("conc-strip"),
  chartTypeWrap: $("chart-type-rail"),
  legendTargetBtn: $("legend-target-toggle"),
  legendActualLabel: $("legend-actual-label"),
  legendTargetLabel: $("legend-target-label"),
  canvas: $("hero-canvas"),
  kpiStrip: $("kpi-strip"),
  kpiCards: $("kpi-cards"),
  diagScore: $("diag-score"),
  diagReadTier: $("diag-read-tier"),
  diagTitle: $("diag-title"),
  diagWhy: $("diag-why"),
  diagFix: $("diag-fix"),
  diagCard: $("diag-card"),
  baseSlider: $("ctrl-ybase"),
  baseVal: $("ctrl-ybase-val"),
  clutterBtn: $("ctrl-clutter"),
  paletteWrap: $("ctrl-palette"),
  annoBtn: $("ctrl-anno"),
  kpiBtn: $("ctrl-kpi"),
  calBtn: $("btn-calibrate"),
  scanBtn: $("btn-scan"),
  topScanBtn: $("top-scan-btn"),
  resetBtn: $("btn-reset"),
  notesGrid: $("notes-grid"),
};

const KPI_ICONS = {
  trend: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/></svg>`,
  peak: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12.6 2.6c.4 3.1-1.9 5-1.9 7.6 0 1.4.9 2.5 2.1 2.5 1.5 0 2.6-1.4 2.5-3.4 2.3 1.7 3.7 4.2 3.7 6.9 0 3.7-3 6.3-7 6.3s-7-2.7-7-6.5c0-4.2 3.1-7.4 7.6-13.4z"/></svg>`,
  target: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><line x1="17.5" y1="6.5" x2="21" y2="3"/></svg>`,
};

const NOTE_ICONS = {
  "n-chart": `<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>`,
  "n-anno": `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4V7a2 2 0 0 1 2-2z"/></svg>`,
  "n-title": `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.7 1 1.5 1 2.5h6c0-1 .2-1.8 1-2.5A6 6 0 0 0 12 3z"/></svg>`,
  "n-compare": `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 4v16M5 8h14M6 8l-2 6h4l-2-6zm12 0l-2 6h4l-2-6z"/></svg>`,
  "n-kpi": `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4v8h8"/></svg>`,
};

let canvasCtl = null;

function syncUI(skipCanvas) {
  const ev = evaluate(state);
  const okAll = ev.score === 5;

  // 顶部状态胶囊
  if (els.topBadge) {
    els.topBadge.textContent = okAll ? `5/5 · ${ev.solutionName}` : `${ev.score}/5 · ${ev.primaryFault.tag}`;
    els.topBadge.classList.toggle("is-pass", okAll);
  }

  // 自示范标题旁微缩柱列（随实时数据联动高度与色感）
  if (els.titleBars) {
    const maxV = Math.max(...state.actual, 1);
    els.titleBars.innerHTML = state.actual
      .map((v, i) => {
        const h = Math.max(22, Math.round((v / maxV) * 100));
        const isPeak = i === ev.live.peakIdx;
        return `<span class="mini-bar${isPeak ? " is-peak" : ""}" style="height:${h}%"></span>`;
      })
      .join("");
  }

  // 顶栏右列 3 枚原海报原则实时探针
  if (els.principlesList) {
    els.principlesList.innerHTML = ev.principles
      .map(
        (p, idx) => `
        <div class="principle-item${p.ok ? " is-ok" : " is-bad"}">
          <span class="principle-ico" aria-hidden="true">${
            idx === 0 ? NOTE_ICONS["n-chart"] : idx === 1 ? NOTE_ICONS["n-anno"] : KPI_ICONS.target
          }</span>
          <div class="principle-text">
            <div class="principle-top">
              <strong>${p.title}</strong>
              <span class="probe-chip${p.ok ? " is-ok" : " is-bad"}">${p.badge}</span>
            </div>
            <span>${p.desc}</span>
          </div>
        </div>
      `
      )
      .join("");
  }

  // 剧本切换胶囊
  if (els.scenarioWrap) {
    els.scenarioWrap.querySelectorAll("[data-scenario]").forEach((b) => {
      const on = b.dataset.scenario === state.scenario;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  // 第一层：珊瑚红「结论」活体动作标题条
  if (els.concHeadline && els.concSubline && els.concFixBtn) {
    const titleBad = !ev.okTitle;
    els.concStrip.classList.toggle("is-bad", titleBad);
    els.concHeadline.textContent = ev.text.headline;
    els.concSubline.textContent = ev.text.subline;
    if (state.titleMode === "topic") {
      els.concFixBtn.textContent = "改为结论先行 →";
      els.concFixBtn.dataset.action = "toAction";
    } else if (!ev.live.matchesPosterStory && state.titleMode === "action") {
      els.concFixBtn.textContent = "按实数同步结论 →";
      els.concFixBtn.dataset.action = "syncTitle";
    } else {
      els.concFixBtn.textContent = "切回空壳标题试错";
      els.concFixBtn.dataset.action = "toTopic";
    }
  }

  // 左侧图表类型与图例轨
  if (els.chartTypeWrap) {
    els.chartTypeWrap.querySelectorAll("[data-chart-type]").forEach((b) => {
      const on = b.dataset.chartType === state.chartType;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }
  if (els.legendActualLabel) els.legendActualLabel.textContent = `${ev.sc.seriesNames[0]}（${ev.sc.unit}）`;
  if (els.legendTargetLabel) els.legendTargetLabel.textContent = `${ev.sc.seriesNames[1]}（${ev.sc.unit}）`;
  if (els.legendTargetBtn) {
    els.legendTargetBtn.classList.toggle("is-on", state.showTarget);
    els.legendTargetBtn.setAttribute("aria-pressed", String(state.showTarget));
  }

  // 第三层：纯白圆角「重点数据」实时 KPI 条
  if (els.kpiCards && els.kpiStrip) {
    els.kpiStrip.classList.toggle("is-minimal", state.kpiMode === "minimal");
    els.kpiStrip.classList.toggle("is-overload", state.kpiMode === "overload");
    if (state.kpiMode === "minimal") {
      els.kpiCards.innerHTML = `<div class="kpi-minimal-note"><strong>高层极简解（无冗余副卡）</strong><span>已省略下方指标卡，让全部视觉注意力集中在上方柱图与珊瑚峰值标注上。</span></div>`;
    } else if (state.kpiMode === "overload") {
      els.kpiCards.innerHTML = ev.kpis
        .map(
          (k) => `
          <div class="kpi-mini-card">
            <span class="kpi-mini-lbl">${k.label}</span>
            <strong class="kpi-mini-val">${k.value}</strong>
            <span class="kpi-mini-sub">${k.sub}</span>
          </div>
        `
        )
        .join("");
    } else {
      els.kpiCards.innerHTML = ev.kpis
        .map(
          (k) => `
          <div class="kpi-card tone-${k.tone}">
            <span class="kpi-medallion">${KPI_ICONS[k.icon]}</span>
            <div class="kpi-meta">
              <span class="kpi-label">${k.label}</span>
              <strong class="kpi-num">${k.value}</strong>
              <span class="kpi-sub">${k.sub}</span>
            </div>
          </div>
        `
        )
        .join("");
    }
  }

  // 单真源白话诊单卡
  if (els.diagCard) {
    els.diagCard.classList.toggle("is-pass", okAll);
    els.diagScore.textContent = okAll ? `5/5 · ${ev.solutionName}` : `${ev.score}/5 · ${ev.primaryFault.tag}`;
    els.diagReadTier.textContent = `${ev.readTier} · 墨水比：${ev.inkTier}`;
    if (okAll) {
      els.diagTitle.textContent = `全项通过：${ev.solutionName}（谎言因子 ${ev.lieFactor.toFixed(1)}×）`;
      els.diagWhy.textContent = `纵轴忠实对齐基准，图表类型与视觉权重突出 ${ev.live.peakQ}（${ev.live.peakVal} ${ev.sc.unit}），顶栏结论与右侧标注完全自洽。试试上下拖动 Q4 蓝柱压低数值，看看结论穿帮警报如何工作。`;
      els.diagFix.textContent = "继续试验：按 Space 放飞 3 秒扫视路线，或点下方反向试错卡体会常见翻车。";
    } else {
      const f = ev.primaryFault;
      els.diagTitle.textContent = f.title;
      els.diagWhy.textContent = f.why;
      els.diagFix.textContent = `下一步：${f.fix}`;
    }
  }

  // 精控台同步
  if (els.baseSlider) {
    els.baseSlider.max = String(ev.sc.maxBase);
    els.baseSlider.value = String(state.yBase);
    els.baseVal.textContent =
      state.yBase === 0 ? `0（诚实基线 · 1.0×）` : `${state.yBase}（截断 · 谎言 ${ev.lieFactor.toFixed(1)}×）`;
  }
  if (els.clutterBtn) {
    els.clutterBtn.textContent = state.clutter === "heavy" ? "图表去噪：重网噪杂" : "图表去噪：清爽直标";
    els.clutterBtn.classList.toggle("is-active", state.clutter === "clean");
  }
  if (els.paletteWrap) {
    els.paletteWrap.querySelectorAll("[data-palette]").forEach((b) => {
      const on = b.dataset.palette === state.paletteMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }
  if (els.annoBtn) {
    const labels = { none: "标注：缺失", live: "标注：随数同步", poster: "标注：固定旧文", verbose: "标注：密字长段" };
    els.annoBtn.textContent = labels[state.annoMode] || "标注";
    els.annoBtn.classList.toggle("is-active", ev.okAnno);
  }
  if (els.kpiBtn) {
    const labels = { clean: "重点卡：3项聚焦", minimal: "重点卡：无副卡", overload: "重点卡：6卡超载", posterBug: "重点卡：口径错标" };
    els.kpiBtn.textContent = labels[state.kpiMode] || "重点卡";
    els.kpiBtn.classList.toggle("is-active", state.kpiMode === "clean" || state.kpiMode === "minimal");
  }

  // 第四层：原海报底部 5 列「教学笔记」实时探针
  if (els.notesGrid) {
    els.notesGrid.innerHTML = ev.notes
      .map(
        (n) => `
        <div class="note-col${n.ok ? " is-ok" : " is-bad"}">
          <div class="note-head">
            <span class="note-ico">${NOTE_ICONS[n.id]}</span>
            <strong>${n.title}</strong>
            <span class="probe-chip${n.ok ? " is-ok" : " is-bad"}">${n.status}</span>
          </div>
          <p>${n.body}</p>
        </div>
      `
      )
      .join("");
  }

  if (!skipCanvas && canvasCtl) canvasCtl.markDirty();
}

function mutate(patch, skipCanvas = false) {
  state = { ...state, ...patch };
  syncUI(skipCanvas);
}

function startScan() {
  state = { ...state, scanActive: true, scanT: 0 };
  syncUI(false);
}

// 挂载开场 2D Canvas
canvasCtl = mountHeroCanvas(els.canvas, () => state, mutate);

// 绑定场景、图表型、结论、对比与精控台事件
els.scenarioWrap?.addEventListener("click", (e) => {
  const b = e.target.closest("[data-scenario]");
  if (!b) return;
  const targetId = b.dataset.scenario;
  if (targetId === state.scenario) return;
  const sc = SCENARIOS[targetId];
  const wasClean = evaluate(state).score === 5;
  state = wasClean ? applyPreset({ ...state, scenario: targetId }, "poster") : createBrokenState(targetId);
  if (wasClean) {
    state.actual = [...sc.actual];
    state.target = [...sc.target];
  }
  syncUI();
});

els.concFixBtn?.addEventListener("click", () => {
  const act = els.concFixBtn.dataset.action;
  if (act === "toAction") mutate({ titleMode: "action" });
  else if (act === "syncTitle") mutate({ titleMode: "synced" });
  else mutate({ titleMode: "topic" });
});

els.chartTypeWrap?.addEventListener("click", (e) => {
  const b = e.target.closest("[data-chart-type]");
  if (!b) return;
  mutate({ chartType: b.dataset.chartType });
});

els.legendTargetBtn?.addEventListener("click", () => mutate({ showTarget: !state.showTarget }));

els.baseSlider?.addEventListener("input", () => mutate({ yBase: Number(els.baseSlider.value) }));

els.clutterBtn?.addEventListener("click", () =>
  mutate({ clutter: state.clutter === "heavy" ? "clean" : "heavy" })
);

els.paletteWrap?.addEventListener("click", (e) => {
  const b = e.target.closest("[data-palette]");
  if (!b) return;
  mutate({ paletteMode: b.dataset.palette });
});

els.annoBtn?.addEventListener("click", () => {
  const order = ["live", "verbose", "none"];
  const next = order[(order.indexOf(state.annoMode) + 1) % order.length];
  mutate({ annoMode: next });
});

els.kpiBtn?.addEventListener("click", () => {
  const order = ["clean", "minimal", "posterBug", "overload"];
  const next = order[(order.indexOf(state.kpiMode) + 1) % order.length];
  mutate({ kpiMode: next });
});

els.calBtn?.addEventListener("click", () => {
  state = applyPreset(state, "poster");
  syncUI();
});

els.resetBtn?.addEventListener("click", () => {
  state = createBrokenState(state.scenario);
  syncUI();
});

els.scanBtn?.addEventListener("click", startScan);
els.topScanBtn?.addEventListener("click", startScan);

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state = applyPreset(state, btn.dataset.preset);
    syncUI();
  });
});

// 键盘操作：左右键微调纵轴起点，Space 触发 3 秒扫视验真
window.addEventListener("keydown", (e) => {
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) return;
  const dlg = document.getElementById("poster-modal");
  if (dlg && !dlg.hidden) return;
  if (e.code === "Space") {
    e.preventDefault();
    startScan();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    mutate({ yBase: Math.max(0, state.yBase - 10) });
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    const maxB = SCENARIOS[state.scenario].maxBase;
    mutate({ yBase: Math.min(maxB, state.yBase + 10) });
  }
});

// 首次同步并挂载 01–07 节全部交互
syncUI();
mountAllSections();

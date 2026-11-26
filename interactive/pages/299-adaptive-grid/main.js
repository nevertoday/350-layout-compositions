// 299 自适应网格 · 主控制流（连接单真源 model.js、开场画布 stage.js、四屏预览、五步流水线与正文各节）
import {
  createInitialState,
  getPresetStates,
  evaluateState,
  applySmartFix,
} from "./model.js";
import { createHeroStage } from "./stage.js";
import {
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
  initPosterLightbox,
} from "./sections.js";

let state = createInitialState("poster");
let lastEval = null;

const el = {
  canvas: document.getElementById("hero-canvas"),
  statusPill: document.getElementById("hero-status-pill"),
  titleDemo: document.getElementById("title-grid-demo"),
  inWidth: document.getElementById("ctrl-width"),
  outWidth: document.getElementById("out-width"),
  inGutter: document.getElementById("ctrl-gutter"),
  outGutter: document.getElementById("out-gutter"),
  inMinCol: document.getElementById("ctrl-mincol"),
  outMinCol: document.getElementById("out-mincol"),
  selBadge: document.getElementById("sel-card-badge"),
  btnClamp: document.getElementById("btn-clamp"),
  verdictBox: document.getElementById("callout-balance"),
  verdictTag: document.getElementById("verdict-tag"),
  verdictTitle: document.getElementById("verdict-title"),
  verdictWhy: document.getElementById("verdict-why"),
  verdictAction: document.getElementById("verdict-action"),
  btnFix: document.getElementById("btn-smart-fix"),
  btnCss: document.getElementById("btn-toggle-css"),
  cssBox: document.getElementById("live-css-box"),
  cssCode: document.getElementById("live-css-code"),
  deviceStrip: document.getElementById("device-strip"),
};

function renderDeviceMiniSvg(layout, bpWidth) {
  const vw = bpWidth <= 400 ? 96 : bpWidth <= 680 ? 136 : bpWidth <= 820 ? 156 : 210;
  const vh = 104;
  const pad = 6;
  const availW = vw - pad * 2;
  const scale = availW / layout.containerWidth;
  const rows = Math.max(1, layout.rowCount);
  const gY = Math.max(2, Math.min(6, layout.gutter * scale));
  const rowH = Math.max(11, Math.min(26, (vh - pad * 2 - (rows - 1) * gY) / rows));

  let rects = "";
  for (const p of layout.placements) {
    const rx = pad + p.x * scale;
    const ry = pad + p.row * (rowH + gY);
    const rw = Math.max(5, p.w * scale);
    const fill = p.overflowed ? "#FDE9E5" : "#E5E5E5";
    const stroke = p.overflowed ? "#9C1706" : "#CFCFCF";
    rects += `<rect x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${rw.toFixed(1)}" height="${rowH.toFixed(1)}" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="${p.overflowed ? 1.5 : 0.8}"/>`;
  }
  if (layout.overflowPx > 0) {
    rects += `<line x1="${vw - 3}" y1="2" x2="${vw - 3}" y2="${vh - 2}" stroke="#9C1706" stroke-width="2.2" stroke-dasharray="3 2"/>`;
  }
  return `<svg class="dev-screen" viewBox="0 0 ${vw} ${vh}" aria-hidden="true">${rects}</svg>`;
}

const stage = createHeroStage(el.canvas, {
  onWidthChange(w) {
    state.containerWidth = w;
    syncAll();
  },
  onCardClick(idx) {
    if (state.selectedIdx === idx) {
      const cur = state.spans[idx] || 1;
      state.spans[idx] = cur >= 4 ? 1 : cur + 1;
    } else {
      state.selectedIdx = idx;
    }
    syncAll();
  },
  onSelectedSpanDelta(delta) {
    const idx = state.selectedIdx;
    const cur = state.spans[idx] || 1;
    state.spans[idx] = Math.max(1, Math.min(6, cur + delta));
    syncAll();
  },
  onSelectOffset(step) {
    const len = state.spans.length;
    state.selectedIdx = (state.selectedIdx + step + len) % len;
    syncAll();
  },
});

let lastTitleKey = "";
let lastDevicesRuleKey = "";
let lastCssKey = "";

function setTextIfChanged(node, text) {
  if (node && node.textContent !== text) node.textContent = text;
}

function syncAll() {
  const ev = evaluateState(state);
  lastEval = ev;
  const cur = ev.current;

  // 1. 驱动开场 2D Canvas 舞台（由 rAF 主循环合并重绘，不触发双绘）
  stage.setEvaluation(ev, state.selectedIdx);

  // 2. 顶眉状态签与标题自示范活体列尺（脏检查避开无谓 DOM 重建）
  setTextIfChanged(el.statusPill, ev.verdict.badge);
  if (el.statusPill.dataset.state !== ev.verdict.status) el.statusPill.dataset.state = ev.verdict.status;

  const slotCount = Math.max(1, Math.min(12, cur.renderedCols));
  const titleKey = `${slotCount}:${cur.overflowPx > 0 ? 1 : 0}`;
  if (titleKey !== lastTitleKey) {
    lastTitleKey = titleKey;
    el.titleDemo.classList.toggle("is-overflow", cur.overflowPx > 0);
    el.titleDemo.innerHTML = Array.from({ length: slotCount }, () => "<i></i>").join("");
  }

  // 3. 原海报右上 5 行关键词实时读数
  for (const kw of ev.keywordsLive) {
    const li = document.querySelector(`#hero-keywords li[data-kw="${kw.key}"]`);
    const out = document.getElementById(`kw-val-${kw.key}`);
    if (li && li.dataset.state !== kw.status) li.dataset.state = kw.status;
    setTextIfChanged(out, kw.value);
  }

  // 4. 滑轨、按钮与选中卡状态同步
  document.querySelectorAll("[data-theme]").forEach((b) => {
    const active = b.dataset.theme === state.themeId;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });

  if (el.inWidth.value !== String(state.containerWidth)) el.inWidth.value = String(state.containerWidth);
  setTextIfChanged(el.outWidth, `${state.containerWidth}px`);
  if (el.inGutter.value !== String(state.gutter)) el.inGutter.value = String(state.gutter);
  setTextIfChanged(el.outGutter, `${state.gutter}px`);
  if (el.inMinCol.value !== String(state.minColWidth)) el.inMinCol.value = String(state.minColWidth);
  setTextIfChanged(el.outMinCol, `最小 ${state.minColWidth}px`);

  const sel = ev.selectedCard;
  if (sel) {
    setTextIfChanged(el.selBadge, `${sel.code} · SPAN ${sel.requestedSpan}${sel.clamped ? `→${sel.usedSpan}` : ""}`);
    document.querySelectorAll("[data-set-span]").forEach((b) => {
      b.classList.toggle("is-active", +b.dataset.setSpan === sel.requestedSpan);
    });
  }

  el.btnClamp.setAttribute("aria-pressed", String(state.clampSpan));
  setTextIfChanged(el.btnClamp, `窄屏钳制：${state.clampSpan ? "开" : "关"}`);

  document.querySelectorAll("[data-fill]").forEach((b) => b.classList.toggle("is-active", b.dataset.fill === state.fillMode));
  document.querySelectorAll("[data-flow]").forEach((b) => b.classList.toggle("is-active", b.dataset.flow === state.flowMode));

  // 5. 单真源白话研判卡片
  if (el.verdictBox.dataset.state !== ev.verdict.status) el.verdictBox.dataset.state = ev.verdict.status;
  setTextIfChanged(el.verdictTag, ev.verdict.badge);
  setTextIfChanged(el.verdictTitle, ev.verdict.title);
  setTextIfChanged(el.verdictWhy, ev.verdict.why);
  setTextIfChanged(el.verdictAction, ev.verdict.action);
  setTextIfChanged(el.btnFix, ev.isBalanced ? "切换原海报 8 列经典解" : "按当前诊断修一步");
  if (ev.cssLines !== lastCssKey) {
    lastCssKey = ev.cssLines;
    el.cssCode.textContent = ev.cssLines;
  }

  // 6. 原海报左下「核心规则」5 条实时体检
  for (const r of ev.rulesLive) {
    const li = document.querySelector(`#rules-list li[data-rule="${r.id}"]`);
    const badge = document.getElementById(`rule-val-${r.id}`);
    if (li && li.dataset.state !== r.status) li.dataset.state = r.status;
    setTextIfChanged(badge, r.reading);
  }

  // 7. 原海报右下「响应式示例 360/640/768/1200+」活体四屏同步预览（仅规则变时重建 SVG，拖宽时零 DOM 重建）
  const ruleKey = `${state.themeId}|${state.minColWidth}|${state.gutter}|${state.fillMode}|${state.flowMode}|${state.clampSpan}|${state.spans.join(",")}`;
  if (ruleKey !== lastDevicesRuleKey) {
    lastDevicesRuleKey = ruleKey;
    el.deviceStrip.innerHTML = ev.devices
      .map((d) => {
        const ly = d.layout;
        const isCurrent = Math.abs(state.containerWidth - d.width) <= 36;
        const isOver = ly.overflowPx > 0;
        const isTight = ly.colWidth < 120;
        const statText = isOver
          ? `溢出 +${ly.overflowPx}px`
          : `${ly.renderedCols} 列 · ${Math.round(ly.colWidth)}px`;
        return `<button type="button" class="device-card${isCurrent ? " is-current" : ""}${isOver ? " is-overflow" : ""}${isTight ? " is-tight" : ""}" data-jump-width="${d.width}" aria-label="将主容器宽度切到 ${d.label} ${d.width}px">
          <div class="dev-head"><span class="dev-name">${d.label}</span><span class="dev-width">${d.short}</span></div>
          <div class="dev-stat">${statText}</div>
          ${renderDeviceMiniSvg(ly, d.width)}
        </button>`;
      })
      .join("");
  } else {
    el.deviceStrip.querySelectorAll(".device-card").forEach((btn) => {
      const w = +btn.dataset.jumpWidth;
      btn.classList.toggle("is-current", Math.abs(state.containerWidth - w) <= 36);
    });
  }

  // 8. 原海报底沿奶油淡黄「自适应逻辑流程」5 步实时演算值
  for (const step of ev.pipeline) {
    const li = document.querySelector(`#logic-steps li[data-step="${step.step}"]`);
    const span = document.getElementById(`pipe-val-${step.step}`);
    if (li && li.dataset.state !== step.status) li.dataset.state = step.status;
    setTextIfChanged(span, step.sub);
  }
}

// ---------- 绑定开场控件事件 ----------
document.querySelectorAll("[data-theme]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state = createInitialState(btn.dataset.theme);
    syncAll();
  });
});

el.inWidth.addEventListener("input", () => {
  state.containerWidth = +el.inWidth.value;
  syncAll();
});

el.inGutter.addEventListener("input", () => {
  state.gutter = +el.inGutter.value;
  syncAll();
});

el.inMinCol.addEventListener("input", () => {
  state.minColWidth = +el.inMinCol.value;
  syncAll();
});

document.getElementById("btn-span-dec").addEventListener("click", () => {
  const i = state.selectedIdx;
  state.spans[i] = Math.max(1, (state.spans[i] || 1) - 1);
  syncAll();
});

document.getElementById("btn-span-inc").addEventListener("click", () => {
  const i = state.selectedIdx;
  state.spans[i] = Math.min(6, (state.spans[i] || 1) + 1);
  syncAll();
});

document.querySelectorAll("[data-set-span]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.spans[state.selectedIdx] = +btn.dataset.setSpan;
    syncAll();
  });
});

el.btnClamp.addEventListener("click", () => {
  state.clampSpan = !state.clampSpan;
  syncAll();
});

document.querySelectorAll("[data-fill]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.fillMode = btn.dataset.fill;
    syncAll();
  });
});

document.querySelectorAll("[data-flow]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.flowMode = btn.dataset.flow;
    syncAll();
  });
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const presets = getPresetStates(state.themeId);
    const next = presets[btn.dataset.preset];
    if (next) {
      state = { ...next, spans: [...next.spans] };
      syncAll();
    }
  });
});

el.btnFix.addEventListener("click", () => {
  state = applySmartFix(state, lastEval);
  syncAll();
});

el.btnCss.addEventListener("click", () => {
  const nextHidden = !el.cssBox.hidden;
  el.cssBox.hidden = nextHidden;
  el.btnCss.setAttribute("aria-expanded", String(!nextHidden));
  el.btnCss.textContent = nextHidden ? "看实时 CSS" : "收起 CSS";
});

el.deviceStrip.addEventListener("click", (e) => {
  const card = e.target.closest("[data-jump-width]");
  if (!card) return;
  state.containerWidth = +card.dataset.jumpWidth;
  syncAll();
});

// 初始化全部模块
syncAll();
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initPosterLightbox();

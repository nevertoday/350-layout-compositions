// 284 表单布局 · 主交互控制器
// 负责首屏活体表单真实输入与校验闭环、眼动 Canvas 联动、01–08 节全部实验与原海报灯箱。

import {
  SCENARIOS,
  CONTROLS,
  INITIAL_STATE,
  PRESETS,
  createDefaultValues,
  validateValues,
  evaluateForm,
  evaluateAlignCompare,
  CHUNK_FIELDS,
  evaluateChunking,
  VALIDATION_MODES,
  ACTION_LAYOUTS,
  LINEAGE_ITEMS,
  USE_CASES,
  PRACTICE_QUIZ,
} from "./model.js";
import { measureFormGeometry, createEyeSystem, createChunkMeter } from "./eye-overlay.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ============================================================
// 一、首屏活体表单状态与单真源渲染
// ============================================================
const state = { ...INITIAL_STATE };
let fieldValues = createDefaultValues(state.scenario);
let backupValues = null;
let touchedFields = new Set(["phone"]); // 初始即标记手机号曾触碰，方便原海报错误条呈现
let cachedGeometry = { points: [], avgLabelGapPx: 108, zigzagCount: 6, groupRatio: 1.0, totalPathPx: 1800, isNarrow: false };
let submitStatusMsg = "";

const liveFormEl = $("#live-form");
const scrubberCanvas = $("#saccade-scrubber");
const overlayCanvas = $("#form-eye-canvas");
const undoToast = $("#undo-toast");

const GROUP_ICONS = {
  user: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="3.6"></circle><path d="M5 19.5c1.4-3.3 4.2-4.8 7-4.8s5.6 1.5 7 4.8"></path></svg>',
  briefcase: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3.5" y="7.5" width="17" height="12" rx="2"></rect><path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2"></path></svg>',
  shield: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3.5 5 6.5v5.3c0 4.4 3 7.7 7 9.2 4-1.5 7-4.8 7-9.2V6.5l-7-3Z"></path><polyline points="9 12 11.2 14.2 15.2 10"></polyline></svg>',
};

function renderControlButtons() {
  for (const dim of ["align", "grouping", "clarity", "action"]) {
    const host = $(`#ctrl-${dim}`);
    host.innerHTML = CONTROLS[dim]
      .map(
        (opt) =>
          `<button type="button" class="ctrl-btn${state[dim] === opt.id ? " is-active" : ""}" data-dim="${dim}" data-val="${opt.id}" data-kind="${opt.kind}" aria-pressed="${state[dim] === opt.id}">${opt.label}</button>`
      )
      .join("");
  }
}

function buildLiveFormHTML() {
  const sc = SCENARIOS[state.scenario];
  const validation = validateValues(state.scenario, fieldValues);
  const useOptionalStyle = state.clarity === "inline-guide";
  const showFieldError = (fid) => {
    if (!validation.errors[fid]) return false;
    if (state.clarity === "placeholder-only") return false;
    if (state.clarity === "premature") return true;
    return state.submittedOnce || touchedFields.has(fid);
  };

  const groupsHtml = sc.groups
    .map((g) => {
      const fieldsHtml = g.fields
        .map((f) => {
          const val = fieldValues[f.id];
          const errMsg = validation.errors[f.id];
          const isErr = showFieldError(f.id);
          const isValidFlash =
            !errMsg &&
            touchedFields.has(f.id) &&
            f.type !== "checkbox" &&
            String(val || "").trim().length > 0 &&
            (state.clarity === "inline-summary" || state.clarity === "inline-guide");

          if (f.type === "checkbox") {
            return `
              <div class="lf-field is-full is-checkbox${isErr ? " is-error" : ""}" data-field-item="${f.id}" data-field-type="checkbox">
                <label class="lf-check-label">
                  <input type="checkbox" name="${f.id}" data-input-id="${f.id}" ${val ? "checked" : ""}>
                  <span>${escapeHtml(f.label)}</span>
                </label>
                ${isErr ? `<p class="lf-err-inline">${escapeHtml(errMsg)}</p>` : ""}
              </div>`;
          }

          const marker = useOptionalStyle
            ? !f.required
              ? `<span class="lf-opt-badge">(可选)</span>`
              : ""
            : f.required
              ? `<span class="lf-star" aria-hidden="true">*</span>`
              : "";

          const phText =
            state.clarity === "placeholder-only"
              ? `${f.label}${f.required ? " *" : ""}：${f.placeholder}`
              : f.placeholder;

          let ctrlHtml = "";
          if (f.type === "select") {
            const opts = f.options
              .map((o) => `<option value="${escapeHtml(o)}"${o === val ? " selected" : ""}>${escapeHtml(o)}</option>`)
              .join("");
            ctrlHtml = `<select class="lf-input" id="lf-${f.id}" data-input-id="${f.id}">${opts}</select>`;
          } else if (f.type === "textarea") {
            const len = String(val || "").length;
            ctrlHtml = `
              <textarea class="lf-input" id="lf-${f.id}" data-input-id="${f.id}" maxlength="${f.maxLength || 200}" placeholder="${escapeHtml(phText)}">${escapeHtml(val)}</textarea>
              <span class="lf-char-count" data-count-for="${f.id}">${len} / ${f.maxLength || 200}</span>`;
          } else {
            ctrlHtml = `<input class="lf-input" type="${f.type}" id="lf-${f.id}" data-input-id="${f.id}" value="${escapeHtml(val)}" placeholder="${escapeHtml(phText)}" autocomplete="off">`;
          }

          return `
            <div class="lf-field${f.full ? " is-full" : ""}${isErr ? " is-error" : ""}${isValidFlash ? " is-valid-flash" : ""}" data-field-item="${f.id}" data-field-type="${f.type}">
              <label class="lf-label" for="lf-${f.id}">
                <span class="lf-label-text">${escapeHtml(f.label)}</span>${marker}
              </label>
              <div class="lf-control-wrap">${ctrlHtml}</div>
              ${f.help ? `<p class="lf-help">${escapeHtml(f.help)}</p>` : ""}
              ${isErr ? `<p class="lf-err-inline" data-err-for="${f.id}">${escapeHtml(errMsg)}</p>` : `<p class="lf-err-inline" data-err-for="${f.id}" hidden></p>`}
            </div>`;
        })
        .join("");

      return `
        <div class="lf-group" data-group-id="${g.id}" data-accent="${g.accent}">
          <div class="lf-group-head">
            <span class="lf-group-icon" aria-hidden="true">${GROUP_ICONS[g.icon] || GROUP_ICONS.user}</span>
            <div class="lf-group-titles">
              <strong>${escapeHtml(g.title)}${g.optionalGroup ? '<span class="lf-opt-tag">（可选）</span>' : ""}</strong>
              <span lang="en">${g.en}</span>
            </div>
            ${g.requiredBadge && !useOptionalStyle ? '<span class="lf-req-badge">• 必填项</span>' : ""}
          </div>
          <div class="lf-fields">${fieldsHtml}</div>
        </div>`;
    })
    .join("");

  // 错误汇总条（1:1 呼应原海报底红条 + 定位错误按钮；错态时退化为哑巴报错或缺失定位）
  let summaryHtml = "";
  if (validation.list.length > 0) {
    if (state.clarity === "placeholder-only") {
      summaryHtml = `
        <div class="lf-error-summary" role="alert">
          <div class="lf-err-sum-text">
            <strong>▲ 表单填写有误，无法提交</strong>
          </div>
        </div>`;
    } else if (state.clarity === "premature") {
      const items = validation.list.map((e) => `<li>${escapeHtml(e.msg)}</li>`).join("");
      summaryHtml = `
        <div class="lf-error-summary" role="alert">
          <div class="lf-err-sum-text">
            <strong>▲ 输入格式尚未达标（过早校验模式已实时标红）：</strong>
            <ul>${items}</ul>
          </div>
        </div>`;
    } else {
      const firstErr = validation.list[0];
      const items = validation.list.map((e) => `<li>${escapeHtml(e.msg)}</li>`).join("");
      summaryHtml = `
        <div class="lf-error-summary" role="alert">
          <div class="lf-err-sum-text">
            <strong>▲ 请检查并修正以下内容：</strong>
            <ul>${items}</ul>
          </div>
          <button type="button" class="lf-locate-btn" data-locate-field="${firstErr.id}">定位错误</button>
        </div>`;
    }
  } else if (submitStatusMsg) {
    summaryHtml = `
      <div class="lf-error-summary is-success" role="status">
        <div class="lf-err-sum-text">
          <strong>✓ ${escapeHtml(submitStatusMsg)}</strong>
        </div>
      </div>`;
  }

  // 底部行动按钮栏（四种不同主次配置）
  let actionButtonsHtml = "";
  if (state.action === "equal-flat") {
    actionButtonsHtml = `
      <button type="button" class="lf-btn lf-btn-solid" data-role="reset">${escapeHtml(sc.resetLabel)}</button>
      <button type="button" class="lf-btn lf-btn-solid" data-role="cancel">${escapeHtml(sc.cancelLabel)}</button>
      <button type="submit" class="lf-btn lf-btn-solid" data-role="submit">确定</button>`;
  } else if (state.action === "inverted") {
    actionButtonsHtml = `
      <button type="button" class="lf-btn lf-btn-solid" data-role="reset">${escapeHtml(sc.resetLabel)}</button>
      <button type="submit" class="lf-btn lf-btn-muted-box" data-role="submit">${escapeHtml(sc.submitLabel)}</button>`;
  } else if (state.action === "primary-ghost") {
    actionButtonsHtml = `
      <button type="submit" class="lf-btn lf-btn-solid" data-role="submit">${escapeHtml(sc.submitLabel)} →</button>
      <button type="button" class="lf-btn lf-btn-ghost" data-role="cancel">${escapeHtml(sc.cancelLabel)}</button>`;
  } else {
    actionButtonsHtml = `
      <button type="button" class="lf-btn lf-btn-outline" data-role="cancel">${escapeHtml(sc.cancelLabel)}</button>
      <button type="submit" class="lf-btn lf-btn-solid" data-role="submit">${escapeHtml(sc.submitLabel)} →</button>`;
  }

  return `
    ${groupsHtml}
    ${summaryHtml}
    <div class="lf-action-bar">
      <div class="lf-action-row">${actionButtonsHtml}</div>
      <p class="lf-submit-note">${escapeHtml(sc.submitNote)}</p>
    </div>`;
}

function syncDiagnostics() {
  const validation = validateValues(state.scenario, fieldValues);
  cachedGeometry = measureFormGeometry(liveFormEl, state);
  const report = evaluateForm(state, cachedGeometry, validation);

  // 1. 顶眉状态胶囊
  const badgeText = report.allPassed ? "4 / 4 清晰顺手" : `${report.passedCount} / 4 待整表`;
  const topBadge = $("#top-status-badge");
  topBadge.textContent = badgeText;
  topBadge.dataset.level = report.diagLevel;

  // 2. 自示范标题底沿联动
  const demoBar = $("#title-demo-bar");
  const demoGap = $("#title-demo-gap");
  demoBar.dataset.align = state.align;
  if (state.align === "left-split") {
    demoGap.textContent =
      report.stats.zigzags > 0
        ? `裂口 ${report.stats.gapPx}px · 折返 ${report.stats.zigzags} 次`
        : `左标签裂口 ${report.stats.gapPx}px`;
  } else if (state.align === "center") {
    demoGap.textContent = "失去左基准线";
  } else if (state.align === "right-side" && cachedGeometry.isNarrow) {
    demoGap.textContent = "窄屏标签挤窄框";
  } else {
    demoGap.textContent = `基准齐 · 跨距 ${report.stats.gapPx}px`;
  }

  // 3. 原海报左列四点检查轨 + 底沿四圆徽实时状态
  for (const dim of ["align", "grouping", "clarity", "action"]) {
    const d = report.dims[dim];
    const spineItem = $(`.spine-item[data-focus-dim="${dim}"]`);
    const chip = $(`#spine-chip-${dim}`);
    if (spineItem) spineItem.dataset.level = d.level;
    if (chip) chip.textContent = d.statusTag;

    const stripItem = $(`.strip-item[data-strip-dim="${dim}"]`);
    const stripLive = $(`#strip-live-${dim}`);
    if (stripItem) stripItem.dataset.ok = String(d.ok);
    if (stripLive) stripLive.textContent = d.ok ? "到位" : "待调";
  }

  // 4. 白话单真源诊单
  const diagCard = $("#diag-card");
  diagCard.dataset.level = report.diagLevel;
  $("#diag-tag").textContent = report.allPassed
    ? `成立 · ${report.solutionName}（4/4）`
    : `错态 · ${report.passedCount} / 4 项就位`;
  $("#diag-title").textContent = report.headline;
  $("#diag-body").textContent = report.body;
  $("#diag-fix").textContent = report.nextAction;

  $("#metric-gap").textContent = `${report.stats.gapPx}px`;
  $("#metric-zigzag").textContent = `${report.stats.zigzags} 次`;
  $("#metric-ratio").textContent = `${report.stats.groupRatio.toFixed(2)}×`;
  $("#metric-band").textContent = report.stats.saccadeBand;

  eyeSystem.redraw();
}

function renderLiveForm({ preserveFocusId = null } = {}) {
  liveFormEl.dataset.align = state.align;
  liveFormEl.dataset.grouping = state.grouping;
  liveFormEl.dataset.clarity = state.clarity;
  liveFormEl.dataset.action = state.action;
  liveFormEl.innerHTML = buildLiveFormHTML();
  renderControlButtons();

  // 更新题材页签激活状态
  $$(".tab-btn", $(".scenario-tabs")).forEach((b) => {
    const active = b.dataset.scenario === state.scenario;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });

  if (preserveFocusId) {
    const el = liveFormEl.querySelector(`[data-input-id="${preserveFocusId}"]`);
    if (el) {
      el.focus({ preventScroll: true });
      if (el.setSelectionRange && typeof el.value === "string") {
        const len = el.value.length;
        try { el.setSelectionRange(len, len); } catch {}
      }
    }
  }

  // 等待浏览器排完 DOM 再精确测算坐标盒并重画眼动层
  requestAnimationFrame(() => syncDiagnostics());
}

// 初始化双 Canvas 眼动系统
const eyeSystem = createEyeSystem({
  scrubberCanvas,
  overlayCanvas,
  getState: () => state,
  getGeometry: () => cachedGeometry,
  onScrub: (u) => {
    state.scrubber = u;
    scrubberCanvas.setAttribute("aria-valuenow", String(Math.round(u * 100)));
  },
});

// 监听活体表单真实输入、聚焦、失焦、提交与定位错误
liveFormEl.addEventListener("input", (e) => {
  const input = e.target.closest("[data-input-id]");
  if (!input) return;
  const fid = input.dataset.inputId;
  fieldValues[fid] = input.type === "checkbox" ? input.checked : input.value;
  submitStatusMsg = "";

  // 实时更新多行文本字数统计
  const counter = liveFormEl.querySelector(`[data-count-for="${fid}"]`);
  if (counter) counter.textContent = `${String(fieldValues[fid] || "").length} / ${input.maxLength || 200}`;

  // 局部校验更新（避免每次敲字重建整张 DOM 导致输入法断掉！）
  const validation = validateValues(state.scenario, fieldValues);
  const fieldWrap = input.closest("[data-field-item]");
  const errSlot = fieldWrap?.querySelector(`[data-err-for="${fid}"]`);
  const errMsg = validation.errors[fid];

  if (state.clarity === "premature") {
    touchedFields.add(fid);
    if (fieldWrap) {
      fieldWrap.classList.toggle("is-error", Boolean(errMsg));
      fieldWrap.classList.toggle("is-valid-flash", !errMsg && String(fieldValues[fid] || "").trim().length > 0);
    }
    if (errSlot) {
      errSlot.hidden = !errMsg;
      errSlot.textContent = errMsg || "";
    }
  } else if (touchedFields.has(fid) && !errMsg) {
    // 奖励早：一旦用户改对，立刻消红亮青
    if (fieldWrap) {
      fieldWrap.classList.remove("is-error");
      fieldWrap.classList.add("is-valid-flash");
    }
    if (errSlot) {
      errSlot.hidden = true;
      errSlot.textContent = "";
    }
  }
  syncDiagnostics();
});

liveFormEl.addEventListener("focusin", (e) => {
  const input = e.target.closest("[data-input-id]");
  if (input) eyeSystem.focusField(input.dataset.inputId);
});

liveFormEl.addEventListener("focusout", (e) => {
  const input = e.target.closest("[data-input-id]");
  if (!input) return;
  const fid = input.dataset.inputId;
  touchedFields.add(fid);
  // 离焦后轻量刷新校验状态与汇总条（不夺走当前焦点）
  const activeId = document.activeElement?.dataset?.inputId || null;
  if (state.clarity !== "placeholder-only") {
    renderLiveForm({ preserveFocusId: activeId });
  } else {
    syncDiagnostics();
  }
});

liveFormEl.addEventListener("click", (e) => {
  const locateBtn = e.target.closest("[data-locate-field]");
  if (locateBtn) {
    const fid = locateBtn.dataset.locateField;
    const target = liveFormEl.querySelector(`[data-input-id="${fid}"]`);
    if (target) {
      target.focus();
      eyeSystem.focusField(fid);
    }
    return;
  }

  const resetBtn = e.target.closest("[data-role='reset']");
  if (resetBtn) {
    backupValues = { ...fieldValues };
    for (const k of Object.keys(fieldValues)) {
      fieldValues[k] = typeof fieldValues[k] === "boolean" ? false : "";
    }
    submitStatusMsg = "";
    undoToast.hidden = false;
    renderLiveForm();
    return;
  }

  const cancelBtn = e.target.closest("[data-role='cancel']");
  if (cancelBtn) {
    submitStatusMsg = "已触发次要操作「取消」：草稿仍安全保留，未清空表单。";
    renderLiveForm();
  }
});

liveFormEl.addEventListener("submit", (e) => {
  e.preventDefault();
  state.submittedOnce = true;
  const validation = validateValues(state.scenario, fieldValues);
  if (validation.valid) {
    submitStatusMsg = `校验通过！「${SCENARIOS[state.scenario].shortLabel}」数据完整，已可安全提交。`;
    eyeSystem.setProgress(1);
    renderLiveForm();
  } else {
    submitStatusMsg = "";
    renderLiveForm();
    if (state.clarity !== "placeholder-only") {
      const firstId = validation.list[0].id;
      const target = liveFormEl.querySelector(`[data-input-id="${firstId}"]`);
      if (target) {
        target.focus();
        eyeSystem.focusField(firstId);
      }
    }
  }
});

$("#btn-undo-reset").addEventListener("click", () => {
  if (backupValues) {
    fieldValues = { ...backupValues };
    backupValues = null;
  }
  undoToast.hidden = true;
  renderLiveForm();
});

// 四维调控按钮点击
$("#control-dock").addEventListener("click", (e) => {
  const btn = e.target.closest(".ctrl-btn");
  if (!btn) return;
  const { dim, val } = btn.dataset;
  state[dim] = val;
  submitStatusMsg = "";
  undoToast.hidden = true;
  renderLiveForm();
});

// 题材切换与快切预设
$(".scenario-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (!btn) return;
  state.scenario = btn.dataset.scenario;
  fieldValues = createDefaultValues(state.scenario);
  touchedFields = new Set(["phone"]);
  submitStatusMsg = "";
  undoToast.hidden = true;
  renderLiveForm();
});

$(".preset-actions").addEventListener("click", (e) => {
  const presetBtn = e.target.closest("[data-preset]");
  if (presetBtn) {
    const p = PRESETS[presetBtn.dataset.preset];
    if (p) {
      Object.assign(state, p);
      submitStatusMsg = "";
      undoToast.hidden = true;
      renderLiveForm();
    }
    return;
  }
  if (e.target.closest("#btn-toggle-overlay")) {
    state.showOverlay = !state.showOverlay;
    const btn = $("#btn-toggle-overlay");
    btn.classList.toggle("is-on", state.showOverlay);
    btn.setAttribute("aria-pressed", String(state.showOverlay));
    btn.textContent = state.showOverlay ? "眼动轨：开" : "眼动轨：关";
    eyeSystem.redraw();
  }
});

// 点击左列原海报四点检查轨高亮对应调控行
$(".spine-rail").addEventListener("click", (e) => {
  const item = e.target.closest(".spine-item");
  if (!item) return;
  const dim = item.dataset.focusDim;
  $$(".ctrl-row").forEach((r) => r.classList.toggle("is-highlighted", r.dataset.dimRow === dim));
  const row = $(`.ctrl-row[data-dim-row="${dim}"]`);
  if (row) row.scrollIntoView({ block: "nearest" });
});

// 视口变化时重测 DOM 坐标盒
let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => syncDiagnostics(), 90);
});

// ============================================================
// 二、01 节：三联对齐方式对照 + 标签长度滑块
// ============================================================
const alignSlider = $("#align-len-slider");
function renderAlignCompare() {
  const level = Number(alignSlider.value);
  const { preset, cards } = evaluateAlignCompare(level);
  $("#align-len-tag").textContent = preset.tag;
  $("#align-len-note").textContent = preset.note;

  $("#align-trio").innerHTML = cards
    .map((c) => {
      const rows = preset.labels
        .map((lbl) => {
          const gapSpan = c.mode === "left" ? '<span class="am-gap-bar" aria-hidden="true"></span>' : "";
          return `
            <div class="am-row">
              <span class="am-lbl"><span>${escapeHtml(lbl)}</span>${gapSpan}</span>
              <span class="am-box" aria-hidden="true"></span>
            </div>`;
        })
        .join("");
      return `
        <article class="align-card" data-tone="${c.tone}">
          <div class="align-card-head">
            <h3>${c.title}</h3>
            <span lang="en">${c.en}</span>
          </div>
          <div class="align-mini-form" data-mode="${c.mode}">${rows}</div>
          <div class="align-card-meta">
            <span class="align-pill">${c.gapLabel}</span>
            <span class="align-pill">${c.fixations}</span>
          </div>
          <p><strong>${c.verdict}。</strong>${c.summary}</p>
        </article>`;
    })
    .join("");
}
alignSlider.addEventListener("input", renderAlignCompare);

// ============================================================
// 三、02 节：分组切刀实验 + 2D Canvas 密度标尺
// ============================================================
const chunkState = {
  cuts: new Set(), // 初始 0 刀：10 项全糊在一块
  border: "accent",
  reqMark: "required",
};
const chunkListEl = $("#chunk-list");
const chunkMeter = createChunkMeter($("#chunk-meter-canvas"), () =>
  evaluateChunking([...chunkState.cuts], chunkState.border, chunkState.reqMark)
);

function renderChunkLab() {
  const sortedCuts = [...chunkState.cuts].sort((a, b) => a - b);
  const evalData = evaluateChunking(sortedCuts, chunkState.border, chunkState.reqMark);
  chunkListEl.dataset.border = chunkState.border;

  // 按切刀拆分分组
  const groups = [];
  let start = 0;
  for (const c of sortedCuts) {
    groups.push({ start, items: CHUNK_FIELDS.slice(start, c) });
    start = c;
  }
  groups.push({ start, items: CHUNK_FIELDS.slice(start) });

  const GROUP_NAMES = ["第 1 组", "第 2 组", "第 3 组", "第 4 组", "第 5 组", "第 6 组", "第 7 组", "第 8 组", "第 9 组", "第 10 组"];

  let html = "";
  groups.forEach((grp, gi) => {
    const inner = grp.items
      .map((f, idxInGrp) => {
        const globalIdx = grp.start + idxInGrp;
        const mark =
          chunkState.reqMark === "optional"
            ? !f.req
              ? '<span class="lf-opt-badge">（可选）</span>'
              : ""
            : f.req
              ? '<span class="lf-star">*</span>'
              : "";
        const nextIdx = globalIdx + 1;
        const slotHtml =
          idxInGrp < grp.items.length - 1
            ? `<button type="button" class="cut-slot" data-cut-at="${nextIdx}">＋ 在此插入分组边界</button>`
            : "";
        return `
          <div class="chunk-row">
            <span class="chunk-row-main">${escapeHtml(f.label)}${mark}</span>
            <span class="chunk-row-hint">${escapeHtml(f.hint)}</span>
          </div>
          ${slotHtml}`;
      })
      .join("");

    html += `
      <div class="chunk-group-box" data-gi="${gi % 4}">
        ${groups.length > 1 ? `<div class="chunk-group-cap">${GROUP_NAMES[gi]} · ${grp.items.length} 项</div>` : ""}
        ${inner}
      </div>`;

    if (gi < groups.length - 1) {
      const cutAt = sortedCuts[gi];
      html += `<button type="button" class="cut-slot is-cut" data-cut-at="${cutAt}">× 已在此处分组（点击合并回上一组）</button>`;
    }
  });

  chunkListEl.innerHTML = html;

  const sumCard = $("#chunk-summary-card");
  sumCard.dataset.status = evalData.status;
  $("#chunk-count-badge").textContent = `${evalData.groupCount} 组 · 10 项`;
  $("#chunk-verdict").textContent = evalData.verdict;
  $("#chunk-why").textContent = evalData.why;
  $("#chunk-noise").textContent = evalData.noiseLevel;
  chunkMeter.redraw();
}

chunkListEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-cut-at]");
  if (!btn) return;
  const idx = Number(btn.dataset.cutAt);
  if (chunkState.cuts.has(idx)) chunkState.cuts.delete(idx);
  else chunkState.cuts.add(idx);
  renderChunkLab();
});

$("#chunk-border-bar").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-border]");
  if (!btn) return;
  chunkState.border = btn.dataset.border;
  $$(".pill-btn", $("#chunk-border-bar")).forEach((b) => b.classList.toggle("is-active", b === btn));
  renderChunkLab();
});

$("#chunk-req-bar").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-req]");
  if (!btn) return;
  chunkState.reqMark = btn.dataset.req;
  $$(".pill-btn", $("#chunk-req-bar")).forEach((b) => b.classList.toggle("is-active", b === btn));
  renderChunkLab();
});

$("#btn-chunk-ideal").addEventListener("click", () => {
  chunkState.cuts = new Set([3, 6]);
  renderChunkLab();
});
$("#btn-chunk-clear").addEventListener("click", () => {
  chunkState.cuts = new Set();
  renderChunkLab();
});
$("#btn-chunk-overcut").addEventListener("click", () => {
  chunkState.cuts = new Set([1, 2, 4, 5, 7, 9]);
  renderChunkLab();
});

// ============================================================
// 四、03 节：校验时机对战舱（真实可键入 + 自动模拟逐字输入）
// ============================================================
const valState = {
  mode: "smartBlur",
  interrupts: 0,
  blurredEmail: false,
  blurredPwd: false,
  simTimer: 0,
};

const valEmailInput = $("#val-email-input");
const valPwdInput = $("#val-pwd-input");
const valEmailWrap = $("#val-email-wrap");
const valPwdWrap = $("#val-pwd-wrap");
const valEmailMsg = $("#val-email-msg");
const valPwdMsg = $("#val-pwd-msg");

function checkValEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
function checkValPwd(v) {
  return v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);
}

function updateValidationLabView() {
  const cfg = VALIDATION_MODES[valState.mode];
  $("#val-form-box").dataset.mode = valState.mode;
  const tag = $("#val-mode-tag");
  tag.textContent = cfg.tag;
  tag.dataset.tone = cfg.tone;
  $("#val-mode-desc").textContent = cfg.desc;
  $("#val-wcag-status").textContent = cfg.wcag;
  $("#val-interrupt-count").textContent = `${valState.interrupts} 次`;

  const hasText = valEmailInput.value.length > 0 || valPwdInput.value.length > 0;
  $("#val-rule-visible").textContent =
    valState.mode === "placeholder" && hasText
      ? "已消失（开始打字后占位符被覆盖）"
      : valState.mode === "placeholder"
        ? "仅空框时短暂可见"
        : "全程常驻可见";

  valEmailInput.placeholder =
    valState.mode === "placeholder" ? "工作邮箱（需含 @ 与域名）" : "name@company.cn";
  valPwdInput.placeholder =
    valState.mode === "placeholder" ? "访问口令（至少 8 位含字母与数字）" : "至少 8 位，需含字母与数字";
}

function runFieldCheck(field, trigger) {
  const isEmail = field === "email";
  const input = isEmail ? valEmailInput : valPwdInput;
  const wrap = isEmail ? valEmailWrap : valPwdWrap;
  const msgEl = isEmail ? valEmailMsg : valPwdMsg;
  const ok = isEmail ? checkValEmail(input.value) : checkValPwd(input.value);
  const empty = input.value.trim().length === 0;
  const badText = isEmail ? "邮箱格式不正确，需包含 @ 与域名" : "口令需至少 8 位并同时包含字母和数字";
  const okText = isEmail ? "✓ 邮箱格式正确" : "✓ 口令强度达标";

  if (valState.mode === "premature") {
    if (trigger === "input" && !ok && !empty) {
      valState.interrupts++;
    }
    wrap.classList.toggle("is-err", !ok);
    wrap.classList.toggle("is-ok", ok);
    msgEl.textContent = ok ? okText : badText;
  } else if (valState.mode === "submitOnly" || valState.mode === "placeholder") {
    if (trigger === "submit") {
      wrap.classList.toggle("is-err", !ok);
      wrap.classList.toggle("is-ok", ok);
      msgEl.textContent = ok ? okText : valState.mode === "placeholder" ? "输入格式有误" : badText;
    } else {
      wrap.classList.remove("is-err", "is-ok");
      msgEl.textContent = "";
    }
  } else {
    // smartBlur：离焦报错，改对即绿
    const blurred = isEmail ? valState.blurredEmail : valState.blurredPwd;
    if (ok) {
      wrap.classList.remove("is-err");
      wrap.classList.add("is-ok");
      msgEl.textContent = okText;
    } else if (trigger === "blur" || trigger === "submit" || blurred) {
      wrap.classList.add("is-err");
      wrap.classList.remove("is-ok");
      msgEl.textContent = badText;
    } else {
      wrap.classList.remove("is-err", "is-ok");
      msgEl.textContent = "";
    }
  }
  updateValidationLabView();
}

function resetValInputs() {
  clearInterval(valState.simTimer);
  valEmailInput.value = "";
  valPwdInput.value = "";
  valState.interrupts = 0;
  valState.blurredEmail = false;
  valState.blurredPwd = false;
  [valEmailWrap, valPwdWrap].forEach((w) => w.classList.remove("is-err", "is-ok"));
  valEmailMsg.textContent = "";
  valPwdMsg.textContent = "";
  updateValidationLabView();
}

$("#val-modes").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-val-mode]");
  if (!btn) return;
  valState.mode = btn.dataset.valMode;
  $$(".val-tab").forEach((t) => t.classList.toggle("is-active", t === btn));
  resetValInputs();
});

valEmailInput.addEventListener("input", () => runFieldCheck("email", "input"));
valEmailInput.addEventListener("blur", () => {
  valState.blurredEmail = true;
  runFieldCheck("email", "blur");
});
valPwdInput.addEventListener("input", () => runFieldCheck("pwd", "input"));
valPwdInput.addEventListener("blur", () => {
  valState.blurredPwd = true;
  runFieldCheck("pwd", "blur");
});

$("#btn-val-submit").addEventListener("click", () => {
  valState.blurredEmail = true;
  valState.blurredPwd = true;
  runFieldCheck("email", "submit");
  runFieldCheck("pwd", "submit");
});
$("#btn-val-clear").addEventListener("click", resetValInputs);

$("#btn-val-simulate").addEventListener("click", () => {
  resetValInputs();
  const emailSeq = "lin@studio.cn";
  const pwdSeq = "form2026";
  let step = 0;
  valState.simTimer = setInterval(() => {
    step++;
    if (step <= emailSeq.length) {
      valEmailInput.value = emailSeq.slice(0, step);
      runFieldCheck("email", "input");
      if (step === emailSeq.length) {
        valState.blurredEmail = true;
        runFieldCheck("email", "blur");
      }
    } else if (step <= emailSeq.length + pwdSeq.length) {
      const k = step - emailSeq.length;
      valPwdInput.value = pwdSeq.slice(0, k);
      runFieldCheck("pwd", "input");
      if (k === pwdSeq.length) {
        valState.blurredPwd = true;
        runFieldCheck("pwd", "blur");
      }
    } else {
      clearInterval(valState.simTimer);
    }
  }, 110);
});

// ============================================================
// 五、04 节：按钮主次与 3 秒快点压力测试
// ============================================================
let activeActionLayout = ACTION_LAYOUTS[2]; // 默认展示原海报解，也可切错态
let stressTimer = 0;
let stressActive = false;

function renderActionLab() {
  $("#action-presets").innerHTML = ACTION_LAYOUTS.map(
    (a) =>
      `<button type="button" class="pill-btn${a.id === activeActionLayout.id ? " is-active" : ""}" data-act-id="${a.id}">${a.label}</button>`
  ).join("");

  $("#action-bar-preview").innerHTML = activeActionLayout.buttons
    .map(
      (b) =>
        `<button type="button" class="ap-btn" data-ap-role="${b.role}" data-style="${b.style}">${escapeHtml(b.text)}</button>`
    )
    .join("");

  const badge = $("#action-risk-badge");
  badge.textContent = activeActionLayout.risk;
  badge.dataset.tone = activeActionLayout.tone;
  $("#action-why").textContent = activeActionLayout.why;
}

$("#action-presets").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act-id]");
  if (!btn) return;
  activeActionLayout = ACTION_LAYOUTS.find((a) => a.id === btn.dataset.actId) || ACTION_LAYOUTS[0];
  clearInterval(stressTimer);
  stressActive = false;
  $("#btn-stress-test").textContent = "开始 3 秒快点测试";
  const fb = $("#action-tap-feedback");
  fb.dataset.tone = "";
  fb.textContent = "已切换底栏方案，试着快速找到并点击提交按钮。";
  renderActionLab();
});

$("#action-bar-preview").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-ap-role]");
  if (!btn) return;
  const role = btn.dataset.apRole;
  const fb = $("#action-tap-feedback");
  clearInterval(stressTimer);
  stressActive = false;
  $("#btn-stress-test").textContent = "开始 3 秒快点测试";

  if (role === "submit") {
    fb.dataset.tone = "ok";
    fb.textContent = `✓ 点中了主操作「${btn.textContent}」！${activeActionLayout.tone === "err" ? "但在这个方案里你得先仔细读字辨认，而不是凭视觉权重一眼落手。" : "视觉权重与动词一致，毫不犹豫。"}`;
  } else if (role === "danger") {
    fb.dataset.tone = "err";
    fb.textContent = `× 糟糕！你误点了高危「${btn.textContent}」，前面辛苦填完的 8 项资料瞬间清零。这就是同色平权或重置抢主的典型事故。`;
  } else {
    fb.dataset.tone = "err";
    fb.textContent = `× 点到了次要「${btn.textContent}」：当前按钮权重把视线带偏了。`;
  }
});

$("#btn-stress-test").addEventListener("click", () => {
  clearInterval(stressTimer);
  let left = 3.0;
  stressActive = true;
  const fb = $("#action-tap-feedback");
  fb.dataset.tone = "";
  fb.textContent = `倒计时 3.0 秒：别犹豫，立刻点出真正的提交按钮！`;
  $("#btn-stress-test").textContent = "测试进行中…";
  stressTimer = setInterval(() => {
    left = Math.max(0, left - 0.1);
    if (!stressActive) return;
    if (left <= 0.01) {
      clearInterval(stressTimer);
      stressActive = false;
      $("#btn-stress-test").textContent = "重新测一次";
      fb.dataset.tone = "err";
      fb.textContent = "时间到！3 秒内没能果断落手，说明按钮主次还不够一眼分明。";
    } else {
      fb.textContent = `倒计时 ${left.toFixed(1)} 秒：立刻点出真正的提交按钮！`;
    }
  }, 100);
});

// ============================================================
// 六、05 节：表单布局从哪来（时间轴）
// ============================================================
let activeLineageIdx = 1; // 默认落在 2006 眼动里程碑
function renderLineage() {
  $("#lineage-tabs").innerHTML = LINEAGE_ITEMS.map(
    (item, idx) =>
      `<button type="button" class="lin-tab${idx === activeLineageIdx ? " is-active" : ""}" role="tab" aria-selected="${idx === activeLineageIdx}" data-lin-idx="${idx}"><strong>${item.year}</strong><span>${escapeHtml(item.shortTitle)}</span></button>`
  ).join("");

  const cur = LINEAGE_ITEMS[activeLineageIdx];
  $("#lineage-detail").innerHTML = `
    <span class="lin-date">${escapeHtml(cur.date)}</span>
    <h3>${escapeHtml(cur.title)}</h3>
    <p class="lin-who">${escapeHtml(cur.who)}</p>
    <p class="lin-body">${escapeHtml(cur.body)}</p>
    <p class="lin-takeaway">核心启示：${escapeHtml(cur.takeaway)}</p>`;
}
$("#lineage-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-lin-idx]");
  if (!btn) return;
  activeLineageIdx = Number(btn.dataset.linIdx);
  renderLineage();
});

// ============================================================
// 七、06 节：什么时候用 / 别用
// ============================================================
let activeUseCaseIdx = 0;
function renderUseCases() {
  $("#usecase-buttons").innerHTML = USE_CASES.map(
    (u, idx) =>
      `<button type="button" class="uc-btn${idx === activeUseCaseIdx ? " is-active" : ""}" data-uc-idx="${idx}"><span>${escapeHtml(u.label)}</span><span aria-hidden="true">→</span></button>`
  ).join("");

  const cur = USE_CASES[activeUseCaseIdx];
  const res = $("#usecase-result");
  res.dataset.fit = cur.fit;
  res.innerHTML = `
    <span class="uc-badge">${cur.fit === "fit" ? "适合用 284 表单布局" : "建议改用其他布局"}</span>
    <h3>${escapeHtml(cur.verdict)}</h3>
    <p>${escapeHtml(cur.reason)}</p>
    <p><strong>典型场景：</strong>${escapeHtml(cur.example)}</p>
    ${cur.link ? `<a class="uc-link-btn" href="${cur.link.url}" target="_blank" rel="noopener">去看 ${escapeHtml(cur.link.name)} 在线版 →</a>` : ""}`;
}
$("#usecase-buttons").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-uc-idx]");
  if (!btn) return;
  activeUseCaseIdx = Number(btn.dataset.ucIdx);
  renderUseCases();
});

// ============================================================
// 八、07 节：单变量 4 选 1 练习
// ============================================================
let pickedQuizId = null;

function buildQuizWireframe(kind) {
  const widths = [32, 54, 40, 62, 46, 58];
  const items = widths
    .map((w) => {
      if (kind === "placeholder") {
        return `<div class="qw-item"><div class="qw-box"><span class="qw-ph" style="width:${w}%"></span></div></div>`;
      }
      return `<div class="qw-item"><span class="qw-lbl" style="width:${w}%"></span><div class="qw-box"></div></div>`;
    })
    .join("");
  return `
    <div class="quiz-wire" data-kind="${kind}" aria-hidden="true">
      <div class="qw-group">${items}</div>
      <div class="qw-foot"><span class="qw-err"></span><span class="qw-cta"></span></div>
    </div>`;
}

function renderQuiz() {
  $("#quiz-prompt").textContent = PRACTICE_QUIZ.prompt;
  $("#quiz-grid").innerHTML = PRACTICE_QUIZ.options
    .map((opt) => {
      let cls = "quiz-card";
      if (pickedQuizId) {
        if (opt.id === PRACTICE_QUIZ.answer) cls += " is-correct";
        else if (opt.id === pickedQuizId) cls += " is-wrong";
      }
      return `
        <button type="button" class="${cls}" role="radio" aria-checked="${pickedQuizId === opt.id}" data-quiz-id="${opt.id}">
          <div class="quiz-card-top">
            <span class="quiz-code">${opt.code}</span>
          </div>
          ${buildQuizWireframe(opt.layoutKind)}
          <p class="quiz-neutral">${escapeHtml(opt.neutralDesc)}</p>
        </button>`;
    })
    .join("");

  const fb = $("#quiz-feedback");
  if (!pickedQuizId) {
    fb.hidden = true;
  } else {
    const picked = PRACTICE_QUIZ.options.find((o) => o.id === pickedQuizId);
    const right = pickedQuizId === PRACTICE_QUIZ.answer;
    fb.hidden = false;
    fb.dataset.right = String(right);
    $("#quiz-fb-title").textContent = right
      ? `答对了！${picked.code}（${picked.neutralDesc}）最顺手`
      : `你选了 ${picked.code}，再看一眼它改变的那个变量：`;
    $("#quiz-fb-body").textContent = right
      ? picked.explain
      : `${picked.explain} —— 相比之下，方案 A（单列 6 项 + 常驻顶对齐标签）没有横向折返、打字不失忆、手机与桌面都能一贯保持稳定左基准线。`;
  }
}

$("#quiz-grid").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-quiz-id]");
  if (!btn) return;
  pickedQuizId = btn.dataset.quizId;
  renderQuiz();
});

$("#btn-quiz-retry").addEventListener("click", () => {
  pickedQuizId = null;
  renderQuiz();
});

// ============================================================
// 九、08 节：原海报全屏灯箱（缩放、拖拽平移、Esc 关闭）
// ============================================================
const lightbox = $("#poster-lightbox");
const lbImg = $("#lb-img");
const lbViewport = $("#lb-viewport");
const lbZoomVal = $("#lb-zoom-val");
let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDrag = null;

function applyLightboxTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbZoomVal.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  // 复用已有内联 poster.webp 的 src，不重复内联图片
  lbImg.src = $("#poster").src;
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLightboxTransform();
  lightbox.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  $("#btn-open-poster").focus();
}

$("#btn-open-poster").addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => {
  lbScale = Math.min(3.5, +(lbScale + 0.35).toFixed(2));
  applyLightboxTransform();
});
$("#lb-zoom-out").addEventListener("click", () => {
  lbScale = Math.max(0.7, +(lbScale - 0.35).toFixed(2));
  applyLightboxTransform();
});
$("#lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLightboxTransform();
});

lbViewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.2 : -0.2;
  lbScale = Math.max(0.7, Math.min(3.5, +(lbScale + delta).toFixed(2)));
  applyLightboxTransform();
}, { passive: false });

lbViewport.addEventListener("pointerdown", (e) => {
  lbDrag = { x: e.clientX - lbTx, y: e.clientY - lbTy };
  try { lbViewport.setPointerCapture(e.pointerId); } catch {}
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbTx = e.clientX - lbDrag.x;
  lbTy = e.clientY - lbDrag.y;
  applyLightboxTransform();
});
lbViewport.addEventListener("pointerup", () => { lbDrag = null; });

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ============================================================
// 启动初始化
// ============================================================
renderLiveForm();
renderAlignCompare();
renderChunkLab();
updateValidationLabView();
renderActionLab();
renderLineage();
renderUseCases();
renderQuiz();

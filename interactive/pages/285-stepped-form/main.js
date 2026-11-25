// 285 分步表单 · 主交互控制器
import {
  SCENARIOS,
  PROGRESS_MODES,
  GUIDANCE_MODES,
  CONTROL_MODES,
  PRACTICE_FIELDS,
  PRACTICE_OPTIONS,
  createInitialState,
  defaultValuesFor,
  normalizeCuts,
  evaluateFlow,
  validateStepFields,
  evaluateBranching,
  evaluateDecision,
} from "./model.js";
import { mountSlicerCanvas } from "./slicer-canvas.js";
import { mountBranchCanvas } from "./branch-canvas.js";

// ---------- 工具 ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const STEP_ICONS = {
  user: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>`,
  card: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M7 10h4M7 14h10"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/></svg>`,
  check: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="m8.8 12.2 2.2 2.2 4.4-4.6"/></svg>`,
};

// ---------- 主舞台状态 ----------
let state = createInitialState("poster");
let latestEval = evaluateFlow(state);
let slicerCtl = null;

function nowHHMMSS() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function clampCurrentStep() {
  const total = state.cuts.length + 1;
  if (state.currentStep >= total) state.currentStep = total - 1;
  if (state.currentStep < 0) state.currentStep = 0;
}

// ---------- 渲染四维规则按钮组 ----------
function renderRuleGroups() {
  const buildGroup = (containerId, list, currentVal, onPick) => {
    const el = $(containerId);
    el.innerHTML = list.map((item) => {
      const active = item.id === currentVal;
      const cls = active ? (item.ok ? "pill-btn is-active" : "pill-btn is-bad") : "pill-btn";
      return `<button type="button" class="${cls}" data-val="${item.id}" aria-pressed="${active}">${item.label}</button>`;
    }).join("");
    for (const btn of $$("button", el)) {
      btn.addEventListener("click", () => onPick(btn.dataset.val));
    }
  };

  buildGroup("#grp-progress", PROGRESS_MODES, state.progressMode, (val) => {
    state.progressMode = val;
    syncAll();
  });
  buildGroup("#grp-guidance", GUIDANCE_MODES, state.guidanceMode, (val) => {
    state.guidanceMode = val;
    state.stepErrors = {};
    state.lateErrors = [];
    syncAll();
  });
  buildGroup("#grp-control", CONTROL_MODES, state.controlMode, (val) => {
    state.controlMode = val;
    state.wipedNotice = "";
    syncAll();
  });

  // 高亮快捷切步预设
  const cutsKey = state.cuts.join(",");
  const sc = latestEval.scenario;
  for (const btn of $$("[data-cuts-preset]")) {
    const p = btn.dataset.cutsPreset;
    let match = false;
    let bad = false;
    if (p === "1") { match = state.cuts.length === 0; bad = true; }
    else if (p === "2bad") { match = cutsKey === "6"; bad = true; }
    else if (p === "3ok") { match = cutsKey === sc.compactCuts.join(","); }
    else if (p === "4ok") { match = cutsKey === sc.idealCuts.join(","); }
    else if (p === "5ok") { match = cutsKey === sc.lightCuts.join(","); }
    else if (p === "12bad") { match = state.cuts.length === 11; bad = true; }
    btn.className = "pill-btn" + (match ? (bad ? " is-bad" : " is-active") : "");
    btn.setAttribute("aria-pressed", String(match));
  }
}

// ---------- 渲染顶部进度里程碑 ----------
function renderStepperRail(ev) {
  const host = $("#stepper-rail");
  const total = ev.stepCount;
  const cur = state.currentStep;
  const step = ev.steps[cur];

  if (state.progressMode === "hidden") {
    host.innerHTML = `<div class="rail-blind">
      <span>当前步骤：${esc(step.title)}（总步数与后续步骤已隐藏）</span>
      <span class="rb-sub">用户看不出还要填几步，心里没底</span>
    </div>`;
    return;
  }

  if (state.progressMode === "percent") {
    // 故意模拟虚标跳变（首步就给 18%，中段突跳到 68%）
    const fakePct = cur === 0 ? 18 : cur === total - 1 ? 94 : Math.min(88, Math.round(35 + (cur / Math.max(1, total - 1)) * 55));
    host.innerHTML = `<div class="rail-percent">
      <div class="rp-top">
        <span>已完成约 ${fakePct}%（未标明共几步与后续材料）</span>
        <span>下一步：待揭晓</span>
      </div>
      <div class="rp-bar"><i class="rp-fill" style="width:${fakePct}%"></i></div>
    </div>`;
    return;
  }

  if (state.progressMode === "compact-dots") {
    const pct = Math.round(((cur + 1) / total) * 100);
    const nextStep = ev.steps[cur + 1];
    host.innerHTML = `<div class="rail-compact">
      <div class="rc-left">
        <span class="rc-pill">第 ${cur + 1} / ${total} 步</span>
        <span>${esc(step.title)}</span>
      </div>
      <span class="rc-next">${nextStep ? `下一步：${esc(nextStep.title)}（${nextStep.count} 项）` : "已是最后一步 · 核对提交"}</span>
      <span class="rc-bar" aria-hidden="true"><i style="width:${pct}%"></i></span>
    </div>`;
    return;
  }

  // steps-numbered：1:1 原海报横向里程碑轨
  const canJumpBack = state.controlMode === "save-and-back" || state.controlMode === "review-before-submit";
  host.innerHTML = `<div class="rail-steps" role="list">
    ${ev.steps.map((s, idx) => {
      const done = idx < cur || state.completedSteps.includes(idx);
      const active = idx === cur;
      const clickable = canJumpBack && idx !== cur && (done || state.visitedSteps.includes(idx));
      const badStep = s.count >= 6 || (s.domains.length > 1 && ev.tornCount > 0);
      const cls = [
        "rs-item",
        done && !active ? "is-done" : "",
        active ? "is-active" : "",
        clickable ? "is-clickable" : "",
        badStep ? "is-bad" : "",
      ].filter(Boolean).join(" ");
      const dotContent = done && !active ? "✓" : String(idx + 1);
      const line = idx < ev.steps.length - 1 ? `<span class="rs-line" aria-hidden="true"></span>` : "";
      return `<button type="button" class="${cls}" data-jump-step="${idx}" ${clickable ? "" : "tabindex=\"-1\""} aria-current="${active ? "step" : "false"}" title="${clickable ? `点击跳回第 ${idx + 1} 步修改` : s.title}">
        ${line}
        <span class="rs-dot">${dotContent}</span>
        <span class="rs-title">${esc(s.title)}</span>
        <span class="rs-sub">${s.count} 项</span>
      </button>`;
    }).join("")}
  </div>`;

  for (const btn of $$("[data-jump-step]", host)) {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.jumpStep);
      const allow = state.controlMode === "save-and-back" || state.controlMode === "review-before-submit";
      if (!allow) {
        state.wipedNotice = state.controlMode === "linear-locked"
          ? "当前为「单向锁前步」模式：已完成步骤被锁死，无法点击顶轨回改。"
          : "当前为「禁退·丢草稿」模式：不支持点击顶轨回跳。";
        renderWizard(latestEval);
        return;
      }
      if (idx <= state.currentStep || state.visitedSteps.includes(idx) || state.completedSteps.includes(idx)) {
        goToStep(idx, { preserve: true });
      }
    });
  }
}

// ---------- 渲染活体分步表单 ----------
function renderWizard(ev) {
  const step = ev.steps[state.currentStep];
  const total = ev.stepCount;

  // 自示范大标四字亮步联动
  const titleChars = $$(".st-ch");
  const mappedChar = Math.min(3, Math.floor((state.currentStep / Math.max(1, total)) * 4));
  titleChars.forEach((el, idx) => {
    el.classList.toggle("is-done", idx < mappedChar || state.submitted);
    el.classList.toggle("is-active", !state.submitted && idx === mappedChar);
  });

  // 表单头
  $("#wiz-icon").innerHTML = STEP_ICONS[step.icon] || STEP_ICONS.card;
  $("#wiz-title").textContent = step.title;
  $("#wiz-sub").textContent = state.guidanceMode === "late-dump"
    ? "（当前已关闭步骤说明，用户需自行猜测本步填写意图）"
    : step.subtitle;

  // 右上「第 X 步，共 N 步」与小进度条
  const miniCounter = $("#wiz-counter");
  const miniFill = $("#wiz-bar-fill");
  if (state.progressMode === "hidden") {
    miniCounter.textContent = "总步数已隐藏";
    miniFill.style.width = "14%";
  } else if (state.progressMode === "percent") {
    const fakePct = state.currentStep === 0 ? 18 : state.currentStep === total - 1 ? 94 : Math.min(88, Math.round(35 + (state.currentStep / Math.max(1, total - 1)) * 55));
    miniCounter.textContent = `约 ${fakePct}%`;
    miniFill.style.width = `${fakePct}%`;
  } else {
    miniCounter.textContent = `第 ${state.currentStep + 1} 步，共 ${total} 步`;
    miniFill.style.width = `${Math.round(((state.currentStep + 1) / total) * 100)}%`;
  }

  // 顶部提示/报错横幅
  const banner = $("#wiz-banner");
  if (state.submitted) {
    banner.hidden = false;
    banner.className = "wizard-banner is-ok";
    banner.innerHTML = `<strong>提交成功！</strong>你刚刚亲自走完了「${esc(ev.scenario.name)}」全部 ${total} 步（${ev.splitLabel}）。可以点任意步骤或换一套场景继续试验。`;
  } else if (state.lateErrors.length > 0) {
    banner.hidden = false;
    banner.className = "wizard-banner is-err";
    banner.innerHTML = `<strong>末尾总算账触发：前面步骤藏着 ${state.lateErrors.length} 处错误，提交失败！</strong>
      <ul>${state.lateErrors.map((e) => `<li>第 ${e.stepIdx + 1} 步「${esc(e.label)}」：${esc(e.msg)}</li>`).join("")}</ul>`;
  } else if (state.wipedNotice) {
    banner.hidden = false;
    banner.className = "wizard-banner is-warn";
    banner.textContent = state.wipedNotice;
  } else {
    banner.hidden = true;
    banner.textContent = "";
  }

  // 计算字段级即时错误（over-nag 模式下未输入直接满屏标红）
  const activeErrors = state.guidanceMode === "over-nag"
    ? validateStepFields(step.fields, state.values, "over-nag")
    : state.stepErrors;

  const hasDemoBadPhone = step.fields.some((f) => activeErrors[f.id] && (f.type === "tel" || f.id === "phone" || f.id === "mobile" || f.id === "opsphone"));
  $("#btn-fix-phone").hidden = !hasDemoBadPhone && Object.keys(activeErrors).length === 0;

  // 渲染字段 DOM
  const fieldsHost = $("#wiz-fields");
  const showDomTag = step.domains.length > 1;
  fieldsHost.innerHTML = step.fields.map((f) => {
    const val = state.values[f.id];
    const err = activeErrors[f.id] || "";
    const wide = f.type === "textarea" || f.type === "checkbox" || step.fields.length === 1;
    const reqMark = f.required || state.guidanceMode === "over-nag"
      ? `<span class="wf-req" aria-hidden="true">*</span>`
      : `<span class="wf-opt">（可选）</span>`;
    const domTag = showDomTag ? `<span class="wf-dom-tag">${esc(ev.scenario.domains[f.domain].short)}</span>` : "";

    let ctrlHtml = "";
    const fid = `wf-${f.id}`;
    if (f.type === "radio") {
      ctrlHtml = `<div class="wf-radios" role="radiogroup" aria-label="${esc(f.label)}">
        ${f.options.map((opt) => `<label class="wf-radio">
          <input type="radio" name="${fid}" value="${esc(opt)}" data-fid="${f.id}" ${val === opt ? "checked" : ""}>
          <span>${esc(opt)}</span>
        </label>`).join("")}
      </div>`;
    } else if (f.type === "select") {
      ctrlHtml = `<select class="wf-select" id="${fid}" data-fid="${f.id}">
        ${f.options.map((opt) => `<option value="${esc(opt)}" ${val === opt ? "selected" : ""}>${esc(opt)}</option>`).join("")}
      </select>`;
    } else if (f.type === "textarea") {
      const textVal = String(val ?? "");
      ctrlHtml = `<textarea class="wf-textarea" id="${fid}" data-fid="${f.id}" maxlength="${f.maxLen || 120}" placeholder="${esc(f.placeholder || "")}">${esc(textVal)}</textarea>`;
    } else if (f.type === "checkbox") {
      ctrlHtml = `<label class="wf-check">
        <input type="checkbox" id="${fid}" data-fid="${f.id}" ${val ? "checked" : ""}>
        <span>${esc(f.placeholder)}</span>
      </label>`;
    } else {
      ctrlHtml = `<input class="wf-input" id="${fid}" data-fid="${f.id}" type="${f.type === "password" ? "text" : f.type}" value="${esc(val ?? "")}" placeholder="${esc(f.placeholder || "")}">`;
    }

    const showHint = state.guidanceMode === "inline-assist" || (state.guidanceMode === "per-step" && !err);
    const footLeft = err
      ? `<p class="wf-err">${esc(err)}</p>`
      : showHint
        ? `<p class="wf-hint">${esc(f.hint)}</p>`
        : `<span></span>`;
    const footRight = f.type === "textarea"
      ? `<span class="wf-count">${String(val ?? "").length} / ${f.maxLen || 120}</span>`
      : "";

    return `<div class="wf-field ${wide ? "is-wide" : ""} ${err ? "has-err" : ""}">
      ${f.type === "checkbox" ? `<span class="wf-label"><span>${esc(f.label)}${reqMark}</span>${domTag}</span>` : `<label class="wf-label" for="${fid}"><span>${esc(f.label)}${reqMark}</span>${domTag}</label>`}
      ${ctrlHtml}
      <div class="wf-foot">${footLeft}${footRight}</div>
    </div>`;
  }).join("");

  // 绑定输入事件（实时同步草稿状态）
  for (const input of $$("[data-fid]", fieldsHost)) {
    const fid = input.dataset.fid;
    const fieldDef = ev.scenario.fields.find((x) => x.id === fid);
    const evName = input.type === "checkbox" || input.type === "radio" || input.tagName === "SELECT" ? "change" : "input";
    input.addEventListener(evName, () => {
      state.values[fid] = input.type === "checkbox" ? input.checked : input.value;
      state.submitted = false;
      state.lateErrors = [];
      state.wipedNotice = "";
      if (state.controlMode === "save-and-back" || state.controlMode === "review-before-submit") {
        state.lastSavedAt = nowHHMMSS();
      }
      // 更新字数统计而不重建整棵表单 DOM（避免丢输入焦点）
      if (fieldDef?.type === "textarea") {
        const cnt = input.closest(".wf-field")?.querySelector(".wf-count");
        if (cnt) cnt.textContent = `${input.value.length} / ${fieldDef.maxLen || 120}`;
      }
      // 若当前有错且已修好，及时清除单框报错样式
      if (state.stepErrors[fid] && fieldDef) {
        const msg = fieldDef.check(state.values[fid]);
        if (!msg) {
          delete state.stepErrors[fid];
          const wrap = input.closest(".wf-field");
          if (wrap) {
            wrap.classList.remove("has-err");
            const errEl = wrap.querySelector(".wf-err");
            if (errEl) {
              errEl.className = "wf-hint";
              errEl.textContent = fieldDef.hint;
            }
          }
        }
      }
      updateTipBar();
    });

    // 离焦单步校验（per-step / inline-assist）
    if (input.tagName === "INPUT" || input.tagName === "TEXTAREA") {
      input.addEventListener("blur", () => {
        if ((state.guidanceMode === "per-step" || state.guidanceMode === "inline-assist") && fieldDef) {
          const val = state.values[fid];
          const msg = (!fieldDef.required && !val) ? "" : fieldDef.check(val);
          if (msg) state.stepErrors[fid] = msg;
          else delete state.stepErrors[fid];
          renderWizard(latestEval);
        }
      });
    }
  }

  // 末步复核区（当选择 review-before-submit 且位于末步且总步数 > 1）
  const revHost = $("#wiz-review");
  if (state.controlMode === "review-before-submit" && state.currentStep === total - 1 && total > 1) {
    revHost.hidden = false;
    const prevSteps = ev.steps.slice(0, total - 1);
    revHost.innerHTML = `<div class="wr-head"><span>提交前核对清单（前 ${prevSteps.length} 步摘要）</span><span>点「修改」直达该步</span></div>
      <div class="wr-list">
        ${prevSteps.map((ps) => {
          const preview = ps.fields.slice(0, 3).map((f) => `${f.label}：${state.values[f.id] || "（空）"}`).join(" · ");
          return `<div class="wr-item">
            <div class="wr-item-top"><b>第 ${ps.index + 1} 步 · ${esc(ps.title)}</b><button type="button" class="wr-edit" data-rev-jump="${ps.index}">修改</button></div>
            <p>${esc(preview)}</p>
          </div>`;
        }).join("")}
      </div>`;
    for (const eb of $$("[data-rev-jump]", revHost)) {
      eb.addEventListener("click", () => goToStep(Number(eb.dataset.revJump), { preserve: true }));
    }
  } else {
    revHost.hidden = true;
    revHost.innerHTML = "";
  }

  // 上一步 / 下一步按钮态
  const btnPrev = $("#btn-prev");
  const btnNext = $("#btn-next");
  if (state.currentStep === 0) {
    btnPrev.disabled = true;
    btnPrev.className = "btn-prev";
    btnPrev.textContent = "上一步";
  } else if (state.controlMode === "no-back-wipe") {
    btnPrev.disabled = false;
    btnPrev.className = "btn-prev is-locked-bad";
    btnPrev.textContent = "返回（会清空本步）";
  } else if (state.controlMode === "linear-locked") {
    btnPrev.disabled = true;
    btnPrev.className = "btn-prev is-locked-bad";
    btnPrev.textContent = "前步已锁死";
  } else {
    btnPrev.disabled = false;
    btnPrev.className = "btn-prev";
    btnPrev.textContent = "上一步";
  }

  btnNext.textContent = state.currentStep === total - 1
    ? "确认提交"
    : (state.progressMode === "hidden" || state.progressMode === "percent")
      ? "下一步"
      : `下一步（${state.currentStep + 1}/${total}）`;
  updateTipBar();
}

function updateTipBar() {
  const tip = $("#wiz-tip");
  const text = $("#wiz-tip-text");
  if (state.controlMode === "no-back-wipe") {
    tip.className = "wizard-tip is-bad";
    text.textContent = "自动保存已关闭：现在退回上一步会清空当前已填草稿，且顶轨步骤不可点击回跳。";
  } else if (state.controlMode === "linear-locked") {
    tip.className = "wizard-tip is-bad";
    text.textContent = "单向模式：已完成步骤已锁定不可回改；发现前一步输错手机号只能重头来过。";
  } else {
    tip.className = "wizard-tip is-ok";
    const stamp = state.lastSavedAt ? `（最近保存 ${state.lastSavedAt}）` : "";
    text.textContent = `提示：每完成一步，信息将自动保存，您可以随时返回继续。${stamp}`;
  }
}

function goToStep(nextIdx, { preserve = true } = {}) {
  const ev = latestEval;
  const curFields = ev.steps[state.currentStep]?.fields || [];
  if (!preserve) {
    // 故意演示「禁退·丢草稿」翻车：回退时清空当前步已填草稿！
    for (const f of curFields) {
      state.values[f.id] = f.type === "checkbox" ? false : "";
    }
    state.wipedNotice = `已退回第 ${nextIdx + 1} 步——但因为处于「禁退·丢草稿」错态，刚才第 ${state.currentStep + 1} 步填写的 ${curFields.length} 项内容已被清空！`;
  } else {
    state.wipedNotice = "";
  }
  state.currentStep = Math.max(0, Math.min(ev.stepCount - 1, nextIdx));
  if (!state.visitedSteps.includes(state.currentStep)) state.visitedSteps.push(state.currentStep);
  state.stepErrors = {};
  state.lateErrors = [];
  state.submitted = false;
  syncAll();
}

// ---------- 渲染左侧诊单与读数 ----------
function renderDiagnosis(ev) {
  const badge = $("#hero-badge");
  badge.textContent = ev.passedCount === 4 ? "4 / 4 步轨就位" : `${ev.passedCount} / 4 待整步`;
  badge.className = `status-pill ${ev.passedCount === 4 ? "ok" : ev.passedCount >= 2 ? "warn" : "bad"}`;

  const box = $("#diag-box");
  box.className = `diag-box ${ev.passedCount === 4 ? "is-ok" : ev.passedCount >= 2 ? "is-warn" : "is-bad"}`;
  $("#diag-tag").textContent = ev.passedCount === 4
    ? `通过 · ${ev.primary.badge}`
    : `错态 · ${ev.passedCount} / 4 项就位`;
  $("#diag-headline").textContent = ev.primary.title;
  $("#diag-body").textContent = ev.primary.body;
  $("#diag-fix").textContent = ev.primary.fixHint;

  // 四项指标
  $("#m-split").textContent = `${ev.stepCount} 步 · ${ev.splitLabel}`;
  const mMax = $("#m-max");
  mMax.textContent = `${ev.maxFields} 项`;
  mMax.className = ev.maxFields >= 6 ? "is-bad" : ev.checks.chunking.ok ? "is-ok" : "";

  const mTorn = $("#m-torn");
  mTorn.textContent = `${ev.tornCount} 处`;
  mTorn.className = ev.tornCount > 0 ? "is-bad" : "is-ok";

  const mLoad = $("#m-load");
  mLoad.textContent = `${ev.metrics.loadLevel}（阻力${ev.metrics.frictionLevel}）`;
  mLoad.className = ev.metrics.loadClass === "bad" ? "is-bad" : ev.metrics.loadClass === "ok" ? "is-ok" : "";

  // 左侧原海报「为什么分步？」三实况胶囊
  const setWp = (id, info) => {
    const el = $(id);
    el.textContent = info.text;
    el.className = `why-pill ${info.ok ? "ok" : "bad"}`;
  };
  setWp("#wp-cog", ev.whyPills.cognitive);
  setWp("#wp-prog", ev.whyPills.progress);
  setWp("#wp-comp", ev.whyPills.completion);

  // 控槽四徽标
  const setChk = (id, chk) => {
    const el = $(id);
    el.textContent = chk.badge;
    el.className = `ctrl-badge ${chk.ok ? "ok" : ""}`;
  };
  setChk("#chk-chunking", ev.checks.chunking);
  setChk("#chk-progress", ev.checks.progress);
  setChk("#chk-guidance", ev.checks.guidance);
  setChk("#chk-control", ev.checks.control);

  // 切分轨图例随场景换名
  ev.scenario.domains.forEach((d, i) => {
    const el = $(`#lg-name-${i}`);
    if (el) el.textContent = d.short;
  });
}

function syncAll() {
  clampCurrentStep();
  latestEval = evaluateFlow(state);
  renderDiagnosis(latestEval);
  renderRuleGroups();
  renderStepperRail(latestEval);
  renderWizard(latestEval);
  const slider = $("#slicer-canvas");
  if (slider) slider.setAttribute("aria-valuenow", String(state.cuts[0] ?? 0));
  if (slicerCtl) slicerCtl.redraw();
}

// ---------- 表单提交 / 下一步 / 上一步 ----------
$("#wizard-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const ev = latestEval;
  const step = ev.steps[state.currentStep];
  const isLast = state.currentStep === ev.stepCount - 1;

  if (state.guidanceMode === "late-dump") {
    // 末尾总算账：前步一路放行，直到末步才翻出前面全部错误！
    if (!isLast) {
      if (!state.completedSteps.includes(state.currentStep)) state.completedSteps.push(state.currentStep);
      goToStep(state.currentStep + 1, { preserve: true });
      return;
    }
    const allBad = [];
    ev.steps.forEach((s) => {
      const errs = validateStepFields(s.fields, state.values, "per-step");
      for (const f of s.fields) {
        if (errs[f.id]) allBad.push({ stepIdx: s.index, label: f.label, msg: errs[f.id] });
      }
    });
    if (allBad.length > 0) {
      state.lateErrors = allBad;
      state.submitted = false;
      renderWizard(ev);
      return;
    }
    state.lateErrors = [];
    state.submitted = true;
    renderWizard(ev);
    return;
  }

  // 当步校验（per-step / inline-assist / over-nag）
  const errs = validateStepFields(step.fields, state.values, state.guidanceMode);
  if (Object.keys(errs).length > 0) {
    state.stepErrors = errs;
    state.submitted = false;
    renderWizard(ev);
    const firstBadId = Object.keys(errs)[0];
    const target = $(`#wf-${firstBadId}`);
    if (target) target.focus();
    return;
  }

  state.stepErrors = {};
  if (!state.completedSteps.includes(state.currentStep)) state.completedSteps.push(state.currentStep);
  if (state.controlMode === "save-and-back" || state.controlMode === "review-before-submit") {
    state.lastSavedAt = nowHHMMSS();
  }

  if (!isLast) {
    goToStep(state.currentStep + 1, { preserve: true });
  } else {
    state.submitted = true;
    renderWizard(ev);
  }
});

$("#btn-prev").addEventListener("click", () => {
  if (state.currentStep <= 0) return;
  if (state.controlMode === "linear-locked") return;
  const preserve = state.controlMode !== "no-back-wipe";
  goToStep(state.currentStep - 1, { preserve });
});

$("#btn-fix-phone").addEventListener("click", () => {
  const sc = latestEval.scenario;
  for (const f of sc.fields) {
    if (f.type === "tel") state.values[f.id] = "13918204688";
    else if (f.required && f.check(state.values[f.id])) {
      state.values[f.id] = f.type === "checkbox" ? true : (f.defaultVal || "示范填写");
    } else if (state.guidanceMode === "over-nag" && !f.required && !state.values[f.id]) {
      state.values[f.id] = "已按要求补填";
    }
  }
  state.stepErrors = {};
  state.lateErrors = [];
  syncAll();
});

// ---------- 场景切换与预设 ----------
for (const tab of $$("[data-scenario]")) {
  tab.addEventListener("click", () => {
    const id = tab.dataset.scenario;
    for (const t of $$("[data-scenario]")) {
      const on = t.dataset.scenario === id;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    }
    state.scenarioId = id;
    state.values = defaultValuesFor(id);
    state.currentStep = 0;
    state.visitedSteps = [0];
    state.completedSteps = [];
    state.stepErrors = {};
    state.lateErrors = [];
    state.submitted = false;
    state.wipedNotice = "";
    syncAll();
  });
}

function applyCutsPreset(code) {
  const sc = latestEval.scenario;
  if (code === "1") state.cuts = [];
  else if (code === "2bad") state.cuts = [6];
  else if (code === "3ok") state.cuts = [...sc.compactCuts];
  else if (code === "4ok") state.cuts = [...sc.idealCuts];
  else if (code === "5ok") state.cuts = [...sc.lightCuts];
  else if (code === "12bad") state.cuts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  state.currentStep = Math.min(state.currentStep, state.cuts.length);
  state.submitted = false;
  syncAll();
}

for (const btn of $$("[data-cuts-preset]")) {
  btn.addEventListener("click", () => applyCutsPreset(btn.dataset.cutsPreset));
}

for (const btn of $$("[data-preset]")) {
  btn.addEventListener("click", () => {
    const p = btn.dataset.preset;
    const sc = SCENARIOS[state.scenarioId];
    state.stepErrors = {};
    state.lateErrors = [];
    state.submitted = false;
    state.wipedNotice = "";
    if (p === "poster4") {
      state.cuts = [...sc.idealCuts];
      state.progressMode = "steps-numbered";
      state.guidanceMode = "per-step";
      state.controlMode = "save-and-back";
      state.currentStep = 1; // 停在原海报展示的第 2 步「个人信息」
      state.visitedSteps = [0, 1];
      state.completedSteps = [0];
    } else if (p === "compact3") {
      state.cuts = [...sc.compactCuts];
      state.progressMode = "compact-dots";
      state.guidanceMode = "inline-assist";
      state.controlMode = "review-before-submit";
      state.currentStep = 0;
      state.visitedSteps = [0];
      state.completedSteps = [];
    } else if (p === "wall1") {
      state.cuts = [];
      state.currentStep = 0;
    } else if (p === "frag12") {
      state.cuts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      state.currentStep = 0;
    } else if (p === "broken") {
      state = createInitialState(state.scenarioId);
    }
    syncAll();
  });
}

// 挂载开场 2D 任务切分轨画布
slicerCtl = mountSlicerCanvas($("#slicer-canvas"), {
  getState: () => state,
  getEval: () => latestEval,
  onCutsChange(nextCuts) {
    state.cuts = normalizeCuts(nextCuts, 12);
    state.submitted = false;
    state.lateErrors = [];
    syncAll();
  },
  onSelectStep(stepIdx) {
    state.currentStep = stepIdx;
    if (!state.visitedSteps.includes(stepIdx)) state.visitedSteps.push(stepIdx);
    syncAll();
  },
  onStatus(msg) {
    const sr = $("#slicer-sr");
    if (sr) sr.textContent = msg;
  },
});

// ==================== Section 01：三态负荷对照 ====================
const CMP_DATA = {
  wall: {
    cols: 1,
    steps: [
      { title: "单页长表 · 全部 12 项一次摊开", items: ["登录邮箱", "设置密码", "账户昵称", "姓名", "性别", "手机号", "居住城市", "简介(选填)", "证件后四位", "短信验证码", "周报订阅", "同意协议"] },
    ],
    stats: [
      ["首屏暴露字段", "12 项"],
      ["步数", "1 步（未分）"],
      ["主题切换次数", "4 组混排"],
      ["认知负荷（示意）", "超载"],
    ],
    summary: "用户一眼望见 12 个跨主题输入框，需要同时盘算密码、身份证明与隐私协议，还没开始填就产生心理畏难。",
  },
  split4: {
    cols: 2,
    steps: [
      { title: "第 1 步 · 账户信息（3 项）", items: ["登录邮箱", "设置密码", "账户昵称"] },
      { title: "第 2 步 · 个人信息（5 项）", items: ["姓名", "性别", "手机号", "居住城市", "简介(选填)"] },
      { title: "第 3 步 · 验证信息（2 项）", items: ["证件后四位", "短信验证码"] },
      { title: "第 4 步 · 完成提交（2 项）", items: ["周报订阅", "同意协议"] },
    ],
    stats: [
      ["单步最大暴露", "5 项"],
      ["步数", "4 步（语义对齐）"],
      ["总字段数", "仍为 12 项"],
      ["认知负荷（示意）", "适中"],
    ],
    summary: "同样 12 个字段，拆成 4 个聚焦步骤后每屏压力明显减轻；但如果业务里有本可延后问的选填项，总工作量并没有减少。",
  },
  trim3: {
    cols: 3,
    steps: [
      { title: "第 1 步 · 账户凭证（2 项）", items: ["登录邮箱", "设置密码", "~账户昵称(自动生成)"] },
      { title: "第 2 步 · 必要联系（3 项）", items: ["姓名", "手机号", "居住城市", "~性别(延后)", "~简介(延后)"] },
      { title: "第 3 步 · 核验提交（3 项）", items: ["证件后四位", "短信验证码", "同意协议", "~周报订阅(默认)"] },
    ],
    stats: [
      ["单步最大暴露", "3 项"],
      ["总字段数", "砍至 8 项（−4）"],
      ["翻页次数", "仅 2 次"],
      ["认知负荷（示意）", "轻盈"],
    ],
    summary: "Baymard 实证指出的最佳组合：先把非必要项延后到个人中心，再按语义拆成 3 步。既降低了单屏视觉压迫，又真正缩短了填表耗时。",
  },
};

function renderCompare(key) {
  const d = CMP_DATA[key] || CMP_DATA.wall;
  const vis = $("#cmp-visual");
  vis.innerHTML = `<div class="cmp-cols" style="grid-template-columns: repeat(${Math.min(d.cols, 2)}, minmax(0, 1fr))">
    ${d.steps.map((s) => `<div class="cmp-step-box">
      <h4><span>${esc(s.title)}</span></h4>
      <div class="cmp-chips">${s.items.map((it) => it.startsWith("~")
        ? `<span class="is-cut">${esc(it.slice(1))}</span>`
        : `<span>${esc(it)}</span>`).join("")}</div>
    </div>`).join("")}
  </div>`;
  $("#cmp-readout").innerHTML = `<dl class="cmp-stats">
    ${d.stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}
  </dl><p class="cmp-summary">${esc(d.summary)}</p>`;
}

for (const btn of $$("[data-cmp]")) {
  btn.addEventListener("click", () => {
    const k = btn.dataset.cmp;
    for (const b of $$("[data-cmp]")) {
      const on = b.dataset.cmp === k;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    renderCompare(k);
  });
}
renderCompare("wall");

// ==================== Section 02：视口缩窄测试滑轨 ====================
function updateNarrowLab(px) {
  const w = Math.max(320, Math.min(960, Number(px)));
  $("#narrow-px").textContent = `${w}px`;
  $("#narrow-range").value = String(w);
  $("#narrow-frame").style.setProperty("--frame-w", `${w}px`);

  const dev = w < 420 ? "手机竖屏（极窄）" : w < 560 ? "大屏手机 / 分屏窄窗" : w < 760 ? "平板竖屏卡片" : "常规桌面宽卡";
  $("#narrow-device").textContent = dev;

  const horiz = $("#nf-horiz");
  const cramped = w < 540;
  horiz.classList.toggle("is-cramped", cramped);

  const adapt = $("#nf-adapt");
  if (w < 540) {
    adapt.innerHTML = `<div class="rail-compact">
      <div class="rc-left"><span class="rc-pill">第 2 / 5 步</span><span>个人资料</span></div>
      <span class="rc-next">下一步：企业资质</span>
      <span class="rc-bar" aria-hidden="true"><i style="width:40%"></i></span>
    </div>`;
    $("#narrow-verdict").textContent = `当前宽度 ${w}px：横向 5 步每个节点被压到约 ${Math.round((w - 40) / 5)}px，标题挤成两行甚至粘连；自适应方案在 < 540px 时自动切为「第 2 / 5 步 + 细进度条 + 下步预告」，既省高度又不乱行。`;
  } else {
    adapt.innerHTML = `<div class="nf-horiz">
      <span class="nf-node done"><i>✓</i><b>账户信息</b></span>
      <span class="nf-node active"><i>2</i><b>个人资料</b></span>
      <span class="nf-node"><i>3</i><b>企业资质</b></span>
      <span class="nf-node"><i>4</i><b>实名核验</b></span>
      <span class="nf-node"><i>5</i><b>确认提交</b></span>
    </div>`;
    $("#narrow-verdict").textContent = `当前宽度 ${w}px：每个步骤节点分得约 ${Math.round((w - 40) / 5)}px，横向编号步骤轨舒展清晰，直接亮出全部 5 站建立完整心智地图。`;
  }
}

$("#narrow-range").addEventListener("input", (e) => updateNarrowLab(e.target.value));
for (const c of $$("[data-nw]")) {
  c.addEventListener("click", () => updateNarrowLab(c.dataset.nw));
}
updateNarrowLab(780);

// ==================== Section 03：深梅紫暗室条件分支画布 ====================
const branchState = { entity: "personal", verified: true, needInvoice: false };
let branchData = evaluateBranching(branchState);

const branchCtl = mountBranchCanvas($("#branch-canvas"), {
  getBranch: () => branchData,
});

function syncBranch() {
  branchData = evaluateBranching(branchState);
  branchCtl.redraw();
  const skippedText = branchData.skippedNodes.length
    ? `自动跳过「${branchData.skippedNodes.map((n) => n.title).join("」「")}」共 ${branchData.skippedNodes.length} 步（省去 <strong>${branchData.savedFields} 个无关字段</strong>）。`
    : "三项附加条件全部命中，需走完整 6 步（16 个字段），没有可跳步骤。";
  $("#branch-summary").innerHTML = `
    <p class="bs-main">当前路径实走 <strong>${branchData.activeNodes.length} 步（${branchData.activeFields} 项）</strong>，${skippedText}</p>
    <p class="bs-tip">提示：当条件分支动态增减步骤时，进度指示应即时重算剩余步数或改用阶段名，避免进度条在中途倒退引起用户怀疑。</p>`;
}

for (const btn of $$("[data-branch-key]")) {
  btn.addEventListener("click", () => {
    const k = btn.dataset.branchKey;
    const raw = btn.dataset.branchVal;
    branchState[k] = raw === "true" ? true : raw === "false" ? false : raw;
    for (const b of $$(`[data-branch-key="${k}"]`)) {
      b.classList.toggle("is-on", b.dataset.branchVal === raw);
    }
    syncBranch();
  });
}
syncBranch();

// ==================== Section 04：四场事故翻牌复盘卡 ====================
for (const card of $$(".inc-card")) {
  const btn = $(".inc-toggle", card);
  const badEl = $(".inc-bad", card);
  const fixEl = $(".inc-fix", card);
  btn.addEventListener("click", () => {
    const showFix = card.dataset.state !== "fix";
    card.dataset.state = showFix ? "fix" : "bad";
    badEl.hidden = showFix;
    fixEl.hidden = !showFix;
    btn.textContent = showFix ? "回看翻车现场" : "看修复做法";
    btn.setAttribute("aria-pressed", String(showFix));
  });
}

// ==================== Section 06：四题决策速诊矩阵 ====================
const decState = { fieldBand: "mid", hasBranch: "yes", freq: "novice", hasAsync: "yes" };

function syncDecision() {
  const res = evaluateDecision(decState);
  const card = $("#dec-result");
  card.className = `dec-result tone-${res.tone}`;
  $("#dec-badge").textContent = res.badge;
  $("#dec-verdict").textContent = res.verdict;
  $("#dec-why").textContent = res.why;
  const link = $("#dec-link");
  if (res.linkId === "285") {
    link.href = "#page-title";
    link.removeAttribute("target");
    link.textContent = `${res.linkText} ↑`;
  } else {
    link.href = `https://layout.xiaoxiaodong.ai/${res.linkId}/play/`;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = `${res.linkText} →`;
  }
}

for (const btn of $$("[data-dec-k]")) {
  btn.addEventListener("click", () => {
    const k = btn.dataset.decK;
    const v = btn.dataset.decV;
    decState[k] = v;
    for (const b of $$(`[data-dec-k="${k}"]`)) {
      b.classList.toggle("is-on", b.dataset.decV === v);
    }
    syncDecision();
  });
}
syncDecision();

// ==================== Section 07：练一练（单一变量四选一） ====================
const QUIZ_DOMAIN_COLORS = [
  { fill: "#F4E5EF", stroke: "#5E1949", name: "排班" },
  { fill: "#FDEAE1", stroke: "#D44E20", name: "就诊人" },
  { fill: "#E2F4EC", stroke: "#1A6E4E", name: "结算" },
];

let quizAnswered = null;

function buildQuizSvg(opt, revealed) {
  const W = 420;
  const H = 68;
  const pad = 10;
  const slotW = (W - pad * 2) / PRACTICE_FIELDS.length;
  const chips = PRACTICE_FIELDS.map((f, i) => {
    const x = pad + i * slotW + 2;
    const w = slotW - 4;
    const c = revealed ? QUIZ_DOMAIN_COLORS[f.d] : { fill: "#F6ECE7", stroke: "#C9B3A9" };
    return `<g>
      <rect x="${x.toFixed(1)}" y="18" width="${w.toFixed(1)}" height="32" rx="5" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.2"/>
      ${revealed ? `<rect x="${(x + 3).toFixed(1)}" y="21" width="${(w - 6).toFixed(1)}" height="3" rx="1.5" fill="${c.stroke}"/>` : ""}
      <text x="${(x + w / 2).toFixed(1)}" y="39" text-anchor="middle" font-size="11" font-weight="600" fill="#340426">${f.label}</text>
    </g>`;
  }).join("");

  const cuts = opt.cuts.map((c) => {
    const gx = pad + c * slotW;
    const splitsDomain = PRACTICE_FIELDS[c - 1].d === PRACTICE_FIELDS[c].d;
    const lineColor = revealed ? (splitsDomain ? "#B4232C" : "#1A6E4E") : "#5E1949";
    return `<line x1="${gx.toFixed(1)}" y1="8" x2="${gx.toFixed(1)}" y2="58" stroke="${lineColor}" stroke-width="2.4" ${revealed && splitsDomain ? 'stroke-dasharray="4 3"' : ""}/>`;
  }).join("");

  return `<svg class="qo-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true">${chips}${cuts}</svg>`;
}

function renderQuiz() {
  const host = $("#quiz-grid");
  const revealed = quizAnswered !== null;
  host.innerHTML = PRACTICE_OPTIONS.map((opt) => {
    const picked = quizAnswered === opt.id;
    let cls = "quiz-opt";
    if (revealed) {
      if (opt.correct) cls += " is-right";
      else if (picked) cls += " is-wrong";
    }
    return `<button type="button" class="${cls}" data-quiz="${opt.id}" aria-pressed="${picked}">
      <div class="qo-head">
        <span class="qo-letter">${opt.label}</span>
        <span class="qo-desc">${opt.neutralDesc}</span>
      </div>
      ${buildQuizSvg(opt, revealed)}
      <ul class="qo-steps">${opt.stepNames.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
    </button>`;
  }).join("");

  for (const btn of $$("[data-quiz]", host)) {
    btn.addEventListener("click", () => {
      quizAnswered = btn.dataset.quiz;
      const picked = PRACTICE_OPTIONS.find((x) => x.id === quizAnswered);
      const vbox = $("#quiz-verdict");
      vbox.className = `quiz-verdict ${picked.correct ? "is-ok" : "is-bad"}`;
      $("#qv-title").textContent = picked.verdictTitle;
      $("#qv-body").textContent = picked.verdictBody;
      renderQuiz();
    });
  }
}
renderQuiz();

// ==================== Section 08：原海报放大灯箱（支持拖拽/缩放/Esc） ====================
const posterImg = $("#poster");
const posterBtn = $("#poster-btn");
const lb = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbScaleEl = $("#lb-scale");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = false;
let lbStartX = 0;
let lbStartY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbScaleEl.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterImg.src; // 只复用已内联海报一次，绝不重复打包
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lb.hidden = false;
  posterBtn.setAttribute("aria-expanded", "true");
  $("#lb-close").focus();
}

function closeLightbox() {
  if (lb.hidden) return;
  lb.hidden = true;
  posterBtn.setAttribute("aria-expanded", "false");
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => { lbScale = Math.min(3, +(lbScale + 0.35).toFixed(2)); applyLbTransform(); });
$("#lb-zoom-out").addEventListener("click", () => {
  lbScale = Math.max(0.7, +(lbScale - 0.35).toFixed(2));
  if (lbScale <= 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
});

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) { closeLightbox(); return; }
  lbDrag = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbStartX;
  lbY = e.clientY - lbStartY;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => { lbDrag = false; });
lbStage.addEventListener("pointercancel", () => { lbDrag = false; });
lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const next = lbScale + (e.deltaY < 0 ? 0.18 : -0.18);
  lbScale = Math.max(0.7, Math.min(3, +next.toFixed(2)));
  if (lbScale <= 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
}, { passive: false });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lb.hidden) closeLightbox();
});

// 初始渲染
syncAll();

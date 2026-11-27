// 098 比例 PROPORTION — 主入口与单真源 DOM 绑定
import { BROKEN_STATE, CONTEXTS, SPECIMENS, SOLUTIONS, FAULTS, evaluate } from "./model.js";
import { mountHeroStage } from "./stage-hero.js";
import { mountScaleLab, mountFoldLab, mountModularLab, mountHistoryLab, mountOpticalLab, mountQuiz, mountPosterLightbox } from "./sections.js";

const state = { ...BROKEN_STATE };
const getState = () => state;
const setState = (patch) => Object.assign(state, patch);

// 缓存 DOM 节点（拖动时做轻量增量更新，绝不整块重建 DOM，保证 6× 慢机高帧率）
const el = {
  canvas: document.getElementById("hero-canvas"),
  mastStatus: document.getElementById("mast-status"),
  titleRuleMajor: document.getElementById("title-rule-major"),
  caption: document.getElementById("canvas-caption"),
  btnCheck: document.getElementById("btn-check"),
  btnCheckMobile: document.getElementById("btn-check-mobile"),
  btnFix: document.getElementById("btn-fix"),
  btnFixMobile: document.getElementById("btn-fix-mobile"),
  btnReset: document.getElementById("btn-reset"),
  btnUnity: document.getElementById("btn-unity"),
  outUnity: document.getElementById("out-unity"),
  inSplit: document.getElementById("in-split"),
  inAspect: document.getElementById("in-aspect"),
  inRhythm: document.getElementById("in-rhythm"),
  inMargin: document.getElementById("in-margin"),
  inAccent: document.getElementById("in-accent"),
  outSplit: document.getElementById("out-split"),
  outAspect: document.getElementById("out-aspect"),
  outRhythm: document.getElementById("out-rhythm"),
  outMargin: document.getElementById("out-margin"),
  outAccent: document.getElementById("out-accent"),
  peekBadge: document.getElementById("peek-badge"),
  peekText: document.getElementById("peek-text"),
  vTag: document.getElementById("v-tag"),
  vGrade: document.getElementById("v-grade"),
  vHeadline: document.getElementById("v-headline"),
  vWhy: document.getElementById("v-why"),
  vAction: document.getElementById("v-action"),
  kwWrap: document.getElementById("verdict-keywords"),
  specGrid: document.getElementById("specimen-grid"),
  solWrap: document.getElementById("solution-btns"),
  faultWrap: document.getElementById("fault-btns"),
  pVal: {
    relationship: document.getElementById("pval-relationship"),
    size: document.getElementById("pval-size"),
    rhythm: document.getElementById("pval-rhythm"),
    harmony: document.getElementById("pval-harmony"),
    unity: document.getElementById("pval-unity"),
  },
  pIcon: {
    relationship: document.getElementById("picon-relationship"),
    size: document.getElementById("picon-size"),
    rhythm: document.getElementById("picon-rhythm"),
    harmony: document.getElementById("picon-harmony"),
    unity: document.getElementById("picon-unity"),
  },
};

// 初始化原海报同款 5+1 常用比例标本架
function buildSpecimenShelf() {
  el.specGrid.innerHTML = SPECIMENS.map((sp) => {
    // 严格按原海报比例绘制微型几何图示（含 2:3 专属琥珀金圆！）
    let shape = "";
    if (sp.id === "1:1") {
      shape = `<rect x="19" y="8" width="38" height="38" fill="#95BBB3"/>`;
    } else if (sp.id === "2:3") {
      shape = `<rect x="24" y="4" width="28" height="46" fill="#267D7B"/><circle cx="38" cy="36" r="10" fill="#F0A63D"/>`;
    } else if (sp.id === "3:4") {
      shape = `<rect x="20" y="5" width="24" height="30" fill="#267D7B"/><rect x="46" y="5" width="10" height="30" fill="#C8D6CF"/><rect x="20" y="37" width="36" height="12" fill="#95BBB3"/>`;
    } else if (sp.id === "4:5") {
      shape = `<circle cx="38" cy="21" r="16" fill="#267D7B"/><rect x="20" y="41" width="36" height="9" fill="#267D7B"/>`;
    } else if (sp.id === "5:8") {
      shape = `<rect x="16" y="7" width="44" height="40" fill="#267D7B"/><rect x="43" y="29" width="15" height="16" fill="#95BBB3" stroke="#FBF2E3" stroke-width="1.5"/>`;
    } else {
      shape = `<rect x="8" y="9" width="36" height="36" fill="#267D7B"/><rect x="44" y="9" width="24" height="36" fill="#C8D6CF"/><circle cx="56" cy="27" r="10" fill="#95BBB3"/>`;
    }
    return `
      <button type="button" class="spec-tile" data-spec="${sp.id}" title="${sp.interval}：${sp.feel}">
        <span class="spec-num" lang="en">${sp.num}</span>
        <svg class="spec-svg" viewBox="0 0 76 54" aria-hidden="true">${shape}</svg>
        <span class="spec-ratio" lang="en">${sp.label}</span>
      </button>
    `;
  }).join("");
}

// 初始化多解与双向试错按钮
function buildPresetButtons() {
  el.solWrap.innerHTML = Object.values(SOLUTIONS)
    .map((s) => `<button type="button" class="chip-sol" data-sol="${s.id}">${s.label}</button>`)
    .join("");
  el.faultWrap.innerHTML = Object.values(FAULTS)
    .map((f) => `<button type="button" class="chip-fault" data-fault="${f.id}">${f.label}</button>`)
    .join("");
}

// 初始化四栏关键词节点，后续只更新文字与状态类
const kwRefs = [];
function buildKeywordCols() {
  const initial = evaluate(state).keywords;
  el.kwWrap.innerHTML = initial
    .map(
      (k) => `
      <div class="kw-live">
        <strong>${k.zh}</strong>
        <span lang="en">${k.en}</span>
        <em class="${k.ok ? "is-ok" : "is-err"}">${k.val}</em>
      </div>`
    )
    .join("");
  el.kwWrap.querySelectorAll("em").forEach((node) => kwRefs.push(node));
}

// 左侧 5 枚原海报几何图符实时变形（忠实还原原海报 5 枚图标并随参数活起来）
function syncProbeIcons(audit) {
  const { majorShare, marginRatio, rhythmStep, frameAspect } = audit.geo.metrics;
  const s = Math.round(10 + majorShare * 24);
  el.pIcon.relationship.innerHTML = `
    <svg viewBox="0 0 42 42" width="42" height="42">
      <rect x="2" y="2" width="38" height="38" fill="none" stroke="#222423" stroke-width="1.4"/>
      <rect x="4" y="4" width="${s}" height="${s}" fill="${audit.probes.relationship.ok ? "#267D7B" : "#B23024"}"/>
      <rect x="${4 + s}" y="${4 + s}" width="${Math.max(4, 34 - s)}" height="${Math.max(4, 34 - s)}" fill="#95BBB3"/>
    </svg>`;

  const pad = Math.round(2 + marginRatio * 48);
  el.pIcon.size.innerHTML = `
    <svg viewBox="0 0 42 42" width="42" height="42">
      <rect x="${pad}" y="${pad}" width="${Math.max(12, 34 - pad * 2)}" height="${Math.max(12, 34 - pad * 2)}" fill="none" stroke="${audit.probes.size.ok ? "#222423" : "#B23024"}" stroke-width="1.4"/>
      <line x1="38" y1="${pad}" x2="38" y2="${34 - pad}" stroke="#267D7B" stroke-dasharray="2 2"/>
      <line x1="${pad}" y1="38" x2="${34 - pad}" y2="38" stroke="#267D7B" stroke-dasharray="2 2"/>
    </svg>`;

  const r1 = 32;
  const r2 = Math.max(10, Math.round(r1 / rhythmStep));
  const r3 = Math.max(6, Math.round(r2 / rhythmStep));
  el.pIcon.rhythm.innerHTML = `
    <svg viewBox="0 0 42 42" width="42" height="42">
      <rect x="4" y="5" width="${r1}" height="8" fill="#222423"/>
      <rect x="4" y="17" width="${r2}" height="8" fill="${audit.probes.rhythm.ok ? "#267D7B" : "#B23024"}"/>
      <rect x="4" y="29" width="${r3}" height="8" fill="#95BBB3"/>
    </svg>`;

  const rw = Math.min(34, Math.max(18, Math.round(16 * frameAspect)));
  el.pIcon.harmony.innerHTML = `
    <svg viewBox="0 0 42 42" width="42" height="42">
      <circle cx="16" cy="18" r="12" fill="${audit.probes.harmony.ok ? "#267D7B" : "#B23024"}"/>
      <circle cx="${14 + Math.round(rw * 0.48)}" cy="28" r="9" fill="#222423"/>
    </svg>`;

  const uOk = audit.probes.unity.ok;
  el.pIcon.unity.innerHTML = `
    <svg viewBox="0 0 42 42" width="42" height="42">
      <rect x="4" y="4" width="15" height="15" fill="#6EA19C"/>
      <rect x="23" y="4" width="15" height="15" fill="#222423"/>
      <rect x="4" y="23" width="15" height="15" fill="#267D7B"/>
      <rect x="23" y="23" width="${uOk ? 15 : 9}" height="${uOk ? 15 : 11}" fill="${uOk ? "#222423" : "#B23024"}"/>
    </svg>`;
}

// 单真源 DOM 同步（每次交互只执行一次）
let lastIconKey = "";
function syncUI() {
  const audit = evaluate(state);
  const { frameAspect, partRatio, majorShare, marginRatio, accentFill, rhythmStep } = audit.geo.metrics;
  const ok = audit.verdict.ok;

  // 刊头状态与自示范标题比例尺
  el.mastStatus.textContent = audit.verdict.tag;
  el.mastStatus.className = `status-pill ${ok ? "is-ok" : "is-err"}`;
  el.titleRuleMajor.style.width = `${Math.round(majorShare * 100)}%`;

  // 滑轨与数字同步
  el.inSplit.value = (state.split * 100).toFixed(1);
  el.inAspect.value = state.frameAspect.toFixed(2);
  el.inRhythm.value = state.rhythm.toFixed(2);
  el.inMargin.value = (state.marginPct * 100).toFixed(1);
  el.inAccent.value = Math.round(state.accentScale * 100);

  el.outSplit.textContent = `${Math.round(majorShare * 100)}% · ${partRatio.toFixed(2)}:1`;
  el.outAspect.textContent = `${frameAspect.toFixed(2)} : 1`;
  el.outRhythm.textContent = `${rhythmStep.toFixed(2)}×`;
  el.outMargin.textContent = `${Math.round(marginRatio * 100)}%`;
  el.outAccent.textContent = `${Math.round(accentFill * 100)}%`;

  el.btnUnity.setAttribute("aria-pressed", String(state.unified));
  el.outUnity.textContent = state.unified ? "开启 · 同尺" : "关闭 · 分裂";

  el.btnCheck.setAttribute("aria-pressed", String(state.showCheck));
  el.btnCheckMobile.textContent = state.showCheck ? "收起检尺" : "展开检尺";

  // 移动端首屏摘要与底部完整灯泡诊单
  el.peekBadge.textContent = `${audit.passCount}/4`;
  el.peekBadge.className = `peek-badge ${ok ? "is-ok" : "is-err"}`;
  el.peekText.textContent = audit.verdict.headline;

  el.vTag.textContent = audit.verdict.tag;
  el.vTag.className = `verdict-tag ${ok ? "is-ok" : "is-err"}`;
  el.vGrade.textContent = audit.grade;
  el.vHeadline.textContent = audit.verdict.headline;
  el.vWhy.textContent = audit.verdict.why;
  el.vAction.textContent = audit.verdict.action;

  // 四关键词实时状态
  audit.keywords.forEach((k, i) => {
    if (!kwRefs[i]) return;
    kwRefs[i].textContent = k.val;
    kwRefs[i].className = k.ok ? "is-ok" : "is-err";
  });

  // 左侧五探针实时标签
  for (const key of Object.keys(el.pVal)) {
    const p = audit.probes[key];
    el.pVal[key].textContent = p.text;
    el.pVal[key].className = `probe-val ${p.ok ? "is-ok" : "is-err"}`;
  }

  // 图标仅在关键值变化超过阈值时更新，降低慢机拖动 DOM 改动量
  const iconKey = `${Math.round(majorShare * 40)}|${Math.round(marginRatio * 100)}|${Math.round(rhythmStep * 20)}|${Math.round(frameAspect * 20)}|${audit.probes.unity.ok}`;
  if (iconKey !== lastIconKey) {
    lastIconKey = iconKey;
    syncProbeIcons(audit);
  }

  // 高亮当前最接近的标本卡
  el.specGrid.querySelectorAll(".spec-tile").forEach((tile) => {
    const sp = SPECIMENS.find((x) => x.id === tile.dataset.spec);
    tile.classList.toggle("is-active", sp && Math.abs(sp.aspect - state.frameAspect) < 0.03);
  });
}

// 初始化一切
buildSpecimenShelf();
buildPresetButtons();
buildKeywordCols();

const heroStage = mountHeroStage(el.canvas, getState, setState, syncUI);

function applyPatch(patch) {
  setState(patch);
  heroStage.draw();
  syncUI();
}

// 语境切换
document.querySelectorAll(".ctx-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const ctx = btn.dataset.ctx;
    document.querySelectorAll(".ctx-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    el.caption.textContent = `${CONTEXTS[ctx].hint} 横拖卡尺调主次 · 拖角柄改画幅 · Space 对角检尺。`;
    applyPatch({ context: ctx });
  });
});

// 检尺开关
const toggleCheck = () => applyPatch({ showCheck: !state.showCheck });
el.btnCheck.addEventListener("click", toggleCheck);
el.btnCheckMobile.addEventListener("click", toggleCheck);

// 滑轨控制
el.inSplit.addEventListener("input", () => applyPatch({ split: parseFloat(el.inSplit.value) / 100 }));
el.inAspect.addEventListener("input", () => applyPatch({ frameAspect: parseFloat(el.inAspect.value) }));
el.inRhythm.addEventListener("input", () => applyPatch({ rhythm: parseFloat(el.inRhythm.value) }));
el.inMargin.addEventListener("input", () => applyPatch({ marginPct: parseFloat(el.inMargin.value) / 100 }));
el.inAccent.addEventListener("input", () => applyPatch({ accentScale: parseFloat(el.inAccent.value) / 100 }));
el.btnUnity.addEventListener("click", () => applyPatch({ unified: !state.unified }));

// 一键校准与复原
const applyGolden = () => applyPatch({ ...SOLUTIONS.golden.patch });
el.btnFix.addEventListener("click", applyGolden);
el.btnFixMobile.addEventListener("click", applyGolden);
el.btnReset.addEventListener("click", () => applyPatch({ ...BROKEN_STATE, context: state.context }));

// 标本架点击
el.specGrid.addEventListener("click", (e) => {
  const tile = e.target.closest("[data-spec]");
  if (!tile) return;
  const sp = SPECIMENS.find((x) => x.id === tile.dataset.spec);
  if (!sp) return;
  applyPatch({
    frameAspect: sp.aspect,
    split: sp.split,
    rhythm: sp.rhythm,
    marginPct: 0.095,
    accentScale: sp.amber ? 0.44 : 0.4,
    unified: true,
  });
});

// 多解与试错点击
el.solWrap.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-sol]");
  if (!btn) return;
  const s = SOLUTIONS[btn.dataset.sol];
  if (s) applyPatch({ ...s.patch });
});

el.faultWrap.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-fault]");
  if (!btn) return;
  const f = FAULTS[btn.dataset.fault];
  if (f) applyPatch({ ...f.patch, context: state.context });
});

// 左侧五枚几何探针点击联动高亮
document.querySelectorAll(".probe-row").forEach((row) => {
  row.addEventListener("click", () => {
    const key = row.dataset.probe;
    const next = state.highlightProbe === key ? null : key;
    document.querySelectorAll(".probe-row").forEach((r) => r.classList.toggle("is-highlight", r.dataset.probe === next));
    applyPatch({ highlightProbe: next });
  });
});

// 全局 Space 快捷键（不在输入控件内时切换对角检尺）
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.activeElement !== el.canvas && !/INPUT|BUTTON|TEXTAREA|SELECT|A/.test(document.activeElement?.tagName || "")) {
    e.preventDefault();
    toggleCheck();
  }
});

// 挂载正文 01–07 全部独立实验室
syncUI();
mountScaleLab();
mountFoldLab();
mountModularLab();
mountHistoryLab();
mountOpticalLab();
mountQuiz();
mountPosterLightbox();

// 050 环形构图 · 主控入口（单真源同步刊头自示范环标、四角探针、TIPS 诊单、滑轨与全页八节）
import { ERROR_PRESETS, INITIAL_STATE, SCENARIOS, VALID_PRESETS, auditRing, createState } from "./model.js";
import { mountHeroCanvas } from "./hero.js";
import { mountLightbox, mountSection01, mountSection02, mountSection03, mountSection04, mountSection05, mountSection06, mountSection07 } from "./sections.js";

let state = createState();
let audit = auditRing(state);

const els = {
  chip: document.getElementById("hero-chip"),
  miniArc: document.getElementById("mini-ring-arc"),
  miniCore: document.getElementById("mini-ring-core"),
  diamonds: [...document.querySelectorAll("#diamond-progress .dia")],
  scenBtns: [...document.querySelectorAll("[data-scenario]")],
  probeBtns: [...document.querySelectorAll("[data-probe]")],
  hud: document.getElementById("canvas-hud"),
  hint: document.getElementById("canvas-hint"),
  centroid: document.getElementById("dock-centroid"),

  posture: document.getElementById("verdict-posture"),
  vTitle: document.getElementById("verdict-title"),
  vWhy: document.getElementById("verdict-why"),
  vFix: document.getElementById("verdict-fix"),
  tipRows: [...document.querySelectorAll("#tips-checklist .tip-row")],
  miniSteps: [...document.querySelectorAll("#mini-steps .mstep")],

  inClosure: document.getElementById("in-closure"),
  outClosure: document.getElementById("out-closure"),
  inCore: document.getElementById("in-core"),
  outCore: document.getElementById("out-core"),
  inGap: document.getElementById("in-gap"),
  outGap: document.getElementById("out-gap"),
  inDepth: document.getElementById("in-depth"),
  outDepth: document.getElementById("out-depth"),
  inCrowd: document.getElementById("in-crowd"),
  outCrowd: document.getElementById("out-crowd"),
  inRival: document.getElementById("in-rival"),
  outRival: document.getElementById("out-rival"),
};

// 生成标题旁自示范微型活环 SVG 路径（与画布闭合角与核比实时联动）
function describeArc(cx, cy, r, startDeg, sweepDeg) {
  const sweep = Math.min(359.5, Math.max(20, sweepDeg));
  const rad0 = (startDeg * Math.PI) / 180;
  const rad1 = ((startDeg + sweep) * Math.PI) / 180;
  const x0 = cx + Math.cos(rad0) * r;
  const y0 = cy + Math.sin(rad0) * r;
  const x1 = cx + Math.cos(rad1) * r;
  const y1 = cy + Math.sin(rad1) * r;
  const large = sweep > 180 ? 1 : 0;
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

function syncUI() {
  audit = auditRing(state);
  const { g } = audit;

  // 1. 刊头状态章与自示范微环
  els.chip.textContent = audit.statusChip;
  els.chip.classList.toggle("is-ok", audit.isPass);
  els.chip.classList.toggle("is-bad", !audit.isPass);
  els.miniArc.setAttribute("d", describeArc(32, 32, 19.5, g.startDeg, g.closureDeg));
  els.miniCore.setAttribute("r", String((4.5 + (g.corePct / 100) * 10.5).toFixed(1)));

  // 右上 6 枚原海报薄荷菱星按达标度点亮
  const litCount = audit.isPass ? 6 : Math.round((audit.passCount / 4) * 5);
  els.diamonds.forEach((d, i) => d.classList.toggle("is-lit", i < litCount));

  // 2. 四角原海报黑圆探针（全部单真源）
  els.probeBtns.forEach((btn) => {
    const key = btn.dataset.probe;
    const p = audit.probes[key];
    btn.classList.toggle("is-ok", p.ok);
    btn.classList.toggle("is-bad", !p.ok);
    const selected = state.highlightLayer === key;
    btn.classList.toggle("is-selected", selected);
    btn.setAttribute("aria-pressed", String(selected));
    const badge = document.getElementById(`probe-badge-${key}`);
    if (badge) badge.textContent = p.badge;
  });

  // 3. 画布顶栏与参数读数
  els.hud.textContent = `闭合 ${g.closureDeg}° · 核比 ${g.corePct}% · 呼吸缝 ${g.gapPct}% · 极差 ${g.depthRatio.toFixed(1)}×`;
  els.hint.textContent = SCENARIOS[state.scenario].hint;
  els.centroid.textContent = `重心偏移 ${g.centroidShiftPct}% · 占空 ${g.fillPct}%`;

  // 4. TIPS 单真源诊单与四项勾叉
  els.posture.textContent = audit.postureLabel;
  els.vTitle.textContent = audit.verdictTitle;
  els.vWhy.textContent = audit.verdictWhy;
  els.vFix.textContent = audit.verdictFix;

  els.tipRows.forEach((row, i) => {
    const t = audit.tips[i];
    row.classList.toggle("is-ok", t.ok);
    row.querySelector(".tip-mark").textContent = t.ok ? "✓" : "×";
  });

  // 原海报右下三步演化微缩图
  els.miniSteps.forEach((ms, i) => {
    ms.classList.toggle("is-done", i < audit.buildStage);
  });

  // 5. 同步 6 枚精控滑轨与输出值
  els.inClosure.value = String(g.closureDeg);
  els.outClosure.textContent = `${g.closureDeg}°`;

  els.inCore.value = String(g.corePct);
  els.outCore.textContent = `${g.corePct}%`;

  els.inGap.value = String(g.gapPct);
  els.outGap.textContent = `${g.gapPct}%`;

  els.inDepth.value = String(Math.round(state.depthContrast * 100));
  els.outDepth.textContent = `${g.depthRatio.toFixed(1)}×`;

  els.inCrowd.value = String(Math.round(state.crowdDensity * 100));
  els.outCrowd.textContent = `${g.fillPct}%`;

  els.inRival.value = String(Math.round(state.rivalWeight * 100));
  els.outRival.textContent = `${Math.round(g.rivalVisualRatio * 100)}%`;

  // 6. 场景按钮激活态
  els.scenBtns.forEach((btn) => {
    const active = btn.dataset.scenario === state.scenario;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
}

function mutate(patch) {
  state = { ...state, ...patch };
  syncUI();
  hero.draw();
}

const hero = mountHeroCanvas(
  document.getElementById("hero-canvas"),
  () => state,
  () => audit,
  mutate
);

// 场景切换
els.scenBtns.forEach((btn) => {
  btn.addEventListener("click", () => mutate({ scenario: btn.dataset.scenario }));
});

// 四角原则探针点击高亮对应几何层
els.probeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.probe;
    mutate({ highlightLayer: state.highlightLayer === key ? null : key });
  });
});

// 滑轨绑定
els.inClosure.addEventListener("input", () => mutate({ closureDeg: Number(els.inClosure.value) }));
els.inCore.addEventListener("input", () => mutate({ coreRatio: Number(els.inCore.value) / 100 }));
els.inGap.addEventListener("input", () => mutate({ gapRatio: Number(els.inGap.value) / 100 }));
els.inDepth.addEventListener("input", () => mutate({ depthContrast: Number(els.inDepth.value) / 100 }));
els.inCrowd.addEventListener("input", () => mutate({ crowdDensity: Number(els.inCrowd.value) / 100 }));
els.inRival.addEventListener("input", () => mutate({ rivalWeight: Number(els.inRival.value) / 100 }));

// 一键修复 / 演播视线 / 复原开场坏态
document.getElementById("btn-fix-all").addEventListener("click", () => {
  mutate({ ...VALID_PRESETS.classic.patch, highlightLayer: null });
  hero.triggerTrace();
});
document.getElementById("btn-trace-top").addEventListener("click", () => hero.triggerTrace());
document.getElementById("btn-trace-dock").addEventListener("click", () => hero.triggerTrace());
document.getElementById("btn-reset-bad").addEventListener("click", () => {
  mutate({ ...INITIAL_STATE, scenario: state.scenario });
});

// 多组合法解与反向试错按钮
document.querySelectorAll("[data-valid]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = VALID_PRESETS[btn.dataset.valid];
    if (p) mutate({ ...p.patch, highlightLayer: null });
  });
});
document.querySelectorAll("[data-err]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = ERROR_PRESETS[btn.dataset.err];
    if (p) mutate({ ...p.patch, highlightLayer: null });
  });
});

// 初始同步 & 挂载其余八节
syncUI();
hero.draw();
mountSection01();
mountSection02();
mountSection03();
mountSection04();
mountSection05();
mountSection06();
mountSection07();
mountLightbox();

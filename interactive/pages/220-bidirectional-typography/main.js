// 220 双向文字排版 · 主入口
// 将单一状态源 model.js、开场十字双轴画布 stage-hero.js 与正文 01–07 节全部联动。
import { clamp, createState, PRESETS } from "./model.js";
import { mountHeroStage } from "./stage-hero.js";
import { mountSections } from "./sections.js";

const state = createState();

// DOM 缓存（只由单真源 layout 驱动更新，绝不写死常量）
const els = {
  canvas: document.getElementById("hero-canvas"),
  topPill: document.getElementById("hero-top-pill"),
  auditPill: document.getElementById("audit-pill"),
  headline: document.getElementById("diag-headline"),
  why: document.getElementById("diag-why"),
  fix: document.getElementById("diag-fix"),

  beaconJux: document.getElementById("beacon-juxtapose"),
  beaconCon: document.getElementById("beacon-contrast"),
  beaconSwi: document.getElementById("beacon-switching"),
  beaconAnc: document.getElementById("beacon-anchor"),
  beaconBtns: [...document.querySelectorAll("[data-dim]")],

  ruleDom: document.getElementById("rule-dom"),
  ruleContrast: document.getElementById("rule-contrast"),
  ruleUnity: document.getElementById("rule-unity"),
  valDomRule: document.getElementById("val-dom-rule"),
  valContrastRule: document.getElementById("val-contrast-rule"),
  valUnityRule: document.getElementById("val-unity-rule"),

  valCoord: document.getElementById("val-coord"),
  valRatio: document.getElementById("val-ratio"),
  valRhythm: document.getElementById("val-rhythm"),
  valQuads: document.getElementById("val-quads"),

  rngHubX: document.getElementById("rng-hubx"),
  rngHubY: document.getElementById("rng-huby"),
  rngBalance: document.getElementById("rng-balance"),
  rngRhythm: document.getElementById("rng-rhythm"),
  rngHubScale: document.getElementById("rng-hubscale"),

  outHubX: document.getElementById("out-hubx"),
  outHubY: document.getElementById("out-huby"),
  outBalance: document.getElementById("out-balance"),
  outRhythm: document.getElementById("out-rhythm"),
  outHubScale: document.getElementById("out-hubscale"),

  specimenBtns: [...document.querySelectorAll("[data-specimen]")],
  readModeBtns: [...document.querySelectorAll("[data-readmode]")],
  unityBtns: [...document.querySelectorAll("[data-unity]")],
  presetBtns: [...document.querySelectorAll("[data-preset]")],

  btnFixAll: document.getElementById("btn-fix-all"),
  btnSweep: document.getElementById("btn-sweep"),
  btnGuides: document.getElementById("btn-guides"),
};

let lastDomSig = "";

function syncUI(lay) {
  // 避免在纯动画帧重复触碰 DOM，保障拖动与首屏满帧
  const sig = [
    state.specimen,
    state.readMode,
    state.unity,
    state.highlightDim || "",
    state.showGuides,
    Math.round(lay.hubX * 100),
    Math.round(lay.hubY * 100),
    Math.round(state.axisBalance * 100),
    Math.round(lay.rhythmContrast * 100),
    Math.round(lay.hubScale * 100),
    lay.diagnosis.short,
    lay.quadPct.nw,
    lay.quadPct.ne,
    lay.quadPct.sw,
  ].join("|");
  if (sig === lastDomSig) return;
  lastDomSig = sig;

  const isOk = lay.score === 4;

  // 顶栏与诊单徽章
  for (const p of [els.topPill, els.auditPill]) {
    p.textContent = lay.diagnosis.short;
    p.classList.toggle("is-ok", isOk);
    p.classList.toggle("is-err", !isOk);
  }
  els.headline.textContent = lay.diagnosis.headline;
  els.why.textContent = lay.diagnosis.why;
  els.fix.textContent = lay.diagnosis.fix;

  // 右上四枚原海报角标实时探针
  const dimMap = {
    juxtapose: [els.beaconJux, lay.dims.juxtapose],
    contrast: [els.beaconCon, lay.dims.contrast],
    switching: [els.beaconSwi, lay.dims.switching],
    anchor: [els.beaconAnc, lay.dims.anchor],
  };
  els.beaconBtns.forEach((btn) => {
    const key = btn.dataset.dim;
    const [valEl, info] = dimMap[key];
    valEl.textContent = info.tag;
    btn.classList.toggle("is-ok", info.ok);
    btn.classList.toggle("is-err", !info.ok);
    btn.setAttribute("aria-pressed", String(state.highlightDim === key));
  });

  // 左下原海报三条要点
  els.ruleDom.classList.toggle("is-ok", lay.dims.juxtapose.ok);
  els.ruleDom.classList.toggle("is-err", !lay.dims.juxtapose.ok);
  els.valDomRule.textContent = lay.dims.juxtapose.tag;

  els.ruleContrast.classList.toggle("is-ok", lay.dims.contrast.ok);
  els.ruleContrast.classList.toggle("is-err", !lay.dims.contrast.ok);
  els.valContrastRule.textContent = lay.dims.contrast.tag;

  els.ruleUnity.classList.toggle("is-ok", lay.dims.switching.ok);
  els.ruleUnity.classList.toggle("is-err", !lay.dims.switching.ok);
  els.valUnityRule.textContent = lay.dims.switching.tag;

  // 右匣四项实时读数（全自 model.js 实绘计算）
  const xPct = Math.round(lay.hubX * 100);
  const yPct = Math.round(lay.hubY * 100);
  els.valCoord.textContent = `X ${xPct}% · Y ${yPct}%`;
  const dirLabel = lay.domDir === "horizontal" ? "横主" : lay.domDir === "vertical" ? "纵主" : "五五";
  const shownRatio = lay.domRatio >= 1 ? lay.domRatio.toFixed(2) : (1 / lay.domRatio).toFixed(2);
  els.valRatio.textContent = `${shownRatio}× ${dirLabel}`;
  els.valRhythm.textContent = `${lay.rhythmContrast.toFixed(2)}×`;
  els.valQuads.textContent = `${lay.quadPct.nw}/${lay.quadPct.ne}/${lay.quadPct.sw}/${lay.quadPct.se}%`;

  // 滑杆与输出值同步
  els.rngHubX.value = String(xPct);
  els.outHubX.textContent = `${xPct}%`;
  els.rngHubY.value = String(yPct);
  els.outHubY.textContent = `${yPct}%`;
  const balInt = Math.round(state.axisBalance * 100);
  els.rngBalance.value = String(balInt);
  els.outBalance.textContent = `${balInt > 0 ? "+" : ""}${(balInt / 100).toFixed(2)} (${dirLabel})`;
  els.rngRhythm.value = String(Math.round(lay.rhythmContrast * 100));
  els.outRhythm.textContent = `${lay.rhythmContrast.toFixed(2)}×`;
  const hsPct = Math.round(lay.hubScale * 100);
  els.rngHubScale.value = String(hsPct);
  els.outHubScale.textContent = `${hsPct}%`;

  // 按钮组状态同步
  els.specimenBtns.forEach((b) => {
    const act = b.dataset.specimen === state.specimen;
    b.classList.toggle("is-active", act);
    b.setAttribute("aria-pressed", String(act));
  });
  els.readModeBtns.forEach((b) => {
    const act = b.dataset.readmode === state.readMode;
    b.classList.toggle("is-active", act);
    b.setAttribute("aria-pressed", String(act));
  });
  els.unityBtns.forEach((b) => {
    const act = b.dataset.unity === state.unity;
    b.classList.toggle("is-active", act);
    b.setAttribute("aria-pressed", String(act));
  });
  els.btnGuides.setAttribute("aria-pressed", String(state.showGuides));
  els.btnGuides.textContent = state.showGuides ? "标尺：开" : "标尺：关";
}

function patch(partial) {
  Object.assign(state, partial);
  heroStage.draw();
}

const heroStage = mountHeroStage(els.canvas, () => state, patch, syncUI);

// 标本与读向切签
els.specimenBtns.forEach((b) => b.addEventListener("click", () => patch({ specimen: b.dataset.specimen })));
els.readModeBtns.forEach((b) => b.addEventListener("click", () => patch({ readMode: b.dataset.readmode })));
els.unityBtns.forEach((b) => b.addEventListener("click", () => patch({ unity: b.dataset.unity })));

// 原海报右上四枚探针联动高亮
els.beaconBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const dim = b.dataset.dim;
    patch({ highlightDim: state.highlightDim === dim ? null : dim });
  })
);

// 精控滑杆
els.rngHubX.addEventListener("input", () => patch({ hubX: Number(els.rngHubX.value) / 100 }));
els.rngHubY.addEventListener("input", () => patch({ hubY: Number(els.rngHubY.value) / 100 }));
els.rngBalance.addEventListener("input", () => patch({ axisBalance: Number(els.rngBalance.value) / 100 }));
els.rngRhythm.addEventListener("input", () => patch({ rhythmContrast: Number(els.rngRhythm.value) / 100 }));
els.rngHubScale.addEventListener("input", () => patch({ hubScale: Number(els.rngHubScale.value) / 100 }));

// 一键校准、演练视线、标尺开关与多解/试错预设
els.btnFixAll.addEventListener("click", () => {
  patch({ ...PRESETS.classic.patch, readMode: "dual" });
  heroStage.triggerSweep();
});
els.btnSweep.addEventListener("click", () => heroStage.triggerSweep());
els.btnGuides.addEventListener("click", () => patch({ showGuides: !state.showGuides }));

els.presetBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    if (b.dataset.preset === "reset") {
      patch({ ...p.patch, specimen: state.specimen });
    } else {
      patch({ ...p.patch });
    }
  })
);

// 键盘操作：方向键微调十字交汇坐标、空格演练 90° 转轨视线
document.addEventListener("keydown", (ev) => {
  const lb = document.getElementById("poster-lightbox");
  if (lb && !lb.hidden) return;
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

  if (ev.key === "ArrowLeft") {
    ev.preventDefault();
    patch({ hubX: clamp(Number((state.hubX - 0.03).toFixed(3)), 0.16, 0.84) });
  } else if (ev.key === "ArrowRight") {
    ev.preventDefault();
    patch({ hubX: clamp(Number((state.hubX + 0.03).toFixed(3)), 0.16, 0.84) });
  } else if (ev.key === "ArrowUp") {
    ev.preventDefault();
    patch({ hubY: clamp(Number((state.hubY - 0.03).toFixed(3)), 0.22, 0.78) });
  } else if (ev.key === "ArrowDown") {
    ev.preventDefault();
    patch({ hubY: clamp(Number((state.hubY + 0.03).toFixed(3)), 0.22, 0.78) });
  } else if (ev.code === "Space" && tag !== "BUTTON" && tag !== "A") {
    ev.preventDefault();
    heroStage.triggerSweep();
  }
});

mountSections();

// 090 动态构图 · 主入口：联动单一真源 model.js、2D Canvas 与全页七节交互
import { loop, reducedMotion } from "../../lib/stage.js";
import { clamp, cloneState, evaluate, INITIAL_STATE, PRESETS } from "./model.js";
import { createHeroCanvas } from "./canvas-hero.js";
import { initCurtain, initDissector, initHistoryEras, initLightbox, initQuiz, initSlopeLab, initTriage } from "./sections.js";

const $ = (id) => document.getElementById(id);

const state = cloneState(INITIAL_STATE);

const canvas = $("hero-canvas");
const heroView = createHeroCanvas(canvas, () => state, (patch) => {
  applyPatch(patch);
});

const ticker = loop(canvas, (t, dt, opts) => {
  heroView.render(t, dt, opts);
});

// 响应式画布尺寸同步
new ResizeObserver(() => {
  heroView.resize();
  syncUI();
  ticker.draw();
}).observe(canvas);

// DOM 引用
const ctrlAngle = $("ctrl-angle");
const ctrlContrast = $("ctrl-contrast");
const ctrlRhythm = $("ctrl-rhythm");
const mobileAngle = $("mobile-angle");

const valAngle = $("val-angle");
const valContrast = $("val-contrast");
const valRhythm = $("val-rhythm");
const mobileAngleVal = $("mobile-angle-val");

const btnConflicts = $("btn-fix-conflicts");
const btnSpeedCue = $("btn-speed-cue");
const btnPulse = $("btn-pulse");
const mobilePulseBtn = $("mobile-pulse-btn");
const mobileFixBtn = $("mobile-fix-btn");
const btnApplyPoster = $("btn-apply-poster");
const btnResetBroken = $("btn-reset-broken");

const statusPill = $("hero-status-pill");
const mobileStatusPill = $("mobile-status-pill");
const mobileVerdict = $("mobile-verdict");
const diagBadge = $("diag-badge");
const diagMetrics = $("diag-metrics");
const diagHeadline = $("diag-headline");
const diagWhy = $("diag-why");
const diagAction = $("diag-action");

const sceneBtns = [...document.querySelectorAll("[data-scene]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const probeBtns = [...document.querySelectorAll("[data-probe-btn]")];
const wedgeIcons = [...document.querySelectorAll("[data-wicon]")];

function applyPatch(patch) {
  if (patch.scene !== undefined) state.scene = patch.scene;
  if (patch.angle !== undefined) state.angle = clamp(Math.round(patch.angle), -55, 75);
  if (patch.contrast !== undefined) state.contrast = clamp(+Number(patch.contrast).toFixed(1), 1.0, 5.8);
  if (patch.rhythm !== undefined) state.rhythm = clamp(Math.round(patch.rhythm), 0, 100);
  if (patch.conflicts !== undefined) {
    state.conflicts = { bolt: !!patch.conflicts.bolt, dart: !!patch.conflicts.dart };
  }
  if (patch.speedCue !== undefined) state.speedCue = !!patch.speedCue;
  if (patch.highlightProbe !== undefined) state.highlightProbe = patch.highlightProbe;

  syncUI();
  ticker.draw();
}

function syncUI() {
  const rect = canvas.getBoundingClientRect();
  const ev = evaluate(state, rect.width || 800, rect.height || 460);
  const m = ev.metrics;
  const angleStr = m.angle > 0 ? `+${m.angle}°` : `${m.angle}°`;

  // 滑轨数值严格与实测单一真源同步
  if (ctrlAngle) ctrlAngle.value = String(state.angle);
  if (mobileAngle) mobileAngle.value = String(state.angle);
  if (ctrlContrast) ctrlContrast.value = String(state.contrast);
  if (ctrlRhythm) ctrlRhythm.value = String(state.rhythm);

  if (valAngle) valAngle.textContent = angleStr;
  if (mobileAngleVal) mobileAngleVal.textContent = angleStr;
  if (valContrast) valContrast.textContent = `${m.scaleRatio}×`;
  if (valRhythm) valRhythm.textContent = `${state.rhythm}%`;

  // 顶部与手机状态章
  for (const pill of [statusPill, mobileStatusPill]) {
    if (!pill) continue;
    pill.textContent = ev.badge;
    pill.classList.toggle("is-ok", ev.isPass);
    pill.classList.toggle("is-err", !ev.isPass);
  }

  // 冲突与速度尾迹按钮
  if (btnConflicts) {
    const c = m.conflictCount;
    btnConflicts.textContent = c > 0 ? `逆冲冲突：${c} 处（点扳顺）` : "方向一致：0 处逆冲";
    btnConflicts.classList.toggle("is-warn", c > 0);
    btnConflicts.classList.toggle("is-on", c === 0);
    btnConflicts.setAttribute("aria-pressed", String(c > 0));
  }
  if (btnSpeedCue) {
    btnSpeedCue.textContent = state.speedCue ? "速度尾迹：开" : "速度尾迹：关";
    btnSpeedCue.classList.toggle("is-on", state.speedCue);
    btnSpeedCue.setAttribute("aria-pressed", String(state.speedCue));
  }

  // 场景切签高亮
  sceneBtns.forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 5 枚原海报圆徽探针 + 底部 5 枚白色图标同步点亮
  ev.probes.forEach((p) => {
    const stat = document.querySelector(`[data-probe-stat="${p.key}"]`);
    if (stat) {
      stat.textContent = p.status;
      stat.classList.toggle("is-ok", p.ok);
      stat.classList.toggle("is-err", !p.ok);
    }
    const wi = wedgeIcons.find((el) => el.dataset.wicon === p.key);
    if (wi) wi.classList.toggle("is-lit", p.ok);
  });

  probeBtns.forEach((b) => {
    const on = b.dataset.probeBtn === state.highlightProbe;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 深石油青斜切楔形单真源诊单 + 手机首屏短诊单
  if (diagBadge) {
    diagBadge.textContent = ev.badge;
    diagBadge.classList.toggle("is-ok", ev.isPass);
    diagBadge.classList.toggle("is-err", !ev.isPass);
  }
  if (diagMetrics) {
    diagMetrics.textContent = `AXIS ${angleStr} · SCALE ${m.scaleRatio}× · BEAT ${m.gapRatio}× · 逆冲 ${m.conflictCount} 处`;
  }
  if (diagHeadline) diagHeadline.textContent = ev.headline;
  if (diagWhy) diagWhy.textContent = ev.why;
  if (diagAction) diagAction.textContent = ev.action;
  if (mobileVerdict) mobileVerdict.textContent = ev.headline;
}

// 绑定滑轨
ctrlAngle?.addEventListener("input", () => applyPatch({ angle: Number(ctrlAngle.value) }));
mobileAngle?.addEventListener("input", () => applyPatch({ angle: Number(mobileAngle.value) }));
ctrlContrast?.addEventListener("input", () => applyPatch({ contrast: Number(ctrlContrast.value) }));
ctrlRhythm?.addEventListener("input", () => applyPatch({ rhythm: Number(ctrlRhythm.value) }));

// 开关按钮
btnConflicts?.addEventListener("click", () => {
  const hasAny = state.conflicts.bolt || state.conflicts.dart;
  applyPatch({ conflicts: hasAny ? { bolt: false, dart: false } : { bolt: true, dart: true } });
});
btnSpeedCue?.addEventListener("click", () => applyPatch({ speedCue: !state.speedCue }));

// 脉冲放流
const firePulse = () => {
  heroView.triggerPulse();
  ticker.draw();
};
btnPulse?.addEventListener("click", firePulse);
mobilePulseBtn?.addEventListener("click", firePulse);

// 快捷校准与复原
const applyPreset = (key) => {
  const p = PRESETS[key];
  if (!p) return;
  applyPatch(p.state);
  presetBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.preset === key));
};
btnApplyPoster?.addEventListener("click", () => applyPreset("poster"));
mobileFixBtn?.addEventListener("click", () => applyPreset("poster"));
btnResetBroken?.addEventListener("click", () => applyPreset("errFlat"));

presetBtns.forEach((b) => {
  b.addEventListener("click", () => applyPreset(b.dataset.preset));
});

// 场景切换
sceneBtns.forEach((b) => {
  b.addEventListener("click", () => applyPatch({ scene: b.dataset.scene }));
});

// 5 枚圆徽探针点击高亮对应维度
probeBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const key = b.dataset.probeBtn;
    applyPatch({ highlightProbe: state.highlightProbe === key ? null : key });
  });
});

// 键盘操控（方向键微调倾角/体量、Space 脉冲放流，避免抢占输入框焦点）
document.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  const lb = $("lightbox");
  if (lb && !lb.hidden) return;

  if (e.code === "Space" && tag !== "BUTTON" && tag !== "A") {
    e.preventDefault();
    firePulse();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    applyPatch({ angle: state.angle + 4 });
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    applyPatch({ angle: state.angle - 4 });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    applyPatch({ contrast: state.contrast + 0.3 });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    applyPatch({ contrast: state.contrast - 0.3 });
  }
});

// 初始化 UI 与正文 7 节独立交互
syncUI();
if (reducedMotion.matches) ticker.draw();
initDissector();
initSlopeLab();
initCurtain();
initHistoryEras();
initTriage();
initQuiz();
initLightbox();

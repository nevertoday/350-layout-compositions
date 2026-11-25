// 022 垂直构图 · 页面总编排
import { HERO_INITIAL, evaluateHero } from "./model.js";
import { bindHeroControls, renderHeroCanvas } from "./hero.js";
import {
  initPosterLightbox,
  initSection1,
  initSection2,
  initSection3,
  initSection4,
  initSection5,
  initSection6,
  initSection7,
} from "./sections.js";
import { loop } from "../../lib/stage.js";

const heroState = { ...HERO_INITIAL };
let reveal = 0;
let heroDirty = true;

const els = {
  heroSec: document.getElementById("hero"),
  canvas: document.getElementById("hero-canvas"),
  titlePlumb: document.getElementById("title-plumb"),
  pitchTrack: document.getElementById("pitch-track"),
  pitchKnob: document.getElementById("pitch-knob"),
  pitchVal: document.getElementById("pitch-val"),
  shiftTrack: document.getElementById("shift-track"),
  shiftKnob: document.getElementById("shift-knob"),
  shiftVal: document.getElementById("shift-val"),
  badge: document.getElementById("diag-badge"),
  count: document.getElementById("diag-count"),
  headline: document.getElementById("diag-headline"),
  reason: document.getElementById("diag-reason"),
  hint: document.getElementById("diag-hint"),
  resetBtn: document.getElementById("hero-reset"),
  sceneBtns: [...document.querySelectorAll("[data-scene]")],
  rhythmBtns: [...document.querySelectorAll("[data-rhythm]")],
  aspectBtns: [...document.querySelectorAll("[data-aspect]")],
  principleItems: {
    ascent: document.getElementById("pr-ascent"),
    dignity: document.getElementById("pr-dignity"),
    order: document.getElementById("pr-order"),
    rhythm: document.getElementById("pr-rhythm"),
  },
};

function syncHeroUI() {
  const ev = evaluateHero(heroState);

  // 1. 示范大标题旁的动态细金铅垂线：与建筑实测柱倾角严格联动，0.0° 时锁直点亮
  const slantClamped = Math.max(-14, Math.min(14, ev.slantDeg));
  els.titlePlumb.style.transform = `rotate(${slantClamped.toFixed(2)}deg)`;
  els.titlePlumb.dataset.ok = String(ev.principles.dignity.ok);

  // 2. 仰角拨尺位置与读数
  const pitchT = (heroState.pitchDeg + 10) / 32; // -10..+22 -> 0..1
  els.pitchKnob.style.left = `${(pitchT * 100).toFixed(2)}%`;
  els.pitchKnob.setAttribute("aria-valuenow", heroState.pitchDeg.toFixed(1));
  els.pitchKnob.dataset.ok = String(ev.principles.dignity.ok);
  const pSign = heroState.pitchDeg > 0 ? "+" : "";
  els.pitchVal.textContent = `${pSign}${heroState.pitchDeg.toFixed(1)}°`;

  // 3. 移轴竖轨位置与读数（0% 底 → 100% 顶）
  const shiftPct = Math.round(heroState.shift * 100);
  els.shiftKnob.style.bottom = `${shiftPct}%`;
  els.shiftKnob.setAttribute("aria-valuenow", String(shiftPct));
  els.shiftKnob.dataset.ok = String(ev.principles.ascent.ok && ev.principles.order.ok);
  els.shiftVal.textContent = `${shiftPct}%`;

  // 4. 按钮按下态
  els.sceneBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scene === heroState.scene)));
  els.rhythmBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.rhythm === heroState.rhythm)));
  els.aspectBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.aspect === heroState.aspect)));

  // 5. 右栏原海报四枚哑金圆环实时指标
  for (const key of ["ascent", "dignity", "order", "rhythm"]) {
    const node = els.principleItems[key];
    const info = ev.principles[key];
    node.dataset.ok = String(info.ok);
    const valNode = node.querySelector(".pr-val");
    if (valNode) valNode.textContent = info.value;
  }

  // 6. 主诊断结论（一次只讲清当前最核心的一条「为什么」）
  els.badge.textContent = ev.badge;
  els.badge.dataset.ok = String(ev.passCount === 4);
  els.count.textContent = `${ev.passCount} / 4`;
  els.headline.textContent = ev.headline;
  els.reason.textContent = ev.reason;
  els.hint.textContent = ev.nextHint;

  heroDirty = true;
}

// 绑定开场交互控件
bindHeroControls({
  canvas: els.canvas,
  pitchTrack: els.pitchTrack,
  pitchKnob: els.pitchKnob,
  shiftTrack: els.shiftTrack,
  shiftKnob: els.shiftKnob,
  state: heroState,
  onChange: () => {
    syncHeroUI();
    heroLoop.draw();
  },
});

els.sceneBtns.forEach((b) => {
  b.addEventListener("click", () => {
    heroState.scene = b.dataset.scene;
    syncHeroUI();
    heroLoop.draw();
  });
});

els.rhythmBtns.forEach((b) => {
  b.addEventListener("click", () => {
    heroState.rhythm = b.dataset.rhythm;
    syncHeroUI();
    heroLoop.draw();
  });
});

els.aspectBtns.forEach((b) => {
  b.addEventListener("click", () => {
    heroState.aspect = b.dataset.aspect;
    syncHeroUI();
    heroLoop.draw();
  });
});

els.resetBtn.addEventListener("click", () => {
  Object.assign(heroState, HERO_INITIAL);
  syncHeroUI();
  heroLoop.draw();
});

// 开场升起动画：柱群在 0.85 秒内从基底平滑升起（任意中途帧都完整好看；still 模式直达终点）
const heroLoop = loop(els.heroSec, (t, _dt, { still }) => {
  const nextReveal = still ? 1 : Math.min(1, 0.38 + 0.62 * (1 - Math.pow(1 - Math.min(1, t / 0.85), 3)));
  if (Math.abs(nextReveal - reveal) > 0.002 || heroDirty) {
    reveal = nextReveal;
    heroDirty = false;
    const ev = evaluateHero(heroState);
    renderHeroCanvas(els.canvas, heroState, ev, reveal);
  }
});

// 初始化八节全部交互
syncHeroUI();
const s1 = initSection1();
const s2 = initSection2();
initSection3();
const s4 = initSection4();
initSection5();
initSection6();
initSection7();
initPosterLightbox();

// 窗口尺寸变化时重绘所有 2D Canvas（节流到动画帧，不阻塞）
let resizeRaf = 0;
window.addEventListener("resize", () => {
  if (resizeRaf) return;
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = 0;
    heroDirty = true;
    heroLoop.draw();
    s1.draw();
    s2.draw();
    s4.draw();
  });
});

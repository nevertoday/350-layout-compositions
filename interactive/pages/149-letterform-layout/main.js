// 149 字母造型版式 · 交互主入口
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { LETTERS, clamp, createInitialState, evaluate, softSnap } from "./model.js";
import { drawDarkroomCanvas, drawHeroStage } from "./canvas.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// =========================================================================
// 1. 首屏活体字母架构工坊状态与同步
// =========================================================================
let state = createInitialState("A");
const heroCanvas = $("#heroCanvas");
const heroCtx = heroCanvas.getContext("2d");

const els = {
  topBadge: $("#topBadge"),
  diagBox: $("#diagBox"),
  diagBadge: $("#diagBadge"),
  diagTitle: $("#diagTitle"),
  diagWhy: $("#diagWhy"),
  diagAction: $("#diagAction"),
  mCounter: $("#mCounter"),
  mSlopeLabel: $("#mSlopeLabel"),
  mSlope: $("#mSlope"),
  mBar: $("#mBar"),
  mStroke: $("#mStroke"),
  pillarForm: $("#pillarForm"),
  pillarFormTag: $("#pillarFormTag"),
  pillarStruct: $("#pillarStruct"),
  pillarStructTag: $("#pillarStructTag"),
  pillarAssoc: $("#pillarAssoc"),
  pillarAssocTag: $("#pillarAssocTag"),
  pillarCreate: $("#pillarCreate"),
  pillarCreateTag: $("#pillarCreateTag"),
  strokeTrack: $("#strokeTrack"),
  strokeThumb: $("#strokeThumb"),
  strokeRange: $("#strokeRange"),
  strokeReadout: $("#strokeReadout"),
  zoneSweet: $("#zoneSweet"),
  barRange: $("#barRange"),
  barValInline: $("#barValInline"),
  spreadRange: $("#spreadRange"),
  spreadValInline: $("#spreadValInline"),
  btnGuides: $("#btnGuides"),
  btnReset: $("#btnReset"),
  markOuter: $("#markOuter"),
  markHole: $("#markHole"),
  flowSteps: $$(".flow-step"),
  letterTabs: $$("[data-letter]"),
  infoBtns: $$("[data-info]"),
};

let heroW = 640;
let heroH = 440;
let lastEval = null;

function resizeCanvas(canvas, maxDpr = 2) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return { w: 640, h: 440 };
  const dpr = pixelRatio(maxDpr);
  const pw = Math.round(rect.width * dpr);
  const ph = Math.round(rect.height * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w: rect.width, h: rect.height };
}

function updateLiveMark(stroke) {
  // 刊头示范缩微 A 的笔画宽度随推杆同步变化
  const s = clamp((stroke - 0.07) / (0.45 - 0.07), 0, 1);
  const leg = 6 + s * 13;
  const topH = 5 + s * 6;
  const barY = 39;
  const barH = 5 + s * 7;
  els.markOuter.setAttribute(
    "d",
    `M${32 - topH} 8 L${32 + topH} 8 L58 58 L${58 - leg} 58 L${32 + topH + (barY - 8) / 50 * (26 - topH) - leg * 0.6} ${barY + barH * 0.5} L${32 - topH - (barY - 8) / 50 * (26 - topH) + leg * 0.6} ${barY + barH * 0.5} L${6 + leg} 58 L6 58 Z`
  );
  const holeW = Math.max(0, 13 - s * 11.5);
  const holeTop = 16 + s * 14;
  const holeBot = Math.max(holeTop + 1, barY - barH * 0.5);
  if (holeW > 1.2 && holeBot > holeTop + 2) {
    els.markHole.setAttribute("points", `32,${holeTop.toFixed(1)} ${(32 - holeW).toFixed(1)},${holeBot.toFixed(1)} ${(32 + holeW).toFixed(1)},${holeBot.toFixed(1)}`);
  } else {
    els.markHole.setAttribute("points", "32,32 32,32 32,32");
  }
}

function syncHeroUI(res) {
  lastEval = res;
  const { cfg, metrics, pillars, passCount, diag, allOk } = res;

  // 顶眉态标
  els.topBadge.textContent = allOk ? "4 / 4 骨架成立" : `${passCount} / 4 待塑形`;
  els.topBadge.className = `status-pill ${allOk ? "is-ok" : "is-err"}`;

  // 白话诊单
  els.diagBox.className = `diag-box ${allOk ? "is-ok" : "is-err"}`;
  els.diagBadge.textContent = diag.badge;
  els.diagTitle.textContent = diag.title;
  els.diagWhy.textContent = diag.why;
  els.diagAction.textContent = diag.action;

  els.mCounter.textContent = `${metrics.counterPct.toFixed(1)}%`;
  els.mSlopeLabel.textContent = cfg.id === "H" ? "双柱展幅" : "斜边倾角";
  els.mSlope.textContent = cfg.id === "H" ? `${metrics.baseWidthRatioPct}%` : `${metrics.slopeDeg.toFixed(1)}°`;
  els.mBar.textContent = `${metrics.barPct}%`;
  els.mStroke.textContent = `${metrics.strokePct}%`;

  // 四枚原海报紫线图标实况灯
  const setPillar = (li, tagEl, p) => {
    li.className = `pillar-item ${p.ok ? "is-ok" : "is-err"}`;
    tagEl.textContent = p.tag;
  };
  setPillar(els.pillarForm, els.pillarFormTag, pillars.form);
  setPillar(els.pillarStruct, els.pillarStructTag, pillars.structure);
  setPillar(els.pillarAssoc, els.pillarAssocTag, pillars.association);
  setPillar(els.pillarCreate, els.pillarCreateTag, pillars.creativity);

  // 推杆轨道 & 读数
  const strokePctNum = Math.round(state.stroke * 100);
  const ratio = clamp((state.stroke - 0.07) / (0.45 - 0.07), 0, 1);
  els.strokeThumb.style.left = `${(6 + ratio * 88).toFixed(1)}%`;
  els.strokeThumb.textContent = `↔ ${strokePctNum}%`;
  els.strokeThumb.className = `drag-thumb ${pillars.form.ok ? "is-sweet" : ""}`;
  els.strokeTrack.setAttribute("aria-valuenow", String(strokePctNum));
  els.strokeRange.value = String(strokePctNum);
  els.strokeReadout.textContent = `笔画 ${strokePctNum}% · 字怀 ${metrics.counterPct.toFixed(1)}%`;
  els.zoneSweet.textContent = `经验舒适带 ${Math.round(cfg.strokeBand[0] * 100)}%–${Math.round(cfg.strokeBand[1] * 100)}%`;

  // 滑块与按钮状态
  els.barRange.value = String(metrics.barPct);
  els.barValInline.textContent = `${metrics.barPct}%`;
  const spreadPct = Math.round(state.spread * 100);
  els.spreadRange.value = String(spreadPct);
  els.spreadValInline.textContent = `${spreadPct}%`;

  els.letterTabs.forEach((b) => {
    const on = b.dataset.letter === state.letter;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  els.infoBtns.forEach((b) => {
    const on = b.dataset.info === state.infoMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  els.btnGuides.classList.toggle("is-active", state.showGuides);
  els.btnGuides.setAttribute("aria-pressed", String(state.showGuides));
  els.btnGuides.textContent = state.showGuides ? "骨架标尺：开" : "骨架标尺：关";

  // 底部四步流程对应达标态
  const doneFlags = [pillars.form.ok, pillars.structure.ok, pillars.association.ok, pillars.creativity.ok];
  els.flowSteps.forEach((b, idx) => {
    b.classList.toggle("is-done", doneFlags[idx]);
    const active = state.focusStep === idx + 1;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });

  updateLiveMark(state.stroke);
}

let heroReveal = reducedMotion.matches ? 1 : 0;
let lastHeroSyncKey = "";

const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  const sz = resizeCanvas(heroCanvas, 2);
  heroW = sz.w;
  heroH = sz.h;
  if (still) {
    heroReveal = 1;
  } else if (heroReveal < 1) {
    heroReveal = Math.min(1, heroReveal + Math.max(dt, 0.016) * 1.45);
  }
  const eased = 1 - Math.pow(1 - heroReveal, 3);
  const res = drawHeroStage(heroCtx, heroW, heroH, state, t, eased);

  // 仅当状态/维度改变时写 DOM，保证动画循环零多余重排
  const key = `${state.letter}|${state.stroke.toFixed(3)}|${state.spread.toFixed(3)}|${state.barY.toFixed(3)}|${state.infoMode}|${state.showGuides}|${state.focusStep}|${Math.round(heroW)}`;
  if (key !== lastHeroSyncKey) {
    lastHeroSyncKey = key;
    syncHeroUI(res);
  }
});

function commitHero() {
  lastHeroSyncKey = "";
  heroLoop.draw();
}

// =========================================================================
// 2. 底沿推杆（data-perf-drag）鼠标 + 触控 + 键盘拖拽
// =========================================================================
function setStrokeFromClientX(clientX) {
  const rect = els.strokeTrack.getBoundingClientRect();
  if (rect.width < 10) return;
  const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
  const raw = 0.07 + ratio * (0.45 - 0.07);
  const cfg = LETTERS[state.letter];
  state.stroke = softSnap(raw, cfg.strokeIdeal, 0.008);
  commitHero();
}

let trackDragging = false;
els.strokeTrack.addEventListener("pointerdown", (e) => {
  trackDragging = true;
  if (els.strokeTrack.setPointerCapture) {
    try { els.strokeTrack.setPointerCapture(e.pointerId); } catch {}
  }
  setStrokeFromClientX(e.clientX);
});
els.strokeTrack.addEventListener("pointermove", (e) => {
  if (!trackDragging) return;
  setStrokeFromClientX(e.clientX);
});
const endTrackDrag = () => { trackDragging = false; };
els.strokeTrack.addEventListener("pointerup", endTrackDrag);
els.strokeTrack.addEventListener("pointercancel", endTrackDrag);

// 兼容原生 touch 事件（确保 perf.mjs 的 CDP touchStart/touchMove 100% 驱动重绘）
els.strokeTrack.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  trackDragging = true;
  setStrokeFromClientX(e.touches[0].clientX);
}, { passive: true });
els.strokeTrack.addEventListener("touchmove", (e) => {
  if (!trackDragging || !e.touches.length) return;
  setStrokeFromClientX(e.touches[0].clientX);
}, { passive: true });
els.strokeTrack.addEventListener("touchend", endTrackDrag, { passive: true });

els.strokeTrack.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.03 : 0.01;
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    state.stroke = clamp(state.stroke - step, 0.07, 0.45);
    commitHero();
  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    state.stroke = clamp(state.stroke + step, 0.07, 0.45);
    commitHero();
  }
});

// =========================================================================
// 3. 画布内直拖横梁手柄 / 右足手柄 + 点击硬压错框一键改落位
// =========================================================================
let canvasDragMode = null; // "bar" | "foot" | null

function getCanvasNorm(e) {
  const r = heroCanvas.getBoundingClientRect();
  return {
    u: clamp((e.clientX - r.left) / Math.max(1, r.width), 0, 1),
    v: clamp((e.clientY - r.top) / Math.max(1, r.height), 0, 1),
    r,
  };
}

heroCanvas.addEventListener("pointerdown", (e) => {
  if (!lastEval) return;
  const { u, v } = getCanvasNorm(e);
  const { geom } = lastEval;
  const dBar = Math.hypot(u - geom.handleBar.x, v - geom.handleBar.y);
  const dFoot = Math.hypot(u - geom.handleFoot.x, v - geom.handleFoot.y);

  if (dBar < 0.095) {
    canvasDragMode = "bar";
    heroCanvas.classList.add("is-dragging");
    try { heroCanvas.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
  } else if (dFoot < 0.11) {
    canvasDragMode = "foot";
    heroCanvas.classList.add("is-dragging");
    try { heroCanvas.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
  } else if (state.infoMode === "flat" && u > 0.22 && u < 0.80 && v > 0.40 && v < 0.72) {
    // 直接点击画布上居中硬压的错框，把它改回依骨架落位
    state.infoMode = "skeleton";
    commitHero();
  }
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!canvasDragMode || !lastEval) return;
  const { u, v } = getCanvasNorm(e);
  const { cfg, geom } = lastEval;
  if (canvasDragMode === "bar") {
    const raw = clamp((v - geom.topY) / geom.H, 0.22, 0.82);
    state.barY = softSnap(raw, cfg.barIdeal, 0.015);
    commitHero();
  } else if (canvasDragMode === "foot") {
    const raw = clamp(Math.abs(u - geom.cx), 0.17, 0.46);
    state.spread = softSnap(raw, cfg.spreadIdeal, 0.01);
    commitHero();
  }
});

const stopCanvasDrag = () => {
  canvasDragMode = null;
  heroCanvas.classList.remove("is-dragging");
};
heroCanvas.addEventListener("pointerup", stopCanvasDrag);
heroCanvas.addEventListener("pointercancel", stopCanvasDrag);

// 按钮与原生滑块事件
els.letterTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    state = createInitialState(btn.dataset.letter);
    commitHero();
  });
});

els.infoBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.infoMode = btn.dataset.info;
    commitHero();
  });
});

els.barRange.addEventListener("input", () => {
  const cfg = LETTERS[state.letter];
  state.barY = softSnap(Number(els.barRange.value) / 100, cfg.barIdeal, 0.012);
  commitHero();
});

els.spreadRange.addEventListener("input", () => {
  const cfg = LETTERS[state.letter];
  state.spread = softSnap(Number(els.spreadRange.value) / 100, cfg.spreadIdeal, 0.008);
  commitHero();
});

els.btnGuides.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  commitHero();
});

els.btnReset.addEventListener("click", () => {
  state = createInitialState(state.letter);
  commitHero();
});

els.flowSteps.forEach((btn) => {
  btn.addEventListener("click", () => {
    const step = Number(btn.dataset.step);
    state.focusStep = state.focusStep === step ? 0 : step;
    commitHero();
  });
});

// =========================================================================
// 4. 01 节：四部位解剖探照板
// =========================================================================
const ANATOMY_DATA = {
  flow: {
    kicker: "01 · 倾斜引导 · DIRECTIONAL FLOW",
    heading: "两道斜边自带方向，视线自然往顶角聚拢",
    body: "比起完全竖直的方框，A、V、X、Z 的斜线会主动给眼睛指路。把主视觉焦点或青柠色点缀放在斜边收敛的顶角附近，观众顺着笔画一抬头就能看到主题，不需要额外画满地箭头。",
    action: "副标题或短说明可以沿着外斜边退让对齐，千万别横劈斜边把动势砍断。",
  },
  space: {
    kicker: "02 · 留白空间 · BREATHING SPACE",
    heading: "字怀负形是最现成的呼吸窗，宁空勿塞",
    body: "字体学里把字母内部围出的空白叫「字怀（Counter）」。它是大脑辨认字母的关键特征：把字怀留白保住（经验参考 11%–29%），整张海报既醒目又不闷；一旦塞满密字或把笔画拉得太肥，字母会瞬间糊成一块紫砖。",
    action: "只在字怀中心放极短的 2–4 字点题标，或干脆彻底留空让它透底。",
  },
  bridge: {
    kicker: "03 · 横向连接 · HORIZONTAL CONNECTION",
    heading: "横梁是天然水平货架，把左右斜柱拉成一体",
    body: "字母 A、H、E、F 的横梁同时干两件事：结构上拉紧两侧支柱防散架，版面上提供一条极稳的水平基准线。把展期、副标题放进横梁带里，文字和字母就不再是两层贴纸，而是一块长在一起的构件。",
    action: "对于 A，横梁落在字高 54%–70% 的中下腰最稳；拉得太高会压死上部字怀。",
  },
  base: {
    kicker: "04 · 稳定支撑 · STABLE BASE",
    heading: "宽稳双足兜住重心，顺带托住底部信息",
    body: "原海报特地给 A 的两只脚铺上斜绿条纹与圆点阵，并在两脚之间拉出水平支撑线——这是在告诉眼睛「整座画面稳稳站在地面上」。两足之间的下拱空区，刚好适合安放场馆地址、主办方或落款。",
    action: "保持底座比顶冠明显宽展，避免针脚过窄显得整张海报摇摇欲坠。",
  },
};

$$(".anat-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const part = btn.dataset.part;
    $$(".anat-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    $$(".anat-layer").forEach((g) => {
      g.classList.toggle("is-on", g.dataset.layer === part);
    });
    const d = ANATOMY_DATA[part];
    $("#anatKicker").textContent = d.kicker;
    $("#anatHeading").textContent = d.heading;
    $("#anatBody").textContent = d.body;
    $("#anatAction").textContent = d.action;
  });
});

// =========================================================================
// 5. 02 节：8 枚字母骨架谱系试衣台
// =========================================================================
const SPECIMENS = {
  A: {
    title: "A · 上尖下宽的金字塔架构",
    tag: "三角稳定类 · 容错率高",
    desc: "上收下放天生稳重：内部倒三角字怀适合留白透气，中横梁天然承托展期或副标，两只宽脚之间刚好坐落场馆与辅助小字。",
    s1: "顶角交汇处或斜边外侧",
    s2: "中横梁正中 + 底足之间",
    s3: "笔画过粗把三角字怀堵成实心块，或横梁抬得过高",
    svg: `<svg viewBox="0 0 220 220" width="220" height="220"><rect width="220" height="220" fill="#EFECF2"/><circle cx="152" cy="40" r="18" fill="#B6CA3F"/><path d="M92 34 H128 L184 190 H148 L136 154 H84 L72 190 H36 Z M110 74 L92 126 H128 Z" fill="#9E8BD2" fill-rule="evenodd"/><line x1="58" y1="138" x2="162" y2="138" stroke="#B6CA3F" stroke-width="2" stroke-dasharray="4 3"/></svg>`,
  },
  O: {
    title: "O · 全封闭圆环取景窗",
    tag: "封闭视窗类 · 聚焦极强",
    desc: "四周环抱把视线牢牢锁在圆心。适合把核心摄影或短标题安在中央字怀里，外圈紫环本身成为天然画框，但圆外四角容易显得空旷，需要角标平衡。",
    s1: "圆环正中封闭字怀",
    s2: "外环切线四角或底部水平基线",
    s3: "把大段多行文字强塞进圆洞，导致每行长短参差难读",
    svg: `<svg viewBox="0 0 220 220" width="220" height="220"><rect width="220" height="220" fill="#EFECF2"/><circle cx="110" cy="110" r="78" fill="#9E8BD2"/><circle cx="110" cy="110" r="44" fill="#EFECF2" stroke="#B6CA3F" stroke-width="2.5" stroke-dasharray="5 4"/><circle cx="110" cy="110" r="14" fill="#B6CA3F"/></svg>`,
  },
  H: {
    title: "H · 双柱连桥对称建筑",
    tag: "轴线分栏类 · 秩序工整",
    desc: "左右两根垂直承重柱天然切出对称边界，中桥把上下两块开放空域一分为二：上方放主标或主图，下方排日期明细，极像古典门廊。",
    s1: "中桥正中与上下双门洞",
    s2: "左柱外侧对齐或横桥水平带",
    s3: "两柱拉得太远失去字母整体感，看起来像两根孤立竖条",
    svg: `<svg viewBox="0 0 220 220" width="220" height="220"><rect width="220" height="220" fill="#EFECF2"/><rect x="44" y="30" width="32" height="160" fill="#9E8BD2"/><rect x="144" y="30" width="32" height="160" fill="#9E8BD2"/><rect x="44" y="96" width="132" height="28" fill="#775EB6"/><rect x="82" y="36" width="56" height="54" fill="none" stroke="#B6CA3F" stroke-width="2" stroke-dasharray="4 3"/><rect x="82" y="130" width="56" height="54" fill="none" stroke="#B6CA3F" stroke-width="2" stroke-dasharray="4 3"/></svg>`,
  },
  S: {
    title: "S · 双弧回旋流动脊梁",
    tag: "斜向动势类 · 节奏鲜明",
    desc: "由上向右、经中腰斜折、再向左下甩出，自带蛇形视线动线。适合音乐、舞蹈、流体或路线叙事海报，上下两个半开放凹湾刚好一左一右承托文字块。",
    s1: "中腰斜折脊与双湾弧心",
    s2: "左上凹湾配主标，右下凹湾配展期",
    s3: "笔画粗细过渡失衡导致头重脚轻，或信息块盖死中腰转折",
    svg: `<svg viewBox="0 0 220 220" width="220" height="220"><rect width="220" height="220" fill="#EFECF2"/><path d="M168 38 H56 V108 H168 V184 H52" fill="none" stroke="#9E8BD2" stroke-width="30" stroke-linecap="square"/><circle cx="152" cy="74" r="14" fill="#B6CA3F"/><circle cx="68" cy="146" r="14" fill="#B6CA3F"/></svg>`,
  },
  T: {
    title: "T · 顶梁压顶加中轴分屏",
    tag: "轴线分栏类 · 对比利落",
    desc: "顶部宽横梁天然充当通栏刊头，下方一根粗竖轴顺手把页面分成左右双栏——左侧放说明，右侧放配图，是报刊特辑与展览导览的省力骨架。",
    s1: "顶梁与中轴交汇的 T 字枢纽",
    s2: "竖轴左右两侧对称留白栏",
    s3: "顶梁放得太重太低，把下方左右两栏压得喘不过气",
    svg: `<svg viewBox="0 0 220 220" width="220" height="220"><rect width="220" height="220" fill="#EFECF2"/><rect x="34" y="34" width="152" height="32" fill="#9E8BD2"/><rect x="94" y="34" width="32" height="156" fill="#9E8BD2"/><rect x="38" y="76" width="48" height="106" fill="none" stroke="#B6CA3F" stroke-width="2" stroke-dasharray="4 3"/><rect x="134" y="76" width="48" height="106" fill="none" stroke="#B6CA3F" stroke-width="2" stroke-dasharray="4 3"/></svg>`,
  },
  X: {
    title: "X · 中心强交叉四象限",
    tag: "斜向动势类 · 跨界联名首选",
    desc: "两条斜线直撞画面中心，把版面劈成上下左右四个三角区：非常适合「联名合作」「十周年」「双主题对抗」，四块信息各占一个象限互不干扰。",
    s1: "正中斜线交叉枢纽",
    s2: "上下左右四处开放三角区",
    s3: "交叉点堆满小字造成视觉拥堵，反而丢掉四射张力",
    svg: `<svg viewBox="0 0 220 220" width="220" height="220"><rect width="220" height="220" fill="#EFECF2"/><line x1="46" y1="36" x2="174" y2="184" stroke="#9E8BD2" stroke-width="30"/><line x1="174" y1="36" x2="46" y2="184" stroke="#9E8BD2" stroke-width="30"/><circle cx="110" cy="110" r="15" fill="#B6CA3F"/></svg>`,
  },
  M: {
    title: "M · 双峰三柱宽幅舞台",
    tag: "三角稳定类 · 适合宽屏",
    desc: "左右双外柱加中央倒尖，构成极稳的三点支撑。中央上方的倒三角谷地可以托起主标或徽章，底部双尖洞口留出节奏呼吸，适合宽画幅横版海报。",
    s1: "中央倒 V 谷地与双顶峰",
    s2: "横跨底部的水平基线与上谷区",
    s3: "在窄竖屏里硬塞宽 M，容易把两腿挤成密密麻麻的竖栅栏",
    svg: `<svg viewBox="0 0 220 220" width="220" height="220"><rect width="220" height="220" fill="#EFECF2"/><path d="M36 186 V36 H66 L110 116 L154 36 H184 V186 H156 V92 L118 158 H102 L64 92 V186 Z" fill="#9E8BD2"/><circle cx="110" cy="54" r="14" fill="#B6CA3F"/></svg>`,
  },
  Z: {
    title: "Z · 强对角视线扫读阶梯",
    tag: "斜向动势类 · 读序明确",
    desc: "天然契合人眼「左上→右上→斜穿左下→右下」的扫描路径：顶横放开篇标题，斜梁推着视线滑到底横的行动号召或日期，读完一整张海报不走回头路。",
    s1: "左上起点与右下终点锚点",
    s2: "顶横与底横两条水平承托条",
    s3: "把两块主图挤在斜梁两侧却不对齐倾角，画面会显得歪斜失衡",
    svg: `<svg viewBox="0 0 220 220" width="220" height="220"><rect width="220" height="220" fill="#EFECF2"/><path d="M40 42 H180 V68 L78 152 H180 V180 H40 V154 L142 70 H40 Z" fill="#9E8BD2"/><line x1="158" y1="74" x2="62" y2="148" stroke="#B6CA3F" stroke-width="2.5" stroke-dasharray="5 3"/></svg>`,
  },
};

function renderSpecimen(key) {
  const s = SPECIMENS[key];
  $("#specPreview").innerHTML = s.svg;
  $("#specTitle").textContent = s.title;
  $("#specTag").textContent = s.tag;
  $("#specDesc").textContent = s.desc;
  $("#specSlot1").textContent = s.s1;
  $("#specSlot2").textContent = s.s2;
  $("#specSlot3").textContent = s.s3;
  $$(".spec-card").forEach((b) => {
    const on = b.dataset.spec === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}
$$(".spec-card").forEach((b) => b.addEventListener("click", () => renderSpecimen(b.dataset.spec)));
renderSpecimen("A");

// =========================================================================
// 6. 03 节：深紫建筑暗房四式图文嵌合
// =========================================================================
const darkCanvas = $("#darkroomCanvas");
const darkCtx = darkCanvas.getContext("2d");
let darkMode = "mask";
let darkBlend = 0.56;

const DARK_NOTES = {
  mask: (b) => b < 0.28
    ? { warn: true, text: "融合度偏低：笔画里的画面灰淡看不清细节，只剩一块暗灰字母。" }
    : b > 0.76
      ? { warn: true, text: "溢出越界：背景图形透出轮廓之外，字母 A 的清晰边缘立刻被冲散。" }
      : { warn: false, text: "清晰嵌合带：粗笔画干净框住山海日轮，既保留完整字形，又赋予图形内容。" },
  window: (b) => b < 0.25
    ? { warn: true, text: "窗内偏暗：字怀窗洞里画面几乎隐形，只剩一块空洞的黑三角。" }
    : { warn: false, text: "字怀作窗成立：纯色紫字母稳守轮廓，核心日轮与斜坡刚好聚焦在三角负形窗洞内。" },
  weave: (b) => b > 0.80
    ? { warn: true, text: "穿插失衡：前景横带推得过偏，压住了右侧主视觉并破坏左右平衡。" }
    : { warn: false, text: "前后景咬合：青柠光带压过左腿背面、穿出右腿前面，扁平字母立刻长出空间纵深。" },
  shelf: (b) => b < 0.22
    ? { warn: true, text: "骨架过淡：紫色字母快退成透明水印，横梁上的亮字悬空失去依托。" }
    : { warn: false, text: "横梁托文成立：字母本身当结构货架，横梁承托水平副标，双足稳稳兜住底部展讯。" },
};

function syncDarkText() {
  $("#darkBlendVal").textContent = `${Math.round(darkBlend * 100)}%`;
  const note = DARK_NOTES[darkMode](darkBlend);
  const el = $("#darkDiag");
  el.textContent = note.text;
  el.classList.toggle("is-warn", note.warn);
}

const darkLoop = loop(darkCanvas, (t) => {
  const { w, h } = resizeCanvas(darkCanvas, 2);
  drawDarkroomCanvas(darkCtx, w, h, darkMode, darkBlend, t);
});

$$(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    darkMode = btn.dataset.dmode;
    $$(".mode-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    syncDarkText();
    darkLoop.draw();
  });
});

$("#darkBlend").addEventListener("input", (e) => {
  darkBlend = Number(e.target.value) / 100;
  syncDarkText();
  darkLoop.draw();
});
syncDarkText();

// =========================================================================
// 7. 04 节：五百年字母建筑史标本卡
// =========================================================================
const HISTORY = {
  1529: {
    meta: "1529 · 巴黎 · 法国国家图书馆 Gallica 藏本",
    title: "杰弗里·托里《花田》（Champ fleury）",
    body: "法国人文主义印刷家杰弗里·托里在巴黎出版《花田》，把罗马大写字母放进 10×10 的方形比例网格中，并对照人体比例逐笔拆解几何骨架，甚至画出了圆规组成的 A 与泥瓦刀组成的 Z，把字母明确视作可测量的建筑结构。",
    take: "给今天留下的规矩：字母不是随手画的装饰曲线，先定几何比例骨架，再谈视觉创意。",
    svg: `<svg viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#F2F5E6"/><g stroke="#B7A8DF" stroke-width="1">${Array.from({ length: 9 }, (_, i) => `<line x1="${20 + i * 20}" y1="20" x2="${20 + i * 20}" y2="180"/><line x1="20" y1="${20 + i * 20}" x2="180" y2="${20 + i * 20}"/>`).join("")}</g><rect x="20" y="20" width="160" height="160" fill="none" stroke="#4E3D82" stroke-width="1.5"/><circle cx="100" cy="100" r="78" fill="none" stroke="#B6CA3F" stroke-width="1.6" stroke-dasharray="4 3"/><path d="M90 28 H110 L164 172 H140 L127 134 H73 L60 172 H36 Z M100 58 L81 114 H119 Z" fill="#4E3D82" fill-rule="evenodd"/></svg>`,
  },
  1918: {
    meta: "1918 · 巴黎 Mercure de France · 公有领域档案",
    title: "纪尧姆·阿波利奈尔《图画诗集》（Calligrammes）",
    body: "法国诗人阿波利奈尔在 1918 年出版诗集《图画诗集》，把诗句直接排成雨滴、喷泉、领带与白鸽的轮廓。它打破了「文字只能横竖成行、插图另放一旁」的分家习惯，让读者在读字的同时直接看到图形。",
    take: "给今天留下的规矩：形态和语义同时到达眼睛时，信息不需要二次翻译就能记住。",
    svg: `<svg viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#F2F5E6"/><path d="M100 28 L168 168 H32 Z" fill="none" stroke="#B6CA3F" stroke-width="1.8" stroke-dasharray="4 3"/><g fill="#111015" font-size="9.5" font-weight="700" text-anchor="middle"><text x="100" y="54">FORM</text><text x="100" y="76">WORD · LINE</text><text x="100" y="98">SHAPE · RHYTHM</text><text x="100" y="120">LETTER AS STRUCTURE</text><text x="100" y="142">READ &amp; SEE TOGETHER</text><text x="100" y="162">CALLIGRAMMES · 1918</text></g></svg>`,
  },
  1923: {
    meta: "1923 · 柏林 · MoMA 藏品 280.2001.1–25",
    title: "埃尔·利西茨基《为了声音》（Dlia golosa）",
    body: "俄国构成主义设计师利西茨基为诗人马雅可夫斯基设计朗诵诗集，用纯红黑活字与几何块直接搭出每一页的视觉建筑，并在书口切出带大号字母与符号的阶梯式拇指索引，让字符同时承担造型与导览功能。",
    take: "给今天留下的规矩：巨型字母不只好看，更能充当读者的导航路标与信息分区。",
    svg: `<svg viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#F2F5E6"/><rect x="26" y="26" width="122" height="148" fill="#FFFFFF" stroke="#111015" stroke-width="1.5"/><rect x="148" y="26" width="26" height="36" fill="#B82946"/><rect x="148" y="64" width="26" height="36" fill="#111015"/><rect x="148" y="102" width="26" height="36" fill="#4E3D82"/><rect x="40" y="44" width="84" height="18" fill="#111015"/><circle cx="72" cy="116" r="28" fill="#B82946"/><rect x="86" y="104" width="48" height="44" fill="#111015"/></svg>`,
  },
  1965: {
    meta: "1959 海报 MoMA 380.1963 · 1965 瑞士 Arthur Niggli 出版",
    title: "阿明·霍夫曼《平面设计手册》（Graphic Design Manual）",
    body: "瑞士巴塞尔设计学院导师阿明·霍夫曼把平面基础拆成「点、线、对抗、字母与符号」四步。在 1959 年《吉赛尔》海报和 1965 年手册里，他反复证明大号字母的骨架、字怀负形与摄影对抗，就能撑起整张海报张力。",
    take: "给今天留下的规矩：把字母当成正负形零件来调比例和对比，是最耐看的现代主义方法。",
    svg: `<svg viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#1E1636"/><circle cx="62" cy="118" r="44" fill="#9E8BD2"/><rect x="116" y="26" width="58" height="148" fill="#EFECF2"/><text x="145" y="156" fill="#111015" font-size="64" font-weight="900" text-anchor="middle">G</text><circle cx="145" cy="48" r="9" fill="#B6CA3F"/></svg>`,
  },
  1968: {
    meta: "1968 · 阿姆斯特丹市立博物馆 · MoMA 藏品 1285.1968",
    title: "维姆·克劳威尔《造型师》（Vorm Gevers）海报",
    body: "荷兰网格大师维姆·克劳威尔为市立博物馆工业设计展创作的《Vorm Gevers》海报，将巨型模块化字母严丝合缝地编进整张海报的网格立面里，彻底消除「底图」与「字层」的边界。",
    take: "给今天留下的规矩：当字母轮廓贴合页面网格时，整张海报会呈现出极强的建筑秩序感。",
    svg: `<svg viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#F2F5E6"/><g fill="none" stroke="#B7A8DF" stroke-width="1"><rect x="24" y="24" width="152" height="152"/><line x1="62" y1="24" x2="62" y2="176"/><line x1="100" y1="24" x2="100" y2="176"/><line x1="138" y1="24" x2="138" y2="176"/><line x1="24" y1="62" x2="176" y2="62"/><line x1="24" y1="100" x2="176" y2="100"/><line x1="24" y1="138" x2="176" y2="138"/></g><path d="M24 24 H62 V138 H100 V24 H138 V176 H24 Z" fill="#9E8BD2" opacity="0.9"/><rect x="138" y="138" width="38" height="38" fill="#B6CA3F"/></svg>`,
  },
};

function renderHistory(yr) {
  const h = HISTORY[yr];
  $("#historyFig").innerHTML = h.svg;
  $("#histMeta").textContent = h.meta;
  $("#histTitle").textContent = h.title;
  $("#histBody").textContent = h.body;
  $("#histTake").textContent = h.take;
  $$(".yr-btn").forEach((b) => {
    const on = b.dataset.yr === String(yr);
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}
$$(".yr-btn").forEach((b) => b.addEventListener("click", () => renderHistory(b.dataset.yr)));
renderHistory(1529);

// =========================================================================
// 8. 05 节：3 秒甲方需求契合度快测器
// =========================================================================
const BRIEFS = {
  arch: {
    fit: true,
    verdict: "适合 · 强首字母锚点",
    reason: "「Architecture」首字母 A 同时自带建筑三角坡顶的意象，文案只有展名、时间与场馆四组信息，正好用 A 的斜边、字怀与横梁一气呵成。",
  },
  report: {
    fit: false,
    verdict: "不适合 · 请换回常规网格或文字主导",
    reason: "季度财报包含大量多列数据与长段落说明，硬塞进巨型字母的斜边或字怀里会把行宽撕碎、严重拖慢核对速度；建议改用 141 文字主导版式或常规表格版式。",
  },
  anniv: {
    fit: true,
    verdict: "适合 · X 天然契合十周年跨界主题",
    reason: "罗马数字 X 既是字母又是「10」，四条斜边天然分出四个象限，正好分别安放刊名、期号、十周年回顾亮点与条码，远看一眼锁定。",
  },
  shop: {
    fit: false,
    verdict: "不适合 · 请改用多面板或图片窗口版式",
    reason: "八款新品需要同等清晰地展示外观和价格标签，塞进单字母轮廓会导致商品被裁切变形、价格无处安放；改用 145 多面板版式或 143 图片窗口版式更稳妥。",
  },
};

$$(".brief-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const d = BRIEFS[btn.dataset.brief];
    $$(".brief-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    const box = $("#briefResult");
    box.className = `brief-result ${d.fit ? "is-fit" : "is-avoid"}`;
    $("#briefVerdict").textContent = d.verdict;
    $("#briefReason").textContent = d.reason;
  });
});

// =========================================================================
// 9. 06 节：四选一结构小练习（只差单一变量）
// =========================================================================
const QUIZ_FEEDBACK = {
  A: {
    ok: false,
    title: "再看看字怀——方案 A 的笔画太肥，把中间三角几乎堵死了",
    body: "方案 A 把笔画加粗到极值，内部留白缩成一道针缝，远看几乎退化成一只紫色实心三角形，丢掉了字母「A」最关键的透气识别特征。",
  },
  B: {
    ok: false,
    title: "重心飘了——方案 B 把横梁抬得太高",
    body: "方案 B 的中横梁顶到了上部三分之一处，既压扁了顶部的字怀呼吸空间，又让下半截留出大片空悬，整体头重脚轻、承托失稳。",
  },
  C: {
    ok: true,
    title: "选对了！方案 C 守住了字母骨架的全部四个支点",
    body: "方案 C 笔画粗细适中，留出透亮的倒三角字怀；横梁稳落中下腰承托展期；两只宽足托住底部的场馆信息；青柠圆轻咬顶角收束视线——形态和文案真正合成了同一座骨架。",
  },
  D: {
    ok: false,
    title: "字母白做了——方案 D 用居中白框硬压截断了骨架",
    body: "方案 D 无视 A 的斜边、字怀与横梁，直接贴了一块矩形通栏白框横劈腰腹，把好不容易立起来的字母造型打回成了廉价背景底纹。",
  },
};

$$(".quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    const opt = card.dataset.opt;
    const res = QUIZ_FEEDBACK[opt];
    $$(".quiz-card").forEach((c) => {
      c.classList.remove("is-picked-ok", "is-picked-err");
      c.setAttribute("aria-pressed", String(c === card));
    });
    card.classList.add(res.ok ? "is-picked-ok" : "is-picked-err");
    const fb = $("#quizFeedback");
    fb.className = `quiz-feedback ${res.ok ? "is-ok" : "is-err"}`;
    fb.innerHTML = `<h3>${res.title}</h3><p>${res.body}</p>`;
  });
});

// =========================================================================
// 10. 07 节：原海报高清灯箱（放大、鼠标/触控拖拽、Esc 关）
// =========================================================================
const lb = $("#lightbox");
const lbImg = $("#lbImg");
const lbViewport = $("#lbViewport");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
}
function openLightbox() {
  lbImg.src = $("#poster").src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lb.hidden = false;
  $("#lbClose").focus();
}
function closeLightbox() {
  lb.hidden = true;
  $("#posterOpen").focus();
}

$("#posterOpen").addEventListener("click", openLightbox);
$("#lbClose").addEventListener("click", closeLightbox);
$("#lbZoomIn").addEventListener("click", () => { lbScale = clamp(lbScale + 0.4, 1, 3.2); applyLbTransform(); });
$("#lbZoomOut").addEventListener("click", () => {
  lbScale = clamp(lbScale - 0.4, 1, 3.2);
  if (lbScale <= 1.01) { lbX = 0; lbY = 0; }
  applyLbTransform();
});
$("#lbZoomReset").addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLbTransform(); });

lbViewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.25 : -0.25), 1, 3.2);
  if (lbScale <= 1.01) { lbX = 0; lbY = 0; }
  applyLbTransform();
}, { passive: false });

lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target === lbViewport && lbScale <= 1.01) { closeLightbox(); return; }
  lbDrag = { x0: e.clientX - lbX, y0: e.clientY - lbY };
  lbViewport.classList.add("is-dragging");
  try { lbViewport.setPointerCapture(e.pointerId); } catch {}
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbDrag.x0;
  lbY = e.clientY - lbDrag.y0;
  applyLbTransform();
});
const endLbDrag = () => { lbDrag = null; lbViewport.classList.remove("is-dragging"); };
lbViewport.addEventListener("pointerup", endLbDrag);
lbViewport.addEventListener("pointercancel", endLbDrag);

document.addEventListener("keydown", (e) => {
  if (!lb.hidden && e.key === "Escape") closeLightbox();
});

// 初始静态绘制一帧，确保首屏与 reducedMotion 首帧即饱满清晰
heroLoop.draw();
darkLoop.draw();

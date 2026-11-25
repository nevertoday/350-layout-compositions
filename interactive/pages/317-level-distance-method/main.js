// 317 平远法 · 全页交互驱动
import { loop, reducedMotion } from "../../lib/stage.js";
import {
  BAR_WIDTHS,
  VISION_MODES,
  HISTORY_WORKS,
  TONE_LAWS,
  AVOID_CASES,
  QUIZ_OPTIONS,
  clamp,
  createBrokenState,
  createPosterSolvedState,
  createAlternateSolvedState,
  evaluateHero,
} from "./model.js";
import {
  createHeroRenderer,
  drawVisionCanvas,
  drawHistoryCanvas,
  drawDepthDiorama,
} from "./stage.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ==================== 1. 开场主角玩具：平远手卷展平与横带排布台 ====================
const heroState = createBrokenState("poster");
const heroCanvas = $("#hero-canvas");
const unrollTrack = $("#unroll-track");
const heroRenderer = createHeroRenderer(heroCanvas);

const anim = {
  intro: reducedMotion.matches ? 1 : 0,
  t: 0,
  hover: null,
  dragging: null,
};

let lastEval = null;
const domCache = new Map();
const setText = (el, val) => {
  if (domCache.get(el) === val) return;
  domCache.set(el, val);
  el.textContent = val;
};
const setAttr = (el, attr, val) => {
  const k = `${el.id}:${attr}`;
  if (domCache.get(k) === val) return;
  domCache.set(k, val);
  el.setAttribute(attr, val);
};

const elDemoTitle = $("#demo-title");
const elDemoRule = $("#demo-rule");
const elTopScore = $("#top-score");
const elUnrollFill = $("#unroll-fill");
const elUnrollThumb = $("#unroll-thumb");
const elThumbVal = $("#thumb-val");
const elUnrollReadout = $("#unroll-readout");
const elStBreadth = $("#st-breadth");
const elStHorizon = $("#st-horizon");
const elStCalm = $("#st-calm");
const elStTone = $("#st-tone");
const elInpHorizon = $("#inp-horizon");
const elValHorizon = $("#val-horizon");
const elInpHaze = $("#inp-haze");
const elValHaze = $("#val-haze");
const elDiagCard = $("#diag-card");
const elDiagBadge = $("#diag-badge");
const elDiagHeadline = $("#diag-headline");
const elDiagWhy = $("#diag-why");
const elDiagHint = $("#diag-hint");
const elMAspect = $("#m-aspect");
const elMTilt = $("#m-tilt");
const elMSpan = $("#m-span");
const elMDelta = $("#m-delta");

function syncHeroUI(ev) {
  lastEval = ev;

  // 活体示范大标：量化步长避免拖拽每帧触发整段重排，倾角走合成层 transform
  const qStep = Math.round(clamp(((ev.rect.aspect - 0.65) / 2.0) * 8, 0, 8));
  const spreadEm = `${(0.01 + qStep * 0.028).toFixed(3)}em`;
  if (domCache.get("track") !== spreadEm) {
    domCache.set("track", spreadEm);
    elDemoTitle.style.letterSpacing = spreadEm;
  }
  const tiltTf = `rotate(${heroState.tiltDeg.toFixed(1)}deg)`;
  if (domCache.get("tilt") !== tiltTf) {
    domCache.set("tilt", tiltTf);
    elDemoRule.style.transform = tiltTf;
  }
  elDemoRule.classList.toggle("is-err", !ev.pillars.horizon.ok);

  // 顶眉分数章
  setText(elTopScore, ev.allPassed ? "4 / 4 冲融平远" : `${ev.passedCount} / 4 待展卷`);
  elTopScore.classList.toggle("is-ok", ev.allPassed);
  elTopScore.classList.toggle("is-err", !ev.allPassed);

  // 展平轴尺同步（全走纯 transform，拖拽零布局重排）
  const uOpen = clamp((heroState.openRatio - 0.22) / (1 - 0.22), 0, 1);
  const ratioStr = `${ev.rect.aspect.toFixed(2)}:1`;
  elUnrollFill.style.transform = `scaleX(${uOpen.toFixed(4)})`;
  const travel = Math.max(0, (trackRect ? trackRect.width : unrollTrack.clientWidth) - 86);
  elUnrollThumb.style.transform = `translate3d(${(uOpen * travel).toFixed(1)}px,0,0)`;
  elUnrollThumb.classList.toggle("is-err", ev.rect.aspect < 1.55);
  setText(elThumbVal, ratioStr);
  setText(elUnrollReadout, `宽比 ${ratioStr} · ${ev.rect.aspect < 1.55 ? "窄幅偏紧" : "平阔展开"}`);
  setAttr(unrollTrack, "aria-valuenow", String(Math.round(heroState.openRatio * 100)));
  setAttr(unrollTrack, "aria-valuetext", `${ratioStr} ${ev.rect.aspect < 1.55 ? "窄幅" : "平阔"}`);

  // 三栏原则状态灯
  const setPill = (el, ok, text) => {
    setText(el, text);
    el.classList.toggle("is-ok", ok);
    el.classList.toggle("is-err", !ok);
  };
  setPill(elStBreadth, ev.pillars.breadth.ok, ev.pillars.breadth.status);
  setPill(elStHorizon, ev.pillars.horizon.ok, ev.pillars.horizon.status);
  setPill(elStCalm, ev.pillars.calm.ok, ev.pillars.calm.status);
  setText(elStTone, ev.pillars.tone.status);

  // 控参滑杆数值同步
  const hPct = Math.round(heroState.horizonY * 100);
  if (elInpHorizon.value !== String(hPct)) elInpHorizon.value = String(hPct);
  setText(elValHorizon, `${hPct}%`);

  const hz = Math.round(heroState.haze);
  if (elInpHaze.value !== String(hz)) elInpHaze.value = String(hz);
  const hzTag = hz < 36 ? "焦黑" : hz > 84 ? "白茫" : "冲融";
  setText(elValHaze, `${hz}% · ${hzTag}`);

  // 右下折角白话诊单
  elDiagCard.classList.toggle("is-ok", ev.allPassed);
  elDiagCard.classList.toggle("is-err", !ev.allPassed);
  setText(elDiagBadge, ev.allPassed ? `4 / 4 · ${ev.variant}` : ev.badge);
  setText(elDiagHeadline, ev.headline);
  setText(elDiagWhy, ev.why);
  setText(elDiagHint, ev.hint);

  setText(elMAspect, ratioStr);
  setText(elMTilt, heroState.tiltDeg === 0 ? "0.0°" : `${heroState.tiltDeg > 0 ? "+" : ""}${heroState.tiltDeg.toFixed(1)}°`);
  setText(elMSpan, `${Math.round(ev.bars.span * 100)}%`);
  setText(elMDelta, `ΔL ${ev.atmo.nearFarDelta}`);
}

let heroLoop = null;
let heroDirty = true;

function renderHeroFrame(t, dt, { still }) {
  if (still) {
    anim.intro = 1;
  } else if (anim.intro < 1) {
    anim.intro = Math.min(1, anim.intro + dt * 1.9);
    heroDirty = true;
  }
  anim.t = still ? 0 : t;
  const ev = evaluateHero(heroState, heroCanvas.clientWidth || 1280, heroCanvas.clientHeight || 320);
  if (heroDirty || !lastEval || Math.abs(ev.rect.aspect - lastEval.rect.aspect) > 0.005) {
    syncHeroUI(ev);
    heroDirty = false;
  }
  heroRenderer.draw(heroState, ev, anim);
}

heroLoop = loop(heroCanvas, renderHeroFrame);

// 拖拽期间传 immediate=false 合并到下一帧 rAF 单次重绘，杜绝同帧重复光栅化；点击/按键则即时同步
function touchHero(immediate = true) {
  heroDirty = true;
  if (immediate || reducedMotion.matches) heroLoop.draw();
}

// 展平轴尺拖动（支持 Pointer + Touch，合并至 rAF 稳 60 帧）
let trackDrag = false;
let trackRect = null;
function setOpenFromClientX(clientX) {
  const r = trackRect || unrollTrack.getBoundingClientRect();
  const u = clamp((clientX - r.left) / Math.max(1, r.width), 0, 1);
  heroState.openRatio = clamp(0.22 + u * (1 - 0.22), 0.22, 1);
  touchHero(false);
}

unrollTrack.addEventListener("pointerdown", (e) => {
  trackDrag = true;
  trackRect = unrollTrack.getBoundingClientRect();
  unrollTrack.setPointerCapture?.(e.pointerId);
  setOpenFromClientX(e.clientX);
});
unrollTrack.addEventListener("pointermove", (e) => {
  if (!trackDrag) return;
  setOpenFromClientX(e.clientX);
});
const endTrackDrag = () => { trackDrag = false; trackRect = null; };
unrollTrack.addEventListener("pointerup", endTrackDrag);
unrollTrack.addEventListener("pointercancel", endTrackDrag);
// 兼容纯 TouchEvent（例如 CDP Input.dispatchTouchEvent）
unrollTrack.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  trackDrag = true;
  trackRect = unrollTrack.getBoundingClientRect();
  setOpenFromClientX(e.touches[0].clientX);
}, { passive: true });
unrollTrack.addEventListener("touchmove", (e) => {
  if (!trackDrag || !e.touches.length) return;
  setOpenFromClientX(e.touches[0].clientX);
}, { passive: true });
unrollTrack.addEventListener("touchend", endTrackDrag, { passive: true });

unrollTrack.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.12 : 0.04;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    heroState.openRatio = clamp(heroState.openRatio + step, 0.22, 1);
    touchHero();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    heroState.openRatio = clamp(heroState.openRatio - step, 0.22, 1);
    touchHero();
  }
});

// 画布直接交互：拖卷轴、拖地平线高低、拖右柄调平倾角、拖三横带、点除红色杂障
let dragCtx = null;

function canvasPoint(e) {
  const r = heroCanvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
}

heroCanvas.addEventListener("pointerdown", (e) => {
  const pt = canvasPoint(e);
  const hit = heroRenderer.hitTest(pt.x, pt.y);
  if (!hit) return;

  if (hit.startsWith("obs:")) {
    const id = Number(hit.split(":")[1]);
    heroState.obstacles[id] = false;
    touchHero();
    return;
  }

  dragCtx = {
    hit,
    startX: pt.x,
    startY: pt.y,
    startOpen: heroState.openRatio,
    startHorizon: heroState.horizonY,
    startBars: { ...heroState.bars },
  };
  anim.dragging = hit;
  heroCanvas.classList.add("is-dragging");
  heroCanvas.setPointerCapture?.(e.pointerId);
  touchHero();
});

heroCanvas.addEventListener("pointermove", (e) => {
  const pt = canvasPoint(e);
  if (!dragCtx) {
    const h = heroRenderer.hitTest(pt.x, pt.y);
    if (h !== anim.hover) {
      anim.hover = h;
      heroCanvas.style.cursor = h?.startsWith("obs:") ? "pointer" : h ? "grab" : "default";
      touchHero();
    }
    return;
  }

  const rect = heroRenderer.getRect();
  if (!rect) return;
  const { hit } = dragCtx;

  if (hit === "roller:left" || hit === "roller:right") {
    const dx = pt.x - dragCtx.startX;
    const sign = hit === "roller:right" ? 1 : -1;
    const delta = (sign * dx * 2) / Math.max(120, rect.fullW - rect.minW);
    heroState.openRatio = clamp(dragCtx.startOpen + delta * (1 - 0.22), 0.22, 1);
  } else if (hit === "horizon") {
    const ny = clamp((pt.y - rect.y) / rect.h, 0.20, 0.80);
    // 靠近 51.5% 原海报线轻微吸附
    heroState.horizonY = Math.abs(ny - 0.515) < 0.015 ? 0.515 : ny;
  } else if (hit === "tilt") {
    const cx = rect.x + rect.w / 2;
    const hy = rect.y + rect.h * heroState.horizonY;
    const rawDeg = (Math.atan2(pt.y - hy, Math.max(24, pt.x - cx)) * 180) / Math.PI;
    heroState.tiltDeg = Math.abs(rawDeg) < 1.8 ? 0 : clamp(rawDeg, -14, 14);
  } else if (hit.startsWith("bar:")) {
    const key = hit.split(":")[1];
    const hw = BAR_WIDTHS[key] / 2;
    const u = clamp((pt.x - rect.x) / rect.w, 0.03 + hw, 0.97 - hw);
    heroState.bars[key] = u;
  }
  touchHero(false);
});

const endCanvasDrag = () => {
  if (!dragCtx) return;
  dragCtx = null;
  anim.dragging = null;
  heroCanvas.classList.remove("is-dragging");
  touchHero();
};
heroCanvas.addEventListener("pointerup", endCanvasDrag);
heroCanvas.addEventListener("pointercancel", endCanvasDrag);

// 题材切换 & 原则栏快捷控件
$$(".scene-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    heroState.scene = btn.dataset.scene;
    $$(".scene-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    touchHero();
  });
});

$("#btn-spread-bars").addEventListener("click", () => {
  heroState.bars = { pine: 0.265, sage: 0.655, vermilion: 0.895 };
  touchHero();
});
$("#btn-widen").addEventListener("click", () => {
  heroState.openRatio = 0.86;
  touchHero();
});
$("#inp-horizon").addEventListener("input", (e) => {
  heroState.horizonY = clamp(Number(e.target.value) / 100, 0.20, 0.80);
  touchHero();
});
$("#btn-level").addEventListener("click", () => {
  heroState.tiltDeg = 0;
  if (heroState.horizonY < 0.34 || heroState.horizonY > 0.66) heroState.horizonY = 0.515;
  touchHero();
});
$("#btn-tilt-test").addEventListener("click", () => {
  heroState.tiltDeg = heroState.tiltDeg >= 0 ? -7.5 : 8.5;
  touchHero();
});
$("#inp-haze").addEventListener("input", (e) => {
  heroState.haze = clamp(Number(e.target.value), 0, 100);
  touchHero();
});
$("#btn-clear-obs").addEventListener("click", () => {
  heroState.obstacles = [false, false, false];
  touchHero();
});
$("#btn-restore-obs").addEventListener("click", () => {
  heroState.obstacles = [true, true, true];
  touchHero();
});

function applyState(next) {
  Object.assign(heroState, next, {
    obstacles: [...next.obstacles],
    bars: { ...next.bars },
  });
  $$(".scene-btn").forEach((b) => {
    const on = b.dataset.scene === heroState.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  touchHero();
}

$("#btn-reset-broken").addEventListener("click", () => applyState(createBrokenState(heroState.scene)));
$("#btn-solve-poster").addEventListener("click", () => applyState(createPosterSolvedState(heroState.scene)));
$("#btn-solve-river").addEventListener("click", () => applyState(createAlternateSolvedState("river")));
$("#btn-solve-mirror").addEventListener("click", () => applyState(createAlternateSolvedState("mirror")));

// ==================== 2. 第 01 节：双眼视域与地平线比例对照镜 ====================
const visionCanvas = $("#vision-canvas");
let currentVision = VISION_MODES[1]; // 默认海报 52% 错落
let visionNeedDraw = true;
const visionLoop = loop(visionCanvas, () => {
  if (!visionNeedDraw) return;
  drawVisionCanvas(visionCanvas, currentVision);
  visionNeedDraw = false;
});

function setVisionMode(id) {
  const m = VISION_MODES.find((x) => x.id === id) || VISION_MODES[1];
  currentVision = m;
  $$(".tab-btn").forEach((b) => {
    const on = b.dataset.vmode === m.id;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  $("#vr-feel").textContent = m.feel;
  $("#vr-sweep").textContent = m.sweep;
  $("#vr-verdict").textContent = m.verdict;
  visionNeedDraw = true;
  visionLoop.draw();
}
$$(".tab-btn").forEach((b) => b.addEventListener("click", () => setVisionMode(b.dataset.vmode)));

// ==================== 3. 第 02 节：四代典例真实比例结构图解 ====================
const historyCanvas = $("#history-canvas");
let currentWork = HISTORY_WORKS[0];
let historyNeedDraw = true;
const historyLoop = loop(historyCanvas, () => {
  if (!historyNeedDraw) return;
  drawHistoryCanvas(historyCanvas, currentWork);
  historyNeedDraw = false;
});

function setHistoryWork(id) {
  const w = HISTORY_WORKS.find((x) => x.id === id) || HISTORY_WORKS[0];
  currentWork = w;
  $$(".stamp-btn").forEach((b) => {
    const on = b.dataset.work === w.id;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  $("#hd-title").textContent = `${w.author} ${w.title}`;
  $("#hd-museum").textContent = `${w.museum} · ${w.dim}`;
  $("#hd-summary").textContent = w.summary;
  $("#hd-struct").textContent = w.structure;
  historyNeedDraw = true;
  historyLoop.draw();
}
$$(".stamp-btn").forEach((b) => b.addEventListener("click", () => setHistoryWork(b.dataset.work)));

// ==================== 4. 第 03 节：深松暗室 3D 投影四层景深剖视台 ====================
const depthCanvas = $("#depth-canvas");
let depthYaw = 26;
let currentLaw = TONE_LAWS.aerial;
let depthNeedDraw = true;
const depthLoop = loop(depthCanvas, () => {
  if (!depthNeedDraw) return;
  drawDepthDiorama(depthCanvas, depthYaw, currentLaw);
  depthNeedDraw = false;
});

function syncDepthUI() {
  $("#val-yaw").textContent = depthYaw < 6 ? `${depthYaw}° 正面平视` : `${depthYaw}° 侧视剖层`;
  $("#lr-feel").textContent = currentLaw.depthFeel;
  $("#lr-desc").textContent = currentLaw.frontRead;
  $(".law-readout").classList.toggle("is-bad", currentLaw.id !== "aerial");

  const legend = $("#layer-legend");
  legend.innerHTML = currentLaw.layers
    .map((ly, i) => {
      const hex = `rgb(${ly.rgb.join(",")})`;
      return `<li><span class="swatch" style="background:${hex}"></span><strong>0${i + 1} ${ly.name}</strong><em>${ly.desc}</em></li>`;
    })
    .join("");

  depthNeedDraw = true;
  depthLoop.draw();
}

$("#inp-yaw").addEventListener("input", (e) => {
  depthYaw = Number(e.target.value);
  syncDepthUI();
});
$$(".law-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentLaw = TONE_LAWS[btn.dataset.law] || TONE_LAWS.aerial;
    $$(".law-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    syncDepthUI();
  });
});

// ==================== 5. 第 04 节：现代界面三步平远化改造台 ====================
const UI_PRESETS = {
  tea: {
    url: "qinglan-tea.example / 秋季茶席首屏",
    eyebrow: "AUTUMN PAVILION · NO.09",
    h: "秋水长天，静候一盏明前新芽",
    p: "沿太湖西岸三百米临水长廊展开，十二席临窗平视烟波。",
    bars: ["预约临水茶席", "时令茶单 · 空间导览", "十月开席"],
    noise: ["限时立减 ¥180", "热卖榜 TOP 1", "立即扫码领新人茶包 →"],
  },
  arch: {
    url: "horizon-biennale.example / 2026 建筑双年展",
    eyebrow: "ARCHITECTURE BIENNALE · HALL B",
    h: "低伏之地：当代水岸低层建筑文献展",
    p: "二十七座贴水而建的平屋顶展馆模型，与水平面平行对话。",
    bars: ["预约观展时段", "展厅平面图 · 策展手记", "10.12—12.08"],
    noise: ["早鸟票仅剩 9 张", "明星策展人直播", "分享立抽周边帆布袋 →"],
  },
  essay: {
    url: "river-notes.example / 专题长文开篇",
    eyebrow: "LONGFORM ESSAY · CHAPTER 01",
    h: "在宽阔水域边，为什么时间会显得更慢",
    p: "从五代水墨手卷到当代海岸公路，追问水平线如何安抚人的视线。",
    bars: ["开始阅读正文", "约 12 分钟 · 附原图对照", "卷首引"],
    noise: ["开通会员全场 5 折", "今日必看榜单", "点击下载客户端领券 →"],
  },
};

const uiFix = { horizon: false, clean: false, tone: false };
let activeUiKey = "tea";

function syncApplyUI() {
  const p = UI_PRESETS[activeUiKey];
  const frame = $("#mock-frame");
  frame.dataset.ui = activeUiKey;
  frame.classList.toggle("fix-horizon", uiFix.horizon);
  frame.classList.toggle("fix-clean", uiFix.clean);
  frame.classList.toggle("fix-tone", uiFix.tone);

  const count = Object.values(uiFix).filter(Boolean).length;
  frame.classList.toggle("is-calm", count === 3);
  $("#mock-url").textContent = p.url;
  $("#mock-eyebrow").textContent = p.eyebrow;
  $("#mock-h").textContent = p.h;
  $("#mock-p").textContent = p.p;
  $("#mbar-1").textContent = p.bars[0];
  $("#mbar-2").textContent = p.bars[1];
  $("#mbar-3").textContent = p.bars[2];
  const noiseSpans = $$("#mock-noise span");
  p.noise.forEach((txt, i) => { if (noiseSpans[i]) noiseSpans[i].textContent = txt; });
  $("#mock-noise").setAttribute("aria-hidden", String(uiFix.clean));

  $("#mock-state").textContent = count === 3 ? "平远秩序已立 · 3 / 3" : `喧闹原稿 · ${count} / 3 项平远改造`;

  const fb = $("#mock-feedback");
  if (count === 0) {
    fb.textContent = "原稿一侧挤满高饱和促销竖条，远景与文字同深抢戏，且容器被窄框夹住——访客先看到「急着卖货」，完全感受不到开阔静气。试着逐个点亮上方三项改造。";
  } else if (count === 3) {
    fb.textContent = "三步到位：通栏水平基线拉开了横向呼吸，撤去竖向杂块让视线顺畅滑向远日，近重远淡的空气明晦则把主标与三枚底部横带稳稳托出。";
  } else {
    const left = [];
    if (!uiFix.horizon) left.push("展宽水平基线");
    if (!uiFix.clean) left.push("撤去竖向喧扰");
    if (!uiFix.tone) left.push("拉开近远明晦");
    fb.textContent = `已完成 ${count} 步，界面已经明显松快一些；还差「${left.join("、")}」就能把完整的平远秩序立起来。`;
  }
}

$$(".apply-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    activeUiKey = tab.dataset.ui;
    $$(".apply-tab").forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    syncApplyUI();
  });
});
$$(".toggle-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const k = chip.dataset.fix;
    uiFix[k] = !uiFix[k];
    chip.setAttribute("aria-pressed", String(uiFix[k]));
    syncApplyUI();
  });
});

// ==================== 6. 第 05 节：什么时候别用 · 4 题速判卡 ====================
const avoidGrid = $("#avoid-grid");
avoidGrid.innerHTML = AVOID_CASES.map((c) => `
  <article class="case-card" data-case="${c.id}">
    <h4>${c.title}</h4>
    <p>${c.brief}</p>
    <div class="case-actions">
      <button type="button" class="case-btn" data-pick="yes">适合平远法</button>
      <button type="button" class="case-btn" data-pick="no">换别的方法</button>
    </div>
    <div class="case-verdict" hidden></div>
  </article>
`).join("");

avoidGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".case-btn");
  if (!btn) return;
  const card = btn.closest(".case-card");
  const item = AVOID_CASES.find((c) => c.id === card.dataset.case);
  if (!item) return;
  const pickedYes = btn.dataset.pick === "yes";
  const correct = pickedYes === item.shouldUse;

  $$(".case-btn", card).forEach((b) => b.classList.remove("is-picked-ok", "is-picked-err"));
  btn.classList.add(correct ? "is-picked-ok" : "is-picked-err");

  const v = $(".case-verdict", card);
  v.hidden = false;
  v.classList.toggle("is-wrong", !correct);
  const linkHtml = item.linkId
    ? ` 可看 <a href="https://layout.xiaoxiaodong.ai/${item.linkId}/play/">${item.linkName}</a>。`
    : "";
  v.innerHTML = `<strong>${correct ? "判断准确" : "再想一步"}：</strong>${item.verdict} ${item.alt}${linkHtml}`;
});

// ==================== 7. 第 06 节：单变量 4 选 1 小练习 ====================
function makeQuizSvg(opt) {
  return `<svg viewBox="0 0 330 150" role="img" aria-label="${opt.label}平远明晦草图">
    <rect width="330" height="150" fill="#DAE0D5"/>
    <path d="M0 78 Q42 46 88 64 T182 54 T272 62 L330 48 L330 78 Z" fill="${opt.far}"/>
    <path d="M0 78 Q55 60 112 70 T224 64 T330 68 L330 78 Z" fill="${opt.mid}"/>
    <circle cx="268" cy="64" r="9.5" fill="#DE582F"/>
    <line x1="0" y1="78" x2="330" y2="78" stroke="#0F2617" stroke-width="1.8"/>
    <line x1="254" y1="86" x2="282" y2="86" stroke="#1D3F2F" stroke-opacity="0.45" stroke-width="1.2" stroke-dasharray="6 4"/>
    <line x1="260" y1="92" x2="276" y2="92" stroke="#1D3F2F" stroke-opacity="0.4" stroke-width="1.2" stroke-dasharray="5 4"/>
    <rect x="20" y="96" width="136" height="17" fill="${opt.near}"/>
    <rect x="164" y="121" width="104" height="7" fill="${opt.mid}"/>
    <rect x="278" y="116" width="34" height="16" fill="#DB6841"/>
  </svg>`;
}

const quizGrid = $("#quiz-grid");
quizGrid.innerHTML = QUIZ_OPTIONS.map((opt) => `
  <button type="button" class="quiz-opt" data-qid="${opt.id}">
    ${makeQuizSvg(opt)}
    <div class="quiz-opt-foot">
      <span>${opt.label}</span>
      <span class="q-mark">点击作答</span>
    </div>
  </button>
`).join("");

quizGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".quiz-opt");
  if (!btn) return;
  const opt = QUIZ_OPTIONS.find((o) => o.id === btn.dataset.qid);
  if (!opt) return;

  $$(".quiz-opt", quizGrid).forEach((b) => {
    const o = QUIZ_OPTIONS.find((x) => x.id === b.dataset.qid);
    b.classList.remove("is-right", "is-wrong");
    const mark = $(".q-mark", b);
    if (o.correct) {
      b.classList.add("is-right");
      mark.textContent = "正确答案";
    } else if (b === btn) {
      b.classList.add("is-wrong");
      mark.textContent = "未命中";
    } else {
      mark.textContent = o.label;
    }
  });

  const res = $("#quiz-result");
  res.hidden = false;
  res.classList.toggle("is-wrong", !opt.correct);
  $("#qr-title").textContent = opt.correct ? `答对了 · ${opt.label} 最符合平远法` : `你选了 ${opt.label} · 正确答案是 方案 B`;
  $("#qr-body").textContent = opt.correct
    ? opt.explain
    : `${opt.explain} 反观方案 B：近岸深松压脚、中洲烟灰过渡、远山淡青融雾，才符合郭熙「平远之色有明有晦」的空间递推。`;
});

$("#btn-quiz-retry").addEventListener("click", () => {
  $$(".quiz-opt", quizGrid).forEach((b) => {
    b.classList.remove("is-right", "is-wrong");
    $(".q-mark", b).textContent = "点击作答";
  });
  $("#quiz-result").hidden = true;
});

// ==================== 8. 第 07 节：原海报点击放大/拖动/Esc 灯箱 ====================
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbScaleEl = $("#lb-scale");
let lbScale = 1, lbX = 0, lbY = 0, lbPan = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale.toFixed(2)})`;
  lbScaleEl.textContent = `${Math.round(lbScale * 100)}%`;
}
function openLightbox() {
  lbImg.src = $("#poster").src;
  lbScale = 1.15;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  $("#lb-close").focus();
}
function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  $("#poster-trigger").focus();
}

$("#poster-trigger").addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => { lbScale = clamp(lbScale + 0.35, 0.75, 3.2); applyLbTransform(); });
$("#lb-zoom-out").addEventListener("click", () => { lbScale = clamp(lbScale - 0.35, 0.75, 3.2); applyLbTransform(); });
$("#lb-reset").addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLbTransform(); });

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.18 : -0.18), 0.75, 3.2);
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) { closeLightbox(); return; }
  lbPan = { x: e.clientX - lbX, y: e.clientY - lbY };
  lbStage.classList.add("is-panning");
  lbStage.setPointerCapture?.(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbPan) return;
  lbX = e.clientX - lbPan.x;
  lbY = e.clientY - lbPan.y;
  applyLbTransform();
});
const endPan = () => { lbPan = null; lbStage.classList.remove("is-panning"); };
lbStage.addEventListener("pointerup", endPan);
lbStage.addEventListener("pointercancel", endPan);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

// 窗口尺寸变化时全部画布精准重绘
window.addEventListener("resize", () => {
  heroDirty = true;
  visionNeedDraw = true;
  historyNeedDraw = true;
  depthNeedDraw = true;
  heroLoop.draw();
  visionLoop.draw();
  historyLoop.draw();
  depthLoop.draw();
});

// 初始化首次同步
syncHeroUI(evaluateHero(heroState, heroCanvas.clientWidth || 1280, heroCanvas.clientHeight || 320));
syncDepthUI();
syncApplyUI();

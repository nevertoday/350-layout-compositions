import { loop, reducedMotion } from "../../lib/stage.js";
import {
  ASPECT,
  HERO_INITIAL,
  PRACTICE_FRAMES,
  ROOM,
  computeOpticalBlur,
  evaluateShot,
} from "./model.js";
import {
  PALETTE,
  drawBackgroundLayer,
  drawForegroundLayer,
  drawSubjectLayer,
  renderCinemaFrame,
  renderFloorplan,
} from "./scene.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ==================== HERO：统一 2.39:1 监视器 × 俯拍滑轨 ==================== */
const heroState = { ...HERO_INITIAL };
const heroMonitor = document.getElementById("hero-monitor");
const heroFloorplan = document.getElementById("hero-floorplan");
const fpWrap = document.getElementById("floorplan-wrap");
const dollyHandle = document.getElementById("dolly-handle");

const elDolly = document.getElementById("read-dolly");
const elCov = document.getElementById("read-cov");
const elBadge = document.getElementById("slate-badge");
const elHeadline = document.getElementById("slate-headline");
const elWhy = document.getElementById("slate-why");
const elOpticsNote = document.getElementById("optics-note");
const elReadoutBox = document.querySelector(".slate-readout");
const elCondRec = document.getElementById("cond-rec");
const elCondClr = document.getElementById("cond-clr");
const elCondGaz = document.getElementById("cond-gaz");
const btnGuides = document.getElementById("btn-guides");
const btnReset = document.getElementById("btn-reset");
const apButtons = [...document.querySelectorAll(".ap-btn")];

let trackMetrics = { tx0: 24, tx1: 300, trackY: 120 };
let heroDirty = true;
let heroIntroDone = false;
let heroIntroT = 0;

const ICON_OK = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><polyline points="2.5,8.5 6.3,12.2 13.5,4.2"/></svg>`;
const ICON_NO = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><line x1="3.5" y1="3.5" x2="12.5" y2="12.5"/><line x1="12.5" y1="3.5" x2="3.5" y2="12.5"/></svg>`;

function updateCondItem(el, ok) {
  el.dataset.ok = String(ok);
  const mark = el.querySelector(".cond-mark");
  if (mark) mark.innerHTML = ok ? ICON_OK : ICON_NO;
}

function updateHeroUI(ev) {
  const sign = ev.dollyX >= 0 ? "+" : "";
  elDolly.textContent = `${sign}${ev.dollyX.toFixed(2)}m`;
  elCov.textContent = `${ev.coveragePct}%`;

  elBadge.textContent = ev.badge;
  elBadge.dataset.state = ev.allPassed ? "ok" : "warn";
  elReadoutBox.dataset.ok = String(ev.allPassed);
  elHeadline.textContent = ev.headline;
  elWhy.textContent = ev.why;
  elOpticsNote.textContent = `${ev.optics.opticalNote}（光圈仅演示硬边抢戏，不计入上方三条几何门槛。）`;

  updateCondItem(elCondRec, ev.conditions.recognizable);
  updateCondItem(elCondClr, ev.conditions.clearSpace);
  updateCondItem(elCondGaz, ev.conditions.gazeSide);

  dollyHandle.dataset.ok = String(ev.allPassed);
  dollyHandle.setAttribute("aria-valuenow", ev.dollyX.toFixed(2));
  dollyHandle.setAttribute("aria-valuetext", `机位 ${sign}${ev.dollyX.toFixed(2)} 米，${ev.badge}`);

  btnGuides.setAttribute("aria-pressed", String(heroState.showGuides));
  btnGuides.textContent = heroState.showGuides ? "构图线：开" : "构图线：关";

  for (const b of apButtons) {
    b.setAttribute("aria-pressed", String(Number(b.dataset.ap) === heroState.aperture));
  }
}

function drawHero(t, dt, { still }) {
  if (!still && !heroIntroDone) {
    heroIntroT += dt;
    if (heroIntroT >= 0.7) heroIntroDone = true;
    heroDirty = true;
  } else if (still) {
    heroIntroDone = true;
  }

  if (!heroDirty) return;
  heroDirty = false;

  const ev = evaluateShot(heroState);
  renderCinemaFrame(heroMonitor, ev, {
    showDiag: heroState.showGuides,
    showCallouts: ev.allPassed,
    showHud: true,
    showCornerBrackets: true,
    accentBrackets: true,
  });

  // 开场轻柔渐入取景光门，0 秒到 0.7 秒任一瞬间都清晰完整
  if (!still && !heroIntroDone) {
    const p = clamp(heroIntroT / 0.7, 0, 1);
    const fade = (1 - p) * 0.24;
    const ctx = heroMonitor.getContext("2d");
    const rect = heroMonitor.getBoundingClientRect();
    ctx.fillStyle = `rgba(10, 12, 6, ${fade.toFixed(3)})`;
    ctx.fillRect(0, 0, rect.width, rect.width / ASPECT);
  }

  trackMetrics = renderFloorplan(heroFloorplan, ev);
  dollyHandle.style.left = `${trackMetrics.camX}px`;
  dollyHandle.style.top = `${trackMetrics.trackY}px`;
  updateHeroUI(ev);
}

const heroLoop = loop(document.querySelector(".hero"), drawHero);

function setDollyX(x) {
  const next = clamp(x, ROOM.trackMinX, ROOM.trackMaxX);
  if (Math.abs(next - heroState.dollyX) < 0.0005) return;
  heroState.dollyX = next;
  heroDirty = true;
  heroLoop.draw();
}

function clientXToDolly(clientX) {
  const rect = fpWrap.getBoundingClientRect();
  const localX = clientX - rect.left;
  const span = Math.max(10, trackMetrics.tx1 - trackMetrics.tx0);
  const ratio = clamp((localX - trackMetrics.tx0) / span, 0, 1);
  return ROOM.trackMinX + ratio * (ROOM.trackMaxX - ROOM.trackMinX);
}

// 兼容鼠标 + 触摸（含 perf.mjs dispatchTouchEvent），且不阻挡手机竖向滚屏
let draggingDolly = false;
let touchStartXY = null;
let touchAxisLocked = "";

dollyHandle.addEventListener("pointerdown", (e) => {
  draggingDolly = true;
  if (dollyHandle.setPointerCapture) {
    try { dollyHandle.setPointerCapture(e.pointerId); } catch {}
  }
  setDollyX(clientXToDolly(e.clientX));
});

dollyHandle.addEventListener("pointermove", (e) => {
  if (!draggingDolly) return;
  setDollyX(clientXToDolly(e.clientX));
});

dollyHandle.addEventListener("pointerup", () => { draggingDolly = false; });
dollyHandle.addEventListener("pointercancel", () => { draggingDolly = false; });

// 兼容原生 TouchEvents（部分自动化工具仅发 touch 而不触发 pointercapture）
dollyHandle.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  draggingDolly = true;
  e.preventDefault();
  setDollyX(clientXToDolly(e.touches[0].clientX));
}, { passive: false });

dollyHandle.addEventListener("touchmove", (e) => {
  if (!draggingDolly || !e.touches.length) return;
  e.preventDefault();
  setDollyX(clientXToDolly(e.touches[0].clientX));
}, { passive: false });

dollyHandle.addEventListener("touchend", () => { draggingDolly = false; });

// 在俯拍图轨道区点选或横向拖动也能挪机位，纵向滑动仍交给页面滚动
fpWrap.addEventListener("pointerdown", (e) => {
  if (e.target === dollyHandle || dollyHandle.contains(e.target)) return;
  if (e.pointerType === "mouse") {
    draggingDolly = true;
    setDollyX(clientXToDolly(e.clientX));
  }
});

window.addEventListener("pointermove", (e) => {
  if (!draggingDolly) return;
  setDollyX(clientXToDolly(e.clientX));
});

window.addEventListener("pointerup", () => { draggingDolly = false; });

fpWrap.addEventListener("touchstart", (e) => {
  if (e.target === dollyHandle || dollyHandle.contains(e.target)) return;
  if (!e.touches.length) return;
  touchStartXY = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  touchAxisLocked = "";
}, { passive: true });

fpWrap.addEventListener("touchmove", (e) => {
  if (!touchStartXY || !e.touches.length) return;
  const dx = e.touches[0].clientX - touchStartXY.x;
  const dy = e.touches[0].clientY - touchStartXY.y;
  if (!touchAxisLocked && Math.hypot(dx, dy) > 8) {
    touchAxisLocked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
  }
  if (touchAxisLocked === "x") {
    e.preventDefault();
    setDollyX(clientXToDolly(e.touches[0].clientX));
  }
}, { passive: false });

fpWrap.addEventListener("touchend", () => { touchStartXY = null; touchAxisLocked = ""; });

dollyHandle.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.02 : 0.08;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    setDollyX(heroState.dollyX - step);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    setDollyX(heroState.dollyX + step);
  } else if (e.key === "r" || e.key === "R") {
    e.preventDefault();
    resetHero();
  } else if (e.key === "g" || e.key === "G") {
    e.preventDefault();
    toggleGuides();
  }
});

function toggleGuides() {
  heroState.showGuides = !heroState.showGuides;
  heroDirty = true;
  heroLoop.draw();
}

function resetHero() {
  Object.assign(heroState, HERO_INITIAL);
  heroDirty = true;
  heroLoop.draw();
}

btnGuides.addEventListener("click", toggleGuides);
btnReset.addEventListener("click", resetHero);

for (const b of apButtons) {
  b.addEventListener("click", () => {
    heroState.aperture = Number(b.dataset.ap);
    heroDirty = true;
    heroLoop.draw();
  });
}

/* ==================== 01 节：三层胶片剥离栈 ==================== */
const peelCanvas = document.getElementById("peel-canvas");
const peelCap = document.getElementById("peel-cap");
const chkBg = document.getElementById("layer-bg");
const chkMid = document.getElementById("layer-mid");
const chkFg = document.getElementById("layer-fg");
const btnPeelView = document.getElementById("peel-view");

const peelState = { bg: true, mid: true, fg: true, splitTarget: 0, split: 0 };
const peelEval = evaluateShot({ dollyX: 0.66, aperture: 2.0, focalMm: 50 });

function updatePeelCap() {
  const { bg, mid, fg } = peelState;
  if (bg && mid && fg) {
    peelCap.textContent = peelState.splitTarget > 0.5
      ? "2.5D 三层片盒展开：最远处是暖光双格窗（背景），中间坐着清晰的主角（中景），最靠近镜头是左缘柔焦肩影（前景）。"
      : "三层齐开：前景柔焦暗块收住画面左缘，暖黄双格窗从背后托出主角侧影轮廓，视觉焦点自然锁定中景。";
  } else if (!fg && bg && mid) {
    peelCap.textContent = "关掉前景暗影后，画面立刻退回干净的单人景别——清晰直接，但少了一层空间标尺与对面在场线索。";
  } else if (!bg && mid && fg) {
    peelCap.textContent = "关掉背景窗光后，中景主角剪影失去背光轮廓托底，与前景暗块粘连成一片黑，层次大幅塌陷。";
  } else if (!mid) {
    peelCap.textContent = "抽掉中景主角只剩前景与背景：没有清晰的主体接住视线，前景暗块与暖光窗再有层次也失去叙事重心。";
  } else {
    peelCap.textContent = "只剩单一图层：层次感来自三层之间的明暗、虚实与尺度落差，任何一层单独都撑不起纵深。";
  }
}

function drawPlateIso(ctx, W, H, offsetX, offsetY, scaleX, skewY, label, drawFn) {
  ctx.save();
  ctx.translate(W * 0.5 + offsetX, H * 0.5 + offsetY);
  ctx.transform(scaleX, skewY, 0, 0.86, 0, 0);
  const pw = W * 0.62;
  const ph = H * 0.78;
  ctx.translate(-pw * 0.5, -ph * 0.5);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, pw, ph);
  ctx.clip();
  drawFn(ctx, pw, ph);
  ctx.restore();

  ctx.strokeStyle = "rgba(242, 234, 198, 0.52)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, 0, pw, ph);

  ctx.fillStyle = "rgba(12, 14, 8, 0.86)";
  ctx.fillRect(6, 6, 98, 22);
  ctx.fillStyle = "#F2EAC6";
  ctx.font = `700 11px "Noto Sans SC", sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText(label, 12, 17);
  ctx.restore();
}

let peelDirty = true;
const peelLoop = loop(peelCanvas, (t, dt, { still }) => {
  if (still) {
    peelState.split = peelState.splitTarget;
  } else if (Math.abs(peelState.split - peelState.splitTarget) > 0.004) {
    peelState.split += (peelState.splitTarget - peelState.split) * Math.min(1, dt * 8);
    peelDirty = true;
  } else if (peelState.split !== peelState.splitTarget) {
    peelState.split = peelState.splitTarget;
    peelDirty = true;
  }
  if (!peelDirty) return;
  peelDirty = false;

  const rect = peelCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.max(200, Math.round(rect.width));
  const H = Math.max(84, Math.round(rect.width / ASPECT));
  if (peelCanvas.width !== Math.round(W * dpr) || peelCanvas.height !== Math.round(H * dpr)) {
    peelCanvas.width = Math.round(W * dpr);
    peelCanvas.height = Math.round(H * dpr);
  }
  const ctx = peelCanvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = "#0B0D07";
  ctx.fillRect(0, 0, W, H);

  const s = peelState.split;
  if (s < 0.02) {
    renderCinemaFrame(peelCanvas, peelEval, {
      showBg: peelState.bg,
      showSubject: peelState.mid,
      showFg: peelState.fg,
      showCornerBrackets: true,
    });
    return;
  }

  // 2.5D 轴测三层胶片卡展开
  const spreadX = W * 0.21 * s;
  const spreadY = H * 0.06 * s;
  const skew = -0.14 * s;
  const sx = 1 - 0.16 * s;

  if (peelState.bg) {
    drawPlateIso(ctx, W, H, spreadX, -spreadY, sx, skew, "背景 · 窗光树影", (c, w, h) => {
      drawBackgroundLayer(c, w, h, { parallaxU: 0.02 });
    });
  }
  if (peelState.mid) {
    drawPlateIso(ctx, W, H, 0, 0, sx, skew, "中景 · 清晰主角", (c, w, h) => {
      c.fillStyle = "rgba(44, 46, 23, 0.42)";
      c.fillRect(0, 0, w, h);
      drawSubjectLayer(c, w, h);
    });
  }
  if (peelState.fg) {
    drawPlateIso(ctx, W, H, -spreadX, spreadY, sx, skew, "前景 · 柔焦暗影", (c, w, h) => {
      c.fillStyle = "rgba(18, 20, 11, 0.25)";
      c.fillRect(0, 0, w, h);
      drawForegroundLayer(c, w, h, { polygon: peelEval.polygon, blurNorm: peelEval.optics.blurNorm });
    });
  }
});

for (const [el, key] of [[chkBg, "bg"], [chkMid, "mid"], [chkFg, "fg"]]) {
  el.addEventListener("change", () => {
    peelState[key] = el.checked;
    updatePeelCap();
    peelDirty = true;
    peelLoop.draw();
  });
}

btnPeelView.addEventListener("click", () => {
  const next = peelState.splitTarget < 0.5 ? 1 : 0;
  peelState.splitTarget = next;
  btnPeelView.setAttribute("aria-pressed", String(next === 1));
  btnPeelView.textContent = next === 1 ? "合回平面取景框" : "展开 2.5D 三层片盒";
  updatePeelCap();
  peelDirty = true;
  peelLoop.draw();
});

/* ==================== 02 节：三档单轴拉帘比对镜（308 / 309 / 305） ==================== */
const wipeCanvas = document.getElementById("wipe-canvas");
const wipeDivider = document.getElementById("wipe-divider");
const wipeRange = document.getElementById("wipe-range");
const wipeLeftLabel = document.getElementById("wipe-left-label");
const wrTitle = document.getElementById("wr-title");
const wrBody = document.getElementById("wr-body");
const scaleButtons = [...document.querySelectorAll(".scale-stop")];

const WIPE_STOPS = {
  clean: {
    leftLabel: "左：308 净单人镜头（Clean · 0% 前景）",
    tag: "308 净单人",
    eval: evaluateShot({ dollyX: 1.25, aperture: 2.0, focalMm: 50 }),
    title: "308 净单人 VS 308 净单人：彻底抽离前景，把画面全部交给独处主体",
    html: "两边都拿掉前景后，人物完全独立，没有他人抢戏或剪辑穿帮压力——情绪极度孤立、独白或决裂时最有力。详见 <a href=\"https://layout.xiaoxiaodong.ai/308/play/\" target=\"_blank\" rel=\"noopener\">308 净单人镜头</a>。",
  },
  dirty: {
    leftLabel: "左：309 脏单人镜头（Dirty · 左侧肩头入画）",
    tag: "309 脏单人",
    eval: evaluateShot({ dollyX: 0.66, aperture: 2.0, focalMm: 50 }),
    title: "309 脏单人 VS 308 净单人：保留人物聚焦，同时悄悄锚定对面有人",
    html: "原海报写「净单人：信息直接，层次较少；脏单人：层次丰富，关系明确，氛围更强」。左右拖动 VS 拉帘直接扫过左侧肩头：把同伴肩线与后脑拐点轻轻带进左缘，情绪依然归主角所有，空间却从孤立肖像变成正在进行的对话现场。对照专页：<a href=\"https://layout.xiaoxiaodong.ai/308/play/\" target=\"_blank\" rel=\"noopener\">308 净单人镜头</a> · <a href=\"https://layout.xiaoxiaodong.ai/305/play/\" target=\"_blank\" rel=\"noopener\">305 过肩构图</a>。",
  },
  ots: {
    leftLabel: "左：305 过肩构图（OTS · 大幅深肩压境）",
    tag: "305 过肩",
    eval: evaluateShot({ dollyX: 0.45, dollyZ: 2.15, aperture: 2.4, focalMm: 50, uFgOverride: 0.13, scaleOverride: 1.38, vOffset: -0.02 }),
    title: "305 过肩构图 VS 308 净单人：前景肩背大幅推进，双人对峙感占主导",
    html: "当摄影机更贴近前景角色、让肩背与半边头颅占去约三分之一甚至更多画幅时，镜头就跨进了 <a href=\"https://layout.xiaoxiaodong.ai/305/play/\" target=\"_blank\" rel=\"noopener\">305 过肩构图</a>——视觉重点从「主角内心」转向「两人之间的直接对峙与压迫」。",
  },
};

const wipeState = { stop: "dirty", split: 0.42 };

function renderWipe() {
  const rect = wipeCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.max(200, Math.round(rect.width));
  const H = Math.max(84, Math.round(rect.width / ASPECT));
  if (wipeCanvas.width !== Math.round(W * dpr) || wipeCanvas.height !== Math.round(H * dpr)) {
    wipeCanvas.width = Math.round(W * dpr);
    wipeCanvas.height = Math.round(H * dpr);
  }
  const ctx = wipeCanvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const sx = W * wipeState.split;
  const info = WIPE_STOPS[wipeState.stop];
  const leftEv = info.eval;

  // 左半：当前选定档位（309 脏单人 / 305 过肩 / 308 净单人）——前景正好落在左缘，拉帘开局即可直观见肩并可左右剥离
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, sx, H);
  ctx.clip();
  drawBackgroundLayer(ctx, W, H, { parallaxU: leftEv.bgParallaxU });
  drawSubjectLayer(ctx, W, H);
  if (wipeState.stop !== "clean") {
    drawForegroundLayer(ctx, W, H, { polygon: leftEv.polygon, blurNorm: leftEv.optics.blurNorm });
  }
  ctx.restore();

  // 右半：308 净单人基准
  ctx.save();
  ctx.beginPath();
  ctx.rect(sx, 0, W - sx, H);
  ctx.clip();
  drawBackgroundLayer(ctx, W, H, { parallaxU: 0 });
  drawSubjectLayer(ctx, W, H);
  ctx.restore();

  // 左/右角标
  const fs = Math.max(11, Math.round(H * 0.042));
  ctx.font = `700 ${fs}px "Noto Sans SC", sans-serif`;
  ctx.textBaseline = "top";
  if (sx > 88) {
    const lw = ctx.measureText(info.tag).width + 16;
    ctx.fillStyle = wipeState.stop === "clean" ? "rgba(16, 18, 10, 0.84)" : "rgba(166, 51, 36, 0.9)";
    ctx.fillRect(10, 10, lw, fs + 10);
    ctx.fillStyle = "#FFF7EA";
    ctx.fillText(info.tag, 18, 15);
  }
  if (W - sx > 96) {
    const rt = "308 净单人基准";
    const rw = ctx.measureText(rt).width + 16;
    ctx.fillStyle = "rgba(16, 18, 10, 0.84)";
    ctx.fillRect(W - rw - 10, 10, rw, fs + 10);
    ctx.fillStyle = "#EFE3C8";
    ctx.fillText(rt, W - rw - 2, 15);
  }

  wipeDivider.style.left = `${(wipeState.split * 100).toFixed(2)}%`;
}

function setWipeStop(stop) {
  wipeState.stop = stop;
  for (const b of scaleButtons) {
    b.setAttribute("aria-pressed", String(b.dataset.stop === stop));
  }
  const info = WIPE_STOPS[stop];
  wipeLeftLabel.textContent = info.leftLabel;
  wrTitle.textContent = info.title;
  wrBody.innerHTML = info.html;
  renderWipe();
}

wipeRange.addEventListener("input", () => {
  wipeState.split = Number(wipeRange.value) / 100;
  renderWipe();
});

for (const b of scaleButtons) {
  b.addEventListener("click", () => setWipeStop(b.dataset.stop));
}

/* ==================== 03 节：35mm 胶片编年滚带 ==================== */
const ERAS = [
  {
    kicker: "1910s–1920s · 经典好莱坞正反打体系",
    title: "从单镜全景拆成对话正反打，单人镜头有了空间搭扣",
    body: "大卫·波德维尔（David Bordwell）、珍妮特·斯泰格与克里斯汀·汤普森在《经典好莱坞电影》（The Classical Hollywood Cinema，1985，Routledge）中考据，1910 至 1920 年代好莱坞逐步确立了 180 度轴线、视线匹配与正反打（shot/reverse-shot）覆盖规范。当一场对话被拆成来回切换的单人镜头时，把对手的肩背擦边留在前景，就成了维系双方空间方向的天然搭扣。",
    source: "核实来源：David Bordwell, Janet Staiger & Kristin Thompson, The Classical Hollywood Cinema: Film Style and Mode of Production to 1960 (Routledge, 1985)。",
  },
  {
    kicker: "1910s 欧洲纵深调度 & 1940s 深焦实践",
    title: "多层纵深场面调度与 Toland / Welles 深焦的光学探索",
    body: "David Bordwell 在《电影风格史》（On the History of Film Style，Harvard University Press 1997 首版；作者 2018 免费电子修订第二版）第六章《Exceptionally Exact Perceptions: On Staging in Depth》（第 158 页起）里，细致追踪了 1910 年代欧洲电影（如丹麦与法国导演在长镜头中布置前、中、后多层动作）以及 1940 年代摄影师格雷格·托兰德（Gregg Toland）与奥逊·威尔斯（Orson Welles，《公民凯恩》等）、威廉·惠勒的深焦实践——证明前景遮挡与多层调度是贯穿电影史的场面调度工具箱。",
    source: "核实来源：David Bordwell, On the History of Film Style, Ch. 6 (1997, p. 158 起; 2018 修订电子版 davidbordwell.net/books/onthehistory.php)。",
  },
  {
    kicker: "1965 & 1991 · 片场实务教材与俯拍走位图",
    title: "把前景纵深与对话机位写成可照图执行的片场语法",
    body: "约瑟夫·马塞利（Joseph V. Mascelli）1965 年首版《电影摄影的五个 C》（The Five C's of Cinematography，Cine/Grafic Publications）第五章《Composition》（第 197 页起）系统讲解如何用前景遮挡元素与三层景深打破平面感。1991 年史蒂文·卡茨（Steven D. Katz）出版《电影镜头设计》（Film Directing Shot by Shot，ISBN 0-941188-10-8），用大量俯拍机位平面图（floorplan）把双人对话覆盖、视线轴与过肩机位变成了人人可读的蓝图。",
    source: "核实来源：Joseph V. Mascelli (1965, Ch. 5 p. 197 起, LCCN 65-28785); Steven D. Katz (1991, ISBN 0-941188-10-8)。",
  },
  {
    kicker: "1998–2024 · 教材词典定义与当代紧凑正反打",
    title: "片场口语写进教学词典：clean single 与 dirty single 明确区分",
    body: "dirty single 本是片场口语，并非某一本教材凭空发明，但可在经典教学书里查到清晰界定：Roy Thompson 1998 年首版（ISBN 978-0-240-51398-0）、后由 Christopher J. Bowen 修订的《镜头语法》（Grammar of the Shot）在第二版（2009，ISBN 978-0-240-52121-3）术语表第 214 页、以及第三版（2013，ISBN 978-0-240-52601-0）第二章《构图基础》第 68 页均明确定义了 dirty single 与 clean single（第四版 2017，ISBN 978-1-138-63222-6；第五版版权 2024，Routledge，ISBN 978-1-032-19013-6）。另据 Bordwell《好莱坞的叙事之道》（2006，UC Press），当代电影高频紧凑的单人正反打，更常借轻度前景遮挡兼顾节奏与空间联系。",
    source: "核实来源：Thompson & Bowen, Grammar of the Shot (2nd ed. 2009 Glossary p. 214; 3rd ed. 2013 Ch. 2 p. 68; 5th ed. Routledge ©2024); David Bordwell, The Way Hollywood Tells It (UC Press, 2006)。",
  },
];

let eraIdx = 0;
const eraCanvas = document.getElementById("era-canvas");
const eraBtns = [...document.querySelectorAll(".reel-frame")];
const eraKicker = document.getElementById("era-kicker");
const eraTitle = document.getElementById("era-title");
const eraBody = document.getElementById("era-body");
const eraSource = document.getElementById("era-source");
const eraCounter = document.getElementById("era-counter");

function drawEraDiagram() {
  const rect = eraCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.max(220, Math.round(rect.width));
  const H = Math.max(135, Math.round(W * 10 / 16));
  if (eraCanvas.width !== Math.round(W * dpr) || eraCanvas.height !== Math.round(H * dpr)) {
    eraCanvas.width = Math.round(W * dpr);
    eraCanvas.height = Math.round(H * dpr);
  }
  const ctx = eraCanvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = "#0E1008";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(196, 188, 155, 0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(12, 12, W - 24, H - 24);
  ctx.font = `700 11px "Archivo", "Noto Sans SC", sans-serif`;

  if (eraIdx === 0) {
    // 180度轴线 + 双机正反打
    const cy = H * 0.52;
    ctx.strokeStyle = PALETTE.coralBright;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(32, cy); ctx.lineTo(W - 32, cy); ctx.stroke();
    ctx.setLineDash([]);
    // 角色 A / B
    ctx.fillStyle = PALETTE.cream;
    ctx.beginPath(); ctx.arc(W * 0.28, cy, 11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(W * 0.72, cy, 11, 0, Math.PI * 2); ctx.fill();
    // 两个机位在轴线同侧
    for (const [cx, tx, col] of [[W * 0.22, W * 0.72, "#C5BC7A"], [W * 0.78, W * 0.28, PALETTE.coralBright]]) {
      const ky = H * 0.80;
      ctx.strokeStyle = col;
      ctx.beginPath(); ctx.moveTo(cx, ky); ctx.lineTo(tx, cy); ctx.stroke();
      ctx.fillStyle = col;
      ctx.fillRect(cx - 8, ky - 5, 16, 10);
    }
    ctx.fillStyle = PALETTE.cream;
    ctx.fillText("180° 轴线", 32, cy - 16);
    ctx.fillStyle = "#C5BC7A";
    ctx.fillText("同侧双机正反打覆盖", 28, H - 20);
  } else if (eraIdx === 1) {
    // 1910s 欧洲纵深 + 1940s 深焦三平面
    const planes = [
      { x: W * 0.18, r: 28, col: "#1C1E10", stroke: PALETTE.coralBright, tag: "前景大尺度" },
      { x: W * 0.50, r: 17, col: "#34371B", stroke: PALETTE.cream, tag: "中景主动作" },
      { x: W * 0.78, r: 10, col: "#9C9256", stroke: "#C5BC7A", tag: "远景纵深" },
    ];
    ctx.strokeStyle = "rgba(196, 188, 155, 0.28)";
    ctx.beginPath();
    ctx.moveTo(22, H * 0.20); ctx.lineTo(W - 22, H * 0.42);
    ctx.moveTo(22, H * 0.82); ctx.lineTo(W - 22, H * 0.60);
    ctx.stroke();
    for (const p of planes) {
      ctx.fillStyle = p.col;
      ctx.strokeStyle = p.stroke;
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(p.x, H * 0.51, p.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = PALETTE.cream;
      ctx.fillText(p.tag, p.x - 28, H * 0.86);
    }
  } else if (eraIdx === 2) {
    // 1965/1991 俯拍机位弧与前景框定
    const cx = W * 0.52, cy = H * 0.36;
    ctx.strokeStyle = "rgba(197, 188, 122, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, H * 0.44, 0.35, Math.PI - 0.35);
    ctx.stroke();
    ctx.fillStyle = PALETTE.cream;
    ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.coral;
    ctx.beginPath(); ctx.arc(cx - 26, cy + 36, 9, 0, Math.PI * 2); ctx.fill();
    for (const a of [0.65, 1.35, 2.25]) {
      const kx = cx + Math.cos(a) * H * 0.44;
      const ky = cy + Math.sin(a) * H * 0.44;
      ctx.fillStyle = "#C5BC7A";
      ctx.fillRect(kx - 7, ky - 5, 14, 10);
    }
    ctx.fillStyle = PALETTE.cream;
    ctx.fillText("俯拍机位蓝图 · 净 / 脏 / 过肩走位", 24, 28);
  } else {
    // 1998-2024 Clean vs Dirty 教材双框对比
    const bw = (W - 56) / 2;
    const bh = H * 0.54;
    const y0 = H * 0.24;
    ctx.fillStyle = "#E9D6B3";
    ctx.fillRect(22, y0, bw, bh);
    ctx.fillStyle = "#10120A";
    ctx.beginPath(); ctx.arc(22 + bw * 0.5, y0 + bh * 0.42, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(22 + bw * 0.32, y0 + bh * 0.56, bw * 0.36, bh * 0.44);

    const x2 = 34 + bw;
    ctx.fillStyle = "#35371B";
    ctx.fillRect(x2, y0, bw, bh);
    ctx.fillStyle = "#0A0C06";
    ctx.beginPath(); ctx.arc(x2 + bw * 0.62, y0 + bh * 0.42, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x2 + bw * 0.48, y0 + bh * 0.56, bw * 0.28, bh * 0.44);
    ctx.fillStyle = "rgba(6, 8, 4, 0.88)";
    ctx.beginPath();
    ctx.moveTo(x2, y0 + bh * 0.16);
    ctx.quadraticCurveTo(x2 + bw * 0.22, y0 + bh * 0.35, x2 + bw * 0.28, y0 + bh);
    ctx.lineTo(x2, y0 + bh);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = PALETTE.cream;
    ctx.fillText("CLEAN SINGLE", 22, y0 + bh + 18);
    ctx.fillStyle = PALETTE.coralBright;
    ctx.fillText("DIRTY SINGLE", x2, y0 + bh + 18);
  }
}

function setEra(idx) {
  eraIdx = (idx + ERAS.length) % ERAS.length;
  const e = ERAS[eraIdx];
  eraKicker.textContent = e.kicker;
  eraTitle.textContent = e.title;
  eraBody.textContent = e.body;
  eraSource.textContent = e.source;
  eraCounter.textContent = `FRAME 0${eraIdx + 1} / 0${ERAS.length}`;
  for (const b of eraBtns) {
    b.setAttribute("aria-selected", String(Number(b.dataset.era) === eraIdx));
  }
  drawEraDiagram();
}

for (const b of eraBtns) b.addEventListener("click", () => setEra(Number(b.dataset.era)));
document.getElementById("era-prev").addEventListener("click", () => setEra(eraIdx - 1));
document.getElementById("era-next").addEventListener("click", () => setEra(eraIdx + 1));

/* ==================== 04 节：4 格剧情道具抽换台 ==================== */
const propCanvas = document.getElementById("prop-canvas");
const propBtns = [...document.querySelectorAll(".prop-card")];
const propSubtext = document.getElementById("prop-subtext");
const propUsage = document.getElementById("prop-usage");

const PROPS = {
  companion: {
    subtext: "「对面正坐着一个人听他把话说完——虽然对方没露正脸，但这场谈话是双向的。」",
    usage: "狭义的 dirty single：最适合双人密谈、谈判或情感摊牌，既保住主角情绪浓度，又让观众时刻记住听者的存在。",
  },
  doorframe: {
    subtext: "「有人正站在门外悄悄看着屋里——人物毫无察觉，画框自己生出一道隔阂与窥视感。」",
    usage: "广义 dirtying the frame：用半掩门框把观众拦在门外，瞬间制造偷窥、疏离、监视或「欲进未进」的悬疑张力。",
  },
  foliage: {
    subtext: "「这是一个安静、略带私密气息的午后角落，空气里多了几分自然呼吸感。」",
    usage: "前景虚焦枝叶常见于外景与窗边戏：柔化硬直的建筑线条，制造轻盈的浪漫、怀旧或隐蔽旁观氛围。",
  },
  "glass-rail": {
    subtext: "「他正身处人来人往的咖啡馆或酒吧，但桌上空杯与栏杆把他和外界隔成了两段。」",
    usage: "用近景桌面器物与栏杆切分画幅，适合表现人物在公共场合里的心事重重与格格不入。",
  },
};

const propBaseEval = evaluateShot({ dollyX: 0.66, aperture: 2.2, focalMm: 50 });
let currentProp = "companion";

function renderProp() {
  renderCinemaFrame(propCanvas, propBaseEval, {
    propType: currentProp,
    showCornerBrackets: true,
  });
}

for (const b of propBtns) {
  b.addEventListener("click", () => {
    currentProp = b.dataset.prop;
    for (const o of propBtns) o.setAttribute("aria-pressed", String(o === b));
    propSubtext.textContent = PROPS[currentProp].subtext;
    propUsage.textContent = PROPS[currentProp].usage;
    renderProp();
  });
}

/* ==================== 05 节：双滑块光学镜头台 ==================== */
const lensCanvas = document.getElementById("lens-canvas");
const lensDiagram = document.getElementById("lens-diagram");
const slFocal = document.getElementById("sl-focal");
const slDist = document.getElementById("sl-dist");
const valFocal = document.getElementById("val-focal");
const valDist = document.getElementById("val-dist");
const lrCamDist = document.getElementById("lr-camdist");
const lrBlur = document.getElementById("lr-blur");
const lrComp = document.getElementById("lr-comp");
const lrWhy = document.getElementById("lr-why");

function renderLensBench() {
  const focalMm = Number(slFocal.value);
  const fgSep = Number(slDist.value); // 前景距主角的距离 (m)
  // 等主体大小自动移机补偿：50mm 对应 2.48m，焦距越长摄影机退得越远
  const camDist = 2.48 * (focalMm / 50);
  // 确保摄影机始终在前景后面至少 0.42m
  const effectiveSep = Math.min(fgSep, camDist - 0.42);
  const camToFg = Math.max(0.42, camDist - effectiveSep);

  // 背景窗放大率（空间压缩示意）：随焦距与退远距离提高
  const bgScale = clamp(0.76 + (focalMm / 50) * 0.24, 0.78, 1.32);

  // 计算该焦距与间距下的真实薄透镜虚化（固定 f/2.8 观察焦距与间距的影响）
  const optics = computeOpticalBlur({
    focalMm,
    aperture: 2.8,
    dollyZ: camDist,
    fgDistFromSubject: effectiveSep,
  });

  // 前景相对大小随 (camDist / camToFg) 变化（广角近拍时前景相对更大更逼脸）
  const baseRatio = 2.48 / (2.48 - 1.34);
  const curRatio = camDist / camToFg;
  const relScale = clamp(curRatio / baseRatio, 0.68, 1.55);

  const ev = evaluateShot({
    dollyX: 0.66,
    dollyZ: camDist,
    aperture: 2.8,
    focalMm,
    fgDistFromSubject: effectiveSep,
    uFgOverride: 0.055,
    scaleOverride: relScale,
  });
  ev.optics = optics;

  renderCinemaFrame(lensCanvas, ev, { bgScale, showCornerBrackets: true });

  // 更新文字读数
  valFocal.textContent = `${focalMm} mm`;
  valDist.textContent = `${fgSep.toFixed(2)} m`;
  lrCamDist.textContent = `${camDist.toFixed(2)} m`;
  lrComp.textContent = `${bgScale.toFixed(2)}×`;

  let blurTier = "柔和中度";
  if (optics.blurNorm < 0.012) blurTier = "偏硬偏实";
  else if (optics.blurNorm > 0.036) blurTier = "极度柔化";
  lrBlur.textContent = blurTier;

  if (focalMm <= 32) {
    lrWhy.textContent = `${focalMm}mm 广角必须贴近拍摄（机位缩至 ${camDist.toFixed(2)}m）：背景窗明显退小显空旷，前景如果离镜头近会急剧变大压迫边缘，且广角景深更深、前景边缘比长焦更实。`;
  } else if (focalMm >= 75) {
    lrWhy.textContent = `${focalMm}mm 长焦退远到 ${camDist.toFixed(2)}m：背景双格窗被压缩拉大紧贴主角，前景同伴在长焦浅景深里化作一团丝滑暗框，电影氛围最浓。`;
  } else if (fgSep <= 0.95) {
    lrWhy.textContent = `同伴只离主角 ${fgSep.toFixed(2)}m，几乎落在同一焦平面附近：即使开 f/2.8 前景边缘也会偏实，容易与主角争夺清晰度。`;
  } else {
    lrWhy.textContent = `${focalMm}mm 配 ${fgSep.toFixed(2)}m 前后景间距：透视自然，前景暗框与清晰主角层次分明，是片场最稳妥的常规对话焦段。`;
  }

  // 绘制侧视光路简图
  const rect = lensDiagram.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.max(240, Math.round(rect.width));
  const H = 104;
  if (lensDiagram.width !== Math.round(W * dpr) || lensDiagram.height !== Math.round(H * dpr)) {
    lensDiagram.width = Math.round(W * dpr);
    lensDiagram.height = Math.round(H * dpr);
  }
  const ctx = lensDiagram.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#14160C";
  ctx.fillRect(0, 0, W, H);

  // 水平尺（左：摄影机 0..5.2m -> 右：主角 -> 背景窗）
  const padL = 24, padR = 24;
  const winX = W - padR;
  const subjX = W - padR - (W - padL - padR) * 0.24;
  const meterPx = (subjX - padL) / 5.1;
  const camX = clamp(subjX - camDist * meterPx, padL, subjX - 28);
  const fgX = clamp(subjX - effectiveSep * meterPx, camX + 14, subjX - 14);
  const baseY = 66;

  // 地平基线
  ctx.strokeStyle = "rgba(196, 188, 155, 0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(padL, baseY); ctx.lineTo(winX, baseY); ctx.stroke();

  // 光锥
  ctx.fillStyle = "rgba(197, 188, 122, 0.14)";
  ctx.beginPath();
  ctx.moveTo(camX, baseY - 24);
  ctx.lineTo(winX, baseY - 46);
  ctx.lineTo(winX, baseY - 2);
  ctx.closePath();
  ctx.fill();

  // 背景窗竖条
  ctx.fillStyle = "#B7AD6A";
  ctx.fillRect(winX - 4, baseY - 46, 5, 46);
  // 主角
  ctx.fillStyle = "#F2EAC6";
  ctx.fillRect(subjX - 4, baseY - 34, 8, 34);
  // 前景同伴
  ctx.fillStyle = "#DB5948";
  ctx.fillRect(fgX - 4, baseY - 30, 8, 30);
  // 摄影机
  ctx.fillStyle = "#C5BC7A";
  ctx.fillRect(camX - 10, baseY - 30, 14, 12);
  ctx.beginPath();
  ctx.moveTo(camX + 4, baseY - 27);
  ctx.lineTo(camX + 10, baseY - 31);
  ctx.lineTo(camX + 10, baseY - 17);
  ctx.lineTo(camX + 4, baseY - 21);
  ctx.closePath();
  ctx.fill();

  ctx.font = `700 11px "Noto Sans SC", sans-serif`;
  ctx.fillStyle = "#C5BC7A";
  ctx.fillText(`机位 ${camDist.toFixed(1)}m`, Math.max(8, camX - 16), 90);
  ctx.fillStyle = "#F06D5B";
  ctx.fillText("前景", fgX - 11, 22);
  ctx.fillStyle = "#F2EAC6";
  ctx.fillText("主角", subjX - 11, 22);
  ctx.fillStyle = "#C5BC7A";
  ctx.fillText("窗", winX - 16, 22);
}

slFocal.addEventListener("input", renderLensBench);
slDist.addEventListener("input", renderLensBench);

/* ==================== 06 节：正反打剪辑台跳帧实测器 ==================== */
const editCanvas = document.getElementById("edit-canvas");
const btnEditCut = document.getElementById("edit-cut");
const btnEditPlay = document.getElementById("edit-play");
const chkEditJitter = document.getElementById("edit-jitter");
const chkEditClean = document.getElementById("edit-clean");
const editReadout = document.getElementById("edit-readout");

const editState = {
  shot: "A", // "A" 主角脏/净单人, "B" 对手反打
  takeIndex: 0,
  autoPlay: false,
  jitter: true,
  cleanRescue: false,
  timer: 0,
  flash: 0,
};

function updateEditReadout() {
  if (editState.cleanRescue) {
    editReadout.textContent = `当前镜号 ${editState.shot} · 已切回 308 净单人救场：移走前景肩影后，无论两位演员姿态怎么微调，A↔B 正反打剪辑点始终干脆顺滑、零跳帧。`;
  } else if (editState.jitter) {
    editReadout.textContent = `当前镜号 ${editState.shot}（第 ${editState.takeIndex + 1} 次切入）· 穿帮演示开启：前景同伴肩头在不同表演条里高度与左右位置有偏差，每次切镜左缘暗肩都会生硬瞬移，刺痛眼睛。`;
  } else {
    editReadout.textContent = `当前镜号 ${editState.shot} · 姿态完全锁死：只有在演员几乎一动不动时，前景脏单人的正反打才不会跳帧——实际片场往往难以苛求。`;
  }
}

function drawEditFrame() {
  const rect = editCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.max(200, Math.round(rect.width));
  const H = Math.max(84, Math.round(rect.width / ASPECT));
  if (editCanvas.width !== Math.round(W * dpr) || editCanvas.height !== Math.round(H * dpr)) {
    editCanvas.width = Math.round(W * dpr);
    editCanvas.height = Math.round(H * dpr);
  }
  const ctx = editCanvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const shift = editState.jitter && !editState.cleanRescue
    ? (editState.takeIndex % 2 === 0 ? -0.048 : 0.062)
    : 0;
  const vShift = editState.jitter && !editState.cleanRescue
    ? (editState.takeIndex % 2 === 0 ? -0.04 : 0.07)
    : 0;

  if (editState.shot === "A") {
    const ev = evaluateShot({
      dollyX: editState.cleanRescue ? 1.25 : 0.66,
      aperture: 2.2,
      focalMm: 50,
      uFgOverride: editState.cleanRescue ? -0.5 : 0.055 + shift,
      vOffset: vShift,
    });
    renderCinemaFrame(editCanvas, ev, { showFg: !editState.cleanRescue, showCornerBrackets: true });
  } else {
    // 镜 B：对手反打（镜像方向：主角在左朝右看，前景对手在右缘）
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    const evB = evaluateShot({
      dollyX: editState.cleanRescue ? 1.25 : 0.66,
      aperture: 2.2,
      focalMm: 50,
      uFgOverride: editState.cleanRescue ? -0.5 : 0.06 - shift * 0.9,
      vOffset: -vShift * 0.8,
    });
    drawBackgroundLayer(ctx, W, H, { parallaxU: -0.03 });
    drawSubjectLayer(ctx, W, H);
    if (!editState.cleanRescue) {
      drawForegroundLayer(ctx, W, H, { polygon: evB.polygon, blurNorm: evB.optics.blurNorm });
    }
    ctx.restore();
  }

  // 顶部场记号与跳帧警示标（收进折角内，零重叠）
  const fs = Math.max(11, Math.round(H * 0.042));
  ctx.font = `800 ${fs}px "Archivo", "Noto Sans SC", sans-serif`;
  ctx.textBaseline = "top";
  const insetX = Math.max(18, Math.round(H * 0.08));
  const insetY = Math.max(14, Math.round(H * 0.065));
  const tag = editState.shot === "A" ? "SHOT A · 主角单人" : "SHOT B · 对手反打";
  const tw = ctx.measureText(tag).width + 16;
  ctx.fillStyle = "rgba(14, 16, 10, 0.86)";
  ctx.fillRect(insetX, insetY, tw, fs + 10);
  ctx.fillStyle = "#F2EAC6";
  ctx.fillText(tag, insetX + 8, insetY + 5);

  const statusTag = editState.cleanRescue
    ? "308 净单人 · 零穿帮"
    : editState.jitter
      ? `前景肩位偏移 ${shift >= 0 ? "+" : ""}${Math.round(shift * 100)}%`
      : "前景锁定";
  const sw = ctx.measureText(statusTag).width + 16;
  ctx.fillStyle = editState.cleanRescue ? "rgba(36, 51, 20, 0.9)" : editState.jitter ? "rgba(166, 42, 28, 0.92)" : "rgba(44, 46, 23, 0.88)";
  ctx.fillRect(W - sw - insetX, insetY, sw, fs + 10);
  ctx.fillStyle = "#FFF7EA";
  ctx.fillText(statusTag, W - sw - insetX + 8, insetY + 5);
}

let editDirty = true;
const editLoop = loop(editCanvas, (t, dt, { still }) => {
  if (!still && editState.autoPlay) {
    editState.timer += dt;
    if (editState.timer >= 1.15) {
      editState.timer = 0;
      editState.shot = editState.shot === "A" ? "B" : "A";
      if (editState.shot === "A") editState.takeIndex++;
      editDirty = true;
      updateEditReadout();
    }
  }
  if (!editDirty) return;
  editDirty = false;
  drawEditFrame();
});

function triggerCut() {
  editState.shot = editState.shot === "A" ? "B" : "A";
  if (editState.shot === "A") editState.takeIndex++;
  editDirty = true;
  updateEditReadout();
  editLoop.draw();
}

btnEditCut.addEventListener("click", triggerCut);
btnEditPlay.addEventListener("click", () => {
  editState.autoPlay = !editState.autoPlay;
  editState.timer = 0;
  btnEditPlay.setAttribute("aria-pressed", String(editState.autoPlay));
  btnEditPlay.textContent = editState.autoPlay ? "自动连切：开" : "自动连切：关";
  editDirty = true;
  editLoop.draw();
});
chkEditJitter.addEventListener("change", () => {
  editState.jitter = chkEditJitter.checked;
  editDirty = true;
  updateEditReadout();
  editLoop.draw();
});
chkEditClean.addEventListener("change", () => {
  editState.cleanRescue = chkEditClean.checked;
  editDirty = true;
  updateEditReadout();
  editLoop.draw();
});

/* ==================== 07 节：小练习（全四帧 ~20% 同面积盲测，共用 model.js） ==================== */
const quizCards = [...document.querySelectorAll(".quiz-card")];
const qvTitle = document.getElementById("qv-title");
const qvText = document.getElementById("qv-text");
const qvBreakdown = document.getElementById("qv-breakdown");
const btnQuizReset = document.getElementById("quiz-reset");

let quizAnswered = null;
const quizEvaluations = Object.fromEntries(
  PRACTICE_FRAMES.map((pf) => [pf.id, { ...pf, eval: evaluateShot(pf.params) }])
);

function renderQuiz() {
  for (const pf of PRACTICE_FRAMES) {
    const canvas = document.querySelector(`.quiz-canvas[data-quiz="${pf.id}"]`);
    const stat = document.querySelector(`.quiz-stat[data-stat="${pf.id}"]`);
    const card = document.querySelector(`.quiz-card[data-choice="${pf.id}"]`);
    const item = quizEvaluations[pf.id];

    renderCinemaFrame(canvas, item.eval, {
      showDiag: quizAnswered !== null,
      compactDiag: true,
      showCornerBrackets: true,
    });

    if (quizAnswered === null) {
      card.removeAttribute("data-result");
      card.setAttribute("aria-pressed", "false");
      stat.textContent = `按键 ${PRACTICE_FRAMES.indexOf(pf) + 1}`;
    } else {
      card.setAttribute("aria-pressed", String(quizAnswered === pf.id));
      if (pf.correct) card.dataset.result = "right";
      else if (quizAnswered === pf.id) card.dataset.result = "wrong";
      else card.removeAttribute("data-result");
      stat.textContent = `面积示意 ${item.eval.coveragePct}% · ${item.eval.passedCount}/3`;
    }
  }
}

function submitQuiz(id) {
  quizAnswered = id;
  const picked = quizEvaluations[id];
  if (picked.correct) {
    qvTitle.textContent = `选对了！${picked.label}（面积示意 ${picked.eval.coveragePct}%）三条几何条件全部成立`;
    qvText.textContent = picked.explain;
  } else {
    qvTitle.textContent = `${picked.label}（面积示意 ${picked.eval.coveragePct}%）未过关：${picked.shortVerdict}`;
    qvText.textContent = `${picked.explain} 正确答案是帧 C——四帧的遮挡面积都在 20%–21%（示意），决定成败的是肩头落侧、轮廓可辨与视线空间是否畅通。`;
  }

  qvBreakdown.hidden = false;
  btnQuizReset.hidden = false;
  qvBreakdown.innerHTML = PRACTICE_FRAMES.map((pf) => {
    const ev = quizEvaluations[pf.id].eval;
    const c = ev.conditions;
    const marks = `人像可辨${c.recognizable ? "✓" : "×"} · 不压视线${c.clearSpace ? "✓" : "×"} · 视线同侧${c.gazeSide ? "✓" : "×"}`;
    return `<li data-ok="${pf.correct}"><strong>${pf.label}（示意 ${ev.coveragePct}% · ${marks}）</strong>：${pf.explain}</li>`;
  }).join("");

  renderQuiz();
}

function resetQuiz() {
  quizAnswered = null;
  qvTitle.textContent = "先凭眼力点选一帧。";
  qvText.textContent = "选完后，四帧都会调用与开场相同的几何模型，同步叠绘视线走廊、肩头与后脑轮廓辨认线，以及实算的前景面积（示意）。";
  qvBreakdown.hidden = true;
  qvBreakdown.innerHTML = "";
  btnQuizReset.hidden = true;
  renderQuiz();
}

for (const card of quizCards) {
  card.addEventListener("click", () => submitQuiz(card.dataset.choice));
}
btnQuizReset.addEventListener("click", resetQuiz);

window.addEventListener("keydown", (e) => {
  if (document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
  if (!lightbox.hidden) return;
  const map = { "1": "A", "2": "B", "3": "C", "4": "D" };
  if (map[e.key]) {
    const sec07 = document.getElementById("sec-07");
    const r = sec07.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      submitQuiz(map[e.key]);
    }
  }
});

/* ==================== 08 节：原海报放大与拖拽灯箱 ==================== */
const posterBtn = document.getElementById("poster-btn");
const posterImg = document.getElementById("poster");
const lightbox = document.getElementById("lightbox");
const lbViewport = document.getElementById("lb-viewport");
const lbImg = document.getElementById("lb-img");
const lbScale = document.getElementById("lb-scale");
const lbZoomIn = document.getElementById("lb-zoom-in");
const lbZoomOut = document.getElementById("lb-zoom-out");
const lbClose = document.getElementById("lb-close");

const lb = { scale: 1, x: 0, y: 0, dragging: false, sx: 0, sy: 0 };

function applyLbTransform() {
  lbImg.style.transform = `translate(${lb.x}px, ${lb.y}px) scale(${lb.scale})`;
  lbScale.textContent = `${Math.round(lb.scale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.currentSrc || posterImg.src;
  lb.scale = 1.15;
  lb.x = 0;
  lb.y = 0;
  applyLbTransform();
  lightbox.hidden = false;
  posterBtn.setAttribute("aria-expanded", "true");
  lbClose.focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterBtn.setAttribute("aria-expanded", "false");
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbZoomIn.addEventListener("click", () => { lb.scale = clamp(lb.scale + 0.35, 0.8, 3.2); applyLbTransform(); });
lbZoomOut.addEventListener("click", () => { lb.scale = clamp(lb.scale - 0.35, 0.8, 3.2); applyLbTransform(); });

lbViewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  lb.scale = clamp(lb.scale + (e.deltaY < 0 ? 0.18 : -0.18), 0.8, 3.2);
  applyLbTransform();
}, { passive: false });

lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target === lbViewport) {
    closeLightbox();
    return;
  }
  lb.dragging = true;
  lb.sx = e.clientX - lb.x;
  lb.sy = e.clientY - lb.y;
  if (lbViewport.setPointerCapture) {
    try { lbViewport.setPointerCapture(e.pointerId); } catch {}
  }
});

lbViewport.addEventListener("pointermove", (e) => {
  if (!lb.dragging) return;
  lb.x = e.clientX - lb.sx;
  lb.y = e.clientY - lb.sy;
  applyLbTransform();
});

lbViewport.addEventListener("pointerup", () => { lb.dragging = false; });

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

/* ==================== 初始渲染 & 自适应重绘 ==================== */
function renderAllStatic() {
  heroDirty = true;
  peelDirty = true;
  editDirty = true;
  heroLoop.draw();
  peelLoop.draw();
  renderWipe();
  setEra(eraIdx);
  renderProp();
  renderLensBench();
  updateEditReadout();
  editLoop.draw();
  renderQuiz();
}

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderAllStatic, 80);
});

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(renderAllStatic);
}
renderAllStatic();

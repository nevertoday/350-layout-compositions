// 079 顶视构图 · 主交互逻辑
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  createInitialState,
  applyPreset,
  switchTheme,
  evaluate,
  applySingleFix,
  hitTestItem,
  clampItemToMat,
  shadowVector,
  QUIZ_QUESTIONS,
} from "./model.js";
import {
  drawTurntable,
  drawSec01Optics,
  drawSec02Layers,
  drawSec03Lighting,
  drawSec04History,
  drawSec05Matrix,
  drawQuizOption,
} from "./render.js";

function sizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = pixelRatio(2);
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// ==================== 1. 主角玩具：079 圆形俯拍静物转盘 ====================
const state = createInitialState("poster");
let heroDirty = true;
let heroIntro = 0;

const heroCanvas = document.getElementById("heroCanvas");
const pitchRange = document.getElementById("pitchRange");
const pitchVal = document.getElementById("pitchVal");
const hudOptics = document.getElementById("hudOptics");
const hudStatus = document.getElementById("hudStatus");
const levelBubble = document.getElementById("levelBubble");

const badgePlan = document.getElementById("badgePlan");
const badgeContour = document.getElementById("badgeContour");
const badgeZone = document.getElementById("badgeZone");
const badgeOrder = document.getElementById("badgeOrder");
const cardPlan = document.getElementById("cardPlan");
const cardContour = document.getElementById("cardContour");
const cardZone = document.getElementById("cardZone");
const cardOrder = document.getElementById("cardOrder");

const critiqueBox = document.getElementById("critiqueBox");
const critiqueTag = document.getElementById("critiqueTag");
const critiqueHead = document.getElementById("critiqueHead");
const critiqueBody = document.getElementById("critiqueBody");
const critiqueHint = document.getElementById("critiqueHint");
const btnSingleFix = document.getElementById("btnSingleFix");
const mRound = document.getElementById("mRound");
const mGap = document.getElementById("mGap");
const mCom = document.getElementById("mCom");
const mShadow = document.getElementById("mShadow");

const btnContourMode = document.getElementById("btnContourMode");
const btnZoneOverlay = document.getElementById("btnZoneOverlay");
const btnOrderOverlay = document.getElementById("btnOrderOverlay");
const btnLightMode = document.getElementById("btnLightMode");

const kpEls = {
  center: [document.getElementById("kpCenter"), document.getElementById("kpCenterStat")],
  density: [document.getElementById("kpDensity"), document.getElementById("kpDensityStat")],
  align: [document.getElementById("kpAlign"), document.getElementById("kpAlignStat")],
  scale: [document.getElementById("kpScale"), document.getElementById("kpScaleStat")],
};

let lastFixType = "";

function syncHeroUI(res) {
  pitchRange.value = String(Math.round(state.pitchDeg));
  pitchVal.textContent = `${Math.round(state.pitchDeg)}°`;
  hudOptics.textContent = `${Math.round(state.pitchDeg)}° · ${state.focalMm}mm · 圆度 ${res.roundnessPct}%`;
  hudStatus.textContent = res.statusBadge;
  hudStatus.classList.toggle("is-ok", res.passCount === 4);
  hudStatus.classList.toggle("is-warn", res.passCount < 4);

  // 自示范水平仪气泡：90° 归中 y=20，斜拍时偏移向下
  const bubbleOffset = ((90 - state.pitchDeg) / 52) * 11;
  levelBubble.setAttribute("cy", (20 + bubbleOffset).toFixed(1));
  levelBubble.setAttribute("fill", state.pitchDeg >= 84 ? "#184733" : "#E6AB1B");

  // 四角要素卡状态
  badgePlan.textContent = res.pillars.plan.badge;
  badgeContour.textContent = res.pillars.contour.badge;
  badgeZone.textContent = res.pillars.zone.badge;
  badgeOrder.textContent = res.pillars.order.badge;
  cardPlan.classList.toggle("is-ok", res.pillars.plan.ok);
  cardContour.classList.toggle("is-ok", res.pillars.contour.ok);
  cardZone.classList.toggle("is-ok", res.pillars.zone.ok);
  cardOrder.classList.toggle("is-ok", res.pillars.order.ok);

  // 焦段按钮
  document.querySelectorAll("[data-focal]").forEach((btn) => {
    const active = Number(btn.dataset.focal) === state.focalMm;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  // 叠加层与棚灯按钮
  btnContourMode.classList.toggle("is-active", state.contourMode);
  btnContourMode.setAttribute("aria-pressed", String(state.contourMode));
  btnContourMode.textContent = state.contourMode ? "返回彩色实体视图" : "开启纯轮廓剪影透视";

  btnZoneOverlay.classList.toggle("is-active", state.showZone);
  btnZoneOverlay.setAttribute("aria-pressed", String(state.showZone));

  btnOrderOverlay.classList.toggle("is-active", state.showOrder);
  btnOrderOverlay.setAttribute("aria-pressed", String(state.showOrder));
  btnOrderOverlay.textContent = state.showOrder ? "隐藏 3×3 对齐网格" : "显示 3×3 对齐网格";

  const isSoftGood = state.lightSoft && state.lightElev >= 45;
  btnLightMode.textContent = isSoftGood ? "高柔光" : "低硬光";
  btnLightMode.classList.toggle("is-active", isSoftGood);
  btnLightMode.classList.toggle("is-warn", !isSoftGood);
  btnLightMode.setAttribute("aria-pressed", String(isSoftGood));

  // 单真源评注单
  critiqueBox.classList.toggle("is-ok", res.passCount === 4);
  critiqueTag.textContent = res.passCount === 4 ? `${res.statusBadge} · 4/4` : `待校准 · ${res.passCount}/4`;
  critiqueHead.textContent = res.headline;
  critiqueBody.textContent = res.body;
  critiqueHint.textContent = res.hint;
  lastFixType = res.fixType;
  if (res.fixType) {
    btnSingleFix.hidden = false;
    btnSingleFix.textContent = res.fixLabel;
  } else {
    btnSingleFix.hidden = true;
  }

  mRound.textContent = `${res.roundnessPct}%`;
  mGap.textContent = `${res.minGapMm}mm`;
  mCom.textContent = `${res.comOffsetPct}%`;
  mShadow.textContent = `${res.shadowRatio}×`;

  // 底沿四项要点实况带
  for (const [k, [box, stat]] of Object.entries(kpEls)) {
    box.classList.toggle("is-ok", res.keypoints[k].ok);
    stat.textContent = res.keypoints[k].read;
  }
}

const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  const nextIntro = still ? 1 : Math.min(1, t / 0.85);
  if (Math.abs(nextIntro - heroIntro) > 0.002) {
    heroIntro = nextIntro;
    heroDirty = true;
  }
  if (!heroDirty && !still) return;
  heroDirty = false;
  const { ctx, w, h } = sizeCanvas(heroCanvas);
  const res = evaluate(state);
  drawTurntable(ctx, w, h, state, res, { intro: heroIntro, interactive: true });
  syncHeroUI(res);
});

function refreshHero() {
  heroDirty = true;
  heroLoop.draw();
}

// 指针与触摸拖拽（点中器物直拖摆位；点中空白横拖摇臂俯角，同时支持 perf.mjs 触屏测试）
let dragInfo = null;

function clientToNorm(clientX, clientY) {
  const rect = heroCanvas.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height);
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const R = size * 0.43;
  const sinA = Math.sin((state.pitchDeg * Math.PI) / 180);
  const nx = (clientX - cx) / R;
  const ny = (clientY - cy) / (R * Math.max(0.4, sinA));
  return { nx, ny, px: clientX - rect.left, py: clientY - rect.top };
}

heroCanvas.addEventListener("pointerdown", (e) => {
  const pt = clientToNorm(e.clientX, e.clientY);
  const hit = hitTestItem(state.items, pt.nx, pt.ny);
  if (hit >= 0) {
    state.selectedIndex = hit;
    const it = state.items[hit];
    dragInfo = {
      mode: "item",
      pointerId: e.pointerId,
      itemIdx: hit,
      offX: it.x - pt.nx,
      offY: it.y - pt.ny,
      startX: e.clientX,
      startY: e.clientY,
    };
    heroCanvas.setPointerCapture(e.pointerId);
    refreshHero();
  } else {
    dragInfo = {
      mode: "pitch",
      pointerId: e.pointerId,
      startX: e.clientX,
      startPitch: state.pitchDeg,
    };
    heroCanvas.setPointerCapture(e.pointerId);
  }
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!dragInfo || dragInfo.pointerId !== e.pointerId) return;
  if (dragInfo.mode === "item") {
    const pt = clientToNorm(e.clientX, e.clientY);
    const it = state.items[dragInfo.itemIdx];
    it.x = pt.nx + dragInfo.offX;
    it.y = pt.ny + dragInfo.offY;
    clampItemToMat(it, 0.87);
    refreshHero();
  } else if (dragInfo.mode === "pitch") {
    const dx = e.clientX - dragInfo.startX;
    const next = Math.max(38, Math.min(90, Math.round(dragInfo.startPitch + dx * 0.28)));
    if (next !== state.pitchDeg) {
      state.pitchDeg = next;
      refreshHero();
    } else {
      // 拖动中即使刚好停在 90° 也刷新当前帧反馈
      refreshHero();
    }
  }
});

function endDrag(e) {
  if (!dragInfo || (e && dragInfo.pointerId !== e.pointerId)) return;
  dragInfo = null;
}
heroCanvas.addEventListener("pointerup", endDrag);
heroCanvas.addEventListener("pointercancel", endDrag);

// 兼容原生触摸（确保 perf.mjs 的 Input.dispatchTouchEvent 顺滑触发重绘）
let touchDrag = null;
heroCanvas.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) return;
  const t0 = e.touches[0];
  const pt = clientToNorm(t0.clientX, t0.clientY);
  const hit = hitTestItem(state.items, pt.nx, pt.ny);
  if (hit >= 0) {
    state.selectedIndex = hit;
    const it = state.items[hit];
    touchDrag = { mode: "item", itemIdx: hit, offX: it.x - pt.nx, offY: it.y - pt.ny, sx: t0.clientX, sy: t0.clientY, locked: false };
  } else {
    touchDrag = { mode: "pitch", sx: t0.clientX, sy: t0.clientY, startPitch: state.pitchDeg, locked: false };
  }
}, { passive: true });

heroCanvas.addEventListener("touchmove", (e) => {
  if (!touchDrag || e.touches.length !== 1) return;
  const t0 = e.touches[0];
  const dx = t0.clientX - touchDrag.sx;
  const dy = t0.clientY - touchDrag.sy;
  if (!touchDrag.locked) {
    if (Math.abs(dx) > 5 || (touchDrag.mode === "item" && Math.abs(dx) >= Math.abs(dy))) {
      touchDrag.locked = true;
    } else if (Math.abs(dy) > 10) {
      touchDrag = null; // 放行竖向滚动页面
      return;
    } else {
      return;
    }
  }
  e.preventDefault();
  if (touchDrag.mode === "item") {
    const pt = clientToNorm(t0.clientX, t0.clientY);
    const it = state.items[touchDrag.itemIdx];
    it.x = pt.nx + touchDrag.offX;
    it.y = pt.ny + touchDrag.offY;
    clampItemToMat(it, 0.87);
    refreshHero();
  } else {
    state.pitchDeg = Math.max(38, Math.min(90, Math.round(touchDrag.startPitch + dx * 0.28)));
    refreshHero();
  }
}, { passive: false });

heroCanvas.addEventListener("touchend", () => { touchDrag = null; });
heroCanvas.addEventListener("touchcancel", () => { touchDrag = null; });

// 键盘操控（方向键移位、R 旋转、0 归正、[ ] 调俯角、Space 切换选中器物）
heroCanvas.addEventListener("keydown", (e) => {
  const it = state.items[state.selectedIndex];
  if (!it) return;
  const step = 0.045;
  let handled = true;
  if (e.key === "ArrowLeft") it.x -= step;
  else if (e.key === "ArrowRight") it.x += step;
  else if (e.key === "ArrowUp") it.y -= step;
  else if (e.key === "ArrowDown") it.y += step;
  else if (e.key === "r" || e.key === "R") it.rot = (it.rot + 15) % 360;
  else if (e.key === "0") it.rot = 0;
  else if (e.key === "[") state.pitchDeg = Math.max(38, state.pitchDeg - 2);
  else if (e.key === "]") state.pitchDeg = Math.min(90, state.pitchDeg + 2);
  else if (e.key === " ") state.selectedIndex = (state.selectedIndex + 1) % state.items.length;
  else handled = false;
  if (handled) {
    e.preventDefault();
    clampItemToMat(it, 0.87);
    refreshHero();
  }
});

// 按钮与滑轨绑定
pitchRange.addEventListener("input", () => {
  state.pitchDeg = Number(pitchRange.value);
  refreshHero();
});

document.getElementById("btnRotate").addEventListener("click", () => {
  const it = state.items[state.selectedIndex];
  if (it) {
    it.rot = (it.rot + 15) % 360;
    refreshHero();
  }
});

document.getElementById("btnZeroRot").addEventListener("click", () => {
  const it = state.items[state.selectedIndex];
  if (it) {
    it.rot = 0;
    refreshHero();
  }
});

document.querySelectorAll("[data-focal]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.focalMm = Number(btn.dataset.focal);
    refreshHero();
  });
});

document.querySelectorAll("[data-theme]").forEach((btn) => {
  btn.addEventListener("click", () => {
    switchTheme(state, btn.dataset.theme);
    document.querySelectorAll("[data-theme]").forEach((b) => {
      const act = b === btn;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-pressed", String(act));
    });
    refreshHero();
  });
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    applyPreset(state, btn.dataset.preset);
    refreshHero();
  });
});

btnContourMode.addEventListener("click", () => {
  state.contourMode = !state.contourMode;
  refreshHero();
});

btnZoneOverlay.addEventListener("click", () => {
  state.showZone = !state.showZone;
  refreshHero();
});

btnOrderOverlay.addEventListener("click", () => {
  state.showOrder = !state.showOrder;
  refreshHero();
});

btnLightMode.addEventListener("click", () => {
  const isSoftGood = state.lightSoft && state.lightElev >= 45;
  if (isSoftGood) {
    state.lightElev = 20;
    state.lightSoft = false;
  } else {
    state.lightElev = 62;
    state.lightSoft = true;
  }
  refreshHero();
});

btnSingleFix.addEventListener("click", () => {
  if (!lastFixType) return;
  applySingleFix(state, lastFixType);
  refreshHero();
});

// ==================== 2. 第 01 节：四档机位剖面对照 ====================
const SEC01_PRESETS = [
  { pitchDeg: 45, focalMm: 50, ok: false, note: "斜拍露侧壁", caption: "45° 斜拍时圆碗压扁至 71% 椭圆，椅背与桌侧厚大面积露馅，眼睛看到的是立体餐桌而非平面图形。" },
  { pitchDeg: 70, focalMm: 50, ok: false, note: "微斜仍偏扁", caption: "70° 半俯看着接近顶视，圆碗仍有 6% 压扁且桌腿与高杯侧壁仍微微错开——差最后 20°，平面秩序总显得不够利落。" },
  { pitchDeg: 90, focalMm: 24, ok: false, note: "广角边沿外翻", caption: "机位虽已垂直 90°，但 24mm 广角离桌面太近，四把椅背和右上角高杯仍向四周外翻露出侧壁。" },
  { pitchDeg: 90, focalMm: 50, ok: true, note: "标准平面还原", caption: "90° 垂直配合 50mm 标准定焦，圆碗回到 100% 真圆，椅背与方桌边缘平直工整，真正进入平面设计语境。" },
];
let sec01Idx = 0;
const sec01Canvas = document.getElementById("sec01Canvas");
const sec01Caption = document.getElementById("sec01Caption");

function renderSec01() {
  const { ctx, w, h } = sizeCanvas(sec01Canvas);
  drawSec01Optics(ctx, w, h, SEC01_PRESETS[sec01Idx]);
  sec01Caption.textContent = SEC01_PRESETS[sec01Idx].caption;
}

document.querySelectorAll("[data-opt]").forEach((btn) => {
  btn.addEventListener("click", () => {
    sec01Idx = Number(btn.dataset.opt);
    document.querySelectorAll("[data-opt]").forEach((b) => {
      const act = b === btn;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-pressed", String(act));
    });
    renderSec01();
  });
});

// ==================== 3. 第 02 节：四层测绘描图纸 ====================
const sec02Canvas = document.getElementById("sec02Canvas");
const sec02Caption = document.getElementById("sec02Caption");
const chkSolid = document.getElementById("chkSolid");
const chkContour = document.getElementById("chkContour");
const chkZone = document.getElementById("chkZone");
const chkOrder = document.getElementById("chkOrder");

function renderSec02() {
  const layers = {
    solid: chkSolid.checked,
    contour: chkContour.checked,
    zone: chkZone.checked,
    order: chkOrder.checked,
  };
  const { ctx, w, h } = sizeCanvas(sec02Canvas);
  drawSec02Layers(ctx, w, h, layers);

  const active = [];
  if (layers.solid) active.push("实体静物");
  if (layers.contour) active.push("纯轮廓剪影");
  if (layers.zone) active.push("分区与重心");
  if (layers.order) active.push("3×3 秩序网");
  const posterEval = evaluate({
    items: state.themeId === "poster" ? state.items : createInitialState("poster").items,
    pitchDeg: 90,
    focalMm: 50,
    lightElev: 62,
    lightAzim: 42,
    lightSoft: true,
  });
  if (!active.length) {
    sec02Caption.textContent = "全部图层已关闭；勾选任意一层即可单独审视顶视构图的内部骨架。";
  } else if (!layers.solid && layers.contour) {
    sec02Caption.textContent = "纯轮廓剪影视角：拿掉色彩与材质后，方、圆、星芒与细条的形状对比和留白缝隙一览无余。";
  } else {
    sec02Caption.textContent = `当前叠显：${active.join(" + ")}。原海报六件静物最大与最小面积比达 ${posterEval.sizeRatio}×，大小主次分明。`;
  }
}

[chkSolid, chkContour, chkZone, chkOrder].forEach((el) => el.addEventListener("change", renderSec02));

// ==================== 4. 第 03 节：暗室 360° 布光罗盘 ====================
const sec03Canvas = document.getElementById("sec03Canvas");
const sec03Readout = document.getElementById("sec03Readout");
const sec03Verdict = document.getElementById("sec03Verdict");
const sec03Desc = document.getElementById("sec03Desc");
const btnSec03Soft = document.getElementById("btnSec03Soft");
const btnSec03Hard = document.getElementById("btnSec03Hard");

const lightState = { azim: 222, elev: 58, soft: true }; // 光源在左上 222°，影子投向右下 42°
let sec03Geom = null;

function renderSec03() {
  const { ctx, w, h } = sizeCanvas(sec03Canvas);
  sec03Geom = drawSec03Lighting(ctx, w, h, lightState);
  const sv = shadowVector(0.18, lightState.elev, (lightState.azim + 180) % 360);
  const ratio = (sv.len / 0.18).toFixed(2);
  const isBad = lightState.elev < 38 && !lightState.soft;
  const isFlat = lightState.elev >= 76;

  sec03Readout.classList.toggle("is-err", isBad);
  if (isBad) {
    sec03Verdict.textContent = `低角 ${Math.round(lightState.elev)}° 硬光 · 影长比 ${ratio}×（跨界串扰）`;
    sec03Desc.textContent = "生硬的长黑影跨越留白缝隙，把原本独立的器物轮廓连成暗块，桌面立刻显得杂乱。";
  } else if (isFlat) {
    sec03Verdict.textContent = `高顶 ${Math.round(lightState.elev)}° 近无影 · 影长比 ${ratio}×（极度平面）`;
    sec03Desc.textContent = "几乎没有外延投影，适合纯信息图式拍摄；但若用硬灯正顶直打，亮面器皿容易出现惨白反光。";
  } else {
    sec03Verdict.textContent = `${Math.round(lightState.elev)}° ${lightState.soft ? "高侧柔光" : "高位硬光"} · 影长比 ${ratio}×（边界清晰）`;
    sec03Desc.textContent = lightState.soft
      ? "短而柔和的淡影稳贴物体底沿，既交代出器物厚薄，又守住白纸负空间的清透秩序。"
      : "虽然影长可控，但硬光边缘偏锐；切到「柔光箱 SOFT」可让台面过渡更细腻。";
  }

  btnSec03Soft.classList.toggle("is-active", lightState.soft);
  btnSec03Soft.setAttribute("aria-pressed", String(lightState.soft));
  btnSec03Hard.classList.toggle("is-active", !lightState.soft);
  btnSec03Hard.setAttribute("aria-pressed", String(!lightState.soft));
}

let draggingLight = false;
function updateLightFromPointer(clientX, clientY) {
  if (!sec03Geom) return;
  const rect = sec03Canvas.getBoundingClientRect();
  const px = clientX - rect.left;
  const py = clientY - rect.top;
  const dx = px - sec03Geom.cx;
  const dy = py - sec03Geom.cy;
  const az = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
  const distNorm = Math.hypot(dx, dy) / sec03Geom.R;
  const clamped = Math.max(0.80, Math.min(1.14, distNorm));
  const elev = 82 - ((clamped - 0.80) / (1.14 - 0.80)) * (82 - 16);
  lightState.azim = az;
  lightState.elev = Math.max(16, Math.min(82, elev));
  renderSec03();
}

sec03Canvas.addEventListener("pointerdown", (e) => {
  draggingLight = true;
  sec03Canvas.setPointerCapture(e.pointerId);
  updateLightFromPointer(e.clientX, e.clientY);
});
sec03Canvas.addEventListener("pointermove", (e) => {
  if (!draggingLight) return;
  updateLightFromPointer(e.clientX, e.clientY);
});
sec03Canvas.addEventListener("pointerup", () => { draggingLight = false; });
sec03Canvas.addEventListener("pointercancel", () => { draggingLight = false; });

btnSec03Soft.addEventListener("click", () => { lightState.soft = true; renderSec03(); });
btnSec03Hard.addEventListener("click", () => { lightState.soft = false; renderSec03(); });

document.querySelectorAll("[data-light]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.light;
    if (k === "studio") { lightState.azim = 222; lightState.elev = 58; lightState.soft = true; }
    else if (k === "lowHard") { lightState.azim = 210; lightState.elev = 20; lightState.soft = false; }
    else if (k === "zenith") { lightState.azim = 240; lightState.elev = 82; lightState.soft = true; }
    renderSec03();
  });
});

// ==================== 5. 第 04 节：历史源流四时代 ====================
const ERAS = {
  vitruvius: {
    latin: "De architectura, Book I, Ch. 2 — Ichnographia",
    title: "从地面足迹开始：建筑平面图的诞生",
    body: "古罗马建筑师维特鲁威在《建筑十书》（约公元前 1 世纪）第一卷第二章中，把建筑图法划为三种：平面图（ichnographia，原意即「足迹描绘」）、立面图（orthographia）与透视图（scenographia）。用圆规和直尺把整栋建筑垂直投射到水平面上，让墙体、柱列与空间动线一眼看穿——这就是今天一切顶视构图的源头。",
    cite: "核实出处：芝加哥大学 LacusCurtius《De architectura》I.2.2 原文与英译本。",
  },
  moholy: {
    latin: "László Moholy-Nagy — From the Radio Tower, Berlin (1928)",
    title: "1928 包豪斯「新视觉」：高空垂直拍出几何抽象",
    body: "匈牙利裔包豪斯教授莫霍利-纳吉登上 1926 年落成的柏林无线电塔，把镜头垂直向下指向地面，拍出著名的《从柏林无线电塔》（1928）。告别习惯性的平视后，地面的积雪、通道与圆亭脱去了日常叙事，直接转化为锋利的几何色块与斜线秩序。",
    cite: "核实出处：纽约现代艺术博物馆藏品（485.1939）与大都会艺术博物馆藏品（2005.100.444）。",
  },
  berkeley: {
    latin: "Busby Berkeley — Footlight Parade (1933)",
    title: "1933 银幕万花筒：悬于舞台正上方的几何编舞",
    body: "好莱坞编舞导演巴斯比·伯克利在 1933 年歌舞片《华清春暖》（Footlight Parade，劳埃德·培根执导）的「瀑布旁」等名段中，把摄影机直接吊在巨型水池与舞台正上方，让上百名舞者脱离剧场前排座位视角，在 90° 顶视下聚散成万花筒般的纯平面图案。",
    cite: "核实出处：不列颠百科全书《Footlight Parade》（1933）条目与美国国家电影目录（1992 年入选）。",
  },
  knolling: {
    latin: "Andrew Kromelow (1987) · Tom Sachs (2010) · Todd McLellan (2013)",
    title: "从工坊整理术 Knolling 到当代 Flat Lay 拆解潮",
    body: "1987 年，在建筑师弗兰克·盖里家具工坊工作的安德鲁·克罗梅洛受 Knoll 家具方正直角启发，习惯每天收工前把工具按平行或 90° 摆齐，称为「Knolling」。同工坊出身的艺术家汤姆·萨克斯在 2010 年短片《十条戒律》（Ten Bullets）将其写入第八条「Always Be Knolling」；2013 年加拿大摄影师托德·麦克莱伦出版《万物拆解》（Things Come Apart），把拆散的钟表与相机零件正顶排阵，将这门秩序美学推向全球视觉文化。",
    cite: "核实出处：Tom Sachs 官方工作室档案（Ten Bullets, 2010）与史密森尼巡展（SITES: Things Come Apart）。",
  },
};

let activeEra = "vitruvius";
const sec04Canvas = document.getElementById("sec04Canvas");
const eraCopy = document.getElementById("eraCopy");

function updateEraCopy() {
  const e = ERAS[activeEra];
  eraCopy.querySelector(".era-latin").textContent = e.latin;
  document.getElementById("eraTitle").textContent = e.title;
  document.getElementById("eraBody").textContent = e.body;
  document.getElementById("eraCite").textContent = e.cite;
}

const sec04Loop = loop(sec04Canvas, (t, dt, { still }) => {
  if (activeEra !== "berkeley" && t > 0 && !still) return;
  const { ctx, w, h } = sizeCanvas(sec04Canvas);
  drawSec04History(ctx, w, h, activeEra, still ? 0 : t);
});

document.querySelectorAll("[data-era]").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeEra = btn.dataset.era;
    document.querySelectorAll("[data-era]").forEach((b) => {
      const act = b === btn;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-selected", String(act));
    });
    updateEraCopy();
    const { ctx, w, h } = sizeCanvas(sec04Canvas);
    drawSec04History(ctx, w, h, activeEra, 0);
  });
});

// ==================== 6. 第 05 节：六题材双轴适配决策器 ====================
const TOPICS = [
  { id: "coffee", name: "手冲步骤", planNeed: 0.80, elevNeed: 0.23, fit: true, title: "适合顶视 · 手冲步骤与餐饮菜谱", body: "滤杯、秤、注水壶与咖啡豆在同一台面上展开，90° 顶视能把所有器材、比例和动作先后顺序一次摊清。" },
  { id: "teardown", name: "相机拆解", planNeed: 0.90, elevNeed: 0.11, fit: true, title: "极适合顶视 · 器物拆解与开箱清单", body: "几十个零配件按大小与材质排成 90° 矩阵，无任何前后遮挡，是 Knolling 秩序美感的主场。" },
  { id: "floorplan", name: "餐厅动线", planNeed: 0.65, elevNeed: 0.37, fit: true, title: "适合顶视 · 室内平面与动线规划", body: "桌椅间距、通道宽度与功能分区属于纯水平空间关系，垂直平面图能提供零失真的比例参考。" },
  { id: "vase", name: "曲线花瓶", planNeed: 0.24, elevNeed: 0.80, fit: false, title: "不建议顶视 · 曲线花瓶与高脚杯", body: "花瓶最迷人的收腰曲线和高度比例全在立面上，正顶看只剩一圈瓶口；改用 080 平视构图或微低仰拍才显造型。" },
  { id: "portrait", name: "人物访谈", planNeed: 0.16, elevNeed: 0.92, fit: false, title: "不建议顶视 · 人物肖像与平等访谈", body: "垂直俯拍人物会压扁五官与神态，且容易带来审视和孤立的监控感；平等对话应优先选用 080 平视构图。" },
  { id: "canyon", name: "峡谷远景", planNeed: 0.36, elevNeed: 0.68, fit: false, title: "不建议纯顶视 · 层叠峡谷与大景纵深", body: "山峦纵深依靠近中远层次与空气明度渐变；改用 077 鸟瞰构图、082 空气透视或 086 深空间构图更能留住气势。" },
];

let activeTopic = "coffee";
const sec05Canvas = document.getElementById("sec05Canvas");
const topicVerdict = document.getElementById("topicVerdict");
const topicVerdictTitle = document.getElementById("topicVerdictTitle");
const topicVerdictBody = document.getElementById("topicVerdictBody");

function renderSec05() {
  const { ctx, w, h } = sizeCanvas(sec05Canvas);
  drawSec05Matrix(ctx, w, h, TOPICS, activeTopic);
  const t = TOPICS.find((x) => x.id === activeTopic) || TOPICS[0];
  topicVerdict.classList.toggle("is-avoid", !t.fit);
  topicVerdictTitle.textContent = t.title;
  topicVerdictBody.textContent = t.body;
}

document.querySelectorAll("[data-topic]").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeTopic = btn.dataset.topic;
    document.querySelectorAll("[data-topic]").forEach((b) => {
      const act = b === btn;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-pressed", String(act));
    });
    renderSec05();
  });
});

// ==================== 7. 第 06 节：双题单变量盲测练习 ====================
let quizIdx = 0;
let quizAnswered = null;
const quizTag = document.getElementById("quizTag");
const quizPrompt = document.getElementById("quizPrompt");
const quizFeedback = document.getElementById("quizFeedback");
const quizFbTitle = document.getElementById("quizFbTitle");
const quizFbSelected = document.getElementById("quizFbSelected");
const quizBreakdown = document.getElementById("quizBreakdown");
const quizCards = [...document.querySelectorAll(".quiz-card")];

function renderQuiz() {
  const q = QUIZ_QUESTIONS[quizIdx];
  quizTag.textContent = q.tag;
  quizPrompt.textContent = q.prompt;

  quizCards.forEach((card, i) => {
    const opt = q.options[i];
    card.classList.remove("is-right", "is-wrong");
    if (quizAnswered) {
      if (opt.key === q.correct) card.classList.add("is-right");
      else if (opt.key === quizAnswered) card.classList.add("is-wrong");
    }
    const cvs = card.querySelector("canvas");
    const { ctx, w, h } = sizeCanvas(cvs);
    drawQuizOption(ctx, w, h, opt.mode);
  });

  if (!quizAnswered) {
    quizFeedback.hidden = true;
  } else {
    const picked = q.options.find((o) => o.key === quizAnswered);
    const right = quizAnswered === q.correct;
    quizFeedback.hidden = false;
    quizFeedback.classList.toggle("is-wrong", !right);
    quizFbTitle.textContent = right ? `判断准确：选项 ${q.correct} 成立` : `再对比看看：你选了 ${quizAnswered}，更稳的是选项 ${q.correct}`;
    quizFbSelected.textContent = picked ? `选项 ${picked.key} 解析：${picked.reason}` : "";
    quizBreakdown.innerHTML = q.options
      .map((o) => `<li><strong>${o.key}${o.key === q.correct ? "（成立）" : ""}</strong>：${o.reason}</li>`)
      .join("");
  }
}

quizCards.forEach((card) => {
  card.addEventListener("click", () => {
    quizAnswered = card.dataset.choice;
    renderQuiz();
  });
});

document.querySelectorAll("[data-q]").forEach((btn) => {
  btn.addEventListener("click", () => {
    quizIdx = Number(btn.dataset.q);
    quizAnswered = null;
    document.querySelectorAll("[data-q]").forEach((b) => {
      const act = b === btn;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-pressed", String(act));
    });
    renderQuiz();
  });
});

// ==================== 8. 第 07 节：原海报高清灯箱（缩放 + 拖拽 + Esc） ====================
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbViewport = document.getElementById("lbViewport");
const lbZoomVal = document.getElementById("lbZoomVal");
let lbScale = 1, lbX = 0, lbY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbZoomVal.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.getAttribute("src")) {
    lbImg.src = document.getElementById("poster").src;
  }
  lbScale = 1; lbX = 0; lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  document.getElementById("lbClose").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
}

document.getElementById("openLightbox").addEventListener("click", openLightbox);
document.getElementById("lbClose").addEventListener("click", closeLightbox);
document.getElementById("lbZoomIn").addEventListener("click", () => { lbScale = Math.min(3, +(lbScale + 0.35).toFixed(2)); applyLbTransform(); });
document.getElementById("lbZoomOut").addEventListener("click", () => { lbScale = Math.max(1, +(lbScale - 0.35).toFixed(2)); if (lbScale === 1) { lbX = 0; lbY = 0; } applyLbTransform(); });
document.getElementById("lbReset").addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLbTransform(); });

lightbox.addEventListener("click", (e) => {
  if (e.target === lbViewport) closeLightbox();
});

lbViewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.2 : -0.2;
  lbScale = Math.max(1, Math.min(3, +(lbScale + delta).toFixed(2)));
  if (lbScale === 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
}, { passive: false });

let lbDrag = null;
lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target !== lbImg) return;
  lbDrag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: lbX, oy: lbY };
  lbViewport.setPointerCapture(e.pointerId);
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag || lbDrag.id !== e.pointerId) return;
  lbX = lbDrag.ox + (e.clientX - lbDrag.sx);
  lbY = lbDrag.oy + (e.clientY - lbDrag.sy);
  applyLbTransform();
});
lbViewport.addEventListener("pointerup", () => { lbDrag = null; });
lbViewport.addEventListener("pointercancel", () => { lbDrag = null; });

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ==================== 9. 初始绘制与自适应重绘 ====================
function redrawAll() {
  refreshHero();
  renderSec01();
  renderSec02();
  renderSec03();
  updateEraCopy();
  sec04Loop.draw();
  renderSec05();
  renderQuiz();
}

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(redrawAll, 60);
});

redrawAll();

// 082 空气透视构图 · 主交互模块
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  AIRLIGHTS,
  PRESETS,
  SCENES,
  applySingleStepFix,
  clamp,
  computeLayerColor,
  createInitialState,
  evaluateAtmosphere,
  hslToRgb,
  rgbToHex,
  rgbToLuma,
  sampleOpticalPath,
} from "./model.js";
import { drawCompactLandscape, drawHeroScene, hitTestLayer, warmHeroDragSprites } from "./scene.js";

// ==================== 辅助：高清 Canvas 尺寸同步 ====================
function fitCanvas(canvas, cssW, cssH, maxDpr = 2) {
  const dpr = pixelRatio(maxDpr);
  const w = Math.max(1, Math.round(cssW * dpr));
  const h = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: cssW, h: cssH, dpr };
}

// ==================== HERO 主舞台状态与单真源联动 ====================
let state = createInitialState();
let lastEval = evaluateAtmosphere(state);
let animTurbidity = state.turbidity; // 平滑缓动展示（reducedMotion 一步到位）

const heroCanvas = document.getElementById("hero-canvas");
const statusPill = document.getElementById("hero-status-pill");
const hudBeta = document.getElementById("hud-beta");
const hudVis = document.getElementById("hud-vis");
const hudAir = document.getElementById("hud-air");

const ctrlTurbidity = document.getElementById("ctrl-turbidity");
const valTurbidity = document.getElementById("val-turbidity");
const ctrlLayerTone = document.getElementById("ctrl-layer-tone");
const valLayerTone = document.getElementById("val-layer-tone");
const labelLayerTone = document.getElementById("label-layer-tone");
const ctrlLayerSat = document.getElementById("ctrl-layer-sat");
const valLayerSat = document.getElementById("val-layer-sat");
const labelLayerSat = document.getElementById("label-layer-sat");

const diagBadge = document.getElementById("diag-badge");
const diagTitle = document.getElementById("diag-title");
const diagWhy = document.getElementById("diag-why");
const diagAction = document.getElementById("diag-action");
const btnStepFix = document.getElementById("btn-step-fix");
const spineGrade = document.getElementById("spine-grade");

const dotL1 = document.getElementById("dot-l1");
const dotL3 = document.getElementById("dot-l3");
const dotL5 = document.getElementById("dot-l5");
const nvfNearLuma = document.getElementById("nvf-near-luma");
const nvfNearSat = document.getElementById("nvf-near-sat");
const nvfFarLuma = document.getElementById("nvf-far-luma");
const nvfFarSat = document.getElementById("nvf-far-sat");

const sceneBtns = [...document.querySelectorAll(".scene-tab")];
const airBtns = [...document.querySelectorAll("[data-air]")];
const edgeBtns = [...document.querySelectorAll("[data-edge]")];
const layerChips = [...document.querySelectorAll(".layer-chip")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const btnResetBroken = document.getElementById("btn-reset-broken");
const btnToggleGuides = document.getElementById("btn-toggle-guides");

// 轻量 DOM 差分助手：值未变时不触发 DOM 写入与样式重算
function setText(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}
function setAttr(el, name, val) {
  if (el && el.getAttribute(name) !== val) el.setAttribute(name, val);
}
function setBg(el, val) {
  if (el && el.dataset._bg !== val) {
    el.dataset._bg = val;
    el.style.background = val;
  }
}

function syncHeroUI() {
  lastEval = evaluateAtmosphere(state);
  const e = lastEval;

  // 顶栏状态与画布 HUD
  setText(statusPill, e.verdict.badge);
  statusPill.classList.toggle("is-ok", e.isSolved);
  setText(hudBeta, `β = ${e.effBeta.toFixed(2)} /km`);
  setText(
    hudVis,
    Number.isFinite(e.visibilityKm) ? `能见度 ≈ ${e.visibilityKm.toFixed(1)} km` : "能见度 ∞（真空）"
  );
  setText(hudAir, e.air.label);

  // 场景、天光、锐度按钮高亮
  for (const b of sceneBtns) {
    const active = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", active);
    setAttr(b, "aria-selected", String(active));
  }
  for (const b of airBtns) b.classList.toggle("is-active", b.dataset.air === state.airlight);
  for (const b of edgeBtns) b.classList.toggle("is-active", b.dataset.edge === state.edgeMode);

  // 主滑轨
  const turbStr = String(state.turbidity);
  if (ctrlTurbidity.value !== turbStr) ctrlTurbidity.value = turbStr;
  setText(valTurbidity, `${e.effBeta.toFixed(2)} /km`);

  // 五层深度芯片与实时色块
  const invSet = new Set(e.inversions.map((v) => v.farIdx));
  layerChips.forEach((chip, i) => {
    const L = e.layers[i];
    chip.classList.toggle("is-selected", i === state.selectedLayer);
    chip.classList.toggle("is-inverted", invSet.has(i));
    setBg(chip.querySelector(".swatch"), L.hex);
    setText(chip.querySelectorAll("span")[1], `${L.code} ${L.name.slice(0, 2)}`);
    setText(chip.querySelector(".mono-mini"), `L${Math.round(L.luma)}%`);
  });

  // 选中层的明度/彩度微调
  const sel = e.layers[state.selectedLayer];
  const tb = Math.round((state.layerToneBias[state.selectedLayer] || 0) * 100);
  const sb = Math.round((state.layerSatBias[state.selectedLayer] || 0) * 100);
  setText(labelLayerTone, `${sel.code} ${sel.name} · 固有明度`);
  setText(valLayerTone, `${tb > 0 ? "+" : ""}${tb}%`);
  const tbStr = String(state.layerToneBias[state.selectedLayer] || 0);
  if (ctrlLayerTone.value !== tbStr) ctrlLayerTone.value = tbStr;

  setText(labelLayerSat, `${sel.code} ${sel.name} · 彩度偏置`);
  setText(valLayerSat, `${sb > 0 ? "+" : ""}${sb}%`);
  const sbStr = String(state.layerSatBias[state.selectedLayer] || 0);
  if (ctrlLayerSat.value !== sbStr) ctrlLayerSat.value = sbStr;

  // 切角盒：近远景对比色点与读数
  setBg(dotL1, e.near.hex);
  setBg(dotL3, e.mid.hex);
  setBg(dotL5, e.farPeak.hex);
  setText(nvfNearLuma, `明度 ${Math.round(e.near.luma)}%`);
  setText(nvfNearSat, `彩度 ${Math.round(e.near.sat)}%`);
  setText(nvfFarLuma, `明度 ${Math.round(e.farCity.luma)}–${Math.round(e.farPeak.luma)}%`);
  setText(nvfFarSat, `彩度 ${Math.round(e.farCity.sat)}%`);

  // 切角盒：单真源白话诊断
  setText(diagBadge, e.verdict.badge);
  diagBadge.classList.toggle("is-ok", e.isSolved);
  setText(diagTitle, e.verdict.title);
  setText(diagWhy, e.verdict.why);
  setText(diagAction, e.verdict.action);
  if (e.verdict.fixLabel) {
    if (btnStepFix.hidden) btnStepFix.hidden = false;
    setText(btnStepFix, e.verdict.fixLabel);
    btnStepFix.dataset.fixType = e.verdict.fixType;
  } else if (!btnStepFix.hidden) {
    btnStepFix.hidden = true;
  }

  // 右侧四要素圆徽实时视觉 + 状态更新
  setText(spineGrade, e.depthGrade);
  for (const el of e.elements) {
    const card = document.querySelector(`[data-focus-elem="${el.key}"]`);
    if (card) card.classList.toggle("is-ok", el.ok);
    setText(document.getElementById(`el-status-${el.key}`), el.status);
    setText(document.getElementById(`el-metric-${el.key}`), el.metric);
  }

  // 四枚圆徽内部图形随当前真实图层颜色同步变化
  setAttr(document.getElementById("orb-l-near"), "fill", e.near.hex);
  setAttr(document.getElementById("orb-l-mid"), "fill", e.mid.hex);
  setAttr(document.getElementById("orb-l-far"), "fill", e.farPeak.hex);
  setAttr(document.getElementById("orb-v-left"), "fill", e.near.hex);
  setAttr(document.getElementById("orb-v-right"), "fill", e.farPeak.hex);
  setAttr(document.getElementById("orb-s-1"), "fill", e.near.hex);
  setAttr(document.getElementById("orb-s-2"), "fill", e.mid.hex);
  setAttr(document.getElementById("orb-s-3"), "fill", e.farCity.hex);
  setAttr(document.getElementById("orb-atmo-dots"), "opacity", clamp(0.22 + e.effBeta * 3.1, 0.22, 1).toFixed(2));

  setAttr(btnToggleGuides, "aria-pressed", String(state.showDepthGuides));
}

// ---------- Hero 渲染循环（缓存画布尺寸杜绝强制同步回流 + rAF 合帧渲染，确保软渲染拖动 ≥ 45 fps） ----------
let heroNeedsDraw = true;
let heroUiDirty = false;
let dragInfo = null;
let heroCssW = 0;
let heroCssH = 0;

function measureHeroCanvas() {
  const r = heroCanvas.getBoundingClientRect();
  if (r.width >= 10 && r.height >= 10) {
    heroCssW = r.width;
    heroCssH = r.height;
  }
}
if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(measureHeroCanvas).observe(heroCanvas);
}

const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  if (heroUiDirty) {
    heroUiDirty = false;
    syncHeroUI();
  }

  const diff = state.turbidity - animTurbidity;
  const settling = Math.abs(diff) > 0.0005;
  if (still || !settling) {
    animTurbidity = state.turbidity;
  } else {
    animTurbidity += diff * Math.min(1, dt * 14);
  }

  if (!heroNeedsDraw && !settling && still) return;
  heroNeedsDraw = false;

  if (heroCssW < 10 || heroCssH < 10) measureHeroCanvas();
  if (heroCssW < 10 || heroCssH < 10) return;

  const isLiveDrag = !!(dragInfo && dragInfo.moved);
  const turbidityOnly = (isLiveDrag && dragInfo.axis === "x") || settling;
  // 保持画布缓冲尺寸恒定（绝不在起拖/松手时重改 canvas.width 导致 SwiftShader 重建显存缓冲）
  const { ctx, w, h, dpr } = fitCanvas(heroCanvas, heroCssW, heroCssH, 1.25);
  const renderState = settling ? { ...state, turbidity: animTurbidity } : state;
  const renderEval = settling ? evaluateAtmosphere(renderState) : lastEval;
  drawHeroScene(ctx, w, h, renderEval, renderState, t, still, {
    dpr,
    liveDrag: isLiveDrag || settling,
    turbidityOnly,
  });
});

// 首屏静置后 300ms 在后台预热双端精灵，确保首帧横拖零卡顿直达 60 fps
let warmTimer = 0;
function scheduleWarmSprites() {
  clearTimeout(warmTimer);
  warmTimer = setTimeout(() => {
    if (heroCssW >= 10 && heroCssH >= 10) {
      warmHeroDragSprites(heroCssW, heroCssH, pixelRatio(1.25), state);
    }
  }, 300);
}

function refreshHero(immediate = false) {
  if (immediate || reducedMotion.matches) animTurbidity = state.turbidity;
  heroUiDirty = false;
  syncHeroUI();
  heroNeedsDraw = true;
  heroLoop.draw();
}

// 拖动期间只标脏，合并到下一帧 rAF 统一更新 UI 与画布，绝不同步双绘
function scheduleHeroDragUpdate() {
  heroUiDirty = true;
  heroNeedsDraw = true;
  if (reducedMotion.matches) heroLoop.draw();
}

// ---------- Hero 画布交互：横拖调大气浊度 β，桌面鼠标纵拖改单层明度，点击选山层，键盘微调 ----------
heroCanvas.addEventListener("pointerdown", (ev) => {
  const rect = heroCanvas.getBoundingClientRect();
  heroCssW = rect.width;
  heroCssH = rect.height;
  const u = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
  const v = clamp((ev.clientY - rect.top) / rect.height, 0, 1);
  const hitLayer = hitTestLayer(u, v, state.scene);
  dragInfo = {
    id: ev.pointerId,
    pointerType: ev.pointerType,
    startX: ev.clientX,
    startY: ev.clientY,
    startBeta: state.turbidity,
    hitLayer,
    startTone: state.layerToneBias[hitLayer] || 0,
    axis: "",
    moved: false,
    rect,
  };
  try { heroCanvas.setPointerCapture(ev.pointerId); } catch {}
});

heroCanvas.addEventListener("pointermove", (ev) => {
  if (!dragInfo || ev.pointerId !== dragInfo.id) return;
  const dx = ev.clientX - dragInfo.startX;
  const dy = ev.clientY - dragInfo.startY;
  if (!dragInfo.moved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;

  if (!dragInfo.axis) {
    if (Math.abs(dx) >= Math.abs(dy) * 0.75) dragInfo.axis = "x";
    else if (dragInfo.pointerType === "mouse") {
      dragInfo.axis = "y";
      state.selectedLayer = dragInfo.hitLayer;
    } else {
      return; // 触屏纵滑交还浏览器顺滑滚动页面
    }
  }

  if (dragInfo.axis === "x") {
    dragInfo.moved = true;
    if (state.airlight === "vacuum") {
      state.airlight = SCENES[state.scene]?.defaultAirlight || "rayleigh";
    }
    const span = Math.max(180, dragInfo.rect.width * 0.75);
    state.turbidity = Number(clamp(dragInfo.startBeta + (dx / span) * 0.42, 0, 0.45).toFixed(3));
    animTurbidity = state.turbidity; // 拖动期间零滞后跟手
    scheduleHeroDragUpdate();
  } else if (dragInfo.axis === "y") {
    dragInfo.moved = true;
    const spanY = Math.max(140, dragInfo.rect.height * 0.55);
    const nextTone = clamp(dragInfo.startTone + (-dy / spanY) * 0.55, -0.5, 0.5);
    state.layerToneBias[dragInfo.hitLayer] = Number(nextTone.toFixed(2));
    scheduleHeroDragUpdate();
  }
});

function endDrag(ev) {
  if (!dragInfo || ev.pointerId !== dragInfo.id) return;
  const info = dragInfo;
  dragInfo = null;
  try { heroCanvas.releasePointerCapture(ev.pointerId); } catch {}
  if (!info.moved) {
    // 轻点画布：精确命中五层山景并切换选中层
    const u = clamp((ev.clientX - info.rect.left) / info.rect.width, 0, 1);
    const v = clamp((ev.clientY - info.rect.top) / info.rect.height, 0, 1);
    state.selectedLayer = hitTestLayer(u, v, state.scene);
    refreshHero(true);
  } else {
    // 松手后补画一帧全清晰缓存版本
    refreshHero(true);
  }
}
heroCanvas.addEventListener("pointerup", endDrag);
heroCanvas.addEventListener("pointercancel", () => { dragInfo = null; });

// 键盘操作：←/→ 调浊度 β，↑/↓ 调当前选中层明度，1-5 切层
heroCanvas.addEventListener("keydown", (ev) => {
  if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") {
    ev.preventDefault();
    if (state.airlight === "vacuum") state.airlight = SCENES[state.scene]?.defaultAirlight || "rayleigh";
    const step = ev.key === "ArrowRight" ? 0.015 : -0.015;
    state.turbidity = Number(clamp(state.turbidity + step, 0, 0.45).toFixed(3));
    refreshHero(true);
  } else if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
    ev.preventDefault();
    const step = ev.key === "ArrowUp" ? 0.05 : -0.05;
    const i = state.selectedLayer;
    state.layerToneBias[i] = Number(clamp((state.layerToneBias[i] || 0) + step, -0.5, 0.5).toFixed(2));
    refreshHero(true);
  } else if (/^[1-5]$/.test(ev.key)) {
    state.selectedLayer = Number(ev.key) - 1;
    refreshHero(true);
  }
});

// 控件事件绑定
ctrlTurbidity.addEventListener("input", () => {
  if (state.airlight === "vacuum" && Number(ctrlTurbidity.value) > 0.01) {
    state.airlight = SCENES[state.scene]?.defaultAirlight || "rayleigh";
  }
  state.turbidity = Number(ctrlTurbidity.value);
  refreshHero(true);
});

ctrlLayerTone.addEventListener("input", () => {
  state.layerToneBias[state.selectedLayer] = Number(ctrlLayerTone.value);
  refreshHero(true);
});

ctrlLayerSat.addEventListener("input", () => {
  state.layerSatBias[state.selectedLayer] = Number(ctrlLayerSat.value);
  refreshHero(true);
});

for (const btn of sceneBtns) {
  btn.addEventListener("click", () => {
    const id = btn.dataset.scene;
    state.scene = id;
    if (state.airlight !== "vacuum") state.airlight = SCENES[id].defaultAirlight;
    refreshHero();
  });
}

for (const btn of airBtns) {
  btn.addEventListener("click", () => {
    state.airlight = btn.dataset.air;
    if (state.airlight !== "vacuum" && state.turbidity < 0.02) state.turbidity = 0.115;
    refreshHero();
  });
}

for (const btn of edgeBtns) {
  btn.addEventListener("click", () => {
    state.edgeMode = btn.dataset.edge;
    refreshHero(true);
  });
}

layerChips.forEach((chip, i) => {
  chip.addEventListener("click", () => {
    state.selectedLayer = i;
    refreshHero(true);
  });
});

for (const btn of presetBtns) {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    state = {
      ...state,
      ...p.patch,
      layerToneBias: [...p.patch.layerToneBias],
      layerSatBias: [...p.patch.layerSatBias],
    };
    refreshHero();
  });
}

btnStepFix.addEventListener("click", () => {
  const ft = btnStepFix.dataset.fixType;
  if (!ft) return;
  state = applySingleStepFix(state, ft);
  refreshHero();
});

btnResetBroken.addEventListener("click", () => {
  state = createInitialState();
  refreshHero();
});

btnToggleGuides.addEventListener("click", () => {
  state.showDepthGuides = !state.showDepthGuides;
  refreshHero(true);
});

// 点击右侧四要素圆徽：温和聚焦到对应的控制项
for (const item of document.querySelectorAll(".elem-item")) {
  item.addEventListener("click", () => {
    const k = item.dataset.focusElem;
    if (k === "value") ctrlLayerTone.focus();
    else if (k === "saturation") ctrlLayerSat.focus();
    else if (k === "atmosphere") ctrlTurbidity.focus();
    else heroCanvas.focus();
  });
}

// ==================== 01 节：科施米德光程与指数衰减图 ====================
const sec1Canvas = document.getElementById("sec1-canvas");
const s1Dist = document.getElementById("s1-dist");
const s1Beta = document.getElementById("s1-beta");
const s1DistVal = document.getElementById("s1-dist-val");
const s1BetaVal = document.getElementById("s1-beta-val");
const s1Trans = document.getElementById("s1-trans");
const s1Veil = document.getElementById("s1-veil");
const s1Vis = document.getElementById("s1-vis");
const s1Explain = document.getElementById("s1-explain");
const s1AirBtns = [...document.querySelectorAll("[data-s1-air]")];

const s1State = { dist: 6.0, beta: 0.11, air: "rayleigh" };

function drawSec1() {
  const rect = sec1Canvas.getBoundingClientRect();
  if (rect.width < 20) return;
  const { ctx, w, h } = fitCanvas(sec1Canvas, rect.width, rect.height, 2);
  const air = AIRLIGHTS[s1State.air];

  // 背景纸面
  ctx.fillStyle = "#FAF7F0";
  ctx.fillRect(0, 0, w, h);

  // 上半部分（0..52%）：同一棵深色松树放在 5 个距离上的真实空气光着色对照
  const topH = h * 0.48;
  const skyG = ctx.createLinearGradient(0, 0, 0, topH);
  skyG.addColorStop(0, rgbToHex(air.horizonRgb));
  skyG.addColorStop(1, rgbToHex(air.skyRgb));
  ctx.fillStyle = skyG;
  ctx.fillRect(14, 12, w - 28, topH - 16);

  const narrow = w < 440;
  const sampleDists = narrow ? [0.2, 3.8, 7.8, 12.5, 18.0] : [0.2, 2.5, 6.0, 12.0, 18.0];
  const leftPad = narrow ? 38 : 48;
  const rightPad = narrow ? 16 : 24;
  const plotW = w - leftPad - rightPad;

  sampleDists.forEach((d, idx) => {
    const cx = leftPad + (d / 20) * plotW;
    const sp = sampleOpticalPath(d, s1State.beta, s1State.air);
    const treeH = clamp(topH * (0.60 - idx * 0.065), 34, 88);
    const baseY = topH - 10;

    // 简洁五角松剪影
    ctx.fillStyle = sp.hex;
    ctx.beginPath();
    ctx.moveTo(cx, baseY - treeH);
    ctx.lineTo(cx + treeH * 0.28, baseY - treeH * 0.22);
    ctx.lineTo(cx - treeH * 0.28, baseY - treeH * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(cx - 2, baseY - treeH * 0.24, 4, treeH * 0.24);

    // 距离标（白底胶囊避免与红探针线重叠，窄屏紧凑防挤）
    const lbl = `${d}km`;
    ctx.font = `600 ${narrow ? 9.5 : Math.max(10, Math.round(w * 0.0135))}px "Space Mono", "Noto Serif SC", monospace`;
    ctx.textAlign = "center";
    const lw = ctx.measureText(lbl).width + 6;
    const lx = clamp(cx, leftPad + lw / 2 - 4, w - rightPad - lw / 2 + 4);
    ctx.fillStyle = "#FAF7F0";
    ctx.fillRect(lx - lw / 2, topH + 1, lw, 14);
    ctx.fillStyle = "#1A2E3C";
    ctx.fillText(lbl, lx, topH + 11);
  });

  // 下半部分（61%..89%）：Koschmieder 双曲线（与 sampleOpticalPath 同一份三通道平均透射单真源）
  const gTop = h * 0.61;
  const gBot = h * 0.89;
  const gH = gBot - gTop;
  const meanTransAt = (d) =>
    (Math.exp(-s1State.beta * air.k[0] * d) +
      Math.exp(-s1State.beta * air.k[1] * d) +
      Math.exp(-s1State.beta * air.k[2] * d)) / 3;

  // 坐标网
  ctx.strokeStyle = "#DED8CE";
  ctx.lineWidth = 1;
  for (let p = 0; p <= 1; p += 0.5) {
    const gy = gBot - p * gH;
    ctx.beginPath();
    ctx.moveTo(leftPad, gy);
    ctx.lineTo(leftPad + plotW, gy);
    ctx.stroke();
  }

  // 透射率曲线 e^(-βd)
  ctx.strokeStyle = "#1A2E3C";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i <= 80; i++) {
    const d = (i / 80) * 20;
    const yVal = meanTransAt(d);
    const px = leftPad + (d / 20) * plotW;
    const py = gBot - yVal * gH;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // 空气光面纱曲线 1 - e^(-βd)
  ctx.strokeStyle = "#534978";
  ctx.lineWidth = 2.4;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  for (let i = 0; i <= 80; i++) {
    const d = (i / 80) * 20;
    const yVal = 1 - meanTransAt(d);
    const px = leftPad + (d / 20) * plotW;
    const py = gBot - yVal * gH;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // 更新读数面板与当前探针距离竖线（100% 同一份单真源）
  const cur = sampleOpticalPath(s1State.dist, s1State.beta, s1State.air);
  const probeX = leftPad + (s1State.dist / 20) * plotW;
  const tVal = cur.meanTransmittance;
  const vVal = 1 - tVal;
  ctx.strokeStyle = "#B3422E";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(probeX, 12);
  ctx.lineTo(probeX, gBot);
  ctx.stroke();

  ctx.fillStyle = "#1A2E3C";
  ctx.beginPath();
  ctx.arc(probeX, gBot - tVal * gH, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#534978";
  ctx.beginPath();
  ctx.arc(probeX, gBot - vVal * gH, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Y 轴与图例
  ctx.fillStyle = "#516474";
  ctx.font = `600 11px "Space Mono", "Noto Serif SC", monospace`;
  ctx.textAlign = "right";
  ctx.fillText("100%", leftPad - 8, gTop + 4);
  ctx.fillText("50%", leftPad - 8, gTop + gH * 0.5 + 4);
  ctx.fillText("0%", leftPad - 8, gBot + 4);

  ctx.textAlign = "left";
  ctx.font = `600 ${narrow ? 10 : 11.5}px "Chivo", "Noto Serif SC", sans-serif`;
  ctx.fillStyle = "#1A2E3C";
  ctx.fillText(narrow ? "— 直射光 exp(-βd)" : "— 物体直射光 exp(-βd)", leftPad, h - 8);
  ctx.fillStyle = "#534978";
  const leg2X = narrow ? Math.max(leftPad + 118, w * 0.50) : leftPad + 170;
  ctx.fillText(narrow ? "-- 空气光 1-exp(-βd)" : "-- 空气光面纱 1 - exp(-βd)", leg2X, h - 8);

  s1DistVal.textContent = `${s1State.dist.toFixed(1)} km`;
  s1BetaVal.textContent = `${s1State.beta.toFixed(2)} /km`;
  s1Trans.textContent = `${cur.transmittancePct}%`;
  s1Veil.textContent = `${cur.airlightPct}%`;
  s1Vis.textContent = Number.isFinite(cur.visibilityKm) ? `${cur.visibilityKm.toFixed(1)} km` : "∞";
  s1Explain.textContent = `在 ${s1State.dist.toFixed(1)} km 处，松树原本的深暗色只剩 ${cur.transmittancePct}% 抵达镜头，其余 ${cur.airlightPct}% 被${cur.air.label}（${cur.air.tintName}）替换，感知明度抬升到 ${cur.lumaPct}%。`;
}

s1Dist.addEventListener("input", () => { s1State.dist = Number(s1Dist.value); drawSec1(); });
s1Beta.addEventListener("input", () => { s1State.beta = Number(s1Beta.value); drawSec1(); });
for (const b of s1AirBtns) {
  b.addEventListener("click", () => {
    s1State.air = b.dataset.s1Air;
    for (const x of s1AirBtns) x.classList.toggle("is-active", x === b);
    drawSec1();
  });
}

// ==================== 02 节：四要素独立剥离开关 ====================
const sec2Canvas = document.getElementById("sec2-canvas");
const abLayers = document.getElementById("ab-layers");
const abValue = document.getElementById("ab-value");
const abSat = document.getElementById("ab-sat");
const abAtmo = document.getElementById("ab-atmo");
const sec2Title = document.getElementById("sec2-verdict-title");
const sec2Body = document.getElementById("sec2-verdict-body");

function drawSec2() {
  const rect = sec2Canvas.getBoundingClientRect();
  if (rect.width < 20) return;
  const { ctx, w, h } = fitCanvas(sec2Canvas, rect.width, rect.height, 2);

  const hasLayers = abLayers.checked;
  const hasValue = abValue.checked;
  const hasSat = abSat.checked;
  const hasAtmo = abAtmo.checked;

  // 基准 4 层山色：按开关状态独立剥离明度与饱和度衰减
  const rawHsl = [
    [206 / 360, 0.42, 0.16], // 近
    [208 / 360, 0.34, 0.34], // 近中
    [212 / 360, 0.24, 0.58], // 远
    [216 / 360, 0.14, 0.78], // 极远
  ];

  const layerColors = rawHsl.map(([hh, ss, ll], idx) => {
    const useL = hasValue ? ll : 0.24 + idx * 0.02; // 关掉明度递升：四层压成近乎同等暗度
    const useS = hasSat ? ss : 0.56;                // 关掉饱和度衰减：远山依旧艳蓝
    return hslToRgb([hh, useS, useL]);
  });

  drawCompactLandscape(ctx, w, h, {
    layerColors,
    hasOverlap: hasLayers,
    softFar: hasAtmo,
    greyscale: false,
    mode: "landscape",
    showTower: hasLayers,
  });

  // 根据真实组合给出白话结论
  const onCount = [hasLayers, hasValue, hasSat, hasAtmo].filter(Boolean).length;
  if (onCount === 4) {
    sec2Title.textContent = "四要素齐全：前后叠压 + 明度阶梯 + 彩度渐退 + 柔和雾边共同锁住纵深";
    sec2Body.textContent = "现在试着只关掉「明度」，再还原后只关掉「饱和度」——你能一眼分辨谁是决定空间感的主梁、谁是锦上添花的微调。";
  } else if (!hasValue && !hasLayers) {
    sec2Title.textContent = "纵深彻底解体：既无遮挡又无明度差，四座山成了平面图标";
    sec2Body.textContent = "连前后关系和远近亮暗都拿掉后，即便保留一点柔边，人眼也完全读不出谁在前面、谁在十几公里外。";
  } else if (!hasValue) {
    sec2Title.textContent = "关掉「明度」后空间瞬间压扁：四层山粘成了暗色剪纸";
    sec2Body.textContent = "即便保留了前后遮挡和边缘柔和，只要四层处于同一暗度区间，眼睛就会把它们归为同一景深——明度与反差阶梯是空气透视最核心的骨架。";
  } else if (!hasLayers) {
    sec2Title.textContent = "关掉「层次遮挡」：颜色还在渐变，但山与山失去前后参照";
    sec2Body.textContent = "明度梯仍暗示着轻重远近，可没有山脊彼此压住山脚的遮挡关系，画面看起来像并排陈列的标本，少了纵深穿行感。";
  } else if (!hasSat && !hasAtmo) {
    sec2Title.textContent = "仅剩层次与明度：空间骨架还在，但远景生硬且偏塑料";
    sec2Body.textContent = "这恰恰印证了主次：明度与反差阶梯撑住了空间纵深的主梁，而彩度渐退与柔和轮廓负责把「生硬的分层色块」融成真实空气。";
  } else if (!hasSat) {
    sec2Title.textContent = "关掉「饱和度衰减」：高纯度远山开始往前跳，氛围发冲";
    sec2Body.textContent = "虽然明度梯度仍保住了大体纵深，但远山带着刺眼高饱和蓝，视觉重量偏重，少了海报里「颜色越灰、越轻盈」的静谧感。";
  } else {
    sec2Title.textContent = "关掉「空气感柔边」：远山勾出硬黑线，像贴纸剪贴画";
    sec2Body.textContent = "明度与彩度已经退后了，可锐利的硬轮廓一直在对大脑喊「我很近」——相互矛盾的线索让画面失去飘逸氛围。";
  }
}

[abLayers, abValue, abSat, abAtmo].forEach((el) => el.addEventListener("change", drawSec2));

// ==================== 03 节：深岩暗室彩色 / 灰度分界幕帘 ====================
const sec3Canvas = document.getElementById("sec3-canvas");
const s3Split = document.getElementById("s3-split");
const s3SplitVal = document.getElementById("s3-split-val");
const s3ModeBtns = [...document.querySelectorAll("[data-s3-mode]")];

const s3State = { split: 52, mode: "landscape" };

function drawSec3() {
  const rect = sec3Canvas.getBoundingClientRect();
  if (rect.width < 20) return;
  const { ctx, w, h } = fitCanvas(sec3Canvas, rect.width, rect.height, 2);

  const palettes = {
    landscape: [
      [26, 46, 60],
      [62, 86, 108],
      [126, 146, 168],
      [196, 206, 218],
    ],
    illustration: [
      [42, 34, 62],
      [96, 86, 128],
      [158, 150, 184],
      [216, 210, 228],
    ],
    ui: [
      [26, 46, 60],
      [58, 78, 96],
      [124, 138, 156],
      [198, 204, 214],
    ],
  };

  const cols = palettes[s3State.mode];
  const splitX = (s3State.split / 100) * w;

  // 左半：完整彩色
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, splitX, h);
  ctx.clip();
  drawCompactLandscape(ctx, w, h, {
    layerColors: cols,
    skyTop: [244, 238, 228],
    skyBot: [232, 236, 242],
    mode: s3State.mode,
    showTower: s3State.mode !== "ui",
  });
  ctx.restore();

  // 右半：纯灰度明度检视
  ctx.save();
  ctx.beginPath();
  ctx.rect(splitX, 0, w - splitX, h);
  ctx.clip();
  drawCompactLandscape(ctx, w, h, {
    layerColors: cols,
    skyTop: [244, 238, 228],
    skyBot: [232, 236, 242],
    greyscale: true,
    mode: s3State.mode,
    showTower: s3State.mode !== "ui",
  });
  ctx.restore();

  // 中央可拖分界线与抓手
  ctx.strokeStyle = "#C8BEE8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(splitX, 0);
  ctx.lineTo(splitX, h);
  ctx.stroke();

  ctx.fillStyle = "#162632";
  ctx.beginPath();
  ctx.arc(splitX, h * 0.5, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#C8BEE8";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#EDF2F6";
  ctx.font = `700 12px "Chivo", "Noto Serif SC", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("↔", splitX, h * 0.5 + 0.5);

  // 左右角标
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(22, 38, 50, 0.86)";
  ctx.fillRect(12, 12, 114, 26);
  ctx.fillStyle = "#EDF2F6";
  ctx.font = `600 12px "Chivo", "Noto Serif SC", sans-serif`;
  ctx.fillText("彩色原画 · COLOR", 20, 25);

  ctx.fillStyle = "rgba(22, 38, 50, 0.86)";
  ctx.fillRect(w - 134, 12, 122, 26);
  ctx.fillStyle = "#C8BEE8";
  ctx.fillText("灰度明度 · VALUE", w - 126, 25);

  // 右下角 4 阶实测灰度条
  const barW = 148;
  const barX = w - barW - 14;
  const barY = h - 38;
  ctx.fillStyle = "rgba(22, 38, 50, 0.88)";
  ctx.fillRect(barX - 6, barY - 6, barW + 12, 32);
  cols.forEach((rgb, i) => {
    const lum = Math.round(0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]);
    const sw = barW / 4;
    ctx.fillStyle = `rgb(${lum},${lum},${lum})`;
    ctx.fillRect(barX + i * sw, barY, sw - 2, 20);
  });

  s3SplitVal.textContent = `${s3State.split}%`;
}

s3Split.addEventListener("input", () => { s3State.split = Number(s3Split.value); drawSec3(); });
for (const b of s3ModeBtns) {
  b.addEventListener("click", () => {
    s3State.mode = b.dataset.s3Mode;
    for (const x of s3ModeBtns) {
      const a = x === b;
      x.classList.toggle("is-active", a);
      x.setAttribute("aria-selected", String(a));
    }
    drawSec3();
  });
}

// 支持在 03 节画布上直接横拖分界幕帘
let s3Drag = false;
sec3Canvas.addEventListener("pointerdown", (ev) => {
  s3Drag = true;
  try { sec3Canvas.setPointerCapture(ev.pointerId); } catch {}
  const r = sec3Canvas.getBoundingClientRect();
  s3State.split = Math.round(clamp(((ev.clientX - r.left) / r.width) * 100, 5, 95));
  s3Split.value = String(s3State.split);
  drawSec3();
});
sec3Canvas.addEventListener("pointermove", (ev) => {
  if (!s3Drag) return;
  const r = sec3Canvas.getBoundingClientRect();
  s3State.split = Math.round(clamp(((ev.clientX - r.left) / r.width) * 100, 5, 95));
  s3Split.value = String(s3State.split);
  drawSec3();
});
sec3Canvas.addEventListener("pointerup", () => { s3Drag = false; });
sec3Canvas.addEventListener("pointercancel", () => { s3Drag = false; });

// ==================== 04 节：历史脉络联动画板 ====================
const sec4Canvas = document.getElementById("sec4-canvas");
const sec4Title = document.getElementById("sec4-title");
const sec4Body = document.getElementById("sec4-body");
const eraBtns = [...document.querySelectorAll(".era-card")];

const ERAS = {
  roman: {
    title: "莉薇娅别墅《花园厅》壁画（约公元前 30–20 年）",
    body: "为了给奥古斯都妻子莉薇娅的地下避暑餐厅「开窗」，罗马画师把近处的石榴树、低矮栅栏与栖鸟画得浓绿清晰，把栅栏后方的树冠层层调淡、偏冷青并隐去叶片轮廓。这组现藏于罗马国家博物馆马西莫宫的壁画证明，远在文艺复兴命名之前，实证性的空气透视已经相当成熟。",
    skyTop: [218, 229, 232],
    skyBot: [192, 212, 218],
    layers: [[32, 68, 46], [62, 102, 82], [116, 148, 142], [168, 192, 194]],
    tag: "ROMAN FRESCO · SECOND STYLE",
  },
  song: {
    title: "北宋郭熙、郭思《林泉高致》（11 世纪末编纂 · 1117 年作序）",
    body: "北宋宫廷画师郭熙的山水讲论由其子郭思整理成《林泉高致》，政和七年（1117 年）翰林学士许光凝为之作序。书中《山水训》将山水空间归纳为高远、深远、平远「三远」，写下「平远之意冲融而缥缥缈缈」「远山无皴，远水无波，远人无目，非无也，如无耳」，以淡墨渲染与省略笔触表达空气与云岚厚度。",
    skyTop: [244, 237, 222],
    skyBot: [236, 230, 216],
    layers: [[34, 42, 44], [74, 84, 86], [136, 144, 144], [198, 200, 196]],
    tag: "NORTHERN SONG · PINGYUAN INK",
  },
  renaissance: {
    title: "达·芬奇与《画论》（约 1490s–1519 年手稿，1651 年巴黎初版）",
    body: "达·芬奇不仅在《蒙娜丽莎》《岩间圣母》的远景群山中纯熟运用烟雾法与蓝灰渐远，更在手稿里系统命名为「空气透视」（prospettiva aerea），指出空气并非全透明，夹在人眼与远山之间的受光水汽与微尘会使远方暗山反差衰减并转蓝。这些笔记经门生梅尔齐整理，于 1651 年在巴黎首次印行。",
    skyTop: [232, 230, 222],
    skyBot: [196, 210, 224],
    layers: [[48, 36, 28], [76, 86, 98], [122, 144, 168], [176, 194, 214]],
    tag: "LEONARDO · PROSPETTIVA AEREA",
  },
  physics: {
    title: "大气光学定量化（瑞利 1871 · 米氏 1908 · 科施米德 1924）",
    body: "1871 年瑞利勋爵证明空气分子散射强度与波长四次方成反比，解开了远山与晴空偏蓝之谜；1908 年古斯塔夫·米氏给出更大粒径气溶胶的散射解，解释了云雾与霾为何泛白；1924 年德国气象学家哈拉尔德·科施米德在《水平能见度理论》中写出对比度随距离指数衰减的公式，如今仍是气象观测与三维图形雾效的共同基石。",
    skyTop: [245, 238, 227],
    skyBot: [228, 234, 242],
    layers: [[24, 44, 58], [62, 86, 108], [134, 152, 174], [202, 212, 224]],
    tag: "RAYLEIGH · MIE · KOSCHMIEDER",
  },
};

let currentEra = "roman";

function drawSec4() {
  const rect = sec4Canvas.getBoundingClientRect();
  if (rect.width < 20) return;
  const { ctx, w, h } = fitCanvas(sec4Canvas, rect.width, rect.height, 2);
  const era = ERAS[currentEra];

  drawCompactLandscape(ctx, w, h, {
    layerColors: era.layers,
    skyTop: era.skyTop,
    skyBot: era.skyBot,
    mode: "landscape",
    showTower: currentEra === "physics",
  });

  // 叠加物理时期的指数曲线示意或画史题签
  if (currentEra === "physics") {
    ctx.strokeStyle = "rgba(83, 73, 120, 0.88)";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    for (let i = 0; i <= 50; i++) {
      const u = i / 50;
      const py = h * (0.82 - (1 - Math.exp(-2.8 * u)) * 0.56);
      if (i === 0) ctx.moveTo(w * (0.08 + u * 0.84), py);
      else ctx.lineTo(w * (0.08 + u * 0.84), py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = "rgba(26, 46, 60, 0.85)";
  ctx.fillRect(12, 12, Math.min(w - 24, 250), 24);
  ctx.fillStyle = "#FAF7F0";
  ctx.font = `700 11px "Space Mono", "Noto Serif SC", monospace`;
  ctx.textBaseline = "middle";
  ctx.fillText(era.tag, 20, 24);

  sec4Title.textContent = era.title;
  sec4Body.textContent = era.body;
}

for (const btn of eraBtns) {
  btn.addEventListener("click", () => {
    currentEra = btn.dataset.era;
    for (const x of eraBtns) {
      const a = x === btn;
      x.classList.toggle("is-active", a);
      x.setAttribute("aria-selected", String(a));
    }
    drawSec4();
  });
}

// ==================== 05 节：四枚反例急救翻转卡 ====================
const MISUSE_SVGS = {
  flat: {
    bad: `<svg viewBox="0 0 320 116" fill="none"><rect width="320" height="116" fill="#E8E4DE"/><rect x="18" y="18" width="94" height="80" fill="#B59391"/><circle cx="176" cy="58" r="34" fill="#B6BEC4"/><polygon points="244,24 300,96 218,96" fill="#C8C4CE"/><rect x="0" y="0" width="320" height="116" fill="#F5EEE3" fill-opacity="0.34"/><text x="16" y="108" fill="#B3422E" font-size="11" font-weight="700">硬套雾气：色块发灰发脏，撞色张力全失</text></svg>`,
    good: `<svg viewBox="0 0 320 116" fill="none"><rect width="320" height="116" fill="#FAF7F0"/><rect x="18" y="18" width="94" height="80" fill="#B3422E"/><circle cx="176" cy="58" r="34" fill="#1A2E3C"/><polygon points="244,20 302,96 214,96" fill="#534978"/><text x="16" y="108" fill="#1D6B5A" font-size="11" font-weight="700">改用 085 平面化构图：高纯度平涂，利落有冲击力</text></svg>`,
  },
  deepfocus: {
    bad: `<svg viewBox="0 0 320 116" fill="none"><rect width="320" height="116" fill="#F5EEE3"/><rect x="18" y="24" width="76" height="62" stroke="#1A2E3C" stroke-width="2" fill="#E4E9EE"/><rect x="122" y="24" width="76" height="62" stroke="#9AAAB8" stroke-width="1.5" fill="#EEF1F4"/><rect x="226" y="24" width="76" height="62" stroke="#D5DCE2" stroke-width="1" fill="#F4F5F6"/><text x="238" y="59" fill="#C9CFD6" font-size="12">12.4m</text><text x="16" y="108" fill="#B3422E" font-size="11" font-weight="700">硬套雾气：远端尺寸与标签发灰难辨</text></svg>`,
    good: `<svg viewBox="0 0 320 116" fill="none"><rect width="320" height="116" fill="#FAF7F0"/><rect x="18" y="24" width="76" height="62" stroke="#1A2E3C" stroke-width="2" fill="#E9EFF4"/><rect x="122" y="24" width="76" height="62" stroke="#1A2E3C" stroke-width="2" fill="#E9EFF4"/><rect x="226" y="24" width="76" height="62" stroke="#1A2E3C" stroke-width="2" fill="#E9EFF4"/><text x="238" y="59" fill="#1A2E3C" font-size="12" font-weight="700">12.4m</text><text x="16" y="108" fill="#1D6B5A" font-size="11" font-weight="700">改用 084 深焦构图：前中后信息一律清晰可读</text></svg>`,
  },
  shallow: {
    bad: `<svg viewBox="0 0 320 116" fill="none"><rect width="320" height="116" fill="#E3E6EA"/><rect x="188" y="16" width="112" height="74" fill="#CBD1D8"/><circle cx="98" cy="40" r="14" fill="#3B4E5C"/><path d="M72 90 C74 62 122 62 124 90 Z" fill="#3B4E5C"/><rect width="320" height="96" fill="#F5EEE3" fill-opacity="0.32"/><text x="16" y="108" fill="#B3422E" font-size="11" font-weight="700">室内仅隔 2 米硬加灰雾：显得像镜头起雾</text></svg>`,
    good: `<svg viewBox="0 0 320 116" fill="none"><rect width="320" height="116" fill="#F0ECE5"/><circle cx="235" cy="46" r="24" fill="#B4AEC8" fill-opacity="0.45"/><circle cx="272" cy="64" r="18" fill="#8C83AB" fill-opacity="0.35"/><circle cx="98" cy="40" r="14" fill="#1A2E3C"/><path d="M72 90 C74 62 122 62 124 90 Z" fill="#1A2E3C"/><text x="16" y="108" fill="#1D6B5A" font-size="11" font-weight="700">改用 083 浅景深：主体锐利，近距背景柔美焦外</text></svg>`,
  },
  geometry: {
    bad: `<svg viewBox="0 0 320 116" fill="none"><rect width="320" height="116" fill="#EBE9E6"/><line x1="20" y1="92" x2="160" y2="36" stroke="#B6B9BE" stroke-width="1.5"/><line x1="300" y1="92" x2="160" y2="36" stroke="#B6B9BE" stroke-width="1.5"/><rect x="52" y="28" width="22" height="62" fill="#5D6F7D"/><rect x="154" y="42" width="10" height="22" fill="#C4C9CE"/><text x="16" y="108" fill="#B3422E" font-size="11" font-weight="700">浓雾抹淡透视线与远端体块，比例错觉大打折扣</text></svg>`,
    good: `<svg viewBox="0 0 320 116" fill="none"><rect width="320" height="116" fill="#FAF7F0"/><line x1="20" y1="92" x2="160" y2="36" stroke="#534978" stroke-width="1.8"/><line x1="300" y1="92" x2="160" y2="36" stroke="#534978" stroke-width="1.8"/><rect x="52" y="24" width="24" height="66" fill="#1A2E3C"/><rect x="155" y="42" width="10" height="22" fill="#1A2E3C"/><text x="16" y="108" fill="#1D6B5A" font-size="11" font-weight="700">改用 081 强制透视 / 086 深空间：清晰几何线撑满张力</text></svg>`,
  },
};

for (const card of document.querySelectorAll(".misuse-card")) {
  const key = card.dataset.misuse;
  const wrap = document.getElementById(`svg-misuse-${key}`);
  const btn = card.querySelector(".flip-btn");
  let flipped = false;
  const render = () => {
    wrap.innerHTML = flipped ? MISUSE_SVGS[key].good : MISUSE_SVGS[key].bad;
    btn.setAttribute("aria-pressed", String(flipped));
    btn.textContent = flipped ? "回看硬套反例" : "看正确替代";
  };
  render();
  btn.addEventListener("click", () => { flipped = !flipped; render(); });
}

// ==================== 06 节：单变量对照四选一小练习（四层明度由实绘 RGB 单真源现算） ====================
function fmtLumaLadder(layers) {
  return layers.map((rgb) => `${Math.round(rgbToLuma(rgb))}%`).join(" → ");
}

const QUIZ_ROUNDS = [
  {
    prompt: "第 1 题（晴日远山高塔）：以下四张构图、机位与轮廓完全相同，仅调整了四层山体的明度与彩度梯度。哪一张最符合晴朗白天的空气透视规律？",
    correct: 1,
    skyTop: [245, 238, 227],
    skyBot: [232, 237, 244],
    options: [
      {
        layers: [[38, 56, 70], [44, 62, 78], [52, 70, 86], [62, 80, 96]],
        why: (L) => `实测四层明度仅挤在 ${L} 的极窄暗带内，几乎没有空气散射递升，远山与高塔像深色剪纸贴在同一平面上。`,
      },
      {
        layers: [[26, 46, 60], [82, 106, 126], [156, 174, 192], [212, 220, 228]],
        why: (L) => `答对了。四层实测明度匀称递升（${L}），前景以深调压阵，远塔与极远峰逐层向晴日天光靠拢，彩度与反差同步减弱，空间退远感自然成立。`,
      },
      {
        layers: [[94, 112, 126], [128, 144, 158], [38, 60, 82], [208, 216, 224]],
        why: (L) => `四层实测明度为 ${L}——第 3 层远景高塔反而被压暗，比更近的前两层都深，发生典型的明度倒挂，高塔直接往前跳出队列。`,
      },
      {
        layers: [[24, 44, 58], [204, 212, 220], [220, 225, 231], [232, 235, 239]],
        why: (L) => `四层实测明度为 ${L}——中景、远塔和极远峰全部被浓雾挤进高亮窄带，中间层次断档融成一片，只剩黑前景和白背景两张皮。`,
      },
    ],
  },
  {
    prompt: "第 2 题（日落暖霞峡谷）：夕阳低垂、天际充满暖金霞光。四张画仅改变远景的空气光色温与明度梯度，哪一张最符合真实晚霞大气光学？",
    correct: 2,
    skyTop: [248, 224, 196],
    skyBot: [244, 200, 166],
    options: [
      {
        layers: [[42, 34, 54], [96, 126, 164], [148, 176, 208], [196, 214, 232]],
        why: (L) => `虽然明度呈 ${L} 递升，但机械照搬「越远越蓝」的口诀：天空明明是暖金夕照，远山却硬刷冷冰冰的晴日蓝雾，光色来源与空气光互相打架。`,
      },
      {
        layers: [[190, 156, 134], [142, 114, 102], [86, 68, 74], [46, 36, 52]],
        why: (L) => `实测明度竟倒走为 ${L}：近景亮灰、远峰漆黑，违背夕阳照亮远处厚大气层的物理逻辑，峡谷前后层次彻底倒置。`,
      },
      {
        layers: [[38, 30, 48], [98, 76, 86], [176, 138, 124], [228, 192, 164]],
        why: (L) => `答对了。四层实测明度由 ${L} 逐级抬升，近景逆光暗崖保持冷深调，随距离拉远被夕阳照亮的暖金空气光逐层叠加，这才是空气透视「向当下天光靠拢」的真谛。`,
      },
      {
        layers: [[44, 34, 52], [116, 48, 42], [186, 68, 44], [234, 96, 52]],
        why: (L) => `明度虽从 ${L} 抬升且偏暖，但远景饱和度一路飙升成刺眼高纯度橘红，违反了空气散射削弱彩度的规律，远山反而比近崖更扎眼。`,
      },
    ],
  },
];

let quizRound = 0;
const quizPrompt = document.getElementById("quiz-prompt");
const quizRoundBtns = [...document.querySelectorAll("[data-quiz-round]")];
const quizOptBtns = [...document.querySelectorAll(".quiz-option")];
const quizFeedback = document.getElementById("quiz-feedback");

function renderQuizRound() {
  const r = QUIZ_ROUNDS[quizRound];
  quizPrompt.textContent = r.prompt;
  quizRoundBtns.forEach((b, i) => {
    const a = i === quizRound;
    b.classList.toggle("is-active", a);
    b.setAttribute("aria-selected", String(a));
  });
  quizOptBtns.forEach((btn, i) => {
    btn.classList.remove("is-correct", "is-wrong");
    const cv = btn.querySelector("canvas");
    const rect = cv.getBoundingClientRect();
    const cw = rect.width > 20 ? rect.width : 300;
    const ch = rect.height > 20 ? rect.height : 196;
    const { ctx, w, h } = fitCanvas(cv, cw, ch, 2);
    drawCompactLandscape(ctx, w, h, {
      layerColors: r.options[i].layers,
      skyTop: r.skyTop,
      skyBot: r.skyBot,
      mode: "landscape",
      showTower: quizRound === 0,
    });
  });
  quizFeedback.innerHTML = `<p class="quiz-fb-idle">点选上方 A / B / C / D 任一方案，查看四层明度读数与光学解析。</p>`;
}

quizRoundBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    quizRound = Number(btn.dataset.quizRound);
    renderQuizRound();
  });
});

quizOptBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const pick = Number(btn.dataset.opt);
    const r = QUIZ_ROUNDS[quizRound];
    const ok = pick === r.correct;
    const letters = ["A", "B", "C", "D"];
    quizOptBtns.forEach((b, i) => {
      b.classList.toggle("is-correct", i === r.correct);
      b.classList.toggle("is-wrong", i === pick && !ok);
    });
    const pickOpt = r.options[pick];
    const rightOpt = r.options[r.correct];
    const pickWhy = pickOpt.why(fmtLumaLadder(pickOpt.layers));
    const rightWhy = ok ? "" : ` 正确答案是方案 ${letters[r.correct]}：${rightOpt.why(fmtLumaLadder(rightOpt.layers))}`;
    quizFeedback.innerHTML = `
      <p class="quiz-fb-head ${ok ? "is-ok" : "is-bad"}">${ok ? `方案 ${letters[pick]} 正确` : `方案 ${letters[pick]} 不符合该光线条件下的空气透视`}</p>
      <p class="quiz-fb-body">${pickWhy}${rightWhy}</p>
    `;
  });
});

// ==================== 07 节：原海报放大灯箱 ====================
const posterImg = document.getElementById("poster");
const posterTrigger = document.getElementById("poster-trigger");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbViewport = document.getElementById("lb-viewport");
const lbScaleText = document.getElementById("lb-scale");
const lbIn = document.getElementById("lb-in");
const lbOut = document.getElementById("lb-out");
const lbReset = document.getElementById("lb-reset");
const lbClose = document.getElementById("lb-close");

const lbState = { scale: 1, tx: 0, ty: 0, dragging: false, sx: 0, sy: 0, ox: 0, oy: 0 };

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbState.tx}px, ${lbState.ty}px) scale(${lbState.scale})`;
  lbScaleText.textContent = `${Math.round(lbState.scale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.currentSrc || posterImg.src;
  lbState.scale = 1;
  lbState.tx = 0;
  lbState.ty = 0;
  applyLbTransform();
  lightbox.hidden = false;
  lbClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbIn.addEventListener("click", () => { lbState.scale = clamp(lbState.scale + 0.35, 0.7, 3.2); applyLbTransform(); });
lbOut.addEventListener("click", () => { lbState.scale = clamp(lbState.scale - 0.35, 0.7, 3.2); applyLbTransform(); });
lbReset.addEventListener("click", () => { lbState.scale = 1; lbState.tx = 0; lbState.ty = 0; applyLbTransform(); });

lbViewport.addEventListener("wheel", (ev) => {
  ev.preventDefault();
  lbState.scale = clamp(lbState.scale + (ev.deltaY < 0 ? 0.18 : -0.18), 0.7, 3.2);
  applyLbTransform();
}, { passive: false });

lbViewport.addEventListener("pointerdown", (ev) => {
  if (ev.target === lbViewport && lbState.scale <= 1.01) {
    closeLightbox();
    return;
  }
  lbState.dragging = true;
  lbState.sx = ev.clientX;
  lbState.sy = ev.clientY;
  lbState.ox = lbState.tx;
  lbState.oy = lbState.ty;
  lbViewport.classList.add("is-dragging");
  try { lbViewport.setPointerCapture(ev.pointerId); } catch {}
});

lbViewport.addEventListener("pointermove", (ev) => {
  if (!lbState.dragging) return;
  lbState.tx = lbState.ox + (ev.clientX - lbState.sx);
  lbState.ty = lbState.oy + (ev.clientY - lbState.sy);
  applyLbTransform();
});

const stopLbDrag = () => {
  lbState.dragging = false;
  lbViewport.classList.remove("is-dragging");
};
lbViewport.addEventListener("pointerup", stopLbDrag);
lbViewport.addEventListener("pointercancel", stopLbDrag);

window.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ==================== 首次绘制与视口变化重绘 ====================
function drawAllStatic() {
  measureHeroCanvas();
  refreshHero(true);
  scheduleWarmSprites();
  drawSec1();
  drawSec2();
  drawSec3();
  drawSec4();
  renderQuizRound();
}

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawAllStatic, 80);
});

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(drawAllStatic);
}
drawAllStatic();

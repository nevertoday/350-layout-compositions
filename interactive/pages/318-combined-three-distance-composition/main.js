// 318 三远综合构图 · 整页交互主控
import {
  INITIAL_BROKEN_STATE,
  PRESET_SOLUTIONS,
  SCENES,
  clamp,
  evaluate,
  getWeights,
} from "./model.js";
import { createHeroStage } from "./scene.js";
import { reducedMotion } from "../../lib/stage.js";

const state = { ...INITIAL_BROKEN_STATE };
const $ = (id) => document.getElementById(id);

// ==================== 1. 开场三远合成舞台与单真源渲染 ====================
const heroCanvas = $("hero-canvas");
const overlaySvg = $("stage-overlay");
const pinAxis = $("pin-axis");
const pinSeam = $("pin-seam");
const pinSpace = $("pin-space");

const stage = createHeroStage(
  heroCanvas,
  () => state,
  ({ isWebGL }) => {
    const badge = $("engine-badge");
    if (badge) badge.textContent = isWebGL ? "3D 立体 · WebGL" : "2D 降级 · 矢量同源";
  }
);

let lastOverlayHtml = "";
function renderStageOverlay(ev) {
  const g = ev.geom;
  const p = SCENES[state.scene].palette;
  const W = 720;
  const H = 460;
  const tx = (u) => (u * W).toFixed(1);
  const ty = (v) => (v * H).toFixed(1);

  const parts = [];
  if (state.showGuides && !state.view3d) {
    // 原海报大三角虚线包络框
    const tri = g.triangle;
    parts.push(
      `<polygon points="${tx(tri.topX)},${ty(tri.topY)} ${tx(tri.leftX)},${ty(tri.bottomY)} ${tx(tri.rightX)},${ty(tri.bottomY)}" fill="none" stroke="${p.guide}" stroke-width="1.5" stroke-dasharray="6 5" opacity="0.72"/>`
    );
    // 顶部向上虚箭（高远轴）
    const px = tx(g.peakX);
    parts.push(
      `<line x1="${px}" y1="${ty(Math.max(0.02, g.peakY - 0.045))}" x2="${px}" y2="${ty(g.baseBottomY)}" stroke="${ev.checks.axis ? p.guide : "#B32820"}" stroke-width="1.4" stroke-dasharray="5 4" opacity="0.7"/>`,
      `<polygon points="${px},${ty(Math.max(0.015, g.peakY - 0.055))} ${(g.peakX * W - 5).toFixed(1)},${(Math.max(0.015, g.peakY - 0.055) * H + 9).toFixed(1)} ${(g.peakX * W + 5).toFixed(1)},${(Math.max(0.015, g.peakY - 0.055) * H + 9).toFixed(1)}" fill="${ev.checks.axis ? p.guide : "#B32820"}"/>`
    );
    // 若为北宋 S 脉，绘出优美 S 形龙脉虚曲线
    if (state.axisMode === "scurve") {
      parts.push(
        `<path d="M${tx(0.54)} ${ty(g.peakY + 0.04)} C${tx(0.64)} ${ty(0.36)} ${tx(0.35)} ${ty(0.50)} ${tx(0.45)} ${ty(g.valleyY)} C${tx(0.54)} ${ty(0.70)} ${tx(0.42)} ${ty(0.80)} ${tx(0.50)} ${ty(g.baseBottomY)}" fill="none" stroke="${p.guideDeep}" stroke-width="2" stroke-dasharray="6 4" opacity="0.88"/>`
      );
    }
    // 底部平远双箭虚线
    const ly = ty(Math.min(0.955, g.baseBottomY + 0.032));
    parts.push(
      `<line x1="${tx(tri.leftX)}" y1="${ly}" x2="${tx(tri.rightX)}" y2="${ly}" stroke="${p.guideLevel}" stroke-width="1.6" stroke-dasharray="6 4" opacity="0.85"/>`,
      `<polygon points="${(tri.leftX * W - 6).toFixed(1)},${ly} ${(tri.leftX * W + 4).toFixed(1)},${(Number(ly) - 4.5).toFixed(1)} ${(tri.leftX * W + 4).toFixed(1)},${(Number(ly) + 4.5).toFixed(1)}" fill="${p.guideLevel}"/>`,
      `<polygon points="${(tri.rightX * W + 6).toFixed(1)},${ly} ${(tri.rightX * W - 4).toFixed(1)},${(Number(ly) - 4.5).toFixed(1)} ${(tri.rightX * W - 4).toFixed(1)},${(Number(ly) + 4.5).toFixed(1)}" fill="${p.guideLevel}"/>`
    );
  }

  // 三轴撕裂红线警报
  if (!ev.checks.axis) {
    parts.push(
      `<line x1="${tx(g.peakX)}" y1="${ty(g.peakY + 0.08)}" x2="${tx(g.valleyX)}" y2="${ty(g.valleyY)}" stroke="#B32820" stroke-width="2" stroke-dasharray="4 3"/>`,
      `<circle cx="${tx(g.peakX)}" cy="${ty(g.peakY + 0.04)}" r="7" fill="none" stroke="#B32820" stroke-width="2"/>`,
      `<circle cx="${tx(g.valleyX)}" cy="${ty(g.valleyY)}" r="10" fill="none" stroke="#B32820" stroke-width="2"/>`
    );
  }

  // 接缝硬切红虚割线
  if (g.mist < 24) {
    parts.push(
      `<line x1="${tx(0.14)}" y1="${ty(g.peakBaseY)}" x2="${tx(0.86)}" y2="${ty(g.peakBaseY)}" stroke="#B32820" stroke-width="1.8" stroke-dasharray="8 4" opacity="0.85"/>`,
      `<line x1="${tx(0.10)}" y1="${ty(g.waterY - 0.04)}" x2="${tx(0.90)}" y2="${ty(g.waterY - 0.04)}" stroke="#B32820" stroke-width="1.8" stroke-dasharray="8 4" opacity="0.85"/>`
    );
  }

  // 前景堵口警报框
  if (state.clearance === "choked" || g.throatOpenPct < 62) {
    parts.push(
      `<rect x="${tx(g.valleyX - 0.13)}" y="${ty(g.valleyY + 0.01)}" width="${tx(0.26)}" height="${ty(0.21)}" fill="none" stroke="#B32820" stroke-width="1.8" stroke-dasharray="5 3"/>`
    );
  }

  const nextHtml = parts.join("");
  if (nextHtml !== lastOverlayHtml) {
    lastOverlayHtml = nextHtml;
    overlaySvg.innerHTML = nextHtml;
  }

  // 画布可直点排错按钮定位（正视模式下显示，三维剖轴时隐藏以免挡视线）
  const showPins = !state.view3d;
  pinAxis.hidden = !showPins || ev.checks.axis;
  if (!pinAxis.hidden) {
    pinAxis.style.left = `${clamp(g.peakX * 100 + 8, 22, 78)}%`;
    pinAxis.style.top = `${clamp(g.peakY * 100 + 16, 16, 40)}%`;
  }
  pinSeam.hidden = !showPins || ev.checks.seam;
  if (!pinSeam.hidden) {
    pinSeam.textContent = g.mist > 72 ? "浓雾吞山 · 点此散雾" : "硬切缝 · 点此生岚";
    pinSeam.style.left = "76%";
    pinSeam.style.top = `${clamp(g.peakBaseY * 100, 38, 58)}%`;
  }
  pinSpace.hidden = !showPins || ev.checks.space;
  if (!pinSpace.hidden) {
    pinSpace.textContent = state.clearance === "sparse" ? "空壳发飘 · 点此补稳" : "堵口 · 点此让路";
    pinSpace.style.left = `${clamp(g.valleyX * 100, 28, 72)}%`;
    pinSpace.style.top = `${clamp(g.valleyY * 100 + 18, 56, 82)}%`;
  }
}

function syncUI() {
  const ev = evaluate(state);
  const { high, deep, level, cut1, cut2 } = ev.weights;

  // 顶眉状态徽
  const topPill = $("top-status");
  topPill.textContent = ev.score === 4 ? "4 / 4 已成统筹" : `${ev.score} / 4 待统筹`;
  topPill.classList.toggle("is-ok", ev.score === 4);
  topPill.classList.toggle("is-bad", ev.score < 4);

  // 活体示范标题三色柱
  $("tg-h").style.height = `${clamp(Math.round((high / 72) * 28), 5, 28)}px`;
  $("tg-d").style.height = `${clamp(Math.round((deep / 72) * 28), 5, 28)}px`;
  $("tg-l").style.height = `${clamp(Math.round((level / 72) * 28), 5, 28)}px`;

  // 右上角原海报三圆点
  document.querySelectorAll("#dom-pips .pip").forEach((el, idx) => {
    const mode = ev.pips[idx];
    el.className = `pip is-${mode}`;
  });
  $("pips-cap").textContent = ev.checks.hierarchy
    ? `一主二辅 (${ev.dominant === "high" ? "高" : ev.dominant === "deep" ? "深" : "平"}为主)`
    : ev.fault === "single_collapse"
    ? "单远退化"
    : "三权互抢";

  // 题材按钮高亮
  document.querySelectorAll(".scene-btn").forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 三翼数值与状态
  $("pct-high").textContent = `${high}%`;
  $("pct-deep").textContent = `${deep}%`;
  $("role-high").textContent = ev.axisNotes.high.role;
  $("role-high").classList.toggle("is-bad", !ev.axisNotes.high.ok);
  $("role-deep").textContent = ev.axisNotes.deep.role;
  $("role-deep").classList.toggle("is-bad", !ev.axisNotes.deep.ok);
  $("role-level").textContent = ev.axisNotes.level.role;
  $("role-level").classList.toggle("is-ok", ev.axisNotes.level.ok);

  $("meta-high").textContent = ev.axisNotes.high.metric;
  $("bar-high").style.width = `${clamp(high, 6, 100)}%`;
  $("meta-deep").textContent = `${ev.geom.deepLayers} 重峦`;
  $("meta-level").textContent = `阔度 ${ev.geom.baseSpanPct}%`;

  // 轴向与留白按钮态
  document.querySelectorAll("[data-axis]").forEach((b) => {
    const on = b.dataset.axis === state.axisMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-clear]").forEach((b) => {
    const on = b.dataset.clear === state.clearance;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 烟岚滑块同步
  $("mist-slider").value = String(Math.round(state.mist));
  $("mist-val").textContent = `${Math.round(state.mist)}% · ${
    state.mist < 24 ? "硬切" : state.mist > 72 ? "吞山" : "通脉"
  }`;

  // 视角与标线按钮
  $("btn-view3d").classList.toggle("is-active", state.view3d);
  $("btn-view3d").setAttribute("aria-pressed", String(state.view3d));
  $("btn-view3d").textContent = state.view3d ? "返回正视成画" : "三维剖轴 XYZ";
  $("btn-guides").classList.toggle("is-active", state.showGuides);
  $("btn-guides").setAttribute("aria-pressed", String(state.showGuides));
  $("btn-guides").textContent = state.showGuides ? "标线：开" : "标线：关";

  // 底沿等式数字与状态章
  $("eq-high").textContent = `${high}%`;
  $("eq-deep").textContent = `${deep}%`;
  $("eq-level").textContent = `${level}%`;
  const eqRes = $("eq-result");
  eqRes.textContent = ev.score === 4 ? "统一空间逻辑" : `${ev.score} / 4 待统筹`;
  eqRes.classList.toggle("is-ok", ev.score === 4);
  eqRes.classList.toggle("is-bad", ev.score < 4);

  // 双游标分配尺几何宽度
  $("seg-high").style.width = `${high}%`;
  $("seg-deep").style.width = `${deep}%`;
  $("seg-level").style.width = `${level}%`;
  $("seg-high-v").textContent = `${high}%`;
  $("seg-deep-v").textContent = `${deep}%`;
  $("seg-level-v").textContent = `${level}%`;
  $("seg-high").querySelector(".seg-lbl").style.visibility = high >= 12 ? "visible" : "hidden";
  $("seg-deep").querySelector(".seg-lbl").style.visibility = deep >= 12 ? "visible" : "hidden";
  $("seg-level").querySelector(".seg-lbl").style.visibility = level >= 12 ? "visible" : "hidden";

  const k1 = $("knob-1");
  const k2 = $("knob-2");
  k1.style.left = `${cut1}%`;
  k2.style.left = `${cut2}%`;
  k1.setAttribute("aria-valuenow", String(cut1));
  k2.setAttribute("aria-valuenow", String(cut2));

  // 白话诊单与四项实测
  const diag = $("diag-card");
  diag.classList.toggle("is-ok", ev.score === 4);
  diag.classList.toggle("is-bad", ev.score < 4);
  $("diag-badge").textContent = ev.badge;
  $("diag-title").textContent = ev.title;
  $("diag-body").textContent = ev.body;
  $("diag-action").textContent = ev.action;

  ev.metrics.forEach((m, i) => {
    const dd = $(`m-${i}`);
    dd.textContent = m.value;
    const cell = dd.closest(".m-cell");
    cell.classList.toggle("is-bad", m.bad);
    cell.classList.toggle("is-ok", !m.bad);
  });

  renderStageOverlay(ev);
  // 正常动态下 loop() 已按 rAF 逐帧重绘，避免拖动事件里双次同步渲染拖慢软件 WebGL；仅减弱动态模式手动补绘
  if (reducedMotion.matches) stage.draw();
}

// ==================== 双游标三远权重分配尺交互 (data-perf-drag) ====================
const mixer = $("tri-mixer");
const knob1 = $("knob-1");
const knob2 = $("knob-2");
let activeKnob = null;
let dragRect = null;
let pendingDragSync = 0;

function scheduleDragSync() {
  if (pendingDragSync) return;
  pendingDragSync = requestAnimationFrame(() => {
    pendingDragSync = 0;
    syncUI();
  });
}

function applyDragAtClientX(clientX) {
  const rect = dragRect || mixer.getBoundingClientRect();
  if (rect.width < 10) return;
  const pct = clamp(((clientX - rect.left) / rect.width) * 100, 6, 94);
  const prev1 = state.cut1;
  const prev2 = state.cut2;
  if (activeKnob === 1) {
    state.cut1 = Math.round(clamp(pct, 6, 88));
    if (state.cut2 < state.cut1 + 6) state.cut2 = state.cut1 + 6;
  } else if (activeKnob === 2) {
    state.cut2 = Math.round(clamp(pct, 12, 94));
    if (state.cut1 > state.cut2 - 6) state.cut1 = state.cut2 - 6;
  }
  if (state.cut1 !== prev1 || state.cut2 !== prev2) scheduleDragSync();
}

function startDrag(clientX, forcedKnob) {
  dragRect = mixer.getBoundingClientRect();
  const pct = clamp(((clientX - dragRect.left) / dragRect.width) * 100, 0, 100);
  if (forcedKnob) activeKnob = forcedKnob;
  else {
    const w = getWeights(state);
    activeKnob = Math.abs(pct - w.cut1) <= Math.abs(pct - w.cut2) ? 1 : 2;
  }
  knob1.classList.toggle("is-dragging", activeKnob === 1);
  knob2.classList.toggle("is-dragging", activeKnob === 2);
  applyDragAtClientX(clientX);
}

function endDrag() {
  activeKnob = null;
  dragRect = null;
  knob1.classList.remove("is-dragging");
  knob2.classList.remove("is-dragging");
}

mixer.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  const forced = e.target.closest("#knob-1") ? 1 : e.target.closest("#knob-2") ? 2 : null;
  mixer.setPointerCapture(e.pointerId);
  startDrag(e.clientX, forced);
});
mixer.addEventListener("pointermove", (e) => {
  if (!activeKnob) return;
  applyDragAtClientX(e.clientX);
});
mixer.addEventListener("pointerup", endDrag);
mixer.addEventListener("pointercancel", endDrag);

// 键盘微调双游标
[knob1, knob2].forEach((knob, idx) => {
  knob.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 5 : 2;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      if (idx === 0) state.cut1 = clamp(state.cut1 - step, 6, state.cut2 - 6);
      else state.cut2 = clamp(state.cut2 - step, state.cut1 + 6, 94);
      syncUI();
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      if (idx === 0) state.cut1 = clamp(state.cut1 + step, 6, state.cut2 - 6);
      else state.cut2 = clamp(state.cut2 + step, state.cut1 + 6, 94);
      syncUI();
    }
  });
});

// 开场控件事件绑定
document.querySelectorAll(".scene-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scene = btn.dataset.scene;
    syncUI();
  });
});

function setAxisMode(mode) {
  state.axisMode = mode;
  if (mode === "split") {
    state.peakOffset = -0.16;
    state.valleyOffset = 0.18;
    state.waterTiltDeg = 7;
  } else if (mode === "center") {
    state.peakOffset = 0;
    state.valleyOffset = 0;
    state.waterTiltDeg = 0;
  } else {
    state.peakOffset = 0.04;
    state.valleyOffset = -0.05;
    state.waterTiltDeg = 0;
  }
  syncUI();
}
document.querySelectorAll("[data-axis]").forEach((btn) => {
  btn.addEventListener("click", () => setAxisMode(btn.dataset.axis));
});

$("mist-slider").addEventListener("input", (e) => {
  state.mist = Number(e.target.value);
  syncUI();
});

document.querySelectorAll("[data-clear]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.clearance = btn.dataset.clear;
    syncUI();
  });
});

$("btn-view3d").addEventListener("click", () => {
  state.view3d = !state.view3d;
  syncUI();
});
$("btn-guides").addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  syncUI();
});

// 画布直点排错按钮
pinAxis.addEventListener("click", () => setAxisMode("center"));
pinSeam.addEventListener("click", () => {
  state.mist = 46;
  syncUI();
});
pinSpace.addEventListener("click", () => {
  state.clearance = "balanced";
  syncUI();
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = PRESET_SOLUTIONS[btn.dataset.preset];
    if (!preset) return;
    Object.assign(state, preset);
    syncUI();
  });
});

syncUI();

// ==================== 2. 01 节：三远 X 光叠层复选开关 ====================
const xrayLayers = { high: true, deep: true, level: true };
const XRAY_COPY = {
  "111": ["三远合体 · 闭环", "三层同在：目光先沿高远主峰仰升，再经中段重峦向内游探，最后落回阔水基台左右舒展——一幅画收尽仰、窥、望三种身体体验。", false],
  "100": ["仅余高远 · 缺根缺深", "只留高远：主峰耸拔有力，但脚下悬空、背后单薄，看一眼就到顶，视线留不住。", true],
  "010": ["仅余深远 · 幽闭乏势", "只留深远：山坳重重叠叠，却既没有冲天脊梁撑开格局，也没有阔水平岸让人喘口气。", true],
  "001": ["仅余平远 · 平阔缺骨", "只留平远：水面安静辽阔，但横向展开久了容易平淡，缺少垂直的视觉锚点。", true],
  "110": ["高 + 深 · 缺底稳", "有高耸也有幽深，可惜少了底沿平远水岸托底，整座山像悬在半空，紧张感下不来。", true],
  "101": ["高 + 平 · 中段跳断", "峰顶与水面形成强烈对比，却漏掉深远重峦做过渡，前近与远巅之间像凭空断了一截。", true],
  "011": ["深 + 平 · 缺统领峰", "纵深与开阔都很舒缓，但少了高远主峰立骨，画面容易温柔有余而气势不足。", true],
  "000": ["三层已关 · 空白宣纸", "请打开至少一层空间，对照单远、双远与三远合体时的观看差别。", true],
};

function syncXray() {
  const key = `${xrayLayers.high ? 1 : 0}${xrayLayers.deep ? 1 : 0}${xrayLayers.level ? 1 : 0}`;
  const [badge, text, warn] = XRAY_COPY[key];
  $("xl-high").classList.toggle("is-off", !xrayLayers.high);
  $("xl-deep").classList.toggle("is-off", !xrayLayers.deep);
  $("xl-level").classList.toggle("is-off", !xrayLayers.level);
  $("xl-empty").setAttribute("opacity", key === "000" ? "1" : "0");
  $("xray-badge").textContent = badge;
  $("xray-badge").classList.toggle("is-warn", warn);
  $("xray-caption").textContent = text;
}
document.querySelectorAll(".layer-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.layer;
    xrayLayers[k] = !xrayLayers[k];
    btn.classList.toggle("is-on", xrayLayers[k]);
    btn.setAttribute("aria-pressed", String(xrayLayers[k]));
    syncXray();
  });
});
syncXray();

// ==================== 3. 02 节：三元重心三角罗盘 ====================
const ternSvg = $("ternary-svg");
const ternPuck = $("tern-puck");
const ternMini = $("tern-mini");
const V_HIGH = { x: 190, y: 34 };
const V_LEVEL = { x: 42, y: 290 };
const V_DEEP = { x: 338, y: 290 };

function updateTernary(wH, wD, wL) {
  const sum = wH + wD + wL;
  const h = Math.round((wH / sum) * 100);
  const d = Math.round((wD / sum) * 100);
  const l = 100 - h - d;

  const px = (h * V_HIGH.x + d * V_DEEP.x + l * V_LEVEL.x) / 100;
  const py = (h * V_HIGH.y + d * V_DEEP.y + l * V_LEVEL.y) / 100;
  ternPuck.setAttribute("transform", `translate(${px.toFixed(1)} ${py.toFixed(1)})`);

  // 判定所落区域
  const arr = [
    { k: "高远", v: h },
    { k: "深远", v: d },
    { k: "平远", v: l },
  ].sort((a, b) => b.v - a.v);
  const isFight = arr[0].v < 44 || arr[0].v - arr[1].v < 10;
  const isSingle = arr[2].v < 14 || arr[0].v > 72;

  const badge = $("tern-badge");
  const readout = $("tern-readout");
  if (isFight) {
    badge.textContent = "错区 · 三权打架";
    badge.classList.add("is-warn");
    readout.innerHTML = `<strong>高 ${h}% · 深 ${d}% · 平 ${l}%</strong><p>落在中央均分区：三个方向谁也不肯当配角，视线在峰尖、深谷与水岸间来回拉扯，整幅画没了主心骨。</p>`;
  } else if (isSingle) {
    badge.textContent = `退化 · 近乎单一${arr[0].k}`;
    badge.classList.add("is-warn");
    readout.innerHTML = `<strong>高 ${h}% · 深 ${d}% · 平 ${l}%</strong><p>${arr[0].k}占到 ${arr[0].v}%，${arr[2].k}只剩 ${arr[2].v}%，画面已退回单一远法，不再具备三远互补的纵横张力。</p>`;
  } else {
    badge.textContent = `一主二辅 · ${arr[0].k}领势`;
    badge.classList.remove("is-warn");
    const desc =
      arr[0].k === "高远"
        ? "高远主峰统领全画骨气，深远谷道与平远水岸作为两翼稳稳护持。"
        : arr[0].k === "深远"
        ? "重峦幽谷成为主角，高远主脊补起精神，平远河口引观者入画。"
        : "阔水横带铺出辽远心境，高远奇峰与深远山坳点缀其间打破平淡。";
    readout.innerHTML = `<strong>高 ${h}% · 深 ${d}% · 平 ${l}%</strong><p>${desc}</p>`;
  }

  // 右侧微缩构图草图联动绘制
  const peakTop = clamp(104 - h * 1.45, 12, 92);
  const valleyLayers = d < 16 ? 1 : d < 36 ? 2 : 3;
  const baseW = clamp(70 + l * 2.2, 76, 204);
  const waterY = clamp(134 - l * 0.45, 102, 136);
  let layersSvg = "";
  for (let i = 0; i < valleyLayers; i++) {
    const off = (valleyLayers - 1 - i) * 14;
    const col = i === 0 ? "#907CB5" : i === 1 ? "#452F8D" : "#2C1966";
    layersSvg += `<path d="M${110 - 52 + i * 8} ${waterY}L${110 - 20 + i * 6} ${waterY - 26 - off * 0.6}L${110 + 18} ${waterY}Z" fill="${col}"/>`;
    layersSvg += `<path d="M${110 - 14} ${waterY}L${110 + 28 - i * 5} ${waterY - 24 - off * 0.55}L${110 + 56 - i * 8} ${waterY}Z" fill="${col}"/>`;
  }
  ternMini.innerHTML = `
    <rect width="220" height="164" fill="#F8EFE0"/>
    <circle cx="110" cy="${(peakTop + 26).toFixed(1)}" r="${(14 + h * 0.2).toFixed(1)}" fill="#F3DCAC"/>
    <path d="M110 ${peakTop.toFixed(1)}L${(110 + 24 + h * 0.35).toFixed(1)} ${waterY.toFixed(1)}H${(110 - 24 - h * 0.35).toFixed(1)}Z" fill="#64519E"/>
    ${layersSvg}
    <rect x="${((220 - baseW) / 2).toFixed(1)}" y="${waterY.toFixed(1)}" width="${baseW.toFixed(1)}" height="${(156 - waterY).toFixed(1)}" fill="#312068"/>
    <circle cx="${(110 - baseW * 0.26).toFixed(1)}" cy="${(waterY + 12).toFixed(1)}" r="8" fill="#EF6841"/>
    <rect x="${(110 + baseW * 0.16).toFixed(1)}" y="${(waterY + 8).toFixed(1)}" width="16" height="9" fill="#F6C34E"/>
  `;
}

function pointToBarycentric(clientX, clientY) {
  const rect = ternSvg.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 380;
  const y = ((clientY - rect.top) / rect.height) * 336;
  const det =
    (V_DEEP.y - V_LEVEL.y) * (V_HIGH.x - V_LEVEL.x) +
    (V_LEVEL.x - V_DEEP.x) * (V_HIGH.y - V_LEVEL.y);
  let l1 = ((V_DEEP.y - V_LEVEL.y) * (x - V_LEVEL.x) + (V_LEVEL.x - V_DEEP.x) * (y - V_LEVEL.y)) / det;
  let l2 = ((V_LEVEL.y - V_HIGH.y) * (x - V_LEVEL.x) + (V_HIGH.x - V_LEVEL.x) * (y - V_LEVEL.y)) / det;
  let l3 = 1 - l1 - l2;
  l1 = Math.max(0.04, l1);
  l2 = Math.max(0.04, l2);
  l3 = Math.max(0.04, l3);
  updateTernary(l1 * 100, l2 * 100, l3 * 100);
}

let ternDragging = false;
ternSvg.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  ternDragging = true;
  ternSvg.setPointerCapture(e.pointerId);
  pointToBarycentric(e.clientX, e.clientY);
});
ternSvg.addEventListener("pointermove", (e) => {
  if (!ternDragging) return;
  pointToBarycentric(e.clientX, e.clientY);
});
ternSvg.addEventListener("pointerup", () => {
  ternDragging = false;
});
ternSvg.addEventListener("pointercancel", () => {
  ternDragging = false;
});

document.querySelectorAll("[data-tp]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const [h, d, l] = btn.dataset.tp.split(",").map(Number);
    updateTernary(h, d, l);
  });
});
updateTernary(52, 24, 24);

// ==================== 4. 03 节：北宋名画三远视游路径播放器 ====================
const TOUR_DATA = {
  zaochun: {
    title: "立轴范式：《早春图》S 脉三远结构",
    path: "M128 294 C156 266 244 258 292 224 C346 186 208 166 238 118 C258 86 270 68 264 46",
    stops: [
      { x: 132, y: 290, col: "#FF9470", tag: "第 1 站 · 平远入境", text: "视线从左下近坡与河谷水岸入画，先以平远交代舟桥尺度，让观者脚步轻缓落地。" },
      { x: 288, y: 214, col: "#CBBDF0", tag: "第 2 站 · 深远游谷", text: "目光沿 S 形烟岚盘折入右侧曲涧，穿过重重山石与云间楼阁，体验由前窥后的层层纵深。" },
      { x: 264, y: 54, col: "#F6C34E", tag: "第 3 站 · 高远登顶", text: "最终沿中轴云气直仰巍峨主峰，同时左侧敞开的远岫河谷再次呼应平远，一轴兼得三远。" },
    ],
    art: `
      <rect width="520" height="340" fill="#140D2C"/>
      <rect x="116" y="16" width="288" height="308" fill="#1D1540" stroke="#907CB5" stroke-width="1.4"/>
      <path d="M262 34L324 156H204Z" fill="#4B3B85"/>
      <path d="M190 144L256 88L318 156L266 206Z" fill="#6856A3" opacity="0.88"/>
      <path d="M250 184L344 134L384 226H220Z" fill="#322368"/>
      <path d="M132 232Q188 214 236 228Q292 246 376 230V298H132Z" fill="#261B52"/>
      <path d="M138 200H214M144 214H198" stroke="#FF9470" stroke-width="1.5" opacity="0.7"/>
      <path d="M180 158Q258 144 338 168" fill="none" stroke="#DFCBE2" stroke-width="10" stroke-linecap="round" opacity="0.22"/>
      <text x="132" y="42" fill="#F6C34E" font-size="11" font-weight="700">↑ 高远主峰</text>
      <text x="386" y="190" text-anchor="end" fill="#CBBDF0" font-size="11" font-weight="700">→ 深远曲涧</text>
      <text x="156" y="295" fill="#FF9470" font-size="11" font-weight="700">↔ 平远河谷</text>
    `,
  },
  qianli: {
    title: "长卷范式：《千里江山图》平远统领起伏",
    path: "M466 246 C406 232 372 132 318 118 C264 104 242 214 190 202 C136 190 116 102 68 152",
    stops: [
      { x: 454, y: 242, col: "#FF9470", tag: "第 1 站 · 平远展卷", text: "手卷自右向左徐徐展开，先用辽阔江面与沙洲铺开平远基调，定住近十二米长卷的呼吸节奏。" },
      { x: 318, y: 120, col: "#F6C34E", tag: "第 2 站 · 拔起高远", text: "行至中段骤然起峰，石青石绿堆叠出高远山脊，把平稳的水平线条猛然推向视觉高潮。" },
      { x: 188, y: 200, col: "#CBBDF0", tag: "第 3 站 · 折入深远", text: "峰腰退落处藏进曲水长桥与重重村坞，视线随之向内探幽，随后再度敞开平远江天。" },
    ],
    art: `
      <rect width="520" height="340" fill="#140D2C"/>
      <rect x="20" y="64" width="480" height="214" fill="#1D1540" stroke="#907CB5" stroke-width="1.4"/>
      <path d="M34 236H486V268H34Z" fill="#253463"/>
      <path d="M248 236L318 92L388 236Z" fill="#3B6C82"/>
      <path d="M52 236L108 118L164 236Z" fill="#2D5A73"/>
      <path d="M148 236L208 156L276 236Z" fill="#4E877D"/>
      <path d="M366 236L422 174L478 236Z" fill="#355D76"/>
      <path d="M64 252H174M236 258H352M390 250H466" stroke="#C5DDD0" stroke-width="1.6" opacity="0.65"/>
      <text x="476" y="226" text-anchor="end" fill="#FF9470" font-size="11" font-weight="700">↔ 平远入卷（自右向左）</text>
      <text x="318" y="84" text-anchor="middle" fill="#F6C34E" font-size="11" font-weight="700">↑ 骤起高远峰</text>
      <text x="206" y="148" text-anchor="middle" fill="#CBBDF0" font-size="11" font-weight="700">→ 深远村坞</text>
    `,
  },
};

let tourKey = "zaochun";
let tourVal = 18;
let tourPlaying = false;
let tourRaf = 0;

function renderTour() {
  const data = TOUR_DATA[tourKey];
  $("tour-title").textContent = data.title;
  const stopsHtml = data.stops
    .map(
      (s, i) => `
    <circle cx="${s.x}" cy="${s.y}" r="8" fill="${s.col}" opacity="0.28"/>
    <circle cx="${s.x}" cy="${s.y}" r="4.5" fill="${s.col}"/>
    <text x="${s.x}" y="${s.y + 3.5}" text-anchor="middle" fill="#140D2C" font-size="8.5" font-weight="800">${i + 1}</text>
  `
    )
    .join("");

  $("tour-svg").innerHTML = `
    ${data.art}
    <path d="${data.path}" fill="none" stroke="rgba(248,239,224,0.28)" stroke-width="2.5" stroke-dasharray="6 5"/>
    <path id="tour-active-path" d="${data.path}" fill="none" stroke="#F6C34E" stroke-width="3" stroke-linecap="round"/>
    ${stopsHtml}
    <g id="tour-dot"><circle r="10" fill="#FF9470" opacity="0.32"/><circle r="5.5" fill="#FFF8EC" stroke="#FF9470" stroke-width="2.5"/></g>
  `;

  const pathEl = $("tour-active-path");
  const len = pathEl.getTotalLength();
  const drawLen = (tourVal / 100) * len;
  pathEl.style.strokeDasharray = `${drawLen} ${len + 4}`;
  const pt = pathEl.getPointAtLength(drawLen);
  $("tour-dot").setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);

  const idx = tourVal < 36 ? 0 : tourVal < 72 ? 1 : 2;
  const st = data.stops[idx];
  $("tour-pct").textContent = `0${idx + 1} / 03`;
  $("tn-tag").textContent = st.tag;
  $("tn-text").textContent = st.text;
}

function stopTourPlay() {
  tourPlaying = false;
  if (tourRaf) cancelAnimationFrame(tourRaf);
  tourRaf = 0;
  $("tour-play").classList.remove("is-playing");
  $("tour-play").setAttribute("aria-pressed", "false");
  $("tour-play").textContent = "自动游览";
}

$("tour-play").addEventListener("click", () => {
  if (tourPlaying) {
    stopTourPlay();
    return;
  }
  if (reducedMotion.matches) {
    tourVal = tourVal >= 95 ? 15 : Math.min(100, tourVal + 38);
    $("tour-step").value = String(Math.round(tourVal));
    renderTour();
    return;
  }
  tourPlaying = true;
  $("tour-play").classList.add("is-playing");
  $("tour-play").setAttribute("aria-pressed", "true");
  $("tour-play").textContent = "暂停游览";
  if (tourVal >= 98) tourVal = 0;
  let last = performance.now();
  const tick = (now) => {
    if (!tourPlaying) return;
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    tourVal += dt * 22;
    if (tourVal >= 100) {
      tourVal = 100;
      $("tour-step").value = "100";
      renderTour();
      stopTourPlay();
      return;
    }
    $("tour-step").value = String(Math.round(tourVal));
    renderTour();
    tourRaf = requestAnimationFrame(tick);
  };
  tourRaf = requestAnimationFrame(tick);
});

$("tour-step").addEventListener("input", (e) => {
  stopTourPlay();
  tourVal = Number(e.target.value);
  renderTour();
});

document.querySelectorAll(".dark-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    stopTourPlay();
    tourKey = btn.dataset.tour;
    tourVal = 18;
    $("tour-step").value = "18";
    document.querySelectorAll(".dark-tab").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderTour();
  });
});
renderTour();

// ==================== 5. 04 节：现代跨界画廊骨架开关 ====================
const btnSkeleton = $("btn-skeleton");
const appGrid = $("app-grid");
btnSkeleton.addEventListener("click", () => {
  const on = !appGrid.classList.contains("show-skel");
  appGrid.classList.toggle("show-skel", on);
  btnSkeleton.classList.toggle("is-active", on);
  btnSkeleton.setAttribute("aria-pressed", String(on));
  btnSkeleton.textContent = on ? "叠显三远骨架线：开" : "叠显三远骨架线：关";
});

// ==================== 6. 05 节：画幅缩放压力测试 ====================
const scaleSlider = $("scale-slider");
function syncScaleLab() {
  const px = Number(scaleSlider.value);
  $("scale-px").textContent = `${px}px`;
  const host = $("card-multi").parentElement;
  const maxW = Math.min(420, Math.max(180, (host ? host.clientWidth - 16 : 360)));
  const minW = Math.min(104, maxW * 0.36);
  const disp = Math.round(minW + ((px - 160) / (960 - 160)) * (maxW - minW));
  $("card-multi").style.width = `${disp}px`;
  $("card-single").style.width = `${disp}px`;

  const pMulti = $("pill-multi");
  const pSingle = $("pill-single");
  const verdict = $("scale-verdict");
  if (px <= 300) {
    pMulti.textContent = "细节糊成一团";
    pMulti.classList.add("is-bad");
    pSingle.textContent = "小图依旧利落";
    pSingle.classList.remove("is-bad");
    verdict.innerHTML = `当前展示宽 <strong>${px}px</strong>（信息流缩略卡尺度）：三远综合版的细波、多层山坳与小字全挤成灰块；此时直接退回单焦点简化版反而一眼可读。`;
  } else if (px <= 540) {
    pMulti.textContent = "勉强可辨";
    pMulti.classList.add("is-bad");
    pSingle.textContent = "主次清晰";
    pSingle.classList.remove("is-bad");
    verdict.innerHTML = `当前展示宽 <strong>${px}px</strong>（中号卡片尺度）：三远综合版开始显出拥挤，必须大幅精简深远层数与前景细件，否则不如单远干脆。`;
  } else {
    pMulti.textContent = "清晰从容";
    pMulti.classList.remove("is-bad");
    pSingle.textContent = "层次偏单薄";
    pSingle.classList.remove("is-bad");
    verdict.innerHTML = `当前展示宽 <strong>${px}px</strong>（大画幅海报/宽屏尺度）：画幅充裕，三远综合版的高峰、重峦与阔水层次分明，叙事气度远胜单远简版。`;
  }
}
scaleSlider.addEventListener("input", syncScaleLab);
window.addEventListener("resize", syncScaleLab);
syncScaleLab();

// ==================== 7. 06 节：单变量眼力小测 ====================
const QUIZ_QUESTIONS = [
  {
    prompt: "同一套山川素材，四个方案只差空间配比与轴向这一个变量。哪一张真正做到了「一主二辅、空间逻辑统一」？",
    answer: "C",
    options: [
      {
        id: "A",
        label: "方案 A",
        why: "高远、深远、平远近似 33 / 33 / 34 均分，三股力量互抢注意力，整幅画没有主远统领。",
        svg: `
          <rect width="260" height="180" fill="#F8EFE0"/>
          <path d="M130 44L174 110H86Z" fill="#64519E"/>
          <path d="M70 76L114 134H26Z" fill="#2C1966"/>
          <path d="M190 76L234 134H146Z" fill="#452F8D"/>
          <path d="M130 82L168 134H92Z" fill="#7763A7"/>
          <rect x="22" y="130" width="216" height="40" fill="#312068"/>
          <circle cx="72" cy="148" r="14" fill="#EF6841"/>
          <rect x="176" y="142" width="38" height="16" fill="#EE6A42"/>
        `,
        reveal: `<text x="130" y="24" text-anchor="middle" fill="#B32820" font-size="11" font-weight="800">33% : 33% : 34% 均权打架</text>`,
      },
      {
        id: "B",
        label: "方案 B",
        why: "高远主峰独占超过 80% 画幅，深远重峦与平远阔水被挤成底边细丝，已退化为单一高远法。",
        svg: `
          <rect width="260" height="180" fill="#F8EFE0"/>
          <circle cx="130" cy="48" r="30" fill="#F3DCAC"/>
          <path d="M130 8L206 164H54Z" fill="#64519E"/>
          <path d="M130 8L206 164H130Z" fill="#43307B"/>
          <path d="M96 146L130 132L164 146Z" fill="#7763A7"/>
          <rect x="78" y="164" width="104" height="10" fill="#312068"/>
          <circle cx="100" cy="168" r="5" fill="#EF6841"/>
        `,
        reveal: `<text x="130" y="24" text-anchor="middle" fill="#B32820" font-size="11" font-weight="800">高远 84% · 退化为单远</text>`,
      },
      {
        id: "C",
        label: "方案 C",
        why: "答对了！高远主峰约占 54% 立起统领骨气，中段深远重峦穿深约 24%，底沿平远阔水稳托约 22%，三轴齐收同一三角骨架。",
        svg: `
          <rect width="260" height="180" fill="#F8EFE0"/>
          <circle cx="130" cy="52" r="28" fill="#F3DCAC"/>
          <path d="M130 18L166 102H94Z" fill="#64519E"/>
          <path d="M130 68L182 132H78Z" fill="#DFCBE2"/>
          <path d="M84 92L116 136H52Z" fill="#2C1966"/>
          <path d="M176 94L208 136H144Z" fill="#452F8D"/>
          <path d="M130 94L156 134H104Z" fill="#7763A7"/>
          <circle cx="130" cy="122" r="4.5" fill="#EF6841"/>
          <rect x="44" y="134" width="172" height="10" fill="#8674AE"/>
          <polygon points="30,144 230,144 244,166 16,166" fill="#312068"/>
          <circle cx="80" cy="152" r="11" fill="#EF6841"/>
          <rect x="176" y="150" width="22" height="11" fill="#EE6A42"/>
        `,
        reveal: `<polygon points="130,14 16,166 244,166" fill="none" stroke="#1B6B58" stroke-width="1.8" stroke-dasharray="5 4"/><text x="130" y="177" text-anchor="middle" fill="#1B6B58" font-size="10.5" font-weight="800">一主二辅 · 三轴统合</text>`,
      },
      {
        id: "D",
        label: "方案 D",
        why: "占比虽然合理，但高远峰尖向左斜偏、深远谷口向右甩出、平远水岸跟着倾斜，三套透视各奔东西导致空间撕裂。",
        svg: `
          <rect width="260" height="180" fill="#F8EFE0"/>
          <circle cx="88" cy="52" r="26" fill="#F3DCAC"/>
          <path d="M84 18L124 102H46Z" fill="#64519E"/>
          <path d="M150 86L194 138H116Z" fill="#452F8D"/>
          <path d="M186 92L224 138H148Z" fill="#2C1966"/>
          <circle cx="176" cy="120" r="4.5" fill="#EF6841"/>
          <g transform="rotate(7 130 150)">
            <polygon points="24,142 236,142 246,166 14,166" fill="#312068"/>
            <circle cx="76" cy="152" r="11" fill="#EF6841"/>
            <rect x="180" y="150" width="22" height="11" fill="#EE6A42"/>
          </g>
        `,
        reveal: `<line x1="84" y1="22" x2="176" y2="120" stroke="#B32820" stroke-width="2" stroke-dasharray="4 3"/><text x="130" y="176" text-anchor="middle" fill="#B32820" font-size="10.5" font-weight="800">三轴错位 · 透视撕裂</text>`,
      },
    ],
  },
  {
    prompt: "这四张都采用了高远为主的合理配比，唯一变量是「三层交界过渡与前景位置」。哪一张气脉贯通且不堵视线？",
    answer: "D",
    options: [
      {
        id: "A",
        label: "方案 A",
        why: "高远、深远、平远之间用两条生硬横缝一刀切开，全无云岚或明暗缓冲，像三张不相关的风景贴片。",
        svg: `
          <rect width="260" height="180" fill="#F8EFE0"/>
          <path d="M130 16L172 72H88Z" fill="#64519E"/>
          <line x1="16" y1="74" x2="244" y2="74" stroke="#2C1954" stroke-width="2.4"/>
          <path d="M74 80L110 124H40Z" fill="#2C1966"/>
          <path d="M186 80L220 124H150Z" fill="#452F8D"/>
          <path d="M130 84L158 124H102Z" fill="#7763A7"/>
          <line x1="16" y1="126" x2="244" y2="126" stroke="#2C1954" stroke-width="2.4"/>
          <rect x="28" y="132" width="204" height="32" fill="#312068"/>
          <circle cx="76" cy="148" r="10" fill="#EF6841"/>
        `,
        reveal: `<text x="130" y="176" text-anchor="middle" fill="#B32820" font-size="10.5" font-weight="800">两道硬切 · 拼贴断层</text>`,
      },
      {
        id: "B",
        label: "方案 B",
        why: "白色雾块糊满整片中段，把深远重峦和远心落日全吞没了，纵深空间彻底消失。",
        svg: `
          <rect width="260" height="180" fill="#F8EFE0"/>
          <path d="M130 16L168 102H92Z" fill="#64519E"/>
          <path d="M84 92L116 136H52Z" fill="#2C1966" opacity="0.22"/>
          <path d="M176 92L208 136H144Z" fill="#452F8D" opacity="0.22"/>
          <rect x="12" y="64" width="236" height="76" fill="#F8EFE0" opacity="0.86"/>
          <polygon points="30,144 230,144 244,166 16,166" fill="#312068"/>
          <circle cx="80" cy="152" r="10" fill="#EF6841"/>
        `,
        reveal: `<text x="130" y="110" text-anchor="middle" fill="#B32820" font-size="11" font-weight="800">浓雾吞没深远层</text>`,
      },
      {
        id: "C",
        label: "方案 C",
        why: "前景大圆与方块硕大且堆在谷口正中，直接封死了进入深远山坳的视线通道。",
        svg: `
          <rect width="260" height="180" fill="#F8EFE0"/>
          <circle cx="130" cy="50" r="26" fill="#F3DCAC"/>
          <path d="M130 18L166 100H94Z" fill="#64519E"/>
          <path d="M84 92L116 136H52Z" fill="#2C1966"/>
          <path d="M176 92L208 136H144Z" fill="#452F8D"/>
          <polygon points="30,144 230,144 244,166 16,166" fill="#312068"/>
          <circle cx="116" cy="134" r="24" fill="#EF6841"/>
          <rect x="130" y="122" width="44" height="28" fill="#EE6A42"/>
        `,
        reveal: `<rect x="88" y="106" width="90" height="54" fill="none" stroke="#B32820" stroke-width="2" stroke-dasharray="4 3"/><text x="130" y="176" text-anchor="middle" fill="#B32820" font-size="10.5" font-weight="800">前景堵死入谷口</text>`,
      },
      {
        id: "D",
        label: "方案 D",
        why: "答对了！山腰一层柔和轻岚自然过渡高远与深远，前景圆块与暖金方体退让两侧锚定尺度，视线可畅通无阻地升、探、展。",
        svg: `
          <rect width="260" height="180" fill="#F8EFE0"/>
          <circle cx="130" cy="52" r="26" fill="#F3DCAC"/>
          <path d="M130 18L166 102H94Z" fill="#64519E"/>
          <path d="M130 70L180 132H80Z" fill="#DFCBE2"/>
          <path d="M84 92L116 136H52Z" fill="#2C1966"/>
          <path d="M176 92L208 136H144Z" fill="#452F8D"/>
          <path d="M130 96L154 134H106Z" fill="#7763A7"/>
          <rect x="52" y="88" width="156" height="12" rx="6" fill="#F8EFE0" opacity="0.62"/>
          <circle cx="130" cy="122" r="4.5" fill="#EF6841"/>
          <polygon points="30,144 230,144 244,166 16,166" fill="#312068"/>
          <circle cx="72" cy="152" r="10" fill="#EF6841"/>
          <rect x="176" y="148" width="22" height="11" fill="#F6C34E"/>
        `,
        reveal: `<text x="130" y="176" text-anchor="middle" fill="#1B6B58" font-size="10.5" font-weight="800">轻岚衔脉 · 通道敞亮</text>`,
      },
    ],
  },
];

let quizIdx = 0;
let quizPicked = null;

function renderQuiz() {
  const q = QUIZ_QUESTIONS[quizIdx];
  $("quiz-prompt").textContent = q.prompt;
  const grid = $("quiz-grid");
  grid.innerHTML = q.options
    .map((opt) => {
      const answered = quizPicked !== null;
      const isRight = answered && opt.id === q.answer;
      const isWrong = answered && opt.id === quizPicked && opt.id !== q.answer;
      const cls = isRight ? "is-right" : isWrong ? "is-wrong" : "";
      const note = !answered ? "点按选择" : isRight ? "正确统筹" : "存在失误";
      return `
        <button type="button" class="quiz-opt ${cls}" data-opt="${opt.id}" aria-pressed="${quizPicked === opt.id}">
          <svg viewBox="0 0 260 180" aria-hidden="true">${opt.svg}${answered ? opt.reveal : ""}</svg>
          <div class="quiz-opt-foot"><span>${opt.label}</span><span class="quiz-opt-note">${note}</span></div>
        </button>
      `;
    })
    .join("");

  const verdict = $("quiz-verdict");
  verdict.classList.remove("is-right", "is-wrong");
  if (quizPicked === null) {
    $("qv-title").textContent = "凭眼力选一张方案。";
    $("qv-body").textContent = "四张图的色彩、画材与元素完全一致，只差一个构图变量；选完后会亮出每张图的骨架与成败理由。";
  } else {
    const pickedOpt = q.options.find((o) => o.id === quizPicked);
    const ok = quizPicked === q.answer;
    verdict.classList.add(ok ? "is-right" : "is-wrong");
    $("qv-title").textContent = ok
      ? `选对了：${pickedOpt.label} 真正统合了三远`
      : `再看一眼：${pickedOpt.label} 有破绽（正解为方案 ${q.answer}）`;
    $("qv-body").textContent = pickedOpt.why;
  }

  grid.querySelectorAll(".quiz-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      quizPicked = btn.dataset.opt;
      renderQuiz();
    });
  });
}

document.querySelectorAll(".quiz-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    quizIdx = Number(btn.dataset.q);
    quizPicked = null;
    document.querySelectorAll(".quiz-tab").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderQuiz();
  });
});
renderQuiz();

// ==================== 8. 07 节：原海报灯箱（缩放、拖动、Esc 关） ====================
const lb = $("lightbox");
const lbImg = $("lb-img");
const lbStage = $("lb-stage");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  $("lb-zoom").textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = $("poster").src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lb.hidden = false;
  $("lb-close").focus();
}

function closeLightbox() {
  lb.hidden = true;
  $("poster-trigger").focus();
}

$("poster-trigger").addEventListener("click", openLightbox);
$("lb-close").addEventListener("click", closeLightbox);
$("lb-in").addEventListener("click", () => {
  lbScale = clamp(lbScale + 0.35, 0.7, 3.2);
  applyLbTransform();
});
$("lb-out").addEventListener("click", () => {
  lbScale = clamp(lbScale - 0.35, 0.7, 3.2);
  applyLbTransform();
});
$("lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

lbStage.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.18 : -0.18), 0.7, 3.2);
    applyLbTransform();
  },
  { passive: false }
);
lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lbScale === 1) {
    closeLightbox();
    return;
  }
  lbDrag = { x: e.clientX - lbX, y: e.clientY - lbY };
  lbStage.classList.add("is-dragging");
  lbStage.setPointerCapture(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbDrag.x;
  lbY = e.clientY - lbDrag.y;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => {
  lbDrag = null;
  lbStage.classList.remove("is-dragging");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lb.hidden) closeLightbox();
});

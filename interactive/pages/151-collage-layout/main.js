// 151 拼贴版式 · 主交互脚本（main.js）
// 开场活体手工台 + 01 轴测剥层 + 02 纸材对撞 + 03 暗房加贴压力 + 04 百年档案 + 05 场景翻转 + 06 单变量练习 + 07 海报灯箱

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  BOARD_ASPECT,
  MATERIALS,
  THEMES,
  clampScrapPos,
  createBalancedScraps,
  createBrokenScraps,
  createInitialState,
  evaluate,
  normalizeZ,
  pickTopScrap,
} from "./model.js";
import { renderBoard } from "./artwork.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

// ==================== 开场：活体拼贴手工台 ====================
const state = createInitialState();
const canvas = $("#collage-canvas");
const ctx = canvas.getContext("2d");

let evalRes = evaluate(state);
let draggingId = null;
let dragOffset = { x: 0, y: 0 };
let pointerMode = null; // null | "pending" | "dragging" | "scroll"
let startPt = { x: 0, y: 0 };
let activeTouchId = null;
let introProgress = reducedMotion.matches ? 1 : 0;
let dirty = true;
const liftMap = new Map();

function syncCanvasSize() {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(240, Math.round(rect.width));
  const h = Math.max(160, Math.round(w / BOARD_ASPECT));
  const dpr = pixelRatio(2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    dirty = true;
  }
  return { w, h, dpr };
}

function getSelectedScrap() {
  return state.scraps.find((s) => s.id === state.selectedId) || null;
}

function updateUI() {
  evalRes = evaluate(state);
  const { score, whitespacePct, overlapPct, focalOcclusionPct, imbalancePct, pillars, primary } = evalRes;

  // 顶眉印章
  const stamp = $("#hero-status");
  stamp.textContent = score === 4 ? "4 / 4 层次成立" : `${score} / 4 待理层`;
  stamp.className = `status-stamp ${score === 4 ? "is-ok" : "is-err"}`;

  // 诊单卡片
  const badge = $("#diag-badge");
  badge.textContent = primary.tag;
  badge.className = `diag-badge ${primary.kind === "ok" ? "is-ok" : "is-err"}`;
  $("#diag-title").textContent = primary.title;
  $("#diag-why").textContent = primary.why;
  $("#diag-action").textContent = primary.action;

  $("#m-ws").textContent = `${whitespacePct}%`;
  $("#m-ov").textContent = `${overlapPct}%`;
  $("#m-occ").textContent = `${focalOcclusionPct}%`;
  $("#m-imb").textContent = `${imbalancePct}%`;

  // 四枚关键词实况胶囊
  for (const key of ["layer", "texture", "combine", "depth"]) {
    const p = pillars[key];
    const el = $(`#pill-${key}`);
    el.textContent = p.badge;
    el.className = `kw-pill ${p.ok ? "is-ok" : "is-err"}`;
  }

  // 选中纸片工具条
  const sel = getSelectedScrap();
  const activeOrdered = state.scraps.filter((s) => s.active).sort((a, b) => a.z - b.z);
  const rank = sel && sel.active ? activeOrdered.findIndex((s) => s.id === sel.id) : -1;

  $("#sel-name").textContent = sel ? `${sel.label}${sel.active ? "" : "（在纸篓）"}` : "未选中";
  $("#btn-top").disabled = !sel || !sel.active || rank === activeOrdered.length - 1;
  $("#btn-up").disabled = !sel || !sel.active || rank === activeOrdered.length - 1;
  $("#btn-down").disabled = !sel || !sel.active || rank <= 0;
  $("#btn-rot-l").disabled = !sel || !sel.active || sel.shape === "circle";
  $("#btn-rot-r").disabled = !sel || !sel.active || sel.shape === "circle";

  const peelBtn = $("#btn-peel");
  if (!sel) {
    peelBtn.disabled = true;
    peelBtn.textContent = "撕回纸篓";
  } else if (sel.active) {
    peelBtn.disabled = false;
    peelBtn.textContent = "撕回纸篓";
  } else {
    peelBtn.disabled = false;
    peelBtn.textContent = "夹回台面";
  }

  // 材质纸样按钮（主角相片固定银盐材质，其余纸片自由切换）
  const canSwapMat = !!sel && sel.role !== "focal";
  for (const btn of $$("#swatch-list .sw-btn")) {
    const mat = btn.dataset.mat;
    btn.disabled = !canSwapMat;
    const isOn = canSwapMat && sel.material === mat;
    btn.classList.toggle("is-on", isOn);
    btn.setAttribute("aria-pressed", String(isOn));
  }

  // 纸篓与台面快切条
  const tray = $("#tray-list");
  tray.innerHTML = "";
  for (const s of state.scraps) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `tray-chip ${s.active ? "is-in" : "is-out"} ${s.id === state.selectedId ? "is-sel" : ""}`;
    b.dataset.scrapId = s.id;
    b.textContent = s.active ? `✓ ${s.label}` : `+ ${s.label}`;
    b.title = s.active ? "点击选中；再次点击撕回纸篓" : "点击夹回拼贴台";
    tray.appendChild(b);
  }

  dirty = true;
}

const stageLoop = loop(canvas, (_t, dt, { still }) => {
  const { w, h, dpr } = syncCanvasSize();
  let anim = false;

  if (still) {
    if (introProgress < 1) {
      introProgress = 1;
      dirty = true;
    }
  } else if (introProgress < 1) {
    introProgress = Math.min(1, introProgress + dt * 1.45);
    anim = true;
    dirty = true;
  }

  // 平滑抬升/落下动效
  for (const s of state.scraps) {
    const target = s.id === draggingId ? 1 : 0;
    const cur = liftMap.get(s.id) || 0;
    if (still) {
      if (cur !== target) {
        liftMap.set(s.id, target);
        dirty = true;
      }
    } else if (Math.abs(target - cur) > 0.01) {
      liftMap.set(s.id, cur + (target - cur) * Math.min(1, dt * 16));
      anim = true;
      dirty = true;
    } else if (cur !== target) {
      liftMap.set(s.id, target);
      dirty = true;
    }
  }

  if (!dirty && !anim) return;
  dirty = false;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  renderBoard(ctx, w, h, state, evalRes, { draggingId, liftMap, introT: introProgress });
});

function clientToNorm(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return {
    nx: Math.max(0, Math.min(1, (clientX - r.left) / Math.max(1, r.width))),
    ny: Math.max(0, Math.min(1, (clientY - r.top) / Math.max(1, r.height))),
  };
}

function beginGrab(clientX, clientY) {
  const { nx, ny } = clientToNorm(clientX, clientY);
  const hit = pickTopScrap(state.scraps, nx, ny);
  if (!hit) return false;
  state.selectedId = hit.id;
  draggingId = hit.id;
  dragOffset.x = nx - hit.x;
  dragOffset.y = ny - hit.y;
  canvas.classList.add("is-dragging");
  updateUI();
  stageLoop.draw();
  return true;
}

function moveGrab(clientX, clientY) {
  if (!draggingId) return;
  const scrap = state.scraps.find((s) => s.id === draggingId);
  if (!scrap) return;
  const { nx, ny } = clientToNorm(clientX, clientY);
  scrap.x = nx - dragOffset.x;
  scrap.y = ny - dragOffset.y;
  clampScrapPos(scrap);
  updateUI();
  stageLoop.draw();
}

function endGrab() {
  if (!draggingId) return;
  draggingId = null;
  pointerMode = null;
  activeTouchId = null;
  canvas.classList.remove("is-dragging");
  dirty = true;
  stageLoop.draw();
}

// 鼠标直接 2D 拖拽
canvas.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  if (beginGrab(e.clientX, e.clientY)) {
    pointerMode = "dragging";
    e.preventDefault();
  }
});
window.addEventListener("mousemove", (e) => {
  if (pointerMode === "dragging" && activeTouchId === null) moveGrab(e.clientX, e.clientY);
});
window.addEventListener("mouseup", () => {
  if (activeTouchId === null) endGrab();
});

// 触摸事件：横拖立刻抓纸片、竖滑不拦页面滚动（兼顾触屏流畅与 perf.mjs 横向触摸测试）
canvas.addEventListener(
  "touchstart",
  (e) => {
    if (!e.changedTouches.length) return;
    const t = e.changedTouches[0];
    activeTouchId = t.identifier;
    startPt = { x: t.clientX, y: t.clientY };
    const { nx, ny } = clientToNorm(t.clientX, t.clientY);
    const hit = pickTopScrap(state.scraps, nx, ny, 0.14);
    if (hit) {
      state.selectedId = hit.id;
      dragOffset.x = nx - hit.x;
      dragOffset.y = ny - hit.y;
      pointerMode = "pending";
      updateUI();
      stageLoop.draw();
    } else {
      pointerMode = "scroll";
    }
  },
  { passive: true }
);

canvas.addEventListener(
  "touchmove",
  (e) => {
    if (activeTouchId === null) return;
    const t = [...e.changedTouches].find((c) => c.identifier === activeTouchId);
    if (!t) return;
    if (pointerMode === "pending") {
      const dx = Math.abs(t.clientX - startPt.x);
      const dy = Math.abs(t.clientY - startPt.y);
      if (dx + dy < 4) return;
      if (dx >= dy * 0.75) {
        pointerMode = "dragging";
        draggingId = state.selectedId;
        canvas.classList.add("is-dragging");
      } else {
        pointerMode = "scroll";
        return;
      }
    }
    if (pointerMode === "dragging") {
      e.preventDefault();
      moveGrab(t.clientX, t.clientY);
    }
  },
  { passive: false }
);

canvas.addEventListener("touchend", endGrab);
canvas.addEventListener("touchcancel", endGrab);

// 键盘操控选中纸片
canvas.addEventListener("keydown", (e) => {
  const sel = getSelectedScrap();
  if (!sel || !sel.active) return;
  const step = e.shiftKey ? 0.05 : 0.025;
  if (e.key === "ArrowLeft") { sel.x -= step; clampScrapPos(sel); e.preventDefault(); }
  else if (e.key === "ArrowRight") { sel.x += step; clampScrapPos(sel); e.preventDefault(); }
  else if (e.key === "ArrowUp") { sel.y -= step; clampScrapPos(sel); e.preventDefault(); }
  else if (e.key === "ArrowDown") { sel.y += step; clampScrapPos(sel); e.preventDefault(); }
  else if (e.key === "]") { shiftZ(sel, 1); e.preventDefault(); }
  else if (e.key === "[") { shiftZ(sel, -1); e.preventDefault(); }
  else if (e.key === "Delete" || e.key === "Backspace") { sel.active = false; e.preventDefault(); }
  else return;
  updateUI();
  stageLoop.draw();
});

function shiftZ(scrap, dir) {
  const active = state.scraps.filter((s) => s.active).sort((a, b) => a.z - b.z);
  const idx = active.findIndex((s) => s.id === scrap.id);
  const next = idx + dir;
  if (idx < 0 || next < 0 || next >= active.length) return;
  const tmp = active[idx].z;
  active[idx].z = active[next].z;
  active[next].z = tmp;
  normalizeZ(state.scraps);
}

// 按钮绑定：题材、标尺、参考解、复原、Z 序、旋角、材质、纸篓
$$(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.theme = btn.dataset.theme;
    $$(".tab-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    updateUI();
    stageLoop.draw();
  });
});

$("#btn-guides").addEventListener("click", (e) => {
  state.showGuides = !state.showGuides;
  e.currentTarget.setAttribute("aria-pressed", String(state.showGuides));
  dirty = true;
  stageLoop.draw();
});

$("#btn-solve").addEventListener("click", () => {
  state.scraps = createBalancedScraps();
  state.selectedId = "focal";
  updateUI();
  stageLoop.draw();
});

$("#btn-reset").addEventListener("click", () => {
  state.scraps = createBrokenScraps();
  state.selectedId = "focal";
  updateUI();
  stageLoop.draw();
});

$("#btn-top").addEventListener("click", () => {
  const sel = getSelectedScrap();
  if (!sel || !sel.active) return;
  sel.z = Math.max(...state.scraps.map((s) => s.z)) + 1;
  normalizeZ(state.scraps);
  updateUI();
  stageLoop.draw();
});

$("#btn-up").addEventListener("click", () => {
  const sel = getSelectedScrap();
  if (!sel || !sel.active) return;
  shiftZ(sel, 1);
  updateUI();
  stageLoop.draw();
});

$("#btn-down").addEventListener("click", () => {
  const sel = getSelectedScrap();
  if (!sel || !sel.active) return;
  shiftZ(sel, -1);
  updateUI();
  stageLoop.draw();
});

$("#btn-rot-l").addEventListener("click", () => {
  const sel = getSelectedScrap();
  if (!sel || !sel.active || sel.shape === "circle") return;
  sel.rot = Math.max(-22, sel.rot - 5);
  updateUI();
  stageLoop.draw();
});

$("#btn-rot-r").addEventListener("click", () => {
  const sel = getSelectedScrap();
  if (!sel || !sel.active || sel.shape === "circle") return;
  sel.rot = Math.min(22, sel.rot + 5);
  updateUI();
  stageLoop.draw();
});

$("#btn-peel").addEventListener("click", () => {
  const sel = getSelectedScrap();
  if (!sel) return;
  sel.active = !sel.active;
  if (sel.active) {
    sel.z = Math.max(...state.scraps.map((s) => s.z)) + 1;
    normalizeZ(state.scraps);
  }
  updateUI();
  stageLoop.draw();
});

$$("#swatch-list .sw-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const sel = getSelectedScrap();
    if (!sel || sel.role === "focal") return;
    sel.material = btn.dataset.mat;
    if (btn.dataset.mat === "accent-disc") sel.shape = "circle";
    else if (sel.id !== "mustard") delete sel.shape;
    updateUI();
    stageLoop.draw();
  });
});

// 一键换回原海报冷暖纸材配方（不改位置与数量，专供材质对比实测）
$("#btn-palette").addEventListener("click", () => {
  const recipe = {
    blue: "matte-color",
    grid: "print-grid",
    mustard: "accent-disc",
    black: "charcoal-chalk",
    dots: "dot-card",
    book: "book-type",
    clutter1: "rose-torn",
    clutter2: "book-type",
    clutter3: "dot-card",
  };
  for (const s of state.scraps) {
    if (recipe[s.id]) s.material = recipe[s.id];
  }
  updateUI();
  stageLoop.draw();
});

$("#tray-list").addEventListener("click", (e) => {
  const btn = e.target.closest(".tray-chip");
  if (!btn) return;
  const s = state.scraps.find((x) => x.id === btn.dataset.scrapId);
  if (!s) return;
  if (!s.active) {
    s.active = true;
    state.selectedId = s.id;
    s.z = Math.max(...state.scraps.map((x) => x.z)) + 1;
    normalizeZ(state.scraps);
  } else if (state.selectedId === s.id) {
    s.active = false;
  } else {
    state.selectedId = s.id;
  }
  updateUI();
  stageLoop.draw();
});

window.addEventListener("resize", () => {
  dirty = true;
  stageLoop.draw();
});

updateUI();
stageLoop.draw();

// ==================== 01 剥层透视滑轨（SVG 轴测 5 层） ====================
const LAYER_INFO = [
  {
    name: "L1 暖棉底纸（呼吸留白层）",
    desc: "整幅画面的空气与基准面。留白越多，上层手撕边和投影就越清晰，避免画面发闷。",
  },
  {
    name: "L2 格纸与铅字（细密纹理背景）",
    desc: "退居最底层露出边角，提供书页与手账的文化气质，但绝不直接和主图正面打架。",
  },
  {
    name: "L3 手撕主色衬纸（色块缓冲垫）",
    desc: "大块哑光牛仔蓝撕纸压住底层噪点，把视觉重心稳稳托举给前排的黑白照片。",
  },
  {
    name: "L4 银盐静物主图（视觉主角）",
    desc: "稳居前层，白边框与黑白明暗把四周彩色碎纸瞬间压成配角，观众视线第一秒落在这里。",
  },
  {
    name: "L5 胶带与笔触（情绪收口层）",
    desc: "一段半透明美纹胶带、一枚芥黄圆片与一笔涂鸦，把原本零散的平面材料锁成手工整体。",
  },
];

let activeExplodeLayer = 3;
const explodeRange = $("#explode-range");
const explodeSvg = $("#explode-svg");

function drawExplode() {
  const sep = Number(explodeRange.value) / 100;
  $("#explode-val").textContent = `层距 ${explodeRange.value}%`;
  const gap = 10 + sep * 34;
  const baseY = 142 + gap * 2;

  // 绘制五张等轴测斜切纸面
  const planes = [
    {
      y: baseY,
      fill: "#EAE1D1",
      stroke: "#9E927E",
      tag: "L1 底纸",
      inner: `<line x1="-88" y1="-26" x2="88" y2="-26" stroke="#C8BCA8" stroke-dasharray="4 4"/>`,
    },
    {
      y: baseY - gap,
      fill: "#EFE8DA",
      stroke: "#8C816E",
      tag: "L2 格纸",
      inner: `<path d="M-70 -20H70M-70 -6H70M-70 8H70M-40 -32V24M0 -32V24M40 -32V24" stroke="#B7AA94" stroke-width="0.9"/>`,
    },
    {
      y: baseY - gap * 2,
      fill: "#406A93",
      stroke: "#EFE9DD",
      tag: "L3 蓝纸",
      inner: `<path d="M-68 -24L-54 -28L-30 -22L10 -27L62 -22L66 20L12 24L-38 20L-66 23Z" fill="#406A93" stroke="#EFE9DD" stroke-width="2"/>`,
    },
    {
      y: baseY - gap * 3,
      fill: "#F5F2EC",
      stroke: "#242321",
      tag: "L4 主图",
      inner: `<rect x="-46" y="-26" width="92" height="44" fill="#9E9A92"/><ellipse cx="-12" cy="4" rx="14" ry="11" fill="#3B3935"/><ellipse cx="18" cy="8" rx="11" ry="8" fill="#2A2825"/>`,
    },
    {
      y: baseY - gap * 4,
      fill: "rgba(227,212,184,0.88)",
      stroke: "#9A8766",
      tag: "L5 胶带",
      inner: `<rect x="-32" y="-12" width="64" height="16" fill="#E3D4B8" stroke="#9A8766"/><circle cx="52" cy="-2" r="15" fill="#DCB151"/><path d="M36 4Q52 -10 68 2" fill="none" stroke="#181817" stroke-width="1.6"/>`,
    },
  ];

  const out = [];
  // 垂直层序虚线
  out.push(`<line x1="215" y1="${baseY + 12}" x2="215" y2="${baseY - gap * 4 - 24}" stroke="rgba(47,58,120,0.3)" stroke-dasharray="4 4"/>`);

  planes.forEach((p, idx) => {
    const hi = idx === activeExplodeLayer;
    const opacity = hi ? 1 : 0.86;
    const strokeW = hi ? 2.4 : 1.1;
    const strokeCol = hi ? "#2F3A78" : p.stroke;
    out.push(`
      <g transform="translate(215 ${p.y.toFixed(1)})" opacity="${opacity}">
        <polygon points="0,-38 124,0 0,38 -124,0" fill="rgba(24,20,14,0.12)" transform="translate(0 7)"/>
        <polygon points="0,-38 124,0 0,38 -124,0" fill="${p.fill}" stroke="${strokeCol}" stroke-width="${strokeW}"/>
        <g transform="scale(0.86 0.44)">${p.inner}</g>
        <line x1="128" y1="0" x2="152" y2="0" stroke="${hi ? "#2F3A78" : "rgba(24,24,23,0.35)"}" stroke-width="${hi ? 1.8 : 1}"/>
        <text x="158" y="4" font-size="12" font-weight="${hi ? 700 : 600}" fill="${hi ? "#2F3A78" : "#4A453D"}">${p.tag}</text>
      </g>
    `);
  });

  explodeSvg.innerHTML = out.join("");
  const info = LAYER_INFO[activeExplodeLayer];
  $("#layer-note").innerHTML = `<strong>${info.name}</strong>：${info.desc}`;
}

explodeRange.addEventListener("input", drawExplode);
$$("#layer-chips .chip-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeExplodeLayer = Number(btn.dataset.layer);
    $$("#layer-chips .chip-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    drawExplode();
  });
});
drawExplode();

// ==================== 02 材质反差对撞板 ====================
const PAIR_RULES = {
  "cobalt:photo": {
    grade: "高反差 · 焦点立住",
    cls: "is-ok",
    mood: "情绪：沉静手工感",
    text: "哑光牛仔蓝大色块吸收背景杂音，把黑白银盐照片的光滑细腻直接托了出来——这正是 151 原海报把陶瓶照片压在蓝色撕纸上的原因。",
  },
  "cobalt:stamp": {
    grade: "高反差 · 冲击强烈",
    cls: "is-ok",
    mood: "情绪：复古招贴感",
    text: "深蓝冷纸承托米白或粗黑印章大字，明度与色温同时拉开，适合杂志标题页与展览主视觉。",
  },
  "cobalt:line": {
    grade: "高反差 · 线条清楚",
    cls: "is-ok",
    mood: "情绪：克制图鉴感",
    text: "纯色哑光纸底没有细碎噪点，哪怕极细的插画线条也能在纸面清晰呼吸，不会断线发糊。",
  },
  "grid:photo": {
    grade: "中反差 · 轻盈有序",
    cls: "is-ok",
    mood: "情绪：建筑手账感",
    text: "细格线退在相片白边之外，既补充手工秩序感，又不会侵占黑白照片内部影调。",
  },
  "grid:stamp": {
    grade: "高反差 · 粗细互补",
    cls: "is-ok",
    mood: "情绪：实验编辑感",
    text: "极细的米色方格与极粗的黑墨印章形成强烈笔画粗细差，是独立杂志目录页的经典搭法。",
  },
  "grid:line": {
    grade: "低反差 · 线条打架",
    cls: "is-warn",
    mood: "风险：笔触混入网格",
    text: "细线插画与背景格线粗细相近，眼睛很难立刻分清哪根线属于图案、哪根线属于纸格；需要加一块纯色衬纸隔开。",
  },
  "news:photo": {
    grade: "中反差 · 需白边隔离",
    cls: "is-ok",
    mood: "情绪：怀旧剪报感",
    text: "拍立得白框像一道护城河，把密排铅字挡在照片外面；如果裁掉白边，铅字噪点就会啃咬照片边缘。",
  },
  "news:stamp": {
    grade: "中反差 · 靠字号分级",
    cls: "is-warn",
    mood: "风险：正文干扰标题",
    text: "大号粗黑字勉强压得住小号铅字，但若标题再小两号或底色不够浅，两组文字就会互相抢读。",
  },
  "news:line": {
    grade: "高干扰 · 纹样抢戏",
    cls: "is-err",
    mood: "翻车：视觉噪点爆棚",
    text: "细密铅字与细线插画同属高频纹理，直接叠在一起会让画面发花，读者根本看不清画了什么。",
  },
  "flat:photo": {
    grade: "低反差 · 层次偏弱",
    cls: "is-warn",
    mood: "提示：缺少材质冷暖",
    text: "平淡米纸和暖棉底纸色温、明度太接近，衬纸几乎隐身，照片少了色彩托底，拼贴味大打折扣。",
  },
  "flat:stamp": {
    grade: "低反差 · 像普通排版",
    cls: "is-warn",
    mood: "提示：像平铺黑字",
    text: "黑字虽看得清，但底部同色平纸没有触觉反差，远看就像直接印在白纸上，丢掉了拼贴的材质张力。",
  },
  "flat:line": {
    grade: "低反差 · 发飘无层次",
    cls: "is-err",
    mood: "翻车：平淡乏味",
    text: "底纸和衬纸融成一片，细线又轻，整块区域缺少重量、质感与冷暖对比，沦为草稿纸。",
  },
};

let pairBg = "cobalt";
let pairFg = "photo";

function drawPairer() {
  const svg = $("#pair-svg");
  let bgMarkup = "";
  if (pairBg === "cobalt") {
    bgMarkup = `
      <polygon points="44,32 316,24 322,238 38,244" fill="#EFE9DD"/>
      <polygon points="48,36 312,28 318,234 42,240" fill="#406A93"/>
    `;
  } else if (pairBg === "grid") {
    const lines = [];
    for (let x = 56; x <= 312; x += 18) lines.push(`<line x1="${x}" y1="30" x2="${x}" y2="240" stroke="#B6A993" stroke-width="0.9"/>`);
    for (let y = 42; y <= 236; y += 18) lines.push(`<line x1="44" y1="${y}" x2="316" y2="${y}" stroke="#B6A993" stroke-width="0.9"/>`);
    bgMarkup = `<rect x="44" y="30" width="272" height="210" fill="#EFE8DA" stroke="#B6A993"/>${lines.join("")}`;
  } else if (pairBg === "news") {
    const txts = [
      "The Great Blasket autumn press archive 1912",
      "material contrast & cut-paper editorial room",
      "printed letterpress fragments layered on cotton",
      "observing grain, rhythm, whitespace & tone",
      "collage journal notes · tactile studio study",
      "overlapping surfaces create immediate depth",
      "cut, paste, balance & leave room to breathe",
      "archive clipping no. 151 · typography sample",
    ];
    bgMarkup = `
      <rect x="44" y="30" width="272" height="210" fill="#EAE0CA" stroke="#B7AA92"/>
      ${txts.map((t, i) => `<text x="58" y="${54 + i * 24}" font-family="Libre Baskerville, serif" font-style="italic" font-size="11.5" fill="#3B352D">${t}</text>`).join("")}
    `;
  } else {
    bgMarkup = `<rect x="44" y="30" width="272" height="210" fill="#E6DCCB" stroke="#CFC3AE"/>`;
  }

  let fgMarkup = "";
  if (pairFg === "photo") {
    fgMarkup = `
      <g transform="translate(180 138) rotate(3)">
        <rect x="-66" y="-80" width="132" height="162" fill="#F5F2EC" stroke="rgba(24,24,23,0.18)"/>
        <rect x="-56" y="-70" width="112" height="122" fill="#A9A59D"/>
        <rect x="-56" y="24" width="112" height="28" fill="#6A6760"/>
        <path d="M-24 28L-20 -10H-6L-2 28Z" fill="#373531"/>
        <path d="M-12 -10Q6 -32 34 -46" fill="none" stroke="#181817" stroke-width="2.5" stroke-linecap="round"/>
        <ellipse cx="14" cy="-32" rx="9" ry="3.5" transform="rotate(-35 14 -32)" fill="#181817"/>
        <ellipse cx="26" cy="-41" rx="9" ry="3.5" transform="rotate(-22 26 -41)" fill="#181817"/>
        <ellipse cx="24" cy="24" rx="22" ry="15" fill="#2A2825"/>
        <rect x="-24" y="-88" width="48" height="14" fill="rgba(227,212,184,0.86)" stroke="rgba(155,137,104,0.5)"/>
      </g>
    `;
  } else if (pairFg === "stamp") {
    const col = pairBg === "cobalt" ? "#F7F3EA" : "#181817";
    fgMarkup = `
      <g transform="translate(180 142) rotate(-2)">
        <text x="0" y="-6" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="48" fill="${col}">拼贴</text>
        <rect x="-78" y="14" width="156" height="28" fill="#DAA4A3"/>
        <text x="0" y="34" text-anchor="middle" font-family="Bebas Neue, sans-serif" font-size="22" letter-spacing="2" fill="#181817">COLLAGE</text>
      </g>
    `;
  } else {
    const stroke = pairBg === "cobalt" ? "#F7F3EA" : "#1C1B1A";
    fgMarkup = `
      <g transform="translate(180 138)" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round">
        <path d="M-26 48C-34 20 -26 -8 -12 -16V-34H12V-16C26 -8 34 20 26 48Z"/>
        <path d="M0 -34C6 -52 24 -64 46 -68"/>
        <path d="M18 -54C26 -62 34 -62 38 -56C30 -50 22 -50 18 -54Z"/>
        <path d="M-46 52H56"/>
        <circle cx="38" cy="36" r="14"/>
      </g>
    `;
  }

  svg.innerHTML = bgMarkup + fgMarkup;
  const r = PAIR_RULES[`${pairBg}:${pairFg}`];
  const gEl = $("#pv-grade");
  gEl.textContent = r.grade;
  gEl.className = `pv-grade ${r.cls}`;
  $("#pv-mood").textContent = r.mood;
  $("#pv-text").textContent = r.text;
}

$$("#bg-pickers .paper-pick").forEach((btn) => {
  btn.addEventListener("click", () => {
    pairBg = btn.dataset.bg;
    $$("#bg-pickers .paper-pick").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    drawPairer();
  });
});
$$("#fg-pickers .paper-pick").forEach((btn) => {
  btn.addEventListener("click", () => {
    pairFg = btn.dataset.fg;
    $$("#fg-pickers .paper-pick").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    drawPairer();
  });
});
drawPairer();

// ==================== 03 炭黑纸暗房：逐片加贴压力测试 ====================
const STRESS_PIECES = [
  { id: "p1", area: 14, draw: () => `<g transform="translate(222 168) rotate(2)"><rect x="-54" y="-72" width="108" height="144" fill="#F5F2EC" stroke="#242321" stroke-width="1.2"/><rect x="-44" y="-62" width="88" height="106" fill="#9E9A92"/><ellipse cx="-10" cy="24" rx="18" ry="14" fill="#363430"/><ellipse cx="18" cy="28" rx="14" ry="11" fill="#1F1E1C"/></g>` },
  { id: "p2", area: 18, draw: () => `<polygon points="104,54 256,44 264,238 96,246" fill="#406A93" stroke="#EFE9DD" stroke-width="2"/>` },
  { id: "p3", area: 10, draw: () => `<rect x="242" y="42" width="118" height="128" fill="#EFE8DA" stroke="#B6A993" transform="rotate(4 300 106)"/>` },
  { id: "p4", area: 8, draw: () => `<circle cx="328" cy="84" r="34" fill="#DCB151"/>` },
  { id: "p5", area: 9, draw: () => `<polygon points="244,210 388,204 394,288 238,294" fill="#191918" stroke="#EFE9DD" stroke-width="2"/><path d="M262 246Q288 224 312 256T368 244" fill="none" stroke="#F1EADF" stroke-width="2"/>` },
  { id: "p6", area: 6, draw: () => `<rect x="116" y="218" width="86" height="82" fill="#EAE6DD" stroke="#AAA08E" transform="rotate(-3 158 258)"/>` },
  { id: "p7", area: 5, draw: () => `<polygon points="342,126 418,120 422,208 338,214" fill="#E2979D" stroke="#EFE9DD" stroke-width="1.5"/>` },
  { id: "p8", area: 6, draw: () => `<rect x="24" y="46" width="96" height="106" fill="#BD9B73" transform="rotate(-7 72 98)"/>` },
  { id: "p9", area: 6, draw: () => `<rect x="22" y="198" width="106" height="96" fill="#517A67" transform="rotate(6 74 246)"/>` },
  { id: "p10", area: 5, draw: () => `<rect x="364" y="24" width="82" height="94" fill="#E7DBC4" stroke="#9C8E78" transform="rotate(8 404 70)"/>` },
  { id: "p11", area: 5, draw: () => `<rect x="152" y="14" width="114" height="58" fill="#DAA4A3" transform="rotate(-4 208 42)"/>` },
  { id: "p12", area: 5, draw: () => `<rect x="148" y="276" width="132" height="52" fill="#D5C8B2" stroke="#8C7F6B" transform="rotate(3 214 302)"/>` },
];
// 显示顺序：底纸衬底先绘，主角照片 p1 永远在中间/前景之上
const STRESS_Z = ["p8", "p9", "p10", "p11", "p12", "p3", "p7", "p2", "p6", "p5", "p4", "p1"];

let stressCount = 9;
let fastenerOn = true;

function drawStress() {
  const activeSet = new Set(STRESS_PIECES.slice(0, stressCount).map((p) => p.id));
  const usedArea = STRESS_PIECES.slice(0, stressCount).reduce((sum, p) => sum + p.area, 0);
  // 叠压折减系数（部分重叠，单调递减留白）
  const ws = Math.max(8, Math.min(86, Math.round(100 - usedArea * 0.88)));

  const svgParts = [];
  for (const id of STRESS_Z) {
    if (!activeSet.has(id)) continue;
    const item = STRESS_PIECES.find((p) => p.id === id);
    svgParts.push(item.draw());
  }
  if (fastenerOn) {
    svgParts.push(`<rect x="196" y="88" width="54" height="15" fill="rgba(227,212,184,0.88)" stroke="#9A8869" transform="rotate(-3 223 95)"/>`);
    svgParts.push(`<path d="M352 200V226a5 5 0 0 0 10 0V198a7 7 0 0 0-14 0V224" fill="none" stroke="#7A756C" stroke-width="2.2" stroke-linecap="round"/>`);
  }

  $("#stress-svg").innerHTML = svgParts.join("");
  $("#count-display").textContent = `${stressCount} 片`;
  $("#count-minus").disabled = stressCount <= 1;
  $("#count-plus").disabled = stressCount >= 12;
  $("#stress-ws").textContent = `${ws}%`;
  $("#stress-bar").style.width = `${ws}%`;

  const badge = $("#dv-badge");
  const title = $("#dv-title");
  const text = $("#dv-text");

  if (stressCount <= 3) {
    badge.className = "dv-badge is-warn";
    badge.textContent = `素材偏少 · 留白 ${ws}%`;
    title.textContent = "画面很干净，但还没形成拼贴的层叠张力";
    text.textContent = "1–3 片时更接近「带衬底的单图排版」，缺少底、中、前与点缀的节奏呼应。点「+ 加贴一片」加到 5–6 片看看层次如何长出来。";
  } else if (stressCount <= 7) {
    badge.className = "dv-badge is-ok";
    badge.textContent = `经验舒适带 · 留白 ${ws}%`;
    title.textContent = fastenerOn
      ? "留白与层次刚好咬合，胶带把碎片收成一个群组"
      : "片数和留白已站稳；打开收口配件能让衔接更像手作";
    text.textContent = "4–7 片既能容纳银盐照片、主色衬纸、纹理辅纸与一处点缀，又能把约 30%–55% 的棉纸呼吸留给边缘，视线毫不费力。";
  } else if (stressCount <= 9) {
    badge.className = "dv-badge is-warn";
    badge.textContent = `临界拥挤 · 留白 ${ws}%`;
    title.textContent = "边缘开始互相打架，视线慢了下来";
    text.textContent = "8–9 片已经逼近舒适上限。多加的每一片都在吃掉原本衬托主图的留白，试着点「− 撤下一片」退回 5–6 片对比呼吸感。";
  } else {
    badge.className = "dv-badge is-err";
    badge.textContent = `满版失控 · 留白仅 ${ws}%`;
    title.textContent = "彻底沦为贴满小广告的杂乱公告栏";
    text.textContent = "超过 10 片且留白被压扁，所有纸片都在大喊大叫，主角照片的优势消失殆尽——这就是「越贴越满、越贴越乱」的真实临界点。";
  }
}

$("#count-minus").addEventListener("click", () => {
  if (stressCount > 1) { stressCount--; drawStress(); }
});
$("#count-plus").addEventListener("click", () => {
  if (stressCount < 12) { stressCount++; drawStress(); }
});
$("#fastener-toggle").addEventListener("click", (e) => {
  fastenerOn = !fastenerOn;
  e.currentTarget.classList.toggle("is-on", fastenerOn);
  e.currentTarget.setAttribute("aria-pressed", String(fastenerOn));
  e.currentTarget.textContent = fastenerOn ? "胶带 + 回形针：开" : "胶带 + 回形针：关";
  drawStress();
});
drawStress();

// ==================== 04 从哪来：百年拼贴档案 ====================
const ERAS = {
  "1912": {
    eyebrow: "PARIS & SORGUES · 1912",
    title: "不再「画假质感」，直接把真材质粘上画面",
    body: "「Collage」源自法语动词 coller（粘贴）。1912 年春，毕加索在《有藤椅的静物》里把市售藤编油布粘上椭圆画布并以真麻绳围边；同年秋，乔治·布拉克在法国索尔格创作《果盘与玻璃杯》（现藏纽约大都会艺术博物馆，藏品号 2016.237.33），将市售仿木纹壁纸裁条贴入炭笔画，开启 papier collé（贴纸画）先河。实物材质从此可以直接替平面发声。",
    takeaway: "<strong>给今天排版的启示</strong>：拼贴之所以动人，不在炫技，而在让「真实纸面、印刷墨迹与摄影灰阶」在同一平面产生诚实的触觉对话。",
    svg: `
      <ellipse cx="190" cy="140" rx="142" ry="104" fill="#EAE1CE" stroke="#8C6D46" stroke-width="7" stroke-dasharray="9 4"/>
      <rect x="108" y="72" width="44" height="126" fill="#B88E5A" transform="rotate(-6 130 135)"/>
      <rect x="218" y="68" width="42" height="120" fill="#B88E5A" transform="rotate(5 239 128)"/>
      <path d="M108 164L250 164L232 212L126 212Z" fill="#D4C7AD" stroke="#4D4539" stroke-width="1.5"/>
      <path d="M118 168L240 206M126 206L238 168" stroke="#6E6250" stroke-width="1"/>
      <path d="M144 96H226L212 152H158Z" fill="none" stroke="#1E1D1B" stroke-width="2.2"/>
      <text x="190" y="130" text-anchor="middle" font-family="Libre Baskerville, serif" font-weight="700" font-size="22" fill="#181817">JOU</text>
    `,
  },
  "1919": {
    eyebrow: "BERLIN & HANNOVER · 1919–1921",
    title: "达达剪刀与 Merz：城市废纸也能排成几何诗",
    body: "一战后，柏林达达艺术家汉娜·赫希在 1919–1920 年用报刊照片拼出《用菜刀切开德国最后的魏玛啤酒肚文化时代》（藏柏林国家博物馆），证明剪贴能承载锋利的社会叙事；同期库尔特·施维特斯以银行广告残字 Kommerz 命名「Merz」，于 1921 年创作《梅尔茨画 32 A：樱桃图》（藏纽约现代艺术博物馆 MoMA），把车票、包装纸与木片按严谨的横竖秩序稳稳编排。",
    takeaway: "<strong>给今天排版的启示</strong>：施维特斯证明了「碎片越杂，底层的隐形横竖秩序就越重要」——自由的边缘底下，始终藏着克制的骨架。",
    svg: `
      <rect x="34" y="24" width="312" height="232" fill="#E3DAC8" stroke="#4F493F"/>
      <rect x="52" y="42" width="126" height="84" fill="#406A93" transform="rotate(-2 115 84)"/>
      <rect x="164" y="38" width="154" height="62" fill="#181817" transform="rotate(2 241 69)"/>
      <rect x="66" y="138" width="96" height="94" fill="#BD9B73" transform="rotate(3 114 185)"/>
      <rect x="148" y="110" width="98" height="92" fill="#F5F0E4" stroke="#242321" stroke-width="1.5"/>
      <circle cx="186" cy="156" r="14" fill="#A63641"/><circle cx="212" cy="162" r="14" fill="#A63641"/>
      <path d="M186 142Q198 122 212 148" fill="none" stroke="#2E5745" stroke-width="2.4"/>
      <text x="242" y="76" text-anchor="middle" font-family="Bebas Neue, sans-serif" font-size="28" letter-spacing="3" fill="#F2ECE0">MERZ</text>
      <rect x="258" y="142" width="72" height="86" fill="#DCB151" transform="rotate(-4 294 185)"/>
    `,
  },
  "1977": {
    eyebrow: "DIY PRINT & ZINES · 1970s",
    title: "影印机、剪刀与胶带：把「手工痕迹」变成态度",
    body: "1970 年代后期，随着便宜的静电复印机进入街角文印店，朋克唱片封套与独立出版物（Zine）直接用剪刀裁开报纸字母、手写涂鸦、斜贴胶带，再整页翻印成高反差黑白网点。这种绕过昂贵照排机的做法，把原本属于「没修干净的糙边」转译成了直白、诚实的反工业宣言。",
    takeaway: "<strong>给今天排版的启示</strong>：胶带、错位和手撕边缘本身就携带性格信号——只在不怕「显粗糙」的独立与青年气质主题里用才对味。",
    svg: `
      <rect x="36" y="26" width="308" height="228" fill="#EFEAE0" stroke="#181817" stroke-width="2"/>
      <rect x="54" y="48" width="268" height="44" fill="#181817" transform="rotate(-2 188 70)"/>
      <text x="90" y="79" font-family="Bebas Neue, sans-serif" font-size="30" fill="#F2ECE0">CUT</text>
      <rect x="148" y="44" width="66" height="44" fill="#DCB151" transform="rotate(4 181 66)"/>
      <text x="181" y="75" text-anchor="middle" font-family="Libre Baskerville, serif" font-weight="700" font-size="22" fill="#181817">&amp;</text>
      <text x="234" y="79" font-family="Bebas Neue, sans-serif" font-size="30" fill="#F2ECE0">ZINE</text>
      <rect x="64" y="114" width="128" height="112" fill="#D5D1C8" stroke="#181817" stroke-dasharray="5 3"/>
      <rect x="208" y="122" width="114" height="96" fill="#E2979D" transform="rotate(3 265 170)"/>
      <rect x="164" y="106" width="62" height="16" fill="rgba(227,212,184,0.9)" stroke="#8F7E62" transform="rotate(-14 195 114)"/>
    `,
  },
  "1992": {
    eyebrow: "RAY GUN & THE END OF PRINT · 1992–1995",
    title: "解构杂志跨页：情绪先于阅读，也暴露了效率边界",
    body: "1992 年另类音乐杂志 Ray Gun 创刊，艺术总监大卫·卡森（David Carson）把撕裂照片、层叠字块与打破网格的拼贴带入主流桌面出版，并于 1995 年与路易斯·布莱克威尔出版《印刷的终结》（The End of Print，Chronicle Books）。他提出不要把「易读性」混同于「沟通」，但后世实践也清楚标出了边界：情绪表达拉满的同时，快速扫读效率确实会下降。",
    takeaway: "<strong>给今天排版的启示</strong>：把拼贴用在「先让人记住气氛」的入口页与概念页，而把需要高效率扫读的正文与表单交回清晰网格。",
    svg: `
      <rect x="34" y="24" width="312" height="232" fill="#F7F3EA" stroke="#242321" stroke-width="1.5"/>
      <line x1="190" y1="24" x2="190" y2="256" stroke="rgba(24,24,23,0.22)"/>
      <rect x="48" y="42" width="128" height="184" fill="#2A2927"/>
      <rect x="148" y="68" width="118" height="136" fill="#406A93" opacity="0.88" transform="rotate(-4 207 136)"/>
      <text x="58" y="118" font-family="Bebas Neue, sans-serif" font-size="44" fill="#E8C163" letter-spacing="3">RAY</text>
      <text x="158" y="162" font-family="Bebas Neue, sans-serif" font-size="48" fill="#F7F3EA" letter-spacing="4">GUN</text>
      <rect x="268" y="54" width="60" height="162" fill="#EAE0CA"/>
      <path d="M276 74H320M276 88H316M276 102H320M276 116H310M276 130H320" stroke="#4A453D" stroke-width="2"/>
    `,
  },
};

function setEra(key) {
  const e = ERAS[key];
  $("#hist-eyebrow").textContent = e.eyebrow;
  $("#hist-title").textContent = e.title;
  $("#hist-body").textContent = e.body;
  $("#hist-takeaway").innerHTML = e.takeaway;
  $("#hist-svg").innerHTML = e.svg;
}

$$("#hist-tabs .hist-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    setEra(btn.dataset.era);
    $$("#hist-tabs .hist-tab").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", String(on));
    });
  });
});
setEra("1912");

// ==================== 05 场景翻转体检卡 ====================
$$("#scenario-grid .sc-card").forEach((card) => {
  card.addEventListener("click", () => {
    const open = card.classList.toggle("is-open");
    card.setAttribute("aria-expanded", String(open));
    card.querySelector(".sc-toggle").textContent = open ? "收起" : "看判断";
  });
});

// ==================== 06 单变量四选一练习 ====================
const QUIZ_SVG = {
  // A：仅破“叠压关联”——6片好材质但全部彼此分离，0%重叠
  A: `
    <rect x="14" y="14" width="68" height="72" fill="#406A93"/>
    <rect x="94" y="14" width="68" height="76" fill="#F5F2EC" stroke="#242321"/>
    <rect x="102" y="22" width="52" height="52" fill="#9E9A92"/><ellipse cx="128" cy="58" rx="14" ry="11" fill="#2A2825"/>
    <circle cx="212" cy="48" r="24" fill="#DCB151"/>
    <rect x="14" y="106" width="68" height="66" fill="#EFE8DA" stroke="#B6A993"/>
    <rect x="94" y="106" width="70" height="66" fill="#181817"/>
    <rect x="178" y="106" width="66" height="66" fill="#E2979D"/>
  `,
  // B：仅破“材质反差”——与 C 完全相同的 6 片位置与银盐陶瓶照片，但把 5 片衬底全换为高频密排格线与铅字且抽掉白框隔离
  B: `
    <defs>
      <pattern id="qgrid" width="7" height="7" patternUnits="userSpaceOnUse">
        <path d="M7 0H0V7" fill="none" stroke="#857863" stroke-width="0.9"/>
      </pattern>
    </defs>
    <rect x="132" y="24" width="76" height="86" fill="url(#qgrid)" stroke="#7A6E5B" transform="rotate(4 170 67)"/>
    <polygon points="48,30 152,24 156,148 44,152" fill="#EAE0CA" stroke="#7A6E5B" stroke-width="1.4"/>
    <path d="M54 44H146M54 56H142M54 68H146M54 80H140M54 92H146M54 104H138M54 116H146M54 128H142M54 140H146" stroke="#3F3931" stroke-width="2"/>
    <circle cx="196" cy="52" r="24" fill="url(#qgrid)" stroke="#7A6E5B"/>
    <rect x="128" y="122" width="88" height="46" fill="url(#qgrid)" stroke="#7A6E5B" transform="rotate(-3 172 145)"/>
    <rect x="44" y="118" width="56" height="48" fill="#EAE0CA" stroke="#7A6E5B"/>
    <path d="M50 130H94M50 142H90M50 154H94" stroke="#3F3931" stroke-width="2"/>
    <g transform="translate(122 96) rotate(3)">
      <rect x="-32" y="-44" width="64" height="88" fill="url(#qgrid)" stroke="#242321" stroke-width="1.2"/>
      <rect x="-28" y="-40" width="56" height="80" fill="rgba(160,156,148,0.48)"/>
      <ellipse cx="-6" cy="14" rx="11" ry="9" fill="#32302C"/><ellipse cx="11" cy="17" rx="9" ry="7" fill="#1E1D1B"/>
    </g>
  `,
  // C（正确）：6片克制 + 手撕钴蓝托住顶层银盐照片 + 冷暖材质反差 + ~41%棉纸留白
  C: `
    <rect x="132" y="24" width="76" height="86" fill="#EFE8DA" stroke="#B6A993" transform="rotate(4 170 67)"/>
    <polygon points="48,30 152,24 156,148 44,152" fill="#406A93" stroke="#EFE9DD" stroke-width="2"/>
    <circle cx="196" cy="52" r="24" fill="#DCB151"/>
    <rect x="128" y="122" width="88" height="46" fill="#181817" transform="rotate(-3 172 145)"/>
    <path d="M140 146Q160 132 180 152T206 142" fill="none" stroke="#F1EADF" stroke-width="1.8"/>
    <rect x="44" y="118" width="56" height="48" fill="#EAE6DD" stroke="#AAA08E"/>
    <g transform="translate(122 96) rotate(3)">
      <rect x="-34" y="-48" width="68" height="96" fill="#F5F2EC" stroke="#242321"/>
      <rect x="-27" y="-41" width="54" height="68" fill="#A09C94"/>
      <ellipse cx="-6" cy="14" rx="11" ry="9" fill="#32302C"/><ellipse cx="11" cy="17" rx="9" ry="7" fill="#1E1D1B"/>
      <rect x="-15" y="-54" width="30" height="9" fill="rgba(227,212,184,0.9)"/>
    </g>
  `,
  // D：仅破“数量与留白”——同样好材质与主图置顶，但硬塞进11片铺满到边，留白仅 ~11%
  D: `
    <rect x="4" y="4" width="84" height="74" fill="#BD9B73"/>
    <rect x="172" y="6" width="82" height="70" fill="#517A67"/>
    <rect x="6" y="112" width="88" height="72" fill="#E2979D"/>
    <rect x="166" y="116" width="88" height="68" fill="#EAE0CA" stroke="#A59882"/>
    <rect x="82" y="6" width="96" height="64" fill="#EFE8DA" stroke="#B6A993"/>
    <rect x="52" y="34" width="108" height="122" fill="#406A93" stroke="#EFE9DD" stroke-width="1.6"/>
    <circle cx="196" cy="52" r="24" fill="#DCB151"/>
    <rect x="128" y="116" width="92" height="52" fill="#181817"/>
    <rect x="44" y="114" width="66" height="60" fill="#EAE6DD" stroke="#9A907E"/>
    <rect x="184" y="68" width="68" height="66" fill="#DAA4A3"/>
    <g transform="translate(122 96) rotate(3)">
      <rect x="-34" y="-48" width="68" height="96" fill="#F5F2EC" stroke="#242321"/>
      <rect x="-27" y="-41" width="54" height="68" fill="#A09C94"/>
      <ellipse cx="-6" cy="14" rx="11" ry="9" fill="#32302C"/><ellipse cx="11" cy="17" rx="9" ry="7" fill="#1E1D1B"/>
    </g>
  `,
};

const QUIZ_STAMPS = {
  A: "破变量：0% 重叠 · 散片孤贴",
  B: "破变量：全高频纹样 · 抢花主图",
  C: "最成立：6 片 · 有反差 · 留白 41%",
  D: "破变量：11 片塞爆 · 留白仅 11%",
};

const QUIZ_FEEDBACK = {
  A: {
    title: "选的是 A —— 它破坏了「叠压关联」",
    body: "A 的数量、留白和纸材都没问题，但 6 片素材刻意保持等距不碰边，结果读起来像贴歪的网格卡片，失去了拼贴独有的前后空间纵深。正确项是 C。",
  },
  B: {
    title: "选的是 B —— 它破坏了「材质反差」",
    body: "B 的叠压关系与留白范围都在线，但拿掉哑光彩纸后，密排格线和铅字直接挤在主图背后，高频纹样互相打架把焦点彻底淹没。正确项是 C。",
  },
  C: {
    title: "答对了，就是 C！",
    body: "6 片克制数量聚成紧密群组，手撕哑光牛仔蓝纸稳稳垫在黑白银盐照片背后，格纸、炭黑与芥黄圆片拉开冷暖粗细反差，四周又留出约 41% 的暖棉纸呼吸白。",
  },
  D: {
    title: "选的是 D —— 它破坏了「数量与留白」",
    body: "D 的主角置顶与冷暖纸材和 C 一模一样，只是四周又硬塞了 5 片多余纸片，把棉纸留白压到只剩约 11%，层次感立刻退化成拥挤公告栏。正确项是 C。",
  },
};

$$("#quiz-grid .quiz-card").forEach((card) => {
  const opt = card.dataset.opt;
  card.querySelector(".q-svg").innerHTML = QUIZ_SVG[opt];
  card.addEventListener("click", () => {
    $$("#quiz-grid .quiz-card").forEach((c) => {
      const o = c.dataset.opt;
      c.classList.remove("is-picked", "is-right", "is-wrong");
      c.setAttribute("aria-pressed", String(c === card));
      if (o === "C") c.classList.add("is-right");
      else if (c === card) c.classList.add("is-wrong");
      if (c === card) c.classList.add("is-picked");
      c.querySelector(".q-stamp").textContent = QUIZ_STAMPS[o];
    });
    $("#qv-title").textContent = QUIZ_FEEDBACK[opt].title;
    $("#qv-body").textContent = QUIZ_FEEDBACK[opt].body;
  });
});

// ==================== 07 原海报放大拖动灯箱 ====================
const posterImg = $("#poster");
const posterBtn = $("#poster-btn");
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");

let lbScale = 1;
let lbPan = { x: 0, y: 0 };
let lbDragging = false;
let lbStart = { x: 0, y: 0 };

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbPan.x}px, ${lbPan.y}px) scale(${lbScale})`;
  $("#lb-zoom-reset").textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1.25;
  lbPan = { x: 0, y: 0 };
  applyLbTransform();
  lightbox.hidden = false;
  posterBtn.setAttribute("aria-expanded", "true");
  $("#lb-close").focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterBtn.setAttribute("aria-expanded", "false");
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => { lbScale = Math.min(3.5, lbScale + 0.35); applyLbTransform(); });
$("#lb-zoom-out").addEventListener("click", () => { lbScale = Math.max(0.8, lbScale - 0.35); applyLbTransform(); });
$("#lb-zoom-reset").addEventListener("click", () => { lbScale = 1; lbPan = { x: 0, y: 0 }; applyLbTransform(); });

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = Math.max(0.8, Math.min(3.5, lbScale + (e.deltaY < 0 ? 0.2 : -0.2)));
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) { closeLightbox(); return; }
  lbDragging = true;
  lbStart = { x: e.clientX - lbPan.x, y: e.clientY - lbPan.y };
  lbStage.classList.add("is-panning");
  lbStage.setPointerCapture(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDragging) return;
  lbPan.x = e.clientX - lbStart.x;
  lbPan.y = e.clientY - lbStart.y;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => {
  lbDragging = false;
  lbStage.classList.remove("is-panning");
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// 163 特写 跨页（FEATURE SPREAD）主交互控制器
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  PRESETS,
  createInitialState,
  clamp,
  evaluateSpread,
} from "./model.js";
import { renderHeroSpread } from "./spread-canvas.js";
import { GUTTER_BINDINGS, renderGutterSim } from "./gutter-canvas.js";

const state = createInitialState();
let lastRender = { layout: null, ev: null, hitBoxes: [] };

// ==================== 1. 开场对开杂志看样灯台 ====================
const heroCanvas = document.getElementById("hero-canvas");
const heroCtx = heroCanvas.getContext("2d");

const els = {
  verdictStamp: document.getElementById("hero-verdict-stamp"),
  emblemRing: document.getElementById("emblem-ring"),
  diagBadge: document.getElementById("diag-badge"),
  diagHeadline: document.getElementById("diag-headline"),
  diagBody: document.getElementById("diag-body"),
  diagNudge: document.getElementById("diag-nudge"),
  btnQuickFix: document.getElementById("btn-quick-fix"),
  mCoverage: document.getElementById("m-coverage"),
  mBleed: document.getElementById("m-bleed"),
  mSpine: document.getElementById("m-spine"),
  mGrade: document.getElementById("m-grade"),
  statusFocus: document.getElementById("status-focus"),
  statusCrop: document.getElementById("status-crop"),
  statusCaption: document.getElementById("status-caption"),
  ctrlZoom: document.getElementById("ctrl-zoom"),
  valZoom: document.getElementById("val-zoom"),
  ctrlFocus: document.getElementById("ctrl-focus"),
  valFocus: document.getElementById("val-focus"),
  btnTextPlace: document.getElementById("btn-text-place"),
  btnGuides: document.getElementById("btn-guides"),
};

let cssW = 800;
let cssH = 420;
let dpr = 1;
const anim = { t: 0, hoverRail: false, dirty: true };

function resizeCanvas(canvas, ctx) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(240, Math.round(rect.width));
  const h = Math.max(180, Math.round(rect.height));
  // 手机窄屏像素比上限 1.5（GUIDE.md 性能规矩），桌面保持 2× 高清
  const maxDpr = window.innerWidth <= 520 ? 1.5 : 2;
  const r = pixelRatio(maxDpr);
  if (canvas.width !== Math.round(w * r) || canvas.height !== Math.round(h * r)) {
    canvas.width = Math.round(w * r);
    canvas.height = Math.round(h * r);
  }
  ctx.setTransform(r, 0, 0, r, 0, 0);
  return { w, h, r };
}

let lastUiKey = "";
function syncHeroUI(ev) {
  const uiKey = `${state.story}|${ev.zoom.toFixed(2)}|${ev.focusU.toFixed(2)}|${state.bleed}|${state.textLoad}|${state.textPlace}|${state.binding}|${state.showGuides}|${ev.badge}`;
  if (uiKey === lastUiKey) return;
  lastUiKey = uiKey;
  const isPass = ev.passedCount === 3;
  els.verdictStamp.textContent = ev.badge;
  els.verdictStamp.className = `verdict-stamp ${isPass ? "is-pass" : "is-fail"}`;

  // 自示范刊头微型巨环半径与出血实时响应当前缩放倍率
  const emblemR = (9 + clamp((ev.zoom - 0.5) / 1.8, 0, 1) * 14).toFixed(1);
  const emblemCx = (20 + ev.focusU * 34).toFixed(1);
  els.emblemRing.setAttribute("r", emblemR);
  els.emblemRing.setAttribute("cx", emblemCx);

  els.diagBadge.textContent = ev.badge;
  els.diagBadge.className = `diag-badge ${isPass ? "is-pass" : "is-fail"}`;
  els.diagHeadline.textContent = ev.headline;
  els.diagBody.textContent = ev.body;
  els.diagNudge.textContent = ev.nudge;

  if (ev.fixPatch && ev.fixLabel) {
    els.btnQuickFix.hidden = false;
    els.btnQuickFix.textContent = ev.fixLabel;
  } else {
    els.btnQuickFix.hidden = true;
  }

  els.mCoverage.textContent = `${ev.coveragePct}%`;
  els.mBleed.textContent = `${ev.bleedEdges} / 4`;
  els.mSpine.textContent = `${ev.spineDistMm}mm`;
  els.mGrade.textContent = ev.gradeLabel;

  els.statusFocus.textContent = ev.focusTag;
  els.statusFocus.className = `pillar-status ${ev.focusOk ? "is-pass" : "is-fail"}`;
  els.statusCrop.textContent = ev.cropTag;
  els.statusCrop.className = `pillar-status ${ev.cropOk ? "is-pass" : "is-fail"}`;
  els.statusCaption.textContent = ev.captionTag;
  els.statusCaption.className = `pillar-status ${ev.captionOk ? "is-pass" : "is-fail"}`;

  els.ctrlZoom.value = ev.zoom.toFixed(2);
  els.valZoom.textContent = `${ev.zoom.toFixed(2)}×`;
  els.ctrlFocus.value = ev.focusU.toFixed(2);
  const sideLabel = Math.abs(ev.focusU - 0.5) < 0.02 ? "正中" : ev.focusU > 0.5 ? "右偏" : "左偏";
  els.valFocus.textContent = `${sideLabel} ${ev.spineDistMm}mm`;

  document.querySelectorAll(".story-tab").forEach((b) => {
    const on = b.dataset.story === state.story;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  document.querySelectorAll("[data-bleed]").forEach((b) => {
    b.classList.toggle("is-active", String(state.bleed) === b.dataset.bleed);
  });
  document.querySelectorAll("[data-text]").forEach((b) => {
    b.classList.toggle("is-active", state.textLoad === b.dataset.text);
  });
  document.querySelectorAll("[data-binding]").forEach((b) => {
    b.classList.toggle("is-active", state.binding === b.dataset.binding);
  });

  els.btnTextPlace.textContent = state.textPlace === "quiet" ? "文字：静区" : "文字：压主图";
  els.btnTextPlace.classList.toggle("is-active", state.textPlace === "quiet");
  els.btnTextPlace.classList.toggle("is-warn", state.textPlace === "over");
  els.btnGuides.textContent = state.showGuides ? "裁切线：开" : "裁切线：关";
  els.btnGuides.classList.toggle("is-active", state.showGuides);
}

function applyPatch(patch, immediate = false) {
  Object.assign(state, patch);
  state.zoom = clamp(state.zoom, 0.48, 2.48);
  state.focusU = clamp(state.focusU, 0.14, 0.86);
  anim.dirty = true;
  // 拖动期间交由单一 rAF 节拍重画，避免 pointermove 与 rAF 同帧双绘拖慢慢手机软渲染；点击与减动效则立即同步
  if (immediate || reducedMotion.matches) {
    heroLoop.draw();
  }
}

const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  const sized = resizeCanvas(heroCanvas, heroCtx);
  const sizeChanged = sized.w !== cssW || sized.h !== cssH || sized.r !== dpr;
  cssW = sized.w;
  cssH = sized.h;
  dpr = sized.r;
  anim.t = still ? 0 : t;

  // 开场前 0.75 秒做轻脉动落定，之后仅在用户拖动/改参/尺寸变化时按需重绘，兼顾软渲染 60 帧与零空转耗电
  if (anim.dirty || sizeChanged || still || t < 0.75) {
    lastRender = renderHeroSpread(heroCtx, cssW, cssH, state, anim);
    syncHeroUI(lastRender.ev);
    anim.dirty = false;
  }
});

// 画布直控：
// - 点击红笔批注胶囊 -> 直接纠偏该项
// - 在底沿「中缝尺」左右拖 -> 平移焦心位置 focusU
// - 在主跨页区域左右横拖（含 data-perf-drag 触摸测速）-> 连续推拉放大倍率 zoom
let dragMode = null; // "zoom" | "rail" | null
let dragStartX = 0;
let dragStartY = 0;
let dragStartZoom = 0.62;
let movedDist = 0;

function canvasPoint(e) {
  const rect = heroCanvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function hitRail(pt) {
  const r = lastRender.layout?.rail;
  if (!r) return false;
  return pt.x >= r.x - 10 && pt.x <= r.x + r.w + 10 && pt.y >= r.y - 8 && pt.y <= r.y + r.h + 10;
}

function hitAnnotation(pt) {
  for (const box of lastRender.hitBoxes || []) {
    if (pt.x >= box.x && pt.x <= box.x + box.w && pt.y >= box.y && pt.y <= box.y + box.h) {
      return box;
    }
  }
  return null;
}

heroCanvas.addEventListener("pointerdown", (e) => {
  const pt = canvasPoint(e);
  movedDist = 0;
  dragStartX = pt.x;
  dragStartY = pt.y;
  dragStartZoom = state.zoom;

  if (hitRail(pt)) {
    dragMode = "rail";
    heroCanvas.setPointerCapture(e.pointerId);
    const r = lastRender.layout.rail;
    applyPatch({ focusU: clamp((pt.x - r.x) / r.w, 0.14, 0.86) });
    return;
  }

  dragMode = "zoom";
  heroCanvas.setPointerCapture(e.pointerId);
});

heroCanvas.addEventListener("pointermove", (e) => {
  const pt = canvasPoint(e);
  if (!dragMode) {
    const overRail = hitRail(pt);
    const overAnn = !!hitAnnotation(pt);
    if (overRail !== anim.hoverRail) {
      anim.hoverRail = overRail;
      anim.dirty = true;
      heroLoop.draw();
    }
    heroCanvas.style.cursor = overAnn ? "pointer" : "ew-resize";
    return;
  }

  const dx = pt.x - dragStartX;
  const dy = pt.y - dragStartY;
  movedDist = Math.max(movedDist, Math.hypot(dx, dy));

  if (dragMode === "rail" && lastRender.layout?.rail) {
    const r = lastRender.layout.rail;
    applyPatch({ focusU: clamp((pt.x - r.x) / r.w, 0.14, 0.86) });
  } else if (dragMode === "zoom") {
    const span = Math.max(220, lastRender.layout?.spread?.w || cssW);
    // 向右推近放大，向左退远缩小；在开场 0.62× 时如果横拖超过 1.25× 自动协助看清变化但保留用户手控出血自由
    const nextZoom = clamp(dragStartZoom + (dx / span) * 2.1, 0.48, 2.48);
    applyPatch({ zoom: Number(nextZoom.toFixed(2)) });
  }
});

function endDrag(e) {
  if (!dragMode) return;
  const pt = canvasPoint(e);
  const wasClick = movedDist < 7;
  dragMode = null;
  if (wasClick) {
    const ann = hitAnnotation(pt);
    if (ann) {
      applyPatch(ann.patch, true);
    }
  }
}
heroCanvas.addEventListener("pointerup", endDrag);
heroCanvas.addEventListener("pointercancel", () => { dragMode = null; });

// 键盘操作（←/→ 调放大倍率，A/D 移焦心避中缝，B 切出血，T 切文字，R 复原）
heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") { e.preventDefault(); applyPatch({ zoom: state.zoom + 0.08 }, true); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); applyPatch({ zoom: state.zoom - 0.08 }, true); }
  else if (e.key === "d" || e.key === "D" || e.key === "]") { e.preventDefault(); applyPatch({ focusU: state.focusU + 0.04 }, true); }
  else if (e.key === "a" || e.key === "A" || e.key === "[") { e.preventDefault(); applyPatch({ focusU: state.focusU - 0.04 }, true); }
  else if (e.key === "b" || e.key === "B") { e.preventDefault(); applyPatch({ bleed: !state.bleed }, true); }
  else if (e.key === "t" || e.key === "T") {
    e.preventDefault();
    const order = ["wall", "concise", "none"];
    const next = order[(order.indexOf(state.textLoad) + 1) % order.length];
    applyPatch({ textLoad: next }, true);
  } else if (e.key === "r" || e.key === "R") {
    e.preventDefault();
    applyPatch(PRESETS.flaw.patch, true);
  }
});

// 按钮与滑轨事件绑定
document.querySelectorAll(".story-tab").forEach((btn) => {
  btn.addEventListener("click", () => applyPatch({ story: btn.dataset.story }, true));
});
els.ctrlZoom.addEventListener("input", () => applyPatch({ zoom: parseFloat(els.ctrlZoom.value) }));
els.ctrlFocus.addEventListener("input", () => applyPatch({ focusU: parseFloat(els.ctrlFocus.value) }));

document.querySelectorAll("[data-bleed]").forEach((btn) => {
  btn.addEventListener("click", () => applyPatch({ bleed: btn.dataset.bleed === "true" }, true));
});
document.querySelectorAll("[data-text]").forEach((btn) => {
  btn.addEventListener("click", () => applyPatch({ textLoad: btn.dataset.text }, true));
});
document.querySelectorAll("[data-binding]").forEach((btn) => {
  btn.addEventListener("click", () => applyPatch({ binding: btn.dataset.binding }, true));
});
els.btnTextPlace.addEventListener("click", () => {
  applyPatch({ textPlace: state.textPlace === "quiet" ? "over" : "quiet" }, true);
});
els.btnGuides.addEventListener("click", () => {
  applyPatch({ showGuides: !state.showGuides }, true);
});
els.btnQuickFix.addEventListener("click", () => {
  const ev = evaluateSpread(state);
  if (ev.fixPatch) applyPatch(ev.fixPatch, true);
});
document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) applyPatch(p.patch, true);
  });
});

// ==================== 2. 第 01 节：三跨页翻页节奏条 ====================
const PACE_MODES = {
  flat: {
    pages: [
      { kind: "dense", meta: "密排正文 · 灰率 48%" },
      { kind: "dense", meta: "仍旧密排 · 灰率 47%" },
      { kind: "dense", meta: "密排正文 · 灰率 46%" },
    ],
    path: "M40 56 L270 55 L500 57",
    dots: [[95, 56], [270, 55], [445, 57]],
    note: "连续三跨页全是密排双栏配小图，视觉灰度像一条拉平的心电图，读者翻几页就会感到阅读疲劳、难以停驻。",
  },
  peak: {
    pages: [
      { kind: "dense", meta: "密排正文 · 灰率 48%" },
      { kind: "feature", meta: "特写跨页 · 视觉峰值" },
      { kind: "mixed", meta: "图文展开 · 灰率 40%" },
    ],
    path: "M40 58 C120 58, 175 18, 270 18 C365 18, 420 52, 500 52",
    dots: [[95, 57], [270, 18], [445, 52]],
    note: "前后两页都是高密度图文栏，中间突然切入一张大特写跨页，明暗与尺幅的反差让读者立刻停下来——特写跨页是靠「反差」生效的。",
  },
  shout: {
    pages: [
      { kind: "feature", meta: "特写跨页 · 满幅强冲击" },
      { kind: "feature", meta: "又一页特写 · 开始麻木" },
      { kind: "feature", meta: "第三页特写 · 峰值消失" },
    ],
    path: "M40 20 L270 20 L500 20",
    dots: [[95, 20], [270, 20], [445, 20]],
    note: "当每一跨页都在满幅高声呐喊，反而没有哪一页是重点。好的杂志编辑通常每 6–10 页才安排一次真正的特写爆点。",
  },
};

function makeMiniSpreadSVG(kind) {
  if (kind === "feature") {
    return `<svg viewBox="0 0 148 100" aria-hidden="true">
      <rect width="148" height="100" fill="#013230"/>
      <polygon points="52,100 98,52 148,74 148,100" fill="#F0AF03"/>
      <circle cx="112" cy="48" r="46" fill="none" stroke="#F1E7D4" stroke-width="19"/>
      <rect x="10" y="20" width="28" height="7" fill="#F1E7D4"/>
      <rect x="10" y="32" width="22" height="7" fill="#F1E7D4"/>
      <rect x="10" y="45" width="32" height="2.5" fill="#F0AF03"/>
      <line x1="74" y1="0" x2="74" y2="100" stroke="rgba(241,231,212,0.25)" stroke-dasharray="2 2"/>
    </svg>`;
  }
  if (kind === "mixed") {
    return `<svg viewBox="0 0 148 100" aria-hidden="true">
      <rect width="148" height="100" fill="#F7F1E4"/>
      <rect x="10" y="14" width="54" height="36" fill="#013230"/>
      <circle cx="42" cy="32" r="11" fill="#F0AF03"/>
      <g fill="#7A8681">
        <rect x="10" y="58" width="54" height="3"/><rect x="10" y="65" width="48" height="3"/><rect x="10" y="72" width="52" height="3"/><rect x="10" y="79" width="42" height="3"/>
        <rect x="84" y="16" width="52" height="3"/><rect x="84" y="23" width="50" height="3"/><rect x="84" y="30" width="54" height="3"/><rect x="84" y="37" width="44" height="3"/>
        <rect x="84" y="52" width="54" height="3"/><rect x="84" y="59" width="50" height="3"/><rect x="84" y="66" width="52" height="3"/><rect x="84" y="73" width="38" height="3"/>
      </g>
      <line x1="74" y1="0" x2="74" y2="100" stroke="#D1C3A7"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 148 100" aria-hidden="true">
    <rect width="148" height="100" fill="#F7F1E4"/>
    <g fill="#7A8681">
      <rect x="10" y="14" width="25" height="3"/><rect x="39" y="14" width="25" height="3"/>
      <rect x="10" y="21" width="23" height="3"/><rect x="39" y="21" width="25" height="3"/>
      <rect x="10" y="28" width="25" height="3"/><rect x="39" y="28" width="21" height="3"/>
      <rect x="10" y="35" width="24" height="3"/><rect x="39" y="35" width="25" height="3"/>
      <rect x="10" y="42" width="25" height="3"/><rect x="39" y="42" width="24" height="3"/>
      <rect x="10" y="49" width="20" height="3"/><rect x="39" y="49" width="25" height="3"/>
      <rect x="10" y="62" width="25" height="3"/><rect x="39" y="62" width="25" height="3"/>
      <rect x="10" y="69" width="24" height="3"/><rect x="39" y="69" width="22" height="3"/>
      <rect x="10" y="76" width="25" height="3"/><rect x="39" y="76" width="25" height="3"/>
      <rect x="84" y="14" width="25" height="3"/><rect x="113" y="14" width="25" height="3"/>
      <rect x="84" y="21" width="25" height="3"/><rect x="113" y="21" width="22" height="3"/>
      <rect x="84" y="28" width="21" height="3"/><rect x="113" y="28" width="25" height="3"/>
      <rect x="84" y="35" width="25" height="3"/><rect x="113" y="35" width="25" height="3"/>
      <rect x="84" y="48" width="54" height="22" fill="#2E4A47"/>
      <rect x="84" y="76" width="48" height="3"/><rect x="84" y="83" width="40" height="3"/>
    </g>
    <line x1="74" y1="0" x2="74" y2="100" stroke="#D1C3A7"/>
  </svg>`;
}

function renderPace(modeKey) {
  const m = PACE_MODES[modeKey] || PACE_MODES.peak;
  m.pages.forEach((p, idx) => {
    document.getElementById(`pace-p${idx}`).innerHTML = makeMiniSpreadSVG(p.kind);
    document.getElementById(`pace-m${idx}`).textContent = p.meta;
  });
  document.getElementById("pace-path").setAttribute("d", m.path);
  m.dots.forEach(([cx, cy], idx) => {
    const dot = document.getElementById(`pace-dot${idx}`);
    dot.setAttribute("cx", cx);
    dot.setAttribute("cy", cy);
  });
  document.getElementById("pace-note").textContent = m.note;
  document.querySelectorAll("[data-pace]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.pace === modeKey);
  });
}

document.querySelectorAll("[data-pace]").forEach((b) => {
  b.addEventListener("click", () => renderPace(b.dataset.pace));
});
renderPace("peak");

// ==================== 3. 第 02 节：印样接触表与画外脑补图解 ====================
const CROP_CASES = {
  full: {
    good: false,
    badge: "保守过头 · 0 边出血",
    title: "全部装在白框里，观感立刻退化成普通内页插图",
    desc: "主体缩到 0.65×、四周留出完整白边时，读者一眼就能看完所有轮廓，画外没有任何悬念，也就失去了特写跨页特有的扑面压迫感。",
    facts: [
      ["出血边数：", "0 / 4 条裁切边"],
      ["轮廓留存：", "100%（完整但缺乏临场张力）"],
      ["版面观感：", "适合 166 商品图录，不适合情绪特写"],
    ],
    r: 36, cx: 162, cy: 105, boxed: true,
  },
  tangent: {
    good: false,
    badge: "擦边风险 · 贴线发紧",
    title: "轮廓刚好顶在裁切线上，印厂稍有漂移就会削成瑕疵",
    desc: "1.12× 处于进退两难的尴尬区：圆环外沿紧贴右裁切线却没有干脆切出，眼睛会一直盯着那个极窄的夹缝，觉得像排版不小心顶到了纸边。",
    facts: [
      ["出血边数：", "0 条有效出血（右边擦线发紧）"],
      ["轮廓留存：", "约 98%（未建立画外延展）"],
      ["版面观感：", "犹豫局促，裁纸刀漂移风险最高"],
    ],
    r: 68, cx: 170, cy: 105, boxed: false,
  },
  sweet: {
    good: true,
    badge: "甜点区 · 3 边出血",
    title: "干脆切过三条边，留下标志弧线让读者在画外补全",
    desc: "主体放大到 1.72×，巨环同时越过顶、右、底三条裁切边，但仍保留约 64% 的完整弧段。眼睛不用费力就能认出它是一枚更庞大的立体圆环，自然向纸外延展想象——这正是 163 原海报本身的构图策略。",
    facts: [
      ["出血边数：", "3 / 4 条裁切边"],
      ["轮廓留存：", "约 64%（一眼可辨识）"],
      ["版面观感：", "强迫近感与呼吸静区并存"],
    ],
    r: 106, cx: 196, cy: 102, boxed: false,
  },
  extreme: {
    good: false,
    badge: "过切失认 · 轮廓残缺",
    title: "放得太大把辨识线索切光，画面塌成无名色块",
    desc: "继续推到 2.45× 后，圆环弧度几乎拉成一条斜直带，可辨识轮廓跌破 25%。没看过原图的人根本猜不出它原本是什么，特写沦为纯抽象底纹。",
    facts: [
      ["出血边数：", "4 / 4 边（但主体身份已丢失）"],
      ["轮廓留存：", "不足 24%（大脑无法补全原物）"],
      ["版面观感：", "只剩色块壁纸感，叙事断裂"],
    ],
    r: 162, cx: 238, cy: 102, boxed: false,
  },
};

function renderCropCase(key) {
  const c = CROP_CASES[key] || CROP_CASES.sweet;
  const svg = document.getElementById("crop-compare-svg");
  const sw = 240;
  const sh = 160;
  const sx = 32;
  const sy = 25;
  const ringCx = sx + c.cx;
  const ringCy = sy + c.cy - 25;

  svg.innerHTML = `
    <defs>
      <clipPath id="crop-paper-clip"><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}"/></clipPath>
    </defs>
    <!-- 画外脑补虚线轮廓（展示读者大脑补全的空间范围） -->
    <circle cx="${ringCx}" cy="${ringCy}" r="${c.r}" fill="none" stroke="rgba(240,175,3,0.48)" stroke-width="1.5" stroke-dasharray="5 4"/>
    <circle cx="${ringCx}" cy="${ringCy}" r="${(c.r * 0.49).toFixed(1)}" fill="none" stroke="rgba(240,175,3,0.3)" stroke-width="1" stroke-dasharray="3 4"/>

    <!-- 纸面实印区 -->
    <g clip-path="url(#crop-paper-clip)">
      <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="${c.boxed ? "#F1E7D4" : "#013230"}"/>
      ${c.boxed ? `<rect x="${sx + 48}" y="${sy + 20}" width="152" height="120" fill="#013230"/>` : ""}
      <polygon points="${ringCx - c.r * 0.9},${sy + sh + 10} ${ringCx - c.r * 0.12},${ringCy + c.r * 0.18} ${sx + sw + 40},${ringCy + c.r * 0.55} ${sx + sw + 40},${sy + sh + 10}" fill="#F0AF03"/>
      <circle cx="${ringCx}" cy="${ringCy}" r="${c.r}" fill="none" stroke="#F1E7D4" stroke-width="${(c.r * 0.48).toFixed(1)}"/>
      <line x1="${sx + sw * 0.5}" y1="${sy}" x2="${sx + sw * 0.5}" y2="${sy + sh}" stroke="rgba(241,231,212,0.28)" stroke-dasharray="3 3"/>
    </g>
    <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="none" stroke="#F1E7D4" stroke-width="1.4"/>

    <!-- 右侧图例注释 -->
    <text x="${sx + sw + 16}" y="44" fill="#F5C438" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600">REAL TRIM vs IMAGINED</text>
    <line x1="${sx + sw + 16}" y1="62" x2="${sx + sw + 38}" y2="62" stroke="#F1E7D4" stroke-width="2"/>
    <text x="${sx + sw + 44}" y="66" fill="#F1E7D4" font-family="Noto Sans SC, sans-serif" font-size="11.5">实印跨页净边界</text>
    <line x1="${sx + sw + 16}" y1="84" x2="${sx + sw + 38}" y2="84" stroke="#F0AF03" stroke-width="1.5" stroke-dasharray="4 3"/>
    <text x="${sx + sw + 44}" y="88" fill="#C6D6CE" font-family="Noto Sans SC, sans-serif" font-size="11.5">读者脑补画外延展</text>
    <text x="${sx + sw + 16}" y="122" fill="${c.good ? "#6FE3B5" : "#FF8A70"}" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="700">${c.badge}</text>
  `;

  const badgeEl = document.getElementById("crop-badge");
  badgeEl.textContent = c.badge;
  badgeEl.className = `crop-badge ${c.good ? "is-good" : "is-bad"}`;
  document.getElementById("crop-title").textContent = c.title;
  document.getElementById("crop-desc").textContent = c.desc;
  document.getElementById("crop-facts").innerHTML = c.facts
    .map(([k, v]) => `<li><strong>${k}</strong>${v}</li>`)
    .join("");

  document.querySelectorAll(".sheet-frame").forEach((b) => {
    const on = b.dataset.crop === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-checked", String(on));
  });
}

document.querySelectorAll(".sheet-frame").forEach((b) => {
  b.addEventListener("click", () => renderCropCase(b.dataset.crop));
});
renderCropCase("sweet");

// ==================== 4. 第 03 节：中缝与出血物理模拟机 ====================
const gutterCanvas = document.getElementById("gutter-canvas");
const gutterCtx = gutterCanvas.getContext("2d");
const gState = { binding: "perfect", offsetMode: "center", bleedOn: true };

function syncGutterUI() {
  const b = GUTTER_BINDINGS[gState.binding];
  document.querySelectorAll("[data-gbind]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.gbind === gState.binding);
  });
  document.getElementById("btn-goffset-center").classList.toggle("is-active", gState.offsetMode === "center");
  document.getElementById("btn-goffset-safe").classList.toggle("is-active", gState.offsetMode === "safe");
  const bleedBtn = document.getElementById("btn-gbleed");
  bleedBtn.textContent = gState.bleedOn ? "3mm 出血：已留" : "3mm 出血：未留（露白）";
  bleedBtn.classList.toggle("is-active", gState.bleedOn);

  const verdict = `${b.name} · 开合角约 ${b.angleDeg}° · 单侧吞图 ±${b.swallowMm}mm`;
  document.getElementById("gutter-verdict").textContent = verdict;
  const extra = !gState.bleedOn
    ? " 同时因为未留 3mm 出血，裁纸刀只要漂移 1–2mm 就会在纸缘切出一条刺眼白边。"
    : gState.offsetMode === "safe"
      ? " 焦心右移避开中缝后，既保留了双页一体感，又让关键局部稳稳躺在平坦的右页纸面上。"
      : " 此时焦心正压在中缝谷底，从俯视看图能清楚发现圆环与金点被折槽直接咬断。";
  document.getElementById("gutter-summary").textContent = b.summary + extra;
}

let gLastW = 0;
let gLastH = 0;
let gDirty = true;
const gutterLoop = loop(gutterCanvas, (t, dt, { still }) => {
  const { w, h } = resizeCanvas(gutterCanvas, gutterCtx);
  if (gDirty || w !== gLastW || h !== gLastH || still) {
    gLastW = w;
    gLastH = h;
    gDirty = false;
    renderGutterSim(gutterCtx, w, h, gState);
  }
});

document.querySelectorAll("[data-gbind]").forEach((btn) => {
  btn.addEventListener("click", () => {
    gState.binding = btn.dataset.gbind;
    gDirty = true;
    syncGutterUI();
    gutterLoop.draw();
  });
});
document.getElementById("btn-goffset-center").addEventListener("click", () => {
  gState.offsetMode = "center";
  gDirty = true;
  syncGutterUI();
  gutterLoop.draw();
});
document.getElementById("btn-goffset-safe").addEventListener("click", () => {
  gState.offsetMode = "safe";
  gDirty = true;
  syncGutterUI();
  gutterLoop.draw();
});
document.getElementById("btn-gbleed").addEventListener("click", () => {
  gState.bleedOn = !gState.bleedOn;
  gDirty = true;
  syncGutterUI();
  gutterLoop.draw();
});
syncGutterUI();

// ==================== 5. 第 04 节：图文协同落位对比器 ====================
const CAPTION_MODES = {
  quiet: {
    contrast: "11.8 : 1（高清晰）",
    area: "12%（克制静区）",
    order: "① 巨环焦心 → ② 左页大标 → ③ 短注",
    verdict: "像 163 原海报一样，把整条左页深松静区留给标题与三行导语：眼睛先被右页暖奶白巨环和镉金斜楔吸住，再顺势向左扫过标题与说明，图文各得其所、互不抢戏。",
    svg: `
      <rect width="520" height="310" fill="#013230"/>
      <polygon points="185,310 345,155 520,230 520,310" fill="#F0AF03"/>
      <circle cx="385" cy="145" r="142" fill="none" stroke="#F1E7D4" stroke-width="58"/>
      <line x1="260" y1="0" x2="260" y2="310" stroke="rgba(241,231,212,0.28)" stroke-dasharray="4 4"/>
      <rect x="34" y="42" width="44" height="4" fill="#F0AF03"/>
      <text x="34" y="94" fill="#F1E7D4" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="34">特写 跨页</text>
      <text x="34" y="118" fill="#F0AF03" font-family="Big Shoulders, sans-serif" font-weight="800" font-size="18" letter-spacing="2">FEATURE SPREAD</text>
      <rect x="34" y="142" width="3" height="58" fill="#F0AF03"/>
      <rect x="46" y="146" width="144" height="6" fill="rgba(241,231,212,0.82)"/>
      <rect x="46" y="162" width="132" height="6" fill="rgba(241,231,212,0.82)"/>
      <rect x="46" y="178" width="104" height="6" fill="rgba(241,231,212,0.82)"/>
      <!-- 视线路径 ① -> ② -> ③（徽标避开汉字本体，落于行尾留白处） -->
      <path d="M355 145 Q272 104 202 84" fill="none" stroke="#6FE3B5" stroke-width="2" stroke-dasharray="5 4"/>
      <path d="M202 99 L202 152" fill="none" stroke="#6FE3B5" stroke-width="1.6" stroke-dasharray="4 3"/>
      <circle cx="355" cy="145" r="13" fill="#013230" stroke="#6FE3B5" stroke-width="2"/><text x="355" y="150" text-anchor="middle" fill="#6FE3B5" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="700">1</text>
      <circle cx="202" cy="84" r="13" fill="#013230" stroke="#6FE3B5" stroke-width="2"/><text x="202" y="89" text-anchor="middle" fill="#6FE3B5" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="700">2</text>
      <circle cx="202" cy="166" r="13" fill="#013230" stroke="#6FE3B5" stroke-width="2"/><text x="202" y="171" text-anchor="middle" fill="#6FE3B5" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="700">3</text>
    `,
  },
  overlay: {
    contrast: "10.6 : 1（暗角反白）",
    area: "10%（贴角克制）",
    order: "① 满幅视觉 → ② 暗角反白标 → ③ 极短图注",
    verdict: "当全出血照片本身自带一片干净的深色暗角（如深海、夜空或暗棚背景），也可以用高反差反白字紧贴暗角落位；但必须确保底下没有任何杂乱高光穿过字行。",
    svg: `
      <rect width="520" height="310" fill="#002321"/>
      <polygon points="90,310 310,120 520,210 520,310" fill="#F0AF03"/>
      <circle cx="330" cy="180" r="168" fill="none" stroke="#F1E7D4" stroke-width="64"/>
      <rect x="0" y="0" width="240" height="128" fill="rgba(0,22,20,0.68)"/>
      <line x1="260" y1="0" x2="260" y2="310" stroke="rgba(241,231,212,0.25)" stroke-dasharray="4 4"/>
      <text x="28" y="62" fill="#F7F1E4" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="30">暗角反白</text>
      <rect x="28" y="78" width="146" height="5" fill="rgba(241,231,212,0.85)"/>
      <rect x="28" y="92" width="112" height="5" fill="rgba(241,231,212,0.85)"/>
      <path d="M330 175 Q255 108 188 54" fill="none" stroke="#6FE3B5" stroke-width="2" stroke-dasharray="5 4"/>
      <circle cx="330" cy="175" r="13" fill="#013230" stroke="#6FE3B5" stroke-width="2"/><text x="330" y="180" text-anchor="middle" fill="#6FE3B5" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="700">1</text>
      <circle cx="188" cy="54" r="13" fill="#013230" stroke="#6FE3B5" stroke-width="2"/><text x="188" y="59" text-anchor="middle" fill="#6FE3B5" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="700">2</text>
    `,
  },
  clash: {
    contrast: "1.4 : 1（失焦难读）",
    area: "14%（压在亮环上）",
    order: "视线卡死（文字与亮环边缘相互撕扯）",
    verdict: "把浅色标题直接硬叠在暖奶白环带和镉金斜楔交界处，局部对比度瞬间跌到 1.4 : 1 以下，不仅字看不清，连主图最干净的弧线质感也被生生打断。",
    svg: `
      <rect width="520" height="310" fill="#013230"/>
      <polygon points="185,310 345,155 520,230 520,310" fill="#F0AF03"/>
      <circle cx="385" cy="145" r="142" fill="none" stroke="#F1E7D4" stroke-width="58"/>
      <line x1="260" y1="0" x2="260" y2="310" stroke="rgba(241,231,212,0.28)" stroke-dasharray="4 4"/>
      <rect x="242" y="96" width="196" height="106" fill="none" stroke="#FF8A70" stroke-width="2" stroke-dasharray="5 4"/>
      <text x="252" y="140" fill="#F7F1E4" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="34">特写 跨页</text>
      <rect x="252" y="158" width="166" height="6" fill="#F7F1E4"/>
      <rect x="252" y="174" width="140" height="6" fill="#F7F1E4"/>
      <rect x="248" y="64" width="174" height="24" fill="#A92B1C"/>
      <text x="335" y="80" text-anchor="middle" fill="#FFF4EE" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="700">× 浅字压亮底 · 对比仅 1.4:1</text>
    `,
  },
  wall: {
    contrast: "9.8 : 1（但版面窒息）",
    area: "44%（严重过载）",
    order: "文字墙与大图各喊各的，节奏破碎",
    verdict: "文字本身字迹清楚，却在左页与底边塞满 300 字双栏长评。视觉主角和文字主角同时争夺注意力，结果既读不安静，也没了特写跨页一气呵成的沉浸感。",
    svg: `
      <rect width="520" height="310" fill="#013230"/>
      <polygon points="185,310 345,155 520,230 520,310" fill="#F0AF03"/>
      <circle cx="385" cy="145" r="142" fill="none" stroke="#F1E7D4" stroke-width="58"/>
      <rect x="18" y="20" width="228" height="270" fill="rgba(0,30,28,0.92)" stroke="#FF8A70" stroke-width="1.6" stroke-dasharray="4 4"/>
      <text x="30" y="48" fill="#F1E7D4" font-family="Noto Sans SC, sans-serif" font-weight="800" font-size="18">特写跨页深度评述长文</text>
      <g fill="rgba(241,231,212,0.62)">
        ${Array.from({ length: 14 }, (_, i) => `<rect x="30" y="${64 + i * 15}" width="92" height="5"/><rect x="134" y="${64 + i * 15}" width="96" height="5"/>`).join("")}
      </g>
      <rect x="24" y="256" width="214" height="24" fill="#A92B1C"/>
      <text x="131" y="272" text-anchor="middle" fill="#FFF4EE" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="700">× 长文占去 44%，压垮视觉主导</text>
    `,
  },
};

function renderCaptionMode(key) {
  const m = CAPTION_MODES[key] || CAPTION_MODES.quiet;
  document.getElementById("caption-svg").innerHTML = m.svg;
  document.getElementById("cap-contrast").textContent = m.contrast;
  document.getElementById("cap-area").textContent = m.area;
  document.getElementById("cap-order").textContent = m.order;
  document.getElementById("cap-verdict").textContent = m.verdict;
  document.querySelectorAll(".place-opt").forEach((b) => {
    const on = b.dataset.place === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-checked", String(on));
  });
}
document.querySelectorAll(".place-opt").forEach((b) => {
  b.addEventListener("click", () => renderCaptionMode(b.dataset.place));
});
renderCaptionMode("quiet");

// ==================== 6. 第 05 节：百年特写跨页史卷宗 ====================
const ERAS = {
  agha: {
    meta: "1929–1930 · 纽约 · 康泰纳仕（Condé Nast）",
    title: "把照片从四条白框里解放出来：出血与双页跨页",
    body: "1929 年，梅赫梅德·费赫米·阿加（Mehemed Fehmy Agha）出任美国版《Vogue》艺术总监，并主持《Vanity Fair》与《House & Garden》的视觉改革。约在 1930 年前后，他率先在美国主流期刊里打破照片必须套白框的旧例，引入满幅出血（full-bleed）摄影与跨越对开双页的版面结构。",
    takeaway: "给今天排版的启示：拆掉白框不是为了省纸，而是让图像直接触碰物理纸边，消除「框中看画」的隔阂。",
    svg: `
      <defs><clipPath id="era-agha-clip"><rect x="172" y="24" width="128" height="168"/></clipPath></defs>
      <rect width="320" height="216" fill="#013230"/>
      <rect x="20" y="24" width="128" height="168" fill="#F1E7D4"/>
      <rect x="34" y="38" width="100" height="114" fill="none" stroke="#013230" stroke-width="1.5"/>
      <rect x="42" y="46" width="84" height="98" fill="#2E4A47"/>
      <text x="84" y="176" text-anchor="middle" fill="#013230" font-family="IBM Plex Mono, monospace" font-size="10">OLD: BOXED</text>
      <g clip-path="url(#era-agha-clip)">
        <rect x="172" y="24" width="128" height="168" fill="#F0AF03"/>
        <circle cx="268" cy="108" r="76" fill="none" stroke="#F1E7D4" stroke-width="34"/>
      </g>
      <rect x="172" y="24" width="128" height="168" fill="none" stroke="#F1E7D4" stroke-width="1.5"/>
      <text x="236" y="206" text-anchor="middle" fill="#F5C438" font-family="IBM Plex Mono, monospace" font-size="10">1930: FULL BLEED →</text>
    `,
  },
  brodovitch: {
    meta: "1934–1958 · 纽约 · 《Harper's Bazaar》",
    title: "把对开双页当成电影宽银幕，把中缝变成翻页铰链",
    body: "1934 年，阿列克谢·布罗多维奇（Alexey Brodovitch，1898–1971）应主编 Carmel Snow 邀请执掌《Harper's Bazaar》艺术指导直至 1958 年。他将每一对开跨页视为不可拆分的电影镜头，善用大胆裁切、宽阔不对称留白与锐利衬线标题，并培养出理查德·阿维顿、欧文·佩恩等摄影大师。",
    takeaway: "给今天排版的启示：特写跨页不只是一张大图，更是整本刊物翻页乐章里的「重音」与「休止符」。",
    svg: `
      <rect width="320" height="216" fill="#013230"/>
      <rect x="24" y="24" width="272" height="168" fill="#F7F1E4"/>
      <rect x="136" y="24" width="160" height="168" fill="#013230"/>
      <path d="M168 192 Q220 96 296 76 L296 192 Z" fill="#F0AF03"/>
      <circle cx="242" cy="96" r="52" fill="#F1E7D4"/>
      <line x1="160" y1="24" x2="160" y2="192" stroke="#F0AF03" stroke-dasharray="4 3" stroke-width="1.4"/>
      <text x="40" y="76" fill="#013230" font-family="Instrument Serif, serif" font-style="italic" font-size="24">Bazaar</text>
      <rect x="40" y="138" width="70" height="4" fill="#2E4A47"/>
      <rect x="40" y="148" width="56" height="4" fill="#2E4A47"/>
    `,
  },
  life: {
    meta: "1936 年 11 月 23 日 · 纽约 · 《Life》创刊号",
    title: "摄影报道（Photo Essay）：以大图叙事，用短注定锚",
    body: "亨利·卢斯（Henry Luce）于 1936 年 11 月 23 日推出新版《Life》周刊，创刊封面与开篇摄影报道由玛格丽特·伯克-怀特（Margaret Bourke-White）拍摄蒙大拿州福特佩克大坝。它让大众第一次体会到：由跨页大图主导、简洁图注交代事实的摄影报道，传播力可以超越纯文字新闻。",
    takeaway: "给今天排版的启示：再强的视觉特写也需要一句精准的图注，否则画面只剩情绪、丢了新闻与事实锚点。",
    svg: `
      <rect width="320" height="216" fill="#013230"/>
      <rect x="24" y="24" width="272" height="168" fill="#002321" stroke="#F1E7D4"/>
      <rect x="24" y="24" width="272" height="122" fill="#2E4A47"/>
      <polygon points="24,146 116,46 168,146" fill="#F1E7D4"/>
      <polygon points="128,146 216,38 296,146" fill="#F0AF03"/>
      <line x1="160" y1="24" x2="160" y2="192" stroke="rgba(241,231,212,0.35)" stroke-dasharray="3 3"/>
      <rect x="36" y="158" width="96" height="5" fill="#F1E7D4"/>
      <rect x="36" y="170" width="76" height="4" fill="#C6D6CE"/>
      <rect x="176" y="158" width="102" height="5" fill="#F5C438"/>
      <rect x="176" y="170" width="84" height="4" fill="#C6D6CE"/>
    `,
  },
  fleckhaus: {
    meta: "1959–1971 · 西德 · 《twen》杂志",
    title: "极致尺幅对比与大刀阔斧的局部特写",
    body: "德国设计师威利·弗莱克豪斯（Willy Fleckhaus）在 1959 至 1971 年担任西德青年文化杂志《twen》艺术总监。他将美式杂志的大胆视觉与瑞士 12 栏精密网格熔于一炉，把黑白特写照片放得极大、果断裁出纸边，旁边配以极窄粗黑标题与冷静留白，影响了此后数十年全球独立杂志的跨页语言。",
    takeaway: "给今天排版的启示：特写跨页越狂放，背后的网格与字阶纪律就越要精密克制。",
    svg: `
      <rect width="320" height="216" fill="#013230"/>
      <rect x="24" y="24" width="272" height="168" fill="#F7F1E4"/>
      <rect x="24" y="24" width="176" height="168" fill="#002321"/>
      <circle cx="110" cy="108" r="82" fill="none" stroke="#F1E7D4" stroke-width="30"/>
      <line x1="160" y1="24" x2="160" y2="192" stroke="#F0AF03" stroke-dasharray="3 3"/>
      <text x="212" y="92" fill="#013230" font-family="Big Shoulders, sans-serif" font-weight="800" font-size="42">TWEN</text>
      <rect x="212" y="106" width="68" height="4" fill="#F0AF03"/>
      <rect x="212" y="122" width="62" height="3" fill="#2E4A47"/>
      <rect x="212" y="130" width="54" height="3" fill="#2E4A47"/>
    `,
  },
  books: {
    meta: "1971 & 1974 · 纽约 · 从实践走向出版教科书",
    title: "双页统筹、中缝避让与图文协同成为系统方法论",
    body: "《Look》杂志艺术总监艾伦·赫尔伯特（Allen Hurlburt）于 1971 年出版《Publication Design》（Van Nostrand Reinhold），随后扬·怀特（Jan V. White）于 1974 年出版《Editing by Design》（R. R. Bowker）。两部经典著作把此前口耳相传的跨页节奏、中缝物理损耗与「编辑即视觉设计」写成可复用的教学体系。",
    takeaway: "给今天排版的启示：做特写跨页时，设计不是最后一步的美化，而要和选图、裁切、定标题同步发生。",
    svg: `
      <rect width="320" height="216" fill="#013230"/>
      <rect x="28" y="26" width="120" height="164" fill="#F1E7D4" stroke="#F0AF03" stroke-width="2"/>
      <text x="42" y="64" fill="#013230" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600">1971</text>
      <text x="42" y="88" fill="#013230" font-family="Big Shoulders, sans-serif" font-weight="800" font-size="22">PUBLICATION</text>
      <text x="42" y="110" fill="#013230" font-family="Big Shoulders, sans-serif" font-weight="800" font-size="22">DESIGN</text>
      <rect x="42" y="126" width="64" height="3" fill="#7D5300"/>
      <text x="42" y="148" fill="#2E4A47" font-family="Noto Sans SC, sans-serif" font-size="10.5">Allen Hurlburt</text>

      <rect x="172" y="26" width="120" height="164" fill="#08403D" stroke="#F0AF03" stroke-width="2"/>
      <text x="186" y="64" fill="#F5C438" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600">1974</text>
      <text x="186" y="88" fill="#F1E7D4" font-family="Big Shoulders, sans-serif" font-weight="800" font-size="22">EDITING BY</text>
      <text x="186" y="110" fill="#F1E7D4" font-family="Big Shoulders, sans-serif" font-weight="800" font-size="22">DESIGN</text>
      <rect x="186" y="126" width="64" height="3" fill="#F0AF03"/>
      <text x="186" y="148" fill="#C6D6CE" font-family="Noto Sans SC, sans-serif" font-size="10.5">Jan V. White</text>
    `,
  },
};

function renderEra(key) {
  const e = ERAS[key] || ERAS.agha;
  document.getElementById("era-svg").innerHTML = e.svg;
  document.getElementById("era-meta").textContent = e.meta;
  document.getElementById("era-title").textContent = e.title;
  document.getElementById("era-body").textContent = e.body;
  document.getElementById("era-takeaway").innerHTML = `<strong>${e.takeaway.split("：")[0]}：</strong>${e.takeaway.split("：")[1]}`;
  document.querySelectorAll(".era-tab").forEach((b) => {
    const on = b.dataset.era === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}
document.querySelectorAll(".era-tab").forEach((b) => {
  b.addEventListener("click", () => renderEra(b.dataset.era));
});
renderEra("agha");

// ==================== 7. 第 06 节：编辑部四选一终审练习 ====================
const QUIZ_ANSWERS = {
  A: {
    ok: false,
    title: "方案 A 不适合付印：放大和文字都对，唯独焦心被 240 页胶装中缝劈裂",
    body: "240 页无线胶装书脊单侧就会弯进约 14mm。方案 A 把最关键的铜壶核心正压在正中折痕线上，印成书摊开时焦点会被中缝直接吞噬断层。",
  },
  B: {
    ok: true,
    title: "选对了！方案 B 三条印刷底线全部过关",
    body: "方案 B 把铜壶局部放大到占跨页约 68%，顺势从顶、右、底三边干脆出血，同时将壶嘴核心偏置到右页平坦安全区（远离 14mm 胶装深缝），左页深松静区安放简洁主标与短注——既保留冲击力又经得起实体装订检验。",
  },
  C: {
    ok: false,
    title: "方案 C 偏保守：避开了中缝，却把特写缩回了普通图录白框",
    body: "整把铜壶被四条白框完整关在右页内、0 边出血，既没有大面积裁切带来的画外张力，也没发挥对开双页的尺幅优势，更像 166 图录版式。",
  },
  D: {
    ok: false,
    title: "方案 D 文字过载：放大、出血、避缝都过了，但双栏长评压垮了视觉节奏",
    body: "左页塞满密排双栏正文后，版面重心一分为二，读者一翻开不知道先看图还是先啃字。长段工艺评论应该留给下一跨页的正文栏。",
  },
};

const quizFb = document.getElementById("quiz-feedback");
const quizReset = document.getElementById("quiz-reset");

document.querySelectorAll(".quiz-opt").forEach((btn) => {
  btn.addEventListener("click", () => {
    const pick = btn.dataset.opt;
    const ans = QUIZ_ANSWERS[pick];
    document.querySelectorAll(".quiz-opt").forEach((b) => {
      b.classList.remove("is-correct", "is-wrong");
      if (b.dataset.opt === "B") b.classList.add("is-correct");
      else if (b.dataset.opt === pick && !ans.ok) b.classList.add("is-wrong");
    });
    quizFb.hidden = false;
    quizFb.className = `quiz-feedback ${ans.ok ? "is-correct" : "is-wrong"}`;
    document.getElementById("quiz-fb-title").textContent = ans.title;
    document.getElementById("quiz-fb-body").textContent = ans.body;
    quizReset.hidden = false;
  });
});

quizReset.addEventListener("click", () => {
  document.querySelectorAll(".quiz-opt").forEach((b) => b.classList.remove("is-correct", "is-wrong"));
  quizFb.hidden = true;
  quizReset.hidden = true;
});

// ==================== 8. 第 07 节：原海报高清灯箱（放大 + 拖动 + Esc） ====================
const posterImg = document.getElementById("poster");
const modal = document.getElementById("poster-modal");
const modalImg = document.getElementById("poster-modal-img");
const modalStage = document.getElementById("poster-modal-stage");
const modalReset = document.getElementById("poster-zoom-reset");

let mScale = 1;
let mX = 0;
let mY = 0;
let mDrag = false;
let mSX = 0;
let mSY = 0;
let mOX = 0;
let mOY = 0;

function updateModalTransform() {
  modalImg.style.transform = `translate(${mX}px, ${mY}px) scale(${mScale})`;
  modalReset.textContent = `${Math.round(mScale * 100)}%`;
}

function openModal() {
  if (!modalImg.src) modalImg.src = posterImg.src;
  mScale = 1;
  mX = 0;
  mY = 0;
  updateModalTransform();
  modal.hidden = false;
  document.getElementById("poster-close").focus();
}

function closeModal() {
  modal.hidden = true;
  document.getElementById("poster-open").focus();
}

document.getElementById("poster-open").addEventListener("click", openModal);
document.getElementById("poster-close").addEventListener("click", closeModal);
document.getElementById("poster-zoom-in").addEventListener("click", () => {
  mScale = clamp(mScale + 0.35, 0.75, 3.5);
  updateModalTransform();
});
document.getElementById("poster-zoom-out").addEventListener("click", () => {
  mScale = clamp(mScale - 0.35, 0.75, 3.5);
  updateModalTransform();
});
modalReset.addEventListener("click", () => {
  mScale = 1;
  mX = 0;
  mY = 0;
  updateModalTransform();
});

modalStage.addEventListener("wheel", (e) => {
  if (modal.hidden) return;
  e.preventDefault();
  mScale = clamp(mScale + (e.deltaY < 0 ? 0.2 : -0.2), 0.75, 3.5);
  updateModalTransform();
}, { passive: false });

modalStage.addEventListener("pointerdown", (e) => {
  if (e.target === modalStage && mScale <= 1.01) {
    closeModal();
    return;
  }
  mDrag = true;
  mSX = e.clientX;
  mSY = e.clientY;
  mOX = mX;
  mOY = mY;
  modalStage.classList.add("is-dragging");
  modalStage.setPointerCapture(e.pointerId);
});

modalStage.addEventListener("pointermove", (e) => {
  if (!mDrag) return;
  mX = mOX + (e.clientX - mSX);
  mY = mOY + (e.clientY - mSY);
  updateModalTransform();
});

modalStage.addEventListener("pointerup", () => {
  mDrag = false;
  modalStage.classList.remove("is-dragging");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) closeModal();
});

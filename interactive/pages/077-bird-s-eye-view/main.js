// 077 鸟瞰构图 · 主交互逻辑与 7 个章节互动模块
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { createOpeningBrokenState, evaluateView } from "./model.js";
import {
  drawAerialScene,
  drawElevationCrossSection,
  drawTracingLayers,
  drawHeliodonYard,
  drawQuizOption,
} from "./render.js";

const DEG = Math.PI / 180;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ==================== 1. 开场主角：三维建筑街区鸟瞰沙盘 ====================
const targetState = createOpeningBrokenState();
// 用于丝滑动画过渡的渲染态
const anim = {
  pitch: targetState.pitch,
  azimuth: targetState.azimuth,
  sunElev: targetState.sunElev,
  orderMix: targetState.order === "organized" ? 1 : 0,
};

const heroCanvas = document.getElementById("aerial-canvas");
const heroCtx = heroCanvas.getContext("2d", { alpha: false });

const ui = {
  stamp: document.getElementById("hero-status-stamp"),
  wedgeArc: document.getElementById("wedge-arc"),
  wedgeRay: document.getElementById("wedge-ray"),
  wedgeEye: document.getElementById("wedge-eye"),
  telePitch: document.getElementById("tele-pitch"),
  teleAz: document.getElementById("tele-az"),
  teleSun: document.getElementById("tele-sun"),
  telePlaza: document.getElementById("tele-plaza"),
  pitchSlider: document.getElementById("pitch-slider"),
  pitchVal: document.getElementById("pitch-val"),
  sunSlider: document.getElementById("sun-slider"),
  sunVal: document.getElementById("sun-val"),
  btnOrder: document.getElementById("btn-order"),
  orderLabel: document.getElementById("order-label"),
  verdictTitle: document.getElementById("verdict-title"),
  verdictBody: document.getElementById("verdict-body"),
  verdictHint: document.getElementById("verdict-hint"),
  mPlaza: document.getElementById("m-plaza"),
  mFacade: document.getElementById("m-facade"),
  mShadow: document.getElementById("m-shadow"),
  mPaths: document.getElementById("m-paths"),
  mTier: document.getElementById("m-tier"),
  compassNeedle: document.getElementById("compass-needle"),
  compassDeg: document.getElementById("compass-deg"),
  btnNorth: document.getElementById("btn-north"),
  pillarTags: {
    overview: document.getElementById("pillar-overview-tag"),
    path: document.getElementById("pillar-path-tag"),
    order: document.getElementById("pillar-order-tag"),
    relation: document.getElementById("pillar-relation-tag"),
  },
};

let heroW = 760;
let heroH = 480;
let heroDpr = 1;
let heroNeedsResize = true;
let lastAnchors = [];
let lastUIKey = "";
let cachedEvalKey = "";
let cachedEvalData = null;

function resizeHeroCanvas(force = false) {
  if (!force && !heroNeedsResize) return;
  heroNeedsResize = false;
  const rect = heroCanvas.getBoundingClientRect();
  // 手机竖屏像素比封顶 1.25（GUIDE.md 性能守则），避免慢手机软件渲染过载
  const maxDpr = window.innerWidth <= 768 ? 1.25 : 2;
  const dpr = pixelRatio(maxDpr);
  const w = Math.max(260, Math.round(rect.width || 720));
  const h = Math.max(220, Math.round(rect.height || 450));
  if (w !== heroW || h !== heroH || dpr !== heroDpr || heroCanvas.width !== Math.round(w * dpr)) {
    heroW = w;
    heroH = h;
    heroDpr = dpr;
    heroCanvas.width = Math.round(w * dpr);
    heroCanvas.height = Math.round(h * dpr);
    cachedEvalKey = "";
  }
  heroCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function updateWedgeSVG(pitchDeg) {
  const r = 34;
  const cx = 48, cy = 44;
  const rad = clamp(pitchDeg, 8, 90) * DEG;
  const ex = cx - Math.cos(rad) * r;
  const ey = cy - Math.sin(rad) * r;
  ui.wedgeRay.setAttribute("x2", ex.toFixed(1));
  ui.wedgeRay.setAttribute("y2", ey.toFixed(1));
  ui.wedgeEye.setAttribute("cx", ex.toFixed(1));
  ui.wedgeEye.setAttribute("cy", ey.toFixed(1));
  ui.wedgeArc.setAttribute("d", `M ${cx} ${cy} L ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)} Z`);
}

function syncHeroUI(evalData) {
  const { metrics, pillars, verdict } = evalData;
  const key = `${metrics.pitch}|${metrics.azimuth}|${metrics.sunElev}|${metrics.plazaVisiblePct}|${metrics.facadePct}|${metrics.openPaths}|${verdict.code}|${targetState.order}|${targetState.plazaMode}|${targetState.activeLens}`;
  if (key === lastUIKey) return;
  lastUIKey = key;

  ui.stamp.textContent = verdict.badge;
  ui.stamp.className = `status-stamp ${verdict.tone === "ok" ? "is-ok" : "is-warn"}`;

  updateWedgeSVG(metrics.pitch);
  ui.telePitch.textContent = `PITCH ${metrics.pitch}°`;
  ui.teleAz.textContent = `AZ ${String(metrics.azimuth).padStart(3, "0")}°`;
  ui.teleSun.textContent = `SUN ${metrics.sunElev}°`;
  ui.telePlaza.textContent = targetState.plazaMode === "none" ? "主锚点：关闭" : `广场可见 ${metrics.plazaVisiblePct}%`;

  ui.pitchSlider.value = String(Math.round(targetState.pitch));
  ui.pitchVal.textContent = `${Math.round(targetState.pitch)}°`;
  ui.sunSlider.value = String(Math.round(targetState.sunElev));
  ui.sunVal.textContent = `${Math.round(targetState.sunElev)}°`;

  const isOrg = targetState.order === "organized";
  ui.btnOrder.setAttribute("aria-pressed", String(isOrg));
  ui.orderLabel.textContent = isOrg ? "格局：规整统筹 · 点此散乱试错" : "格局：散乱无序 → 点此规整";

  document.querySelectorAll("[data-plaza]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.plaza === targetState.plazaMode);
  });

  ui.verdictTitle.textContent = verdict.headline;
  ui.verdictBody.textContent = verdict.body;
  ui.verdictHint.textContent = verdict.hint;

  ui.mPlaza.textContent = targetState.plazaMode === "none" ? "无锚" : `${metrics.plazaVisiblePct}%`;
  ui.mFacade.textContent = `${metrics.facadePct}%`;
  ui.mShadow.textContent = `${metrics.shadowLen.toFixed(2)}×`;
  ui.mPaths.textContent = `${metrics.openPaths} / 4`;
  ui.mTier.textContent = metrics.tier;

  ui.compassNeedle.style.transform = `rotate(${-metrics.azimuth}deg)`;
  ui.compassDeg.textContent = `${String(metrics.azimuth).padStart(3, "0")}° · 归北`;

  for (const k of ["overview", "path", "order", "relation"]) {
    const tag = ui.pillarTags[k];
    tag.textContent = pillars[k].tag;
    tag.classList.toggle("is-ok", pillars[k].ok);
  }
}

let lastUISyncMs = 0;
const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  resizeHeroCanvas();
  const desiredOrder = targetState.order === "organized" ? 1 : 0;
  if (still) {
    anim.pitch = targetState.pitch;
    anim.azimuth = targetState.azimuth;
    anim.sunElev = targetState.sunElev;
    anim.orderMix = desiredOrder;
  } else {
    const k = Math.min(1, (dt || 0.016) * 9.5);
    anim.pitch += (targetState.pitch - anim.pitch) * k;
    anim.azimuth += (targetState.azimuth - anim.azimuth) * k;
    anim.sunElev += (targetState.sunElev - anim.sunElev) * k;
    anim.orderMix += (desiredOrder - anim.orderMix) * k;
  }

  const liveState = {
    ...targetState,
    pitch: anim.pitch,
    azimuth: anim.azimuth,
    sunElev: anim.sunElev,
  };
  const evalKey = `${anim.pitch.toFixed(1)}|${anim.azimuth.toFixed(1)}|${anim.sunElev.toFixed(1)}|${anim.orderMix.toFixed(2)}|${targetState.plazaMode}|${heroW}|${heroH}`;
  if (evalKey !== cachedEvalKey || !cachedEvalData) {
    cachedEvalKey = evalKey;
    cachedEvalData = evaluateView(liveState, heroW, heroH, anim.orderMix);
  }
  const rendered = drawAerialScene(heroCtx, liveState, cachedEvalData, {
    width: heroW,
    height: heroH,
    time: t,
    still,
    interactive: true,
  });
  lastAnchors = rendered.plazaAnchorsScreen;
  const nowMs = performance.now();
  const settled = Math.abs(targetState.azimuth - anim.azimuth) < 0.25 && Math.abs(targetState.pitch - anim.pitch) < 0.25;
  if (still || settled || nowMs - lastUISyncMs >= 90) {
    lastUISyncMs = nowMs;
    syncHeroUI(cachedEvalData);
  }
});

// 画布横向拖拽 360° 绕飞 + 点击虚线圈重定主广场（触屏保留纵向页面滚动）
let dragInfo = null;
heroCanvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  dragInfo = {
    id: e.pointerId,
    x0: e.clientX,
    y0: e.clientY,
    az0: targetState.azimuth,
    moved: false,
    lockedHoriz: false,
  };
  heroCanvas.setPointerCapture?.(e.pointerId);
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!dragInfo || e.pointerId !== dragInfo.id) return;
  const dx = e.clientX - dragInfo.x0;
  const dy = e.clientY - dragInfo.y0;
  if (!dragInfo.lockedHoriz) {
    if (Math.hypot(dx, dy) < 5) return;
    if (e.pointerType === "touch" && Math.abs(dy) > Math.abs(dx) * 1.2) {
      dragInfo = null; // 放行竖向滚屏
      return;
    }
    dragInfo.lockedHoriz = true;
  }
  dragInfo.moved = true;
  targetState.azimuth = dragInfo.az0 + dx * 0.42;
  if (reducedMotion.matches) heroLoop.draw();
});

function finishDrag(e) {
  if (!dragInfo || e.pointerId !== dragInfo.id) return;
  const wasClick = !dragInfo.moved;
  dragInfo = null;
  if (wasClick) {
    const rect = heroCanvas.getBoundingClientRect();
    const lx = e.clientX - rect.left;
    const ly = e.clientY - rect.top;
    for (const a of lastAnchors) {
      if (Math.hypot(lx - a.x, ly - a.y) <= Math.max(24, a.r)) {
        targetState.plazaMode = a.key;
        heroLoop.draw();
        return;
      }
    }
  }
}
heroCanvas.addEventListener("pointerup", finishDrag);
heroCanvas.addEventListener("pointercancel", () => { dragInfo = null; });

// 键盘操作沙盘（↑↓ 俯角，←→ 绕飞，R 复位）
heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") { targetState.pitch = clamp(targetState.pitch + 4, 10, 90); e.preventDefault(); }
  else if (e.key === "ArrowDown") { targetState.pitch = clamp(targetState.pitch - 4, 10, 90); e.preventDefault(); }
  else if (e.key === "ArrowLeft") { targetState.azimuth -= 12; e.preventDefault(); }
  else if (e.key === "ArrowRight") { targetState.azimuth += 12; e.preventDefault(); }
  else if (e.key === "r" || e.key === "R") { Object.assign(targetState, createOpeningBrokenState()); e.preventDefault(); }
  else return;
  heroLoop.draw();
});

// 控轨事件
ui.pitchSlider.addEventListener("input", () => {
  targetState.pitch = Number(ui.pitchSlider.value);
  heroLoop.draw();
});
ui.sunSlider.addEventListener("input", () => {
  targetState.sunElev = Number(ui.sunSlider.value);
  heroLoop.draw();
});
ui.btnOrder.addEventListener("click", () => {
  targetState.order = targetState.order === "organized" ? "scattered" : "organized";
  heroLoop.draw();
});
ui.btnNorth.addEventListener("click", () => {
  targetState.azimuth = 0;
  heroLoop.draw();
});

document.querySelectorAll("[data-plaza]").forEach((btn) => {
  btn.addEventListener("click", () => {
    targetState.plazaMode = btn.dataset.plaza;
    heroLoop.draw();
  });
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = btn.dataset.preset;
    if (p === "reset") {
      Object.assign(targetState, createOpeningBrokenState());
    } else if (p === "low") {
      targetState.pitch = 14;
      targetState.azimuth = -18;
    } else if (p === "oblique-low") {
      targetState.pitch = 40;
      targetState.azimuth = -22;
      targetState.sunElev = 34;
      targetState.order = "organized";
      targetState.plazaMode = "center";
    } else if (p === "oblique-high") {
      targetState.pitch = 60;
      targetState.azimuth = -12;
      targetState.sunElev = 38;
      targetState.order = "organized";
      targetState.plazaMode = "center";
    } else if (p === "nadir") {
      targetState.pitch = 90;
      targetState.azimuth = 0;
      targetState.order = "organized";
      targetState.plazaMode = "center";
    }
    heroLoop.draw();
  });
});

// 四枚原海报圆徽点击切换检视层
document.querySelectorAll(".pillar-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    const lens = btn.dataset.lens;
    targetState.activeLens = targetState.activeLens === lens ? null : lens;
    document.querySelectorAll(".pillar-item").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.lens === targetState.activeLens));
    });
    heroLoop.draw();
  });
});

// ==================== 2. 01 节：建筑竖向剖面视线联动仪 ====================
const sec1Canvas = document.getElementById("sec1-canvas");
const sec1Ctx = sec1Canvas.getContext("2d");
const SEC1_DATA = {
  "-20": {
    title: "-20° 虫视仰拍：拔高威压，看不到地面格局",
    desc: "视线贴地斜向上刺向天空，前景建筑瞬间放大成压顶巨墙，广场和道路完全隐没在脚底之外——这是 078 虫视构图的表现领域。",
    ground: 6,
    facade: 96,
  },
  "0": {
    title: "0° 平视街面：亲切临场，但后排全被前景挡死",
    desc: "人眼站在街道里只能看见眼前第一栋楼的立面，中央橙色广场与后排院落被遮得严严实实——属于 080 平视构图的沉浸体验。",
    ground: 24,
    facade: 88,
  },
  "48": {
    title: "48° 斜俯鸟瞰：地面格局与建筑立面双可读",
    desc: "视线越过前景楼顶，直接落进中央橙色广场与四向道路，同时保留主塔楼约三分之一的垂直立面，高低主次一眼分明。",
    ground: 86,
    facade: 74,
  },
  "90": {
    title: "90° 垂直顶视：平面极致规整，但立体高度归零",
    desc: "镜头垂直向下，地面路网达到 100% 无遮挡，可建筑立面完全消失，高塔与矮院压成一样扁平的色块——跨入了 079 顶视构图。",
    ground: 100,
    facade: 8,
  },
};
let sec1TargetAngle = 48;
let sec1CurAngle = 48;

function renderSec1() {
  const rect = sec1Canvas.getBoundingClientRect();
  const dpr = pixelRatio(2);
  const w = Math.max(260, Math.round(rect.width || 520));
  const h = Math.max(200, Math.round(rect.height || 390));
  if (sec1Canvas.width !== Math.round(w * dpr)) {
    sec1Canvas.width = Math.round(w * dpr);
    sec1Canvas.height = Math.round(h * dpr);
  }
  sec1Ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawElevationCrossSection(sec1Ctx, w, h, Math.round(sec1CurAngle));
}

let sec1Dirty = true;
const sec1Loop = loop(sec1Canvas, (_t, dt, { still }) => {
  if (still) {
    sec1CurAngle = sec1TargetAngle;
    renderSec1();
    sec1Dirty = false;
    return;
  }
  if (!sec1Dirty && Math.abs(sec1TargetAngle - sec1CurAngle) < 0.08) return;
  sec1CurAngle += (sec1TargetAngle - sec1CurAngle) * Math.min(1, (dt || 0.016) * 10);
  if (Math.abs(sec1TargetAngle - sec1CurAngle) < 0.08) {
    sec1CurAngle = sec1TargetAngle;
    sec1Dirty = false;
  }
  renderSec1();
});

document.querySelectorAll("[data-sec1-angle]").forEach((btn) => {
  btn.addEventListener("click", () => {
    sec1TargetAngle = Number(btn.dataset.sec1Angle);
    sec1Dirty = true;
    document.querySelectorAll("[data-sec1-angle]").forEach((b) => b.classList.toggle("is-active", b === btn));
    const info = SEC1_DATA[String(sec1TargetAngle)];
    document.getElementById("sec1-title").textContent = info.title;
    document.getElementById("sec1-desc").textContent = info.desc;
    document.getElementById("bar-ground").style.width = `${info.ground}%`;
    document.getElementById("val-ground").textContent = `${info.ground}%`;
    document.getElementById("bar-facade").style.width = `${info.facade}%`;
    document.getElementById("val-facade").textContent = `${info.facade}%`;
    sec1Loop.draw();
  });
});

// ==================== 3. 02 节：四层硫酸纸叠加台 ====================
const sec2Canvas = document.getElementById("sec2-canvas");
const sec2Ctx = sec2Canvas.getContext("2d");
const layers = { overview: true, path: true, order: true, relation: true };

function renderSec2() {
  const rect = sec2Canvas.getBoundingClientRect();
  const dpr = pixelRatio(2);
  const w = Math.max(260, Math.round(rect.width || 520));
  const h = Math.max(200, Math.round(rect.height || 390));
  if (sec2Canvas.width !== Math.round(w * dpr)) {
    sec2Canvas.width = Math.round(w * dpr);
    sec2Canvas.height = Math.round(h * dpr);
  }
  sec2Ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawTracingLayers(sec2Ctx, w, h, layers);

  const on = Object.entries(layers).filter(([, v]) => v).map(([k]) => k);
  const note = document.getElementById("sec2-note");
  if (on.length === 4) {
    note.textContent = "四层全开：底图定格局、流线带节奏、橙圆立主次、阴影交代高低与间距，整张总图一秒读懂。";
  } else if (on.length === 0) {
    note.textContent = "已清空全部四层：逐一打开按钮，观察哪一层决定格局，哪一层负责把视线串成动线。";
  } else if (!layers.order && layers.overview) {
    note.textContent = "关掉「焦点锚点」后：只剩一片同色块与线条，眼睛缺少第一落点，需要多花一倍时间找中心。";
  } else if (!layers.path && layers.overview) {
    note.textContent = "关掉「橙色流线」后：街区轮廓还在，但动线节奏断了，观众看清了建筑却读不出穿行方向。";
  } else if (!layers.relation && layers.overview) {
    note.textContent = "关掉「投影联系」后：所有屋顶失去高差提示，主楼与裙房的关系变得扁平。";
  } else if (!layers.overview) {
    note.textContent = "关掉「体块底图」后：抽象路径与锚点浮在空中，失去建筑空间边界的依托。";
  } else {
    note.textContent = `当前开启 ${on.length} / 4 层，可继续组合开关对比各层在总图里的职责。`;
  }
}

document.querySelectorAll("[data-layer]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.layer;
    layers[k] = !layers[k];
    btn.classList.toggle("is-on", layers[k]);
    btn.setAttribute("aria-pressed", String(layers[k]));
    renderSec2();
  });
});

// ==================== 4. 03 节：24 小时建筑日影时刻盘 ====================
const sec3Canvas = document.getElementById("sec3-canvas");
const sec3Ctx = sec3Canvas.getContext("2d");
const hourSlider = document.getElementById("hour-slider");
const hourVal = document.getElementById("hour-val");
const sec3Note = document.getElementById("sec3-note");
let curHour = 12;

function formatHour(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function renderSec3() {
  const rect = sec3Canvas.getBoundingClientRect();
  const dpr = pixelRatio(2);
  const w = Math.max(260, Math.round(rect.width || 520));
  const h = Math.max(200, Math.round(rect.height || 390));
  if (sec3Canvas.width !== Math.round(w * dpr)) {
    sec3Canvas.width = Math.round(w * dpr);
    sec3Canvas.height = Math.round(h * dpr);
  }
  sec3Ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const { sunElev, factor } = drawHeliodonYard(sec3Ctx, w, h, curHour);
  hourSlider.value = String(curHour);
  hourVal.textContent = formatHour(curHour);

  if (sunElev >= 70) {
    sec3Note.textContent = `${formatHour(curHour)} 正午顶光（太阳 ${sunElev}° · 影长 ${factor.toFixed(2)}×）：阴影缩在楼脚，8 层主楼和 2 层矮院从高空看几乎一样平。`;
  } else if (sunElev <= 26) {
    sec3Note.textContent = `${formatHour(curHour)} 低角度长影（太阳 ${sunElev}° · 影长 ${factor.toFixed(2)}×）：楼高差异极其鲜明，但 8 层主楼的长影已开始跨过街区通道。`;
  } else {
    sec3Note.textContent = `${formatHour(curHour)} 清朗斜阳（太阳 ${sunElev}° · 影长 ${factor.toFixed(2)}×）：每栋楼的影长忠实映射层数，高矮体量一目了然且街道依然通透。`;
  }

  document.querySelectorAll("[data-hour]").forEach((b) => {
    b.classList.toggle("is-active", Math.abs(Number(b.dataset.hour) - curHour) < 0.05);
  });
}

hourSlider.addEventListener("input", () => { curHour = Number(hourSlider.value); renderSec3(); });
document.querySelectorAll("[data-hour]").forEach((b) => {
  b.addEventListener("click", () => { curHour = Number(b.dataset.hour); renderSec3(); });
});

// ==================== 5. 04 节：五百年高空制图史年表 ====================
const ERAS = [
  {
    year: "1500 · VENICE",
    title: "雅各布·德·巴尔巴里《威尼斯鸟瞰图》",
    latin: "Venetie MD — Jacopo de' Barbari & Anton Kolb",
    body: "没有飞机，也没有气球。巴尔巴里团队花了约三年登上全城高塔三角测绘，由出版商安东·科尔布在 1500 年用六块巨型梨木雕版印成约 1.3 × 2.8 米的巨幅鸟瞰图，将泻湖、大运河与 103 座钟楼一次性摊在墙上。",
    source: "藏品核实：明尼阿波利斯艺术学院（Minneapolis Institute of Art）",
    svg: `<svg viewBox="0 0 360 220" role="img" aria-label="1500年威尼斯六块木刻鸟瞰图结构示意">
      <rect width="360" height="220" fill="#FAF6EE"/>
      <g stroke="#C9C1B0" stroke-width="1" stroke-dasharray="4 3">
        <line x1="120" y1="16" x2="120" y2="204"/><line x1="240" y1="16" x2="240" y2="204"/><line x1="18" y1="110" x2="342" y2="110"/>
      </g>
      <path d="M 30 148 Q 105 90 175 118 T 330 84" fill="none" stroke="#676A3E" stroke-width="18" opacity="0.28"/>
      <path d="M 30 148 Q 105 90 175 118 T 330 84" fill="none" stroke="#DC6F1B" stroke-width="2" stroke-dasharray="5 4"/>
      <g fill="#78784F" stroke="#FAF6EE" stroke-width="1.2">
        <polygon points="75,92 108,82 118,104 82,114"/><polygon points="150,74 198,64 210,88 162,98"/>
        <polygon points="228,118 282,106 296,136 240,148"/><polygon points="122,138 170,128 182,154 134,164"/>
      </g>
      <rect x="192" y="34" width="10" height="46" fill="#B8530A"/><polygon points="192,34 197,22 202,34" fill="#141610"/>
      <text x="20" y="28" fill="#484C29" font-size="11" font-family="JetBrains Mono, monospace">6 WOODBLOCKS · 1.3 × 2.8 M</text>
      <text x="20" y="206" fill="#494A3E" font-size="11" font-family="Noto Sans SC, sans-serif">六块雕版拼合 · 钟楼登高三角测绘推演斜俯全城</text>
    </svg>`,
  },
  {
    year: "1502–1506 · TUSCANY & IMOLA",
    title: "达·芬奇的两张地图：斜俯鸟瞰与垂直顶视的分水岭",
    latin: "Map of the Valdichiana (RCIN 912278) & Plan of Imola (RCIN 912284)",
    body: "几乎在同一时期，达·芬奇画下两张截然不同的地图：表现托斯卡纳山谷水系的《瓦尔迪基亚纳地图》采用高斜俯鸟瞰，把丘陵起伏与河道走向一并画活；而为伊莫拉城绘制的军用测绘则彻底推向 90° 垂直顶视，清楚划开了 077 鸟瞰与 079 顶视的边界。",
    source: "藏品核实：英国皇家收藏信托（Royal Collection Trust, Windsor Castle）",
    svg: `<svg viewBox="0 0 360 220" role="img" aria-label="达芬奇斜俯山谷图与垂直平面图对照示意">
      <rect width="360" height="220" fill="#FAF6EE"/>
      <rect x="16" y="34" width="154" height="148" fill="#F4EDDF" stroke="#7A7567"/>
      <path d="M 28 148 Q 72 95 106 112 T 160 66" fill="none" stroke="#676A3E" stroke-width="8" opacity="0.35"/>
      <path d="M 32 90 Q 62 66 92 84 Q 124 58 158 78" fill="none" stroke="#484C29" stroke-width="1.6"/>
      <circle cx="96" cy="112" r="7" fill="#DC6F1B"/>
      <text x="24" y="52" fill="#484C29" font-size="10.5" font-family="JetBrains Mono, monospace">OBLIQUE · VALDICHIANA</text>
      <text x="24" y="172" fill="#494A3E" font-size="11" font-family="Noto Sans SC, sans-serif">斜俯鸟瞰：兼顾山谷起伏</text>
      <rect x="190" y="34" width="154" height="148" fill="#F4EDDF" stroke="#7A7567"/>
      <circle cx="267" cy="108" r="46" fill="none" stroke="#676A3E" stroke-width="1.2" stroke-dasharray="3 3"/>
      <line x1="221" y1="108" x2="313" y2="108" stroke="#7A7567" stroke-width="1"/><line x1="267" y1="62" x2="267" y2="154" stroke="#7A7567" stroke-width="1"/>
      <polygon points="244,86 290,82 298,128 242,132" fill="#78784F" opacity="0.7" stroke="#FAF6EE" stroke-width="1.4"/>
      <circle cx="267" cy="108" r="5" fill="#DC6F1B"/>
      <text x="198" y="52" fill="#484C29" font-size="10.5" font-family="JetBrains Mono, monospace">90° NADIR · IMOLA</text>
      <text x="198" y="172" fill="#494A3E" font-size="11" font-family="Noto Sans SC, sans-serif">垂直顶视：纯二维比例测绘</text>
    </svg>`,
  },
  {
    year: "1860.10.13 · BOSTON",
    title: "詹姆斯·华莱士·布莱克《鹰与野雁眼中的波士顿》",
    latin: "Boston, as the Eagle and the Wild Goose See It — J. W. Black",
    body: "1860 年 10 月 13 日，摄影师布莱克乘坐气球飞行员塞缪尔·金驾驶的系留热气球「空中女王号」，在波士顿上空约 1200 英尺处用湿版玻璃底片拍下现存最早的清晰城市航拍蛋白银盐照片。人类第一次用镜头而非画笔验证了鸟瞰视角。",
    source: "藏品核实：大都会艺术博物馆（The Metropolitan Museum of Art, Object 283189）",
    svg: `<svg viewBox="0 0 360 220" role="img" aria-label="1860年热气球1200英尺航拍波士顿示意">
      <rect width="360" height="220" fill="#FAF6EE"/>
      <ellipse cx="92" cy="54" rx="22" ry="28" fill="#676A3E" stroke="#141610" stroke-width="1.2"/>
      <line x1="84" y1="81" x2="88" y2="94" stroke="#141610"/><line x1="100" y1="81" x2="96" y2="94" stroke="#141610"/>
      <rect x="85" y="94" width="14" height="9" fill="#B8530A"/>
      <polygon points="92,103 200,192 332,126" fill="rgba(220,111,27,0.14)" stroke="#DC6F1B" stroke-width="1.4" stroke-dasharray="4 3"/>
      <g fill="#78784F" stroke="#FAF6EE" stroke-width="1">
        <polygon points="184,162 238,136 270,152 216,178"/><polygon points="244,132 292,110 322,124 274,146"/>
        <polygon points="222,182 276,156 308,172 254,198"/>
      </g>
      <text x="140" y="34" fill="#484C29" font-size="11" font-family="JetBrains Mono, monospace">ALT ≈ 1,200 FT · OCT 13, 1860</text>
      <text x="20" y="206" fill="#494A3E" font-size="11" font-family="Noto Sans SC, sans-serif">系留热气球斜向俯拍 · 街区脉络首次进入真实影像</text>
    </svg>`,
  },
  {
    year: "1847–1929 · NORTH AMERICA",
    title: "北美城市全景鸟瞰石印热潮",
    latin: "Panoramic Maps Collection — Library of Congress",
    body: "19 世纪中叶至 20 世纪初，以阿尔伯特·鲁格（Albert Ruger）、撒迪厄斯·福勒（Thaddeus M. Fowler）为代表的测绘画师走遍北美城镇，绘制了上千幅高斜俯石印鸟瞰图。它们并不死守单一数学比例，而是巧妙微调斜角，让街道网、铁路、工厂与地标建筑同时清晰可认。",
    source: "馆藏核实：美国国会图书馆地理与地图部（Library of Congress, Panoramic Maps）",
    svg: `<svg viewBox="0 0 360 220" role="img" aria-label="19世纪北美石印鸟瞰城图透视网格示意">
      <rect width="360" height="220" fill="#FAF6EE"/>
      <g stroke="#B8B09E" stroke-width="1">
        <line x1="30" y1="184" x2="178" y2="56"/><line x1="115" y1="184" x2="180" y2="56"/>
        <line x1="205" y1="184" x2="182" y2="56"/><line x1="330" y1="184" x2="184" y2="56"/>
        <line x1="78" y1="142" x2="282" y2="142"/><line x1="112" y1="112" x2="248" y2="112"/><line x1="142" y1="86" x2="218" y2="86"/>
      </g>
      <rect x="138" y="114" width="32" height="22" fill="#78784F" stroke="#FAF6EE" stroke-width="1.2"/>
      <rect x="188" y="116" width="38" height="20" fill="#676A3E" stroke="#FAF6EE" stroke-width="1.2"/>
      <circle cx="180" cy="142" r="9" fill="#DC6F1B"/>
      <text x="20" y="28" fill="#484C29" font-size="11" font-family="JetBrains Mono, monospace">1847–1929 · LITHOGRAPHIC AERO VIEWS</text>
      <text x="20" y="206" fill="#494A3E" font-size="11" font-family="Noto Sans SC, sans-serif">透视街网 + 突出地标 · 让城市格局成为人人可读的视觉名片</text>
    </svg>`,
  },
  {
    year: "1960 · MIT PRESS",
    title: "凯文·林奇《城市意象》与现代空间阅读模型",
    latin: "The Image of the City — Kevin Lynch (1960)",
    body: "建筑与城市理论家凯文·林奇在波士顿、泽西城与洛杉矶进行了五年实证研究，1960 年由麻省理工学院出版社出版《城市意象》，提出大脑依靠「路径、边界、区域、节点、地标」五种元素来记忆空间——这正是今天平面、交互与信息设计里鸟瞰构图组织全局的底层骨架。",
    source: "出版核实：The MIT Press, Cambridge, 1960",
    svg: `<svg viewBox="0 0 360 220" role="img" aria-label="凯文林奇城市意象五要素图解">
      <rect width="360" height="220" fill="#FAF6EE"/>
      <rect x="34" y="46" width="110" height="72" fill="rgba(103,106,62,0.22)" stroke="#676A3E" stroke-dasharray="4 3"/>
      <rect x="206" y="112" width="116" height="68" fill="rgba(103,106,62,0.22)" stroke="#676A3E" stroke-dasharray="4 3"/>
      <path d="M 28 164 Q 140 148 180 108 T 334 54" fill="none" stroke="#DC6F1B" stroke-width="3" stroke-dasharray="7 5"/>
      <circle cx="180" cy="108" r="14" fill="#DC6F1B" stroke="#FAF6EE" stroke-width="2"/>
      <polygon points="274,64 286,88 262,88" fill="#141610"/>
      <text x="44" y="66" fill="#484C29" font-size="11" font-family="Noto Sans SC, sans-serif">区域 District</text>
      <text x="198" y="104" fill="#B34D08" font-size="11" font-family="Noto Sans SC, sans-serif">节点 Node</text>
      <text x="292" y="84" fill="#141610" font-size="11" font-family="Noto Sans SC, sans-serif">地标</text>
      <text x="20" y="206" fill="#494A3E" font-size="11" font-family="Noto Sans SC, sans-serif">路径 · 边界 · 区域 · 节点 · 地标 → 构成清晰空间心智图</text>
    </svg>`,
  },
];

function showEra(idx) {
  const e = ERAS[idx];
  document.getElementById("tl-svg-host").innerHTML = e.svg;
  document.getElementById("tl-year").textContent = e.year;
  document.getElementById("tl-title").textContent = e.title;
  document.getElementById("tl-latin").textContent = e.latin;
  document.getElementById("tl-body").textContent = e.body;
  document.getElementById("tl-source").textContent = e.source;
  document.querySelectorAll(".tl-tab").forEach((b, i) => {
    const active = i === idx;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
}
document.querySelectorAll(".tl-tab").forEach((b) => {
  b.addEventListener("click", () => showEra(Number(b.dataset.era)));
});
showEra(0);

// ==================== 6. 05 节：三组真实需求反例对照板 ====================
const BRIEFS = [
  {
    leftTitle: "采用鸟瞰构图（斜俯 52°）",
    leftTag: "切题",
    leftOk: true,
    leftText: "四座展馆、步行轴线与中央广场全部摊开，访客 3 秒就能找到入口与动线。",
    leftSvg: `<svg viewBox="0 0 320 150"><rect width="320" height="150" fill="#FAF6EE"/>
      <rect x="136" y="10" width="46" height="130" fill="#EFE7D8"/><rect x="18" y="60" width="284" height="30" fill="#EFE7D8"/>
      <rect x="40" y="18" width="76" height="36" fill="#78784F" stroke="#FAF6EE" stroke-width="1.5"/>
      <rect x="204" y="18" width="78" height="36" fill="#6D6F46" stroke="#FAF6EE" stroke-width="1.5"/>
      <rect x="44" y="96" width="72" height="38" fill="#78784F" stroke="#FAF6EE" stroke-width="1.5"/>
      <rect x="204" y="96" width="76" height="38" fill="#676A3E" stroke="#FAF6EE" stroke-width="1.5"/>
      <circle cx="159" cy="75" r="18" fill="#DC6F1B" stroke="#FAF6EE" stroke-width="2"/>
      <path d="M 159 16 V 52 M 159 98 V 138 M 28 75 H 136 M 182 75 H 294" stroke="#DC6F1B" stroke-width="2" stroke-dasharray="5 4"/>
    </svg>`,
    rightTitle: "改用地面平视（0°）",
    rightTag: "吃亏",
    rightOk: false,
    rightText: "只看见最前方入口门楼的一堵墙，后面三座展馆和步行环线完全被挡在视线之外。",
    rightSvg: `<svg viewBox="0 0 320 150"><rect width="320" height="150" fill="#E8E4D6"/>
      <rect x="0" y="114" width="320" height="36" fill="#DDD4C2"/>
      <rect x="44" y="34" width="232" height="80" fill="#78784F" stroke="#FAF6EE" stroke-width="1.5"/>
      <rect x="134" y="72" width="52" height="42" fill="#494A3E"/>
      <text x="160" y="60" text-anchor="middle" fill="#FAF6EE" font-size="12" font-family="Noto Sans SC, sans-serif">前景墙面挡住后方全部园区</text>
    </svg>`,
  },
  {
    leftTitle: "强行用鸟瞰构图（斜俯 60°）",
    leftTag: "疏离",
    leftOk: false,
    leftText: "只能看见头顶与台面圆环，咖啡师专注的神情、热气腾起的层次与手腕动作全被压扁。",
    leftSvg: `<svg viewBox="0 0 320 150"><rect width="320" height="150" fill="#FAF6EE"/>
      <rect x="64" y="28" width="192" height="94" fill="#E5DEC9" stroke="#7A7567"/>
      <circle cx="122" cy="74" r="14" fill="#3D3E34"/>
      <circle cx="176" cy="72" r="11" fill="#78784F"/><circle cx="204" cy="84" r="8" fill="#DC6F1B"/>
      <text x="160" y="138" text-anchor="middle" fill="#494A3E" font-size="11" font-family="Noto Sans SC, sans-serif">人物缩成头顶圆点，失去情感交流</text>
    </svg>`,
    rightTitle: "切回 080 平视近景（0°）",
    rightTag: "切题",
    rightOk: true,
    rightText: "与咖啡师视线齐平，侧影轮廓、细水流与上升热气处在同一情感平面，故事感立刻成立。",
    rightSvg: `<svg viewBox="0 0 320 150"><rect width="320" height="150" fill="#F4EDDF"/>
      <rect x="0" y="112" width="320" height="38" fill="#CFC7B3"/>
      <path d="M 96 112 C 98 84 114 74 134 74 C 154 74 166 84 168 112 Z" fill="#494A3E"/>
      <circle cx="132" cy="54" r="16" fill="#494A3E"/>
      <rect x="192" y="88" width="32" height="24" fill="#78784F" stroke="#FAF6EE"/>
      <path d="M 176 74 Q 196 76 206 88" fill="none" stroke="#DC6F1B" stroke-width="3"/>
      <path d="M 206 82 Q 202 68 210 56" fill="none" stroke="#676A3E" stroke-width="1.6" stroke-dasharray="3 3"/>
    </svg>`,
  },
  {
    leftTitle: "强行用鸟瞰构图（高空俯视）",
    leftTag: "泄气",
    leftOk: false,
    leftText: "从上方俯看把百米尖塔压缩成模型积木，神圣感与敬畏感荡然无存，只剩屋顶几何形状。",
    leftSvg: `<svg viewBox="0 0 320 150"><rect width="320" height="150" fill="#FAF6EE"/>
      <polygon points="100,48 220,48 232,102 88,102" fill="#78784F" stroke="#FAF6EE" stroke-width="1.5"/>
      <polygon points="140,34 180,34 188,116 132,116" fill="#676A3E" stroke="#FAF6EE" stroke-width="1.5"/>
      <circle cx="160" cy="75" r="10" fill="#DC6F1B"/>
      <text x="160" y="138" text-anchor="middle" fill="#494A3E" font-size="11" font-family="Noto Sans SC, sans-serif">高大尖塔沦为平面十字屋顶</text>
    </svg>`,
    rightTitle: "反用 078 虫视仰拍（-25°）",
    rightTag: "切题",
    rightOk: true,
    rightText: "贴地向上仰视，垂线向天顶剧烈汇聚，尖塔刺破天际，庄严与尺度感瞬间充满画面。",
    rightSvg: `<svg viewBox="0 0 320 150"><rect width="320" height="150" fill="#E6E4DA"/>
      <polygon points="74,146 138,24 182,24 246,146" fill="#676A3E" stroke="#FAF6EE" stroke-width="1.5"/>
      <polygon points="146,24 160,6 174,24" fill="#DC6F1B"/>
      <line x1="112" y1="146" x2="152" y2="24" stroke="#FAF6EE" stroke-width="1.2"/>
      <line x1="208" y1="146" x2="168" y2="24" stroke="#FAF6EE" stroke-width="1.2"/>
      <rect x="148" y="104" width="24" height="42" fill="#141610"/>
    </svg>`,
  },
];

function showBrief(idx) {
  const b = BRIEFS[idx];
  document.getElementById("cmp-left-title").textContent = b.leftTitle;
  const lt = document.getElementById("cmp-left-tag");
  lt.textContent = b.leftTag;
  lt.className = `pane-tag ${b.leftOk ? "is-ok" : "is-dim"}`;
  document.getElementById("cmp-left-svg").innerHTML = b.leftSvg;
  document.getElementById("cmp-left-text").textContent = b.leftText;

  document.getElementById("cmp-right-title").textContent = b.rightTitle;
  const rt = document.getElementById("cmp-right-tag");
  rt.textContent = b.rightTag;
  rt.className = `pane-tag ${b.rightOk ? "is-ok" : "is-dim"}`;
  document.getElementById("cmp-right-svg").innerHTML = b.rightSvg;
  document.getElementById("cmp-right-text").textContent = b.rightText;

  document.querySelectorAll(".brief-btn").forEach((btn, i) => btn.classList.toggle("is-active", i === idx));
}
document.querySelectorAll(".brief-btn").forEach((btn) => {
  btn.addEventListener("click", () => showBrief(Number(btn.dataset.brief)));
});
showBrief(0);

// ==================== 7. 06 节：单变量实战四选一测验 ====================
const QUIZ_SETS = [
  {
    stem: "题目 1：为文化园区绘制主视觉鸟瞰图，要求同时看清「四向步道汇聚中央广场」与「南北展馆的高低体量差」。以下四张图建筑排布、光照（36° 斜阳）与方位完全一致，只差机位俯角这一个变量，哪一张最成立？",
    correct: 1,
    options: [
      { label: "方案 A · 俯角 14°", state: { pitch: 14, sunElev: 36, azimuth: -16 }, why: "俯角 14° 贴近地面平视，南入口门楼直接挡住中央橙色广场与后排路网，无法交代整体格局。" },
      { label: "方案 B · 俯角 52°", state: { pitch: 52, sunElev: 36, azimuth: -16 }, why: "回答正确！52° 高斜俯既让中央广场与四向橙色步道 100% 摊开，又保留了建筑立面与斜影，平面秩序与体量高低一眼双收。" },
      { label: "方案 C · 俯角 90°", state: { pitch: 90, sunElev: 36, azimuth: -16 }, why: "俯角 90° 已跨入 079 顶视构图：建筑立面占比压到个位数，所有展馆退化成平面屋顶色块，立体体量感明显削弱。" },
      { label: "方案 D · 俯角 24°", state: { pitch: 24, sunElev: 36, azimuth: -16 }, why: "24° 仍偏低，前景楼檐切损广场近沿、后排横轴路被压成窄缝，不如 52° 通透利落。" },
    ],
  },
  {
    stem: "题目 2：机位固定在 56° 高斜俯，街区格局与中央广场完全一致，只差太阳高度角这一个变量。哪一张最能在高空清晰区分高低建筑，同时又不闷堵街道流线？",
    correct: 2,
    options: [
      { label: "方案 A · 太阳 86°", state: { pitch: 56, sunElev: 86, azimuth: -16 }, why: "86° 近正午顶光让阴影几乎归零（约 0.07× 楼高），东区高塔与低矮连廊在高空显得一样扁平。" },
      { label: "方案 B · 太阳 13°", state: { pitch: 56, sunElev: 13, azimuth: -16 }, why: "13° 极低残阳拉出超过 4 倍楼高的黑影，整片街道路网和斑马线被阴影交叉覆盖，层次发闷。" },
      { label: "方案 C · 太阳 36°", state: { pitch: 56, sunElev: 36, azimuth: -16 }, why: "回答正确！36° 午后斜阳投出约 1.38× 楼高的清爽斜影，立刻刻画出每栋楼的高低体量，同时保持主干道与橙色流线明亮通透。" },
      { label: "方案 D · 太阳 72°", state: { pitch: 56, sunElev: 72, azimuth: -16 }, why: "72° 光线仍偏高，投影不足楼高三分之一，高楼与裙房的体量高差仍不够鲜明。" },
    ],
  },
];

let activeQuiz = 0;
function renderQuiz() {
  const q = QUIZ_SETS[activeQuiz];
  document.getElementById("quiz-stem").textContent = q.stem;
  const fb = document.getElementById("quiz-feedback");
  fb.className = "quiz-feedback";
  fb.textContent = "点选上面任意一张方案，对照几何原理查看解析。";

  const cards = document.querySelectorAll(".quiz-card");
  cards.forEach((card, i) => {
    card.classList.remove("is-picked-ok", "is-picked-bad");
    card.querySelector(".quiz-label").textContent = q.options[i].label;
    const c = card.querySelector("canvas");
    drawQuizOption(c, q.options[i].state);
  });

  document.querySelectorAll(".quiz-tab").forEach((b, i) => b.classList.toggle("is-active", i === activeQuiz));
}

document.querySelectorAll(".quiz-tab").forEach((b) => {
  b.addEventListener("click", () => { activeQuiz = Number(b.dataset.q); renderQuiz(); });
});

document.querySelectorAll(".quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    const idx = Number(card.dataset.opt);
    const q = QUIZ_SETS[activeQuiz];
    const ok = idx === q.correct;
    document.querySelectorAll(".quiz-card").forEach((c, i) => {
      c.classList.remove("is-picked-ok", "is-picked-bad");
      if (i === idx) c.classList.add(ok ? "is-picked-ok" : "is-picked-bad");
      else if (i === q.correct) c.classList.add("is-picked-ok");
    });
    const fb = document.getElementById("quiz-feedback");
    fb.className = `quiz-feedback ${ok ? "is-ok" : "is-bad"}`;
    fb.textContent = `${q.options[idx].label}：${q.options[idx].why}${ok ? "" : `（最成立的是 ${q.options[q.correct].label}：${q.options[q.correct].why}）`}`;
  });
});

// ==================== 8. 07 节：原版海报缩放/拖拽灯箱 ====================
const posterImg = document.getElementById("poster");
const lb = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbStage = document.getElementById("lb-stage");
let lbScale = 1, lbX = 0, lbY = 0, lbDrag = null;

function applyLb() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  document.getElementById("lb-reset").textContent = `${Math.round(lbScale * 100)}%`;
}
function openLb() {
  lbImg.src = posterImg.src;
  lbScale = 1; lbX = 0; lbY = 0;
  applyLb();
  lb.hidden = false;
  document.getElementById("lb-close").focus();
}
function closeLb() {
  lb.hidden = true;
  document.getElementById("poster-trigger").focus();
}

document.getElementById("poster-trigger").addEventListener("click", openLb);
document.getElementById("lb-close").addEventListener("click", closeLb);
document.getElementById("lb-in").addEventListener("click", () => { lbScale = clamp(lbScale + 0.35, 1, 3.5); applyLb(); });
document.getElementById("lb-out").addEventListener("click", () => { lbScale = clamp(lbScale - 0.35, 1, 3.5); if (lbScale === 1) { lbX = 0; lbY = 0; } applyLb(); });
document.getElementById("lb-reset").addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLb(); });
lb.addEventListener("click", (e) => { if (e.target === lbStage) closeLb(); });
window.addEventListener("keydown", (e) => { if (!lb.hidden && e.key === "Escape") closeLb(); });

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.5);
  if (lbScale === 1) { lbX = 0; lbY = 0; }
  applyLb();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (lbScale <= 1) return;
  lbDrag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, ox: lbX, oy: lbY };
  lbStage.setPointerCapture?.(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag || e.pointerId !== lbDrag.id) return;
  lbX = lbDrag.ox + (e.clientX - lbDrag.x0);
  lbY = lbDrag.oy + (e.clientY - lbDrag.y0);
  applyLb();
});
lbStage.addEventListener("pointerup", () => { lbDrag = null; });
lbStage.addEventListener("pointercancel", () => { lbDrag = null; });

// ==================== 初始化与自适应重绘 ====================
function initAllCanvases() {
  heroNeedsResize = true;
  sec1Dirty = true;
  heroLoop.draw();
  renderSec1();
  renderSec2();
  renderSec3();
  renderQuiz();
}
initAllCanvases();

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(initAllCanvases, 100);
});

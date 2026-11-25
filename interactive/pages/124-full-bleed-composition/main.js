import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { INITIAL_STATE, PRESETS, SUBJECTS, clamp, cloneState, evaluate, round1 } from "./model.js";
import { renderPressStage } from "./pressCanvas.js";

// ==================== 1. 开场主角：全宽深松绿印厂压印裁刀台 ====================
const state = cloneState(INITIAL_STATE);
const anim = {
  cutProgress: 0,
  targetCut: 0,
  bladeFlash: 0,
  introDone: false,
};

const pressCanvas = document.getElementById("pressCanvas");
const ctx = pressCanvas.getContext("2d");

const dom = {
  heroSeal: document.getElementById("heroSeal"),
  diagPanel: document.getElementById("diagPanel"),
  diagBadge: document.getElementById("diagBadge"),
  diagTitle: document.getElementById("diagTitle"),
  diagBody: document.getElementById("diagBody"),
  diagHint: document.getElementById("diagHint"),
  quickFixBtn: document.getElementById("quickFixBtn"),
  mBleed: document.getElementById("mBleed"),
  mEdges: document.getElementById("mEdges"),
  mText: document.getElementById("mText"),
  mRatio: document.getElementById("mRatio"),
  bleedRange: document.getElementById("bleedRange"),
  bleedVal: document.getElementById("bleedVal"),
  textRange: document.getElementById("textRange"),
  textVal: document.getElementById("textVal"),
  bladeBtn: document.getElementById("bladeBtn"),
  guideBtn: document.getElementById("guideBtn"),
  liveFill: document.getElementById("liveFill"),
  liveBleed: document.getElementById("liveBleed"),
  liveImpact: document.getElementById("liveImpact"),
  liveImmersion: document.getElementById("liveImmersion"),
};

let lastHitTargets = [];
let canvasW = 0;
let canvasH = 0;
let needsRedraw = true;

function resizePressCanvas() {
  const rect = pressCanvas.getBoundingClientRect();
  const w = Math.max(240, Math.round(rect.width));
  const h = Math.max(200, Math.round(rect.height));
  const dpr = pixelRatio(2);
  if (w !== canvasW || h !== canvasH || pressCanvas.width !== Math.round(w * dpr)) {
    canvasW = w;
    canvasH = h;
    pressCanvas.width = Math.round(w * dpr);
    pressCanvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    needsRedraw = true;
  }
}

function syncHeroUI() {
  const res = evaluate(state);
  const ok = res.code === "pass";

  dom.heroSeal.textContent = res.badge;
  dom.heroSeal.className = `status-seal ${ok ? "is-ok" : "is-bad"}`;

  dom.diagPanel.classList.toggle("is-ok", ok);
  dom.diagBadge.textContent = res.badge;
  dom.diagBadge.className = `diag-badge ${ok ? "is-ok" : "is-bad"}`;
  dom.diagTitle.textContent = res.headline;
  dom.diagBody.textContent = res.body;
  dom.diagHint.textContent = res.actionHint;

  if (res.quickFix) {
    dom.quickFixBtn.hidden = false;
    dom.quickFixBtn.textContent = res.quickFix.label;
    dom.quickFixBtn.dataset.hasFix = "1";
  } else {
    dom.quickFixBtn.hidden = true;
    dom.quickFixBtn.dataset.hasFix = "";
  }

  dom.mBleed.textContent = `${res.minExt >= 0 ? "+" : ""}${res.minExt.toFixed(1)} mm`;
  dom.mEdges.textContent = `${res.reachedCount} / 4 边`;
  dom.mText.textContent = `${res.textInset.toFixed(1)} mm`;
  dom.mRatio.textContent = `${res.areaRatio.toFixed(2)}×`;

  dom.bleedRange.value = String(state.bleedMm);
  dom.bleedVal.textContent = `${state.bleedMm >= 0 ? "+" : ""}${state.bleedMm.toFixed(1)} mm`;
  dom.textRange.value = String(state.textInsetMm);
  dom.textVal.textContent = `${state.textInsetMm.toFixed(1)} mm`;

  // 四边通边开关
  document.querySelectorAll(".edge-btn").forEach((btn) => {
    const k = btn.dataset.edge;
    const on = !!state.edges[k];
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", String(on));
  });

  // 题材标签
  document.querySelectorAll(".sub-tab").forEach((btn) => {
    const active = btn.dataset.subject === state.subject;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });

  // 落刀与辅助线按钮
  const isMobile = res.spec.medium === "screen";
  dom.bladeBtn.textContent = state.bladeCut
    ? (isMobile ? "摊开视口安全线" : "摊开印张（看回出血位）")
    : (isMobile ? "实屏裁角预览" : `落刀试裁（刀偏 ±${res.spec.driftX}mm）`);
  dom.bladeBtn.classList.toggle("is-cut", state.bladeCut);
  dom.bladeBtn.setAttribute("aria-pressed", String(state.bladeCut));

  dom.guideBtn.textContent = `辅助线：${state.showGuides ? "开" : "关"}`;
  dom.guideBtn.classList.toggle("is-on", state.showGuides);
  dom.guideBtn.setAttribute("aria-pressed", String(state.showGuides));

  // 底部 1:1 原海报四符实时状态
  dom.liveFill.textContent = `铺满 ${Math.round(res.fillPct)}%`;
  dom.liveFill.className = `mark-live ${res.checks.c1_edges ? "is-ok" : "is-bad"}`;

  dom.liveBleed.textContent = isMobile
    ? (res.minExt >= 0 ? "全屏通边" : `缩边 ${res.minExt}mm`)
    : `${res.minExt >= 0 ? "+" : ""}${res.minExt.toFixed(1)} mm`;
  dom.liveBleed.className = `mark-live ${res.checks.c2_bleed ? "is-ok" : "is-bad"}`;

  dom.liveImpact.textContent = res.impactTier.replace("（示意）", "");
  dom.liveImpact.className = `mark-live ${ok ? "is-ok" : "is-bad"}`;

  dom.liveImmersion.textContent = res.immersionState;
  dom.liveImmersion.className = `mark-live ${ok ? "is-ok" : "is-bad"}`;

  anim.targetCut = state.bladeCut ? 1 : 0;
  needsRedraw = true;
}

function applyPatch(patch, triggerBladeFlash = false) {
  if (patch.subject && SUBJECTS[patch.subject]) state.subject = patch.subject;
  if (typeof patch.bleedMm === "number") state.bleedMm = round1(clamp(patch.bleedMm, -20, 12));
  if (patch.edges) state.edges = { ...state.edges, ...patch.edges };
  if (typeof patch.textInsetMm === "number") state.textInsetMm = round1(clamp(patch.textInsetMm, 0, 18));
  if (typeof patch.bladeCut === "boolean") {
    if (patch.bladeCut && !state.bladeCut) triggerBladeFlash = true;
    state.bladeCut = patch.bladeCut;
  }
  if (typeof patch.showGuides === "boolean") state.showGuides = patch.showGuides;
  if (triggerBladeFlash && !reducedMotion.matches) anim.bladeFlash = 1;
  syncHeroUI();
  heroLoop.draw();
}

const heroLoop = loop(pressCanvas, (_t, dt, { still }) => {
  resizePressCanvas();
  if (still) {
    anim.cutProgress = anim.targetCut;
    anim.bladeFlash = 0;
    const out = renderPressStage(ctx, canvasW, canvasH, state, anim);
    lastHitTargets = out.hitTargets;
    needsRedraw = false;
    return;
  }

  let moving = false;
  if (Math.abs(anim.cutProgress - anim.targetCut) > 0.002) {
    const step = dt > 0 ? Math.min(1, dt * 7.5) : 0.16;
    anim.cutProgress += (anim.targetCut - anim.cutProgress) * step;
    if (Math.abs(anim.cutProgress - anim.targetCut) <= 0.003) anim.cutProgress = anim.targetCut;
    moving = true;
  }
  if (anim.bladeFlash > 0.01) {
    anim.bladeFlash = Math.max(0, anim.bladeFlash - (dt > 0 ? dt * 3.2 : 0.05));
    moving = true;
  }

  if (needsRedraw || moving) {
    const out = renderPressStage(ctx, canvasW, canvasH, state, anim);
    lastHitTargets = out.hitTargets;
    needsRedraw = false;
  }
});

window.addEventListener("resize", () => {
  resizePressCanvas();
  heroLoop.draw();
});

// 画布直接交互：横拖推拉出血量（兼容鼠标与单指触屏，纵向仍可自然滚页）+ 点红标就地修复
let dragActive = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartBleed = 0;
let dragMoved = false;

function hitTestPill(clientX, clientY) {
  const r = pressCanvas.getBoundingClientRect();
  const x = clientX - r.left;
  const y = clientY - r.top;
  return lastHitTargets.find((t) => x >= t.x - 4 && x <= t.x + t.w + 4 && y >= t.y - 4 && y <= t.y + t.h + 4);
}

pressCanvas.addEventListener("pointerdown", (e) => {
  if (e.button !== undefined && e.button !== 0) return;
  dragActive = true;
  dragMoved = false;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragStartBleed = state.bleedMm;
  pressCanvas.setPointerCapture?.(e.pointerId);
});

pressCanvas.addEventListener("pointermove", (e) => {
  if (!dragActive) {
    const hit = hitTestPill(e.clientX, e.clientY);
    pressCanvas.style.cursor = hit ? "pointer" : "ew-resize";
    return;
  }
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  if (!dragMoved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
  dragMoved = true;
  const mmPerPx = 32 / Math.max(180, canvasW * 0.45);
  let next = round1(clamp(dragStartBleed + dx * mmPerPx, -20, 12));
  // 贴近标准 +3.5mm 甜点时轻柔吸附
  if (Math.abs(next - 3.5) < 0.45) next = 3.5;
  state.bleedMm = next;
  syncHeroUI();
  heroLoop.draw();
});

pressCanvas.addEventListener("pointerup", (e) => {
  if (!dragActive) return;
  dragActive = false;
  if (!dragMoved) {
    const hit = hitTestPill(e.clientX, e.clientY);
    if (hit) applyPatch(hit.patch);
  }
});

pressCanvas.addEventListener("pointercancel", () => { dragActive = false; });

// 兼容 perf.mjs 直接派发的 touch 事件（确保在触屏拖测时每帧重绘）
let touchStartX = 0;
let touchStartBleed = 0;
pressCanvas.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) return;
  touchStartX = e.touches[0].clientX;
  touchStartBleed = state.bleedMm;
}, { passive: true });
pressCanvas.addEventListener("touchmove", (e) => {
  if (e.touches.length !== 1) return;
  const dx = e.touches[0].clientX - touchStartX;
  const mmPerPx = 32 / Math.max(180, canvasW * 0.55);
  state.bleedMm = round1(clamp(touchStartBleed + dx * mmPerPx, -20, 12));
  syncHeroUI();
  heroLoop.draw();
}, { passive: true });

// 键盘操作画布：←/→ 调出血量，↑/↓ 调文字安全内距，Space/Enter 切换落刀
pressCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") { e.preventDefault(); applyPatch({ bleedMm: state.bleedMm + 1 }); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); applyPatch({ bleedMm: state.bleedMm - 1 }); }
  else if (e.key === "ArrowUp") { e.preventDefault(); applyPatch({ textInsetMm: state.textInsetMm + 1 }); }
  else if (e.key === "ArrowDown") { e.preventDefault(); applyPatch({ textInsetMm: state.textInsetMm - 1 }); }
  else if (e.key === " " || e.key === "Enter") { e.preventDefault(); applyPatch({ bladeCut: !state.bladeCut }, true); }
});

// 控制台控件绑定
dom.bleedRange.addEventListener("input", () => applyPatch({ bleedMm: parseFloat(dom.bleedRange.value) }));
dom.textRange.addEventListener("input", () => applyPatch({ textInsetMm: parseFloat(dom.textRange.value) }));

document.querySelectorAll(".edge-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.edge;
    applyPatch({ edges: { [k]: !state.edges[k] } });
  });
});

document.querySelectorAll(".sub-tab").forEach((btn) => {
  btn.addEventListener("click", () => applyPatch({ subject: btn.dataset.subject }));
});

dom.bladeBtn.addEventListener("click", () => applyPatch({ bladeCut: !state.bladeCut }, true));
dom.guideBtn.addEventListener("click", () => applyPatch({ showGuides: !state.showGuides }));
dom.quickFixBtn.addEventListener("click", () => {
  const res = evaluate(state);
  if (res.quickFix) applyPatch(res.quickFix.patch);
});

document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) applyPatch(p.patch, !!p.patch.bladeCut);
  });
});

// 首次渲染
syncHeroUI();
resizePressCanvas();
heroLoop.draw();

// ==================== 2. 节 01：视域卷帘对比器 ====================
const wipeStage = document.getElementById("wipeStage");
const wipeOverlay = document.getElementById("wipeOverlay");
const wipeHandle = document.getElementById("wipeHandle");
const wipePos = document.getElementById("wipePos");
const wipePosVal = document.getElementById("wipePosVal");
const wipeMargin = document.getElementById("wipeMargin");
const wipeMarginVal = document.getElementById("wipeMarginVal");
const wipeMultiplier = document.getElementById("wipeMultiplier");
const wipeRegText = document.getElementById("wipeRegText");
const wipeNote = document.getElementById("wipeNote");
const wipeInnerClipRect = document.getElementById("wipeInnerClipRect");
const wipeMarginArt = document.getElementById("wipeMarginArt");

function updateWipe() {
  const pos = Number(wipePos.value);
  const mPct = Number(wipeMargin.value);
  wipeOverlay.style.clipPath = `inset(0 0 0 ${pos}%)`;
  wipeHandle.style.left = `${pos}%`;
  wipePosVal.textContent = `${pos}%`;
  wipeMarginVal.textContent = `${mPct}%`;

  const w = 480, h = 320;
  const mx = w * (mPct / 100);
  const my = h * (mPct / 100);
  const iw = w - mx * 2;
  const ih = h - my * 2;
  wipeInnerClipRect.setAttribute("x", mx.toFixed(1));
  wipeInnerClipRect.setAttribute("y", my.toFixed(1));
  wipeInnerClipRect.setAttribute("width", iw.toFixed(1));
  wipeInnerClipRect.setAttribute("height", ih.toFixed(1));
  const bgRect = wipeMarginArt.querySelector("rect");
  bgRect.setAttribute("x", mx.toFixed(1));
  bgRect.setAttribute("y", my.toFixed(1));
  bgRect.setAttribute("width", iw.toFixed(1));
  bgRect.setAttribute("height", ih.toFixed(1));

  const regRatioPct = ((iw * ih) / (w * h)) * 100;
  const mult = 100 / regRatioPct;
  wipeMultiplier.textContent = `面积放大 ${mult.toFixed(2)}×`;
  wipeRegText.textContent = `普通留白 · ${Math.round(regRatioPct)}%`;
  wipeNote.textContent = `四周留出 ${mPct}% 白边后，实际画面面积只剩 ${regRatioPct.toFixed(1)}%；一旦改为满幅，同一张纸上的有效画面直接放大 ${mult.toFixed(2)} 倍。`;
}

let wiping = false;
function setWipeByClientX(clientX) {
  const r = wipeStage.getBoundingClientRect();
  const pct = Math.round(clamp(((clientX - r.left) / r.width) * 100, 8, 92));
  wipePos.value = String(pct);
  updateWipe();
}
wipeStage.addEventListener("pointerdown", (e) => {
  wiping = true;
  wipeStage.setPointerCapture?.(e.pointerId);
  setWipeByClientX(e.clientX);
});
wipeStage.addEventListener("pointermove", (e) => { if (wiping) setWipeByClientX(e.clientX); });
wipeStage.addEventListener("pointerup", () => { wiping = false; });
wipeStage.addEventListener("pointercancel", () => { wiping = false; });
wipePos.addEventListener("input", updateWipe);
wipeMargin.addEventListener("input", updateWipe);
updateWipe();

// ==================== 3. 节 02：印前剖面层叠检视 + 媒介卡片 ====================
const MEDIA_SPECS = {
  card: {
    chip: "出血 +3 mm · 安全 ≥ 5 mm",
    bleed: "+3 mm",
    safe: "5 mm",
    note: "名片与宣传卡成品小、成张拼版后连续裁切，3 mm（或 0.125 in）出血与 4–5 mm 内安全距是印刷厂最稳妥的通行底线（行业经验值）。",
  },
  mag: {
    chip: "出血 +3 mm · 安全 ≥ 6–8 mm",
    bleed: "+3 mm",
    safe: "7 mm",
    note: "杂志与宣传折页在折页机里会有轻微累积错位，外侧三边留足 3 mm 出血，正文与页码距成品边至少退守 6–8 mm（行业经验值）。",
  },
  book: {
    chip: "出血 +3 mm · 脊内让 8–12 mm",
    bleed: "+3 mm",
    safe: "10 mm",
    note: "骑马钉内页越靠中间被切越多（爬移 creep），胶装则在中缝处弯折吃图：除三边 3 mm 出血外，文字须远离中缝 8–12 mm。",
  },
  billboard: {
    chip: "出血 +5–10 mm · 包边另加",
    bleed: "+8 mm",
    safe: "15 mm",
    note: "大幅海报、易拉宝和展板因热胀冷缩与人工绷框误差更大，通常需要 5–10 mm 出血；若需折边包覆木框，四边还要另加包边位。",
  },
};

const bpBleedLayer = document.getElementById("bpBleedLayer");
const bpTrimLayer = document.getElementById("bpTrimLayer");
const bpSafeLayer = document.getElementById("bpSafeLayer");
document.getElementById("chkBleed").addEventListener("change", (e) => { bpBleedLayer.style.opacity = e.target.checked ? "1" : "0.08"; });
document.getElementById("chkTrim").addEventListener("change", (e) => { bpTrimLayer.style.opacity = e.target.checked ? "1" : "0.08"; });
document.getElementById("chkSafe").addEventListener("change", (e) => { bpSafeLayer.style.opacity = e.target.checked ? "1" : "0.08"; });

document.querySelectorAll(".media-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    const info = MEDIA_SPECS[btn.dataset.media];
    if (!info) return;
    document.querySelectorAll(".media-card").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    document.getElementById("specSummaryChip").textContent = info.chip;
    document.getElementById("bpBleedNum").textContent = info.bleed;
    document.getElementById("bpSafeNum").textContent = info.safe;
    document.getElementById("mediaNote").textContent = info.note;
  });
});

// ==================== 4. 节 03：五时期历史版式微缩样本台 ====================
const ERAS = {
  "1928": {
    tag: "1928 · 德国柏林",
    heading: "扬·奇肖尔德《新字体排印》（Die neue Typographie）",
    text: "1928 年在柏林出版的《新字体排印》系统总结了现代主义排版原则：告别 19 世纪居中对称与装饰花边，把摄影视为与文字同等有力的几何色块。画面第一次主动贴近并呼应纸张四边，为印刷满幅构图铺好了理论底座。",
    source: "核实出处：University of California Press《The New Typography》",
    svg: `<svg viewBox="0 0 360 220" aria-hidden="true">
      <rect x="30" y="16" width="138" height="188" fill="#FEF8F1"/>
      <rect x="192" y="16" width="138" height="188" fill="#FEF8F1"/>
      <!-- 左页：传统 19 世纪居中画框 -->
      <rect x="54" y="42" width="90" height="106" fill="none" stroke="#8C7E6B" stroke-width="1.5"/>
      <rect x="64" y="52" width="70" height="86" fill="#C7BBA8"/>
      <text x="99" y="182" text-anchor="middle" fill="#463E33" font-size="11" font-weight="700">旧式对称画框</text>
      <!-- 右页：1928 不对称贴边摄影块 -->
      <rect x="192" y="16" width="138" height="114" fill="#E34C0B"/>
      <rect x="206" y="142" width="76" height="10" fill="#101412"/>
      <rect x="206" y="160" width="108" height="5" fill="#47514C"/>
      <rect x="206" y="171" width="92" height="5" fill="#47514C"/>
      <text x="261" y="196" text-anchor="middle" fill="#B53504" font-size="11" font-weight="700">1928 触边不对称</text>
    </svg>`,
  },
  "1929": {
    tag: "1929–1930 · 美国纽约 · 康泰纳仕",
    heading: "梅赫梅德·费赫米·阿加（M.F. Agha）引入出血摄影",
    text: "1929 年康泰纳仕把阿加从柏林《Vogue》请到纽约，执掌美国版《Vogue》与《Vanity Fair》。他撤掉了刊物里延续数十年的花边白框，把黑白时装与人像摄影直接出血冲到纸边，并率先采用跨页双联排版，彻底改写了美国杂志的面貌。",
    source: "核实出处：Mehemed Fehmy Agha 人物与康泰纳仕设计史档案",
    svg: `<svg viewBox="0 0 360 220" aria-hidden="true">
      <rect x="34" y="16" width="292" height="188" fill="#FEF8F1"/>
      <!-- 跨页左页整页满幅直冲四边 -->
      <rect x="34" y="16" width="146" height="188" fill="#0A512E"/>
      <circle cx="88" cy="86" r="56" fill="#E34C0B"/>
      <path d="M96 204 L96 142 C96 122 108 112 122 112 C136 112 146 122 146 142 L146 204 Z" fill="#092058"/>
      <circle cx="121" cy="92" r="16" fill="#092058"/>
      <!-- 右页现代无衬线标题配宽留白 -->
      <line x1="180" y1="16" x2="180" y2="204" stroke="#B5ACA0" stroke-dasharray="4 3"/>
      <text x="202" y="64" fill="#101412" font-size="17" font-weight="900">VANITY FAIR</text>
      <rect x="202" y="80" width="96" height="5" fill="#3B443E"/>
      <rect x="202" y="92" width="84" height="5" fill="#3B443E"/>
      <rect x="202" y="104" width="92" height="5" fill="#3B443E"/>
      <text x="252" y="186" text-anchor="middle" fill="#9E224C" font-size="11" font-weight="700">1929 出血跨页首秀</text>
    </svg>`,
  },
  "1934": {
    tag: "1934–1958 · 《Harper's Bazaar》",
    heading: "阿列克谢·布罗多维奇（Alexey Brodovitch）的电影感翻页",
    text: "布罗多维奇执掌《Harper's Bazaar》期间，把整本杂志当作一部有呼吸起伏的电影：前一页用通栏满幅跨页摄影瞬间包裹读者，翻到下一页骤然收成极简大留白与跃动字体，靠「满幅 × 留白」的强烈反差制造惊艳的视觉节奏。",
    source: "核实出处：Alexey Brodovitch 传记与《Harper's Bazaar》设计史资料",
    svg: `<svg viewBox="0 0 360 220" aria-hidden="true">
      <!-- 跨页满幅大气场 + 右下锐利留白斜窗 -->
      <rect x="34" y="16" width="292" height="188" fill="#092058"/>
      <circle cx="110" cy="110" r="88" fill="#FD8FAF"/>
      <polygon points="154,16 326,16 326,144 218,204" fill="#E34C0B"/>
      <rect x="204" y="132" width="108" height="56" fill="#FEF8F1"/>
      <text x="214" y="156" fill="#101412" font-size="13" font-weight="900">BAZAAR</text>
      <rect x="214" y="166" width="76" height="4" fill="#3B443E"/>
      <rect x="214" y="175" width="58" height="4" fill="#3B443E"/>
      <line x1="180" y1="16" x2="180" y2="204" stroke="rgba(254,248,241,0.4)" stroke-dasharray="4 3"/>
    </svg>`,
  },
  "1936": {
    tag: "1936 年 11 月 23 日 · 《LIFE》创刊号",
    heading: "纪实画报时代：让整张纸成为现场窗口",
    text: "亨利·卢斯改版推出画报《LIFE》，玛格丽特·伯克-怀特拍摄的佩克堡大坝矗立封面，内页大量采用满幅与跨页摄影专题。照片不再是文章旁边的小配图，而是占据整页、把读者直接拉进历史现场的主角。",
    source: "核实出处：LIFE magazine 1936 创刊档案记录",
    svg: `<svg viewBox="0 0 360 220" aria-hidden="true">
      <rect x="108" y="12" width="144" height="196" fill="#0A512E"/>
      <!-- 大坝建筑几何柱体通顶通底 -->
      <rect x="122" y="42" width="26" height="166" fill="#DCCFBA"/>
      <rect x="166" y="28" width="30" height="180" fill="#FEF8F1"/>
      <rect x="214" y="48" width="28" height="160" fill="#DCCFBA"/>
      <rect x="108" y="162" width="144" height="46" fill="#092058"/>
      <!-- 标志左上红刊头 -->
      <rect x="108" y="12" width="56" height="28" fill="#E34C0B"/>
      <text x="136" y="31" text-anchor="middle" fill="#FEF8F1" font-size="14" font-weight="900">LIFE</text>
    </svg>`,
  },
  "modern": {
    tag: "当代 · 全面屏与响应式网页",
    heading: "实体纸边消失，出血与安全区迁入像素视口",
    text: "从无边框手机到宽屏网页首屏，满幅构图早已成为数字界面的第一语言。虽然不再需要裁纸刀，但圆角屏幕、顶部状态岛和多种宽高比迫使设计师用 viewport-fit=cover 与 env(safe-area-inset-*) 重建「视觉铺满、信息安全」的现代秩序。",
    source: "核实出处：MDN Web Docs — CSS env() & safe-area-inset",
    svg: `<svg viewBox="0 0 360 220" aria-hidden="true">
      <rect x="116" y="10" width="128" height="200" rx="22" fill="#101412"/>
      <clipPath id="eraPhoneClip"><rect x="122" y="16" width="116" height="188" rx="18"/></clipPath>
      <g clip-path="url(#eraPhoneClip)">
        <rect x="122" y="16" width="116" height="188" fill="#0A512E"/>
        <circle cx="220" cy="64" r="64" fill="#E34C0B"/>
        <circle cx="136" cy="166" r="56" fill="#FD8FAF"/>
        <rect x="132" y="40" width="96" height="142" fill="none" stroke="#FEF8F1" stroke-dasharray="4 3" stroke-width="1.2"/>
        <rect x="138" y="48" width="66" height="16" fill="#092058"/>
        <text x="144" y="60" fill="#FEF8F1" font-size="10" font-weight="700">SAFE AREA</text>
      </g>
      <rect x="160" y="21" width="40" height="8" rx="4" fill="#0A0D0E"/>
      <rect x="158" y="196" width="44" height="3" rx="1.5" fill="#FEF8F1"/>
    </svg>`,
  },
};

function renderEra(key) {
  const e = ERAS[key];
  if (!e) return;
  document.getElementById("eraSpecimen").innerHTML = e.svg;
  document.getElementById("eraTag").textContent = e.tag;
  document.getElementById("eraHeading").textContent = e.heading;
  document.getElementById("eraText").textContent = e.text;
  document.getElementById("eraSource").textContent = e.source;
  document.querySelectorAll(".era-tab").forEach((b) => {
    const on = b.dataset.era === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}
document.querySelectorAll(".era-tab").forEach((b) => b.addEventListener("click", () => renderEra(b.dataset.era)));
renderEra("1928");

// ==================== 5. 节 04：多设备全面屏适配台 + 活体 CSS ====================
const devState = { device: "phone", viewportCover: true, safeInset: true, objCover: true };
const devShell = document.getElementById("devShell");
const devScreen = document.getElementById("devScreen");
const devUi = document.getElementById("devUi");
const devArtSvg = document.getElementById("devArtSvg");
const devCssCode = document.getElementById("devCssCode");
const devDiagText = document.getElementById("devDiagText");
const devStatusChip = document.getElementById("devStatusChip");

function renderDevLab() {
  devShell.className = `dev-shell is-${devState.device}`;
  devScreen.classList.toggle("is-letterboxed", !devState.viewportCover);
  devUi.classList.toggle("no-safe", !devState.safeInset);
  devArtSvg.setAttribute("preserveAspectRatio", devState.objCover ? "xMidYMid slice" : "xMidYMid meet");

  document.querySelectorAll(".dev-btn").forEach((b) => {
    const on = b.dataset.dev === devState.device;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  const sw1 = document.getElementById("swViewportCover");
  const sw2 = document.getElementById("swSafeInset");
  const sw3 = document.getElementById("swObjCover");
  sw1.classList.toggle("is-on", devState.viewportCover);
  sw1.setAttribute("aria-pressed", String(devState.viewportCover));
  sw2.classList.toggle("is-on", devState.safeInset);
  sw2.setAttribute("aria-pressed", String(devState.safeInset));
  sw3.classList.toggle("is-on", devState.objCover);
  sw3.setAttribute("aria-pressed", String(devState.objCover));
  sw3.textContent = devState.objCover ? "object-fit: cover" : "object-fit: contain";

  devCssCode.textContent = [
    `/* 1. 声明全面屏出血 */`,
    `<meta name="viewport"`,
    `  content="width=device-width${devState.viewportCover ? ",\n           viewport-fit=cover" : ""}">`,
    ``,
    `/* 2. 图像等比铺满不留空条 */`,
    `.hero-media {`,
    `  width: 100%; height: 100%;`,
    `  object-fit: ${devState.objCover ? "cover" : "contain"};`,
    `}`,
    ``,
    `/* 3. 文字按钮退守安全区 */`,
    `.hero-ui {`,
    devState.safeInset
      ? `  padding-top: env(safe-area-inset-top);\n  padding-bottom: env(safe-area-inset-bottom);`
      : `  padding: 0; /* 贴边撞刘海与手势条 */`,
    `}`,
  ].join("\n");

  const problems = [];
  if (!devState.viewportCover) problems.push("未启用 viewport-fit=cover，全面屏四周出现黑边退缩");
  if (!devState.objCover) problems.push("object-fit: contain 在异形宽高比下留下灰黑空条，满幅破功");
  if (!devState.safeInset && devState.device === "phone") problems.push("关闭 safe-area-inset 后，顶部返回键与底部按钮直接撞上状态岛和手势条");
  else if (!devState.safeInset) problems.push("取消内安全距后，导航与按钮紧贴屏幕硬边，操作区发紧");

  if (!problems.length) {
    devStatusChip.textContent = "满屏且安全";
    devDiagText.className = "dev-diag";
    devDiagText.textContent = "三项配合到位：图像无黑边等比铺满物理屏幕，交互文字稳稳停在安全内距里，这就是印刷出血在屏幕上的完整转译。";
  } else {
    devStatusChip.textContent = `存在 ${problems.length} 处隐患`;
    devDiagText.className = "dev-diag is-warn";
    devDiagText.textContent = problems.join("；") + "。";
  }
}

document.querySelectorAll(".dev-btn").forEach((b) => b.addEventListener("click", () => { devState.device = b.dataset.dev; renderDevLab(); }));
document.getElementById("swViewportCover").addEventListener("click", () => { devState.viewportCover = !devState.viewportCover; renderDevLab(); });
document.getElementById("swSafeInset").addEventListener("click", () => { devState.safeInset = !devState.safeInset; renderDevLab(); });
document.getElementById("swObjCover").addEventListener("click", () => { devState.objCover = !devState.objCover; renderDevLab(); });
renderDevLab();

// ==================== 6. 节 05：跨页四模式 + 装订中缝吃图透视 ====================
const SPREAD_MODES = {
  full: {
    chip: "四边全出血跨页",
    rect: [20, 16, 520, 268],
    showTextCol: false,
    showTopBand: false,
    note: "四边全出血跨页冲击力最强，但胶装书脊处有 6–10 mm 弧度折进装订沟：主角剪影与标题必须刻意避开中缝，绝不能压在折线上。",
  },
  half: {
    chip: "左满右白 · 局部出血",
    rect: [20, 16, 260, 268],
    showTextCol: true,
    showTopBand: false,
    note: "画册内页最稳的经典方案：左页四边直冲边界释放张力，右页留出完整白纸安放正文与图注，动静平衡且完全避开文字跨脊风险。",
  },
  three: {
    chip: "三边出血 + 顶栏呼吸",
    rect: [20, 60, 520, 224],
    showTextCol: false,
    showTopBand: true,
    note: "左右下三边出血、顶部留出 44px 干净刊头栏承载期号与栏目名，既有满幅铺展的气势，又不怕标题和深浅不一的照片打架。",
  },
  framed: {
    chip: "四周全留白对照",
    rect: [52, 42, 456, 216],
    showTextCol: false,
    showTopBand: false,
    note: "退回普通四周留白版面，画面显得安静克制，适合作为连续满幅跨页之间的视觉缓冲页，让下一张满幅重新爆发冲击力。",
  },
};

let gutterOn = true;
function renderSpread(modeKey) {
  const m = SPREAD_MODES[modeKey];
  if (!m) return;
  const [x, y, w, h] = m.rect;
  const bg = document.getElementById("spArtBg");
  const clip = document.getElementById("spArtClipRect");
  [bg, clip].forEach((el) => {
    el.setAttribute("x", x);
    el.setAttribute("y", y);
    el.setAttribute("width", w);
    el.setAttribute("height", h);
  });
  document.getElementById("spTextCol").setAttribute("opacity", m.showTextCol ? "1" : "0");
  document.getElementById("spTopBand").setAttribute("opacity", m.showTopBand ? "1" : "0");
  document.getElementById("spreadModeChip").textContent = m.chip;
  document.getElementById("spreadNote").textContent = m.note;

  document.querySelectorAll(".sp-btn").forEach((b) => {
    const on = b.dataset.spread === modeKey;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}
document.querySelectorAll(".sp-btn").forEach((b) => b.addEventListener("click", () => renderSpread(b.dataset.spread)));
document.getElementById("swGutter").addEventListener("click", (e) => {
  gutterOn = !gutterOn;
  e.currentTarget.classList.toggle("is-on", gutterOn);
  e.currentTarget.setAttribute("aria-pressed", String(gutterOn));
  e.currentTarget.textContent = `装订中缝吃图透视：${gutterOn ? "开" : "关"}`;
  document.getElementById("spGutterOverlay").style.display = gutterOn ? "" : "none";
});
renderSpread("full");

// ==================== 7. 节 06：商业印刷 vs 办公打印机咬口对比 ====================
document.querySelectorAll(".pr-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.printer;
    document.querySelectorAll(".pr-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    const sheet = document.getElementById("prSheet");
    const badge = document.getElementById("prBadge");
    const heading = document.getElementById("prHeading");
    const copy = document.getElementById("prCopy");
    if (mode === "office") {
      sheet.className = "pr-sheet is-office";
      badge.textContent = "四周约 5 mm 物理走纸咬口印不到墨，强行留下难看白框";
      heading.textContent = "办公打印机：无法满幅，强做只会出尴尬白边";
      copy.textContent = "常规办公激光/喷墨机滚轮必须抓着纸边进纸，四周 4–6 mm 为无墨死区。如果要发给客户自己用办公打印机打 A4，请主动设计得体的普通白边版式，不要硬做满幅。";
    } else {
      sheet.className = "pr-sheet is-commercial";
      badge.textContent = "先印在 SRA4 大纸（+3mm 出血），再裁切出真满幅 A4";
      heading.textContent = "商业胶印 / 数码快印：成本稍高，四边零白边";
      copy.textContent = "印厂会用比成品更大的纸（例如用 SRA4 印 A4），让油墨印满出血位，再用重型裁纸刀把四条边一并切齐——因此需要多算纸张损耗与裁切工费，但成品四边绝对饱满。";
    }
  });
});

// ==================== 8. 节 07：单变量四选一小练习 ====================
const QUIZ_ANSWERS = {
  A: {
    ok: false,
    text: "× 方案 A 踩了「0 mm 零出血」暗坑：色块刚好停在成品裁切线上，没有向外延入粉色出血区。印厂裁刀只要偏 1 mm，成品边沿立刻露出刺眼的白色毛边。",
  },
  B: {
    ok: false,
    text: "× 方案 B 属于「残边半出血」：上、左、右三边都有 +3 mm 出血，但底边留了一道 10 mm 白色底条，破坏了四边包裹感，不再是完整的四边满幅构图。",
  },
  C: {
    ok: true,
    text: "✓ 答对了！方案 C 唯一同时满足满幅送印两条铁律：四边色块全部延出裁切线 +3 mm 抵达粉色出血虚线（±1 mm 刀偏仍切在纯墨区、零露白），同时主标题稳稳退守 8 mm 安全内距（绝不被切边或贴边窒息）。",
  },
  D: {
    ok: false,
    text: "× 方案 D 误把「画面无内边距」套到了文字上：四边色块确实有 +3 mm 出血，但主标题紧贴裁切线仅 1.5 mm，裁刀稍一偏移就会切掉字头，视觉上也极度发紧。",
  },
};

document.querySelectorAll(".quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    const opt = card.dataset.opt;
    const ans = QUIZ_ANSWERS[opt];
    if (!ans) return;
    document.querySelectorAll(".quiz-card").forEach((c) => {
      c.classList.remove("is-picked-ok", "is-picked-bad");
    });
    card.classList.add(ans.ok ? "is-picked-ok" : "is-picked-bad");
    const fb = document.getElementById("quizFeedback");
    fb.textContent = ans.text;
    fb.className = `quiz-feedback ${ans.ok ? "is-ok" : "is-bad"}`;
  });
});

// ==================== 9. 节 08：原海报放大灯箱（缩放、拖移、Esc 关闭） ====================
const posterEl = document.getElementById("poster");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbStage = document.getElementById("lbStage");
const lbOpenBtn = document.getElementById("posterOpenBtn");
const lbCloseBtn = document.getElementById("lbClose");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDragging = false;
let lbStartX = 0;
let lbStartY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  document.getElementById("lbZoomReset").textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterEl.currentSrc || posterEl.src;
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
  lightbox.hidden = false;
  lbCloseBtn.focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  lbOpenBtn.focus();
}

lbOpenBtn.addEventListener("click", openLightbox);
lbCloseBtn.addEventListener("click", closeLightbox);
document.getElementById("lbZoomIn").addEventListener("click", () => { lbScale = clamp(lbScale + 0.35, 0.7, 3.5); applyLbTransform(); });
document.getElementById("lbZoomOut").addEventListener("click", () => { lbScale = clamp(lbScale - 0.35, 0.7, 3.5); applyLbTransform(); });
document.getElementById("lbZoomReset").addEventListener("click", () => { lbScale = 1; lbTx = 0; lbTy = 0; applyLbTransform(); });

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.2 : -0.2), 0.7, 3.5);
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) { closeLightbox(); return; }
  lbDragging = true;
  lbStartX = e.clientX - lbTx;
  lbStartY = e.clientY - lbTy;
  lbStage.setPointerCapture?.(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDragging) return;
  lbTx = e.clientX - lbStartX;
  lbTy = e.clientY - lbStartY;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => { lbDragging = false; });
lbStage.addEventListener("pointercancel", () => { lbDragging = false; });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  INITIAL_STATE,
  PRESETS,
  clamp,
  evaluate,
} from "./model.js";
import {
  renderAppCompare,
  renderHeroStage,
  renderQuizOption,
} from "./stage-canvas.js";

// =========================================================
// 1. 开场主角玩具：双幕藏露 · 拱窗掩映台
// =========================================================
const state = { ...INITIAL_STATE };
let evalRes = evaluate(state);

const heroCanvas = document.getElementById("hero-canvas");
const pillEl = document.getElementById("hero-status-pill");
const verdictBox = document.getElementById("verdict-box");
const verdictBadge = document.getElementById("verdict-badge");
const verdictTitle = document.getElementById("verdict-title");
const verdictReason = document.getElementById("verdict-reason");
const verdictAction = document.getElementById("verdict-action");
const fixBtn = document.getElementById("verdict-fix-btn");

const mReveal = document.getElementById("m-reveal");
const mFocal = document.getElementById("m-focal");
const mClutter = document.getElementById("m-clutter");
const mTension = document.getElementById("m-tension");

const coverSlider = document.getElementById("ctrl-cover");
const mistSlider = document.getElementById("ctrl-mist");
const valCover = document.getElementById("val-cover");
const valMist = document.getElementById("val-mist");
const xrayBtn = document.getElementById("btn-xray");

const stepEls = {
  conceal: { wrap: document.getElementById("step-conceal"), label: document.getElementById("st-conceal") },
  reveal: { wrap: document.getElementById("step-reveal"), label: document.getElementById("st-reveal") },
  hint: { wrap: document.getElementById("step-hint"), label: document.getElementById("st-hint") },
};

const kwEls = {
  focus: document.getElementById("kw-focus"),
  mystery: document.getElementById("kw-mystery"),
  depth: document.getElementById("kw-depth"),
  rhythm: document.getElementById("kw-rhythm"),
  space: document.getElementById("kw-space"),
};

const anim = {
  t: 0,
  intro: reducedMotion.matches ? 1 : 0.15,
  displayCover: state.cover,
  displayMist: state.mist,
  xrayAlpha: 0,
  dpr: 1,
  dirty: true,
};

function syncHeroSize() {
  const maxDpr = window.innerWidth < 768 ? 1.5 : 2;
  const dpr = pixelRatio(maxDpr);
  const w = heroCanvas.clientWidth || 560;
  const h = heroCanvas.clientHeight || 420;
  const tw = Math.round(w * dpr);
  const th = Math.round(h * dpr);
  if (heroCanvas.width !== tw || heroCanvas.height !== th) {
    heroCanvas.width = tw;
    heroCanvas.height = th;
    anim.dirty = true;
  }
  anim.dpr = dpr;
}

function syncUI() {
  evalRes = evaluate(state);
  const cls = evalRes.status === "pass" ? "is-pass" : evalRes.status === "warn" ? "is-warn" : "is-error";

  pillEl.className = `live-pill ${cls}`;
  pillEl.textContent = `${evalRes.badge} · 露 ${evalRes.revealPct}%`;

  verdictBox.className = `verdict-box ${cls}`;
  verdictBadge.textContent = evalRes.badge;
  verdictTitle.textContent = evalRes.headline;
  verdictReason.textContent = evalRes.reason;
  verdictAction.textContent = evalRes.action;

  if (evalRes.fixPreset) {
    fixBtn.hidden = false;
    fixBtn.textContent = evalRes.fixLabel;
    fixBtn.dataset.preset = evalRes.fixPreset;
  } else {
    fixBtn.hidden = true;
  }

  mReveal.textContent = `${evalRes.revealPct}%`;
  mFocal.textContent = `${evalRes.focalExposedPct}%`;
  mClutter.textContent = `${evalRes.clutterHiddenPct}%`;
  mTension.textContent = evalRes.tensionTier;

  coverSlider.value = String(Math.round(state.cover * 100));
  mistSlider.value = String(Math.round(state.mist * 100));
  valCover.textContent = `${Math.round(state.cover * 100)}%`;
  valMist.textContent = `${Math.round(state.mist * 100)}%`;
  xrayBtn.setAttribute("aria-pressed", String(state.xray));

  document.querySelectorAll("[data-scene]").forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-shape]").forEach((b) => {
    const on = b.dataset.shape === state.maskShape;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-place]").forEach((b) => {
    const on = b.dataset.place === state.placement;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  for (const key of ["conceal", "reveal", "hint"]) {
    stepEls[key].wrap.classList.toggle("is-ok", evalRes.steps[key].ok);
    stepEls[key].label.textContent = evalRes.steps[key].state;
  }
  for (const key of Object.keys(kwEls)) {
    kwEls[key].textContent = evalRes.keywords[key];
  }

  anim.dirty = true;
}

function setState(patch, instant = false) {
  Object.assign(state, patch);
  state.cover = clamp(state.cover, 0, 0.94);
  state.mist = clamp(state.mist, 0, 1);
  if (instant) {
    anim.displayCover = state.cover;
    anim.displayMist = state.mist;
  }
  syncUI();
  heroLoop.draw();
}

const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  syncHeroSize();
  anim.t = t;
  const targetXray = state.xray ? 1 : 0;

  if (still) {
    anim.intro = 1;
    anim.displayCover = state.cover;
    anim.displayMist = state.mist;
    anim.xrayAlpha = targetXray;
    renderHeroStage(heroCanvas, state, evalRes, anim);
    anim.dirty = false;
    return;
  }

  const speed = dt > 0 ? Math.min(1, dt * 13) : 1;
  let moving = false;

  if (anim.intro < 0.999) {
    anim.intro = Math.min(1, anim.intro + Math.max(dt * 1.45, 0.02));
    moving = true;
  }
  if (Math.abs(anim.displayCover - state.cover) > 0.001) {
    anim.displayCover += (state.cover - anim.displayCover) * speed;
    moving = true;
  } else {
    anim.displayCover = state.cover;
  }
  if (Math.abs(anim.displayMist - state.mist) > 0.001) {
    anim.displayMist += (state.mist - anim.displayMist) * speed;
    moving = true;
  } else {
    anim.displayMist = state.mist;
  }
  if (Math.abs(anim.xrayAlpha - targetXray) > 0.002) {
    anim.xrayAlpha += (targetXray - anim.xrayAlpha) * speed;
    moving = true;
  } else {
    anim.xrayAlpha = targetXray;
  }

  if (anim.dirty || moving) {
    renderHeroStage(heroCanvas, state, evalRes, anim);
    anim.dirty = false;
  }
});

// 画布直接横拖推拉暗幕（兼容 pointer + touch，确保 perf 拖动实测满帧重画）
let dragInfo = null;

function beginDrag(clientX, clientY) {
  dragInfo = { startX: clientX, startY: clientY, startCover: state.cover, locked: false };
}

function moveDrag(clientX, clientY) {
  if (!dragInfo) return false;
  const dx = clientX - dragInfo.startX;
  const dy = clientY - dragInfo.startY;
  if (!dragInfo.locked && Math.abs(dx) < 4 && Math.abs(dy) < 4) return false;
  if (!dragInfo.locked) {
    if (Math.abs(dy) > Math.abs(dx) * 1.35) {
      dragInfo = null; // 让用户顺畅竖滑页面
      return false;
    }
    dragInfo.locked = true;
  }
  const w = Math.max(180, heroCanvas.clientWidth || 400);
  // 向左拖：把右下黑幕推入画面（cover 增大）；向右拖：退回显露
  let nextCover = clamp(dragInfo.startCover - (dx / w) * 1.45, 0, 0.94);
  // 靠近原海报黄金位（~0.56）时轻微柔和吸附（不阻碍连续拖动）
  if (state.placement !== "crush" && state.placement !== "bisect" && Math.abs(nextCover - 0.56) < 0.015) {
    nextCover = 0.56;
  }
  setState({ cover: nextCover }, true);
  return true;
}

heroCanvas.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  beginDrag(e.clientX, e.clientY);
  if (heroCanvas.setPointerCapture) {
    try { heroCanvas.setPointerCapture(e.pointerId); } catch {}
  }
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!dragInfo) return;
  if (moveDrag(e.clientX, e.clientY) && e.cancelable) e.preventDefault();
});

const endDrag = () => { dragInfo = null; };
heroCanvas.addEventListener("pointerup", endDrag);
heroCanvas.addEventListener("pointercancel", endDrag);

// 兼容纯 touch 事件派发（如 headless touch perf 探针）
heroCanvas.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) return;
  beginDrag(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

heroCanvas.addEventListener("touchmove", (e) => {
  if (!dragInfo || e.touches.length !== 1) return;
  moveDrag(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

heroCanvas.addEventListener("touchend", endDrag, { passive: true });

// 键盘操作拱窗画布
const PLACE_ORDER = ["guard", "waist", "crush", "bisect"];
heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    setState({ cover: clamp(state.cover + 0.05, 0, 0.94) });
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    setState({ cover: clamp(state.cover - 0.05, 0, 0.94) });
  } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    const idx = PLACE_ORDER.indexOf(state.placement);
    const next = PLACE_ORDER[(idx + (e.key === "ArrowDown" ? 1 : PLACE_ORDER.length - 1)) % PLACE_ORDER.length];
    setState({ placement: next, mist: next === "waist" ? Math.max(state.mist, 0.5) : state.mist });
  } else if (e.key === " ") {
    e.preventDefault();
    setState({ xray: !state.xray });
  }
});

// 控件事件绑定
document.querySelectorAll("[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => setState({ scene: btn.dataset.scene }));
});

document.querySelectorAll("[data-shape]").forEach((btn) => {
  btn.addEventListener("click", () => setState({ maskShape: btn.dataset.shape }));
});

document.querySelectorAll("[data-place]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = btn.dataset.place;
    const patch = { placement: next };
    if (next === "waist" && state.mist < 0.35) patch.mist = 0.54;
    if (next === "guard" && state.placement === "waist") patch.mist = 0.12;
    setState(patch);
  });
});

coverSlider.addEventListener("input", () => {
  setState({ cover: Number(coverSlider.value) / 100 }, true);
});

mistSlider.addEventListener("input", () => {
  setState({ mist: Number(mistSlider.value) / 100 }, true);
});

xrayBtn.addEventListener("click", () => {
  setState({ xray: !state.xray });
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) setState(p.patch);
  });
});

fixBtn.addEventListener("click", () => {
  const p = PRESETS[fixBtn.dataset.preset || "classic"];
  if (p) setState(p.patch);
});

// =========================================================
// 2. 第 01 节：T 形交点非模态补全对照微实验
// =========================================================
const tlabSvg = document.getElementById("tlab-svg");
const tlabNote = document.getElementById("tlab-note");

function renderTLab(mode) {
  if (mode === "good") {
    tlabSvg.innerHTML = `
      <rect width="640" height="220" fill="#090C14"/>
      <!-- 左侧：圆弧 T-junction -->
      <circle cx="150" cy="112" r="68" fill="none" stroke="#366BFF" stroke-width="2" stroke-dasharray="5 5" opacity="0.55"/>
      <path d="M150 44 A68 68 0 0 1 218 112 A68 68 0 0 1 150 180 Z" fill="#1E4EE0"/>
      <rect x="64" y="30" width="88" height="162" fill="#06070A" stroke="#3C4E78" stroke-width="1.5"/>
      <circle cx="152" cy="44" r="5" fill="#57E3CA"/>
      <circle cx="152" cy="180" r="5" fill="#57E3CA"/>
      <text x="166" y="40" fill="#90EEDB" font-size="12" font-family="Space Mono, monospace">T-JUNCTION</text>
      <text x="78" y="114" fill="#9CA7C0" font-size="12" font-family="Noto Sans SC, sans-serif">前景暗板</text>
      <text x="78" y="132" fill="#7AA6FF" font-size="11" font-family="Noto Sans SC, sans-serif">藏去左半圆</text>
      <!-- 右侧：雪峰顺势藏腰 -->
      <polygon points="360,185 458,42 565,185" fill="#1E4EE0"/>
      <polygon points="458,42 512,116 456,116" fill="#F1F3F8"/>
      <path d="M350,188 Q438,118 575,126 L575,195 L350,195 Z" fill="#06070A" stroke="#3C4E78" stroke-width="1.5"/>
      <circle cx="404" cy="126" r="5" fill="#57E3CA"/>
      <circle cx="523" cy="126" r="5" fill="#57E3CA"/>
      <text x="415" y="170" fill="#90EEDB" font-size="12" font-family="Noto Sans SC, sans-serif">峰尖外露 + 坡线入幕 → 脑补整座高山</text>
    `;
    tlabNote.innerHTML = "<strong>顺势截断 · 脑补成立：</strong>前景暗板切在圆弧中段与山腰斜坡上，轮廓线以清晰的 T 形交点（绿点）扎进暗板边缘。哪怕 52% 被遮住，人眼仍顺着切线方向自动把完整圆形与高山接了出来。";
  } else {
    tlabSvg.innerHTML = `
      <rect width="640" height="220" fill="#090C14"/>
      <!-- 左侧：遮掉结构关键侧，留无意义窄条 -->
      <rect x="64" y="30" width="158" height="162" fill="#06070A" stroke="#8B342D" stroke-width="1.5"/>
      <rect x="206" y="88" width="14" height="48" fill="#1E4EE0"/>
      <text x="82" y="112" fill="#FF8372" font-size="12" font-family="Noto Sans SC, sans-serif">曲率与拐点全被吃掉</text>
      <text x="82" y="132" fill="#9CA7C0" font-size="11.5" font-family="Noto Sans SC, sans-serif">剩一条竖蓝块，猜不出原形</text>
      <!-- 右侧：反遮峰尖，只留杂乱山脚 -->
      <polygon points="360,185 458,42 565,185" fill="#1E4EE0"/>
      <rect x="350" y="28" width="225" height="96" fill="#06070A" stroke="#8B342D" stroke-width="1.5"/>
      <line x1="350" y1="124" x2="575" y2="124" stroke="#FF8372" stroke-width="2" stroke-dasharray="6 4"/>
      <text x="382" y="82" fill="#FF8372" font-size="12.5" font-family="Noto Sans SC, sans-serif">× 误把峰尖顶角盖死</text>
      <text x="382" y="162" fill="#D5DDEC" font-size="12" font-family="Noto Sans SC, sans-serif">外面只剩梯形底座，山势全无</text>
    `;
    tlabNote.innerHTML = "<strong>误切拐角 · 补全失败：</strong>总遮挡面积同样在 50% 左右，但暗幕吃掉了圆形曲率与雪峰尖顶，外面只剩平淡梯形与无特征色条。藏露成不成立，关键不在遮多遮少，而在<strong>是否保住结构特征点</strong>。";
  }
}

document.querySelectorAll("[data-tmode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-tmode]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderTLab(btn.dataset.tmode);
  });
});

// =========================================================
// 3. 第 02 节：五档显露率光谱标尺 + 辨识/悬念曲线探针
// =========================================================
const BANDS = [
  {
    pct: 15,
    kicker: "REVEAL 15% · OVER-CONCEALED",
    title: "过度藏匿（< 25%）",
    desc: "画面几乎被暗幕吃光，特征拐点断链。除了人人皆知的极简符号，大多数题材掉到这里都会让人一头雾水，神秘滑落成猜谜。",
    recog: 18,
    suspense: 26,
  },
  {
    pct: 32,
    kicker: "REVEAL 32% · HIGH MYSTERY",
    title: "神秘微露（约 30%–40%）",
    desc: "跨过识别门槛的激进档位：大面积暗空带来强烈戏剧张力，适合品牌预告海报、香水瓶轮廓光或名作悬念封面。",
    recog: 68,
    suspense: 92,
  },
  {
    pct: 48,
    kicker: "REVEAL 48% · SWEET ZONE",
    title: "经典平衡（约 45%–55%）",
    desc: "原海报雪峰构图就落在这里：前景大圆弧吃掉杂乱山脚，留住完整峰尖与斜坡亮面。辨识毫不费力，又给黑幕后面留足了延伸感。",
    recog: 88,
    suspense: 84,
  },
  {
    pct: 64,
    kicker: "REVEAL 64% · CLEAR EMPHASIS",
    title: "明朗主显（约 55%–65%）",
    desc: "当拍摄对象造型比较陌生，或海报必须快速交代信息时，可放宽到六成左右：依然保留前景遮挡的纵深，但不让观者多猜一秒。",
    recog: 95,
    suspense: 56,
  },
  {
    pct: 92,
    kicker: "REVEAL 92% · FLAT EXPOSURE",
    title: "一览无余（> 75%）",
    desc: "所有细节一次端上桌，前后层次和想象余地同时归零。适合说明图与白底商品照，却失去了「藏露构图」原本追求的张力。",
    recog: 99,
    suspense: 14,
  },
];

const curveSvg = document.getElementById("curve-svg");
const curveTitle = document.getElementById("curve-title");
const curveDesc = document.getElementById("curve-desc");
const curveKicker = document.querySelector(".curve-kicker");

function renderCurve(activeIdx) {
  const b = BANDS[activeIdx];
  const xOf = (p) => 48 + (p / 100) * 484;
  const yOf = (v) => 196 - (v / 100) * 142;

  // 平滑辨识曲线（S 型）与悬念曲线（钟形）
  const recogPts = [
    [5, 6], [15, 18], [28, 56], [40, 78], [52, 90], [68, 96], [95, 99],
  ];
  const suspPts = [
    [5, 10], [15, 26], [30, 88], [42, 92], [56, 74], [72, 40], [95, 12],
  ];
  const toPath = (pts) => pts.map(([p, v], i) => `${i === 0 ? "M" : "L"}${xOf(p).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ");

  const ax = xOf(b.pct);
  curveSvg.innerHTML = `
    <!-- 顶部独立图例条（完全避开曲线区域，零遮挡） -->
    <line x1="48" y1="20" x2="72" y2="20" stroke="#0B0E16" stroke-width="2.4"/>
    <text x="78" y="24" fill="#0B0E16" font-size="11.5" font-weight="600" font-family="Noto Sans SC, sans-serif">辨识度（示意）</text>
    <line x1="186" y1="20" x2="210" y2="20" stroke="#1E4EE0" stroke-width="2.4" stroke-dasharray="5 3"/>
    <text x="216" y="24" fill="#143BB5" font-size="11.5" font-weight="600" font-family="Noto Sans SC, sans-serif">悬念张力（示意）</text>
    <rect x="342" y="12" width="14" height="14" fill="#DCE6FB" stroke="#ADC4F5" stroke-width="1"/>
    <text x="362" y="24" fill="#143BB5" font-size="11.5" font-weight="600" font-family="Noto Sans SC, sans-serif">建议显露区间 30%~60%</text>
    <!-- 30%–60% 经验参考区间底带 -->
    <rect x="${xOf(30)}" y="40" width="${xOf(60) - xOf(30)}" height="156" fill="#DCE6FB" opacity="0.68"/>
    <!-- 坐标轴 -->
    <line x1="48" y1="196" x2="532" y2="196" stroke="#9AA7C2" stroke-width="1.2"/>
    <line x1="48" y1="40" x2="48" y2="196" stroke="#9AA7C2" stroke-width="1.2"/>
    <text x="48" y="216" fill="#364056" font-size="11" font-family="Space Mono, monospace">0% 全藏</text>
    <text x="${xOf(30)}" y="216" text-anchor="middle" fill="#143BB5" font-size="11" font-family="Space Mono, monospace">30%</text>
    <text x="${xOf(60)}" y="216" text-anchor="middle" fill="#143BB5" font-size="11" font-family="Space Mono, monospace">60%</text>
    <text x="532" y="216" text-anchor="end" fill="#364056" font-size="11" font-family="Space Mono, monospace">100% 全露</text>
    <!-- 两条示意曲线 -->
    <path d="${toPath(recogPts)}" fill="none" stroke="#0B0E16" stroke-width="2.4"/>
    <path d="${toPath(suspPts)}" fill="none" stroke="#1E4EE0" stroke-width="2.6" stroke-dasharray="6 4"/>
    <!-- 当前探针竖线与双点 -->
    <line x1="${ax}" y1="40" x2="${ax}" y2="196" stroke="#B42817" stroke-width="1.6"/>
    <circle cx="${ax}" cy="${yOf(b.recog)}" r="5.5" fill="#0B0E16" stroke="#FFFFFF" stroke-width="2"/>
    <circle cx="${ax}" cy="${yOf(b.suspense)}" r="5.5" fill="#1E4EE0" stroke="#FFFFFF" stroke-width="2"/>
  `;

  curveKicker.textContent = b.kicker;
  curveTitle.textContent = b.title;
  curveDesc.textContent = b.desc;
}

document.querySelectorAll("[data-band]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-band]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderCurve(Number(btn.dataset.band));
  });
});

// =========================================================
// 4. 第 03 节：原海报四类应用拉帘对照实验舱
// =========================================================
const APPS = {
  landscape: {
    en: "LANDSCAPE POSTER",
    title: "自然风光海报",
    quote: "原海报原话：“用地平线与建筑轮廓遮挡，突出天空与月亮”",
    body: "未遮时，低处密密麻麻的屋脊与窗格把夜空拆得支离破碎；一旦拉起一道纯黑大弧坡吞掉下半场，整个画面的视觉重心瞬间聚到右上角那一弯白月上。",
    hide: "凌乱屋脊、地平线杂物与暗灰底面",
    show: "电光蓝夜空与锐利白月牙",
    warn: "切忌把黑坡抬到贴着月牙边，要给月亮留一圈呼吸蓝空",
  },
  type: {
    en: "TYPOGRAPHY DESIGN",
    title: "字体设计",
    quote: "原海报原话：“让文字被截切或遮挡，强化视觉识别”",
    body: "完整排在框中央的字母 A 只是普通标本；把底脚沉进暗黑台面、让巨字顶住蓝光溢出画框，字体就从「可读字符」升格成了有建筑体量的图形符号。",
    hide: "冗余底脚、基线辅助字与空旷下缘",
    show: "A 字尖顶、内部三角镂空与电光蓝背光",
    warn: "截切字体绝不能切掉决定字形的横梁或转角，否则 A 会沦为无意义的斜条",
  },
  portrait: {
    en: "PORTRAIT SILHOUETTE",
    title: "人像侧影摄影",
    quote: "原海报原话：“利用光影与道具遮挡，突出情绪与轮廓”",
    body: "平光全照往往分散注意力；退回深黑暗室、只用一束窄逆光描出额头、鼻梁与下颌的干净剪影线，五官细节全藏在暗部，情绪与想象反而最浓。",
    hide: "杂乱背景光与无关服饰细节",
    show: "一道干净连续的电光蓝侧影轮廓光",
    warn: "逆光线条要连贯不断裂，否则侧影会碎成孤立的亮斑",
  },
  product: {
    en: "PRODUCT SHOWCASE",
    title: "产品展示",
    quote: "原海报原话：“局部显露产品特征，营造高级与期待感”",
    body: "新品预告海报不急着把整只瓶子和参数标签全盘摊开：一道斜切暗幕盖住底座与多余文字，只让瓶肩一道冷蓝高光浮出来，克制本身就成了质感。",
    hide: "厚重瓶底、桌面反光与次要说明标",
    show: "极具辨识度的瓶盖、瓶颈与亮蓝肩弧",
    warn: "仅适合形象海报与悬念预热；进入商品规格页时仍要展示清晰全貌",
  },
};

const compareCanvas = document.getElementById("compare-canvas");
const compareSlider = document.getElementById("compare-slider");
let activeApp = "landscape";
let compareSplit = 0.44;

function updateAppCompare() {
  const info = APPS[activeApp];
  document.getElementById("app-en").textContent = info.en;
  document.getElementById("app-title").textContent = info.title;
  document.getElementById("app-quote").textContent = info.quote;
  document.getElementById("app-body").textContent = info.body;
  document.getElementById("app-hide").textContent = info.hide;
  document.getElementById("app-show").textContent = info.show;
  document.getElementById("app-warn").textContent = info.warn;
  renderAppCompare(compareCanvas, activeApp, compareSplit);
}

document.querySelectorAll("[data-app]").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeApp = btn.dataset.app;
    document.querySelectorAll("[data-app]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    updateAppCompare();
  });
});

compareSlider.addEventListener("input", () => {
  compareSplit = Number(compareSlider.value) / 100;
  renderAppCompare(compareCanvas, activeApp, compareSplit);
});

let draggingCompare = false;
function moveComparePointer(clientX) {
  const rect = compareCanvas.getBoundingClientRect();
  if (!rect.width) return;
  compareSplit = clamp((clientX - rect.left) / rect.width, 0.08, 0.92);
  compareSlider.value = String(Math.round(compareSplit * 100));
  renderAppCompare(compareCanvas, activeApp, compareSplit);
}

compareCanvas.addEventListener("pointerdown", (e) => {
  draggingCompare = true;
  if (compareCanvas.setPointerCapture) {
    try { compareCanvas.setPointerCapture(e.pointerId); } catch {}
  }
  moveComparePointer(e.clientX);
});
compareCanvas.addEventListener("pointermove", (e) => {
  if (draggingCompare) moveComparePointer(e.clientX);
});
compareCanvas.addEventListener("pointerup", () => { draggingCompare = false; });
compareCanvas.addEventListener("pointercancel", () => { draggingCompare = false; });

// =========================================================
// 5. 第 04 节：历代藏露理论与实践时间线
// =========================================================
const ERAS = {
  guoxi: {
    brush: "烟霞锁其腰，则高矣",
    cite: "北宋 · 郭熙、郭思《林泉高致·山水训》（政和七年 1117 年许光凝序）",
    meta: "北宋山水画论 · 1117 年",
    title: "把整座山从头画到脚，反倒像只舂米碓嘴",
    excerpt: "“山欲高，尽出之则不高，烟霞锁其腰，则高矣。水欲远，尽出之则不远，掩映断其派，则远矣。”",
    body: "北宋画家郭熙口授、其子郭思编纂（政和七年 1117 年由许光凝作序）的《林泉高致》，直白指出了“全露反矮、半藏反高”的构图规律。用云烟拦腰遮断，观者会在脑中自动拉长被遮住的山势与水脉，比交代每一寸山脚更显巍峨深远。",
    svg: `
      <rect width="220" height="180" fill="#0A0E19"/>
      <polygon points="40,165 112,26 184,165" fill="#1C46BA"/>
      <polygon points="112,26 146,96 112,96" fill="#EDF2FC"/>
      <ellipse cx="75" cy="112" rx="68" ry="20" fill="#DCE6FA" opacity="0.88"/>
      <ellipse cx="145" cy="118" rx="66" ry="18" fill="#B9CBEF" opacity="0.82"/>
      <text x="110" y="168" text-anchor="middle" fill="#8DB4FF" font-size="11" font-family="Noto Sans SC, sans-serif">云霞锁腰 · 峰势拔高</text>
    `,
  },
  jicheng: {
    brush: "虽由人作，宛自天开",
    cite: "明末 · 计成《园冶》（1631 年成书，1634 年初刻）",
    meta: "中国传统造园 · 1631–1634 年",
    title: "进园不让一眼望穿：障景、漏窗与框景",
    excerpt: "明末造园家计成在《园冶》中系统总结了粉墙、花窗、假山与游廊对视线的隔断与借景引导。",
    body: "江南园林常在入口正对面先立一道山石或照壁「障景」，刻意藏住深处池馆，再借花窗洞门露出一角竹影飞檐。游人每走几步，遮挡物错位，新景便从缝隙里逐层展露——这是把二维藏露写进了三维步移景异。",
    svg: `
      <rect width="220" height="180" fill="#0A0E19"/>
      <rect x="16" y="18" width="188" height="144" fill="#121828" stroke="#2D3C60"/>
      <circle cx="110" cy="90" r="52" fill="#1A45C8"/>
      <polygon points="78,128 110,56 142,128" fill="#E8EFFB"/>
      <path d="M16,18 H204 V162 H16 Z M110,38 A52,52 0 1,0 110,142 A52,52 0 1,0 110,38 Z" fill="#080B12" fill-rule="evenodd"/>
      <circle cx="110" cy="90" r="52" fill="none" stroke="#6E9CFF" stroke-width="1.6"/>
      <text x="110" y="174" text-anchor="middle" fill="#8DB4FF" font-size="11" font-family="Noto Sans SC, sans-serif">月洞漏窗 · 藏壁露景</text>
    `,
  },
  qing: {
    brush: "露其要处而隐其全",
    cite: "清 · 沈宗骞《芥舟学画编》（1781 年）与笪重光《画筌》",
    meta: "清代画论精微 · 17–18 世纪",
    title: "林端一幅酒帘，胜过画出整间酒馆",
    excerpt: "笪重光：“石无全角，石之左右藏其角。”沈宗骞：“或露其要处而隐其全……如写帘于林端，则知其有酒家。”",
    body: "清初笪重光《画筌》讲山石小径须「或藏而或露」；乾隆四十六年（1781 年）沈宗骞《芥舟学画编》更直接点破了「暗示」的妙用：不必画出整座屋舍，只在树梢露出一面酒旗，观众自己就能把藏在林后的酒家补出来。",
    svg: `
      <rect width="220" height="180" fill="#0A0E19"/>
      <rect x="22" y="22" width="176" height="136" fill="#132B78"/>
      <rect x="116" y="42" width="16" height="44" fill="#F1F3F8"/>
      <line x1="116" y1="36" x2="116" y2="112" stroke="#DCE7FF" stroke-width="2"/>
      <circle cx="66" cy="118" r="44" fill="#07090F"/>
      <circle cx="122" cy="128" r="46" fill="#07090F"/>
      <circle cx="174" cy="116" r="40" fill="#07090F"/>
      <text x="110" y="172" text-anchor="middle" fill="#8DB4FF" font-size="11" font-family="Noto Sans SC, sans-serif">林端露帘 · 隐其全舍</text>
    `,
  },
  hiroshige: {
    brush: "前景巨干，劈开远空",
    cite: "歌川广重《名所江户百景·龟户梅屋敷》（1857 年，布鲁克林博物馆藏）",
    meta: "浮世绘前景遮挡 · 1856–1858 年",
    title: "把一截粗树干直接怼到镜头前",
    excerpt: "歌川广重在《名所江户百景》（1856–1858）第 30 图《龟户梅屋敷》（1857 年）中，用前景巨幅梅干狠狠遮住近半画面。",
    body: "比起温和中景，广重把近景树干放大到顶天立地、直接截断中远景，迫使视线穿过枝干缝隙去读远处的游人与蓝天。这种大胆的前景遮挡直接震撼了 19 世纪末的欧洲画家（梵高曾在 1887 年临摹此画），也成为现代海报大面积前景裁切的直系先驱。",
    svg: `
      <rect width="220" height="180" fill="#173BA4"/>
      <rect x="0" y="128" width="220" height="52" fill="#234898"/>
      <path d="M56,180 C68,120 82,66 106,0 L146,0 C116,66 104,122 98,180 Z" fill="#06070B"/>
      <path d="M84,78 L190,48 L194,58 L82,92 Z" fill="#06070B"/>
      <circle cx="164" cy="108" r="8" fill="#E9EFFC"/>
      <text x="110" y="172" text-anchor="middle" fill="#DCEBFF" font-size="11" font-family="Noto Sans SC, sans-serif">近景巨干遮挡 · 穿隙见远</text>
    `,
  },
  amodal: {
    brush: "不显于目，完于心中",
    cite: "Michotte 等（1964）与 Kanizsa（1979）非模态补全研究",
    meta: "视知觉与格式塔心理学 · 1964–1979 年",
    title: "为什么被遮住的那一半，大脑觉得“它真的在”",
    excerpt: "Michotte, Thinès & Crabbé (1964) 奠基「非模态补全」研究；Kanizsa (1979)《Organization in Vision》系统阐释遮挡下的整体组织律。",
    body: "视觉科学发现，当物体轮廓被前景打断、形成 T 形交点时，大脑不会把它看成一块残缺图形，而是启动「非模态补全」（Amodal Completion）：没有直接光线刺激，却在知觉层面笃定被遮部分完整延续。正是这种“主动补完”，让藏露画面比一览无余更牢牢抓人。",
    svg: `
      <rect width="220" height="180" fill="#0A0E19"/>
      <rect x="92" y="34" width="90" height="90" fill="none" stroke="#5E91FF" stroke-width="1.6" stroke-dasharray="5 4"/>
      <rect x="132" y="34" width="50" height="90" fill="#1E4EE0"/>
      <rect x="38" y="24" width="94" height="114" fill="#06070A" stroke="#7AA6FF" stroke-width="1.5"/>
      <circle cx="132" cy="34" r="4" fill="#57E3CA"/>
      <circle cx="132" cy="124" r="4" fill="#57E3CA"/>
      <text x="110" y="168" text-anchor="middle" fill="#8DB4FF" font-size="11" font-family="Space Mono, monospace">AMODAL COMPLETION</text>
    `,
  },
};

function renderEra(key) {
  const e = ERAS[key];
  document.getElementById("brush-quote").textContent = e.brush;
  document.getElementById("brush-cite").textContent = e.cite;
  document.getElementById("era-meta").textContent = e.meta;
  document.getElementById("era-title").textContent = e.title;
  document.getElementById("era-excerpt").textContent = e.excerpt;
  document.getElementById("era-body").textContent = e.body;
  document.getElementById("era-svg").innerHTML = e.svg;
}

document.querySelectorAll("[data-era]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-era]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderEra(btn.dataset.era);
  });
});

// =========================================================
// 6. 第 05 节：熟悉 vs 陌生造型 50% 遮挡盲测开关
// =========================================================
const blindBtn = document.getElementById("btn-blind-reveal");
const blindFam = document.getElementById("blind-familiar");
const blindUnf = document.getElementById("blind-unfamiliar");
const blindCapA = document.getElementById("blind-cap-a");
const blindCapB = document.getElementById("blind-cap-b");
let blindRevealed = false;

function renderBlindTest() {
  const veilOpacity = blindRevealed ? "0.22" : "1";
  const strokeDash = blindRevealed ? 'stroke="#5E91FF" stroke-dasharray="5 4"' : 'stroke="#29344E"';

  blindFam.innerHTML = `
    <rect width="260" height="170" fill="#173FA8"/>
    <path d="M114,26 H146 L192,150 H164 L152,116 H108 L96,150 H68 Z M130,52 L115,96 H145 Z" fill="#07080C" fill-rule="evenodd"/>
    <rect x="0" y="96" width="260" height="74" fill="#06070A" fill-opacity="${veilOpacity}" ${strokeDash} stroke-width="1.5"/>
    <text x="12" y="22" fill="#DCEBFF" font-size="11" font-family="Space Mono, monospace">FAMILIAR · ${blindRevealed ? "UNVEILED" : "52% HIDDEN"}</text>
  `;

  blindUnf.innerHTML = `
    <rect width="260" height="170" fill="#173FA8"/>
    <!-- 陌生异形扣件：上半截看着像普通矩形，下半截藏着完全出乎意料的钩齿和偏心圆槽 -->
    <path d="M96,26 H164 V96 L186,96 L186,124 L152,124 L152,150 L126,150 L126,118 L72,142 L72,112 L96,96 Z" fill="#07080C"/>
    <circle cx="164" cy="110" r="7" fill="#173FA8"/>
    <rect x="0" y="96" width="260" height="74" fill="#06070A" fill-opacity="${veilOpacity}" ${strokeDash} stroke-width="1.5"/>
    <text x="12" y="22" fill="#DCEBFF" font-size="11" font-family="Space Mono, monospace">UNFAMILIAR · ${blindRevealed ? "UNVEILED" : "52% HIDDEN"}</text>
  `;

  blindBtn.setAttribute("aria-pressed", String(blindRevealed));
  blindBtn.textContent = blindRevealed ? "盖回黑幕重新盲测" : "掀开黑幕验证答案";
  blindCapA.textContent = blindRevealed
    ? "揭晓图一：和你脑补的完全一致——字母 A 是强先验图形，保住尖顶和横梁后遮掉一半照样成立。"
    : "图一（熟悉图形 · 遮去 52%）：即便只露上半截尖顶与横梁，大脑瞬间补出完整字母 A。";
  blindCapB.textContent = blindRevealed
    ? "揭晓图二：下面竟藏着偏心钩爪与圆孔！没有先验记忆时，藏露只会误导用户对产品结构的判断。"
    : "图二（陌生异形件 · 遮去 52%）：没有先验记忆撑腰，只看上面一块方柱根本猜不出黑幕后面藏着什么结构。";
}

blindBtn.addEventListener("click", () => {
  blindRevealed = !blindRevealed;
  renderBlindTest();
});

// =========================================================
// 7. 第 06 节：眼力练习（中性标签四选一，单变量对照）
// =========================================================
const QUIZZES = [
  {
    answer: 2,
    options: [
      {
        label: "方案 A",
        state: { scene: "mountain", maskShape: "arc", placement: "guard", cover: 0.16, mist: 0.0, xray: false },
        why: "暗幕退在右下角，山脚杂石几乎全盘摊开，前后层次塌平，失去神秘与焦点收束。",
      },
      {
        label: "方案 B",
        state: { scene: "mountain", maskShape: "arc", placement: "crush", cover: 0.56, mist: 0.12, xray: false },
        why: "极具迷惑性的错项：总显露率虽落进 30%–60% 区间，却反手盖住了雪峰主尖，只把灰暗山脚留在外面——藏主露次。",
      },
      {
        label: "方案 C",
        state: { scene: "mountain", maskShape: "arc", placement: "waist", cover: 0.56, mist: 0.52, xray: false },
        why: "正确解：前景大弧果断吃掉下右杂乱山脚，云腰轻锁，完整托出雪峰尖顶与斜坡亮面，比例、层次与脑补线索同时成立。",
      },
      {
        label: "方案 D",
        state: { scene: "mountain", maskShape: "arc", placement: "guard", cover: 0.89, mist: 0.35, xray: false },
        why: "过度死遮：显露跌破 20%，山体主轮廓几乎被黑幕吞尽，观者无法触发非模态补全。",
      },
    ],
  },
  {
    answer: 1,
    options: [
      {
        label: "方案 A",
        state: { scene: "letter", maskShape: "slash", placement: "guard", cover: 0.12, mist: 0.0, xray: false },
        why: "底部辅助网格和整只字母全盘露出，像普通字样标本，缺少截切藏露的张力。",
      },
      {
        label: "方案 B",
        state: { scene: "letter", maskShape: "slash", placement: "guard", cover: 0.54, mist: 0.12, xray: false },
        why: "正确解：斜切暗帘利落藏掉底部杂乱网格与冗余底脚，精准露出 A 字尖顶、内部三角镂空与背光横梁，一眼可辨又极富张力。",
      },
      {
        label: "方案 C",
        state: { scene: "letter", maskShape: "slash", placement: "crush", cover: 0.58, mist: 0.1, xray: false },
        why: "遮错要害：斜幕盖掉了最关键的顶角与横梁，只留下方两条孤立斜腿，字母识别度瞬间瓦解。",
      },
      {
        label: "方案 D",
        state: { scene: "letter", maskShape: "slash", placement: "bisect", cover: 0.55, mist: 0.0, xray: false },
        why: "垂直中线生硬对劈，直接把对称字形一刀切半，边缘缺乏顺势延伸的暗示节奏。",
      },
    ],
  },
];

let activeQuiz = 0;
let pickedOpt = -1;
const quizOptBtns = [...document.querySelectorAll(".quiz-opt")];
const quizFeedback = document.getElementById("quiz-feedback");

function renderQuiz() {
  const q = QUIZZES[activeQuiz];
  quizOptBtns.forEach((btn, i) => {
    const canvas = btn.querySelector("canvas");
    renderQuizOption(canvas, q.options[i].state);
    btn.classList.remove("is-picked-right", "is-picked-wrong", "is-correct-hint");
    btn.querySelector(".quiz-label").textContent = q.options[i].label;
  });
  pickedOpt = -1;
  quizFeedback.className = "quiz-feedback";
  quizFeedback.innerHTML = `<p class="qf-placeholder">点选上方任意一版（方案 A / B / C / D），即可看到四版的真实显露率、焦点线索暴露度与逐项拆解。</p>`;
}

function handleQuizPick(idx) {
  const q = QUIZZES[activeQuiz];
  pickedOpt = idx;
  const ok = idx === q.answer;

  quizOptBtns.forEach((btn, i) => {
    btn.classList.remove("is-picked-right", "is-picked-wrong", "is-correct-hint");
    const ev = evaluate(q.options[i].state);
    btn.querySelector(".quiz-label").textContent = `${q.options[i].label} · 露 ${ev.revealPct}%`;
    if (i === idx) btn.classList.add(ok ? "is-picked-right" : "is-picked-wrong");
    if (!ok && i === q.answer) btn.classList.add("is-correct-hint");
  });

  const rows = q.options
    .map((o, i) => {
      const ev = evaluate(o.state);
      const mark = i === q.answer ? "✓" : "×";
      return `<div><strong>${mark} ${o.label}（露 ${ev.revealPct}% · 焦点 ${ev.focalExposedPct}%）</strong>：${o.why}</div>`;
    })
    .join("");

  quizFeedback.className = `quiz-feedback ${ok ? "is-right" : "is-wrong"}`;
  quizFeedback.innerHTML = `
    <p class="qf-head">${ok ? `答对了！${q.options[q.answer].label} 藏露最成立` : `再看看要害位置：这题更成立的是 ${q.options[q.answer].label}`}</p>
    <p>${q.options[idx].why}</p>
    <div class="qf-list">${rows}</div>
  `;
}

quizOptBtns.forEach((btn) => {
  btn.addEventListener("click", () => handleQuizPick(Number(btn.dataset.opt)));
});

document.querySelectorAll("[data-quiz]").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeQuiz = Number(btn.dataset.quiz);
    document.querySelectorAll("[data-quiz]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderQuiz();
  });
});

// =========================================================
// 8. 第 07 节：原海报全屏灯箱（缩放、拖动、Esc 关闭）
// =========================================================
const posterImg = document.getElementById("poster");
const posterOpen = document.getElementById("poster-open");
const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbScaleEl = document.getElementById("lb-scale");
const lbIn = document.getElementById("lb-in");
const lbOut = document.getElementById("lb-out");
const lbReset = document.getElementById("lb-reset");
const lbClose = document.getElementById("lb-close");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate3d(${lbX}px, ${lbY}px, 0) scale(${lbScale})`;
  lbScaleEl.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterImg.src; // 只复用已内联的一份海报资源
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  lbClose.focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterOpen.focus();
}

posterOpen.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbIn.addEventListener("click", () => { lbScale = clamp(lbScale + 0.35, 1, 3.2); applyLbTransform(); });
lbOut.addEventListener("click", () => {
  lbScale = clamp(lbScale - 0.35, 1, 3.2);
  if (lbScale === 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
});
lbReset.addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLbTransform(); });

lbStage.addEventListener("click", (e) => {
  if (e.target === lbStage) closeLightbox();
});

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const dir = e.deltaY < 0 ? 0.2 : -0.2;
  lbScale = clamp(lbScale + dir, 1, 3.2);
  if (lbScale === 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target !== lbImg) return;
  lbDrag = { sx: e.clientX - lbX, sy: e.clientY - lbY };
  lbStage.classList.add("is-dragging");
  if (lbStage.setPointerCapture) {
    try { lbStage.setPointerCapture(e.pointerId); } catch {}
  }
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbDrag.sx;
  lbY = e.clientY - lbDrag.sy;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => { lbDrag = null; lbStage.classList.remove("is-dragging"); });
lbStage.addEventListener("pointercancel", () => { lbDrag = null; lbStage.classList.remove("is-dragging"); });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// =========================================================
// 9. 初始化与窗口缩放同步
// =========================================================
syncUI();
renderTLab("good");
renderCurve(2);
updateAppCompare();
renderEra("guoxi");
renderBlindTest();
renderQuiz();
heroLoop.draw();

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    syncHeroSize();
    heroLoop.draw();
    renderAppCompare(compareCanvas, activeApp, compareSplit);
    const q = QUIZZES[activeQuiz];
    quizOptBtns.forEach((btn, i) => renderQuizOption(btn.querySelector("canvas"), q.options[i].state));
  }, 80);
});

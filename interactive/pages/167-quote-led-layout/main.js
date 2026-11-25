import { loop, pixelRatio } from "../../lib/stage.js";
import {
  PALETTE,
  SPECIMENS,
  computeLayout,
  createInitialState,
  evaluateLayout,
  getPresets,
  toggleBreak,
} from "./model.js";
import { createHeroCanvas } from "./hero-canvas.js";

// =========================================================
// 1. 开场主角玩具：167 活体引语断行与呼吸排印台
// =========================================================
let state = createInitialState("poster");

const heroCanvas = document.getElementById("hero-canvas");
const elBrushBar = document.getElementById("hero-brush-bar");
const elDiagCard = document.getElementById("diag-card");
const elDiagPill = document.getElementById("diag-pill");
const elDiagCadence = document.getElementById("diag-cadence");
const elDiagHeadline = document.getElementById("diag-headline");
const elDiagWhy = document.getElementById("diag-why");
const elDiagActionRow = document.getElementById("diag-action-row");
const elDiagActionHint = document.getElementById("diag-action-hint");
const btnPrimaryFix = document.getElementById("btn-primary-fix");

const mScale = document.getElementById("m-scale");
const mSpace = document.getElementById("m-space");
const mIndent = document.getElementById("m-indent");
const mBeat = document.getElementById("m-beat");

const ctrlScale = document.getElementById("ctrl-scale");
const outScale = document.getElementById("out-scale");
const ctrlLeading = document.getElementById("ctrl-leading");
const outLeading = document.getElementById("out-leading");

const elEchoLines = document.getElementById("echo-lines");
const elEchoEn = document.getElementById("echo-en");
const elBadgeAttr = document.getElementById("badge-attr");

const pillarEls = {
  quote: { card: document.getElementById("pillar-quote"), badge: document.getElementById("badge-quote") },
  emphasis: { card: document.getElementById("pillar-emphasis"), badge: document.getElementById("badge-emphasis") },
  rhythm: { card: document.getElementById("pillar-rhythm"), badge: document.getElementById("badge-rhythm") },
};

const btnPlayBeat = document.getElementById("btn-play-beat");
const btnBeatLabel = document.getElementById("btn-beat-label");
const btnResetHero = document.getElementById("btn-reset-hero");

let primaryFixPatch = null;
let heroLoop = null;
let heroDirty = true;

const heroStage = createHeroCanvas(heroCanvas, {
  getState: () => state,
  onScaleChange(nextScale) {
    if (Math.abs(nextScale - state.scale) < 0.005) return;
    state = { ...state, scale: nextScale };
    syncAll();
  },
  onToggleBreak(cutIdx) {
    state = toggleBreak(state, cutIdx);
    syncAll();
  },
  onQuickFix(patch) {
    state = { ...state, ...patch };
    syncAll();
  },
});

function syncHeroDOM() {
  const sp = SPECIMENS[state.specimen] || SPECIMENS.poster;
  const r = heroCanvas.getBoundingClientRect();
  const layout = computeLayout(state, Math.max(320, r.width || 860), Math.max(240, r.height || 550));
  const ev = evaluateLayout(state, layout);

  // 顶沿自示范干笔线
  elBrushBar.classList.toggle("is-ok", ev.allOk);

  // 批注诊单（100% 来自单真源 evaluateLayout）
  elDiagCard.classList.toggle("is-ok", ev.allOk);
  elDiagPill.classList.toggle("is-ok", ev.allOk);
  elDiagPill.classList.toggle("is-warn", !ev.allOk);
  elDiagPill.textContent = ev.allOk ? "4/4 节拍成立" : `${ev.passedCount}/4 待校`;
  elDiagCadence.textContent = `CADENCE · ${ev.cadenceTier}`;

  if (ev.allOk) {
    elDiagHeadline.textContent = ev.solutionName;
    elDiagWhy.textContent = ev.solutionSummary;
    elDiagActionHint.textContent = "可以继续试试别的合法解，或点下方「试错」看它为什么崩掉。";
    btnPrimaryFix.hidden = true;
    primaryFixPatch = null;
  } else if (ev.primary) {
    elDiagHeadline.textContent = ev.primary.headline;
    elDiagWhy.textContent = ev.primary.why;
    elDiagActionHint.textContent = ev.primary.action;
    btnPrimaryFix.textContent = ev.primary.fixLabel;
    btnPrimaryFix.hidden = false;
    primaryFixPatch = ev.primary.fixPatch;
  }

  // 4 组实测读数
  mScale.textContent = `${state.scale.toFixed(2)}×`;
  mSpace.textContent = `${layout.whitespacePct}%`;
  mIndent.textContent = layout.opticalIndentPx > 0 ? `+${layout.opticalIndentPx}px` : "0px";
  mBeat.textContent = `${layout.totalBeatSec.toFixed(1)}s`;

  // 控件状态同步
  ctrlScale.value = state.scale.toFixed(2);
  outScale.textContent = `${state.scale.toFixed(2)}×`;
  ctrlLeading.value = state.lineHeight.toFixed(2);
  outLeading.textContent = `${state.lineHeight.toFixed(2)}×`;

  document.querySelectorAll(".seg-btn").forEach((btn) => {
    const key = btn.dataset.set;
    const val = btn.dataset.val;
    const active = state[key] === val;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  document.querySelectorAll(".sp-tab").forEach((tab) => {
    const active = tab.dataset.specimen === state.specimen;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  // 底沿三栏活体实况徽
  for (const key of ["quote", "emphasis", "rhythm"]) {
    const info = ev.pillars[key];
    pillarEls[key].card.classList.toggle("is-ok", info.ok);
    pillarEls[key].badge.textContent = info.badge;
  }

  // 右下角微型复现卡随当前断行与标本实时同步
  elEchoLines.innerHTML = layout.lines.map((l) => l.text).join("<br>");
  elEchoEn.textContent = sp.enQuote;
  elBadgeAttr.textContent = `出处：${ev.pillars.attribution.badge}`;
  elBadgeAttr.classList.toggle("is-ok", ev.pillars.attribution.ok);

  // 播放按钮状态
  const playing = heroStage.isBeatPlaying();
  btnPlayBeat.classList.toggle("is-playing", playing);
  btnBeatLabel.textContent = playing ? "节拍扫读中…" : "回放阅读节拍";
}

function syncAll() {
  heroDirty = true;
  syncHeroDOM();
  if (heroLoop) heroLoop.draw();
}

// 仅在开场动画、节拍播放或交互变更时重画（极低耗电，拖动时 60fps 全帧绘制）
let heroIntroDone = false;
heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  const playing = heroStage.isBeatPlaying();
  const needIntro = !still && !heroIntroDone && t < 0.9;
  if (still || heroDirty || playing || needIntro) {
    heroStage.render(t, dt, { still });
    heroDirty = false;
    if (t >= 0.9 || still) heroIntroDone = true;
    if (playing && !heroStage.isBeatPlaying()) {
      syncHeroDOM();
    }
  }
});

// 绑定 Hero 全部原生控件
ctrlScale.addEventListener("input", () => {
  state = { ...state, scale: +ctrlScale.value };
  syncAll();
});

ctrlLeading.addEventListener("input", () => {
  state = { ...state, lineHeight: +ctrlLeading.value };
  syncAll();
});

document.querySelectorAll(".seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state = { ...state, [btn.dataset.set]: btn.dataset.val };
    syncAll();
  });
});

document.querySelectorAll(".sp-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const nextSp = tab.dataset.specimen;
    if (nextSp === state.specimen) return;
    const sp = SPECIMENS[nextSp];
    // 切换标本时保留用户其它调好的维度，只把断行重置为该标本对应状态
    const wasGoodBreaks =
      state.breaks.length === SPECIMENS[state.specimen].goodBreaks.length &&
      state.breaks.every((v, i) => v === SPECIMENS[state.specimen].goodBreaks[i]);
    state = {
      ...state,
      specimen: nextSp,
      breaks: wasGoodBreaks ? [...sp.goodBreaks] : [...sp.initialBreaks],
    };
    syncAll();
  });
});

document.querySelectorAll(".pre-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const presets = getPresets(state.specimen);
    const p = presets[btn.dataset.preset];
    if (!p) return;
    state = { ...state, ...p.patch };
    syncAll();
  });
});

btnPrimaryFix.addEventListener("click", () => {
  if (!primaryFixPatch) return;
  state = { ...state, ...primaryFixPatch };
  syncAll();
});

btnResetHero.addEventListener("click", () => {
  state = createInitialState(state.specimen);
  heroStage.stopBeatPlayback();
  syncAll();
});

btnPlayBeat.addEventListener("click", () => {
  if (heroStage.isBeatPlaying()) {
    heroStage.stopBeatPlayback();
  } else {
    heroStage.startBeatPlayback();
  }
  syncAll();
});

// 键盘微调（画布聚焦或按下左右箭头时，不干扰输入框）
heroCanvas.setAttribute("tabindex", "0");
heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    state = { ...state, scale: Math.min(3.0, +(state.scale + 0.08).toFixed(2)) };
    syncAll();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    state = { ...state, scale: Math.max(1.0, +(state.scale - 0.08).toFixed(2)) };
    syncAll();
  } else if (e.key === " ") {
    e.preventDefault();
    heroStage.startBeatPlayback();
    syncAll();
  }
});

window.addEventListener("resize", () => {
  heroDirty = true;
  if (heroLoop) heroLoop.draw();
});

syncAll();

// =========================================================
// 2. 第 01 节：杂志实景 Split Curtain 对比帘幕 + 四步剥离
// =========================================================
const s1Range = document.getElementById("s1-range");
const s1Pct = document.getElementById("s1-pct");
const s1Before = document.getElementById("s1-before");
const s1Divider = document.getElementById("s1-divider");
const s1After = document.getElementById("s1-after");
const s1Note = document.getElementById("s1-note");
const curtainBox = document.getElementById("curtain-box");

const S1_NOTES = [
  "第 0 步：这句话还埋在正文中间，字号与周围一致，视线翻页时几乎不会注意到它。",
  "第 1 步：先把它从段落里抽离独立成块，但字号仍偏克制，只算普通摘录，尚未撑起版面。",
  "第 2 步：把字号放大并拉出四周呼吸留白，这句话已开始取代配图成为视觉重心。",
  "第 3 步：叠加三拍断行、酸黄绿斜角巨引号与干笔刷线后，句子本身取代了摄影插画，成为整页最具穿透力的第一落点。",
];

function setCurtain(pct) {
  const clamped = Math.max(8, Math.min(92, Math.round(pct)));
  s1Range.value = String(clamped);
  s1Pct.textContent = `${clamped}%`;
  s1Before.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
  s1Divider.style.left = `${clamped}%`;
}

s1Range.addEventListener("input", () => setCurtain(+s1Range.value));

let curtainDrag = false;
curtainBox.addEventListener("pointerdown", (e) => {
  curtainDrag = true;
  const r = curtainBox.getBoundingClientRect();
  setCurtain(((e.clientX - r.left) / r.width) * 100);
});
window.addEventListener("pointermove", (e) => {
  if (!curtainDrag) return;
  const r = curtainBox.getBoundingClientRect();
  setCurtain(((e.clientX - r.left) / r.width) * 100);
});
window.addEventListener("pointerup", () => {
  curtainDrag = false;
});

document.querySelectorAll(".step-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const idx = +btn.dataset.s1Step;
    document.querySelectorAll(".step-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    s1After.dataset.step = String(idx);
    s1Note.textContent = S1_NOTES[idx];
  });
});

setCurtain(40);

// =========================================================
// 3. 第 02 节：引号的光学微差（SVG 放大剖面 + 垂线游标）
// =========================================================
const optDent = document.getElementById("opt-dent");
const optMark = document.getElementById("opt-mark");
const optL1 = document.getElementById("opt-l1");
const optPlumb = document.getElementById("opt-plumb");
const optPlumbVal = document.getElementById("opt-plumb-val");
const optPlumbRange = document.getElementById("opt-plumb-range");
const optPlumbOut = document.getElementById("opt-plumb-out");
const ovTag = document.getElementById("ov-tag");
const ovTitle = document.getElementById("ov-title");
const ovBody = document.getElementById("ov-body");
const optCss = document.getElementById("opt-css");

const OPT_MODES = {
  straight: {
    mark: '"',
    markX: 122,
    markColor: "#FF7A5C",
    markFont: "'DM Mono', monospace",
    l1X: 158,
    dentShow: true,
    dentW: 38,
    ok: false,
    tag: "左沿内缩 +38px",
    title: "机械直引号不仅粗糙，还把第一行首字挤退了半格",
    body: "Matthew Butterick 在《Practical Typography》中强调：直引号是打字机为了省键位留下的权宜产物，正式出版排版必须使用真正的弯引号。更关键的是，当引号和正文挤在同一条左基准线上，视觉轻巧的引号会制造出一个明显的凹槽，让整块大字的左沿看起来参差不齐。",
    css: `/* 错态：机械直引号内缩，左沿错牙 */\n.quote {\n  hanging-punctuation: none;\n  text-indent: 0;\n}`,
  },
  "curly-in": {
    mark: "“",
    markX: 116,
    markColor: "#FF7A5C",
    markFont: "'Fraunces', serif",
    l1X: 164,
    dentShow: true,
    dentW: 44,
    ok: false,
    tag: "左沿内缩 +44px",
    title: "换对了弯引号，但没挂出去依然啃凹第一行",
    body: "换成全角弯引号后字形顺眼多了，可如果仍然让它顶在文字左边界里，第一行首字「排」还是会比第二行「传」往右退一大截。字号越大，这个半字宽的缺口就越刺眼。",
    css: `/* 仍未光学对齐：弯引号占住了第一行左侧空间 */\n.quote {\n  hanging-punctuation: none;\n}`,
  },
  hanging: {
    mark: "“",
    markX: 68,
    markColor: "#BEC819",
    markFont: "'Fraunces', serif",
    l1X: 120,
    dentShow: false,
    dentW: 0,
    ok: true,
    tag: "光学对齐 · 0px 缩进",
    title: "把弯引号挂出基准线外，所有首字严丝合缝站在一条垂线上",
    body: "这就是 Robert Bringhurst 推崇的悬挂标点（Hanging Punctuation）：让形态轻巧的引号悬在左留白里，把真正有分量的汉字笔画锁死在基准垂线上。167 原海报更进一步，把巨引号退到第一行正上方左缘，彻底消除齐边冲突。",
    css: `/* 推荐：标准悬挂 + 跨浏览器负缩进回退 */\n.quote {\n  hanging-punctuation: first last;\n  text-indent: -0.45em; /* 兼容非 Safari 引擎 */\n}`,
  },
  omit: {
    mark: "",
    markX: 68,
    markColor: "#BEC819",
    markFont: "'Fraunces', serif",
    l1X: 120,
    dentShow: false,
    dentW: 0,
    ok: true,
    tag: "独立成段 · 0px 缩进",
    title: "当尺度与留白足够强时，干脆省去冗余引号",
    body: "Butterick 在《Block Quotations》一节指出：独立成段、已经通过字号、缩进或版位明确区分于正文的引语，完全可以省略前后引号。版式本身已经替你说清了“这是引语”，左沿自然天生齐整。",
    css: `/* 极简展墙 / 独立引语块：以尺度与留白代引号 */\n.quote-block {\n  padding-left: 2.5rem;\n  border-left: 3px solid #BEC819;\n}`,
  },
};

function applyOptMode(modeKey) {
  const m = OPT_MODES[modeKey] || OPT_MODES.straight;
  optMark.textContent = m.mark;
  optMark.setAttribute("x", String(m.markX));
  optMark.setAttribute("fill", m.markColor);
  optMark.setAttribute("font-family", m.markFont);
  optL1.setAttribute("x", String(m.l1X));
  optDent.style.display = m.dentShow ? "block" : "none";
  if (m.dentShow) optDent.setAttribute("width", String(m.dentW));

  ovTag.textContent = m.tag;
  ovTag.classList.toggle("is-ok", m.ok);
  ovTag.classList.toggle("is-warn", !m.ok);
  ovTitle.textContent = m.title;
  ovBody.textContent = m.body;
  optCss.textContent = m.css;
}

document.querySelectorAll(".opt-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".opt-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    applyOptMode(btn.dataset.opt);
  });
});

function updatePlumb(offset) {
  optPlumb.setAttribute("transform", `translate(${offset}, 0)`);
  const txt = offset === 0 ? "基准 0px" : `${offset > 0 ? "+" : ""}${offset}px`;
  optPlumbVal.textContent = offset === 0 ? "0px" : `${offset > 0 ? "+" : ""}${offset}px`;
  optPlumbOut.textContent = txt;
}

optPlumbRange.addEventListener("input", () => updatePlumb(+optPlumbRange.value));
applyOptMode("straight");
updatePlumb(0);

// =========================================================
// 4. 第 03 节：停顿就是阅读节奏（2D Canvas 乐谱式节拍器）
// =========================================================
const CAD_TEXT = "排版不仅传递信息，也组织阅读。";
const CAD_BAD_GAPS = new Set([1, 3, 5, 7, 8, 11, 13, 14]);
// pause: 0 连读, 1 轻顿换行, 2 大顿强调换行
let cadPauses = new Array(CAD_TEXT.length).fill(0);
cadPauses[4] = 1;
cadPauses[9] = 2;
let cadLeading = 1.22;
let cadDirty = true;

const cadCanvas = document.getElementById("cadence-canvas");
const cadCtx = cadCanvas.getContext("2d");
const tokenRail = document.getElementById("token-rail");
const ceLeadingInput = document.getElementById("ce-leading");
const ceLeadingOut = document.getElementById("ce-leading-out");
const ceReadout = document.getElementById("ce-readout");

function buildTokenRail() {
  tokenRail.innerHTML = "";
  for (let i = 0; i < CAD_TEXT.length; i++) {
    const chSpan = document.createElement("span");
    chSpan.className = "tok-char";
    chSpan.textContent = CAD_TEXT[i];
    tokenRail.append(chSpan);

    const gapIdx = i + 1;
    if (gapIdx < CAD_TEXT.length) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tok-gap" + (CAD_BAD_GAPS.has(gapIdx) ? " is-bad" : "");
      btn.dataset.gap = String(gapIdx);
      btn.dataset.pause = String(cadPauses[gapIdx]);
      btn.textContent = cadPauses[gapIdx] === 0 ? "·" : cadPauses[gapIdx] === 1 ? "|" : "||";
      btn.setAttribute("aria-label", `在「${CAD_TEXT[i]}」后切换停顿`);
      btn.addEventListener("click", () => {
        cadPauses[gapIdx] = (cadPauses[gapIdx] + 1) % 3;
        refreshCadence();
      });
      tokenRail.append(btn);
    }
  }
}

function getCadLines() {
  const lines = [];
  let start = 0;
  for (let g = 1; g < CAD_TEXT.length; g++) {
    if (cadPauses[g] > 0) {
      lines.push({
        text: CAD_TEXT.slice(start, g),
        pauseLevel: cadPauses[g],
        badBreak: CAD_BAD_GAPS.has(g),
      });
      start = g;
    }
  }
  lines.push({ text: CAD_TEXT.slice(start), pauseLevel: 0, badBreak: false });
  return lines;
}

function updateCadReadout() {
  const lines = getCadLines();
  const hasBad = lines.some((l) => l.badBreak);
  const leadingWarn = cadLeading < 1.07 || cadLeading > 1.52;
  ceReadout.classList.toggle("is-warn", hasBad || leadingWarn || lines.length === 1 || lines.length >= 6);

  if (hasBad) {
    ceReadout.textContent = "你把停顿切在了词语中间或标点前：声波在词缝处出现刺耳卡顿，默读时眼睛被迫折返拼词。";
  } else if (lines.length === 1) {
    ceReadout.textContent = "全程 0 次停顿：15 个字一口气平推到底，声波像一条直平线，没有轻重起伏。";
  } else if (lines.length >= 6) {
    ceReadout.textContent = `切成了 ${lines.length} 段碎句：停顿过于频繁，原本笃定的观点被拆成急促的口令。`;
  } else if (leadingWarn) {
    ceReadout.textContent =
      cadLeading < 1.07
        ? `行距 ${cadLeading.toFixed(2)}× 压得太紧，停顿通道被压缩，上下行字脚几乎相碰。`
        : `行距 ${cadLeading.toFixed(2)}× 拉得过松，各行之间的呼应感变弱，像几句互不相干的标语。`;
  } else {
    const counts = lines.map((l) => `${l.text.length}字`).join(" / ");
    ceReadout.textContent = `当前 ${lines.length} 拍节拍成立（${counts}），行距 ${cadLeading.toFixed(2)}×：大顿处留出明确换气，读者自然按你预设的轻重默读。`;
  }
}

function drawCadence(t, still) {
  const rect = cadCanvas.getBoundingClientRect();
  const W = Math.max(300, Math.round(rect.width));
  const H = Math.max(170, Math.round(rect.height));
  const dpr = pixelRatio(2);
  if (cadCanvas.width !== Math.round(W * dpr) || cadCanvas.height !== Math.round(H * dpr)) {
    cadCanvas.width = Math.round(W * dpr);
    cadCanvas.height = Math.round(H * dpr);
  }
  cadCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  cadCtx.fillStyle = PALETTE.bgDeep;
  cadCtx.fillRect(0, 0, W, H);

  const lines = getCadLines();
  const isNarrow = W < 540;
  const leftW = isNarrow ? W : Math.round(W * 0.44);
  const rightX = isNarrow ? 16 : leftW + 24;
  const rightW = W - rightX - 18;

  // 左侧：实时排版预览
  const maxChars = Math.max(...lines.map((l) => l.text.length), 4);
  const fz = Math.max(15, Math.min(34, Math.min((leftW - 44) / (maxChars * 1.05), (H - 44) / (lines.length * cadLeading * 1.15))));
  const blockH = lines.length * fz * cadLeading;
  let py = isNarrow ? 26 : Math.max(24, (H - blockH) * 0.5);

  cadCtx.font = `900 ${fz.toFixed(1)}px "Noto Sans SC", sans-serif`;
  cadCtx.textBaseline = "top";
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    cadCtx.fillStyle = ln.badBreak ? PALETTE.warn : i === lines.length - 1 ? PALETTE.limeBright : PALETTE.cream;
    cadCtx.fillText(ln.text, 22, py);
    py += fz * cadLeading + (ln.pauseLevel === 2 ? fz * 0.16 : 0);
  }

  // 右侧（窄屏放下半部）：乐谱式节拍时序条
  const barAreaY = isNarrow ? Math.max(py + 12, H * 0.56) : 34;
  const barAreaH = H - barAreaY - 26;

  if (!isNarrow) {
    cadCtx.strokeStyle = PALETTE.rule;
    cadCtx.lineWidth = 1;
    cadCtx.beginPath();
    cadCtx.moveTo(leftW, 18);
    cadCtx.lineTo(leftW, H - 18);
    cadCtx.stroke();
  }

  // 计算每字+停顿的总时间单位
  const units = [];
  for (let i = 0; i < CAD_TEXT.length; i++) {
    units.push({ kind: "char", ch: CAD_TEXT[i], dur: 1 });
    const g = i + 1;
    if (g < CAD_TEXT.length && cadPauses[g] > 0) {
      units.push({
        kind: "pause",
        level: cadPauses[g],
        bad: CAD_BAD_GAPS.has(g),
        dur: cadPauses[g] === 2 ? 2.4 : 1.4,
      });
    }
  }
  const totalU = units.reduce((s, u) => s + u.dur, 0);
  const scaleX = rightW / Math.max(1, totalU);

  // 基准轨道线
  const midY = barAreaY + barAreaH * 0.52;
  cadCtx.strokeStyle = "rgba(239,230,210,0.18)";
  cadCtx.lineWidth = 1;
  cadCtx.beginPath();
  cadCtx.moveTo(rightX, midY);
  cadCtx.lineTo(rightX + rightW, midY);
  cadCtx.stroke();

  cadCtx.font = `500 11px "DM Mono", monospace`;
  cadCtx.fillStyle = PALETTE.creamMuted;
  cadCtx.fillText("CADENCE SCORE · 声调与气口拍点", rightX, barAreaY - 16);

  // 动态扫读游标（静止模式停在 62% 位置）
  const phase = still ? 0.62 : (t * 0.24) % 1;
  const cursorX = rightX + phase * rightW;

  let ux = rightX;
  for (const u of units) {
    const uw = u.dur * scaleX;
    if (u.kind === "char") {
      const hBar = Math.min(barAreaH * 0.54, 42);
      const isLit = cursorX >= ux && cursorX <= ux + uw;
      cadCtx.fillStyle = isLit ? PALETTE.limeBright : "rgba(239, 230, 210, 0.72)";
      cadCtx.fillRect(ux + 1, midY - hBar * 0.65, Math.max(3, uw - 2), hBar * 0.65);
      cadCtx.font = `600 ${Math.max(10, Math.min(13, uw * 0.78)).toFixed(0)}px "Noto Sans SC", sans-serif`;
      cadCtx.fillStyle = PALETTE.creamDim;
      cadCtx.textAlign = "center";
      cadCtx.fillText(u.ch, ux + uw * 0.5, midY + 10);
      cadCtx.textAlign = "left";
    } else {
      // 停顿休止符区块
      cadCtx.fillStyle = u.bad ? "rgba(255,122,92,0.22)" : "rgba(190,200,25,0.16)";
      cadCtx.fillRect(ux + 1, midY - 26, Math.max(4, uw - 2), 52);
      cadCtx.strokeStyle = u.bad ? PALETTE.warn : PALETTE.lime;
      cadCtx.lineWidth = u.level === 2 ? 2.5 : 1.5;
      cadCtx.beginPath();
      cadCtx.moveTo(ux + uw * 0.5, midY - 24);
      cadCtx.lineTo(ux + uw * 0.5, midY + 24);
      cadCtx.stroke();
    }
    ux += uw;
  }

  // 扫描游标线
  cadCtx.strokeStyle = PALETTE.limeBright;
  cadCtx.lineWidth = 1.5;
  cadCtx.beginPath();
  cadCtx.moveTo(cursorX, barAreaY);
  cadCtx.lineTo(cursorX, barAreaY + barAreaH);
  cadCtx.stroke();
}

let cadLoop = null;
function refreshCadence() {
  buildTokenRail();
  updateCadReadout();
  cadDirty = true;
  if (cadLoop) cadLoop.draw();
}

cadLoop = loop(cadCanvas, (t, dt, { still }) => {
  drawCadence(t, still);
  cadDirty = false;
});

ceLeadingInput.addEventListener("input", () => {
  cadLeading = +ceLeadingInput.value;
  ceLeadingOut.textContent = `${cadLeading.toFixed(2)}×`;
  updateCadReadout();
  cadDirty = true;
  if (cadLoop) cadLoop.draw();
});

document.querySelectorAll(".ce-pre").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".ce-pre").forEach((b) => b.classList.toggle("is-active", b === btn));
    cadPauses = new Array(CAD_TEXT.length).fill(0);
    if (btn.dataset.ce === "poster") {
      cadPauses[4] = 1;
      cadPauses[9] = 2;
      cadLeading = 1.18;
    } else if (btn.dataset.ce === "monologue") {
      cadPauses[9] = 2;
      cadLeading = 1.32;
    } else {
      cadPauses[3] = 1;
      cadPauses[7] = 1;
      cadPauses[11] = 1;
      cadPauses[13] = 2;
      cadLeading = 1.04;
    }
    ceLeadingInput.value = cadLeading.toFixed(2);
    ceLeadingOut.textContent = `${cadLeading.toFixed(2)}×`;
    refreshCadence();
  });
});

refreshCadence();

// =========================================================
// 5. 第 04 节：从题词到杂志引语（年代切换）
// =========================================================
const ERAS = [
  {
    meta: "16TH–19TH CENTURY · EPIGRAPH & MARGINALIA",
    title: "书页留白里先放一句话，替整章定调",
    body: `在铅活字书籍普及后的数百年里，出版人习惯在书卷或章节开头单独辟出一片留白，排入一句短小题词（Epigraph），并在书页侧边保留提要边注。那时它还克制而小巧，但核心逻辑已经诞生：先给读者一句浓缩的观点，再开启漫长的正文旅程。若是单纯用来做章节分隔、不主打某句人声观点，则属于隔壁的 <a href="https://layout.xiaoxiaodong.ai/161/play/" target="_blank" rel="noopener">161 章节扉页</a>。`,
    source: "延伸脉络：西方书籍设计中的 Epigraph（卷首题词）与 Rubrication 传统。",
  },
  {
    meta: "1928 · JAN TSCHICHOLD · DIE NEUE TYPOGRAPHIE",
    title: "打破居中对称，把排印转向“为阅读组织层次”",
    body: "1928 年，扬·奇肖尔德（Jan Tschichold）在柏林出版《新排版》（Die neue Typographie），主张抛弃死板的古典中轴装饰，改用不对称布局、强烈的字号对比与留白节奏直接服务信息传达。正是这种“按信息重要度决定视觉体量”的思维，让引语具备了离开正文独立称王的理论根基。",
    source: "核实书目：Jan Tschichold，《Die neue Typographie》，1928 年首版。",
  },
  {
    meta: "1934–1958 · ALEXEY BRODOVITCH · HARPER'S BAZAAR",
    title: "杂志跨页把摘录引语变成翻页里的视觉钩子",
    body: `1934 至 1958 年间，阿列克谢·布罗多维奇（Alexey Brodovitch）出任《Harper's Bazaar》艺术指导，用电影剪辑般的节奏重构杂志跨页：大面积留白、倾斜或放大的人物言论、鲜明的黑白反差，彻底打破传统报刊均匀的灰字海。从此，人物特稿里把金句拎出来做视觉锚点（Pull Quote）成了现代期刊的标志手法，并与 <a href="https://layout.xiaoxiaodong.ai/163/play/" target="_blank" rel="noopener">163 特写跨页</a> 长期配合使用。`,
    source: "核实档案：Alexey Brodovitch 任《Harper's Bazaar》艺术指导（1934–1958），MoMA 馆藏记录。",
  },
  {
    meta: "1981 · JOSEF MÜLLER-BROCKMANN · GRID SYSTEMS",
    title: "网格与排印秩序：帮读者更快读懂、更久记住",
    body: "1981 年，瑞士平面设计师约瑟夫·米勒-布罗克曼（1914–1996）通过 Verlag Arthur Niggli 出版德英双语《平面设计中的网格系统》（Grid Systems in Graphic Design）。全书 176 页以 8 到 32 格网格为例，系统论述排版绝不是设计师自我表现的画布，而是帮读者理清层级、降低阅读阻力的理性结构。",
    source: "核实书目：Josef Müller-Brockmann，《Grid Systems in Graphic Design》，Arthur Niggli，1981。",
  },
  {
    meta: "1992 & 2004 · BRINGHURST & LUPTON",
    title: "微观标点与宏观界面：引语版式写入当代教科书",
    body: "1992 年 Robert Bringhurst 在《字体排印风格要素》（Hartley & Marks 首版）里将悬挂标点、行长与韵律确立为排印细部准绳；2004 年 Ellen Lupton 在《字体设计思考》（Princeton Architectural Press 首版）里进一步指出：现代读者多以扫描方式进入页面，引语与小标题就像读者出入文字洪流的接口。",
    source: "核实书目：Bringhurst (1992)《The Elements of Typographic Style》；Lupton (2004)《Thinking with Type》。",
  },
];

const tdMeta = document.getElementById("td-meta");
const tdTitle = document.getElementById("td-title");
const tdBody = document.getElementById("td-body");
const tdSource = document.getElementById("td-source");

document.querySelectorAll(".tl-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const era = ERAS[+tab.dataset.era];
    if (!era) return;
    document.querySelectorAll(".tl-tab").forEach((b) => {
      const on = b === tab;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    tdMeta.textContent = era.meta;
    tdTitle.textContent = era.title;
    tdBody.innerHTML = era.body;
    tdSource.textContent = era.source;
  });
});

// =========================================================
// 6. 第 05 节：什么时候别用它（四场景体检）
// =========================================================
const AVOIDS = {
  deep: {
    title: "在严密论证正文中硬插大引语，会截断读者的逻辑链",
    body: "论文、技术规格、法律条款或连贯叙事依赖段落之间的严密推演。Nielsen Norman Group 的在线阅读眼动研究曾实证：读者在深度线性阅读时，一旦中途撞上抢眼的行内摘录引语，注意力往往骤降，此后直接滑成草草跳读。",
    alt: `把引语挪到整章开始前作独立题词，或者只在章节转场处用克制的 <a href="https://layout.xiaoxiaodong.ai/161/play/" target="_blank" rel="noopener">161 章节扉页</a> / <a href="https://layout.xiaoxiaodong.ai/162/play/" target="_blank" rel="noopener">162 栏目开启页</a> 换气，绝不拦腰切断论证段落。`,
  },
  lookup: {
    title: "读者来查页码和词条时，巨型引语只会挡路",
    body: "工具书目录、术语索引、API 文档的目标是“用最少眼动找到精确条目”。在这种高频检索页上塞进大幅留白和情绪化大引语，等于在字典正中央塞进一张广告海报，迫使读者多翻页、多滚动。",
    alt: `按结构查章节请用 <a href="https://layout.xiaoxiaodong.ai/164/play/" target="_blank" rel="noopener">164 目录版式</a>，按字母或分类切口查词条请用 <a href="https://layout.xiaoxiaodong.ai/165/play/" target="_blank" rel="noopener">165 索引版式</a>。`,
  },
  catalog: {
    title: "需要横向比较十件作品或产品时，一句话撑不住全貌",
    body: "画册、藏品图录、工业设计年鉴的读者要的是同一尺度下的横向对照，而不是听编辑用一句宏大箴言替自己下结论。用引语占满主屏会压缩原本宝贵的展品陈列面积。",
    alt: `多标本对比交给 <a href="https://layout.xiaoxiaodong.ai/166/play/" target="_blank" rel="noopener">166 图录版式</a>；如果要同时兼顾视觉门面或长篇人物故事，则分别交给 <a href="https://layout.xiaoxiaodong.ai/160/play/" target="_blank" rel="noopener">160 封面版式</a> 与 <a href="https://layout.xiaoxiaodong.ai/163/play/" target="_blank" rel="noopener">163 特写跨页</a>。`,
  },
  hollow: {
    title: "句子本身是空洞口号，放大到 96px 只会放大尴尬",
    body: "Matthew Butterick 在《Practical Typography》里批评过“用大段引用掩盖缺乏分析”的毛病。引语主导版式是一台语义放大镜——如果选出来的句子只是“以创新赋能未来”这类毫无信息量的套话，再讲究的引号和笔刷也救不了它。",
    alt: "先回到原稿里挑出一句有具体观察、有反差、且离开上下文也能独立成立的真原话；如果全文找不到这样一句，就老老实实用常规标题加视觉图，不要硬做引语页。",
  },
};

const avTitle = document.getElementById("av-title");
const avBody = document.getElementById("av-body");
const avAltBody = document.getElementById("av-alt-body");

document.querySelectorAll(".av-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const item = AVOIDS[tab.dataset.av];
    if (!item) return;
    document.querySelectorAll(".av-tab").forEach((b) => {
      const on = b === tab;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    avTitle.textContent = item.title;
    avBody.textContent = item.body;
    avAltBody.innerHTML = item.alt;
  });
});

// =========================================================
// 7. 第 06 节：四版校样挑一版（单变量小练习）
// =========================================================
const QUIZ_ANS = {
  A: {
    ok: false,
    title: "校样 A 欠妥：末尾孤字吊尾，收拍失重",
    body: "这一版顺着容器宽度自然换行，结果第一行塞得过满，最后一行只掉出一个孤零零的「哪。」。收尾最需要笃定感，吊尾孤字会让整句观点像突然泄了气。正确答案是校样 C。",
  },
  B: {
    ok: false,
    title: "校样 B 欠妥：为了凑方框把词组硬劈开",
    body: "单看外轮廓似乎最像整齐的矩形，但你一默读就会发现「听 / 懂」「决 / 定」被拦腰劈成两半，读起来处处卡喉。组织阅读优先服从语义词界，而不是强凑等宽方块。正确答案是校样 C。",
  },
  C: {
    ok: true,
    title: "判断准确：校样 C 的三拍气口最顺畅",
    body: "「好建筑 / 先听懂风向， / 再决定墙立在哪。」恰好切出“立题（3 字）— 承接（6 字）— 收束（7 字）”三拍递增阶梯。无劈词、无孤字、逗号留在行尾自然收气，眼睛一扫就能读出作者的停顿与强调。",
  },
  D: {
    ok: false,
    title: "校样 D 欠妥：切得过碎，视线被迫高频折返",
    body: "每行只留两三个字，把一句连贯的观点剁成 6 行窄柱，不仅上下留白被吃掉一大半，眼睛也得来回跳 6 次才能拼完一句话，节奏从笃定变成了结巴。正确答案是校样 C。",
  },
};

const quizVerdict = document.getElementById("quiz-verdict");
const qvTitle = document.getElementById("qv-title");
const qvBody = document.getElementById("qv-body");

document.querySelectorAll(".proof-card").forEach((card) => {
  card.addEventListener("click", () => {
    const ch = card.dataset.choice;
    const res = QUIZ_ANS[ch];
    if (!res) return;
    document.querySelectorAll(".proof-card").forEach((c) => {
      c.classList.remove("is-picked", "is-correct", "is-wrong");
      c.setAttribute("aria-pressed", String(c === card));
      if (c.dataset.choice === "C") c.classList.add("is-correct");
    });
    card.classList.add("is-picked", res.ok ? "is-correct" : "is-wrong");
    quizVerdict.classList.toggle("is-correct", res.ok);
    quizVerdict.classList.toggle("is-wrong", !res.ok);
    qvTitle.textContent = res.title;
    qvBody.textContent = res.body;
  });
});

// =========================================================
// 8. 第 07 节：原海报放大与拖拽灯箱（只复用 #poster.src）
// =========================================================
const posterImg = document.getElementById("poster");
const posterTrigger = document.getElementById("poster-trigger");
const lightbox = document.getElementById("lightbox");
const lbViewport = document.getElementById("lb-viewport");
const lbImg = document.getElementById("lb-img");
const lbZoomVal = document.getElementById("lb-zoom-val");
const lbZoomIn = document.getElementById("lb-zoom-in");
const lbZoomOut = document.getElementById("lb-zoom-out");
const lbReset = document.getElementById("lb-reset");
const lbClose = document.getElementById("lb-close");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = false;
let lbStartX = 0;
let lbStartY = 0;

function updateLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbZoomVal.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1.2;
  lbX = 0;
  lbY = 0;
  updateLbTransform();
  lightbox.hidden = false;
  lbClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbZoomIn.addEventListener("click", () => {
  lbScale = Math.min(3.2, +(lbScale + 0.3).toFixed(2));
  updateLbTransform();
});
lbZoomOut.addEventListener("click", () => {
  lbScale = Math.max(0.7, +(lbScale - 0.3).toFixed(2));
  updateLbTransform();
});
lbReset.addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  updateLbTransform();
});

lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target === lbViewport && lbScale <= 1.05) {
    closeLightbox();
    return;
  }
  lbDrag = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  lbViewport.classList.add("is-dragging");
});
window.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbStartX;
  lbY = e.clientY - lbStartY;
  updateLbTransform();
});
window.addEventListener("pointerup", () => {
  lbDrag = false;
  lbViewport.classList.remove("is-dragging");
});
lbViewport.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.16 : -0.16;
    lbScale = Math.max(0.7, Math.min(3.2, +(lbScale + delta).toFixed(2)));
    updateLbTransform();
  },
  { passive: false }
);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

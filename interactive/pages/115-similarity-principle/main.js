import { defaultState, PRESETS, evaluate, PALETTE } from "./model.js";
import { mountHeroStage } from "./hero-stage.js";

// ==================== 开场：跨位编码分拣盘 ====================
let state = defaultState();

const heroCanvas = document.getElementById("hero-canvas");
const statusPill = document.getElementById("hero-status-pill");
const titleDemo = document.getElementById("title-demo");
const diagBox = document.getElementById("diag-box");
const diagBadge = document.getElementById("diag-badge");
const diagTitle = document.getElementById("diag-title");
const diagWhy = document.getElementById("diag-why");
const diagAction = document.getElementById("diag-action");
const mPurity = document.getElementById("m-purity");
const mGroups = document.getElementById("m-groups");
const mMix = document.getElementById("m-mix");
const mCohesion = document.getElementById("m-cohesion");
const mixSlider = document.getElementById("mix-slider");
const mixSliderVal = document.getElementById("mix-slider-val");
const btnLinks = document.getElementById("btn-links");
const btnGray = document.getElementById("btn-gray");

const kwEls = [0, 1, 2, 3].map((i) => document.getElementById(`kw-${i}`));
const pillarEls = [0, 1, 2].map((i) => document.getElementById(`pillar-tag-${i}`));
let lastCode = "";
let lastPass = -1;

const heroStage = mountHeroStage(
  heroCanvas,
  () => state,
  (next, isDragFrame) => {
    state = next;
    if (!isDragFrame) {
      syncHeroUI();
      heroStage.redraw();
    }
  },
  (ev) => {
    // 拖动期间走极轻路径：仅更新混排数字；状态切换时才全量同步 DOM
    const pct = `${ev.metrics.mixPct}%`;
    if (mMix.textContent !== pct) {
      mMix.textContent = pct;
      mixSlider.value = String(ev.metrics.mixPct);
      mixSliderVal.textContent = pct;
      mCohesion.textContent = `${ev.metrics.cohesionPct}%`;
      if (kwEls[3]) kwEls[3].textContent = ev.keywords[3].status;
      if (pillarEls[1]) pillarEls[1].textContent = ev.pillars[1].status;
    }
    if (ev.code !== lastCode || ev.passCount !== lastPass) {
      syncHeroUI(ev);
    }
  }
);

function syncHeroUI(preEvaluated) {
  const ev = preEvaluated || evaluate(state);
  lastCode = ev.code;
  lastPass = ev.passCount;

  // 顶栏状态徽
  statusPill.textContent = ev.badge;
  statusPill.className = `status-pill ${ev.passCount === 4 ? "is-pass" : "is-warn"}`;

  // 标题旁自示范三枚几何标（实时反映当前编码状态）
  const demoDots = titleDemo.querySelectorAll(".td-dot");
  const cols = state.grayscale
    ? ["#6D6D6D", "#1D1D1D", "#C8C1B4"]
    : state.colorRule === "mono"
      ? [PALETTE.black, PALETTE.black, PALETTE.black]
      : state.colorRule === "collide"
        ? [PALETTE.green, PALETTE.green, PALETTE.sand]
        : state.colorRule === "aligned"
          ? [PALETTE.green, PALETTE.black, PALETTE.sand]
          : [PALETTE.coral, PALETTE.sand, PALETTE.green];

  demoDots.forEach((el, i) => {
    el.style.backgroundColor = cols[i];
    el.style.borderRadius =
      state.shapeRule === "uniform"
        ? "50%"
        : state.shapeRule === "aligned"
          ? (i === 0 ? "50%" : i === 1 ? "2px" : "2px")
          : (i === 1 ? "50%" : "2px");
    el.style.clipPath =
      state.shapeRule === "aligned" && i === 2
        ? "polygon(50% 0%, 100% 100%, 0% 100%)"
        : "none";
    el.style.transform =
      state.sizeRule === "aligned"
        ? `scale(${i === 0 ? 1.15 : i === 1 ? 0.92 : 0.72})`
        : "scale(1)";
  });

  // 顶部四栏关键词实时标签
  ev.keywords.forEach((kw, i) => {
    const el = document.getElementById(`kw-${i}`);
    if (!el) return;
    el.textContent = kw.status;
    el.className = `kw-live ${kw.ok ? "is-ok" : ""}`;
  });

  // 底部原海报三黑圆要点柱实时标签
  ev.pillars.forEach((p, i) => {
    const el = document.getElementById(`pillar-tag-${i}`);
    if (!el) return;
    el.textContent = p.status;
    el.className = `pillar-tag ${p.ok ? "is-ok" : ""}`;
  });

  // 单真源白话诊单
  diagBox.className = `dock-diag ${ev.passCount === 4 ? "is-pass" : ""}`;
  diagBadge.className = `diag-badge ${ev.passCount === 4 ? "is-pass" : "is-warn"}`;
  diagBadge.textContent = ev.passCount === 4
    ? `达标 · ${ev.solutionKind}（4 / 4）`
    : `错态 · ${labelOfCode(ev.code)}（${ev.passCount} / 4）`;
  diagTitle.textContent = ev.title;
  diagWhy.textContent = ev.why;
  diagAction.textContent = ev.action;

  mPurity.textContent = `${ev.metrics.purityPct}%`;
  mGroups.textContent = `${ev.metrics.uniqueGroups} / 3`;
  mMix.textContent = `${ev.metrics.mixPct}%`;
  mCohesion.textContent = `${ev.metrics.cohesionPct}%`;

  // 同步按钮与滑块
  mixSlider.value = String(ev.metrics.mixPct);
  mixSliderVal.textContent = `${ev.metrics.mixPct}%`;

  document.querySelectorAll(".tab-btn[data-theme]").forEach((btn) => {
    const active = btn.dataset.theme === state.theme;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  document.querySelectorAll(".ctrl-btn[data-rule]").forEach((btn) => {
    const active = state[btn.dataset.rule] === btn.dataset.val;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  btnLinks.classList.toggle("is-on", state.showLinks);
  btnLinks.setAttribute("aria-pressed", String(state.showLinks));
  btnLinks.textContent = `归类连线：${state.showLinks ? "开" : "关"}`;

  btnGray.classList.toggle("is-on", state.grayscale);
  btnGray.setAttribute("aria-pressed", String(state.grayscale));
  btnGray.textContent = `灰度色觉检视：${state.grayscale ? "开" : "关"}`;
}

function labelOfCode(code) {
  const map = {
    chaos: "杂烩失群",
    stray: "漏网叛徒",
    collide: "撞衫混群",
    conflict: "色形打架",
    "color-only": "单色失明",
    "size-noise": "尺差干扰",
    proximity: "借势邻近",
    overload: "花屏过载",
  };
  return map[code] || "待理群";
}

document.querySelectorAll(".tab-btn[data-theme]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state = { ...state, theme: btn.dataset.theme };
    syncHeroUI();
    heroStage.redraw();
  });
});

document.querySelectorAll(".preset-btn[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const fn = PRESETS[btn.dataset.preset];
    if (!fn) return;
    state = fn(state);
    syncHeroUI();
    heroStage.redraw();
  });
});

document.querySelectorAll(".ctrl-btn[data-rule]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const rule = btn.dataset.rule;
    const val = btn.dataset.val;
    state = { ...state, [rule]: val, overrides: {} };
    syncHeroUI();
    heroStage.redraw();
  });
});

mixSlider.addEventListener("input", () => {
  state = { ...state, mix: Number(mixSlider.value) / 100 };
  syncHeroUI();
  heroStage.redraw();
});

btnLinks.addEventListener("click", () => {
  state = { ...state, showLinks: !state.showLinks };
  syncHeroUI();
  heroStage.redraw();
});

btnGray.addEventListener("click", () => {
  state = { ...state, grayscale: !state.grayscale };
  syncHeroUI();
  heroStage.redraw();
});

syncHeroUI();

// ==================== 01 · 五维等距棋盘扫寻测验 ====================
const S1_TARGETS = new Set([2, 7, 10, 14, 19, 22]);
const S1_META = {
  color: { name: "纯颜色", prompt: "找出全部 6 枚翠绿圆（形状与大小全同）", why: "纯颜色走视觉皮层早期并行通路，无需逐格扫读就能一眼「跳出」。" },
  size: { name: "纯大小", prompt: "找出全部 6 枚大号墨黑圆（约 1.8× 面积差）", why: "拉开明显尺度跨度后，大号图形也会很快成组，但跨距很远时仍略逊于强色相。" },
  shape: { name: "纯形状", prompt: "找出全部 6 枚墨黑三角形（颜色与面积相近）", why: "没有颜色帮忙时，人眼需要更仔细辨认边角轮廓，扫齐 6 枚通常明显更费时。" },
  orient: { name: "纯朝向", prompt: "找出全部 6 枚斜向 45° 的墨黑胶囊（其余为水平）", why: "大倾角朝向仍有不错辨识度，但比纯颜色更容易被周围密集笔画淹没。" },
  dual: { name: "色形双维", prompt: "找出全部 6 枚翠绿三角形（颜色 + 形状双重对齐）", why: "双维协同兼具颜色的瞬间抓群和形状的黑白兜底，是信息设计最稳的黄金组合。" },
};

let s1Mode = "color";
let s1Running = false;
let s1StartAt = 0;
let s1Found = new Set();
let s1Revealed = false;

const s1Board = document.getElementById("s1-board");
const s1Readout = document.getElementById("s1-readout");
const s1StartBtn = document.getElementById("s1-start");
const s1RevealBtn = document.getElementById("s1-reveal");

function svgForS1(idx, mode) {
  const isT = S1_TARGETS.has(idx);
  if (mode === "color") {
    const fill = isT ? PALETTE.green : (idx % 2 === 0 ? PALETTE.black : "#8C7A5B");
    return `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><circle cx="20" cy="20" r="12" fill="${fill}"/></svg>`;
  }
  if (mode === "size") {
    const r = isT ? 15.5 : 8.5;
    return `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><circle cx="20" cy="20" r="${r}" fill="${PALETTE.black}"/></svg>`;
  }
  if (mode === "shape") {
    if (isT) return `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><polygon points="20,6 34,32 6,32" fill="${PALETTE.black}"/></svg>`;
    return idx % 2 === 0
      ? `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><circle cx="20" cy="20" r="12" fill="${PALETTE.black}"/></svg>`
      : `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><rect x="9" y="9" width="22" height="22" fill="${PALETTE.black}"/></svg>`;
  }
  if (mode === "orient") {
    const deg = isT ? -45 : 0;
    return `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><rect x="7" y="15" width="26" height="10" rx="5" fill="${PALETTE.black}" transform="rotate(${deg} 20 20)"/></svg>`;
  }
  // dual
  if (isT) return `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><polygon points="20,6 34,32 6,32" fill="${PALETTE.green}"/></svg>`;
  return idx % 2 === 0
    ? `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><circle cx="20" cy="20" r="11.5" fill="${PALETTE.black}"/></svg>`
    : `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><rect x="9.5" y="9.5" width="21" height="21" fill="#A58A5E"/></svg>`;
}

function renderS1Board() {
  s1Board.innerHTML = "";
  for (let i = 0; i < 24; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "s1-cell";
    if (s1Found.has(i)) btn.classList.add("is-found");
    if (s1Revealed && S1_TARGETS.has(i)) btn.classList.add("is-revealed");
    btn.dataset.idx = String(i);
    btn.setAttribute("aria-label", `第 ${i + 1} 格`);
    btn.innerHTML = svgForS1(i, s1Mode);
    btn.addEventListener("click", () => handleS1Click(i, btn));
    s1Board.appendChild(btn);
  }
}

function handleS1Click(idx, btn) {
  if (s1Revealed) {
    s1Revealed = false;
    s1Found.clear();
  }
  if (!s1Running) {
    s1Running = true;
    s1StartAt = performance.now();
  }
  if (S1_TARGETS.has(idx)) {
    s1Found.add(idx);
    btn.classList.add("is-found");
    if (s1Found.size === S1_TARGETS.size) {
      const sec = ((performance.now() - s1StartAt) / 1000).toFixed(2);
      s1Running = false;
      const m = S1_META[s1Mode];
      s1Readout.textContent = `${m.name}用时 ${sec} 秒找齐 6 枚！${m.why}`;
    } else {
      s1Readout.textContent = `已找到 ${s1Found.size} / 6 枚，继续点出其余目标……`;
    }
  } else {
    btn.classList.add("is-miss");
    setTimeout(() => btn.classList.remove("is-miss"), 320);
    s1Readout.textContent = `这格不是目标（当前已找 ${s1Found.size} / 6 枚）——试着先靠整体特征扫视。`;
  }
}

document.querySelectorAll(".mode-btn[data-s1]").forEach((btn) => {
  btn.addEventListener("click", () => {
    s1Mode = btn.dataset.s1;
    s1Running = false;
    s1Revealed = false;
    s1Found.clear();
    document.querySelectorAll(".mode-btn[data-s1]").forEach((b) => {
      const a = b.dataset.s1 === s1Mode;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", String(a));
    });
    const m = S1_META[s1Mode];
    s1Readout.textContent = `当前：${m.name} · ${m.prompt}`;
    renderS1Board();
  });
});

s1StartBtn.addEventListener("click", () => {
  s1Found.clear();
  s1Revealed = false;
  s1Running = true;
  s1StartAt = performance.now();
  const m = S1_META[s1Mode];
  s1Readout.textContent = `计时已开始！请点齐 6 枚：${m.prompt}`;
  renderS1Board();
});

s1RevealBtn.addEventListener("click", () => {
  s1Running = false;
  s1Revealed = true;
  const m = S1_META[s1Mode];
  s1Readout.textContent = `已高亮全部 6 枚目标（${m.name}）。${m.why}`;
  renderS1Board();
});

renderS1Board();

// ==================== 02 · 色形拔河 6×6 矩阵 ====================
const s2Svg = document.getElementById("s2-svg");
const s2RowRange = document.getElementById("s2-row-color");
const s2ColRange = document.getElementById("s2-col-shape");
const s2RowVal = document.getElementById("s2-row-val");
const s2ColVal = document.getElementById("s2-col-val");
const s2ProxBtn = document.getElementById("s2-prox");
const s2TieBtn = document.getElementById("s2-tie");
const s2VTitle = document.getElementById("s2-v-title");
const s2VBody = document.getElementById("s2-v-body");

let s2ProxOn = false;

function lerpHex(hexA, hexB, t) {
  const pa = [1, 3, 5].map((i) => parseInt(hexA.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(hexB.slice(i, i + 2), 16));
  const m = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${m.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function renderS2() {
  const rowC = Number(s2RowRange.value) / 100;
  const colS = Number(s2ColRange.value) / 100;
  s2RowVal.textContent = `${Math.round(rowC * 100)}%`;
  s2ColVal.textContent = `${Math.round(colS * 100)}%`;

  // 经验示意权重：颜色天生略强于纯形状；若开启竖列邻近拉扯，竖列额外获得空间权重
  const rowForce = rowC * 1.18;
  const colForce = colS * 0.92 + (s2ProxOn ? 0.42 : 0);
  const diff = rowForce - colForce;

  const neutral = "#4B463C";
  const rowTargets = [PALETTE.green, PALETTE.black, "#C99A48"];

  const cols = 6;
  const rows = 6;
  const padX = s2ProxOn ? 78 : 54;
  const padY = 44;
  const w = 540 - padX * 2;
  const h = 380 - padY * 2;
  const dx = w / (cols - 1);
  const dy = h / (rows - 1);

  let out = `<rect x="0" y="0" width="540" height="380" rx="10" fill="#FAF4E7"/>`;

  // 轻弱方向提示带（随主导方向显现）
  if (diff > 0.16) {
    for (let r = 0; r < rows; r++) {
      const y = padY + r * dy;
      out += `<line x1="${padX - 18}" y1="${y}" x2="${540 - padX + 18}" y2="${y}" stroke="${lerpHex(neutral, rowTargets[r % 3], rowC)}" stroke-opacity="0.22" stroke-width="14" stroke-linecap="round"/>`;
    }
  } else if (diff < -0.16) {
    for (let c = 0; c < cols; c++) {
      const x = padX + c * dx + (s2ProxOn ? (c % 2 === 0 ? -8 : 8) : 0);
      out += `<line x1="${x}" y1="${padY - 16}" x2="${x}" y2="${380 - padY + 16}" stroke="#1D1D1D" stroke-opacity="0.14" stroke-width="16" stroke-linecap="round"/>`;
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = padX + c * dx + (s2ProxOn ? (c % 2 === 0 ? -8 : 8) : 0);
      const cy = padY + r * dy;
      const fill = lerpHex(neutral, rowTargets[r % 3], rowC);
      const isColOdd = c % 2 === 1;
      // 竖列交替：偶列保持偏圆偏大，奇列逐渐收成锐方略小
      const size = (isColOdd ? 15 - 3.6 * colS : 15 + 3.2 * colS) * 2;
      const rx = isColOdd ? Math.max(1.5, (size / 2) * (1 - colS * 0.92)) : size / 2;
      out += `<rect x="${(cx - size / 2).toFixed(1)}" y="${(cy - size / 2).toFixed(1)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}" rx="${rx.toFixed(1)}" fill="${fill}"/>`;
    }
  }

  // 坐标标尺微字
  out += `<text x="20" y="24" font-size="12" font-family="Noto Sans SC, sans-serif" font-weight="700" fill="#4A4336">横行：颜色分排（${Math.round(rowC * 100)}%）</text>`;
  out += `<text x="520" y="24" text-anchor="end" font-size="12" font-family="Noto Sans SC, sans-serif" font-weight="700" fill="#4A4336">竖列：形尺分列（${Math.round(colS * 100)}%）</text>`;
  s2Svg.innerHTML = out;

  if (rowC < 0.12 && colS < 0.12 && !s2ProxOn) {
    s2VTitle.textContent = "无差异均质阵 · 既不成行也不成列";
    s2VBody.textContent = "横竖两个方向的反差都太弱，36 个图形退化成一块均质灰布。把任意一条滑块向右拉，观察分组瞬间浮现。";
  } else if (diff > 0.18) {
    s2VTitle.textContent = "横行占优 · 颜色把画面拉成 6 条横带";
    s2VBody.textContent = "横行颜色反差胜出，视线自然顺着同色水平扫读。即使竖列暗藏形状变化，人眼也会先服从更强的颜色分组。";
  } else if (diff < -0.18) {
    s2VTitle.textContent = s2ProxOn ? "竖列翻盘 · 形尺与邻近联手压过颜色" : "竖列占优 · 强烈形尺差把画面立成竖栏";
    s2VBody.textContent = s2ProxOn
      ? "当竖列既拉大圆方与大小差、又收窄列内间距时，邻近性与形状合力反超了颜色，整张图立刻切换成竖向列感。"
      : "横行色差被压低后，圆与方的轮廓和面积差接管主导权，眼睛自上而下把同类连成竖列。";
  } else {
    s2VTitle.textContent = "50:50 僵持拉扯 · 视觉通道互相打架";
    s2VBody.textContent = "横行颜色和竖列形尺势均力敌，眼睛一会看成横条、一会看成竖列。真实排版里要极力避免这种正交拔河：给主维度绝对优势，弱化次维度。";
  }
}

s2RowRange.addEventListener("input", renderS2);
s2ColRange.addEventListener("input", renderS2);
s2ProxBtn.addEventListener("click", () => {
  s2ProxOn = !s2ProxOn;
  s2ProxBtn.setAttribute("aria-pressed", String(s2ProxOn));
  s2ProxBtn.textContent = `加入竖列邻近拉扯：${s2ProxOn ? "开" : "关"}`;
  renderS2();
});
s2TieBtn.addEventListener("click", () => {
  s2RowRange.value = "62";
  s2ColRange.value = "80";
  s2ProxOn = false;
  s2ProxBtn.setAttribute("aria-pressed", "false");
  s2ProxBtn.textContent = "加入竖列邻近拉扯：关";
  renderS2();
});

renderS2();

// ==================== 03 · 暗室验真：轨交线路与 WCAG 1.4.1 ====================
const s3World = document.getElementById("s3-world");
const s3Badge = document.getElementById("s3-badge");
const s3Title = document.getElementById("s3-title");
const s3Body = document.getElementById("s3-body");
const s3Checks = document.getElementById("s3-checks");

let s3Vision = "normal";
let s3Enc = "colorOnly";

function renderS3() {
  const filterAttr =
    s3Vision === "deutan" ? 'filter="url(#flt-deutan)"' :
    s3Vision === "bw" ? 'filter="url(#flt-bw)"' :
    s3Vision === "low" ? 'filter="url(#flt-low)"' : "";

  const isRedundant = s3Enc === "redundant";
  const isOverload = s3Enc === "overload";

  // 故意选用在红绿色弱与黑白下明度接近的翠绿(#1B8A59)与砖红(#D94826)对比
  const c1 = "#1B8A59";
  const c2 = "#D94826";
  const c3 = "#E8B72A";

  const d1 = "M 55 95 L 220 95 L 340 190 L 520 190 L 680 110";
  const d2 = "M 55 245 L 200 245 L 340 140 L 490 140 L 680 250";
  const d3 = "M 140 50 L 290 165 L 430 275 L 660 275";

  const pts1 = [[55, 95], [220, 95], [340, 190], [520, 190], [680, 110]];
  const pts2 = [[55, 245], [200, 245], [340, 140], [490, 140], [680, 250]];
  const pts3 = [[140, 50], [290, 165], [430, 275], [660, 275]];

  let g = `<g ${filterAttr}>`;
  g += `<rect x="0" y="0" width="740" height="340" rx="8" fill="#171815"/>`;
  // 网格暗线
  for (let x = 80; x < 720; x += 80) g += `<line x1="${x}" y1="20" x2="${x}" y2="320" stroke="#262822" stroke-width="1"/>`;
  for (let y = 60; y < 320; y += 60) g += `<line x1="20" y1="${y}" x2="720" y2="${y}" stroke="#262822" stroke-width="1"/>`;

  if (!isOverload) {
    // 三条核心线
    g += `<path d="${d1}" fill="none" stroke="${c1}" stroke-width="${isRedundant ? 6 : 5.5}" stroke-linecap="round" stroke-linejoin="round"/>`;
    g += `<path d="${d2}" fill="none" stroke="${c2}" stroke-width="${isRedundant ? 5 : 5.5}" ${isRedundant ? 'stroke-dasharray="14 7"' : ""} stroke-linecap="round" stroke-linejoin="round"/>`;
    g += `<path d="${d3}" fill="none" stroke="${c3}" stroke-width="${isRedundant ? 4.5 : 5.5}" ${isRedundant ? 'stroke-dasharray="4 6"' : ""} stroke-linecap="round" stroke-linejoin="round"/>`;

    // 站点形态：仅靠颜色时全圆；双维冗余时分别用 圆 / 方 / 三角 + 线号字
    pts1.forEach(([x, y]) => {
      g += `<circle cx="${x}" cy="${y}" r="10" fill="${c1}" stroke="#171815" stroke-width="2.5"/>`;
      if (isRedundant) g += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10" font-weight="800" fill="#FFFDF7">1</text>`;
    });
    pts2.forEach(([x, y]) => {
      if (isRedundant) {
        g += `<rect x="${x - 9}" y="${y - 9}" width="18" height="18" rx="2" fill="${c2}" stroke="#171815" stroke-width="2.5"/>`;
        g += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10" font-weight="800" fill="#FFFDF7">2</text>`;
      } else {
        g += `<circle cx="${x}" cy="${y}" r="10" fill="${c2}" stroke="#171815" stroke-width="2.5"/>`;
      }
    });
    pts3.forEach(([x, y]) => {
      if (isRedundant) {
        g += `<polygon points="${x},${y - 12} ${x + 11},${y + 9} ${x - 11},${y + 9}" fill="${c3}" stroke="#171815" stroke-width="2.5"/>`;
        g += `<text x="${x}" y="${y + 6}" text-anchor="middle" font-size="9.5" font-weight="800" fill="#111111">3</text>`;
      } else {
        g += `<circle cx="${x}" cy="${y}" r="10" fill="${c3}" stroke="#171815" stroke-width="2.5"/>`;
      }
    });

    // 右上简明图例（完整列出 3 条线）
    g += `<rect x="492" y="12" width="232" height="82" rx="8" fill="#232520" stroke="#3B3D34"/>`;
    g += `<circle cx="516" cy="31" r="6" fill="${c1}"/><text x="530" y="35" font-size="12" fill="#F2EBD9">1 号快线${isRedundant ? " · 实线圆" : ""}</text>`;
    if (isRedundant) {
      g += `<rect x="510" y="46" width="12" height="12" fill="${c2}"/><text x="530" y="56" font-size="12" fill="#F2EBD9">2 号环线 · 长虚方</text>`;
      g += `<polygon points="516,66 523,78 509,78" fill="${c3}"/><text x="530" y="77" font-size="12" fill="#F2EBD9">3 号支线 · 点线三角</text>`;
    } else {
      g += `<circle cx="516" cy="52" r="6" fill="${c2}"/><text x="530" y="56" font-size="12" fill="#F2EBD9">2 号环线</text>`;
      g += `<circle cx="516" cy="73" r="6" fill="${c3}"/><text x="530" y="77" font-size="12" fill="#F2EBD9">3 号支线</text>`;
    }
  } else {
    // 7 色过载花屏模式
    const seven = [
      { c: "#1B8A59", d: d1 },
      { c: "#D94826", d: d2 },
      { c: "#E8B72A", d: d3 },
      { c: "#4E8FE6", d: "M 60 170 L 260 170 L 420 90 L 660 185" },
      { c: "#B56BE0", d: "M 110 295 L 300 220 L 480 220 L 620 65" },
      { c: "#E26BA2", d: "M 95 60 L 245 260 L 445 110 L 685 205" },
      { c: "#5CC5C9", d: "M 180 40 L 360 290 L 560 95 L 690 140" },
    ];
    seven.forEach((line) => {
      g += `<path d="${line.d}" fill="none" stroke="${line.c}" stroke-width="4.5" stroke-linecap="round"/>`;
    });
    for (let i = 0; i < 21; i++) {
      const col = seven[i % seven.length].c;
      const x = 90 + (i % 7) * 90;
      const y = 85 + Math.floor(i / 7) * 85;
      g += `<circle cx="${x}" cy="${y}" r="8" fill="${col}" stroke="#171815" stroke-width="2"/>`;
    }
    g += `<rect x="468" y="16" width="256" height="36" rx="6" fill="#2B1C19" stroke="#D94826"/>`;
    g += `<text x="596" y="39" text-anchor="middle" font-size="12" font-weight="700" fill="#FFB29D">7 条等粗实线同屏混色 · 相似性过载</text>`;
  }

  g += `</g>`;
  s3World.innerHTML = g;

  // 实时更新诊单文字
  if (isOverload) {
    s3Badge.className = "s3-badge is-warn";
    s3Badge.textContent = "过载花屏 · 类别超载崩塌";
    s3Title.textContent = "7 种颜色叠在同一画幅，分组红利完全归零";
    s3Body.textContent = "相似性原则最怕贪多：一旦同屏塞进 7 种以上无形状区分的色码，哪怕正常色觉也要不停回头查图例，切换黑白或弱光后更会糊成一团灰网。";
    s3Checks.innerHTML = `<li>类别数量：7 类（超过 3–4 类瞬时辨识经验区间）</li><li>媒介抗性：黑白/色弱下大面积撞灰</li><li>改进法：合并次要路线，或改按功能分层展示</li>`;
  } else if (isRedundant) {
    s3Badge.className = "s3-badge is-pass";
    s3Badge.textContent = "双维冗余 · 全媒介稳定可读";
    s3Title.textContent = s3Vision === "normal"
      ? "颜色、形状与线型三线对齐，既快又稳"
      : "哪怕色相全失，靠线型、站形与标号依然 100% 追得住";
    s3Body.textContent = "1 号线是实线加圆站、2 号线是长虚线加方站、3 号线是点线加三角站。正常彩视下颜色负责 0.2 秒抓线，遇上红绿色弱、黑白打印或户外强反光，几何形态与虚实线型立刻接手兜底。";
    s3Checks.innerHTML = `<li>线型区分：实线 / 长虚 / 点线（高冗余）</li><li>站点形态：圆形 / 方形 / 三角 + 数字标（符合 WCAG 1.4.1）</li><li>类别数量：3 类核心路线（一眼清空）</li>`;
  } else {
    const broken = s3Vision !== "normal";
    s3Badge.className = "s3-badge is-warn";
    s3Badge.textContent = broken ? "实测失灵 · 1 号与 2 号线彻底混线" : "单色依赖 · 潜伏 WCAG 1.4.1 风险";
    s3Title.textContent = broken
      ? "剥离色相后，翠绿 1 号线与砖红 2 号线明度撞车"
      : "正常彩视下看着挺清楚，换个滤镜立刻露馅";
    s3Body.textContent = broken
      ? "你可以亲眼看到：两条交叉路线在当前滤镜下灰阶几乎一致，站点又全是圆点，乘客在交叉口根本分不清往哪边走。立刻切到「颜色 + 形状 + 线型」对比。"
      : "三条交叉路线全用等粗实线与相同圆点，只靠颜色强分。点击上面「红绿色弱模拟」或「纯黑白打印」，亲自看单色归类怎么一秒塌方。";
    s3Checks.innerHTML = `<li>线型区分：全部实线（无冗余）</li><li>站点形态：全部圆点（违反 WCAG 1.4.1）</li><li>当前环境：${s3Vision === "normal" ? "正常彩视（掩盖了风险）" : "色相已受限（风险直接暴露）"}</li>`;
  }
}

document.querySelectorAll(".dark-btn[data-vision]").forEach((btn) => {
  btn.addEventListener("click", () => {
    s3Vision = btn.dataset.vision;
    document.querySelectorAll(".dark-btn[data-vision]").forEach((b) => {
      const a = b.dataset.vision === s3Vision;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", String(a));
    });
    renderS3();
  });
});

document.querySelectorAll(".dark-btn[data-enc]").forEach((btn) => {
  btn.addEventListener("click", () => {
    s3Enc = btn.dataset.enc;
    document.querySelectorAll(".dark-btn[data-enc]").forEach((b) => {
      const a = b.dataset.enc === s3Enc;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", String(a));
    });
    renderS3();
  });
});

renderS3();

// ==================== 04 · 百年格式塔年代文献重演 ====================
const s4Svg = document.getElementById("s4-svg");
const s4Cite = document.getElementById("s4-cite");
const s4Title = document.getElementById("s4-title");
const s4Text = document.getElementById("s4-text");

const ERAS = {
  "1923": {
    cite: "Max Wertheimer (1923), Psychologische Forschung, 4, 301–350",
    title: "《关于格式塔理论的研究（二）》定名「相同性因素」",
    text: "柏林学派创始人马克斯·韦特海默在 1923 年论文中，用一排排等距的空心点与实心点证明：即便点距完全相等，大脑也会自发按明暗或形状把相同元素归成一排或一列（德文称 Faktor der Gleichheit），且同样作用于听觉节拍。1935 年，库尔特·考夫卡在《格式塔心理学原理》中进一步系统整合了整套知觉组织律。",
    draw: () => {
      let s = `<rect width="420" height="210" rx="6" fill="#FFFDF8"/>`;
      s += `<text x="20" y="26" font-size="12" font-weight="700" fill="#4A4336">1923 韦特海默经典点阵：等距网格因实心 / 空心自发成列</text>`;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 8; c++) {
          const x = 58 + c * 44;
          const y = 60 + r * 39;
          const filled = c % 2 === 0;
          s += filled
            ? `<circle cx="${x}" cy="${y}" r="11" fill="#111111"/>`
            : `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="#111111" stroke-width="2.5"/>`;
        }
      }
      return s;
    },
  },
  "1954": {
    cite: "Rudolf Arnheim (1954; rev. 1974), Art and Visual Perception, UC Press",
    title: "阿恩海姆把相似性带进画框构图与色彩呼应",
    text: "曾师从韦特海默与苛勒的艺术心理学家鲁道夫·阿恩海姆，在 1954 年出版的《艺术与视知觉》中系统分析绘画与设计里的「相似与差异」：即便两个物体分别落在画面左上角与右下角，只要共享同一色相、明度或倾角，视线就会自动在它们之间架起呼应张力，把分散的画面织成整体。",
    draw: () => {
      let s = `<rect width="420" height="210" rx="6" fill="#FFFDF8"/>`;
      s += `<text x="20" y="26" font-size="12" font-weight="700" fill="#4A4336">1954 跨画布呼应：遥远两端的翠绿圆在视线里自动搭桥</text>`;
      s += `<rect x="44" y="42" width="332" height="150" rx="6" fill="#F9F0DF" stroke="#111111" stroke-width="1.5"/>`;
      s += `<rect x="135" y="66" width="140" height="80" fill="#E7C897" opacity="0.65"/>`;
      s += `<rect x="180" y="118" width="90" height="58" fill="#1D1D1D" opacity="0.18"/>`;
      s += `<line x1="94" y1="82" x2="324" y2="156" stroke="#1B8A59" stroke-width="2" stroke-dasharray="6 5"/>`;
      s += `<circle cx="94" cy="82" r="21" fill="#1B8A59"/>`;
      s += `<circle cx="324" cy="156" r="21" fill="#1B8A59"/>`;
      s += `<circle cx="212" cy="119" r="9.5" fill="#1B8A59"/>`;
      return s;
    },
  },
  "1980": {
    cite: "Anne M. Treisman & Garry Gelade (1980), Cognitive Psychology, 12(1), 97–136",
    title: "特征整合理论：为什么单色「跳出」，混码却慢半拍",
    text: "特里斯曼与格莱德在 1980 年提出特征整合理论，解释了视觉搜索的一条关键分水岭：当目标靠单一基础特征（如颜色）就能与干扰项分开时，搜索几乎并行完成（前注意跳出）；但一旦目标必须靠「颜色 + 形状」联合核对（比如在绿方与黑圆里找绿圆），大脑就得逐个聚焦扫描，速度随元素增多明显变慢。",
    draw: () => {
      let s = `<rect width="420" height="210" rx="6" fill="#FFFDF8"/>`;
      s += `<text x="20" y="26" font-size="12" font-weight="700" fill="#4A4336">左：单特征瞬时跳出 ｜ 右：色形联合搜索需逐格细找</text>`;
      s += `<rect x="20" y="40" width="180" height="154" rx="8" fill="#F9F0DF" stroke="#DACDB2"/>`;
      s += `<rect x="220" y="40" width="180" height="154" rx="8" fill="#F9F0DF" stroke="#DACDB2"/>`;
      for (let i = 0; i < 12; i++) {
        const lx = 50 + (i % 4) * 40;
        const ly = 72 + Math.floor(i / 4) * 44;
        s += `<circle cx="${lx}" cy="${ly}" r="11" fill="${i === 6 ? "#F5491A" : "#1D1D1D"}"/>`;
        const rx = 250 + (i % 4) * 40;
        const ry = 72 + Math.floor(i / 4) * 44;
        if (i === 9) s += `<circle cx="${rx}" cy="${ry}" r="11" fill="#1B8A59"/>`;
        else if (i % 2 === 0) s += `<rect x="${rx - 10}" y="${ry - 10}" width="20" height="20" fill="#1B8A59"/>`;
        else s += `<circle cx="${rx}" cy="${ry}" r="11" fill="#1D1D1D"/>`;
      }
      return s;
    },
  },
  "1998": {
    cite: "Philip T. Quinlan & Richard N. Wilton (1998), Perception, 27(4), 417–430",
    title: "邻近与相似狭路相逢，谁先拿到分组权？",
    text: "昆兰与威尔顿用一行带中央目标的符号条直接测试「距离近」和「颜色/形状像」的正面竞争。实验表明，空间邻近往往在早期解析中率先建立局部配对，而颜色与形状相似性既可能巩固这些局部群组，也可能在距离拉开或色差足够强烈时改写归属。",
    draw: () => {
      let s = `<rect width="420" height="210" rx="6" fill="#FFFDF8"/>`;
      s += `<text x="20" y="26" font-size="12" font-weight="700" fill="#4A4336">中点该跟谁？左边离得更近，右边颜色相同</text>`;
      const xs = [66, 108, 150, 210, 286, 336, 378];
      xs.forEach((x, i) => {
        const isGreen = i >= 3;
        s += `<circle cx="${x}" cy="108" r="${i === 3 ? 16 : 13}" fill="${isGreen ? "#1B8A59" : "#1D1D1D"}"/>`;
      });
      s += `<circle cx="210" cy="108" r="22" fill="none" stroke="#F5491A" stroke-width="2" stroke-dasharray="4 3"/>`;
      s += `<path d="M 150 138 Q 180 162 210 138" fill="none" stroke="#1D1D1D" stroke-width="1.8"/>`;
      s += `<text x="176" y="176" text-anchor="middle" font-size="11.5" font-weight="700" fill="#1D1D1D">邻近拉扯</text>`;
      s += `<path d="M 210 138 Q 248 166 286 138" fill="none" stroke="#1B8A59" stroke-width="1.8"/>`;
      s += `<text x="256" y="176" text-anchor="middle" font-size="11.5" font-weight="700" fill="#146E46">同色拉扯</text>`;
      return s;
    },
  },
  "2012": {
    cite: "Johan Wagemans et al. (2012), Psychological Bulletin, 138(6), 1172–1217",
    title: "格式塔百年综述：把相似性接入神经机制与设计系统",
    text: "瓦格曼斯等七位视觉学者在百年纪念综述中指出，相似性并非孤立的纸面规则，而是视觉皮层特征神经元通过同步发放与反馈回路，与邻近、共同区域、元素连通等线索动态协同的结果。现代设计系统里的按钮家族、状态色板与图标规范，正是把这套神经偏好工程化的产物。",
    draw: () => {
      let s = `<rect width="420" height="210" rx="6" fill="#FFFDF8"/>`;
      s += `<text x="20" y="26" font-size="12" font-weight="700" fill="#4A4336">多线索协同：相似性 × 共同区域 × 邻近共同构建界面秩序</text>`;
      s += `<rect x="28" y="48" width="166" height="140" rx="10" fill="#F9F0DF" stroke="#DACDB2"/>`;
      s += `<rect x="226" y="48" width="166" height="140" rx="10" fill="#F9F0DF" stroke="#DACDB2"/>`;
      s += `<text x="44" y="72" font-size="11.5" font-weight="700" fill="#4A4336">模块 A</text>`;
      s += `<text x="242" y="72" font-size="11.5" font-weight="700" fill="#4A4336">模块 B</text>`;
      s += `<path d="M 96 106 C 170 72, 240 72, 294 106" fill="none" stroke="#1B8A59" stroke-width="2" stroke-dasharray="5 4"/>`;
      s += `<circle cx="96" cy="106" r="14" fill="#1B8A59"/>`;
      s += `<circle cx="294" cy="106" r="14" fill="#1B8A59"/>`;
      s += `<rect x="134" y="136" width="24" height="24" fill="#1D1D1D"/>`;
      s += `<rect x="332" y="136" width="24" height="24" fill="#1D1D1D"/>`;
      s += `<path d="M 158 148 C 215 174, 275 174, 332 148" fill="none" stroke="#1D1D1D" stroke-width="1.8" stroke-dasharray="4 4"/>`;
      return s;
    },
  },
};

function showEra(key) {
  const era = ERAS[key];
  if (!era) return;
  s4Cite.textContent = era.cite;
  s4Title.textContent = era.title;
  s4Text.textContent = era.text;
  s4Svg.innerHTML = era.draw();
  document.querySelectorAll(".hist-tab").forEach((tab) => {
    const active = tab.dataset.era === key;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
}

document.querySelectorAll(".hist-tab").forEach((tab) => {
  tab.addEventListener("click", () => showEra(tab.dataset.era));
});
showEra("1923");

// ==================== 05 · 反例排雷诊室 ====================
const fixedBugs = new Set();
const s5Progress = document.getElementById("s5-progress");
const s5Log = document.getElementById("s5-log");

const BUG_INFO = {
  "1": {
    fixedTitle: "① 拆除了「假按钮」误导",
    fixedBody: "「限额 40 人」只是只读信息，原先却穿了和「立即报名」一模一样的翠绿圆角胶囊，读者会误以为它能点。改成低对比浅米小方标后，主按钮的点击召唤立刻唯一。",
    bugTitle: "① 已还原错态：假按钮撞衫",
    bugBody: "只读标签和主 CTA 按钮长得一模一样，破坏了界面的功能契约。",
  },
  "2": {
    fixedTitle: "② 修正了「警告色乱借」",
    fixedBody: "普通福利提示原先借用了报错/危险专属的朱红底框，读者第一眼会以为报名出错了。换回柔和的暖黄信息条后，情感语义与相似性规范才不打架。",
    bugTitle: "② 已还原错态：福利条穿了报错红",
    bugBody: "无关提示冒用高危警示色，让用户反复虚惊。",
  },
  "3": {
    fixedTitle: "③ 统一了「同级辅助操作家族」",
    fixedBody: "「收藏 / 分享 / 日历」本属同一层级的辅助操作，原先硬塞进绿胶囊、黑方、沙虚线三种异形，像三个不同功能层级。统一成素雅描边方钮后，用户一眼读出「它们是一伙的次要操作」。",
    bugTitle: "③ 已还原错态：同级操作长成三家样式",
    bugBody: "本应成组的功能互不相似，迫使用户逐个重新判断优先级。",
  },
};

document.querySelectorAll(".bug-spot[data-bug]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.bug;
    if (fixedBugs.has(id)) fixedBugs.delete(id);
    else fixedBugs.add(id);
    const isFixed = fixedBugs.has(id);
    btn.classList.toggle("is-fixed", isFixed);
    btn.classList.toggle("is-bug", !isFixed);
    btn.setAttribute("aria-pressed", String(isFixed));

    const info = BUG_INFO[id];
    s5Progress.textContent = `已排查 ${fixedBugs.size} / 3 处${fixedBugs.size === 3 ? " · 全部清雷" : ""}`;
    s5Log.innerHTML = `<h4>${isFixed ? info.fixedTitle : info.bugTitle}</h4><p>${isFixed ? info.fixedBody : info.bugBody}</p>`;
  });
});

// ==================== 06 · 小练习四选一 ====================
// 12 场大会日程固定排布（3 列 × 4 行）：type 0=主旨, 1=工作坊, 2=圆桌；floor 0=1F, 1=2F, 2=3F
const SCHEDULE = [
  { t: 0, f: 0 }, { t: 1, f: 1 }, { t: 2, f: 2 },
  { t: 1, f: 0 }, { t: 2, f: 1 }, { t: 0, f: 2 },
  { t: 2, f: 0 }, { t: 0, f: 1 }, { t: 1, f: 2 },
  { t: 0, f: 1 }, { t: 1, f: 2 }, { t: 2, f: 0 },
];

function drawQuizIcon(shape, cx, cy, r, fill) {
  if (shape === "circle") return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
  if (shape === "square") {
    const s = r * 1.78;
    return `<rect x="${(cx - s / 2).toFixed(1)}" y="${(cy - s / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="${fill}"/>`;
  }
  const h = r * 1.9;
  const w = r * 2;
  return `<polygon points="${cx},${(cy - h * 0.56).toFixed(1)} ${(cx + w * 0.5).toFixed(1)},${(cy + h * 0.44).toFixed(1)} ${(cx - w * 0.5).toFixed(1)},${(cy + h * 0.44).toFixed(1)}" fill="${fill}"/>`;
}

function renderQuizCards() {
  const colors = [PALETTE.green, PALETTE.black, "#C99A48"];
  const shapes = ["circle", "square", "triangle"];

  ["A", "B", "C", "D"].forEach((opt) => {
    const svg = document.getElementById(`q-svg-${opt}`);
    let out = "";
    SCHEDULE.forEach((item, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 12 + col * 88;
      const y = 10 + row * 33;
      out += `<rect x="${x}" y="${y}" width="80" height="26" rx="4" fill="#FFFDF8" stroke="#DACDB2"/>`;
      let shape = "circle";
      let fill = colors[item.t];
      let r = 6.2;
      if (opt === "A") {
        shape = "circle";
        fill = colors[item.t];
      } else if (opt === "B") {
        shape = shapes[item.t];
        fill = colors[item.t];
      } else if (opt === "C") {
        shape = shapes[item.f]; // 楼层正交打架
        fill = colors[item.t];
      } else if (opt === "D") {
        shape = shapes[item.t];
        fill = "#E2C99A";
        r = item.t === 0 ? 6.8 : item.t === 1 ? 6.1 : 5.6;
      }
      out += drawQuizIcon(shape, x + 13, y + 13, r, fill);
      out += `<rect x="${x + 25}" y="${y + 8}" width="44" height="4" rx="2" fill="#4A4336" opacity="0.72"/>`;
      out += `<rect x="${x + 25}" y="${y + 15}" width="28" height="3.5" rx="1.5" fill="#7D725F" opacity="0.55"/>`;
    });
    svg.innerHTML = out;
  });
}

const QUIZ_FEEDBACK = {
  A: {
    ok: false,
    title: "差在这一步 · 方案 A 只靠颜色，黑白打印和红绿色弱会丢信息",
    body: "A 方案在彩色屏幕上确实很快，但三类全是等大实心圆。一旦印成黑白大会手册，或遇到红绿色觉受限观众，翠绿与暖沙的灰阶会迅速逼近，三类日程混作一团，违反 WCAG 1.4.1 双重编码原则。",
  },
  B: {
    ok: true,
    title: "选对了 · 方案 B 色形双维对齐，跨媒介最稳",
    body: "主旨=翠绿圆、工作坊=墨黑方、圆桌=暖沙三角：在彩色屏幕里颜色先完成瞬间归类；到了黑白纸质手册或色觉受限视角下，三种高区分度几何轮廓稳稳兜底，而且色与形朝同一方向发力，零通道冲突。",
  },
  C: {
    ok: false,
    title: "差在这一步 · 方案 C 让颜色和形状正交打架",
    body: "把「场次类型」和「楼层」强行塞进同一枚小图标的颜色与形状，会逼迫读者做高负荷的「特征联合搜索」——视线一会按颜色分组、一会又被形状扯散。楼层更适合用清晰的文字小标（1F / 2F / 3F）承接。",
  },
  D: {
    ok: false,
    title: "差在这一步 · 方案 D 抽掉了强色差与明度差",
    body: "全用浅暖沙色加极其微弱的尺度差（1.0× 至 1.15×），在浅底上整体对比偏弱，跨 12 格扫找同一类讲座会明显退化成逐格细看，白白丢掉了色彩在彩屏上的并行抓群优势。",
  },
};

const quizVerdict = document.getElementById("quiz-verdict");
const qvTitle = document.getElementById("qv-title");
const qvBody = document.getElementById("qv-body");

document.querySelectorAll(".quiz-card[data-opt]").forEach((card) => {
  card.addEventListener("click", () => {
    const opt = card.dataset.opt;
    const fb = QUIZ_FEEDBACK[opt];
    document.querySelectorAll(".quiz-card[data-opt]").forEach((c) => {
      const picked = c.dataset.opt === opt;
      c.classList.toggle("is-picked", picked);
      c.classList.toggle("is-right", c.dataset.opt === "B" && (picked || !fb.ok));
      c.classList.toggle("is-wrong", picked && !fb.ok);
      c.setAttribute("aria-pressed", String(picked));
    });
    quizVerdict.className = `quiz-verdict ${fb.ok ? "is-right" : "is-wrong"}`;
    qvTitle.textContent = fb.title;
    qvBody.textContent = fb.body;
  });
});

renderQuizCards();

// ==================== 07 · 原海报灯箱（放大 + 拖动平移 + Esc 关闭） ====================
const posterEl = document.getElementById("poster");
const posterOpen = document.getElementById("poster-open");
const lightbox = document.getElementById("lightbox");
const lbClose = document.getElementById("lb-close");
const lbViewport = document.getElementById("lb-viewport");
const lbImg = document.getElementById("lb-img");

let lbX = 0;
let lbY = 0;
let lbDrag = false;
let lbStartX = 0;
let lbStartY = 0;

function updateLbTransform() {
  lbImg.style.transform = `translate3d(${lbX}px, ${lbY}px, 0)`;
}

function openLightbox() {
  lbImg.src = posterEl.src;
  lbX = 0;
  lbY = 0;
  updateLbTransform();
  lightbox.hidden = false;
  lbClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterOpen.focus();
}

posterOpen.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lbViewport) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target !== lbImg) return;
  lbDrag = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  try { lbViewport.setPointerCapture(e.pointerId); } catch {}
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = Math.max(-420, Math.min(420, e.clientX - lbStartX));
  lbY = Math.max(-520, Math.min(520, e.clientY - lbStartY));
  updateLbTransform();
});
lbViewport.addEventListener("pointerup", () => { lbDrag = false; });
lbViewport.addEventListener("pointercancel", () => { lbDrag = false; });

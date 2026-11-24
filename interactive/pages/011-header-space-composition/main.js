import { loop, reducedMotion } from "../../lib/stage.js";
import {
  MIN_PCT,
  MAX_PCT,
  DEFAULT_PCT,
  clampPct,
  snapPct,
  describeHero,
  FLIP_MODES,
  describeDrop,
  ASPECT_INFO,
  QUIZ_ANSWERS,
} from "./model.js";

const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/* =========================================================
   HERO：头部空间调节台（支持开场下沉动画、横拖标尺、竖拖红线、键盘）
   ========================================================= */
function initHero() {
  const stage = $("hero-stage");
  const svg = $("hero-svg");
  const svVoid = $("sv-void");
  const svContent = $("sv-content");
  const svCeiling = $("sv-ceiling-line");
  const svDimLine = $("sv-dim-line");
  const svArrowTop = $("sv-arrow-top");
  const svArrowBot = $("sv-arrow-bot");
  const svDimTag = $("sv-dim-tag");
  const svDimText = $("sv-dim-text");
  const svCog = $("sv-cog");
  const svCoverHead = $("sv-cover-head");
  const svWebNav = $("sv-web-nav");
  const svFoldLine = $("sv-fold-line");
  const scenes = {
    poster: $("sv-scene-poster"),
    cover: $("sv-scene-cover"),
    web: $("sv-scene-web"),
  };

  const ceilingHandle = $("ceiling-handle");
  const ruler = $("hero-ruler");
  const rulerTrack = $("ruler-track");
  const rulerFill = $("ruler-fill");
  const rulerKnob = $("ruler-knob");

  const pctOut = $("hero-pct");
  const badgeOut = $("hero-badge");
  const verdictOut = $("hero-verdict");
  const metaOut = $("hero-meta");
  const presets = [...document.querySelectorAll("[data-preset]")];
  const guidesChk = $("hero-guides");

  const H = 460;
  let state = {
    pct: reducedMotion.matches ? DEFAULT_PCT : 14,
    target: DEFAULT_PCT,
    medium: "poster",
    intro: !reducedMotion.matches,
    introElapsed: 0,
    lastRenderedPct: -1,
    lastRenderedMedium: "",
  };

  function render(pct, force = false) {
    const rounded = Math.round(pct);
    if (!force && Math.abs(pct - state.lastRenderedPct) < 0.04 && state.medium === state.lastRenderedMedium) {
      return;
    }
    state.lastRenderedPct = pct;
    state.lastRenderedMedium = state.medium;

    const topOffset = state.medium === "web" ? 32 : state.medium === "cover" ? 44 : 0;
    const y = Math.round((pct / 100) * H);
    const contentY = Math.max(topOffset + 6, y);

    // 当比例极高时轻轻缩放下方内容防止被画框彻底裁没，同时真实表现「被压扁」的视觉后果
    const avail = Math.max(76, H - contentY - 10);
    const baseH = state.medium === "poster" ? 244 : state.medium === "cover" ? 226 : 242;
    const scale = avail < baseH ? Math.max(0.54, avail / baseH) : 1;

    svVoid.setAttribute("y", String(topOffset));
    svVoid.setAttribute("height", String(Math.max(0, contentY - topOffset)));
    svContent.setAttribute("transform", `translate(0, ${contentY}) scale(${scale.toFixed(3)})`);

    // 标尺线与双箭头
    svCeiling.setAttribute("y1", String(contentY));
    svCeiling.setAttribute("y2", String(contentY));

    const dimTop = topOffset + 10;
    const dimBot = Math.max(dimTop + 12, contentY - 4);
    const showDim = contentY - topOffset >= 24;
    svDimLine.setAttribute("opacity", showDim ? "1" : "0");
    svArrowTop.setAttribute("opacity", showDim ? "1" : "0");
    svArrowBot.setAttribute("opacity", showDim ? "1" : "0");
    svDimLine.setAttribute("y1", String(dimTop));
    svDimLine.setAttribute("y2", String(dimBot));
    svArrowTop.setAttribute("points", `324,${dimTop - 5} 319.5,${dimTop + 3} 328.5,${dimTop + 3}`);
    svArrowBot.setAttribute("points", `324,${dimBot + 4} 319.5,${dimBot - 4} 328.5,${dimBot - 4}`);

    const midY = Math.max(dimTop + 14, (dimTop + dimBot) / 2);
    svDimTag.setAttribute("transform", `translate(314, ${midY.toFixed(1)})`);
    svDimText.textContent = `${rounded}%`;

    // 视觉重心标点
    const cogY = Math.min(H - 18, contentY + (baseH * scale) * 0.48);
    svCog.setAttribute("transform", `translate(162, ${cogY.toFixed(1)})`);

    // 天花板把手定位（紧贴虚线上方，极窄时翻至虚线下方以免裁出框外）
    const handlePct = Math.max(2, Math.min(82, (contentY / H) * 100));
    ceilingHandle.style.top = `${handlePct.toFixed(2)}%`;
    ceilingHandle.classList.toggle("is-low", handlePct < 10);

    // 媒介显隐
    stage.dataset.medium = state.medium;
    for (const [k, g] of Object.entries(scenes)) {
      g.setAttribute("opacity", k === state.medium ? "1" : "0");
    }
    svCoverHead.setAttribute("opacity", state.medium === "cover" ? "1" : "0");
    svWebNav.setAttribute("opacity", state.medium === "web" ? "1" : "0");
    svFoldLine.setAttribute("opacity", state.medium === "web" ? "1" : "0");

    // 标尺滑块位置
    const norm = ((pct - MIN_PCT) / (MAX_PCT - MIN_PCT)) * 100;
    rulerFill.style.width = `${norm.toFixed(2)}%`;
    rulerKnob.style.left = `${norm.toFixed(2)}%`;
    rulerKnob.setAttribute("aria-valuenow", String(rounded));
    rulerKnob.setAttribute("aria-valuetext", `${rounded}%`);

    // 读数与按钮高亮
    pctOut.textContent = `${rounded}%`;
    const desc = describeHero(rounded, state.medium);
    badgeOut.textContent = desc.badge;
    badgeOut.classList.toggle("is-warn", desc.warn);
    verdictOut.textContent = desc.verdict;
    metaOut.textContent = desc.meta;

    for (const btn of presets) {
      btn.classList.toggle("is-active", Math.abs(+btn.dataset.preset - rounded) <= 1);
    }
  }

  const ctrl = loop(stage, (t, dt, { still }) => {
    if (still) {
      state.intro = false;
      state.pct = state.target;
      render(state.pct, true);
      return;
    }
    if (state.intro) {
      state.introElapsed += dt;
      const p = Math.min(1, state.introElapsed / 1.15);
      // easeOutCubic：0.9 秒截图时已落至约 41%
      const ease = 1 - Math.pow(1 - p, 3);
      state.pct = 14 + (DEFAULT_PCT - 14) * ease;
      render(state.pct);
      if (p >= 1) {
        state.intro = false;
        state.pct = DEFAULT_PCT;
        render(state.pct, true);
      }
      return;
    }
    const diff = state.target - state.pct;
    if (Math.abs(diff) > 0.05) {
      const step = dt > 0 ? 1 - Math.exp(-16 * dt) : 1;
      state.pct += diff * step;
      render(state.pct);
    } else if (Math.abs(diff) > 0) {
      state.pct = state.target;
      render(state.pct);
    }
  });

  function setTarget(val, immediate = false) {
    state.intro = false;
    state.target = clampPct(val);
    if (immediate || reducedMotion.matches) {
      state.pct = state.target;
      render(state.pct, true);
    } else {
      ctrl.draw();
    }
  }

  // 横向标尺拖动（同时兼容鼠标与触控，perf.mjs 在 #hero-ruler 上左右拖）
  function pctFromClientX(clientX) {
    const r = rulerTrack.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - r.left) / Math.max(1, r.width)));
    return MIN_PCT + frac * (MAX_PCT - MIN_PCT);
  }

  let draggingRuler = false;
  function onRulerDown(e) {
    draggingRuler = true;
    state.intro = false;
    if (e.pointerId != null && ruler.setPointerCapture) {
      try { ruler.setPointerCapture(e.pointerId); } catch {}
    }
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    state.pct = state.target = clampPct(pctFromClientX(x));
    render(state.pct, true);
  }
  function onRulerMove(e) {
    if (!draggingRuler) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const raw = pctFromClientX(x);
    const snapped = e.touches ? raw : snapPct(raw, 1.4);
    state.pct = state.target = Math.max(MIN_PCT, Math.min(MAX_PCT, snapped));
    render(state.pct, true);
  }
  function onRulerUp() {
    draggingRuler = false;
    state.target = clampPct(state.pct);
  }

  ruler.addEventListener("pointerdown", onRulerDown);
  ruler.addEventListener("pointermove", onRulerMove);
  ruler.addEventListener("pointerup", onRulerUp);
  ruler.addEventListener("pointercancel", onRulerUp);

  // 画框内红线把手竖向拖动
  let draggingCeiling = false;
  function pctFromClientY(clientY) {
    const r = svg.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientY - r.top) / Math.max(1, r.height)));
    return clampPct(frac * 100);
  }
  ceilingHandle.addEventListener("pointerdown", (e) => {
    draggingCeiling = true;
    state.intro = false;
    e.preventDefault();
    try { ceilingHandle.setPointerCapture(e.pointerId); } catch {}
    state.pct = state.target = pctFromClientY(e.clientY);
    render(state.pct, true);
  });
  ceilingHandle.addEventListener("pointermove", (e) => {
    if (!draggingCeiling) return;
    state.pct = state.target = pctFromClientY(e.clientY);
    render(state.pct, true);
  });
  ceilingHandle.addEventListener("pointerup", () => { draggingCeiling = false; });
  ceilingHandle.addEventListener("pointercancel", () => { draggingCeiling = false; });

  // 键盘操作（标尺滑块 & 红线把手）
  function onKey(e) {
    const step = e.shiftKey ? 5 : 2;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setTarget(state.target + step, true);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setTarget(state.target - step, true);
    } else if (e.key === "Home") {
      e.preventDefault();
      setTarget(MIN_PCT, true);
    } else if (e.key === "End") {
      e.preventDefault();
      setTarget(MAX_PCT, true);
    }
  }
  rulerKnob.addEventListener("keydown", onKey);
  ceilingHandle.addEventListener("keydown", onKey);

  // 媒介单选
  document.querySelectorAll('input[name="hero-medium"]').forEach((inp) => {
    inp.addEventListener("change", () => {
      if (inp.checked) {
        state.medium = inp.value;
        render(state.pct, true);
      }
    });
  });

  // 预设比例按钮
  for (const btn of presets) {
    btn.addEventListener("click", () => setTarget(+btn.dataset.preset));
  }

  // 显示标尺线开关
  guidesChk.addEventListener("change", () => {
    stage.dataset.guides = guidesChk.checked ? "on" : "off";
  });

  render(state.pct, true);
}

/* =========================================================
   01 节：同样 45% 空白换位置
   ========================================================= */
function initFlipLab() {
  const btns = [...document.querySelectorAll("#flip-btns .btn")];
  const voidA = $("flip-void-a");
  const voidB = $("flip-void-b");
  const group = $("flip-group");
  const splitTop = $("flip-split-top");
  const cogDot = $("flip-cog-dot");
  const out = $("flip-readout");

  function apply(mode) {
    const m = FLIP_MODES[mode];
    voidA.setAttribute("y", String(m.voidA.y));
    voidA.setAttribute("height", String(m.voidA.h));
    voidB.setAttribute("y", String(m.voidB.y));
    voidB.setAttribute("height", String(m.voidB.h));
    group.setAttribute("transform", `translate(0, ${m.groupY})`);
    // 拆散模式下隐藏组合里重复的标题，只保留上半标题与下半建筑
    const titleEl = group.querySelector("text");
    const barEl = group.querySelector("line");
    const vis = m.splitTop ? "0" : "1";
    if (titleEl) titleEl.setAttribute("opacity", vis);
    if (barEl) barEl.setAttribute("opacity", vis);
    splitTop.setAttribute("opacity", m.splitTop ? "1" : "0");
    cogDot.setAttribute("cy", String(m.cogY));
    out.textContent = m.text;

    for (const b of btns) {
      const on = b.dataset.flip === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
  }

  for (const b of btns) b.addEventListener("click", () => apply(b.dataset.flip));
  apply("top");
}

/* =========================================================
   02 节：标题沉降实验室
   ========================================================= */
function initDropLab() {
  const range = $("drop-range");
  const val = $("drop-val");
  const chk = $("drop-anchor-chk");
  const anchor = $("drop-anchor");
  const band = $("drop-band");
  const dim = $("drop-dim");
  const dimTxt = $("drop-dim-txt");
  const textG = $("drop-text");
  const out = $("drop-readout");

  const H = 380;
  function update() {
    const pct = +range.value;
    const hasAnchor = chk.checked;
    const topY = hasAnchor ? 42 : 12;
    const textY = Math.max(topY + 14, Math.round((pct / 100) * H));

    val.textContent = `${pct}%`;
    anchor.setAttribute("opacity", hasAnchor ? "1" : "0");
    band.setAttribute("y", String(topY));
    band.setAttribute("height", String(Math.max(0, textY - topY - 10)));
    dim.setAttribute("y1", String(topY + 4));
    dim.setAttribute("y2", String(Math.max(topY + 10, textY - 14)));
    dimTxt.setAttribute("y", String(Math.round((topY + textY) / 2)));
    dimTxt.textContent = `${pct}%`;
    textG.setAttribute("transform", `translate(26, ${textY})`);
    out.textContent = describeDrop(pct, hasAnchor);
  }

  range.addEventListener("input", update);
  chk.addEventListener("change", update);
  update();
}

/* =========================================================
   03 节：五档比例 × 三种画幅对照
   ========================================================= */
function initRatioLab() {
  const cards = [...document.querySelectorAll("#ratio-strip .r-card")];
  const tip = $("ratio-aspect-tip");
  const out = $("ratio-readout");
  let aspect = "portrait";
  let activeRatio = 42;

  function drawThumb(svg, w, h, pct) {
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.textContent = "";
    svg.appendChild(svgEl("rect", { width: w, height: h, fill: "#fdf4e2" }));
    const y = Math.round((pct / 100) * h);
    svg.appendChild(svgEl("rect", { x: 0, y: 0, width: w, height: y, fill: "rgba(190,103,64,0.08)" }));
    if (y > 10) {
      svg.appendChild(svgEl("line", {
        x1: w - 10, y1: 4, x2: w - 10, y2: y - 3,
        stroke: "#be6740", "stroke-width": 1.2, "stroke-dasharray": "3 2",
      }));
    }
    const rem = Math.max(16, h - y - 8);
    // 左边标题块 + 右边小建筑圆
    const titleH = Math.max(4, Math.min(8, rem * 0.14));
    svg.appendChild(svgEl("rect", { x: 10, y: y + 4, width: w * 0.42, height: titleH, rx: 1, fill: "#292927" }));
    if (rem > 28) {
      svg.appendChild(svgEl("rect", { x: 10, y: y + 6 + titleH + 3, width: w * 0.3, height: 2.5, rx: 1, fill: "#be6740" }));
    }
    const r = Math.max(6, Math.min(w * 0.16, rem * 0.34));
    const cx = w * 0.69;
    const cy = Math.min(h - r - 6, y + rem * 0.52);
    svg.appendChild(svgEl("circle", { cx, cy, r, fill: "#648482" }));
    svg.appendChild(svgEl("rect", { x: cx - r * 0.45, y: cy, width: r * 0.42, height: r * 0.9, fill: "#be6740" }));
    svg.appendChild(svgEl("rect", { x: cx - r * 0.03, y: cy, width: r * 0.55, height: r * 0.9, fill: "#fcefdd" }));
    svg.appendChild(svgEl("rect", { x: cx - r * 0.85, y: cy + r * 0.9, width: r * 1.7, height: 2.5, fill: "#292927" }));
    svg.appendChild(svgEl("rect", { x: 0.75, y: 0.75, width: w - 1.5, height: h - 1.5, fill: "none", stroke: "rgba(41,41,39,0.22)", "stroke-width": 1.2 }));
  }

  function renderAll() {
    const info = ASPECT_INFO[aspect];
    tip.textContent = info.tip;
    for (const c of cards) {
      const r = +c.dataset.ratio;
      drawThumb(c.querySelector("svg"), info.w, info.h, r);
      const on = r === activeRatio;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-pressed", String(on));
    }
    out.textContent = info.notes[activeRatio];
  }

  for (const c of cards) {
    c.addEventListener("click", () => {
      activeRatio = +c.dataset.ratio;
      renderAll();
    });
  }
  document.querySelectorAll('input[name="ratio-aspect"]').forEach((inp) => {
    inp.addEventListener("change", () => {
      if (inp.checked) {
        aspect = inp.value;
        renderAll();
      }
    });
  });
  renderAll();
}

/* =========================================================
   04 节：杂志封面 vs 网页首屏同步对比
   ========================================================= */
function initCompareLab() {
  const range = $("cmp-range");
  const val = $("cmp-val");
  const ccVoid = $("cc-void");
  const ccDim = $("cc-dim");
  const ccBody = $("cc-body");
  const coverTag = $("cmp-cover-tag");
  const coverText = $("cmp-cover-text");

  const cwVoid = $("cw-void");
  const cwDim = $("cw-dim");
  const cwBody = $("cw-body");
  const cwFold = $("cw-fold");
  const cwBelow = $("cw-below");
  const cwFoldBg = $("cw-fold-bg");
  const cwFoldTxt = $("cw-fold-txt");
  const webTag = $("cmp-web-tag");
  const webText = $("cmp-web-text");

  let device = "desktop";

  function update() {
    const pct = +range.value;
    val.textContent = `${pct}%`;

    // 杂志封面 (height 340, masthead 36)
    const coverY = Math.max(44, Math.round((pct / 100) * 340));
    ccVoid.setAttribute("height", String(coverY));
    ccDim.setAttribute("y2", String(Math.max(46, coverY - 4)));
    const cScale = coverY > 164 ? Math.max(0.62, (330 - coverY) / 172) : 1;
    ccBody.setAttribute("transform", `translate(20, ${coverY + 6}) scale(${cScale.toFixed(3)})`);

    if (pct <= 22) {
      coverTag.textContent = "略紧促";
      coverTag.className = "status-pill warn";
      coverText.textContent = "刊名刚结束就撞上封面标题，信息紧凑，少了大面积留白的安静气质。";
    } else if (pct <= 54) {
      coverTag.textContent = "四边完整 · 从容";
      coverTag.className = "status-pill ok";
      coverText.textContent = "纸质封面一眼看全四边，顶部空出三到五成反而显得沉静，书架上更好认。";
    } else {
      coverTag.textContent = "底盘偏挤";
      coverTag.className = "status-pill warn";
      coverText.textContent = "即使在完整可见的纸质封面上，空过六成也会把器物压得过矮，重心发虚。";
    }

    // 网页首屏 (height 280, nav 24)
    const foldY = device === "desktop" ? 206 : 176;
    const viewportH = foldY - 24;
    const webVoidH = Math.round((pct / 100) * viewportH);
    const webBodyY = 24 + webVoidH + 8;

    cwVoid.setAttribute("height", String(webVoidH));
    cwDim.setAttribute("y2", String(Math.max(30, 24 + webVoidH - 4)));
    cwBody.setAttribute("transform", `translate(24, ${webBodyY})`);
    cwFold.setAttribute("y1", String(foldY));
    cwFold.setAttribute("y2", String(foldY));
    cwBelow.setAttribute("y", String(foldY));
    cwBelow.setAttribute("height", String(280 - foldY));
    cwFoldBg.setAttribute("y", String(foldY - 12));
    cwFoldTxt.setAttribute("y", String(foldY + 1));
    cwFoldTxt.textContent = device === "desktop" ? "笔记本首屏折痕" : "手机首屏折痕";

    const btnBottom = webBodyY + 76;
    if (btnBottom <= foldY - 6) {
      webTag.textContent = "主角在折痕内";
      webTag.className = "status-pill ok";
      webText.textContent = `顶部空出 ${pct}%，标题、行动按钮和主视觉都稳稳落在折痕以上，访客一眼懂你要说什么。`;
    } else if (webBodyY + 34 <= foldY) {
      webTag.textContent = "按钮被折痕切掉";
      webTag.className = "status-pill warn";
      webText.textContent = `在${device === "desktop" ? "笔记本" : "手机"}首屏里，${pct}% 顶空已经把按钮推过折痕，第一眼只见标题不见入口。`;
    } else {
      webTag.textContent = "首屏发空 · 假底风险";
      webTag.className = "status-pill warn";
      webText.textContent = `顶部留白把整组内容挤向折痕边缘，访客打开页面只看到一片空白，容易以为没加载完。`;
    }
  }

  range.addEventListener("input", update);
  document.querySelectorAll('input[name="cmp-device"]').forEach((inp) => {
    inp.addEventListener("change", () => {
      if (inp.checked) {
        device = inp.value;
        update();
      }
    });
  });
  update();
}

/* =========================================================
   06 节：四选一小练习
   ========================================================= */
function initQuiz() {
  const grid = $("quiz-grid");
  const cards = [...grid.querySelectorAll(".q-card")];
  const title = $("qv-title");
  const body = $("qv-body");

  for (const c of cards) {
    c.addEventListener("click", () => {
      const k = c.dataset.q;
      const ans = QUIZ_ANSWERS[k];
      grid.classList.add("revealed");
      for (const item of cards) {
        const key = item.dataset.q;
        item.classList.toggle("is-picked", key === k);
        item.classList.toggle("is-right", key === "B");
        item.classList.toggle("is-wrong", key === k && !ans.ok);
        item.setAttribute("aria-pressed", String(key === k));
      }
      title.textContent = ans.title;
      body.textContent = ans.body;
    });
  }
}

/* =========================================================
   07 节：原海报放大看图器（支持缩放、拖动、Esc 关）
   ========================================================= */
function initPosterViewer() {
  const openBtn = $("poster-open");
  const poster = $("poster");
  const dialog = $("viewer");
  const img = $("viewer-img");
  const scrollBox = $("viewer-scroll");
  const zOut = $("zoom-out");
  const zIn = $("zoom-in");
  const zVal = $("zoom-val");
  const closeBtn = $("viewer-close");

  let zoom = 1;
  const applyZoom = () => {
    const baseW = Math.min(scrollBox.clientWidth - 40, 760);
    img.style.width = `${Math.round(Math.max(300, baseW) * zoom)}px`;
    zVal.textContent = `${Math.round(zoom * 100)}%`;
  };

  openBtn.addEventListener("click", () => {
    if (!img.src) img.src = poster.src;
    zoom = 1;
    dialog.showModal();
    applyZoom();
    scrollBox.scrollTo(0, 0);
  });

  zIn.addEventListener("click", () => { zoom = Math.min(2.6, +(zoom + 0.25).toFixed(2)); applyZoom(); });
  zOut.addEventListener("click", () => { zoom = Math.max(0.6, +(zoom - 0.25).toFixed(2)); applyZoom(); });
  closeBtn.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

  // 拖动看大图
  let drag = null;
  scrollBox.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, sx: scrollBox.scrollLeft, sy: scrollBox.scrollTop };
    scrollBox.classList.add("is-dragging");
    try { scrollBox.setPointerCapture(e.pointerId); } catch {}
  });
  scrollBox.addEventListener("pointermove", (e) => {
    if (!drag) return;
    scrollBox.scrollLeft = drag.sx - (e.clientX - drag.x);
    scrollBox.scrollTop = drag.sy - (e.clientY - drag.y);
  });
  const endDrag = () => { drag = null; scrollBox.classList.remove("is-dragging"); };
  scrollBox.addEventListener("pointerup", endDrag);
  scrollBox.addEventListener("pointercancel", endDrag);
}

/* =========================================================
   入场显现
   ========================================================= */
function initReveal() {
  const els = [...document.querySelectorAll(".reveal")];
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    for (const el of els) el.classList.add("in");
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
  );
  for (const el of els) io.observe(el);
}

initHero();
initFlipLab();
initDropLab();
initRatioLab();
initCompareLab();
initQuiz();
initPosterViewer();
initReveal();

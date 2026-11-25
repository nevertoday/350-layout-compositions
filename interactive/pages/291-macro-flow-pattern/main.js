// 291 大体 流动模式（MACRO FLOW PATTERN）主控模块
import { loop, reducedMotion } from "../../lib/stage.js";
import {
  STAGES,
  STAGE_IDS,
  INITIAL_STATE,
  MAX_WIDTH_OPTIONS,
  STACK_AT_OPTIONS,
  RHYTHM_OPTIONS,
  PRESETS,
  FAMILY_SCENARIOS,
  FAMILY_MEMBERS,
  HISTORY_STEPS,
  QUIZ_DATA,
  clamp,
  evaluate,
  compareThreeStrategies,
  buildCssSnippet,
} from "./model.js";
import { HeroCanvas, drawSection3Diagram } from "./canvas.js";

const state = {
  ...INITIAL_STATE,
  order: [...INITIAL_STATE.order],
};

let evalCache = evaluate(state);
let heroCanvasCtrl = null;
let heroLoop = null;

// ---------------- 开场交互与单真源 UI 同步 ----------------
function setState(patch) {
  Object.assign(state, patch);
  if (patch.order) state.order = [...patch.order];
  evalCache = evaluate(state);
  syncHeroUI();
  if (heroLoop) heroLoop.draw();
}

function swapOrderSlots(a, b) {
  if (a === b) {
    setState({ selectedSlot: -1 });
    return;
  }
  const next = [...state.order];
  const tmp = next[a];
  next[a] = next[b];
  next[b] = tmp;
  setState({ order: next, selectedSlot: -1 });
}

function handleSlotPick(slot) {
  if (state.selectedSlot === -1) {
    setState({ selectedSlot: slot });
  } else {
    swapOrderSlots(state.selectedSlot, slot);
  }
}

function syncHeroUI() {
  const ev = evalCache;
  const pill = document.getElementById("hero-status-pill");
  pill.textContent = ev.statusTag;
  pill.className = `status-pill ${ev.severity === "good" ? "is-good" : "is-bad"}`;

  // 顶部斜标下方朱橘弧尾迹随通关分数完整舒展（标题自示范！）
  const tail = document.getElementById("hero-arc-tail");
  const head = document.getElementById("hero-arc-head");
  if (tail && head) {
    const ratio = ev.score / 4;
    tail.style.strokeDasharray = "420";
    tail.style.strokeDashoffset = String(Math.round((1 - (0.28 + ratio * 0.72)) * 420));
    tail.style.stroke = ev.score === 4 ? "#E35C0E" : "#BD2222";
    head.style.opacity = ev.score === 4 ? "1" : "0.35";
    head.style.stroke = ev.score === 4 ? "#E35C0E" : "#BD2222";
  }

  // 题材标签高亮
  document.querySelectorAll("[data-theme]").forEach((btn) => {
    const active = btn.dataset.theme === state.theme;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });

  // 视口快跳按钮高亮最近刻度
  let nearestMark = 1440;
  let bestD = Infinity;
  document.querySelectorAll("[data-vp]").forEach((btn) => {
    const v = Number(btn.dataset.vp);
    const d = Math.abs(v - state.viewportW);
    if (d < bestD) {
      bestD = d;
      nearestMark = v;
    }
  });
  document.querySelectorAll("[data-vp]").forEach((btn) => {
    btn.classList.toggle("is-active", Number(btn.dataset.vp) === nearestMark && bestD <= 45);
  });

  // 底部四阶流序互换轨
  const slotsWrap = document.getElementById("order-slots");
  slotsWrap.innerHTML = "";
  state.order.forEach((id, idx) => {
    const st = STAGES[id];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `order-chip${id === "transition" ? " is-trans" : ""}${
      state.selectedSlot === idx ? " is-selected" : ""
    }`;
    btn.dataset.slot = String(idx);
    btn.innerHTML = `<span class="slot-idx">0${idx + 1}</span><span>${st.zh}</span>`;
    btn.addEventListener("click", () => handleSlotPick(idx));
    slotsWrap.appendChild(btn);
    if (idx < 3) {
      const sep = document.createElement("span");
      sep.className = "order-arrow";
      sep.setAttribute("aria-hidden", "true");
      sep.textContent = "→";
      slotsWrap.appendChild(sep);
    }
  });

  // 单真源诊断卡
  const badge = document.getElementById("diag-badge");
  badge.textContent = ev.statusTag;
  badge.className = `diag-badge ${ev.severity === "good" ? "is-good" : "is-bad"}`;

  document.getElementById("diag-headline").textContent = ev.headline;
  document.getElementById("diag-explain").textContent = ev.explanation;
  document.getElementById("diag-hint").textContent = ev.actionHint;

  const fixBtn = document.getElementById("diag-fix-btn");
  if (ev.fixAction && ev.score < 4) {
    fixBtn.hidden = false;
    fixBtn.textContent = ev.fixAction.label;
  } else {
    fixBtn.hidden = true;
  }

  // 四格单真源实测读数
  const mMargin = document.getElementById("m-margin");
  mMargin.textContent = `${ev.desktop.outerMargin}px`;
  mMargin.className = `metric-v ${ev.marginOk ? "is-good" : "is-bad"}`;

  const mChars = document.getElementById("m-chars");
  mChars.textContent = `~${ev.desktop.estChars} ch`;
  mChars.className = `metric-v ${
    ev.desktop.estChars >= 42 && ev.desktop.estChars <= 78 ? "is-good" : "is-bad"
  }`;

  const mMob = document.getElementById("m-mobile");
  mMob.textContent = `${ev.mobile.minColW}px`;
  mMob.className = `metric-v ${ev.stackOk ? "is-good" : "is-bad"}`;

  const mRatio = document.getElementById("m-ratio");
  mRatio.textContent = `${ev.desktop.areaRatio.toFixed(2)}×`;
  mRatio.className = `metric-v ${ev.rhythmOk ? "is-good" : "is-bad"}`;

  // 四维达标清点
  const chkWrap = document.getElementById("diag-checks");
  chkWrap.innerHTML = ev.checks
    .map(
      (c) =>
        `<div class="chk-item ${c.ok ? "is-ok" : "is-no"}"><span class="chk-name">${c.ok ? "✓" : "×"} ${c.label}</span><span class="chk-tag">${c.badge}</span></div>`
    )
    .join("");

  // 原海报十字公式同步点亮
  const lit = [ev.marginOk && ev.stackOk, ev.orderOk && ev.rhythmOk, ev.score === 4];
  document.querySelectorAll("#poster-formula .formula-item").forEach((el, i) => {
    el.classList.toggle("is-lit", Boolean(lit[i]));
  });

  // 三阀数值与按钮选中态
  const mwObj = MAX_WIDTH_OPTIONS.find((o) => o.value === state.maxWidth);
  document.getElementById("val-maxw").textContent = mwObj ? mwObj.short : `${state.maxWidth}px`;
  document.querySelectorAll("#ctrl-maxw .opt-btn").forEach((b) => {
    b.classList.toggle("is-active", Number(b.dataset.val) === state.maxWidth);
  });

  const stObj = STACK_AT_OPTIONS.find((o) => o.value === state.stackAt);
  document.getElementById("val-stack").textContent = stObj ? stObj.short : `${state.stackAt}px`;
  document.querySelectorAll("#ctrl-stack .opt-btn").forEach((b) => {
    b.classList.toggle("is-active", Number(b.dataset.val) === state.stackAt);
  });

  const rhObj = RHYTHM_OPTIONS.find((o) => o.value === state.rhythm);
  document.getElementById("val-rhythm").textContent = rhObj ? rhObj.short : state.rhythm;
  document.querySelectorAll("#ctrl-rhythm .opt-btn").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.val === state.rhythm);
  });
}

function initHero() {
  // 渲染三阀按钮
  const mwWrap = document.getElementById("ctrl-maxw");
  MAX_WIDTH_OPTIONS.forEach((o) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `opt-btn${o.value === 0 || o.value === 560 ? " is-trap" : ""}`;
    b.dataset.val = String(o.value);
    b.textContent = o.label;
    b.addEventListener("click", () => setState({ maxWidth: o.value }));
    mwWrap.appendChild(b);
  });

  const stWrap = document.getElementById("ctrl-stack");
  STACK_AT_OPTIONS.forEach((o) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `opt-btn${o.value === 0 || o.value === 1080 ? " is-trap" : ""}`;
    b.dataset.val = String(o.value);
    b.textContent = o.label;
    b.addEventListener("click", () => setState({ stackAt: o.value }));
    stWrap.appendChild(b);
  });

  const rhWrap = document.getElementById("ctrl-rhythm");
  RHYTHM_OPTIONS.forEach((o) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `opt-btn${o.value === "equal" ? " is-trap" : ""}`;
    b.dataset.val = o.value;
    b.textContent = o.label;
    b.addEventListener("click", () => setState({ rhythm: o.value }));
    rhWrap.appendChild(b);
  });

  const prWrap = document.getElementById("ctrl-presets");
  Object.entries(PRESETS).forEach(([key, p]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `preset-btn${p.kind === "bad" ? " is-bad" : p.kind === "reset" ? " is-reset" : ""}`;
    b.dataset.preset = key;
    b.textContent = p.label;
    b.addEventListener("click", () => setState(p.patch));
    prWrap.appendChild(b);
  });

  document.querySelectorAll("[data-theme]").forEach((btn) => {
    btn.addEventListener("click", () => setState({ theme: btn.dataset.theme }));
  });

  document.querySelectorAll("[data-vp]").forEach((btn) => {
    btn.addEventListener("click", () => setState({ viewportW: Number(btn.dataset.vp) }));
  });

  document.getElementById("diag-fix-btn").addEventListener("click", () => {
    if (evalCache.fixAction) setState(evalCache.fixAction.patch);
  });

  // 画布初始化与指针/触屏/键盘事件（同时支持鼠标、触摸和 perf.mjs 的 touch 事件）
  const canvas = document.getElementById("hero-canvas");
  heroCanvasCtrl = new HeroCanvas(canvas);
  heroLoop = loop(canvas, (_t, dt, { still }) => {
    heroCanvasCtrl.render(state, evalCache, dt, still);
  });

  let dragActive = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartVw = state.viewportW;
  let moved = false;
  let horizontalLocked = false;

  const applyDelta = (clientX) => {
    const rect = canvas.getBoundingClientRect();
    const dx = clientX - dragStartX;
    // 横向拖动直接连续映射视口宽度（左右拉阔：向右加宽，向左收窄；带轻柔 360/768/1440 吸附感）
    const scale = 1360 / Math.max(240, rect.width * 0.72);
    let nextVw = clamp(Math.round(dragStartVw + dx * scale), 320, 1680);
    for (const snap of [360, 768, 1120, 1440]) {
      if (Math.abs(nextVw - snap) <= 10) {
        nextVw = snap;
        break;
      }
    }
    if (nextVw !== state.viewportW) {
      state.viewportW = nextVw;
      evalCache = evaluate(state);
      syncHeroUI();
      heroLoop.draw();
    }
  };

  // Pointer events（桌面鼠标 + 现代触屏）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏走独立 touch 处理以便精准放行纵向滚页并兼容 CDP touch
    dragActive = true;
    moved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartVw = state.viewportW;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragActive || e.pointerType === "touch") return;
    if (Math.abs(e.clientX - dragStartX) > 4) moved = true;
    if (moved) applyDelta(e.clientX);
  });

  canvas.addEventListener("pointerup", (e) => {
    if (!dragActive || e.pointerType === "touch") return;
    dragActive = false;
    if (!moved) {
      const hit = heroCanvasCtrl.hitTest(e.clientX, e.clientY);
      if (hit.kind === "fix" && evalCache.fixAction) {
        setState(evalCache.fixAction.patch);
      } else if (hit.kind === "block") {
        handleSlotPick(hit.slot);
      }
    }
  });

  canvas.addEventListener("pointercancel", () => {
    dragActive = false;
  });

  // 触屏专属：水平拖动时实时重画画布，竖向滑动立刻交给浏览器滚页
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      dragActive = true;
      moved = false;
      horizontalLocked = false;
      dragStartX = t.clientX;
      dragStartY = t.clientY;
      dragStartVw = state.viewportW;
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!dragActive || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = Math.abs(t.clientX - dragStartX);
      const dy = Math.abs(t.clientY - dragStartY);
      if (!horizontalLocked && dy > dx && dy > 10) {
        dragActive = false;
        return;
      }
      if (dx > 4) {
        horizontalLocked = true;
        moved = true;
      }
      if (horizontalLocked) {
        e.preventDefault();
        applyDelta(t.clientX);
      }
    },
    { passive: false }
  );

  canvas.addEventListener("touchend", (e) => {
    if (!dragActive) return;
    dragActive = false;
    if (!moved && e.changedTouches.length) {
      const t = e.changedTouches[0];
      const hit = heroCanvasCtrl.hitTest(t.clientX, t.clientY);
      if (hit.kind === "fix" && evalCache.fixAction) {
        setState(evalCache.fixAction.patch);
      } else if (hit.kind === "block") {
        handleSlotPick(hit.slot);
      }
    }
  });

  // 键盘无障碍控制
  canvas.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 80 : 24;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setState({ viewportW: clamp(state.viewportW - step, 320, 1680) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setState({ viewportW: clamp(state.viewportW + step, 320, 1680) });
    }
  });

  window.addEventListener("resize", () => {
    if (heroLoop) heroLoop.draw();
    renderSection3();
  });

  syncHeroUI();
  heroLoop.draw();
}

// ---------------- 01 节：四阶段联动解剖 ----------------
function stageMiniSvg(activeId) {
  const op = (id) => (id === activeId ? "1" : "0.24");
  const sw = (id) => (id === activeId ? "3" : "1.5");
  return `<svg viewBox="0 0 240 220" role="img" aria-label="291 原海报四阶段流路高亮示意">
    <rect x="0" y="0" width="240" height="220" fill="#FCF4EC" />
    <!-- 291 S 形主干丝带 -->
    <path d="M 38 184 C 130 182, 198 152, 184 114 C 170 80, 62 104, 68 62 C 74 32, 148 28, 206 20"
          fill="none" stroke="#1043C6" stroke-width="18" stroke-linecap="round" opacity="0.22" />
    <path d="M 38 184 C 130 182, 198 152, 184 114 C 170 80, 62 104, 68 62 C 74 32, 148 28, 206 20"
          fill="none" stroke="#1043C6" stroke-width="4" stroke-linecap="round" />
    <path d="M 150 28 C 175 24, 192 22, 208 20" fill="none" stroke="#E35C0E" stroke-width="6" stroke-linecap="round" />
    <polygon points="222,18 202,10 205,28" fill="#E35C0E" />
    <!-- 右下支流 -->
    <path d="M 118 176 C 154 170, 174 166, 204 168" fill="none" stroke="#1043C6" stroke-width="3" />
    <!-- 节点 1 引导 -->
    <g opacity="${op("flow")}">
      <circle cx="38" cy="184" r="18" fill="#1043C6" stroke="#FFFBF6" stroke-width="${sw("flow")}" />
      <path d="M 31 184 H 44 M 39 179 L 45 184 L 39 189" fill="none" stroke="#FFFBF6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
    <!-- 节点 2 过渡 -->
    <g opacity="${op("transition")}">
      <circle cx="152" cy="154" r="14" fill="#E35C0E" stroke="#FFFBF6" stroke-width="${sw("transition")}" />
    </g>
    <!-- 节点 3 聚焦 -->
    <g opacity="${op("focus")}">
      <circle cx="142" cy="96" r="16" fill="#1043C6" stroke="#FFFBF6" stroke-width="${sw("focus")}" />
      <circle cx="142" cy="96" r="9" fill="#FFFBF6" />
      <circle cx="142" cy="96" r="4.5" fill="#1043C6" />
    </g>
    <!-- 节点 4 延展输出 -->
    <g opacity="${op("output")}">
      <circle cx="206" cy="168" r="15" fill="#FFFBF6" stroke="#1043C6" stroke-width="${sw("output")}" />
      <path d="M 200 168 H 211 M 207 164 L 212 168 L 207 172" fill="none" stroke="#1043C6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </svg>`;
}

function initSection1() {
  const wrap = document.getElementById("s1-steps");
  let active = "flow";

  const render = () => {
    const st = STAGES[active];
    wrap.querySelectorAll(".s1-step-btn").forEach((b) => {
      const on = b.dataset.stage === active;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    document.getElementById("s1-svg-box").innerHTML = stageMiniSvg(active);
    const badge = document.getElementById("s1-badge");
    badge.textContent = st.en;
    badge.className = `s1-badge${active === "transition" ? " is-orange" : ""}`;
    document.getElementById("s1-role").textContent = st.role;
    document.getElementById("s1-title").textContent = `${st.zh}（${st.en}）`;
    document.getElementById("s1-quote").textContent = `原海报原话：「${st.posterBody}」`;
    document.getElementById("s1-body").textContent = st.detail;
    document.getElementById("s1-missing").textContent = st.ifMissing;
  };

  STAGE_IDS.forEach((id, i) => {
    const st = STAGES[id];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.role = "tab";
    btn.dataset.stage = id;
    btn.className = `s1-step-btn${id === "transition" ? " is-orange" : ""}${
      id === "output" ? " is-out" : ""
    }`;
    const sym = id === "transition" ? "●" : id === "focus" ? "◎" : "→";
    btn.innerHTML = `<span class="s1-glyph" aria-hidden="true">${sym}</span><span class="s1-step-text"><strong>0${
      i + 1
    } · ${st.zh}</strong><span>${st.en}</span></span>`;
    btn.addEventListener("click", () => {
      active = id;
      render();
    });
    wrap.appendChild(btn);
  });

  render();
}

// ---------------- 02 节：三策略视口拉杆对照 ----------------
function initSection2() {
  const range = document.getElementById("s2-range");
  const out = document.getElementById("s2-out");
  const tracks = document.getElementById("s2-tracks");

  const render = (vw) => {
    const res = compareThreeStrategies(vw);
    out.textContent = `${res.vw}px`;
    range.value = String(res.vw);

    document.querySelectorAll("[data-s2w]").forEach((b) => {
      b.classList.toggle("is-active", Number(b.dataset.s2w) === res.vw);
    });

    const pctFixed = Math.min(135, Math.round((res.fixed.contentW / res.vw) * 100));
    const pctFull = Math.round((res.full.contentW / res.vw) * 100);
    const pctMf = Math.round((res.mf.contentW / res.vw) * 100);

    const cards = [
      {
        title: "固定死宽（width: 1080px）",
        cls: "",
        ok: res.fixed.ok,
        tag: res.fixed.tag,
        widthPct: pctFixed,
        badInner: !res.fixed.ok,
        note: `${res.fixed.note}（内容宽 ${res.fixed.contentW}px / 单行约 ${res.fixed.chars} ch）。`,
      },
      {
        title: "完全流式（width: 100% 无上限）",
        cls: "",
        ok: res.full.ok,
        tag: res.full.tag,
        widthPct: pctFull,
        badInner: !res.full.ok,
        note: `${res.full.note}（内容宽 ${res.full.contentW}px / 外边距恒为 ${res.full.margin}px）。`,
      },
      {
        title: "大体流动（1120px 锁宽）",
        cls: "is-mf",
        ok: res.mf.ok,
        tag: res.mf.tag,
        widthPct: pctMf,
        badInner: false,
        note: `${res.mf.note}（内容宽 ${res.mf.contentW}px / 单侧外边距 ${res.mf.margin}px）。`,
      },
    ];

    tracks.innerHTML = cards
      .map(
        (c) => `<article class="s2-track ${c.cls}">
        <div class="s2-t-head">
          <h3>${c.title}</h3>
          <span class="s2-pill ${c.ok ? "is-ok" : "is-bad"}">${c.tag}</span>
        </div>
        <div class="s2-viewport-sim">
          <div class="s2-page-inner ${c.badInner ? "is-bad" : ""}" style="width:${c.widthPct}%">
            <div class="s2-line"></div>
            <div class="s2-line short"></div>
            <div class="s2-line"></div>
          </div>
        </div>
        <p class="s2-t-note">${c.note}</p>
      </article>`
      )
      .join("");
  };

  range.addEventListener("input", () => render(Number(range.value)));
  document.querySelectorAll("[data-s2w]").forEach((b) => {
    b.addEventListener("click", () => render(Number(b.dataset.s2w)));
  });

  render(1600);
}

// ---------------- 03 节：深蓝暗室 CSS 编译器与外边距断面图 ----------------
const s3State = { syntax: "grid", maxW: 1120, stackAt: 640, screenW: 1440 };

function renderSection3() {
  const codeEl = document.getElementById("s3-code");
  if (!codeEl) return;
  codeEl.textContent = buildCssSnippet(s3State.syntax, s3State.maxW, s3State.stackAt);

  const canvas = document.getElementById("s3-canvas");
  drawSection3Diagram(canvas, s3State.screenW, s3State.maxW, s3State.stackAt);

  const contW = Math.min(s3State.screenW - 24, s3State.maxW);
  const margin = Math.max(12, Math.round((s3State.screenW - contW) / 2));
  const isStacked = s3State.screenW < s3State.stackAt;
  document.getElementById("s3-vis-note").textContent = isStacked
    ? `当前 ${s3State.screenW}px 小于堆叠断点 ${s3State.stackAt}px：外层贴合屏幕宽，内部四个阶段自动折成单列纵流（内容宽 ${contW}px）。`
    : s3State.screenW - 24 > s3State.maxW
    ? `当前 ${s3State.screenW}px 已越过锁宽上限 ${s3State.maxW}px：核心内容纹丝不动地停在 ${contW}px，多出的宽屏余量全部由左右各 ${margin}px 对称外边距平和吸收。`
    : `当前 ${s3State.screenW}px 处于中屏弹性带（${s3State.stackAt}px–${s3State.maxW}px）：外边距保持轻量 ${margin}px，双列内容随容器宽度平滑呼吸。`;
}

function initSection3() {
  document.querySelectorAll("[data-s3-syntax]").forEach((b) => {
    b.addEventListener("click", () => {
      s3State.syntax = b.dataset.s3Syntax;
      document
        .querySelectorAll("[data-s3-syntax]")
        .forEach((x) => x.classList.toggle("is-active", x === b));
      renderSection3();
    });
  });

  document.querySelectorAll("#s3-maxw .dark-pill").forEach((b) => {
    b.addEventListener("click", () => {
      s3State.maxW = Number(b.dataset.val);
      document
        .querySelectorAll("#s3-maxw .dark-pill")
        .forEach((x) => x.classList.toggle("is-active", x === b));
      renderSection3();
    });
  });

  document.querySelectorAll("#s3-stack .dark-pill").forEach((b) => {
    b.addEventListener("click", () => {
      s3State.stackAt = Number(b.dataset.val);
      document
        .querySelectorAll("#s3-stack .dark-pill")
        .forEach((x) => x.classList.toggle("is-active", x === b));
      renderSection3();
    });
  });

  document.querySelectorAll("#s3-screen .dark-pill").forEach((b) => {
    b.addEventListener("click", () => {
      s3State.screenW = Number(b.dataset.sw);
      document
        .querySelectorAll("#s3-screen .dark-pill")
        .forEach((x) => x.classList.toggle("is-active", x === b));
      renderSection3();
    });
  });

  const copyBtn = document.getElementById("s3-copy");
  copyBtn.addEventListener("click", () => {
    const txt = buildCssSnippet(s3State.syntax, s3State.maxW, s3State.stackAt);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).catch(() => {});
    }
    copyBtn.textContent = "已复制 ✓";
    setTimeout(() => {
      copyBtn.textContent = "复制 CSS";
    }, 1500);
  });

  renderSection3();
}

// ---------------- 04 节：响应式家族路由 ----------------
function initSection4() {
  const scenWrap = document.getElementById("s4-scenarios");
  const verdict = document.getElementById("s4-verdict");
  const cardsWrap = document.getElementById("s4-cards");
  let activeScen = FAMILY_SCENARIOS[0].id;

  const render = () => {
    const sc = FAMILY_SCENARIOS.find((s) => s.id === activeScen) || FAMILY_SCENARIOS[0];
    scenWrap.querySelectorAll(".scen-btn").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.scen === sc.id);
    });

    const picked = FAMILY_MEMBERS.find((m) => m.id === sc.pick);
    verdict.innerHTML = `<strong>优先推荐 ${picked.id} ${picked.title}：</strong>${sc.summary}`;

    cardsWrap.innerHTML = FAMILY_MEMBERS.map((m) => {
      const isPick = m.id === sc.pick;
      const isAlso = sc.also.includes(m.id);
      const badge = isPick
        ? `<span class="fam-badge">首选匹配</span>`
        : m.self
        ? `<span class="fam-badge is-self">本页</span>`
        : "";
      const linkHtml = m.self
        ? `<span class="fam-en">你正在这一页</span>`
        : `<a class="fam-link" href="https://layout.xiaoxiaodong.ai/${m.id}/play/" target="_blank" rel="noopener">去看 ${m.id} 在线版 →</a>`;
      return `<article class="fam-card${isPick ? " is-pick" : isAlso ? " is-also" : ""}">
        <div>
          <div class="fam-top"><span class="fam-id">${m.id}</span>${badge}</div>
          <h3>${m.title}</h3>
          <p class="fam-en">${m.en}</p>
          <p class="fam-diff">${m.diff}</p>
        </div>
        ${linkHtml}
      </article>`;
    }).join("");
  };

  FAMILY_SCENARIOS.forEach((s) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "scen-btn";
    b.dataset.scen = s.id;
    b.textContent = s.label;
    b.addEventListener("click", () => {
      activeScen = s.id;
      render();
    });
    scenWrap.appendChild(b);
  });

  render();
}

// ---------------- 05 节：流式演进史 ----------------
function historySvg(kind) {
  if (kind === "fixed-to-liquid") {
    return `<svg viewBox="0 0 260 150" role="img" aria-label="从固定纸页转向流动容器示意">
      <rect width="260" height="150" fill="#FFFBF6" />
      <rect x="18" y="24" width="96" height="102" fill="#F4E9DC" stroke="#111214" stroke-width="2" />
      <line x1="30" y1="48" x2="102" y2="48" stroke="#111214" stroke-width="5" />
      <line x1="30" y1="68" x2="96" y2="68" stroke="#4A505E" stroke-width="3" />
      <line x1="30" y1="84" x2="88" y2="84" stroke="#4A505E" stroke-width="3" />
      <text x="66" y="114" text-anchor="middle" font-size="11" font-weight="700" fill="#4A505E">固定像素盒</text>
      <path d="M 122 75 H 148 M 142 69 L 150 75 L 142 81" fill="none" stroke="#E35C0E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <rect x="160" y="24" width="84" height="102" fill="#EEF2FA" stroke="#1043C6" stroke-width="2" stroke-dasharray="5 3" />
      <path d="M 172 64 C 188 46, 212 84, 232 62" fill="none" stroke="#1043C6" stroke-width="4" stroke-linecap="round" />
      <text x="202" y="114" text-anchor="middle" font-size="11" font-weight="700" fill="#0B35A3">顺屏流动</text>
    </svg>`;
  }
  if (kind === "rwd-trio") {
    return `<svg viewBox="0 0 260 150" role="img" aria-label="响应式设计三大技术支柱示意">
      <rect width="260" height="150" fill="#FFFBF6" />
      <rect x="16" y="28" width="68" height="94" fill="#EEF2FA" stroke="#1043C6" stroke-width="2" />
      <text x="50" y="72" text-anchor="middle" font-size="12" font-weight="800" fill="#0B35A3">流式网格</text>
      <text x="50" y="92" text-anchor="middle" font-size="11" fill="#4A505E">%</text>
      <rect x="96" y="28" width="68" height="94" fill="#FDF0E6" stroke="#E35C0E" stroke-width="2" />
      <text x="130" y="72" text-anchor="middle" font-size="12" font-weight="800" fill="#B34100">弹性图片</text>
      <text x="130" y="92" text-anchor="middle" font-size="11" fill="#4A505E">max 100%</text>
      <rect x="176" y="28" width="68" height="94" fill="#EEF2FA" stroke="#1043C6" stroke-width="2" />
      <text x="210" y="72" text-anchor="middle" font-size="12" font-weight="800" fill="#0B35A3">媒体查询</text>
      <text x="210" y="92" text-anchor="middle" font-size="11" fill="#4A505E">@media</text>
    </svg>`;
  }
  if (kind === "mostly-fluid") {
    return `<svg viewBox="0 0 260 150" role="img" aria-label="Mostly Fluid 大屏锁宽与小屏堆叠对照">
      <rect width="260" height="150" fill="#FFFBF6" />
      <!-- 大屏锁宽 -->
      <rect x="16" y="20" width="154" height="110" fill="#F4E9DC" stroke="#111214" stroke-width="1.5" />
      <rect x="38" y="28" width="110" height="36" fill="#1043C6" />
      <rect x="38" y="70" width="42" height="50" fill="#E35C0E" />
      <rect x="86" y="70" width="62" height="50" fill="#1043C6" opacity="0.72" />
      <!-- 小屏单列 -->
      <rect x="188" y="20" width="54" height="110" fill="#F4E9DC" stroke="#111214" stroke-width="1.5" />
      <rect x="195" y="28" width="40" height="26" fill="#1043C6" />
      <rect x="195" y="60" width="40" height="24" fill="#E35C0E" />
      <rect x="195" y="90" width="40" height="32" fill="#1043C6" opacity="0.72" />
    </svg>`;
  }
  return `<svg viewBox="0 0 260 150" role="img" aria-label="WCAG 1.4.10 320px 单向重排底线示意">
    <rect width="260" height="150" fill="#FFFBF6" />
    <rect x="64" y="18" width="132" height="114" fill="#EEF2FA" stroke="#1043C6" stroke-width="2" />
    <line x1="80" y1="42" x2="180" y2="42" stroke="#1043C6" stroke-width="6" />
    <line x1="80" y1="62" x2="174" y2="62" stroke="#4A505E" stroke-width="4" />
    <line x1="80" y1="78" x2="162" y2="78" stroke="#4A505E" stroke-width="4" />
    <path d="M 130 92 V 116 M 124 110 L 130 118 L 136 110" fill="none" stroke="#E35C0E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    <text x="130" y="144" text-anchor="middle" font-size="11" font-weight="800" fill="#0B35A3">320 CSS px · 仅纵向滚动</text>
  </svg>`;
}

function initSection5() {
  const rail = document.getElementById("s5-rail");
  const card = document.getElementById("s5-card");
  let idx = 2; // 默认指向 2012 Mostly Fluid 定名时刻

  const render = () => {
    const item = HISTORY_STEPS[idx];
    rail.querySelectorAll(".year-btn").forEach((b, i) => {
      const on = i === idx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    card.innerHTML = `<div class="tl-svg-box">${historySvg(item.wireframe)}</div>
      <div>
        <div class="tl-date">${item.date} · ${item.tag}</div>
        <h3 class="tl-title">${item.person} — ${item.work}</h3>
        <p class="tl-summary">${item.summary}</p>
        <p class="tl-impact"><strong>对大体流动的贡献：</strong>${item.impact}</p>
      </div>`;
  };

  HISTORY_STEPS.forEach((h, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.role = "tab";
    b.className = "year-btn";
    b.innerHTML = `<strong>${h.year}</strong><span>${h.tag}</span>`;
    b.addEventListener("click", () => {
      idx = i;
      render();
    });
    rail.appendChild(b);
  });

  render();
}

// ---------------- 06 节：单变量 4 选 1 测验 ----------------
function quizSvg(kind) {
  if (kind === "cap-margin") {
    return `<svg viewBox="0 0 220 96" aria-hidden="true">
      <rect width="220" height="96" fill="#F4E9DC" />
      <rect x="46" y="10" width="128" height="76" fill="#FFFFFF" stroke="#1043C6" stroke-width="2" />
      <rect x="54" y="18" width="112" height="24" fill="#1043C6" />
      <rect x="54" y="48" width="40" height="30" fill="#E35C0E" />
      <rect x="100" y="48" width="66" height="30" fill="#1043C6" opacity="0.7" />
    </svg>`;
  }
  if (kind === "hard-fixed") {
    return `<svg viewBox="0 0 220 96" aria-hidden="true">
      <rect width="220" height="96" fill="#F4E9DC" />
      <rect x="16" y="10" width="76" height="76" fill="#FFFFFF" stroke="#111214" stroke-width="1.5" />
      <rect x="22" y="18" width="124" height="24" fill="#1043C6" />
      <rect x="22" y="48" width="124" height="30" fill="#E35C0E" opacity="0.8" />
      <line x1="92" y1="6" x2="92" y2="90" stroke="#BD2222" stroke-width="2" stroke-dasharray="4 3" />
    </svg>`;
  }
  if (kind === "six-equal") {
    return `<svg viewBox="0 0 220 96" aria-hidden="true">
      <rect width="220" height="96" fill="#F4E9DC" />
      ${[0, 1, 2, 3, 4, 5]
        .map(
          (i) =>
            `<rect x="${10 + i * 34}" y="14" width="28" height="68" fill="#1043C6" opacity="${
              i % 2 ? 0.55 : 0.8
            }" />`
        )
        .join("")}
    </svg>`;
  }
  return `<svg viewBox="0 0 220 96" aria-hidden="true">
    <rect width="220" height="96" fill="#F4E9DC" />
    <rect x="84" y="8" width="52" height="80" fill="#FFFFFF" stroke="#1043C6" stroke-width="1.5" />
    <rect x="90" y="14" width="40" height="14" fill="#1043C6" />
    <rect x="90" y="32" width="40" height="14" fill="#E35C0E" />
    <rect x="90" y="50" width="40" height="14" fill="#1043C6" opacity="0.7" />
    <rect x="90" y="68" width="40" height="14" fill="#4A505E" opacity="0.6" />
  </svg>`;
}

function initSection6() {
  document.getElementById("quiz-prompt").textContent = QUIZ_DATA.prompt;
  const wrap = document.getElementById("quiz-options");
  const fb = document.getElementById("quiz-feedback");
  let chosen = null;

  const render = () => {
    wrap.querySelectorAll(".quiz-opt").forEach((b) => {
      const k = b.dataset.key;
      b.classList.remove("is-right", "is-wrong");
      b.setAttribute("aria-checked", String(chosen === k));
      if (chosen) {
        if (k === QUIZ_DATA.answer) b.classList.add("is-right");
        else if (k === chosen) b.classList.add("is-wrong");
      }
    });

    if (!chosen) {
      fb.hidden = true;
      return;
    }

    const opt = QUIZ_DATA.options.find((o) => o.key === chosen);
    const isRight = chosen === QUIZ_DATA.answer;
    fb.hidden = false;
    fb.className = `quiz-feedback ${isRight ? "is-right" : "is-wrong"}`;
    fb.innerHTML = `<p><strong>${
      isRight ? "答对了！" : `选了方案 ${chosen}，正确答案是方案 ${QUIZ_DATA.answer}。`
    }</strong> ${opt.explain}</p>
      <button type="button" class="quiz-reset" id="quiz-reset-btn">重新作答</button>`;
    document.getElementById("quiz-reset-btn").addEventListener("click", () => {
      chosen = null;
      render();
    });
  };

  QUIZ_DATA.options.forEach((o) => {
    const b = document.createElement("button");
    b.type = "button";
    b.role = "radio";
    b.className = "quiz-opt";
    b.dataset.key = o.key;
    b.setAttribute("aria-checked", "false");
    b.innerHTML = `${quizSvg(o.diagram)}<strong>${o.title}</strong><span>${o.desc}</span>`;
    b.addEventListener("click", () => {
      chosen = o.key;
      render();
    });
    wrap.appendChild(b);
  });
}

// ---------------- 07 节：原海报放大灯箱（共用唯一内联 src，绝不重复打包图片！） ----------------
function initLightbox() {
  const poster = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const stage = document.getElementById("lb-stage");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  const apply = () => {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  };

  const open = () => {
    lbImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
    lb.hidden = false;
    document.getElementById("lb-close").focus();
  };

  const close = () => {
    lb.hidden = true;
    document.getElementById("poster-open").focus();
  };

  document.getElementById("poster-open").addEventListener("click", open);
  document.getElementById("lb-close").addEventListener("click", close);
  document.getElementById("lb-in").addEventListener("click", () => {
    scale = clamp(+(scale + 0.35).toFixed(2), 0.7, 3.5);
    apply();
  });
  document.getElementById("lb-out").addEventListener("click", () => {
    scale = clamp(+(scale - 0.35).toFixed(2), 0.7, 3.5);
    apply();
  });
  document.getElementById("lb-reset").addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  });

  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    apply();
  });
  stage.addEventListener("pointerup", () => {
    dragging = false;
  });

  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = clamp(+(scale + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2), 0.7, 3.5);
      apply();
    },
    { passive: false }
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

// 启动全部模块
initHero();
initSection1();
initSection2();
initSection3();
initSection4();
initSection5();
initSection6();
initLightbox();

// 减少动态效果开关监听
reducedMotion.addEventListener("change", () => {
  if (heroLoop) heroLoop.draw();
});

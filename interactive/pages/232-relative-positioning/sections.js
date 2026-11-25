// 232 · 01–08 节各独立交互实验台与原海报灯箱
import { loop, reducedMotion } from "../../lib/stage.js";
import { PRACTICE_OPTIONS, SPEC_ERAS, evaluateCompass, fmtPx } from "./model.js";

export function initSections() {
  initFlowLab();
  initCompassLab();
  initStackLab();
  initEraTimeline();
  initUseSwitches();
  initPipelineLab();
  initQuiz();
  initPosterLightbox();
}

/* ==================== 01 节：真实段落流四步对比 ==================== */
function initFlowLab() {
  const viewport = document.getElementById("flow-viewport");
  const meter = document.getElementById("flow-meter");
  const blockCss = document.getElementById("flow-block-css");
  const readout = document.getElementById("flow-readout");
  const sibling = document.getElementById("flow-sibling");
  const tabs = document.querySelectorAll("[data-flow]");

  // 先记下普通流时下方段落的基准纵坐标
  let baseSiblingTop = sibling.offsetTop;

  const COPY = {
    pass1: {
      step: "步骤 1 / 4",
      css: "position: static;",
      lead: "Pass 1 普通流定格：",
      text: "行内徽章与块级公告条都老实坐在原始槽位，下方段落坐标锁定。",
    },
    relative: {
      step: "步骤 2 / 4",
      css: "position: relative; top: 16px; left: 34px;",
      lead: "Pass 2 相对偏移（原位保留）：",
      text: "行内文字留出精确缺口，块级蓝虚线原位不动；下方段落纵坐标位移为 0px，同时注意公告条已轻微压到下方段落上沿。",
    },
    absolute: {
      step: "步骤 3 / 4",
      css: "position: absolute; top: 16px; left: 34px;",
      lead: "改用 absolute（脱离文档流）：",
      text: "蓝色原位当场消失！正文行内缺口立刻合拢，下方段落瞬间向上顶起补位，被浮在空中的公告条直接盖住。",
    },
    margin: {
      step: "步骤 4 / 4",
      css: "margin-top: 24px; margin-left: 34px;",
      lead: "改用 margin（重排邻近兄弟）：",
      text: "外边距把元素和它后面的兄弟一起往下推，下方段落被整体顶离原位；这属于普通流重排，不是相对定位。",
    },
  };

  function select(mode) {
    viewport.dataset.mode = mode;
    tabs.forEach((btn) => {
      const on = btn.dataset.flow === mode;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", String(on));
    });
    const info = COPY[mode];
    meter.textContent = info.step;
    blockCss.textContent = info.css;

    // 下一帧实测真实 DOM 下方段落纵坐标变化 + 容器是否产生横向溢出滚动
    requestAnimationFrame(() => {
      if (mode === "pass1") baseSiblingTop = sibling.offsetTop;
      const dy = sibling.offsetTop - baseSiblingTop;
      const overflowX = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      const ovNote = overflowX > 2 ? `（已撑出横向溢出 +${overflowX}px）` : "";
      readout.innerHTML = `<strong>${info.lead}</strong>${info.text} 实测下方段落 Δy = <code>${fmtPx(dy)}</code>${ovNote}。`;
    });
  }

  tabs.forEach((btn) => btn.addEventListener("click", () => select(btn.dataset.flow)));
  select("pass1");
}

/* ==================== 02 节：真实 CSS 四边推杆罗盘 ==================== */
function initCompassLab() {
  const arena = document.getElementById("compass-arena");
  const target = document.getElementById("compass-target");
  const cssEl = document.getElementById("compass-css");
  const readout = document.getElementById("compass-readout");
  const dirBtns = document.querySelectorAll("[data-dir]");

  const edges = ["top", "bottom", "left", "right"];
  const cbs = Object.fromEntries(edges.map((e) => [e, document.getElementById(`cb-${e}`)]));
  const rngs = Object.fromEntries(edges.map((e) => [e, document.getElementById(`rng-${e}`)]));
  const vals = Object.fromEntries(edges.map((e) => [e, document.getElementById(`val-${e}`)]));

  let dir = "ltr";

  function update() {
    const modelInput = { dir };
    for (const e of edges) {
      const enabled = cbs[e].checked;
      rngs[e].disabled = !enabled;
      const num = Number(rngs[e].value);
      modelInput[e] = enabled ? num : null;
      vals[e].textContent = enabled ? `${num}px` : "auto";
      // 直接写入真实 CSS 属性，由浏览器自己执行方向与过约束消解
      target.style[e] = enabled ? `${num}px` : "auto";
    }
    arena.dir = dir;

    const res = evaluateCompass(modelInput);
    cbs.bottom.closest(".edge-ctrl").classList.toggle("is-ignored", res.ignoredBottom);
    cbs.right.closest(".edge-ctrl").classList.toggle("is-ignored", res.ignoredRight);
    cbs.left.closest(".edge-ctrl").classList.toggle("is-ignored", res.ignoredLeft);
    cbs.top.closest(".edge-ctrl").classList.remove("is-ignored");

    cssEl.textContent = res.css;
    readout.textContent = res.note;
  }

  edges.forEach((e) => {
    cbs[e].addEventListener("change", update);
    rngs[e].addEventListener("input", update);
  });

  dirBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      dir = btn.dataset.dir;
      dirBtns.forEach((b) => {
        const on = b.dataset.dir === dir;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      update();
    });
  });

  document.getElementById("btn-compass-inward").addEventListener("click", () => {
    cbs.top.checked = false;
    cbs.left.checked = false;
    cbs.bottom.checked = true;
    cbs.right.checked = true;
    rngs.bottom.value = "28";
    rngs.right.value = "32";
    update();
  });

  document.getElementById("btn-compass-conflict").addEventListener("click", () => {
    cbs.top.checked = true;
    cbs.bottom.checked = true;
    cbs.left.checked = true;
    cbs.right.checked = true;
    rngs.top.value = "18";
    rngs.bottom.value = "34";
    rngs.left.value = "26";
    rngs.right.value = "40";
    update();
  });

  document.getElementById("btn-compass-zero").addEventListener("click", () => {
    cbs.top.checked = true;
    cbs.left.checked = true;
    cbs.bottom.checked = false;
    cbs.right.checked = false;
    rngs.top.value = "0";
    rngs.left.value = "0";
    update();
  });

  update();
}

/* ==================== 03 节：层叠上下文陷阱 ==================== */
function initStackLab() {
  const stage = document.getElementById("stack-stage");
  const cardA = document.getElementById("stack-card-a");
  const aCode = document.getElementById("stack-a-code");
  const readout = document.getElementById("stack-readout");
  const explodeBtn = document.getElementById("btn-stack-explode");
  const pills = document.querySelectorAll("[data-parent-z]");

  const NOTES = {
    "1": "<strong>当前状态（困在局部上下文）：</strong>卡片甲的 <code>z-index: 1</code> 建起了封闭房间，里面的 <code>9999</code> 只能在房间内称王；在根层级比拼时，房间整体（1）输给了卡片乙（2），下拉菜单被拦腰截断。",
    "auto": "<strong>当前状态（解除层叠隔离）：</strong>卡片甲保持 <code>position: relative; z-index: auto</code>——它照样能当包含块锚定菜单，却不建封闭房间。于是菜单的 <code>z-index: 9999</code> 直接到根层级与卡片乙（2）对决，干净浮出顶层。",
    "3": "<strong>当前状态（整体抬高父层）：</strong>卡片甲升到 <code>z-index: 3</code> 压过了卡片乙（2），菜单露出来了——但这种做法容易引发整页层叠数字不断攀升，若无隔离需求，优先保持父级 <code>z-index: auto</code>。",
  };

  function setZ(z) {
    cardA.style.zIndex = z;
    aCode.textContent = `relative; z-index: ${z}`;
    readout.innerHTML = NOTES[z];
    pills.forEach((b) => {
      const on = b.dataset.parentZ === z;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  pills.forEach((b) => b.addEventListener("click", () => setZ(b.dataset.parentZ)));

  explodeBtn.addEventListener("click", () => {
    const next = stage.dataset.exploded !== "true";
    stage.dataset.exploded = String(next);
    explodeBtn.setAttribute("aria-pressed", String(next));
    explodeBtn.textContent = next ? "收回平面视图" : "展开 Z 轴透视";
  });

  setZ("1");
}

/* ==================== 04 节：四代 W3C 规范蓝图 ==================== */
function initEraTimeline() {
  const host = document.getElementById("era-tabs");
  const dateEl = document.getElementById("era-date");
  const badgeEl = document.getElementById("era-badge");
  const titleEl = document.getElementById("era-title");
  const peopleEl = document.getElementById("era-people");
  const summaryEl = document.getElementById("era-summary");
  const codeEl = document.getElementById("era-code");

  host.innerHTML = SPEC_ERAS.map((era, i) => `
    <button type="button" class="era-btn ${i === 0 ? "is-active" : ""}" data-era="${era.id}" role="tab" aria-selected="${i === 0}">
      <span class="era-btn-year">${era.year}</span>
      <span class="era-btn-name">${era.title}</span>
      <span class="era-btn-en">${era.en}</span>
    </button>
  `).join("");

  const btns = host.querySelectorAll("[data-era]");

  function pick(id) {
    const era = SPEC_ERAS.find((x) => x.id === id) || SPEC_ERAS[0];
    btns.forEach((b) => {
      const on = b.dataset.era === era.id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    dateEl.textContent = era.date;
    badgeEl.textContent = era.tag;
    titleEl.textContent = era.title;
    peopleEl.textContent = era.people;
    summaryEl.textContent = era.summary;
    codeEl.textContent = era.code;
  }

  btns.forEach((b) => b.addEventListener("click", () => pick(b.dataset.era)));
  pick("wd1997");
}

/* ==================== 05 节：四组真 UI 开关验收箱 ==================== */
function initUseSwitches() {
  const NOTES = {
    icon: {
      on: "<code>top: 2px</code> 把星标微沉两像素对齐汉字光学中线，丝毫不撑高行高。",
      off: "关掉 relative 后，星标贴着顶部基线向上漂起，和旁边汉字错开一截。",
    },
    badge: {
      on: "按钮本身设 <code>position: relative</code>（零偏移），红色数字角标牢牢贴在按钮右上角。",
      off: "关掉 relative 后，按钮退回 static，数字 9 立刻逃逸飞到了外层灰框右上角！",
    },
    group: {
      on: "相邻边框用 <code>margin-left: -2px</code> 合并后，聚焦项靠 <code>relative; z-index: 1</code> 浮出完整朱红右边框。",
      off: "关掉 relative 后，右侧「查询」按钮的黑边框压过了输入框，聚焦朱红右边框被吞掉一半。",
    },
    decor: {
      on: "只把上层卡片偏出 <code>-8px</code> 露出底部蓝图框，不扰动周边任何模块间距。",
      off: "关掉 relative 后，上层卡片贴死底框，层次感与视觉落差立刻消失。",
    },
  };

  document.querySelectorAll("[data-toggle-use]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.toggleUse;
      const card = btn.closest(".use-card");
      const next = card.dataset.on !== "true";
      card.dataset.on = String(next);
      btn.classList.toggle("is-on", next);
      btn.setAttribute("aria-pressed", String(next));
      btn.textContent = next ? "relative：开" : "relative：关";
      const noteEl = document.querySelector(`[data-use-note="${key}"]`);
      if (noteEl) noteEl.innerHTML = NOTES[key][next ? "on" : "off"];
    });
  });
}

/* ==================== 06 节：top/left vs transform 渲染管线对比 ==================== */
function initPipelineLab() {
  const track = document.getElementById("pipe-track");
  const mover = document.getElementById("pipe-mover");
  const label = document.getElementById("pipe-mover-label");
  const stages = document.getElementById("pipe-stages");
  const pixelNote = document.getElementById("pipe-pixel-note");
  const readout = document.getElementById("pipe-readout");
  const playBtn = document.getElementById("btn-pipe-play");
  const modeBtns = document.querySelectorAll("[data-pipe]");

  let mode = "offset";
  let playing = !reducedMotion.matches;
  let phase = 0.35;

  function applyModeUI() {
    stages.dataset.pipe = mode;
    modeBtns.forEach((b) => {
      const on = b.dataset.pipe === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (mode === "offset") {
      pixelNote.textContent = "整数像素步进 · 触发 Layout + Paint + Composite";
      readout.innerHTML = "<strong>使用 top / left 做持续位移：</strong>每帧改动几何偏移都会惊动浏览器主线程的布局与绘制阶段；静置微调无伤大雅，高频动效请换成 <code>transform: translate()</code>。";
    } else {
      pixelNote.textContent = "亚像素平滑合成 · 跳过 Layout 与 Paint";
      readout.innerHTML = "<strong>改用 transform: translate()：</strong>同样保留蓝色虚线文档流原位，但把逐帧位移直接交给 GPU 合成层，不触发布局重算与重绘。";
    }
    playBtn.textContent = playing ? "暂停演示" : "继续演示";
    playBtn.setAttribute("aria-pressed", String(playing));
  }

  function renderAt(p) {
    const maxTravel = Math.max(40, track.clientWidth - 164);
    const x = ((Math.sin(p) + 1) * 0.5) * maxTravel;
    if (mode === "offset") {
      const ix = Math.round(x);
      mover.style.transform = "";
      mover.style.left = `${ix}px`;
      label.textContent = `left: ${ix}px`;
    } else {
      mover.style.left = "0px";
      mover.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
      label.textContent = `translateX(${x.toFixed(1)}px)`;
    }
  }

  const pipeLoop = loop(track, (_t, dt, { still }) => {
    if (still) {
      renderAt(0.45);
      return;
    }
    if (!playing) return;
    phase += dt * 1.9;
    renderAt(phase);
  });

  modeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      mode = b.dataset.pipe;
      applyModeUI();
      renderAt(phase);
    });
  });

  playBtn.addEventListener("click", () => {
    playing = !playing;
    applyModeUI();
    pipeLoop.draw();
  });

  applyModeUI();
  renderAt(phase);
}

/* ==================== 07 节：单变量小练习 ==================== */
function initQuiz() {
  const stage = document.getElementById("quiz-stage");
  const optHost = document.getElementById("quiz-options");
  const feedback = document.getElementById("quiz-feedback");
  const verdict = document.getElementById("quiz-verdict");
  const explain = document.getElementById("quiz-explain");

  optHost.innerHTML = PRACTICE_OPTIONS.map((opt) => `
    <button type="button" class="quiz-opt" data-opt="${opt.id}" aria-pressed="false">
      <span class="quiz-opt-label">${opt.label}</span>
      <pre>${opt.code}</pre>
    </button>
  `).join("");

  const btns = optHost.querySelectorAll("[data-opt]");

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const opt = PRACTICE_OPTIONS.find((x) => x.id === btn.dataset.opt);
      if (!opt) return;
      stage.dataset.choice = opt.id;

      btns.forEach((b) => {
        const picked = b.dataset.opt === opt.id;
        b.classList.toggle("is-picked", picked);
        b.classList.toggle("is-correct", picked && opt.correct);
        b.setAttribute("aria-pressed", String(picked));
      });

      feedback.hidden = false;
      feedback.dataset.correct = String(opt.correct);
      verdict.textContent = `${opt.label} · ${opt.correct ? "答对了！" : "再看一眼"} ${opt.verdict}`;
      explain.textContent = opt.explain;
    });
  });
}

/* ==================== 08 节：原海报放大拖动灯箱 ==================== */
function initPosterLightbox() {
  const openBtn = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const box = document.getElementById("lightbox");
  const stage = document.getElementById("lb-stage");
  const lbImg = document.getElementById("lb-img");
  const closeBtn = document.getElementById("lb-close");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const zoomResetBtn = document.getElementById("lb-zoom-reset");

  let scale = 1;
  let panX = 0;
  let panY = 0;
  let drag = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1;
    panX = 0;
    panY = 0;
    applyTransform();
    box.hidden = false;
    closeBtn.focus();
  }

  function close() {
    box.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);

  zoomInBtn.addEventListener("click", () => {
    scale = Math.min(3.5, scale + 0.35);
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(0.6, scale - 0.35);
    applyTransform();
  });
  zoomResetBtn.addEventListener("click", () => {
    scale = 1;
    panX = 0;
    panY = 0;
    applyTransform();
  });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.6, Math.min(3.5, scale - Math.sign(e.deltaY) * 0.2));
    applyTransform();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    stage.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, x: e.clientX - panX, y: e.clientY - panY };
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    panX = e.clientX - drag.x;
    panY = e.clientY - drag.y;
    applyTransform();
  });
  const endPan = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    try { stage.releasePointerCapture(e.pointerId); } catch {}
    drag = null;
  };
  stage.addEventListener("pointerup", endPan);
  stage.addEventListener("pointercancel", endPan);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });
}

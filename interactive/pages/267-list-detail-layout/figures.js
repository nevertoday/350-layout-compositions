// 01 / 03 / 04 / 05 / 07 / 08 节交互逻辑与海报放大查看器
import { reducedMotion } from "../../lib/stage.js";
import { QUIZ, TICKETS, breakpointInfo, clamp } from "./model.js";

const $ = (id) => document.getElementById(id);

export function initFigures() {
  initReveal();
  initContrastLab();
  initSwitchCostLab();
  initResponsiveLab();
  initDensityLab();
  initQuiz();
  initPosterViewer();
}

// ---------- 滚动渐显（保守、不卡屏、尊重减少动态效果） ----------
function initReveal() {
  const els = [...document.querySelectorAll(".reveal")];
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
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
    { threshold: 0.01, rootMargin: "80px 0px 80px 0px" }
  );
  els.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight + 40) el.classList.add("in");
    else io.observe(el);
  });
}

// ---------- 01 节：关掉明暗对照 / 焦点对比实验 ----------
function initContrastLab() {
  const box = $("contrast-demo");
  const readout = $("contrast-read");
  const btns = [...document.querySelectorAll("[data-contrast]")];
  if (!box) return;

  const COPY = {
    poster: "原版层级：暗列表压低视觉噪音，暖米详情抬高亮度，亮橙只给唯一选中项与右下行动按钮。眼睛 1 秒内就顺着橙条落进详情。",
    flat: "去掉明暗对照：左右两栏一样亮，列表不再像退后的目录，整页变成两大块并排的白框，眼睛要在两边来回犹豫。",
    noisy: "去掉唯一焦点：每条列表都挂满亮橙色标和按钮，主次瞬间塌陷——处处都在喊「看我」，结果哪里都看不进去。",
  };

  const apply = (mode) => {
    box.dataset.mode = mode;
    readout.textContent = COPY[mode];
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.contrast === mode)));
  };
  btns.forEach((b) => b.addEventListener("click", () => apply(b.dataset.contrast)));
  apply("poster");
}

// ---------- 03 节：切换成本对比实验（单页跳页 vs 列表—详情同屏） ----------
function initSwitchCostLab() {
  const root = $("cost-lab");
  if (!root) return;

  const modeBtns = [...root.querySelectorAll("[data-cost-mode]")];
  const listWrap = $("cost-list");
  const detailWrap = $("cost-detail");
  const backBtn = $("cost-back");
  const autoBtn = $("cost-auto");
  const resetBtn = $("cost-reset");

  const st = {
    mode: "split", // "split" | "page"
    view: "list",  // 单页模式下 "list" | "detail"
    selected: 0,
    visited: new Set([0]),
    steps: 1,      // 页面切换 / 点击次数
    backs: 0,      // 返回次数
    timer: 0,
  };

  function stopAuto() {
    if (st.timer) {
      clearInterval(st.timer);
      st.timer = 0;
      autoBtn.textContent = "演示连看 5 条";
      autoBtn.setAttribute("aria-pressed", "false");
    }
  }

  function render() {
    root.dataset.mode = st.mode;
    root.dataset.view = st.view;
    modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.costMode === st.mode)));

    listWrap.querySelectorAll(".cl-row").forEach((btn, i) => {
      const sel = i === st.selected && (st.mode === "split" || st.view === "detail");
      btn.setAttribute("aria-selected", String(sel));
      btn.classList.toggle("is-active", sel);
      btn.classList.toggle("is-seen", st.visited.has(i));
    });

    const tk = TICKETS[st.selected];
    $("cd-id").textContent = tk.id;
    $("cd-tag").textContent = tk.tag;
    $("cd-title").textContent = tk.title;
    $("cd-meta").textContent = tk.meta;
    $("cd-body").textContent = tk.body;
    $("cd-cta").textContent = tk.cta;

    $("cost-seen").textContent = `${st.visited.size} / ${TICKETS.length}`;
    $("cost-steps").textContent = `${st.steps} 次`;
    $("cost-backs").textContent = `${st.backs} 次`;

    const msg = $("cost-read");
    if (st.mode === "split") {
      msg.textContent =
        st.visited.size >= TICKETS.length
          ? `列表—详情同屏模式：看完 5 条共点 ${st.steps} 次、返回 0 次。列表始终留在左手边，看得见哪条已看、下一条在哪。`
          : "列表—详情同屏模式：直接点左侧任意工单，右侧就地刷新。不用点「返回」，上下文一直留在眼前。";
    } else {
      msg.textContent =
        st.visited.size >= TICKETS.length
          ? `单页来回跳转模式：看完 5 条一共走了 ${st.steps} 步，其中 ${st.backs} 次花在「点返回退回列表」上，每次切屏都得重新找刚才看到哪一行。`
          : st.view === "detail"
            ? "单页跳转模式：详情占满全屏，原来的列表不见了——想看下一条，必须先点左上角「← 返回列表」。"
            : "单页跳转模式：点进一条后列表会整屏消失。试试连续看完 5 条，感受多出来的「返回」步数。";
    }
  }

  function reset(newMode = st.mode) {
    stopAuto();
    st.mode = newMode;
    st.view = newMode === "split" ? "detail" : "list";
    st.selected = 0;
    st.visited = newMode === "split" ? new Set([0]) : new Set();
    st.steps = newMode === "split" ? 1 : 0;
    st.backs = 0;
    render();
  }

  modeBtns.forEach((b) => b.addEventListener("click", () => reset(b.dataset.costMode)));

  listWrap.querySelectorAll(".cl-row").forEach((btn, i) => {
    btn.addEventListener("click", () => {
      stopAuto();
      st.selected = i;
      st.visited.add(i);
      st.steps += 1;
      if (st.mode === "page") st.view = "detail";
      render();
    });
  });

  backBtn.addEventListener("click", () => {
    stopAuto();
    if (st.mode === "page" && st.view === "detail") {
      st.view = "list";
      st.steps += 1;
      st.backs += 1;
      render();
    }
  });

  resetBtn.addEventListener("click", () => reset(st.mode));

  autoBtn.addEventListener("click", () => {
    if (st.timer) {
      stopAuto();
      return;
    }
    reset(st.mode);
    const queue = [];
    if (st.mode === "split") {
      for (let i = 1; i < TICKETS.length; i++) queue.push({ act: "open", i });
    } else {
      for (let i = 0; i < TICKETS.length; i++) {
        queue.push({ act: "open", i });
        if (i < TICKETS.length - 1) queue.push({ act: "back" });
      }
    }
    if (reducedMotion.matches) {
      for (const step of queue) {
        if (step.act === "open") {
          st.selected = step.i;
          st.visited.add(step.i);
          st.steps += 1;
          if (st.mode === "page") st.view = "detail";
        } else {
          st.view = "list";
          st.steps += 1;
          st.backs += 1;
        }
      }
      render();
      return;
    }
    autoBtn.textContent = "停止演示";
    autoBtn.setAttribute("aria-pressed", "true");
    st.timer = setInterval(() => {
      const step = queue.shift();
      if (!step) {
        stopAuto();
        return;
      }
      if (step.act === "open") {
        st.selected = step.i;
        st.visited.add(step.i);
        st.steps += 1;
        if (st.mode === "page") st.view = "detail";
      } else {
        st.view = "list";
        st.steps += 1;
        st.backs += 1;
      }
      render();
    }, 520);
  });

  render();
}

// ---------- 04 节：响应式视口宽度模拟器 ----------
function initResponsiveLab() {
  const range = $("bp-range");
  const forceChk = $("bp-force");
  const sim = $("bp-sim");
  const backBtn = $("bp-back");
  if (!range || !sim) return;

  const presets = [...document.querySelectorAll("[data-bp]")];
  const rows = [...sim.querySelectorAll(".bp-row")];
  const state = { width: 960, force: false, selected: 0, compactPane: "list" };

  function render() {
    const info = breakpointInfo(state.width, state.force);
    range.value = String(state.width);
    $("bp-px").textContent = `${state.width}px`;
    const tag = $("bp-tier");
    tag.textContent = info.name;
    tag.dataset.mode = info.mode;
    $("bp-read").textContent = info.text;

    // 比例尺预览壳宽：相对 1280px 映射，窄屏幕时不超过容器宽
    const pct = clamp((state.width / 1280) * 100, 32, 100);
    sim.style.setProperty("--sim-pct", `${pct.toFixed(1)}%`);
    sim.dataset.mode = info.mode;
    sim.dataset.pane = state.compactPane;

    // 只在 Compact 区间启用「反例：强行双栏」选项提示
    forceChk.disabled = state.width >= 600;
    forceChk.closest("label").classList.toggle("is-disabled", state.width >= 600);

    presets.forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.bp === state.width)));

    rows.forEach((btn, i) => {
      const sel = i === state.selected;
      btn.setAttribute("aria-selected", String(sel));
      btn.classList.toggle("is-active", sel);
    });
    const tk = TICKETS[state.selected];
    $("bp-d-id").textContent = tk.id;
    $("bp-d-title").textContent = tk.title;
    $("bp-d-meta").textContent = tk.meta;
    $("bp-d-body").textContent = tk.body;
    $("bp-d-cta").textContent = tk.cta;
  }

  range.addEventListener("input", () => {
    state.width = +range.value;
    if (state.width >= 600) state.compactPane = "list";
    render();
  });
  presets.forEach((b) =>
    b.addEventListener("click", () => {
      state.width = +b.dataset.bp;
      state.compactPane = "list";
      render();
    })
  );
  forceChk.addEventListener("change", () => {
    state.force = forceChk.checked;
    render();
  });
  rows.forEach((btn, i) =>
    btn.addEventListener("click", () => {
      state.selected = i;
      if (state.width < 600 && !state.force) state.compactPane = "detail";
      render();
    })
  );
  backBtn.addEventListener("click", () => {
    state.compactPane = "list";
    render();
  });

  render();
}

// ---------- 05 节：列表密度调节器 ----------
function initDensityLab() {
  const demo = $("density-demo");
  const readout = $("density-read");
  const btns = [...document.querySelectorAll("[data-density]")];
  if (!demo) return;

  const COPY = {
    sparse: "信息过简：列表里只剩冷冰冰的编号，没有标题和状态。想找「发票抬头」那一条，只能从头到尾盲点一遍。",
    balanced: "信息刚好：每行只放「状态点 + 清晰标题 + 一行短线索」，一屏能扫 5–8 条，点中后在右边看正文并点击主按钮。",
    bloated: "列表过载：把正文、配图、标签和三个操作按钮全塞进左栏，每一项胀成一张大卡片——一屏只看得到两条，列表自己抢走了详情的活。",
  };

  const apply = (d) => {
    demo.dataset.density = d;
    readout.textContent = COPY[d];
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.density === d)));
  };
  btns.forEach((b) => b.addEventListener("click", () => apply(b.dataset.density)));
  apply("balanced");
}

// ---------- 07 节：小练习 ----------
function initQuiz() {
  const picks = [...document.querySelectorAll("[data-pick]")];
  const title = $("quiz-title");
  const text = $("quiz-text");
  const box = $("quiz-out");
  if (!picks.length) return;

  picks.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.pick;
      const ans = QUIZ[k];
      picks.forEach((p) => {
        const isMe = p === btn;
        const isRight = QUIZ[p.dataset.pick].right;
        p.setAttribute("aria-pressed", String(isMe));
        p.classList.toggle("is-picked", isMe);
        p.classList.toggle("is-right", isRight);
        p.classList.toggle("is-wrong", isMe && !isRight);
      });
      title.textContent = ans.title;
      text.textContent = ans.text;
      box.dataset.state = ans.right ? "right" : "wrong";
    });
  });
}

// ---------- 08 节：原海报放大查看器（支持缩放、拖动、Esc 关闭） ----------
function initPosterViewer() {
  const openBtn = $("poster-open");
  const poster = $("poster");
  const dlg = $("viewer");
  const img = $("viewer-img");
  const scroller = $("viewer-scroll");
  const zoomOut = $("zoom-out");
  const zoomIn = $("zoom-in");
  const zoomReset = $("zoom-reset");
  const zoomVal = $("zoom-val");
  const closeBtn = $("viewer-close");
  if (!openBtn || !dlg) return;

  let zoom = 1;
  const setZoom = (z) => {
    zoom = clamp(Math.round(z * 100) / 100, 0.75, 2.5);
    img.style.width = `${Math.round(zoom * 100)}%`;
    zoomVal.textContent = `${Math.round(zoom * 100)}%`;
    zoomOut.disabled = zoom <= 0.75;
    zoomIn.disabled = zoom >= 2.5;
  };

  openBtn.addEventListener("click", () => {
    if (!img.src) img.src = poster.src;
    setZoom(1);
    dlg.showModal();
    document.documentElement.classList.add("noscroll");
    closeBtn.focus();
  });

  const finishClose = () => {
    document.documentElement.classList.remove("noscroll");
    openBtn.focus();
  };
  dlg.addEventListener("close", finishClose);
  closeBtn.addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
  });

  zoomOut.addEventListener("click", () => setZoom(zoom - 0.25));
  zoomIn.addEventListener("click", () => setZoom(zoom + 0.25));
  zoomReset.addEventListener("click", () => setZoom(1));

  // 鼠标拖动查看放大后的海报
  let drag = null;
  scroller.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sl: scroller.scrollLeft, st: scroller.scrollTop };
    try { scroller.setPointerCapture(e.pointerId); } catch {}
    scroller.classList.add("dragging");
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    scroller.scrollLeft = drag.sl - (e.clientX - drag.x);
    scroller.scrollTop = drag.st - (e.clientY - drag.y);
  });
  const endDrag = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    drag = null;
    scroller.classList.remove("dragging");
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
}

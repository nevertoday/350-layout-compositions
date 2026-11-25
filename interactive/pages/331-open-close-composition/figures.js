// 331 开合构图 — 01–07 节各异交互装置
// 01 四向边墙解剖板 | 02 瞭望庇护前后滑帘 | 03 古画嵌套透视镜
// 04 四景实景收放工坊 | 05 反例撤框诊断器 | 06 单变量练习 | 07 原海报灯箱

import { evaluateTopology, QUIZ_OPTIONS, computeGeometry } from "./model.js";

// =========================================================================
// 01 节：四向门框解剖板（16 种开合拓扑）
// =========================================================================
export function initTopologyBoard() {
  const root = document.getElementById("topo-board");
  if (!root) return;

  const edges = { top: false, right: true, bottom: false, left: true };
  const buttons = {
    top: root.querySelector('[data-edge="top"]'),
    right: root.querySelector('[data-edge="right"]'),
    bottom: root.querySelector('[data-edge="bottom"]'),
    left: root.querySelector('[data-edge="left"]'),
  };
  const walls = {
    top: root.querySelector('[data-wall="top"]'),
    right: root.querySelector('[data-wall="right"]'),
    bottom: root.querySelector('[data-wall="bottom"]'),
    left: root.querySelector('[data-wall="left"]'),
  };
  const rays = {
    top: root.querySelector('[data-ray="top"]'),
    right: root.querySelector('[data-ray="right"]'),
    bottom: root.querySelector('[data-ray="bottom"]'),
    left: root.querySelector('[data-ray="left"]'),
  };

  const elTag = document.getElementById("topo-tag");
  const elTitle = document.getElementById("topo-title");
  const elBody = document.getElementById("topo-body");
  const elRatio = document.getElementById("topo-ratio");
  const presetBtns = root.querySelectorAll("[data-topo-preset]");

  function update() {
    const res = evaluateTopology(edges);
    for (const dir of ["top", "right", "bottom", "left"]) {
      const closed = edges[dir];
      const btn = buttons[dir];
      if (btn) {
        btn.setAttribute("aria-pressed", String(closed));
        btn.classList.toggle("is-closed", closed);
        btn.querySelector("span").textContent = closed ? "合" : "开";
      }
      if (walls[dir]) walls[dir].classList.toggle("is-closed", closed);
      if (rays[dir]) rays[dir].classList.toggle("is-open", !closed);
    }
    elTag.textContent = res.tag;
    elTag.dataset.status = res.status;
    elTitle.textContent = res.title;
    elBody.textContent = res.body;
    elRatio.textContent = `围合 ${res.closedCount}/4 边（${res.closedPct}%）· 开口 ${res.openCount}/4 边（${res.openPct}%）`;
  }

  for (const [dir, btn] of Object.entries(buttons)) {
    btn?.addEventListener("click", () => {
      edges[dir] = !edges[dir];
      update();
    });
  }

  const PRESET_MAP = {
    poster: { top: false, right: true, bottom: false, left: true },
    scroll: { top: true, right: false, bottom: true, left: false },
    corner: { top: false, right: false, bottom: true, left: true },
    sealed: { top: true, right: true, bottom: true, left: true },
    naked: { top: false, right: false, bottom: false, left: false },
  };
  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = PRESET_MAP[btn.dataset.topoPreset];
      if (!p) return;
      Object.assign(edges, p);
      update();
    });
  });

  update();
}

// =========================================================================
// 02 节：瞭望—庇护 前后对比滑帘（Split Curtain Comparator）
// =========================================================================
export function initSplitCurtain() {
  const stage = document.getElementById("curtain-stage");
  const range = document.getElementById("curtain-range");
  const clipEl = document.getElementById("curtain-after");
  const divider = document.getElementById("curtain-divider");
  const noteEl = document.getElementById("curtain-note");
  const sceneBtns = document.querySelectorAll("[data-curtain-scene]");
  if (!stage || !range || !clipEl || !divider) return;

  let pct = 52;
  let scene = "courtyard";

  const SCENE_COPY = {
    courtyard: {
      low: "左侧占优：没有左右门墙庇护时，背景杂景与主体争抢视野，模拟视线落点四散（示意）。",
      mid: "对比滑帘停在中间：向左划看无围合平铺，向右划看双侧门壁围护后视线如何先聚心、再透向远景（示意）。",
      high: "右侧占优：两侧暗墙先屏蔽周边干扰、给足庇护感（合），中央敞口直通远山与光亮（开），视线停留更集中（示意）。",
    },
    poster: {
      low: "左侧占优：版面全白散排，元素与四边等距平铺，眼睛没有入口也没有收束点（示意）。",
      mid: "左右对照：同一组文字与主图，右侧仅用两道朱红侧翼立住「合」，上下留白顺势成「开」（示意）。",
      high: "右侧占优：两侧色块把余光收拢到中轴标题，上下大留白让版面不显得沉重，节奏立刻拉出反差（示意）。",
    },
  };

  function apply() {
    clipEl.style.clipPath = `inset(0 0 0 ${pct}%)`;
    divider.style.left = `${pct}%`;
    range.value = String(Math.round(pct));
    stage.dataset.scene = scene;
    const copy = SCENE_COPY[scene];
    noteEl.textContent = pct < 30 ? copy.high : pct > 70 ? copy.low : copy.mid;
  }

  range.addEventListener("input", () => {
    pct = Number(range.value);
    apply();
  });

  // 支持直接在舞台上左右拖动滑帘
  let dragging = false;
  const moveToClientX = (clientX) => {
    const r = stage.getBoundingClientRect();
    pct = Math.max(8, Math.min(92, ((clientX - r.left) / r.width) * 100));
    apply();
  };
  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    moveToClientX(e.clientX);
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (dragging) moveToClientX(e.clientX);
  });
  const stop = () => { dragging = false; };
  stage.addEventListener("pointerup", stop);
  stage.addEventListener("pointercancel", stop);

  sceneBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      scene = btn.dataset.curtainScene;
      sceneBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      apply();
    });
  });

  apply();
}

// =========================================================================
// 03 节：古画「通幅大开合 × 分股小开合」嵌套透视镜
// =========================================================================
export function initScrollBlueprint() {
  const wrap = document.getElementById("scroll-blueprint");
  if (!wrap) return;

  const modeBtns = wrap.querySelectorAll("[data-scroll-layer]");
  const spots = wrap.querySelectorAll("[data-scroll-spot]");
  const svg = document.getElementById("scroll-svg");
  const titleEl = document.getElementById("scroll-spot-title");
  const quoteEl = document.getElementById("scroll-spot-quote");
  const descEl = document.getElementById("scroll-spot-desc");

  const SPOT_INFO = {
    peak: {
      title: "上段主峰 · 大局之「合」与顶空之「开」",
      quote: "「主山如何结顶，云气如何空白……要有收拾而无馀溢，所谓合也。」——沈宗骞《芥舟学画编》（1781）",
      desc: "立轴上部把全画气势聚拢回中轴主峰，让观者的仰望有个稳固落点；同时在主峰顶端与两侧留出天际空白，不让山头顶死画框。",
    },
    mist: {
      title: "山腰流岚 · 通幅大开合里的「横破之开」",
      quote: "「有时结聚，有时澹荡，峰回路转，云合水分，俱从此出。」——王原祁《雨窗漫笔》",
      desc: "北宋郭熙《早春图》（1072）最绝妙处在于山腰一道流动云气：它把实厚山体横向切开，让原本压迫的巨碑立出呼吸口，同时引出远谷深邃的平远空间。",
    },
    valley: {
      title: "近景树石 · 分股中的「小开小合」",
      quote: "「且通幅有开合，分股中亦有开合。」——王原祁《雨窗漫笔》",
      desc: "即使只看画幅下半的近景，也藏着一套微型开合：左右古松与巨石向内相抱成「小合」，中间一条溪水小径蜿蜒向山谷深处敞开成「小开」，接引观者步入画中。",
    },
  };

  let layer = "both";
  let activeSpot = "mist";

  function render() {
    svg.dataset.layer = layer;
    modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scrollLayer === layer)));
    spots.forEach((s) => s.setAttribute("aria-pressed", String(s.dataset.scrollSpot === activeSpot)));
    const info = SPOT_INFO[activeSpot];
    titleEl.textContent = info.title;
    quoteEl.textContent = info.quote;
    descEl.textContent = info.desc;
  }

  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      layer = b.dataset.scrollLayer;
      render();
    })
  );
  spots.forEach((s) =>
    s.addEventListener("click", () => {
      activeSpot = s.dataset.scrollSpot;
      render();
    })
  );

  render();
}

// =========================================================================
// 04 节：四类真实场景开合工坊（封面 / 海报 / 摄影剪影 / 杂志跨页）
// =========================================================================
export function initScenarioStudio() {
  const root = document.getElementById("scenario-studio");
  if (!root) return;

  const tabs = root.querySelectorAll("[data-scene-tab]");
  const panels = root.querySelectorAll("[data-scene-panel]");
  const slider = document.getElementById("scene-slider");
  const valOut = document.getElementById("scene-val");
  const verdictOut = document.getElementById("scene-verdict");
  const labelOut = document.getElementById("scene-slider-label");

  const META = {
    book: {
      sliderLabel: "左右护封折页宽幅",
      low: "折翼仅占边丝：书名在白底上缺少包夹感，远看容易和普通素面书混淆。",
      ok: "开合得当：双侧朱红护翼稳稳托住书名，上下留白透出书卷气与呼吸感。",
      high: "折翼侵入过深：中轴字块被压得紧贴边线，版面变得局促发闷。",
    },
    poster: {
      sliderLabel: "两侧排印信息栏侵入度",
      low: "两侧栏位撤空：展讯主视觉失去边栏烘托，画面显薄。",
      ok: "开合得当：左右竖排信息柱充当「合」的边墙，上下大留白释放中央建筑主图。",
      high: "侧栏压迫过重：文字柱挤占主图净空，观众不知道先看字还是先看图。",
    },
    photo: {
      sliderLabel: "前景建筑门框遮挡比例",
      low: "前景门框几乎出画：人物剪影直接暴露在宽广背景里，纵深层次骤降。",
      ok: "开合得当：左右深色门框形成前景暗「合」，引导视线直奔敞亮门廊中的远行剪影。",
      high: "前景门壁吃掉大半画面：缝隙过窄，主体被压在狭缝里透不过气。",
    },
    spread: {
      sliderLabel: "外侧图文栏收束宽度",
      low: "左右正文散开贴边：跨页中缝显得空洞割裂，读起来缺少聚拢感。",
      ok: "开合得当：外侧图文块温和向中轴围合，中央跨页主图上下畅通，翻页节奏极稳。",
      high: "两侧图文挤进中缝：跨页主图被左右栏位夹成细条，完全失去气势。",
    },
  };

  let active = "book";
  let amount = 54;

  function apply() {
    tabs.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.sceneTab === active)));
    panels.forEach((p) => {
      const on = p.dataset.scenePanel === active;
      p.hidden = !on;
      if (on) {
        // 统一将 10..88 映射成每个真实样张的侧翼宽度 CSS 变量
        const wingPct = (6 + (amount / 100) * 32).toFixed(1);
        p.style.setProperty("--wing", `${wingPct}%`);
        p.dataset.zone = amount < 28 ? "open" : amount > 76 ? "close" : "good";
      }
    });
    const m = META[active];
    labelOut.textContent = m.sliderLabel;
    valOut.textContent = `${Math.round(6 + (amount / 100) * 32)}% / 侧`;
    verdictOut.textContent = amount < 28 ? m.low : amount > 76 ? m.high : m.ok;
    verdictOut.dataset.zone = amount < 28 ? "open" : amount > 76 ? "close" : "good";
  }

  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      active = t.dataset.sceneTab;
      apply();
    })
  );
  slider?.addEventListener("input", () => {
    amount = Number(slider.value);
    apply();
  });

  apply();
}

// =========================================================================
// 05 节：什么时候别用 — 反例「硬套围框 ↔ 撤框还原」即时对照开关
// =========================================================================
export function initAntiExamples() {
  const cards = document.querySelectorAll("[data-anti-card]");
  cards.forEach((card) => {
    const btn = card.querySelector("[data-anti-toggle]");
    const note = card.querySelector("[data-anti-note]");
    const badMsg = card.dataset.badNote;
    const goodMsg = card.dataset.goodNote;
    let forced = true; // 默认展示「错用开合围框」现场，点一下撤框看差距

    const sync = () => {
      card.classList.toggle("is-forced", forced);
      btn.setAttribute("aria-pressed", String(!forced));
      btn.textContent = forced ? "撤掉围框，看原生版式" : "重新硬套开合围框";
      if (note) note.textContent = forced ? badMsg : goodMsg;
    };

    btn?.addEventListener("click", () => {
      forced = !forced;
      sync();
    });
    sync();
  });
}

// =========================================================================
// 06 节：单变量练习（四选项由同一 computeGeometry() 实绘，只差门翼角度）
// =========================================================================
export function initQuiz() {
  const grid = document.getElementById("quiz-grid");
  const verdictBox = document.getElementById("quiz-verdict");
  const titleEl = document.getElementById("quiz-v-title");
  const bodyEl = document.getElementById("quiz-v-body");
  const compareBtn = document.getElementById("quiz-compare-btn");
  if (!grid || !verdictBox) return;

  // 把每张选项的 SVG 缩略图按真实 computeGeometry() 填入多边形坐标，彻底单真源！
  const W = 220;
  const H = 260;
  const mapPts = (poly) => poly.map((p) => `${(p.x * W).toFixed(1)},${(p.y * H).toFixed(1)}`).join(" ");

  QUIZ_OPTIONS.forEach((opt) => {
    const g = computeGeometry({
      leftAngle: opt.leftAngle,
      rightAngle: opt.rightAngle,
      topShut: opt.topShut,
      botShut: opt.botShut,
    });
    const btn = grid.querySelector(`[data-quiz-opt="${opt.id}"]`);
    if (!btn) return;
    const svg = btn.querySelector("svg");
    const cx = (g.subject.cx * W).toFixed(1);
    const cy = (g.subject.cy * H).toFixed(1);
    const r = (g.subject.r * W).toFixed(1);
    const tL = `${(g.topLine.x1 * W).toFixed(1)},${(g.topLine.y1 * H).toFixed(1)}`;
    const tR = `${(g.topLine.x2 * W).toFixed(1)},${(g.topLine.y2 * H).toFixed(1)}`;
    const bL = `${(g.botLine.x1 * W).toFixed(1)},${(g.botLine.y1 * H).toFixed(1)}`;
    const bR = `${(g.botLine.x2 * W).toFixed(1)},${(g.botLine.y2 * H).toFixed(1)}`;

    svg.innerHTML = `
      <rect x="0" y="0" width="${W}" height="${H}" fill="#FCF6E6"/>
      <line x1="${(g.topLine.x1 * W).toFixed(1)}" y1="${(g.topLine.y1 * H).toFixed(1)}" x2="${(g.topLine.x2 * W).toFixed(1)}" y2="${(g.topLine.y2 * H).toFixed(1)}" stroke="#6E685E" stroke-width="1.2" stroke-dasharray="4 4"/>
      <line x1="${(g.botLine.x1 * W).toFixed(1)}" y1="${(g.botLine.y1 * H).toFixed(1)}" x2="${(g.botLine.x2 * W).toFixed(1)}" y2="${(g.botLine.y2 * H).toFixed(1)}" stroke="#6E685E" stroke-width="1.2" stroke-dasharray="4 4"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#F64D16"/>
      <polygon points="${mapPts(g.left.poly)}" fill="#F64D16"/>
      <polygon points="${mapPts(g.right.poly)}" fill="#F64D16"/>
      <text x="${W / 2}" y="${H - 18}" text-anchor="middle" fill="#48443D" font-size="10" font-family="IBM Plex Mono, monospace" class="quiz-measure">中庭 ${g.aperturePct}% · 净空 ${g.minClearancePct}%</text>
    `;

    btn.addEventListener("click", () => {
      grid.classList.add("is-answered");
      grid.querySelectorAll("[data-quiz-opt]").forEach((b) => {
        const id = b.dataset.quizOpt;
        const item = QUIZ_OPTIONS.find((x) => x.id === id);
        b.setAttribute("aria-pressed", String(b === btn));
        b.classList.toggle("is-picked", b === btn);
        b.classList.toggle("is-right", item.correct);
        b.classList.toggle("is-wrong", b === btn && !item.correct);
      });
      verdictBox.dataset.state = opt.correct ? "right" : "wrong";
      titleEl.textContent = `${opt.label}｜${opt.verdict}`;
      bodyEl.textContent = opt.detail;
      if (compareBtn) compareBtn.hidden = false;
    });
  });

  compareBtn?.addEventListener("click", () => {
    const shown = grid.classList.toggle("show-measures");
    compareBtn.textContent = shown ? "隐藏四方案几何标尺" : "显露四方案几何标尺";
  });
}

// =========================================================================
// 07 节：原海报放大看图灯箱（支持缩放、拖动平移、滚轮缩放、Esc 关，draggable="false"）
// =========================================================================
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const modal = document.getElementById("poster-modal");
  const stage = document.getElementById("lb-stage");
  const img = document.getElementById("lb-img");
  const posterThumb = document.getElementById("poster");
  const btnIn = document.getElementById("lb-in");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");
  const zoomLabel = document.getElementById("lb-zoom");
  if (!trigger || !modal || !stage || !img || !posterThumb) return;

  // 只引用一次原海报 data URI（遵守 README 体积规矩，绝不重复内联）
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  const applyTransform = () => {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomLabel) zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  };

  const reset = () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  };

  const open = () => {
    if (!img.src) img.src = posterThumb.src;
    reset();
    modal.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    btnClose?.focus();
  };

  const close = () => {
    if (modal.hidden) return;
    modal.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    trigger.focus();
  };

  trigger.addEventListener("click", open);
  btnClose?.addEventListener("click", close);
  btnReset?.addEventListener("click", reset);
  btnIn?.addEventListener("click", () => {
    scale = Math.min(3.5, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  btnOut?.addEventListener("click", () => {
    scale = Math.max(1, +(scale - 0.35).toFixed(2));
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) close();
  });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const next = scale + (e.deltaY < 0 ? 0.2 : -0.2);
    scale = Math.max(1, Math.min(3.5, +next.toFixed(2)));
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  img.addEventListener("dblclick", () => {
    if (scale > 1.1) reset();
    else { scale = 2; applyTransform(); }
  });

  img.addEventListener("pointerdown", (e) => {
    if (scale <= 1) return;
    e.preventDefault();
    pan = { id: e.pointerId, x: e.clientX - tx, y: e.clientY - ty };
    try { img.setPointerCapture(e.pointerId); } catch {}
  });
  img.addEventListener("pointermove", (e) => {
    if (!pan || pan.id !== e.pointerId) return;
    tx = e.clientX - pan.x;
    ty = e.clientY - pan.y;
    applyTransform();
  });
  const endPan = (e) => {
    if (pan && pan.id === e.pointerId) pan = null;
  };
  img.addEventListener("pointerup", endPan);
  img.addEventListener("pointercancel", endPan);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
}

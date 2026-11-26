// 141 正文七节的差异化交互模块（相邻节绝不复用同控件）
// 01 眯眼失焦透视滤镜 · 02 四把刻刀拨动开关矩阵 · 03 暗室节拍编排器(Canvas) · 04 百年活字抽屉 · 05 六场景分诊盘 · 06 单变量实排小练习 · 07 原海报灯箱

import { loop, pixelRatio } from "../../lib/stage.js";
import { RHYTHM_BLOCKS, evaluateRhythmSequence } from "./model.js";

// ---------- 01 节：眯眼失焦透视滤镜 ----------
export function initSquintLab() {
  const slider = document.getElementById("squint-blur");
  const readout = document.getElementById("squint-readout");
  const flatCard = document.getElementById("squint-flat");
  const ledCard = document.getElementById("squint-led");
  const note = document.getElementById("squint-note");
  const presetBtns = [...document.querySelectorAll("[data-squint-px]")];
  if (!slider || !flatCard || !ledCard) return;

  function apply(px) {
    const v = Number(px);
    slider.value = String(v);
    flatCard.style.filter = v > 0 ? `blur(${v.toFixed(1)}px)` : "none";
    ledCard.style.filter = v > 0 ? `blur(${v.toFixed(1)}px)` : "none";
    const dist = v < 0.8 ? "近距精读" : v < 3.4 ? "退后 1.5 米" : "3 米眯眼远观";
    readout.textContent = `${v.toFixed(1)} px · ${dist}`;
    presetBtns.forEach((b) => b.setAttribute("aria-pressed", String(Math.abs(Number(b.dataset.squintPx) - v) < 0.25)));

    if (v < 0.8) {
      note.textContent = "清晰近看时，两张样张的每个字都能辨认；拖动上方失焦拨片模拟退后眯眼，看看哪一版先失去结构。";
    } else if (v < 3.4) {
      note.textContent = "失焦到 1.5 米等效模糊：平权样张已经融成一块灰斑，分不清从哪读起；文字主导版仍清晰留出主标黑带、紫引停顿与底部三块要点。";
    } else {
      note.textContent = "退到 3 米完全看不清单个笔画时，好版式的骨架仍在：第一落点、正文灰带与留白气口一目了然——这就是前注意视觉对比替文字开的路。";
    }
  }

  slider.addEventListener("input", () => apply(slider.value));
  presetBtns.forEach((btn) => btn.addEventListener("click", () => apply(btn.dataset.squintPx)));
  apply(2.6);
}

// ---------- 02 节：四把刻刀独立拨动开关矩阵 ----------
export function initLeversMatrix() {
  const switches = [...document.querySelectorAll("[data-lever]")];
  const specimen = document.getElementById("levers-specimen");
  const countEl = document.getElementById("levers-count");
  const diagEl = document.getElementById("levers-diag");
  const allBtn = document.getElementById("levers-all");
  const resetBtn = document.getElementById("levers-reset");
  if (!specimen || !switches.length) return;

  const state = { scale: false, weight: false, spacing: false, align: false };

  function render() {
    const activeCount = Object.values(state).filter(Boolean).length;
    specimen.classList.toggle("is-scale", state.scale);
    specimen.classList.toggle("is-weight", state.weight);
    specimen.classList.toggle("is-spacing", state.spacing);
    specimen.classList.toggle("is-align", state.align);

    switches.forEach((btn) => {
      const k = btn.dataset.lever;
      const on = !!state[k];
      btn.setAttribute("aria-pressed", String(on));
      const tag = btn.querySelector(".lever-state");
      if (tag) tag.textContent = on ? "已启用" : "关闭";
    });

    countEl.textContent = `${activeCount} / 4 把刻刀已启用`;

    if (activeCount === 0) {
      diagEl.textContent = "四把刻刀全关：所有字同号、同重、压行、乱轴，整张展讯卡片塌成一堵没有入口的灰墙。试着只打开其中一把，看单靠它够不够。";
    } else if (activeCount === 4) {
      diagEl.textContent = "四刀齐备：字号拉开第一眼、字重压稳份量、行距与段距划出呼吸边界、单轴左齐收拢视线路径——文字主导版式完全成立。";
    } else {
      const missing = [];
      if (!state.scale) missing.push("字号阶梯（主次落差不足）");
      if (!state.weight) missing.push("字重反差（标题与正文墨色发平）");
      if (!state.spacing) missing.push("行距与段距（行间发紧、段界模糊）");
      if (!state.align) missing.push("单轴对齐（各层起线左右漂移）");
      diagEl.textContent = `当前只启用 ${activeCount} 项，仍缺少：${missing.join("、")}。逐个补齐能亲眼看见每一把刻刀各自解决了哪一半问题。`;
    }
  }

  switches.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.lever;
      state[k] = !state[k];
      render();
    });
  });
  if (allBtn) {
    allBtn.addEventListener("click", () => {
      Object.keys(state).forEach((k) => { state[k] = true; });
      render();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      Object.keys(state).forEach((k) => { state[k] = false; });
      render();
    });
  }
  render();
}

// ---------- 03 节：暗室版面节拍编排器（2D Canvas） ----------
export function initRhythmSequencer() {
  const canvas = document.getElementById("rhythm-canvas");
  const listEl = document.getElementById("rhythm-list");
  const titleEl = document.getElementById("rhythm-verdict-title");
  const bodyEl = document.getElementById("rhythm-verdict-body");
  const badgeEl = document.getElementById("rhythm-badge");
  const presetBtns = [...document.querySelectorAll("[data-rhythm-preset]")];
  if (!canvas || !listEl) return;

  const ctx = canvas.getContext("2d");
  // 开场给一组故意拥堵的节拍：连续三块密段贴一起
  let sequence = ["denseWall", "denseWall", "denseWall", "heroHead", "twoCol"];
  let dirty = true;

  const PRESETS = {
    wall: ["denseWall", "denseWall", "denseWall", "heroHead", "twoCol"],
    balanced: ["heroHead", "pullQuote", "twoCol", "airBand", "denseWall"],
    magazine: ["heroHead", "airBand", "denseWall", "pullQuote", "twoCol"],
  };

  const cycleOrder = RHYTHM_BLOCKS.map((b) => b.id);

  function renderControls() {
    const ev = evaluateRhythmSequence(sequence);
    badgeEl.textContent = ev.status === "ok" ? `节拍均衡 · 密差 ${ev.spread}%` : ev.status === "warn" ? `节拍偏平 · 密差 ${ev.spread}%` : `连续密墙 ${ev.maxWallStreak} 块`;
    badgeEl.dataset.state = ev.status;
    titleEl.textContent = ev.headline;
    bodyEl.textContent = ev.detail;

    listEl.innerHTML = "";
    sequence.forEach((id, idx) => {
      const b = RHYTHM_BLOCKS.find((x) => x.id === id) || RHYTHM_BLOCKS[0];
      const row = document.createElement("div");
      row.className = "seq-row";
      row.innerHTML = `
        <span class="seq-idx">0${idx + 1}</span>
        <button type="button" class="seq-kind" data-seq-cycle="${idx}" title="点击切换该槽位的版面模块类型">
          <strong>${b.name}</strong>
          <small>${b.en} · 黑度 ${Math.round(b.density * 100)}%</small>
        </button>
        <div class="seq-moves">
          <button type="button" class="seq-move" data-seq-up="${idx}" ${idx === 0 ? "disabled" : ""} aria-label="上移第 ${idx + 1} 块">↑</button>
          <button type="button" class="seq-move" data-seq-down="${idx}" ${idx === sequence.length - 1 ? "disabled" : ""} aria-label="下移第 ${idx + 1} 块">↓</button>
        </div>
      `;
      listEl.appendChild(row);
    });

    listEl.querySelectorAll("[data-seq-cycle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.seqCycle);
        const cur = cycleOrder.indexOf(sequence[i]);
        sequence[i] = cycleOrder[(cur + 1) % cycleOrder.length];
        dirty = true;
        renderControls();
        ctrl.draw();
      });
    });
    listEl.querySelectorAll("[data-seq-up]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.seqUp);
        if (i <= 0) return;
        [sequence[i - 1], sequence[i]] = [sequence[i], sequence[i - 1]];
        dirty = true;
        renderControls();
        ctrl.draw();
      });
    });
    listEl.querySelectorAll("[data-seq-down]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.seqDown);
        if (i >= sequence.length - 1) return;
        [sequence[i + 1], sequence[i]] = [sequence[i], sequence[i + 1]];
        dirty = true;
        renderControls();
        ctrl.draw();
      });
    });
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    const w = Math.max(280, Math.round(r.width));
    const h = Math.max(260, Math.round(r.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    dirty = true;
  }

  function drawCanvas(t, dt, { still }) {
    if (!dirty && still) return;
    const dpr = pixelRatio(2);
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    if (!dirty && !still) return;
    dirty = false;

    const ev = evaluateRhythmSequence(sequence);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 暗室底板
    ctx.fillStyle = "#171122";
    ctx.fillRect(0, 0, W, H);

    const pad = 18;
    const pageW = Math.round(W * 0.48);
    const histX = pad + pageW + 18;
    const histW = Math.round(W * 0.21);
    const waveX = histX + histW + 14;
    const waveW = Math.max(46, W - waveX - pad);

    // 顶栏标注
    ctx.font = `700 10.5px "Space Mono", "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "#C79BFF";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText("LIVE PAGE", pad, 10);
    ctx.fillText("INK DENSITY", histX, 10);
    ctx.fillText("RHYTHM", waveX, 10);

    // 白纸微缩页
    const py0 = 32;
    const ph = H - py0 - 16;
    ctx.fillStyle = "#FDFCFE";
    ctx.fillRect(pad, py0, pageW, ph);

    const totalUnits = ev.blocks.reduce((s, b) => s + b.height, 0);
    const gap = 7;
    const usableH = ph - 18 - gap * (ev.blocks.length - 1);
    let cy = py0 + 9;

    const centers = [];
    ev.blocks.forEach((b, idx) => {
      const bh = (b.height / totalUnits) * usableH;
      const bx = pad + 12;
      const bw = pageW - 24;

      // 连续密壁警示框
      const isWallAlert = b.density >= 0.72 && ((ev.blocks[idx - 1]?.density >= 0.72) || (ev.blocks[idx + 1]?.density >= 0.72));
      if (isWallAlert) {
        ctx.fillStyle = "rgba(242, 44, 48, 0.12)";
        ctx.fillRect(bx - 4, cy - 2, bw + 8, bh + 4);
      }

      // 绘制各模块微缩字条
      if (b.id === "heroHead") {
        ctx.fillStyle = "#08080A";
        ctx.fillRect(bx, cy + 4, bw * 0.82, Math.max(9, bh * 0.34));
        ctx.fillStyle = "#7B24DA";
        ctx.fillRect(bx, cy + bh * 0.56, bw * 0.55, 3);
        ctx.fillStyle = "#F22C30";
        ctx.beginPath();
        ctx.arc(bx + bw * 0.87, cy + bh * 0.24, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.id === "pullQuote") {
        ctx.fillStyle = "#7B24DA";
        ctx.fillRect(bx, cy + 4, 3, bh - 8);
        ctx.fillStyle = "#3E2166";
        ctx.fillRect(bx + 10, cy + bh * 0.26, bw * 0.64, 5);
        ctx.fillRect(bx + 10, cy + bh * 0.56, bw * 0.44, 5);
      } else if (b.id === "denseWall") {
        ctx.fillStyle = "#1E1E24";
        const n = 5;
        const lh = (bh - 6) / n;
        for (let i = 0; i < n; i++) {
          ctx.fillRect(bx, cy + 3 + i * lh, bw * (i === n - 1 ? 0.72 : 0.96), Math.max(2.5, lh * 0.55));
        }
      } else if (b.id === "twoCol") {
        ctx.fillStyle = "#3B3B48";
        const cw = (bw - 10) / 2;
        for (let c = 0; c < 2; c++) {
          for (let i = 0; i < 4; i++) {
            ctx.fillRect(bx + c * (cw + 10), cy + 5 + i * ((bh - 10) / 4), cw * (i === 3 ? 0.7 : 0.96), 3);
          }
        }
      } else {
        // 留白休止带
        ctx.strokeStyle = "#C9BCE2";
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(bx + 1, cy + 4, bw - 2, bh - 8);
        ctx.setLineDash([]);
        ctx.fillStyle = "#7B24DA";
        ctx.font = `700 9.5px "Space Mono", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("BREATH / SILENCE", bx + bw * 0.5, cy + bh * 0.5);
      }

      // 中间：黑度密度直方条
      const barY = cy + bh * 0.22;
      const barH = Math.max(8, bh * 0.56);
      ctx.fillStyle = "#261E38";
      ctx.fillRect(histX, barY, histW, barH);
      ctx.fillStyle = isWallAlert ? "#FF6B6E" : b.pause >= 0.65 ? "#5EE3B5" : "#C79BFF";
      ctx.fillRect(histX, barY, histW * b.density, barH);

      centers.push({ y: cy + bh * 0.5, density: b.density });
      cy += bh + gap;
    });

    // 右侧：竖向紫色声谱波浪线（将每个模块的密度转成波峰与呼吸谷）
    ctx.strokeStyle = ev.status === "ok" ? "#C79BFF" : ev.status === "fail" ? "#FF6B6E" : "#E5C17B";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    centers.forEach((pt, idx) => {
      const px = waveX + 8 + pt.density * (waveW - 16);
      if (idx === 0) {
        ctx.moveTo(px, pt.y);
      } else {
        const prev = centers[idx - 1];
        const prevX = waveX + 8 + prev.density * (waveW - 16);
        const midY = (prev.y + pt.y) * 0.5;
        ctx.bezierCurveTo(prevX, midY, px, midY, px, pt.y);
      }
    });
    ctx.stroke();

    centers.forEach((pt) => {
      const px = waveX + 8 + pt.density * (waveW - 16);
      ctx.fillStyle = pt.density >= 0.72 ? "#FF6B6E" : "#5EE3B5";
      ctx.beginPath();
      ctx.arc(px, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.rhythmPreset;
      if (!PRESETS[key]) return;
      sequence = [...PRESETS[key]];
      dirty = true;
      renderControls();
      ctrl.draw();
    });
  });

  resize();
  new ResizeObserver(() => {
    resize();
    ctrl.draw();
  }).observe(canvas);
  const ctrl = loop(canvas, drawCanvas);
  renderControls();
  ctrl.draw();
}

// ---------- 04 节：百年纯字排印史活字抽屉 ----------
export function initHistoryDrawers() {
  const tabs = [...document.querySelectorAll("[data-era]")];
  const panels = [...document.querySelectorAll("[data-era-panel]")];
  if (!tabs.length) return;

  function select(era) {
    tabs.forEach((t) => {
      const active = t.dataset.era === era;
      t.setAttribute("aria-selected", String(active));
      t.classList.toggle("is-active", active);
    });
    panels.forEach((p) => {
      p.hidden = p.dataset.eraPanel !== era;
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => select(t.dataset.era)));
  select(tabs[0].dataset.era);
}

// ---------- 05 节：6 场景适配分诊盘 ----------
export function initScenarioTriage() {
  const filterBtns = [...document.querySelectorAll("[data-triage-filter]")];
  const cards = [...document.querySelectorAll("[data-triage-card]")];
  if (!cards.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.triageFilter;
      filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      cards.forEach((c) => {
        c.hidden = f !== "all" && c.dataset.triageCard !== f;
      });
    });
  });

  cards.forEach((card) => {
    const toggle = card.querySelector(".triage-flip");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      const open = card.classList.toggle("is-revealed");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "收起分诊理由" : "查看分诊结论";
    });
  });
}

// ---------- 06 节：单变量控制小练习（A/B/C/D 绝不剧透） ----------
export function initQuiz() {
  const options = [...document.querySelectorAll("[data-quiz-opt]")];
  const feedback = document.getElementById("quiz-feedback");
  const retryBtn = document.getElementById("quiz-retry");
  const grid = document.getElementById("quiz-grid");
  if (!options.length || !feedback) return;

  const REASONS = {
    A: {
      ok: false,
      title: "选 A 不够清晰 — 问题藏在「亲密性倒置」",
      text: "A 的字号、字重与行距都达标，但二级小标「展厅动线」离上一段正文只有 5px、离自己管辖的下段正文却隔了 18px。眼睛会错把小标归到上一段结尾，逻辑归属断掉了。",
    },
    B: {
      ok: true,
      title: "回答正确 — B 四项结构全部咬合",
      text: "B 同时守住了文字主导的四条核心基准：主标（30px/900）与正文（13px/400）拉开 2.3× 字号落差，正文行距 1.65× 留出呼吸白带，段距大于行距且小标紧贴所属段落，所有层级钉在左侧同一条锚轴上。",
    },
    C: {
      ok: false,
      title: "选 C 不够清晰 — 问题藏在「层级平权」",
      text: "C 的行距、段距与对齐都没问题，但主标（16px）与正文（13.5px）倍率收窄到 1.18×，字重又全部停在 500。三秒内眼睛找不到第一落点，只能从头逐字啃。",
    },
    D: {
      ok: false,
      title: "选 D 不够清晰 — 问题藏在「行距压死」",
      text: "D 的字阶、字重与亲密性都成立，但正文行距被压到 1.04×，上下两行方块字几乎贴在一起。进入正文细读时，视线换行回扫极易串行。",
    },
  };

  function choose(key) {
    const info = REASONS[key];
    if (!info) return;
    grid.classList.add("is-answered");
    options.forEach((btn) => {
      const k = btn.dataset.quizOpt;
      btn.setAttribute("aria-pressed", String(k === key));
      btn.classList.toggle("is-picked", k === key);
      btn.classList.toggle("is-correct", k === "B");
      btn.classList.toggle("is-wrong", k === key && k !== "B");
    });
    feedback.hidden = false;
    feedback.dataset.state = info.ok ? "ok" : "fail";
    feedback.querySelector("h3").textContent = info.title;
    feedback.querySelector("p").textContent = info.text;
  }

  options.forEach((btn) => btn.addEventListener("click", () => choose(btn.dataset.quizOpt)));
  if (retryBtn) {
    retryBtn.addEventListener("click", () => {
      grid.classList.remove("is-answered");
      options.forEach((btn) => {
        btn.setAttribute("aria-pressed", "false");
        btn.classList.remove("is-picked", "is-correct", "is-wrong");
      });
      feedback.hidden = true;
    });
  }
}

// ---------- 07 节：原海报灯箱（可缩放、拖动、Esc 关） ----------
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const img = document.getElementById("poster");
  const dialog = document.getElementById("poster-dialog");
  const stage = document.getElementById("lightbox-stage");
  const bigImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomIn = document.getElementById("lightbox-in");
  const zoomOut = document.getElementById("lightbox-out");
  const zoomReset = document.getElementById("lightbox-reset");
  if (!trigger || !img || !dialog || !bigImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = null;

  function applyTransform() {
    bigImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomReset) zoomReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function openBox() {
    bigImg.src = img.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function closeBox() {
    dialog.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", openBox);
  closeBtn?.addEventListener("click", closeBox);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target === stage) closeBox();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dialog.hidden) closeBox();
  });

  zoomIn?.addEventListener("click", () => { scale = Math.min(2.6, +(scale + 0.3).toFixed(2)); applyTransform(); });
  zoomOut?.addEventListener("click", () => {
    scale = Math.max(1, +(scale - 0.3).toFixed(2));
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomReset?.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  stage?.addEventListener("wheel", (e) => {
    if (dialog.hidden) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.18 : -0.18;
    scale = Math.max(1, Math.min(2.6, +(scale + delta).toFixed(2)));
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  bigImg.addEventListener("pointerdown", (e) => {
    if (scale <= 1.02) return;
    e.preventDefault();
    dragging = { x: e.clientX - tx, y: e.clientY - ty };
    bigImg.setPointerCapture?.(e.pointerId);
  });
  bigImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - dragging.x;
    ty = e.clientY - dragging.y;
    applyTransform();
  });
  bigImg.addEventListener("pointerup", () => { dragging = null; });
}

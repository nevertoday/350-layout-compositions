// 346 时间线页 幻灯片版式 · 主控制器
import {
  SCENARIOS,
  createBrokenState,
  createPresetState,
  evenSpacingPositions,
  evaluateTimeline,
  clamp,
} from "./model.js";
import { createTimelineStage } from "./stage-canvas.js";
import { initSections } from "./sections.js";

let state = createBrokenState("poster");
let currentEval = evaluateTimeline(state);

// 1:1 渲染原海报右上 10×4 极细墨点矩阵
function renderDotMatrix() {
  const g = document.getElementById("hero-dot-matrix");
  if (!g) return;
  let html = "";
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 10; col++) {
      html += `<circle cx="${6 + col * 13}" cy="${6 + row * 12}" r="1.45"/>`;
    }
  }
  g.innerHTML = html;
}

// 驱动右上角复古朱红时钟（及手机端迷你时钟）的白色指针随演播进度真转动
function updateClockHands(playhead) {
  const minAngle = playhead * 360;
  const hourAngle = -135 + playhead * 90;
  document.querySelectorAll(".poster-clock-btn svg, .clock-mini svg").forEach((svg) => {
    const isMini = svg.closest(".clock-mini");
    const cx = isMini ? 32 : 56;
    const cy = isMini ? 32 : 56;
    const hr = svg.querySelector(".clk-hour");
    const mn = svg.querySelector(".clk-min");
    if (hr) hr.setAttribute("transform", `rotate(${hourAngle.toFixed(1)} ${cx} ${cy})`);
    if (mn) mn.setAttribute("transform", `rotate(${minAngle.toFixed(1)} ${cx} ${cy})`);
  });
}

// 同步全部 UI 读数（严格只读 single source of truth: currentEval）
function syncUI() {
  currentEval = evaluateTimeline(state);
  const ev = currentEval;
  const ok = ev.score === 5;

  // 顶栏状态与播放键
  const navPill = document.getElementById("nav-score-pill");
  navPill.textContent = ev.badge;
  navPill.className = `status-pill ${ok ? "is-ok" : "is-bad"}`;

  const navPlay = document.getElementById("nav-play-btn");
  navPlay.classList.toggle("is-playing", state.playing);
  navPlay.querySelector("span:nth-child(2)").textContent = state.playing ? "暂停" : "演播";

  // 刊头自示范微轨与指标
  const titleFill = document.getElementById("hero-title-fill");
  const fillPct = Math.max(12, Math.round((ev.score / 5) * 100));
  titleFill.style.width = `${fillPct}%`;
  titleFill.style.background = ok ? "#155D56" : "#E1613E";

  document.getElementById("hero-metrics-line").textContent =
    `${ev.count} 站 · ${ev.inversions > 0 ? `逆序 ${ev.inversions} 处` : "顺叙"} · 步幅 ${ev.spreadRatio}× · 约 ${ev.estSeconds}s`;

  // 复古时钟指针与状态
  updateClockHands(state.playhead);
  document.getElementById("clock-status-text").textContent =
    `${state.playing ? "演播中" : "点钟演播"} · ${Math.round(state.playhead * 100)}%`;
  document.getElementById("hero-load-tag").textContent = ev.loadGrade;

  // 画布顶栏
  document.getElementById("canvas-slide-title").textContent = ev.scenario.slideTitle;
  document.getElementById("canvas-hud").textContent =
    `${ev.count} 站 · ${ev.totalChars} 字 · 步幅 ${ev.spreadRatio}× · 约 ${ev.estSeconds}s（示意）`;

  // 底部游标滑尺
  const slider = document.getElementById("rhythm-slider");
  slider.value = String(Math.round(state.playhead * 100));
  document.getElementById("rhythm-slider-val").textContent = `${Math.round(state.playhead * 100)}%`;
  document.getElementById("btn-play-stage").textContent = state.playing ? "暂停演播" : "逐帧演播";

  // 右侧诊单卡
  const star = document.getElementById("diag-star-badge");
  star.classList.toggle("is-ok", ok);
  const dBadge = document.getElementById("diag-badge");
  dBadge.textContent = ev.badge;
  dBadge.className = `diag-score-tag ${ok ? "is-ok" : "is-bad"}`;
  document.getElementById("diag-load").textContent = ev.loadGrade;
  document.getElementById("diag-headline").textContent = ev.headline;
  document.getElementById("diag-body").textContent = ev.body;
  const dNext = document.getElementById("diag-next");
  dNext.classList.toggle("is-ok", ok);
  dNext.innerHTML = `<strong>${ok ? "试着玩坏：" : "下一步："}</strong>${ev.nextStep}`;

  // 控制按钮高亮同步
  document.querySelectorAll("[data-scenario]").forEach((b) => {
    const on = b.dataset.scenario === state.scenarioId;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  document.querySelectorAll("[data-axis]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.axis === state.axis);
  });
  document.querySelectorAll("[data-copy]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.copy === state.copyMode);
  });

  document.getElementById("ctrl-node-count").textContent = `${ev.count} 站`;

  const btnStart = document.getElementById("btn-toggle-start");
  btnStart.textContent = `起点背景：${state.hasStartAnchor ? "开" : "关"}`;
  btnStart.classList.toggle("is-on", state.hasStartAnchor);
  btnStart.setAttribute("aria-pressed", String(state.hasStartAnchor));

  const btnConc = document.getElementById("btn-toggle-conclusion");
  btnConc.textContent = `终点结论卡：${state.hasConclusion ? "开" : "关"}`;
  btnConc.classList.toggle("is-on", state.hasConclusion);
  btnConc.setAttribute("aria-pressed", String(state.hasConclusion));

  // 五枚原海报深松绿圆徽实况标尺同步
  ev.checks.forEach((ck) => {
    const el = document.querySelector(`[data-pillar-state="${ck.key}"]`);
    if (el) {
      el.textContent = ck.tag;
      el.className = `pillar-state ${ck.ok ? "is-ok" : "is-bad"}`;
    }
  });
}

function togglePlay() {
  if (state.playing) {
    state.playing = false;
  } else {
    if (state.playhead >= 0.99) state.playhead = 0;
    state.playing = true;
  }
  syncUI();
  stage.draw();
}

const stage = createTimelineStage(document.getElementById("timeline-canvas"), {
  getState: () => state,
  getEval: () => currentEval,
  onSelectNode: (id) => {
    state.selectedId = id;
    syncUI();
  },
  onMoveNode: (id, pos) => {
    const n = state.nodes.find((x) => x.id === id);
    if (n) n.pos = pos;
    // 拖节点时让演播游标与右上复古时钟白针同步指向当前被拖动的时刻点
    state.playhead = clamp(pos, 0, 1);
    state.playing = false;
    syncUI();
  },
  onBatchPositions: (updates, nextPlayhead) => {
    for (const n of state.nodes) {
      if (updates.has(n.id)) n.pos = updates.get(n.id);
    }
    state.playhead = nextPlayhead;
    state.playing = false;
    syncUI();
  },
  onPlayhead: (val, stillPlaying) => {
    state.playhead = clamp(val, 0, 1);
    state.playing = stillPlaying;
    syncUI();
  },
  onHitButton: (btn) => {
    if (btn.id === "toggle-start") {
      state.hasStartAnchor = !state.hasStartAnchor;
    } else if (btn.id === "toggle-conclusion") {
      state.hasConclusion = !state.hasConclusion;
    } else if (btn.id === "trim-noise") {
      const target = state.nodes.find((n) => n.id === btn.nodeId);
      if (target) target.active = false;
    } else if (btn.id === "swap-pair") {
      const a = state.nodes.find((n) => n.id === btn.aId);
      const b = state.nodes.find((n) => n.id === btn.bId);
      if (a && b) {
        const tmp = a.pos;
        a.pos = b.pos;
        b.pos = tmp;
      }
    }
    syncUI();
  },
});

// 绑定所有控件
document.querySelectorAll("[data-scenario]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const nextSc = btn.dataset.scenario;
    // 切换剧本时保持当前良好/错态意图：若当前已 5/5 则直接以对应理想解切入新剧本，否则以新剧本开场坏态切入
    state = currentEval.score === 5
      ? createPresetState(state.axis === "horizontal" ? "horizontal-4" : state.axis === "vertical" ? "vertical-5" : "poster-ideal", nextSc)
      : createBrokenState(nextSc);
    syncUI();
    stage.draw();
  });
});

document.querySelectorAll("[data-axis]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.axis = btn.dataset.axis;
    syncUI();
    stage.draw();
  });
});

document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.copyMode = btn.dataset.copy;
    syncUI();
    stage.draw();
  });
});

document.getElementById("btn-trim-node").addEventListener("click", () => {
  // 优先裁掉冗余支线；若支线已清光则允许继续裁减到 2 站以触发反向「仅 2 站不成线」检验
  const sc = SCENARIOS[state.scenarioId];
  const metaMap = new Map(sc.nodes.map((m) => [m.id, m]));
  const activeNoise = state.nodes.filter((n) => n.active && !metaMap.get(n.id).isCore);
  if (activeNoise.length) {
    activeNoise[activeNoise.length - 1].active = false;
  } else {
    const activeCore = state.nodes.filter((n) => n.active);
    if (activeCore.length > 2) {
      // 保留起终点优先裁中间节点
      const mid = activeCore.find((n) => n.id !== "m1" && n.id !== "m5") || activeCore[activeCore.length - 1];
      mid.active = false;
    }
  }
  syncUI();
  stage.draw();
});

document.getElementById("btn-add-node").addEventListener("click", () => {
  const sc = SCENARIOS[state.scenarioId];
  const metaMap = new Map(sc.nodes.map((m) => [m.id, m]));
  const inactiveCore = state.nodes.filter((n) => !n.active && metaMap.get(n.id).isCore);
  const inactiveNoise = state.nodes.filter((n) => !n.active && !metaMap.get(n.id).isCore);
  const pick = inactiveCore[0] || inactiveNoise[0];
  if (pick) {
    pick.active = true;
    const ord = metaMap.get(pick.id).order;
    pick.pos = clamp(0.10 + ((ord - 1) / 4) * 0.80, 0.12, 0.88);
  }
  syncUI();
  stage.draw();
});

document.getElementById("btn-even-space").addEventListener("click", () => {
  evenSpacingPositions(state);
  syncUI();
  stage.draw();
});

document.getElementById("btn-toggle-start").addEventListener("click", () => {
  state.hasStartAnchor = !state.hasStartAnchor;
  syncUI();
  stage.draw();
});

document.getElementById("btn-toggle-conclusion").addEventListener("click", () => {
  state.hasConclusion = !state.hasConclusion;
  syncUI();
  stage.draw();
});

document.getElementById("btn-fix-ideal").addEventListener("click", () => {
  state = createPresetState("poster-ideal", state.scenarioId);
  syncUI();
  stage.draw();
});

document.getElementById("btn-reset-broken").addEventListener("click", () => {
  state = createBrokenState(state.scenarioId);
  syncUI();
  stage.draw();
});

document.getElementById("btn-play-stage").addEventListener("click", togglePlay);
document.getElementById("nav-play-btn").addEventListener("click", togglePlay);
document.getElementById("hero-clock-btn").addEventListener("click", togglePlay);
document.getElementById("clock-mini-btn").addEventListener("click", togglePlay);

document.getElementById("rhythm-slider").addEventListener("input", (e) => {
  const v = Number(e.target.value) / 100;
  state.playhead = v;
  state.playing = false;
  syncUI();
  stage.draw();
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state = createPresetState(btn.dataset.preset, state.scenarioId);
    syncUI();
    stage.draw();
  });
});

// 五要素标尺按钮：点击聚焦对应要素并联动高亮画布区域
document.querySelectorAll("[data-focus-pillar]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.focusPillar;
    document.querySelectorAll(".pillar-item").forEach((b) => b.classList.remove("is-focused"));
    btn.classList.add("is-focused");
    stage.highlightPillar(key);
  });
});

// 键盘操控：Space 演播，←/→ 微调当前选中节点沿轴位置
document.addEventListener("keydown", (e) => {
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const lb = document.getElementById("poster-lightbox");
  if (lb && !lb.hidden) return;

  if (e.code === "Space") {
    e.preventDefault();
    togglePlay();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    const n = state.nodes.find((x) => x.id === state.selectedId && x.active) || state.nodes.find((x) => x.active);
    if (!n) return;
    e.preventDefault();
    n.pos = clamp(n.pos + (e.key === "ArrowRight" ? 0.04 : -0.04), 0.05, 0.95);
    state.playing = false;
    syncUI();
    stage.draw();
  }
});

// 初始化
renderDotMatrix();
syncUI();
stage.draw();
initSections();

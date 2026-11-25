// 273 仪表盘布局 · 主入口（开场活体五秒巡检舱 + 24h 遥测时间轴拨尺 + 全页互动）
import { loop, reducedMotion } from "../../lib/stage.js";
import { createRadarRenderer, createTrendRenderer } from "./hero-canvas.js";
import {
  CHANNELS,
  INCIDENTS,
  KPI_DEFS,
  TIER_META,
  createBrokenState,
  createIdealState,
  evaluateDashboard,
  formatMinute,
} from "./model.js";
import {
  initPosterLightbox,
  initSec01,
  initSec02,
  initSec03,
  initSec04,
  initSec05,
  initSec06,
  initSec07,
} from "./sections.js";

const SVG_NS = "http://www.w3.org/2000/svg";
function svgNode(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function makeKpiIcon(type) {
  const s = svgNode("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "kpi-ico-svg" });
  if (type === "bars") {
    s.append(
      svgNode("rect", { x: 4, y: 12, width: 3.5, height: 8, rx: 1, fill: "currentColor" }),
      svgNode("rect", { x: 10.2, y: 6, width: 3.5, height: 14, rx: 1, fill: "currentColor" }),
      svgNode("rect", { x: 16.5, y: 9, width: 3.5, height: 11, rx: 1, fill: "currentColor" })
    );
  } else if (type === "user") {
    s.append(
      svgNode("circle", { cx: 12, cy: 8, r: 3.5, fill: "none", stroke: "currentColor", "stroke-width": 2 }),
      svgNode("path", { d: "M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round" })
    );
  } else if (type === "cart") {
    s.append(
      svgNode("path", { d: "M3 5h3l2.2 9.5h9.6L20 8H7.2", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }),
      svgNode("circle", { cx: 10, cy: 18.5, r: 1.6, fill: "currentColor" }),
      svgNode("circle", { cx: 17, cy: 18.5, r: 1.6, fill: "currentColor" })
    );
  } else if (type === "coin") {
    s.append(
      svgNode("circle", { cx: 12, cy: 12, r: 8, fill: "none", stroke: "currentColor", "stroke-width": 2 }),
      svgNode("path", { d: "M9 8.5L12 12l3-3.5M9 13h6M12 12v5", fill: "none", stroke: "currentColor", "stroke-width": 1.8, "stroke-linecap": "round" })
    );
  } else if (type === "doc") {
    s.append(
      svgNode("rect", { x: 5, y: 4, width: 14, height: 16, rx: 2, fill: "none", stroke: "currentColor", "stroke-width": 1.8 }),
      svgNode("path", { d: "M8.5 9h7M8.5 12.5h7M8.5 16h4.5", stroke: "currentColor", "stroke-width": 1.6, "stroke-linecap": "round" })
    );
  } else if (type === "chip") {
    s.append(
      svgNode("rect", { x: 7, y: 7, width: 10, height: 10, rx: 1.5, fill: "none", stroke: "currentColor", "stroke-width": 1.8 }),
      svgNode("path", { d: "M9.5 4v3M14.5 4v3M9.5 17v3M14.5 17v3M4 9.5h3M4 14.5h3M17 9.5h3M17 14.5h3", stroke: "currentColor", "stroke-width": 1.6, "stroke-linecap": "round" })
    );
  } else {
    s.append(
      svgNode("path", { d: "M6 7h12M12 7v11M9.5 18h5", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round" })
    );
  }
  return s;
}

function makeSparkSvg(points, strokeColor) {
  const s = svgNode("svg", { viewBox: "0 0 88 22", class: "kpi-spark", "aria-hidden": "true" });
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(1, max - min);
  const d = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * 84 + 2;
      const y = 19 - ((v - min) / span) * 14;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  s.appendChild(svgNode("path", { d, fill: "none", stroke: strokeColor, "stroke-width": 1.8, "stroke-linecap": "round", "stroke-linejoin": "round" }));
  const lastX = 86;
  const lastY = 19 - ((points[points.length - 1] - min) / span) * 14;
  s.appendChild(svgNode("circle", { cx: lastX, cy: lastY.toFixed(1), r: 2.3, fill: strokeColor }));
  return s;
}

// =========================================================================
// 开场活体五秒巡检舱
// =========================================================================
function initHero() {
  let state = createBrokenState();

  const heroEl = document.getElementById("hero");
  const radarCanvas = document.getElementById("hero-radar-canvas");
  const trendCanvas = document.getElementById("hero-trend-canvas");
  const stackEl = document.getElementById("dash-stack");
  const tierKpiEl = document.getElementById("tier-kpi");
  const tierTrendEl = document.getElementById("tier-trend");
  const tierOpsEl = document.getElementById("tier-ops");

  const kpiGridEl = document.getElementById("hero-kpi-grid");
  const kpiPickerEl = document.getElementById("kpi-picker");
  const baselineBtn = document.getElementById("btn-baseline");
  const signalBtns = [...document.querySelectorAll("[data-signal]")];
  const resetBtn = document.getElementById("btn-reset");
  const idealBtn = document.getElementById("btn-ideal");

  // 24h 时间轴拨尺（data-perf-drag）
  const scrubTrack = document.getElementById("scrubber-track");
  const scrubThumb = document.getElementById("scrubber-thumb");
  const scrubFill = document.getElementById("scrubber-fill");
  const scrubTimeEl = document.getElementById("scrubber-time");
  const scrubEventEl = document.getElementById("scrubber-event");
  const incJumpBtns = [...document.querySelectorAll("[data-jump-min]")];

  // 运行舱元素
  const radarLoadEl = document.getElementById("hero-radar-load");
  const gaugeArc = document.getElementById("hero-gauge-arc");
  const gaugeNum = document.getElementById("hero-gauge-num");
  const gaugeState = document.getElementById("hero-gauge-state");
  const taskListEl = document.getElementById("hero-task-list");
  const alertListEl = document.getElementById("hero-alert-list");
  const donutHost = document.getElementById("hero-donut-svg");
  const channelListEl = document.getElementById("hero-channel-list");
  const trendSubEl = document.getElementById("hero-trend-sub");

  // 诊断与四柱验收条
  const topBadge = document.getElementById("hero-top-badge");
  const diagBadge = document.getElementById("diag-badge");
  const diagStops = document.getElementById("diag-stops");
  const diagDensity = document.getElementById("diag-density");
  const diagHeadline = document.getElementById("diag-headline");
  const diagReason = document.getElementById("diag-reason");
  const diagHint = document.getElementById("diag-hint");
  const diagBox = document.getElementById("hero-diag");

  const pillarEls = {
    overview: document.getElementById("pillar-overview"),
    kpi: document.getElementById("pillar-kpi"),
    monitor: document.getElementById("pillar-monitor"),
    efficiency: document.getElementById("pillar-efficiency"),
  };

  const drawRadar = createRadarRenderer(radarCanvas, () => state);
  const drawTrend = createTrendRenderer(trendCanvas, () => state);

  // 仅在必要时重绘 DOM，拖动 24h 时间轴时走轻量快路径保证 60fps
  function renderTierOrder() {
    const map = { kpi: tierKpiEl, trend: tierTrendEl, ops: tierOpsEl };
    state.tierOrder.forEach((id, idx) => {
      const node = map[id];
      if (!node) return;
      stackEl.appendChild(node);
      const rankEl = node.querySelector(".tier-rank");
      if (rankEl) rankEl.textContent = `ROW 0${idx + 1}`;
      const upBtn = node.querySelector('[data-move="up"]');
      const downBtn = node.querySelector('[data-move="down"]');
      if (upBtn) upBtn.disabled = idx === 0;
      if (downBtn) downBtn.disabled = idx === state.tierOrder.length - 1;
      node.classList.toggle("is-misplaced", id !== ["kpi", "trend", "ops"][idx]);
    });
  }

  function renderKpiPicker() {
    kpiPickerEl.replaceChildren();
    for (const def of KPI_DEFS) {
      const on = state.activeKpis.includes(def.id);
      const b = document.createElement("button");
      b.type = "button";
      b.className = `kpi-chip ${def.core ? "is-core" : "is-noise"} ${on ? "is-on" : ""}`;
      b.dataset.kpiToggle = def.id;
      b.setAttribute("aria-pressed", String(on));
      b.textContent = `${on ? "✓ " : "+ "}${def.label}${def.core ? "" : "·噪"}`;
      kpiPickerEl.appendChild(b);
    }
  }

  function renderDonut() {
    donutHost.replaceChildren();
    const r = 42;
    const cx = 56;
    const cy = 56;
    const circ = 2 * Math.PI * r;
    let off = 0;
    for (const ch of CHANNELS) {
      const len = (ch.share / 100) * circ;
      const isSel = state.selectedChannel === ch.id;
      const dim = state.selectedChannel !== "all" && !isSel;
      const stroke = state.signalMode === "muted" ? (ch.id === "direct" ? "#8E9796" : ch.id === "organic" ? "#6D7675" : "#4A5251") : ch.color;
      donutHost.appendChild(
        svgNode("circle", {
          cx,
          cy,
          r,
          fill: "none",
          stroke,
          "stroke-width": isSel ? 17 : 13,
          "stroke-dasharray": `${Math.max(1, len - 2)} ${circ}`,
          "stroke-dashoffset": -off,
          opacity: dim ? 0.35 : 1,
          transform: `rotate(-90 ${cx} ${cy})`,
        })
      );
      off += len;
    }
    const activeCh = CHANNELS.find((c) => c.id === state.selectedChannel);
    const centerText = svgNode("text", {
      x: cx,
      y: cy + 4,
      "text-anchor": "middle",
      fill: "#F2F5F4",
      "font-size": 11,
      "font-weight": 600,
      "font-family": "JetBrains Mono, monospace",
    });
    centerText.textContent = activeCh ? `${activeCh.share}%` : "100%";
    donutHost.appendChild(centerText);

    channelListEl.replaceChildren();
    for (const ch of CHANNELS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `ch-row ${state.selectedChannel === ch.id ? "is-selected" : ""}`;
      btn.dataset.channel = ch.id;
      btn.setAttribute("aria-pressed", String(state.selectedChannel === ch.id));
      const dot = document.createElement("span");
      dot.className = "ch-dot";
      dot.style.background = state.signalMode === "muted" ? "#7F8988" : ch.color;
      const lbl = document.createElement("span");
      lbl.className = "ch-name";
      lbl.textContent = ch.label;
      const val = document.createElement("span");
      val.className = "ch-pct";
      val.textContent = `${ch.share}%`;
      btn.append(dot, lbl, val);
      channelListEl.appendChild(btn);
    }
    trendSubEl.textContent = activeCh ? `筛选：${activeCh.label}（${activeCh.share}%）· 再点恢复全部` : "全部渠道 · 点渠道图可联动筛选";
  }

  function renderKpiCards(ev) {
    const snap = ev.snap;
    const count = state.activeKpis.length;
    kpiGridEl.dataset.count = String(count);
    kpiGridEl.replaceChildren();

    for (const id of state.activeKpis) {
      const def = KPI_DEFS.find((d) => d.id === id);
      if (!def) continue;
      const live = snap.kpis[id];
      const isCritCard = live.alert && state.signalMode === "anomaly";

      const card = document.createElement("div");
      card.className = `kpi-card accent-${def.accent} ${def.core ? "is-core" : "is-noise"} ${isCritCard ? "is-crit" : ""}`;

      const top = document.createElement("div");
      top.className = "kpi-top";

      const ico = document.createElement("span");
      ico.className = "kpi-ico";
      ico.appendChild(makeKpiIcon(def.icon));

      const meta = document.createElement("div");
      meta.className = "kpi-meta";
      const lbl = document.createElement("span");
      lbl.className = "kpi-label";
      lbl.textContent = def.label;
      const num = document.createElement("strong");
      num.className = "kpi-val";
      num.textContent = def.format(live.value);
      const en = document.createElement("span");
      en.className = "kpi-en";
      en.textContent = def.en;
      meta.append(lbl, num, en);

      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "kpi-rm";
      rm.dataset.kpiRemove = def.id;
      rm.setAttribute("aria-label", `移除 ${def.label}`);
      rm.textContent = "×";

      top.append(ico, meta, rm);
      card.appendChild(top);

      if (state.showBaseline) {
        const foot = document.createElement("div");
        foot.className = "kpi-foot";
        const stroke =
          state.signalMode === "muted"
            ? "#848E8D"
            : isCritCard
            ? "#FF6B4A"
            : def.accent === "cyan"
            ? "#3BDAED"
            : "#ADE62D";
        foot.appendChild(makeSparkSvg(live.spark, stroke));
        const delta = document.createElement("span");
        delta.className = `kpi-delta ${live.delta < 0 ? "is-down" : "is-up"}`;
        delta.textContent = def.formatDelta(live.delta);
        foot.appendChild(delta);
        card.appendChild(foot);
      } else {
        const bare = document.createElement("div");
        bare.className = "kpi-bare";
        bare.textContent = "无同比基准 · 难辨涨跌";
        card.appendChild(bare);
      }

      kpiGridEl.appendChild(card);
    }
  }

  function renderOps(ev) {
    const snap = ev.snap;
    const isLoadCrit = snap.load >= 80;
    if (radarLoadEl) {
      radarLoadEl.textContent = `负载 ${snap.load}%`;
      radarLoadEl.classList.toggle("is-crit", isLoadCrit && state.signalMode === "anomaly");
    }

    // 实时负载半圆弧（周长 π * 46 ≈ 144.5）
    const arcLen = 144.5;
    gaugeArc.style.strokeDasharray = `${((snap.load / 100) * arcLen).toFixed(1)} ${arcLen}`;
    gaugeArc.classList.toggle("is-crit", isLoadCrit && state.signalMode === "anomaly");
    gaugeNum.textContent = `${snap.load}%`;
    gaugeNum.classList.toggle("is-crit", isLoadCrit && state.signalMode === "anomaly");
    gaugeState.textContent = isLoadCrit
      ? `负载越线（警戒 80%）· 磁盘余 ${snap.disk}%`
      : `运行平稳 · 磁盘余 ${snap.disk}%`;
    gaugeState.classList.toggle("is-crit", isLoadCrit && state.signalMode === "anomaly");

    // 任务进度 4 条
    taskListEl.replaceChildren();
    for (const tk of snap.tasks) {
      const row = document.createElement("div");
      row.className = "task-row";
      const head = document.createElement("div");
      head.className = "task-head";
      const nm = document.createElement("span");
      nm.textContent = tk.name;
      const pct = document.createElement("span");
      pct.className = "task-pct";
      pct.textContent = `${tk.pct}%`;
      head.append(nm, pct);
      const track = document.createElement("div");
      track.className = "task-track";
      const fill = document.createElement("div");
      fill.className = `task-fill accent-${tk.accent}`;
      fill.style.width = `${tk.pct}%`;
      track.appendChild(fill);
      row.append(head, track);
      taskListEl.appendChild(row);
    }

    // 告警中心（动态高亮当前时刻命中的告警）
    alertListEl.replaceChildren();
    const displayIncidents = INCIDENTS.slice(0, 3);
    // 若时间在 18:40 转化率异动附近，把转化率告警切到第一行
    const list =
      snap.activeIncident && snap.activeIncident.id === "conv"
        ? [INCIDENTS[3], INCIDENTS[0], INCIDENTS[2]]
        : displayIncidents;

    for (const inc of list) {
      const hit = state.minute >= inc.window[0] && state.minute <= inc.window[1];
      const item = document.createElement("div");
      item.className = `alert-row sev-${inc.severity} ${hit ? "is-now" : ""}`;
      const badge = document.createElement("span");
      badge.className = "alert-dot";
      badge.textContent = inc.severity === "critical" ? "!" : "i";
      const body = document.createElement("div");
      body.className = "alert-body";
      const ttl = document.createElement("strong");
      ttl.textContent = inc.title;
      const sub = document.createElement("span");
      sub.textContent = inc.detail;
      body.append(ttl, sub);
      const tm = document.createElement("span");
      tm.className = "alert-time";
      tm.textContent = inc.time;
      item.append(badge, body, tm);
      alertListEl.appendChild(item);
    }
  }

  function renderScrubber(ev) {
    const pct = (state.minute / 1439) * 100;
    scrubFill.style.width = `${pct.toFixed(2)}%`;
    scrubThumb.style.left = `${pct.toFixed(2)}%`;
    scrubThumb.setAttribute("aria-valuenow", String(Math.round(state.minute)));
    scrubThumb.setAttribute("aria-valuetext", ev.snap.timeStr);
    scrubTimeEl.textContent = ev.snap.timeStr;
    scrubEventEl.textContent = ev.snap.activeIncident
      ? `此刻事件：${ev.snap.activeIncident.title}（${ev.snap.activeIncident.time}）`
      : `系统平稳 · 负载 ${ev.snap.load}% · 磁盘余 ${ev.snap.disk}%`;
    scrubEventEl.classList.toggle("is-crit", ev.snap.hasCritical && state.signalMode === "anomaly");
  }

  function renderDiagnosis(ev) {
    heroEl.dataset.signal = state.signalMode;
    heroEl.dataset.level = ev.level;
    diagBox.dataset.level = ev.level;

    topBadge.textContent = ev.badge;
    topBadge.dataset.level = ev.level;
    diagBadge.textContent = ev.badge;
    diagBadge.dataset.level = ev.level;
    diagStops.textContent = `扫视 ${ev.scanStops} 步（示意）`;
    diagDensity.textContent = `${ev.totalKpis} 卡 · ${ev.densityTag}`;
    diagHeadline.textContent = ev.headline;
    diagReason.textContent = ev.reason;
    diagHint.textContent = ev.hint;

    baselineBtn.setAttribute("aria-pressed", String(state.showBaseline));
    baselineBtn.classList.toggle("is-active", state.showBaseline);
    baselineBtn.textContent = state.showBaseline ? "对比基准：开（同比+折线）" : "对比基准：关（裸数）";

    signalBtns.forEach((b) => {
      const on = b.dataset.signal === state.signalMode;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });

    for (const [key, node] of Object.entries(pillarEls)) {
      if (!node) continue;
      const st = ev.pillarStatus[key];
      node.classList.toggle("is-ok", st.ok);
      node.classList.toggle("is-bad", !st.ok);
      const tag = node.querySelector(".pillar-state");
      if (tag) tag.textContent = st.tag;
    }
  }

  function renderAll(structChanged = true) {
    const ev = evaluateDashboard(state);
    if (structChanged) {
      renderTierOrder();
      renderKpiPicker();
      renderDonut();
    }
    renderKpiCards(ev);
    renderOps(ev);
    renderScrubber(ev);
    renderDiagnosis(ev);
    drawTrend();
    drawRadar(lastTime, reducedMotion.matches);
  }

  // 24h 时间轴拖拽（极速 60fps 路径，同时响应鼠标、触屏与方向键）
  let scrubbing = false;
  let pendingScrub = false;
  let lastClientX = 0;
  let lastTime = 0;

  function applyScrubX(clientX) {
    const rect = scrubTrack.getBoundingClientRect();
    if (rect.width < 10) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    state.minute = Math.round(ratio * 1439);
    // 靠近原海报三个关键告警点 8 分钟内轻吸附
    for (const m of [487, 624, 1120]) {
      if (Math.abs(state.minute - m) <= 8) {
        state.minute = m;
        break;
      }
    }
    renderAll(false);
  }

  function scheduleScrub(clientX) {
    lastClientX = clientX;
    if (pendingScrub) return;
    pendingScrub = true;
    requestAnimationFrame(() => {
      pendingScrub = false;
      applyScrubX(lastClientX);
    });
  }

  scrubTrack.addEventListener("pointerdown", (e) => {
    scrubbing = true;
    try { scrubTrack.setPointerCapture(e.pointerId); } catch {}
    applyScrubX(e.clientX);
  });
  scrubTrack.addEventListener("pointermove", (e) => {
    if (!scrubbing) return;
    scheduleScrub(e.clientX);
  });
  const endScrub = () => { scrubbing = false; };
  scrubTrack.addEventListener("pointerup", endScrub);
  scrubTrack.addEventListener("pointercancel", endScrub);

  // 兼容 perf.mjs 直接发出的 TouchEvent
  scrubTrack.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    scrubbing = true;
    applyScrubX(e.touches[0].clientX);
  }, { passive: true });
  scrubTrack.addEventListener("touchmove", (e) => {
    if (!scrubbing || !e.touches.length) return;
    scheduleScrub(e.touches[0].clientX);
  }, { passive: true });
  scrubTrack.addEventListener("touchend", endScrub, { passive: true });

  // 键盘方向键精调时间拨尺
  scrubThumb.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 60 : 15;
    if (e.key === "ArrowLeft") { e.preventDefault(); state.minute = Math.max(0, state.minute - step); renderAll(false); }
    else if (e.key === "ArrowRight") { e.preventDefault(); state.minute = Math.min(1439, state.minute + step); renderAll(false); }
  });

  // 三个快速跳转事件锚点
  incJumpBtns.forEach((b) =>
    b.addEventListener("click", () => {
      state.minute = Number(b.dataset.jumpMin);
      renderAll(false);
    })
  );

  // 层级上下移动
  stackEl.addEventListener("click", (e) => {
    const mv = e.target.closest("[data-move]");
    if (mv) {
      const tier = mv.closest(".dash-tier")?.dataset.tier;
      const idx = state.tierOrder.indexOf(tier);
      if (idx < 0) return;
      const next = mv.dataset.move === "up" ? idx - 1 : idx + 1;
      if (next < 0 || next >= state.tierOrder.length) return;
      const arr = [...state.tierOrder];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      state.tierOrder = arr;
      renderAll(true);
      return;
    }
    const rm = e.target.closest("[data-kpi-remove]");
    if (rm) {
      const id = rm.dataset.kpiRemove;
      if (state.activeKpis.length <= 1) return;
      state.activeKpis = state.activeKpis.filter((k) => k !== id);
      renderAll(true);
    }
  });

  // 指标芯片增删
  kpiPickerEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-kpi-toggle]");
    if (!btn) return;
    const id = btn.dataset.kpiToggle;
    if (state.activeKpis.includes(id)) {
      if (state.activeKpis.length <= 1) return;
      state.activeKpis = state.activeKpis.filter((k) => k !== id);
    } else {
      state.activeKpis = [...state.activeKpis, id];
    }
    renderAll(true);
  });

  // 渠道圆环联动筛选
  channelListEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-channel]");
    if (!btn) return;
    const ch = btn.dataset.channel;
    state.selectedChannel = state.selectedChannel === ch ? "all" : ch;
    renderAll(true);
  });

  // 基准开关 & 信号纪律 & 复原错态 / 参考正版
  baselineBtn.addEventListener("click", () => {
    state.showBaseline = !state.showBaseline;
    renderAll(true);
  });
  signalBtns.forEach((b) =>
    b.addEventListener("click", () => {
      state.signalMode = b.dataset.signal;
      renderAll(true);
    })
  );
  resetBtn.addEventListener("click", () => {
    state = createBrokenState();
    renderAll(true);
  });
  idealBtn.addEventListener("click", () => {
    state = createIdealState(state.minute);
    renderAll(true);
  });

  // ResizeObserver 保证画布清晰不拉伸
  const ro = new ResizeObserver(() => {
    drawTrend();
    drawRadar(lastTime, reducedMotion.matches);
  });
  ro.observe(trendCanvas);
  ro.observe(radarCanvas);

  // 使用 lib/stage.js 的 loop：屏幕外与标签页隐藏自动停止，reduced-motion 下静止一帧
  const radarLoop = loop(heroEl, (t, _dt, { still }) => {
    lastTime = t;
    drawRadar(t, still);
  });

  renderAll(true);
  radarLoop.draw();
}

// =========================================================================
// 滚动入场轻揭示（不依赖常驻动画，reduced-motion 直接显现）
// =========================================================================
function initReveal() {
  const nodes = [...document.querySelectorAll(".reveal")];
  if (!nodes.length) return;
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
  );
  nodes.forEach((n) => io.observe(n));
}

// 启动
initHero();
initSec01();
initSec02();
initSec03();
initSec04();
initSec05();
initSec06();
initSec07();
initPosterLightbox();
initReveal();

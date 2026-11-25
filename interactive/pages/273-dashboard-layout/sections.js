// 273 仪表盘布局 · 正文 01–08 节互动与原海报灯箱控制器
import {
  BUDGET_CARDS,
  CLUSTER_SCENARIOS,
  COLOR_DISCIPLINES,
  DASHBOARD_TYPES,
  ENCODING_DATA,
  ENCODING_MODES,
  HISTORY_ERAS,
  PRACTICE_OPTIONS,
  SCAN_FLOWS,
  evaluateBudget,
} from "./model.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function el(tag, attrs = {}, text = "") {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (v !== null && v !== undefined) n.setAttribute(k, String(v));
  }
  if (text) n.textContent = text;
  return n;
}

function svgEl(tag, attrs = {}, text = "") {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) n.setAttribute(k, String(v));
  }
  if (text) n.textContent = text;
  return n;
}

// =========================================================================
// 01 节：眼动扫视路径模拟器（倒金字塔 vs 平权九宫格 vs 日志压顶）
// =========================================================================
export function initSec01() {
  const host = document.getElementById("s01-svg");
  const modeBtns = [...document.querySelectorAll("[data-flow]")];
  const stepBtn = document.getElementById("s01-step");
  const verdictEl = document.getElementById("s01-verdict");
  const descEl = document.getElementById("s01-desc");
  if (!host || !modeBtns.length) return;

  let current = "pyramid";
  let visibleSteps = SCAN_FLOWS.pyramid.points.length;

  function render() {
    const flow = SCAN_FLOWS[current];
    modeBtns.forEach((b) => {
      const on = b.dataset.flow === current;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    verdictEl.textContent = flow.verdict;
    descEl.textContent = flow.desc;

    host.replaceChildren();

    // 画布底板（540 x 308）
    host.appendChild(svgEl("rect", { x: 0, y: 0, width: 540, height: 308, rx: 8, fill: "#111514" }));

    // 按模式画三种真实线框结构
    if (current === "pyramid") {
      // 顶行 4 KPI
      for (let i = 0; i < 4; i++) {
        const x = 18 + i * 128;
        host.appendChild(svgEl("rect", { x, y: 18, width: 120, height: 68, rx: 5, fill: "#1A1F1E", stroke: i === 0 ? "#3BDAED" : "#2D3332", "stroke-width": 1.2 }));
        host.appendChild(svgEl("rect", { x: x + 10, y: 28, width: 42, height: 6, rx: 2, fill: "#7C8785" }));
        host.appendChild(svgEl("rect", { x: x + 10, y: 42, width: 64, height: 14, rx: 2, fill: i % 2 === 0 ? "#3BDAED" : "#ADE62D", opacity: 0.85 }));
        host.appendChild(svgEl("path", { d: `M${x + 10} 72 L${x + 36} 66 L${x + 62} 70 L${x + 92} 62`, fill: "none", stroke: i % 2 === 0 ? "#3BDAED" : "#ADE62D", "stroke-width": 1.5 }));
      }
      // 中行 趋势 + 渠道
      host.appendChild(svgEl("rect", { x: 18, y: 98, width: 326, height: 102, rx: 5, fill: "#1A1F1E", stroke: "#2D3332" }));
      host.appendChild(svgEl("path", { d: "M34 182 L94 156 L154 134 L214 150 L274 166 L326 124", fill: "none", stroke: "#3BDAED", "stroke-width": 2 }));
      host.appendChild(svgEl("rect", { x: 356, y: 98, width: 166, height: 102, rx: 5, fill: "#1A1F1E", stroke: "#2D3332" }));
      host.appendChild(svgEl("circle", { cx: 414, cy: 149, r: 28, fill: "none", stroke: "#3BDAED", "stroke-width": 11, "stroke-dasharray": "75 110" }));
      host.appendChild(svgEl("circle", { cx: 414, cy: 149, r: 28, fill: "none", stroke: "#ADE62D", "stroke-width": 11, "stroke-dasharray": "52 130", "stroke-dashoffset": -78 }));
      // 底行 监控 + 进度 + 告警
      host.appendChild(svgEl("rect", { x: 18, y: 212, width: 158, height: 78, rx: 5, fill: "#1A1F1E", stroke: "#2D3332" }));
      host.appendChild(svgEl("path", { d: "M64 268 A32 32 0 0 1 128 268", fill: "none", stroke: "#2D3433", "stroke-width": 7 }));
      host.appendChild(svgEl("path", { d: "M64 268 A32 32 0 0 1 118 245", fill: "none", stroke: "#3BDAED", "stroke-width": 7 }));
      host.appendChild(svgEl("rect", { x: 188, y: 212, width: 158, height: 78, rx: 5, fill: "#1A1F1E", stroke: "#2D3332" }));
      [
        { y: 230, w: 112, c: "#3BDAED" },
        { y: 248, w: 86, c: "#ADE62D" },
        { y: 266, w: 124, c: "#3BDAED" },
      ].forEach((bar) => {
        host.appendChild(svgEl("rect", { x: 202, y: bar.y, width: 130, height: 7, rx: 2, fill: "#282F2E" }));
        host.appendChild(svgEl("rect", { x: 202, y: bar.y, width: bar.w, height: 7, rx: 2, fill: bar.c, opacity: 0.78 }));
      });
      host.appendChild(svgEl("rect", { x: 358, y: 212, width: 164, height: 78, rx: 5, fill: "#281915", stroke: "#FF6B4A", "stroke-width": 1.5 }));
      host.appendChild(svgEl("text", { x: 370, y: 227, fill: "#FF6B4A", "font-size": 11, "font-family": "JetBrains Mono, monospace" }, "ALERT · 10:24"));
      host.appendChild(svgEl("text", { x: 370, y: 243, fill: "#F2F5F4", "font-size": 12 }, "负载 91% 越线"));
    } else if (current === "flat") {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const x = 18 + c * 172;
          const y = 18 + r * 92;
          const isAlert = r === 2 && c === 2;
          host.appendChild(svgEl("rect", {
            x, y, width: 160, height: 80, rx: 5,
            fill: "#1A1F1E",
            stroke: isAlert ? "#FF6B4A" : "#343B3A",
          }));
          host.appendChild(svgEl("rect", { x: x + 12, y: y + 14, width: 58, height: 7, rx: 2, fill: "#6D7876" }));
          host.appendChild(svgEl("rect", { x: x + 12, y: y + 32, width: 88, height: 12, rx: 2, fill: isAlert ? "#FF6B4A" : "#4E5957" }));
          host.appendChild(svgEl("rect", { x: x + 12, y: y + 54, width: 120, height: 6, rx: 2, fill: "#2C3332" }));
        }
      }
    } else {
      // 日志压顶
      host.appendChild(svgEl("rect", { x: 18, y: 18, width: 504, height: 82, rx: 5, fill: "#221815", stroke: "#FF6B4A" }));
      host.appendChild(svgEl("text", { x: 32, y: 40, fill: "#FF6B4A", "font-size": 11, "font-family": "JetBrains Mono, monospace" }, "RAW ALERTS & SYSTEM LOGS (顶行被细节占满)"));
      for (let i = 0; i < 3; i++) {
        host.appendChild(svgEl("rect", { x: 32, y: 50 + i * 14, width: 420 - i * 48, height: 7, rx: 2, fill: "#5B4A46" }));
      }
      host.appendChild(svgEl("rect", { x: 18, y: 112, width: 504, height: 90, rx: 5, fill: "#1A1F1E", stroke: "#2D3332" }));
      host.appendChild(svgEl("path", { d: "M34 184 L130 156 L220 140 L340 162 L498 130", fill: "none", stroke: "#3BDAED", "stroke-width": 1.8 }));
      for (let i = 0; i < 4; i++) {
        const x = 18 + i * 128;
        host.appendChild(svgEl("rect", { x, y: 214, width: 120, height: 76, rx: 5, fill: "#1A1F1E", stroke: "#2D3332" }));
        host.appendChild(svgEl("rect", { x: x + 12, y: 242, width: 64, height: 14, rx: 2, fill: "#ADE62D", opacity: 0.7 }));
      }
    }

    // 绘制眼动扫视折线（只画到 visibleSteps）
    const pts = flow.points.slice(0, visibleSteps);
    if (pts.length > 1) {
      const d = pts.map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
      host.appendChild(svgEl("path", {
        d,
        fill: "none",
        stroke: current === "pyramid" ? "#3BDAED" : "#FF6B4A",
        "stroke-width": 2.4,
        "stroke-dasharray": current === "pyramid" ? "none" : "6 4",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }));
    }
    pts.forEach((p, idx) => {
      const isLast = idx === pts.length - 1;
      const stroke = current === "pyramid" ? "#3BDAED" : "#FF6B4A";
      host.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r: isLast ? 13 : 11, fill: "#0C0F0E", stroke, "stroke-width": 2 }));
      host.appendChild(svgEl("text", {
        x: p.x, y: p.y + 4, "text-anchor": "middle", fill: "#F2F5F4",
        "font-size": 11, "font-weight": 600, "font-family": "JetBrains Mono, monospace",
      }, String(idx + 1)));

      if (p.label.length > 2) {
        const placeLeft = p.x > 340;
        const lx = placeLeft ? Math.max(20, p.x - 130) : Math.min(406, Math.max(20, p.x + 18));
        const ly = p.y - 11;
        host.appendChild(svgEl("rect", { x: lx, y: ly, width: 112, height: 22, rx: 4, fill: "#0C0F0E", stroke, "stroke-width": 1 }));
        host.appendChild(svgEl("text", { x: lx + 8, y: ly + 15, fill: "#F2F5F4", "font-size": 11 }, p.label));
      }
    });

    stepBtn.textContent =
      visibleSteps < flow.points.length
        ? `下一步扫视（${visibleSteps}/${flow.points.length}）`
        : "从第 1 眼重放扫视";
  }

  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      current = b.dataset.flow;
      visibleSteps = SCAN_FLOWS[current].points.length;
      render();
    })
  );

  stepBtn.addEventListener("click", () => {
    const total = SCAN_FLOWS[current].points.length;
    visibleSteps = visibleSteps >= total ? 1 : visibleSteps + 1;
    render();
  });

  render();
}

// =========================================================================
// 02 节：单屏五秒预算模拟器（2–12 张指标卡与首屏折叠线实测）
// =========================================================================
export function initSec02() {
  const slider = document.getElementById("s02-range");
  const countOut = document.getElementById("s02-count");
  const statusOut = document.getElementById("s02-status");
  const noteOut = document.getElementById("s02-note");
  const screenKpis = document.getElementById("s02-kpis");
  const foldBadge = document.getElementById("s02-fold-badge");
  const screenEl = document.getElementById("s02-screen");
  if (!slider || !screenKpis) return;

  function render() {
    const res = evaluateBudget(Number(slider.value));
    countOut.textContent = `${res.n} 张指标卡`;
    statusOut.textContent = res.status;
    statusOut.dataset.zone = res.zone;
    noteOut.textContent = res.note;
    screenEl.dataset.zone = res.zone;

    screenKpis.style.gridTemplateColumns = `repeat(${res.cols}, minmax(0, 1fr))`;
    screenKpis.replaceChildren();
    for (let i = 0; i < res.n; i++) {
      const item = BUDGET_CARDS[i];
      const card = el("div", { class: `sim-kpi ${item.core ? "is-core" : "is-extra"}` });
      card.append(
        el("span", { class: "sim-kpi-name" }, item.name),
        el("strong", { class: "sim-kpi-val" }, item.val),
        el("span", { class: "sim-kpi-delta" }, item.delta)
      );
      screenKpis.appendChild(card);
    }

    if (res.overflowPx > 0) {
      foldBadge.textContent = `首屏折叠线 · 下层溢出 ${res.overflowPx}px（需滚屏）`;
      foldBadge.classList.add("is-warn");
    } else {
      foldBadge.textContent = "首屏折叠线 · 三层完整收束在一屏内";
      foldBadge.classList.remove("is-warn");
    }
  }

  slider.addEventListener("input", render);
  render();
}

// =========================================================================
// 03 节：Cleveland & McGill 视觉编码精度 + 遮数盲估测试
// =========================================================================
export function initSec03() {
  const host = document.getElementById("s03-svg");
  const modeBtns = [...document.querySelectorAll("[data-enc]")];
  const blindBtn = document.getElementById("s03-blind");
  const rankOut = document.getElementById("s03-rank");
  const spaceOut = document.getElementById("s03-space");
  const verdictOut = document.getElementById("s03-verdict");
  if (!host || !modeBtns.length) return;

  let mode = "bullet";
  let blind = false;

  function render() {
    const info = ENCODING_MODES[mode];
    modeBtns.forEach((b) => {
      const on = b.dataset.enc === mode;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    blindBtn.setAttribute("aria-pressed", String(blind));
    blindBtn.textContent = blind ? "揭晓真实数值" : "遮住数字盲估";
    rankOut.textContent = info.rank;
    spaceOut.textContent = info.spacePct;
    verdictOut.textContent = info.verdict;

    host.replaceChildren();
    host.appendChild(svgEl("rect", { x: 0, y: 0, width: 560, height: 280, rx: 8, fill: "#141817" }));

    if (mode === "bullet") {
      // 刻度头与 75% 目标线 / 80% 警戒区
      const x0 = 112;
      const bw = 382;
      const xOf = (v) => x0 + (v / 100) * bw;
      host.appendChild(svgEl("rect", { x: xOf(80), y: 34, width: xOf(100) - xOf(80), height: 210, fill: "rgba(255,107,74,0.12)" }));
      for (const tick of [0, 25, 50, 75, 100]) {
        const tx = xOf(tick);
        host.appendChild(svgEl("line", { x1: tx, y1: 34, x2: tx, y2: 246, stroke: tick === 75 ? "#ADE62D" : "#29302F", "stroke-dasharray": tick === 75 ? "3 3" : "none" }));
        host.appendChild(svgEl("text", { x: tx, y: 26, "text-anchor": "middle", fill: tick === 75 ? "#ADE62D" : "#8A9593", "font-size": 11, "font-family": "JetBrains Mono, monospace" }, tick === 75 ? "目标 75%" : `${tick}%`));
      }
      ENCODING_DATA.forEach((d, idx) => {
        const y = 52 + idx * 48;
        const isWarn = d.value >= d.warn;
        host.appendChild(svgEl("text", { x: 18, y: y + 17, fill: "#E4EBE9", "font-size": 12 }, d.name));
        host.appendChild(svgEl("rect", { x: x0, y, width: bw, height: 24, rx: 3, fill: "#202625" }));
        host.appendChild(svgEl("rect", { x: x0, y: y + 4, width: (d.value / 100) * bw, height: 16, rx: 2, fill: isWarn ? "#FF6B4A" : "#3BDAED" }));
        // 75% 竖标靶线
        host.appendChild(svgEl("line", { x1: xOf(d.target), y1: y - 2, x2: xOf(d.target), y2: y + 26, stroke: "#F2F5F4", "stroke-width": 2 }));
        host.appendChild(svgEl("text", {
          x: x0 + bw + 10, y: y + 17, fill: isWarn ? "#FF6B4A" : "#F2F5F4",
          "font-size": 12, "font-weight": 600, "font-family": "JetBrains Mono, monospace",
        }, blind ? "??%" : `${d.value}%`));
      });
    } else if (mode === "gauge") {
      ENCODING_DATA.forEach((d, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const cx = 150 + col * 260;
        const cy = 104 + row * 124;
        const r = 52;
        const isWarn = d.value >= d.warn;
        // 180 度背景弧
        host.appendChild(svgEl("path", {
          d: `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`,
          fill: "none", stroke: "#2B3231", "stroke-width": 12, "stroke-linecap": "butt",
        }));
        const ang = Math.PI - (d.value / 100) * Math.PI;
        const ex = cx + Math.cos(ang) * r;
        const ey = cy - Math.sin(ang) * r;
        host.appendChild(svgEl("path", {
          d: `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`,
          fill: "none", stroke: isWarn ? "#FF6B4A" : idx % 2 === 0 ? "#3BDAED" : "#ADE62D", "stroke-width": 12,
        }));
        host.appendChild(svgEl("text", { x: cx, y: cy - 12, "text-anchor": "middle", fill: "#F2F5F4", "font-size": 18, "font-weight": 700, "font-family": "JetBrains Mono, monospace" }, blind ? "??%" : `${d.value}%`));
        host.appendChild(svgEl("text", { x: cx, y: cy + 20, "text-anchor": "middle", fill: "#9AA5A3", "font-size": 12 }, d.name));
      });
    } else if (mode === "donut") {
      const total = ENCODING_DATA.reduce((s, d) => s + d.value, 0);
      const cx = 190;
      const cy = 140;
      const r = 74;
      const circ = 2 * Math.PI * r;
      const cols = ["#FF6B4A", "#3BDAED", "#ADE62D", "#6C7476"];
      let offset = 0;
      ENCODING_DATA.forEach((d, idx) => {
        const len = (d.value / total) * circ;
        host.appendChild(svgEl("circle", {
          cx, cy, r, fill: "none", stroke: cols[idx], "stroke-width": 28,
          "stroke-dasharray": `${Math.max(1, len - 2)} ${circ}`,
          "stroke-dashoffset": -offset,
          transform: `rotate(-90 ${cx} ${cy})`,
        }));
        offset += len;
        const ly = 72 + idx * 42;
        host.appendChild(svgEl("rect", { x: 320, y: ly - 10, width: 12, height: 12, rx: 2, fill: cols[idx] }));
        host.appendChild(svgEl("text", { x: 342, y: ly, fill: "#E4EBE9", "font-size": 13 }, d.name));
        host.appendChild(svgEl("text", { x: 480, y: ly, fill: "#F2F5F4", "font-size": 13, "font-weight": 600, "font-family": "JetBrains Mono, monospace" }, blind ? "??%" : `${d.value}%`));
      });
      host.appendChild(svgEl("text", { x: cx, y: cy + 5, "text-anchor": "middle", fill: "#9AA5A3", "font-size": 12 }, "4 项扇角对比"));
    } else {
      // 气泡面积图（半径与 sqrt(value) 成正比）
      const xs = [104, 232, 356, 466];
      const cols = ["#FF6B4A", "#3BDAED", "#ADE62D", "#6C7476"];
      ENCODING_DATA.forEach((d, idx) => {
        const r = Math.sqrt(d.value) * 5.6;
        const cx = xs[idx];
        const cy = 132;
        host.appendChild(svgEl("circle", { cx, cy, r, fill: cols[idx], "fill-opacity": 0.24, stroke: cols[idx], "stroke-width": 2 }));
        host.appendChild(svgEl("text", { x: cx, y: cy + 5, "text-anchor": "middle", fill: "#F2F5F4", "font-size": 15, "font-weight": 700, "font-family": "JetBrains Mono, monospace" }, blind ? "??%" : `${d.value}%`));
        host.appendChild(svgEl("text", { x: cx, y: 234, "text-anchor": "middle", fill: "#9AA5A3", "font-size": 12 }, d.name));
      });
    }
  }

  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.enc;
      render();
    })
  );
  blindBtn.addEventListener("click", () => {
    blind = !blind;
    render();
  });
  render();
}

// =========================================================================
// 04 节：6 节点故障注入 × 语义配色纪律台
// =========================================================================
export function initSec04() {
  const grid = document.getElementById("s04-grid");
  const discBtns = [...document.querySelectorAll("[data-disc]")];
  const faultBtns = [...document.querySelectorAll("[data-fault]")];
  const meterOut = document.getElementById("s04-meter");
  const descOut = document.getElementById("s04-desc");
  if (!grid || !discBtns.length) return;

  let discipline = "poster_mix";
  let fault = "disk";

  function render() {
    discBtns.forEach((b) => {
      const on = b.dataset.disc === discipline;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    faultBtns.forEach((b) => {
      const on = b.dataset.fault === fault;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });

    const scen = CLUSTER_SCENARIOS[fault];
    const disc = COLOR_DISCIPLINES[discipline];
    grid.dataset.disc = discipline;
    grid.replaceChildren();

    let brightCount = 0;
    let critCount = 0;
    scen.nodes.forEach((node, idx) => {
      if (node.state === "crit") critCount++;
      const card = el("div", { class: `cl-node is-${node.state}`, "data-idx": idx });
      if (discipline === "rainbow" || discipline === "poster_mix" || node.state !== "ok") {
        brightCount++;
      }
      card.append(
        el("div", { class: "cl-head" }, node.id),
        el("div", { class: "cl-metric" }, node.metric),
        el("div", { class: "cl-sub" }, node.sub)
      );
      grid.appendChild(card);
    });

    const satRatio = Math.round((brightCount / scen.nodes.length) * 100);
    if (critCount === 0) {
      meterOut.textContent = `当前高饱和卡片 ${brightCount}/6（${satRatio}%）· 全线无故障`;
    } else if (discipline === "exception") {
      meterOut.textContent = `高饱和卡片仅 ${brightCount}/6 · 异常独占高亮通道（易识别）`;
    } else {
      meterOut.textContent = `高饱和卡片 ${brightCount}/6（${satRatio}%）· ${critCount} 条真实故障被同级高亮淹没`;
    }
    descOut.textContent = disc.desc;
  }

  discBtns.forEach((b) => b.addEventListener("click", () => { discipline = b.dataset.disc; render(); }));
  faultBtns.forEach((b) => b.addEventListener("click", () => { fault = b.dataset.fault; render(); }));
  render();
}

// =========================================================================
// 05 节：历史演进四时期标本矢量图
// =========================================================================
export function initSec05() {
  const btns = [...document.querySelectorAll("[data-era]")];
  const svg = document.getElementById("s05-svg");
  const titleOut = document.getElementById("s05-title");
  const srcOut = document.getElementById("s05-source");
  const bodyOut = document.getElementById("s05-body");
  if (!svg || !btns.length) return;

  let eraId = "1842";

  function render() {
    const era = HISTORY_ERAS.find((e) => e.id === eraId) || HISTORY_ERAS[0];
    btns.forEach((b) => {
      const on = b.dataset.era === eraId;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    titleOut.textContent = `${era.year} · ${era.title}`;
    srcOut.textContent = era.source;
    bodyOut.textContent = era.summary;

    svg.replaceChildren();
    svg.appendChild(svgEl("rect", { x: 0, y: 0, width: 460, height: 220, rx: 8, fill: "#141817", stroke: "#282F2E" }));

    if (eraId === "1842") {
      // 马车挡泥板 → 汽车仪表立板矢量示意
      svg.appendChild(svgEl("path", { d: "M48 168 L170 168 L186 72 L166 72 L154 152 L48 152 Z", fill: "#242B2A", stroke: "#3BDAED", "stroke-width": 1.5 }));
      svg.appendChild(svgEl("circle", { cx: 102, cy: 174, r: 22, fill: "none", stroke: "#889492", "stroke-width": 2 }));
      svg.appendChild(svgEl("text", { x: 54, y: 52, fill: "#3BDAED", "font-size": 11, "font-family": "JetBrains Mono, monospace" }, "1842 · SPLASH BOARD"));
      svg.appendChild(svgEl("path", { d: "M204 114 L244 114", stroke: "#ADE62D", "stroke-width": 1.8, "stroke-dasharray": "4 3" }));
      // 汽车立板三表盘
      svg.appendChild(svgEl("rect", { x: 260, y: 66, width: 164, height: 96, rx: 12, fill: "#1B2120", stroke: "#ADE62D", "stroke-width": 1.5 }));
      [296, 342, 388].forEach((cx, i) => {
        const r = i === 1 ? 24 : 16;
        svg.appendChild(svgEl("circle", { cx, cy: 114, r, fill: "#0F1312", stroke: i === 1 ? "#3BDAED" : "#8A9593", "stroke-width": 1.6 }));
        svg.appendChild(svgEl("line", { x1: cx, y1: 114, x2: cx + r * 0.55, y2: 114 - r * 0.55, stroke: "#ADE62D", "stroke-width": 1.6 }));
      });
      svg.appendChild(svgEl("text", { x: 262, y: 52, fill: "#ADE62D", "font-size": 11, "font-family": "JetBrains Mono, monospace" }, "COCKPIT PANEL"));
    } else if (eraId === "1979") {
      // EIS CRT 终端 3-6 个关键成功因素表
      svg.appendChild(svgEl("rect", { x: 40, y: 26, width: 380, height: 168, rx: 6, fill: "#0D1310", stroke: "#ADE62D", "stroke-width": 1.5 }));
      svg.appendChild(svgEl("text", { x: 58, y: 52, fill: "#ADE62D", "font-size": 11, "font-family": "JetBrains Mono, monospace" }, "EIS · CRITICAL SUCCESS FACTORS (ROCKART 1979)"));
      svg.appendChild(svgEl("line", { x1: 58, y1: 62, x2: 402, y2: 62, stroke: "#2F3D29" }));
      ["CSF-01  CASH FLOW RATIO       [ OK ]  +4.2%", "CSF-02  UNIT MARGIN           [ OK ]  18.6%", "CSF-03  ORDER LEAD TIME       [ !! ]  +2.4d", "CSF-04  KEY ACCOUNT RETENTION [ OK ]  94.1%"].forEach((line, i) => {
        svg.appendChild(svgEl("text", { x: 58, y: 88 + i * 24, fill: i === 2 ? "#FF6B4A" : "#C8E89A", "font-size": 11, "font-family": "JetBrains Mono, monospace" }, line));
      });
    } else if (eraId === "1996") {
      // Shneiderman 三步漏斗
      const steps = [
        { x: 30, w: 122, t: "01 OVERVIEW", s: "先看全局总览", c: "#3BDAED" },
        { x: 170, w: 122, t: "02 ZOOM/FILTER", s: "再缩放与筛选", c: "#ADE62D" },
        { x: 310, w: 122, t: "03 DETAILS", s: "按需展开细节", c: "#FF6B4A" },
      ];
      steps.forEach((st, i) => {
        svg.appendChild(svgEl("rect", { x: st.x, y: 50, width: st.w, height: 120, rx: 6, fill: "#1B201F", stroke: st.c, "stroke-width": 1.5 }));
        svg.appendChild(svgEl("text", { x: st.x + 12, y: 78, fill: st.c, "font-size": 11, "font-weight": 600, "font-family": "JetBrains Mono, monospace" }, st.t));
        svg.appendChild(svgEl("text", { x: st.x + 12, y: 104, fill: "#F2F5F4", "font-size": 12 }, st.s));
        svg.appendChild(svgEl("rect", { x: st.x + 12, y: 124, width: st.w - 24 - i * 16, height: 8, rx: 2, fill: st.c, opacity: 0.75 }));
        svg.appendChild(svgEl("rect", { x: st.x + 12, y: 140, width: st.w - 40, height: 8, rx: 2, fill: "#38403F" }));
        if (i < 2) {
          svg.appendChild(svgEl("text", { x: st.x + st.w + 5, y: 114, fill: "#9AA5A3", "font-size": 14 }, "→"));
        }
      });
    } else {
      // 2006 现代单屏高密监控 + Sparklines
      svg.appendChild(svgEl("rect", { x: 26, y: 22, width: 408, height: 176, rx: 6, fill: "#101413", stroke: "#3BDAED", "stroke-width": 1.4 }));
      for (let i = 0; i < 4; i++) {
        const x = 38 + i * 98;
        svg.appendChild(svgEl("rect", { x, y: 34, width: 90, height: 48, rx: 4, fill: "#1A1F1E", stroke: "#2C3332" }));
        svg.appendChild(svgEl("rect", { x: x + 8, y: 44, width: 42, height: 9, rx: 2, fill: "#F2F5F4" }));
        svg.appendChild(svgEl("path", { d: `M${x + 8} 72 L${x + 28} 64 L${x + 52} 69 L${x + 80} 59`, fill: "none", stroke: i % 2 === 0 ? "#3BDAED" : "#ADE62D", "stroke-width": 1.6 }));
      }
      svg.appendChild(svgEl("rect", { x: 38, y: 92, width: 244, height: 94, rx: 4, fill: "#1A1F1E", stroke: "#2C3332" }));
      svg.appendChild(svgEl("path", { d: "M52 168 L104 146 L160 122 L214 142 L268 112", fill: "none", stroke: "#3BDAED", "stroke-width": 2 }));
      svg.appendChild(svgEl("rect", { x: 292, y: 92, width: 130, height: 94, rx: 4, fill: "#281915", stroke: "#FF6B4A" }));
      svg.appendChild(svgEl("text", { x: 304, y: 120, fill: "#FF6B4A", "font-size": 11, "font-family": "JetBrains Mono, monospace" }, "SINGLE SCREEN"));
      svg.appendChild(svgEl("text", { x: 304, y: 146, fill: "#F2F5F4", "font-size": 12 }, "一瞥锁定异常"));
    }
  }

  btns.forEach((b) => b.addEventListener("click", () => { eraId = b.dataset.era; render(); }));
  render();
}

// =========================================================================
// 06 节：三类仪表盘配置对照卡
// =========================================================================
export function initSec06() {
  const btns = [...document.querySelectorAll("[data-dtype]")];
  const cadenceOut = document.getElementById("s06-cadence");
  const audOut = document.getElementById("s06-audience");
  const focusOut = document.getElementById("s06-focus");
  const pitfallOut = document.getElementById("s06-pitfall");
  const bars = [
    document.getElementById("s06-bar-kpi"),
    document.getElementById("s06-bar-trend"),
    document.getElementById("s06-bar-ops"),
  ];
  if (!btns.length || !cadenceOut) return;

  let active = "operational";

  function render() {
    const t = DASHBOARD_TYPES[active];
    btns.forEach((b) => {
      const on = b.dataset.dtype === active;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    cadenceOut.textContent = t.cadence;
    audOut.textContent = t.audience;
    focusOut.textContent = t.focus;
    pitfallOut.textContent = t.pitfall;
    const labels = ["KPI 指标", "趋势分析", "告警现场"];
    t.ratio.forEach((pct, i) => {
      if (!bars[i]) return;
      bars[i].style.flex = `${pct} 1 0`;
      bars[i].textContent = `${labels[i]} ${pct}%`;
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => { active = b.dataset.dtype; render(); }));
  render();
}

// =========================================================================
// 07 节：四选一实战诊题
// =========================================================================
export function initSec07() {
  const btns = [...document.querySelectorAll("[data-choice]")];
  const vTitle = document.getElementById("s07-vtitle");
  const vBody = document.getElementById("s07-vbody");
  const wrap = document.getElementById("s07-choices");
  if (!btns.length || !vTitle) return;

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.choice;
      const opt = PRACTICE_OPTIONS[id];
      if (!opt) return;
      wrap.classList.add("is-revealed");
      btns.forEach((b) => {
        const oid = b.dataset.choice;
        const isPicked = oid === id;
        const isCorrect = PRACTICE_OPTIONS[oid].correct;
        b.setAttribute("aria-pressed", String(isPicked));
        b.classList.toggle("is-picked", isPicked);
        b.classList.toggle("is-right", isCorrect);
        b.classList.toggle("is-wrong", isPicked && !isCorrect);
        const tag = b.querySelector(".quiz-reveal");
        if (tag) tag.textContent = PRACTICE_OPTIONS[oid].shortVar;
      });
      vTitle.textContent = opt.title;
      vTitle.classList.toggle("is-ok", opt.correct);
      vTitle.classList.toggle("is-err", !opt.correct);
      vBody.textContent = opt.body;
    });
  });
}

// =========================================================================
// 08 节：原海报可放大、可拖动、Esc 关闭灯箱
// =========================================================================
export function initPosterLightbox() {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-btn");
  const modal = document.getElementById("poster-modal");
  const modalImg = document.getElementById("poster-modal-img");
  const closeBtn = document.getElementById("poster-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const zoomResetBtn = document.getElementById("poster-zoom-reset");
  const viewport = document.getElementById("poster-viewport");
  if (!posterImg || !openBtn || !modal || !modalImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    modalImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
  }

  function resetView() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  }

  function open() {
    if (!modalImg.src) modalImg.src = posterImg.src;
    resetView();
    modal.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === viewport) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });

  zoomInBtn.addEventListener("click", () => { scale = Math.min(3, +(scale + 0.35).toFixed(2)); applyTransform(); });
  zoomOutBtn.addEventListener("click", () => { scale = Math.max(0.8, +(scale - 0.35).toFixed(2)); if (scale <= 1) { tx = 0; ty = 0; } applyTransform(); });
  zoomResetBtn.addEventListener("click", resetView);

  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    scale = Math.max(0.8, Math.min(3, +(scale + delta).toFixed(2)));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  modalImg.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    modalImg.setPointerCapture(e.pointerId);
  });
  modalImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  modalImg.addEventListener("pointerup", () => { dragging = false; });
  modalImg.addEventListener("pointercancel", () => { dragging = false; });
}

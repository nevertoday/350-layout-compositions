// 01–07 节全部独立互动模块（每节控件各异，相邻不重样）

import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";
import { POSTER_FRACTIONS, computeDecayComparison, clamp } from "./model.js";

const SVG_NS = "http://www.w3.org/2000/svg";
function el(tag, attrs = {}, text = "") {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (text) node.textContent = text;
  return node;
}

// ==================== 01 节：原海报 8 级分数步长显微镜 ====================
export function initSection01() {
  const strip = document.getElementById("frac-strip");
  const svg = document.getElementById("frac-chart");
  const readout = document.getElementById("frac-readout");
  const overlayBtn = document.getElementById("btn-geo-overlay");
  if (!strip || !svg || !readout || !overlayBtn) return;

  const base = POSTER_FRACTIONS.slice(0, 8);
  const pairs = [];
  for (let i = 0; i < base.length - 1; i++) {
    const a = base[i];
    const b = base[i + 1];
    pairs.push({
      idx: i,
      from: a.label,
      to: b.label,
      ratio: b.value / a.value,
      aVal: a.value,
      bVal: b.value,
    });
  }

  let activePair = 0;
  let showGeo = false;

  pairs.forEach((p, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "frac-pair-btn" + (idx === 0 ? " is-active" : "");
    btn.setAttribute("aria-pressed", idx === 0 ? "true" : "false");
    btn.innerHTML = `<strong lang="en">${p.from}→${p.to}</strong><span lang="en">×${p.ratio.toFixed(2)}</span>`;
    btn.addEventListener("click", () => {
      activePair = idx;
      render();
    });
    strip.append(btn);
  });

  overlayBtn.addEventListener("click", () => {
    showGeo = !showGeo;
    overlayBtn.setAttribute("aria-pressed", showGeo ? "true" : "false");
    overlayBtn.classList.toggle("is-active", showGeo);
    overlayBtn.textContent = showGeo ? "已叠严格等比 (0.70)" : "叠看严格等比";
    render();
  });

  function render() {
    [...strip.children].forEach((b, i) => {
      const on = i === activePair;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });

    svg.innerHTML = "";
    const padL = 46;
    const padR = 22;
    const padT = 26;
    const padB = 34;
    const chartW = 560 - padL - padR;
    const chartH = 210 - padT - padB;

    // Y 轴刻度线（0.50 .. 0.90）
    const yMin = 0.5;
    const yMax = 0.85;
    const yOf = (val) => padT + chartH * (1 - (val - yMin) / (yMax - yMin));

    for (const tick of [0.55, 0.65, 0.70, 0.75, 0.80]) {
      const y = yOf(tick);
      svg.append(el("line", {
        x1: padL, y1: y, x2: 560 - padR, y2: y,
        stroke: tick === 0.70 ? PALETTE.oliveDeep : "#DBD5BC",
        "stroke-width": tick === 0.70 ? 1.2 : 1,
        "stroke-dasharray": tick === 0.70 ? "4 4" : "",
      }));
      svg.append(el("text", {
        x: padL - 8, y: y + 4,
        "text-anchor": "end",
        "font-size": 11,
        "font-family": "DM Mono, monospace",
        fill: PALETTE.inkSoft,
      }, tick.toFixed(2)));
    }

    const barSlot = chartW / pairs.length;
    pairs.forEach((p, i) => {
      const x = padL + i * barSlot + barSlot * 0.16;
      const bw = barSlot * 0.68;
      const y = yOf(p.ratio);
      const bh = padT + chartH - y;
      const isAct = i === activePair;

      svg.append(el("rect", {
        x, y, width: bw, height: bh, rx: 4,
        fill: isAct ? PALETTE.oliveDeep : (p.ratio > 0.71 ? PALETTE.olive : "#909457"),
      }));

      const valLabel = `×${p.ratio.toFixed(2)}`;
      svg.append(el("rect", {
        x: x + bw / 2 - 21, y: y - 20, width: 42, height: 15, rx: 3,
        fill: PALETTE.paperLight,
      }));
      svg.append(el("text", {
        x: x + bw / 2, y: y - 9,
        "text-anchor": "middle",
        "font-size": 11,
        "font-weight": isAct ? "700" : "500",
        "font-family": "DM Mono, monospace",
        fill: isAct ? PALETTE.ink : PALETTE.inkSoft,
      }, valLabel));

      svg.append(el("text", {
        x: x + bw / 2, y: 210 - 12,
        "text-anchor": "middle",
        "font-size": 11,
        "font-family": "DM Mono, monospace",
        fill: isAct ? PALETTE.ink : PALETTE.inkSoft,
      }, `${p.from}→${p.to}`));
    });

    if (showGeo) {
      const y70 = yOf(0.701);
      svg.append(el("line", {
        x1: padL, y1: y70, x2: 560 - padR, y2: y70,
        stroke: PALETTE.err,
        "stroke-width": 2,
      }));
      svg.append(el("rect", {
        x: 560 - padR - 148, y: y70 - 22, width: 146, height: 19, rx: 4,
        fill: PALETTE.err,
      }));
      svg.append(el("text", {
        x: 560 - padR - 75, y: y70 - 9,
        "text-anchor": "middle",
        "font-size": 10.5,
        "font-family": "Noto Sans SC, sans-serif",
        fill: "#FAF6EC",
      }, "严格等比 r ≈ 0.701"));
    }

    const cur = pairs[activePair];
    const diffPct = Math.round(((cur.ratio - 0.701) / 0.701) * 100);
    const tone = cur.ratio > 0.71 ? "略缓（×0.75，缩掉 1/4）" : "略快（×0.67，缩掉 1/3）";
    readout.innerHTML = `<strong>区间 ${cur.from} → ${cur.to}</strong>：实算相邻步比为 <code lang="en">${cur.ratio.toFixed(3)}</code>，步幅${tone}，与 8 级平均几何公比 0.701 相差 ${diffPct >= 0 ? "+" : ""}${diffPct}%。只要步比稳落在 0.66–0.78 区间，观者读到的仍是流畅的一体递减。`;
  }

  render();
}

// ==================== 02 节：三种缩减律双联 2D Canvas ====================
export function initSection02() {
  const canvas = document.getElementById("decay-canvas");
  const tabs = [...document.querySelectorAll(".law-tab")];
  const slider = document.getElementById("decay-dist-range");
  const distVal = document.getElementById("decay-dist-val");
  const verdict = document.getElementById("decay-verdict");
  if (!canvas || !slider || !verdict) return;

  const ctx = canvas.getContext("2d");
  let activeLaw = "geometric";
  let distStrength = 0.55;
  let dirty = true;

  function draw() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = pixelRatio(2);
    const pw = Math.round(rect.width * dpr);
    const ph = Math.round(rect.height * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    const w = rect.width;
    const h = rect.height;
    const compact = w < 480;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    const res = computeDecayComparison(activeLaw, 9, distStrength);
    const items = res.items;

    // 上半区：9 枚柱列实景投影（左近右远）
    const splitY = h * 0.62;
    const baseY = splitY - 16;
    const maxColH = splitY - 38;
    const padX = compact ? 22 : 44;
    const spanX = w - padX * 2;

    // 地面与顶沿收束参考线
    ctx.strokeStyle = PALETTE.oliveLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX - 10, baseY);
    ctx.lineTo(w - padX + 10, baseY);
    ctx.stroke();

    // 画柱顶连线
    ctx.strokeStyle = activeLaw === "linear" ? PALETTE.err : PALETTE.oliveDeep;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    items.forEach((it, i) => {
      const x = padX + it.pos * spanX;
      const colH = Math.max(4, it.scale * maxColH);
      const topY = baseY - colH;
      if (i === 0) ctx.moveTo(x, topY);
      else ctx.lineTo(x, topY);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // 画 9 枚立柱
    items.forEach((it, i) => {
      const x = padX + it.pos * spanX;
      const colH = Math.max(4, it.scale * maxColH);
      const colW = Math.max(3, (compact ? 18 : 28) * it.scale);
      const isCliff = activeLaw === "linear" && i >= 7 && it.scale < 0.22;
      ctx.fillStyle = isCliff ? PALETTE.err : PALETTE.olive;
      ctx.fillRect(x - colW / 2, baseY - colH, colW, colH);
      // 柱顶短帽
      ctx.fillStyle = isCliff ? "#7D1B10" : PALETTE.oliveDeep;
      ctx.fillRect(x - colW * 0.62, baseY - colH - 3, colW * 1.24, 3);

      // 编号
      if (!compact || i % 2 === 0 || i === items.length - 1) {
        ctx.fillStyle = PALETTE.inkSoft;
        ctx.font = `500 10.5px "DM Mono", monospace`;
        ctx.textAlign = "center";
        ctx.fillText(`#${i + 1}`, x, baseY + 13);
      }
    });

    // 下半区：步比剖面（显示每一步相对于前一步保留了多少 %）
    const chartTop = splitY + 18;
    const chartBot = h - 22;
    const chartH = Math.max(30, chartBot - chartTop);
    ctx.fillStyle = PALETTE.paperLight;
    ctx.fillRect(padX - 8, chartTop - 6, spanX + 16, chartH + 14);
    ctx.strokeStyle = PALETTE.oliveLine;
    ctx.strokeRect(padX - 8, chartTop - 6, spanX + 16, chartH + 14);

    ctx.fillStyle = PALETTE.inkSoft;
    ctx.font = `500 11px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText("每步相对缩放比（相邻比越稳，节奏越匀称）", padX, chartTop + 9);

    const stepW = spanX / res.ratios.length;
    res.ratios.forEach((rv, i) => {
      const x = padX + i * stepW + stepW * 0.15;
      const bw = stepW * 0.7;
      const norm = clamp(rv, 0.08, 1);
      const bh = Math.max(3, (chartH - 22) * norm);
      const y = chartBot - bh;
      const bad = rv < 0.5;
      ctx.fillStyle = bad ? PALETTE.err : (activeLaw === "harmonic" ? "#7C8237" : PALETTE.olive);
      ctx.fillRect(x, y, bw, bh);
      if (!compact || i % 2 === 0) {
        ctx.fillStyle = bad ? PALETTE.err : PALETTE.ink;
        ctx.font = `500 10px "DM Mono", monospace`;
        ctx.textAlign = "center";
        ctx.fillText(`${Math.round(rv * 100)}%`, x + bw / 2, Math.max(chartTop + 20, y - 3));
      }
    });

    ctx.restore();

    const firstStep = Math.round(res.ratios[0] * 100);
    const lastStep = Math.round(res.ratios[res.ratios.length - 1] * 100);
    const span = (items[0].scale / items[items.length - 1].scale).toFixed(1);
    if (activeLaw === "linear") {
      verdict.innerHTML = `<strong>等差递减（首尾跨比 ${span}×）</strong>：第 1 步只缩到 ${firstStep}%，看着几乎没变化；可到了最后一步猛跌到 <strong>${lastStep}%</strong>，且中心位置死板等距。结果是「前段平庸、尾段骤断」，最容易显僵硬。`;
    } else if (activeLaw === "geometric") {
      verdict.innerHTML = `<strong>严格等比递减（首尾跨比 ${span}×）</strong>：从头到尾每一步都稳稳保持 <strong>${firstStep}%</strong> 的恒定步比，视觉脉冲最匀称——因此平面海报、阶梯图形与装饰韵律最常选用等比序列。`;
    } else {
      verdict.innerHTML = `<strong>透视调和递减（首尾跨比 ${span}×）</strong>：首步利落收至 ${firstStep}%，越往远端步比反而渐趋平缓（末步 ${lastStep}%），同时位置自然聚拢到远方视平线——这正是真实等距路灯与长廊在眼睛里的光学成像规律。`;
    }
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeLaw = btn.dataset.decay;
      tabs.forEach((t) => {
        const on = t === btn;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-pressed", on ? "true" : "false");
      });
      dirty = true;
      ctrl.draw();
    });
  });

  slider.addEventListener("input", () => {
    distStrength = Number(slider.value) / 100;
    distVal.textContent = `${slider.value}%`;
    dirty = true;
    ctrl.draw();
  });

  const ctrl = loop(canvas, () => {
    if (!dirty) return;
    dirty = false;
    draw();
  });
  window.addEventListener("resize", () => { dirty = true; ctrl.draw(); });
  ctrl.draw();
}

// ==================== 03 节：暗室验光（三独立深度线索拨钮） ====================
export function initSection03() {
  const canvas = document.getElementById("darkroom-canvas");
  const swSpacing = document.getElementById("sw-spacing");
  const swHorizon = document.getElementById("sw-horizon");
  const swAir = document.getElementById("sw-air");
  const gradeEl = document.getElementById("dark-grade");
  const descEl = document.getElementById("dark-desc");
  if (!canvas || !swSpacing || !swHorizon || !swAir) return;

  const ctx = canvas.getContext("2d");
  const cues = { spacing: false, horizon: false, air: false };
  const anim = { spacing: 0, horizon: 0, air: 0 };
  let dirty = true;

  function toggleCue(key, btn, pillId) {
    cues[key] = !cues[key];
    btn.setAttribute("aria-pressed", cues[key] ? "true" : "false");
    const pill = document.getElementById(pillId);
    if (pill) pill.textContent = cues[key] ? "开" : "关";
    updateText();
    dirty = true;
    ctrl.draw();
  }

  function updateText() {
    const n = [cues.spacing, cues.horizon, cues.air].filter(Boolean).length;
    if (n === 0) {
      gradeEl.textContent = "一阶 · 平面珠串";
      descEl.textContent = "三项辅助线索全关：虽然圆越来越小，但中心等距、上下漂浮、明暗一致，人眼更像在看一串贴在黑板上的大小圆片。";
    } else if (n === 1) {
      gradeEl.textContent = "二阶 · 线索初现";
      if (cues.spacing) descEl.textContent = "开启「间距收紧」：远端小圆聚拢成质地梯度，但底脚仍悬空乱飘，空间像失重的气泡。";
      else if (cues.horizon) descEl.textContent = "开启「地平基准」：所有形体落地对准远方视平线，可惜间距仍然等距，后半段显得松散穿帮。";
      else descEl.textContent = "开启「空气微减淡」：远端明度退让拉出前后层次，但几何位置还停在平面等距排列。";
    } else if (n === 2) {
      gradeEl.textContent = "三阶 · 纵深成形";
      if (!cues.air) descEl.textContent = "间距与地平基准同时到位，深邃通道已经立刻弹出！再补上远端空气微减淡，极小远点就不会扎眼抢戏。";
      else if (!cues.horizon) descEl.textContent = "间距和空气退让都很顺，只差一条统一的地平基准把悬空元素稳稳锚到地面上。";
      else descEl.textContent = "地平与空气透视都在工作，把「间距透视收紧」补齐，远端就会瞬间锁进真实纵深。";
    } else {
      gradeEl.textContent = "四阶 · 完整深邃通道";
      descEl.textContent = "尺度递减 × 间距收紧 × 地平收束 × 空气微退让四重咬合：即使暗室里只有极简几何轮廓，大脑也会毫不犹豫地读出深远走廊。";
    }
  }

  swSpacing.addEventListener("click", () => toggleCue("spacing", swSpacing, "sw-spacing-state"));
  swHorizon.addEventListener("click", () => toggleCue("horizon", swHorizon, "sw-horizon-state"));
  swAir.addEventListener("click", () => toggleCue("air", swAir, "sw-air-state"));

  const ctrl = loop(canvas, (_t, dt, { still }) => {
    let moving = false;
    const k = still ? 1 : clamp(dt > 0 ? 1 - Math.exp(-dt * 12) : 1, 0.25, 1);
    for (const key of ["spacing", "horizon", "air"]) {
      const target = cues[key] ? 1 : 0;
      const diff = target - anim[key];
      if (Math.abs(diff) > 0.002) {
        anim[key] += diff * k;
        moving = true;
      } else {
        anim[key] = target;
      }
    }
    if (!dirty && !moving) return;
    dirty = false;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = pixelRatio(2);
    const pw = Math.round(rect.width * dpr);
    const ph = Math.round(rect.height * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    const w = rect.width;
    const h = rect.height;
    const shortS = Math.min(w, h);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 深橄榄暗室底
    ctx.fillStyle = "#14150B";
    ctx.fillRect(0, 0, w, h);

    const horizonY = h * 0.34;
    const vpX = w * 0.86;

    // 视平线与隐约透视地面网格（随 anim.horizon 渐显）
    if (anim.horizon > 0.02) {
      ctx.save();
      ctx.globalAlpha = anim.horizon * 0.55;
      ctx.strokeStyle = PALETTE.darkOlive;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(16, horizonY);
      ctx.lineTo(w - 16, horizonY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 地面引导线
      ctx.strokeStyle = "rgba(240, 220, 158, 0.28)";
      ctx.beginPath();
      ctx.moveTo(w * 0.04, h * 0.92);
      ctx.lineTo(vpX, horizonY);
      ctx.moveTo(w * 0.42, h * 0.92);
      ctx.lineTo(vpX, horizonY);
      ctx.stroke();

      ctx.fillStyle = PALETTE.darkGold;
      ctx.font = `500 11px "DM Mono", monospace`;
      ctx.fillText("HORIZON 视平线", 20, horizonY - 8);
      ctx.restore();
    }

    const n = 8;
    const ratio = 0.74;
    const maxR = shortS * 0.21;

    // 计算等距与透视收紧两种 x 分布
    const evenX = [];
    const perspX = [];
    let acc = 0;
    const weights = [];
    for (let i = 0; i < n - 1; i++) weights.push(Math.pow(ratio, i));
    const sumW = weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < n; i++) {
      const te = i / (n - 1);
      evenX.push(w * 0.14 + te * (w * 0.71));
      const tp = i === 0 ? 0 : acc / sumW;
      perspX.push(w * 0.14 + tp * (w * 0.71));
      if (i < n - 1) acc += weights[i];
    }

    // 由远到近画 8 枚发光门环/实圆
    for (let i = n - 1; i >= 0; i--) {
      const s = Math.pow(ratio, i);
      const r = Math.max(4, maxR * s);
      const x = evenX[i] + (perspX[i] - evenX[i]) * anim.spacing;

      // 关掉地平基准时上下轻飘（平面散摆）；开启时底脚沿地面透视线齐步抬升至视平线
      const flatY = h * 0.54 + Math.sin(i * 1.45) * h * 0.09;
      const groundY = horizonY + (h * 0.87 - horizonY) * s;
      const groundedY = groundY - r;
      const y = flatY + (groundedY - flatY) * anim.horizon;

      // 远端空气微减淡（保持最低可见度，绝不看不清）
      const airAlpha = 1 - anim.air * (i / (n - 1)) * 0.62;

      ctx.save();
      ctx.globalAlpha = airAlpha;

      // 地面柔影（开启地平时出现）
      if (anim.horizon > 0.05) {
        ctx.fillStyle = `rgba(240, 220, 158, ${0.14 * anim.horizon})`;
        ctx.beginPath();
        ctx.ellipse(x, groundY + 2, r * 0.72, Math.max(2, r * 0.16), 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 主圆体
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? PALETTE.darkGold : PALETTE.darkOlive;
      ctx.fill();

      // 细环高光
      ctx.strokeStyle = "rgba(250, 246, 236, 0.35)";
      ctx.lineWidth = Math.max(1, r * 0.05);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  });

  window.addEventListener("resize", () => { dirty = true; ctrl.draw(); });
  updateText();
  ctrl.draw();
}

// ==================== 04 节：斯帕达宫 8.8m ⇄ 37m 强迫透视剖视 ====================
export function initSection04() {
  const svg = document.getElementById("spada-svg");
  const slider = document.getElementById("spada-slider");
  const badge = document.getElementById("spada-badge");
  const caption = document.getElementById("spada-caption");
  if (!svg || !slider || !badge || !caption) return;

  function render() {
    const t = Number(slider.value) / 100; // 0 = 真实侧剖 8.8m，1 = 入口大脑脑补 37m
    svg.innerHTML = "";

    const w = 560;
    const h = 300;
    const startX = 68;
    const endXReal = 310;
    const endXIllusion = 505;
    const endX = endXReal + (endXIllusion - endXReal) * t;

    const floorStartY = 250;
    const ceilStartY = 58;
    // 真实侧剖：地板斜升到 192、顶棚斜降到 112；大脑脑补时以为地板平直、顶棚平直
    const floorEndY = 192 + (floorStartY - 192) * t;
    const ceilEndY = 112 + (ceilStartY - 112) * t;

    // 背景参考标尺线
    svg.append(el("line", { x1: startX, y1: floorStartY + 18, x2: endX, y2: floorStartY + 18, stroke: PALETTE.oliveDeep, "stroke-width": 1.5 }));
    svg.append(el("line", { x1: startX, y1: floorStartY + 12, x2: startX, y2: floorStartY + 24, stroke: PALETTE.oliveDeep, "stroke-width": 1.5 }));
    svg.append(el("line", { x1: endX, y1: floorStartY + 12, x2: endX, y2: floorStartY + 24, stroke: PALETTE.oliveDeep, "stroke-width": 1.5 }));
    const meters = (8.8 + (37 - 8.8) * t).toFixed(1);
    svg.append(el("text", {
      x: (startX + endX) / 2, y: floorStartY + 36,
      "text-anchor": "middle", "font-size": 12.5, "font-family": "DM Mono, monospace", "font-weight": "500",
      fill: PALETTE.ink,
    }, t < 0.5 ? `真实长度 ≈ ${meters} m` : `大脑误判长度 ≈ ${meters} m`));

    // 若处于过渡/脑补态，保留淡虚线标出 8.8m 真实尽头，视觉冲击力极强
    if (t > 0.08) {
      svg.append(el("polygon", {
        points: `${startX},${ceilStartY} ${endXReal},112 ${endXReal},192 ${startX},${floorStartY}`,
        fill: "rgba(168, 46, 30, 0.06)",
        stroke: PALETTE.err,
        "stroke-dasharray": "4 4",
        "stroke-width": 1.2,
      }));
      svg.append(el("text", {
        x: endXReal, y: 102, "text-anchor": "middle", "font-size": 10.5,
        "font-family": "Noto Sans SC, sans-serif", fill: PALETTE.err,
      }, "真实 8.8m 尽头"));
    }

    // 主走廊空间剖面（天花 + 地板）
    svg.append(el("polygon", {
      points: `${startX},${ceilStartY} ${endX},${ceilEndY} ${endX},${floorEndY} ${startX},${floorStartY}`,
      fill: PALETTE.paperLight,
      stroke: PALETTE.oliveDeep,
      "stroke-width": 2,
    }));

    // 入口观者极简无五官侧影（纯头圆 + 几何躯干）
    const obsX = 34;
    const obsBaseY = floorStartY;
    svg.append(el("circle", { cx: obsX, cy: obsBaseY - 62, r: 9, fill: PALETTE.ink }));
    svg.append(el("path", {
      d: `M ${obsX - 10} ${obsBaseY} L ${obsX - 8} ${obsBaseY - 48} Q ${obsX} ${obsBaseY - 52} ${obsX + 8} ${obsBaseY - 48} L ${obsX + 10} ${obsBaseY} Z`,
      fill: PALETTE.ink,
    }));
    // 视线锥虚线
    svg.append(el("line", { x1: obsX + 9, y1: obsBaseY - 62, x2: endX, y2: ceilEndY, stroke: PALETTE.olive, "stroke-dasharray": "3 4", "stroke-width": 1 }));
    svg.append(el("line", { x1: obsX + 9, y1: obsBaseY - 62, x2: endX, y2: floorEndY, stroke: PALETTE.olive, "stroke-dasharray": "3 4", "stroke-width": 1 }));

    // 8 根递减立柱：真实剖面下柱距越来越密、柱子越来越矮；脑补态下被大脑拉成等距等高长廊
    const colCount = 8;
    for (let i = 0; i < colCount; i++) {
      const fReal = 1 - Math.pow(0.76, i);
      const fRealMax = 1 - Math.pow(0.76, colCount - 1);
      const uReal = fReal / fRealMax;
      const uEven = i / (colCount - 1);
      const u = uReal + (uEven - uReal) * t;

      const x = startX + 16 + u * (endX - startX - 58);
      const fracX = (x - startX) / Math.max(1, endX - startX);
      const topY = ceilStartY + (ceilEndY - ceilStartY) * fracX;
      const botY = floorStartY + (floorEndY - floorStartY) * fracX;
      const colW = (13 - i * 0.9) * (1 - t) + 11 * t;

      svg.append(el("rect", {
        x: x - colW / 2, y: topY + 2, width: colW, height: Math.max(16, botY - topY - 4),
        fill: PALETTE.olive, rx: 1,
      }));
    }

    // 尽头武士雕像（无五官纯几何剪影）：真身仅 60cm，在脑补态里放大成看似等身雕像
    const stX = endX - 18;
    const stBot = floorEndY - 2;
    const stH = 26 + 44 * t;
    svg.append(el("rect", { x: stX - 7, y: stBot - 8, width: 14, height: 8, fill: PALETTE.oliveDeep }));
    svg.append(el("path", {
      d: `M ${stX - 5} ${stBot - 8} L ${stX - 4} ${stBot - stH + 10} L ${stX + 4} ${stBot - stH + 10} L ${stX + 5} ${stBot - 8} Z`,
      fill: PALETTE.ink,
    }));
    svg.append(el("circle", { cx: stX, cy: stBot - stH + 5, r: 3.2 + 2.6 * t, fill: PALETTE.ink }));
    const labelX = t < 0.72 ? endX + 12 : stX;
    const labelY = t < 0.72 ? (ceilEndY + floorEndY) / 2 + 4 : ceilEndY - 12;
    svg.append(el("text", {
      x: labelX, y: labelY, "text-anchor": t < 0.72 ? "start" : "middle", "font-size": 11,
      "font-family": "DM Mono, monospace", "font-weight": "500", fill: PALETTE.ink,
    }, t < 0.5 ? "雕像实高 ~60cm" : "错觉 ≈ 真人高"));

    if (t < 0.35) {
      badge.textContent = "实测真身 · 8.8 m";
      caption.textContent = "真实侧剖视图：廊道总长仅约 8.6–8.8 米，入口高约 5.8 米、尽头降到约 2.45 米，柱子越往里越矮越密，末端雕像（几何剪影）高仅约 60 厘米。";
    } else if (t < 0.72) {
      badge.textContent = `透视折算中 · ${meters} m`;
      caption.textContent = "大脑的顽固假设正在起作用：只要看到立柱高度与间距按透视律同步递减，视觉皮层宁可相信「走廊拉长了四倍」，也不愿相信柱子本身被做矮了。";
    } else {
      badge.textContent = "视觉幻觉 · ~37 m";
      caption.textContent = "站在入口所见：大脑把人为造出的尺度递减全部解码为空间深度，8.8 米短廊瞬间延展为约 37 米深邃柱廊，60 厘米小雕像也顺理成章显得像等身石像。";
    }
  }

  slider.addEventListener("input", render);
  render();
}

// ==================== 05 节：什么时候用、什么时候别用（4 场景翻签预览板） ====================
export function initSection05() {
  const tabs = [...document.querySelectorAll(".case-tab")];
  const svg = document.getElementById("case-svg");
  const copy = document.getElementById("case-copy");
  if (!tabs.length || !svg || !copy) return;

  const CASES = {
    poster: {
      title: "宜用 · 极简展讯与品牌海报：用几枚图形直指核心日期",
      p1: "海报里文字不多、需要一眼抓住注意力并把视线送到关键日期或主标题时，尺度递减最省笔墨。首枚大形体负责远处揽客，渐小序列充当隐形箭头，视线落地处正好放核心文案。",
      p2: "注意把最大尺寸留给视觉入口，最小处紧邻核心字标或留白出口，避免文字自己跟着一路缩到看不清。",
      draw(s) {
        s.append(el("rect", { x: 18, y: 16, width: 504, height: 248, rx: 8, fill: PALETTE.paper, stroke: PALETTE.oliveLine }));
        const pts = [
          [74, 224, 58], [164, 184, 42], [238, 152, 30], [298, 126, 21],
          [344, 106, 14], [380, 91, 9.5], [408, 79, 6.5],
        ];
        pts.forEach(([cx, cy, r]) => s.append(el("circle", { cx, cy, r, fill: PALETTE.olive })));
        s.append(el("line", { x1: 210, y1: 196, x2: 432, y2: 96, stroke: PALETTE.oliveDeep, "stroke-dasharray": "5 4", "stroke-width": 1.5 }));
        s.append(el("rect", { x: 356, y: 146, width: 142, height: 84, rx: 6, fill: PALETTE.yellowCard }));
        s.append(el("text", { x: 372, y: 174, "font-size": 14, "font-weight": "700", fill: PALETTE.ink }, "秋季建筑展"));
        s.append(el("text", { x: 372, y: 196, "font-size": 11.5, "font-family": "DM Mono, monospace", fill: PALETTE.oliveText }, "10.18 — 11.30"));
        s.append(el("text", { x: 372, y: 216, "font-size": 11, fill: PALETTE.inkSoft }, "视线顺圆列自然落焦"));
      },
    },
    photo: {
      title: "宜用 · 行道、拱廊与队列摄影：顺应天然重复立面",
      p1: "桥墩、路灯、鸟居、柱廊、行道树本来就是物理尺寸相同的重复单元。只要站位略微贴近第一根柱子并把机身压低，近大远小的递减序列就会自动生成，不需要多余道具。",
      p2: "构图时记得把最近一根作为前景压边，同时给远端收束处留出透气天光，避免队列一头撞死在画面边缘。",
      draw(s) {
        s.append(el("rect", { x: 18, y: 16, width: 504, height: 248, rx: 8, fill: "#EFE8D5", stroke: PALETTE.oliveLine }));
        // 天际与斜道
        s.append(el("polygon", { points: "18,264 522,264 415,120 355,120", fill: PALETTE.cardKhaki }));
        // 成对行道拱门递减
        const pairs = [
          [78, 250, 175, 22], [160, 224, 126, 16], [225, 202, 92, 12],
          [276, 184, 67, 9], [316, 170, 48, 6.5], [346, 159, 34, 4.8], [369, 150, 23, 3.5],
        ];
        pairs.forEach(([x, bot, h, w]) => {
          s.append(el("rect", { x, y: bot - h, width: w, height: h, fill: PALETTE.olive }));
          s.append(el("rect", { x: x - w * 0.2, y: bot - h - w * 0.35, width: w * 1.4, height: w * 0.35, fill: PALETTE.oliveDeep }));
        });
        s.append(el("circle", { cx: 400, cy: 132, r: 10, fill: PALETTE.yellowCard }));
        s.append(el("text", { x: 36, y: 44, "font-size": 12, "font-weight": "700", fill: PALETTE.ok }, "天然同类单元 · 纵深毫不费力"));
      },
    },
    catalog: {
      title: "别用 · 平权商品货架与多方案价格表：尺寸会偷偷偏心",
      p1: "尺度递减自带强烈的「大＝重要、小＝次要」心理暗示。如果你要公平展示四个同价位产品、或呈现客观柱状数据对比，套用尺度递减会让排在第 3、4 位的商品缩成小角落，观者潜意识就会把它判成低配款。",
      p2: "需要并列比较、平权浏览的内容，请直接采用等宽网格、卡片对齐或标准柱图，不要强加纵深缩尺。",
      draw(s) {
        s.append(el("rect", { x: 18, y: 16, width: 504, height: 248, rx: 8, fill: PALETTE.paperLight, stroke: PALETTE.err }));
        // 错误示范：四个同级套餐被强行递减
        const cards = [
          { x: 38, y: 66, w: 148, h: 168, name: "方案 1", price: "¥199" },
          { x: 204, y: 102, w: 108, h: 132, name: "方案 2", price: "¥199" },
          { x: 328, y: 136, w: 78, h: 98, name: "方案 3", price: "¥199" },
          { x: 422, y: 164, w: 56, h: 70, name: "方案 4", price: "¥199" },
        ];
        cards.forEach((c, idx) => {
          s.append(el("rect", { x: c.x, y: c.y, width: c.w, height: c.h, rx: 6, fill: idx === 0 ? PALETTE.cardKhaki : PALETTE.paper, stroke: idx >= 2 ? PALETTE.err : PALETTE.oliveLine, "stroke-width": idx >= 2 ? 1.5 : 1 }));
          s.append(el("text", { x: c.x + 10, y: c.y + 22, "font-size": Math.max(10.5, 13 - idx), "font-weight": "700", fill: PALETTE.ink }, c.name));
          s.append(el("text", { x: c.x + 10, y: c.y + 42, "font-size": Math.max(10.5, 12.5 - idx * 0.7), "font-family": "DM Mono, monospace", fill: PALETTE.oliveText }, c.price));
        });
        s.append(el("text", { x: 38, y: 44, "font-size": 12, "font-weight": "700", fill: PALETTE.err }, "误用后果：同价位平权商品被尺度暗示成「三六九等」"));
      },
    },
    blueprint: {
      title: "换法 · 工程零件图与建筑度量图解：改用等距或轴测投影",
      p1: "机械装配、游戏地编地图、家具尺寸说明要求「前方 10 厘米与后方 10 厘米在纸面上量起来一样长」。尺度递减一旦介入，远端构件就会被透视压短，图纸直接失去度量价值。",
      p2: "遇到必须保真比例的立体表达，请转去同小类的 073 平行透视、075 等距构图或 076 轴测构图——平行边永不汇聚，立体与精准尺度兼得。",
      draw(s) {
        s.append(el("rect", { x: 18, y: 16, width: 504, height: 248, rx: 8, fill: PALETTE.paperLight, stroke: PALETTE.oliveLine }));
        // 左：透视递减失真
        s.append(el("text", { x: 40, y: 46, "font-size": 12, "font-weight": "700", fill: PALETTE.err }, "[误] 尺度递减：远端边长失真"));
        s.append(el("polygon", { points: "54,84 136,118 136,204 54,234", fill: PALETTE.errSoft, stroke: PALETTE.err, "stroke-width": 1.6 }));
        s.append(el("polygon", { points: "136,118 220,136 220,186 136,204", fill: PALETTE.paper, stroke: PALETTE.err, "stroke-width": 1.6 }));
        s.append(el("text", { x: 76, y: 248, "font-size": 11, "font-family": "DM Mono, monospace", fill: PALETTE.err }, "近 150px ≠ 远 50px"));

        // 右：等距/轴测保真
        s.append(el("text", { x: 292, y: 46, "font-size": 12, "font-weight": "700", fill: PALETTE.ok }, "[宜] 换用等距/轴测：前后等长可量"));
        s.append(el("polygon", { points: "306,116 392,78 478,116 392,154", fill: PALETTE.yellowCard, stroke: PALETTE.oliveDeep, "stroke-width": 1.6 }));
        s.append(el("polygon", { points: "306,116 392,154 392,226 306,188", fill: PALETTE.cardKhaki, stroke: PALETTE.oliveDeep, "stroke-width": 1.6 }));
        s.append(el("polygon", { points: "392,154 478,116 478,188 392,226", fill: PALETTE.olive, stroke: PALETTE.oliveDeep, "stroke-width": 1.6 }));
        s.append(el("text", { x: 316, y: 248, "font-size": 11, "font-family": "DM Mono, monospace", fill: PALETTE.ok }, "近边 72px = 远边 72px"));
      },
    },
  };

  function select(id) {
    const item = CASES[id] || CASES.poster;
    tabs.forEach((b) => {
      const on = b.dataset.case === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    svg.innerHTML = "";
    item.draw(svg);
    copy.innerHTML = `<h3>${item.title}</h3><p>${item.p1}</p><p>${item.p2}</p>`;
  }

  tabs.forEach((b) => b.addEventListener("click", () => select(b.dataset.case)));
  select("poster");
}

// ==================== 06 节：单变量辨序练习（4 稿只差单一变量，中性标签） ====================
export function initSection06() {
  const grid = document.getElementById("quiz-grid");
  const fb = document.getElementById("quiz-feedback");
  const fbTitle = document.getElementById("qf-title");
  const fbBody = document.getElementById("qf-body");
  const retryBtn = document.getElementById("btn-quiz-retry");
  if (!grid || !fb || !fbTitle || !fbBody) return;

  // 4 稿「海岸灯塔石墩」：完全相同的画幅、配色、对角线走向、首墩位置与远方灯塔，仅差 1 个尺度/间距变量
  const OPTIONS = [
    {
      id: "A",
      label: "方案 A",
      correct: false,
      revealNote: "间距未收紧",
      reason: "方案 A 的 6 根石墩高度确实按 0.72 等比缩小了，但中心间距死板等距——后半段小石墩之间反而露出大片空隙，违背透视近疏远密规律，纵深显得松散。",
      pillars: [
        { t: 0.0, s: 1.0 },
        { t: 0.2, s: 0.72 },
        { t: 0.4, s: 0.52 },
        { t: 0.6, s: 0.37 },
        { t: 0.8, s: 0.27 },
        { t: 1.0, s: 0.19 },
      ],
      issueType: "even-gap",
    },
    {
      id: "B",
      label: "方案 B",
      correct: false,
      revealNote: "第 4 墩反弹",
      reason: "方案 B 的间距按透视同步收紧，可惜第 4 根石墩突然比第 3 根反弹增高了 28%，打破了单调递减的心理预期，视线走到中段立刻被拉回近景。",
      pillars: [
        { t: 0.0, s: 1.0 },
        { t: 0.30, s: 0.74 },
        { t: 0.53, s: 0.54 },
        { t: 0.71, s: 0.69, bad: true },
        { t: 0.87, s: 0.30 },
        { t: 1.0, s: 0.21 },
      ],
      issueType: "reversal",
    },
    {
      id: "C",
      label: "方案 C",
      correct: true,
      revealNote: "秩序完整",
      reason: "方案 C 唯一同时守住四条底线：首墩稳压左下入口，6 根石墩按约 0.74 步比严格单调递减、零反弹，同时相邻中心距同步收紧，视线顺畅滑向远方灯塔。",
      pillars: [
        { t: 0.0, s: 1.0 },
        { t: 0.30, s: 0.74 },
        { t: 0.53, s: 0.55 },
        { t: 0.71, s: 0.40 },
        { t: 0.87, s: 0.30 },
        { t: 1.0, s: 0.22 },
      ],
      issueType: "ok",
    },
    {
      id: "D",
      label: "方案 D",
      correct: false,
      revealNote: "跨比过扁",
      reason: "方案 D 虽然间距收紧了，但相邻衰减比被压平到 0.93（首尾几乎一样高），6 根石墩像一排高低相近的平面栅栏，无法唤起深远的空间层次。",
      pillars: [
        { t: 0.0, s: 1.0 },
        { t: 0.30, s: 0.93 },
        { t: 0.53, s: 0.86 },
        { t: 0.71, s: 0.80 },
        { t: 0.87, s: 0.75 },
        { t: 1.0, s: 0.70 },
      ],
      issueType: "flat",
    },
  ];

  let pickedId = null;

  function drawOptionSvg(opt, revealed) {
    const svg = el("svg", { viewBox: "0 0 240 190", "aria-hidden": "true" });
    // 海平线与淡卡其海面
    svg.append(el("rect", { x: 0, y: 0, width: 240, height: 190, fill: PALETTE.paper }));
    svg.append(el("rect", { x: 0, y: 66, width: 240, height: 124, fill: "#EBE5CF" }));
    svg.append(el("line", { x1: 0, y1: 66, x2: 240, y2: 66, stroke: PALETTE.oliveLine, "stroke-width": 1 }));

    // 远方灯塔锚点（四稿完全一致）
    const lhX = 208;
    const lhBase = 66;
    svg.append(el("polygon", { points: `${lhX - 5},${lhBase} ${lhX - 3},${lhBase - 24} ${lhX + 3},${lhBase - 24} ${lhX + 5},${lhBase}`, fill: PALETTE.oliveDeep }));
    svg.append(el("circle", { cx: lhX, cy: lhBase - 26, r: 3.2, fill: PALETTE.yellowCard }));

    // 6 根石墩沿左下 → 右上对角路径伸向灯塔（底脚稳贴海岸透视线，四稿仅差单一尺度/间距变量）
    const x0 = 26, y0 = 184;
    const x1 = 178, y1 = 94;
    const maxH = 82;
    const maxW = 22;

    const coords = opt.pillars.map((p) => {
      const cx = x0 + (x1 - x0) * p.t;
      const by = y0 + (y1 - y0) * p.t;
      const ph = maxH * p.s;
      const pw = Math.max(4, maxW * p.s);
      return { cx, by, ph, pw, bad: !!p.bad, s: p.s };
    });

    // 若已作答，叠出包络参考线与错点标注
    if (revealed) {
      const topLine = coords.map((c) => `${c.cx.toFixed(1)},${(c.by - c.ph).toFixed(1)}`).join(" ");
      svg.append(el("polyline", {
        points: topLine,
        fill: "none",
        stroke: opt.correct ? PALETTE.ok : PALETTE.err,
        "stroke-width": 1.5,
        "stroke-dasharray": "4 3",
      }));
    }

    for (let i = coords.length - 1; i >= 0; i--) {
      const c = coords[i];
      const highlightBad = revealed && c.bad;
      svg.append(el("rect", {
        x: c.cx - c.pw / 2,
        y: c.by - c.ph,
        width: c.pw,
        height: c.ph,
        rx: 2,
        fill: highlightBad ? PALETTE.err : PALETTE.olive,
      }));
      svg.append(el("rect", {
        x: c.cx - c.pw * 0.58,
        y: c.by - c.ph - 2,
        width: c.pw * 1.16,
        height: 2.5,
        fill: highlightBad ? "#7A1B10" : PALETTE.oliveDeep,
      }));
    }

    // 若已作答且是等距错态，在后段画出红色等距标尺
    if (revealed && opt.issueType === "even-gap") {
      for (let i = 3; i < coords.length - 1; i++) {
        svg.append(el("line", {
          x1: coords[i].cx, y1: coords[i].by + 8, x2: coords[i + 1].cx, y2: coords[i + 1].by + 8,
          stroke: PALETTE.err, "stroke-width": 2,
        }));
      }
    }

    return svg;
  }

  function render() {
    grid.innerHTML = "";
    const revealed = pickedId !== null;
    OPTIONS.forEach((opt) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "quiz-card";
      card.dataset.quiz = opt.id;
      if (revealed) {
        if (pickedId === opt.id) card.classList.add(opt.correct ? "is-picked-ok" : "is-picked-err");
        else if (opt.correct) card.classList.add("is-reveal-ok");
      }
      card.append(drawOptionSvg(opt, revealed));
      const foot = document.createElement("div");
      foot.className = "quiz-card-foot";
      foot.innerHTML = `<span class="quiz-opt-label">${opt.label}</span><span class="quiz-opt-note">${revealed ? opt.revealNote : "点击选择"}</span>`;
      card.append(foot);

      card.addEventListener("click", () => {
        pickedId = opt.id;
        render();
        fb.hidden = false;
        fb.classList.toggle("is-ok", opt.correct);
        fb.classList.toggle("is-err", !opt.correct);
        fbTitle.textContent = opt.correct
          ? `判断正确：${opt.label} 的尺度递减与间距收紧最完整`
          : `再看一眼：你选了 ${opt.label}（${opt.revealNote}），正解是方案 C`;
        fbBody.textContent = opt.correct
          ? `${opt.reason} 对照其余三稿：A 违背了透视间距收紧，B 在第 4 墩出现中段反弹，D 的首尾跨比压得过扁。`
          : `${opt.reason} 对比方案 C：它同时保持约 0.74 单调步比与同步收紧的间距，纵深一步到位。`;
      });
      grid.append(card);
    });
  }

  retryBtn?.addEventListener("click", () => {
    pickedId = null;
    fb.hidden = true;
    render();
  });

  render();
}

// ==================== 07 节：原海报看图灯箱（缩放、拖拽、Esc 关闭） ====================
export function initLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const vp = document.getElementById("lb-viewport");
  const zoomVal = document.getElementById("lb-zoom-val");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");
  if (!poster || !openBtn || !lb || !lbImg || !vp) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomVal.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    // 海报只引用一次：直接从主 img 读取 src
    if (!lbImg.src) lbImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => { scale = clamp(scale + 0.35, 0.6, 3.2); applyTransform(); });
  btnOut.addEventListener("click", () => { scale = clamp(scale - 0.35, 0.6, 3.2); applyTransform(); });
  btnReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  vp.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.18 : -0.18), 0.6, 3.2);
    applyTransform();
  }, { passive: false });

  vp.addEventListener("pointerdown", (e) => {
    drag = { id: e.pointerId, x: e.clientX - tx, y: e.clientY - ty };
    vp.classList.add("is-dragging");
    try { vp.setPointerCapture(e.pointerId); } catch {}
  });
  vp.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    tx = e.clientX - drag.x;
    ty = e.clientY - drag.y;
    applyTransform();
  });
  const endDrag = () => { drag = null; vp.classList.remove("is-dragging"); };
  vp.addEventListener("pointerup", endDrag);
  vp.addEventListener("pointercancel", endDrag);

  document.addEventListener("keydown", (e) => {
    if (!lb.hidden && e.key === "Escape") {
      e.preventDefault();
      close();
    }
  });
}

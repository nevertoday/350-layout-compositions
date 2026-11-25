// 042 金字塔构图 · 正文 01–07 节专属交互实验模块
// 严格遵循：相邻两节不用同一种控件做同一件事；人物只画简洁无五官剪影；所有读数由几何实时算出。

import { loop, pixelRatio } from "../../lib/stage.js";
import { clamp } from "./model.js";

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(260, Math.round(rect.width));
  const h = Math.max(180, Math.round(rect.height));
  const dpr = pixelRatio(2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/* =====================================================================
 * 01 节：金字塔不止是三角 —— 阶梯级数解剖滑杆 (1 级平面三角 → 6 级过碎)
 * ===================================================================== */
export function setupTierCountLab() {
  const canvas = document.getElementById("sec01-canvas");
  const slider = document.getElementById("sec01-slider");
  const countVal = document.getElementById("sec01-count");
  const verdictEl = document.getElementById("sec01-verdict");
  const metricsEl = document.getElementById("sec01-metrics");
  if (!canvas || !slider) return;

  const TIER_RAMP = ["#B37612", "#C08935", "#B68B55", "#9B5F3E", "#82362B", "#501215"];
  const TIER_SIDE = ["#784A08", "#8B5E1E", "#845E32", "#6E3F27", "#5B261C", "#3A0F10"];

  const LABELS_BY_N = {
    1: ["整体平面三角"],
    2: ["顶峰主体", "底部基座"],
    3: ["核心观点", "中层展开", "事实基础"],
    4: ["顶点 / 重点", "次要层", "支撑层", "基础层"],
    5: ["顶点", "二级", "三级", "四级", "基础层"],
    6: ["尖顶", "二层", "三层", "四层", "五层", "基础层"],
  };

  const NOTES = {
    1: {
      tag: "平面三角 · 0 级分层",
      title: "只有外框稳固，内部没有自下而上的级次",
      body: "1 级整块本质上是平面三角构图：它靠三条斜边立稳，但画面里没有「谁托谁、先看谁」的阶梯先后，适合单一风景峰影或群像外框。",
    },
    2: {
      tag: "两级对立 · 过渡偏急",
      title: "主次分明，但从宽底直接跳到窄顶少了一级缓冲",
      body: "只有底座与顶峰两层时，视觉反差很强、一眼能懂；可一旦信息稍多，没有中间承上启下的过渡带，容易显得生硬。",
    },
    3: {
      tag: "三段经典 · 高效好记",
      title: "基座—中层—顶点三阶平衡，海报与幻灯片的黄金档",
      body: "三层正好满足「起承转合」的最小层级单元，每层都有足够面积放文字与图形，视扫一遍只需两拍就能锁住顶峰。",
    },
    4: {
      tag: "四级完备 · 原海报范式",
      title: "基础→支撑→次要→顶点，兼顾信息容量与明暗阶梯",
      body: "042 原海报采用的四级结构：既能分出语境、细节、说明与核心四个维度，顶层仍保有清晰的图标与短句落位空间。",
    },
    5: {
      tag: "五级临界 · 顶层趋紧",
      title: "阶数接近可读上限，最顶层开始装不下完整副标",
      body: "切到五层后，顶峰截面积急剧缩小到总面积的 4% 左右，排字必须极度克制，更适合纯色块或大尺寸展板。",
    },
    6: {
      tag: "六级过碎 · 阶梯变横纹",
      title: "横切线太密导致视觉震颤，塔尖细到无法承载文字",
      body: "同一轮廓里硬塞进六级台阶时，最顶层面积不到整体的 3%，且五条密集横缝把攀升视线反复割断，信息反而退化成清单。",
    },
  };

  let levels = Number(slider.value) || 4;

  function draw() {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    const padX = Math.max(26, w * 0.08);
    const padT = 30;
    const padB = 34;
    const triH = h - padT - padB;
    const baseW = Math.min(w - padX * 2 - 28, triH * 1.48);
    const cx = w * 0.47;
    const topY = padT;
    const botY = padT + triH;
    const dX = Math.min(34, baseW * 0.085);

    // 外框虚线参考三角（证明 1–6 级共享同一个外轮廓，差的是内部切层！）
    ctx.save();
    ctx.strokeStyle = "rgba(80, 18, 21, 0.22)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, topY - 8);
    ctx.lineTo(cx - baseW * 0.5 - 6, botY);
    ctx.lineTo(cx + baseW * 0.5 + 6, botY);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 按当前 levels 切成 N 级 3D 石阶
    const gap = levels === 1 ? 0 : levels >= 5 ? 3 : 4;
    const stepH = (triH - gap * (levels - 1)) / levels;
    const labels = LABELS_BY_N[levels];

    let totalArea = 0;
    let topArea = 0;
    const parts = [];
    for (let i = 0; i < levels; i++) {
      const y0 = topY + i * (stepH + gap);
      const y1 = y0 + stepH;
      const frac0 = levels === 1 ? 0 : Math.max(0.06, (y0 - topY) / triH);
      const frac1 = (y1 - topY) / triH;
      const w0 = baseW * frac0;
      const w1 = baseW * frac1;
      const area = ((w0 + w1) * 0.5) * stepH;
      totalArea += area;
      if (i === 0) topArea = area;
      parts.push({ i, y0, y1, w0, w1 });
    }

    for (let i = levels - 1; i >= 0; i--) {
      const p = parts[i];
      const rampIdx = levels === 1 ? 5 : Math.round((i / (levels - 1)) * 5);
      const front = TIER_RAMP[rampIdx];
      const side = TIER_SIDE[rampIdx];
      const xTL = cx - p.w0 * 0.5;
      const xTR = cx + p.w0 * 0.5;
      const xBL = cx - p.w1 * 0.5;
      const xBR = cx + p.w1 * 0.5;
      const dx = dX * (0.55 + (i / Math.max(1, levels)) * 0.5);

      // 3D 右侧面
      ctx.fillStyle = side;
      ctx.beginPath();
      ctx.moveTo(xTR, p.y0);
      ctx.lineTo(xTR + dx, p.y0 - 4);
      ctx.lineTo(xBR + dx, p.y1 - 4);
      ctx.lineTo(xBR, p.y1);
      ctx.closePath();
      ctx.fill();

      // 正面
      ctx.fillStyle = front;
      ctx.beginPath();
      ctx.moveTo(xTL, p.y0);
      ctx.lineTo(xTR, p.y0);
      ctx.lineTo(xBR, p.y1);
      ctx.lineTo(xBL, p.y1);
      ctx.closePath();
      ctx.fill();

      // 阶梯文字
      const midW = (p.w0 + p.w1) * 0.5;
      if (stepH >= 20 && midW >= 28) {
        const label = midW < 64 && i === 0 && levels === 4 ? "顶点" : labels[i];
        ctx.fillStyle = "#FFF8EC";
        ctx.font = `600 ${Math.min(13, Math.max(10, stepH * 0.30))}px "Noto Serif SC", serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, cx, (p.y0 + p.y1) * 0.5, Math.max(26, midW - 6));
      }
    }

    // 标尺注释
    ctx.fillStyle = "#633D36";
    ctx.font = `600 11px "IBM Plex Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`SAME OUTER SILHOUETTE · ${levels} TIER${levels > 1 ? "S" : ""}`, cx, botY + 20);

    // 同步读数（从当帧真实切块面积单真源算出）
    const topPct = Math.round((topArea / Math.max(1, totalArea)) * 100);
    const note = NOTES[levels];
    if (countVal) countVal.textContent = `${levels} 级`;
    if (verdictEl) {
      verdictEl.innerHTML = `<span class="lab-badge ${levels === 3 || levels === 4 ? "is-good" : levels >= 6 || levels === 1 ? "is-warn" : ""}">${note.tag}</span><strong>${note.title}</strong><p>${note.body}</p>`;
    }
    if (metricsEl) {
      const readHint = levels === 1 ? "无分层" : levels <= 4 ? "易扫读（示意）" : "顶层过窄（示意）";
      metricsEl.innerHTML = `
        <div><span>当前切分层数</span><strong>${levels} 级</strong></div>
        <div><span>顶层实测面积占比</span><strong>${topPct}%</strong></div>
        <div><span>文字承载余量</span><strong>${readHint}</strong></div>
      `;
    }
  }

  slider.addEventListener("input", () => {
    levels = Number(slider.value);
    draw();
  });

  document.querySelectorAll("[data-sec01-set]").forEach((btn) => {
    btn.addEventListener("click", () => {
      levels = Number(btn.dataset.sec01Set);
      slider.value = String(levels);
      draw();
    });
  });

  const ro = new ResizeObserver(draw);
  ro.observe(canvas);
  draw();
}

/* =====================================================================
 * 02 节：底重顶轻的重力法则 —— 色值 × 体量物理杠杆天平
 * ===================================================================== */
export function setupGravityLab() {
  const canvas = document.getElementById("sec02-canvas");
  const noteEl = document.getElementById("sec02-note");
  if (!canvas) return;

  const BASE_OPTS = {
    maroon: { label: "深绛暗基", fill: "#501215", side: "#3A0F10", dark: 0.96 },
    terracotta: { label: "陶红中基", fill: "#82362B", side: "#5B261C", dark: 0.68 },
    pale: { label: "浅砂轻基", fill: "#DEC7A4", side: "#BCA27E", dark: 0.22 },
  };
  const APEX_OPTS = {
    goldSmall: { label: "炽金小尖（原海报）", fill: "#BF8116", side: "#84550A", dark: 0.30, areaScale: 0.22, chroma: 0.28 },
    goldHuge: { label: "炽金巨块（面积超载）", fill: "#BF8116", side: "#84550A", dark: 0.30, areaScale: 0.62, chroma: 0.36 },
    darkTop: { label: "深绛压顶（明暗倒置）", fill: "#461113", side: "#2B090A", dark: 0.96, areaScale: 0.38, chroma: 0.08 },
  };

  let baseKey = "maroon";
  let apexKey = "goldSmall";
  let beamAngle = 0;

  function computePhysics() {
    const b = BASE_OPTS[baseKey];
    const a = APEX_OPTS[apexKey];
    // 真实视觉重量模型（阿恩海姆：面积 × 明度深重 + 高饱和焦点拉力）
    const baseMass = 0.72 * (0.35 + 0.95 * b.dark);
    const apexMass = a.areaScale * (0.35 + 0.95 * a.dark + a.chroma);
    const cogPct = Math.round(((baseMass * 22 + apexMass * 82) / (baseMass + apexMass)) * 100) / 100;
    const ratio = +(baseMass / Math.max(0.05, apexMass)).toFixed(2);
    const targetTilt = clamp((apexMass - baseMass * 0.55) * 0.38, -0.26, 0.28);
    return { b, a, baseMass, apexMass, cogPct: Math.round(cogPct), ratio, targetTilt };
  }

  function updateText(p) {
    if (!noteEl) return;
    let badge = "稳固且亮眼";
    let cls = "is-good";
    let heading = "";
    let desc = "";

    if (baseKey === "maroon" && apexKey === "goldSmall") {
      heading = "宽暗基座稳稳托住，小面积亮金既不压顶又能一把抓眼";
      desc = `底/顶视觉重量比 ${p.ratio}×，视觉重心稳落 ${p.cogPct}%。这正是原海报高明之处：顶点不需要画成淡灰，只要体量收小，高饱和金色照样「轻而亮」。`;
    } else if (apexKey === "darkTop" || p.cogPct >= 48) {
      badge = "头重脚轻";
      cls = "is-warn";
      heading = `视觉重心被拉升到 ${p.cogPct}%，画面上方沉坠发紧`;
      desc = `底/顶视觉重量比跌到 ${p.ratio}×。${baseKey === "pale" ? "底层色太浅撑不住重量，" : ""}${apexKey === "darkTop" ? "深重墨块悬在顶端像巨石压顶，" : "上方亮色体量过大抢走了底座分量，"}观者产生明显倾覆不安。`;
    } else {
      badge = "尚可但偏平";
      cls = "";
      heading = `视觉重心 ${p.cogPct}%，明暗反差略弱导致上下拉开不够`;
      desc = `底/顶视觉重量比 ${p.ratio}×。底座加深或顶层再收紧一档，就能把「稳」和「亮」同时拉满。`;
    }
    noteEl.innerHTML = `<span class="lab-badge ${cls}">${badge}</span><strong>${heading}</strong><p>${desc}</p><div class="sec02-stats"><span>底 / 顶视觉重量比（示意）：<b>${p.ratio}×</b></span><span>综合视觉重心高度：<b>${p.cogPct}%</b></span></div>`;
  }

  function render(t, dt, { still }) {
    const { ctx, w, h } = fitCanvas(canvas);
    const p = computePhysics();
    beamAngle = still ? p.targetTilt : beamAngle + (p.targetTilt - beamAngle) * Math.min(1, (dt || 0.016) * 8);

    ctx.clearRect(0, 0, w, h);
    const splitX = w * 0.48;

    // 左半：四层实景预览
    const pyrCX = splitX * 0.5;
    const baseY = h - 34;
    const totalH = h - 76;
    const maxW = Math.min(splitX - 38, 220);
    const topScale = apexKey === "goldHuge" ? 0.58 : apexKey === "darkTop" ? 0.44 : 0.28;
    const wArr = [topScale, 0.52, 0.74, 0.96];
    const fillArr = [p.a.fill, "#B68B55", "#8E4B3B", p.b.fill];
    const sideArr = [p.a.side, "#845E32", "#643326", p.b.side];
    const th = totalH / 4;

    for (let i = 3; i >= 0; i--) {
      const y0 = baseY - (4 - i) * th;
      const y1 = y0 + th - 2;
      const bw = wArr[i] * maxW;
      const tw = bw * (i === 0 ? 0.74 : 0.88);
      ctx.fillStyle = sideArr[i];
      ctx.beginPath();
      ctx.moveTo(pyrCX + tw * 0.5, y0);
      ctx.lineTo(pyrCX + tw * 0.5 + 14, y0 - 3);
      ctx.lineTo(pyrCX + bw * 0.5 + 14, y1 - 3);
      ctx.lineTo(pyrCX + bw * 0.5, y1);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = fillArr[i];
      ctx.beginPath();
      ctx.moveTo(pyrCX - tw * 0.5, y0);
      ctx.lineTo(pyrCX + tw * 0.5, y0);
      ctx.lineTo(pyrCX + bw * 0.5, y1);
      ctx.lineTo(pyrCX - bw * 0.5, y1);
      ctx.closePath();
      ctx.fill();
    }

    // 重心水平虚线与红/绿圆点
    const cogY = baseY - (p.cogPct / 100) * totalH;
    const ok = p.cogPct <= 43;
    ctx.strokeStyle = ok ? "#1E6B47" : "#B32118";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(pyrCX - maxW * 0.52, cogY);
    ctx.lineTo(pyrCX + maxW * 0.52 + 12, cogY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = ok ? "#1E6B47" : "#B32118";
    ctx.beginPath();
    ctx.arc(pyrCX, cogY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#461214";
    ctx.font = `600 11px "IBM Plex Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`VISUAL CoG ${p.cogPct}%`, pyrCX, h - 12);

    // 右半：物理黄铜杠杆天平（左盘：底层视觉重量；右盘：顶层视觉重量）
    const scaleCX = splitX + (w - splitX) * 0.52;
    const pivotY = h * 0.56;
    const arm = Math.min((w - splitX) * 0.36, 118);

    // 支座三角
    ctx.fillStyle = "#501215";
    ctx.beginPath();
    ctx.moveTo(scaleCX, pivotY);
    ctx.lineTo(scaleCX - 18, baseY);
    ctx.lineTo(scaleCX + 18, baseY);
    ctx.closePath();
    ctx.fill();

    const lx = scaleCX - Math.cos(beamAngle) * arm;
    const ly = pivotY - Math.sin(beamAngle) * arm;
    const rx = scaleCX + Math.cos(beamAngle) * arm;
    const ry = pivotY + Math.sin(beamAngle) * arm;

    ctx.strokeStyle = "#824E06";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(rx, ry);
    ctx.stroke();

    // 左托盘（底座重量）与右托盘（顶峰重量）
    const drawPan = (px, py, mass, fill, label) => {
      const sz = clamp(18 + mass * 34, 18, 46);
      ctx.strokeStyle = "rgba(80,18,21,0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py + 24);
      ctx.stroke();
      ctx.fillStyle = fill;
      ctx.fillRect(px - sz * 0.5, py + 24 - sz * 0.65, sz, sz * 0.65);
      ctx.strokeStyle = "#3B0C09";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - 28, py + 24);
      ctx.lineTo(px + 28, py + 24);
      ctx.stroke();
      ctx.fillStyle = "#2E0B0A";
      ctx.font = `600 11px "Noto Serif SC", serif`;
      ctx.textAlign = "center";
      ctx.fillText(label, px, py + 42);
    };

    drawPan(lx, ly, p.baseMass, p.b.fill, "底部重量");
    drawPan(rx, ry, p.apexMass, p.a.fill, "顶部重量");

    ctx.fillStyle = "#633D36";
    ctx.font = `600 11px "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    ctx.fillText("视觉重力天平（低端更稳）", scaleCX, 22);
  }

  const ctrl = loop(canvas, render);

  function syncButtons() {
    document.querySelectorAll("[data-sec02-base]").forEach((b) => {
      const on = b.dataset.sec02Base === baseKey;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    document.querySelectorAll("[data-sec02-apex]").forEach((b) => {
      const on = b.dataset.sec02Apex === apexKey;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    updateText(computePhysics());
    ctrl.draw();
  }

  document.querySelectorAll("[data-sec02-base]").forEach((b) => {
    b.addEventListener("click", () => {
      baseKey = b.dataset.sec02Base;
      syncButtons();
    });
  });
  document.querySelectorAll("[data-sec02-apex]").forEach((b) => {
    b.addEventListener("click", () => {
      apexKey = b.dataset.sec02Apex;
      syncButtons();
    });
  });

  const ro = new ResizeObserver(() => ctrl.draw());
  ro.observe(canvas);
  syncButtons();
}

/* =====================================================================
 * 03 节（深绛红暗室）：视线攀登的四条路径 —— 实时轨迹动画实测台
 * ===================================================================== */
export function setupAscentLab() {
  const canvas = document.getElementById("sec03-canvas");
  const infoEl = document.getElementById("sec03-info");
  const replayBtn = document.getElementById("sec03-replay");
  if (!canvas) return;

  const MODES = {
    stepped: {
      label: "阶梯退台式",
      en: "STEPPED ZIGGURAT",
      desc: "042 原海报最典型的四级退台：每上一阶都有短暂停顿，眼睛按「基础 → 支撑 → 次要 → 顶点」逐级消化信息，适合教学图解、报告与信息架构。",
      dwell: [28, 24, 20, 28],
      build: (w, h) => {
        const cx = w * 0.5;
        const by = h - 32;
        const th = (h - 84) / 4;
        const ws = [w * 0.22, w * 0.38, w * 0.54, w * 0.72];
        const blocks = ws.map((bw, i) => ({
          x: cx - bw * 0.5,
          y: by - (4 - i) * th,
          w: bw,
          h: th - 4,
          col: ["#D59626", "#C39A62", "#9A4538", "#651E22"][i],
        }));
        const path = [
          [cx + ws[3] * 0.5 + 16, by - 8],
          [cx + ws[2] * 0.5 + 14, by - th * 1.4],
          [cx + ws[1] * 0.5 + 12, by - th * 2.4],
          [cx + ws[0] * 0.5 + 10, by - th * 3.4],
          [cx, by - th * 4.35],
        ];
        return { blocks, path, apex: [cx, by - th * 4.35], inverted: false };
      },
    },
    slope: {
      label: "斜坡聚顶式",
      en: "CONTINUOUS SLOPE",
      desc: "左右斜边连成无缝斜坡，几乎不在中层停留，双路视线像汇流一样直冲顶峰太阳，适合风景摄影、海报主视觉与宏大开场页。",
      dwell: [18, 16, 16, 50],
      build: (w, h) => {
        const cx = w * 0.5;
        const by = h - 32;
        const ty = 48;
        const bw = w * 0.74;
        const poly = [
          [cx, ty],
          [cx + bw * 0.5, by],
          [cx - bw * 0.5, by],
        ];
        const path = [
          [cx - bw * 0.48, by - 6],
          [cx - bw * 0.25, (ty + by) * 0.5],
          [cx, ty - 6],
        ];
        const path2 = [
          [cx + bw * 0.48, by - 6],
          [cx + bw * 0.25, (ty + by) * 0.5],
          [cx, ty - 6],
        ];
        return { poly, path, path2, apex: [cx, ty - 6], inverted: false };
      },
    },
    asymmetric: {
      label: "偏轴攀登式",
      en: "ASYMMETRIC ASCENT",
      desc: "把顶峰向右微偏（约 62% 位置），左坡舒缓铺叙、右坡陡峭收尾，在保留宽基稳固的同时带出叙事前进感，打破死板中轴对称。",
      dwell: [24, 26, 18, 32],
      build: (w, h) => {
        const by = h - 32;
        const th = (h - 84) / 4;
        const ws = [w * 0.20, w * 0.36, w * 0.54, w * 0.74];
        const cxs = [w * 0.62, w * 0.58, w * 0.54, w * 0.50];
        const blocks = ws.map((bw, i) => ({
          x: cxs[i] - bw * 0.5,
          y: by - (4 - i) * th,
          w: bw,
          h: th - 4,
          col: ["#D59626", "#C39A62", "#9A4538", "#651E22"][i],
        }));
        const path = [
          [cxs[3] - ws[3] * 0.48, by - 10],
          [cxs[2] - ws[2] * 0.46, by - th * 1.5],
          [cxs[1] - ws[1] * 0.44, by - th * 2.5],
          [cxs[0], by - th * 4.25],
        ];
        return { blocks, path, apex: [cxs[0], by - th * 4.25], inverted: false };
      },
    },
    inverted: {
      label: "对照：倒三角下坠",
      en: "CONTRAST · 043 INVERTED",
      desc: "把金字塔上下翻转就成了 043 倒三角：视觉重量压在顶沿、视线自上而下直坠尖点，安定感立刻让位于速度、悬念与迫近感。",
      dwell: [44, 20, 14, 22],
      build: (w, h) => {
        const cx = w * 0.5;
        const ty = 46;
        const by = h - 38;
        const th = (by - ty) / 4;
        const ws = [w * 0.72, w * 0.54, w * 0.38, w * 0.20];
        const blocks = ws.map((bw, i) => ({
          x: cx - bw * 0.5,
          y: ty + i * th,
          w: bw,
          h: th - 4,
          col: ["#651E22", "#9A4538", "#C39A62", "#D59626"][i],
        }));
        const path = [
          [cx + ws[0] * 0.5 + 14, ty + 12],
          [cx + ws[1] * 0.5 + 12, ty + th * 1.5],
          [cx + ws[2] * 0.5 + 10, ty + th * 2.5],
          [cx, by + 6],
        ];
        return { blocks, path, apex: [cx, by + 6], inverted: true };
      },
    },
  };

  let modeKey = "stepped";
  let animStart = 0;

  function samplePolyline(pts, u) {
    const segs = pts.length - 1;
    const f = clamp(u, 0, 1) * segs;
    const i = Math.min(segs - 1, Math.floor(f));
    const local = f - i;
    return [
      pts[i][0] + (pts[i + 1][0] - pts[i][0]) * local,
      pts[i][1] + (pts[i + 1][1] - pts[i][1]) * local,
    ];
  }

  function render(t, dt, { still }) {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const m = MODES[modeKey];
    const g = m.build(w, h);

    // 暗室网格底线
    ctx.strokeStyle = "rgba(248, 235, 214, 0.07)";
    ctx.lineWidth = 1;
    for (let y = 36; y < h; y += 34) {
      ctx.beginPath();
      ctx.moveTo(16, y);
      ctx.lineTo(w - 16, y);
      ctx.stroke();
    }

    // 绘制主体形态
    if (g.blocks) {
      g.blocks.forEach((b) => {
        ctx.fillStyle = b.col;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = "rgba(255, 240, 210, 0.22)";
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
      });
    } else if (g.poly) {
      const grad = ctx.createLinearGradient(0, g.poly[0][1], 0, g.poly[1][1]);
      grad.addColorStop(0, "#D59626");
      grad.addColorStop(0.55, "#9A4538");
      grad.addColorStop(1, "#5C1B1F");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(g.poly[0][0], g.poly[0][1]);
      ctx.lineTo(g.poly[1][0], g.poly[1][1]);
      ctx.lineTo(g.poly[2][0], g.poly[2][1]);
      ctx.closePath();
      ctx.fill();
    }

    const drawTrajectory = (pts, col) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
      const end = pts[pts.length - 1];
      const prev = pts[pts.length - 2];
      const ang = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(end[0], end[1]);
      ctx.lineTo(end[0] - Math.cos(ang - 0.45) * 10, end[1] - Math.sin(ang - 0.45) * 10);
      ctx.lineTo(end[0] - Math.cos(ang + 0.45) * 10, end[1] - Math.sin(ang + 0.45) * 10);
      ctx.closePath();
      ctx.fill();

      const progress = still ? 0.85 : ((t - animStart) * 0.42) % 1;
      const [px, py] = samplePolyline(pts, progress);
      ctx.fillStyle = "#FFE5A3";
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.stroke();
    };

    const rayCol = g.inverted ? "#FF8C7A" : "#F0B94E";
    drawTrajectory(g.path, rayCol);
    if (g.path2) drawTrajectory(g.path2, rayCol);

    // 汇聚点光环
    ctx.strokeStyle = rayCol;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(g.apex[0], g.apex[1], 14, 0, Math.PI * 2);
    ctx.stroke();
  }

  const ctrl = loop(canvas, render);

  function updatePanel() {
    const m = MODES[modeKey];
    document.querySelectorAll("[data-sec03-mode]").forEach((b) => {
      const on = b.dataset.sec03Mode === modeKey;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (infoEl) {
      const labels = modeKey === "inverted" ? ["顶沿重击", "中上段", "中下段", "底尖坠落"] : ["底层起步", "支撑过渡", "次要收束", "顶峰驻留"];
      infoEl.innerHTML = `
        <p class="sec03-en" lang="en">${m.en}</p>
        <h3>${m.label}</h3>
        <p>${m.desc}</p>
        <div class="dwell-bars" aria-label="视线驻留分布示意">
          <div class="dwell-cap">各段视线驻留分布（示意）</div>
          ${m.dwell
            .map(
              (v, i) => `
            <div class="dwell-row">
              <span>${labels[i]}</span>
              <div class="dwell-track"><i style="width:${v * 1.7}%"></i></div>
              <b>${v}%</b>
            </div>`
            )
            .join("")}
        </div>
      `;
    }
    ctrl.draw();
  }

  document.querySelectorAll("[data-sec03-mode]").forEach((b) => {
    b.addEventListener("click", () => {
      modeKey = b.dataset.sec03Mode;
      animStart = performance.now() / 1000;
      updatePanel();
    });
  });

  if (replayBtn) {
    replayBtn.addEventListener("click", () => {
      animStart = performance.now() / 1000;
      ctrl.draw();
    });
  }

  const ro = new ResizeObserver(() => ctrl.draw());
  ro.observe(canvas);
  updatePanel();
}

/* =====================================================================
 * 04 节：从阶梯金字塔到演讲逻辑 —— 历史年代卡片与几何骨架透视器
 * ===================================================================== */
export function setupHistoryLab() {
  const canvas = document.getElementById("sec04-canvas");
  const detailEl = document.getElementById("sec04-detail");
  const overlayBtn = document.getElementById("sec04-overlay");
  if (!canvas) return;

  const ERAS = [
    {
      id: "saqqara",
      year: "约前 2650 年",
      title: "左塞尔阶梯金字塔",
      who: "伊姆霍特普 · 埃及萨卡拉（第三王朝）",
      summary: "人类现存最早的大型纪念碑石构建筑。建筑师伊姆霍特普把六座逐层缩小的矩形马斯塔巴叠筑起来，高约 60 至 62 米。宽基逐级内收不是装饰，而是让巨石自重稳稳向下传导的物理力学解。",
      cite: "核实来源：Encyclopædia Britannica — Step Pyramid of Djoser",
    },
    {
      id: "pieta",
      year: "1483–1499 年",
      title: "文艺复兴三维金字塔群像",
      who: "达·芬奇《岩间圣母》· 米开朗基罗《哀悼基督》",
      summary: "盛期文艺复兴把平面三角推进为实体三维金字塔。卢浮宫藏《岩间圣母》（约 1483–1486，INV 777）用四人视线与手势围出纵深锥体；米开朗基罗《哀悼基督》（1498–1499，圣彼得大教堂）更以宽大衣褶作石质底座，稳稳托起上方的安静核心。",
      cite: "核实来源：Musée du Louvre (INV 777) & Britannica — Pietà by Michelangelo",
    },
    {
      id: "journalism",
      year: "1880–1890 年",
      title: "报刊倒金字塔定型",
      who: "霍斯特·珀特克（2003）报刊史实证",
      summary: "常见传言称倒金字塔纯因美国内战电报断线而生。传播学者 Horst Pöttker（2003，《Journalism Studies》）检验 19 世纪纽约大报后证实：倒金字塔是在 1880–1890 年间为提升大众阅读效率才定型——它与视觉正金字塔刚好构成「结论先行 vs 稳基登顶」的镜像。",
      cite: "核实来源：Horst Pöttker (2003), Journalism Studies 4(4), 501–511",
    },
    {
      id: "maslow",
      year: "1943 → 1960 年",
      title: "马斯洛从未画过金字塔",
      who: "布里奇曼、卡明斯与巴拉德（2019）学术考证",
      summary: "人人都见过「马斯洛需求金字塔」，但心理学家马斯洛 1943 年原论文里只有文字层级，从未画过金字塔。2019 年《Academy of Management Learning & Education》论文考证：是查尔斯·麦克德米德（1960）等管理学作者借用阶梯金字塔视觉壳，让「先基础、后高阶」一秒被看懂——也反过来提醒我们：图形会强行固化原本流动的概念。",
      cite: "核实来源：Bridgman, Cummings & Ballard (2019), AMLE",
    },
    {
      id: "minto",
      year: "1987 年",
      title: "金字塔原理进入演讲与报告",
      who: "芭芭拉·明托《The Pyramid Principle》",
      summary: "前麦肯锡顾问芭芭拉·明托于 1987 年正式出版《金字塔原理》（1996 年推出修订教科书版），把商业汇报归纳为自上而下给结论、自下而上用分组论据与底层事实托举的树状金字塔——直接对应 042 原海报里的「演讲演示」与「团队与组织」。",
      cite: "核实来源：Barbara Minto — barbaraminto.com",
    },
  ];

  let idx = 0;
  let showOverlay = true;

  function draw() {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const era = ERAS[idx];
    const cx = w * 0.5;
    const by = h - 30;
    const ty = 32;
    const spanH = by - ty;
    const spanW = Math.min(w - 48, 360);

    // 背景柔和浅暖框线
    ctx.strokeStyle = "rgba(80, 18, 21, 0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    if (era.id === "saqqara") {
      // 6 级马斯塔巴阶梯剖面
      const n = 6;
      const sh = spanH / n;
      for (let i = n - 1; i >= 0; i--) {
        const bw = spanW * (0.28 + (i / (n - 1)) * 0.72);
        const y = ty + i * sh;
        ctx.fillStyle = i % 2 === 0 ? "#B68B55" : "#9E7042";
        ctx.fillRect(cx - bw * 0.5, y, bw, sh - 2);
        ctx.fillStyle = "#6E4B28";
        ctx.fillRect(cx + bw * 0.5, y - 3, 12, sh - 2);
      }
      if (showOverlay) {
        ctx.strokeStyle = "#501215";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, ty - 6);
        ctx.lineTo(cx - spanW * 0.52, by);
        ctx.lineTo(cx + spanW * 0.52, by);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        // 向下受压箭头
        for (let k = -1; k <= 1; k++) {
          const ax = cx + k * 42;
          ctx.strokeStyle = "#B32118";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(ax, ty + spanH * 0.35);
          ctx.lineTo(ax, by - 8);
          ctx.stroke();
        }
      }
    } else if (era.id === "pieta") {
      // 抽象大理石雕塑三维金字塔剪影（严格无五官！）
      ctx.fillStyle = "#D8C3A4";
      ctx.beginPath();
      ctx.moveTo(cx - 8, ty + 16);
      ctx.quadraticCurveTo(cx + 38, ty + 52, cx + spanW * 0.44, by);
      ctx.lineTo(cx - spanW * 0.46, by);
      ctx.quadraticCurveTo(cx - 58, ty + 62, cx - 8, ty + 16);
      ctx.closePath();
      ctx.fill();

      // 宽大垂褶底座暗示
      ctx.fillStyle = "#B68B55";
      ctx.beginPath();
      ctx.moveTo(cx - spanW * 0.46, by);
      ctx.quadraticCurveTo(cx - spanW * 0.14, by - 46, cx + spanW * 0.44, by);
      ctx.closePath();
      ctx.fill();

      // 简洁无五官头肩轮廓
      ctx.fillStyle = "#82362B";
      ctx.beginPath();
      ctx.arc(cx - 8, ty + 28, 13, 0, Math.PI * 2);
      ctx.fill();

      if (showOverlay) {
        ctx.strokeStyle = "#B37612";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 8, ty + 10);
        ctx.lineTo(cx + spanW * 0.48, by);
        ctx.lineTo(cx - spanW * 0.48, by);
        ctx.closePath();
        ctx.stroke();
      }
    } else if (era.id === "journalism") {
      // 左：视觉正金字塔；右：新闻倒金字塔（清晰对比）
      const lx = w * 0.30;
      const rx = w * 0.70;
      const bw = Math.min(w * 0.34, 140);
      // 左正
      ctx.fillStyle = "#82362B";
      ctx.beginPath();
      ctx.moveTo(lx, ty + 10);
      ctx.lineTo(lx + bw * 0.5, by - 12);
      ctx.lineTo(lx - bw * 0.5, by - 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#2E0B0A";
      ctx.font = `600 11px "Noto Serif SC", serif`;
      ctx.textAlign = "center";
      ctx.fillText("视觉正金字塔", lx, by + 6);

      // 右倒
      ctx.fillStyle = "#501215";
      ctx.beginPath();
      ctx.moveTo(rx - bw * 0.5, ty + 10);
      ctx.lineTo(rx + bw * 0.5, ty + 10);
      ctx.lineTo(rx, by - 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#2E0B0A";
      ctx.fillText("新闻倒金字塔 (1880s)", rx, by + 6);

      if (showOverlay) {
        ctx.strokeStyle = "#BF8116";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(lx, by - 22);
        ctx.lineTo(lx, ty + 24);
        ctx.moveTo(rx, ty + 20);
        ctx.lineTo(rx, by - 24);
        ctx.stroke();
      }
    } else if (era.id === "maslow") {
      // 左：1943 纯文字列表；右：1960 阶梯金字塔壳
      const lx = w * 0.27;
      const rx = w * 0.70;
      const rows = 5;
      const rh = (spanH - 22) / rows;
      for (let i = 0; i < rows; i++) {
        const y = ty + 8 + i * rh;
        // 左纯清单条
        ctx.fillStyle = "#D4BC9A";
        ctx.fillRect(lx - 52, y + 4, 104, rh - 10);
        // 右 1960 阶梯金字塔
        const rw = 26 + i * 26;
        ctx.fillStyle = ["#B37612", "#BA8538", "#A5673E", "#82362B", "#501215"][i];
        ctx.fillRect(rx - rw * 0.5, y + 2, rw, rh - 5);
      }
      ctx.fillStyle = "#2E0B0A";
      ctx.font = `600 11px "Noto Serif SC", serif`;
      ctx.textAlign = "center";
      ctx.fillText("1943 原论文：清单文本", lx, by + 6);
      ctx.fillText("1960 教科书：阶梯金字塔", rx, by + 6);
      if (showOverlay) {
        ctx.strokeStyle = "#B32118";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(lx + 62, ty + spanH * 0.48);
        ctx.lineTo(rx - 74, ty + spanH * 0.48);
        ctx.stroke();
      }
    } else {
      // 芭芭拉·明托：核心结论节点 → 三组论据 → 六块事实底座
      const topY = ty + 16;
      const midY = ty + spanH * 0.46;
      const botY = by - 26;
      const drawNode = (x, y, nw, nh, fill, txt) => {
        ctx.fillStyle = fill;
        ctx.fillRect(x - nw * 0.5, y - nh * 0.5, nw, nh);
        ctx.fillStyle = "#FFF8EC";
        ctx.font = `600 11px "Noto Serif SC", serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(txt, x, y);
      };
      const mids = [cx - 88, cx, cx + 88];
      const bots = [cx - 116, cx - 64, cx - 22, cx + 22, cx + 64, cx + 116];

      ctx.strokeStyle = "rgba(80, 18, 21, 0.45)";
      ctx.lineWidth = 1.4;
      mids.forEach((mx) => {
        ctx.beginPath();
        ctx.moveTo(cx, topY + 14);
        ctx.lineTo(mx, midY - 14);
        ctx.stroke();
      });
      bots.forEach((bx, bi) => {
        const parentX = mids[Math.floor(bi / 2)];
        ctx.beginPath();
        ctx.moveTo(parentX, midY + 14);
        ctx.lineTo(bx, botY - 12);
        ctx.stroke();
      });

      drawNode(cx, topY, 96, 28, "#B37612", "中心结论");
      mids.forEach((mx, i) => drawNode(mx, midY, 72, 26, "#82362B", `论据 ${i + 1}`));
      bots.forEach((bx) => drawNode(bx, botY, 34, 22, "#501215", "事实"));

      if (showOverlay) {
        ctx.strokeStyle = "rgba(179, 118, 18, 0.72)";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, topY - 18);
        ctx.lineTo(cx + 142, botY + 14);
        ctx.lineTo(cx - 142, botY + 14);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  function renderUI() {
    const era = ERAS[idx];
    document.querySelectorAll("[data-sec04-era]").forEach((b) => {
      const on = Number(b.dataset.sec04Era) === idx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (overlayBtn) {
      overlayBtn.textContent = showOverlay ? "结构线叠加：开" : "结构线叠加：关";
      overlayBtn.setAttribute("aria-pressed", String(showOverlay));
    }
    if (detailEl) {
      detailEl.innerHTML = `
        <div class="era-meta"><span class="era-year">${era.year}</span><span>${era.who}</span></div>
        <h3>${era.title}</h3>
        <p>${era.summary}</p>
        <p class="era-cite">${era.cite}</p>
      `;
    }
    draw();
  }

  document.querySelectorAll("[data-sec04-era]").forEach((b) => {
    b.addEventListener("click", () => {
      idx = Number(b.dataset.sec04Era);
      renderUI();
    });
  });

  if (overlayBtn) {
    overlayBtn.addEventListener("click", () => {
      showOverlay = !showOverlay;
      renderUI();
    });
  }

  const ro = new ResizeObserver(draw);
  ro.observe(canvas);
  renderUI();
}

/* =====================================================================
 * 05 节：五大场景实景拆解 —— 五境蓝图切签 + 单层抽离塌陷检验器
 * ===================================================================== */
export function setupArenaLab() {
  const canvas = document.getElementById("sec05-canvas");
  const descEl = document.getElementById("sec05-desc");
  if (!canvas) return;

  const ARENAS = {
    landscape: {
      title: "风景摄影",
      layers: ["日照主峰", "远山云带", "中景林坡", "前景暗岩"],
      fullNote: "四层完整：深暗前景暗岩压稳底边，中景林坡把视线逐级推高，远山云带留出呼吸，最终在日照主峰一举收口。",
      missing: [
        "抽离「日照主峰」：画面只剩铺垫，视线爬到顶端却没有高光主角承接，变成平庸空景。",
        "抽离「远山云带」：中景与主峰硬贴在一起，失去纵深空气感与明暗过渡。",
        "抽离「中景林坡」：前景黑岩与遥远雪峰中间断层，视线只能跳跃而不能顺坡攀升。",
        "抽离「前景暗岩」：整座山体漂在画面中央，缺少沉稳压脚的地基。",
      ],
    },
    presentation: {
      title: "演讲演示",
      layers: ["核心结论", "三条论据", "案例图示", "底层数据"],
      fullNote: "四层完整：一页 PPT 自上而下锁定核心主张，往下逐层展开论据、案例与数据来源，听众先见结论、再得证据。",
      missing: [
        "抽离「核心结论」：满屏都是数据和案例，观众听完三分钟仍不知道你到底要拍板什么。",
        "抽离「三条论据」：结论直接掉进碎数据里，缺少中间逻辑归类，听众记不住。",
        "抽离「案例图示」：抽象论点与冷冰冰的数据之间缺少具象画面，难以引发共鸣。",
        "抽离「底层数据」：主张悬在半空像口号，评委一追问依据立刻站不住脚。",
      ],
    },
    architecture: {
      title: "建筑与空间",
      layers: ["采光尖顶", "退台柱廊", "承重石墙", "宽阔台基"],
      fullNote: "四层完整：宽阔台基深植地面，承重墙与退台柱廊逐级减重，最终收束到轻盈的采光尖顶，兼具庄重与升腾感。",
      missing: [
        "抽离「采光尖顶」：建筑天际线被一刀削平，失去朝天收束的精神焦点。",
        "抽离「退台柱廊」：厚墙直顶天际，体量显得呆板粗笨，缺少尺度过渡。",
        "抽离「承重石墙」：上下结构断层，顶部显得轻浮无依托。",
        "抽离「宽阔台基」：纪念性建筑像直接插进平地，庄重安定感瞬间折半。",
      ],
    },
    layout: {
      title: "版式设计",
      layers: ["视觉锚标", "主标核心", "导语配图", "宽幅脚注栏"],
      fullNote: "四层完整：底部通栏深色脚注条如地基托底，中段导语与图像稳住版心，上方大标题与徽标完成视觉聚焦。",
      missing: [
        "抽离「视觉锚标」：顶部缺少第一时间抓眼的起笔锚点，版面上缘发散。",
        "抽离「主标核心」：读者看完图文却找不到主旨，层级失去制高点。",
        "抽离「导语配图」：大标题与底栏之间空洞割裂，阅读节奏断裂。",
        "抽离「宽幅脚注栏」：整张版面下缘发轻飘浮，缺乏收官重量。",
      ],
    },
    team: {
      title: "团队与组织",
      layers: ["战略决策", "部门协同", "专业执行", "一线运营"],
      fullNote: "四层完整：宽阔的一线运营接触真实用户，专业执行与部门协同层层提炼，顶层战略决策清晰单一（人物均以无五官剪影呈现）。",
      missing: [
        "抽离「战略决策」：下方团队各自忙碌却无共同北极星，力量向四周耗散。",
        "抽离「部门协同」：高层目标无法拆解到专业模块，上下沟通出现断崖。",
        "抽离「专业执行」：战略与一线之间缺少产品与技术中坚，想法落不了地。",
        "抽离「一线运营」：整座组织悬空，失去贴地反馈与稳定基本盘。",
      ],
    },
  };

  let arenaKey = "landscape";
  let dropped = -1; // -1 完整；0..3 抽离该层

  function draw() {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    const arena = ARENAS[arenaKey];
    const cx = w * 0.5;
    const padT = 26;
    const padB = 26;
    const totalH = h - padT - padB;
    const maxW = Math.min(w - 44, 420);
    const tierH = totalH / 4;
    const ws = [0.28, 0.50, 0.72, 0.94];
    const fills = ["#B37612", "#B68B55", "#82362B", "#501215"];

    for (let i = 3; i >= 0; i--) {
      const y0 = padT + i * tierH;
      const y1 = y0 + tierH - 5;
      const bw = ws[i] * maxW;
      const tw = bw * (i === 0 ? 0.76 : 0.89);

      if (dropped === i) {
        // 被抽离层：红色虚线空洞警示框
        ctx.save();
        ctx.strokeStyle = "#B32118";
        ctx.fillStyle = "rgba(179, 33, 24, 0.08)";
        ctx.lineWidth = 1.6;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(cx - tw * 0.5, y0);
        ctx.lineTo(cx + tw * 0.5, y0);
        ctx.lineTo(cx + bw * 0.5, y1);
        ctx.lineTo(cx - bw * 0.5, y1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#B32118";
        ctx.font = `700 12px "Noto Serif SC", serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`× 已抽离「${arena.layers[i]}」`, cx, (y0 + y1) * 0.5);
        ctx.restore();
        continue;
      }

      // 正常层：带题材专属极简装饰纹理（人物严守无五官剪影）
      ctx.save();
      ctx.fillStyle = fills[i];
      ctx.beginPath();
      ctx.moveTo(cx - tw * 0.5, y0);
      ctx.lineTo(cx + tw * 0.5, y0);
      ctx.lineTo(cx + bw * 0.5, y1);
      ctx.lineTo(cx - bw * 0.5, y1);
      ctx.closePath();
      ctx.fill();

      // 题材极简母题暗示
      ctx.fillStyle = "rgba(255, 248, 236, 0.16)";
      if (arenaKey === "architecture") {
        // 建筑柱列竖纹
        const cols = 3 + i * 2;
        for (let c = 0; c < cols; c++) {
          const px = cx - tw * 0.36 + (c / Math.max(1, cols - 1)) * tw * 0.72;
          ctx.fillRect(px - 2, y0 + 6, 4, y1 - y0 - 12);
        }
      } else if (arenaKey === "team") {
        // 纯几何无五官头肩剪影点阵
        const dots = i + 1;
        for (let d = 0; d < dots; d++) {
          const px = cx - (dots - 1) * 14 + d * 28;
          ctx.beginPath();
          ctx.arc(px, y0 + 12, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (arenaKey === "landscape" && i === 0) {
        ctx.beginPath();
        ctx.arc(cx, y0 + 14, 7, 0, Math.PI * 2);
        ctx.fill();
      } else if (arenaKey === "presentation" || arenaKey === "layout") {
        ctx.fillRect(cx - tw * 0.35, y1 - 10, tw * 0.7, 3);
      }

      ctx.fillStyle = "#FFF8EC";
      ctx.font = `700 13px "Noto Serif SC", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`L${i + 1} · ${arena.layers[i]}`, cx, (y0 + y1) * 0.5);
      ctx.restore();
    }
  }

  function sync() {
    const arena = ARENAS[arenaKey];
    document.querySelectorAll("[data-sec05-arena]").forEach((b) => {
      const on = b.dataset.sec05Arena === arenaKey;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    document.querySelectorAll("[data-sec05-drop]").forEach((b) => {
      const val = Number(b.dataset.sec05Drop);
      const on = val === dropped;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
      if (val >= 0) b.textContent = `抽离：${arena.layers[val]}`;
    });
    if (descEl) {
      const isFull = dropped === -1;
      descEl.innerHTML = `<span class="lab-badge ${isFull ? "is-good" : "is-warn"}">${arena.title} · ${isFull ? "四层咬合" : `缺失第 ${dropped + 1} 层`}</span><p>${isFull ? arena.fullNote : arena.missing[dropped]}</p>`;
    }
    draw();
  }

  document.querySelectorAll("[data-sec05-arena]").forEach((b) => {
    b.addEventListener("click", () => {
      arenaKey = b.dataset.sec05Arena;
      dropped = -1;
      sync();
    });
  });

  document.querySelectorAll("[data-sec05-drop]").forEach((b) => {
    b.addEventListener("click", () => {
      const val = Number(b.dataset.sec05Drop);
      dropped = dropped === val && val !== -1 ? -1 : val;
      sync();
    });
  });

  const ro = new ResizeObserver(draw);
  ro.observe(canvas);
  sync();
}

/* =====================================================================
 * 06 节：什么时候别用金字塔 —— 四张错用↔替代交互切换卡
 * ===================================================================== */
export function setupAntiPatterns() {
  document.querySelectorAll(".anti-card").forEach((card) => {
    const btn = card.querySelector(".anti-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const showingAlt = card.classList.toggle("is-alt");
      btn.setAttribute("aria-pressed", String(showingAlt));
      btn.textContent = showingAlt ? "看回错用金字塔" : "切到推荐骨架";
    });
  });
}

/* =====================================================================
 * 07 节：小练习（严格单变量：四级宽度与明暗排布，标签全中性）
 * ===================================================================== */
export function setupQuiz() {
  const buttons = [...document.querySelectorAll("[data-quiz-opt]")];
  const feedback = document.getElementById("quiz-feedback");
  const resetBtn = document.getElementById("quiz-reset");
  if (!buttons.length || !feedback) return;

  const REASONS = {
    A: {
      ok: false,
      title: "方案 A：轮廓下宽上窄，但明暗倒置成了「顶重底轻」",
      body: "四层宽度虽然逐级收窄，但最重的深绛色被放在了顶层，最浅的砂金色反而垫在底部。视觉重心被拉高到 53%，让人感觉上方沉重压迫，违背了金字塔构图「底重顶轻」的核心要领。",
    },
    B: {
      ok: false,
      title: "方案 B：明暗顺序正确，但第 2 层向外悬挑超出第 3 层",
      body: "色阶虽是从深绛到炽金，但次要层宽度（64%）竟然大于下方支撑层（48%），中段鼓出悬挑台阶。观者视线沿外坡攀升到半途会被突兀折断，结构安定感瞬间瓦解。",
    },
    C: {
      ok: true,
      title: "选对了！方案 C 同时满足「逐级收窄 + 底重顶轻」",
      body: "四层宽度按 84% → 65% → 47% → 28% 清晰退台（底顶宽比 3.0×），明暗从深绛红基座逐阶提亮至炽金顶峰，视觉重心稳落在 36%。既托住了宏阔的古建主题，又让视线顺畅直抵核心展题。",
    },
    D: {
      ok: false,
      title: "方案 D：明暗递进合理，但四层宽幅几乎拉平（宽比仅 1.2×）",
      body: "68% → 64% → 60% → 56% 几乎没有斜坡收窄趋势，外轮廓退化成了竖直堆叠的矩形色条。顶部过宽稀释了视觉焦点，失去了金字塔向上汇聚的力量感。",
    },
  };

  function choose(key) {
    const r = REASONS[key];
    buttons.forEach((btn) => {
      const k = btn.dataset.quizOpt;
      btn.classList.remove("is-picked", "is-correct", "is-wrong");
      btn.classList.add("is-revealed");
      if (k === key) btn.classList.add("is-picked");
      if (k === "C") btn.classList.add("is-correct");
      else if (k === key) btn.classList.add("is-wrong");
    });
    feedback.hidden = false;
    feedback.className = `quiz-feedback ${r.ok ? "is-correct" : "is-wrong"}`;
    feedback.innerHTML = `
      <span class="lab-badge ${r.ok ? "is-good" : "is-warn"}">${r.ok ? "判断正确" : "再看一眼结构"}</span>
      <h3>${r.title}</h3>
      <p>${r.body}</p>
      <p class="quiz-all-note"><strong>四项变量对照：</strong>方案 A 明暗倒置（重心 53%） · 方案 B 中层悬挑（+16%） · 方案 C 逐级收窄且底重顶轻（重心 36%，正解） · 方案 D 宽幅拉平（宽比 1.2×）。</p>
    `;
    if (resetBtn) resetBtn.hidden = false;
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => choose(btn.dataset.quizOpt));
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      buttons.forEach((btn) => btn.classList.remove("is-picked", "is-correct", "is-wrong", "is-revealed"));
      feedback.hidden = true;
      feedback.innerHTML = "";
      resetBtn.hidden = true;
    });
  }
}

/* =====================================================================
 * 08 节：原海报放大拖拽灯箱（draggable="false" + Esc 关闭）
 * ===================================================================== */
export function setupPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const dialog = document.getElementById("poster-lightbox");
  const bigImg = document.getElementById("lightbox-img");
  const zoomIn = document.getElementById("lb-zoom-in");
  const zoomOut = document.getElementById("lb-zoom-out");
  const zoomReset = document.getElementById("lb-reset");
  const closeBtn = document.getElementById("lb-close");
  const stage = document.getElementById("lightbox-stage");
  if (!poster || !dialog || !bigImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  const applyTransform = () => {
    bigImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  };

  function open() {
    if (!bigImg.src) bigImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.showModal();
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  poster.addEventListener("click", open);
  if (openBtn) openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) {
      e.preventDefault();
      close();
    }
  });

  if (zoomIn) zoomIn.addEventListener("click", () => { scale = clamp(scale + 0.35, 1, 3.5); applyTransform(); });
  if (zoomOut) zoomOut.addEventListener("click", () => { scale = clamp(scale - 0.35, 1, 3.5); if (scale === 1) { tx = 0; ty = 0; } applyTransform(); });
  if (zoomReset) zoomReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  if (stage) {
    stage.addEventListener("wheel", (e) => {
      e.preventDefault();
      scale = clamp(scale + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.5);
      if (scale === 1) { tx = 0; ty = 0; }
      applyTransform();
    }, { passive: false });

    stage.addEventListener("pointerdown", (e) => {
      if (scale <= 1) return;
      drag = { x: e.clientX, y: e.clientY, tx, ty, id: e.pointerId };
      try { stage.setPointerCapture(e.pointerId); } catch {}
    });
    stage.addEventListener("pointermove", (e) => {
      if (!drag) return;
      tx = drag.tx + (e.clientX - drag.x);
      ty = drag.ty + (e.clientY - drag.y);
      applyTransform();
    });
    stage.addEventListener("pointerup", () => { drag = null; });
    stage.addEventListener("pointercancel", () => { drag = null; });
  }
}

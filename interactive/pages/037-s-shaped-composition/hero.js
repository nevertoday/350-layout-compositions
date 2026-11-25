// 037 S 形构图 · 开场活体 S 河道修曲台（hero.js）
// 高帧率 2D Canvas 架构：
//   - 静态背景+河道+圆窗+四站缓存至离屏层 bgCanvas（仅在 state/尺寸变化时重建，静置播放每帧仅 1 次 drawImage + 5 粒光点）
//   - 圆窗山峰底图独立离屏缓存（拖曳时零 ctx.clip / 零渐变重建）
//   - 拖曳仅标 dirty 并随 rAF 合并单帧重绘与 DOM 同步，消除 touchmove 双重渲染与同步 layout reflow
//   - 手机端像素比遵循 GUIDE.md 建议封顶 1.5（桌面 2），软硬渲染均流畅 50–60 fps

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  PRESETS,
  clamp,
  clonePreset,
  createInitialState,
  evaluate,
  pointAt,
} from "./model.js";

const PAL = {
  bg: "#042318",
  bgSoft: "#083022",
  grid: "rgba(90, 209, 210, 0.08)",
  aqua: "#5AD1D2",
  aquaGlow: "rgba(90, 209, 210, 0.20)",
  lime: "#BFD05B",
  cream: "#EBDFC5",
  sun: "#EFE8A3",
  peakMid: "#2A6857",
  riverLight: "#C8E6DC",
  err: "#FF8674",
  ok: "#6EE7B7",
};

export function initHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return null;
  const ctx = canvas.getContext("2d", { alpha: false });

  // 离屏合成层与圆窗静态底图缓存
  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d", { alpha: false });
  const medCanvas = document.createElement("canvas");
  const medCtx = medCanvas.getContext("2d");

  const state = createInitialState();
  let ev = evaluate(state);

  let W = 680;
  let H = 492;
  let dpr = 1;
  let bgDirty = true;
  let medCacheKey = "";
  let uiDirty = true;
  let dragMode = null;
  let dragStart = null;
  let hoveredHit = null;
  let hitTargets = [];
  let lastEvalKey = "";

  // DOM 引用
  const titleSPath = document.getElementById("hero-title-s-path");
  const titleSAqua = document.getElementById("hero-title-s-aqua");
  const statusPill = document.getElementById("hero-status-pill");
  const diagBadge = document.getElementById("diag-badge");
  const diagHeadline = document.getElementById("diag-headline");
  const diagBody = document.getElementById("diag-body");
  const diagNext = document.getElementById("diag-next");
  const metricSwing = document.getElementById("metric-swing");
  const metricInflect = document.getElementById("metric-inflect");
  const metricWhite = document.getElementById("metric-white");
  const metricFlow = document.getElementById("metric-flow");
  const kappaSvgPath = document.getElementById("kappa-wave-path");
  const kappaFillPos = document.getElementById("kappa-fill-pos");
  const kappaFillNeg = document.getElementById("kappa-fill-neg");
  const kappaDot = document.getElementById("kappa-inflect-dot");
  const kappaNote = document.getElementById("kappa-note");

  const rangeAmp = document.getElementById("range-amp");
  const rangeAmpVal = document.getElementById("range-amp-val");
  const rangeCrowd = document.getElementById("range-crowd");
  const rangeCrowdVal = document.getElementById("range-crowd-val");

  const sceneBtns = [...document.querySelectorAll("[data-scene]")];
  const presetBtns = [...document.querySelectorAll("[data-preset]")];
  const tipBtns = [...document.querySelectorAll("[data-tip-fix]")];
  const stepBtns = [...document.querySelectorAll("[data-workflow-step]")];

  function measureCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const nextW = Math.round(rect.width);
    const nextH = Math.round(rect.height);
    // 手机窄屏像素比封顶 1.5（GUIDE.md 性能规矩），宽屏封顶 2
    const nextDpr = pixelRatio(nextW < 520 ? 1.5 : 2);
    const pw = Math.round(nextW * nextDpr);
    const ph = Math.round(nextH * nextDpr);
    if (nextW !== W || nextH !== H || nextDpr !== dpr || canvas.width !== pw || canvas.height !== ph) {
      W = nextW;
      H = nextH;
      dpr = nextDpr;
      canvas.width = pw;
      canvas.height = ph;
      bgCanvas.width = pw;
      bgCanvas.height = ph;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bgDirty = true;
    }
  }

  const toX = (u) => u * W;
  const toY = (v) => v * H;
  const toU = (x) => clamp(x / W, 0.04, 0.96);
  const toV = (y) => clamp(y / H, 0.06, 0.95);

  function syncUI() {
    if (!uiDirty) return;
    uiDirty = false;
    ev = evaluate(state);
    const key = [
      state.scene,
      state.highlightStep,
      state.bendTop.toFixed(3),
      state.bendBot.toFixed(3),
      state.exitPull.toFixed(3),
      state.crowd.toFixed(3),
      ...state.nodes.map((n) => `${n.t.toFixed(3)},${n.offU.toFixed(3)},${n.offV.toFixed(3)}`),
    ].join("|");
    if (key === lastEvalKey) return;
    lastEvalKey = key;
    bgDirty = true;

    const isPass = ev.passedCount === 4;

    if (statusPill) {
      statusPill.textContent = isPass ? "4 / 4 动线贯通" : `${ev.passedCount} / 4 待疏通`;
      statusPill.dataset.state = isPass ? "ok" : "warn";
    }
    if (diagBadge) {
      diagBadge.textContent = ev.badge;
      diagBadge.dataset.state = isPass ? "ok" : "warn";
    }
    if (diagHeadline) diagHeadline.textContent = ev.headline;
    if (diagBody) diagBody.textContent = ev.body;
    if (diagNext) diagNext.textContent = ev.nextStep;

    if (metricSwing) metricSwing.textContent = `${ev.metrics.topSwingPct}% / ${ev.metrics.botSwingPct}%`;
    if (metricInflect) metricInflect.textContent = ev.metrics.inflections === 1 ? "1 处翻号" : "0 处（无拐点）";
    if (metricWhite) metricWhite.textContent = `${ev.metrics.whitespacePct}%`;
    if (metricFlow) metricFlow.textContent = ev.metrics.flowGrade;

    if (titleSPath && titleSAqua) {
      const bt = clamp(state.bendTop, -0.45, 0.45);
      const bb = clamp(state.bendBot, -0.45, 0.45);
      const midX = 36 + (bt + bb) * 24;
      const topX = 36 + bt * 58;
      const botX = 36 + bb * 58;
      const d = `M ${36 - bt * 26} 12 C ${topX} 12, ${topX} 40, ${midX} 44 C ${botX} 48, ${botX} 76, ${36 - bb * 26} 76`;
      titleSPath.setAttribute("d", d);
      titleSAqua.setAttribute("d", d);
      titleSAqua.setAttribute("stroke", isPass ? PAL.aqua : ev.checks.curveOk ? PAL.lime : PAL.err);
    }

    if (kappaSvgPath && kappaFillPos && kappaFillNeg) {
      const pts = ev.sample.pts;
      const Wk = 240, Hk = 48, midY = 24, scaleK = 2.6;
      const step = 3; // 40 点平滑绘制，省 DOM 字符串开销
      const coords = [];
      for (let i = 0; i < pts.length; i += step) {
        const p = pts[i];
        coords.push([(i / (pts.length - 1)) * Wk, clamp(midY - p.kappa * scaleK, 3, Hk - 3)]);
      }
      const lastP = pts[pts.length - 1];
      coords.push([Wk, clamp(midY - lastP.kappa * scaleK, 3, Hk - 3)]);

      kappaSvgPath.setAttribute("d", coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" "));
      kappaFillPos.setAttribute("d", `M0,${midY} ` + coords.map(([x, y]) => `L${x.toFixed(1)},${Math.min(midY, y).toFixed(1)}`).join(" ") + ` L${Wk},${midY} Z`);
      kappaFillNeg.setAttribute("d", `M0,${midY} ` + coords.map(([x, y]) => `L${x.toFixed(1)},${Math.max(midY, y).toFixed(1)}`).join(" ") + ` L${Wk},${midY} Z`);

      if (kappaDot) {
        if (ev.metrics.inflections === 1) {
          kappaDot.setAttribute("cx", (ev.anchors.inflectionPt.t * Wk).toFixed(1));
          kappaDot.setAttribute("cy", String(midY));
          kappaDot.setAttribute("opacity", "1");
        } else {
          kappaDot.setAttribute("opacity", "0");
        }
      }
      if (kappaNote) {
        kappaNote.textContent = ev.metrics.inflections === 1
          ? `κ(t) 过零翻号 · 峰值 ${ev.metrics.maxAbsKappa} · ${ev.metrics.hogarthLevel}`
          : `κ(t) 全程同号无拐点 · 峰值 ${ev.metrics.maxAbsKappa}`;
      }
    }

    if (rangeAmp) {
      const avg = Math.round((Math.abs(state.bendTop) + Math.abs(state.bendBot)) * 50);
      rangeAmp.value = String(clamp(avg, 3, 45));
      if (rangeAmpVal) rangeAmpVal.textContent = `${avg}%`;
    }
    if (rangeCrowd) {
      rangeCrowd.value = String(Math.round(state.crowd * 100));
      if (rangeCrowdVal) rangeCrowdVal.textContent = `留白 ${ev.metrics.whitespacePct}%`;
    }

    ev.tipStates.forEach((ts, idx) => {
      const btn = tipBtns[idx];
      if (!btn) return;
      btn.dataset.ok = ts.ok ? "true" : "false";
      const tagEl = btn.querySelector(".tip-tag");
      if (tagEl) tagEl.textContent = ts.tag;
    });

    sceneBtns.forEach((b) => {
      const active = b.dataset.scene === state.scene;
      b.setAttribute("aria-pressed", String(active));
      b.classList.toggle("is-active", active);
    });
    stepBtns.forEach((b) => {
      const active = Number(b.dataset.workflowStep) === state.highlightStep;
      b.setAttribute("aria-pressed", String(active));
      b.classList.toggle("is-active", active);
    });
  }

  // ---------- 圆窗山水静态底图缓存（按题材+半径缓存一次，拖曳时零 clip 开销） ----------
  function ensureMedallionSprite(rad) {
    const key = `${state.scene}|${Math.round(rad)}|${dpr}`;
    if (key === medCacheKey) return;
    medCacheKey = key;
    const size = Math.ceil((rad + 14) * 2);
    medCanvas.width = Math.round(size * dpr);
    medCanvas.height = Math.round(size * dpr);
    medCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    medCtx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;

    medCtx.save();
    medCtx.beginPath();
    medCtx.arc(cx, cy, rad + 9, 0, Math.PI * 2);
    medCtx.setLineDash([5, 5]);
    medCtx.strokeStyle = "rgba(235, 223, 197, 0.45)";
    medCtx.lineWidth = 1.2;
    medCtx.stroke();
    medCtx.setLineDash([]);

    medCtx.beginPath();
    medCtx.arc(cx, cy, rad, 0, Math.PI * 2);
    medCtx.clip();

    const skyGrad = medCtx.createLinearGradient(cx, cy - rad, cx, cy + rad);
    if (state.scene === "tea") {
      skyGrad.addColorStop(0, "#3D7E69");
      skyGrad.addColorStop(0.55, "#84B89B");
      skyGrad.addColorStop(1, "#183D32");
    } else if (state.scene === "road") {
      skyGrad.addColorStop(0, "#2E6A60");
      skyGrad.addColorStop(0.5, "#6FB19B");
      skyGrad.addColorStop(1, "#103128");
    } else {
      skyGrad.addColorStop(0, "#4E9A80");
      skyGrad.addColorStop(0.52, "#97C59A");
      skyGrad.addColorStop(1, "#174236");
    }
    medCtx.fillStyle = skyGrad;
    medCtx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);

    medCtx.fillStyle = PAL.sun;
    medCtx.beginPath();
    medCtx.arc(cx + rad * 0.28, cy - rad * 0.32, rad * 0.17, 0, Math.PI * 2);
    medCtx.fill();

    medCtx.fillStyle = "rgba(239, 232, 163, 0.34)";
    medCtx.beginPath();
    medCtx.arc(cx - rad * 0.42, cy - rad * 0.12, rad * 0.24, 0, Math.PI * 2);
    medCtx.arc(cx - rad * 0.16, cy - rad * 0.16, rad * 0.22, 0, Math.PI * 2);
    medCtx.arc(cx + rad * 0.5, cy - rad * 0.08, rad * 0.24, 0, Math.PI * 2);
    medCtx.fill();

    medCtx.strokeStyle = "rgba(235, 223, 197, 0.78)";
    medCtx.lineWidth = 1.3;
    for (const [bx, by, bs] of [[-0.22, -0.5, 5], [-0.07, -0.42, 4]]) {
      const x0 = cx + rad * bx;
      const y0 = cy + rad * by;
      medCtx.beginPath();
      medCtx.moveTo(x0 - bs, y0 - bs * 0.3);
      medCtx.quadraticCurveTo(x0 - bs * 0.3, y0 - bs * 0.5, x0, y0);
      medCtx.quadraticCurveTo(x0 + bs * 0.3, y0 - bs * 0.5, x0 + bs, y0 - bs * 0.3);
      medCtx.stroke();
    }

    medCtx.fillStyle = PAL.peakMid;
    medCtx.beginPath();
    medCtx.moveTo(cx - rad, cy + rad * 0.28);
    medCtx.lineTo(cx - rad * 0.55, cy - rad * 0.22);
    medCtx.lineTo(cx - rad * 0.24, cy + rad * 0.06);
    medCtx.lineTo(cx + rad * 0.08, cy - rad * 0.34);
    medCtx.lineTo(cx + rad * 0.46, cy + rad * 0.12);
    medCtx.lineTo(cx + rad * 0.8, cy - rad * 0.14);
    medCtx.lineTo(cx + rad, cy + rad * 0.22);
    medCtx.lineTo(cx + rad, cy + rad);
    medCtx.lineTo(cx - rad, cy + rad);
    medCtx.closePath();
    medCtx.fill();

    medCtx.fillStyle = "rgba(235, 223, 197, 0.52)";
    medCtx.beginPath();
    medCtx.moveTo(cx + rad * 0.08, cy - rad * 0.34);
    medCtx.lineTo(cx + rad * 0.2, cy - rad * 0.12);
    medCtx.lineTo(cx + rad * 0.09, cy - rad * 0.16);
    medCtx.lineTo(cx + rad * 0.02, cy - rad * 0.08);
    medCtx.closePath();
    medCtx.fill();

    medCtx.fillStyle = "#1E5142";
    medCtx.beginPath();
    medCtx.moveTo(cx - rad, cy + rad * 0.14);
    medCtx.quadraticCurveTo(cx, cy + rad * 0.22, cx + rad, cy + rad * 0.12);
    medCtx.lineTo(cx + rad, cy + rad);
    medCtx.lineTo(cx - rad, cy + rad);
    medCtx.closePath();
    medCtx.fill();

    medCtx.fillStyle = "#08291E";
    for (const [tx, ty, th] of [
      [-0.78, 0.25, 0.22], [-0.56, 0.34, 0.18], [-0.36, 0.42, 0.14],
      [0.76, 0.26, 0.22], [0.54, 0.35, 0.18], [0.35, 0.43, 0.14],
    ]) {
      const px = cx + rad * tx;
      const py = cy + rad * ty;
      const h = rad * th * 1.65;
      medCtx.beginPath();
      medCtx.moveTo(px, py - h);
      medCtx.lineTo(px + rad * th * 0.55, py + h * 0.4);
      medCtx.lineTo(px - rad * th * 0.55, py + h * 0.4);
      medCtx.closePath();
      medCtx.fill();
    }
    medCtx.restore();
  }

  function drawIcon(c, icon, x, y, r, color) {
    c.save();
    c.translate(x, y);
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = Math.max(1.6, r * 0.14);
    c.lineCap = "round";
    c.lineJoin = "round";
    if (icon === "eye") {
      c.beginPath();
      c.moveTo(-r * 0.56, 0);
      c.quadraticCurveTo(0, -r * 0.52, r * 0.56, 0);
      c.quadraticCurveTo(0, r * 0.52, -r * 0.56, 0);
      c.stroke();
      c.beginPath();
      c.arc(0, 0, r * 0.19, 0, Math.PI * 2);
      c.fill();
    } else if (icon === "pulse") {
      c.beginPath();
      c.moveTo(-r * 0.54, r * 0.1);
      c.lineTo(-r * 0.26, r * 0.1);
      c.lineTo(-r * 0.1, -r * 0.42);
      c.lineTo(r * 0.12, r * 0.4);
      c.lineTo(r * 0.3, -r * 0.12);
      c.lineTo(r * 0.54, r * 0.1);
      c.stroke();
    } else if (icon === "wave") {
      for (const dy of [-r * 0.16, r * 0.16]) {
        c.beginPath();
        c.moveTo(-r * 0.46, dy);
        c.bezierCurveTo(-r * 0.18, dy - r * 0.28, r * 0.18, dy + r * 0.28, r * 0.46, dy);
        c.stroke();
      }
    } else {
      for (const dy of [-r * 0.28, 0, r * 0.28]) {
        c.beginPath();
        c.moveTo(0, dy - r * 0.16);
        c.lineTo(r * 0.48, dy);
        c.lineTo(0, dy + r * 0.16);
        c.lineTo(-r * 0.48, dy);
        c.closePath();
        if (dy === -r * 0.28) c.fill();
        else c.stroke();
      }
    }
    c.restore();
  }

  function drawArrowHead(c, x, y, tx, ty, size, color) {
    const ang = Math.atan2(ty, tx);
    c.save();
    c.translate(x, y);
    c.rotate(ang);
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(size * 0.9, 0);
    c.lineTo(-size * 0.6, -size * 0.55);
    c.lineTo(-size * 0.28, 0);
    c.lineTo(-size * 0.6, size * 0.55);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawPillTag(c, x, y, text, bg, border, fg) {
    c.save();
    c.font = '600 11.5px "Space Grotesk", "Noto Serif SC", sans-serif';
    const tw = c.measureText(text).width;
    const pw = tw + 18;
    const ph = 23;
    const px = clamp(x - pw / 2, 8, W - pw - 8);
    const py = clamp(y - ph / 2, 8, H - ph - 8);
    c.fillStyle = bg;
    c.strokeStyle = border;
    c.lineWidth = 1.25;
    c.beginPath();
    c.roundRect(px, py, pw, ph, 11.5);
    c.fill();
    c.stroke();
    c.fillStyle = fg;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(text, px + pw / 2, py + ph / 2 + 0.5);
    c.restore();
    return { x: px, y: py, w: pw, h: ph };
  }

  // 重建静态底图层（仅在状态变化时调用，用原生 bezierCurveTo 加速软渲染）
  function rebuildBg() {
    bgDirty = false;
    hitTargets = [];
    const c = bgCtx;
    const { sample, stations, blocks, checks, anchors } = ev;
    const { ctrl, pts } = sample;
    const isNarrow = W < 440;
    const stepHL = state.highlightStep;

    c.fillStyle = PAL.bg;
    c.fillRect(0, 0, W, H);

    // 经纬基准格（合并为单条路径一次 stroke！）
    c.strokeStyle = PAL.grid;
    c.lineWidth = 1;
    c.beginPath();
    for (let i = 1; i < 4; i++) {
      const gx = (W * i) / 4;
      const gy = (H * i) / 4;
      c.moveTo(gx, 14); c.lineTo(gx, H - 14);
      c.moveTo(14, gy); c.lineTo(W - 14, gy);
    }
    c.stroke();

    // 2. 岸边内容块
    const crowdBad = !checks.breathOk;
    for (const b of blocks) {
      const bx = toX(b.u);
      const by = toY(b.v);
      const bw = b.w * W;
      const bh = b.h * H;
      c.save();
      c.fillStyle = crowdBad
        ? "rgba(255, 134, 116, 0.11)"
        : stepHL === 4
          ? "rgba(191, 208, 91, 0.14)"
          : "rgba(9, 50, 37, 0.72)";
      c.strokeStyle = crowdBad
        ? "rgba(255, 134, 116, 0.65)"
        : stepHL === 4
          ? PAL.lime
          : "rgba(90, 209, 210, 0.24)";
      c.lineWidth = crowdBad || stepHL === 4 ? 1.3 : 1;
      if (crowdBad) c.setLineDash([4, 3]);
      c.beginPath();
      c.roundRect(bx, by, bw, bh, 8);
      c.fill();
      c.stroke();
      c.setLineDash([]);

      c.fillStyle = crowdBad ? "rgba(255, 190, 178, 0.85)" : "rgba(235, 223, 197, 0.78)";
      c.font = `600 ${isNarrow ? 10 : 11}px "Noto Serif SC", serif`;
      c.textAlign = "left";
      c.textBaseline = "top";
      c.fillText(b.title, bx + 9, by + 8);

      c.fillStyle = crowdBad ? "rgba(255, 134, 116, 0.42)" : "rgba(156, 181, 168, 0.35)";
      for (let li = 0; li < b.lines; li++) {
        const lw = bw - 18 - (li === 1 ? bw * 0.22 : 0);
        if (lw > 12) c.fillRect(bx + 9, by + 24 + li * 8, lw, 3);
      }
      c.restore();
    }

    // 3. 中央圆窗山水（从缓存 sprite 贴图 + 仅重绘两笔实时弯曲山溪）
    const medRad = clamp(Math.min(W, H) * 0.145, 42, 70);
    const medX = toX(ctrl.mid.u);
    const medY = toY(ctrl.mid.v);
    ensureMedallionSprite(medRad);
    const spriteSize = medCanvas.width / dpr;
    c.drawImage(medCanvas, medX - spriteSize / 2, medY - spriteSize / 2, spriteSize, spriteSize);

    // 圆窗内实时随 S 曲率摆动的山涧（两笔原生 bezier）
    const riverSwing = clamp((state.bendBot - state.bendTop) * 0.65, -0.5, 0.5) * medRad;
    c.save();
    c.lineCap = "round";
    for (const [lw, col] of [[medRad * 0.2, "rgba(90, 209, 210, 0.42)"], [medRad * 0.11, PAL.riverLight]]) {
      c.strokeStyle = col;
      c.lineWidth = lw;
      c.beginPath();
      c.moveTo(medX - riverSwing * 0.22, medY + medRad * 0.14);
      c.bezierCurveTo(
        medX - riverSwing * 0.82, medY + medRad * 0.36,
        medX + riverSwing * 0.9, medY + medRad * 0.62,
        medX - riverSwing * 0.1, medY + medRad * 0.94,
      );
      c.stroke();
    }
    c.restore();

    // 4. 发光水青—青柠双色 S 河道（主带使用原生两段 cubic bezier，伴随虚线抽样 40 点，极快！）
    const ribbonScale = clamp(Math.min(W, H) / 520, 0.72, 1.12);
    const baseW = (13 + state.crowd * 5) * ribbonScale;
    const isCurveBad = !checks.curveOk;
    const aquaMain = isCurveBad ? "#FF9A8B" : PAL.aqua;
    const limeMain = isCurveBad ? "#E8A66E" : PAL.lime;

    const strokeBezierMain = (dxOff, width, color) => {
      const [a0, a1, a2, m] = ctrl.seg1;
      const [, b1, b2, b3] = ctrl.seg2;
      c.strokeStyle = color;
      c.lineWidth = width;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(toX(a0.u) + dxOff, toY(a0.v));
      c.bezierCurveTo(toX(a1.u) + dxOff, toY(a1.v), toX(a2.u) + dxOff, toY(a2.v), toX(m.u) + dxOff, toY(m.v));
      c.bezierCurveTo(toX(b1.u) + dxOff, toY(b1.v), toX(b2.u) + dxOff, toY(b2.v), toX(b3.u) + dxOff, toY(b3.v));
      c.stroke();
    };

    strokeBezierMain(0, baseW * 2.1, isCurveBad ? "rgba(255, 134, 116, 0.14)" : PAL.aquaGlow);
    strokeBezierMain(-baseW * 0.28, baseW * 0.72, aquaMain);
    strokeBezierMain(baseW * 0.28, baseW * 0.56, limeMain);
    strokeBezierMain(0, Math.max(2, baseW * 0.16), "rgba(235, 223, 197, 0.65)");

    // 外伴随细虚线（隔 3 取 1 = 40 点，软渲染提速 3×）
    const dashStroke = (offsetPx, color, dash) => {
      c.save();
      c.strokeStyle = color;
      c.lineWidth = 1.25;
      c.setLineDash(dash);
      c.beginPath();
      for (let i = 0; i < pts.length; i += 3) {
        const p = pts[i];
        const x = toX(p.u) - p.ty * offsetPx;
        const y = toY(p.v) + p.tx * offsetPx;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      const lp = pts[pts.length - 1];
      c.lineTo(toX(lp.u) - lp.ty * offsetPx, toY(lp.v) + lp.tx * offsetPx);
      c.stroke();
      c.restore();
    };
    dashStroke(-baseW * 1.15, stepHL === 2 ? PAL.cream : "rgba(90, 209, 210, 0.55)", [5, 5]);
    dashStroke(baseW * 1.15, stepHL === 2 ? PAL.lime : "rgba(191, 208, 91, 0.50)", [4, 5]);

    // 5. 拐点锚
    if (ev.metrics.inflections === 1) {
      c.fillStyle = PAL.bg;
      c.strokeStyle = PAL.sun;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(toX(anchors.inflectionPt.u), toY(anchors.inflectionPt.v), 6, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }

    // 6. 入口箭 & 出口箭
    const entryPt = pts[0];
    drawArrowHead(c, toX(entryPt.u), toY(entryPt.v), entryPt.tx, entryPt.ty, 8, PAL.aqua);

    const exitPt = anchors.exitPt;
    const ex = toX(exitPt.u), ey = toY(exitPt.v);
    const rayX = toX(anchors.rayEnd.u), rayY = toY(anchors.rayEnd.v);
    c.save();
    c.strokeStyle = checks.exitOk ? PAL.lime : PAL.err;
    c.lineWidth = 2;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(ex, ey);
    c.lineTo(rayX, rayY);
    c.stroke();
    c.restore();
    drawArrowHead(c, rayX, rayY, exitPt.tx, exitPt.ty, 9, checks.exitOk ? PAL.lime : PAL.err);

    hitTargets.push({ kind: "exit", x: rayX, y: rayY, r: 24 });
    if (!checks.exitOk) {
      const tagX = rayX > W * 0.5 ? clamp(rayX - 110, 88, W - 88) : clamp(rayX + 110, 88, W - 88);
      const tagY = clamp(H - 22, 28, H - 18);
      const tagBox = drawPillTag(c, tagX, tagY, "× 出口甩飞 · 点此收束", "rgba(70, 18, 14, 0.94)", PAL.err, "#FFD6CF");
      hitTargets.push({ kind: "fix-exit", rect: tagBox });
    }

    // 7. 上下弯脊雕塑手柄
    for (const h of [
      { kind: "topHandle", pt: anchors.topHandle, color: PAL.aqua },
      { kind: "botHandle", pt: anchors.botHandle, color: PAL.lime },
    ]) {
      const hx = toX(h.pt.u), hy = toY(h.pt.v);
      const isActive = dragMode === h.kind || hoveredHit === h.kind;
      c.fillStyle = PAL.bg;
      c.strokeStyle = isCurveBad ? PAL.err : h.color;
      c.lineWidth = isActive ? 3 : 2;
      c.beginPath();
      c.arc(hx, hy, isActive ? 11 : 9, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillStyle = isCurveBad ? PAL.err : h.color;
      c.beginPath();
      c.arc(hx, hy, 3.2, 0, Math.PI * 2);
      c.fill();
      hitTargets.push({ kind: h.kind, x: hx, y: hy, r: 24 });
    }

    // 8. 四枚圆徽信息站
    const badgeR = clamp(Math.min(W, H) * 0.045, H < 340 ? 15 : 17, 22);
    for (const st of stations) {
      const sx = toX(st.u), sy = toY(st.v);
      const isBad = !st.attached;
      const toneCol = isBad ? PAL.err : st.tone === "aqua" ? PAL.aqua : PAL.lime;
      const isHL = stepHL === 3 || (stepHL === 1 && (st.idx === 0 || st.idx === 3));

      if (isBad) {
        const nx = toX(st.nearestPt.u), ny = toY(st.nearestPt.v);
        c.save();
        c.strokeStyle = PAL.err;
        c.lineWidth = 1.6;
        c.setLineDash([5, 4]);
        c.beginPath();
        c.moveTo(sx, sy);
        c.lineTo(nx, ny);
        c.stroke();
        c.beginPath();
        c.arc(nx, ny, badgeR * 0.72, 0, Math.PI * 2);
        c.strokeStyle = "rgba(191, 208, 91, 0.8)";
        c.setLineDash([3, 3]);
        c.stroke();
        c.restore();
      }

      c.save();
      c.beginPath();
      c.arc(sx, sy, badgeR + (isHL ? 7 : 5), 0, Math.PI * 2);
      c.strokeStyle = isHL ? PAL.cream : toneCol;
      c.lineWidth = isHL ? 2 : 1.3;
      if (isBad) c.setLineDash([4, 3]);
      c.stroke();
      c.setLineDash([]);

      c.fillStyle = toneCol;
      c.beginPath();
      c.arc(sx, sy, badgeR, 0, Math.PI * 2);
      c.fill();
      drawIcon(c, st.icon, sx, sy, badgeR * 0.85, "#042318");

      c.fillStyle = PAL.bg;
      c.strokeStyle = toneCol;
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(sx - badgeR * 0.78, sy - badgeR * 0.78, 8.5, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillStyle = PAL.cream;
      c.font = '600 10px "IBM Plex Mono", monospace';
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(String(st.idx + 1), sx - badgeR * 0.78, sy - badgeR * 0.78 + 0.5);

      const preferRight = st.idx === 0
        ? sx < W * 0.36
        : st.idx === 2
          ? sx >= medX - 10 && sx < W * 0.76
          : sx < W * 0.48;
      const cnFont = `700 ${isNarrow ? 11.5 : 13}px "Noto Serif SC", serif`;
      const enFont = `500 ${isNarrow ? 9.5 : 10}px "Space Grotesk", sans-serif`;
      const subText = isBad ? "脱轨 · 拖回河道" : st.en;
      c.font = cnFont;
      const wCn = c.measureText(st.name).width;
      c.font = enFont;
      const wEn = c.measureText(subText).width;
      const boxW = Math.max(wCn, wEn) + 14;
      const boxH = isNarrow ? 28 : 31;
      const rawBx = preferRight ? sx + badgeR + 10 : sx - badgeR - 10 - boxW;
      const bx = clamp(rawBx, 8, W - boxW - 8);
      const by = clamp(sy - boxH / 2, 10, H - boxH - 10);

      c.fillStyle = "rgba(4, 35, 24, 0.88)";
      c.strokeStyle = isBad ? "rgba(255, 134, 116, 0.55)" : "rgba(35, 87, 70, 0.85)";
      c.lineWidth = 1;
      c.beginPath();
      c.roundRect(bx, by, boxW, boxH, 7);
      c.fill();
      c.stroke();

      c.textAlign = preferRight ? "left" : "right";
      c.textBaseline = "middle";
      const txPos = preferRight ? bx + 7 : bx + boxW - 7;
      c.fillStyle = isBad ? "#FFD6CF" : PAL.cream;
      c.font = cnFont;
      c.fillText(st.name, txPos, by + boxH * 0.34);
      c.fillStyle = isBad ? PAL.err : toneCol;
      c.font = enFont;
      c.fillText(subText, txPos, by + boxH * 0.74);
      c.restore();

      hitTargets.push({ kind: `node-${st.idx}`, idx: st.idx, x: sx, y: sy, r: badgeR + 12 });

      if (isBad) {
        const box = drawPillTag(
          c,
          clamp(sx, 82, W - 82),
          clamp(sy + badgeR + 22, 24, H - 28),
          `× 脱轨 ${Math.round(st.distToCurve * 100)}% · 点此归脊`,
          "rgba(70, 18, 14, 0.94)",
          PAL.err,
          "#FFD6CF",
        );
        hitTargets.push({ kind: `fix-node-${st.idx}`, idx: st.idx, rect: box });
      }
    }

    // 9. 顶角实况标
    const topLeftTxt = `${ev.metrics.inflections === 1 ? "双反弯 S" : "无拐点单弧"} · 摆幅 ${ev.metrics.avgSwingPct}%`;
    drawPillTag(
      c,
      clamp(92, 80, W * 0.42),
      22,
      topLeftTxt,
      "rgba(6, 36, 25, 0.88)",
      checks.curveOk ? "rgba(90, 209, 210, 0.55)" : "rgba(255, 134, 116, 0.7)",
      PAL.cream,
    );

    if (crowdBad) {
      const box = drawPillTag(
        c,
        W - 92,
        22,
        `留白 ${ev.metrics.whitespacePct}% · 点此松岸`,
        "rgba(70, 18, 14, 0.94)",
        PAL.err,
        "#FFD6CF",
      );
      hitTargets.push({ kind: "fix-crowd", rect: box });
    }
  }

  // 主动画帧：静置仅 1 次 drawImage + 5 粒光点（6 次调用！），拖曳合并单帧
  function drawFrame(t, _dt, { still }) {
    syncUI();
    if (bgDirty) rebuildBg();

    // 贴出已缓存的整幅静态河道层（整数坐标，零缩放插值开销）
    ctx.drawImage(bgCanvas, 0, 0, W, H);

    const { sample, checks } = ev;
    const pCount = W < 440 ? 5 : 7;
    const speedMul = checks.curveOk ? 0.15 : 0.08;
    if (still) {
      for (let i = 0; i < pCount; i++) {
        const p = pointAt(sample.ctrl, (i + 0.5) / pCount);
        drawArrowHead(ctx, toX(p.u), toY(p.v), p.tx, p.ty, 5.5, PAL.cream);
      }
    } else {
      ctx.fillStyle = PAL.cream;
      ctx.beginPath();
      for (let i = 0; i < pCount; i++) {
        const frac = ((i / pCount) + t * speedMul) % 1;
        const p = pointAt(sample.ctrl, frac);
        const px = toX(p.u);
        const py = toY(p.v);
        ctx.moveTo(px + 3.1, py);
        ctx.arc(px, py, 3.1, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }

  let rafLoop = null;
  function markDirty() {
    uiDirty = true;
    bgDirty = true;
    // 仅在静态模式下手动触发单帧；动画运转中由 rAF 每帧合并一次绘制，绝不双画！
    if (reducedMotion.matches) rafLoop?.draw();
  }

  function hitTest(x, y) {
    for (let i = hitTargets.length - 1; i >= 0; i--) {
      const h = hitTargets[i];
      if (h.rect && x >= h.rect.x && x <= h.rect.x + h.rect.w && y >= h.rect.y && y <= h.rect.y + h.rect.h) {
        return h;
      }
    }
    for (let i = hitTargets.length - 1; i >= 0; i--) {
      const h = hitTargets[i];
      if (h.r && Math.hypot(x - h.x, y - h.y) <= h.r) return h;
    }
    return null;
  }

  function localPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function applyDrag(x, y) {
    if (!dragMode || !dragStart) return;
    const u = toU(x);
    const v = toV(y);

    if (dragMode === "canvas") {
      const dxNorm = (x - dragStart.x) / Math.max(220, W);
      const signTop = dragStart.bendTop === 0 ? -1 : Math.sign(dragStart.bendTop);
      const signBot = dragStart.bendBot === 0 ? 1 : Math.sign(dragStart.bendBot);
      state.bendTop = signTop * clamp(Math.abs(dragStart.bendTop) + dxNorm * 0.55, 0.03, 0.45);
      state.bendBot = signBot * clamp(Math.abs(dragStart.bendBot) + dxNorm * 0.55, 0.03, 0.45);
    } else if (dragMode === "topHandle") {
      let raw = clamp((u - 0.5) * 1.15, -0.45, 0.45);
      if (Math.abs(Math.abs(raw) - 0.24) < 0.015) raw = Math.sign(raw) * 0.24;
      state.bendTop = raw;
    } else if (dragMode === "botHandle") {
      let raw = clamp((u - 0.5) * 1.15, -0.45, 0.45);
      if (Math.abs(Math.abs(raw) - 0.24) < 0.015) raw = Math.sign(raw) * 0.24;
      state.bendBot = raw;
    } else if (dragMode === "exit") {
      const signBot = state.bendBot === 0 ? 1 : Math.sign(state.bendBot);
      state.exitPull = clamp((0.5 - u) * signBot * 2.4, -0.95, 0.9);
    } else if (dragMode.startsWith("node-")) {
      const idx = Number(dragMode.split("-")[1]);
      const sample = ev.sample;
      const base = pointAt(sample.ctrl, state.nodes[idx].t);
      let bestDist = Infinity, bestT = state.nodes[idx].t;
      for (const p of sample.pts) {
        const d = Math.hypot(u - p.u, v - p.v);
        if (d < bestDist) { bestDist = d; bestT = p.t; }
      }
      if (bestDist < 0.068) {
        state.nodes[idx].t = clamp(bestT, 0.05, 0.95);
        state.nodes[idx].offU = 0;
        state.nodes[idx].offV = 0;
      } else {
        state.nodes[idx].offU = clamp(u - base.u, -0.45, 0.45);
        state.nodes[idx].offV = clamp(v - base.v, -0.35, 0.35);
      }
    }
    markDirty();
  }

  function handleQuickFix(kind, idx) {
    if (kind === "fix-exit") state.exitPull = 0.56;
    else if (kind === "fix-crowd") state.crowd = 0.22;
    else if (kind.startsWith("fix-node-")) {
      state.nodes[idx].offU = 0;
      state.nodes[idx].offV = 0;
    }
    markDirty();
    syncUI();
  }

  let touchLock = null;
  let activePointerId = null;

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    const { x, y } = localPos(e.clientX, e.clientY);
    const hit = hitTest(x, y);
    if (hit && hit.kind.startsWith("fix-")) {
      handleQuickFix(hit.kind, hit.idx);
      return;
    }
    dragMode = hit ? hit.kind : "canvas";
    dragStart = { x, y, bendTop: state.bendTop, bendBot: state.bendBot };
    activePointerId = e.pointerId;
    canvas.setPointerCapture?.(e.pointerId);
    canvas.style.cursor = "grabbing";
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const { x, y } = localPos(e.clientX, e.clientY);
    if (dragMode && activePointerId === e.pointerId) {
      applyDrag(x, y);
      return;
    }
    const hit = hitTest(x, y);
    const nextHover = hit ? hit.kind : null;
    if (nextHover !== hoveredHit) {
      hoveredHit = nextHover;
      bgDirty = true;
    }
    canvas.style.cursor = hit ? (hit.kind.startsWith("fix-") ? "pointer" : "grab") : "ew-resize";
  });

  const endPointer = (e) => {
    if (activePointerId !== null && e.pointerId === activePointerId) {
      dragMode = null;
      dragStart = null;
      activePointerId = null;
      canvas.style.cursor = "ew-resize";
      syncUI();
    }
  };
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const { x, y } = localPos(touch.clientX, touch.clientY);
    const hit = hitTest(x, y);
    if (hit && hit.kind.startsWith("fix-")) {
      e.preventDefault();
      handleQuickFix(hit.kind, hit.idx);
      return;
    }
    dragMode = hit ? hit.kind : "canvas";
    touchLock = hit ? "h" : null;
    dragStart = { x, y, bendTop: state.bendTop, bendBot: state.bendBot };
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    if (!dragMode || !dragStart || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const { x, y } = localPos(touch.clientX, touch.clientY);
    if (touchLock === null) {
      const dx = Math.abs(x - dragStart.x);
      const dy = Math.abs(y - dragStart.y);
      if (dx < 3 && dy < 3) return;
      touchLock = dx >= dy ? "h" : "v";
    }
    if (touchLock === "h") {
      e.preventDefault();
      applyDrag(x, y);
    }
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    dragMode = null;
    dragStart = null;
    touchLock = null;
    syncUI();
  });

  canvas.addEventListener("keydown", (e) => {
    const step = 0.02;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const delta = e.key === "ArrowRight" ? step : -step;
      const st = state.bendTop === 0 ? -1 : Math.sign(state.bendTop);
      const sb = state.bendBot === 0 ? 1 : Math.sign(state.bendBot);
      state.bendTop = st * clamp(Math.abs(state.bendTop) + delta, 0.03, 0.45);
      state.bendBot = sb * clamp(Math.abs(state.bendBot) + delta, 0.03, 0.45);
      markDirty();
      syncUI();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      state.crowd = clamp(state.crowd + (e.key === "ArrowUp" ? -0.06 : 0.06), 0, 1);
      markDirty();
      syncUI();
    }
  });

  sceneBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.scene = btn.dataset.scene;
      markDirty();
      syncUI();
    });
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = PRESETS[btn.dataset.preset];
      if (!p) return;
      Object.assign(state, clonePreset(p));
      markDirty();
      syncUI();
    });
  });

  tipBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const fix = btn.dataset.tipFix;
      if (fix === "exit") {
        state.exitPull = ev.checks.exitOk ? -0.78 : 0.56;
      } else if (fix === "curve") {
        if (ev.checks.curveOk) {
          state.bendTop = -0.43;
          state.bendBot = 0.16;
        } else {
          const sign = state.bendTop > 0 ? 1 : -1;
          state.bendTop = sign * 0.24;
          state.bendBot = -sign * 0.24;
        }
      } else if (fix === "nodes") {
        if (ev.checks.nodesOk) {
          state.nodes[1].offU = 0.33;
          state.nodes[1].offV = -0.05;
        } else {
          PRESETS.classic.nodes.forEach((n, i) => {
            state.nodes[i] = { ...n };
          });
        }
      } else if (fix === "breath") {
        state.crowd = ev.checks.breathOk ? 0.84 : 0.22;
      }
      markDirty();
      syncUI();
    });
  });

  rangeAmp?.addEventListener("input", () => {
    const val = Number(rangeAmp.value) / 100;
    const sTop = state.bendTop === 0 ? -1 : Math.sign(state.bendTop);
    const sBot = state.bendBot === 0 ? 1 : Math.sign(state.bendBot);
    state.bendTop = sTop * val;
    state.bendBot = sBot * val;
    markDirty();
    syncUI();
  });

  rangeCrowd?.addEventListener("input", () => {
    state.crowd = clamp(Number(rangeCrowd.value) / 100, 0, 1);
    markDirty();
    syncUI();
  });

  stepBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const s = Number(btn.dataset.workflowStep);
      state.highlightStep = state.highlightStep === s ? 0 : s;
      markDirty();
      syncUI();
    });
  });

  window.addEventListener("resize", () => {
    measureCanvas();
    markDirty();
  });

  measureCanvas();
  syncUI();
  rafLoop = loop(canvas, drawFrame);
  rafLoop.draw();

  return { state, getEval: () => ev };
}

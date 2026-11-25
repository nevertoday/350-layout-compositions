// 125 疏密对比原则 · 无框暖纸活体疏密粒子场 (Canvas 2D)
// 1:1 承袭原海报五色点阵 + 虚线折箭实况浮标 + 下方横向密度剖面波
// 兼容鼠标、触屏（纵向可滚动、横向与按压交互顺畅）、键盘与 prefers-reduced-motion

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE, colorForDensity } from "./palette.js";
import {
  CARRIERS,
  PRESETS,
  REF_ASPECT,
  TOOLS,
  analyzeField,
  applyBrush,
  clamp,
  createParticles,
  nudgeFocus,
  relaxParticles,
} from "./model.js";

const TYPE_GLYPHS = [
  "密", "疏", "顿", "挫", "留", "白", "聚", "散", "张", "弛",
  "节", "奏", "呼", "吸", "重", "心", "轻", "重", "主", "次",
  "层", "次", "余", "韵", "序", "列", "空", "间", "韵", "律",
];

export function initHero() {
  const canvas = document.getElementById("density-canvas");
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");

  const init = createParticles("uniform");
  const state = {
    particles: init.particles,
    dotScale: init.dotScale,
    carrier: "dots",
    tool: "attract",
    preset: "uniform",
    showCallouts: true,
    animatingPreset: false,
    // 交互笔刷实时坐标
    pointer: { active: false, u: 0.25, v: 0.5, prevU: 0.25, radiusPulse: 0 },
    metrics: null,
    dirty: true,
    // 开场细腻的呼吸波纹入场（0 → 1）
    intro: reducedMotion.matches ? 1 : 0,
  };

  // DOM 联动句柄
  const els = {
    badge: document.getElementById("hero-status-badge"),
    ratioChip: document.getElementById("hero-ratio-chip"),
    headline: document.getElementById("verdict-headline"),
    body: document.getElementById("verdict-body"),
    hint: document.getElementById("verdict-hint"),
    verdictBox: document.getElementById("verdict-box"),
    verdictIcon: document.getElementById("verdict-icon"),
    scaleSlider: document.getElementById("scale-slider"),
    scaleValue: document.getElementById("scale-value"),
    toolHint: document.getElementById("tool-hint"),
    calloutToggle: document.getElementById("callout-toggle"),
    // 四柱实况
    pDenseVal: document.getElementById("pillar-dense-val"),
    pDenseNote: document.getElementById("pillar-dense-note"),
    pSparseVal: document.getElementById("pillar-sparse-val"),
    pSparseNote: document.getElementById("pillar-sparse-note"),
    pRhythmVal: document.getElementById("pillar-rhythm-val"),
    pRhythmNote: document.getElementById("pillar-rhythm-note"),
    pFocalVal: document.getElementById("pillar-focal-val"),
    pFocalNote: document.getElementById("pillar-focal-note"),
  };

  let cssW = 800;
  let cssH = 380;
  let lastReportAt = 0;

  function activeDpr() {
    // 手机竖屏与窄屏限定 1.5× 像素比，锐利同时大幅减轻软件渲染负载
    return pixelRatio(cssW <= 640 ? 1.5 : 2);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    cssW = rect.width;
    cssH = rect.height;
    const dpr = activeDpr();
    const pw = Math.max(1, Math.round(cssW * dpr));
    const ph = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    state.dirty = true;
  }

  // 把归一化坐标 (u, v) 映射到画布上部粒子场区域（顶留独立浮标呼吸带，绝不遮挡首行圆点）
  function fieldBox() {
    const padX = Math.max(14, cssW * 0.025);
    const topPad = cssH < 260 ? 28 : 34;
    const waveH = Math.max(52, Math.min(68, cssH * 0.19));
    const fieldH = Math.max(115, cssH - topPad - waveH - 10);
    const fieldW = Math.max(160, cssW - padX * 2);
    return { x: padX, y: topPad, w: fieldW, h: fieldH, waveY: topPad + fieldH + 10, waveH };
  }

  function clientToField(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const lx = clientX - rect.left;
    const ly = clientY - rect.top;
    const fb = fieldBox();
    return {
      u: clamp((lx - fb.x) / fb.w, 0.02, 0.98),
      v: clamp((ly - fb.y) / fb.h, 0.04, 0.96),
      inField: ly <= fb.y + fb.h + 18,
    };
  }

  function updateUI(force = false) {
    const now = performance.now();
    if (!force && now - lastReportAt < 180) return;
    lastReportAt = now;
    const m = state.metrics || analyzeField(state.particles, state.dotScale);
    state.metrics = m;

    if (els.badge) {
      els.badge.textContent = m.badge;
      els.badge.dataset.state = m.status;
    }
    if (els.ratioChip) {
      els.ratioChip.textContent = `落差 ${m.contrastRatio.toFixed(1)}× · 留白 ${m.sparsePct}%`;
    }
    if (els.headline) els.headline.textContent = m.headline;
    if (els.body) els.body.textContent = m.body;
    if (els.hint) els.hint.textContent = m.actionHint;
    if (els.verdictBox) els.verdictBox.dataset.state = m.status;
    if (els.verdictIcon) {
      els.verdictIcon.textContent = m.status === "balanced" ? "✓" : "!";
      els.verdictIcon.dataset.state = m.status;
    }

    const setPillar = (valEl, noteEl, data) => {
      if (valEl) {
        valEl.textContent = data.value;
        valEl.dataset.tone = data.tone;
      }
      if (noteEl) noteEl.textContent = data.note;
    };
    setPillar(els.pDenseVal, els.pDenseNote, m.pillars.dense);
    setPillar(els.pSparseVal, els.pSparseNote, m.pillars.sparse);
    setPillar(els.pRhythmVal, els.pRhythmNote, m.pillars.rhythm);
    setPillar(els.pFocalVal, els.pFocalNote, m.pillars.focal);

    if (els.scaleSlider && Math.abs(parseFloat(els.scaleSlider.value) - state.dotScale) > 0.01) {
      els.scaleSlider.value = state.dotScale.toFixed(2);
    }
    if (els.scaleValue) {
      els.scaleValue.textContent = `${state.dotScale.toFixed(2)}×`;
    }

    // 同步按钮高亮
    document.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.preset === state.preset ? "true" : "false");
    });
    document.querySelectorAll("[data-tool]").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.tool === state.tool ? "true" : "false");
    });
    document.querySelectorAll("[data-carrier]").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.carrier === state.carrier ? "true" : "false");
    });
    if (els.toolHint && TOOLS[state.tool]) {
      els.toolHint.textContent = TOOLS[state.tool].verb;
    }
  }

  function applyPreset(presetId, instant = false) {
    const def = PRESETS[presetId];
    if (!def) return;
    const { points, dotScale } = def.build();
    state.preset = presetId;
    state.dotScale = dotScale;
    const skipAnim = instant || reducedMotion.matches;
    for (let i = 0; i < state.particles.length; i++) {
      const p = state.particles[i];
      const tgt = points[i % points.length];
      p.tu = tgt.u;
      p.tv = tgt.v;
      if (skipAnim) {
        p.u = tgt.u;
        p.v = tgt.v;
      }
    }
    state.animatingPreset = !skipAnim;
    state.metrics = analyzeField(state.particles, state.dotScale);
    state.dirty = true;
    updateUI(true);
    runner.draw();
  }

  // ---------- 绘制粒子场 + 虚线折箭 + 底部实时密度剖面波 ----------
  function drawScene(t, dt, { still }) {
    if (!cssW || !cssH) resize();
    const dpr = activeDpr();
    const w = canvas.width;
    const h = canvas.height;
    if (!w || !h) return;

    // 1. 更新开场入场与预设弹簧过渡或持续笔刷物理
    let moved = false;
    if (!still && state.intro < 1) {
      state.intro = Math.min(1, state.intro + Math.max(0.02, dt * 1.9));
      moved = true;
    } else if (still) {
      state.intro = 1;
    }

    if (state.animatingPreset) {
      const k = still ? 1 : Math.min(1, Math.max(0.12, dt * 10));
      let maxDelta = 0;
      for (let i = 0; i < state.particles.length; i++) {
        const p = state.particles[i];
        const du = p.tu - p.u;
        const dv = p.tv - p.v;
        p.u += du * k;
        p.v += dv * k;
        const d = Math.abs(du) + Math.abs(dv);
        if (d > maxDelta) maxDelta = d;
      }
      moved = true;
      if (maxDelta < 0.0018 || still) {
        for (let i = 0; i < state.particles.length; i++) {
          state.particles[i].u = state.particles[i].tu;
          state.particles[i].v = state.particles[i].tv;
        }
        state.animatingPreset = false;
      }
    }

    if (state.pointer.active && !still) {
      applyBrush(
        state.particles,
        state.tool,
        state.pointer.u,
        state.pointer.v,
        state.pointer.prevU,
        state.dotScale,
        dt || 0.016
      );
      state.pointer.prevU = state.pointer.u;
      state.pointer.radiusPulse = (state.pointer.radiusPulse + dt * 3.5) % (Math.PI * 2);
      moved = true;
    }

    if (!moved && !state.dirty && state.metrics) return;
    state.dirty = false;

    const m = analyzeField(state.particles, state.dotScale);
    state.metrics = m;
    if (moved) updateUI(false);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 纸面底色（与页面暖象牙原纸无缝融合，无任何黑框）
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, cssW, cssH);

    const fb = fieldBox();

    // 极微弱的排版参考网格线（像版面草图底稿，不抢眼）
    ctx.strokeStyle = "rgba(21, 45, 91, 0.055)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 1; c < 12; c++) {
      const gx = Math.round(fb.x + (fb.w * c) / 12) + 0.5;
      ctx.moveTo(gx, fb.y);
      ctx.lineTo(gx, fb.y + fb.h);
    }
    ctx.stroke();

    // 等比粒子尺寸：严格取 min(fb.w / REF_ASPECT, fb.h)，保证任何屏幕圆点都是正圆
    const unit = Math.min(fb.w / REF_ASPECT, fb.h);
    const dotR = clamp(unit * 0.044 * state.dotScale, 5.2, 26);

    // 2. 若正在拖抹，先画柔和的引力/风散场环
    if (state.pointer.active) {
      const px = fb.x + state.pointer.u * fb.w;
      const py = fb.y + state.pointer.v * fb.h;
      const ringR = clamp(unit * 0.28, 34, 88);
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, ringR, 0, Math.PI * 2);
      ctx.fillStyle = state.tool === "repel"
        ? "rgba(234, 86, 4, 0.07)"
        : "rgba(21, 45, 91, 0.07)";
      ctx.fill();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = state.tool === "repel" ? PALETTE.orange : PALETTE.navy;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }

    // 3. 绘制 60 枚活体元素（五色圆点按 10 级密度色桶合批绘制，丝滑渐变同时大幅降低软件渲染绘制次数）
    const introEase = 1 - Math.pow(1 - state.intro, 3);
    if (state.carrier === "dots") {
      const BUCKETS = 10;
      const groups = Array.from({ length: BUCKETS }, () => []);
      for (let i = 0; i < state.particles.length; i++) {
        const p = state.particles[i];
        const b = Math.min(BUCKETS - 1, Math.floor(p.normDensity * BUCKETS));
        groups[b].push(i);
      }
      for (let b = 0; b < BUCKETS; b++) {
        const list = groups[b];
        if (!list.length) continue;
        ctx.fillStyle = colorForDensity((b + 0.5) / BUCKETS, m.differentiation);
        ctx.beginPath();
        for (let k = 0; k < list.length; k++) {
          const idx = list[k];
          const p = state.particles[idx];
          const cx = fb.x + p.u * fb.w;
          const cy = fb.y + p.v * fb.h;
          const localIntro = introEase >= 0.999 ? 1 : clamp((introEase - (idx % 12) * 0.025) / 0.72, 0.35, 1);
          const r = dotR * localIntro;
          ctx.moveTo(cx + r, cy);
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    } else {
      const order = state.particles.map((_, i) => i).sort(
        (a, b) => state.particles[a].density - state.particles[b].density
      );
      for (let oi = 0; oi < order.length; oi++) {
        const idx = order[oi];
        const p = state.particles[idx];
        const cx = fb.x + p.u * fb.w;
        const cy = fb.y + p.v * fb.h;
        const localIntro = introEase >= 0.999 ? 1 : clamp((introEase - (idx % 12) * 0.025) / 0.72, 0.35, 1);
        const r = dotR * localIntro;
        const fill = colorForDensity(p.normDensity, m.differentiation);

        if (state.carrier === "type") {
          const bw = r * (p.normDensity > 0.55 ? 2.1 : 1.75);
          const bh = r * (p.normDensity > 0.55 ? 1.55 : 1.15);
          ctx.fillStyle = fill;
          ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
          if (r >= 8.5) {
            ctx.fillStyle = p.normDensity > 0.38 ? "#FCFBF4" : "#152D5B";
            ctx.font = `700 ${Math.round(clamp(r * 0.92, 9, 15))}px "Noto Sans SC", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(TYPE_GLYPHS[idx % TYPE_GLYPHS.length], cx, cy + 0.5);
          }
        } else {
          ctx.fillStyle = fill;
          if (idx % 5 === 0) {
            ctx.beginPath();
            ctx.arc(cx, cy, r * 1.05, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.44, 0, Math.PI * 2);
            ctx.fillStyle = PALETTE.paper;
            ctx.fill();
          } else if (idx % 5 === 1) {
            const rw = r * 2.2;
            const rh = r * 1.15;
            roundRect(ctx, cx - rw / 2, cy - rh / 2, rw, rh, rh / 2);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // 4. 原海报同款「虚线折箭实况浮标」（轻量标示当前密核与呼吸空区）
    if (state.showCallouts && cssW >= 340) {
      drawCallouts(ctx, fb, m, dotR);
    }

    // 5. 底部 12 段实时横向密度剖面波 + 原海报「密集 DENSE ━━━━→ 稀疏 SPARSE」长箭
    drawDensityRibbon(ctx, fb, m);

    ctx.restore();
  }

  function drawCallouts(ctx, fb, m, dotR) {
    ctx.save();
    ctx.font = `600 11px "Noto Sans SC", sans-serif`;

    // 当为均质/窒息时，在顶沿专属留白带画横向均质虚线标尺，绝不碰触圆点
    if (m.status === "uniform" || m.status === "crowded") {
      const y = Math.max(14, fb.y - 16);
      ctx.strokeStyle = "rgba(180, 35, 24, 0.5)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(fb.x + 12, y);
      ctx.lineTo(fb.x + fb.w - 12, y);
      ctx.stroke();
      ctx.setLineDash([]);
      const label = m.status === "uniform"
        ? "全幅等距均铺 · 按住纸面拖动聚出重心"
        : `留白仅 ${m.sparsePct}% · 用「风散」拨出呼吸区`;
      const tw = ctx.measureText(label).width + 16;
      const bx = fb.x + (fb.w - tw) / 2;
      ctx.fillStyle = "#FCFBF4";
      ctx.fillRect(bx, y - 10, tw, 20);
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, y - 10, tw, 20);
      ctx.fillStyle = PALETTE.warn;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, fb.x + fb.w / 2, y);
      ctx.restore();
      return;
    }

    // 密核虚线折箭
    const fx = fb.x + m.focalPos.u * fb.w;
    const fy = fb.y + m.focalPos.v * fb.h;
    drawOneCallout(ctx, fb, fx, fy, `密核 · 重心`, PALETTE.navy, dotR + 6, true);

    // 若留白足够，画出呼吸区虚线折箭
    if (m.sparsePct >= 18) {
      const sx = fb.x + m.sparsePos.u * fb.w;
      const sy = fb.y + m.sparsePos.v * fb.h;
      if (Math.hypot(sx - fx, sy - fy) > 100) {
        drawOneCallout(ctx, fb, sx, sy, `呼吸区 ${m.sparsePct}%`, PALETTE.green, 12, false);
      }
    }
    ctx.restore();
  }

  function drawOneCallout(ctx, fb, tx, ty, text, color, offset, isFocal) {
    const pad = 8;
    const tw = ctx.measureText(text).width + pad * 2;
    const th = 20;
    const goRight = tx < fb.x + fb.w * 0.52;
    const goDown = ty < fb.y + fb.h * 0.34;
    const lx = clamp(goRight ? tx + offset + 22 : tx - offset - 22 - tw, fb.x + 4, fb.x + fb.w - tw - 4);
    const ly = clamp(goDown ? ty + offset + 12 : ty - offset - 12 - th, fb.y + 4, fb.y + fb.h - th - 4);
    const anchorX = goRight ? lx : lx + tw;
    const anchorY = ly + th / 2;

    // 虚线折箭（原海报同款视觉母题）
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.25;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.lineTo(tx, anchorY);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);

    // 末端小实心圆锚
    ctx.beginPath();
    ctx.arc(tx, ty, isFocal ? 4.2 : 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = PALETTE.paper;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 纸面胶囊底签
    ctx.fillStyle = "rgba(252, 251, 244, 0.94)";
    ctx.fillRect(lx, ly, tw, th);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.1;
    ctx.strokeRect(lx, ly, tw, th);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, lx + tw / 2, ly + th / 2 + 0.5);
  }

  function drawDensityRibbon(ctx, fb, m) {
    const ry = fb.waveY;
    const rh = fb.waveH;
    const barAreaH = Math.max(22, rh - 26);
    const cols = m.profile12.length;
    const colW = fb.w / cols;
    const maxRef = 6.2;

    // 12 段柱状 + 平滑密度曲线（实时呈现是「一条死平线」还是「高低起伏的韵律波」）
    const pts = [];
    for (let i = 0; i < cols; i++) {
      const val = m.profile12[i];
      const norm = clamp(val / maxRef, 0.04, 1);
      const bh = norm * barAreaH;
      const x = fb.x + i * colW;
      const y = ry + barAreaH - bh;
      ctx.fillStyle = colorForDensity(norm, m.differentiation);
      ctx.globalAlpha = 0.24;
      ctx.fillRect(x + 2, y, Math.max(2, colW - 4), bh);
      ctx.globalAlpha = 1;
      pts.push({ x: x + colW / 2, y });
    }

    // 平滑折线包络
    ctx.beginPath();
    pts.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else {
        const prev = pts[idx - 1];
        const mx = (prev.x + pt.x) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, mx, (prev.y + pt.y) / 2);
      }
    });
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.strokeStyle = m.status === "balanced" ? PALETTE.navy : PALETTE.orange;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 原海报同款底部标尺长箭：左「密集 DENSE」━━━━━━━━→ 右「稀疏 SPARSE」
    const arrowY = ry + barAreaH + 14;
    const compact = cssW < 480;
    const leftText = compact ? "密集" : "密集 DENSE";
    const rightText = compact ? "稀疏" : "稀疏 SPARSE";
    ctx.font = `700 ${compact ? 11 : 12}px "Noto Sans SC", "Space Grotesk", sans-serif`;
    const lw = ctx.measureText(leftText).width;
    const rw = ctx.measureText(rightText).width;

    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(leftText, fb.x, arrowY);
    ctx.textAlign = "right";
    ctx.fillText(rightText, fb.x + fb.w, arrowY);

    const ax1 = fb.x + lw + 12;
    const ax2 = fb.x + fb.w - rw - 12;
    if (ax2 - ax1 > 30) {
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ax1, arrowY);
      ctx.lineTo(ax2, arrowY);
      ctx.moveTo(ax2 - 8, arrowY - 4.5);
      ctx.lineTo(ax2, arrowY);
      ctx.lineTo(ax2 - 8, arrowY + 4.5);
      ctx.stroke();

      // 在标尺线上落一枚朱橘实心游标，标示当前视觉重心横向落位
      const markerX = ax1 + (ax2 - ax1) * clamp(m.focalPos.u, 0.04, 0.96);
      ctx.beginPath();
      ctx.arc(markerX, arrowY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.orange;
      ctx.fill();
      ctx.strokeStyle = PALETTE.paper;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  // ---------- 指针与触屏交互（兼容 perf.mjs 的 touchStart/touchMove 左右横拖） ----------
  let activePointerId = null;

  function startDrag(clientX, clientY) {
    const pt = clientToField(clientX, clientY);
    state.animatingPreset = false;
    state.preset = "custom";
    state.pointer.active = true;
    state.pointer.u = pt.u;
    state.pointer.v = pt.v;
    state.pointer.prevU = pt.u;
    if (reducedMotion.matches) {
      applyBrush(state.particles, state.tool, pt.u, pt.v, pt.u, state.dotScale, 0.025);
      state.metrics = analyzeField(state.particles, state.dotScale);
      updateUI(true);
      runner.draw();
    }
    state.dirty = true;
  }

  function moveDrag(clientX, clientY) {
    if (!state.pointer.active) return;
    const pt = clientToField(clientX, clientY);
    // 常规模式下仅更新目标位置，由 rAF 统一单帧物理更新+重绘，杜绝同帧双绘
    state.pointer.u = pt.u;
    state.pointer.v = pt.v;
    state.dirty = true;
    if (reducedMotion.matches) {
      applyBrush(state.particles, state.tool, pt.u, pt.v, state.pointer.prevU, state.dotScale, 0.022);
      state.pointer.prevU = pt.u;
      state.metrics = analyzeField(state.particles, state.dotScale);
      updateUI(true);
      runner.draw();
    }
  }

  function endDrag() {
    if (!state.pointer.active) return;
    state.pointer.active = false;
    state.metrics = analyzeField(state.particles, state.dotScale);
    state.dirty = true;
    updateUI(true);
    runner.draw();
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    activePointerId = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    startDrag(e.clientX, e.clientY);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (activePointerId !== null && e.pointerId === activePointerId) {
      moveDrag(e.clientX, e.clientY);
    }
  });

  const onPointerFinish = (e) => {
    if (activePointerId !== null && e.pointerId === activePointerId) {
      activePointerId = null;
      endDrag();
    }
  };
  canvas.addEventListener("pointerup", onPointerFinish);
  canvas.addEventListener("pointercancel", onPointerFinish);

  // 键盘无障碍操作（焦点在画布时支持方向键聚散、Space 切笔法、+/- 调尺码）
  canvas.addEventListener("keydown", (e) => {
    let handled = true;
    if (e.key === "ArrowLeft") nudgeFocus(state.particles, -1, 0, state.tool, state.dotScale);
    else if (e.key === "ArrowRight") nudgeFocus(state.particles, 1, 0, state.tool, state.dotScale);
    else if (e.key === "ArrowUp") nudgeFocus(state.particles, 0, -1, state.tool, state.dotScale);
    else if (e.key === "ArrowDown") nudgeFocus(state.particles, 0, 1, state.tool, state.dotScale);
    else if (e.key === " " || e.key === "Enter") {
      state.tool = state.tool === "attract" ? "repel" : state.tool === "repel" ? "gradient" : "attract";
    } else if (e.key === "+" || e.key === "=") {
      state.dotScale = clamp(state.dotScale + 0.08, 0.55, 1.55);
      relaxParticles(state.particles, state.dotScale, 2);
    } else if (e.key === "-" || e.key === "_") {
      state.dotScale = clamp(state.dotScale - 0.08, 0.55, 1.55);
      relaxParticles(state.particles, state.dotScale, 2);
    } else {
      handled = false;
    }
    if (handled) {
      e.preventDefault();
      state.preset = "custom";
      state.metrics = analyzeField(state.particles, state.dotScale);
      state.dirty = true;
      updateUI(true);
      runner.draw();
    }
  });

  // 按钮与滑块事件绑定
  document.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => applyPreset(btn.dataset.preset, false));
  });

  document.querySelectorAll("[data-tool]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.tool = btn.dataset.tool;
      updateUI(true);
      state.dirty = true;
      runner.draw();
    });
  });

  document.querySelectorAll("[data-carrier]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!CARRIERS[btn.dataset.carrier]) return;
      state.carrier = btn.dataset.carrier;
      updateUI(true);
      state.dirty = true;
      runner.draw();
    });
  });

  if (els.scaleSlider) {
    els.scaleSlider.addEventListener("input", () => {
      state.dotScale = clamp(parseFloat(els.scaleSlider.value) || 1.0, 0.55, 1.55);
      state.preset = "custom";
      relaxParticles(state.particles, state.dotScale, 2);
      state.metrics = analyzeField(state.particles, state.dotScale);
      state.dirty = true;
      updateUI(true);
      runner.draw();
    });
  }

  if (els.calloutToggle) {
    els.calloutToggle.addEventListener("click", () => {
      state.showCallouts = !state.showCallouts;
      els.calloutToggle.setAttribute("aria-pressed", String(state.showCallouts));
      els.calloutToggle.textContent = state.showCallouts ? "实况引注：开" : "实况引注：关";
      state.dirty = true;
      runner.draw();
    });
  }

  const ro = new ResizeObserver(() => {
    resize();
    runner.draw();
  });
  ro.observe(canvas);

  const runner = loop(canvas, drawScene);
  resize();
  updateUI(true);
  runner.draw();

  return {
    state,
    applyPreset,
    getMetrics: () => state.metrics,
  };
}

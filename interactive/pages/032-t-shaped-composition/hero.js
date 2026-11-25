// 032 T形构图 · 开场活体 T 形构筑承重台 (2D Canvas)
// 1:1 承袭 032 原海报深海海军蓝、金黄横梁、山水圆枢、桉叶绿三阶垂轴、金星同心虚环。
// 支持画布水平直拖滑动垂轴（同时响应 data-perf-drag）、拖拽顶梁端帽与下沿、点击弥合断口、拖回落点胶囊与清退侧翼杂块。

import { loop, pixelRatio } from "../../lib/stage.js";
import { LIMITS, PRESETS, SCENES, clamp, createInitialState, evaluate } from "./model.js";

const COLORS = {
  navy: "#031B38",
  navyDeep: "#021226",
  navyCard: "#082447",
  navyGrid: "rgba(142, 191, 167, 0.08)",
  navyDots: "rgba(142, 191, 167, 0.16)",
  amber: "#F3B329",
  amberSoft: "#F2C35B",
  amberDim: "rgba(243, 179, 41, 0.38)",
  sage: "#8EBFA7",
  sageBright: "#A7D6BF",
  sageLine: "rgba(152, 189, 180, 0.55)",
  cream: "#EEE1C7",
  alert: "#FF7B6B",
  alertFill: "rgba(255, 123, 107, 0.16)",
  ok: "#6CE5B1",
};

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawStar(ctx, cx, cy, outerR, innerR, pts = 5) {
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = -Math.PI / 2 + (i * Math.PI) / pts;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawEyeIcon(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, r * 0.14);
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.72, cy);
  ctx.quadraticCurveTo(cx, cy - r * 0.58, cx + r * 0.72, cy);
  ctx.quadraticCurveTo(cx, cy + r * 0.58, cx - r * 0.72, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFocusRingIcon(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, r * 0.14);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
  ctx.stroke();
  const tick = r * 0.28;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.42, cy + Math.sin(a) * r * 0.42);
    ctx.lineTo(cx + Math.cos(a) * (r * 0.42 + tick), cy + Math.sin(a) * (r * 0.42 + tick));
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMountainHubIcon(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  // 山峰主剪影（复刻 032 海报中央圆徽）
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.54, cy + r * 0.26);
  ctx.lineTo(cx - r * 0.12, cy - r * 0.22);
  ctx.lineTo(cx + r * 0.16, cy + r * 0.08);
  ctx.lineTo(cx + r * 0.34, cy - r * 0.08);
  ctx.lineTo(cx + r * 0.54, cy + r * 0.26);
  ctx.closePath();
  ctx.fill();
  // 圆日
  ctx.beginPath();
  ctx.arc(cx + r * 0.22, cy - r * 0.3, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  // 底基短横
  ctx.fillRect(cx - r * 0.56, cy + r * 0.36, r * 1.12, Math.max(2, r * 0.09));
  ctx.restore();
}

export function initHero() {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");

  const state = createInitialState();
  // 过渡动画目标（按钮预设时平滑过渡，拖拽时零延迟直跟）
  let animTarget = null;
  let pulsePhase = 0;

  // DOM 绑定缓存
  const elStatusPill = document.getElementById("topStatusPill");
  const elTitleT = document.getElementById("heroTitleT");
  const elDiagBadge = document.getElementById("diagBadge");
  const elDiagHeadline = document.getElementById("diagHeadline");
  const elDiagExplain = document.getElementById("diagExplain");
  const elDiagHint = document.getElementById("diagHint");
  const elDiagCard = document.getElementById("diagCard");
  const elMetricSpan = document.getElementById("mSpan");
  const elMetricStem = document.getElementById("mStem");
  const elMetricOffset = document.getElementById("mOffset");
  const elMetricBal = document.getElementById("mBalance");

  const elPillarBeam = document.getElementById("pillarBeam");
  const elPillarStem = document.getElementById("pillarStem");
  const elPillarAnchor = document.getElementById("pillarAnchor");
  const elPillarPocket = document.getElementById("pillarPocket");

  const elFootBeam = document.getElementById("footBeam");
  const elFootStem = document.getElementById("footStem");
  const elFootAnchor = document.getElementById("footAnchor");

  const slSpan = document.getElementById("slBarSpan");
  const slSpanVal = document.getElementById("slBarSpanVal");
  const slBarH = document.getElementById("slBarH");
  const slBarHVal = document.getElementById("slBarHVal");
  const slStemX = document.getElementById("slStemX");
  const slStemXVal = document.getElementById("slStemXVal");
  const slAnchorW = document.getElementById("slAnchorW");
  const slAnchorWVal = document.getElementById("slAnchorWVal");

  const btnHealGap = document.getElementById("btnHealGap");
  const btnAlignAnchor = document.getElementById("btnAlignAnchor");
  const btnClearClutter = document.getElementById("btnClearClutter");
  const btnToggleFlow = document.getElementById("btnToggleFlow");
  const mobileQuickHint = document.getElementById("mobileQuickHint");

  // 视线粒子池（轻量 12 枚，60fps 无负担）
  const particles = Array.from({ length: 12 }, (_, i) => ({
    phase: i / 12,
    side: i % 2 === 0 ? -1 : 1,
  }));

  let W = 720;
  let H = 520;
  let dpr = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(220, Math.round(rect.height));
    const nextDpr = pixelRatio(2);
    if (w !== W || h !== H || nextDpr !== dpr) {
      W = w;
      H = h;
      dpr = nextDpr;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
  }

  // 把 T-Title 视觉示范同步到真实参数（标题本身就是示范，同时始终一眼可辨为字母 T）
  function syncMastheadT(res) {
    if (!elTitleT) return;
    const g = res.g;
    const barW = Math.round(52 + g.barSpan * 24); // 62..75 in 80px viewBox
    const barX = (80 - barW) / 2;
    const barH = Math.round(11 + g.barH * 18); // 13..17
    const stemW = 14;
    // 竖柱仅在居中附近温和偏移 ±6px，既响应实时参数又始终一眼认出 monumental T
    const stemX = clamp(Math.round(40 + (g.stemX - 0.5) * 20), 34, 46);
    const barEl = elTitleT.querySelector(".t-glyph-bar");
    const stemEl = elTitleT.querySelector(".t-glyph-stem");
    const gapEl = elTitleT.querySelector(".t-glyph-gap");
    if (barEl) {
      barEl.setAttribute("x", barX.toFixed(1));
      barEl.setAttribute("width", barW.toFixed(1));
      barEl.setAttribute("height", barH.toFixed(1));
    }
    if (stemEl) {
      stemEl.setAttribute("x", (stemX - stemW / 2).toFixed(1));
      stemEl.setAttribute("y", (6 + barH - 1).toFixed(1));
      stemEl.setAttribute("height", Math.max(24, 72 - (6 + barH)).toFixed(1));
    }
    if (gapEl) {
      gapEl.style.opacity = g.stemGap > 0 ? "1" : "0";
      gapEl.setAttribute("x", (stemX - stemW / 2 - 2).toFixed(1));
      gapEl.setAttribute("height", "4");
      gapEl.setAttribute("y", "45");
    }
  }

  // 同步全部单真源文字与控件状态（仅在值变动时更新 DOM 避免不必要重排）
  let lastDomKey = "";
  function syncDOM(force = false) {
    const res = evaluate(state);
    const key = [
      state.scene,
      state.showFlow ? 1 : 0,
      Math.round(state.barSpan * 100),
      Math.round(state.barH * 100),
      Math.round(state.stemX * 100),
      state.stemGap > 0 ? 1 : 0,
      Math.round(state.anchorX * 100),
      Math.round(state.anchorW * 100),
      Math.round(state.anchorStrength * 100),
      state.clutter,
    ].join("|");
    if (!force && key === lastDomKey) return res;
    lastDomKey = key;

    syncMastheadT(res);

    if (elStatusPill) {
      elStatusPill.textContent = res.isSolved ? "4 / 4 T 构稳固" : `${res.passCount} / 4 待筑 T 梁`;
      elStatusPill.dataset.state = res.isSolved ? "ok" : "warn";
    }
    if (elDiagCard) elDiagCard.dataset.state = res.isSolved ? "ok" : "warn";
    if (elDiagBadge) elDiagBadge.textContent = res.badge;
    if (elDiagHeadline) elDiagHeadline.textContent = res.headline;
    if (elDiagExplain) elDiagExplain.textContent = res.explain;
    if (elDiagHint) elDiagHint.textContent = res.hint;
    if (mobileQuickHint) mobileQuickHint.textContent = res.headline;

    if (elMetricSpan) elMetricSpan.textContent = `${res.metrics.spanPct} · 厚 ${res.metrics.thicknessPct}`;
    if (elMetricStem) elMetricStem.textContent = res.metrics.stemPosPct;
    if (elMetricOffset) elMetricOffset.textContent = res.metrics.offsetPct;
    if (elMetricBal) elMetricBal.textContent = res.metrics.balanceText;

    const setBadge = (el, p) => {
      if (!el) return;
      el.textContent = p.status;
      el.dataset.ok = p.ok ? "1" : "0";
    };
    setBadge(elPillarBeam, res.pillars.beam);
    setBadge(elPillarStem, res.pillars.stem);
    setBadge(elPillarAnchor, res.pillars.anchor);
    setBadge(elPillarPocket, res.pillars.pocket);

    const setFoot = (el, ok, label) => {
      if (!el) return;
      el.dataset.ok = ok ? "1" : "0";
      const s = el.querySelector(".foot-pill-state");
      if (s) s.textContent = label;
    };
    setFoot(elFootBeam, res.pillars.beam.ok, res.pillars.beam.status);
    setFoot(elFootStem, res.pillars.stem.ok, res.pillars.stem.status);
    setFoot(elFootAnchor, res.pillars.anchor.ok && res.pillars.pocket.ok, res.pillars.anchor.ok ? (res.pillars.pocket.ok ? "稳接净空" : "侧翼侵轴") : res.pillars.anchor.status);

    if (slSpan) slSpan.value = String(Math.round(state.barSpan * 100));
    if (slSpanVal) slSpanVal.textContent = `${Math.round(state.barSpan * 100)}%`;
    if (slBarH) slBarH.value = String(Math.round(state.barH * 100));
    if (slBarHVal) slBarHVal.textContent = `${Math.round(state.barH * 100)}%`;
    if (slStemX) slStemX.value = String(Math.round(state.stemX * 100));
    if (slStemXVal) slStemXVal.textContent = `${Math.round(state.stemX * 100)}%`;
    if (slAnchorW) slAnchorW.value = String(Math.round(state.anchorW * 100));
    if (slAnchorWVal) slAnchorWVal.textContent = `${Math.round(state.anchorW * 100)}%`;

    if (btnHealGap) {
      const broken = state.stemGap > 0.04;
      btnHealGap.textContent = broken ? "接通断节" : "已贯通（可断测）";
      btnHealGap.dataset.active = broken ? "alert" : "ok";
    }
    if (btnAlignAnchor) {
      const aligned = res.pillars.anchor.ok;
      btnAlignAnchor.textContent = aligned ? "落点已锁定" : "归位强化落点";
      btnAlignAnchor.dataset.active = aligned ? "ok" : "alert";
    }
    if (btnClearClutter) {
      const has = state.clutter > 0;
      btnClearClutter.textContent = has ? "清退翼侧杂块" : "双翼净空（可加测）";
      btnClearClutter.dataset.active = has ? "alert" : "ok";
    }
    if (btnToggleFlow) {
      btnToggleFlow.textContent = state.showFlow ? "视线流：开" : "视线流：关";
      btnToggleFlow.setAttribute("aria-pressed", String(state.showFlow));
    }

    document.querySelectorAll("[data-scene-btn]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.sceneBtn === state.scene));
    });

    return res;
  }

  // 主 2D Canvas 绘制（单帧轻快，零高开销滤镜）
  function renderFrame(t, dt, { still }) {
    resize();
    if (!still && animTarget) {
      const k = Math.min(1, dt * 10);
      let done = true;
      for (const prop of ["barSpan", "barH", "stemX", "stemGap", "anchorX", "anchorW", "anchorStrength"]) {
        const diff = animTarget[prop] - state[prop];
        if (Math.abs(diff) > 0.002) {
          state[prop] += diff * k;
          done = false;
        } else {
          state[prop] = animTarget[prop];
        }
      }
      state.clutter = animTarget.clutter;
      if (done) animTarget = null;
      syncDOM();
    } else if (still && animTarget) {
      Object.assign(state, animTarget);
      animTarget = null;
      syncDOM();
    }

    if (!still) pulsePhase = (pulsePhase + dt * 0.42) % 1;
    const res = evaluate(state);
    const g = res.g;
    const sc = SCENES[state.scene];

    // 统一等比绘图坐标系（保圆、防压扁）
    const padX = Math.max(14, W * 0.03);
    const padY = Math.max(12, H * 0.025);
    const stageW = W - padX * 2;
    const stageH = H - padY * 2;
    const unit = Math.min(stageW, stageH); // 圆环/图标/字体统一尺度
    const ux = (u) => padX + u * stageW;
    const vy = (v) => padY + v * stageH;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 深海海军蓝舞台底 + 极细建筑蓝图网格 + 装饰点阵
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, 0, W, H);

    // 细网格线
    ctx.strokeStyle = COLORS.navyGrid;
    ctx.lineWidth = 1;
    const cols = 12;
    const rows = 10;
    ctx.beginPath();
    for (let i = 1; i < cols; i++) {
      const x = Math.round(padX + (stageW * i) / cols) + 0.5;
      ctx.moveTo(x, padY);
      ctx.lineTo(x, H - padY);
    }
    for (let j = 1; j < rows; j++) {
      const y = Math.round(padY + (stageH * j) / rows) + 0.5;
      ctx.moveTo(padX, y);
      ctx.lineTo(W - padX, y);
    }
    ctx.stroke();

    // 中心基准微虚线（帮助用户感知正中轴与三分偏轴）
    ctx.save();
    ctx.strokeStyle = "rgba(152, 189, 180, 0.2)";
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(ux(0.5), vy(0.02));
    ctx.lineTo(ux(0.5), vy(0.96));
    ctx.stroke();
    ctx.restore();

    // 复刻原海报左下暗蓝点阵（装饰负形平衡，不干扰主体）
    ctx.fillStyle = COLORS.navyDots;
    const dotCols = 7;
    const dotRows = 6;
    const dotStep = Math.max(8, unit * 0.026);
    const dotBaseX = padX + stageW * 0.05;
    const dotBaseY = vy(0.62);
    for (let r = 0; r < dotRows; r++) {
      for (let c = 0; c < dotCols; c++) {
        ctx.beginPath();
        ctx.arc(dotBaseX + c * dotStep, dotBaseY + r * dotStep, Math.max(1.3, unit * 0.0036), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. 双翼负形呼应框（原海报两侧留白结构提示，细弱不抢戏）
    const sx = ux(g.stemX);
    const sw = Math.max(46, Math.min(stageW * g.stemW, unit * 0.2));
    const bx = ux(g.barLeft);
    const bw = g.barSpan * stageW;
    const by = vy(g.barTop);
    const bh = g.barH * stageH;
    const barBottomPx = by + bh;
    const stemTipPx = vy(g.stemTipY);

    // 若左右翼空间充裕，画出细弱虚线负形区提示
    const wingTop = barBottomPx + Math.max(12, stageH * 0.032);
    const wingBottom = stemTipPx - Math.max(12, stageH * 0.03);
    const wingH = wingBottom - wingTop;
    if (wingH > 40) {
      ctx.save();
      ctx.strokeStyle = "rgba(152, 189, 180, 0.22)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      const leftPocketW = sx - sw / 2 - padX - 16;
      if (leftPocketW > 52) {
        roundRectPath(ctx, padX + 8, wingTop, leftPocketW, wingH, 10);
        ctx.stroke();
      }
      const rightPocketX = sx + sw / 2 + 8;
      const rightPocketW = W - padX - 8 - rightPocketX;
      if (rightPocketW > 52) {
        roundRectPath(ctx, rightPocketX, wingTop, rightPocketW, wingH, 10);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. 底部三圈同心椭圆虚环（原海报标志：跟随垂轴箭头落点，若落点脱靶则显现空环警示！）
    const targetCx = sx;
    const targetCy = vy(g.anchorY);
    const ringBaseRx = Math.min(stageW * 0.28, unit * 0.36);
    const ringBaseRy = Math.max(18, unit * 0.068);
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const scale = 0.62 + i * 0.22;
      ctx.strokeStyle = res.pillars.anchor.ok
        ? i === 0
          ? "rgba(243, 179, 41, 0.58)"
          : "rgba(142, 191, 167, 0.36)"
        : "rgba(255, 123, 107, 0.55)";
      ctx.lineWidth = i === 0 ? 1.5 : 1.1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.ellipse(targetCx, targetCy, ringBaseRx * scale, ringBaseRy * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 若落点脱靶，在垂轴正下方画清晰空位虚框提示
    if (g.anchorOffset > 0.065) {
      ctx.save();
      ctx.strokeStyle = COLORS.alert;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      const ghostW = Math.max(96, unit * 0.26);
      const ghostH = Math.max(30, unit * 0.09);
      roundRectPath(ctx, targetCx - ghostW / 2, targetCy - ghostH / 2, ghostW, ghostH, 9);
      ctx.stroke();
      ctx.fillStyle = COLORS.alert;
      ctx.font = `600 ${Math.max(11, Math.round(unit * 0.025))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("空落点 · 拖星入靶", targetCx, targetCy);
      ctx.restore();
    }

    // 4. 垂直桉叶绿导流轴（含中段断节状态与三阶圆形接力标）
    const arrowHeadH = Math.max(20, Math.min(34, unit * 0.062));
    const stemBodyBottom = stemTipPx - arrowHeadH;
    const stemColor = res.pillars.stem.ok ? COLORS.sage : g.stemConnectedToBar ? "#78A392" : "rgba(142, 191, 167, 0.55)";

    ctx.save();
    const stemGrad = ctx.createLinearGradient(sx, barBottomPx, sx, stemTipPx);
    stemGrad.addColorStop(0, stemColor);
    stemGrad.addColorStop(1, res.pillars.stem.ok ? "#A3CFB8" : "#6F9789");

    if (g.stemGap > 0.04) {
      const gapTopPx = vy(g.gapCenterY - g.gapHalf);
      const gapBotPx = vy(g.gapCenterY + g.gapHalf);
      // 上段轴身
      ctx.fillStyle = stemGrad;
      ctx.fillRect(sx - sw / 2, barBottomPx, sw, Math.max(8, gapTopPx - barBottomPx));
      // 下段轴身 + 箭头
      ctx.beginPath();
      ctx.moveTo(sx - sw / 2, gapBotPx);
      ctx.lineTo(sx + sw / 2, gapBotPx);
      ctx.lineTo(sx + sw / 2, stemBodyBottom);
      ctx.lineTo(sx + sw * 0.64, stemBodyBottom);
      ctx.lineTo(sx, stemTipPx);
      ctx.lineTo(sx - sw * 0.64, stemBodyBottom);
      ctx.lineTo(sx - sw / 2, stemBodyBottom);
      ctx.closePath();
      ctx.fill();

      // 断口警示交互盒（点击一键接通，紧凑不侵占上下标牌）
      const pulse = still ? 0.85 : 0.72 + 0.28 * Math.sin(t * 4.5);
      ctx.fillStyle = COLORS.alertFill;
      ctx.strokeStyle = `rgba(255, 123, 107, ${pulse.toFixed(2)})`;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      const boxW = Math.max(sw + 20, 112);
      const boxH = Math.max(28, gapBotPx - gapTopPx - 8);
      roundRectPath(ctx, sx - boxW / 2, (gapTopPx + gapBotPx) / 2 - boxH / 2, boxW, boxH, 8);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#FFD1CB";
      ctx.font = `700 ${Math.max(11, Math.round(unit * 0.025))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("断节 · 点此接通", sx, (gapTopPx + gapBotPx) / 2);
    } else {
      // 完整贯通箭形垂轴（1:1 原海报外形）
      ctx.fillStyle = stemGrad;
      ctx.beginPath();
      ctx.moveTo(sx - sw / 2, barBottomPx);
      ctx.lineTo(sx + sw / 2, barBottomPx);
      ctx.lineTo(sx + sw / 2, stemBodyBottom);
      ctx.lineTo(sx + sw * 0.64, stemBodyBottom);
      ctx.lineTo(sx, stemTipPx);
      ctx.lineTo(sx - sw * 0.64, stemBodyBottom);
      ctx.lineTo(sx - sw / 2, stemBodyBottom);
      ctx.closePath();
      ctx.fill();
    }

    // 轴内垂直虚线 + 三枚接力圆章（视线起点 / 引导聚焦 / 视觉落点）
    const stemInnerH = stemBodyBottom - barBottomPx;
    if (stemInnerH > 60) {
      ctx.strokeStyle = COLORS.navy;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      if (g.stemGap > 0.04) {
        const gapTopPx = vy(g.gapCenterY - g.gapHalf);
        const gapBotPx = vy(g.gapCenterY + g.gapHalf);
        ctx.moveTo(sx, barBottomPx + 8);
        ctx.lineTo(sx, gapTopPx - 4);
        ctx.moveTo(sx, gapBotPx + 4);
        ctx.lineTo(sx, stemTipPx - 14);
      } else {
        ctx.moveTo(sx, barBottomPx + 8);
        ctx.lineTo(sx, stemTipPx - 14);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 轴尖深蓝小箭头
      ctx.fillStyle = COLORS.navy;
      ctx.beginPath();
      ctx.moveTo(sx, stemTipPx - 6);
      ctx.lineTo(sx - 5, stemTipPx - 15);
      ctx.lineTo(sx + 5, stemTipPx - 15);
      ctx.closePath();
      ctx.fill();

      // 三枚圆章（断节时上移第一枚并隐藏中间一枚，杜绝与断口框重叠）
      const medR = Math.max(10, Math.min(16, sw * 0.22));
      const relayFracs = g.stemGap > 0.04 ? [0.16, 0.52, 0.82] : [0.24, 0.53, 0.82];
      const relayFontSize = Math.max(10, Math.min(12, Math.round(unit * 0.023)));
      relayFracs.forEach((f, idx) => {
        if (g.stemGap > 0.04 && idx === 1) return;
        const my = barBottomPx + stemInnerH * f;
        ctx.fillStyle = COLORS.navy;
        ctx.beginPath();
        ctx.arc(sx, my, medR, 0, Math.PI * 2);
        ctx.fill();
        if (idx === 0) drawEyeIcon(ctx, sx, my, medR * 0.88, COLORS.cream);
        else if (idx === 1) drawFocusRingIcon(ctx, sx, my, medR * 0.88, COLORS.cream);
        else {
          ctx.fillStyle = COLORS.amber;
          ctx.beginPath();
          ctx.arc(sx, my, medR * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
        // 圆章下方中文标签（断节态仅在空间充足时显示首标签，避免与断框贴边）
        const gapTopPx = vy(g.gapCenterY - g.gapHalf);
        const roomBelow = g.stemGap > 0.04 && idx === 0 ? gapTopPx - (my + medR) : 40;
        if (stemInnerH > 130 && roomBelow > 18) {
          ctx.fillStyle = COLORS.navy;
          ctx.font = `700 ${relayFontSize}px "Noto Sans SC", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(sc.relays[idx], sx, my + medR + 3);
        }
      });
    }

    // 垂轴左右滑动提示小手柄（贴近轴身顶沿，与首圆章错开）
    const gripY = barBottomPx + 10;
    ctx.fillStyle = state.activeHandle === "stem" ? COLORS.amber : COLORS.navy;
    ctx.strokeStyle = COLORS.cream;
    ctx.lineWidth = 1.2;
    roundRectPath(ctx, sx - 18, gripY - 8, 36, 16, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = state.activeHandle === "stem" ? COLORS.navy : COLORS.cream;
    ctx.font = `600 10px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("↔", sx, gripY + 0.5);
    ctx.restore();

    // 5. 顶部金黄横梁（含轻微力学悬臂倾角反馈 + 中央深蓝圆枢 + 双向虚箭 + 左右拉伸端帽）
    ctx.save();
    const barCenterX = bx + bw / 2;
    const barCenterY = by + bh / 2;
    ctx.translate(barCenterX, barCenterY);
    if (Math.abs(g.tiltDeg) > 0.05) {
      ctx.rotate((g.tiltDeg * Math.PI) / 180);
    }

    // 顶梁实体金黄块
    ctx.fillStyle = res.pillars.beam.ok ? COLORS.amber : "#E8A425";
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);

    // 失误态描边警示
    if (!res.pillars.beam.ok) {
      ctx.strokeStyle = COLORS.alert;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(-bw / 2 + 1, -bh / 2 + 1, bw - 2, bh - 2);
      ctx.setLineDash([]);
    }

    // 横梁内部双向水平虚线与端头三角箭（复刻 032 海报灵魂）
    const arrowY = bh * 0.2;
    const arrowPad = Math.max(14, bw * 0.05);
    ctx.strokeStyle = COLORS.navy;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(-bw / 2 + arrowPad + 6, arrowY);
    ctx.lineTo(bw / 2 - arrowPad - 6, arrowY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 左右双向箭尖
    ctx.fillStyle = COLORS.navy;
    ctx.beginPath();
    ctx.moveTo(-bw / 2 + arrowPad, arrowY);
    ctx.lineTo(-bw / 2 + arrowPad + 9, arrowY - 5);
    ctx.lineTo(-bw / 2 + arrowPad + 9, arrowY + 5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bw / 2 - arrowPad, arrowY);
    ctx.lineTo(bw / 2 - arrowPad - 9, arrowY - 5);
    ctx.lineTo(bw / 2 - arrowPad - 9, arrowY + 5);
    ctx.closePath();
    ctx.fill();

    // 顶梁左右两段文字（随宽度自适应防重叠）
    const hubR = Math.max(18, Math.min(bh * 0.44, bw * 0.14, unit * 0.088));
    // 圆枢跟随垂轴落位（若脱梁则锁在梁内近端）
    const hubLocalX = clamp(sx - barCenterX, -bw / 2 + hubR + 12, bw / 2 - hubR - 12);
    const barFontSize = Math.max(12, Math.min(20, Math.round(unit * 0.038)));
    ctx.fillStyle = COLORS.navy;
    ctx.font = `800 ${barFontSize}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const leftSpace = hubLocalX - hubR - (-bw / 2);
    const rightSpace = bw / 2 - (hubLocalX + hubR);
    if (leftSpace > 58) {
      ctx.fillText(sc.barLeftText, -bw / 2 + leftSpace / 2, -bh * 0.12);
    }
    if (rightSpace > 58) {
      ctx.fillText(sc.barRightText, hubLocalX + hubR + rightSpace / 2, -bh * 0.12);
    }

    // 中央深海蓝圆枢 + 虚线外环 + 山水/场景图标
    ctx.fillStyle = COLORS.navy;
    ctx.beginPath();
    ctx.arc(hubLocalX, 0, hubR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLORS.navy;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(hubLocalX, 0, hubR + 5.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (state.scene === "poster") {
      drawMountainHubIcon(ctx, hubLocalX, 0, hubR * 0.9, COLORS.cream);
    } else if (state.scene === "launch") {
      // 声学同心扬声环（几何无脸）
      ctx.strokeStyle = COLORS.cream;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(hubLocalX, 0, hubR * 0.52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = COLORS.amber;
      ctx.beginPath();
      ctx.arc(hubLocalX, 0, hubR * 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 数据柱图徽标
      ctx.fillStyle = COLORS.cream;
      const bW = hubR * 0.22;
      ctx.fillRect(hubLocalX - bW * 1.8, hubR * 0.05, bW, hubR * 0.35);
      ctx.fillRect(hubLocalX - bW * 0.5, -hubR * 0.25, bW, hubR * 0.65);
      ctx.fillStyle = COLORS.amber;
      ctx.fillRect(hubLocalX + bW * 0.8, -hubR * 0.42, bW, hubR * 0.82);
    }

    // 顶梁左右可拖拽拉伸端帽
    const capH = Math.min(34, bh * 0.56);
    const capW = 10;
    for (const dir of [-1, 1]) {
      const cxCap = dir * (bw / 2);
      ctx.fillStyle = state.activeHandle === (dir < 0 ? "barLeft" : "barRight") ? COLORS.cream : COLORS.navy;
      ctx.strokeStyle = COLORS.amber;
      ctx.lineWidth = 2;
      roundRectPath(ctx, cxCap - capW / 2, -capH / 2, capW, capH, 4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // 顶梁展宽尺寸标注线（顶部极细建筑标尺）
    ctx.save();
    ctx.strokeStyle = res.pillars.beam.ok ? COLORS.sageLine : COLORS.alert;
    ctx.lineWidth = 1;
    const dimY = Math.max(8, by - 9);
    ctx.beginPath();
    ctx.moveTo(bx, dimY);
    ctx.lineTo(bx + bw, dimY);
    ctx.moveTo(bx, dimY - 3);
    ctx.lineTo(bx, dimY + 3);
    ctx.moveTo(bx + bw, dimY - 3);
    ctx.lineTo(bx + bw, dimY + 3);
    ctx.stroke();
    ctx.fillStyle = res.pillars.beam.ok ? COLORS.sageBright : COLORS.alert;
    ctx.font = `600 10.5px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const dimLabel = `横梁展宽 ${Math.round(g.barSpan * 100)}% · 厚 ${Math.round(g.barH * 100)}%`;
    const lblW = ctx.measureText(dimLabel).width + 12;
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(barCenterX - lblW / 2, dimY - 12, lblW, 14);
    ctx.fillStyle = res.pillars.beam.ok ? COLORS.sageBright : COLORS.alert;
    ctx.fillText(dimLabel, barCenterX, dimY + 1);
    ctx.restore();

    // 6. 侧翼干扰块（若存在，带红虚框提示点击清退）
    if (g.clutter > 0) {
      const cx = ux(g.clutterX);
      const cy = vy(g.clutterY);
      const cw = Math.max(106, g.clutterW * stageW);
      const ch = Math.max(46, g.clutterH * stageH);
      ctx.save();
      ctx.fillStyle = "rgba(42, 24, 34, 0.92)";
      ctx.strokeStyle = COLORS.alert;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 3]);
      roundRectPath(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 10);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#FFD1CB";
      ctx.font = `700 ${Math.max(11, Math.round(unit * 0.025))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`× ${sc.clutterTitle}`, cx, cy - 8);
      ctx.fillStyle = "rgba(255, 209, 203, 0.85)";
      ctx.font = `500 10.5px "Noto Sans SC", sans-serif`;
      ctx.fillText(sc.clutterSub, cx, cy + 10);
      ctx.restore();
    }

    // 7. 底部金星焦点落点胶囊（可拖回垂轴正下方，或点此一键归位强化）
    const ax = ux(g.anchorX);
    const ay = vy(g.anchorY);
    const aw = Math.max(126, g.anchorW * stageW);
    const ah = Math.max(44, g.anchorH * stageH);
    ctx.save();
    ctx.globalAlpha = 0.48 + 0.52 * g.anchorStrength;
    ctx.fillStyle = res.pillars.anchor.ok ? COLORS.amber : g.anchorRatioToBar > 0.6 ? "#E08B3C" : "#C9963A";
    roundRectPath(ctx, ax - aw / 2, ay - ah / 2, aw, ah, 12);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (!res.pillars.anchor.ok) {
      ctx.strokeStyle = COLORS.alert;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      roundRectPath(ctx, ax - aw / 2 - 2, ay - ah / 2 - 2, aw + 4, ah + 4, 13);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 左侧深蓝圆底 + 金色五角星（1:1 复刻原海报）
    const starDiscR = Math.max(13, Math.min(ah * 0.36, 20));
    const starDiscX = ax - aw / 2 + starDiscR + 10;
    ctx.fillStyle = COLORS.navy;
    ctx.beginPath();
    ctx.arc(starDiscX, ay, starDiscR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.amber;
    drawStar(ctx, starDiscX, ay, starDiscR * 0.62, starDiscR * 0.28, 5);
    ctx.fill();

    // 胶囊文字
    const textLeft = starDiscX + starDiscR + 8;
    const textAvail = ax + aw / 2 - textLeft - 8;
    if (textAvail > 48) {
      ctx.fillStyle = COLORS.navy;
      ctx.font = `800 ${Math.max(11.5, Math.min(15, Math.round(unit * 0.03)))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const mainLabel = g.anchorOffset > 0.065 ? "拖回轴尖" : sc.anchorTitle;
      ctx.fillText(mainLabel, textLeft, ay - (ah > 48 ? 7 : 0));
      if (ah > 48 && textAvail > 72) {
        ctx.font = `500 10.5px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = "#17324F";
        ctx.fillText(g.anchorStrength < 0.8 ? "点此强化焦块" : sc.anchorSub, textLeft, ay + 10);
      }
    }
    ctx.restore();

    // 8. 活体视线导流粒子（直观展现「横扫→转折→下沉→落焦」或「断流外泄/脱靶」）
    if (state.showFlow) {
      ctx.save();
      const hubX = ux(clamp(g.stemX, g.barLeft + 0.05, g.barRight - 0.05));
      const hubY = vy(g.barMidY);
      const gapTopPx = vy(g.gapCenterY - g.gapHalf);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const u = still ? (p.phase + 0.18) % 1 : (p.phase + pulsePhase) % 1;
        let px;
        let py;
        let col = COLORS.cream;
        let rad = 3.2;

        if (u < 0.36) {
          // 沿顶部横梁从外侧扫向中央圆枢
          const f = u / 0.36;
          const startX = p.side < 0 ? bx + 12 : bx + bw - 12;
          px = startX + (hubX - startX) * f;
          py = hubY + Math.sin(f * Math.PI) * 3;
          col = COLORS.navy;
        } else {
          // 沿垂轴向下流向落点
          const f = (u - 0.36) / 0.64;
          if (g.stemGap > 0.04 && f > 0.36) {
            // 遇断节外泄散开！
            const spill = (f - 0.36) / 0.64;
            px = sx + p.side * spill * stageW * 0.24;
            py = gapTopPx + spill * stageH * 0.22;
            col = COLORS.alert;
            rad = 2.8 * (1 - spill * 0.4);
          } else {
            px = sx + Math.sin(f * Math.PI * 2 + i) * (res.pillars.stem.ok ? 2 : 5);
            py = barBottomPx + (targetCy - barBottomPx) * f;
            col = res.pillars.stem.ok && res.pillars.anchor.ok ? COLORS.ok : COLORS.amberSoft;
          }
        }
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // 指针交互：识别端帽拉伸、顶梁调厚、垂轴水平滑动、断节弥合、落点归轴、杂块清退
  let dragMode = null;
  let dragStart = null;
  let moved = false;

  function canvasUV(ev) {
    const rect = canvas.getBoundingClientRect();
    const padX = Math.max(14, rect.width * 0.03);
    const padY = Math.max(12, rect.height * 0.025);
    const u = (ev.clientX - rect.left - padX) / Math.max(1, rect.width - padX * 2);
    const v = (ev.clientY - rect.top - padY) / Math.max(1, rect.height - padY * 2);
    return { u, v, x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }

  function hitTest(u, v) {
    const g = evaluate(state).g;
    // 1. 干扰块点击区
    if (g.clutter > 0 && Math.abs(u - g.clutterX) < g.clutterW * 0.62 && Math.abs(v - g.clutterY) < g.clutterH * 0.7) {
      return "clutter";
    }
    // 2. 断节弥合区
    if (g.stemGap > 0.04 && Math.abs(u - g.stemX) < 0.16 && Math.abs(v - g.gapCenterY) < g.gapHalf + 0.06) {
      return "gap";
    }
    // 3. 底部金星落点胶囊
    if (Math.abs(v - g.anchorY) < 0.095 && Math.abs(u - g.anchorX) < g.anchorW * 0.56 + 0.04) {
      return "anchor";
    }
    // 4. 顶梁左右端帽（拉伸展宽）
    if (v >= g.barTop - 0.04 && v <= g.barBottom + 0.04) {
      if (Math.abs(u - g.barLeft) < 0.065) return "barLeft";
      if (Math.abs(u - g.barRight) < 0.065) return "barRight";
      if (Math.abs(v - g.barBottom) < 0.045 && u > g.barLeft && u < g.barRight) return "barH";
      // 点在顶梁中段，横拖带动垂轴与圆枢滑移
      return "stem";
    }
    // 5. 画布中段任意处横向拖拽 → 平滑滑动垂轴（保障 data-perf-drag 中心横拖即时重绘！）
    return "stem";
  }

  canvas.addEventListener("pointerdown", (ev) => {
    animTarget = null;
    const pt = canvasUV(ev);
    dragMode = hitTest(pt.u, pt.v);
    state.activeHandle = dragMode;
    dragStart = {
      u: pt.u,
      v: pt.v,
      clientX: ev.clientX,
      clientY: ev.clientY,
      barSpan: state.barSpan,
      barH: state.barH,
      stemX: state.stemX,
      anchorX: state.anchorX,
    };
    moved = false;
    try {
      canvas.setPointerCapture(ev.pointerId);
    } catch {}
    ctl.draw();
  });

  canvas.addEventListener("pointermove", (ev) => {
    if (!dragMode || !dragStart) return;
    const dxPx = Math.abs(ev.clientX - dragStart.clientX);
    const dyPx = Math.abs(ev.clientY - dragStart.clientY);
    if (dxPx > 3 || dyPx > 3) moved = true;

    const pt = canvasUV(ev);
    const du = pt.u - dragStart.u;
    const dv = pt.v - dragStart.v;

    if (dragMode === "barLeft") {
      state.barSpan = clamp(dragStart.barSpan - du * 2, ...LIMITS.barSpan);
    } else if (dragMode === "barRight") {
      state.barSpan = clamp(dragStart.barSpan + du * 2, ...LIMITS.barSpan);
    } else if (dragMode === "barH") {
      state.barH = clamp(dragStart.barH + dv, ...LIMITS.barH);
    } else if (dragMode === "anchor") {
      let nx = clamp(dragStart.anchorX + du, ...LIMITS.anchorX);
      // 靠近垂轴尖端时轻轻吸附
      if (Math.abs(nx - state.stemX) < 0.035) nx = state.stemX;
      state.anchorX = nx;
      if (Math.abs(nx - state.stemX) < 0.04) state.anchorStrength = 1;
    } else if (dragMode === "stem") {
      let nx = clamp(dragStart.stemX + du, ...LIMITS.stemX);
      // 靠近正中轴 0.50 时轻柔吸附
      if (Math.abs(nx - 0.5) < 0.022 && dxPx > 6) nx = 0.5;
      // 若落点本来就和垂轴对齐，拖拽垂轴时一起跟随（若原本脱靶则保持独立，让用户真去校准）
      const wasAligned = Math.abs(dragStart.anchorX - dragStart.stemX) < 0.04;
      state.stemX = nx;
      if (wasAligned) state.anchorX = nx;
    }
    syncDOM();
    ctl.draw();
  });

  function finishDrag(ev) {
    if (!dragMode) return;
    // 单击快速修补逻辑
    if (!moved) {
      if (dragMode === "gap") {
        state.stemGap = 0;
      } else if (dragMode === "clutter") {
        state.clutter = 0;
      } else if (dragMode === "anchor") {
        state.anchorX = state.stemX;
        state.anchorStrength = 1;
      }
    }
    dragMode = null;
    dragStart = null;
    state.activeHandle = null;
    try {
      if (ev?.pointerId != null) canvas.releasePointerCapture(ev.pointerId);
    } catch {}
    syncDOM();
    ctl.draw();
  }

  canvas.addEventListener("pointerup", finishDrag);
  canvas.addEventListener("pointercancel", finishDrag);

  // 键盘操作（无障碍与桌面微调）
  canvas.addEventListener("keydown", (ev) => {
    const step = ev.shiftKey ? 0.06 : 0.025;
    if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      animTarget = null;
      if (ev.shiftKey) state.barSpan = clamp(state.barSpan - step, ...LIMITS.barSpan);
      else state.stemX = clamp(state.stemX - step, ...LIMITS.stemX);
    } else if (ev.key === "ArrowRight") {
      ev.preventDefault();
      animTarget = null;
      if (ev.shiftKey) state.barSpan = clamp(state.barSpan + step, ...LIMITS.barSpan);
      else state.stemX = clamp(state.stemX + step, ...LIMITS.stemX);
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      animTarget = null;
      state.barH = clamp(state.barH - 0.02, ...LIMITS.barH);
    } else if (ev.key === "ArrowDown") {
      ev.preventDefault();
      animTarget = null;
      state.barH = clamp(state.barH + 0.02, ...LIMITS.barH);
    } else if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      if (state.stemGap > 0) state.stemGap = 0;
      else if (state.clutter > 0) state.clutter = 0;
      else {
        state.anchorX = state.stemX;
        state.anchorStrength = 1;
      }
    } else {
      return;
    }
    syncDOM();
    ctl.draw();
  });

  // 控件绑定
  slSpan?.addEventListener("input", () => {
    animTarget = null;
    state.barSpan = Number(slSpan.value) / 100;
    syncDOM();
    ctl.draw();
  });
  slBarH?.addEventListener("input", () => {
    animTarget = null;
    state.barH = Number(slBarH.value) / 100;
    syncDOM();
    ctl.draw();
  });
  slStemX?.addEventListener("input", () => {
    animTarget = null;
    const wasAligned = Math.abs(state.anchorX - state.stemX) < 0.04;
    state.stemX = Number(slStemX.value) / 100;
    if (wasAligned) state.anchorX = state.stemX;
    syncDOM();
    ctl.draw();
  });
  slAnchorW?.addEventListener("input", () => {
    animTarget = null;
    state.anchorW = Number(slAnchorW.value) / 100;
    syncDOM();
    ctl.draw();
  });

  btnHealGap?.addEventListener("click", () => {
    animTarget = null;
    state.stemGap = state.stemGap > 0.04 ? 0 : 0.22;
    syncDOM();
    ctl.draw();
  });
  btnAlignAnchor?.addEventListener("click", () => {
    animTarget = null;
    state.anchorX = state.stemX;
    state.anchorStrength = 1;
    if (state.anchorW > state.barSpan * 0.58) state.anchorW = Math.min(0.36, state.barSpan * 0.45);
    syncDOM();
    ctl.draw();
  });
  btnClearClutter?.addEventListener("click", () => {
    animTarget = null;
    state.clutter = state.clutter > 0 ? 0 : 1;
    syncDOM();
    ctl.draw();
  });
  btnToggleFlow?.addEventListener("click", () => {
    state.showFlow = !state.showFlow;
    syncDOM();
    ctl.draw();
  });

  // 场景切签
  document.querySelectorAll("[data-scene-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.scene = btn.dataset.sceneBtn;
      syncDOM(true);
      ctl.draw();
    });
  });

  // 方案与试错按钮
  document.querySelectorAll("[data-preset-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = PRESETS[btn.dataset.presetBtn];
      if (!p) return;
      animTarget = { ...p };
      ctl.draw();
    });
  });

  const ctl = loop(canvas, renderFrame);
  window.addEventListener("resize", () => ctl.draw());
  syncDOM(true);
  ctl.draw();

  return { state, evaluate: () => evaluate(state) };
}

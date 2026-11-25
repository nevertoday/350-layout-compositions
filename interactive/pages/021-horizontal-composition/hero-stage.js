// 021 水平构图 · 开场通栏海平水准与地平构图台（2D Canvas + 实体气泡水准仪长轨 + 贯穿白海平线）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  INITIAL_HERO,
  TILT_LIMIT,
  HORIZON_MIN,
  HORIZON_MAX,
  FRAME_MODES,
  clamp,
  snapTilt,
  snapHorizon,
  diagnoseHero,
} from "./model.js";

const PALETTE = {
  paper:     "#F7ECDD",
  paperDeep: "#EDE0CC",
  ink:       "#06182C",
  mountain:  "#0A2036",
  mountain2: "#21466B",
  seaTop:    "#285280",
  seaMid:    "#2E5A88",
  seaDeep:   "#1F436B",
  foam:      "#FBF5EC",
  sun:       "#D35638",
  sunWarm:   "#DE684B",
  mistSky:   "#E7DFD3",
  mistSea:   "#294D72",
  grass:     "#C69C43",
  grassDeep: "#A67F2E",
  wall:      "#F6EFE4",
};

export function initHeroStage(onStateChange) {
  const stageEl = document.getElementById("hero-stage");
  const canvas = document.getElementById("hero-canvas");
  const ctx = canvas.getContext("2d");

  const bubbleTrack = document.getElementById("bubble-track");
  const bubbleKnob = document.getElementById("bubble-knob");
  const bubbleFill = document.getElementById("bubble-glow");
  const horizonGripL = document.getElementById("horizon-grip-l");
  const horizonGripR = document.getElementById("horizon-grip-r");
  const horizonGripText = document.getElementById("horizon-grip-pct");

  // 实时读数节点
  const elTiltVal = document.getElementById("ro-tilt-val");
  const elBubbleDir = document.getElementById("ro-bubble-dir");
  const elSkySea = document.getElementById("ro-sky-sea");
  const elBadge = document.getElementById("ro-badge");
  const elBand = document.getElementById("ro-band");
  const elHeadline = document.getElementById("ro-headline");
  const elWhy = document.getElementById("ro-why");
  const elMiniLine = document.getElementById("mini-horizon-line");
  const elMiniDot = document.getElementById("mini-horizon-dot");
  const elMiniRef = document.getElementById("mini-ref-line");
  const elTitleRule = document.getElementById("title-horizon-rule");
  const elLevelRing = document.getElementById("diag-level-ring");

  // 缓存按钮节点，避免拖动期间高频 querySelectorAll
  const specimenBtns = [...document.querySelectorAll("[data-hero-specimen]")];
  const frameBtns = [...document.querySelectorAll("[data-hero-frame]")];
  const presetBtns = [...document.querySelectorAll("[data-horizon-preset]")];

  const state = {
    ...INITIAL_HERO,
    animTilt: INITIAL_HERO.tilt,
    animHorizon: INITIAL_HERO.horizon,
    draggingTilt: false,
    draggingHorizon: false,
    settledFlash: 0,
    prevSettled: false,
    lastGripY: -1,
    lastGripPct: -1,
  };

  let cw = 900;
  let ch = 360;
  let dpr = 1;

  function resize() {
    const rect = stageEl.getBoundingClientRect();
    cw = Math.max(260, Math.round(rect.width));
    ch = Math.max(190, Math.round(rect.height));
    dpr = pixelRatio(cw <= 520 ? 1.5 : 2);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    state.lastGripY = -1;
    syncGrips();
  }

  function getActiveFrameRect() {
    const mode = FRAME_MODES.find((m) => m.id === state.frameMode) || FRAME_MODES[0];
    if (mode.id === "pano") {
      return { x: 0, y: 0, w: cw, h: ch, clipped: false };
    }
    let fw;
    if (mode.id === "portrait") {
      fw = Math.min(cw * 0.46, ch * 0.76);
      fw = Math.max(fw, Math.min(cw * 0.42, 160));
    } else {
      fw = Math.min(cw * 0.74, ch * 1.48);
      fw = Math.max(fw, cw * 0.56);
    }
    const x = Math.round((cw - fw) / 2);
    return { x, y: 0, w: Math.round(fw), h: ch, clipped: true };
  }

  function syncGrips() {
    const yPx = clamp(Math.round(ch * (1 - state.animHorizon)), 26, Math.max(28, ch - 26));
    const seaPct = Math.round(state.horizon * 100);
    if (yPx !== state.lastGripY) {
      state.lastGripY = yPx;
      horizonGripL.style.top = `${yPx}px`;
      horizonGripR.style.top = `${yPx}px`;
    }
    if (seaPct !== state.lastGripPct) {
      state.lastGripPct = seaPct;
      horizonGripText.textContent = `${seaPct}%`;
      horizonGripL.setAttribute("aria-valuenow", String(seaPct));
      horizonGripR.setAttribute("aria-valuenow", String(seaPct));
    }
  }

  function syncUI() {
    const diag = diagnoseHero(state);

    elTiltVal.textContent = diag.tiltText;
    elBubbleDir.textContent = diag.highEnd;
    elSkySea.textContent = `天 ${diag.skyPct}% · 海 ${diag.seaPct}%`;

    elBadge.textContent = diag.badge;
    elBadge.dataset.tone = diag.tone;
    elBand.textContent = diag.levelBand;
    elBand.dataset.tone = diag.tone;
    elHeadline.textContent = diag.headline;
    elWhy.textContent = diag.why;

    // 气泡水准仪滑块位置（12% ~ 88% 轨道范围避免贴死边壁）
    const pct = 50 + diag.bubbleNorm * 38;
    bubbleKnob.style.left = `${pct.toFixed(2)}%`;
    bubbleKnob.dataset.level = diag.isLevel ? "true" : "false";
    bubbleTrack.setAttribute("aria-valuenow", String(state.tilt));
    bubbleTrack.setAttribute("aria-valuetext", `倾角 ${diag.tiltText}，${diag.highEnd}`);
    if (bubbleFill) {
      bubbleFill.style.opacity = diag.isLevel ? "1" : "0";
    }

    // 刊头示范水平基准线随倾角同步联动
    if (elTitleRule) {
      elTitleRule.style.transform = `rotate(${(state.tilt * 0.45).toFixed(2)}deg)`;
      elTitleRule.dataset.level = diag.isLevel ? "true" : "false";
    }
    if (elLevelRing) {
      elLevelRing.style.transform = `rotate(${state.tilt.toFixed(2)}deg)`;
      elLevelRing.dataset.level = diag.isLevel ? "true" : "false";
    }

    // 右侧微型取景框与主画布 100% 同源
    if (elMiniLine && elMiniDot) {
      const my = 6 + (1 - state.horizon) * 60; // viewBox 0 0 132 72, 内框 y: 6..66
      const rad = (state.tilt * Math.PI) / 180;
      const dx = 58 * Math.cos(rad);
      const dy = 58 * Math.sin(rad);
      elMiniLine.setAttribute("x1", (66 - dx).toFixed(1));
      elMiniLine.setAttribute("y1", (my - dy).toFixed(1));
      elMiniLine.setAttribute("x2", (66 + dx).toFixed(1));
      elMiniLine.setAttribute("y2", (my + dy).toFixed(1));
      elMiniDot.setAttribute("cy", my.toFixed(1));
      elMiniDot.setAttribute("cx", "66");
      elMiniDot.setAttribute("fill", diag.settled ? "#FBF5EC" : "#E87A5D");
      if (elMiniRef) {
        elMiniRef.setAttribute("y1", my.toFixed(1));
        elMiniRef.setAttribute("y2", my.toFixed(1));
        elMiniRef.setAttribute("opacity", diag.isLevel ? "0" : "0.55");
      }
    }

    // 更新按钮激活状态
    specimenBtns.forEach((btn) => {
      const next = String(btn.dataset.heroSpecimen === state.specimen);
      if (btn.getAttribute("aria-pressed") !== next) btn.setAttribute("aria-pressed", next);
    });
    frameBtns.forEach((btn) => {
      const next = String(btn.dataset.heroFrame === state.frameMode);
      if (btn.getAttribute("aria-pressed") !== next) btn.setAttribute("aria-pressed", next);
    });
    presetBtns.forEach((btn) => {
      const target = Number(btn.dataset.horizonPreset);
      const next = String(Math.abs(state.horizon - target) <= 0.025);
      if (btn.getAttribute("aria-pressed") !== next) btn.setAttribute("aria-pressed", next);
    });

    if (diag.settled && !state.prevSettled) {
      state.settledFlash = 1.0;
    }
    state.prevSettled = diag.settled;

    syncGrips();
    if (onStateChange) onStateChange(state, diag);
  }

  // ---------- 场景绘制器（忠实 021 原海报版画质感） ----------
  function drawPosterScene(c, diagSpan, hyLocal, t, isLevel) {
    const halfW = diagSpan;
    const skyH = diagSpan;

    // 1. 暖米纸天空
    const skyGrad = c.createLinearGradient(0, hyLocal - ch * 0.8, 0, hyLocal);
    skyGrad.addColorStop(0, "#F9F1E4");
    skyGrad.addColorStop(1, PALETTE.paper);
    c.fillStyle = skyGrad;
    c.fillRect(-halfW, hyLocal - skyH, halfW * 2, skyH + 2);

    // 2. 朱陶红日（严格等半径正圆，绝不拉成椭圆）
    const sunR = clamp(Math.min(cw * 0.082, ch * 0.19), 26, 70);
    const sunX = cw * 0.30;
    const sunY = hyLocal - Math.max(sunR * 1.48, ch * 0.31);
    const sunGrad = c.createRadialGradient(sunX - sunR * 0.18, sunY - sunR * 0.18, sunR * 0.12, sunX, sunY, sunR);
    sunGrad.addColorStop(0, PALETTE.sunWarm);
    sunGrad.addColorStop(1, PALETTE.sun);
    c.fillStyle = sunGrad;
    c.beginPath();
    c.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    c.fill();

    // 3. 连绵墨蓝远山（贴着海平线舒展，右侧起伏呼应原海报）
    const mScale = clamp(ch * 0.14, 24, 58);
    // 远层灰蓝山脉
    c.fillStyle = PALETTE.mountain2;
    c.beginPath();
    c.moveTo(-halfW, hyLocal + 1);
    c.lineTo(-cw * 0.12, hyLocal + 1);
    c.bezierCurveTo(-cw * 0.02, hyLocal - mScale * 0.45, cw * 0.08, hyLocal - mScale * 0.65, cw * 0.19, hyLocal - mScale * 0.38);
    c.bezierCurveTo(cw * 0.31, hyLocal - mScale * 0.15, cw * 0.40, hyLocal - mScale * 0.58, halfW, hyLocal - mScale * 0.30);
    c.lineTo(halfW, hyLocal + 1);
    c.closePath();
    c.fill();

    // 近层深墨蓝主山（原海报同款右侧山脊）
    c.fillStyle = PALETTE.mountain;
    c.beginPath();
    c.moveTo(-cw * 0.04, hyLocal + 1);
    c.bezierCurveTo(cw * 0.04, hyLocal - mScale * 0.22, cw * 0.10, hyLocal - mScale * 0.92, cw * 0.18, hyLocal - mScale * 0.86);
    c.bezierCurveTo(cw * 0.25, hyLocal - mScale * 0.80, cw * 0.30, hyLocal - mScale * 0.46, cw * 0.38, hyLocal - mScale * 0.72);
    c.bezierCurveTo(cw * 0.44, hyLocal - mScale * 0.88, cw * 0.52, hyLocal - mScale * 0.50, halfW, hyLocal - mScale * 0.48);
    c.lineTo(halfW, hyLocal + 1);
    c.closePath();
    c.fill();

    // 4. 普鲁士海蓝水带
    const seaGrad = c.createLinearGradient(0, hyLocal, 0, hyLocal + ch * 0.9);
    seaGrad.addColorStop(0, PALETTE.seaTop);
    seaGrad.addColorStop(0.45, PALETTE.seaMid);
    seaGrad.addColorStop(1, PALETTE.seaDeep);
    c.fillStyle = seaGrad;
    c.fillRect(-halfW, hyLocal, halfW * 2, diagSpan);

    // 5. 水面水平微澜层纹（克制缓慢，增强延伸与水感）
    const ripples = [
      { dy: 0.08, len: 0.34, x0: -0.24, sp: 0.22 },
      { dy: 0.17, len: 0.26, x0: 0.12,  sp: -0.18 },
      { dy: 0.27, len: 0.42, x0: -0.32, sp: 0.14 },
      { dy: 0.39, len: 0.30, x0: 0.02,  sp: -0.15 },
      { dy: 0.52, len: 0.46, x0: -0.18, sp: 0.12 },
    ];
    c.strokeStyle = "rgba(251, 245, 236, 0.16)";
    c.lineWidth = 1.2;
    for (const r of ripples) {
      const ry = hyLocal + Math.max(12, ch * r.dy);
      const drift = Math.sin(t * r.sp + r.dy * 12) * 14;
      const rx = cw * r.x0 + drift;
      c.beginPath();
      c.moveTo(rx, ry);
      c.lineTo(rx + cw * r.len, ry);
      c.stroke();
    }

    // 6. 原海报同款白帆船 + 水中淡倒影（稳立在海平线上！）
    const boatX = cw * 0.24;
    const boatS = clamp(ch * 0.16, 26, 56);
    const sway = Math.sin(t * 0.9) * 0.6;

    // 倒影（轻微水平波纹切分）
    c.save();
    c.fillStyle = "rgba(251, 245, 236, 0.20)";
    for (let i = 0; i < 6; i++) {
      const k = i / 6;
      const wBar = boatS * (0.68 - k * 0.42);
      const yBar = hyLocal + 6 + i * (boatS * 0.11);
      const shift = Math.sin(t * 1.4 + i * 1.1) * 2.2;
      c.fillRect(boatX - wBar * 0.55 + shift, yBar, wBar, 2.2);
    }
    c.restore();

    // 船身与双白帆
    c.fillStyle = PALETTE.foam;
    // 主帆（左大三角）
    c.beginPath();
    c.moveTo(boatX - 2, hyLocal - boatS * 0.14);
    c.lineTo(boatX - 2, hyLocal - boatS * 1.05 + sway);
    c.lineTo(boatX - boatS * 0.56, hyLocal - boatS * 0.14);
    c.closePath();
    c.fill();
    // 前帆（右小三角）
    c.beginPath();
    c.moveTo(boatX + 3, hyLocal - boatS * 0.14);
    c.lineTo(boatX + 3, hyLocal - boatS * 0.88 + sway);
    c.lineTo(boatX + boatS * 0.42, hyLocal - boatS * 0.14);
    c.closePath();
    c.fill();
    // 船体底座
    c.beginPath();
    c.moveTo(boatX - boatS * 0.60, hyLocal - boatS * 0.08);
    c.lineTo(boatX + boatS * 0.48, hyLocal - boatS * 0.08);
    c.lineTo(boatX + boatS * 0.34, hyLocal + 1);
    c.lineTo(boatX - boatS * 0.46, hyLocal + 1);
    c.closePath();
    c.fill();

    // 7. 贯穿全幅的锐白海平线
    drawWhiteHorizonLine(c, halfW, hyLocal, isLevel);
  }

  function drawLighthouseScene(c, diagSpan, hyLocal, t, isLevel) {
    const halfW = diagSpan;
    const skyGrad = c.createLinearGradient(0, hyLocal - ch * 0.8, 0, hyLocal);
    skyGrad.addColorStop(0, "#EFE9DF");
    skyGrad.addColorStop(1, "#F7F1E7");
    c.fillStyle = skyGrad;
    c.fillRect(-halfW, hyLocal - diagSpan, halfW * 2, diagSpan + 2);

    // 淡云水平薄带
    c.fillStyle = "rgba(43, 86, 132, 0.07)";
    c.fillRect(-halfW, hyLocal - ch * 0.46, halfW * 2, ch * 0.07);
    c.fillRect(-halfW, hyLocal - ch * 0.25, halfW * 2, ch * 0.04);

    // 海面
    const seaGrad = c.createLinearGradient(0, hyLocal, 0, hyLocal + ch * 0.85);
    seaGrad.addColorStop(0, "#3A6B99");
    seaGrad.addColorStop(0.5, "#285380");
    seaGrad.addColorStop(1, "#1D3F64");
    c.fillStyle = seaGrad;
    c.fillRect(-halfW, hyLocal, halfW * 2, diagSpan);

    // 轻柔水平海浪线
    c.strokeStyle = "rgba(251, 245, 236, 0.20)";
    c.lineWidth = 1.2;
    for (let i = 1; i <= 5; i++) {
      const ry = hyLocal + i * Math.max(14, ch * 0.085);
      const dx = Math.sin(t * 0.5 + i) * 16;
      c.beginPath();
      c.moveTo(-cw * 0.45 + dx, ry);
      c.lineTo(cw * 0.12 + dx, ry);
      c.stroke();
    }

    // 右侧水平礁堤
    const pierX = cw * 0.16;
    const pierH = clamp(ch * 0.045, 10, 18);
    c.fillStyle = "#122B45";
    c.fillRect(pierX, hyLocal - pierH, halfW - pierX, pierH + 2);

    // 白塔身 + 朱陶红顶灯塔
    const tx = cw * 0.24;
    const th = clamp(ch * 0.22, 38, 76);
    const tw = th * 0.24;
    c.fillStyle = PALETTE.foam;
    c.beginPath();
    c.moveTo(tx - tw * 0.62, hyLocal - pierH);
    c.lineTo(tx - tw * 0.40, hyLocal - pierH - th * 0.78);
    c.lineTo(tx + tw * 0.40, hyLocal - pierH - th * 0.78);
    c.lineTo(tx + tw * 0.62, hyLocal - pierH);
    c.closePath();
    c.fill();
    // 红顶
    c.fillStyle = PALETTE.sun;
    c.fillRect(tx - tw * 0.46, hyLocal - pierH - th * 0.90, tw * 0.92, th * 0.12);
    c.beginPath();
    c.moveTo(tx - tw * 0.48, hyLocal - pierH - th * 0.90);
    c.lineTo(tx, hyLocal - pierH - th * 1.08);
    c.lineTo(tx + tw * 0.48, hyLocal - pierH - th * 0.90);
    c.closePath();
    c.fill();

    // 塔影微澜
    c.fillStyle = "rgba(251, 245, 236, 0.22)";
    for (let i = 0; i < 4; i++) {
      c.fillRect(tx - tw * (0.5 - i * 0.08), hyLocal + 7 + i * 7, tw * (1.0 - i * 0.16), 2);
    }

    drawWhiteHorizonLine(c, halfW, hyLocal, isLevel);
  }

  function drawPrairieScene(c, diagSpan, hyLocal, t, isLevel) {
    const halfW = diagSpan;
    // 深蓝晴空（呼应原海报建筑示例）
    const skyGrad = c.createLinearGradient(0, hyLocal - ch * 0.85, 0, hyLocal);
    skyGrad.addColorStop(0, "#1E456E");
    skyGrad.addColorStop(1, "#2C5986");
    c.fillStyle = skyGrad;
    c.fillRect(-halfW, hyLocal - diagSpan, halfW * 2, diagSpan + 2);

    // 金沙大平原横带
    const landGrad = c.createLinearGradient(0, hyLocal, 0, hyLocal + ch * 0.8);
    landGrad.addColorStop(0, PALETTE.paper);
    landGrad.addColorStop(0.28, "#E9DEC9");
    landGrad.addColorStop(0.29, "#D8C9B0");
    landGrad.addColorStop(1, "#C5B49A");
    c.fillStyle = landGrad;
    c.fillRect(-halfW, hyLocal, halfW * 2, diagSpan);

    // 赖特草原长屋剪影（水平悬挑屋檐 + 长白墙 + 朱红双门）
    const wallH = clamp(ch * 0.15, 28, 56);
    const roofW = Math.min(cw * 0.64, 520);
    const roofY = hyLocal - wallH;
    // 白长墙
    c.fillStyle = PALETTE.wall;
    c.fillRect(-roofW * 0.44, roofY + 6, roofW * 0.88, wallH - 6);
    // 水平悬挑深墨檐
    c.fillStyle = PALETTE.ink;
    c.fillRect(-roofW * 0.52, roofY, roofW * 1.04, 7);
    // 连续带状横窗
    c.fillStyle = "#264F7B";
    c.fillRect(-roofW * 0.36, roofY + 13, roofW * 0.24, Math.max(5, wallH * 0.18));
    c.fillRect(roofW * 0.12, roofY + 13, roofW * 0.24, Math.max(5, wallH * 0.18));
    // 中央朱陶红双门（原海报建筑示例标志色）
    const doorW = clamp(wallH * 0.62, 18, 34);
    const doorH = wallH * 0.58;
    c.fillStyle = PALETTE.sun;
    c.fillRect(-doorW / 2, hyLocal - doorH, doorW, doorH);
    c.strokeStyle = PALETTE.ink;
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(0, hyLocal - doorH);
    c.lineTo(0, hyLocal);
    c.stroke();

    // 基座水平细阴线
    c.fillStyle = PALETTE.ink;
    c.fillRect(-halfW, hyLocal, halfW * 2, 2.5);

    // 极轻风动草纹
    c.strokeStyle = "rgba(38, 79, 123, 0.15)";
    c.lineWidth = 1;
    const shift = Math.sin(t * 0.6) * 8;
    c.beginPath();
    c.moveTo(-cw * 0.35 + shift, hyLocal + ch * 0.18);
    c.lineTo(cw * 0.28 + shift, hyLocal + ch * 0.18);
    c.stroke();

    drawWhiteHorizonLine(c, halfW, hyLocal - wallH - 1, false, 0.25);
    drawWhiteHorizonLine(c, halfW, hyLocal, isLevel);
  }

  function drawMinimalScene(c, diagSpan, hyLocal, t, isLevel) {
    const halfW = diagSpan;
    // 杉本博司式极简雾天 + 静海（严用原海报米白与深海蓝）
    const skyGrad = c.createLinearGradient(0, hyLocal - ch * 0.75, 0, hyLocal);
    skyGrad.addColorStop(0, "#E5DDD0");
    skyGrad.addColorStop(0.7, "#F2EAE0");
    skyGrad.addColorStop(1, "#F7EFE4");
    c.fillStyle = skyGrad;
    c.fillRect(-halfW, hyLocal - diagSpan, halfW * 2, diagSpan + 2);

    const seaGrad = c.createLinearGradient(0, hyLocal, 0, hyLocal + ch * 0.75);
    seaGrad.addColorStop(0, "#244A73");
    seaGrad.addColorStop(0.45, "#1A3859");
    seaGrad.addColorStop(1, "#0E2239");
    c.fillStyle = seaGrad;
    c.fillRect(-halfW, hyLocal, halfW * 2, diagSpan);

    // 极微水雾过渡
    const haze = c.createLinearGradient(0, hyLocal - 12, 0, hyLocal + 14);
    haze.addColorStop(0, "rgba(247, 236, 221, 0)");
    haze.addColorStop(0.5, "rgba(247, 236, 221, 0.26)");
    haze.addColorStop(1, "rgba(36, 74, 115, 0)");
    c.fillStyle = haze;
    c.fillRect(-halfW, hyLocal - 12, halfW * 2, 26);

    // 极微缓水平光波
    const waveAlpha = 0.08 + 0.03 * Math.sin(t * 0.7);
    c.strokeStyle = `rgba(251, 245, 236, ${waveAlpha.toFixed(3)})`;
    c.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const y = hyLocal + i * Math.max(18, ch * 0.09);
      c.beginPath();
      c.moveTo(-halfW, y);
      c.lineTo(halfW, y);
      c.stroke();
    }

    drawWhiteHorizonLine(c, halfW, hyLocal, isLevel);
  }

  function drawWhiteHorizonLine(c, halfW, y, isLevel, alpha = 1) {
    c.save();
    c.globalAlpha = alpha;
    c.strokeStyle = PALETTE.foam;
    c.lineWidth = isLevel ? 2.4 : 1.8;
    c.beginPath();
    c.moveTo(-halfW, y);
    c.lineTo(halfW, y);
    c.stroke();
    c.restore();
  }

  // 主帧绘制
  function render(t, dt, { still }) {
    // 平滑插值（拖动时直接跟手，点按钮时丝滑过渡，reducedMotion 时一步到位）
    if (still || state.draggingTilt) {
      state.animTilt = state.tilt;
    } else {
      state.animTilt += (state.tilt - state.animTilt) * Math.min(1, dt * 14);
      if (Math.abs(state.tilt - state.animTilt) < 0.02) state.animTilt = state.tilt;
    }

    if (still || state.draggingHorizon) {
      state.animHorizon = state.horizon;
    } else {
      state.animHorizon += (state.horizon - state.animHorizon) * Math.min(1, dt * 14);
      if (Math.abs(state.horizon - state.animHorizon) < 0.002) state.animHorizon = state.horizon;
    }

    if (state.settledFlash > 0 && !still) {
      state.settledFlash = Math.max(0, state.settledFlash - dt * 1.4);
    } else if (still) {
      state.settledFlash = 0;
    }

    syncGrips();

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cw, ch);

    const cx = cw / 2;
    const hy = ch * (1 - state.animHorizon);
    // 倾角上限 8°，只需覆盖旋转后四角的外接半宽与半高即可，大幅减少软件光栅化填充面积
    const diagSpan = Math.ceil(Math.max(cw * 0.64 + ch * 0.22, ch * 0.92 + cw * 0.16) + 20);
    const rad = (state.animTilt * Math.PI) / 180;
    const isLevel = Math.abs(state.animTilt) <= 0.55;

    // 围绕 (cx, hy) 旋转整个海天世界，使海平线中心始终钉在用户拖到的高度上！
    ctx.save();
    ctx.translate(cx, hy);
    ctx.rotate(rad);

    if (state.specimen === "poster") {
      drawPosterScene(ctx, diagSpan, 0, still ? 0 : t, isLevel);
    } else if (state.specimen === "lighthouse") {
      drawLighthouseScene(ctx, diagSpan, 0, still ? 0 : t, isLevel);
    } else if (state.specimen === "prairie") {
      drawPrairieScene(ctx, diagSpan, 0, still ? 0 : t, isLevel);
    } else {
      drawMinimalScene(ctx, diagSpan, 0, still ? 0 : t, isLevel);
    }
    ctx.restore();

    // 当倾角不为 0 时，叠绘极克制的真实 0° 水平虚线参照与右侧角度扇弧
    if (!isLevel) {
      ctx.save();
      ctx.strokeStyle = "rgba(211, 86, 56, 0.72)";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(14, hy);
      ctx.lineTo(cw - 14, hy);
      ctx.stroke();
      ctx.setLineDash([]);

      // 中央偏左小角度弧示意
      const arcR = Math.min(72, cw * 0.14);
      ctx.fillStyle = "rgba(211, 86, 56, 0.22)";
      ctx.beginPath();
      ctx.moveTo(cx, hy);
      ctx.arc(cx, hy, arcR, rad > 0 ? 0 : rad, rad > 0 ? rad : 0);
      ctx.closePath();
      ctx.fill();

      // 0° 基准标签（置于左三分之一处，带暖米实底与朱红细边，避开右侧远山与白帆船）
      const tagText = `0° 基准`;
      ctx.font = '700 11px "Space Mono", "Noto Sans SC", sans-serif';
      const tw = ctx.measureText(tagText).width + 14;
      const th = 20;
      const tagX = clamp(cw * 0.28 - tw / 2, 86, Math.max(88, cx - 24));
      const tagY = hy > 36 ? hy - th - 6 : hy + 8;
      ctx.fillStyle = "rgba(251, 245, 236, 0.94)";
      ctx.fillRect(tagX, tagY, tw, th);
      ctx.strokeStyle = "#A9351C";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(tagX, tagY, tw, th);
      ctx.fillStyle = "#A9351C";
      ctx.fillText(tagText, tagX + 7, tagY + 14);
      ctx.restore();
    }

    // 三分辅助细刻度（画布最左右内缘 33% / 50% / 67% 极细小刻痕）
    ctx.save();
    const tickAnchors = [0.33, 0.50, 0.67];
    for (const a of tickAnchors) {
      const ty = ch * (1 - a);
      const active = Math.abs(state.animHorizon - a) < 0.025;
      ctx.strokeStyle = active ? "rgba(211, 86, 56, 0.9)" : "rgba(6, 24, 44, 0.34)";
      ctx.lineWidth = active ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(0, ty);
      ctx.lineTo(active ? 14 : 8, ty);
      ctx.moveTo(cw - (active ? 14 : 8), ty);
      ctx.lineTo(cw, ty);
      ctx.stroke();
    }
    ctx.restore();

    // 画幅遮幅（4:3 常规 / 3:4 竖框截断）
    const fr = getActiveFrameRect();
    if (fr.clipped) {
      ctx.save();
      ctx.fillStyle = "rgba(6, 24, 44, 0.72)";
      ctx.fillRect(0, 0, fr.x, ch);
      ctx.fillRect(fr.x + fr.w, 0, cw - (fr.x + fr.w), ch);

      // 遮幅裁切虚线与内取景白框
      ctx.strokeStyle = state.frameMode === "portrait" ? "#E87A5D" : "#FBF5EC";
      ctx.lineWidth = 2;
      ctx.strokeRect(fr.x + 1, 1, fr.w - 2, ch - 2);

      // 竖框截断标牌
      ctx.font = '700 11px "IBM Plex Sans", "Noto Sans SC", sans-serif';
      const label = state.frameMode === "portrait" ? "3:4 竖框 · 水平被截断" : "4:3 常规画幅";
      const tw = ctx.measureText(label).width + 16;
      ctx.fillStyle = state.frameMode === "portrait" ? "#B53D22" : "#06182C";
      ctx.fillRect(fr.x + 8, 8, tw, 22);
      ctx.fillStyle = "#FBF5EC";
      ctx.fillText(label, fr.x + 16, 23);
      ctx.restore();
    }

    // 锁平瞬间柔光脉冲（克制一次，不反复闪烁）
    if (state.settledFlash > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(251, 245, 236, ${(state.settledFlash * 0.75).toFixed(3)})`;
      ctx.lineWidth = 6 * state.settledFlash;
      ctx.beginPath();
      ctx.moveTo(0, hy);
      ctx.lineTo(cw, hy);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  const runner = loop(stageEl, render);

  // ---------- 交互绑定 ----------
  function setTilt(deg, allowSnap = true) {
    state.tilt = snapTilt(deg, allowSnap);
    syncUI();
    runner.draw();
  }

  function setHorizon(ratio, allowSnap = true) {
    state.horizon = snapHorizon(ratio, allowSnap);
    syncUI();
    runner.draw();
  }

  // 1. 实体气泡水准仪长轨（data-perf-drag，支持鼠标 + 触屏横向拖 + 点击落位）
  function tiltFromClientX(clientX, allowSnap = true) {
    const rect = bubbleTrack.getBoundingClientRect();
    const norm = clamp((clientX - rect.left) / rect.width, 0, 1); // 0=最左, 1=最右
    // norm=0.5 => tilt=0; norm=0.12 => bubbleNorm=-1 => tilt=+8; norm=0.88 => bubbleNorm=+1 => tilt=-8
    const bubbleNorm = clamp((norm - 0.5) / 0.38, -1, 1);
    return snapTilt(-bubbleNorm * TILT_LIMIT, allowSnap);
  }

  let uiRaf = 0;
  function requestSyncAndDraw() {
    if (reducedMotion.matches) {
      syncUI();
      runner.draw();
      return;
    }
    if (!uiRaf) {
      uiRaf = requestAnimationFrame(() => {
        uiRaf = 0;
        syncUI();
      });
    }
  }

  function startBubbleDrag(clientX) {
    state.draggingTilt = true;
    bubbleTrack.classList.add("is-dragging");
    const next = tiltFromClientX(clientX, false);
    if (next !== state.tilt) {
      state.tilt = next;
      requestSyncAndDraw();
    }
  }
  function moveBubbleDrag(clientX) {
    if (!state.draggingTilt) return;
    const next = tiltFromClientX(clientX, false);
    if (next !== state.tilt) {
      state.tilt = next;
      requestSyncAndDraw();
    }
  }
  function endBubbleDrag() {
    if (!state.draggingTilt) return;
    state.draggingTilt = false;
    bubbleTrack.classList.remove("is-dragging");
    state.tilt = snapTilt(state.tilt, true);
    syncUI();
    if (reducedMotion.matches) runner.draw();
  }

  let activeTouchDrag = false;
  bubbleTrack.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏统一走 touch 事件，避免双触发重绘
    if (e.pointerType === "mouse" && e.button !== 0) return;
    bubbleTrack.setPointerCapture?.(e.pointerId);
    bubbleTrack.focus({ preventScroll: true });
    startBubbleDrag(e.clientX);
  });
  bubbleTrack.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" || activeTouchDrag) return;
    moveBubbleDrag(e.clientX);
  });
  bubbleTrack.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    endBubbleDrag();
  });
  bubbleTrack.addEventListener("pointercancel", endBubbleDrag);

  // 显式兼容 CDP Input.dispatchTouchEvent（tools/perf.mjs 发纯 touch 事件）
  bubbleTrack.addEventListener("touchstart", (e) => {
    const pt = e.touches[0];
    if (!pt) return;
    activeTouchDrag = true;
    startBubbleDrag(pt.clientX);
  }, { passive: true });
  bubbleTrack.addEventListener("touchmove", (e) => {
    const pt = e.touches[0];
    if (!pt) return;
    moveBubbleDrag(pt.clientX);
  }, { passive: true });
  bubbleTrack.addEventListener("touchend", () => {
    activeTouchDrag = false;
    endBubbleDrag();
  }, { passive: true });

  bubbleTrack.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setTilt(state.tilt + (e.shiftKey ? 1.0 : 0.5), false);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setTilt(state.tilt - (e.shiftKey ? 1.0 : 0.5), false);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHorizon(state.horizon + 0.03, false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHorizon(state.horizon - 0.03, false);
    } else if (e.key === "0") {
      e.preventDefault();
      setTilt(0, true);
    }
  });

  // 2. 贯穿白色海平线左右滑钮（上下拖 + 键盘）
  function horizonFromClientY(clientY, allowSnap = true) {
    const rect = stageEl.getBoundingClientRect();
    const fromBottom = 1 - (clientY - rect.top) / rect.height;
    return snapHorizon(fromBottom, allowSnap);
  }

  function bindHorizonGrip(grip) {
    grip.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      grip.setPointerCapture?.(e.pointerId);
      grip.focus({ preventScroll: true });
      state.draggingHorizon = true;
      grip.classList.add("is-dragging");
      state.horizon = horizonFromClientY(e.clientY, false);
      syncUI();
      runner.draw();
    });
    grip.addEventListener("pointermove", (e) => {
      if (!state.draggingHorizon) return;
      state.horizon = horizonFromClientY(e.clientY, false);
      syncUI();
      runner.draw();
    });
    const stop = () => {
      if (!state.draggingHorizon) return;
      state.draggingHorizon = false;
      grip.classList.remove("is-dragging");
      state.horizon = snapHorizon(state.horizon, true);
      syncUI();
      runner.draw();
    };
    grip.addEventListener("pointerup", stop);
    grip.addEventListener("pointercancel", stop);
    grip.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHorizon(state.horizon + (e.shiftKey ? 0.08 : 0.03), false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHorizon(state.horizon - (e.shiftKey ? 0.08 : 0.03), false);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setTilt(state.tilt + 0.5, false);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setTilt(state.tilt - 0.5, false);
      }
    });
  }
  bindHorizonGrip(horizonGripL);
  bindHorizonGrip(horizonGripR);

  // 3. 在画布主体上直接拖动：鼠标按住接近海平线可上下拉海平线，远离海平线可左右微调倾角；触屏保留竖向滚页（touch-action: pan-y）
  let canvasMode = "";
  let startX = 0;
  let startTilt = 0;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hyPx = rect.height * (1 - state.horizon);
    if (e.pointerType === "mouse" && Math.abs(y - hyPx) <= 28) {
      canvasMode = "horizon";
      state.draggingHorizon = true;
      canvas.setPointerCapture?.(e.pointerId);
      state.horizon = horizonFromClientY(e.clientY, false);
      syncUI();
      runner.draw();
    } else {
      canvasMode = "tilt";
      startX = e.clientX;
      startTilt = state.tilt;
      state.draggingTilt = true;
      canvas.setPointerCapture?.(e.pointerId);
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (canvasMode === "horizon") {
      state.horizon = horizonFromClientY(e.clientY, false);
      syncUI();
      runner.draw();
    } else if (canvasMode === "tilt") {
      const dx = e.clientX - startX;
      const degDelta = -(dx / Math.max(240, cw)) * (TILT_LIMIT * 2.2);
      state.tilt = snapTilt(startTilt + degDelta, false);
      syncUI();
      runner.draw();
    }
  });
  const endCanvasDrag = () => {
    if (canvasMode === "horizon") {
      state.draggingHorizon = false;
      state.horizon = snapHorizon(state.horizon, true);
      syncUI();
      runner.draw();
    } else if (canvasMode === "tilt") {
      state.draggingTilt = false;
      state.tilt = snapTilt(state.tilt, true);
      syncUI();
      runner.draw();
    }
    canvasMode = "";
  };
  canvas.addEventListener("pointerup", endCanvasDrag);
  canvas.addEventListener("pointercancel", endCanvasDrag);

  // 4. 标本、画幅、海平预设与快捷操作按钮
  document.querySelectorAll("[data-hero-specimen]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.specimen = btn.dataset.heroSpecimen;
      syncUI();
      runner.draw();
    });
  });

  document.querySelectorAll("[data-hero-frame]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.frameMode = btn.dataset.heroFrame;
      syncUI();
      runner.draw();
    });
  });

  document.querySelectorAll("[data-horizon-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setHorizon(Number(btn.dataset.horizonPreset), true);
    });
  });

  document.getElementById("btn-hero-level")?.addEventListener("click", () => {
    setTilt(0, true);
  });

  document.getElementById("btn-hero-reset")?.addEventListener("click", () => {
    state.tilt = INITIAL_HERO.tilt;
    state.horizon = INITIAL_HERO.horizon;
    state.specimen = INITIAL_HERO.specimen;
    state.frameMode = INITIAL_HERO.frameMode;
    syncUI();
    runner.draw();
  });

  const ro = new ResizeObserver(() => {
    resize();
    runner.draw();
  });
  ro.observe(stageEl);

  resize();
  syncUI();
  runner.draw();

  return { state, setTilt, setHorizon };
}

// 开场主角玩具：原海报「分色大圆 + 0–180° 色相轨 + 面积分缝 + 抽灰实测」2D 画布实现
// 遵循 lib/stage.js 节电规范（离屏/后台自动停帧、pixelRatio<=2、reducedMotion 一帧到位）

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { bestInkOn, clamp, computeHeroColors, hexToRgb, lerp, POSTER, rgbToHex, simulateVision, SNAP_ANGLES } from "./color.js";

const smooth = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

export function createHero(canvas, stageEl, state, onLayout) {
  const ctx = canvas.getContext("2d");
  let w = 480;
  let h = 440;
  let dpr = 1;

  // 开场缓动：先从 112° 青绿对比滑向 180° 原海报经典蓝橙互补，每一刻都饱满清晰
  let enter = reducedMotion.matches ? 1 : 0;
  let dispDelta = reducedMotion.matches ? state.delta : 112;
  let dispSatL = state.satLeft;
  let dispSatR = state.satRight;
  let dispSpread = state.lumSpread;
  let dispRatio = state.ratio;

  let geom = { cx: 240, cy: 190, R: 120, orbitR: 150, x0: 44, x1: 436, ty: 386, barY: 270 };
  let dirty = true;
  let lastLayoutKey = "";
  let cachedGray = null;
  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");

  function trackStopColor(hex, gray) {
    return gray ? rgbToHex(simulateVision(hexToRgb(hex), "gray")) : hex;
  }

  function buildStaticLayer(gray) {
    const { cx, cy, orbitR, x0, x1, ty } = computeGeom();
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 透明纸底（让海报纸色与 6 条 SVG 虚线引线无缝穿透至外圈虚线轨道）
    bgCtx.clearRect(0, 0, w, h);

    // 十字虚线轴与外围同心虚线轨道圆
    bgCtx.save();
    bgCtx.strokeStyle = "rgba(16, 16, 14, 0.26)";
    bgCtx.lineWidth = 1;
    bgCtx.setLineDash([4, 4]);
    bgCtx.beginPath();
    bgCtx.moveTo(cx, cy - orbitR - 14);
    bgCtx.lineTo(cx, cy + orbitR + 12);
    bgCtx.moveTo(cx - orbitR - 20, cy);
    bgCtx.lineTo(cx + orbitR + 20, cy);
    bgCtx.stroke();

    bgCtx.beginPath();
    bgCtx.arc(cx, cy, orbitR, 0, Math.PI * 2);
    bgCtx.strokeStyle = "rgba(16, 16, 14, 0.30)";
    bgCtx.stroke();
    bgCtx.setLineDash([]);

    // 12 色轮细刻度
    bgCtx.strokeStyle = "rgba(16, 16, 14, 0.22)";
    bgCtx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2 - Math.PI / 2;
      bgCtx.beginPath();
      bgCtx.moveTo(cx + Math.cos(ang) * (orbitR - 3), cy + Math.sin(ang) * (orbitR - 3));
      bgCtx.lineTo(cx + Math.cos(ang) * (orbitR + 4), cy + Math.sin(ang) * (orbitR + 4));
      bgCtx.stroke();
    }

    // 底部 0°–180° 单向色相夹角轨道（无重复后半段！）
    const grad = bgCtx.createLinearGradient(x0, ty, x1, ty);
    grad.addColorStop(0, trackStopColor(POSTER.blue, gray));
    grad.addColorStop(0.28, trackStopColor("#0e8ed5", gray));
    grad.addColorStop(0.52, trackStopColor("#19a95b", gray));
    grad.addColorStop(0.76, trackStopColor("#e2a400", gray));
    grad.addColorStop(1, trackStopColor(POSTER.orange, gray));
    bgCtx.strokeStyle = grad;
    bgCtx.lineWidth = 4;
    bgCtx.lineCap = "round";
    bgCtx.beginPath();
    bgCtx.moveTo(x0, ty);
    bgCtx.lineTo(x1, ty);
    bgCtx.stroke();

    for (const deg of SNAP_ANGLES) {
      const tx = lerp(x0, x1, deg / 180);
      const major = deg === 0 || deg === 90 || deg === 180;
      bgCtx.strokeStyle = major ? "rgba(16, 16, 14, 0.52)" : "rgba(16, 16, 14, 0.26)";
      bgCtx.lineWidth = major ? 1.4 : 1;
      bgCtx.beginPath();
      bgCtx.moveTo(tx, ty - (major ? 8 : 5));
      bgCtx.lineTo(tx, ty + (major ? 8 : 5));
      bgCtx.stroke();
    }

    // 轨道刻度标注（细体等宽 Space Mono + Noto Sans SC）
    const lblOff = w <= 420 ? 29 : 30;
    bgCtx.fillStyle = POSTER.inkSoft;
    bgCtx.font = `400 10.5px "Space Mono", "Noto Sans SC", monospace`;
    bgCtx.textAlign = "left";
    bgCtx.fillText("0° 同色", x0, ty + lblOff);
    bgCtx.textAlign = "center";
    bgCtx.fillText("90° 中度", (x0 + x1) * 0.5, ty + lblOff);
    bgCtx.textAlign = "right";
    bgCtx.fillText("180° 正互补", x1, ty + lblOff);
    bgCtx.restore();

    cachedGray = gray;
  }

  function resize() {
    const r = stageEl.getBoundingClientRect();
    w = Math.max(260, Math.round(r.width));
    h = Math.max(240, Math.round(r.height));
    dpr = pixelRatio(w <= 520 ? 1.5 : 2);
    const cw = Math.round(w * dpr);
    const ch = Math.round(h * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    buildStaticLayer(!!state.gray);
    dirty = true;
  }

  function computeGeom() {
    const narrow = w <= 420;
    const topPad = narrow ? 12 : 20;
    const trackSpace = narrow ? 68 : 78;
    const availH = Math.max(150, h - topPad - trackSpace);
    const availW = Math.max(200, w - (narrow ? 16 : 24));
    const maxR = Math.min(availW * 0.35, availH * 0.39);
    const R = clamp(maxR, 62, 150);
    const orbitR = R * 1.24;
    const cx = w * 0.5;
    const cy = topPad + availH * 0.5;
    const padX = Math.max(26, Math.min(w * 0.09, 52));
    const x0 = padX;
    const x1 = w - padX;
    const ty = h - (narrow ? 39 : 44);
    const barH = Math.max(14, R * 0.155);
    const barY = cy + R * 0.65 + barH * 0.5;
    geom = { cx, cy, R, orbitR, x0, x1, ty, barY };
    return geom;
  }

  function drawScene(dNow, sLNow, sRNow, spNow, rNow, ent) {
    if (cachedGray !== !!state.gray) buildStaticLayer(!!state.gray);

    const { cx, cy, R, orbitR, x0, x1, ty, barY } = computeGeom();
    const colors = computeHeroColors({
      delta: dNow,
      satLeft: sLNow,
      satRight: sRNow,
      lumSpread: spNow,
      ratio: rNow,
      gray: state.gray,
    });

    const colA = colors.dispHexA;
    const colB = colors.dispHexB;

    // 清空画布并复用预渲染静态底图
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(bgCanvas, 0, 0, w, h);

    // 面积分界线 x 随 rNow (15..85) 移动
    const frac = clamp(rNow / 100, 0.15, 0.85);
    const splitX = cx - R + 2 * R * frac;

    // 1) 主大圆（按 splitX 左右分色）
    const rMain = R * lerp(0.93, 1, smooth(ent));
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rMain, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = colA;
    ctx.fillRect(cx - rMain - 2, cy - rMain - 2, splitX - (cx - rMain) + 3, rMain * 2 + 4);
    ctx.fillStyle = colB;
    ctx.fillRect(splitX, cy - rMain - 2, cx + rMain - splitX + 4, rMain * 2 + 4);
    ctx.restore();

    // 2) 中央反色小圆（同时对比核心：左放 B、右放 A）
    const rInner = rMain * 0.375;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
    ctx.clip();

    const innerSplit = lerp(cx, splitX, 0.42);
    ctx.fillStyle = colB;
    ctx.fillRect(cx - rInner - 2, cy - rInner - 2, innerSplit - (cx - rInner) + 3, rInner * 2 + 4);
    ctx.fillStyle = colA;
    ctx.fillRect(innerSplit, cy - rInner - 2, cx + rInner - innerSplit + 4, rInner * 2 + 4);
    ctx.restore();

    // 3) 下方贯穿反色横条（原海报核心构件）
    const barW = rMain * 1.62;
    const barH = Math.max(14, rMain * 0.155);
    const barX = cx - barW * 0.5;
    const barTop = cy + rMain * 0.65;
    const barSplit = clamp(splitX, barX + 18, barX + barW - 18);

    ctx.fillStyle = colB;
    ctx.fillRect(barX, barTop, barSplit - barX, barH);
    ctx.fillStyle = colA;
    ctx.fillRect(barSplit, barTop, barX + barW - barSplit, barH);

    // 若分割线偏离正中，画细虚线标示当前面积分界
    if (Math.abs(rNow - 50) > 1.2) {
      ctx.save();
      ctx.strokeStyle = "rgba(16, 16, 14, 0.48)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(splitX, cy - rMain - 10);
      ctx.lineTo(splitX, cy + rMain + 10);
      ctx.stroke();
      ctx.restore();
    }

    // 4) 四角环绕几何卫星（左上圆 B、右上正方 A、左下三角 A、右下菱形 B —— 精准复刻原海报）
    const swing = ((dNow - 180) / 180) * 0.20;
    const satDist = orbitR * 1.07;
    const sSize = clamp(rMain * 0.148, 10, 19);

    const aTL = -Math.PI * 0.74 + swing;
    ctx.fillStyle = colB;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(aTL) * satDist, cy + Math.sin(aTL) * satDist, sSize, 0, Math.PI * 2);
    ctx.fill();

    const aTR = -Math.PI * 0.26 - swing;
    const trX = cx + Math.cos(aTR) * satDist;
    const trY = cy + Math.sin(aTR) * satDist;
    ctx.fillStyle = colA;
    ctx.fillRect(trX - sSize * 0.9, trY - sSize * 0.9, sSize * 1.8, sSize * 1.8);

    const aBL = Math.PI * 0.74 - swing;
    const blX = cx + Math.cos(aBL) * satDist;
    const blY = cy + Math.sin(aBL) * satDist;
    ctx.fillStyle = colA;
    ctx.beginPath();
    ctx.moveTo(blX, blY - sSize * 1.06);
    ctx.lineTo(blX - sSize * 1.0, blY + sSize * 0.8);
    ctx.lineTo(blX + sSize * 1.0, blY + sSize * 0.8);
    ctx.closePath();
    ctx.fill();

    const aBR = Math.PI * 0.26 + swing;
    const brX = cx + Math.cos(aBR) * satDist;
    const brY = cy + Math.sin(aBR) * satDist;
    ctx.save();
    ctx.translate(brX, brY);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = colB;
    ctx.fillRect(-sSize * 0.8, -sSize * 0.8, sSize * 1.6, sSize * 1.6);
    ctx.restore();

    // 5) 外圈 0°..180° 上半弧与左右锚点（9 点钟 = 0° 基准，顺时针扫到 3 点钟 = 180° 正互补）
    ctx.fillStyle = colB;
    ctx.beginPath();
    ctx.arc(cx - orbitR, cy, 4.5, 0, Math.PI * 2);
    ctx.fill();

    const arcEnd = -Math.PI + (clamp(dNow, 0, 180) / 180) * Math.PI;
    ctx.save();
    ctx.strokeStyle = colB;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx, cy, orbitR, -Math.PI, arcEnd, false);
    ctx.stroke();

    const tipX = cx + Math.cos(arcEnd) * orbitR;
    const tipY = cy + Math.sin(arcEnd) * orbitR;
    ctx.fillStyle = colA;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 5.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = POSTER.paper;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    const hueX = lerp(x0, x1, clamp(dNow / 180, 0, 1));
    const inkB = bestInkOn(colors.dispRgbB);
    const inkA = bestInkOn(colors.dispRgbA);
    const key = `${hueX.toFixed(1)}|${ty.toFixed(1)}|${barSplit.toFixed(1)}|${barY.toFixed(1)}|${cx.toFixed(1)}|${cy.toFixed(1)}|${orbitR.toFixed(1)}|${colB}|${inkB}`;
    if (key !== lastLayoutKey) {
      lastLayoutKey = key;
      onLayout({
        hueX,
        ty,
        x0,
        x1,
        splitX: barSplit,
        barY,
        cx,
        cy,
        R,
        orbitR,
        colA,
        colB,
        inkA,
        inkB,
      });
    }
  }

  resize();
  new ResizeObserver(() => {
    resize();
    ctrl.draw();
  }).observe(stageEl);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      buildStaticLayer(!!state.gray);
      dirty = true;
      ctrl.draw();
    });
  }

  const ctrl = loop(stageEl, (_t, dt, { still }) => {
    if (still) {
      enter = 1;
      dispDelta = state.delta;
      dispSatL = state.satLeft;
      dispSatR = state.satRight;
      dispSpread = state.lumSpread;
      dispRatio = state.ratio;
      dirty = true;
    } else {
      const moving =
        dirty ||
        enter < 1 ||
        Math.abs(state.delta - dispDelta) > 0.04 ||
        Math.abs(state.satLeft - dispSatL) > 0.04 ||
        Math.abs(state.satRight - dispSatR) > 0.04 ||
        Math.abs(state.lumSpread - dispSpread) > 0.04 ||
        Math.abs(state.ratio - dispRatio) > 0.04;
      if (!moving) return;

      const k = dt > 0 ? 1 - Math.exp(-16 * dt) : 0.45;
      enter = Math.min(1, enter + (dt || 0.016) / 0.85);
      const kd = state.userMoved ? k : (dt > 0 ? 1 - Math.exp(-5.4 * dt) : 0.12);
      dispDelta += (state.delta - dispDelta) * kd;
      dispSatL += (state.satLeft - dispSatL) * k;
      dispSatR += (state.satRight - dispSatR) * k;
      dispSpread += (state.lumSpread - dispSpread) * k;
      dispRatio += (state.ratio - dispRatio) * k;
      if (Math.abs(state.delta - dispDelta) <= 0.04) dispDelta = state.delta;
      if (Math.abs(state.satLeft - dispSatL) <= 0.04) dispSatL = state.satLeft;
      if (Math.abs(state.satRight - dispSatR) <= 0.04) dispSatR = state.satRight;
      if (Math.abs(state.lumSpread - dispSpread) <= 0.04) dispSpread = state.lumSpread;
      if (Math.abs(state.ratio - dispRatio) <= 0.04) dispRatio = state.ratio;
    }

    dirty = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawScene(dispDelta, dispSatL, dispSatR, dispSpread, dispRatio, enter);
  });

  return {
    draw() {
      dirty = true;
      if (reducedMotion.matches) ctrl.draw();
    },
    getGeom: () => geom,
    jump() {
      enter = 1;
      dispDelta = state.delta;
      dispSatL = state.satLeft;
      dispSatR = state.satRight;
      dispSpread = state.lumSpread;
      dispRatio = state.ratio;
      dirty = true;
      ctrl.draw();
    },
  };
}

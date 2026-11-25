// 开场主角玩具：原海报「分色双圆色彩对比仪」的互动 2D 画布实现
// 遵循 lib/stage.js 节电规范（离屏/后台自动停帧、pixelRatio<=2、reducedMotion 一帧到位）

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { bestInkOn, clamp, computeHeroColors, lerp, POSTER, rgbCss, SNAP_ANGLES } from "./color.js";

const smooth = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

export function createHero(canvas, stageEl, state, onLayout) {
  const ctx = canvas.getContext("2d");
  let w = 520;
  let h = 440;
  let dpr = 1;

  // 开场缓动：先从 108° 青绿对比滑向正中央 180° 海报蓝橙互补，每一刻都饱满清晰
  let enter = reducedMotion.matches ? 1 : 0;
  let dispDelta = reducedMotion.matches ? state.delta : 108;
  let dispSat = state.sat;
  let dispRatio = state.ratio;
  let dispMono = state.mono ? 1 : 0;

  let geom = { cx: 260, cy: 195, R: 120, orbitR: 152, x0: 48, x1: 472, ty: 392 };
  let dirty = true;
  let lastLayoutKey = "";
  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");

  function buildStaticLayer() {
    const { cx, cy, orbitR, x0, x1, ty } = computeGeom();
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 温暖纸底（忠实还原 101 海报 #f7f0e5）
    bgCtx.fillStyle = POSTER.paper;
    bgCtx.fillRect(0, 0, w, h);

    // 十字虚线轴与外围同心虚线轨道圆
    bgCtx.save();
    bgCtx.strokeStyle = "rgba(16, 16, 14, 0.24)";
    bgCtx.lineWidth = 1;
    bgCtx.setLineDash([4, 4]);
    bgCtx.beginPath();
    bgCtx.moveTo(cx, cy - orbitR - 14);
    bgCtx.lineTo(cx, cy + orbitR + 14);
    bgCtx.moveTo(cx - orbitR - 22, cy);
    bgCtx.lineTo(cx + orbitR + 22, cy);
    bgCtx.stroke();

    bgCtx.beginPath();
    bgCtx.arc(cx, cy, orbitR, 0, Math.PI * 2);
    bgCtx.strokeStyle = "rgba(16, 16, 14, 0.30)";
    bgCtx.stroke();
    bgCtx.setLineDash([]);

    // 12 色轮刻度短线
    bgCtx.strokeStyle = "rgba(16, 16, 14, 0.22)";
    bgCtx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2 - Math.PI / 2;
      bgCtx.beginPath();
      bgCtx.moveTo(cx + Math.cos(ang) * (orbitR - 3), cy + Math.sin(ang) * (orbitR - 3));
      bgCtx.lineTo(cx + Math.cos(ang) * (orbitR + 4), cy + Math.sin(ang) * (orbitR + 4));
      bgCtx.stroke();
    }

    // 底部全色轮 360° 刻度轨道
    const grad = bgCtx.createLinearGradient(x0, ty, x1, ty);
    grad.addColorStop(0, POSTER.blue);
    grad.addColorStop(0.25, "#19a95b");
    grad.addColorStop(0.5, POSTER.orange);
    grad.addColorStop(0.75, "#c929a8");
    grad.addColorStop(1, POSTER.blue);
    bgCtx.strokeStyle = grad;
    bgCtx.lineWidth = 4;
    bgCtx.lineCap = "round";
    bgCtx.beginPath();
    bgCtx.moveTo(x0, ty);
    bgCtx.lineTo(x1, ty);
    bgCtx.stroke();

    for (const deg of SNAP_ANGLES) {
      const tx = lerp(x0, x1, deg / 360);
      bgCtx.strokeStyle = deg === 180 ? "rgba(16, 16, 14, 0.55)" : "rgba(16, 16, 14, 0.30)";
      bgCtx.lineWidth = deg === 180 ? 1.5 : 1;
      bgCtx.beginPath();
      bgCtx.moveTo(tx, ty - 8);
      bgCtx.lineTo(tx, ty + 8);
      bgCtx.stroke();
    }

    // 轨道小字刻度（放在手柄底缘下方留足 4px 空隙）
    bgCtx.fillStyle = POSTER.inkSoft;
    bgCtx.font = `600 10.5px "JetBrains Mono", "Noto Sans SC", sans-serif`;
    bgCtx.textAlign = "left";
    bgCtx.fillText("0° 同色", x0, ty + 38);
    bgCtx.textAlign = "center";
    bgCtx.fillText("180° 正互补", (x0 + x1) * 0.5, ty + 38);
    bgCtx.textAlign = "right";
    bgCtx.fillText("360° 同色", x1, ty + 38);
    bgCtx.restore();
  }

  function resize() {
    const r = stageEl.getBoundingClientRect();
    w = Math.max(260, Math.round(r.width));
    h = Math.max(260, Math.round(r.height));
    dpr = pixelRatio(w <= 520 ? 1.5 : 2);
    const cw = Math.round(w * dpr);
    const ch = Math.round(h * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    buildStaticLayer();
    dirty = true;
  }

  function computeGeom() {
    const topPad = 42;
    const trackSpace = 90;
    const availH = Math.max(150, h - topPad - trackSpace);
    const availW = Math.max(200, w - 36);
    const maxR = Math.min(availW * 0.34, availH * 0.385);
    const R = clamp(maxR, 62, 154);
    const orbitR = R * 1.24;
    const cx = w * 0.5;
    const cy = topPad + availH * 0.5;
    const padX = Math.max(38, Math.min(w * 0.11, 64));
    const x0 = padX;
    const x1 = w - padX;
    const ty = h - 50;
    geom = { cx, cy, R, orbitR, x0, x1, ty };
    return geom;
  }

  function drawScene(dNow, sNow, rNow, monoNow, ent) {
    const { cx, cy, R, orbitR, x0, x1, ty } = computeGeom();
    const colors = computeHeroColors({
      delta: dNow,
      sat: sNow,
      ratio: rNow,
      mono: monoNow > 0.5,
    });

    const colA = colors.hexA;
    const colB = colors.hexB;

    // 复用预渲染静态底图（纸底、十字虚线、轨道环、刻度与底部 360° 渐变轨），拖动时免重复光栅化文字
    ctx.drawImage(bgCanvas, 0, 0, w, h);

    // 分割线 x 坐标随面积比 rNow (15..85) 移动
    // rNow = 50 -> splitX = cx；rNow = 70 -> 左侧占圆宽约 64%
    const frac = clamp(rNow / 100, 0.14, 0.86);
    const splitX = cx - R + 2 * R * frac;

    // 1) 主大圆（按 splitX 左右分色，随开场轻微舒展）
    const rMain = R * lerp(0.92, 1, smooth(ent));
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rMain, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = colA;
    ctx.fillRect(cx - rMain - 2, cy - rMain - 2, splitX - (cx - rMain) + 3, rMain * 2 + 4);
    ctx.fillStyle = colB;
    ctx.fillRect(splitX, cy - rMain - 2, cx + rMain - splitX + 4, rMain * 2 + 4);
    ctx.restore();

    // 2) 中央反色小圆（同时对比核心：左侧放 B 色，右侧放 A 色！）
    const rInner = rMain * 0.375;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
    ctx.clip();

    // 为防止 splitX 偏离太远导致内圆只剩单色，内圆中缝柔和贴近 splitX，同时保证反色关系清晰
    const innerSplit = lerp(cx, splitX, 0.42);
    ctx.fillStyle = colB;
    ctx.fillRect(cx - rInner - 2, cy - rInner - 2, innerSplit - (cx - rInner) + 3, rInner * 2 + 4);
    ctx.fillStyle = colA;
    ctx.fillRect(innerSplit, cy - rInner - 2, cx + rInner - innerSplit + 4, rInner * 2 + 4);
    ctx.restore();

    // 3) 下方贯穿反色横条（精准还原 101 海报标志性构件）
    const barW = rMain * 1.62;
    const barH = Math.max(14, rMain * 0.155);
    const barX = cx - barW * 0.5;
    const barY = cy + rMain * 0.65;
    const barSplit = clamp(splitX, barX + 18, barX + barW - 18);

    ctx.fillStyle = colB;
    ctx.fillRect(barX, barY, barSplit - barX, barH);
    ctx.fillStyle = colA;
    ctx.fillRect(barSplit, barY, barX + barW - barSplit, barH);

    // 若分割线偏离正中，画一条极细的读数垂线提示当前面积分界
    if (Math.abs(rNow - 50) > 1.5) {
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

    // 4) 四角环绕几何卫星（左上圆 B、右上正方 A、左下三角 A、右下菱形 B —— 精确复刻海报四形）
    // 随色相差微微旋转张开，产生克制的光学仪式感
    const swing = ((dNow - 180) / 180) * 0.22;
    const satDist = orbitR * 1.07;
    const sSize = clamp(rMain * 0.15, 11, 20);

    // 左上：橙圆 (colB)
    const aTL = -Math.PI * 0.74 + swing;
    ctx.fillStyle = colB;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(aTL) * satDist, cy + Math.sin(aTL) * satDist, sSize, 0, Math.PI * 2);
    ctx.fill();

    // 右上：蓝方 (colA)
    const aTR = -Math.PI * 0.26 - swing;
    const trX = cx + Math.cos(aTR) * satDist;
    const trY = cy + Math.sin(aTR) * satDist;
    ctx.fillStyle = colA;
    ctx.fillRect(trX - sSize * 0.92, trY - sSize * 0.92, sSize * 1.84, sSize * 1.84);

    // 左下：蓝三角 (colA)
    const aBL = Math.PI * 0.74 - swing;
    const blX = cx + Math.cos(aBL) * satDist;
    const blY = cy + Math.sin(aBL) * satDist;
    ctx.fillStyle = colA;
    ctx.beginPath();
    ctx.moveTo(blX, blY - sSize * 1.08);
    ctx.lineTo(blX - sSize * 1.02, blY + sSize * 0.82);
    ctx.lineTo(blX + sSize * 1.02, blY + sSize * 0.82);
    ctx.closePath();
    ctx.fill();

    // 右下：橙菱形 (colB)
    const aBR = Math.PI * 0.26 + swing;
    const brX = cx + Math.cos(aBR) * satDist;
    const brY = cy + Math.sin(aBR) * satDist;
    ctx.save();
    ctx.translate(brX, brY);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = colB;
    ctx.fillRect(-sSize * 0.82, -sSize * 0.82, sSize * 1.64, sSize * 1.64);
    ctx.restore();

    // 5) 轨道圆上的两枚色相锚点（左固定锚点 = 钴蓝起点；右锚点沿全圆 0°..360° 轨道滑动，180° 恰好落在右水平轴）
    const leftDotX = cx - orbitR;
    const leftDotY = cy;
    ctx.fillStyle = colB;
    ctx.beginPath();
    ctx.arc(leftDotX, leftDotY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // 顺时针或逆时针画最短弧线，直观展示当前两色在色轮上的最小夹角
    const arcEnd = -Math.PI + (dNow / 180) * Math.PI;
    ctx.save();
    ctx.strokeStyle = colB;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (dNow <= 180) ctx.arc(cx, cy, orbitR, -Math.PI, arcEnd, false);
    else ctx.arc(cx, cy, orbitR, -Math.PI, arcEnd, true);
    ctx.stroke();

    const tipX = cx + Math.cos(arcEnd) * orbitR;
    const tipY = cy + Math.sin(arcEnd) * orbitR;
    ctx.fillStyle = colA;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = POSTER.paper;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 6) 左下微型「蓝 + 橙 = 中和暗色」色相公式角标（极简呼应海报底部公式，不占空间）
    if (w >= 360) {
      const ex = 22;
      const ey = h - 92;
      const er = 7;
      ctx.fillStyle = colA;
      ctx.beginPath();
      ctx.arc(ex + er, ey, er, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colB;
      ctx.beginPath();
      ctx.arc(ex + er * 2.15, ey, er, 0, Math.PI * 2);
      ctx.fill();
      // 交叠透镜（使用剪裁精确画出交集深色）
      ctx.save();
      ctx.beginPath();
      ctx.arc(ex + er, ey, er, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = colors.lensHex;
      ctx.beginPath();
      ctx.arc(ex + er * 2.15, ey, er, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const handleX = lerp(x0, x1, clamp(dNow / 360, 0, 1));
    const inkB = bestInkOn(colors.rgbB);
    const key = `${handleX.toFixed(1)}|${ty.toFixed(1)}|${colB}|${inkB}`;
    if (key !== lastLayoutKey) {
      lastLayoutKey = key;
      onLayout({
        x: handleX,
        y: ty,
        x0,
        x1,
        cx,
        cy,
        orbitR,
        colA,
        colB,
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
      buildStaticLayer();
      dirty = true;
      ctrl.draw();
    });
  }

  const ctrl = loop(stageEl, (_t, dt, { still }) => {
    const targetMono = state.mono ? 1 : 0;
    if (still) {
      enter = 1;
      dispDelta = state.delta;
      dispSat = state.sat;
      dispRatio = state.ratio;
      dispMono = targetMono;
      dirty = true;
    } else {
      const moving =
        dirty ||
        enter < 1 ||
        Math.abs(state.delta - dispDelta) > 0.04 ||
        Math.abs(state.sat - dispSat) > 0.04 ||
        Math.abs(state.ratio - dispRatio) > 0.04 ||
        Math.abs(targetMono - dispMono) > 0.005;
      if (!moving) return;

      const k = dt > 0 ? 1 - Math.exp(-16 * dt) : 0.45;
      enter = Math.min(1, enter + (dt || 0.016) / 0.85);
      const kd = state.userMoved ? k : (dt > 0 ? 1 - Math.exp(-5.2 * dt) : 0.12);
      dispDelta += (state.delta - dispDelta) * kd;
      dispSat += (state.sat - dispSat) * k;
      dispRatio += (state.ratio - dispRatio) * k;
      dispMono += (targetMono - dispMono) * k;
      if (Math.abs(state.delta - dispDelta) <= 0.04) dispDelta = state.delta;
      if (Math.abs(state.sat - dispSat) <= 0.04) dispSat = state.sat;
      if (Math.abs(state.ratio - dispRatio) <= 0.04) dispRatio = state.ratio;
      if (Math.abs(targetMono - dispMono) <= 0.005) dispMono = targetMono;
    }

    dirty = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawScene(dispDelta, dispSat, dispRatio, dispMono, enter);
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
      dispSat = state.sat;
      dispRatio = state.ratio;
      dispMono = state.mono ? 1 : 0;
      dirty = true;
      ctrl.draw();
    },
  };
}

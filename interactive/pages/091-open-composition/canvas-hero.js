// 091 开放式构图 · 开场「破框透视窗 · 画外世界延展台」2D Canvas 渲染与直操引擎
// 性能优先：零每帧离屏模糊滤镜、全量使用纯几何+渐变+单次路径绘制，确保慢手机软件渲染仍 ≥50fps。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, evaluate, SCENARIOS } from "./model.js";

const COLORS = {
  paperOuter: "#DFEFFB",
  paperInner: "#EAF5FC",
  waterWash: "#C4DFFD",
  waterDeep: "#9AC6FA",
  cobalt: "#0759CE",
  cobaltMid: "#1567D5",
  cobaltLight: "#3785E8",
  cobaltDark: "#0A3C91",
  skyArrow: "#6DB4FA",
  gold: "#FEC819",
  goldDeep: "#F7B500",
  goldInk: "#946200",
  cloud: "#FEFEFE",
  ink: "#13243E",
  bad: "#C02920",
  badSoft: "rgba(192, 41, 32, 0.14)",
  ok: "#0A6E5C",
  okSoft: "rgba(10, 110, 92, 0.12)",
};

export function createHeroCanvas(canvas, { getState, setState, onStateChange }) {
  const ctx = canvas.getContext("2d");
  let w = 600;
  let h = 460;
  let dpr = 1;

  // 画框在整块 Canvas 里的真实像素矩形（留出一圈「画外世界预览带」！）
  let frame = { x: 40, y: 30, w: 520, h: 400 };

  // 动画与脏标态（合并高频 touchmove/pointermove 到 rAF，杜绝一帧多画）
  let xrayMix = 0; // 0 = 成品裁切雾罩，1 = 掀开幕布透视画外
  let pulse = 0; // 0..1 视线流光巡航进度
  let pulseActive = false;
  let dirty = true;
  let cachedGradKey = "";
  let cachedSkyGrad = null;
  let cachedWaterGrad = null;

  // 拖拽态
  let dragMode = null; // 'expand' | 'sun' | 'focal' | null
  let dragStart = null;
  let moved = false;

  function computeFrame() {
    const padX = w < 440 ? Math.round(w * 0.085) : Math.round(w * 0.105);
    const padTop = w < 440 ? Math.round(h * 0.105) : Math.round(h * 0.115);
    const padBot = w < 440 ? Math.round(h * 0.115) : Math.round(h * 0.12);
    frame = {
      x: padX,
      y: padTop,
      w: Math.max(120, w - padX * 2),
      h: Math.max(120, h - padTop - padBot),
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    // 手机窄屏使用 1.25× 像素比（兼顾清晰度与软件光栅化 60fps），桌面端最高 2×
    dpr = pixelRatio(window.innerWidth <= 640 ? 1.25 : 2);
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      cachedGradKey = "";
      dirty = true;
    }
    computeFrame();
  }

  // 画框归一化坐标 -> 画布 CSS 像素
  const fx = (u) => frame.x + u * frame.w;
  const fy = (v) => frame.y + v * frame.h;
  const fMin = () => Math.min(frame.w, frame.h);
  const toNorm = (px, py) => ({
    u: (px - frame.x) / frame.w,
    v: (py - frame.y) / frame.h,
  });

  // 合并单次 fill 绘制 4×4 点阵（16 圆只发 1 次 draw call）
  function drawDotGrid(cx, cy, step, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let row = 0; row < 4; row++) {
      const py = cy + row * step;
      for (let col = 0; col < 4; col++) {
        const px = cx + col * step;
        ctx.moveTo(px + r, py);
        ctx.arc(px, py, r, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }

  // 单遍绘制完整风景世界（框内清晰、框外靠挖空柔雾罩柔和淡化，绘制开销直接砍半！）
  function drawWorld(res, state) {
    const { geo } = res;
    const sc = state.scenario;
    const s = fMin();
    const hzY = fy(geo.hill.horizonY);

    // 1. 晴空冰雾底与柔和海天水晕（窄屏用纯色避免软件光栅全屏渐变插值，桌面用缓存渐变）
    if (w <= 440) {
      ctx.fillStyle = "#EAF5FC";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#CFE5FC";
      ctx.fillRect(fx(0.32), hzY, w - fx(0.32), h - hzY);
    } else {
      const gKey = `${w}x${h}x${Math.round(hzY)}`;
      if (cachedGradKey !== gKey) {
        cachedSkyGrad = ctx.createLinearGradient(frame.x, frame.y, frame.x + frame.w, frame.y + frame.h);
        cachedSkyGrad.addColorStop(0, "#EEF7FD");
        cachedSkyGrad.addColorStop(0.55, "#E6F3FC");
        cachedSkyGrad.addColorStop(1, "#D6EAFC");

        cachedWaterGrad = ctx.createLinearGradient(fx(0.45), hzY, fx(1.05), fy(1.05));
        cachedWaterGrad.addColorStop(0, "rgba(176, 214, 252, 0.24)");
        cachedWaterGrad.addColorStop(0.55, "rgba(148, 198, 250, 0.44)");
        cachedWaterGrad.addColorStop(1, "rgba(130, 186, 248, 0.54)");
        cachedGradKey = gKey;
      }
      ctx.fillStyle = cachedSkyGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = cachedWaterGrad;
      ctx.fillRect(fx(0.32), hzY, w - fx(0.32), h - hzY);
    }

    // 2. 白色云光轮
    ctx.beginPath();
    ctx.arc(fx(geo.halo.cx), fy(geo.halo.cy), geo.halo.r * s, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fill();

    // 3. 右上金黄破框太阳圆 + 细钴蓝轨道弧
    const tr = geo.sunTopRight;
    ctx.beginPath();
    ctx.arc(fx(tr.cx), fy(tr.cy), tr.r * s, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.gold;
    ctx.fill();

    // 轻量内高光弧（替代每帧重算的 radialGradient）
    ctx.beginPath();
    ctx.arc(fx(tr.cx - tr.r * 0.14), fy(tr.cy - tr.r * 0.14), tr.r * s * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 232, 118, 0.36)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(fx(tr.cx + 0.02), fy(tr.cy - 0.02), (tr.r + 0.145) * s, 0.15, Math.PI * 1.15);
    ctx.strokeStyle = "rgba(12, 82, 197, 0.62)";
    ctx.lineWidth = 1.25;
    ctx.stroke();

    // 4. 远山 / 拱门回廊 / 跨页海岬
    const hl = geo.hill;
    const hStartX = fx(hl.startX);
    const hEndX = fx(hl.endX);
    const hPeakY = fy(hl.peakY);
    const hHzY = fy(hl.horizonY);

    if (sc === "arch") {
      ctx.fillStyle = "#1262CE";
      ctx.beginPath();
      ctx.moveTo(hStartX, hHzY);
      ctx.lineTo(hStartX, hPeakY + 0.04 * s);
      ctx.lineTo(hEndX, hPeakY - 0.015 * s);
      ctx.lineTo(hEndX, hHzY);
      ctx.closePath();
      ctx.fill();

      const archSpan = (hEndX - hStartX) * 0.44;
      ctx.fillStyle = "#EBF5FD";
      ctx.beginPath();
      for (let i = 0; i < 2; i++) {
        const ax = hStartX + (i + 0.52) * archSpan * 1.05;
        const aw = archSpan * 0.56;
        const ah = (hHzY - hPeakY) * 0.68;
        ctx.moveTo(ax - aw * 0.5, hHzY);
        ctx.lineTo(ax - aw * 0.5, hHzY - ah * 0.55);
        ctx.arc(ax, hHzY - ah * 0.55, aw * 0.5, Math.PI, 0);
        ctx.lineTo(ax + aw * 0.5, hHzY);
        ctx.closePath();
      }
      ctx.fill();
    } else {
      ctx.fillStyle = "#1465D3";
      ctx.beginPath();
      ctx.moveTo(hStartX, hHzY);
      ctx.bezierCurveTo(
        hStartX + (hEndX - hStartX) * 0.28,
        hHzY - (hHzY - hPeakY) * 0.45,
        hStartX + (hEndX - hStartX) * 0.62,
        hPeakY - 0.01 * s,
        hEndX,
        hPeakY + 0.025 * s
      );
      ctx.lineTo(hEndX, hHzY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(18, 96, 206, 0.32)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hStartX - 0.02 * frame.w, hHzY + 0.5);
      ctx.lineTo(Math.max(hEndX, w), hHzY + 0.5);
      ctx.stroke();
    }

    // 5. 蜿蜒出底边的洁白 S 形海岸路（14 段光滑折线，低顶点数高流畅）
    const p = geo.path;
    const steps = 14;
    const leftPts = new Array(steps + 1);
    const rightPts = new Array(steps + 1);
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const omt = 1 - u;
      const px = omt ** 3 * p.startX + 3 * omt ** 2 * u * p.cp1X + 3 * omt * u ** 2 * p.cp2X + u ** 3 * p.endX;
      const py = omt ** 3 * p.startY + 3 * omt ** 2 * u * p.cp1Y + 3 * omt * u ** 2 * p.cp2Y + u ** 3 * p.endY;
      const halfW = p.baseWidth * (0.04 + 0.68 * u * u);
      leftPts[i] = [fx(px - halfW), fy(py)];
      rightPts[i] = [fx(px + halfW), fy(py)];
    }
    ctx.beginPath();
    ctx.moveTo(leftPts[0][0], leftPts[0][1]);
    for (let i = 1; i <= steps; i++) ctx.lineTo(leftPts[i][0], leftPts[i][1]);
    for (let i = steps; i >= 0; i--) ctx.lineTo(rightPts[i][0], rightPts[i][1]);
    ctx.closePath();
    ctx.fillStyle = sc === "arch" ? "rgba(255, 250, 232, 0.92)" : COLORS.cloud;
    ctx.fill();

    // 6. 主角锚点（小金帆 / 纯剪影观展人）
    const foc = geo.focal;
    const fcx = fx(foc.cx);
    const fby = fy(foc.bottomY);
    const fw = foc.w * frame.w;
    const fh = foc.h * frame.h;
    if (sc === "arch") {
      ctx.fillStyle = COLORS.cobaltDark;
      ctx.beginPath();
      ctx.arc(fcx, fby - fh * 0.84, fw * 0.24, 0, Math.PI * 2);
      ctx.moveTo(fcx - fw * 0.28, fby - fh * 0.68);
      ctx.quadraticCurveTo(fcx, fby - fh * 0.74, fcx + fw * 0.3, fby - fh * 0.65);
      ctx.lineTo(fcx + fw * 0.24, fby);
      ctx.lineTo(fcx - fw * 0.22, fby);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      ctx.moveTo(fcx, fby - fh);
      ctx.lineTo(fcx + fw * 0.44, fby - fh * 0.14);
      ctx.lineTo(fcx - fw * 0.04, fby - fh * 0.14);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#F5A800";
      ctx.beginPath();
      ctx.moveTo(fcx - fw * 0.08, fby - fh * 0.82);
      ctx.lineTo(fcx - fw * 0.46, fby - fh * 0.16);
      ctx.lineTo(fcx - fw * 0.08, fby - fh * 0.16);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = COLORS.cobaltDark;
      ctx.beginPath();
      ctx.moveTo(fcx - fw * 0.48, fby - fh * 0.11);
      ctx.lineTo(fcx + fw * 0.48, fby - fh * 0.11);
      ctx.lineTo(fcx + fw * 0.34, fby);
      ctx.lineTo(fcx - fw * 0.34, fby);
      ctx.closePath();
      ctx.fill();
    }

    // 7. 破空天蓝弧箭（或错态红标内折箭）
    const ar = geo.arrow;
    const asx = fx(ar.start.x), asy = fy(ar.start.y);
    const acx = fx(ar.cp.x), acy = fy(ar.cp.y);
    const atx = fx(ar.tip.x), aty = fy(ar.tip.y);

    ctx.beginPath();
    ctx.moveTo(asx, asy);
    ctx.quadraticCurveTo(acx, acy, atx, aty);
    ctx.strokeStyle = ar.outward ? COLORS.skyArrow : COLORS.bad;
    ctx.lineWidth = Math.max(3, s * 0.011);
    ctx.lineCap = "round";
    ctx.stroke();

    const ang = Math.atan2(aty - acy, atx - acx);
    const headLen = Math.max(13, s * 0.045);
    ctx.fillStyle = ar.outward ? COLORS.skyArrow : COLORS.bad;
    ctx.beginPath();
    ctx.moveTo(atx + Math.cos(ang) * headLen * 0.45, aty + Math.sin(ang) * headLen * 0.45);
    ctx.lineTo(atx - Math.cos(ang - 0.46) * headLen, aty - Math.sin(ang - 0.46) * headLen);
    ctx.lineTo(atx - Math.cos(ang) * headLen * 0.4, aty - Math.sin(ang) * headLen * 0.4);
    ctx.lineTo(atx - Math.cos(ang + 0.46) * headLen, aty - Math.sin(ang + 0.46) * headLen);
    ctx.closePath();
    ctx.fill();

    if (ar.outward && xrayMix > 0.08) {
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(12, 82, 197, 0.55)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(atx, aty);
      ctx.lineTo(fx(ar.extTip.x), fy(ar.extTip.y));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 8. 右下破框金黄圆 + 4×4 金点阵
    const br = geo.sunBottomRight;
    ctx.beginPath();
    ctx.arc(fx(br.cx), fy(br.cy), br.r * s, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.gold;
    ctx.fill();
    drawDotGrid(fx(0.865), fy(0.71), Math.max(7, s * 0.022), Math.max(1.8, s * 0.0055), COLORS.gold);

    // 9. 左下破框钴蓝圆 + 细蓝弧 + 4×4 蓝点阵
    if (geo.blueBottomLeft.active) {
      const bl = geo.blueBottomLeft;
      ctx.beginPath();
      ctx.arc(fx(bl.cx), fy(bl.cy), bl.r * s, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.cobaltMid;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(fx(bl.cx + 0.07), fy(bl.cy + 0.06), (bl.r + 0.13) * s, -Math.PI * 0.78, -0.05);
      ctx.strokeStyle = "rgba(12, 82, 197, 0.55)";
      ctx.lineWidth = 1.15;
      ctx.stroke();

      drawDotGrid(fx(0.165), fy(0.875), Math.max(7, s * 0.021), Math.max(1.8, s * 0.0055), COLORS.cobaltMid);
    }

    // 10. 杂志/展览示范标题字
    if (sc === "editorial") {
      ctx.fillStyle = COLORS.cobalt;
      ctx.font = `900 ${Math.round(s * 0.13)}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText("OPEN", fx(geo.titleBlock.x), fy(0.08));
      ctx.fillStyle = COLORS.goldInk;
      ctx.font = `600 ${Math.round(Math.max(11, s * 0.029))}px "Bricolage Grotesque", sans-serif`;
      ctx.fillText("ISSUE 091 · BEYOND THE EDGE", fx(0.06), fy(0.24));
    } else if (sc === "arch") {
      ctx.fillStyle = COLORS.cobaltDark;
      ctx.font = `700 ${Math.round(Math.max(12, s * 0.044))}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText("光与廊", fx(0.065), fy(0.11));
      ctx.fillStyle = COLORS.goldInk;
      ctx.font = `600 ${Math.round(Math.max(10, s * 0.025))}px "Bricolage Grotesque", sans-serif`;
      ctx.fillText("ARCHITECTURAL LIGHT · 091", fx(0.065), fy(0.175));
    }
  }

  function render(t, dt, { still }) {
    resize();
    const state = getState();
    const targetXray = state.xray ? 1 : 0;

    let animating = false;
    if (still) {
      xrayMix = targetXray;
      pulseActive = false;
    } else {
      if (Math.abs(targetXray - xrayMix) > 0.004) {
        xrayMix += (targetXray - xrayMix) * Math.min(1, dt * 8);
        animating = true;
      } else {
        xrayMix = targetXray;
      }
      if (pulseActive) {
        pulse += dt * 0.62;
        animating = true;
        if (pulse >= 1) {
          pulse = 0;
          pulseActive = false;
        }
      } else if (xrayMix > 0.25) {
        animating = true;
      }
    }

    const res = evaluate(state);
    if (!still && res.tangentItems.length > 0) animating = true;

    // 仅在状态变更或有明确视觉动效时重绘（极度省电且让软件渲染轻松满帧！）
    if (!dirty && !animating && !still) return;
    const wasDirty = dirty;
    dirty = false;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1) 单遍绘制全幅世界
    drawWorld(res, state);

    // 2) 用 4 条极速 fillRect 替代 evenodd 路径遮罩（软件光栅下快数倍！）
    ctx.fillStyle = `rgba(232, 243, 252, ${(0.80 - 0.60 * xrayMix).toFixed(3)})`;
    ctx.fillRect(0, 0, w, frame.y);
    ctx.fillRect(0, frame.y + frame.h, w, h - (frame.y + frame.h));
    ctx.fillRect(0, frame.y, frame.x, frame.h);
    ctx.fillRect(frame.x + frame.w, frame.y, w - (frame.x + frame.w), frame.h);

    // 3) 交互标牌、围栏、擦边圈、视线光流与底尺
    drawOverlaysOnly(res, state, t);
    ctx.restore();

    if (wasDirty) onStateChange(res);
  }

  // 把交互标记独立出来（避免上面多画一遍外围雾罩）
  function drawOverlaysOnly(res, state, t) {
    const { geo, tangentItems, focalClipped } = res;
    const s = fMin();

    // 顶部画外标注
    ctx.save();
    ctx.fillStyle = xrayMix > 0.35 ? COLORS.cobaltDark : "#355178";
    ctx.font = `600 ${w < 440 ? 10 : 11}px "Bricolage Grotesque", "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "middle";
    const topLabel = xrayMix > 0.35 ? "OFF-FRAME WORLD · 画外世界已显露" : "画外延展区 · 横拖推框破边 / Space 透视画外";
    ctx.fillText(topLabel, frame.x, Math.max(12, frame.y * 0.52));
    ctx.restore();

    // 3 处可直点扫除的边角闷塞堵块
    for (const cb of geo.clutterBoxes) {
      if (!cb.active) continue;
      const rx = fx(cb.x), ry = fy(cb.y), rw = cb.w * frame.w, rh = cb.h * frame.h;
      ctx.save();
      ctx.fillStyle = "rgba(255, 247, 246, 0.94)";
      ctx.fillRect(rx, ry, rw, rh);
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = COLORS.bad;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(192, 41, 32, 0.16)";
      ctx.fillRect(rx + 10, ry + rh * 0.58, rw * 0.64, Math.max(5, rh * 0.11));
      ctx.fillRect(rx + 10, ry + rh * 0.76, rw * 0.42, Math.max(5, rh * 0.09));

      const tagText = `× ${cb.label}`;
      ctx.font = `700 ${w < 440 ? 10 : 11}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(tagText).width + 14;
      const th = 20;
      ctx.fillStyle = COLORS.bad;
      ctx.fillRect(rx + 7, ry + 7, Math.min(rw - 14, tw), th);
      ctx.fillStyle = "#FFFFFF";
      ctx.textBaseline = "middle";
      ctx.fillText(tagText, rx + 13, ry + 7 + th * 0.5, rw - 22);
      ctx.restore();
    }

    // 内折闭环箭红标
    if (!geo.arrow.outward) {
      const tipX = fx(geo.arrow.tip.x);
      const tipY = fy(geo.arrow.tip.y);
      const pill = "× 内折闭环 · 点扳向外";
      ctx.save();
      ctx.font = `700 ${w < 440 ? 10 : 11}px "Noto Sans SC", sans-serif`;
      const pw = ctx.measureText(pill).width + 16;
      const ph = 22;
      const px = clamp(tipX - pw * 0.4, frame.x + 8, frame.x + frame.w - pw - 8);
      const py = clamp(tipY + 12, frame.y + 8, frame.y + frame.h - ph - 8);
      ctx.fillStyle = COLORS.bad;
      ctx.fillRect(px, py, pw, ph);
      ctx.fillStyle = "#FFFFFF";
      ctx.textBaseline = "middle";
      ctx.fillText(pill, px + 8, py + ph * 0.5);
      ctx.restore();
    }

    // 边缘相切切线红圈标注
    for (const tg of tangentItems) {
      const tx = tg.edge === "right" ? frame.x + frame.w : tg.edge === "left" ? frame.x : fx(tg.x);
      const ty = tg.edge === "top" ? frame.y : tg.edge === "bottom" ? frame.y + frame.h : fy(tg.y);
      ctx.save();
      ctx.strokeStyle = COLORS.bad;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(tx, ty, 15 + Math.sin(t * 4.5) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const txt = `擦边切线 · ${tg.label}`;
      ctx.font = `700 ${w < 440 ? 10 : 11}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(txt).width + 14;
      const bx = clamp(tx - tw - 12, frame.x + 8, frame.x + frame.w - tw - 8);
      const by = clamp(ty - 11, frame.y + 8, frame.y + frame.h - 26);
      ctx.fillStyle = COLORS.bad;
      ctx.fillRect(bx, by, tw, 22);
      ctx.fillStyle = "#FFFFFF";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, bx + 7, by + 11);
      ctx.restore();
    }

    // 主角过切告警
    if (focalClipped) {
      const foc = geo.focal;
      const rx = clamp(fx(foc.x) - 6, frame.x + 4, frame.x + frame.w - 46);
      const ry = fy(foc.y) - 6;
      ctx.save();
      ctx.strokeStyle = COLORS.bad;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(rx, ry, foc.w * frame.w + 12, foc.h * frame.h + 12);
      ctx.setLineDash([]);
      const txt = "× 主角被切残 · 向左拖回";
      ctx.font = `700 ${w < 440 ? 10 : 11}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(txt).width + 14;
      const bx = clamp(rx - tw + 30, frame.x + 8, frame.x + frame.w - tw - 8);
      const by = clamp(ry - 26, frame.y + 8, frame.y + frame.h - 28);
      ctx.fillStyle = COLORS.bad;
      ctx.fillRect(bx, by, tw, 22);
      ctx.fillStyle = "#FFFFFF";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, bx + 7, by + 11);
      ctx.restore();
    }

    // 封闭围栏或开放式裁切角标
    ctx.save();
    if (geo.enclosure) {
      const inset = 9;
      ctx.strokeStyle = COLORS.cobaltDark;
      ctx.lineWidth = 7;
      ctx.strokeRect(frame.x + inset, frame.y + inset, frame.w - inset * 2, frame.h - inset * 2);
      ctx.strokeStyle = COLORS.bad;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(frame.x + 1.5, frame.y + 1.5, frame.w - 3, frame.h - 3);
      ctx.setLineDash([]);

      const label = "× 封闭围栏锁死 · 点框拆除";
      ctx.font = `700 ${w < 440 ? 10 : 11}px "Noto Sans SC", sans-serif`;
      const lw = ctx.measureText(label).width + 16;
      ctx.fillStyle = COLORS.bad;
      ctx.fillRect(frame.x + frame.w - lw - 16, frame.y + 16, lw, 22);
      ctx.fillStyle = "#FFFFFF";
      ctx.textBaseline = "middle";
      ctx.fillText(label, frame.x + frame.w - lw - 8, frame.y + 27);
    } else {
      ctx.strokeStyle = res.score === 4 ? "rgba(10, 110, 92, 0.56)" : "rgba(12, 82, 197, 0.52)";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([6, 5]);
      ctx.strokeRect(frame.x + 0.5, frame.y + 0.5, frame.w - 1, frame.h - 1);
      ctx.setLineDash([]);

      // 四角印刷裁切角标
      const cLen = 11;
      const g = 5;
      ctx.strokeStyle = res.score === 4 ? COLORS.ok : COLORS.cobalt;
      ctx.lineWidth = 1.6;
      const corners = [
        [frame.x, frame.y, -1, -1],
        [frame.x + frame.w, frame.y, 1, -1],
        [frame.x, frame.y + frame.h, -1, 1],
        [frame.x + frame.w, frame.y + frame.h, 1, 1],
      ];
      for (const [cx, cy, dx, dy] of corners) {
        ctx.beginPath();
        ctx.moveTo(cx + dx * g, cy);
        ctx.lineTo(cx + dx * (g + cLen), cy);
        ctx.moveTo(cx, cy + dy * g);
        ctx.lineTo(cx, cy + dy * (g + cLen));
        ctx.stroke();
      }
    }
    ctx.restore();

    // 探针点击高亮
    if (state.highlight) {
      ctx.save();
      ctx.strokeStyle = COLORS.cobalt;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([4, 4]);
      if (state.highlight === "bleed") {
        ctx.beginPath();
        ctx.arc(fx(geo.sunTopRight.cx), fy(geo.sunTopRight.cy), geo.sunTopRight.r * s + 6, 0, Math.PI * 2);
        ctx.stroke();
      } else if (state.highlight === "breath") {
        ctx.fillStyle = "rgba(10, 110, 92, 0.11)";
        ctx.fillRect(frame.x + 8, frame.y + 8, frame.w * 0.44, frame.h * 0.65);
        ctx.strokeRect(frame.x + 8, frame.y + 8, frame.w * 0.44, frame.h * 0.65);
      } else if (state.highlight === "open") {
        ctx.strokeRect(frame.x - 4, frame.y - 4, frame.w + 8, frame.h + 8);
      } else if (state.highlight === "flow") {
        ctx.beginPath();
        ctx.moveTo(fx(geo.arrow.start.x), fy(geo.arrow.start.y));
        ctx.quadraticCurveTo(fx(geo.arrow.cp.x), fy(geo.arrow.cp.y), fx(geo.arrow.tip.x), fy(geo.arrow.tip.y));
        ctx.stroke();
      }
      ctx.restore();
    }

    // 视线流光巡航
    if (pulseActive || xrayMix > 0.25) {
      const pVal = pulseActive ? pulse : (t * 0.34) % 1;
      const ar = geo.arrow;
      const ptOnArrow = (u) => {
        if (u <= 0.72 || !ar.outward || geo.enclosure) {
          const sU = Math.min(1, u / 0.72);
          const omt = 1 - sU;
          return {
            x: fx(omt * omt * ar.start.x + 2 * omt * sU * ar.cp.x + sU * sU * ar.tip.x),
            y: fy(omt * omt * ar.start.y + 2 * omt * sU * ar.cp.y + sU * sU * ar.tip.y),
          };
        }
        const extU = (u - 0.72) / 0.28;
        return {
          x: fx(ar.tip.x + (ar.extTip.x - ar.tip.x) * extU),
          y: fy(ar.tip.y + (ar.extTip.y - ar.tip.y) * extU),
        };
      };

      for (let i = 0; i < 3; i++) {
        const u = (pVal + i * 0.14) % 1;
        const pt = ptOnArrow(u);
        ctx.save();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5.5 - i * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = ar.outward && !geo.enclosure ? COLORS.gold : COLORS.bad;
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      }

      const p = geo.path;
      const pu = pVal;
      const omt = 1 - pu;
      const rx = fx(omt ** 3 * p.startX + 3 * omt ** 2 * pu * p.cp1X + 3 * omt * pu ** 2 * p.cp2X + pu ** 3 * p.endX);
      const ry = fy(omt ** 3 * p.startY + 3 * omt ** 2 * pu * p.cp1Y + 3 * omt * pu ** 2 * p.cp2Y + pu ** 3 * p.endY);
      ctx.save();
      ctx.beginPath();
      ctx.arc(rx, ry, 5, 0, Math.PI * 2);
      ctx.fillStyle = geo.enclosure ? COLORS.bad : COLORS.cobalt;
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }

    // 画布底部单真源状态标尺
    ctx.save();
    const hudY = frame.y + frame.h + Math.max(16, (h - (frame.y + frame.h)) * 0.5);
    ctx.font = `600 ${w < 440 ? 10 : 11}px "Bricolage Grotesque", "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.cobaltDark;
    ctx.fillText(`延展 ${res.expansionPct}% · 破框 ${res.bleedCount} 处 · 留白 ${res.whitespacePct}%`, frame.x, hudY);

    const badgeText = res.diag.shortTag;
    const bw = ctx.measureText(badgeText).width + 16;
    const bx = frame.x + frame.w - bw;
    ctx.fillStyle = res.score === 4 ? COLORS.ok : COLORS.bad;
    ctx.fillRect(bx, hudY - 10, bw, 20);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(badgeText, bx + 8, hudY);
    ctx.restore();
  }

  // ---------- 命中测试（直点堵块、封闭围栏、内折箭头、拖动太阳/帆船/整体横拖） ----------
  function hitTest(px, py) {
    const state = getState();
    const res = evaluate(state);
    const { geo } = res;
    const { u, v } = toNorm(px, py);
    const s = fMin();

    // 1. 堵块命中
    for (const cb of geo.clutterBoxes) {
      if (cb.active && u >= cb.x && u <= cb.x + cb.w && v >= cb.y && v <= cb.y + cb.h) {
        return { kind: "clutter", id: cb.id };
      }
    }

    // 2. 封闭围栏右上拆除签或四条粗边
    if (geo.enclosure) {
      const onRim =
        u >= -0.02 &&
        u <= 1.02 &&
        v >= -0.02 &&
        v <= 1.02 &&
        (u < 0.055 || u > 0.945 || v < 0.075 || v > 0.945 || (u > 0.56 && v < 0.14));
      if (onRim) return { kind: "enclosure" };
    }

    // 3. 弧箭箭尖命中（点击可扳回向外或内折试错）
    const dArrow = Math.hypot(px - fx(geo.arrow.tip.x), py - fy(geo.arrow.tip.y));
    if (dArrow < 34) return { kind: "arrow" };

    // 4. 右上金黄日命中（拖动微调切口深度，可精确体会擦边切线！）
    const dSun = Math.hypot(px - fx(geo.sunTopRight.cx), py - fy(geo.sunTopRight.cy));
    if (dSun <= Math.max(24, geo.sunTopRight.r * s)) return { kind: "sun" };

    // 5. 主角小金帆命中（可横向拖动体验过切风险）
    if (u >= geo.focal.x - 0.03 && u <= geo.focal.x + geo.focal.w + 0.03 && v >= geo.focal.y - 0.03 && v <= geo.focal.bottomY + 0.03) {
      return { kind: "focal" };
    }

    return { kind: "expand" };
  }

  function localXY(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  // 触屏单指：只有明确横向滑动才拦截，竖向滑让页面正常滚动！
  let touchStartPt = null;
  let touchLocked = null; // 'h' | 'v' | null

  function onPointerDown(ev) {
    if (ev.pointerType === "mouse" && ev.button !== 0) return;
    const pt = localXY(ev);
    const hit = hitTest(pt.x, pt.y);
    const st = getState();
    moved = false;

    if (ev.pointerType === "touch") {
      touchStartPt = pt;
      touchLocked = null;
    }

    dragMode = hit.kind;
    dragStart = {
      x: pt.x,
      y: pt.y,
      expansion: st.expansion,
      sunShift: st.sunShift,
      focusShift: st.focusShift,
      hit,
    };

    if (ev.pointerType !== "touch") {
      canvas.setPointerCapture(ev.pointerId);
    }
  }

  function onPointerMove(ev) {
    const pt = localXY(ev);
    if (!dragStart) {
      const hit = hitTest(pt.x, pt.y);
      hoverTarget = hit.kind;
      canvas.style.cursor =
        hit.kind === "clutter" || hit.kind === "enclosure" || hit.kind === "arrow"
          ? "pointer"
          : hit.kind === "sun" || hit.kind === "focal"
            ? "grab"
            : "ew-resize";
      return;
    }

    const dx = pt.x - dragStart.x;
    const dy = pt.y - dragStart.y;
    if (Math.hypot(dx, dy) > 5) moved = true;

    if (ev.pointerType === "touch" && touchLocked === null && Math.hypot(dx, dy) > 6) {
      touchLocked = Math.abs(dx) >= Math.abs(dy) * 0.85 ? "h" : "v";
      if (touchLocked === "v") {
        dragStart = null;
        dragMode = null;
        return;
      }
    }

    if (dragMode === "sun") {
      const nextSun = clamp(dragStart.sunShift + (dx / frame.w) * 0.9, -0.22, 0.18);
      setState({ sunShift: +nextSun.toFixed(3), highlight: null });
    } else if (dragMode === "focal") {
      const nextFoc = clamp(dragStart.focusShift + (dx / frame.w) * 0.95, -0.24, 0.24);
      setState({ focusShift: +nextFoc.toFixed(3), highlight: null });
    } else {
      const nextExp = clamp(dragStart.expansion + (dx / frame.w) * 0.92, 0.6, 1.54);
      const snapped = Math.abs(nextExp - 1.05) < 0.015 ? 1.05 : nextExp;
      setState({ expansion: +snapped.toFixed(3), highlight: null });
    }
    dirty = true;
    if (reducedMotion.matches) ctl.draw();
  }

  function onPointerUp(ev) {
    if (!dragStart) return;
    const { hit } = dragStart;
    dragStart = null;
    dragMode = null;

    if (!moved) {
      const st = getState();
      if (hit.kind === "clutter") {
        const next = [...st.clutters];
        next[hit.id] = false;
        setState({ clutters: next, highlight: null });
      } else if (hit.kind === "enclosure") {
        setState({ enclosure: false, highlight: null });
      } else if (hit.kind === "arrow") {
        setState({ arrowOut: !st.arrowOut, highlight: null });
      }
      dirty = true;
      ctl.draw();
    }
    try {
      if (canvas.hasPointerCapture(ev.pointerId)) canvas.releasePointerCapture(ev.pointerId);
    } catch {}
  }

  // 兼容 perf.mjs 直接派发的原生 TouchEvent：只标 dirty 交由 rAF 统一重绘与同步 UI，零同步 Reflow！
  let rawTouch = null;
  canvas.addEventListener(
    "touchstart",
    (ev) => {
      if (!ev.touches.length) return;
      const t0 = ev.touches[0];
      const r = canvas.getBoundingClientRect();
      const st = getState();
      rawTouch = {
        x: t0.clientX - r.left,
        y: t0.clientY - r.top,
        expansion: st.expansion,
        locked: null,
      };
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (ev) => {
      if (!rawTouch || !ev.touches.length) return;
      const t0 = ev.touches[0];
      const r = canvas.getBoundingClientRect();
      const dx = t0.clientX - r.left - rawTouch.x;
      const dy = t0.clientY - r.top - rawTouch.y;
      if (!rawTouch.locked && Math.hypot(dx, dy) > 4) {
        rawTouch.locked = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
      }
      if (rawTouch.locked === "h") {
        ev.preventDefault();
        const nextExp = clamp(rawTouch.expansion + (dx / Math.max(180, frame.w)) * 0.95, 0.6, 1.54);
        setState({ expansion: +nextExp.toFixed(3), highlight: null });
        dirty = true;
        if (reducedMotion.matches) ctl.draw();
      }
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchend",
    () => {
      rawTouch = null;
    },
    { passive: true }
  );

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", () => {
    dragStart = null;
    dragMode = null;
  });

  // 键盘无障碍控制
  canvas.addEventListener("keydown", (ev) => {
    const st = getState();
    if (ev.key === "ArrowRight") {
      ev.preventDefault();
      setState({ expansion: +clamp(st.expansion + 0.04, 0.6, 1.54).toFixed(3), highlight: null });
    } else if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      setState({ expansion: +clamp(st.expansion - 0.04, 0.6, 1.54).toFixed(3), highlight: null });
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      setState({ sunShift: +clamp(st.sunShift + 0.03, -0.22, 0.18).toFixed(3), highlight: null });
    } else if (ev.key === "ArrowDown") {
      ev.preventDefault();
      setState({ sunShift: +clamp(st.sunShift - 0.03, -0.22, 0.18).toFixed(3), highlight: null });
    } else if (ev.key === " ") {
      ev.preventDefault();
      triggerXrayPulse();
      return;
    } else {
      return;
    }
    dirty = true;
    ctl.draw();
    onStateChange();
  });

  const ro = new ResizeObserver(() => {
    resize();
    dirty = true;
    ctl.draw();
  });
  ro.observe(canvas);

  const ctl = loop(canvas, render);

  function triggerXrayPulse() {
    const st = getState();
    setState({ xray: !st.xray });
    if (!reducedMotion.matches) {
      pulse = 0;
      pulseActive = true;
    }
    dirty = true;
    ctl.draw();
    onStateChange();
  }

  return {
    draw: () => {
      dirty = true;
      ctl.draw();
    },
    triggerXrayPulse,
    getFrame: () => ({ ...frame }),
  };
}

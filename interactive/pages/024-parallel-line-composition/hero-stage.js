// 024 平行线构图 — 开场活体平行线谱与静景调律舞台（纯 2D Canvas，零 WebGL 依赖，软件渲染满帧）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { THRESHOLDS, clamp, computeModel } from "./model.js";

// 严格实采自 024 原海报的深夜蓝黑 + 酸绿 + 混凝土灰配色
const C = {
  bg: "#060E17",
  bgDeep: "#040A11",
  lime: "#B4CC3B",
  limeBright: "#C9DF4E",
  limeDim: "#5A6B20",
  limeGlow: "rgba(180, 204, 59, 0.22)",
  waterLine: "#475968",
  concrete: "#C6C9CB",
  concreteShade: "#9AA0A5",
  reflect: "#283139",
  door: "#060E17",
  white: "#EEF2F0",
  warn: "#E05E3E",
  warnSoft: "rgba(224, 94, 62, 0.22)",
  grid: "rgba(180, 204, 59, 0.08)",
};

export function initHeroStage(canvas, getState, onStateChange) {
  const ctx = canvas.getContext("2d");
  let cssW = 800;
  let cssH = 340;
  let dpr = 1;

  // 动画插值状态：首屏入场线束从左向右平稳绘出，交互时流畅过渡，静止后不浪费 GPU/CPU
  let intro = reducedMotion.matches ? 1 : 0;
  let dirty = true;
  let hoverPart = null; // "anchor" | "align" | "spacing" | null
  let dragMode = null;  // "anchor" | "align" | "spacing" | null
  let dragStart = null;

  // 平滑显示值（用于视觉丝滑，评判与读数始终以真实 state 为准）
  const anim = {
    divergence: getState().divergence,
    spacingGrad: getState().spacingGrad,
    anchorU: getState().anchorU,
    anchorAlpha: getState().anchorOn ? 1 : 0,
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(260, Math.round(rect.width));
    cssH = Math.max(200, Math.round(rect.height));
    dpr = pixelRatio(2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      dirty = true;
    }
  }

  // 把画布局部锚点坐标算出来（供渲染和点击命中共用）
  function getAnchorPixel(model, w, h) {
    const orient = model.state.orient;
    const u = anim.anchorU;
    if (orient === "horizontal") {
      const seamY = model.seam * h;
      const bw = clamp(w * 0.21, 92, 230);
      const bh = clamp(h * 0.16, 38, 62);
      if (model.state.scene === "pavilion") {
        return { x: u * w, y: seamY - bh * 0.5, r: Math.max(bw * 0.52, 46), bw, bh, seamY };
      }
      if (model.state.scene === "sail") {
        const sh = clamp(h * 0.24, 48, 86);
        return { x: u * w, y: seamY - sh * 0.45, r: Math.max(sh * 0.65, 40), bw: sh * 0.72, bh: sh, seamY };
      }
      // corridor
      const ch = clamp(h * 0.22, 48, 76);
      return { x: u * w, y: seamY - ch * 0.45, r: 42, bw: 44, bh: ch, seamY };
    }
    if (orient === "vertical") {
      // 竖向时锚点沿水平位置 u 分布在垂直柱列之间
      return { x: u * w, y: h * 0.56, r: 48, bw: clamp(w * 0.14, 72, 130), bh: clamp(h * 0.34, 96, 156), seamY: h * 0.66 };
    }
    // diagonal 28°
    const rad = (28 * Math.PI) / 180;
    const dx = (u - 0.5) * w * 0.76;
    return {
      x: w * 0.5 + dx * Math.cos(rad),
      y: h * 0.52 + dx * Math.sin(rad),
      r: 46,
      bw: clamp(w * 0.16, 78, 148),
      bh: clamp(h * 0.18, 44, 68),
      seamY: h * 0.60,
    };
  }

  // 右侧齐平校准标把位置
  function getAlignHandlePixel(model, w, h) {
    const x = w - clamp(w * 0.055, 22, 42);
    const spreadNorm = clamp(anim.divergence / 18, -1, 1);
    const y = h * 0.5 + spreadNorm * (h * 0.31);
    return { x, y, r: 22 };
  }

  function drawTopographicRidge(w, h, passRatio) {
    // 呼应原海报右上角：酸绿圆月 + 平行等高线山脊
    const moonR = clamp(Math.min(w, h) * 0.082, 16, 34);
    const moonX = w - clamp(w * 0.12, 48, 148);
    const moonY = clamp(h * 0.16, 30, 56);

    // 淡柔平行山脊弧线（严格同向平行，纯装饰背景低对比不抢主体）
    ctx.save();
    ctx.strokeStyle = "rgba(180, 204, 59, 0.16)";
    ctx.lineWidth = 1;
    const ridgeBaseY = h * 0.42;
    for (let k = 0; k < 5; k++) {
      const dy = k * 7;
      ctx.beginPath();
      ctx.moveTo(w * 0.56, ridgeBaseY + dy);
      ctx.quadraticCurveTo(w * 0.74, ridgeBaseY - h * 0.22 + dy, w * 0.84, ridgeBaseY - h * 0.13 + dy);
      ctx.lineTo(w + 10, ridgeBaseY + h * 0.04 + dy);
      ctx.stroke();
    }

    // 酸绿圆月（保持正圆：同一半径 moonR，永不拉伸变形）
    ctx.fillStyle = passRatio >= 1 ? C.limeBright : C.lime;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSceneBackdrop(model, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#050C14");
    grad.addColorStop(0.62, "#07111C");
    grad.addColorStop(1, "#040A11");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    if (model.state.scene === "pavilion" && model.state.orient === "horizontal") {
      drawTopographicRidge(w, h, model.metrics.passCount / 4);
    } else if (model.state.scene === "sail" && model.state.orient === "horizontal") {
      // 原海报示例一：上空淡灰冷天 + 极简双云 + 暗蓝平行海面
      ctx.save();
      const skyH = model.seam * h;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, skyH);
      skyGrad.addColorStop(0, "#101B26");
      skyGrad.addColorStop(1, "#182633");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, skyH);
      // 极简扁平云影
      ctx.fillStyle = "rgba(214, 222, 228, 0.14)";
      const drawCloud = (cx, cy, cw, ch) => {
        ctx.beginPath();
        ctx.moveTo(cx - cw * 0.5, cy);
        ctx.lineTo(cx - cw * 0.12, cy - ch);
        ctx.lineTo(cx + cw * 0.2, cy - ch * 0.65);
        ctx.lineTo(cx + cw * 0.5, cy);
        ctx.closePath();
        ctx.fill();
      };
      drawCloud(w * 0.24, skyH * 0.54, w * 0.12, 12);
      drawCloud(w * 0.78, skyH * 0.44, w * 0.14, 14);
      ctx.restore();
    } else if (model.state.scene === "corridor") {
      // 原海报示例三：右侧明亮酸绿光门框，将平行墙线引导至此
      ctx.save();
      const portalW = clamp(w * 0.085, 34, 72);
      const portalH = clamp(h * 0.36, 92, 152);
      const px = w - portalW - clamp(w * 0.09, 34, 74);
      const py = model.seam * h - portalH;
      // 柔和门口溢光
      const glow = ctx.createRadialGradient(px + portalW * 0.5, py + portalH * 0.5, 4, px + portalW * 0.5, py + portalH * 0.5, portalH * 1.1);
      glow.addColorStop(0, "rgba(180, 204, 59, 0.24)");
      glow.addColorStop(1, "rgba(180, 204, 59, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(px - portalH, py - portalH * 0.4, portalH * 2.2, portalH * 1.8);

      ctx.fillStyle = "#97B230";
      ctx.fillRect(px, py, portalW, portalH);
      ctx.strokeStyle = C.limeBright;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 0.5, py + 0.5, portalW - 1, portalH - 1);
      ctx.restore();
    }
  }

  function drawParallelLines(model, w, h, progress) {
    const { lines, pillars, state } = model;
    const warnSpread = !pillars.order.ok;
    const warnDense = state.lineCount > THRESHOLDS.maxLines;

    ctx.save();
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      // 入场错峰展开（每一刻都整齐有秩序）
      const delay = (i / Math.max(1, lines.length)) * 0.35;
      const p = clamp((progress - delay) / 0.65, 0, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      if (ease <= 0.001) continue;

      const x1 = l.u1 * w;
      const y1 = l.v1 * h;
      const x2 = x1 + (l.u2 * w - x1) * ease;
      const y2 = y1 + (l.v2 * h - y1) * ease;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      if (l.isHorizon) {
        ctx.strokeStyle = warnSpread ? C.warn : C.limeBright;
        ctx.lineWidth = l.weight;
        ctx.globalAlpha = 0.96;
      } else if (l.zone === "main") {
        if (warnSpread) {
          ctx.strokeStyle = i % 3 === 0 ? "#E07A5F" : "#7F8E3B";
        } else if (warnDense && !pillars.spacing.ok) {
          // 过密等距时故意呈现刺眼高反差，直觉感知 Wilkins 栅格压迫感
          ctx.strokeStyle = i % 2 === 0 ? "#C8DE52" : "#9BA8A0";
        } else if (state.scene === "corridor") {
          ctx.strokeStyle = l.isAccent ? C.limeBright : "#A7A578";
        } else {
          ctx.strokeStyle = l.isAccent ? C.limeBright : "#809434";
        }
        ctx.lineWidth = warnDense && !pillars.spacing.ok ? 2.1 : l.weight;
        ctx.globalAlpha = warnDense && !pillars.spacing.ok ? 0.88 : l.alpha;
      } else {
        // 下半水面倒影/廊道地面线
        ctx.strokeStyle = state.scene === "corridor" ? "#7C8C3A" : C.waterLine;
        ctx.lineWidth = l.weight;
        ctx.globalAlpha = l.alpha;
      }
      ctx.stroke();

      // 韵律开启时，在精选主线上绘出原海报「韵律 CADENCE」同款酸绿小音点（纯几何微点）
      if (state.cadenceOn && l.isAccent && !l.isHorizon && ease > 0.85) {
        const frac = 0.18 + ((i * 0.23) % 0.62);
        const nx = x1 + (x2 - x1) * frac;
        const ny = y1 + (y2 - y1) * frac;
        ctx.fillStyle = warnSpread ? C.warn : C.limeBright;
        ctx.globalAlpha = 0.72;
        ctx.beginPath();
        ctx.arc(nx, ny, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawFocalAnchor(model, w, h) {
    if (anim.anchorAlpha < 0.02) return;
    const ap = getAnchorPixel(model, w, h);
    const edgeBad = model.state.anchorOn && (model.state.anchorU < THRESHOLDS.minAnchorEdge || model.state.anchorU > 1 - THRESHOLDS.minAnchorEdge);
    const orient = model.state.orient;

    ctx.save();
    ctx.globalAlpha = anim.anchorAlpha;

    if (orient === "horizontal") {
      if (model.state.scene === "pavilion") {
        // 严格复刻原海报中央极简灰白建筑体块 + 黑色小门 + 水中倒影
        const bx = ap.x - ap.bw * 0.5;
        const by = ap.seamY - ap.bh;

        // 水中倒影（先画，叠在基线下方，再被水波平行线轻切）
        const reflH = ap.bh * 0.82;
        const rGrad = ctx.createLinearGradient(0, ap.seamY, 0, ap.seamY + reflH);
        rGrad.addColorStop(0, "rgba(182, 186, 190, 0.28)");
        rGrad.addColorStop(1, "rgba(40, 50, 58, 0.05)");
        ctx.fillStyle = rGrad;
        ctx.fillRect(bx, ap.seamY + 2, ap.bw, reflH);

        // 建筑立面实块
        ctx.fillStyle = C.concrete;
        ctx.fillRect(bx, by, ap.bw, ap.bh);
        // 建筑顶部极细高光线
        ctx.fillStyle = "#DFE3E5";
        ctx.fillRect(bx, by, ap.bw, 2);

        // 偏右深色门洞（呼应原海报右侧 1/3 黑色门口）
        const dw = clamp(ap.bw * 0.095, 11, 20);
        const dh = ap.bh * 0.44;
        const dx = bx + ap.bw * 0.68;
        ctx.fillStyle = C.door;
        ctx.fillRect(dx, ap.seamY - dh, dw, dh);
        // 门洞倒影
        ctx.fillStyle = "rgba(6, 14, 23, 0.65)";
        ctx.fillRect(dx, ap.seamY + 2, dw, dh * 0.85);

        // 水面平行细线再轻扫过倒影
        ctx.strokeStyle = "rgba(6, 14, 23, 0.55)";
        ctx.lineWidth = 1;
        for (let ry = ap.seamY + 7; ry < ap.seamY + reflH; ry += 6) {
          ctx.beginPath();
          ctx.moveTo(bx - 2, ry);
          ctx.lineTo(bx + ap.bw + 2, ry);
          ctx.stroke();
        }
      } else if (model.state.scene === "sail") {
        // 原海报示例一：极简白色帆船剪影与水中淡影
        const sx = ap.x;
        const sy = ap.seamY;
        const sh = ap.bh;
        // 倒影
        ctx.fillStyle = "rgba(238, 242, 240, 0.16)";
        ctx.beginPath();
        ctx.moveTo(sx - sh * 0.24, sy + 3);
        ctx.lineTo(sx + sh * 0.24, sy + 3);
        ctx.lineTo(sx, sy + sh * 0.58);
        ctx.closePath();
        ctx.fill();
        // 船身
        ctx.fillStyle = "#0C1722";
        ctx.beginPath();
        ctx.moveTo(sx - sh * 0.28, sy - 4);
        ctx.lineTo(sx + sh * 0.30, sy - 4);
        ctx.lineTo(sx + sh * 0.20, sy + 2);
        ctx.lineTo(sx - sh * 0.20, sy + 2);
        ctx.closePath();
        ctx.fill();
        // 主帆与前帆
        ctx.fillStyle = C.white;
        ctx.beginPath();
        ctx.moveTo(sx - 2, sy - sh);
        ctx.lineTo(sx + sh * 0.26, sy - 6);
        ctx.lineTo(sx - 2, sy - 6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#B8C4CC";
        ctx.beginPath();
        ctx.moveTo(sx - 5, sy - sh * 0.78);
        ctx.lineTo(sx - sh * 0.24, sy - 6);
        ctx.lineTo(sx - 5, sy - 6);
        ctx.closePath();
        ctx.fill();
      } else {
        // 原海报示例三：廊道里的纯色行者背影剪影（严格无五官细节！）
        const px = ap.x;
        const py = ap.seamY;
        const fh = ap.bh;
        // 地面投影
        ctx.fillStyle = "rgba(6, 14, 23, 0.45)";
        ctx.beginPath();
        ctx.ellipse(px + 8, py + 2, fh * 0.26, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // 纯简剪影（头圆 + 风衣梯形 + 双腿，无任何眼嘴细节）
        ctx.fillStyle = C.white;
        ctx.beginPath();
        ctx.arc(px, py - fh * 0.84, fh * 0.085, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(px - fh * 0.11, py - fh * 0.72);
        ctx.lineTo(px + fh * 0.11, py - fh * 0.72);
        ctx.lineTo(px + fh * 0.15, py - fh * 0.26);
        ctx.lineTo(px - fh * 0.15, py - fh * 0.26);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(px - fh * 0.085, py - fh * 0.26, fh * 0.055, fh * 0.26);
        ctx.fillRect(px + fh * 0.03, py - fh * 0.26, fh * 0.055, fh * 0.26);
      }
    } else if (orient === "vertical") {
      // 竖向柱列中的破局横梁 / 发光拱门体块
      const bx = ap.x - ap.bw * 0.5;
      const by = ap.y - ap.bh * 0.5;
      ctx.fillStyle = C.concrete;
      ctx.fillRect(bx, by, ap.bw, ap.bh);
      // 拱门或酸绿门窗
      ctx.fillStyle = model.state.scene === "corridor" ? C.lime : C.door;
      const aw = ap.bw * 0.34;
      const ah = ap.bh * 0.48;
      ctx.beginPath();
      ctx.arc(ap.x, by + ap.bh - ah + aw * 0.5, aw * 0.5, Math.PI, 0);
      ctx.lineTo(ap.x + aw * 0.5, by + ap.bh);
      ctx.lineTo(ap.x - aw * 0.5, by + ap.bh);
      ctx.closePath();
      ctx.fill();
    } else {
      // 斜向 28° 平行线阵中的直角静锚块
      ctx.save();
      ctx.translate(ap.x, ap.y);
      ctx.fillStyle = C.concrete;
      ctx.fillRect(-ap.bw * 0.5, -ap.bh * 0.5, ap.bw, ap.bh);
      ctx.fillStyle = model.state.scene === "corridor" ? C.lime : C.door;
      ctx.fillRect(ap.bw * 0.12, -ap.bh * 0.16, ap.bw * 0.18, ap.bh * 0.66);
      ctx.restore();
    }

    // 可拖动标尺框（克制细线，悬停或贴边告警时显色）
    const active = hoverPart === "anchor" || dragMode === "anchor";
    const boxColor = edgeBad ? C.warn : active ? C.limeBright : "rgba(180, 204, 59, 0.55)";
    const bx = ap.x - ap.bw * 0.5 - 6;
    const by = (orient === "horizontal" ? ap.seamY - ap.bh : ap.y - ap.bh * 0.5) - 6;
    const bw = ap.bw + 12;
    const bh = ap.bh + 12;

    ctx.strokeStyle = boxColor;
    ctx.lineWidth = active || edgeBad ? 1.5 : 1;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(bx, by, bw, bh);
    ctx.setLineDash([]);

    // 底部水平位置小标（纯白/酸绿高对比）
    const label = edgeBad ? `贴边 ${model.metrics.anchorPct}%` : `↔ 锚点 ${model.metrics.anchorPct}%`;
    ctx.font = '700 11px "Space Mono", "Noto Sans SC", monospace';
    const tw = ctx.measureText(label).width + 14;
    const lx = clamp(ap.x - tw * 0.5, 8, w - tw - 8);
    const ly = clamp(by - 24, 8, h - 26);
    ctx.fillStyle = edgeBad ? C.warn : "#0D1A26";
    ctx.fillRect(lx, ly, tw, 20);
    ctx.strokeStyle = edgeBad ? C.warn : C.lime;
    ctx.lineWidth = 1;
    ctx.strokeRect(lx + 0.5, ly + 0.5, tw - 1, 19);
    ctx.fillStyle = edgeBad ? "#060E17" : C.white;
    ctx.textBaseline = "middle";
    ctx.fillText(label, lx + 7, ly + 10.5);

    ctx.restore();
  }

  function drawGuidesAndHandles(model, w, h) {
    // 1. 右侧「组内散角」直拖标把（专业建筑直尺边轨）
    const ah = getAlignHandlePixel(model, w, h);
    const orderOk = model.pillars.order.ok;
    const railTop = h * 0.16;
    const railBot = h * 0.84;

    ctx.save();
    // 细竖标尺线与 0° 中位刻度
    ctx.strokeStyle = "rgba(238, 242, 240, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ah.x, railTop);
    ctx.lineTo(ah.x, railBot);
    ctx.stroke();

    // 0° 水平锁止刻痕
    ctx.strokeStyle = orderOk ? C.limeBright : "rgba(180, 204, 59, 0.65)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ah.x - 10, h * 0.5);
    ctx.lineTo(ah.x + 10, h * 0.5);
    ctx.stroke();

    // 可拖手柄块
    const active = hoverPart === "align" || dragMode === "align";
    const hw = active ? 22 : 18;
    const hh = 26;
    ctx.fillStyle = orderOk ? C.lime : C.warn;
    ctx.fillRect(ah.x - hw * 0.5, ah.y - hh * 0.5, hw, hh);
    // 手柄内部双平行短横杠
    ctx.strokeStyle = "#060E17";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ah.x - 4, ah.y - 3);
    ctx.lineTo(ah.x + 4, ah.y - 3);
    ctx.moveTo(ah.x - 4, ah.y + 3);
    ctx.lineTo(ah.x + 4, ah.y + 3);
    ctx.stroke();

    // 左上角精简双态徽标（单源实测值）
    const padX = 12;
    const padY = 12;
    const spreadTxt = `散角 ${model.metrics.spreadDeg > 0 ? "+" : ""}${model.metrics.spreadDeg.toFixed(1)}°`;
    const ratioTxt = `疏密 ${model.metrics.spacingRatio.toFixed(2)}× · ${model.metrics.lineCount} 线`;
    ctx.font = '700 11px "Space Mono", "Noto Sans SC", monospace';
    const w1 = ctx.measureText(spreadTxt).width + 16;
    const w2 = ctx.measureText(ratioTxt).width + 16;

    const drawChip = (x, y, cw, txt, ok) => {
      ctx.fillStyle = "rgba(6, 14, 23, 0.86)";
      ctx.fillRect(x, y, cw, 24);
      ctx.strokeStyle = ok ? C.lime : C.warn;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, 23);
      ctx.fillStyle = ok ? C.limeBright : "#FF967D";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, x + 8, y + 12.5);
    };
    drawChip(padX, padY, w1, spreadTxt, orderOk);
    drawChip(padX + w1 + 8, padY, w2, ratioTxt, model.pillars.spacing.ok && model.pillars.repetition.ok);

    // 底部极细操作提示（宽度足够时显示，避免窄屏压挤）
    if (w >= 460) {
      const tip = model.state.anchorOn
        ? "拖主体调锚点 · 上下拖线区调疏密 · 拖右侧标把扳平散角"
        : "上下拖线区调疏密 · 拖右侧标把归零散角 · 底部开启破局锚点";
      ctx.font = '500 11px "Noto Sans SC", sans-serif';
      const tw = ctx.measureText(tip).width + 16;
      const tx = w - tw - 48;
      const ty = h - 30;
      ctx.fillStyle = "rgba(6, 14, 23, 0.78)";
      ctx.fillRect(tx, ty, tw, 22);
      ctx.fillStyle = "rgba(238, 242, 240, 0.82)";
      ctx.textBaseline = "middle";
      ctx.fillText(tip, tx + 8, ty + 11.5);
    }

    // 四角细 L 形建筑裁切标
    ctx.strokeStyle = "rgba(180, 204, 59, 0.35)";
    ctx.lineWidth = 1;
    const m = 8;
    const len = 10;
    const corners = [
      [m, m, 1, 1],
      [w - m, m, -1, 1],
      [m, h - m, 1, -1],
      [w - m, h - m, -1, -1],
    ];
    for (const [cx, cy, sx, sy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx + sx * len, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + sy * len);
      ctx.stroke();
    }
    ctx.restore();
  }

  function renderFrame(t, dt, { still }) {
    resize();
    const target = getState();

    // 更新入场与平滑值
    if (still) {
      intro = 1;
      anim.divergence = target.divergence;
      anim.spacingGrad = target.spacingGrad;
      anim.anchorU = target.anchorU;
      anim.anchorAlpha = target.anchorOn ? 1 : 0;
    } else {
      const step = dt > 0 ? Math.min(1, dt * 13) : 1;
      if (intro < 1) {
        intro = Math.min(1, intro + Math.max(dt, 0.016) * 0.95);
        dirty = true;
      }
      const lerpTo = (key, val) => {
        const diff = val - anim[key];
        if (Math.abs(diff) > 0.0015) {
          anim[key] += diff * step;
          dirty = true;
        } else if (anim[key] !== val) {
          anim[key] = val;
          dirty = true;
        }
      };
      lerpTo("divergence", target.divergence);
      lerpTo("spacingGrad", target.spacingGrad);
      lerpTo("anchorU", target.anchorU);
      lerpTo("anchorAlpha", target.anchorOn ? 1 : 0);
    }

    if (!dirty && !still) return;
    dirty = false;

    // 渲染使用平滑态生成同一套线段算法（保证视觉丝滑且完全同源）
    const visualModel = computeModel({
      ...target,
      divergence: anim.divergence,
      spacingGrad: anim.spacingGrad,
      anchorU: anim.anchorU,
    });

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSceneBackdrop(visualModel, cssW, cssH);
    drawParallelLines(visualModel, cssW, cssH, intro);
    drawFocalAnchor(visualModel, cssW, cssH);
    drawGuidesAndHandles(visualModel, cssW, cssH);
    ctx.restore();
  }

  // ===== 画布直拖交互（指针 + 键盘） =====
  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function hitTest(px, py) {
    const model = computeModel(getState());
    const ah = getAlignHandlePixel(model, cssW, cssH);
    if (Math.hypot(px - ah.x, py - ah.y) <= ah.r + 8 || Math.abs(px - ah.x) <= 22) {
      return "align";
    }
    if (model.state.anchorOn) {
      const ap = getAnchorPixel(model, cssW, cssH);
      const halfW = ap.bw * 0.5 + 14;
      const halfH = ap.bh * 0.5 + 14;
      const cy = model.state.orient === "horizontal" ? ap.seamY - ap.bh * 0.5 : ap.y;
      if (Math.abs(px - ap.x) <= halfW && Math.abs(py - cy) <= halfH) {
        return "anchor";
      }
    }
    return "spacing";
  }

  canvas.addEventListener("pointerdown", (e) => {
    const { x, y } = pointerPos(e);
    const hit = hitTest(x, y);
    // 触摸屏上点在普通背景时不强抢竖向滚屏，只有点在锚点或右侧齐平标把时接管拖动
    if (e.pointerType === "touch" && hit === "spacing") return;
    dragMode = hit;
    dragStart = { x, y, state: { ...getState() } };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = hit === "anchor" ? "grabbing" : "ns-resize";
    e.preventDefault();
  });

  canvas.addEventListener("pointermove", (e) => {
    const { x, y } = pointerPos(e);
    if (!dragMode) {
      const h = hitTest(x, y);
      if (h !== hoverPart) {
        hoverPart = h;
        canvas.style.cursor = h === "anchor" ? "grab" : h === "align" ? "ns-resize" : "ns-resize";
        dirty = true;
      }
      return;
    }
    if (dragMode === "align") {
      const norm = clamp((y - cssH * 0.5) / (cssH * 0.31), -1, 1);
      let deg = norm * 18;
      if (Math.abs(deg) <= THRESHOLDS.snapSpreadDeg) deg = 0;
      onStateChange({ divergence: Number(deg.toFixed(1)) });
    } else if (dragMode === "anchor") {
      const u = clamp(x / cssW, 0.06, 0.94);
      onStateChange({ anchorU: Number(u.toFixed(3)) });
    } else if (dragMode === "spacing") {
      const dy = dragStart.y - y;
      const next = clamp(dragStart.state.spacingGrad + dy / (cssH * 0.65), 0, 1);
      onStateChange({ spacingGrad: Number(next.toFixed(3)) });
    }
    dirty = true;
  });

  const endDrag = () => {
    if (!dragMode) return;
    dragMode = null;
    dragStart = null;
    canvas.style.cursor = hoverPart === "anchor" ? "grab" : "ns-resize";
    dirty = true;
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => {
    if (!dragMode && hoverPart !== null) {
      hoverPart = null;
      dirty = true;
    }
  });

  // 画布键盘微调：左右调锚点，上下调散角
  canvas.addEventListener("keydown", (e) => {
    const st = getState();
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      if (!st.anchorOn) {
        onStateChange({ anchorOn: true });
      } else {
        const delta = e.key === "ArrowRight" ? 0.04 : -0.04;
        onStateChange({ anchorU: Number(clamp(st.anchorU + delta, 0.06, 0.94).toFixed(3)) });
      }
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const delta = e.key === "ArrowUp" ? -1.0 : 1.0;
      let next = clamp(st.divergence + delta, -18, 18);
      if (Math.abs(next) <= 0.6) next = 0;
      onStateChange({ divergence: Number(next.toFixed(1)) });
    }
  });

  const ro = new ResizeObserver(() => {
    resize();
    dirty = true;
  });
  ro.observe(canvas);

  const ctl = loop(canvas, renderFrame);
  return {
    notify() {
      dirty = true;
      ctl.draw();
    },
  };
}

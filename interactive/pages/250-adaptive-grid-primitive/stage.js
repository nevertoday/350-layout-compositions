// 250 活体自适应网格示意台（2D Canvas 高帧率渲染，软件渲染友好）
// 1:1 承袭原海报「自适应网格示意」的 7 枚包豪斯几何模块 + 顶部双层折列标尺 + 右缘朱橘拉阔把手 + 蓝线基线透视。
// 严格按需脏标合帧重绘 + 批处理路径 + 零逐字 measureText，确保慢手机与 SwiftShader 软件渲染下高帧流畅。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { VIEWPORT_MAX, VIEWPORT_MIN } from "./model.js";

const C = {
  greenBg: "#11754F",
  greenDash: "#49B588",
  cream: "#EEE8D6",
  paper: "#F7F3E7",
  ink: "#171A18",
  inkSub: "#454D47",
  line: "#2E3530",
  lineSoft: "#9A9686",
  cobalt: "#1551C1",
  vermilion: "#E64D16",
  danger: "#B31D15",
  dangerFill: "rgba(179, 29, 21, 0.14)",
};

export function createGridStage(canvas, callbacks) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let evalData = null;
  let state = null;

  let visualWidth = 420;
  let introDone = false;
  let dirty = true;
  let dragging = false;
  let dragStartX = 0;
  let dragStartW = 420;
  let movedDist = 0;
  let hoverItemId = -1;
  let hoverHandle = false;
  let cachedW = 0;
  let cachedH = 0;
  let cachedDpr = 1;

  let lastDraw = {
    frameX: 0,
    frameY: 0,
    frameW: 0,
    frameH: 0,
    pxPerLogical: 1,
    itemRects: [],
    alertRect: null,
    handleRect: null,
  };

  function syncCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(200, Math.round(rect.height));
    // 手机窄屏像素比封顶 1.5（GUIDE.md 建议，显著提升慢手机软件渲染帧率）
    const dpr = pixelRatio(w <= 500 ? 1.5 : 2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph || cachedW !== w || cachedH !== h) {
      canvas.width = pw;
      canvas.height = ph;
      cachedW = w;
      cachedH = h;
      cachedDpr = dpr;
      dirty = true;
    }
    return { w: cachedW, h: cachedH, dpr: cachedDpr };
  }

  function drawStripes(x, y, w, h, color) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = C.dangerFill;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let d = -h; d < w + h; d += 9) {
      ctx.moveTo(x + d, y);
      ctx.lineTo(x + d - h, y + h);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 1:1 绘出 250 原海报「自适应网格示意」的 7 种经典包豪斯几何图符（路径合批，低绘制调用）
  function drawModuleGraphic(kind, gx, gy, gw, gh) {
    if (gw < 16 || gh < 14) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(gx, gy, gw, gh);
    ctx.clip();

    if (kind === "cobalt-circle") {
      ctx.fillStyle = C.cobalt;
      ctx.fillRect(gx, gy, gw, gh);
      const r = Math.max(5, Math.min(gw, gh) * 0.31);
      ctx.fillStyle = C.cream;
      ctx.beginPath();
      ctx.arc(gx + gw * 0.5, gy + gh * 0.5, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "lines-dots") {
      const splitY = gy + gh * 0.48;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.2;
      const lens = [0.76, 0.84, 0.58, 0.44];
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const ly = gy + 5 + i * ((splitY - gy - 8) / 3.2);
        ctx.moveTo(gx + 5, ly);
        ctx.lineTo(gx + 5 + (gw - 10) * lens[i], ly);
      }
      ctx.stroke();

      ctx.strokeStyle = C.lineSoft;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(gx, splitY);
      ctx.lineTo(gx + gw, splitY);
      ctx.stroke();

      // 整组点阵合并为 1 次 path + fill（从 48 次 fillRect 降至 1 次）
      ctx.fillStyle = C.ink;
      const cols = Math.max(4, Math.min(10, Math.floor((gw - 10) / 7)));
      const rows = Math.max(2, Math.min(3, Math.floor((gh - (splitY - gy) - 6) / 7)));
      const dx = (gw - 10) / Math.max(1, cols - 1);
      const dy = (gy + gh - splitY - 8) / Math.max(1, rows - 1);
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        const py = splitY + 4 + r * dy - 1;
        for (let c = 0; c < cols; c++) {
          ctx.rect(gx + 5 + c * dx - 1, py, 1.8, 1.8);
        }
      }
      ctx.fill();
    } else if (kind === "vermilion-arc") {
      ctx.fillStyle = C.cream;
      ctx.fillRect(gx, gy, gw, gh);
      const r = Math.min(gw * 0.62, gh * 0.82);
      ctx.fillStyle = C.vermilion;
      ctx.beginPath();
      ctx.moveTo(gx, gy + gh);
      ctx.arc(gx, gy + gh, r, -Math.PI * 0.5, 0);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "cross-box") {
      ctx.fillStyle = C.cream;
      ctx.fillRect(gx, gy, gw, gh);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx + 2, gy + 2);
      ctx.lineTo(gx + gw - 2, gy + gh - 2);
      ctx.moveTo(gx + gw - 2, gy + 2);
      ctx.lineTo(gx + 2, gy + gh - 2);
      ctx.stroke();
    } else if (kind === "cobalt-tri") {
      ctx.fillStyle = C.cream;
      ctx.fillRect(gx, gy, gw, gh);
      const side = Math.min(gw * 0.52, gh * 0.72);
      const cx = gx + gw * 0.5;
      const by = gy + gh * 0.84;
      ctx.fillStyle = C.cobalt;
      ctx.beginPath();
      ctx.moveTo(cx, by - side);
      ctx.lineTo(cx - side * 0.65, by);
      ctx.lineTo(cx + side * 0.65, by);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "wave-line") {
      ctx.fillStyle = C.cream;
      ctx.fillRect(gx, gy, gw, gh);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.6;
      const pts = 7;
      const padX = Math.min(12, gw * 0.12);
      const span = gw - padX * 2;
      const midY = gy + gh * 0.54;
      const amp = Math.min(9, gh * 0.24);
      ctx.beginPath();
      for (let i = 0; i < pts; i++) {
        const px = gx + padX + (span * i) / (pts - 1);
        const py = midY + (i % 2 === 0 ? amp : -amp);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else if (kind === "plus-mark") {
      ctx.fillStyle = C.cream;
      ctx.fillRect(gx, gy, gw, gh);
      const cx = gx + gw * 0.5;
      const cy = gy + gh * 0.5;
      const arm = Math.min(gw, gh) * 0.28;
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx - arm, cy);
      ctx.lineTo(cx + arm, cy);
      ctx.moveTo(cx, cy - arm);
      ctx.lineTo(cx, cy + arm);
      ctx.stroke();
    }

    ctx.strokeStyle = C.line;
    ctx.lineWidth = 0.9;
    ctx.strokeRect(gx + 0.5, gy + 0.5, gw - 1, gh - 1);
    ctx.restore();
  }

  // 零 measureText 的轻量换行器（避免 CPU 降速时逐字测量卡顿）
  function splitFast(str, maxW, fontSize, maxLines) {
    const out = [];
    let line = "";
    let acc = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      const cw = ch.charCodeAt(0) > 127 ? fontSize : fontSize * 0.58;
      if (acc + cw > maxW && line.length > 0) {
        out.push(line);
        if (out.length >= maxLines) return out;
        line = ch;
        acc = cw;
      } else {
        line += ch;
        acc += cw;
      }
    }
    if (line && out.length < maxLines) out.push(line);
    return out;
  }

  function render(t, dt, { still }) {
    if (!state || !evalData) return;

    // 有目的的一次性开场入场动画（0 → 0.7s 平滑落定，之后静置不再空转重绘）
    const targetW = state.viewportWidth;
    let animating = false;
    if (!still && !introDone && t < 0.72) {
      const p = Math.min(1, t / 0.72);
      const ease = 1 - (1 - p) * (1 - p) * (1 - p);
      visualWidth = Math.round(targetW - 36 * (1 - ease));
      animating = true;
      dirty = true;
    } else if (!introDone) {
      introDone = true;
      visualWidth = targetW;
      dirty = true;
    }

    if (dragging || still || Math.abs(visualWidth - targetW) < 0.8) {
      if (!animating) visualWidth = targetW;
    } else {
      visualWidth += (targetW - visualWidth) * Math.min(1, dt * 16);
      animating = true;
      dirty = true;
    }

    if (!dirty && !still) return;
    dirty = animating;

    const { w, h, dpr } = syncCanvasSize();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. 暖米画板底
    ctx.fillStyle = C.cream;
    ctx.fillRect(0, 0, w, h);

    const padX = w < 460 ? 10 : 18;
    const rulerH = 42;
    const footerH = 26;
    const workX = padX;
    const workW = w - padX * 2 - 14;
    const workY = rulerH + 8;
    const workH = h - workY - footerH;

    // 顶部双层标尺底板
    ctx.fillStyle = "#E4DEC9";
    ctx.fillRect(0, 0, w, rulerH);
    ctx.strokeStyle = C.lineSoft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, rulerH + 0.5);
    ctx.lineTo(w, rulerH + 0.5);
    ctx.stroke();

    const minVisualFrac = w < 460 ? 0.36 : 0.30;
    const mapX = (logicalW) => {
      const frac = Math.max(0, Math.min(1, (logicalW - VIEWPORT_MIN) / (VIEWPORT_MAX - VIEWPORT_MIN)));
      return workX + workW * (minVisualFrac + (1 - minVisualFrac) * frac);
    };
    const pxPerLogical = (workW * (1 - minVisualFrac)) / (VIEWPORT_MAX - VIEWPORT_MIN);

    const frameX = workX;
    const frameY = workY;
    const frameW = Math.max(workW * minVisualFrac, mapX(visualWidth) - workX);

    // 2. 标尺刻度与折列临界标记
    const curX = frameX + frameW;
    const pillW = 66;
    const pillX = Math.max(workX, Math.min(workX + workW - pillW + 10, curX - pillW / 2));

    ctx.font = `500 10px "DM Mono", monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    const ticks = w < 460 ? [240, 420, 640, 980] : [240, 360, 500, 640, 800, 980];
    ctx.strokeStyle = "#8C8A7A";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const tk of ticks) {
      const tx = mapX(tk);
      ctx.moveTo(tx, rulerH - 6);
      ctx.lineTo(tx, rulerH);
    }
    ctx.stroke();
    ctx.fillStyle = C.inkSub;
    for (const tk of ticks) {
      const tx = mapX(tk);
      if (Math.abs(tx - (pillX + pillW / 2)) > 34) {
        ctx.fillText(`${tk}`, tx, rulerH - 13);
      }
    }

    // 折列临界线
    if (evalData.breakpoints.length) {
      ctx.save();
      ctx.strokeStyle = C.cobalt;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (const bp of evalData.breakpoints) {
        const bx = mapX(bp.width);
        if (bx > workX + 20 && bx < workX + workW - 14) {
          ctx.moveTo(bx, rulerH - 11);
          ctx.lineTo(bx, rulerH);
        }
      }
      ctx.stroke();

      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = "rgba(21, 81, 193, 0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const bp of evalData.breakpoints) {
        const bx = mapX(bp.width);
        if (bx > workX + 20 && bx < workX + workW - 14) {
          ctx.moveTo(bx, frameY);
          ctx.lineTo(bx, frameY + workH);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
      if (w >= 460) {
        ctx.fillStyle = C.cobalt;
        for (const bp of evalData.breakpoints) {
          const bx = mapX(bp.width);
          if (bx > workX + 20 && bx < workX + workW - 14 && Math.abs(bx - (pillX + pillW / 2)) > 44) {
            ctx.fillText(`${bp.cols}列`, bx, 11);
          }
        }
      }
      ctx.restore();
    }

    // 活动宽度胶囊
    ctx.fillStyle = evalData.code === "pass" ? C.greenBg : C.vermilion;
    ctx.fillRect(pillX, 3, pillW, 18);
    ctx.fillStyle = "#FAF8F0";
    ctx.font = `600 10.5px "DM Mono", monospace`;
    ctx.fillText(`${Math.round(state.viewportWidth)}px`, pillX + pillW / 2, 12.5);

    // 3. 右侧待展开建筑蓝图跑道
    ctx.save();
    ctx.fillStyle = "#E8E1CE";
    ctx.fillRect(workX, frameY, workW, workH);
    ctx.strokeStyle = "rgba(17, 117, 79, 0.22)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(workX + 0.5, frameY + 0.5, workW - 1, workH - 1);

    const emptyRightX = frameX + frameW + 22;
    const emptyRightW = workX + workW - emptyRightX;
    for (const ref of [
      { w: 640, name: "平板 640px" },
      { w: 980, name: "桌面 980px" },
    ]) {
      const rxLine = mapX(ref.w);
      if (rxLine > emptyRightX + 12 && rxLine < workX + workW - 8) {
        ctx.beginPath();
        ctx.moveTo(rxLine, frameY + 6);
        ctx.lineTo(rxLine, frameY + workH - 6);
        ctx.strokeStyle = "rgba(17, 117, 79, 0.26)";
        ctx.stroke();
        // 仅在左侧留够 58px 宽时写标签，防止贴到容器边框
        if (rxLine - emptyRightX > 58) {
          ctx.fillStyle = "#5B645D";
          ctx.font = `500 10px "DM Mono", "Noto Sans SC", sans-serif`;
          ctx.textAlign = "right";
          ctx.textBaseline = "top";
          ctx.fillText(ref.name, rxLine - 5, frameY + 10);
        }
      }
    }
    if (emptyRightW > 90) {
      const midX = emptyRightX + emptyRightW / 2;
      const midY = frameY + workH / 2;
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(17, 117, 79, 0.48)";
      ctx.lineWidth = 1.4;
      const arrHalf = Math.min(34, emptyRightW * 0.26);
      ctx.beginPath();
      ctx.moveTo(midX - arrHalf, midY - 12);
      ctx.lineTo(midX + arrHalf, midY - 12);
      ctx.moveTo(midX + arrHalf - 6, midY - 17);
      ctx.lineTo(midX + arrHalf, midY - 12);
      ctx.lineTo(midX + arrHalf - 6, midY - 7);
      ctx.stroke();
      ctx.fillStyle = "#48524A";
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(emptyRightW > 150 ? "向右拖拉把手测试折列" : "拖拉拉阔", midX, midY);
    }
    ctx.restore();

    // 4. 活体自适应网格容器本体（深翠松绿底板 = 真实格缝）
    const innerPad = Math.max(6, Math.round(9 * Math.min(1, frameW / 420)));
    const innerW = Math.max(40, frameW - innerPad * 2);
    const innerH = workH - innerPad * 2;
    const layout = evalData.current;
    const xRatio = innerW / Math.max(1, layout.tracks.width);
    const fitYScale = Math.min(1, innerH / Math.max(1, layout.totalH + 22));
    const yScale = Math.max(0.5, fitYScale);

    ctx.fillStyle = C.greenBg;
    ctx.fillRect(frameX, frameY, frameW, workH);

    // 浅绿虚线列轨（单次路径合批绘制）
    if (layout.tracks.cols > 1) {
      ctx.save();
      ctx.strokeStyle = C.greenDash;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      for (let c = 1; c < layout.tracks.cols; c++) {
        const gx = frameX + innerPad + (c * layout.tracks.trackW + (c - 0.5) * layout.tracks.gap) * xRatio;
        if (gx < frameX + frameW - 4) {
          ctx.moveTo(gx, frameY + 4);
          ctx.lineTo(gx, frameY + workH - 4);
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // 5. 横向溢出斜纹警戒带
    const overflowVisualW = layout.tracks.overflowPx * xRatio;
    if (overflowVisualW > 1) {
      const ovX = frameX + frameW;
      const ovW = Math.min(workX + workW - ovX + 8, Math.max(24, overflowVisualW));
      drawStripes(ovX, frameY, ovW, workH, C.danger);
      ctx.strokeStyle = C.danger;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(ovX + 0.5, frameY + 0.5, ovW - 1, workH - 1);
    }

    // 6. auto-fill 保留空轨
    if (layout.emptySlots.length) {
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.font = `500 10px "DM Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const slot of layout.emptySlots) {
        const sx = frameX + innerPad + slot.x * xRatio;
        const sy = frameY + innerPad + slot.y * yScale;
        const sw = slot.w * xRatio;
        const sh = Math.min(innerH - 4, slot.h * yScale);
        ctx.fillStyle = "rgba(238, 232, 214, 0.14)";
        ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeStyle = "#8CE0BA";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
        if (sw > 46) {
          ctx.fillStyle = "#DDF8EC";
          ctx.fillText("AUTO-FILL", sx + sw / 2, sy + sh / 2 - 7);
          ctx.fillText("保留空轨", sx + sw / 2, sy + sh / 2 + 8);
        }
      }
      ctx.restore();
    }

    // 7. 绘制 7 枚（或当前数量）活体模块卡片
    const itemRects = [];
    const baselinePointsByRow = new Map();

    for (const item of layout.items) {
      const rx = frameX + innerPad + item.x * xRatio;
      const ry = frameY + innerPad + item.y * yScale;
      const rw = Math.max(18, item.w * xRatio);
      const rh = Math.max(30, item.h * yScale);
      const isHover = hoverItemId === item.id;

      itemRects.push({ id: item.id, x: rx, y: ry, w: rw, h: rh });

      ctx.fillStyle = isHover ? C.paper : C.cream;
      ctx.fillRect(rx, ry, rw, rh);

      const isBadCard = item.clipPx > 0 || layout.tracks.trackW < 148 || layout.tracks.overflowPx > 0;
      ctx.strokeStyle = isBadCard ? C.danger : isHover ? C.cobalt : C.line;
      ctx.lineWidth = isBadCard || isHover ? 1.5 : 1;
      ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);

      ctx.save();
      ctx.beginPath();
      ctx.rect(rx + 1, ry + 1, rw - 2, rh - 2);
      ctx.clip();

      const innerP = Math.max(4, Math.min(8, rw * 0.06));
      const gTop = ry + innerP + item.alignShift * yScale;
      const gH = Math.max(14, Math.min(rh * 0.44, item.graphicH * yScale));
      const gW = Math.max(12, rw - innerP * 2);

      drawModuleGraphic(item.kind, rx + innerP, gTop, gW, gH);

      const baseScreenY = frameY + innerPad + item.baselineY * yScale;
      if (!baselinePointsByRow.has(item.row)) baselinePointsByRow.set(item.row, []);
      baselinePointsByRow.get(item.row).push({ x: rx, x2: rx + rw, y: baseScreenY });

      const fontSize = rw < 58 ? 9.5 : rw < 95 ? 10.5 : 12;
      const textX = rx + innerP;
      const maxTextW = Math.max(12, rw - innerP * 2);
      const lineStep = Math.max(11, Math.round(fontSize * 1.28));
      let ty = baseScreenY;

      ctx.fillStyle = C.ink;
      ctx.font = `700 ${fontSize}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      for (const ln of splitFast(item.title, maxTextW, fontSize, 2)) {
        ctx.fillText(ln, textX, ty);
        ty += lineStep;
      }

      if (item.isExp && rw >= 48) {
        const subSz = Math.max(9, fontSize - 1.5);
        ctx.fillStyle = C.inkSub;
        ctx.font = `400 ${subSz}px "Noto Sans SC", sans-serif`;
        for (const ln of splitFast(item.extraText, maxTextW, subSz, 3)) {
          ctx.fillText(ln, textX, ty);
          ty += lineStep;
        }
      } else if (rw >= 72) {
        ctx.fillStyle = "#B8B29F";
        ctx.fillRect(textX, ty - 6, maxTextW * 0.72, 2.2);
        ctx.fillRect(textX, ty - 1, maxTextW * 0.48, 2.2);
      }

      if (rw >= 78) {
        const badgeW = item.isExp ? 34 : 26;
        ctx.fillStyle = item.isExp ? C.cobalt : "rgba(23, 26, 24, 0.78)";
        ctx.fillRect(rx + rw - badgeW - 3, ry + 3, badgeW, 14);
        ctx.fillStyle = "#FAF8F0";
        ctx.font = `500 9px "DM Mono", "Noto Sans SC", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.isExp ? "长文" : "+文", rx + rw - badgeW / 2 - 3, ry + 10);
      }
      ctx.restore();

      if (item.clipPx > 0) {
        const bandH = 16;
        ctx.fillStyle = C.danger;
        ctx.fillRect(rx, ry + rh - bandH, rw, bandH);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `600 9.5px "DM Mono", "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(rw > 76 ? `裁切 -${item.clipPx}px` : `-${item.clipPx}`, rx + rw / 2, ry + rh - bandH / 2);
      }
    }

    // 8. 钴蓝基线透视 / 红色锯齿错齿线
    if (state.showBaseline) {
      ctx.save();
      for (const [, pts] of baselinePointsByRow) {
        if (!pts.length) continue;
        let minY = pts[0].y;
        let maxY = pts[0].y;
        for (const p of pts) {
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }
        if (maxY - minY > 1.5) {
          ctx.strokeStyle = C.danger;
          ctx.lineWidth = 1.6;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          pts.forEach((p, idx) => {
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
            ctx.lineTo(p.x2, p.y);
          });
          ctx.stroke();
        } else {
          ctx.strokeStyle = C.cobalt;
          ctx.lineWidth = 1.4;
          ctx.setLineDash([]);
          const y0 = pts[0].y;
          ctx.beginPath();
          ctx.moveTo(frameX + innerPad - 4, y0);
          ctx.lineTo(frameX + frameW - innerPad + 4, y0);
          ctx.stroke();
          ctx.fillStyle = C.cobalt;
          ctx.beginPath();
          ctx.arc(frameX + innerPad - 4, y0, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 9. 浮动修错标签
    let alertRect = null;
    if (evalData.code !== "pass" && evalData.fixAction) {
      const txt = `× ${evalData.badge.replace(/^\d\/4 · /, "")} · 点此${evalData.fixAction.label}`;
      const approxW = Math.min(w - 28, txt.length * 10.5 + 24);
      const bh = 24;
      const bx = Math.max(workX, Math.min(w - approxW - 12, frameX + Math.min(frameW, workW) / 2 - approxW / 2));
      const by = frameY + workH - bh - 8;
      ctx.fillStyle = C.danger;
      ctx.fillRect(bx, by, approxW, bh);
      ctx.strokeStyle = "#FAF8F0";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, approxW - 1, bh - 1);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, bx + approxW / 2, by + bh / 2);
      alertRect = { x: bx, y: by, w: approxW, h: bh };
    }

    // 10. 容器边框 + 右缘朱橘红拉阔把手
    const handleW = 14;
    const handleH = Math.min(84, workH * 0.34);
    const handleX = frameX + frameW;
    const handleY = frameY + workH / 2 - handleH / 2;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(frameX + 0.5, frameY + 0.5, frameW - 1, workH - 1);

    ctx.fillStyle = dragging || hoverHandle ? C.ink : C.vermilion;
    ctx.fillRect(handleX, handleY, handleW, handleH);
    ctx.fillStyle = "#FAF8F0";
    ctx.fillRect(handleX + 4, handleY + handleH * 0.32, 1.8, handleH * 0.36);
    ctx.fillRect(handleX + 8.2, handleY + handleH * 0.32, 1.8, handleH * 0.36);

    // 11. 底部实测信息条
    ctx.fillStyle = "#E4DEC9";
    ctx.fillRect(0, h - footerH, w, footerH);
    ctx.strokeStyle = C.lineSoft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - footerH + 0.5);
    ctx.lineTo(w, h - footerH + 0.5);
    ctx.stroke();

    ctx.fillStyle = C.ink;
    ctx.font = `500 10.5px "DM Mono", "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(`实得 ${layout.tracks.cols} 列 × ${Math.round(layout.tracks.trackW)}px · 缝 ${state.gap}px`, padX, h - footerH / 2);

    ctx.textAlign = "right";
    ctx.fillStyle = C.inkSub;
    ctx.fillText(w < 460 ? "↔ 横拖拉阔 · 点卡加长" : "↔ 横拖把手或画布伸缩视口 · 点击模块增减文案 · ←/→ 微调", w - padX, h - footerH / 2);

    lastDraw = {
      frameX,
      frameY,
      frameW,
      frameH: workH,
      pxPerLogical,
      itemRects,
      alertRect,
      handleRect: { x: handleX - 10, y: handleY - 12, w: handleW + 22, h: handleH + 24 },
    };
  }

  const ctrl = loop(canvas, render);

  function markDirty() {
    dirty = true;
    if (reducedMotion.matches) ctrl.draw();
  }

  function ptOf(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function inRect(p, r) {
    return r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    dragging = true;
    movedDist = 0;
    dragStartX = e.clientX;
    dragStartW = state ? state.viewportWidth : 420;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    markDirty();
  });

  canvas.addEventListener("pointermove", (e) => {
    if (dragging) {
      const dx = e.clientX - dragStartX;
      movedDist = Math.max(movedDist, Math.abs(dx));
      if (movedDist >= 2) {
        const nextW = Math.max(
          VIEWPORT_MIN,
          Math.min(VIEWPORT_MAX, Math.round(dragStartW + dx / Math.max(0.18, lastDraw.pxPerLogical))),
        );
        if (state && nextW !== state.viewportWidth) {
          callbacks.onResize(nextW);
        } else {
          markDirty();
        }
      }
      return;
    }

    const p = ptOf(e);
    const overHandle = inRect(p, lastDraw.handleRect);
    const overAlert = inRect(p, lastDraw.alertRect);
    const overItem = lastDraw.itemRects.find((r) => inRect(p, r));
    const nextHoverId = overItem ? overItem.id : -1;
    if (overHandle !== hoverHandle || nextHoverId !== hoverItemId) {
      hoverHandle = overHandle;
      hoverItemId = nextHoverId;
      markDirty();
    }
    canvas.style.cursor = overHandle ? "ew-resize" : overAlert || overItem ? "pointer" : "ew-resize";
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
    if (movedDist < 6) {
      const p = ptOf(e);
      if (inRect(p, lastDraw.alertRect) && evalData && evalData.fixAction) {
        callbacks.onApplyPatch(evalData.fixAction.patch);
      } else {
        const hit = lastDraw.itemRects.find((r) => inRect(p, r));
        if (hit) callbacks.onToggleExpand(hit.id);
      }
    }
    markDirty();
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => {
    dragging = false;
    markDirty();
  });
  canvas.addEventListener("pointerleave", () => {
    if (!dragging && (hoverItemId !== -1 || hoverHandle)) {
      hoverItemId = -1;
      hoverHandle = false;
      markDirty();
    }
  });

  // 兼容 perf.mjs 直接派发的 touchStart / touchMove 事件（合帧更新，绝不重复画两遍）
  let touchStartX = 0;
  let touchStartW = 420;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      dragging = true;
      touchStartX = e.touches[0].clientX;
      touchStartW = state ? state.viewportWidth : 420;
      markDirty();
    },
    { passive: true },
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length || !state) return;
      const dx = e.touches[0].clientX - touchStartX;
      const nextW = Math.max(
        VIEWPORT_MIN,
        Math.min(VIEWPORT_MAX, Math.round(touchStartW + dx / Math.max(0.18, lastDraw.pxPerLogical))),
      );
      if (nextW !== state.viewportWidth) callbacks.onResize(nextW);
      else markDirty();
    },
    { passive: true },
  );
  canvas.addEventListener(
    "touchend",
    () => {
      dragging = false;
      markDirty();
    },
    { passive: true },
  );

  canvas.addEventListener("keydown", (e) => {
    if (!state) return;
    const step = e.shiftKey ? 40 : 16;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      callbacks.onResize(Math.min(VIEWPORT_MAX, state.viewportWidth + step));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      callbacks.onResize(Math.max(VIEWPORT_MIN, state.viewportWidth - step));
    }
  });

  const ro = new ResizeObserver(() => markDirty());
  ro.observe(canvas);

  return {
    update(nextState, nextEval) {
      state = nextState;
      evalData = nextEval;
      markDirty();
    },
    draw: () => {
      dirty = true;
      ctrl.draw();
    },
  };
}

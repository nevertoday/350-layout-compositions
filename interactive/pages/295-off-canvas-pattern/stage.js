// 295 画布外模式 · 2D Canvas 透视背景渲染（离屏缓存青绿半调网点与网格 + 越界指向虚线箭头 + 边界裁切延长线）
// 通过 lib/stage.js 的 loop() 节电运行，并兼容 prefers-reduced-motion 与无 WebGL 环境。

import { loop, pixelRatio } from "../../lib/stage.js";
import { allowedRange } from "./model.js";

const COL = {
  navy: "#042548",
  teal: "#0E7E7A",
  coral: "#EE583B",
  coralSoft: "rgba(238, 88, 59, 0.24)",
  inkLine: "rgba(4, 37, 72, 0.14)",
};

export function mountCanvasStage(canvas, host, state, getViewportBox) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { draw() {}, resize() {}, invalidateBg() {} };

  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");

  let W = 0;
  let H = 0;
  let dpr = 1;
  let cachedBox = null;
  let bgKey = "";

  function measureBox() {
    cachedBox = getViewportBox();
    return cachedBox;
  }

  function resize() {
    const r = host.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    dpr = pixelRatio(W < 640 ? 1.5 : 2);
    const pw = Math.round(W * dpr);
    const ph = Math.round(H * dpr);
    canvas.width = pw;
    canvas.height = ph;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    bgCanvas.width = pw;
    bgCanvas.height = ph;
    bgKey = "";
    measureBox();
  }

  function drawHalftoneSide(c, xStart, width, dir, alphaScale) {
    if (width <= 10) return;
    const step = width < 110 ? 12 : 16;
    const cols = Math.ceil(width / step);
    const rows = Math.ceil((H - 18) / step);
    c.fillStyle = COL.teal;
    for (let col = 0; col < cols; col++) {
      const frac = cols <= 1 ? 0.5 : col / (cols - 1);
      // 越靠近外缘点越大，越靠近视口边界点越细，还原 295 海报左侧半调渐隐
      const edgeWeight = dir === -1 ? 1 - frac : frac;
      const radius = 0.8 + edgeWeight * (width < 110 ? 2.2 : 3.1);
      const x = xStart + col * step + step * 0.5;
      if (x < xStart || x > xStart + width) continue;
      c.globalAlpha = (0.08 + edgeWeight * 0.24) * alphaScale;
      c.beginPath();
      for (let row = 0; row < rows; row++) {
        const y = 12 + row * step;
        c.moveTo(x + radius, y);
        c.arc(x, y, radius, 0, Math.PI * 2);
      }
      c.fill();
    }
    c.globalAlpha = 1;
  }

  function ensureBgCache(box, xray, leftOff, rightOff, mode) {
    const key = `${W}x${H}|${Math.round(box.left)}|${Math.round(box.right)}|${Math.round(box.top)}|${Math.round(box.bottom)}|${xray}|${leftOff}|${rightOff}|${mode}`;
    if (key === bgKey || !bgCtx) return;
    bgKey = key;

    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgCtx.clearRect(0, 0, W, H);

    // 1. 背景纸色与标尺细网格
    bgCtx.fillStyle = xray ? "#F3E6CC" : "#E5D5B8";
    bgCtx.fillRect(0, 0, W, H);

    bgCtx.strokeStyle = xray ? COL.inkLine : "rgba(4, 37, 72, 0.07)";
    bgCtx.lineWidth = 1;
    const gridGap = 28;
    bgCtx.beginPath();
    for (let x = gridGap; x < W; x += gridGap) {
      bgCtx.moveTo(x + 0.5, 0);
      bgCtx.lineTo(x + 0.5, H);
    }
    for (let y = gridGap; y < H; y += gridGap) {
      bgCtx.moveTo(0, y + 0.5);
      bgCtx.lineTo(W, y + 0.5);
    }
    bgCtx.stroke();

    // 2. 左右两侧海报同款青绿半调渐隐网点
    const leftW = Math.max(0, box.left);
    const rightX = Math.min(W, box.right);
    const rightW = Math.max(0, W - rightX);

    if (leftW > 10) {
      drawHalftoneSide(bgCtx, 0, leftW, -1, xray ? (leftOff ? 1 : 0.35) : 0.22);
    }
    if (rightW > 10) {
      drawHalftoneSide(bgCtx, rightX, rightW, 1, xray ? (rightOff ? 1 : 0.35) : 0.22);
    }

    // 3. 四角取景折角「┌ ┐ └ ┘」（呼应海报右下角关键关系框）
    const ck = 11;
    bgCtx.strokeStyle = COL.navy;
    bgCtx.lineWidth = 2.2;
    bgCtx.beginPath();
    const corners = [
      [box.left - 3, box.top - 3, 1, 1],
      [box.right + 3, box.top - 3, -1, 1],
      [box.left - 3, box.bottom + 3, 1, -1],
      [box.right + 3, box.bottom + 3, -1, -1],
    ];
    for (const [cx, cy, sx, sy] of corners) {
      bgCtx.moveTo(cx + sx * ck, cy);
      bgCtx.lineTo(cx, cy);
      bgCtx.lineTo(cx, cy + sy * ck);
    }
    bgCtx.stroke();

    // 4. 顶边标尺文字（自适应宽屏/窄屏，不越界不裁切）
    bgCtx.font = '600 10px "IBM Plex Mono", monospace';
    bgCtx.textBaseline = "top";
    const labelY = Math.max(4, Math.min(10, box.top - 15));
    const revealMode = mode === "reveal";
    if (leftW > 86) {
      bgCtx.fillStyle = leftOff ? COL.teal : "rgba(4,37,72,0.48)";
      bgCtx.textAlign = "right";
      const txtL = !leftOff ? "DOCKED L" : revealMode ? "UNDERLAY L" : "OFF-CANVAS L";
      bgCtx.fillText(txtL, box.left - 10, labelY);
    } else if (leftW > 46) {
      bgCtx.fillStyle = leftOff ? COL.teal : "rgba(4,37,72,0.48)";
      bgCtx.textAlign = "right";
      bgCtx.fillText(leftOff ? "OUT L" : "IN L", box.left - 6, labelY);
    }
    if (rightW > 86) {
      bgCtx.fillStyle = rightOff ? COL.coral : "rgba(4,37,72,0.48)";
      bgCtx.textAlign = "left";
      const txtR = !rightOff ? "DOCKED R" : revealMode ? "PEEL OUT R" : "OFF-CANVAS R";
      bgCtx.fillText(txtR, box.right + 10, labelY);
    } else if (rightW > 46) {
      bgCtx.fillStyle = rightOff ? COL.coral : "rgba(4,37,72,0.48)";
      bgCtx.textAlign = "left";
      bgCtx.fillText(rightOff ? "OUT R" : "IN R", box.right + 6, labelY);
    }
  }

  function drawDashedArrow(x1, y1, x2, y2, color, dashOffset) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 5]);
    ctx.lineDashOffset = dashOffset;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const head = 7;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang - 0.55), y2 - head * Math.sin(ang - 0.55));
    ctx.lineTo(x2 - head * Math.cos(ang + 0.55), y2 - head * Math.sin(ang + 0.55));
    ctx.closePath();
    ctx.fill();
  }

  function frame(t, dt, { still }) {
    if (!W || !H) resize();
    const introPeak = W < 520 ? 0.32 : 0.48;

    // 平滑推进抽屉弹簧与开场演示动画
    if (!still) {
      if (!state.introDone && !state.dragging) {
        if (t < 0.85) {
          const u = Math.min(1, t / 0.85);
          const ease = 1 - Math.pow(1 - u, 3);
          state.progress = introPeak * ease;
          state.target = introPeak;
          state._onFrameSync?.();
        } else if (t < 1.35) {
          state.progress = introPeak;
          state._onFrameSync?.();
        } else {
          state.introDone = true;
          state.target = 0;
        }
      } else if (!state.dragging) {
        const diff = state.target - state.progress;
        if (Math.abs(diff) > 0.0015) {
          const step = Math.min(1, (dt || 0.016) * 12);
          state.progress += diff * step;
          state._onFrameSync?.();
        } else if (state.progress !== state.target) {
          state.progress = state.target;
          state._onFrameSync?.();
        }
      }
    } else if (!state.introDone) {
      state.introDone = true;
      const stillPeak = W < 520 ? 0.32 : 0.45;
      state.progress = stillPeak;
      state.target = stillPeak;
      state._onFrameSync?.();
    }

    const box = cachedBox || measureBox();
    const { leftOff, rightOff } = allowedRange(state.vw);
    const p = state.progress;
    const xray = state.xray;

    ensureBgCache(box, xray, leftOff, rightOff, state.mode);

    // 1. 一次拷贝离屏静态底图（零逐点重绘）
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bgCanvas, 0, 0);

    // 2. 动态层：框上下裁切延长线 + 进场方向虚线箭头
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const leftW = Math.max(0, box.left);
    const rightW = Math.max(0, W - Math.min(W, box.right));
    const dashFlow = still ? 0 : -(t * 24) % 11;
    const midY = box.top + box.height * 0.5;

    // 宽屏且开透视时绘制指向箭头；Reveal 模式箭头指向主画布被掀出的方向
    if (xray && leftW > 95) {
      if (state.mode === "reveal" && p < -0.05) {
        const ax1 = box.left - 10;
        const ax2 = Math.max(14, box.left - Math.min(leftW * 0.55, 86));
        if (ax1 - ax2 > 18) drawDashedArrow(ax1, midY, ax2, midY, COL.coral, dashFlow);
      } else if (leftOff && state.mode !== "reveal") {
        const stress = Math.max(0, p);
        const ax1 = Math.max(14, box.left - Math.min(leftW * 0.65, 92));
        const ax2 = box.left - 8;
        if (ax2 - ax1 > 18) {
          drawDashedArrow(ax1, midY - 42, ax2, midY - 42, stress > 0.05 ? COL.coral : COL.teal, dashFlow);
        }
      }
    }

    if (xray && rightW > 95) {
      if (state.mode === "reveal" && p > 0.05) {
        const ax1 = box.right + 10;
        const ax2 = Math.min(W - 14, box.right + Math.min(rightW * 0.55, 86));
        if (ax2 - ax1 > 18) drawDashedArrow(ax1, midY, ax2, midY, COL.coral, dashFlow);
      } else if (rightOff && state.mode !== "reveal") {
        const stress = Math.max(0, -p);
        const ax1 = Math.min(W - 14, box.right + Math.min(rightW * 0.65, 92));
        const ax2 = box.right + 8;
        if (ax1 - ax2 > 18) {
          drawDashedArrow(ax1, midY + 42, ax2, midY + 42, stress > 0.05 ? COL.coral : COL.teal, dashFlow);
        }
      }
    }

    // 视口框上方与下方的裁切刀锋延长刻度线（框体中部由 DOM 锐利实线边承接）
    ctx.strokeStyle = Math.abs(p) > 0.05 ? COL.coral : COL.navy;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    ctx.lineDashOffset = 0;
    ctx.beginPath();
    if (box.top > 2) {
      ctx.moveTo(box.left + 0.5, 0);
      ctx.lineTo(box.left + 0.5, box.top - 2);
      ctx.moveTo(box.right - 0.5, 0);
      ctx.lineTo(box.right - 0.5, box.top - 2);
    }
    if (box.bottom < H - 2) {
      ctx.moveTo(box.left + 0.5, box.bottom + 2);
      ctx.lineTo(box.left + 0.5, H);
      ctx.moveTo(box.right - 0.5, box.bottom + 2);
      ctx.lineTo(box.right - 0.5, H);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  resize();
  const runner = loop(host, frame);
  const ro = new ResizeObserver(() => {
    resize();
    runner.draw();
  });
  ro.observe(host);

  return {
    draw: runner.draw,
    resize,
    invalidateBg() {
      measureBox();
      bgKey = "";
    },
  };
}

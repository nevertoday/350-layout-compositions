// 234 固定定位布局 · 2D Canvas 纵深剖面仪 & 水平滚页滑轨渲染器
import { loop, pixelRatio } from "../../lib/stage.js";

const C = {
  bg: "#020F2F",
  grid: "#112747",
  teal: "#157C79",
  tealBright: "#5CA19E",
  tealGlow: "#5EEAD4",
  glass: "rgba(92, 161, 158, 0.16)",
  paper: "#0A1C3A",
  paperEdge: "#3C5778",
  paperCard: "#12294B",
  ink: "#F4F8FA",
  muted: "#9FB7CB",
  danger: "#FF7B6B",
  dangerFill: "rgba(255, 123, 107, 0.22)",
  ok: "#5EEAD4",
  promo: "#214A6B",
  promoStroke: "#6DA9C9",
};

/**
 * 1) 右翼 2D Canvas：Z 轴纵深剖面与滚页纸带监测仪
 *    直观呈现「深海玻璃视口层（Z_fixed）」与「下方穿行的滚动文档纸带（Z_flow）」的相对关系
 */
export function mountDepthCanvas(canvas, getEval) {
  const ctx = canvas.getContext("2d");
  let w = 260;
  let h = 174;
  let smoothScroll = 0;
  let visible = false;

  function dprCap() {
    return pixelRatio(window.innerWidth <= 700 ? 1.5 : 2);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const dpr = dprCap();
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawFrame(t, dt, { still }) {
    const ev = getEval();
    if (!ev) return;
    const targetScroll = ev.scrollY;
    smoothScroll = still ? targetScroll : smoothScroll + (targetScroll - smoothScroll) * Math.min(1, dt * 16 + 0.18);

    const dpr = dprCap();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 蓝图暗底与细网格
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    const step = 22;
    ctx.beginPath();
    for (let x = step; x < w; x += step) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
    }
    for (let y = step; y < h; y += step) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
    }
    ctx.stroke();

    // 侧视 Z 轴标尺（顶部）
    ctx.fillStyle = C.muted;
    ctx.font = '600 11px "Space Grotesk", "Noto Sans SC", sans-serif';
    ctx.textBaseline = "top";
    ctx.fillText("Z 轴侧视剖面", 12, 10);
    ctx.textAlign = "right";
    ctx.fillStyle = ev.pillars.containingBlock.ok ? C.tealGlow : C.danger;
    ctx.fillText(ev.pillars.containingBlock.ok ? "锚定：视口玻璃" : "劫持：随纸带滚走", w - 12, 10);
    ctx.textAlign = "left";

    // 定义剖面几何：左为「滚动纸带轨道」，右为「固定视口玻璃」
    const vpTop = 36;
    const footH = 26;
    const vpH = Math.max(96, h - vpTop - footH - 12);
    const vpBot = vpTop + vpH;
    const paperX = Math.round(w * 0.24);
    const paperW = Math.round(w * 0.25);
    const glassX = Math.round(w * 0.58);
    const glassW = Math.round(w * 0.26);

    // 视口上下边界水平虚线（贯穿纸带与玻璃，清晰看出视口裁切窗口）
    ctx.save();
    ctx.strokeStyle = C.tealBright;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(10, vpTop);
    ctx.lineTo(w - 10, vpTop);
    ctx.moveTo(10, vpBot);
    ctx.lineTo(w - 10, vpBot);
    ctx.stroke();
    ctx.restore();

    // 滚动比例换算
    const scaleY = vpH / ev.dims.h;
    const scrollPx = smoothScroll * scaleY;
    const docTotalH = (ev.dims.h + ev.dims.maxScroll) * scaleY;
    const docStartY = vpTop - scrollPx;

    // 绘制移动的文档纸带（严格裁切在顶部栏与底部读数条之间，永不遮字）
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 26, w, h - 26 - footH);
    ctx.clip();

    // 纸带主体
    ctx.fillStyle = C.paper;
    ctx.strokeStyle = C.paperEdge;
    ctx.lineWidth = 1.2;
    ctx.fillRect(paperX, docStartY, paperW, docTotalH);
    ctx.strokeRect(paperX, docStartY, paperW, docTotalH);

    // 纸带上的 3 张虚线内容卡
    const padTopScaled = ev.docPaddingTop * scaleY;
    const cardYs = [0, 204, 416];
    const cardHs = [152, 160, 148];
    for (let i = 0; i < 3; i++) {
      const cy = docStartY + padTopScaled + cardYs[i] * scaleY;
      const ch = cardHs[i] * scaleY;
      ctx.fillStyle = C.paperCard;
      ctx.fillRect(paperX + 5, cy, paperW - 10, ch);
      ctx.save();
      ctx.strokeStyle = "#486588";
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(paperX + 5, cy, paperW - 10, ch);
      ctx.restore();
      ctx.fillStyle = C.muted;
      ctx.font = '600 10px "Space Grotesk", sans-serif';
      ctx.fillText(`0${i + 1}`, paperX + 9, cy + 5);
    }

    // 正文里的 z-index: 20 凸起卡片（当层叠倒挂时向前突出穿过固定玻璃层！）
    const promoY = docStartY + (ev.docPaddingTop + 178) * scaleY;
    const promoH = 54 * scaleY;
    const protrude = !ev.pillars.stacking.ok ? glassX + glassW - (paperX + paperW) + 6 : 10;
    ctx.fillStyle = !ev.pillars.stacking.ok ? C.dangerFill : "rgba(109, 169, 201, 0.28)";
    ctx.strokeStyle = !ev.pillars.stacking.ok ? C.danger : C.promoStroke;
    ctx.lineWidth = 1.4;
    ctx.fillRect(paperX + 4, promoY, paperW - 8 + protrude, promoH);
    ctx.strokeRect(paperX + 4, promoY, paperW - 8 + protrude, promoH);

    // 纸带左侧流动方向双箭头（呼应 234 原海报右侧 ↑ 滚动内容 ↓）
    const arrowX = Math.max(14, paperX - 16);
    const pulse = still ? 0 : Math.sin(t * 2.4) * 3;
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(arrowX, vpTop + 14 + pulse);
    ctx.lineTo(arrowX, vpTop + vpH * 0.42);
    ctx.moveTo(arrowX - 4, vpTop + 20 + pulse);
    ctx.lineTo(arrowX, vpTop + 14 + pulse);
    ctx.lineTo(arrowX + 4, vpTop + 20 + pulse);

    ctx.moveTo(arrowX, vpBot - 14 - pulse);
    ctx.lineTo(arrowX, vpTop + vpH * 0.58);
    ctx.moveTo(arrowX - 4, vpBot - 20 - pulse);
    ctx.lineTo(arrowX, vpBot - 14 - pulse);
    ctx.lineTo(arrowX + 4, vpBot - 20 - pulse);
    ctx.stroke();

    // 固定视口玻璃框（不动）
    ctx.fillStyle = C.glass;
    ctx.strokeStyle = C.tealBright;
    ctx.lineWidth = 1.6;
    ctx.fillRect(glassX, vpTop, glassW, vpH);
    ctx.strokeRect(glassX, vpTop, glassW, vpH);

    // 固定部件在 Z 平面上的位置：正常锁死在玻璃框上；被 transform 劫持时贴在纸带上随 scrollPx 上滑！
    const fixedAnchorX = ev.pillars.containingBlock.ok ? glassX : paperX + paperW - 8;
    const fixedOffsetY = ev.pillars.containingBlock.ok ? 0 : -scrollPx;
    const fixedFill = ev.pillars.containingBlock.ok ? C.teal : "#9E3530";
    const fixedEdge = ev.pillars.containingBlock.ok ? C.tealGlow : C.danger;

    // 顶栏块
    if (ev.topH > 0) {
      const th = ev.topH * scaleY;
      ctx.fillStyle = fixedFill;
      ctx.strokeStyle = fixedEdge;
      ctx.lineWidth = 1.5;
      ctx.fillRect(fixedAnchorX + 3, vpTop + fixedOffsetY, glassW - 6, th);
      ctx.strokeRect(fixedAnchorX + 3, vpTop + fixedOffsetY, glassW - 6, th);

      // 若首行被顶栏切掉，在顶栏左侧画红警报连接区
      if (ev.firstCardOverlapPx > 0 && ev.pillars.containingBlock.ok) {
        const oh = ev.firstCardOverlapPx * scaleY;
        ctx.fillStyle = C.dangerFill;
        ctx.fillRect(paperX + paperW, vpTop, glassX - (paperX + paperW), Math.max(6, oh));
      }
    }

    // 侧轨块
    if (ev.railW > 0) {
      const rh = Math.min(ev.railH * scaleY, vpH * 0.42);
      const ry = vpTop + vpH * 0.32 + fixedOffsetY;
      ctx.fillStyle = fixedFill;
      ctx.strokeStyle = fixedEdge;
      ctx.fillRect(fixedAnchorX - 4, ry, 10, rh);
      ctx.strokeRect(fixedAnchorX - 4, ry, 10, rh);
    }

    // 底栏块
    if (ev.bottomH > 0) {
      const bh = ev.bottomH * scaleY;
      const by = vpBot - bh + fixedOffsetY;
      ctx.fillStyle = fixedFill;
      ctx.strokeStyle = fixedEdge;
      ctx.fillRect(fixedAnchorX + 3, by, glassW - 6, bh);
      ctx.strokeRect(fixedAnchorX + 3, by, glassW - 6, bh);
    }

    // 悬浮球
    if (ev.fabD > 0) {
      const fr = Math.max(5, (ev.fabD * scaleY) / 2);
      const fx = fixedAnchorX + glassW - 4;
      const fy = vpBot - (ev.bottomH > 0 ? ev.bottomH * scaleY + fr + 5 : fr + 8) + fixedOffsetY;
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fillStyle = fixedFill;
      ctx.fill();
      ctx.strokeStyle = fixedEdge;
      ctx.stroke();
    }

    ctx.restore();

    // 底部独立深蓝读数条（杜绝与滚动纸带任何重叠）
    ctx.fillStyle = "#041432";
    ctx.fillRect(0, h - footH, w, footH);
    ctx.strokeStyle = "#183354";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - footH + 0.5);
    ctx.lineTo(w, h - footH + 0.5);
    ctx.stroke();

    const footY = h - Math.round(footH / 2);
    ctx.font = '600 10px "Space Grotesk", "Noto Sans SC", sans-serif';
    ctx.textBaseline = "middle";
    ctx.fillStyle = C.muted;
    ctx.fillText("文档流", paperX + 2, footY);
    ctx.fillStyle = ev.pillars.containingBlock.ok ? C.tealGlow : C.danger;
    ctx.fillText(ev.pillars.containingBlock.ok ? "视口层" : "脱锚!", glassX + 2, footY);
    ctx.textAlign = "right";
    ctx.fillStyle = C.ink;
    ctx.fillText(`Y ${Math.round(smoothScroll)}px`, w - 10, footY);
    ctx.textAlign = "left";
  }

  resize();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  const handle = loop(canvas, drawFrame);
  return {
    draw: () => { if (visible) handle.draw(); },
    drawForce: () => handle.draw(),
    resize: () => {
      resize();
      handle.draw();
    },
  };
}

/**
 * 2) 视口底沿水平滚页滑轨 Canvas（嵌在 data-perf-drag 轨道内）
 *    拖拽时 60fps 实时重绘：进度槽、3 个锚点刻度、正文 z:20 碰撞预警区与青绿游标
 */
export function mountScrubCanvas(canvas, getEval) {
  const ctx = canvas.getContext("2d");
  let w = 480;
  let h = 44;

  function dprCap() {
    return pixelRatio(window.innerWidth <= 700 ? 1.5 : 2);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const dpr = dprCap();
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    const ev = getEval();
    if (!ev) return;
    const dpr = dprCap();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#061633";
    ctx.fillRect(0, 0, w, h);

    const padX = 22;
    const trackW = Math.max(60, w - padX * 2);
    const trackY = Math.round(h * 0.68);
    const ratio = ev.dims.maxScroll > 0 ? ev.scrollY / ev.dims.maxScroll : 0;

    // 底槽
    ctx.fillStyle = "#122949";
    ctx.beginPath();
    ctx.roundRect(padX, trackY - 4, trackW, 8, 4);
    ctx.fill();

    // 若层叠倒挂，标出正文 z:20 卡片穿过顶栏时的冲突区段
    if (!ev.pillars.stacking.ok && ev.topH > 0) {
      const hitStart = Math.max(0, (ev.docPaddingTop + 178 - ev.topH) / ev.dims.maxScroll);
      const hitEnd = Math.min(1, (ev.docPaddingTop + 232) / ev.dims.maxScroll);
      const hx = padX + hitStart * trackW;
      const hw = Math.max(14, (hitEnd - hitStart) * trackW);
      ctx.fillStyle = "rgba(255, 123, 107, 0.42)";
      ctx.fillRect(hx, trackY - 5, hw, 10);
    }

    // 已滚进度条
    const fillW = Math.max(0, ratio * trackW);
    ctx.fillStyle = ev.pillars.containingBlock.ok ? C.tealBright : C.danger;
    ctx.beginPath();
    ctx.roundRect(padX, trackY - 4, fillW, 8, 4);
    ctx.fill();

    // 三个锚点刻度（标签置于顶排 y=13，永不撞游标）
    const anchors = [
      { label: "#1", y: 0 },
      { label: "#2", y: 204 },
      { label: "#3", y: 416 },
    ];
    ctx.font = '600 10px "Space Grotesk", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    for (const a of anchors) {
      const ar = Math.min(1, a.y / ev.dims.maxScroll);
      const ax = padX + ar * trackW;
      ctx.fillStyle = "#567594";
      ctx.fillRect(ax - 1, trackY - 7, 2, 14);
      ctx.fillStyle = C.muted;
      ctx.fillText(a.label, ax, 14);
    }

    // 拖拽游标把柄
    const knobX = padX + ratio * trackW;
    ctx.fillStyle = ev.pillars.containingBlock.ok ? C.teal : "#B63327";
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(knobX - 16, trackY - 10, 32, 20, 10);
    ctx.fill();
    ctx.stroke();

    // 游标内的刻度竖纹
    ctx.fillStyle = C.ink;
    ctx.fillRect(knobX - 4, trackY - 4, 2, 8);
    ctx.fillRect(knobX - 1, trackY - 4, 2, 8);
    ctx.fillRect(knobX + 2, trackY - 4, 2, 8);
  }

  resize();
  draw();
  return { draw, resize: () => { resize(); draw(); } };
}

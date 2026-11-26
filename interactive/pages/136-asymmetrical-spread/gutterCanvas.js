// 136 非对称跨页 —— 第 03 节深群青暗室：2D Canvas 书脊弯折与跨缝透视模拟器
// 独立于开场玩法：模拟实体书刊摊开时不同装订工艺（胶装紧脊 / 骑马订 / 锁线平摊）
// 对跨缝纯色大弧与跨缝文字条的真实吞噬畸变。

import { loop, pixelRatio } from "../../lib/stage.js";
import { clamp } from "./model.js";

export const BINDINGS = {
  perfect: {
    id: "perfect",
    name: "无线胶装",
    en: "PERFECT BOUND",
    swallowPx: 0.088, // 折弯吞噬半宽比例
    curveDepth: 26,
    note: "书脊胶层僵硬，摊开时中缝向下深陷，靠近书脊约 12–18mm 区域严重弯折收窄，小字跨缝必被吞掉。",
  },
  saddle: {
    id: "saddle",
    name: "杂志骑马订",
    en: "SADDLE STITCH",
    swallowPx: 0.042,
    curveDepth: 11,
    note: "薄刊中缝仅轻度弧拱，大片视觉图跨缝很自然，但文字与人像五官仍应避开订钉折线 6–8mm。",
  },
  layflat: {
    id: "layflat",
    name: "锁线平摊装",
    en: "LAY-FLAT SEWN",
    swallowPx: 0.014,
    curveDepth: 3,
    note: "画册级平摊工艺，中缝几乎零吞噬，是非对称大图大胆跨缝牵引对页的最佳载体。",
  },
};

export function createGutterCanvas(canvas, getState, onStateChange) {
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let dpr = 1;
  let dragging = false;
  let dragStartX = 0;
  let startTextX = 0.5;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = pixelRatio(2);
    w = Math.round(r.width);
    h = Math.round(r.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  function render() {
    if (!w || !h) resize();
    if (!w || !h) return;
    const st = getState();
    const bind = BINDINGS[st.binding] || BINDINGS.perfect;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 深群青暗室底槽
    ctx.fillStyle = "#091538";
    ctx.fillRect(0, 0, w, h);

    const padX = Math.max(16, w * 0.05);
    const padTop = Math.max(20, h * 0.11);
    const sw = w - padX * 2;
    const sh = Math.min(h - padTop - 44, sw * 0.52);
    const sx = padX;
    const sy = padTop;
    const midX = sx + sw * 0.5;
    const swallowW = sw * bind.swallowPx;

    // 1. 书页弯曲轮廓（依据 curveDepth 画出实体开卷顶部与底部书页拱弧）
    const d = bind.curveDepth;
    ctx.fillStyle = "#EFE8DD";
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + sw * 0.36, sy - d * 0.45, midX, sy + d * 0.65);
    ctx.quadraticCurveTo(sx + sw * 0.64, sy - d * 0.45, sx + sw, sy);
    ctx.lineTo(sx + sw, sy + sh);
    ctx.quadraticCurveTo(sx + sw * 0.64, sy + sh - d * 0.45, midX, sy + sh + d * 0.65);
    ctx.quadraticCurveTo(sx + sw * 0.36, sy + sh - d * 0.45, sx, sy + sh);
    ctx.closePath();
    ctx.fill();

    // 裁切至弯曲书页内部
    ctx.save();
    ctx.clip();

    // 跨缝大蓝弧（示范：色块大胆越过中缝，在任何装订下都能无缝过渡）
    const arcReachPx = sx + sw * st.arcCross;
    ctx.fillStyle = "#2250CD";
    ctx.beginPath();
    ctx.ellipse(arcReachPx - sw * 0.48, sy + sh * 0.5, sw * 0.48, sh * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();

    // 可拖动的跨缝正文与标题条（示范：一跨进折弯区就被压缩变暗！）
    const tx = sx + sw * st.textPos;
    const ty = sy + sh * 0.32;
    const tw = sw * 0.34;
    const th = sh * 0.36;

    // 逐字符按距中缝距离模拟真实透视水平压缩
    const titleStr = "非对称跨页装订折弯实测";
    const subStr = "文字跨越装订中缝会在折谷处被挤压吞噬";
    const fontBig = Math.max(12, Math.min(20, Math.round(sw * 0.028)));
    const fontSub = Math.max(10, Math.min(13, Math.round(sw * 0.017)));

    // 浅框标示文字区块
    ctx.fillStyle = "rgba(250, 246, 238, 0.90)";
    ctx.fillRect(tx - 8, ty - 10, tw + 16, th + 12);
    ctx.strokeStyle = "#091928";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(tx - 8, ty - 10, tw + 16, th + 12);

    function drawWarpedText(str, baseX, baseY, fontSize, weight) {
      ctx.font = `${weight} ${fontSize}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      let curX = baseX;
      for (const ch of str) {
        const chW = ctx.measureText(ch).width;
        const center = curX + chW * 0.5;
        const dist = Math.abs(center - midX);
        // 在书脊吞噬区内发生严重水平压缩与沉陷
        const inValley = dist < swallowW;
        const factor = inValley ? 0.32 + 0.68 * (dist / swallowW) : 1;
        const dropY = inValley ? (1 - dist / swallowW) * d * 0.42 : 0;
        ctx.save();
        ctx.translate(curX, baseY + dropY);
        ctx.scale(factor, 1);
        ctx.fillStyle = inValley && bind.id === "perfect" ? "#B5231C" : "#091928";
        ctx.fillText(ch, 0, 0);
        ctx.restore();
        curX += chW * factor + 0.5;
      }
    }

    drawWarpedText(titleStr, tx, ty, fontBig, 800);
    drawWarpedText(subStr, tx, ty + fontBig + 12, fontSub, 500);

    // 中缝书脊折谷立体阴影（越紧的装订阴影越深）
    const shGrad = ctx.createLinearGradient(midX - swallowW * 1.4, 0, midX + swallowW * 1.4, 0);
    const alpha = bind.id === "perfect" ? 0.46 : bind.id === "saddle" ? 0.22 : 0.08;
    shGrad.addColorStop(0, "rgba(9, 25, 40, 0)");
    shGrad.addColorStop(0.45, `rgba(9, 25, 40, ${alpha * 0.7})`);
    shGrad.addColorStop(0.5, `rgba(9, 25, 40, ${alpha})`);
    shGrad.addColorStop(0.56, `rgba(255, 255, 255, ${alpha * 0.45})`);
    shGrad.addColorStop(1, "rgba(9, 25, 40, 0)");
    ctx.fillStyle = shGrad;
    ctx.fillRect(midX - swallowW * 1.4, sy - d, swallowW * 2.8, sh + d * 2);

    // 吞噬警戒带虚线
    if (swallowW > 4) {
      ctx.fillStyle = "rgba(237, 96, 66, 0.14)";
      ctx.fillRect(midX - swallowW, sy - d, swallowW * 2, sh + d * 2);
      ctx.strokeStyle = "#ED6042";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(midX - swallowW, sy - d);
      ctx.lineTo(midX - swallowW, sy + sh + d);
      ctx.moveTo(midX + swallowW, sy - d);
      ctx.lineTo(midX + swallowW, sy + sh + d);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 书脊虚线与黑支点
    ctx.strokeStyle = "#091928";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(midX, sy);
    ctx.lineTo(midX, sy + sh + d);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#091928";
    ctx.beginPath();
    ctx.arc(midX, sy + sh * 0.5, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // end clip

    // 底部标尺说明
    const textLeft = st.textPos;
    const textRight = st.textPos + 0.34;
    const swallowed = textLeft < 0.5 + bind.swallowPx && textRight > 0.5 - bind.swallowPx;
    ctx.font = `600 12px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = swallowed ? "#FF8A70" : "#5EE0AE";
    ctx.fillText(
      swallowed
        ? `⚠ 文字已进入${bind.name}吞噬带（半宽 ${Math.round(bind.swallowPx * 100)}%），拖动文字向右避脊或改锁线平摊`
        : `✓ 文字安全避开${bind.name}中缝折谷，群青色块可自由跨缝牵引对页`,
      midX,
      sy + sh + d * 0.65 + 12
    );

    ctx.restore();
  }

  const runner = loop(canvas, render);

  function startDrag(cx) {
    dragging = true;
    dragStartX = cx;
    startTextX = getState().textPos;
  }
  function moveDrag(cx) {
    if (!dragging) return;
    const r = canvas.getBoundingClientRect();
    const dx = (cx - dragStartX) / Math.max(120, r.width * 0.9);
    const next = clamp(startTextX + dx, 0.14, 0.63);
    onStateChange({ textPos: Number(next.toFixed(3)) });
  }
  function endDrag() {
    dragging = false;
  }

  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0) startDrag(e.clientX);
  });
  window.addEventListener("mousemove", (e) => moveDrag(e.clientX));
  window.addEventListener("mouseup", endDrag);

  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 1) startDrag(e.touches[0].clientX);
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (dragging && e.touches.length === 1) {
        e.preventDefault();
        moveDrag(e.touches[0].clientX);
      }
    },
    { passive: false }
  );
  canvas.addEventListener("touchend", endDrag, { passive: true });

  const ro = new ResizeObserver(() => {
    resize();
    runner.draw();
  });
  ro.observe(canvas);

  return { draw: () => runner.draw() };
}

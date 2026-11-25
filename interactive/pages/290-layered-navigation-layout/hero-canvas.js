// L4 墨绿柜内嵌 2D 层级透视切面与导航占屏拖轨画布（data-perf-drag）
// 读数与几何完全来自 model.js 的单真源评估，无独立写死常量。
import { loop, pixelRatio } from "../../lib/stage.js";
import { clamp, evaluate } from "./model.js";

const PALETTE = {
  bg: "#08291E",
  grid: "rgba(241, 232, 215, 0.08)",
  gridStrong: "rgba(241, 232, 215, 0.16)",
  cream: "#F4ECE0",
  creamSoft: "#C8D6C6",
  vermilion: "#E85D38",
  apricot: "#F59B73",
  rust: "#AD2D11",
  sand: "#D6CFB4",
  espresso: "#2B2010",
  sage: "#7BE0B5",
  crimson: "#FF7D6B",
};

function chamferRect(ctx, x, y, w, h, cut = 8) {
  const c = Math.min(cut, w * 0.25, h * 0.45);
  ctx.beginPath();
  ctx.moveTo(x + c, y);
  ctx.lineTo(x + w - c, y);
  ctx.lineTo(x + w, y + c);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + c);
  ctx.closePath();
}

export function mountHeroCanvas(canvas, getState, onScrubDepth) {
  const ctx = canvas.getContext("2d");
  let cw = 520;
  let ch = 260;
  let dragging = false;
  let railGeom = { x: 24, y: 220, w: 472, h: 24 };
  let introDone = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = pixelRatio(2);
    const nw = Math.round(rect.width * dpr);
    const nh = Math.round(rect.height * dpr);
    if (canvas.width !== nw || canvas.height !== nh) {
      canvas.width = nw;
      canvas.height = nh;
    }
    cw = rect.width;
    ch = rect.height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();

  function render(t, _dt, { still }) {
    if (!cw || !ch) resize();
    const state = getState();
    const ev = evaluate(state, 720);
    const ease = still ? 1 : clamp(t / 0.85, 0, 1);
    const intro = 1 - Math.pow(1 - ease, 3);
    if (ease >= 1) introDone = true;

    const compact = cw < 380;
    const tightH = ch < 190;
    const padX = compact ? 12 : 16;
    const topY = tightH ? 20 : compact ? 24 : 28;
    const railH = tightH ? 28 : compact ? 38 : 42;
    const bodyH = Math.max(76, ch - topY - railH - (tightH ? 8 : 12));

    // 1. 深墨绿建筑切面底板 + 细标尺网格
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, cw, ch);

    ctx.strokeStyle = PALETTE.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const step = compact ? 24 : 28;
    for (let x = padX; x < cw - padX; x += step) {
      ctx.moveTo(x + 0.5, topY);
      ctx.lineTo(x + 0.5, topY + bodyH);
    }
    for (let y = topY; y <= topY + bodyH; y += step) {
      ctx.moveTo(padX, y + 0.5);
      ctx.lineTo(cw - padX, y + 0.5);
    }
    ctx.stroke();

    // 顶眉小标
    ctx.font = `700 ${compact ? 10 : 11}px "Space Mono", monospace`;
    ctx.fillStyle = PALETTE.creamSoft;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("CROSS-SECTION · 层级切面与视口占位", padX, topY * 0.52);

    ctx.textAlign = "right";
    ctx.fillStyle = ev.allOk ? PALETTE.sage : PALETTE.apricot;
    ctx.fillText(
      `导航 ${ev.chromePct}% · 正文 ${ev.contentPct}%`,
      cw - padX,
      topY * 0.52
    );

    // 2. 左区：实绘 2.5D 分层档案叠层切面（层序、高度、显隐 100% 源自 evaluate()）
    const leftW = Math.round((cw - padX * 2) * (compact ? 0.62 : 0.65));
    const rightX = padX + leftW + (compact ? 10 : 16);
    const rightW = cw - padX - rightX;

    const visLayers = ev.layers.filter((l) => l.visible);
    // 加上 L6 正文底座块，构成完整纵向切片
    const totalUnits = visLayers.length + 1;
    const availH = bodyH - 8;
    const maxStackH = Math.min(availH, totalUnits * 30 + 28);
    const startY = topY + Math.max(4, (availH - maxStackH) * 0.35);

    // 按真实 pixelHeight 折算切面块厚度（短屏自动等比收紧，绝不压到下方滑轨）
    const sumNavPx = Math.max(1, ev.chromePx);
    const gap = tightH ? 2 : visLayers.length >= 5 ? 3 : 5;
    const l6MinH = tightH ? 18 : 26;
    const maxNavRegion = Math.max(36, availH - l6MinH - 4);
    const navBandMax = Math.min(maxNavRegion, availH * clamp(ev.chromePct / 100, 0.24, 0.72));
    const usableNavH = Math.max(24, navBandMax - gap * visLayers.length);

    let curY = tightH ? topY + 2 : startY;
    const centers = [];

    visLayers.forEach((layer, idx) => {
      const share = layer.heightPx / sumNavPx;
      const minSlab = tightH ? 10 : compact ? 15 : 17;
      const slabH = Math.max(minSlab, Math.min(tightH ? 18 : 32, usableNavH * share));
      if (curY + slabH > topY + bodyH - l6MinH - 2) return;
      const slide = (1 - intro) * (18 + idx * 6);
      const inset = idx * (compact ? 3 : 4);
      const x = padX + inset + slide;
      const w = Math.max(80, leftW - inset * 2 - 4);
      const y = curY;

      // 判定该层是否有错
      const layerBad =
        (layer.id === "L5" && state.order === "inverted") ||
        (layer.id === "L3" && state.order === "swapped") ||
        (layer.id === "L1" && (state.crumbMode !== "location" || state.weightMode === "inverted")) ||
        (layer.id === "L2" && (ev.prof.zone === "flat" || state.orientMode !== "single")) ||
        layer.role === "extra";

      chamferRect(ctx, x, y, w, slabH, 6);
      ctx.fillStyle = layer.color;
      ctx.fill();

      ctx.strokeStyle = layerBad ? PALETTE.crimson : "rgba(244, 236, 224, 0.38)";
      ctx.lineWidth = layerBad ? 1.6 : 1;
      ctx.stroke();

      // 层标文字（对比度按底色自适配）
      const lightBg = layer.color === "#E6DCC8" || layer.color === "#D6CFB4" || layer.color === "#C9B99B";
      ctx.fillStyle = lightBg ? "#1B1914" : "#F4ECE0";
      ctx.font = `700 ${compact ? 10 : 11}px "Space Mono", "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const label = compact ? `${layer.id} ${layer.name.slice(0, 2)}` : `${layer.id} ${layer.name}`;
      ctx.fillText(label, x + 9, y + slabH * 0.52);

      // 右侧显示真实像素高与节点高亮圆点
      const dotX = x + w - (compact ? 16 : 56);
      const dotY = y + slabH * 0.5;
      centers.push({ x: dotX, y: dotY, bad: layerBad, id: layer.id });

      if (state.orientMode === "single" && layer.role !== "extra") {
        ctx.fillStyle = lightBg ? "#0D3B2B" : PALETTE.cream;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (state.orientMode === "double" && (layer.id === "L2" || layer.id === "L3")) {
        ctx.fillStyle = PALETTE.crimson;
        ctx.beginPath();
        ctx.arc(dotX - 7, dotY, 3.3, 0, Math.PI * 2);
        ctx.arc(dotX + 3, dotY, 3.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (state.orientMode === "none" && layer.role !== "extra") {
        ctx.strokeStyle = lightBg ? "rgba(27,25,20,0.45)" : "rgba(244,236,224,0.45)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3.4, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (!compact) {
        ctx.fillStyle = lightBg ? "#3B3429" : "rgba(244,236,224,0.84)";
        ctx.font = `400 10px "Space Mono", monospace`;
        ctx.textAlign = "right";
        ctx.fillText(`${layer.heightPx}px`, x + w - 9, y + slabH * 0.52);
      }

      curY += slabH + gap;
    });

    // L6 正文内容块（剩多少空间就画多高）
    const l6Y = curY + 2;
    const l6H = Math.max(l6MinH, topY + bodyH - l6Y - 2);
    const l6X = padX + 4;
    const l6W = leftW - 8;
    chamferRect(ctx, l6X, l6Y, l6W, l6H, 6);
    ctx.fillStyle = PALETTE.espresso;
    ctx.fill();
    ctx.strokeStyle = ev.chromePct > 36 ? PALETTE.crimson : "rgba(214, 207, 180, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = PALETTE.cream;
    ctx.font = `700 ${compact ? 10 : 11}px "Space Mono", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `L6 正文区 · ${ev.contentPct}%${ev.chromePct > 36 ? "（偏挤）" : ""}`,
      l6X + 10,
      l6Y + Math.min(l6H * 0.5, 16)
    );
    centers.push({ x: l6X + l6W - (compact ? 16 : 56), y: l6Y + Math.min(l6H * 0.5, 16), bad: false, id: "L6" });

    // 路径导引光线（自上而下贯通，错序时折返虚线警示）
    if (centers.length >= 2) {
      ctx.save();
      ctx.strokeStyle = ev.allOk ? PALETTE.sage : PALETTE.crimson;
      ctx.lineWidth = 1.6;
      if (!ev.allOk) ctx.setLineDash([4, 3]);
      ctx.beginPath();
      centers.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // 沿路径向下流动的轻量定位脉冲点（极低绘制开销，60fps 稳跑）
      if (!still) {
        const seg = (t * 0.55) % 1;
        const fIdx = seg * (centers.length - 1);
        const i0 = Math.floor(fIdx);
        const i1 = Math.min(centers.length - 1, i0 + 1);
        const frac = fIdx - i0;
        const px = centers[i0].x + (centers[i1].x - centers[i0].x) * frac;
        const py = centers[i0].y + (centers[i1].y - centers[i0].y) * frac;
        ctx.fillStyle = ev.allOk ? PALETTE.sage : PALETTE.apricot;
        ctx.beginPath();
        ctx.arc(px, py, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. 右区：720px 首屏视口占位柱（导航 Chrome vs 正文 Content + 36% 经验参考线）
    const barX = rightX;
    const barY = topY + 6;
    const barH = bodyH - 12;
    const barW = Math.max(54, rightW);

    ctx.fillStyle = "rgba(11, 61, 37, 0.65)";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = PALETTE.gridStrong;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);

    // 逐层堆叠导航占比
    let segY = barY;
    for (const layer of visLayers) {
      const sh = Math.max(2, (layer.heightPx / 720) * barH);
      ctx.fillStyle = layer.color;
      ctx.fillRect(barX + 1, segY, barW - 2, Math.min(sh, barY + barH - segY));
      segY += sh;
    }
    // 正文剩余区
    const remY = Math.min(segY, barY + barH - 2);
    ctx.fillStyle = "rgba(43, 32, 16, 0.88)";
    ctx.fillRect(barX + 1, remY, barW - 2, Math.max(0, barY + barH - remY - 1));

    // 36% 经验上限警戒线 + 高对比暗底胶囊标签（绝不糊在浅色条上）
    const capY = Math.round(barY + barH * 0.36) + 0.5;
    ctx.strokeStyle = ev.chromePct > 36 ? PALETTE.crimson : PALETTE.sage;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(barX - 4, capY);
    ctx.lineTo(barX + barW + 4, capY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 柱内读数
    ctx.font = `700 ${compact ? 10 : 11}px "Space Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = PALETTE.cream;
    if (barY + barH - remY > 24) {
      ctx.fillText(`正文 ${ev.contentPct}%`, barX + barW * 0.5, remY + (barY + barH - remY) * 0.5);
    }

    const capTag = "≤36% 经验线";
    ctx.font = `700 10px "Space Mono", "Noto Sans SC", sans-serif`;
    const tagW = Math.min(barW - 6, compact ? 74 : 84);
    const tagH = 16;
    const tagX = barX + barW - tagW - 3;
    const tagY = Math.max(barY + 2, capY - tagH - 3);
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(tagX, tagY, tagW, tagH);
    ctx.strokeStyle = ev.chromePct > 36 ? PALETTE.crimson : PALETTE.sage;
    ctx.lineWidth = 1;
    ctx.strokeRect(tagX + 0.5, tagY + 0.5, tagW - 1, tagH - 1);
    ctx.fillStyle = ev.chromePct > 36 ? PALETTE.crimson : PALETTE.sage;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(capTag, tagX + tagW * 0.5, tagY + tagH * 0.52);

    // 4. 底部交互宽深滑轨（直接标出过扁 / 轻量解 / 原海报解 / 过深压屏四区）
    const ry = topY + bodyH + (tightH ? 8 : 14);
    const rx = padX;
    const rw = cw - padX * 2;
    const rh = tightH ? 10 : 14;
    railGeom = { x: rx, y: ry - 6, w: rw, h: rh + 20 };

    const zones = [
      { a: 0, b: 0.24, c: "rgba(255, 125, 107, 0.42)", tag: "过扁" },
      { a: 0.24, b: 0.46, c: "rgba(123, 224, 181, 0.34)", tag: "2层解" },
      { a: 0.46, b: 0.72, c: "rgba(123, 224, 181, 0.54)", tag: "3层解" },
      { a: 0.72, b: 1, c: "rgba(255, 125, 107, 0.42)", tag: "过深" },
    ];
    for (const z of zones) {
      const zx = rx + z.a * rw;
      const zw = (z.b - z.a) * rw;
      ctx.fillStyle = z.c;
      ctx.fillRect(zx, ry, zw - 1, rh);
      ctx.fillStyle = PALETTE.creamSoft;
      ctx.font = `400 ${tightH || compact ? 10 : 11}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(z.tag, zx + zw * 0.5, ry + rh + (tightH ? 2 : 4));
    }

    // 游标菱形切角把手
    const thumbX = rx + clamp(state.depthSpan, 0, 1) * rw;
    const thumbY = ry + rh * 0.5;
    ctx.fillStyle = ev.prof.zone === "flat" || ev.prof.zone === "deep" ? PALETTE.vermilion : PALETTE.cream;
    ctx.strokeStyle = PALETTE.bg;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(thumbX, thumbY - 10);
    ctx.lineTo(thumbX + 9, thumbY);
    ctx.lineTo(thumbX, thumbY + 10);
    ctx.lineTo(thumbX - 9, thumbY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 拖动提示角标
    if (!introDone || dragging) {
      ctx.fillStyle = PALETTE.cream;
      ctx.font = `700 10px "Space Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`${ev.prof.navTierCount}L`, thumbX, ry - 4);
    }
  }

  const ctrl = loop(canvas, render);

  // 指针 + 触摸横向拖动（允许纵向正常滚屏）
  function valueFromClientX(clientX) {
    const rect = canvas.getBoundingClientRect();
    const rel = (clientX - rect.left - railGeom.x) / Math.max(1, railGeom.w);
    return clamp(rel, 0.02, 0.98);
  }

  let pointerStart = null;
  let dragLocked = false;

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    pointerStart = { x: e.clientX, y: e.clientY, id: e.pointerId };
    dragLocked = e.pointerType !== "touch";
    if (dragLocked) {
      dragging = true;
      canvas.setPointerCapture?.(e.pointerId);
      onScrubDepth(valueFromClientX(e.clientX));
    }
  }

  function onPointerMove(e) {
    if (!pointerStart || e.pointerId !== pointerStart.id) return;
    const dx = Math.abs(e.clientX - pointerStart.x);
    const dy = Math.abs(e.clientY - pointerStart.y);
    if (!dragLocked) {
      if (dx > 6 && dx >= dy) {
        dragLocked = true;
        dragging = true;
        canvas.setPointerCapture?.(e.pointerId);
      } else if (dy > 10 && dy > dx) {
        pointerStart = null;
        return;
      } else {
        return;
      }
    }
    e.preventDefault();
    onScrubDepth(valueFromClientX(e.clientX));
  }

  function onPointerUp(e) {
    if (pointerStart && e.pointerId === pointerStart.id) {
      if (!dragLocked && Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) < 10) {
        onScrubDepth(valueFromClientX(e.clientX));
      }
      pointerStart = null;
      dragLocked = false;
      dragging = false;
      ctrl.draw();
    }
  }

  // 兼容 perf.mjs 的纯 touch 事件派发（CDP dispatchTouchEvent）
  let touchStart = null;
  canvas.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    if (!t) return;
    touchStart = { x: t.clientX, y: t.clientY, locked: false };
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    if (!t || !touchStart) return;
    const dx = Math.abs(t.clientX - touchStart.x);
    const dy = Math.abs(t.clientY - touchStart.y);
    if (!touchStart.locked) {
      if (dx >= 4 && dx >= dy * 0.8) touchStart.locked = true;
      else if (dy > 12) { touchStart = null; return; }
      else return;
    }
    dragging = true;
    onScrubDepth(valueFromClientX(t.clientX));
  }, { passive: true });

  canvas.addEventListener("touchend", () => {
    touchStart = null;
    dragging = false;
    ctrl.draw();
  }, { passive: true });

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  // 键盘无障碍左右微调
  canvas.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.12 : 0.04;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onScrubDepth(clamp(getState().depthSpan - step, 0.02, 0.98));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onScrubDepth(clamp(getState().depthSpan + step, 0.02, 0.98));
    }
  });

  return {
    draw: () => ctrl.draw(),
    destroy: () => ro.disconnect(),
  };
}

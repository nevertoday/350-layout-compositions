// 开场主角：068 原海报对角纵深 2D Canvas 舞台
// 与 model.js 共享同一套实绘坐标 (u, v) 与半径 r，支持原海报圆列 / 林荫树道 / 斯帕达柱廊三题材与视线锥 X 光剖视。

import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";
import { clamp } from "./model.js";

function drawArrowHead(ctx, x, y, angle, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(-size, -size * 0.58);
  ctx.lineTo(0, 0);
  ctx.lineTo(-size, size * 0.58);
  ctx.stroke();
  ctx.restore();
}

// 绘制单枚元素：按当前题材切换原海报圆 / 林荫树 / 斯帕达立柱
function drawElement(ctx, item, cx, cy, rad, theme, isRev, isSel, reveal) {
  const r = Math.max(1.5, rad * reveal);
  ctx.save();

  if (theme === "poster") {
    // 1:1 复刻 068 原海报深橄榄实心圆（加极轻米纸描边，扁平错态轻碰时依然颗粒清晰）
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = isRev ? PALETTE.err : PALETTE.olive;
    ctx.fill();
    ctx.strokeStyle = PALETTE.paper;
    ctx.lineWidth = r > 12 ? 1.5 : 0.8;
    ctx.stroke();

    if (isSel && !isRev) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  } else if (theme === "avenue") {
    // 霍贝玛《米德尔哈尼斯大道》极简平面风行道桤木（以同一半径 r 决定冠幅与树高）
    const trunkH = r * 1.45;
    const trunkW = Math.max(1.4, r * 0.16);
    const groundY = cy + r * 0.85;
    // 地面柔影
    ctx.fillStyle = "rgba(89, 92, 29, 0.18)";
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.12, groundY, r * 0.62, Math.max(1.5, r * 0.16), 0, 0, Math.PI * 2);
    ctx.fill();
    // 树干
    ctx.fillStyle = isRev ? PALETTE.err : PALETTE.ink;
    ctx.fillRect(cx - trunkW / 2, groundY - trunkH, trunkW, trunkH);
    // 树冠（双圆叠出修剪桤木轮廓）
    ctx.fillStyle = isRev ? PALETTE.err : PALETTE.olive;
    ctx.beginPath();
    ctx.arc(cx, groundY - trunkH * 0.92, r * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isRev ? "#C94D3B" : "#767B33";
    ctx.beginPath();
    ctx.arc(cx - r * 0.22, groundY - trunkH * 1.05, r * 0.44, 0, Math.PI * 2);
    ctx.fill();

    if (isSel && !isRev) {
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(cx - r * 0.85, groundY - trunkH * 1.65, r * 1.7, trunkH * 1.75);
      ctx.setLineDash([]);
    }
  } else {
    // 博罗米尼 1653 斯帕达宫柱廊立柱（同一半径 r 决定柱高与柱径）
    const colH = r * 2.05;
    const colW = Math.max(3, r * 0.52);
    const topY = cy - colH * 0.5;
    const botY = cy + colH * 0.5;
    // 阴影
    ctx.fillStyle = "rgba(89, 92, 29, 0.15)";
    ctx.beginPath();
    ctx.ellipse(cx + colW * 0.2, botY, colW * 0.9, Math.max(1.5, colW * 0.22), 0, 0, Math.PI * 2);
    ctx.fill();
    // 柱身
    ctx.fillStyle = isRev ? PALETTE.err : PALETTE.olive;
    ctx.fillRect(cx - colW / 2, topY + colW * 0.25, colW, colH - colW * 0.5);
    // 亮面竖槽
    ctx.fillStyle = isRev ? "#D65C4A" : "#7D8337";
    ctx.fillRect(cx - colW * 0.28, topY + colW * 0.3, colW * 0.22, colH - colW * 0.6);
    // 柱头与柱础
    ctx.fillStyle = isRev ? "#872013" : PALETTE.oliveDeep;
    ctx.fillRect(cx - colW * 0.72, topY, colW * 1.44, Math.max(2, colW * 0.28));
    ctx.fillRect(cx - colW * 0.75, botY - Math.max(2, colW * 0.28), colW * 1.5, Math.max(2, colW * 0.28));

    if (isSel && !isRev) {
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(cx - colW * 0.95, topY - 4, colW * 1.9, colH + 8);
      ctx.setLineDash([]);
    }
  }

  // 反弹破序圆的醒目赤赭警示环与直点标签
  if (isRev) {
    const ringR = Math.max(r + 8, 16);
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = PALETTE.err;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

export function createHeroStage(canvas, callbacks) {
  const ctx = canvas.getContext("2d");
  let currentState = null;
  let currentEval = null;
  let cssW = 720;
  let cssH = 420;
  let animItems = []; // 平滑插值中的几何点，拖动时即时跟手、切方案时丝滑过渡
  let dirty = true;
  let introDone = false;
  let renderedCircles = []; // 用于精准点击命中测试

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    cssW = rect.width;
    cssH = rect.height;
    const dpr = pixelRatio(2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      dirty = true;
    }
  }

  function setModel(state, evalRes, instant = false) {
    currentState = state;
    currentEval = evalRes;
    const target = evalRes.items;
    if (instant || animItems.length !== target.length) {
      animItems = target.map((it) => ({ u: it.u, v: it.v, r: it.r }));
    }
    dirty = true;
  }

  function renderFrame(t, dt, { still }) {
    resize();
    if (!currentState || !currentEval) return;

    const target = currentEval.items;
    const revSet = new Set(currentEval.layout.reversals.map((x) => x.index));

    // 开场前 0.85 秒做温和的由近及远生长揭示；still 或开场完毕后直接 1.0
    const introProgress = still ? 1 : clamp(t / 0.82, 0, 1);
    if (introProgress >= 1) introDone = true;

    // 坐标平滑插值
    let moving = !introDone;
    const blend = still ? 1 : clamp(dt > 0 ? 1 - Math.exp(-dt * 18) : 1, 0.25, 1);
    if (animItems.length !== target.length) {
      animItems = target.map((it) => ({ u: it.u, v: it.v, r: it.r }));
    } else {
      for (let i = 0; i < target.length; i++) {
        const a = animItems[i];
        const b = target[i];
        const du = b.u - a.u;
        const dv = b.v - a.v;
        const dr = b.r - a.r;
        if (Math.abs(du) > 0.0004 || Math.abs(dv) > 0.0004 || Math.abs(dr) > 0.0003) {
          a.u += du * blend;
          a.v += dv * blend;
          a.r += dr * blend;
          moving = true;
        } else {
          a.u = b.u;
          a.v = b.v;
          a.r = b.r;
        }
      }
    }

    if (!dirty && !moving) return;
    dirty = false;

    const dpr = canvas.width / Math.max(1, cssW);
    ctx.save();
    ctx.scale(dpr, dpr);

    const w = cssW;
    const h = cssH;
    const shortSide = Math.min(w, h);
    const compact = w < 440;

    // 1. 原海报暖燕麦纸底
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    // 2. 极轻建筑底格与题材背景氛围
    ctx.strokeStyle = "rgba(101, 106, 40, 0.085)";
    ctx.lineWidth = 1;
    const gridStep = Math.max(36, Math.round(shortSide / 8));
    ctx.beginPath();
    for (let x = gridStep; x < w; x += gridStep) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
    }
    for (let y = gridStep; y < h; y += gridStep) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
    }
    ctx.stroke();

    // 若为林荫树道或斯帕达柱廊，添加极克制的远方地平线/走廊收束轮廓
    if (currentState.theme === "avenue") {
      const vpX = w * 0.935;
      const vpY = h * 0.145;
      // 淡卡其道路带
      ctx.fillStyle = "rgba(228, 224, 192, 0.72)";
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(w * 0.34, h);
      ctx.lineTo(vpX + 8, vpY + 6);
      ctx.lineTo(vpX - 8, vpY - 2);
      ctx.closePath();
      ctx.fill();
      // 远村极简教堂尖塔剪影
      ctx.fillStyle = PALETTE.oliveDeep;
      ctx.beginPath();
      ctx.moveTo(vpX, vpY - 22);
      ctx.lineTo(vpX - 6, vpY + 4);
      ctx.lineTo(vpX + 6, vpY + 4);
      ctx.closePath();
      ctx.fill();
    } else if (currentState.theme === "spada") {
      const vpX = w * 0.935;
      const vpY = h * 0.14;
      // 淡黄透视廊底与天花斜线
      ctx.strokeStyle = "rgba(101, 106, 40, 0.22)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.96);
      ctx.lineTo(vpX, vpY + 12);
      ctx.moveTo(0, h * 0.25);
      ctx.lineTo(vpX, vpY - 12);
      ctx.stroke();
      // 尽头极简无五官雕像几何剪影
      ctx.fillStyle = PALETTE.oliveDeep;
      ctx.fillRect(vpX - 4, vpY + 1, 8, 12);
      ctx.beginPath();
      ctx.arc(vpX, vpY - 3, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. 计算实绘像素坐标（正圆严格以 shortSide * r 算，杜绝任何屏幕下压成椭圆！）
    const pts = animItems.map((it, i) => ({
      index: i,
      x: it.u * w,
      y: it.v * h,
      r: it.r * shortSide,
      meta: target[i],
    }));
    renderedCircles = pts;

    // 4. 视线锥包络线（用户打开「视线锥透视」时叠加视觉金字塔上下切线）
    if (currentState.showCone && pts.length >= 2) {
      ctx.save();
      const topPts = [];
      const botPts = [];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const prev = pts[Math.max(0, i - 1)];
        const next = pts[Math.min(pts.length - 1, i + 1)];
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        // 垂直于前进方向的法向量
        const nx = -dy / len;
        const ny = dx / len;
        topPts.push({ x: p.x + nx * p.r, y: p.y + ny * p.r });
        botPts.push({ x: p.x - nx * p.r, y: p.y - ny * p.r });
      }
      // 柔和填充视觉金字塔锥体
      ctx.fillStyle = currentEval.allOk ? "rgba(27, 102, 68, 0.08)" : "rgba(168, 46, 30, 0.07)";
      ctx.beginPath();
      topPts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      for (let i = botPts.length - 1; i >= 0; i--) ctx.lineTo(botPts[i].x, botPts[i].y);
      ctx.closePath();
      ctx.fill();

      // 绘制包络边界线（反弹区段自动标赤赭红）
      for (let i = 0; i < pts.length - 1; i++) {
        const segBad = revSet.has(i + 1) || currentState.pathMode === "derailed";
        ctx.strokeStyle = segBad ? PALETTE.err : PALETTE.oliveDeep;
        ctx.lineWidth = segBad ? 2 : 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(topPts[i].x, topPts[i].y);
        ctx.lineTo(topPts[i + 1].x, topPts[i + 1].y);
        ctx.moveTo(botPts[i].x, botPts[i].y);
        ctx.lineTo(botPts[i + 1].x, botPts[i + 1].y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 5. 复刻原海报右下方标志性虚线弯曲引导箭头（沿着中后段圆列右下腹地顺滑指向远端）
    if (pts.length >= 3) {
      const startIdx = Math.min(2, pts.length - 2);
      const arrowPts = [];
      for (let i = startIdx; i < pts.length; i++) {
        const p = pts[i];
        const prev = pts[Math.max(0, i - 1)];
        const next = pts[Math.min(pts.length - 1, i + 1)];
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        // 偏移到路径右下方（法向量取正 y 方向）
        let nx = -dy / len;
        let ny = dx / len;
        if (ny < 0) { nx = -nx; ny = -ny; }
        const offset = p.r + (compact ? 14 : 20);
        arrowPts.push({ x: p.x + nx * offset, y: p.y + ny * offset });
      }
      if (arrowPts.length >= 2) {
        const visibleCount = Math.max(2, Math.ceil(arrowPts.length * introProgress));
        ctx.save();
        ctx.strokeStyle = currentState.pathMode === "derailed" ? PALETTE.err : PALETTE.oliveDeep;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(arrowPts[0].x, arrowPts[0].y);
        for (let i = 1; i < visibleCount; i++) {
          ctx.lineTo(arrowPts[i].x, arrowPts[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        const last = arrowPts[visibleCount - 1];
        const prev = arrowPts[visibleCount - 2];
        const ang = Math.atan2(last.y - prev.y, last.x - prev.x);
        drawArrowHead(ctx, last.x, last.y, ang, compact ? 8 : 10);
        ctx.restore();
      }
    }

    // 6. 由远及近或由近及远绘制全部递减元素（从远画到近，前景大圆自然压阵）
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      const stagger = clamp((introProgress - i * 0.045) / 0.55, 0, 1);
      const ease = 1 - Math.pow(1 - stagger, 3);
      const rev = revSet.has(i);
      const sel = currentState.selected === i;
      drawElement(ctx, p.meta, p.x, p.y, p.r, currentState.theme, rev, sel, Math.max(0.05, ease));
    }

    // 7. 为选中圆或反弹圆画精准实测标签（清晰不遮主体）
    for (const rev of currentEval.layout.reversals) {
      const p = pts[rev.index];
      if (!p) continue;
      const pillText = `#${rev.index + 1} 反弹 +${rev.jumpPct}% · 点此修补`;
      ctx.save();
      ctx.font = `600 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(pillText).width + 16;
      const th = compact ? 24 : 26;
      const bx = clamp(p.x - tw / 2, 8, w - tw - 8);
      const by = clamp(p.y - p.r - th - 14, 8, h - th - 8);
      ctx.fillStyle = PALETTE.err;
      ctx.beginPath();
      ctx.roundRect(bx, by, tw, th, 5);
      ctx.fill();
      ctx.fillStyle = "#FAF6EC";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(pillText, bx + tw / 2, by + th / 2 + 0.5);
      ctx.restore();
    }

    // 开启「视线锥透视」时在每隔 2 枚元素上方标出反推视距与比例刻度
    if (currentState.showCone) {
      ctx.save();
      ctx.font = `500 ${compact ? 10 : 11}px "DM Mono", monospace`;
      ctx.textAlign = "center";
      for (let i = 0; i < pts.length; i += compact ? 3 : 2) {
        const p = pts[i];
        const tag = `${p.meta.label} · ${p.meta.depth.toFixed(1)}×`;
        const ty = clamp(p.y - p.r - 10, 16, h - 10);
        const tx = clamp(p.x, 38, w - 38);
        ctx.fillStyle = PALETTE.paperLight;
        const tw = ctx.measureText(tag).width + 10;
        ctx.fillRect(tx - tw / 2, ty - 9, tw, 18);
        ctx.fillStyle = PALETTE.ink;
        ctx.fillText(tag, tx, ty + 3);
      }
      ctx.restore();
    }

    // 8. 复刻原海报中右下腹地的浅黄圆形「↗ 视觉动线」实况徽标（桌面及平板完整呈现，极窄屏自动精简避让）
    if (w >= 460) {
      const bx = w * 0.72;
      const by = h * 0.73;
      ctx.save();
      ctx.beginPath();
      ctx.arc(bx, by, 20, 0, Math.PI * 2);
      ctx.fillStyle = currentEval.allOk ? PALETTE.yellowCard : PALETTE.yellowBadge;
      ctx.fill();
      // 徽内右上斜箭
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx - 6, by + 6);
      ctx.lineTo(bx + 6, by - 6);
      ctx.stroke();
      drawArrowHead(ctx, bx + 6, by - 6, -Math.PI / 4, 6);

      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 13px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("视觉动线", bx + 28, by - 16);
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.font = `400 11.5px "Noto Sans SC", sans-serif`;
      const sub1 = currentEval.allOk ? "由大向小，自然引向远方" : "当前尺度或动线受阻";
      const sub2 = `首尾跨比 ${currentEval.metrics.spanRatio.toFixed(1)}× · ${currentEval.metrics.count} 级`;
      ctx.fillText(sub1, bx + 28, by + 2);
      ctx.fillText(sub2, bx + 28, by + 18);
      ctx.restore();
    }

    // 9. 左上轻标：当前首尾跨比与模式一目了然
    ctx.save();
    const chip = `${currentEval.metrics.count} 级 · 跨比 ${currentEval.metrics.spanRatio.toFixed(1)}× · ${currentEval.passedCount}/4`;
    ctx.font = `500 ${compact ? 11 : 12}px "DM Mono", monospace`;
    const cw = ctx.measureText(chip).width + 18;
    const ch = 26;
    ctx.fillStyle = currentEval.allOk ? PALETTE.okSoft : PALETTE.paperLight;
    ctx.strokeStyle = currentEval.allOk ? PALETTE.ok : PALETTE.oliveLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(12, 12, cw, ch, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = currentEval.allOk ? PALETTE.ok : PALETTE.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(chip, 21, 12 + ch / 2 + 0.5);
    ctx.restore();

    ctx.restore();
  }

  const ctrl = loop(canvas, renderFrame);

  // 点击命中测试 + 水平微拖调衰减比（竖向留给页面正常滚动）
  let dragStart = null;
  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    dragStart = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      localX: e.clientX - rect.left,
      localY: e.clientY - rect.top,
      startRatio: currentState ? currentState.ratio : 0.75,
      dragging: false,
    };
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragStart || e.pointerId !== dragStart.id) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (!dragStart.dragging) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        dragStart.dragging = true;
        try { canvas.setPointerCapture(e.pointerId); } catch {}
      } else {
        return;
      }
    }
    const rect = canvas.getBoundingClientRect();
    const deltaRatio = (dx / Math.max(180, rect.width)) * 0.55;
    callbacks.onRatioChange(clamp(dragStart.startRatio + deltaRatio, 0.42, 0.97), true);
  });

  function endPointer(e) {
    if (!dragStart || e.pointerId !== dragStart.id) return;
    const wasDragging = dragStart.dragging;
    const lx = dragStart.localX;
    const ly = dragStart.localY;
    dragStart = null;
    if (wasDragging) return;

    // 命中测试：按距离最近且在容差内选中对应元素
    let hit = -1;
    let bestD = Infinity;
    for (let i = renderedCircles.length - 1; i >= 0; i--) {
      const c = renderedCircles[i];
      const d = Math.hypot(lx - c.x, ly - c.y);
      const tol = Math.max(c.r + 10, 22);
      if (d <= tol && d < bestD) {
        bestD = d;
        hit = c.index;
      }
    }
    if (hit >= 0) callbacks.onCircleClick(hit);
  }

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", () => { dragStart = null; });

  // 键盘操作画布：←→ 调衰减比，↑↓ 调选中圆，[ / ] 切换选中圆
  canvas.addEventListener("keydown", (e) => {
    if (!currentState) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      callbacks.onRatioChange(clamp(currentState.ratio - 0.02, 0.42, 0.97), false);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      callbacks.onRatioChange(clamp(currentState.ratio + 0.02, 0.42, 0.97), false);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      callbacks.onNudgeSelected(0.12);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      callbacks.onNudgeSelected(-0.12);
    } else if (e.key === "[") {
      e.preventDefault();
      callbacks.onSelect((currentState.selected - 1 + currentState.count) % currentState.count);
    } else if (e.key === "]") {
      e.preventDefault();
      callbacks.onSelect((currentState.selected + 1) % currentState.count);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callbacks.onCircleClick(currentState.selected);
    }
  });

  window.addEventListener("resize", () => {
    dirty = true;
    ctrl.draw();
  });

  return {
    update(state, evalRes, instant = false) {
      setModel(state, evalRes, instant);
      ctrl.draw();
    },
    getAspect() {
      const r = canvas.getBoundingClientRect();
      return r.height > 0 ? r.width / r.height : 1.65;
    },
  };
}

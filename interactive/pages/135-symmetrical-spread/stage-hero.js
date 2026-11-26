// 135 对称跨页 · 开场 2D Canvas 对开书卷镜像与对折验镜舞台
// 严格遵循 lib/stage.js 的 loop() 与 pixelRatio()，全屏等比（绝不压扁圆形），支持触屏横拖不阻滚动。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE, clamp, computeSpread } from "./model.js";

export function mountHeroStage(canvas, getState, updateState) {
  const ctx = canvas.getContext("2d");

  // 顺滑弹簧态（用于对折验镜、入场与归位过渡；减少动态效果下直接跳终点）
  let animFold = 0;
  let animTilt = 0;
  let intro = 0.72; // 从 0.72 开始，确保 0 秒到 0.9 秒的每一帧都清晰完整
  let cssW = 900;
  let cssH = 490;
  let dpr = 1;
  let dirty = true;
  let isDragging = false;
  let hoverTarget = "";

  // 最近一次坐标变换（用于把指针命中映射回当前逻辑坐标）
  const xform = { scale: 1, ox: 0, oy: 0, compact: false, W: 1040, H: 492, pageW: 458 };

  // 离屏静态书底缓存（四角记号 + 书页叠厚 + 双页纸面弧谷 + 左页 Verso）：拖动右页时直接 drawImage 复用，大幅减轻软件渲染开销
  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");
  let bgKey = "";

  function ensureStaticLayer(res, curve, pageFill, inkColor, isCream) {
    const key = `${canvas.width}x${canvas.height}|${res.spec.id}|${res.bind.id}|${Math.round(curve * 10)}`;
    if (bgKey === key) return;
    bgKey = key;
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;
    bgCtx.save();
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgCtx.fillStyle = PALETTE.obsidian;
    bgCtx.fillRect(0, 0, cssW, cssH);
    bgCtx.translate(xform.ox, xform.oy);
    bgCtx.scale(xform.scale, xform.scale);
    drawCornerMarks(bgCtx, res.geom);
    drawBookThickness(bgCtx, res.geom, isCream);
    drawOpenBookBody(bgCtx, res.geom, curve, pageFill, inkColor, isCream, res.bind.shadowAlpha);
    drawPageParts(bgCtx, res.geom.versoParts, isCream, false, 1);
    bgCtx.restore();
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    cssW = Math.round(r.width);
    cssH = Math.round(r.height);
    // 手机窄屏限制 DPR 至 1.5（GUIDE.md 性能准则），软件渲染像素填充量直降 44% 且依然锐利
    dpr = pixelRatio(cssW <= 540 ? 1.5 : 2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    const compact = cssW < 540 && cssH > cssW * 0.72;
    xform.compact = compact;
    xform.W = compact ? 740 : 1040;
    xform.H = compact ? 630 : 492;
    xform.pageW = compact ? 336 : 458;
    // 严格等比缩放（min），保证所有圆在 390×844 / 844×390 / 2560×1440 下都是绝对正圆！
    const padX = compact ? 4 : 10;
    const padY = compact ? 4 : 6;
    const sx = (cssW - padX * 2) / xform.W;
    const sy = (cssH - padY * 2) / xform.H;
    xform.scale = Math.min(sx, sy);
    xform.ox = (cssW - xform.W * xform.scale) * 0.5;
    xform.oy = (cssH - xform.H * xform.scale) * 0.5;
    dirty = true;
  }

  function clientToLogic(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left - xform.ox) / xform.scale,
      y: (clientY - r.top - xform.oy) / xform.scale,
    };
  }

  function renderFrame(t, dt, { still }) {
    const st = getState();
    const res = computeSpread(st, { compact: xform.compact });
    const targetFold = st.foldOpen ? 1 : 0;
    const targetTilt = res.metrics.beamTiltDeg;

    if (still || reducedMotion.matches) {
      intro = 1;
      animFold = targetFold;
      animTilt = targetTilt;
    } else {
      const kIntro = dt > 0 ? Math.min(1, dt * 4.2) : 0;
      if (intro < 1) {
        intro = Math.min(1, intro + (1 - intro) * kIntro + dt * 0.35);
        dirty = true;
      }
      const step = dt > 0 ? Math.min(1, dt * 7.5) : 0;
      if (Math.abs(animFold - targetFold) > 0.002) {
        animFold += (targetFold - animFold) * step;
        dirty = true;
      } else {
        animFold = targetFold;
      }
      if (Math.abs(animTilt - targetTilt) > 0.05) {
        animTilt += (targetTilt - animTilt) * step;
        dirty = true;
      } else {
        animTilt = targetTilt;
      }
    }

    if (!dirty && intro >= 1 && animFold === targetFold && Math.abs(animTilt - targetTilt) <= 0.05) return;
    dirty = false;

    const { geom, spec, bind, metrics, diagnosis } = res;
    const isCream = spec.theme === "cream";
    const pageFill = isCream ? PALETTE.pageCream : PALETTE.pageDark;
    const inkColor = isCream ? "#151918" : PALETTE.ivory;
    const subInk = isCream ? "#5C584D" : PALETTE.ivoryMuted;
    const curve = bind.valleyDepth * intro;

    // 1–4 & 左页静态层：命中离屏缓存后仅 1 次 drawImage 完成铺底
    ensureStaticLayer(res, curve, pageFill, inkColor, isCream);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bgCanvas, 0, 0);

    // 进入统一等比逻辑坐标系
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(xform.ox, xform.oy);
    ctx.scale(xform.scale, xform.scale);

    // 5. 边距虚线框与跨缝基线辅助线
    if (st.guides) {
      drawGuides(ctx, geom, res, isCream);
    }

    // 6. 装订中缝弯折阴影带（若右页侵入则标珊瑚警示斜纹）
    drawGutterZone(ctx, geom, res, isCream);

    // 7. 绘制右页（Recto）真实单真源构件（左页已烘焙进静态层）
    drawPageParts(ctx, geom.rectoParts, isCream, true, 1);

    // 8. 胶装吞噬区局部叠影（让被吃掉的部分真的暗下去）
    drawSpineCreaseOverlay(ctx, geom, bind.shadowAlpha, isCream);

    // 9. 「对折验镜」三维余弦折叠叠印层（点中轴 ○ 或空格键触发）
    if (animFold > 0.004) {
      drawFoldProofOverlay(ctx, geom, res, animFold, isCream);
    }

    // 10. 1:1 复刻原海报贯通中轴线 + 空心圆节点 ○ + 可点击「对折验镜」中轴徽章
    drawSpineAxis(ctx, geom, st.foldOpen, animFold, diagnosis.ok, hoverTarget === "spine");

    // 11. 底部页码、装订实测标注与动态光学天平（就在书脊正下方）
    drawBottomBalanceAndLabels(ctx, geom, res, animTilt, isCream, inkColor, subInk);

    // 12. 画布内紧凑交互提示（右页把手标尺）
    drawInteractiveHandles(ctx, geom, res, hoverTarget, isDragging);

    ctx.restore();
  }

  const runner = loop(canvas, renderFrame);

  function markDirty(immediate = false) {
    dirty = true;
    // 减少动态效果或明确需要同步首帧时立刻画；平时交给 loop() 的 rAF 每帧合批只画一次，杜绝拖动双画
    if (immediate || reducedMotion.matches) runner.draw();
  }

  // ---------- 绘制子程序（合批路径以降低 draw calls，确保软件渲染同样 50–60fps） ----------

  function drawCornerMarks(c, g) {
    const corners = [
      { x: 14, y: 14, dir: 1 },
      { x: g.W - 14, y: 14, dir: -1 },
      { x: 14, y: g.H - 14, dir: 1 },
      { x: g.W - 14, y: g.H - 14, dir: -1 },
    ];
    c.fillStyle = PALETTE.ivory;
    c.beginPath();
    for (const pt of corners) {
      for (let i = 0; i < 3; i++) {
        const cx = pt.x + pt.dir * i * 8;
        c.moveTo(cx + 2, pt.y);
        c.arc(cx, pt.y, 2, 0, Math.PI * 2);
      }
    }
    c.fill();

    c.fillStyle = PALETTE.rose;
    c.beginPath();
    for (const pt of corners) {
      const cx = pt.x + pt.dir * 7;
      const cy = pt.y + (pt.y < g.H * 0.5 ? 20 : -20);
      c.moveTo(cx + 5.6, cy);
      c.arc(cx, cy, 5.6, 0, Math.PI * 2);
    }
    c.fill();
  }

  function drawBookThickness(c, g, isCream) {
    c.strokeStyle = isCream ? "rgba(239,230,210,0.68)" : "rgba(239,230,210,0.34)";
    c.lineWidth = 1;
    c.beginPath();
    for (let i = 3; i >= 1; i--) {
      const off = i * 4.5;
      c.moveTo(g.leftEdge - off, g.bookTop + 6 + i * 1.5);
      c.lineTo(g.leftEdge - off, g.bookBottom + i * 2.5);
      c.lineTo(g.spineX - 8, g.bookBottom + i * 2.5);
      c.moveTo(g.rightEdge + off, g.bookTop + 6 + i * 1.5);
      c.lineTo(g.rightEdge + off, g.bookBottom + i * 2.5);
      c.lineTo(g.spineX + 8, g.bookBottom + i * 2.5);
    }
    c.stroke();
  }

  function drawOpenBookBody(c, g, curve, pageFill, inkColor, isCream, shadowAlpha) {
    const { leftEdge, rightEdge, spineX, bookTop, bookBottom } = g;

    // 构建带装订脊弯折的双页轮廓路径
    function traceSpreadPath() {
      c.beginPath();
      c.moveTo(leftEdge, bookTop);
      // 左页上沿向中轴轻微弓起后跌入书脊
      c.bezierCurveTo(
        spineX - 115,
        bookTop - curve * 0.28,
        spineX - 38,
        bookTop + curve * 0.25,
        spineX,
        bookTop + curve
      );
      // 右页上沿从中轴弓起回外沿
      c.bezierCurveTo(
        spineX + 38,
        bookTop + curve * 0.25,
        spineX + 115,
        bookTop - curve * 0.28,
        rightEdge,
        bookTop
      );
      c.lineTo(rightEdge, bookBottom);
      // 底部复刻 135 原海报标志性的 ╭─╯╰─╮ 书脊开卷弧
      c.bezierCurveTo(
        spineX + 115,
        bookBottom - curve * 0.22,
        spineX + 36,
        bookBottom + curve * 0.22,
        spineX,
        bookBottom + curve * 0.92
      );
      c.bezierCurveTo(
        spineX - 36,
        bookBottom + curve * 0.22,
        spineX - 115,
        bookBottom - curve * 0.22,
        leftEdge,
        bookBottom
      );
      c.closePath();
    }

    traceSpreadPath();
    c.fillStyle = pageFill;
    c.fill();

    // 纸面微妙光照梯度（书页起拱高光）
    const sheen = c.createLinearGradient(leftEdge, 0, rightEdge, 0);
    if (isCream) {
      sheen.addColorStop(0, "rgba(20,16,10,0.06)");
      sheen.addColorStop(0.24, "rgba(255,255,255,0.22)");
      sheen.addColorStop(0.45, "rgba(255,255,255,0.06)");
      sheen.addColorStop(0.5, `rgba(18,14,10,${(shadowAlpha * 0.42).toFixed(2)})`);
      sheen.addColorStop(0.55, "rgba(255,255,255,0.06)");
      sheen.addColorStop(0.76, "rgba(255,255,255,0.22)");
      sheen.addColorStop(1, "rgba(20,16,10,0.06)");
    } else {
      sheen.addColorStop(0, "rgba(255,255,255,0.01)");
      sheen.addColorStop(0.24, "rgba(239,230,210,0.045)");
      sheen.addColorStop(0.44, "rgba(239,230,210,0.015)");
      sheen.addColorStop(0.5, "rgba(0,0,0,0.85)");
      sheen.addColorStop(0.56, "rgba(239,230,210,0.015)");
      sheen.addColorStop(0.76, "rgba(239,230,210,0.045)");
      sheen.addColorStop(1, "rgba(255,255,255,0.01)");
    }
    traceSpreadPath();
    c.fillStyle = sheen;
    c.fill();

    // 清晰暖骨象牙外轮廓线
    traceSpreadPath();
    c.strokeStyle = isCream ? "rgba(18,22,20,0.38)" : "rgba(239,230,210,0.58)";
    c.lineWidth = 1.4;
    c.stroke();

    // 复刻 135 原海报底部标志性「书页承托水平框线」
    c.save();
    c.strokeStyle = "rgba(239,230,210,0.44)";
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(leftEdge + 120, bookBottom + 16);
    c.lineTo(rightEdge - 120, bookBottom + 16);
    c.stroke();
    c.restore();
  }

  function drawGuides(c, g, res, isCream) {
    const { versoBox, rectoBox, spineX, leftEdge, rightEdge } = g;
    const guideStroke = isCream ? "rgba(10,101,84,0.28)" : "rgba(239,230,210,0.20)";

    c.save();
    c.setLineDash([4, 4]);
    c.lineWidth = 1;
    c.strokeStyle = guideStroke;
    c.strokeRect(versoBox.x, versoBox.y, versoBox.w, versoBox.h);

    // 右页版芯框：偏移或错牙时以珊瑚色提示
    const boxWarn = !res.pillars.axis.ok || !res.pillars.order.ok;
    c.strokeStyle = boxWarn ? "rgba(242,72,106,0.58)" : "rgba(57,198,168,0.45)";
    c.strokeRect(rectoBox.x, rectoBox.y, rectoBox.w, rectoBox.h);

    // 跨缝水平基准线（穿过左页中心基线延伸到右页，错牙一目了然）
    const baseLineY = versoBox.y + versoBox.h * 0.56;
    c.strokeStyle = Math.abs(res.state.deltaY) > 5 ? "rgba(242,72,106,0.68)" : "rgba(57,198,168,0.52)";
    c.setLineDash([6, 4]);
    c.beginPath();
    c.moveTo(leftEdge + 14, baseLineY);
    c.lineTo(rightEdge - 14, baseLineY);
    c.stroke();

    if (Math.abs(res.state.deltaY) > 5) {
      const rLineY = rectoBox.y + rectoBox.h * 0.56;
      c.strokeStyle = PALETTE.roseBright;
      c.setLineDash([2, 3]);
      c.beginPath();
      c.moveTo(spineX + 12, rLineY);
      c.lineTo(rightEdge - 14, rLineY);
      c.stroke();

      // 错牙 ΔY 标尺
      const mx = rightEdge - 46;
      c.setLineDash([]);
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(mx, baseLineY);
      c.lineTo(mx, rLineY);
      c.stroke();
      c.fillStyle = PALETTE.rose;
      c.fillRect(mx - 34, (baseLineY + rLineY) * 0.5 - 11, 68, 22);
      c.fillStyle = "#FFFFFF";
      c.font = '700 11px "Space Mono", monospace';
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(`ΔY ${res.state.deltaY > 0 ? "+" : ""}${Math.round(res.state.deltaY)}`, mx, (baseLineY + rLineY) * 0.5);
    }
    c.restore();
  }

  function drawGutterZone(c, g, res, isCream) {
    const { spineX, bookTop, bookBottom, gutterBandPx } = g;
    const swallow = res.metrics.gutterIntrusionMm > 0.1;

    c.save();
    // 两侧装订弯折危险区
    const zoneFill = swallow
      ? "rgba(242, 72, 106, 0.18)"
      : isCream
      ? "rgba(10, 101, 84, 0.08)"
      : "rgba(52, 184, 157, 0.08)";
    c.fillStyle = zoneFill;
    c.fillRect(spineX - gutterBandPx, bookTop + 14, gutterBandPx * 2, bookBottom - bookTop - 16);

    // 斜纹警示（单路径合批绘制，零额外 clip 与循环 stroke 开销）
    if (swallow) {
      const yTop = bookTop + 16;
      const yBot = bookBottom - 2;
      c.strokeStyle = "rgba(255, 111, 140, 0.34)";
      c.lineWidth = 1.2;
      c.beginPath();
      for (let y = yTop; y < yBot; y += 16) {
        const dy = Math.min(gutterBandPx * 0.85, yBot - y);
        const dx = dy / 0.85;
        c.moveTo(spineX, y);
        c.lineTo(spineX + Math.min(gutterBandPx, dx), y + dy);
      }
      c.stroke();
    }
    c.restore();

    // 装订危险边界细虚线
    c.save();
    c.setLineDash([3, 4]);
    c.lineWidth = 1;
    c.strokeStyle = swallow ? "rgba(255,111,140,0.75)" : "rgba(239,230,210,0.28)";
    c.beginPath();
    c.moveTo(spineX - gutterBandPx, bookTop + 14);
    c.lineTo(spineX - gutterBandPx, bookBottom - 4);
    c.moveTo(spineX + gutterBandPx, bookTop + 14);
    c.lineTo(spineX + gutterBandPx, bookBottom - 4);
    c.stroke();
    c.restore();
  }

  function drawPageParts(c, parts, isCream, isRecto, alpha) {
    c.save();
    c.globalAlpha = alpha;
    const lineStroke = isCream ? "rgba(22,26,24,0.52)" : "rgba(239,230,210,0.68)";
    const arcStroke = isCream ? "#151918" : PALETTE.ivory;

    for (const p of parts) {
      if (p.kind === "rect") {
        c.fillStyle = p.color;
        c.fillRect(p.x, p.y, p.w, p.h);
        // 微弱细框提升质感
        c.strokeStyle = isCream ? "rgba(10,60,50,0.22)" : "rgba(239,230,210,0.18)";
        c.lineWidth = 1;
        c.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
      } else if (p.kind === "semi") {
        c.beginPath();
        if (p.dir === "right") {
          c.arc(p.x, p.y, p.r, -Math.PI * 0.5, Math.PI * 0.5, false);
        } else {
          c.arc(p.x, p.y, p.r, Math.PI * 0.5, -Math.PI * 0.5, false);
        }
        c.closePath();
        c.fillStyle = p.color;
        c.fill();

        // 1:1 复刻原海报：只沿半圆弧线勾勒暖骨象牙细边
        c.beginPath();
        if (p.dir === "right") {
          c.arc(p.x, p.y, p.r, -Math.PI * 0.5, Math.PI * 0.5, false);
        } else {
          c.arc(p.x, p.y, p.r, Math.PI * 0.5, -Math.PI * 0.5, false);
        }
        c.strokeStyle = arcStroke;
        c.lineWidth = 1.6;
        c.stroke();
      } else if (p.kind === "disc") {
        // 1:1 复刻原海报：珊瑚玫红主圆 + 轻微错位暖骨象牙细环
        c.beginPath();
        c.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
        c.fillStyle = p.color;
        c.fill();

        c.beginPath();
        c.arc(p.cx + p.haloDx, p.cy, p.r, 0, Math.PI * 2);
        c.strokeStyle = arcStroke;
        c.lineWidth = 1.5;
        c.stroke();
      } else if (p.kind === "lines") {
        c.strokeStyle = lineStroke;
        c.lineWidth = 1.35;
        const n = Math.max(2, p.count);
        const gap = p.h / Math.max(1, n - 1);
        c.beginPath();
        for (let i = 0; i < n; i++) {
          const ly = p.y + i * gap;
          const lw = i === n - 1 ? p.w * 0.72 : p.w;
          c.moveTo(p.x, ly);
          c.lineTo(p.x + lw, ly);
        }
        c.stroke();
      }
    }
    c.restore();
  }

  function drawSpineCreaseOverlay(c, g, shadowAlpha, isCream) {
    const { spineX, bookTop, bookBottom, gutterBandPx } = g;
    const w = Math.max(26, gutterBandPx * 1.15);
    const grad = c.createLinearGradient(spineX - w, 0, spineX + w, 0);
    const dark = isCream ? "12, 10, 8" : "0, 0, 0";
    grad.addColorStop(0, `rgba(${dark}, 0)`);
    grad.addColorStop(0.38, `rgba(${dark}, ${(shadowAlpha * 0.35).toFixed(2)})`);
    grad.addColorStop(0.5, `rgba(${dark}, ${(shadowAlpha * 0.85).toFixed(2)})`);
    grad.addColorStop(0.62, `rgba(${dark}, ${(shadowAlpha * 0.35).toFixed(2)})`);
    grad.addColorStop(1, `rgba(${dark}, 0)`);
    c.fillStyle = grad;
    c.fillRect(spineX - w, bookTop + 4, w * 2, bookBottom - bookTop + 14);
  }

  function drawFoldProofOverlay(c, g, res, fold, isCream) {
    // 沿 spineX 做真实余弦透视折叠：fold 0→1，scaleX 从 1 → 0 → -1（左页映到右页）
    const cosA = Math.cos(fold * Math.PI);
    const sinA = Math.sin(fold * Math.PI);

    // 折叠纸片在右页上投下的柔影
    if (sinA > 0.04) {
      const shadW = g.pageW * 0.55 * sinA;
      const sg = c.createLinearGradient(g.spineX, 0, g.spineX + shadW, 0);
      sg.addColorStop(0, `rgba(0,0,0,${(0.45 * sinA).toFixed(2)})`);
      sg.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = sg;
      c.fillRect(g.spineX, g.bookTop + 6, shadW, g.pageH - 4);
    }

    c.save();
    c.translate(g.spineX, 0);
    c.scale(cosA, 1);
    c.translate(-g.spineX, 0);

    // 半透明硫酸纸页（便于透过看下面右页重合情况）
    c.fillStyle = isCream ? "rgba(10,101,84,0.12)" : "rgba(57,198,168,0.10)";
    c.fillRect(g.leftEdge, g.bookTop + 4, g.pageW, g.pageH - 6);
    c.strokeStyle = PALETTE.emeraldBright;
    c.lineWidth = 1.6;
    c.strokeRect(g.leftEdge, g.bookTop + 4, g.pageW, g.pageH - 6);

    // 绘制被折过来的左页轮廓印迹（线框高对比，极易分辨是否完全套准）
    c.strokeStyle = res.state.mode === "translation" ? PALETTE.roseBright : PALETTE.emeraldBright;
    c.lineWidth = 2.2;
    c.setLineDash([6, 4]);
    for (const p of g.versoParts) {
      if (p.kind === "rect") {
        c.strokeRect(p.x, p.y, p.w, p.h);
      } else if (p.kind === "semi") {
        c.beginPath();
        c.arc(p.x, p.y, p.r, -Math.PI * 0.5, Math.PI * 0.5, false);
        c.closePath();
        c.stroke();
      } else if (p.kind === "disc") {
        c.beginPath();
        c.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
        c.stroke();
      }
    }
    c.restore();

    // 对折到位后，在右页顶部打出清晰套准印章
    if (fold > 0.82) {
      const ok = res.state.mode !== "translation" && res.metrics.mirrorFitPct >= 86;
      const pillText =
        res.state.mode === "translation"
          ? "× 对折错位：平移复制无法套准"
          : res.state.mode === "counterweight"
          ? `✓ 异形同框 · 边线吻合 ${res.metrics.mirrorFitPct}%`
          : ok
          ? `✓ 镜像吻合 ${res.metrics.mirrorFitPct}%`
          : `× 偏位错牙 · 吻合仅 ${res.metrics.mirrorFitPct}%`;

      c.save();
      const bx = g.spineX + g.pageW * 0.5;
      const by = g.bookTop + 34;
      c.font = '700 13px "Noto Serif SC", serif';
      const tw = c.measureText(pillText).width + 28;
      c.fillStyle = ok ? PALETTE.emeraldDeep : "#5A1223";
      c.fillRect(bx - tw * 0.5, by - 15, tw, 30);
      c.strokeStyle = ok ? PALETTE.ok : PALETTE.roseBright;
      c.lineWidth = 1.4;
      c.strokeRect(bx - tw * 0.5, by - 15, tw, 30);
      c.fillStyle = "#FFF9EE";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(pillText, bx, by + 1);
      c.restore();
    }
  }

  function drawSpineAxis(c, g, foldOpen, animFold, allOk, hovered) {
    const { spineX, bookTop, bookBottom } = g;
    c.save();

    // 顶部实线 → 空心圆 ○ → 中间虚线 → 底部空心圆 ○（1:1 复刻原海报中轴符号）
    c.strokeStyle = PALETTE.ivory;
    c.lineWidth = 1.25;
    c.beginPath();
    c.moveTo(spineX, 4);
    c.lineTo(spineX, bookTop + 26);
    c.stroke();

    c.setLineDash([4, 4]);
    c.strokeStyle = "rgba(239,230,210,0.68)";
    c.beginPath();
    c.moveTo(spineX, bookTop + 38);
    c.lineTo(spineX, bookBottom - 10);
    c.stroke();
    c.setLineDash([]);

    // 顶/底两个原海报标志性空心圆环 ○
    for (const cy of [bookTop + 32, bookBottom + 16]) {
      c.beginPath();
      c.arc(spineX, cy, 5.2, 0, Math.PI * 2);
      c.fillStyle = PALETTE.obsidian;
      c.fill();
      c.strokeStyle = PALETTE.ivory;
      c.lineWidth = 1.5;
      c.stroke();
    }

    // 中央可点击「对折验镜」徽章
    const my = (bookTop + bookBottom) * 0.5 - 12;
    const r = hovered ? 21 : 18.5;
    c.beginPath();
    c.arc(spineX, my, r, 0, Math.PI * 2);
    c.fillStyle = foldOpen ? PALETTE.emerald : hovered ? "#1D2422" : PALETTE.obsidian;
    c.fill();
    c.strokeStyle = foldOpen ? PALETTE.ok : allOk ? PALETTE.ivory : PALETTE.roseBright;
    c.lineWidth = 1.8;
    c.stroke();

    // 折叠双箭头图符
    c.fillStyle = PALETTE.ivoryBright;
    c.font = '700 11px "Space Grotesk", sans-serif';
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(foldOpen ? "摊平" : "对折", spineX, my + 0.5);

    c.restore();
  }

  function drawBottomBalanceAndLabels(c, g, res, tiltDeg, isCream, inkColor, subInk) {
    const { leftEdge, rightEdge, spineX, bookTop, bookBottom } = g;
    const { metrics, spec, bind } = res;

    // 顶部角标：左页与右页名称留在纸面外角平直区；装订安全线标尺独立置于书顶上方净空，绝不与书脊弧线相撞
    c.save();
    c.font = '600 11px "Space Mono", "Noto Serif SC", monospace';
    c.fillStyle = subInk;
    c.textAlign = "left";
    c.textBaseline = "top";
    c.fillText(xform.compact ? "左页 VERSO" : spec.leftLabel, leftEdge + 16, bookTop + 10);
    c.textAlign = "right";
    c.fillText(xform.compact ? "右页 RECTO" : spec.rightLabel, rightEdge - 16, bookTop + 10);

    // 装订安全线数字标注（置于书页上沿净空胶囊，高对比且完全避开书脊弯折曲线）
    const isSwallow = metrics.gutterIntrusionMm > 0.1;
    const gutterTag = xform.compact
      ? `订口 ${metrics.rectoInnerMm.toFixed(1)}mm / 限 ${metrics.safeInnerMm.toFixed(0)}mm`
      : `订口 ${metrics.rectoInnerMm.toFixed(1)}mm / ${bind.label}安全线 ${metrics.safeInnerMm.toFixed(0)}mm`;
    c.font = '700 11px "Space Mono", "Noto Serif SC", monospace';
    const tagW = c.measureText(gutterTag).width + 16;
    const tagX = spineX + 14;
    const tagY = 6;
    c.fillStyle = isSwallow ? "#2A0C14" : "#082922";
    c.fillRect(tagX, tagY, tagW, 20);
    c.strokeStyle = isSwallow ? PALETTE.roseBright : PALETTE.ok;
    c.lineWidth = 1;
    c.strokeRect(tagX, tagY, tagW, 20);
    c.fillStyle = isSwallow ? "#FFD6DF" : "#D9FFF5";
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.fillText(gutterTag, tagX + 8, tagY + 10.5);

    // 底部书脊正下方：光学天平平衡杆（留足 ±14° 满倾角净空，任意视口绝不裁切 L/R 读数）
    const fulcY = bookBottom + (xform.compact ? 40 : 36);
    const halfLen = xform.compact ? 108 : 104;
    const rad = (tiltDeg * Math.PI) / 180;
    const lx = spineX - Math.cos(rad) * halfLen;
    const ly = fulcY - Math.sin(rad) * halfLen;
    const rx = spineX + Math.cos(rad) * halfLen;
    const ry = fulcY + Math.sin(rad) * halfLen;

    const balanced = res.pillars.balance.ok;
    c.strokeStyle = balanced ? PALETTE.ok : PALETTE.roseBright;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(lx, ly);
    c.lineTo(rx, ry);
    c.stroke();

    // 天平两端秤点
    for (const [px, py] of [[lx, ly], [rx, ry]]) {
      c.beginPath();
      c.arc(px, py, 4, 0, Math.PI * 2);
      c.fillStyle = balanced ? PALETTE.ok : PALETTE.roseBright;
      c.fill();
    }

    // 支点三角
    c.beginPath();
    c.moveTo(spineX, fulcY + 1);
    c.lineTo(spineX - 7, fulcY + 12);
    c.lineTo(spineX + 7, fulcY + 12);
    c.closePath();
    c.fillStyle = PALETTE.ivory;
    c.fill();

    // 天平文字读数（居中底部）
    c.font = '700 11px "Space Mono", monospace';
    c.fillStyle = PALETTE.ivory;
    c.textAlign = "right";
    c.textBaseline = "middle";
    c.fillText("L 1.00×", lx - 10, ly);
    c.textAlign = "left";
    c.fillStyle = balanced ? PALETTE.ok : PALETTE.roseBright;
    c.fillText(`R ${metrics.massRatio.toFixed(2)}×`, rx + 10, ry);

    // 外切边距微标
    c.font = '400 11px "Space Mono", monospace';
    c.fillStyle = PALETTE.ivoryMuted;
    c.textAlign = "left";
    c.fillText(`外切 ${spec.baseOuterPct.toFixed(1)}%`, leftEdge, fulcY + 2);
    c.textAlign = "right";
    c.fillStyle = metrics.rectoOuterPct < 3.6 ? PALETTE.roseBright : PALETTE.ivoryMuted;
    c.fillText(`外切 ${Math.max(0, metrics.rectoOuterPct).toFixed(1)}%`, rightEdge, fulcY + 2);
    c.restore();
  }

  function drawInteractiveHandles(c, g, res, hover, dragging) {
    // 右页内侧推拉双箭标尺（标明可直接横拖）
    const hx = g.rectoBox.x;
    const hy = g.bookBottom - 26;
    c.save();
    c.fillStyle = dragging ? PALETTE.emerald : hover === "recto" ? "#1E2624" : "rgba(18,22,21,0.92)";
    c.strokeStyle = res.pillars.axis.ok ? PALETTE.ok : PALETTE.roseBright;
    c.lineWidth = 1.4;
    const label = "↔ 横拖调订口";
    c.font = '600 11px "Noto Serif SC", serif';
    const w = c.measureText(label).width + 18;
    const bx = clamp(hx - w * 0.3, g.spineX + 12, g.rightEdge - w - 8);
    c.fillRect(bx, hy - 12, w, 24);
    c.strokeRect(bx, hy - 12, w, 24);
    c.fillStyle = PALETTE.ivoryBright;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(label, bx + w * 0.5, hy + 0.5);

    // 若右页玫红圆失重，在圆心打一条紧凑提示
    const rDisc = g.rectoParts.find((p) => p.kind === "disc");
    if (rDisc && !res.pillars.balance.ok) {
      const tip = "点圆调量级";
      c.font = '700 11px "Noto Serif SC", serif';
      c.fillStyle = "#FFFFFF";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(tip, rDisc.cx, rDisc.cy);
    }
    c.restore();
  }

  // ---------- 指针、触摸与键盘交互（触屏只截横拖，绝不拦截竖向滚动） ----------

  let dragStart = null;
  let touchAxis = null; // 'h' | 'v' | null

  function hitTest(pt) {
    const res = computeSpread(getState(), { compact: xform.compact });
    const { geom } = res;
    const my = (geom.bookTop + geom.bookBottom) * 0.5 - 12;
    if (Math.hypot(pt.x - geom.spineX, pt.y - my) <= 30) return "spine";
    const rDisc = geom.rectoParts.find((p) => p.kind === "disc");
    if (rDisc && Math.hypot(pt.x - rDisc.cx, pt.y - rDisc.cy) <= rDisc.r + 8) return "disc";
    if (pt.x >= geom.spineX - 24 && pt.x <= geom.rightEdge + 24) return "recto";
    return "spread";
  }

  // 鼠标事件
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触摸走专用 touch 分支以保页面竖滑顺畅
    const pt = clientToLogic(e.clientX, e.clientY);
    const hit = hitTest(pt);
    const st = getState();
    dragStart = {
      x: e.clientX,
      y: e.clientY,
      pt,
      hit,
      moved: false,
      shift0: st.rectoShift,
      dy0: st.deltaY,
      pointerId: e.pointerId,
    };
    isDragging = true;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const pt = clientToLogic(e.clientX, e.clientY);
    if (!dragStart) {
      const nextHover = hitTest(pt);
      if (nextHover !== hoverTarget) {
        hoverTarget = nextHover;
        canvas.style.cursor =
          nextHover === "spine" || nextHover === "disc" ? "pointer" : "ew-resize";
        markDirty();
      }
      return;
    }
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.hypot(dx, dy) > 4) dragStart.moved = true;
    if (!dragStart.moved) return;

    const logicDx = dx / xform.scale;
    const logicDy = dy / xform.scale;
    // 横向改变右页订口偏置（靠近 0 轻吸附）
    let nextShift = clamp(dragStart.shift0 + (logicDx / xform.pageW) * 100, -10.5, 11.5);
    if (Math.abs(nextShift) < 0.45) nextShift = 0;

    const patch = { rectoShift: +nextShift.toFixed(2) };
    // 若在右页做明显纵向拖动，则顺手校准跨缝基线差 ΔY
    if (dragStart.hit === "recto" && Math.abs(dy) > Math.abs(dx) * 1.15) {
      let nextDy = clamp(dragStart.dy0 + logicDy, -34, 34);
      if (Math.abs(nextDy) < 2.2) nextDy = 0;
      patch.deltaY = Math.round(nextDy);
    }
    updateState(patch, false, true);
  });

  function finishPointer(e) {
    if (!dragStart || e.pointerType === "touch") return;
    const wasMoved = dragStart.moved;
    const hit = dragStart.hit;
    dragStart = null;
    isDragging = false;

    if (!wasMoved) {
      const st = getState();
      if (hit === "spine") {
        updateState({ foldOpen: !st.foldOpen }, true);
      } else if (hit === "disc") {
        // 点右页玫红圆：若偏轻/偏重则归回 1.00，若已均衡则切 1.32 演示右重倾塌
        const nextScale = Math.abs(st.rectoScale - 1.0) > 0.08 ? 1.0 : 1.32;
        updateState({ rectoScale: nextScale }, true);
      }
    } else {
      updateState({}, true);
    }
    markDirty();
  }

  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", finishPointer);
  canvas.addEventListener("pointerleave", () => {
    if (!dragStart && hoverTarget) {
      hoverTarget = "";
      markDirty();
    }
  });

  // 触屏专用：允许竖直滑屏滚页，仅横向拖动驱动跨页校准（perf.mjs 也通过 touch 事件测拖动帧率）
  let touchStart = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const t0 = e.touches[0];
      const st = getState();
      const pt = clientToLogic(t0.clientX, t0.clientY);
      touchAxis = null;
      touchStart = {
        x: t0.clientX,
        y: t0.clientY,
        hit: hitTest(pt),
        moved: false,
        shift0: st.rectoShift,
      };
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!touchStart || e.touches.length !== 1) return;
      const t1 = e.touches[0];
      const dx = t1.clientX - touchStart.x;
      const dy = t1.clientY - touchStart.y;
      if (!touchAxis && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        touchAxis = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
      }
      if (touchAxis === "h") {
        e.preventDefault();
        touchStart.moved = true;
        isDragging = true;
        const logicDx = dx / Math.max(0.25, xform.scale);
        let nextShift = clamp(touchStart.shift0 + (logicDx / xform.pageW) * 100, -10.5, 11.5);
        if (Math.abs(nextShift) < 0.35) nextShift = 0;
        updateState({ rectoShift: +nextShift.toFixed(2) }, false, true);
      }
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchend",
    () => {
      if (touchStart && !touchStart.moved) {
        const st = getState();
        if (touchStart.hit === "spine") updateState({ foldOpen: !st.foldOpen }, true);
        else if (touchStart.hit === "disc") {
          updateState({ rectoScale: Math.abs(st.rectoScale - 1.0) > 0.08 ? 1.0 : 1.32 }, true);
        }
      } else if (touchStart && touchStart.moved) {
        updateState({}, true);
      }
      touchStart = null;
      touchAxis = null;
      isDragging = false;
      markDirty();
    },
    { passive: true }
  );

  // 键盘无障碍控制
  canvas.addEventListener("keydown", (e) => {
    const st = getState();
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      updateState({ rectoShift: +clamp(st.rectoShift - 0.8, -10.5, 11.5).toFixed(2) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      updateState({ rectoShift: +clamp(st.rectoShift + 0.8, -10.5, 11.5).toFixed(2) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      updateState({ deltaY: clamp(st.deltaY - 2, -34, 34) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      updateState({ deltaY: clamp(st.deltaY + 2, -34, 34) });
    } else if (e.key === " ") {
      e.preventDefault();
      updateState({ foldOpen: !st.foldOpen });
    }
  });

  const ro = new ResizeObserver(() => {
    resize();
    markDirty(true);
  });
  ro.observe(canvas);
  resize();
  markDirty(true);

  return { markDirty, resize };
}

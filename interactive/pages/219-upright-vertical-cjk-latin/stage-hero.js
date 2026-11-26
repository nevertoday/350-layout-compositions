// 219 立柱排字台（Hero 2D Canvas）
// 1:1 承袭 219 原海报鼠尾草绿纸面、左括号、中文虚线方格、直立西文列与暖奶油纵向主轴+方形视觉锚点。
// 采用静态底图离屏缓存 + dirty 按需重绘 + rAF 合帧，硬件与 SwiftShader 软件渲染均稳跑 60fps。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE, clamp, computeLayout, evaluate } from "./model.js";

export function mountHeroStage(canvas, getState, setState, onAudit) {
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let dpr = 1;
  let layout = null;
  let audit = null;

  // 轻柔开场进场动画（0..1，0.65s 完成，0.9s 截图时完全定帧清晰）
  let intro = reducedMotion.matches ? 1 : 0;

  // 纵读视线光带演播状态（Space 或按钮触发）
  let scanActive = false;
  let scanT = 0;

  // 按需重绘标记（静止时 0 冗余绘制，拖动时每帧只画一次）
  let dirty = true;
  let auditDirty = true;

  // 交互拖拽态
  let dragMode = null;
  let dragStart = null;
  let pointerMoved = false;
  let activeTouchId = null;
  let touchDecided = null;
  let hoverZone = null;

  // 静态建筑底图离屏缓存（纸纹 + 顶底线 + 竖轨 + 左括号 + 汉字方格 + 奶油主轴与底锚）
  let bgCanvas = null;
  let bgKey = "";

  // 一次性纸纹 tile
  let paperTileCanvas = null;
  function getPaperTileCanvas() {
    if (paperTileCanvas) return paperTileCanvas;
    const t = document.createElement("canvas");
    t.width = 96;
    t.height = 96;
    const tx = t.getContext("2d");
    tx.fillStyle = PALETTE.sage;
    tx.fillRect(0, 0, 96, 96);
    let s = 21907;
    for (let i = 0; i < 360; i++) {
      s = (s * 16807) % 2147483647;
      const px = s % 96;
      s = (s * 16807) % 2147483647;
      const py = s % 96;
      tx.fillStyle = i % 2 === 0 ? "rgba(255,250,235,0.032)" : "rgba(17,24,16,0.035)";
      tx.fillRect(px, py, 1, 1);
    }
    paperTileCanvas = t;
    return t;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(260, Math.round(rect.width));
    h = Math.max(260, Math.round(rect.height));
    // 手机高倍屏（DPR ≥ 2.5）上限 1.5，兼顾清晰度与慢机软件渲染 60fps
    dpr = window.devicePixelRatio >= 2.5 ? 1.5 : pixelRatio(2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      bgKey = "";
    }
    dirty = true;
    auditDirty = true;
  }

  function drawDashedLine(target, x1, y1, x2, y2, dash = [3, 3]) {
    target.save();
    target.setLineDash(dash);
    target.beginPath();
    target.moveTo(x1, y1);
    target.lineTo(x2, y2);
    target.stroke();
    target.restore();
  }

  // 构建静态建筑层（仅在尺寸 / 标本 / 辅助线 / 高亮 / 进场变化时重建，拖动期间完全命中缓存！）
  function ensureBackdrop(st, lay, ease) {
    const key = [
      w, h, dpr, st.specimen, st.showGuides, st.highlightPrinciple,
      lay.isTwin ? "twin" : `${st.caseMode}:${st.stepRatio.toFixed(2)}:${st.dividerMode}:${st.latinScale.toFixed(2)}`,
      ease < 1 ? ease.toFixed(2) : "1",
    ].join("|");
    if (bgCanvas && bgKey === key) return bgCanvas;
    if (!bgCanvas) bgCanvas = document.createElement("canvas");
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (bgCanvas.width !== pw || bgCanvas.height !== ph) {
      bgCanvas.width = pw;
      bgCanvas.height = ph;
    }
    const bctx = bgCanvas.getContext("2d");
    bctx.save();
    bctx.scale(dpr, dpr);

    // 1. 鼠尾草绿哑光底纸
    const pat = bctx.createPattern(getPaperTileCanvas(), "repeat");
    bctx.fillStyle = pat || PALETTE.sage;
    bctx.fillRect(0, 0, w, h);

    const {
      topY, botY, colH, em, cjkRail, latinRail, railCenterX,
      pillarRect, pillarAnchorRect, cjkAnchorRect, bracket, cjkBoxes, isTwin,
    } = lay;

    // 2. 顶部与底部通栏虚线基准线
    const lineSpanLeft = cjkRail.left - 8;
    const lineSpanRight = pillarRect.x + pillarRect.w + 8;
    bctx.strokeStyle = st.highlightPrinciple === "alignment" ? PALETTE.ink : PALETTE.sageRail;
    bctx.lineWidth = st.highlightPrinciple === "alignment" ? 1.4 : 0.9;
    drawDashedLine(bctx, lineSpanLeft, topY, lineSpanRight, topY, [3, 3]);
    drawDashedLine(bctx, lineSpanLeft, botY, lineSpanRight, botY, [3, 3]);

    // 3. 竖向导轨实线
    const railEndY = topY + colH * ease;
    bctx.strokeStyle = PALETTE.sageRail;
    bctx.lineWidth = 1;
    bctx.beginPath();
    bctx.moveTo(cjkRail.left, topY);
    bctx.lineTo(cjkRail.left, railEndY);
    bctx.moveTo(cjkRail.right, topY);
    bctx.lineTo(cjkRail.right, railEndY);
    if (isTwin) {
      bctx.moveTo(latinRail.right, topY);
      bctx.lineTo(latinRail.right, railEndY);
    }
    bctx.stroke();

    // 4. 左侧括号 `[ 字面保持直立`
    bctx.strokeStyle = PALETTE.inkSub;
    bctx.lineWidth = 0.95;
    bctx.beginPath();
    bctx.moveTo(bracket.x + bracket.tick, bracket.top);
    bctx.lineTo(bracket.x, bracket.top);
    bctx.lineTo(bracket.x, bracket.bottom);
    bctx.lineTo(bracket.x + bracket.tick, bracket.bottom);
    const midBrY = (bracket.top + bracket.bottom) * 0.5;
    bctx.moveTo(bracket.x, midBrY);
    bctx.lineTo(bracket.x - 6, midBrY);
    bctx.stroke();

    const brFontSize = clamp(Math.round(em * 0.25), 10, 12.5);
    bctx.fillStyle = PALETTE.ink;
    bctx.font = `600 ${brFontSize}px "Noto Sans SC", sans-serif`;
    bctx.textAlign = "center";
    bctx.textBaseline = "middle";
    const brChars = [...bracket.label];
    const brStep = brFontSize * 1.38;
    const brStartY = midBrY - ((brChars.length - 1) * brStep) * 0.5;
    for (let i = 0; i < brChars.length; i++) {
      bctx.fillText(brChars[i], bracket.x - 16, brStartY + i * brStep);
    }

    // 5. 暖奶油纵向主轴柱与底部视觉锚点方块 ■
    const pillarDrawH = pillarRect.h * ease;
    bctx.fillStyle = st.highlightPrinciple === "integration" ? PALETTE.creamBright : PALETTE.cream;
    bctx.fillRect(pillarRect.x, pillarRect.y, pillarRect.w, pillarDrawH);
    bctx.fillRect(pillarAnchorRect.x, pillarAnchorRect.y, pillarAnchorRect.w, pillarAnchorRect.h);
    bctx.fillRect(cjkAnchorRect.x, cjkAnchorRect.y, cjkAnchorRect.w, cjkAnchorRect.h);

    // 6. 中文虚线方格与大号汉字
    bctx.strokeStyle = PALETTE.sageGrid;
    bctx.lineWidth = 0.85;
    bctx.fillStyle = PALETTE.ink;
    bctx.font = `900 ${Math.round(em * 0.86)}px "Noto Sans SC", sans-serif`;
    bctx.textAlign = "center";
    bctx.textBaseline = "middle";
    for (let i = 0; i < cjkBoxes.length; i++) {
      const b = cjkBoxes[i];
      if (st.showGuides) {
        drawDashedLine(bctx, cjkRail.left + 2, b.cellBottom, cjkRail.right - 2, b.cellBottom, [2.5, 2.5]);
      }
      bctx.fillText(b.ch, b.cx, b.cy + em * 0.03);
    }

    // 理想中轴铅垂虚线
    if (st.showGuides) {
      bctx.strokeStyle = "rgba(17, 21, 18, 0.25)";
      bctx.lineWidth = 1;
      drawDashedLine(bctx, railCenterX, topY - 10, railCenterX, botY + 10, [4, 4]);
    }

    // 底部微提示（静态）
    bctx.fillStyle = PALETTE.inkSub;
    bctx.font = `500 10.5px "Noto Sans SC", sans-serif`;
    bctx.textAlign = "center";
    bctx.textBaseline = "bottom";
    bctx.fillText(
      w < 380 ? "横拖调中轴 · 拖底条调字步 · 点西文切大小写" : "画布横拖调纵向中轴 · 拖底端奶油条调纵向字步 · 点西文列切大小写 · 空格演播纵读",
      w * 0.5,
      h - 8
    );

    bctx.restore();
    bgKey = key;
    return bgCanvas;
  }

  function hitTest(px, py) {
    if (!layout) return "open";
    const { latinRail, cjkAnchorRect, pillarAnchorRect, metrics } = layout;
    const gripY = clamp(metrics.latinEndY, layout.topY + 40, layout.botY + 14);
    if (Math.abs(px - layout.plumbX) <= Math.max(26, (latinRail.right - latinRail.left) * 0.7) && Math.abs(py - gripY) <= 22) {
      return "step-grip";
    }
    if (
      px >= pillarAnchorRect.x - 8 && px <= pillarAnchorRect.x + pillarAnchorRect.w + 8 &&
      py >= pillarAnchorRect.y - 8 && py <= pillarAnchorRect.y + pillarAnchorRect.h + 8
    ) {
      return "anchor";
    }
    if (px >= latinRail.left - 12 && px <= latinRail.right + 12 && py >= layout.topY - 22 && py <= layout.botY + 12) {
      return "latin-col";
    }
    if (
      px >= cjkAnchorRect.x - 8 && px <= cjkAnchorRect.x + cjkAnchorRect.w + 8 &&
      py >= cjkAnchorRect.y - 8 && py <= cjkAnchorRect.y + cjkAnchorRect.h + 8
    ) {
      return "cjk-anchor";
    }
    return "open";
  }

  function render(t, dt, { still }) {
    if (!w || !h) resize();
    const animating = (!still && (intro < 1 || scanActive));
    if (!dirty && !animating) return; // 静置零重绘，手机端满帧且极省电！

    const st = getState();
    layout = computeLayout(st, w, h);
    audit = evaluate(st, layout);
    if (auditDirty) {
      onAudit(audit, layout);
      auditDirty = false;
    }

    if (still) {
      intro = 1;
      scanActive = false;
    } else if (intro < 1) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 1.75);
    }

    if (scanActive && !still) {
      scanT += Math.max(dt, 0.016) * 0.44;
      if (scanT >= 1.15) {
        scanActive = false;
        scanT = 0;
      }
    }

    dirty = false;
    const ease = 1 - (1 - intro) ** 3;
    const backdrop = ensureBackdrop(st, layout, ease);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(backdrop, 0, 0);
    ctx.scale(dpr, dpr);

    // 顶部极细状态坐标标尺
    ctx.fillStyle = PALETTE.inkSub;
    ctx.font = `600 10.5px "Archivo", "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    const hudLeft = `AXIS ${st.axisOffset === 0 ? "0%" : (st.axisOffset > 0 ? `+${st.axisOffset}%` : `${st.axisOffset}%`)} · STEP ${st.stepRatio.toFixed(2)}× · SCALE ${Math.round(st.latinScale * 100)}%`;
    ctx.fillText(hudLeft, 14, 11);

    ctx.textAlign = "right";
    ctx.fillStyle = audit.allGood ? PALETTE.mossLight : PALETTE.rustLight;
    ctx.font = `700 10.5px "Archivo", "Noto Sans SC", sans-serif`;
    ctx.fillText(audit.statusPill, w - 14, 11);

    const {
      topY, botY, colH, capH, cjkRail, latinRail, plumbX,
      pillarRect, pillarAnchorRect, latinBoxes, collisions, metrics, isTwin,
    } = layout;

    // 7. 实测西文中心连线（显示偏轴锯齿或笔直铅垂）
    if (st.showGuides) {
      const pureLatin = latinBoxes.filter((b) => b.kind === "latin");
      if (pureLatin.length > 1) {
        ctx.save();
        ctx.strokeStyle = Math.abs(st.axisOffset) > 7 ? PALETTE.rustLight : PALETTE.mossLight;
        ctx.lineWidth = Math.abs(st.axisOffset) > 7 ? 1.5 : 1.1;
        if (Math.abs(st.axisOffset) > 7) ctx.setLineDash([3, 2]);
        ctx.beginPath();
        for (let i = 0; i < pureLatin.length; i++) {
          if (i === 0) ctx.moveTo(pureLatin[i].cx, pureLatin[i].cy);
          else ctx.lineTo(pureLatin[i].cx, pureLatin[i].cy);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // 8. 碰撞区告警底纹（紧贴字母实测宽）
    if (collisions.length > 0 && st.caseMode !== "sideways") {
      ctx.fillStyle = "rgba(158, 42, 32, 0.14)";
      for (let i = 0; i < collisions.length; i++) {
        const col = collisions[i];
        const yMin = Math.min(col.a.visualBottom, col.b.visualTop) - 1.5;
        const yMax = Math.max(col.a.visualBottom, col.b.visualTop) + 1.5;
        const xMin = Math.min(col.a.x, col.b.x) - 3;
        const xMax = Math.max(col.a.x + col.a.w, col.b.x + col.b.w) + 3;
        ctx.fillRect(xMin, yMin, Math.max(10, xMax - xMin), Math.max(3.5, yMax - yMin));
      }
    }

    // 9. 绘制西文字形（批量共用同一 font，零每字切换损耗）
    const drawFontPx = Math.max(9.5, capH * 1.24);
    ctx.font = `600 ${drawFontPx.toFixed(1)}px "Outfit", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < latinBoxes.length; i++) {
      const b = latinBoxes[i];
      if (b.kind === "sideways") {
        ctx.save();
        ctx.fillStyle = PALETTE.rustFill;
        ctx.fillRect(latinRail.left + 3, b.y - 2, latinRail.right - latinRail.left - 6, b.h + 4);
        ctx.translate(b.cx, b.cy);
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = PALETTE.rustLight;
        ctx.font = `700 ${Math.max(10, Math.round(capH * 0.96))}px "Outfit", sans-serif`;
        ctx.fillText(b.ch, 0, 0);
        ctx.restore();
        ctx.font = `600 ${drawFontPx.toFixed(1)}px "Outfit", sans-serif`;
        continue;
      }

      if (b.kind === "dot") {
        ctx.fillStyle = st.highlightPrinciple === "rhythm" ? PALETTE.mossLight : PALETTE.ink;
        ctx.beginPath();
        ctx.arc(b.cx, b.cy, Math.max(1.9, b.w * 0.5), 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      const belowAnchor = b.visualBottom > botY + 3;
      const isBadGlyph = belowAnchor || b.overflowRail > 1 || (st.caseMode === "lower" && (b.asc || b.desc));

      if (st.showGuides && st.caseMode === "lower" && (b.asc || b.desc)) {
        ctx.fillStyle = "rgba(158, 42, 32, 0.14)";
        ctx.fillRect(b.x - 2, b.visualTop, b.w + 4, b.visualBottom - b.visualTop);
      }

      ctx.fillStyle = isBadGlyph ? PALETTE.rustLight : PALETTE.ink;
      ctx.fillText(b.ch, b.cx, b.cy + capH * 0.04);
    }

    // 10. 尾脚与底部锚点对照标尺
    if (st.showGuides && st.caseMode !== "sideways") {
      const endY = clamp(metrics.latinEndY, topY + 24, h - 18);
      const footDiff = Math.round(metrics.footDeltaPx);
      const footOff = Math.abs(footDiff) > (isTwin ? Math.max(38, colH * 0.14) : Math.max(54, colH * 0.22));
      ctx.strokeStyle = footOff ? PALETTE.rustLight : PALETTE.mossLight;
      ctx.lineWidth = 1.1;
      drawDashedLine(ctx, latinRail.left + 2, endY, pillarAnchorRect.x - 4, endY, [2, 2]);
      if (footOff) {
        const midLineX = latinRail.right + Math.max(8, (pillarRect.x - latinRail.right) * 0.5);
        ctx.beginPath();
        ctx.moveTo(midLineX, endY);
        ctx.lineTo(midLineX, metrics.targetFootY);
        ctx.stroke();
        const tag = footDiff > 0 ? `+${footDiff}px` : `${footDiff}px`;
        ctx.font = `700 10px "Archivo", sans-serif`;
        const tw = ctx.measureText(tag).width + 10;
        const ty = clamp((endY + metrics.targetFootY) * 0.5, topY + 22, h - 22);
        ctx.fillStyle = PALETTE.pine;
        ctx.fillRect(midLineX - tw * 0.5, ty - 9, tw, 18);
        ctx.fillStyle = PALETTE.rustDark;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tag, midLineX, ty);
      }
    }

    // 11. 直接操作握柄（顶沿中轴滑柄 + 尾脚字步拉柄）
    const topGripY = topY - 12;
    const axisOk = Math.abs(st.axisOffset) <= 7;
    ctx.fillStyle = dragMode === "axis" || hoverZone === "latin-col" ? PALETTE.pine : (axisOk ? PALETTE.mossLight : PALETTE.rustLight);
    ctx.beginPath();
    ctx.arc(plumbX, topGripY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.cream;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const gripY = clamp(metrics.latinEndY + 7, topY + 46, h - 14);
    const gripW = Math.min(34, (latinRail.right - latinRail.left) * 0.85);
    ctx.fillStyle = dragMode === "step" || hoverZone === "step-grip" ? PALETTE.pine : PALETTE.cream;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1;
    ctx.fillRect(plumbX - gripW * 0.5, gripY - 3, gripW, 6);
    ctx.strokeRect(plumbX - gripW * 0.5, gripY - 3, gripW, 6);

    // 12. 暖奶油纵读视线光带（按 Space 演播）
    if (scanActive && !still) {
      const scanY = topY + clamp(scanT, 0, 1) * colH;
      const grad = ctx.createLinearGradient(0, scanY - 34, 0, scanY + 14);
      grad.addColorStop(0, "rgba(247, 234, 203, 0)");
      grad.addColorStop(0.7, audit.allGood ? "rgba(247, 234, 203, 0.52)" : "rgba(242, 140, 120, 0.45)");
      grad.addColorStop(1, "rgba(247, 234, 203, 0)");
      ctx.fillStyle = grad;
      const jitterX = !audit.allGood ? Math.sin(scanT * 42) * 5 : 0;
      ctx.fillRect(cjkRail.left + jitterX, scanY - 34, (latinRail.right - cjkRail.left), 48);

      ctx.fillStyle = audit.allGood ? PALETTE.creamBright : PALETTE.rustLight;
      ctx.beginPath();
      ctx.arc(plumbX + jitterX, scanY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (audit.allGood && scanT > 0.85) {
        ctx.strokeStyle = PALETTE.mossLight;
        ctx.lineWidth = 2;
        ctx.strokeRect(pillarAnchorRect.x - 3, pillarAnchorRect.y - 3, pillarAnchorRect.w + 6, pillarAnchorRect.h + 6);
      }
    }

    ctx.restore();
  }

  const runner = loop(canvas, render);

  // --- 鼠标与触屏交互（拖拽仅标 dirty，交由 rAF 合帧单次绘制！）---
  function localPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function applyAxisDrag(dx) {
    const st = getState();
    const raw = dragStart.axisOffset + (dx / Math.max(110, w * 0.36)) * 68;
    let next = Math.round(clamp(raw, -40, 40));
    if (Math.abs(next) <= 3) next = 0;
    dirty = true;
    if (next !== st.axisOffset) {
      setState({ axisOffset: next }, { deferDraw: true });
      auditDirty = true;
    }
    if (reducedMotion.matches) runner.draw();
  }

  function applyStepDrag(dy) {
    const st = getState();
    const raw = dragStart.stepRatio + (dy / Math.max(140, h * 0.42)) * 0.95;
    let next = Math.round(clamp(raw, 0.82, 2.05) * 100) / 100;
    const ideal = layout ? layout.spec.defaultGood.stepRatio : 1.38;
    if (Math.abs(next - ideal) <= 0.03) next = ideal;
    dirty = true;
    if (next !== st.stepRatio) {
      setState({ stepRatio: next }, { deferDraw: true });
      auditDirty = true;
    }
    if (reducedMotion.matches) runner.draw();
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    const p = localPos(e.clientX, e.clientY);
    const zone = hitTest(p.x, p.y);
    dragMode = "pending";
    const st = getState();
    dragStart = { x: p.x, y: p.y, axisOffset: st.axisOffset, stepRatio: st.stepRatio, zone };
    pointerMoved = false;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const p = localPos(e.clientX, e.clientY);
    if (!dragMode) {
      const z = hitTest(p.x, p.y);
      if (z !== hoverZone) {
        hoverZone = z;
        canvas.style.cursor = z === "step-grip" || z === "anchor" ? "ns-resize" : "ew-resize";
        dirty = true;
      }
      return;
    }
    const dx = p.x - dragStart.x;
    const dy = p.y - dragStart.y;
    if (dragMode === "pending" && Math.hypot(dx, dy) > 4) {
      pointerMoved = true;
      const preferStep = dragStart.zone === "step-grip" || dragStart.zone === "anchor";
      dragMode = Math.abs(dy) > Math.abs(dx) * (preferStep ? 0.75 : 1.25) ? "step" : "axis";
    }
    if (dragMode === "step") applyStepDrag(dy);
    else if (dragMode === "axis") applyAxisDrag(dx);
  });

  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    if (dragMode && !pointerMoved) {
      const st = getState();
      if (dragStart.zone === "latin-col" || dragStart.zone === "step-grip") {
        const order = ["lower", "upper", "sideways"];
        setState({ caseMode: order[(order.indexOf(st.caseMode) + 1) % order.length] });
      } else if (dragStart.zone === "anchor" || dragStart.zone === "cjk-anchor") {
        const order = ["none", "dot", "space"];
        setState({ dividerMode: order[(order.indexOf(st.dividerMode) + 1) % order.length] });
      }
    }
    dragMode = null;
  });

  canvas.addEventListener("pointercancel", () => { dragMode = null; });

  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const p = localPos(t0.clientX, t0.clientY);
    const zone = hitTest(p.x, p.y);
    activeTouchId = t0.identifier;
    touchDecided = null;
    const st = getState();
    dragStart = { x: p.x, y: p.y, axisOffset: st.axisOffset, stepRatio: st.stepRatio, zone };
    pointerMoved = false;
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    const touch = [...e.touches].find((x) => x.identifier === activeTouchId);
    if (!touch || !dragStart) return;
    const p = localPos(touch.clientX, touch.clientY);
    const dx = p.x - dragStart.x;
    const dy = p.y - dragStart.y;
    if (!touchDecided && Math.hypot(dx, dy) > 5) {
      if (Math.abs(dx) >= Math.abs(dy)) touchDecided = "axis";
      else touchDecided = dragStart.zone === "step-grip" ? "step" : "scroll";
    }
    if (touchDecided === "axis") {
      e.preventDefault();
      pointerMoved = true;
      applyAxisDrag(dx);
    } else if (touchDecided === "step") {
      e.preventDefault();
      pointerMoved = true;
      applyStepDrag(dy);
    }
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    if (dragStart && !pointerMoved && (dragStart.zone === "latin-col" || dragStart.zone === "step-grip")) {
      const st = getState();
      const order = ["lower", "upper", "sideways"];
      setState({ caseMode: order[(order.indexOf(st.caseMode) + 1) % order.length] });
    }
    activeTouchId = null;
    touchDecided = null;
    dragStart = null;
  }, { passive: true });

  const ro = new ResizeObserver(() => {
    resize();
    runner.draw();
  });
  ro.observe(canvas);
  resize();
  runner.draw();

  return {
    draw() {
      dirty = true;
      auditDirty = true;
      runner.draw();
    },
    triggerScan() {
      if (reducedMotion.matches) {
        dirty = true;
        runner.draw();
        return;
      }
      scanActive = true;
      scanT = 0;
      dirty = true;
      runner.draw();
    },
    getAudit() {
      return audit;
    },
  };
}

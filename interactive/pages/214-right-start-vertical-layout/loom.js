// 214 直排右起 · Hero 活字理列台 2D Canvas 引擎（含离屏字列缓存 + 按需重绘，软硬件渲染皆稳 55–60fps）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, computeLayout, evaluate } from "./model.js";

const PAL = {
  bg: "#0C0533",
  sheetBg: "#12093E",
  ivory: "#EFE5DA",
  ivorySoft: "#C9BDD8",
  pink: "#EF87AA",
  pinkBright: "#F7A1BF",
  jade: "#76E2C0",
  coral: "#FF867B",
  slipFill: "rgba(255, 255, 255, 0.03)",
  slipSelected: "rgba(239, 135, 170, 0.11)",
  slipDrag: "rgba(239, 135, 170, 0.2)",
};

const PUNCT_SET = new Set(["，", "。", "、", "；", "：", "！", "？"]);

export function mountLoom(canvas, getState, setState, onRender) {
  const ctx = canvas.getContext("2d");
  let W = 680;
  let H = 368;
  let dpr = 1;
  let layout = null;
  let result = null;
  let introProgress = 0;
  let scanActive = false;
  let scanT = 0;
  let drag = null;
  let dirty = true;
  let lastUiSig = "";

  // 离屏缓存五条竖列的文字像素，拖拽理列时零重复 CJK 光栅化
  let cacheKey = "";
  const colSprites = new Map();

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const nw = Math.max(280, Math.round(rect.width || 640));
    const nh = Math.max(260, Math.round(rect.height || 368));
    // 手机竖屏像素比封顶 1.5（遵循 GUIDE 性能建议），桌面封顶 2
    const ndpr = nw < 500 ? pixelRatio(1.5) : pixelRatio(2);
    const changed = nw !== W || nh !== H || ndpr !== dpr;
    W = nw;
    H = nh;
    dpr = ndpr;
    const pw = Math.round(W * dpr);
    const ph = Math.round(H * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      dirty = true;
    }
    return changed;
  }

  function drawRoundedRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function drawArrow(c, x1, y1, x2, y2, color, head = 5.5) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    c.strokeStyle = color;
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    c.beginPath();
    c.moveTo(x2, y2);
    c.lineTo(x2 - head * Math.cos(ang - 0.45), y2 - head * Math.sin(ang - 0.45));
    c.lineTo(x2 - head * Math.cos(ang + 0.45), y2 - head * Math.sin(ang + 0.45));
    c.closePath();
    c.fill();
  }

  // 仅当文字内容/字号/标点模式变化时重建 5 张小型离屏文字贴图
  function ensureSprites(state, lay) {
    const key = [
      state.specimen,
      state.punct,
      state.titleScale,
      state.align,
      lay.charsPerCol,
      lay.fontSize.toFixed(2),
      dpr.toFixed(2),
      Math.round(lay.availH),
    ].join("|");
    if (key === cacheKey) return;
    cacheKey = key;
    colSprites.clear();

    for (const col of lay.cols) {
      const pad = 10;
      const cw = Math.ceil(col.w + pad * 2);
      const ch = Math.ceil(col.h + pad * 2);
      const off = document.createElement("canvas");
      off.width = Math.max(1, Math.ceil(cw * dpr));
      off.height = Math.max(1, Math.ceil(ch * dpr));
      const oc = off.getContext("2d");
      oc.scale(dpr, dpr);
      oc.textAlign = "center";
      oc.textBaseline = "middle";

      const cx = cw * 0.5;
      if (col.isTitle) {
        const dotY = pad + col.fs * 0.45;
        oc.beginPath();
        oc.arc(cx, dotY, Math.max(4, col.fs * 0.22), 0, Math.PI * 2);
        oc.fillStyle = state.titleScale === "strong" ? PAL.pink : PAL.ivorySoft;
        oc.fill();

        oc.font = `700 ${Math.round(col.fs)}px "Noto Serif SC", serif`;
        oc.fillStyle = PAL.ivory;
        let cy = dotY + col.fs * 1.12;
        for (const chChar of col.chars) {
          oc.fillText(chChar, cx, cy);
          cy += col.step;
        }
        cy += 4;
        const metaFs = Math.max(10, lay.fontSize * 0.78);
        oc.font = `400 ${Math.round(metaFs)}px "LXGW WenKai", "Noto Serif SC", serif`;
        oc.fillStyle = PAL.pinkBright;
        for (const chChar of col.metaChars) {
          if (cy + metaFs * 0.4 > pad + col.h) break;
          oc.fillText(chChar, cx, cy);
          cy += metaFs * 1.1;
        }
      } else {
        const mainFont = `400 ${Math.round(col.fs)}px "LXGW WenKai", "Noto Serif SC", serif`;
        oc.font = mainFont;
        let cy = pad + col.fs * 0.58;
        for (let idx = 0; idx < col.chars.length; idx++) {
          const chChar = col.chars[idx];
          if (cy + col.fs * 0.32 > pad + col.h) break;
          if (PUNCT_SET.has(chChar)) {
            if (state.punct === "vertical") {
              oc.fillStyle = PAL.ivory;
              oc.fillText(chChar, cx + col.fs * 0.3, cy - col.fs * 0.24);
            } else {
              oc.fillStyle = "rgba(255, 134, 123, 0.24)";
              oc.beginPath();
              oc.arc(cx - col.fs * 0.34, cy + col.fs * 0.26, col.fs * 0.28, 0, Math.PI * 2);
              oc.fill();
              oc.fillStyle = PAL.coral;
              oc.fillText(chChar, cx - col.fs * 0.34, cy + col.fs * 0.26);
            }
          } else {
            oc.fillStyle = PAL.ivory;
            oc.fillText(chChar, cx, cy);
          }
          cy += col.step;
        }
      }
      colSprites.set(col.id, { off, cw, ch, pad });
    }
  }

  function render(t, dt, { still }) {
    resize();
    if (still) {
      introProgress = 1;
      scanActive = false;
    } else if (introProgress < 1) {
      introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 2.4);
      dirty = true;
    }

    if (scanActive && !still) {
      scanT += Math.max(dt, 0.016) * 0.25;
      dirty = true;
      if (scanT >= 1) {
        scanT = 0;
        scanActive = false;
      }
    }

    // 静置且无动画无变化时跳过重绘，大幅降低慢手机 CPU/软件渲染开销
    if (!dirty && !still) return;
    dirty = false;

    const state = getState();
    layout = computeLayout(state, W, H, drag);
    result = evaluate(state, layout);
    ensureSprites(state, layout);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 夜墨靛紫底 + 右下淡弧
    ctx.fillStyle = PAL.bg;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    const ox = W + 24;
    const oy = H + 26;
    ctx.strokeStyle = "rgba(225, 108, 182, 0.14)";
    ctx.lineWidth = 1;
    for (let r = 64; r <= 148; r += 28) {
      ctx.beginPath();
      ctx.arc(ox, oy, r, Math.PI, Math.PI * 1.55);
      ctx.stroke();
    }
    ctx.restore();

    const { sheet, poemBox, sidePanel, headY, footBarY, cols, compact, gapRatio, pitchPx } = layout;

    // 2. 顶部原海报式标眉
    const railY = sheet.y - (compact ? 15 : 17);
    ctx.font = `600 ${compact ? 10 : 11}px "Chivo", "Noto Serif SC", sans-serif`;
    ctx.fillStyle = PAL.pink;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(compact ? "示例 · 右起 ←" : "示例 EXAMPLE · 拖拽竖列自右向左排序", sheet.x + 2, railY);

    ctx.font = `500 ${compact ? 10 : 11}px "JetBrains Mono", monospace`;
    ctx.fillStyle = result.allGood ? PAL.jade : PAL.pinkBright;
    ctx.textAlign = "right";
    ctx.fillText(
      `列缝 ${gapRatio.toFixed(2)}× · ${layout.charsPerCol}字/列 · ${result.passedCount}/4`,
      sheet.x + sheet.w - 2,
      railY
    );

    // 3. 外匣与诗卷内框
    drawRoundedRect(ctx, sheet.x, sheet.y, sheet.w, sheet.h, 8);
    ctx.fillStyle = PAL.sheetBg;
    ctx.fill();
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = result.allGood ? "rgba(118, 226, 192, 0.55)" : "rgba(182, 114, 168, 0.52)";
    ctx.stroke();

    ctx.strokeStyle = "rgba(148, 112, 178, 0.34)";
    ctx.lineWidth = 1;
    ctx.strokeRect(poemBox.x, poemBox.y, poemBox.w, poemBox.h);

    // 桌面宽幅右侧：1:1 复刻原海报「阅读顺序」与「版式结构」实况缩略图
    if (sidePanel) {
      const sx = sidePanel.x + 8;
      const sw = sidePanel.w - 14;
      const sy = sidePanel.y + 18;

      ctx.font = `600 12px "Noto Serif SC", serif`;
      ctx.fillStyle = PAL.ivory;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("阅读顺序", sx, sy);
      ctx.font = `600 9.5px "Chivo", sans-serif`;
      ctx.fillStyle = PAL.pink;
      ctx.fillText("READING ORDER", sx, sy + 16);

      const cy = sy + 44;
      const rStep = Math.min(26, (sw - 16) / 4.4);
      ctx.font = `700 10px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < 5; i++) {
        const col = cols[4 - i];
        const ok = col && col.actualRightIndex === col.semanticRank;
        const cx = sx + 10 + i * rStep;
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fillStyle = ok ? PAL.jade : col?.isTitle ? PAL.pink : "rgba(255, 134, 123, 0.28)";
        ctx.fill();
        ctx.fillStyle = ok || col?.isTitle ? PAL.bg : PAL.ivory;
        ctx.fillText(String(col ? col.semanticRank : i + 1), cx, cy + 0.5);
      }

      drawArrow(ctx, sx + sw - 4, cy + 20, sx + 4, cy + 20, result.pillars.order ? PAL.jade : PAL.pink, 5.5);

      const ly = cy + 44;
      ctx.font = `600 12px "Noto Serif SC", serif`;
      ctx.fillStyle = PAL.ivory;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("版式结构", sx, ly);
      ctx.font = `600 9.5px "Chivo", sans-serif`;
      ctx.fillStyle = PAL.pink;
      ctx.fillText("LAYOUT STRUCTURE", sx, ly + 16);

      const boxTop = ly + 36;
      const boxH = Math.min(92, Math.max(58, sidePanel.y + sidePanel.h - boxTop - 36));
      const boxGap = clamp(gapRatio * 7, 1.5, 13);
      const boxW = Math.max(10, (sw - boxGap * 4) / 5);
      const startBx = sx + Math.max(0, (sw - (boxW * 5 + boxGap * 4)) / 2);

      for (let i = 0; i < 5; i++) {
        const col = cols[i];
        const bx = startBx + i * (boxW + boxGap);
        const topShift = state.align === "ragged" ? (col.topOffset / Math.max(1, layout.fontSize)) * 7 : state.align === "center" ? (i === 0 ? 12 : i === 4 ? 8 : 3) : 0;
        const bh = Math.max(24, boxH - topShift - (col.isTitle ? 12 : 0));
        ctx.strokeStyle = col.isTitle ? PAL.pink : col.actualRightIndex === col.semanticRank ? PAL.jade : PAL.coral;
        ctx.lineWidth = col.isTitle ? 1.5 : 1;
        ctx.strokeRect(bx, boxTop + topShift, boxW, bh);
      }

      const arrowY = boxTop + boxH + 14;
      ctx.save();
      ctx.setLineDash([4, 3]);
      drawArrow(ctx, sx + sw - 4, arrowY, sx + 4, arrowY, PAL.pink, 5);
      ctx.restore();

      ctx.font = `500 10px "JetBrains Mono", monospace`;
      ctx.fillStyle = PAL.ivorySoft;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`留白 ${layout.whitespacePct}% · 天头差 ${layout.topVariancePx}px`, sx, arrowY + 10);
    }

    // 4. 参考线层
    if (state.showGuides) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = result.pillars.align ? "rgba(118, 226, 192, 0.45)" : "rgba(255, 134, 123, 0.52)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(poemBox.x + 6, headY);
      ctx.lineTo(poemBox.x + poemBox.w - 6, headY);
      ctx.stroke();
      ctx.restore();

      ctx.font = `500 10px "Noto Serif SC", serif`;
      ctx.fillStyle = result.pillars.align ? PAL.jade : PAL.coral;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("天头线", poemBox.x + 8, headY - 3);

      ctx.font = `700 10px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < layout.slotCenters.length; i++) {
        const sx = layout.slotCenters[i];
        const rightNum = 5 - i;
        const cy = poemBox.y + 13;
        const isOrigin = rightNum === 1;
        ctx.beginPath();
        ctx.arc(sx, cy, isOrigin ? 8.5 : 7, 0, Math.PI * 2);
        ctx.fillStyle = isOrigin
          ? result.pillars.order
            ? PAL.jade
            : PAL.pink
          : "rgba(239, 135, 170, 0.16)";
        ctx.fill();
        ctx.fillStyle = isOrigin ? PAL.bg : PAL.ivorySoft;
        ctx.fillText(String(rightNum), sx, cy + 0.5);
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < layout.slotCenters.length - 1; i++) {
        const xR = layout.slotCenters[i + 1] - 11;
        const xL = layout.slotCenters[i] + 11;
        if (xR - xL > 8) {
          drawArrow(ctx, xR, poemBox.y + 13, xL, poemBox.y + 13, "rgba(239, 135, 170, 0.45)", 4.2);
        }
      }
    }

    // 5. 列缝警示区
    const sortedCols = [...cols].sort((a, b) => a.cx - b.cx);
    if (state.showGuides && (!result.pillars.space || drag?.mode === "pitch")) {
      ctx.fillStyle =
        gapRatio < 0.42
          ? "rgba(255, 134, 123, 0.16)"
          : gapRatio > 1.65
            ? "rgba(255, 134, 123, 0.12)"
            : "rgba(118, 226, 192, 0.12)";
      for (let i = 0; i < sortedCols.length - 1; i++) {
        const a = sortedCols[i];
        const b = sortedCols[i + 1];
        const gx = a.x + a.w;
        const gw = b.x - gx;
        if (gw > 2) ctx.fillRect(gx, headY + 4, gw, Math.max(40, footBarY - 28 - headY));
      }
    }

    // 6. 用离屏缓存极速绘制 5 条可拖拽活字竖列
    const drawOrder = [...cols].sort((a, b) => (a.isDragging ? 1 : b.isDragging ? -1 : 0));
    const ease = 1 - Math.pow(1 - introProgress, 3);
    const shortFoot = pitchPx < 29;

    ctx.font = `600 10px "Chivo", "Noto Serif SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const col of drawOrder) {
      const isSelected = state.selectedId === col.id;
      const inPlace = col.actualRightIndex === col.semanticRank;
      const slideY = (1 - ease) * (10 + (5 - col.actualRightIndex) * 5);
      const padV = 5;
      const rx = col.x - 3;
      const ry = col.y - padV + slideY;
      const rw = col.w + 6;
      const rh = col.h + padV * 2;

      drawRoundedRect(ctx, rx, ry, rw, rh, 5);
      ctx.fillStyle = col.isDragging
        ? PAL.slipDrag
        : isSelected
          ? PAL.slipSelected
          : PAL.slipFill;
      ctx.fill();

      ctx.lineWidth = col.isDragging ? 1.8 : isSelected ? 1.4 : 0.9;
      ctx.strokeStyle = col.isDragging
        ? PAL.pinkBright
        : !inPlace
          ? "rgba(255, 134, 123, 0.55)"
          : isSelected
            ? PAL.pink
            : "rgba(160, 124, 194, 0.34)";
      ctx.stroke();

      if (state.showGuides && col.topOffset > 4) {
        ctx.save();
        ctx.strokeStyle = PAL.coral;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(col.cx, headY);
        ctx.lineTo(col.cx, col.y - padV + slideY);
        ctx.stroke();
        ctx.restore();
      }

      if (col.isTitle && state.titleScale === "strong") {
        ctx.strokeStyle = "rgba(239, 135, 170, 0.52)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rx - 3, col.y + slideY);
        ctx.lineTo(rx - 3, col.y + col.h + slideY);
        ctx.stroke();
      }

      const sp = colSprites.get(col.id);
      if (sp) {
        ctx.drawImage(sp.off, col.x - sp.pad, col.y - sp.pad + slideY, sp.cw, sp.ch);
      }

      const footBadgeY = Math.min(ry + rh + 9, footBarY - 15);
      ctx.fillStyle = inPlace ? PAL.jade : PAL.coral;
      const tag = shortFoot
        ? `${inPlace ? "✓" : "×"}${col.isTitle ? "题" : col.semanticRank - 1}`
        : `${inPlace ? "✓" : "×"}${col.label}`;
      ctx.fillText(tag, col.cx, footBadgeY);
    }

    // 7. 视线流路径与演练光珠
    if (state.showGuides || scanActive) {
      const segs = layout.semanticPath;
      const pathBad = !result.pillars.order;
      ctx.save();
      ctx.setLineDash(pathBad ? [4, 4] : [3, 5]);
      ctx.lineWidth = scanActive ? 1.8 : 1.05;
      ctx.strokeStyle = pathBad
        ? "rgba(255, 134, 123, 0.52)"
        : "rgba(239, 135, 170, 0.4)";

      ctx.beginPath();
      for (const seg of segs) {
        if (seg.next) {
          const midX = (seg.x + seg.next.x) * 0.5;
          const midY = (seg.y1 + seg.next.y) * 0.5 - (pathBad ? 22 : 10);
          ctx.moveTo(seg.x, seg.y1);
          ctx.quadraticCurveTo(midX, midY, seg.next.x, seg.next.y);
        }
      }
      ctx.stroke();
      ctx.restore();

      if (scanActive) {
        const totalSteps = segs.length * 2 - 1;
        const pos = scanT * totalSteps;
        const idx = Math.min(totalSteps - 1, Math.floor(pos));
        const frac = pos - idx;
        let px = 0;
        let py = 0;
        if (idx % 2 === 0) {
          const s = segs[idx / 2];
          px = s.x;
          py = s.y0 + (s.y1 - s.y0) * frac;
        } else {
          const s = segs[(idx - 1) / 2];
          if (s.next) {
            const u = 1 - frac;
            const midX = (s.x + s.next.x) * 0.5;
            const midY = (s.y1 + s.next.y) * 0.5 - (pathBad ? 22 : 10);
            px = u * u * s.x + 2 * u * frac * midX + frac * frac * s.next.x;
            py = u * u * s.y1 + 2 * u * frac * midY + frac * frac * s.next.y;
          }
        }
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fillStyle = pathBad ? "rgba(255, 134, 123, 0.28)" : "rgba(239, 135, 170, 0.3)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = pathBad ? PAL.coral : PAL.pinkBright;
        ctx.fill();
      }
    }

    // 8. 底部独立「列高 / 每列字数」拉尺
    const handleY = footBarY;
    ctx.save();
    ctx.strokeStyle = drag?.mode === "foot" ? PAL.pinkBright : "rgba(239, 135, 170, 0.32)";
    ctx.lineWidth = drag?.mode === "foot" ? 1.8 : 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(poemBox.x + 8, handleY);
    ctx.lineTo(poemBox.x + poemBox.w - 8, handleY);
    ctx.stroke();
    ctx.restore();

    const pillW = compact ? 80 : 94;
    const pillH = 18;
    const pillCx = poemBox.x + poemBox.w * 0.5;
    drawRoundedRect(ctx, pillCx - pillW * 0.5, handleY - pillH * 0.5, pillW, pillH, 9);
    ctx.fillStyle = drag?.mode === "foot" ? PAL.pink : "#1C1050";
    ctx.fill();
    ctx.strokeStyle = PAL.pink;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = `600 10px "JetBrains Mono", "Noto Serif SC", monospace`;
    ctx.fillStyle = drag?.mode === "foot" ? PAL.bg : PAL.ivory;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`↕ ${layout.charsPerCol}字/列`, pillCx, handleY + 0.5);

    const botY = sheet.y + sheet.h + (compact ? 16 : 18);
    ctx.font = `400 ${compact ? 10 : 11}px "Noto Serif SC", serif`;
    ctx.fillStyle = PAL.ivorySoft;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const hintStr =
      W < 520
        ? "横拖竖列理顺右起 · 纵拖底尺改字数"
        : "直接左右拖竖列按右起排序 · 空白处横拖调列距 · 纵拖底尺改每列字数";
    ctx.fillText(hintStr, sheet.x + 2, botY);

    if (W >= 540) {
      const ax2 = sheet.x + sheet.w - 4;
      const ax1 = ax2 - 68;
      ctx.save();
      ctx.setLineDash([4, 4]);
      drawArrow(ctx, ax2, botY, ax1, botY, PAL.pink, 5.2);
      ctx.restore();
    }

    ctx.restore();

    // 仅当 UI 读数发生变化时才同步 DOM，拖拽同槽内零 DOM 抖动
    const uiSig = [
      state.specimen,
      state.order.join(","),
      state.align,
      state.pitch.toFixed(2),
      state.charsPerCol,
      state.punct,
      state.titleScale,
      state.showGuides,
      result.badgeText,
      layout.topVariancePx,
    ].join("|");
    if (onRender && uiSig !== lastUiSig) {
      lastUiSig = uiSig;
      onRender(result, layout);
    }
  }

  function canvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] || e.changedTouches[0] : e;
    return { x: pt.clientX - r.left, y: pt.clientY - r.top };
  }

  function hitTest(x, y) {
    if (!layout) return { mode: "pitch" };
    const handleY = layout.footBarY;
    const pillCx = layout.poemBox.x + layout.poemBox.w * 0.5;
    if (Math.abs(y - handleY) <= 15 && Math.abs(x - pillCx) <= 64) {
      return { mode: "foot" };
    }
    for (const col of layout.cols) {
      if (x >= col.x - 14 && x <= col.x + col.w + 14 && y >= col.y - 16 && y <= col.y + col.h + 18) {
        return { mode: "slip", col };
      }
    }
    let nearest = null;
    let bestD = Infinity;
    for (const col of layout.cols) {
      const d = Math.abs(x - col.cx);
      if (d < bestD) {
        bestD = d;
        nearest = col;
      }
    }
    if (nearest && bestD <= layout.pitchPx * 0.45 && y >= layout.poemBox.y && y <= layout.poemBox.y + layout.poemBox.h) {
      return { mode: "slip", col: nearest };
    }
    return { mode: "pitch" };
  }

  function applyDragMove(x, y) {
    if (!drag || !layout) return;
    const state = getState();
    dirty = true;
    if (drag.mode === "slip") {
      drag.currentX = x;
      let bestSlot = 0;
      let bestDist = Infinity;
      for (let i = 0; i < layout.slotCenters.length; i++) {
        const d = Math.abs(x - layout.slotCenters[i]);
        if (d < bestDist) {
          bestDist = d;
          bestSlot = i;
        }
      }
      const curIdx = state.order.indexOf(drag.activeId);
      if (curIdx !== -1 && curIdx !== bestSlot) {
        const nextOrder = [...state.order];
        nextOrder.splice(curIdx, 1);
        nextOrder.splice(bestSlot, 0, drag.activeId);
        setState({ ...state, order: nextOrder, selectedId: drag.activeId });
      }
    } else if (drag.mode === "pitch") {
      const dx = x - drag.startX;
      const nextPitch = clamp(drag.startPitch + dx / 145, 1.15, 3.05);
      setState({ ...state, pitch: +nextPitch.toFixed(2) });
    } else if (drag.mode === "foot") {
      const dy = y - drag.startY;
      const nextChars = Math.round(clamp(drag.startChars + dy / 14, 6, 28));
      if (nextChars !== state.charsPerCol) {
        setState({ ...state, charsPerCol: nextChars });
      }
    }
  }

  function startDrag(x, y, pointerId = null) {
    const state = getState();
    const hit = hitTest(x, y);
    dirty = true;
    if (hit.mode === "slip") {
      drag = {
        mode: "slip",
        pointerId,
        activeId: hit.col.id,
        startX: x,
        startY: y,
        currentX: hit.col.cx,
      };
      if (state.selectedId !== hit.col.id) {
        setState({ ...state, selectedId: hit.col.id });
      }
    } else if (hit.mode === "foot") {
      drag = {
        mode: "foot",
        pointerId,
        startX: x,
        startY: y,
        startChars: state.charsPerCol,
      };
    } else {
      drag = {
        mode: "pitch",
        pointerId,
        startX: x,
        startY: y,
        startPitch: state.pitch,
      };
    }
  }

  function endDrag() {
    if (!drag) return;
    drag = null;
    dirty = true;
    if (reducedMotion.matches) ctrl.draw();
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    const { x, y } = canvasPoint(e);
    startDrag(x, y, e.pointerId);
    if (canvas.setPointerCapture) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    const { x, y } = canvasPoint(e);
    if (drag && (drag.pointerId == null || drag.pointerId === e.pointerId)) {
      applyDragMove(x, y);
      return;
    }
    const hit = hitTest(x, y);
    canvas.style.cursor = hit.mode === "foot" ? "ns-resize" : hit.mode === "slip" ? "grab" : "ew-resize";
  });

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  canvas.addEventListener("keydown", (e) => {
    const state = getState();
    const idx = state.order.indexOf(state.selectedId);
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      if (idx === -1) return;
      const target = e.key === "ArrowLeft" ? Math.max(0, idx - 1) : Math.min(4, idx + 1);
      if (target !== idx) {
        const next = [...state.order];
        next.splice(idx, 1);
        next.splice(target, 0, state.selectedId);
        setState({ ...state, order: next });
      }
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const delta = e.key === "ArrowDown" ? 1 : -1;
      setState({ ...state, charsPerCol: clamp(state.charsPerCol + delta, 6, 28) });
    } else if (e.key >= "1" && e.key <= "5") {
      e.preventDefault();
      const slot = 5 - Number(e.key);
      if (state.order[slot]) setState({ ...state, selectedId: state.order[slot] });
    } else if (e.key === " ") {
      e.preventDefault();
      triggerScan();
    }
  });

  const ctrl = loop(canvas, render);

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      dirty = true;
      cacheKey = "";
      ctrl.draw();
    }).observe(canvas);
  }

  function triggerScan() {
    if (reducedMotion.matches) {
      setState({ ...getState(), showGuides: true });
      return;
    }
    scanActive = true;
    scanT = 0;
    dirty = true;
    ctrl.draw();
  }

  return {
    draw: () => {
      dirty = true;
      ctrl.draw();
    },
    invalidateFonts: () => {
      cacheKey = "";
      dirty = true;
      ctrl.draw();
    },
    triggerScan,
    getLayout: () => layout,
    getResult: () => result,
  };
}

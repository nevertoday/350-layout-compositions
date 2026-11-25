// 164 目录 版式 — 开场活体目录画布（2D Canvas）与 03 节暗室眼动实验画布
import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, clamp, evaluateContentsLayout } from "./model.js";

// 绘制 164 原海报五枚纯黑几何章徽（圆、四格、三角、三杠、九点）
function drawChapterGlyph(ctx, kind, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  const r = size * 0.44;
  if (kind === "circle") {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "grid4") {
    const g = size * 0.12;
    const cell = (size * 0.82 - g) / 2;
    const x0 = cx - (cell * 2 + g) / 2;
    const y0 = cy - (cell * 2 + g) / 2;
    ctx.fillRect(x0, y0, cell, cell);
    ctx.fillRect(x0 + cell + g, y0, cell, cell);
    ctx.fillRect(x0, y0 + cell + g, cell, cell);
    ctx.fillRect(x0 + cell + g, y0 + cell + g, cell, cell);
  } else if (kind === "triangle") {
    const h = size * 0.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.52);
    ctx.lineTo(cx + size * 0.46, cy + h * 0.48);
    ctx.lineTo(cx - size * 0.46, cy + h * 0.48);
    ctx.closePath();
    ctx.fill();
  } else if (kind === "bars") {
    const bw = size * 0.84;
    const bh = Math.max(2.5, size * 0.16);
    const gap = (size * 0.78 - bh * 3) / 2;
    const x0 = cx - bw / 2;
    const y0 = cy - (bh * 3 + gap * 2) / 2;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(x0, y0 + i * (bh + gap), bw, bh);
    }
  } else {
    // 3x3 点阵
    const step = size * 0.3;
    const dr = Math.max(2, size * 0.095);
    for (let ry = -1; ry <= 1; ry++) {
      for (let rx = -1; rx <= 1; rx++) {
        ctx.beginPath();
        ctx.arc(cx + rx * step, cy + ry * step, dr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

// 绘制 164 原海报电光蓝竖向燕尾章签（01–05）
function drawSwallowtailRibbon(ctx, x, y, w, h, numText, color) {
  ctx.save();
  ctx.fillStyle = color;
  const rh = Math.min(h * 0.68, Math.max(30, w * 1.48));
  const notch = Math.round(w * 0.28);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + rh);
  ctx.lineTo(x + w / 2, y + rh - notch);
  ctx.lineTo(x, y + rh);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `500 ${clamp(Math.round(w * 0.48), 10, 14)}px "DM Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(numText, x + w / 2, y + (rh - notch) * 0.52);
  ctx.restore();
}

// 截断文本防止在极窄试错状态溢出画布边界
function fitText(ctx, str, maxW) {
  if (maxW <= 12) return "";
  if (ctx.measureText(str).width <= maxW) return str;
  let out = str;
  while (out.length > 1 && ctx.measureText(out + "…").width > maxW) {
    out = out.slice(0, -1);
  }
  return out + "…";
}

export function createHeroStage(canvas, getState, onStateChange, onEvalUpdate) {
  const ctx = canvas.getContext("2d");
  let cssW = 800;
  let cssH = 460;
  let dpr = 1;
  let scanPhase = 0.62; // 开场首刻即呈现清晰的跨栏视线推进
  let scanActive = true;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragMoved = false;
  let startSplit = 0.78;
  let lastGeo = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const nw = Math.max(240, Math.round(rect.width));
    const nh = Math.max(220, Math.round(rect.height));
    const ndpr = pixelRatio(2);
    if (nw === cssW && nh === cssH && ndpr === dpr && canvas.width === Math.round(nw * ndpr)) return;
    cssW = nw;
    cssH = nh;
    dpr = ndpr;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }

  function triggerScan(rowIndex) {
    if (typeof rowIndex === "number") {
      onStateChange({ focusIndex: rowIndex }, { silentScan: true });
    }
    scanPhase = 0;
    scanActive = true;
    ctrl.draw();
  }

  function renderFrame(t, dt, { still }) {
    resize();
    const state = getState();
    const ev = evaluateContentsLayout(state, cssW, cssH);
    const geo = ev.geo;
    lastGeo = geo;

    if (still) {
      scanPhase = 0.86;
      scanActive = false;
    } else if (scanActive) {
      scanPhase += dt * 0.42;
      if (scanPhase >= 1) {
        scanPhase = 1;
        // 轻缓呼吸循环只在开场前 6 秒进行，之后静置省电
        if (t < 6.0) scanPhase = 0;
        else scanActive = false;
      }
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. 原海报浅薰衣草底纸与细微出版网格标尺
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, cssW, cssH);

    // 页眉微型出版标尺带
    ctx.fillStyle = PALETTE.paperSoft;
    ctx.fillRect(0, 0, cssW, geo.padTop - 6);
    ctx.strokeStyle = PALETTE.ruleLight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, geo.padTop - 6);
    ctx.lineTo(cssW, geo.padTop - 6);
    ctx.stroke();

    // 顶沿页码/分栏刻度
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.font = `500 11px "DM Mono", monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText("CONTENTS SHEET", geo.padX, (geo.padTop - 6) * 0.5);

    ctx.textAlign = "right";
    ctx.fillStyle = ev.allPass ? PALETTE.ok : PALETTE.err;
    ctx.fillText(
      ev.allPass ? `OK · ${ev.solutionName}` : `${ev.statusTag}`,
      cssW - geo.padX,
      (geo.padTop - 6) * 0.5
    );

    const focusIdx = clamp(state.focusIndex, 0, geo.rows.length - 1);

    // 2. 绘制每一行 / 每一组目录条目
    geo.rows.forEach((row, idx) => {
      const isFocus = idx === focusIdx;
      const g = row.data;

      // 聚焦行淡蓝高亮底带
      if (isFocus) {
        ctx.fillStyle = ev.allPass ? "rgba(15, 27, 230, 0.065)" : "rgba(194, 35, 42, 0.065)";
        ctx.fillRect(row.x, row.y + 1, row.w, row.h - 2);
      }

      // 分隔横线（原海报 5 组带块均有清晰细横线；过拆 15 碎块画杂乱方框）
      if (geo.mode === "banded" && state.signposts !== "off") {
        ctx.strokeStyle = PALETTE.rule;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(row.x, row.y);
        ctx.lineTo(row.x + row.w, row.y);
        ctx.stroke();
      } else if (geo.mode === "micro") {
        ctx.strokeStyle = state.signposts === "noisy" ? "#D64550" : PALETTE.rule;
        ctx.lineWidth = state.signposts === "noisy" ? 1.5 : 1;
        ctx.strokeRect(row.x + 2, row.y + 2, row.w - 4, row.h - 4);
      } else if (geo.mode === "flat") {
        // 未分组流水账：极弱平铺，缺少章节边界
        ctx.strokeStyle = "rgba(140, 137, 166, 0.26)";
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(row.x, row.y + row.h);
        ctx.lineTo(row.x + row.w, row.y + row.h);
        ctx.stroke();
      }

      // 装饰过载试错：叠加刺眼花哨干扰色块与星标
      if (state.signposts === "noisy") {
        const clashPalette = ["#FF6B00", "#00A859", "#D81B60", "#8E24AA", "#FFB300"];
        ctx.fillStyle = clashPalette[idx % clashPalette.length];
        ctx.fillRect(row.x + 3, row.y + 4, 8, Math.max(8, row.h - 8));
        if (geo.mode === "banded") {
          ctx.fillStyle = "#FFF2A6";
          ctx.strokeStyle = "#C2232A";
          ctx.lineWidth = 1.5;
          const bx = Math.min(geo.dividerX - 66, row.titleX + row.titleW + 8);
          if (bx > row.titleX + 18) {
            ctx.fillRect(bx, row.y + 8, 54, 18);
            ctx.strokeRect(bx, row.y + 8, 54, 18);
            ctx.fillStyle = "#C2232A";
            ctx.font = `700 10px "Noto Sans SC", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("★ 必读", bx + 27, row.y + 17);
          }
        }
      }

      const midY = row.y + row.h * 0.5;

      // 原海报燕尾蓝签 + 几何章徽（仅在分组带块 + 锚点开启时）
      if (geo.mode === "banded" && state.signposts !== "off") {
        drawSwallowtailRibbon(
          ctx,
          row.x,
          row.y,
          row.ribbonW,
          row.h,
          g.num,
          state.signposts === "noisy" ? "#D81B60" : PALETTE.cobalt
        );
        const iconCx =
          row.x +
          row.ribbonW +
          (state.folioMode === "left-folio" ? Math.round(row.subFontPx * 3.8) : 0) +
          10 +
          row.iconSize * 0.5;
        drawChapterGlyph(ctx, g.icon, iconCx, midY, row.iconSize, PALETTE.ink);
      }

      // 左置页码模式：在最左形成垂直等宽锚轴
      if (state.folioMode === "left-folio") {
        ctx.fillStyle = PALETTE.cobalt;
        ctx.font = `500 ${Math.max(11, row.subFontPx)}px "DM Mono", monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`P.${g.page}`, row.folioX, geo.mode === "banded" ? row.y + row.h * 0.34 : midY);
      }

      // 绘制标题（带单真源字号与防溢检测）
      const titleWeight = state.scaleRatio >= 1.25 ? 900 : 400;
      const titleColor =
        geo.mode === "banded" && state.scaleRatio >= 1.25 ? PALETTE.cobalt : PALETTE.inkBody;
      ctx.fillStyle = titleColor;
      ctx.font = `${titleWeight} ${row.titleFontPx}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      const titleY = geo.mode === "banded" ? row.y + Math.min(row.h * 0.31, row.titleFontPx * 0.85 + 8) : midY;
      const maxTitleDrawW = Math.max(24, geo.dividerX - row.titleX - (state.folioMode === "tight" ? 52 : 10));
      const drawnTitle = fitText(ctx, g.zh, maxTitleDrawW);
      ctx.fillText(drawnTitle, row.titleX, titleY);

      // 若左栏过窄压迫主标题，在撞线处给出克制红框警示
      if (row.titleClipped && geo.mode === "banded") {
        ctx.strokeStyle = PALETTE.err;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 2]);
        ctx.strokeRect(row.titleX - 3, titleY - row.titleFontPx * 0.62, maxTitleDrawW + 5, row.titleFontPx * 1.24);
        ctx.setLineDash([]);
      }

      // 分组带块模式：英文小标 + 简述 + 右侧竖线后的三子目
      if (geo.mode === "banded") {
        const enY = titleY + row.titleFontPx * 0.66 + 4;
        if (enY < row.y + row.h - 10) {
          ctx.fillStyle = PALETTE.cobaltInk;
          ctx.font = `700 ${Math.max(10, row.subFontPx - 2)}px "Bricolage Grotesque", sans-serif`;
          ctx.fillText(fitText(ctx, g.en, Math.max(24, geo.dividerX - row.titleX - 12)), row.titleX, enY);
        }

        const briefY = enY + row.subFontPx + 4;
        if (briefY < row.y + row.h - 8 && row.h >= 66) {
          ctx.fillStyle = PALETTE.inkMuted;
          ctx.font = `400 ${Math.max(10, row.subFontPx - 1)}px "Noto Sans SC", sans-serif`;
          ctx.fillText(fitText(ctx, g.brief, Math.max(24, geo.dividerX - row.titleX - 12)), row.titleX, briefY);
        }

        // 右侧子目列表（与原海报一致：电光蓝圆点 + 子目文字）
        const subs = g.subs || [];
        const subStep = (row.h - 16) / Math.max(1, subs.length);
        subs.forEach((s, si) => {
          const sy = row.y + 10 + subStep * (si + 0.5);
          if (row.subMaxW > 36) {
            ctx.fillStyle = PALETTE.cobalt;
            ctx.beginPath();
            ctx.arc(row.subX + 3, sy, 2.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = PALETTE.inkBody;
            ctx.font = `400 ${row.subFontPx}px "Noto Sans SC", sans-serif`;
            ctx.textAlign = "left";
            const subSpace =
              state.folioMode === "right-orphan" || state.folioMode === "leader"
                ? Math.max(18, row.folioX - (row.subX + 12) - 8)
                : Math.max(18, row.subMaxW - 14);
            ctx.fillText(fitText(ctx, s.title, subSpace), row.subX + 11, sy);
          }
        });
      }

      // 页码绘制（紧贴 / 疏点线 / 右齐无引线）
      const folioY = geo.mode === "banded" ? titleY : midY;
      if (state.folioMode === "tight") {
        ctx.fillStyle = PALETTE.cobalt;
        ctx.font = `500 ${Math.max(11, row.subFontPx)}px "DM Mono", monospace`;
        ctx.textAlign = "left";
        ctx.fillText(`P.${g.page}`, row.folioX, folioY);
      } else if (state.folioMode === "leader" || state.folioMode === "right-orphan") {
        // 疏点线引路
        if (state.folioMode === "leader") {
          const titleActualW = Math.min(ctx.measureText(drawnTitle).width, maxTitleDrawW);
          const lx0 =
            geo.mode === "banded"
              ? Math.min(geo.dividerX - 6, row.titleX + titleActualW + 10)
              : row.titleX + Math.min(row.titleW, geo.innerW * 0.52) + 10;
          const lx1 = row.folioX - 8;
          if (lx1 - lx0 > 12) {
            ctx.save();
            ctx.strokeStyle = PALETTE.rule;
            ctx.lineWidth = 1.4;
            ctx.setLineDash([2, 6]);
            ctx.beginPath();
            ctx.moveTo(lx0, folioY + 2);
            ctx.lineTo(lx1, folioY + 2);
            ctx.stroke();
            ctx.restore();
          }
        }
        ctx.fillStyle = state.folioMode === "right-orphan" ? PALETTE.inkBody : PALETTE.cobalt;
        ctx.font =
          state.folioMode === "right-orphan"
            ? `400 ${Math.max(11, row.subFontPx)}px "EB Garamond", serif`
            : `500 ${Math.max(11, row.subFontPx)}px "DM Mono", monospace`;
        ctx.textAlign = "left";
        ctx.fillText(g.page, row.folioX, folioY);
      }
    });

    // 3. 绘制电光蓝可拖动竖分栏尺（核心交互手柄）
    const splitPct = Math.round(state.colSplit * 100);
    const splitBad =
      (geo.mode === "banded" && (state.colSplit < 0.40 || state.colSplit > 0.74)) ||
      (state.folioMode === "right-orphan" && geo.gapRatio > 0.24);
    const rulerColor = splitBad ? PALETTE.err : PALETTE.cobalt;

    ctx.save();
    ctx.strokeStyle = rulerColor;
    ctx.lineWidth = dragging ? 2.5 : 1.75;
    ctx.setLineDash(dragging ? [] : [5, 4]);
    ctx.beginPath();
    ctx.moveTo(geo.dividerX, geo.padTop - 4);
    ctx.lineTo(geo.dividerX, cssH - geo.padBottom + 4);
    ctx.stroke();
    ctx.setLineDash([]);

    // 竖尺中段触控抓柄
    const gripY = geo.padTop + geo.innerH * 0.5;
    const gripW = 22;
    const gripH = 44;
    ctx.fillStyle = rulerColor;
    ctx.fillRect(geo.dividerX - gripW / 2, gripY - gripH / 2, gripW, gripH);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(geo.dividerX - 3, gripY - 9);
    ctx.lineTo(geo.dividerX - 3, gripY + 9);
    ctx.moveTo(geo.dividerX + 3, gripY - 9);
    ctx.lineTo(geo.dividerX + 3, gripY + 9);
    ctx.stroke();

    // 顶部分栏读数胶囊：置于竖尺底端，绝不与顶部页眉文字碰撞
    const pillW = 58;
    const pillX = clamp(geo.dividerX - pillW / 2, geo.padX, cssW - geo.padX - pillW);
    const pillY = cssH - geo.padBottom + 1;
    ctx.fillStyle = rulerColor;
    ctx.fillRect(pillX, pillY, pillW, 18);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `500 11px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`< ${splitPct}% >`, pillX + pillW / 2, pillY + 9);
    ctx.restore();

    // 4. 扫读寻页实测射线：从当前焦点章名右端起跳（绝不遮盖文字），一路扫向目标页码
    const fRow = geo.rows[focusIdx];
    if (fRow) {
      ctx.save();
      const titleWeight = state.scaleRatio >= 1.25 ? 900 : 400;
      ctx.font = `${titleWeight} ${fRow.titleFontPx}px "Noto Sans SC", sans-serif`;
      const maxTitleDrawW = Math.max(24, geo.dividerX - fRow.titleX - (state.folioMode === "tight" ? 52 : 10));
      const measuredTitleW = Math.min(ctx.measureText(fRow.data.zh).width, maxTitleDrawW);
      const startY = geo.mode === "banded" ? fRow.y + Math.min(fRow.h * 0.31, fRow.titleFontPx * 0.85 + 8) : fRow.y + fRow.h * 0.5;
      const startX =
        state.folioMode === "left-folio"
          ? fRow.folioX + fRow.folioW + 4
          : Math.min(fRow.titleX + measuredTitleW + 10, cssW - geo.padX - 36);
      const endX =
        state.folioMode === "left-folio"
          ? Math.max(startX + 12, fRow.titleX - 4)
          : fRow.folioX - 6;
      const driftPx = ev.geo.rowDriftLines > 0 ? Math.min(fRow.h * 1.15, ev.geo.rowDriftLines * fRow.h) : 0;
      const targetY = clamp(startY + driftPx, geo.padTop + 10, cssH - geo.padBottom - 8);

      const prog = clamp(scanPhase, 0.08, 1);
      const curX = startX + (endX - startX) * prog;
      const curY = startY + (targetY - startY) * (prog * prog);

      const rayColor = driftPx > 4 ? PALETTE.err : PALETTE.cobalt;

      // 淡虚线预告整条扫读轨迹，让开场每一帧都清晰可读
      ctx.strokeStyle = driftPx > 4 ? "rgba(194, 35, 42, 0.32)" : "rgba(15, 27, 230, 0.28)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      if (driftPx > 4) {
        const ctrlX = startX + (endX - startX) * 0.56;
        ctx.quadraticCurveTo(ctrlX, startY, endX, targetY);
      } else {
        ctx.lineTo(endX, targetY);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 实线扫读进度束
      ctx.strokeStyle = rayColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      if (driftPx > 4) {
        const ctrlX = startX + (curX - startX) * 0.56;
        ctx.quadraticCurveTo(ctrlX, startY, curX, curY);
      } else {
        ctx.lineTo(curX, curY);
      }
      ctx.stroke();

      // 起点锚点与前端游标
      ctx.fillStyle = rayColor;
      ctx.beginPath();
      ctx.arc(startX, startY, 3.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(curX, curY, 4.6, 0, Math.PI * 2);
      ctx.fill();

      // 若存在串行偏差，绘制清晰红标
      if (driftPx > 4) {
        const tagText = `串行偏离 ±${ev.geo.rowDriftLines.toFixed(1)} 行`;
        ctx.font = `700 11px "Noto Sans SC", sans-serif`;
        const tw = ctx.measureText(tagText).width + 14;
        const tx = clamp(endX - tw - 6, geo.padX + 6, cssW - geo.padX - tw - 4);
        const ty = clamp(targetY + 8, geo.padTop + 6, cssH - geo.padBottom - 24);
        ctx.fillStyle = PALETTE.err;
        ctx.fillRect(tx, ty, tw, 20);
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tagText, tx + tw / 2, ty + 10);
      } else if (ev.allPass) {
        const tagText = `直达 P.${fRow.data.page}`;
        ctx.font = `500 11px "DM Mono", monospace`;
        const tw = ctx.measureText(tagText).width + 14;
        const tx = clamp(endX - tw / 2, geo.padX + 6, cssW - geo.padX - tw - 4);
        const ty = clamp(targetY - 26, geo.padTop + 4, cssH - geo.padBottom - 24);
        ctx.fillStyle = PALETTE.ok;
        ctx.fillRect(tx, ty, tw, 20);
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tagText, tx + tw / 2, ty + 10);
      }
      ctx.restore();
    }

    ctx.restore();
    onEvalUpdate(ev);
  }

  // ---------- 指针与触屏交互（兼容 perf.mjs 的 touchStart/touchMove/touchEnd 与鼠标拖动） ----------
  function getLocalPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function applySplitFromDelta(dx) {
    const innerW = lastGeo ? lastGeo.innerW : Math.max(200, cssW - 40);
    let next = clamp(startSplit + dx / innerW, 0.24, 0.82);
    // 轻柔吸附到原海报平衡比例 0.63
    if (Math.abs(next - 0.63) < 0.015) next = 0.63;
    onStateChange({ colSplit: +next.toFixed(3) }, { silentScan: true });
    scanPhase = 0.88;
    ctrl.draw();
  }

  function pickRowAt(y) {
    if (!lastGeo) return -1;
    for (const r of lastGeo.rows) {
      if (y >= r.y && y <= r.y + r.h) return r.index;
    }
    return -1;
  }

  // 鼠标 / PointerEvent
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // touch 由下方 touch 监听器统一承接
    const p = getLocalPos(e.clientX, e.clientY);
    dragging = true;
    dragMoved = false;
    dragStartX = p.x;
    dragStartY = p.y;
    startSplit = getState().colSplit;
    canvas.setPointerCapture?.(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" || !dragging) return;
    const p = getLocalPos(e.clientX, e.clientY);
    const dx = p.x - dragStartX;
    if (Math.abs(dx) > 3) dragMoved = true;
    if (dragMoved) applySplitFromDelta(dx);
  });

  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch" || !dragging) return;
    const p = getLocalPos(e.clientX, e.clientY);
    dragging = false;
    if (!dragMoved) {
      const idx = pickRowAt(p.y);
      if (idx >= 0) triggerScan(idx);
    } else {
      ctrl.draw();
    }
  });

  canvas.addEventListener("pointercancel", () => {
    dragging = false;
  });

  // 触屏 TouchEvent（同时保证竖向可滚动，且完美接住 perf.mjs 横向拖动）
  let touchAxis = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t0 = e.touches[0];
      const p = getLocalPos(t0.clientX, t0.clientY);
      dragging = true;
      dragMoved = false;
      touchAxis = null;
      dragStartX = p.x;
      dragStartY = p.y;
      startSplit = getState().colSplit;
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging || !e.touches.length) return;
      const t0 = e.touches[0];
      const p = getLocalPos(t0.clientX, t0.clientY);
      const dx = p.x - dragStartX;
      const dy = p.y - dragStartY;
      if (!touchAxis && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        touchAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
      if (touchAxis === "x") {
        e.preventDefault();
        dragMoved = true;
        applySplitFromDelta(dx);
      }
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchend",
    (e) => {
      if (!dragging) return;
      dragging = false;
      if (!dragMoved && e.changedTouches.length) {
        const p = getLocalPos(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        const idx = pickRowAt(p.y);
        if (idx >= 0) triggerScan(idx);
      }
      touchAxis = null;
    },
    { passive: true }
  );

  // 键盘微调：左右调分栏，上下切换扫读行
  canvas.addEventListener("keydown", (e) => {
    const s = getState();
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onStateChange({ colSplit: +clamp(s.colSplit - 0.03, 0.24, 0.82).toFixed(3) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onStateChange({ colSplit: +clamp(s.colSplit + 0.03, 0.24, 0.82).toFixed(3) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const total = lastGeo ? lastGeo.rows.length : 5;
      triggerScan((s.focusIndex - 1 + total) % total);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const total = lastGeo ? lastGeo.rows.length : 5;
      triggerScan((s.focusIndex + 1) % total);
    }
  });

  const ctrl = loop(canvas, renderFrame);
  window.addEventListener("resize", () => ctrl.draw());

  return {
    redraw: () => ctrl.draw(),
    triggerScan,
  };
}

// =========================================================
// 第 03 节：断眼暗室 2D Canvas 演示引擎
// =========================================================
export function createDarkroomStage(canvas, getCaseId) {
  const ctx = canvas.getContext("2d");
  let w = 640;
  let h = 400;
  let dpr = 1;
  let phase = 0.72;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const nw = Math.max(240, Math.round(r.width));
    const nh = Math.max(180, Math.round(r.height));
    const ndpr = pixelRatio(2);
    if (nw === w && nh === h && ndpr === dpr && canvas.width === Math.round(nw * ndpr)) return;
    w = nw;
    h = nh;
    dpr = ndpr;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  function render(t, dt, { still }) {
    resize();
    if (still) phase = 0.88;
    else {
      phase = (phase + dt * 0.34) % 1.25;
    }
    const p = clamp(phase, 0, 1);
    const kind = getCaseId();

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 暗室网格底
    ctx.fillStyle = "#060A33";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(149, 163, 255, 0.12)";
    ctx.lineWidth = 1;
    const step = 28;
    for (let x = step; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = step; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 纸页白板
    const px = Math.round(w * 0.07);
    const py = Math.round(h * 0.12);
    const pw = w - px * 2;
    const ph = h - py * 2;
    ctx.fillStyle = "#F4F3FC";
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = "#95A3FF";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px, py, pw, ph);

    const fontPx = clamp(Math.round(w * 0.024), 11, 15);

    if (kind === "chasm" || kind === "denseDots") {
      const items = [
        ["01 导言与结构", "006"],
        ["02 经典案例拆解", "022"],
        ["03 分组与层级", "044"],
        ["04 动手编排练习", "068"],
        ["05 拓展视野书单", "090"],
      ];
      const rowH = (ph - 36) / items.length;
      items.forEach(([title, pg], idx) => {
        const y = py + 24 + idx * rowH + rowH * 0.45;
        ctx.fillStyle = idx === 2 ? "#0F1BE6" : "#141626";
        ctx.font = `700 ${fontPx}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(title, px + 18, y);

        ctx.font = `500 ${fontPx}px "DM Mono", monospace`;
        ctx.textAlign = "right";
        ctx.fillText(pg, px + pw - 18, y);

        if (kind === "denseDots") {
          ctx.fillStyle = "#0D1020";
          ctx.font = `900 ${fontPx}px "DM Mono", monospace`;
          ctx.textAlign = "left";
          const startDot = px + Math.round(pw * 0.34);
          const endDot = px + pw - 56;
          for (let dx = startDot; dx < endDot; dx += 6) {
            ctx.fillRect(dx, y + 1, 3.2, 3.2);
          }
        }
      });

      const y2 = py + 24 + 2 * rowH + rowH * 0.45;
      const sx = px + Math.round(pw * 0.31);
      const ex = px + pw - 48;
      if (kind === "chasm") {
        // 裸白跨栏：完整淡虚线轨迹 + 动态行进红束，确保每一刻都能一眼看清串行落到 068
        const wrongY = py + 24 + 3 * rowH + rowH * 0.45;
        const ctrlX = sx + (ex - sx) * 0.56;
        ctx.strokeStyle = "rgba(194, 35, 42, 0.36)";
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(sx, y2);
        ctx.quadraticCurveTo(ctrlX, y2, ex, wrongY);
        ctx.stroke();
        ctx.setLineDash([]);

        const cx = sx + (ex - sx) * p;
        const cy = y2 + (wrongY - y2) * (p * p);
        ctx.strokeStyle = "#C2232A";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(sx, y2);
        ctx.quadraticCurveTo(sx + (cx - sx) * 0.56, y2, cx, cy);
        ctx.stroke();

        ctx.fillStyle = "#C2232A";
        ctx.beginPath();
        ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#C2232A";
        ctx.fillRect(px + pw - 134, wrongY - 12, 82, 22);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 11px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("误看成 068!", px + pw - 93, wrongY - 1);
      } else {
        // 过密点线噪点警示
        ctx.strokeStyle = "#C2232A";
        ctx.lineWidth = 2;
        ctx.strokeRect(px + Math.round(pw * 0.33), py + 18, Math.round(pw * 0.54), ph - 36);
        ctx.fillStyle = "#C2232A";
        ctx.fillRect(px + Math.round(pw * 0.38), py + ph - 32, 168, 22);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 11px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("粗密黑点条纹盖过章名", px + Math.round(pw * 0.38) + 84, py + ph - 21);
      }
    } else if (kind === "deepNest") {
      const lines = [
        [0, "1. 方法论总纲", "044"],
        [1, "1.1 信息分组策略", "046"],
        [2, "1.1.1 按主题聚类步骤", "047"],
        [3, "1.1.1.1 卡片初筛方法", "048"],
        [4, "1.1.1.1.a 异常条目归档", "049"],
        [4, "1.1.1.1.b 跨章重复合并", "050"],
        [3, "1.1.1.2 复核标签命名", "051"],
      ];
      const rowH = (ph - 26) / lines.length;
      lines.forEach(([lvl, txt, pg], i) => {
        const y = py + 18 + i * rowH + rowH * 0.5;
        const indent = px + 16 + lvl * Math.round(pw * 0.085);
        ctx.fillStyle = lvl >= 3 ? "#C2232A" : "#141626";
        ctx.font = `${lvl === 0 ? 900 : 400} ${Math.max(10, fontPx - 1)}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(fitText(ctx, txt, px + pw - indent - 44), indent, y);
        ctx.font = `500 11px "DM Mono", monospace`;
        ctx.textAlign = "right";
        ctx.fillText(pg, px + pw - 16, y);
      });
      // 过深阶梯红线
      ctx.strokeStyle = "#C2232A";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(px + 16 + 3 * Math.round(pw * 0.085), py + 12);
      ctx.lineTo(px + 16 + 3 * Math.round(pw * 0.085), py + ph - 12);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // mismatch：左半目录页 vs 右半正文页口径脱节
      const mid = px + pw * 0.48;
      ctx.strokeStyle = "#8C89A6";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mid, py + 12);
      ctx.lineTo(mid, py + ph - 12);
      ctx.stroke();

      ctx.fillStyle = "#0F1BE6";
      ctx.font = `700 12px "DM Mono", monospace`;
      ctx.textAlign = "left";
      ctx.fillText("CONTENTS (P.02)", px + 16, py + 24);
      ctx.fillText("BODY PAGE (P.44)", mid + 16, py + 24);

      ctx.fillStyle = "#141626";
      ctx.font = `700 ${fontPx}px "Noto Sans SC", sans-serif`;
      ctx.fillText("03 方法：分组与层级", px + 16, py + ph * 0.46);
      ctx.fillStyle = "#C2232A";
      ctx.fillText("第三回 · 化繁为简之秘", mid + 16, py + ph * 0.46);

      // 动态断连箭头
      const ax0 = px + 16 + Math.min(pw * 0.36, 155);
      const ax1 = mid + 12;
      const ay = py + ph * 0.46;
      ctx.strokeStyle = "#C2232A";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(ax0, ay);
      ctx.lineTo(ax0 + (ax1 - ax0) * p, ay);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#C2232A";
      ctx.fillRect(px + pw * 0.24, py + ph * 0.68, pw * 0.52, 26);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 12px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("名称不对应：读者怀疑翻错了页码", px + pw * 0.5, py + ph * 0.68 + 13);
    }

    ctx.restore();
  }

  const ctrl = loop(canvas, render);
  window.addEventListener("resize", () => ctrl.draw());
  return {
    replay: () => {
      phase = 0;
      ctrl.draw();
    },
    redraw: () => ctrl.draw(),
  };
}

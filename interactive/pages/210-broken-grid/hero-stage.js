// 210 破格网格 — 开场 5×6 活体破格排印张 2D Canvas 引擎（高性能离屏底格缓存 + 零强制回流）
// 1:1 承袭 210 原海报 5×6 虚线网格、朱红圆、倾斜纯黑块、跨栏朱红横块、克莱因蓝 × 与规则引线。

import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";
import {
  COLS,
  ROWS,
  PAD_X,
  PAD_Y,
  SHEET_W,
  SHEET_H,
  THEMES,
  HOME_SLOTS,
  MODULE_ORDER,
  MODULE_META,
  getRenderedBox,
  pointInModule,
  clampModule,
} from "./model.js";

export function mountHeroStage(canvas, getState, getEval, callbacks) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const gridCache = document.createElement("canvas");
  const gctx = gridCache.getContext("2d", { alpha: false });

  let cssW = 600;
  let cssH = 520;
  let dpr = 1;
  let cellPx = 72;
  let originX = 48;
  let originY = 40;
  let cachedRect = null;
  let gridCacheKey = "";
  let dirty = true;

  // 平滑插值态（切换预设或点手法时丝滑过渡；拖动时零延迟贴手）
  const anim = {};
  for (const id of MODULE_ORDER) {
    anim[id] = { ...getRenderedBox(id, getState()) };
  }

  let draggingId = null;
  let dragStartGrid = null;
  let dragOrigMod = null;
  let pointerId = null;
  let pointerStartPx = null;
  let isPanScrolling = false;
  let hoverId = null;

  function measure() {
    const rect = canvas.getBoundingClientRect();
    cachedRect = rect;
    const nw = Math.max(260, Math.round(rect.width));
    const nh = Math.max(240, Math.round(rect.height));
    // 移动端软件渲染下将像素比封顶 1.5，兼顾清晰度与 ≥50fps 流畅度
    const ndpr = nw <= 520 ? pixelRatio(1.5) : pixelRatio(2);
    if (nw !== cssW || nh !== cssH || ndpr !== dpr || canvas.width !== Math.round(nw * ndpr)) {
      cssW = nw;
      cssH = nh;
      dpr = ndpr;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      const padPx = Math.max(10, Math.min(18, cssW * 0.025));
      const scaleX = (cssW - padPx * 2) / SHEET_W;
      const scaleY = (cssH - padPx * 2) / SHEET_H;
      cellPx = Math.min(scaleX, scaleY);
      const totalW = SHEET_W * cellPx;
      const totalH = SHEET_H * cellPx;
      originX = (cssW - totalW) / 2 + PAD_X * cellPx;
      originY = (cssH - totalH) / 2 + PAD_Y * cellPx;
      gridCacheKey = "";
      dirty = true;
    }
  }

  const gxToPx = (gx) => originX + gx * cellPx;
  const gyToPx = (gy) => originY + gy * cellPx;
  const pxToGrid = (px, py) => ({
    gx: (px - originX) / cellPx,
    gy: (py - originY) / cellPx,
  });

  function ensureGridCache(state) {
    const key = `${cssW}x${cssH}@${dpr}|${state.showGuides}|${state.gridIntegrity}`;
    if (gridCacheKey === key) return;
    gridCacheKey = key;
    gridCache.width = canvas.width;
    gridCache.height = canvas.height;

    gctx.save();
    gctx.scale(dpr, dpr);

    const x0 = gxToPx(0);
    const y0 = gyToPx(0);
    const w = COLS * cellPx;
    const h = ROWS * cellPx;

    // 暖米印刷原纸底
    gctx.fillStyle = PALETTE.paper;
    gctx.fillRect(0, 0, cssW, cssH);

    // 四隅瑞士印刷裁切角标
    gctx.strokeStyle = "rgba(18, 18, 16, 0.22)";
    gctx.lineWidth = 1;
    const mark = Math.max(7, cellPx * 0.14);
    const corners = [
      [x0 - 8, y0 - 8, -1, -1],
      [x0 + w + 8, y0 - 8, 1, -1],
      [x0 - 8, y0 + h + 8, -1, 1],
      [x0 + w + 8, y0 + h + 8, 1, 1],
    ];
    gctx.beginPath();
    for (const [cx, cy, sx, sy] of corners) {
      gctx.moveTo(cx, cy);
      gctx.lineTo(cx + sx * mark, cy);
      gctx.moveTo(cx, cy);
      gctx.lineTo(cx, cy + sy * mark);
    }
    gctx.stroke();

    if (state.showGuides) {
      const shattered = state.gridIntegrity === "shattered";
      gctx.strokeStyle = shattered ? "rgba(180, 30, 18, 0.36)" : "rgba(110, 105, 95, 0.56)";
      gctx.lineWidth = shattered ? 1.1 : 1;
      gctx.setLineDash(shattered ? [3, 6] : [4, 4]);

      gctx.beginPath();
      for (let c = 0; c <= COLS; c++) {
        const wobble = shattered ? Math.sin(c * 2.1) * cellPx * 0.14 : 0;
        const x = Math.round(gxToPx(c) + wobble) + 0.5;
        gctx.moveTo(x, y0);
        gctx.lineTo(x, y0 + h);
      }
      for (let r = 0; r <= ROWS; r++) {
        const wobble = shattered ? Math.cos(r * 1.9) * cellPx * 0.12 : 0;
        const y = Math.round(gyToPx(r) + wobble) + 0.5;
        gctx.moveTo(x0, y);
        gctx.lineTo(x0 + w, y);
      }
      gctx.stroke();
      gctx.setLineDash([]);

      // 印刷坐标标号 01–05 / A–F
      gctx.fillStyle = shattered ? PALETTE.err : "rgba(69, 66, 60, 0.72)";
      gctx.font = `700 ${Math.max(10, Math.round(cellPx * 0.14))}px "Space Mono", monospace`;
      gctx.textAlign = "center";
      gctx.textBaseline = "bottom";
      for (let c = 0; c < COLS; c++) {
        gctx.fillText(`0${c + 1}`, gxToPx(c + 0.5), y0 - 5);
      }
      gctx.textAlign = "right";
      gctx.textBaseline = "middle";
      const rowLabels = ["A", "B", "C", "D", "E", "F"];
      for (let r = 0; r < ROWS; r++) {
        gctx.fillText(rowLabels[r], x0 - 6, gyToPx(r + 0.5));
      }

      // 原海报克莱因蓝 × 锚点（精准落在 (3, 2) 空白格交点）
      const crossX = gxToPx(3);
      const crossY = gyToPx(2);
      const cr = Math.max(9, cellPx * 0.21);
      gctx.save();
      gctx.translate(crossX + (shattered ? 9 : 0), crossY + (shattered ? -7 : 0));
      if (shattered) gctx.rotate(0.22);
      gctx.strokeStyle = shattered ? PALETTE.err : PALETTE.blue;
      gctx.lineWidth = Math.max(2.4, cellPx * 0.052);
      gctx.lineCap = "square";
      gctx.beginPath();
      gctx.moveTo(-cr, -cr);
      gctx.lineTo(cr, cr);
      gctx.moveTo(cr, -cr);
      gctx.lineTo(-cr, cr);
      gctx.stroke();
      gctx.restore();
    }

    gctx.restore();
  }

  function hitTest(gx, gy) {
    const state = getState();
    const ordered = [...MODULE_ORDER].sort((a, b) => MODULE_META[b].z - MODULE_META[a].z);
    for (const id of ordered) {
      const box = anim[id] || getRenderedBox(id, state);
      if (pointInModule(id, box, gx, gy)) return id;
    }
    return null;
  }

  function stepAnim(dt, still) {
    const state = getState();
    if (still) {
      let moved = false;
      for (const id of MODULE_ORDER) {
        const target = getRenderedBox(id, state);
        const cur = anim[id];
        if (
          cur.gx !== target.gx ||
          cur.gy !== target.gy ||
          cur.gw !== target.gw ||
          cur.gh !== target.gh ||
          cur.rot !== target.rot
        ) {
          Object.assign(cur, target);
          moved = true;
        }
      }
      return moved;
    }
    const k = Math.min(1, Math.max(0.18, dt * 16));
    let moving = false;
    for (const id of MODULE_ORDER) {
      const target = getRenderedBox(id, state);
      const cur = anim[id];
      if (draggingId === id) {
        if (
          cur.gx !== target.gx ||
          cur.gy !== target.gy ||
          cur.gw !== target.gw ||
          cur.gh !== target.gh ||
          cur.rot !== target.rot
        ) {
          Object.assign(cur, target);
          moving = true;
        }
      } else {
        const diff =
          Math.abs(target.gx - cur.gx) +
          Math.abs(target.gy - cur.gy) +
          Math.abs(target.gw - cur.gw) +
          Math.abs(target.gh - cur.gh) +
          Math.abs(target.rot - cur.rot) * 0.04;
        if (diff > 0.001) {
          cur.gx += (target.gx - cur.gx) * k;
          cur.gy += (target.gy - cur.gy) * k;
          cur.gw += (target.gw - cur.gw) * k;
          cur.gh += (target.gh - cur.gh) * k;
          cur.rot += (target.rot - cur.rot) * k;
          moving = true;
        } else if (diff > 0) {
          Object.assign(cur, target);
        }
      }
    }
    return moving;
  }

  function drawGhostAndRuler(id, detail) {
    const home = HOME_SLOTS[id];
    const box = anim[id];
    const hx = gxToPx(home.gx);
    const hy = gyToPx(home.gy);
    const hw = home.gw * cellPx;
    const hh = home.gh * cellPx;

    const moved =
      Math.abs(box.gx - home.gx) > 0.04 ||
      Math.abs(box.gy - home.gy) > 0.04 ||
      Math.abs(box.gw - home.gw) > 0.06 ||
      Math.abs(box.rot) > 1;
    if (!moved) return;

    ctx.save();
    ctx.strokeStyle = detail.microSlip ? PALETTE.err : PALETTE.blue;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(hx + 1, hy + 1, hw - 2, hh - 2);
    ctx.setLineDash([]);

    const hcx = hx + hw / 2;
    const hcy = hy + hh / 2;
    const ccx = gxToPx(box.gx + box.gw / 2);
    const ccy = gyToPx(box.gy + box.gh / 2);
    ctx.beginPath();
    ctx.moveTo(hcx, hcy);
    ctx.lineTo(ccx, ccy);
    ctx.stroke();

    ctx.fillStyle = detail.microSlip ? PALETTE.err : PALETTE.blue;
    ctx.beginPath();
    ctx.arc(hcx, hcy, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawModule(id, state, ev) {
    const theme = THEMES[state.theme];
    const box = anim[id];
    const detail = ev.details[id];
    const isSel = state.selected === id;
    const isHover = hoverId === id && !draggingId;

    const px = gxToPx(box.gx);
    const py = gyToPx(box.gy);
    const pw = box.gw * cellPx;
    const ph = box.gh * cellPx;
    const cx = px + pw / 2;
    const cy = py + ph / 2;

    ctx.save();
    ctx.translate(cx, cy);
    if (box.rot) ctx.rotate((box.rot * Math.PI) / 180);

    if (id === "circle") {
      const r = Math.min(pw, ph) / 2;
      ctx.fillStyle = PALETTE.red;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      if (state.theme !== "poster") {
        ctx.fillStyle = PALETTE.paperBright;
        ctx.font = `400 ${Math.max(16, Math.round(r * 0.48))}px "Anton", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(theme.circleCaption, 0, 1);
      }
    } else if (id === "blackBlock") {
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);

      if (state.theme !== "poster") {
        ctx.strokeStyle = "rgba(247, 244, 236, 0.25)";
        ctx.lineWidth = 1;
        ctx.strokeRect(-pw / 2 + 8, -ph / 2 + 8, pw - 16, ph - 16);
        ctx.fillStyle = "rgba(247, 244, 236, 0.85)";
        ctx.font = `700 ${Math.max(10, Math.round(cellPx * 0.14))}px "Space Mono", monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(theme.blackCaption, -pw / 2 + 12, -ph / 2 + 12);
      }
    } else if (id === "redBar") {
      ctx.fillStyle = PALETTE.red;
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      if (state.theme !== "poster") {
        ctx.fillStyle = PALETTE.paperBright;
        ctx.font = `400 ${Math.max(14, Math.round(Math.min(pw, ph) * 0.34))}px "Anton", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(theme.redCaption, -pw / 2 + 10, ph / 2 - 8);
      }
    } else if (id === "headline") {
      const pad = Math.max(4, cellPx * 0.08);
      ctx.fillStyle = isSel || isHover ? "rgba(255, 255, 255, 0.55)" : "rgba(247, 244, 236, 0.42)";
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);

      const line1Size = Math.max(15, Math.min(pw * 0.185, ph * 0.28));
      const line2Size = Math.max(20, Math.min(pw * 0.26, ph * 0.42));
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      ctx.fillStyle = PALETTE.ink;
      ctx.font = `900 ${Math.round(line1Size)}px "Noto Sans SC", sans-serif`;
      ctx.fillText(theme.headlineTop, -pw / 2 + pad, -ph / 2 + ph * 0.12);

      ctx.fillStyle = PALETTE.red;
      ctx.font = `900 ${Math.round(line2Size)}px "Noto Sans SC", sans-serif`;
      ctx.fillText(theme.headlineAccent, -pw / 2 + pad, -ph / 2 + ph * 0.46);
    } else if (id === "gridNotes") {
      const pad = Math.max(4, cellPx * 0.08);
      ctx.fillStyle = isSel || isHover ? "rgba(255, 255, 255, 0.58)" : "rgba(247, 244, 236, 0.48)";
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      const fs = Math.max(10, Math.min(pw * 0.115, ph * 0.25));
      ctx.font = `700 ${Math.round(fs)}px "Archivo", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      theme.notesLines.forEach((line, idx) => {
        ctx.fillStyle = idx === 2 ? PALETTE.redSafe : PALETTE.inkBody;
        ctx.fillText(line, -pw / 2 + pad, -ph / 2 + pad + idx * (fs * 1.24));
      });
    } else if (id === "metaBar") {
      ctx.fillStyle = "rgba(18, 18, 16, 0.06)";
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(-pw / 2, -ph / 2, pw, 2.5);
      const fs = Math.max(10, Math.min(pw * 0.085, ph * 0.22));
      ctx.font = `700 ${Math.round(fs)}px "Space Mono", monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(theme.metaTag, -pw / 2 + 6, -ph / 2 + 8, pw - 12);
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.font = `400 ${Math.max(10, Math.round(fs * 0.9))}px "Space Mono", monospace`;
      ctx.fillText(theme.metaSub, -pw / 2 + 6, -ph / 2 + 10 + fs * 1.28, pw - 12);
    }

    if (isSel || isHover || detail.microSlip) {
      const col = detail.microSlip
        ? PALETTE.err
        : isSel
          ? PALETTE.blue
          : "rgba(15, 68, 235, 0.55)";
      ctx.strokeStyle = col;
      ctx.lineWidth = isSel ? 2 : 1.3;
      if (id === "circle") {
        const r = Math.min(pw, ph) / 2 + 3;
        if (!isSel) ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        if (!isSel) ctx.setLineDash([]);
      } else {
        if (!isSel) ctx.setLineDash([4, 4]);
        ctx.strokeRect(-pw / 2 - 2, -ph / 2 - 2, pw + 4, ph + 4);
        if (!isSel) ctx.setLineDash([]);
      }

      if (isSel) {
        const tag = detail.microSlip
          ? `${detail.short} · 仅偏 ${detail.offMax.toFixed(2)}格`
          : detail.isBroken
            ? `${detail.short} · ${detail.moves[0]}`
            : `${detail.short} · 贴格守序`;
        ctx.font = `700 11px "Noto Sans SC", sans-serif`;
        const tw = ctx.measureText(tag).width + 14;
        const th = 20;
        const placeInside = py < originY + 8;
        const ty = placeInside ? ph / 2 - th - 6 : -ph / 2 - th - 6;
        ctx.fillStyle = detail.microSlip
          ? PALETTE.err
          : detail.isBroken
            ? PALETTE.blue
            : PALETTE.ink;
        ctx.fillRect(-tw / 2, ty, tw, th);
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tag, 0, ty + th / 2 + 0.5);
      }
    }

    ctx.restore();
  }

  function drawBanner(ev) {
    const pad = 10;
    const text = ev.passed
      ? `✓ 破格成立 · ${ev.brokenCount} 破 / ${ev.alignedCount} 守 · 留白 ${ev.whitespacePct}%`
      : `× ${ev.badge} · 拖动任意模块出格或归格`;
    ctx.save();
    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    const tw = Math.min(cssW - 24, ctx.measureText(text).width + 22);
    const th = 26;
    const bx = Math.round((cssW - tw) / 2);
    const by = cssH - th - pad;
    ctx.fillStyle = ev.passed ? PALETTE.ok : PALETTE.err;
    ctx.fillRect(bx, by, tw, th);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cssW / 2, by + th / 2 + 0.5, tw - 12);
    ctx.restore();
  }

  function render(t, dt, { still }) {
    const moving = stepAnim(dt, still);
    if (!dirty && !moving && !still) return;
    dirty = false;

    const state = getState();
    const ev = getEval();
    ensureGridCache(state);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1 次 blit 绘出整张静态 5×6 虚线底格、角标与蓝 ×
    ctx.drawImage(gridCache, 0, 0, cssW, cssH);

    // 原海报连接红引线（主标右沿指向破格黑块）
    if (state.showGuides && ev.details.blackBlock.isBroken && state.gridIntegrity !== "shattered") {
      const hl = anim.headline;
      const bk = anim.blackBlock;
      const ly = gyToPx(hl.gy + hl.gh * 0.72);
      const lx0 = gxToPx(hl.gx + hl.gw * 0.85);
      const lx1 = gxToPx(bk.gx + bk.gw * 0.16);
      if (lx1 > lx0 + 8) {
        ctx.strokeStyle = PALETTE.red;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(lx0, ly);
        ctx.lineTo(lx1, ly);
        ctx.stroke();
      }
    }

    if (state.selected && ev.details[state.selected]) {
      drawGhostAndRuler(state.selected, ev.details[state.selected]);
    }

    const drawOrder = [...MODULE_ORDER].sort((a, b) => MODULE_META[a].z - MODULE_META[b].z);
    for (const id of drawOrder) {
      drawModule(id, state, ev);
    }

    if (ev.textCoverPct >= 14) {
      const hl = anim.headline;
      const hx = gxToPx(hl.gx);
      const hy = gyToPx(hl.gy);
      const hw = hl.gw * cellPx;
      const hh = hl.gh * cellPx;
      ctx.save();
      ctx.fillStyle = "rgba(180, 30, 18, 0.22)";
      ctx.fillRect(hx, hy, hw, hh);
      ctx.strokeStyle = PALETTE.err;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(hx, hy, hw, hh);
      ctx.setLineDash([]);
      const warnTag = `× 文字被遮挡 ${ev.textCoverPct}%`;
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(warnTag).width + 14;
      ctx.fillStyle = PALETTE.err;
      ctx.fillRect(hx, hy - 22, tw, 20);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(warnTag, hx + 7, hy - 12);
      ctx.restore();
    }

    drawBanner(ev);
    ctx.restore();
  }

  measure();
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      measure();
      ctrl.draw();
    }).observe(canvas);
  }
  window.addEventListener("resize", () => {
    measure();
    ctrl.draw();
  });

  const ctrl = loop(canvas, render);

  function getLocalPx(e) {
    const r = cachedRect || canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    cachedRect = canvas.getBoundingClientRect();
    const p = getLocalPx(e);
    const g = pxToGrid(p.x, p.y);
    const hit = hitTest(g.gx, g.gy);
    const state = getState();
    const targetId = hit || state.selected || "circle";

    pointerId = e.pointerId;
    pointerStartPx = p;
    isPanScrolling = false;
    draggingId = targetId;
    dragStartGrid = g;
    dragOrigMod = { ...state.modules[targetId] };

    if (hit && hit !== state.selected) {
      callbacks.onSelect(hit);
    }
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    canvas.classList.add("is-dragging");
  });

  canvas.addEventListener("pointermove", (e) => {
    if (draggingId && e.pointerId === pointerId) {
      const p = getLocalPx(e);
      if (e.pointerType === "touch" && !isPanScrolling) {
        const dxPx = Math.abs(p.x - pointerStartPx.x);
        const dyPx = Math.abs(p.y - pointerStartPx.y);
        if (dyPx > 14 && dyPx > dxPx * 1.8) {
          isPanScrolling = true;
          draggingId = null;
          canvas.classList.remove("is-dragging");
          return;
        }
      }
      const g = pxToGrid(p.x, p.y);
      const dgx = g.gx - dragStartGrid.gx;
      const dgy = g.gy - dragStartGrid.gy;
      let nextX = dragOrigMod.gx + dgx;
      let nextY = dragOrigMod.gy + dgy;

      const rx = Math.round(nextX);
      const ry = Math.round(nextY);
      if (Math.abs(nextX - rx) < 0.085 && Math.abs(dragOrigMod.rot) < 1) nextX = rx;
      if (Math.abs(nextY - ry) < 0.085 && Math.abs(dragOrigMod.rot) < 1) nextY = ry;

      const clamped = clampModule(draggingId, {
        ...dragOrigMod,
        gx: nextX,
        gy: nextY,
      });
      // 只标记 dirty，交给 rAF 每帧绘制一次，绝不每事件强制双画
      dirty = true;
      callbacks.onMoveModule(draggingId, clamped, true);
    } else if (e.pointerType === "mouse") {
      cachedRect = canvas.getBoundingClientRect();
      const p = getLocalPx(e);
      const g = pxToGrid(p.x, p.y);
      const h = hitTest(g.gx, g.gy);
      if (h !== hoverId) {
        hoverId = h;
        canvas.style.cursor = h ? "grab" : "default";
        dirty = true;
      }
    }
  });

  function endDrag(e) {
    if (pointerId !== null && e.pointerId === pointerId) {
      draggingId = null;
      pointerId = null;
      canvas.classList.remove("is-dragging");
      dirty = true;
      ctrl.draw();
    }
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  canvas.addEventListener("keydown", (e) => {
    const state = getState();
    const id = state.selected;
    if (!id) return;
    const cur = state.modules[id];
    const step = e.shiftKey ? 0.5 : 0.25;
    let handled = true;
    if (e.key === "ArrowLeft") callbacks.onMoveModule(id, clampModule(id, { ...cur, gx: cur.gx - step }));
    else if (e.key === "ArrowRight") callbacks.onMoveModule(id, clampModule(id, { ...cur, gx: cur.gx + step }));
    else if (e.key === "ArrowUp") callbacks.onMoveModule(id, clampModule(id, { ...cur, gy: cur.gy - step }));
    else if (e.key === "ArrowDown") callbacks.onMoveModule(id, clampModule(id, { ...cur, gy: cur.gy + step }));
    else if (e.key === "]" || e.key === "+") callbacks.onMoveModule(id, clampModule(id, { ...cur, gw: cur.gw + 0.35, gh: cur.gh + (id === "circle" ? 0.35 : 0.2) }));
    else if (e.key === "[" || e.key === "-") callbacks.onMoveModule(id, clampModule(id, { ...cur, gw: cur.gw - 0.35, gh: cur.gh - (id === "circle" ? 0.35 : 0.2) }));
    else if (e.key === "r" || e.key === "R") callbacks.onMoveModule(id, clampModule(id, { ...cur, rot: cur.rot === 0 ? 17 : cur.rot > 0 ? -15 : 0 }));
    else if (e.key === "g" || e.key === "G") callbacks.onMoveModule(id, { ...HOME_SLOTS[id] });
    else if (e.key === " ") {
      const idx = (MODULE_ORDER.indexOf(id) + 1) % MODULE_ORDER.length;
      callbacks.onSelect(MODULE_ORDER[idx]);
    } else handled = false;

    if (handled) {
      e.preventDefault();
      dirty = true;
      ctrl.draw();
    }
  });

  return {
    markDirty() {
      dirty = true;
    },
    draw() {
      dirty = true;
      ctrl.draw();
    },
  };
}

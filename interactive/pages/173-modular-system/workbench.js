// 173 模块系统 · 开场活体 2D Canvas 拼装与裂变工作台
// 1:1 承袭 173 原海报深松青底 × 哑光松绿 × 赭金 × 金点阵美学，
// 全程从 model.js 的 computeGeometry / evaluate 单真源绘制。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  SPECIMENS,
  evaluate,
  moveTileSnapped,
} from "./model.js";

const COLORS = {
  bg: "#002D2E",
  boardWell: "#032223",
  gridDash: "rgba(180, 206, 196, 0.28)",
  gridStrong: "rgba(242, 201, 76, 0.52)",
  teal: "#2B655F",
  tealHi: "#347870",
  tealBorder: "#4A877F",
  gold: "#C5920A",
  goldHi: "#D6A114",
  goldLight: "#F2C94C",
  dotsBg: "#023033",
  dotsFill: "#FDDD6F",
  cream: "#E5DEC5",
  inkDark: "#042324",
  danger: "#FF6B5B",
  dangerFill: "rgba(255, 107, 91, 0.28)",
  ok: "#58D6A3",
};

export function createWorkbench(canvas, { getState, setState, onAudit }) {
  const ctx = canvas.getContext("2d");
  let width = 600;
  let height = 480;
  let dpr = pixelRatio(2);

  // 开场渐入进度（0 -> 1），同时支持 still=true 直接完成；仅在需要时重绘，避免静止与拖拽重复双画
  let intro = 0;
  let dirty = true;
  let drag = null;
  let hoverId = null;
  let hoverHandle = false;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    width = r.width;
    height = r.height;
    // 手机竖屏与窄画布像素比上限 1.5（遵循 GUIDE.md 性能规范），宽屏保持 2
    dpr = pixelRatio(width <= 500 ? 1.5 : 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    dirty = true;
  }

  function clientToLocal(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / Math.max(1, r.width)) * width,
      y: ((clientY - r.top) / Math.max(1, r.height)) * height,
    };
  }

  function hitTest(px, py, audit) {
    const { rects } = audit.geo;
    // 优先检测已选中块的右下缩放金柄
    const sel = rects.find((r) => r.id === getState().selectedId);
    if (sel) {
      const hx = sel.x + sel.w;
      const hy = sel.y + sel.h;
      if (Math.hypot(px - hx, py - hy) <= 18) {
        return { tile: sel, mode: "resize" };
      }
    }
    // 从顶层往下找命中的模块
    for (let i = rects.length - 1; i >= 0; i--) {
      const r = rects[i];
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
        return { tile: r, mode: "move" };
      }
    }
    return null;
  }

  function drawDotMatrix(x, y, w, h, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS.dotsBg;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(180, 206, 196, 0.36)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    const cols = Math.max(4, Math.min(11, Math.round(w / 12)));
    const rows = Math.max(4, Math.min(11, Math.round(h / 12)));
    const padX = w * 0.1;
    const padY = h * 0.1;
    const stepX = (w - padX * 2) / Math.max(1, cols - 1);
    const stepY = (h - padY * 2) / Math.max(1, rows - 1);
    const rad = Math.max(1.2, Math.min(2.1, Math.min(stepX, stepY) * 0.17));

    ctx.fillStyle = COLORS.dotsFill;
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      const cy = y + padY + r * stepY;
      for (let c = 0; c < cols; c++) {
        const cx = x + padX + c * stepX;
        ctx.moveTo(cx + rad, cy);
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      }
    }
    ctx.fill();
    ctx.restore();
  }

  function drawTile(r, state, audit, isSelected, isHover, alpha, showText) {
    const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;
    const [zhLabel, enLabel] = spec.tags[r.role] || ["模块", "UNIT"];
    const isOff = audit.offModulusIds.includes(r.id);

    ctx.save();
    ctx.globalAlpha = alpha;

    // 1. 主体 0px 锐利建筑瓦片（完全忠于 173 原海报！）
    if (r.role === "dots") {
      drawDotMatrix(r.x, r.y, r.w, r.h, alpha);
    } else if (r.role === "gold") {
      ctx.fillStyle = isHover ? COLORS.goldHi : COLORS.gold;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    } else {
      ctx.fillStyle = isHover ? COLORS.tealHi : COLORS.teal;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }

    // 2. 金圆主块中心几何圆（1:1 复刻原海报 2×2 松绿块内赭金正圆）
    if (r.role === "hero-circle") {
      const cr = Math.min(r.w, r.h) * 0.27;
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + r.h / 2, Math.max(8, cr), 0, Math.PI * 2);
      ctx.fill();
      // 轻细内环增加精密制图层次
      ctx.strokeStyle = "rgba(229, 222, 197, 0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + r.h / 2, Math.max(12, cr + 7), 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. 轻质微文案与尺寸读数（保证高对比、裁切在模块内绝不溢出）
    if (showText && r.w >= 44 && r.h >= 34) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x + 2, r.y + 2, Math.max(0, r.w - 4), Math.max(0, r.h - 4));
      ctx.clip();

      const isGold = r.role === "gold";
      const isDots = r.role === "dots";
      const fmtNum = (n) => (Number.isInteger(n) ? String(n) : r.w < 74 ? n.toFixed(1) : n.toFixed(2));
      const dimText = `${fmtNum(r.gw)}×${fmtNum(r.gh)}u`;
      const monoSize = r.w < 68 ? 9.5 : Math.max(10, Math.min(12, r.w * 0.105));

      ctx.font = `500 ${monoSize}px "DM Mono", monospace`;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";

      if (isDots) {
        const tw = Math.min(r.w - 10, ctx.measureText(dimText).width + 8);
        ctx.fillStyle = "rgba(0, 45, 46, 0.9)";
        ctx.fillRect(r.x + 5, r.y + r.h - 20, tw, 15);
        ctx.fillStyle = COLORS.goldLight;
        ctx.fillText(dimText, r.x + 9, r.y + r.h - 17);
      } else {
        ctx.fillStyle = isGold ? "rgba(4, 35, 36, 0.88)" : "rgba(229, 222, 197, 0.9)";
        ctx.fillText(dimText, r.x + 7, r.y + 6);
        if ((state.specimen !== "poster" || r.w >= 96) && r.h >= 58) {
          ctx.font = `700 ${Math.max(11, Math.min(13, r.w * 0.095))}px "Noto Sans SC", sans-serif`;
          ctx.textBaseline = "bottom";
          ctx.fillStyle = isGold ? COLORS.inkDark : COLORS.cream;
          ctx.fillText(zhLabel, r.x + 8, r.y + r.h - 7);
          if (r.role !== "hero-circle" && r.w >= 115 && r.h >= 82) {
            ctx.font = `500 10px "Manrope", sans-serif`;
            ctx.fillStyle = isGold ? "rgba(4, 35, 36, 0.72)" : "rgba(229, 222, 197, 0.72)";
            ctx.fillText(enLabel, r.x + 8, r.y + r.h - 23);
          }
        }
      }
      ctx.restore();
    }

    // 4. 非模数散尺警示虚线框
    if (isOff) {
      ctx.strokeStyle = COLORS.danger;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      ctx.setLineDash([]);
    }

    // 5. 选中态：骨白精密角标 + 右下角金柄（可拖缩放）
    if (isSelected) {
      ctx.strokeStyle = COLORS.cream;
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);

      // 四角金标点（致敬 173 原海报「模块」图示四角金块）
      const dot = 5;
      ctx.fillStyle = COLORS.goldLight;
      ctx.fillRect(r.x - 2, r.y - 2, dot, dot);
      ctx.fillRect(r.x + r.w - 3, r.y - 2, dot, dot);
      ctx.fillRect(r.x - 2, r.y + r.h - 3, dot, dot);

      // 右下角缩放手柄（略大、带微高亮反馈）
      const hs = hoverHandle || drag?.mode === "resize" ? 11 : 9;
      ctx.fillStyle = COLORS.goldLight;
      ctx.fillRect(r.x + r.w - hs + 2, r.y + r.h - hs + 2, hs, hs);
      ctx.strokeStyle = COLORS.inkDark;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(r.x + r.w - hs + 2, r.y + r.h - hs + 2, hs, hs);
    }

    ctx.restore();
  }

  function render(t, dt, { still }) {
    if (!width || !height) resize();
    const prevIntro = intro;
    intro = still ? 1 : Math.min(1, intro + Math.max(dt, 0.016) * 2.2);
    if (!still && !dirty && intro >= 1 && prevIntro >= 1) return;
    dirty = false;

    const state = getState();
    const audit = evaluate(state, width, height);
    const { bx, by, boardW, boardH, unit, step, rects } = audit.geo;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 深松青背景
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    // 基准框底槽（细绿线建筑边框）
    ctx.fillStyle = COLORS.boardWell;
    ctx.fillRect(bx - 10, by - 10, boardW + 20, boardH + 20);
    ctx.strokeStyle = state.highlightPillar === "combination"
      ? COLORS.goldLight
      : "rgba(94, 130, 118, 0.55)";
    ctx.lineWidth = state.highlightPillar === "combination" ? 1.8 : 1;
    ctx.strokeRect(bx - 10.5, by - 10.5, boardW + 21, boardH + 21);

    // 基准网格虚线（单次合批路径绘制，大幅降低软件渲染绘制调用）
    if (state.showGrid || !audit.modulusOk || state.highlightPillar === "module") {
      ctx.save();
      ctx.strokeStyle = state.highlightPillar === "module" ? COLORS.gridStrong : COLORS.gridDash;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let c = 0; c < state.cols; c++) {
        const cx = bx + c * step;
        for (let row = 0; row < state.rows; row++) {
          const cy = by + row * step;
          ctx.rect(cx + 0.5, cy + 0.5, unit - 1, unit - 1);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 顶缘与左缘标尺刻度（1u, 2u...）
      ctx.font = `500 10px "DM Mono", monospace`;
      ctx.fillStyle = "rgba(229, 222, 197, 0.65)";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      for (let c = 0; c < state.cols; c++) {
        ctx.fillText(`${c + 1}u`, bx + c * step + unit / 2, by - 12);
      }
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (let row = 0; row < state.rows; row++) {
        ctx.fillText(`${row + 1}`, bx - 14, by + row * step + unit / 2);
      }
      ctx.restore();
    }

    // 基准框四角小金方块（173 原海报「模块」图的招牌细节）
    ctx.fillStyle = COLORS.gold;
    const mk = 5;
    ctx.fillRect(bx - 12, by - 12, mk, mk);
    ctx.fillRect(bx + boardW + 7, by - 12, mk, mk);
    ctx.fillRect(bx - 12, by + boardH + 7, mk, mk);
    ctx.fillRect(bx + boardW + 7, by + boardH + 7, mk, mk);

    // 绘制所有模块（选中或正在拖拽的放在最顶层）
    const ordered = [...rects].sort((a, b) => {
      if (a.id === state.selectedId) return 1;
      if (b.id === state.selectedId) return -1;
      return 0;
    });

    const easeOut = 1 - Math.pow(1 - intro, 3);
    for (let i = 0; i < ordered.length; i++) {
      const r = ordered[i];
      const stagger = still ? 1 : Math.min(1, Math.max(0.25, easeOut * 1.15 - i * 0.03));
      const drawRect = { ...r };
      // 正在模数锁定拖拽中：叠加实时手指平滑位移偏移量，并先画吸附目标虚影
      if (drag && drag.tileId === r.id && drag.mode === "move" && state.unitLock) {
        // 先画整数格吸附目标提示框
        ctx.save();
        ctx.strokeStyle = COLORS.goldLight;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
        ctx.setLineDash([]);
        ctx.restore();
        drawRect.x += drag.visualDx;
        drawRect.y += drag.visualDy;
      }
      drawTile(
        drawRect,
        state,
        audit,
        r.id === state.selectedId,
        r.id === hoverId,
        stagger,
        true
      );
    }

    // 绘制真实碰撞重叠警示斜线区（单真源）
    if (audit.overlaps.length > 0) {
      ctx.save();
      for (const ov of audit.overlaps) {
        ctx.fillStyle = COLORS.dangerFill;
        ctx.fillRect(ov.x, ov.y, ov.w, ov.h);
        ctx.strokeStyle = COLORS.danger;
        ctx.lineWidth = 1.6;
        ctx.strokeRect(ov.x + 0.5, ov.y + 0.5, ov.w - 1, ov.h - 1);

        const lbl = `× 重叠 ${Math.round(ov.depth)}px`;
        ctx.font = `700 10px "Noto Sans SC", sans-serif`;
        const lw = ctx.measureText(lbl).width + 10;
        const lx = Math.max(bx, Math.min(bx + boardW - lw, ov.x + ov.w / 2 - lw / 2));
        const ly = Math.max(by + 4, ov.y + ov.h / 2 - 9);
        ctx.fillStyle = "#8A1F14";
        ctx.fillRect(lx, ly, lw, 18);
        ctx.strokeStyle = COLORS.danger;
        ctx.lineWidth = 1;
        ctx.strokeRect(lx + 0.5, ly + 0.5, lw - 1, 17);
        ctx.fillStyle = "#FFF4F2";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(lbl, lx + lw / 2, ly + 9.5);
      }
      ctx.restore();
    }

    // 缝隙异常时在最窄/最宽真实缝隙上画精密尺寸标尺
    if (!audit.spacingOk && audit.seams.length > 0 && audit.overlaps.length === 0) {
      const sorted = [...audit.seams].sort((a, b) => b.gap - a.gap);
      const targets = audit.gapSpreadPx > 2.6 ? [sorted[0], sorted[sorted.length - 1]] : [sorted[0]];
      ctx.save();
      for (const s of targets) {
        ctx.strokeStyle = COLORS.danger;
        ctx.fillStyle = "#8A1F14";
        ctx.lineWidth = 1.4;
        if (s.dir === "v") {
          ctx.beginPath();
          ctx.moveTo(s.x1, s.ym);
          ctx.lineTo(s.x2, s.ym);
          ctx.stroke();
          const txt = `${Math.round(s.gap)}px`;
          ctx.font = `500 10px "DM Mono", monospace`;
          const tw = ctx.measureText(txt).width + 8;
          ctx.fillRect((s.x1 + s.x2) / 2 - tw / 2, s.ym - 9, tw, 18);
          ctx.fillStyle = "#FFF4F2";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(txt, (s.x1 + s.x2) / 2, s.ym + 0.5);
        } else {
          ctx.beginPath();
          ctx.moveTo(s.xm, s.y1);
          ctx.lineTo(s.xm, s.y2);
          ctx.stroke();
          const txt = `${Math.round(s.gap)}px`;
          ctx.font = `500 10px "DM Mono", monospace`;
          const tw = ctx.measureText(txt).width + 8;
          ctx.fillRect(s.xm - tw / 2, (s.y1 + s.y2) / 2 - 9, tw, 18);
          ctx.fillStyle = "#FFF4F2";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(txt, s.xm, (s.y1 + s.y2) / 2 + 0.5);
        }
      }
      ctx.restore();
    }

    // 若悬停或高亮「变化」柱，用细腻轮廓提示当前最大块与最小块体量比
    if (state.highlightPillar === "variation" && rects.length > 1) {
      const byArea = [...rects].sort((a, b) => b.w * b.h - a.w * a.h);
      const hi = byArea[0];
      const lo = byArea[byArea.length - 1];
      ctx.save();
      ctx.strokeStyle = COLORS.goldLight;
      ctx.lineWidth = 2;
      ctx.strokeRect(hi.x + 2, hi.y + 2, hi.w - 4, hi.h - 4);
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(lo.x + 2, lo.y + 2, lo.w - 4, lo.h - 4);
      ctx.restore();
    }

    // 底沿轻量实时状态条（位于基准底槽外下方，绝不与四角金块或彼此撞车）
    ctx.save();
    const hudSize = width < 380 ? 9.5 : 10.5;
    ctx.font = `500 ${hudSize}px "DM Mono", monospace`;
    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(229, 222, 197, 0.8)";
    const leftHud =
      width < 430
        ? `${state.cols}×${state.rows} · ${state.gapPx}px · ${state.unitLock ? "LOCK" : "FREE"}`
        : `${state.cols}×${state.rows} · GAP ${state.gapPx}px · ${state.unitLock ? "UNIT LOCK" : "FREE SIZE"}`;
    const hudLeftX = Math.max(12, bx - 10);
    const hudRightX = Math.min(width - 12, bx + boardW + 10);
    ctx.fillText(leftHud, hudLeftX, height - 4);
    ctx.textAlign = "right";
    ctx.fillStyle = audit.pass ? COLORS.ok : COLORS.danger;
    ctx.fillText(audit.badge, hudRightX, height - 4);
    ctx.restore();

    ctx.restore();
    onAudit?.(audit);
  }

  const ctrl = loop(canvas, render);
  const requestDraw = (immediate = false) => {
    dirty = true;
    if (immediate || reducedMotion.matches) ctrl.draw();
  };

  // ---------- 指针与触摸交互（兼顾鼠标拖块、角柄扩缩与触屏横向顺滑拖拽） ----------
  let activePointerId = null;

  function startDrag(clientX, clientY, isTouch = false) {
    const pt = clientToLocal(clientX, clientY);
    const state = getState();
    const audit = evaluate(state, width, height);
    let hit = hitTest(pt.x, pt.y, audit);
    if (!hit && audit.geo.rects.length > 0) {
      let best = audit.geo.rects[0];
      let bestD = Infinity;
      for (const r of audit.geo.rects) {
        const d = Math.hypot(pt.x - r.cx, pt.y - r.cy);
        if (d < bestD) {
          bestD = d;
          best = r;
        }
      }
      hit = { tile: best, mode: "move" };
    }
    if (!hit) return false;

    setState({ ...state, selectedId: hit.tile.id }, { silent: false });
    drag = {
      tileId: hit.tile.id,
      mode: hit.mode,
      isTouch,
      startX: pt.x,
      startY: pt.y,
      origGx: hit.tile.gx,
      origGy: hit.tile.gy,
      origGw: hit.tile.gw,
      origGh: hit.tile.gh,
      visualDx: 0,
      visualDy: 0,
      axisLock: null,
    };
    requestDraw(false);
    return true;
  }

  function moveDrag(clientX, clientY) {
    if (!drag) return;
    const pt = clientToLocal(clientX, clientY);
    const dx = pt.x - drag.startX;
    const dy = pt.y - drag.startY;
    const state = getState();
    const audit = evaluate(state, width, height);
    const { step } = audit.geo;
    const du = dx / Math.max(1, step);
    const dv = dy / Math.max(1, step);

    if (drag.mode === "resize") {
      const tiles = state.tiles.map((t) => {
        if (t.id !== drag.tileId) return t;
        let nw = Math.max(0.65, Math.min(state.cols - t.gx, drag.origGw + du));
        let nh = Math.max(0.65, Math.min(state.rows - t.gy, drag.origGh + dv));
        if (state.unitLock) {
          nw = Math.max(1, Math.min(state.cols - Math.round(t.gx), Math.round(nw)));
          nh = Math.max(1, Math.min(state.rows - Math.round(t.gy), Math.round(nh)));
        } else {
          nw = +nw.toFixed(2);
          nh = +nh.toFixed(2);
        }
        return { ...t, gw: nw, gh: nh };
      });
      setState({ ...state, tiles });
      requestDraw(false);
      return;
    }

    if (!state.unitLock) {
      const tiles = state.tiles.map((t) => {
        if (t.id !== drag.tileId) return t;
        const ngx = Math.max(0, Math.min(state.cols - t.gw, +(drag.origGx + du).toFixed(2)));
        const ngy = Math.max(0, Math.min(state.rows - t.gh, +(drag.origGy + dv).toFixed(2)));
        return { ...t, gx: ngx, gy: ngy };
      });
      setState({ ...state, tiles });
      requestDraw(false);
    } else {
      const targetGx = drag.origGx + du;
      const targetGy = drag.origGy + dv;
      const snapped = moveTileSnapped(state, drag.tileId, targetGx, targetGy);
      const movedTile = snapped.tiles.find((t) => t.id === drag.tileId);
      const curGx = movedTile ? movedTile.gx : drag.origGx;
      const curGy = movedTile ? movedTile.gy : drag.origGy;
      drag.visualDx = (targetGx - curGx) * step * 0.45;
      drag.visualDy = (targetGy - curGy) * step * 0.45;
      setState(snapped);
      requestDraw(false);
    }
  }

  function endDrag() {
    if (!drag) return;
    drag = null;
    requestDraw(true);
  }

  // Pointer events (mouse)
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触摸交给专属 touch 事件以兼容滚动与 CDP touch
    activePointerId = e.pointerId;
    canvas.setPointerCapture?.(e.pointerId);
    startDrag(e.clientX, e.clientY, false);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    if (drag && activePointerId === e.pointerId) {
      moveDrag(e.clientX, e.clientY);
      return;
    }
    const pt = clientToLocal(e.clientX, e.clientY);
    const hit = hitTest(pt.x, pt.y, evaluate(getState(), width, height));
    const nextHover = hit ? hit.tile.id : null;
    const nextHandle = !!(hit && hit.mode === "resize");
    if (nextHover !== hoverId || nextHandle !== hoverHandle) {
      hoverId = nextHover;
      hoverHandle = nextHandle;
      canvas.style.cursor = nextHandle ? "nwse-resize" : nextHover ? "grab" : "default";
      requestDraw(false);
    }
  });

  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    if (activePointerId === e.pointerId) {
      activePointerId = null;
      endDrag();
    }
  });
  canvas.addEventListener("pointercancel", () => {
    activePointerId = null;
    endDrag();
  });

  // Touch events（只拦截横向拖动或命中缩放柄，保留页面竖向正常滚动！）
  let touchStartClient = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      touchStartClient = { x: t.clientX, y: t.clientY };
      startDrag(t.clientX, t.clientY, true);
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!drag || !touchStartClient || e.touches.length !== 1) return;
      const t = e.touches[0];
      const adx = Math.abs(t.clientX - touchStartClient.x);
      const ady = Math.abs(t.clientY - touchStartClient.y);
      if (!drag.axisLock && (adx > 5 || ady > 5)) {
        // 如果用户在画布上明显竖直滑动且不是拖缩放柄，放行页面滚动
        if (ady > adx * 1.45 && drag.mode !== "resize") {
          drag = null;
          touchStartClient = null;
          return;
        }
        drag.axisLock = "drag";
      }
      if (drag.axisLock === "drag" || drag.mode === "resize") {
        e.preventDefault();
        moveDrag(t.clientX, t.clientY);
      }
    },
    { passive: false }
  );

  canvas.addEventListener("touchend", () => {
    touchStartClient = null;
    endDrag();
  });
  canvas.addEventListener("touchcancel", () => {
    touchStartClient = null;
    endDrag();
  });

  const ro = new ResizeObserver(() => {
    resize();
    requestDraw(true);
  });
  ro.observe(canvas);
  resize();

  return {
    draw: () => requestDraw(true),
    getSize: () => ({ width, height }),
  };
}

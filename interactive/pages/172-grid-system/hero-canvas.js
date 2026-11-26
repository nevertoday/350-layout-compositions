// 172 网格系统 — 2D 坐标网格拼版台渲染与指针/触屏/键盘交互
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SPECIMENS, clamp, computeGeometry, auditLayout, snapBlockToGrid } from "./model.js";

const COLORS = {
  paper: "#FCF6ED",
  colBand: "#E4E8F0",
  colBandWarn: "#F8E3E1",
  blue: "#0A4EC0",
  blueDash: "#3B6AC6",
  blueLaser: "#0A4EC0",
  red: "#E53E32",
  redDeep: "#D93324",
  redSoft: "rgba(217, 51, 36, 0.16)",
  ink: "#0C1016",
  inkMuted: "#3D4657",
  ok: "#0F6B4A",
  white: "#FFFFFF",
};

export function initHeroCanvas(canvas, getState, setState, onAudit) {
  const ctx = canvas.getContext("2d");
  let W = 960;
  let H = 400;
  let dpr = 1;
  let dirty = true;
  let introDone = false;
  let lastAudit = null;
  let lastGeom = null;

  // 拖拽状态
  let drag = null; // { mode: 'block'|'hangline', blockId?, startClientX, startClientY, startU, startV, startHang, moved, isTouch, decided }
  let activeLasers = null; // { x?, y? } 拖移对齐时实时贯穿蓝激光线

  function resize() {
    const r = canvas.getBoundingClientRect();
    const nw = Math.max(280, Math.round(r.width));
    const nh = Math.max(220, Math.round(r.height));
    const maxDpr = window.innerWidth <= 640 ? 1.5 : 2;
    const ndpr = pixelRatio(maxDpr);
    if (nw !== W || nh !== H || ndpr !== dpr) {
      W = nw;
      H = nh;
      dpr = ndpr;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      dirty = true;
    }
  }

  function markDirty() {
    dirty = true;
  }

  function renderFrame(t, _dt, { still }) {
    resize();
    const introP = still ? 1 : clamp(t / 0.72, 0, 1);
    const animatingIntro = !still && !introDone;
    if (introP >= 1) introDone = true;

    if (!dirty && !animatingIntro) return;
    dirty = false;

    const state = getState();
    const geom = computeGeometry(state, W, H);
    const audit = auditLayout(state, geom);
    lastGeom = geom;
    lastAudit = audit;
    if (onAudit) onAudit(audit, geom);

    // 缓出曲线用于优雅开场
    const ease = 1 - Math.pow(1 - introP, 3);
    const sp = SPECIMENS[state.specimen] || SPECIMENS.poster;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 暖米纸底
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, W, H);

    const { innerX, innerY, innerW, innerH, cols, flowlines } = geom;

    // 2. 透视网格骨架层（淡蓝列带 + 栏距告警 + 1:1 原海报外延蓝虚线框与水平挂线）
    if (state.xray) {
      // 列带逐列展开
      for (let i = 0; i < cols.length; i++) {
        const c = cols[i];
        const colReveal = clamp((ease - i * 0.04) / 0.65, 0, 1);
        const hDraw = innerH * colReveal;
        ctx.fillStyle = COLORS.colBand;
        ctx.fillRect(c.x0, innerY, c.w, hDraw);

        // 顶部列号标尺（01..N，>=10px）
        if (W >= 340 && (cols.length <= 8 || i % 2 === 0)) {
          ctx.fillStyle = COLORS.inkMuted;
          ctx.font = `600 10.5px "IBM Plex Mono", monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(String(i + 1).padStart(2, "0"), c.x0 + c.w / 2, innerY - 5);
        }
      }

      // 栏距过窄或过宽时在栏缝上做轻朱红提示
      if (state.gutter < 10 || state.gutter > 38) {
        ctx.fillStyle = COLORS.colBandWarn;
        for (let i = 0; i < cols.length - 1; i++) {
          const gx = cols[i].x1;
          const gw = cols[i + 1].x0 - cols[i].x1;
          if (gw >= 1) ctx.fillRect(gx, innerY, gw, innerH);
        }
      }

      // 1:1 原海报标志：外延 12px 的蓝色虚线边框与 3 条水平挂线
      const over = Math.min(14, innerX - 4);
      ctx.save();
      ctx.strokeStyle = COLORS.blueDash;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);

      // 左右竖向边界虚线
      for (const vx of [innerX, innerX + innerW]) {
        ctx.beginPath();
        ctx.moveTo(vx, innerY - over);
        ctx.lineTo(vx, innerY + innerH * ease + over * ease);
        ctx.stroke();
      }

      // 三条水平挂线 + 底沿虚线
      const hLines = [flowlines.top, flowlines.mid, flowlines.row2, flowlines.bot];
      for (const fl of hLines) {
        ctx.beginPath();
        ctx.moveTo(innerX - over, fl.y);
        ctx.lineTo(innerX + innerW * ease + over * ease, fl.y);
        ctx.stroke();
      }
      ctx.restore();

      // 中腰挂线右侧拖拽手柄
      const midY = flowlines.mid.y;
      const gx = innerX + innerW;
      ctx.save();
      ctx.fillStyle = drag && drag.mode === "hangline" ? COLORS.redDeep : COLORS.blue;
      ctx.fillRect(gx - 7, midY - 7, 14, 14);
      ctx.fillStyle = COLORS.white;
      ctx.font = `700 10px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("↕", gx, midY + 0.5);
      ctx.restore();
    }

    // 3. 实时贯穿对齐激光线（拖动且贴线时亮起）
    if (activeLasers) {
      ctx.save();
      ctx.strokeStyle = COLORS.blueLaser;
      ctx.lineWidth = 1.8;
      if (activeLasers.x != null) {
        ctx.beginPath();
        ctx.moveTo(activeLasers.x, innerY - 10);
        ctx.lineTo(activeLasers.x, innerY + innerH + 10);
        ctx.stroke();
      }
      if (activeLasers.y != null) {
        ctx.beginPath();
        ctx.moveTo(innerX - 10, activeLasers.y);
        ctx.lineTo(innerX + innerW + 10, activeLasers.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. 逐块绘制 172 原海报 8 枚模块
    const compact = W < 540;
    for (let i = 0; i < geom.blocks.length; i++) {
      const b = geom.blocks[i];
      const isSel = b.id === state.selectedId;
      const isOff = b.colDriftRefPx > 5 || b.hangDriftRefPx > 5 || b.outOfBounds;
      const dyIntro = (1 - ease) * (10 + (i % 3) * 4);

      ctx.save();
      ctx.translate(0, dyIntro);
      drawModule(ctx, b, sp, compact, state.xray);

      // 偏轨 / 错挂视觉引线（单真源像素偏差）
      if (state.xray && isOff) {
        ctx.save();
        ctx.strokeStyle = COLORS.redDeep;
        ctx.lineWidth = 1.25;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
        if (b.colDriftRefPx > 5 && b.nearestCol) {
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(b.nearestCol.x0, b.y + 8);
          ctx.lineTo(b.x, b.y + 8);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 当前选中块四角架构括号（无圆角，纯建筑制图感）
      if (isSel) {
        const sc = isOff ? COLORS.redDeep : COLORS.blue;
        drawBrackets(ctx, b.x - 3, b.y - 3, b.w + 6, b.h + 6, sc);
      }
      ctx.restore();
    }

    // 5. 撞块重叠实绘红斜线告警（完全来自 audit.overlaps）
    for (const ov of audit.overlaps) {
      const { x, y, w, h } = ov.rect;
      ctx.save();
      ctx.fillStyle = "rgba(217, 51, 36, 0.28)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = COLORS.redDeep;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(x, y, w, h);

      // 标签胶囊
      const tag = "× 撞块";
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(tag).width + 12;
      const bx = clamp(x + w / 2 - tw / 2, innerX, innerX + innerW - tw);
      const by = clamp(y + h / 2 - 10, innerY + 2, innerY + innerH - 22);
      ctx.fillStyle = COLORS.redDeep;
      ctx.fillRect(bx, by, tw, 20);
      ctx.fillStyle = COLORS.white;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tag, bx + tw / 2, by + 10.5);
      ctx.restore();
    }

    // 6. 左下/右下极简标尺状态微标（避开垂直蓝虚线外延，绝不压字）
    ctx.save();
    ctx.font = `600 11px "IBM Plex Mono", monospace`;
    ctx.fillStyle = COLORS.inkMuted;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(
      `${state.cols} COL · GAP ${state.gutter}px · ${state.snap ? "SNAP ON" : "FREE DRAG"}`,
      innerX + 8,
      innerY + innerH + 6
    );
    ctx.textAlign = "right";
    ctx.fillStyle = audit.score === 4 ? COLORS.ok : COLORS.redDeep;
    ctx.fillText(
      `${audit.score}/4 · ${audit.issue.shortTag}`,
      innerX + innerW - 8,
      innerY + innerH + 6
    );
    ctx.restore();

    ctx.restore();
  }

  // 绘制每一种 172 原海报专属模块
  function drawModule(c, b, sp, compact, xray) {
    const { x, y, w, h, kind } = b;

    if (kind === "heroBlue") {
      c.fillStyle = COLORS.blue;
      c.fillRect(x, y, w, h);
      // 内部极简白色建筑标识
      if (w > 54 && h > 44) {
        c.fillStyle = "rgba(255,255,255,0.22)";
        c.fillRect(x + 10, y + 10, Math.min(28, w * 0.16), 3);
        c.fillStyle = COLORS.white;
        c.font = `800 ${compact ? 13 : clamp(w * 0.11, 14, 22)}px "Noto Sans SC", sans-serif`;
        c.textAlign = "left";
        c.textBaseline = "bottom";
        c.fillText(sp.heroTitle, x + 10, y + h - (compact ? 18 : 24));
        if (!compact && w > 110) {
          c.fillStyle = "rgba(255,255,255,0.82)";
          c.font = `500 10.5px "IBM Plex Mono", monospace`;
          c.fillText(sp.heroSub, x + 10, y + h - 8);
        }
      }
      return;
    }

    if (kind === "headline") {
      if (xray) {
        c.fillStyle = "rgba(255, 255, 255, 0.52)";
        c.fillRect(x, y, w, h);
      }
      const fs = compact ? clamp(w * 0.155, 13, 18) : clamp(Math.min(w * 0.15, h * 0.37), 16, 30);
      c.fillStyle = COLORS.ink;
      c.font = `900 ${fs}px "Noto Sans SC", sans-serif`;
      c.textAlign = "left";
      c.textBaseline = "top";
      const lh = fs * 1.22;
      const topPad = Math.max(2, (h - lh * 2) * 0.42);
      c.save();
      c.beginPath();
      c.rect(x - 1, y - 1, w + 2, h + 2);
      c.clip();
      c.fillText(sp.headline[0], x + 2, y + topPad);
      c.fillText(sp.headline[1], x + 2, y + topPad + lh);
      c.restore();
      return;
    }

    if (kind === "bodyCopy") {
      if (xray) {
        c.fillStyle = "rgba(255, 255, 255, 0.52)";
        c.fillRect(x, y, w, h);
      }
      // 1:1 呼应原海报四条高对比黑线 + 桌面端可读短句
      const lines = sp.bodyLines;
      const rowStep = h / 4.3;
      c.save();
      c.beginPath();
      c.rect(x, y, w, h);
      c.clip();
      if (!compact && w > 155 && h > 64) {
        c.fillStyle = COLORS.ink;
        c.font = `500 11px "Noto Sans SC", sans-serif`;
        c.textAlign = "left";
        c.textBaseline = "top";
        for (let k = 0; k < 4; k++) {
          const ly = y + 3 + k * rowStep;
          c.fillText(lines[k], x + 2, ly);
          c.fillStyle = "rgba(12, 16, 22, 0.24)";
          c.fillRect(x + 2, ly + 13, w * (k === 3 ? 0.72 : 0.96), 1.2);
          c.fillStyle = COLORS.ink;
        }
      } else {
        // 窄屏/窄列退化为 1:1 原海报清晰黑正文线
        c.fillStyle = COLORS.ink;
        const ratios = [0.98, 0.96, 0.92, 0.74];
        for (let k = 0; k < 4; k++) {
          const ly = y + 5 + k * rowStep;
          c.fillRect(x + 2, ly, Math.max(12, (w - 4) * ratios[k]), 2.2);
        }
      }
      c.restore();
      return;
    }

    if (kind === "redCircle") {
      // 严格 1:1 正圆，绝不拉成椭圆
      const r = Math.max(12, Math.min(w, h) * 0.44);
      const cx = x + w / 2;
      const cy = y + h / 2;
      c.fillStyle = COLORS.red;
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
      if (r >= 20) {
        c.fillStyle = COLORS.white;
        c.font = `700 ${clamp(r * 0.36, 10.5, 13)}px "Noto Sans SC", sans-serif`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText(sp.circleTag, cx, cy + 0.5);
      }
      return;
    }

    if (kind === "dotMatrix") {
      // 1:1 原海报 6×4 钴蓝点阵
      const colsD = w < 64 ? 4 : 6;
      const rowsD = 4;
      const padX = Math.max(6, w * 0.12);
      const padY = Math.max(6, h * 0.14);
      const stepX = colsD > 1 ? (w - padX * 2) / (colsD - 1) : 0;
      const stepY = rowsD > 1 ? (h - padY * 2) / (rowsD - 1) : 0;
      const dotR = clamp(Math.min(stepX, stepY) * 0.24, 2.2, 4.4);
      c.fillStyle = COLORS.blue;
      for (let r = 0; r < rowsD; r++) {
        for (let k = 0; k < colsD; k++) {
          c.beginPath();
          c.arc(x + padX + k * stepX, y + padY + r * stepY, dotR, 0, Math.PI * 2);
          c.fill();
        }
      }
      return;
    }

    if (kind === "redSquare") {
      c.fillStyle = COLORS.redDeep;
      c.fillRect(x, y, w, h);
      if (w > 40 && h > 28) {
        c.fillStyle = COLORS.white;
        c.font = `700 11.5px "Noto Sans SC", sans-serif`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText(sp.redSqTag, x + w / 2, y + h / 2 + 0.5);
      }
      return;
    }

    if (kind === "row2Card") {
      // 1:1 原海报二行图文小模块：左钴蓝正方形 + 右四条黑字线
      const sqSize = clamp(Math.min(h * 0.72, w * 0.3), 18, 54);
      const sqY = y + (h - sqSize) / 2;
      c.fillStyle = COLORS.blue;
      c.fillRect(x, sqY, sqSize, sqSize);

      const textX = x + sqSize + Math.max(8, w * 0.06);
      const textW = Math.max(10, x + w - textX - 2);
      if (textW > 18) {
        const isLeft = b.id === "row2Left";
        const title = isLeft ? sp.r2LeftTitle : sp.r2RightTitle;
        const subLines = isLeft ? sp.r2LeftLines : sp.r2RightLines;
        c.save();
        c.beginPath();
        c.rect(textX, y, textW, h);
        c.clip();
        if (!compact && textW > 95 && h > 56) {
          c.fillStyle = COLORS.ink;
          c.font = `700 11.5px "Noto Sans SC", sans-serif`;
          c.textAlign = "left";
          c.textBaseline = "top";
          c.fillText(title, textX, sqY);
          c.fillStyle = COLORS.inkMuted;
          c.font = `500 10.5px "Noto Sans SC", sans-serif`;
          for (let k = 0; k < 3; k++) {
            c.fillText(subLines[k], textX, sqY + 15 + k * 13);
          }
        } else {
          c.fillStyle = COLORS.ink;
          const step = sqSize / 3.6;
          const ratios = [0.95, 0.9, 0.86, 0.65];
          for (let k = 0; k < 4; k++) {
            c.fillRect(textX, sqY + 2 + k * step, textW * ratios[k], 2);
          }
        }
        c.restore();
      }
    }
  }

  function drawBrackets(c, x, y, w, h, color) {
    const L = 9;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = 2.2;
    c.beginPath();
    // TL
    c.moveTo(x, y + L); c.lineTo(x, y); c.lineTo(x + L, y);
    // TR
    c.moveTo(x + w - L, y); c.lineTo(x + w, y); c.lineTo(x + w, y + L);
    // BR
    c.moveTo(x + w, y + h - L); c.lineTo(x + w, y + h); c.lineTo(x + w - L, y + h);
    // BL
    c.moveTo(x + L, y + h); c.lineTo(x, y + h); c.lineTo(x, y + h - L);
    c.stroke();
    c.restore();
  }

  // 坐标换算与命中检测
  function pointInCanvas(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function hitTest(px, py) {
    if (!lastGeom) return null;
    // 先查中腰挂线手柄
    const midY = lastGeom.flowlines.mid.y;
    const gx = lastGeom.innerX + lastGeom.innerW;
    if (Math.abs(px - gx) <= 18 && Math.abs(py - midY) <= 16) {
      return { mode: "hangline" };
    }
    // 逆序查模块（后画的在上层）
    for (let i = lastGeom.blocks.length - 1; i >= 0; i--) {
      const b = lastGeom.blocks[i];
      if (px >= b.x - 4 && px <= b.x + b.w + 4 && py >= b.y - 4 && py <= b.y + b.h + 4) {
        return { mode: "block", blockId: b.id };
      }
    }
    return null;
  }

  function startDrag(clientX, clientY, isTouch) {
    const pt = pointInCanvas(clientX, clientY);
    const hit = hitTest(pt.x, pt.y);
    const state = getState();
    if (hit && hit.mode === "hangline") {
      drag = {
        mode: "hangline",
        startClientX: clientX,
        startClientY: clientY,
        startHang: state.hangline,
        isTouch,
        decided: true,
      };
      canvas.classList.add("is-dragging");
      return;
    }

    const blockId = hit ? hit.blockId : state.selectedId;
    const blk = state.blocks.find((b) => b.id === blockId) || state.blocks[0];
    if (hit && hit.blockId !== state.selectedId) {
      setState({ ...state, selectedId: hit.blockId });
    }
    drag = {
      mode: "block",
      blockId: blk.id,
      startClientX: clientX,
      startClientY: clientY,
      startU: blk.u,
      startV: blk.v,
      isTouch,
      decided: !isTouch, // 鼠标直接拖动；触屏先判横/纵，确保纵向滚动流畅
    };
    canvas.classList.add("is-dragging");
    markDirty();
  }

  function moveDrag(clientX, clientY, ev) {
    if (!drag || !lastGeom) return;
    const dx = clientX - drag.startClientX;
    const dy = clientY - drag.startClientY;

    if (drag.isTouch && !drag.decided) {
      if (Math.hypot(dx, dy) < 5) return;
      // 触屏：明显竖滑时放行给页面滚动，横向拖拽锁定画布
      if (Math.abs(dy) > Math.abs(dx) * 1.35) {
        drag = null;
        canvas.classList.remove("is-dragging");
        return;
      }
      drag.decided = true;
    }
    if (ev && ev.cancelable) ev.preventDefault();

    const state = getState();
    if (drag.mode === "hangline") {
      const nextHang = clamp(drag.startHang + dy / lastGeom.innerH, 0.28, 0.54);
      const nextBlocks = state.blocks.map((b) =>
        b.rowSlot === "lower" ? { ...b, v: nextHang + 0.025 } : b
      );
      activeLasers = { y: lastGeom.innerY + nextHang * lastGeom.innerH };
      setState({ ...state, hangline: nextHang, blocks: nextBlocks }, true);
      return;
    }

    const blk = state.blocks.find((b) => b.id === drag.blockId);
    if (!blk) return;

    const maxU = Math.max(0, 1 - (blk.colSpan * lastGeom.colW + (blk.colSpan - 1) * lastGeom.drawGutter) / lastGeom.innerW);
    let nextU = clamp(drag.startU + dx / lastGeom.innerW, 0, maxU);
    let nextV = clamp(drag.startV + (drag.isTouch ? 0 : dy / lastGeom.innerH), 0.01, 0.82);

    let laserX = null;
    let laserY = null;
    const snapThreshU = state.snap ? 0.048 : 0.012;
    const snapThreshV = state.snap ? 0.048 : 0.012;

    // 检查最近列轨左缘
    for (const c of lastGeom.cols) {
      if (Math.abs(nextU - c.u0) < snapThreshU) {
        if (state.snap) nextU = c.u0;
        laserX = c.x0;
        break;
      }
    }
    // 检查最近水平挂线
    const anchorsV = [
      { v: 0.05, y: lastGeom.flowlines.top.y },
      { v: state.hangline + 0.025, y: lastGeom.flowlines.mid.y + lastGeom.innerH * 0.025 },
      { v: 0.72, y: lastGeom.flowlines.row2.y },
    ];
    for (const a of anchorsV) {
      if (Math.abs(nextV - a.v) < snapThreshV) {
        if (state.snap) nextV = a.v;
        laserY = a.y;
        break;
      }
    }

    activeLasers = laserX != null || laserY != null ? { x: laserX, y: laserY } : null;
    const nextBlocks = state.blocks.map((b) => (b.id === blk.id ? { ...b, u: nextU, v: nextV } : b));
    setState({ ...state, blocks: nextBlocks }, true);
  }

  function endDrag() {
    if (!drag) return;
    drag = null;
    activeLasers = null;
    canvas.classList.remove("is-dragging");
    markDirty();
  }

  // 鼠标事件
  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    canvas.focus({ preventScroll: true });
    startDrag(e.clientX, e.clientY, false);
  });
  window.addEventListener("mousemove", (e) => {
    if (drag && !drag.isTouch) moveDrag(e.clientX, e.clientY, e);
  });
  window.addEventListener("mouseup", () => {
    if (drag && !drag.isTouch) endDrag();
  });

  // 原生 Touch 事件（兼顾手机流畅滚屏与 perf.mjs 的 touchStart/touchMove 压测）
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const t0 = e.touches[0];
    startDrag(t0.clientX, t0.clientY, true);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!drag || !drag.isTouch || !e.touches.length) return;
    const t0 = e.touches[0];
    moveDrag(t0.clientX, t0.clientY, e);
  }, { passive: false });
  canvas.addEventListener("touchend", () => {
    if (drag && drag.isTouch) endDrag();
  });
  canvas.addEventListener("touchcancel", () => {
    if (drag && drag.isTouch) endDrag();
  });

  // 键盘精调选中块（方向键移动、Tab/Bracket 切块、Space 开关透视骨架）
  canvas.addEventListener("keydown", (e) => {
    const state = getState();
    const stepU = e.shiftKey ? 0.04 : 0.015;
    const stepV = e.shiftKey ? 0.04 : 0.015;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      const idx = state.blocks.findIndex((b) => b.id === state.selectedId);
      const blk = state.blocks[idx >= 0 ? idx : 0];
      let u = blk.u;
      let v = blk.v;
      if (e.key === "ArrowLeft") u -= stepU;
      if (e.key === "ArrowRight") u += stepU;
      if (e.key === "ArrowUp") v -= stepV;
      if (e.key === "ArrowDown") v += stepV;
      u = clamp(u, 0, 0.88);
      v = clamp(v, 0.01, 0.82);
      const nextBlocks = state.blocks.map((b) => (b.id === blk.id ? { ...b, u, v } : b));
      setState({ ...state, blocks: nextBlocks });
    } else if (e.key === " ") {
      e.preventDefault();
      setState({ ...state, xray: !state.xray });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!lastGeom) return;
      const gb = lastGeom.blocks.find((b) => b.id === state.selectedId);
      if (!gb) return;
      const snapped = snapBlockToGrid(gb, lastGeom);
      const nextBlocks = state.blocks.map((b) => (b.id === gb.id ? { ...b, ...snapped } : b));
      setState({ ...state, blocks: nextBlocks });
    }
  });

  const ro = new ResizeObserver(() => {
    resize();
    markDirty();
  });
  ro.observe(canvas);

  const ctl = loop(canvas, renderFrame);

  return {
    redraw(deferToRaf = false) {
      markDirty();
      if (!deferToRaf || reducedMotion.matches) ctl.draw();
    },
    getGeom() {
      return lastGeom || computeGeometry(getState(), W, H);
    },
    getAudit() {
      return lastAudit;
    },
  };
}

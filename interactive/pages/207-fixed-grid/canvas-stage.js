// 207 固定网格 · 2D Canvas 活体拼版台（1:1 承袭 207 原海报樱粉列带、虚线行格与 6 枚模块）
import { loop, pixelRatio } from "../../lib/stage.js";
import { evaluate, spanWidth, BLOCK_DEFS, BASELINE_STEP } from "./model.js";

const COLORS = {
  paper: "#FDEEEC",
  colBand: "#FBD8D9",
  colBandErr: "#FAD0D4",
  gutterBg: "#FDEFEC",
  plum: "#651834",
  plumSoft: "#8D4D64",
  plumDash: "#B08291",
  vermilion: "#FB391F",
  vermilionInk: "#BA1F0B",
  ink: "#150F12",
  ink2: "#4A333C",
  rule: "#C9A7B0",
  ok: "#146648",
  err: "#B31924",
  errFill: "rgba(179, 25, 36, 0.12)",
  okFill: "rgba(20, 102, 72, 0.12)",
};

export function createGridStage({ canvas, getState, setState, onChange }) {
  const ctx = canvas.getContext("2d");
  let intro = 0; // 0..1 开场展开进度
  let drag = null; // { id, offsetX, offsetY, startClientX, startClientY, moved, mode: "block"|"center" }
  let hoverId = null;
  let flashOk = 0; // 磁吸瞬闪
  let dirty = true;
  let lastW = 0, lastH = 0;
  const markDirty = () => { dirty = true; };

  // 画布内坐标系映射：将固定网格 W × H 等比安放在画布内（留顶部尺寸标尺与底部微边距）
  function getLayout(cssW, cssH, grid) {
    const padX = 16;
    const topRuler = 36;
    const padBottom = 16;
    const availW = Math.max(120, cssW - padX * 2);
    const availH = Math.max(120, cssH - topRuler - padBottom);
    const scale = Math.min(availW / grid.W, availH / grid.H);
    const drawW = grid.W * scale;
    const drawH = grid.H * scale;
    const ox = (cssW - drawW) / 2;
    const oy = topRuler + (availH - drawH) / 2;
    return { ox, oy, scale, drawW, drawH, topRuler };
  }

  function clientToGrid(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const ev = evaluate(getState());
    const lay = getLayout(rect.width, rect.height, ev.grid);
    return {
      gx: (cx - lay.ox) / lay.scale,
      gy: (cy - lay.oy) / lay.scale,
      cx, cy, lay, ev,
    };
  }

  function hitTest(gx, gy, rects) {
    // 逆序命中，保证选中块或视觉焦点朱红圆优先响应
    const order = [...rects].sort((a, b) => (a.id === getState().selectedId ? 1 : b.id === getState().selectedId ? -1 : 0));
    for (let i = order.length - 1; i >= 0; i--) {
      const r = order[i];
      if (gx >= r.x - 6 && gx <= r.x + r.w + 6 && gy >= r.y - 6 && gy <= r.y + r.h + 6) {
        return r;
      }
    }
    return null;
  }

  function moveBlock(id, rawX, rawY, doSnap) {
    const s = getState();
    const ev = evaluate(s);
    const grid = ev.grid;
    const blk = s.blocks.find((b) => b.id === id);
    if (!blk) return;
    const w = spanWidth(grid, blk.span);
    const h = grid.rowH;
    let nx = Math.max(4, Math.min(grid.W - w - 4, rawX));
    let ny = Math.max(6, Math.min(grid.H - h - 6, rawY));

    if (doSnap && s.snap) {
      const snapDist = Math.max(10, grid.colW * 0.14);
      // 轻吸附到最近列起线
      let bestC = null, bestDx = snapDist;
      for (let c = 0; c <= grid.cols - blk.span; c++) {
        const d = Math.abs(nx - grid.colStarts[c]);
        if (d < bestDx) { bestDx = d; bestC = grid.colStarts[c]; }
      }
      if (bestC !== null) { nx = bestC; flashOk = 0.35; }
      // 轻吸附到最近行起线
      let bestR = null, bestDy = 14;
      for (let r = 0; r < grid.rowStarts.length; r++) {
        const d = Math.abs(ny - grid.rowStarts[r]);
        if (d < bestDy) { bestDy = d; bestR = grid.rowStarts[r]; }
      }
      if (bestR !== null) ny = bestR;
    }

    const blocks = s.blocks.map((b) => (b.id === id ? { ...b, x: +nx.toFixed(1), y: +ny.toFixed(1) } : b));
    setState({ ...s, selectedId: id, blocks });
    onChange();
    markDirty();
    ctl.draw();
  }

  // 鼠标指针事件
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏单独用 touch 事件兼容纵向滚动与 perf.mjs
    const pt = clientToGrid(e.clientX, e.clientY);
    const hit = hitTest(pt.gx, pt.gy, pt.ev.rects);
    const target = hit || pt.ev.rects.find((r) => r.id === "circle") || pt.ev.rects[0];
    if (!target) return;
    canvas.setPointerCapture(e.pointerId);
    const s = getState();
    if (s.selectedId !== target.id) {
      setState({ ...s, selectedId: target.id });
      onChange();
    }
    drag = {
      id: target.id,
      offsetX: hit ? pt.gx - target.x : target.w / 2,
      offsetY: hit ? pt.gy - target.y : target.h / 2,
      startX: target.x,
      startY: target.y,
      startGx: pt.gx,
      startGy: pt.gy,
      directHit: !!hit,
    };
    canvas.style.cursor = "grabbing";
    ctl.draw();
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const pt = clientToGrid(e.clientX, e.clientY);
    if (drag) {
      const nx = drag.directHit ? pt.gx - drag.offsetX : drag.startX + (pt.gx - drag.startGx);
      const ny = drag.directHit ? pt.gy - drag.offsetY : drag.startY;
      moveBlock(drag.id, nx, ny, false);
      return;
    }
    const hit = hitTest(pt.gx, pt.gy, pt.ev.rects);
    const nextHover = hit ? hit.id : null;
    if (nextHover !== hoverId) {
      hoverId = nextHover;
      canvas.style.cursor = hoverId ? "grab" : "ew-resize";
      markDirty();
      ctl.draw();
    }
  });

  const finishPointer = () => {
    if (!drag) return;
    const cur = getState().blocks.find((b) => b.id === drag.id);
    const id = drag.id;
    drag = null;
    canvas.style.cursor = hoverId ? "grab" : "ew-resize";
    if (cur) moveBlock(id, cur.x, cur.y, true);
  };
  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", finishPointer);

  // 触屏：水平滑动顺畅拖动朱红焦点或命中模块（确保页面可纵向滚，且 perf.mjs dispatchTouchEvent 每帧丝滑重画！）
  let touchDrag = null;
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const pt = clientToGrid(t.clientX, t.clientY);
    const hit = hitTest(pt.gx, pt.gy, pt.ev.rects);
    const target = hit || pt.ev.rects.find((r) => r.id === "circle") || pt.ev.rects[0];
    if (!target) return;
    touchDrag = {
      id: target.id,
      startClientX: t.clientX,
      startClientY: t.clientY,
      startX: target.x,
      startY: target.y,
      offsetX: hit ? pt.gx - target.x : target.w / 2,
      offsetY: hit ? pt.gy - target.y : target.h / 2,
      startGx: pt.gx,
      directHit: !!hit,
      locked: null, // "h" | "v"
    };
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!touchDrag || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - touchDrag.startClientX;
    const dy = t.clientY - touchDrag.startClientY;
    if (!touchDrag.locked) {
      if (Math.hypot(dx, dy) < 4) return;
      touchDrag.locked = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
    }
    if (touchDrag.locked === "v") return; // 放行页面纵向滚动
    e.preventDefault();
    const pt = clientToGrid(t.clientX, t.clientY);
    const nx = touchDrag.directHit ? pt.gx - touchDrag.offsetX : touchDrag.startX + (pt.gx - touchDrag.startGx);
    const ny = touchDrag.directHit ? touchDrag.startY + (pt.gy - (touchDrag.startY + touchDrag.offsetY)) * 0.45 : touchDrag.startY;
    moveBlock(touchDrag.id, nx, ny, false);
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    if (!touchDrag) return;
    if (touchDrag.locked === "h") {
      const cur = getState().blocks.find((b) => b.id === touchDrag.id);
      if (cur) moveBlock(touchDrag.id, cur.x, cur.y, true);
    }
    touchDrag = null;
  }, { passive: true });

  // 双击画布某块直接吸附归格
  canvas.addEventListener("dblclick", (e) => {
    const pt = clientToGrid(e.clientX, e.clientY);
    const hit = hitTest(pt.gx, pt.gy, pt.ev.rects);
    if (!hit) return;
    const s = getState();
    const blocks = s.blocks.map((b) =>
      b.id === hit.id
        ? { ...b, x: +pt.ev.grid.colStarts[hit.bestCol].toFixed(1), y: pt.ev.grid.rowStarts[hit.bestRow] }
        : b
    );
    flashOk = 0.5;
    setState({ ...s, selectedId: hit.id, blocks });
    onChange();
    ctl.draw();
  });

  // 键盘操作：方向键微调当前选中模块（Shift + 方向键按整列跳步）
  canvas.addEventListener("keydown", (e) => {
    const s = getState();
    const ev = evaluate(s);
    const cur = s.blocks.find((b) => b.id === s.selectedId) || s.blocks[0];
    if (!cur) return;
    const stepX = e.shiftKey ? ev.grid.colW + ev.grid.g : 8;
    const stepY = e.shiftKey ? ev.grid.rowH + ev.grid.rowGap : 8;
    if (e.key === "ArrowLeft") { e.preventDefault(); moveBlock(cur.id, cur.x - stepX, cur.y, e.shiftKey); }
    else if (e.key === "ArrowRight") { e.preventDefault(); moveBlock(cur.id, cur.x + stepX, cur.y, e.shiftKey); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveBlock(cur.id, cur.x, cur.y - stepY, e.shiftKey); }
    else if (e.key === "ArrowDown") { e.preventDefault(); moveBlock(cur.id, cur.x, cur.y + stepY, e.shiftKey); }
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const r = ev.rects.find((x) => x.id === cur.id);
      if (r) {
        const blocks = s.blocks.map((b) =>
          b.id === cur.id ? { ...b, x: +ev.grid.colStarts[r.bestCol].toFixed(1), y: ev.grid.rowStarts[r.bestRow] } : b
        );
        flashOk = 0.45;
        setState({ ...s, blocks });
        onChange();
        ctl.draw();
      }
    }
  });

  // 辅助绘制函数
  function drawDimArrow(x1, x2, y, label, accent) {
    ctx.save();
    ctx.strokeStyle = accent || COLORS.ink2;
    ctx.fillStyle = accent || COLORS.ink;
    ctx.lineWidth = 1;
    // 端点短竖线
    ctx.beginPath();
    ctx.moveTo(x1, y - 4); ctx.lineTo(x1, y + 4);
    ctx.moveTo(x2, y - 4); ctx.lineTo(x2, y + 4);
    ctx.moveTo(x1, y); ctx.lineTo(x2, y);
    ctx.stroke();
    // 箭头尖
    if (x2 - x1 > 22) {
      ctx.beginPath();
      ctx.moveTo(x1 + 5, y - 2.8); ctx.lineTo(x1, y); ctx.lineTo(x1 + 5, y + 2.8);
      ctx.moveTo(x2 - 5, y - 2.8); ctx.lineTo(x2, y); ctx.lineTo(x2 - 5, y + 2.8);
      ctx.stroke();
    }
    if (label) {
      ctx.font = '700 10px "Space Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(label, (x1 + x2) / 2, y - 5);
    }
    ctx.restore();
  }

  function drawBlockShape(r, theme, ev, scale, state) {
    const x = r.x * scale;
    const y = r.y * scale;
    const w = r.w * scale;
    const h = r.h * scale;
    const isSel = state.selectedId === r.id;
    const isHov = hoverId === r.id;

    ctx.save();
    if (theme === "poster") {
      // 1:1 忠实复刻 207 原海报 6 枚几何标志块
      if (r.kind === "square-lg") {
        ctx.fillStyle = COLORS.plum;
        ctx.fillRect(x, y, w, h);
      } else if (r.kind === "cross") {
        // 原海报右上深紫大 × + 四角极细定位框角
        const pad = Math.min(w, h) * 0.14;
        const cx = x + w / 2, cy = y + h / 2;
        const arm = Math.min(w, h) * 0.38;
        const thick = Math.max(7, Math.min(w, h) * 0.19);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = COLORS.plum;
        ctx.fillRect(-arm, -thick / 2, arm * 2, thick);
        ctx.fillRect(-thick / 2, -arm, thick, arm * 2);
        ctx.restore();
        // 原海报 × 四角的小细方角标记
        ctx.strokeStyle = COLORS.plumSoft;
        ctx.lineWidth = 1;
        const m = 5;
        ctx.beginPath();
        ctx.moveTo(x + pad, y + pad + m); ctx.lineTo(x + pad, y + pad); ctx.lineTo(x + pad + m, y + pad);
        ctx.moveTo(x + w - pad - m, y + pad); ctx.lineTo(x + w - pad, y + pad); ctx.lineTo(x + w - pad, y + pad + m);
        ctx.moveTo(x + pad, y + h - pad - m); ctx.lineTo(x + pad, y + h - pad); ctx.lineTo(x + pad + m, y + h - pad);
        ctx.moveTo(x + w - pad - m, y + h - pad); ctx.lineTo(x + w - pad, y + h - pad); ctx.lineTo(x + w - pad, y + h - pad - m);
        ctx.stroke();
      } else if (r.kind === "circle") {
        // 原海报中央唯一亮色：信号朱红饱满实心圆
        const rad = Math.min(w, h) * 0.45;
        ctx.fillStyle = COLORS.vermilion;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, rad, 0, Math.PI * 2);
        ctx.fill();
        // 中心微弱可拖交互环提示
        if (isSel || isHov) {
          ctx.strokeStyle = "rgba(255,255,255,0.72)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x + w / 2, y + h / 2, Math.max(6, rad * 0.28), 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (r.kind === "square-sm") {
        const sq = Math.min(w, h) * 0.84;
        ctx.fillStyle = COLORS.plum;
        ctx.fillRect(x + (w - sq) / 2, y + (h - sq) / 2, sq, sq);
      } else if (r.kind === "triangle") {
        ctx.fillStyle = COLORS.plum;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h * 0.08);
        ctx.lineTo(x + w * 0.96, y + h * 0.96);
        ctx.lineTo(x + w * 0.04, y + h * 0.96);
        ctx.closePath();
        ctx.fill();
      } else if (r.kind === "text") {
        // 原海报右下深紫底 + 4 条实算行高基线白横杠（行距真实受 leadingRatio 控制！）
        ctx.fillStyle = COLORS.plum;
        ctx.fillRect(x, y, w, h);
        const lineStepPx = ev.lineHeightPx * scale;
        const padX = w * 0.12;
        const startY = y + Math.max(12, h * 0.16);
        const widths = [0.76, 0.72, 0.76, 0.52];
        for (let i = 0; i < 4; i++) {
          const ly = startY + i * lineStepPx;
          const out = ly > y + h - 4;
          ctx.fillStyle = out ? "#FF7A66" : "#FDEEEC";
          ctx.fillRect(x + padX, ly, (w - padX * 2) * widths[i], Math.max(2, 2.6 * scale));
        }
        // 如果行高失锁，画出底边戳出/偏离红标线
        if (!ev.pillars.baseline.ok) {
          ctx.strokeStyle = "#FF8288";
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 2]);
          ctx.beginPath();
          ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    } else if (theme === "magazine") {
      // 杂志内页实景（瑞士建筑画册风，继续守住原海报深紫+朱红+浅樱配色）
      if (r.kind === "square-lg") {
        ctx.fillStyle = COLORS.plum;
        ctx.fillRect(x, y, w, h);
        // 极简建筑拱廊剪影
        ctx.fillStyle = "#8C3252";
        ctx.fillRect(x + w * 0.1, y + h * 0.18, w * 0.34, h * 0.64);
        ctx.fillStyle = COLORS.paper;
        ctx.beginPath();
        ctx.arc(x + w * 0.27, y + h * 0.48, Math.min(w, h) * 0.14, Math.PI, 0);
        ctx.lineTo(x + w * 0.27 + Math.min(w, h) * 0.14, y + h * 0.82);
        ctx.lineTo(x + w * 0.27 - Math.min(w, h) * 0.14, y + h * 0.82);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#FDEEEC";
        ctx.font = `700 ${Math.max(10, Math.round(13 * scale))}px "Noto Sans SC", sans-serif`;
        ctx.fillText(`第 ${state.pageNo} 页专题`, x + w * 0.5, y + h * 0.42);
        ctx.font = `400 ${Math.max(9, Math.round(10 * scale))}px "Space Mono", monospace`;
        ctx.fillStyle = "#FBD8D9";
        ctx.fillText(`FIG.0${state.pageNo}`, x + w * 0.5, y + h * 0.62);
      } else if (r.kind === "cross") {
        ctx.fillStyle = "#FFF9F8";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = COLORS.plum;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
        ctx.fillStyle = COLORS.plum;
        ctx.font = `700 ${Math.max(11, Math.round(18 * scale))}px "Chivo", sans-serif`;
        ctx.fillText(`0${state.pageNo}`, x + w * 0.16, y + h * 0.46);
        ctx.fillStyle = COLORS.ink2;
        ctx.font = `400 ${Math.max(8, Math.round(9 * scale))}px "Space Mono", monospace`;
        ctx.fillText("ISSUE", x + w * 0.16, y + h * 0.72);
      } else if (r.kind === "circle") {
        ctx.fillStyle = COLORS.vermilion;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.44, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `700 ${Math.max(9, Math.round(12 * scale))}px "Noto Sans SC", sans-serif`;
        ctx.fillText("焦 点", x + w / 2, y + h / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
      } else if (r.kind === "square-sm") {
        ctx.fillStyle = "#F4CFD2";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = COLORS.plum;
        ctx.fillRect(x + w * 0.12, y + h * 0.18, w * 0.76, h * 0.36);
        ctx.fillStyle = COLORS.ink;
        ctx.fillRect(x + w * 0.12, y + h * 0.66, w * 0.6, 2.5);
        ctx.fillRect(x + w * 0.12, y + h * 0.78, w * 0.42, 2.5);
      } else if (r.kind === "triangle") {
        ctx.fillStyle = COLORS.plum;
        ctx.fillRect(x, y, w, 4);
        ctx.fillStyle = COLORS.plum;
        ctx.font = `400 ${Math.max(18, Math.round(34 * scale))}px "DM Serif Display", serif`;
        ctx.fillText("“", x + w * 0.12, y + h * 0.46);
        ctx.fillStyle = COLORS.ink2;
        ctx.fillRect(x + w * 0.14, y + h * 0.56, w * 0.72, 2.5);
        ctx.fillRect(x + w * 0.14, y + h * 0.72, w * 0.55, 2.5);
      } else if (r.kind === "text") {
        ctx.fillStyle = "#FFF9F8";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = COLORS.plumSoft;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        const step = ev.lineHeightPx * scale;
        const padX = Math.max(8, w * 0.08);
        const startY = y + Math.max(14, h * 0.18);
        const widths = [0.84, 0.78, 0.82, 0.62];
        for (let i = 0; i < 4; i++) {
          const ly = startY + i * step;
          ctx.fillStyle = ly > y + h - 5 ? COLORS.err : COLORS.plum;
          ctx.fillRect(x + padX, ly, (w - padX * 2) * widths[i], Math.max(2, 2.4 * scale));
        }
      }
    } else {
      // 960 网页原型题材
      ctx.fillStyle = r.kind === "circle" ? COLORS.vermilion : r.kind === "heroSq" || r.kind === "square-lg" ? COLORS.plum : "#FFF9F8";
      if (r.kind === "circle") {
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.43, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `700 ${Math.max(9, Math.round(11 * scale))}px "Chivo", sans-serif`;
        ctx.fillText("CTA", x + w / 2, y + h / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
      } else {
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = r.kind === "square-lg" ? COLORS.plum : COLORS.plumSoft;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x + 0.6, y + 0.6, w - 1.2, h - 1.2);
        if (r.kind === "square-lg") {
          ctx.fillStyle = "#FDEEEC";
          ctx.font = `700 ${Math.max(10, Math.round(13 * scale))}px "Chivo", sans-serif`;
          ctx.fillText(`HERO · ${r.span} COLS`, x + 10, y + h * 0.42);
          ctx.fillStyle = COLORS.vermilion;
          ctx.fillRect(x + 10, y + h * 0.56, Math.min(64, w * 0.35), Math.max(10, 14 * scale));
        } else if (r.kind === "text") {
          const step = ev.lineHeightPx * scale;
          const padX = Math.max(8, w * 0.08);
          const startY = y + Math.max(12, h * 0.18);
          for (let i = 0; i < 4; i++) {
            const ly = startY + i * step;
            ctx.fillStyle = ly > y + h - 5 ? COLORS.err : COLORS.ink2;
            ctx.fillRect(x + padX, ly, (w - padX * 2) * (i === 3 ? 0.55 : 0.82), Math.max(2, 2.3 * scale));
          }
        } else {
          ctx.fillStyle = COLORS.plum;
          ctx.fillRect(x + 8, y + 10, Math.max(14, w * 0.45), 6);
          ctx.fillStyle = COLORS.rule;
          ctx.fillRect(x + 8, y + 24, Math.max(12, w * 0.68), 3);
          ctx.fillRect(x + 8, y + 34, Math.max(10, w * 0.52), 3);
        }
      }
    }

    // 脱轨 / 重叠 / 选中框反馈
    const isOverlapping = ev.overlaps.some((pair) => pair.includes(r.id));
    if (isOverlapping || !r.snapped) {
      ctx.strokeStyle = COLORS.err;
      ctx.lineWidth = isSel ? 2.2 : 1.6;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
      ctx.setLineDash([]);
    } else if (isSel || isHov) {
      ctx.strokeStyle = flashOk > 0 ? COLORS.ok : COLORS.ink;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
    }

    // 脱轨红标徽（直接画在模块上方，点或拖一目了然）
    if (!r.snapped || isOverlapping) {
      const msg = isOverlapping
        ? "叠撞 · 拖开"
        : r.hitsGutter
          ? `压缝 ${r.dx > 0 ? "+" : ""}${Math.round(r.dx)}px`
          : `偏轨 ${Math.round(Math.max(r.errX, r.errY))}px`;
      ctx.font = '700 10px "Space Mono", "Noto Sans SC", monospace';
      const tw = ctx.measureText(msg).width + 10;
      const bh = 18;
      const bx = Math.max(2, Math.min(ev.grid.W * scale - tw - 2, x + w / 2 - tw / 2));
      const by = Math.max(2, y - bh - 4);
      ctx.fillStyle = COLORS.err;
      ctx.fillRect(bx, by, tw, bh);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(msg, bx + tw / 2, by + bh / 2 + 0.5);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }
    ctx.restore();
  }

  function frame(t, dt, { still }) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const dpr = pixelRatio(2);
    const pw = Math.round(rect.width * dpr);
    const ph = Math.round(rect.height * dpr);
    if (pw !== lastW || ph !== lastH) {
      lastW = pw;
      lastH = ph;
      dirty = true;
    }

    const animating = !still && (intro < 1 || flashOk > 0);
    if (!dirty && !animating && !still) return;
    dirty = false;

    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }

    if (still) {
      intro = 1;
      flashOk = 0;
    } else {
      intro = Math.min(1, intro + (dt || 0.016) * 2.1);
      if (flashOk > 0) flashOk = Math.max(0, flashOk - (dt || 0.016));
    }
    const ease = 1 - Math.pow(1 - intro, 3);

    const state = getState();
    const ev = evaluate(state);
    const { grid, rects } = ev;
    const lay = getLayout(rect.width, rect.height, grid);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 顶部 1:1 原海报工程标尺：|← MARGIN →|←—— COLUMN ——→|← MARGIN →|
    const bx0 = lay.ox;
    const bx1 = lay.ox + grid.mL * lay.scale;
    const bx2 = lay.ox + (grid.W - grid.mR) * lay.scale;
    const bx3 = lay.ox + lay.drawW;
    const ry = lay.oy - 14;
    const mAccent = grid.isSymMargin ? COLORS.ink2 : COLORS.err;
    const colAccent = grid.isIntCol ? COLORS.plum : COLORS.err;
    const colSummary = `${grid.cols} COLS · ${grid.isIntCol ? Math.round(grid.colW) : grid.colW.toFixed(1)}px`;
    drawDimArrow(bx0, bx1, ry, rect.width > 360 ? `M ${grid.mL}` : `${grid.mL}`, mAccent);
    drawDimArrow(bx1, bx2, ry, `COLUMN (${colSummary})`, colAccent);
    drawDimArrow(bx2, bx3, ry, rect.width > 360 ? `M ${grid.mR}` : `${grid.mR}`, mAccent);

    // 进入网格内部坐标系（原点在 lay.ox, lay.oy）
    ctx.save();
    ctx.translate(lay.ox, lay.oy);

    // 画板浅底
    ctx.fillStyle = COLORS.gutterBg;
    ctx.fillRect(0, 0, lay.drawW, lay.drawH);

    // 1. 樱粉列带（开场从上至下依次舒展）
    for (let i = 0; i < grid.cols; i++) {
      const colProgress = Math.max(0, Math.min(1, (ease * 1.25) - i * 0.03));
      const sx = grid.colStarts[i] * lay.scale;
      const sw = grid.colW * lay.scale;
      ctx.fillStyle = grid.isIntCol ? COLORS.colBand : COLORS.colBandErr;
      ctx.fillRect(sx, 0, sw, lay.drawH * colProgress);
      // 顶部列号微标（只在足够宽时显示，保持精致清爽）
      if (sw >= 22 && intro > 0.3) {
        ctx.fillStyle = COLORS.plumSoft;
        ctx.font = '700 10px "Space Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText(String(i + 1), sx + sw / 2, 14);
      }
    }
    ctx.textAlign = "left";

    // 2. 可选基线细纹（8px 基线步距映射）
    if (state.showBaseline) {
      ctx.strokeStyle = "rgba(101, 24, 52, 0.08)";
      ctx.lineWidth = 1;
      const stepY = BASELINE_STEP * 2 * lay.scale; // 16px 格纹清晰不杂乱
      ctx.beginPath();
      for (let yy = stepY; yy < lay.drawH; yy += stepY) {
        ctx.moveTo(0, yy);
        ctx.lineTo(lay.drawW, yy);
      }
      ctx.stroke();
    }

    // 3. 1:1 复刻原海报深紫虚线横格与列外边界线
    ctx.strokeStyle = COLORS.plumDash;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    // 外框
    ctx.strokeRect(0.5, 0.5, lay.drawW - 1, lay.drawH - 1);
    // 左右边距竖虚线
    ctx.beginPath();
    ctx.moveTo(grid.mL * lay.scale, 0); ctx.lineTo(grid.mL * lay.scale, lay.drawH);
    ctx.moveTo((grid.W - grid.mR) * lay.scale, 0); ctx.lineTo((grid.W - grid.mR) * lay.scale, lay.drawH);
    // 每行起止横虚线
    for (let r = 0; r < grid.rowStarts.length; r++) {
      const yTop = grid.rowStarts[r] * lay.scale;
      const yBot = (grid.rowStarts[r] + grid.rowH) * lay.scale;
      ctx.moveTo(0, yTop); ctx.lineTo(lay.drawW, yTop);
      ctx.moveTo(0, yBot); ctx.lineTo(lay.drawW, yBot);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. 拖动中的当前块垂直对齐投影线（精确视觉辅助）
    const activeId = drag ? drag.id : touchDrag ? touchDrag.id : state.selectedId;
    const activeRect = rects.find((r) => r.id === activeId);
    if (activeRect) {
      const ax = activeRect.x * lay.scale;
      const ax2 = (activeRect.x + activeRect.w) * lay.scale;
      ctx.save();
      ctx.strokeStyle = activeRect.snapped ? COLORS.ok : COLORS.err;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(ax, 0); ctx.lineTo(ax, lay.drawH);
      ctx.moveTo(ax2, 0); ctx.lineTo(ax2, lay.drawH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 5. 绘制 6 枚模块（按选中置顶）
    const drawOrder = [...rects].sort((a, b) => (a.id === activeId ? 1 : b.id === activeId ? -1 : 0));
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.75 * ease;
    for (const r of drawOrder) {
      drawBlockShape(r, state.theme, ev, lay.scale, state);
    }
    ctx.restore();

    // 6. 视觉重心竖向微标（底部三角刻度，实时展示稳定平衡！）
    const cxDraw = ev.centroidX * lay.scale;
    const midDraw = (grid.W / 2) * lay.scale;
    ctx.save();
    ctx.strokeStyle = Math.abs(ev.balanceShiftPct) > 18 ? COLORS.err : COLORS.plumSoft;
    ctx.fillStyle = Math.abs(ev.balanceShiftPct) > 18 ? COLORS.err : COLORS.plum;
    ctx.beginPath();
    ctx.moveTo(midDraw, lay.drawH - 6); ctx.lineTo(midDraw, lay.drawH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cxDraw, lay.drawH - 8);
    ctx.lineTo(cxDraw - 4.5, lay.drawH);
    ctx.lineTo(cxDraw + 4.5, lay.drawH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 7. 模拟视口窄屏溢出红线遮罩（如果 viewportW < totalWidth）
    if (ev.overflowPx > 0) {
      const cutX = Math.max(24, (state.viewportW / grid.W) * lay.drawW);
      ctx.save();
      ctx.fillStyle = "rgba(179, 25, 36, 0.22)";
      ctx.fillRect(cutX, 0, lay.drawW - cutX, lay.drawH);
      // 斜纹警戒线
      ctx.beginPath();
      ctx.rect(cutX, 0, lay.drawW - cutX, lay.drawH);
      ctx.clip();
      ctx.strokeStyle = "rgba(179, 25, 36, 0.35)";
      ctx.lineWidth = 1.2;
      for (let d = -lay.drawH; d < lay.drawW; d += 12) {
        ctx.moveTo(cutX + d, 0);
        ctx.lineTo(cutX + d + lay.drawH, lay.drawH);
      }
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = COLORS.err;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cutX, -6); ctx.lineTo(cutX, lay.drawH + 6);
      ctx.stroke();

      const tag = `视口 ${state.viewportW}px · 溢出 +${ev.overflowPx}px`;
      ctx.font = '700 11px "Space Mono", "Noto Sans SC", monospace';
      const tw = ctx.measureText(tag).width + 14;
      const tx = Math.max(4, Math.min(lay.drawW - tw - 4, cutX - tw / 2));
      ctx.fillStyle = COLORS.err;
      ctx.fillRect(tx, lay.drawH / 2 - 12, tw, 24);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tag, tx + tw / 2, lay.drawH / 2);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }

    ctx.restore();
    ctx.restore();
  }

  const ctl = loop(canvas, frame);
  const ro = new ResizeObserver(() => { markDirty(); ctl.draw(); });
  ro.observe(canvas);
  return { draw: () => { markDirty(); ctl.draw(); } };
}

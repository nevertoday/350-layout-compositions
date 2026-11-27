// 056 四象限构图 — 开场「十字轴四象限编排台」2D Canvas 引擎
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  PALETTE,
  TONE_META,
  SHAPE_META,
  SPECIMENS,
  clamp,
  cycleItemStyle,
  evaluate,
} from "./model.js";

const SNAP_CENTER = 0.022;

export function createHeroWorkbench({ canvas, state, onChange }) {
  const ctx = canvas.getContext("2d");

  let W = 680;
  let H = 540;
  let dpr = 1;
  let pad = { l: 28, r: 28, t: 38, b: 32 };
  let frame = { x: 28, y: 38, w: 624, h: 470, aspect: 1.32 };

  // 动效与交互态
  let reveal = 0; // 0..1 开场建筑线条进入（第一帧已有 78% 完整度，绝不空屏）
  let cruise = { active: false, progress: 0 };
  let drag = null; // { kind: 'origin'|'item'|'axisX', id?, startX, startY, origU, origV, moved }
  let hover = null; // { kind: 'origin'|'item', id? }
  let dirty = true;
  let layoutReady = false;
  let evalDirty = true;
  let latestEval = evaluate(state, 1.22);

  function computeLayout() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    dpr = pixelRatio(2);
    const nw = Math.round(rect.width * dpr);
    const nh = Math.round(rect.height * dpr);
    if (canvas.width !== nw || canvas.height !== nh) {
      canvas.width = nw;
      canvas.height = nh;
    }
    W = rect.width;
    H = rect.height;
    const compact = W < 440;
    pad = compact
      ? { l: 16, r: 16, t: 32, b: 26 }
      : { l: 26, r: 26, t: 38, b: 30 };
    const fw = Math.max(120, W - pad.l - pad.r);
    const fh = Math.max(120, H - pad.t - pad.b);
    frame = { x: pad.l, y: pad.t, w: fw, h: fh, aspect: fw / fh };
    layoutReady = true;
    evalDirty = true;
    return true;
  }

  const toX = (u) => frame.x + u * frame.w;
  const toY = (v) => frame.y + v * frame.h;
  const fromX = (px) => (px - frame.x) / frame.w;
  const fromY = (py) => (py - frame.y) / frame.h;

  function notify() {
    latestEval = evaluate(state, frame.aspect);
    evalDirty = false;
    dirty = true;
    onChange(latestEval);
  }

  function triggerCruise() {
    cruise = { active: true, progress: 0 };
    dirty = true;
    ticker.draw();
  }

  function hitTest(px, py) {
    const ox = toX(state.ax);
    const oy = toY(state.ay);
    if (Math.hypot(px - ox, py - oy) <= (W < 440 ? 28 : 24)) {
      return { kind: "origin" };
    }
    const ev = latestEval;
    for (let i = ev.measured.length - 1; i >= 0; i--) {
      const m = ev.measured[i];
      const x0 = toX(m.x0) - 8;
      const x1 = toX(m.x1) + 8;
      const y0 = toY(m.y0) - 8;
      const y1 = toY(m.y1) + 8;
      if (px >= x0 && px <= x1 && py >= y0 && py <= y1) {
        return { kind: "item", id: m.id };
      }
    }
    return { kind: "axisX" };
  }

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function startDrag(px, py, isTouch = false) {
    const hit = hitTest(px, py);
    if (hit.kind === "origin") {
      drag = { kind: "origin", startX: px, startY: py, origAx: state.ax, origAy: state.ay, moved: false, isTouch };
    } else if (hit.kind === "item") {
      const it = state.items.find((x) => x.id === hit.id);
      state.selectedId = hit.id;
      drag = { kind: "item", id: hit.id, startX: px, startY: py, origU: it.u, origV: it.v, moved: false, isTouch };
      notify();
    } else {
      drag = { kind: "axisX", startX: px, startY: py, origAx: state.ax, origAy: state.ay, moved: false, isTouch };
    }
  }

  function moveDrag(px, py) {
    if (!drag) return false;
    const dx = px - drag.startX;
    const dy = py - drag.startY;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;

    if (drag.kind === "origin") {
      let nax = clamp(drag.origAx + dx / frame.w, 0.25, 0.75);
      let nay = clamp(drag.origAy + dy / frame.h, 0.25, 0.75);
      if (Math.abs(nax - 0.5) < SNAP_CENTER) nax = 0.5;
      if (Math.abs(nay - 0.5) < SNAP_CENTER) nay = 0.5;
      state.ax = nax;
      state.ay = nay;
      notify();
      return true;
    }

    if (drag.kind === "item") {
      const it = state.items.find((x) => x.id === drag.id);
      if (it && drag.moved) {
        it.u = clamp(drag.origU + dx / frame.w, 0.11, 0.89);
        it.v = clamp(drag.origV + dy / frame.h, 0.12, 0.88);
        notify();
        return true;
      }
      return false;
    }

    if (drag.kind === "axisX") {
      // 空白处横拖平滑推拉竖向分割轴（触屏竖滑留给页面滚动，横拖流畅调轴）
      if (drag.isTouch && Math.abs(dy) > Math.abs(dx) * 1.45 && Math.abs(dx) < 12) {
        return false;
      }
      let nax = clamp(drag.origAx + dx / frame.w, 0.25, 0.75);
      if (Math.abs(nax - 0.5) < SNAP_CENTER * 0.75) nax = 0.5;
      state.ax = nax;
      if (!drag.isTouch && Math.abs(dy) > 10) {
        let nay = clamp(drag.origAy + (dy * 0.55) / frame.h, 0.25, 0.75);
        if (Math.abs(nay - 0.5) < SNAP_CENTER * 0.75) nay = 0.5;
        state.ay = nay;
      }
      notify();
      return true;
    }
    return false;
  }

  function endDrag() {
    if (!drag) return;
    if (drag.kind === "item" && !drag.moved) {
      const it = state.items.find((x) => x.id === drag.id);
      if (it) {
        cycleItemStyle(it);
        notify();
      }
    } else if (drag.kind === "origin" && !drag.moved) {
      // 单击轴心圆核：在 孤岛断联 -> 对角回声 -> 顺时针导引 间切换
      const order = ["diagonal", "cycle", "none"];
      const next = order[(order.indexOf(state.echoMode) + 1) % order.length];
      state.echoMode = next;
      notify();
    }
    drag = null;
    dirty = true;
    ticker.draw();
  }

  // Pointer Events（覆盖鼠标 + 现代触控）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const { x, y } = getPos(e);
    startDrag(x, y, e.pointerType === "touch");
    if (drag && (drag.kind === "origin" || drag.kind === "item" || e.pointerType !== "touch")) {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    const { x, y } = getPos(e);
    if (drag) {
      const handled = moveDrag(x, y);
      if (handled) ticker.draw();
      return;
    }
    const h = hitTest(x, y);
    const prevKey = hover ? `${hover.kind}:${hover.id ?? ""}` : "";
    const nextKey = `${h.kind}:${h.id ?? ""}`;
    hover = h;
    canvas.style.cursor = h.kind === "origin" ? "move" : h.kind === "item" ? "grab" : "ew-resize";
    if (prevKey !== nextKey) {
      dirty = true;
      ticker.draw();
    }
  });

  canvas.addEventListener("pointerup", () => endDrag());
  canvas.addEventListener("pointercancel", () => { drag = null; dirty = true; ticker.draw(); });
  canvas.addEventListener("pointerleave", () => {
    if (!drag && hover) { hover = null; dirty = true; ticker.draw(); }
  });

  // 兼容 CDP Input.dispatchTouchEvent（perf.mjs 触屏左右滑动测试）
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const t = e.touches[0];
    const r = canvas.getBoundingClientRect();
    startDrag(t.clientX - r.left, t.clientY - r.top, true);
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!drag || !e.touches.length) return;
    const t = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const handled = moveDrag(t.clientX - r.left, t.clientY - r.top);
    if (handled) {
      if (e.cancelable) e.preventDefault();
      ticker.draw();
    }
  }, { passive: false });

  canvas.addEventListener("touchend", () => endDrag(), { passive: true });

  // 键盘操作（无 Home 键照抄）
  canvas.addEventListener("keydown", (e) => {
    const step = e.altKey ? 0.01 : 0.025;
    if (["1", "2", "3", "4"].includes(e.key)) {
      state.selectedId = Number(e.key) - 1;
      notify();
      ticker.draw();
      return;
    }
    if (e.key === " ") {
      e.preventDefault();
      triggerCruise();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const it = state.items.find((x) => x.id === state.selectedId);
      if (it) { cycleItemStyle(it); notify(); ticker.draw(); }
      return;
    }
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      const dx = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
      const dy = e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0;
      if (e.shiftKey) {
        const it = state.items.find((x) => x.id === state.selectedId);
        if (it) {
          it.u = clamp(it.u + dx, 0.11, 0.89);
          it.v = clamp(it.v + dy, 0.12, 0.88);
        }
      } else {
        state.ax = clamp(state.ax + dx, 0.25, 0.75);
        state.ay = clamp(state.ay + dy, 0.25, 0.75);
      }
      notify();
      ticker.draw();
    }
  });

  // -------- 绘制细节：1:1 原海报视觉语法 --------
  function drawPaperAndGrid(ev, rev) {
    ctx.fillStyle = PALETTE.ivory;
    ctx.fillRect(0, 0, W, H);

    // 画面内纸底
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(frame.x, frame.y, frame.w, frame.h);

    // 极克制的建筑制图点阵底纹
    ctx.fillStyle = "rgba(27, 81, 54, 0.08)";
    const cols = 16;
    const rows = 12;
    for (let i = 1; i < cols; i++) {
      for (let j = 1; j < rows; j++) {
        const gx = frame.x + (frame.w * i) / cols;
        const gy = frame.y + (frame.h * j) / rows;
        ctx.fillRect(gx - 0.7, gy - 0.7, 1.4, 1.4);
      }
    }

    // 策略 2×2 场景下绘制原海报同款虚线象限网格与轴标
    if (state.specimen === "matrix") {
      ctx.save();
      ctx.font = `600 ${W < 440 ? 10 : 11}px "JetBrains Mono", "Noto Sans SC", monospace`;
      ctx.fillStyle = "rgba(27, 81, 54, 0.56)";
      ctx.textAlign = "center";
      ctx.fillText("高增长 ↑", toX(state.ax), frame.y + 14);
      ctx.fillText("低增长 ↓", toX(state.ax), frame.y + frame.h - 6);
      ctx.textAlign = "left";
      ctx.fillText("← 低份额", frame.x + 8, toY(state.ay) - 6);
      ctx.textAlign = "right";
      ctx.fillText("高份额 →", frame.x + frame.w - 8, toY(state.ay) - 6);
      ctx.restore();
    }

    // 四个象限微弱面积着色提示（仅在某象限被压扁或空置时给极克制的赤红告警底色）
    const qRects = [
      { x: frame.x, y: frame.y, w: state.ax * frame.w, h: state.ay * frame.h },
      { x: toX(state.ax), y: frame.y, w: (1 - state.ax) * frame.w, h: state.ay * frame.h },
      { x: frame.x, y: toY(state.ay), w: state.ax * frame.w, h: (1 - state.ay) * frame.h },
      { x: toX(state.ax), y: toY(state.ay), w: (1 - state.ax) * frame.w, h: (1 - state.ay) * frame.h },
    ];
    qRects.forEach((qr, qi) => {
      const crushed = ev.quadAreas[qi] < 0.145;
      const empty = ev.quadCounts[qi] === 0;
      if (crushed || empty) {
        ctx.fillStyle = "rgba(184, 50, 39, 0.085)";
        ctx.fillRect(qr.x, qr.y, qr.w, qr.h);
      }
    });

    // 外框细松绿线 + 建筑刻度
    ctx.strokeStyle = "rgba(27, 81, 54, 0.32)";
    ctx.lineWidth = 1;
    ctx.strokeRect(frame.x + 0.5, frame.y + 0.5, frame.w - 1, frame.h - 1);

    // 顶沿坐标尺与当前通过徽标
    ctx.save();
    ctx.font = `500 ${W < 440 ? 10 : 11}px "JetBrains Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = PALETTE.pineDeep;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const axPct = Math.round(state.ax * 100);
    const ayPct = Math.round(state.ay * 100);
    ctx.fillText(`AXIS ${axPct}% × ${ayPct}%  ·  对比 ${ev.weightRatio.toFixed(1)}× (示意)`, frame.x, pad.t * 0.52);

    // 右上角即时状态药丸
    const badgeText = `${ev.score}/4 · ${ev.shortTag}`;
    const bw = ctx.measureText(badgeText).width + 18;
    const bx = frame.x + frame.w - bw;
    const by = pad.t * 0.52 - 11;
    ctx.fillStyle = ev.score === 4 ? PALETTE.pine : PALETTE.danger;
    ctx.fillRect(bx, by, bw, 22);
    ctx.fillStyle = PALETTE.ivory;
    ctx.textAlign = "center";
    ctx.fillText(badgeText, bx + bw / 2, pad.t * 0.52 + 0.5);
    ctx.restore();

    // 四象限角落坐标与实测面积
    const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;
    const tight = W < 440 || frame.h < 270;
    ctx.save();
    ctx.font = `600 ${tight ? 10 : 11}px "JetBrains Mono", "Noto Sans SC", monospace`;
    ctx.textBaseline = "middle";
    const corners = [
      { x: frame.x + 8, y: frame.y + 13, align: "left", idx: 0 },
      { x: frame.x + frame.w - 8, y: frame.y + 13, align: "right", idx: 1 },
      { x: frame.x + 8, y: frame.y + frame.h - 12, align: "left", idx: 2 },
      { x: frame.x + frame.w - 8, y: frame.y + frame.h - 12, align: "right", idx: 3 },
    ];
    for (const c of corners) {
      const pct = Math.round(ev.quadAreas[c.idx] * 100);
      const warn = ev.quadAreas[c.idx] < 0.145 || ev.quadCounts[c.idx] === 0;
      const lbl = tight ? `Q${c.idx + 1} ${pct}%` : `${spec.quadNames[c.idx]} · ${pct}%`;
      const tw = ctx.measureText(lbl).width + 8;
      const bx = c.align === "left" ? c.x - 4 : c.x - tw + 4;
      ctx.fillStyle = "rgba(245, 238, 227, 0.86)";
      ctx.fillRect(bx, c.y - 8, tw, 16);
      ctx.fillStyle = warn ? PALETTE.danger : "rgba(27, 81, 54, 0.82)";
      ctx.textAlign = c.align;
      ctx.fillText(lbl, c.x, c.y);
    }
    ctx.restore();

    // 底部操作微提示
    ctx.save();
    ctx.font = `400 ${W < 440 ? 10 : 11}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const hint = W < 460
      ? "横拖画布移中轴 · 拖方块归位 · 点方块换形色"
      : "横拖画布或中心圆核移分割轴 · 拖模块归象限 · 单击模块换形色对比 · Space 视线巡航";
    ctx.fillText(hint, frame.x + frame.w / 2, H - pad.b * 0.46);
    ctx.restore();

    // 开场进度条收口装饰线
    if (rev < 1) {
      ctx.fillStyle = PALETTE.terra;
      ctx.fillRect(frame.x, frame.y, frame.w * rev, 2);
    }
  }

  function drawEchoLinks(ev, t) {
    const mode = state.echoMode;
    const ox = toX(state.ax);
    const oy = toY(state.ay);
    const ms = ev.measured;

    if (mode === "none") {
      // 在四象限边缘画极克制的断开短杠，表达孤岛感
      ctx.save();
      ctx.strokeStyle = "rgba(184, 50, 39, 0.42)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 4]);
      const r = Math.min(frame.w, frame.h) * 0.085;
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (mode === "diagonal") {
      // 1:1 呼应原海报 Q4：虚线箭矢沿对角指向中心呼应，外加柔和的对角色彩微点
      ctx.save();
      ctx.strokeStyle = "rgba(27, 81, 54, 0.56)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = -t * 14;
      for (const m of ms) {
        const mx = toX(m.u);
        const my = toY(m.v);
        const ang = Math.atan2(oy - my, ox - mx);
        const startDist = Math.min(m.hw * frame.w, m.hh * frame.h) * 0.72;
        const endDist = 26;
        const dist = Math.hypot(ox - mx, oy - my);
        if (dist > startDist + endDist + 8) {
          const sx = mx + Math.cos(ang) * startDist;
          const sy = my + Math.sin(ang) * startDist;
          const ex = ox - Math.cos(ang) * endDist;
          const ey = oy - Math.sin(ang) * endDist;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();

          // 小箭头
          ctx.save();
          ctx.setLineDash([]);
          ctx.translate(ex, ey);
          ctx.rotate(ang);
          ctx.beginPath();
          ctx.moveTo(-6, -4);
          ctx.lineTo(0, 0);
          ctx.lineTo(-6, 4);
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.restore();
      return;
    }

    if (mode === "cycle") {
      // 按 Q1->Q2->Q4->Q3 形成优雅顺时针弧线呼应
      const byQ = [0, 1, 3, 2].map((q) => ms.find((m) => m.q === q)).filter(Boolean);
      if (byQ.length < 2) return;
      ctx.save();
      ctx.strokeStyle = "rgba(210, 90, 46, 0.62)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 4]);
      ctx.lineDashOffset = -t * 18;
      for (let i = 0; i < byQ.length; i++) {
        const a = byQ[i];
        const b = byQ[(i + 1) % byQ.length];
        const x1 = toX(a.u), y1 = toY(a.v);
        const x2 = toX(b.u), y2 = toY(b.v);
        const cx = (x1 + x2) * 0.5 + (ox - (x1 + x2) * 0.5) * 0.22;
        const cy = (y1 + y2) * 0.5 + (oy - (y1 + y2) * 0.5) * 0.22;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (mode === "chaos") {
      // 全向杂乱交叉网（反例）
      ctx.save();
      ctx.strokeStyle = "rgba(184, 50, 39, 0.65)";
      ctx.lineWidth = 2;
      for (let i = 0; i < ms.length; i++) {
        for (let j = i + 1; j < ms.length; j++) {
          ctx.beginPath();
          ctx.moveTo(toX(ms[i].u), toY(ms[i].v));
          ctx.lineTo(toX(ms[j].u), toY(ms[j].v));
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  function drawCrossAxis(ev, rev) {
    const ox = toX(state.ax);
    const oy = toY(state.ay);
    const skewBad = ev.faults.includes("axis_skew");
    const clashBad = ev.faults.includes("center_clash");
    const axisColor = skewBad || clashBad ? PALETTE.danger : PALETTE.pine;

    ctx.save();
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = skewBad ? 1.8 : 1.5;
    if (skewBad) ctx.setLineDash([6, 4]);

    // 竖向分割轴
    const halfH = frame.h * 0.5 * rev;
    const midY = frame.y + frame.h * 0.5;
    ctx.beginPath();
    ctx.moveTo(ox, Math.max(frame.y, midY - halfH));
    ctx.lineTo(ox, Math.min(frame.y + frame.h, midY + halfH));
    ctx.stroke();

    // 横向分割轴
    const halfW = frame.w * 0.5 * rev;
    const midX = frame.x + frame.w * 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.max(frame.x, midX - halfW), oy);
    ctx.lineTo(Math.min(frame.x + frame.w, midX + halfW), oy);
    ctx.stroke();
    ctx.setLineDash([]);

    // 真实中心微标（当轴偏离中心时，用淡影标出 50%/50% 原点参考）
    if (ev.axisSkew > 0.025 && state.showGuides) {
      const cx = toX(0.5);
      const cy = toY(0.5);
      ctx.strokeStyle = "rgba(27, 81, 54, 0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy);
      ctx.lineTo(cx + 7, cy);
      ctx.moveTo(cx, cy - 7);
      ctx.lineTo(cx, cy + 7);
      ctx.stroke();
    }

    // 1:1 原海报中心双环圆核（十字轴心交点）
    const isHot = (drag && drag.kind === "origin") || (hover && hover.kind === "origin");
    const outerR = isHot ? 21 : 18;
    const innerR = ev.score === 4 ? 8.5 : 7.5;

    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.arc(ox, oy, outerR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = clashBad || skewBad ? PALETTE.danger : PALETTE.pine;
    ctx.lineWidth = isHot ? 2.2 : 1.6;
    ctx.beginPath();
    ctx.arc(ox, oy, outerR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = ev.score === 4
      ? PALETTE.pine
      : (clashBad || skewBad ? PALETTE.danger : PALETTE.terra);
    ctx.beginPath();
    ctx.arc(ox, oy, innerR, 0, Math.PI * 2);
    ctx.fill();

    // 4/4 时外环添一圈极淡松绿庆贺环
    if (ev.score === 4) {
      ctx.strokeStyle = "rgba(27, 81, 54, 0.24)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(ox, oy, outerR + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawModule(m, idx, ev) {
    const x = toX(m.u);
    const y = toY(m.v);
    const rx = m.hw * frame.w;
    const ry = m.hh * frame.h;
    const rMin = Math.min(rx, ry);
    const tone = TONE_META[m.tone] || TONE_META.pine;
    const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;
    const isSel = state.selectedId === m.id;
    const isHover = hover && hover.kind === "item" && hover.id === m.id;

    ctx.save();

    // 模块实体几何（1:1 还原 056 原海报几何语言）
    if (m.shape === "square") {
      ctx.fillStyle = tone.fill;
      ctx.fillRect(x - rx, y - ry, rx * 2, ry * 2);
    } else if (m.shape === "circle") {
      ctx.fillStyle = tone.fill;
      ctx.beginPath();
      ctx.arc(x, y, rMin, 0, Math.PI * 2);
      ctx.fill();
      // 原海报 Q3 招牌大小圆对偶微点缀
      if (state.specimen === "poster") {
        ctx.fillStyle = m.tone === "pine" ? PALETTE.terra : PALETTE.pine;
        ctx.beginPath();
        ctx.arc(x + rMin * 0.82, y + rMin * 0.42, Math.max(5, rMin * 0.24), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (m.shape === "arc") {
      // 原海报 Q1 招牌四分之一圆弧块
      ctx.fillStyle = tone.fill;
      ctx.beginPath();
      const bx = x - rMin;
      const by = y + rMin;
      ctx.moveTo(bx + rMin * 2, by);
      ctx.lineTo(bx, by);
      ctx.arc(bx + rMin * 2, by, rMin * 2, Math.PI, Math.PI * 1.5, false);
      ctx.closePath();
      ctx.fill();
    } else if (m.shape === "stripes") {
      // 原海报 Q3 招牌松绿竖条纹方块
      ctx.fillStyle = PALETTE.ivory;
      ctx.fillRect(x - rx, y - ry, rx * 2, ry * 2);
      const count = 8;
      const gap = (rx * 2) / count;
      ctx.fillStyle = tone.fill;
      for (let i = 0; i < count; i++) {
        ctx.fillRect(x - rx + i * gap + gap * 0.16, y - ry, gap * 0.46, ry * 2);
      }
      ctx.strokeStyle = "rgba(27, 81, 54, 0.28)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x - rx + 0.5, y - ry + 0.5, rx * 2 - 1, ry * 2 - 1);
    } else if (m.shape === "dots") {
      // 原海报 Q1 招牌规整点阵方块
      ctx.fillStyle = "rgba(250, 245, 236, 0.72)";
      ctx.fillRect(x - rx, y - ry, rx * 2, ry * 2);
      const cols = 7;
      const rows = 7;
      ctx.fillStyle = m.tone === "mist" ? "#5A7364" : tone.fill;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const dx = x - rx + ((i + 0.5) / cols) * rx * 2;
          const dy = y - ry + ((j + 0.5) / rows) * ry * 2;
          ctx.beginPath();
          ctx.arc(dx, dy, Math.max(1.8, rMin * 0.048), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.strokeStyle = "rgba(27, 81, 54, 0.22)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(x - rx + 0.5, y - ry + 0.5, rx * 2 - 1, ry * 2 - 1);
      ctx.setLineDash([]);
    }

    // 编辑部专刊 / 策略盘 2×2 的真实版面细部叠加
    if (state.specimen === "editorial") {
      const ink = m.shape === "stripes" || m.shape === "dots" ? PALETTE.ink : tone.inkOn;
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.92;
      ctx.font = `700 ${W < 440 ? 10 : 11}px "Chivo", "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(spec.itemTags[m.id], x, y - 9);
      ctx.font = `600 ${W < 440 ? 11 : 12}px "Noto Sans SC", sans-serif`;
      ctx.fillText(spec.itemTitles[m.id], x, y + 8);
      ctx.globalAlpha = 1;
    } else if (state.specimen === "matrix") {
      const ink = m.shape === "stripes" || m.shape === "dots" ? PALETTE.ink : tone.inkOn;
      ctx.fillStyle = ink;
      ctx.font = `600 ${W < 440 ? 10 : 11}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(spec.itemTags[m.id], x, y - 8);
      ctx.font = `600 ${W < 440 ? 10 : 12}px "Noto Sans SC", sans-serif`;
      ctx.fillText(spec.itemTitles[m.id], x, y + 9);
    } else {
      // 原海报几何标本：简洁编号徽标 + 造型微标
      const pillBg = m.tone === "pine" || m.tone === "terra" ? "rgba(250,245,236,0.92)" : "rgba(27,81,54,0.90)";
      const pillFg = m.tone === "pine" || m.tone === "terra" ? PALETTE.pineDeep : PALETTE.ivory;
      const numText = String(m.id + 1);
      const pr = W < 440 ? 11 : 12;
      ctx.fillStyle = pillBg;
      ctx.beginPath();
      ctx.arc(x, y, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pillFg;
      ctx.font = `600 ${W < 440 ? 11 : 12}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(numText, x, y + 0.5);
    }

    // 越界串区或压死轴心的实时赤红告警框架与标签
    if (m.straddling || m.originClash) {
      ctx.strokeStyle = PALETTE.danger;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(x - rx - 4, y - ry - 4, rx * 2 + 8, ry * 2 + 8);
      ctx.setLineDash([]);

      const warnLbl = m.straddling ? "越界串区 · 拖回象限" : "压住交点 · 往外推开";
      ctx.font = `600 ${W < 440 ? 10 : 11}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(warnLbl).width + 14;
      const tx = clamp(x - tw / 2, frame.x + 4, frame.x + frame.w - tw - 4);
      const ty = Math.max(frame.y + 4, y - ry - 26);
      ctx.fillStyle = PALETTE.danger;
      ctx.fillRect(tx, ty, tw, 20);
      ctx.fillStyle = PALETTE.ivory;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(warnLbl, tx + tw / 2, ty + 10.5);
    } else if (isSel || isHover) {
      ctx.strokeStyle = isSel ? PALETTE.terra : PALETTE.pine;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(x - rx - 4, y - ry - 4, rx * 2 + 8, ry * 2 + 8);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  function drawOpticalCoG(ev) {
    if (!state.showGuides) return;
    const ox = toX(state.ax);
    const oy = toY(state.ay);
    const gx = toX(ev.gx);
    const gy = toY(ev.gy);
    const bad = ev.faults.includes("imbalance");

    ctx.save();
    // 杠杆力臂虚线（从分割轴心到实测视觉重心）
    ctx.strokeStyle = bad ? PALETTE.danger : "rgba(210, 90, 46, 0.78)";
    ctx.lineWidth = bad ? 2 : 1.4;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(gx, gy);
    ctx.stroke();
    ctx.setLineDash([]);

    // 菱形视觉重心标记
    ctx.fillStyle = bad ? PALETTE.danger : PALETTE.terra;
    ctx.strokeStyle = PALETTE.ivory;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(gx, gy - 7);
    ctx.lineTo(gx + 7, gy);
    ctx.lineTo(gx, gy + 7);
    ctx.lineTo(gx - 7, gy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (bad || ev.leanPct >= 5) {
      const txt = `重心${ev.leanDir === "中心" ? "稳" : "偏" + ev.leanDir} ${ev.leanPct}%`;
      ctx.font = `600 ${W < 440 ? 10 : 11}px "JetBrains Mono", "Noto Sans SC", monospace`;
      const tw = ctx.measureText(txt).width + 12;
      const tx = clamp(gx + 10, frame.x + 6, frame.x + frame.w - tw - 6);
      const ty = clamp(gy - 10, frame.y + 22, frame.y + frame.h - 28);
      ctx.fillStyle = bad ? "rgba(184, 50, 39, 0.92)" : "rgba(27, 81, 54, 0.88)";
      ctx.fillRect(tx, ty, tw, 19);
      ctx.fillStyle = PALETTE.ivory;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, tx + 6, ty + 10);
    }
    ctx.restore();
  }

  function drawCruise(ev) {
    if (!cruise.active) return;
    const pts = ev.scanOrder.map((id) => {
      const m = ev.measured.find((x) => x.id === id);
      return { x: toX(m.u), y: toY(m.v), id };
    });
    if (pts.length < 2) return;

    const totalSeg = pts.length - 1;
    const p = clamp(cruise.progress, 0, 1);
    const segFloat = p * totalSeg;
    const segIdx = Math.min(totalSeg - 1, Math.floor(segFloat));
    const localT = segFloat - segIdx;

    ctx.save();
    // 绘制已走过的视线轨迹
    ctx.strokeStyle = PALETTE.terra;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < segIdx; i++) {
      ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
    }
    const curX = pts[segIdx].x + (pts[segIdx + 1].x - pts[segIdx].x) * localT;
    const curY = pts[segIdx].y + (pts[segIdx + 1].y - pts[segIdx].y) * localT;
    ctx.lineTo(curX, curY);
    ctx.stroke();

    // 已经过节点的阅读次序圈 1..4
    for (let i = 0; i <= segIdx + (p > 0.96 ? 1 : 0); i++) {
      if (!pts[i]) continue;
      ctx.fillStyle = PALETTE.terra;
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.ivory;
      ctx.font = `700 12px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), pts[i].x, pts[i].y + 0.5);
    }

    // 移动中的陶土光球
    ctx.fillStyle = "rgba(210, 90, 46, 0.26)";
    ctx.beginPath();
    ctx.arc(curX, curY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.terra;
    ctx.beginPath();
    ctx.arc(curX, curY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function render(t, dt, { still }) {
    if (!layoutReady && !computeLayout()) return;
    if (still) {
      reveal = 1;
      if (cruise.active) cruise.active = false;
    } else {
      if (reveal < 1) {
        reveal = Math.min(1, reveal + (dt || 0.016) * 1.45);
        dirty = true;
      }
      if (cruise.active) {
        cruise.progress += (dt || 0.016) * 0.52;
        dirty = true;
        if (cruise.progress >= 1.18) {
          cruise.active = false;
          cruise.progress = 0;
        }
      }
      // 有动态虚线流向时轻量续画，保持丝滑且极低开销
      if (state.echoMode === "diagonal" || state.echoMode === "cycle") {
        dirty = true;
      }
    }

    if (!dirty && !still) return;
    dirty = false;

    if (evalDirty) {
      latestEval = evaluate(state, frame.aspect);
      evalDirty = false;
    }
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const revVisual = still ? 1 : (0.78 + 0.22 * reveal);
    drawPaperAndGrid(latestEval, revVisual);
    drawEchoLinks(latestEval, still ? 0 : t);
    drawCrossAxis(latestEval, revVisual);
    latestEval.measured.forEach((m, i) => drawModule(m, i, latestEval));
    drawOpticalCoG(latestEval);
    drawCruise(latestEval);

    ctx.restore();
  }

  const ticker = loop(canvas, render);
  const ro = new ResizeObserver(() => {
    computeLayout();
    notify();
    ticker.draw();
  });
  ro.observe(canvas);

  // 初始化立刻算一次并画第一帧
  computeLayout();
  latestEval = evaluate(state, frame.aspect);
  onChange(latestEval);
  ticker.draw();

  return {
    sync() {
      notify();
      ticker.draw();
    },
    triggerCruise,
    getEval: () => latestEval,
  };
}

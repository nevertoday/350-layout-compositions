// 347 活体流程管道沙盘与信号流演播台（2D Canvas 标 data-perf-drag）
// 1:1 承袭 347 原海报深森林绿展板、象牙圆角卡、薄荷绿胶囊与粗推进箭头、左右端锚及底部虚线迭代回环

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE, SCENARIOS, computeLayout, diagnose, getStepLines } from "./model.js";

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

// 简洁、有辨识度的原海报矢量图标（放大镜/饼图/齿轮/勾选文档/对话气泡/信封/星徽）
function drawStepIcon(ctx, type, cx, cy, r, strokeColor, fillBg) {
  ctx.save();
  ctx.fillStyle = fillBg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.lineWidth = Math.max(1.8, r * 0.11);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const s = r * 0.46;
  if (type === "search") {
    ctx.beginPath();
    ctx.arc(cx - s * 0.14, cy - s * 0.14, s * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.30, cy + s * 0.30);
    ctx.lineTo(cx + s * 0.82, cy + s * 0.82);
    ctx.stroke();
  } else if (type === "pie") {
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.82, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = fillBg;
    ctx.lineWidth = Math.max(2, r * 0.12);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - s * 0.86);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + s * 0.84, cy);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + s * 0.56, cy + s * 0.62);
    ctx.stroke();
  } else if (type === "gear") {
    const teeth = 8;
    const outer = s * 0.90;
    const inner = s * 0.66;
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i * Math.PI) / teeth;
      const rad = i % 2 === 0 ? outer : inner;
      const px = cx + Math.cos(a) * rad;
      const py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = fillBg;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.34, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "doc") {
    const rw = s * 1.15;
    const rh = s * 1.45;
    roundRect(ctx, cx - rw * 0.58, cy - rh * 0.52, rw, rh, s * 0.16);
    ctx.fill();
    ctx.strokeStyle = fillBg;
    ctx.lineWidth = Math.max(1.6, r * 0.09);
    ctx.beginPath();
    ctx.moveTo(cx - rw * 0.34, cy - rh * 0.16);
    ctx.lineTo(cx + rw * 0.22, cy - rh * 0.16);
    ctx.moveTo(cx - rw * 0.34, cy + rh * 0.08);
    ctx.lineTo(cx + rw * 0.10, cy + rh * 0.08);
    ctx.stroke();
    // 右下勾选小徽
    ctx.fillStyle = fillBg;
    ctx.beginPath();
    ctx.arc(cx + rw * 0.36, cy + rh * 0.30, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = Math.max(1.8, r * 0.10);
    ctx.beginPath();
    ctx.moveTo(cx + rw * 0.18, cy + rh * 0.30);
    ctx.lineTo(cx + rw * 0.32, cy + rh * 0.44);
    ctx.lineTo(cx + rw * 0.58, cy + rh * 0.16);
    ctx.stroke();
  } else if (type === "chat") {
    roundRect(ctx, cx - s * 0.82, cy - s * 0.62, s * 1.64, s * 1.05, s * 0.28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.25, cy + s * 0.43);
    ctx.lineTo(cx - s * 0.50, cy + s * 0.78);
    ctx.lineTo(cx + s * 0.05, cy + s * 0.43);
    ctx.stroke();
  } else if (type === "mail") {
    roundRect(ctx, cx - s * 0.85, cy - s * 0.56, s * 1.70, s * 1.12, s * 0.14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.80, cy - s * 0.48);
    ctx.lineTo(cx, cy + s * 0.10);
    ctx.lineTo(cx + s * 0.80, cy - s * 0.48);
    ctx.stroke();
  } else {
    // spark 四角星
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const rad = i % 2 === 0 ? s * 0.90 : s * 0.34;
      const px = cx + Math.cos(a) * rad;
      const py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// 绘制原海报同款粗实箭头（支持正向、逆向、双向、断连）
function drawFlowArrow(ctx, x1, y1, x2, y2, type, isHighlight, compact) {
  ctx.save();
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 6) {
    ctx.restore();
    return;
  }
  const ang = Math.atan2(dy, dx);
  ctx.translate(x1, y1);
  ctx.rotate(ang);

  if (type === "none") {
    ctx.strokeStyle = PALETTE.coral;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(dist - 2, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    // 中间红色断口叉
    const mx = dist / 2;
    const cs = compact ? 5 : 7;
    ctx.fillStyle = PALETTE.coralBg;
    ctx.beginPath();
    ctx.arc(mx, 0, cs + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.coral;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx - cs * 0.65, -cs * 0.65);
    ctx.lineTo(mx + cs * 0.65, cs * 0.65);
    ctx.moveTo(mx + cs * 0.65, -cs * 0.65);
    ctx.lineTo(mx - cs * 0.65, cs * 0.65);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const headL = Math.min(dist * 0.42, compact ? 10 : 15);
  const headW = compact ? 9 : 13;
  const stemW = compact ? 4.5 : 6.5;

  const isBad = type === "rev" || type === "bi";
  ctx.fillStyle = type === "rev" ? PALETTE.coral : type === "bi" ? PALETTE.amber : PALETTE.mint;
  if (isHighlight) {
    ctx.strokeStyle = isBad ? "rgba(255,123,102,0.5)" : "rgba(138,221,186,0.5)";
    ctx.lineWidth = 2;
  }

  if (type === "fwd") {
    ctx.beginPath();
    ctx.moveTo(0, -stemW / 2);
    ctx.lineTo(dist - headL, -stemW / 2);
    ctx.lineTo(dist - headL, -headW);
    ctx.lineTo(dist, 0);
    ctx.lineTo(dist - headL, headW);
    ctx.lineTo(dist - headL, stemW / 2);
    ctx.lineTo(0, stemW / 2);
    ctx.closePath();
    ctx.fill();
  } else if (type === "rev") {
    ctx.beginPath();
    ctx.moveTo(dist, -stemW / 2);
    ctx.lineTo(headL, -stemW / 2);
    ctx.lineTo(headL, -headW);
    ctx.lineTo(0, 0);
    ctx.lineTo(headL, headW);
    ctx.lineTo(headL, stemW / 2);
    ctx.lineTo(dist, stemW / 2);
    ctx.closePath();
    ctx.fill();
  } else if (type === "bi") {
    const hL = Math.min(dist * 0.34, compact ? 8 : 12);
    const hW = compact ? 7.5 : 10.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(hL, -hW);
    ctx.lineTo(hL, -stemW * 0.45);
    ctx.lineTo(dist - hL, -stemW * 0.45);
    ctx.lineTo(dist - hL, -hW);
    ctx.lineTo(dist, 0);
    ctx.lineTo(dist - hL, hW);
    ctx.lineTo(dist - hL, stemW * 0.45);
    ctx.lineTo(hL, stemW * 0.45);
    ctx.lineTo(hL, hW);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

const wrapCache = new Map();
function wrapText(ctx, text, maxW, maxLines) {
  const key = `${ctx.font}|${Math.round(maxW)}|${maxLines}|${text}`;
  const hit = wrapCache.get(key);
  if (hit) return hit;
  const lines = [];
  let cur = "";
  for (const ch of text) {
    if (ctx.measureText(cur + ch).width > maxW && cur.length > 0) {
      lines.push(cur);
      cur = ch;
      if (lines.length >= maxLines) break;
    } else {
      cur += ch;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && text.length > lines.join("").length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.slice(0, Math.max(1, last.length - 1)) + "…";
  }
  if (wrapCache.size > 400) wrapCache.clear();
  wrapCache.set(key, lines);
  return lines;
}

export function mountFlowStage(canvas, getState, onMutate) {
  const ctx = canvas.getContext("2d");
  let cssW = 800;
  let cssH = 380;
  let dpr = 1;
  let lastLayout = null;
  let lastDiag = null;

  // 拖动与交互态
  const drag = {
    active: false,
    mode: null, // 'card' | 'breath' | null
    pointerId: null,
    cardIdx: -1,
    startX: 0,
    startY: 0,
    curX: 0,
    curY: 0,
    startBreath: 0.25,
    cardOffsetX: 0,
    moved: false,
    decided: false,
  };

  // 信号核演播态
  const signal = {
    running: false,
    t: 0, // 秒
    duration: 3.8,
    impactFlash: 0,
    loopPhase: 0,
  };

  let hoverZone = null;
  let intro = reducedMotion.matches ? 1 : 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(280, Math.round(rect.width));
    cssH = Math.max(240, Math.round(rect.height));
    dpr = pixelRatio(cssW < 520 ? 1.5 : 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }

  resize();
  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(canvas);

  function triggerSignal() {
    signal.running = true;
    signal.t = 0;
    signal.impactFlash = 0;
    signal.loopPhase = 0;
    ctl.draw();
  }

  function hitTest(x, y, layout) {
    if (!layout) return null;
    // 优先检测冗余卡删除按钮
    for (const c of layout.cards) {
      if (c.delRect && x >= c.delRect.x - 6 && x <= c.delRect.x + c.delRect.w + 6 && y >= c.delRect.y - 6 && y <= c.delRect.y + c.delRect.h + 6) {
        return { kind: "delete-card", idx: c.idx };
      }
    }
    // 箭头点击区
    for (const a of layout.arrowRects) {
      const r = a.hitRect;
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        return { kind: "arrow", idx: a.idx };
      }
    }
    // 左端输入锚点
    const ib = layout.inputBox;
    if (x >= ib.x - 6 && x <= ib.x + ib.w + 8 && y >= ib.y - 10 && y <= ib.y + ib.h + 10) {
      return { kind: "input" };
    }
    // 右端结果锚点
    const ob = layout.outputBox;
    if (x >= ob.x - 8 && x <= ob.x + ob.w + 6 && y >= ob.y - 10 && y <= ob.y + ob.h + 10) {
      return { kind: "output" };
    }
    // 卡片本体（含顶部胶囊）
    for (const c of layout.cards) {
      const topY = c.capRect.h > 0 ? c.capRect.y : c.y;
      if (x >= c.x && x <= c.x + c.w && y >= topY && y <= c.y + c.h) {
        return { kind: "card", idx: c.idx };
      }
    }
    // 底部迭代回环胶囊
    const lp = layout.loopPill;
    if (x >= lp.x - 16 && x <= lp.x + lp.w + 16 && y >= lp.y - 10 && y <= lp.y + lp.h + 10) {
      return { kind: "loop" };
    }
    return { kind: "bg" };
  }

  function getCanvasXY(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function beginDrag(x, y) {
    const state = getState();
    const layout = computeLayout(state, cssW, cssH);
    lastLayout = layout;
    const hit = hitTest(x, y, layout);
    drag.active = true;
    drag.startX = x;
    drag.startY = y;
    drag.curX = x;
    drag.curY = y;
    drag.moved = false;
    drag.decided = false;
    drag.startBreath = state.breath;
    drag.cardOffsetX = 0;

    if (hit && hit.kind === "card") {
      drag.mode = "card";
      drag.cardIdx = hit.idx;
    } else if (hit && hit.kind === "bg") {
      drag.mode = "breath";
      drag.cardIdx = -1;
    } else {
      drag.mode = "click-only";
      drag.cardIdx = -1;
    }
    return hit;
  }

  function moveDrag(x, y) {
    if (!drag.active) return false;
    const dx = x - drag.startX;
    const dy = y - drag.startY;
    drag.curX = x;
    drag.curY = y;

    if (!drag.decided && Math.hypot(dx, dy) > 4) {
      drag.decided = true;
      // 竖向滑动让给页面滚动
      if (Math.abs(dy) > Math.abs(dx) * 1.25) {
        drag.active = false;
        drag.mode = null;
        return false;
      }
    }
    if (Math.abs(dx) > 5) drag.moved = true;

    const state = getState();
    if (drag.mode === "card" && drag.cardIdx >= 0 && drag.cardIdx < state.steps.length) {
      drag.cardOffsetX = dx;
      // 检查是否拖过相邻卡片中线，实时交换顺序
      const layout = computeLayout(state, cssW, cssH);
      const curCard = layout.cards[drag.cardIdx];
      if (curCard) {
        const draggedCX = curCard.cx + drag.cardOffsetX;
        if (drag.cardIdx < layout.cards.length - 1 && draggedCX > layout.cards[drag.cardIdx + 1].cx) {
          const i = drag.cardIdx;
          onMutate((s) => {
            const tmp = s.steps[i];
            s.steps[i] = s.steps[i + 1];
            s.steps[i + 1] = tmp;
          });
          drag.cardIdx = i + 1;
          drag.startX = x;
          drag.cardOffsetX = 0;
        } else if (drag.cardIdx > 0 && draggedCX < layout.cards[drag.cardIdx - 1].cx) {
          const i = drag.cardIdx;
          onMutate((s) => {
            const tmp = s.steps[i];
            s.steps[i] = s.steps[i - 1];
            s.steps[i - 1] = tmp;
          });
          drag.cardIdx = i - 1;
          drag.startX = x;
          drag.cardOffsetX = 0;
        }
      }
      ctl.draw();
      return true;
    }

    if (drag.mode === "breath" || drag.mode === "click-only") {
      // 在任意空白处横拖都平滑推拉呼吸留白（包括 perf.mjs 中心水平触摸拖动！）
      if (drag.moved) {
        drag.mode = "breath";
        const delta = (dx / Math.max(220, cssW * 0.65)) * 0.34;
        const nextBreath = Math.max(0.08, Math.min(0.44, +(drag.startBreath + delta).toFixed(3)));
        onMutate((s) => {
          s.breath = nextBreath;
        });
        ctl.draw();
        return true;
      }
    }
    return false;
  }

  function endDrag(x, y) {
    if (!drag.active) return;
    const wasMoved = drag.moved;
    drag.active = false;
    drag.mode = null;
    drag.cardIdx = -1;
    drag.cardOffsetX = 0;

    if (!wasMoved) {
      const state = getState();
      const layout = computeLayout(state, cssW, cssH);
      const hit = hitTest(x, y, layout);
      if (hit) handleTap(hit);
    }
    ctl.draw();
  }

  function handleTap(hit) {
    if (hit.kind === "delete-card") {
      onMutate((s) => {
        if (s.steps.length > 2) {
          s.steps.splice(hit.idx, 1);
          // 同步裁剪对应箭头
          const removeArrIdx = Math.min(hit.idx, s.arrows.length - 1);
          if (removeArrIdx >= 0) s.arrows.splice(removeArrIdx, 1);
        }
      });
    } else if (hit.kind === "arrow") {
      const order = ["fwd", "rev", "bi", "none"];
      onMutate((s) => {
        const cur = s.arrows[hit.idx] || "fwd";
        // 若当前不是正向，先点一下直接修回正向，减少挫败感；正向时再点则依次试错（逆向→双向→断连→正向）
        if (cur !== "fwd") s.arrows[hit.idx] = "fwd";
        else s.arrows[hit.idx] = order[(order.indexOf(cur) + 1) % order.length];
      });
    } else if (hit.kind === "input") {
      onMutate((s) => {
        s.hasInput = !s.hasInput;
      });
    } else if (hit.kind === "output") {
      onMutate((s) => {
        s.hasOutput = !s.hasOutput;
      });
    } else if (hit.kind === "loop") {
      onMutate((s) => {
        s.loopMode = s.loopMode === "clean" ? "none" : "clean";
      });
    } else if (hit.kind === "card") {
      onMutate((s) => {
        // 如果点击卡片且当前胶囊层级关闭，则就地点亮胶囊层级；否则选中该卡
        if (!s.showCaps) s.showCaps = true;
        s.selectedStepIdx = s.selectedStepIdx === hit.idx ? -1 : hit.idx;
      });
    }
  }

  // 同时支持鼠标 Pointer 与 Touch（确保桌面鼠标与 perf.mjs / 手机触屏均丝滑响应）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // touch 由 touchstart 接管避免双触发
    const pt = getCanvasXY(e.clientX, e.clientY);
    beginDrag(pt.x, pt.y);
    drag.pointerId = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const pt = getCanvasXY(e.clientX, e.clientY);
    if (drag.active && drag.pointerId === e.pointerId) {
      moveDrag(pt.x, pt.y);
    } else {
      const hit = hitTest(pt.x, pt.y, lastLayout);
      hoverZone = hit;
      canvas.style.cursor =
        !hit || hit.kind === "bg"
          ? "ew-resize"
          : hit.kind === "card"
            ? "grab"
            : "pointer";
    }
  });

  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    if (drag.active && drag.pointerId === e.pointerId) {
      const pt = getCanvasXY(e.clientX, e.clientY);
      endDrag(pt.x, pt.y);
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    }
  });

  canvas.addEventListener("pointercancel", () => {
    drag.active = false;
    drag.cardIdx = -1;
    drag.cardOffsetX = 0;
  });

  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const pt = getCanvasXY(e.touches[0].clientX, e.touches[0].clientY);
    beginDrag(pt.x, pt.y);
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!drag.active || e.touches.length !== 1) return;
    const pt = getCanvasXY(e.touches[0].clientX, e.touches[0].clientY);
    const consumed = moveDrag(pt.x, pt.y);
    if (consumed && e.cancelable) e.preventDefault();
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    if (!drag.active) return;
    const t = e.changedTouches[0];
    const pt = t ? getCanvasXY(t.clientX, t.clientY) : { x: drag.curX, y: drag.curY };
    endDrag(pt.x, pt.y);
  });

  // 绘制主循环
  function drawFrame(t, dt, { still }) {
    const state = getState();
    const sc = SCENARIOS[state.scenario] || SCENARIOS.poster;
    const layout = computeLayout(state, cssW, cssH);
    const diag = diagnose(state, layout);
    lastLayout = layout;
    lastDiag = diag;

    if (still) {
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 2.2);
    }

    if (signal.running && !still) {
      signal.t += Math.max(dt, 0.016);
      if (signal.t >= signal.duration) {
        signal.running = false;
        signal.t = 0;
      }
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 深森林墨绿展板底场 + 极淡几何坐标网格（保持干净，不喧宾夺主）
    ctx.fillStyle = PALETTE.forest;
    ctx.fillRect(0, 0, cssW, cssH);

    // 微弱深绿辅助格线
    ctx.strokeStyle = "rgba(138, 221, 186, 0.055)";
    ctx.lineWidth = 1;
    const gridStep = layout.compact ? 28 : 40;
    ctx.beginPath();
    for (let gx = gridStep; gx < cssW; gx += gridStep) {
      ctx.moveTo(gx + 0.5, 0);
      ctx.lineTo(gx + 0.5, cssH);
    }
    for (let gy = gridStep; gy < cssH; gy += gridStep) {
      ctx.moveTo(0, gy + 0.5);
      ctx.lineTo(cssW, gy + 0.5);
    }
    ctx.stroke();

    // 顶部细微留白状态尺
    const topMetaY = layout.compact ? 11 : 14;
    ctx.font = `700 ${layout.compact ? 9.5 : 10.5}px "Space Mono", monospace`;
    ctx.fillStyle = "rgba(159, 234, 204, 0.72)";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(
      `STEPS ${state.steps.length} · BREATH ${layout.whitespacePct}% · ${state.layoutMode === "stepped" ? "STEPPED" : "LINEAR"}`,
      layout.compact ? 10 : 20,
      topMetaY
    );
    ctx.textAlign = "right";
    ctx.fillStyle = diag.score === 4 ? PALETTE.mintBright : PALETTE.coral;
    ctx.fillText(
      diag.score === 4 ? "4/4 FLOW CLEAR" : `${diag.score}/4 ${diag.topIssue ? diag.topIssue.badge : ""}`,
      cssW - (layout.compact ? 10 : 20),
      topMetaY
    );

    const easeOut = 1 - Math.pow(1 - intro, 3);

    // 2. 底部迭代回环（先画，保证不压住卡片文字；但蛛网错态会故意穿过卡片演示反面教材）
    if (state.loopMode === "clean" && layout.cards.length >= 2) {
      const firstC = layout.cards[0];
      const lastC = layout.cards[layout.cards.length - 1];
      const ly = layout.loopY;
      ctx.save();
      ctx.strokeStyle = PALETTE.dashed;
      ctx.lineWidth = layout.compact ? 1.4 : 1.8;
      ctx.setLineDash([6, 5]);
      // 水平虚线主干
      ctx.beginPath();
      ctx.moveTo(firstC.cx, ly);
      ctx.lineTo(lastC.cx, ly);
      ctx.stroke();

      // 每张卡的向上回指虚线与小三角箭头
      for (const c of layout.cards) {
        const targetY = c.y + c.h + 5;
        ctx.beginPath();
        ctx.moveTo(c.cx, ly);
        ctx.lineTo(c.cx, targetY + 6);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = PALETTE.dashed;
        ctx.beginPath();
        ctx.moveTo(c.cx, targetY);
        ctx.lineTo(c.cx - 4.5, targetY + 7);
        ctx.lineTo(c.cx + 4.5, targetY + 7);
        ctx.closePath();
        ctx.fill();
        ctx.setLineDash([6, 5]);
      }
      ctx.setLineDash([]);

      // 居中薄荷绿「迭代优化」胶囊
      const lp = layout.loopPill;
      roundRect(ctx, lp.x, lp.y, lp.w, lp.h, 6);
      ctx.fillStyle = PALETTE.mint;
      ctx.fill();
      ctx.font = `700 ${layout.compact ? 10.5 : 13}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = PALETTE.ivoryInk;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sc.loopLabel, lp.x + lp.w / 2, lp.y + lp.h / 2 + 0.5);
      ctx.restore();
    }

    // 3. 左端「输入」与右端「结果」端锚（桌面左右两侧；窄屏顶沿清晰锚条，绝不和卡片重叠）
    function drawAnchor(box, title, items, isInput) {
      ctx.save();
      const firstOrLast = isInput ? layout.cards[0] : layout.cards[layout.cards.length - 1];
      const py = box.y;
      if (box.inlineBar) {
        if (box.present) {
          roundRect(ctx, box.x, py, box.w, box.h, 6);
          ctx.fillStyle = PALETTE.mint;
          ctx.fill();
          ctx.font = `700 11px "Noto Sans SC", sans-serif`;
          ctx.fillStyle = PALETTE.ivoryInk;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${title}：${items.slice(0, 2).join("·")}`, box.x + box.w / 2, py + box.h / 2 + 0.5);
        } else {
          roundRect(ctx, box.x, py, box.w, box.h, 6);
          ctx.fillStyle = "rgba(75, 27, 23, 0.85)";
          ctx.fill();
          ctx.strokeStyle = PALETTE.coral;
          ctx.lineWidth = 1.4;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
          ctx.fillStyle = PALETTE.coralInk;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`+ 补${title}（${isInput ? "缺起点" : "缺产出"}）`, box.x + box.w / 2, py + box.h / 2 + 0.5);
        }
        ctx.restore();
        return;
      }

      if (box.present) {
        roundRect(ctx, box.x, py, box.w, box.pillH, 6);
        ctx.fillStyle = PALETTE.mint;
        ctx.fill();
        ctx.font = `700 ${layout.compact ? 11 : 14}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = PALETTE.ivoryInk;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(title, box.x + box.w / 2, py + box.pillH / 2 + 0.5);

        // 下挂 4 项清单（1:1 复刻原海报）
        ctx.font = `500 ${layout.compact ? 9.5 : 12}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        const itemStartY = py + box.pillH + (layout.compact ? 12 : 18);
        const itemStep = layout.compact ? 16 : 22;
        items.forEach((txt, idx) => {
          const iy = itemStartY + idx * itemStep;
          ctx.fillStyle = PALETTE.mintSoft;
          ctx.beginPath();
          ctx.arc(box.x + (layout.compact ? 6 : 12), iy, 2.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = PALETTE.mintBright;
          ctx.fillText(txt, box.x + (layout.compact ? 13 : 22), iy + 0.5);
        });

        // 连向首卡 / 末卡的粗箭头
        if (firstOrLast) {
          const ay = py + box.pillH / 2;
          if (isInput) {
            drawFlowArrow(ctx, box.x + box.w + 4, ay, firstOrLast.x - 4, ay, "fwd", false, layout.compact);
          } else {
            drawFlowArrow(ctx, firstOrLast.x + firstOrLast.w + 4, ay, box.x - 4, ay, "fwd", false, layout.compact);
          }
        }
      } else {
        // 缺失端锚的醒目珊瑚红虚线占位（点此补全）
        roundRect(ctx, box.x, py, box.w, box.h * 0.72, 8);
        ctx.fillStyle = "rgba(75, 27, 23, 0.75)";
        ctx.fill();
        ctx.strokeStyle = PALETTE.coral;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = PALETTE.coralInk;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `700 ${layout.compact ? 10 : 12}px "Noto Sans SC", sans-serif`;
        ctx.fillText(`+ 补${title}`, box.x + box.w / 2, py + box.h * 0.28);
        ctx.font = `500 ${layout.compact ? 9 : 10.5}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = PALETTE.coral;
        ctx.fillText(isInput ? "缺起点" : "缺产出", box.x + box.w / 2, py + box.h * 0.50);
      }
      ctx.restore();
    }

    drawAnchor(layout.inputBox, sc.inputTitle, sc.inputItems, true);
    drawAnchor(layout.outputBox, sc.outputTitle, sc.outputItems, false);

    // 4. 卡片间箭头（支持双排折返连接）
    for (const a of layout.arrowRects) {
      const isTarget = diag.topIssue?.target?.kind === "arrow" && diag.topIssue.target.idx === a.idx;
      if (a.crossRow && a.fromPt && a.toPt) {
        ctx.save();
        const isBad = a.type !== "fwd";
        ctx.strokeStyle = a.type === "rev" || a.type === "none" ? PALETTE.coral : a.type === "bi" ? PALETTE.amber : PALETTE.mint;
        ctx.lineWidth = 2.2;
        if (a.type === "none") ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(a.fromPt.x, a.fromPt.y);
        ctx.lineTo(a.fromPt.x, a.midY);
        ctx.lineTo(a.toPt.x, a.midY);
        ctx.lineTo(a.toPt.x, a.toPt.y);
        ctx.stroke();
        ctx.setLineDash([]);
        // 中段方向箭头标
        drawFlowArrow(ctx, a.midX + 12, a.midY, a.midX - 12, a.midY, a.type, isTarget, true);
        ctx.restore();
      } else {
        drawFlowArrow(ctx, a.x1, a.y1, a.x2, a.y2, a.type, isTarget, layout.compact);
      }
    }

    // 5. 绘制每张流程卡片（被拖动的卡片最后画在最上层）
    const drawOrder = layout.cards.map((_, i) => i);
    if (drag.active && drag.mode === "card" && drag.cardIdx >= 0) {
      const idxPos = drawOrder.indexOf(drag.cardIdx);
      if (idxPos >= 0) {
        drawOrder.splice(idxPos, 1);
        drawOrder.push(drag.cardIdx);
      }
    }

    // 判定逻辑倒置卡集合
    const invertedIds = new Set();
    const coreOnly = state.steps.filter((s) => !s.redundant);
    for (let i = 0; i < coreOnly.length - 1; i++) {
      if (coreOnly[i].order > coreOnly[i + 1].order) {
        invertedIds.add(coreOnly[i].id);
        invertedIds.add(coreOnly[i + 1].id);
      }
    }

    for (const idx of drawOrder) {
      const c = layout.cards[idx];
      const isDraggingThis = drag.active && drag.mode === "card" && drag.cardIdx === idx;
      const ox = isDraggingThis ? drag.cardOffsetX : 0;
      const oy = isDraggingThis ? -6 : (1 - easeOut) * (12 + idx * 4);
      const x = c.x + ox;
      const y = c.y + oy;

      ctx.save();
      // 顶部薄荷绿阶段胶囊（带向下小尖角，1:1 复刻原海报）
      if (state.showCaps && c.capRect.h > 0) {
        const cr = c.capRect;
        const cx = cr.x + ox;
        const cy = cr.y + oy;
        roundRect(ctx, cx, cy, cr.w, cr.h, 6);
        ctx.fillStyle = c.step.redundant ? PALETTE.coral : PALETTE.mint;
        ctx.fill();
        // 下方小尖角
        ctx.beginPath();
        ctx.moveTo(cx + cr.w / 2 - 5, cy + cr.h - 0.5);
        ctx.lineTo(cx + cr.w / 2 + 5, cy + cr.h - 0.5);
        ctx.lineTo(cx + cr.w / 2, cy + cr.h + 6);
        ctx.closePath();
        ctx.fill();

        ctx.font = `700 ${layout.compact ? 10.5 : 14}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = PALETTE.ivoryInk;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(c.step.title, cx + cr.w / 2, cy + cr.h / 2 + 0.5);
      }

      // 象牙米白卡片本体（平面微偏实色投影，零 shadowBlur 高斯卷积，软件渲染同样稳 60fps）
      const crRad = layout.compact ? 8 : 12;
      roundRect(ctx, x, y + (isDraggingThis ? 8 : 4), c.w, c.h, crRad);
      ctx.fillStyle = isDraggingThis ? "rgba(0, 12, 8, 0.48)" : "rgba(0, 12, 8, 0.28)";
      ctx.fill();

      roundRect(ctx, x, y, c.w, c.h, crRad);
      ctx.fillStyle = c.step.redundant ? "#FDEEEB" : state.showCaps ? PALETTE.ivory : "#E6EAE4";
      ctx.fill();

      // 病灶高亮边框（冗余卡 / 逻辑倒置卡 / 拖拽态）
      const isInverted = invertedIds.has(c.step.id);
      if (c.step.redundant || isInverted) {
        ctx.strokeStyle = PALETTE.coral;
        ctx.lineWidth = 2;
        ctx.setLineDash(c.step.redundant ? [5, 3] : []);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (isDraggingThis || state.selectedStepIdx === idx) {
        ctx.strokeStyle = PALETTE.mintBright;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }

      // 序号微角标（左上角，帮助一眼判断顺序是否倒置）
      const badgeTxt = c.step.redundant ? "冗" : `0${c.step.order}`;
      ctx.font = `700 ${layout.compact ? 8.5 : 10}px "Space Mono", monospace`;
      ctx.fillStyle = c.step.redundant || isInverted ? "#B62A1C" : "rgba(14, 96, 66, 0.65)";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(badgeTxt, x + (layout.compact ? 6 : 10), y + (layout.compact ? 6 : 9));

      // 冗余卡右上角「× 剔除」按钮
      if (c.delRect) {
        const dr = c.delRect;
        roundRect(ctx, dr.x + ox, dr.y + oy, dr.w, dr.h, 5);
        ctx.fillStyle = "#C93424";
        ctx.fill();
        ctx.font = `700 ${layout.compact ? 11 : 13}px "Space Mono", monospace`;
        ctx.fillStyle = "#FFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("×", dr.x + ox + dr.w / 2, dr.y + oy + dr.h / 2 + 0.5);
      }

      // 卡内圆图标（关闭胶囊层级时退化成灰淡小方块，直观展现主次塌平）
      const ic = c.iconCenter;
      if (state.showCaps) {
        drawStepIcon(
          ctx,
          c.step.icon,
          ic.x + ox,
          ic.y + oy,
          ic.r,
          PALETTE.ivoryBright,
          c.step.redundant ? "#B62A1C" : PALETTE.emerald
        );
      } else {
        // 层级塌平态：弱灰线框
        roundRect(ctx, ic.x + ox - ic.r * 0.55, ic.y + oy - ic.r * 0.45, ic.r * 1.1, ic.r * 0.9, 4);
        ctx.strokeStyle = "rgba(0, 28, 15, 0.22)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // 阶段大标题（严格防超宽裁切）
      const titleY = ic.y + oy + ic.r + (layout.twoRow ? 10 : layout.compact ? 13 : 20);
      const rawTitleSz = layout.twoRow ? 11.5 : layout.compact ? (c.w < 74 ? 11 : 13) : (state.showCaps ? 19 : 14);
      const titleSz = c.step.title.length >= 4 && c.w < 96 ? Math.min(rawTitleSz, 10.5) : rawTitleSz;
      ctx.font = `${state.showCaps ? 900 : 500} ${titleSz}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = c.step.redundant ? "#8E1E14" : PALETTE.ivoryInk;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(c.step.title, x + c.w / 2, titleY, c.w - 10);

      // 卡片细则条目（根据密度与卡片高宽自适应渲染）
      const lines = getStepLines(c.step, state.density);
      const padInner = layout.compact ? 6 : 12;
      const textMaxW = Math.max(24, c.w - padInner * 2 - (layout.compact ? 6 : 8));
      const fontSize = layout.twoRow
        ? 8.5
        : layout.compact
          ? (state.density === "dense" ? 8.4 : 9.6)
          : (state.density === "dense" ? 10 : c.w < 130 ? 11 : 12.2);
      const lineH = fontSize * (state.density === "dense" ? 1.32 : 1.46);
      ctx.font = `500 ${fontSize}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = state.density === "dense" ? "#3B4A41" : PALETTE.ivorySub;
      ctx.textAlign = state.density === "empty" ? "center" : "left";
      ctx.textBaseline = "top";

      let curY = titleY + (layout.twoRow ? 9 : layout.compact ? 11 : 18);
      const reserveBottom = isInverted && !c.step.redundant ? (layout.compact ? 20 : 26) : (layout.compact ? 6 : 12);
      const bottomLimit = y + c.h - reserveBottom;

      if (state.density === "empty") {
        ctx.fillStyle = "rgba(0,28,15,0.42)";
        ctx.fillText("（无说明）", x + c.w / 2, curY + 4, c.w - 8);
      } else {
        for (const bullet of lines) {
          if (curY + lineH > bottomLimit + 1) break;
          const wrapped = wrapText(ctx, bullet, textMaxW, layout.twoRow ? 2 : state.density === "dense" ? 3 : 2);
          wrapped.forEach((wLine, wi) => {
            if (curY + lineH > bottomLimit + 2) return;
            if (wi === 0) {
              ctx.fillStyle = c.step.redundant ? "#B62A1C" : PALETTE.emerald;
              ctx.beginPath();
              ctx.arc(x + padInner + 2.5, curY + fontSize * 0.56, 1.7, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = state.density === "dense" ? "#3A4B42" : PALETTE.ivorySub;
            ctx.fillText(wLine, x + padInner + 8, curY);
            curY += lineH;
          });
          curY += layout.twoRow ? 1 : state.density === "dense" ? 2 : 4;
        }
      }

      // 逻辑倒置徽条提醒（严格嵌在卡片内部，绝不溢出）
      if (isInverted && !c.step.redundant) {
        const tagW = Math.min(c.w - 10, layout.compact ? 60 : 82);
        const tagH = layout.compact ? 15 : 18;
        roundRect(ctx, x + (c.w - tagW) / 2, y + c.h - tagH - 4, tagW, tagH, 4);
        ctx.fillStyle = "#C93424";
        ctx.fill();
        ctx.font = `700 ${layout.compact ? 8.5 : 10}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = "#FFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("序倒·横拖", x + c.w / 2, y + c.h - tagH / 2 - 3.5, tagW - 6);
      }

      ctx.restore();
    }

    // 5.5 顶层绘制异常箭头小胶囊标（置于卡片之后；双排时落在箭头正下方远离卡片顶角 × / 序号，绝不碰边）
    for (const a of layout.arrowRects) {
      if (a.type === "rev" || a.type === "none" || a.type === "bi") {
        ctx.save();
        const isWarn = a.type === "bi";
        const lbl = a.type === "rev" ? "逆流·点扳正" : a.type === "none" ? "断链·点接通" : "双向·改单向";
        const shortLbl = a.type === "rev" ? "点扳正" : a.type === "none" ? "点接通" : "改单向";
        const text = layout.compact ? shortLbl : lbl;
        ctx.font = `700 ${layout.compact ? 9 : 10.5}px "Noto Sans SC", sans-serif`;
        const tw = ctx.measureText(text).width + 12;
        const th = layout.compact ? 17 : 20;
        const bx = Math.max(6, Math.min(cssW - tw - 6, a.midX - tw / 2));
        const by = a.crossRow
          ? a.midY - th / 2
          : layout.twoRow
            ? a.midY + 15
            : Math.max(24, a.midY - 36);
        roundRect(ctx, bx, by, tw, th, 5);
        ctx.fillStyle = isWarn ? "#44320C" : "#5D150F";
        ctx.fill();
        ctx.strokeStyle = isWarn ? PALETTE.amber : PALETTE.coral;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = isWarn ? "#FFE29A" : "#FFD6CF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, bx + tw / 2, by + th / 2 + 0.5);
        ctx.restore();
      }
    }

    // 6. 蛛网交叉回环错态（故意横穿卡片正文，直观展示为何不能乱拉回环）
    if (state.loopMode === "spaghetti" && layout.cards.length >= 2) {
      ctx.save();
      ctx.strokeStyle = PALETTE.coral;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      for (let i = layout.cards.length - 1; i >= 1; i--) {
        for (let j = 0; j < i; j++) {
          const from = layout.cards[i];
          const to = layout.cards[j];
          ctx.beginPath();
          ctx.moveTo(from.cx, from.cy + (i - j) * 12 - 20);
          ctx.bezierCurveTo(
            (from.cx + to.cx) / 2,
            from.y + from.h * ((i + j) % 2 === 0 ? 0.12 : 0.88),
            (from.cx + to.cx) / 2,
            to.y + to.h * 0.55,
            to.cx,
            to.cy
          );
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 7. 活体转换信号核演播（按 Space 或点「注入信号实测」触发，或平时有微弱环境脉冲暗示流向）
    if (signal.running) {
      drawSignalPacket(ctx, state, layout, diag.trace, signal.t / signal.duration);
    } else if (!still && diag.trace.ok) {
      // 合法通路下的轻柔微光脉冲，沿着单向箭头缓缓流动（不抢戏）
      const ambientP = (t * 0.22) % 1;
      drawAmbientPulse(ctx, layout, ambientP);
    }

    ctx.restore();
  }

  function drawAmbientPulse(ctx, layout, p) {
    if (layout.cards.length < 2) return;
    const pts = [
      { x: layout.inputBox.x + layout.inputBox.w, y: layout.inputBox.y + layout.inputBox.pillH / 2 },
      ...layout.cards.map((c) => ({ x: c.cx, y: c.y + c.h * 0.30 })),
      { x: layout.outputBox.x, y: layout.outputBox.y + layout.outputBox.pillH / 2 },
    ];
    const segs = pts.length - 1;
    const scaled = p * segs;
    const i = Math.min(segs - 1, Math.floor(scaled));
    const local = scaled - i;
    const px = pts[i].x + (pts[i + 1].x - pts[i].x) * local;
    const py = pts[i].y + (pts[i + 1].y - pts[i].y) * local;

    ctx.save();
    ctx.fillStyle = "rgba(159, 234, 204, 0.52)";
    ctx.beginPath();
    ctx.arc(px, py, layout.compact ? 3.5 : 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSignalPacket(ctx, state, layout, trace, progress) {
    const pts = [];
    const ib = layout.inputBox;
    const ob = layout.outputBox;
    pts.push({ x: ib.x + ib.w / 2, y: ib.y + ib.pillH / 2, stage: 0 });
    for (let i = 0; i < layout.cards.length; i++) {
      const c = layout.cards[i];
      pts.push({ x: c.cx, y: c.y + c.h * 0.30, stage: i + 1 });
    }
    pts.push({ x: ob.x + ob.w / 2, y: ob.y + ob.pillH / 2, stage: layout.cards.length + 1 });

    // 如果缺输入，信号核在最左端原地红闪弹回
    if (trace.blockedType === "missing-input") {
      const shake = Math.sin(progress * Math.PI * 10) * 6;
      drawOrb(ctx, ib.x + ib.w / 2 + shake, ib.y + ib.pillH / 2, 11, PALETTE.coral, "无起点!", layout.compact);
      return;
    }

    // 计算信号核最多能走到的路径索引
    let maxSeg = pts.length - 1;
    if (!trace.ok) {
      if (trace.blockedType === "reverse-arrow" || trace.blockedType === "broken-arrow") {
        maxSeg = trace.blockedArrowIdx + 1.5; // 撞在卡片间箭头处
      } else if (trace.blockedType === "bi-loop") {
        maxSeg = 2.0;
      } else if (trace.blockedType === "missing-output") {
        maxSeg = pts.length - 1.3;
      }
    }

    const forwardPhase = state.loopMode === "clean" && trace.ok ? 0.72 : 1.0;
    if (progress <= forwardPhase) {
      const f = progress / forwardPhase;
      let segPos = f * maxSeg;
      let isBlockedHit = false;
      if (!trace.ok && f > 0.65) {
        isBlockedHit = true;
        // 撞墙弹回震荡
        const bounce = Math.sin((f - 0.65) * Math.PI * 8) * 0.12;
        segPos = Math.max(0.5, maxSeg - 0.08 + bounce);
      } else if (trace.blockedType === "bi-loop") {
        // 双向死循环震荡
        segPos = 1.5 + Math.sin(f * Math.PI * 6) * 0.55;
        isBlockedHit = true;
      }

      const idx = Math.min(pts.length - 2, Math.floor(segPos));
      const frac = segPos - idx;
      const px = pts[idx].x + (pts[idx + 1].x - pts[idx].x) * frac;
      const py = pts[idx].y + (pts[idx + 1].y - pts[idx].y) * frac;

      // 绘制已走过的荧光尾迹
      ctx.save();
      ctx.strokeStyle = isBlockedHit ? PALETTE.coral : PALETTE.mintBright;
      ctx.lineWidth = layout.compact ? 3 : 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k <= idx; k++) ctx.lineTo(pts[k].x, pts[k].y);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.restore();

      const stageNames = ["输入", ...state.steps.map((s) => `${s.title}中`), "已转化为结果"];
      const curLabel = isBlockedHit
        ? (trace.blockedType === "reverse-arrow" ? "撞逆流!" : trace.blockedType === "broken-arrow" ? "断链!" : trace.blockedType === "bi-loop" ? "死循环!" : "无终点!")
        : stageNames[Math.min(stageNames.length - 1, Math.round(segPos))];

      drawOrb(ctx, px, py, layout.compact ? 9 : 12, isBlockedHit ? PALETTE.coral : PALETTE.mintBright, curLabel, layout.compact, Math.floor(segPos));
    } else if (state.loopMode === "clean" && trace.ok) {
      // 底部迭代回环温柔回送光点
      const lf = (progress - forwardPhase) / (1 - forwardPhase);
      const firstC = layout.cards[0];
      const lastC = layout.cards[layout.cards.length - 1];
      const px = lastC.cx + (firstC.cx - lastC.cx) * lf;
      const py = layout.loopY;
      drawOrb(ctx, px, py, layout.compact ? 7 : 9, PALETTE.mintBright, "迭代反馈", layout.compact, 4);
    }
  }

  function drawOrb(ctx, x, y, r, color, label, compact, morphStage = 0) {
    ctx.save();
    // 轻盈外晕环替代 shadowBlur，保持高帧率
    ctx.fillStyle = color === PALETTE.coral ? "rgba(255,123,102,0.26)" : "rgba(159,234,204,0.28)";
    ctx.beginPath();
    ctx.arc(x, y, r * 1.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;

    // 随着经过不同阶段，信号核的几何形状真的发生转化（点 → 菱形 → 方块 → 六边形 → 成品星环）
    ctx.beginPath();
    if (morphStage <= 0) {
      ctx.arc(x, y, r, 0, Math.PI * 2);
    } else if (morphStage === 1) {
      ctx.moveTo(x, y - r * 1.15);
      ctx.lineTo(x + r * 1.15, y);
      ctx.lineTo(x, y + r * 1.15);
      ctx.lineTo(x - r * 1.15, y);
      ctx.closePath();
    } else if (morphStage === 2) {
      roundRect(ctx, x - r, y - r, r * 2, r * 2, 4);
    } else {
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 6;
        const px = x + Math.cos(a) * r * 1.12;
        const py = y + Math.sin(a) * r * 1.12;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }
    ctx.fill();

    // 清晰的高对比标签小胶囊
    ctx.font = `700 ${compact ? 10 : 11.5}px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(label).width + 14;
    const th = compact ? 20 : 22;
    const lx = Math.max(6, Math.min(cssW - tw - 6, x - tw / 2));
    const ly = Math.max(22, y - r - th - 6);
    roundRect(ctx, lx, ly, tw, th, 5);
    ctx.fillStyle = color === PALETTE.coral ? "#5B130D" : "#001A11";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = color === PALETTE.coral ? "#FFD6CF" : PALETTE.mintBright;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, lx + tw / 2, ly + th / 2 + 0.5);
    ctx.restore();
  }

  const ctl = loop(canvas, drawFrame);
  return {
    draw: () => ctl.draw(),
    triggerSignal,
    getLastMetrics: () => ({ layout: lastLayout, diag: lastDiag }),
  };
}

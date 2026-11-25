// 开场主角玩具：「活体多栏报样排版桌」
// 真实原生 CSS Multi-column DOM + 2D Canvas 视线流/标尺层 + 可拖拽朱红纸幅拉柄（data-perf-drag）

import { loop, pixelRatio } from "../../lib/stage.js";
import { INITIAL_DESK_STATE, evaluateDesk, SHEET_LINE_HEIGHT } from "./model.js";

export function initDesk() {
  const bench = document.getElementById("desk-bench");
  const sheet = document.getElementById("broadsheet");
  const flow = document.getElementById("sheet-flow");
  const headlineEl = document.getElementById("sheet-headline");
  const calloutEl = document.getElementById("sheet-callout");
  const handle = document.getElementById("sheet-handle");
  const canvas = document.getElementById("desk-canvas");
  if (!bench || !sheet || !flow || !handle || !canvas) return;

  const ctx = canvas.getContext("2d");

  // UI refs
  const scoreEl = document.getElementById("hero-score");
  const badgeEls = {
    col: document.getElementById("badge-col"),
    gutter: document.getElementById("badge-gutter"),
    span: document.getElementById("badge-span"),
    break: document.getElementById("badge-break"),
  };
  const diagBadge = document.getElementById("diag-badge");
  const diagTitle = document.getElementById("diag-title");
  const diagReason = document.getElementById("diag-reason");
  const diagAction = document.getElementById("diag-action");
  const diagCss = document.getElementById("diag-css");
  const mCols = document.getElementById("m-cols");
  const mChars = document.getElementById("m-chars");
  const mRatio = document.getElementById("m-ratio");
  const mWidth = document.getElementById("m-width");
  const handleReadout = document.getElementById("handle-px");

  // Controls
  const modeBtns = [...document.querySelectorAll("[data-desk-col]")];
  const gapRange = document.getElementById("desk-gap");
  const gapVal = document.getElementById("desk-gap-val");
  const btnRule = document.getElementById("desk-rule");
  const btnSpan = document.getElementById("desk-span");
  const btnBreak = document.getElementById("desk-break");
  const btnFlow = document.getElementById("desk-flow");
  const btnReset = document.getElementById("desk-reset");

  const state = { ...INITIAL_DESK_STATE };

  // 根据视口微调初始比例：确保任何尺寸（含 2560 宽屏与 390 手机）开场均为 0/4 碎栏错态，且拉柄左右拖幅充裕
  function defaultFrac() {
    const w = bench.clientWidth || 720;
    if (w < 460) return 0.72;
    if (w > 1350) return Math.min(0.51, 840 / w);
    return Math.min(0.62, 740 / w);
  }
  state.sheetFrac = defaultFrac();

  let lastEval = null;
  let lastDomSplit = false;
  let lastBenchW = 0;
  let lastBenchH = 0;
  let lastSheetRect = { left: 0, top: 0, width: 300, height: 300 };
  let lastFlowRect = { left: 16, top: 16, width: 260, height: 240 };
  let lastHeadlineH = 36;
  let lastCalloutRects = [];
  let dirtyLayout = true;
  let animPhase = 0;

  // 把当前状态写到原生 CSS Multi-column 容器，并一次性批量读取实测几何（零读写交替抖动）
  function syncDomAndMeasure() {
    const bw = Math.max(260, bench.clientWidth);
    const minFrac = Math.min(0.62, Math.max(0.36, 210 / bw));
    state.sheetFrac = Math.min(0.985, Math.max(minFrac, state.sheetFrac));
    const sheetPx = Math.round(bw * state.sheetFrac);

    sheet.style.width = `${sheetPx}px`;

    if (state.mode === "count") {
      flow.style.columnCount = String(state.count);
      flow.style.columnWidth = "auto";
    } else if (state.mode === "width") {
      flow.style.columnCount = "auto";
      flow.style.columnWidth = `${state.colWidth}px`;
    } else {
      flow.style.columnCount = String(state.count);
      flow.style.columnWidth = `${state.colWidth}px`;
    }
    flow.style.columnGap = `${state.gapPx}px`;
    flow.style.columnRule = state.rule ? "1px solid #bfb8a8" : "none";
    headlineEl.style.columnSpan = state.spanAll ? "all" : "none";
    calloutEl.style.breakInside = state.breakAvoid ? "avoid" : "auto";
    calloutEl.dataset.protected = state.breakAvoid ? "1" : "0";
    headlineEl.dataset.spanning = state.spanAll ? "1" : "0";

    // 单次统一读取 DOM 实测坐标
    const br = bench.getBoundingClientRect();
    const sr = sheet.getBoundingClientRect();
    const fr = flow.getBoundingClientRect();
    const hr = headlineEl.getBoundingClientRect();
    const cRects = [...calloutEl.getClientRects()].filter((r) => r.width > 4 && r.height > 4);
    const fs = parseFloat(getComputedStyle(flow).fontSize) || 15;

    lastBenchW = br.width;
    lastBenchH = br.height;
    lastSheetRect = { left: sr.left - br.left, top: sr.top - br.top, width: sr.width, height: sr.height };
    lastFlowRect = { left: fr.left - br.left, top: fr.top - br.top, width: fr.width, height: fr.height };
    lastHeadlineH = hr.height;
    lastCalloutRects = cRects.map((r) => ({
      left: r.left - br.left,
      top: r.top - br.top,
      width: r.width,
      height: r.height,
    }));

    // 若浏览器把 callout 拆入左右不同 X 位置的两个片段，则真实发生了跨栏拦腰截断
    let splitDetected = false;
    if (cRects.length > 1) {
      const xs = cRects.map((r) => Math.round(r.left));
      if (Math.max(...xs) - Math.min(...xs) > 16) splitDetected = true;
    }
    lastDomSplit = splitDetected;
    calloutEl.classList.toggle("is-split", splitDetected);

    // 把 handle 紧贴报样右侧边缘
    handle.style.left = `${Math.round(lastSheetRect.left + lastSheetRect.width - 2)}px`;
    handle.setAttribute("aria-valuenow", String(Math.round(sr.width)));
    handle.setAttribute("aria-valuemin", String(Math.round(bw * minFrac)));
    handle.setAttribute("aria-valuemax", String(Math.round(bw)));
    if (handleReadout) handleReadout.textContent = `${Math.round(sr.width)}px`;

    // 单真源评估
    lastEval = evaluateDesk(state, {
      innerWidthPx: fr.width,
      fontSizePx: fs,
      domSplit: splitDetected,
    });

    // 更新控件与读数
    updateReadouts(lastEval, sr.width);
    dirtyLayout = false;
  }

  function updateReadouts(ev, sheetWidth) {
    if (scoreEl) {
      scoreEl.textContent = `${ev.passed} / 4`;
      scoreEl.dataset.ok = ev.passed === 4 ? "1" : "0";
    }
    for (const c of ev.checks) {
      const el = badgeEls[c.key];
      if (!el) continue;
      el.dataset.ok = c.ok ? "1" : "0";
      const st = el.querySelector(".hb-status");
      if (st) st.textContent = c.status;
    }

    if (diagBadge) {
      diagBadge.textContent = ev.badge;
      diagBadge.dataset.ok = ev.passed === 4 ? "1" : "0";
    }
    if (diagTitle) diagTitle.textContent = ev.headline;
    if (diagReason) diagReason.textContent = ev.reason;
    if (diagAction) diagAction.textContent = ev.action;
    if (diagCss) diagCss.textContent = ev.css;

    if (mCols) mCols.textContent = `${ev.N} 栏`;
    if (mChars) mChars.textContent = `约 ${ev.charsPerLine.toFixed(1)} 字/行`;
    if (mRatio) mRatio.textContent = ev.N === 1 ? "单栏无缝" : `${ev.gapToLeading.toFixed(1)}× 行空`;
    if (mWidth) mWidth.textContent = `${Math.round(sheetWidth)}px`;

    // 同步按钮激活态
    modeBtns.forEach((b) => {
      const m = b.dataset.deskMode;
      const c = Number(b.dataset.deskCol || 0);
      const active =
        (m === "width" && state.mode === "width") ||
        (m === "count" && state.mode === "count" && state.count === c);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (gapRange) gapRange.value = String(state.gapPx);
    if (gapVal) gapVal.textContent = `${state.gapPx}px`;
    if (btnRule) {
      btnRule.setAttribute("aria-pressed", state.rule ? "true" : "false");
      btnRule.textContent = state.rule ? "竖线：开" : "竖线：关";
    }
    if (btnSpan) {
      btnSpan.setAttribute("aria-pressed", state.spanAll ? "true" : "false");
      btnSpan.textContent = state.spanAll ? "标题：跨栏 all" : "标题：困首栏 none";
    }
    if (btnBreak) {
      btnBreak.setAttribute("aria-pressed", state.breakAvoid ? "true" : "false");
      btnBreak.textContent = state.breakAvoid ? "插块：防截断" : "插块：任截断";
    }
    if (btnFlow) {
      btnFlow.setAttribute("aria-pressed", state.showFlow ? "true" : "false");
    }
  }

  // 2D Canvas 覆盖层：绘制切割垫标尺、栏距警示/呼吸刻度、原海报朱红蛇形视线流、截断剪刀线
  function drawOverlay(t, dt, { still }) {
    if (dirtyLayout) syncDomAndMeasure();
    if (!lastEval) return;

    const dpr = pixelRatio(2);
    const w = Math.max(1, Math.round(lastBenchW));
    const h = Math.max(1, Math.round(lastBenchH));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (!still) animPhase += dt * 0.42;
    const phase = still ? 1 : animPhase % 1;

    const ev = lastEval;
    const sr = lastSheetRect;
    const fr = lastFlowRect;

    // 1. 切割垫顶部宽度标尺（0px → benchW）
    ctx.save();
    ctx.strokeStyle = "rgba(22, 56, 40, 0.24)";
    ctx.fillStyle = "rgba(22, 56, 40, 0.62)";
    ctx.font = '500 10px "Space Mono", monospace';
    ctx.textBaseline = "top";
    const step = w > 720 ? 100 : 60;
    for (let x = 0; x <= w - 12; x += step) {
      const major = x % (step * 2) === 0;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, major ? 10 : 6);
      ctx.stroke();
      if (x > 0 && x < w - 42) {
        ctx.fillText(`${x}`, x + 3, 2);
      }
    }
    // 纸幅右侧虚线延长标尺（在空白工作台区域展示可拖空间）
    const edgeX = sr.left + sr.width;
    if (w - edgeX > 28) {
      ctx.strokeStyle = "rgba(22, 56, 40, 0.14)";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(edgeX + 12, sr.top + sr.height / 2);
      ctx.lineTo(w - 14, sr.top + sr.height / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (w - edgeX > 118) {
        ctx.fillStyle = "rgba(22, 56, 40, 0.56)";
        ctx.font = '500 11px "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("向右拉宽纸幅 →", edgeX + (w - edgeX) / 2, sr.top + sr.height / 2 - 6);
        ctx.textAlign = "left";
      }
    }
    ctx.restore();

    // 2. 栏缝高亮带与栏距双箭头标尺（直接对应 W3C 算法算出的列边界）
    const colTop = state.spanAll ? fr.top + lastHeadlineH + 10 : fr.top + 2;
    const colBottom = fr.top + fr.height - 4;
    const colH = Math.max(40, colBottom - colTop);

    if (ev.N > 1) {
      for (let i = 0; i < ev.N - 1; i++) {
        const gx = fr.left + (i + 1) * ev.W + i * ev.gapPx;
        const gw = ev.gapPx;
        // 栏距警示底带
        if (ev.gutterTooTight) {
          ctx.fillStyle = "rgba(232, 93, 65, 0.22)";
          ctx.fillRect(gx, colTop, Math.max(4, gw), colH);
          // 绘制横向串行警示小横箭（眼睛跨栏错读）
          if (i === 0) {
            ctx.save();
            ctx.strokeStyle = "#C93B1E";
            ctx.lineWidth = 1.6;
            const cy = colTop + colH * 0.38;
            ctx.beginPath();
            ctx.moveTo(gx - 14, cy);
            ctx.lineTo(gx + gw + 14, cy);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(gx + gw + 9, cy - 4);
            ctx.lineTo(gx + gw + 15, cy);
            ctx.lineTo(gx + gw + 9, cy + 4);
            ctx.stroke();
            ctx.restore();
          }
        } else if (ev.gutterTooWide) {
          ctx.fillStyle = "rgba(232, 93, 65, 0.12)";
          ctx.fillRect(gx, colTop, gw, colH);
        } else {
          ctx.fillStyle = "rgba(22, 56, 40, 0.055)";
          ctx.fillRect(gx, colTop, gw, colH);
        }

        // 在第一条栏缝顶部画原海报同款 |↔| 栏距刻度（配底牌避开顶部标尺数字）
        if (i === 0) {
          const yTick = sr.top - 9;
          const label = `gap ${ev.gapPx}px`;
          ctx.save();
          ctx.font = '700 10px "Space Mono", monospace';
          const tw = ctx.measureText(label).width + 10;
          const cx = Math.max(tw / 2 + 6, gx + gw / 2);
          ctx.fillStyle = "#E9DEC9";
          ctx.fillRect(cx - tw / 2, yTick - 15, tw, 13);
          ctx.strokeStyle = ev.gutterOk ? "#163828" : "#C93B1E";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(gx, yTick - 3);
          ctx.lineTo(gx, yTick + 3);
          ctx.moveTo(gx + gw, yTick - 3);
          ctx.lineTo(gx + gw, yTick + 3);
          ctx.moveTo(gx, yTick);
          ctx.lineTo(gx + gw, yTick);
          ctx.stroke();
          ctx.fillStyle = ev.gutterOk ? "#163828" : "#B9381E";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(label, cx, yTick - 3);
          ctx.restore();
        }
      }
    }

    // 3. 原海报第 2 栏同款：朱红虚线「流式阅读」蛇形路径
    if (state.showFlow && ev.N >= 1) {
      ctx.save();
      const pts = [];
      for (let c = 0; c < ev.N; c++) {
        const cx = fr.left + c * (ev.W + ev.gapPx) + ev.W * 0.5;
        const y0 = colTop + 14;
        const y1 = colBottom - 12;
        pts.push({ x: cx, y: y0, type: "start", col: c });
        pts.push({ x: cx, y: y1, type: "end", col: c });
      }

      // 构建蛇形路径（下到底再平滑折入下一栏顶）
      ctx.strokeStyle = ev.gutterTooTight ? "rgba(201, 59, 30, 0.52)" : "rgba(232, 93, 65, 0.65)";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.lineDashOffset = still ? 0 : -phase * 36;
      ctx.beginPath();
      for (let c = 0; c < ev.N; c++) {
        const p0 = pts[c * 2];
        const p1 = pts[c * 2 + 1];
        if (c === 0) ctx.moveTo(p0.x, p0.y);
        else {
          const prev = pts[c * 2 - 1];
          const midX = (prev.x + p0.x) / 2;
          ctx.bezierCurveTo(midX, prev.y + 8, midX, p0.y - 8, p0.x, p0.y);
        }
        ctx.lineTo(p1.x, p1.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 起点朱红圆点 + 终点箭头
      const first = pts[0];
      const last = pts[pts.length - 1];
      ctx.fillStyle = "#E85D41";
      ctx.beginPath();
      ctx.arc(first.x, first.y, 4.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#E85D41";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(last.x - 4.5, last.y - 6);
      ctx.lineTo(last.x, last.y + 1);
      ctx.lineTo(last.x + 4.5, last.y - 6);
      ctx.stroke();

      // 流动光点（沿第一栏→末栏缓步示意阅读流，reducedMotion 下停在首栏中段）
      const segCount = Math.max(1, ev.N);
      const prog = still ? 0.35 : (t * 0.24) % 1;
      const colIdx = Math.min(segCount - 1, Math.floor(prog * segCount));
      const localT = prog * segCount - colIdx;
      const cur0 = pts[colIdx * 2];
      const cur1 = pts[colIdx * 2 + 1];
      const dotX = cur0.x;
      const dotY = cur0.y + (cur1.y - cur0.y) * localT;
      ctx.fillStyle = "#163828";
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#F9F4EC";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }

    // 4. 若插块被真实劈成两截，在断口处标出朱红锯齿断线
    if (lastDomSplit && lastCalloutRects.length >= 2) {
      ctx.save();
      ctx.strokeStyle = "#C93B1E";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      for (const r of lastCalloutRects) {
        ctx.strokeRect(r.left - 1, r.top - 1, r.width + 2, r.height + 2);
      }
      ctx.setLineDash([]);
      const r0 = lastCalloutRects[0];
      const tagW = Math.min(Math.max(r0.width, 54), 60);
      const tagY = Math.min(h - 16, r0.top + r0.height + 2);
      ctx.fillStyle = "#C93B1E";
      ctx.fillRect(r0.left, tagY, tagW, 14);
      ctx.fillStyle = "#FFF8F2";
      ctx.font = '700 10px "Noto Sans SC", sans-serif';
      ctx.textBaseline = "middle";
      ctx.fillText("拦腰截断", r0.left + 6, tagY + 7);
      ctx.restore();
    }
  }

  const runner = loop(bench, drawOverlay);

  function scheduleUpdate() {
    dirtyLayout = true;
    runner.draw();
  }

  // ---------- 交互 1：拖动朱红纸幅拉柄（支持鼠标、触屏 TouchEvents 与键盘方向键） ----------
  let dragging = false;
  let dragStartX = 0;
  let dragStartFrac = state.sheetFrac;
  let rafDragId = 0;
  let pendingClientX = null;

  function applyDragX(clientX) {
    const bw = Math.max(260, bench.clientWidth);
    const dx = clientX - dragStartX;
    state.sheetFrac = dragStartFrac + dx / bw;
    syncDomAndMeasure();
    runner.draw();
  }

  function queueDrag(clientX) {
    pendingClientX = clientX;
    if (!rafDragId) {
      rafDragId = requestAnimationFrame(() => {
        rafDragId = 0;
        if (pendingClientX != null) {
          applyDragX(pendingClientX);
          pendingClientX = null;
        }
      });
    }
  }

  // Pointer events（桌面鼠标 + 触控笔，move/up 绑在 window 上防止快速拖出 26px 拉柄断连）
  handle.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏统一走下方 touch 监听，避免与 perf.mjs 双触发
    dragging = true;
    dragStartX = e.clientX;
    dragStartFrac = state.sheetFrac;
    handle.classList.add("is-dragging");
    try {
      handle.setPointerCapture(e.pointerId);
    } catch {}
    e.preventDefault();
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerType === "touch") return;
    queueDrag(e.clientX);
  });
  const endPointer = () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove("is-dragging");
  };
  window.addEventListener("pointerup", endPointer);
  window.addEventListener("pointercancel", endPointer);

  // Touch events（直接对接手机触控与 tools/perf.mjs 的 Input.dispatchTouchEvent）
  let touchDragging = false;
  handle.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      touchDragging = true;
      dragStartX = e.touches[0].clientX;
      dragStartFrac = state.sheetFrac;
      handle.classList.add("is-dragging");
      e.preventDefault();
    },
    { passive: false }
  );
  window.addEventListener(
    "touchmove",
    (e) => {
      if (!touchDragging || !e.touches.length) return;
      e.preventDefault();
      queueDrag(e.touches[0].clientX);
    },
    { passive: false }
  );
  const endTouch = () => {
    touchDragging = false;
    handle.classList.remove("is-dragging");
  };
  window.addEventListener("touchend", endTouch);
  window.addEventListener("touchcancel", endTouch);

  // 键盘操作纸幅拉柄
  handle.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.08 : 0.03;
    if (e.key === "ArrowRight") {
      state.sheetFrac += step;
      e.preventDefault();
      scheduleUpdate();
    } else if (e.key === "ArrowLeft") {
      state.sheetFrac -= step;
      e.preventDefault();
      scheduleUpdate();
    }
  });

  // ---------- 交互 2：工具带按钮与滑块 ----------
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const m = btn.dataset.deskMode;
      if (m === "width") {
        state.mode = "width";
        state.colWidth = Number(btn.dataset.deskWidth || 210);
      } else {
        state.mode = "count";
        state.count = Number(btn.dataset.deskCol || 3);
      }
      scheduleUpdate();
    });
  });

  gapRange?.addEventListener("input", () => {
    state.gapPx = Number(gapRange.value);
    scheduleUpdate();
  });

  btnRule?.addEventListener("click", () => {
    state.rule = !state.rule;
    scheduleUpdate();
  });

  btnSpan?.addEventListener("click", () => {
    state.spanAll = !state.spanAll;
    scheduleUpdate();
  });

  btnBreak?.addEventListener("click", () => {
    state.breakAvoid = !state.breakAvoid;
    scheduleUpdate();
  });

  btnFlow?.addEventListener("click", () => {
    state.showFlow = !state.showFlow;
    scheduleUpdate();
  });

  btnReset?.addEventListener("click", () => {
    Object.assign(state, INITIAL_DESK_STATE, { sheetFrac: defaultFrac() });
    scheduleUpdate();
  });

  // 视口尺寸变化时重新测量
  const ro = new ResizeObserver(() => {
    scheduleUpdate();
  });
  ro.observe(bench);

  // 首帧立即可见、准确
  syncDomAndMeasure();
  runner.draw();
}

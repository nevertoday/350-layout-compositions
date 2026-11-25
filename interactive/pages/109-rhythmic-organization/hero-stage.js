// 开场主角玩具：全幅 16 拍斜轴活体视觉乐谱 + 底沿全宽钴蓝间隔调速轨 (data-perf-drag)
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { BEAT_COUNT, LEVEL_META, clamp, evaluateRhythm } from "./model.js";

const COLOR = {
  bg: "#010206",
  grid: "rgba(72, 102, 215, 0.14)",
  baseline: "rgba(72, 102, 215, 0.44)",
  weak: "#233B94",
  mid: "#2450EC",
  accentBlue: "#1E55FB",
  accentCyan: "#6DE1FE",
  dotWeak: "#2B52FB",
  dotCyan: "#6EDAFE",
  coral: "#FF6B5B",
  coralSoft: "rgba(255, 107, 91, 0.22)",
  ivory: "#F7F2E8",
  muted: "#95A4C8",
};

export function createHeroStage({ canvas, railEl, thumbEl, railFillEl, railReadoutEl, state, onChange }) {
  const ctx = canvas.getContext("2d");

  // 动画平滑态：柱高、斜轴位置均做轻量插值；still=true（减少动态效果）一步到位
  const animPos = new Float32Array(BEAT_COUNT);
  const animH = new Float32Array(BEAT_COUNT);
  let initDone = false;
  let intro = 0; // 0..1 开场逐拍升起进度（0.62s 落入 0/4 等距错态）

  // 光学扫拍光标状态
  let scanIdx = 0;
  let scanPhase = 0;
  let hoverIdx = -1;

  // 缓存画布几何与每个拍位的命中区（CSS 像素）
  const geom = {
    w: 960,
    h: 340,
    x0: 44,
    y0: 288,
    x1: 916,
    y1: 146,
    maxBarH: 118,
    barW: 18,
    dotDrop: 24,
    hits: [],
  };

  let evaluation = evaluateRhythm(state);

  function syncEval() {
    evaluation = evaluateRhythm(state);
    if (!initDone) {
      for (let i = 0; i < BEAT_COUNT; i++) {
        animPos[i] = evaluation.positions[i];
        animH[i] = evaluation.heights[i];
      }
      initDone = true;
    }
    updateRailUI();
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(176, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    geom.w = w;
    geom.h = h;
    return { w, h, dpr };
  }

  function computeGeom(w, h) {
    const compact = w < 520;
    const ultraWide = w >= 1200;
    const padL = compact ? 18 : ultraWide ? 44 : Math.max(28, Math.round(w * 0.04));
    const padR = compact ? 18 : ultraWide ? 44 : Math.max(28, Math.round(w * 0.04));
    const topClear = compact ? 26 : 34;
    const dotDrop = compact ? 19 : h < 210 ? 17 : 26;
    const botClear = dotDrop + (compact ? 18 : 22);
    const maxBarH = clamp(Math.round(h * (compact ? 0.34 : 0.38)), compact ? 64 : 80, 210);

    geom.x0 = padL;
    geom.x1 = w - padR;
    geom.y0 = h - botClear;
    geom.y1 = topClear + maxBarH;
    geom.maxBarH = maxBarH;
    geom.barW = clamp(Math.round(((geom.x1 - geom.x0) / BEAT_COUNT) * 0.34), 7, 24);
    geom.dotDrop = dotDrop;
  }

  function drawFrame(t, dt, { still }) {
    const { w, h, dpr } = resizeCanvas();
    computeGeom(w, h);

    const ev = evaluation;
    if (still) {
      intro = 1;
      for (let i = 0; i < BEAT_COUNT; i++) {
        animPos[i] = ev.positions[i];
        animH[i] = ev.heights[i];
      }
    } else {
      if (intro < 1) intro = Math.min(1, intro + Math.max(dt, 0.016) / 0.62);
      const ease = dt > 0 ? 1 - Math.exp(-dt * 15) : 1;
      for (let i = 0; i < BEAT_COUNT; i++) {
        animPos[i] += (ev.positions[i] - animPos[i]) * ease;
        animH[i] += (ev.heights[i] - animH[i]) * ease;
      }
      if (state.playing) {
        const dur = ev.beatDurations[scanIdx] || 0.24;
        scanPhase += dt / Math.max(0.08, dur);
        while (scanPhase >= 1) {
          scanPhase -= 1;
          scanIdx = (scanIdx + 1) % BEAT_COUNT;
        }
      }
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 曜黑底色（与页面无框无缝衔接）
    ctx.fillStyle = COLOR.bg;
    ctx.fillRect(0, 0, w, h);

    const { x0, y0, x1, y1, maxBarH, barW, dotDrop } = geom;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const slope = dy / Math.max(1, dx);
    const compact = w < 520;

    // 2. 极克制四小节纵分细线与小节号
    ctx.strokeStyle = COLOR.grid;
    ctx.lineWidth = 1;
    for (let s = 0; s <= 4; s++) {
      const gx = Math.round(x0 + (dx * s) / 4) + 0.5;
      ctx.beginPath();
      ctx.moveTo(gx, 10);
      ctx.lineTo(gx, h - 10);
      ctx.stroke();
    }

    ctx.font = `500 ${compact ? 9 : 10}px "Unbounded", "Archivo", sans-serif`;
    ctx.fillStyle = "rgba(149, 164, 200, 0.58)";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const roman = ["BAR I", "BAR II", "BAR III", "BAR IV"];
    for (let b = 0; b < 4; b++) {
      const bx = x0 + (dx * b) / 4 + 6;
      ctx.fillText(roman[b], bx, 10);
    }

    // 左上空白斜角提示语（宽屏时自然落在低柱上方的开放黑空中，绝不遮挡柱体）
    if (!compact && h >= 220) {
      ctx.font = `500 11px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "rgba(195, 206, 230, 0.72)";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("点击蓝柱切强弱 · 鼠标上下拖动直雕柱高 · 方向键微调", x0 + 6, 30);
    }

    // 3. 30° 斜轴基准线
    ctx.strokeStyle = COLOR.baseline;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0 - 10, y0 - 10 * slope);
    ctx.lineTo(x1 + 10, y1 + 10 * slope);
    ctx.stroke();

    // 4. 错态结构标注：断层裂口括号 / 平拍等高参考虚线
    if (ev.flags.isFractured && !ev.flags.isEmpty) {
      const [ia, ib] = ev.maxVisualGapSpan;
      const xa = x0 + animPos[ia] * dx;
      const xb = x0 + animPos[ib] * dx;
      const ya = y0 + animPos[ia] * dy;
      const yb = y0 + animPos[ib] * dy;
      const midX = (xa + xb) * 0.5;
      const midY = (ya + yb) * 0.5 + dotDrop + 14;

      ctx.save();
      ctx.fillStyle = COLOR.coralSoft;
      ctx.beginPath();
      ctx.moveTo(xa + barW * 0.5, ya - maxBarH * 0.72);
      ctx.lineTo(xb - barW * 0.5, yb - maxBarH * 0.72);
      ctx.lineTo(xb - barW * 0.5, yb + dotDrop);
      ctx.lineTo(xa + barW * 0.5, ya + dotDrop);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = COLOR.coral;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(xa + 4, ya + dotDrop + 7);
      ctx.lineTo(xb - 4, yb + dotDrop + 7);
      ctx.stroke();
      ctx.setLineDash([]);

      const label = `断层 ${Math.max(ev.breakRatio, ev.visualBreakRatio).toFixed(1)}×`;
      ctx.font = `600 11px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(label).width + 12;
      const lx = clamp(midX, tw * 0.5 + 8, w - tw * 0.5 - 8);
      const ly = clamp(midY + 4, 28, h - 16);
      ctx.fillStyle = "#190709";
      ctx.fillRect(lx - tw * 0.5, ly - 10, tw, 18);
      ctx.strokeStyle = COLOR.coral;
      ctx.lineWidth = 1;
      ctx.strokeRect(lx - tw * 0.5, ly - 10, tw, 18);
      ctx.fillStyle = COLOR.coral;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, lx, ly - 1);
      ctx.restore();
    }

    if (ev.flags.isFlatInterval && ev.flags.isTooFewAccents && !ev.flags.isEmpty) {
      const topOff = LEVEL_META[2].heightRatio * maxBarH;
      ctx.save();
      ctx.strokeStyle = "rgba(255, 107, 91, 0.58)";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(x0 - 8, y0 - topOff - 8 * slope);
      ctx.lineTo(x1 + 8, y1 - topOff + 8 * slope);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 5. 绘制 16 根斜脚竖柱与 16 枚等比脉冲圆点
    geom.hits = [];
    let accentOrder = 0;

    for (let i = 0; i < BEAT_COUNT; i++) {
      const u = animPos[i];
      const cx = x0 + u * dx;
      const cy = y0 + u * dy;
      const lv = state.beats[i];

      const delay = (i / BEAT_COUNT) * 0.44;
      const localIntro = still ? 1 : clamp((intro - delay) / 0.56, 0, 1);
      const introEase = 1 - Math.pow(1 - localIntro, 3);

      const barH = animH[i] * maxBarH * introEase;
      const isAccent = lv === 3;
      const isCyanAccent = isAccent && accentOrder % 2 === 1;
      if (isAccent) accentOrder++;

      const isActiveScan = !still && state.playing && i === scanIdx;
      const isSelected = i === state.selected;
      const isHovered = i === hoverIdx;

      const hitW = Math.max(barW + 12, (dx / BEAT_COUNT) * 0.76);
      geom.hits.push({
        index: i,
        cx,
        cy,
        xMin: cx - hitW * 0.5,
        xMax: cx + hitW * 0.5,
        yMin: cy - maxBarH - 14,
        yMax: cy + dotDrop + 18,
      });

      const halfW = (isAccent ? barW * 1.16 : lv === 1 ? barW * 0.84 : barW) * 0.5;
      if (lv === 0) {
        ctx.save();
        ctx.strokeStyle = isSelected || isHovered ? COLOR.accentCyan : "rgba(72, 102, 215, 0.4)";
        ctx.lineWidth = isHovered ? 1.5 : 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(cx - halfW, cy - 22, halfW * 2, 18);
        ctx.restore();
      } else {
        let fill = lv === 1 ? COLOR.weak : COLOR.mid;
        if (isAccent) fill = isCyanAccent ? COLOR.accentCyan : COLOR.accentBlue;

        const yLeft = cy - halfW * slope;
        const yRight = cy + halfW * slope;
        const yTop = cy - barH;

        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(cx - halfW, yTop);
        ctx.lineTo(cx + halfW, yTop);
        ctx.lineTo(cx + halfW, yRight - 2);
        ctx.lineTo(cx - halfW, yLeft - 2);
        ctx.closePath();
        ctx.fill();

        if (isHovered && !isSelected) {
          ctx.strokeStyle = "rgba(153, 254, 255, 0.85)";
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }

        if (isAccent && ev.flags.isAccentOverload) {
          ctx.fillStyle = COLOR.coral;
          ctx.fillRect(cx - halfW, yTop, halfW * 2, 3.5);
        } else if (isActiveScan) {
          ctx.fillStyle = COLOR.ivory;
          ctx.fillRect(cx - halfW, yTop - 3, halfW * 2, 2.5);
        }
      }

      // 底部严格等比正圆脉冲点
      const scaleDot = compact ? 0.76 : h < 210 ? 0.74 : 1.0;
      const dotY = cy + dotDrop;
      const meta = LEVEL_META[lv] || LEVEL_META[1];
      const dotR = meta.dotRadius * scaleDot * (0.4 + 0.6 * introEase);

      ctx.beginPath();
      ctx.arc(cx, dotY, dotR, 0, Math.PI * 2);
      if (lv === 0) {
        ctx.strokeStyle = "rgba(109, 225, 254, 0.36)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else {
        const dotColor = isAccent
          ? isCyanAccent
            ? COLOR.dotCyan
            : COLOR.dotWeak
          : i % 8 >= 4
            ? COLOR.dotCyan
            : COLOR.dotWeak;
        ctx.fillStyle = dotColor;
        ctx.fill();
        if (isActiveScan) {
          ctx.strokeStyle = COLOR.ivory;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(cx, dotY, dotR + 4.2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 当前选中拍位的顶部方括弧标注
      if (isSelected) {
        const topMark = Math.max(18, Math.min(cy - barH - 8, cy - 28));
        ctx.save();
        ctx.strokeStyle = COLOR.ivory;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(cx - halfW - 3, topMark + 5);
        ctx.lineTo(cx - halfW - 3, topMark);
        ctx.lineTo(cx + halfW + 3, topMark);
        ctx.lineTo(cx + halfW + 3, topMark + 5);
        ctx.stroke();

        ctx.font = `600 10px "IBM Plex Mono", monospace`;
        ctx.fillStyle = COLOR.ivory;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(`#${String(i + 1).padStart(2, "0")}`, cx, topMark - 3);
        ctx.restore();
      }
    }

    // 6. 光学视线扫拍光标（真实按间距疏密与重音停顿调速）
    if (!still && state.playing && intro >= 0.98) {
      const nextIdx = (scanIdx + 1) % BEAT_COUNT;
      const curU = animPos[scanIdx];
      const nextU = nextIdx === 0 ? curU : animPos[nextIdx];
      const interpU = nextIdx === 0 ? curU : curU + (nextU - curU) * scanPhase;
      const sx = x0 + interpU * dx;
      const sy = y0 + interpU * dy;

      ctx.save();
      ctx.strokeStyle = "rgba(153, 254, 255, 0.32)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, Math.max(20, sy - maxBarH - 12));
      ctx.lineTo(sx, Math.min(h - 8, sy + dotDrop + 14));
      ctx.stroke();

      ctx.fillStyle = COLOR.accentCyan;
      ctx.beginPath();
      ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. 嵌于右下开放曜黑三角区的原海报同款动态谱句「疏 → 密 → 疏 → 强」
    drawCadenceCorner(ctx, w, h, ev, compact);

    ctx.restore();
  }

  function drawCadenceCorner(ctx, w, h, ev, compact) {
    const tokens = ev.cadenceTokens;
    const text = tokens.join(" → ");
    const rightX = w - (compact ? 14 : 26);
    const baseY = h - (compact ? 12 : 18);
    const ok = ev.passedCount === 4;

    ctx.save();
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.font = `700 ${compact ? 13 : 17}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = ok ? "#99FEFF" : ev.diagnosis.tone === "error" ? COLOR.coral : "#A5F0FB";
    ctx.fillText(text, rightX, baseY - 14);

    // 微缩节拍珠链（呼应原海报底角示意）
    const totalW = compact ? 112 : 170;
    const startX = rightX - totalW;
    const dotY = baseY - 4;
    for (let i = 0; i < BEAT_COUNT; i++) {
      const px = startX + ev.positions[i] * totalW;
      const lv = state.beats[i];
      const r = lv === 3 ? (compact ? 3.5 : 4.4) : lv === 0 ? 1.1 : compact ? 1.5 : 2.0;
      ctx.beginPath();
      ctx.arc(px, dotY, r, 0, Math.PI * 2);
      ctx.fillStyle =
        lv === 3
          ? ok
            ? "#6DE1FE"
            : ev.flags.isAccentOverload
              ? COLOR.coral
              : "#2B52FB"
          : lv === 0
            ? "rgba(149,164,200,0.28)"
            : "#3B62E6";
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------- 交互：画布悬停 / 点击循环 / 鼠标上下拖雕柱高 / 键盘 ----------
  function findBeatAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best = -1;
    let bestD = Infinity;
    for (const h of geom.hits) {
      if (y < h.yMin - 12 || y > h.yMax + 12) continue;
      const d = Math.abs(x - h.cx);
      if (d < Math.max(18, (h.xMax - h.xMin) * 0.68) && d < bestD) {
        bestD = d;
        best = h.index;
      }
    }
    return best;
  }

  function levelFromClientY(hitIdx, clientY) {
    const rect = canvas.getBoundingClientRect();
    const localY = clientY - rect.top;
    const hObj = geom.hits[hitIdx];
    if (!hObj) return state.beats[hitIdx];
    const ratio = (hObj.cy - localY) / Math.max(1, geom.maxBarH);
    if (ratio < 0.14) return 0;
    if (ratio < 0.42) return 1;
    if (ratio < 0.74) return 2;
    return 3;
  }

  function cycleBeat(index) {
    // 顺序：中(2) → 重音(3) → 弱(1) → 休止(0) → 中(2)
    const order = [2, 3, 1, 0];
    const cur = state.beats[index];
    const next = order[(order.indexOf(cur) + 1) % order.length];
    state.beats[index] = next;
    state.selected = index;
    commit();
  }

  let canvasDown = null;
  canvas.addEventListener("pointerdown", (e) => {
    const hit = findBeatAt(e.clientX, e.clientY);
    if (hit < 0) return;
    canvasDown = {
      x: e.clientX,
      y: e.clientY,
      hit,
      isMouse: e.pointerType === "mouse",
      dragged: false,
    };
    if (canvasDown.isMouse) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (canvasDown && canvasDown.isMouse) {
      if (Math.abs(e.clientY - canvasDown.y) > 10) {
        canvasDown.dragged = true;
        const lv = levelFromClientY(canvasDown.hit, e.clientY);
        if (state.beats[canvasDown.hit] !== lv || state.selected !== canvasDown.hit) {
          state.beats[canvasDown.hit] = lv;
          state.selected = canvasDown.hit;
          commit();
        }
      }
      return;
    }
    if (e.pointerType === "mouse") {
      const nextHover = findBeatAt(e.clientX, e.clientY);
      if (nextHover !== hoverIdx) {
        hoverIdx = nextHover;
        canvas.style.cursor = hoverIdx >= 0 ? "ns-resize" : "default";
        handle.draw();
      }
    }
  });

  canvas.addEventListener("pointerleave", () => {
    if (hoverIdx !== -1) {
      hoverIdx = -1;
      canvas.style.cursor = "default";
      handle.draw();
    }
  });

  canvas.addEventListener("pointerup", (e) => {
    if (!canvasDown) return;
    const moved = Math.hypot(e.clientX - canvasDown.x, e.clientY - canvasDown.y);
    const { hit, dragged } = canvasDown;
    canvasDown = null;
    if (!dragged && moved < 12) {
      cycleBeat(hit);
    }
  });

  canvas.addEventListener("pointercancel", () => {
    canvasDown = null;
  });

  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      state.selected = (state.selected + 1) % BEAT_COUNT;
      commit();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      state.selected = (state.selected - 1 + BEAT_COUNT) % BEAT_COUNT;
      commit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      state.beats[state.selected] = clamp(state.beats[state.selected] + 1, 0, 3);
      commit();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      state.beats[state.selected] = clamp(state.beats[state.selected] - 1, 0, 3);
      commit();
    } else if (e.key === "Enter") {
      e.preventDefault();
      cycleBeat(state.selected);
    } else if (e.key === " ") {
      e.preventDefault();
      state.playing = !state.playing;
      commit();
    }
  });

  // ---------- 交互：底沿全宽间隔张力调速轨 (data-perf-drag) ----------
  function updateRailUI() {
    const frac = clamp(state.tension, 0, 1);
    const pct = frac * 100;
    thumbEl.style.setProperty("--p", frac.toFixed(4));
    railFillEl.style.width = `${pct.toFixed(2)}%`;
    railEl.setAttribute("aria-valuenow", String(Math.round(pct)));
    railEl.setAttribute(
      "aria-valuetext",
      `间隔跨比 ${evaluation.intervalRatio.toFixed(2)} 倍，${evaluation.pillars.interval.status}`
    );
    const warn = !evaluation.pillars.interval.ok;
    railEl.dataset.state = warn ? "warn" : "ok";
    if (railReadoutEl) {
      railReadoutEl.textContent = `跨比 ${evaluation.intervalRatio.toFixed(2)}× · ${evaluation.pillars.interval.status}`;
      railReadoutEl.dataset.state = warn ? "warn" : "ok";
    }
  }

  function setTensionFromClientX(clientX) {
    const rect = railEl.getBoundingClientRect();
    const raw = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    let snapped = raw;
    if (Math.abs(raw - 0.56) < 0.015) snapped = 0.56;
    if (Math.abs(snapped - state.tension) < 0.0005 && state.curve !== "flat") return;
    state.tension = snapped;
    commit();
  }

  let railDragging = false;
  railEl.addEventListener("pointerdown", (e) => {
    railDragging = true;
    try {
      railEl.setPointerCapture(e.pointerId);
    } catch {}
    setTensionFromClientX(e.clientX);
  });

  railEl.addEventListener("pointermove", (e) => {
    if (!railDragging) return;
    setTensionFromClientX(e.clientX);
  });

  const endRailDrag = () => {
    railDragging = false;
  };
  railEl.addEventListener("pointerup", endRailDrag);
  railEl.addEventListener("pointercancel", endRailDrag);

  railEl.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      railDragging = true;
      setTensionFromClientX(e.touches[0].clientX);
    },
    { passive: true }
  );
  railEl.addEventListener(
    "touchmove",
    (e) => {
      if (!railDragging || !e.touches.length) return;
      setTensionFromClientX(e.touches[0].clientX);
    },
    { passive: true }
  );
  railEl.addEventListener("touchend", endRailDrag, { passive: true });

  railEl.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.1 : 0.04;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      state.tension = clamp(state.tension + step, 0, 1);
      commit();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      state.tension = clamp(state.tension - step, 0, 1);
      commit();
    }
  });

  syncEval();
  const handle = loop(canvas, drawFrame);

  function commit() {
    syncEval();
    handle.draw();
    if (onChange) onChange(evaluation);
  }

  if (reducedMotion.matches) handle.draw();
  window.addEventListener("resize", () => handle.draw());

  return {
    refresh() {
      syncEval();
      handle.draw();
    },
    getEvaluation() {
      return evaluation;
    },
  };
}

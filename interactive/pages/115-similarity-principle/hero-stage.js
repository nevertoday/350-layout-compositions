// 115 · 相似性原则 开场 2D Canvas 跨位编码分拣盘
// 1:1 化用原海报暖米标本板、绿圆/黑方/沙三角与底部四组彩色虚线大括号；
// 支持画布横拖跨位混排 (data-perf-drag) + 直点画布修复/制造叛徒标本 + 键盘操作。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE, COLOR_HEX, COLOR_GRAY, SIZE_SCALE, evaluate, expectedGroupSig } from "./model.js";

function drawTokenShape(ctx, shape, cx, cy, r) {
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (shape === "square") {
    const s = r * 1.78;
    ctx.rect(cx - s / 2, cy - s / 2, s, s);
  } else {
    const h = r * 1.92;
    const w = r * 2.04;
    ctx.moveTo(cx, cy - h * 0.56);
    ctx.lineTo(cx + w * 0.5, cy + h * 0.44);
    ctx.lineTo(cx - w * 0.5, cy + h * 0.44);
    ctx.closePath();
  }
}

// 绘制原海报招牌的「彩色虚线圆角大括号 + 底部实心终端圆点」
function drawDashedBracket(ctx, x1, x2, yTop, yMid, yDot, color, ok) {
  const xm = (x1 + x2) / 2;
  const r = Math.min(9, (x2 - x1) * 0.14);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = ok ? 2.1 : 1.8;
  ctx.setLineDash([5, 4]);
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(x1, yTop);
  ctx.lineTo(x1, yMid - r);
  ctx.quadraticCurveTo(x1, yMid, x1 + r, yMid);
  ctx.lineTo(x2 - r, yMid);
  ctx.quadraticCurveTo(x2, yMid, x2, yMid - r);
  ctx.lineTo(x2, yTop);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xm, yMid);
  ctx.lineTo(xm, yDot - 5);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(xm, yDot, 3.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function mountHeroStage(canvas, getState, onStateChange, onEvalRender) {
  const ctx = canvas.getContext("2d");
  let cssW = 0;
  let cssH = 0;
  let dpr = 1;

  // 平滑视觉插值（让开场动效每帧清晰好看，拖动时由 rAF 节拍统一合批绘制）
  let intro = 0;
  let dirty = true;
  let pendingSync = false;
  let hoverIdx = -1;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartMix = 0;
  let moved = false;
  let touchLockedAxis = null; // "x" | "y" | null，保证手机竖滑滚页不被拦截
  let lastClickFlash = { idx: -1, age: 1 };

  // 记录上一次绘制的每个标本屏幕坐标，供点击命中与键盘聚焦共用
  let hitTargets = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(220, Math.round(rect.height));
    // 手机上像素比最多 1.5（软件渲染与慢手机流畅顺滑），桌面最高 2
    const nextDpr = w < 520 ? pixelRatio(1.5) : pixelRatio(2);
    if (w !== cssW || h !== cssH || nextDpr !== dpr) {
      cssW = w;
      cssH = h;
      dpr = nextDpr;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      dirty = true;
    }
  }

  function render(t, dt, { still }) {
    resize();
    const state = getState();

    // 开场 0.85s 柔和落位（t=0.9s 截图时已清晰呈现完整 0/4 失群盘面）
    if (still) {
      intro = 1;
      lastClickFlash.age = 1;
    } else {
      if (intro < 1) {
        intro = Math.min(1, intro + (dt > 0 ? dt / 0.85 : 0.03));
        dirty = true;
      }
      if (lastClickFlash.age < 1) {
        lastClickFlash.age = Math.min(1, lastClickFlash.age + (dt > 0 ? dt / 0.45 : 0.05));
        dirty = true;
      }
    }

    if (!dirty) return;
    dirty = false;

    const ev = evaluate(state);
    if (pendingSync) {
      pendingSync = false;
      if (onEvalRender) onEvalRender(ev);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 暖米白标本板背景（与外框融合）
    ctx.fillStyle = PALETTE.cream;
    ctx.fillRect(0, 0, cssW, cssH);

    const compact = cssW < 520;
    const padX = compact ? 14 : Math.max(24, cssW * 0.032);
    const topBarH = compact ? 28 : 32;
    const bracketAreaH = compact ? 72 : 82;
    const matrixTop = topBarH + (compact ? 6 : 8);
    const matrixH = Math.max(115, cssH - matrixTop - bracketAreaH);
    const matrixW = cssW - padX * 2;

    // 2. 顶部轻薄跨位混排刻度尺（与画布横拖严格联动）
    const mixPct = ev.metrics.mixPct;
    const railY = topBarH * 0.56;
    const railX1 = padX;
    const railX2 = cssW - padX;
    const railW = railX2 - railX1;

    ctx.lineCap = "round";
    ctx.strokeStyle = "#DED1B6";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(railX1, railY);
    ctx.lineTo(railX2, railY);
    ctx.stroke();

    const validX1 = railX1 + railW * 0.35;
    ctx.strokeStyle = ev.checks.crossOk ? "rgba(27,138,89,0.42)" : "rgba(27,138,89,0.22)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(validX1, railY);
    ctx.lineTo(railX2, railY);
    ctx.stroke();

    const knobX = railX1 + railW * state.mix;
    ctx.strokeStyle = state.mix < 0.35 ? PALETTE.coral : PALETTE.ink;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(railX1, railY);
    ctx.lineTo(knobX, railY);
    ctx.stroke();

    ctx.fillStyle = PALETTE.greenText;
    ctx.fillRect(validX1 - 1, railY - 6, 2, 12);

    const pillText = compact ? `混排 ${mixPct}%` : `↔ 跨位混排 ${mixPct}%`;
    ctx.font = `600 ${compact ? 11 : 12}px "DM Mono", "Noto Sans SC", monospace`;
    const pillW = compact ? 74 : 114;
    const pillH = 22;
    const pillX = Math.max(railX1, Math.min(railX2 - pillW, knobX - pillW / 2));
    const pillY = railY - pillH / 2;

    ctx.fillStyle = state.mix < 0.35 ? PALETTE.coralText : PALETTE.ink;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 11);
    ctx.fill();

    ctx.fillStyle = PALETTE.cream;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pillText, pillX + pillW / 2, railY + 0.5);

    if (!compact) {
      ctx.font = `500 11px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "#5B5140";
      ctx.textAlign = "left";
      if (pillX > railX1 + 88) ctx.fillText("0% 分列聚拢", railX1, railY - 12);
      ctx.textAlign = "right";
      if (pillX + pillW < railX2 - 92) ctx.fillText("100% 跨位穿插", railX2, railY - 12);
    }

    // 3. 当 mix 接近 0% 时，绘制三组之间的轻隔线以呼应原海报分列
    if (state.mix < 0.32) {
      const alpha = (1 - state.mix / 0.32) * 0.25;
      ctx.strokeStyle = `rgba(17,17,17,${alpha.toFixed(3)})`;
      ctx.setLineDash([4, 5]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const fx of [0.335, 0.655]) {
        const lx = padX + matrixW * fx;
        ctx.moveTo(lx, matrixTop + 6);
        ctx.lineTo(lx, matrixTop + matrixH - 8);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 计算 27 枚标本的实际屏幕坐标（保持 1:1 绝对等比，永不压扁成椭圆）
    const cellW = matrixW / 9;
    const cellH = matrixH / 3;
    const baseR = Math.min(cellW * 0.34, cellH * 0.34, compact ? 14.5 : 22);

    const screenTokens = ev.tokens.map((tk) => {
      const enterDelay = tk.group * 0.1 + (tk.localIdx % 3) * 0.04;
      const localIntro = still ? 1 : Math.max(0, Math.min(1, (intro - enterDelay) / 0.55));
      const easeIntro = 1 - Math.pow(1 - localIntro, 3);
      const sx = padX + tk.x * matrixW;
      const sy = matrixTop + tk.y * matrixH + (1 - easeIntro) * 10;
      const r = baseR * SIZE_SCALE[tk.size] * (0.78 + 0.22 * easeIntro);
      return { ...tk, sx, sy, r, alpha: easeIntro };
    });

    hitTargets = screenTokens;

    // 4. 绘制跨位视知觉归类弧线
    if (state.showLinks) {
      const linkAlphaBase = 0.22 + 0.24 * state.mix;
      ctx.lineWidth = compact ? 1.3 : 1.7;
      ctx.setLineDash(state.mix > 0.25 ? [5, 5] : [3, 4]);
      for (let g = 0; g < 3; g++) {
        const members = screenTokens.filter((tk) => tk.group === g && tk.isGrouped);
        if (members.length < 2) continue;
        members.sort((a, b) => a.sx - b.sx || a.sy - b.sy);
        const col = state.grayscale
          ? COLOR_GRAY[members[0].color]
          : COLOR_HEX[members[0].color];
        ctx.strokeStyle = col;
        ctx.globalAlpha = members[0].color === "sand" && !state.grayscale ? linkAlphaBase * 1.4 : linkAlphaBase;
        ctx.beginPath();
        for (let i = 0; i < members.length - 1; i++) {
          const a = members[i];
          const b = members[i + 1];
          const mx = (a.sx + b.sx) / 2;
          const my = (a.sy + b.sy) / 2 - (g === 0 ? 10 : g === 2 ? -10 : 0) * state.mix;
          ctx.moveTo(a.sx, a.sy);
          ctx.quadraticCurveTo(mx, my, b.sx, b.sy);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }

    // 5A. 合批绘制所有叛徒朱红虚线提示环（1 次 stroke 取代 27 次）
    const ringPad = compact ? 4 : 5.5;
    ctx.strokeStyle = state.grayscale ? "#444444" : PALETTE.coral;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (const tk of screenTokens) {
      if (!tk.isMisfit) continue;
      const rr = tk.r + ringPad;
      ctx.moveTo(tk.sx + rr, tk.sy);
      ctx.arc(tk.sx, tk.sy, rr, 0, Math.PI * 2);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 5B. 绘制 27 枚实心几何主体与暗码（外提字体状态，极简绘制开销）
    const codeSize = Math.max(10, Math.round(baseR * 0.78));
    ctx.font = `700 ${codeSize}px "DM Mono", "Noto Sans SC", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const sandStrokeCol = state.grayscale ? "rgba(60,60,60,0.35)" : "rgba(125,87,24,0.28)";

    for (const tk of screenTokens) {
      if (tk.alpha < 0.99) ctx.globalAlpha = tk.alpha;
      const fill = state.grayscale ? COLOR_GRAY[tk.color] : COLOR_HEX[tk.color];

      drawTokenShape(ctx, tk.shape, tk.sx, tk.sy, tk.r);
      ctx.fillStyle = fill;
      ctx.fill();

      if (tk.color === "sand") {
        ctx.strokeStyle = sandStrokeCol;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (tk.idx === hoverIdx || (tk.idx === state.selectedIdx && document.activeElement === canvas)) {
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tk.sx, tk.sy, tk.r + (compact ? 6.5 : 8), 0, Math.PI * 2);
        ctx.stroke();
      }

      if (lastClickFlash.idx === tk.idx && lastClickFlash.age < 1) {
        ctx.strokeStyle = PALETTE.green;
        ctx.globalAlpha = (1 - lastClickFlash.age) * 0.85;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(tk.sx, tk.sy, tk.r + 4 + lastClickFlash.age * 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = tk.alpha;
      }

      const grp = ev.theme.groups[tk.group];
      ctx.fillStyle = tk.color === "sand" ? "#3A280B" : "#FFFDF7";
      const yOff = tk.shape === "triangle" ? tk.r * 0.16 : 0.5;
      ctx.fillText(grp.code, tk.sx, tk.sy + yOff);
    }
    ctx.globalAlpha = 1;

    // 6. 底部 4 枚原海报招牌「虚线大括号 + 终端圆点 + 实时归队人数」
    const brYTop = matrixTop + matrixH + 4;
    const brYMid = brYTop + 12;
    const brYDot = brYMid + 13;
    const brGap = compact ? 6 : 14;
    const brW = (matrixW - brGap * 3) / 4;

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i < 4; i++) {
      const b = ev.brackets[i];
      const bx1 = padX + i * (brW + brGap) + 3;
      const bx2 = bx1 + brW - 6;
      const bxm = (bx1 + bx2) / 2;

      drawDashedBracket(ctx, bx1, bx2, brYTop, brYMid, brYDot, b.color, b.ok);

      ctx.fillStyle = b.textColor;
      ctx.font = `700 ${compact ? 11.5 : 13.5}px "Noto Sans SC", sans-serif`;
      const labelMain = compact ? `${b.name.slice(0, 3)} ${b.count}` : `${b.name} · ${b.count}${i < 3 ? "/9" : " 枚"}`;
      ctx.fillText(labelMain, bxm, brYDot + 6);

      ctx.fillStyle = "#3E372A";
      ctx.font = `500 ${compact ? 10 : 11.5}px "Noto Sans SC", sans-serif`;
      const subLine = compact ? (i === 3 ? (b.count ? "不归类" : "已清零") : (b.ok ? "已归类" : "待归队")) : b.sub;
      ctx.fillText(subLine, bxm, brYDot + (compact ? 22 : 25));
    }

    ctx.restore();
  }

  function clientToLocal(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function findHitToken(lx, ly) {
    let best = null;
    let bestD = Infinity;
    for (const tk of hitTargets) {
      const d = Math.hypot(lx - tk.sx, ly - tk.sy);
      const radius = Math.max(tk.r + 10, 22);
      if (d <= radius && d < bestD) {
        best = tk;
        bestD = d;
      }
    }
    return best;
  }

  function toggleTokenAt(idx) {
    const state = getState();
    const ev = evaluate(state);
    const tk = ev.tokens[idx];
    if (!tk) return;
    const nextOverrides = { ...(state.overrides || {}) };
    if (tk.isMisfit) {
      // 修复这枚叛徒：赋给它所在语义组的规范签名
      const exp = expectedGroupSig(state, tk.group);
      nextOverrides[idx] = { shape: exp.shape, color: exp.color, size: exp.size };
    } else {
      // 主动制造 1 枚叛徒（体验单点破群）
      const altShape = tk.shape === "circle" ? "triangle" : tk.shape === "square" ? "circle" : "square";
      const altColor = tk.color === "coral" ? "green" : "coral";
      nextOverrides[idx] = { shape: altShape, color: altColor, size: tk.size };
    }
    lastClickFlash = { idx, age: 0 };
    dirty = true;
    onStateChange({ ...state, overrides: nextOverrides, selectedIdx: idx });
  }

  // 指针交互：水平拖动调跨位混排度（竖向保留给手机页面滚动），点击修复/切换标本
  function onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging = true;
    moved = false;
    touchLockedAxis = e.pointerType === "mouse" ? "x" : null;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartMix = getState().mix;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  }

  function onPointerMove(e) {
    const { x, y } = clientToLocal(e.clientX, e.clientY);
    if (!dragging) {
      const hit = findHitToken(x, y);
      const nextHover = hit ? hit.idx : -1;
      if (nextHover !== hoverIdx) {
        hoverIdx = nextHover;
        canvas.style.cursor = nextHover >= 0 ? "pointer" : "ew-resize";
        dirty = true;
        runner.draw();
      }
      return;
    }

    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (!touchLockedAxis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      touchLockedAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
    if (touchLockedAxis === "y") return; // 手机上下滑让给页面滚动

    if (Math.abs(dx) > 5) moved = true;
    if (moved) {
      const span = Math.max(180, cssW * 0.65);
      const nextMix = Math.max(0, Math.min(1, dragStartMix + dx / span));
      const state = getState();
      if (Math.abs(nextMix - state.mix) > 0.002) {
        dirty = true;
        pendingSync = true;
        onStateChange({ ...state, mix: nextMix }, true);
        if (reducedMotion.matches) runner.draw();
      }
    }
  }

  function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    touchLockedAxis = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
    if (!moved) {
      const { x, y } = clientToLocal(e.clientX, e.clientY);
      const hit = findHitToken(x, y);
      if (hit) toggleTokenAt(hit.idx);
    } else {
      pendingSync = true;
      dirty = true;
    }
  }

  // 兼顾 tools/perf.mjs 发出的原始 touch 事件（仅在 pointer 事件未接管时作后备）
  let rawTouchStartX = 0;
  let rawTouchStartMix = 0;
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    rawTouchStartX = e.touches[0].clientX;
    rawTouchStartMix = getState().mix;
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (dragging || !e.touches.length) return;
    if (touchLockedAxis === "y") return;
    const dx = e.touches[0].clientX - rawTouchStartX;
    if (Math.abs(dx) > 3) {
      const span = Math.max(180, cssW * 0.65);
      const nextMix = Math.max(0, Math.min(1, rawTouchStartMix + dx / span));
      const state = getState();
      if (Math.abs(nextMix - state.mix) > 0.002) {
        dirty = true;
        pendingSync = true;
        onStateChange({ ...state, mix: nextMix }, true);
        if (reducedMotion.matches) runner.draw();
      }
    }
  }, { passive: true });

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", () => { dragging = false; touchLockedAxis = null; });
  canvas.addEventListener("pointerleave", () => {
    if (hoverIdx !== -1) { hoverIdx = -1; dirty = true; runner.draw(); }
  });

  // 键盘支持：←/→ 调混排度，Tab 聚焦后按 Enter/Space 修复选中标本，↑/↓ 切换选中标本
  canvas.addEventListener("keydown", (e) => {
    const state = getState();
    const step = e.shiftKey ? 0.12 : 0.05;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      dirty = true;
      onStateChange({ ...state, mix: Math.max(0, state.mix - step) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      dirty = true;
      onStateChange({ ...state, mix: Math.min(1, state.mix + step) });
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const delta = e.key === "ArrowDown" ? 1 : -1;
      const nextIdx = ((state.selectedIdx ?? 0) + delta + 27) % 27;
      dirty = true;
      onStateChange({ ...state, selectedIdx: nextIdx });
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleTokenAt(state.selectedIdx ?? 0);
    }
  });

  const runner = loop(canvas, render);
  const ro = new ResizeObserver(() => {
    dirty = true;
    runner.draw();
  });
  ro.observe(canvas);

  return {
    redraw() {
      dirty = true;
      runner.draw();
    },
    toggleTokenAt,
  };
}

// 232 · 开场活体工坊（真实 CSS position: relative 四卡排架 + 2D Canvas 蓝图测绘层）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { INITIAL_HERO, POSTER_PRESET, SAFE_OFFSET, clamp, evaluateHero, fmtPx, rawPx } from "./model.js";

export function initHero() {
  const stage = document.getElementById("hero-stage");
  const canvas = document.getElementById("hero-canvas");
  const ctx = canvas.getContext("2d");
  const shelf = document.getElementById("hero-shelf");
  const cardA = document.getElementById("card-a");
  const cardB = document.getElementById("card-b");
  const cardC = document.getElementById("card-c");
  const cardD = document.getElementById("card-d");
  const ghostC = document.getElementById("card-c-ghost");
  const bBadge = document.getElementById("b-badge");
  const titleLiveChar = document.getElementById("title-live-char");

  const topStamp = document.getElementById("top-stamp");
  const miniMetrics = document.getElementById("hero-mini-metrics");
  const floorPill = document.getElementById("stage-offset-pill");
  const legendGhost = document.getElementById("legend-ghost-readout");
  const legendOffset = document.getElementById("legend-offset-readout");
  const diagCard = document.getElementById("hero-diag");
  const diagBadge = document.getElementById("diag-badge");
  const diagCount = document.getElementById("diag-count");
  const diagTitle = document.getElementById("diag-title");
  const diagBody = document.getElementById("diag-body");
  const diagHint = document.getElementById("diag-hint");
  const cssPre = document.getElementById("hero-css");
  const checksHost = document.getElementById("hero-checks");

  const state = { ...INITIAL_HERO };
  // 开场入场动画（0 → 0.65s 从原位滑出到初始错态；减少动态效果下跳过）
  let introProgress = reducedMotion.matches ? 1 : 0;
  let introCancelled = reducedMotion.matches;
  let dirty = true;

  // 缓存 C 在普通文档流中的基准槽位（相对于 #hero-stage）
  let baseSlot = { left: 0, top: 0, width: 120, height: 110, gap: 16 };
  let lastEval = null;

  function measureBaseSlot() {
    const sr = stage.getBoundingClientRect();
    const ar = cardA.getBoundingClientRect();
    const br = cardB.getBoundingClientRect();
    const gap = Math.max(8, Math.round(br.left - ar.right));
    const width = br.width;
    const height = br.height;
    // 在 4 卡水平流里，C 的原位左缘 = B 的右缘 + gap，顶缘 = B 的顶缘
    baseSlot = {
      left: br.right - sr.left + gap,
      top: br.top - sr.top,
      width,
      height,
      gap,
    };
  }

  function applyCardStyles(dx, dy) {
    // 邻卡 B：是否挂零偏移 position: relative 包含块
    cardB.style.position = state.bAnchor ? "relative" : "static";
    cardB.style.zIndex = state.bAnchor ? "2" : "";

    // 主角 C：真实 CSS position + 偏移 + 层叠
    cardC.style.position = state.positionMode;
    cardC.style.zIndex = state.zMode;

    // 清空四边，再按真实轴向施加
    cardC.style.top = "";
    cardC.style.left = "";
    cardC.style.bottom = "";
    cardC.style.right = "";
    cardC.style.width = "";
    cardC.style.height = "";

    if (state.positionMode === "relative") {
      if (state.axisMode === "br") {
        cardC.style.bottom = rawPx(-dy);
        cardC.style.right = rawPx(-dx);
      } else if (state.axisMode === "conflict") {
        cardC.style.top = rawPx(dy);
        cardC.style.left = rawPx(dx);
        cardC.style.bottom = rawPx(dy);
        cardC.style.right = rawPx(dx);
      } else {
        cardC.style.top = rawPx(dy);
        cardC.style.left = rawPx(dx);
      }
      ghostC.style.opacity = "1";
    } else if (state.positionMode === "absolute") {
      // 真正脱离文档流：固定宽高于当前槽位尺寸，D 卡片立刻左冲补位！
      cardC.style.width = `${baseSlot.width}px`;
      cardC.style.height = `${baseSlot.height}px`;
      cardC.style.left = `${baseSlot.left + dx}px`;
      cardC.style.top = `${baseSlot.top + dy}px`;
      ghostC.style.opacity = "0";
    } else {
      // static：浏览器忽略一切偏移
      ghostC.style.opacity = "0.55";
    }

    // 同步蓝虚线幽灵原位框
    ghostC.style.left = `${baseSlot.left}px`;
    ghostC.style.top = `${baseSlot.top}px`;
    ghostC.style.width = `${baseSlot.width}px`;
    ghostC.style.height = `${baseSlot.height}px`;

    // 刊头示范字「位」随 C 的偏移做轻微联动（最多 ±5px）
    const charX = state.positionMode === "static" ? 0 : clamp(dx * 0.08, -6, 6);
    const charY = state.positionMode === "static" ? 0 : clamp(dy * 0.1, -5, 5);
    titleLiveChar.style.transform = `translate(${charX.toFixed(1)}px, ${charY.toFixed(1)}px)`;
  }

  function updateReadouts(ev) {
    topStamp.textContent = ev.tone === "pass" ? "4 / 4 达标" : `${ev.passed} / 4 待校`;
    topStamp.dataset.tone = ev.tone;

    const dirX = ev.effDx >= 0 ? `向右 ${fmtPx(ev.effDx)}` : `向左 ${fmtPx(ev.effDx)}`;
    const dirY = ev.effDy >= 0 ? `向下 ${fmtPx(ev.effDy)}` : `向上 ${fmtPx(ev.effDy)}`;
    floorPill.textContent = state.positionMode === "static"
      ? "static：偏移属性已失效（0px, 0px）"
      : `偏移：${dirX} · ${dirY}`;

    miniMetrics.textContent = `${state.positionMode} · ${fmtPx(ev.effDx)}, ${fmtPx(ev.effDy)} · ${ev.ghostSlotPreserved ? "原位保留" : "占位塌陷"}`;

    legendGhost.textContent = ev.ghostSlotPreserved
      ? `原位保留（${Math.round(baseSlot.width)}×${Math.round(baseSlot.height)}px）`
      : "已脱流：原位占位消失";
    legendOffset.textContent = state.positionMode === "static"
      ? "static 锁定在原位"
      : `相对原位 ${fmtPx(ev.effDx)} / ${fmtPx(ev.effDy)}`;

    diagCard.dataset.tone = ev.tone;
    diagBadge.textContent = ev.tag;
    diagCount.textContent = `${ev.passed} / 4`;
    diagTitle.textContent = ev.title;
    diagBody.textContent = ev.body;
    diagHint.textContent = ev.hint;
    cssPre.textContent = ev.cssCode;

    // 同步底部 4 项验收灯
    checksHost.innerHTML = ev.checks
      .map((c) => `<span class="check-chip ${c.ok ? "is-ok" : ""}">
        <span class="check-dot" aria-hidden="true">${c.ok ? "✓" : "!"}</span>
        <strong>${c.label}</strong>
        <em>${c.badge}</em>
      </span>`)
      .join("");
  }

  function drawBlueprintOverlay(ev, rects) {
    const sr = rects.stage;
    const dpr = pixelRatio(2);
    const w = Math.max(1, Math.round(sr.width));
    const h = Math.max(1, Math.round(sr.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const rel = (r) => ({
      left: r.left - sr.left,
      top: r.top - sr.top,
      right: r.right - sr.left,
      bottom: r.bottom - sr.top,
      width: r.width,
      height: r.height,
    });

    const rB = rel(rects.cardB);
    const rC = rel(rects.cardC);
    const rD = rel(rects.cardD);
    const rG = {
      left: baseSlot.left,
      top: baseSlot.top,
      right: baseSlot.left + baseSlot.width,
      bottom: baseSlot.top + baseSlot.height,
      width: baseSlot.width,
      height: baseSlot.height,
    };

    // 1. 若 C 与 B 或 D 存在真实 DOM 重叠，画出建筑斜线碰撞警报区
    const drawCollision = (other, label) => {
      const ix1 = Math.max(rC.left, other.left);
      const iy1 = Math.max(rC.top, other.top);
      const ix2 = Math.min(rC.right, other.right);
      const iy2 = Math.min(rC.bottom, other.bottom);
      if (ix2 - ix1 <= 1 || iy2 - iy1 <= 1) return;

      ctx.save();
      ctx.beginPath();
      ctx.rect(ix1, iy1, ix2 - ix1, iy2 - iy1);
      ctx.clip();
      ctx.fillStyle = "rgba(244, 40, 15, 0.22)";
      ctx.fillRect(ix1, iy1, ix2 - ix1, iy2 - iy1);
      ctx.strokeStyle = "#F4280F";
      ctx.lineWidth = 1.5;
      for (let d = -iy2; d < ix2 + iy2; d += 8) {
        ctx.beginPath();
        ctx.moveTo(ix1 + d, iy1);
        ctx.lineTo(ix1 + d + (iy2 - iy1), iy2);
        ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = "#0C0C0E";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ix1 + 0.5, iy1 + 0.5, ix2 - ix1 - 1, iy2 - iy1 - 1);

      drawPill(ctx, (ix1 + ix2) / 2, Math.max(14, iy1 - 11), label, "#B91C0A", "#FFFDF8");
    };

    if (ev.overlapD.ratio > 0) drawCollision(rD, `撞遮 D ${ev.overlapD.ratio}%`);
    if (ev.overlapB.ratio > 0) drawCollision(rB, `撞遮 B ${ev.overlapB.ratio}%`);

    // 2. 原海报标志：从原位左上角到 C 当前左上角的红虚线 L 形偏移尺寸箭
    if (state.positionMode !== "static" && (Math.abs(ev.effDx) > 2 || Math.abs(ev.effDy) > 2)) {
      const x0 = rG.left;
      const y0 = rG.top;
      const x1 = rC.left;
      const y1 = rC.top;

      ctx.save();
      ctx.strokeStyle = "#DC220B";
      ctx.fillStyle = "#DC220B";
      ctx.lineWidth = 1.75;
      ctx.setLineDash([5, 4]);

      // 原位起点小红圆
      ctx.beginPath();
      ctx.arc(x0, y0, 3.8, 0, Math.PI * 2);
      ctx.fill();

      // 折线：先纵后横，呼应海报 232 图 2 的红色虚线折箭
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0, y1);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.setLineDash([]);

      // 箭头尖端
      if (Math.abs(x1 - x0) >= 6) {
        const dir = x1 > x0 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - dir * 7, y1 - 4);
        ctx.lineTo(x1 - dir * 7, y1 + 4);
        ctx.closePath();
        ctx.fill();
      } else if (Math.abs(y1 - y0) >= 6) {
        const dir = y1 > y0 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(x0, y1);
        ctx.lineTo(x0 - 4, y1 - dir * 7);
        ctx.lineTo(x0 + 4, y1 - dir * 7);
        ctx.closePath();
        ctx.fill();
      }

      // 坐标标签放在折线左外侧或底部，避免与顶部「角标逃逸」标签打架
      const coordText = `${fmtPx(ev.effDx)}, ${fmtPx(ev.effDy)}`;
      const tx = clamp(x0 - 4, 52, w - 52);
      const ty = y1 >= y0
        ? clamp(rG.bottom + 14, 20, h - 32)
        : clamp(y1 - 12, 30, h - 32);
      drawPill(ctx, tx, ty, coordText, "#0C0C0E", "#FFFDF8");
      ctx.restore();
    }

    // 3. 若切到 absolute，标注 D 卡左冲补位
    if (state.positionMode === "absolute") {
      const fromX = rG.left + rG.width + baseSlot.gap + rD.width * 0.4;
      const toX = rD.left + rD.width * 0.5;
      const midY = rD.top - 12;
      if (fromX - toX > 20) {
        ctx.save();
        ctx.strokeStyle = "#1E55C9";
        ctx.fillStyle = "#1E55C9";
        ctx.lineWidth = 1.75;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(Math.min(w - 14, fromX), midY);
        ctx.lineTo(toX, midY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(toX, midY);
        ctx.lineTo(toX + 7, midY - 4);
        ctx.lineTo(toX + 7, midY + 4);
        ctx.closePath();
        ctx.fill();
        drawPill(ctx, clamp((Math.min(w - 14, fromX) + toX) / 2, 74, w - 74), Math.max(14, midY - 12), "D 左冲补位（原位已塌陷）", "#1E55C9", "#FFFDF8");
        ctx.restore();
      }
    }

    // 4. 若 B 未设 relative，画出 NEW 角标的红色逃逸牵引线（稳居顶沿通道）
    if (!state.bAnchor) {
      const rBadge = rel(bBadge.getBoundingClientRect());
      const startX = rB.right - 8;
      const startY = rB.top + 6;
      const endX = rBadge.left - 4;
      const endY = rBadge.top + rBadge.height / 2;

      ctx.save();
      ctx.strokeStyle = "#DC220B";
      ctx.fillStyle = "#DC220B";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo((startX + endX) / 2, Math.max(6, Math.min(startY, endY) - 10), endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(startX, startY, 3.2, 0, Math.PI * 2);
      ctx.fill();

      const escLabel = w < 440 ? "B 缺 relative · 逃逸" : "B 未设 relative · 角标逃逸";
      drawPill(ctx, clamp((startX + endX) / 2, 74, rBadge.left - 78), Math.max(14, endY), escLabel, "#B91C0A", "#FFFDF8");
      ctx.restore();
    }
  }

  function drawPill(c, cx, cy, text, bg, fg) {
    c.save();
    c.font = '600 11px "JetBrains Mono", "Noto Sans SC", monospace';
    const tw = c.measureText(text).width;
    const pw = tw + 12;
    const ph = 18;
    const x = Math.round(cx - pw / 2);
    const y = Math.round(cy - ph / 2);
    c.fillStyle = bg;
    c.fillRect(x, y, pw, ph);
    c.fillStyle = fg;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(text, Math.round(cx), Math.round(cy) + 0.5);
    c.restore();
  }

  function syncAll(scale = 1) {
    measureBaseSlot();
    const curDx = Math.round(state.dx * scale);
    const curDy = Math.round(state.dy * scale);
    applyCardStyles(curDx, curDy);

    const rects = {
      stage: stage.getBoundingClientRect(),
      cardA: cardA.getBoundingClientRect(),
      cardB: cardB.getBoundingClientRect(),
      cardC: cardC.getBoundingClientRect(),
      cardD: cardD.getBoundingClientRect(),
      ghostC: {
        left: stage.getBoundingClientRect().left + baseSlot.left,
        top: stage.getBoundingClientRect().top + baseSlot.top,
        width: baseSlot.width,
        height: baseSlot.height,
      },
      gap: baseSlot.gap,
    };

    const tempState = scale === 1 ? state : { ...state, dx: curDx, dy: curDy };
    lastEval = evaluateHero(tempState, rects);
    updateReadouts(lastEval);
    drawBlueprintOverlay(lastEval, rects);
  }

  // 主循环（离开屏幕或减少动态效果自动停帧，静置时不浪费重绘）
  const stageLoop = loop(canvas, (_t, dt, { still }) => {
    if (still || introCancelled) {
      if (introProgress < 1) {
        introProgress = 1;
        dirty = true;
      }
      if (!dirty) return;
      dirty = false;
      syncAll(1);
      return;
    }

    if (introProgress < 1) {
      introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) / 0.65);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - introProgress, 3);
      syncAll(ease);
      dirty = false;
      return;
    }

    if (!dirty) return;
    dirty = false;
    syncAll(1);
  });

  function requestUpdate() {
    introCancelled = true;
    introProgress = 1;
    dirty = true;
    stageLoop.draw();
  }

  // ==================== 直接拖动朱红 C 卡片（[data-perf-drag]） ====================
  let dragInfo = null;

  function clampOffsets(nx, ny) {
    // 保证无论桌面还是 320px 手机，拖移绝不冲出舞台引发横向溢出
    const sr = stage.getBoundingClientRect();
    const minDx = Math.round(-(baseSlot.left - 8));
    const maxDx = Math.round(sr.width - (baseSlot.left + baseSlot.width) - 8);
    const minDy = -34;
    const maxDy = 46;
    return {
      dx: clamp(Math.round(nx), Math.min(-24, minDx), Math.max(24, maxDx)),
      dy: clamp(Math.round(ny), minDy, maxDy),
    };
  }

  cardC.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    introCancelled = true;
    introProgress = 1;
    cardC.setPointerCapture(e.pointerId);
    cardC.classList.add("is-dragging");
    dragInfo = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origDx: state.dx,
      origDy: state.dy,
    };
  });

  cardC.addEventListener("pointermove", (e) => {
    if (!dragInfo || e.pointerId !== dragInfo.id) return;
    const rawX = dragInfo.origDx + (e.clientX - dragInfo.startX);
    const rawY = dragInfo.origDy + (e.clientY - dragInfo.startY);
    let { dx, dy } = clampOffsets(rawX, rawY);

    // 靠近舒适微抬点 (0, -12) 轻吸附（单轴水平扫拖时不锁死，保留顺滑帧率）
    if (Math.hypot(dx - SAFE_OFFSET.snapX, dy - SAFE_OFFSET.snapY) <= SAFE_OFFSET.snapRadius && Math.abs(e.clientY - dragInfo.startY) > 3) {
      dx = SAFE_OFFSET.snapX;
      dy = SAFE_OFFSET.snapY;
    }

    state.dx = dx;
    state.dy = dy;
    dirty = true;
    stageLoop.draw();
  });

  const endDrag = (e) => {
    if (!dragInfo || e.pointerId !== dragInfo.id) return;
    cardC.classList.remove("is-dragging");
    try { cardC.releasePointerCapture(e.pointerId); } catch {}
    dragInfo = null;
  };
  cardC.addEventListener("pointerup", endDrag);
  cardC.addEventListener("pointercancel", endDrag);

  // 方向键微调（普通 4px，Shift 16px）
  cardC.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 16 : 4;
    let handled = true;
    if (e.key === "ArrowLeft") state.dx -= step;
    else if (e.key === "ArrowRight") state.dx += step;
    else if (e.key === "ArrowUp") state.dy -= step;
    else if (e.key === "ArrowDown") state.dy += step;
    else handled = false;
    if (!handled) return;
    e.preventDefault();
    const c = clampOffsets(state.dx, state.dy);
    state.dx = c.dx;
    state.dy = c.dy;
    requestUpdate();
  });

  // ==================== 控件绑定 ====================
  function syncControlButtons() {
    document.querySelectorAll("[data-pos]").forEach((btn) => {
      const on = btn.dataset.pos === state.positionMode;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    document.querySelectorAll("[data-axis]").forEach((btn) => {
      const on = btn.dataset.axis === state.axisMode;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    document.querySelectorAll("[data-z]").forEach((btn) => {
      const on = btn.dataset.z === state.zMode;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    document.querySelectorAll("[data-anchor]").forEach((btn) => {
      const on = (btn.dataset.anchor === "true") === state.bAnchor;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });

    const isCard = state.uiSkin === "card";
    stage.dataset.skin = state.uiSkin;
    document.getElementById("btn-skin-blueprint").classList.toggle("is-active", !isCard);
    document.getElementById("btn-skin-blueprint").setAttribute("aria-pressed", String(!isCard));
    document.getElementById("btn-skin-card").classList.toggle("is-active", isCard);
    document.getElementById("btn-skin-card").setAttribute("aria-pressed", String(isCard));
  }

  document.querySelectorAll("[data-pos]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.positionMode = btn.dataset.pos;
      syncControlButtons();
      requestUpdate();
    });
  });

  document.querySelectorAll("[data-axis]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.axisMode = btn.dataset.axis;
      syncControlButtons();
      requestUpdate();
    });
  });

  document.querySelectorAll("[data-z]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.zMode = btn.dataset.z;
      syncControlButtons();
      requestUpdate();
    });
  });

  document.querySelectorAll("[data-anchor]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.bAnchor = btn.dataset.anchor === "true";
      syncControlButtons();
      requestUpdate();
    });
  });

  document.getElementById("btn-skin-blueprint").addEventListener("click", () => {
    state.uiSkin = "blueprint";
    syncControlButtons();
    requestUpdate();
  });

  document.getElementById("btn-skin-card").addEventListener("click", () => {
    state.uiSkin = "card";
    syncControlButtons();
    requestUpdate();
  });

  document.getElementById("btn-poster-preset").addEventListener("click", () => {
    Object.assign(state, POSTER_PRESET);
    const c = clampOffsets(state.dx, state.dy);
    state.dx = c.dx;
    state.dy = c.dy;
    syncControlButtons();
    requestUpdate();
  });

  document.getElementById("btn-hero-reset").addEventListener("click", () => {
    Object.assign(state, INITIAL_HERO, { uiSkin: state.uiSkin });
    syncControlButtons();
    requestUpdate();
  });

  // 窗口缩放时重测槽位并重绘
  const ro = new ResizeObserver(() => {
    const c = clampOffsets(state.dx, state.dy);
    state.dx = c.dx;
    state.dy = c.dy;
    dirty = true;
    stageLoop.draw();
  });
  ro.observe(stage);

  syncControlButtons();
  // 首帧立即同步，避免布局闪动
  syncAll(reducedMotion.matches ? 1 : 0.12);
}

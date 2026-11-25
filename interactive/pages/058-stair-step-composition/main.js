import { loop, pixelRatio } from "../../lib/stage.js";
import {
  STEP_RULES,
  POSTER_STEPS,
  INITIAL_STATE,
  FLAT_STATE,
  QUIZ_LOCKED_STATE,
  clampHeight,
  clampRunRatio,
  fmtDelta,
  evaluateStair,
  computeStageLayout,
  evaluateStepCount,
} from "./model.js";

// ==================== 共享配色常量（实采 058 原海报） ====================
const COL = {
  ice: "#E3F1F8",
  shadow: "#BED4E3",
  cream: "#FBF2E5",
  peachA: "#F3A87A",
  peachB: "#F8BC95",
  terra: "#DD5F2D",
  terraDark: "#C64C1E",
  titleBrown: "#2A1206",
  ink: "#0F1F2E",
  muted: "#384E60",
  steel: "#1B3951",
  err: "#B02A1A",
  ok: "#145D44",
};

// ==================== 工具：绘制四级渐进几何体 ====================
function drawProgressiveShape(ctx, type, cx, baseY, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  if (type === "circle") {
    const r = size * 0.48;
    ctx.arc(cx, baseY - r, r, 0, Math.PI * 2);
  } else if (type === "triangle") {
    const h = size * 0.96;
    const hw = size * 0.56;
    ctx.moveTo(cx, baseY - h);
    ctx.lineTo(cx - hw, baseY);
    ctx.lineTo(cx + hw, baseY);
    ctx.closePath();
  } else if (type === "square") {
    const s = size * 0.88;
    ctx.rect(cx - s / 2, baseY - s, s, s);
  } else {
    // 04 五角星
    const rOut = size * 0.58;
    const rIn = rOut * 0.42;
    const cy = baseY - rOut * 0.86;
    for (let k = 0; k < 10; k++) {
      const ang = -Math.PI / 2 + (k * Math.PI) / 5;
      const r = k % 2 === 0 ? rOut : rIn;
      const px = cx + Math.cos(ang) * r;
      const py = cy + Math.sin(ang) * r;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
}

// 绘制中文按宽度自动折行（避头标点保护，绝不让孤立句号/逗号落到新行）
function drawWrappedLines(ctx, text, x, y, maxW, lineH, maxLines) {
  const chars = [...text];
  const noLineStart = new Set(["。", "，", "、", "；", "：", "！", "？", "」", "）"]);
  let line = "";
  let cy = y;
  let count = 0;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line && !noLineStart.has(ch)) {
      count++;
      if (count >= maxLines) {
        ctx.fillText(line, x, cy);
        return;
      }
      ctx.fillText(line, x, cy);
      line = ch;
      cy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}

// ==================== HERO：四级建筑筑阶台 ====================
function initHero() {
  const frameEl = document.getElementById("stage-frame");
  const canvas = document.getElementById("hero-canvas");
  const ctx = canvas.getContext("2d");
  const handles = [...document.querySelectorAll(".step-handle")];
  const railTrack = document.getElementById("rail-track");
  const railSafe = document.getElementById("rail-safe");
  const treadThumb = document.getElementById("tread-thumb");
  const treadValEl = document.getElementById("tread-val");
  const btnFlat = document.getElementById("btn-flat");
  const btnReset = document.getElementById("btn-reset");

  const diagBox = document.getElementById("diag-box");
  const diagTier = document.getElementById("diag-tier");
  const diagHeadline = document.getElementById("diag-headline");
  const diagWhy = document.getElementById("diag-why");
  const mDeltas = document.getElementById("m-deltas");
  const mRun = document.getElementById("m-run");
  const mSlope = document.getElementById("m-slope");
  const snNo = document.getElementById("sn-no");
  const snTitle = document.getElementById("sn-title");
  const snBody = document.getElementById("sn-body");
  const badgeEls = new Map(
    [...document.querySelectorAll("#hero-badges .pbadge")].map((el) => [el.dataset.badge, el])
  );

  const state = {
    heights: [...INITIAL_STATE.heights],
    runRatio: INITIAL_STATE.runRatio,
    activeStep: 2, // 初始聚焦塌陷的第 03 阶
    draggingStep: -1,
    draggingTread: false,
    introProgress: 0,
    pulsePhase: 0,
    layout: null,
    evalResult: null,
    cssW: 800,
    cssH: 480,
    mode: "desktop",
  };

  // 设置安全区间条位置（与 STEP_RULES 同源）
  const spanAll = STEP_RULES.runSliderMax - STEP_RULES.runSliderMin;
  const safeLeftPct = ((STEP_RULES.runMin - STEP_RULES.runSliderMin) / spanAll) * 100;
  const safeWidthPct = ((STEP_RULES.runMax - STEP_RULES.runMin) / spanAll) * 100;
  railSafe.style.left = `${safeLeftPct}%`;
  railSafe.style.width = `${safeWidthPct}%`;

  function detectMode() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (h <= 480 && w >= 600) return "landscape";
    if (w <= 680) return "mobile";
    if (w <= 1080) return "tablet";
    return "desktop";
  }

  function resize() {
    const rect = frameEl.getBoundingClientRect();
    const dpr = pixelRatio(2);
    state.cssW = Math.max(260, Math.round(rect.width));
    state.cssH = Math.max(200, Math.round(rect.height));
    state.mode = detectMode();
    canvas.width = Math.round(state.cssW * dpr);
    canvas.height = Math.round(state.cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    syncAll();
  }

  function updateTreadUI() {
    const pct = ((state.runRatio - STEP_RULES.runSliderMin) / spanAll) * 100;
    const clampedPct = Math.max(8, Math.min(92, pct));
    treadThumb.style.left = `${clampedPct}%`;
    treadThumb.setAttribute("aria-valuenow", String(state.runRatio));
    treadValEl.textContent = `${state.runRatio}%`;
  }

  function updateReadout(ev) {
    diagBox.dataset.severity = ev.severity;
    diagTier.textContent = ev.tier;
    diagHeadline.textContent = ev.headline;
    diagWhy.textContent = ev.why;
    mDeltas.textContent = `Δ ${ev.deltas.map(fmtDelta).join(" / ")} 格`;
    mRun.textContent = `步宽 ${ev.runRatio}% ${ev.runTier}`;
    mSlope.textContent = `坡角 ${ev.slopeDeg}° ${ev.slopeTier}`;

    for (const [key, el] of badgeEls) {
      el.classList.toggle("is-lit", !!ev.badges[key]);
    }

    const stepInfo = POSTER_STEPS[state.activeStep] || POSTER_STEPS[3];
    snNo.textContent = stepInfo.no;
    snTitle.textContent = stepInfo.title;
    snBody.textContent = stepInfo.body;
  }

  function positionHandles(layout) {
    handles.forEach((btn, i) => {
      const b = layout.blocks[i];
      btn.style.left = `${b.handleX}px`;
      btn.style.top = `${b.handleY}px`;
      btn.classList.toggle("is-active", state.activeStep === i);
      btn.classList.toggle("is-dragging", state.draggingStep === i);
      btn.setAttribute(
        "aria-label",
        `调节 ${POSTER_STEPS[i].no} ${POSTER_STEPS[i].title}高度，当前 ${b.heightVal} 格（上限 ${STEP_RULES.heightCaps[i].max} 格），上下拖动或按方向键调节`
      );
    });
  }

  function syncAll() {
    state.evalResult = evaluateStair(state);
    state.layout = computeStageLayout(state, state.cssW, state.cssH, state.mode);
    updateTreadUI();
    updateReadout(state.evalResult);
    positionHandles(state.layout);
  }

  function drawScene(t, dt, { still }) {
    if (!state.layout) syncAll();
    const layout = state.layout;
    const ev = state.evalResult;
    const { width: W, height: H, blocks, compact } = layout;

    // 柔和开场动画（0 → 0.58s 落位，check 在 0.9s 截图时已完全站稳；still 直接 1）
    if (still) {
      state.introProgress = 1;
    } else if (state.introProgress < 1) {
      state.introProgress = Math.min(1, state.introProgress + Math.max(dt, 0.016) / 0.58);
    }
    const ease = 1 - Math.pow(1 - state.introProgress, 3);

    // 成梯后的视线光点跃升节奏
    if (!still && ev.isOk) {
      state.pulsePhase = (state.pulsePhase + dt * 0.42) % 1;
    } else if (still && ev.isOk) {
      state.pulsePhase = 0.72;
    }

    ctx.clearRect(0, 0, W, H);

    // 1. 冰蓝雾底 + 右下对角冷灰蓝阴影（直接承袭 058 原海报）
    ctx.fillStyle = COL.ice;
    ctx.fillRect(0, 0, W, H);

    const b0 = blocks[0];
    const b3 = blocks[3];
    const shadowDiagY0 = Math.min(H - 8, b0.cardBottomY + 8);
    const shadowDiagY3 = Math.max(24, b3.treadBackY + b3.treadH * 0.5);
    ctx.fillStyle = COL.shadow;
    ctx.beginPath();
    ctx.moveTo(Math.max(0, b0.x + b0.riserW), H);
    ctx.lineTo(W, shadowDiagY3 + (W - (b3.x + b3.blockW)) * 0.35);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    // 2. 极轻建筑图纸刻度参考线（标出 01 标题禁区边界，拖动逼近上限时显现）
    if (layout.titleSafeZone && (state.draggingStep === 0 || state.draggingStep === 1)) {
      const cap = STEP_RULES.heightCaps[state.draggingStep].max;
      if (state.heights[state.draggingStep] >= cap - 4) {
        const z = layout.titleSafeZone;
        ctx.save();
        ctx.strokeStyle = "rgba(169, 54, 14, 0.42)";
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.strokeRect(z.x, z.y, z.w, z.h);
        ctx.fillStyle = COL.terraDark;
        ctx.font = `600 11px "Noto Sans SC", sans-serif`;
        ctx.fillText("左上标题区上限", z.x + 8, z.y + z.h - 8);
        ctx.restore();
      }
    }

    // 地面基准虚线
    ctx.save();
    ctx.strokeStyle = "rgba(27, 57, 81, 0.24)";
    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, layout.baseBottomY);
    ctx.lineTo(W - 16, layout.baseBottomY);
    ctx.stroke();
    ctx.restore();

    // 3. 逐级计算当前帧纵坐标（含平滑开场缓动）
    const animBlocks = blocks.map((b, i) => {
      const delay = i * 0.08;
      const localP = still ? 1 : Math.max(0, Math.min(1, (state.introProgress - delay) / (1 - delay)));
      const le = 1 - Math.pow(1 - localP, 3);
      const liftDelta = (layout.baseBottomY - b.cardBottomY) * (1 - le);
      return {
        ...b,
        cardTopY: b.cardTopY + liftDelta,
        cardBottomY: b.cardBottomY + liftDelta,
        treadBackY: b.treadBackY + liftDelta,
        shapeBaseY: b.shapeBaseY + liftDelta,
      };
    });

    // 4. 成梯时的对角包络虚线
    if (ev.isOk) {
      ctx.save();
      ctx.strokeStyle = "rgba(20, 93, 68, 0.55)";
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(animBlocks[0].x, animBlocks[0].cardTopY);
      ctx.lineTo(animBlocks[3].x + animBlocks[3].blockW, animBlocks[3].treadBackY);
      ctx.stroke();
      ctx.restore();
    }

    // 5. 逐座绘制四级等轴建筑阶梯块（由低索引向高索引叠画，压挤时自然呈现层叠遮挡）
    animBlocks.forEach((b, i) => {
      const step = POSTER_STEPS[i];
      const isFocused = state.activeStep === i;

      // 下方落地投影柱（让悬空海拔清晰可读）
      ctx.save();
      const grad = ctx.createLinearGradient(b.x, b.cardBottomY, b.x + b.blockW * 0.5, layout.baseBottomY);
      grad.addColorStop(0, "rgba(27, 57, 81, 0.14)");
      grad.addColorStop(1, "rgba(27, 57, 81, 0.02)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(b.x, b.cardBottomY);
      ctx.lineTo(b.x + b.blockW, b.cardBottomY);
      ctx.lineTo(b.x + b.blockW + 14, layout.baseBottomY);
      ctx.lineTo(b.x + 8, layout.baseBottomY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 杏桃斜顶踏面（等轴平行四边形）
      const tGrad = ctx.createLinearGradient(b.x, b.treadBackY, b.x + b.blockW + b.isoDx, b.cardTopY);
      tGrad.addColorStop(0, COL.peachA);
      tGrad.addColorStop(1, COL.peachB);
      ctx.fillStyle = tGrad;
      ctx.beginPath();
      ctx.moveTo(b.x, b.cardTopY);
      ctx.lineTo(b.x + b.isoDx, b.treadBackY);
      ctx.lineTo(b.x + b.blockW + b.isoDx, b.treadBackY);
      ctx.lineTo(b.x + b.blockW, b.cardTopY);
      ctx.closePath();
      ctx.fill();

      // 橘陶左侧立面踢面
      ctx.fillStyle = isFocused ? "#E36735" : COL.terra;
      ctx.fillRect(b.x, b.cardTopY, b.riserW, b.cardH);

      // 奶白正面信息卡
      ctx.fillStyle = COL.cream;
      ctx.fillRect(b.x + b.riserW, b.cardTopY, b.faceW, b.cardH);

      // 外廓细线（选中态以深巧克力褐轻勾）
      ctx.strokeStyle = isFocused ? COL.titleBrown : "rgba(27, 57, 81, 0.22)";
      ctx.lineWidth = isFocused ? 1.8 : 1;
      ctx.strokeRect(b.x + 0.5, b.cardTopY + 0.5, b.blockW - 1, b.cardH - 1);

      // 橘陶踢面上的深巧克力褐阶号 01–04（遵循主编意见 #5）
      ctx.save();
      ctx.fillStyle = COL.titleBrown;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const numSize = compact ? Math.max(13, Math.min(16, b.riserW * 0.72)) : Math.max(20, Math.min(27, b.riserW * 0.58));
      ctx.font = `800 ${numSize}px "Archivo", "Noto Sans SC", sans-serif`;
      ctx.fillText(step.no, b.x + b.riserW / 2, b.cardTopY + (compact ? 10 : 14));
      ctx.restore();

      // 奶白卡面文字：窄屏与横屏只留四字标题（绝不塞长文也不裁字）；桌面端与平板排完整海报说明
      ctx.save();
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const padL = b.x + b.riserW + (compact ? 6 : 13);
      // 考虑 runRatio < 100% 时相邻块右侧轻度贴近，给正文留足右缘安全距
      const overlapPad = i < 3 && state.runRatio < 100 ? Math.max(0, b.blockW - layout.stepDx) + 4 : 0;
      const textMaxW = Math.max(46, b.faceW - (compact ? 10 : 24) - (compact ? 0 : overlapPad));

      if (compact) {
        // 窄屏 & 横屏：2×2 两行四字标题，字号清晰 ≥ 11.5px
        const tSize = Math.max(12, Math.min(14.5, b.faceW * 0.25));
        ctx.fillStyle = COL.titleBrown;
        ctx.font = `700 ${tSize}px "Noto Sans SC", sans-serif`;
        const lineGap = tSize * 1.32;
        const startY = b.cardTopY + Math.max(14, (b.cardH - lineGap * 2) * 0.42);
        ctx.fillText(step.shortLines[0], padL, startY);
        ctx.fillText(step.shortLines[1], padL, startY + lineGap);
        // 橘陶小圆点点缀
        ctx.fillStyle = COL.terra;
        ctx.beginPath();
        ctx.arc(padL + 3, startY - 6, 2.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 桌面端与平板：四字大题 + 橘陶圆点 + 原海报说明 + 细横线 + 英文标
        const titleSize = Math.max(14, Math.min(19, b.faceW * 0.105));
        ctx.fillStyle = COL.titleBrown;
        ctx.font = `700 ${titleSize}px "Noto Sans SC", sans-serif`;
        ctx.fillText(step.title, padL, b.cardTopY + 12);

        ctx.fillStyle = COL.terra;
        ctx.beginPath();
        ctx.arc(padL + 3.5, b.cardTopY + 12 + titleSize + 9, 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COL.ink;
        const bodySize = textMaxW < 112 ? 10.5 : Math.max(11, Math.min(13, b.faceW * 0.068));
        ctx.font = `400 ${bodySize}px "Noto Sans SC", sans-serif`;
        if (textMaxW >= 72) {
          drawWrappedLines(ctx, step.body, padL, b.cardTopY + 12 + titleSize + 17, textMaxW, bodySize * 1.44, 4);
        }

        const enY = b.cardBottomY - 26;
        ctx.strokeStyle = "rgba(27, 57, 81, 0.28)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, enY - 6);
        ctx.lineTo(padL + 20, enY - 6);
        ctx.stroke();

        ctx.fillStyle = COL.muted;
        ctx.font = `600 10px "Manrope", "Archivo", sans-serif`;
        const enShort = step.en.length > 16 && textMaxW < 130 ? step.en.split(" ")[0] : step.en;
        ctx.fillText(enShort, padL, enY);
      }
      ctx.restore();

      // 深钢蓝渐进几何体（● ▲ ■ ★）稳落杏桃踏面
      drawProgressiveShape(ctx, step.shape, b.shapeCenterX, b.shapeBaseY, b.shapeSize, COL.steel);
    });

    // 6. 相邻踏面之间的深钢蓝虚线弯箭（单点高亮唯一主错段）
    for (let i = 0; i < 3; i++) {
      const a = animBlocks[i];
      const b = animBlocks[i + 1];
      const delta = ev.deltas[i];
      const isProblem = ev.problemSegment === i || ev.code === "descending";
      const sx = a.shapeCenterX + a.shapeSize * 0.35;
      const sy = a.treadBackY - a.shapeSize * 0.4;
      const ex = b.x + b.riserW * 0.45;
      const ey = b.treadBackY - b.shapeSize * 0.25;
      const cx = (sx + ex) * 0.45;
      const cy = Math.min(sy, ey) - (compact ? 22 : 34);

      ctx.save();
      ctx.strokeStyle = isProblem ? COL.err : ev.isOk ? COL.ok : COL.steel;
      ctx.lineWidth = isProblem ? 2.1 : 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(cx, cy, ex, ey);
      ctx.stroke();

      // 箭头尖
      const ang = Math.atan2(ey - cy, ex - cx);
      ctx.setLineDash([]);
      ctx.fillStyle = isProblem ? COL.err : ev.isOk ? COL.ok : COL.steel;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 7 * Math.cos(ang - 0.45), ey - 7 * Math.sin(ang - 0.45));
      ctx.lineTo(ex - 7 * Math.cos(ang + 0.45), ey - 7 * Math.sin(ang + 0.45));
      ctx.closePath();
      ctx.fill();

      // 步高差微标 Δ（只在有空间或出错段显示清晰标签）
      const mx = 0.25 * sx + 0.5 * cx + 0.25 * ex;
      const my = 0.25 * sy + 0.5 * cy + 0.25 * ey - 6;
      const tag = `${fmtDelta(delta)}`;
      ctx.font = `700 ${compact ? 10.5 : 11.5}px "Manrope", sans-serif`;
      const tw = ctx.measureText(tag).width + 10;
      ctx.fillStyle = isProblem ? "#FCE9E5" : "rgba(251, 242, 229, 0.92)";
      ctx.strokeStyle = isProblem ? COL.err : "rgba(27, 57, 81, 0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(mx - tw / 2, my - 10, tw, 17, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isProblem ? COL.err : COL.titleBrown;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tag, mx, my - 1.5);
      ctx.restore();
    }

    // 7. 成梯后沿四级踏面逐级轻跃的深钢蓝视线光点
    if (ev.isOk) {
      const segF = state.pulsePhase * 3;
      const segI = Math.min(2, Math.floor(segF));
      const u = segF - segI;
      const a = animBlocks[segI];
      const b = animBlocks[segI + 1];
      const sx = a.shapeCenterX;
      const sy = a.treadBackY - a.shapeSize * 0.4;
      const ex = b.shapeCenterX;
      const ey = b.treadBackY - b.shapeSize * 0.4;
      const cx = (sx + ex) * 0.5;
      const cy = Math.min(sy, ey) - (compact ? 26 : 40);
      const px = (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * cx + u * u * ex;
      const py = (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * cy + u * u * ey;

      ctx.save();
      ctx.fillStyle = "rgba(20, 93, 68, 0.22)";
      ctx.beginPath();
      ctx.arc(px, py, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COL.ok;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const stageLoop = loop(frameEl, drawScene);

  // ---------- 交互 1：四级踏面升降柄拖拽 + 键盘 ↑/↓ ----------
  handles.forEach((btn, i) => {
    let startY = 0;
    let startH = 0;
    let activePointer = null;

    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      btn.focus({ preventScroll: true });
      activePointer = e.pointerId;
      btn.setPointerCapture(e.pointerId);
      startY = e.clientY;
      startH = state.heights[i];
      state.activeStep = i;
      state.draggingStep = i;
      state.introProgress = 1;
      syncAll();
      stageLoop.draw();
    });

    btn.addEventListener("pointermove", (e) => {
      if (activePointer !== e.pointerId) return;
      e.preventDefault();
      const maxLift = state.layout ? state.layout.maxLift : 180;
      const dy = startY - e.clientY; // 向上拖增高
      const nextH = clampHeight(i, startH + (dy / maxLift) * 100);
      if (nextH !== state.heights[i]) {
        state.heights[i] = nextH;
        syncAll();
        stageLoop.draw();
      }
    });

    const endDrag = (e) => {
      if (activePointer !== e.pointerId) return;
      activePointer = null;
      state.draggingStep = -1;
      syncAll();
      stageLoop.draw();
    };
    btn.addEventListener("pointerup", endDrag);
    btn.addEventListener("pointercancel", endDrag);

    btn.addEventListener("focus", () => {
      state.activeStep = i;
      syncAll();
      stageLoop.draw();
    });

    btn.addEventListener("keydown", (e) => {
      const stepAmt = e.shiftKey ? 1 : 4;
      if (e.key === "ArrowUp" || e.key === "ArrowRight") {
        e.preventDefault();
        state.activeStep = i;
        state.introProgress = 1;
        state.heights[i] = clampHeight(i, state.heights[i] + stepAmt);
        syncAll();
        stageLoop.draw();
      } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
        e.preventDefault();
        state.activeStep = i;
        state.introProgress = 1;
        state.heights[i] = clampHeight(i, state.heights[i] - stepAmt);
        syncAll();
        stageLoop.draw();
      }
    });
  });

  // 桌面端也支持直接点画布阶梯块选中并垂直微调（触屏不拦截竖滚）
  let canvasDragStep = -1;
  let canvasStartY = 0;
  let canvasStartH = 0;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    if (!state.layout) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // 逆序命中上层块
    let hit = -1;
    for (let i = state.layout.blocks.length - 1; i >= 0; i--) {
      const b = state.layout.blocks[i];
      if (x >= b.x && x <= b.x + b.blockW + b.isoDx && y >= b.treadBackY - b.shapeSize && y <= b.cardBottomY) {
        hit = i;
        break;
      }
    }
    if (hit >= 0) {
      canvasDragStep = hit;
      canvasStartY = e.clientY;
      canvasStartH = state.heights[hit];
      state.activeStep = hit;
      state.draggingStep = hit;
      state.introProgress = 1;
      canvas.setPointerCapture(e.pointerId);
      syncAll();
      stageLoop.draw();
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (canvasDragStep < 0) return;
    const maxLift = state.layout ? state.layout.maxLift : 180;
    const nextH = clampHeight(canvasDragStep, canvasStartH + ((canvasStartY - e.clientY) / maxLift) * 100);
    if (nextH !== state.heights[canvasDragStep]) {
      state.heights[canvasDragStep] = nextH;
      syncAll();
      stageLoop.draw();
    }
  });
  const endCanvasDrag = () => {
    if (canvasDragStep < 0) return;
    canvasDragStep = -1;
    state.draggingStep = -1;
    syncAll();
    stageLoop.draw();
  };
  canvas.addEventListener("pointerup", endCanvasDrag);
  canvas.addEventListener("pointercancel", endCanvasDrag);

  // ---------- 交互 2：底沿建筑踏宽游标（data-perf-drag，支持鼠/触/键） ----------
  function setRunFromClientX(clientX) {
    const rect = railTrack.getBoundingClientRect();
    const ratio01 = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
    const nextRun = clampRunRatio(STEP_RULES.runSliderMin + ratio01 * spanAll);
    if (nextRun !== state.runRatio) {
      state.runRatio = nextRun;
      state.introProgress = 1;
      syncAll();
      stageLoop.draw();
    } else {
      // 即使数值四舍五入不变，拖动中仍确保响应平滑
      stageLoop.draw();
    }
  }

  let treadPointer = null;
  function startTreadPointer(e) {
    e.preventDefault();
    treadThumb.focus({ preventScroll: true });
    treadPointer = e.pointerId;
    treadThumb.classList.add("is-dragging");
    state.draggingTread = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setRunFromClientX(e.clientX);
  }
  function moveTreadPointer(e) {
    if (treadPointer !== e.pointerId) return;
    e.preventDefault();
    setRunFromClientX(e.clientX);
  }
  function endTreadPointer(e) {
    if (treadPointer !== e.pointerId) return;
    treadPointer = null;
    state.draggingTread = false;
    treadThumb.classList.remove("is-dragging");
  }

  for (const el of [railTrack, treadThumb]) {
    el.addEventListener("pointerdown", startTreadPointer);
    el.addEventListener("pointermove", moveTreadPointer);
    el.addEventListener("pointerup", endTreadPointer);
    el.addEventListener("pointercancel", endTreadPointer);
  }

  // 同时直听 touchstart/touchmove，确保 CDP dispatchTouchEvent 拖动 data-perf-drag 时每帧实时重绘
  treadThumb.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      e.preventDefault();
      state.draggingTread = true;
      treadThumb.classList.add("is-dragging");
      setRunFromClientX(e.touches[0].clientX);
    },
    { passive: false }
  );
  treadThumb.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length) return;
      e.preventDefault();
      setRunFromClientX(e.touches[0].clientX);
    },
    { passive: false }
  );
  treadThumb.addEventListener("touchend", () => {
    state.draggingTread = false;
    treadThumb.classList.remove("is-dragging");
  });

  treadThumb.addEventListener("keydown", (e) => {
    const stepAmt = e.shiftKey ? 1 : 4;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      state.runRatio = clampRunRatio(state.runRatio - stepAmt);
      state.introProgress = 1;
      syncAll();
      stageLoop.draw();
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      state.runRatio = clampRunRatio(state.runRatio + stepAmt);
      state.introProgress = 1;
      syncAll();
      stageLoop.draw();
    }
  });

  // ---------- 交互 3：试看平排 / 复原错阶 ----------
  btnFlat.addEventListener("click", () => {
    state.heights = [...FLAT_STATE.heights];
    state.runRatio = FLAT_STATE.runRatio;
    state.activeStep = 3;
    state.introProgress = 1;
    syncAll();
    stageLoop.draw();
  });

  btnReset.addEventListener("click", () => {
    state.heights = [...INITIAL_STATE.heights];
    state.runRatio = INITIAL_STATE.runRatio;
    state.activeStep = 2;
    state.introProgress = 1;
    syncAll();
    stageLoop.draw();
  });

  new ResizeObserver(resize).observe(frameEl);
  resize();

  // 供探针与内部状态排查（非外部接口）
  window.__stair058 = {
    getState: () => ({ heights: [...state.heights], runRatio: state.runRatio, eval: state.evalResult }),
    setState: (heights, runRatio) => {
      state.heights = heights.map((v, i) => clampHeight(i, v));
      if (typeof runRatio === "number") state.runRatio = clampRunRatio(runRatio);
      state.introProgress = 1;
      syncAll();
      stageLoop.draw();
    },
  };
}

// ==================== 01 节：四级解剖器 + 拆级开关 ====================
function initSec01() {
  const details = [
    {
      explain: "最底一阶用圆润无角的实心圆 ● 承接第一眼目光，给整架阶梯定下基准高度。若拆掉 01，02 悬在半空，读者找不到斜梯的发力起点。",
      removed: "已拆掉 01 确定起点：左下锚点消失，02 像凭空浮起，读者第一眼不知该从哪里进入整段信息。",
    },
    {
      explain: "第 02 阶承上启下，顶面换作带指向性的三角 ▲，把视线从起点稳稳推向中段。缺掉这一级，跨度会骤增一倍，步伐断档。",
      removed: "已拆掉 02 逐级推进：01 到 03 之间裂出两倍高差的大空洞，阶梯退化成前后孤立的两截，推进节奏立刻断开。",
    },
    {
      explain: "第 03 阶用稳重的方体 ■ 托起接近高潮的承重段，通过位置抬升与前两级拉开鲜明主次，为最高落点蓄势。",
      removed: "已拆掉 03 强化层级：中后段少了过渡承托，02 直接仰望遥远的 04，视觉落差变成悬崖。",
    },
    {
      explain: "最高一阶用尖锐醒目的五角星 ★ 锁住终点，把前面三级积蓄的势能收束在最高处，形成清晰记忆落点。",
      removed: "已拆掉 04 引导终点：视线一路爬升到 03 却撞上空荡右上角，前面铺垫全部悬空，信息没了收口。",
    },
  ];

  let active = 0;
  const removed = [false, false, false, false];
  const svgSteps = [...document.querySelectorAll("#s1-svg .s1-step")];
  const tabs = [...document.querySelectorAll("[data-s1-tab]")];
  const arcs = [0, 1, 2].map((i) => document.getElementById(`s1-arc-${i}`));
  const elNo = document.getElementById("s1-no");
  const elTitle = document.getElementById("s1-title");
  const elEn = document.getElementById("s1-en");
  const elQuote = document.getElementById("s1-quote");
  const elExplain = document.getElementById("s1-explain");
  const btnRemove = document.getElementById("s1-remove-btn");

  function render() {
    svgSteps.forEach((g, i) => {
      g.classList.toggle("is-active", i === active);
      g.classList.toggle("is-removed", removed[i]);
    });
    tabs.forEach((b, i) => {
      b.classList.toggle("is-active", i === active);
      b.classList.toggle("is-removed", removed[i]);
    });
    arcs.forEach((arc, i) => {
      arc.classList.toggle("is-broken", removed[i] || removed[i + 1]);
    });

    const step = POSTER_STEPS[active];
    const isRem = removed[active];
    elNo.textContent = step.no;
    elTitle.textContent = step.title;
    elEn.textContent = step.en;
    elQuote.textContent = `「${step.body}」`;
    elExplain.textContent = isRem ? details[active].removed : details[active].explain;
    btnRemove.setAttribute("aria-pressed", String(isRem));
    btnRemove.textContent = isRem ? "放回这一级" : "拆掉这一级";
  }

  svgSteps.forEach((g, i) => {
    g.addEventListener("click", () => {
      active = i;
      render();
    });
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        active = i;
        render();
      }
    });
  });

  tabs.forEach((b, i) => {
    b.addEventListener("click", () => {
      active = i;
      render();
    });
  });

  btnRemove.addEventListener("click", () => {
    removed[active] = !removed[active];
    render();
  });

  render();
}

// ==================== 02 节：上行 vs 下行双向翻转画布 ====================
function initSec02() {
  const wrap = document.querySelector(".s2-canvas-wrap");
  const canvas = document.getElementById("dir-canvas");
  const ctx = canvas.getContext("2d");
  const modeBtns = [...document.querySelectorAll("#dir-modes [data-dir]")];
  const btnLaunch = document.getElementById("btn-launch-eye");
  const roTitle = document.getElementById("dir-ro-title");
  const roText = document.getElementById("dir-ro-text");

  const MODES = {
    up: {
      title: "左下起步 → 右上落顶（攀升、增长、目标达成）",
      text: "在左起横排阅读语境下，左下至右上顺着「从前到后」叠加重力对抗的抬升感，天然适合讲成长、升级与最终目标；这也是 058 原海报采用的经典走向。",
      steps: [
        { no: "01", lbl: "起点", h: 0.14 },
        { no: "02", lbl: "推进", h: 0.40 },
        { no: "03", lbl: "强化", h: 0.66 },
        { no: "04", lbl: "高潮", h: 0.92 },
      ],
      order: [0, 1, 2, 3],
      badge: "LTR · 左起上行",
    },
    down: {
      title: "左上起纲 → 右下落地（总分拆解、层层落细）",
      text: "当信息逻辑是「先抛总目标、再拆步骤、最后落到可执行动作」时，由高到低顺势下沉更轻快——此时终点稳稳收在右下低位，不与高点抢戏。",
      steps: [
        { no: "01", lbl: "总纲", h: 0.92 },
        { no: "02", lbl: "拆解", h: 0.66 },
        { no: "03", lbl: "细化", h: 0.40 },
        { no: "04", lbl: "落地", h: 0.14 },
      ],
      order: [0, 1, 2, 3],
      badge: "LTR · 左起下行",
    },
    rtl: {
      title: "右下起步 → 左上落顶（右起阅读语境推论示意）",
      text: "结合 Chokron & De Agostini（2000）的 162 人跨阅读方向实证，习惯自右向左阅读的读者更偏好向左推进的构图方向——「上升必从左往右」并非放之四海而皆准。",
      steps: [
        { no: "04", lbl: "终点", h: 0.92 },
        { no: "03", lbl: "强化", h: 0.66 },
        { no: "02", lbl: "推进", h: 0.40 },
        { no: "01", lbl: "起点", h: 0.14 },
      ],
      order: [3, 2, 1, 0],
      badge: "RTL · 右起镜像示意",
    },
  };

  let curMode = "up";
  let pulse = 0; // 0..1 动画进度
  let animating = true;
  let cssW = 560;
  let cssH = 315;

  function resize() {
    const r = wrap.getBoundingClientRect();
    const dpr = pixelRatio(2);
    cssW = Math.max(260, Math.round(r.width));
    cssH = Math.max(160, Math.round(r.height));
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirLoop.draw();
  }

  function draw(t, dt, { still }) {
    const cfg = MODES[curMode];
    if (still) {
      pulse = 0.68;
      animating = false;
    } else if (animating) {
      pulse += dt * 0.46;
      if (pulse >= 1) {
        pulse = 1;
        animating = false;
      }
    }

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = COL.cream;
    ctx.fillRect(0, 0, cssW, cssH);

    // 淡图纸网格
    ctx.strokeStyle = "rgba(27, 57, 81, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 24; x < cssW; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cssH);
      ctx.stroke();
    }
    for (let y = 24; y < cssH; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cssW, y);
      ctx.stroke();
    }

    const padX = Math.max(20, cssW * 0.06);
    const gap = Math.max(8, cssW * 0.02);
    const bw = (cssW - padX * 2 - gap * 3) / 4;
    const bh = Math.max(40, cssH * 0.21);
    const baseY = cssH - 26;
    const maxLift = Math.max(60, cssH - bh - 76);

    const pts = cfg.steps.map((s, i) => {
      const x = padX + i * (bw + gap);
      const y = baseY - bh - s.h * maxLift;
      return { ...s, x, y, cx: x + bw * 0.5, topY: y };
    });

    // 绘制四座简洁等轴台阶
    pts.forEach((p, idx) => {
      // 杏桃踏面
      ctx.fillStyle = COL.peachA;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 8, p.y - 8);
      ctx.lineTo(p.x + bw + 8, p.y - 8);
      ctx.lineTo(p.x + bw, p.y);
      ctx.closePath();
      ctx.fill();

      // 橘陶踢面 + 冰蓝正面
      const rw = Math.max(22, bw * 0.28);
      ctx.fillStyle = COL.terra;
      ctx.fillRect(p.x, p.y, rw, bh);
      ctx.fillStyle = COL.ice;
      ctx.fillRect(p.x + rw, p.y, bw - rw, bh);
      ctx.strokeStyle = "rgba(27, 57, 81, 0.25)";
      ctx.strokeRect(p.x + 0.5, p.y + 0.5, bw - 1, bh - 1);

      ctx.fillStyle = COL.titleBrown;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `800 ${Math.max(12, Math.min(16, bw * 0.16))}px "Archivo", sans-serif`;
      ctx.fillText(p.no, p.x + rw / 2, p.y + bh / 2);

      ctx.font = `700 ${Math.max(11, Math.min(14, bw * 0.15))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(p.lbl, p.x + rw + (bw - rw) / 2, p.y + bh / 2);

      // 标出「起」「终」
      const ordIdx = cfg.order.indexOf(idx);
      if (ordIdx === 0 || ordIdx === 3) {
        const tag = ordIdx === 0 ? "起" : "终";
        ctx.fillStyle = ordIdx === 0 ? COL.steel : COL.terraDark;
        ctx.beginPath();
        ctx.arc(p.cx, p.y - 20, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COL.cream;
        ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
        ctx.fillText(tag, p.cx, p.y - 19.5);
      }
    });

    // 视线跃弧（按阅读顺序 order 连接）
    const ordered = cfg.order.map((i) => pts[i]);
    ctx.save();
    ctx.strokeStyle = COL.steel;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 4]);
    for (let k = 0; k < 3; k++) {
      const a = ordered[k];
      const b = ordered[k + 1];
      const mx = (a.cx + b.cx) / 2;
      const my = Math.min(a.topY, b.topY) - 34;
      ctx.beginPath();
      ctx.moveTo(a.cx, a.topY - 10);
      ctx.quadraticCurveTo(mx, my, b.cx, b.topY - 10);
      ctx.stroke();
    }
    ctx.restore();

    // 视线光点位置
    const segF = Math.min(2.999, pulse * 3);
    const segI = Math.floor(segF);
    const u = segF - segI;
    const a = ordered[segI];
    const b = ordered[segI + 1];
    const mx = (a.cx + b.cx) / 2;
    const my = Math.min(a.topY, b.topY) - 34;
    const gx = (1 - u) * (1 - u) * a.cx + 2 * (1 - u) * u * mx + u * u * b.cx;
    const gy = (1 - u) * (1 - u) * (a.topY - 10) + 2 * (1 - u) * u * my + u * u * (b.topY - 10);

    ctx.fillStyle = "rgba(213, 84, 37, 0.24)";
    ctx.beginPath();
    ctx.arc(gx, gy, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COL.terraDark;
    ctx.beginPath();
    ctx.arc(gx, gy, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // 左上角模式注记
    ctx.fillStyle = COL.muted;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `600 11.5px "Manrope", "Noto Sans SC", sans-serif`;
    ctx.fillText(cfg.badge, 12, 12);
  }

  const dirLoop = loop(wrap, draw);

  function setMode(next) {
    curMode = next;
    modeBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.dir === next));
    roTitle.textContent = MODES[next].title;
    roText.textContent = MODES[next].text;
    pulse = 0;
    animating = true;
    dirLoop.draw();
  }

  modeBtns.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.dir)));
  btnLaunch.addEventListener("click", () => {
    pulse = 0;
    animating = true;
    dirLoop.draw();
  });

  new ResizeObserver(resize).observe(wrap);
  resize();
}

// ==================== 03 节：四年代建筑编年标尺 ====================
function initSec03() {
  const ERAS = [
    {
      kicker: "1675–1683 · ARCHITECTURAL STEP FORMULA",
      title: "布隆代尔：踢面与踏面必须互相锁住",
      body: "法国建筑师弗朗索瓦·布隆代尔（François Blondel）在《建筑教程》（1675–1683）第五部第三卷第十四章中提出著名的楼梯步距律：两倍踢面高加一级踏面深等于一个自然平步（2h + g = 24 pouces，法国王尺约合 65 cm）。步高太陡就费力，踏面太浅就落不住脚——平面版面里的步高与踏宽，遵循的正是同一套节拍耦合。",
      source: "原典出处：François Blondel, Cours d'architecture (Paris, 1675–1683), Cinquième partie, Livre III, Chap. XIV, pp. 692–693.",
      svg: `<svg viewBox="0 0 280 170"><rect width="280" height="170" fill="#EDF6FB"/>
        <path d="M24 144 H84 V112 H144 V80 H204 V48 H258" fill="none" stroke="#1B3951" stroke-width="2.5"/>
        <path d="M84 144 V112 M144 112 V80 M204 80 V48" stroke="#D55425" stroke-width="2.5"/>
        <line x1="84" y1="112" x2="144" y2="112" stroke="#2A1206" stroke-width="3"/>
        <text x="66" y="132" font-size="13" font-weight="800" fill="#A9360E">h</text>
        <text x="110" y="104" font-size="13" font-weight="800" fill="#2A1206">g</text>
        <text x="24" y="28" font-size="13" font-weight="700" fill="#1B3951">2h + g = 24 pouces ≈ 65 cm</text>
      </svg>`,
    },
    {
      kicker: "1923 · GESTALT GOOD CONTINUATION",
      title: "韦特海默：均匀错开的块会被大脑缝成一条线",
      body: "格式塔心理学创始人马克斯·韦特海默（Max Wertheimer, 1923）在经典论文中提出「良好连续律」与「邻近律」：即便阶梯上的四张卡片彼此分离，只要步高相等、间距紧扣，大脑就会自动脑补出一条贯穿它们的斜向路径；一旦步宽扯太开或中段折返，连续律立即失效。",
      source: "原典出处：Max Wertheimer (1923), Untersuchungen zur Lehre von der Gestalt. II, Psychologische Forschung, Vol. 4, pp. 301–350.",
      svg: `<svg viewBox="0 0 280 170"><rect width="280" height="170" fill="#EDF6FB"/>
        <line x1="26" y1="142" x2="254" y2="32" stroke="#1B3951" stroke-width="1.6" stroke-dasharray="5 5"/>
        <rect x="34" y="116" width="40" height="28" fill="#DD5F2D"/><rect x="92" y="88" width="40" height="28" fill="#DD5F2D"/>
        <rect x="150" y="60" width="40" height="28" fill="#DD5F2D"/><rect x="208" y="32" width="40" height="28" fill="#1B3951"/>
        <text x="24" y="24" font-size="12" font-weight="700" fill="#2A1206">离散阶块 → 连续斜向势能</text>
      </svg>`,
    },
    {
      kicker: "1928–1954 · DIAGONAL DIRECTIONAL TENSION",
      title: "沃尔夫林与阿恩海姆：左下→右上为何自带攀升感",
      body: "沃尔夫林（1928）发现绘画翻转后左右情绪迥异；加夫龙（1950）提出「扫视曲线」，阿恩海姆（1954/1974）则系统阐明：左起阅读者的目光自然从左下进入、朝右上攀升，于是顺着这条对角线排出的阶梯天然带有前进、克服阻力与走向高潮的张力。",
      source: "原典出处：Heinrich Wölfflin (1928/1941); Mercedes Gaffron (1950), The Art Quarterly 13, pp. 312–331; Rudolf Arnheim (1954/1974), Art and Visual Perception.",
      svg: `<svg viewBox="0 0 280 170"><rect width="280" height="170" fill="#EDF6FB"/>
        <path d="M26 144 Q 112 110 246 34" fill="none" stroke="#D55425" stroke-width="2.8"/>
        <polygon points="250,32 236,33 243,44" fill="#D55425"/>
        <path d="M26 36 Q 112 72 246 140" fill="none" stroke="#1B3951" stroke-width="1.6" stroke-dasharray="4 4"/>
        <text x="26" y="158" font-size="11.5" font-weight="700" fill="#A9360E">左下 → 右上 · 攀升</text>
        <text x="26" y="24" font-size="11.5" font-weight="600" fill="#384E60">左上 → 右下 · 下沉</text>
      </svg>`,
    },
    {
      kicker: "1972 & 1993 · GRADATION IN 2D DESIGN",
      title: "王无邪：把位置、大小与形态做成有序「渐变」",
      body: "设计教育家王无邪（Wucius Wong）在《平面设计原理》（1972）与合编版《形态与设计原理》（1993）中，把「渐变（Gradation）」归为独立构成原则：元素按确定步幅逐级改变位置、尺寸或形态，就能制造出直奔视觉高潮的进程感——058 原海报的阶升与 ●▲■★ 变形正是教科书范例。",
      source: "原典出处：Wucius Wong, Principles of Two-Dimensional Design (Van Nostrand Reinhold, 1972); Principles of Form and Design (1993).",
      svg: `<svg viewBox="0 0 280 170"><rect width="280" height="170" fill="#EDF6FB"/>
        <circle cx="46" cy="128" r="14" fill="#1B3951"/>
        <polygon points="108,88 92,116 124,116" fill="#1B3951"/>
        <rect x="156" y="64" width="26" height="26" fill="#1B3951"/>
        <polygon points="232,26 237,40 252,40 240,49 244,63 232,54 220,63 224,49 212,40 227,40" fill="#D55425"/>
        <text x="24" y="26" font-size="12" font-weight="700" fill="#2A1206">位置渐变 × 形态渐变 = 双重层级</text>
      </svg>`,
    },
  ];

  const pins = [...document.querySelectorAll(".era-pin")];
  const diag = document.getElementById("era-diagram");
  const kicker = document.getElementById("era-kicker");
  const title = document.getElementById("era-title");
  const body = document.getElementById("era-body");
  const source = document.getElementById("era-source");

  function show(idx) {
    const e = ERAS[idx];
    pins.forEach((p, i) => {
      p.classList.toggle("is-active", i === idx);
      p.setAttribute("aria-selected", String(i === idx));
    });
    diag.innerHTML = e.svg;
    kicker.textContent = e.kicker;
    title.textContent = e.title;
    body.textContent = e.body;
    source.textContent = e.source;
  }

  pins.forEach((p, i) => p.addEventListener("click", () => show(i)));
  show(0);
}

// ==================== 04 节：3/4/5/7 级真实踏面压测台 ====================
function initSec04() {
  const SAMPLE_STEPS = [
    { no: "01", title: "需求梳理", desc: "先访谈核心用户，定清本轮要解决的头号痛点。" },
    { no: "02", title: "方案草图", desc: "用低保真线框验证信息主次与浏览动线。" },
    { no: "03", title: "交互原型", desc: "补齐关键状态反馈，邀请真实用户试走一遍。" },
    { no: "04", title: "视觉定稿", desc: "统一色彩层级、字体节奏与图形语言规范。" },
    { no: "05", title: "开发联调", desc: "逐屏核对动效帧率、窄屏适配与键盘操作。" },
    { no: "06", title: "灰度验错", desc: "放小流量收集真实指标，排查边界异常。" },
    { no: "07", title: "全量发布", desc: "正式上线并复盘转化路径与留存数据。" },
  ];

  const btns = [...document.querySelectorAll("#s4-counts [data-count]")];
  const bench = document.getElementById("s4-bench");
  const stepsHost = document.getElementById("s4-steps");
  const roBox = document.getElementById("s4-readout");
  const roTier = document.getElementById("s4-ro-tier");
  const roNums = document.getElementById("s4-ro-nums");
  const roText = document.getElementById("s4-ro-text");
  const rulePill = document.getElementById("s4-rule-pill");

  let currentCount = 4;

  function render(n) {
    currentCount = n;
    bench.dataset.count = String(n);
    btns.forEach((b) => b.classList.toggle("is-active", Number(b.dataset.count) === n));

    const isNarrow = window.innerWidth <= 680;
    const lift = isNarrow
      ? n === 3 ? 28 : n === 4 ? 22 : n === 5 ? 16 : 10
      : n === 3 ? 52 : n === 4 ? 42 : n === 5 ? 30 : 18;
    stepsHost.style.setProperty("--n", String(n));
    stepsHost.style.setProperty("--step-lift", `${lift}px`);

    const items = SAMPLE_STEPS.slice(0, n);
    stepsHost.innerHTML = items
      .map(
        (it, i) => `
        <article class="s4-card" style="--step-i:${i}">
          <div class="s4-tread" aria-hidden="true"></div>
          <div class="s4-body">
            <span class="s4-riser" lang="en">${it.no}</span>
            <div class="s4-face">
              <h3>${it.title}</h3>
              <p>${it.desc}</p>
            </div>
          </div>
        </article>`
      )
      .join("");

    // 直接从 DOM 实测第一张正面卡片宽度与可排字数，传入 evaluateStepCount 确保读数与说明单一来源完全一致
    const firstFace = stepsHost.querySelector(".s4-face");
    const realFaceW = firstFace ? Math.round(firstFace.getBoundingClientRect().width) : 180;
    const fontPx = isNarrow ? (n === 7 ? 10 : 10.5) : n === 7 ? 11.5 : 12.5;
    const padPx = isNarrow ? 6 : 18;
    const realChars = Math.max(1, Math.floor((realFaceW - padPx) / fontPx));
    const ev = evaluateStepCount(n, realFaceW, realChars);

    rulePill.textContent = `${ev.idealLabel} · 同宽画幅真实排字`;
    roBox.dataset.status = ev.status;
    roTier.textContent = ev.tier;
    roNums.textContent = `${n} 级 · 实测单面宽 ${ev.faceWidthPx}px · 每行约 ${ev.charsPerLine} 字`;
    roText.textContent = ev.summary;
  }

  btns.forEach((b) => b.addEventListener("click", () => render(Number(b.dataset.count))));
  new ResizeObserver(() => render(currentCount)).observe(bench);
  render(4);
}

// ==================== 05 节：三场景微界面 + 平排↔阶梯翻版 ====================
function initSec05() {
  const SCENES = {
    growth: {
      kicker: "GROWTH PATH · 成长过程",
      title: "新手插画师一年进阶",
      sub: "左上三角天然托住标题与引言，视线顺势落到右下第一级台阶。",
      brTag: "右下三角收口 · 目标达成",
      brText: "年度目标：完成 12 套商业风格样张并建立个人作品集。",
      cards: [
        { no: "01", title: "第一季 · 临摹造型", body: "每天拆解一张经典海报的几何骨架与留白。" },
        { no: "02", title: "第二季 · 色彩定调", body: "建立三到四色受控色板，学会主辅对比。" },
        { no: "03", title: "第三季 · 专题成组", body: "用同一套视觉语言连续画完四张系列稿。" },
        { no: "04", title: "第四季 · 商业落地", body: "接手完整主题委托，交付印刷与屏幕多规格。" },
      ],
      capStair: "阶梯态：同样四段话，错开高低后一眼看出从第一季起步到第四季落地的攀升势能，左上标题与右下收口各占一块三角负空间。",
      capFlat: "平排态：四张卡片落回同一水平线，进阶级差瞬间消失，读者得从头到尾逐字读完才能意识到这是先后递进。",
    },
    timeline: {
      kicker: "MILESTONE TIMELINE · 里程碑时间线",
      title: "旧书店改造四年记",
      sub: "用四级抬升呈现空间从筹备到成为社区地标的演进脉络。",
      brTag: "右下三角收口 · 阶段成果",
      brText: "累计举办 86 场作者夜读，成为街区夜间文化坐标。",
      cards: [
        { no: "01", title: "2021 · 盘下老屋", body: "保留红砖拱券与木梁，清出 90 平临街开间。" },
        { no: "02", title: "2022 · 专题选书", body: "只留建筑、版式与城市史三个精编书架。" },
        { no: "03", title: "2023 · 开放印坊", body: "添置小型孔版印刷机，周末开设手工书工作坊。" },
        { no: "04", title: "2024 · 社区书展", body: "联动周边 14 家独立铺面办起年度街道书市。" },
      ],
      capStair: "阶梯态：年份不再只是冷冰冰的横排流水账，每一年的积累在视觉上垫高下一年的高度。",
      capFlat: "平排态：四年经历被拉成四块等权简介，少了由小到大层层积淀的纵深感。",
    },
    launch: {
      kicker: "PROCESS FLOW · 发布会步骤说明",
      title: "春季新品四步亮相",
      sub: "把原本冗长的议程压缩成四级斜梯，让压轴发布稳坐最高落点。",
      brTag: "右下三角收口 · 行动指引",
      brText: "现场体验区于 16:30 同步开放，凭预约码入场。",
      cards: [
        { no: "01", title: "14:00 · 痛点开场", body: "三分钟还原通勤场景，引出轻量化命题。" },
        { no: "02", title: "14:20 · 结构拆解", body: "现场拆开机身中框，展示减重 18% 的内部工艺。" },
        { no: "03", title: "14:50 · 实测对照", body: "暗光与连续续航双盲跑分，公开原始数据。" },
        { no: "04", title: "15:20 · 压轴发售", body: "揭晓定价与配色阵容，开启首批现场体验。" },
      ],
      capStair: "阶梯态：四个环节层层推向 15:20 的压轴发售，右下行动指引正好填满台阶下方的三角留白。",
      capFlat: "平排态：四个时间段视觉权重完全一样，压轴发售混在普通议程里不够跳脱。",
    },
  };

  let sceneKey = "growth";
  let isStair = true;

  const sceneBtns = [...document.querySelectorAll("#s5-scenes [data-scene]")];
  const modeBtn = document.getElementById("s5-mode-btn");
  const frame = document.getElementById("s5-frame");
  const kicker = document.getElementById("s5-kicker");
  const title = document.getElementById("s5-scene-title");
  const sub = document.getElementById("s5-scene-sub");
  const cardsEl = document.getElementById("s5-cards");
  const brTag = document.getElementById("s5-br-tag");
  const brText = document.getElementById("s5-br-text");
  const caption = document.getElementById("s5-caption");

  function render() {
    const s = SCENES[sceneKey];
    sceneBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.scene === sceneKey));
    frame.classList.toggle("is-stair", isStair);
    modeBtn.setAttribute("aria-pressed", String(isStair));
    modeBtn.textContent = isStair
      ? "当前：阶梯构图 · 点此切平排对比"
      : "当前：平排网格 · 点此还原阶梯";

    kicker.textContent = s.kicker;
    title.textContent = s.title;
    sub.textContent = s.sub;
    brTag.textContent = s.brTag;
    brText.textContent = s.brText;
    caption.textContent = isStair ? s.capStair : s.capFlat;

    cardsEl.innerHTML = s.cards
      .map(
        (c, i) => `
        <li class="s5-card" data-i="${i}">
          <span class="s5-c-no" lang="en">${c.no}</span>
          <h4>${c.title}</h4>
          <p>${c.body}</p>
        </li>`
      )
      .join("");
  }

  sceneBtns.forEach((b) =>
    b.addEventListener("click", () => {
      sceneKey = b.dataset.scene;
      render();
    })
  );
  modeBtn.addEventListener("click", () => {
    isStair = !isStair;
    render();
  });

  render();
}

// ==================== 06 节：排雷手风琴卡片 ====================
function initSec06() {
  const toggles = [...document.querySelectorAll(".pitfall-toggle")];
  toggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      const body = document.getElementById(btn.getAttribute("aria-controls"));
      btn.setAttribute("aria-expanded", String(!expanded));
      btn.querySelector(".pf-state").textContent = expanded ? "+" : "−";
      if (body) body.hidden = expanded;
    });
  });
}

// ==================== 07 节：几何完全锁死的题材判断小练习 ====================
function initSec07() {
  // 同一套等差阶梯几何，经 model.js 统一引擎校验
  const lockedEval = evaluateStair(QUIZ_LOCKED_STATE);

  const OPTIONS = {
    A: {
      topic: "产品上线",
      steps: ["需求调研", "原型验证", "灰测打磨", "正式发布"],
      ok: false,
      reason: "A 适合上阶梯：调研 → 原型 → 灰测 → 发布是严格的前后工序，后一步依赖前一步，用阶梯正好把单向推进画明白。",
    },
    B: {
      topic: "会员体系",
      steps: ["体验用户", "银卡会员", "金卡会员", "黑钻会员"],
      ok: false,
      reason: "B 适合上阶梯：四个会员等级权益逐级抬升，最高级黑钻稳落右上高点，内容自带明确高低层级。",
    },
    C: {
      topic: "品牌门店",
      steps: ["上海静安", "成都太古", "深圳万象", "杭州湖滨"],
      ok: true,
      reason: "选对了！C 不该用阶梯构图：四座城市的直营门店地位完全平权，既没有先后游览顺序，也不存在高低等级。硬摆成阶梯还标上 01–04，会误导读者以为杭州店比上海店高级；这类平权并列项应改用等权网格（见第 06 节 057 棋盘构图）。",
    },
    D: {
      topic: "阅读精进",
      steps: ["快速通读", "拆解框架", "旁批质疑", "复述输出"],
      ok: false,
      reason: "D 适合上阶梯：从通读到拆解、批注再到复述输出，是由浅入深的递进学习阶梯，天然契合进程感。",
    },
  };

  function buildLockedStairSVG(topicTitle, labels) {
    // 严格复用 QUIZ_LOCKED_STATE.heights = [10, 32, 54, 76] 绘制四张几何完全相同的 SVG
    const h = QUIZ_LOCKED_STATE.heights;
    const W = 280;
    const H = 192;
    const bw = 60;
    const stepDx = 58; // 96% 步宽
    const startX = 18;
    const baseY = 176;
    const cardH = 44;
    const maxLift = 116;

    const blocks = h
      .map((hv, i) => {
        const x = startX + i * stepDx;
        const topY = baseY - cardH - (hv / 100) * maxLift;
        const no = POSTER_STEPS[i].no;
        const lbl = labels[i];
        const l1 = lbl.slice(0, 2);
        const l2 = lbl.slice(2, 4);
        return `
          <polygon points="${x},${topY} ${x + 7},${topY - 7} ${x + bw + 7},${topY - 7} ${x + bw},${topY}" fill="#F3A87A"/>
          <rect x="${x}" y="${topY}" width="18" height="${cardH}" fill="#DD5F2D"/>
          <rect x="${x + 18}" y="${topY}" width="${bw - 18}" height="${cardH}" fill="#FBF2E5" stroke="rgba(27,57,81,0.24)" stroke-width="0.8"/>
          <text x="${x + 9}" y="${topY + 17}" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="11" fill="#2A1206">${no}</text>
          <text x="${x + 39}" y="${topY + 18}" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-weight="700" font-size="11.5" fill="#2A1206">${l1}</text>
          <text x="${x + 39}" y="${topY + 34}" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-weight="700" font-size="11.5" fill="#2A1206">${l2}</text>
        `;
      })
      .join("");

    return `<svg viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" fill="#E3F1F8"/>
      <polygon points="36,${baseY} ${W},66 ${W},${baseY}" fill="#BED4E3" opacity="0.65"/>
      <text x="16" y="28" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="15" fill="#2A1206">${topicTitle}</text>
      <rect x="16" y="34" width="20" height="2.5" fill="#DD5F2D"/>
      <line x1="12" y1="${baseY}" x2="${W - 12}" y2="${baseY}" stroke="#1B3951" stroke-opacity="0.25" stroke-dasharray="3 3"/>
      ${blocks}
    </svg>`;
  }

  // 渲染四张几何完全锁死的卡片
  for (const key of ["A", "B", "C", "D"]) {
    const slot = document.querySelector(`[data-quiz-svg="${key}"]`);
    if (slot) slot.innerHTML = buildLockedStairSVG(OPTIONS[key].topic, OPTIONS[key].steps);
  }

  const cards = [...document.querySelectorAll("#quiz-grid .quiz-card")];
  const verdict = document.getElementById("quiz-verdict");
  const qvTitle = document.getElementById("qv-title");
  const qvBody = document.getElementById("qv-body");
  const qvModel = document.getElementById("qv-model");

  function pick(choice) {
    const opt = OPTIONS[choice];
    if (!opt) return;
    cards.forEach((c) => {
      const k = c.dataset.choice;
      c.setAttribute("aria-pressed", String(k === choice));
      c.classList.toggle("is-picked", k === choice);
      c.classList.toggle("is-right", k === "C");
      c.classList.toggle("is-wrong", k === choice && k !== "C");
    });

    verdict.dataset.state = opt.ok ? "right" : "wrong";
    qvTitle.textContent = opt.ok
      ? `判断准确：C（品牌门店）不该上阶梯`
      : `再想一步：你选了 ${choice}（${opt.topic}），它其实适合阶梯`;
    qvBody.textContent = opt.ok
      ? opt.reason
      : `${opt.reason} 真正不该上阶梯的是 C（上海静安 / 成都太古 / 深圳万象 / 杭州湖滨四个平权城市门店）——硬摆阶梯会制造虚假高低等级。`;
    qvModel.hidden = false;
    qvModel.textContent = `model.js 统一几何校验（四图完全相同）：${lockedEval.tier} · 步高 Δ ${lockedEval.deltas.map(fmtDelta).join(" / ")} 格 · 步宽 ${lockedEval.runRatio}%（经验 ${STEP_RULES.runMin}–${STEP_RULES.runMax}%）· 坡角 ${lockedEval.slopeDeg}°（经验 ${STEP_RULES.slopeMin}–${STEP_RULES.slopeMax}°）——几何满分，但题材错配照样失效。`;
  }

  cards.forEach((c) => c.addEventListener("click", () => pick(c.dataset.choice)));

  // 键盘 1–4 快捷作答（聚焦在练习区域或普通浏览时可用，不干扰输入框）
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) return;
    const map = { "1": "A", "2": "B", "3": "C", "4": "D" };
    if (map[e.key]) {
      const sec7 = document.getElementById("sec-07");
      const r = sec7.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        pick(map[e.key]);
      }
    }
  });
}

// ==================== 08 节：原海报灯箱 ====================
function initPosterLightbox() {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const lb = document.getElementById("lightbox");
  const lbStage = document.getElementById("lb-stage");
  const lbImg = document.getElementById("lb-img");
  const lbZoom = document.getElementById("lb-zoom");
  const btnIn = document.getElementById("lb-in");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let panId = null;
  let px0 = 0;
  let py0 = 0;
  let ox = 0;
  let oy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    lbZoom.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    // 复用页面内唯一内联 poster src，避免重复打包
    if (!lbImg.src) lbImg.src = posterImg.currentSrc || posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    btnClose.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  btnOut.addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    applyTransform();
  });
  btnReset.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbStage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.18 : -0.18;
      scale = Math.max(0.75, Math.min(3, +(scale + delta).toFixed(2)));
      applyTransform();
    },
    { passive: false }
  );

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage && scale <= 1.05) {
      close();
      return;
    }
    panId = e.pointerId;
    px0 = e.clientX;
    py0 = e.clientY;
    ox = tx;
    oy = ty;
    lbStage.classList.add("is-panning");
    lbStage.setPointerCapture(e.pointerId);
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (panId !== e.pointerId) return;
    tx = ox + (e.clientX - px0);
    ty = oy + (e.clientY - py0);
    applyTransform();
  });
  const endPan = (e) => {
    if (panId !== e.pointerId) return;
    panId = null;
    lbStage.classList.remove("is-panning");
  };
  lbStage.addEventListener("pointerup", endPan);
  lbStage.addEventListener("pointercancel", endPan);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

// ==================== 启动 ====================
initHero();
initSec01();
initSec02();
initSec03();
initSec04();
initSec05();
initSec06();
initSec07();
initPosterLightbox();

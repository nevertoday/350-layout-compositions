import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  BALANCE_PRESETS,
  COLORS,
  POSTER_STROKE_DECOR,
  QUIZ_ITEMS,
  STAGE_ASPECT,
  buildControlledScatter,
  buildMistakeItems,
  buildNoiseComparison,
  buildPosterItems,
  computeOpticalCG,
  cycleTier,
  distNorm,
  evaluateComposition,
  tierRadius,
} from "./model.js";

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

const COLOR_HEX = {
  teal: COLORS.teal,
  orange: COLORS.orange,
  ink: COLORS.ink,
};

// ============================================================
// 一、开场主角玩具：活体随机散布编排台
// ============================================================
const heroCanvas = $("#hero-canvas");
const heroCtx = heroCanvas.getContext("2d");

const state = {
  scene: "poster",        // poster | jazz | exhibit
  scaleMode: "uniform",   // uniform | dual | single | giant
  spreadMode: "grid",     // grid | whitenoise | bluenoise | clusters
  colorMode: "mono",      // mono | triad | rightheavy
  seed: 114,
  overlay: false,
  isPosterExact: false,
  items: buildMistakeItems(),
  targets: null,          // 平滑过渡目标
  selectedId: 1,
  draggingId: null,
  brush: { active: false, u: 0.5, v: 0.5, vx: 0, vy: 0, alpha: 0 },
  introT: 0,
  dirty: true,
  lastUiSync: 0,
  lastUiKey: "",
};

// 初始化时将每个元素的渲染坐标克隆并支持平滑插值
function setTargetItems(nextItems, { immediate = false } = {}) {
  const prevById = new Map(state.items.map((it) => [it.id, it]));
  state.items = nextItems.map((it, idx) => {
    const old = prevById.get(it.id) || state.items[idx % state.items.length];
    return {
      ...it,
      // 渲染位置从旧位置柔和过渡到目标位置，减少动态效果下直接到位
      u: immediate || reducedMotion.matches || !old ? it.u : old.u,
      v: immediate || reducedMotion.matches || !old ? it.v : old.v,
      r: immediate || reducedMotion.matches || !old ? it.r : old.r,
      tu: it.u,
      tv: it.v,
      tr: it.r,
      vx: 0,
      vy: 0,
    };
  });
  state.targets = !immediate && !reducedMotion.matches;
  state.dirty = true;
}

// 启动时直接处于 0/4 经典翻车错态（16 枚等大墨黑圆锁死左偏网格）
setTargetItems(buildMistakeItems(), { immediate: true });

function applyControlState() {
  state.isPosterExact = false;
  if (state.scaleMode === "uniform" && state.spreadMode === "grid" && state.colorMode === "mono") {
    setTargetItems(buildMistakeItems());
  } else {
    setTargetItems(buildControlledScatter({
      scaleMode: state.scaleMode,
      spreadMode: state.spreadMode,
      colorMode: state.colorMode,
      seed: state.seed,
    }));
  }
  syncControlButtons();
  syncDiagnosis(true);
}

function loadPosterSolution() {
  state.isPosterExact = true;
  state.scaleMode = "dual";
  state.spreadMode = "bluenoise";
  state.colorMode = "triad";
  setTargetItems(buildPosterItems());
  syncControlButtons();
  syncDiagnosis(true);
}

function resetMistake() {
  state.isPosterExact = false;
  state.scaleMode = "uniform";
  state.spreadMode = "grid";
  state.colorMode = "mono";
  state.seed = 114;
  setTargetItems(buildMistakeItems());
  syncControlButtons();
  syncDiagnosis(true);
}

// 同步控参按钮激活态（视觉诚实标出当前所选是错态档还是正常档）
const BAD_VALS = new Set(["uniform", "giant", "grid", "whitenoise", "mono", "rightheavy"]);
function syncControlButtons() {
  $$(".chip[data-ctrl]").forEach((btn) => {
    const k = btn.dataset.ctrl;
    const v = btn.dataset.val;
    const cur = k === "scale" ? state.scaleMode : k === "spread" ? state.spreadMode : state.colorMode;
    const active = cur === v;
    btn.setAttribute("aria-pressed", String(active));
    btn.classList.toggle("is-on", active && !BAD_VALS.has(v));
    btn.classList.toggle("is-bad", active && BAD_VALS.has(v));
  });
  $("#btn-sparse")?.setAttribute("aria-pressed", String(state.scaleMode === "single" && state.spreadMode === "bluenoise"));
  $("#btn-dense")?.setAttribute("aria-pressed", String(state.spreadMode === "clusters"));
}

// 获取当前用于单真源评估的逻辑几何（过渡中直接读目标态，避免切预设瞬间闪烁旧错态）
function evalItems() {
  return state.items.map((it) => ({
    ...it,
    u: state.targets ? it.tu : it.u,
    v: state.targets ? it.tv : it.v,
    r: state.targets ? it.tr : it.r,
  }));
}

function syncDiagnosis(force = false) {
  const now = performance.now();
  if (!force && now - state.lastUiSync < 65) return;
  const ev = evaluateComposition(evalItems());
  const key = `${ev.passedCount}|${ev.primaryFailure?.code || "ok"}|${ev.metrics.sizeRatio}|${ev.metrics.nndCV}|${ev.metrics.freePct}|${ev.metrics.cgOffsetPct}`;
  if (!force && key === state.lastUiKey) return;
  state.lastUiSync = now;
  state.lastUiKey = key;

  const okAll = ev.passedCount === 4;
  const topPill = $("#top-status");
  topPill.textContent = `${ev.passedCount} / 4 ${ev.summaryMood}`;
  topPill.classList.toggle("is-ok", okAll);
  topPill.classList.toggle("is-warn", !okAll);

  // 自示范大标：达标 3 项及以上时文字解锁跳动基线
  $("#title").classList.toggle("is-rhythmic", ev.passedCount >= 3);

  // 左列斜杠实况条
  const slashMap = {
    position: { el: $("#sl-pos"), chk: ev.checks.position },
    balance: { el: $("#sl-bal"), chk: ev.checks.balance },
    interval: { el: $("#sl-int"), chk: ev.checks.interval },
    size: { el: $("#sl-siz"), chk: ev.checks.size },
  };
  for (const [k, { el, chk }] of Object.entries(slashMap)) {
    el.textContent = chk.badge;
    el.closest("li").classList.toggle("is-ok", chk.ok);
  }

  // 底带左：原海报四列关键要点
  for (const k of ["size", "interval", "position", "balance"]) {
    const col = $(`.tk-col[data-check="${k}"]`);
    const chk = ev.checks[k];
    col.classList.toggle("is-ok", chk.ok);
    col.classList.toggle("is-warn", !chk.ok);
    $(`#tk-${k}`).textContent = chk.badge;
  }

  // 底带右：原海报虚线六角星实测诊单盒
  const box = $("#diag-box");
  box.classList.toggle("is-ok", okAll);
  box.classList.toggle("is-warn", !okAll);
  $("#diag-score").textContent = `${ev.passedCount} / 4`;

  if (okAll) {
    $("#diag-tag").textContent = "达标 · 随机节奏成立";
    $("#diag-title").textContent = "在看似自由的错落里，重心、疏密与呼吸距已经合拍";
    $("#diag-why").textContent = "原海报教学提示：「先设定视觉重心，再让元素自由散布；控制疏密与对比，节奏自然浮现。」";
    $("#diag-hint").textContent = "点「再撒一次」看另一组合法解，或点「白噪 / 偏右 / 巨块」验证边界。";
  } else {
    const f = ev.primaryFailure;
    $("#diag-tag").textContent = f.tag;
    $("#diag-title").textContent = f.headline;
    $("#diag-why").textContent = f.why;
    $("#diag-hint").textContent = f.hint;
  }

  $("#m-ratio").textContent = `${ev.metrics.sizeRatio.toFixed(1)}×`;
  $("#m-cv").textContent = ev.metrics.nndCV.toFixed(2);
  $("#m-free").textContent = `${ev.metrics.freePct}%`;
  $("#m-cg").textContent = `${ev.metrics.cgOffsetPct}%`;
}

// 画布尺寸适配（保证圆永远是正圆，手机 DPR 上限 1.5 保障慢手机流畅）
function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = pixelRatio(window.innerWidth < 700 ? 1.5 : 2);
  const w = Math.max(1, Math.round(rect.width * dpr));
  const h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    return true;
  }
  return false;
}

// 辅助：画原海报同款斜线、十字记号、5×5 点阵与斜向点群
function drawPosterDecor(ctx, W, H, minDim, alpha) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (const d of POSTER_STROKE_DECOR) {
    const x = d.u * W;
    const y = d.v * H;
    ctx.strokeStyle = COLOR_HEX[d.color] || COLORS.ink;
    ctx.fillStyle = COLOR_HEX[d.color] || COLORS.ink;
    if (d.kind === "line") {
      const half = (d.len * minDim) / 2;
      ctx.lineWidth = Math.max(1.5, d.w * (minDim / 480));
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(d.angle) * half, y - Math.sin(d.angle) * half);
      ctx.lineTo(x + Math.cos(d.angle) * half, y + Math.sin(d.angle) * half);
      ctx.stroke();
    } else if (d.kind === "plus") {
      const s = d.size * minDim * 0.5;
      ctx.lineWidth = Math.max(1.5, 1.8 * (minDim / 480));
      ctx.beginPath();
      ctx.moveTo(x - s, y); ctx.lineTo(x + s, y);
      ctx.moveTo(x, y - s); ctx.lineTo(x, y + s);
      ctx.stroke();
    } else if (d.kind === "dotgrid") {
      const step = d.step * minDim;
      const rad = Math.max(1.5, minDim * 0.0046);
      const sx = x - ((d.cols - 1) * step) / 2;
      const sy = y - ((d.rows - 1) * step) / 2;
      for (let r = 0; r < d.rows; r++) {
        for (let c = 0; c < d.cols; c++) {
          ctx.beginPath();
          ctx.arc(sx + c * step, sy + r * step, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (d.kind === "dotcloud") {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(d.angle);
      const rad = Math.max(1.3, minDim * 0.0038);
      const pts = [
        [-22, -4], [-14, -10], [-6, -2], [4, -11], [14, -4], [24, -7], [32, -1],
        [-19, 6], [-9, 4], [1, 7], [11, 2], [20, 7], [29, 8], [38, 4],
        [-11, 14], [-1, 15], [9, 13], [19, 16], [28, 15], [-26, 2],
      ];
      const sc = minDim / 480;
      for (const [px, py] of pts) {
        ctx.beginPath();
        ctx.arc(px * sc, py * sc, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawHeroFrame(t, dt, { still }) {
  const resized = resizeCanvas(heroCanvas);
  const W = heroCanvas.width;
  const H = heroCanvas.height;
  const minDim = Math.min(W, H);

  // 更新平滑插值与轻弹力物理
  let moving = false;
  if (state.targets) {
    const k = still ? 1 : clamp(dt * 11, 0.14, 1);
    let maxDiff = 0;
    for (const it of state.items) {
      it.u += (it.tu - it.u) * k;
      it.v += (it.tv - it.v) * k;
      it.r += (it.tr - it.r) * k;
      maxDiff = Math.max(maxDiff, Math.abs(it.tu - it.u), Math.abs(it.tv - it.v), Math.abs(it.tr - it.r));
    }
    if (maxDiff < 0.0008 || still) {
      for (const it of state.items) { it.u = it.tu; it.v = it.tv; it.r = it.tr; }
      state.targets = false;
    } else {
      moving = true;
    }
  }

  // 物理拨散余韵阻尼
  const damp = Math.pow(0.06, Math.max(dt, 0.016));
  for (const it of state.items) {
    if (Math.abs(it.vx) + Math.abs(it.vy) > 0.00025) {
      it.u = clamp(it.u + it.vx * Math.max(dt, 0.016), 0.07 + it.r * 0.55, 0.93 - it.r * 0.55);
      it.v = clamp(it.v + it.vy * Math.max(dt, 0.016), 0.08 + it.r * 0.55, 0.92 - it.r * 0.55);
      it.tu = it.u;
      it.tv = it.v;
      it.vx *= damp;
      it.vy *= damp;
      moving = true;
    } else {
      it.vx = 0;
      it.vy = 0;
    }
  }

  if (state.brush.active) {
    state.brush.alpha = Math.min(1, state.brush.alpha + 0.25);
    moving = true;
  } else if (state.brush.alpha > 0.01) {
    state.brush.alpha *= 0.84;
    moving = true;
  }

  if (!still && state.introT < 1) {
    state.introT = Math.min(1, state.introT + Math.max(dt, 0.016) * 1.4);
    moving = true;
  } else if (still) {
    state.introT = 1;
  }

  if (!resized && !state.dirty && !moving) return;
  state.dirty = false;

  const ev = evaluateComposition(state.items);
  if (moving) syncDiagnosis(false);

  const ctx = heroCtx;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, W, H);

  // 题材背景暗线
  if (state.scene === "jazz") {
    ctx.save();
    ctx.strokeStyle = "rgba(9, 17, 14, 0.13)";
    ctx.lineWidth = Math.max(1, minDim * 0.0022);
    for (let s = 0; s < 5; s++) {
      const y = H * (0.28 + s * 0.105);
      ctx.beginPath();
      ctx.moveTo(W * 0.05, y);
      ctx.lineTo(W * 0.95, y);
      ctx.stroke();
    }
    ctx.restore();
  } else if (state.scene === "exhibit") {
    ctx.save();
    ctx.strokeStyle = "rgba(6, 136, 122, 0.14)";
    ctx.lineWidth = Math.max(1, minDim * 0.0022);
    ctx.strokeRect(W * 0.05, H * 0.06, W * 0.90, H * 0.88);
    ctx.restore();
  }

  // 若处于行列锁死错态，直接标出令人一眼认出的「死板隐形网格红虚线」
  if (ev.checks.position.code === "grid_locked") {
    ctx.save();
    ctx.strokeStyle = "rgba(184, 53, 11, 0.34)";
    ctx.setLineDash([minDim * 0.012, minDim * 0.012]);
    ctx.lineWidth = Math.max(1.2, minDim * 0.0025);
    const xs = [...new Set(state.items.map((it) => Math.round(it.u * 25) / 25))];
    const ys = [...new Set(state.items.map((it) => Math.round(it.v * 25) / 25))];
    for (const ux of xs) {
      ctx.beginPath(); ctx.moveTo(ux * W, H * 0.09); ctx.lineTo(ux * W, H * 0.91); ctx.stroke();
    }
    for (const vy of ys) {
      ctx.beginPath(); ctx.moveTo(W * 0.06, vy * H); ctx.lineTo(W * 0.94, vy * H); ctx.stroke();
    }
    // 标注右侧大片死白
    if (ev.cg.x < 0.42) {
      ctx.fillStyle = "rgba(184, 53, 11, 0.07)";
      ctx.fillRect(W * 0.64, H * 0.12, W * 0.30, H * 0.76);
      ctx.fillStyle = COLORS.orangeText;
      ctx.font = `700 ${Math.round(minDim * 0.032)}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("右半空置失衡", W * 0.79, H * 0.48);
      ctx.font = `600 ${Math.round(minDim * 0.024)}px "Noto Sans SC", sans-serif`;
      ctx.fillText("横拖此处拨散行列", W * 0.79, H * 0.55);
    }
    ctx.restore();
  }

  // 透视层：4×3 疏密热区 + 光学重心力臂
  if (state.overlay) {
    ctx.save();
    const cw = W / 4;
    const ch = H / 3;
    for (let gy = 0; gy < 3; gy++) {
      for (let gx = 0; gx < 4; gx++) {
        const val = ev.densityGrid[gy * 4 + gx];
        if (val >= 2.4) ctx.fillStyle = "rgba(237, 82, 29, 0.11)";
        else if (val <= 1.0) ctx.fillStyle = "rgba(6, 136, 122, 0.09)";
        else ctx.fillStyle = "transparent";
        ctx.fillRect(gx * cw, gy * ch, cw, ch);
        ctx.strokeStyle = "rgba(9, 17, 14, 0.10)";
        ctx.lineWidth = 1;
        ctx.strokeRect(gx * cw, gy * ch, cw, ch);
      }
    }
    ctx.restore();
  }

  // 原海报标志性笔触点阵装饰（在破序后自然浮现，网格错态下收起以凸显呆板）
  const decorAlpha = state.scene === "poster" && ev.metrics.gridLockPct < 65
    ? clamp((65 - ev.metrics.gridLockPct) / 45, 0, 1) * state.introT
    : 0;
  drawPosterDecor(ctx, W, H, minDim, decorAlpha);

  // 爵士题材连音弧线
  if (state.scene === "jazz") {
    ctx.save();
    ctx.strokeStyle = "rgba(6, 136, 122, 0.42)";
    ctx.lineWidth = Math.max(1.5, minDim * 0.003);
    const sorted = [...state.items].sort((a, b) => a.u - b.u).slice(0, 10);
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i], b = sorted[i + 1];
      const mx = ((a.u + b.u) / 2) * W;
      const my = ((a.v + b.v) / 2) * H - minDim * 0.06;
      ctx.beginPath();
      ctx.moveTo(a.u * W, a.v * H);
      ctx.quadraticCurveTo(mx, my, b.u * W, b.v * H);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 绘制全部实绘图形（单真源！）
  const introEase = 1 - Math.pow(1 - state.introT, 3);
  for (let i = 0; i < state.items.length; i++) {
    const it = state.items[i];
    const x = it.u * W;
    const y = it.v * H;
    const rad = it.r * minDim * (0.72 + 0.28 * introEase);
    const fill = COLOR_HEX[it.color] || COLORS.ink;

    ctx.save();
    ctx.fillStyle = fill;

    if (state.scene === "exhibit" && it.tier === "mid") {
      // 展讯小海报卡片
      const bw = rad * 2.1;
      const bh = rad * 2.55;
      ctx.fillStyle = fill;
      ctx.fillRect(x - bw / 2, y - bh / 2, bw, bh);
      ctx.fillStyle = COLORS.paperLight;
      ctx.fillRect(x - bw * 0.34, y - bh * 0.28, bw * 0.68, bh * 0.10);
      ctx.fillRect(x - bw * 0.34, y - bh * 0.08, bw * 0.44, bh * 0.08);
    } else if (it.kind === "square") {
      const side = rad * 1.75;
      ctx.fillRect(x - side / 2, y - side / 2, side, side);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // 爵士题材大锚点叠加鼓圈纹理
    if (state.scene === "jazz" && it.r >= 0.072) {
      ctx.strokeStyle = COLORS.paper;
      ctx.lineWidth = Math.max(1.5, minDim * 0.004);
      ctx.beginPath();
      ctx.arc(x, y, rad * 0.68, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, rad * 0.24, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.paper;
      ctx.fill();
    }

    // 展讯题材大锚点标字
    if (state.scene === "exhibit" && it.r >= 0.072) {
      ctx.fillStyle = COLORS.paperLight;
      ctx.font = `700 ${Math.round(rad * 0.38)}px "Space Grotesk", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(it.color === "orange" ? "LIVE" : "114", x, y);
    }

    // 锚点微弱可拖手柄提示环 + 当前键盘选中态
    if (it.id === state.selectedId && document.activeElement === heroCanvas) {
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = Math.max(2, minDim * 0.005);
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(x, y, rad + minDim * 0.014, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (it.r >= 0.072 && state.draggingId === it.id) {
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = Math.max(2, minDim * 0.0045);
      ctx.beginPath();
      ctx.arc(x, y, rad + minDim * 0.012, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 撞车冲突红环（在纯白噪声或手动撞团时直观标出）
  if (ev.metrics.overlapCount >= 1) {
    ctx.save();
    ctx.strokeStyle = COLORS.orangeText;
    ctx.lineWidth = Math.max(1.8, minDim * 0.004);
    ctx.setLineDash([minDim * 0.01, minDim * 0.008]);
    for (let i = 0; i < state.items.length; i++) {
      for (let j = i + 1; j < state.items.length; j++) {
        const a = state.items[i], b = state.items[j];
        if (distNorm(a, b) < a.r + b.r - 0.004) {
          const mx = ((a.u + b.u) / 2) * W;
          const my = ((a.v + b.v) / 2) * H;
          ctx.beginPath();
          ctx.arc(mx, my, (a.r + b.r) * minDim * 0.72, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  // 光学重心透视标线（重心透视开 或 明显倾覆时轻显）
  if (state.overlay || ev.metrics.cgOffsetPct > 14) {
    const cx = W * 0.5, cy = H * 0.5;
    const gx = ev.cg.x * W, gy = ev.cg.y * H;
    const warn = ev.metrics.cgOffsetPct > 14;
    ctx.save();
    ctx.strokeStyle = warn ? COLORS.orangeText : COLORS.tealText;
    ctx.lineWidth = Math.max(1.8, minDim * 0.004);
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(gx, gy); ctx.stroke();
    ctx.setLineDash([]);
    // 中心点标记（圆环）
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, cy, minDim * 0.014, 0, Math.PI * 2); ctx.stroke();
    // 实算重心菱形标
    ctx.fillStyle = warn ? COLORS.orangeText : COLORS.tealText;
    const ds = minDim * 0.017;
    ctx.beginPath();
    ctx.moveTo(gx, gy - ds); ctx.lineTo(gx + ds, gy); ctx.lineTo(gx, gy + ds); ctx.lineTo(gx - ds, gy);
    ctx.closePath();
    ctx.fill();
    if (state.overlay) {
      ctx.font = `700 ${Math.round(minDim * 0.026)}px "Space Grotesk", "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(`重心偏移 ${ev.metrics.cgOffsetPct}%（示意）`, clamp(gx + ds + 6, 10, W - minDim * 0.36), clamp(gy + 4, 20, H - 14));
    }
    ctx.restore();
  }

  // 拨散推笔实时斥力光圈
  if (state.brush.alpha > 0.02) {
    const bx = state.brush.u * W;
    const by = state.brush.v * H;
    ctx.save();
    ctx.globalAlpha = state.brush.alpha * 0.72;
    ctx.strokeStyle = COLORS.tealText;
    ctx.lineWidth = Math.max(1.8, minDim * 0.004);
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(bx, by, minDim * 0.16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

const heroLoop = loop(heroCanvas, drawHeroFrame);

// 指针与触摸交互（画布内横拖拨散推笔 / 直拖大锚点 / 点击切换尺寸层级）
let pointerDownPos = null;
let pointerMoved = false;

function eventToUV(e) {
  const rect = heroCanvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    u: clamp((clientX - rect.left) / Math.max(1, rect.width), 0.03, 0.97),
    v: clamp((clientY - rect.top) / Math.max(1, rect.height), 0.03, 0.97),
  };
}

function hitTest(u, v) {
  let best = null;
  let bestD = Infinity;
  for (const it of state.items) {
    const d = distNorm({ u, v }, it);
    const hitR = Math.max(it.r * 1.15, 0.045);
    if (d <= hitR && d < bestD) { best = it; bestD = d; }
  }
  return best;
}

function applyScatterBrush(u, v, du, dv) {
  const radius = 0.27;
  let touched = false;
  for (const it of state.items) {
    const dx = (it.u - u) * STAGE_ASPECT;
    const dy = it.v - v;
    const d = Math.hypot(dx, dy);
    if (d < radius) {
      const falloff = (1 - d / radius);
      const nx = d > 0.001 ? dx / d : Math.cos(it.id * 2.3);
      const ny = d > 0.001 ? dy / d : Math.sin(it.id * 2.3);
      // 垂直于拖动方向的轻切向扰动，保证水平一扫就能把整排死板圆真正推散错落
      const swirl = (it.id % 2 === 0 ? 1 : -1) * 0.22;
      const pushU = (nx * 0.032 + du * 0.65) * falloff;
      const pushV = (ny * 0.032 + dv * 0.65 + du * swirl) * falloff;
      it.u = clamp(it.u + pushU, 0.07 + it.r * 0.55, 0.93 - it.r * 0.55);
      it.v = clamp(it.v + pushV, 0.08 + it.r * 0.55, 0.92 - it.r * 0.55);
      it.tu = it.u;
      it.tv = it.v;
      it.vx = clamp(it.vx + pushU * 3.8, -0.45, 0.45);
      it.vy = clamp(it.vy + pushV * 3.8, -0.45, 0.45);
      touched = true;
    }
  }
  // 同时让两两过近元素轻轻相互弹开
  if (touched) {
    for (let i = 0; i < state.items.length; i++) {
      for (let j = i + 1; j < state.items.length; j++) {
        const a = state.items[i], b = state.items[j];
        const dx = (b.u - a.u) * STAGE_ASPECT;
        const dy = b.v - a.v;
        const d = Math.hypot(dx, dy);
        const minD = a.r + b.r + 0.022;
        if (d > 0.0001 && d < minD) {
          const rep = (minD - d) * 0.24;
          const ox = (dx / d) * rep / STAGE_ASPECT;
          const oy = (dy / d) * rep;
          a.u = clamp(a.u - ox, 0.07 + a.r * 0.55, 0.93 - a.r * 0.55);
          a.v = clamp(a.v - oy, 0.08 + a.r * 0.55, 0.92 - a.r * 0.55);
          b.u = clamp(b.u + ox, 0.07 + b.r * 0.55, 0.93 - b.r * 0.55);
          b.v = clamp(b.v + oy, 0.08 + b.r * 0.55, 0.92 - b.r * 0.55);
          a.tu = a.u; a.tv = a.v; b.tu = b.u; b.tv = b.v;
        }
      }
    }
  }
}

heroCanvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  heroCanvas.setPointerCapture(e.pointerId);
  const { u, v } = eventToUV(e);
  pointerDownPos = { u, v };
  pointerMoved = false;
  state.targets = false;
  const hit = hitTest(u, v);
  if (hit && hit.r >= 0.068) {
    state.draggingId = hit.id;
    state.selectedId = hit.id;
  } else {
    state.draggingId = null;
    state.brush.active = true;
    state.brush.u = u;
    state.brush.v = v;
    if (hit) state.selectedId = hit.id;
  }
  state.dirty = true;
  heroLoop.draw();
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!pointerDownPos) return;
  const { u, v } = eventToUV(e);
  const du = u - state.brush.u;
  const dv = v - state.brush.v;
  if (Math.hypot(u - pointerDownPos.u, v - pointerDownPos.v) > 0.012) pointerMoved = true;

  if (state.draggingId != null) {
    const it = state.items.find((x) => x.id === state.draggingId);
    if (it) {
      it.u = clamp(u, 0.08 + it.r * 0.5, 0.92 - it.r * 0.5);
      it.v = clamp(v, 0.09 + it.r * 0.5, 0.91 - it.r * 0.5);
      it.tu = it.u;
      it.tv = it.v;
    }
  } else if (state.brush.active) {
    applyScatterBrush(u, v, du, dv);
    state.brush.u = u;
    state.brush.v = v;
  }
  state.dirty = true;
  heroLoop.draw();
  syncDiagnosis(false);
});

function finishPointer(e) {
  if (!pointerDownPos) return;
  const wasClick = !pointerMoved;
  const { u, v } = pointerDownPos;
  pointerDownPos = null;
  state.draggingId = null;
  state.brush.active = false;
  if (wasClick) {
    const hit = hitTest(u, v);
    if (hit) {
      state.selectedId = hit.id;
      hit.tier = cycleTier(hit.tier);
      hit.r = tierRadius(hit.tier);
      hit.tr = hit.r;
      if (state.colorMode === "mono" && hit.tier === "anchor") {
        hit.color = hit.id % 2 === 0 ? "teal" : "orange";
      }
    }
  }
  state.dirty = true;
  heroLoop.draw();
  syncDiagnosis(true);
}
heroCanvas.addEventListener("pointerup", finishPointer);
heroCanvas.addEventListener("pointercancel", finishPointer);

// 键盘操作：方向键挪动选中图形，Tab/[ / ] 切换图形，+/− 换尺码
heroCanvas.addEventListener("keydown", (e) => {
  const it = state.items.find((x) => x.id === state.selectedId) || state.items[0];
  if (!it) return;
  const step = e.shiftKey ? 0.06 : 0.03;
  let handled = true;
  if (e.key === "ArrowLeft") it.u = clamp(it.u - step, 0.08, 0.92);
  else if (e.key === "ArrowRight") it.u = clamp(it.u + step, 0.08, 0.92);
  else if (e.key === "ArrowUp") it.v = clamp(it.v - step, 0.09, 0.91);
  else if (e.key === "ArrowDown") it.v = clamp(it.v + step, 0.09, 0.91);
  else if (e.key === "]" || e.key === "PageDown") {
    const idx = state.items.indexOf(it);
    state.selectedId = state.items[(idx + 1) % state.items.length].id;
  } else if (e.key === "[" || e.key === "PageUp") {
    const idx = state.items.indexOf(it);
    state.selectedId = state.items[(idx - 1 + state.items.length) % state.items.length].id;
  } else if (e.key === "+" || e.key === "=" || e.key === "Enter" || e.key === " ") {
    it.tier = cycleTier(it.tier);
    it.r = tierRadius(it.tier);
  } else if (e.key === "-") {
    it.tier = "micro";
    it.r = tierRadius("micro");
  } else {
    handled = false;
  }
  if (handled) {
    e.preventDefault();
    state.targets = false;
    it.tu = it.u; it.tv = it.v; it.tr = it.r;
    state.dirty = true;
    heroLoop.draw();
    syncDiagnosis(true);
  }
});

// 绑定开场全部原生控件
$$(".tab-btn[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scene = btn.dataset.scene;
    $$(".tab-btn[data-scene]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", String(on));
    });
    state.dirty = true;
    heroLoop.draw();
  });
});

$$(".chip[data-ctrl]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.ctrl;
    const v = btn.dataset.val;
    if (k === "scale") state.scaleMode = v;
    else if (k === "spread") state.spreadMode = v;
    else if (k === "color") state.colorMode = v;
    applyControlState();
    heroLoop.draw();
  });
});

$("#btn-reseed").addEventListener("click", () => {
  state.seed += 1;
  if (state.spreadMode === "grid") state.spreadMode = "bluenoise";
  if (state.scaleMode === "uniform") state.scaleMode = "dual";
  if (state.colorMode === "mono") state.colorMode = "triad";
  applyControlState();
  heroLoop.draw();
});

$("#btn-poster-sol").addEventListener("click", () => {
  loadPosterSolution();
  heroLoop.draw();
});

$("#btn-reset-mistake").addEventListener("click", () => {
  resetMistake();
  heroLoop.draw();
});

$("#btn-overlay").addEventListener("click", (e) => {
  state.overlay = !state.overlay;
  e.currentTarget.setAttribute("aria-pressed", String(state.overlay));
  e.currentTarget.textContent = `重心透视：${state.overlay ? "开" : "关"}`;
  state.dirty = true;
  heroLoop.draw();
});

// 原海报双联「疏 / 密」标本直接联动主舞台
$("#btn-sparse").addEventListener("click", () => {
  state.scaleMode = "single";
  state.spreadMode = "bluenoise";
  state.colorMode = "triad";
  state.seed += 1;
  applyControlState();
  heroLoop.draw();
});
$("#btn-dense").addEventListener("click", () => {
  state.scaleMode = "dual";
  state.spreadMode = "clusters";
  state.colorMode = "triad";
  state.seed += 1;
  applyControlState();
  heroLoop.draw();
});

syncControlButtons();
syncDiagnosis(true);

// ============================================================
// 二、第 01 节：白噪声 vs 泊松盘蓝噪声分屏对比帘
// ============================================================
const noiseCanvas = $("#noise-canvas");
const noiseCtx = noiseCanvas.getContext("2d");
const curtainRange = $("#curtain-range");
const curtainHandle = $("#curtain-handle");
let noiseSeed = 11;
let noiseData = buildNoiseComparison(noiseSeed);
let curtainPct = 50;

function drawNoisePanel(ctx, items, W, H, minDim, isWhite) {
  ctx.fillStyle = isWhite ? "#F7EFEA" : "#E7F3DF";
  ctx.fillRect(0, 0, W, H);
  // 右侧蓝噪绘制柔和最小呼吸圈
  if (!isWhite) {
    ctx.save();
    ctx.strokeStyle = "rgba(6, 136, 122, 0.24)";
    ctx.lineWidth = Math.max(1, minDim * 0.003);
    ctx.setLineDash([4, 4]);
    for (const it of items) {
      ctx.beginPath();
      ctx.arc(it.u * W, it.v * H, (it.r + 0.036) * minDim, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  for (const it of items) {
    ctx.fillStyle = COLOR_HEX[it.color] || COLORS.ink;
    ctx.beginPath();
    ctx.arc(it.u * W, it.v * H, it.r * minDim, 0, Math.PI * 2);
    ctx.fill();
  }
  // 左侧白噪标出真实撞车碰撞圈
  if (isWhite) {
    ctx.save();
    ctx.strokeStyle = COLORS.orangeText;
    ctx.lineWidth = Math.max(1.8, minDim * 0.005);
    for (const [i, j] of noiseData.whiteCollisions) {
      const a = items[i], b = items[j];
      const mx = ((a.u + b.u) / 2) * W;
      const my = ((a.v + b.v) / 2) * H;
      ctx.beginPath();
      ctx.arc(mx, my, (a.r + b.r) * minDim * 0.85, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function renderNoise() {
  resizeCanvas(noiseCanvas);
  const W = noiseCanvas.width;
  const H = noiseCanvas.height;
  const minDim = Math.min(W, H);
  const splitX = Math.round((curtainPct / 100) * W);

  noiseCtx.clearRect(0, 0, W, H);
  // 左半：白噪声
  noiseCtx.save();
  noiseCtx.beginPath();
  noiseCtx.rect(0, 0, splitX, H);
  noiseCtx.clip();
  drawNoisePanel(noiseCtx, noiseData.white, W, H, minDim, true);
  noiseCtx.restore();

  // 右半：泊松蓝噪声
  noiseCtx.save();
  noiseCtx.beginPath();
  noiseCtx.rect(splitX, 0, W - splitX, H);
  noiseCtx.clip();
  drawNoisePanel(noiseCtx, noiseData.blue, W, H, minDim, false);
  noiseCtx.restore();

  curtainHandle.style.left = `${curtainPct}%`;
  $("#wn-hits").textContent = String(noiseData.whiteCollisions.length);
}

curtainRange.addEventListener("input", () => {
  curtainPct = Number(curtainRange.value);
  renderNoise();
});
$("#btn-noise-seed").addEventListener("click", () => {
  noiseSeed += 1;
  noiseData = buildNoiseComparison(noiseSeed);
  renderNoise();
});

// ============================================================
// 三、第 02 节：疏与密节拍扫描播放器
// ============================================================
const TEMPO_DATA = {
  sparse: {
    text: "当前演示「全疏均散」：拍点之间相隔极远，视线从一点滑向另一点节奏缓慢、轻盈，但缺少紧凑的高潮。",
    bars: [6, 6, 18, 6, 6, 6, 16, 6, 6, 14, 6, 6],
    beats: [
      { x: 34, y: 34, r: 10, c: "#06887A", wait: 0.9 },
      { x: 112, y: 76, r: 8, c: "#09110E", wait: 0.95 },
      { x: 184, y: 32, r: 12, c: "#ED521D", wait: 0.9 },
    ],
  },
  dense: {
    text: "当前演示「全密满铺」：十多个拍点几乎无休止地紧贴在一起，大脑持续接收高频刺激，很容易视觉疲劳。",
    bars: [22, 20, 24, 19, 23, 21, 24, 20, 22, 24, 21, 23],
    beats: [
      { x: 26, y: 28, r: 11, c: "#06887A", wait: 0.22 },
      { x: 56, y: 44, r: 9, c: "#ED521D", wait: 0.22 },
      { x: 84, y: 26, r: 12, c: "#09110E", wait: 0.22 },
      { x: 114, y: 52, r: 10, c: "#06887A", wait: 0.22 },
      { x: 146, y: 30, r: 11, c: "#ED521D", wait: 0.22 },
      { x: 180, y: 48, r: 12, c: "#06887A", wait: 0.22 },
      { x: 194, y: 82, r: 9, c: "#09110E", wait: 0.22 },
      { x: 152, y: 86, r: 11, c: "#ED521D", wait: 0.22 },
      { x: 104, y: 88, r: 9, c: "#09110E", wait: 0.22 },
      { x: 58, y: 84, r: 12, c: "#06887A", wait: 0.22 },
    ],
  },
  contrast: {
    text: "当前演示「疏密相间」：视线先在右侧密区连跳四记快拍，再越过宽阔留白落回左侧大锚点，快慢落差鲜明。",
    bars: [24, 7, 6, 6, 8, 20, 24, 16, 22, 7, 6, 18],
    beats: [
      { x: 38, y: 58, r: 15, c: "#06887A", wait: 0.82 },
      { x: 132, y: 34, r: 12, c: "#ED521D", wait: 0.24 },
      { x: 158, y: 52, r: 7, c: "#09110E", wait: 0.20 },
      { x: 178, y: 36, r: 8, c: "#06887A", wait: 0.22 },
      { x: 168, y: 78, r: 10, c: "#ED521D", wait: 0.28 },
      { x: 134, y: 84, r: 6, c: "#09110E", wait: 0.72 },
    ],
  },
};

let activeTempo = "contrast";
let tempoStep = 0;
let tempoAcc = 0;

function buildTempoSvgs() {
  for (const [key, data] of Object.entries(TEMPO_DATA)) {
    const svg = $(`#svg-tempo-${key}`);
    const pts = data.beats.map((b) => `${b.x},${b.y}`).join(" ");
    const circles = data.beats.map((b, idx) =>
      `<circle cx="${b.x}" cy="${b.y}" r="${b.r}" fill="${b.c}" data-b="${idx}"/>`
    ).join("");
    svg.innerHTML = `<polyline points="${pts}" fill="none" stroke="#09110E" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.45"/>${circles}<circle class="scan-dot" cx="${data.beats[0].x}" cy="${data.beats[0].y}" r="5.5" fill="#FAFCF7" stroke="#09110E" stroke-width="2.2"/>`;
  }
}
buildTempoSvgs();

const tempoPulseEl = $("#tempo-pulse");
tempoPulseEl.innerHTML = new Array(12).fill("<i></i>").join("");

function renderTempoUI() {
  const data = TEMPO_DATA[activeTempo];
  $("#tempo-readout").textContent = data.text;
  const bars = $$("i", tempoPulseEl);
  bars.forEach((el, idx) => {
    const h = data.bars[idx];
    el.style.height = `${h}px`;
    el.style.backgroundColor = idx === tempoStep % bars.length ? COLORS.orange : COLORS.teal;
  });
  for (const key of Object.keys(TEMPO_DATA)) {
    const dot = $(`#svg-tempo-${key} .scan-dot`);
    const beats = TEMPO_DATA[key].beats;
    const b = key === activeTempo ? beats[tempoStep % beats.length] : beats[0];
    dot.setAttribute("cx", String(b.x));
    dot.setAttribute("cy", String(b.y));
    dot.setAttribute("opacity", key === activeTempo ? "1" : "0.35");
  }
}

$$(".tempo-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeTempo = btn.dataset.tempo;
    tempoStep = 0;
    tempoAcc = 0;
    $$(".tempo-card").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderTempoUI();
  });
});
$("#btn-tempo-play").addEventListener("click", () => {
  tempoStep = (tempoStep + 1) % TEMPO_DATA[activeTempo].beats.length;
  tempoAcc = 0;
  renderTempoUI();
});

loop($("#s2"), (_t, dt, { still }) => {
  if (still) { renderTempoUI(); return; }
  const beats = TEMPO_DATA[activeTempo].beats;
  const wait = beats[tempoStep % beats.length].wait;
  tempoAcc += dt;
  if (tempoAcc >= wait) {
    tempoAcc = 0;
    tempoStep = (tempoStep + 1) % beats.length;
    renderTempoUI();
  }
});
renderTempoUI();

// ============================================================
// 四、第 03 节：深墨青暗室二维视觉力矩杠杆天平
// ============================================================
const balCanvas = $("#balance-canvas");
const balCtx = balCanvas.getContext("2d");
let balKey = "redSmall";
let curAngle = 0;
let angVel = 0;

function setBalance(key) {
  balKey = key;
  const p = BALANCE_PRESETS[key];
  $$(".dark-chip[data-bal]").forEach((b) => {
    const on = b.dataset.bal === key;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
  const vEl = $("#bal-verdict");
  vEl.textContent = p.verdict;
  vEl.classList.toggle("is-tilt", Math.abs(p.rightMoment - 1) > 0.15);
  $("#bal-note").textContent = p.note;
}

$$(".dark-chip[data-bal]").forEach((b) => {
  b.addEventListener("click", () => setBalance(b.dataset.bal));
});

loop(balCanvas, (_t, dt, { still }) => {
  resizeCanvas(balCanvas);
  const p = BALANCE_PRESETS[balKey];
  const targetAngle = clamp((p.rightMoment - 1.0) * 0.25, -0.22, 0.22);
  if (still) {
    curAngle = targetAngle;
    angVel = 0;
  } else {
    const step = Math.min(dt, 0.04);
    const force = (targetAngle - curAngle) * 42;
    angVel = (angVel + force * step) * Math.pow(0.08, step);
    curAngle += angVel * step;
  }

  const W = balCanvas.width;
  const H = balCanvas.height;
  const cx = W * 0.5;
  const cy = H * 0.64;
  const halfBeam = W * 0.40;
  const sc = Math.min(W / 640, H / 330);

  balCtx.clearRect(0, 0, W, H);
  balCtx.fillStyle = "#081412";
  balCtx.fillRect(0, 0, W, H);

  // 参考水平虚线
  balCtx.save();
  balCtx.strokeStyle = "rgba(88, 223, 206, 0.22)";
  balCtx.setLineDash([6, 6]);
  balCtx.lineWidth = 1.4;
  balCtx.beginPath();
  balCtx.moveTo(cx - halfBeam - 12, cy);
  balCtx.lineTo(cx + halfBeam + 12, cy);
  balCtx.stroke();
  balCtx.restore();

  // 中心支点三角
  balCtx.fillStyle = "#274742";
  balCtx.beginPath();
  balCtx.moveTo(cx, cy + 4 * sc);
  balCtx.lineTo(cx - 20 * sc, cy + 42 * sc);
  balCtx.lineTo(cx + 20 * sc, cy + 42 * sc);
  balCtx.closePath();
  balCtx.fill();

  // 旋转平衡杆及两侧视觉重块
  balCtx.save();
  balCtx.translate(cx, cy);
  balCtx.rotate(curAngle);

  balCtx.strokeStyle = "#EDF5E8";
  balCtx.lineWidth = Math.max(2.5, 3.5 * sc);
  balCtx.beginPath();
  balCtx.moveTo(-halfBeam, 0);
  balCtx.lineTo(halfBeam, 0);
  balCtx.stroke();

  // 左侧大深青静块（固定对比基准）
  const leftR = 44 * sc;
  const leftX = -halfBeam * 0.56;
  balCtx.fillStyle = "#06887A";
  balCtx.beginPath();
  balCtx.arc(leftX, -leftR - 4 * sc, leftR, 0, Math.PI * 2);
  balCtx.fill();
  balCtx.strokeStyle = "#58DFCE";
  balCtx.lineWidth = 1.5;
  balCtx.stroke();

  // 右侧当前配重方案
  for (const s of p.rightShapes) {
    const sx = halfBeam * s.rx;
    const sr = s.r * sc;
    balCtx.fillStyle = s.color;
    if (s.kind === "square") {
      balCtx.fillRect(sx - sr, -sr * 2 - 4 * sc, sr * 2, sr * 2);
    } else {
      balCtx.beginPath();
      balCtx.arc(sx, -sr - 4 * sc, sr, 0, Math.PI * 2);
      balCtx.fill();
    }
  }
  balCtx.restore();

  // 支点中心圆钉 + 倾角与力矩读数
  balCtx.fillStyle = Math.abs(p.rightMoment - 1) <= 0.15 ? "#58DFCE" : "#FF8559";
  balCtx.beginPath();
  balCtx.arc(cx, cy, 6 * sc, 0, Math.PI * 2);
  balCtx.fill();

  balCtx.fillStyle = "#B6C7B9";
  balCtx.font = `700 ${Math.max(12, Math.round(13 * sc))}px "Space Grotesk", "Noto Sans SC", sans-serif`;
  balCtx.textAlign = "left";
  balCtx.fillText("左矩 1.00（大深青静块）", 18 * sc, 28 * sc);
  balCtx.textAlign = "right";
  balCtx.fillStyle = Math.abs(p.rightMoment - 1) <= 0.15 ? "#58DFCE" : "#FF8559";
  balCtx.fillText(`右矩 ${p.rightMoment.toFixed(2)}（示意）`, W - 18 * sc, 28 * sc);
});

// ============================================================
// 五、第 04 节：历史年份档案抽屉
// ============================================================
const ERAS = {
  arp: {
    year: "1916–1917 · ZÜRICH DADA · MoMA 457.1937",
    title: "让·阿尔普：《按偶然法则排列的方块》",
    text: "苏黎世达达代表人物让·阿尔普（Jean / Hans Arp）撕下彩纸片让其自然飘落拼贴，刻意打破学院派对称构图。纽约现代艺术博物馆（MoMA）藏品档案指出，胶痕证据显示他仍做了微妙的人工调整——学者称之为「辅助偶然」（assisted chance），恰恰点破了随机节奏的本质：先引入偶然，再以眼睛收束。",
    svg: `<svg viewBox="0 0 120 120"><rect x="14" y="18" width="22" height="24" fill="#06887A" transform="rotate(-7 25 30)"/><rect x="52" y="16" width="18" height="20" fill="#09110E" transform="rotate(6 61 26)"/><rect x="78" y="34" width="24" height="22" fill="#ED521D" transform="rotate(-4 90 45)"/><rect x="26" y="64" width="24" height="22" fill="#09110E" transform="rotate(9 38 75)"/><rect x="64" y="72" width="20" height="24" fill="#06887A" transform="rotate(-8 74 84)"/></svg>`,
  },
  kandinsky: {
    year: "1923–1926 · BAUHAUS · BAUHAUSBÜCHER 9",
    title: "康定斯基：《构图第八号》《数个圆》与《点线面》",
    text: "1923 年在魏玛包豪斯绘成的《构图第八号》与 1926 年的《数个圆》（均藏于古根海姆美术馆），把大小悬殊的圆、斜线与点阵排布出音乐般的张力。同年出版的包豪斯丛书第 9 卷《点线面》（Punkt und Linie zu Fläche）系统分析了点与线在「基本平面」上的非规则节奏与内在共鸣。",
    svg: `<svg viewBox="0 0 120 120"><circle cx="76" cy="38" r="22" fill="#06887A"/><circle cx="38" cy="70" r="16" fill="#ED521D"/><circle cx="32" cy="30" r="6" fill="#09110E"/><line x1="18" y1="98" x2="104" y2="22" stroke="#09110E" stroke-width="2.4"/><line x1="62" y1="68" x2="102" y2="96" stroke="#06887A" stroke-width="2.4"/></svg>`,
  },
  arnheim: {
    year: "1954 / 1974 · UNIVERSITY OF CALIFORNIA PRESS",
    title: "鲁道夫·阿恩海姆：《艺术与视知觉》",
    text: "格式塔心理学美学家阿恩海姆在 1954 年初版（1974 年大幅修订再版）的《艺术与视知觉》开篇第一章便讨论「平衡」。他指出画框不是死白的背景板，而是充满隐形拉力的心理力场；大小、色相饱和度与空间位置共同赋予图形「视觉重量」，解释了为什么高度不规则的排布仍能显得稳固。",
    svg: `<svg viewBox="0 0 120 120"><line x1="16" y1="60" x2="104" y2="60" stroke="#73826F" stroke-dasharray="3 3" stroke-width="1.4"/><line x1="60" y1="16" x2="60" y2="104" stroke="#73826F" stroke-dasharray="3 3" stroke-width="1.4"/><circle cx="38" cy="54" r="20" fill="#06887A"/><circle cx="90" cy="64" r="10" fill="#ED521D"/><line x1="38" y1="54" x2="90" y2="64" stroke="#09110E" stroke-width="2"/></svg>`,
  },
  bridson: {
    year: "2007 SIGGRAPH & 2008 / 2015 NEW BASICS",
    title: "泊松盘蓝噪声算法与现代版式「规则与随机」",
    text: "2007 年 Robert Bridson 在 SIGGRAPH 发表线性时间泊松盘采样算法，让计算机能飞快生成「既不规则又永不撞车」的蓝噪声散点；2008 年（2015 年二版）Ellen Lupton 与 Jennifer Cole Phillips 在《平面设计新基础》专设「Rhythm and Balance」与「Rules and Randomness」章节，把规则约束下的受控随机正式纳入设计基础教学。",
    svg: `<svg viewBox="0 0 120 120"><circle cx="36" cy="40" r="18" fill="none" stroke="#06887A" stroke-dasharray="3 3"/><circle cx="36" cy="40" r="6" fill="#06887A"/><circle cx="80" cy="36" r="18" fill="none" stroke="#06887A" stroke-dasharray="3 3"/><circle cx="80" cy="36" r="8" fill="#ED521D"/><circle cx="58" cy="78" r="18" fill="none" stroke="#06887A" stroke-dasharray="3 3"/><circle cx="58" cy="78" r="5" fill="#09110E"/><circle cx="92" cy="84" r="14" fill="none" stroke="#06887A" stroke-dasharray="3 3"/><circle cx="92" cy="84" r="4" fill="#06887A"/></svg>`,
  },
};

function showEra(key) {
  const e = ERAS[key];
  $("#era-year").textContent = e.year;
  $("#era-title").textContent = e.title;
  $("#era-text").textContent = e.text;
  $("#era-visual").innerHTML = e.svg;
  $$(".era-tab").forEach((btn) => {
    const on = btn.dataset.era === key;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-selected", String(on));
  });
}
$$(".era-tab").forEach((btn) => btn.addEventListener("click", () => showEra(btn.dataset.era)));
showEra("arp");

// ============================================================
// 六、第 05 节：八种节奏诉求筛选高亮
// ============================================================
$$(".intent-bar .chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    const intent = btn.dataset.intent;
    $$(".intent-bar .chip").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    $$(".fam-item").forEach((li) => {
      const groups = (li.dataset.group || "").split(" ");
      const hit = intent === "all" || groups.includes(intent);
      li.classList.toggle("is-dim", !hit);
    });
  });
});

// ============================================================
// 七、第 06 节：正反实景对照（音乐节海报 vs 航班登机牌）
// ============================================================
const stressBox = $("#stress-grid-box");
function setStressMode(mode) {
  stressBox.dataset.mode = mode;
  $("#stress-random").classList.toggle("is-on", mode === "random");
  $("#stress-random").setAttribute("aria-pressed", String(mode === "random"));
  $("#stress-grid").classList.toggle("is-on", mode === "grid");
  $("#stress-grid").setAttribute("aria-pressed", String(mode === "grid"));
  if (mode === "random") {
    $("#cap-poster").innerHTML = "<b>音乐节海报 · 成立</b>：错落的色块与时间标签像爵士即兴，一眼看出轻松活气。";
    $("#cap-ticket").innerHTML = "<b>航班登机牌 · 翻车</b>：登机口、座位、时间东倒西歪且字号乱跳，赶飞机时找错字段直接误机。";
  } else {
    $("#cap-poster").innerHTML = "<b>音乐节海报 · 偏闷</b>：所有元素左对齐成通知单，整齐但少了演出海报应有的跳跃张力。";
    $("#cap-ticket").innerHTML = "<b>航班登机牌 · 成立</b>：四项核心字段严格两列对齐，扫一眼就能在三秒内核对无误。";
  }
}
$("#stress-random").addEventListener("click", () => setStressMode("random"));
$("#stress-grid").addEventListener("click", () => setStressMode("grid"));

// ============================================================
// 八、第 07 节：单变量小练习（A/B/C/D 四选一 + 叠加诊断揭示）
// ============================================================
let quizPicked = null;

function drawQuizCards() {
  $$(".quiz-cv").forEach((cv) => {
    const key = cv.dataset.opt;
    const data = QUIZ_ITEMS[key];
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height, minDim = Math.min(W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, W, H);

    // 选完后叠加结构透视，帮读者一眼看懂四个选项的唯一差异
    if (quizPicked) {
      ctx.save();
      if (key === "A") {
        ctx.strokeStyle = "rgba(184, 53, 11, 0.35)";
        ctx.setLineDash([4, 4]);
        for (const u of [0.16, 0.39, 0.62, 0.84]) {
          ctx.beginPath(); ctx.moveTo(u * W, 10); ctx.lineTo(u * W, H - 10); ctx.stroke();
        }
        for (const v of [0.22, 0.50, 0.78]) {
          ctx.beginPath(); ctx.moveTo(10, v * H); ctx.lineTo(W - 10, v * H); ctx.stroke();
        }
      } else if (key === "B") {
        ctx.strokeStyle = "rgba(184, 53, 11, 0.65)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.arc(W * 0.72, H * 0.48, minDim * 0.32, 0, Math.PI * 2); ctx.stroke();
      } else if (key === "C") {
        ctx.strokeStyle = "rgba(4, 104, 93, 0.32)";
        ctx.setLineDash([3, 3]);
        for (const it of data.items) {
          ctx.beginPath(); ctx.arc(it.u * W, it.v * H, (it.r + 0.035) * minDim, 0, Math.PI * 2); ctx.stroke();
        }
      } else if (key === "D") {
        ctx.strokeStyle = "rgba(184, 53, 11, 0.55)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(W * 0.25, H * 0.24, W * 0.50, H * 0.52);
      }
      ctx.restore();
    }

    for (const it of data.items) {
      const x = it.u * W, y = it.v * H, r = it.r * minDim;
      ctx.fillStyle = COLOR_HEX[it.color] || COLORS.ink;
      if (it.kind === "square") ctx.fillRect(x - r * 0.88, y - r * 0.88, r * 1.76, r * 1.76);
      else { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    }

    if (quizPicked) {
      const cg = computeOpticalCG(data.items);
      ctx.save();
      ctx.fillStyle = data.correct ? COLORS.tealText : COLORS.orangeText;
      ctx.strokeStyle = "#FAFCF7";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cg.x * W, cg.y * H, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  });
}

$$(".quiz-opt").forEach((btn) => {
  btn.addEventListener("click", () => {
    quizPicked = btn.dataset.opt;
    const item = QUIZ_ITEMS[quizPicked];
    $$(".quiz-opt").forEach((b) => {
      const k = b.dataset.opt;
      b.setAttribute("aria-pressed", String(k === quizPicked));
      b.classList.toggle("is-right", QUIZ_ITEMS[k].correct);
      b.classList.toggle("is-wrong", k === quizPicked && !QUIZ_ITEMS[k].correct);
    });
    const vd = $("#quiz-verdict");
    vd.classList.toggle("is-right", item.correct);
    vd.classList.toggle("is-wrong", !item.correct);
    $("#qv-title").textContent = item.verdictTitle;
    $("#qv-text").textContent = item.verdictText;
    drawQuizCards();
  });
});
drawQuizCards();

// ============================================================
// 九、第 08 节：原海报放大、拖动、滚轮缩放与 Esc 收起灯箱
// ============================================================
const lb = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const posterBtn = $("#poster-btn");
let lbScale = 1, lbX = 0, lbY = 0, lbDrag = null;

function updateLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  $("#lb-reset").textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = $("#poster").src;
  lbScale = 1; lbX = 0; lbY = 0;
  updateLbTransform();
  lb.hidden = false;
  posterBtn.setAttribute("aria-expanded", "true");
  $("#lb-close").focus();
}

function closeLightbox() {
  lb.hidden = true;
  posterBtn.setAttribute("aria-expanded", "false");
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-in").addEventListener("click", () => { lbScale = clamp(lbScale + 0.35, 0.7, 3.5); updateLbTransform(); });
$("#lb-out").addEventListener("click", () => { lbScale = clamp(lbScale - 0.35, 0.7, 3.5); updateLbTransform(); });
$("#lb-reset").addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; updateLbTransform(); });
lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.2 : -0.2), 0.7, 3.5);
  updateLbTransform();
}, { passive: false });
lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) { closeLightbox(); return; }
  lbStage.setPointerCapture(e.pointerId);
  lbDrag = { x: e.clientX - lbX, y: e.clientY - lbY };
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbDrag.x;
  lbY = e.clientY - lbDrag.y;
  updateLbTransform();
});
lbStage.addEventListener("pointerup", () => { lbDrag = null; });
lbStage.addEventListener("pointercancel", () => { lbDrag = null; });
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lb.hidden) closeLightbox();
});

// 窗口尺寸变化时重绘静态画布
window.addEventListener("resize", () => {
  state.dirty = true;
  heroLoop.draw();
  renderNoise();
});

renderNoise();
heroLoop.draw();

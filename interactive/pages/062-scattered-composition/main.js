import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  PALETTE,
  ITEM_DEFS,
  POSTER_REF,
  createItems,
  effRadius,
  clampItem,
  applyBreathWave,
  evaluate,
  generateDistribution,
} from "./model.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}, text = "") {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (text) el.textContent = text;
  return el;
}

/* ============================================================================
   HERO：黑绒星场播撒与引斥雕刻台
   ============================================================================ */
function initHero() {
  const canvas = $("#hero-canvas");
  const shell = $("#canvas-shell");
  if (!canvas || !shell) return;
  const ctx = canvas.getContext("2d");

  const state = {
    items: createItems("grid"),
    selectedId: "f1",
    preset: "grid",
    overlays: { sight: true, gap: false, com: false, ref: false },
    refUnlocked: false,
    waves: [],
    dirty: true,
    intro: reducedMotion.matches ? 1 : 0,
    aspect: 1.28,
    w: 800,
    h: 500,
  };

  // DOM 缓存
  const diagBox = $(".hero-diag");
  const elTag = $("#diag-tag");
  const elScore = $("#diag-score");
  const elHeadline = $("#diag-headline");
  const elReason = $("#diag-reason");
  const elAction = $("#diag-action");
  const elMobilePill = $("#mobile-pill");
  const elRatio = $("#m-ratio");
  const elGap = $("#m-gap");
  const elAlign = $("#m-align");
  const elCom = $("#m-com");
  const btnRef = $("#ov-ref");
  const kwEls = {
    variation: { box: $('.kw-item[data-kw="variation"]'), val: $("#kw-variation") },
    rhythm: { box: $('.kw-item[data-kw="rhythm"]'), val: $("#kw-rhythm") },
    breath: { box: $('.kw-item[data-kw="breath"]'), val: $("#kw-breath") },
    openness: { box: $('.kw-item[data-kw="openness"]'), val: $("#kw-openness") },
  };

  let lastEval = evaluate(state.items, state.aspect);

  function resize() {
    const r = shell.getBoundingClientRect();
    const w = Math.max(240, Math.round(r.width));
    const h = Math.max(200, Math.round(r.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    state.w = w;
    state.h = h;
    state.aspect = w / h;
    state.dirty = true;
  }

  function syncUI(ev) {
    lastEval = ev;
    diagBox.classList.toggle("is-pass", ev.allPass);
    elTag.textContent = ev.tag;
    elScore.textContent = `${ev.passedCount} / 4`;
    elHeadline.textContent = ev.headline;
    elReason.textContent = ev.reason;
    elAction.textContent = ev.action;

    const shortTag = ev.tag.replace(/^错态\s*·\s*/, "").replace(/\s*·\s*4\/4$/, "");
    elMobilePill.textContent = `${ev.passedCount}/4 · ${shortTag}`;
    elMobilePill.classList.toggle("is-pass", ev.allPass);

    elRatio.textContent = `${ev.metrics.focalRatio.toFixed(1)}×`;
    elGap.textContent = `${(ev.metrics.minGap * 100).toFixed(1)}%`;
    elAlign.textContent = `${ev.metrics.alignedPairs} 对`;
    elCom.textContent = `${Math.round(ev.metrics.balanceOffset * 100)}%`;

    for (const [k, obj] of Object.entries(kwEls)) {
      const c = ev.checks[k];
      obj.box.classList.toggle("is-ok", c.ok);
      obj.val.textContent = c.label;
    }

    if (ev.allPass && !state.refUnlocked) {
      state.refUnlocked = true;
      btnRef.disabled = false;
      btnRef.title = "叠看 062 原海报轮廓";
    }
  }

  function updateAll() {
    const ev = evaluate(state.items, state.aspect);
    syncUI(ev);
    state.dirty = true;
    heroLoop.draw();
  }

  function drawItemShape(it, cx, cy, unit, alpha = 1, outlineOnly = false) {
    const r = it.r * unit;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (it.kind === "circle") {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      if (outlineOnly) {
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
      } else {
        ctx.fillStyle = it.color;
        ctx.fill();
      }
    } else if (it.kind === "ring") {
      const lw = r * 0.44;
      ctx.beginPath();
      ctx.arc(cx, cy, r - lw * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = it.color;
      ctx.lineWidth = outlineOnly ? 1.8 : lw;
      if (outlineOnly) ctx.setLineDash([5, 5]);
      ctx.stroke();
    } else if (it.kind === "square") {
      const s = r * 1.82;
      if (outlineOnly) {
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(cx - s / 2, cy - s / 2, s, s);
      } else {
        ctx.fillStyle = it.color;
        ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
      }
    } else if (it.kind === "grid") {
      const step = r * 0.72;
      const dr = Math.max(2.6, r * 0.17);
      ctx.fillStyle = it.color;
      for (let gy = -1; gy <= 1; gy++) {
        for (let gx = -1; gx <= 1; gx++) {
          ctx.beginPath();
          ctx.arc(cx + gx * step, cy + gy * step, dr, 0, Math.PI * 2);
          if (outlineOnly) {
            ctx.strokeStyle = it.color;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          } else {
            ctx.fill();
          }
        }
      }
    }
    ctx.restore();
  }

  function drawPlus(cx, cy, size, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - size, cy);
    ctx.lineTo(cx + size, cy);
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx, cy + size);
    ctx.stroke();
    ctx.restore();
  }

  function drawDashedCallouts(items, w, h, unit) {
    const isSmall = w < 480;
    const focals = items.filter((it) => it.focal > 0);
    const placedLabels = [];
    const pillW = isSmall ? 56 : 64;
    const pillH = isSmall ? 18 : 20;

    for (const it of focals) {
      const cx = it.x * w, cy = it.y * h;
      const r = it.r * unit;
      const label = `焦点 0${it.focal}`;

      // 候选方向（上、左上、右上、左、右、下），自动挑选远离其他图形与已放置标签的最清净位置
      const gap = isSmall ? 26 : 36;
      const cands = [
        { dx: 0, dy: -(r + gap * 0.82), sx: 0, sy: -r * 0.92 },
        { dx: -(r + gap + pillW * 0.42), dy: -r * 0.25, sx: -r * 0.86, sy: -r * 0.15 },
        { dx: r + gap + pillW * 0.42, dy: -r * 0.25, sx: r * 0.86, sy: -r * 0.15 },
        { dx: 0, dy: r + gap * 0.88, sx: 0, sy: r * 0.92 },
        { dx: -(r + gap * 0.9 + pillW * 0.35), dy: -(r + gap * 0.45), sx: -r * 0.65, sy: -r * 0.65 },
        { dx: r + gap * 0.9 + pillW * 0.35, dy: -(r + gap * 0.45), sx: r * 0.65, sy: -r * 0.65 },
      ];

      let best = null, bestScore = -Infinity;
      for (const c of cands) {
        const lx = Math.max(pillW * 0.5 + 8, Math.min(w - pillW * 0.5 - 8, cx + c.dx));
        const ly = Math.max(pillH * 0.5 + 8, Math.min(h - pillH * 0.5 - 8, cy + c.dy));
        // 与所有几何体的最小净距
        let minItemD = Infinity;
        for (const other of items) {
          const d = Math.hypot(lx - other.x * w, ly - other.y * h) - (effRadius(other) * unit + pillW * 0.36);
          if (d < minItemD) minItemD = d;
        }
        // 与已放标签的最小净距
        let minLblD = 999;
        for (const pl of placedLabels) {
          const ox = Math.max(0, (pillW + 10) - Math.abs(lx - pl.x));
          const oy = Math.max(0, (pillH + 8) - Math.abs(ly - pl.y));
          if (ox > 0 && oy > 0) minLblD = Math.min(minLblD, -Math.min(ox, oy) - 40);
          else minLblD = Math.min(minLblD, Math.hypot(lx - pl.x, ly - pl.y));
        }
        const edgePen = (Math.abs((cx + c.dx) - lx) + Math.abs((cy + c.dy) - ly)) * 0.8;
        const score = Math.min(minItemD, minLblD) - edgePen;
        if (score > bestScore) {
          bestScore = score;
          best = { lx, ly, sx: cx + c.sx, sy: cy + c.sy };
        }
      }

      placedLabels.push({ x: best.lx, y: best.ly });

      ctx.save();
      ctx.strokeStyle = "rgba(243, 236, 222, 0.72)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(best.sx, best.sy);
      ctx.lineTo(best.lx, best.ly);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = PALETTE.cream;
      ctx.beginPath();
      ctx.arc(best.sx, best.sy, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // 深黑哑光微衬底保证任何拖拽姿态下文字清晰不叠字
      ctx.fillStyle = "rgba(9, 9, 9, 0.90)";
      ctx.fillRect(best.lx - pillW / 2, best.ly - pillH / 2, pillW, pillH);
      ctx.strokeStyle = "rgba(243, 236, 222, 0.24)";
      ctx.lineWidth = 1;
      ctx.strokeRect(best.lx - pillW / 2, best.ly - pillH / 2, pillW, pillH);

      ctx.font = `700 ${isSmall ? 10.5 : 11.5}px "Space Mono", "Noto Sans SC", monospace`;
      ctx.fillStyle = it.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, best.lx, best.ly + 0.5);
      ctx.restore();
    }
  }

  function render(t, dt, { still }) {
    if (still) {
      state.intro = 1;
      state.waves = [];
    } else if (state.intro < 1) {
      state.intro = Math.min(1, state.intro + dt * 1.65);
      state.dirty = true;
    }

    if (state.waves.length > 0 && !still) {
      for (const wv of state.waves) wv.age += dt;
      state.waves = state.waves.filter((wv) => wv.age < 0.75);
      state.dirty = true;
    }

    if (!state.dirty && !still) return;
    state.dirty = false;

    const dpr = canvas.width / Math.max(1, state.w);
    const w = state.w;
    const h = state.h;
    const unit = Math.min(w, h);
    const ev = lastEval;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 纯黑天鹅绒底场
    ctx.fillStyle = PALETTE.obsidian;
    ctx.fillRect(0, 0, w, h);

    // 极淡空间坐标参考点（不破坏黑底静谧感）
    ctx.fillStyle = "rgba(243, 236, 222, 0.08)";
    const cols = w > 520 ? 10 : 6;
    const rows = h > 360 ? 7 : 5;
    for (let r = 1; r < rows; r++) {
      for (let c = 1; c < cols; c++) {
        ctx.fillRect(Math.round((w * c) / cols), Math.round((h * r) / rows), 1.5, 1.5);
      }
    }

    // 2. 可选：4/4 解锁后的 062 原海报几何轮廓叠看
    if (state.overlays.ref && state.refUnlocked) {
      for (const def of ITEM_DEFS) {
        const ref = POSTER_REF[def.id];
        drawItemShape({ ...def, r: ref.r }, ref.x * w, ref.y * h, unit, 0.36, true);
      }
    }

    // 3. 留白十字星标（随元素空隙自动浮现）
    const ease = 1 - (1 - state.intro) ** 3;
    const plusSize = w < 460 ? 5.5 : 7.5;
    for (const m of ev.breathMarks) {
      drawPlus(m.x * w, m.y * h, plusSize, m.color);
    }

    // 4. 僵直网格错态时显示虚线共线警示
    if (ev.code === "grid" && ev.alignLines.length) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 107, 74, 0.38)";
      ctx.lineWidth = 1.1;
      ctx.setLineDash([4, 4]);
      for (const ln of ev.alignLines.slice(0, 12)) {
        ctx.beginPath();
        ctx.moveTo(ln.a.x * w, ln.a.y * h);
        ctx.lineTo(ln.b.x * w, ln.b.y * h);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 空心贴边错态时显示中央死洞虚线环
    if (ev.code === "hollow") {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 107, 74, 0.55)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, Math.max(30, ev.metrics.centerNearest * unit * 0.85), 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = '700 12px "Noto Sans SC", sans-serif';
      ctx.fillStyle = "#FF9475";
      ctx.textAlign = "center";
      ctx.fillText("中央空洞", w * 0.5, h * 0.5 + 4);
      ctx.restore();
    }

    // 5. 泊松净隙气囊透视层
    if (state.overlays.gap) {
      for (const it of state.items) {
        const cx = it.x * w, cy = it.y * h;
        const haloR = (effRadius(it) + 0.015) * unit;
        ctx.save();
        ctx.strokeStyle = "rgba(44, 200, 167, 0.42)";
        ctx.fillStyle = "rgba(18, 150, 123, 0.07)";
        ctx.lineWidth = 1.1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    // 6. 视线跳轨透视层（连接 01 -> 02 -> 03）
    if (state.overlays.sight) {
      const f1 = state.items.find((i) => i.id === "f1");
      const f2 = state.items.find((i) => i.id === "f2");
      const f3 = state.items.find((i) => i.id === "f3");
      ctx.save();
      ctx.strokeStyle = ev.checks.variation.ok ? "rgba(243, 236, 222, 0.34)" : "rgba(255, 148, 117, 0.45)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(f1.x * w, f1.y * h);
      ctx.lineTo(f2.x * w, f2.y * h);
      ctx.lineTo(f3.x * w, f3.y * h);
      ctx.stroke();
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.moveTo(f3.x * w, f3.y * h);
      ctx.lineTo(f1.x * w, f1.y * h);
      ctx.stroke();
      ctx.restore();
    }

    // 7. 呼吸推波涟漪
    for (const wv of state.waves) {
      const p = wv.age / 0.75;
      const rad = (0.04 + p * 0.34) * unit;
      ctx.save();
      ctx.strokeStyle = `rgba(44, 200, 167, ${(1 - p) * 0.72})`;
      ctx.lineWidth = 2.2 * (1 - p * 0.5);
      ctx.beginPath();
      ctx.arc(wv.x * w, wv.y * h, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 8. 绘制 9 枚核心几何实体（带轻盈开场入位）
    for (const it of state.items) {
      const cx = (0.5 + (it.x - 0.5) * (0.86 + 0.14 * ease)) * w;
      const cy = (0.5 + (it.y - 0.5) * (0.86 + 0.14 * ease)) * h;
      drawItemShape(it, cx, cy, unit, 1, false);

      // 选中框高亮
      if (it.id === state.selectedId) {
        const sr = (effRadius(it) + 0.018) * unit;
        ctx.save();
        ctx.strokeStyle = PALETTE.cream;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(cx, cy, sr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 9. 三大焦点原海报同款白色虚线圆点引注（自动避让防重叠）
    drawDashedCallouts(state.items, w, h, unit);

    // 10. 碰撞 / 过挤实时赤红警戒环
    for (const c of ev.collisions) {
      const mx = ((c.a.x + c.b.x) * 0.5) * w;
      const my = ((c.a.y + c.b.y) * 0.5) * h;
      ctx.save();
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.a.x * w, c.a.y * h);
      ctx.lineTo(c.b.x * w, c.b.y * h);
      ctx.stroke();
      ctx.fillStyle = "#2A110C";
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(mx, my, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#FFD1C4";
      ctx.font = '700 11px "Space Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("!", mx, my + 0.5);
      ctx.restore();
    }

    // 11. 阿恩海姆重心支点透视层（或在倾覆错态下自动显现）
    if (state.overlays.com || ev.code === "tilt") {
      const ocX = w * 0.5, ocY = h * 0.48;
      const cmX = ev.metrics.comX * w, cmY = ev.metrics.comY * h;
      const okRad = 0.135 * Math.min(w, h);
      ctx.save();
      ctx.strokeStyle = "rgba(243, 236, 222, 0.25)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(ocX, ocY, okRad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 光学中心小标记
      drawPlus(ocX, ocY, 5, "rgba(243,236,222,0.65)");

      // 重心偏移线
      const col = ev.checks.openness.ok ? PALETTE.jadeBright : PALETTE.warn;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ocX, ocY);
      ctx.lineTo(cmX, cmY);
      ctx.stroke();

      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(cmX, cmY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.obsidian;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '700 11.5px "Noto Sans SC", sans-serif';
      ctx.fillStyle = col;
      ctx.textAlign = cmX > w * 0.65 ? "right" : "left";
      ctx.fillText(`视觉重心 ${Math.round(ev.metrics.balanceOffset * 100)}%`, cmX + (cmX > w * 0.65 ? -10 : 10), cmY - 8);
      ctx.restore();
    }

    ctx.restore();
  }

  const heroLoop = loop(canvas, render);

  // ---------- 指针与触屏交互：直拖几何体 + 空白场扫拖呼吸推波 ----------
  let dragMode = null; // "item" | "wave"
  let dragItem = null;
  let dragOffset = { x: 0, y: 0 };
  let lastWaveTime = 0;

  function toNorm(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (clientX - r.left) / Math.max(1, r.width))),
      y: Math.max(0, Math.min(1, (clientY - r.top) / Math.max(1, r.height))),
    };
  }

  function hitTest(nx, ny) {
    const sx = state.aspect >= 1 ? state.aspect : 1;
    const sy = state.aspect >= 1 ? 1 : 1 / state.aspect;
    let best = null, bestD = Infinity;
    for (let i = state.items.length - 1; i >= 0; i--) {
      const it = state.items[i];
      const d = Math.hypot((nx - it.x) * sx, (ny - it.y) * sy);
      const hitR = Math.max(effRadius(it) + 0.025, 0.055);
      if (d <= hitR && d < bestD) {
        best = it;
        bestD = d;
      }
    }
    return best;
  }

  function selectFocalButtons(id) {
    for (const b of $$("[data-sel]")) {
      b.setAttribute("aria-pressed", String(b.dataset.sel === id));
    }
  }

  canvas.addEventListener("pointerdown", (e) => {
    const { x, y } = toNorm(e.clientX, e.clientY);
    const hit = hitTest(x, y);
    if (hit) {
      dragMode = "item";
      dragItem = hit;
      state.selectedId = hit.id;
      selectFocalButtons(hit.id);
      dragOffset = { x: hit.x - x, y: hit.y - y };
      canvas.setPointerCapture?.(e.pointerId);
      state.dirty = true;
      heroLoop.draw();
    } else {
      dragMode = "wave";
      dragItem = null;
      canvas.setPointerCapture?.(e.pointerId);
      applyBreathWave(state.items, x, y, state.aspect, 0.032);
      state.waves.push({ x, y, age: 0 });
      clearPresetActive();
      updateAll();
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragMode) return;
    const { x, y } = toNorm(e.clientX, e.clientY);
    if (dragMode === "item" && dragItem) {
      dragItem.x = x + dragOffset.x;
      dragItem.y = y + dragOffset.y;
      clampItem(dragItem, state.aspect);
      clearPresetActive();
      updateAll();
    } else if (dragMode === "wave") {
      applyBreathWave(state.items, x, y, state.aspect, 0.024);
      const now = performance.now();
      if (now - lastWaveTime > 120) {
        state.waves.push({ x, y, age: 0 });
        lastWaveTime = now;
      }
      clearPresetActive();
      updateAll();
    }
  });

  const endDrag = () => { dragMode = null; dragItem = null; };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // 键盘控制：方向键移动选中元素，+/- 调大小，Tab 循环焦点
  canvas.addEventListener("keydown", (e) => {
    const it = state.items.find((i) => i.id === state.selectedId) || state.items[0];
    if (!it) return;
    const step = e.shiftKey ? 0.045 : 0.02;
    let handled = true;
    if (e.key === "ArrowLeft") it.x -= step;
    else if (e.key === "ArrowRight") it.x += step;
    else if (e.key === "ArrowUp") it.y -= step;
    else if (e.key === "ArrowDown") it.y += step;
    else if (e.key === "+" || e.key === "=") it.r = Math.min(it.maxR, it.r + 0.01);
    else if (e.key === "-" || e.key === "_") it.r = Math.max(it.minR, it.r - 0.01);
    else handled = false;
    if (handled) {
      e.preventDefault();
      clampItem(it, state.aspect);
      clearPresetActive();
      updateAll();
    }
  });

  // 工具按钮
  function clearPresetActive() {
    for (const b of $$("[data-preset]")) b.setAttribute("aria-pressed", "false");
  }

  for (const b of $$("[data-sel]")) {
    b.addEventListener("click", () => {
      state.selectedId = b.dataset.sel;
      selectFocalButtons(state.selectedId);
      state.dirty = true;
      heroLoop.draw();
    });
  }

  $("#btn-smaller")?.addEventListener("click", () => {
    const it = state.items.find((i) => i.id === state.selectedId);
    if (!it) return;
    it.r = Math.max(it.minR, +(it.r - 0.012).toFixed(4));
    clampItem(it, state.aspect);
    updateAll();
  });

  $("#btn-bigger")?.addEventListener("click", () => {
    const it = state.items.find((i) => i.id === state.selectedId);
    if (!it) return;
    it.r = Math.min(it.maxR, +(it.r + 0.012).toFixed(4));
    clampItem(it, state.aspect);
    updateAll();
  });

  // 只改 01/02/03 半径，不替用户挪位置（保留思考与散排乐趣）
  $("#btn-tier")?.addEventListener("click", () => {
    for (const id of ["f1", "f2", "f3"]) {
      const it = state.items.find((i) => i.id === id);
      if (it) {
        it.r = POSTER_REF[id].r;
        clampItem(it, state.aspect);
      }
    }
    updateAll();
  });

  $("#btn-wave")?.addEventListener("click", () => {
    // 在最拥挤处或重心附近发出一道呼吸推波
    let wx = 0.42, wy = 0.46;
    if (lastEval.collisions.length) {
      const c = lastEval.collisions[0];
      wx = (c.a.x + c.b.x) * 0.5;
      wy = (c.a.y + c.b.y) * 0.5;
    } else {
      wx = lastEval.metrics.comX;
      wy = lastEval.metrics.comY;
    }
    applyBreathWave(state.items, wx, wy, state.aspect, 0.055);
    state.waves.push({ x: wx, y: wy, age: 0 });
    clearPresetActive();
    updateAll();
  });

  for (const b of $$("[data-preset]")) {
    b.addEventListener("click", () => {
      state.preset = b.dataset.preset;
      state.items = createItems(state.preset);
      for (const x of $$("[data-preset]")) x.setAttribute("aria-pressed", String(x === b));
      updateAll();
    });
  }

  const bindOverlay = (id, key) => {
    const btn = $(id);
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      state.overlays[key] = !state.overlays[key];
      btn.setAttribute("aria-pressed", String(state.overlays[key]));
      state.dirty = true;
      heroLoop.draw();
    });
  };
  bindOverlay("#ov-sight", "sight");
  bindOverlay("#ov-gap", "gap");
  bindOverlay("#ov-com", "com");
  bindOverlay("#ov-ref", "ref");

  new ResizeObserver(() => {
    resize();
    updateAll();
  }).observe(shell);

  resize();
  updateAll();

  // 供探针验证单真源读数用（不污染用户界面）
  window.__scatterDebug = {
    getState: () => ({ items: state.items.map((i) => ({ id: i.id, x: i.x, y: i.y, r: i.r })), eval: lastEval }),
    applyPosterRef: () => {
      for (const it of state.items) {
        it.x = POSTER_REF[it.id].x;
        it.y = POSTER_REF[it.id].y;
        it.r = POSTER_REF[it.id].r;
      }
      clearPresetActive();
      updateAll();
    },
  };
}

/* ============================================================================
   01 节：三个焦点的接力（SVG 显著性接力剧场）
   ============================================================================ */
function initSection01() {
  const svg = $("#relay-svg");
  const readout = $("#relay-readout");
  const playBtn = $("#relay-play");
  if (!svg) return;

  const MODES = {
    order: {
      note: "面积与亮度齐步递减：大明黄圆先锚定右上，目光顺着留白滑向中紫圆，最后被左下橘红小圆稳稳接住。",
      nodes: [
        { id: "01", x: 452, y: 112, r: 58, color: PALETTE.yellow, order: 1, tag: "主焦点 01 · 大面积高明度" },
        { id: "02", x: 446, y: 266, r: 42, color: PALETTE.lavender, order: 2, tag: "停留点 02 · 中体量配留白" },
        { id: "03", x: 196, y: 288, r: 24, color: PALETTE.orange, order: 3, tag: "次锚点 03 · 小面积高对比" },
      ],
      extras: [{ x: 112, y: 120, w: 38, color: PALETTE.jade, kind: "sq" }, { x: 568, y: 360, r: 22, color: PALETTE.cream, kind: "ring" }],
      path: [0, 1, 2],
    },
    hijack: {
      note: "高对比反超：把大黄圆降成低对比暗赭并塞进杂点，而橘红小圆周围清空大片黑底——小块反而抢成了视线第 1 站！",
      nodes: [
        { id: "03", x: 196, y: 205, r: 26, color: PALETTE.orange, order: 1, tag: "反超成第 1 站 · 孤立高对比" },
        { id: "02", x: 472, y: 292, r: 42, color: PALETTE.lavender, order: 2, tag: "退居第 2 站 · 中等明度" },
        { id: "01", x: 468, y: 108, r: 58, color: "#6A5C30", order: 3, tag: "退居第 3 站 · 暗沉且周边拥挤" },
      ],
      extras: [
        { x: 392, y: 74, w: 28, color: "#50535C", kind: "sq" },
        { x: 538, y: 92, w: 24, color: "#50535C", kind: "sq" },
        { x: 525, y: 158, w: 22, color: "#50535C", kind: "sq" },
      ],
      path: [0, 1, 2],
    },
    tug: {
      note: "平权拉扯：三枚色块面积与亮度几乎一致且等距摆开，眼睛没有主入口，不得不在三点之间反复折返拉扯。",
      nodes: [
        { id: "A", x: 155, y: 210, r: 42, color: PALETTE.yellow, order: 0, tag: "等权色块 · 抢焦" },
        { id: "B", x: 320, y: 210, r: 42, color: PALETTE.lavender, order: 0, tag: "等权色块 · 抢焦" },
        { id: "C", x: 485, y: 210, r: 42, color: PALETTE.orange, order: 0, tag: "等权色块 · 抢焦" },
      ],
      extras: [],
      path: [0, 1, 2, 0],
    },
  };

  let activeMode = "order";
  let stepHighlight = -1;
  let timer = 0;

  function draw() {
    const m = MODES[activeMode];
    svg.replaceChildren();
    svg.append(svgEl("rect", { x: 0, y: 0, width: 640, height: 420, fill: PALETTE.obsidian }));

    // 背景十字微标
    for (const [px, py] of [[90, 62], [322, 92], [582, 210], [332, 365]]) {
      svg.append(svgEl("path", { d: `M${px - 5},${py} H${px + 5} M${px},${py - 5} V${py + 5}`, stroke: "rgba(243,236,222,0.35)", "stroke-width": 1.6 }));
    }

    // 伴形
    for (const ex of m.extras) {
      if (ex.kind === "sq") {
        svg.append(svgEl("rect", { x: ex.x - ex.w / 2, y: ex.y - ex.w / 2, width: ex.w, height: ex.w, fill: ex.color, opacity: 0.72 }));
      } else {
        svg.append(svgEl("circle", { cx: ex.x, cy: ex.y, r: ex.r, fill: "none", stroke: ex.color, "stroke-width": 8, opacity: 0.72 }));
      }
    }

    // 视线跳轨连线
    for (let i = 0; i < m.path.length - 1; i++) {
      const a = m.nodes[m.path[i]];
      const b = m.nodes[m.path[i + 1]];
      const lit = stepHighlight === -1 || stepHighlight >= i + 1;
      const mx = (a.x + b.x) / 2 + (a.y - b.y) * 0.14;
      const my = (a.y + b.y) / 2 + (b.x - a.x) * 0.14;
      svg.append(svgEl("path", {
        d: `M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`,
        fill: "none",
        stroke: activeMode === "tug" ? "#FF7547" : PALETTE.cream,
        "stroke-width": lit ? 2 : 1.2,
        "stroke-dasharray": "6 6",
        opacity: lit ? 0.85 : 0.25,
      }));
    }

    // 焦点节点
    m.nodes.forEach((n, idx) => {
      const isLit = stepHighlight === idx;
      if (isLit) {
        svg.append(svgEl("circle", { cx: n.x, cy: n.y, r: n.r + 12, fill: "none", stroke: PALETTE.cream, "stroke-width": 2, "stroke-dasharray": "4 4" }));
      }
      svg.append(svgEl("circle", { cx: n.x, cy: n.y, r: n.r, fill: n.color }));
      svg.append(svgEl("text", {
        x: n.x, y: n.y + 5,
        fill: n.color === "#6A5C30" ? PALETTE.cream : PALETTE.obsidian,
        "font-family": "Space Mono, monospace",
        "font-size": 15,
        "font-weight": 700,
        "text-anchor": "middle",
      }, n.order ? `#${n.order}` : "?"));

      const labelY = n.y > 260 ? n.y + n.r + 22 : n.y - n.r - 14;
      svg.append(svgEl("text", {
        x: Math.max(104, Math.min(536, n.x)),
        y: Math.max(24, Math.min(404, labelY)),
        fill: PALETTE.cream,
        "font-size": 12.5,
        "font-weight": 700,
        "text-anchor": "middle",
      }, n.tag));
    });

    readout.textContent = m.note;
  }

  for (const tab of $$(".rtab")) {
    tab.addEventListener("click", () => {
      clearInterval(timer);
      stepHighlight = -1;
      activeMode = tab.dataset.relay;
      for (const t of $$(".rtab")) t.setAttribute("aria-selected", String(t === tab));
      draw();
    });
  }

  playBtn?.addEventListener("click", () => {
    clearInterval(timer);
    if (reducedMotion.matches) {
      stepHighlight = (stepHighlight + 1) % 3;
      draw();
      return;
    }
    stepHighlight = 0;
    draw();
    timer = setInterval(() => {
      stepHighlight++;
      if (stepHighlight > 2) {
        clearInterval(timer);
        stepHighlight = -1;
      }
      draw();
    }, 680);
  });

  draw();
}

/* ============================================================================
   02 节：为什么乱扔不是分散（棋盘 / 白噪声 / 泊松盘蓝噪声 2D Canvas）
   ============================================================================ */
function initSection02() {
  const canvas = $("#noise-canvas");
  const histSvg = $("#noise-hist");
  const verdict = $("#noise-verdict");
  const histCap = $("#hist-cap");
  if (!canvas || !histSvg) return;
  const ctx = canvas.getContext("2d");

  const cfg = {
    mode: "white",
    count: 24,
    radPct: 13,
    seed: 6201,
    halo: true,
  };

  const COLORS = [PALETTE.yellow, PALETTE.lavender, PALETTE.orange, PALETTE.jade, PALETTE.pink, PALETTE.cream];

  function draw() {
    const r = canvas.parentElement.getBoundingClientRect();
    const w = Math.max(240, Math.round(r.width));
    const h = Math.max(180, Math.round(r.height));
    const dpr = pixelRatio(2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const res = generateDistribution(cfg.mode, cfg.count, cfg.radPct / 100, cfg.seed);
    const unit = Math.min(w, h);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#0D0E10";
    ctx.fillRect(0, 0, w, h);

    // 碰撞红连线
    ctx.strokeStyle = PALETTE.warn;
    ctx.lineWidth = 1.6;
    for (let i = 0; i < res.pts.length; i++) {
      for (let j = i + 1; j < res.pts.length; j++) {
        const d = Math.hypot(res.pts[i].x - res.pts[j].x, res.pts[i].y - res.pts[j].y);
        if (d < res.collideThresh) {
          ctx.beginPath();
          ctx.moveTo(res.pts[i].x * w, res.pts[i].y * h);
          ctx.lineTo(res.pts[j].x * w, res.pts[j].y * h);
          ctx.stroke();
        }
      }
    }

    // 呼吸气囊
    if (cfg.halo) {
      const hr = (cfg.radPct / 200) * unit;
      ctx.strokeStyle = cfg.mode === "poisson" ? "rgba(44, 200, 167, 0.36)" : "rgba(180, 150, 234, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      for (const p of res.pts) {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, hr, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // 点体（带轻度体量变化呼应 062 语言）
    res.pts.forEach((p, idx) => {
      const cx = p.x * w, cy = p.y * h;
      const rad = idx === 0 ? 11 : idx < 4 ? 8 : 5.5;
      ctx.fillStyle = COLORS[idx % COLORS.length];
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 实测统计
    $("#ns-min").textContent = `${(res.minNN * 100).toFixed(1)}%`;
    $("#ns-cv").textContent = `${Math.round(res.cv * 100)}%`;
    $("#ns-col").textContent = `${res.tooClose} 对`;

    if (cfg.mode === "grid") {
      verdict.innerHTML = `<h3>规则网格：间距分毫不差，反而呆板僵硬</h3><p>每个点到最近邻的距离完全一致（变异度 CV 接近 ${Math.round(res.cv * 100)}%）。眼睛立刻抽离出横竖直线，把画面读成表格或棋盘，轻盈自由的漫游感消失殆尽。</p>`;
      histCap.textContent = "直方图塌成一根孤立竖柱：说明全部间距毫无变化。";
    } else if (cfg.mode === "white") {
      verdict.innerHTML = `<h3>纯随机白噪声：越「随便」越容易扎堆撞车</h3><p>独立均匀随机并不保证彼此避让——当前实测立刻撞出 ${res.tooClose} 对过挤粘连，同时留下大片毫无回应的荒地。这就是为什么闭眼乱扔绝不等于分散构图。</p>`;
      histCap.textContent = "直方图左端一直贴近 0：代表频繁出现零间距撞车与偶发巨洞。";
    } else {
      verdict.innerHTML = `<h3>泊松盘蓝噪声：保底呼吸距 + 自由错落角</h3><p>类似 1983 年耶洛特在视网膜中发现的视锥排布与 1986 年库克提出的泊松盘采样：既守住 ${(res.minNN * 100).toFixed(1)}% 的最小呼吸缝（过挤 ${res.tooClose} 对），又让间距保有 ${Math.round(res.cv * 100)}% 的自然起伏。</p>`;
      histCap.textContent = "直方图左端留出干净「禁碰空区」，中间隆起自然起伏的节奏峰。";
    }

    // 绘制直方图
    histSvg.replaceChildren();
    const bins = 12;
    const maxScale = 0.28;
    const counts = new Array(bins).fill(0);
    for (const d of res.nns) {
      const b = Math.min(bins - 1, Math.floor((d / maxScale) * bins));
      counts[b]++;
    }
    const peak = Math.max(1, ...counts);
    const barW = 320 / bins;
    const threshX = 20 + Math.min(1, res.collideThresh / maxScale) * 320;
    histSvg.append(svgEl("rect", { x: 20, y: 12, width: threshX - 20, height: 74, fill: "rgba(255,107,74,0.12)" }));
    histSvg.append(svgEl("line", { x1: threshX, y1: 10, x2: threshX, y2: 88, stroke: PALETTE.warn, "stroke-dasharray": "3 3" }));

    counts.forEach((c, i) => {
      const bh = (c / peak) * 66;
      const x = 20 + i * barW + 2;
      const inWarn = (i + 0.5) / bins * maxScale < res.collideThresh;
      histSvg.append(svgEl("rect", {
        x, y: 86 - bh, width: barW - 4, height: bh,
        fill: inWarn ? PALETTE.warn : cfg.mode === "poisson" ? PALETTE.jadeBright : PALETTE.lavenderBright,
      }));
    });
    histSvg.append(svgEl("text", { x: 22, y: 103, fill: "#C3BCB0", "font-size": 10.5, "font-family": "Space Mono, monospace" }, "0% 撞车"));
    histSvg.append(svgEl("text", { x: 338, y: 103, fill: "#C3BCB0", "font-size": 10.5, "font-family": "Space Mono, monospace", "text-anchor": "end" }, "28% 疏朗"));
  }

  for (const b of $$("[data-dist]")) {
    b.addEventListener("click", () => {
      cfg.mode = b.dataset.dist;
      for (const x of $$("[data-dist]")) x.setAttribute("aria-pressed", String(x === b));
      draw();
    });
  }

  $("#n-count")?.addEventListener("input", (e) => {
    cfg.count = +e.target.value;
    $("#n-count-out").textContent = String(cfg.count);
    draw();
  });

  $("#n-rad")?.addEventListener("input", (e) => {
    cfg.radPct = +e.target.value;
    $("#n-rad-out").textContent = `${cfg.radPct}%`;
    draw();
  });

  $("#n-reseed")?.addEventListener("click", () => {
    cfg.seed = (cfg.seed * 1664525 + 1013904223) >>> 0;
    draw();
  });

  $("#n-halo")?.addEventListener("click", (e) => {
    cfg.halo = !cfg.halo;
    e.currentTarget.setAttribute("aria-pressed", String(cfg.halo));
    e.currentTarget.textContent = cfg.halo ? "气囊环：开" : "气囊环：关";
    draw();
  });

  new ResizeObserver(draw).observe(canvas.parentElement);
  draw();
}

/* ============================================================================
   03 节：散而不散的隐形丝线（四重隐形联系开关）
   ============================================================================ */
function initSection03() {
  const svg = $("#ties-svg");
  const statusEl = $("#ties-status");
  if (!svg) return;

  const ties = { color: true, shape: true, scale: true, balance: true };
  const CLASH = ["#78FF00", "#FF00AA", "#00E1FF", "#A86E2D", "#D1FF4A", "#FF4040", "#4A66FF", "#9B870C", "#B6FFCE"];

  function draw() {
    svg.replaceChildren();
    svg.append(svgEl("rect", { x: 0, y: 0, width: 640, height: 440, fill: PALETTE.obsidian }));

    // 同一套 062 原海报相对坐标
    const nodes = ITEM_DEFS.map((d, idx) => ({
      ...d,
      cx: d.posterX * 600 + 20,
      cy: d.posterY * 365 + 20,
      rr: ties.scale ? d.posterR * 390 : 25,
      col: ties.color ? d.color : CLASH[idx % CLASH.length],
      hidden: !ties.balance && (d.id === "jade" || d.id === "dotP" || d.id === "gridW"),
    }));

    // 色彩回声丝线（仅当 color 开启时）
    if (ties.color) {
      const purples = nodes.filter((n) => !n.hidden && n.color === PALETTE.lavender);
      for (let i = 0; i < purples.length - 1; i++) {
        svg.append(svgEl("line", {
          x1: purples[i].cx, y1: purples[i].cy, x2: purples[i + 1].cx, y2: purples[i + 1].cy,
          stroke: PALETTE.lavenderBright, "stroke-width": 1.3, "stroke-dasharray": "4 5", opacity: 0.65,
        }));
      }
      const creams = nodes.filter((n) => !n.hidden && n.color === PALETTE.cream);
      if (creams.length === 2) {
        svg.append(svgEl("line", {
          x1: creams[0].cx, y1: creams[0].cy, x2: creams[1].cx, y2: creams[1].cy,
          stroke: PALETTE.cream, "stroke-width": 1.2, "stroke-dasharray": "4 5", opacity: 0.5,
        }));
      }
    }

    // 绘制各元素
    nodes.forEach((n, idx) => {
      if (n.hidden) return;
      if (!ties.shape) {
        // 关掉几何家族后变成互不统属的杂乱形态
        const pts = [];
        const spikes = 5 + (idx % 4);
        for (let k = 0; k < spikes * 2; k++) {
          const ang = (k * Math.PI) / spikes + idx * 0.4;
          const rad = k % 2 === 0 ? n.rr : n.rr * (0.45 + (idx % 3) * 0.14);
          pts.push(`${(n.cx + Math.cos(ang) * rad).toFixed(1)},${(n.cy + Math.sin(ang) * rad).toFixed(1)}`);
        }
        svg.append(svgEl("polygon", { points: pts.join(" "), fill: n.col }));
      } else if (n.kind === "circle") {
        svg.append(svgEl("circle", { cx: n.cx, cy: n.cy, r: n.rr, fill: n.col }));
      } else if (n.kind === "ring") {
        const lw = Math.max(8, n.rr * 0.42);
        svg.append(svgEl("circle", { cx: n.cx, cy: n.cy, r: n.rr - lw / 2, fill: "none", stroke: n.col, "stroke-width": lw }));
      } else if (n.kind === "square") {
        const s = n.rr * 1.75;
        svg.append(svgEl("rect", { x: n.cx - s / 2, y: n.cy - s / 2, width: s, height: s, fill: n.col }));
      } else if (n.kind === "grid") {
        const st = Math.max(7, n.rr * 0.65);
        for (let gy = -1; gy <= 1; gy++) {
          for (let gx = -1; gx <= 1; gx++) {
            svg.append(svgEl("circle", { cx: n.cx + gx * st, cy: n.cy + gy * st, r: 3.1, fill: n.col }));
          }
        }
      }
    });

    // 底部杠杆平衡条（实时反映 balance 开关）
    const tiltDeg = ties.balance ? 0 : 9.5;
    const g = svgEl("g", { transform: `translate(320 406) rotate(${tiltDeg})` });
    g.append(svgEl("line", { x1: -180, y1: 0, x2: 180, y2: 0, stroke: ties.balance ? PALETTE.jadeBright : PALETTE.warn, "stroke-width": 2.4 }));
    g.append(svgEl("circle", { cx: -180, cy: 0, r: 4, fill: ties.balance ? PALETTE.jadeBright : PALETTE.warn }));
    g.append(svgEl("circle", { cx: 180, cy: 0, r: 4, fill: ties.balance ? PALETTE.jadeBright : PALETTE.warn }));
    svg.append(g);
    svg.append(svgEl("polygon", { points: "320,408 310,426 330,426", fill: PALETTE.cream }));
    svg.append(svgEl("text", {
      x: 320, y: 396, fill: ties.balance ? PALETTE.jadeBright : "#FF9475",
      "font-size": 12, "font-weight": 700, "text-anchor": "middle",
    }, ties.balance ? "跨空杠杆平衡" : "左下配重撤走 · 整页右沉"));

    const onCount = Object.values(ties).filter(Boolean).length;
    if (onCount === 4) {
      statusEl.textContent = "4/4 隐形丝线全连结：即使元素远离彼此，色彩回声、几何家族、大小级差与杠杆配平仍把整张黑底织成一体。";
    } else if (onCount === 0) {
      statusEl.textContent = "0/4 全部断开：坐标一个像素都没动，但失去呼应、统一语汇、级差与配平后，分散构图彻底退化成一盘散沙。";
    } else {
      const offNames = [
        !ties.color && "色彩回声",
        !ties.shape && "几何家族",
        !ties.scale && "大小级差",
        !ties.balance && "杠杆配平",
      ].filter(Boolean).join("、");
      statusEl.textContent = `当前保留 ${onCount}/4 条隐形丝线——断掉「${offNames}」后，画面凝聚力明显下降。`;
    }
  }

  for (const card of $$(".tie-card")) {
    card.addEventListener("click", () => {
      const k = card.dataset.tie;
      ties[k] = !ties[k];
      card.setAttribute("aria-pressed", String(ties[k]));
      $(".tie-state", card).textContent = ties[k] ? "已连结" : "已断开";
      draw();
    });
  }

  draw();
}

/* ============================================================================
   04 节：从散书到蓝噪声（五时期演进时间卷）
   ============================================================================ */
function initSection04() {
  const svg = $("#era-svg");
  const copy = $("#era-copy");
  if (!svg || !copy) return;

  const ERAS = [
    {
      title: "日本平安时代「散らし書き」",
      meta: "794–1185 平安宫廷 · 1620s 本阿弥光悦与俵屋宗达复兴",
      p1: "早在网格出版出现之前，平安时代的假名和歌书法就发明了名为「散らし書き（Chirashigaki，字面即散写）」的版面文法：书家刻意打断整齐的竖排起止线，让长短不一的诗行在染纸与金泥底画上错落飘散。",
      p2: "江户初期，本阿弥光悦与俵屋宗达合作的《秋之歌卷》（大都会艺术博物馆藏）把这种散写推向高峰——借行距疏密、墨色浓淡与大面积留白，迫使眼睛放慢速度，把文字直接读成一幅呼吸起伏的画面。",
      takeaway: "给今天的启示：分散从来不是为了省事，而是有意拆解机械线性，换取诗意的漫游节奏。",
      render(s) {
        s.append(svgEl("rect", { x: 0, y: 0, width: 560, height: 340, fill: "#121018" }));
        // 金粉底云示意
        s.append(svgEl("ellipse", { cx: 180, cy: 230, rx: 140, ry: 44, fill: "rgba(245,194,32,0.09)" }));
        s.append(svgEl("ellipse", { cx: 410, cy: 110, rx: 110, ry: 34, fill: "rgba(148,113,205,0.12)" }));
        // 错落竖行书柱（浓淡高矮各异）
        const cols = [
          { x: 485, y: 42, h: 118, w: 6, op: 0.92 },
          { x: 448, y: 78, h: 146, w: 4, op: 0.65 },
          { x: 396, y: 148, h: 126, w: 7, op: 0.96 },
          { x: 355, y: 120, h: 92, w: 3.5, op: 0.55 },
          { x: 266, y: 54, h: 132, w: 6, op: 0.88 },
          { x: 226, y: 102, h: 148, w: 4, op: 0.68 },
          { x: 142, y: 162, h: 120, w: 7, op: 0.95 },
          { x: 96, y: 194, h: 86, w: 4, op: 0.62 },
        ];
        for (const c of cols) {
          s.append(svgEl("rect", { x: c.x, y: c.y, width: c.w, height: c.h, rx: c.w / 2, fill: PALETTE.cream, opacity: c.op }));
        }
        s.append(svgEl("text", { x: 28, y: 314, fill: PALETTE.yellow, "font-size": 12, "font-family": "Space Mono, monospace" }, "CHIRASHIGAKI · 错落行高 + 留白漫游"));
      },
    },
    {
      title: "康定斯基与「非中心自由张力」",
      meta: "Wassily Kandinsky · 《点与线到面》 · 1926 (Bauhausbücher 9)",
      p1: "瓦西里·康定斯基在包豪斯丛书第 9 卷《点与线到面》（1926 德文首版，1947 古根海姆英译本）里，把「基本平面（Grundfläche）」拆成上轻下重、左松右紧的受力场。",
      p2: "他指出：点一旦离开几何中心向外分散，并不会失去存在感——相反，偏离中心、靠近边角的独立点会激发出更强的边缘张力，只需用小面积高对比色块就能在空旷处与大形抗衡。",
      takeaway: "给今天的启示：画布每个象限自带不同「重力」，把圆点挪出中心正是张力诞生的起点。",
      render(s) {
        s.append(svgEl("rect", { x: 0, y: 0, width: 560, height: 340, fill: "#0C0B12" }));
        s.append(svgEl("rect", { x: 110, y: 34, width: 340, height: 252, fill: "none", stroke: "#48425E", "stroke-width": 1.6 }));
        s.append(svgEl("line", { x1: 110, y1: 160, x2: 450, y2: 160, stroke: "#322D45", "stroke-dasharray": "4 4" }));
        s.append(svgEl("line", { x1: 280, y1: 34, x2: 280, y2: 286, stroke: "#322D45", "stroke-dasharray": "4 4" }));
        s.append(svgEl("circle", { cx: 376, cy: 96, r: 34, fill: PALETTE.yellow }));
        s.append(svgEl("circle", { cx: 184, cy: 216, r: 16, fill: PALETTE.orange }));
        s.append(svgEl("circle", { cx: 344, cy: 232, r: 22, fill: PALETTE.lavender }));
        // 张力箭头
        s.append(svgEl("line", { x1: 376, y1: 96, x2: 446, y2: 40, stroke: PALETTE.yellow, "stroke-width": 1.4, "stroke-dasharray": "3 3" }));
        s.append(svgEl("line", { x1: 184, y1: 216, x2: 116, y2: 278, stroke: PALETTE.orange, "stroke-width": 1.4, "stroke-dasharray": "3 3" }));
        s.append(svgEl("text", { x: 28, y: 318, fill: PALETTE.lavenderBright, "font-size": 12, "font-family": "Space Mono, monospace" }, "1926 · ACENTRIC TENSION ON BASIC PLANE"));
      },
    },
    {
      title: "格林伯格与「满幅去中心」构图",
      meta: "Clement Greenberg · 《架上画的危机》 · Partisan Review, 1948",
      p1: "1948 年 4 月，艺术评论家克莱门特·格林伯格在《党派评论》发表《架上画的危机》，指出杰克逊·波洛克、马克·托比等人打破了文艺复兴以来「单一中心高潮 + 四周陪衬」的舞台式构图，开创了「满幅（All-Over / 复调式）」分散结构。",
      p2: "但格林伯格同时发出了极其敏锐的警告：一旦整张画处处完全等权、毫无起伏，就会滑向可以无限裁切的「装饰壁纸」。好的分散构图，必须在去中心与内部节律之间守住画框边界的张力。",
      takeaway: "给今天的启示：去中心不等于「一碗水端平」——保留强弱节律，才能避免沦为平庸壁纸。",
      render(s) {
        s.append(svgEl("rect", { x: 0, y: 0, width: 560, height: 340, fill: "#0C0B12" }));
        // 左：传统中心金字塔
        s.append(svgEl("rect", { x: 34, y: 42, width: 220, height: 220, fill: "#15131F", stroke: "#48425E" }));
        s.append(svgEl("polygon", { points: "144,82 72,226 216,226", fill: "none", stroke: "#8A849E", "stroke-dasharray": "4 4" }));
        s.append(svgEl("circle", { cx: 144, cy: 146, r: 30, fill: "#8A849E" }));
        s.append(svgEl("text", { x: 144, y: 286, fill: "#C3BCB0", "font-size": 12.5, "text-anchor": "middle" }, "传统单一中心舞台"));
        // 右：满幅多点分散
        s.append(svgEl("rect", { x: 306, y: 42, width: 220, height: 220, fill: "#15131F", stroke: PALETTE.purple }));
        const dots = [[354, 86, 20, PALETTE.yellow], [468, 92, 13, PALETTE.orange], [420, 152, 16, PALETTE.lavender], [346, 198, 12, PALETTE.jade], [478, 212, 18, PALETTE.cream], [404, 232, 9, PALETTE.pink]];
        for (const [x, y, r, c] of dots) s.append(svgEl("circle", { cx: x, cy: y, r, fill: c }));
        s.append(svgEl("text", { x: 416, y: 286, fill: PALETTE.cream, "font-size": 12.5, "font-weight": 700, "text-anchor": "middle" }, "1948 去中心多点场"));
        s.append(svgEl("text", { x: 280, y: 158, fill: PALETTE.yellow, "font-size": 22, "text-anchor": "middle" }, "→"));
      },
    },
    {
      title: "阿恩海姆与「跨空视觉杠杆」",
      meta: "Rudolf Arnheim · 《艺术与视知觉》 · 1954 / 1974 修订版",
      p1: "格式塔心理学家鲁道夫·阿恩海姆在《艺术与视知觉》第一章《平衡》里阐明：眼睛感知的不是像素面积，而是类似物理杠杆的「视觉重量」——面积、明度反差、孤立程度以及离画心的距离都会放大重量。",
      p2: "这正是分散构图能「不对称却极稳」的力学原理：右上角一枚大面积明黄圆，不需要在左上角放另一枚同样大的圆去死对称；在左下角较远处摆一块高饱和小色块，借更长的力臂就能把整张画面悄然配平。",
      takeaway: "给今天的启示：分散排布靠「远小配近大」达成动态平衡，绝不必牺牲自由度去换稳定。",
      render(s) {
        s.append(svgEl("rect", { x: 0, y: 0, width: 560, height: 340, fill: "#0C0B12" }));
        // 杠杆与支点
        s.append(svgEl("line", { x1: 86, y1: 196, x2: 474, y2: 196, stroke: PALETTE.cream, "stroke-width": 2.4 }));
        s.append(svgEl("polygon", { points: "280,198 264,234 296,234", fill: PALETTE.purple }));
        // 短臂大重物
        s.append(svgEl("circle", { cx: 368, cy: 146, r: 44, fill: PALETTE.yellow }));
        s.append(svgEl("text", { x: 368, y: 222, fill: PALETTE.yellow, "font-size": 12, "font-family": "Space Mono, monospace", "text-anchor": "middle" }, "近臂 × 大体量"));
        // 长臂小高对比物
        s.append(svgEl("circle", { cx: 118, cy: 168, r: 22, fill: PALETTE.orange }));
        s.append(svgEl("text", { x: 118, y: 222, fill: PALETTE.orangeBright, "font-size": 12, "font-family": "Space Mono, monospace", "text-anchor": "middle" }, "长臂 × 高对比"));
        s.append(svgEl("text", { x: 28, y: 314, fill: PALETTE.jadeBright, "font-size": 12, "font-family": "Space Mono, monospace" }, "1954 · ASYMMETRICAL VISUAL LEVERAGE"));
      },
    },
    {
      title: "视网膜视锥与「泊松盘蓝噪声」",
      meta: "John I. Yellott Jr. (Science, 1983) · Robert L. Cook (ACM TOG, 1986)",
      p1: "1983 年，视觉科学家约翰·耶洛特在《Science》发表研究，发现灵长类视网膜的视锥细胞既不排成整齐网格（会产生摩尔纹混叠），也不像纯白噪声那样杂乱重叠，而是遵守「不规则角度 + 最小安全间距」的排布。",
      p2: "1986 年，皮克斯元老罗伯特·库克在《ACM Transactions on Graphics》发表经典论文《Stochastic Sampling in Computer Graphics》，将这一发现引入计算机图形学，推广了泊松盘（Poisson-disc）采样与飞镖投掷算法——这也是当代设计里最自然的分散排布数学模型。",
      takeaway: "给今天的启示：人眼天生偏爱「有最小净距的无序」，这解释了为什么泊松散排永远比乱扔耐看。",
      render(s) {
        s.append(svgEl("rect", { x: 0, y: 0, width: 560, height: 340, fill: "#0C0B12" }));
        const dist = generateDistribution("poisson", 18, 0.16, 1986);
        const cols = [PALETTE.yellow, PALETTE.lavender, PALETTE.orange, PALETTE.jade, PALETTE.pink, PALETTE.cream];
        dist.pts.forEach((p, i) => {
          const cx = 40 + p.x * 480;
          const cy = 24 + p.y * 260;
          s.append(svgEl("circle", { cx, cy, r: 28, fill: "rgba(44,200,167,0.08)", stroke: "rgba(44,200,167,0.45)", "stroke-dasharray": "3 3" }));
          s.append(svgEl("circle", { cx, cy, r: 7, fill: cols[i % cols.length] }));
        });
        s.append(svgEl("text", { x: 28, y: 316, fill: PALETTE.jadeBright, "font-size": 12, "font-family": "Space Mono, monospace" }, "1983–1986 · POISSON-DISC BLUE NOISE"));
      },
    },
  ];

  function renderEra(idx) {
    const e = ERAS[idx];
    svg.replaceChildren();
    e.render(svg);
    copy.innerHTML = `
      <h3>${e.title}</h3>
      <p class="era-meta">${e.meta}</p>
      <p>${e.p1}</p>
      <p>${e.p2}</p>
      <p class="era-takeaway">${e.takeaway}</p>
    `;
  }

  for (const tab of $$(".etab")) {
    tab.addEventListener("click", () => {
      for (const t of $$(".etab")) t.setAttribute("aria-selected", String(t === tab));
      renderEra(+tab.dataset.era);
    });
  }

  renderEra(0);
}

/* ============================================================================
   05 节：真实版面怎么散开（三实景 + 留白松紧度推子）
   ============================================================================ */
function initSection05() {
  const svg = $("#scene-svg");
  const notes = $("#scene-notes");
  const slider = $("#density-range");
  const lbl = $("#density-lbl");
  if (!svg || !slider) return;

  let activeScene = "poster";

  const lerp = (a, b, t) => a + (b - a) * t;

  const SCENES = {
    poster: {
      name: "独立艺术展海报",
      bullets: [
        "主标题与展期不必粘成一大块，错落置于左上与右下，中间让大色块与几何图形接力引导。",
        "保留 70% 左右深色留白，展品信息读起来反而像美术馆墙面一样从容。",
      ],
      items: [
        // [packedX, packedY, openX, openY, sparseX, sparseY, type, label, color, w, h]
        [200, 150, 76, 68, 22, 26, "title", "声浪与留白", PALETTE.cream, 180, 44],
        [200, 204, 480, 88, 566, 46, "circle", "01 主视觉", PALETTE.yellow, 54, 54],
        [290, 204, 514, 240, 594, 226, "circle", "02 副节奏", PALETTE.lavender, 36, 36],
        [360, 204, 276, 262, 180, 344, "circle", "03 亮锚点", PALETTE.orange, 22, 22],
        [200, 268, 86, 316, 26, 372, "tag", "10.12 — 11.28 · 东馆三厅", PALETTE.jade, 178, 32],
        [390, 268, 492, 352, 578, 386, "ring", "", PALETTE.cream, 34, 34],
      ],
    },
    mood: {
      name: "杂志开篇情绪板",
      bullets: [
        "让主摄影卡片、色票块、手写引言与页码各自占领不同象限，读者像翻阅桌面剪报一样自由浏览。",
        "大小图块必须拉开 3 倍以上面积差，否则情绪板会退化成呆板照片墙。",
      ],
      items: [
        [185, 132, 68, 56, 20, 22, "card", "主视觉静物", PALETTE.yellow, 190, 130],
        [385, 132, 434, 70, 526, 28, "card", "材质特写", PALETTE.lavender, 140, 96],
        [185, 272, 118, 294, 28, 342, "tag", "ISSUE 09 · LIGHT & AIR", PALETTE.cream, 174, 30],
        [385, 272, 348, 232, 310, 198, "card", "色票摘录", PALETTE.orange, 108, 74],
        [505, 272, 528, 326, 588, 366, "card", "手记", PALETTE.jade, 92, 62],
      ],
    },
    folio: {
      name: "创意作品集首屏",
      bullets: [
        "首屏中央稳住设计师姓名与简短主张，周围以不对称距离悬浮 3–4 张代表作缩略卡，自带策展感。",
        "注意把核心入口（作品目录 / 联系）保留清晰明度反差，避免开放氛围掩盖导航。",
      ],
      items: [
        [240, 168, 240, 186, 238, 188, "title", "LIN · STUDIO", PALETTE.cream, 200, 44],
        [240, 224, 92, 68, 22, 22, "card", "01 视觉识别", PALETTE.yellow, 146, 88],
        [396, 224, 488, 78, 558, 26, "card", "02 动态字体", PALETTE.lavender, 126, 82],
        [240, 296, 106, 308, 24, 348, "card", "03 展陈空间", PALETTE.jade, 124, 78],
        [380, 296, 496, 314, 570, 354, "tag", "选集索引 ↗", PALETTE.orange, 114, 34],
      ],
    },
  };

  function draw() {
    const val = +slider.value; // 0..100
    const sc = SCENES[activeScene];
    svg.replaceChildren();
    svg.append(svgEl("rect", { x: 0, y: 0, width: 680, height: 430, fill: PALETTE.obsidian }));

    // 计算当前插值比例：0..62 从密排到理想散排，62..100 从理想散排到贴边空洞
    const isOver = val > 78;
    const isTight = val < 42;
    const voidEst = Math.round(46 + val * 0.44);

    let zoneText = `理想散排 · 估算留白 ${voidEst}%`;
    let pillText = "经验甜区 · 开放透气";
    let warn = false;
    let diag = "元素跨象限拉开呼吸缝，同时保留主次面积差与视线呼应；画面轻盈、有策展质感。";

    if (isTight) {
      zoneText = `挤闷密排 · 估算留白 ${voidEst}%`;
      pillText = "过挤发堵 · 失去呼吸";
      warn = true;
      diag = "标题、图形与标签全挤在画布中央互相贴边，周围空出一圈死边；开放感与多向节奏全部憋死。";
    } else if (isOver) {
      zoneText = `过度稀碎 · 估算留白 ${voidEst}%`;
      pillText = "贴边散架 · 失去联系";
      warn = true;
      diag = "元素被推到四条边框角落，彼此距离超出视线回声范围，中央塌成冷清的大空洞，画面像没排完的半成品。";
    }
    lbl.textContent = zoneText;

    // 淡十字留白星标（仅甜区清晰浮现）
    if (!isTight && !isOver) {
      for (const [px, py] of [[358, 124], [392, 340], [190, 210]]) {
        svg.append(svgEl("path", { d: `M${px - 5},${py} H${px + 5} M${px},${py - 5} V${py + 5}`, stroke: "rgba(243,236,222,0.4)", "stroke-width": 1.5 }));
      }
    }

    for (const row of sc.items) {
      const [px, py, ox, oy, sx, sy, type, text, col, w, h] = row;
      let x, y;
      if (val <= 62) {
        const u = val / 62;
        x = lerp(px, ox, u);
        y = lerp(py, oy, u);
      } else {
        const u = (val - 62) / 38;
        x = lerp(ox, sx, u);
        y = lerp(oy, sy, u);
      }

      if (type === "circle") {
        svg.append(svgEl("circle", { cx: x, cy: y, r: w, fill: col }));
        if (w >= 34) {
          svg.append(svgEl("text", { x, y: y + 4, fill: PALETTE.obsidian, "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, text));
        } else {
          svg.append(svgEl("text", { x, y: y + w + 16, fill: PALETTE.cream, "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, text));
        }
      } else if (type === "ring") {
        svg.append(svgEl("circle", { cx: x, cy: y, r: w, fill: "none", stroke: col, "stroke-width": 12 }));
      } else if (type === "title") {
        svg.append(svgEl("text", { x, y: y + 26, fill: col, "font-size": 28, "font-weight": 900 }, text));
        svg.append(svgEl("rect", { x, y: y + 36, width: 42, height: 3, fill: PALETTE.purple }));
      } else if (type === "tag") {
        svg.append(svgEl("rect", { x, y, width: w, height: h, fill: col }));
        svg.append(svgEl("text", { x: x + w / 2, y: y + h / 2 + 4.5, fill: PALETTE.obsidian, "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, text));
      } else if (type === "card") {
        svg.append(svgEl("rect", { x, y, width: w, height: h, fill: "#181920", stroke: col, "stroke-width": 2 }));
        svg.append(svgEl("rect", { x: x + 10, y: y + 10, width: w - 20, height: h * 0.45, fill: col, opacity: 0.85 }));
        svg.append(svgEl("text", { x: x + 10, y: y + h - 12, fill: PALETTE.cream, "font-size": 12, "font-weight": 700 }, text));
      }
    }

    if (isOver) {
      svg.append(svgEl("circle", { cx: 340, cy: 215, r: 94, fill: "none", stroke: PALETTE.warn, "stroke-width": 1.6, "stroke-dasharray": "6 6" }));
      svg.append(svgEl("text", { x: 340, y: 220, fill: "#FF9475", "font-size": 13, "font-weight": 700, "text-anchor": "middle" }, "中央失联空洞"));
    }

    notes.innerHTML = `
      <span class="sn-pill ${warn ? "is-warn" : ""}">${pillText}</span>
      <h3>${sc.name}</h3>
      <p>${diag}</p>
      <ul>${sc.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
    `;
  }

  for (const b of $$("[data-scene]")) {
    b.addEventListener("click", () => {
      activeScene = b.dataset.scene;
      for (const x of $$("[data-scene]")) x.setAttribute("aria-pressed", String(x === b));
      draw();
    });
  }
  slider.addEventListener("input", draw);
  draw();
}

/* ============================================================================
   06 节：什么时候别用分散（四类反例翻卡对比）
   ============================================================================ */
function initSection06() {
  const svg = $("#anti-svg");
  const copy = $("#anti-copy");
  const tag = $("#anti-state-tag");
  const flipBtn = $("#anti-flip");
  if (!svg) return;

  const CASES = [
    {
      badTitle: "结账弹窗硬用分散：用户找半天「去付款」",
      badText: "金额躲在右上、商品缩在左下、支付按钮漂在右下、取消藏在左上——视线被扯向四个方向，紧急操作或转化关键步会直接流失用户。",
      fixTitle: "改用 061 聚类构图：核心决策打包成唯一视觉簇",
      fixText: "把总价、核心主按钮与辅助取消紧聚成清晰的一组，扫视一步到位，零犹豫。",
      linkId: "061",
      linkName: "061 聚类构图",
      drawBad(s) {
        s.append(svgEl("rect", { x: 46, y: 36, width: 112, height: 34, fill: "#1F2028", stroke: "#555" }));
        s.append(svgEl("text", { x: 102, y: 58, fill: PALETTE.cream, "font-size": 12.5, "text-anchor": "middle" }, "取消订单"));
        s.append(svgEl("text", { x: 486, y: 74, fill: PALETTE.yellow, "font-size": 24, "font-weight": 900, "text-anchor": "middle" }, "¥ 298"));
        s.append(svgEl("rect", { x: 64, y: 244, width: 146, height: 42, fill: "#1B1D24", stroke: PALETTE.purple }));
        s.append(svgEl("text", { x: 137, y: 270, fill: PALETTE.cream, "font-size": 12.5, "text-anchor": "middle" }, "黑胶唱片 × 1"));
        s.append(svgEl("rect", { x: 416, y: 256, width: 130, height: 44, fill: PALETTE.orange }));
        s.append(svgEl("text", { x: 481, y: 283, fill: PALETTE.obsidian, "font-size": 13.5, "font-weight": 700, "text-anchor": "middle" }, "立即支付"));
        s.append(svgEl("path", { d: "M102,70 L486,84 L137,242 L481,254", fill: "none", stroke: PALETTE.warn, "stroke-dasharray": "5 5", "stroke-width": 1.6 }));
      },
      drawFix(s) {
        s.append(svgEl("rect", { x: 165, y: 58, width: 270, height: 224, fill: "#15161E", stroke: PALETTE.jadeBright, "stroke-width": 2 }));
        s.append(svgEl("text", { x: 300, y: 102, fill: "#C3BCB0", "font-size": 13, "text-anchor": "middle" }, "黑胶唱片 × 1"));
        s.append(svgEl("text", { x: 300, y: 146, fill: PALETTE.yellow, "font-size": 30, "font-weight": 900, "text-anchor": "middle" }, "¥ 298"));
        s.append(svgEl("rect", { x: 205, y: 174, width: 190, height: 44, fill: PALETTE.jadeBright }));
        s.append(svgEl("text", { x: 300, y: 201, fill: PALETTE.obsidian, "font-size": 14, "font-weight": 700, "text-anchor": "middle" }, "立即支付"));
        s.append(svgEl("text", { x: 300, y: 248, fill: "#C3BCB0", "font-size": 12.5, "text-anchor": "middle" }, "暂不结算 · 返回购物车"));
      },
    },
    {
      badTitle: "操作教程硬用分散：分不清哪步先做",
      badText: "四个步骤散落四方，读者要满屏搜寻编号 1、2、3、4，视线在画布上反复打结交叉，操作极易跳步。",
      fixTitle: "改用 058 阶梯构图 / 060 级联构图：拉出单向递进通道",
      fixText: "让步骤沿清晰斜线逐级递进，眼睛无需寻找编号也能顺势一步步读完。",
      linkId: "060",
      linkName: "060 级联构图",
      drawBad(s) {
        const pts = [[430, 86, "01 备豆"], [142, 240, "02 研磨"], [460, 250, "03 闷蒸"], [150, 88, "04 萃取"]];
        s.append(svgEl("path", { d: "M430,86 L142,240 L460,250 L150,88", fill: "none", stroke: PALETTE.warn, "stroke-dasharray": "5 5", "stroke-width": 1.8 }));
        for (const [x, y, t] of pts) {
          s.append(svgEl("rect", { x: x - 62, y: y - 22, width: 124, height: 44, fill: "#181A22", stroke: PALETTE.purple }));
          s.append(svgEl("text", { x, y: y + 5, fill: PALETTE.cream, "font-size": 13, "font-weight": 700, "text-anchor": "middle" }, t));
        }
      },
      drawFix(s) {
        const steps = ["01 备豆", "02 研磨", "03 闷蒸", "04 萃取"];
        steps.forEach((t, i) => {
          const x = 66 + i * 114, y = 52 + i * 56;
          s.append(svgEl("rect", { x, y, width: 132, height: 52, fill: "#151822", stroke: i === 0 ? PALETTE.yellow : PALETTE.jadeBright, "stroke-width": 1.8 }));
          s.append(svgEl("text", { x: x + 66, y: y + 31, fill: PALETTE.cream, "font-size": 13.5, "font-weight": 700, "text-anchor": "middle" }, t));
        });
      },
    },
    {
      badTitle: "价格参数硬用分散：根本没法横向比大小",
      badText: "三个套餐卡片错落飘浮在不同高度，价格与权益不在同一条水平线上，读者只能靠死记硬背来回核对。",
      fixTitle: "改用 057 棋盘构图：严格等距对齐，一眼横向比价",
      fixText: "让同等维度的信息严丝合缝落在同一行和同一列，把认知负担降到最低。",
      linkId: "057",
      linkName: "057 棋盘构图",
      drawBad(s) {
        const cards = [[62, 54, "基础版 ¥19"], [244, 186, "标准版 ¥49"], [424, 78, "专业版 ¥99"]];
        for (const [x, y, t] of cards) {
          s.append(svgEl("rect", { x, y, width: 136, height: 96, fill: "#181A22", stroke: PALETTE.warn }));
          s.append(svgEl("text", { x: x + 68, y: y + 54, fill: PALETTE.cream, "font-size": 13.5, "font-weight": 700, "text-anchor": "middle" }, t));
        }
      },
      drawFix(s) {
        const cols = [["基础版", "¥19", "10 GB"], ["标准版", "¥49", "100 GB"], ["专业版", "¥99", "1 TB"]];
        cols.forEach(([n, p, d], i) => {
          const x = 54 + i * 168;
          s.append(svgEl("rect", { x, y: 66, width: 154, height: 204, fill: "#151822", stroke: i === 1 ? PALETTE.yellow : PALETTE.jadeBright, "stroke-width": 1.6 }));
          s.append(svgEl("text", { x: x + 77, y: 112, fill: PALETTE.cream, "font-size": 14, "font-weight": 700, "text-anchor": "middle" }, n));
          s.append(svgEl("text", { x: x + 77, y: 164, fill: PALETTE.yellow, "font-size": 22, "font-weight": 900, "text-anchor": "middle" }, p));
          s.append(svgEl("line", { x1: x + 16, y1: 194, x2: x + 138, y2: 194, stroke: "#313440" }));
          s.append(svgEl("text", { x: x + 77, y: 232, fill: "#C3BCB0", "font-size": 13, "text-anchor": "middle" }, d));
        });
      },
    },
    {
      badTitle: "组织架构硬用分散：谁归谁管一头雾水",
      badText: "把总监、组长、执行岗自由散放在黑底上、撤掉清晰连线，读者只能猜谁向谁汇报——归属关系被彻底抹平。",
      fixTitle: "改用 063 分支构图 / 064 网络构图：显性骨架交代从属与连接",
      fixText: "用明确的主干分支标清上下级，或多节点连线交代协作关系（需要叠压景深则参考 059 层叠构图）。",
      linkId: "063",
      linkName: "063 分支构图",
      drawBad(s) {
        const nodes = [[140, 86, "视觉组"], [438, 102, "总策划"], [294, 240, "动效"], [126, 256, "文案"], [472, 236, "前端"]];
        for (const [x, y, t] of nodes) {
          s.append(svgEl("circle", { cx: x, cy: y, r: 30, fill: "#1A1C24", stroke: PALETTE.warn }));
          s.append(svgEl("text", { x, y: y + 5, fill: PALETTE.cream, "font-size": 12.5, "text-anchor": "middle" }, t));
        }
      },
      drawFix(s) {
        s.append(svgEl("path", { d: "M300,96 V148 M140,148 H460 M140,148 V212 M300,148 V212 M460,148 V212", fill: "none", stroke: PALETTE.jadeBright, "stroke-width": 2 }));
        s.append(svgEl("rect", { x: 242, y: 50, width: 116, height: 46, fill: PALETTE.yellow }));
        s.append(svgEl("text", { x: 300, y: 78, fill: PALETTE.obsidian, "font-size": 14, "font-weight": 700, "text-anchor": "middle" }, "总策划"));
        for (const [x, t] of [[140, "视觉与动效"], [300, "内容文案"], [460, "前端交互"]]) {
          s.append(svgEl("rect", { x: x - 56, y: 212, width: 112, height: 46, fill: "#151822", stroke: PALETTE.jadeBright }));
          s.append(svgEl("text", { x, y: 240, fill: PALETTE.cream, "font-size": 13, "text-anchor": "middle" }, t));
        }
      },
    },
  ];

  let idx = 0;
  let showFix = false;

  function draw() {
    const c = CASES[idx];
    svg.replaceChildren();
    svg.append(svgEl("rect", { x: 0, y: 0, width: 600, height: 340, fill: PALETTE.obsidian }));
    if (showFix) c.drawFix(svg);
    else c.drawBad(svg);

    tag.textContent = showFix ? `推荐替代 · ${c.linkName}` : "反例 · 硬用分散构图";
    tag.classList.toggle("is-fix", showFix);
    flipBtn.textContent = showFix ? "切回「分散翻车态」" : "切换到推荐替代方案";
    flipBtn.setAttribute("aria-pressed", String(showFix));

    copy.innerHTML = showFix
      ? `<p><strong>${c.fixTitle}</strong></p><p>${c.fixText} 详见 <a class="inline-link" href="https://layout.xiaoxiaodong.ai/${c.linkId}/play/" target="_blank" rel="noopener">${c.linkName}</a>。</p>`
      : `<p><strong>${c.badTitle}</strong></p><p>${c.badText}</p>`;
  }

  for (const btn of $$(".anti-btn")) {
    btn.addEventListener("click", () => {
      idx = +btn.dataset.anti;
      showFix = false;
      for (const b of $$(".anti-btn")) b.setAttribute("aria-selected", String(b === btn));
      draw();
    });
  }

  flipBtn?.addEventListener("click", () => {
    showFix = !showFix;
    draw();
  });

  draw();
}

/* ============================================================================
   07 节：练一练（单变量四选一黑底海报辨析）
   ============================================================================ */
function initSection07() {
  const feedback = $("#quiz-feedback");
  if (!feedback) return;

  // 四版完全相同的 7 件元素（仅坐标排布不同）
  // 元素顺序：黄大圆(r32), 紫中圆(r23), 橘红小圆(r14), 绿方(s26), 白空环(r24), 标题组(JAZZ), 日期(07/18)
  const OPTIONS = {
    A: {
      ok: false,
      verdict: "方案 A · 死板棋盘",
      why: "所有 7 件元素严格排在 3 列 3 行的隐形十字格栅上，间距几乎等分。看起来规整却彻底丢失了分散构图的自由节奏与多向呼吸感。",
      pos: { y: [75, 102], p: [150, 102], o: [225, 102], g: [75, 196], r: [150, 196], t: [225, 196], d: [150, 290] },
      overlay(s) {
        for (const x of [75, 150, 225]) s.append(svgEl("line", { x1: x, y1: 42, x2: x, y2: 332, stroke: PALETTE.warn, "stroke-dasharray": "4 4", "stroke-width": 1.3 }));
        for (const y of [102, 196, 290]) s.append(svgEl("line", { x1: 30, y1: y, x2: 270, y2: y, stroke: PALETTE.warn, "stroke-dasharray": "4 4", "stroke-width": 1.3 }));
      },
    },
    B: {
      ok: false,
      verdict: "方案 B · 偏沉结块",
      why: "黄大圆、紫中圆、橘红小圆全扎堆挤在左上角彼此贴压，右下大半片黑底完全空荡，视觉重心猛向左上方倾覆。",
      pos: { y: [82, 92], p: [132, 118], o: [104, 150], g: [62, 166], r: [168, 76], t: [74, 222], d: [142, 210] },
      overlay(s) {
        s.append(svgEl("circle", { cx: 108, cy: 122, r: 64, fill: "none", stroke: PALETTE.warn, "stroke-width": 1.8, "stroke-dasharray": "5 4" }));
        s.append(svgEl("line", { x1: 150, y1: 190, x2: 106, y2: 126, stroke: PALETTE.warn, "stroke-width": 2 }));
        s.append(svgEl("text", { x: 204, y: 318, fill: "#FF9475", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "右下失重荒芜"));
      },
    },
    C: {
      ok: true,
      verdict: "方案 C · 开放平衡 ✓",
      why: "明黄大圆稳立右上做第一落点，薰衣草紫圆居中偏右承接，橘红小圆错落于中左偏下形成非等边视线三角；左下绿方、左上标题与右下暖白空环跨留白互相配平，既打破横竖对齐又守住每件的呼吸净隙。",
      pos: { y: [212, 86], p: [204, 198], o: [118, 228], g: [58, 286], r: [224, 306], t: [76, 98], d: [112, 338] },
      overlay(s) {
        s.append(svgEl("path", { d: "M212,86 L204,198 L118,228 Z", fill: "none", stroke: PALETTE.jadeBright, "stroke-dasharray": "5 4", "stroke-width": 1.6 }));
        s.append(svgEl("circle", { cx: 154, cy: 192, r: 6, fill: PALETTE.jadeBright }));
        s.append(svgEl("text", { x: 154, y: 178, fill: PALETTE.jadeBright, "font-size": 11.5, "font-weight": 700, "text-anchor": "middle" }, "重心稳落画心"));
      },
    },
    D: {
      ok: false,
      verdict: "方案 D · 空心贴边",
      why: "全部元素沿着四条画框外沿排成一圈，正中央塌出一块巨大死洞；画框边线把元素往外吸，视线沿外框打转却进不到画面腹地。",
      pos: { y: [250, 56], p: [50, 58], o: [152, 34], g: [42, 336], r: [252, 334], t: [54, 196], d: [250, 196] },
      overlay(s) {
        s.append(svgEl("circle", { cx: 150, cy: 192, r: 78, fill: "none", stroke: PALETTE.warn, "stroke-dasharray": "5 5", "stroke-width": 1.7 }));
        s.append(svgEl("text", { x: 150, y: 196, fill: "#FF9475", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "中央死洞"));
      },
    },
  };

  let answered = false;

  function renderCards() {
    for (const [key, opt] of Object.entries(OPTIONS)) {
      const svg = $(`#quiz-svg-${key}`);
      const p = opt.pos;
      svg.replaceChildren();
      svg.append(svgEl("rect", { x: 0, y: 0, width: 300, height: 380, fill: PALETTE.obsidian }));

      // 7 件体量色彩完全一致的元素
      svg.append(svgEl("circle", { cx: p.y[0], cy: p.y[1], r: 30, fill: PALETTE.yellow }));
      svg.append(svgEl("circle", { cx: p.p[0], cy: p.p[1], r: 21, fill: PALETTE.lavender }));
      svg.append(svgEl("circle", { cx: p.o[0], cy: p.o[1], r: 13, fill: PALETTE.orange }));
      svg.append(svgEl("rect", { x: p.g[0] - 13, y: p.g[1] - 13, width: 26, height: 26, fill: PALETTE.jade }));
      svg.append(svgEl("circle", { cx: p.r[0], cy: p.r[1], r: 18, fill: "none", stroke: PALETTE.cream, "stroke-width": 8 }));
      svg.append(svgEl("text", { x: p.t[0], y: p.t[1], fill: PALETTE.cream, "font-family": "Manrope, sans-serif", "font-size": 18, "font-weight": 800, "text-anchor": "middle" }, "JAZZ"));
      svg.append(svgEl("text", { x: p.d[0], y: p.d[1], fill: PALETTE.pink, "font-family": "Space Mono, monospace", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "07/18"));

      if (answered) {
        opt.overlay(svg);
        $(`#quiz-meta-${key}`).textContent = opt.verdict;
      }
    }
  }

  for (const card of $$(".qcard")) {
    card.addEventListener("click", () => {
      const pick = card.dataset.q;
      const opt = OPTIONS[pick];
      answered = true;
      renderCards();

      for (const c of $$(".qcard")) {
        c.classList.remove("is-correct", "is-wrong");
        if (c.dataset.q === "C") c.classList.add("is-correct");
        else if (c.dataset.q === pick) c.classList.add("is-wrong");
      }

      feedback.hidden = false;
      feedback.classList.toggle("is-ok", opt.ok);
      feedback.innerHTML = `
        <h3>${opt.ok ? "选对了：方案 C 是稳而不乱的分散构图" : `再看看：你选了方案 ${pick}（${opt.verdict.split("·")[1].trim()}），最佳答案是方案 C`}</h3>
        <p>${opt.why}</p>
        <ul>
          <li><strong>A</strong>：${OPTIONS.A.why}</li>
          <li><strong>B</strong>：${OPTIONS.B.why}</li>
          <li><strong>C（正确）</strong>：${OPTIONS.C.why}</li>
          <li><strong>D</strong>：${OPTIONS.D.why}</li>
        </ul>
      `;
    });
  }

  renderCards();
}

/* ============================================================================
   08 节：原海报放大查看器（支持缩放、拖拽平移、Esc 关闭）
   ============================================================================ */
function initPosterViewer() {
  const dlg = $("#viewer");
  const openBtn = $("#poster-open");
  const closeBtn = $("#viewer-close");
  const posterImg = $("#poster");
  const viewerImg = $("#viewer-img");
  const scrollBox = $("#viewer-scroll");
  const zoomOut = $("#zoom-out");
  const zoomIn = $("#zoom-in");
  const zoomVal = $("#zoom-val");
  if (!dlg || !openBtn || !posterImg) return;

  let zoom = 100;

  function applyZoom() {
    zoomVal.textContent = `${zoom}%`;
    viewerImg.style.width = `${Math.round(720 * (zoom / 100))}px`;
  }

  openBtn.addEventListener("click", () => {
    if (!viewerImg.src) viewerImg.src = posterImg.src;
    zoom = 100;
    applyZoom();
    dlg.showModal();
    scrollBox.focus();
  });

  closeBtn?.addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
  });

  zoomOut?.addEventListener("click", () => { zoom = Math.max(60, zoom - 20); applyZoom(); });
  zoomIn?.addEventListener("click", () => { zoom = Math.min(240, zoom + 20); applyZoom(); });

  // 鼠标拖拽平移大图
  let panning = false, sx = 0, sy = 0, sl = 0, st = 0;
  scrollBox.addEventListener("pointerdown", (e) => {
    panning = true;
    sx = e.clientX; sy = e.clientY;
    sl = scrollBox.scrollLeft; st = scrollBox.scrollTop;
    scrollBox.setPointerCapture?.(e.pointerId);
  });
  scrollBox.addEventListener("pointermove", (e) => {
    if (!panning) return;
    scrollBox.scrollLeft = sl - (e.clientX - sx);
    scrollBox.scrollTop = st - (e.clientY - sy);
  });
  const stopPan = () => { panning = false; };
  scrollBox.addEventListener("pointerup", stopPan);
  scrollBox.addEventListener("pointercancel", stopPan);
}

initHero();
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initSection07();
initPosterViewer();

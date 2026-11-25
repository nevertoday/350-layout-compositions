// 04 节 切换瞬间连续性对比剧场（2D Canvas）
// 并排对比「硬切 + 换壳丢锚」vs「FLIP 轨迹 + 保留身份锚点」，可调过渡时长挡位（0ms / 280ms / 950ms）。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE, TEMPLATES, LINEAR_SLOTS } from "./model.js";

const SHAPES = ["circle", "square", "triangle", "hexagon"];
const CODES = ["01", "02", "03", "04"];
const ALT_SHAPES = ["triangle", "hexagon", "circle", "square"];
const ALT_FILLS = ["#7E8A97", "#9B7EA8", "#6C7D8C", "#525C68"];

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function drawGlyph(ctx, shape, cx, cy, r, fill) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();
  if (shape === "circle") ctx.arc(cx, cy, r, 0, Math.PI * 2);
  else if (shape === "square") ctx.rect(cx - r * 0.85, cy - r * 0.85, r * 1.7, r * 1.7);
  else if (shape === "triangle") {
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy + r * 0.85);
    ctx.lineTo(cx - r, cy + r * 0.85);
    ctx.closePath();
  } else {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
}

export function initContinuityLab() {
  const canvas = document.getElementById("cont-canvas");
  const toggleBtn = document.getElementById("cont-toggle");
  const readout = document.getElementById("cont-readout");
  const speedWrap = document.getElementById("cont-speed");
  if (!canvas || !toggleBtn || !readout) return;

  const ctx = canvas.getContext("2d");
  let W = 0;
  let H = 0;
  let dpr = 1;

  let targetMode = 1; // 0 = linear, 1 = modular
  let durationMs = 280;
  let animT = 1; // 0 -> 1 过渡进度
  let fromMode = 0;
  let toMode = 1;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = pixelRatio(r.width < 600 ? 1.5 : 2);
    W = r.width;
    H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  function getBox(mode, id, x0, y0, bw, bh) {
    const slots = mode === 0 ? LINEAR_SLOTS : TEMPLATES.poster121.slots;
    const s = slots[id];
    return {
      x: x0 + s.x * bw,
      y: y0 + s.y * bh,
      w: s.w * bw,
      h: s.h * bh,
      role: s.role,
    };
  }

  function drawWindow(x0, y0, bw, bh, title, isGood, prog) {
    ctx.save();
    // 窗口纸底
    ctx.fillStyle = isGood ? PALETTE.blushPale : "#F1EFEF";
    ctx.fillRect(x0 - 8, y0 - 30, bw + 16, bh + 38);
    ctx.strokeStyle = isGood ? PALETTE.roseBanner : "#B9B2B6";
    ctx.lineWidth = isGood ? 1.5 : 1;
    ctx.strokeRect(x0 - 8, y0 - 30, bw + 16, bh + 38);

    // 标头
    ctx.fillStyle = isGood ? PALETTE.roseDeep : PALETTE.inkSoft;
    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(title, x0, y0 - 15);

    const p = isGood ? prog : prog < 1 ? 0 : 1; // 坏窗口硬切无过渡
    const eased = easeInOutCubic(p);

    for (let id = 0; id < 4; id++) {
      const A = getBox(fromMode, id, x0, y0, bw, bh);
      const B = getBox(toMode, id, x0, y0, bw, bh);
      const x = A.x + (B.x - A.x) * eased;
      const y = A.y + (B.y - A.y) * eased;
      const w = A.w + (B.w - A.w) * eased;
      const h = A.h + (B.h - A.h) * eased;

      // 轨迹淡线（仅好窗口且动画中）
      if (isGood && p > 0.02 && p < 0.98) {
        ctx.strokeStyle = "rgba(207, 47, 112, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(A.x + A.w / 2, A.y + A.h / 2);
        ctx.lineTo(B.x + B.w / 2, B.y + B.h / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const curMode = p >= 0.5 ? toMode : fromMode;
      const lostAnchor = !isGood && curMode === 1;

      if (lostAnchor) {
        ctx.fillStyle = ALT_FILLS[id];
      } else if (id === 0 && curMode === 1) {
        ctx.fillStyle = PALETTE.ink;
      } else if (id === 1 && curMode === 1) {
        ctx.fillStyle = PALETTE.rose;
      } else {
        ctx.fillStyle = PALETTE.creamCard;
      }
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(13,11,13,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

      const fg = lostAnchor || (id === 0 && curMode === 1) ? "#FAF2E9" : PALETTE.ink;
      ctx.fillStyle = fg;
      ctx.font = `700 13px "Archivo", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(lostAnchor ? "—" : CODES[id], x + 8, y + 7);

      const gFill = lostAnchor
        ? "#E2E8F0"
        : id === 0 && curMode === 1
          ? "#FAF2E9"
          : id === 1 && curMode === 1
            ? "#FAF2E9"
            : id === 0 || id === 3
              ? PALETTE.ink
              : PALETTE.rose;
      const r = Math.min(h * 0.22, 9);
      drawGlyph(ctx, lostAnchor ? ALT_SHAPES[id] : SHAPES[id], x + w - r - 10, y + h / 2, r, gFill);
    }
    ctx.restore();
  }

  function updateReadout() {
    const modeLabel = targetMode === 1 ? "模块重组态" : "线性顺序态";
    const effMs = reducedMotion.matches ? 0 : durationMs;
    let tier = "易跟住（示意）";
    let note = "280ms 处于人眼平滑追踪的经验舒适带，既能看见 01–04 飞向新槽位，又不会拖慢点击节奏。";
    if (effMs === 0) {
      tier = "瞬切重扫（示意）";
      note = reducedMotion.matches
        ? "系统已开启「减少动态效果」：自动停用位移轨迹，靠 01–04 编号与形色锚点保持辨识。"
        : "0ms 瞬切虽快，但四个块瞬间易位，对照 B 留住锚点仍需短暂重扫，对照 A 丢锚点则会直接认混。";
    } else if (effMs > 600) {
      tier = "迟滞发粘（示意）";
      note = "950ms 过慢：用户视线早已到达目标区，模块还在半空漂移，交互会显得沉重拖沓。";
    }
    readout.innerHTML =
      `<span class="cr-pill">当前：${modeLabel}</span>` +
      `<span class="cr-pill">过渡：${effMs}ms</span>` +
      `<span class="cr-pill">追踪难度：${tier}</span>` +
      `<p class="cr-note">${note}</p>`;
  }

  function frame(t, dt, { still }) {
    if (!W || !H) resize();
    if (!W || !H) return;

    const effMs = still ? 0 : durationMs;
    if (animT < 1) {
      if (effMs <= 0) animT = 1;
      else animT = Math.min(1, animT + (dt * 1000) / effMs);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const stacked = W < 540;
    if (!stacked) {
      const gap = 28;
      const bw = (W - gap - 32) / 2;
      const bh = H - 52;
      drawWindow(16, 38, bw, bh, "对照 A · 0ms 硬切 + 换壳丢锚", false, animT);
      drawWindow(16 + bw + gap, 38, bw, bh, `对照 B · FLIP ${effMs}ms + 保留锚点`, true, animT);
    } else {
      const gap = 42;
      const bw = W - 24;
      const bh = (H - gap - 56) / 2;
      drawWindow(12, 34, bw, bh, "对照 A · 0ms 硬切 + 换壳丢锚", false, animT);
      drawWindow(12, 34 + bh + gap, bw, bh, `对照 B · FLIP ${effMs}ms + 保留锚点`, true, animT);
    }
    ctx.restore();
  }

  const ctrl = loop(canvas, frame);

  toggleBtn.addEventListener("click", () => {
    fromMode = targetMode;
    targetMode = targetMode === 1 ? 0 : 1;
    toMode = targetMode;
    animT = reducedMotion.matches || durationMs === 0 ? 1 : 0;
    toggleBtn.textContent = targetMode === 1 ? "切换回：线性顺序布局" : "切换为：模块重组布局";
    updateReadout();
    ctrl.draw();
  });

  speedWrap?.querySelectorAll("button[data-ms]").forEach((btn) => {
    btn.addEventListener("click", () => {
      durationMs = Number(btn.dataset.ms);
      speedWrap.querySelectorAll("button[data-ms]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      // 顺带重放一次切换，立即感知时长变化
      fromMode = targetMode === 1 ? 0 : 1;
      toMode = targetMode;
      animT = reducedMotion.matches || durationMs === 0 ? 1 : 0;
      updateReadout();
      ctrl.draw();
    });
  });

  updateReadout();
}

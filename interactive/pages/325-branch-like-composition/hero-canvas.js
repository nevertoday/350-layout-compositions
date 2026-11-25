// 325 折枝式构图 · 宣纸活体折枝写生画布（2D Canvas 高帧率渲染与直接拖拽交互）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, computeGeometry, diagnose, THEMES } from "./model.js";

// 离屏宣纸肌理缓存（只在尺寸或题材变化时生成一次，拖动帧 0.1ms 复绘）
function buildPaperCache(w, h, theme) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  const ctx = c.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, theme.paper);
  grad.addColorStop(0.55, theme.paper);
  grad.addColorStop(1, theme.paperTint);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 轻柔宣纸纤维与微颗粒（确定性伪随机，不闪烁）
  let seed = theme.id === "song" ? 913 : theme.id === "editorial" ? 419 : 325;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  if (theme.id === "song") {
    // 宋绢细密经纬丝纹
    ctx.strokeStyle = "rgba(115, 96, 70, 0.045)";
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 6) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
    }
  } else {
    // 宣纸柔和短纤维
    ctx.strokeStyle = "rgba(128, 112, 92, 0.08)";
    ctx.lineWidth = 0.8;
    const count = Math.min(240, Math.round((w * h) / 2800));
    for (let i = 0; i < count; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const len = 6 + rnd() * 18;
      const ang = rnd() * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      ctx.stroke();
    }
  }

  // 极浅三分与画心定盘暗格（帮助感受「不居中央」）
  ctx.save();
  ctx.strokeStyle = "rgba(74, 71, 63, 0.08)";
  ctx.setLineDash([4, 6]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, 0);
  ctx.lineTo(w * 0.5, h);
  ctx.moveTo(0, h * 0.5);
  ctx.lineTo(w, h * 0.5);
  ctx.stroke();
  ctx.restore();

  return c;
}

// 绘一笔由粗收细的焦墨折枝（带轻柔顿挫与飞白高光）
function drawCalligraphicSegment(ctx, x1, y1, x2, y2, w1, w2, inkColor) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  // 微微起伏的中点让枝干有木本筋骨感
  const mx = (x1 + x2) * 0.5 + nx * (w1 * 0.16);
  const my = (y1 + y2) * 0.5 + ny * (w1 * 0.16);
  const wm = (w1 + w2) * 0.5;

  ctx.beginPath();
  ctx.moveTo(x1 + nx * w1 * 0.5, y1 + ny * w1 * 0.5);
  ctx.quadraticCurveTo(mx + nx * wm * 0.52, my + ny * wm * 0.52, x2 + nx * w2 * 0.5, y2 + ny * w2 * 0.5);
  ctx.lineTo(x2 - nx * w2 * 0.5, y2 - ny * w2 * 0.5);
  ctx.quadraticCurveTo(mx - nx * wm * 0.48, my - ny * wm * 0.48, x1 - nx * w1 * 0.5, y1 - ny * w1 * 0.5);
  ctx.closePath();
  ctx.fillStyle = inkColor;
  ctx.fill();

  // 细微飞白宣纸透光纹（呼应 325 原海报枝干的木刻/干笔肌理）
  ctx.save();
  ctx.strokeStyle = "rgba(237, 229, 217, 0.28)";
  ctx.lineWidth = Math.max(0.8, w2 * 0.25);
  ctx.setLineDash([4, 9, 2, 12]);
  ctx.beginPath();
  ctx.moveTo(x1 + dx * 0.12, y1 + dy * 0.12);
  ctx.lineTo(x1 + dx * 0.86, y1 + dy * 0.86);
  ctx.stroke();
  ctx.restore();
}

// 绘一枚苍苔叶（带叶脉）
function drawLeaf(ctx, cx, cy, angle, len, fill, vein, warn = false) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const w = len * 0.36;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(len * 0.28, -w, len * 0.72, -w * 0.85, len, 0);
  ctx.bezierCurveTo(len * 0.72, w * 0.85, len * 0.28, w, 0, 0);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  if (warn) {
    ctx.strokeStyle = "#9C251C";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.beginPath();
  ctx.moveTo(len * 0.08, 0);
  ctx.lineTo(len * 0.86, 0);
  ctx.strokeStyle = vein;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

// 宋人册页主题：无五官的极简来禽停枝剪影
function drawSongBird(ctx, x, y, scale, ink) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = ink;
  // 身体与尾羽一笔剪影（遵循规范：绝不画眼睛与嘴巴等五官细节）
  ctx.beginPath();
  ctx.moveTo(-22, 10);
  ctx.quadraticCurveTo(-8, -12, 8, -14);
  ctx.quadraticCurveTo(18, -15, 22, -6);
  ctx.quadraticCurveTo(26, -3, 30, -4); // 轻喙轮廓
  ctx.quadraticCurveTo(24, 1, 20, 4);
  ctx.quadraticCurveTo(12, 16, -8, 16);
  ctx.lineTo(-34, 24);
  ctx.lineTo(-28, 13);
  ctx.closePath();
  ctx.fill();
  // 细足抓枝
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-2, 14);
  ctx.lineTo(-4, 23);
  ctx.moveTo(5, 13);
  ctx.lineTo(4, 22);
  ctx.stroke();
  ctx.restore();
}

// 绘原海报同款水彩胭脂花晕与蕊（按三种题材分别演化）
function drawBlossom(ctx, x, y, r, theme, grow, state, diag) {
  const rr = Math.max(4, r * grow);
  ctx.save();

  if (theme.id === "poster") {
    // 1:1 复刻 325 原海报的淡胭脂圆晕 + 深红花蕊
    const g = ctx.createRadialGradient(x - rr * 0.15, y - rr * 0.15, rr * 0.1, x, y, rr);
    g.addColorStop(0, "rgba(223, 165, 150, 0.94)");
    g.addColorStop(0.82, "rgba(213, 157, 142, 0.88)");
    g.addColorStop(1, "rgba(213, 157, 142, 0.72)");
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    // 淡外晕呼吸环（视觉柔边）
    ctx.beginPath();
    ctx.arc(x, y, rr * 1.03, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(180, 118, 106, 0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // 深胭脂核心蕊点
    ctx.beginPath();
    ctx.arc(x, y, rr * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = theme.core;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, rr * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = "#4A1713";
    ctx.fill();
  } else if (theme.id === "song") {
    // 五瓣冰绡白梅花团
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const px = x + Math.cos(a) * rr * 0.46;
      const py = y + Math.sin(a) * rr * 0.46;
      ctx.beginPath();
      ctx.arc(px, py, rr * 0.46, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(248, 244, 234, 0.94)";
      ctx.fill();
      ctx.strokeStyle = "rgba(130, 115, 92, 0.42)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, rr * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = "#8C583A";
    ctx.fill();
    // 枝端旁轻落一只剪影小鸟（无五官）
    drawSongBird(ctx, x - rr * 0.92, y - rr * 0.56, Math.max(0.55, rr / 56), theme.ink);
  } else {
    // 现代编排 · 诗集书封：枝端朱印主标徽章
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(215, 149, 133, 0.82)";
    ctx.fill();

    const box = rr * 0.86;
    ctx.fillStyle = theme.core;
    ctx.fillRect(x - box * 0.5, y - box * 0.65, box, box * 1.3);
    ctx.fillStyle = "#F6F1E7";
    ctx.font = `700 ${Math.round(box * 0.46)}px "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("折", x, y - box * 0.24);
    ctx.fillText("枝", x, y + box * 0.28);
  }

  // 居中或撞边时画出醒目诊断虚线提示框
  if (!diag.checks.focus && (diag.g.centerDist < 0.115 || diag.g.haloClearance < 0.024)) {
    ctx.beginPath();
    ctx.arc(x, y, rr + 6, 0, Math.PI * 2);
    ctx.strokeStyle = "#9C251C";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

// 绘原海报右侧水平虚线点端引注（• -------- • 标签）
function drawCallout(ctx, ax, ay, w, h, title, sub, alignRight = true) {
  ctx.save();
  const margin = 14;
  const labelW = 108;
  let endX = alignRight ? Math.min(w - labelW - margin, Math.max(ax + 48, w * 0.72)) : Math.max(labelW + margin, Math.min(ax - 48, w * 0.28));
  if (alignRight && ax > w - labelW - 28) {
    alignRight = false;
    endX = Math.max(labelW + margin, ax - 76);
  } else if (!alignRight && ax < labelW + 28) {
    alignRight = true;
    endX = Math.min(w - labelW - margin, ax + 76);
  }

  const clampedY = clamp(ay, 26, h - 38);

  ctx.strokeStyle = "#3D4739";
  ctx.lineWidth = 1.1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(ax, clampedY);
  ctx.lineTo(endX, clampedY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#1B1A16";
  ctx.beginPath();
  ctx.arc(ax, clampedY, 2.6, 0, Math.PI * 2);
  ctx.arc(endX, clampedY, 2.6, 0, Math.PI * 2);
  ctx.fill();

  const tx = alignRight ? endX + 8 : endX - 8;
  ctx.textAlign = alignRight ? "left" : "right";
  ctx.textBaseline = "middle";
  ctx.font = '700 13px "Noto Serif SC", serif';
  ctx.fillStyle = "#1B1A16";
  ctx.fillText(title, tx, clampedY - 1);

  ctx.font = '400 11px "LXGW WenKai", "Noto Serif SC", serif';
  ctx.fillStyle = "#4A473F";
  ctx.fillText(sub, tx, clampedY + 15);
  ctx.restore();
}

export function mountHeroCanvas(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  let w = 640;
  let h = 500;
  let dpr = 1;
  let paperCache = null;
  let cacheKey = "";
  let intro = reducedMotion.matches ? 1 : 0;
  let dirty = true;

  // 拖拽状态
  let dragMode = null; // 'tip' | 'joint' | 'sweep'
  let startX = 0;
  let startBend = 0;
  let startTipX = 0;
  let hoverTarget = "";

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(200, Math.round(rect.width));
    h = Math.max(200, Math.round(rect.height));
    dpr = pixelRatio(2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    paperCache = null;
    dirty = true;
  }

  const toPx = (pt) => ({ x: pt.x * w, y: pt.y * h });
  const toNorm = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: clamp((clientX - r.left) / Math.max(1, r.width), 0.04, 0.96),
      y: clamp((clientY - r.top) / Math.max(1, r.height), 0.04, 0.96),
    };
  };

  function hitTest(nx, ny) {
    const g = computeGeometry(state);
    const minDim = Math.min(w, h);
    const distPx = (a, b) => Math.hypot((a.x - b.x) * w, (a.y - b.y) * h);
    const p = { x: nx, y: ny };

    // 1. 抢戏副花（点击即剪）
    if (g.decoyBlossom && distPx(p, g.decoyBlossom) <= Math.max(28, g.decoyBlossom.r * minDim + 8)) {
      return "decoy";
    }
    // 2. 冗余杂叶（点击即剪）
    for (const lf of g.clutterLeaves) {
      if (distPx(p, lf) <= 28) return "clutter";
    }
    // 3. 枝端花心（拖移端点）
    if (distPx(p, g.tip) <= Math.max(34, g.haloR * minDim + 6)) {
      return "tip";
    }
    // 4. 中段折节（拖移掰角）
    if (distPx(p, g.joint) <= 32) {
      return "joint";
    }
    return "sweep";
  }

  function updateBendFromPoint(nx, ny) {
    const g = computeGeometry(state);
    const dx = g.tip.x - g.root.x;
    const dy = g.tip.y - g.root.y;
    const len = Math.hypot(dx, dy) || 0.001;
    const ux = dx / len;
    const uy = dy / len;
    const nxv = -uy;
    const nyv = ux;
    const rx = nx - g.root.x;
    const ry = ny - g.root.y;
    const projT = (rx * ux + ry * uy) / len;
    const perp = rx * nxv + ry * nyv;
    state.jointT = clamp(projT, 0.34, 0.66);
    state.bend = clamp(perp, -0.32, 0.32);
  }

  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    const { x, y } = toNorm(e.clientX, e.clientY);
    const hit = hitTest(x, y);

    if (hit === "decoy") {
      state.dualFocus = false;
      intro = 1;
      dirty = true;
      onChange();
      return;
    }
    if (hit === "clutter") {
      state.extraFoliage = false;
      intro = 1;
      dirty = true;
      onChange();
      return;
    }

    dragMode = hit;
    startX = x;
    startBend = state.bend;
    startTipX = state.tipX;
    intro = 1;
    if (canvas.setPointerCapture && e.pointerId != null) {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
    if (dragMode === "tip") {
      state.tipX = clamp(x, 0.08, 0.92);
      state.tipY = clamp(y, 0.08, 0.92);
    } else if (dragMode === "joint") {
      updateBendFromPoint(x, y);
    }
    dirty = true;
    onChange();
  }

  function onPointerMove(e) {
    const { x, y } = toNorm(e.clientX, e.clientY);
    if (!dragMode) {
      const h2 = hitTest(x, y);
      if (h2 !== hoverTarget) {
        hoverTarget = h2;
        canvas.style.cursor = h2 === "decoy" || h2 === "clutter" ? "pointer" : "grab";
      }
      return;
    }
    if (dragMode === "tip") {
      state.tipX = clamp(x, 0.08, 0.92);
      state.tipY = clamp(y, 0.08, 0.92);
    } else if (dragMode === "joint") {
      updateBendFromPoint(x, y);
    } else if (dragMode === "sweep") {
      // 画布任意位置横拖：流畅掰动折角并轻移端点（兼顾自然手势与 perf 水平触拖）
      const delta = x - startX;
      state.bend = clamp(startBend + delta * 0.55, -0.32, 0.32);
      state.tipX = clamp(startTipX + delta * 0.32, 0.14, 0.88);
    }
    dirty = true;
    onChange();
  }

  function onPointerUp(e) {
    if (!dragMode) return;
    if (canvas.releasePointerCapture && e.pointerId != null) {
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    }
    dragMode = null;
  }

  // 兼容 perf.mjs 直接派发的 touchStart / touchMove / touchEnd 事件
  function onTouchStart(e) {
    const t = e.touches && e.touches[0];
    if (!t) return;
    onPointerDown({ clientX: t.clientX, clientY: t.clientY });
  }
  function onTouchMove(e) {
    const t = e.touches && e.touches[0];
    if (!t || !dragMode) return;
    onPointerMove({ clientX: t.clientX, clientY: t.clientY });
  }
  function onTouchEnd() {
    onPointerUp({});
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: true });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });

  // 键盘操作：方向键微调枝端花心，Q/E 调折角，Space 修剪杂叶/副花
  canvas.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.05 : 0.025;
    let handled = true;
    if (e.key === "ArrowRight") state.tipX = clamp(state.tipX + step, 0.08, 0.92);
    else if (e.key === "ArrowLeft") state.tipX = clamp(state.tipX - step, 0.08, 0.92);
    else if (e.key === "ArrowUp") state.tipY = clamp(state.tipY - step, 0.08, 0.92);
    else if (e.key === "ArrowDown") state.tipY = clamp(state.tipY + step, 0.08, 0.92);
    else if (e.key === "e" || e.key === "E" || e.key === "]") state.bend = clamp(state.bend + 0.025, -0.32, 0.32);
    else if (e.key === "q" || e.key === "Q" || e.key === "[") state.bend = clamp(state.bend - 0.025, -0.32, 0.32);
    else if (e.key === " ") {
      if (state.dualFocus) state.dualFocus = false;
      else if (state.extraFoliage) state.extraFoliage = false;
      else handled = false;
    } else {
      handled = false;
    }
    if (handled) {
      e.preventDefault();
      intro = 1;
      dirty = true;
      onChange();
    }
  });

  function renderFrame(t, dt, { still }) {
    if (still) {
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 1.45);
      dirty = true;
    }
    // 开场前 8 秒或正在拖拽时持续重绘，之后静置省电；若状态变化 dirty=true 即刻重绘
    const subtleBreath = !still && t < 7.5;
    if (!dirty && !subtleBreath && !dragMode) return;
    dirty = false;

    const theme = THEMES[state.theme] || THEMES.poster;
    const key = `${w}x${h}:${theme.id}`;
    if (!paperCache || cacheKey !== key) {
      paperCache = buildPaperCache(w, h, theme);
      cacheKey = key;
    }

    const diag = diagnose(state);
    const g = diag.g;
    const minDim = Math.min(w, h);
    const ease = 1 - Math.pow(1 - intro, 3);

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(paperCache, 0, 0, w, h);

    // 现代诗集书封题材：在折枝对侧留白处排入克制的书封副文
    if (theme.id === "editorial") {
      const tx = g.tip.x > 0.5 ? 24 : w - 150;
      const ty = g.tip.y < 0.5 ? 34 : h - 76;
      ctx.fillStyle = "#1B1A16";
      ctx.font = '700 15px "Noto Serif SC", serif';
      ctx.textAlign = "left";
      ctx.fillText("空山折枝集", tx, ty);
      ctx.fillStyle = "#4A473F";
      ctx.font = '400 11px "Chivo", sans-serif';
      ctx.fillText("POETRY EDITION · VOL. IV", tx, ty + 18);
      ctx.fillStyle = "#364932";
      ctx.fillRect(tx, ty + 28, 26, 2);
    } else if (theme.id === "song") {
      // 宋人册页角落一方小朱印
      const sx = g.tip.x > 0.5 ? 22 : w - 48;
      const sy = g.tip.y < 0.5 ? 22 : h - 52;
      ctx.strokeStyle = "#8C2E27";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(sx, sy, 22, 32);
      ctx.fillStyle = "#8C2E27";
      ctx.font = '400 11px "LXGW WenKai", serif';
      ctx.textAlign = "center";
      ctx.fillText("宣", sx + 11, sy + 13);
      ctx.fillText("和", sx + 11, sy + 26);
    }

    const pRoot = toPx(g.root);
    const pJoint = toPx(g.joint);
    const pTip = toPx(g.tip);

    // 枝干生长进度（前 50% 长下段，后 50% 长上段）
    const p1 = clamp(ease * 2, 0, 1);
    const p2 = clamp((ease - 0.45) / 0.55, 0, 1);
    const curJoint = {
      x: pRoot.x + (pJoint.x - pRoot.x) * p1,
      y: pRoot.y + (pJoint.y - pRoot.y) * p1,
    };
    const curTip = {
      x: pJoint.x + (pTip.x - pJoint.x) * p2,
      y: pJoint.y + (pTip.y - pJoint.y) * p2,
    };

    const baseW = clamp(minDim * 0.036, 12, 20);
    const midW = baseW * 0.54;
    const tipW = Math.max(2.2, baseW * 0.16);

    // 先画淡胭脂主花晕在枝梢后（像原海报那样花蕊压在枝梢端点上）
    const bloomGrow = clamp((ease - 0.55) / 0.45, 0, 1);
    const pulse = subtleBreath ? 1 + Math.sin(t * 2.1) * 0.014 : 1;
    if (bloomGrow > 0.02) {
      drawBlossom(ctx, pTip.x, pTip.y, g.haloR * minDim * pulse, theme, bloomGrow, state, diag);
    }

    // 绘制折枝两段焦墨
    drawCalligraphicSegment(ctx, pRoot.x, pRoot.y, curJoint.x, curJoint.y, baseW, midW, theme.ink);
    if (p2 > 0.01) {
      drawCalligraphicSegment(ctx, pJoint.x, pJoint.y, curTip.x, curTip.y, midW * 0.96, tipW, theme.ink);
    }

    // 拐节木本圆结（微润衔接两段）
    ctx.beginPath();
    ctx.arc(curJoint.x, curJoint.y, midW * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = theme.ink;
    ctx.fill();

    // 若为原海报题材，重压深红花蕊点在枝梢正端
    if (theme.id === "poster" && bloomGrow > 0.3) {
      const rCore = g.haloR * minDim * 0.2 * bloomGrow;
      ctx.beginPath();
      ctx.arc(pTip.x, pTip.y, rCore, 0, Math.PI * 2);
      ctx.fillStyle = theme.core;
      ctx.fill();
    }

    // 绘制两枚原海报疏叶
    if (p1 > 0.65) {
      const l0 = g.leaves[0];
      drawLeaf(ctx, l0.x * w, l0.y * h, l0.angle, l0.size * minDim, theme.leaf, theme.leafDark);
    }
    if (p2 > 0.65) {
      const l1 = g.leaves[1];
      drawLeaf(ctx, l1.x * w, l1.y * h, l1.angle, l1.size * minDim, theme.leaf, theme.leafDark);
    }

    // 绘制三枚原海报落瓣点（开场柔和漂浮微韵）
    if (bloomGrow > 0.4) {
      ctx.fillStyle = theme.petal;
      g.petals.forEach((pt, idx) => {
        const driftY = subtleBreath ? Math.sin(t * 1.8 + idx * 1.9) * 2.2 : 0;
        ctx.beginPath();
        ctx.arc(pt.x * w, pt.y * h + driftY, Math.max(3.5, pt.r * minDim) * bloomGrow, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 错态：冗余丛叶（点击可修剪）
    if (g.clutterLeaves.length && ease > 0.5) {
      for (const lf of g.clutterLeaves) {
        drawLeaf(ctx, lf.x * w, lf.y * h, lf.angle, lf.size * minDim, "#5C6447", "#3A402B", true);
      }
      // 轻巧提示签：放在枝干右下侧，避开上方副花签，绝不重叠
      const tagPt = toPx(g.clutterLeaves[2]);
      const clutterLabel = w < 440 ? "× 繁叶 · 点剪" : "× 繁叶压白 · 点此剪枝";
      drawBadge(ctx, tagPt.x + 28, tagPt.y + 42, clutterLabel, "#9C251C", "#F4E0DC", w, h);
    }

    // 错态：抢戏副花（点击可剪除）
    if (g.decoyBlossom && ease > 0.5) {
      const dp = toPx(g.decoyBlossom);
      const dr = g.decoyBlossom.r * minDim;
      ctx.save();
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, dr, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(214, 137, 129, 0.84)";
      ctx.fill();
      ctx.strokeStyle = "#9C251C";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, dr * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = "#8C2E27";
      ctx.fill();
      ctx.restore();
      const decoyLabel = w < 440 ? "× 副花 · 点剪" : "× 副花争主 · 点此剪除";
      drawBadge(ctx, dp.x, dp.y - dr - 16, decoyLabel, "#9C251C", "#F4E0DC", w, h);
    }

    // 错态：无根浮枝标记
    if (state.rootEdge === "floating") {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pRoot.x, pRoot.y, 16, 0, Math.PI * 2);
      ctx.strokeStyle = "#9C251C";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.restore();
      drawBadge(ctx, pRoot.x + 12, pRoot.y + 24, "× 无根悬空 · 改选边角出枝", "#9C251C", "#F4E0DC", w, h);
    }

    // 交互把手：中段「折节」可拖圆环 + 枝端「花心」可拖微环
    if (ease > 0.85) {
      // 折节把手
      ctx.save();
      ctx.beginPath();
      ctx.arc(pJoint.x, pJoint.y, 11, 0, Math.PI * 2);
      ctx.fillStyle = diag.g.bendDeg < 10 || diag.g.bendDeg > 52 ? "#F4E0DC" : "#F6F1E7";
      ctx.fill();
      ctx.strokeStyle = diag.g.bendDeg < 10 || diag.g.bendDeg > 52 ? "#9C251C" : "#364932";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = diag.g.bendDeg < 10 || diag.g.bendDeg > 52 ? "#9C251C" : "#1B1A16";
      ctx.font = '700 11px "Noto Serif SC", serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("折", pJoint.x, pJoint.y + 0.5);
      ctx.restore();

      // 枝端微环
      ctx.save();
      ctx.beginPath();
      ctx.arc(pTip.x, pTip.y, 14, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(27, 26, 22, 0.45)";
      ctx.lineWidth = 1.3;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.restore();
    }

    // 原海报同款三条水平虚线引注（仅在足够宽且开启时显示，避免小屏遮挡）
    if (state.showGuides && ease > 0.85 && w >= 360) {
      const rightSpace = g.tip.x <= 0.78;
      drawCallout(ctx, pTip.x, pTip.y, w, h, theme.tipLabel, theme.tipSub, rightSpace);
      if (w >= 460) {
        const sp = toPx(g.shaftAnchor);
        drawCallout(ctx, sp.x, sp.y, w, h, theme.shaftLabel, theme.shaftSub, true);
        const vp = toPx(g.voidAnchor);
        drawCallout(ctx, vp.x, vp.y, w, h, theme.voidLabel, theme.voidSub, true);
      }
    }

    // 画布左上极简实时状态角标
    ctx.save();
    ctx.font = '600 12px "Chivo", "Noto Serif SC", sans-serif';
    ctx.fillStyle = "#4A473F";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`斜 ${g.inclineDeg}° · 折 ${g.bendDeg}° · 留白 ${g.whitespacePct}%`, 14, 12);
    ctx.restore();

    ctx.restore();
  }

  function drawBadge(ctx, cx, cy, text, fg, bg, cw, ch) {
    ctx.save();
    ctx.font = '600 12px "Noto Serif SC", sans-serif';
    const tw = ctx.measureText(text).width;
    const bw = tw + 16;
    const bh = 24;
    const x = clamp(cx - bw / 2, 10, cw - bw - 10);
    const y = clamp(cy - bh / 2, 30, ch - bh - 10);
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, bw, bh);
    ctx.strokeStyle = fg;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x, y, bw, bh);
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + bw / 2, y + bh / 2 + 0.5);
    ctx.restore();
  }

  resize();
  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(canvas);

  const ctl = loop(canvas, renderFrame);

  return {
    redraw(resetIntro = false) {
      if (resetIntro && !reducedMotion.matches) intro = 0;
      dirty = true;
      ctl.draw();
    },
  };
}

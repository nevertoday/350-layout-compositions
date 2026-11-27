// 181 非对称字体排版 · 开场活体排印台（纯 2D Canvas，0 WebGL 依赖，高帧率）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";
import { SCENES, clamp, evaluateLayout } from "./model.js";

const FONT_ZH = '"Noto Sans SC", system-ui, sans-serif';
const FONT_EN = '"Syne", "IBM Plex Sans", sans-serif';
const FONT_TECH = '"IBM Plex Sans", "Noto Sans SC", sans-serif';

export function mountHeroStage(canvas, getState, onMutate) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let width = 640;
  let height = 600;
  let dpr = 1;
  let introDone = false;
  let dirty = true;
  let scanActive = false;
  let scanStart = 0;
  let lastT = 0;
  let hoveredId = "";
  let dragMode = null; // null | "shift" | "title" | "blue" | "giant" | "quote"
  let dragStart = null;
  let activePointerId = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(260, Math.round(rect.height));
    const nextDpr = pixelRatio(2);
    if (w !== width || h !== height || nextDpr !== dpr) {
      width = w;
      height = h;
      dpr = nextDpr;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      dirty = true;
    }
  }

  function triggerScan() {
    scanActive = true;
    scanStart = lastT;
    dirty = true;
    ctrl.draw();
  }

  function markDirty() {
    dirty = true;
    ctrl.draw();
  }

  // 把画布坐标转为归一化 (u, v)
  function toUV(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      u: clamp((clientX - r.left) / Math.max(1, r.width), 0, 1),
      v: clamp((clientY - r.top) / Math.max(1, r.height), 0, 1),
    };
  }

  function hitTest(u, v, ev) {
    const inR = (r, pad = 0.015) => u >= r.x - pad && u <= r.x + r.w + pad && v >= r.y - pad && v <= r.y + r.h + pad;
    // 优先级：斜势导语 -> 破框巨字 -> 电光钴蓝圆 -> 主标题
    if (inR(ev.rects.quote, 0.02)) return "quote";
    if (inR(ev.rects.giant, 0.02)) return "giant";
    const dx = (u - ev.blue.cx) / Math.max(0.02, ev.blue.rx);
    const dy = (v - ev.blue.cy) / Math.max(0.02, ev.blue.ry);
    if (dx * dx + dy * dy <= 1.12) return "blue";
    if (inR(ev.rects.title, 0.015)) return "title";
    return "";
  }

  function startDrag(clientX, clientY, pointerId) {
    const state = getState();
    const ev = evaluateLayout(state, width / Math.max(1, height));
    const { u, v } = toUV(clientX, clientY);
    const hit = hitTest(u, v, ev);
    dragMode = hit || "shift";
    activePointerId = pointerId;
    dragStart = {
      x: clientX,
      y: clientY,
      u,
      v,
      moved: false,
      snapshot: { ...state },
      ev,
    };
  }

  function moveDrag(clientX, clientY) {
    if (!dragMode || !dragStart) return;
    const dxPx = clientX - dragStart.x;
    const dyPx = clientY - dragStart.y;
    if (!dragStart.moved && Math.hypot(dxPx, dyPx) > 4) {
      dragStart.moved = true;
    }
    if (!dragStart.moved) return;

    const r = canvas.getBoundingClientRect();
    const du = dxPx / Math.max(120, r.width);
    const dv = dyPx / Math.max(120, r.height);
    const snap = dragStart.snapshot;

    if (dragMode === "shift") {
      // 在画布空白处横拖：连续推动偏轴张力；同时轻幅度自然展开级差/配重只到中等？
      // 注意：为了不让一根横拖就「全自动替用户过关」，横拖只推动 axisShift（及当处于手动模式外时带动默认对角位），
      // 层级和斜势/体量仍需要用户理解并校准（或点快捷/滑轨），但每一像素横拖都会让画面鲜明地动起来！
      const nextShift = clamp(snap.axisShift + du * 1.9, -1, 1);
      onMutate({ axisShift: nextShift, manualPositions: false });
    } else if (dragMode === "title") {
      // 独立拖动主标题改变挂靠轴偏离（靠近 0 时轻轻磁吸回正文隐性挂轴！）
      let nextOff = clamp(snap.titleOffset + du, -0.34, 0.34);
      if (Math.abs(nextOff) < 0.025) nextOff = 0;
      onMutate({ titleOffset: nextOff });
    } else if (dragMode === "blue") {
      const bx = clamp(dragStart.ev.blue.cx + du, 0.06, 0.94);
      const by = clamp(dragStart.ev.blue.cy + dv, 0.14, 0.84);
      onMutate({ blueX: bx, blueY: by, manualPositions: true });
    } else if (dragMode === "giant") {
      const gx = clamp(dragStart.ev.giant.cx + du, 0.09, 0.91);
      const gy = clamp(dragStart.ev.giant.cy + dv, 0.24, 0.93);
      onMutate({ giantX: gx, giantY: gy, manualPositions: true });
    } else if (dragMode === "quote") {
      // 横拖移动导语、纵拖顺手调斜势倾角
      const qx = clamp(dragStart.ev.quote.cx + du, 0.18, 0.82);
      const qy = clamp(dragStart.ev.quote.cy + dv, 0.40, 0.80);
      const nextTilt = clamp(Math.round(snap.tiltDeg - dv * 55), -30, 22);
      onMutate({ quoteX: qx, quoteY: qy, tiltDeg: nextTilt, manualPositions: true });
    }
    dirty = true;
  }

  function endDrag() {
    if (!dragMode || !dragStart) return;
    // 单击（未拖移）快捷操作：让点击本身也有直观排印反馈
    if (!dragStart.moved) {
      const s = dragStart.snapshot;
      if (dragMode === "quote") {
        // 单击斜势导语：在 -22°（原海报斜势）→ 0°（瑞士静势）→ +16°（反向试错）间循环
        const nextTilt = s.tiltDeg < -10 ? 0 : s.tiltDeg <= 4 ? 16 : -22;
        onMutate({ tiltDeg: nextTilt });
      } else if (dragMode === "title") {
        // 单击主标：若层级过平则拉起，否则归正隐性挂轴
        if (s.hierarchy < 2.1) onMutate({ hierarchy: 2.7, titleOffset: 0 });
        else if (Math.abs(s.titleOffset) > 0.02) onMutate({ titleOffset: 0 });
        else onMutate({ hierarchy: s.hierarchy > 2.9 ? 1.35 : 2.75 });
      } else if (dragMode === "blue" || dragMode === "giant") {
        // 单击配重块：若体量过小则放大到标准配重，若已标准则微调至破框
        const nextW = s.weightScale < 0.72 ? 0.98 : s.weightScale > 1.2 ? 0.95 : 1.05;
        onMutate({ weightScale: nextW });
      }
    }
    dragMode = null;
    dragStart = null;
    activePointerId = null;
    dirty = true;
  }

  // 鼠标 / Pointer 事件（配合 CSS touch-action: pan-y，竖向滑屏交给浏览器滚动，横向拖动驱动画布）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    startDrag(e.clientX, e.clientY, e.pointerId);
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragMode && (activePointerId === null || e.pointerId === activePointerId)) {
      moveDrag(e.clientX, e.clientY);
      return;
    }
    if (e.pointerType === "mouse") {
      const ev = evaluateLayout(getState(), width / Math.max(1, height));
      const { u, v } = toUV(e.clientX, e.clientY);
      const hit = hitTest(u, v, ev);
      if (hit !== hoveredId) {
        hoveredId = hit;
        canvas.style.cursor = hit ? "grab" : "ew-resize";
        dirty = true;
        ctrl.draw();
      }
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    if (activePointerId === e.pointerId) {
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
      endDrag();
    }
  });
  canvas.addEventListener("pointercancel", () => endDrag());

  // 额外兼容原始 touch 事件（确保 perf.mjs 的 CDP Input.dispatchTouchEvent 100% 稳定触发！）
  let touchDragging = false;
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    if (!dragMode) {
      touchDragging = true;
      startDrag(t.clientX, t.clientY, "touch");
    }
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!touchDragging || !dragStart || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - dragStart.x);
    const dy = Math.abs(t.clientY - dragStart.y);
    // 空白区纵向滑动时交还页面滚动
    if (dragMode === "shift" && !dragStart.moved && dy > dx + 6) {
      touchDragging = false;
      dragMode = null;
      dragStart = null;
      return;
    }
    if (dx > 3 || dragMode !== "shift") {
      moveDrag(t.clientX, t.clientY);
    }
  }, { passive: true });
  canvas.addEventListener("touchend", () => {
    if (touchDragging) {
      touchDragging = false;
      endDrag();
    }
  }, { passive: true });

  // 键盘直接微调（可聚焦画布）
  canvas.addEventListener("keydown", (e) => {
    const s = getState();
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onMutate({ axisShift: clamp(s.axisShift + 0.08, -1, 1), manualPositions: false });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onMutate({ axisShift: clamp(s.axisShift - 0.08, -1, 1), manualPositions: false });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onMutate({ hierarchy: clamp(+(s.hierarchy + 0.15).toFixed(2), 1.1, 3.2) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onMutate({ hierarchy: clamp(+(s.hierarchy - 0.15).toFixed(2), 1.1, 3.2) });
    } else if (e.key === " ") {
      e.preventDefault();
      triggerScan();
    }
  });

  // 绘制函数
  function drawScene(t, still) {
    const state = getState();
    const scene = SCENES[state.scene] || SCENES.poster;
    const W = width;
    const H = height;
    const aspect = W / Math.max(1, H);
    const ev = evaluateLayout(state, aspect);
    const intro = still ? 1 : clamp(t / 0.72, 0, 1);
    const ease = 1 - Math.pow(1 - intro, 3);
    if (intro >= 1) introDone = true;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 蜜桃暖粉海报纸底
    ctx.fillStyle = PALETTE.peachPaper;
    ctx.fillRect(0, 0, W, H);

    // 极轻印刷纸边微框
    ctx.strokeStyle = "rgba(23, 21, 28, 0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    // 2. 隐性网格 / 挂轴图层（可选开关）
    if (state.showGrid) {
      ctx.save();
      // 12 列瑞士参考细格
      ctx.strokeStyle = "rgba(31, 72, 213, 0.12)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 12; i++) {
        const gx = (W * i) / 12;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }
      // 50% 中轴虚线
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(23, 21, 28, 0.25)";
      ctx.beginPath();
      ctx.moveTo(W * 0.5, 0);
      ctx.lineTo(W * 0.5, H);
      ctx.stroke();
      // 当前偏心隐性挂轴
      const hx = ev.hangX * W;
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = PALETTE.cobalt;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hx, 0);
      ctx.lineTo(hx, H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.cobaltInk;
      ctx.font = `600 11px ${FONT_TECH}`;
      const lbl = `隐性挂轴 ${Math.round(ev.hangX * 100)}%`;
      const lx = hx > W * 0.65 ? hx - ctx.measureText(lbl).width - 8 : hx + 6;
      ctx.fillText(lbl, lx, 18);
      ctx.restore();
    }

    // 3. 破框电光钴蓝巨圆（严格使用短边半径确保任何屏宽下都是正圆！）
    const bx = ev.blue.cx * W;
    const by = ev.blue.cy * H;
    const bRadius = ev.blue.r * H * (0.85 + 0.15 * ease);
    ctx.save();
    ctx.beginPath();
    ctx.arc(bx, by, Math.max(8, bRadius), 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.cobalt;
    ctx.fill();
    if (hoveredId === "blue" || dragMode === "blue") {
      ctx.strokeStyle = PALETTE.black;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
    }
    ctx.restore();

    // 4. 右上（或随反角翻到左上）原海报 6×6 热朱橙点阵
    const dotsOnLeft = state.axisShift < -0.25;
    const dotCols = 6;
    const dotRows = 6;
    const dotGap = Math.max(10, Math.min(18, W * 0.028));
    const dotStartX = dotsOnLeft ? W * 0.045 : W - W * 0.045 - (dotCols - 1) * dotGap;
    const dotStartY = H * 0.055;
    ctx.save();
    ctx.fillStyle = PALETTE.vermilion;
    for (let r = 0; r < dotRows; r++) {
      for (let c = 0; c < dotCols; c++) {
        const order = (r + c) / (dotRows + dotCols);
        const a = clamp((ease - order * 0.35) / 0.65, 0, 1);
        if (a <= 0) continue;
        ctx.beginPath();
        ctx.arc(dotStartX + c * dotGap, dotStartY + r * dotGap, 2.5 * a, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 5. 右下（或随反角在左下）破框倾斜巨字 + 朱橙圆点
    const gx = ev.giant.cx * W;
    const gy = ev.giant.cy * H;
    const gFontPx = Math.round(ev.giant.size * H * (0.9 + 0.1 * ease));
    ctx.save();
    ctx.translate(gx, gy);
    const giantRot = state.axisShift < -0.2 ? 0.13 : -0.13;
    ctx.rotate(giantRot);
    ctx.fillStyle = PALETTE.black;
    ctx.font = `900 ${gFontPx}px ${FONT_ZH}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(scene.giantChar, 0, 0);
    ctx.restore();

    // 伴随巨字的招牌朱橙圆点
    const dotSide = ev.giant.cx >= 0.5 ? -1 : 1;
    const orangeDotX = clamp(gx + dotSide * (ev.giant.w * W * 0.60 + 14), 18, W - 18);
    const orangeDotY = clamp(gy + ev.giant.h * H * 0.06, 20, H - 20);
    ctx.save();
    ctx.beginPath();
    ctx.arc(orangeDotX, orangeDotY, Math.max(7, Math.min(16, H * 0.025 * (0.65 + state.weightScale * 0.35))), 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.vermilionDot;
    ctx.fill();
    ctx.restore();

    if (hoveredId === "giant" || dragMode === "giant") {
      const gr = ev.rects.giant;
      ctx.save();
      ctx.strokeStyle = PALETTE.cobalt;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(gr.x * W, gr.y * H, gr.w * W, gr.h * H);
      ctx.restore();
    }

    // 6. 主标题字组（两行粗黑中文 + 宽距西文副标 + 朱橙短横杠）
    const tr = ev.rects.title;
    const titlePx = Math.max(18, Math.round(ev.titleFontNorm * H));
    const subPx = Math.max(10, Math.round(titlePx * 0.25));
    const textAlign = ev.align;
    const anchorX = textAlign === "left" ? tr.x * W : textAlign === "right" ? (tr.x + tr.w) * W : (tr.x + tr.w / 2) * W;
    const titleTopY = tr.y * H + (1 - ease) * 10;

    ctx.save();
    ctx.fillStyle = PALETTE.black;
    ctx.textAlign = textAlign;
    ctx.textBaseline = "top";
    ctx.font = `900 ${titlePx}px ${FONT_ZH}`;
    ctx.fillText(scene.titleLines[0], anchorX, titleTopY);
    ctx.fillText(scene.titleLines[1], anchorX, titleTopY + titlePx * 1.07);

    // 英文副标
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 ${subPx}px ${FONT_EN}`;
    const subY = titleTopY + titlePx * 2.22;
    ctx.fillText(scene.subtitle, anchorX, subY);

    // 朱橙短横杠
    const barW = Math.max(26, W * 0.068);
    const barY = subY + subPx + Math.max(9, H * 0.018);
    const barX = textAlign === "left" ? anchorX : textAlign === "right" ? anchorX - barW : anchorX - barW / 2;
    ctx.fillStyle = PALETTE.vermilion;
    ctx.fillRect(barX, barY, barW * ease, 4);

    if (hoveredId === "title" || dragMode === "title") {
      ctx.strokeStyle = PALETTE.cobalt;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(tr.x * W - 6, tr.y * H - 4, tr.w * W + 12, tr.h * H + 12);
    }
    ctx.restore();

    // 7. 正文说明块（挂在公共隐性轴 hangX 上）
    const br = ev.rects.body;
    const bodyPx = Math.max(11, Math.round(ev.bodyFontNorm * H * 0.96));
    const bodyAnchorX = textAlign === "left" ? br.x * W : textAlign === "right" ? (br.x + br.w) * W : (br.x + br.w / 2) * W;
    const bodyY = br.y * H;

    ctx.save();
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = textAlign;
    ctx.textBaseline = "top";
    ctx.font = `500 ${bodyPx}px ${FONT_ZH}`;
    ctx.fillText(scene.bodyLines[0], bodyAnchorX, bodyY);
    ctx.fillText(scene.bodyLines[1], bodyAnchorX, bodyY + bodyPx * 1.48);

    ctx.fillStyle = PALETTE.inkMuted;
    ctx.font = `600 ${Math.max(9.5, Math.round(bodyPx * 0.68))}px ${FONT_TECH}`;
    ctx.fillText(scene.bodyEn, bodyAnchorX, bodyY + bodyPx * 3.15, Math.max(140, br.w * W * 1.25));
    ctx.restore();

    // 8. 斜置导语块 + 招牌细朱橙底线
    const qx = ev.quote.cx * W;
    const qy = ev.quote.cy * H;
    const qPx = Math.max(11, Math.round(H * 0.024));
    ctx.save();
    ctx.translate(qx, qy);
    ctx.rotate((ev.quote.tiltDeg * Math.PI) / 180);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `600 ${qPx}px ${FONT_ZH}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(scene.quoteLines[0], 0, -qPx * 0.78);
    ctx.fillText(scene.quoteLines[1], 0, qPx * 0.65);

    const lineW = Math.max(110, Math.min(220, W * 0.30));
    ctx.strokeStyle = PALETTE.vermilion;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-lineW / 2, qPx * 1.68);
    ctx.lineTo(lineW / 2, qPx * 1.68);
    ctx.stroke();

    if (hoveredId === "quote" || dragMode === "quote") {
      ctx.strokeStyle = PALETTE.cobalt;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-lineW * 0.56, -qPx * 1.75, lineW * 1.12, qPx * 3.8);
    }
    ctx.restore();

    // 9. 左下（或随反角切右；居中对称时横向一字排开）三枚原海报几何关键词徽章（● / ■ / ▶）
    const bgr = ev.rects.badges;
    const iconSize = Math.max(6.5, Math.min(10.5, H * 0.0165));

    ctx.save();
    if (ev.badgesHorizontal) {
      const colW = (bgr.w * W) / 3;
      const startX = bgr.x * W;
      const cy = (bgr.y + bgr.h * 0.5) * H;
      scene.badges.forEach((b, idx) => {
        const cx = startX + idx * colW + 18;
        drawBadgeIcon(ctx, b, cx, cy, iconSize);
        ctx.fillStyle = PALETTE.black;
        ctx.font = `700 ${Math.max(10.5, Math.round(H * 0.021))}px ${FONT_ZH}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(b.zh, cx + iconSize + 7, cy - 4);
        ctx.fillStyle = PALETTE.inkMuted;
        ctx.font = `600 ${Math.max(9.5, Math.round(H * 0.014))}px ${FONT_TECH}`;
        ctx.fillText(b.en, cx + iconSize + 7, cy + 9);
      });
    } else {
      const rowStep = (bgr.h * H) / 3;
      const badgeStartX = textAlign === "right" ? (bgr.x + bgr.w) * W - 96 : bgr.x * W;
      const badgeStartY = bgr.y * H + 8;
      scene.badges.forEach((b, idx) => {
        const cy = badgeStartY + idx * rowStep + iconSize;
        const cx = badgeStartX + iconSize;
        drawBadgeIcon(ctx, b, cx, cy, iconSize);
        ctx.fillStyle = PALETTE.black;
        ctx.font = `700 ${Math.max(11, Math.round(H * 0.023))}px ${FONT_ZH}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(b.zh, cx + iconSize + 9, cy - 5);
        ctx.fillStyle = PALETTE.inkMuted;
        ctx.font = `600 ${Math.max(9.5, Math.round(H * 0.0155))}px ${FONT_TECH}`;
        ctx.fillText(b.en, cx + iconSize + 9, cy + 9);
      });
    }
    ctx.restore();

    // 10. 错态现场标记（绝不花哨，只在有真实错态时就地指明原因）
    ctx.save();
    if (ev.faultId === "symmetryLock") {
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = PALETTE.badLight;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(W * 0.5, 22);
      ctx.lineTo(W * 0.5, H - 28);
      ctx.stroke();
      ctx.setLineDash([]);
      drawTag(ctx, W * 0.5, H - 24, "50% 中轴锁死 · 向右横拖破局", PALETTE.badLight, "#FFF");
    } else if (ev.faultId === "axisScatter") {
      const tx = ev.align === "right" ? (ev.rects.title.x + ev.rects.title.w) * W : ev.rects.title.x * W;
      const bxEdge = ev.align === "right" ? (ev.rects.body.x + ev.rects.body.w) * W : ev.rects.body.x * W;
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = PALETTE.badLight;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(tx, tr.y * H - 10);
      ctx.lineTo(tx, br.y * H + 10);
      ctx.moveTo(bxEdge, tr.y * H - 10);
      ctx.lineTo(bxEdge, br.y * H + br.h * H + 10);
      ctx.stroke();
      ctx.setLineDash([]);
      drawTag(ctx, (tx + bxEdge) / 2, tr.y * H - 14, "隐性挂轴错裂 · 拖主标对齐", PALETTE.badLight, "#FFF");
    } else if (ev.faultId === "collision") {
      // 给撞车双方画警示红框
      const hitIds = new Set(ev.collisions.flatMap((c) => [c.a, c.b]));
      ctx.strokeStyle = PALETTE.badLight;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      for (const id of hitIds) {
        const rr = ev.rects[id];
        if (!rr) continue;
        ctx.strokeRect(rr.x * W, rr.y * H, rr.w * W, rr.h * H);
      }
      ctx.setLineDash([]);
      drawTag(ctx, W * 0.5, H - 24, `× ${ev.collisions[0].label} · 拖开配重块`, PALETTE.badLight, "#FFF");
    } else if (ev.faultId === "oneSideCollapse") {
      // 底沿画出光学重心倾覆标尺
      const barY2 = H - 22;
      ctx.strokeStyle = "rgba(23,21,28,0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W * 0.14, barY2);
      ctx.lineTo(W * 0.86, barY2);
      ctx.stroke();
      ctx.fillStyle = PALETTE.badLight;
      const cxPin = clamp(ev.cogX, 0.14, 0.86) * W;
      ctx.beginPath();
      ctx.arc(cxPin, barY2, 6, 0, Math.PI * 2);
      ctx.fill();
      drawTag(ctx, cxPin, barY2 - 18, `重心倾覆 ${Math.round(ev.cogX * 100)}%`, PALETTE.badLight, "#FFF");
    }
    ctx.restore();

    // 11. 光学重心与力矩层（用户手动开启 showMass）
    if (state.showMass) {
      ctx.save();
      const cx = ev.cogX * W;
      const cy = ev.cogY * H;
      const ok = ev.checks.balance;
      const cCol = ok ? PALETTE.okLight : PALETTE.badLight;
      // 理想平衡中心区（36%–64%）
      ctx.fillStyle = ok ? "rgba(13, 107, 68, 0.09)" : "rgba(190, 31, 31, 0.08)";
      ctx.fillRect(W * 0.36, 0, W * 0.28, H);
      // 各元素到重心的细连线
      ctx.strokeStyle = "rgba(31, 72, 213, 0.28)";
      ctx.lineWidth = 1;
      for (const m of ev.masses) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(m.cx * W, m.cy * H);
        ctx.stroke();
      }
      // 重心圆标（纯几何双圆点）
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.peachLight;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = cCol;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = cCol;
      ctx.fill();
      drawTag(ctx, cx, cy - 22, `光学重心 ${Math.round(ev.cogX * 100)}%`, cCol, "#FFF");
      ctx.restore();
    }

    // 12. Space 视线动势扫视路径动画
    if (scanActive) {
      const elapsed = still ? 2.2 : t - scanStart;
      const dur = 2.6;
      const p = clamp(elapsed / dur, 0, 1);
      const pts = ev.scanPath.map((pt) => ({ ...pt, px: pt.x * W, py: pt.y * H }));
      const segCount = pts.length - 1;
      const scaled = p * segCount;

      ctx.save();
      ctx.strokeStyle = PALETTE.vermilion;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(pts[0].px, pts[0].py);
      for (let i = 0; i < segCount; i++) {
        const segP = clamp(scaled - i, 0, 1);
        if (segP <= 0) break;
        const ax = pts[i].px;
        const ay = pts[i].py;
        const bx2 = pts[i + 1].px;
        const by2 = pts[i + 1].py;
        ctx.lineTo(ax + (bx2 - ax) * segP, ay + (by2 - ay) * segP);
      }
      ctx.stroke();

      // 逐站序号徽标
      pts.forEach((pt, idx) => {
        if (scaled < idx - 0.05) return;
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, 12, 0, Math.PI * 2);
        ctx.fillStyle = idx === 0 ? PALETTE.black : PALETTE.cobalt;
        ctx.fill();
        ctx.strokeStyle = PALETTE.peachLight;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#FFF";
        ctx.font = `700 11px ${FONT_TECH}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(pt.step), pt.px, pt.py + 0.5);
      });
      ctx.restore();

      if (!still && elapsed >= dur + 0.8) {
        scanActive = false;
        dirty = true;
      }
    }

    // 13. 画布角落极简操作提示（底部不遮挡文字）
    if (ev.faultId === "ok" && !scanActive) {
      drawTag(ctx, W - 78, H - 20, "4/4 平衡成立", PALETTE.okLight, "#FFF");
    }

    ctx.restore();
  }

  function drawBadgeIcon(c, b, cx, cy, r) {
    c.fillStyle = b.color === "cobalt" ? PALETTE.cobaltVivid : PALETTE.vermilion;
    if (b.shape === "circle") {
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
    } else if (b.shape === "square") {
      c.fillRect(cx - r, cy - r, r * 2, r * 2);
    } else {
      c.beginPath();
      c.moveTo(cx - r, cy - r);
      c.lineTo(cx + r * 1.1, cy);
      c.lineTo(cx - r, cy + r);
      c.closePath();
      c.fill();
    }
  }

  function drawTag(c, cx, cy, text, bg, fg) {
    c.save();
    c.font = `600 11px ${FONT_ZH}`;
    const tw = c.measureText(text).width;
    const pw = tw + 14;
    const ph = 22;
    const x = clamp(cx - pw / 2, 8, width - pw - 8);
    const y = clamp(cy - ph / 2, 8, height - ph - 8);
    c.fillStyle = bg;
    c.fillRect(x, y, pw, ph);
    c.fillStyle = fg;
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.fillText(text, x + 7, y + ph / 2 + 0.5);
    c.restore();
  }

  const ctrl = loop(canvas, (t, _dt, { still }) => {
    lastT = t;
    resize();
    // 只在开场动画期、扫视动画期、或状态有变动时重画，静置零浪费 CPU！
    if (still || !introDone || scanActive || dirty) {
      dirty = false;
      drawScene(t, still);
    }
  });

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);

  return {
    draw: markDirty,
    triggerScan,
    getAspect: () => width / Math.max(1, height),
  };
}

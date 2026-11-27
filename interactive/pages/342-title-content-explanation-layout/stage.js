// 342 内容与标题说明 幻灯片版式 — 开场活体幻灯片 2D Canvas 舞台
// 支持：直接横拖重排 01/02/03 卡片、画布空白处横拖调节对齐与留白、点击四层区域原地手术、
// 前后三页翻页语境切换、按 Space 播放 5 秒观众视线扫视验真。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, computeSlideLayout, evaluateSlide, isOrderAscending } from "./model.js";

const PALETTE = {
  cardIvory: "#F5EDDF",
  cardBorder: "#D2CBB8",
  stepOat: "#EAE5D4",
  stepFlood: "#F3D3BC",
  forest: "#506E59",
  forestDark: "#2D4735",
  forestDeep: "#1F2D23",
  terracotta: "#CB6627",
  terracottaSoft: "#F6DFCE",
  terracottaDark: "#9B410F",
  ink: "#141915",
  inkBody: "#2A332C",
  inkMuted: "#556057",
  danger: "#B83227",
  dangerBg: "#FCEBE9",
  ok: "#2E6A47",
  okBg: "#E6F2EA",
  flatGray: "#6B726C",
  flatBg: "#E6E3DA",
  rule: "#C7C0AC",
};

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

const NO_LINE_START = new Set([..."，。、！？：；）】》」』.,!?;:"]);
const WRAP_CACHE = new Map();
const WIDTH_CACHE = new Map();

function measureW(ctx, text) {
  const key = `${ctx.font}|${text}`;
  const hit = WIDTH_CACHE.get(key);
  if (hit !== undefined) return hit;
  if (WIDTH_CACHE.size > 400) WIDTH_CACHE.clear();
  const w = ctx.measureText(text).width;
  WIDTH_CACHE.set(key, w);
  return w;
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const mw = Math.round(maxWidth);
  const key = `${ctx.font}|${mw}|${maxLines}|${text}`;
  const cached = WRAP_CACHE.get(key);
  if (cached) return cached;
  if (WRAP_CACHE.size > 500) WRAP_CACHE.clear();

  const chars = [...text];
  const lines = [];
  let cur = "";
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = cur + ch;
    if (ctx.measureText(next).width > maxWidth && cur.length > 0) {
      if (lines.length + 1 >= maxLines) {
        let trimmed = cur;
        while (trimmed.length > 1 && ctx.measureText(trimmed + "…").width > maxWidth) {
          trimmed = trimmed.slice(0, -1);
        }
        lines.push(trimmed + "…");
        WRAP_CACHE.set(key, lines);
        return lines;
      }
      // 避头点禁则：不让中文逗号/句号落到下一行开头
      if (NO_LINE_START.has(ch)) {
        if (ctx.measureText(next).width <= maxWidth + 4) {
          lines.push(next);
          cur = "";
        } else if (cur.length > 1) {
          lines.push(cur.slice(0, -1));
          cur = cur.slice(-1) + ch;
        } else {
          lines.push(cur);
          cur = ch;
        }
      } else {
        lines.push(cur);
        cur = ch;
      }
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  const out = lines.slice(0, maxLines);
  WRAP_CACHE.set(key, out);
  return out;
}

// 绘制 342 原海报同款纯净矢量线绘图标（无任何五官细节）
function drawPosterIcon(ctx, kind, cx, cy, r, color, strokeColor) {
  ctx.save();
  ctx.strokeStyle = strokeColor || color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.4, r * 0.13);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (kind === "target") {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
    // 右上斜箭
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.18, cy - r * 0.18);
    ctx.lineTo(cx + r * 0.92, cy - r * 0.92);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.56, cy - r * 0.92);
    ctx.lineTo(cx + r * 0.92, cy - r * 0.92);
    ctx.lineTo(cx + r * 0.92, cy - r * 0.56);
    ctx.stroke();
  } else if (kind === "doc") {
    const w = r * 1.3;
    const h = r * 1.56;
    const x = cx - w / 2;
    const y = cy - h / 2;
    const fold = r * 0.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w - fold, y);
    ctx.lineTo(x + w, y + fold);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const ly = y + h * (0.38 + i * 0.2);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.2, ly);
      ctx.lineTo(x + w * (i === 2 ? 0.62 : 0.78), ly);
      ctx.stroke();
    }
  } else if (kind === "bulb") {
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.12, r * 0.54, Math.PI * 0.78, Math.PI * 2.22);
    ctx.lineTo(cx + r * 0.28, cy + r * 0.55);
    ctx.lineTo(cx - r * 0.28, cy + r * 0.55);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.22, cy + r * 0.78);
    ctx.lineTo(cx + r * 0.22, cy + r * 0.78);
    ctx.stroke();
    // 顶部微光芒
    for (let a = -2; a <= 2; a++) {
      const ang = -Math.PI / 2 + a * 0.52;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * r * 0.78, cy - r * 0.12 + Math.sin(ang) * r * 0.78);
      ctx.lineTo(cx + Math.cos(ang) * r * 1.0, cy - r * 0.12 + Math.sin(ang) * r * 1.0);
      ctx.stroke();
    }
  } else if (kind === "pie") {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r * 0.84, 0, Math.PI * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.14, cy - r * 0.14);
    ctx.arc(cx + r * 0.14, cy - r * 0.14, r * 0.76, -Math.PI * 0.5, 0);
    ctx.closePath();
    ctx.stroke();
  } else if (kind === "people") {
    // 严格遵守红线：纯剪影肩颈圆头，绝不画任何五官
    const drawSil = (ox, oy, s) => {
      ctx.beginPath();
      ctx.arc(ox, oy - s * 0.42, s * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ox, oy + s * 0.65, s * 0.68, Math.PI * 1.08, Math.PI * 1.92);
      ctx.closePath();
      ctx.fill();
    };
    drawSil(cx - r * 0.3, cy + r * 0.06, r * 0.78);
    drawSil(cx + r * 0.38, cy + r * 0.14, r * 0.62);
  } else if (kind === "list") {
    const w = r * 1.32;
    const h = r * 1.5;
    roundRectPath(ctx, cx - w / 2, cy - h / 2, w, h, r * 0.22);
    ctx.fill();
    ctx.strokeStyle = PALETTE.cardIvory;
    ctx.lineWidth = Math.max(1.3, r * 0.14);
    for (let i = 0; i < 3; i++) {
      const ly = cy - h * 0.24 + i * h * 0.24;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.28, ly);
      ctx.lineTo(cx + w * 0.28, ly);
      ctx.stroke();
    }
  } else if (kind === "flag") {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.45, cy - r * 0.85);
    ctx.lineTo(cx - r * 0.45, cy + r * 0.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.45, cy - r * 0.8);
    ctx.lineTo(cx + r * 0.65, cy - r * 0.5);
    ctx.lineTo(cx - r * 0.45, cy - r * 0.12);
    ctx.closePath();
    ctx.fill();
  } else if (kind === "star") {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? r * 0.85 : r * 0.36;
      const px = cx + Math.cos(ang) * rad;
      const py = cy + Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function createHeroStage(canvas, getState, mutateState) {
  const ctx = canvas.getContext("2d");
  let cssW = 760;
  let cssH = 510;
  let dpr = pixelRatio(2);
  let dirty = true;
  let introProgress = 0;
  let lastLayout = null;
  let lastEval = null;

  // 拖拽状态（拖动 01/02/03 卡片互换位置，或空白处横拖调节对齐与留白）
  const drag = {
    active: false,
    pointerId: null,
    mode: null, // "pending" | "card" | "ruler"
    startX: 0,
    startY: 0,
    curX: 0,
    curY: 0,
    cardSlot: -1,
    cardOffsetX: 0,
    baseMargin: 0.068,
    baseJitter: 0,
    moved: false,
  };

  // 卡片平滑补位偏移（slotIdx -> dx）
  const cardSpringX = [0, 0, 0];

  // 鼠标悬停区（用于微高亮可点击部位）
  let hoverTarget = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    cssW = rect.width;
    cssH = rect.height;
    dpr = pixelRatio(cssW <= 440 ? 1.5 : 2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      dirty = true;
    }
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      WRAP_CACHE.clear();
      WIDTH_CACHE.clear();
      dirty = true;
      ctrl.draw();
    });
  }

  function hitTest(x, y) {
    if (!lastLayout) return null;
    const st = getState();
    if (st.deckSlide !== 1) return { kind: "deckBack" };
    // 先查标红直修标签
    for (let i = 0; i < lastLayout.stepBoxes.length; i++) {
      const b = lastLayout.stepBoxes[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        return { kind: "stepCard", slotIdx: i, stepIdx: b.stepIdx };
      }
    }
    const { titleBox, contentBox, supportBox, tipBox } = lastLayout;
    if (x >= titleBox.x && x <= titleBox.x + titleBox.w && y >= titleBox.y && y <= titleBox.y + titleBox.h) {
      return { kind: "title" };
    }
    if (x >= tipBox.x && x <= tipBox.x + tipBox.w && y >= tipBox.y && y <= tipBox.y + tipBox.h) {
      return { kind: "tip" };
    }
    if (x >= supportBox.x && x <= supportBox.x + supportBox.w && y >= supportBox.y && y <= supportBox.y + supportBox.h) {
      return { kind: "support" };
    }
    if (x >= contentBox.x && x <= contentBox.x + contentBox.w && y >= contentBox.y && y <= contentBox.y + contentBox.h) {
      return { kind: "contentHead" };
    }
    return { kind: "paper" };
  }

  function toCanvasCoords(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function onDown(clientX, clientY, pointerId) {
    const pt = toCanvasCoords(clientX, clientY);
    const st = getState();
    lastLayout = computeSlideLayout(st, cssW, cssH);
    const hit = hitTest(pt.x, pt.y);
    drag.active = true;
    drag.pointerId = pointerId;
    drag.startX = pt.x;
    drag.startY = pt.y;
    drag.curX = pt.x;
    drag.curY = pt.y;
    drag.moved = false;
    drag.baseMargin = st.marginRatio;
    drag.baseJitter = st.alignJitter;
    drag.cardOffsetX = 0;
    if (hit && hit.kind === "stepCard" && st.deckSlide === 1) {
      drag.mode = "card";
      drag.cardSlot = hit.slotIdx;
    } else {
      drag.mode = "ruler";
      drag.cardSlot = -1;
    }
    dirty = true;
  }

  function onMove(clientX, clientY, allowPrevent) {
    const pt = toCanvasCoords(clientX, clientY);
    if (!drag.active) {
      const hit = hitTest(pt.x, pt.y);
      const nextHover = hit ? hit.kind : null;
      if (nextHover !== hoverTarget) {
        hoverTarget = nextHover;
        canvas.style.cursor =
          hoverTarget === "stepCard"
            ? "grab"
            : hoverTarget === "title" || hoverTarget === "support" || hoverTarget === "tip" || hoverTarget === "contentHead" || hoverTarget === "deckBack"
              ? "pointer"
              : "ew-resize";
        dirty = true;
      }
      return false;
    }

    const dx = pt.x - drag.startX;
    const dy = pt.y - drag.startY;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 5) return false;
      // 触屏下若纵向滚动意图明显，立刻释放让页面顺畅滚动
      if (allowPrevent && Math.abs(dy) > Math.abs(dx) * 1.35) {
        drag.active = false;
        return false;
      }
      drag.moved = true;
    }

    drag.curX = pt.x;
    drag.curY = pt.y;
    const st = getState();
    if (st.deckSlide !== 1) {
      mutateState({ deckSlide: 1 });
    }

    if (drag.mode === "card" && drag.cardSlot >= 0 && lastLayout) {
      canvas.style.cursor = "grabbing";
      drag.cardOffsetX = dx;
      const box = lastLayout.stepBoxes[drag.cardSlot];
      const stepSpan = lastLayout.stepBoxes[1].x - lastLayout.stepBoxes[0].x;
      // 跨过半张卡宽时立刻交换槽位
      if (dx > stepSpan * 0.48 && drag.cardSlot < 2) {
        const nextOrder = [...st.stepOrder];
        const a = drag.cardSlot;
        const b = drag.cardSlot + 1;
        [nextOrder[a], nextOrder[b]] = [nextOrder[b], nextOrder[a]];
        cardSpringX[a] = stepSpan;
        drag.cardSlot = b;
        drag.startX += stepSpan;
        drag.cardOffsetX = pt.x - drag.startX;
        mutateState({ stepOrder: nextOrder, stepFormat: "flow" });
      } else if (dx < -stepSpan * 0.48 && drag.cardSlot > 0) {
        const nextOrder = [...st.stepOrder];
        const a = drag.cardSlot;
        const b = drag.cardSlot - 1;
        [nextOrder[a], nextOrder[b]] = [nextOrder[b], nextOrder[a]];
        cardSpringX[a] = -stepSpan;
        drag.cardSlot = b;
        drag.startX -= stepSpan;
        drag.cardOffsetX = pt.x - drag.startX;
        mutateState({ stepOrder: nextOrder, stepFormat: "flow" });
      }
    } else if (drag.mode === "ruler") {
      // 横拖推拉对齐与留白呼吸：向右推把留白推向舒适区并拉齐错牙，向左推则反向试错
      const norm = dx / Math.max(180, cssW * 0.55);
      const nextMargin = clamp(drag.baseMargin + norm * 0.075, 0.03, 0.145);
      const nextJitter = clamp(drag.baseJitter - norm * 0.9, 0, 1);
      mutateState({ marginRatio: +nextMargin.toFixed(4), alignJitter: +nextJitter.toFixed(3) });
    }

    dirty = true;
    if (reducedMotion.matches) ctrl.draw();
    return true;
  }

  function onUp() {
    if (!drag.active) return;
    const wasMoved = drag.moved;
    const pt = { x: drag.curX, y: drag.curY };
    drag.active = false;
    drag.pointerId = null;
    drag.cardOffsetX = 0;
    canvas.style.cursor = "grab";

    if (!wasMoved) {
      const hit = hitTest(pt.x, pt.y);
      handleCanvasClick(hit);
    }
    dirty = true;
    if (reducedMotion.matches) ctrl.draw();
  }

  function handleCanvasClick(hit) {
    if (!hit) return;
    const st = getState();
    if (hit.kind === "deckBack") {
      mutateState({ deckSlide: 1 });
      return;
    }
    if (hit.kind === "title") {
      const cycle = { topic: "assertion", assertion: "wall", wall: "topic" };
      mutateState({ headlineMode: cycle[st.headlineMode] || "assertion", focusPillar: "hierarchy" });
    } else if (hit.kind === "contentHead") {
      mutateState({ stepFormat: st.stepFormat === "flow" ? "flat" : "flow", focusPillar: "rhythm" });
    } else if (hit.kind === "stepCard") {
      // 单击卡片：如果当前是平铺或倒挂，直接帮一步排顺或切流；已经排顺则循环把被点卡片推到下一位方便体验倒挂
      if (st.stepFormat === "flat") {
        mutateState({ stepFormat: "flow", focusPillar: "rhythm" });
      } else if (!isOrderAscending(st.stepOrder)) {
        mutateState({ stepOrder: [0, 1, 2], focusPillar: "rhythm" });
      } else {
        const next = [...st.stepOrder];
        const a = hit.slotIdx;
        const b = (a + 1) % 3;
        [next[a], next[b]] = [next[b], next[a]];
        mutateState({ stepOrder: next, focusPillar: "rhythm" });
      }
    } else if (hit.kind === "support") {
      const cycle = { dense: "poster4", poster4: "focus2", focus2: "none", none: "dense" };
      mutateState({ supportMode: cycle[st.supportMode] || "poster4", focusPillar: "rhythm" });
    } else if (hit.kind === "tip") {
      const cycle = { flood: "single", single: "flat", flat: "flood" };
      mutateState({ accentMode: cycle[st.accentMode] || "single", focusPillar: "emphasis" });
    }
  }

  // 鼠标事件
  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    onDown(e.clientX, e.clientY, "mouse");
  });
  window.addEventListener("mousemove", (e) => {
    if (drag.active && drag.pointerId === "mouse") {
      onMove(e.clientX, e.clientY, false);
    } else if (e.target === canvas) {
      onMove(e.clientX, e.clientY, false);
    }
  });
  window.addEventListener("mouseup", () => {
    if (drag.active && drag.pointerId === "mouse") onUp();
  });

  // 触屏事件（兼容 perf.mjs 的 Input.dispatchTouchEvent 且保证页面可正常竖滚）
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      onDown(t.clientX, t.clientY, t.identifier);
    },
    { passive: true },
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!drag.active) return;
      const t = [...e.touches].find((x) => x.identifier === drag.pointerId) || e.touches[0];
      if (!t) return;
      const consumed = onMove(t.clientX, t.clientY, true);
      if (consumed) e.preventDefault();
    },
    { passive: false },
  );
  canvas.addEventListener("touchend", () => onUp(), { passive: true });
  canvas.addEventListener("touchcancel", () => onUp(), { passive: true });

  // 绘制前页 337 或后页 343 的演示翻页上下文预览
  function drawContextSlide(st) {
    const script = computeSlideLayout(st, cssW, cssH).script;
    const isPrev = st.deckSlide === 0;
    const info = isPrev ? script.deckPrev : script.deckNext;

    ctx.save();
    roundRectPath(ctx, 2, 2, cssW - 4, cssH - 4, 14);
    ctx.fillStyle = isPrev ? PALETTE.forestDeep : PALETTE.cardIvory;
    ctx.fill();
    ctx.strokeStyle = isPrev ? "#3E5645" : PALETTE.cardBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const pad = Math.round(cssW * 0.08);
    // 左上小签
    ctx.font = `600 ${Math.max(11, Math.round(cssW * 0.017))}px "IBM Plex Mono", monospace`;
    ctx.fillStyle = isPrev ? "#E88B4D" : PALETTE.terracottaDark;
    ctx.fillText(info.tag, pad, pad + 14);

    if (isPrev) {
      // 337 节标题页：大章号 + 短标题 + 底部提示
      ctx.font = `800 ${Math.round(cssW * 0.13)}px "Outfit", sans-serif`;
      ctx.fillStyle = "rgba(232, 139, 77, 0.25)";
      ctx.fillText(info.num, pad, cssH * 0.56);

      ctx.fillStyle = "#F5EDDF";
      ctx.font = `700 ${Math.round(cssW * 0.056)}px "Noto Sans SC", sans-serif`;
      ctx.fillText(info.title, pad, cssH * 0.48);

      ctx.fillStyle = "#C3D0C5";
      ctx.font = `400 ${Math.round(cssW * 0.022)}px "Noto Sans SC", sans-serif`;
      ctx.fillText(`${info.sub} · 用来给听众换气定章，不在这里塞三步论证`, pad, cssH * 0.59);
    } else {
      // 343 图片与标题说明：左侧大图框 + 右侧简短图注
      const imgW = (cssW - pad * 2) * 0.6;
      const imgH = cssH * 0.58;
      const imgY = pad + 34;
      roundRectPath(ctx, pad, imgY, imgW, imgH, 8);
      ctx.fillStyle = "#D8DEC9";
      ctx.fill();
      ctx.strokeStyle = PALETTE.forest;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 抽象照片构图示意（远山+红日）
      ctx.save();
      roundRectPath(ctx, pad, imgY, imgW, imgH, 8);
      ctx.clip();
      ctx.fillStyle = "#B8BFA9";
      ctx.fillRect(pad, imgY, imgW, imgH);
      ctx.fillStyle = PALETTE.terracotta;
      ctx.beginPath();
      ctx.arc(pad + imgW * 0.72, imgY + imgH * 0.3, Math.min(imgW, imgH) * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.forest;
      ctx.beginPath();
      ctx.moveTo(pad, imgY + imgH);
      ctx.lineTo(pad + imgW * 0.38, imgY + imgH * 0.44);
      ctx.lineTo(pad + imgW * 0.68, imgY + imgH * 0.72);
      ctx.lineTo(pad + imgW, imgY + imgH * 0.48);
      ctx.lineTo(pad + imgW, imgY + imgH);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const tx = pad + imgW + cssW * 0.045;
      const tw = cssW - pad - tx;
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 ${Math.round(cssW * 0.036)}px "Noto Sans SC", sans-serif`;
      const lines = wrapText(ctx, info.title, tw, 2);
      lines.forEach((ln, i) => ctx.fillText(ln, tx, imgY + 32 + i * Math.round(cssW * 0.048)));
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.font = `400 ${Math.round(cssW * 0.019)}px "Noto Sans SC", sans-serif`;
      const subs = wrapText(ctx, `${info.sub}：当实拍照片或界面截图唱主角时，别硬塞三步文字框，交给 343。`, tw, 4);
      subs.forEach((ln, i) => ctx.fillText(ln, tx, imgY + 106 + i * Math.round(cssW * 0.032)));
    }

    // 返回按钮胶囊
    const bw = Math.min(260, cssW * 0.54);
    const bh = 36;
    const bx = pad;
    const by = cssH - pad - bh;
    roundRectPath(ctx, bx, by, bw, bh, 999);
    ctx.fillStyle = PALETTE.terracotta;
    ctx.fill();
    ctx.fillStyle = "#FFF8F2";
    ctx.font = `700 ${Math.max(12, Math.round(cssW * 0.019))}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("点击回到本页 342 · 继续改造", bx + bw / 2, by + bh / 2);
    ctx.restore();
  }

  // 绘制主幻灯片（342）
  function renderSlide(st, t, still) {
    const layout = computeSlideLayout(st, cssW, cssH);
    const evalRes = evaluateSlide(st, layout);
    lastLayout = layout;
    lastEval = evalRes;

    const easeIntro = still ? 1 : clamp(introProgress, 0, 1);

    ctx.clearRect(0, 0, cssW, cssH);

    if (st.deckSlide !== 1) {
      drawContextSlide(st);
      return;
    }

    // 幻灯片纸面底卡
    roundRectPath(ctx, 1, 1, cssW - 2, cssH - 2, 12);
    ctx.fillStyle = PALETTE.cardIvory;
    ctx.fill();
    ctx.strokeStyle = PALETTE.cardBorder;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 留白与左对齐基准参考线（拖动边距/错牙、或聚焦 alignment 柱、或存在对齐问题时显现）
    const showGuide =
      drag.mode === "ruler" ||
      st.focusPillar === "alignment" ||
      !evalRes.pillars.alignment.ok;
    if (showGuide) {
      ctx.save();
      ctx.strokeStyle = evalRes.pillars.alignment.ok ? "rgba(80,110,89,0.42)" : "rgba(184,50,39,0.42)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      // 理想左对齐竖线
      ctx.beginPath();
      ctx.moveTo(layout.innerX, layout.innerY - 4);
      ctx.lineTo(layout.innerX, layout.innerY + layout.innerH + 4);
      ctx.stroke();
      // 安全边距虚框
      ctx.strokeRect(layout.innerX, layout.innerY, layout.innerW, layout.innerH);
      ctx.setLineDash([]);
      // 顶部边距标尺读数（避开超矮画布的标题框，移至右上角干净处）
      ctx.fillStyle = evalRes.pillars.alignment.ok ? PALETTE.forestDark : PALETTE.danger;
      ctx.font = `600 10px "IBM Plex Mono", monospace`;
      ctx.textBaseline = "top";
      if (cssH >= 340) {
        ctx.fillText(`MARGIN ${layout.marginPct}%`, layout.innerX + 2, 2);
      }
      ctx.restore();
    }

    // 1) 标题区
    const { titleBox } = layout;
    const titleBad = !evalRes.pillars.hierarchy.ok;
    const titleFocused = st.focusPillar === "hierarchy" || hoverTarget === "title";
    const titleFillFlood = st.accentMode === "flood";

    if (titleFillFlood || titleFocused || titleBad) {
      ctx.save();
      roundRectPath(ctx, titleBox.x - 6, titleBox.y - 4, titleBox.w + 12, titleBox.h + 4, 8);
      ctx.fillStyle = titleFillFlood
        ? PALETTE.terracottaSoft
        : titleBad
          ? "rgba(184,50,39,0.06)"
          : "rgba(80,110,89,0.07)";
      ctx.fill();
      if (titleBad || titleFocused) {
        ctx.strokeStyle = titleBad ? "rgba(184,50,39,0.55)" : "rgba(80,110,89,0.48)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash(titleBad ? [4, 3] : []);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 赤陶右指三角 ▶（全灰模式时变灰）
    const triSize = Math.max(10, layout.titleFontPx * 0.56);
    const triX = titleBox.x + 2;
    const triY = titleBox.y + (stateLineOffset(st, layout) - triSize * 0.5);
    ctx.save();
    ctx.fillStyle = st.accentMode === "flat" ? PALETTE.flatGray : PALETTE.terracotta;
    ctx.beginPath();
    ctx.moveTo(triX, triY);
    ctx.lineTo(triX + triSize * 0.86, triY + triSize * 0.5);
    ctx.lineTo(triX, triY + triSize);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const textStartX = triX + triSize + 9;
    const titleMaxW = Math.max(100, titleBox.w - (textStartX - titleBox.x) - 6);
    const titleData = layout.script.titles[st.headlineMode];
    ctx.save();
    ctx.fillStyle = titleFillFlood ? PALETTE.terracottaDark : PALETTE.ink;
    ctx.font = `${st.headlineMode === "wall" ? 500 : 900} ${layout.titleFontPx}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    const tLines = wrapText(ctx, titleData.head, titleMaxW, st.headlineMode === "wall" ? 3 : 2);
    const tLH = Math.round(layout.titleFontPx * (st.headlineMode === "wall" ? 1.3 : 1.18));
    tLines.forEach((ln, idx) => {
      ctx.fillText(ln, textStartX, titleBox.y + 4 + idx * tLH);
    });
    if (st.headlineMode !== "wall") {
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.font = `400 ${Math.max(10, layout.bodyFontPx)}px "Noto Sans SC", sans-serif`;
      const subY = titleBox.y + 8 + tLines.length * tLH;
      const subLines = wrapText(ctx, titleData.sub, titleMaxW, 1);
      ctx.fillText(subLines[0] || "", textStartX, Math.min(subY, titleBox.y + titleBox.h - layout.bodyFontPx - 8));
    }
    ctx.restore();

    // 标题区下通宽深细线（1:1 原海报）
    ctx.save();
    ctx.strokeStyle = PALETTE.inkBody;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(titleBox.x, titleBox.y + titleBox.h);
    ctx.lineTo(titleBox.x + titleBox.w, titleBox.y + titleBox.h);
    ctx.stroke();
    ctx.restore();

    // 2) 内容区标头 + 01/02/03 三步卡片
    const { contentBox, stepBoxes } = layout;
    const shortStage = cssH < 340;
    const sq = Math.max(9, Math.round(layout.bodyFontPx * 0.9));
    ctx.save();
    ctx.fillStyle = st.accentMode === "flood" ? PALETTE.terracotta : st.accentMode === "flat" ? PALETTE.flatGray : PALETTE.forest;
    ctx.fillRect(contentBox.x, contentBox.y + 3, sq, sq);
    ctx.fillStyle = PALETTE.ink;
    const cHeadFont = `700 ${Math.round(layout.bodyFontPx * 1.2)}px "Noto Sans SC", sans-serif`;
    ctx.font = cHeadFont;
    ctx.textBaseline = "top";
    ctx.fillText(layout.script.contentLabel, contentBox.x + sq + 8, contentBox.y);
    const cLabelW = measureW(ctx, layout.script.contentLabel);
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.font = `400 ${Math.max(10, layout.bodyFontPx - 0.5)}px "Noto Sans SC", sans-serif`;
    if (shortStage) {
      const cSub = wrapText(ctx, layout.script.contentSub, contentBox.w - sq - cLabelW - 22, 1);
      ctx.fillText(cSub[0] || "", contentBox.x + sq + cLabelW + 18, contentBox.y + 2);
    } else {
      const cSub = wrapText(ctx, layout.script.contentSub, contentBox.w - sq - 12, 1);
      ctx.fillText(cSub[0] || "", contentBox.x + sq + 8, contentBox.y + Math.round(layout.bodyFontPx * 1.52));
    }
    ctx.restore();

    // 先画非拖动中的卡片，最后画正在拖动浮起的卡片
    const drawOrder = [0, 1, 2];
    if (drag.active && drag.mode === "card" && drag.cardSlot >= 0) {
      drawOrder.splice(drawOrder.indexOf(drag.cardSlot), 1);
      drawOrder.push(drag.cardSlot);
    }

    const orderBad = !isOrderAscending(st.stepOrder);
    const stepBad = orderBad || st.stepFormat === "flat";

    // 卡间连接箭头（仅三步流模式下绘制）
    if (st.stepFormat === "flow") {
      ctx.save();
      ctx.strokeStyle = orderBad ? PALETTE.danger : PALETTE.inkBody;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = 0; i < 2; i++) {
        const left = stepBoxes[i];
        const right = stepBoxes[i + 1];
        const ax1 = left.x + left.w + 4;
        const ax2 = right.x - 4;
        const ay = left.y + left.h * 0.5;
        if (ax2 - ax1 > 6) {
          ctx.beginPath();
          ctx.moveTo(ax1, ay);
          ctx.lineTo(ax2, ay);
          ctx.moveTo(ax2 - 5, ay - 4);
          ctx.lineTo(ax2, ay);
          ctx.lineTo(ax2 - 5, ay + 4);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    for (const slotIdx of drawOrder) {
      const box = stepBoxes[slotIdx];
      const isDraggingThis = drag.active && drag.mode === "card" && drag.cardSlot === slotIdx;
      const slideIn = (1 - easeIntro) * (slotIdx - 1) * 14;
      const ox = box.x + (isDraggingThis ? drag.cardOffsetX : cardSpringX[slotIdx]) + slideIn;
      const oy = box.y + (isDraggingThis ? -4 : 0);

      ctx.save();
      if (isDraggingThis) {
        roundRectPath(ctx, ox + 3, oy + 6, box.w, box.h, 8);
        ctx.fillStyle = "rgba(20, 25, 21, 0.14)";
        ctx.fill();
      }
      roundRectPath(ctx, ox, oy, box.w, box.h, 6);
      ctx.fillStyle =
        st.accentMode === "flood"
          ? PALETTE.stepFlood
          : st.stepFormat === "flat"
            ? "#EFECE3"
            : PALETTE.stepOat;
      ctx.fill();

      if (isDraggingThis) {
        ctx.strokeStyle = PALETTE.terracotta;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (stepBad || st.focusPillar === "rhythm") {
        ctx.strokeStyle = stepBad ? "rgba(184,50,39,0.5)" : "rgba(80,110,89,0.45)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash(stepBad ? [4, 3] : []);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 编号绿圆徽（01/02/03，平铺模式下隐藏改为单调黑点）
      const padIn = Math.max(6, Math.round(box.w * 0.062));
      const badgeR = Math.max(9.5, Math.min(13.5, box.w * 0.092));
      if (st.stepFormat === "flow") {
        ctx.beginPath();
        ctx.arc(ox + padIn + badgeR, oy + padIn + badgeR, badgeR, 0, Math.PI * 2);
        ctx.fillStyle =
          st.accentMode === "flood"
            ? PALETTE.terracotta
            : st.accentMode === "flat"
              ? PALETTE.flatGray
              : orderBad && box.stepIdx !== slotIdx
                ? PALETTE.danger
                : PALETTE.forest;
        ctx.fill();
        ctx.fillStyle = "#F7F3E9";
        ctx.font = `600 ${Math.max(10, Math.round(badgeR * 0.96))}px "IBM Plex Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(box.step.num, ox + padIn + badgeR, oy + padIn + badgeR + 0.5);
      } else {
        ctx.beginPath();
        ctx.arc(ox + padIn + 5, oy + padIn + 8, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE.inkMuted;
        ctx.fill();
      }

      // 拖拽微握点（右上三点，提示可横拖换序）
      if (st.stepFormat === "flow") {
        ctx.fillStyle = isDraggingThis ? PALETTE.terracotta : "rgba(80,110,89,0.45)";
        for (let d = 0; d < 3; d++) {
          ctx.beginPath();
          ctx.arc(ox + box.w - padIn - d * 5, oy + padIn + 6, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 图标（平铺模式去掉图标凸显干瘪）
      const iconR = Math.max(10, Math.min(16, box.h * 0.125));
      if (st.stepFormat === "flow") {
        drawPosterIcon(
          ctx,
          box.step.icon,
          ox + box.w * 0.5,
          oy + box.h * (layout.compact ? 0.34 : 0.36),
          iconR,
          PALETTE.ink,
          PALETTE.ink,
        );
      }

      // 步骤标题与短解（按卡片实际高度防越界裁剪）
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = PALETTE.ink;
      const sTitlePx = Math.max(10.5, Math.round(layout.bodyFontPx * (shortStage ? 1.04 : 1.12)));
      ctx.font = `700 ${sTitlePx}px "Noto Sans SC", sans-serif`;
      const titleY = oy + box.h * (st.stepFormat === "flow" ? (shortStage ? 0.5 : 0.51) : 0.24);
      ctx.fillText(box.step.title, ox + box.w * 0.5, titleY);

      ctx.fillStyle = PALETTE.inkBody;
      const sBodyPx = Math.max(10, Math.round(layout.bodyFontPx * 0.86));
      ctx.font = `400 ${sBodyPx}px "Noto Sans SC", sans-serif`;
      const bLH = Math.round(sBodyPx * 1.28);
      const bodyStartY = titleY + sTitlePx + 4;
      const availLines = Math.max(1, Math.min(3, Math.floor((oy + box.h - 6 - bodyStartY) / bLH)));
      const bodyLines = wrapText(ctx, box.step.body, box.w - padIn * 2, availLines);
      bodyLines.forEach((ln, idx) => {
        ctx.fillText(ln, ox + box.w * 0.5, bodyStartY + idx * bLH);
      });
      ctx.restore();
    }

    // 中间水平虚线分隔（1:1 原海报）
    ctx.save();
    ctx.strokeStyle = PALETTE.rule;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(contentBox.x, contentBox.y + contentBox.h + Math.round(layout.innerH * 0.014));
    ctx.lineTo(contentBox.x + contentBox.w, contentBox.y + contentBox.h + Math.round(layout.innerH * 0.014));
    ctx.stroke();
    ctx.restore();

    // 3) 支持模块（精准量宽，同行排副注，绝不压到底部小卡）
    const { supportBox, supportBoxes } = layout;
    ctx.save();
    ctx.fillStyle = st.accentMode === "flood" ? PALETTE.terracotta : st.accentMode === "flat" ? PALETTE.flatGray : PALETTE.forest;
    ctx.fillRect(supportBox.x, supportBox.y + 3, sq, sq);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 ${Math.round(layout.bodyFontPx * 1.16)}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText(layout.script.supportLabel, supportBox.x + sq + 8, supportBox.y);
    const sLabelW = measureW(ctx, layout.script.supportLabel);
    const supSubX = supportBox.x + sq + sLabelW + 18;
    const supSubW = supportBox.x + supportBox.w - supSubX;
    if (supSubW > 70) {
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.font = `400 ${Math.max(10, layout.bodyFontPx - 0.8)}px "Noto Sans SC", sans-serif`;
      const sSub = wrapText(ctx, layout.script.supportSub, supSubW, 1);
      ctx.fillText(sSub[0] || "", supSubX, supportBox.y + 1.5);
    }
    ctx.restore();

    if (st.supportMode === "none") {
      // 空洞无证据槽位提示
      ctx.save();
      const ey = supportBox.y + Math.round(supportBox.h * 0.34);
      const eh = Math.max(36, supportBox.h * 0.62);
      roundRectPath(ctx, supportBox.x, ey, supportBox.w, eh, 6);
      ctx.fillStyle = "rgba(184,50,39,0.06)";
      ctx.fill();
      ctx.strokeStyle = PALETTE.danger;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.fillStyle = PALETTE.danger;
      ctx.font = `600 ${Math.max(11, layout.bodyFontPx)}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("支持模块已清空 · 缺少数据与案例背书（点此补回）", supportBox.x + supportBox.w / 2, ey + eh / 2);
      ctx.restore();
    } else {
      for (const sb of supportBoxes) {
        ctx.save();
        roundRectPath(ctx, sb.x, sb.y, sb.w, sb.h, 4);
        ctx.fillStyle = st.accentMode === "flood" ? PALETTE.terracottaSoft : st.supportMode === "dense" ? "#F7EBE7" : "rgba(255,253,248,0.5)";
        ctx.fill();
        ctx.strokeStyle =
          st.supportMode === "dense"
            ? PALETTE.danger
            : st.accentMode === "flood"
              ? PALETTE.terracotta
              : "#8D8A7E";
        ctx.lineWidth = st.supportMode === "dense" ? 1.3 : 1;
        ctx.stroke();

        const compactSup = sb.h < 68;
        const icR = compactSup ? Math.max(5.8, Math.min(8.2, sb.h * 0.145)) : Math.max(7.5, Math.min(11, sb.h * 0.175));
        const icColor =
          st.accentMode === "flood"
            ? PALETTE.terracotta
            : st.accentMode === "flat"
              ? PALETTE.flatGray
              : PALETTE.forest;
        const ultraShortCard = sb.h < 38;
        if (ultraShortCard) {
          drawPosterIcon(ctx, sb.icon, sb.x + 14, sb.y + sb.h * 0.5, icR * 0.85, icColor, icColor);
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle = PALETTE.ink;
          ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
          ctx.fillText(sb.title, sb.x + 25, sb.y + sb.h * 0.5 + 0.5);
        } else {
          const topPad = compactSup ? 4 : 6;
          drawPosterIcon(ctx, sb.icon, sb.x + sb.w / 2, sb.y + icR + topPad, icR, icColor, icColor);

          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = PALETTE.ink;
          const stPx = Math.max(10, Math.round(layout.bodyFontPx * (compactSup ? 0.9 : 0.96)));
          ctx.font = `700 ${stPx}px "Noto Sans SC", sans-serif`;
          const ty = sb.y + icR * 2 + topPad + (compactSup ? 3 : 4);
          ctx.fillText(sb.title, sb.x + sb.w / 2, ty);

          const copy = st.supportMode === "dense" ? sb.dense : sb.short;
          ctx.fillStyle = st.supportMode === "dense" ? PALETTE.danger : PALETTE.inkMuted;
          const scPx = Math.max(10, Math.round(layout.bodyFontPx * (st.supportMode === "dense" ? 0.8 : 0.84)));
          ctx.font = `400 ${scPx}px "Noto Sans SC", sans-serif`;
          const bodyY = ty + stPx + (compactSup ? 2 : 4);
          const lh = Math.round(scPx * 1.2);
          const availH = sb.y + sb.h - 2 - bodyY;
          const capLn = st.supportMode === "dense" ? 3 : 2;
          const availLines = Math.min(capLn, Math.floor((availH + lh - scPx) / lh));
          if (availLines >= 1) {
            const lines = wrapText(ctx, copy, sb.w - 10, availLines);
            lines.forEach((ln, idx) => {
              ctx.fillText(ln, sb.x + sb.w / 2, bodyY + idx * lh);
            });
          }
        }
        ctx.restore();
      }
    }

    // 4) 底部「核心提示」通栏横幅（1:1 原海报赤陶圆角横幅）
    const { tipBox } = layout;
    ctx.save();
    roundRectPath(ctx, tipBox.x, tipBox.y, tipBox.w, tipBox.h, 8);
    ctx.fillStyle = st.accentMode === "flat" ? PALETTE.flatBg : PALETTE.terracotta;
    ctx.fill();
    if (st.focusPillar === "emphasis" || hoverTarget === "tip") {
      ctx.strokeStyle = st.accentMode === "flat" ? PALETTE.danger : "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const starR = Math.max(11, Math.min(16, tipBox.h * 0.34));
    const starCx = tipBox.x + starR + 14;
    const starCy = tipBox.y + tipBox.h / 2;
    ctx.beginPath();
    ctx.arc(starCx, starCy, starR, 0, Math.PI * 2);
    ctx.strokeStyle = st.accentMode === "flat" ? PALETTE.flatGray : "#FFF4EC";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    drawPosterIcon(ctx, "star", starCx, starCy, starR * 0.62, st.accentMode === "flat" ? PALETTE.flatGray : "#FFF4EC");

    const labelX = starCx + starR + 10;
    ctx.fillStyle = st.accentMode === "flat" ? PALETTE.inkBody : "#FFFFFF";
    ctx.font = `700 ${Math.max(12, Math.round(layout.bodyFontPx * 1.18))}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText(layout.script.tipTitle, labelX, starCy);

    const divX = labelX + Math.round(layout.bodyFontPx * 5.2);
    ctx.strokeStyle = st.accentMode === "flat" ? "rgba(42,51,44,0.3)" : "rgba(255,244,236,0.45)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(divX, tipBox.y + tipBox.h * 0.24);
    ctx.lineTo(divX, tipBox.y + tipBox.h * 0.76);
    ctx.stroke();

    const bodyX = divX + 12;
    const bodyMaxW = Math.max(80, tipBox.x + tipBox.w - bodyX - 12);
    ctx.fillStyle = st.accentMode === "flat" ? PALETTE.inkMuted : "#FFF8F2";
    const tipBodyPx = Math.max(10, Math.round(layout.bodyFontPx * 0.96));
    ctx.font = `500 ${tipBodyPx}px "Noto Sans SC", sans-serif`;
    const tipLines = wrapText(ctx, layout.script.tipBody, bodyMaxW, 2);
    const totalTH = tipLines.length * Math.round(tipBodyPx * 1.32);
    tipLines.forEach((ln, i) => {
      ctx.fillText(ln, bodyX, starCy - totalTH / 2 + tipBodyPx * 0.6 + i * Math.round(tipBodyPx * 1.32));
    });
    ctx.restore();

    // 5) 标红就地病灶小浮签（仅标出当前最紧急 1 处，清爽不糊脸）
    if (evalRes.primary && !st.scanActive) {
      drawPrimaryBadge(ctx, evalRes.primary, layout);
    }

    // 6) 5 秒观众扫视演练光流（按 Space 触发）
    if (st.scanActive) {
      drawAudienceScan(ctx, st, layout, evalRes);
    }
  }

  function stateLineOffset(st, layout) {
    return st.headlineMode === "wall" ? layout.titleFontPx * 0.82 : layout.titleFontPx * 0.72;
  }

  function drawPrimaryBadge(ctx, issue, layout) {
    let bx = layout.titleBox.x + layout.titleBox.w - 134;
    let by = layout.titleBox.y + 4;
    let text = `× ${issue.short} · 点此改`;
    if (issue.targetArea === "steps") {
      bx = layout.stepBoxes[0].x + 6;
      by = layout.stepBoxes[0].y - 11;
      text = `× ${issue.short} · 拖卡换序`;
    } else if (issue.targetArea === "support") {
      bx = layout.supportBox.x + layout.supportBox.w - 148;
      by = layout.supportBox.y - 2;
      text = `× ${issue.short} · 点此精简`;
    } else if (issue.targetArea === "tip") {
      bx = layout.tipBox.x + layout.tipBox.w - 148;
      by = layout.tipBox.y - 11;
      text = `× ${issue.short} · 点此收口`;
    } else if (issue.targetArea === "align" || issue.targetArea === "margin") {
      bx = layout.innerX + 86;
      by = Math.max(4, layout.innerY - 2);
      text = `× ${issue.short} · 横拖校准`;
    }

    ctx.save();
    ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
    const tw = measureW(ctx, text) + 16;
    const th = 20;
    const clampedX = clamp(bx, 8, cssW - tw - 8);
    const clampedY = clamp(by, 4, cssH - th - 4);
    roundRectPath(ctx, clampedX, clampedY, tw, th, 999);
    ctx.fillStyle = PALETTE.danger;
    ctx.fill();
    ctx.fillStyle = "#FFF8F6";
    ctx.textBaseline = "middle";
    ctx.fillText(text, clampedX + 8, clampedY + th / 2 + 0.5);
    ctx.restore();
  }

  function drawAudienceScan(ctx, st, layout, evalRes) {
    const pts = layout.scanWaypoints;
    if (!pts.length) return;
    const curT = clamp(st.scanTime, 0, 5.0);
    const isOk = evalRes.passCount === 4;

    ctx.save();
    // 画出已走过的扫视路径虚线
    ctx.beginPath();
    let curPos = { x: pts[0].x, y: pts[0].y };
    let activeIdx = 0;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        const prev = pts[i - 1];
        if (curT >= p.t) {
          ctx.lineTo(p.x, p.y);
          curPos = { x: p.x, y: p.y };
          activeIdx = i;
        } else if (curT > prev.t) {
          const frac = (curT - prev.t) / Math.max(0.01, p.t - prev.t);
          const ix = prev.x + (p.x - prev.x) * frac;
          const iy = prev.y + (p.y - prev.y) * frac;
          ctx.lineTo(ix, iy);
          curPos = { x: ix, y: iy };
          activeIdx = i;
          break;
        } else {
          break;
        }
      }
    }
    ctx.strokeStyle = isOk ? PALETTE.ok : PALETTE.danger;
    ctx.lineWidth = 2.4;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 每个已触达节点画停留序号圈
    pts.forEach((p, idx) => {
      if (curT < p.t - 0.15) return;
      const nodeColor = p.bad ? PALETTE.danger : PALETTE.ok;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor;
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 10px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(idx + 1), p.x, p.y + 0.5);

      // 节点短标签
      ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
      const lw = ctx.measureText(p.label).width + 12;
      const lx = clamp(p.x - lw / 2, 8, cssW - lw - 8);
      const ly = clamp(p.y + 16, 8, cssH - 24);
      roundRectPath(ctx, lx, ly, lw, 19, 4);
      ctx.fillStyle = p.bad ? PALETTE.dangerBg : PALETTE.okBg;
      ctx.fill();
      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = nodeColor;
      ctx.fillText(p.label, lx + lw / 2, ly + 10);
    });

    // 当前视线游标涟漪圈
    const pulse = 16 + Math.sin(curT * 10) * 3;
    ctx.beginPath();
    ctx.arc(curPos.x, curPos.y, pulse, 0, Math.PI * 2);
    ctx.strokeStyle = isOk ? "rgba(46,106,71,0.55)" : "rgba(184,50,39,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 右上 5 秒扫视计分条
    const timerText = `${curT.toFixed(1)}s / 5.0s · ${isOk ? "顺流读懂" : "视线卡壳折返"}`;
    ctx.font = `600 11px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(timerText).width + 20;
    const tx = cssW - tw - 10;
    const ty = 10;
    roundRectPath(ctx, tx, ty, tw, 24, 999);
    ctx.fillStyle = isOk ? PALETTE.forestDeep : PALETTE.danger;
    ctx.fill();
    ctx.fillStyle = "#FFFDF8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(timerText, tx + tw / 2, ty + 12.5);
    ctx.restore();
  }

  const ctrl = loop(canvas, (t, dt, { still }) => {
    const st = getState();
    let animating = false;

    if (still) {
      introProgress = 1;
    } else if (introProgress < 1) {
      introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 2.2);
      animating = true;
    }

    // 卡片弹簧阻尼归零
    for (let i = 0; i < 3; i++) {
      if (Math.abs(cardSpringX[i]) > 0.4) {
        cardSpringX[i] *= Math.pow(0.001, Math.max(dt, 0.016));
        animating = true;
      } else {
        cardSpringX[i] = 0;
      }
    }

    // 5 秒扫视推进
    if (st.scanActive) {
      if (still) {
        mutateState({ scanTime: 5.0 }, { silent: true });
      } else {
        const nextT = st.scanTime + Math.max(dt, 0.016) * 1.15;
        if (nextT >= 5.0) {
          mutateState({ scanTime: 5.0, scanActive: false });
        } else {
          mutateState({ scanTime: nextT }, { silent: true });
          animating = true;
        }
      }
    }

    if (!dirty && !animating) return;
    dirty = false;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderSlide(st, t, still);
    ctx.restore();
  });

  return {
    markDirty() {
      dirty = true;
      if (reducedMotion.matches) ctrl.draw();
    },
    getMetrics() {
      const st = getState();
      const layout = computeSlideLayout(st, cssW, cssH);
      return { layout, evalRes: evaluateSlide(st, layout) };
    },
    destroy() {
      ro.disconnect();
    },
  };
}

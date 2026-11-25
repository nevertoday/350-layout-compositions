// 154 区块式版式 · 活体区块排版压机 2D Canvas 渲染与交互
// 严格只从 model.js 计算的几何与状态渲染，不含独立常量。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PALETTE, THEMES, SURFACE_CYCLE, clampGutter, computeLayout } from "./model.js";

const FONT_SANS = '"Noto Sans SC", "Space Grotesk", sans-serif';
const FONT_COND = '"Big Shoulders", "Noto Sans SC", sans-serif';
const FONT_MONO = '"DM Mono", "Noto Sans SC", monospace';

export function mountWorkbench({ canvas, miniCanvas, state, onChange }) {
  const ctx = canvas.getContext("2d");
  const mctx = miniCanvas ? miniCanvas.getContext("2d") : null;

  // 眯眼模糊离屏极速缓冲（兼容软件渲染 60fps，不触发慢速 CSS filter）
  const blurBuf = document.createElement("canvas");
  blurBuf.width = 76;
  blurBuf.height = 52;
  const bctx = blurBuf.getContext("2d");

  let hitBlocks = [];
  let hitChips = [];
  let latestLayout = null;
  let hoveredId = null;

  // 墨幕切换微动效：按 block id 记下上一次色面与进度 (0..1)
  const wipes = new Map();
  let introT = 0; // 开场平滑入画进度 (0..1)
  let dragCue = { active: false, x: 0, label: "" };
  let dirty = true;
  let lastSize = "";

  function markDirty() {
    dirty = true;
  }

  function resizeCanvases() {
    const dpr = pixelRatio(2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(240, Math.round(rect.width));
    const h = Math.max(200, Math.round(rect.height));
    const sig = `${w}x${h}@${dpr}`;
    if (sig !== lastSize) {
      lastSize = sig;
      dirty = true;
    }
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dirty = true;
    }
    if (miniCanvas && mctx) {
      const mr = miniCanvas.getBoundingClientRect();
      const mw = Math.max(120, Math.round(mr.width));
      const mh = Math.max(64, Math.round(mr.height));
      if (miniCanvas.width !== Math.round(mw * dpr) || miniCanvas.height !== Math.round(mh * dpr)) {
        miniCanvas.width = Math.round(mw * dpr);
        miniCanvas.height = Math.round(mh * dpr);
        dirty = true;
      }
    }
    return { w, h, dpr };
  }

  function triggerWipe(blockId, prevSurface) {
    wipes.set(blockId, { prev: prevSurface, p: 0 });
    dirty = true;
  }

  function drawMini(layout, dpr) {
    if (!miniCanvas || !mctx) return;
    const mw = miniCanvas.width / dpr;
    const mh = miniCanvas.height / dpr;
    mctx.save();
    mctx.scale(dpr, dpr);
    mctx.fillStyle = "#080907";
    mctx.fillRect(0, 0, mw, mh);

    const pad = 8;
    const sx = (mw - pad * 2) / layout.width;
    const sy = (mh - pad * 2) / layout.height;

    for (const b of layout.blocks) {
      const pal = PALETTE[b.surface] || PALETTE.cream;
      const x = pad + b.x * sx;
      const y = pad + b.y * sy;
      const w = Math.max(4, b.w * sx);
      const h = Math.max(4, b.h * sy);
      mctx.fillStyle = pal.fill;
      mctx.fillRect(x, y, w, h);
      if (b.surface === "black") {
        mctx.strokeStyle = "#2E332C";
        mctx.lineWidth = 1;
        mctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      }
      // 极简抽象条纹呼应 154 原海报右上小窗
      if (b.primary && w > 24 && h > 16) {
        mctx.fillStyle = b.surface === "black" ? "#F6E9D7" : "#0A0B08";
        mctx.globalAlpha = 0.25;
        mctx.fillRect(x + 4, y + 5, Math.min(w - 8, w * 0.55), 2.5);
        if (h > 26) mctx.fillRect(x + 4, y + 10, Math.min(w - 8, w * 0.35), 2);
        mctx.globalAlpha = 1;
      }
    }
    mctx.restore();
  }

  function drawDecor(b, pal, spec, w, h) {
    // 复刻 154 原海报四例最具辨识度的几何母题
    if (b.id === "guide" && spec.decor.guideStyle === "dots3") {
      const r = Math.max(4, Math.min(8, w * 0.14));
      const cx = b.x + w * 0.5;
      const startY = b.y + h * 0.26;
      const stepY = Math.min(26, (h * 0.48) / 2);
      ctx.fillStyle = pal.ink;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, startY + i * stepY, r, 0, Math.PI * 2);
        ctx.fill();
      }
      return true;
    }
    if (b.id === "guide" && spec.decor.guideStyle === "dotgrid" && w > 64 && h > 90) {
      const cols = 4;
      const rows = 5;
      const gx0 = b.x + w - Math.min(w * 0.44, 62);
      const gy0 = b.y + Math.max(42, h * 0.38);
      const stepX = Math.min(13, (w * 0.36) / (cols - 1));
      const stepY = Math.min(14, (h * 0.42) / (rows - 1));
      ctx.fillStyle = pal.ink;
      ctx.globalAlpha = 0.72;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.beginPath();
          ctx.arc(gx0 + c * stepX, gy0 + r * stepY, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
    if (b.id === "guide" && spec.decor.guideStyle === "triplets" && w > 180) {
      // 原海报右上示例底部的三等分青块竖隔
      const third = w / 3;
      ctx.fillStyle = "#080907";
      const sep = Math.max(3, Math.min(10, state.gutter * 0.5 || 4));
      ctx.fillRect(b.x + third - sep / 2, b.y, sep, h);
      ctx.fillRect(b.x + third * 2 - sep / 2, b.y, sep, h);
    }
    return false;
  }

  function fitText(text, maxW, font, minPx = 10) {
    ctx.font = font;
    if (ctx.measureText(text).width <= maxW) return text;
    let s = text;
    while (s.length > 2 && ctx.measureText(s + "…").width > maxW) s = s.slice(0, -1);
    return s + "…";
  }

  function drawBlockContent(b, pal, theme, spec, compact) {
    const key = b.parentId || b.id;
    const copy = theme.blocks[key];
    if (!copy) return;

    const padX = Math.max(8, Math.min(16, Math.round(b.w * 0.065)));
    const padY = Math.max(7, Math.min(14, Math.round(b.h * 0.08)));
    const innerW = Math.max(18, b.w - padX * 2);
    const hasMisplaced = !state.grouped && theme.misplaced.some((m) => m.wrongZone === key);
    const bottomReserve = hasMisplaced ? (compact ? 28 : 32) : 0;
    const contentBottom = b.y + b.h - padY - bottomReserve;

    // 若是过碎压测生成的次碎片，绘制碎片标签
    if (!b.primary) {
      ctx.fillStyle = pal.ink;
      ctx.font = `600 ${compact ? 10 : 11}px ${FONT_MONO}`;
      ctx.fillText(fitText(`FRAG · ${copy.role}`, innerW, ctx.font), b.x + padX, b.y + padY + 11);
      ctx.fillStyle = pal.ink;
      ctx.globalAlpha = 0.28;
      const bars = Math.min(3, Math.floor((b.h - padY * 2 - 18) / 10));
      for (let i = 0; i < bars; i++) {
        ctx.fillRect(b.x + padX, b.y + padY + 20 + i * 10, innerW * (0.85 - i * 0.16), 4);
      }
      ctx.globalAlpha = 1;
      return;
    }

    // 左侧青轨 3 圆点模式（空间极窄时先绘 3 圆点，再写竖向简标）
    const railDotsOnly = drawDecor(b, pal, spec, b.w, b.h);
    if (railDotsOnly) {
      ctx.fillStyle = pal.ink;
      ctx.font = `700 10px ${FONT_MONO}`;
      const lbl = fitText("02", innerW, ctx.font);
      ctx.fillText(lbl, b.x + padX, b.y + padY + 10);
      if (b.h > 130) {
        ctx.font = `700 10px ${FONT_SANS}`;
        const foot = fitText("导览", innerW, ctx.font);
        ctx.fillText(foot, b.x + padX, b.y + b.h - padY);
      }
      return;
    }

    // 区块左上小号编号与角色标签
    let cy = b.y + padY;
    const showTag = b.h >= 46 && b.w >= 86;
    if (showTag) {
      ctx.fillStyle = pal.subInk;
      ctx.font = `500 ${compact ? 10 : 11}px ${FONT_MONO}`;
      const tagStr = fitText(`${copy.tag} · ${b.areaPct}%`, innerW, ctx.font);
      ctx.fillText(tagStr, b.x + padX, cy + 10);
      cy += compact ? 14 : 17;
    }

    // 主标题（按区块面积自适配字号，保证大块显重、小块克制）
    const titleSize =
      key === "hero"
        ? Math.max(14, Math.min(compact ? 20 : 28, Math.round(Math.min(b.w * 0.11, b.h * 0.23))))
        : Math.max(11, Math.min(compact ? 14 : 17, Math.round(Math.min(b.w * 0.08, b.h * 0.19))));

    if (b.h >= 34 && b.w >= 54) {
      ctx.fillStyle = pal.ink;
      ctx.font = `${key === "hero" ? 900 : 700} ${titleSize}px ${FONT_SANS}`;
      const titleY = cy + titleSize * 0.92;
      if (titleY < contentBottom + 2) {
        ctx.fillText(fitText(copy.title, innerW, ctx.font), b.x + padX, titleY);
        cy = titleY + (compact ? 5 : 7);
      }
    }

    // 副标题或正文行（或抽象版式条纹呼应 154 海报）
    if (key === "body" && copy.lines && b.h > 76 && b.w > 110) {
      ctx.fillStyle = pal.subInk;
      const bodySize = compact ? 10 : 12;
      ctx.font = `400 ${bodySize}px ${FONT_SANS}`;
      for (const line of copy.lines) {
        if (cy + bodySize + 3 > contentBottom) break;
        ctx.fillText(fitText(line, innerW, ctx.font), b.x + padX, cy + bodySize);
        cy += bodySize + 4;
      }
      // 剩余空间补 1–2 条经典 154 抽象文本线增强视觉体量感
      ctx.fillStyle = pal.barInk;
      ctx.globalAlpha = 0.18;
      let barW = innerW * 0.88;
      while (cy + 8 < contentBottom - 8 && barW > 30) {
        ctx.fillRect(b.x + padX, cy + 4, barW, 4);
        cy += 10;
        barW *= 0.82;
      }
      ctx.globalAlpha = 1;
    } else if (copy.sub && b.h > 64 && b.w > 90 && cy + 14 < contentBottom) {
      ctx.fillStyle = pal.subInk;
      const subSize = compact ? 10 : 12;
      ctx.font = `500 ${subSize}px ${FONT_SANS}`;
      ctx.fillText(fitText(copy.sub, innerW, ctx.font), b.x + padX, cy + subSize);
      cy += subSize + 8;
    }

    // 右下极性小角标（有错组红标且空间较窄时避让不重叠）
    if (b.w >= 96 && b.h >= 54 && !state.squint && (!hasMisplaced || b.w >= 260)) {
      const badgeText = pal.label;
      ctx.font = `500 10px ${FONT_MONO}`;
      const tw = ctx.measureText(badgeText).width + 10;
      const bx = b.x + b.w - padX - tw;
      const by = b.y + b.h - padY - 16;
      if (by > cy - 2 && bx > b.x + padX) {
        ctx.fillStyle = b.surface === "black" ? "rgba(246,233,215,0.14)" : "rgba(10,11,8,0.11)";
        ctx.fillRect(bx, by, tw, 16);
        ctx.fillStyle = pal.ink;
        ctx.fillText(badgeText, bx + 5, by + 11.5);
      }
    }

    // 若存在错组混装项，绘制可直点归位的赤红虚线警告签
    if (hasMisplaced) {
      for (const m of theme.misplaced) {
        if (m.wrongZone === key && b.w > 90 && b.h > 52) {
          const chipLabel = `! ${m.text}`;
          ctx.font = `700 ${compact ? 10 : 11}px ${FONT_SANS}`;
          const maxChipW = b.w >= 260 ? Math.max(70, innerW - 60) : Math.max(70, innerW);
          const fitted = fitText(chipLabel, maxChipW - 14, ctx.font);
          const cw = Math.min(maxChipW, ctx.measureText(fitted).width + 16);
          const ch = compact ? 22 : 24;
          const cx = b.x + padX;
          const chipY = Math.max(b.y + padY + 14, b.y + b.h - padY - ch);

          ctx.fillStyle = "#B42318";
          ctx.fillRect(cx, chipY, cw, ch);
          ctx.strokeStyle = "#F6E9D7";
          ctx.lineWidth = 1.25;
          ctx.setLineDash([4, 3]);
          ctx.strokeRect(cx + 1, chipY + 1, cw - 2, ch - 2);
          ctx.setLineDash([]);
          ctx.fillStyle = "#FCF8F1";
          ctx.fillText(fitted, cx + 8, chipY + (compact ? 15 : 16));
          hitChips.push({ id: m.id, x: cx, y: chipY, w: cw, h: ch });
        }
      }
    }
  }

  function renderFrame(t, dt, { still }) {
    const { w, h, dpr } = resizeCanvases();
    const compact = w < 440;
    const animating = !still && (introT < 1 || wipes.size > 0);
    if (!dirty && !animating && !still) return;
    dirty = false;

    if (still) {
      introT = 1;
      wipes.clear();
    } else {
      introT = Math.min(1, introT + Math.max(dt, 0.016) * 2.6);
      for (const [id, wObj] of wipes) {
        wObj.p += Math.max(dt, 0.016) * 4.5;
        if (wObj.p >= 1) wipes.delete(id);
      }
    }

    const layout = computeLayout(state, w, h);
    latestLayout = layout;
    const theme = THEMES[state.theme] || THEMES.exhibition;

    hitBlocks = [];
    hitChips = [];

    ctx.save();
    ctx.scale(dpr, dpr);

    // 154 原海报炭墨黑展示舱底
    ctx.fillStyle = "#080907";
    ctx.fillRect(0, 0, w, h);

    // 若 0px 无界堆叠态：底面先铺整张暖骨纸，真实呈现「无沟槽粘成一片」
    if (layout.gutter === 0 && state.structureMode !== "shattered") {
      const ir = layout.innerRect;
      ctx.fillStyle = "#F6E9D7";
      ctx.fillRect(ir.x, ir.y, ir.w, ir.h);
    }

    // 绘制每一个真实几何区块（带平滑开场入场缓动）
    const ease = 1 - Math.pow(1 - introT, 3);
    for (let i = 0; i < layout.blocks.length; i++) {
      const b = layout.blocks[i];
      const pal = PALETTE[b.surface] || PALETTE.cream;
      const stagger = Math.min(1, Math.max(0, ease * 1.25 - i * 0.07));
      const drawH = b.h * (0.92 + 0.08 * stagger);
      const drawY = b.y + (b.h - drawH) * 0.5;

      // 墨幕换色过渡
      const wipe = wipes.get(b.id);
      if (wipe && !still) {
        const prevPal = PALETTE[wipe.prev] || PALETTE.cream;
        ctx.fillStyle = prevPal.fill;
        ctx.fillRect(b.x, drawY, b.w, drawH);
        const wp = 1 - Math.pow(1 - wipe.p, 3);
        ctx.fillStyle = pal.fill;
        ctx.fillRect(b.x, drawY, b.w * wp, drawH);
      } else {
        ctx.fillStyle = pal.fill;
        ctx.fillRect(b.x, drawY, b.w, drawH);
      }

      // 炭黑块在炭黑舱内需要 1px 清晰轮廓线才可辨识
      if (b.surface === "black") {
        ctx.strokeStyle = "#3A4038";
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x + 0.5, drawY + 0.5, b.w - 1, drawH - 1);
      } else if (layout.gutter === 0) {
        // 0px 堆叠态：仅极弱发虚灰线暗示本该是四块，却粘在了一起
        ctx.strokeStyle = "rgba(10,11,8,0.16)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(b.x + 0.5, drawY + 0.5, b.w - 1, drawH - 1);
        ctx.setLineDash([]);
      }

      // 悬停或原则联动高亮描边
      const highlightByPrinciple =
        (state.highlightPrinciple === "contrast" && (b.surface === "orange" || b.surface === "cyan" || b.id === "body")) ||
        (state.highlightPrinciple === "hierarchy" && b.id === "hero") ||
        (state.highlightPrinciple === "structure" && b.drift > 0);
      if (hoveredId === b.id || highlightByPrinciple) {
        ctx.strokeStyle = b.surface === "cyan" ? "#0A0B08" : "#22C9E6";
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x + 1, drawY + 1, b.w - 2, drawH - 2);
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(b.x, drawY, b.w, drawH);
      ctx.clip();
      drawBlockContent({ ...b, y: drawY, h: drawH }, pal, theme, layout.spec, compact);
      ctx.restore();

      hitBlocks.push({ id: b.parentId || b.id, x: b.x, y: drawY, w: b.w, h: drawH });
    }

    // 错位散架态或结构透视：标出理想外框齐边基准线
    if ((state.structureMode === "jitter" || state.xray || state.highlightPrinciple === "structure") && !state.squint) {
      const ir = layout.innerRect;
      ctx.strokeStyle = state.structureMode === "jitter" ? "#FF7D66" : "#22C9E6";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(ir.x + 0.5, ir.y + 0.5, ir.w - 1, ir.h - 1);
      ctx.setLineDash([]);
    }

    // 边界透视与阅读顺序编号叠加（xray 开或原则高亮）
    if ((state.xray || state.highlightPrinciple === "zoning") && !state.squint) {
      const readOrder = ["hero", "body", "guide", "meta"];
      readOrder.forEach((rid, idx) => {
        const blk = layout.blocks.find((x) => x.id === rid && x.primary);
        if (!blk) return;
        const cx = blk.x + blk.w - 18;
        const cy = blk.y + 18;
        ctx.fillStyle = "#080907";
        ctx.fillRect(cx - 11, cy - 11, 22, 22);
        ctx.strokeStyle = "#22C9E6";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - 11, cy - 11, 22, 22);
        ctx.fillStyle = "#22C9E6";
        ctx.font = `700 12px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.fillText(String(idx + 1), cx, cy + 4);
        ctx.textAlign = "left";
      });
    }

    // 眯眼 3 秒实测：通过极速离屏双线性降采样再放大，真模拟离屏眯眼看块面重量
    if (state.squint) {
      bctx.imageSmoothingEnabled = true;
      bctx.clearRect(0, 0, blurBuf.width, blurBuf.height);
      bctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, blurBuf.width, blurBuf.height);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(blurBuf, 0, 0, blurBuf.width, blurBuf.height, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // 清晰未模糊的顶角提示标
      const tag = "眯眼 3 秒实测 · 看色块轻重能否一眼分清";
      ctx.font = `600 11px ${FONT_SANS}`;
      const tw = ctx.measureText(tag).width + 18;
      ctx.fillStyle = "rgba(8,9,7,0.88)";
      ctx.fillRect(14, 14, tw, 24);
      ctx.strokeStyle = "#22C9E6";
      ctx.lineWidth = 1;
      ctx.strokeRect(14.5, 14.5, tw - 1, 23);
      ctx.fillStyle = "#22C9E6";
      ctx.fillText(tag, 23, 30);
    }

    // 正在横拖雕沟槽时，在画布顶沿实时浮现青色雕刻卡尺浮签
    if (dragCue.active || state.highlightPrinciple === "zoning") {
      const g = layout.gutter;
      const zoneLbl = g < 8 ? "无界粘连" : g > 24 ? "过厚割裂" : "清晰成块";
      const txt = `↔ 边界沟槽 ${g}px · ${zoneLbl}`;
      ctx.font = `600 12px ${FONT_MONO}`;
      const tw = ctx.measureText(txt).width + 20;
      const px = Math.max(12, Math.min(w - tw - 12, (dragCue.active ? dragCue.x : w * 0.5) - tw / 2));
      const py = 12;
      ctx.fillStyle = g < 8 || g > 24 ? "#B42318" : "#080907";
      ctx.fillRect(px, py, tw, 26);
      ctx.strokeStyle = g < 8 || g > 24 ? "#FF7D66" : "#22C9E6";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 0.5, py + 0.5, tw - 1, 25);
      ctx.fillStyle = "#FCF8F1";
      ctx.fillText(txt, px + 10, py + 17);
    }

    ctx.restore();
    drawMini(layout, dpr);
  }

  const ctrl = loop(canvas, renderFrame);

  // ---------- 指针 + 触控统一交互（支持横拖雕刻沟槽、直点块换色、直点红标归组） ----------
  let drag = null;

  function canvasPoint(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function handleTap(pt) {
    // 1. 优先命中错组红标
    for (const chip of hitChips) {
      if (pt.x >= chip.x && pt.x <= chip.x + chip.w && pt.y >= chip.y && pt.y <= chip.y + chip.h) {
        state.grouped = true;
        onChange();
        markDirty();
        ctrl.draw();
        return;
      }
    }
    // 2. 命中任意区块则顺次切换四极色面
    for (let i = hitBlocks.length - 1; i >= 0; i--) {
      const b = hitBlocks[i];
      if (pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h) {
        const cur = state.surfaces[b.id] || "cream";
        const next = SURFACE_CYCLE[(SURFACE_CYCLE.indexOf(cur) + 1) % SURFACE_CYCLE.length];
        triggerWipe(b.id, cur);
        state.surfaces[b.id] = next;
        onChange();
        markDirty();
        ctrl.draw();
        return;
      }
    }
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏交由 touchstart 专管，确保 CDP dispatchTouchEvent 百分百响应
    const pt = canvasPoint(e.clientX, e.clientY);
    drag = { x0: pt.x, y0: pt.y, gutter0: state.gutter, moved: false, pointerId: e.pointerId };
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const pt = canvasPoint(e.clientX, e.clientY);
    if (!drag) {
      let over = null;
      for (let i = hitBlocks.length - 1; i >= 0; i--) {
        const b = hitBlocks[i];
        if (pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h) {
          over = b.id;
          break;
        }
      }
      if (over !== hoveredId) {
        hoveredId = over;
        markDirty();
        ctrl.draw();
      }
      return;
    }
    const dx = pt.x - drag.x0;
    const dy = pt.y - drag.y0;
    if (!drag.moved && Math.hypot(dx, dy) > 5) drag.moved = true;
    if (drag.moved) {
      const nextG = clampGutter(drag.gutter0 + dx * 0.14);
      dragCue = { active: true, x: pt.x };
      if (nextG !== state.gutter) {
        state.gutter = nextG;
        onChange();
      }
      markDirty();
      if (reducedMotion.matches) ctrl.draw();
    }
  });

  function endPointer(e) {
    if (e.pointerType === "touch" || !drag) return;
    const pt = canvasPoint(e.clientX, e.clientY);
    const wasMoved = drag.moved;
    drag = null;
    dragCue.active = false;
    if (!wasMoved) handleTap(pt);
    else {
      markDirty();
      ctrl.draw();
    }
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("pointerleave", () => {
    if (hoveredId) {
      hoveredId = null;
      markDirty();
      ctrl.draw();
    }
  });

  // 触屏手势：横拖雕刻沟槽，竖滑自然滚页，轻点切换色面/归组
  let touchDrag = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t0 = e.touches[0];
      const pt = canvasPoint(t0.clientX, t0.clientY);
      touchDrag = { x0: pt.x, y0: pt.y, gutter0: state.gutter, mode: null };
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!touchDrag || !e.touches.length) return;
      const t0 = e.touches[0];
      const pt = canvasPoint(t0.clientX, t0.clientY);
      const dx = pt.x - touchDrag.x0;
      const dy = pt.y - touchDrag.y0;
      if (!touchDrag.mode && Math.hypot(dx, dy) > 4) {
        touchDrag.mode = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
      }
      if (touchDrag.mode === "h") {
        if (e.cancelable) e.preventDefault();
        const nextG = clampGutter(touchDrag.gutter0 + dx * 0.18);
        dragCue = { active: true, x: pt.x };
        if (nextG !== state.gutter) {
          state.gutter = nextG;
          onChange();
        }
        markDirty();
        if (reducedMotion.matches) ctrl.draw();
      }
    },
    { passive: false }
  );

  canvas.addEventListener("touchend", () => {
    if (!touchDrag) return;
    const mode = touchDrag.mode;
    const pt = { x: touchDrag.x0, y: touchDrag.y0 };
    touchDrag = null;
    dragCue.active = false;
    if (!mode) handleTap(pt);
    else {
      markDirty();
      ctrl.draw();
    }
  });

  // 键盘无障碍操作
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      state.gutter = clampGutter(state.gutter + 2);
      onChange();
      markDirty();
      ctrl.draw();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      state.gutter = clampGutter(state.gutter - 2);
      onChange();
      markDirty();
      ctrl.draw();
    } else if (["1", "2", "3", "4"].includes(e.key)) {
      e.preventDefault();
      const ids = ["hero", "guide", "body", "meta"];
      const id = ids[Number(e.key) - 1];
      const cur = state.surfaces[id] || "cream";
      triggerWipe(id, cur);
      state.surfaces[id] = SURFACE_CYCLE[(SURFACE_CYCLE.indexOf(cur) + 1) % SURFACE_CYCLE.length];
      onChange();
      markDirty();
      ctrl.draw();
    } else if (e.key.toLowerCase() === "g") {
      e.preventDefault();
      state.grouped = !state.grouped;
      onChange();
      markDirty();
      ctrl.draw();
    } else if (e.key.toLowerCase() === "s") {
      e.preventDefault();
      state.squint = !state.squint;
      onChange();
      markDirty();
      ctrl.draw();
    }
  });

  const redrawNow = () => {
    markDirty();
    ctrl.draw();
  };

  window.addEventListener("resize", redrawNow);

  return {
    draw: redrawNow,
    getLayout: () => latestLayout || computeLayout(state, 640, 420),
    triggerWipe,
  };
}

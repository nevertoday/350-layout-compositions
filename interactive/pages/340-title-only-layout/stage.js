// 开场交互舞台：340「削字上屏台 · 3秒投影实测」（2D Canvas，标 data-perf-drag）
// 1:1 承袭 340 原海报冷米白画廊纸面、墨黑大标与 45° 信号红斜引线圆点
// 性能优化：ResizeObserver 缓存尺寸（rAF 零回流）、几何与字宽按状态键缓存、rAF 合批重绘与 DOM 同步、手机 DPR≤1.5

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  SLIDE_W,
  SLIDE_H,
  CLUTTER_KEYS,
  computeSlideGeometry,
  evaluateSlide,
  clamp,
} from "./model.js";

const COLORS = {
  paper: "#F3F2EF",
  slidePaper: "#F7F6F3",
  ink: "#070908",
  inkMid: "#4C4A47",
  inkSoft: "#8D8982",
  line: "#D2CFC8",
  red: "#D6322B",
  redText: "#B2231D",
  redSoft: "rgba(214, 50, 43, 0.11)",
  redDash: "rgba(178, 35, 29, 0.62)",
  ok: "#146652",
  darkRoom: "#0B0D0C",
  darkTray: "#141715",
};

export function mountHeroStage(canvas, state, onChange) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return { draw() {}, triggerFlash() {} };

  let cssW = 880;
  let cssH = 515;
  let curDpr = 1;
  let slideRect = { x: 0, y: 0, w: 880, h: 495, scale: 1 };
  let trayRects = [];
  let rulerRect = { x: 0, y: 0, w: 0, h: 0 };

  // 单真源几何缓存：只在状态键变化时重算
  let cachedKey = "";
  let cachedGeom = null;
  let cachedEval = null;
  let lastNotifiedKey = "";

  // 渲染脏标与动画状态
  let dirty = true;
  const flying = [];
  let animFontSize = state.fontSize;
  let animRedAlpha = 0.28;
  let introT = 0;

  // 字宽缓存（缓存未命中时始终显式设置 ctx.font，避免受绘制字体污染）
  const widthCache = new Map();
  function measureTextInSlide(text, fs) {
    const key = `${fs}|${text}`;
    const hit = widthCache.get(key);
    if (hit !== undefined) return hit;
    ctx.save();
    ctx.font = `900 ${fs}px "Noto Sans SC", "Chivo", sans-serif`;
    const w = ctx.measureText(text).width;
    ctx.restore();
    if (widthCache.size > 600) widthCache.clear();
    widthCache.set(key, w);
    return w;
  }

  function stateKey(s, fsOverride) {
    const c = s.clutter;
    return `${s.deckId}|${s.wordTier}|${fsOverride}|${s.posture}|${c.subtitle ? 1 : 0}${c.bullets ? 1 : 0}${c.graphic ? 1 : 0}${c.footer ? 1 : 0}|${s.noisyBg ? 1 : 0}`;
  }

  function getComputed(fsOverride = state.fontSize) {
    const k = stateKey(state, fsOverride);
    if (k === cachedKey && cachedGeom && cachedEval) {
      return { geom: cachedGeom, ev: cachedEval };
    }
    const snap = fsOverride === state.fontSize ? state : { ...state, fontSize: fsOverride };
    cachedGeom = computeSlideGeometry(snap, measureTextInSlide);
    cachedEval = evaluateSlide(snap, cachedGeom);
    cachedKey = k;
    return { geom: cachedGeom, ev: cachedEval };
  }

  function updateLayoutSize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(220, Math.round(rect.height));
    // 手机竖屏按 GUIDE.md 建议压至 DPR≤1.5，软件渲染帧率翻倍且依然清晰
    const dpr = pixelRatio(w < 520 ? 1.5 : 2);
    if (w === cssW && h === cssH && dpr === curDpr && canvas.width === Math.round(w * dpr)) {
      return;
    }
    cssW = w;
    cssH = h;
    curDpr = dpr;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const showMobileTray = cssW < 520 && cssH >= 340;
    const padX = cssW < 520 ? 10 : 18;
    const padTop = cssW < 520 ? 8 : 16;
    const bottomReserve = showMobileTray ? Math.max(108, Math.round(cssH * 0.34)) : 48;
    const availW = cssW - padX * 2;
    const availH = Math.max(120, cssH - padTop - bottomReserve);

    let sw = availW;
    let sh = (sw * 9) / 16;
    if (sh > availH) {
      sh = availH;
      sw = (sh * 16) / 9;
    }
    slideRect = {
      x: Math.round((cssW - sw) / 2),
      y: padTop + Math.round((availH - sh) / 2),
      w: Math.round(sw),
      h: Math.round(sh),
      scale: sw / SLIDE_W,
    };
    dirty = true;
  }

  function drawWrappedText(c, text, x, y, maxW, lh, maxLines) {
    let cur = "";
    let row = 0;
    for (const ch of text) {
      const next = cur + ch;
      if (cur && c.measureText(next).width > maxW) {
        if (row === maxLines - 1) {
          c.fillText(cur.slice(0, -1) + "…", x, y + row * lh);
          return;
        }
        c.fillText(cur, x, y + row * lh);
        cur = ch;
        row++;
      } else {
        cur = next;
      }
    }
    if (cur && row < maxLines) c.fillText(cur, x, y + row * lh);
  }

  function drawSlideContent(geom, ev, still, t) {
    const { x: sx, y: sy, w: sw, h: sh, scale } = slideRect;
    const flashProg = state.flashActive ? clamp(state.flashElapsed / 3.0, 0, 1) : 0;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(scale, scale);

    // 1. 幻灯片纯纸底
    ctx.fillStyle = COLORS.slidePaper;
    ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);

    // 干扰底纹（反例试错：合批路径一次 stroke + 一次 fill）
    if (state.noisyBg) {
      ctx.strokeStyle = "rgba(7, 9, 8, 0.16)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let gx = -SLIDE_H; gx < SLIDE_W + SLIDE_H; gx += 32) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx + SLIDE_H, SLIDE_H);
      }
      ctx.stroke();

      ctx.fillStyle = "rgba(214, 50, 43, 0.10)";
      ctx.beginPath();
      for (let rx = 44; rx < SLIDE_W; rx += 108) {
        for (let ry = 44; ry < SLIDE_H; ry += 108) {
          ctx.moveTo(rx + 20, ry);
          ctx.arc(rx, ry, 20, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    }

    // 2. 7% 投影仪安全区虚线
    const showSafety = dragging || geom.minMarginPct < 7 || geom.overflows || state.posture === "edge";
    if (showSafety) {
      const mx = SLIDE_W * 0.07;
      const my = SLIDE_H * 0.07;
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle =
        geom.minMarginPct < 7 || geom.overflows ? COLORS.red : "rgba(7, 9, 8, 0.22)";
      ctx.strokeRect(mx, my, SLIDE_W - mx * 2, SLIDE_H - my * 2);
      ctx.setLineDash([]);
      ctx.font = '500 12px "IBM Plex Mono", monospace';
      ctx.fillStyle = geom.minMarginPct < 7 ? COLORS.redText : COLORS.inkMid;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(
        `投影安全边距 7% · 当前最小边距 ${Math.max(0, geom.minMarginPct).toFixed(1)}%`,
        mx + 8,
        my - 8
      );
    }

    // 3. 340 原海报双角微标
    ctx.globalAlpha = state.clutter.footer ? 0.32 : 0.88;
    ctx.fillStyle = COLORS.ink;
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("340 · TITLE-ONLY", 34, 34);
    ctx.fillRect(34, 42, 16, 2);
    ctx.textAlign = "right";
    ctx.fillText("+", SLIDE_W - 34, 38);
    ctx.globalAlpha = 1;

    // 4. 340 原海报招牌 45° 红圆斜引线
    const targetRed = ev.checks.minimal.ok && ev.checks.whitespace.ok ? 1 : 0.28;
    animRedAlpha = still ? targetRed : animRedAlpha + (targetRed - animRedAlpha) * 0.18;
    if (!state.clutter.graphic) {
      const { dotX, dotY, tailX, tailY } = geom.redAnchor;
      const lineProg = still ? 1 : clamp(introT * 1.8, 0, 1);
      ctx.globalAlpha = animRedAlpha;
      ctx.strokeStyle = COLORS.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dotX, dotY);
      ctx.lineTo(dotX + (tailX - dotX) * lineProg, dotY + (tailY - dotY) * lineProg);
      ctx.stroke();

      const r = ev.passed ? 16 : 12;
      ctx.fillStyle = COLORS.red;
      ctx.beginPath();
      ctx.arc(dotX, dotY, r * lineProg, 0, Math.PI * 2);
      ctx.fill();

      if (ev.passed && !still) {
        const pulse = (Math.sin(t * 2.2) + 1) * 0.5;
        ctx.strokeStyle = `rgba(214, 50, 43, ${(0.28 * (1 - pulse)).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(dotX, dotY, r + 4 + pulse * 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // 5. 主标题组
    const tb = geom.titleBox;
    const isTitleHover = state.hoveredId === "title";

    if (isTitleHover || !ev.checks.focus.ok || !ev.checks.presence.ok) {
      ctx.setLineDash(isTitleHover ? [] : [5, 5]);
      ctx.lineWidth = isTitleHover ? 1.8 : 1.2;
      ctx.strokeStyle =
        !ev.checks.focus.ok || !ev.checks.presence.ok
          ? COLORS.redDash
          : "rgba(7, 9, 8, 0.35)";
      ctx.strokeRect(tb.x - 10, tb.y - 8, tb.w + 20, tb.h + 16);
      ctx.setLineDash([]);

      const badgeTxt = !ev.checks.focus.ok
        ? `点标题提纯 · ${ev.checks.focus.tag}`
        : !ev.checks.presence.ok
          ? `横拖调字阶 · ${ev.checks.presence.tag}`
          : "点标题切换文案阶";
      ctx.font = '600 12px "Noto Sans SC", sans-serif';
      const bw = ctx.measureText(badgeTxt).width + 16;
      const bx = Math.min(SLIDE_W - bw - 12, Math.max(12, tb.x + tb.w - bw + 10));
      const by = Math.max(12, tb.y - 30);
      ctx.fillStyle = !ev.checks.focus.ok || !ev.checks.presence.ok ? COLORS.red : COLORS.ink;
      ctx.fillRect(bx, by, bw, 22);
      ctx.fillStyle = "#FAF9F6";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeTxt, bx + 8, by + 11.5);
    }

    // 3 秒后排实测时：用降低不透明度+双影偏移替代昂贵的软件高斯 blur，保证 60fps
    const softBlur = state.flashActive && tb.fontSize < 38;
    ctx.font = `900 ${tb.fontSize}px "Noto Sans SC", "Chivo", sans-serif`;
    ctx.textAlign = tb.align;
    ctx.textBaseline = "top";
    const drawX = tb.align === "center" ? tb.x + tb.w / 2 : tb.x;

    if (softBlur) {
      ctx.fillStyle = "rgba(7, 9, 8, 0.28)";
      tb.lines.forEach((line, idx) => {
        ctx.fillText(line, drawX - 1.5, tb.y + idx * tb.lineH);
        ctx.fillText(line, drawX + 1.5, tb.y + idx * tb.lineH);
      });
    }
    ctx.fillStyle = softBlur ? "rgba(7, 9, 8, 0.55)" : COLORS.ink;
    tb.lines.forEach((line, idx) => {
      ctx.fillText(line, drawX, tb.y + idx * tb.lineH);
    });

    const enY = tb.y + tb.textH + 6;
    ctx.font = `700 ${tb.enFont}px "Chivo", "Space Grotesk", sans-serif`;
    ctx.fillStyle = COLORS.inkMid;
    ctx.fillText(tb.en, drawX, enY);

    const barW = clamp(tb.fontSize * 0.72, 26, 54);
    const barX = tb.align === "center" ? drawX - barW / 2 : tb.x;
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(barX, enY + tb.enFont + 8, barW, 3.5);

    // 6. 实绘四块可剥离冗余元素
    for (const key of geom.activeClutter) {
      const box = geom.clutterBoxes[key];
      if (!box) continue;
      const hover = state.hoveredId === key;
      ctx.globalAlpha = state.flashActive ? 0.58 : 1;
      ctx.fillStyle = hover ? "rgba(214, 50, 43, 0.14)" : "rgba(7, 9, 8, 0.035)";
      ctx.fillRect(box.x, box.y, box.w, box.h);

      ctx.setLineDash(hover ? [] : [5, 4]);
      ctx.lineWidth = hover ? 2 : 1.25;
      ctx.strokeStyle = hover ? COLORS.red : COLORS.redDash;
      ctx.strokeRect(box.x, box.y, box.w, box.h);
      ctx.setLineDash([]);

      const tagText = `× 点此删${box.data.short}`;
      ctx.font = '600 12px "Noto Sans SC", sans-serif';
      const tw = ctx.measureText(tagText).width + 14;
      ctx.fillStyle = hover ? COLORS.red : COLORS.ink;
      ctx.fillRect(box.x + box.w - tw, box.y, tw, 21);
      ctx.fillStyle = "#FAF9F6";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(tagText, box.x + box.w - tw + 7, box.y + 11);

      ctx.fillStyle = COLORS.inkMid;
      ctx.textBaseline = "top";
      if (key === "subtitle") {
        ctx.font = '400 15px "Noto Sans SC", sans-serif';
        drawWrappedText(ctx, box.data.text, box.x + 12, box.y + 18, box.w - tw - 16, 22, 2);
      } else if (key === "bullets") {
        ctx.font = '400 14px "Noto Sans SC", sans-serif';
        box.data.items.forEach((item, i) => {
          const iy = box.y + 22 + i * 35;
          ctx.fillStyle = COLORS.red;
          ctx.fillRect(box.x + 14, iy + 6, 5, 5);
          ctx.fillStyle = COLORS.inkMid;
          drawWrappedText(ctx, item, box.x + 28, iy, box.w - 40, 20, 1);
        });
      } else if (key === "graphic") {
        const cx = box.x + box.w / 2;
        const cy = box.y + box.h * 0.48;
        ctx.strokeStyle = COLORS.inkSoft;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 48, cy - 48, 96, 96);
        ctx.fillStyle = "rgba(7, 9, 8, 0.12)";
        ctx.beginPath();
        ctx.arc(cx, cy - 8, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(214, 50, 43, 0.25)";
        ctx.fillRect(cx - 36, cy + 28, 72, 12);
        ctx.fillStyle = COLORS.inkMid;
        ctx.font = '600 11px "IBM Plex Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText(box.data.label, cx, cy + 60);
      } else if (key === "footer") {
        ctx.font = '400 12px "Noto Sans SC", sans-serif';
        ctx.fillStyle = COLORS.inkMid;
        ctx.textBaseline = "middle";
        ctx.fillText(box.data.text, box.x + 12, box.y + box.h / 2);
      }
      ctx.globalAlpha = 1;
    }

    // 7. 剥离飞出残影动画
    for (let i = flying.length - 1; i >= 0; i--) {
      const f = flying[i];
      const p = clamp((performance.now() - f.start) / 360, 0, 1);
      if (p >= 1) {
        flying.splice(i, 1);
        continue;
      }
      const ease = 1 - (1 - p) ** 3;
      ctx.save();
      ctx.globalAlpha = (1 - ease) * 0.85;
      ctx.translate(0, ease * 64);
      ctx.strokeStyle = COLORS.red;
      ctx.lineWidth = 2;
      ctx.strokeRect(f.box.x, f.box.y, f.box.w, f.box.h);
      ctx.beginPath();
      ctx.moveTo(f.box.x, f.box.y + f.box.h);
      ctx.lineTo(f.box.x + f.box.w, f.box.y);
      ctx.stroke();
      ctx.restore();
    }

    // 8. 3 秒暗场投影实测叠层
    if (state.flashActive) {
      const coverage = clamp((flashProg * 3.0) / Math.max(0.6, geom.glanceSec), 0, 1);
      ctx.fillStyle = "rgba(7, 9, 8, 0.14)";
      ctx.fillRect(0, 0, SLIDE_W, 6);
      ctx.fillStyle = coverage >= 0.98 && ev.passed ? COLORS.ok : COLORS.red;
      ctx.fillRect(0, 0, SLIDE_W * flashProg, 6);

      const secLeft = Math.max(0, 3.0 - state.flashElapsed).toFixed(1);
      const statusTxt =
        flashProg < 1
          ? `15m 后排实测 · 剩余 ${secLeft}s · 已扫读约 ${Math.round(coverage * 100)}%`
          : ev.passed
            ? `3.0s 结束 · 一眼锁住主题（示意 ${geom.glanceSec}s），听众抬头听讲`
            : `3.0s 结束 · 后排仅扫到 ${Math.round(coverage * 100)}%（示意需 ${geom.glanceSec}s），视线未归位`;
      ctx.fillStyle = COLORS.darkRoom;
      ctx.fillRect(24, SLIDE_H - 52, SLIDE_W - 48, 34);
      ctx.fillStyle = flashProg >= 1 && ev.passed ? "#5AD1B0" : "#FF635B";
      ctx.fillRect(24, SLIDE_H - 52, 5, 34);
      ctx.fillStyle = "#FAF9F6";
      ctx.font = '600 14px "Noto Sans SC", "IBM Plex Mono", sans-serif';
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(statusTxt, 40, SLIDE_H - 35);
    }

    // 9. 右下实测留白/字阶角标
    if (!state.flashActive) {
      ctx.font = '500 12px "IBM Plex Mono", monospace';
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = ev.passed ? COLORS.ok : COLORS.inkMid;
      ctx.fillText(
        `WHITESPACE ${geom.whitespacePct}%  ·  TYPE ${geom.fontSize}px  ·  ${ev.score}/4`,
        SLIDE_W - 30,
        SLIDE_H - (state.clutter.footer ? 54 : 22)
      );
    }

    ctx.restore();

    // 10. 幻灯片 1px 瑞士黑框
    ctx.strokeStyle = state.flashActive ? "rgba(250,249,246,0.28)" : COLORS.ink;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
  }

  function drawBottomBar(geom, ev) {
    const showMobileTray = cssW < 520 && cssH >= 340;
    const tightLabels = slideRect.w < 490;
    const barTop = slideRect.y + slideRect.h + (tightLabels ? 8 : 12);
    const left = slideRect.x;
    const width = slideRect.w;
    trayRects = [];

    const rY = barTop;
    const rH = 26;
    rulerRect = { x: left, y: rY, w: width, h: rH };

    ctx.fillStyle = state.flashActive ? "rgba(255,255,255,0.08)" : "#E9E7E1";
    ctx.fillRect(left, rY + 10, width, 4);

    const norm = (v) => (clamp(v, 18, 112) - 18) / (112 - 18);
    const okX0 = left + norm(46) * width;
    const okX1 = left + norm(94) * width;
    ctx.fillStyle = state.flashActive ? "rgba(90, 209, 176, 0.35)" : "rgba(20, 102, 82, 0.24)";
    ctx.fillRect(okX0, rY + 10, okX1 - okX0, 4);

    const kx = left + norm(animFontSize) * width;
    ctx.fillStyle = ev.checks.presence.ok ? COLORS.ink : COLORS.red;
    if (state.flashActive) ctx.fillStyle = "#FAF9F6";
    ctx.fillRect(kx - 7, rY + 3, 14, 18);
    ctx.fillStyle = state.flashActive ? COLORS.ink : "#FAF9F6";
    ctx.fillRect(kx - 1, rY + 7, 2, 10);

    ctx.font = '500 11px "IBM Plex Mono", "Noto Sans SC", sans-serif';
    ctx.fillStyle = state.flashActive ? "#C8C5BE" : COLORS.inkMid;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText(tightLabels ? "18px" : "18px 怯弱", left, rY + 23);
    ctx.textAlign = "center";
    ctx.fillStyle = state.flashActive ? "#FAF9F6" : COLORS.ink;
    ctx.fillText(
      tightLabels
        ? `← 横拖调字阶 ${geom.fontSize}px · 留白 ${geom.whitespacePct}% →`
        : `← 横拖画布调字阶：${geom.fontSize}px · 留白 ${geom.whitespacePct}% →`,
      left + width / 2,
      rY + 23
    );
    ctx.textAlign = "right";
    ctx.fillStyle = state.flashActive ? "#C8C5BE" : COLORS.inkMid;
    ctx.fillText(tightLabels ? "112px" : "112px 爆框", left + width, rY + 23);

    if (showMobileTray) {
      const trayTop = rY + 46;
      const trayH = Math.max(54, cssH - trayTop - 8);
      ctx.fillStyle = state.flashActive ? COLORS.darkTray : "#EAE8E3";
      ctx.fillRect(left, trayTop, width, trayH);
      ctx.strokeStyle = state.flashActive ? "rgba(255,255,255,0.16)" : COLORS.line;
      ctx.lineWidth = 1;
      ctx.strokeRect(left + 0.5, trayTop + 0.5, width - 1, trayH - 1);

      const peeled = CLUTTER_KEYS.filter((k) => !state.clutter[k]);
      ctx.font = '600 11px "Noto Sans SC", sans-serif';
      ctx.fillStyle = state.flashActive ? "#D4D1CA" : COLORS.inkMid;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillText(
        peeled.length
          ? `已归演讲者口播（点标签可贴回对照）：`
          : `直接点上方虚线块剥离冗余，或横拖拉大字号`,
        left + 10,
        trayTop + 8
      );

      const py = trayTop + 28;
      const ph = 26;
      const gap = 6;
      const cellW = Math.floor((width - 20 - gap * 3) / 4);
      CLUTTER_KEYS.forEach((k, idx) => {
        const cx = left + 10 + idx * (cellW + gap);
        const isRemoved = !state.clutter[k];
        ctx.fillStyle = isRemoved
          ? state.flashActive
            ? "#1F3B33"
            : "#FAF9F6"
          : COLORS.redSoft;
        ctx.fillRect(cx, py, cellW, ph);
        ctx.strokeStyle = isRemoved ? COLORS.ok : COLORS.redDash;
        ctx.strokeRect(cx + 0.5, py + 0.5, cellW - 1, ph - 1);

        ctx.fillStyle = isRemoved ? (state.flashActive ? "#5AD1B0" : COLORS.ok) : COLORS.redText;
        ctx.font = '600 11px "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const lbl = isRemoved ? `✓ ${geom.deck.clutter[k].short}` : `× ${geom.deck.clutter[k].short}`;
        ctx.fillText(lbl, cx + cellW / 2, py + ph / 2);
        trayRects.push({ key: k, x: cx, y: py, w: cellW, h: ph });
      });

      const meterY = py + ph + 10;
      if (meterY + 14 < trayTop + trayH) {
        ctx.fillStyle = state.flashActive ? "#C8C5BE" : COLORS.inkMid;
        ctx.font = '500 11px "IBM Plex Mono", "Noto Sans SC", sans-serif';
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(
          `上屏扫读 ${geom.glanceSec}s（示意 · ${ev.glanceTier}）`,
          left + 10,
          meterY
        );
        ctx.textAlign = "right";
        ctx.fillStyle = ev.passed ? COLORS.ok : COLORS.redText;
        ctx.fillText(`${ev.score}/4 达标`, left + width - 10, meterY);
      }
    }
  }

  function render(t, dt, { still }) {
    const prevIntro = introT;
    introT = still ? 1 : Math.min(1, introT + dt * 1.6);
    const fontGap = Math.abs(state.fontSize - animFontSize);
    animFontSize =
      still || fontGap < 0.25
        ? state.fontSize
        : animFontSize + (state.fontSize - animFontSize) * Math.min(1, dt * 20 + 0.2);

    if (state.flashActive) {
      state.flashElapsed = still ? 3.0 : (performance.now() - state.flashStart) / 1000;
      dirty = true;
      if (state.flashElapsed >= 4.2 && !still) {
        state.flashActive = false;
        state.flashElapsed = 0;
        lastNotifiedKey = "";
      }
    }

    const visFs = Math.round(animFontSize);
    const { geom, ev } = getComputed(visFs);

    // 同步 DOM（合批到 rAF，每帧最多一次且仅当状态真变了）
    const curKey = `${cachedKey}|${state.flashActive ? 1 : 0}`;
    if (curKey !== lastNotifiedKey) {
      lastNotifiedKey = curKey;
      onChange(geom, ev);
    }

    const animating =
      dirty ||
      introT !== prevIntro ||
      fontGap >= 0.25 ||
      flying.length > 0 ||
      state.flashActive ||
      (ev.passed && !still);

    if (!animating && !still) return;
    dirty = false;

    ctx.fillStyle = state.flashActive ? COLORS.darkRoom : COLORS.paper;
    ctx.fillRect(0, 0, cssW, cssH);
    drawSlideContent(geom, ev, still, t);
    drawBottomBar(geom, ev);
  }

  const ctrl = loop(canvas, render);

  // ResizeObserver 替代每帧 getBoundingClientRect
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      updateLayoutSize();
      ctrl.draw();
    }).observe(canvas);
  }
  window.addEventListener("resize", () => {
    updateLayoutSize();
    ctrl.draw();
  });

  function toSlideCoords(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const cx = clientX - r.left;
    const cy = clientY - r.top;
    return {
      cx,
      cy,
      sx: (cx - slideRect.x) / slideRect.scale,
      sy: (cy - slideRect.y) / slideRect.scale,
    };
  }

  function hitTest(cx, cy, sx, sy) {
    for (const tr of trayRects) {
      if (cx >= tr.x && cx <= tr.x + tr.w && cy >= tr.y && cy <= tr.y + tr.h) {
        return { kind: "tray", key: tr.key };
      }
    }
    if (
      cx >= rulerRect.x &&
      cx <= rulerRect.x + rulerRect.w &&
      cy >= rulerRect.y - 6 &&
      cy <= rulerRect.y + rulerRect.h + 10
    ) {
      return { kind: "ruler" };
    }
    if (cachedGeom) {
      for (let i = cachedGeom.activeClutter.length - 1; i >= 0; i--) {
        const k = cachedGeom.activeClutter[i];
        const b = cachedGeom.clutterBoxes[k];
        if (b && sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) {
          return { kind: "clutter", key: k, box: b };
        }
      }
      const tb = cachedGeom.titleBox;
      if (sx >= tb.x - 14 && sx <= tb.x + tb.w + 14 && sy >= tb.y - 14 && sy <= tb.y + tb.h + 14) {
        return { kind: "title" };
      }
    }
    return { kind: "empty" };
  }

  let pointerId = null;
  let dragging = false;
  let dragMode = null;
  let startX = 0;
  let startY = 0;
  let startFont = state.fontSize;
  let moved = false;

  // 立即更新模型与画布（用于离散点击/按键）
  function emitSyncNow() {
    dirty = true;
    const { geom, ev } = getComputed(state.fontSize);
    lastNotifiedKey = `${cachedKey}|${state.flashActive ? 1 : 0}`;
    onChange(geom, ev);
    ctrl.draw();
  }

  // 连续拖拽时只标记脏标，交由 60Hz rAF 单次合批绘制与更新 DOM
  function markDragDirty() {
    dirty = true;
    if (reducedMotion.matches) {
      emitSyncNow();
    }
  }

  function applyScaleFromRuler(cx) {
    const ratio = clamp((cx - rulerRect.x) / Math.max(1, rulerRect.w), 0, 1);
    const next = Math.round(18 + ratio * (112 - 18));
    if (next !== state.fontSize) {
      state.fontSize = next;
      animFontSize = next;
      markDragDirty();
    }
  }

  function onPointerDown(e) {
    if (e.button && e.button !== 0) return;
    const { cx, cy, sx, sy } = toSlideCoords(e.clientX, e.clientY);
    const hit = hitTest(cx, cy, sx, sy);
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startFont = state.fontSize;
    moved = false;
    dragging = false;

    if (hit.kind === "ruler") {
      dragMode = "ruler";
      dragging = true;
      canvas.setPointerCapture?.(e.pointerId);
      applyScaleFromRuler(cx);
    } else {
      dragMode = "maybe";
    }
  }

  function onPointerMove(e) {
    if (pointerId === null) {
      if (e.target !== canvas) return;
      const { cx, cy, sx, sy } = toSlideCoords(e.clientX, e.clientY);
      const hit = hitTest(cx, cy, sx, sy);
      const nextHover = hit.kind === "clutter" ? hit.key : hit.kind === "title" ? "title" : null;
      canvas.style.cursor =
        hit.kind === "clutter" || hit.kind === "title" || hit.kind === "tray"
          ? "pointer"
          : "ew-resize";
      if (nextHover !== state.hoveredId) {
        state.hoveredId = nextHover;
        dirty = true;
      }
      return;
    }
    if (e.pointerId !== pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (dragMode === "ruler") {
      moved = true;
      const { cx } = toSlideCoords(e.clientX, e.clientY);
      applyScaleFromRuler(cx);
      return;
    }

    if (dragMode === "maybe") {
      if (Math.hypot(dx, dy) < 6) return;
      if (Math.abs(dx) >= Math.abs(dy) * 0.85) {
        dragMode = "scale";
        dragging = true;
        moved = true;
        canvas.setPointerCapture?.(e.pointerId);
      } else {
        pointerId = null;
        dragMode = null;
        return;
      }
    }

    if (dragMode === "scale") {
      moved = true;
      const delta = (dx / Math.max(180, slideRect.w * 0.55)) * 94;
      const raw = clamp(startFont + delta, 18, 112);
      let next = Math.round(raw);
      if (Math.abs(next - 66) <= 2) next = 66;
      state.fontSize = next;
      animFontSize = raw;
      markDragDirty();
    }
  }

  function onPointerUp(e) {
    if (pointerId === null || e.pointerId !== pointerId) return;
    const wasMoved = moved;
    pointerId = null;
    dragging = false;
    dragMode = null;
    try {
      canvas.releasePointerCapture?.(e.pointerId);
    } catch {}

    if (!wasMoved) {
      const { cx, cy, sx, sy } = toSlideCoords(e.clientX, e.clientY);
      const hit = hitTest(cx, cy, sx, sy);
      if (hit.kind === "clutter") {
        state.clutter[hit.key] = false;
        state.lastPeeled = hit.key;
        if (!reducedMotion.matches) {
          flying.push({ box: { ...hit.box }, start: performance.now() });
        }
        emitSyncNow();
      } else if (hit.kind === "tray") {
        state.clutter[hit.key] = !state.clutter[hit.key];
        emitSyncNow();
      } else if (hit.kind === "title") {
        state.wordTier = (state.wordTier + 1) % 4;
        emitSyncNow();
      }
    } else {
      emitSyncNow();
    }
  }

  let touchActive = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartFont = 24;
  let touchLockedH = false;

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      touchActive = true;
      touchLockedH = false;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartFont = state.fontSize;
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!touchActive || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      if (!touchLockedH && Math.hypot(dx, dy) > 4) {
        if (Math.abs(dx) >= Math.abs(dy) * 0.8) {
          touchLockedH = true;
          dragging = true;
        } else {
          touchActive = false;
          return;
        }
      }
      if (touchLockedH) {
        e.preventDefault();
        const delta = (dx / Math.max(150, slideRect.w * 0.5)) * 94;
        const raw = clamp(touchStartFont + delta, 18, 112);
        state.fontSize = Math.round(raw);
        animFontSize = raw;
        markDragDirty();
      }
    },
    { passive: false }
  );
  canvas.addEventListener(
    "touchend",
    () => {
      touchActive = false;
      touchLockedH = false;
      dragging = false;
      emitSyncNow();
    },
    { passive: true }
  );

  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      state.fontSize = clamp(state.fontSize + 4, 18, 112);
      emitSyncNow();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      state.fontSize = clamp(state.fontSize - 4, 18, 112);
      emitSyncNow();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const nextClutter = CLUTTER_KEYS.find((k) => state.clutter[k]);
      if (nextClutter) {
        state.clutter[nextClutter] = false;
      } else {
        state.wordTier = (state.wordTier + 1) % 4;
      }
      emitSyncNow();
    }
  });

  function triggerFlash() {
    state.flashActive = true;
    state.flashStart = performance.now();
    state.flashElapsed = reducedMotion.matches ? 3.0 : 0;
    emitSyncNow();
  }

  updateLayoutSize();
  emitSyncNow();

  return {
    draw: emitSyncNow,
    triggerFlash,
    getMetrics: () => ({ geom: cachedGeom, ev: cachedEval }),
  };
}

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { LOGICAL_WIDE, LOGICAL_COMPACT, clamp, evaluateSlide } from "./model.js";

const C = {
  paper: "#FDE7E3",
  slideBg: "#FCEEEB",
  slideBorder: "#D9B9B1",
  cream: "#FFF8F0",
  creamBorder: "#D9C3AD",
  tintBg: "#F6E4DC",
  tintBorder: "#C89D91",
  burgundy: "#6D1E29",
  burgundyDeep: "#52131C",
  burgundySoft: "#8A323E",
  rose: "#BB4C56",
  sand: "#E1C4A7",
  sandLight: "#EEDBC8",
  ink: "#1D1315",
  inkSub: "#594145",
  creamInk: "#FFF8F0",
  creamSub: "#F2D7CE",
  fault: "#B8202A",
  faultBg: "rgba(184, 32, 42, 0.11)",
  pass: "#186043",
  passBg: "rgba(24, 96, 67, 0.12)",
};

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function createWorkbench(canvas, getState, patchState, onAfterRender) {
  const ctx = canvas.getContext("2d");
  let dpr = 1;
  let dims = LOGICAL_WIDE;
  let cssW = dims.W;
  let cssH = dims.stageH;

  let intro = reducedMotion.matches ? 1 : 0;
  let displayTilt = 0;
  let gazeActive = false;
  let gazeT = 0;
  let dirty = true;
  let hoverZone = "";
  let drag = null;

  function pickDims(widthPx) {
    // Portrait phone (< 560px wide and portrait): use tall crisp 520x558 logical stage so canvas holds >=46% of 844px height with 1:1 uniform scaling!
    // In landscape phone (844x390), keep wide projection so the full slide + fulcrum fits inside 390px height.
    return widthPx < 560 && window.innerHeight > window.innerWidth ? LOGICAL_COMPACT : LOGICAL_WIDE;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    dims = pickDims(w);
    const h = Math.round((w * dims.stageH) / dims.W);
    dpr = pixelRatio(w < 560 ? 1.5 : 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = `${h}px`;
    }
    cssW = w;
    cssH = h;
    dirty = true;
  }

  function clientToLogical(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / Math.max(r.width, 1)) * dims.W,
      y: ((clientY - r.top) / Math.max(r.height, 1)) * dims.stageH,
    };
  }

  function hitTest(pt, ev) {
    const { card1, card2, plusCenter } = ev;
    if (Math.hypot(pt.x - plusCenter.x, pt.y - plusCenter.y) <= (ev.compact ? 26 : 30)) return "plus";
    if (Math.abs(pt.x - ev.seamX) <= 18 && pt.y >= ev.cardTopBase && pt.y <= ev.cardTopBase + card1.h) return "seam";
    if (pt.x >= card2.x + 8 && pt.x <= card2.x + card2.w - 8 && pt.y >= card2.y - 16 && pt.y <= card2.y + 26) {
      return "card2Top";
    }
    if (pt.x >= card1.x && pt.x <= card1.x + card1.w && pt.y >= card1.y && pt.y <= card1.y + card1.h) {
      if (pt.y <= card1.y + (ev.compact ? 58 : 66)) return "card1Head";
      if (!ev.compact && pt.x >= card1.x + card1.w * 0.56) return "card1Visual";
      if (ev.compact && pt.y >= card1.y + 124 && pt.y <= card1.y + 224) return "card1Visual";
      return "card1Body";
    }
    if (pt.x >= card2.x && pt.x <= card2.x + card2.w && pt.y >= card2.y && pt.y <= card2.y + card2.h) {
      if (pt.y <= card2.y + (ev.compact ? 58 : 66)) return "card2Head";
      if (!ev.compact && pt.x >= card2.x + card2.w * 0.56) return "card2Visual";
      if (ev.compact && pt.y >= card2.y + 124 && pt.y <= card2.y + 224) return "card2Visual";
      return "card2Body";
    }
    if (pt.y <= ev.slideH) return "slide";
    return "fulcrum";
  }

  function drawVisualMotif(kind, rect, tone) {
    const isDark = tone === "dark";
    const cx = rect.x + rect.w * 0.5;
    const cy = rect.y + rect.h * 0.52;
    const s = Math.min(rect.w / 186, rect.h / 104, 1.08);

    ctx.save();
    if (kind === "posterLeft") {
      // 1:1 Poster 338 Left Card motif: burgundy circle + sand square + 4x5 dot grid
      const r = 30 * s;
      ctx.fillStyle = isDark ? C.sandLight : C.burgundy;
      ctx.beginPath();
      ctx.arc(cx - 34 * s, cy, r, 0, Math.PI * 2);
      ctx.fill();

      const sq = 48 * s;
      ctx.fillStyle = isDark ? C.rose : C.sand;
      ctx.fillRect(cx - 18 * s, cy - sq * 0.42, sq, sq);

      ctx.fillStyle = isDark ? C.creamSub : C.burgundy;
      const gx0 = cx + 20 * s;
      const gy0 = cy - 19 * s;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
          ctx.beginPath();
          ctx.arc(gx0 + col * 9.5 * s, gy0 + row * 10.5 * s, 1.55 * s, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (kind === "posterRight") {
      // 1:1 Poster 338 Right Card motif: cream triangle + dusty rose circle + 4 parallel thin rules
      ctx.fillStyle = isDark ? C.rose : C.sand;
      ctx.beginPath();
      ctx.arc(cx + 22 * s, cy - 7 * s, 23 * s, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isDark ? C.sandLight : C.burgundy;
      ctx.beginPath();
      ctx.moveTo(cx - 20 * s, cy - 32 * s);
      ctx.lineTo(cx - 64 * s, cy + 28 * s);
      ctx.lineTo(cx + 20 * s, cy + 28 * s);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = isDark ? C.creamInk : C.burgundy;
      ctx.lineWidth = 1.3;
      for (let i = 0; i < 4; i++) {
        const ly = cy - 2 * s + i * 7.5 * s;
        ctx.beginPath();
        ctx.moveTo(cx + 6 * s, ly);
        ctx.lineTo(cx + 66 * s, ly);
        ctx.stroke();
      }
    } else if (kind === "bars") {
      const bw = 20 * s;
      const gap = 12 * s;
      const vals = [0.42, 0.58, 0.74, 0.96];
      const labels = ["Q1", "Q2", "Q3", "峰"];
      const x0 = cx - (vals.length * bw + (vals.length - 1) * gap) / 2;
      const baseY = cy + 26 * s;
      vals.forEach((v, i) => {
        const bh = v * 54 * s;
        const bx = x0 + i * (bw + gap);
        ctx.fillStyle =
          i === 3
            ? isDark
              ? C.sandLight
              : C.burgundy
            : isDark
              ? "rgba(238,219,200,0.34)"
              : C.sand;
        roundRectPath(ctx, bx, baseY - bh, bw, bh, 3);
        ctx.fill();
        ctx.fillStyle = isDark ? C.creamSub : C.inkSub;
        ctx.font = `500 ${Math.max(9, Math.round(9.5 * s))}px "DM Mono", monospace`;
        ctx.textAlign = "center";
        ctx.fillText(labels[i], bx + bw / 2, baseY + 12 * s);
      });
      ctx.fillStyle = isDark ? C.sandLight : C.burgundy;
      ctx.font = `700 ${Math.max(10, Math.round(11 * s))}px "DM Mono", monospace`;
      ctx.textAlign = "left";
      ctx.fillText("+28%", x0 + 3 * (bw + gap) - 4, baseY - vals[3] * 54 * s - 6 * s);
    } else if (kind === "ring") {
      const r = 26 * s;
      ctx.lineWidth = 8 * s;
      ctx.strokeStyle = isDark ? "rgba(238,219,200,0.22)" : "rgba(109,30,41,0.14)";
      ctx.beginPath();
      ctx.arc(cx - 24 * s, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = isDark ? C.sandLight : C.burgundy;
      ctx.beginPath();
      ctx.arc(cx - 24 * s, cy, r, -Math.PI / 2, Math.PI * 1.15);
      ctx.stroke();

      ctx.fillStyle = isDark ? C.creamInk : C.burgundy;
      ctx.font = `700 ${Math.max(10, Math.round(12 * s))}px "DM Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("-19%", cx - 24 * s, cy);

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = isDark ? C.sandLight : C.ink;
      ctx.font = `600 ${Math.max(10, Math.round(11 * s))}px "Noto Sans SC", sans-serif`;
      ctx.fillText("干线降本", cx + 10 * s, cy - 5 * s);
      ctx.fillStyle = isDark ? C.creamSub : C.inkSub;
      ctx.font = `500 ${Math.max(9.5, Math.round(10 * s))}px "DM Mono", monospace`;
      ctx.fillText("+2.4元/单", cx + 10 * s, cy + 11 * s);
    } else if (kind === "funnel") {
      const widths = [128 * s, 94 * s, 60 * s];
      const tags = ["进入100%", "填表59%", "激活31%"];
      widths.forEach((fw, i) => {
        const fy = cy - 30 * s + i * 22 * s;
        ctx.fillStyle =
          i === 0
            ? isDark
              ? "rgba(238,219,200,0.28)"
              : C.sand
            : i === 1
              ? isDark
                ? C.rose
                : C.burgundySoft
              : isDark
                ? C.sandLight
                : C.burgundy;
        roundRectPath(ctx, cx - fw / 2, fy, fw, 17 * s, 4);
        ctx.fill();
        ctx.fillStyle = i === 0 && !isDark ? C.ink : i === 2 && isDark ? C.burgundyDeep : C.creamInk;
        ctx.font = `600 ${Math.max(9, Math.round(9.5 * s))}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tags[i], cx, fy + 8.5 * s);
      });
    } else if (kind === "steps") {
      const labels = ["01手机", "02沙箱", "03资质"];
      const pw = 46 * s;
      const gap = 12 * s;
      const x0 = cx - (3 * pw + 2 * gap) / 2;
      labels.forEach((lb, i) => {
        const px = x0 + i * (pw + gap);
        ctx.fillStyle =
          i === 1
            ? isDark
              ? C.sandLight
              : C.burgundy
            : isDark
              ? "rgba(238,219,200,0.22)"
              : C.sand;
        roundRectPath(ctx, px, cy - 15 * s, pw, 30 * s, 6);
        ctx.fill();
        ctx.fillStyle = i === 1 ? (isDark ? C.burgundyDeep : C.creamInk) : isDark ? C.creamInk : C.ink;
        ctx.font = `600 ${Math.max(9, Math.round(9.5 * s))}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(lb, px + pw / 2, cy);
        if (i < 2) {
          ctx.fillStyle = isDark ? C.sandLight : C.burgundy;
          ctx.fillText("→", px + pw + gap / 2, cy);
        }
      });
    }
    ctx.restore();
  }

  function drawCard(card, info, tone, align, descLines, bulletLines, hasVisual, isCard2, state, ev) {
    const isDark = tone === "dark";
    const isBare = tone === "bare";
    const isTint = tone === "tint";
    const compact = ev.compact;

    ctx.save();
    roundRectPath(ctx, card.x, card.y, card.w, card.h, compact ? 12 : 16);
    if (!isBare) {
      ctx.fillStyle = isDark ? C.burgundy : isTint ? C.tintBg : C.cream;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isDark ? C.burgundyDeep : isTint ? C.tintBorder : C.creamBorder;
      ctx.stroke();
      if (isTint) {
        ctx.save();
        ctx.clip();
        ctx.fillStyle = C.burgundy;
        ctx.fillRect(card.x, card.y, card.w, 5);
        ctx.restore();
      }
    } else if (state.showGuides) {
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = C.fault;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (state.focusLayer === "priority" && (isDark || isBare)) {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = isDark ? C.sandLight : C.fault;
      roundRectPath(ctx, card.x - 2, card.y - 2, card.w + 4, card.h + 4, compact ? 14 : 18);
      ctx.stroke();
    }

    // Draggable top baseline pill on Card 2
    if (isCard2) {
      const aligned = Math.abs(ev.deltaYPx) <= 4;
      const gripW = Math.min(compact ? 104 : 132, card.w - 16);
      const gripX = card.x + card.w - gripW - 10;
      const gripY = card.y - 10;
      roundRectPath(ctx, gripX, gripY, gripW, 20, 10);
      ctx.fillStyle = aligned ? (isDark ? C.sandLight : C.burgundy) : C.fault;
      ctx.fill();
      ctx.fillStyle = aligned && isDark ? C.burgundyDeep : C.creamInk;
      ctx.font = `600 ${compact ? 9.5 : 10.5}px "DM Mono", "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = aligned ? "↕ 齐顶 0px" : `↕ 错牙 ${ev.deltaYPx > 0 ? "+" : ""}${ev.deltaYPx}px`;
      ctx.fillText(label, gripX + gripW / 2, gripY + 10.5);
    }

    roundRectPath(ctx, card.x + 1, card.y + 1, card.w - 2, card.h - 2, compact ? 11 : 15);
    ctx.clip();

    const padX = compact ? 12 : 20;
    const isCenter = align === "center";

    // Wide desktop: when card is wide enough and hasVisual, place geometric motif cleanly on right sub-column so nothing clips in 268px height!
    const sideBySideVisual = !compact && hasVisual && card.w >= 380;
    const textColW = sideBySideVisual ? Math.round(card.w * 0.57) : card.w;
    const textX = isCenter ? card.x + textColW / 2 : card.x + padX;

    // Header badge 01 / 02 + Title + EN
    const badgeR = compact ? 13 : 16;
    const badgeCx = isCenter ? card.x + card.w / 2 - (compact ? 42 : 52) : card.x + padX + badgeR;
    const badgeCy = card.y + (compact ? 30 : 34);

    ctx.fillStyle = isDark ? C.sand : isBare ? "rgba(109,30,41,0.16)" : C.burgundy;
    ctx.beginPath();
    ctx.arc(badgeCx, badgeCy, badgeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isDark ? C.burgundyDeep : isBare ? C.burgundy : C.creamInk;
    ctx.font = `700 ${compact ? 11 : 12.5}px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(info.num, badgeCx, badgeCy + 0.5);

    const headTextX = isCenter ? card.x + card.w / 2 + 12 : badgeCx + badgeR + (compact ? 8 : 11);
    ctx.textAlign = isCenter ? "center" : "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = isDark ? C.creamInk : C.ink;
    ctx.font = `900 ${compact ? 14.5 : 18}px "Noto Sans SC", sans-serif`;
    ctx.fillText(info.title, headTextX, card.y + (compact ? 29 : 33));

    ctx.fillStyle = isDark ? C.sandLight : C.burgundy;
    ctx.font = `700 ${compact ? 9 : 10.5}px "Manrope", sans-serif`;
    ctx.fillText(info.en, headTextX, card.y + (compact ? 43 : 49));

    ctx.fillStyle = isDark ? C.sand : C.burgundy;
    ctx.fillRect(isCenter ? card.x + card.w / 2 - 10 : headTextX, card.y + (compact ? 49 : 56), 22, 2);

    if (hoverZone === (isCard2 ? "card2Head" : "card1Head")) {
      ctx.fillStyle = isDark ? "rgba(255,248,240,0.14)" : "rgba(109,30,41,0.07)";
      roundRectPath(ctx, card.x + 6, card.y + 6, card.w - 12, compact ? 48 : 56, 8);
      ctx.fill();
    }

    // Internal vertical alignment guide
    if (state.showGuides && !isCenter) {
      ctx.save();
      ctx.strokeStyle = isDark ? "rgba(238,219,200,0.22)" : "rgba(109,30,41,0.2)";
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(card.x + padX, card.y + (compact ? 58 : 66));
      ctx.lineTo(card.x + padX, card.y + card.h - 14);
      ctx.stroke();
      ctx.restore();
    }

    // Side-by-side visual on desktop
    if (sideBySideVisual) {
      drawVisualMotif(
        info.visualKind,
        { x: card.x + textColW - 4, y: card.y + 66, w: card.w - textColW - 10, h: card.h - 86 },
        tone
      );
    }

    // Description text
    let curY = card.y + (compact ? 72 : 78);
    ctx.fillStyle = isDark ? C.creamSub : C.inkSub;
    ctx.font = `400 ${compact ? 11.2 : 12.8}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = isCenter ? "center" : "left";
    const descShow = sideBySideVisual ? descLines.slice(0, 3) : descLines.slice(0, compact ? 4 : 3);
    for (const line of descShow) {
      ctx.fillText(line, textX, curY);
      curY += compact ? 15.5 : 17.5;
    }

    // Stacked visual on mobile compact or narrow desktop card
    if (hasVisual && !sideBySideVisual) {
      const visH = compact ? 86 : 64;
      const visTop = curY + 2;
      drawVisualMotif(info.visualKind, { x: card.x + 8, y: visTop, w: card.w - 16, h: visH }, tone);
      curY = visTop + visH + 8;
    } else {
      curY += 6;
    }

    // Rule above KEY POINTS
    ctx.strokeStyle = isDark ? "rgba(238,219,200,0.34)" : "rgba(109,30,41,0.24)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(card.x + padX, curY);
    ctx.lineTo(card.x + textColW - padX, curY);
    ctx.stroke();
    curY += compact ? 15 : 16;

    // KEY POINTS label
    ctx.fillStyle = isDark ? C.sandLight : C.burgundy;
    ctx.font = `700 ${compact ? 9.8 : 10.8}px "Manrope", "Noto Sans SC", sans-serif`;
    ctx.textAlign = isCenter ? "center" : "left";
    ctx.fillText(info.keyLabel, textX, curY);
    curY += compact ? 15 : 16.5;

    // Bullet points
    ctx.font = `400 ${compact ? 10.8 : 12}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = isDark ? C.creamInk : C.ink;
    const maxY = card.y + card.h - 12;
    let clipped = false;
    for (const lines of bulletLines) {
      for (let li = 0; li < lines.length; li++) {
        if (curY > maxY) {
          clipped = true;
          break;
        }
        const txt = sideBySideVisual && lines[li].length > 15 ? `${lines[li].slice(0, 14)}…` : lines[li];
        if (li === 0) {
          if (isCenter) {
            ctx.fillText(`• ${txt}`, textX, curY);
          } else {
            ctx.fillStyle = isDark ? C.sandLight : C.burgundy;
            ctx.beginPath();
            ctx.arc(card.x + padX + 3, curY - 3.5, 2.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = isDark ? C.creamInk : C.ink;
            ctx.fillText(txt, card.x + padX + 11, curY);
          }
        } else {
          ctx.fillText(txt, isCenter ? textX : card.x + padX + 11, curY);
        }
        curY += compact ? 14.8 : 16.2;
      }
      if (clipped) break;
    }

    if (clipped) {
      ctx.fillStyle = isDark ? "#FF9C9C" : C.fault;
      ctx.font = `700 ${compact ? 9.5 : 10.5}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText("⚠ 内容溢框 · 点此精简", card.x + card.w - 10, card.y + card.h - 8);
    }

    ctx.restore();
  }

  function drawFulcrumBar(ev, tiltDeg) {
    const barY = ev.slideH + 6;
    const barH = ev.stageH - barY - 4;
    const compact = ev.compact;

    ctx.save();
    roundRectPath(ctx, compact ? 8 : 14, barY, ev.W - (compact ? 16 : 28), barH, 10);
    ctx.fillStyle = "#F7DDD7";
    ctx.fill();
    ctx.strokeStyle = "#DFBEB6";
    ctx.lineWidth = 1;
    ctx.stroke();

    const fx = compact ? ev.W * 0.5 : ev.W * 0.5;
    const fy = barY + (compact ? 30 : 32);
    const halfLen = compact ? 64 : 88;
    const rad = (tiltDeg * Math.PI) / 180;

    // Left text
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = C.burgundy;
    ctx.font = `700 ${compact ? 10 : 11}px "Manrope", "Noto Sans SC", sans-serif`;
    ctx.fillText(compact ? "实绘几何" : "实绘单真源几何", compact ? 20 : 32, barY + (compact ? 22 : 20));
    ctx.fillStyle = C.ink;
    ctx.font = `500 ${compact ? 11 : 13}px "DM Mono", monospace`;
    ctx.fillText(
      compact
        ? `${ev.splitPct1}:${ev.splitPct2} · 缝${ev.gutterPx}px`
        : `${ev.splitPct1}:${ev.splitPct2}  ·  中缝 ${ev.gutterPx}px  ·  顶差 ${ev.deltaYPx >= 0 ? "+" : ""}${ev.deltaYPx}px`,
      compact ? 20 : 32,
      barY + (compact ? 44 : 41)
    );

    // Center: Poster 338 Fulcrum (●───▲───●)
    ctx.fillStyle = ev.pillars.balance.pass ? C.burgundy : C.fault;
    ctx.beginPath();
    ctx.moveTo(fx, fy + 2);
    ctx.lineTo(fx - (compact ? 10 : 12), fy + (compact ? 19 : 20));
    ctx.lineTo(fx + (compact ? 10 : 12), fy + (compact ? 19 : 20));
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(109,30,41,0.24)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fx - halfLen - 10, fy);
    ctx.lineTo(fx + halfLen + 10, fy);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(rad);
    ctx.strokeStyle = C.burgundyDeep;
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-halfLen, 0);
    ctx.lineTo(halfLen, 0);
    ctx.stroke();

    const r1 = clamp((compact ? 8 : 10) + (ev.mass1 - 65) * 0.06, 7.5, 14);
    const r2 = clamp((compact ? 8 : 10) + (ev.mass2 - 65) * 0.06, 7.5, 14);
    ctx.fillStyle = C.burgundy;
    ctx.beginPath();
    ctx.arc(-halfLen + 9, -r1 - 3, r1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.sand;
    ctx.strokeStyle = C.burgundy;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(halfLen - 9, -r2 - 3, r2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Right readout
    ctx.textAlign = "right";
    ctx.fillStyle = ev.pillars.balance.pass ? C.pass : C.fault;
    ctx.font = `700 ${compact ? 10 : 11}px "Noto Sans SC", sans-serif`;
    const tiltWord =
      Math.abs(ev.tiltPct) <= 6
        ? "平衡（示意）"
        : ev.tiltPct < 0
          ? `左倾${Math.abs(ev.tiltPct)}%（示意）`
          : `右倾+${ev.tiltPct}%（示意）`;
    ctx.fillText(compact ? tiltWord : `信息平衡 · ${tiltWord}`, ev.W - (compact ? 20 : 32), barY + (compact ? 22 : 20));

    ctx.fillStyle = ev.score === 4 ? C.pass : C.fault;
    ctx.font = `700 ${compact ? 11 : 13}px "DM Mono", "Noto Sans SC", sans-serif`;
    ctx.fillText(
      compact ? `${ev.score}/4 · ${ev.estScanSec}s` : `${ev.verdict.badge}  ·  预计扫读 ${ev.estScanSec}s（示意）`,
      ev.W - (compact ? 20 : 32),
      barY + (compact ? 44 : 41)
    );

    if (compact) {
      ctx.textAlign = "center";
      ctx.fillStyle = C.inkSub;
      ctx.font = `500 10px "Noto Sans SC", sans-serif`;
      ctx.fillText("横拖 (+) 调宽比 · 纵拖右卡顶抓手齐线 · 点卡片改明暗/字量", ev.W / 2, barY + 62);
    }
    ctx.restore();
  }

  function drawGazeSweep(ev, gt) {
    const p = clamp(gt / 3.0, 0, 1);
    const pts = [
      { x: ev.padX + 90, y: 42 },
      { x: ev.card1.x + ev.card1.w * 0.44, y: ev.card1.y + 72 },
      { x: ev.card1.x + ev.card1.w * 0.44, y: ev.card1.y + ev.card1.h * 0.72 },
      { x: ev.plusCenter.x, y: ev.plusCenter.y },
      { x: ev.card2.x + ev.card2.w * 0.44, y: ev.card2.y + 72 },
      { x: ev.card2.x + ev.card2.w * 0.44, y: ev.card2.y + ev.card2.h * 0.72 },
    ];
    const segs = pts.length - 1;
    const totalProg = p * segs;
    const segIdx = Math.min(segs - 1, Math.floor(totalProg));
    const local = totalProg - segIdx;
    const curX = pts[segIdx].x + (pts[segIdx + 1].x - pts[segIdx].x) * local;
    const curY = pts[segIdx].y + (pts[segIdx + 1].y - pts[segIdx].y) * local;

    ctx.save();
    ctx.strokeStyle = ev.score === 4 ? "rgba(24,96,67,0.8)" : "rgba(184,32,42,0.85)";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i <= segIdx; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.lineTo(curX, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = ev.score === 4 ? C.pass : C.fault;
    ctx.beginPath();
    ctx.arc(curX, curY, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.creamInk;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    const pillW = ev.compact ? 228 : 250;
    roundRectPath(ctx, ev.W / 2 - pillW / 2, 10, pillW, 26, 13);
    ctx.fillStyle = ev.score === 4 ? C.pass : C.fault;
    ctx.fill();
    ctx.fillStyle = C.creamInk;
    ctx.font = `700 11.5px "DM Mono", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const statusMsg = ev.score === 4 ? "流畅收口" : `受阻 · 预计 ${ev.estScanSec}s`;
    ctx.fillText(`3 秒视线演练 ${Math.min(3.0, gt).toFixed(1)}s · ${statusMsg}`, ev.W / 2, 23.5);
    ctx.restore();
  }

  function render(t, dt, { still }) {
    const state = getState();
    const ev = evaluateSlide(state, dims);

    if (still) {
      intro = 1;
      displayTilt = ev.tiltPct * 0.28;
      gazeActive = false;
    } else {
      if (intro < 1) {
        intro = Math.min(1, intro + Math.max(dt, 0.016) * 2.2);
        dirty = true;
      }
      const targetTilt = ev.tiltPct * 0.28;
      if (Math.abs(displayTilt - targetTilt) > 0.06) {
        displayTilt += (targetTilt - displayTilt) * Math.min(1, Math.max(dt, 0.016) * 10);
        dirty = true;
      } else {
        displayTilt = targetTilt;
      }
      if (gazeActive) {
        gazeT += Math.max(dt, 0.016);
        dirty = true;
        if (gazeT >= 3.2) {
          gazeActive = false;
          gazeT = 0;
        }
      }
    }

    if (!dirty && !still) return;
    dirty = false;

    const scale = cssW / ev.W;
    ctx.save();
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);

    // Outer blush ground
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, ev.W, ev.stageH);

    // 16:9 Slide Frame (crisp print-style offset shadow, zero expensive software shadowBlur)
    const sx = ev.compact ? 8 : 14;
    const sy = 4;
    const sw = ev.W - sx * 2;
    const sh = ev.slideH - sy - 2;
    roundRectPath(ctx, sx, sy + 3, sw, sh, 12);
    ctx.fillStyle = "rgba(109, 30, 41, 0.08)";
    ctx.fill();

    roundRectPath(ctx, sx, sy, sw, sh, 12);
    ctx.fillStyle = C.slideBg;
    ctx.fill();
    ctx.strokeStyle = C.slideBorder;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Slide header
    ctx.fillStyle = C.inkSub;
    ctx.font = `500 ${ev.compact ? 9.5 : 10.5}px "DM Mono", monospace`;
    ctx.textAlign = "left";
    ctx.fillText("SLIDE 16:9 · ECMA-376 twoObj", ev.padX, ev.compact ? 22 : 23);

    // Top-right miniature Poster 338 stacked quarter-circle crest inside slide
    if (!ev.compact) {
      ctx.save();
      const qx = ev.W - ev.padX;
      const qy = 68;
      ctx.fillStyle = C.burgundy;
      ctx.beginPath();
      ctx.moveTo(qx, qy);
      ctx.lineTo(qx - 38, qy);
      ctx.arc(qx - 38, qy, 38, -Math.PI / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C.sand;
      ctx.beginPath();
      ctx.moveTo(qx - 20, qy);
      ctx.lineTo(qx - 42, qy);
      ctx.arc(qx - 42, qy, 22, -Math.PI / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C.burgundy;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          ctx.beginPath();
          ctx.arc(qx - 28 + c * 8, 16 + r * 7, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Shared slide headline
    ctx.fillStyle = C.ink;
    ctx.font = `900 ${ev.compact ? 17 : 22}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(ev.deck.slideTitle, ev.padX, ev.compact ? 44 : 47);

    ctx.fillStyle = C.burgundy;
    ctx.fillRect(ev.padX, ev.compact ? 51 : 54, 34, 2.2);

    ctx.fillStyle = C.burgundySoft;
    ctx.font = `600 ${ev.compact ? 10.2 : 11.5}px "Manrope", "Noto Sans SC", sans-serif`;
    ctx.fillText(ev.deck.slideSub, ev.padX, ev.compact ? 67 : 70);

    // 1:1 Poster 338 Top Bracket: ┌──── 双模块结构 ∨ ────┐
    const ease = 1 - Math.pow(1 - intro, 3);
    const by = ev.bracketY;
    ctx.save();
    ctx.strokeStyle = C.burgundy;
    ctx.lineWidth = 1.3;
    const midX = ev.seamX;
    const labelW = ev.compact ? 78 : 92;
    ctx.beginPath();
    ctx.moveTo(ev.card1.x + 8, by + 8);
    ctx.lineTo(ev.card1.x + 8, by);
    ctx.lineTo(Math.max(ev.card1.x + 18, midX - labelW / 2), by);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(Math.min(ev.card2.x + ev.card2.w - 18, midX + labelW / 2), by);
    ctx.lineTo(ev.card2.x + ev.card2.w - 8, by);
    ctx.lineTo(ev.card2.x + ev.card2.w - 8, by + 8);
    ctx.stroke();

    ctx.fillStyle = C.burgundy;
    ctx.font = `700 ${ev.compact ? 11 : 12.5}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(ev.deck.bracketLabel, midX, by + 4);
    ctx.beginPath();
    ctx.moveTo(midX - 4, by + 9);
    ctx.lineTo(midX, by + 14);
    ctx.lineTo(midX + 4, by + 9);
    ctx.stroke();
    ctx.restore();

    // Draw Cards
    const slideShift = (1 - ease) * 12;
    const c1 = { ...ev.card1, y: ev.card1.y + slideShift };
    const c2 = { ...ev.card2, y: ev.card2.y + slideShift };
    const align1 = state.alignMode === "center" ? "center" : "left";
    const align2 = state.alignMode === "left" ? "left" : "center";

    drawCard(c1, ev.deck.c1, ev.tones.left, align1, ev.descLines1, ev.bulletLines1, state.visual1, false, state, ev);
    drawCard(c2, ev.deck.c2, ev.tones.right, align2, ev.descLines2, ev.bulletLines2, state.visual2, true, state, ev);

    // Alignment baseline laser
    if (state.showGuides || Math.abs(ev.deltaYPx) > 4 || state.focusLayer === "alignment") {
      const aligned = Math.abs(ev.deltaYPx) <= 4;
      ctx.save();
      ctx.strokeStyle = aligned ? "rgba(24,96,67,0.55)" : "rgba(184,32,42,0.85)";
      ctx.lineWidth = aligned ? 1.2 : 1.6;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(c1.x - 8, c1.y);
      ctx.lineTo(c2.x + c2.w + 8, c1.y);
      ctx.stroke();
      ctx.setLineDash([]);
      if (!aligned) {
        ctx.fillStyle = C.faultBg;
        ctx.fillRect(c2.x, Math.min(c1.y, c2.y), c2.w, Math.abs(c2.y - c1.y));
        ctx.strokeStyle = C.fault;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(c2.x + 12, c1.y);
        ctx.lineTo(c2.x + 12, c2.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (!ev.pillars.modules.pass || state.focusLayer === "modules") {
      ctx.save();
      ctx.fillStyle = ev.pillars.modules.pass ? C.passBg : C.faultBg;
      ctx.fillRect(c1.x + c1.w, c1.y, ev.drawGutter, c1.h);
      ctx.restore();
    }

    // Central Spine: dashed burgundy line + champagne-sand (+) knob
    const px = ev.plusCenter.x;
    const py = ev.plusCenter.y + slideShift;
    ctx.save();
    ctx.strokeStyle = ev.pillars.modules.pass ? C.burgundySoft : C.fault;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(px, c1.y + 30);
    ctx.lineTo(px, py - 21);
    ctx.moveTo(px, py + 21);
    ctx.lineTo(px, c1.y + c1.h - 30);
    ctx.stroke();
    ctx.setLineDash([]);

    const knobR =
      hoverZone === "plus" || hoverZone === "seam" || drag?.mode === "split"
        ? ev.compact
          ? 20
          : 22
        : ev.compact
          ? 17
          : 19;
    ctx.fillStyle = "rgba(82, 19, 28, 0.14)";
    ctx.beginPath();
    ctx.arc(px, py + 2, knobR + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = C.sand;
    ctx.beginPath();
    ctx.arc(px, py, knobR, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 2.3;
    ctx.strokeStyle = ev.pillars.modules.pass ? C.pass : C.fault;
    ctx.stroke();

    ctx.strokeStyle = C.burgundyDeep;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(px - 6.5, py);
    ctx.lineTo(px + 6.5, py);
    ctx.moveTo(px, py - 6.5);
    ctx.lineTo(px, py + 6.5);
    ctx.stroke();

    ctx.fillStyle = C.burgundyDeep;
    ctx.font = `700 9.5px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("◀", px - knobR - 8, py);
    ctx.fillText("▶", px + knobR + 8, py);
    ctx.restore();

    // Width tags (inset neatly inside top bracket ticks so they never collide)
    if (state.showGuides) {
      ctx.save();
      ctx.font = `600 ${ev.compact ? 9.5 : 10.5}px "DM Mono", monospace`;
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = C.burgundy;
      ctx.textAlign = "left";
      ctx.fillText(`${ev.splitPct1}% · 约${ev.cpl1}字/行`, c1.x + (ev.compact ? 14 : 20), c1.y - 5);
      ctx.textAlign = "right";
      ctx.fillText(`${ev.splitPct2}% · 约${ev.cpl2}字/行`, c2.x + c2.w - (ev.compact ? 14 : 20), c1.y - 5);
      ctx.restore();
    }

    if (gazeActive) drawGazeSweep(ev, gazeT);
    drawFulcrumBar(ev, displayTilt);

    ctx.restore();
    if (onAfterRender) onAfterRender(ev);
  }

  // Pointer & Touch Events (keeps vertical mobile scroll smooth; horizontal swipe drags + seam!)
  canvas.addEventListener("pointerdown", (e) => {
    const pt = clientToLogical(e.clientX, e.clientY);
    const state = getState();
    const ev = evaluateSlide(state, dims);
    const zone = hitTest(pt, ev);
    const immediateMode =
      zone === "plus" || zone === "seam" ? "split" : zone === "card2Top" ? "offsetY" : "pending";
    drag = {
      id: e.pointerId,
      zone,
      mode: immediateMode,
      startX: e.clientX,
      startY: e.clientY,
      startSplit: state.split,
      startOffsetY: state.offsetY,
      moved: false,
    };
    if (immediateMode !== "pending") {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    const pt = clientToLogical(e.clientX, e.clientY);
    const state = getState();
    const ev = evaluateSlide(state, dims);
    if (!drag) {
      const z = hitTest(pt, ev);
      if (z !== hoverZone) {
        hoverZone = z;
        canvas.style.cursor =
          z === "plus" || z === "seam"
            ? "ew-resize"
            : z === "card2Top"
              ? "ns-resize"
              : z.startsWith("card")
                ? "pointer"
                : "grab";
        dirty = true;
        ctl.draw();
      }
      return;
    }
    if (e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 5) drag.moved = true;

    if (drag.mode === "pending" && drag.moved) {
      if (Math.abs(dx) >= Math.abs(dy) * 0.85) {
        drag.mode = "split";
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {}
      } else {
        drag = null;
        return;
      }
    }

    const r = canvas.getBoundingClientRect();
    if (drag.mode === "split") {
      const dSplit = dx / Math.max(r.width * 0.85, 1);
      let next = clamp(drag.startSplit + dSplit, 0.26, 0.74);
      if (Math.abs(next - 0.5) < 0.015) next = 0.5;
      patchState({ split: +next.toFixed(3) }, true);
      dirty = true;
      if (reducedMotion.matches) ctl.draw();
    } else if (drag.mode === "offsetY") {
      const dOff = dy / Math.max(r.height * 0.78, 1);
      let next = clamp(drag.startOffsetY + dOff, -0.075, 0.075);
      if (Math.abs(next) < 0.008) next = 0;
      patchState({ offsetY: +next.toFixed(4) }, true);
      dirty = true;
      if (reducedMotion.matches) ctl.draw();
    }
  });

  function finishPointer(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!d.moved) {
      const state = getState();
      if (d.zone === "card1Head") {
        const order = ["bare", "classic", "leftDark", "softTint", "bothDark"];
        patchState({ polarity: order[(order.indexOf(state.polarity) + 1) % order.length] });
      } else if (d.zone === "card2Head") {
        patchState({ polarity: state.polarity === "classic" ? "softTint" : "classic" });
      } else if (d.zone === "card1Visual") {
        patchState({ visual1: !state.visual1 });
      } else if (d.zone === "card2Visual") {
        patchState({ visual2: !state.visual2 });
      } else if (d.zone === "card1Body") {
        const nextD = state.density1 === "wall" ? "concise" : state.density1 === "concise" ? "empty" : "wall";
        patchState({ density1: nextD });
      } else if (d.zone === "card2Body") {
        const nextD = state.density2 === "empty" ? "concise" : state.density2 === "concise" ? "wall" : "empty";
        patchState({ density2: nextD });
      } else if (d.zone === "plus") {
        patchState({ split: 0.5, gutter: 0.038 });
      } else if (d.zone === "card2Top") {
        patchState({ offsetY: 0 });
      }
      dirty = true;
      ctl.draw();
    }
  }
  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", finishPointer);

  canvas.addEventListener("keydown", (e) => {
    const state = getState();
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      patchState({ split: +clamp(state.split - 0.02, 0.26, 0.74).toFixed(3) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      patchState({ split: +clamp(state.split + 0.02, 0.26, 0.74).toFixed(3) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = clamp(state.offsetY - 0.01, -0.075, 0.075);
      patchState({ offsetY: Math.abs(next) < 0.008 ? 0 : +next.toFixed(4) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = clamp(state.offsetY + 0.01, -0.075, 0.075);
      patchState({ offsetY: Math.abs(next) < 0.008 ? 0 : +next.toFixed(4) });
    } else if (e.key === " ") {
      e.preventDefault();
      triggerGaze();
    }
  });

  function triggerGaze() {
    gazeActive = true;
    gazeT = 0;
    dirty = true;
    ctl.draw();
  }

  resize();
  new ResizeObserver(() => {
    resize();
    ctl.draw();
  }).observe(canvas);

  const ctl = loop(canvas, render);
  return {
    redraw(immediate = false) {
      dirty = true;
      if (immediate || reducedMotion.matches) ctl.draw();
    },
    triggerGaze,
  };
}

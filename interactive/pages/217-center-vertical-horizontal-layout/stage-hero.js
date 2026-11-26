// 217 纵 中 横 排 · 开场 2D Canvas：中轴穿带·展翼织骨工作台
// 1:1 承袭 217 原海报：淡青薄荷纸 + 中央大浅绿圆晕 + 纯白浮柱（顶底虚线上下箭）+ 四条纯白圆角横带 + 翠绿圆徽与青绿/珊瑚引点
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SPECIMENS, clamp, evaluate } from "./model.js";

const COL = {
  paper: "#F4F9F5",
  halo: "#E2F1E7",
  haloStroke: "#CEE5D7",
  white: "#FFFFFF",
  pineDark: "#11422F",
  emerald: "#0E6B42",
  sageDot: "#75AD8A",
  sageDash: "#7FB595",
  coralDot: "#FA6946",
  coralText: "#C43B1D",
  bodyInk: "#21362C",
  mutedInk: "#466355",
  err: "#C6281E",
  errSoft: "rgba(198, 40, 30, 0.12)",
  ok: "#0E6B42",
  okSoft: "rgba(14, 107, 66, 0.12)",
  ghostStroke: "rgba(17, 66, 47, 0.22)",
};

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawBadgeIcon(ctx, kind, cx, cy, r) {
  // 1:1 复刻 217 原海报四枚深翠圆形徽标
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = COL.emerald;
  ctx.fill();

  ctx.strokeStyle = "#FFFFFF";
  ctx.fillStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(1.8, r * 0.11);
  ctx.lineCap = "round";

  if (kind === "axis") {
    const ir = r * 0.42;
    ctx.beginPath();
    ctx.arc(cx, cy, ir, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.11, 0, Math.PI * 2);
    ctx.fill();
    const tick = r * 0.64;
    ctx.beginPath();
    ctx.moveTo(cx, cy - tick); ctx.lineTo(cx, cy - ir * 0.72);
    ctx.moveTo(cx, cy + tick); ctx.lineTo(cx, cy + ir * 0.72);
    ctx.moveTo(cx - tick, cy); ctx.lineTo(cx - ir * 0.72, cy);
    ctx.moveTo(cx + tick, cy); ctx.lineTo(cx + ir * 0.72, cy);
    ctx.stroke();
  } else if (kind === "bands") {
    const bw = r * 0.5;
    const gap = r * 0.34;
    ctx.beginPath();
    ctx.moveTo(cx - bw, cy - gap); ctx.lineTo(cx + bw, cy - gap);
    ctx.moveTo(cx - bw, cy); ctx.lineTo(cx + bw, cy);
    ctx.moveTo(cx - bw, cy + gap); ctx.lineTo(cx + bw, cy + gap);
    ctx.stroke();
  } else if (kind === "cross") {
    const d = r * 0.38;
    ctx.beginPath();
    ctx.moveTo(cx - d, cy - d); ctx.lineTo(cx + d, cy + d);
    ctx.moveTo(cx + d, cy - d); ctx.lineTo(cx - d, cy + d);
    ctx.stroke();
  } else {
    ctx.lineWidth = Math.max(2.6, r * 0.22);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPillTag(ctx, text, cx, cy, bg, fg, fontPx = 10.5) {
  ctx.save();
  ctx.font = `600 ${fontPx}px "Space Grotesk", "Noto Sans SC", sans-serif`;
  const tw = ctx.measureText(text).width;
  const pw = tw + 12;
  const ph = fontPx + 8;
  roundRectPath(ctx, cx - pw / 2, cy - ph / 2, pw, ph, 4);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 0.5);
  ctx.restore();
}

export function mountHeroStage(canvas, getState, setState, onAudit) {
  const ctx = canvas.getContext("2d");
  let W = 960;
  let H = 450;
  let dirty = true;
  let intro = 0; // 0..1 开场短促柔和浮现（0.35 起即完整可读，0.9s 已完全到位）
  let hoverTarget = null; // "spine" | { band: i } | { wing: i }
  let activeDrag = null;
  let lastEval = null;
  let hitZones = { spine: null, bands: [], wingSlots: [] };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    W = Math.round(rect.width);
    H = Math.round(rect.height);
    const dpr = pixelRatio(W < 640 ? 1.5 : 2);
    const pw = Math.round(W * dpr);
    const ph = Math.round(H * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
  }

  function render(t, dt, { still }) {
    const state = getState();
    const entering = !still && intro < 1;
    if (still) {
      intro = 1;
    } else if (entering) {
      intro = Math.min(1, intro + (dt || 0.016) * 1.85);
    }

    const animating = entering || state.sightline || !!activeDrag;
    if (!dirty && !animating) return;
    dirty = false;

    const ev = evaluate(state, { W, H });
    lastEval = ev;
    if (onAudit) onAudit(ev);

    const ease = 1 - Math.pow(1 - intro, 3);
    const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;

    // 1. 淡青薄荷纸底
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COL.paper;
    ctx.fillRect(0, 0, W, H);

    // 2. 原海报标志性中央大浅绿圆晕（锚定物理正中 50%，轴偏时肉眼立刻看出偏离）
    const haloR = Math.min(W * 0.34, H * 0.44) * (0.9 + 0.1 * ease);
    ctx.save();
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.5, haloR, 0, Math.PI * 2);
    ctx.fillStyle = COL.halo;
    ctx.fill();
    ctx.strokeStyle = COL.haloStroke;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // 当中轴偏离超过 5% 时，在 50% 物理中轴画出细虚线与红色偏距标尺
    if (ev.metrics.axisOffsetPct > 5) {
      const trueCx = ev.padX + (W - ev.padX * 2) * 0.5;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(14, 107, 66, 0.34)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(trueCx, 14);
      ctx.lineTo(trueCx, H - 14);
      ctx.stroke();
      ctx.setLineDash([]);

      // 偏距横箭
      const arrowY = Math.max(14, ev.spineRect.y * 0.48);
      ctx.strokeStyle = COL.err;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(trueCx, arrowY);
      ctx.lineTo(ev.spineRect.cx, arrowY);
      ctx.stroke();
      drawPillTag(ctx, `${ev.metrics.axisDir} ${ev.metrics.axisOffsetPct}%`, (trueCx + ev.spineRect.cx) / 2, arrowY, COL.err, "#FFFFFF", 10);
      ctx.restore();
    }

    // 重建命中热区
    hitZones = { spine: ev.spineRect, bands: [], wingSlots: [] };

    // 3. 四条纯白圆角横向信息带（穿过中柱下方）
    const bandRadius = ev.compact ? 12 : 16;
    const isCollisionGap = (idxA, idxB) => {
      const g = ev.gaps.find((x) => (x.from === idxA && x.to === idxB) || (x.from === idxB && x.to === idxA));
      return g && g.logicalPx < 9;
    };

    ev.bands.forEach((b, i) => {
      const slideOffset = (1 - ease) * (i % 2 === 0 ? -14 : 14);
      const bx = b.rect.x + slideOffset;
      const by = b.rect.y;
      const bw = b.rect.w;
      const bh = b.rect.h;
      const isBandHovered = hoverTarget && hoverTarget.band === i;
      const isBandDragging = activeDrag && activeDrag.kind === "band" && activeDrag.index === i;

      hitZones.bands.push({ index: i, x: bx, y: by, w: bw, h: bh });

      ctx.save();
      // 零高斯模糊的双层柔影（软件渲染 60fps 同样轻快，质感与原海报纯白浮带一致）
      roundRectPath(ctx, bx, by + (isBandDragging ? 5 : 3), bw, bh, bandRadius);
      ctx.fillStyle = isBandDragging ? "rgba(14, 107, 66, 0.10)" : "rgba(17, 66, 47, 0.055)";
      ctx.fill();
      roundRectPath(ctx, bx, by, bw, bh, bandRadius);
      ctx.fillStyle = COL.white;
      ctx.fill();

      // 若该带相邻挤撞，用微红边框提醒
      const touchingErr = ev.gaps.some((g) => (g.from === i || g.to === i) && g.logicalPx < 9);
      ctx.strokeStyle = isBandDragging
        ? COL.emerald
        : touchingErr
          ? "rgba(198, 40, 30, 0.45)"
          : isBandHovered
            ? "rgba(14, 107, 66, 0.4)"
            : "rgba(14, 107, 66, 0.10)";
      ctx.lineWidth = isBandDragging || touchingErr ? 1.5 : 1;
      ctx.stroke();

      // 两侧微弱上下抓点（提示可上下拖移带距）
      const gripX = bx + 5;
      ctx.fillStyle = isBandDragging ? COL.emerald : "rgba(17, 66, 47, 0.25)";
      for (const dy of [-5, 0, 5]) {
        ctx.beginPath();
        ctx.arc(gripX, b.rect.cy + dy, 1.35, 0, Math.PI * 2);
        ctx.fill();
      }

      // 裁剪到带内防文字跑出白卡边缘
      ctx.save();
      roundRectPath(ctx, bx + 2, by + 2, bw - 4, bh - 4, bandRadius - 2);
      ctx.clip();

      // --- 左翼渲染 ---
      const leftSlotX = bx + 10;
      const leftSlotW = Math.max(24, ev.spineRect.x - leftSlotX - 6);
      hitZones.wingSlots.push({ band: i, side: "left", x: leftSlotX, y: by, w: leftSlotW, h: bh });

      if (b.mode === "right-heavy") {
        // 单侧堆右：左翼变成虚线空槽，点击可恢复均衡
        const gw = Math.max(36, leftSlotW - 14);
        roundRectPath(ctx, leftSlotX + 6, by + 10, gw, bh - 20, 8);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(198, 40, 30, 0.45)";
        ctx.fillStyle = "rgba(198, 40, 30, 0.04)";
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = COL.err;
        ctx.font = `600 ${ev.compact ? 10 : 11}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const hint = gw > 110 ? "左翼空悬 · 点此配平双翼" : "点此补左翼";
        ctx.fillText(hint, leftSlotX + 6 + gw / 2, b.rect.cy);
      } else {
        drawBadgeIcon(ctx, b.data.icon, b.badge.cx + slideOffset, b.badge.cy, b.badge.r);

        const lx = b.leftText.x + slideOffset;
        const maxLw = b.leftText.w;
        const titleY = by + (ev.compact ? 16 : 20);
        ctx.fillStyle = COL.pineDark;
        ctx.font = `700 ${ev.bandTitlePx}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(b.data.zhTitle, lx, titleY);

        // 左翼正文真实逐行绘制
        ctx.fillStyle = COL.bodyInk;
        ctx.font = `400 ${ev.bandBodyPx}px "Noto Sans SC", sans-serif`;
        const maxLines = bh < 46 ? 1 : 2;
        b.leftText.lines.slice(0, maxLines).forEach((ln, li) => {
          ctx.fillText(ln, lx, titleY + (bh < 46 ? 13 : ev.compact ? 14 : 18) + li * (ev.bandBodyPx + 3.2));
        });

        // 青绿圆点 + 虚线引连到中柱左缘
        if (state.tethers && maxLw > 20) {
          const titleW = ctx.measureText(b.data.zhTitle).width;
          ctx.font = `700 ${ev.bandTitlePx}px "Noto Sans SC", sans-serif`;
          const dotX = Math.min(ev.spineRect.x - 10, lx + ctx.measureText(b.data.zhTitle).width + (ev.compact ? 8 : 14));
          if (dotX < ev.spineRect.x - 8) {
            ctx.save();
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = COL.sageDash;
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(dotX + 4, titleY);
            ctx.lineTo(ev.spineRect.x, titleY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(dotX, titleY, ev.compact ? 3 : 3.8, 0, Math.PI * 2);
            ctx.fillStyle = COL.sageDot;
            ctx.fill();
            ctx.restore();
          }
          void titleW;
        }
      }

      // --- 右翼渲染 ---
      const rightSlotX = ev.spineRect.x + ev.spineRect.w + 6;
      const rightSlotW = Math.max(24, bx + bw - rightSlotX - 10);
      hitZones.wingSlots.push({ band: i, side: "right", x: rightSlotX, y: by, w: rightSlotW, h: bh });

      if (b.mode === "left-heavy") {
        const gw = Math.max(36, rightSlotW - 14);
        roundRectPath(ctx, rightSlotX + 8, by + 10, gw, bh - 20, 8);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(198, 40, 30, 0.45)";
        ctx.fillStyle = "rgba(198, 40, 30, 0.04)";
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = COL.err;
        ctx.font = `600 ${ev.compact ? 10 : 11}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const hint = gw > 110 ? "右翼空悬 · 点此配平双翼" : "点此补右翼";
        ctx.fillText(hint, rightSlotX + 8 + gw / 2, b.rect.cy);
      } else {
        const rx = b.rightText.x + slideOffset;
        const titleY = by + (ev.compact ? 16 : 20);

        // 珊瑚橙虚线引点（从白柱右缘引出）
        if (state.tethers && rx - (ev.spineRect.x + ev.spineRect.w) > 10) {
          const dotX = Math.max(ev.spineRect.x + ev.spineRect.w + 8, rx - (ev.compact ? 8 : 13));
          ctx.save();
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = COL.coralDot;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(ev.spineRect.x + ev.spineRect.w, titleY);
          ctx.lineTo(dotX - 4, titleY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(dotX, titleY, ev.compact ? 3 : 3.8, 0, Math.PI * 2);
          ctx.fillStyle = COL.coralDot;
          ctx.fill();
          ctx.restore();
        }

        // 若单侧堆右，右翼额外显示小绿徽表示内容挤到右边
        let textStartX = rx;
        if (b.mode === "right-heavy") {
          const miniR = ev.compact ? 8 : 11;
          drawBadgeIcon(ctx, b.data.icon, rx + miniR, titleY + 10, miniR);
          textStartX = rx + miniR * 2 + 8;
        }

        ctx.fillStyle = COL.coralText;
        ctx.font = `700 ${Math.max(10, ev.bandTitlePx - 2)}px "Space Grotesk", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(b.data.enTitle, textStartX, titleY);

        ctx.fillStyle = COL.bodyInk;
        ctx.font = `400 ${ev.bandBodyPx}px "Noto Sans SC", sans-serif`;
        const extraLine = b.mode === "right-heavy" ? `${b.data.zhTitle}：${b.data.enBody}` : b.data.enBody;
        const maxRLines = bh < 46 ? 1 : 2;
        const rMaxW = Math.max(24, (bx + bw - 10) - textStartX);
        const rChars = Math.max(4, Math.floor((rMaxW - 6) / (ev.bandBodyPx * 1.07)));
        const rLines = b.mode === "right-heavy"
          ? [extraLine.slice(0, rChars), extraLine.slice(rChars, rChars * 2)]
          : b.rightText.lines;
        rLines.slice(0, maxRLines).forEach((ln, li) => {
          if (ln) ctx.fillText(ln, textStartX, titleY + (bh < 46 ? 13 : ev.compact ? 14 : 18) + li * (ev.bandBodyPx + 3.2));
        });
      }

      ctx.restore(); // end band clip
      ctx.restore();
    });

    // 4. 浮于上层的纵向中央纯白主轴柱（217 原海报灵魂）
    const sp = ev.spineRect;
    const isSpineActive = hoverTarget === "spine" || (activeDrag && activeDrag.kind === "spine");
    ctx.save();

    // 顶底虚线箭头（1:1 复刻 217 原海报翠绿虚线 ↑ / ↓）
    const arrowColor = ev.checks.axis.ok ? COL.emerald : COL.err;
    ctx.strokeStyle = arrowColor;
    ctx.fillStyle = arrowColor;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 3]);
    // 顶部虚线
    const topEnd = Math.max(10, sp.y - (ev.compact ? 22 : 28));
    ctx.beginPath();
    ctx.moveTo(sp.cx, sp.y);
    ctx.lineTo(sp.cx, topEnd + 7);
    ctx.stroke();
    // 底部虚线
    const botEnd = Math.min(H - 10, sp.y + sp.h + (ev.compact ? 22 : 28));
    ctx.beginPath();
    ctx.moveTo(sp.cx, sp.y + sp.h);
    ctx.lineTo(sp.cx, botEnd - 7);
    ctx.stroke();
    ctx.setLineDash([]);

    // 顶三角箭
    ctx.beginPath();
    ctx.moveTo(sp.cx, topEnd);
    ctx.lineTo(sp.cx - 5, topEnd + 8);
    ctx.lineTo(sp.cx + 5, topEnd + 8);
    ctx.closePath();
    ctx.fill();
    // 底三角箭
    ctx.beginPath();
    ctx.moveTo(sp.cx, botEnd);
    ctx.lineTo(sp.cx - 5, botEnd - 8);
    ctx.lineTo(sp.cx + 5, botEnd - 8);
    ctx.closePath();
    ctx.fill();

    // 纯白浮柱本体 + 零模糊多层柔影（软件渲染与真机均稳跑 60fps）
    const spR = ev.compact ? 4 : 6;
    roundRectPath(ctx, sp.x - 4, sp.y + 6, sp.w + 8, sp.h + 2, spR + 3);
    ctx.fillStyle = isSpineActive ? "rgba(14, 107, 66, 0.09)" : "rgba(17, 66, 47, 0.045)";
    ctx.fill();
    roundRectPath(ctx, sp.x - 2, sp.y + 3, sp.w + 4, sp.h + 1, spR + 1);
    ctx.fillStyle = isSpineActive ? "rgba(14, 107, 66, 0.13)" : "rgba(17, 66, 47, 0.075)";
    ctx.fill();
    roundRectPath(ctx, sp.x, sp.y, sp.w, sp.h, spR);
    ctx.fillStyle = COL.white;
    ctx.fill();

    // 若交口吃字，左右缘描红线报警
    const chompErr = state.clearance < 10;
    ctx.strokeStyle = chompErr
      ? COL.err
      : isSpineActive
        ? COL.emerald
        : "rgba(14, 107, 66, 0.16)";
    ctx.lineWidth = chompErr || isSpineActive ? 1.8 : 1;
    ctx.stroke();

    // 柱内竖排中文大字（自上而下，按 spineScale 真实缩放）
    const titleFontFamily = spec.spineFont === "kai"
      ? `"LXGW WenKai", "Noto Sans SC", serif`
      : `"Noto Sans SC", sans-serif`;
    ctx.fillStyle = COL.pineDark;
    ctx.font = `${spec.spineFont === "kai" ? 500 : 900} ${ev.spineFontPx}px ${titleFontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const charBlockH = sp.h * 0.64;
    const charStep = charBlockH / spec.spineChars.length;
    const startCharY = sp.y + sp.h * 0.08 + charStep * 0.5;
    spec.spineChars.forEach((ch, ci) => {
      const yOff = (1 - ease) * (-10 + ci * 2);
      ctx.fillText(ch, sp.cx, startCharY + ci * charStep + yOff);
    });

    // 短翠绿横杠（原海报中柱大字与英文之间的标志横杠）
    const barY = sp.y + sp.h * 0.745;
    const barW = Math.min(sp.w * 0.36, 26);
    ctx.fillStyle = COL.emerald;
    ctx.fillRect(sp.cx - barW / 2, barY, barW, 2.5);

    // 柱底居中叠排英文副标
    const subPx = clamp(sp.w * 0.105, 8.5, 11.5);
    ctx.fillStyle = COL.pineDark;
    ctx.font = `600 ${subPx}px "Space Grotesk", sans-serif`;
    const subStartY = barY + 13;
    const subStep = subPx + 3.2;
    spec.spineEn.forEach((line, li) => {
      const yy = subStartY + li * subStep;
      if (yy < sp.y + sp.h - 14) {
        ctx.fillText(line, sp.cx, yy, sp.w - 10);
      }
    });

    // 柱底微弱横拖手势印记（← ⋮ →）
    const gripY = sp.y + sp.h - 8;
    ctx.fillStyle = isSpineActive ? COL.emerald : "rgba(17, 66, 47, 0.34)";
    for (const dx of [-6, 0, 6]) {
      ctx.beginPath();
      ctx.arc(sp.cx + dx, gripY, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 交口吃字警示签
    if (chompErr) {
      drawPillTag(ctx, `× 交口吃字 ${state.clearance}px`, sp.cx, sp.y + 12, COL.err, "#FFFFFF", 10);
    } else if (state.clearance > 46 && !state.tethers) {
      drawPillTag(ctx, `× 两翼断联`, sp.cx, sp.y + 12, COL.err, "#FFFFFF", 10);
    }

    ctx.restore();

    // 5. 带间挤撞 / 散乱标记（画在开阔侧且在中柱之上，永不被白柱遮挡，也不压左翼标题）
    const openMarkX = ev.spineRect.cx > W * 0.5 ? ev.padX + 66 : W - ev.padX - 66;
    ev.gaps.forEach((g) => {
      const midY = (g.y1 + g.y2) / 2;
      if (g.logicalPx < 9) {
        ctx.save();
        ctx.fillStyle = COL.errSoft;
        ctx.fillRect(ev.padX + 6, Math.min(g.y1, g.y2) - 1, W - ev.padX * 2 - 12, Math.max(4, Math.abs(g.y2 - g.y1) + 2));
        drawPillTag(ctx, `× 挤撞 ${g.logicalPx}px`, openMarkX, midY, COL.err, "#FFFFFF", 10);
        ctx.restore();
      } else if (ev.metrics.gapSpreadLogical > 26 && g.logicalPx === Math.max(...ev.gaps.map((x) => x.logicalPx))) {
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = COL.err;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(openMarkX - 38, g.y1 + 2);
        ctx.lineTo(openMarkX - 38, g.y2 - 2);
        ctx.stroke();
        ctx.setLineDash([]);
        drawPillTag(ctx, `脱节 ${g.logicalPx}px`, openMarkX, midY, COL.err, "#FFFFFF", 10);
        ctx.restore();
      }
    });

    // 6. 视线流演播（先沿中轴竖向贯通，再在交点向左右双翼辐射）
    if (state.sightline && !still) {
      const cycle = (t * 0.42) % 1;
      ctx.save();
      if (cycle < 0.36) {
        const p = cycle / 0.36;
        const sy = sp.y + p * sp.h;
        ctx.strokeStyle = "rgba(250, 105, 70, 0.72)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sp.cx, sp.y);
        ctx.lineTo(sp.cx, sy);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sp.cx, sy, 6, 0, Math.PI * 2);
        ctx.fillStyle = COL.coralDot;
        ctx.fill();
      } else {
        const p = (cycle - 0.36) / 0.64;
        const bandIdx = Math.min(3, Math.floor(p * 4));
        const localP = (p * 4) - bandIdx;
        const b = ev.bands[bandIdx];
        const y = b.rect.cy;
        const reachL = (sp.x - b.rect.x - 16) * Math.min(1, localP * 1.25);
        const reachR = (b.rect.x + b.rect.w - (sp.x + sp.w) - 16) * Math.min(1, localP * 1.25);

        ctx.strokeStyle = "rgba(14, 107, 66, 0.75)";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(sp.x, y);
        ctx.lineTo(sp.x - reachL, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sp.x - reachL, y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = COL.emerald;
        ctx.fill();

        ctx.strokeStyle = "rgba(250, 105, 70, 0.85)";
        ctx.beginPath();
        ctx.moveTo(sp.x + sp.w, y);
        ctx.lineTo(sp.x + sp.w + reachR, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sp.x + sp.w + reachR, y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = COL.coralDot;
        ctx.fill();
      }
      ctx.restore();
    }

    // 7. 画布四角极简状态角标（窄屏隐藏左侧长串防与偏轴红签撞车）
    ctx.save();
    ctx.font = `600 10.5px "Space Grotesk", "Noto Sans SC", sans-serif`;
    ctx.fillStyle = COL.mutedInk;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    if (W >= 620) {
      ctx.fillText(`AXIS ${ev.metrics.axisRatioPct}% · SPINE ${ev.metrics.spineWidthPct}% · GAP ${ev.metrics.clearancePx}px`, 12, 9);
    }

    const badgeBg = ev.verdict.pass ? COL.okSoft : COL.errSoft;
    const badgeFg = ev.verdict.pass ? COL.ok : COL.err;
    const tagTxt = ev.verdict.short;
    const tw = ctx.measureText(tagTxt).width + 14;
    roundRectPath(ctx, W - tw - 10, 6, tw, 20, 10);
    ctx.fillStyle = badgeBg;
    ctx.fill();
    ctx.fillStyle = badgeFg;
    ctx.textAlign = "right";
    ctx.fillText(tagTxt, W - 17, 10);
    ctx.restore();
  }

  const ctl = loop(canvas, render);

  // ---------------- 指针与触屏交互（保证手机可纵滑滚页 + 顺畅横拖中轴 + 纵拖横带 + 点击翼槽） ----------------
  const ptInRect = (x, y, r) => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

  function canvasPoint(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function updateCursor(x, y) {
    if (ptInRect(x, y, hitZones.spine)) {
      hoverTarget = "spine";
      canvas.style.cursor = "ew-resize";
      return;
    }
    for (const b of hitZones.bands) {
      if (ptInRect(x, y, b)) {
        if (x < b.x + 28 || x > b.x + b.w - 28) {
          hoverTarget = { band: b.index };
          canvas.style.cursor = "ns-resize";
          return;
        }
        hoverTarget = { band: b.index };
        canvas.style.cursor = "grab";
        return;
      }
    }
    hoverTarget = null;
    canvas.style.cursor = "ew-resize";
  }

  function startPointer(x, y, pointerType) {
    const state = getState();
    const onSpine = ptInRect(x, y, hitZones.spine);
    const bandHit = hitZones.bands.find((b) => ptInRect(x, y, b));
    const onEdgeGrip = bandHit && (x < bandHit.x + 30 || x > bandHit.x + bandHit.w - 30);

    activeDrag = {
      startX: x,
      startY: y,
      lastX: x,
      lastY: y,
      moved: false,
      pointerType,
      // 鼠标在边缘抓点上直接进入纵拖带模式；在白柱或任意开阔区横拖进入移轴模式
      kind: onEdgeGrip ? "band" : onSpine ? "spine" : "undecided",
      index: bandHit ? bandHit.index : -1,
      startAxisX: state.axisX,
      startBandY: bandHit ? state.bandY[bandHit.index] : 0,
    };
  }

  function movePointer(x, y, preventScroll) {
    if (!activeDrag) {
      updateCursor(x, y);
      dirty = true;
      ctl.draw();
      return;
    }
    const dx = x - activeDrag.startX;
    const dy = y - activeDrag.startY;
    if (Math.hypot(dx, dy) > 4) activeDrag.moved = true;

    // 决策拖拽意图：触屏纵向为主且不在带抓点上时放行页面滚动
    if (activeDrag.kind === "undecided" && Math.hypot(dx, dy) > 5) {
      if (Math.abs(dx) >= Math.abs(dy) * 0.85) {
        activeDrag.kind = "spine";
      } else if (activeDrag.pointerType !== "touch" && activeDrag.index >= 0) {
        activeDrag.kind = "band";
      } else {
        activeDrag = null;
        return;
      }
    }

    if (activeDrag.kind === "spine") {
      if (preventScroll) preventScroll();
      const ev = lastEval || evaluate(getState(), { W, H });
      const innerW = Math.max(100, W - ev.padX * 2);
      let nextAxis = clamp(activeDrag.startAxisX + dx / innerW, 0.24, 0.76);
      // 靠近 50% 物理中轴轻轻吸附
      if (Math.abs(nextAxis - 0.5) < 0.014) nextAxis = 0.5;
      setState({ axisX: +nextAxis.toFixed(3) }, { deferDraw: true });
      dirty = true;
    } else if (activeDrag.kind === "band" && activeDrag.index >= 0) {
      if (preventScroll) preventScroll();
      const ev = lastEval || evaluate(getState(), { W, H });
      const innerH = Math.max(100, H - ev.padY * 2);
      const nextY = clamp(activeDrag.startBandY + dy / innerH, 0.13, 0.87);
      const arr = [...getState().bandY];
      arr[activeDrag.index] = +nextY.toFixed(3);
      setState({ bandY: arr }, { deferDraw: true });
      dirty = true;
    }
  }

  function endPointer(x, y) {
    if (!activeDrag) return;
    const wasClick = !activeDrag.moved;
    activeDrag = null;

    if (wasClick) {
      // 点击横带左/右翼槽，切换单双翼分布状态
      const slot = hitZones.wingSlots.find((s) => ptInRect(x, y, s));
      if (slot) {
        const modes = [...getState().bandMode];
        const cur = modes[slot.band];
        if (cur !== "both") {
          modes[slot.band] = "both";
        } else {
          modes[slot.band] = slot.side === "left" ? "right-heavy" : "left-heavy";
        }
        setState({ bandMode: modes });
        dirty = true;
        ctl.draw();
      }
    }
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏走原生 touch 事件以精确放行纵向滚页
    const p = canvasPoint(e.clientX, e.clientY);
    startPointer(p.x, p.y, e.pointerType);
    canvas.setPointerCapture?.(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const p = canvasPoint(e.clientX, e.clientY);
    movePointer(p.x, p.y, () => e.preventDefault());
  });

  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    const p = canvasPoint(e.clientX, e.clientY);
    endPointer(p.x, p.y);
  });

  canvas.addEventListener("pointerleave", () => {
    if (!activeDrag) {
      hoverTarget = null;
      dirty = true;
      ctl.draw();
    }
  });

  // 原生 touch 事件（兼容 tools/perf.mjs 的 Input.dispatchTouchEvent 与真机触屏滚动）
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const p = canvasPoint(t0.clientX, t0.clientY);
    startPointer(p.x, p.y, "touch");
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!activeDrag || e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const p = canvasPoint(t0.clientX, t0.clientY);
    movePointer(p.x, p.y, () => e.preventDefault());
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    const t0 = e.changedTouches[0];
    const p = t0 ? canvasPoint(t0.clientX, t0.clientY) : { x: 0, y: 0 };
    endPointer(p.x, p.y);
  }, { passive: true });

  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(canvas);
  resize();

  return {
    requestDraw(defer = false) {
      dirty = true;
      if (!defer || reducedMotion.matches) ctl.draw();
    },
    getMetrics() {
      return lastEval || evaluate(getState(), { W, H });
    },
  };
}

// 202 等距网格 · 开场 4×3 活体校样台 2D Canvas 渲染与直接交互
import { loop, pixelRatio } from "../../lib/stage.js";
import { clamp, computeLayout, diagnose, snapGutter } from "./model.js";

const COLORS = {
  paper: "#F5EFE6",
  cardBg: "#FAF6F0",
  cardStroke: "#C9C1B6",
  ink: "#0B0F0F",
  inkMuted: "#4D4842",
  red: "#F3552B",
  redInk: "#BA300C",
  redSoft: "rgba(243, 85, 43, 0.14)",
  redBand: "rgba(243, 85, 43, 0.17)",
  redErr: "#B31D1D",
  redErrSoft: "rgba(179, 29, 29, 0.14)",
  ok: "#166852",
  okSoft: "rgba(22, 104, 82, 0.14)",
};

// 严格按 202 原海报绘制 12 个经典瑞士几何图形
function drawPosterGlyph(ctx, shape, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  switch (shape) {
    case "square":
      ctx.fillRect(cx - r * 0.84, cy - r * 0.84, r * 1.68, r * 1.68);
      break;
    case "circle":
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "triangle":
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.92);
      ctx.lineTo(cx + r * 0.95, cy + r * 0.82);
      ctx.lineTo(cx - r * 0.95, cy + r * 0.82);
      ctx.closePath();
      ctx.fill();
      break;
    case "semi":
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.56, r * 0.96, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();
      break;
    case "diamond":
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.96);
      ctx.lineTo(cx + r * 0.96, cy);
      ctx.lineTo(cx, cy + r * 0.96);
      ctx.lineTo(cx - r * 0.96, cy);
      ctx.closePath();
      ctx.fill();
      break;
    case "bars2": {
      const bw = r * 1.82;
      const bh = r * 0.42;
      const gap = r * 0.46;
      ctx.fillRect(cx - bw / 2, cy - gap / 2 - bh, bw, bh);
      ctx.fillRect(cx - bw / 2, cy + gap / 2, bw, bh);
      break;
    }
    case "dots9": {
      const step = r * 0.68;
      const dr = r * 0.22;
      for (let rr = -1; rr <= 1; rr++) {
        for (let cc = -1; cc <= 1; cc++) {
          ctx.beginPath();
          ctx.arc(cx + cc * step, cy + rr * step, dr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case "grid4": {
      const s = r * 0.74;
      const g = r * 0.22;
      for (let rr = 0; rr < 2; rr++) {
        for (let cc = 0; cc < 2; cc++) {
          ctx.fillRect(cx - s - g / 2 + cc * (s + g), cy - s - g / 2 + rr * (s + g), s, s);
        }
      }
      break;
    }
    case "dots4": {
      const off = r * 0.46;
      const dr = r * 0.36;
      for (let rr = -1; rr <= 1; rr += 2) {
        for (let cc = -1; cc <= 1; cc += 2) {
          ctx.beginPath();
          ctx.arc(cx + cc * off, cy + rr * off, dr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case "quarter": {
      const rad = r * 0.9;
      ctx.lineWidth = Math.max(1.2, r * 0.06);
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, rad, Math.PI, Math.PI * 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, rad, 0, Math.PI * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "bars3": {
      const bw = r * 0.34;
      const bh = r * 1.72;
      const step = r * 0.56;
      for (let k = -1; k <= 1; k++) {
        ctx.fillRect(cx + k * step - bw / 2, cy - bh / 2, bw, bh);
      }
      break;
    }
    case "ring": {
      ctx.lineWidth = r * 0.38;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    default:
      ctx.fillRect(cx - r * 0.7, cy - r * 0.7, r * 1.4, r * 1.4);
  }
  ctx.restore();
}

function drawCardContent(ctx, card, theme, innerPx, scale, diag) {
  const { x, y, w, h, mod, spanCols } = card;
  const pad = Math.min(innerPx, w * 0.27, h * 0.25);
  const ix = x + pad;
  const iy = y + pad;
  const iw = Math.max(10, w - pad * 2);
  const ih = Math.max(10, h - pad * 2);

  // 内松外紧倒挂时，细红框显出过厚的内边距带（不用 setLineDash 避免软件渲染管线停顿）
  if (!diag.checks.hierarchy && diag.metrics.innerPad >= Math.min(diag.metrics.gx, diag.metrics.gy) && Math.min(diag.metrics.gx, diag.metrics.gy) > 0) {
    ctx.strokeStyle = "rgba(179, 29, 29, 0.34)";
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(ix) + 0.5, Math.round(iy) + 0.5, Math.round(iw) - 1, Math.round(ih) - 1);
  }

  const labelFontSize = Math.max(10, Math.round(11.5 * scale));
  const subFontSize = Math.max(9.5, Math.round(9.2 * scale));

  if (theme === "poster") {
    if (spanCols > 1) {
      // 跨列主卡右侧绘制结构示意条（窄屏自动紧凑文案，永不撞右框）
      const compact = w < 185;
      const gxCenter = ix + iw * (compact ? 0.22 : 0.30);
      const rSpan = Math.max(7, Math.min(iw * (compact ? 0.16 : 0.20), ih * 0.36));
      drawPosterGlyph(ctx, mod.shape, gxCenter, iy + ih * 0.54, rSpan, card.spanBug ? COLORS.redErr : COLORS.red);

      const tx = ix + iw * (compact ? 0.44 : 0.50);
      const maxTw = Math.max(24, ix + iw - tx - 2);
      ctx.fillStyle = COLORS.ink;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${Math.max(10, Math.round((compact ? 11 : 12) * scale))}px "Noto Sans SC", sans-serif`;
      const headTxt = card.spanBug ? (compact ? "跨列·漏1X" : "跨列卡 · 漏 1X") : (compact ? "跨列·2W+X" : "跨列卡 · 2W+X");
      ctx.fillText(headTxt, tx, iy + ih * 0.44, maxTw);
      ctx.fillStyle = card.spanBug ? COLORS.redErr : COLORS.ok;
      ctx.font = `500 ${Math.max(9.5, Math.round(9.5 * scale))}px "DM Mono", monospace`;
      const subTxt = card.spanBug ? "WIDTH = 2W" : `2W + ${diag.metrics.gx}px`;
      ctx.fillText(subTxt, tx, iy + ih * 0.68, maxTw);
      return;
    }
    const labelZone = Math.max(25, 29 * scale);
    const glyphAreaH = Math.max(14, ih - labelZone);
    const r = Math.max(8, Math.min(iw * 0.34, glyphAreaH * 0.43));
    const gxCenter = ix + iw / 2;
    const gyCenter = iy + glyphAreaH * 0.5;
    drawPosterGlyph(ctx, mod.shape, gxCenter, gyCenter, r, COLORS.red);

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.ink;
    ctx.font = `600 ${labelFontSize}px "Noto Sans SC", sans-serif`;
    ctx.fillText(mod.zh, x + w / 2, iy + ih - Math.max(13.5, 14.5 * scale));
    ctx.fillStyle = COLORS.inkMuted;
    ctx.font = `500 ${subFontSize}px "Sora", sans-serif`;
    ctx.fillText(mod.en, x + w / 2, iy + ih - Math.max(3.5, 4 * scale));
    return;
  }

  if (theme === "exhibit") {
    // 展讯卡片墙：顶角编号 + 微缩瑞士徽 + 标题 + 细横线
    const r = Math.max(7, Math.min(iw * 0.16, ih * 0.22));
    drawPosterGlyph(ctx, mod.shape, ix + r + 2, iy + r + 2, r * 0.9, COLORS.red);
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillStyle = COLORS.inkMuted;
    ctx.font = `500 ${Math.max(9, Math.round(9.2 * scale))}px "DM Mono", monospace`;
    ctx.fillText(mod.exTag, ix + iw, iy + 1);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.ink;
    ctx.font = `700 ${Math.max(10, Math.round(11.5 * scale))}px "Noto Sans SC", sans-serif`;
    ctx.fillText(spanCols > 1 ? `${mod.exTitle}（双栏主展）` : mod.exTitle, ix, iy + ih - Math.max(11, 12 * scale));

    // 极简正文模拟横杠
    const barY = iy + ih - Math.max(5, 5.5 * scale);
    ctx.fillStyle = "#C9C1B6";
    ctx.fillRect(ix, barY, iw * 0.72, Math.max(2, 2.2 * scale));
    ctx.fillRect(ix, barY + Math.max(3.5, 4 * scale), iw * 0.44, Math.max(1.8, 2 * scale));
    return;
  }

  // mobile: 移动应用数据看板
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = COLORS.inkMuted;
  ctx.font = `600 ${Math.max(9, Math.round(9.5 * scale))}px "Noto Sans SC", sans-serif`;
  ctx.fillText(mod.mobLbl, ix, iy);

  ctx.fillStyle = COLORS.red;
  ctx.fillRect(ix + iw - Math.max(6, 7 * scale), iy + 1, Math.max(5, 6 * scale), Math.max(5, 6 * scale));

  ctx.fillStyle = COLORS.ink;
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.max(12, Math.round(17 * scale))}px "DM Mono", monospace`;
  ctx.fillText(mod.mobVal, ix, iy + ih * 0.56);

  // 底部迷你进度条
  const progY = iy + ih - Math.max(4, 4.5 * scale);
  const progH = Math.max(2.5, 3 * scale);
  ctx.fillStyle = "#DFD7CC";
  ctx.fillRect(ix, progY, iw, progH);
  ctx.fillStyle = card.spanBug || card.drifted ? COLORS.redErr : COLORS.red;
  ctx.fillRect(ix, progY, iw * (0.35 + ((card.slot * 17) % 55) / 100), progH);
}

function drawPill(ctx, cx, cy, text, bg, fg, scale) {
  ctx.save();
  ctx.font = `600 ${Math.max(10, Math.round(10.5 * scale))}px "DM Mono", "Noto Sans SC", sans-serif`;
  const tw = ctx.measureText(text).width;
  const px = Math.max(7, 8 * scale);
  const py = Math.max(4, 4.5 * scale);
  const bw = tw + px * 2;
  const bh = Math.max(18, 20 * scale);
  ctx.fillStyle = bg;
  ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 0.5);
  ctx.restore();
  return { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh };
}

export function mountHeroCanvas(canvas, getState, onMutate) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let cssW = 680;
  let cssH = 470;
  let dpr = 1;
  let hover = null; // { kind: "vgutter"|"hgutter"|"card", index? }
  let drag = null;  // { mode: "gx"|"gy"|"pending", pointerId, startX, startY, startGx, startGy, moved }
  let hitLayout = null;
  let pillXRect = null;
  let pillYRect = null;
  let intro = 0;
  let dirty = true;
  let lastStateSig = "";

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return false;
    dpr = pixelRatio(rect.width <= 520 ? 1.5 : 2);
    cssW = rect.width;
    cssH = rect.height;
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      return true;
    }
    return false;
  }

  function render(t, dt, { still }) {
    const resized = resize();
    const state = getState();
    const sig = `${state.theme}|${state.baseX}|${state.gx}|${state.gy}|${state.innerPad}|${state.lockXY}|${state.driftedSlot}|${state.spanMode}|${state.showGuides}|${drag?.mode || ""}|${hover?.kind || ""}:${hover?.slot ?? ""}`;
    if (sig !== lastStateSig) {
      lastStateSig = sig;
      dirty = true;
    }
    if (resized) dirty = true;

    const animating = !still && intro < 1;
    if (!dirty && !animating) return;

    if (still) {
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 1.45);
    }
    dirty = false;
    // 平滑缓出开场（第 0.9s 已达 100% 完整清晰，中途每帧也完整可读）
    const ease = 1 - Math.pow(1 - intro, 3);

    const layout = computeLayout(state, cssW, cssH);
    const diag = diagnose(state);
    hitLayout = layout;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. 暖米宣纸底面
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, cssW, cssH);

    const { board, vGutters, hGutters, anchors, cards, scale, gxPx, gyPx } = layout;

    // 2. 沟道半透明朱红标尺带（拖动中或开启辅助标尺时清晰呈现）
    if (state.showGuides || drag) {
      const bandAlpha = drag ? 0.24 : 0.13;
      const vxColor = !diag.checks.axis ? `rgba(179, 29, 29, ${bandAlpha})` : `rgba(243, 85, 43, ${bandAlpha * 0.85})`;
      const hyColor = !diag.checks.axis ? `rgba(243, 85, 43, ${bandAlpha * 0.9})` : `rgba(243, 85, 43, ${bandAlpha * 0.85})`;

      ctx.fillStyle = vxColor;
      for (const vg of vGutters) {
        if (vg.w > 0.5) ctx.fillRect(vg.x, vg.y, vg.w, vg.h * ease);
      }
      ctx.fillStyle = hyColor;
      for (const hg of hGutters) {
        if (hg.h > 0.5) ctx.fillRect(hg.x, hg.y, hg.w * ease, hg.h);
      }

      // 交叉点小方格高亮（展示 gx × gy 是否成正方形）
      for (const vg of vGutters) {
        for (const hg of hGutters) {
          if (vg.w > 1 && hg.h > 1) {
            ctx.fillStyle = diag.checks.axis ? "rgba(22, 104, 82, 0.24)" : "rgba(179, 29, 29, 0.30)";
            ctx.fillRect(vg.x, hg.y, vg.w, hg.h);
          }
        }
      }
    }

    // 3. 复刻 202 原海报四边与内沟道的精细坐标轨（合并为单次路径描边，兼顾软件渲染极速 60fps）
    ctx.save();
    ctx.strokeStyle = "#C3BAAE";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const overshoot = Math.max(8, 11 * scale);
    ctx.beginPath();
    for (const ce of layout.colEdges) {
      const lx = Math.round(ce.x) + 0.5;
      const rx = Math.round(ce.right) + 0.5;
      ctx.moveTo(lx, board.y - overshoot);
      ctx.lineTo(lx, board.y + board.h * ease + overshoot);
      ctx.moveTo(rx, board.y - overshoot);
      ctx.lineTo(rx, board.y + board.h * ease + overshoot);
    }
    for (const re of layout.rowEdges) {
      const ty = Math.round(re.y) + 0.5;
      const by = Math.round(re.bottom) + 0.5;
      ctx.moveTo(board.x - overshoot, ty);
      ctx.lineTo(board.x + board.w * ease + overshoot, ty);
      ctx.moveTo(board.x - overshoot, by);
      ctx.lineTo(board.x + board.w * ease + overshoot, by);
    }
    ctx.stroke();
    ctx.restore();

    // 4. 绘制 12 模块（或 11 含跨列主卡）
    for (const card of cards) {
      // 如果偏格，先在原正确轨位画红色虚线影盒
      if (card.drifted) {
        ctx.save();
        ctx.fillStyle = "rgba(179, 29, 29, 0.06)";
        ctx.fillRect(card.idealX, card.idealY, card.idealW, card.idealH);
        ctx.strokeStyle = COLORS.redErr;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(card.idealX + 0.5, card.idealY + 0.5, card.idealW - 1, card.idealH - 1);
        ctx.restore();
      }

      // 跨列漏算 1X 缝隙时，解析法直接画警示斜线（不调 ctx.clip() 避免软件渲染模板缓冲停顿）
      if (card.spanBug && card.spanDeficitPx > 1) {
        const dx = card.x + card.w;
        const dw = card.spanDeficitPx;
        const dy = card.y;
        const dh = card.h;
        ctx.fillStyle = COLORS.redErrSoft;
        ctx.fillRect(dx, dy, dw, dh);
        ctx.strokeStyle = COLORS.redErr;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(Math.round(dx) + 0.5, Math.round(dy) + 0.5, Math.round(dw) - 1, Math.round(dh) - 1);
        ctx.strokeStyle = "rgba(179, 29, 29, 0.42)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let s = 6; s < dw + dh; s += 9) {
          const x1 = dx + Math.max(0, s - dh);
          const y1 = dy + Math.min(dh, s);
          const x2 = dx + Math.min(dw, s);
          const y2 = dy + Math.max(0, s - dw);
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.stroke();
      }

      // 卡片主体（0px 锐利瑞士直角）
      ctx.save();
      ctx.fillStyle = card.drifted || card.spanBug ? "#FFF6F3" : COLORS.cardBg;
      ctx.fillRect(card.x, card.y, card.w, card.h);

      const isHoverCard = hover && hover.kind === "card" && hover.slot === card.slot;
      ctx.strokeStyle = card.drifted || card.spanBug
        ? COLORS.redErr
        : isHoverCard
          ? COLORS.ink
          : COLORS.cardStroke;
      ctx.lineWidth = card.drifted || card.spanBug ? 1.6 : isHoverCard ? 1.4 : 1;
      if (card.drifted) ctx.setLineDash([5, 3]);
      ctx.strokeRect(Math.round(card.x) + 0.5, Math.round(card.y) + 0.5, Math.round(card.w) - 1, Math.round(card.h) - 1);
      ctx.restore();

      drawCardContent(ctx, card, state.theme, layout.innerPx, scale, diag);
    }

    // 5. 20 枚原海报标志朱红小方锚点（标定所有交叉与外缘节点）
    const anchorSize = Math.max(4, Math.round(5.4 * scale));
    const halfA = anchorSize / 2;
    for (const a of anchors) {
      ctx.fillStyle = diag.ok ? COLORS.ok : COLORS.red;
      ctx.fillRect(Math.round(a.x - halfA), Math.round(a.y - halfA), anchorSize, anchorSize);
    }

    // 6. 顶层浮标统一绘制（全部盖在卡片与锚点之上，窄屏自动紧凑措辞，永不被后续卡片遮挡）
    const compactCanvas = cssW < 520;
    for (const card of cards) {
      if (card.drifted) {
        drawPill(
          ctx,
          card.x + card.w / 2,
          card.y + Math.max(10, 11 * scale),
          compactCanvas ? "偏格·点归位" : "偏格 +10px · 点归位",
          COLORS.redErr,
          "#FAF6F0",
          compactCanvas ? scale * 0.92 : scale * 0.88
        );
      } else if (card.spanBug) {
        drawPill(
          ctx,
          card.x + card.w / 2,
          card.y + Math.max(10, 11 * scale),
          compactCanvas ? `漏 ${state.gx}px·点补` : `漏算 ${state.gx}px 缝 · 点补齐`,
          COLORS.redErr,
          "#FAF6F0",
          compactCanvas ? scale * 0.92 : scale * 0.88
        );
      }
    }

    // 7. 顶边列距双箭标尺与拖拽手把胶囊
    if (vGutters.length > 1) {
      const midV = vGutters[1]; // 中央竖向主沟道
      const topY = Math.max(12, board.y - Math.max(8, 11 * scale));
      ctx.save();
      ctx.strokeStyle = diag.checks.axis ? COLORS.ok : COLORS.redInk;
      ctx.lineWidth = 1.25;
      if (midV.w >= 4) {
        ctx.beginPath();
        ctx.moveTo(midV.x, topY);
        ctx.lineTo(midV.x + midV.w, topY);
        ctx.stroke();
      }
      ctx.fillStyle = diag.checks.axis ? COLORS.ok : COLORS.redInk;
      ctx.font = `600 ${Math.max(10, Math.round(10 * scale))}px "DM Mono", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`gx ${state.gx}px`, midV.cx, topY - 2);
      ctx.restore();

      const activeGx = drag?.mode === "gx" || hover?.kind === "vgutter";
      pillXRect = drawPill(
        ctx,
        midV.cx,
        board.y + board.h * 0.5,
        compactCanvas ? `↔ ${state.gx}px` : `↔ 列距 ${state.gx}px`,
        activeGx ? COLORS.ink : diag.checks.axis ? COLORS.ok : COLORS.red,
        "#FAF6F0",
        compactCanvas ? Math.max(0.86, scale) : scale
      );
    }

    if (hGutters.length > 0) {
      const topH = hGutters[0];
      const activeGy = drag?.mode === "gy" || hover?.kind === "hgutter";
      pillYRect = drawPill(
        ctx,
        board.x + board.w * (compactCanvas ? 0.87 : 0.86),
        topH.cy,
        compactCanvas ? `↕ ${state.gy}px` : `↕ 行距 ${state.gy}px`,
        activeGy ? COLORS.ink : diag.checks.axis ? COLORS.ok : COLORS.ink,
        "#FAF6F0",
        compactCanvas ? Math.max(0.84, scale * 0.96) : scale * 0.92
      );
    }

    ctx.restore();
  }

  const ticker = loop(canvas, render);

  // 坐标命中辅助
  function ptFromEvent(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  const inRect = (p, rc, pad = 6) => rc && p.x >= rc.x - pad && p.x <= rc.x + rc.w + pad && p.y >= rc.y - pad && p.y <= rc.y + rc.h + pad;

  function hitTest(p) {
    if (!hitLayout) return null;
    if (inRect(p, pillXRect, 10)) return { kind: "vgutter" };
    if (inRect(p, pillYRect, 10)) return { kind: "hgutter" };

    // 优先命中问题卡（偏格或跨缝缺口卡）
    for (const c of hitLayout.cards) {
      if ((c.drifted || c.spanBug) && p.x >= c.x && p.x <= c.x + c.w + c.spanDeficitPx && p.y >= c.y && p.y <= c.y + c.h) {
        return { kind: "card", slot: c.slot, priority: true };
      }
    }
    // 命中任意竖向沟道
    for (const vg of hitLayout.vGutters) {
      const hitPad = Math.max(6, (18 - vg.w) / 2);
      if (p.x >= vg.x - hitPad && p.x <= vg.x + vg.w + hitPad && p.y >= vg.y && p.y <= vg.y + vg.h) {
        return { kind: "vgutter" };
      }
    }
    // 命中任意横向沟道
    for (const hg of hitLayout.hGutters) {
      const hitPad = Math.max(6, (18 - hg.h) / 2);
      if (p.y >= hg.y - hitPad && p.y <= hg.y + hg.h + hitPad && p.x >= hg.x && p.x <= hg.x + hg.w) {
        return { kind: "hgutter" };
      }
    }
    // 命中普通卡片
    for (const c of hitLayout.cards) {
      if (p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h) {
        return { kind: "card", slot: c.slot };
      }
    }
    return { kind: "vgutter" };
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
    const p = ptFromEvent(e);
    const hit = hitTest(p);
    const st = getState();
    drag = {
      pointerId: e.pointerId,
      startX: p.x,
      startY: p.y,
      startGx: st.gx,
      startGy: st.gy,
      hit,
      mode: hit?.kind === "hgutter" ? "gy" : "pending",
      moved: false,
    };
    if (e.pointerType !== "touch" || hit?.kind === "hgutter") {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  }

  function onPointerMove(e) {
    const p = ptFromEvent(e);
    if (!drag || drag.pointerId !== e.pointerId) {
      const h = hitTest(p);
      hover = h;
      if (h?.kind === "vgutter") canvas.style.cursor = "ew-resize";
      else if (h?.kind === "hgutter") canvas.style.cursor = "ns-resize";
      else if (h?.kind === "card") canvas.style.cursor = "pointer";
      else canvas.style.cursor = "ew-resize";
      return;
    }

    const dx = p.x - drag.startX;
    const dy = p.y - drag.startY;
    const dist = Math.hypot(dx, dy);

    if (drag.mode === "pending") {
      if (dist < 4) return;
      // 触屏下如果是明显竖向滑动且没点在行距柄上，放行浏览器滚动页面
      if (e.pointerType === "touch" && Math.abs(dy) > Math.abs(dx) * 1.25) {
        drag = null;
        return;
      }
      drag.mode = Math.abs(dy) > Math.abs(dx) * 1.35 && drag.hit?.kind !== "vgutter" ? "gy" : "gx";
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }

    drag.moved = true;
    const st = getState();
    const scale = hitLayout ? hitLayout.scale : 1;

    if (drag.mode === "gx") {
      // 横向拖拽调列距 gx（锁定时同步调 gy；数值未变时不重复触发布局与 DOM 更新）
      const deltaPx = (dx / Math.max(0.45, scale)) * 0.45;
      const nextGx = snapGutter(drag.startGx + deltaPx, st.baseX, st.lockXY ? null : st.gy);
      if (st.lockXY) {
        if (nextGx !== st.gx || nextGx !== st.gy) onMutate({ gx: nextGx, gy: nextGx });
      } else if (nextGx !== st.gx) {
        onMutate({ gx: nextGx });
      }
    } else if (drag.mode === "gy") {
      const deltaPx = (dy / Math.max(0.45, scale)) * 0.48;
      const nextGy = snapGutter(drag.startGy + deltaPx, st.baseX, st.lockXY ? null : st.gx);
      if (st.lockXY) {
        if (nextGy !== st.gx || nextGy !== st.gy) onMutate({ gx: nextGy, gy: nextGy });
      } else if (nextGy !== st.gy) {
        onMutate({ gy: nextGy });
      }
    }
    dirty = true;
  }

  function onPointerUp(e) {
    if (!drag || drag.pointerId !== e.pointerId) return;
    const wasMoved = drag.moved;
    const hit = drag.hit;
    drag = null;

    if (!wasMoved && hit?.kind === "card") {
      const st = getState();
      if (hit.slot === st.driftedSlot) {
        onMutate({ driftedSlot: -1 });
      } else if (hit.slot === 8 && st.spanMode === "bug") {
        onMutate({ spanMode: "valid" });
      } else if (hit.slot === 8 && st.spanMode === "valid") {
        onMutate({ spanMode: "none" });
      } else if (hit.slot === 8 && st.spanMode === "none") {
        onMutate({ spanMode: "valid" });
      } else {
        onMutate({ driftedSlot: hit.slot });
      }
    }
    dirty = true;
  }

  function onKeyDown(e) {
    const st = getState();
    const step = e.shiftKey ? st.baseX : 2;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = clamp(st.gx + dir * step, 0, 48);
      onMutate(st.lockXY ? { gx: next, gy: next } : { gx: next });
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const dir = e.key === "ArrowUp" ? 1 : -1;
      const next = clamp(st.gy + dir * step, 0, 48);
      onMutate(st.lockXY ? { gx: next, gy: next } : { gy: next });
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (st.driftedSlot !== -1) onMutate({ driftedSlot: -1 });
      else if (st.spanMode === "bug") onMutate({ spanMode: "valid" });
      else onMutate({ lockXY: !st.lockXY, gy: !st.lockXY ? st.gx : st.gy });
    }
    dirty = true;
  }

  // 额外监听 touch 事件（仅在 pointer 未接管时兜底）
  let touchDrag = null;
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const t0 = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const st = getState();
    touchDrag = {
      x0: t0.clientX - r.left,
      y0: t0.clientY - r.top,
      gx0: st.gx,
      gy0: st.gy,
      horiz: false,
    };
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (drag || !touchDrag || !e.touches.length) return;
    const t0 = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const dx = (t0.clientX - r.left) - touchDrag.x0;
    const dy = (t0.clientY - r.top) - touchDrag.y0;
    if (!touchDrag.horiz) {
      if (Math.hypot(dx, dy) < 4) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.2) {
        touchDrag = null;
        return;
      }
      touchDrag.horiz = true;
    }
    const st = getState();
    const scale = hitLayout ? hitLayout.scale : 1;
    const deltaPx = (dx / Math.max(0.45, scale)) * 0.45;
    const nextGx = snapGutter(touchDrag.gx0 + deltaPx, st.baseX, st.lockXY ? null : st.gy);
    if (st.lockXY) {
      if (nextGx !== st.gx || nextGx !== st.gy) onMutate({ gx: nextGx, gy: nextGx });
    } else if (nextGx !== st.gx) {
      onMutate({ gx: nextGx });
    }
    dirty = true;
  }, { passive: true });

  canvas.addEventListener("touchend", () => { touchDrag = null; dirty = true; }, { passive: true });
  canvas.addEventListener("touchcancel", () => { touchDrag = null; dirty = true; }, { passive: true });

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", () => { drag = null; dirty = true; });
  canvas.addEventListener("pointerleave", () => { if (!drag) { hover = null; dirty = true; } });
  canvas.addEventListener("keydown", onKeyDown);

  const ro = new ResizeObserver(() => {
    dirty = true;
    ticker.draw();
  });
  ro.observe(canvas);

  return {
    draw: (immediate = false) => {
      dirty = true;
      if (immediate) ticker.draw();
    },
  };
}

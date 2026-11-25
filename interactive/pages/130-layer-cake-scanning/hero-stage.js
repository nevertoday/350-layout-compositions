// 130 层蛋糕扫描模式 · 开场 2D Canvas 千层剖面切片台
// 1:1 承袭 130 原海报深靛紫底面、左缘五层珊瑚虚箭梯、奶油→浅杏→珊瑚橘→蜜桃→奶油横切层与眼动横带光束。
// 零 shadowBlur 轻量绘制，确保慢手机 6× CPU 与 SwiftShader 软件渲染仍稳 ≥ 50 帧。

import { loop, pixelRatio } from "../../lib/stage.js";
import { clamp, computeLayout, evaluate } from "./model.js";

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function fitText(ctx, text, maxW) {
  if (maxW <= 16) return "";
  if (ctx.measureText(text).width <= maxW) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ctx.measureText(text.slice(0, mid) + "…").width <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, Math.max(1, lo)) + "…";
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixHex(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function wrapLines(ctx, text, maxW, maxLines) {
  const lines = [];
  let line = "";
  const noLead = /^[。，、；：！？）》」』]/;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ctx.measureText(line + ch).width > maxW && line) {
      // 避免把孤立标点折到下一行开头
      if (noLead.test(ch) && i === text.length - 1) {
        line += ch;
        continue;
      }
      lines.push(line);
      line = ch;
      if (lines.length === maxLines - 1) break;
    } else {
      line += ch;
    }
  }
  if (lines.length < maxLines && line) {
    const restStart = lines.join("").length;
    const rem = text.slice(restStart);
    lines.push(fitText(ctx, rem, maxW));
  }
  return lines;
}

export function mountHeroStage(canvas, getState, onStateChange, onEvaluation) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let cssW = 720;
  let cssH = 440;
  let dpr = 1;
  let visualSep = getState().separation;
  let lastLayout = null;
  let lastEval = null;
  let hoverIdx = -1;
  let dragInfo = null;
  let lastNotifiedKey = "";

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(280, Math.round(rect.width));
    cssH = Math.max(260, Math.round(rect.height));
    dpr = pixelRatio(window.innerWidth < 520 ? 1.5 : 2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  function syncEval(state, layout) {
    const res = evaluate(state, layout);
    lastLayout = layout;
    lastEval = res;
    const key = [
      state.theme,
      Math.round(state.separation),
      state.headingMode,
      state.rhythm,
      state.order.join(","),
      state.expandedKey || "",
      state.viewMode,
      layout.overflowPx,
      layout.sizeRatio,
    ].join("|");
    if (key !== lastNotifiedKey) {
      lastNotifiedKey = key;
      onEvaluation(res, layout);
    }
    return res;
  }

  function drawFrame(t, dt, { still }) {
    resize();
    const state = getState();
    const targetSep = state.separation;
    if (still || dragInfo) {
      visualSep = targetSep;
    } else {
      const k = 1 - Math.exp(-14 * Math.max(0.008, dt || 0.016));
      visualSep += (targetSep - visualSep) * k;
      if (Math.abs(targetSep - visualSep) < 0.08) visualSep = targetSep;
    }

    const renderState = { ...state, separation: visualSep };
    const layout = computeLayout(renderState, cssW, cssH);
    const ev = syncEval(state, computeLayout(state, cssW, cssH));

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 深靛紫底面（忠实 130 原海报 #11082D）
    ctx.fillStyle = "#11082D";
    ctx.fillRect(0, 0, cssW, cssH);

    // 2. 顶部极简扫读任务与切层标尺眉
    drawTopBar(ctx, layout, ev, state, visualSep);

    // 3. 左缘 130 原海报五层阶梯标签与珊瑚虚线向下箭头
    drawLadder(ctx, layout, state);

    // 4. 五层横切蛋糕主条带（含实绘排印与原海报装饰色块语言）
    drawCakeLayers(ctx, layout, ev, state, visualSep, hoverIdx);

    // 5. 实时眼动扫描光带（由 model.js 单真源 gazeSteps 驱动）
    if (state.viewMode === "gaze") {
      drawGazeOverlay(ctx, layout, ev, t, still);
    }

    // 6. 底部极细实时切层比例标尺轨（提示左右横拖）
    drawBottomRuler(ctx, layout, visualSep, ev);

    ctx.restore();
  }

  function drawTopBar(ctx, layout, ev, state, visualSep) {
    const compact = layout.compact;
    const shortH = cssH < 320;
    const y = shortH ? 15 : compact ? 20 : 22;

    // 左侧任务点 + 任务文案
    ctx.fillStyle = ev.isValid ? "#6EE0B2" : "#FF8468";
    ctx.beginPath();
    ctx.arc(14, y - 1, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `600 ${shortH ? 11 : compact ? 11 : 12.5}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "#FEEEDD";
    ctx.textBaseline = "middle";
    const taskMaxW = cssW - (compact ? 118 : 210);
    ctx.fillText(fitText(ctx, layout.theme.taskPrompt, taskMaxW), 24, y);

    // 右侧单真源切层读数
    const pillText = compact || shortH
      ? `${Math.round(visualSep)}% · ${ev.metrics.sizeRatio}`
      : `切层 ${Math.round(visualSep)}% · 字比 ${ev.metrics.sizeRatio} · 缝 ${layout.gapPx}px`;
    ctx.font = `500 ${compact || shortH ? 10.5 : 11.5}px "IBM Plex Mono", "Noto Sans SC", monospace`;
    const tw = ctx.measureText(pillText).width;
    const pw = tw + 14;
    const px = cssW - pw - 10;
    const py = y - 10;
    roundRectPath(ctx, px, py, pw, 20, 4);
    ctx.fillStyle = ev.isValid ? "rgba(110, 224, 178, 0.14)" : "rgba(255, 132, 104, 0.15)";
    ctx.fill();
    ctx.strokeStyle = ev.isValid ? "rgba(110, 224, 178, 0.45)" : "rgba(255, 132, 104, 0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = ev.isValid ? "#8CF0C5" : "#FFB29F";
    ctx.fillText(pillText, px + 7, y);
  }

  function drawLadder(ctx, layout, state) {
    const compact = layout.compact;
    const shortH = cssH < 320;
    const cx = compact ? 31 : shortH ? 40 : 52;
    const isDense8 = state.rhythm === "dense8";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < layout.layers.length; i++) {
      const l = layout.layers[i];
      if (l.y > cssH - 24) break;
      const cy = Math.min(cssH - 28, l.ladderCenterY);

      if (isDense8) {
        ctx.font = `600 ${compact ? 10 : 11}px "IBM Plex Mono", "Noto Sans SC", monospace`;
        ctx.fillStyle = "#D8CEE8";
        ctx.fillText(`0${i + 1}`, cx, cy);
      } else if (shortH) {
        ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = l.isTarget && state.headingMode === "clear" ? "#FF9C82" : "#FEEEDD";
        ctx.fillText(l.roleLabel, cx, cy);
      } else {
        // 忠实复刻 130 原海报左缘双行：「第一层 / 抓住大意」
        ctx.font = `700 ${compact ? 10.5 : 12.5}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = l.isTarget && state.headingMode === "clear" ? "#FF9C82" : "#FEEEDD";
        ctx.fillText(l.slotName, cx, cy - (compact ? 6.5 : 8));

        ctx.font = `400 ${compact ? 10 : 11.5}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = "#C7BDDD";
        ctx.fillText(l.roleLabel, cx, cy + (compact ? 6.5 : 8));
      }

      // 层间珊瑚虚线向下箭头（完全承袭原海报）
      if (i < layout.layers.length - 1) {
        const next = layout.layers[i + 1];
        const margin = isDense8 || shortH ? 9 : compact ? 15 : 18;
        const y0 = cy + margin;
        const y1 = Math.min(cssH - 26, next.ladderCenterY - margin);
        if (y1 - y0 >= 8) {
          ctx.save();
          ctx.strokeStyle = "#F57865";
          ctx.lineWidth = 1.4;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(cx, y0);
          ctx.lineTo(cx, y1 - 3);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "#F57865";
          ctx.beginPath();
          ctx.moveTo(cx, y1 + 1);
          ctx.lineTo(cx - 3.5, y1 - 4.5);
          ctx.lineTo(cx + 3.5, y1 - 4.5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
    }
    ctx.textAlign = "left";
  }

  function drawCakeLayers(ctx, layout, ev, state, visualSep, hoverIndex) {
    const compact = layout.compact;
    const isCollapsed = visualSep < 36;
    const isAllBold = state.headingMode === "allbold";
    const cornerR = isCollapsed ? 2 : 7;

    // 糊墙塌陷时，给五层背后铺一层统一的奶油底，强化「黏成整块字墙」的直觉
    if (isCollapsed && layout.layers.length) {
      const first = layout.layers[0];
      const last = layout.layers[layout.layers.length - 1];
      const wallH = Math.min(cssH - layout.padBottom - first.y, last.y + last.h - first.y);
      roundRectPath(ctx, layout.cakeX, first.y, layout.cakeW, wallH, 4);
      ctx.fillStyle = "#EFE2CE";
      ctx.fill();
    }

    for (let i = 0; i < layout.layers.length; i++) {
      const l = layout.layers[i];
      if (l.y >= cssH - layout.padBottom) break;

      ctx.save();
      // 裁切在可见舞台内（断层过宽时忠实展现底缘被裁断）
      ctx.beginPath();
      ctx.rect(0, layout.padTop - 4, cssW, cssH - layout.padTop - layout.padBottom + 6);
      ctx.clip();

      const isHovered = i === hoverIndex;
      const isMisplacedAction = l.key === "action" && i < 4 && state.rhythm !== "dense8";
      const isSelected = i === state.selectedLayerIdx;

      // 层卡背景：连续混合原海报五阶暖色（糊墙时压淡仍有微弱五层底色，拉开后五层奶油→浅杏→珊瑚橘→蜜桃→奶油全面绽放）
      const colorMix = clamp((visualSep + 6) / 48, 0.34, 1);
      roundRectPath(ctx, l.x, l.y, l.w, l.h, cornerR);
      ctx.fillStyle = mixHex("#F1E4D1", l.palette.bg, colorMix);
      ctx.fill();

      // 糊墙时画极淡细分隔线模拟普通段落；拉开时给选中/展开/错位层加醒目边线
      if (isCollapsed) {
        ctx.strokeStyle = "rgba(18, 10, 47, 0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (isMisplacedAction) {
        ctx.strokeStyle = "#C92A1D";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (l.isExpanded || isHovered || isSelected) {
        ctx.strokeStyle = l.isExpanded ? "#FFFFFF" : "rgba(255, 255, 255, 0.65)";
        ctx.lineWidth = l.isExpanded ? 2 : 1.2;
        ctx.stroke();
      }

      // 左锚齐眉模式：左侧竖直深靛紫标尺条（体现另一种合法层蛋糕解）
      if (state.rhythm === "left" && !isCollapsed) {
        ctx.fillStyle = l.palette.bar;
        roundRectPath(ctx, l.x + 5, l.y + 6, 4, Math.max(10, l.h - 12), 2);
        ctx.fill();
      }

      // 原海报标志微装饰：第五层左侧圆勾、第四层左侧珊瑚方徽、第一层标题旁微色块
      let headStartX = l.headRect.x;
      if (!compact && !isCollapsed && state.rhythm !== "dense8") {
        if (l.key === "action") {
          const r = 10;
          const cx = headStartX + r;
          const cy = l.y + Math.min(l.h * 0.5, l.headRect.y - l.y + l.headingSize * 0.6);
          ctx.strokeStyle = "#120A2F";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - 4.5, cy + 0.5);
          ctx.lineTo(cx - 1.2, cy + 3.8);
          ctx.lineTo(cx + 5, cy - 3.5);
          ctx.stroke();
          headStartX += 28;
        } else if (l.key === "verify") {
          ctx.fillStyle = "#E04A2E";
          roundRectPath(ctx, headStartX, l.headRect.y + 2, 12, 12, 2);
          ctx.fill();
          headStartX += 18;
        }
      }

      // 绘制小标题行（真实字号 l.headingSize，体现标题驱动反差）
      const headWeight = isCollapsed ? 500 : 800;
      ctx.font = `${headWeight} ${l.headingSize}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "#11082D";
      ctx.textBaseline = "top";
      const ctrlReserve = state.rhythm === "dense8" ? 12 : (compact ? 58 : 88);
      const maxHeadW = Math.max(60, l.x + l.w - headStartX - ctrlReserve);
      const shownHead = fitText(ctx, l.headingText, maxHeadW);
      ctx.fillText(shownHead, headStartX, l.headRect.y);

      // 如果「行动越位」在非底层，在标题右侧盖醒目小红标
      if (isMisplacedAction && !compact) {
        const tag = "× 行动越位";
        ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
        const bw = ctx.measureText(tag).width + 12;
        const bx = l.x + l.w - bw - (l.upRect || l.downRect ? 66 : 10);
        const by = l.y + 6;
        roundRectPath(ctx, bx, by, bw, 19, 3);
        ctx.fillStyle = "#B82214";
        ctx.fill();
        ctx.fillStyle = "#FFF8F2";
        ctx.fillText(tag, bx + 6, by + 4);
      } else if (l.isTarget && ev.isValid && !compact) {
        const tag = "✓ 目标命中";
        ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
        const bw = ctx.measureText(tag).width + 12;
        const bx = l.x + l.w - bw - 66;
        const by = l.y + 6;
        roundRectPath(ctx, bx, by, bw, 19, 3);
        ctx.fillStyle = "#120A2F";
        ctx.fill();
        ctx.fillStyle = "#8CF0C5";
        ctx.fillText(tag, bx + 6, by + 4);
      }

      // 绘制正文奶油层（如果全篇满加粗，正文也会被涂成粗重深色块，直观演示反差塌陷）
      const bodyStartY = l.headRect.y + l.headingSize + Math.max(4, Math.round(visualSep * 0.08));
      const availBodyH = l.y + l.h - bodyStartY - 5;
      if (availBodyH >= 11) {
        const bodyText = l.isExpanded ? l.deepText : l.previewText;
        const bodyW = Math.max(70, l.x + l.w - headStartX - (compact ? 14 : 24));
        const maxLines = l.isExpanded ? 3 : availBodyH > 26 ? 2 : 1;

        if (isAllBold) {
          // 满屏高喊错态：正文行自带深色高对比底条与粗字，与标题抢眼
          ctx.font = `800 ${l.bodySize + 0.5}px "Noto Sans SC", sans-serif`;
          const lines = wrapLines(ctx, bodyText, bodyW - 10, maxLines);
          lines.forEach((ln, idx) => {
            const ly = bodyStartY + idx * (l.bodySize + 5);
            const lw = Math.min(bodyW, ctx.measureText(ln).width + 10);
            ctx.fillStyle = "rgba(18, 10, 47, 0.85)";
            ctx.fillRect(headStartX - 2, ly - 1, lw, l.bodySize + 3);
            ctx.fillStyle = "#FFE6B8";
            ctx.fillText(ln, headStartX + 3, ly);
          });
        } else {
          ctx.font = `400 ${l.bodySize}px "Noto Sans SC", sans-serif`;
          // 展开深读时正文对比拉高，未展开时安静退后作为「奶油留白」
          ctx.fillStyle = l.isExpanded ? "#150D33" : l.palette.line;
          const lines = wrapLines(ctx, bodyText, bodyW, maxLines);
          lines.forEach((ln, idx) => {
            const ly = bodyStartY + idx * (l.bodySize + 4.5);
            ctx.fillText(ln, headStartX, ly);
          });

          // 展开深读的目标层高亮命中答案
          if (l.isExpanded && l.hitText) {
            const badge = `答案：${l.hitText}`;
            ctx.font = `600 10.5px "Noto Sans SC", sans-serif`;
            const bw = Math.min(bodyW, ctx.measureText(badge).width + 14);
            const by = l.y + l.h - 22;
            roundRectPath(ctx, headStartX, by, bw, 17, 3);
            ctx.fillStyle = "#120A2F";
            ctx.fill();
            ctx.fillStyle = "#8CF0C5";
            ctx.fillText(fitText(ctx, badge, bw - 10), headStartX + 6, by + 3);
          }
        }
      }

      // 每层右上角极简 ↑/↓ 调序按钮（支持直接点按重排蛋糕五层）
      if (!isCollapsed || !compact) {
        drawOrderBtn(ctx, l.upRect, "↑");
        drawOrderBtn(ctx, l.downRect, "↓");
      }

      ctx.restore();
    }
  }

  function drawOrderBtn(ctx, rect, glyph) {
    if (!rect) return;
    roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 4);
    ctx.fillStyle = "rgba(17, 8, 45, 0.14)";
    ctx.fill();
    ctx.strokeStyle = "rgba(17, 8, 45, 0.34)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = `700 11px "IBM Plex Mono", sans-serif`;
    ctx.fillStyle = "#11082D";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, rect.x + rect.w * 0.5, rect.y + rect.h * 0.52);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }

  function drawGazeOverlay(ctx, layout, ev, t, still) {
    const steps = ev.gazeSteps;
    if (!steps.length) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(layout.cakeX - 6, layout.padTop - 2, layout.cakeW + 12, cssH - layout.padTop - layout.padBottom + 4);
    ctx.clip();

    const cycle = 3.8;
    const prog = still ? 1 : (t % cycle) / cycle;
    const total = steps.length;
    const activeFloat = prog * total;

    const ptOf = (s) => {
      const oy = s.kind === "f-stem" ? 0 : Math.round(layout.headingSize * 0.45 + 2);
      return {
        x0: s.kind === "f-stem" ? s.x0 - 8 : s.x0,
        y0: s.y0 + oy,
        x1: s.kind === "f-stem" ? s.x1 - 8 : s.x1,
        y1: s.y1 + (s.kind === "f-stem" ? 0 : oy),
      };
    };

    // 先画跨层虚线跳读连线（展示眼睛如何跳过奶油正文，严格对齐注视横带端点）
    ctx.strokeStyle = ev.isValid ? "rgba(17, 8, 45, 0.42)" : "rgba(196, 40, 24, 0.52)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i < steps.length - 1; i++) {
      const a = ptOf(steps[i]);
      const b = ptOf(steps[i + 1]);
      ctx.beginPath();
      ctx.moveTo(a.x1, a.y1);
      ctx.lineTo(b.x0, b.y0);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 再画每一段眼动注视横带
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const segP = still ? 1 : clamp(activeFloat - i, 0, 1);

      if (s.kind === "spot") {
        // 斑点噪声圈
        ctx.fillStyle = "rgba(214, 46, 30, 0.22)";
        ctx.beginPath();
        ctx.arc(s.x0, s.y0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#C92A1D";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(s.x0, s.y0, 6, 0, Math.PI * 2);
        ctx.stroke();
        continue;
      }

      const isFaultStroke = s.kind === "f-bar" || s.kind === "f-stem" || s.kind === "dig";
      const isHit = s.kind === "stripe-hit" || s.kind === "drill";
      const bandColor = isFaultStroke
        ? "rgba(205, 42, 26, 0.30)"
        : isHit
          ? "rgba(21, 99, 72, 0.28)"
          : "rgba(224, 74, 46, 0.26)";
      const coreColor = isFaultStroke
        ? "#C8291B"
        : isHit
          ? "#116648"
          : "#E04A2E";

      // 底层注视热力横带（紧贴标题下缘导轨，绝不糊住汉字笔画）
      const offsetY = s.kind === "f-stem" ? 0 : Math.round(layout.headingSize * 0.45 + 2);
      const sy0 = s.y0 + offsetY;
      const sy1 = s.y1 + (s.kind === "f-stem" ? 0 : offsetY);
      const sx0 = s.kind === "f-stem" ? s.x0 - 8 : s.x0;
      const sx1 = s.kind === "f-stem" ? s.x1 - 8 : s.x1;

      ctx.lineCap = "round";
      ctx.strokeStyle = bandColor;
      ctx.lineWidth = s.kind === "f-stem" ? 8 : isHit ? 9 : 7;
      ctx.beginPath();
      ctx.moveTo(sx0, sy0);
      ctx.lineTo(sx1, sy1);
      ctx.stroke();

      // 扫读前沿高亮线
      if (segP > 0) {
        const cx = sx0 + (sx1 - sx0) * segP;
        const cy = sy0 + (sy1 - sy0) * segP;
        ctx.strokeStyle = coreColor;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(sx0, sy0);
        ctx.lineTo(cx, cy);
        ctx.stroke();

        // 实时眼动注视光标圆点
        if (!still && segP < 0.99 && segP > 0.01) {
          ctx.fillStyle = "#11082D";
          ctx.beginPath();
          ctx.arc(cx, cy, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = isHit ? "#6EE0B2" : "#FF8468";
          ctx.beginPath();
          ctx.arc(cx, cy, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 起点标号小圆点
      ctx.fillStyle = coreColor;
      ctx.beginPath();
      ctx.arc(sx0, sy0, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawBottomRuler(ctx, layout, visualSep, ev) {
    const y = cssH - 11;
    const x0 = layout.cakeX;
    const w = layout.cakeW;

    // 底层细轨道
    ctx.fillStyle = "rgba(254, 238, 221, 0.14)";
    roundRectPath(ctx, x0, y - 2, w, 4, 2);
    ctx.fill();

    // 健康层蛋糕区间（44%–78%）淡松翠标带
    const g0 = x0 + w * 0.44;
    const g1 = x0 + w * 0.78;
    ctx.fillStyle = "rgba(110, 224, 178, 0.35)";
    ctx.fillRect(g0, y - 2, g1 - g0, 4);

    // 当前切层游标
    const knobX = x0 + (clamp(visualSep, 0, 100) / 100) * w;
    ctx.fillStyle = ev.isValid ? "#6EE0B2" : "#FF8468";
    ctx.beginPath();
    ctx.arc(knobX, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#11082D";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 极简左右端标签
    ctx.font = `500 10px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "#BEB5D1";
    ctx.textBaseline = "middle";
    ctx.fillText("↔ 横拖切层", 12, y);
  }

  // 坐标换算与命中测试
  function localPt(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function inRect(pt, r) {
    return r && pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h;
  }

  function handleLayerClick(pt) {
    if (!lastLayout) return;
    const state = getState();
    for (const l of lastLayout.layers) {
      if (inRect(pt, l.upRect)) {
        const next = [...state.order];
        [next[l.index - 1], next[l.index]] = [next[l.index], next[l.index - 1]];
        onStateChange({ order: next, selectedLayerIdx: l.index - 1 });
        return;
      }
      if (inRect(pt, l.downRect)) {
        const next = [...state.order];
        [next[l.index], next[l.index + 1]] = [next[l.index + 1], next[l.index]];
        onStateChange({ order: next, selectedLayerIdx: l.index + 1 });
        return;
      }
      if (pt.x >= l.x && pt.x <= l.x + l.w && pt.y >= l.y && pt.y <= l.y + l.h) {
        if (state.rhythm === "dense8") {
          onStateChange({ rhythm: "poster", selectedLayerIdx: l.index });
        } else {
          const nextExp = state.expandedKey === l.key ? null : l.key;
          onStateChange({ expandedKey: nextExp, selectedLayerIdx: l.index });
        }
        return;
      }
    }
  }

  // 统一 Pointer + Touch 横拖支持（与 tools/perf.mjs 的 Input.dispatchTouchEvent 100% 兼容）
  function startDrag(x, y, pointerId = null) {
    dragInfo = {
      startX: x,
      startY: y,
      startSep: getState().separation,
      moved: false,
      lockedHoriz: false,
      pointerId,
    };
  }

  function moveDrag(x, y) {
    if (!dragInfo) return false;
    const dx = x - dragInfo.startX;
    const dy = y - dragInfo.startY;
    if (!dragInfo.moved && Math.hypot(dx, dy) > 4) {
      dragInfo.moved = true;
      dragInfo.lockedHoriz = Math.abs(dx) >= Math.abs(dy) * 0.75;
    }
    if (dragInfo.lockedHoriz) {
      const span = Math.max(180, cssW * 0.62);
      const nextSep = clamp(Math.round(dragInfo.startSep + (dx / span) * 100), 0, 100);
      if (nextSep !== getState().separation) {
        onStateChange({ separation: nextSep });
      }
      return true;
    }
    return false;
  }

  function endDrag(pt) {
    if (!dragInfo) return;
    const wasClick = !dragInfo.moved;
    dragInfo = null;
    if (wasClick && pt) handleLayerClick(pt);
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏走原生 touch 事件以无缝配合纵向滚屏与 perf 探针
    const pt = localPt(e);
    startDrag(pt.x, pt.y, e.pointerId);
    canvas.setPointerCapture?.(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const pt = localPt(e);
    if (dragInfo) {
      moveDrag(pt.x, pt.y);
      return;
    }
    if (!lastLayout) return;
    let found = -1;
    for (const l of lastLayout.layers) {
      if (pt.x >= l.x && pt.x <= l.x + l.w && pt.y >= l.y && pt.y <= l.y + l.h) {
        found = l.index;
        break;
      }
    }
    if (found !== hoverIdx) {
      hoverIdx = found;
      canvas.style.cursor = found >= 0 ? "ew-resize" : "ew-resize";
    }
  });

  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    const pt = localPt(e);
    endDrag(pt);
  });

  canvas.addEventListener("pointercancel", () => {
    dragInfo = null;
  });

  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const pt = localPt(e);
    startDrag(pt.x, pt.y);
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!dragInfo || !e.touches.length) return;
    const pt = localPt(e);
    const locked = moveDrag(pt.x, pt.y);
    if (locked) e.preventDefault();
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    const t0 = e.changedTouches?.[0];
    const rect = canvas.getBoundingClientRect();
    const pt = t0 ? { x: t0.clientX - rect.left, y: t0.clientY - rect.top } : null;
    endDrag(pt);
  }, { passive: true });

  canvas.addEventListener("touchcancel", () => {
    dragInfo = null;
  }, { passive: true });

  // 键盘操作：←/→ 切层分离度，1-5 展开/收起层，R 复原初始错态
  canvas.addEventListener("keydown", (e) => {
    const state = getState();
    const step = e.shiftKey ? 10 : 4;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onStateChange({ separation: clamp(state.separation + step, 0, 100) });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onStateChange({ separation: clamp(state.separation - step, 0, 100) });
    } else if (/^[1-5]$/.test(e.key)) {
      const idx = Number(e.key) - 1;
      const key = state.order[idx];
      if (key) {
        e.preventDefault();
        onStateChange({ expandedKey: state.expandedKey === key ? null : key, selectedLayerIdx: idx });
      }
    } else if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      onStateChange({ reset: true });
    }
  });

  const handle = loop(canvas, drawFrame);
  window.addEventListener("resize", () => handle.draw());

  return {
    draw: () => handle.draw(),
  };
}

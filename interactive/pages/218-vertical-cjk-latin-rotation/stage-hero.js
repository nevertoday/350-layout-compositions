// 218 开场主角画布：直排铅字校样与 90° 朱红转向盘（2D Canvas, data-perf-drag）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { auditState, computeGeometry, normalizeAngle, snapAngle } from "./model.js";

const COLORS = {
  paper: "#FBF6EC",
  paperCard: "#FFFDF8",
  ink: "#0D0C0B",
  inkSoft: "#46413B",
  muted: "#91897D",
  dashed: "#C2BAB0",
  vermilion: "#EB4E1B",
  vermilionDark: "#B8320A",
  vermilionWash: "rgba(235, 78, 27, 0.12)",
  ok: "#166844",
  okWash: "rgba(22, 104, 68, 0.12)",
  err: "#B82914",
  errWash: "rgba(184, 41, 20, 0.13)",
};

// 绘制平滑垂直标点符号（保证在任意字库与旋转下都绝对清晰锐利）
function drawPunctuation(ctx, ch, cx, cy, em, mode, isHighlighted) {
  const isBracket = ch === "(" || ch === ")" || ch === "「" || ch === "」";
  const isPause = ch === "、" || ch === "。";
  const isDash = ch === "—";

  // 标点全身方框微线（仅在原形出错或节奏探针激活时显示，帮助看清居中 vs 右上 vs 左下）
  if (mode === "raw" || isHighlighted) {
    ctx.save();
    ctx.strokeStyle = mode === "raw" ? "rgba(184, 41, 20, 0.34)" : "rgba(22, 104, 68, 0.28)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(cx - em * 0.46, cy - em * 0.46, em * 0.92, em * 0.92);
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = mode === "raw" && (isBracket || isPause || isDash) ? COLORS.err : COLORS.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (ch === "•") {
    ctx.fillStyle = COLORS.vermilion;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(2.6, em * 0.12), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (mode === "raw") {
    // 故意呈现横排原形未转：括号横躺，顿号句号沉左下角，破折号横卧
    let ox = 0;
    let oy = 0;
    if (isPause) {
      ox = -em * 0.24;
      oy = em * 0.22;
    }
    ctx.font = `600 ${Math.round(em * 0.84)}px "Noto Serif SC", serif`;
    ctx.fillText(ch, cx + ox, cy + oy);
    ctx.restore();
    return;
  }

  // 竖排已转形：center（港台/原海报居中）或 topright（大陆/日文右上）
  if (isBracket || isDash) {
    // 括号与直角引号顺时针转 90° 即为标准竖排形态 ︵ ︶ ﹁ ﹂ ｜
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 2);
    ctx.font = `600 ${Math.round(em * 0.86)}px "Noto Serif SC", serif`;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    return;
  }

  let ox = 0;
  let oy = 0;
  if (isPause) {
    if (mode === "topright") {
      ox = em * 0.23;
      oy = -em * 0.22;
    } else {
      // 港台/原海报居中：抵消全角宋体本身自带的左下偏移，视觉精确居中
      ox = em * 0.22;
      oy = -em * 0.14;
    }
  }
  ctx.font = `600 ${Math.round(em * 0.84)}px "Noto Serif SC", serif`;
  ctx.fillText(ch, cx + ox, cy + oy);
  ctx.restore();
}

export function createHeroStage(canvas, getState, getAudit, onMutate, onResize) {
  const ctx = canvas.getContext("2d");
  let w = 800;
  let h = 520;
  let dpr = 1;
  let dirty = true;
  let intro = 0; // 0..1 温和入场，半路同样清晰完整
  let visualAngle = getState().latinAngle;
  let visualShift = getState().baselineShift;
  let visualScale = getState().latinScale;
  let flowPhase = 0;
  let hoverZone = null; // null | "dial" | "col2" | "col3" | "col4"
  let dragMode = null; // null | "dial" | "sweep"
  let dragStartX = 0;
  let dragStartAngle = 0;
  let dragMoved = false;

  // 离屏静态底图缓存：拖动旋转角时第 1、3、4 列与标尺不变，一次 drawImage 复用，软件渲染也稳跑 55–60 帧
  const staticCanvas = document.createElement("canvas");
  const sctx = staticCanvas.getContext("2d");
  let staticKey = "";

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    w = rect.width;
    h = rect.height;
    dpr = pixelRatio(w < 520 ? 1.5 : 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    staticCanvas.width = canvas.width;
    staticCanvas.height = canvas.height;
    staticKey = "";
    dirty = true;
  }

  function markDirty() {
    dirty = true;
    if (reducedMotion.matches) runner.draw();
  }

  function hitTest(px, py) {
    const state = getState();
    const g = computeGeometry(state, w, h);
    const distDial = Math.hypot(px - g.dial.cx, py - g.dial.cy);
    if (distDial <= g.dial.r * 1.24) return "dial";
    for (let i = 0; i < 4; i++) {
      const c = g.cols[i];
      if (px >= c.x && px <= c.x + c.w && py >= g.galley.y && py <= g.galley.y + g.galley.h) {
        return `col${i + 1}`;
      }
    }
    return "canvas";
  }

  function angleFromDial(px, py, g) {
    // 顶部 = 0°，顺时针右侧 = +90°，底部 = 180°，左侧 = -90°
    const rad = Math.atan2(px - g.dial.cx, -(py - g.dial.cy));
    return normalizeAngle((rad * 180) / Math.PI);
  }

  function drawFrame(t, dt, { still }) {
    const state = getState();
    if (still) {
      intro = 1;
      visualAngle = state.latinAngle;
      visualShift = state.baselineShift;
      visualScale = state.latinScale;
    } else {
      if (intro < 1) {
        intro = Math.min(1, intro + Math.max(dt, 0.016) * 2.4);
        dirty = true;
      }
      // 顺滑插值，保证拖动立即响应、按钮切换优雅过渡
      const k = Math.min(1, Math.max(dt, 0.016) * (dragMode ? 32 : 13));
      const dA = state.latinAngle - visualAngle;
      if (Math.abs(dA) > 0.08) {
        visualAngle += dA * k;
        dirty = true;
      } else {
        visualAngle = state.latinAngle;
      }
      const dS = state.baselineShift - visualShift;
      if (Math.abs(dS) > 0.05) {
        visualShift += dS * k;
        dirty = true;
      } else {
        visualShift = state.baselineShift;
      }
      const dSc = state.latinScale - visualScale;
      if (Math.abs(dSc) > 0.002) {
        visualScale += dSc * k;
        dirty = true;
      } else {
        visualScale = state.latinScale;
      }
      if (state.flowPlaying) {
        flowPhase = (flowPhase + Math.max(dt, 0.016) * 0.24) % 1;
        dirty = true;
      }
    }

    if (!dirty) return;
    dirty = false;

    const renderState = {
      ...state,
      latinAngle: visualAngle,
      baselineShift: visualShift,
      latinScale: visualScale,
    };
    const g = computeGeometry(renderState, w, h);
    const gLogical = computeGeometry(state, w, h);
    const audit = auditState(state, gLogical);

    // 1. 静态底图缓存（宣纸 + 列间虚线 + 第 1、3、4 列），只有离散状态或尺寸变化时重绘
    const col2Bad = !audit.isCw90 || !audit.probes.rhythm.pass || !audit.probes.hierarchy.pass;
    const col3Bad = state.numeralMode === "upright" || state.numeralMode === "ccw90";
    const col4Bad = state.punctMode === "raw";
    const nextStaticKey = `${w}|${h}|${dpr}|${state.specimen}|${state.numeralMode}|${state.punctMode}|${state.highlightProbe || ""}|${hoverZone || ""}|${col2Bad ? 1 : 0}|${col3Bad ? 1 : 0}|${col4Bad ? 1 : 0}|${intro < 1 ? intro.toFixed(2) : "1"}`;
    if (nextStaticKey !== staticKey) {
      staticKey = nextStaticKey;
      sctx.save();
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sctx.fillStyle = COLORS.paper;
      sctx.fillRect(0, 0, w, h);
      drawStaticGalley(sctx, g, renderState, audit, intro, hoverZone);
      sctx.restore();
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 一次拷贝全部静态层
    ctx.drawImage(staticCanvas, 0, 0, w, h);

    // 2. 顶部极轻微校样角标（仅大画布展示，避免 844×390 矮横屏撞到列头编号）
    if (!g.compact && !g.shortH) {
      ctx.save();
      ctx.font = `500 11px "DM Mono", "Noto Serif SC", monospace`;
      ctx.fillStyle = COLORS.muted;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        `ANGLE ${audit.metrics.angleText} · AXIS ${audit.metrics.axisText} · GAP ${audit.metrics.gutterText}`,
        14,
        12
      );
      ctx.restore();
    }

    // 3. 动态层：朱红 90° 分度转向盘 + 第 2 列活体西文
    drawDial(ctx, g, renderState, audit, intro, hoverZone === "dial" || dragMode === "dial");
    drawDynamicCol2(ctx, g, renderState, audit);

    // 4. 若正在演播阅读视线流，绘制朱红动线光珠
    if (state.flowPlaying && !still) {
      drawReadingBead(ctx, g, renderState, audit, flowPhase);
    }

    ctx.restore();
  }

  function drawDial(ctx, g, state, audit, ease, active) {
    const { cx, cy, r } = g.dial;
    const radAxis = r * 1.32;
    const scaleIn = 0.88 + 0.12 * ease;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scaleIn, scaleIn);

    // 外圈刻度环与 +90° 顺流靶区弧线
    ctx.save();
    ctx.strokeStyle = "rgba(13, 12, 11, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r + (g.compact ? 9 : 13), 0, Math.PI * 2);
    ctx.stroke();

    // 标出顺时针 +90° 目标扇区（右侧 0 rad 附近 ±5°）
    ctx.strokeStyle = audit.isCw90 ? COLORS.ok : COLORS.vermilionDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r + (g.compact ? 9 : 13), -0.14, 0.14);
    ctx.stroke();
    ctx.restore();

    // 巨幅朱红圆盘主体（原海报灵魂母题）
    ctx.fillStyle = COLORS.vermilion;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    if (active) {
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 旋转指示扇形（从 0° 顶部顺/逆扫到当前转角）
    const curRad = ((state.latinAngle - 90) * Math.PI) / 180;
    const topRad = -Math.PI / 2;
    ctx.save();
    ctx.fillStyle = audit.isCw90 ? "rgba(13, 12, 11, 0.14)" : "rgba(13, 12, 11, 0.24)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 0.98, topRad, curRad, state.latinAngle < 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 原海报标志性垂直与水平墨黑虚线十字轴（穿出红圆之外）
    ctx.save();
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, -radAxis);
    ctx.lineTo(0, radAxis);
    ctx.moveTo(-radAxis, 0);
    ctx.lineTo(radAxis, 0);
    ctx.stroke();
    ctx.restore();

    // 刻度标签（0° / +90° / -90°）：置于虚线端点外侧并垫宣纸底，绝不被虚线穿字或裁边
    ctx.save();
    const fz = g.compact || g.shortH ? 10 : 11;
    ctx.font = `500 ${fz}px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const drawDegLabel = (txt, lx, ly, col) => {
      const tw = ctx.measureText(txt).width + 6;
      ctx.fillStyle = COLORS.paper;
      ctx.fillRect(lx - tw / 2, ly - 7, tw, 14);
      ctx.fillStyle = col;
      ctx.fillText(txt, lx, ly + 0.5);
    };
    drawDegLabel("0°", 0, -radAxis - 9, COLORS.inkSoft);
    drawDegLabel("+90°", radAxis + 16, 0, audit.isCw90 ? COLORS.ok : COLORS.vermilionDark);
    drawDegLabel("-90°", -radAxis - 16, 0, audit.isCcw ? COLORS.err : COLORS.muted);
    ctx.restore();

    // 拨动指针与外缘拖拽圆柄
    const hx = Math.cos(curRad) * r;
    const hy = Math.sin(curRad) * r;
    ctx.save();
    ctx.strokeStyle = COLORS.paperCard;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(hx, hy);
    ctx.stroke();

    // 把手圆钮
    ctx.fillStyle = COLORS.paperCard;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(hx, hy, g.compact ? 6.5 : 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 中心墨黑圆心轴点 ●（原海报标志）
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath();
    ctx.arc(0, 0, g.compact ? 4.5 : 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 盘下实时读数签
    ctx.save();
    const labelY = radAxis + (g.compact ? 11 : 18);
    ctx.font = `600 ${g.compact ? 11 : 12}px "DM Mono", monospace`;
    ctx.fillStyle = audit.isCw90 ? COLORS.ok : COLORS.err;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    if (!g.compact) {
      ctx.fillText(`ROTATION ${audit.metrics.angleText}`, 0, labelY);
      ctx.font = `400 11px "Noto Serif SC", serif`;
      ctx.fillStyle = COLORS.inkSoft;
      ctx.fillText("拨转红盘或横拖画布", 0, labelY + 17);
    }
    ctx.restore();

    ctx.restore();

    // 窄屏下在红盘右侧排简洁说明，避开 +90° 标签零撞字
    if (g.compact) {
      const tx = cx + radAxis + 38;
      ctx.save();
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = `600 11.5px "DM Mono", "Noto Serif SC", monospace`;
      ctx.fillStyle = audit.isCw90 ? COLORS.ok : COLORS.err;
      ctx.fillText(`转向角 ${audit.metrics.angleText} · ${audit.isCw90 ? "顺流一致" : "方向冲突"}`, tx, cy - 26);
      ctx.font = `400 11.5px "Noto Serif SC", serif`;
      ctx.fillStyle = COLORS.inkSoft;
      ctx.fillText("横拖画布 / 拨红盘调转向", tx, cy - 6);
      ctx.fillText("点第 3、4 列切数字与标点", tx, cy + 13);
      ctx.restore();
    }
  }

  function drawStaticGalley(ctx, g, state, audit, ease, hover) {
    const { cols, galley, bodyTop, contentBottom, bodyBottom, bodyH, cjkEm, cjkStep, spec } = g;
    const probe = state.highlightProbe;

    // 1. 三条列间虚线分隔（严格复刻 218 原海报）
    ctx.save();
    ctx.strokeStyle = COLORS.dashed;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 1; i <= 3; i++) {
      const gx = galley.x + i * g.colW;
      ctx.beginPath();
      ctx.moveTo(gx, bodyTop - 10);
      ctx.lineTo(gx, bodyBottom + 4);
      ctx.stroke();
    }
    ctx.restore();

    // 2. 探针高亮底带（节奏中轴）
    if (probe === "rhythm") {
      ctx.save();
      ctx.strokeStyle = COLORS.vermilion;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      for (const c of cols) {
        ctx.beginPath();
        ctx.moveTo(c.cx, bodyTop);
        ctx.lineTo(c.cx, contentBottom);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. 原海报标志性朱红下行箭头（位于第 1 列左侧，展示中文下行阅读方向）
    const arrowX = cols[0].x - (g.compact ? 8 : 14);
    const arrowTop = bodyTop + 4;
    const arrowBot = bodyTop + bodyH * (0.3 + 0.68 * ease);
    ctx.save();
    ctx.strokeStyle = COLORS.vermilion;
    ctx.lineWidth = probe === "flow" ? 2.2 : 1.3;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowTop);
    ctx.lineTo(arrowX, arrowBot);
    ctx.moveTo(arrowX - 5, arrowBot - 7);
    ctx.lineTo(arrowX, arrowBot);
    ctx.lineTo(arrowX + 5, arrowBot - 7);
    ctx.stroke();
    ctx.restore();

    // 4. 列头黑圆编号 1 2 3 4 + 两行中文标签（原海报 1:1 结构）
    cols.forEach((c, idx) => {
      const tightHead = g.compact || g.shortH;
      const badgeY = galley.y + (tightHead ? 10 : 14);
      const badgeR = tightHead ? 9 : 11.5;
      const isInteractiveCol = idx === 2 || idx === 3;
      const isColBad =
        (idx === 1 && (!audit.isCw90 || !audit.probes.rhythm.pass || !audit.probes.hierarchy.pass)) ||
        (idx === 2 && !audit.probes.rotation.pass && (state.numeralMode === "upright" || state.numeralMode === "ccw90")) ||
        (idx === 3 && state.punctMode === "raw");

      if (isInteractiveCol && hover === `col${idx + 1}`) {
        ctx.save();
        ctx.fillStyle = "rgba(235, 78, 27, 0.07)";
        ctx.fillRect(c.x + 2, galley.y, c.w - 4, galley.h);
        ctx.restore();
      }

      ctx.save();
      ctx.fillStyle = isColBad ? COLORS.err : COLORS.ink;
      ctx.beginPath();
      ctx.arc(c.cx, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = COLORS.paperCard;
      ctx.font = `600 ${tightHead ? 10 : 12}px "Sora", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(idx + 1), c.cx, badgeY + 0.5);

      ctx.fillStyle = COLORS.ink;
      ctx.font = `600 ${tightHead ? 10.5 : 12}px "Noto Serif SC", serif`;
      ctx.fillText(c.title[0], c.cx, badgeY + badgeR + (tightHead ? 10 : 14));
      ctx.fillText(c.title[1], c.cx, badgeY + badgeR + (tightHead ? 22 : 29));
      ctx.restore();
    });

    // 5. 第 1 列：中文直排（严格装在 [bodyTop, contentBottom] 内）
    const chars1 = [...spec.col1];
    ctx.save();
    ctx.fillStyle = COLORS.ink;
    ctx.font = `700 ${Math.round(cjkEm)}px "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const startY1 = bodyTop + cjkStep * 0.5;
    chars1.forEach((ch, idx) => {
      const py = startY1 + idx * cjkStep;
      if (py <= contentBottom + 2) {
        ctx.fillText(ch, cols[0].cx, py);
      }
    });
    ctx.restore();

    // 7. 第 3 列：数字策略（严格装在 [bodyTop, contentBottom] 内）
    const c3 = cols[2];
    const numPx = Math.round(cjkEm * 0.84);
    ctx.save();
    const numGood = state.numeralMode === "cw90" || state.numeralMode === "tcy";
    ctx.fillStyle = numGood ? COLORS.ink : COLORS.err;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (state.numeralMode === "upright") {
      const items = [...spec.numLong, "•", ...spec.numShort, spec.numSuffix];
      const step = bodyH / Math.max(1, items.length);
      const fitNumPx = Math.min(numPx, Math.round(step * 0.78));
      items.forEach((it, idx) => {
        const y = bodyTop + step * (idx + 0.5);
        if (it === "•") {
          ctx.fillStyle = COLORS.vermilion;
          ctx.beginPath();
          ctx.arc(c3.cx, y, Math.min(3.2, step * 0.14), 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = COLORS.err;
        } else {
          ctx.font = `600 ${Math.max(11, fitNumPx)}px "Sora", sans-serif`;
          ctx.fillText(it, c3.cx, y);
        }
      });
    } else if (state.numeralMode === "cw90" || state.numeralMode === "ccw90") {
      const dir = state.numeralMode === "cw90" ? Math.PI / 2 : -Math.PI / 2;
      const midY = bodyTop + bodyH * 0.5;
      ctx.save();
      ctx.translate(c3.cx, midY);
      ctx.rotate(dir);
      const fullNum = `${spec.numLong}   •   ${spec.numShort}${spec.numSuffix}`;
      ctx.font = `600 ${numPx}px "Sora", sans-serif`;
      const mw = ctx.measureText(fullNum).width;
      if (mw > bodyH - 12) {
        ctx.font = `600 ${Math.max(11, numPx * ((bodyH - 12) / mw)).toFixed(1)}px "Sora", sans-serif`;
      }
      ctx.fillText(fullNum, 0, 0);
      ctx.restore();
    } else if (state.numeralMode === "tcy") {
      const yLong = bodyTop + bodyH * 0.25;
      ctx.save();
      ctx.translate(c3.cx, yLong);
      ctx.rotate(Math.PI / 2);
      ctx.font = `600 ${numPx}px "Sora", sans-serif`;
      ctx.fillText(spec.numLong, 0, 0);
      ctx.restore();

      const yDot = bodyTop + bodyH * 0.50;
      ctx.fillStyle = COLORS.vermilion;
      ctx.beginPath();
      ctx.arc(c3.cx, yDot, 3.2, 0, Math.PI * 2);
      ctx.fill();

      const yTcy = bodyTop + bodyH * 0.67;
      const box = Math.min(cjkEm * 1.05, bodyH * 0.18);
      ctx.strokeStyle = "rgba(22, 104, 68, 0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(c3.cx - box / 2, yTcy - box / 2, box, box);
      ctx.setLineDash([]);
      ctx.fillStyle = COLORS.ink;
      ctx.font = `700 ${Math.max(11, Math.round(box * 0.68))}px "Sora", sans-serif`;
      ctx.fillText(spec.numShort, c3.cx, yTcy + 0.5);

      ctx.font = `600 ${Math.max(11, Math.round(box * 0.72))}px "Noto Serif SC", serif`;
      ctx.fillText(spec.numSuffix, c3.cx, Math.min(contentBottom - 6, yTcy + box * 0.95));
    }

    drawColumnPill(
      ctx,
      c3.cx,
      c3.pillY,
      numGood ? (state.numeralMode === "tcy" ? "纵中横 ✓" : "+90° ✓") : "点此转向",
      numGood
    );
    ctx.restore();

    // 8. 第 4 列：竖排标点（严格装在 [bodyTop, contentBottom] 内）
    const c4 = cols[3];
    const pList = spec.puncts;
    const pStep = bodyH / Math.max(1, pList.length);
    const pEm = Math.min(cjkEm * 0.92, pStep * 0.92);
    pList.forEach((ch, idx) => {
      drawPunctuation(
        ctx,
        ch,
        c4.cx,
        bodyTop + pStep * (idx + 0.5),
        pEm,
        state.punctMode,
        probe === "rhythm"
      );
    });
    drawColumnPill(
      ctx,
      c4.cx,
      c4.pillY,
      state.punctMode === "raw" ? "点此转形" : state.punctMode === "topright" ? "右上 ✓" : "居中 ✓",
      state.punctMode !== "raw"
    );
  }

  // 动态第 2 列（随拖动角度/基线/缩放每帧快速重绘）
  function drawDynamicCol2(ctx, g, state, audit) {
    const { cols, bodyTop, contentBottom, bodyBottom, bodyH, cjkEm, spec } = g;
    const probe = state.highlightProbe;
    const c2 = cols[1];
    const latMidY = bodyTop + bodyH * 0.5;

    if (probe === "hierarchy") {
      ctx.save();
      ctx.fillStyle = "rgba(22, 104, 68, 0.09)";
      ctx.fillRect(cols[0].cx - cjkEm * 0.5, bodyTop, cjkEm, bodyH);
      ctx.fillStyle = audit.probes.hierarchy.pass ? "rgba(22, 104, 68, 0.09)" : "rgba(184, 41, 20, 0.11)";
      ctx.fillRect(g.latinCenterX - g.latinBoxW * 0.5, bodyTop, g.latinBoxW, Math.min(bodyH, g.latinBoxH));
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = Math.abs(state.baselineShift) > 3.5 ? "rgba(184, 41, 20, 0.45)" : "rgba(22, 104, 68, 0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(c2.cx, bodyTop);
    ctx.lineTo(c2.cx, contentBottom);
    ctx.stroke();
    ctx.restore();

    if (g.minGutterGap < 5) {
      ctx.save();
      ctx.fillStyle = COLORS.errWash;
      const boxL = g.latinCenterX - g.latinBoxW / 2;
      const boxR = g.latinCenterX + g.latinBoxW / 2;
      if (boxL - c2.x < 5) ctx.fillRect(c2.x - 4, bodyTop, 10, bodyH);
      if (c2.x + c2.w - boxR < 5) ctx.fillRect(c2.x + c2.w - 6, bodyTop, 10, bodyH);
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = audit.isCw90 && Math.abs(state.baselineShift) <= 3.5 && g.minGutterGap >= 5 ? COLORS.ink : COLORS.err;
    if (g.isStacked) {
      const letters = [...spec.col2.replace(/\s+/g, " ")].slice(0, 18);
      const step = bodyH / Math.max(1, letters.length);
      const fz = Math.min(g.latinBasePx * 0.85, step * 0.92);
      ctx.font = `600 ${Math.max(10, Math.round(fz))}px "Sora", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      letters.forEach((ch, idx) => {
        ctx.fillText(ch, g.latinCenterX, bodyTop + step * (idx + 0.5));
      });
    } else {
      let drawPx = g.latinBasePx;
      ctx.font = `600 ${Math.round(drawPx)}px "Sora", sans-serif`;
      const measured = ctx.measureText(spec.col2).width;
      const maxSpan = bodyH - 12;
      if (measured > maxSpan && measured > 1) {
        drawPx = Math.max(10, drawPx * (maxSpan / measured));
        ctx.font = `600 ${drawPx.toFixed(1)}px "Sora", sans-serif`;
      }
      ctx.translate(g.latinCenterX, latMidY);
      ctx.rotate((state.latinAngle * Math.PI) / 180);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(spec.col2, 0, 0);
    }
    ctx.restore();

    if (audit.isCcw) {
      const rx = c2.x + c2.w - (g.compact ? 8 : 12);
      ctx.save();
      ctx.strokeStyle = COLORS.err;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(rx, contentBottom - 10);
      ctx.lineTo(rx, bodyTop + 12);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(rx - 4.5, bodyTop + 19);
      ctx.lineTo(rx, bodyTop + 11);
      ctx.lineTo(rx + 4.5, bodyTop + 19);
      ctx.stroke();
      ctx.restore();
    }

    const lStartY = contentBottom + 2;
    const lEndY = bodyBottom + 3;
    const lEndX = c2.cx + g.colW * 0.68;
    ctx.save();
    ctx.strokeStyle = audit.isCw90 ? COLORS.vermilion : COLORS.muted;
    ctx.lineWidth = probe === "flow" ? 2.2 : 1.3;
    if (!audit.isCw90) ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(c2.cx, lStartY);
    ctx.lineTo(c2.cx, lEndY - 8);
    ctx.quadraticCurveTo(c2.cx, lEndY, c2.cx + 8, lEndY);
    ctx.lineTo(lEndX, lEndY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(lEndX - 5.5, lEndY - 4);
    ctx.lineTo(lEndX, lEndY);
    ctx.lineTo(lEndX - 5.5, lEndY + 4);
    ctx.stroke();
    ctx.restore();

    if (!g.compact && Math.abs(state.baselineShift) > 3.5) {
      drawColumnPill(
        ctx,
        c2.cx,
        c2.pillY,
        `偏轴 ${state.baselineShift > 0 ? "+" : ""}${state.baselineShift}px`,
        false
      );
    }
  }

  function drawColumnPill(ctx, cx, cy, text, ok) {
    ctx.save();
    ctx.font = `500 10.5px "Noto Serif SC", sans-serif`;
    const tw = ctx.measureText(text).width + 14;
    const th = 20;
    ctx.fillStyle = ok ? COLORS.okWash : COLORS.errWash;
    ctx.strokeStyle = ok ? "rgba(22, 104, 68, 0.45)" : "rgba(184, 41, 20, 0.5)";
    ctx.lineWidth = 1;
    ctx.fillRect(cx - tw / 2, cy - th / 2, tw, th);
    ctx.strokeRect(cx - tw / 2, cy - th / 2, tw, th);
    ctx.fillStyle = ok ? COLORS.ok : COLORS.err;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cx, cy + 0.5);
    ctx.restore();
  }

  // 演播视线流：沿第 1 列下行 → 进入第 2 列（顺流平滑向下，逆流遇阻反冲向上！）→ 第 3 列
  function drawReadingBead(ctx, g, state, audit, phase) {
    const { cols, bodyTop, bodyBottom, bodyH } = g;
    let bx, by, clash = false;
    if (phase < 0.34) {
      const p = phase / 0.34;
      bx = cols[0].cx;
      by = bodyTop + p * (bodyH * 0.9);
    } else if (phase < 0.72) {
      const p = (phase - 0.34) / 0.38;
      bx = g.latinCenterX;
      if (audit.isCcw) {
        // 逆时针：迫使眼睛从底部往上逆行
        by = bodyBottom - 26 - p * (bodyH * 0.84);
        clash = true;
      } else if (audit.isStacked) {
        // 0° 逐字顿挫
        const stepped = Math.floor(p * 12) / 12;
        by = bodyTop + stepped * (bodyH * 0.88);
        clash = true;
      } else {
        by = bodyTop + p * (bodyH * 0.88);
      }
    } else {
      const p = (phase - 0.72) / 0.28;
      bx = cols[2].cx;
      by = state.numeralMode === "ccw90"
        ? bodyBottom - 26 - p * (bodyH * 0.8)
        : bodyTop + p * (bodyH * 0.84);
      clash = state.numeralMode === "ccw90" || state.numeralMode === "upright";
    }

    ctx.save();
    ctx.fillStyle = clash ? "rgba(184, 41, 20, 0.22)" : "rgba(235, 78, 27, 0.24)";
    ctx.beginPath();
    ctx.arc(bx, by, clash ? 15 : 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = clash ? COLORS.err : COLORS.vermilion;
    ctx.beginPath();
    ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 指针与触摸交互（兼顾竖屏流畅滚页与横拖流畅旋转）
  function pointerPos(e) {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  }

  canvas.addEventListener("pointerdown", (e) => {
    const p = pointerPos(e);
    const zone = hitTest(p.x, p.y);
    dragStartX = p.x;
    dragStartAngle = getState().latinAngle;
    dragMoved = false;
    if (zone === "dial") {
      dragMode = "dial";
      const g = computeGeometry(getState(), w, h);
      const nextAngle = snapAngle(angleFromDial(p.x, p.y, g), 5);
      onMutate({ latinAngle: nextAngle });
    } else {
      dragMode = "sweep";
    }
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    dirty = true;
    if (reducedMotion.matches) runner.draw();
  });

  canvas.addEventListener("pointermove", (e) => {
    const p = pointerPos(e);
    if (!dragMode) {
      const nextHover = hitTest(p.x, p.y);
      if (nextHover !== hoverZone) {
        hoverZone = nextHover;
        canvas.style.cursor =
          hoverZone === "dial"
            ? "grab"
            : hoverZone === "col3" || hoverZone === "col4"
            ? "pointer"
            : "ew-resize";
        dirty = true;
        if (reducedMotion.matches) runner.draw();
      }
      return;
    }

    const dx = p.x - dragStartX;
    if (Math.abs(dx) > 5) dragMoved = true;

    if (dragMode === "dial") {
      const g = computeGeometry(getState(), w, h);
      const nextAngle = snapAngle(angleFromDial(p.x, p.y, g), 5);
      onMutate({ latinAngle: nextAngle }, true);
    } else if (dragMode === "sweep" && dragMoved) {
      const sensitivity = 180 / Math.max(180, w * 0.55);
      const raw = dragStartAngle + dx * sensitivity;
      const nextAngle = snapAngle(raw, 4);
      onMutate({ latinAngle: nextAngle }, true);
    }
    dirty = true;
    if (reducedMotion.matches) runner.draw();
  });

  function finishDrag(e) {
    if (!dragMode) return;
    const p = e.clientX != null ? pointerPos(e) : null;
    const wasMoved = dragMoved;
    dragMode = null;
    if (!wasMoved && p) {
      const zone = hitTest(p.x, p.y);
      const st = getState();
      if (zone === "col3") {
        const order = ["upright", "cw90", "tcy", "ccw90"];
        const next = order[(order.indexOf(st.numeralMode) + 1) % order.length];
        onMutate({ numeralMode: next });
      } else if (zone === "col4") {
        const order = ["raw", "center", "topright"];
        const next = order[(order.indexOf(st.punctMode) + 1) % order.length];
        onMutate({ punctMode: next });
      }
    } else {
      onMutate({});
    }
    dirty = true;
    if (reducedMotion.matches) runner.draw();
  }

  canvas.addEventListener("pointerup", finishDrag);
  canvas.addEventListener("pointercancel", () => {
    dragMode = null;
    dirty = true;
  });

  let touchActive = false;
  let touchStartX = 0;
  let touchStartA = 0;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const p = pointerPos(e);
      touchActive = true;
      touchStartX = p.x;
      touchStartA = getState().latinAngle;
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (dragMode || !touchActive || !e.touches.length) return;
      const p = pointerPos(e);
      const dx = p.x - touchStartX;
      if (Math.abs(dx) > 3) {
        const sensitivity = 180 / Math.max(160, w * 0.5);
        const nextAngle = snapAngle(touchStartA + dx * sensitivity, 3);
        onMutate({ latinAngle: nextAngle }, true);
        dirty = true;
        if (reducedMotion.matches) runner.draw();
      }
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchend",
    () => {
      touchActive = false;
      onMutate({});
    },
    { passive: true }
  );

  const ro = new ResizeObserver(() => {
    resize();
    runner.draw();
    onResize?.();
  });
  ro.observe(canvas);

  const runner = loop(canvas, drawFrame);
  resize();
  runner.draw();

  return {
    markDirty,
    getGeometry: () => computeGeometry(getState(), w, h),
  };
}

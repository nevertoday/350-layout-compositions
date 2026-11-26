// 221 开场主角玩具：旁注排字盘 · 活字试印台（2D Canvas）
// 1:1 承袭 221 原海报 18px 圆角玫瑰红细框双区解剖图，左横排主盘 + 细竖线 + 右侧旁注联动小窗。
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  PALETTE,
  INK_MODES,
  clamp,
  computeGalleyLayout,
  evaluateRuby,
} from "./model.js";

const FONT_CJK = '"Noto Sans SC", sans-serif';
const FONT_EN = '"Manrope", "Noto Sans SC", sans-serif';
const FONT_MONO = '"DM Mono", monospace';

export function mountHeroStage(canvas, store) {
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let dpr = 1;
  let dirty = true;
  let lastLayout = null;
  let lastEval = null;
  let introDone = false;
  let scanActive = false;
  let scanProgress = 0; // 0..1

  // 指针拖拽状态
  let dragMode = null; // "ratio" | "gap" | null
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartRatio = 0.5;
  let dragStartGap = 0.14;
  let touchLocked = null; // "h" | "v" | null
  let activePointerId = null;

  // 供点击命中的热区
  let gapHandlePos = { x: 0, y: 0, r: 18 };
  let rubyHitBoxes = [];
  let sideHitRect = { x: 0, y: 0, w: 0, h: 0 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const nw = Math.max(280, Math.round(rect.width));
    const nh = Math.max(240, Math.round(rect.height));
    const ndpr = pixelRatio(2);
    if (nw !== w || nh !== h || ndpr !== dpr) {
      w = nw;
      h = nh;
      dpr = ndpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dirty = true;
    }
  }

  function measureFn(text, px, isBase) {
    ctx.save();
    ctx.font = `${isBase ? 900 : 500} ${px}px ${FONT_CJK}`;
    const m = ctx.measureText(text).width;
    ctx.restore();
    return m;
  }

  function computeNow() {
    const st = store.getState();
    const layout = computeGalleyLayout(st, { w, h, measureFn });
    const ev = evaluateRuby(st, layout);
    lastLayout = layout;
    lastEval = ev;
    store.publishAudit(layout, ev);
    return { st, layout, ev };
  }

  function drawLine(x1, y1, x2, y2, color, width = 1.25, dash = null) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawDot(x, y, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawRoundRect(x, y, rw, rh, rad) {
    const r = Math.min(rad, rw / 2, rh / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + rw, y, x + rw, y + rh, r);
    ctx.arcTo(x + rw, y + rh, x, y + rh, r);
    ctx.arcTo(x, y + rh, x, y, r);
    ctx.arcTo(x, y, x + rw, y, r);
    ctx.closePath();
  }

  function drawTag(x, y, text, bg, fg, align = "center") {
    ctx.save();
    ctx.font = `600 11px ${FONT_CJK}`;
    const tw = ctx.measureText(text).width;
    const padX = 7;
    const bh = 20;
    const bw = tw + padX * 2;
    let bx = x - bw / 2;
    if (align === "left") bx = x;
    if (align === "right") bx = x - bw;
    bx = clamp(bx, 6, w - bw - 6);
    const by = clamp(y - bh / 2, 6, h - bh - 6);
    ctx.fillStyle = bg;
    drawRoundRect(bx, by, bw, bh, 5);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bx + bw / 2, by + bh / 2 + 0.5);
    ctx.restore();
  }

  function drawVerticalMain(st, layout, ev, intro) {
    const ink = INK_MODES[st.inkMode] || INK_MODES.vermilion;
    const rubyColor = ink.canvasColor || ink.color;
    const items = layout.spec.verticalSample;
    const cols = items.length;
    const availH = layout.h - 74;
    const charPx = clamp(Math.floor(availH / (cols * 1.18)), 30, 56);
    const rubyPx = +(charPx * st.rubyRatio).toFixed(1);
    const gapPx = +(charPx * st.gapEm).toFixed(1);
    const colGap = Math.round(charPx * st.lineHeight);
    const centerX = Math.round(layout.w * 0.52);
    const startY = Math.round((layout.h - cols * charPx * 1.12) / 2) + 8;

    // 淡宣纸纵行界栏
    drawLine(centerX - charPx * 0.72, 24, centerX - charPx * 0.72, layout.h - 46, "#EFE2DA", 1);
    drawLine(centerX + charPx * 0.72 + gapPx + rubyPx, 24, centerX + charPx * 0.72 + gapPx + rubyPx, layout.h - 46, "#EFE2DA", 1);

    // 左侧下一列参考（右起直排时，下一列在左侧；上一列在右侧）
    const prevColX = centerX + colGap;
    if (prevColX + charPx * 0.6 < layout.w - 16) {
      ctx.save();
      ctx.fillStyle = "rgba(88, 92, 93, 0.28)";
      ctx.font = `700 ${Math.round(charPx * 0.86)}px ${FONT_CJK}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const prevChars = [...layout.spec.prevLine].slice(0, cols);
      prevChars.forEach((ch, idx) => {
        ctx.fillText(ch, prevColX, startY + idx * charPx * 1.12 + charPx / 2);
      });
      ctx.restore();
    }

    // 主列文字 + 右侧旁注
    rubyHitBoxes = [];
    items.forEach((it, idx) => {
      const cy = startY + idx * charPx * 1.12 + charPx / 2;
      const showRuby = !(it.redundant && st.stripRedundantNo);
      ctx.save();
      ctx.globalAlpha = intro;
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `900 ${charPx}px ${FONT_CJK}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(it.base, centerX, cy);

      if (showRuby && it.ruby) {
        const rx = centerX + charPx / 2 + gapPx + rubyPx * 0.5;
        const driftY = st.alignMode === "drift" ? charPx * 0.26 : 0;
        ctx.fillStyle = rubyColor;
        ctx.font = `${ink.weight} ${rubyPx}px ${FONT_CJK}`;
        const rChars = [...it.ruby];
        const totalRH = rChars.length * rubyPx * 1.02;
        rChars.forEach((rc, ri) => {
          const rcy = cy + driftY - totalRH / 2 + (ri + 0.5) * rubyPx * 1.02;
          ctx.fillText(rc, rx, rcy);
        });
        rubyHitBoxes.push({
          idx,
          x: rx - rubyPx * 0.8,
          y: cy - charPx * 0.5,
          w: rubyPx * 1.6,
          h: charPx,
          redundant: !!it.redundant,
        });
      }
      ctx.restore();
    });

    // 返回横排按钮热区
    sideHitRect = { x: 16, y: 14, w: 122, h: 30 };
    ctx.save();
    ctx.fillStyle = "#FDF4EC";
    ctx.strokeStyle = PALETTE.frameRose;
    ctx.lineWidth = 1.2;
    drawRoundRect(sideHitRect.x, sideHitRect.y, sideHitRect.w, sideHitRect.h, 15);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PALETTE.safeRed;
    ctx.font = `600 12px ${FONT_CJK}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("← 切回横排主盘", sideHitRect.x + sideHitRect.w / 2, sideHitRect.y + sideHitRect.h / 2 + 0.5);
    ctx.restore();

    drawBottomRuler(st, layout, ev);
  }

  function drawBottomRuler(st, layout, ev) {
    // 底部内嵌活字字阶游标（让用户一眼看懂横拖对应字号比）
    const barY = layout.h - 19;
    const barL = layout.compact ? 18 : 26;
    const barR = layout.compact ? layout.w - 18 : layout.sideRect.x - 24;
    const barW = Math.max(120, barR - barL);
    const norm = clamp((st.rubyRatio - 0.24) / (0.95 - 0.24), 0, 1);
    const goldL = barL + ((0.38 - 0.24) / 0.71) * barW;
    const goldR = barL + ((0.58 - 0.24) / 0.71) * barW;
    const knobX = barL + norm * barW;

    // 轨道底线
    drawLine(barL, barY, barR, barY, "#E9DDD5", 3);
    // 传统黄金区（38%–58%）柔绿提示带
    drawLine(goldL, barY, goldR, barY, "rgba(25, 107, 82, 0.28)", 5);
    // 当前游标
    drawDot(knobX, barY, 5.5, ev.checks.baseFirst.ok ? PALETTE.passGreen : PALETTE.safeRed);

    ctx.save();
    ctx.font = `500 10.5px ${FONT_MONO}`;
    ctx.fillStyle = PALETTE.subInk;
    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    ctx.fillText("24%", barL, barY - 5);
    ctx.textAlign = "center";
    ctx.fillStyle = ev.checks.baseFirst.ok ? PALETTE.passGreen : PALETTE.safeRed;
    ctx.fillText(`← 横拖调字号比 ${Math.round(st.rubyRatio * 100)}% →`, (barL + barR) / 2, barY - 5);
    ctx.fillStyle = PALETTE.subInk;
    ctx.textAlign = "right";
    ctx.fillText("95%", barR, barY - 5);
    ctx.restore();
  }

  function drawFrame(t, dt, { still }) {
    resize();

    // 开场入场进度（0.78 秒平稳滑完）
    const intro = still ? 1 : clamp(t / 0.78, 0, 1);
    const ease = 1 - Math.pow(1 - intro, 3);
    if (intro < 1) {
      dirty = true;
    } else if (!introDone) {
      introDone = true;
      dirty = true;
    }

    // 扫读视线流动画
    if (scanActive && !still) {
      scanProgress += dt * 0.36;
      if (scanProgress >= 1) {
        scanProgress = 0;
        scanActive = false;
        store.setScanning(false);
      }
      dirty = true;
    }

    if (!dirty) return;
    dirty = false;

    const { st, layout, ev } = computeNow();

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 暖白宣纸清底
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    // 极轻的排字纸格基线
    ctx.strokeStyle = "rgba(231, 164, 160, 0.14)";
    ctx.lineWidth = 1;
    for (let gy = 36; gy < h - 24; gy += 36) {
      ctx.beginPath();
      ctx.moveTo(14, gy);
      ctx.lineTo(w - 14, gy);
      ctx.stroke();
    }

    if (st.verticalMain) {
      drawVerticalMain(st, layout, ev, ease);
      ctx.restore();
      return;
    }

    const ink = INK_MODES[st.inkMode] || INK_MODES.vermilion;
    const rubyColor = ink.canvasColor || ink.color;
    const hl = st.highlightDim;
    const cells = layout.cells;
    const firstCell = cells[0];
    const lastCell = cells[cells.length - 1];

    // 2. 顶部极细角标读数
    ctx.save();
    ctx.font = `500 11px ${FONT_MONO}`;
    ctx.fillStyle = PALETTE.subInk;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(
      `RUBY ${ev.metrics.ratioPct}% · GAP ${ev.metrics.gapPx}px · LINE ${st.lineHeight.toFixed(2)}×`,
      16,
      12
    );
    ctx.restore();

    // 右上小状态签（单真源同步）
    drawTag(
      layout.compact ? w - 12 : layout.sideRect.x - 16,
      19,
      ev.statusLabel,
      ev.isPass ? "#E3F3EC" : "#FDECEB",
      ev.isPass ? PALETTE.passGreen : PALETTE.safeRed,
      "right"
    );

    // 3. 上邻行参考文本（用于真实演示跨行归属反转！）
    const prevAlpha = ev.checks.spacing.ok ? 0.28 : 0.42;
    const prevY = layout.prevBaseBottomY;
    if (prevY > 26) {
      const prevMidX = (firstCell.baseBox.x + lastCell.baseBox.x + lastCell.baseBox.w) / 2;
      ctx.save();
      ctx.globalAlpha = prevAlpha * ease;
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 ${Math.round(layout.basePx * 0.58)}px ${FONT_CJK}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(layout.spec.prevLine, prevMidX, prevY - 4);
      ctx.restore();

      // 上邻行底脚基准细虚线
      drawLine(
        firstCell.baseBox.x - 10,
        prevY,
        lastCell.baseBox.x + lastCell.baseBox.w + 10,
        prevY,
        ev.checks.spacing.ok ? "rgba(88, 92, 93, 0.22)" : "rgba(196, 48, 43, 0.52)",
        1,
        [3, 4]
      );

      // 将「上行底脚」标签放到右端干净空白处，避开偏右后的末字旁注
      if (!layout.compact) {
        ctx.save();
        ctx.font = `500 10.5px ${FONT_CJK}`;
        ctx.fillStyle = ev.checks.spacing.ok ? PALETTE.subInk : PALETTE.safeRed;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const rightEdge = Math.max(
          lastCell.baseBox.x + lastCell.baseBox.w,
          lastCell.rubyBox.x + lastCell.rubyBox.w
        );
        const lblX = rightEdge + 18;
        if (lblX + 52 < layout.sideRect.x - 6) {
          ctx.fillText("上行底脚", lblX, prevY);
        }
        ctx.restore();
      }
    }

    // 4. 左侧 1:1 复刻原海报「旁注 RUBY」红虚圆点引线 & 「主文 BASE TEXT」黑实圆点引线
    const rubyMidY = layout.rubyTopY + layout.rubyPx * 0.5;
    const baseMidY = layout.baseTopY + layout.basePx * 0.52;
    const rubyLeadEndX = firstCell.baseBox.x - 14;
    const baseLeadEndX = firstCell.baseBox.x - 14;

    if (!layout.compact) {
      // 旁注 RUBY 引线（红圆点可上下拖调注距！）
      const labelX = 24;
      ctx.save();
      ctx.fillStyle = PALETTE.safeRed;
      ctx.font = `700 13px ${FONT_CJK}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("旁注", labelX, rubyMidY + 2);
      ctx.font = `600 10px ${FONT_EN}`;
      ctx.fillStyle = PALETTE.subInk;
      ctx.fillText("RUBY", labelX, rubyMidY + 15);
      ctx.restore();

      const leadStart = labelX + 38;
      const curEnd = leadStart + (rubyLeadEndX - leadStart) * ease;
      drawLine(leadStart, rubyMidY, curEnd, rubyMidY, PALETTE.kanaRed, 1.5, [3, 3]);
      // 拖拽手把红圆（微微外圈提示可上下拉）
      ctx.save();
      ctx.fillStyle = "rgba(242, 89, 82, 0.16)";
      ctx.beginPath();
      ctx.arc(curEnd, rubyMidY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawDot(curEnd, rubyMidY, 4.5, PALETTE.kanaRed);
      gapHandlePos = { x: curEnd, y: rubyMidY, r: 20 };

      // 主文 BASE TEXT 引线
      ctx.save();
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 13px ${FONT_CJK}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("主文", labelX, baseMidY + 2);
      ctx.font = `600 10px ${FONT_EN}`;
      ctx.fillStyle = PALETTE.subInk;
      ctx.fillText("BASE TEXT", labelX, baseMidY + 15);
      ctx.restore();
      const bEnd = leadStart + (baseLeadEndX - leadStart) * ease;
      drawLine(leadStart, baseMidY, bEnd, baseMidY, PALETTE.ink, 1.5);
      drawDot(bEnd, baseMidY, 4, PALETTE.ink);
    } else {
      // 手机端：把红圆点注距手把放在首字左肩
      const hx = Math.max(18, firstCell.baseBox.x - 8);
      drawDot(hx, rubyMidY, 5, PALETTE.kanaRed);
      gapHandlePos = { x: hx, y: rubyMidY, r: 22 };
    }

    // 5. 维度高亮测量辅助层（或存在错态时的就地标尺，自动避开末字偏移后的旁注）
    if (hl === "spacing" || !ev.checks.spacing.ok) {
      const rightMost = Math.max(
        lastCell.baseBox.x + lastCell.baseBox.w,
        lastCell.rubyBox.w > 0 ? lastCell.rubyBox.x + lastCell.rubyBox.w : 0
      );
      const maxX = layout.compact ? w - 8 : layout.sideRect.x - 10;
      const mx = Math.min(maxX, rightMost + 10);
      // 标出「上邻行 ↔ 旁注」与「旁注 ↔ 主字」两段距离对比
      const warnCol = ev.checks.spacing.ok ? PALETTE.passGreen : PALETTE.safeRed;
      drawLine(mx, prevY, mx, layout.rubyTopY, warnCol, 1.4, [2, 2]);
      drawLine(mx, layout.rubyBottomY, mx, layout.baseTopY, PALETTE.ink, 1.4);
      if (mx <= maxX) {
        drawDot(mx, prevY, 2.5, warnCol);
        drawDot(mx, layout.rubyTopY, 2.5, warnCol);
        drawDot(mx, layout.baseTopY, 2.5, PALETTE.ink);
      }
      if (!ev.checks.spacing.ok) {
        const tagText =
          layout.gapPx < layout.basePx * 0.06
            ? `压顶粘连 ${ev.metrics.gapPx}px`
            : layout.clearanceToPrevPx <= 0
              ? `撞上邻行底脚`
              : `距上行 ${ev.metrics.clearancePx}px < 注距 ${ev.metrics.gapPx}px`;
        // 放在顶角净空区，绝不压住主文或旁注字形
        drawTag(
          layout.compact ? w - 12 : layout.sideRect.x - 16,
          42,
          tagText,
          "#C4302B",
          "#FFFFFF",
          "right"
        );
      }
    }

    // 6. 绘制主文方块字 + 旁注字符
    rubyHitBoxes = [];
    cells.forEach((cell, i) => {
      const b = cell.baseBox;
      const r = cell.rubyBox;

      // 撑裂白洞高亮（如果该字旁注把字距硬撑裂了）
      if (cell.crackEm > 0.26) {
        ctx.save();
        ctx.fillStyle = "rgba(196, 48, 43, 0.08)";
        ctx.fillRect(b.x - cell.crackEm * b.w * 0.45, b.y, cell.crackEm * b.w * 0.42, b.h);
        ctx.restore();
      }

      // 对齐中心轴辅助线（当高亮「紧密对应」或发生偏右错位时绘制）
      if (hl === "alignment" || st.alignMode === "drift") {
        drawLine(b.cx, layout.rubyTopY - 8, b.cx, b.y + b.h + 10, "rgba(7, 11, 10, 0.22)", 1, [2, 3]);
        if (cell.ruby && st.alignMode !== "group" && cell.driftRatio > 0.05) {
          drawLine(r.cx, r.y, r.cx, r.y + r.h + 6, PALETTE.safeRed, 1.2);
          drawLine(b.cx, r.y - 4, r.cx, r.y - 4, PALETTE.safeRed, 1.5);
        }
      }

      // 主文字阶测高尺（高亮「主文优先」）
      if (hl === "baseFirst" && i === 0) {
        const rx = b.x - 8;
        drawLine(rx, b.y, rx, b.y + b.h, PALETTE.ink, 1.5);
        drawLine(rx, r.y, rx, r.y + r.h, PALETTE.safeRed, 1.5);
      }

      // 绘制主文汉字（极深松烟墨 900 粗体）
      ctx.save();
      ctx.globalAlpha = ease;
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `900 ${layout.basePx}px ${FONT_CJK}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(cell.base, b.cx, b.y);
      ctx.restore();

      // 绘制非词组模式的单字/熟语旁注
      if (st.alignMode !== "group" && cell.ruby) {
        // 如果与下一个旁注碰撞，画红底警示
        if (i < cells.length - 1) {
          const nb = cells[i + 1].rubyBox;
          if (nb.w > 0 && r.x + r.w + 2 > nb.x) {
            ctx.save();
            ctx.fillStyle = "rgba(196, 48, 43, 0.16)";
            ctx.fillRect(nb.x - 2, r.y - 2, r.x + r.w - nb.x + 4, r.h + 4);
            ctx.restore();
          }
        }

        // 原海报彩蛋：助词「の」上多余红注的淡虚框可点标识
        if (cell.redundant) {
          ctx.save();
          ctx.strokeStyle = "rgba(196, 48, 43, 0.45)";
          ctx.setLineDash([2, 2]);
          ctx.lineWidth = 1;
          drawRoundRect(r.x - 4, r.y - 2, Math.max(r.w, layout.rubyPx) + 8, r.h + 4, 4);
          ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        ctx.globalAlpha = ease;
        ctx.fillStyle = rubyColor;
        ctx.font = `${ink.weight} ${layout.rubyPx}px ${FONT_CJK}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(cell.ruby, r.cx, r.y);
        ctx.restore();

        rubyHitBoxes.push({
          idx: i,
          x: r.x - 8,
          y: r.y - 8,
          w: Math.max(r.w, layout.basePx * 0.6) + 16,
          h: r.h + 16,
          redundant: cell.redundant,
        });
      } else if (cell.redundant) {
        // 即使已经删掉多余注音，也保留点击还原热区
        rubyHitBoxes.push({
          idx: i,
          x: b.x,
          y: layout.rubyTopY - 6,
          w: b.w,
          h: layout.rubyPx + 14,
          redundant: true,
        });
      }
    });

    // 词组通排（Group-ruby）整串渲染
    if (st.alignMode === "group" && layout.groupRubyBox) {
      const g = layout.groupRubyBox;
      ctx.save();
      ctx.globalAlpha = ease;
      ctx.fillStyle = rubyColor;
      ctx.font = `${ink.weight} ${layout.rubyPx}px ${FONT_CJK}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(g.text, g.cx, g.y);
      ctx.restore();
    }

    // 7. 下方 1:1 复刻原海报四条朱红下垂虚线 + 底括折线「注释距离 ANNOTATION SPACING」（严防与底部游标尺重叠）
    const dropTopY = layout.baseBottomY + 5;
    const maxDropBot = layout.compact ? layout.mainAreaH - 42 : layout.h - 62;
    const dropBotY = Math.min(maxDropBot, dropTopY + 14);
    if (dropBotY > dropTopY + 4) {
      cells.forEach((cell) => {
        if (!cell.redundant || !st.stripRedundantNo) {
          drawLine(cell.baseBox.cx, dropTopY, cell.baseBox.cx, dropBotY, "rgba(242, 89, 82, 0.58)", 1.2, [3, 3]);
        }
      });
      if (cells.length >= 4) {
        const b1 = cells[1].baseBox.cx;
        const b2 = cells[cells.length - 2].baseBox.cx;
        drawLine(b1, dropBotY, b2, dropBotY, "rgba(242, 89, 82, 0.72)", 1.2);
        const midX = (b1 + b2) / 2;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = PALETTE.safeRed;
        ctx.font = `600 11.5px ${FONT_CJK}`;
        ctx.fillText(`注释距离 · ${ev.metrics.gapPx}px`, midX, dropBotY + 4);
        ctx.fillStyle = PALETTE.subInk;
        ctx.font = `500 9.5px ${FONT_EN}`;
        ctx.fillText("ANNOTATION SPACING", midX, dropBotY + 18);
        ctx.restore();
      }
    }

    // 8. 扫读视线演播光带（Space 触发）
    if (scanActive && !still) {
      const startX = firstCell.baseBox.x;
      const endX = lastCell.baseBox.x + lastCell.baseBox.w;
      const gx = startX + (endX - startX) * scanProgress;
      // 如果不达标，视线在主文和旁注/上行之间剧烈跳动；达标则平稳滑过主文
      let gy = baseMidY;
      if (!ev.isPass) {
        const wobble = Math.sin(scanProgress * Math.PI * 10);
        gy = !ev.checks.spacing.ok && wobble > 0.3
          ? prevY - 4
          : baseMidY - Math.abs(wobble) * (baseMidY - rubyMidY + 8);
      } else {
        // 仅在个别汉字处轻跳一眼
        const gentle = Math.max(0, Math.sin(scanProgress * Math.PI * 4)) * 0.25;
        gy = baseMidY - gentle * (baseMidY - rubyMidY);
      }

      // 轨迹虚尾
      ctx.save();
      ctx.strokeStyle = ev.isPass ? "rgba(25, 107, 82, 0.55)" : "rgba(196, 48, 43, 0.65)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      const steps = 28;
      for (let s = 0; s <= steps; s++) {
        const p = (s / steps) * scanProgress;
        const sx = startX + (endX - startX) * p;
        let sy = baseMidY;
        if (!ev.isPass) {
          const wb = Math.sin(p * Math.PI * 10);
          sy = !ev.checks.spacing.ok && wb > 0.3 ? prevY - 4 : baseMidY - Math.abs(wb) * (baseMidY - rubyMidY + 8);
        } else {
          sy = baseMidY - Math.max(0, Math.sin(p * Math.PI * 4)) * 0.25 * (baseMidY - rubyMidY);
        }
        if (s === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.restore();

      // 视线焦点圆环
      ctx.save();
      ctx.fillStyle = ev.isPass ? "rgba(25, 107, 82, 0.22)" : "rgba(196, 48, 43, 0.24)";
      ctx.beginPath();
      ctx.arc(gx, gy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawDot(gx, gy, 5, ev.isPass ? PALETTE.passGreen : PALETTE.safeRed);
    }

    // 9. 右侧（或窄屏底部）1:1 复刻原海报「右侧旁注示例 SIDE RUBY EXAMPLE」
    const sr = layout.sideRect;
    sideHitRect = sr;
    const sideSpec = layout.spec.side;

    if (!sr.compact) {
      // 细竖分隔线
      drawLine(sr.x, sr.y + 42, sr.x, sr.y + sr.h - 46, "#E2D5CC", 1.2);
      const sx = sr.x + sr.w * 0.44;
      const sy = layout.baseTopY + layout.basePx * 0.1;

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `600 12px ${FONT_CJK}`;
      ctx.fillText(sideSpec.label, sr.x + sr.w * 0.52, sy - 42);
      ctx.fillStyle = PALETTE.subInk;
      ctx.font = `500 9.5px ${FONT_EN}`;
      ctx.fillText(sideSpec.en, sr.x + sr.w * 0.52, sy - 27);

      const sBase = Math.round(clamp(layout.basePx * 0.84, 42, 64));
      const sRuby = Math.round(sBase * st.rubyRatio);
      const sGap = Math.round(sBase * clamp(st.gapEm, -0.02, 0.36));

      ctx.fillStyle = PALETTE.ink;
      ctx.font = `900 ${sBase}px ${FONT_CJK}`;
      ctx.textBaseline = "top";
      ctx.fillText(sideSpec.base, sx, sy);

      ctx.fillStyle = rubyColor;
      ctx.font = `${ink.weight} ${Math.min(sRuby, 32)}px ${FONT_CJK}`;
      const rX = sx + sBase * 0.55 + sGap + Math.min(sRuby, 32) * 0.42;
      if (sideSpec.isLatinSide) {
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(sideSpec.ruby[0], sx + sBase * 0.54 + Math.max(4, sGap), sy + sBase * 0.52);
      } else {
        const list = sideSpec.ruby;
        const rStep = Math.min(sRuby, 28) * 1.08;
        const rStart = sy + (sBase - list.length * rStep) / 2;
        const driftY = st.alignMode === "drift" ? sBase * 0.22 : 0;
        list.forEach((ch, idx) => {
          ctx.fillText(ch, rX, rStart + driftY + idx * rStep);
        });
      }

      // 原海报右侧底红细线 + 点击切换直排提示
      drawLine(sx - sBase * 0.55, sy + sBase + 16, sx + sBase * 0.85, sy + sBase + 16, PALETTE.frameRose, 1.2);
      ctx.fillStyle = PALETTE.safeRed;
      ctx.font = `500 11px ${FONT_CJK}`;
      ctx.textAlign = "center";
      ctx.fillText("点此直排试印 →", sr.x + sr.w * 0.52, sy + sBase + 26);
      ctx.restore();
    } else {
      // 手机端底部精巧联动条：显示「山 やま」与切换直排按钮（与底部游标尺保持清晰呼吸距）
      ctx.save();
      ctx.fillStyle = "#FDF4EC";
      ctx.strokeStyle = "#EDD8CE";
      ctx.lineWidth = 1;
      drawRoundRect(sr.x, sr.y, sr.w, sr.h, 10);
      ctx.fill();
      ctx.stroke();

      const cy = sr.y + sr.h / 2;
      ctx.fillStyle = PALETTE.subInk;
      ctx.font = `600 11px ${FONT_CJK}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(sideSpec.label, sr.x + 12, cy);

      const mx = sr.x + sr.w * 0.54;
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `900 24px ${FONT_CJK}`;
      ctx.textAlign = "center";
      ctx.fillText(sideSpec.base, mx, cy + 1);

      ctx.fillStyle = rubyColor;
      ctx.font = `${ink.weight} ${clamp(Math.round(24 * st.rubyRatio), 10, 17)}px ${FONT_CJK}`;
      ctx.textAlign = "left";
      ctx.fillText(sideSpec.ruby.join(""), mx + 16 + clamp(st.gapEm * 16, 0, 10), cy + 1);

      ctx.fillStyle = PALETTE.safeRed;
      ctx.font = `600 11px ${FONT_CJK}`;
      ctx.textAlign = "right";
      ctx.fillText("切直排 →", sr.x + sr.w - 12, cy);
      ctx.restore();
    }

    // 10. 底部内嵌活字字阶游标
    drawBottomRuler(st, layout, ev);

    ctx.restore();
  }

  // ---------- 指针与触屏交互（兼容鼠标 + perf.mjs 的 touch 事件，且不阻断页面竖滚）----------
  function localXY(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startDrag(x, y) {
    const st = store.getState();
    dragStartX = x;
    dragStartY = y;
    dragStartRatio = st.rubyRatio;
    dragStartGap = st.gapEm;
    touchLocked = null;

    // 命中左侧注距红圆点手把 -> 纵拖调注距
    const distGap = Math.hypot(x - gapHandlePos.x, y - gapHandlePos.y);
    if (!st.verticalMain && distGap <= gapHandlePos.r + 8) {
      dragMode = "gap";
      return true;
    }
    dragMode = "ratio";
    return false;
  }

  function moveDrag(x, y, isTouch) {
    if (!dragMode) return false;
    const dx = x - dragStartX;
    const dy = y - dragStartY;

    if (dragMode === "gap") {
      // 向上拖增大注距，向下拖缩小注距
      const nextGap = clamp(dragStartGap - dy / Math.max(120, lastLayout?.basePx * 2.2 || 150), -0.04, 0.48);
      store.patch({ gapEm: +nextGap.toFixed(2) });
      return true;
    }

    if (isTouch && !touchLocked) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return false;
      if (Math.abs(dy) > Math.abs(dx) * 1.2) {
        touchLocked = "v";
        dragMode = null;
        return false; // 放行页面竖滚
      }
      touchLocked = "h";
    }

    if (Math.abs(dx) >= 2 || touchLocked === "h") {
      const span = Math.max(180, w * 0.42);
      let nextRatio = clamp(dragStartRatio + (dx / span) * 0.65, 0.24, 0.95);
      // 靠近 0.50 经典半字比轻吸附
      if (Math.abs(nextRatio - 0.50) < 0.014) nextRatio = 0.50;
      store.patch({ rubyRatio: +nextRatio.toFixed(2) });
      return true;
    }
    return false;
  }

  function handleTap(x, y) {
    const st = store.getState();
    // 点击右侧旁注小窗 -> 切换横排 / 直排主盘
    if (
      x >= sideHitRect.x &&
      x <= sideHitRect.x + sideHitRect.w &&
      y >= sideHitRect.y &&
      y <= sideHitRect.y + sideHitRect.h
    ) {
      store.patch({ verticalMain: !st.verticalMain });
      return;
    }
    // 点击助词「の」头顶旁注 -> 开关多余注音
    for (const hb of rubyHitBoxes) {
      if (hb.redundant && x >= hb.x && x <= hb.x + hb.w && y >= hb.y && y <= hb.y + hb.h) {
        store.patch({ stripRedundantNo: !st.stripRedundantNo });
        return;
      }
    }
  }

  // 鼠标事件（非触摸）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    activePointerId = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = localXY(e.clientX, e.clientY);
    startDrag(x, y);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" || activePointerId !== e.pointerId) return;
    const { x, y } = localXY(e.clientX, e.clientY);
    moveDrag(x, y, false);
  });

  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch" || activePointerId !== e.pointerId) return;
    const { x, y } = localXY(e.clientX, e.clientY);
    const moved = Math.hypot(x - dragStartX, y - dragStartY);
    activePointerId = null;
    dragMode = null;
    if (moved < 6) handleTap(x, y);
  });

  canvas.addEventListener("pointercancel", () => {
    activePointerId = null;
    dragMode = null;
  });

  // 原生 Touch 事件（兼顾手机竖滚放行与 perf.mjs 的 dispatchTouchEvent 横向拖动）
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t0 = e.touches[0];
      const { x, y } = localXY(t0.clientX, t0.clientY);
      const lockedGap = startDrag(x, y);
      if (lockedGap) e.preventDefault();
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length || !dragMode) return;
      const t0 = e.touches[0];
      const { x, y } = localXY(t0.clientX, t0.clientY);
      const consumed = moveDrag(x, y, true);
      if (consumed) e.preventDefault();
    },
    { passive: false }
  );

  canvas.addEventListener("touchend", (e) => {
    if (e.changedTouches.length && dragMode) {
      const t0 = e.changedTouches[0];
      const { x, y } = localXY(t0.clientX, t0.clientY);
      if (Math.hypot(x - dragStartX, y - dragStartY) < 8) handleTap(x, y);
    }
    dragMode = null;
    touchLocked = null;
  });

  const ctl = loop(canvas, drawFrame);

  store.subscribe(() => {
    dirty = true;
    ctl.draw();
  });

  window.addEventListener("resize", () => {
    dirty = true;
    ctl.draw();
  });

  return {
    triggerScan() {
      scanActive = !scanActive;
      scanProgress = 0;
      store.setScanning(scanActive);
      dirty = true;
      ctl.draw();
    },
    redraw() {
      dirty = true;
      ctl.draw();
    },
  };
}

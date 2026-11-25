// 157 边注版式 — 开场活体朱墨校注台 2D Canvas 渲染与直操引擎
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, evaluate } from "./model.js";

// 逐像素实采自 157 原海报的色板常量
const PAL = {
  outerBg: "#F4E2CC",
  paperBg: "#F3E6D6",
  paperShadow: "rgba(92, 54, 34, 0.14)",
  quoteBg: "#F0DBC4",
  kraftBg: "#E6CAA8",
  tornLightBg: "#F7EFE5",
  burgundy: "#5F0E12",
  burgundyDark: "#45090C",
  burgundySoft: "rgba(95, 14, 18, 0.14)",
  amber: "#DE820B",
  amberDeep: "#8F4D00",
  ink: "#14100E",
  inkMid: "#4A3F39",
  inkSoft: "#7A6A5F",
  charcoal: "#2E2B28",
  triTop: "#DDD0BE",
  triBot: "#C6B19A",
  hairline: "#7D6254",
  danger: "#B62020",
  dangerBg: "rgba(182, 32, 32, 0.10)",
  ok: "#1B6247",
  okBg: "rgba(27, 98, 71, 0.10)",
};

// 确定性手工毛糙撕边路径（复刻 157 原海报撕纸质感，步长 18px 兼顾自然与软渲染 60fps）
function traceDeckleRect(ctx, x, y, w, h, amp = 2.0, seed = 11) {
  let s = seed;
  const jitter = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return ((s / 0x7fffffff) - 0.5) * 2 * amp;
  };
  const step = 18;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let px = x + step; px < x + w; px += step) ctx.lineTo(px, y + jitter());
  ctx.lineTo(x + w, y);
  for (let py = y + step; py < y + h; py += step) ctx.lineTo(x + w + jitter(), py);
  ctx.lineTo(x + w, y + h);
  for (let px = x + w - step; px > x; px -= step) ctx.lineTo(px, y + h + jitter());
  ctx.lineTo(x, y + h);
  for (let py = y + h - step; py > y; py -= step) ctx.lineTo(x + jitter(), py);
  ctx.closePath();
}

function drawBadgeIcon(ctx, kind, cx, cy, r) {
  ctx.save();
  ctx.strokeStyle = "#FAF2E6";
  ctx.fillStyle = "#FAF2E6";
  ctx.lineWidth = Math.max(1.3, r * 0.13);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (kind === "edit") {
    const s = r * 0.48;
    ctx.strokeRect(cx - s, cy - s * 0.7, s * 1.65, s * 1.55);
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.2, cy + s * 0.15);
    ctx.lineTo(cx + s * 0.95, cy - s * 0.95);
    ctx.stroke();
  } else if (kind === "target") {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      ctx.beginPath();
      ctx.moveTo(cx + dx * r * 0.34, cy + dy * r * 0.34);
      ctx.lineTo(cx + dx * r * 0.66, cy + dy * r * 0.66);
      ctx.stroke();
    }
  } else if (kind === "plus") {
    const s = r * 0.46;
    ctx.beginPath();
    ctx.moveTo(cx - s, cy);
    ctx.lineTo(cx + s, cy);
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx, cy + s);
    ctx.stroke();
  } else {
    const s = r * 0.46;
    ctx.beginPath();
    ctx.moveTo(cx - s, cy);
    ctx.lineTo(cx + s, cy);
    ctx.moveTo(cx + s * 0.2, cy - s * 0.72);
    ctx.lineTo(cx + s, cy);
    ctx.lineTo(cx + s * 0.2, cy + s * 0.72);
    ctx.stroke();
  }
  ctx.restore();
}

// 中文出版级行首避头标点自动折行（带轻量缓存，消除拖动时重复 measureText 开销）
const NO_START_PUNCT = new Set("，。、；：！？）》」”’…·");
const wrapCache = new Map();
function wrapLines(ctx, text, maxW, maxLines) {
  const bucketW = Math.round(maxW / 3) * 3;
  const key = `${ctx.font}|${bucketW}|${maxLines}|${text}`;
  const hit = wrapCache.get(key);
  if (hit) return hit;

  const lines = [];
  let cur = "";
  for (const ch of text) {
    const test = cur + ch;
    if (ctx.measureText(test).width > maxW && cur.length > 0) {
      if (NO_START_PUNCT.has(ch)) {
        // 避头标点并入行尾，避免孤标点落到下一行首
        lines.push(cur + ch);
        cur = "";
      } else {
        lines.push(cur);
        cur = ch;
      }
      if (lines.length >= maxLines) break;
    } else {
      cur = test;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && text.length > lines.join("").length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[，。、；：]$/, "").slice(0, -1) + "…";
  }
  if (wrapCache.size > 480) wrapCache.clear();
  wrapCache.set(key, lines);
  return lines;
}

export function mountHeroStage(canvas, state, onChange) {
  const ctx = canvas.getContext("2d", { alpha: false });

  let logicalW = 860;
  let logicalH = 540;
  let intro = reducedMotion.matches ? 1 : 0;
  let flashTimer = 0;
  let flashNote = -1;
  let hoverTarget = null; // { kind: "card"|"cross"|"gutter", index }
  let drag = null;
  let lastLayout = null;
  let dirty = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    // 手机窄屏 DPR 封顶 1.5（遵循 GUIDE.md，显著提升慢手机软渲染帧率）
    const dpr = pixelRatio(rect.width < 520 ? 1.5 : 2);
    logicalW = rect.width;
    logicalH = rect.height;
    const pw = Math.round(logicalW * dpr);
    const ph = Math.round(logicalH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
  }

  function renderPaperContent(lay, W, H) {
    const { paperRect: pr, theme } = lay;
    const compact = pr.w < 260;
    const pad = Math.max(12, pr.w * 0.055);
    const innerX = pr.x + pad;
    const innerW = pr.w - pad * 2;

    // 1. 轻量出版剪贴双层实体纸影（零 shadowBlur 模糊开销）+ 手工撕边主宣纸页
    ctx.fillStyle = "rgba(92, 54, 34, 0.08)";
    ctx.fillRect(pr.x + 4, pr.y + 6, pr.w, pr.h);
    ctx.fillStyle = "rgba(92, 54, 34, 0.11)";
    ctx.fillRect(pr.x + 2, pr.y + 3, pr.w, pr.h);

    traceDeckleRect(ctx, pr.x, pr.y, pr.w, pr.h, 2.0, 17);
    ctx.fillStyle = PAL.paperBg;
    ctx.fill();
    ctx.strokeStyle = "rgba(125, 98, 84, 0.28)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // 古籍主题绘制淡赭乌丝栏细框
    if (theme.id === "classic") {
      ctx.save();
      ctx.strokeStyle = "rgba(95, 14, 18, 0.22)";
      ctx.lineWidth = 1;
      ctx.strokeRect(pr.x + 8, pr.y + 8, pr.w - 16, pr.h - 16);
      ctx.strokeRect(pr.x + 11, pr.y + 11, pr.w - 22, pr.h - 22);
      ctx.restore();
    }

    // 页眉标题
    const titleSize = clamp(Math.round(pr.w * 0.044), 13, 21);
    const bodySize = clamp(Math.round(pr.w * 0.029), 10.5, 13.5);
    let cursorY = pr.y + Math.max(20, pr.h * 0.058);

    ctx.fillStyle = PAL.burgundy;
    ctx.font = `700 ${titleSize}px "Noto Serif SC", serif`;
    ctx.textBaseline = "top";
    ctx.fillText(theme.heading, innerX, cursorY);

    // 右上角页宽占比小印（单真源数字）
    ctx.fillStyle = PAL.inkSoft;
    ctx.font = `500 ${Math.max(10, Math.round(bodySize * 0.85))}px "DM Mono", monospace`;
    const pctLabel = `主文 ${lay.bodyPct}%`;
    const pctW = ctx.measureText(pctLabel).width;
    if (innerW > 180) {
      ctx.fillText(pctLabel, innerX + innerW - pctW, cursorY + 2);
    }

    cursorY += titleSize + Math.max(8, pr.h * 0.02);

    // 导言文字（锚点 0 所在段）
    ctx.fillStyle = PAL.ink;
    ctx.font = `400 ${bodySize}px "Noto Serif SC", serif`;
    const leadLines = wrapLines(ctx, theme.lead, innerW - 14, compact ? 3 : 3);
    const lineH = bodySize * 1.56;
    leadLines.forEach((ln, idx) => {
      ctx.fillText(ln, innerX, cursorY + idx * lineH);
      // Tufte 模式下在首段末标朱红上标 ①
      if (state.linkStyle === "tufte" && idx === 0) {
        const tw = ctx.measureText(ln).width;
        ctx.fillStyle = PAL.burgundy;
        ctx.font = `700 ${Math.max(9.5, bodySize * 0.8)}px "DM Mono", monospace`;
        ctx.fillText("1", innerX + Math.min(innerW - 10, tw + 3), cursorY - 3);
        ctx.fillStyle = PAL.ink;
        ctx.font = `400 ${bodySize}px "Noto Serif SC", serif`;
      }
    });

    // 2. 中段图形母题区（1:1 致敬原海报：炭黑圆 + 暖米三角 + 深绛圆 + 波浪线 + 焦琥珀锚点）
    const figTop = pr.y + pr.h * 0.30;
    const figH = pr.h * 0.23;
    const figMidY = figTop + figH * 0.54;

    if (theme.id === "poster") {
      const r = clamp(Math.min(innerW * 0.115, figH * 0.38), 16, 40);
      const c1x = innerX + innerW * 0.16;
      const triX = innerX + innerW * 0.44;
      const c2x = innerX + innerW * 0.72;

      // 暖米渐变三角
      const grad = ctx.createLinearGradient(triX, figTop + 4, triX, figTop + figH);
      grad.addColorStop(0, PAL.triTop);
      grad.addColorStop(1, PAL.triBot);
      ctx.beginPath();
      ctx.moveTo(triX, figTop + figH * 0.06);
      ctx.lineTo(triX + r * 1.45, figTop + figH * 0.96);
      ctx.lineTo(triX - r * 1.45, figTop + figH * 0.96);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // 左炭墨圆
      ctx.beginPath();
      ctx.arc(c1x, figMidY, r, 0, Math.PI * 2);
      ctx.fillStyle = PAL.charcoal;
      ctx.fill();

      // 右深绛酒红圆
      ctx.beginPath();
      ctx.arc(c2x, figMidY, r, 0, Math.PI * 2);
      ctx.fillStyle = PAL.burgundy;
      ctx.fill();

      // 灵动黑色波浪导引曲线穿过三体
      ctx.beginPath();
      ctx.moveTo(c1x + r * 0.6, figMidY - r * 0.15);
      ctx.bezierCurveTo(
        triX - r * 0.3, figMidY + r * 1.05,
        triX + r * 0.55, figMidY + r * 0.72,
        c2x - r * 0.2, figMidY + r * 0.32
      );
      ctx.bezierCurveTo(
        c2x + r * 0.8, figMidY + r * 0.95,
        c2x + r * 1.25, figMidY + r * 0.55,
        lay.cards[1].anchorX, lay.cards[1].anchorY
      );
      ctx.strokeStyle = PAL.ink;
      ctx.lineWidth = 1.25;
      ctx.stroke();

      // 三角中焦琥珀橙圆点
      ctx.beginPath();
      ctx.arc(triX - r * 0.12, figMidY + r * 0.45, Math.max(4, r * 0.18), 0, Math.PI * 2);
      ctx.fillStyle = PAL.amber;
      ctx.fill();
    } else if (theme.id === "feynman") {
      // 费曼力学黑板矢量碰撞示意
      const r = clamp(Math.min(innerW * 0.08, figH * 0.3), 12, 26);
      const yLine = figMidY;
      ctx.save();
      ctx.strokeStyle = "rgba(95, 14, 18, 0.22)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(innerX, yLine);
      ctx.lineTo(innerX + innerW - 8, yLine);
      ctx.stroke();
      ctx.setLineDash([]);

      // 球 1 与球 2
      const x1 = innerX + innerW * 0.24;
      const x2 = innerX + innerW * 0.68;
      ctx.beginPath();
      ctx.arc(x1, yLine, r, 0, Math.PI * 2);
      ctx.fillStyle = PAL.charcoal;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x2, yLine, r * 0.85, 0, Math.PI * 2);
      ctx.fillStyle = PAL.burgundy;
      ctx.fill();

      // 速度矢量箭
      ctx.strokeStyle = PAL.amber;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1 + r + 4, yLine);
      ctx.lineTo(x1 + r + innerW * 0.15, yLine);
      ctx.stroke();
      // 质心琥珀点
      ctx.beginPath();
      ctx.arc((x1 + x2) * 0.5, yLine, 5, 0, Math.PI * 2);
      ctx.fillStyle = PAL.amber;
      ctx.fill();

      ctx.fillStyle = PAL.inkMid;
      ctx.font = `500 ${Math.max(10, bodySize - 1)}px "DM Mono", monospace`;
      ctx.fillText("p1 + p2 = p1' + p2'", innerX + innerW * 0.24, yLine + r + 10);
      ctx.restore();
    } else {
      // 古籍朱墨圈点行格示意
      ctx.save();
      const boxY = figTop + 6;
      const boxH = figH - 12;
      ctx.fillStyle = "rgba(240, 219, 196, 0.55)";
      ctx.fillRect(innerX, boxY, innerW - 8, boxH);
      ctx.strokeStyle = "rgba(95, 14, 18, 0.28)";
      ctx.lineWidth = 1;
      ctx.strokeRect(innerX, boxY, innerW - 8, boxH);
      const quoteStr = "「多行不义，必自毙，子姑待之。」";
      ctx.fillStyle = PAL.ink;
      ctx.font = `700 ${clamp(bodySize + 2, 12, 16)}px "Noto Serif SC", serif`;
      ctx.fillText(quoteStr, innerX + 12, boxY + boxH * 0.30);
      // 朱红旁圈（明代评点标志）
      for (let k = 0; k < 5; k++) {
        ctx.beginPath();
        ctx.arc(innerX + 26 + k * 22, boxY + boxH * 0.72, 3.2, 0, Math.PI * 2);
        ctx.strokeStyle = PAL.burgundy;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.fillStyle = PAL.burgundy;
      ctx.font = `400 ${Math.max(10, bodySize - 1)}px "LXGW WenKai", serif`;
      ctx.fillText("朱圈识文眼 · 墨印存原文", innerX + 142, boxY + boxH * 0.62);
      ctx.restore();
    }

    // 细水平虚线分隔中下区（原海报同款）
    const splitY = pr.y + pr.h * 0.545;
    ctx.save();
    ctx.strokeStyle = "rgba(125, 98, 84, 0.35)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(innerX, splitY);
    ctx.lineTo(innerX + innerW, splitY);
    ctx.stroke();
    ctx.restore();

    // 3. 下半左：四条要点；下半右：暖米砂摘句衬纸（复刻原海报）
    const lowerY = splitY + Math.max(8, pr.h * 0.024);
    const lowerH = pr.y + pr.h - lowerY - Math.max(12, pr.h * 0.036);
    const shortCanvas = pr.h < 275;
    const showQuoteBox = innerW > 220 && !shortCanvas;
    const ptsW = showQuoteBox ? innerW * 0.56 : innerW;

    if (shortCanvas) {
      // 844×390 横屏矮画布：2×2 清爽排布四条要点标题，杜绝行距轻叠
      const colW = ptsW / 2;
      const cellH = lowerH / 2;
      theme.points.forEach((pt, idx) => {
        const cx = innerX + (idx % 2) * colW;
        const ry = lowerY + Math.floor(idx / 2) * cellH + 4;
        ctx.fillStyle = PAL.burgundy;
        ctx.fillRect(cx, ry + 2, 3, 11);
        ctx.fillStyle = PAL.ink;
        ctx.font = `700 11px "Noto Serif SC", serif`;
        ctx.fillText(pt.k, cx + 8, ry);
      });
    } else {
      const rowH = lowerH / 4;
      theme.points.forEach((pt, idx) => {
        const ry = lowerY + idx * rowH;
        // 原海报深绛细竖条
        ctx.fillStyle = PAL.burgundy;
        ctx.fillRect(innerX, ry + 3, 3.5, Math.min(13, bodySize));
        ctx.fillStyle = PAL.ink;
        ctx.font = `700 ${Math.max(10.5, bodySize - 0.5)}px "Noto Serif SC", serif`;
        ctx.fillText(pt.k, innerX + 9, ry);
        ctx.fillStyle = PAL.inkMid;
        ctx.font = `400 ${Math.max(10, bodySize - 1.5)}px "Noto Serif SC", serif`;
        const desc = wrapLines(ctx, pt.v, ptsW - 10, 1)[0] || "";
        ctx.fillText(desc, innerX + 9, ry + Math.max(14, bodySize * 1.25));

        if (idx < 3) {
          ctx.save();
          ctx.strokeStyle = "rgba(125, 98, 84, 0.22)";
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(innerX, ry + rowH - 3);
          ctx.lineTo(innerX + ptsW - 8, ry + rowH - 3);
          ctx.stroke();
          ctx.restore();
        }
      });
    }

    // 右下暖米砂摘句衬纸（原海报标志母题）
    if (showQuoteBox) {
      const qx = innerX + ptsW + 10;
      const qw = innerW - ptsW - 10;
      const qy = lowerY + 4;
      const qh = lowerH - 8;
      ctx.fillStyle = PAL.quoteBg;
      ctx.fillRect(qx, qy, qw, qh);

      // 小书本双叶绛红徽标
      const bx = qx + 14;
      const by = qy + 18;
      ctx.fillStyle = PAL.burgundy;
      ctx.fillRect(bx, by, 9, 12);
      ctx.fillRect(bx + 11, by, 9, 12);
      ctx.fillStyle = PAL.quoteBg;
      ctx.fillRect(bx + 9.5, by, 1, 12);

      // 暗红短杠
      ctx.fillStyle = PAL.burgundy;
      ctx.fillRect(bx, by + 20, 18, 2);

      // 摘句文案
      ctx.fillStyle = PAL.ink;
      ctx.font = `700 ${Math.max(10.5, bodySize - 0.5)}px "LXGW WenKai", serif`;
      const qlines = wrapLines(ctx, theme.quote, qw - 24, 4);
      qlines.forEach((ql, qi) => {
        ctx.fillText(ql, bx, by + 30 + qi * (bodySize * 1.48));
      });

      // 底沿焦琥珀橙短杠
      ctx.fillStyle = PAL.amber;
      ctx.fillRect(bx, qy + qh - 14, Math.min(44, qw * 0.42), 3);
    }

    // 正文纸页底沿点阵装饰（原海报细节）
    ctx.fillStyle = "rgba(95, 14, 18, 0.22)";
    const dx0 = pr.x + pr.w - 44;
    const dy0 = pr.y + pr.h - 26;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        ctx.beginPath();
        ctx.arc(dx0 + c * 7, dy0 + r * 7, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function renderLeadersAndRail(lay) {
    const { paperRect: pr, railX, cards, crossings } = lay;

    // 竖直边注锚环导轨（原海报最核心的垂直连轴）
    ctx.save();
    ctx.strokeStyle = "rgba(95, 14, 18, 0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(railX, pr.y + 12);
    ctx.lineTo(railX, pr.y + pr.h - 12);
    ctx.stroke();

    // 注槽宽度可拖提示竖纹（居中在撕纸右缘与导轨之间）
    const handleX = pr.x + pr.w;
    const handleY = pr.y + pr.h * 0.5;
    const activeGutter =
      drag?.kind === "gutter" || hoverTarget?.kind === "gutter";
    ctx.fillStyle = activeGutter ? PAL.burgundy : PAL.amber;
    ctx.beginPath();
    ctx.roundRect(handleX - 4, handleY - 22, 8, 44, 4);
    ctx.fill();
    ctx.fillStyle = "#FAF2E6";
    ctx.fillRect(handleX - 1.2, handleY - 9, 2.4, 18);
    ctx.restore();

    // 4 条边注折线与正文锚点
    cards.forEach((c, idx) => {
      const isSel = idx === state.selectedNote;
      const isBad = c.crossed || c.driftNormPx > lay.driftThreshold;

      // 正文端朱红锚点（菱形/圆点）
      ctx.save();
      ctx.beginPath();
      ctx.arc(c.anchorX, c.anchorY, isSel ? 4.8 : 3.6, 0, Math.PI * 2);
      ctx.fillStyle = isBad ? PAL.danger : PAL.burgundy;
      ctx.fill();
      ctx.strokeStyle = PAL.paperBg;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // 编号小圆点（正文侧）
      ctx.fillStyle = isBad ? PAL.danger : PAL.burgundy;
      ctx.font = `700 10px "DM Mono", monospace`;
      ctx.textBaseline = "middle";
      ctx.fillText(String(idx + 1), c.anchorX - 13, c.anchorY);

      // 根据 linkStyle 与 showSightline 画引线
      const drawRealLeader =
        state.linkStyle === "leader" ||
        (state.linkStyle === "mixed" && idx !== 2);
      const drawGhostSight =
        !drawRealLeader && (state.showSightline || isBad || isSel);

      if (drawRealLeader || drawGhostSight) {
        const pts = c.leaderPts;
        ctx.beginPath();
        // 按 intro 进度渐进描绘折线
        const totalSegs = pts.length - 1;
        const prog = clamp(intro * 1.35 - idx * 0.08, 0, 1);
        const targetSeg = prog * totalSegs;
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let s = 0; s < totalSegs; s++) {
          const frac = clamp(targetSeg - s, 0, 1);
          if (frac <= 0) break;
          const nx = pts[s].x + (pts[s + 1].x - pts[s].x) * frac;
          const ny = pts[s].y + (pts[s + 1].y - pts[s].y) * frac;
          ctx.lineTo(nx, ny);
        }

        if (drawRealLeader) {
          ctx.strokeStyle = c.crossed
            ? PAL.danger
            : isSel
            ? PAL.burgundy
            : idx === 1
            ? PAL.inkMid
            : PAL.hairline;
          ctx.lineWidth = c.crossed ? 1.8 : isSel ? 1.6 : 1.15;
          if (idx !== 1 || c.crossed) ctx.setLineDash([4, 3]);
          else ctx.setLineDash([]);
        } else {
          // Tufte/无连线下的轻淡视线引导虚线
          ctx.strokeStyle = c.crossed
            ? "rgba(182, 32, 32, 0.55)"
            : "rgba(95, 14, 18, 0.25)";
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 导轨空心绛红锚环（原海报标志）
      ctx.beginPath();
      ctx.arc(c.ringX, c.ringY, isSel ? 5.2 : 4.2, 0, Math.PI * 2);
      ctx.fillStyle = PAL.outerBg;
      ctx.fill();
      ctx.strokeStyle = c.crossed ? PAL.danger : PAL.burgundy;
      ctx.lineWidth = isSel ? 2.4 : 1.8;
      ctx.stroke();
      ctx.restore();
    });

    // 真实几何交点朱红「× 解结」可点击徽标
    crossings.forEach((cr, ci) => {
      const hovered = hoverTarget?.kind === "cross" && hoverTarget.index === ci;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cr.x, cr.y, hovered ? 11 : 9.5, 0, Math.PI * 2);
      ctx.fillStyle = PAL.danger;
      ctx.fill();
      ctx.strokeStyle = "#FAF2E6";
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cr.x - 3.5, cr.y - 3.5);
      ctx.lineTo(cr.x + 3.5, cr.y + 3.5);
      ctx.moveTo(cr.x + 3.5, cr.y - 3.5);
      ctx.lineTo(cr.x - 3.5, cr.y + 3.5);
      ctx.stroke();
      ctx.restore();
    });
  }

  function renderNoteCards(lay, W) {
    const compact = W < 540;
    lay.cards.forEach((c, idx) => {
      const isSel = idx === state.selectedNote;
      const isDrag = drag?.kind === "card" && drag.index === idx;
      const isFlashing = flashTimer > 0 && flashNote === idx;
      const isError = c.crossed || c.collided || c.driftNormPx > lay.driftThreshold;

      ctx.save();

      // 1. 卡片材质：遵循原海报交替纸感（mixed 错态故意穿乱衣裳示警）
      const mixedStyle = state.linkStyle === "mixed";
      const heavy = state.scaleMode === "heavy";

      if (mixedStyle && idx === 0) {
        // 错态 0：笨重实底红块喧宾夺主（不透明纸底避免重影）
        ctx.fillStyle = "#F5D7D3";
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeStyle = PAL.danger;
        ctx.lineWidth = 2.4;
        ctx.strokeRect(c.x, c.y, c.w, c.h);
      } else if (mixedStyle && idx === 2) {
        // 错态 2：粗黑实框异物感
        ctx.fillStyle = "#2E2B28";
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeStyle = PAL.amber;
        ctx.lineWidth = 2;
        ctx.strokeRect(c.x, c.y, c.w, c.h);
      } else if (c.material === "torn-light" || c.material === "kraft") {
        // 轻量实体纸影（零 shadowBlur，软渲染 60fps）
        ctx.fillStyle = isDrag ? "rgba(95, 14, 18, 0.16)" : "rgba(92, 54, 34, 0.11)";
        ctx.fillRect(c.x + 2, c.y + (isDrag ? 5 : 3), c.w, c.h);

        traceDeckleRect(ctx, c.x, c.y, c.w, c.h, 1.4, 31 + idx * 7);
        ctx.fillStyle = c.material === "kraft" ? PAL.kraftBg : PAL.tornLightBg;
        ctx.fill();
        ctx.strokeStyle = isError
          ? PAL.danger
          : isSel
          ? PAL.burgundy
          : "rgba(95, 14, 18, 0.26)";
        ctx.lineWidth = isSel || isError ? 1.5 : 0.9;
        ctx.stroke();
      } else {
        // 原海报宣纸细红棕框卡片（不透明底色避免撞车时透字重影）
        ctx.fillStyle = isSel ? "#FAF2E6" : "#F5E7D5";
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeStyle = isError
          ? PAL.danger
          : isSel
          ? PAL.burgundy
          : PAL.hairline;
        ctx.lineWidth = isSel || isError ? 1.5 : 1;
        ctx.strokeRect(c.x, c.y, c.w, c.h);
      }

      // 对齐磁吸微光
      if (isFlashing) {
        ctx.fillStyle = `rgba(27, 98, 71, ${(flashTimer * 0.25).toFixed(3)})`;
        ctx.fillRect(c.x, c.y, c.w, c.h);
      }

      // 2. 左缘深绛圆徽（原海报标志；Tufte 模式改为清雅序号徽标）
      const darkCard = mixedStyle && idx === 2;
      const shortC = logicalH < 300;
      const badgeR = shortC ? 7.5 : compact ? 9 : 11.5;
      const badgeX = c.x + badgeR + 6;
      const badgeY = c.y + badgeR + (shortC ? 4 : 6);

      if (state.linkStyle === "tufte") {
        ctx.fillStyle = isError ? PAL.danger : PAL.burgundy;
        ctx.font = `700 ${compact ? 11 : 12.5}px "DM Mono", monospace`;
        ctx.textBaseline = "middle";
        ctx.fillText(`${idx + 1}.`, c.x + 8, badgeY);
      } else {
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
        ctx.fillStyle = isError ? PAL.danger : PAL.burgundy;
        ctx.fill();
        drawBadgeIcon(ctx, c.icon, badgeX, badgeY, badgeR);
      }

      // 3. 角色标头 + 英文小标 + 漂移状态小印
      const titleX = state.linkStyle === "tufte" ? c.x + 26 : badgeX + badgeR + 7;
      const roleFont = heavy
        ? (compact ? 12 : 14)
        : state.scaleMode === "micro"
        ? 9.5
        : compact
        ? 11
        : 12.5;
      ctx.fillStyle = darkCard ? "#FAF2E6" : PAL.burgundy;
      ctx.font = `700 ${roleFont}px "Noto Serif SC", serif`;
      ctx.textBaseline = "middle";
      ctx.fillText(c.role, titleX, badgeY);

      const roleW = ctx.measureText(c.role).width;
      if (c.w > 138) {
        ctx.fillStyle = darkCard ? "rgba(250, 242, 230, 0.72)" : PAL.inkSoft;
        ctx.font = `600 ${compact ? 8.5 : 9.5}px "Chivo", sans-serif`;
        ctx.fillText(c.en, titleX + roleW + 5, badgeY + 0.5);
      }

      // 右上实时微标（齐 / 偏 XXpx / 叉）
      const statusTxt = c.crossed
        ? "交叉"
        : c.collided
        ? "撞车"
        : c.driftNormPx <= lay.driftThreshold
        ? "平齐"
        : `偏${c.driftNormPx}`;
      ctx.font = `500 9.5px "DM Mono", monospace`;
      const sw = ctx.measureText(statusTxt).width;
      if (c.w > 102) {
        ctx.fillStyle = isError
          ? darkCard
            ? "#FF9D94"
            : PAL.danger
          : darkCard
          ? "#8CE8C3"
          : PAL.ok;
        ctx.fillText(statusTxt, c.x + c.w - sw - 6, badgeY);
      }

      // 4. 边注正文（霞鹜文楷手记感，heavy 错态故意换粗黑压顶体现喧宾夺主）
      const bodyFontSize = clamp(
        (compact ? 10 : 11.5) * lay.scaleFactor * (heavy ? 1.15 : 1.05),
        8.2,
        14.5
      );
      ctx.fillStyle = darkCard ? "#F4E2CC" : heavy ? PAL.ink : PAL.inkMid;
      ctx.font = heavy
        ? `700 ${bodyFontSize}px "Noto Serif SC", serif`
        : `400 ${bodyFontSize}px "LXGW WenKai", serif`;
      ctx.textBaseline = "top";
      const textTop = c.y + badgeR * 2 + 10;
      const textMaxW = c.w - 14;
      const maxLines = Math.max(1, Math.floor((c.h - (textTop - c.y) - 5) / (bodyFontSize * 1.38)));
      const lines = wrapLines(ctx, c.text, textMaxW, maxLines);
      lines.forEach((ln, li) => {
        ctx.fillText(ln, c.x + 8, textTop + li * (bodyFontSize * 1.36));
      });

      // 右缘轻拖曳三横纹（提示可上下拖拽）
      if (isSel || isDrag) {
        ctx.fillStyle = isError ? PAL.danger : PAL.burgundy;
        for (let k = -1; k <= 1; k++) {
          ctx.fillRect(c.x + c.w - 4, c.centerY + k * 4 - 0.7, 2.5, 1.4);
        }
      }

      ctx.restore();
    });
  }

  function renderTopRuler(lay, W) {
    const { paperRect: pr, cardX, cardW } = lay;
    ctx.save();
    ctx.font = `500 10px "DM Mono", monospace`;
    ctx.textBaseline = "middle";
    const y = Math.max(8, pr.y * 0.5);

    // 主文比例标尺线
    ctx.strokeStyle = "rgba(95, 14, 18, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pr.x, y);
    ctx.lineTo(pr.x + pr.w, y);
    ctx.stroke();

    // 边注比例标尺线（超带标红，合度标绿）
    ctx.strokeStyle = lay.checks.ratioOk ? PAL.ok : PAL.danger;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cardX, y);
    ctx.lineTo(cardX + cardW, y);
    ctx.stroke();

    const lbl = `边注 ${lay.marginPct}%`;
    const lw = ctx.measureText(lbl).width + 10;
    const lx = clamp(cardX + cardW / 2 - lw / 2, cardX, W - lw - 4);
    ctx.fillStyle = PAL.outerBg;
    ctx.fillRect(lx, y - 7, lw, 14);
    ctx.fillStyle = lay.checks.ratioOk ? PAL.ok : PAL.danger;
    ctx.fillText(lbl, lx + 5, y);
    ctx.restore();
  }

  function drawFrame(t, dt, { still }) {
    if (still) {
      intro = 1;
      flashTimer = 0;
    } else {
      if (intro < 1) {
        intro = Math.min(1, intro + Math.max(dt, 0.016) * 1.9);
        dirty = true;
      }
      if (flashTimer > 0) {
        flashTimer = Math.max(0, flashTimer - Math.max(dt, 0.016) * 2.2);
        dirty = true;
      }
    }

    if (!dirty && !still) return;
    dirty = false;

    const W = logicalW;
    const H = logicalH;
    const lay = evaluate(state, W, H);
    lastLayout = lay;

    // 杏仁宣纸底（零 pattern clip 开销，极速 60fps）
    ctx.fillStyle = PAL.outerBg;
    ctx.fillRect(0, 0, W, H);

    // 底部 157 原海报微缩装饰：右下小黑丘 + 焦琥珀圆（极轻不抢内容）
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.arc(W - 36, H + 26, 62, Math.PI, 0);
    ctx.fillStyle = PAL.ink;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W - 76, H - 22, 11, 0, Math.PI * 2);
    ctx.fillStyle = PAL.amber;
    ctx.fill();
    ctx.restore();

    renderTopRuler(lay, W);
    renderPaperContent(lay, W, H);
    renderLeadersAndRail(lay);
    renderNoteCards(lay, W);
  }

  function hitTest(px, py) {
    if (!lastLayout) return null;
    // 1. 优先命中共交红叉
    for (let i = 0; i < lastLayout.crossings.length; i++) {
      const cr = lastLayout.crossings[i];
      if (Math.hypot(px - cr.x, py - cr.y) <= 16) {
        return { kind: "cross", index: i };
      }
    }
    // 2. 命中边注卡（按倒序先命中上层）
    for (let i = lastLayout.cards.length - 1; i >= 0; i--) {
      const c = lastLayout.cards[i];
      if (px >= c.x - 10 && px <= c.x + c.w + 6 && py >= c.y - 4 && py <= c.y + c.h + 4) {
        return { kind: "card", index: i };
      }
    }
    // 3. 命中注槽宽度柄（或画布主体横向滑移调宽，兼容 data-perf-drag 中心横拖！）
    return { kind: "gutter", index: -1 };
  }

  function canvasPoint(ev) {
    const rect = canvas.getBoundingClientRect();
    const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
    const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  }

  function startDrag(px, py, pointerId = null) {
    const hit = hitTest(px, py);
    if (!hit) return;

    if (hit.kind === "cross") {
      // 点击交叉红叉：立刻互换这两张卡片的垂直位置并对齐向各自锚点！
      const cr = lastLayout.crossings[hit.index];
      const theme = lastLayout.theme;
      state.noteY[cr.i] = theme.notes[cr.i].anchorY;
      state.noteY[cr.j] = theme.notes[cr.j].anchorY;
      state.selectedNote = cr.i;
      flashNote = cr.i;
      flashTimer = 1;
      dirty = true;
      onChange("untangle");
      ctl.draw();
      return;
    }

    if (hit.kind === "card") {
      state.selectedNote = hit.index;
      drag = {
        kind: "card",
        index: hit.index,
        pointerId,
        startX: px,
        startY: py,
        startNoteY: state.noteY[hit.index],
        startRatio: state.marginRatio,
        axisLock: null,
      };
      onChange("select");
      dirty = true;
      ctl.draw();
      return;
    }

    drag = {
      kind: "gutter",
      index: -1,
      pointerId,
      startX: px,
      startY: py,
      startRatio: state.marginRatio,
    };
  }

  function moveDrag(px, py) {
    if (!drag || !lastLayout) return;
    const dx = px - drag.startX;
    const dy = py - drag.startY;

    if (drag.kind === "gutter") {
      // 向左拖注槽 -> 边注变宽；向右拖 -> 边注收窄（符合真实拉扯边界直觉）
      const deltaRatio = -dx / Math.max(240, logicalW * 0.92);
      const next = clamp(drag.startRatio + deltaRatio, 0.14, 0.44);
      if (Math.abs(next - state.marginRatio) > 0.0008) {
        state.marginRatio = +next.toFixed(3);
        dirty = true;
        onChange("drag");
        if (reducedMotion.matches) ctl.draw();
      }
      return;
    }

    if (drag.kind === "card") {
      // 同时允许上下对锚 + 大幅度横拖微调边注宽（让手拖卡片极度自然）
      if (!drag.axisLock && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        drag.axisLock = Math.abs(dx) > Math.abs(dy) * 1.45 ? "x" : "y";
      }
      if (drag.axisLock === "x") {
        const deltaRatio = -dx / Math.max(240, logicalW * 0.92);
        state.marginRatio = +clamp(drag.startRatio + deltaRatio, 0.14, 0.44).toFixed(3);
      } else {
        const usableH = lastLayout.paperRect.h;
        let nextY = clamp(drag.startNoteY + dy / usableH, 0.10, 0.90);
        const anchorY = lastLayout.theme.notes[drag.index].anchorY;
        // 靠近对应正文锚点时轻磁吸
        if (Math.abs(nextY - anchorY) < 0.022) {
          if (Math.abs(state.noteY[drag.index] - anchorY) >= 0.004) {
            flashNote = drag.index;
            flashTimer = 0.85;
          }
          nextY = anchorY;
        }
        state.noteY[drag.index] = +nextY.toFixed(4);
      }
      dirty = true;
      onChange("drag");
      if (reducedMotion.matches) ctl.draw();
    }
  }

  function endDrag() {
    if (!drag) return;
    drag = null;
    dirty = true;
    onChange("end");
    ctl.draw();
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const p = canvasPoint(e);
    startDrag(p.x, p.y, e.pointerId);
    if (drag && canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    const p = canvasPoint(e);
    if (drag) {
      moveDrag(p.x, p.y);
    } else {
      const h = hitTest(p.x, p.y);
      const changed =
        !hoverTarget || !h || hoverTarget.kind !== h.kind || hoverTarget.index !== h.index;
      hoverTarget = h;
      canvas.style.cursor =
        h?.kind === "cross"
          ? "pointer"
          : h?.kind === "card"
          ? "grab"
          : "ew-resize";
      if (changed) {
        dirty = true;
        ctl.draw();
      }
    }
  });

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // 原生 touch 事件兜底（确保 CDP Input.dispatchTouchEvent 在各类模拟器上稳健触发）
  let touchActive = false;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (drag) return; // 已由 pointerdown 接管
      if (!e.touches.length) return;
      touchActive = true;
      const p = canvasPoint(e);
      startDrag(p.x, p.y, "touch");
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!touchActive || !drag || !e.touches.length) return;
      const p = canvasPoint(e);
      moveDrag(p.x, p.y);
    },
    { passive: true }
  );
  canvas.addEventListener("touchend", () => {
    if (touchActive) {
      touchActive = false;
      endDrag();
    }
  });

  // 键盘无障碍：方向键调锚位与边注宽，数字 1-4 切选边注卡
  canvas.addEventListener("keydown", (e) => {
    if (["1", "2", "3", "4"].includes(e.key)) {
      state.selectedNote = Number(e.key) - 1;
      dirty = true;
      onChange("select");
      ctl.draw();
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const step = e.key === "ArrowUp" ? -0.025 : 0.025;
      const i = state.selectedNote;
      let ny = clamp(state.noteY[i] + step, 0.10, 0.90);
      const ay = lastLayout?.theme.notes[i].anchorY;
      if (ay != null && Math.abs(ny - ay) < 0.018) ny = ay;
      state.noteY[i] = +ny.toFixed(4);
      dirty = true;
      onChange("key");
      ctl.draw();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const step = e.key === "ArrowLeft" ? 0.015 : -0.015;
      state.marginRatio = +clamp(state.marginRatio + step, 0.14, 0.44).toFixed(3);
      dirty = true;
      onChange("key");
      ctl.draw();
    }
  });

  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(canvas);
  resize();

  const ctl = loop(canvas, drawFrame);
  ctl.draw();

  return {
    redraw() {
      dirty = true;
      ctl.draw();
    },
    getLayout() {
      return lastLayout || evaluate(state, logicalW, logicalH);
    },
  };
}

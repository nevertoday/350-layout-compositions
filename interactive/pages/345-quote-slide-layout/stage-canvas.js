// 345 引语页幻灯片版式 · 16:9 活体幻灯片画布（2D Canvas，标 data-perf-drag）
// 1:1 复刻 345 原海报雾紫水墨纸面、象牙白弯引号半环、绯粉手刷下划线、远山层雾与 3 页演播切页动画。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { evaluate } from "./model.js";

export function createSlideCanvas(canvas, getState, handlers) {
  const ctx = canvas.getContext("2d");

  let W = 800;
  let H = 450;
  let dpr = 1;

  // 离屏静态背景缓存与文本测宽缓存：避免软件渲染下每帧重算渐变、远山与 measureText
  const bgBuf = document.createElement("canvas");
  const bgCtx = bgBuf.getContext("2d");
  let bgKey = "";
  let metricCacheKey = "";
  let metricCache = null;

  // 动效状态
  let intro = 0; // 开场淡入进度 0..1
  let prevTrim = getState().trim;
  let smoothTrim = prevTrim;
  let particles = []; // 删词时飘散的淡紫微雾粒子
  let ripple = null; // 点击画布某区域时的轻波纹
  let rehearsal = null; // Space 3 秒实境翻页演练状态
  let dirty = true;
  let hitZones = {
    mark: null,
    author: null,
    phrases: [],
    ribbon: null,
  };
  let hoverHint = "";

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    // 手机 DPR 限 1.25、桌面限 2，兼顾高清与慢手机软件渲染 50–60fps
    const maxDpr = window.innerWidth <= 650 ? 1.25 : window.innerWidth <= 1024 ? 1.5 : 2;
    dpr = pixelRatio(maxDpr);
    W = Math.round(rect.width);
    H = Math.round(rect.height);
    const pw = Math.round(W * dpr);
    const ph = Math.round(H * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      bgKey = "";
      metricCacheKey = "";
      dirty = true;
    }
  }

  function spawnMist(count = 14) {
    const cx = W * 0.5;
    const cy = H * 0.46;
    for (let i = 0; i < count; i++) {
      if (particles.length > 48) particles.shift();
      const ang = (Math.random() - 0.5) * Math.PI * 1.4;
      const spd = 28 + Math.random() * 58;
      particles.push({
        x: cx + (Math.random() - 0.5) * W * 0.42,
        y: cy + (Math.random() - 0.5) * H * 0.24,
        vx: Math.cos(ang) * spd,
        vy: -14 - Math.random() * 28,
        r: 2.2 + Math.random() * 4.5,
        life: 0,
        maxLife: 0.65 + Math.random() * 0.45,
      });
    }
  }

  function triggerRipple(x, y, color = "#6E3DA6") {
    ripple = { x, y, color, t: 0 };
  }

  function startRehearsal() {
    rehearsal = { t: 0 };
    ctl.draw();
  }

  function stopRehearsal() {
    rehearsal = null;
  }

  function isRehearsing() {
    return !!rehearsal;
  }

  // ---------- 基础矢量绘制工具 ----------
  function roundRectPath(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawFourPointStar(cx, cy, r, fill) {
    ctx.save();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx + r * 0.14, cy - r * 0.14, cx + r * 0.88, cy);
    ctx.quadraticCurveTo(cx + r * 0.14, cy + r * 0.14, cx, cy + r);
    ctx.quadraticCurveTo(cx - r * 0.14, cy + r * 0.14, cx - r * 0.88, cy);
    ctx.quadraticCurveTo(cx - r * 0.14, cy - r * 0.14, cx, cy - r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawMistyMountains(isDark) {
    // 1:1 复刻 345 原海报底部三层柔和薰衣草水墨远山
    ctx.save();
    // 远山右坡
    ctx.fillStyle = isDark ? "rgba(126, 94, 176, 0.16)" : "rgba(210, 193, 229, 0.42)";
    ctx.beginPath();
    ctx.moveTo(W * 0.42, H);
    ctx.bezierCurveTo(W * 0.56, H * 0.89, W * 0.78, H * 0.82, W, H * 0.91);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    // 中山左峰
    ctx.fillStyle = isDark ? "rgba(96, 66, 146, 0.24)" : "rgba(187, 166, 209, 0.46)";
    ctx.beginPath();
    ctx.moveTo(0, H * 0.90);
    ctx.bezierCurveTo(W * 0.16, H * 0.84, W * 0.34, H * 0.91, W * 0.58, H * 0.96);
    ctx.lineTo(W * 0.78, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // 近山柔雾
    ctx.fillStyle = isDark ? "rgba(72, 46, 118, 0.32)" : "rgba(174, 151, 197, 0.44)";
    ctx.beginPath();
    ctx.moveTo(0, H * 0.96);
    ctx.bezierCurveTo(W * 0.22, H * 0.91, W * 0.44, H * 0.95, W * 0.68, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 手刷绯粉水彩下划线（1:1 呼应原海报「而是为了承载思考。」底下的折返粉红笔触）
  function drawBlushStroke(x, y, w, isDark) {
    ctx.save();
    ctx.strokeStyle = isDark ? "rgba(244, 182, 215, 0.68)" : "rgba(236, 157, 197, 0.76)";
    ctx.lineWidth = Math.max(4, H * 0.015);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x - w * 0.06, y + 3);
    ctx.quadraticCurveTo(x + w * 0.38, y - 3, x + w * 0.82, y - 1);
    ctx.lineTo(x + w * 0.36, y + 4);
    ctx.quadraticCurveTo(x + w * 0.72, y + 1, x + w * 1.06, y + 2);
    ctx.stroke();

    ctx.strokeStyle = isDark ? "rgba(244, 182, 215, 0.35)" : "rgba(236, 157, 197, 0.42)";
    ctx.lineWidth = Math.max(2, H * 0.008);
    ctx.beginPath();
    ctx.moveTo(x, y + 6);
    ctx.quadraticCurveTo(x + w * 0.5, y + 2, x + w * 0.98, y + 5);
    ctx.stroke();
    ctx.restore();
  }

  // ---------- 绘制前页（01 密字铺垫页） ----------
  function drawPrevSlide(ev, alpha = 1) {
    const p = ev.scenario.prevSlide;
    ctx.save();
    ctx.globalAlpha = alpha;
    // 故意用偏冷灰密字商报风格，衬托切入 345 引语页时的剧烈「呼吸反差」
    ctx.fillStyle = "#F3EFF8";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#53237C";
    ctx.fillRect(0, 0, W, Math.max(5, H * 0.014));

    const padX = W * 0.075;
    const padY = H * 0.11;
    ctx.fillStyle = "#5A3B82";
    ctx.font = `600 ${Math.max(10, Math.round(H * 0.028))}px "DM Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(p.kicker, padX, padY);

    ctx.fillStyle = "#160A29";
    ctx.font = `900 ${Math.max(16, Math.round(H * 0.056))}px "Noto Serif SC", serif`;
    ctx.fillText(p.title, padX, padY + H * 0.055);

    ctx.strokeStyle = "rgba(83, 35, 124, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, padY + H * 0.145);
    ctx.lineTo(W - padX, padY + H * 0.145);
    ctx.stroke();

    const itemFs = Math.max(11, Math.round(H * 0.032));
    ctx.font = `400 ${itemFs}px "Noto Serif SC", serif`;
    let y = padY + H * 0.19;
    for (let i = 0; i < p.bullets.length; i++) {
      ctx.fillStyle = "rgba(83, 35, 124, 0.10)";
      roundRectPath(padX, y, W - padX * 2, H * 0.125, 6);
      ctx.fill();
      ctx.fillStyle = "#6E3DA6";
      ctx.beginPath();
      ctx.arc(padX + 16, y + H * 0.062, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2A1845";
      ctx.textBaseline = "middle";
      ctx.fillText(p.bullets[i], padX + 32, y + H * 0.062, W - padX * 2 - 44);
      y += H * 0.148;
    }

    // 右下角提示标签
    ctx.fillStyle = "#4A2270";
    ctx.font = `500 ${Math.max(10, Math.round(H * 0.025))}px "Outfit", "Noto Serif SC", sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("前页：高密度铺垫（点击切回 02 引语页感受停顿反差）", W - padX, H - H * 0.05);
    ctx.restore();
  }

  // ---------- 绘制后页（03 行动结论页） ----------
  function drawNextSlide(ev, alpha = 1) {
    const n = ev.scenario.nextSlide;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#F6F1FC";
    ctx.fillRect(0, 0, W, H);
    drawMistyMountains(false);

    const padX = W * 0.075;
    ctx.fillStyle = "#5A3B82";
    ctx.font = `600 ${Math.max(10, Math.round(H * 0.028))}px "DM Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(n.kicker, padX, H * 0.12);

    ctx.fillStyle = "#160A29";
    ctx.font = `900 ${Math.max(16, Math.round(H * 0.056))}px "Noto Serif SC", serif`;
    ctx.fillText(n.title, padX, H * 0.185);

    const colW = (W - padX * 2 - 28) / 3;
    for (let i = 0; i < n.steps.length; i++) {
      const x = padX + i * (colW + 14);
      const y = H * 0.36;
      const ch = H * 0.36;
      ctx.fillStyle = "#FFFFFF";
      roundRectPath(x, y, colW, ch, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(83, 35, 124, 0.22)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#6E3DA6";
      ctx.font = `600 ${Math.max(12, Math.round(H * 0.042))}px "DM Mono", monospace`;
      ctx.fillText(`0${i + 1}`, x + 16, y + 18);

      ctx.fillStyle = "#160A29";
      ctx.font = `700 ${Math.max(12, Math.round(H * 0.036))}px "Noto Serif SC", serif`;
      ctx.fillText(n.steps[i], x + 16, y + ch * 0.56, colW - 32);
    }

    ctx.fillStyle = "#4A2270";
    ctx.font = `500 ${Math.max(10, Math.round(H * 0.025))}px "Outfit", "Noto Serif SC", sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("后页：承接引语页情绪，落到具体行动（点胶片条回到 02 引语页）", W - padX, H - H * 0.05);
    ctx.restore();
  }

  // 缓存纸面底色、左上晕染、底部远山、右上 3×3 点阵与拥挤模板页眉到离屏画布
  function ensureBgCache(isDark, cramped) {
    const key = `${W}x${H}@${dpr}|${isDark ? 1 : 0}|${cramped ? 1 : 0}`;
    if (bgKey === key) return;
    bgKey = key;
    bgBuf.width = Math.max(1, Math.round(W * dpr));
    bgBuf.height = Math.max(1, Math.round(H * dpr));
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (isDark) {
      const bg = bgCtx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#1D1033");
      bg.addColorStop(0.55, "#150B26");
      bg.addColorStop(1, "#20123A");
      bgCtx.fillStyle = bg;
      bgCtx.fillRect(0, 0, W, H);

      const glow = bgCtx.createRadialGradient(W * 0.16, H * 0.12, 10, W * 0.16, H * 0.12, W * 0.5);
      glow.addColorStop(0, "rgba(148, 104, 214, 0.20)");
      glow.addColorStop(1, "rgba(21, 11, 38, 0)");
      bgCtx.fillStyle = glow;
      bgCtx.fillRect(0, 0, W, H);
    } else {
      const bg = bgCtx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#EFE7F8");
      bg.addColorStop(0.5, "#EAE0F5");
      bg.addColorStop(1, "#E5D8F1");
      bgCtx.fillStyle = bg;
      bgCtx.fillRect(0, 0, W, H);

      bgCtx.fillStyle = "rgba(214, 196, 234, 0.50)";
      bgCtx.beginPath();
      bgCtx.arc(W * 0.08, H * 0.02, W * 0.30, 0, Math.PI * 2);
      bgCtx.fill();
    }

    if (cramped) {
      bgCtx.fillStyle = isDark ? "rgba(182, 140, 238, 0.14)" : "rgba(83, 35, 124, 0.12)";
      bgCtx.fillRect(0, 0, W, H * 0.095);
      bgCtx.fillStyle = isDark ? "#D4B5FA" : "#4A2270";
      bgCtx.font = `500 ${Math.max(9, Math.round(H * 0.023))}px "Outfit", "Noto Serif SC", sans-serif`;
      bgCtx.textAlign = "left";
      bgCtx.textBaseline = "middle";
      bgCtx.fillText("2026 年度汇报 · 第三章 · 行业洞察与参考引用（密闭模板页眉）", W * 0.04, H * 0.048);

      bgCtx.strokeStyle = isDark ? "rgba(236, 157, 197, 0.4)" : "rgba(166, 52, 92, 0.35)";
      bgCtx.lineWidth = 1.25;
      bgCtx.setLineDash([5, 4]);
      bgCtx.strokeRect(W * 0.035, H * 0.12, W * 0.93, H * 0.72);
      bgCtx.setLineDash([]);

      bgCtx.fillStyle = isDark ? "rgba(232, 93, 117, 0.2)" : "rgba(180, 42, 74, 0.10)";
      bgCtx.fillRect(W * 0.72, H * 0.135, W * 0.225, H * 0.055);
      bgCtx.fillStyle = isDark ? "#FFB4C2" : "#9E1F42";
      bgCtx.font = `600 ${Math.max(9, Math.round(H * 0.021))}px "Outfit", "Noto Serif SC", sans-serif`;
      bgCtx.textAlign = "center";
      bgCtx.fillText("× 多余模板框线 · 抢留白", W * 0.832, H * 0.163);
    }

    // 远山三层
    bgCtx.fillStyle = isDark ? "rgba(126, 94, 176, 0.16)" : "rgba(210, 193, 229, 0.42)";
    bgCtx.beginPath();
    bgCtx.moveTo(W * 0.42, H);
    bgCtx.bezierCurveTo(W * 0.56, H * 0.89, W * 0.78, H * 0.82, W, H * 0.91);
    bgCtx.lineTo(W, H);
    bgCtx.closePath();
    bgCtx.fill();

    bgCtx.fillStyle = isDark ? "rgba(96, 66, 146, 0.24)" : "rgba(187, 166, 209, 0.46)";
    bgCtx.beginPath();
    bgCtx.moveTo(0, H * 0.90);
    bgCtx.bezierCurveTo(W * 0.16, H * 0.84, W * 0.34, H * 0.91, W * 0.58, H * 0.96);
    bgCtx.lineTo(W * 0.78, H);
    bgCtx.lineTo(0, H);
    bgCtx.closePath();
    bgCtx.fill();

    bgCtx.fillStyle = isDark ? "rgba(72, 46, 118, 0.32)" : "rgba(174, 151, 197, 0.44)";
    bgCtx.beginPath();
    bgCtx.moveTo(0, H * 0.96);
    bgCtx.bezierCurveTo(W * 0.22, H * 0.91, W * 0.44, H * 0.95, W * 0.68, H);
    bgCtx.lineTo(0, H);
    bgCtx.closePath();
    bgCtx.fill();

    // 右上 3×3 点阵
    if (!cramped) {
      bgCtx.fillStyle = isDark ? "rgba(212, 181, 250, 0.45)" : "rgba(78, 50, 110, 0.55)";
      const dotStep = Math.max(7, W * 0.013);
      const dotX0 = W - W * 0.068;
      const dotY0 = H * 0.072;
      const dr = Math.max(1.4, W * 0.0024);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          bgCtx.beginPath();
          bgCtx.arc(dotX0 + c * dotStep, dotY0 + r * dotStep, dr, 0, Math.PI * 2);
          bgCtx.fill();
        }
      }
    }
  }

  // ---------- 绘制核心 02 引语页（1:1 转译 345 原海报美学） ----------
  function drawQuoteSlide(state, ev, t, still) {
    const isDark = state.align === "theater";
    const isLeft = state.align === "left" || state.mark === "bar";
    hitZones = { mark: null, author: null, phrases: [], ribbon: null };

    // 1–3. 一次 blit 静态缓存底纸 + 远山 + 3×3 点阵 + 拥挤模板杂讯
    ensureBgCache(isDark, state.space === "cramped");
    ctx.drawImage(bgBuf, 0, 0, W, H);

    // 4. 象牙白半圆光环（原海报标志图形，随 smoothTrim 呼吸开合）
    const trimFrac = smoothTrim / 100;
    const breathe = still ? 0 : Math.sin(t * 1.4) * 2.2;
    const arcCx = isLeft ? W * 0.52 : W * 0.5;
    const arcCy = H * 0.455;
    const arcBaseR = Math.min(W, H) * (state.space === "island" ? 0.24 : 0.30 + trimFrac * 0.065) + breathe;

    if (state.mark === "arc" && !isLeft) {
      ctx.save();
      ctx.strokeStyle = isDark ? "rgba(255, 247, 254, 0.42)" : "rgba(255, 252, 252, 0.88)";
      ctx.lineWidth = Math.max(2.5, H * 0.0085);
      ctx.lineCap = "round";
      // 上右弧（从 11 点半到 4 点半）
      ctx.beginPath();
      ctx.arc(arcCx, arcCy, arcBaseR, -Math.PI * 0.58, Math.PI * 0.15);
      ctx.stroke();
      // 左下弧（从 7 点半到 10 点半）
      ctx.beginPath();
      ctx.arc(arcCx, arcCy, arcBaseR, Math.PI * 0.68, Math.PI * 1.15);
      ctx.stroke();
      ctx.restore();
    }

    // 5. 计算真实引文排版几何（单一真源同步 fontPt）
    const pxPerPt = H / 260;
    const fontPx = Math.max(12, Math.min(H * 0.13, ev.fontPt * pxPerPt * 0.66));
    const lineHeight = fontPx * (ev.lineCount >= 4 ? 1.52 : 1.44);
    const totalTextH = ev.stage.lines.length * lineHeight;
    const anchorY = (state.space === "cramped" ? H * 0.46 : H * 0.445) - totalTextH / 2 + fontPx * 0.48;
    const leftEdgeX = W * 0.18;

    // 引号几何位置
    const qOpenX = isLeft ? leftEdgeX - fontPx * 0.25 : arcCx - arcBaseR * 0.80;
    const qOpenY = isLeft ? anchorY - fontPx * 1.05 : arcCy - arcBaseR * 0.66;
    const qCloseX = arcCx + arcBaseR * 0.78;
    const qCloseY = arcCy + arcBaseR * 0.62;

    // 先测算每行视觉宽度并按状态缓存，避免每帧重复 measureText
    const weight = ev.stageIdx >= 2 ? 900 : 700;
    const maxAllowedW = W * (state.space === "cramped" ? 0.80 : 0.74);
    const mKey = `${state.scenario}|${ev.stageIdx}|${fontPx.toFixed(1)}|${W}|${isLeft ? 1 : 0}|${state.space}`;
    if (metricCacheKey !== mKey) {
      metricCacheKey = mKey;
      ctx.save();
      ctx.font = `${weight} ${fontPx}px "Noto Serif SC", serif`;
      metricCache = ev.stage.lines.map((lineSegs) => {
        const segWidths = lineSegs.map((s) => ctx.measureText(s.t).width);
        const rawLineW = segWidths.reduce((a, b) => a + b, 0);
        const scaleX = rawLineW > maxAllowedW ? maxAllowedW / rawLineW : 1;
        const lineW = rawLineW * scaleX;
        const startX = isLeft ? leftEdgeX : (W - lineW) / 2;
        return { lineSegs, segWidths, scaleX, lineW, startX, endX: startX + lineW };
      });
      ctx.restore();
    }
    const lineMetrics = metricCache;

    const firstM = lineMetrics[0];
    const lastM = lineMetrics[lineMetrics.length - 1];

    // 6. 先画引号（当 crushing 坏态时故意后画盖字以直观呈现压字事故！）
    const drawMarks = () => {
      ctx.save();
      if (state.mark === "arc") {
        const qSize = Math.round(Math.max(42, H * 0.21));
        ctx.font = `400 ${qSize}px "Young Serif", "Noto Serif SC", serif`;
        ctx.fillStyle = isDark ? "rgba(255, 250, 254, 0.88)" : "#FFFCFC";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("“", qOpenX, qOpenY + qSize * 0.18);
        if (!isLeft) {
          ctx.fillText("”", qCloseX, qCloseY + qSize * 0.20);
        }
        hitZones.mark = { x: qOpenX - qSize * 0.45, y: qOpenY - qSize * 0.45, w: qSize * 0.9, h: qSize * 0.9 };
      } else if (state.mark === "bar") {
        const barX = isLeft ? leftEdgeX - Math.max(18, W * 0.032) : W * 0.16;
        const barTop = anchorY - fontPx * 0.65;
        const barH = totalTextH + fontPx * 0.25;
        ctx.fillStyle = isDark ? "#D4B5FA" : "#6E3DA6";
        roundRectPath(barX, barTop, Math.max(4.5, W * 0.0075), barH, 3);
        ctx.fill();
        hitZones.mark = { x: barX - 18, y: barTop - 12, w: 44, h: barH + 24 };
      } else if (state.mark === "straight") {
        const qSize = Math.round(Math.max(22, Math.min(34, H * 0.092)));
        ctx.font = `500 ${qSize}px "DM Mono", monospace`;
        ctx.fillStyle = isDark ? "#FF92A8" : "#A82046";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const sx = Math.max(W * 0.085, firstM.startX - qSize * 0.62);
        const sy = Math.max(H * 0.215, anchorY - fontPx * 0.72);
        const ex = Math.min(W * 0.915, lastM.endX + qSize * 0.55);
        const ey = anchorY + (lineMetrics.length - 1) * lineHeight + fontPx * 0.12;
        ctx.fillText('"', sx, sy);
        ctx.fillText('"', ex, ey);
        // 小错态圈标
        ctx.strokeStyle = isDark ? "#FF92A8" : "#B4234A";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(sx - qSize * 0.42, sy - qSize * 0.44, qSize * 0.84, qSize * 0.84);
        ctx.setLineDash([]);
        hitZones.mark = { x: sx - qSize * 0.5, y: sy - qSize * 0.5, w: qSize, h: qSize };
      } else if (state.mark === "crushing") {
        const qSize = Math.round(Math.max(76, H * 0.44));
        ctx.font = `400 ${qSize}px "Young Serif", serif`;
        ctx.fillStyle = isDark ? "rgba(186, 114, 245, 0.72)" : "rgba(83, 35, 124, 0.62)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const cx = isLeft ? leftEdgeX + fontPx * 0.7 : W * 0.33;
        const cy = anchorY + fontPx * 0.4;
        ctx.fillText("“", cx, cy);
        hitZones.mark = { x: cx - qSize * 0.38, y: cy - qSize * 0.42, w: qSize * 0.76, h: qSize * 0.76 };
      }
      ctx.restore();
    };

    if (state.mark !== "crushing") drawMarks();

    // 7. 绘制引文逐行与逐词（记录每个词的精确可点区域 + 重点词紫粉水彩笔触）
    const activeHi = new Set(state.highlights || []);
    const baseInk = isDark ? "#F7F1FC" : "#120624";
    const hiInk = isDark ? "#DFB8FF" : "#6E3DA6";

    ctx.save();
    ctx.font = `${weight} ${fontPx}px "Noto Serif SC", serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    for (let li = 0; li < lineMetrics.length; li++) {
      const { lineSegs, segWidths, scaleX, startX } = lineMetrics[li];
      const cy = anchorY + li * lineHeight;

      let cursorX = startX;
      for (let si = 0; si < lineSegs.length; si++) {
        const seg = lineSegs[si];
        const sw = segWidths[si] * scaleX;
        const isEm = activeHi.has(seg.t);

        // 先画重点词背后的绯粉水彩笔触（仅重点词生效，满屏超过 52% 时呈告警红淡底）
        if (isEm) {
          if (ev.hiRatio > 0.52) {
            ctx.fillStyle = isDark ? "rgba(255, 118, 146, 0.24)" : "rgba(196, 48, 86, 0.16)";
            roundRectPath(cursorX - 2, cy - fontPx * 0.56, sw + 4, fontPx * 1.12, 4);
            ctx.fill();
          } else {
            drawBlushStroke(cursorX, cy + fontPx * 0.54, sw, isDark);
          }
        }

        ctx.save();
        if (scaleX < 1) {
          ctx.translate(cursorX, cy);
          ctx.scale(scaleX, 1);
          ctx.fillStyle = isEm ? hiInk : baseInk;
          ctx.fillText(seg.t, 0, 0);
        } else {
          ctx.fillStyle = isEm ? hiInk : baseInk;
          ctx.fillText(seg.t, cursorX, cy);
        }
        ctx.restore();

        // 仅非标点短语可点击切换高亮
        if (seg.t.replace(/[，。！？、；：“”‘’\s]/g, "").length >= 2) {
          hitZones.phrases.push({
            text: seg.t,
            x: cursorX - 3,
            y: cy - fontPx * 0.62,
            w: sw + 6,
            h: fontPx * 1.24,
          });
        }
        cursorX += sw;
      }
    }

    // 若书页原句场景在甜点态，下方附一行克制的小号英文原句核对行
    let extraSubH = 0;
    if (ev.stage.enSub && state.space !== "island") {
      extraSubH = Math.max(16, H * 0.048);
      ctx.font = `400 ${Math.max(10, Math.round(H * 0.025))}px "Outfit", sans-serif`;
      ctx.fillStyle = isDark ? "rgba(222, 200, 248, 0.72)" : "rgba(74, 34, 112, 0.72)";
      ctx.textAlign = isLeft ? "left" : "center";
      ctx.fillText(ev.stage.enSub, isLeft ? leftEdgeX : W / 2, anchorY + totalTextH + extraSubH * 0.18, W * 0.74);
    }
    ctx.restore();

    if (state.mark === "crushing") drawMarks();

    // 8. 署名区（清晰可点击热区）
    const authY = Math.min(H * 0.805, anchorY + totalTextH + extraSubH + Math.max(24, H * 0.075));
    const authData = ev.scenario.author[state.author];
    ctx.save();
    ctx.textBaseline = "middle";
    ctx.textAlign = isLeft ? "left" : "center";
    const authX = isLeft ? leftEdgeX : W / 2;

    if (state.author === "none") {
      const boxW = Math.max(120, W * 0.22);
      const bx = isLeft ? authX : authX - boxW / 2;
      ctx.strokeStyle = isDark ? "rgba(255, 146, 168, 0.65)" : "rgba(176, 36, 74, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      roundRectPath(bx, authY - 13, boxW, 26, 4);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = isDark ? "#FFB4C2" : "#9E1F42";
      ctx.font = `500 ${Math.max(10, Math.round(H * 0.025))}px "Outfit", "Noto Serif SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("× 缺少署名（点此补来源）", bx + boxW / 2, authY);
      hitZones.author = { x: bx - 8, y: authY - 18, w: boxW + 16, h: 36 };
    } else if (state.author === "bloated") {
      // 故意比引文还抢眼的错态署名
      const bigFs = Math.max(16, Math.round(fontPx * 0.92));
      ctx.fillStyle = isDark ? "#FF92A8" : "#9E1F42";
      ctx.font = `900 ${bigFs}px "Noto Serif SC", serif`;
      ctx.fillText(`—— ${authData.main}`, authX, authY - 6, W * 0.82);
      ctx.fillStyle = isDark ? "rgba(255, 194, 206, 0.88)" : "#682644";
      ctx.font = `500 ${Math.max(10, Math.round(H * 0.025))}px "Noto Serif SC", serif`;
      ctx.fillText(authData.sub, authX, authY + bigFs * 0.72, W * 0.84);
      hitZones.author = { x: W * 0.14, y: authY - bigFs * 0.7, w: W * 0.72, h: bigFs * 1.9 };
    } else {
      const aFs = Math.max(12, Math.round(H * 0.036));
      const isVague = state.author === "vague";
      ctx.fillStyle = isVague
        ? (isDark ? "#FFB4C2" : "#9E1F42")
        : (isDark ? "#F0E4FC" : "#220D3B");
      ctx.font = `700 ${aFs}px "Noto Serif SC", serif`;
      ctx.fillText(`—— ${authData.main}`, authX, authY);
      if (authData.sub) {
        ctx.fillStyle = isDark ? "rgba(218, 198, 245, 0.76)" : "#4C356C";
        ctx.font = `400 ${Math.max(10, Math.round(H * 0.025))}px "Noto Serif SC", serif`;
        ctx.fillText(authData.sub, authX, authY + aFs * 1.05, W * 0.72);
      } else if (isVague) {
        ctx.fillStyle = isDark ? "rgba(255, 180, 194, 0.78)" : "#9E1F42";
        ctx.font = `500 ${Math.max(9.5, Math.round(H * 0.022))}px "Outfit", "Noto Serif SC", sans-serif`;
        ctx.fillText("来源含糊 · 点此换成可信署名", authX, authY + aFs * 1.0);
      }
      const hw = Math.max(160, W * 0.32);
      hitZones.author = { x: isLeft ? authX - 10 : authX - hw / 2, y: authY - 18, w: hw, h: 48 };
    }
    ctx.restore();

    // 9. 底部淡紫四芒星（原海报签名装饰）
    if (!isLeft && state.author !== "bloated") {
      drawFourPointStar(W * 0.5, H * 0.905, Math.max(7, H * 0.022), isDark ? "rgba(212, 181, 250, 0.55)" : "#A88ABB");
    }

    // 10. 删词飘散粒子
    if (particles.length) {
      ctx.save();
      for (const p of particles) {
        const a = Math.max(0, 1 - p.life / p.maxLife);
        ctx.fillStyle = isDark ? `rgba(212, 181, 250, ${a * 0.6})` : `rgba(110, 61, 166, ${a * 0.42})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.6 + a * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 11. 轻点击波纹
    if (ripple) {
      ctx.save();
      const prog = Math.min(1, ripple.t / 0.45);
      ctx.strokeStyle = ripple.color;
      ctx.globalAlpha = (1 - prog) * 0.55;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, 10 + prog * 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 12. 画布内底沿「删词提纯尺」微导轨（直接响应横向拖拽！）
    const ribPad = W * 0.06;
    const ribY = H - Math.max(14, H * 0.042);
    const ribW = W - ribPad * 2;
    ctx.save();
    ctx.strokeStyle = isDark ? "rgba(212, 181, 250, 0.24)" : "rgba(83, 35, 124, 0.20)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ribPad, ribY);
    ctx.lineTo(ribPad + ribW, ribY);
    ctx.stroke();

    // 甜点区间淡紫高光（67%–88%）
    const sweetX0 = ribPad + ribW * 0.67;
    const sweetX1 = ribPad + ribW * 0.88;
    ctx.strokeStyle = isDark ? "rgba(134, 232, 190, 0.55)" : "rgba(28, 122, 88, 0.45)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(sweetX0, ribY);
    ctx.lineTo(sweetX1, ribY);
    ctx.stroke();

    // 当前提纯进度游标
    const knobX = ribPad + ribW * trimFrac;
    ctx.fillStyle = ev.pillars.focus.ok
      ? (isDark ? "#86E8BE" : "#1C7A58")
      : (isDark ? "#F4B6D7" : "#6E3DA6");
    ctx.beginPath();
    ctx.arc(knobX, ribY, Math.max(4.5, H * 0.013), 0, Math.PI * 2);
    ctx.fill();

    // 顶部角标极轻 HUD（只显示从 model.js 来的实算指标）
    ctx.font = `500 ${Math.max(10, Math.round(H * 0.024))}px "DM Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = isDark ? "rgba(222, 200, 248, 0.78)" : "rgba(57, 23, 89, 0.78)";
    ctx.fillText(
      `02/03 · ${ev.chars}字 · 留白${ev.whitespacePct}% · 扫读约${ev.readSec}s`,
      W * 0.04,
      state.space === "cramped" ? H * 0.135 : H * 0.042
    );

    if (hoverHint) {
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = `500 ${Math.max(10, Math.round(H * 0.023))}px "Outfit", "Noto Serif SC", sans-serif`;
      ctx.fillStyle = isDark ? "#F4B6D7" : "#4A2270";
      ctx.fillText(hoverHint, W * 0.5, ribY - 7);
    }
    ctx.restore();
    hitZones.ribbon = { x: ribPad - 12, y: ribY - 16, w: ribW + 24, h: 32 };
  }

  // ---------- 3 秒实境翻页演练叠加层（Space 触发） ----------
  function drawRehearsalOverlay(state, ev) {
    if (!rehearsal) return;
    const rt = rehearsal.t;
    // 0.0–1.05s：闪映上一页密字页
    if (rt < 1.05) {
      drawPrevSlide(ev, 1);
      ctx.save();
      ctx.fillStyle = "rgba(22, 10, 41, 0.78)";
      roundRectPath(W * 0.04, H * 0.04, Math.min(W * 0.56, 300), 30, 6);
      ctx.fill();
      ctx.fillStyle = "#F7F1FC";
      ctx.font = `600 ${Math.max(10, Math.round(H * 0.025))}px "Outfit", "Noto Serif SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("实境演练 · 刚讲完高密度铺垫页，准备翻页…", W * 0.04 + 12, H * 0.04 + 15);
      ctx.restore();
      return;
    }

    // 1.05–4.4s：切入引语页并运行 3 秒观众凝视计时光环
    const elapsed = rt - 1.05;
    const dur = 3.0;
    const pct = Math.min(1, elapsed / dur);
    const readPct = Math.min(1, elapsed / Math.max(0.5, ev.readSec));
    const finishedInTime = ev.readSec <= 3.1 && ev.score === 4;

    ctx.save();
    // 顶部进度细条
    ctx.fillStyle = "rgba(83, 35, 124, 0.16)";
    ctx.fillRect(0, 0, W, 5);
    ctx.fillStyle = finishedInTime ? "#1C7A58" : ev.readSec > 3.2 ? "#B4234A" : "#6E3DA6";
    ctx.fillRect(0, 0, W * pct, 5);

    // 观众凝视光点扫过引文区域
    const scanX = W * (0.24 + readPct * 0.52);
    const scanY = H * (0.38 + Math.sin(readPct * Math.PI * 2) * 0.06);
    if (elapsed < dur) {
      ctx.strokeStyle = finishedInTime ? "rgba(28, 122, 88, 0.55)" : "rgba(180, 35, 74, 0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(scanX, scanY, 12 + Math.sin(elapsed * 8) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 底部结论胶囊
    const pillW = Math.min(W * 0.88, 460);
    const pillH = 34;
    const px = (W - pillW) / 2;
    const py = H * 0.055;
    ctx.fillStyle = finishedInTime
      ? "rgba(20, 86, 62, 0.90)"
      : elapsed > 2.6 && ev.readSec > 3.1
        ? "rgba(150, 26, 58, 0.92)"
        : "rgba(32, 16, 58, 0.88)";
    roundRectPath(px, py, pillW, pillH, 17);
    ctx.fill();

    ctx.fillStyle = "#FFFDFC";
    ctx.font = `600 ${Math.max(10, Math.round(H * 0.025))}px "Outfit", "Noto Serif SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let msg;
    if (elapsed < dur) {
      msg = ev.readSec <= 3.1
        ? `3 秒凝视验真 · ${elapsed.toFixed(1)}s（预计 ${ev.readSec}s 扫完，随后抬头听你讲）`
        : `3 秒凝视验真 · ${elapsed.toFixed(1)}s（约需 ${ev.readSec}s，观众仍在低头读字！）`;
    } else {
      msg = finishedInTime
        ? `✓ 3 秒内扫完且四桩齐全：全场目光已交还给演讲者`
        : ev.readSec > 3.1
          ? `× 超过 3 秒仍未读完：讲者已开口，台下还在读字墙`
          : `△ 读速够快，但还有 ${4 - ev.score} 处版式细节待修`;
    }
    ctx.fillText(msg, W / 2, py + pillH / 2, pillW - 20);
    ctx.restore();
  }

  // ---------- 主循环帧函数（仅在脏态或真动画时绘制，避免软件渲染静置空转） ----------
  const ctl = loop(canvas, (t, dt, { still }) => {
    resize();
    const state = getState();

    const trimDelta = Math.abs(state.trim - smoothTrim);
    const hasAnim = intro < 1 || trimDelta > 0.08 || particles.length > 0 || !!ripple || !!rehearsal;

    if (!still && !dirty && !hasAnim) return;

    const ev = evaluate(state);
    dirty = false;

    if (still) {
      intro = 1;
      smoothTrim = state.trim;
    } else {
      intro = Math.min(1, intro + dt * 2.2);
      if (trimDelta > 0.08) {
        smoothTrim += (state.trim - smoothTrim) * Math.min(1, dt * 16);
      } else {
        smoothTrim = state.trim;
      }
      if (Math.abs(state.trim - prevTrim) >= 10) {
        spawnMist(8);
        prevTrim = state.trim;
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.life >= p.maxLife) particles.splice(i, 1);
      }
      if (ripple) {
        ripple.t += dt;
        if (ripple.t > 0.45) ripple = null;
      }
      if (rehearsal) {
        rehearsal.t += dt;
        if (rehearsal.t > 5.0) {
          rehearsal = null;
          handlers.onRehearsalEnd?.();
        }
      }
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    if (rehearsal && rehearsal.t < 1.05) {
      drawRehearsalOverlay(state, ev);
    } else if (state.deckSlide === 0 && !rehearsal) {
      drawPrevSlide(ev, 1);
    } else if (state.deckSlide === 2 && !rehearsal) {
      drawNextSlide(ev, 1);
    } else {
      drawQuoteSlide(state, ev, t, still);
      if (rehearsal) drawRehearsalOverlay(state, ev);
    }

    ctx.restore();
  });

  // ---------- 指针与触屏交互（横向拖动调删词提纯，点击直修四桩，绝不拦竖向滚屏！） ----------
  let drag = null;
  const ptFromEvent = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const inBox = (pt, box) => box && pt.x >= box.x && pt.x <= box.x + box.w && pt.y >= box.y && pt.y <= box.y + box.h;

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    const pt = ptFromEvent(e);
    const state = getState();
    drag = {
      id: e.pointerId,
      x0: pt.x,
      y0: pt.y,
      trim0: state.trim,
      moved: false,
      onRibbon: inBox(pt, hitZones.ribbon),
    };
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });

  canvas.addEventListener("pointermove", (e) => {
    const pt = ptFromEvent(e);
    if (!drag) {
      const state = getState();
      if (state.deckSlide !== 1) {
        hoverHint = "点击回到 02 引语页雕琢";
        canvas.style.cursor = "pointer";
      } else if (inBox(pt, hitZones.mark)) {
        hoverHint = "点按切换引号形态（弯引号半环 / 竖杠 / 直引号）";
        canvas.style.cursor = "pointer";
      } else if (inBox(pt, hitZones.author)) {
        hoverHint = "点按切换署名完整度（无 / 含糊 / 清晰 / 过重）";
        canvas.style.cursor = "pointer";
      } else if (hitZones.phrases.some((p) => inBox(pt, p))) {
        hoverHint = "点按词组开关紫粉重点高亮";
        canvas.style.cursor = "pointer";
      } else {
        hoverHint = "左右横拖提纯字数 · 点外缘切换留白尺度";
        canvas.style.cursor = "ew-resize";
      }
      return;
    }

    const dx = pt.x - drag.x0;
    const dy = pt.y - drag.y0;
    if (!drag.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy) * 0.85) {
      drag.moved = true;
    }
    if (drag.moved) {
      let nextTrim;
      if (drag.onRibbon) {
        const ribPad = W * 0.06;
        const ribW = Math.max(100, W - ribPad * 2);
        nextTrim = Math.round(((pt.x - ribPad) / ribW) * 100);
      } else {
        nextTrim = Math.round(drag.trim0 + (dx / Math.max(160, W * 0.58)) * 100);
      }
      nextTrim = Math.max(0, Math.min(100, nextTrim));
      // 轻吸附到海报甜点 78
      if (Math.abs(nextTrim - 78) <= 2 && Math.abs(dx) > 14) nextTrim = 78;
      if (rehearsal) rehearsal = null;
      dirty = true;
      handlers.onTrim(nextTrim);
      if (reducedMotion.matches) ctl.draw();
    }
  });

  function finishPointer(e) {
    if (!drag || (e.pointerId != null && drag.id !== e.pointerId)) return;
    const wasMoved = drag.moved;
    const pt = ptFromEvent(e);
    drag = null;
    if (wasMoved) return;

    const state = getState();
    if (rehearsal) {
      rehearsal = null;
      handlers.onRehearsalEnd?.();
      ctl.draw();
      return;
    }
    if (state.deckSlide !== 1) {
      handlers.onReturnToQuote?.();
      triggerRipple(pt.x, pt.y);
      ctl.draw();
      return;
    }

    if (inBox(pt, hitZones.mark)) {
      handlers.onCycleMark();
      triggerRipple(pt.x, pt.y, "#6E3DA6");
    } else if (inBox(pt, hitZones.author)) {
      handlers.onCycleAuthor();
      triggerRipple(pt.x, pt.y, "#6E3DA6");
    } else {
      const hitPhrase = hitZones.phrases.find((p) => inBox(pt, p));
      if (hitPhrase) {
        handlers.onTogglePhrase(hitPhrase.text);
        triggerRipple(pt.x, pt.y, "#C65A92");
      } else if (inBox(pt, hitZones.ribbon)) {
        const ribPad = W * 0.06;
        const ribW = Math.max(100, W - ribPad * 2);
        const nextTrim = Math.max(0, Math.min(100, Math.round(((pt.x - ribPad) / ribW) * 100)));
        handlers.onTrim(nextTrim);
        triggerRipple(pt.x, pt.y, "#1C7A58");
      } else {
        handlers.onCycleSpace();
        triggerRipple(pt.x, pt.y, "#6E3DA6");
      }
    }
    ctl.draw();
  }

  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", () => { drag = null; });
  canvas.addEventListener("pointerleave", () => { hoverHint = ""; });

  // 兼顾触屏直接 dispatchTouchEvent（tools/perf.mjs 发 touchStart/touchMove/touchEnd）
  let touchDrag = null;
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const r = canvas.getBoundingClientRect();
    touchDrag = {
      x0: e.touches[0].clientX - r.left,
      trim0: getState().trim,
    };
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!touchDrag || !e.touches.length || drag?.moved) return;
    const r = canvas.getBoundingClientRect();
    const dx = (e.touches[0].clientX - r.left) - touchDrag.x0;
    if (Math.abs(dx) > 3) {
      const nextTrim = Math.max(0, Math.min(100, Math.round(touchDrag.trim0 + (dx / Math.max(140, W * 0.55)) * 100)));
      dirty = true;
      handlers.onTrim(nextTrim);
      if (reducedMotion.matches) ctl.draw();
    }
  }, { passive: true });
  canvas.addEventListener("touchend", () => { touchDrag = null; }, { passive: true });

  new ResizeObserver(() => {
    resize();
    dirty = true;
    ctl.draw();
  }).observe(canvas);

  return {
    draw: () => {
      dirty = true;
      ctl.draw();
    },
    invalidate: () => {
      dirty = true;
      if (reducedMotion.matches) ctl.draw();
    },
    startRehearsal,
    stopRehearsal,
    isRehearsing,
  };
}

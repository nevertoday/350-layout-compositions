// 349 数据图表页 · 开场交互 2D Canvas（标 data-perf-drag）
// 支持：
//   1. 画布空白处左右横拖：实时推拉纵轴起点（0 -> maxBase），直观体验 Tufte 谎言因子畸变；
//   2. 上下拖动任意 Q1–Q4 蓝柱/红柱顶部：真实改写底层数据，触发结论/标注/KPI 实时验真；
//   3. 点击画布内红标病灶或右侧珊瑚虚线「标注」框：原地一键修复该病灶；
//   4. Space 键触发 3 秒观众扫视路径动画（按当前真实几何坐标流转）。

import { evaluate } from "./model.js";
import { loop, pixelRatio } from "../../lib/stage.js";

const COLORS = {
  paper: "#FFFFFF",
  paperSub: "#F8FAFC",
  navy: "#112243",
  ink: "#16233B",
  muted: "#5A6B86",
  gridLight: "#E2E8F0",
  gridHeavy: "#64748B",
  blue: "#2467DC",
  blueDeep: "#1850B8",
  blueMuted: "#C2CCE0",
  coral: "#FC6A5D",
  coralBtn: "#D84339",
  coralDeep: "#BF3228",
  coralMuted: "#E7C2BF",
  coralSoft: "#FFF4F3",
  emerald: "#0F7A5A",
  rainbow: ["#E11D48", "#EA580C", "#CA8A04", "#16A34A", "#0891B2", "#2563EB", "#7C3AED", "#DB2777"],
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

function wrapText(ctx, str, maxW) {
  const lines = [];
  let cur = "";
  for (const ch of str) {
    const isPunct = /^[，。！？、；：）》」”]$/.test(ch);
    if (!isPunct && ctx.measureText(cur + ch).width > maxW && cur) {
      lines.push(cur);
      cur = ch;
    } else {
      cur += ch;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function mountHeroCanvas(canvas, getState, onMutate) {
  const ctx = canvas.getContext("2d");
  let hitZones = []; // { kind, x, y, w, h, qIdx?, series?, action? }
  let hoverZone = null;
  let dragMode = null; // null | { type: 'base', startX, startBase } | { type: 'bar', qIdx, series, plotTop, plotBot, yBase, yMax }
  let animBars = [0, 0, 0, 0];
  let animTargets = [0, 0, 0, 0];
  let animBase = 160;
  let introProgress = 0;
  let needsDraw = true;
  let lastEval = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const dpr = pixelRatio(2);
    const nw = Math.round(rect.width * dpr);
    const nh = Math.round(rect.height * dpr);
    if (canvas.width !== nw || canvas.height !== nh) {
      canvas.width = nw;
      canvas.height = nh;
      needsDraw = true;
    }
  }

  function getLayout(w, h, state, ev) {
    const compact = w < 560;
    const hasRightAnno = !compact && state.chartType !== "pie";
    const padL = compact ? 44 : 64;
    const padR = hasRightAnno ? Math.min(224, Math.max(176, w * 0.25)) : compact ? 16 : 28;
    const padT = compact ? 38 : 44;
    const heavyRainbowCompact = compact && state.clutter === "heavy" && state.paletteMode === "rainbow";
    const padB = heavyRainbowCompact ? 76 : state.clutter === "heavy" ? (compact ? 58 : 64) : (compact ? 42 : 46);
    const plotX = padL;
    const plotY = padT;
    const plotW = Math.max(140, w - padL - padR);
    const plotH = Math.max(110, h - padT - padB);
    return { compact, hasRightAnno, plotX, plotY, plotW, plotH, padR, w, h };
  }

  function measureBadgeWidth(text) {
    ctx.save();
    ctx.font = `600 11.5px "Noto Sans SC", sans-serif`;
    const w = ctx.measureText(text).width + 16;
    ctx.restore();
    return w;
  }

  function valToY(val, yBase, yMax, plotY, plotH) {
    const span = Math.max(1, yMax - yBase);
    const norm = Math.max(0, Math.min(1.06, (val - yBase) / span));
    return plotY + plotH - norm * plotH;
  }

  function drawBadgeChip(x, y, text, bg, fg, stroke) {
    ctx.save();
    ctx.font = `600 11.5px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(text).width;
    const bw = tw + 16;
    const bh = 23;
    roundRectPath(ctx, x, y, bw, bh, 5);
    ctx.fillStyle = bg;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = fg;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(text, x + 8, y + bh / 2 + 0.5);
    ctx.restore();
    return { x, y, w: bw, h: bh };
  }

  function render(t, dt, { still }) {
    resize();
    const dpr = pixelRatio(2);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    if (w < 10 || h < 10) return;

    const state = getState();
    const ev = evaluate(state);
    lastEval = ev;

    // 动画插值（still 为 true 时直达终点）
    if (still) {
      introProgress = 1;
      animBars = [...state.actual];
      animTargets = [...state.target];
      animBase = state.yBase;
    } else {
      const k = Math.min(1, (dt || 0.016) * 11);
      if (introProgress < 1) {
        introProgress = Math.min(1, introProgress + (dt || 0.016) * 2.4);
      }
      const easeIntro = 1 - Math.pow(1 - introProgress, 3);
      for (let i = 0; i < 4; i++) {
        const tgtA = state.actual[i] * easeIntro;
        const tgtB = state.target[i] * easeIntro;
        animBars[i] += (tgtA - animBars[i]) * (introProgress < 1 ? 0.35 : k);
        animTargets[i] += (tgtB - animTargets[i]) * (introProgress < 1 ? 0.35 : k);
      }
      animBase += (state.yBase - animBase) * k;
    }

    // 3秒扫视路径计时推进
    let scanPhase = -1;
    if (state.scanActive) {
      if (still) {
        scanPhase = 2.4;
      } else {
        state.scanT = (state.scanT || 0) + (dt || 0.016);
        scanPhase = state.scanT;
        if (state.scanT >= 3.2) {
          state.scanActive = false;
          state.scanT = 0;
          onMutate({ scanActive: false, scanT: 0 }, true);
        }
      }
    }

    // 检查是否还在动（静置时不再无谓重画以省电，但 perf 拖动时必重画）
    const moving =
      introProgress < 1 ||
      state.scanActive ||
      Math.abs(animBase - state.yBase) > 0.25 ||
      animBars.some((v, i) => Math.abs(v - state.actual[i]) > 0.4) ||
      animTargets.some((v, i) => Math.abs(v - state.target[i]) > 0.4);
    if (!needsDraw && !moving && !dragMode) return;
    needsDraw = moving;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // 画布洁净底纸
    roundRectPath(ctx, 0.5, 0.5, w - 1, h - 1, 10);
    ctx.fillStyle = state.clutter === "heavy" ? "#F3F5F8" : COLORS.paper;
    ctx.fill();
    ctx.strokeStyle = state.clutter === "heavy" ? "#94A3B8" : "#DDE3EC";
    ctx.lineWidth = state.clutter === "heavy" ? 1.5 : 1;
    ctx.stroke();

    hitZones = [];
    const lay = getLayout(w, h, state, ev);
    const { plotX, plotY, plotW, plotH, compact } = lay;
    const yMax = ev.yMax;
    const displayBase = Math.min(animBase, Math.max(0, Math.min(...state.actual) - 18));

    // 左上 Y 轴单位标题（贴合原海报「销售额（万元）」）
    ctx.fillStyle = COLORS.muted;
    ctx.font = `500 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(ev.sc.yAxisTitle, plotX, plotY - 22);

    // 右上简明状态提示
    ctx.textAlign = "right";
    ctx.font = `500 11px "DM Mono", "Noto Sans SC", monospace`;
    const statusText =
      state.chartType === "pie"
        ? "PIE · 角度编码（无纵轴）"
        : `Y: ${Math.round(state.yBase)}–${yMax} · 谎言因子 ${ev.lieFactor.toFixed(1)}×`;
    ctx.fillStyle = ev.lieFactor > 1.15 || state.chartType === "pie" || state.chartType === "bar3d" ? COLORS.coralDeep : COLORS.blueDeep;
    ctx.fillText(statusText, w - 16, plotY - 22);

    let peakAnchor = { x: plotX + plotW * 0.82, y: plotY + 30 };
    const gazeStops = [];

    if (state.chartType === "pie") {
      // ===== 错用饼图渲染（直观证明角度难比 + 装不下双序列） =====
      const cx = compact ? w * 0.5 : w * 0.42;
      const cy = plotY + plotH * 0.52;
      const outerR = Math.min(plotW * 0.34, plotH * 0.44, 118);
      const innerR = outerR * 0.56;
      const totalA = animBars.reduce((s, v) => s + Math.max(1, v), 0);
      const totalT = animTargets.reduce((s, v) => s + Math.max(1, v), 0);
      const pieCols =
        state.paletteMode === "rainbow"
          ? COLORS.rainbow
          : state.paletteMode === "focus"
          ? ["#CBD5E1", "#B6C2D4", "#94A3B8", COLORS.blue]
          : ["#93B4EE", "#6390E6", "#3E78E0", COLORS.blue];

      let ang = -Math.PI / 2;
      for (let i = 0; i < 4; i++) {
        const slice = (Math.max(1, animBars[i]) / totalA) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, ang, ang + slice);
        ctx.closePath();
        ctx.fillStyle = pieCols[i];
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();

        const mid = ang + slice / 2;
        const lx = cx + Math.cos(mid) * (outerR + 22);
        const ly = cy + Math.sin(mid) * (outerR + 18);
        ctx.fillStyle = COLORS.ink;
        ctx.font = `600 11.5px "DM Mono", "Noto Sans SC", sans-serif`;
        ctx.textAlign = Math.cos(mid) >= 0 ? "left" : "right";
        ctx.textBaseline = "middle";
        ctx.fillText(`${ev.sc.quarters[i]} ${Math.round((animBars[i] / totalA) * 100)}%`, lx, ly);

        if (i === ev.live.peakIdx) {
          peakAnchor = { x: cx + Math.cos(mid) * outerR * 0.85, y: cy + Math.sin(mid) * outerR * 0.85 };
        }
        gazeStops.push({ x: cx + Math.cos(mid) * outerR * 0.65, y: cy + Math.sin(mid) * outerR * 0.65 });
        ang += slice;
      }

      // 如果打开了目标对比，硬塞一个内环展示「双环饼图」的混乱
      if (state.showTarget) {
        let ang2 = -Math.PI / 2;
        for (let i = 0; i < 4; i++) {
          const slice = (Math.max(1, animTargets[i]) / totalT) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, innerR, ang2, ang2 + slice);
          ctx.closePath();
          ctx.fillStyle = i === 3 ? COLORS.coral : "#F6ACA5";
          ctx.fill();
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ang2 += slice;
        }
        ctx.beginPath();
        ctx.arc(cx, cy, innerR * 0.48, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.fillStyle = COLORS.coralDeep;
        ctx.font = `600 10.5px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("内环目标", cx, cy);
      }

      // 可点击的红标切回柱状图
      const chip = drawBadgeChip(
        Math.max(16, cx - 86),
        plotY + plotH - 18,
        "× 饼图失真 · 点此切回柱状",
        COLORS.coralBtn,
        "#FFFFFF"
      );
      hitZones.push({ kind: "fix", action: "fixPie", ...chip });
    } else {
      // ===== 坐标系网格与 Y 轴（柱状 / 3D 柱 / 双折线共用） =====
      const tickCount = state.yBase === 0 && yMax === 600 ? 6 : 5;
      const heavy = state.clutter === "heavy";
      ctx.save();
      if (heavy) {
        // 噪杂背景格框
        ctx.fillStyle = "#E8EEF5";
        ctx.fillRect(plotX, plotY, plotW, plotH);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(plotX, plotY, plotW, plotH);
      }

      for (let i = 0; i <= tickCount; i++) {
        const frac = i / tickCount;
        const val = Math.round(displayBase + (yMax - displayBase) * frac);
        const y = plotY + plotH - frac * plotH;

        ctx.beginPath();
        ctx.moveTo(plotX, y);
        ctx.lineTo(plotX + plotW, y);
        if (i === 0) {
          ctx.strokeStyle = COLORS.navy;
          ctx.lineWidth = 1.6;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = heavy ? "#64748B" : COLORS.gridLight;
          ctx.lineWidth = heavy ? 1.2 : 1;
          ctx.setLineDash(heavy ? [] : [3, 4]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Y 轴刻度数字
        ctx.fillStyle = i === 0 && state.yBase > 0 ? COLORS.coralDeep : COLORS.muted;
        ctx.font = `${i === 0 && state.yBase > 0 ? "700" : "500"} 11.5px "DM Mono", monospace`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(String(val), plotX - 10, y);
      }

      // 纵轴截断锯齿警示标（红标按钮移到所有柱体绘制完成后再叠画，避免被柱子遮挡）
      if (state.yBase > 0) {
        const bx = plotX;
        const by = plotY + plotH - 12;
        ctx.beginPath();
        ctx.moveTo(bx - 6, by + 6);
        ctx.lineTo(bx + 6, by + 1);
        ctx.lineTo(bx - 6, by - 4);
        ctx.lineTo(bx + 6, by - 9);
        ctx.strokeStyle = COLORS.coralBtn;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }
      ctx.restore();

      const groupW = plotW / 4;

      if (state.chartType === "line") {
        // ===== 双折线趋势图（含实际/目标差额微淡填色带） =====
        const ptsA = [];
        const ptsT = [];
        for (let i = 0; i < 4; i++) {
          const cx = plotX + groupW * (i + 0.5);
          ptsA.push({ x: cx, y: valToY(animBars[i], displayBase, yMax, plotY, plotH), v: Math.round(animBars[i]) });
          ptsT.push({ x: cx, y: valToY(animTargets[i], displayBase, yMax, plotY, plotH), v: Math.round(animTargets[i]) });
        }

        // 差额半透明面积带
        if (state.showTarget) {
          ctx.beginPath();
          ptsA.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
          for (let i = 3; i >= 0; i--) ctx.lineTo(ptsT[i].x, ptsT[i].y);
          ctx.closePath();
          ctx.fillStyle = "rgba(36, 103, 220, 0.08)";
          ctx.fill();

          // 目标虚折线
          ctx.beginPath();
          ptsT.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
          ctx.strokeStyle = state.paletteMode === "focus" ? COLORS.coralMuted : COLORS.coral;
          ctx.lineWidth = 2.4;
          ctx.setLineDash([6, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // 实际实折线
        ctx.beginPath();
        ptsA.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.strokeStyle = COLORS.blue;
        ctx.lineWidth = 3.2;
        ctx.stroke();

        // 节点、直标与可拖手柄
        for (let i = 0; i < 4; i++) {
          const pA = ptsA[i];
          const pT = ptsT[i];
          const isPeak = i === ev.live.peakIdx;

          if (state.showTarget) {
            ctx.beginPath();
            ctx.arc(pT.x, pT.y, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.fill();
            ctx.strokeStyle = COLORS.coral;
            ctx.lineWidth = 2;
            ctx.stroke();
            if (!heavy) {
              ctx.fillStyle = COLORS.coralDeep;
              ctx.font = `500 11px "DM Mono", monospace`;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillText(String(Math.round(state.target[i])), pT.x, pT.y + 8);
            }
          }

          ctx.beginPath();
          ctx.arc(pA.x, pA.y, isPeak ? 6.5 : 5.5, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();
          ctx.strokeStyle =
            state.paletteMode === "rainbow"
              ? COLORS.rainbow[i * 2]
              : state.paletteMode === "focus" && !isPeak
              ? "#64748B"
              : COLORS.blue;
          ctx.lineWidth = isPeak ? 3.2 : 2.5;
          ctx.stroke();

          if (!heavy) {
            ctx.fillStyle = isPeak ? COLORS.blueDeep : COLORS.ink;
            ctx.font = `${isPeak ? "700" : "500"} 12px "DM Mono", monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText(String(Math.round(state.actual[i])), pA.x, pA.y - 10);
          }

          // 拖点热区
          hitZones.push({
            kind: "bar",
            qIdx: i,
            series: "actual",
            x: pA.x - 18,
            y: pA.y - 18,
            w: 36,
            h: 36,
            plotTop: plotY,
            plotBot: plotY + plotH,
            yBase: displayBase,
            yMax,
          });

          // X 轴季度标签
          ctx.fillStyle = isPeak ? COLORS.navy : COLORS.muted;
          ctx.font = `${isPeak ? "700" : "500"} 12.5px "IBM Plex Sans", "Noto Sans SC", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(ev.sc.quarters[i], pA.x, plotY + plotH + 10);

          if (isPeak) peakAnchor = { x: pA.x + 8, y: pA.y };
          gazeStops.push({ x: pA.x, y: pA.y });
        }
      } else {
        // ===== 分组柱状图 / 3D 透视柱 =====
        const is3d = state.chartType === "bar3d";
        const barW = Math.min(state.showTarget ? 34 : 46, Math.max(16, groupW * (state.showTarget ? 0.28 : 0.42)));
        const gap = state.showTarget ? Math.min(10, barW * 0.3) : 0;

        for (let i = 0; i < 4; i++) {
          const cx = plotX + groupW * (i + 0.5);
          const isPeak = i === ev.live.peakIdx;
          const xA = state.showTarget ? cx - gap / 2 - barW : cx - barW / 2;
          const xT = cx + gap / 2;

          const yA = valToY(animBars[i], displayBase, yMax, plotY, plotH);
          const hA = Math.max(3, plotY + plotH - yA);
          const yT = valToY(animTargets[i], displayBase, yMax, plotY, plotH);
          const hT = Math.max(3, plotY + plotH - yT);

          // 颜色选择
          let fillA = COLORS.blue;
          let fillT = COLORS.coral;
          if (state.paletteMode === "rainbow") {
            fillA = COLORS.rainbow[i * 2];
            fillT = COLORS.rainbow[i * 2 + 1];
          } else if (state.paletteMode === "focus" && !isPeak) {
            fillA = COLORS.blueMuted;
            fillT = COLORS.coralMuted;
          }

          // 绘制柱体
          const drawBar = (bx, by, bw, bh, fill, qIdx, series, rawVal) => {
            ctx.save();
            if (heavy) {
              ctx.shadowColor = "rgba(15, 23, 42, 0.25)";
              ctx.shadowBlur = 8;
              ctx.shadowOffsetX = 4;
              ctx.shadowOffsetY = 3;
            }
            if (is3d) {
              const dx = 11;
              const dy = -9;
              // 前面
              ctx.fillStyle = fill;
              ctx.fillRect(bx, by, bw, bh);
              // 顶面（制造透视偏移，让眼睛错读刻度！）
              ctx.beginPath();
              ctx.moveTo(bx, by);
              ctx.lineTo(bx + dx, by + dy);
              ctx.lineTo(bx + bw + dx, by + dy);
              ctx.lineTo(bx + bw, by);
              ctx.closePath();
              ctx.fillStyle = "rgba(255,255,255,0.28)";
              ctx.fill();
              ctx.fillStyle = fill;
              ctx.globalAlpha = 0.72;
              ctx.fill();
              ctx.globalAlpha = 1;
              // 侧面
              ctx.beginPath();
              ctx.moveTo(bx + bw, by);
              ctx.lineTo(bx + bw + dx, by + dy);
              ctx.lineTo(bx + bw + dx, by + bh + dy);
              ctx.lineTo(bx + bw, by + bh);
              ctx.closePath();
              ctx.fillStyle = "rgba(17,34,67,0.25)";
              ctx.fill();
            } else {
              // 原海报同款顶微圆角、底平齐基线柱体
              const r = 3;
              ctx.beginPath();
              ctx.moveTo(bx, by + bh);
              ctx.lineTo(bx, by + r);
              ctx.arcTo(bx, by, bx + r, by, r);
              ctx.arcTo(bx + bw, by, bx + bw, by + r, r);
              ctx.lineTo(bx + bw, by + bh);
              ctx.closePath();
              ctx.fillStyle = fill;
              ctx.fill();
            }
            ctx.restore();

            // 柱顶隐形拖拉横杠（悬停或拖动时清晰浮现）
            const isHover =
              (hoverZone && hoverZone.kind === "bar" && hoverZone.qIdx === qIdx && hoverZone.series === series) ||
              (dragMode && dragMode.type === "bar" && dragMode.qIdx === qIdx && dragMode.series === series);
            if (isHover || (series === "actual" && isPeak)) {
              ctx.fillStyle = isHover ? "#FFFFFF" : "rgba(255,255,255,0.75)";
              roundRectPath(ctx, bx + bw * 0.22, by + 5, bw * 0.56, 3, 1.5);
              ctx.fill();
            }

            // 柱顶直接数字标注（重网格噪杂态下故意隐藏，逼观众查刻度/图例）
            if (!heavy) {
              ctx.fillStyle =
                series === "actual"
                  ? state.paletteMode === "focus" && !isPeak
                    ? COLORS.muted
                    : COLORS.blueDeep
                  : state.paletteMode === "focus" && !isPeak
                  ? "#8B95A5"
                  : COLORS.coralDeep;
              ctx.font = `${isPeak && series === "actual" ? "700" : "500"} ${compact ? 11 : 12.5}px "DM Mono", monospace`;
              ctx.textAlign = "center";
              ctx.textBaseline = "bottom";
              ctx.fillText(String(Math.round(rawVal)), bx + bw / 2, by - (is3d ? 12 : 6));
            }

            // 注册柱顶垂直拖动热区
            hitZones.push({
              kind: "bar",
              qIdx,
              series,
              x: bx - 4,
              y: by - 16,
              w: bw + 8,
              h: Math.max(30, Math.min(48, bh + 16)),
              plotTop: plotY,
              plotBot: plotY + plotH,
              yBase: displayBase,
              yMax,
            });
          };

          drawBar(xA, yA, barW, hA, fillA, i, "actual", state.actual[i]);
          if (state.showTarget) {
            drawBar(xT, yT, barW, hT, fillT, i, "target", state.target[i]);
          }

          // X 轴季度名
          ctx.fillStyle = isPeak ? COLORS.navy : COLORS.muted;
          ctx.font = `${isPeak ? "700" : "500"} 12.5px "IBM Plex Sans", "Noto Sans SC", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(ev.sc.quarters[i], cx, plotY + plotH + 10);

          if (isPeak) {
            peakAnchor = { x: xA + barW + 4, y: yA + 4 };
          }
          gazeStops.push({ x: xA + barW / 2, y: yA + 12 });
        }

        if (is3d) {
          const c3d = drawBadgeChip(plotX + 8, plotY + (compact ? 64 : 38), "× 3D 斜顶错位 · 切回 2D", COLORS.coralBtn, "#FFFFFF");
          hitZones.push({ kind: "fix", action: "fix3d", ...c3d });
        }
      }

      // 最顶层叠画可点击红标（绝不被柱子遮挡，且严格收在绘图框内不溢出）
      if (state.yBase > 0) {
        const tText = compact
          ? `× 截断(${Math.round(state.yBase)}) · 点归零`
          : `× 纵轴截断(${Math.round(state.yBase)}) · 点此归零`;
        const truncChip = drawBadgeChip(
          plotX + 8,
          plotY + (compact ? 36 : 10),
          tText,
          COLORS.coralBtn,
          "#FFFFFF"
        );
        hitZones.push({ kind: "fix", action: "fixBase", ...truncChip });
      }

      if (heavy || state.paletteMode === "rainbow") {
        const cText = compact ? "× 噪杂失焦 · 去噪" : "× 噪杂失焦 · 点此去噪聚焦";
        const cw = measureBadgeWidth(cText);
        const cx = Math.max(plotX + 8, plotX + plotW - cw - 8);
        const cleanChip = drawBadgeChip(cx, plotY + 10, cText, COLORS.coralBtn, "#FFFFFF");
        hitZones.push({ kind: "fix", action: "fixClutter", ...cleanChip });
      }
      if (heavy) {
        const items =
          state.paletteMode === "rainbow"
            ? ["Q1实", "Q1目", "Q2实", "Q2目", "Q3实", "Q3目", "Q4实", "Q4目"]
            : [ev.sc.seriesNames[0], ev.sc.seriesNames[1]];
        const twoRows = compact && items.length > 4;
        const perRow = twoRows ? 4 : items.length;
        const step = Math.min(72, (plotW - 8) / perRow);
        items.forEach((lbl, idx) => {
          const row = twoRows ? Math.floor(idx / 4) : 0;
          const col = twoRows ? idx % 4 : idx;
          const lx = plotX + col * step;
          const ly = plotY + plotH + 34 + row * 18;
          ctx.fillStyle = state.paletteMode === "rainbow" ? COLORS.rainbow[idx] : idx === 0 ? COLORS.blue : COLORS.coral;
          ctx.fillRect(lx, ly - 5, 9, 9);
          ctx.fillStyle = COLORS.muted;
          ctx.font = `500 10.5px "Noto Sans SC", sans-serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(lbl, lx + 12, ly);
        });
      }
    }

    // ===== 1:1 复刻原海报右侧珊瑚虚线「标注」框与折线引注 =====
    if (lay.hasRightAnno) {
      const boxX = plotX + plotW + 24;
      const boxW = w - boxX - 14;
      const boxY = Math.max(plotY + 14, Math.min(plotY + plotH - 118, peakAnchor.y + 8));

      if (state.annoMode === "none") {
        const boxH = 86;
        ctx.save();
        roundRectPath(ctx, boxX, boxY, boxW, boxH, 10);
        ctx.fillStyle = COLORS.coralSoft;
        ctx.fill();
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = COLORS.coralBtn;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = COLORS.coralDeep;
        ctx.font = `700 12px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("+ 缺少峰值标注", boxX + boxW / 2, boxY + 32);
        ctx.font = `400 11px "Noto Sans SC", sans-serif`;
        ctx.fillText("点此补上原海报珊瑚引注", boxX + boxW / 2, boxY + 56);
        ctx.restore();
        hitZones.push({ kind: "anno", action: "fixAnno", x: boxX, y: boxY, w: boxW, h: boxH });
      } else {
        const mismatch = state.annoMode === "poster" && !ev.live.posterAnnoMatches;
        const verbose = state.annoMode === "verbose";
        const bodyText = ev.text.annoText;
        ctx.font = `500 12px "Noto Sans SC", sans-serif`;
        const lines = wrapText(ctx, bodyText, boxW - 22).slice(0, verbose ? 6 : 3);
        const boxH = Math.max(82, 34 + lines.length * 18 + (mismatch || verbose ? 22 : 10));

        // 珊瑚圆点 + 折线引线（直连峰值柱顶）
        const dotX = Math.min(boxX - 18, peakAnchor.x + 12);
        const dotY = Math.max(plotY + 8, peakAnchor.y);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(dotX, dotY);
        ctx.lineTo(dotX + 16, dotY);
        ctx.lineTo(boxX, boxY + 14);
        ctx.strokeStyle = mismatch || verbose ? COLORS.coralBtn : COLORS.coral;
        ctx.lineWidth = 1.35;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(dotX, dotY, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.coralBtn;
        ctx.fill();

        // 虚线圆角标注卡
        roundRectPath(ctx, boxX, boxY, boxW, boxH, 10);
        ctx.fillStyle = mismatch || verbose ? COLORS.coralSoft : "#FFFFFF";
        ctx.fill();
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = mismatch || verbose ? COLORS.coralBtn : COLORS.coral;
        ctx.lineWidth = 1.25;
        ctx.stroke();
        ctx.setLineDash([]);

        // 顶部居中珊瑚「标注」胶囊（1:1 承袭原海报）
        const pillW = mismatch ? 92 : verbose ? 84 : 58;
        const pillX = boxX + (boxW - pillW) / 2;
        const pillY = boxY - 12;
        roundRectPath(ctx, pillX, pillY, pillW, 24, 7);
        ctx.fillStyle = COLORS.coralBtn;
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 11.5px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(mismatch ? "标注穿帮" : verbose ? "过长密字" : "标注", pillX + pillW / 2, pillY + 12.5);

        // 标注正文
        ctx.fillStyle = COLORS.ink;
        ctx.font = `500 12px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        lines.forEach((ln, idx) => {
          ctx.fillText(ln, boxX + 11, boxY + 22 + idx * 18);
        });
        if (mismatch || verbose) {
          ctx.fillStyle = COLORS.coralDeep;
          ctx.font = `600 10.5px "Noto Sans SC", sans-serif`;
          ctx.fillText(mismatch ? "点此同步为实数差额 →" : "点此精简为单句标注 →", boxX + 11, boxY + boxH - 18);
        }
        ctx.restore();

        hitZones.push({ kind: "anno", action: "cycleAnno", x: boxX, y: boxY - 12, w: boxW, h: boxH + 12 });
      }
    } else if (compact && state.chartType !== "pie") {
      // 窄屏内嵌右上角轻量标注胶囊，确保手机端同样完整传达峰值解释
      const pillText =
        state.annoMode === "none"
          ? "+ 点此补标注"
          : state.annoMode === "verbose"
          ? "× 标注过长·点精简"
          : `${ev.live.peakQ} ${ev.live.peakDiff >= 0 ? `超目标+${ev.live.peakDiff}` : `低目标${ev.live.peakDiff}`}`;
      const isBad = state.annoMode === "none" || state.annoMode === "verbose" || (state.annoMode === "poster" && !ev.live.posterAnnoMatches);
      const chip = drawBadgeChip(
        plotX + 6,
        plotY + 4,
        pillText,
        isBad ? COLORS.coralBtn : COLORS.coralSoft,
        isBad ? "#FFFFFF" : COLORS.coralDeep,
        isBad ? null : COLORS.coral
      );
      hitZones.push({ kind: "anno", action: isBad ? "fixAnno" : "cycleAnno", ...chip });
    }

    // ===== 3 秒观众扫视路径动画（按 Space 启动） =====
    if (scanPhase >= 0 && gazeStops.length) {
      const ok = ev.score === 5;
      const pathPts = ok
        ? [
            { x: plotX + 40, y: plotY - 14, label: "① 结论" },
            { x: peakAnchor.x - 16, y: Math.max(plotY + 26, peakAnchor.y + 10), label: "② 峰值对比" },
            { x: lay.hasRightAnno ? plotX + plotW + 90 : plotX + plotW - 44, y: Math.max(plotY + 44, peakAnchor.y + 38), label: "③ 珊瑚标注" },
            { x: plotX + plotW * 0.5, y: plotY + plotH - 8, label: "④ 重点数据" },
          ]
        : [
            gazeStops[0],
            { x: plotX + plotW * 0.45, y: plotY + plotH + 22, label: "找图例" },
            gazeStops[2] || gazeStops[0],
            { x: plotX + 20, y: plotY + plotH - 16, label: "疑刻度" },
            gazeStops[3] || gazeStops[0],
            { x: plotX + plotW * 0.72, y: plotY + plotH + 22, label: "回查" },
          ];
      const segs = pathPts.length - 1;
      const prog = Math.min(1, scanPhase / 2.6);
      const fIdx = prog * segs;
      const idx = Math.min(segs - 1, Math.floor(fIdx));
      const frac = fIdx - idx;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pathPts[0].x, pathPts[0].y);
      for (let i = 1; i <= idx; i++) ctx.lineTo(pathPts[i].x, pathPts[i].y);
      const curX = pathPts[idx].x + (pathPts[idx + 1].x - pathPts[idx].x) * frac;
      const curY = pathPts[idx].y + (pathPts[idx + 1].y - pathPts[idx].y) * frac;
      ctx.lineTo(curX, curY);
      ctx.strokeStyle = ok ? COLORS.emerald : COLORS.coralBtn;
      ctx.lineWidth = 2.6;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 走过的落点圆环
      for (let i = 0; i <= idx; i++) {
        const pt = pathPts[i];
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 11, 0, Math.PI * 2);
        ctx.fillStyle = ok ? "rgba(15, 122, 90, 0.16)" : "rgba(216, 67, 57, 0.18)";
        ctx.fill();
        ctx.strokeStyle = ok ? COLORS.emerald : COLORS.coralBtn;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        if (pt.label) {
          drawBadgeChip(
            Math.max(8, Math.min(w - 96, pt.x - 32)),
            Math.max(6, pt.y - 30),
            pt.label,
            ok ? COLORS.emerald : COLORS.coralBtn,
            "#FFFFFF"
          );
        }
      }

      // 当前移动视线光点
      ctx.beginPath();
      ctx.arc(curX, curY, 8, 0, Math.PI * 2);
      ctx.fillStyle = ok ? COLORS.emerald : COLORS.coralBtn;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(curX, curY, 15, 0, Math.PI * 2);
      ctx.strokeStyle = ok ? "rgba(15, 122, 90, 0.35)" : "rgba(216, 67, 57, 0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  function pointerPos(e) {
    const r = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - r.left, y: clientY - r.top, w: r.width, h: r.height };
  }

  function findHit(x, y) {
    for (let i = hitZones.length - 1; i >= 0; i--) {
      const z = hitZones[i];
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z;
    }
    return null;
  }

  function handleFixAction(action) {
    const st = getState();
    if (action === "fixBase") onMutate({ yBase: 0 });
    else if (action === "fixPie" || action === "fix3d") onMutate({ chartType: "bar" });
    else if (action === "fixClutter") onMutate({ clutter: "clean", paletteMode: st.paletteMode === "rainbow" ? "poster" : st.paletteMode });
    else if (action === "fixAnno") onMutate({ annoMode: "live" });
    else if (action === "cycleAnno") {
      const order = ["live", "verbose", "none"];
      const next = order[(order.indexOf(st.annoMode) + 1) % order.length];
      onMutate({ annoMode: next });
    }
  }

  let downInfo = null;

  function onPointerDown(e) {
    if (e.pointerType === "touch") return; // 触屏由 touchstart/touchmove 统一处理，确保横滑不与竖滚打架
    const p = pointerPos(e);
    const hit = findHit(p.x, p.y);
    const st = getState();
    downInfo = { x: p.x, y: p.y, moved: false, hit };

    if (hit && hit.kind === "bar") {
      dragMode = {
        type: "bar",
        qIdx: hit.qIdx,
        series: hit.series,
        plotTop: hit.plotTop,
        plotBot: hit.plotBot,
        yBase: hit.yBase,
        yMax: hit.yMax,
      };
      if (e.pointerId != null && canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    } else if (!hit || (hit.kind !== "fix" && hit.kind !== "anno")) {
      dragMode = {
        type: "base",
        startX: p.x,
        startY: p.y,
        startBase: st.yBase,
        lockedAxis: null,
      };
      if (e.pointerId != null && canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    }
  }

  function onPointerMove(e) {
    const p = pointerPos(e);
    if (!dragMode) {
      const hit = findHit(p.x, p.y);
      if (hit !== hoverZone) {
        hoverZone = hit;
        canvas.style.cursor = hit
          ? hit.kind === "bar"
            ? "ns-resize"
            : "pointer"
          : "ew-resize";
        needsDraw = true;
        ctl.draw();
      }
      return;
    }

    const dx = p.x - (downInfo ? downInfo.x : p.x);
    const dy = p.y - (downInfo ? downInfo.y : p.y);
    if (Math.hypot(dx, dy) > 4 && downInfo) downInfo.moved = true;

    const st = getState();
    const sc = lastEval ? lastEval.sc : null;
    if (dragMode.type === "bar") {
      const spanH = Math.max(40, dragMode.plotBot - dragMode.plotTop);
      const frac = Math.max(0.05, Math.min(1.02, (dragMode.plotBot - p.y) / spanH));
      const raw = dragMode.yBase + frac * (dragMode.yMax - dragMode.yBase);
      const snapped = Math.max(40, Math.min(Math.round(dragMode.yMax * 1.05), Math.round(raw / 5) * 5));
      const arr = dragMode.series === "actual" ? [...st.actual] : [...st.target];
      if (arr[dragMode.qIdx] !== snapped) {
        arr[dragMode.qIdx] = snapped;
        needsDraw = true;
        onMutate(dragMode.series === "actual" ? { actual: arr } : { target: arr });
      }
    } else if (dragMode.type === "base") {
      // 触屏友好：仅在明显横向滑动时接管，避免锁死页面竖向滚动
      if (!dragMode.lockedAxis && Math.hypot(dx, dy) > 5) {
        dragMode.lockedAxis = Math.abs(dx) >= Math.abs(dy) * 0.8 ? "x" : "y";
      }
      if (dragMode.lockedAxis === "y") return;
      const maxBase = sc ? sc.maxBase : 200;
      const delta = (dx / Math.max(180, p.w * 0.45)) * maxBase;
      let nextBase = Math.max(0, Math.min(maxBase, Math.round((dragMode.startBase + delta) / 5) * 5));
      if (nextBase <= 10) nextBase = 0; // 贴近 0 基线轻吸附
      if (nextBase !== st.yBase) {
        needsDraw = true;
        onMutate({ yBase: nextBase });
      }
    }
  }

  function onPointerUp(e) {
    if (downInfo && !downInfo.moved && downInfo.hit) {
      if (downInfo.hit.kind === "fix" || downInfo.hit.kind === "anno") {
        handleFixAction(downInfo.hit.action);
      }
    }
    dragMode = null;
    downInfo = null;
  }

  // 同时支持鼠标 PointerEvents 与工具脚本触发的原生 TouchEvents（确保 perf.mjs 触控横拖 100% 驱动重画）
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  let touchDrag = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t0 = e.touches[0];
      const p = pointerPos(e);
      const hit = findHit(p.x, p.y);
      const st = getState();
      touchDrag = { startX: t0.clientX, startY: t0.clientY, startBase: st.yBase, axis: null, moved: false, hit };
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!touchDrag || !e.touches.length) return;
      const t0 = e.touches[0];
      const dx = t0.clientX - touchDrag.startX;
      const dy = t0.clientY - touchDrag.startY;
      if (Math.hypot(dx, dy) > 4) touchDrag.moved = true;
      if (!touchDrag.axis && Math.hypot(dx, dy) > 4) {
        touchDrag.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
      if (touchDrag.axis !== "x") return;
      const st = getState();
      const sc = lastEval ? lastEval.sc : null;
      const maxBase = sc ? sc.maxBase : 200;
      const r = canvas.getBoundingClientRect();
      const delta = (dx / Math.max(110, r.width * 0.35)) * maxBase;
      const nextBase = Math.max(0, Math.min(maxBase, Math.round(touchDrag.startBase + delta)));
      if (nextBase !== st.yBase) {
        needsDraw = true;
        onMutate({ yBase: nextBase });
      }
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchend",
    () => {
      if (touchDrag && !touchDrag.moved && touchDrag.hit) {
        if (touchDrag.hit.kind === "fix" || touchDrag.hit.kind === "anno") {
          handleFixAction(touchDrag.hit.action);
        }
      }
      touchDrag = null;
    },
    { passive: true }
  );

  const ro = new ResizeObserver(() => {
    needsDraw = true;
    ctl.draw();
  });
  ro.observe(canvas);

  const ctl = loop(canvas, render);
  return {
    markDirty() {
      needsDraw = true;
      ctl.draw();
    },
  };
}

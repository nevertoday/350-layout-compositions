// 156 侧栏版式 · 活体分栏裁切台 2D Canvas 渲染与命中检测
// 零 WebGL 依赖，降级一致；单真源读取 model.js 计算坐标与状态。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SCENARIOS, SWEET_RATIO, computeCanvasLayout, computeMetrics } from "./model.js";

const COLORS = {
  paper: "#F6EBDC",
  paperIvory: "#FBF5EC",
  paperIllus: "#EFE4D5",
  paperTinted: "#EAE0D0",
  paperLine: "#CEBEA6",
  navy: "#061A36",
  navyDark: "#04142C",
  navyCard: "#0E2647",
  navyLine: "#29466E",
  slate: "#8EA7C5",
  slateIcon: "#C5CDD7",
  slateInk: "#25486E",
  ink: "#08182E",
  inkMid: "#3A4C61",
  orange: "#D86817",
  orangeSun: "#D37527",
  orangeLoud: "#DF5817",
  orangeLoudAlt: "#F5862A",
  err: "#B6241C",
  errFill: "#FBE5E2",
  errBright: "#FF8A7A",
  ok: "#136B52",
  okFill: "#DEF2EB",
  okBright: "#6FE0BC",
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

function fitText(ctx, text, maxW) {
  if (maxW <= 12) return "";
  if (ctx.measureText(text).width <= maxW) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(out + "…").width > maxW) {
    out = out.slice(0, -1);
  }
  return out + "…";
}

function drawMountainArtwork(ctx, x, y, w, h, reveal) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // 底纸
  ctx.fillStyle = COLORS.paperIllus;
  ctx.fillRect(x, y, w, h);

  // 焦柿红旭日（156 原海报核心图形母题）
  const sunR = Math.max(10, Math.min(w, h) * 0.145) * Math.min(1, reveal * 1.15);
  const sunX = x + w * 0.30;
  const sunY = y + h * 0.25;
  ctx.fillStyle = COLORS.orangeSun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // 斜向建筑构图细线
  ctx.strokeStyle = COLORS.navy;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const lx1 = x + w * 0.20;
  const ly1 = y + h * 0.72;
  const lx2 = x + w * 0.78;
  const ly2 = y + h * 0.13;
  ctx.moveTo(lx1, ly1);
  ctx.lineTo(lx1 + (lx2 - lx1) * reveal, ly1 + (ly2 - ly1) * reveal);
  ctx.stroke();

  // 右侧深普鲁士靛锐峰
  const rise = 0.25 + 0.75 * reveal;
  ctx.fillStyle = "#0C203D";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.42, y + h);
  ctx.lineTo(x + w * 0.74, y + h - h * 0.67 * rise);
  ctx.lineTo(x + w + 2, y + h * 0.60);
  ctx.lineTo(x + w + 2, y + h);
  ctx.closePath();
  ctx.fill();

  // 左侧雾灰石板蓝柔峰
  ctx.fillStyle = "#8DA6C4";
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.28 + h * 0.14 * (1 - reveal));
  ctx.quadraticCurveTo(x + w * 0.24, y + h * 0.44, x + w * 0.56, y + h * 0.66);
  ctx.quadraticCurveTo(x + w * 0.78, y + h * 0.80, x + w, y + h * 0.75);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();

  // 前景层叠波浪细线（156 原海报左下波纹母题）
  ctx.strokeStyle = "rgba(6, 26, 54, 0.52)";
  ctx.lineWidth = 1;
  const waves = 6;
  for (let i = 0; i < waves; i++) {
    const oy = y + h * (0.62 + i * 0.068);
    ctx.beginPath();
    ctx.moveTo(x, oy);
    ctx.bezierCurveTo(
      x + w * 0.24,
      oy - h * 0.04,
      x + w * 0.34,
      oy + h * 0.13,
      x + w * 0.68,
      oy + h * 0.14
    );
    ctx.stroke();
  }

  ctx.strokeStyle = COLORS.paperLine;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
}

function drawDocsArtwork(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "#081C38";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#0F2B52";
  ctx.fillRect(x, y, w, 24);
  ctx.fillStyle = COLORS.orangeLoudAlt;
  ctx.font = '700 10.5px "Space Mono", monospace';
  ctx.fillText("CSS · INTRINSIC SIDEBAR", x + 10, y + 15);

  const lines = [
    ".layout { display: flex; flex-wrap: wrap; gap: 1rem; }",
    ".main   { flex: 999 1 0; min-inline-size: 62%; }",
    ".aside  { flex: 1 0 260px; }",
    "/* 窄屏跌破主区下限时自动堆叠，无需媒体查询 */",
  ];
  ctx.font = '400 11px "Space Mono", monospace';
  lines.forEach((line, i) => {
    const ly = y + 44 + i * 20;
    if (ly < y + h - 8) {
      ctx.fillStyle = i === 3 ? "#8EA7C5" : i === 1 ? "#6FE0BC" : "#F6EBDC";
      ctx.fillText(fitText(ctx, line, w - 20), x + 10, ly);
    }
  });
  ctx.restore();
}

function drawEditorialArtwork(ctx, x, y, w, h, mainCPL) {
  ctx.save();
  ctx.fillStyle = COLORS.paperIvory;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COLORS.paperLine;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  // 首字下沉 + 模拟长文行长
  ctx.fillStyle = COLORS.navy;
  ctx.font = '900 32px "Noto Sans SC", sans-serif';
  ctx.fillText("栏", x + 12, y + 40);
  ctx.fillStyle = COLORS.orange;
  ctx.fillRect(x + 12, y + 48, 30, 3);

  const lineSamples = [
    "宽阔的外切口让长文保持舒适行长，眼睛",
    "从行尾折回下一行首时不易串行跳读。",
    "注释、书目与章节小纲退居侧方边道，",
    "读者可顺着主轴一口气读完核心论证。",
  ];
  ctx.font = '400 11.5px "Noto Sans SC", sans-serif';
  ctx.fillStyle = COLORS.inkMid;
  lineSamples.forEach((t, i) => {
    const ly = y + 24 + i * 22;
    if (ly < y + h - 22) {
      const ox = i < 2 ? x + 52 : x + 12;
      ctx.fillText(fitText(ctx, t, w - (ox - x) - 12), ox, ly);
    }
  });

  // 底部行宽尺标
  const barY = y + h - 16;
  ctx.strokeStyle = mainCPL < 24 || mainCPL > 48 ? COLORS.err : COLORS.ok;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 12, barY);
  ctx.lineTo(x + w - 12, barY);
  ctx.stroke();
  ctx.fillStyle = mainCPL < 24 || mainCPL > 48 ? COLORS.err : COLORS.ok;
  ctx.font = '700 10.5px "Space Mono", monospace';
  ctx.fillText(fitText(ctx, `估算行宽 ≈ ${mainCPL} 字/行（示意）`, w - 24), x + 12, barY - 4);
  ctx.restore();
}

export function createHeroStage(canvas, getState, handlers) {
  const ctx = canvas.getContext("2d");
  // 预生成 18×18 点阵图样，1 次 fillRect 替代 450 次循环绘制（大幅提升软件渲染帧率）
  const dotTile = document.createElement("canvas");
  dotTile.width = 18;
  dotTile.height = 18;
  const dctx = dotTile.getContext("2d");
  dctx.fillStyle = "#EAE0D0";
  dctx.fillRect(0, 0, 18, 18);
  dctx.fillStyle = "rgba(142, 167, 197, 0.30)";
  dctx.fillRect(10, 10, 1.5, 1.5);
  const dotPattern = ctx.createPattern(dotTile, "repeat");

  let w = 800;
  let h = 438;
  let dpr = 1;
  let displayPct = getState().sidebarPct;
  let dragging = false;
  let reveal = reducedMotion.matches ? 1 : 0.18;
  let dirty = true;
  let hitTargets = []; // [{ id, rect, cursor }]
  let hoveredHit = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const isNarrow = window.innerWidth <= 640;
    dpr = pixelRatio(isNarrow ? 1.5 : 2);
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dirty = true;
    }
  }

  function renderFrame(t, dt, { still }) {
    resize();
    const state = getState();
    const targetPct = state.sidebarPct;

    let animating = false;
    if (still) {
      reveal = 1;
      displayPct = targetPct;
    } else {
      if (reveal < 1) {
        reveal = Math.min(1, reveal + (dt || 0.016) * 1.6);
        animating = true;
      }
      if (dragging) {
        displayPct = targetPct;
      } else if (Math.abs(displayPct - targetPct) > 0.08) {
        displayPct += (targetPct - displayPct) * Math.min(1, (dt || 0.016) * 16);
        animating = true;
      } else {
        displayPct = targetPct;
      }
    }

    if (!dirty && !animating) return;
    dirty = false;

    const liveState = { ...state, sidebarPct: displayPct };
    const metrics = computeMetrics(state);
    const geom = computeCanvasLayout(liveState, w, h);
    const scenario = SCENARIOS[state.scenario];

    hitTargets = [];
    ctx.save();
    ctx.scale(dpr, dpr);

    // 画布底面（预渲染点阵图样，仅 1 次 draw call）
    ctx.fillStyle = dotPattern || "#EAE0D0";
    ctx.fillRect(0, 0, w, h);

    if (geom.isMobileView) {
      drawMobilePreviewSpread(ctx, state, metrics, geom, scenario, hitTargets);
    } else {
      drawDesktopSpread(ctx, state, metrics, geom, scenario, reveal, hitTargets);
    }

    // 底沿整合 390px 移动端实时重排监看条
    drawMobileReflowStrip(ctx, state, metrics, geom.stripRect, hitTargets);

    ctx.restore();
  }

  function drawDesktopSpread(ctx, state, metrics, geom, scenario, rev, hits) {
    const { spreadRect, mainRect, sidebarRect, sashX } = geom;

    // 外纸底
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(spreadRect.x, spreadRect.y, spreadRect.w, spreadRect.h);

    // 顶部经验参考带标尺（20%–36%）
    const isLeft = state.side === "left";
    const sweetX1 = isLeft
      ? spreadRect.x + spreadRect.w * (SWEET_RATIO.min / 100)
      : spreadRect.x + spreadRect.w * (1 - SWEET_RATIO.max / 100);
    const sweetW = spreadRect.w * ((SWEET_RATIO.max - SWEET_RATIO.min) / 100);
    ctx.fillStyle = "rgba(19, 107, 82, 0.13)";
    ctx.fillRect(sweetX1, spreadRect.y, sweetW, 18);
    ctx.strokeStyle = "rgba(19, 107, 82, 0.55)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(sweetX1, spreadRect.y);
    ctx.lineTo(sweetX1, spreadRect.y + spreadRect.h);
    ctx.moveTo(sweetX1 + sweetW, spreadRect.y);
    ctx.lineTo(sweetX1 + sweetW, spreadRect.y + spreadRect.h);
    ctx.stroke();
    ctx.setLineDash([]);

    // ---------- 1. 绘制主内容区 ----------
    const mPad = Math.max(10, Math.min(18, mainRect.w * 0.045));
    const mx = mainRect.x + mPad;
    const mw = Math.max(40, mainRect.w - mPad * 2);

    // 顶部比例标注
    ctx.fillStyle = metrics.checks.ratioOk ? COLORS.ok : COLORS.err;
    ctx.font = '700 11px "Space Mono", monospace';
    ctx.fillText(
      fitText(ctx, `主区 ${metrics.mainPct}% (${metrics.mainPx}px)`, mw),
      mx,
      mainRect.y + 13
    );

    // 主标题 + 英文副标
    const titleY = mainRect.y + 38;
    ctx.fillStyle = COLORS.navyDark;
    ctx.font = `900 ${mainRect.w < 240 ? 15 : 20}px "Noto Sans SC", sans-serif`;
    ctx.fillText(fitText(ctx, scenario.mainTitle, mw), mx, titleY);

    ctx.fillStyle = COLORS.slateInk;
    ctx.font = '700 10.5px "Archivo", sans-serif';
    ctx.fillText(fitText(ctx, scenario.mainEn, mw), mx, titleY + 15);

    // 短橙杠
    ctx.fillStyle = COLORS.orange;
    ctx.fillRect(mx, titleY + 21, 24, 3);

    // 主文导语模拟行（真实反映主区宽度是否挤碎，避免行首孤立标点）
    const bodyY = titleY + 38;
    ctx.fillStyle = COLORS.inkMid;
    ctx.font = '400 11.5px "Noto Sans SC", sans-serif';
    const words = scenario.mainExcerpt;
    let charsFit = Math.max(6, Math.floor(mw / 12));
    if (words.length - charsFit === 1) charsFit += 1;
    const line1 = words.slice(0, charsFit);
    const line2 = words.slice(charsFit, charsFit * 2);
    ctx.fillText(fitText(ctx, line1, mw), mx, bodyY);
    if (line2) ctx.fillText(fitText(ctx, line2, mw), mx, bodyY + 16);

    // 主视觉/核心区（在主区正常展示 vs 被错塞到侧栏的空壳告警）
    const artY = bodyY + 28;
    const artH = Math.max(76, mainRect.y + mainRect.h - artY - 34);
    if (state.coreInSidebar) {
      ctx.save();
      ctx.fillStyle = COLORS.errFill;
      ctx.fillRect(mx, artY, mw, artH);
      ctx.strokeStyle = COLORS.err;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(mx + 1, artY + 1, mw - 2, artH - 2);
      ctx.setLineDash([]);
      ctx.fillStyle = COLORS.err;
      ctx.font = '700 12px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(
        fitText(ctx, "核心主内容不在此处！", mw - 16),
        mx + mw / 2,
        artY + artH / 2 - 6
      );
      ctx.font = '400 11px "Noto Sans SC", sans-serif';
      ctx.fillText(
        fitText(ctx, `点击${isLeft ? "左侧栏" : "右侧栏"}红框把它移回主区`, mw - 16),
        mx + mw / 2,
        artY + artH / 2 + 14
      );
      ctx.textAlign = "left";
      ctx.restore();
    } else if (state.scenario === "poster") {
      drawMountainArtwork(ctx, mx, artY, mw, artH, rev);
    } else if (state.scenario === "docs") {
      drawDocsArtwork(ctx, mx, artY, mw, artH);
    } else {
      drawEditorialArtwork(ctx, mx, artY, mw, artH, metrics.mainCPL);
    }

    // 主区底部 156 徽章行
    const footY = mainRect.y + mainRect.h - 14;
    ctx.fillStyle = COLORS.navy;
    ctx.beginPath();
    ctx.arc(mx + 8, footY - 4, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.paperIvory;
    ctx.font = '700 9.5px "Space Mono", monospace';
    ctx.fillText("1", mx + 5, footY - 1);
    ctx.fillStyle = COLORS.ink;
    ctx.font = '700 11px "Noto Sans SC", sans-serif';
    ctx.fillText(
      fitText(ctx, `内容优先 · 估算行宽 ${metrics.mainCPL} 字/行（示意）`, mw - 24),
      mx + 22,
      footY
    );

    // ---------- 2. 绘制侧栏 ----------
    const isDarkSide = state.contrast === "navy" || state.contrast === "loud";
    if (state.contrast === "navy") {
      ctx.fillStyle = COLORS.navy;
      ctx.fillRect(sidebarRect.x, sidebarRect.y, sidebarRect.w, sidebarRect.h);
    } else if (state.contrast === "loud") {
      ctx.fillStyle = COLORS.orangeLoud;
      ctx.fillRect(sidebarRect.x, sidebarRect.y, sidebarRect.w, sidebarRect.h);
      // 喧哗斜条纹表现过度视觉干扰
      ctx.save();
      ctx.beginPath();
      ctx.rect(sidebarRect.x, sidebarRect.y, sidebarRect.w, sidebarRect.h);
      ctx.clip();
      ctx.strokeStyle = "rgba(255, 240, 200, 0.22)";
      ctx.lineWidth = 8;
      for (let d = -sidebarRect.h; d < sidebarRect.w + sidebarRect.h; d += 26) {
        ctx.beginPath();
        ctx.moveTo(sidebarRect.x + d, sidebarRect.y);
        ctx.lineTo(sidebarRect.x + d - sidebarRect.h, sidebarRect.y + sidebarRect.h);
        ctx.stroke();
      }
      ctx.restore();
    } else if (state.contrast === "tinted") {
      ctx.fillStyle = COLORS.paperTinted;
      ctx.fillRect(sidebarRect.x, sidebarRect.y, sidebarRect.w, sidebarRect.h);
      ctx.strokeStyle = COLORS.slate;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sashX, sidebarRect.y);
      ctx.lineTo(sashX, sidebarRect.y + sidebarRect.h);
      ctx.stroke();
    } else {
      // invisible: 同纸底、无边界线
      ctx.fillStyle = COLORS.paper;
      ctx.fillRect(sidebarRect.x, sidebarRect.y, sidebarRect.w, sidebarRect.h);
    }

    const sPad = Math.max(8, Math.min(14, sidebarRect.w * 0.06));
    const sashExtra = sidebarRect.w > 150 ? 18 : 10;
    const sx = sidebarRect.x + (isLeft ? sPad : sPad + sashExtra);
    const sw = Math.max(24, sidebarRect.w - sPad * 2 - sashExtra);

    // 侧栏顶部比例读数
    ctx.fillStyle =
      state.contrast === "loud"
        ? "#FFF7EC"
        : isDarkSide
          ? metrics.checks.ratioOk
            ? COLORS.okBright
            : COLORS.errBright
          : metrics.checks.ratioOk
            ? COLORS.ok
            : COLORS.err;
    ctx.font = '700 11px "Space Mono", monospace';
    ctx.fillText(
      fitText(ctx, `侧栏 ${metrics.sidebarPct}% (${metrics.sidebarPx}px)`, sw),
      sx,
      sidebarRect.y + 13
    );

    // 侧栏小标
    if (state.contrast === "navy") {
      ctx.fillStyle = COLORS.orangeLoudAlt;
      ctx.fillRect(sx, sidebarRect.y + 21, 18, 2.5);
    }
    ctx.fillStyle = isDarkSide ? "#FFFBF5" : COLORS.navy;
    ctx.font = '800 12.5px "Noto Sans SC", sans-serif';
    ctx.fillText(fitText(ctx, scenario.sidebarHeading, sw), sx, sidebarRect.y + 37);

    // 组装侧栏内实际块（核心错置块 + 正常模块 + 噪点块）
    const blocks = [];
    if (state.coreInSidebar) {
      blocks.push({
        kind: "core",
        title: `错置：${scenario.coreLabel}`,
        desc: "点此移回主内容区",
      });
    }
    for (let i = 0; i < state.sidebarItems; i++) {
      const m = scenario.cleanModules[i];
      if (m) blocks.push({ kind: "clean", title: m.title, desc: m.desc });
    }
    if (state.hasNoise) {
      for (const n of scenario.noiseModules) {
        blocks.push({ kind: "noise", title: n.title, desc: "点此清掉噪点" });
      }
    }

    const listTop = sidebarRect.y + 46;
    const listAvailH = Math.max(80, sidebarRect.y + sidebarRect.h - listTop - 10);
    const gap = blocks.length >= 6 ? 4 : 7;
    const itemH = Math.max(24, Math.min(48, Math.floor((listAvailH - gap * Math.max(0, blocks.length - 1)) / Math.max(1, blocks.length))));

    blocks.forEach((b, idx) => {
      const iy = listTop + idx * (itemH + gap);
      if (iy + 18 > sidebarRect.y + sidebarRect.h) return;
      const rect = { x: sx, y: iy, w: sw, h: itemH };

      if (b.kind === "core" || b.kind === "noise") {
        // 可直接点击纠错的红框块
        ctx.fillStyle = b.kind === "core" ? "#FFF1EE" : "#3A1216";
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.strokeStyle = b.kind === "core" ? COLORS.err : COLORS.errBright;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
        ctx.setLineDash([]);

        // 核心主图被挤进侧栏时，在红框右侧画出被压扁的微型山日缩图，直观呈现「委屈主角」
        let textMaxW = rect.w - 12;
        if (b.kind === "core" && rect.w > 150 && rect.h >= 28) {
          const thumbW = Math.min(54, rect.w * 0.24);
          const thumbH = rect.h - 8;
          drawMountainArtwork(ctx, rect.x + rect.w - thumbW - 5, rect.y + 4, thumbW, thumbH, rev);
          textMaxW = rect.w - thumbW - 16;
        }

        ctx.fillStyle = b.kind === "core" ? COLORS.err : "#FFE5E2";
        ctx.font = '800 11px "Noto Sans SC", sans-serif';
        ctx.fillText(fitText(ctx, b.title, textMaxW), rect.x + 6, rect.y + Math.min(15, rect.h * 0.48));
        if (rect.h >= 30) {
          ctx.fillStyle = b.kind === "core" ? COLORS.ink : COLORS.errBright;
          ctx.font = '700 10px "Noto Sans SC", sans-serif';
          ctx.fillText(fitText(ctx, `× ${b.desc}`, textMaxW), rect.x + 6, rect.y + rect.h - 7);
        }
        hits.push({ id: b.kind === "core" ? "fix-core" : "fix-noise", rect, cursor: "pointer" });
      } else {
        // 正常侧栏条目
        if (state.contrast === "navy") {
          ctx.fillStyle = COLORS.navyCard;
          ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        } else if (state.contrast === "loud") {
          ctx.fillStyle = "rgba(255, 250, 235, 0.2)";
          ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        } else if (state.contrast === "tinted") {
          ctx.fillStyle = COLORS.paperIvory;
          ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
          ctx.strokeStyle = COLORS.paperLine;
          ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
        }
        // 原海报小灰蓝圆徽（宽够时才画圆，极窄时显现挤压断字！）
        const cramped = sidebarRect.w < 120;
        const textX = cramped ? rect.x + 5 : rect.x + 26;
        if (!cramped) {
          ctx.fillStyle = isDarkSide ? COLORS.slateIcon : COLORS.navy;
          ctx.beginPath();
          ctx.arc(rect.x + 13, rect.y + rect.h / 2, 7.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = isDarkSide ? COLORS.navy : COLORS.paperIvory;
          ctx.font = '700 9px "Space Mono", monospace';
          ctx.fillText(String(idx + 1), rect.x + 10.5, rect.y + rect.h / 2 + 3);
        }
        ctx.fillStyle = isDarkSide ? "#FFFBF5" : COLORS.ink;
        ctx.font = '700 11px "Noto Sans SC", sans-serif';
        const showTitle = cramped ? b.title.slice(0, 2) + "…" : fitText(ctx, b.title, rect.w - (textX - rect.x) - 6);
        ctx.fillText(showTitle, textX, rect.y + Math.min(15, rect.h * 0.5));
        if (rect.h >= 32 && !cramped) {
          ctx.fillStyle = isDarkSide ? "#C5D5E8" : COLORS.inkMid;
          ctx.font = '400 10px "Noto Sans SC", sans-serif';
          ctx.fillText(fitText(ctx, b.desc, rect.w - (textX - rect.x) - 6), textX, rect.y + rect.h - 7);
        }
      }
    });

    if (blocks.length <= 1 && !state.coreInSidebar && !state.hasNoise) {
      ctx.fillStyle = isDarkSide ? COLORS.errBright : COLORS.err;
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      ctx.fillText(fitText(ctx, "空栏占道：内容不足 2 组", sw), sx, listTop + itemH + 22);
    }

    // ---------- 3. 视线优先动线叠层（可选） ----------
    if (state.showFlow) {
      ctx.save();
      const mainCx = mainRect.x + mainRect.w * 0.45;
      const sideCx = sidebarRect.x + sidebarRect.w * 0.5;
      const badOrder = metrics.dominanceTier === "侧栏压主";
      ctx.strokeStyle = badOrder ? COLORS.err : COLORS.ok;
      ctx.lineWidth = 2.6;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      if (badOrder) {
        ctx.moveTo(sideCx, sidebarRect.y + 62);
        ctx.quadraticCurveTo(sashX, spreadRect.y + 110, mainCx, mainRect.y + 150);
      } else {
        ctx.moveTo(mainCx, mainRect.y + 56);
        ctx.lineTo(mainCx, mainRect.y + mainRect.h * 0.65);
        ctx.quadraticCurveTo(sashX, spreadRect.y + spreadRect.h * 0.56, sideCx, sidebarRect.y + 92);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      const drawNode = (nx, ny, num, label, color) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(nx, ny, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFBF5";
        ctx.font = '700 11px "Space Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText(num, nx, ny + 4);
        ctx.textAlign = "left";
        roundRectPath(ctx, nx + 14, ny - 10, 74, 20, 3);
        ctx.fillStyle = "rgba(6,26,54,0.88)";
        ctx.fill();
        ctx.fillStyle = "#FFFBF5";
        ctx.font = '700 10px "Noto Sans SC", sans-serif';
        ctx.fillText(label, nx + 20, ny + 3.5);
      };
      if (badOrder) {
        drawNode(sideCx - 20, sidebarRect.y + 62, "1", "视线先被抢走", COLORS.err);
        drawNode(mainCx - 20, mainRect.y + 150, "2", "主区沦为配角", COLORS.err);
      } else {
        drawNode(mainCx - 24, mainRect.y + 56, "1", "首眼落主区", COLORS.ok);
        drawNode(sideCx - 32, sidebarRect.y + 92, "2", "按需瞥侧栏", COLORS.orange);
      }
      ctx.restore();
    }

    // ---------- 4. 外框 + 可拖动竖向分割刃（Sash） ----------
    ctx.strokeStyle = COLORS.navy;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(spreadRect.x + 0.5, spreadRect.y + 0.5, spreadRect.w - 1, spreadRect.h - 1);

    // 竖向裁切线
    ctx.strokeStyle = metrics.checks.ratioOk ? COLORS.ok : COLORS.err;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sashX, spreadRect.y);
    ctx.lineTo(sashX, spreadRect.y + spreadRect.h);
    ctx.stroke();

    // 居中实体抓手胶囊
    const pillW = 66;
    const pillH = 26;
    const px = Math.max(spreadRect.x + 4, Math.min(spreadRect.x + spreadRect.w - pillW - 4, sashX - pillW / 2));
    const py = spreadRect.y + spreadRect.h / 2 - pillH / 2;
    roundRectPath(ctx, px, py, pillW, pillH, 13);
    ctx.fillStyle = metrics.checks.ratioOk ? COLORS.ok : COLORS.err;
    ctx.fill();
    ctx.strokeStyle = "#FFFBF5";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = "#FFFBF5";
    ctx.font = '700 11px "Space Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText(`↔ ${metrics.sidebarPct}%`, px + pillW / 2, py + 17);
    ctx.textAlign = "left";
  }

  function drawMobilePreviewSpread(ctx, state, metrics, geom, scenario, hits) {
    const { phoneRect, mainRect, sidebarRect } = geom;

    // 手机外壳
    ctx.fillStyle = "#081C38";
    roundRectPath(ctx, phoneRect.x - 6, phoneRect.y - 4, phoneRect.w + 12, phoneRect.h + 8, 12);
    ctx.fill();
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(phoneRect.x, phoneRect.y, phoneRect.w, phoneRect.h);

    if (state.mobileMode === "fixed") {
      // 灾难硬并排：主区挤成细条
      ctx.fillStyle = state.contrast === "loud" ? COLORS.orangeLoud : COLORS.navy;
      ctx.fillRect(sidebarRect.x, sidebarRect.y, sidebarRect.w, sidebarRect.h);
      ctx.fillStyle = COLORS.errFill;
      ctx.fillRect(mainRect.x, mainRect.y, mainRect.w, mainRect.h);
      ctx.strokeStyle = COLORS.err;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(mainRect.x + 1, mainRect.y + 1, mainRect.w - 2, mainRect.h - 2);
      ctx.setLineDash([]);

      ctx.fillStyle = COLORS.err;
      ctx.font = '800 11px "Noto Sans SC", sans-serif';
      ctx.fillText(fitText(ctx, `主 ${metrics.mobileMainPx}px`, mainRect.w - 8), mainRect.x + 5, mainRect.y + 24);
      ctx.font = '400 10.5px "Noto Sans SC", sans-serif';
      const tinyLines = ["每行", "仅剩", `${metrics.mobileMainCPL}字`, "被迫", "横滚"];
      tinyLines.forEach((ln, i) => {
        ctx.fillText(ln, mainRect.x + 6, mainRect.y + 48 + i * 18);
      });

      ctx.fillStyle = "#FFFBF5";
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      ctx.fillText(fitText(ctx, `硬占 ${metrics.sidebarPct}%`, sidebarRect.w - 8), sidebarRect.x + 6, sidebarRect.y + 24);
    } else if (state.mobileMode === "hidden") {
      ctx.fillStyle = COLORS.paper;
      ctx.fillRect(phoneRect.x, phoneRect.y, phoneRect.w, phoneRect.h);
      ctx.fillStyle = COLORS.navy;
      ctx.font = '800 14px "Noto Sans SC", sans-serif';
      ctx.fillText(fitText(ctx, scenario.mainTitle, phoneRect.w - 20), phoneRect.x + 12, phoneRect.y + 30);
      drawMountainArtwork(ctx, phoneRect.x + 12, phoneRect.y + 44, phoneRect.w - 24, phoneRect.h - 108, 1);
      ctx.fillStyle = COLORS.errFill;
      ctx.fillRect(phoneRect.x + 12, phoneRect.y + phoneRect.h - 54, phoneRect.w - 24, 42);
      ctx.strokeStyle = COLORS.err;
      ctx.strokeRect(phoneRect.x + 12, phoneRect.y + phoneRect.h - 54, phoneRect.w - 24, 42);
      ctx.fillStyle = COLORS.err;
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      ctx.fillText("⚠ 侧栏被 display:none 彻底删掉", phoneRect.x + 20, phoneRect.y + phoneRect.h - 36);
      ctx.font = '400 10.5px "Noto Sans SC", sans-serif';
      ctx.fillText("目录与注释无入口，造成信息丢失", phoneRect.x + 20, phoneRect.y + phoneRect.h - 20);
    } else if (state.mobileMode === "drawer") {
      // 顶栏折叠抽屉按钮 + 全宽主区
      ctx.fillStyle = COLORS.navy;
      ctx.fillRect(phoneRect.x, phoneRect.y, phoneRect.w, 34);
      ctx.fillStyle = COLORS.paperIvory;
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      ctx.fillText("390px · 全宽通读", phoneRect.x + 10, phoneRect.y + 21);
      roundRectPath(ctx, phoneRect.x + phoneRect.w - 86, phoneRect.y + 6, 76, 22, 4);
      ctx.fillStyle = COLORS.orange;
      ctx.fill();
      ctx.fillStyle = "#FFFBF5";
      ctx.font = '700 10.5px "Noto Sans SC", sans-serif';
      ctx.fillText("≡ 目录抽屉", phoneRect.x + phoneRect.w - 77, phoneRect.y + 21);

      ctx.fillStyle = COLORS.navy;
      ctx.font = '800 14px "Noto Sans SC", sans-serif';
      ctx.fillText(fitText(ctx, scenario.mainTitle, phoneRect.w - 24), phoneRect.x + 12, phoneRect.y + 58);
      drawMountainArtwork(ctx, phoneRect.x + 12, phoneRect.y + 70, phoneRect.w - 24, phoneRect.h - 104, 1);
      ctx.fillStyle = COLORS.ok;
      ctx.font = '700 11px "Space Mono", monospace';
      ctx.fillText("✓ 主区 390px · 抽屉按需呼出", phoneRect.x + 12, phoneRect.y + phoneRect.h - 12);
    } else {
      // stack: 上主区 + 下侧栏自然流式堆叠
      ctx.fillStyle = COLORS.paper;
      ctx.fillRect(mainRect.x, mainRect.y, mainRect.w, mainRect.h);
      ctx.fillStyle = COLORS.navy;
      ctx.font = '800 14px "Noto Sans SC", sans-serif';
      ctx.fillText(fitText(ctx, scenario.mainTitle, mainRect.w - 20), mainRect.x + 12, mainRect.y + 24);
      drawMountainArtwork(ctx, mainRect.x + 12, mainRect.y + 34, mainRect.w - 24, mainRect.h - 44, 1);

      ctx.fillStyle = COLORS.navy;
      ctx.fillRect(sidebarRect.x, sidebarRect.y, sidebarRect.w, sidebarRect.h);
      ctx.fillStyle = COLORS.okBright;
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      ctx.fillText("↓ 侧栏自动下沉排在主文之后", sidebarRect.x + 12, sidebarRect.y + 24);
      ctx.fillStyle = "#C5D5E8";
      ctx.font = '400 10.5px "Noto Sans SC", sans-serif';
      ctx.fillText("零横向溢出 · 保留全部注释与导航", sidebarRect.x + 12, sidebarRect.y + 44);
    }

    // 提示点击返回桌面视图
    const backRect = { x: phoneRect.x + phoneRect.w + 14, y: phoneRect.y + 12, w: 96, h: 30 };
    if (backRect.x + backRect.w < geom.spreadRect.x + geom.spreadRect.w) {
      roundRectPath(ctx, backRect.x, backRect.y, backRect.w, backRect.h, 4);
      ctx.fillStyle = COLORS.navy;
      ctx.fill();
      ctx.fillStyle = COLORS.paperIvory;
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      ctx.fillText("← 回 1280 桌面", backRect.x + 10, backRect.y + 19);
      hits.push({ id: "toggle-mobile-view", rect: backRect, cursor: "pointer" });
    }
  }

  function drawMobileReflowStrip(ctx, state, metrics, rect, hits) {
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    const ok = metrics.checks.mobileOk;
    ctx.fillStyle = ok ? COLORS.okBright : COLORS.errBright;
    ctx.font = '700 11px "Space Mono", monospace';
    ctx.fillText("390px 窄屏实时监看", rect.x + 10, rect.y + 16);

    // 右侧点击切入/切出 390px 放大视角按钮
    const btnW = rect.w < 340 ? 78 : 112;
    const btnRect = { x: rect.x + rect.w - btnW - 8, y: rect.y + 8, w: btnW, h: rect.h - 16 };
    roundRectPath(ctx, btnRect.x, btnRect.y, btnRect.w, btnRect.h, 4);
    ctx.fillStyle = state.viewportPreview === "mobile" ? COLORS.orange : "#143058";
    ctx.fill();
    ctx.strokeStyle = COLORS.slate;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#FFFBF5";
    ctx.font = '700 10.5px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(
      state.viewportPreview === "mobile" ? "回桌面视图" : "点放大 390px",
      btnRect.x + btnRect.w / 2,
      btnRect.y + btnRect.h / 2 + 4
    );
    ctx.textAlign = "left";
    hits.push({ id: "toggle-mobile-view", rect: btnRect, cursor: "pointer" });

    // 迷你比例进度条
    const barX = rect.x + 10;
    const barY = rect.y + 24;
    const barW = Math.max(80, btnRect.x - barX - 12);
    const barH = Math.max(14, rect.h - 32);

    if (state.mobileMode === "fixed") {
      const mW = Math.round((barW * metrics.mainPct) / 100);
      ctx.fillStyle = COLORS.errFill;
      ctx.fillRect(barX, barY, mW, barH);
      ctx.fillStyle = COLORS.err;
      ctx.fillRect(barX + mW, barY, barW - mW, barH);
      ctx.fillStyle = COLORS.err;
      ctx.font = '700 10px "Noto Sans SC", sans-serif';
      ctx.fillText(fitText(ctx, `挤扁 主${metrics.mobileMainPx}px`, mW - 4), barX + 4, barY + barH - 4);
      ctx.fillStyle = "#FFFBF5";
      ctx.fillText(fitText(ctx, `硬并排溢出`, barW - mW - 4), barX + mW + 4, barY + barH - 4);
    } else if (state.mobileMode === "hidden") {
      ctx.fillStyle = COLORS.paper;
      ctx.fillRect(barX, barY, barW, barH);
      ctx.strokeStyle = COLORS.errBright;
      ctx.strokeRect(barX, barY, barW, barH);
      ctx.fillStyle = COLORS.err;
      ctx.font = '700 10.5px "Noto Sans SC", sans-serif';
      ctx.fillText(fitText(ctx, "⚠ 侧栏被 display:none 删掉 · 导航与注释丢失", barW - 10), barX + 6, barY + barH - 4);
    } else if (state.mobileMode === "drawer") {
      ctx.fillStyle = COLORS.okFill;
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = COLORS.ok;
      ctx.font = '700 10.5px "Noto Sans SC", sans-serif';
      ctx.fillText(fitText(ctx, "✓ 390px 全宽通读 + 顶栏 [≡ 折叠抽屉] 按需展开", barW - 10), barX + 6, barY + barH - 4);
    } else {
      ctx.fillStyle = COLORS.okFill;
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = COLORS.ok;
      ctx.font = '700 10.5px "Noto Sans SC", sans-serif';
      ctx.fillText(fitText(ctx, "✓ 390px 主区通栏在上 → 侧栏自动流式下沉在后", barW - 10), barX + 6, barY + barH - 4);
    }
  }

  // ---------- 指针与触控交互（支持 perf.mjs 60Hz 横向触控直拖 + 页面竖滑无冲突） ----------
  let activePointerId = null;
  let startX = 0;
  let startY = 0;
  let startPct = 54;
  let dragLocked = false;
  let maxMove = 0;

  function toLocal(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top, r };
  }

  function findHit(lx, ly) {
    for (let i = hitTargets.length - 1; i >= 0; i--) {
      const hItem = hitTargets[i];
      const { x, y, w: rw, h: rh } = hItem.rect;
      if (lx >= x && lx <= x + rw && ly >= y && ly <= y + rh) return hItem;
    }
    return null;
  }

  function pctFromDragDelta(dx, rectW) {
    const state = getState();
    const usable = Math.max(160, rectW - 24);
    const deltaPct = (dx / usable) * 100;
    // 右侧栏向左拖增大侧栏、向右拖缩小侧栏；左侧栏相反
    return state.side === "left" ? startPct + deltaPct : startPct - deltaPct;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const { x, y } = toLocal(e.clientX, e.clientY);
    activePointerId = e.pointerId;
    startX = x;
    startY = y;
    startPct = getState().sidebarPct;
    dragLocked = false;
    maxMove = 0;
    dragging = false;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
  });

  canvas.addEventListener("pointermove", (e) => {
    const { x, y, r } = toLocal(e.clientX, e.clientY);
    if (activePointerId !== e.pointerId) {
      const hit = findHit(x, y);
      hoveredHit = hit ? hit.id : null;
      canvas.style.cursor = hit ? hit.cursor : "ew-resize";
      return;
    }
    const dx = x - startX;
    const dy = y - startY;
    maxMove = Math.max(maxMove, Math.hypot(dx, dy));

    if (!dragLocked) {
      if (Math.abs(dx) >= 3 && Math.abs(dx) >= Math.abs(dy) * 0.8) {
        dragLocked = true;
        dragging = true;
      } else if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.4) {
        // 明显竖滑：放手让页面正常滚动
        activePointerId = null;
        return;
      }
    }

    if (dragLocked) {
      e.preventDefault();
      const rawPct = pctFromDragDelta(dx, r.width);
      handlers.onDragPct(rawPct);
    }
  });

  function finishPointer(e) {
    if (activePointerId !== e.pointerId) return;
    const { x, y } = toLocal(e.clientX, e.clientY);
    const wasDrag = dragLocked && maxMove >= 7;
    activePointerId = null;
    dragLocked = false;
    dragging = false;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
    if (!wasDrag) {
      const hit = findHit(x, y);
      if (hit) handlers.onCanvasAction(hit.id);
    } else {
      handlers.onDragEnd();
    }
  }

  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", () => {
    activePointerId = null;
    dragLocked = false;
    dragging = false;
  });

  // 键盘微调支持
  canvas.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 5 : 2;
    const isLeft = getState().side === "left";
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlers.onStepPct(isLeft ? -step : step);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handlers.onStepPct(isLeft ? step : -step);
    }
  });

  const runner = loop(canvas, renderFrame);
  const ro = new ResizeObserver(() => {
    dirty = true;
    runner.draw();
  });
  ro.observe(canvas);

  return {
    markDirty(immediate = false) {
      dirty = true;
      if (immediate || reducedMotion.matches) runner.draw();
    },
    getHovered() {
      return hoveredHit;
    },
  };
}

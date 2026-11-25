// 247 侧栏原语 · 活体量子侧栏实验舱 (2D Canvas)
// 1:1 承袭 247 原海报深松青 × 暖羊皮纸 × 建筑信号金 × 0px 锐角几何
// 支持：横拖金色右壁改容器宽 W（触发量子相变）、拖中缝改 flex-basis、直点 6 枚导航锚点切换正文、直点画布红底诊签。

import { loop, pixelRatio } from "../../lib/stage.js";
import { MIN_CONTAINER, MAX_CONTAINER, WIDE_REF, evaluate } from "./model.js";

const PAL = {
  bg: "#002E29",
  bgGrid: "rgba(188, 203, 177, 0.09)",
  rulerBg: "#023E37",
  rulerStack: "rgba(240, 185, 33, 0.14)",
  rulerSide: "rgba(108, 224, 179, 0.10)",
  rulerErr: "rgba(255, 131, 122, 0.18)",
  hairline: "#5E7F74",
  hairlineBright: "#9BB5A8",
  tealSide: "#003732",
  tealSideHover: "#064942",
  tealInk: "#072A26",
  tealSub: "#2E544E",
  cream: "#EFE6D6",
  creamTitle: "#EDE3CB",
  stone: "#CFC9BC",
  stoneLine: "#B3ACA0",
  gold: "#F0B921",
  goldDim: "#B68C1E",
  ok: "#6CE0B3",
  okInk: "#0A4A37",
  err: "#C4332C",
  errBright: "#FF837A",
  errSoft: "rgba(196, 51, 44, 0.16)",
  errStripe: "rgba(255, 131, 122, 0.34)",
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

export function mountChamber(canvas, getState, actions) {
  const ctx = canvas.getContext("2d");

  let W = 720;
  let H = 400;
  let dpr = 1;

  // 平滑视觉插值（只用于动画过渡；still=true 时一步到位）
  let anim = {
    wrapT: 0, // 0 = 并排, 1 = 堆叠
    pulse: 0, // 跨过临界线时的金色脉冲
    navFlash: 0, // 点导航项时的轻闪
    lastWrapped: false,
    intro: 0,
  };

  // 实时命中热区（每帧绘制时写入，交互完全与实绘像素同步）
  let hit = {
    wallRect: null,
    seamRect: null,
    rulerRect: null,
    navItems: [],
    faultPill: null,
    stageLeft: 0,
    stageScale: 1,
  };

  let dragMode = null; // "wall" | "seam" | null
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartVal = 0;
  let pointerId = null;
  let touchDecided = false;
  let hoverTarget = "";

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    dpr = pixelRatio(2);
    W = r.width;
    H = r.height;
    const pw = Math.round(W * dpr);
    const ph = Math.round(H * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(canvas);
  resize();

  function drawHatch(x, y, w, h, color, step = 10) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let d = -h; d < w + h; d += step) {
      ctx.beginPath();
      ctx.moveTo(x + d, y);
      ctx.lineTo(x + d - h, y + h);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTag(text, cx, cy, bg, fg, border = null, padX = 9, h = 24) {
    ctx.save();
    ctx.font = '600 11px "DM Mono", "Noto Sans SC", monospace';
    const tw = ctx.measureText(text).width;
    const bw = Math.min(W - 24, tw + padX * 2);
    const bx = clamp(cx - bw / 2, 12, W - 12 - bw);
    const by = clamp(cy - h / 2, 8, H - h - 8);
    ctx.fillStyle = bg;
    ctx.fillRect(bx, by, bw, h);
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, h - 1);
    }
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bx + bw / 2, by + h / 2 + 0.5, bw - 8);
    ctx.restore();
    return { x: bx, y: by, w: bw, h };
  }

  function frame(t, dt, { still }) {
    const state = getState();
    const ev = evaluate(state);
    const { live, flags, scene } = ev;

    if (live.wrapped !== anim.lastWrapped) {
      anim.lastWrapped = live.wrapped;
      anim.pulse = 1;
      if (live.wrapped && !state.everWrapped) actions.markWrapped();
    }

    const targetWrap = live.wrapped ? 1 : 0;
    if (still) {
      anim.wrapT = targetWrap;
      anim.pulse = 0;
      anim.navFlash = 0;
      anim.intro = 1;
    } else {
      const k = dt > 0 ? 1 - Math.exp(-dt * 14) : 0.25;
      anim.wrapT = lerp(anim.wrapT, targetWrap, k);
      if (Math.abs(anim.wrapT - targetWrap) < 0.002) anim.wrapT = targetWrap;
      anim.pulse = Math.max(0, anim.pulse - dt * 2.4);
      anim.navFlash = Math.max(0, anim.navFlash - dt * 3);
      anim.intro = Math.min(1, anim.intro + (dt > 0 ? dt * 2.5 : 0.08));
    }

    const compact = W < 440;
    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 深松青建筑底板 + 细测量网
    ctx.fillStyle = PAL.bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = PAL.bgGrid;
    ctx.lineWidth = 1;
    const gridStep = compact ? 24 : 32;
    for (let x = gridStep; x < W; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
      ctx.stroke();
    }
    for (let y = gridStep; y < H; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
      ctx.stroke();
    }

    // 2. 顶部量子临界标尺轨道
    const padX = compact ? 14 : 22;
    const rulerY = compact ? 12 : 16;
    const rulerH = compact ? 42 : 46;
    const trackX = padX;
    const trackW = W - padX * 2 - (compact ? 12 : 18); // 右侧留给金色拖壁手柄呼吸
    const scale = trackW / MAX_CONTAINER;
    hit.stageLeft = trackX;
    hit.stageScale = scale;
    hit.rulerRect = { x: trackX, y: rulerY, w: trackW, h: rulerH };

    const pxOf = (wVal) => trackX + clamp(wVal, 0, MAX_CONTAINER) * scale;
    const curEdgeX = pxOf(live.W);

    // 标尺底槽
    ctx.fillStyle = PAL.rulerBg;
    ctx.fillRect(trackX, rulerY, trackW, rulerH);

    // 堆叠区 vs 并排区着色
    if (!state.wrap) {
      ctx.fillStyle = PAL.rulerErr;
      ctx.fillRect(trackX, rulerY, trackW, rulerH);
    } else if (live.wrapThreshold <= MAX_CONTAINER) {
      const tx = pxOf(live.wrapThreshold);
      ctx.fillStyle = PAL.rulerStack;
      ctx.fillRect(trackX, rulerY, tx - trackX, rulerH);
      ctx.fillStyle = PAL.rulerSide;
      ctx.fillRect(tx, rulerY, trackX + trackW - tx, rulerH);
    } else {
      // 永久竖叠（临界线超出最大宽度）
      ctx.fillStyle = PAL.rulerErr;
      ctx.fillRect(trackX, rulerY, trackW, rulerH);
    }

    ctx.strokeStyle = PAL.hairline;
    ctx.lineWidth = 1;
    ctx.strokeRect(trackX + 0.5, rulerY + 0.5, trackW - 1, rulerH - 1);

    // 刻度线（300..900）
    ctx.font = '500 10px "DM Mono", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    for (let tick = 300; tick <= 900; tick += compact ? 200 : 100) {
      const tx = Math.round(pxOf(tick)) + 0.5;
      ctx.strokeStyle = "rgba(188,203,177,0.28)";
      ctx.beginPath();
      ctx.moveTo(tx, rulerY + rulerH - 8);
      ctx.lineTo(tx, rulerY + rulerH);
      ctx.stroke();
      ctx.fillStyle = "rgba(237,227,203,0.72)";
      ctx.fillText(`${tick}`, tx, rulerY + rulerH - 10);
    }

    // 标尺左上/右上分区说明
    ctx.font = '600 10px "DM Mono", "Noto Sans SC", monospace';
    ctx.textBaseline = "top";
    if (!state.wrap) {
      ctx.fillStyle = PAL.errBright;
      ctx.textAlign = "left";
      ctx.fillText("× flex-wrap: nowrap（无折行临界线）", trackX + 8, rulerY + 6);
    } else if (live.wrapThreshold > WIDE_REF - 36) {
      ctx.fillStyle = PAL.errBright;
      ctx.textAlign = "left";
      ctx.fillText(`× 临界 W_wrap = ${live.wrapThreshold}px > 宽屏（永久竖叠）`, trackX + 8, rulerY + 6);
    } else {
      const tx = pxOf(live.wrapThreshold);
      ctx.fillStyle = PAL.gold;
      ctx.textAlign = "left";
      if (tx - trackX > 76) ctx.fillText("堆叠区", trackX + 8, rulerY + 6);
      ctx.fillStyle = PAL.ok;
      ctx.textAlign = "right";
      if (trackX + trackW - tx > 76) ctx.fillText("双栏并排区", trackX + trackW - 8, rulerY + 6);
    }

    // 标尺上绘出精确金色临界折行线 W_wrap
    const stageTop = rulerY + rulerH + (compact ? 14 : 18);
    const footerH = compact ? 36 : 38;
    const stageH = Math.max(180, H - stageTop - footerH);

    if (state.wrap && live.wrapThreshold <= MAX_CONTAINER) {
      const tx = Math.round(pxOf(live.wrapThreshold)) + 0.5;
      ctx.save();
      ctx.strokeStyle = flags.permanentlyStacked ? PAL.errBright : PAL.gold;
      ctx.lineWidth = anim.pulse > 0 ? 2.5 : 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(tx, rulerY);
      ctx.lineTo(tx, stageTop + stageH);
      ctx.stroke();
      ctx.setLineDash([]);

      // 临界点小金标
      const lbl = compact ? `临界 ${live.wrapThreshold}` : `W_wrap ${live.wrapThreshold}px`;
      const tw = ctx.measureText(lbl).width + 12;
      const lx = clamp(tx - tw / 2, trackX + 4, trackX + trackW - tw - 4);
      ctx.fillStyle = flags.permanentlyStacked ? PAL.err : PAL.gold;
      ctx.fillRect(lx, rulerY + 4, tw, 17);
      ctx.fillStyle = flags.permanentlyStacked ? "#FFF5F0" : PAL.tealInk;
      ctx.font = '700 10px "DM Mono", "Noto Sans SC", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(lbl, lx + tw / 2, rulerY + 13);
      ctx.restore();
    }

    // 3. 活体父容器框架（左对齐 trackX，宽度实时等于 live.W * scale）
    const boxX = trackX;
    const boxY = stageTop;
    const boxW = Math.max(MIN_CONTAINER * scale, curEdgeX - boxX);
    const boxH = stageH;

    // 3a. 右侧被拖出的阴影未占区域（让用户一眼明白自己正在改「父容器宽度」）
    if (trackX + trackW - (boxX + boxW) > 6) {
      const remX = boxX + boxW + 2;
      const remW = trackX + trackW - remX;
      ctx.fillStyle = "rgba(0, 20, 18, 0.42)";
      ctx.fillRect(remX, boxY, remW, boxH);
      drawHatch(remX, boxY, remW, boxH, "rgba(188,203,177,0.10)", 14);
      if (remW > 66) {
        ctx.save();
        ctx.fillStyle = "rgba(237,227,203,0.48)";
        ctx.font = '500 10px "DM Mono", "Noto Sans SC", monospace';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("容器外余白", remX + remW / 2, boxY + boxH / 2 - 7);
        ctx.fillText(`可宽至 ${MAX_CONTAINER}px`, remX + remW / 2, boxY + boxH / 2 + 8);
        ctx.restore();
      }
    }

    // 3b. 容器主背景与 0px 锐角边框
    ctx.fillStyle = "#012A25";
    ctx.fillRect(boxX, boxY, boxW, boxH);

    // 临界相变瞬间的金色描边闪光
    if (anim.pulse > 0.02) {
      ctx.strokeStyle = `rgba(240, 185, 33, ${(anim.pulse * 0.85).toFixed(2)})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(boxX - 1.5, boxY - 1.5, boxW + 3, boxH + 3);
    }

    // 计算内部侧栏与主区矩形（像素精确按 live.sideW / live.mainW / live.G 等比映射）
    const padIn = 0; // 原海报结构示意就是紧凑贴框！
    const innerX = boxX + padIn;
    const innerY = boxY + padIn;
    const innerW = boxW - padIn * 2;
    const innerH = boxH - padIn * 2;
    const gapPx = live.G * scale;

    const sideWpx = Math.min(innerW, live.sideW * scale);
    const mainWpx = Math.min(innerW, live.mainW * scale);

    let sideRect;
    let mainRect;
    let deadRect = null;

    if (live.wrapped) {
      // 上下堆叠态（按 DOM 顺序：left 时侧栏在上，right 时主区在上！）
      const sideH =
        state.scene === "search"
          ? Math.round(innerH * 0.34)
          : state.scene === "media"
            ? Math.round(innerH * 0.38)
            : Math.round(innerH * (compact ? 0.34 : 0.33));
      const vGap = Math.max(4, Math.min(18, gapPx || 6));
      const mainH = Math.max(60, innerH - sideH - vGap);

      if (state.sidePos === "left") {
        sideRect = { x: innerX, y: innerY, w: sideWpx, h: sideH };
        mainRect = { x: innerX, y: innerY + sideH + vGap, w: mainWpx, h: mainH };
      } else {
        mainRect = { x: innerX, y: innerY, w: mainWpx, h: mainH };
        sideRect = { x: innerX, y: innerY + mainH + vGap, w: sideWpx, h: sideH };
      }

      if (live.deadVoid > 6) {
        deadRect = {
          x: sideRect.x + sideRect.w,
          y: sideRect.y,
          w: Math.max(0, innerW - sideRect.w),
          h: sideRect.h,
        };
      }
      hit.seamRect = null;
    } else {
      // 左右并排态
      if (state.sidePos === "left") {
        sideRect = { x: innerX, y: innerY, w: sideWpx, h: innerH };
        mainRect = { x: innerX + sideWpx + gapPx, y: innerY, w: Math.max(16, innerW - sideWpx - gapPx), h: innerH };
        hit.seamRect = { x: innerX + sideWpx - 10, y: innerY, w: Math.max(20, gapPx + 20), h: innerH };
      } else {
        mainRect = { x: innerX, y: innerY, w: Math.max(16, innerW - sideWpx - gapPx), h: innerH };
        sideRect = { x: innerX + innerW - sideWpx, y: innerY, w: sideWpx, h: innerH };
        hit.seamRect = { x: sideRect.x - gapPx - 10, y: innerY, w: Math.max(20, gapPx + 20), h: innerH };
      }
    }

    // 4. 绘出侧栏与主区（根据题材精确渲染）
    hit.navItems = [];
    drawSidebarPanel(sideRect, mainRect, state, ev, compact);
    drawMainPanel(mainRect, sideRect, state, ev, compact);

    // 5. 若有折行死空（sidebar flex-grow: 0），画醒目红色斜线警示框
    if (deadRect && deadRect.w > 6) {
      ctx.fillStyle = PAL.errSoft;
      ctx.fillRect(deadRect.x, deadRect.y, deadRect.w, deadRect.h);
      drawHatch(deadRect.x, deadRect.y, deadRect.w, deadRect.h, PAL.errStripe, 10);
      ctx.strokeStyle = PAL.errBright;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(deadRect.x + 1, deadRect.y + 1, deadRect.w - 2, deadRect.h - 2);
      ctx.setLineDash([]);
    }

    // 6. 并排模式的中缝可拖微调柄（调 flex-basis）
    if (!live.wrapped && hit.seamRect) {
      const sx = state.sidePos === "left" ? sideRect.x + sideRect.w + gapPx / 2 : sideRect.x - gapPx / 2;
      ctx.save();
      ctx.strokeStyle = dragMode === "seam" || hoverTarget === "seam" ? PAL.gold : "rgba(188,203,177,0.5)";
      ctx.lineWidth = dragMode === "seam" ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(sx, boxY);
      ctx.lineTo(sx, boxY + boxH);
      ctx.stroke();

      // 中缝小方柄
      const handleH = 34;
      const handleW = 10;
      const hy = boxY + boxH / 2 - handleH / 2;
      ctx.fillStyle = dragMode === "seam" || hoverTarget === "seam" ? PAL.gold : PAL.tealSide;
      ctx.fillRect(sx - handleW / 2, hy, handleW, handleH);
      ctx.strokeStyle = PAL.gold;
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - handleW / 2 + 0.5, hy + 0.5, handleW - 1, handleH - 1);
      ctx.fillStyle = dragMode === "seam" || hoverTarget === "seam" ? PAL.tealInk : PAL.gold;
      ctx.fillRect(sx - 1.5, hy + 10, 1, 14);
      ctx.fillRect(sx + 0.5, hy + 10, 1, 14);
      ctx.restore();
    }

    // 7. 原海报核心亮点：docs 题材且并排时画 3 条金色虚线引注（导航锚点 / 信息索引 / 元数据区）
    if (
      state.scene === "docs" &&
      !live.wrapped &&
      state.showCallouts &&
      state.navStructure === "grouped" &&
      mainRect.w > 240 &&
      sideRect.w > 70 &&
      !compact
    ) {
      drawPosterCallouts(sideRect, mainRect, state);
    }

    // 8. 容器外锐角细线框
    ctx.strokeStyle = ev.score === 4 ? PAL.ok : PAL.hairlineBright;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

    // 9. 右侧金色可拖拽容器壁手柄（data-perf-drag 主角操作墙）
    const wallX = boxX + boxW;
    const wallW = compact ? 16 : 18;
    hit.wallRect = { x: wallX - 10, y: boxY, w: wallW + 18, h: boxH };

    ctx.save();
    // 顶部标尺垂线
    ctx.strokeStyle = PAL.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wallX, rulerY);
    ctx.lineTo(wallX, boxY + boxH);
    ctx.stroke();

    // 顶部容器宽度读数方牌（放在标尺顶沿与刻度数字错开，绝不撞刻度）
    const wLbl = `W ${live.W}px`;
    ctx.font = '700 10px "DM Mono", monospace';
    const wlw = ctx.measureText(wLbl).width + 12;
    const wlx = clamp(wallX - wlw / 2, trackX, W - wlw - 6);
    ctx.fillStyle = PAL.creamTitle;
    ctx.fillRect(wlx, rulerY + 3, wlw, 17);
    ctx.fillStyle = PAL.tealInk;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(wLbl, wlx + wlw / 2, rulerY + 12);

    // 右壁大金条手柄
    const gripH = Math.min(84, boxH * 0.38);
    const gripY = boxY + boxH / 2 - gripH / 2;
    ctx.fillStyle = dragMode === "wall" || hoverTarget === "wall" ? "#FFD24C" : PAL.gold;
    ctx.fillRect(wallX, gripY, wallW, gripH);
    ctx.fillStyle = PAL.tealInk;
    ctx.fillRect(wallX + 5, gripY + gripH / 2 - 11, 2, 22);
    ctx.fillRect(wallX + 10, gripY + gripH / 2 - 11, 2, 22);
    ctx.restore();

    // 10. 画布内实时红底诊签（可点击一键修复或定位）
    hit.faultPill = null;
    if (deadRect && deadRect.w > 24) {
      hit.faultPill = {
        ...drawTag(
          `× 死空 ${live.deadVoid}px · 点此设 flex-grow:1`,
          deadRect.x + deadRect.w / 2,
          deadRect.y + deadRect.h / 2,
          PAL.err,
          "#FFF5F0",
          "#FFB4AC"
        ),
        action: "fixSideGrow",
      };
    } else if (flags.crushedNow) {
      hit.faultPill = {
        ...drawTag(
          `× 主区挤成 ${live.mainW}px · 点此开启折行`,
          mainRect.x + mainRect.w / 2,
          mainRect.y + mainRect.h / 2,
          PAL.err,
          "#FFF5F0",
          "#FFB4AC"
        ),
        action: "fixWrap",
      };
    } else if (flags.bloatedNow && flags.mainGrowTooSmall && state.sideGrow >= 1) {
      hit.faultPill = {
        ...drawTag(
          `× 1:1 抢宽 (${Math.round(live.sideShare * 100)}%) · 点此设 grow:999`,
          sideRect.x + sideRect.w / 2,
          sideRect.y + sideRect.h / 2,
          PAL.err,
          "#FFF5F0",
          "#FFB4AC"
        ),
        action: "fixMainGrow",
      };
    } else if (flags.permanentlyStacked) {
      hit.faultPill = {
        ...drawTag(
          `× 临界 ${live.wrapThreshold}px 过高 · 点此降回 55%`,
          boxX + boxW / 2,
          boxY + boxH / 2,
          PAL.err,
          "#FFF5F0",
          "#FFB4AC"
        ),
        action: "fixPermStack",
      };
    }

    // 11. 底沿实测尺寸条（单真源像素直出；宽 ≥ 800px 才并排显示右侧操作提示，绝不重叠）
    const footY = boxY + boxH + 10;
    const showHint = W >= 800;
    ctx.save();
    ctx.font = '500 11px "DM Mono", "Noto Sans SC", monospace';
    ctx.textBaseline = "top";
    const modeChip = live.wrapped ? "⇄ 上下堆叠" : "∥ 左右并排";
    ctx.fillStyle = ev.score === 4 ? PAL.ok : PAL.gold;
    ctx.textAlign = "left";
    ctx.fillText(modeChip, trackX, footY + 3);

    const dims = live.wrapped
      ? `${scene.sideName} ${live.sideW}px${live.deadVoid > 0 ? ` (空${live.deadVoid})` : " (100%)"} · ${scene.mainName} ${live.mainW}px`
      : `${scene.sideName} ${live.sideW}px (${Math.round(live.sideShare * 100)}%) · 缝 ${live.G}px · ${scene.mainName} ${live.mainW}px (${Math.round(live.mainShare * 100)}%)`;

    ctx.fillStyle = PAL.creamTitle;
    ctx.textAlign = showHint ? "center" : "right";
    ctx.fillText(
      dims,
      showHint ? trackX + trackW * 0.45 : W - padX,
      footY + 3,
      showHint ? trackW * 0.48 : W - padX * 2 - 78
    );

    if (showHint) {
      ctx.fillStyle = "rgba(237,227,203,0.72)";
      ctx.textAlign = "right";
      ctx.fillText("↔ 拖右金壁测折行 · 拖中缝调基准", trackX + trackW, footY + 3);
    }
    ctx.restore();

    ctx.restore();
  }

  function drawSidebarPanel(r, mainRect, state, ev, compact) {
    const { flags, live } = ev;
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();

    // 侧栏底色
    ctx.fillStyle = PAL.tealSide;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    // 过肥警示轻染
    if (flags.bloatedNow) {
      ctx.fillStyle = "rgba(196, 51, 44, 0.14)";
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }

    if (state.scene === "search") {
      // 搜索提交按钮侧栏
      const btnPad = Math.min(14, r.w * 0.1, r.h * 0.14);
      const bx = r.x + btnPad;
      const by = r.y + (live.wrapped ? btnPad : Math.max(btnPad, r.h * 0.28));
      const bw = Math.max(24, r.w - btnPad * 2);
      const bh = live.wrapped ? Math.max(28, r.h - btnPad * 2) : Math.min(48, r.h * 0.44);
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = PAL.tealInk;
      ctx.font = `700 ${compact ? 12 : 13}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(bw > 64 ? "立即检索 →" : "检索", bx + bw / 2, by + bh / 2);
      ctx.restore();
      return;
    }

    if (state.scene === "media") {
      // 几何人物侧影头像框（严禁五官，仅几何肩颈侧影）
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const rad = Math.min(r.w, r.h) * (live.wrapped ? 0.34 : 0.32);
      ctx.fillStyle = PAL.gold;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(16, rad), 0, Math.PI * 2);
      ctx.fill();
      // 极简抽象半身剪影（无五官）
      ctx.fillStyle = PAL.tealSide;
      ctx.beginPath();
      ctx.arc(cx, cy - rad * 0.22, rad * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy + rad * 0.72, rad * 0.56, Math.PI * 1.12, Math.PI * 1.88);
      ctx.fill();
      ctx.restore();
      return;
    }

    // === 原海报文档站侧栏 ===
    const pad = compact ? 10 : 14;
    const isRow = live.wrapped;
    const grouped = state.navStructure === "grouped";
    const allItems = ev.scene.navGroups.flatMap((g) => g.items);

    if (isRow) {
      // 折行后横向排开：左金圆 + 紧凑导航条，自然展现满宽效果
      const cr = Math.min(14, r.h * 0.2);
      const cyTop = r.y + pad + cr;
      if (grouped) {
        ctx.fillStyle = PAL.gold;
        ctx.beginPath();
        ctx.arc(r.x + pad + cr, cyTop, cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PAL.creamTitle;
        ctx.font = '700 11px "Outfit", "Noto Sans SC", sans-serif';
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("导航锚点 · 折行满宽态", r.x + pad + cr * 2 + 10, cyTop);
      } else {
        ctx.fillStyle = PAL.errBright;
        ctx.font = '600 10px "DM Mono", "Noto Sans SC", monospace';
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("平铺列表（未分组）", r.x + pad, cyTop);
      }

      // 横向 3×2 或单行排列 6 枚导航项
      const cols = r.w > 340 ? 3 : 2;
      const rows = Math.ceil(allItems.length / cols);
      const startY = cyTop + cr + 8;
      const cellW = (r.w - pad * 2 - (cols - 1) * 6) / cols;
      const cellH = Math.max(16, (r.h - (startY - r.y) - pad - (rows - 1) * 4) / rows);

      allItems.forEach((item, i) => {
        const c = i % cols;
        const rw = Math.floor(i / cols);
        const ix = r.x + pad + c * (cellW + 6);
        const iy = startY + rw * (cellH + 4);
        const active = state.activeNav === item.id;
        ctx.fillStyle = active ? "rgba(240, 185, 33, 0.2)" : "rgba(255,255,255,0.05)";
        ctx.fillRect(ix, iy, cellW, cellH);
        if (active) {
          ctx.fillStyle = PAL.gold;
          ctx.fillRect(ix, iy, 3, cellH);
        }
        ctx.fillStyle = active ? PAL.gold : "rgba(237,227,203,0.82)";
        ctx.font = `${active ? 700 : 500} 10px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(item.title, ix + 7, iy + cellH / 2 + 0.5, cellW - 10);
        hit.navItems.push({ id: item.id, x: ix, y: iy, w: cellW, h: cellH });
      });
    } else {
      // 并排竖向侧栏：1:1 复刻原海报（金圆标 + 短金杠 + 分组列表 + 虚线分隔 + 底部金杠）
      let y = r.y + pad;
      if (grouped) {
        const cr = Math.min(20, r.w * 0.18, r.h * 0.08);
        ctx.fillStyle = PAL.gold;
        ctx.beginPath();
        ctx.arc(r.x + r.w / 2, y + cr, cr, 0, Math.PI * 2);
        ctx.fill();
        y += cr * 2 + 12;

        // 顶部金杠
        ctx.fillStyle = PAL.gold;
        ctx.fillRect(r.x + pad, y, Math.min(r.w - pad * 2, 52), 6);
        y += 18;
      } else {
        // 平铺无锚点态
        ctx.fillStyle = "rgba(255, 131, 122, 0.22)";
        ctx.fillRect(r.x + pad, y, r.w - pad * 2, 18);
        ctx.fillStyle = PAL.errBright;
        ctx.font = '600 10px "Noto Sans SC", sans-serif';
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("平铺链接墙（无分组）", r.x + pad + 5, y + 9, r.w - pad * 2 - 8);
        y += 26;
      }

      const footReserve = grouped ? 26 : 10;
      const availH = Math.max(96, r.y + r.h - footReserve - y);
      const rowH = Math.min(28, (availH - (grouped ? 16 : 0)) / allItems.length);

      allItems.forEach((item, i) => {
        if (grouped && i === 4) {
          // 原海报虚线分组隔断！
          ctx.save();
          ctx.strokeStyle = "rgba(237, 227, 203, 0.35)";
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(r.x + pad, y + 5);
          ctx.lineTo(r.x + r.w - pad, y + 5);
          ctx.stroke();
          ctx.restore();
          y += 14;
        }

        const active = state.activeNav === item.id;
        const iy = y;
        const ih = Math.max(16, rowH - 3);
        if (active) {
          ctx.fillStyle = "rgba(240, 185, 33, 0.16)";
          ctx.fillRect(r.x + pad - 4, iy, r.w - pad * 2 + 8, ih);
        }

        // 圆点 + 标题或极简线条（宽够显示字，过窄时露出挤断警示）
        ctx.fillStyle = active ? PAL.gold : "rgba(188, 203, 177, 0.62)";
        ctx.beginPath();
        ctx.arc(r.x + pad + 3, iy + ih / 2, active ? 3 : 2.2, 0, Math.PI * 2);
        ctx.fill();

        if (r.w >= 96) {
          ctx.fillStyle = active ? PAL.gold : "rgba(237, 227, 203, 0.86)";
          ctx.font = `${active ? 700 : 400} ${r.w < 120 ? 10 : 11}px "Noto Sans SC", sans-serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(item.title, r.x + pad + 11, iy + ih / 2 + 0.5, r.w - pad * 2 - 14);
        } else {
          ctx.fillStyle = active ? PAL.gold : "rgba(188, 203, 177, 0.55)";
          ctx.fillRect(r.x + pad + 10, iy + ih / 2 - 1.5, Math.max(10, r.w - pad * 2 - 14), 3);
        }

        hit.navItems.push({ id: item.id, x: r.x + 4, y: iy, w: r.w - 8, h: ih });
        y += rowH;
      });

      // 底部金杠（复刻原海报）
      if (grouped) {
        ctx.fillStyle = PAL.gold;
        ctx.fillRect(r.x + pad, r.y + r.h - pad - 6, Math.min(r.w - pad * 2, 64), 6);
      }
    }

    ctx.restore();
  }

  function drawMainPanel(r, sideRect, state, ev, compact) {
    const { flags, live } = ev;
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();

    // 暖羊皮纸主底
    ctx.fillStyle = PAL.cream;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    // 挤扁时叠一层红色压迫斜纹边框
    if (flags.crushedNow) {
      ctx.fillStyle = "rgba(196, 51, 44, 0.08)";
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = PAL.err;
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    }

    const pad = compact ? 12 : 18;
    const allItems = ev.scene.navGroups.flatMap((g) => g.items);
    const activeItem = allItems.find((x) => x.id === state.activeNav) || allItems[0];

    if (state.scene === "search") {
      // 搜索输入框主区
      const boxH = Math.min(48, r.h * 0.44);
      const bx = r.x + pad;
      const by = r.y + (r.h - boxH) / 2;
      const bw = Math.max(24, r.w - pad * 2);
      ctx.fillStyle = "#FAF6ED";
      ctx.fillRect(bx, by, bw, boxH);
      ctx.strokeStyle = flags.crushedNow ? PAL.err : PAL.tealInk;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, boxH - 1);
      ctx.fillStyle = PAL.tealSub;
      ctx.font = '500 12px "Noto Sans SC", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(
        bw < 130 ? "搜索被挤扁…" : activeItem.heading,
        bx + 12,
        by + boxH / 2,
        Math.max(10, bw - 20)
      );
      ctx.restore();
      return;
    }

    if (state.scene === "media") {
      const x0 = r.x + pad;
      let y0 = r.y + pad + 4;
      const cw = Math.max(20, r.w - pad * 2);
      ctx.fillStyle = PAL.tealInk;
      ctx.font = `700 ${compact ? 14 : 16}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(activeItem.heading, x0, y0, cw);
      y0 += 24;
      ctx.fillStyle = "#7D5600";
      ctx.font = '600 10px "DM Mono", "Noto Sans SC", monospace';
      ctx.fillText(activeItem.tag, x0, y0, cw);
      y0 += 20;
      ctx.fillStyle = PAL.tealInk;
      ctx.fillRect(x0, y0, Math.min(cw, 90), 2);
      y0 += 14;
      const lines = live.W < 420 && !live.wrapped ? 5 : 3;
      for (let i = 0; i < lines; i++) {
        ctx.fillStyle = PAL.stone;
        const lw = cw * (i === lines - 1 ? 0.62 : 0.94);
        ctx.fillRect(x0, y0 + i * 14, Math.max(10, lw), 6);
      }
      ctx.restore();
      return;
    }

    // === 原海报文档站主区（1:1 复刻原海报：深青大标题条 + 细线 + 正文行 + 金方深青圆主图 + 底排三张暖石卡） ===
    const reserveLeft =
      !live.wrapped && state.showCallouts && state.navStructure === "grouped" && r.w > 240 && !compact
        ? Math.min(142, r.w * 0.28)
        : 0;
    const cx = r.x + pad + reserveLeft;
    const cw = Math.max(28, r.w - pad * 2 - reserveLeft);
    let cy = r.y + pad;

    // 激活章节标签 + 标题条
    ctx.fillStyle = "#7D5600";
    ctx.font = '600 10px "DM Mono", "Noto Sans SC", monospace';
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(activeItem.tag, cx, cy, cw);
    cy += 15;

    // 深松青主标实心块（带当前章节真字！）
    const headH = compact ? 24 : 28;
    ctx.fillStyle = anim.navFlash > 0.05 ? "#0A524A" : PAL.tealSide;
    ctx.fillRect(cx, cy, Math.min(cw, cw * 0.86), headH);
    ctx.fillStyle = PAL.creamTitle;
    ctx.font = `700 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText(activeItem.heading, cx + 8, cy + headH / 2 + 0.5, Math.max(10, cw * 0.86 - 14));
    cy += headH + 8;

    // 细深青横线
    ctx.fillStyle = PAL.tealInk;
    ctx.fillRect(cx, cy, cw * 0.62, 2);
    cy += 12;

    // 中部：左正文灰条 + 右招牌「金色方块内嵌深青圆」
    const midH = Math.max(46, Math.min(92, (r.y + r.h - cy - pad) * 0.44));
    const showGoldSquare = cw > 120;
    const sqSize = showGoldSquare ? Math.min(midH, cw * 0.34) : 0;
    const textW = showGoldSquare ? Math.max(24, cw - sqSize - 14) : cw;

    const lineCount = Math.max(3, Math.floor(midH / 13));
    for (let i = 0; i < lineCount; i++) {
      const ly = cy + i * 12;
      if (ly + 5 > cy + midH) break;
      ctx.fillStyle = i === 0 ? "#B9B2A4" : PAL.stone;
      ctx.fillRect(cx, ly, textW * (i === lineCount - 1 ? 0.68 : 0.96), 5);
    }

    if (showGoldSquare) {
      const sx = cx + cw - sqSize;
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(sx, cy, sqSize, sqSize);
      ctx.fillStyle = PAL.tealSide;
      ctx.beginPath();
      ctx.arc(sx + sqSize / 2, cy + sqSize / 2, sqSize * 0.24, 0, Math.PI * 2);
      ctx.fill();
    }

    cy += midH + 12;

    // 底部：三张暖石卡片（被挤窄时直观看见卡片塌缩！）
    const cardH = Math.max(28, r.y + r.h - pad - cy);
    if (cardH > 22) {
      const cardGap = cw < 120 ? 4 : 10;
      const cardW = (cw - cardGap * 2) / 3;
      for (let i = 0; i < 3; i++) {
        const kx = cx + i * (cardW + cardGap);
        ctx.fillStyle = PAL.stone;
        ctx.fillRect(kx, cy, Math.max(6, cardW), cardH);
        // 卡片内小深青杠与字
        if (cardW > 24) {
          ctx.fillStyle = PAL.tealInk;
          ctx.fillRect(kx + 7, cy + 10, Math.max(6, cardW - 14), 2.5);
        }
        if (cardW > 52 && cardH > 40) {
          ctx.fillStyle = PAL.tealSub;
          ctx.font = '600 10px "Noto Sans SC", sans-serif';
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(activeItem.cards[i] || "", kx + 7, cy + 18, cardW - 12);
          ctx.fillStyle = PAL.stoneLine;
          ctx.fillRect(kx + 7, cy + 34, cardW * 0.68, 3);
          ctx.fillRect(kx + 7, cy + 41, cardW * 0.48, 3);
        }
      }
    }

    ctx.restore();
  }

  // 1:1 复刻原海报三条金色点虚线跨缝引注
  function drawPosterCallouts(sideRect, mainRect, state) {
    const isLeft = state.sidePos === "left";
    if (!isLeft) return; // 经典左置时精确对齐原海报
    const callouts = [
      { yFrac: 0.20, title: "导航锚点", sub: "全局方向与定位" },
      { yFrac: 0.49, title: "信息索引", sub: "分组快速跳转" },
      { yFrac: 0.77, title: "元数据区", sub: "情境与状态" },
    ];
    ctx.save();
    for (const c of callouts) {
      const y = sideRect.y + sideRect.h * c.yFrac;
      const x1 = sideRect.x + sideRect.w - 14;
      const x2 = mainRect.x + 14;
      // 金点
      ctx.fillStyle = PAL.gold;
      ctx.beginPath();
      ctx.arc(x1, y, 3, 0, Math.PI * 2);
      ctx.fill();
      // 跨缝虚线
      ctx.strokeStyle = PAL.goldDim;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(x1 + 4, y);
      ctx.lineTo(x2 - 4, y);
      ctx.stroke();
      ctx.setLineDash([]);
      // 右侧暖纸文字注
      ctx.fillStyle = PAL.tealInk;
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(c.title, x2, y - 5);
      ctx.fillStyle = PAL.tealSub;
      ctx.font = '400 10px "Noto Sans SC", sans-serif';
      ctx.fillText(c.sub, x2, y + 9);
    }
    ctx.restore();
  }

  // ---------- 指针与触控交互 ----------
  function posOf(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function inRect(p, r) {
    return !!r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  }

  function startDrag(x, y, isTouch) {
    const state = getState();
    const p = { x, y };

    // 1. 优先命中红底诊签（仅点按）
    if (inRect(p, hit.faultPill)) {
      actions.applyQuickFix(hit.faultPill.action);
      return true;
    }

    // 2. 命中侧栏导航锚点
    for (const item of hit.navItems) {
      if (inRect(p, item)) {
        actions.setNav(item.id);
        anim.navFlash = 1;
        ctl.draw();
        return true;
      }
    }

    // 3. 命中中缝拖柄（调 flex-basis）
    if (!isTouch && inRect(p, hit.seamRect)) {
      dragMode = "seam";
      dragStartX = x;
      dragStartVal = state.basis;
      return true;
    }

    // 4. 命中金色右壁或标尺或任意空白画布（横拖调容器宽 W）
    dragMode = "wall";
    dragStartX = x;
    dragStartY = y;
    dragStartVal = state.containerW;
    // 若直接点击标尺栏，直接跳转到该宽度
    if (!isTouch && inRect(p, hit.rulerRect) && hit.stageScale > 0) {
      const targetW = clamp(
        Math.round((x - hit.stageLeft) / hit.stageScale),
        MIN_CONTAINER,
        MAX_CONTAINER
      );
      actions.setContainerW(targetW);
      dragStartVal = targetW;
    }
    return true;
  }

  function moveDrag(x) {
    if (!dragMode || hit.stageScale <= 0) return;
    const dx = x - dragStartX;
    const state = getState();
    if (dragMode === "wall") {
      const nextW = clamp(
        Math.round(dragStartVal + dx / hit.stageScale),
        MIN_CONTAINER,
        MAX_CONTAINER
      );
      if (nextW !== state.containerW) actions.setContainerW(nextW);
    } else if (dragMode === "seam") {
      const sign = state.sidePos === "left" ? 1 : -1;
      const nextB = clamp(
        Math.round(dragStartVal + (sign * dx) / hit.stageScale),
        90,
        360
      );
      if (nextB !== state.basis) actions.setBasis(nextB);
    }
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触控走专用横向锁，保证竖滑不挡滚页
    const p = posOf(e);
    if (startDrag(p.x, p.y, false)) {
      pointerId = e.pointerId;
      try {
        canvas.setPointerCapture(pointerId);
      } catch {}
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const p = posOf(e);
    if (dragMode) {
      moveDrag(p.x);
      return;
    }
    let nextHover = "";
    if (inRect(p, hit.faultPill) || hit.navItems.some((n) => inRect(p, n))) {
      nextHover = "click";
      canvas.style.cursor = "pointer";
    } else if (inRect(p, hit.seamRect)) {
      nextHover = "seam";
      canvas.style.cursor = "col-resize";
    } else if (inRect(p, hit.wallRect) || inRect(p, hit.rulerRect)) {
      nextHover = "wall";
      canvas.style.cursor = "ew-resize";
    } else {
      canvas.style.cursor = "ew-resize";
    }
    if (nextHover !== hoverTarget) {
      hoverTarget = nextHover;
      ctl.draw();
    }
  });

  const endPointer = () => {
    dragMode = null;
    if (pointerId != null) {
      try {
        canvas.releasePointerCapture(pointerId);
      } catch {}
      pointerId = null;
    }
  };
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  // 触屏：竖直滑动归浏览器滚页，横向拖动实时拉容器宽 W（perf.mjs 也会用 touch 事件横拖它！）
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const r = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - r.left;
      const y = e.touches[0].clientY - r.top;
      touchDecided = false;
      dragStartX = x;
      dragStartY = y;
      dragStartVal = getState().containerW;
      // 若直接点在红底诊签或导航项上，先记录等 touchend 或直接触发
      if (inRect({ x, y }, hit.faultPill)) {
        actions.applyQuickFix(hit.faultPill.action);
        dragMode = null;
        return;
      }
      for (const item of hit.navItems) {
        if (inRect({ x, y }, item)) {
          actions.setNav(item.id);
          anim.navFlash = 1;
          ctl.draw();
          dragMode = null;
          return;
        }
      }
      dragMode = "wall";
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!dragMode || e.touches.length !== 1) return;
      const r = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - r.left;
      const y = e.touches[0].clientY - r.top;
      if (!touchDecided) {
        const adx = Math.abs(x - dragStartX);
        const ady = Math.abs(y - dragStartY);
        if (adx < 4 && ady < 4) return;
        if (ady > adx * 1.25) {
          dragMode = null; // 让用户顺畅竖向滚页
          return;
        }
        touchDecided = true;
      }
      e.preventDefault();
      moveDrag(x);
    },
    { passive: false }
  );

  canvas.addEventListener("touchend", () => {
    dragMode = null;
    touchDecided = false;
  });

  // 键盘操作（画布聚焦时左右键调容器宽 W）
  canvas.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 60 : 20;
    const state = getState();
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      actions.setContainerW(clamp(state.containerW - step, MIN_CONTAINER, MAX_CONTAINER));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      actions.setContainerW(clamp(state.containerW + step, MIN_CONTAINER, MAX_CONTAINER));
    }
  });

  const ctl = loop(canvas, frame);
  return {
    draw: () => ctl.draw(),
    destroy: () => ro.disconnect(),
  };
}

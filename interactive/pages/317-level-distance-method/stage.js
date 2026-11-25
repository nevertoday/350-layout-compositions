// 317 平远法 · 全页 2D Canvas 绘制引擎（共用 model.js 单一真源，零 WebGL 负担，慢机/软件渲染稳 60 帧）
import { pixelRatio } from "../../lib/stage.js";
import {
  SCENES,
  OBSTACLE_SPECS,
  BAR_WIDTHS,
  PALETTE,
  clamp,
  computeScrollRect,
  computeAtmosphere,
  evaluateBars,
  rgbCss,
} from "./model.js";

function fitCanvas(canvas) {
  const w = Math.max(1, Math.round(canvas.clientWidth));
  const h = Math.max(1, Math.round(canvas.clientHeight));
  const dpr = pixelRatio(w < 640 ? 1.5 : 2);
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// 确定性山水起伏，确保每套题材拥有独特且不晃动的连绵轮廓
function ridgeY(u, layer, seed) {
  const p = u * Math.PI * 2;
  if (seed === 2) {
    // 宋元江渚：低缓江南坡岸
    const a = Math.sin(p * (1.2 + layer * 0.45) + layer * 1.9) * 0.45;
    const b = Math.cos(p * (2.6 + layer * 0.7) + layer * 0.8) * 0.28;
    const c = Math.sin(p * 4.9 + layer * 2.4) * 0.14;
    return 0.48 + a * 0.42 + b * 0.34 + c * 0.25;
  }
  if (seed === 3) {
    // 宽银幕原野：漫长平缓台地与远丘
    const a = Math.sin(p * (0.9 + layer * 0.35) + layer * 2.7) * 0.38;
    const b = Math.sin(p * (2.2 + layer * 0.5) + layer * 1.1) * 0.22;
    const c = Math.cos(p * 5.2 + layer * 0.6) * 0.08;
    return 0.44 + a * 0.38 + b * 0.30 + c * 0.20;
  }
  // 原海报平远：三叠清雅远岫，中左与右端舒缓隆起
  const a = Math.sin(p * (1.35 + layer * 0.42) + 0.6 + layer * 1.65) * 0.46;
  const b = Math.cos(p * (2.85 + layer * 0.55) + 1.1 + layer * 2.1) * 0.30;
  const c = Math.sin(p * (5.4 + layer * 0.8) + layer * 0.7) * 0.14;
  return 0.50 + a * 0.44 + b * 0.35 + c * 0.24;
}

function drawBird(ctx, x, y, s, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, s * 0.22);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - s, y - s * 0.15);
  ctx.quadraticCurveTo(x - s * 0.42, y - s * 0.55, x, y + s * 0.05);
  ctx.quadraticCurveTo(x + s * 0.42, y - s * 0.55, x + s, y - s * 0.15);
  ctx.stroke();
}

function drawDotMatrix(ctx, x0, y0, cols, rows, gapX, gapY, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let row = 0; row < rows; row++) {
    const cy = y0 + row * gapY;
    for (let col = 0; col < cols; col++) {
      const cx = x0 + col * gapX;
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
  }
  ctx.fill();
}

// ---------- 开场主角舞台：平远手卷展平与横带排布台 ----------
export function createHeroRenderer(canvas) {
  let hitTargets = {
    rect: null,
    horizonLineY: 0,
    tiltHandle: null,
    heightHandle: null,
    leftRoller: null,
    rightRoller: null,
    bars: {},
    obstacles: [],
  };

  function draw(state, evaluation, anim = { intro: 1, t: 0, hover: null, dragging: null }) {
    const { ctx, w, h } = fitCanvas(canvas);
    const sc = SCENES[state.scene] || SCENES.poster;
    const intro = clamp(anim.intro, 0, 1);
    const ease = 1 - (1 - intro) ** 3;

    // 整幅素宣台面底色（与原海报一致，无外框黑盒）
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    // 极轻素宣水平暗纹（合并为单次 path 绘制，降软件光栅开销）
    ctx.strokeStyle = "rgba(20, 27, 24, 0.045)";
    ctx.lineWidth = 1;
    const gridStep = Math.max(28, Math.round(h / 10));
    ctx.beginPath();
    for (let gy = gridStep; gy < h; gy += gridStep) {
      ctx.moveTo(0, gy + 0.5);
      ctx.lineTo(w, gy + 0.5);
    }
    ctx.stroke();

    // 计算当前实绘手卷画心（开场前 0.6 秒轻轻由微收缓落至初始错态，不跳去答案）
    const displayOpen = state.openRatio * (0.90 + 0.10 * ease);
    const rect = computeScrollRect(w, h, displayOpen);
    const atmo = evaluation.atmo;
    const barsEval = evaluation.bars;
    const compact = w < 520;

    // 左右绫边卷幕（模拟未展完的手卷装裱，外侧柔和过渡到台面）
    const silkGradL = ctx.createLinearGradient(0, 0, rect.x, 0);
    silkGradL.addColorStop(0, "rgba(199, 207, 192, 0.22)");
    silkGradL.addColorStop(1, "rgba(191, 200, 184, 0.72)");
    ctx.fillStyle = silkGradL;
    ctx.fillRect(0, rect.y - 6, rect.x, rect.h + 12);

    const silkGradR = ctx.createLinearGradient(rect.x + rect.w, 0, w, 0);
    silkGradR.addColorStop(0, "rgba(191, 200, 184, 0.72)");
    silkGradR.addColorStop(1, "rgba(199, 207, 192, 0.22)");
    ctx.fillStyle = silkGradR;
    ctx.fillRect(rect.x + rect.w, rect.y - 6, w - (rect.x + rect.w), rect.h + 12);

    // 裁剪至手卷画心内部绘制真实山水、地平线与三横带
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();

    // 画心天空与水面素宣底
    const skyGrad = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    skyGrad.addColorStop(0, sc.skyTop);
    skyGrad.addColorStop(0.55, sc.skyBot);
    skyGrad.addColorStop(1, sc.waterBg);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    const cx = rect.x + rect.w / 2;
    const hy = rect.y + rect.h * state.horizonY;
    const rad = (state.tiltDeg * Math.PI) / 180;

    // 围绕画心水平中心按 tiltDeg 旋转地平坐标系（倾角不为 0 时整个远山与水面真实偏斜！）
    ctx.save();
    ctx.translate(cx, hy);
    ctx.rotate(rad);

    const spanW = rect.w * 1.45;
    const leftX = -spanW / 2;
    const rightX = spanW / 2;

    // 三叠远岫（逐层由远至近，颜色直接取自 model.computeAtmosphere，确保画与读数同源）
    const layers = [
      { rgb: atmo.farRgb, amp: rect.h * 0.24, base: rect.h * 0.03, idx: 0 },
      { rgb: atmo.midFarRgb, amp: rect.h * 0.17, base: rect.h * 0.02, idx: 1 },
      { rgb: atmo.nearRidgeRgb, amp: rect.h * 0.115, base: rect.h * 0.01, idx: 2 },
    ];
    for (const ly of layers) {
      ctx.beginPath();
      ctx.moveTo(leftX, 4);
      const steps = compact ? 32 : 48;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const px = leftX + u * spanW;
        const elev = ridgeY(u, ly.idx, sc.ridgeSeed) * ly.amp + ly.base;
        ctx.lineTo(px, -elev);
      }
      ctx.lineTo(rightX, 4);
      ctx.closePath();
      ctx.fillStyle = rgbCss(ly.rgb, 0.96);
      ctx.fill();

      // 空气衰减很低时（焦黑错态）出现生硬硬轮廓线，直观呈现“无明晦贴成纸墙”
      if (state.haze < 36) {
        const hardAlpha = clamp((36 - state.haze) / 36, 0, 1) * 0.85;
        ctx.strokeStyle = `rgba(15, 38, 23, ${hardAlpha.toFixed(2)})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    }

    // 宋元江渚题材：在近岸增添几缕写意淡墨枯枝剪影（绝不画人脸五官）
    if (state.scene === "song") {
      ctx.strokeStyle = "rgba(29, 63, 47, 0.55)";
      ctx.lineWidth = 1.3;
      const tx = -rect.w * 0.36;
      ctx.beginPath();
      ctx.moveTo(tx, 0);
      ctx.lineTo(tx - 2, -rect.h * 0.17);
      ctx.moveTo(tx - 1, -rect.h * 0.11);
      ctx.lineTo(tx + 12, -rect.h * 0.16);
      ctx.moveTo(tx - 1, -rect.h * 0.08);
      ctx.lineTo(tx - 13, -rect.h * 0.13);
      ctx.stroke();
    }

    // 落日朱阳（贴近地平线上方，右端 0.81 或镜像位）
    const sunRelX = (state.sunU - 0.5) * rect.w;
    const sunR = clamp(rect.h * 0.068, 9, 17);
    const sunCy = -sunR * 1.18;
    ctx.beginPath();
    ctx.arc(sunRelX, sunCy, sunR, 0, Math.PI * 2);
    ctx.fillStyle = sc.sunColor;
    ctx.fill();

    // 原海报标志：落日正下方穿过地平线的 5 行递减虚线水波倒影（单次 stroke 合批）
    const ripRows = [
      { dy: 10, segs: [-1.4, -0.5, 0.4, 1.3], len: 0.48 },
      { dy: 16, segs: [-1.05, -0.1, 0.85], len: 0.52 },
      { dy: 22, segs: [-0.75, 0.25], len: 0.55 },
      { dy: 28, segs: [-0.35, 0.35], len: 0.38 },
      { dy: 34, segs: [0], len: 0.36 },
    ];
    ctx.strokeStyle = "rgba(20, 48, 34, 0.45)";
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    for (const rr of ripRows) {
      if (rr.dy > rect.h * (1 - state.horizonY) - 6) continue;
      for (const sx of rr.segs) {
        const x1 = sunRelX + (sx - rr.len * 0.5) * sunR;
        const x2 = sunRelX + (sx + rr.len * 0.5) * sunR;
        ctx.moveTo(x1, rr.dy);
        ctx.lineTo(x2, rr.dy);
      }
    }
    ctx.stroke();

    // 归鸿飞鸟（柔和缓慢微飘，单次 stroke 合批）
    const drift = Math.sin(anim.t * 0.7) * 3;
    const birdPts = [
      [0.02, -0.26, 4.4],
      [0.08, -0.22, 3.6],
      [0.18, -0.32, 4.8],
      [0.25, -0.28, 4.1],
      [0.31, -0.35, 5.2],
      [0.37, -0.25, 4.0],
      [0.42, -0.29, 4.3],
    ];
    ctx.strokeStyle = "rgba(20, 27, 24, 0.72)";
    ctx.lineWidth = 1.05;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i < birdPts.length; i++) {
      const [bu, bv, bs] = birdPts[i];
      const s = compact ? bs * 0.85 : bs;
      const bx = bu * rect.w + drift * (0.5 + (i % 3) * 0.2);
      const by = bv * rect.h + Math.cos(anim.t * 1.1 + i) * 1.2;
      if (by > -rect.h * state.horizonY + 8) {
        ctx.moveTo(bx - s, by - s * 0.15);
        ctx.quadraticCurveTo(bx - s * 0.42, by - s * 0.55, bx, by + s * 0.05);
        ctx.quadraticCurveTo(bx + s * 0.42, by - s * 0.55, bx + s, by - s * 0.15);
      }
    }
    ctx.stroke();

    // 远岸左端微小方标（复刻 317 原海报地平线左缘深松小方墩）
    const pinX = -rect.w * 0.42;
    ctx.fillStyle = PALETTE.pine;
    ctx.fillRect(pinX, -6, 5, 6);

    // 通幅地平线（倾歪或越带时转警示深赤，平直入带为深松松烟墨）
    const horizonGood = evaluation.pillars.horizon.ok;
    ctx.strokeStyle = horizonGood ? PALETTE.horizonInk : PALETTE.err;
    ctx.lineWidth = horizonGood ? 2.1 : 2.3;
    ctx.beginPath();
    ctx.moveTo(leftX, 0);
    ctx.lineTo(rightX, 0);
    ctx.stroke();

    // 若倾斜，画出水平 0° 虚线基准辅助参考线，让眼睛一眼看到偏了多少度
    if (!evaluation.pillars.horizon.ok && Math.abs(state.tiltDeg) > 0.6) {
      ctx.save();
      ctx.rotate(-rad);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(15, 38, 23, 0.36)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-rect.w * 0.48, 0);
      ctx.lineTo(rect.w * 0.48, 0);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore(); // 结束地平倾斜坐标系

    // ---------- 水面下方：原海报标志三道可直拖横带 + 7×3 点阵 ----------
    const belowTop = clamp(hy + 12, rect.y + rect.h * 0.32, rect.y + rect.h - 46);
    const belowH = Math.max(38, rect.y + rect.h - belowTop - 8);
    const row0Y = Math.round(belowTop + belowH * 0.14);
    const row0H = Math.round(clamp(belowH * 0.34, 14, 28));
    const row1Y = Math.round(belowTop + belowH * 0.62);
    const row1H = Math.round(clamp(belowH * 0.15, 7, 13));
    const vermH = Math.round(clamp(belowH * 0.34, 14, 28));
    const vermY = Math.round(row1Y - (vermH - row1H) * 0.5);

    // 原海报深松长条下方的 7×3 微点阵
    const dotsX = rect.x + rect.w * 0.06;
    const dotsY = Math.min(rect.y + rect.h - 24, row0Y + row0H + 10);
    if (rect.w > 180 && dotsY + 14 < rect.y + rect.h) {
      drawDotMatrix(ctx, dotsX, dotsY, 7, 3, compact ? 8 : 11, compact ? 6 : 8, 1.35, "rgba(20, 27, 24, 0.55)");
    }

    const barRects = {
      pine: {
        x: rect.x + barsEval.pine.l * rect.w,
        y: row0Y,
        w: barsEval.pine.w * rect.w,
        h: row0H,
        color: sc.nearBar,
        label: "深松近岸",
      },
      sage: {
        x: rect.x + barsEval.sage.l * rect.w,
        y: row1Y,
        w: barsEval.sage.w * rect.w,
        h: row1H,
        color: sc.midBar,
        label: "烟灰中洲",
      },
      vermilion: {
        x: rect.x + barsEval.verm.l * rect.w,
        y: vermY,
        w: barsEval.verm.w * rect.w,
        h: vermH,
        color: sc.accentBar,
        label: "朱橙点睛",
      },
    };

    for (const key of ["pine", "sage", "vermilion"]) {
      const b = barRects[key];
      const active = anim.hover === `bar:${key}` || anim.dragging === `bar:${key}`;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);

      // 撞叠警示框（仅在确实挤叠时标出，不画杂乱装饰）
      if (!barsEval.pass && (key !== "pine" || barsEval.stacked)) {
        ctx.strokeStyle = "rgba(168, 45, 30, 0.85)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
        ctx.setLineDash([]);
      } else if (active) {
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 1.6;
        ctx.strokeRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
      }

      // 横带中段小把手微点（提示可左右拖动）
      const midX = b.x + b.w / 2;
      const midY = b.y + b.h / 2;
      ctx.fillStyle = key === "sage" ? "rgba(20,27,24,0.62)" : "rgba(242,245,239,0.85)";
      ctx.fillRect(midX - 6, midY - 1, 12, 2);
    }

    // ---------- 刺穿地平线的竖向杂障（可直接在画布点除！） ----------
    const obsHits = [];
    for (const spec of OBSTACLE_SPECS) {
      if (!state.obstacles[spec.id]) continue;
      const ox = rect.x + spec.u * rect.w;
      const ow = clamp(spec.w * rect.w, 16, 30);
      const oh = clamp(spec.h * rect.h, 66, rect.h * 0.62);
      const oy = clamp(hy - oh * 0.56, rect.y + 8, rect.y + rect.h - oh - 8);
      const isHov = anim.hover === `obs:${spec.id}`;

      ctx.fillStyle = isHov ? "rgba(168, 45, 30, 0.94)" : "rgba(168, 45, 30, 0.80)";
      ctx.fillRect(ox - ow / 2, oy, ow, oh);
      ctx.strokeStyle = "#F7ECE9";
      ctx.lineWidth = 1.25;
      ctx.strokeRect(ox - ow / 2 + 2, oy + 2, ow - 4, oh - 4);

      // 清晰“×”点除提示
      ctx.strokeStyle = "#FDF8F6";
      ctx.lineWidth = 1.8;
      const cxO = ox;
      const cyO = oy + oh * 0.5;
      ctx.beginPath();
      ctx.moveTo(cxO - 4.5, cyO - 4.5);
      ctx.lineTo(cxO + 4.5, cyO + 4.5);
      ctx.moveTo(cxO + 4.5, cyO - 4.5);
      ctx.lineTo(cxO - 4.5, cyO + 4.5);
      ctx.stroke();

      obsHits.push({ id: spec.id, x: ox - ow / 2 - 8, y: oy - 6, w: ow + 16, h: oh + 12 });
    }

    // ---------- 地平线直接交互手柄（左/中升降标 + 右侧调平倾角柄） ----------
    const hHandleX = rect.x + rect.w * 0.16;
    const hHandleY = hy + Math.tan(rad) * (hHandleX - cx);
    const tHandleX = rect.x + rect.w * 0.84;
    const tHandleY = hy + Math.tan(rad) * (tHandleX - cx);

    const drawGrip = (gx, gy, kind, active, bad) => {
      const r = compact ? 11 : 12.5;
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fillStyle = active ? PALETTE.ink : bad ? PALETTE.err : PALETTE.paperLight;
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = bad ? "#FDF8F6" : PALETTE.horizonInk;
      ctx.stroke();

      // 纯矢量绘制清晰图标，不依赖字体缺字或极小符号
      ctx.strokeStyle = active || bad ? "#F5F7F2" : PALETTE.horizonInk;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      if (kind === "height") {
        ctx.moveTo(gx, gy - 5);
        ctx.lineTo(gx, gy + 5);
        ctx.moveTo(gx - 3, gy - 2.5);
        ctx.lineTo(gx, gy - 5.5);
        ctx.lineTo(gx + 3, gy - 2.5);
        ctx.moveTo(gx - 3, gy + 2.5);
        ctx.lineTo(gx, gy + 5.5);
        ctx.lineTo(gx + 3, gy + 2.5);
      } else {
        // 倾角调平图标
        ctx.moveTo(gx - 4.5, gy + 3.5);
        ctx.lineTo(gx + 4.5, gy + 3.5);
        ctx.moveTo(gx - 4.5, gy + 3.5);
        ctx.lineTo(gx + 3.5, gy - 3.5);
      }
      ctx.stroke();
    };

    drawGrip(hHandleX, hHandleY, "height", anim.hover === "horizon" || anim.dragging === "horizon", !evaluation.pillars.horizon.ok && Math.abs(state.tiltDeg) <= 1.2);
    if (rect.w >= 150) {
      drawGrip(tHandleX, tHandleY, "tilt", anim.hover === "tilt" || anim.dragging === "tilt", Math.abs(state.tiltDeg) > 1.2);
    }

    // 画心四边极细水墨界线
    ctx.restore(); // 结束画心 clip

    ctx.strokeStyle = "rgba(15, 38, 23, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);

    // ---------- 左右实木手卷卷轴头（可直接外拉展卷！） ----------
    const drawRoller = (rx, side) => {
      const active = anim.hover === `roller:${side}` || anim.dragging === `roller:${side}`;
      const rw = rect.rollerW;
      const topY = rect.y - 8;
      const rh = rect.h + 16;

      const g = ctx.createLinearGradient(rx, 0, rx + rw, 0);
      g.addColorStop(0, "#142B20");
      g.addColorStop(0.45, active ? "#2B5B44" : "#224635");
      g.addColorStop(1, "#0E2017");
      ctx.fillStyle = g;
      ctx.fillRect(rx, topY, rw, rh);

      // 上下象牙素轴头饰件
      ctx.fillStyle = PALETTE.paperLight;
      ctx.fillRect(rx + 2, topY + 2, rw - 4, 7);
      ctx.fillRect(rx + 2, topY + rh - 9, rw - 4, 7);

      // 纯矢量外拉折箭
      const midX = rx + rw / 2;
      const midY = rect.y + rect.h / 2;
      const dir = side === "left" ? -1 : 1;
      ctx.strokeStyle = active ? "#F6C8B6" : "#E8EFE4";
      ctx.lineWidth = 1.7;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(midX - dir * 2, midY - 4.5);
      ctx.lineTo(midX + dir * 2.5, midY);
      ctx.lineTo(midX - dir * 2, midY + 4.5);
      ctx.stroke();

      return { x: rx - 10, y: topY, w: rw + 20, h: rh };
    };

    const leftRoller = drawRoller(rect.x - rect.rollerW, "left");
    const rightRoller = drawRoller(rect.x + rect.w, "right");

    // 窄态时在左右卷轴外侧轻画两道极简水平延展虚箭，提示可向外拉开（不压画心）
    if (rect.aspect < 1.55 && rect.x > 64) {
      const midY = rect.y + rect.h / 2;
      ctx.strokeStyle = "rgba(29, 63, 47, 0.34)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      const arm = Math.min(46, rect.x - rect.rollerW - 18);
      if (arm > 14) {
        const lx1 = rect.x - rect.rollerW - 8;
        const lx2 = lx1 - arm;
        const rx1 = rect.x + rect.w + rect.rollerW + 8;
        const rx2 = rx1 + arm;
        ctx.beginPath();
        ctx.moveTo(lx1, midY);
        ctx.lineTo(lx2, midY);
        ctx.moveTo(rx1, midY);
        ctx.lineTo(rx2, midY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(lx2 + 5, midY - 4);
        ctx.lineTo(lx2, midY);
        ctx.lineTo(lx2 + 5, midY + 4);
        ctx.moveTo(rx2 - 5, midY - 4);
        ctx.lineTo(rx2, midY);
        ctx.lineTo(rx2 - 5, midY + 4);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    hitTargets = {
      rect,
      horizonLineY: hy,
      tiltHandle: { x: tHandleX, y: tHandleY, r: 18 },
      heightHandle: { x: hHandleX, y: hHandleY, r: 18 },
      leftRoller,
      rightRoller,
      bars: barRects,
      obstacles: obsHits,
    };
  }

  function hitTest(px, py) {
    if (!hitTargets.rect) return null;
    for (const o of hitTargets.obstacles) {
      if (px >= o.x && px <= o.x + o.w && py >= o.y && py <= o.y + o.h) return `obs:${o.id}`;
    }
    const { tiltHandle, heightHandle, leftRoller, rightRoller, bars } = hitTargets;
    if (Math.hypot(px - tiltHandle.x, py - tiltHandle.y) <= tiltHandle.r) return "tilt";
    if (Math.hypot(px - heightHandle.x, py - heightHandle.y) <= heightHandle.r) return "horizon";
    if (px >= leftRoller.x && px <= leftRoller.x + leftRoller.w && py >= leftRoller.y && py <= leftRoller.y + leftRoller.h) return "roller:left";
    if (px >= rightRoller.x && px <= rightRoller.x + rightRoller.w && py >= rightRoller.y && py <= rightRoller.y + rightRoller.h) return "roller:right";
    for (const key of ["vermilion", "sage", "pine"]) {
      const b = bars[key];
      if (b && px >= b.x - 6 && px <= b.x + b.w + 6 && py >= b.y - 8 && py <= b.y + b.h + 8) return `bar:${key}`;
    }
    // 点击地平线附近整条线亦可直接拖高低
    const r = hitTargets.rect;
    if (px >= r.x && px <= r.x + r.w && Math.abs(py - hitTargets.horizonLineY) <= 14) return "horizon";
    return null;
  }

  return {
    draw,
    hitTest,
    getRect: () => hitTargets.rect,
  };
}

// ---------- 第 01 节：双眼视域与地平线比例对照镜 ----------
export function drawVisionCanvas(canvas, mode) {
  const { ctx, w, h } = fitCanvas(canvas);
  ctx.fillStyle = PALETTE.paperLight;
  ctx.fillRect(0, 0, w, h);

  const pad = 18;
  const split = w >= 540;
  const frameX = pad;
  const frameY = pad;
  const frameW = split ? Math.round((w - pad * 3) * 0.62) : w - pad * 2;
  const frameH = split ? h - pad * 2 : Math.round(h * 0.56);

  // 左侧：画面地平线与视线扫描流线
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(frameX, frameY, frameW, frameH);
  ctx.strokeStyle = "rgba(15,38,23,0.28)";
  ctx.lineWidth = 1;
  ctx.strokeRect(frameX + 0.5, frameY + 0.5, frameW - 1, frameH - 1);

  const hy = frameY + frameH * mode.horizon;

  // 淡烟远山
  ctx.beginPath();
  ctx.moveTo(frameX, hy);
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const elev = ridgeY(u, 0, 1) * frameH * (mode.id === "low-sky" ? 0.16 : 0.20);
    ctx.lineTo(frameX + u * frameW, hy - elev);
  }
  ctx.lineTo(frameX + frameW, hy);
  ctx.closePath();
  ctx.fillStyle = "rgba(171, 183, 165, 0.52)";
  ctx.fill();

  // 落日与横带（区分死均分 vs 不对称错落）
  const sunX = frameX + frameW * (mode.asymmetric ? 0.80 : 0.50);
  const sunR = Math.max(7, Math.min(13, frameH * 0.06));
  ctx.beginPath();
  ctx.arc(sunX, hy - sunR * 1.25, sunR, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.vermilion;
  ctx.fill();

  // 地平线
  ctx.strokeStyle = PALETTE.horizonInk;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(frameX, hy);
  ctx.lineTo(frameX + frameW, hy);
  ctx.stroke();

  const bh = Math.max(8, Math.round(frameH * 0.08));
  if (!mode.asymmetric) {
    // 死板对称块，直观暴露居中对切的生硬
    ctx.fillStyle = PALETTE.pine;
    ctx.fillRect(frameX + frameW * 0.15, hy + 16, frameW * 0.70, bh);
    ctx.fillStyle = "rgba(29, 63, 47, 0.25)";
    ctx.fillRect(frameX + frameW * 0.15, frameY + frameH * 0.14, frameW * 0.70, bh);
  } else if (mode.id === "low-sky") {
    ctx.fillStyle = PALETTE.pine;
    ctx.fillRect(frameX + frameW * 0.08, hy + 8, frameW * 0.84, Math.max(6, bh * 0.7));
    // 向上仰视箭头示意转向高远
    ctx.strokeStyle = PALETTE.err;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(frameX + frameW * 0.5, hy - 8);
    ctx.lineTo(frameX + frameW * 0.5, frameY + 20);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.fillStyle = PALETTE.pine;
    ctx.fillRect(frameX + frameW * 0.07, hy + 14, frameW * 0.38, bh);
    ctx.fillStyle = PALETTE.sage;
    ctx.fillRect(frameX + frameW * 0.48, hy + 14 + bh + 10, frameW * 0.30, Math.max(5, bh * 0.45));
    ctx.fillStyle = PALETTE.vermilion;
    ctx.fillRect(frameX + frameW * 0.82, hy + 14 + bh + 6, frameW * 0.11, bh);
  }

  // 视线扫描路径虚箭
  ctx.strokeStyle = mode.id === "dead-center" || mode.id === "low-sky" ? PALETTE.err : PALETTE.ok;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  if (mode.id === "dead-center") {
    ctx.moveTo(frameX + frameW * 0.5, frameY + frameH * 0.24);
    ctx.lineTo(frameX + frameW * 0.5, frameY + frameH * 0.76);
  } else if (mode.id === "low-sky") {
    ctx.moveTo(frameX + frameW * 0.32, hy - 6);
    ctx.quadraticCurveTo(frameX + frameW * 0.5, hy - frameH * 0.42, frameX + frameW * 0.68, frameY + 24);
  } else {
    ctx.moveTo(frameX + frameW * 0.12, hy - 6);
    ctx.quadraticCurveTo(frameX + frameW * 0.48, hy - 14, frameX + frameW * 0.80, hy - 10);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // 地平线比例角标
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `500 11px "DM Mono", monospace`;
  ctx.textAlign = "left";
  ctx.fillText(`天 ${mode.skyPct}%`, frameX + 10, frameY + 18);
  ctx.fillText(`地/水 ${mode.groundPct}%`, frameX + 10, frameY + frameH - 10);

  // 右侧/下方：人眼水平 200° vs 垂直 135° 双眼视域椭圆图
  const rx = split ? frameX + frameW + pad : pad;
  const ry = split ? pad : frameY + frameH + 14;
  const rw = split ? w - rx - pad : w - pad * 2;
  const rh = split ? h - pad * 2 : h - ry - pad;

  ctx.fillStyle = "#E8EDE4";
  ctx.fillRect(rx, ry, rw, rh);
  ctx.strokeStyle = "rgba(15,38,23,0.2)";
  ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);

  const ocx = rx + rw / 2;
  const ocy = ry + rh * 0.51;
  const maxRadY = Math.max(18, (rh - 58) / 2);
  const radX = Math.min(rw * 0.40, maxRadY * (200 / 135));
  const radY = radX * (135 / 200);

  // 水平 200° × 垂直 135° 生理视域椭圆
  ctx.beginPath();
  ctx.ellipse(ocx, ocy, radX, radY, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(29, 63, 47, 0.10)";
  ctx.fill();
  ctx.strokeStyle = PALETTE.pine;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 中央双眼立体 120° 叠加区
  ctx.beginPath();
  ctx.ellipse(ocx, ocy, radX * 0.6, radY * 0.88, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(219, 104, 65, 0.16)";
  ctx.fill();
  ctx.strokeStyle = "rgba(219, 104, 65, 0.72)";
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // 水平与垂直跨度标尺
  ctx.strokeStyle = PALETTE.horizonInk;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(ocx - radX, ocy);
  ctx.lineTo(ocx + radX, ocy);
  ctx.stroke();

  ctx.fillStyle = PALETTE.ink;
  ctx.font = `500 11px "DM Mono", monospace`;
  ctx.textAlign = "center";
  ctx.fillText("水平视野 ≈ 200°（双眼重合 ≈ 120°）", ocx, ry + 18);
  ctx.fillStyle = PALETTE.inkMuted;
  ctx.fillText("垂直视野 ≈ 135° · 天然横宽大于竖高", ocx, ry + rh - 10);
}

// ---------- 第 02 节：四代典例原比例结构图解 ----------
export function drawHistoryCanvas(canvas, work) {
  const { ctx, w, h } = fitCanvas(canvas);
  ctx.fillStyle = "#C7D0C1";
  ctx.fillRect(0, 0, w, h);

  const pad = 22;
  const maxW = w - pad * 2;
  const maxH = h - pad * 2 - 22;

  // 按馆藏真实纵横比严格等比落框（绝不拉伸变形！）
  let fw = maxW;
  let fh = fw / work.ratio;
  if (fh > maxH) {
    fh = maxH;
    fw = fh * work.ratio;
  }
  const fx = Math.round((w - fw) / 2);
  const fy = Math.round((h - 22 - fh) / 2);

  // 古绢/宣纸托底
  ctx.fillStyle = work.kind === "cinema" ? "#14291F" : "#E5E8DD";
  ctx.fillRect(fx, fy, fw, fh);
  ctx.strokeStyle = work.kind === "cinema" ? "#DB6841" : PALETTE.horizonInk;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(fx + 0.5, fy + 0.5, fw - 1, fh - 1);

  const hy = fy + fh * work.horizon;

  if (work.kind === "vertical") {
    // 倪瓒《容膝斋图》：经典竖轴一河两岸（底部坡岸枯树、中间大段留白平湖、上部低缓远岫）
    ctx.beginPath();
    ctx.moveTo(fx, hy);
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      ctx.lineTo(fx + u * fw, hy - (0.04 + Math.sin(u * Math.PI) * 0.075) * fh);
    }
    ctx.lineTo(fx + fw, hy);
    ctx.closePath();
    ctx.fillStyle = "rgba(110, 126, 114, 0.45)";
    ctx.fill();

    // 大片留白平湖标注
    ctx.strokeStyle = "rgba(29, 63, 47, 0.35)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(fx + 8, hy + 2);
    ctx.lineTo(fx + fw - 8, hy + 2);
    ctx.moveTo(fx + 8, fy + fh * 0.72);
    ctx.lineTo(fx + fw - 8, fy + fh * 0.72);
    ctx.stroke();
    ctx.setLineDash([]);

    // 近坡与简亭轮廓
    ctx.fillStyle = PALETTE.pine;
    ctx.beginPath();
    ctx.moveTo(fx, fy + fh);
    ctx.lineTo(fx, fy + fh * 0.76);
    ctx.quadraticCurveTo(fx + fw * 0.52, fy + fh * 0.70, fx + fw * 0.88, fy + fh * 0.85);
    ctx.lineTo(fx + fw, fy + fh);
    ctx.closePath();
    ctx.fill();

    // 空水留白文字签
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.font = `500 11px "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    ctx.fillText("留白平湖", fx + fw / 2, fy + fh * 0.53);
  } else if (work.kind === "cinema") {
    // CinemaScope 2.35:1 宽银幕平远地平线与安全区
    const grad = ctx.createLinearGradient(0, fy, 0, fy + fh);
    grad.addColorStop(0, "#1C382A");
    grad.addColorStop(0.55, "#284B39");
    grad.addColorStop(1, "#102119");
    ctx.fillStyle = grad;
    ctx.fillRect(fx + 1, fy + 1, fw - 2, fh - 2);

    ctx.beginPath();
    ctx.moveTo(fx, hy);
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      ctx.lineTo(fx + u * fw, hy - ridgeY(u, 0, 3) * fh * 0.22);
    }
    ctx.lineTo(fx + fw, hy);
    ctx.closePath();
    ctx.fillStyle = "rgba(171, 183, 165, 0.30)";
    ctx.fill();

    ctx.strokeStyle = "#F0825B";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(fx, hy);
    ctx.lineTo(fx + fw, hy);
    ctx.stroke();

    // 标示与旧 1.37:1 学院派方框的宽度差
    const oldW = fh * 1.37;
    const oldX = fx + (fw - oldW) / 2;
    ctx.strokeStyle = "rgba(232, 238, 228, 0.50)";
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(oldX, fy + 6, oldW, fh - 12);
    ctx.setLineDash([]);
    ctx.fillStyle = "#E8EEE4";
    ctx.font = `500 11px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText("1.37:1 旧框 → 2.35:1 横展平远", fx + fw / 2, fy + fh - 12);
  } else {
    // 董源横卷 / 郭熙阔幅
    ctx.beginPath();
    ctx.moveTo(fx, hy);
    for (let i = 0; i <= 44; i++) {
      const u = i / 44;
      ctx.lineTo(fx + u * fw, hy - ridgeY(u, 1, work.id === "guoxi" ? 1 : 2) * fh * 0.28);
    }
    ctx.lineTo(fx + fw, hy);
    ctx.closePath();
    ctx.fillStyle = "rgba(148, 162, 145, 0.48)";
    ctx.fill();

    ctx.strokeStyle = PALETTE.horizonInk;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fx, hy);
    ctx.lineTo(fx + fw, hy);
    ctx.stroke();

    // 近岸坡石锚点
    ctx.fillStyle = PALETTE.pine;
    ctx.beginPath();
    ctx.moveTo(fx, fy + fh);
    ctx.lineTo(fx, hy + fh * 0.14);
    ctx.quadraticCurveTo(fx + fw * 0.24, hy + fh * 0.08, fx + fw * 0.44, fy + fh * 0.88);
    ctx.lineTo(fx + fw * 0.48, fy + fh);
    ctx.closePath();
    ctx.fill();

    // 中洲平沙
    ctx.fillStyle = "rgba(130, 146, 128, 0.72)";
    ctx.fillRect(fx + fw * 0.52, hy + fh * 0.22, fw * 0.36, Math.max(7, fh * 0.08));
  }

  // 底沿真实尺寸比例尺标注
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `500 11px "DM Mono", monospace`;
  ctx.textAlign = "center";
  ctx.fillText(`${work.ratioText} · ${work.dim}`, w / 2, h - 8);
}

// ---------- 第 03 节：2D Canvas 3D 投影立体纸雕景深剖视台 ----------
export function drawDepthDiorama(canvas, angleDeg, toneLaw) {
  const { ctx, w, h } = fitCanvas(canvas);
  ctx.fillStyle = PALETTE.darkRoom;
  ctx.fillRect(0, 0, w, h);

  const yaw = (clamp(angleDeg, 0, 52) * Math.PI) / 180;
  const pitch = (clamp(angleDeg * 0.24, 0, 14) * Math.PI) / 180;
  const compact = w < 520;

  // 简易针孔 3D 投影，将 [-1..1] × [-0.6..0.6] × [-0.8..0.8] 四层景深片真实投影到画布
  const scale = Math.min(w * 0.42, h * 0.74);
  const fov = 3.1;
  const project = (x, y, z) => {
    // 绕 Y 轴水平旋转（侧看四层间距），微绕 X 轴轻俯
    const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
    const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
    const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
    const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
    const k = fov / (fov + z2 + 1.15);
    return {
      x: w * 0.5 + x1 * scale * k,
      y: h * 0.54 + y2 * scale * k,
      k,
    };
  };

  // 底面空间纵深网格（让转角时清晰看到 Z 轴间距）
  ctx.strokeStyle = "rgba(218, 224, 213, 0.14)";
  ctx.lineWidth = 1;
  const floorY = 0.46;
  for (let gx = -1; gx <= 1.001; gx += 0.5) {
    const p1 = project(gx, floorY, -0.75);
    const p2 = project(gx, floorY, 0.75);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
  for (let gz = -0.75; gz <= 0.751; gz += 0.375) {
    const p1 = project(-1, floorY, gz);
    const p2 = project(1, floorY, gz);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // 由远至近绘制 4 层纸雕卡片（z: +0.66 最远 -> -0.58 最近）
  const zCoords = [-0.58, -0.16, 0.26, 0.66];
  const order = [3, 2, 1, 0];
  const anchors = [];

  for (const idx of order) {
    const ly = toneLaw.layers[idx];
    const z = zCoords[idx];
    const halfW = 0.90;
    const topY = -0.42;
    const botY = floorY;

    // 纸雕半透明背板
    const tl = project(-halfW, topY, z);
    const tr = project(halfW, topY, z);
    const br = project(halfW, botY, z);
    const bl = project(-halfW, botY, z);

    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();

    if (idx === 3) {
      ctx.fillStyle = "rgba(218, 224, 213, 0.92)";
      ctx.fill();
      ctx.strokeStyle = "rgba(240, 130, 91, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const sunP = project(0.56, -0.10, z);
      ctx.beginPath();
      ctx.arc(sunP.x, sunP.y, Math.max(8, 16 * sunP.k), 0, Math.PI * 2);
      ctx.fillStyle = rgbCss(ly.rgb);
      ctx.fill();
    } else {
      if (angleDeg > 4) {
        ctx.fillStyle = "rgba(218, 224, 213, 0.06)";
        ctx.fill();
        ctx.strokeStyle = "rgba(218, 224, 213, 0.28)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.beginPath();
      const steps = 28;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const x3 = -halfW + u * halfW * 2;
        let y3;
        if (idx === 0) {
          const inBar = u >= 0.05 && u <= 0.54;
          y3 = inBar ? 0.16 : 0.36;
        } else if (idx === 1) {
          y3 = 0.06 - ridgeY(u, 2, 1) * 0.24;
        } else {
          y3 = -0.02 - ridgeY(u, 0, 1) * 0.34;
        }
        const p = project(x3, y3, z);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.lineTo(br.x, br.y);
      ctx.lineTo(bl.x, bl.y);
      ctx.closePath();
      ctx.fillStyle = rgbCss(ly.rgb, idx === 0 ? 0.96 : 0.92);
      ctx.fill();
    }

    anchors[idx] = { x: (tl.x + tr.x) * 0.5, topY: (tl.y + tr.y) * 0.5, trX: tr.x, trY: tr.y };
  }

  // 侧转超过 10° 时，把四层层名均匀排在顶部留白带，用极细虚线引到对应纸雕顶边，零重叠不越界
  if (angleDeg >= 10) {
    const slotW = (w - 28) / 4;
    ctx.font = `500 ${compact ? 10 : 11}px "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    for (let idx = 0; idx < 4; idx++) {
      const ly = toneLaw.layers[idx];
      const lx = Math.round(14 + slotW * (idx + 0.5));
      const lyY = 44;
      const a = anchors[idx];
      ctx.strokeStyle = "rgba(232, 238, 228, 0.38)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(lx, lyY + 6);
      ctx.lineTo(a.x, a.topY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#F0825B";
      ctx.beginPath();
      ctx.arc(a.x, a.topY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#E8EEE4";
      ctx.fillText(`0${idx + 1} ${ly.name}`, lx, lyY);
    }
  }

  // 顶部状态标尺
  ctx.fillStyle = "#E8EEE4";
  ctx.font = `500 11px "DM Mono", monospace`;
  ctx.textAlign = "left";
  ctx.fillText(`VIEW YAW ${Math.round(angleDeg)}° · ${angleDeg < 6 ? "正面平视" : "侧视剖层"}`, 14, 22);
  ctx.textAlign = "right";
  ctx.fillStyle = toneLaw.id === "aerial" ? PALETTE.okDark : PALETTE.errDark;
  ctx.fillText(toneLaw.depthFeel, w - 14, 22);
}

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SPECIMENS } from "./model.js";

const COL = {
  paper: [240, 239, 235],
  ink: [12, 13, 8],
  green: [170, 195, 50],
  greenDeep: [93, 112, 14],
  slate: [120, 124, 108],
};

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smooth = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
const mixRgb = (a, b, t) =>
  `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;

// 经典海报 013 猫侧影路径（相对圆心、以圆半径 R 归一化）
function traceCatPath(ctx, cx, cy, R, u) {
  // u = 0.56 为原海报黄金比例；u 偏小则猫往右下退缩，u 偏大则猫扩大吃穿绿圆
  const d = u - 0.56;
  const scale = d < 0 ? 1 + d * 0.25 : 1 + d * 1.15;
  const ox = d < 0 ? -d * 1.65 * R : d * -0.45 * R;
  const oy = d < 0 ? -d * 1.42 * R : d * -0.42 * R;
  const px = (x) => cx + ox + x * R * scale;
  const py = (y) => cy + oy + y * R * scale;

  ctx.beginPath();
  ctx.moveTo(px(-0.22), py(1.18));
  ctx.lineTo(px(-0.18), py(0.84));
  // 颈部到下颌
  ctx.bezierCurveTo(px(-0.19), py(0.60), px(-0.17), py(0.45), px(-0.24), py(0.39));
  // 下巴到吻部
  ctx.bezierCurveTo(px(-0.34), py(0.36), px(-0.46), py(0.35), px(-0.50), py(0.28));
  ctx.bezierCurveTo(px(-0.53), py(0.23), px(-0.51), py(0.19), px(-0.54), py(0.15));
  // 鼻尖
  ctx.bezierCurveTo(px(-0.59), py(0.11), px(-0.58), py(0.06), px(-0.52), py(0.02));
  // 鼻梁与额头
  ctx.bezierCurveTo(px(-0.44), py(-0.04), px(-0.42), py(-0.17), px(-0.34), py(-0.28));
  ctx.bezierCurveTo(px(-0.26), py(-0.38), px(-0.16), py(-0.44), px(-0.05), py(-0.47));
  // 尖耳上升
  ctx.bezierCurveTo(px(-0.03), py(-0.58), px(-0.01), py(-0.71), px(0.02), py(-0.75));
  ctx.bezierCurveTo(px(0.05), py(-0.77), px(0.09), py(-0.72), px(0.14), py(-0.63));
  // 耳背与头后
  ctx.bezierCurveTo(px(0.22), py(-0.51), px(0.31), py(-0.41), px(0.40), py(-0.31));
  // 优雅的肩背弧线，一路敞开连出右下圆外
  ctx.bezierCurveTo(px(0.56), py(-0.13), px(0.64), py(0.12), px(0.71), py(0.34));
  ctx.bezierCurveTo(px(0.79), py(0.56), px(0.96), py(0.67), px(1.24), py(0.84));
  ctx.lineTo(px(1.24), py(1.30));
  ctx.lineTo(px(-0.22), py(1.30));
  ctx.closePath();

  return { px, py, scale };
}

// 鲁宾花瓶半边轮廓点（单侧剪影，无五官细节），y ∈ [0..1] -> 内凹/外凸 x 偏移
function traceRubinProfile(ctx, side, xEdge, xCenter, yTop, H, halfGap) {
  const s = side; // -1 左影, +1 右影
  const px = (dx) => xCenter + s * (halfGap + dx);
  const py = (t) => yTop + t * H;

  ctx.beginPath();
  ctx.moveTo(xEdge, yTop);
  ctx.lineTo(px(0.24 * H), py(0));
  // 额头
  ctx.bezierCurveTo(px(0.22 * H), py(0.08), px(0.16 * H), py(0.14), px(0.15 * H), py(0.22));
  // 眉骨到鼻梁
  ctx.bezierCurveTo(px(0.15 * H), py(0.27), px(0.19 * H), py(0.31), px(0.16 * H), py(0.35));
  // 鼻尖（向中轴探出，对应花瓶细腰上方）
  ctx.bezierCurveTo(px(0.08 * H), py(0.42), px(0.02 * H), py(0.47), px(0.03 * H), py(0.51));
  // 鼻底到上唇
  ctx.bezierCurveTo(px(0.05 * H), py(0.54), px(0.12 * H), py(0.54), px(0.10 * H), py(0.58));
  // 唇廓（纯外轮廓剪影）
  ctx.bezierCurveTo(px(0.07 * H), py(0.61), px(0.08 * H), py(0.64), px(0.12 * H), py(0.67));
  // 下巴与颌线
  ctx.bezierCurveTo(px(0.07 * H), py(0.71), px(0.06 * H), py(0.76), px(0.13 * H), py(0.79));
  // 颈部（对应花瓶底座外扩）
  ctx.bezierCurveTo(px(0.24 * H), py(0.83), px(0.27 * H), py(0.92), px(0.26 * H), py(1.0));
  ctx.lineTo(xEdge, py(1.0));
  ctx.closePath();
}

export function createHero(canvas, stageEl, state, onHandleLayout) {
  const ctx = canvas.getContext("2d");
  let w = 600;
  let h = 440;
  let dpr = 1;
  let dispU = state.u;
  let invBlend = state.inverted ? 1 : 0;
  let revBlend = state.reveal ? 1 : 0;
  let enter = reducedMotion.matches ? 1 : 0;

  function resize() {
    const r = stageEl.getBoundingClientRect();
    w = Math.max(260, Math.round(r.width));
    h = Math.max(240, Math.round(r.height));
    dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
  }

  function handleRect() {
    const padX = Math.max(44, w * 0.12);
    const x0 = padX;
    const x1 = w - padX;
    const y = h - 72;
    return { x0, x1, y };
  }

  function drawCat(u, inv, rev, ent) {
    const bg = mixRgb(COL.paper, COL.ink, inv);
    const fgInk = mixRgb(COL.ink, COL.paper, inv);
    const green = mixRgb(COL.green, [186, 212, 62], inv * 0.5);

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const drawH = Math.max(120, h - 124);
    const cx = w * 0.5;
    const cy = 28 + drawH * 0.5;
    const R = Math.min(w * 0.33, drawH * 0.46);

    // 开场入场：绿圆已在画面中，随入场柔和放大并切入猫影（0.85s 完成）
    const rNow = R * lerp(0.84, 1, smooth(ent));
    const uNow = lerp(0.18, u, smooth(ent));

    // 主体绿圆
    ctx.beginPath();
    ctx.arc(cx, cy, rNow, 0, Math.PI * 2);
    ctx.fillStyle = green;
    ctx.fill();

    // 负空间切出白猫（直接使用底色，零描边）
    const { px, py } = traceCatPath(ctx, cx, cy, rNow, uNow);
    ctx.fillStyle = bg;
    ctx.fill();

    // 极少量锚点：绿眼 + 三根胡须（只在成形区间淡入，过浅或溃散时淡出）
    const eyeAlpha = smooth((uNow - 0.32) / 0.18) * (1 - smooth((uNow - 0.80) / 0.12));
    if (eyeAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = eyeAlpha;
      // 杏仁眼
      ctx.beginPath();
      ctx.ellipse(px(-0.22), py(-0.11), rNow * 0.036, rNow * 0.056, 0.22, 0, Math.PI * 2);
      ctx.fillStyle = green;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px(-0.232), py(-0.125), rNow * 0.013, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();

      // 三根胡须
      ctx.strokeStyle = green;
      ctx.lineWidth = Math.max(1.4, rNow * 0.012);
      ctx.lineCap = "round";
      const whiskers = [
        [[-0.36, 0.14], [-0.16, 0.17], [0.02, 0.27]],
        [[-0.37, 0.20], [-0.18, 0.25], [-0.01, 0.37]],
        [[-0.38, 0.26], [-0.21, 0.32], [-0.06, 0.44]],
      ];
      for (const [p0, p1, p2] of whiskers) {
        ctx.beginPath();
        ctx.moveTo(px(p0[0]), py(p0[1]));
        ctx.quadraticCurveTo(px(p1[0]), py(p1[1]), px(p2[0]), py(p2[1]));
        ctx.stroke();
      }
      ctx.restore();
    }

    // 显形辅助：画出共享边界 + 大脑自动闭合的虚线底边
    if (rev > 0.01) {
      ctx.save();
      ctx.globalAlpha = rev;
      // 绿圆被切掉的虚线圆弧
      ctx.beginPath();
      ctx.arc(cx, cy, rNow, 0.28, 1.82);
      ctx.strokeStyle = fgInk;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([5, 5]);
      ctx.stroke();

      // 敞开底部的大脑闭合线
      ctx.beginPath();
      ctx.moveTo(px(-0.18), py(0.78));
      ctx.quadraticCurveTo(px(0.32), py(0.95), px(0.84), py(0.62));
      ctx.strokeStyle = mixRgb(COL.greenDeep, COL.green, inv);
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.font = `600 12px "Space Grotesk", "Noto Sans SC", sans-serif`;
      ctx.fillStyle = fgInk;
      ctx.textAlign = "center";
      ctx.fillText("未画轮廓，大脑自动闭合", px(0.28), Math.min(h - 96, py(0.96) + 16));
      ctx.restore();
    }
  }

  function drawVase(u, inv, rev, ent) {
    const bg = mixRgb(COL.paper, COL.ink, inv);
    const fig = mixRgb(COL.ink, COL.paper, inv);
    const accent = mixRgb(COL.green, [186, 212, 62], inv * 0.5);

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const drawH = Math.max(120, h - 124);
    const boxH = Math.min(drawH * 0.86, w * 0.62);
    const boxW = Math.min(w * 0.78, boxH * 1.26);
    const x0 = (w - boxW) * 0.5;
    const y0 = 28 + (drawH - boxH) * 0.5;
    const cx = w * 0.5;
    const uNow = lerp(0.18, u, smooth(ent));

    // u=0.04 -> 间距很宽 (0.20*boxH); u=0.52 -> 经典花瓶 (0.045*boxH); u=0.96 -> 碰撞 (-0.06*boxH)
    const halfGap = lerp(0.22, -0.055, uNow) * boxH;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, y0, boxW, boxH);
    ctx.clip();

    // 画框底色（稍微提亮/压深一格，让画框清晰成立）
    ctx.fillStyle = inv > 0.5 ? "#171912" : "#faf9f5";
    ctx.fillRect(x0, y0, boxW, boxH);

    // 左右两个纯粹侧影（无五官）
    ctx.fillStyle = fig;
    traceRubinProfile(ctx, -1, x0 - 4, cx, y0, boxH, halfGap);
    ctx.fill();
    traceRubinProfile(ctx, 1, x0 + boxW + 4, cx, y0, boxH, halfGap);
    ctx.fill();

    // 显形辅助：标出左右共享边界与中轴
    if (rev > 0.01) {
      ctx.globalAlpha = rev;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.6;
      traceRubinProfile(ctx, -1, x0 - 4, cx, y0, boxH, halfGap);
      ctx.stroke();
      traceRubinProfile(ctx, 1, x0 + boxW + 4, cx, y0, boxH, halfGap);
      ctx.stroke();

      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, y0 + 10);
      ctx.lineTo(cx, y0 + boxH - 10);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    // 外细框
    ctx.strokeStyle = mixRgb(COL.ink, COL.paper, inv);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x0, y0, boxW, boxH);

    // 在最佳点轻轻标出双向箭标
    if (Math.abs(uNow - 0.52) < 0.08 && rev > 0.01) {
      ctx.save();
      ctx.globalAlpha = rev;
      ctx.fillStyle = accent;
      ctx.font = `700 12px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("← 侧影   ｜   花瓶   ｜   侧影 →", cx, y0 + boxH + 20);
      ctx.restore();
    }
  }

  function drawArrow(u, inv, rev, ent) {
    const bg = mixRgb(COL.paper, COL.ink, inv);
    const letterE = mixRgb(COL.ink, COL.paper, inv);
    const letterX = mixRgb(COL.greenDeep, COL.green, inv > 0.5 ? 0.95 : 0.2);
    const accent = mixRgb(COL.green, [186, 212, 62], inv * 0.5);

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const drawH = Math.max(120, h - 124);
    const uNow = lerp(0.16, u, smooth(ent));
    const S = Math.min(w * 0.28, drawH * 0.54);
    const cy = 28 + drawH * 0.56;

    // u=0.62 时 gap = 0（E 右端与 x 左角严丝合缝，隐箭锁定！）
    const gap = (0.62 - uNow) * 0.72 * S;
    const xJoin = w * 0.5 - gap * 0.5;
    const xLeftOfX = w * 0.5 + gap * 0.5;

    // 几何精确的 E：中横与底横对齐 x 的顶底，共同撑出箭杆与箭尾倒钩
    const stemW = 0.28 * S;
    const barW = 0.78 * S;
    const eLeft = xJoin - barW;
    const stemR = eLeft + stemW;

    const yTop = cy - 0.64 * S;
    const yTop2 = cy - 0.44 * S;
    const yArrowTop = cy - 0.28 * S;
    const yM2 = cy - 0.11 * S;
    const yB1 = cy + 0.19 * S;
    const yArrowBot = cy + 0.36 * S;
    const yMid = (yArrowTop + yArrowBot) * 0.5; // +0.04 * S

    // 先高亮负空间箭头（若开启显形辅助且在咬合附近）
    const lockStrength = 1 - clamp(Math.abs(uNow - 0.62) / 0.18, 0, 1);
    const showArrow = Math.max(rev * 0.95, lockStrength > 0.78 ? (lockStrength - 0.78) * 1.4 : 0);
    if (showArrow > 0.02) {
      const tipX = xLeftOfX + 0.28 * S;
      ctx.save();
      ctx.globalAlpha = clamp(showArrow, 0, 0.92);
      ctx.beginPath();
      ctx.moveTo(stemR, yM2);
      ctx.lineTo(xJoin, yM2);
      ctx.lineTo(xJoin, yArrowTop);
      ctx.lineTo(tipX, yMid);
      ctx.lineTo(xJoin, yArrowBot);
      ctx.lineTo(xJoin, yB1);
      ctx.lineTo(stemR, yB1);
      ctx.closePath();
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.restore();
    }

    // 绘制大写 E
    ctx.fillStyle = letterE;
    ctx.beginPath();
    ctx.rect(eLeft, yTop, stemW, yArrowBot - yTop);
    ctx.rect(eLeft, yTop, barW * 1.04, yTop2 - yTop);
    ctx.rect(eLeft, yArrowTop, barW, yM2 - yArrowTop);
    ctx.rect(eLeft, yB1, barW, yArrowBot - yB1);
    ctx.fill();

    // 绘制小写 x（左外角精确定位在 xLeftOfX 的 yArrowTop / yArrowBot，内角尖点向右切出箭尖）
    const xW = 0.76 * S;
    const strokeX = 0.26 * S;
    const xR = xLeftOfX + xW;
    ctx.fillStyle = inv > 0.5 ? "#aac332" : "#25300a";
    // 上左到下右斜臂
    ctx.beginPath();
    ctx.moveTo(xLeftOfX, yArrowTop);
    ctx.lineTo(xLeftOfX + strokeX, yArrowTop);
    ctx.lineTo(xR, yArrowBot);
    ctx.lineTo(xR - strokeX, yArrowBot);
    ctx.closePath();
    ctx.fill();
    // 下左到上右斜臂
    ctx.beginPath();
    ctx.moveTo(xLeftOfX, yArrowBot);
    ctx.lineTo(xLeftOfX + strokeX, yArrowBot);
    ctx.lineTo(xR, yArrowTop);
    ctx.lineTo(xR - strokeX, yArrowTop);
    ctx.closePath();
    ctx.fill();

    // 若开启显形辅助，加箭头边线标注
    if (rev > 0.01) {
      const tipX = xLeftOfX + 0.28 * S;
      ctx.save();
      ctx.globalAlpha = rev;
      ctx.strokeStyle = letterE;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(stemR, yM2);
      ctx.lineTo(xJoin, yM2);
      ctx.lineTo(xJoin, yArrowTop);
      ctx.lineTo(tipX, yMid);
      ctx.lineTo(xJoin, yArrowBot);
      ctx.lineTo(xJoin, yB1);
      ctx.lineTo(stemR, yB1);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  function drawTrack(u, inv) {
    const { x0, x1, y } = handleRect();
    const spec = SPECIMENS[state.specimen];
    const sweetX = lerp(x0, x1, spec.sweet);
    const curX = lerp(x0, x1, u);

    ctx.save();
    // 轨道底线
    ctx.strokeStyle = inv > 0.5 ? "rgba(240,239,235,0.28)" : "rgba(12,13,8,0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();

    // 最佳区高亮段
    const swL = lerp(x0, x1, spec.sweet - spec.snapRadius);
    const swR = lerp(x0, x1, spec.sweet + spec.snapRadius);
    ctx.strokeStyle = "#aac332";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(swL, y);
    ctx.lineTo(swR, y);
    ctx.stroke();

    // 最佳点刻度竖线
    ctx.beginPath();
    ctx.moveTo(sweetX, y - 9);
    ctx.lineTo(sweetX, y + 9);
    ctx.strokeStyle = inv > 0.5 ? "#aac332" : "#5d700e";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 两端小圆点（呼应海报的端点圆点语言）
    ctx.fillStyle = inv > 0.5 ? "#f0efeb" : "#0c0d08";
    ctx.beginPath();
    ctx.arc(x0, y, 3, 0, Math.PI * 2);
    ctx.arc(x1, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    onHandleLayout({ x: curX, y, x0, x1 });
  }

  resize();
  new ResizeObserver(() => {
    resize();
    ctrl.draw();
  }).observe(stageEl);

  const ctrl = loop(stageEl, (_t, dt, { still }) => {
    resize();
    if (still) {
      enter = 1;
      dispU = state.u;
      invBlend = state.inverted ? 1 : 0;
      revBlend = state.reveal ? 1 : 0;
    } else {
      const k = dt > 0 ? 1 - Math.exp(-14 * dt) : 0.35;
      enter = Math.min(1, enter + (dt || 0.016) / 0.82);
      dispU += (state.u - dispU) * k;
      invBlend += ((state.inverted ? 1 : 0) - invBlend) * k;
      revBlend += ((state.reveal ? 1 : 0) - revBlend) * k;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (state.specimen === "cat") drawCat(dispU, invBlend, revBlend, enter);
    else if (state.specimen === "vase") drawVase(dispU, invBlend, revBlend, enter);
    else drawArrow(dispU, invBlend, revBlend, enter);

    drawTrack(dispU, invBlend);
  });

  return {
    draw: () => ctrl.draw(),
    track: handleRect,
    jumpToState() {
      dispU = state.u;
      ctrl.draw();
    },
  };
}

// 168 轴线系统 · 开场主舞台 2D Canvas 引擎
// 1:1 承袭 168 原海报暖米宣纸、克莱因深蓝端景水池、炭墨建筑线稿与贯通朱红主轴

import { loop, pixelRatio } from "../../lib/stage.js";
import { axisXAtY, clamp, evaluate, THEMES } from "./model.js";

const COL = {
  paper: "#F4EDE1",
  paperLight: "#FAF6EE",
  paperShade: "#EAE1D2",
  blue: "#0B3BB2",
  blueMid: "#3E62C4",
  bluePool: "#6E85CA",
  blueMist: "#D9E1F4",
  orange: "#E74709",
  orangeSoft: "rgba(231, 71, 9, 0.14)",
  ink: "#0E1014",
  inkMid: "#4E5159",
  inkLine: "#2C2E35",
  rule: "#D3CABB",
  ok: "#14664B",
  err: "#B83200",
};

export function mountHeroCanvas(canvas, getState, onMutate, onEvaluate) {
  const ctx = canvas.getContext("2d");
  let W = 760;
  let H = 520;
  let dpr = 1;
  let dirty = true;
  let intro = 0; // 0..1 开场轴线拉通进场动画
  let hoverId = null;
  let hoverHandle = false;
  let hoverTerminus = false;
  let lastEv = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    dpr = pixelRatio(2);
    W = Math.round(rect.width);
    H = Math.round(rect.height || rect.width * 0.68);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    dirty = true;
  }

  function drawCypress(x, baseY, h, w) {
    // 原海报深蓝锥形柏树 + 炭黑树干
    ctx.save();
    ctx.fillStyle = COL.ink;
    ctx.fillRect(x - w * 0.1, baseY - h * 0.24, w * 0.2, h * 0.24);
    ctx.fillStyle = COL.blue;
    ctx.beginPath();
    ctx.moveTo(x, baseY - h);
    ctx.bezierCurveTo(x + w * 0.56, baseY - h * 0.52, x + w * 0.52, baseY - h * 0.18, x, baseY - h * 0.16);
    ctx.bezierCurveTo(x - w * 0.52, baseY - h * 0.18, x - w * 0.56, baseY - h * 0.52, x, baseY - h);
    ctx.fill();
    // 微弱高光面
    ctx.fillStyle = "rgba(180,202,255,0.22)";
    ctx.beginPath();
    ctx.moveTo(x, baseY - h);
    ctx.bezierCurveTo(x - w * 0.36, baseY - h * 0.5, x - w * 0.32, baseY - h * 0.2, x, baseY - h * 0.17);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPosterVista(st, ev, prog) {
    const splitY = ev.splitY;
    const horizonY = splitY * 0.72;
    const vx = axisXAtY(st, W, H, horizonY);
    const frontAx = axisXAtY(st, W, H, splitY - 6);
    const padX = Math.max(14, W * 0.028);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, splitY);
    ctx.clip();

    // 淡宣纸天空底
    ctx.fillStyle = COL.paperLight;
    ctx.fillRect(0, 0, W, splitY);

    // 端景：巨型克莱因蓝圆球（原海报灵魂！）
    const sphereR = Math.min(W * 0.11, splitY * 0.36);
    const sphereY = horizonY - sphereR * 0.74;
    if (st.terminus) {
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.75 * prog;
      const g = ctx.createRadialGradient(
        vx - sphereR * 0.28,
        sphereY - sphereR * 0.28,
        sphereR * 0.12,
        vx,
        sphereY,
        sphereR
      );
      g.addColorStop(0, "#1D50D4");
      g.addColorStop(0.65, COL.blue);
      g.addColorStop(1, "#072680");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(vx, sphereY, sphereR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // 端景关闭：虚线蓝圆空壳（提示胶囊放在门楼上方，绝不被门楼遮挡）
      ctx.save();
      ctx.strokeStyle = hoverTerminus ? COL.orange : "rgba(184, 50, 0, 0.62)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(vx, sphereY, sphereR * 0.86, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 远景矮墙
    ctx.strokeStyle = "rgba(44,46,53,0.45)";
    ctx.lineWidth = 1;
    ctx.fillStyle = COL.paper;
    ctx.fillRect(padX + W * 0.12, horizonY - 18, W - (padX + W * 0.12) * 2, 18);
    ctx.strokeRect(padX + W * 0.12, horizonY - 18, W - (padX + W * 0.12) * 2, 18);

    // 左右建筑透视立墙（向灭点 vx 阶梯收束）
    const drawWing = (dir) => {
      const steps = 3;
      for (let i = 0; i < steps; i++) {
        const t0 = 0.34 + i * 0.22;
        const t1 = t0 + 0.15;
        const outerSpan = dir < 0 ? vx - padX : W - padX - vx;
        const xFar = vx + dir * outerSpan * t0;
        const xNear = vx + dir * outerSpan * t1;
        const hFar = splitY * (0.24 + i * 0.11);
        const hNear = splitY * (0.31 + i * 0.13);
        const yBaseFar = horizonY + (splitY - horizonY) * (t0 * 0.32);
        const yBaseNear = horizonY + (splitY - horizonY) * (t1 * 0.38);

        ctx.fillStyle = i % 2 === 0 ? "#FBF8F1" : "#EFE8DA";
        ctx.strokeStyle = "rgba(44,46,53,0.68)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xFar, yBaseFar - hFar);
        ctx.lineTo(xNear, yBaseNear - hNear);
        ctx.lineTo(xNear, yBaseNear);
        ctx.lineTo(xFar, yBaseFar);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 柱廊细竖线
        const xm = (xFar + xNear) * 0.5;
        ctx.beginPath();
        ctx.moveTo(xm, (yBaseFar - hFar + yBaseNear - hNear) * 0.5);
        ctx.lineTo(xm, (yBaseFar + yBaseNear) * 0.5);
        ctx.stroke();
      }
    };
    drawWing(-1);
    drawWing(1);

    // 左右蓝水池（单点透视梯形）
    const poolTop = horizonY + 8;
    const poolBot = splitY - 22;
    const roadTopHalf = Math.max(12, W * 0.024);
    const roadBotHalf = Math.max(46, W * 0.135);

    const drawPool = (dir) => {
      const edgeNear = dir < 0 ? padX : W - padX;
      const edgeFar = dir < 0 ? padX + (vx - padX) * 0.24 : W - padX - (W - padX - vx) * 0.24;
      const g = ctx.createLinearGradient(0, poolTop, 0, poolBot);
      g.addColorStop(0, "#97A8D9");
      g.addColorStop(0.55, "#4163C1");
      g.addColorStop(1, COL.blue);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(vx + dir * (roadTopHalf + 4), poolTop);
      ctx.lineTo(edgeFar, poolTop);
      ctx.lineTo(edgeNear, poolBot);
      ctx.lineTo(frontAx + dir * (roadBotHalf + 6), poolBot);
      ctx.closePath();
      ctx.fill();

      // 水池高光反光线
      ctx.strokeStyle = "rgba(255,255,255,0.34)";
      ctx.lineWidth = 1;
      for (let k = 1; k <= 2; k++) {
        const yy = poolTop + (poolBot - poolTop) * (k * 0.34);
        ctx.beginPath();
        ctx.moveTo(vx + dir * (roadTopHalf + 18 * k), yy);
        ctx.lineTo(vx + dir * Math.min(Math.abs(edgeNear - vx) * 0.72, roadBotHalf + 90), yy);
        ctx.stroke();
      }
    };
    drawPool(-1);
    drawPool(1);

    // 两侧柏树队列（越近越大）
    const drawTrees = (dir) => {
      const outerSpan = dir < 0 ? vx - padX : W - padX - vx;
      if (outerSpan < 70) return;
      [0.44, 0.62, 0.80].forEach((f, idx) => {
        const tx = vx + dir * outerSpan * f;
        const ty = horizonY + 12 + idx * 7;
        const th = splitY * (0.28 + idx * 0.1);
        const tw = Math.max(12, Math.min(26, outerSpan * 0.085)) * (0.72 + idx * 0.18);
        drawCypress(tx, ty, th, tw);
      });
    };
    drawTrees(-1);
    drawTrees(1);

    // 端景门楼（矩形门框 + 深蓝窄门）
    const gateW = Math.max(48, W * 0.105);
    const gateH = splitY * 0.34;
    ctx.fillStyle = COL.paperLight;
    ctx.strokeStyle = COL.inkLine;
    ctx.lineWidth = 1.2;
    ctx.fillRect(vx - gateW / 2, horizonY - gateH + 2, gateW, gateH);
    ctx.strokeRect(vx - gateW / 2, horizonY - gateH + 2, gateW, gateH);
    if (st.terminus) {
      const doorW = gateW * 0.28;
      const doorH = gateH * 0.56;
      ctx.fillStyle = COL.blue;
      ctx.fillRect(vx - doorW / 2, horizonY - doorH + 2, doorW, doorH);
      ctx.strokeStyle = COL.paperLight;
      ctx.lineWidth = 1;
      ctx.strokeRect(vx - doorW / 2 - 4, horizonY - doorH - 2, doorW + 8, doorH + 4);
    } else {
      // 在门楼正上方画带米白底衬的提示签，字绝不被遮
      const tipY = Math.max(26, horizonY - gateH - 12);
      const tipFont = Math.max(10, Math.min(12, Math.round(W * 0.016)));
      const tipTxt = W < 420 ? "缺端景 · 点亮蓝球" : "缺端景 · 点此点亮蓝球";
      ctx.save();
      ctx.font = `700 ${tipFont}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(tipTxt).width + 14;
      const bx = clamp(vx - tw / 2, 10, W - tw - 10);
      ctx.fillStyle = "rgba(250, 246, 238, 0.94)";
      ctx.strokeStyle = COL.err;
      ctx.lineWidth = 1;
      ctx.fillRect(bx, tipY - 10, tw, 20);
      ctx.strokeRect(bx, tipY - 10, tw, 20);
      ctx.fillStyle = COL.err;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tipTxt, bx + tw / 2, tipY);
      ctx.restore();
    }

    // 中央石板透视步道
    ctx.fillStyle = "#F7F1E6";
    ctx.strokeStyle = COL.inkLine;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(vx - roadTopHalf, horizonY + 2);
    ctx.lineTo(vx + roadTopHalf, horizonY + 2);
    ctx.lineTo(frontAx + roadBotHalf, splitY - 12);
    ctx.lineTo(frontAx - roadBotHalf, splitY - 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 石板横向透视分格线
    ctx.strokeStyle = "rgba(44,46,53,0.28)";
    ctx.lineWidth = 0.85;
    for (let i = 1; i <= 6; i++) {
      const u = (i / 7) ** 1.45;
      const yy = horizonY + 2 + (splitY - 14 - horizonY) * u;
      const axY = vx + (frontAx - vx) * u;
      const hw = roadTopHalf + (roadBotHalf - roadTopHalf) * u;
      ctx.beginPath();
      ctx.moveTo(axY - hw, yy);
      ctx.lineTo(axY + hw, yy);
      ctx.stroke();
    }

    // 前景起点石阶（端景开时立体呈现）
    if (st.terminus) {
      const stepW = roadBotHalf * 2.16;
      ctx.fillStyle = "#EFE6D8";
      ctx.strokeStyle = COL.inkLine;
      ctx.lineWidth = 1.1;
      ctx.fillRect(frontAx - stepW / 2, splitY - 12, stepW, 6);
      ctx.strokeRect(frontAx - stepW / 2, splitY - 12, stepW, 6);
      ctx.fillRect(frontAx - stepW * 0.54, splitY - 6, stepW * 1.08, 6);
      ctx.strokeRect(frontAx - stepW * 0.54, splitY - 6, stepW * 1.08, 6);
    }

    ctx.restore();
  }

  function drawFacadeVista(st, ev) {
    const splitY = ev.splitY;
    const baseY = splitY - 18;
    const ax = axisXAtY(st, W, H, baseY - 50);
    const span = Math.min(W * 0.62, Math.min(ax - 24, W - 24 - ax) * 1.78);
    const fw = Math.max(150, span);
    const colH = splitY * 0.44;
    const pedH = splitY * 0.2;

    ctx.save();
    ctx.fillStyle = COL.paperLight;
    ctx.fillRect(0, 0, W, splitY);

    // 基座三阶
    ctx.fillStyle = "#EAE0CF";
    ctx.strokeStyle = COL.ink;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const w = fw + i * 16;
      ctx.fillRect(ax - w / 2, baseY - 14 + i * 5, w, 5);
      ctx.strokeRect(ax - w / 2, baseY - 14 + i * 5, w, 5);
    }

    // 柱身（4 根古典柱对称分列）
    const cols = [-0.42, -0.18, 0.18, 0.42];
    cols.forEach((p) => {
      const cx = ax + fw * p;
      ctx.fillStyle = COL.paper;
      ctx.fillRect(cx - 8, baseY - 14 - colH, 16, colH);
      ctx.strokeRect(cx - 8, baseY - 14 - colH, 16, colH);
      ctx.fillStyle = COL.blue;
      ctx.fillRect(cx - 10, baseY - 14 - colH - 6, 20, 6);
    });

    // 中央深蓝主门（端景）
    if (st.terminus) {
      ctx.fillStyle = COL.blue;
      ctx.fillRect(ax - fw * 0.09, baseY - 14 - colH * 0.72, fw * 0.18, colH * 0.72);
    }

    // 檐部与三角山花
    const entY = baseY - 14 - colH - 18;
    ctx.fillStyle = "#FAF6EE";
    ctx.fillRect(ax - fw * 0.54, entY, fw * 1.08, 12);
    ctx.strokeRect(ax - fw * 0.54, entY, fw * 1.08, 12);
    if (st.terminus) {
      ctx.beginPath();
      ctx.moveTo(ax - fw * 0.56, entY);
      ctx.lineTo(ax, entY - pedH);
      ctx.lineTo(ax + fw * 0.56, entY);
      ctx.closePath();
      ctx.fillStyle = COL.paper;
      ctx.fill();
      ctx.stroke();
      // 山花内蓝徽
      ctx.fillStyle = COL.blue;
      ctx.beginPath();
      ctx.arc(ax, entY - pedH * 0.4, 9, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = COL.err;
      ctx.beginPath();
      ctx.moveTo(ax - fw * 0.52, entY);
      ctx.lineTo(ax, entY - pedH);
      ctx.lineTo(ax + fw * 0.52, entY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawPlanVista(st, ev) {
    const splitY = ev.splitY;
    const padX = Math.max(24, W * 0.06);
    const planW = W - padX * 2;
    const planH = splitY - 34;
    const py = 18;
    const ax = axisXAtY(st, W, H, py + planH * 0.5);

    ctx.save();
    ctx.fillStyle = COL.paperLight;
    ctx.fillRect(0, 0, W, splitY);

    // 建筑外墙框
    ctx.strokeStyle = COL.ink;
    ctx.lineWidth = 2.2;
    ctx.strokeRect(padX, py, planW, planH);

    // 主轴中央通道
    const hallW = Math.max(36, W * 0.085);
    ctx.fillStyle = "rgba(11, 59, 178, 0.10)";
    ctx.fillRect(ax - hallW / 2, py + 2, hallW, planH - 4);

    // 正交次轴
    const midY = py + planH * 0.5;
    if (st.subAxis === "cross") {
      ctx.strokeStyle = COL.blue;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(padX - 10, midY);
      ctx.lineTo(padX + planW + 10, midY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 左右蓝室模块
    const roomW = Math.min(72, Math.max(24, (ax - padX - hallW / 2 - 20) * 0.72));
    const roomWR = Math.min(72, Math.max(24, (padX + planW - ax - hallW / 2 - 20) * 0.72));
    [0.24, 0.76].forEach((f) => {
      const ry = py + planH * f - 18;
      if (ax - hallW / 2 - 12 - roomW > padX + 4) {
        ctx.fillStyle = COL.blue;
        ctx.fillRect(ax - hallW / 2 - 12 - roomW, ry, roomW, 36);
      }
      if (ax + hallW / 2 + 12 + roomWR < padX + planW - 4) {
        ctx.fillStyle = COL.blue;
        ctx.fillRect(ax + hallW / 2 + 12, ry, roomWR, 36);
      }
    });

    // 端景中庭圆厅
    if (st.terminus) {
      ctx.fillStyle = COL.blue;
      ctx.beginPath();
      ctx.arc(ax, py + 22, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COL.ink;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(ax - 18, py + planH - 12, 36, 12);
    }
    ctx.restore();
  }

  function drawEditorialVista(st, ev) {
    const splitY = ev.splitY;
    const padX = Math.max(24, W * 0.06);
    const pageW = W - padX * 2;
    const pageH = splitY - 26;
    const py = 14;
    const ax = axisXAtY(st, W, H, py + pageH * 0.5);

    ctx.save();
    ctx.fillStyle = COL.paperLight;
    ctx.fillRect(0, 0, W, splitY);

    // 跨页画册外框
    ctx.fillStyle = "#FCF9F3";
    ctx.strokeStyle = COL.ink;
    ctx.lineWidth = 1.4;
    ctx.fillRect(padX, py, pageW, pageH);
    ctx.strokeRect(padX, py, pageW, pageH);

    // 左侧小引题（右对齐贴轴）
    ctx.fillStyle = COL.inkMid;
    ctx.font = `600 ${Math.max(10, Math.round(W * 0.015))}px "Outfit", sans-serif`;
    ctx.textAlign = "right";
    if (ax - padX > 85) {
      ctx.fillText("ISSUE 04 · ZURICH", ax - st.gutter - 4, py + pageH * 0.34);
      ctx.fillStyle = COL.ink;
      ctx.font = `700 ${Math.max(13, Math.round(W * 0.022))}px "Noto Sans SC", sans-serif`;
      ctx.fillText("秩序与脊柱", ax - st.gutter - 4, py + pageH * 0.56);
    }

    // 右侧主标与蓝圆视觉焦点（左对齐贴轴）
    if (padX + pageW - ax > 100) {
      ctx.fillStyle = COL.ink;
      ctx.textAlign = "left";
      ctx.font = `900 ${Math.max(18, Math.round(W * 0.032))}px "Noto Sans SC", sans-serif`;
      ctx.fillText("现代排印轴线年展", ax + st.gutter + 4, py + pageH * 0.44);
      ctx.fillStyle = COL.inkMid;
      ctx.font = `400 ${Math.max(10, Math.round(W * 0.015))}px "Noto Sans SC", sans-serif`;
      ctx.fillText("左翼右齐 · 右翼左齐 · 共享隐性中缝", ax + st.gutter + 4, py + pageH * 0.68);
    }

    // 蓝圆主视点（随端景开关）
    if (st.terminus) {
      ctx.fillStyle = COL.blue;
      ctx.beginPath();
      ctx.arc(ax, py + pageH * 0.22, Math.min(18, pageH * 0.14), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(ax - 22, py + pageH - 12, 44, 5);
    }
    ctx.restore();
  }

  function drawLowerBlocks(st, ev) {
    const splitY = ev.splitY;
    const padX = Math.max(14, W * 0.028);

    // 淡宣纸下半背景 + 原海报同款横分隔线
    ctx.fillStyle = COL.paper;
    ctx.fillRect(0, splitY, W, H - splitY);

    ctx.strokeStyle = COL.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, splitY);
    ctx.lineTo(W - padX, splitY);
    ctx.stroke();

    // 6 条独立挂轴行虚线（每块独占一条行轨，绝不重叠）
    const lowerTop = ev.splitY + H * 0.042;
    const lowerBot = H - H * 0.108;
    const rowCount = ev.rects.length;
    for (let r = 0; r < rowCount; r++) {
      const yRow = lowerTop + ((r + 0.5) / rowCount) * (lowerBot - lowerTop);
      ctx.strokeStyle = "rgba(180, 171, 155, 0.45)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padX, yRow);
      ctx.lineTo(W - padX, yRow);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 若开启正交次轴，画一条清晰蓝虚横轴
    if (st.subAxis === "cross") {
      const crossY = (lowerTop + lowerBot) * 0.5;
      ctx.save();
      ctx.strokeStyle = COL.blue;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([7, 4]);
      ctx.beginPath();
      ctx.moveTo(padX, crossY);
      ctx.lineTo(W - padX, crossY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COL.blue;
      ctx.font = `600 10px "Outfit", sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText("SECONDARY AXIS · 次轴", W - padX, crossY - 6);
      ctx.restore();
    }

    // 先在模块下方绘出贯通主轴底线与中轴圆点，避免压线模块文字被红点遮住
    drawAxesUnder(st, ev);

    // 绘制 6 个挂轴交互模块
    const fontSz = Math.max(10.5, Math.min(12.5, Math.round(W * 0.017)));
    const subSz = Math.max(9, Math.min(10, Math.round(W * 0.0125)));

    ev.rects.forEach((b) => {
      const isErr = b.across || b.detachErr > 8 || b.clipped;
      const isSel = st.selectedId === b.id || hoverId === b.id;

      // 脱轴误差虚线与像素标注
      if (st.showGuides && !b.across && b.detachErr > 8) {
        const edgeX = b.side === "L" ? b.x + b.w : b.x;
        const targetX = b.side === "L" ? b.ax - st.gutter : b.ax + st.gutter;
        ctx.save();
        ctx.strokeStyle = COL.err;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(targetX, b.cy);
        ctx.lineTo(edgeX, b.cy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = COL.err;
        ctx.font = `600 9.5px "JetBrains Mono", monospace`;
        ctx.textAlign = "center";
        ctx.fillText(`+${b.detachErr}px`, (targetX + edgeX) / 2, b.cy - 4);
        ctx.restore();
      }

      // 块体填充（遵循原海报深蓝 / 纯黑 / 线框白纸三种材质，0px 锐利直角）
      ctx.save();
      if (b.kind === "blue") {
        ctx.fillStyle = COL.blue;
        ctx.fillRect(b.x, b.y, b.w, b.h);
      } else if (b.kind === "ink") {
        ctx.fillStyle = COL.ink;
        ctx.fillRect(b.x, b.y, b.w, b.h);
      } else {
        ctx.fillStyle = COL.paperLight;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = COL.ink;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
      }

      // 紧贴主轴一侧的咬合边亮杠（视觉教学核心：左翼右齐、右翼左齐）
      const alignEdgeX = b.side === "L" ? b.x + b.w : b.x;
      if (!b.across) {
        ctx.fillStyle = isErr ? COL.orange : b.kind === "blue" ? "#8BB3FF" : COL.blue;
        ctx.fillRect(b.side === "L" ? alignEdgeX - 3 : alignEdgeX, b.y, 3, b.h);
      }

      // 错误或选中外框
      if (b.across || b.clipped) {
        ctx.strokeStyle = COL.orange;
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
      } else if (isSel) {
        ctx.strokeStyle = COL.orange;
        ctx.lineWidth = 1.8;
        ctx.strokeRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
      }

      // 文字严格按挂轴方向对齐：左翼右对齐、右翼左对齐！
      const textCol = b.kind === "outline" ? COL.ink : "#FAF6EE";
      const subCol = b.kind === "outline" ? COL.inkMid : "rgba(250,246,238,0.8)";
      const tx = b.across ? b.cx : b.side === "L" ? b.x + b.w - 8 : b.x + 8;
      ctx.textAlign = b.across ? "center" : b.side === "L" ? "right" : "left";
      ctx.textBaseline = "middle";
      const twoLine = b.h >= 27;
      const drawFont = b.across && !twoLine ? Math.max(9.5, fontSz - 1) : fontSz;
      ctx.fillStyle = textCol;
      ctx.font = `700 ${drawFont}px "Noto Sans SC", sans-serif`;
      ctx.fillText(b.across && !twoLine ? `${b.label}·压` : b.label, tx, twoLine ? b.cy - 5 : b.cy);
      if (twoLine) {
        ctx.fillStyle = b.across ? COL.err : subCol;
        ctx.font = `600 ${subSz}px "Outfit", "Noto Sans SC", sans-serif`;
        ctx.fillText(b.across ? "压轴 · 点此归边" : b.sub, tx, b.cy + 7.5);
      }
      ctx.restore();
    });

    // 底部力矩天平微尺条
    const barY = H - H * 0.056;
    const barW = Math.min(260, W * 0.44);
    const bx0 = W / 2 - barW / 2;
    ctx.save();
    ctx.strokeStyle = COL.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, H - H * 0.102);
    ctx.lineTo(W - padX, H - H * 0.102);
    ctx.stroke();

    // 天平底轨
    ctx.fillStyle = "#E4DBC9";
    ctx.fillRect(bx0, barY - 3, barW, 6);
    // 安全均衡区间 [-34%, +34%]
    ctx.fillStyle = "rgba(20, 102, 75, 0.22)";
    ctx.fillRect(W / 2 - barW * 0.17, barY - 3, barW * 0.34, 6);
    // 中线
    ctx.fillStyle = COL.inkMid;
    ctx.fillRect(W / 2 - 0.5, barY - 7, 1, 14);
    // 实测力矩指针
    const px = W / 2 + clamp(ev.metrics.momentBias, -1, 1) * (barW * 0.48);
    ctx.fillStyle = ev.pillars.balance.ok ? COL.ok : COL.orange;
    ctx.beginPath();
    ctx.arc(px, barY, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COL.inkMid;
    ctx.font = `500 10px "JetBrains Mono", monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.fillText(`左翼 ${ev.metrics.leftCount}`, bx0 - 8, barY);
    ctx.textAlign = "left";
    ctx.fillText(`右翼 ${ev.metrics.rightCount} · ${ev.metrics.skewDir}${ev.metrics.skewPct}%`, bx0 + barW + 8, barY);
    ctx.restore();
  }

  // 先画在模块底下的主轴中缝和朱红贯通线（避免遮挡压线模块文字）
  function drawAxesUnder(st, ev) {
    if (!st.showGuides) return;
    const splitX = axisXAtY(st, W, H, ev.splitY);
    const botX = axisXAtY(st, W, H, H - H * 0.102);
    ctx.save();
    ctx.fillStyle = "rgba(231, 71, 9, 0.065)";
    ctx.beginPath();
    ctx.moveTo(splitX - st.gutter, ev.splitY);
    ctx.lineTo(splitX + st.gutter, ev.splitY);
    ctx.lineTo(botX + st.gutter, H - H * 0.102);
    ctx.lineTo(botX - st.gutter, H - H * 0.102);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COL.orange;
    ctx.lineWidth = hoverHandle ? 2.5 : 1.8;
    ctx.beginPath();
    ctx.moveTo(splitX, ev.splitY);
    ctx.lineTo(botX, H - H * 0.102);
    ctx.stroke();
    // 6 行交点小圆点（跳过压线行以免遮字）
    ev.rects.forEach((b) => {
      if (b.across) return;
      ctx.fillStyle = COL.paper;
      ctx.beginPath();
      ctx.arc(b.ax, b.cy, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COL.orange;
      ctx.beginPath();
      ctx.arc(b.ax, b.cy, 3.6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawAxes(st, ev, prog) {
    const topX = axisXAtY(st, W, H, 12);
    const splitX = axisXAtY(st, W, H, ev.splitY);
    const botX = axisXAtY(st, W, H, H - H * 0.102);

    // 平行伪主轴（争权错态：标签挂在中段上方干净天际，绝不与右上角标撞车）
    if (st.subAxis === "conflict") {
      const fakeShift = st.axisX < 0.5 ? W * 0.34 : -W * 0.34;
      const fx1 = clamp(topX + fakeShift, 34, W - 34);
      const fx2 = clamp(botX + fakeShift, 34, W - 34);
      const fmidX = (fx1 + fx2) * 0.5;
      const tagY = Math.max(32, ev.splitY * 0.24);
      ctx.save();
      ctx.strokeStyle = "rgba(184, 50, 0, 0.72)";
      ctx.lineWidth = 2.0;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.moveTo(fx1, 24);
      ctx.lineTo(fx2, H - H * 0.102);
      ctx.stroke();
      ctx.setLineDash([]);
      const fTxt = W < 420 ? "× 伪主轴争权" : "× 平行伪主轴争权";
      ctx.font = `700 10px "Noto Sans SC", sans-serif`;
      const ftw = ctx.measureText(fTxt).width + 10;
      const fbx = clamp(fmidX - ftw / 2, 8, W - ftw - 8);
      ctx.fillStyle = "rgba(250, 246, 238, 0.94)";
      ctx.strokeStyle = COL.err;
      ctx.lineWidth = 1;
      ctx.fillRect(fbx, tagY - 9, ftw, 18);
      ctx.strokeRect(fbx, tagY - 9, ftw, 18);
      ctx.fillStyle = COL.err;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(fTxt, fbx + ftw / 2, tagY);
      ctx.restore();
    }

    if (!st.showGuides) {
      ctx.save();
      ctx.fillStyle = "rgba(231,71,9,0.28)";
      ctx.beginPath();
      ctx.moveTo(topX, 15);
      ctx.lineTo(topX - 6, 5);
      ctx.lineTo(topX + 6, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return;
    }

    const curSplitY = 12 + (ev.splitY - 12) * Math.min(1, prog * 1.4);
    const curSplitX = axisXAtY(st, W, H, curSplitY);

    ctx.save();
    // 上半域朱红贯通线
    ctx.strokeStyle = COL.orange;
    ctx.lineWidth = hoverHandle ? 2.5 : 1.8;
    ctx.beginPath();
    ctx.moveTo(topX, 12);
    ctx.lineTo(curSplitX, curSplitY);
    ctx.stroke();

    // 顶部倒三角指针（原海报标志）
    ctx.fillStyle = COL.orange;
    ctx.beginPath();
    ctx.moveTo(topX, 20);
    ctx.lineTo(topX - 7, 7);
    ctx.lineTo(topX + 7, 7);
    ctx.closePath();
    ctx.fill();

    // 底部倒三角收尾
    if (prog > 0.85) {
      ctx.beginPath();
      ctx.moveTo(botX, H - H * 0.102 + 7);
      ctx.lineTo(botX - 5, H - H * 0.102 - 2);
      ctx.lineTo(botX + 5, H - H * 0.102 - 2);
      ctx.closePath();
      ctx.fill();
    }

    // 中部可抓拖游标胶囊
    ctx.fillStyle = hoverHandle ? COL.ink : COL.orange;
    ctx.fillRect(splitX - 24, ev.splitY - 10, 48, 20);
    ctx.fillStyle = "#FAF6EE";
    ctx.font = `600 10px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`◄ ${ev.metrics.axisPosPct}% ►`, splitX, ev.splitY);
    ctx.restore();
  }

  function render(prog) {
    const st = getState();
    const ev = evaluate(st, W, H);
    lastEv = ev;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    if (st.theme === "facade") drawFacadeVista(st, ev);
    else if (st.theme === "plan") drawPlanVista(st, ev);
    else if (st.theme === "editorial") drawEditorialVista(st, ev);
    else drawPosterVista(st, ev, prog);

    drawLowerBlocks(st, ev);
    drawAxes(st, ev, prog);

    // 顶部右上角极简角标（右对齐，绝不和偏左主轴撞车）
    ctx.fillStyle = ev.score === 4 ? COL.ok : COL.err;
    ctx.font = `600 10px "JetBrains Mono", monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(
      `AXIS ${ev.metrics.axisPosPct}% · ${st.tiltDeg >= 0 ? "+" : ""}${st.tiltDeg}° · ${ev.score}/4`,
      W - 12,
      8
    );

    ctx.restore();
    if (onEvaluate) onEvaluate(ev);
  }

  // 指针交互：左右横拖平移主轴；点击模块在 左齐/右齐/脱轴 间切换；点击顶部端景虚圆点亮端景
  let dragging = false;
  let dragMode = null; // "axis" | "block" | null
  let dragStartX = 0;
  let dragStartY = 0;
  let dragMoved = false;
  let startAxisX = 0.5;
  let pointerId = null;

  function toLocal(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function hitBlock(pt) {
    if (!lastEv) return null;
    for (let i = lastEv.rects.length - 1; i >= 0; i--) {
      const b = lastEv.rects[i];
      if (pt.x >= b.x - 4 && pt.x <= b.x + b.w + 4 && pt.y >= b.y - 4 && pt.y <= b.y + b.h + 4) return b;
    }
    return null;
  }

  function hitTerminus(pt) {
    if (!lastEv) return false;
    const st = getState();
    const horizonY = lastEv.splitY * 0.72;
    const vx = axisXAtY(st, W, H, horizonY);
    const sphereR = Math.min(W * 0.11, lastEv.splitY * 0.36);
    const sphereY = horizonY - sphereR * 0.74;
    return Math.hypot(pt.x - vx, pt.y - sphereY) <= sphereR * 1.15;
  }

  function onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const pt = toLocal(e);
    dragging = true;
    dragMoved = false;
    dragStartX = pt.x;
    dragStartY = pt.y;
    startAxisX = getState().axisX;
    dragMode = "axis";
    pointerId = e.pointerId;
    if (canvas.setPointerCapture && e.pointerId !== undefined) {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  }

  function onMove(e) {
    const pt = toLocal(e);
    if (!dragging) {
      const blk = hitBlock(pt);
      const axHere = axisXAtY(getState(), W, H, pt.y);
      const nearAxis = Math.abs(pt.x - axHere) < 26;
      const nearTerm = hitTerminus(pt);
      const changed = hoverId !== (blk?.id || null) || hoverHandle !== nearAxis || hoverTerminus !== nearTerm;
      hoverId = blk?.id || null;
      hoverHandle = nearAxis;
      hoverTerminus = nearTerm;
      canvas.style.cursor = nearAxis ? "ew-resize" : blk || nearTerm ? "pointer" : "grab";
      if (changed) {
        dirty = true;
        ctl.draw();
      }
      return;
    }

    const dx = pt.x - dragStartX;
    const dy = pt.y - dragStartY;
    if (!dragMoved && Math.hypot(dx, dy) > 4) {
      // 触屏竖向滑动时放行给浏览器滚动
      if (e.pointerType === "touch" && Math.abs(dy) > Math.abs(dx) * 1.25) {
        dragging = false;
        return;
      }
      dragMoved = true;
    }

    if (dragMoved && dragMode === "axis") {
      let next = clamp(startAxisX + dx / W, 0.16, 0.84);
      // 轻吸附 50% 经典中轴与 38% 黄金偏心轴
      if (Math.abs(next - 0.5) < 0.014) next = 0.5;
      else if (Math.abs(next - 0.38) < 0.012) next = 0.38;
      onMutate((st) => {
        st.axisX = +next.toFixed(3);
      });
    }
  }

  function onUp(e) {
    if (!dragging) return;
    const pt = toLocal(e);
    dragging = false;
    if (canvas.releasePointerCapture && pointerId !== null) {
      try { canvas.releasePointerCapture(pointerId); } catch {}
    }
    pointerId = null;

    if (!dragMoved) {
      const blk = hitBlock(pt);
      if (blk) {
        onMutate((st) => {
          const item = st.items.find((x) => x.id === blk.id);
          if (!item) return;
          st.selectedId = blk.id;
          // 智能单步循环：若压轴或脱轴 → 先立刻紧咬归位；若已贴紧 → 翻转到轴线另一侧平衡力矩！
          if (item.across || item.detachPx > 0) {
            item.across = false;
            item.detachPx = 0;
          } else {
            item.side = item.side === "L" ? "R" : "L";
          }
        });
        return;
      }
      if (hitTerminus(pt)) {
        onMutate((st) => {
          st.terminus = !st.terminus;
        });
      }
    }
  }

  // 同时兼容 Pointer Events 与 Touch Events（确保 perf.mjs 的 CDP touchMove 丝滑触发重绘）
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  // CDP dispatchTouchEvent 兜底监听（某些 headless touch 事件不合成 pointermove）
  let touchDragging = false;
  let touchStartX = 0;
  let touchStartAxis = 0.5;
  canvas.addEventListener("touchstart", (e) => {
    if (dragging || !e.touches.length) return;
    touchDragging = true;
    touchStartX = e.touches[0].clientX;
    touchStartAxis = getState().axisX;
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!touchDragging || dragging || !e.touches.length) return;
    const dx = e.touches[0].clientX - touchStartX;
    if (Math.abs(dx) > 2) {
      const next = clamp(touchStartAxis + dx / Math.max(240, W), 0.16, 0.84);
      onMutate((st) => { st.axisX = +next.toFixed(3); });
    }
  }, { passive: true });
  canvas.addEventListener("touchend", () => { touchDragging = false; }, { passive: true });

  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(canvas);
  resize();

  const ctl = loop(canvas, (_t, dt, { still }) => {
    if (still) {
      intro = 1;
      render(1);
      dirty = false;
      return;
    }
    if (intro < 1) {
      intro = Math.min(1, intro + (dt ? dt * 1.45 : 0.04));
      dirty = true;
    }
    if (dirty) {
      dirty = false;
      render(1 - (1 - intro) ** 3);
    }
  });

  return {
    markDirty() {
      dirty = true;
      ctl.draw();
    },
    getEval: () => lastEv,
  };
}

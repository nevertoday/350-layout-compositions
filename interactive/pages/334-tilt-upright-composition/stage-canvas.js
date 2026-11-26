// 334 欲正关系构图——开场主舞台 2D 刚体力学画布
// 1:1 承袭原海报朱橘展面、暖宣正柱、垂直黑方虚轴、纯黑斜碑、黑球支点、白斜长箭与右上角度弧尺。
// 等比坐标系渲染：任何屏幕比例下黑球永远严格正圆、角度严格真实；支持鼠标/触屏横拖与点击正柱交互。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { WORLD, LIMITS, clamp, evaluate } from "./model.js";

const PAL = {
  orange: "#FA4E06",
  cream: "#F4E7D5",
  creamDeep: "#E6D5BE",
  ink: "#131313",
  inkSoft: "#2A2420",
  ball: "#0D0C06",
  white: "#FFF8F9",
  axisGray: "#5A524B",
  okMint: "#6CF0B8",
  warnWhite: "#FFF8F9",
  pineDark: "#141816",
  pineMid: "#2A332D",
  towerGlass: "#23272B",
  towerLine: "#8F99A3",
};

export function mountHeroStage(canvas, getState, onChange, onAnnounce) {
  const ctx = canvas.getContext("2d");
  let cw = 640;
  let ch = 460;
  let dpr = pixelRatio(2);

  // 开场缓动与视线光束演播状态
  let introT = reducedMotion.matches ? 1 : 0;
  let scanPhase = -1; // >= 0 时沿白斜箭与正柱轴演播一次视线流
  let dirty = true;
  let hoverPart = null; // 'tilted' | 'ball' | 'upright' | null

  // 坐标映射：等比映射 WORLD (1.0 x 0.72) 到画布，保留干净边距
  function getTransform() {
    const padX = Math.max(14, cw * 0.03);
    const padTop = Math.max(16, ch * 0.04);
    const padBot = Math.max(14, ch * 0.04);
    const availW = cw - padX * 2;
    const availH = ch - padTop - padBot;
    const scale = Math.min(availW / WORLD.w, availH / WORLD.h);
    const ox = (cw - WORLD.w * scale) * 0.5;
    const oy = padTop + (availH - WORLD.h * scale) * 0.52;
    return { scale, ox, oy };
  }

  function toPx(pt, tr) {
    return { x: tr.ox + pt.x * tr.scale, y: tr.oy + pt.y * tr.scale };
  }

  function toWorld(px, py, tr) {
    return { x: (px - tr.ox) / tr.scale, y: (py - tr.oy) / tr.scale };
  }

  function pointInQuad(p, quad) {
    let sign = 0;
    for (let i = 0; i < 4; i++) {
      const a = quad[i];
      const b = quad[(i + 1) % 4];
      const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
      if (Math.abs(cross) > 1e-6) {
        const s = cross > 0 ? 1 : -1;
        if (sign === 0) sign = s;
        else if (sign !== s) return false;
      }
    }
    return true;
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = pixelRatio(2);
    cw = r.width;
    ch = r.height;
    const targetW = Math.round(cw * dpr);
    const targetH = Math.round(ch * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    dirty = true;
  }

  function traceQuad(quad, tr) {
    ctx.beginPath();
    const p0 = toPx(quad[0], tr);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < 4; i++) {
      const pi = toPx(quad[i], tr);
      ctx.lineTo(pi.x, pi.y);
    }
    ctx.closePath();
  }

  function drawSceneDetailsUpright(scene, g, tr) {
    const quad = g.uprightQuad;
    ctx.save();
    traceQuad(quad, tr);
    ctx.clip();

    const tl = toPx(quad[0], tr);
    const trp = toPx(quad[1], tr);
    const bl = toPx(quad[3], tr);
    const uPxW = Math.hypot(trp.x - tl.x, trp.y - tl.y);
    const uPxH = Math.hypot(bl.x - tl.x, bl.y - tl.y);
    const basePx = toPx({ x: (quad[2].x + quad[3].x) / 2, y: (quad[2].y + quad[3].y) / 2 }, tr);
    const rad = (g.uprightTiltDeg * Math.PI) / 180;

    ctx.translate(basePx.x, basePx.y);
    ctx.rotate(rad);

    if (scene === "pine") {
      // 悬崖峭壁与垂瀑纹理：米宣纸色岩壁 + 极简淡墨折皴 + 笔直细白飞瀑
      ctx.fillStyle = "#EAE0CF";
      ctx.fillRect(-uPxW * 0.5, -uPxH, uPxW, uPxH);
      ctx.fillStyle = "#DFD2BC";
      ctx.beginPath();
      ctx.moveTo(-uPxW * 0.5, -uPxH * 0.85);
      ctx.lineTo(-uPxW * 0.14, -uPxH * 0.62);
      ctx.lineTo(-uPxW * 0.22, -uPxH * 0.18);
      ctx.lineTo(-uPxW * 0.5, 0);
      ctx.closePath();
      ctx.fill();
      // 垂直白瀑（强化正向轴）
      ctx.fillStyle = PAL.white;
      ctx.fillRect(-uPxW * 0.055, -uPxH * 0.92, uPxW * 0.11, uPxH * 0.92);
      ctx.strokeStyle = "rgba(19,19,19,0.22)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-uPxW * 0.04 + i * uPxW * 0.024, -uPxH * 0.86);
        ctx.lineTo(-uPxW * 0.04 + i * uPxW * 0.024, -uPxH * 0.08);
        ctx.stroke();
      }
    } else if (scene === "editorial") {
      // 杂志端正主栏网格线 + 模拟版心细行
      ctx.strokeStyle = "rgba(19,19,19,0.14)";
      ctx.lineWidth = 1;
      const pad = uPxW * 0.12;
      ctx.strokeRect(-uPxW * 0.5 + pad, -uPxH + pad, uPxW - pad * 2, uPxH - pad * 2);
      // 刊眉短黑条与正文灰色横排条（纯几何排印表达，不挤小字）
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(-uPxW * 0.5 + pad * 1.5, -uPxH + pad * 1.6, uPxW * 0.42, Math.max(5, uPxH * 0.024));
      ctx.fillStyle = "rgba(19,19,19,0.24)";
      for (let row = 0; row < 9; row++) {
        const y = -uPxH + pad * 3.1 + row * (uPxH * 0.068);
        const wFactor = row === 4 || row === 8 ? 0.52 : 0.72;
        ctx.fillRect(-uPxW * 0.5 + pad * 1.5, y, (uPxW - pad * 3) * wFactor, Math.max(2.5, uPxH * 0.011));
      }
    } else if (scene === "tower") {
      // 建筑垂直混凝土主塔楼：规则正交窗格
      ctx.fillStyle = "#EFE4D3";
      ctx.fillRect(-uPxW * 0.5, -uPxH, uPxW, uPxH);
      const cols = 4;
      const rows = 9;
      const mx = uPxW * 0.1;
      const my = uPxH * 0.08;
      const cellW = (uPxW - mx * 2) / cols;
      const cellH = (uPxH - my * 1.6) / rows;
      ctx.fillStyle = "rgba(19,19,19,0.16)";
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillRect(-uPxW * 0.5 + mx + c * cellW + 2, -uPxH + my + r * cellH + 2, Math.max(2, cellW - 5), Math.max(2, cellH - 6));
        }
      }
    }
    ctx.restore();
  }

  function drawSceneDetailsTilted(scene, g, tr) {
    const quad = g.tiltedQuad;
    ctx.save();
    traceQuad(quad, tr);
    ctx.clip();

    const tl = toPx(quad[0], tr);
    const trp = toPx(quad[1], tr);
    const bl = toPx(quad[3], tr);
    const tPxW = Math.hypot(trp.x - tl.x, trp.y - tl.y);
    const tPxH = Math.hypot(bl.x - tl.x, bl.y - tl.y);
    const center = toPx(g.tiltedCenter, tr);
    const rad = (g.tiltDeg * Math.PI) / 180;

    ctx.translate(center.x, center.y);
    ctx.rotate(rad);

    if (scene === "pine") {
      // 苍黑松影层次：深墨松针几何冠块
      ctx.fillStyle = "#1E2421";
      ctx.beginPath();
      ctx.arc(-tPxW * 0.12, -tPxH * 0.25, tPxW * 0.42, 0, Math.PI * 2);
      ctx.arc(tPxW * 0.18, -tPxH * 0.08, tPxW * 0.36, 0, Math.PI * 2);
      ctx.arc(-tPxW * 0.06, tPxH * 0.12, tPxW * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(244,231,213,0.22)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-tPxW * 0.28, tPxH * 0.46);
      ctx.quadraticCurveTo(0, 0, tPxW * 0.15, -tPxH * 0.42);
      ctx.stroke();
    } else if (scene === "editorial") {
      // 现代黑版海报粗几何字块暗示
      ctx.fillStyle = "rgba(244,231,213,0.9)";
      ctx.fillRect(-tPxW * 0.36, -tPxH * 0.36, tPxW * 0.72, tPxH * 0.09);
      ctx.fillStyle = PAL.orange;
      ctx.fillRect(-tPxW * 0.36, -tPxH * 0.22, tPxW * 0.46, tPxH * 0.045);
      ctx.fillStyle = "rgba(255,248,249,0.28)";
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(-tPxW * 0.36, tPxH * (0.02 + i * 0.07), tPxW * (0.68 - i * 0.08), tPxH * 0.025);
      }
    } else if (scene === "tower") {
      // 斜倾玻璃钢构塔翼斜肋
      ctx.strokeStyle = "rgba(244,231,213,0.22)";
      ctx.lineWidth = 1.25;
      for (let r = -4; r <= 4; r++) {
        const y = r * (tPxH * 0.105);
        ctx.beginPath();
        ctx.moveTo(-tPxW * 0.48, y);
        ctx.lineTo(tPxW * 0.48, y);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(250,78,6,0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-tPxW * 0.44, tPxH * 0.44);
      ctx.lineTo(tPxW * 0.44, -tPxH * 0.44);
      ctx.stroke();
    }
    ctx.restore();
  }

  function renderFrame(t, dt, { still }) {
    if (still) {
      introT = 1;
    } else if (introT < 1) {
      introT = Math.min(1, introT + dt * 2.1);
      dirty = true;
    }

    if (scanPhase >= 0) {
      scanPhase += still ? 1 : dt * 0.85;
      dirty = true;
      if (scanPhase > 1.15) scanPhase = -1;
    }

    // 倾覆微晃动效（仅在失稳且非 reduced-motion 时给极克制的物理震颤提示）
    const state = getState();
    const ev = evaluate(state);
    const g = ev.geometry;
    const isToppling = ev.code === "over_topple" && !still;

    if (!dirty && !isToppling && introT >= 1 && scanPhase < 0) return;
    dirty = false;

    const ease = 1 - Math.pow(1 - introT, 3);
    ctx.save();
    ctx.scale(dpr, dpr);

    // 1) 炽烈朱橘展面（与 Hero 背景完全无缝融为一体，无多余灰底盒）
    ctx.fillStyle = PAL.orange;
    ctx.fillRect(0, 0, cw, ch);

    const tr = getTransform();
    const scale = tr.scale;
    const fontScale = clamp(scale / 540, 0.72, 1.15);

    // 若过斜倾覆，加轻微角晃
    const wobbleDeg = isToppling ? Math.sin(t * 7.5) * 0.9 : 0;
    const wobbleRad = (wobbleDeg * Math.PI) / 180;

    // 2) 底部贯穿纯黑地平基线（复刻原海报底基黑线）
    const baseL = toPx({ x: 0.04, y: g.baseLineY }, tr);
    const baseR = toPx({ x: 0.96, y: g.baseLineY }, tr);
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = Math.max(1.5, scale * 0.003);
    ctx.beginPath();
    ctx.moveTo(baseL.x, baseL.y);
    ctx.lineTo(baseR.x, baseR.y);
    ctx.stroke();

    // 有效底基支撑区微标带（当打开力学辅助线时）
    if (state.showVectors) {
      const supL = toPx({ x: g.supportLeft, y: g.baseLineY }, tr);
      const supR = toPx({ x: g.supportRight, y: g.baseLineY }, tr);
      ctx.fillStyle = ev.ok ? "rgba(19,19,19,0.22)" : "rgba(19,19,19,0.12)";
      ctx.fillRect(supL.x, supL.y - 3, Math.max(4, supR.x - supL.x), 6);
    }

    // 3) 暖宣米白正立巨柱（随 introT 从下向上沉稳立起）
    const uQuadAnim = g.uprightQuad.map((p, idx) => {
      if (idx < 2 && ease < 1) {
        const bot = g.uprightQuad[idx === 0 ? 3 : 2];
        return { x: bot.x + (p.x - bot.x) * ease, y: bot.y + (p.y - bot.y) * ease };
      }
      return p;
    });

    ctx.save();
    traceQuad(uQuadAnim, tr);
    ctx.fillStyle = PAL.cream;
    ctx.fill();
    if (hoverPart === "upright" || !ev.pillars.stable.ok) {
      ctx.strokeStyle = ev.pillars.stable.ok ? PAL.ink : PAL.ink;
      ctx.lineWidth = !ev.pillars.stable.ok ? 2 : 1.5;
      if (!ev.pillars.stable.ok) ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    if (ease > 0.7 && state.scene !== "poster") {
      drawSceneDetailsUpright(state.scene, g, tr);
    }

    // 4) 正柱中心垂直虚线轴 + 顶底实心小黑方块（1:1 复刻原海报！）
    const axTop = toPx(g.axisTop, tr);
    const axBot = toPx(g.axisBot, tr);
    // 先画柱外白色虚线
    ctx.save();
    ctx.strokeStyle = "rgba(255,248,249,0.88)";
    ctx.lineWidth = Math.max(1.2, scale * 0.0022);
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(axTop.x, axTop.y);
    ctx.lineTo(axBot.x, axBot.y);
    ctx.stroke();
    // 再在正柱内部裁切区域画深灰虚线（和原海报完全一致：白柱内灰虚线、橘底上白虚线！）
    traceQuad(uQuadAnim, tr);
    ctx.clip();
    ctx.strokeStyle = PAL.axisGray;
    ctx.beginPath();
    ctx.moveTo(axTop.x, axTop.y);
    ctx.lineTo(axBot.x, axBot.y);
    ctx.stroke();
    ctx.restore();

    // 顶底黑方块 ■
    const sq = Math.max(7, scale * 0.017);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(axTop.x - sq / 2, axTop.y - sq / 2, sq, sq);
    ctx.fillRect(axBot.x - sq / 2, axBot.y - sq / 2, sq, sq);

    // 5) 底部纯黑圆球支点（先画或贴在斜碑底沿下，严格正圆！）
    const bPx = toPx({ x: g.ballX, y: g.ballY }, tr);
    const bRadPx = g.ballR * scale;
    // 如果黑球脱空，用虚线标出理想托位幽灵圆圈引导拖拽
    if (!g.ballEngaged) {
      const idealPx = toPx({ x: g.idealBallX, y: g.ballY }, tr);
      ctx.save();
      ctx.strokeStyle = "rgba(19,19,19,0.65)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(idealPx.x, idealPx.y, bRadPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = PAL.ball;
    ctx.beginPath();
    ctx.arc(bPx.x, bPx.y, bRadPx, 0, Math.PI * 2);
    ctx.fill();
    // 悬停或拖动提示细环
    if (hoverPart === "ball" || !g.ballEngaged) {
      ctx.strokeStyle = PAL.white;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(bPx.x, bPx.y, bRadPx + 3.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 6) 纯黑倾斜巨碑（开场从 0° 微滑入目标角，或带倾覆微晃）
    const pivotPx = toPx(g.tiltedCenter, tr);
    ctx.save();
    if (wobbleRad !== 0) {
      ctx.translate(pivotPx.x, pivotPx.y);
      ctx.rotate(wobbleRad);
      ctx.translate(-pivotPx.x, -pivotPx.y);
    }
    traceQuad(g.tiltedQuad, tr);
    ctx.fillStyle = PAL.ink;
    ctx.fill();
    if (hoverPart === "tilted") {
      ctx.strokeStyle = "rgba(255,248,249,0.55)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();

    if (state.scene !== "poster") {
      ctx.save();
      if (wobbleRad !== 0) {
        ctx.translate(pivotPx.x, pivotPx.y);
        ctx.rotate(wobbleRad);
        ctx.translate(-pivotPx.x, -pivotPx.y);
      }
      drawSceneDetailsTilted(state.scene, g, tr);
      ctx.restore();
    }

    // 7) 纯白斜向贯通长箭头（1:1 复刻原海报贯穿黑碑的细白长箭！）
    const a0 = toPx(g.arrowStart, tr);
    const a1 = toPx(g.arrowEnd, tr);
    const aCur = {
      x: a0.x + (a1.x - a0.x) * ease,
      y: a0.y + (a1.y - a0.y) * ease,
    };
    ctx.save();
    ctx.strokeStyle = PAL.white;
    ctx.lineWidth = Math.max(1.8, scale * 0.0036);
    ctx.lineCap = "square";
    ctx.beginPath();
    ctx.moveTo(a0.x, a0.y);
    ctx.lineTo(aCur.x, aCur.y);
    ctx.stroke();
    // 箭头尖
    const ang = Math.atan2(a1.y - a0.y, a1.x - a0.x);
    const head = Math.max(9, scale * 0.024);
    ctx.beginPath();
    ctx.moveTo(aCur.x - head * Math.cos(ang - 0.52), aCur.y - head * Math.sin(ang - 0.52));
    ctx.lineTo(aCur.x, aCur.y);
    ctx.lineTo(aCur.x - head * Math.cos(ang + 0.52), aCur.y - head * Math.sin(ang + 0.52));
    ctx.stroke();
    ctx.restore();

    // 8) 顶部真实角度量角弧（复刻原海报右上角的虚线弧标尺！）
    if (state.showVectors) {
      const arcOrigin = toPx(g.tiltedQuad[3], tr);
      const topMid = toPx({
        x: (g.tiltedQuad[0].x + g.tiltedQuad[1].x) * 0.5,
        y: (g.tiltedQuad[0].y + g.tiltedQuad[1].y) * 0.5,
      }, tr);
      // 在黑碑上方画清晰的角度弧（以黑碑底心为圆心，展示相对垂线的真实夹角 θ）
      const botMid = toPx({
        x: (g.tiltedQuad[2].x + g.tiltedQuad[3].x) * 0.5,
        y: (g.tiltedQuad[2].y + g.tiltedQuad[3].y) * 0.5,
      }, tr);
      const rArc = Math.min(scale * 0.22, Math.hypot(topMid.x - botMid.x, topMid.y - botMid.y) * 0.46);
      const arcCenter = {
        x: topMid.x - Math.sin((g.tiltDeg * Math.PI) / 180) * rArc * 0.25,
        y: Math.max(36, topMid.y + rArc * 0.25),
      };
      // 垂直参考虚短线（从斜碑顶心起算）
      const refBase = toPx({
        x: g.tiltedCenter.x,
        y: g.tiltedCenter.y,
      }, tr);
      const arcR = scale * 0.14;
      const topRefY = Math.max(26, refBase.y - scale * 0.28);

      ctx.save();
      // 右上角固定精密角尺指示器（绝不遮挡几何主体且始终高对比可读！）
      const dialX = cw - Math.max(58, scale * 0.125);
      const dialY = Math.max(58, scale * 0.125);
      const dialR = Math.max(28, scale * 0.062);

      // 垂直 0° 基准虚线
      ctx.strokeStyle = "rgba(19,19,19,0.55)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(dialX, dialY + dialR * 0.45);
      ctx.lineTo(dialX, dialY - dialR - 8);
      ctx.stroke();
      ctx.setLineDash([]);

      // 10°–25° 甜区参考扇弧（正势实亮 + 反势淡示）
      ctx.strokeStyle = "rgba(255,248,249,0.78)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(dialX, dialY, dialR, -Math.PI / 2 + (10 * Math.PI) / 180, -Math.PI / 2 + (25 * Math.PI) / 180);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,248,249,0.34)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dialX, dialY, dialR, -Math.PI / 2 - (25 * Math.PI) / 180, -Math.PI / 2 - (10 * Math.PI) / 180);
      ctx.stroke();

      // 当前实测倾角射线与扇弧
      const curAng = -Math.PI / 2 + (g.tiltDeg * Math.PI) / 180;
      ctx.strokeStyle = PAL.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dialX, dialY);
      ctx.lineTo(dialX + Math.cos(curAng) * (dialR + 4), dialY + Math.sin(curAng) * (dialR + 4));
      ctx.stroke();

      // 圆点
      ctx.fillStyle = PAL.ink;
      ctx.beginPath();
      ctx.arc(dialX, dialY, 3, 0, Math.PI * 2);
      ctx.fill();

      // 实黑角度读数标牌（确保对比度 > 12:1）
      const degLabel = `${g.tiltDeg > 0 ? "+" : ""}${Math.round(g.tiltDeg)}°`;
      ctx.font = `600 ${Math.round(12 * fontScale)}px "IBM Plex Mono", monospace`;
      const tw = ctx.measureText(degLabel).width + 14;
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(dialX - tw / 2, dialY + dialR * 0.56, tw, Math.round(20 * fontScale));
      ctx.fillStyle = ev.ok ? PAL.okMint : PAL.white;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(degLabel, dialX, dialY + dialR * 0.56 + Math.round(10 * fontScale));

      // 9) 合成重心 G 点与铅垂线（真实静力平衡可视化！）
      const comPx = toPx({ x: g.comX, y: g.comY }, tr);
      const comGroundPx = toPx({ x: g.comX, y: g.baseLineY }, tr);
      ctx.strokeStyle = ev.ok ? PAL.okMint : PAL.white;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(comPx.x, comPx.y);
      ctx.lineTo(comGroundPx.x, comGroundPx.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 重心徽标 G
      ctx.fillStyle = PAL.ink;
      ctx.beginPath();
      ctx.arc(comPx.x, comPx.y, Math.max(9, 10 * fontScale), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ev.ok ? PAL.okMint : PAL.white;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = ev.ok ? PAL.okMint : PAL.white;
      ctx.font = `600 ${Math.round(10 * fontScale)}px "IBM Plex Mono", monospace`;
      ctx.fillText("G", comPx.x, comPx.y + 0.5);

      // 重心落脚菱标
      ctx.fillStyle = g.comInsideSupport ? PAL.ink : PAL.white;
      ctx.beginPath();
      ctx.moveTo(comGroundPx.x, comGroundPx.y - 5);
      ctx.lineTo(comGroundPx.x + 5, comGroundPx.y);
      ctx.lineTo(comGroundPx.x, comGroundPx.y + 5);
      ctx.lineTo(comGroundPx.x - 5, comGroundPx.y);
      ctx.closePath();
      ctx.fill();

      // 过斜倾覆时画倾覆力矩提示弯箭
      if (g.overToppled) {
        const tip = toPx(g.tiltDeg >= 0 ? g.tiltedQuad[1] : g.tiltedQuad[0], tr);
        ctx.strokeStyle = PAL.white;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        const dir = g.tiltDeg >= 0 ? 1 : -1;
        ctx.arc(tip.x - dir * 18, tip.y + 18, 22, dir > 0 ? -Math.PI * 0.7 : -Math.PI * 0.3, dir > 0 ? Math.PI * 0.15 : -Math.PI * 1.15, dir < 0);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
      void arcOrigin; void arcCenter; void arcR; void topRefY;
    }

    // 10) 原海报式精细虚线文字标注（高对比深墨字，自适应避免拥挤）
    if (cw >= 320) {
      ctx.save();
      const fs = Math.round(clamp(12 * fontScale, 10.5, 13.5));
      ctx.font = `700 ${fs}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = PAL.ink;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      // 左上注释：稳定的轴线（悬于米白正柱左上方开阔空地，绝不擦柱边）
      const note1 = toPx({ x: 0.04, y: 0.04 }, tr);
      const uTop = toPx(g.uprightQuad[0], tr);
      ctx.fillText("稳定的轴线", note1.x, note1.y);
      ctx.font = `500 ${Math.round(fs * 0.9)}px "Noto Sans SC", sans-serif`;
      ctx.fillText("提供秩序与支撑", note1.x, note1.y + fs + 3);
      // 引出细虚线优雅指向正柱上缘
      ctx.strokeStyle = "rgba(19,19,19,0.58)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(note1.x + fs * 3.4, note1.y + fs * 2.15);
      ctx.lineTo(uTop.x + scale * 0.045, uTop.y);
      ctx.stroke();

      // 若窄屏，把底部引导标精简显示在斜碑下旁
      if (cw >= 460) {
        const note2 = toPx({ x: 0.78, y: 0.44 }, tr);
        ctx.font = `700 ${fs}px "Noto Sans SC", sans-serif`;
        ctx.fillText(ev.ok ? "倾斜的形体" : "横拖扳动斜碑", note2.x, note2.y);
        ctx.font = `500 ${Math.round(fs * 0.9)}px "Noto Sans SC", sans-serif`;
        ctx.fillText(ev.ok ? "打破平静·制造张力" : "或拖黑球托底", note2.x, note2.y + fs + 3);
      }
      ctx.restore();
    }

    // 11) 演播视线扫描光珠（按 Space 或点「演播视线」时沿白箭冲向右上再回落正柱轴）
    if (scanPhase >= 0 && scanPhase <= 1.15) {
      ctx.save();
      let px, py;
      if (scanPhase <= 0.6) {
        const u = scanPhase / 0.6;
        px = a0.x + (a1.x - a0.x) * u;
        py = a0.y + (a1.y - a0.y) * u;
      } else {
        const u = clamp((scanPhase - 0.6) / 0.5, 0, 1);
        const midX = (a1.x + axTop.x) * 0.5;
        const midY = Math.min(a1.y, axTop.y) - 18;
        const t1 = 1 - u;
        px = t1 * t1 * a1.x + 2 * t1 * u * midX + u * u * axBot.x;
        py = t1 * t1 * a1.y + 2 * t1 * u * midY + u * u * axBot.y;
      }
      ctx.fillStyle = PAL.white;
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PAL.ink;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // 12) 顶部居中极简实黑操作提示胶囊（仅在开场未纠偏时点明直接拖拽，一旦开始平衡即隐退不挡画面）
    if (ev.code === "awkward_micro" && Math.abs(state.tiltDeg - 2) < 0.6 && cw >= 300) {
      ctx.save();
      const tip = "← 左右横拖扳动斜碑 · 拖黑球托底 →";
      const fs = cw < 420 ? 11 : 12;
      ctx.font = `600 ${fs}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(tip).width + 22;
      const th = 26;
      const tx = (cw - tw) * 0.5;
      const ty = ch - th - 10;
      ctx.fillStyle = "rgba(19,19,19,0.92)";
      ctx.fillRect(tx, ty, tw, th);
      ctx.fillStyle = PAL.cream;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tip, cw * 0.5, ty + th * 0.5);
      ctx.restore();
    }

    ctx.restore();
  }

  // ---------- 交互：鼠标、触屏拖拽与点击 ----------
  let dragMode = null; // 'tilt' | 'ball' | null
  let dragStartX = 0;
  let dragStartY = 0;
  let dragMoved = false;
  let dragAxisLocked = null; // 'h' | 'v' | null（触屏下允许竖滑滚页面！）
  let startVal = 0;
  let activePointerId = null;

  function clientToCanvas(cx, cy) {
    const r = canvas.getBoundingClientRect();
    return { x: cx - r.left, y: cy - r.top };
  }

  function hitTest(px, py) {
    const tr = getTransform();
    const wpt = toWorld(px, py, tr);
    const g = evaluate(getState()).geometry;
    // 1. 优先命中黑球支点（扩大触摸热区便于手指拖）
    if (Math.hypot(wpt.x - g.ballX, wpt.y - g.ballY) <= g.ballR * 2.15) return "ball";
    // 2. 命中黑碑
    if (pointInQuad(wpt, g.tiltedQuad)) return "tilted";
    // 3. 命中正柱
    if (pointInQuad(wpt, g.uprightQuad)) return "upright";
    return "stage";
  }

  function beginDrag(cx, cy, isTouch) {
    const pos = clientToCanvas(cx, cy);
    const hit = hitTest(pos.x, pos.y);
    dragStartX = cx;
    dragStartY = cy;
    dragMoved = false;
    dragAxisLocked = isTouch ? null : "h";

    const st = getState();
    if (hit === "ball") {
      dragMode = "ball";
      startVal = st.ballOffset;
    } else if (hit === "upright") {
      dragMode = "upright";
      startVal = st.tiltDeg;
    } else {
      dragMode = "tilt";
      startVal = st.tiltDeg;
    }
  }

  function moveDrag(cx, cy, isTouch, evt) {
    if (!dragMode) return;
    const dx = cx - dragStartX;
    const dy = cy - dragStartY;
    if (Math.hypot(dx, dy) > 4) dragMoved = true;

    // 触屏时判断拖动方向：竖拖放行给页面滚动，横拖锁定给画布交互
    if (isTouch && !dragAxisLocked && Math.hypot(dx, dy) > 5) {
      dragAxisLocked = Math.abs(dx) >= Math.abs(dy) * 0.85 ? "h" : "v";
    }
    if (dragAxisLocked === "v") return;
    if (evt && evt.cancelable) evt.preventDefault();

    const tr = getTransform();
    if (dragMode === "ball") {
      const next = clamp(startVal + dx / tr.scale, LIMITS.ballMin, LIMITS.ballMax);
      // 靠近理想托位 0 轻轻吸附
      const snapped = Math.abs(next) < 0.018 ? 0 : +next.toFixed(3);
      onChange({ ballOffset: snapped });
    } else {
      // 横拖画布任意处（包括从正柱上横拖）流畅扳动斜碑倾角
      const degPerPx = 68 / Math.max(220, cw * 0.65);
      let next = clamp(startVal + dx * degPerPx, LIMITS.tiltMin, LIMITS.tiltMax);
      // 靠近 20° 原海报经典位或 0° 时轻吸（半径 0.8°）
      if (Math.abs(next - 20) < 0.8) next = 20;
      else if (Math.abs(next) < 0.6) next = 0;
      onChange({ tiltDeg: +next.toFixed(1) });
    }
    dirty = true;
    ctrl.draw();
  }

  function endDrag() {
    if (!dragMode) return;
    const wasUprightClick = dragMode === "upright" && !dragMoved;
    dragMode = null;
    dragAxisLocked = null;
    activePointerId = null;
    if (wasUprightClick) {
      const st = getState();
      const nextU = Math.abs(st.uprightTiltDeg) > 1 ? 0 : 16;
      onChange({ uprightTiltDeg: nextU });
      if (onAnnounce) onAnnounce(nextU ? "正柱已故意歪斜 16°：观察参照系失锚" : "正柱已扶正回 0°");
      dirty = true;
      ctrl.draw();
    }
  }

  // Pointer Events（桌面鼠标与常规触屏）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏交由原生 touch 事件处理，兼容 perf.mjs dispatchTouchEvent
    activePointerId = e.pointerId;
    canvas.setPointerCapture?.(e.pointerId);
    beginDrag(e.clientX, e.clientY, false);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    if (dragMode && activePointerId === e.pointerId) {
      moveDrag(e.clientX, e.clientY, false, e);
    } else {
      const pos = clientToCanvas(e.clientX, e.clientY);
      const hit = hitTest(pos.x, pos.y);
      const nextHover = hit === "stage" ? null : hit;
      if (nextHover !== hoverPart) {
        hoverPart = nextHover;
        canvas.style.cursor = hit === "upright" ? "pointer" : "ew-resize";
        dirty = true;
        ctrl.draw();
      }
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    endDrag();
  });
  canvas.addEventListener("pointercancel", () => endDrag());
  canvas.addEventListener("pointerleave", () => {
    if (!dragMode && hoverPart !== null) {
      hoverPart = null;
      dirty = true;
      ctrl.draw();
    }
  });

  // 原生 Touch Events（确保触屏与 tools/perf.mjs 的 Input.dispatchTouchEvent 100% 同步驱动重绘！）
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const t0 = e.touches[0];
    beginDrag(t0.clientX, t0.clientY, true);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!e.touches.length || !dragMode) return;
    const t0 = e.touches[0];
    moveDrag(t0.clientX, t0.clientY, true, e);
  }, { passive: false });
  canvas.addEventListener("touchend", () => endDrag(), { passive: true });
  canvas.addEventListener("touchcancel", () => endDrag(), { passive: true });

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();

  const ctrl = loop(canvas, renderFrame);

  return {
    redraw() {
      dirty = true;
      ctrl.draw();
    },
    triggerScan() {
      scanPhase = 0;
      dirty = true;
      ctrl.draw();
    },
    destroy() {
      ro.disconnect();
    },
  };
}

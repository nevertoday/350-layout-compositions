// 147 马戏团版式 · 2D Canvas 活体排戏台渲染器
// 所有模块位置、尺寸、倾角、道具遮挡、碰撞红框、视线跳步曲线与踩球团长摇晃均来自 model.js 单一真源。

import { STAGE_W, STAGE_H } from "./model.js";

const PALETTE = {
  paper: "#FDF2DC",
  paperLight: "#FFFBF2",
  red: "#DA3515",
  redDark: "#A62208",
  blue: "#004EAE",
  blueDeep: "#0A2452",
  gold: "#FBC314",
  goldDeep: "#C98900",
  ink: "#0D0C10",
  mutedInk: "#4E535B",
  mutedMid: "#8D929A",
  mutedLight: "#D7D9DC",
  warn: "#D82008",
};

function drawStar(ctx, x, y, outerR, innerR, points, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = rot + (i * Math.PI) / points;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawFourStar(ctx, x, y, r) {
  drawStar(ctx, x, y, r, r * 0.32, 4, 0);
}

// 顶沿放射红白大篷顶幔 + 左上深蓝金星圆 + 斜挂三角彩旗串
function drawCircusBackdrop(ctx, evalData, state, t, introP) {
  const muted = state.focusMode === "muted";
  const red = muted ? "#9FA4AC" : PALETTE.red;
  const blue = muted ? "#5F6570" : PALETTE.blue;
  const gold = muted ? "#C3C6CC" : PALETTE.gold;

  // 纸底
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);

  // 1. 顶部放射红白大篷条纹（高噪音时条纹下探压迫画面）
  const clutter = evalData.clutter;
  if (clutter >= 12) {
    ctx.save();
    const reach = clutter > 62 ? 230 : 88;
    ctx.beginPath();
    ctx.rect(0, 0, STAGE_W, reach * introP);
    ctx.clip();
    const ox = STAGE_W * 0.56;
    const oy = -36;
    const rays = 14;
    ctx.fillStyle = clutter > 62 ? (muted ? "rgba(130,136,146,0.22)" : "rgba(218,53,21,0.18)") : red;
    for (let i = 0; i < rays; i++) {
      const a0 = (i / rays) * Math.PI;
      const a1 = ((i + 0.48) / rays) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(a0) * 860, oy + Math.sin(a0) * 860);
      ctx.lineTo(ox + Math.cos(a1) * 860, oy + Math.sin(a1) * 860);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 2. 左上角原海报标志性深蓝圆 + 金黄八角芒星
  if (clutter >= 14) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(36, 36, 62 * introP, 0, Math.PI * 2);
    ctx.fillStyle = blue;
    ctx.fill();
    drawStar(ctx, 44, 42, 30 * introP, 9 * introP, 8, t * 0.14);
    ctx.fillStyle = gold;
    ctx.fill();
    ctx.restore();
  }

  // 3. 右下角微缩马戏帐篷尖与大黄圆 + 左下深蓝波浪（呼应原海报底沿结构，不占正中腹地）
  ctx.save();
  // 右下大黄圆弧
  ctx.beginPath();
  ctx.arc(STAGE_W + 12, STAGE_H - 90, 92, 0, Math.PI * 2);
  ctx.fillStyle = gold;
  ctx.fill();
  // 蓝五星在大黄圆上
  drawStar(ctx, STAGE_W - 34, STAGE_H - 112, 18, 7.5, 5);
  ctx.fillStyle = blue;
  ctx.fill();

  // 右下微缩红白条纹帐篷顶与波浪蓝檐
  const tx = STAGE_W - 118;
  const ty = STAGE_H - 72;
  ctx.beginPath();
  ctx.moveTo(tx, ty - 28);
  ctx.lineTo(tx - 82, STAGE_H);
  ctx.lineTo(tx + 96, STAGE_H);
  ctx.closePath();
  ctx.fillStyle = PALETTE.paperLight;
  ctx.fill();
  // 红条纹
  ctx.fillStyle = red;
  for (let s = -2; s <= 2; s += 2) {
    ctx.beginPath();
    ctx.moveTo(tx, ty - 28);
    ctx.lineTo(tx + s * 28 - 14, STAGE_H);
    ctx.lineTo(tx + s * 28 + 14, STAGE_H);
    ctx.closePath();
    ctx.fill();
  }
  // 蓝波浪檐
  ctx.fillStyle = blue;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(tx + i * 24, STAGE_H - 16, 13, 0, Math.PI);
    ctx.fill();
  }
  // 帐篷旗杆和小红旗
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(tx, ty - 28);
  ctx.lineTo(tx, ty - 54);
  ctx.stroke();
  ctx.fillStyle = red;
  ctx.beginPath();
  ctx.moveTo(tx + 1, ty - 53);
  ctx.lineTo(tx + 24, ty - 46);
  ctx.lineTo(tx + 1, ty - 38);
  ctx.closePath();
  ctx.fill();

  // 左下深蓝波浪角
  ctx.beginPath();
  ctx.moveTo(0, STAGE_H - 46);
  ctx.quadraticCurveTo(96, STAGE_H - 22, 186, STAGE_H);
  ctx.lineTo(0, STAGE_H);
  ctx.closePath();
  ctx.fillStyle = blue;
  ctx.fill();
  // 左下白色小芒星
  drawStar(ctx, 136, STAGE_H - 16, 13, 4.5, 8);
  ctx.fillStyle = PALETTE.paperLight;
  ctx.fill();
  ctx.restore();

  // 4. 顶部斜挂红黄蓝三角彩旗串（Bunting）
  if (clutter >= 16) {
    ctx.save();
    const sway = Math.sin(t * 2.0) * 3.5;
    const x0 = 96;
    const y0 = 64;
    const x1 = 486;
    const y1 = 22;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 18 + sway, x1, y1);
    ctx.stroke();

    const flags = 9;
    const colors = [red, red, gold, blue, red, gold, blue, red, gold];
    for (let i = 0; i < flags; i++) {
      const u0 = (i + 0.15) / flags;
      const u1 = (i + 0.85) / flags;
      const um = (u0 + u1) / 2;
      const pt = (u) => {
        const inv = 1 - u;
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2 + 18 + sway;
        return {
          x: inv * inv * x0 + 2 * inv * u * cx + u * u * x1,
          y: inv * inv * y0 + 2 * inv * u * cy + u * u * y1,
        };
      };
      const p0 = pt(u0);
      const p1 = pt(u1);
      const pm = pt(um);
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(pm.x + 2, pm.y + 24);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

// 活跃星点与彩球道具层（被压字检测命中的道具带红色警告虚线环）
function drawPropsLayer(ctx, evalData, state, t) {
  const muted = state.focusMode === "muted";
  const colorMap = {
    red: muted ? "#9A9FA8" : PALETTE.red,
    blue: muted ? "#636973" : PALETTE.blue,
    gold: muted ? "#C1C4CA" : PALETTE.gold,
    ink: muted ? "#4C5057" : PALETTE.ink,
  };
  const blockedSet = new Set(evalData.blockedPropIndices);

  evalData.activeProps.forEach((p, idx) => {
    ctx.save();
    const bob = Math.sin(t * 2.1 + idx * 0.9) * 2;
    const px = p.x;
    const py = p.y + bob;
    const col = colorMap[p.color] || PALETTE.red;

    if (p.kind === "dot") {
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
    } else if (p.kind === "ball") {
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = PALETTE.paper;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, p.r * 0.56, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === "diamond") {
      drawFourStar(ctx, px, py, p.r);
      ctx.fillStyle = col;
      ctx.fill();
    } else if (p.kind === "star5") {
      drawStar(ctx, px, py, p.r, p.r * 0.42, 5);
      ctx.fillStyle = col;
      ctx.fill();
    } else if (p.kind === "star8") {
      drawStar(ctx, px, py, p.r, p.r * 0.36, 8, t * 0.2 + idx);
      ctx.fillStyle = col;
      ctx.fill();
    }

    // 若这枚道具闯入文字腹地压字，标出红色噪音警告虚线环
    if (blockedSet.has(idx)) {
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(px, py, p.r + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  });
}

// 原海报同款无五官高礼帽踩球马戏团长剪影（严禁五官细节！）
function drawRingmasterOnBall(ctx, box, evalData, state, t, currentLean) {
  const muted = state.focusMode === "muted";
  const red = muted ? "#8C9199" : PALETTE.red;
  const gold = muted ? "#C7CACF" : PALETTE.gold;
  const ink = muted ? "#3E434B" : PALETTE.ink;

  ctx.save();
  ctx.translate(box.cx, box.cy);
  const s = box.scale || 1;
  ctx.scale(s, s);

  // 全员抢戏态给团长也套上刺眼框
  if (state.focusMode === "chaos") {
    ctx.fillStyle = muted ? "#D7D9DC" : "#FFE078";
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.fillRect(-72, -126, 144, 250);
    ctx.strokeRect(-72, -126, 144, 250);
  }

  // 1. 底部红黄竖条大彩球（带居中白五星）
  const ballY = 72;
  const ballR = 46;
  ctx.save();
  ctx.translate(0, ballY);
  const ballRoll = (currentLean * Math.PI) / 180 * 0.65 + Math.sin(t * 1.8) * (evalData.passCount === 4 ? 0.04 : 0.12);
  ctx.rotate(ballRoll);
  ctx.beginPath();
  ctx.arc(0, 0, ballR, 0, Math.PI * 2);
  ctx.fillStyle = red;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // 左右两道弯月金黄瓣
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.ellipse(-28, 0, 14, ballR + 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(28, 0, 14, ballR + 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // 白五星
  drawStar(ctx, 0, 0, 17, 7, 5);
  ctx.fillStyle = PALETTE.paperLight;
  ctx.fill();
  ctx.restore();

  // 2. 踩球团长无五官剪影（以球顶为支点实时倾斜摇晃）
  ctx.save();
  ctx.translate(0, ballY - ballR + 2);
  const swayExtra = evalData.passCount === 4
    ? Math.sin(t * 2.2) * 1.4
    : Math.sin(t * 5.2) * 4.2;
  ctx.rotate(((currentLean + swayExtra) * Math.PI) / 180);

  // 站立腿（左腿踩球）与后翘腿（右腿轻扬），原海报同款黄黑竖条裤
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 站立左腿
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(-12, -62);
  ctx.lineTo(3, -62);
  ctx.lineTo(1, -2);
  ctx.lineTo(-10, -2);
  ctx.closePath();
  ctx.fill();
  // 站立腿金色条纹
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-8, -58);
  ctx.lineTo(-7, -6);
  ctx.moveTo(-2, -58);
  ctx.lineTo(-2, -6);
  ctx.stroke();
  // 站立皮鞋
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.ellipse(-8, -1, 11, 5, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // 后翘右腿
  ctx.save();
  ctx.translate(4, -58);
  ctx.rotate(-0.52);
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.roundRect(-6, 0, 14, 46, 5);
  ctx.fill();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  ctx.moveTo(-1, 3);
  ctx.lineTo(-1, 42);
  ctx.moveTo(4, 3);
  ctx.lineTo(4, 42);
  ctx.stroke();
  // 翘起脚尖
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.ellipse(6, 46, 10, 4.5, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 燕尾服上身躯干（纯黑剪影）
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(-15, -110);
  ctx.lineTo(13, -110);
  ctx.lineTo(10, -58);
  ctx.lineTo(-13, -58);
  ctx.closePath();
  ctx.fill();
  // 燕尾下摆
  ctx.beginPath();
  ctx.moveTo(6, -66);
  ctx.quadraticCurveTo(22, -52, 26, -42);
  ctx.lineTo(10, -48);
  ctx.closePath();
  ctx.fill();
  // 三颗金扣
  ctx.fillStyle = gold;
  for (let b = 0; b < 3; b++) {
    ctx.beginPath();
    ctx.arc(-2, -96 + b * 11, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 张开双臂（优雅保持平衡）
  ctx.strokeStyle = ink;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-12, -104);
  ctx.lineTo(-50, -82);
  ctx.moveTo(10, -104);
  ctx.lineTo(46, -134);
  ctx.stroke();
  // 手掌剪影椭圆
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.ellipse(-53, -80, 7, 4, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(49, -137, 7, 4, -0.8, 0, Math.PI * 2);
  ctx.fill();

  // 红色领结
  ctx.fillStyle = red;
  ctx.beginPath();
  ctx.moveTo(-2, -111);
  ctx.lineTo(-11, -116);
  ctx.lineTo(-11, -106);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-2, -111);
  ctx.lineTo(7, -116);
  ctx.lineTo(7, -106);
  ctx.closePath();
  ctx.fill();

  // 无五官侧影头颅（严格不画眼鼻嘴！）
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.arc(-2, -125, 11.5, 0, Math.PI * 2);
  ctx.fill();

  // 高礼帽（微斜 + 细金帽带）
  ctx.save();
  ctx.translate(-2, -134);
  ctx.rotate(0.24);
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-11, -24, 22, 24);
  ctx.fillStyle = gold;
  ctx.fillRect(-11, -5, 22, 4);
  ctx.restore();

  // 失衡时在帽子旁画虚线警示弧
  if (Math.abs(currentLean) > 8) {
    ctx.strokeStyle = PALETTE.warn;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, -124, 42, -Math.PI * 0.85, -Math.PI * 0.15);
    ctx.stroke();
  }

  ctx.restore();
  ctx.restore();
}

// 渲染主角大标（原海报红-黑-红跳色与微错位木活字）
function drawHeadline(ctx, box, state) {
  const muted = state.focusMode === "muted";
  const chaos = state.focusMode === "chaos";
  const red = muted ? "#6C717A" : PALETTE.red;
  const ink = muted ? "#494D54" : PALETTE.ink;

  ctx.save();
  ctx.translate(box.cx, box.cy);
  ctx.rotate((box.deg * Math.PI) / 180);

  if (chaos) {
    // 失控抢戏态：给主标也加厚重炸裂黄红底框，与其他色块糊成一片
    ctx.fillStyle = muted ? "#D7D9DC" : PALETTE.gold;
    ctx.strokeStyle = red;
    ctx.lineWidth = 4;
    ctx.fillRect(-box.w / 2, -box.h / 2, box.w, box.h);
    ctx.strokeRect(-box.w / 2, -box.h / 2, box.w, box.h);
  }

  const fs = box.fontSize;
  ctx.font = `900 ${fs}px "ZCOOL KuaiLe", "Noto Sans SC", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 第一行：红 - 黑 - 黑 - 红 跳色 + 极轻微基线跳动（原海报灵魂）
  const drawRow = (str, yOff, rowIdx) => {
    const chars = [...str];
    const step = fs * 1.04;
    const startX = -((chars.length - 1) * step) / 2;
    chars.forEach((ch, idx) => {
      const cx = startX + idx * step;
      const bounceY = state.jumpRatio >= 2.2 ? (idx % 2 === 0 ? -fs * 0.045 : fs * 0.04) : 0;
      const charRot = state.jumpRatio >= 2.2 ? (idx % 2 === 0 ? -0.04 : 0.035) : 0;
      ctx.save();
      ctx.translate(cx, yOff + bounceY);
      ctx.rotate(charRot);

      const isRed = rowIdx === 0 && (idx === 0 || idx === chars.length - 1);
      // 柔和硬朗木版阴影
      if (!muted && state.jumpRatio >= 2.2) {
        ctx.fillStyle = "rgba(13,12,16,0.14)";
        ctx.fillText(ch, 3, 4);
      }
      ctx.fillStyle = isRed ? red : ink;
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
  };

  drawRow(box.textA, -fs * 0.54, 0);
  drawRow(box.textB, fs * 0.56, 1);

  ctx.restore();
}

// 渲染深蓝燕尾缎带（复刻原海报 • CIRCUS LAYOUT •）
function drawRibbon(ctx, box, state) {
  const muted = state.focusMode === "muted";
  const chaos = state.focusMode === "chaos";
  const bg = muted ? "#7A808A" : chaos ? PALETTE.red : PALETTE.blue;
  const dot = muted ? "#D7D9DC" : PALETTE.gold;

  ctx.save();
  ctx.translate(box.cx, box.cy);
  ctx.rotate((box.deg * Math.PI) / 180);

  const hw = box.w / 2;
  const hh = box.h / 2;
  const notch = 16;

  // 燕尾丝带轮廓
  ctx.beginPath();
  ctx.moveTo(-hw, -hh);
  ctx.lineTo(hw, -hh);
  ctx.lineTo(hw - notch, 0);
  ctx.lineTo(hw, hh);
  ctx.lineTo(-hw, hh);
  ctx.lineTo(-hw + notch, 0);
  ctx.closePath();
  ctx.fillStyle = bg;
  ctx.fill();

  if (chaos) {
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // 两端金圆钉
  ctx.fillStyle = dot;
  ctx.beginPath();
  ctx.arc(-hw + notch + 12, 0, 4.2, 0, Math.PI * 2);
  ctx.arc(hw - notch - 12, 0, 4.2, 0, Math.PI * 2);
  ctx.fill();

  // 缎带文字
  ctx.fillStyle = PALETTE.paperLight;
  ctx.font = `700 ${box.fontSize}px "Anton", "Noto Sans SC", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(box.text, 0, 1);

  ctx.restore();
}

// 渲染时间票章（复古马戏检票牌）
function drawStamp(ctx, box, state) {
  const muted = state.focusMode === "muted";
  const chaos = state.focusMode === "chaos";
  const fill = muted ? "#EAEBED" : chaos ? PALETTE.blue : PALETTE.gold;
  const stroke = muted ? "#6B7078" : chaos ? PALETTE.gold : PALETTE.ink;
  const textCol = muted ? "#3C4047" : chaos ? PALETTE.paperLight : PALETTE.ink;

  ctx.save();
  ctx.translate(box.cx, box.cy);
  ctx.rotate((box.deg * Math.PI) / 180);

  const hw = box.w / 2;
  const hh = box.h / 2;

  ctx.fillStyle = fill;
  ctx.fillRect(-hw, -hh, box.w, box.h);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.6;
  ctx.strokeRect(-hw, -hh, box.w, box.h);
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(-hw + 5, -hh + 5, box.w - 10, box.h - 10);
  ctx.setLineDash([]);

  ctx.fillStyle = textCol;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${box.fontSize}px "DM Mono", "Noto Sans SC", monospace`;
  ctx.fillText(box.top, 0, -hh * 0.34);
  ctx.font = `700 ${Math.max(12, Math.round(box.fontSize * 0.76))}px "Noto Sans SC", sans-serif`;
  ctx.fillText(box.sub, 0, hh * 0.36);

  ctx.restore();
}

// 渲染细目说明（spotlight 时安静落奶油纸白 + 原海报红点线；chaos 时糊满刺眼色块抢戏）
function drawNote(ctx, box, state) {
  const muted = state.focusMode === "muted";
  const chaos = state.focusMode === "chaos";

  ctx.save();
  ctx.translate(box.cx, box.cy);
  ctx.rotate((box.deg * Math.PI) / 180);

  const hw = box.w / 2;
  const hh = box.h / 2;

  if (chaos) {
    ctx.fillStyle = muted ? "#CFD2D8" : PALETTE.red;
    ctx.fillRect(-hw - 8, -hh - 6, box.w + 16, box.h + 12);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.6;
    ctx.strokeRect(-hw - 8, -hh - 6, box.w + 16, box.h + 12);
  } else {
    // 原海报风格的红色小星 + 红点虚线领头
    const dotCol = muted ? "#8D929A" : PALETTE.red;
    drawStar(ctx, -hw + 8, -hh + 6, 6.5, 2.8, 5);
    ctx.fillStyle = dotCol;
    ctx.fill();
    for (let x = -hw + 22; x < hw - 4; x += 10) {
      ctx.beginPath();
      ctx.arc(x, -hh + 6, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = chaos ? PALETTE.paperLight : muted ? "#555A62" : PALETTE.ink;
  ctx.font = `${chaos ? 700 : 500} ${box.fontSize}px "Noto Sans SC", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  // 简单折成两行保证绝对不溢出
  const chars = [...box.text];
  const half = Math.ceil(chars.length / 2);
  const line1 = chars.slice(0, half).join("");
  const line2 = chars.slice(half).join("");
  ctx.fillText(line1, -hw + 2, -2);
  ctx.fillText(line2, -hw + 2, 18);

  ctx.restore();
}

// 渲染碰撞红框与当前选中框
function drawSelectionAndCollisions(ctx, evalData, state) {
  const collidedIds = new Set();
  evalData.collisionPairs.forEach(([a, b]) => {
    collidedIds.add(a);
    collidedIds.add(b);
  });

  // 碰撞报警框
  for (const id of collidedIds) {
    const m = evalData.modules[id];
    ctx.save();
    ctx.translate(m.cx, m.cy);
    ctx.rotate((m.deg * Math.PI) / 180);
    ctx.strokeStyle = PALETTE.warn;
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 4]);
    ctx.strokeRect(-m.w / 2 - 4, -m.h / 2 - 4, m.w + 8, m.h + 8);
    ctx.restore();
  }

  // 当前选中模块金黄操作框
  const sel = evalData.modules[state.selectedId];
  if (sel) {
    ctx.save();
    ctx.translate(sel.cx, sel.cy);
    ctx.rotate((sel.deg * Math.PI) / 180);
    ctx.strokeStyle = PALETTE.blue;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(-sel.w / 2 - 6, -sel.h / 2 - 6, sel.w + 12, sel.h + 12);
    ctx.setLineDash([]);
    // 四个实心小圆角锚
    const pts = [
      [-sel.w / 2 - 6, -sel.h / 2 - 6],
      [sel.w / 2 + 6, -sel.h / 2 - 6],
      [sel.w / 2 + 6, sel.h / 2 + 6],
      [-sel.w / 2 - 6, sel.h / 2 + 6],
    ];
    ctx.fillStyle = PALETTE.gold;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.6;
    for (const [x, y] of pts) {
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

// 渲染 ①→②→③→④ 弹簧视线跳步路径
function drawJumpPath(ctx, evalData, state, t) {
  if (!state.showPath) return;
  const top4 = evalData.weights.slice(0, 4);
  if (top4.length < 2) return;

  ctx.save();
  const isOk = evalData.pillars.appeal.ok && evalData.pillars.jump.ok;
  const lineCol = isOk ? "rgba(0,78,174,0.82)" : "rgba(216,32,8,0.85)";

  // 弹跳虚线弧
  ctx.strokeStyle = lineCol;
  ctx.lineWidth = 2.4;
  ctx.setLineDash([7, 5]);
  ctx.lineDashOffset = -t * 22;
  for (let i = 0; i < top4.length - 1; i++) {
    const a = top4[i];
    const b = top4[i + 1];
    const mx = (a.cx + b.cx) / 2;
    const my = (a.cy + b.cy) / 2 - 26;
    ctx.beginPath();
    ctx.moveTo(a.cx, a.cy);
    ctx.quadraticCurveTo(mx, my, b.cx, b.cy);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 编号圆徽
  const badgeColors = [PALETTE.red, PALETTE.blue, PALETTE.gold, PALETTE.ink];
  top4.forEach((item, i) => {
    const bx = item.cx - 4;
    const by = item.cy - 22;
    ctx.beginPath();
    ctx.arc(bx, by, 14, 0, Math.PI * 2);
    ctx.fillStyle = badgeColors[i];
    ctx.fill();
    ctx.strokeStyle = PALETTE.paperLight;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.fillStyle = i === 2 ? PALETTE.ink : PALETTE.paperLight;
    ctx.font = `700 13px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), bx, by + 0.5);
  });

  ctx.restore();
}

export function renderCircusStage(ctx, canvasW, canvasH, evalData, state, anim) {
  ctx.save();
  const scaleX = canvasW / STAGE_W;
  const scaleY = canvasH / STAGE_H;
  ctx.scale(scaleX, scaleY);

  const t = anim.t || 0;
  const introP = anim.introP ?? 1;
  const lean = anim.lean ?? evalData.ringmasterLean;

  drawCircusBackdrop(ctx, evalData, state, t, introP);

  // 先绘不压字的外缘道具，文字，再绘压字噪音道具（让压字真实盖在字上看得一清二楚！）
  const blockedSet = new Set(evalData.blockedPropIndices);
  const backProps = evalData.activeProps.filter((_, i) => !blockedSet.has(i));
  const frontProps = evalData.activeProps.filter((_, i) => blockedSet.has(i));

  // 背景道具
  drawPropsLayer(ctx, { ...evalData, activeProps: backProps, blockedPropIndices: [] }, state, t);

  // 五大演出模块
  drawNote(ctx, evalData.modules.note, state);
  drawStamp(ctx, evalData.modules.stamp, state);
  drawRibbon(ctx, evalData.modules.ribbon, state);
  drawHeadline(ctx, evalData.modules.headline, state);
  drawRingmasterOnBall(ctx, evalData.modules.star, evalData, state, t, lean);

  // 压在字面上的噪音道具（带红虚线环警示）
  if (frontProps.length > 0) {
    drawPropsLayer(
      ctx,
      { ...evalData, activeProps: frontProps, blockedPropIndices: frontProps.map((_, i) => i) },
      state,
      t,
    );
  }

  // 选中框与碰撞红框
  drawSelectionAndCollisions(ctx, evalData, state);

  // 视线跳步路径
  drawJumpPath(ctx, evalData, state, t);

  // 外框极细复古海报双线描边
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, STAGE_W - 3, STAGE_H - 3);

  ctx.restore();
}

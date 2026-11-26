// 306 主观视角构图 · 开场「第一人称入眼与推门视野台」2D 透视画布渲染与交互
// 针对慢手机与软件渲染（SwiftShader）做零 stencil clip、零逐帧 radialGradient、离线缓存便签与暗角优化
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, computeFrame } from "./model.js";

const PAL = {
  skyTop: "#92C8E6",
  skyMid: "#A3D2EC",
  skyLow: "#BCE0F3",
  seaTop: "#6DAED1",
  seaMid: "#7AB8DA",
  seaDeep: "#528CB0",
  cream: "#F4E7D1",
  creamBright: "#FAF3E4",
  orange: "#EE5C18",
  orangeDeep: "#C9470C",
  orangeGlow: "#FF8447",
  charcoal: "#151918",
  charcoalWall: "#1D2220",
  floorWarm: "#534432",
  floorDark: "#382D20",
  rockDark: "#1B1F1E",
  rockMid: "#363832",
  ok: "#2AA982",
  warn: "#E24234",
};

function drawRoundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

// 预缓存门背手写便签位图（避免每帧在软件渲染下重复光栅化中文字形）
const noteCache = new Map();
function getNoteSprite(scene) {
  const key = scene.id;
  if (noteCache.has(key)) return noteCache.get(key);
  const c = document.createElement("canvas");
  c.width = 160;
  c.height = 196;
  const g = c.getContext("2d");
  // 投影
  g.fillStyle = "rgba(0,0,0,0.34)";
  g.fillRect(14, 24, 136, 158);
  // 暖米纸张
  g.fillStyle = PAL.cream;
  g.fillRect(10, 18, 136, 158);
  // 朱橙胶带
  g.fillStyle = PAL.orange;
  g.fillRect(66, 6, 24, 32);
  // 霞鹜文楷手写两行
  g.fillStyle = PAL.charcoal;
  g.font = '500 24px "LXGW WenKai", "Noto Sans SC", serif';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(scene.noteLines[0], 78, 82);
  g.fillText(scene.noteLines[1], 78, 118);
  // 原海报落款小折线
  g.strokeStyle = PAL.charcoal;
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(42, 144);
  g.lineTo(78, 140);
  g.lineTo(86, 148);
  g.lineTo(114, 142);
  g.stroke();
  noteCache.set(key, c);
  return c;
}

// 预缓存暗角位图（64×64 低分辨率平滑拉伸，在 SwiftShader 下比逐帧全屏径向渐变快数十倍）
const vigCache = new Map();
function getVignetteSprite(strength) {
  const key = strength.toFixed(2);
  if (vigCache.has(key)) return vigCache.get(key);
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 16, 32, 32, 46);
  grad.addColorStop(0, "rgba(15, 19, 19, 0)");
  grad.addColorStop(1, `rgba(15, 19, 19, ${strength})`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  vigCache.set(key, c);
  return c;
}

// 场景 1：1:1 承袭 306 原海报「看海木屋」室外景致（仅绘制在门洞包围盒内减少像素填充量）
function drawCabinOutside(ctx, geom, t) {
  const { W, H, apRect, horizonY, subjectRect, panFarX, zoomScale } = geom;
  const ax = Math.max(0, apRect.x - 16);
  const ay = Math.max(0, apRect.y - 16);
  const aw = Math.min(W - ax, apRect.w + 32);
  const ah = Math.min(H - ay, apRect.h + 32);
  if (aw <= 0 || ah <= 0) return;

  // 天空两段纯色过渡（清爽版画风且极省填充开销）
  const skyH = clamp(horizonY - ay + 2, 0, ah);
  if (skyH > 0) {
    ctx.fillStyle = PAL.skyMid;
    ctx.fillRect(ax, ay, aw, skyH);
    ctx.fillStyle = PAL.skyTop;
    ctx.fillRect(ax, ay, aw, skyH * 0.44);
  }

  // 海面
  const seaY = Math.max(ay, horizonY);
  const seaH = ay + ah - seaY;
  if (seaH > 0) {
    ctx.fillStyle = PAL.seaMid;
    ctx.fillRect(ax, seaY, aw, seaH);
    ctx.fillStyle = PAL.seaTop;
    ctx.fillRect(ax, seaY + seaH * 0.42, aw, seaH * 0.58);
  }

  // 暖米白云（逐个独立圆形叠加避免路径切缝）
  const cloudX = W * 0.37 + panFarX * 0.85 + Math.sin(t * 0.25) * 3;
  const cloudY = horizonY - H * 0.35 * zoomScale;
  const cs = Math.min(W, H) * 0.042 * zoomScale;
  ctx.fillStyle = PAL.cream;
  ctx.beginPath();
  ctx.arc(cloudX + cs * 1.15, cloudY + cs * 0.12, cs * 0.56, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cloudX + cs * 0.22, cloudY - cs * 0.12, cs * 0.82, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cloudX - cs * 0.78, cloudY + cs * 0.08, cs * 0.60, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cloudX - cs * 1.15, cloudY + cs * 0.14, cs * 2.55, cs * 0.50);

  // 剪影飞鸥
  const birdX = W * 0.46 + panFarX * 0.92 + Math.sin(t * 0.6) * 5;
  const birdY = horizonY - H * 0.30 * zoomScale + Math.cos(t * 0.9) * 2.5;
  const bs = Math.min(W, H) * 0.024 * zoomScale;
  const wing = Math.sin(t * 2.4) * bs * 0.22;
  ctx.fillStyle = PAL.charcoal;
  ctx.beginPath();
  ctx.moveTo(birdX - bs * 1.6, birdY + bs * 0.18 + wing);
  ctx.quadraticCurveTo(birdX - bs * 0.55, birdY - bs * 0.45, birdX + bs * 0.05, birdY + bs * 0.06);
  ctx.quadraticCurveTo(birdX + bs * 0.65, birdY - bs * 0.68 - wing, birdX + bs * 1.55, birdY - bs * 0.32);
  ctx.quadraticCurveTo(birdX + bs * 0.55, birdY - bs * 0.05, birdX + bs * 0.12, birdY + bs * 0.34);
  ctx.quadraticCurveTo(birdX - bs * 0.45, birdY - bs * 0.02, birdX - bs * 1.6, birdY + bs * 0.18 + wing);
  ctx.closePath();
  ctx.fill();

  // 海面日照米色波光
  const shimX = W * 0.39 + panFarX * 0.95;
  ctx.fillStyle = PAL.cream;
  for (let i = 0; i < 6; i++) {
    const frac = i / 5;
    const wy = horizonY + 10 + frac * H * 0.22;
    const ww = (W * 0.15 - frac * W * 0.04) * zoomScale * (0.88 + 0.12 * Math.sin(t * 1.4 + i));
    const wx = shimX - ww * 0.45 + Math.sin(t * 0.9 + i * 1.5) * 3.5;
    ctx.fillRect(wx, wy, ww, Math.max(3, 5.5 - frac * 2));
  }

  // 远海礁石投影与轮廓
  const lx = subjectRect.cx;
  const rockBaseY = horizonY + 4;
  const rScale = zoomScale * (W / 800);
  ctx.fillStyle = "rgba(38, 70, 92, 0.36)";
  ctx.beginPath();
  ctx.moveTo(lx - 96 * rScale, rockBaseY);
  ctx.lineTo(lx + 115 * rScale, rockBaseY);
  ctx.lineTo(lx + 92 * rScale, rockBaseY + 32 * rScale);
  ctx.lineTo(lx - 45 * rScale, rockBaseY + 22 * rScale);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = PAL.rockDark;
  ctx.beginPath();
  ctx.moveTo(lx - 102 * rScale, rockBaseY);
  ctx.lineTo(lx - 44 * rScale, rockBaseY - 30 * rScale);
  ctx.lineTo(lx + 12 * rScale, rockBaseY - 46 * rScale);
  ctx.lineTo(lx + 68 * rScale, rockBaseY - 62 * rScale);
  ctx.lineTo(lx + 124 * rScale, rockBaseY - 56 * rScale);
  ctx.lineTo(lx + 135 * rScale, rockBaseY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = PAL.rockMid;
  ctx.beginPath();
  ctx.moveTo(lx + 12 * rScale, rockBaseY - 46 * rScale);
  ctx.lineTo(lx + 68 * rScale, rockBaseY - 62 * rScale);
  ctx.lineTo(lx + 118 * rScale, rockBaseY);
  ctx.lineTo(lx + 24 * rScale, rockBaseY);
  ctx.closePath();
  ctx.fill();

  // 远岸灯塔主体（以 subjectRect 为单真源坐标绘制）
  const tx = subjectRect.cx;
  const tyTop = subjectRect.y;
  const tyBot = subjectRect.y + subjectRect.h;
  const tw = subjectRect.w;
  const th = subjectRect.h;

  // 轻量版画同心光环（替代昂贵径向渐变）
  const pulse = 1 + 0.08 * Math.sin(t * 1.8);
  ctx.fillStyle = "rgba(255, 226, 166, 0.16)";
  ctx.beginPath();
  ctx.arc(tx, tyTop + th * 0.21, tw * 0.62 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 226, 166, 0.24)";
  ctx.beginPath();
  ctx.arc(tx, tyTop + th * 0.21, tw * 0.36 * pulse, 0, Math.PI * 2);
  ctx.fill();

  // 塔身
  const bodyTopY = tyTop + th * 0.29;
  ctx.fillStyle = PAL.creamBright;
  ctx.beginPath();
  ctx.moveTo(tx - tw * 0.23, bodyTopY);
  ctx.lineTo(tx + tw * 0.23, bodyTopY);
  ctx.lineTo(tx + tw * 0.34, tyBot);
  ctx.lineTo(tx - tw * 0.34, tyBot);
  ctx.closePath();
  ctx.fill();

  // 右侧微暗面
  ctx.fillStyle = "rgba(182, 166, 138, 0.36)";
  ctx.beginPath();
  ctx.moveTo(tx + tw * 0.04, bodyTopY);
  ctx.lineTo(tx + tw * 0.23, bodyTopY);
  ctx.lineTo(tx + tw * 0.34, tyBot);
  ctx.lineTo(tx + tw * 0.08, tyBot);
  ctx.closePath();
  ctx.fill();

  // 拱形黑窗
  const winW = tw * 0.11;
  const winH = th * 0.085;
  ctx.fillStyle = PAL.charcoal;
  drawRoundRect(ctx, tx - winW * 0.5, tyTop + th * 0.55, winW, winH, winW * 0.48);
  ctx.fill();

  // 观景廊与栏杆
  const galY = tyTop + th * 0.255;
  ctx.fillStyle = PAL.charcoal;
  ctx.fillRect(tx - tw * 0.32, galY + th * 0.025, tw * 0.64, Math.max(2.5, th * 0.022));
  ctx.lineWidth = Math.max(1.2, tw * 0.015);
  ctx.strokeStyle = PAL.charcoal;
  ctx.strokeRect(tx - tw * 0.30, galY - th * 0.025, tw * 0.60, th * 0.05);

  // 灯室与朱橙锥顶
  const lanY = tyTop + th * 0.155;
  const lanH = th * 0.10;
  ctx.fillStyle = PAL.orange;
  ctx.fillRect(tx - tw * 0.20, lanY, tw * 0.40, lanH);
  ctx.fillStyle = PAL.creamBright;
  ctx.fillRect(tx - tw * 0.08, lanY + lanH * 0.18, tw * 0.16, lanH * 0.64);
  ctx.fillStyle = PAL.orange;
  ctx.beginPath();
  ctx.moveTo(tx, tyTop + th * 0.04);
  ctx.lineTo(tx + tw * 0.27, lanY + 1);
  ctx.lineTo(tx - tw * 0.27, lanY + 1);
  ctx.closePath();
  ctx.fill();
}

// 场景 2：悬疑·暗廊推门
function drawCorridorOutside(ctx, geom, t) {
  const { W, H, apRect, horizonY, subjectRect, panFarX, zoomScale } = geom;
  const ax = Math.max(0, apRect.x - 16);
  const aw = Math.min(W - ax, apRect.w + 32);
  if (aw <= 0) return;

  ctx.fillStyle = "#223440";
  ctx.fillRect(ax, 0, aw, horizonY);
  ctx.fillStyle = "#2A3338";
  ctx.fillRect(ax, horizonY, aw, H - horizonY);

  const vpX = W * 0.56 + panFarX;
  ctx.strokeStyle = "rgba(156, 206, 233, 0.18)";
  ctx.lineWidth = 1.2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(vpX, horizonY);
    ctx.lineTo(vpX + i * W * 0.22, H);
    ctx.stroke();
  }

  const lampX = subjectRect.cx;
  const lampY = horizonY - H * 0.42 * zoomScale;
  ctx.fillStyle = "rgba(244, 231, 209, 0.16)";
  ctx.beginPath();
  ctx.moveTo(lampX - 16, lampY);
  ctx.lineTo(lampX + 16, lampY);
  ctx.lineTo(lampX + W * 0.24 * zoomScale, H);
  ctx.lineTo(lampX - W * 0.24 * zoomScale, H);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = PAL.creamBright;
  ctx.beginPath();
  ctx.arc(lampX, lampY, Math.max(4, 7 * zoomScale), 0, Math.PI * 2);
  ctx.fill();

  const sx = subjectRect.cx;
  const syTop = subjectRect.y;
  const sw = subjectRect.w;
  const sh = subjectRect.h;

  ctx.fillStyle = "rgba(12, 16, 18, 0.55)";
  ctx.beginPath();
  ctx.moveTo(sx - sw * 0.18, syTop + sh * 0.92);
  ctx.lineTo(sx + sw * 0.22, syTop + sh * 0.92);
  ctx.lineTo(sx - sw * 0.65, H);
  ctx.lineTo(sx - sw * 1.15, H);
  ctx.closePath();
  ctx.fill();

  // 无五官剪影
  const bob = Math.sin(t * 1.2) * 1.5;
  ctx.fillStyle = "#101619";
  ctx.beginPath();
  ctx.arc(sx + sw * 0.14, syTop + sh * 0.18 + bob, sw * 0.12, 0, Math.PI * 2);
  ctx.fill();
  drawRoundRect(ctx, sx - sw * 0.04, syTop + sh * 0.30 + bob, sw * 0.36, sh * 0.54, sw * 0.12);
  ctx.fill();

  // 敞开红箱与信纸
  const boxX = sx - sw * 0.44;
  const boxY = syTop + sh * 0.64;
  const boxW = sw * 0.58;
  const boxH = sh * 0.34;
  ctx.fillStyle = PAL.orangeDeep;
  drawRoundRect(ctx, boxX, boxY - boxH * 0.48, boxW, boxH * 0.52, 4);
  ctx.fill();
  ctx.fillStyle = PAL.orange;
  drawRoundRect(ctx, boxX, boxY, boxW, boxH, 5);
  ctx.fill();
  ctx.fillStyle = PAL.creamBright;
  ctx.save();
  ctx.translate(boxX + boxW * 0.28, boxY + boxH * 0.05);
  ctx.rotate(-0.18);
  ctx.fillRect(0, -boxH * 0.38, boxW * 0.42, boxH * 0.52);
  ctx.restore();
}

// 场景 3：清晨·车窗出站
function drawTrainOutside(ctx, geom, t) {
  const { W, H, apRect, horizonY, subjectRect, panFarX, zoomScale } = geom;
  const ax = Math.max(0, apRect.x - 16);
  const aw = Math.min(W - ax, apRect.w + 32);
  if (aw <= 0) return;

  ctx.fillStyle = "#B5DAF0";
  ctx.fillRect(ax, 0, aw, horizonY);
  ctx.fillStyle = "#F4E5CE";
  ctx.fillRect(ax, horizonY - H * 0.12, aw, H * 0.12);
  ctx.fillStyle = "#6FAFD1";
  ctx.fillRect(ax, horizonY, aw, H - horizonY);

  const sunX = W * 0.38 + panFarX * 0.78;
  const sunY = horizonY - H * 0.16 * zoomScale;
  ctx.fillStyle = PAL.creamBright;
  ctx.beginPath();
  ctx.arc(sunX, sunY, Math.min(W, H) * 0.058 * zoomScale, 0, Math.PI * 2);
  ctx.fill();

  const poleShift = (t * 48) % (W * 0.42);
  ctx.fillStyle = "rgba(21, 25, 24, 0.24)";
  for (let i = 0; i < 3; i++) {
    const px = ((W * 1.15 - poleShift + i * W * 0.42) % (W * 1.26)) - W * 0.1;
    ctx.fillRect(px, horizonY - H * 0.42, 4, H * 0.65);
  }

  ctx.fillStyle = "#314652";
  ctx.fillRect(ax, horizonY + H * 0.06, aw, H * 0.055);
  ctx.fillStyle = PAL.cream;
  ctx.fillRect(ax, horizonY + H * 0.06, aw, 3);

  const tx = subjectRect.cx;
  const tyTop = subjectRect.y;
  const tw = subjectRect.w;
  const th = subjectRect.h;

  ctx.fillStyle = PAL.creamBright;
  ctx.fillRect(tx - tw * 0.28, tyTop + th * 0.22, tw * 0.56, th * 0.78);
  ctx.fillStyle = "#D9C9AE";
  ctx.fillRect(tx + tw * 0.06, tyTop + th * 0.22, tw * 0.22, th * 0.78);
  ctx.fillStyle = PAL.orange;
  ctx.beginPath();
  ctx.moveTo(tx, tyTop);
  ctx.lineTo(tx + tw * 0.36, tyTop + th * 0.23);
  ctx.lineTo(tx - tw * 0.36, tyTop + th * 0.23);
  ctx.closePath();
  ctx.fill();

  const cr = tw * 0.14;
  ctx.fillStyle = PAL.charcoal;
  ctx.beginPath();
  ctx.arc(tx, tyTop + th * 0.42, cr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.creamBright;
  ctx.beginPath();
  ctx.arc(tx, tyTop + th * 0.42, cr * 0.78, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.charcoal;
  drawRoundRect(ctx, tx - tw * 0.14, tyTop + th * 0.68, tw * 0.28, th * 0.32, tw * 0.14);
  ctx.fill();
}

// 零 clip("evenodd") 版本：用四个梯形内墙块围合门洞，软件渲染速度暴增
function drawDoorwayFrame(ctx, geom, state) {
  const { W, H, aperturePoly, scene, doorHandle } = geom;
  const { tl, tr, br, bl } = aperturePoly;
  const wallColor = state.scene === "train" ? "#192023" : PAL.charcoalWall;

  ctx.fillStyle = wallColor;
  // 上墙块
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, Math.max(0, tr.y));
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(tl.x, tl.y);
  ctx.lineTo(0, Math.max(0, tl.y));
  ctx.closePath();
  ctx.fill();

  // 左墙块
  if (tl.x > 0 || bl.x > 0) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tl.x, 0);
    ctx.lineTo(tl.x, tl.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.lineTo(bl.x, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
  }

  // 右墙块
  if (tr.x < W || br.x < W) {
    ctx.beginPath();
    ctx.moveTo(tr.x, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, H);
    ctx.lineTo(br.x, H);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.closePath();
    ctx.fill();
  }

  // 底部暖木地板（替换下墙块）
  const floorTopY = Math.min(H, Math.min(bl.y, br.y));
  if (floorTopY < H) {
    ctx.fillStyle = PAL.floorWarm;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, Math.max(H * 0.76, bl.y + 16));
    ctx.lineTo(bl.x, bl.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(W, Math.max(H * 0.76, br.y + 16));
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    // 门坎下方暗影条
    ctx.fillStyle = PAL.floorDark;
    ctx.beginPath();
    ctx.moveTo(bl.x, bl.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(br.x + 12, Math.min(H, br.y + 22));
    ctx.lineTo(bl.x - 12, Math.min(H, bl.y + 22));
    ctx.closePath();
    ctx.fill();
  }

  // 深炭门框四条立柱
  const jamb = clamp(W * 0.024, 10, 22);
  ctx.fillStyle = "#101413";
  // 左门柱
  ctx.beginPath();
  ctx.moveTo(tl.x - jamb, tl.y - jamb);
  ctx.lineTo(tl.x, tl.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.lineTo(bl.x - jamb, bl.y + jamb * 0.6);
  ctx.closePath();
  ctx.fill();
  // 右门柱
  ctx.beginPath();
  ctx.moveTo(tr.x, tr.y);
  ctx.lineTo(tr.x + jamb, tr.y - jamb);
  ctx.lineTo(br.x + jamb, br.y + jamb * 0.6);
  ctx.lineTo(br.x, br.y);
  ctx.closePath();
  ctx.fill();
  // 上门楣
  ctx.beginPath();
  ctx.moveTo(tl.x - jamb, tl.y - jamb);
  ctx.lineTo(tr.x + jamb, tr.y - jamb);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(tl.x, tl.y);
  ctx.closePath();
  ctx.fill();

  // 左侧内开门扇 + 预缓存的手写便签「今天，去看海。」
  const leftSpace = Math.min(tl.x, bl.x);
  if (leftSpace > 24) {
    ctx.fillStyle = "#161A19";
    ctx.beginPath();
    ctx.moveTo(0, Math.max(0, tl.y + H * 0.06));
    ctx.lineTo(tl.x - jamb, tl.y + H * 0.09);
    ctx.lineTo(bl.x - jamb, bl.y + H * 0.02);
    ctx.lineTo(0, H * 0.94);
    ctx.closePath();
    ctx.fill();

    if (leftSpace > 66) {
      const sprite = getNoteSprite(scene);
      const noteW = clamp(leftSpace * 0.62, 58, 134);
      const noteH = noteW * (sprite.height / sprite.width);
      const noteX = (leftSpace - jamb) * 0.48;
      const noteY = H * 0.47;
      ctx.save();
      ctx.translate(noteX, noteY);
      ctx.rotate(-0.075);
      ctx.drawImage(sprite, -noteW * 0.5, -noteH * 0.5, noteW, noteH);
      ctx.restore();
    }
  }

  // 门洞内沿细光棱线
  ctx.strokeStyle = "rgba(244, 231, 209, 0.22)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.closePath();
  ctx.stroke();

  // 贴在右门柱上的可拖拽推拉门柄
  if (doorHandle.visible) {
    const hx = doorHandle.x;
    const hy = doorHandle.y;
    ctx.fillStyle = PAL.orange;
    drawRoundRect(ctx, hx - 7, hy - 22, 14, 44, 7);
    ctx.fill();
    ctx.strokeStyle = PAL.creamBright;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(hx - 2, hy - 9);
    ctx.lineTo(hx - 2, hy + 9);
    ctx.moveTo(hx + 2, hy - 9);
    ctx.lineTo(hx + 2, hy + 9);
    ctx.stroke();
  }
}

// 前景第一人称身体锚点（原海报朱橙双手捧黑杯）
function drawForegroundHands(ctx, geom, state, t) {
  const { handsRect } = geom;
  if (!handsRect.active) return;

  const { cx, y, w, h } = handsRect;
  const breathY = Math.sin(t * geom.mood.swayFreq * 1.4) * 3;
  const cupR = w * 0.21;
  const cupX = cx;
  const cupY = y + h * 0.44 + breathY;

  ctx.save();
  // 双黑袖
  ctx.fillStyle = PAL.charcoal;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.72, y + h * 1.28);
  ctx.lineTo(cx - w * 0.36, y + h * 0.68 + breathY);
  ctx.lineTo(cx - w * 0.18, y + h * 0.88 + breathY);
  ctx.lineTo(cx - w * 0.42, y + h * 1.35);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.72, y + h * 1.28);
  ctx.lineTo(cx + w * 0.38, y + h * 0.68 + breathY);
  ctx.lineTo(cx + w * 0.20, y + h * 0.88 + breathY);
  ctx.lineTo(cx + w * 0.44, y + h * 1.35);
  ctx.closePath();
  ctx.fill();

  // 热气微缕
  if (state.scene !== "corridor") {
    ctx.strokeStyle = "rgba(244, 231, 209, 0.42)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (let s = -1; s <= 1; s += 2) {
      const sx = cupX + s * cupR * 0.32;
      const drift = Math.sin(t * 1.8 + s) * 5;
      ctx.beginPath();
      ctx.moveTo(sx, cupY - cupR * 0.56);
      ctx.quadraticCurveTo(sx + drift, cupY - cupR * 0.95, sx - drift * 0.5, cupY - cupR * 1.28);
      ctx.stroke();
    }
  }

  // 朱橙双手掌
  ctx.fillStyle = PAL.orange;
  ctx.strokeStyle = PAL.charcoal;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.36, y + h * 0.78 + breathY);
  ctx.quadraticCurveTo(cx - w * 0.38, y + h * 0.34 + breathY, cx - cupR * 0.92, cupY - cupR * 0.25);
  ctx.lineTo(cx - cupR * 0.62, cupY + cupR * 0.65);
  ctx.lineTo(cx - w * 0.18, y + h * 0.90 + breathY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + w * 0.38, y + h * 0.78 + breathY);
  ctx.quadraticCurveTo(cx + w * 0.40, y + h * 0.34 + breathY, cx + cupR * 1.10, cupY - cupR * 0.14);
  ctx.lineTo(cx + cupR * 0.64, cupY + cupR * 0.68);
  ctx.lineTo(cx + w * 0.19, y + h * 0.90 + breathY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 杯柄与杯身
  ctx.strokeStyle = PAL.charcoal;
  ctx.lineWidth = Math.max(7, cupR * 0.22);
  ctx.beginPath();
  ctx.arc(cupX + cupR * 0.92, cupY + cupR * 0.05, cupR * 0.36, -Math.PI * 0.45, Math.PI * 0.45);
  ctx.stroke();

  ctx.fillStyle = "#161B1A";
  ctx.beginPath();
  ctx.moveTo(cupX - cupR, cupY - cupR * 0.42);
  ctx.lineTo(cupX + cupR, cupY - cupR * 0.42);
  ctx.quadraticCurveTo(cupX + cupR * 0.96, cupY + cupR * 0.78, cupX, cupY + cupR * 0.84);
  ctx.quadraticCurveTo(cupX - cupR * 0.96, cupY + cupR * 0.78, cupX - cupR, cupY - cupR * 0.42);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#2A312F";
  ctx.beginPath();
  ctx.ellipse(cupX, cupY - cupR * 0.42, cupR, cupR * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0F1312";
  ctx.beginPath();
  ctx.ellipse(cupX, cupY - cupR * 0.40, cupR * 0.86, cupR * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // 左手三指与右拇指
  ctx.fillStyle = PAL.orange;
  ctx.strokeStyle = PAL.charcoal;
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) {
    const fy = cupY - cupR * 0.10 + i * cupR * 0.24;
    drawRoundRect(ctx, cupX - cupR * 1.10, fy, cupR * 0.42, cupR * 0.20, cupR * 0.09);
    ctx.fill();
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(cupX + cupR * 0.74, cupY + cupR * 0.08);
  ctx.rotate(0.45);
  drawRoundRect(ctx, -cupR * 0.48, -cupR * 0.13, cupR * 0.78, cupR * 0.25, cupR * 0.11);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

// 机位退离时绘制无五官暗影后脑与肩背
function drawDetachedObserver(ctx, geom) {
  const { observerRect } = geom;
  if (!observerRect.active) return;

  const { cx, topY, w, h } = observerRect;
  const headR = w * 0.25;
  ctx.save();
  ctx.fillStyle = "#0C0F0F";
  ctx.strokeStyle = PAL.warn;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);

  ctx.beginPath();
  ctx.arc(cx, topY + headR * 1.05, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - w * 0.62, topY + h + 20);
  ctx.quadraticCurveTo(cx - w * 0.56, topY + headR * 2.25, cx - headR * 0.55, topY + headR * 2.15);
  ctx.lineTo(cx + headR * 0.55, topY + headR * 2.15);
  ctx.quadraticCurveTo(cx + w * 0.56, topY + headR * 2.25, cx + w * 0.62, topY + h + 20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.setLineDash([]);
  const tagText = geom.W < 420 ? "背影入画（已退为旁观）" : "角色背影入画（已退为旁观）";
  ctx.font = '600 12px "Noto Sans SC", sans-serif';
  const tw = ctx.measureText(tagText).width + 18;
  const tx = clamp(cx - tw * 0.5, 12, geom.W - tw - 12);
  const ty = clamp(topY + headR * 2.55, 48, geom.H - 86);
  ctx.fillStyle = PAL.warn;
  drawRoundRect(ctx, tx, ty, tw, 24, 4);
  ctx.fill();
  ctx.fillStyle = "#FFF8F0";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tagText, tx + tw * 0.5, ty + 12);
  ctx.restore();
}

// 实时光学标注叠加层（纯门框与视域线，绝不使用任何老套射击标尺元素）
function drawDiagnosticsOverlay(ctx, geom, state) {
  const { W, H, apRect, subjectRect, handsOnScreenRect, rules } = geom;
  const layer = state.focusLayer;

  ctx.save();
  if (layer === "frame" || !rules.frame.ok) {
    ctx.strokeStyle = rules.frame.ok ? PAL.orange : PAL.warn;
    ctx.lineWidth = layer === "frame" ? 2.5 : 1.6;
    ctx.setLineDash([7, 5]);
    ctx.strokeRect(apRect.x + 2, apRect.y + 2, Math.max(0, apRect.w - 4), Math.max(0, apRect.h - 4));
    ctx.setLineDash([]);
  }

  if (layer === "focus" || !rules.focus.ok) {
    ctx.strokeStyle = rules.focus.ok ? PAL.orange : PAL.warn;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    const sx = clamp(subjectRect.x, 4, W - 20);
    const sy = clamp(subjectRect.y, 4, H - 20);
    const sw = clamp(subjectRect.w, 16, W - sx - 4);
    const sh = clamp(subjectRect.h, 16, H - sy - 4);
    ctx.strokeRect(sx, sy, sw, sh);
    ctx.setLineDash([]);

    if (!rules.focus.ok) {
      const msg = rules.focus.kind === "edge_pinch" ? "主体贴压门柱" : `主体仅露 ${geom.metrics.visPct}% · 拖画布转头`;
      ctx.font = '600 12px "Noto Sans SC", sans-serif';
      const mw = ctx.measureText(msg).width + 18;
      const mx = clamp(sx + sw * 0.5 - mw * 0.5, 12, W - mw - 12);
      const my = clamp(sy - 28, 42, H - 36);
      ctx.fillStyle = PAL.warn;
      drawRoundRect(ctx, mx, my, mw, 24, 4);
      ctx.fill();
      ctx.fillStyle = "#FFF8F0";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(msg, mx + mw * 0.5, my + 12);
    }
  }

  if (layer === "immersion" || !rules.anchor.ok) {
    if (rules.anchor.kind === "no_anchor") {
      const hintMsg = W < 440 ? "点此请回「捧杯双手」坐实身体锚" : "点此处请回「前景捧杯双手」坐实身体锚点";
      ctx.font = '600 12px "Noto Sans SC", sans-serif';
      const boxW = Math.min(W - 24, Math.max(196, ctx.measureText(hintMsg).width + 28));
      const boxH = 38;
      const bx = W * 0.5 - boxW * 0.5;
      const by = H - boxH - 12;
      ctx.fillStyle = "rgba(21, 25, 24, 0.84)";
      ctx.strokeStyle = PAL.orangeGlow;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 4]);
      drawRoundRect(ctx, bx, by, boxW, boxH, 6);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = PAL.creamBright;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(hintMsg, W * 0.5, by + boxH * 0.5);
    } else if (handsOnScreenRect.w > 10) {
      ctx.strokeStyle = rules.anchor.ok ? PAL.ok : PAL.warn;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(handsOnScreenRect.x, handsOnScreenRect.y, handsOnScreenRect.w, handsOnScreenRect.h);
      ctx.setLineDash([]);
    }
  }

  if (layer === "info") {
    ctx.fillStyle = "rgba(238, 92, 24, 0.14)";
    ctx.fillRect(0, 0, W, apRect.y);
    ctx.fillRect(0, apRect.y, apRect.x, apRect.h);
    ctx.fillRect(apRect.x + apRect.w, apRect.y, Math.max(0, W - apRect.x - apRect.w), apRect.h);
    ctx.fillRect(0, apRect.y + apRect.h, W, Math.max(0, H - apRect.y - apRect.h));
  }

  // 顶部简洁光学参数条
  const hudText = `POV · ${geom.metrics.focalMm}mm (${geom.metrics.fovDeg}°) · 偏航 ${geom.metrics.yaw > 0 ? "+" : ""}${geom.metrics.yaw}° · 门开 ${geom.metrics.doorOpen}°`;
  ctx.font = '500 11px "IBM Plex Mono", monospace';
  const hudW = ctx.measureText(hudText).width + 20;
  ctx.fillStyle = "rgba(15, 19, 19, 0.80)";
  drawRoundRect(ctx, 12, 12, Math.min(hudW, W - 24), 24, 4);
  ctx.fill();
  ctx.fillStyle = PAL.cream;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(hudText, 22, 24, W - 44);

  const badgeText = `${geom.score}/4 · ${geom.score === 4 ? "入眼成立" : geom.diagnosis.badge.split("·")[1]?.trim() || "待校准"}`;
  ctx.font = '600 11px "Noto Sans SC", sans-serif';
  const bw = ctx.measureText(badgeText).width + 18;
  if (W - bw - 12 > hudW + 20) {
    ctx.fillStyle = geom.score === 4 ? "rgba(19, 107, 82, 0.92)" : "rgba(169, 29, 25, 0.92)";
    drawRoundRect(ctx, W - bw - 12, 12, bw, 24, 4);
    ctx.fill();
    ctx.fillStyle = "#FAF3E6";
    ctx.textAlign = "center";
    ctx.fillText(badgeText, W - bw * 0.5 - 12, 24);
  }
  ctx.restore();
}

function drawBlinkAndMood(ctx, geom, blinkClose) {
  const { W, H, mood } = geom;
  if (mood.vignette > 0.05) {
    ctx.drawImage(getVignetteSprite(mood.vignette), 0, 0, W, H);
  }

  if (blinkClose > 0.005) {
    const lidH = H * 0.54 * blinkClose;
    const curve = H * 0.09 * (1 - blinkClose * 0.7);
    ctx.fillStyle = "#0B0E0E";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, lidH);
    ctx.quadraticCurveTo(W * 0.5, lidH - curve, 0, lidH);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(W, H);
    ctx.lineTo(W, H - lidH);
    ctx.quadraticCurveTo(W * 0.5, H - lidH + curve, 0, H - lidH);
    ctx.closePath();
    ctx.fill();
  }
}

export function mountHeroCanvas(canvas, getState, updateState, onGeom) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let W = 800;
  let H = 560;
  let dpr = 1;
  let lastGeom = null;

  let blinkElapsed = -1;
  let introProgress = 0;

  function syncSize() {
    const rect = canvas.getBoundingClientRect();
    const maxDpr = window.innerWidth <= 600 ? 1.5 : 2;
    dpr = pixelRatio(maxDpr);
    const nextW = Math.max(240, Math.round(rect.width));
    const nextH = Math.max(200, Math.round(rect.height));
    const pw = Math.round(nextW * dpr);
    const ph = Math.round(nextH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      W = nextW;
      H = nextH;
      canvas.width = pw;
      canvas.height = ph;
    }
  }
  syncSize();

  function computeBlink(t, dt, still) {
    let close = 0;
    if (!still && introProgress < 1) {
      introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 1.45);
      close = Math.max(0, (1 - introProgress) * 0.55);
    }
    if (blinkElapsed >= 0) {
      if (still) {
        blinkElapsed = -1;
        return 0;
      }
      blinkElapsed += dt;
      if (blinkElapsed < 0.28) {
        close = Math.max(close, blinkElapsed / 0.28);
      } else if (blinkElapsed < 0.52) {
        close = 1;
      } else if (blinkElapsed < 1.65) {
        const u = (blinkElapsed - 0.52) / 1.13;
        close = Math.max(close, (1 - u) * (1 - u));
      } else {
        blinkElapsed = -1;
      }
    }
    return close;
  }

  function render(t, dt, { still }) {
    const state = getState();
    const geom = computeFrame(state, W, H);
    lastGeom = geom;

    const swayX = still ? 0 : Math.sin(t * geom.mood.swayFreq) * W * geom.mood.swayAmp;
    const swayY = still ? 0 : Math.cos(t * geom.mood.swayFreq * 1.3) * H * geom.mood.swayAmp * 0.7;
    const tiltRad = ((geom.mood.tiltDeg + (still ? 0 : Math.sin(t * 0.9) * (geom.mood.id === "dizzy" ? 1.8 : 0.2))) * Math.PI) / 180;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PAL.charcoal;
    ctx.fillRect(0, 0, W, H);

    if (Math.abs(tiltRad) > 0.001 || Math.abs(swayX) > 0.1) {
      ctx.translate(W * 0.5 + swayX, H * 0.5 + swayY);
      ctx.rotate(tiltRad);
      ctx.translate(-W * 0.5, -H * 0.5);
    }

    if (state.scene === "corridor") drawCorridorOutside(ctx, geom, still ? 0 : t);
    else if (state.scene === "train") drawTrainOutside(ctx, geom, still ? 0 : t);
    else drawCabinOutside(ctx, geom, still ? 0 : t);

    drawDoorwayFrame(ctx, geom, state);
    drawForegroundHands(ctx, geom, state, still ? 0 : t);
    drawDetachedObserver(ctx, geom);
    ctx.restore();

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBlinkAndMood(ctx, geom, computeBlink(t, dt, still));
    drawDiagnosticsOverlay(ctx, geom, state);
    ctx.restore();

    if (onGeom) onGeom(geom);
  }

  const ctrl = loop(canvas, render);
  const ro = new ResizeObserver(() => {
    syncSize();
    ctrl.draw();
  });
  ro.observe(canvas);

  let dragMode = null;
  let startX = 0;
  let startY = 0;
  let startYaw = 0;
  let startPitch = 0;
  let startDoor = 0;
  let moved = false;

  const toLocal = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top, w: r.width, h: r.height };
  };

  function beginDrag(clientX, clientY) {
    const pt = toLocal(clientX, clientY);
    const st = getState();
    const g = lastGeom || computeFrame(st, pt.w, pt.h);
    startX = clientX;
    startY = clientY;
    startYaw = st.yaw;
    startPitch = st.pitch;
    startDoor = st.doorOpen;
    moved = false;

    const hitDoor = g.doorHandle.visible && Math.hypot(pt.x - g.doorHandle.x, pt.y - g.doorHandle.y) < 34;
    dragMode = hitDoor ? "door" : "head";
  }

  function moveDrag(clientX, clientY) {
    if (!dragMode) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    if (Math.hypot(dx, dy) > 4) moved = true;

    if (dragMode === "door") {
      const nextDoor = clamp(startDoor + (dx / Math.max(200, W)) * 145, 10, 112);
      updateState({ doorOpen: Math.round(nextDoor) });
    } else {
      let nextYaw = clamp(startYaw - (dx / Math.max(200, W)) * 96, -45, 45);
      let nextPitch = clamp(startPitch + (dy / Math.max(180, H)) * 42, -18, 18);
      if (Math.abs(nextYaw - 2) < 1.6) nextYaw = 2;
      updateState({ yaw: Math.round(nextYaw), pitch: Math.round(nextPitch) });
    }
  }

  function endDrag(clientX, clientY) {
    if (!dragMode) return;
    const wasMoved = moved;
    dragMode = null;
    if (!wasMoved) {
      const pt = toLocal(clientX, clientY);
      const st = getState();
      const g = lastGeom || computeFrame(st, pt.w, pt.h);
      const inBottomZone = pt.y > pt.h * 0.68;
      const inHands =
        g.handsRect.active &&
        pt.x >= g.handsRect.x &&
        pt.x <= g.handsRect.x + g.handsRect.w &&
        pt.y >= g.handsRect.y &&
        pt.y <= g.handsRect.y + g.handsRect.h;
      if (inBottomZone || inHands) {
        const nextHands = st.handsHeight < 0.08 ? 0.36 : st.handsHeight < 0.62 ? 0.88 : 0;
        updateState({ handsHeight: nextHands });
      }
    }
  }

  let pointerId = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    pointerId = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    beginDrag(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (pointerId !== e.pointerId) return;
    moveDrag(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (pointerId !== e.pointerId) return;
    pointerId = null;
    endDrag(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointercancel", () => {
    pointerId = null;
    dragMode = null;
  });

  let touchLocked = null;
  let lastTouchX = 0;
  let lastTouchY = 0;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const t0 = e.touches[0];
      lastTouchX = t0.clientX;
      lastTouchY = t0.clientY;
      touchLocked = null;
      beginDrag(t0.clientX, t0.clientY);
    },
    { passive: true },
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length !== 1 || !dragMode) return;
      const t0 = e.touches[0];
      lastTouchX = t0.clientX;
      lastTouchY = t0.clientY;
      const dx = Math.abs(t0.clientX - startX);
      const dy = Math.abs(t0.clientY - startY);
      if (touchLocked === null && (dx > 3 || dy > 3)) {
        touchLocked = dragMode === "door" || dx >= dy * 0.65 ? "canvas" : "scroll";
      }
      if (touchLocked === "canvas") {
        e.preventDefault();
        moveDrag(t0.clientX, t0.clientY);
      } else if (touchLocked === "scroll") {
        dragMode = null;
      }
    },
    { passive: false },
  );
  canvas.addEventListener(
    "touchend",
    () => {
      if (touchLocked !== "scroll") endDrag(lastTouchX, lastTouchY);
      touchLocked = null;
      dragMode = null;
    },
    { passive: true },
  );

  canvas.addEventListener("keydown", (e) => {
    const st = getState();
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      updateState({ yaw: clamp(st.yaw - 4, -45, 45) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      updateState({ yaw: clamp(st.yaw + 4, -45, 45) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      updateState({ pitch: clamp(st.pitch - 2, -18, 18) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      updateState({ pitch: clamp(st.pitch + 2, -18, 18) });
    } else if (e.key === "[" || e.key === "-") {
      e.preventDefault();
      updateState({ doorOpen: clamp(st.doorOpen - 6, 10, 112) });
    } else if (e.key === "]" || e.key === "=") {
      e.preventDefault();
      updateState({ doorOpen: clamp(st.doorOpen + 6, 10, 112) });
    }
  });

  function triggerBlink() {
    if (reducedMotion.matches) {
      ctrl.draw();
      return;
    }
    blinkElapsed = 0;
    ctrl.draw();
  }

  return {
    draw: () => ctrl.draw(),
    triggerBlink,
    getGeom: () => lastGeom,
  };
}

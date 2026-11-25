// 三片独立透明画布的矢量绘制引擎（Layer 3 背景 / Layer 2 中景 / Layer 1 前景）。
// 3D WebGL 贴图与 2D 降级画布共用这一套缓存离屏画布，仅在参数变化时重绘，拖拽视角时零重绘开销。

import { PALETTE, mixHex } from "./palette.js";
import { getForegroundBlobs } from "./model.js";

const TEX_W = 960;
const TEX_H = 384;

export function createLayerCanvases() {
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = TEX_W;
    c.height = TEX_H;
    return c;
  };
  return { bg: mk(), mid: mk(), fg: mk(), width: TEX_W, height: TEX_H };
}

// 轻量光学柔化：在离屏缓存重绘时使用，兼容所有浏览器且零拖拽帧开销
function applySoftPass(ctx, blurPx, drawFn) {
  if (blurPx <= 0.1) {
    drawFn(ctx);
    return;
  }
  const b = Math.min(5, blurPx);
  ctx.save();
  try {
    ctx.filter = `blur(${b.toFixed(1)}px)`;
    drawFn(ctx);
  } catch {
    ctx.filter = "none";
    ctx.globalAlpha = 0.72;
    drawFn(ctx);
  }
  ctx.restore();
}

// ---------- LAYER 3：背景（日轮、暖云、远山） ----------
function paintBackgroundLayer(ctx, w, h, state, evalRes, clear = true) {
  const { colors, blur } = evalRes;
  if (clear) ctx.clearRect(0, 0, w, h);

  applySoftPass(ctx, blur.bg, (c) => {
    // 顶部柔和渐变天光（只在背景片铺极薄半透大气膜，保留 3D 玻璃片通透感）
    const skyGrad = c.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, "rgba(244,231,211,0.42)");
    skyGrad.addColorStop(0.65, "rgba(244,231,211,0.18)");
    skyGrad.addColorStop(1, "rgba(244,231,211,0.0)");
    c.fillStyle = skyGrad;
    c.fillRect(0, 0, w, h);

    if (state.scene === "poster") {
      // 原海报同款浅金日轮（右上）
      c.fillStyle = PALETTE.sunDisc;
      c.beginPath();
      c.arc(w * 0.79, h * 0.24, h * 0.145, 0, Math.PI * 2);
      c.fill();

      // 远山主层（最远浅雾蓝山峰，贴合 065 原海报左中右三峰剪影）
      c.fillStyle = colors.bgFar;
      c.beginPath();
      c.moveTo(0, h);
      c.lineTo(0, h * 0.72);
      c.lineTo(w * 0.14, h * 0.62);
      c.lineTo(w * 0.28, h * 0.69);
      c.lineTo(w * 0.49, h * 0.36);
      c.lineTo(w * 0.60, h * 0.50);
      c.lineTo(w * 0.72, h * 0.25);
      c.lineTo(w * 0.84, h * 0.40);
      c.lineTo(w * 0.94, h * 0.20);
      c.lineTo(w, h * 0.28);
      c.lineTo(w, h);
      c.closePath();
      c.fill();

      // 次远山峰层（中雾蓝）
      c.fillStyle = colors.bgNear;
      c.beginPath();
      c.moveTo(w * 0.36, h);
      c.lineTo(w * 0.50, h * 0.66);
      c.lineTo(w * 0.68, h * 0.44);
      c.lineTo(w * 0.80, h * 0.61);
      c.lineTo(w * 0.91, h * 0.36);
      c.lineTo(w, h * 0.48);
      c.lineTo(w, h);
      c.closePath();
      c.fill();

      // 左侧低云带（原海报标志性米黄平底云）
      c.fillStyle = mixHex(PALETTE.cloudWarm, colors.sky, 0.25);
      c.beginPath();
      c.moveTo(w * 0.22, h * 0.55);
      c.lineTo(w * 0.45, h * 0.55);
      c.arc(w * 0.41, h * 0.52, h * 0.055, 0, Math.PI, true);
      c.arc(w * 0.34, h * 0.48, h * 0.075, 0, Math.PI, true);
      c.arc(w * 0.27, h * 0.52, h * 0.05, 0, Math.PI, true);
      c.closePath();
      c.fill();
    } else if (state.scene === "boat") {
      // 林径孤舟：低垂淡日 + 远岸柔和层峦
      c.fillStyle = PALETTE.sunDisc;
      c.beginPath();
      c.arc(w * 0.68, h * 0.30, h * 0.16, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = colors.bgFar;
      c.beginPath();
      c.moveTo(0, h * 0.68);
      c.quadraticCurveTo(w * 0.18, h * 0.34, w * 0.36, h * 0.54);
      c.quadraticCurveTo(w * 0.54, h * 0.26, w * 0.72, h * 0.52);
      c.quadraticCurveTo(w * 0.88, h * 0.32, w, h * 0.46);
      c.lineTo(w, h);
      c.lineTo(0, h);
      c.closePath();
      c.fill();

      c.fillStyle = colors.bgNear;
      c.beginPath();
      c.moveTo(0, h * 0.72);
      c.quadraticCurveTo(w * 0.25, h * 0.48, w * 0.50, h * 0.64);
      c.quadraticCurveTo(w * 0.76, h * 0.42, w, h * 0.60);
      c.lineTo(w, h);
      c.lineTo(0, h);
      c.closePath();
      c.fill();

      // 湖面远水微光
      c.fillStyle = mixHex(colors.bgFar, colors.sky, 0.45);
      c.fillRect(0, h * 0.68, w, h * 0.32);
    } else {
      // 街巷灯影：远处暮色塔楼剪影与柔和天际
      c.fillStyle = PALETTE.sunDisc;
      c.beginPath();
      c.arc(w * 0.52, h * 0.30, h * 0.15, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = colors.bgFar;
      c.beginPath();
      c.moveTo(0, h);
      c.lineTo(0, h * 0.58);
      c.lineTo(w * 0.16, h * 0.58);
      c.lineTo(w * 0.16, h * 0.44);
      c.lineTo(w * 0.26, h * 0.44);
      c.lineTo(w * 0.26, h * 0.54);
      c.lineTo(w * 0.45, h * 0.54);
      c.lineTo(w * 0.47, h * 0.22);
      c.lineTo(w * 0.53, h * 0.15);
      c.lineTo(w * 0.59, h * 0.22);
      c.lineTo(w * 0.61, h * 0.52);
      c.lineTo(w * 0.78, h * 0.52);
      c.lineTo(w * 0.78, h * 0.40);
      c.lineTo(w * 0.90, h * 0.40);
      c.lineTo(w * 0.90, h * 0.56);
      c.lineTo(w, h * 0.56);
      c.lineTo(w, h);
      c.closePath();
      c.fill();

      // 次远屋脊轮廓
      c.fillStyle = colors.bgNear;
      c.beginPath();
      c.moveTo(0, h);
      c.lineTo(0, h * 0.64);
      c.lineTo(w * 0.32, h * 0.64);
      c.lineTo(w * 0.36, h * 0.54);
      c.lineTo(w * 0.64, h * 0.54);
      c.lineTo(w * 0.68, h * 0.64);
      c.lineTo(w, h * 0.64);
      c.lineTo(w, h);
      c.closePath();
      c.fill();
    }
  });
}

// ---------- LAYER 2：中景（核心叙事主体） ----------
function paintMidgroundLayer(ctx, w, h, state, evalRes, clear = true) {
  const { colors, blur } = evalRes;
  if (clear) ctx.clearRect(0, 0, w, h);

  applySoftPass(ctx, blur.mid, (c) => {
    if (state.scene === "poster") {
      // 右侧钢青蓝圆树群（呼应 065 原海报右侧大蓝树冠）
      c.fillStyle = mixHex(colors.midLight, colors.bgNear, 0.18);
      c.beginPath();
      c.ellipse(w * 0.95, h * 0.58, w * 0.08, h * 0.24, 0, 0, Math.PI * 2);
      c.ellipse(w * 0.87, h * 0.65, w * 0.06, h * 0.16, 0, 0, Math.PI * 2);
      c.fill();

      // 中景后坡（中钢青蓝）
      c.fillStyle = colors.midLight;
      c.beginPath();
      c.moveTo(0, h);
      c.lineTo(0, h * 0.72);
      c.quadraticCurveTo(w * 0.34, h * 0.56, w * 0.62, h * 0.74);
      c.quadraticCurveTo(w * 0.80, h * 0.64, w, h * 0.72);
      c.lineTo(w, h);
      c.closePath();
      c.fill();

      // 原海报标志性两棵圆树（一大一小，偏中左）
      const drawTree = (tx, ty, r, trunkH) => {
        c.fillStyle = colors.midDeep;
        c.fillRect(tx - r * 0.11, ty, r * 0.22, trunkH);
        c.fillStyle = colors.midTree;
        c.beginPath();
        c.arc(tx, ty, r, 0, Math.PI * 2);
        c.fill();
      };
      drawTree(w * 0.505, h * 0.555, h * 0.105, h * 0.18);
      drawTree(w * 0.57, h * 0.635, h * 0.062, h * 0.12);

      // 原海报标志性山居小屋（暖米墙 + 钢青屋顶 + 拱形门洞 + 侧窗）
      const hx = w * 0.725;
      const hy = h * 0.60;
      const hw = w * 0.082;
      const hh = h * 0.145;
      // 侧小附屋
      c.fillStyle = mixHex(PALETTE.houseWall, colors.midLight, 0.16);
      c.fillRect(hx - hw * 0.42, hy + hh * 0.34, hw * 0.45, hh * 0.66);
      c.fillStyle = colors.midDeep;
      c.beginPath();
      c.moveTo(hx - hw * 0.48, hy + hh * 0.36);
      c.lineTo(hx - hw * 0.20, hy + hh * 0.16);
      c.lineTo(hx + hw * 0.06, hy + hh * 0.36);
      c.closePath();
      c.fill();
      // 主屋体
      c.fillStyle = PALETTE.houseWall;
      c.fillRect(hx, hy, hw, hh);
      // 屋顶
      c.fillStyle = PALETTE.houseRoof;
      c.beginPath();
      c.moveTo(hx - hw * 0.10, hy + 2);
      c.lineTo(hx + hw * 0.50, hy - hh * 0.46);
      c.lineTo(hx + hw * 1.10, hy + 2);
      c.closePath();
      c.fill();
      // 拱门（无五官纯建筑形体）
      c.fillStyle = colors.midDeep;
      c.beginPath();
      c.roundRect(hx + hw * 0.38, hy + hh * 0.36, hw * 0.26, hh * 0.64, [12, 12, 0, 0]);
      c.fill();

      // 中景前坡（深钢蓝，与后坡形成中景内部层次）
      c.fillStyle = colors.midDeep;
      c.beginPath();
      c.moveTo(0, h);
      c.lineTo(0, h * 0.80);
      c.quadraticCurveTo(w * 0.28, h * 0.68, w * 0.54, h * 0.82);
      c.quadraticCurveTo(w * 0.76, h * 0.72, w, h * 0.80);
      c.lineTo(w, h);
      c.closePath();
      c.fill();

      // 蜿蜒暖沙小径（从前中景交界处自然引向山居小屋）
      c.fillStyle = PALETTE.pathSand;
      c.beginPath();
      c.moveTo(w * 0.36, h);
      c.quadraticCurveTo(w * 0.52, h * 0.88, w * 0.66, h * 0.82);
      c.quadraticCurveTo(w * 0.74, h * 0.79, w * 0.77, h * 0.76);
      c.lineTo(w * 0.79, h * 0.78);
      c.quadraticCurveTo(w * 0.70, h * 0.85, w * 0.64, h);
      c.closePath();
      c.fill();
    } else if (state.scene === "boat") {
      // 中景湖水与微波
      c.fillStyle = mixHex(colors.midLight, colors.sky, 0.22);
      c.fillRect(0, h * 0.66, w, h * 0.34);

      // 中景岛屿与孤松
      c.fillStyle = colors.midLight;
      c.beginPath();
      c.moveTo(w * 0.08, h * 0.68);
      c.quadraticCurveTo(w * 0.24, h * 0.54, w * 0.42, h * 0.68);
      c.closePath();
      c.fill();

      // 湖面水波纹理
      c.strokeStyle = PALETTE.pathSand;
      c.lineWidth = 2.5;
      for (const [rx, ry, rw] of [[0.42, 0.74, 0.14], [0.56, 0.79, 0.20], [0.35, 0.85, 0.16], [0.60, 0.90, 0.18]]) {
        c.beginPath();
        c.moveTo(w * rx, h * ry);
        c.lineTo(w * (rx + rw), h * ry);
        c.stroke();
      }

      // 核心主体：木舟与无五官背影船夫（遵循无五官剪影规矩）
      const bx = w * 0.53;
      const by = h * 0.77;
      // 船身
      c.fillStyle = colors.midDeep;
      c.beginPath();
      c.moveTo(bx - w * 0.12, by - h * 0.03);
      c.quadraticCurveTo(bx, by + h * 0.09, bx + w * 0.13, by - h * 0.04);
      c.lineTo(bx + w * 0.09, by + h * 0.06);
      c.quadraticCurveTo(bx, by + h * 0.11, bx - w * 0.09, by + h * 0.05);
      c.closePath();
      c.fill();
      // 船舱暖色蓬顶
      c.fillStyle = PALETTE.houseWall;
      c.beginPath();
      c.arc(bx - w * 0.015, by - h * 0.025, h * 0.075, Math.PI, 0);
      c.closePath();
      c.fill();
      // 船尾戴笠背影剪影（无五官）
      c.fillStyle = colors.midDeep;
      c.beginPath();
      c.ellipse(bx + w * 0.055, by - h * 0.06, w * 0.016, h * 0.055, 0, 0, Math.PI * 2);
      c.fill();
      // 斗笠轮廓
      c.fillStyle = PALETTE.pathSand;
      c.beginPath();
      c.moveTo(bx + w * 0.028, by - h * 0.105);
      c.lineTo(bx + w * 0.055, by - h * 0.155);
      c.lineTo(bx + w * 0.082, by - h * 0.105);
      c.closePath();
      c.fill();
      // 船桨斜线
      c.strokeStyle = colors.midDeep;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(bx + w * 0.06, by - h * 0.07);
      c.lineTo(bx + w * 0.115, by + h * 0.08);
      c.stroke();
    } else {
      // 街巷灯影：左右中景街屋 + 青石路 + 暖灯 + 无五官行人背影
      c.fillStyle = colors.midLight;
      c.fillRect(w * 0.14, h * 0.34, w * 0.20, h * 0.66);
      c.fillRect(w * 0.66, h * 0.32, w * 0.22, h * 0.68);
      c.fillStyle = colors.midDeep;
      c.fillRect(w * 0.24, h * 0.42, w * 0.12, h * 0.58);
      c.fillRect(w * 0.64, h * 0.40, w * 0.12, h * 0.60);

      // 巷道石板路
      c.fillStyle = PALETTE.pathSand;
      c.beginPath();
      c.moveTo(w * 0.30, h);
      c.lineTo(w * 0.44, h * 0.66);
      c.lineTo(w * 0.58, h * 0.66);
      c.lineTo(w * 0.72, h);
      c.closePath();
      c.fill();

      // 暖光灯笼与窗格
      c.fillStyle = PALETTE.sunDisc;
      for (const [lx, ly, lr] of [[0.38, 0.54, 13], [0.62, 0.52, 13], [0.43, 0.60, 8], [0.58, 0.59, 8]]) {
        c.beginPath();
        c.arc(w * lx, h * ly, lr, 0, Math.PI * 2);
        c.fill();
      }
      // 无五官行人背影剪影（大衣+头廓）
      const px = w * 0.51;
      const py = h * 0.73;
      c.fillStyle = colors.midDeep;
      c.beginPath();
      c.arc(px, py - h * 0.075, h * 0.032, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.moveTo(px - w * 0.020, py - h * 0.04);
      c.lineTo(px + w * 0.020, py - h * 0.04);
      c.lineTo(px + w * 0.028, py + h * 0.14);
      c.lineTo(px - w * 0.028, py + h * 0.14);
      c.closePath();
      c.fill();
    }
  });
}

// ---------- LAYER 1：前景（读取与 model.js 完全同源的 blob 包络） ----------
function drawLeafFan(c, cx, cy, rx, ry, colDark, colMid) {
  // 仿 065 原海报扇形舒展大松叶与阔叶脉，叶片错落有致落在椭圆包络内
  const count = 8;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const angle = -Math.PI * 0.94 + t * Math.PI * 0.88;
    const len = 0.74 + (i % 3 === 0 ? 0.24 : i % 2 === 0 ? 0.14 : 0.05);
    const tipX = cx + Math.cos(angle) * rx * len;
    const tipY = cy + Math.sin(angle) * ry * len;
    const perp = angle + Math.PI / 2;
    const wLeaf = Math.min(rx, ry) * (0.145 + (i % 2) * 0.045);

    c.fillStyle = i % 2 === 0 ? colDark : colMid;
    c.beginPath();
    c.moveTo(cx, cy);
    c.quadraticCurveTo(
      (cx + tipX) * 0.52 + Math.cos(perp) * wLeaf,
      (cy + tipY) * 0.52 + Math.sin(perp) * wLeaf,
      tipX,
      tipY
    );
    c.quadraticCurveTo(
      (cx + tipX) * 0.48 - Math.cos(perp) * wLeaf,
      (cy + tipY) * 0.48 - Math.sin(perp) * wLeaf,
      cx,
      cy
    );
    c.closePath();
    c.fill();

    // 淡松青中肋叶脉，让前景在暗底上显出清晰的近景细节（呼应海报「细节清晰」）
    c.strokeStyle = "rgba(235, 221, 196, 0.16)";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(cx + Math.cos(angle) * rx * 0.18, cy + Math.sin(angle) * ry * 0.18);
    c.lineTo(cx + Math.cos(angle) * rx * (len * 0.82), cy + Math.sin(angle) * ry * (len * 0.82));
    c.stroke();
  }
  // 根部圆润暗基
  c.fillStyle = colDark;
  c.beginPath();
  c.ellipse(cx, cy, rx * 0.54, ry * 0.42, 0, Math.PI, 0);
  c.fill();
}

function drawBushCluster(c, cx, cy, rx, ry, colDark, colMid) {
  c.fillStyle = colMid;
  c.beginPath();
  c.ellipse(cx - rx * 0.28, cy - ry * 0.20, rx * 0.62, ry * 0.72, 0, 0, Math.PI * 2);
  c.ellipse(cx + rx * 0.24, cy - ry * 0.14, rx * 0.64, ry * 0.74, 0, 0, Math.PI * 2);
  c.fill();

  // 点缀两三片探出灌木顶缘的叶片轮廓
  c.fillStyle = colMid;
  for (const ang of [-Math.PI * 0.68, -Math.PI * 0.46, -Math.PI * 0.30]) {
    const tx = cx + Math.cos(ang) * rx * 0.92;
    const ty = cy + Math.sin(ang) * ry * 0.98;
    c.beginPath();
    c.moveTo(cx + Math.cos(ang) * rx * 0.3, cy + Math.sin(ang) * ry * 0.3);
    c.quadraticCurveTo(tx - 12, ty + 14, tx, ty);
    c.quadraticCurveTo(tx + 12, ty + 18, cx + Math.cos(ang) * rx * 0.35, cy + Math.sin(ang) * ry * 0.35);
    c.fill();
  }

  c.fillStyle = colDark;
  c.beginPath();
  c.ellipse(cx, cy, rx * 0.88, ry * 0.82, 0, 0, Math.PI * 2);
  c.fill();
}

function drawArchColumn(c, cx, cy, rx, ry, colDark, colMid) {
  // 街巷场景近景石柱与暗檐
  c.fillStyle = colDark;
  c.fillRect(cx - rx * 0.78, cy - ry * 1.15, rx * 1.56, ry * 1.35);
  c.fillStyle = colMid;
  c.fillRect(cx - rx * 0.86, cy - ry * 1.15, rx * 1.72, ry * 0.18);
}

function paintForegroundLayer(ctx, w, h, state, evalRes, clear = true) {
  const { colors, blur } = evalRes;
  const blobs = getForegroundBlobs(state);
  if (clear) ctx.clearRect(0, 0, w, h);
  if (!blobs.length) return;

  applySoftPass(ctx, blur.fg, (c) => {
    for (const b of blobs) {
      const cx = b.cx * w;
      const cy = b.cy * h;
      const rx = b.rx * w;
      const ry = b.ry * h;
      if (state.scene === "alley") {
        drawArchColumn(c, cx, cy, rx, ry, colors.fgDeep, colors.fgMid);
      } else if (b.kind === "fan") {
        drawLeafFan(c, cx, cy, rx, ry, colors.fgDeep, colors.fgMid);
      } else {
        drawBushCluster(c, cx, cy, rx, ry, colors.fgDeep, colors.fgMid);
      }
    }
  });
}

// 刷新三片缓存画布
export function updateLayerCanvases(canvases, state, evalRes) {
  const { width: w, height: h } = canvases;
  paintBackgroundLayer(canvases.bg.getContext("2d"), w, h, state, evalRes, true);
  paintMidgroundLayer(canvases.mid.getContext("2d"), w, h, state, evalRes, true);
  paintForegroundLayer(canvases.fg.getContext("2d"), w, h, state, evalRes, true);
}

// 供各节小图（01 剥洋葱、02 光学台、06 单变量练习）直接绘制三层小场景（绝不互相 clearRect 擦除！）
export function drawCompositeThumbnail(ctx, w, h, opts) {
  const {
    showFg = true,
    showMid = true,
    showBg = true,
    fgHex = PALETTE.fgLeafDark,
    fgMidHex = PALETTE.fgLeafMid,
    midDeepHex = PALETTE.midHillDeep,
    midLightHex = PALETTE.midHillLight,
    bgNearHex = PALETTE.bgPeakNear,
    bgFarHex = PALETTE.bgPeakFar,
    skyHex = PALETTE.creamTop,
    fgScale = 0.44,
    fgLayout = "flank",
    blurFg = 0,
    blurMid = 0,
    blurBg = 0,
  } = opts;

  ctx.save();
  ctx.fillStyle = skyHex;
  ctx.fillRect(0, 0, w, h);

  const mockState = { scene: "poster", fgScale, fgLayout };
  const mockColors = {
    sky: skyHex,
    fgDeep: fgHex,
    fgMid: fgMidHex,
    midDeep: midDeepHex,
    midLight: midLightHex,
    midTree: mixHex(midLightHex, midDeepHex, 0.25),
    bgNear: bgNearHex,
    bgFar: bgFarHex,
  };

  if (showBg) {
    paintBackgroundLayer(ctx, w, h, mockState, { colors: mockColors, blur: { bg: blurBg } }, false);
  }
  if (showMid) {
    paintMidgroundLayer(ctx, w, h, mockState, { colors: mockColors, blur: { mid: blurMid } }, false);
  }
  if (showFg) {
    paintForegroundLayer(ctx, w, h, mockState, { colors: mockColors, blur: { fg: blurFg } }, false);
  }
  ctx.restore();
}

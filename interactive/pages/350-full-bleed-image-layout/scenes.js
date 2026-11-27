// 350 全图页离屏风景绘制与真像素亮度缓冲引擎
// 仅在场景/光影变化时重绘离屏底片（960×540）并生成 96×54 像素亮度采样表
// 拖动期间零 GPU 读回、每帧仅一次 drawImage + 轻量矢量叠层，确保慢手机与软件渲染稳定 60fps

import { SCENES, clamp } from "./model.js";

const PLATE_W = 960;
const PLATE_H = 540;
const LUM_W = 96;
const LUM_H = 54;

const cache = new Map();

function createOffscreen(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

// 场景 1：暮谷巨日（1:1 呼应 350 原海报的暮夜深空、洋红巨日、钴蓝群山与荧光 S 河道）
function paintValley(ctx, w, h, lighting) {
  const isFlat = lighting === "flat";
  const isWashed = lighting === "washed";

  // 1. 暮夜深空渐变（右上藏深海天青辉光）
  const sky = ctx.createLinearGradient(0, 0, w * 0.95, h * 0.65);
  if (isWashed) {
    sky.addColorStop(0, "#4E627A");
    sky.addColorStop(0.55, "#6C89A8");
    sky.addColorStop(1, "#8EB8D4");
  } else if (isFlat) {
    sky.addColorStop(0, "#1C293B");
    sky.addColorStop(0.55, "#23405E");
    sky.addColorStop(1, "#2A6084");
  } else {
    sky.addColorStop(0, "#00040A");
    sky.addColorStop(0.45, "#010D22");
    sky.addColorStop(0.82, "#012D58");
    sky.addColorStop(1, "#004E8C");
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // 微妙星尘（只在深邃聚焦光影下显现）
  if (!isWashed) {
    ctx.fillStyle = isFlat ? "rgba(210,226,245,0.16)" : "rgba(220,236,255,0.28)";
    const stars = [
      [0.08, 0.11, 1.2], [0.16, 0.07, 1.0], [0.24, 0.16, 1.3], [0.33, 0.08, 1.1],
      [0.42, 0.13, 1.0], [0.87, 0.09, 1.4], [0.92, 0.18, 1.1], [0.12, 0.27, 1.0],
    ];
    for (const [sx, sy, r] of stars) {
      ctx.beginPath();
      ctx.arc(sx * w, sy * h, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. 巨日外围大气光晕
  const sunX = w * 0.67;
  const sunY = h * 0.38;
  const sunR = h * 0.305;
  const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.4, sunX, sunY, sunR * 2.15);
  if (isWashed) {
    halo.addColorStop(0, "rgba(255, 198, 210, 0.72)");
    halo.addColorStop(0.5, "rgba(244, 150, 185, 0.25)");
    halo.addColorStop(1, "rgba(120, 160, 200, 0)");
  } else if (isFlat) {
    halo.addColorStop(0, "rgba(226, 118, 162, 0.38)");
    halo.addColorStop(0.55, "rgba(165, 86, 148, 0.12)");
    halo.addColorStop(1, "rgba(10, 25, 48, 0)");
  } else {
    halo.addColorStop(0, "rgba(254, 115, 165, 0.56)");
    halo.addColorStop(0.45, "rgba(218, 62, 142, 0.22)");
    halo.addColorStop(1, "rgba(1, 20, 50, 0)");
  }
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);

  // 3. 原海报招牌霓虹洋红—暖珊瑚巨日圆盘
  const orb = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
  if (isWashed) {
    orb.addColorStop(0, "#D99EC4");
    orb.addColorStop(0.5, "#F9A9C5");
    orb.addColorStop(1, "#FFE0DA");
  } else if (isFlat) {
    orb.addColorStop(0, "#8E5888");
    orb.addColorStop(0.5, "#C96A93");
    orb.addColorStop(1, "#DDA2AA");
  } else {
    orb.addColorStop(0, "#9E4193");
    orb.addColorStop(0.42, "#ED418D");
    orb.addColorStop(0.78, "#FE6D97");
    orb.addColorStop(1, "#FEA1A9");
  }
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fillStyle = orb;
  ctx.fill();

  // 4. 远景薄雾山脊与谷口粉霞（两端透明渐变，彻底杜绝横切接缝）
  const mist = ctx.createLinearGradient(0, h * 0.34, 0, h * 0.66);
  mist.addColorStop(0, "rgba(248, 146, 184, 0)");
  mist.addColorStop(0.55, isWashed ? "rgba(255,214,218,0.42)" : isFlat ? "rgba(168,142,175,0.20)" : "rgba(248,146,184,0.30)");
  mist.addColorStop(1, "rgba(18, 62, 118, 0)");
  ctx.fillStyle = mist;
  ctx.fillRect(0, h * 0.34, w, h * 0.32);

  // 远山剪影（居中低谷通道）
  ctx.beginPath();
  ctx.moveTo(0, h * 0.56);
  ctx.lineTo(w * 0.22, h * 0.43);
  ctx.lineTo(w * 0.39, h * 0.50);
  ctx.lineTo(w * 0.53, h * 0.585);
  ctx.lineTo(w * 0.65, h * 0.52);
  ctx.lineTo(w * 0.81, h * 0.41);
  ctx.lineTo(w, h * 0.49);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = isWashed ? "#5E7C9F" : isFlat ? "#234066" : "#073570";
  ctx.fill();

  // 5. 左侧多面几何山脊（主暗面 + 粉光受光面，复刻 350 原海报折面感）
  // 左侧大主峰暗面
  ctx.beginPath();
  ctx.moveTo(0, h * 0.44);
  ctx.lineTo(w * 0.24, h * 0.49);
  ctx.lineTo(w * 0.37, h * 0.455);
  ctx.lineTo(w * 0.49, h * 0.59);
  ctx.lineTo(w * 0.32, h * 0.66);
  ctx.lineTo(0, h * 0.68);
  ctx.closePath();
  const lm = ctx.createLinearGradient(0, h * 0.44, w * 0.45, h * 0.66);
  lm.addColorStop(0, isWashed ? "#4F6B8D" : isFlat ? "#1E385B" : "#022A5D");
  lm.addColorStop(1, isWashed ? "#6888AB" : isFlat ? "#294D77" : "#03427E");
  ctx.fillStyle = lm;
  ctx.fill();

  // 左侧山峰受光桃粉折面
  ctx.beginPath();
  ctx.moveTo(w * 0.37, h * 0.455);
  ctx.lineTo(w * 0.425, h * 0.535);
  ctx.lineTo(w * 0.50, h * 0.59);
  ctx.lineTo(w * 0.40, h * 0.555);
  ctx.closePath();
  ctx.fillStyle = isWashed ? "#F8B9CA" : isFlat ? "#B27A9C" : "#F37BA4";
  ctx.fill();

  // 右侧多面高耸山脊（面朝巨日受紫红亮边 + 背面钴蓝深影）
  ctx.beginPath();
  ctx.moveTo(w * 0.56, h * 0.585);
  ctx.lineTo(w * 0.72, h * 0.445);
  ctx.lineTo(w * 0.84, h * 0.405);
  ctx.lineTo(w, h * 0.30);
  ctx.lineTo(w, h * 0.76);
  ctx.lineTo(w * 0.62, h * 0.66);
  ctx.closePath();
  const rm = ctx.createLinearGradient(w * 0.62, h * 0.36, w, h * 0.74);
  rm.addColorStop(0, isWashed ? "#607DA2" : isFlat ? "#213B5E" : "#032E66");
  rm.addColorStop(1, isWashed ? "#3E5470" : isFlat ? "#16253A" : "#001029");
  ctx.fillStyle = rm;
  ctx.fill();

  // 右侧受光霓虹粉棱线
  ctx.beginPath();
  ctx.moveTo(w * 0.56, h * 0.585);
  ctx.lineTo(w * 0.715, h * 0.45);
  ctx.lineTo(w * 0.74, h * 0.485);
  ctx.lineTo(w * 0.635, h * 0.575);
  ctx.closePath();
  ctx.fillStyle = isWashed ? "#F5B5CA" : isFlat ? "#A36B93" : "#DE5DA2";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(w * 0.84, h * 0.405);
  ctx.lineTo(w * 0.915, h * 0.35);
  ctx.lineTo(w * 0.875, h * 0.445);
  ctx.lineTo(w * 0.815, h * 0.455);
  ctx.closePath();
  ctx.fillStyle = isWashed ? "#ECA7C6" : isFlat ? "#945E8C" : "#C952A0";
  ctx.fill();

  // 6. 水域底床（深海钴蓝 → 午夜黑蓝）
  const water = ctx.createLinearGradient(0, h * 0.58, 0, h);
  if (isWashed) {
    water.addColorStop(0, "#4B6E94");
    water.addColorStop(0.5, "#375274");
    water.addColorStop(1, "#2A3F5D");
  } else if (isFlat) {
    water.addColorStop(0, "#1A375B");
    water.addColorStop(0.5, "#152946");
    water.addColorStop(1, "#122036");
  } else {
    water.addColorStop(0, "#053B75");
    water.addColorStop(0.45, "#011B42");
    water.addColorStop(1, "#000B1E");
  }
  ctx.fillStyle = water;
  ctx.fillRect(0, h * 0.585, w, h * 0.415);

  // 7. 招牌荧光 S 形倒影河道（把视线从底边一路牵引到谷口巨日）
  ctx.save();
  // 外层柔和青蓝水带
  ctx.beginPath();
  ctx.moveTo(w * 0.505, h * 0.585);
  ctx.bezierCurveTo(w * 0.58, h * 0.62, w * 0.43, h * 0.67, w * 0.49, h * 0.74);
  ctx.bezierCurveTo(w * 0.55, h * 0.82, w * 0.31, h * 0.89, w * 0.18, h);
  ctx.lineTo(w * 0.83, h);
  ctx.bezierCurveTo(w * 0.72, h * 0.89, w * 0.78, h * 0.79, w * 0.72, h * 0.71);
  ctx.bezierCurveTo(w * 0.66, h * 0.64, w * 0.64, h * 0.61, w * 0.60, h * 0.585);
  ctx.closePath();
  const rOuter = ctx.createLinearGradient(w * 0.55, h * 0.58, w * 0.55, h);
  rOuter.addColorStop(0, isWashed ? "#8FB4D8" : isFlat ? "#365B88" : "#226AB2");
  rOuter.addColorStop(0.5, isWashed ? "#6889B2" : isFlat ? "#25446B" : "#15468B");
  rOuter.addColorStop(1, isWashed ? "#4E6A92" : isFlat ? "#1E3454" : "#0A2861");
  ctx.fillStyle = rOuter;
  ctx.fill();

  // 中核霓虹粉红—洋红倒影主河
  ctx.beginPath();
  ctx.moveTo(w * 0.535, h * 0.585);
  ctx.bezierCurveTo(w * 0.60, h * 0.62, w * 0.47, h * 0.665, w * 0.55, h * 0.73);
  ctx.bezierCurveTo(w * 0.64, h * 0.80, w * 0.48, h * 0.88, w * 0.39, h);
  ctx.lineTo(w * 0.64, h);
  ctx.bezierCurveTo(w * 0.73, h * 0.87, w * 0.75, h * 0.78, w * 0.67, h * 0.70);
  ctx.bezierCurveTo(w * 0.60, h * 0.635, w * 0.62, h * 0.61, w * 0.58, h * 0.585);
  ctx.closePath();
  const rCore = ctx.createLinearGradient(w * 0.56, h * 0.585, w * 0.56, h);
  if (isWashed) {
    rCore.addColorStop(0, "#FFD7DC");
    rCore.addColorStop(0.45, "#F6A8C4");
    rCore.addColorStop(1, "#B884B5");
  } else if (isFlat) {
    rCore.addColorStop(0, "#D488A2");
    rCore.addColorStop(0.5, "#A3588E");
    rCore.addColorStop(1, "#6C457A");
  } else {
    rCore.addColorStop(0, "#FF9EB2");
    rCore.addColorStop(0.32, "#FD598D");
    rCore.addColorStop(0.7, "#C8409A");
    rCore.addColorStop(1, "#5C3A92");
  }
  ctx.fillStyle = rCore;
  ctx.fill();

  // 河面高光水波细线
  ctx.strokeStyle = isWashed ? "rgba(255,245,248,0.5)" : "rgba(255, 200, 218, 0.38)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const yy = h * (0.61 + i * 0.042);
    const xx = w * (0.56 + Math.sin(i * 1.15) * 0.055);
    const len = w * (0.04 + i * 0.008);
    ctx.beginPath();
    ctx.moveTo(xx - len / 2, yy);
    ctx.lineTo(xx + len / 2, yy);
    ctx.stroke();
  }
  ctx.restore();

  // 8. 前景左右深暗岬角剪影（自然压暗前景，托举视觉深度）
  ctx.fillStyle = isWashed ? "#344963" : isFlat ? "#132236" : "#000B1C";
  // 左前景岩岸
  ctx.beginPath();
  ctx.moveTo(0, h * 0.53);
  ctx.lineTo(w * 0.32, h * 0.65);
  ctx.lineTo(w * 0.45, h * 0.68);
  ctx.lineTo(w * 0.26, h * 0.74);
  ctx.lineTo(0, h * 0.81);
  ctx.closePath();
  ctx.fill();
  // 右前景岩岸
  ctx.beginPath();
  ctx.moveTo(w, h * 0.49);
  ctx.lineTo(w * 0.74, h * 0.635);
  ctx.lineTo(w * 0.66, h * 0.66);
  ctx.lineTo(w * 0.86, h * 0.76);
  ctx.lineTo(w, h * 0.84);
  ctx.closePath();
  ctx.fill();

  // 9. 边缘干扰杂物（位于最外圈 6% 边带：未裁切时露出，放大至 >= 107% 时彻底裁掉！）
  drawEdgeClutter(ctx, w, h, "valley");

  // 10. 聚焦暗角（guided 模式下强化左上暗区呼吸空间与中心光彩）
  if (lighting === "guided") {
    const vig = ctx.createRadialGradient(w * 0.64, h * 0.48, h * 0.16, w * 0.55, h * 0.50, w * 0.72);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(0.65, "rgba(0,5,16,0.16)");
    vig.addColorStop(1, "rgba(0,3,10,0.62)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  } else if (isWashed) {
    ctx.fillStyle = "rgba(232, 240, 248, 0.24)";
    ctx.fillRect(0, 0, w, h);
  }
}

// 场景 2：晨雾独舟（极简海岸）
function paintHarbor(ctx, w, h, lighting) {
  const isFlat = lighting === "flat";
  const isWashed = lighting === "washed";

  // 蓝调晨空
  const sky = ctx.createLinearGradient(0, 0, w, h * 0.58);
  if (isWashed) {
    sky.addColorStop(0, "#6E859E");
    sky.addColorStop(0.55, "#9BB3C9");
    sky.addColorStop(1, "#F6D4BF");
  } else if (isFlat) {
    sky.addColorStop(0, "#273A50");
    sky.addColorStop(0.6, "#4D6984");
    sky.addColorStop(1, "#9B8379");
  } else {
    sky.addColorStop(0, "#050E1E");
    sky.addColorStop(0.48, "#0F2B4C");
    sky.addColorStop(0.82, "#2E6A8E");
    sky.addColorStop(1, "#E88A7A");
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.58);

  // 右侧晨光太阳薄晕
  const sunX = w * 0.78;
  const sunY = h * 0.51;
  const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, w * 0.36);
  glow.addColorStop(0, isWashed ? "rgba(255,244,230,0.9)" : isFlat ? "rgba(235,190,165,0.45)" : "rgba(255,204,174,0.88)");
  glow.addColorStop(0.45, isFlat ? "rgba(180,120,130,0.16)" : "rgba(238,118,136,0.34)");
  glow.addColorStop(1, "rgba(15,40,70,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h * 0.75);

  // 远山薄影
  ctx.beginPath();
  ctx.moveTo(0, h * 0.56);
  ctx.lineTo(w * 0.18, h * 0.50);
  ctx.lineTo(w * 0.42, h * 0.545);
  ctx.lineTo(w * 0.62, h * 0.56);
  ctx.lineTo(w * 0.85, h * 0.52);
  ctx.lineTo(w, h * 0.545);
  ctx.lineTo(w, h * 0.58);
  ctx.lineTo(0, h * 0.58);
  ctx.closePath();
  ctx.fillStyle = isWashed ? "#7A94AE" : isFlat ? "#2E4660" : "#103255";
  ctx.fill();

  // 静谧海面
  const sea = ctx.createLinearGradient(0, h * 0.56, 0, h);
  if (isWashed) {
    sea.addColorStop(0, "#8DA8C2");
    sea.addColorStop(1, "#4E6884");
  } else if (isFlat) {
    sea.addColorStop(0, "#2E4C6A");
    sea.addColorStop(1, "#18283B");
  } else {
    sea.addColorStop(0, "#1C4F78");
    sea.addColorStop(0.45, "#0B2444");
    sea.addColorStop(1, "#030B18");
  }
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.56, w, h * 0.44);

  // 海面日出光道（引导线直通独舟）
  const refl = ctx.createLinearGradient(w * 0.78, h * 0.56, w * 0.62, h * 0.94);
  refl.addColorStop(0, isFlat ? "rgba(230,175,155,0.42)" : "rgba(255,198,170,0.78)");
  refl.addColorStop(0.5, isFlat ? "rgba(200,130,145,0.22)" : "rgba(237,96,142,0.42)");
  refl.addColorStop(1, "rgba(10,30,60,0)");
  ctx.fillStyle = refl;
  ctx.beginPath();
  ctx.moveTo(w * 0.72, h * 0.565);
  ctx.lineTo(w * 0.86, h * 0.565);
  ctx.lineTo(w * 0.74, h * 0.95);
  ctx.lineTo(w * 0.52, h * 0.95);
  ctx.closePath();
  ctx.fill();

  // 水面细波
  ctx.strokeStyle = "rgba(255,222,205,0.34)";
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 10; i++) {
    const yy = h * (0.59 + i * 0.036);
    const cx = w * (0.76 - i * 0.011);
    const len = w * (0.06 + i * 0.013);
    ctx.beginPath();
    ctx.moveTo(cx - len / 2, yy);
    ctx.lineTo(cx + len / 2, yy);
    ctx.stroke();
  }

  // 独舟与划桨剪影（纯剪影，无五官）
  const bx = w * 0.67;
  const by = h * 0.605;
  ctx.fillStyle = isWashed ? "#2C3E52" : "#040A14";
  // 船身
  ctx.beginPath();
  ctx.moveTo(bx - 52, by);
  ctx.quadraticCurveTo(bx - 24, by + 17, bx + 44, by + 13);
  ctx.lineTo(bx + 62, by - 4);
  ctx.lineTo(bx - 42, by - 2);
  ctx.closePath();
  ctx.fill();
  // 撑篙背影剪影（简洁肩背与头廓，绝无五官）
  ctx.beginPath();
  ctx.arc(bx - 6, by - 30, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bx - 13, by - 2);
  ctx.lineTo(bx - 11, by - 23);
  ctx.lineTo(bx + 1, by - 23);
  ctx.lineTo(bx + 4, by - 2);
  ctx.closePath();
  ctx.fill();
  // 斜向竹篙
  ctx.strokeStyle = isWashed ? "#2C3E52" : "#040A14";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(bx - 28, by + 26);
  ctx.lineTo(bx + 18, by - 46);
  ctx.stroke();

  // 船底淡倒影
  ctx.fillStyle = "rgba(4, 12, 26, 0.34)";
  ctx.beginPath();
  ctx.ellipse(bx + 4, by + 20, 54, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  drawEdgeClutter(ctx, w, h, "harbor");

  if (lighting === "guided") {
    const vig = ctx.createRadialGradient(w * 0.68, h * 0.56, h * 0.14, w * 0.55, h * 0.5, w * 0.74);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(0.6, "rgba(3,10,24,0.18)");
    vig.addColorStop(1, "rgba(2,7,18,0.68)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  } else if (isWashed) {
    ctx.fillStyle = "rgba(235, 242, 250, 0.25)";
    ctx.fillRect(0, 0, w, h);
  }
}

// 场景 3：中庭光柱（建筑叙事）
function paintAtrium(ctx, w, h, lighting) {
  const isFlat = lighting === "flat";
  const isWashed = lighting === "washed";

  // 深暗建筑墙体
  const wall = ctx.createLinearGradient(0, 0, w, h);
  if (isWashed) {
    wall.addColorStop(0, "#5B6A7E");
    wall.addColorStop(1, "#7B8CA1");
  } else if (isFlat) {
    wall.addColorStop(0, "#243040");
    wall.addColorStop(1, "#32445A");
  } else {
    wall.addColorStop(0, "#040812");
    wall.addColorStop(0.55, "#0B172B");
    wall.addColorStop(1, "#071324");
  }
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, h);

  // 建筑透视立柱与结构线
  ctx.strokeStyle = isWashed ? "rgba(220,232,245,0.22)" : "rgba(95, 165, 220, 0.14)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    const x = w * (0.14 + i * 0.15);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h * 0.72);
    ctx.stroke();
  }
  // 地面透视线
  ctx.fillStyle = isWashed ? "#4A5A6E" : isFlat ? "#1B2635" : "#060F1E";
  ctx.fillRect(0, h * 0.72, w, h * 0.28);

  // 顶部天窗切口
  ctx.fillStyle = isFlat ? "#9AB6CF" : "#D4F0FF";
  ctx.beginPath();
  ctx.moveTo(w * 0.36, 0);
  ctx.lineTo(w * 0.56, 0);
  ctx.lineTo(w * 0.52, h * 0.07);
  ctx.lineTo(w * 0.40, h * 0.07);
  ctx.closePath();
  ctx.fill();

  // 斜射巨型建筑光柱（明暗引导线）
  const beam = ctx.createLinearGradient(w * 0.44, 0, w * 0.74, h * 0.84);
  if (isWashed) {
    beam.addColorStop(0, "rgba(245,250,255,0.68)");
    beam.addColorStop(1, "rgba(235,200,220,0.34)");
  } else if (isFlat) {
    beam.addColorStop(0, "rgba(180,210,235,0.34)");
    beam.addColorStop(1, "rgba(180,140,180,0.14)");
  } else {
    beam.addColorStop(0, "rgba(130, 224, 255, 0.62)");
    beam.addColorStop(0.55, "rgba(237, 90, 164, 0.34)");
    beam.addColorStop(1, "rgba(254, 141, 163, 0.54)");
  }
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(w * 0.40, h * 0.06);
  ctx.lineTo(w * 0.52, h * 0.06);
  ctx.lineTo(w * 0.84, h * 0.80);
  ctx.lineTo(w * 0.54, h * 0.80);
  ctx.closePath();
  ctx.fill();

  // 地面光斑椭圆
  const pool = ctx.createRadialGradient(w * 0.68, h * 0.78, 8, w * 0.68, h * 0.78, w * 0.17);
  pool.addColorStop(0, isFlat ? "rgba(220,200,210,0.45)" : "rgba(255, 185, 206, 0.82)");
  pool.addColorStop(0.55, isFlat ? "rgba(130,150,180,0.16)" : "rgba(74, 181, 217, 0.32)");
  pool.addColorStop(1, "rgba(6, 15, 30, 0)");
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.ellipse(w * 0.68, h * 0.78, w * 0.18, h * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // 光柱里的观者背影剪影（纯剪影，绝不画五官）
  const px = w * 0.66;
  const py = h * 0.77;
  ctx.fillStyle = isWashed ? "#2C394A" : "#030710";
  // 长影
  ctx.save();
  ctx.fillStyle = "rgba(2, 6, 14, 0.48)";
  ctx.beginPath();
  ctx.moveTo(px - 10, py);
  ctx.lineTo(px + 10, py);
  ctx.lineTo(px + 68, py + 24);
  ctx.lineTo(px + 38, py + 28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // 头廓 + 大衣背影
  ctx.beginPath();
  ctx.arc(px, py - 94, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(px - 18, py - 76);
  ctx.quadraticCurveTo(px, py - 84, px + 18, py - 76);
  ctx.lineTo(px + 22, py - 24);
  ctx.lineTo(px + 11, py - 24);
  ctx.lineTo(px + 9, py);
  ctx.lineTo(px + 2, py);
  ctx.lineTo(px + 1, py - 24);
  ctx.lineTo(px - 1, py - 24);
  ctx.lineTo(px - 3, py);
  ctx.lineTo(px - 10, py);
  ctx.lineTo(px - 12, py - 24);
  ctx.lineTo(px - 22, py - 24);
  ctx.closePath();
  ctx.fill();

  drawEdgeClutter(ctx, w, h, "atrium");

  if (lighting === "guided") {
    const vig = ctx.createRadialGradient(w * 0.64, h * 0.56, h * 0.14, w * 0.55, h * 0.50, w * 0.72);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(0.55, "rgba(2,6,16,0.22)");
    vig.addColorStop(1, "rgba(1,4,12,0.74)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  } else if (isWashed) {
    ctx.fillStyle = "rgba(235, 242, 248, 0.24)";
    ctx.fillRect(0, 0, w, h);
  }
}

// 边缘干扰杂物（位于底片外圈 u <= 0.112 与 u >= 0.888：未大胆裁切时露出，满幅裁切至 >= 115% 后彻底出画）
function drawEdgeClutter(ctx, w, h, kind) {
  ctx.save();
  if (kind === "valley") {
    // 右缘杂乱电线杆与横担
    ctx.strokeStyle = "#9FB4C8";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(w * 0.904, h * 0.14);
    ctx.lineTo(w * 0.896, h * 0.92);
    ctx.moveTo(w * 0.888, h * 0.21);
    ctx.lineTo(w * 0.932, h * 0.19);
    ctx.stroke();
    // 左下杂乱橙色反光锥
    ctx.fillStyle = "#FF6D38";
    ctx.beginPath();
    ctx.moveTo(w * 0.086, h * 0.86);
    ctx.lineTo(w * 0.099, h * 0.75);
    ctx.lineTo(w * 0.112, h * 0.86);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(w * 0.094, h * 0.80, w * 0.011, h * 0.017);
  } else if (kind === "harbor") {
    // 右下突兀混凝土码头墩与缆桩
    ctx.fillStyle = "#8896A4";
    ctx.fillRect(w * 0.890, h * 0.65, w * 0.055, h * 0.28);
    ctx.fillStyle = "#E8AA3B";
    ctx.fillRect(w * 0.890, h * 0.65, w * 0.055, h * 0.025);
    // 左缘斜入栏杆
    ctx.strokeStyle = "#A9B8C8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.068, h * 0.69);
    ctx.lineTo(w * 0.110, h * 0.74);
    ctx.lineTo(w * 0.110, h * 0.93);
    ctx.stroke();
  } else {
    // 右上刺眼绿色安全出口牌 + 左下红色消防箱
    ctx.fillStyle = "#1AC46E";
    ctx.fillRect(w * 0.890, h * 0.15, w * 0.044, h * 0.052);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(w * 0.898, h * 0.168, w * 0.028, h * 0.016);
    ctx.fillStyle = "#D83A3A";
    ctx.fillRect(w * 0.078, h * 0.71, w * 0.032, h * 0.14);
  }
  ctx.restore();
}

export function getScenePlate(sceneId, lighting) {
  const key = `${sceneId}:${lighting}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = createOffscreen(PLATE_W, PLATE_H);
  const ctx = canvas.getContext("2d");
  if (sceneId === "harbor") paintHarbor(ctx, PLATE_W, PLATE_H, lighting);
  else if (sceneId === "atrium") paintAtrium(ctx, PLATE_W, PLATE_H, lighting);
  else paintValley(ctx, PLATE_W, PLATE_H, lighting);

  const lumCanvas = createOffscreen(LUM_W, LUM_H);
  const lctx = lumCanvas.getContext("2d", { willReadFrequently: true });
  lctx.drawImage(canvas, 0, 0, LUM_W, LUM_H);
  const data = lctx.getImageData(0, 0, LUM_W, LUM_H).data;

  const entry = {
    canvas,
    sampleRGB(u, v) {
      const x = clamp(Math.floor(u * LUM_W), 0, LUM_W - 1);
      const y = clamp(Math.floor(v * LUM_H), 0, LUM_H - 1);
      const i = (y * LUM_W + x) * 4;
      return [data[i], data[i + 1], data[i + 2]];
    },
  };
  cache.set(key, entry);
  return entry;
}

// 严格按 model.js 的 getPlateWindow 返回的 { u0, v0, viewW, viewH } 绘制底片
// 当传入 coverFit=true（用于独立实验室画布）时自动按目标宽高比居中 cover 裁切，绝不拉扁太阳
export function drawCroppedPlate(ctx, plate, rect, win, coverFit = false) {
  let sx = win.u0 * plate.canvas.width;
  let sy = win.v0 * plate.canvas.height;
  let sw = win.viewW * plate.canvas.width;
  let sh = win.viewH * plate.canvas.height;
  if (coverFit && rect.w > 0 && rect.h > 0) {
    const srcAR = sw / sh;
    const dstAR = rect.w / rect.h;
    if (dstAR > srcAR) {
      const nextSh = sw / dstAR;
      sy += (sh - nextSh) / 2;
      sh = nextSh;
    } else if (dstAR < srcAR) {
      const nextSw = sh * dstAR;
      sx += (sw - nextSw) / 2;
      sw = nextSw;
    }
  }
  ctx.drawImage(plate.canvas, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
}

export function getSceneMeta(id) {
  return SCENES[id] || SCENES.valley;
}

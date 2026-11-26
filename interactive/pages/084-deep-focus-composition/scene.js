// 084 深焦构图 · 预烘焙多阶模糊金字塔 + 60fps 三景合像/剖片渲染引擎
// 严禁逐帧 ctx.filter("blur")：所有模糊阶通过一次离屏降采样/平滑金字塔预烘焙，交互期纯 drawImage 混合
import { clamp, evaluate, formatDist, SHARP_SIGMA, AIRY_WARN } from "./model.js";

// 将一张锐利离屏画布生成 3 阶模糊金字塔（0 锐利 / 1 轻柔虚化 / 2 强散焦）
function buildBlurPyramid(src) {
  const w = src.width;
  const h = src.height;
  const makeDownUp = (scale, passes) => {
    const sw = Math.max(24, Math.round(w * scale));
    const sh = Math.max(16, Math.round(h * scale));
    const tmpA = document.createElement("canvas");
    tmpA.width = sw;
    tmpA.height = sh;
    const ctxA = tmpA.getContext("2d");
    ctxA.imageSmoothingEnabled = true;
    ctxA.imageSmoothingQuality = "high";
    ctxA.drawImage(src, 0, 0, sw, sh);

    // 二次微偏移叠画模拟光学圆斑散焦，无任何 filter 开销
    const tmpB = document.createElement("canvas");
    tmpB.width = sw;
    tmpB.height = sh;
    const ctxB = tmpB.getContext("2d");
    ctxB.imageSmoothingEnabled = true;
    ctxB.imageSmoothingQuality = "high";
    for (let p = 0; p < passes; p++) {
      ctxB.clearRect(0, 0, sw, sh);
      const r = 1.1 + p * 0.6;
      const dirs = [
        [0, 0, 0.24],
        [r, 0, 0.12],
        [-r, 0, 0.12],
        [0, r, 0.12],
        [0, -r, 0.12],
        [r * 0.7, r * 0.7, 0.07],
        [-r * 0.7, r * 0.7, 0.07],
        [r * 0.7, -r * 0.7, 0.07],
        [-r * 0.7, -r * 0.7, 0.07],
      ];
      for (const [dx, dy, a] of dirs) {
        ctxB.globalAlpha = a;
        ctxB.drawImage(tmpA, dx, dy);
      }
      ctxB.globalAlpha = 1;
      ctxA.clearRect(0, 0, sw, sh);
      ctxA.drawImage(tmpB, 0, 0);
    }

    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const ctxO = out.getContext("2d");
    ctxO.imageSmoothingEnabled = true;
    ctxO.imageSmoothingQuality = "high";
    ctxO.drawImage(tmpA, 0, 0, w, h);
    return out;
  };
  return [src, makeDownUp(0.26, 2), makeDownUp(0.11, 3)];
}

// 绘制一棵细致的欧洲柏树或松树
function drawCypress(ctx, x, y, h, w, darkCol, lightCol) {
  ctx.fillStyle = darkCol;
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.quadraticCurveTo(x + w * 0.65, y - h * 0.45, x + w * 0.45, y);
  ctx.lineTo(x - w * 0.45, y);
  ctx.quadraticCurveTo(x - w * 0.65, y - h * 0.45, x, y - h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = lightCol;
  ctx.beginPath();
  ctx.moveTo(x, y - h * 0.94);
  ctx.quadraticCurveTo(x + w * 0.42, y - h * 0.48, x + w * 0.22, y - h * 0.08);
  ctx.lineTo(x, y - h * 0.08);
  ctx.closePath();
  ctx.fill();
}

// 绘制一朵前景小白花
function drawWildflower(ctx, x, y, r) {
  ctx.fillStyle = "#F0EBD2";
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, r * 0.62, r * 0.36, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#DFC44B";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.48, 0, Math.PI * 2);
  ctx.fill();
}

// ---------- 预烘焙三个题材各自的「远景 / 中景 / 前景」透明图层 ----------
// 宽画布多留 ±28% 横向冗余（overdraw pad），左右拖拽错位永不露白边！
const PAD_RATIO = 0.28;

function createLayerCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function paintAlpineLayers(W, H) {
  const pad = Math.round(W * PAD_RATIO);
  const fullW = W + pad * 2;
  // 1) 远景层：薄荷天、白雪主峰、层叠松青远山、平静湖面、远岸红顶小教堂与村落
  const bg = createLayerCanvas(fullW, H);
  {
    const ctx = bg.getContext("2d");
    const ox = pad; // 画幅左缘基准
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.52);
    sky.addColorStop(0, "#CBE2CC");
    sky.addColorStop(0.55, "#BBD7BE");
    sky.addColorStop(1, "#D8E7D2");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, fullW, H);

    // 柔和云带（承袭 084 原海报云形）
    ctx.fillStyle = "rgba(246,247,236,0.72)";
    const clouds = [
      [0.14, 0.13, 0.16, 0.032],
      [0.82, 0.11, 0.20, 0.038],
      [0.44, 0.08, 0.12, 0.024],
    ];
    for (const [cx, cy, cw, ch] of clouds) {
      ctx.beginPath();
      ctx.ellipse(ox + W * cx, H * cy, W * cw * 0.5, H * ch, 0, 0, Math.PI * 2);
      ctx.ellipse(ox + W * (cx - cw * 0.22), H * (cy + ch * 0.22), W * cw * 0.34, H * ch * 0.72, 0, 0, Math.PI * 2);
      ctx.ellipse(ox + W * (cx + cw * 0.24), H * (cy + ch * 0.26), W * cw * 0.30, H * ch * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 极远淡蓝青主雪峰（锚点在 ox + 0.64*W）
    const peakX = ox + W * 0.56;
    ctx.fillStyle = "#6C9383";
    ctx.beginPath();
    ctx.moveTo(0, H * 0.42);
    ctx.lineTo(ox + W * 0.10, H * 0.22);
    ctx.lineTo(ox + W * 0.34, H * 0.34);
    ctx.lineTo(peakX, H * 0.10);
    ctx.lineTo(ox + W * 0.84, H * 0.28);
    ctx.lineTo(fullW, H * 0.19);
    ctx.lineTo(fullW, H * 0.55);
    ctx.lineTo(0, H * 0.55);
    ctx.closePath();
    ctx.fill();

    // 雪峰亮面与背阴面
    ctx.fillStyle = "#ECECE0";
    ctx.beginPath();
    ctx.moveTo(peakX, H * 0.10);
    ctx.lineTo(peakX - W * 0.07, H * 0.20);
    ctx.lineTo(peakX - W * 0.02, H * 0.185);
    ctx.lineTo(peakX + W * 0.015, H * 0.22);
    ctx.lineTo(peakX + W * 0.085, H * 0.195);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#B9CFC4";
    ctx.beginPath();
    ctx.moveTo(peakX, H * 0.10);
    ctx.lineTo(peakX - W * 0.07, H * 0.20);
    ctx.lineTo(peakX - W * 0.01, H * 0.18);
    ctx.closePath();
    ctx.fill();

    // 次远深松青双山脊
    ctx.fillStyle = "#48705F";
    ctx.beginPath();
    ctx.moveTo(0, H * 0.44);
    ctx.lineTo(ox + W * 0.14, H * 0.23);
    ctx.lineTo(ox + W * 0.40, H * 0.36);
    ctx.lineTo(ox + W * 0.66, H * 0.25);
    ctx.lineTo(ox + W * 0.94, H * 0.35);
    ctx.lineTo(fullW, H * 0.26);
    ctx.lineTo(fullW, H * 0.55);
    ctx.lineTo(0, H * 0.55);
    ctx.closePath();
    ctx.fill();

    // 近远层山坡绿带
    ctx.fillStyle = "#3E6248";
    ctx.beginPath();
    ctx.moveTo(0, H * 0.42);
    ctx.quadraticCurveTo(ox + W * 0.22, H * 0.30, ox + W * 0.46, H * 0.41);
    ctx.quadraticCurveTo(ox + W * 0.72, H * 0.33, fullW, H * 0.39);
    ctx.lineTo(fullW, H * 0.55);
    ctx.lineTo(0, H * 0.55);
    ctx.closePath();
    ctx.fill();

    // 远景高山湖面
    const lake = ctx.createLinearGradient(0, H * 0.39, 0, H * 0.60);
    lake.addColorStop(0, "#7FA996");
    lake.addColorStop(0.55, "#94BCAA");
    lake.addColorStop(1, "#6C9787");
    ctx.fillStyle = lake;
    ctx.fillRect(0, H * 0.40, fullW, H * 0.24);

    // 湖面水平浅水纹
    ctx.strokeStyle = "rgba(232,243,233,0.42)";
    ctx.lineWidth = Math.max(1, H * 0.003);
    for (let i = 0; i < 11; i++) {
      const ly = H * (0.42 + i * 0.015);
      const lx = ox + W * ((i * 0.19) % 0.85);
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + W * (0.09 + (i % 3) * 0.05), ly);
      ctx.stroke();
    }

    // 远岸草岬与招牌红顶小教堂村落（围绕 ox + 0.64*W）
    const vx = ox + W * 0.64;
    const vy = H * 0.405;
    ctx.fillStyle = "#48683C";
    ctx.beginPath();
    ctx.moveTo(vx - W * 0.15, vy + H * 0.01);
    ctx.quadraticCurveTo(vx, vy - H * 0.025, vx + W * 0.24, vy - H * 0.015);
    ctx.lineTo(vx + W * 0.28, vy + H * 0.014);
    ctx.closePath();
    ctx.fill();

    // 教堂尖塔与白墙红瓦屋舍
    ctx.fillStyle = "#E6DEC8";
    ctx.fillRect(vx - W * 0.012, vy - H * 0.052, W * 0.024, H * 0.052);
    ctx.fillRect(vx + W * 0.012, vy - H * 0.032, W * 0.052, H * 0.032);
    ctx.fillRect(vx + W * 0.075, vy - H * 0.024, W * 0.032, H * 0.024);
    ctx.fillStyle = "#9E4E38";
    ctx.beginPath();
    ctx.moveTo(vx - W * 0.015, vy - H * 0.052);
    ctx.lineTo(vx, vy - H * 0.092);
    ctx.lineTo(vx + W * 0.015, vy - H * 0.052);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(vx + W * 0.008, vy - H * 0.032);
    ctx.lineTo(vx + W * 0.038, vy - H * 0.048);
    ctx.lineTo(vx + W * 0.068, vy - H * 0.032);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(vx + W * 0.072, vy - H * 0.033, W * 0.038, H * 0.010);

    // 教堂细窗与倒影
    ctx.fillStyle = "#3A4935";
    for (let k = 0; k < 4; k++) {
      ctx.fillRect(vx + W * (0.018 + k * 0.011), vy - H * 0.020, W * 0.005, H * 0.009);
    }
    ctx.fillStyle = "rgba(230,222,200,0.22)";
    ctx.fillRect(vx - W * 0.01, vy + H * 0.015, W * 0.09, H * 0.024);

    // 远岸树丛剪影
    for (let i = -5; i <= 8; i++) {
      const tx = vx + i * W * 0.028;
      if (Math.abs(tx - (vx + W * 0.02)) < W * 0.04) continue;
      drawCypress(ctx, tx, vy + H * 0.004, H * (0.04 + (Math.abs(i) % 3) * 0.014), W * 0.012, "#2C4C30", "#4A6D3C");
    }
  }

  // 2) 中景层：透明背景上的石拱桥、两岸绿树、红瓦农舍与弯河小径（核心石桥居 ox + 0.50*W）
  const mg = createLayerCanvas(fullW, H);
  {
    const ctx = mg.getContext("2d");
    const ox = pad;
    const bx = ox + W * 0.50;
    const waterY = H * 0.59;

    // 河水底带（与远湖自然衔接，底部透明渐隐杜绝水平硬缝）
    const river = ctx.createLinearGradient(0, H * 0.49, 0, H * 0.84);
    river.addColorStop(0, "rgba(104,148,130,0.0)");
    river.addColorStop(0.18, "#6F9E8C");
    river.addColorStop(0.62, "#568575");
    river.addColorStop(0.86, "#3C6759");
    river.addColorStop(1, "rgba(44,74,56,0.0)");
    ctx.fillStyle = river;
    ctx.fillRect(0, H * 0.49, fullW, H * 0.36);

    // 左岸绿坡与树木（自然延伸入前景草坡下，无断口）
    ctx.fillStyle = "#3E5626";
    ctx.beginPath();
    ctx.moveTo(0, H * 0.50);
    ctx.quadraticCurveTo(bx - W * 0.30, H * 0.49, bx - W * 0.16, H * 0.55);
    ctx.lineTo(bx - W * 0.24, H * 0.78);
    ctx.lineTo(0, H * 0.78);
    ctx.closePath();
    ctx.fill();

    // 右岸绿坡 + 暖黄土路 + 石屋村舍
    ctx.fillStyle = "#4A6329";
    ctx.beginPath();
    ctx.moveTo(bx + W * 0.16, H * 0.54);
    ctx.quadraticCurveTo(bx + W * 0.36, H * 0.47, fullW, H * 0.49);
    ctx.lineTo(fullW, H * 0.79);
    ctx.lineTo(bx + W * 0.04, H * 0.79);
    ctx.quadraticCurveTo(bx + W * 0.14, H * 0.62, bx + W * 0.16, H * 0.54);
    ctx.closePath();
    ctx.fill();

    // 中景右岸引路土径
    ctx.fillStyle = "#CBB582";
    ctx.beginPath();
    ctx.moveTo(bx + W * 0.18, H * 0.545);
    ctx.quadraticCurveTo(bx + W * 0.27, H * 0.58, bx + W * 0.21, H * 0.76);
    ctx.lineTo(bx + W * 0.12, H * 0.76);
    ctx.quadraticCurveTo(bx + W * 0.20, H * 0.60, bx + W * 0.14, H * 0.555);
    ctx.closePath();
    ctx.fill();

    // 中景四孔古老石拱桥（084 原海报中景核心！）
    const bw = W * 0.34;
    const bridgeL = bx - bw * 0.5;
    const bridgeR = bx + bw * 0.5;
    const deckY = H * 0.515;

    ctx.fillStyle = "#A39B7D";
    ctx.beginPath();
    ctx.moveTo(bridgeL, deckY + H * 0.015);
    ctx.quadraticCurveTo(bx, deckY - H * 0.022, bridgeR, deckY + H * 0.015);
    ctx.lineTo(bridgeR, waterY + H * 0.015);
    ctx.lineTo(bridgeL, waterY + H * 0.015);
    ctx.closePath();
    ctx.fill();

    // 桥身阴影与石块纹理线条
    ctx.fillStyle = "#7D785E";
    ctx.fillRect(bridgeL, deckY + H * 0.016, bw, H * 0.010);
    ctx.strokeStyle = "#D4CEAE";
    ctx.lineWidth = Math.max(1.5, H * 0.004);
    ctx.beginPath();
    ctx.moveTo(bridgeL, deckY + H * 0.012);
    ctx.quadraticCurveTo(bx, deckY - H * 0.025, bridgeR, deckY + H * 0.012);
    ctx.stroke();

    // 挖空四个真实桥拱孔（透出深蓝绿桥洞阴影与水面倒影）
    const arches = 4;
    const span = bw / (arches + 0.55);
    for (let i = 0; i < arches; i++) {
      const ax = bridgeL + span * (0.78 + i);
      const ar = span * 0.36;
      ctx.fillStyle = "#263F34";
      ctx.beginPath();
      ctx.arc(ax, waterY + H * 0.008, ar, Math.PI, 0, false);
      ctx.lineTo(ax + ar, waterY + H * 0.018);
      ctx.lineTo(ax - ar, waterY + H * 0.018);
      ctx.closePath();
      ctx.fill();
      // 拱顶光石圈
      ctx.strokeStyle = "#C7BF9D";
      ctx.lineWidth = Math.max(1.2, H * 0.003);
      ctx.beginPath();
      ctx.arc(ax, waterY + H * 0.008, ar + 1.5, Math.PI, 0, false);
      ctx.stroke();
      // 水中倒影拱
      ctx.fillStyle = "rgba(32,58,48,0.42)";
      ctx.beginPath();
      ctx.ellipse(ax, waterY + H * 0.036, ar * 0.92, H * 0.019, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 河面亮涟漪
    ctx.strokeStyle = "rgba(220,236,222,0.45)";
    ctx.lineWidth = Math.max(1, H * 0.0025);
    for (let i = 0; i < 8; i++) {
      const ry = waterY + H * (0.02 + i * 0.011);
      const rx = bx - W * 0.14 + (i % 3) * W * 0.09;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + W * 0.065, ry);
      ctx.stroke();
    }

    // 右岸托斯卡纳/阿尔卑斯双栋陶瓦石屋
    const hx = bx + W * 0.19;
    const hy = H * 0.515;
    // 主屋
    ctx.fillStyle = "#DFCCA6";
    ctx.fillRect(hx, hy - H * 0.075, W * 0.078, H * 0.078);
    ctx.fillStyle = "#BCA781";
    ctx.fillRect(hx + W * 0.052, hy - H * 0.075, W * 0.026, H * 0.078);
    ctx.fillStyle = "#A95A3A";
    ctx.beginPath();
    ctx.moveTo(hx - W * 0.008, hy - H * 0.073);
    ctx.lineTo(hx + W * 0.038, hy - H * 0.112);
    ctx.lineTo(hx + W * 0.084, hy - H * 0.073);
    ctx.closePath();
    ctx.fill();
    // 副屋
    ctx.fillStyle = "#D5C097";
    ctx.fillRect(hx + W * 0.082, hy - H * 0.056, W * 0.066, H * 0.062);
    ctx.fillStyle = "#9B4E31";
    ctx.beginPath();
    ctx.moveTo(hx + W * 0.076, hy - H * 0.054);
    ctx.lineTo(hx + W * 0.115, hy - H * 0.088);
    ctx.lineTo(hx + W * 0.154, hy - H * 0.054);
    ctx.closePath();
    ctx.fill();
    // 清晰黑褐小窗
    ctx.fillStyle = "#2E2B1E";
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.fillRect(hx + W * (0.011 + c * 0.019), hy - H * (0.060 - r * 0.028), W * 0.009, H * 0.016);
      }
    }
    for (let c = 0; c < 2; c++) {
      ctx.fillRect(hx + W * (0.095 + c * 0.024), hy - H * 0.042, W * 0.010, H * 0.018);
    }

    // 两岸成组柏树与阔叶树（丰富中景故事感）
    drawCypress(ctx, bx - W * 0.21, H * 0.535, H * 0.135, W * 0.022, "#24401D", "#4A6E2E");
    drawCypress(ctx, bx - W * 0.25, H * 0.545, H * 0.105, W * 0.018, "#1F391A", "#3F6228");
    drawCypress(ctx, bx + W * 0.165, H * 0.525, H * 0.115, W * 0.018, "#223D1C", "#486C2D");
    drawCypress(ctx, bx + W * 0.34, H * 0.535, H * 0.145, W * 0.024, "#1F391A", "#46692A");
    // 蓬松绿树冠
    const crowns = [
      [bx - W * 0.31, H * 0.49, W * 0.058, "#2B461D", "#587832"],
      [bx + W * 0.38, H * 0.47, W * 0.068, "#26401B", "#52732E"],
    ];
    for (const [cx, cy, cr, cDark, cLit] of crowns) {
      ctx.fillStyle = cDark;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.arc(cx - cr * 0.55, cy + cr * 0.28, cr * 0.72, 0, Math.PI * 2);
      ctx.arc(cx + cr * 0.58, cy + cr * 0.22, cr * 0.76, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cLit;
      ctx.beginPath();
      ctx.arc(cx - cr * 0.18, cy - cr * 0.22, cr * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3) 前景层：透明上部 + 底部草坡/暖土径 + 居中可横移的高大木栅栏与野花丛（基准中心在 ox + 0.50*W）
  const fg = createLayerCanvas(fullW, H);
  {
    const ctx = fg.getContext("2d");
    const ox = pad;
    const fx = ox + W * 0.50;

    // 底部连续草地底座（略向下偏，不遮挡石桥）
    const ground = ctx.createLinearGradient(0, H * 0.67, 0, H);
    ground.addColorStop(0, "#2C421A");
    ground.addColorStop(0.55, "#1E3012");
    ground.addColorStop(1, "#14220B");
    ctx.fillStyle = ground;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.72);
    ctx.quadraticCurveTo(fx - W * 0.20, H * 0.68, fx, H * 0.71);
    ctx.quadraticCurveTo(fx + W * 0.24, H * 0.68, fullW, H * 0.72);
    ctx.lineTo(fullW, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // 由前景斜伸向中景的暖日光碎石小径（视觉引导线！）
    const pathGrad = ctx.createLinearGradient(fx, H * 0.70, fx, H);
    pathGrad.addColorStop(0, "#BDA46D");
    pathGrad.addColorStop(0.55, "#D6BE89");
    pathGrad.addColorStop(1, "#B89D68");
    ctx.fillStyle = pathGrad;
    ctx.beginPath();
    ctx.moveTo(fx + W * 0.08, H * 0.70);
    ctx.quadraticCurveTo(fx + W * 0.14, H * 0.80, fx + W * 0.02, H);
    ctx.lineTo(fx + W * 0.24, H);
    ctx.quadraticCurveTo(fx + W * 0.23, H * 0.80, fx + W * 0.14, H * 0.70);
    ctx.closePath();
    ctx.fill();

    // 路径石子与斑驳日光纹
    ctx.fillStyle = "rgba(92,74,40,0.35)";
    for (let i = 0; i < 18; i++) {
      const px = fx + W * (0.06 + (i * 0.017) % 0.14);
      const py = H * (0.74 + (i * 0.037) % 0.23);
      ctx.beginPath();
      ctx.ellipse(px, py, W * 0.008, H * 0.004, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 关键前景立体主物（084 原海报的实木栅栏 + 高枝野花草丛，位于 fx ± 0.15*W，高度探入 y = 0.43*H）
    // 当 fgOffset = 0 时正好直挡中景石桥；拖向左侧 (-0.25) 或右侧 (+0.25) 则立刻让出桥身并变成完美近景引导框！
    const posts = [
      { x: fx - W * 0.125, topY: H * 0.45, botY: H * 0.94, pw: W * 0.026 },
      { x: fx - W * 0.045, topY: H * 0.48, botY: H * 0.90, pw: W * 0.022 },
      { x: fx + W * 0.030, topY: H * 0.51, botY: H * 0.86, pw: W * 0.019 },
      { x: fx + W * 0.095, topY: H * 0.54, botY: H * 0.83, pw: W * 0.016 },
    ];

    // 先画两道透视木横梁
    for (const rFrac of [0.22, 0.56]) {
      ctx.beginPath();
      const yL = posts[0].topY + (posts[0].botY - posts[0].topY) * rFrac;
      const yR = posts[3].topY + (posts[3].botY - posts[3].topY) * rFrac;
      ctx.moveTo(posts[0].x - W * 0.02, yL);
      ctx.lineTo(posts[3].x + W * 0.02, yR);
      ctx.lineTo(posts[3].x + W * 0.02, yR + H * 0.022);
      ctx.lineTo(posts[0].x - W * 0.02, yL + H * 0.034);
      ctx.closePath();
      ctx.fillStyle = "#5B4426";
      ctx.fill();
      ctx.strokeStyle = "#261B0D";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      // 木梁顶面高光
      ctx.strokeStyle = "#8D7045";
      ctx.beginPath();
      ctx.moveTo(posts[0].x - W * 0.02, yL + 1.5);
      ctx.lineTo(posts[3].x + W * 0.02, yR + 1.5);
      ctx.stroke();
    }

    // 再画四根带木纹与斜顶的实木桩
    for (const p of posts) {
      ctx.fillStyle = "#4A361D";
      ctx.fillRect(p.x - p.pw / 2, p.topY, p.pw, p.botY - p.topY);
      ctx.fillStyle = "#775B35";
      ctx.fillRect(p.x - p.pw / 2, p.topY, p.pw * 0.36, p.botY - p.topY);
      ctx.fillStyle = "#24190C";
      ctx.fillRect(p.x + p.pw * 0.28, p.topY, p.pw * 0.22, p.botY - p.topY);
      // 桩顶暖光切面
      ctx.fillStyle = "#A28252";
      ctx.beginPath();
      ctx.moveTo(p.x - p.pw / 2, p.topY);
      ctx.lineTo(p.x, p.topY - H * 0.012);
      ctx.lineTo(p.x + p.pw / 2, p.topY);
      ctx.closePath();
      ctx.fill();
    }

    // 栅栏脚下大灰石块与茂密草叶
    ctx.fillStyle = "#697163";
    ctx.beginPath();
    ctx.ellipse(fx - W * 0.09, H * 0.90, W * 0.044, H * 0.032, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8E9686";
    ctx.beginPath();
    ctx.ellipse(fx - W * 0.098, H * 0.888, W * 0.026, H * 0.014, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // 锋利清晰的草叶片与野花（检验前景清晰度的绝佳高频纹理！）
    for (let i = 0; i < 48; i++) {
      const gx = fx - W * 0.16 + (i / 47) * W * 0.32;
      const gy = H * (0.76 + (i % 5) * 0.042);
      const gh = H * (0.09 + (i % 4) * 0.035);
      const lean = ((i % 7) - 3) * W * 0.006;
      ctx.strokeStyle = i % 3 === 0 ? "#668336" : i % 2 === 0 ? "#37521E" : "#1D320F";
      ctx.lineWidth = Math.max(1.4, W * 0.0026);
      ctx.beginPath();
      ctx.moveTo(gx, gy + H * 0.06);
      ctx.quadraticCurveTo(gx + lean * 0.5, gy, gx + lean, gy - gh);
      ctx.stroke();
    }
    const flowers = [
      [-0.12, 0.81, 0.011],
      [-0.08, 0.74, 0.009],
      [-0.04, 0.86, 0.012],
      [0.01, 0.78, 0.010],
      [0.06, 0.85, 0.009],
      [-0.14, 0.91, 0.013],
      [0.10, 0.77, 0.008],
      [-0.02, 0.67, 0.0085],
    ];
    for (const [dx, fy, r] of flowers) {
      drawWildflower(ctx, fx + W * dx, H * fy, W * r);
    }
  }

  return {
    bg: buildBlurPyramid(bg),
    mg: buildBlurPyramid(mg),
    fg: buildBlurPyramid(fg),
    pad,
  };
}

// 题材 2：电影厅堂·公民凯恩式深焦布景（纯剪影无五官，致敬 1941 格雷格·托兰德雪屋名场面）
function paintCinemaLayers(W, H) {
  const pad = Math.round(W * PAD_RATIO);
  const fullW = W + pad * 2;
  const ox = pad;

  // 远景：木窗外雪坡松林与玩雪孩童剪影
  const bg = createLayerCanvas(fullW, H);
  {
    const ctx = bg.getContext("2d");
    const wall = ctx.createLinearGradient(0, 0, 0, H);
    wall.addColorStop(0, "#192620");
    wall.addColorStop(0.55, "#23332B");
    wall.addColorStop(1, "#131D18");
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, fullW, H);

    // 透视天花板横梁（致敬 1941 低机位天花板布景）
    ctx.strokeStyle = "#33473C";
    ctx.lineWidth = Math.max(2, H * 0.006);
    for (let i = -2; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(ox + W * (0.5 + i * 0.28), 0);
      ctx.lineTo(ox + W * (0.56 + i * 0.09), H * 0.34);
      ctx.stroke();
    }

    // 远景高窗（围绕 ox + 0.56*W）
    const wx = ox + W * 0.56;
    const wy = H * 0.11;
    const ww = W * 0.22;
    const wh = H * 0.34;
    const snowSky = ctx.createLinearGradient(0, wy, 0, wy + wh);
    snowSky.addColorStop(0, "#C9D8D3");
    snowSky.addColorStop(0.62, "#E3EAE5");
    snowSky.addColorStop(1, "#F2F4EE");
    ctx.fillStyle = snowSky;
    ctx.fillRect(wx - ww / 2, wy, ww, wh);

    // 窗外雪丘与松林剪影
    ctx.fillStyle = "#5F786D";
    ctx.beginPath();
    ctx.moveTo(wx - ww / 2, wy + wh * 0.62);
    ctx.quadraticCurveTo(wx, wy + wh * 0.46, wx + ww / 2, wy + wh * 0.58);
    ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.lineTo(wx - ww / 2, wy + wh);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#E8EFE9";
    ctx.beginPath();
    ctx.moveTo(wx - ww / 2, wy + wh * 0.72);
    ctx.quadraticCurveTo(wx, wy + wh * 0.63, wx + ww / 2, wy + wh * 0.70);
    ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.lineTo(wx - ww / 2, wy + wh);
    ctx.closePath();
    ctx.fill();

    // 窗外雪地孩童与雪橇纯剪影（无五官）
    ctx.fillStyle = "#1B2A22";
    const kx = wx + ww * 0.04;
    const ky = wy + wh * 0.84;
    ctx.beginPath();
    ctx.arc(kx, ky - H * 0.048, W * 0.009, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(kx - W * 0.011, ky - H * 0.036);
    ctx.lineTo(kx + W * 0.011, ky - H * 0.036);
    ctx.lineTo(kx + W * 0.015, ky);
    ctx.lineTo(kx - W * 0.015, ky);
    ctx.closePath();
    ctx.fill();
    // 雪橇剪影
    ctx.strokeStyle = "#1B2A22";
    ctx.lineWidth = Math.max(1.8, H * 0.004);
    ctx.beginPath();
    ctx.moveTo(kx - W * 0.034, ky);
    ctx.lineTo(kx - W * 0.005, ky);
    ctx.stroke();

    // 窗棂
    ctx.strokeStyle = "#131F19";
    ctx.lineWidth = Math.max(3, W * 0.008);
    ctx.strokeRect(wx - ww / 2, wy, ww, wh);
    ctx.lineWidth = Math.max(1.8, W * 0.004);
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx, wy + wh);
    ctx.moveTo(wx - ww / 2, wy + wh * 0.5);
    ctx.lineTo(wx + ww / 2, wy + wh * 0.5);
    ctx.stroke();
  }

  // 中景：客厅木地板透视线 + 对峙双人剪影（纯轮廓，无任何五官）
  const mg = createLayerCanvas(fullW, H);
  {
    const ctx = mg.getContext("2d");
    const mx = ox + W * 0.50;
    // 室内斜射窗光带
    const beam = ctx.createLinearGradient(mx - W * 0.2, H * 0.44, mx + W * 0.2, H * 0.78);
    beam.addColorStop(0, "rgba(218,228,186,0.22)");
    beam.addColorStop(1, "rgba(218,228,186,0.0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(mx - W * 0.14, H * 0.45);
    ctx.lineTo(mx + W * 0.14, H * 0.45);
    ctx.lineTo(mx + W * 0.34, H * 0.78);
    ctx.lineTo(mx - W * 0.34, H * 0.78);
    ctx.closePath();
    ctx.fill();

    // 人物 A（左侧长裙侧身剪影，无五官）
    const drawFigure = (x, baseY, h, shoulderW, coatCol, rimCol) => {
      ctx.fillStyle = coatCol;
      ctx.beginPath();
      ctx.arc(x, baseY - h * 0.88, h * 0.095, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - shoulderW * 0.42, baseY - h * 0.75);
      ctx.quadraticCurveTo(x, baseY - h * 0.79, x + shoulderW * 0.42, baseY - h * 0.75);
      ctx.lineTo(x + shoulderW * 0.56, baseY);
      ctx.lineTo(x - shoulderW * 0.56, baseY);
      ctx.closePath();
      ctx.fill();
      // 清晰肩背轮廓冷光边
      ctx.strokeStyle = rimCol;
      ctx.lineWidth = Math.max(1.5, W * 0.0028);
      ctx.beginPath();
      ctx.arc(x, baseY - h * 0.88, h * 0.095, -Math.PI * 0.8, -Math.PI * 0.1);
      ctx.stroke();
    };
    drawFigure(mx - W * 0.075, H * 0.74, H * 0.39, W * 0.09, "#1E2D24", "#C8D5AF");
    drawFigure(mx + W * 0.065, H * 0.73, H * 0.41, W * 0.095, "#26382D", "#D6DC88");

    // 墙边高背椅剪影
    ctx.strokeStyle = "#485E4E";
    ctx.lineWidth = Math.max(2, W * 0.004);
    ctx.strokeRect(mx + W * 0.14, H * 0.52, W * 0.055, H * 0.16);
  }

  // 前景：近镜头书桌边缘、白纸契约文件、钢笔与暖光黄铜台灯
  const fg = createLayerCanvas(fullW, H);
  {
    const ctx = fg.getContext("2d");
    const fx = ox + W * 0.50;
    // 桌板底部延伸
    ctx.fillStyle = "#161B12";
    ctx.fillRect(0, H * 0.77, fullW, H * 0.23);
    ctx.fillStyle = "#2E3524";
    ctx.fillRect(0, H * 0.76, fullW, H * 0.018);

    // 契约文档斜铺在桌前
    ctx.save();
    ctx.translate(fx + W * 0.03, H * 0.84);
    ctx.rotate(-0.08);
    ctx.fillStyle = "#EAE6D3";
    ctx.fillRect(-W * 0.085, -H * 0.055, W * 0.17, H * 0.115);
    ctx.fillStyle = "#4E5748";
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(-W * 0.068, -H * 0.036 + i * H * 0.015, W * (i === 5 ? 0.07 : 0.132), H * 0.0045);
    }
    ctx.restore();

    // 高大复古台灯（探到 y = 0.44*H，居中时会直接挡住中景人物！）
    const lx = fx - W * 0.055;
    ctx.fillStyle = "#8C7D3D";
    ctx.fillRect(lx - W * 0.009, H * 0.54, W * 0.018, H * 0.24);
    ctx.fillStyle = "#B8A653";
    ctx.beginPath();
    ctx.ellipse(lx, H * 0.785, W * 0.048, H * 0.018, 0, 0, Math.PI * 2);
    ctx.fill();
    // 绿色经典银行灯罩
    ctx.fillStyle = "#2B5B3A";
    ctx.beginPath();
    ctx.moveTo(lx - W * 0.068, H * 0.555);
    ctx.lineTo(lx - W * 0.042, H * 0.445);
    ctx.lineTo(lx + W * 0.042, H * 0.445);
    ctx.lineTo(lx + W * 0.068, H * 0.555);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#DCD868";
    ctx.lineWidth = 2;
    ctx.stroke();
    // 灯下暖晕
    const glow = ctx.createRadialGradient(lx, H * 0.58, W * 0.01, lx, H * 0.65, W * 0.14);
    glow.addColorStop(0, "rgba(235,232,126,0.34)");
    glow.addColorStop(1, "rgba(235,232,126,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(lx - W * 0.15, H * 0.52, W * 0.30, H * 0.28);
  }

  return {
    bg: buildBlurPyramid(bg),
    mg: buildBlurPyramid(mg),
    fg: buildBlurPyramid(fg),
    pad,
  };
}

// 题材 3：古典长廊·园林借景（前景青竹漏窗 → 中景曲桥水榭 → 远景孤塔青山）
function paintGardenLayers(W, H) {
  const pad = Math.round(W * PAD_RATIO);
  const fullW = W + pad * 2;
  const ox = pad;

  const bg = createLayerCanvas(fullW, H);
  {
    const ctx = bg.getContext("2d");
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    sky.addColorStop(0, "#DCE6DC");
    sky.addColorStop(1, "#BDD1C2");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, fullW, H);

    // 淡青远山
    ctx.fillStyle = "#6F9485";
    ctx.beginPath();
    ctx.moveTo(0, H * 0.44);
    ctx.quadraticCurveTo(ox + W * 0.28, H * 0.24, ox + W * 0.56, H * 0.36);
    ctx.quadraticCurveTo(ox + W * 0.78, H * 0.22, fullW, H * 0.38);
    ctx.lineTo(fullW, H * 0.58);
    ctx.lineTo(0, H * 0.58);
    ctx.closePath();
    ctx.fill();

    // 远景孤塔（ox + 0.62*W）
    const px = ox + W * 0.62;
    const py = H * 0.35;
    ctx.fillStyle = "#2E4C3E";
    for (let i = 0; i < 5; i++) {
      const tw = W * (0.044 - i * 0.006);
      const ty = py - i * H * 0.036;
      ctx.fillRect(px - tw * 0.45, ty - H * 0.025, tw * 0.9, H * 0.025);
      ctx.beginPath();
      ctx.moveTo(px - tw * 0.78, ty - H * 0.022);
      ctx.lineTo(px, ty - H * 0.042);
      ctx.lineTo(px + tw * 0.78, ty - H * 0.022);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#8EB2A0";
    ctx.fillRect(0, H * 0.44, fullW, H * 0.26);
  }

  const mg = createLayerCanvas(fullW, H);
  {
    const ctx = mg.getContext("2d");
    const mx = ox + W * 0.50;
    // 池水
    ctx.fillStyle = "#679180";
    ctx.fillRect(0, H * 0.54, fullW, H * 0.20);
    // 九曲石桥
    ctx.strokeStyle = "#DED7BE";
    ctx.lineWidth = Math.max(4, H * 0.018);
    ctx.beginPath();
    ctx.moveTo(mx - W * 0.24, H * 0.63);
    ctx.lineTo(mx - W * 0.08, H * 0.59);
    ctx.lineTo(mx + W * 0.04, H * 0.61);
    ctx.lineTo(mx + W * 0.16, H * 0.56);
    ctx.stroke();

    // 飞檐水榭
    const tx = mx + W * 0.07;
    const ty = H * 0.56;
    ctx.fillStyle = "#3A2D22";
    ctx.fillRect(tx - W * 0.065, ty - H * 0.09, W * 0.012, H * 0.09);
    ctx.fillRect(tx + W * 0.053, ty - H * 0.09, W * 0.012, H * 0.09);
    ctx.fillStyle = "#E7E2CE";
    ctx.fillRect(tx - W * 0.053, ty - H * 0.075, W * 0.106, H * 0.055);
    ctx.fillStyle = "#2A3D34";
    ctx.beginPath();
    ctx.moveTo(tx - W * 0.10, ty - H * 0.088);
    ctx.quadraticCurveTo(tx, ty - H * 0.145, tx + W * 0.10, ty - H * 0.088);
    ctx.lineTo(tx + W * 0.072, ty - H * 0.074);
    ctx.lineTo(tx - W * 0.072, ty - H * 0.074);
    ctx.closePath();
    ctx.fill();
  }

  const fg = createLayerCanvas(fullW, H);
  {
    const ctx = fg.getContext("2d");
    const fx = ox + W * 0.50;
    // 前景石阶与青苔栏墙
    ctx.fillStyle = "#1A2C1D";
    ctx.fillRect(0, H * 0.75, fullW, H * 0.25);
    ctx.fillStyle = "#B8B69D";
    ctx.fillRect(fx - W * 0.12, H * 0.74, W * 0.28, H * 0.036);

    // 漏窗粉墙柱与挺拔青竹（高度探入中景，拖开后变成绝佳园林框景！）
    ctx.fillStyle = "#D9D6C3";
    ctx.fillRect(fx - W * 0.11, H * 0.43, W * 0.09, H * 0.48);
    ctx.fillStyle = "#293C2C";
    ctx.fillRect(fx - W * 0.11, H * 0.43, W * 0.09, H * 0.025);
    // 窗格几何冰裂纹
    ctx.strokeStyle = "#3E5242";
    ctx.lineWidth = 2;
    ctx.strokeRect(fx - W * 0.095, H * 0.48, W * 0.06, H * 0.14);
    ctx.beginPath();
    ctx.moveTo(fx - W * 0.095, H * 0.55);
    ctx.lineTo(fx - W * 0.035, H * 0.55);
    ctx.moveTo(fx - W * 0.065, H * 0.48);
    ctx.lineTo(fx - W * 0.065, H * 0.62);
    ctx.stroke();

    // 青竹竿与竹叶
    for (let i = 0; i < 3; i++) {
      const bx = fx + W * (0.015 + i * 0.035);
      ctx.strokeStyle = i === 1 ? "#4B7432" : "#2D4D20";
      ctx.lineWidth = Math.max(2.5, W * 0.006);
      ctx.beginPath();
      ctx.moveTo(bx, H * 0.96);
      ctx.quadraticCurveTo(bx + W * 0.01, H * 0.68, bx - W * 0.008, H * 0.44);
      ctx.stroke();
      ctx.fillStyle = "#5F8B3E";
      for (let j = 0; j < 5; j++) {
        const ly = H * (0.48 + j * 0.065);
        ctx.beginPath();
        ctx.ellipse(bx + W * 0.02, ly, W * 0.026, H * 0.007, 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(bx - W * 0.018, ly + H * 0.014, W * 0.024, H * 0.0065, -0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return {
    bg: buildBlurPyramid(bg),
    mg: buildBlurPyramid(mg),
    fg: buildBlurPyramid(fg),
    pad,
  };
}

// 缓存各题材预烘焙图层
const LAYER_CACHE = new Map();
function getLayers(sceneId, W, H) {
  const key = `${sceneId}:${W}x${H}`;
  if (!LAYER_CACHE.has(key)) {
    const baked =
      sceneId === "cinema"
        ? paintCinemaLayers(W, H)
        : sceneId === "garden"
          ? paintGardenLayers(W, H)
          : paintAlpineLayers(W, H);
    LAYER_CACHE.set(key, baked);
  }
  return LAYER_CACHE.get(key);
}

// 根据真实综合模糊斑 σ(mm) 在 3 阶金字塔中平滑插值绘制（纯 drawImage，零 filter 开销）
function drawBlurredLayer(ctx, pyramid, dx, dy, dw, dh, sigmaMm, sx = 0, sy = 0, sw = null, sh = null) {
  const srcW = sw ?? pyramid[0].width;
  const srcH = sh ?? pyramid[0].height;
  // 清晰带内 (≤ 0.025mm) 完全锐利；0.025–0.050mm 平滑过渡到明显虚化；0.050–0.12mm 过渡到强散焦
  const level = clamp((sigmaMm - 0.025) / 0.028, 0, 2);
  if (level <= 0.02) {
    ctx.drawImage(pyramid[0], sx, sy, srcW, srcH, dx, dy, dw, dh);
    return;
  }
  const idx = level < 1 ? 0 : 1;
  const t = level < 1 ? level : level - 1;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.drawImage(pyramid[idx], sx, sy, srcW, srcH, dx, dy, dw, dh);
  ctx.globalAlpha = t;
  ctx.drawImage(pyramid[idx + 1], sx, sy, srcW, srcH, dx, dy, dw, dh);
  ctx.restore();
}

// 绘制 084 原海报同款发光青柠双环目标点
function drawPosterDot(ctx, x, y, active, ok, pulse = 0) {
  const col = ok ? "#D8DC56" : "#FF7F66";
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = active ? 2 : 1.4;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.arc(x, y, (active ? 15 : 11) + pulse * 2.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(8,35,23,0.72)";
  ctx.beginPath();
  ctx.arc(x, y, active ? 9 : 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(x, y, active ? 5 : 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 主舞台绘制（支持合像取景 ↔ 084 原海报三景剖片无缝切换；按实际画布比例等比烘焙，杜绝窄屏拉扁/拉长）
export function renderMainStage(canvas, state, ev, opts = {}) {
  const dpr = opts.dpr || 1;
  const cssW = canvas.clientWidth || 640;
  const cssH = canvas.clientHeight || 400;
  const W = Math.max(300, Math.round(cssW * dpr));
  const H = Math.max(200, Math.round(cssH * dpr));
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);

  // 根据画布宽高比就近分档烘焙（宽屏 720×405 / 常规 720×500 / 竖屏近方 640×704），保证圆拱与野花 1:1 不变形
  const ar = W / H;
  const bakeW = ar < 1.08 ? 640 : 720;
  const bakeH = ar < 1.08 ? 704 : ar > 1.62 ? 405 : 500;
  const layers = getLayers(state.scene, bakeW, bakeH);
  const scaleX = W / bakeW;
  const padPx = layers.pad;
  const splitT = clamp(opts.splitMix ?? (state.viewMode === "split" ? 1 : 0), 0, 1);
  const pulse = opts.pulse ?? 0;

  // 辅助：偏移量转换为源图层裁切 x 坐标
  const srcXFor = (offsetNorm) => clamp(padPx - offsetNorm * bakeW, 0, padPx * 2);

  // 层次拉平程度 (toneSep = 0.15 时大幅压缩暗部/亮部反差，模拟全清却黏连的噪点墙)
  const flatAmt = clamp((0.68 - state.toneSep) / 0.53, 0, 1);

  if (splitT < 0.02) {
    // ===== 模式 A：合像取景 =====
    const bgSx = srcXFor(state.bgOffset);
    const mgSx = srcXFor(state.mgOffset);
    const fgSx = srcXFor(state.fgOffset);

    drawBlurredLayer(ctx, layers.bg, 0, 0, W, H, ev.planes.bg.opt.total, bgSx, 0, bakeW, bakeH);
    // 远景空气明暗层次微调
    if (flatAmt > 0.02) {
      ctx.fillStyle = `rgba(42,60,46,${(flatAmt * 0.42).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H * 0.56);
    }

    drawBlurredLayer(ctx, layers.mg, 0, 0, W, H, ev.planes.mg.opt.total, mgSx, 0, bakeW, bakeH);

    if (state.fgEnabled) {
      drawBlurredLayer(ctx, layers.fg, 0, 0, W, H, ev.planes.fg.opt.total, fgSx, 0, bakeW, bakeH);
      if (flatAmt > 0.02) {
        // 压灰前景高光与暗部，让前景和中景黏成同一灰阶
        ctx.fillStyle = `rgba(120,132,110,${(flatAmt * 0.36).toFixed(3)})`;
        ctx.fillRect(0, H * 0.44, W, H * 0.56);
      }
    }

    // 艾里斑衍射整体柔化雾层（f/22–f/32 直观可见微反差发肉）
    if (ev.diffractionFail) {
      const diffT = clamp((ev.airy - AIRY_WARN) / 0.018, 0.25, 1);
      ctx.fillStyle = `rgba(210,224,205,${(diffT * 0.18).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 覆盖层：引导线、遮挡警示框、三景原海报圆点引出针
    if (state.showGuides && !opts.minimal) {
      const pts = ev.geo.pathPts;
      // 1) S 形由近及远视线流（原海报白色曲箭语言）
      ctx.save();
      const sCol = ev.badges.guide ? "rgba(216,220,86,0.88)" : "rgba(255,127,102,0.78)";
      ctx.strokeStyle = sCol;
      ctx.lineWidth = Math.max(1.8, 2 * dpr);
      ctx.setLineDash([7 * dpr, 5 * dpr]);
      ctx.beginPath();
      const p0 = { x: pts[0].x * W, y: pts[0].y * H };
      const p1 = { x: pts[1].x * W, y: pts[1].y * H };
      const p2 = { x: pts[2].x * W, y: pts[2].y * H };
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo((p0.x + p1.x) * 0.5, p1.y + 22 * dpr, p1.x, p1.y);
      ctx.quadraticCurveTo((p1.x + p2.x) * 0.5, p2.y + 18 * dpr, p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);
      // 远景箭头
      const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      ctx.fillStyle = sCol;
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p2.x - 10 * dpr * Math.cos(ang - 0.45), p2.y - 10 * dpr * Math.sin(ang - 0.45));
      ctx.lineTo(p2.x - 10 * dpr * Math.cos(ang + 0.45), p2.y - 10 * dpr * Math.sin(ang + 0.45));
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 2) 前景遮挡中景实绘重叠警示框
      if (ev.geo.occlusionPct > 14 && ev.geo.overlapRect) {
        const r = ev.geo.overlapRect;
        ctx.save();
        ctx.fillStyle = "rgba(255,95,70,0.22)";
        ctx.strokeStyle = "#FF856B";
        ctx.lineWidth = 1.6 * dpr;
        ctx.setLineDash([5 * dpr, 4 * dpr]);
        ctx.fillRect(r.x0 * W, r.y0 * H, (r.x1 - r.x0) * W, (r.y1 - r.y0) * H);
        ctx.strokeRect(r.x0 * W, r.y0 * H, (r.x1 - r.x0) * W, (r.y1 - r.y0) * H);
        ctx.setLineDash([]);
        // 实测遮挡标签
        const lbl = `遮挡中景 ${ev.geo.occlusionPct}% · 左右拖开`;
        ctx.font = `600 ${Math.round(11.5 * dpr)}px "Noto Serif SC", serif`;
        const tw = ctx.measureText(lbl).width + 16 * dpr;
        const bx = clamp((r.x0 + r.x1) * 0.5 * W - tw * 0.5, 10 * dpr, W - tw - 10 * dpr);
        const by = Math.max(12 * dpr, r.y0 * H - 26 * dpr);
        ctx.fillStyle = "rgba(18,16,12,0.88)";
        ctx.fillRect(bx, by, tw, 22 * dpr);
        ctx.strokeStyle = "#FF856B";
        ctx.strokeRect(bx, by, tw, 22 * dpr);
        ctx.fillStyle = "#FFD7CE";
        ctx.fillText(lbl, bx + 8 * dpr, by + 15 * dpr);
        ctx.restore();
      }

      // 3) 左边缘向内射入的三条原海报青柠虚线引出针 + 圆点
      const markers = [
        { key: "bg", x: ev.geo.bgBox.cx * W, y: ev.geo.bgBox.cy * H, ok: ev.planes.bg.sharp, label: `远景 ${formatDist(ev.planes.bg.distM)}` },
        { key: "mg", x: ev.geo.mgBox.cx * W, y: ev.geo.mgBox.cy * H, ok: ev.planes.mg.sharp && ev.geo.occlusionPct <= 14, label: `中景 ${formatDist(ev.planes.mg.distM)}` },
        ...(state.fgEnabled
          ? [{ key: "fg", x: ev.geo.fgBox.cx * W, y: ev.geo.fgBox.cy * H, ok: ev.planes.fg.sharp, label: `前景 ${formatDist(ev.planes.fg.distM)}` }]
          : []),
      ];
      for (const m of markers) {
        const isAct = state.activePlane === m.key;
        ctx.save();
        ctx.strokeStyle = m.ok ? "rgba(216,220,86,0.75)" : "rgba(255,133,107,0.8)";
        ctx.lineWidth = (isAct ? 1.8 : 1.1) * dpr;
        ctx.setLineDash([5 * dpr, 4 * dpr]);
        ctx.beginPath();
        ctx.moveTo(0, m.y);
        ctx.lineTo(m.x - 12 * dpr, m.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        drawPosterDot(ctx, m.x, m.y, isAct, m.ok, isAct ? pulse : 0);
      }
    }
  } else {
    // ===== 模式 B：084 原海报三景剖片（上远景 / 中中景 / 下前景 独立深绿缝隙） =====
    ctx.fillStyle = "#082317";
    ctx.fillRect(0, 0, W, H);
    const gap = Math.round(10 * dpr);
    const bandH = Math.floor((H - gap * 2) / 3);
    const bands = [
      { key: "bg", title: "远景 BACKGROUND", y: 0, sy: 0.04, sh: 0.44, offset: state.bgOffset, py: layers.bg, opt: ev.planes.bg.opt, ok: ev.planes.bg.sharp, extraBg: null },
      { key: "mg", title: "中景 MIDGROUND", y: bandH + gap, sy: 0.36, sh: 0.34, offset: state.mgOffset, py: layers.mg, opt: ev.planes.mg.opt, ok: ev.planes.mg.sharp && ev.geo.occlusionPct <= 14, extraBg: layers.bg },
      { key: "fg", title: "前景 FOREGROUND", y: (bandH + gap) * 2, sy: 0.46, sh: 0.52, offset: state.fgOffset, py: layers.fg, opt: ev.planes.fg.opt, ok: ev.planes.fg.sharp, extraBg: layers.mg },
    ];
    for (const b of bands) {
      const sx = srcXFor(b.offset);
      const syPx = Math.round(b.sy * bakeH);
      const shPx = Math.round(b.sh * bakeH);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, b.y, W, bandH);
      ctx.clip();
      // 中景/前景片底铺柔和底色或远层氛围
      if (b.key === "mg") {
        ctx.drawImage(layers.bg[0], srcXFor(state.bgOffset), Math.round(0.24 * bakeH), bakeW, Math.round(0.40 * bakeH), 0, b.y, W, bandH);
        ctx.fillStyle = "rgba(18,44,32,0.16)";
        ctx.fillRect(0, b.y, W, bandH);
        drawBlurredLayer(ctx, b.py, 0, b.y, W, bandH, b.opt.total, sx, syPx, bakeW, shPx);
      } else if (b.key === "fg") {
        ctx.fillStyle = "#1E3018";
        ctx.fillRect(0, b.y, W, bandH);
        if (state.fgEnabled) {
          drawBlurredLayer(ctx, b.py, 0, b.y, W, bandH, b.opt.total, sx, syPx, bakeW, shPx);
        }
      } else {
        drawBlurredLayer(ctx, b.py, 0, b.y, W, bandH, b.opt.total, sx, syPx, bakeW, shPx);
      }
      ctx.restore();

      // 剖片角标与单层实测模糊斑
      const isAct = state.activePlane === b.key;
      ctx.strokeStyle = isAct ? "#D8DC56" : "rgba(216,220,86,0.34)";
      ctx.lineWidth = (isAct ? 2 : 1) * dpr;
      ctx.strokeRect(0.5 * dpr, b.y + 0.5 * dpr, W - dpr, bandH - dpr);

      const chipText = `${b.title} · σ ${b.opt.total.toFixed(3)}mm ${b.ok ? "✓" : "×"}`;
      ctx.font = `600 ${Math.round(11 * dpr)}px "Space Mono", "Noto Serif SC", monospace`;
      const cw = ctx.measureText(chipText).width + 16 * dpr;
      ctx.fillStyle = "rgba(8,35,23,0.86)";
      ctx.fillRect(10 * dpr, b.y + 8 * dpr, cw, 22 * dpr);
      ctx.fillStyle = b.ok ? "#D8DC56" : "#FF8F76";
      ctx.fillText(chipText, 18 * dpr, b.y + 23 * dpr);
    }
  }

  // 右上角光学参数角签（简洁不压画面）
  if (!opts.minimal) {
    const hud = `${state.focalMm}mm · f/${state.aperture} · u ${formatDist(state.focusM)} · H ${ev.dof.H.toFixed(2)}m`;
    ctx.save();
    ctx.font = `700 ${Math.round(11 * dpr)}px "Space Mono", "Noto Serif SC", monospace`;
    const hw = ctx.measureText(hud).width + 18 * dpr;
    const hx = W - hw - 10 * dpr;
    const hy = 10 * dpr;
    ctx.fillStyle = "rgba(6,26,17,0.86)";
    ctx.fillRect(hx, hy, hw, 24 * dpr);
    ctx.strokeStyle = ev.allPass ? "#D8DC56" : "rgba(216,220,86,0.52)";
    ctx.lineWidth = 1 * dpr;
    ctx.strokeRect(hx, hy, hw, 24 * dpr);
    ctx.fillStyle = "#F3F2E5";
    ctx.fillText(hud, hx + 9 * dpr, hy + 16 * dpr);
    ctx.restore();
  }

  return { W, H, scaleX };
}

// 供 01 节剥层演示、02 节拉幕对比、06 节测验缩略画幅复用的轻量同源绘制
export function renderMiniDeepFocus(canvas, customState, extra = {}) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ev = evaluate(customState);
  renderMainStage(canvas, { ...customState, viewMode: "unified", showGuides: extra.showGuides ?? false }, ev, {
    dpr,
    minimal: !extra.showHud,
    splitMix: 0,
  });
}

// 01 节「三层剥离演示画布」：可单独开关 BG / MG / FG，观察缺任意一层后的空间塌陷
export function renderLayerPeelCanvas(canvas, flags) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth || 560;
  const cssH = canvas.clientHeight || 340;
  const W = Math.round(cssW * dpr);
  const H = Math.round(cssH * dpr);
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext("2d");
  const bakeW = 720;
  const bakeH = 500;
  const layers = getLayers("alpine", bakeW, bakeH);
  const pad = layers.pad;

  // 若抽走远景，则以素色闷灰背景板替代，直观看到「失去环境延展与透气空间」
  if (flags.bg) {
    ctx.drawImage(layers.bg[0], pad - 0.06 * bakeW, 0, bakeW, bakeH, 0, 0, W, H);
  } else {
    ctx.fillStyle = "#2E3B33";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(232,238,225,0.22)";
    ctx.font = `600 ${Math.round(13 * dpr)}px "Noto Serif SC", serif`;
    ctx.fillText("远景抽空：失去天际线与空间延展", 22 * dpr, 38 * dpr);
  }

  if (flags.mg) {
    ctx.drawImage(layers.mg[0], pad - 0.08 * bakeW, 0, bakeW, bakeH, 0, 0, W, H);
  } else {
    ctx.save();
    ctx.strokeStyle = "rgba(216,220,86,0.7)";
    ctx.setLineDash([6 * dpr, 5 * dpr]);
    ctx.lineWidth = 1.4 * dpr;
    ctx.beginPath();
    ctx.moveTo(16 * dpr, H * 0.56);
    ctx.lineTo(W - 16 * dpr, H * 0.56);
    ctx.stroke();
    ctx.fillStyle = "rgba(8,35,23,0.82)";
    ctx.fillRect(W * 0.5 - 110 * dpr, H * 0.50, 220 * dpr, 26 * dpr);
    ctx.fillStyle = "#EDE85F";
    ctx.font = `600 ${Math.round(12 * dpr)}px "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    ctx.fillText("中景抽空：近远之间出现断层", W * 0.5, H * 0.50 + 17 * dpr);
    ctx.restore();
  }

  if (flags.fg) {
    ctx.drawImage(layers.fg[0], pad + 0.25 * bakeW, 0, bakeW, bakeH, 0, 0, W, H);
  } else {
    ctx.save();
    ctx.fillStyle = "rgba(8,35,23,0.78)";
    ctx.fillRect(16 * dpr, H - 40 * dpr, 240 * dpr, 26 * dpr);
    ctx.fillStyle = "#EDE85F";
    ctx.font = `600 ${Math.round(12 * dpr)}px "Noto Serif SC", serif`;
    ctx.fillText("前景抽空：缺尺度锚点，像远处明信片", 26 * dpr, H - 22 * dpr);
    ctx.restore();
  }
}

// 02 节「清晰≠杂乱」前后拉幕对比画布（左侧：全清但乱；右侧：4 维非虚化秩序控制）
export function renderClutterSplitCanvas(canvas, splitRatio, levers) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth || 640;
  const cssH = canvas.clientHeight || 360;
  const W = Math.round(cssW * dpr);
  const H = Math.round(cssH * dpr);
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext("2d");
  const bakeW = 720;
  const bakeH = 500;
  const layers = getLayers("alpine", bakeW, bakeH);
  const pad = layers.pad;
  const cutX = Math.round(clamp(splitRatio, 0.08, 0.92) * W);

  // 左侧：全清晰但未做秩序整理（居中遮挡 + 平反差 + 无冷暖 + 无引导线）
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, cutX, H);
  ctx.clip();
  ctx.drawImage(layers.bg[0], pad + 0.14 * bakeW, 0, bakeW, bakeH, 0, 0, W, H);
  ctx.fillStyle = "rgba(38,52,40,0.42)";
  ctx.fillRect(0, 0, W, H * 0.56);
  ctx.drawImage(layers.mg[0], pad, 0, bakeW, bakeH, 0, 0, W, H);
  ctx.drawImage(layers.fg[0], pad, 0, bakeW, bakeH, 0, 0, W, H);
  ctx.fillStyle = "rgba(118,128,108,0.34)";
  ctx.fillRect(0, H * 0.44, W, H * 0.56);
  ctx.restore();

  // 右侧：按用户开启的 4 项非虚化分离杠杆实时合成
  ctx.save();
  ctx.beginPath();
  ctx.rect(cutX, 0, W - cutX, H);
  ctx.clip();
  const fgOff = levers.offset ? -0.25 : 0.0;
  const mgOff = levers.offset ? 0.09 : 0.0;
  const bgOff = levers.offset ? 0.06 : -0.14;
  ctx.drawImage(layers.bg[0], pad - bgOff * bakeW, 0, bakeW, bakeH, 0, 0, W, H);
  if (!levers.tone) {
    ctx.fillStyle = "rgba(40,56,44,0.40)";
    ctx.fillRect(0, 0, W, H * 0.56);
  }
  if (levers.temp) {
    // 远景冷青薄岚
    ctx.fillStyle = "rgba(155,205,210,0.16)";
    ctx.fillRect(0, 0, W, H * 0.44);
  }
  ctx.drawImage(layers.mg[0], pad - mgOff * bakeW, 0, bakeW, bakeH, 0, 0, W, H);
  ctx.drawImage(layers.fg[0], pad - fgOff * bakeW, 0, bakeW, bakeH, 0, 0, W, H);
  if (!levers.tone) {
    ctx.fillStyle = "rgba(116,128,106,0.34)";
    ctx.fillRect(0, H * 0.44, W, H * 0.56);
  }
  if (levers.temp) {
    // 前景微暖金光
    const warm = ctx.createLinearGradient(0, H * 0.65, 0, H);
    warm.addColorStop(0, "rgba(235,196,105,0)");
    warm.addColorStop(1, "rgba(225,176,72,0.16)");
    ctx.fillStyle = warm;
    ctx.fillRect(0, H * 0.65, W, H * 0.35);
  }
  if (levers.line) {
    ctx.strokeStyle = "#EDE85F";
    ctx.lineWidth = 2.2 * dpr;
    ctx.setLineDash([7 * dpr, 5 * dpr]);
    ctx.beginPath();
    ctx.moveTo(W * (0.5 + fgOff + 0.06), H * 0.90);
    ctx.quadraticCurveTo(W * 0.56, H * 0.66, W * (0.5 + mgOff), H * 0.54);
    ctx.quadraticCurveTo(W * 0.54, H * 0.38, W * (0.64 + bgOff), H * 0.25);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  // 中缝拉幕线与标牌
  ctx.strokeStyle = "#EDE85F";
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();
  ctx.moveTo(cutX, 0);
  ctx.lineTo(cutX, H);
  ctx.stroke();

  ctx.fillStyle = "#082317";
  ctx.beginPath();
  ctx.arc(cutX, H * 0.5, 16 * dpr, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#EDE85F";
  ctx.lineWidth = 2 * dpr;
  ctx.stroke();
  ctx.fillStyle = "#EDE85F";
  ctx.font = `700 ${Math.round(12 * dpr)}px "Space Mono", monospace`;
  ctx.textAlign = "center";
  ctx.fillText("↔", cutX, H * 0.5 + 4.5 * dpr);

  // 左右角标
  ctx.textAlign = "left";
  ctx.font = `600 ${Math.round(11 * dpr)}px "Noto Serif SC", serif`;
  ctx.fillStyle = "rgba(8,35,23,0.85)";
  ctx.fillRect(10 * dpr, 10 * dpr, 126 * dpr, 24 * dpr);
  ctx.fillStyle = "#FFB4A2";
  ctx.fillText("未整理：全清杂乱", 18 * dpr, 26 * dpr);

  const activeN = [levers.tone, levers.temp, levers.line, levers.offset].filter(Boolean).length;
  const rTxt = `秩序分层：已开 ${activeN}/4`;
  const rw = ctx.measureText(rTxt).width + 18 * dpr;
  ctx.fillStyle = "rgba(8,35,23,0.85)";
  ctx.fillRect(W - rw - 10 * dpr, 10 * dpr, rw, 24 * dpr);
  ctx.fillStyle = activeN >= 3 ? "#D8DC56" : "#F3F2E5";
  ctx.fillText(rTxt, W - rw - 1 * dpr, 26 * dpr);
}

// 缓存甜区相图底图（仅随焦段 f 变化，拖动光圈/对焦时 0 重复计算）
const PHASE_CACHE = new Map();
function getPhaseMapBitmap(focalMm, mapW, mapH) {
  const key = `${focalMm}:${mapW}x${mapH}`;
  if (PHASE_CACHE.has(key)) return PHASE_CACHE.get(key);
  const c = document.createElement("canvas");
  c.width = mapW;
  c.height = mapH;
  const g = c.getContext("2d");
  const cols = 28;
  const rows = 20;
  const apMin = Math.log(2.0);
  const apMax = Math.log(32.0);
  const lMin = Math.log(0.5);
  const lMax = Math.log(120);
  const cellW = mapW / cols;
  const cellH = mapH / rows;
  const fM = focalMm / 1000;
  const cocAt = (N, u, s) => {
    const den = N * Math.max(u - fM, 1e-4) * s * 1000;
    return (focalMm * focalMm * Math.abs(s - u)) / Math.max(den, 1e-6);
  };
  for (let col = 0; col < cols; col++) {
    const N = Math.exp(apMin + ((col + 0.5) / cols) * (apMax - apMin));
    const airyC = 2.44 * 0.00055 * N;
    for (let row = 0; row < rows; row++) {
      const u = Math.exp(lMin + (1 - (row + 0.5) / rows) * (lMax - lMin));
      const fgS = Math.hypot(cocAt(N, u, 1.5), airyC) <= SHARP_SIGMA;
      const mgS = Math.hypot(cocAt(N, u, 6.0), airyC) <= SHARP_SIGMA;
      const bgS = Math.hypot(cocAt(N, u, 120), airyC) <= SHARP_SIGMA;
      let fill = "#122B20";
      if (airyC > AIRY_WARN) fill = "rgba(222,120,82,0.34)";
      else if (fgS && mgS && bgS) fill = "rgba(216,220,86,0.74)";
      else if (bgS && !fgS) fill = "rgba(92,146,128,0.28)";
      else if (fgS && !bgS) fill = "rgba(128,158,92,0.26)";
      g.fillStyle = fill;
      g.fillRect(col * cellW, row * cellH, cellW + 0.6, cellH + 0.6);
    }
  }
  PHASE_CACHE.set(key, c);
  return c;
}

// 03 节「光学光路锥 + 光圈×对焦二维甜区相图」（窄屏自动上下分排，杜绝文字拥挤重叠）
export function renderOpticsLabCanvas(canvas, focalMm, aperture, focusM) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth || 720;
  const cssH = canvas.clientHeight || 340;
  const W = Math.round(cssW * dpr);
  const H = Math.round(cssH * dpr);
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#061B12";
  ctx.fillRect(0, 0, W, H);

  const stacked = cssW < 540;
  const padL = (stacked ? 16 : 22) * dpr;
  const padR = (stacked ? 16 : 16) * dpr;

  const rayBoxH = stacked ? Math.round(H * 0.44) : H;
  const trackY = stacked ? rayBoxH * 0.54 : H * 0.52;
  const trackL = padL + 42 * dpr;
  const trackR = stacked ? W - padR : Math.round(W * 0.55) - padR;
  const trackW = Math.max(120 * dpr, trackR - trackL);

  const lMin = Math.log(0.5);
  const lMax = Math.log(120);
  const mToX = (m) => trackL + clamp((Math.log(clamp(m, 0.5, 120)) - lMin) / (lMax - lMin), 0, 1) * trackW;

  const lensX = trackL - 10 * dpr;
  const halfBox = (stacked ? 20 : 26) * dpr;
  ctx.fillStyle = "#163B29";
  ctx.fillRect(padL, trackY - halfBox, 24 * dpr, halfBox * 2);
  ctx.strokeStyle = "#D8DC56";
  ctx.lineWidth = 1.4 * dpr;
  ctx.strokeRect(padL, trackY - halfBox, 24 * dpr, halfBox * 2);
  const irisOpen = clamp((stacked ? 14 : 18) * (2.8 / aperture), 2.5, stacked ? 16 : 20) * dpr;
  ctx.strokeStyle = "#EDE85F";
  ctx.lineWidth = 2.4 * dpr;
  ctx.beginPath();
  ctx.moveTo(lensX, trackY - (halfBox - 2 * dpr));
  ctx.lineTo(lensX, trackY - irisOpen);
  ctx.moveTo(lensX, trackY + irisOpen);
  ctx.lineTo(lensX, trackY + (halfBox - 2 * dpr));
  ctx.stroke();

  const ev = evaluate({ scene: "alpine", focalMm, aperture, focusM, fgOffset: -0.25, mgOffset: 0.08, bgOffset: 0.06, toneSep: 0.82, fgEnabled: true });
  const nearX = mToX(ev.dof.near);
  const farX = ev.dof.far === Infinity ? trackR : mToX(ev.dof.far);
  const focusX = mToX(focusM);
  const hyperX = mToX(ev.dof.H);
  const zoneHalf = (stacked ? 38 : 54) * dpr;

  ctx.fillStyle = ev.diffractionFail ? "rgba(255,127,102,0.18)" : "rgba(216,220,86,0.18)";
  ctx.fillRect(nearX, trackY - zoneHalf, Math.max(4 * dpr, farX - nearX), zoneHalf * 2);
  ctx.strokeStyle = ev.diffractionFail ? "#FF856B" : "#D8DC56";
  ctx.lineWidth = 1.4 * dpr;
  ctx.strokeRect(nearX, trackY - zoneHalf, Math.max(4 * dpr, farX - nearX), zoneHalf * 2);

  ctx.strokeStyle = "rgba(216,220,86,0.42)";
  ctx.lineWidth = 1.2 * dpr;
  ctx.beginPath();
  ctx.moveTo(lensX, trackY - irisOpen);
  ctx.lineTo(focusX, trackY);
  ctx.lineTo(trackR, trackY + irisOpen * 0.8);
  ctx.moveTo(lensX, trackY + irisOpen);
  ctx.lineTo(focusX, trackY);
  ctx.lineTo(trackR, trackY - irisOpen * 0.8);
  ctx.stroke();

  const axisY = trackY + zoneHalf + 14 * dpr;
  ctx.strokeStyle = "#2E5643";
  ctx.beginPath();
  ctx.moveTo(trackL, axisY);
  ctx.lineTo(trackR, axisY);
  ctx.stroke();

  const ticks = stacked
    ? [
        [0.5, "0.5m"],
        [1.5, "1.5m"],
        [6.0, "6m"],
        [20, "20m"],
        [120, "∞"],
      ]
    : [
        [0.5, "0.5m"],
        [1.5, "前景1.5m"],
        [6.0, "中景6m"],
        [20, "20m"],
        [120, "远景∞"],
      ];
  ctx.font = `400 ${Math.round((stacked ? 9.5 : 10) * dpr)}px "Space Mono", "Noto Serif SC", monospace`;
  ctx.textAlign = "center";
  for (const [m, lbl] of ticks) {
    const x = mToX(m);
    ctx.strokeStyle = m === 1.5 || m === 6 || m === 120 ? "#D8DC56" : "#3E6B55";
    ctx.beginPath();
    ctx.moveTo(x, axisY - 5 * dpr);
    ctx.lineTo(x, axisY + 5 * dpr);
    ctx.stroke();
    ctx.fillStyle = "#B8CDBF";
    ctx.fillText(lbl, clamp(x, trackL + 12 * dpr, trackR - 10 * dpr), axisY + 18 * dpr);
  }

  const pts = [
    { m: 1.5, name: "前", opt: ev.planes.fg.opt, ok: ev.planes.fg.sharp },
    { m: 6.0, name: "中", opt: ev.planes.mg.opt, ok: ev.planes.mg.sharp },
    { m: 120, name: "远", opt: ev.planes.bg.opt, ok: ev.planes.bg.sharp },
  ];
  for (const p of pts) {
    const x = mToX(p.m);
    const r = clamp(p.opt.total * (stacked ? 160 : 210), 4, stacked ? 16 : 22) * dpr;
    ctx.fillStyle = p.ok ? "rgba(127,227,152,0.32)" : "rgba(255,127,102,0.36)";
    ctx.strokeStyle = p.ok ? "#7FE398" : "#FF856B";
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.arc(x, trackY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#F3F2E5";
    ctx.font = `700 ${Math.round(10 * dpr)}px "Noto Serif SC", serif`;
    ctx.fillText(p.name, x, trackY - r - 5 * dpr);
  }

  ctx.strokeStyle = "#EDE85F";
  ctx.setLineDash([4 * dpr, 3 * dpr]);
  ctx.beginPath();
  ctx.moveTo(hyperX, trackY - zoneHalf - 12 * dpr);
  ctx.lineTo(hyperX, axisY - 4 * dpr);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#EDE85F";
  ctx.font = `700 ${Math.round(10.5 * dpr)}px "Space Mono", "Noto Serif SC", monospace`;
  ctx.fillText(`H=${ev.dof.H.toFixed(2)}m`, clamp(hyperX, trackL + 36 * dpr, trackR - 36 * dpr), trackY - zoneHalf - 16 * dpr);

  ctx.fillStyle = "#F3F2E5";
  ctx.beginPath();
  ctx.moveTo(focusX, trackY - zoneHalf - 6 * dpr);
  ctx.lineTo(focusX + 5.5 * dpr, trackY - zoneHalf + 1 * dpr);
  ctx.lineTo(focusX, trackY - zoneHalf + 8 * dpr);
  ctx.lineTo(focusX - 5.5 * dpr, trackY - zoneHalf + 1 * dpr);
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = "left";
  ctx.fillStyle = "#F3F2E5";
  ctx.font = `700 ${Math.round(12 * dpr)}px "Noto Serif SC", serif`;
  ctx.fillText(`侧视光路 · 艾里斑 ${(ev.airy * 1000).toFixed(0)} μm`, padL, 22 * dpr);

  // 二维甜区相图（宽屏在右半、窄屏在下半）
  const mapL = stacked ? padL + 34 * dpr : Math.round(W * 0.56) + 34 * dpr;
  const mapR = W - 18 * dpr;
  const mapT = stacked ? rayBoxH + 34 * dpr : 40 * dpr;
  const mapB = H - 34 * dpr;
  const mapW = Math.max(60, Math.round(mapR - mapL));
  const mapH = Math.max(60, Math.round(mapB - mapT));

  if (stacked) {
    ctx.strokeStyle = "#204433";
    ctx.beginPath();
    ctx.moveTo(padL, rayBoxH + 4 * dpr);
    ctx.lineTo(W - padR, rayBoxH + 4 * dpr);
    ctx.stroke();
  }

  ctx.fillStyle = "#F3F2E5";
  ctx.font = `700 ${Math.round(12 * dpr)}px "Noto Serif SC", serif`;
  ctx.fillText(stacked ? "甜区相图（点或拖青柠区）" : "甜区相图（点或拖寻找青柠区）", stacked ? padL : mapL, stacked ? rayBoxH + 24 * dpr : 22 * dpr);

  const phaseImg = getPhaseMapBitmap(focalMm, mapW, mapH);
  ctx.drawImage(phaseImg, mapL, mapT, mapW, mapH);
  ctx.strokeStyle = "#3E6B55";
  ctx.lineWidth = 1 * dpr;
  ctx.strokeRect(mapL, mapT, mapW, mapH);

  const apMin = Math.log(2.0);
  const apMax = Math.log(32.0);
  const curX = mapL + clamp((Math.log(aperture) - apMin) / (apMax - apMin), 0, 1) * mapW;
  const curY = mapT + (1 - clamp((Math.log(focusM) - lMin) / (lMax - lMin), 0, 1)) * mapH;
  ctx.strokeStyle = "#082317";
  ctx.lineWidth = 3 * dpr;
  ctx.beginPath();
  ctx.arc(curX, curY, 7 * dpr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();
  ctx.arc(curX, curY, 7 * dpr, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#B8CDBF";
  ctx.font = `400 ${Math.round(10 * dpr)}px "Space Mono", "Noto Serif SC", monospace`;
  ctx.textAlign = "left";
  ctx.fillText("f/2", mapL, mapB + 16 * dpr);
  ctx.textAlign = "center";
  ctx.fillText(stacked ? "f/8–f/14 甜区" : "f/8–f/14 甜区", mapL + mapW * 0.52, mapB + 16 * dpr);
  ctx.textAlign = "right";
  ctx.fillText("f/32 衍射", mapR, mapB + 16 * dpr);

  ctx.textAlign = "right";
  ctx.fillText("∞", mapL - 5 * dpr, mapT + 9 * dpr);
  ctx.fillText("2m", mapL - 5 * dpr, mapT + mapH * 0.72);
  ctx.fillText("0.5m", mapL - 5 * dpr, mapB);

  return {
    mapRectCss: {
      x: mapL / dpr,
      y: mapT / dpr,
      w: mapW / dpr,
      h: mapH / dpr,
    },
  };
}

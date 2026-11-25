// 166 图录版式 2D 活体图录印张画布
// 1:1 手绘复刻原海报 9 枚构图艺术标本 + 青铜器物图库 + 工业座椅图库
// 支持横拖尺度标尺（data-perf-drag）、点击任意标本卡切换 VS 对照配对、印刷校样红铅笔实况批注。

import { PALETTE, clamp } from "./model.js";

// ---------- 1:1 复刻原海报 9 枚构图标本 + 博物青铜 + 工业座椅 ----------
function drawSpecimenArt(ctx, themeId, itemId, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const cx = x + w / 2;
  const cy = y + h / 2;
  const m = Math.min(w, h);

  if (themeId === "poster") {
    switch (itemId) {
      case "central": {
        // 中心构图：暖米底 + 虚线十字 + 朱红大圆 + 右下小黑点
        ctx.fillStyle = "#F0E6D4";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "#8C8272";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x + w * 0.12, cy);
        ctx.lineTo(x + w * 0.88, cy);
        ctx.moveTo(cx, y + h * 0.08);
        ctx.lineTo(cx, y + h * 0.92);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#E14B21";
        ctx.beginPath();
        ctx.arc(cx, cy, m * 0.34, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0F1114";
        ctx.beginPath();
        ctx.arc(x + w * 0.88, y + h * 0.86, Math.max(2.2, m * 0.048), 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "diagonal": {
        // 对角线构图：松绿底 + 明黄斜带 + 右下平行白箭头
        ctx.fillStyle = "#10795C";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#EEB71E";
        const bw = m * 0.16;
        ctx.beginPath();
        ctx.moveTo(x - bw, y + h);
        ctx.lineTo(x + bw, y + h);
        ctx.lineTo(x + w + bw * 0.2, y);
        ctx.lineTo(x + w - bw * 1.4, y);
        ctx.closePath();
        ctx.fill();
        // 白色斜向箭头
        const ax1 = x + w * 0.42;
        const ay1 = y + h * 0.84;
        const ax2 = x + w * 0.88;
        const ay2 = y + h * 0.24;
        ctx.strokeStyle = "#FAF4EA";
        ctx.lineWidth = Math.max(1.3, m * 0.022);
        ctx.beginPath();
        ctx.moveTo(ax1, ay1);
        ctx.lineTo(ax2, ay2);
        ctx.stroke();
        const ang = Math.atan2(ay2 - ay1, ax2 - ax1);
        const hl = Math.max(4.5, m * 0.09);
        ctx.beginPath();
        ctx.moveTo(ax2 - hl * Math.cos(ang - 0.55), ay2 - hl * Math.sin(ang - 0.55));
        ctx.lineTo(ax2, ay2);
        ctx.lineTo(ax2 - hl * Math.cos(ang + 0.55), ay2 - hl * Math.sin(ang + 0.55));
        ctx.stroke();
        break;
      }
      case "scattered": {
        // 散点式构图：纯黑底 + 错落大小钴蓝圆 + 细白十字星
        ctx.fillStyle = "#0E1011";
        ctx.fillRect(x, y, w, h);
        const dots = [
          [0.24, 0.26, 0.06],
          [0.48, 0.44, 0.115],
          [0.74, 0.22, 0.042],
          [0.83, 0.42, 0.068],
          [0.18, 0.70, 0.072],
          [0.54, 0.78, 0.048],
          [0.86, 0.80, 0.055],
          [0.70, 0.90, 0.042],
        ];
        ctx.fillStyle = "#1C52C7";
        for (const [rx, ry, rr] of dots) {
          ctx.beginPath();
          ctx.arc(x + w * rx, y + h * ry, Math.max(1.8, m * rr), 0, Math.PI * 2);
          ctx.fill();
        }
        const crosses = [
          [0.56, 0.18],
          [0.14, 0.42],
          [0.32, 0.76],
          [0.72, 0.62],
        ];
        ctx.strokeStyle = "#DCE7FA";
        ctx.lineWidth = 1;
        const cs = Math.max(2.5, m * 0.042);
        for (const [rx, ry] of crosses) {
          const px = x + w * rx;
          const py = y + h * ry;
          ctx.beginPath();
          ctx.moveTo(px - cs, py);
          ctx.lineTo(px + cs, py);
          ctx.moveTo(px, py - cs);
          ctx.lineTo(px, py + cs);
          ctx.stroke();
        }
        break;
      }
      case "triangular": {
        // 三角形构图：朱红底 + 米白大三角 + 顶内纯黑圆点
        ctx.fillStyle = "#E85324";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#F2E8D7";
        ctx.beginPath();
        ctx.moveTo(cx, y + h * 0.08);
        ctx.lineTo(x + w * 0.07, y + h);
        ctx.lineTo(x + w * 0.93, y + h);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#0F1114";
        ctx.beginPath();
        ctx.arc(cx, y + h * 0.37, Math.max(3, m * 0.082), 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "ninegrid": {
        // 九宫格构图：钴蓝底 + 细白三乘三线 + 中心大金方 + 四角小金方 + 四边米白圆
        ctx.fillStyle = "#1B4DBD";
        ctx.fillRect(x, y, w, h);
        const pad = Math.max(4, m * 0.07);
        const gx = x + pad;
        const gy = y + pad;
        const gw = w - pad * 2;
        const gh = h - pad * 2;
        ctx.strokeStyle = "rgba(250,244,234,0.85)";
        ctx.lineWidth = 1;
        ctx.strokeRect(gx, gy, gw, gh);
        for (let i = 1; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(gx + (gw * i) / 3, gy);
          ctx.lineTo(gx + (gw * i) / 3, gy + gh);
          ctx.moveTo(gx, gy + (gh * i) / 3);
          ctx.lineTo(gx + gw, gy + (gh * i) / 3);
          ctx.stroke();
        }
        const cw = gw / 3;
        const ch = gh / 3;
        // 中心大金方
        ctx.fillStyle = "#EEB71E";
        ctx.fillRect(gx + cw + cw * 0.14, gy + ch + ch * 0.12, cw * 0.72, ch * 0.76);
        // 四角小金方
        for (const [rc, rr] of [
          [0, 0],
          [2, 0],
          [0, 2],
          [2, 2],
        ]) {
          const sw = Math.min(cw, ch) * 0.34;
          ctx.fillRect(gx + rc * cw + (cw - sw) / 2, gy + rr * ch + (ch - sw) / 2, sw, sw);
        }
        // 四边米白圆
        ctx.fillStyle = "#F5EDE0";
        for (const [rc, rr] of [
          [1, 0],
          [0, 1],
          [2, 1],
          [1, 2],
        ]) {
          ctx.beginPath();
          ctx.arc(gx + (rc + 0.5) * cw, gy + (rr + 0.5) * ch, Math.min(cw, ch) * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case "enveloping": {
        // 包围式构图：樱粉底 + 粗米白缺口框 + 偏心玫红实圆
        ctx.fillStyle = "#F1B6C3";
        ctx.fillRect(x, y, w, h);
        const bw = Math.max(5, m * 0.11);
        const ix = x + w * 0.22;
        const iy = y + h * 0.15;
        const iw = w * 0.58;
        const ih = h * 0.72;
        ctx.strokeStyle = "#EFE6D8";
        ctx.lineWidth = bw;
        ctx.beginPath();
        ctx.moveTo(ix, iy + ih * 0.42);
        ctx.lineTo(ix, iy);
        ctx.lineTo(ix + iw, iy);
        ctx.lineTo(ix + iw, iy + ih);
        ctx.lineTo(ix + iw * 0.26, iy + ih);
        ctx.stroke();
        ctx.fillStyle = "#EE6799";
        ctx.beginPath();
        ctx.arc(x + w * 0.52, y + h * 0.57, m * 0.19, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "curvilinear": {
        // 曲线式构图：深紫底 + 柔粉 S 飘带 + 玫红圆点
        ctx.fillStyle = "#2C1B4A";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "#CA70A1";
        ctx.lineWidth = Math.max(3, m * 0.085);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - 4, y + h * 0.22);
        ctx.bezierCurveTo(
          x + w * 0.34,
          y + h * 0.14,
          x + w * 0.24,
          y + h * 0.62,
          x + w * 0.56,
          y + h * 0.44
        );
        ctx.bezierCurveTo(
          x + w * 0.76,
          y + h * 0.31,
          x + w * 0.84,
          y + h * 0.36,
          x + w + 4,
          y + h * 0.56
        );
        ctx.stroke();
        ctx.fillStyle = "#EE6799";
        ctx.beginPath();
        ctx.arc(x + w * 0.64, y + h * 0.72, Math.max(3, m * 0.105), 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "segmentation": {
        // 分割式构图：明黄底 + A / B / C 粗黑块字与排版线
        ctx.fillStyle = "#F9C42B";
        ctx.fillRect(x, y, w, h);
        const splitX = x + w * 0.42;
        const splitY = y + h * 0.48;
        ctx.strokeStyle = "rgba(15,17,20,0.45)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(splitX, y);
        ctx.lineTo(splitX, y + h);
        ctx.moveTo(splitX, splitY);
        ctx.lineTo(x + w, splitY);
        ctx.stroke();
        ctx.fillStyle = "#0F1114";
        ctx.font = `900 ${Math.max(11, Math.round(m * 0.26))}px "Chivo", sans-serif`;
        ctx.textBaseline = "top";
        ctx.fillText("A", x + w * 0.09, y + h * 0.22);
        ctx.font = `900 ${Math.max(9, Math.round(m * 0.18))}px "Chivo", sans-serif`;
        ctx.fillText("B", splitX + w * 0.08, y + h * 0.09);
        ctx.fillText("C", splitX + w * 0.08, splitY + h * 0.14);
        // 模拟正文细线
        ctx.fillStyle = "rgba(15,17,20,0.65)";
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(splitX + w * 0.08, y + h * (0.29 + i * 0.042), w * (0.42 - i * 0.04), 1.4);
        }
        break;
      }
      case "fourcorner": {
        // 四角式构图：米白底 + 四角松绿 1/4 圆扇 + 对角虚线 + 中心十字
        ctx.fillStyle = "#F0E7D6";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "#8C8476";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h);
        ctx.moveTo(x + w, y);
        ctx.lineTo(x, y + h);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#0C8268";
        const cr = m * 0.22;
        for (const [px, py, a0, a1] of [
          [x, y, 0, Math.PI / 2],
          [x + w, y, Math.PI / 2, Math.PI],
          [x + w, y + h, Math.PI, Math.PI * 1.5],
          [x, y + h, Math.PI * 1.5, Math.PI * 2],
        ]) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.arc(px, py, cr, a0, a1);
          ctx.closePath();
          ctx.fill();
        }
        const cs = Math.max(4, m * 0.09);
        ctx.strokeStyle = "#0F1114";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx - cs, cy);
        ctx.lineTo(cx + cs, cy);
        ctx.moveTo(cx, cy - cs);
        ctx.lineTo(cx, cy + cs);
        ctx.stroke();
        break;
      }
    }
  } else if (themeId === "bronze") {
    // 博物青铜图录：高对比复古版画米底 + 铜绿/钴蓝/朱红几何器物侧影
    const bgMap = {
      ding: "#EFE7D8",
      gu: "#EBF0F8",
      pan: "#F4E9DF",
      fangzun: "#EAE4D6",
      jue: "#F6EED9",
      gui: "#EBF2EE",
      you: "#EFEAF4",
      fangding: "#EBF0F8",
      zhong: "#F5EAE4",
    };
    ctx.fillStyle = bgMap[itemId] || "#EFE7D8";
    ctx.fillRect(x, y, w, h);
    // 博物器物地平基准线
    const baseY = y + h * 0.84;
    ctx.strokeStyle = "rgba(15,17,20,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, baseY);
    ctx.lineTo(x + w * 0.9, baseY);
    ctx.stroke();

    ctx.fillStyle = "#105E4A";
    ctx.strokeStyle = "#0F1114";
    ctx.lineWidth = Math.max(1.2, m * 0.02);

    if (itemId === "ding") {
      // 三足圆鼎
      ctx.fillStyle = "#10795C";
      ctx.beginPath();
      ctx.arc(cx, y + h * 0.44, m * 0.25, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(cx - m * 0.25, y + h * 0.34, m * 0.5, m * 0.11);
      // 双立耳
      ctx.strokeRect(cx - m * 0.24, y + h * 0.20, m * 0.08, m * 0.14);
      ctx.strokeRect(cx + m * 0.16, y + h * 0.20, m * 0.08, m * 0.14);
      // 三柱足
      for (const dx of [-0.18, 0, 0.18]) {
        ctx.fillRect(cx + m * dx - m * 0.032, y + h * 0.62, m * 0.064, baseY - (y + h * 0.62));
      }
    } else if (itemId === "gu") {
      // 喇叭长觚（极修长）
      ctx.fillStyle = "#164FB4";
      ctx.beginPath();
      ctx.moveTo(cx - m * 0.22, y + h * 0.14);
      ctx.quadraticCurveTo(cx - m * 0.05, y + h * 0.45, cx - m * 0.06, y + h * 0.56);
      ctx.lineTo(cx - m * 0.16, baseY);
      ctx.lineTo(cx + m * 0.16, baseY);
      ctx.lineTo(cx + m * 0.06, y + h * 0.56);
      ctx.quadraticCurveTo(cx + m * 0.05, y + h * 0.45, cx + m * 0.22, y + h * 0.14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#EEB71E";
      ctx.fillRect(cx - m * 0.065, y + h * 0.46, m * 0.13, m * 0.08);
    } else if (itemId === "pan") {
      // 宽沿浅盘（极扁宽）
      ctx.fillStyle = "#E14B21";
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.38, y + h * 0.52);
      ctx.lineTo(cx + w * 0.38, y + h * 0.52);
      ctx.lineTo(cx + w * 0.28, y + h * 0.71);
      ctx.lineTo(cx - w * 0.28, y + h * 0.71);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#0F1114";
      ctx.fillRect(cx - w * 0.22, y + h * 0.71, w * 0.44, baseY - (y + h * 0.71));
    } else if (itemId === "fangzun") {
      // 折肩方尊
      ctx.fillStyle = "#0F1114";
      ctx.fillRect(cx - m * 0.22, y + h * 0.20, m * 0.44, m * 0.16);
      ctx.fillStyle = "#164FB4";
      ctx.fillRect(cx - m * 0.28, y + h * 0.36, m * 0.56, m * 0.24);
      ctx.fillStyle = "#0F1114";
      ctx.fillRect(cx - m * 0.20, y + h * 0.60, m * 0.40, baseY - (y + h * 0.60));
    } else if (itemId === "jue") {
      // 流尾三爵（动势斜向）
      ctx.fillStyle = "#C99206";
      ctx.beginPath();
      ctx.moveTo(cx - m * 0.36, y + h * 0.22);
      ctx.lineTo(cx + m * 0.34, y + h * 0.30);
      ctx.lineTo(cx + m * 0.16, y + h * 0.58);
      ctx.lineTo(cx - m * 0.16, y + h * 0.58);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#0F1114";
      ctx.lineWidth = Math.max(1.6, m * 0.032);
      ctx.beginPath();
      ctx.moveTo(cx - m * 0.1, y + h * 0.56);
      ctx.lineTo(cx - m * 0.22, baseY);
      ctx.moveTo(cx, y + h * 0.56);
      ctx.lineTo(cx, baseY);
      ctx.moveTo(cx + m * 0.1, y + h * 0.56);
      ctx.lineTo(cx + m * 0.22, baseY);
      ctx.stroke();
    } else if (itemId === "gui") {
      // 双耳圈簋
      ctx.fillStyle = "#10795C";
      ctx.beginPath();
      ctx.ellipse(cx, y + h * 0.52, m * 0.26, m * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - m * 0.18, y + h * 0.66, m * 0.36, baseY - (y + h * 0.66));
      ctx.strokeStyle = "#10795C";
      ctx.lineWidth = Math.max(2, m * 0.04);
      ctx.beginPath();
      ctx.arc(cx - m * 0.27, y + h * 0.52, m * 0.08, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + m * 0.27, y + h * 0.52, m * 0.08, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
    } else if (itemId === "you") {
      // 提梁弧卣
      ctx.strokeStyle = "#4B2E6B";
      ctx.lineWidth = Math.max(2, m * 0.045);
      ctx.beginPath();
      ctx.arc(cx, y + h * 0.48, m * 0.28, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#4B2E6B";
      ctx.beginPath();
      ctx.ellipse(cx, y + h * 0.62, m * 0.22, m * 0.21, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (itemId === "fangding") {
      // 四足方鼎
      ctx.fillStyle = "#164FB4";
      ctx.fillRect(cx - m * 0.28, y + h * 0.32, m * 0.56, m * 0.30);
      ctx.fillRect(cx - m * 0.24, y + h * 0.62, m * 0.07, baseY - (y + h * 0.62));
      ctx.fillRect(cx + m * 0.17, y + h * 0.62, m * 0.07, baseY - (y + h * 0.62));
      ctx.strokeStyle = "#164FB4";
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - m * 0.26, y + h * 0.20, m * 0.10, m * 0.12);
      ctx.strokeRect(cx + m * 0.16, y + h * 0.20, m * 0.10, m * 0.12);
    } else {
      // 合瓦编钟（序列悬垂）
      ctx.strokeStyle = "#0F1114";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.14, y + h * 0.22);
      ctx.lineTo(x + w * 0.86, y + h * 0.22);
      ctx.stroke();
      const scales = [0.22, 0.27, 0.32];
      scales.forEach((sc, i) => {
        const bx = x + w * (0.26 + i * 0.24);
        ctx.fillStyle = i === 1 ? "#E85324" : "#164FB4";
        ctx.fillRect(bx - m * 0.08, y + h * 0.28, m * 0.16, h * sc);
      });
    }
  } else {
    // chair：工业座椅标本图录（极简包豪斯侧视/正视几何）
    ctx.fillStyle = "#F5EFE4";
    ctx.fillRect(x, y, w, h);
    const baseY = y + h * 0.84;
    ctx.strokeStyle = "rgba(15,17,20,0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.08, baseY);
    ctx.lineTo(x + w * 0.92, baseY);
    ctx.stroke();

    ctx.lineCap = "square";
    ctx.lineJoin = "miter";

    if (itemId === "stool") {
      ctx.fillStyle = "#E14B21";
      ctx.fillRect(cx - m * 0.22, y + h * 0.44, m * 0.44, m * 0.09);
      ctx.strokeStyle = "#0F1114";
      ctx.lineWidth = Math.max(2, m * 0.04);
      ctx.beginPath();
      ctx.moveTo(cx - m * 0.16, y + h * 0.53);
      ctx.lineTo(cx - m * 0.22, baseY);
      ctx.moveTo(cx, y + h * 0.53);
      ctx.lineTo(cx, baseY);
      ctx.moveTo(cx + m * 0.16, y + h * 0.53);
      ctx.lineTo(cx + m * 0.22, baseY);
      ctx.stroke();
    } else if (itemId === "cantilever") {
      ctx.strokeStyle = "#164FB4";
      ctx.lineWidth = Math.max(2.2, m * 0.05);
      ctx.beginPath();
      ctx.moveTo(cx - m * 0.22, y + h * 0.20);
      ctx.lineTo(cx - m * 0.16, y + h * 0.54);
      ctx.lineTo(cx + m * 0.22, y + h * 0.54);
      ctx.lineTo(cx + m * 0.22, baseY);
      ctx.lineTo(cx - m * 0.24, baseY);
      ctx.stroke();
      ctx.fillStyle = "#EEB71E";
      ctx.fillRect(cx - m * 0.14, y + h * 0.48, m * 0.34, m * 0.07);
    } else if (itemId === "bench") {
      ctx.fillStyle = "#0F1114";
      ctx.fillRect(x + w * 0.12, y + h * 0.48, w * 0.76, m * 0.11);
      ctx.fillStyle = "#164FB4";
      ctx.fillRect(x + w * 0.18, y + h * 0.59, m * 0.08, baseY - (y + h * 0.59));
      ctx.fillRect(x + w * 0.82 - m * 0.08, y + h * 0.59, m * 0.08, baseY - (y + h * 0.59));
    } else if (itemId === "highback") {
      ctx.fillStyle = "#10795C";
      ctx.fillRect(cx - m * 0.20, y + h * 0.14, m * 0.10, baseY - (y + h * 0.14));
      ctx.fillRect(cx - m * 0.20, y + h * 0.52, m * 0.42, m * 0.09);
      ctx.fillRect(cx + m * 0.14, y + h * 0.52, m * 0.08, baseY - (y + h * 0.52));
    } else if (itemId === "gridchair") {
      ctx.strokeStyle = "#164FB4";
      ctx.lineWidth = Math.max(1.5, m * 0.032);
      const gx = cx - m * 0.24;
      const gy = y + h * 0.24;
      const gw = m * 0.48;
      const gh = baseY - gy;
      ctx.strokeRect(gx, gy, gw, gh);
      ctx.beginPath();
      ctx.moveTo(gx, gy + gh * 0.5);
      ctx.lineTo(gx + gw, gy + gh * 0.5);
      ctx.moveTo(gx + gw * 0.5, gy);
      ctx.lineTo(gx + gw * 0.5, gy + gh * 0.5);
      ctx.stroke();
      ctx.fillStyle = "#E14B21";
      ctx.fillRect(gx + 3, gy + gh * 0.5 + 2, gw - 6, gh * 0.14);
    } else if (itemId === "armchair") {
      ctx.fillStyle = "#F1B6C3";
      ctx.fillRect(cx - m * 0.28, y + h * 0.30, m * 0.56, m * 0.42);
      ctx.fillStyle = "#EE6799";
      ctx.beginPath();
      ctx.arc(cx, y + h * 0.46, m * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0F1114";
      ctx.fillRect(cx - m * 0.22, y + h * 0.72, m * 0.06, baseY - (y + h * 0.72));
      ctx.fillRect(cx + m * 0.16, y + h * 0.72, m * 0.06, baseY - (y + h * 0.72));
    } else if (itemId === "lounge") {
      ctx.strokeStyle = "#4B2E6B";
      ctx.lineWidth = Math.max(2.6, m * 0.065);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x + w * 0.16, y + h * 0.30);
      ctx.quadraticCurveTo(x + w * 0.36, y + h * 0.66, x + w * 0.56, y + h * 0.54);
      ctx.quadraticCurveTo(x + w * 0.74, y + h * 0.44, x + w * 0.86, y + h * 0.66);
      ctx.stroke();
      ctx.strokeStyle = "#0F1114";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.36, y + h * 0.58);
      ctx.lineTo(x + w * 0.30, baseY);
      ctx.moveTo(x + w * 0.66, y + h * 0.52);
      ctx.lineTo(x + w * 0.72, baseY);
      ctx.stroke();
    } else if (itemId === "folding") {
      ctx.strokeStyle = "#0F1114";
      ctx.lineWidth = Math.max(2, m * 0.042);
      ctx.beginPath();
      ctx.moveTo(cx - m * 0.22, y + h * 0.24);
      ctx.lineTo(cx + m * 0.22, baseY);
      ctx.moveTo(cx + m * 0.22, y + h * 0.42);
      ctx.lineTo(cx - m * 0.22, baseY);
      ctx.stroke();
      ctx.fillStyle = "#EEB71E";
      ctx.fillRect(cx - m * 0.22, y + h * 0.48, m * 0.44, m * 0.09);
    } else {
      // barstool 高脚凳
      ctx.fillStyle = "#0C8268";
      ctx.fillRect(cx - m * 0.18, y + h * 0.20, m * 0.36, m * 0.08);
      ctx.strokeStyle = "#0F1114";
      ctx.lineWidth = Math.max(1.8, m * 0.036);
      ctx.beginPath();
      ctx.moveTo(cx - m * 0.12, y + h * 0.28);
      ctx.lineTo(cx - m * 0.22, baseY);
      ctx.moveTo(cx + m * 0.12, y + h * 0.28);
      ctx.lineTo(cx + m * 0.22, baseY);
      ctx.moveTo(cx - m * 0.18, y + h * 0.62);
      ctx.lineTo(cx + m * 0.18, y + h * 0.62);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// 截断文字防止窄卡溢出（按字体+宽度+内容缓存，避免每帧重复调用高开销的 measureText）
const FIT_CACHE = new Map();
function fitText(ctx, text, maxW) {
  const mw = Math.max(12, Math.floor(maxW));
  const key = `${ctx.font}|${mw}|${text}`;
  const hit = FIT_CACHE.get(key);
  if (hit !== undefined) return hit;
  let out = text;
  if (ctx.measureText(text).width > mw) {
    while (out.length > 1 && ctx.measureText(out + "…").width > mw) {
      out = out.slice(0, -1);
    }
    out = out + "…";
  }
  if (FIT_CACHE.size > 600) FIT_CACHE.clear();
  FIT_CACHE.set(key, out);
  return out;
}

export function createHeroCanvas(canvas, { getState, getLayout, onUpdate }) {
  const ctx = canvas.getContext("2d");
  let w = 800;
  let h = 440;
  let dpr = 1;
  let sizeMeasured = false;
  let dirty = true;
  let hoverSlotId = null;
  let dragMode = null; // null | 'scale'
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartRatio = 1.0;
  let dragMoved = false;
  let activePointerId = null;
  let lastClickFlash = { t: 0, fromX: 0, fromY: 0, toX: 0, toY: 0 };

  function resize(force = false) {
    if (sizeMeasured && !force) return { w, h };
    const rect = canvas.getBoundingClientRect();
    w = Math.max(280, Math.round(rect.width));
    h = Math.max(240, Math.round(rect.height));
    // 手机小屏（<=640px）像素比上限 1.5（遵循 GUIDE 性能建议），桌面最高 2
    const maxDpr = window.innerWidth <= 640 ? 1.5 : 2;
    dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const cw = Math.round(w * dpr);
    const ch = Math.round(h * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    sizeMeasured = true;
    dirty = true;
    return { w, h };
  }

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => resize(true)).observe(canvas);
  }

  function markDirty() {
    dirty = true;
  }

  function pointToCard(px, py) {
    const layout = getLayout(w, h);
    for (const c of layout.cards) {
      const r = c.cardRect;
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
        return c;
      }
    }
    return null;
  }

  function ratioFromRulerX(px) {
    const layout = getLayout(w, h);
    const rb = layout.rulerBar;
    const u = clamp((px - rb.x - 16) / Math.max(40, rb.w - 32), 0, 1);
    return +(1.0 + u * 2.2).toFixed(2);
  }

  function draw(t = 0, _dt = 0, { still = false, force = false } = {}) {
    if (!sizeMeasured) resize(true);
    const state = getState();
    const layout = getLayout(w, h);
    const flashActive = !still && lastClickFlash.t > 0 && performance.now() / 1000 - lastClickFlash.t < 0.48;
    const animActive = !still && (layout.verdict.pass || flashActive);
    if (!dirty && !animActive && !force && !still) return;
    dirty = false;
    const isCompact = w < 520;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 复古画册米纸底面
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    // 极克制的出版网格微标线（仅在通过或高亮模块时隐约可见）
    if (state.highlightGroup === "module" || layout.verdict.pass) {
      ctx.strokeStyle = "rgba(22, 79, 180, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) {
        const gx = Math.round((w * i) / 6) + 0.5;
        ctx.beginPath();
        ctx.moveTo(gx, layout.rulerBar.y + layout.rulerBar.h + 8);
        ctx.lineTo(gx, h - 8);
        ctx.stroke();
      }
    }

    // 2. 顶部活体「大/小尺度节奏标尺」轨道（也是 data-perf-drag 的清晰把手视觉）
    const rb = layout.rulerBar;
    const trackY = rb.y + rb.h / 2;
    const trackX0 = rb.x + 6;
    const trackX1 = rb.x + rb.w - 6;
    const u = clamp((state.scaleRatio - 1.0) / 2.2, 0, 1);
    const knobX = trackX0 + 10 + u * (trackX1 - trackX0 - 20);

    // 标尺底槽与推荐区间（1.35× - 2.35×）
    const okX0 = trackX0 + 10 + ((1.35 - 1.0) / 2.2) * (trackX1 - trackX0 - 20);
    const okX1 = trackX0 + 10 + ((2.35 - 1.0) / 2.2) * (trackX1 - trackX0 - 20);
    ctx.fillStyle = "rgba(22, 79, 180, 0.10)";
    ctx.fillRect(trackX0, trackY - 3, trackX1 - trackX0, 6);
    ctx.fillStyle = "rgba(16, 121, 92, 0.24)";
    ctx.fillRect(okX0, trackY - 3, okX1 - okX0, 6);

    // 刻度齿
    ctx.strokeStyle = "rgba(15, 17, 20, 0.28)";
    ctx.lineWidth = 1;
    for (let k = 0; k <= 11; k++) {
      const tx = trackX0 + 10 + (k / 11) * (trackX1 - trackX0 - 20);
      const th = k % 5 === 0 ? 7 : 4;
      ctx.beginPath();
      ctx.moveTo(tx, trackY - th);
      ctx.lineTo(tx, trackY + th);
      ctx.stroke();
    }

    // 实绘游标滑钮
    const rulerBad = layout.issues.some((i) => i.id === "flatRhythm" || i.id === "extremeContrast" || i.id === "crushed");
    const pillText = isCompact
      ? `节奏 ${state.scaleRatio.toFixed(2)}× ↔`
      : `尺度标尺 ${state.scaleRatio.toFixed(2)}× · 实测面积比 ${layout.metrics.measuredAreaRatio.toFixed(2)}× ↔`;
    ctx.font = `600 ${isCompact ? 10 : 11}px "IBM Plex Mono", "Noto Sans SC", monospace`;
    const pillW = Math.min(rb.w - 12, ctx.measureText(pillText).width + 18);
    const pillX = clamp(knobX - pillW / 2, rb.x + 2, rb.x + rb.w - pillW - 2);
    ctx.fillStyle = rulerBad ? PALETTE.redProof : PALETTE.cobalt;
    ctx.fillRect(pillX, rb.y, pillW, rb.h);
    ctx.fillStyle = "#FAF4EA";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pillText, pillX + pillW / 2, trackY + 0.5);
    ctx.textAlign = "left";

    // 3. VS 对照区底框（若启用）
    if (layout.vsBox) {
      const vb = layout.vsBox;
      const vsBad = layout.issues.some((i) => i.id === "weakVs");
      ctx.save();
      ctx.fillStyle = vsBad ? "rgba(192, 42, 28, 0.08)" : "rgba(22, 79, 180, 0.06)";
      ctx.fillRect(vb.x, vb.y, vb.w, vb.h);
      ctx.strokeStyle = vsBad ? PALETTE.redProof : PALETTE.cobalt;
      ctx.lineWidth = vsBad ? 1.5 : 1.25;
      if (vsBad) ctx.setLineDash([4, 3]);
      ctx.strokeRect(vb.x + 0.5, vb.y + 0.5, vb.w - 1, vb.h - 1);
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 4. 绘制每一张图录标本卡
    for (const c of layout.cards) {
      const tr = c.thumbRect;
      const cr = c.captionRect;
      const isHovered = hoverSlotId === c.slotId;
      const isSelectedInVs =
        !c.isVs && state.vsEnabled && (state.vsPair[0] === c.index || state.vsPair[1] === c.index);

      // 缩略图内容
      drawSpecimenArt(ctx, state.theme, c.item.id, tr.x, tr.y, tr.w, tr.h);

      // 细边线（复刻原海报锐利 1px 灰框）
      ctx.strokeStyle = isHovered
        ? PALETTE.cobalt
        : isSelectedInVs
        ? PALETTE.cobalt
        : PALETTE.rule;
      ctx.lineWidth = isHovered || isSelectedInVs ? 2 : 1;
      ctx.strokeRect(tr.x + 0.5, tr.y + 0.5, tr.w - 1, tr.h - 1);

      // 已被选入 VS 的原卡右上角小蓝角标
      if (isSelectedInVs && !isCompact) {
        const tag = state.vsPair[0] === c.index ? "VS·左" : "VS·右";
        ctx.font = `600 10px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
        const tw = ctx.measureText(tag).width + 10;
        ctx.fillStyle = PALETTE.cobalt;
        ctx.fillRect(tr.x + tr.w - tw, tr.y, tw, 16);
        ctx.fillStyle = "#FAF4EA";
        ctx.textBaseline = "middle";
        ctx.fillText(tag, tr.x + tr.w - tw + 5, tr.y + 8.5);
      }

      // 标注系统绘制（4 种真实状态）
      if (state.captionMode === "overlay") {
        // 盖脸大浮标（错态：直接遮挡缩略图下部 31%）
        const oh = Math.max(22, tr.h * 0.31);
        ctx.fillStyle = "rgba(15, 17, 20, 0.88)";
        ctx.fillRect(tr.x, tr.y + tr.h - oh, tr.w, oh);
        ctx.fillStyle = "#FAF4EA";
        ctx.font = `700 ${isCompact ? 10 : 11.5}px "Noto Sans SC", sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText(fitText(ctx, `${c.item.code} ${c.item.zh}`, tr.w - 10), tr.x + 5, tr.y + tr.h - oh * 0.62);
        ctx.fillStyle = "#F7B5A2";
        ctx.font = `600 ${isCompact ? 9 : 10}px "IBM Plex Mono", sans-serif`;
        ctx.fillText(fitText(ctx, `遮挡 ${Math.round(c.occludedRatio * 100)}%`, tr.w - 10), tr.x + 5, tr.y + tr.h - oh * 0.24);
      } else if (state.captionMode === "standard") {
        // 原海报规范：彩色圆点分类码 + 中文名 + 大写英文/对照关键词
        const dotR = isCompact ? 3.2 : 4;
        const line1Y = cr.y + (isCompact ? 6.5 : 8);
        ctx.fillStyle = c.item.dot;
        ctx.beginPath();
        ctx.arc(cr.x + dotR + 1, line1Y, dotR, 0, Math.PI * 2);
        ctx.fill();

        const tx = cr.x + dotR * 2 + 6;
        const maxTw = Math.max(24, cr.w - (dotR * 2 + 6));
        ctx.fillStyle = PALETTE.ink;
        ctx.font = `700 ${isCompact ? 10 : 12}px "Noto Sans SC", sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText(fitText(ctx, c.item.zh, maxTw), tx, line1Y);

        const line2Y = line1Y + (isCompact ? 12 : 14);
        const subText = c.isVs ? c.item.roleNote : c.item.en;
        ctx.fillStyle = PALETTE.inkSub;
        ctx.font = c.isVs
          ? `500 ${isCompact ? 9.5 : 10.5}px "Noto Sans SC", sans-serif`
          : `600 ${isCompact ? 9 : 10}px "Chivo", "IBM Plex Mono", sans-serif`;
        ctx.fillText(fitText(ctx, subText, maxTw), tx, line2Y);
      } else if (state.captionMode === "messy") {
        // 长短杂注（开场错态：严格裁切在本卡标注盒内，绝不撞上下一行缩略图）
        ctx.save();
        ctx.beginPath();
        ctx.rect(cr.x - 2, cr.y - 2, cr.w + 4, Math.max(12, cr.h + 3));
        ctx.clip();
        ctx.fillStyle = PALETTE.ink;
        ctx.font = `400 ${isCompact ? 9.5 : 10.5}px "Noto Sans SC", sans-serif`;
        ctx.textBaseline = "top";
        const lh = isCompact ? 10 : 11.4;
        c.item.messyLines.forEach((line, li) => {
          const ly = cr.y + li * lh;
          if (ly + lh * 0.7 <= cr.y + cr.h + 2) {
            ctx.fillStyle = li === 0 ? PALETTE.ink : PALETTE.inkSub;
            ctx.fillText(fitText(ctx, line, cr.w - 2), cr.x + 1, ly);
          }
        });
        ctx.restore();
        if (c.item.messyLines.length >= 3 || c.item.messyLines.length <= 1) {
          ctx.strokeStyle = "rgba(192, 42, 28, 0.52)";
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.strokeRect(cr.x - 1, cr.y - 1, cr.w + 2, Math.max(12, cr.h + 1));
          ctx.setLineDash([]);
        }
      }
      // none: 裸图无签，什么都不画，留空显出缺锚点
    }

    // 5. VS 居中字标
    if (layout.vsBox) {
      const vb = layout.vsBox;
      const vsBad = layout.issues.some((i) => i.id === "weakVs");
      ctx.font = `900 ${isCompact ? 11 : 14}px "Chivo", sans-serif`;
      ctx.fillStyle = vsBad ? PALETTE.redProof : PALETTE.cobalt;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("VS", vb.cx, vb.cy);
      ctx.textAlign = "left";
    }

    // 6. 印刷校样红铅笔批注（错态时）或 钴蓝浏览路径光点（通过时）
    if (layout.metrics.baselineJitterPx > 6) {
      // 画出第 1 行错牙红铅笔基线尺
      const r0 = layout.cards.filter((c) => c.row === 0);
      if (r0.length) {
        ctx.save();
        ctx.strokeStyle = PALETTE.redProof;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        r0.forEach((c, idx) => {
          const bx = c.thumbRect.x + c.thumbRect.w / 2;
          const by = c.thumbRect.y + c.thumbRect.h;
          if (idx === 0) ctx.moveTo(bx, by);
          else ctx.lineTo(bx, by);
        });
        ctx.stroke();
        ctx.setLineDash([]);
        // 红标牌
        const mid = r0[1] || r0[0];
        const tag = `× 基线错差 ±${layout.metrics.baselineJitterPx}px`;
        ctx.font = `600 ${isCompact ? 10 : 11}px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
        const tw = ctx.measureText(tag).width + 14;
        const tx = clamp(mid.thumbRect.x + mid.thumbRect.w / 2 - tw / 2, 10, w - tw - 10);
        const ty = clamp(mid.thumbRect.y + mid.thumbRect.h - 22, 34, h - 28);
        ctx.fillStyle = PALETTE.redProof;
        ctx.fillRect(tx, ty, tw, 20);
        ctx.fillStyle = "#FAF4EA";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tag, tx + tw / 2, ty + 10.5);
        ctx.restore();
      }
    }

    if (layout.vsBox && layout.issues.some((i) => i.id === "weakVs")) {
      const vb = layout.vsBox;
      const tag = isCompact ? "× 弱对照·点卡换对" : "× 同质弱对照 · 点任意卡换对";
      ctx.save();
      ctx.font = `600 ${isCompact ? 9.5 : 10.5}px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(tag).width + 12;
      const tx = clamp(vb.cx - tw / 2, 8, w - tw - 8);
      const ty = Math.max(36, vb.y - 11);
      ctx.fillStyle = PALETTE.redProof;
      ctx.fillRect(tx, ty, tw, 18);
      ctx.fillStyle = "#FAF4EA";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tag, tx + tw / 2, ty + 9.5);
      ctx.restore();
    }

    // 通过付印时，沿卡片走过一道克制缓慢的钴蓝浏览路径微光（reducedMotion 时画静态虚线）
    if (layout.verdict.pass && layout.pathPoints.length > 2) {
      const pts = layout.pathPoints;
      ctx.save();
      ctx.strokeStyle = "rgba(22, 79, 180, 0.28)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      pts.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      if (!still) {
        const segs = pts.length - 1;
        const pos = ((t * 0.38) % 1) * segs;
        const idx = Math.floor(pos);
        const frac = pos - idx;
        const p0 = pts[idx];
        const p1 = pts[Math.min(segs, idx + 1)];
        const px = p0.x + (p1.x - p0.x) * frac;
        const py = p0.y + (p1.y - p0.y) * frac;
        ctx.fillStyle = PALETTE.cobalt;
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FAF4EA";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 点击卡片换入 VS 时的短促飞线反馈（0.45 秒）
    if (!still && lastClickFlash.t > 0) {
      const age = performance.now() / 1000 - lastClickFlash.t;
      if (age < 0.45) {
        const p = age / 0.45;
        ctx.save();
        ctx.strokeStyle = `rgba(22, 79, 180, ${(1 - p) * 0.85})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(lastClickFlash.fromX, lastClickFlash.fromY);
        ctx.quadraticCurveTo(
          (lastClickFlash.fromX + lastClickFlash.toX) / 2,
          Math.min(lastClickFlash.fromY, lastClickFlash.toY) - 26,
          lastClickFlash.toX,
          lastClickFlash.toY
        );
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // ---------- 指针与触摸事件（支持横拖尺度标尺 & 点选卡片上台组 VS）----------
  function getPos(ev) {
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }

  canvas.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0 && ev.pointerType === "mouse") return;
    const p = getPos(ev);
    const layout = getLayout(w, h);
    activePointerId = ev.pointerId;
    dragStartX = p.x;
    dragStartY = p.y;
    dragStartRatio = getState().scaleRatio;
    dragMoved = false;

    // 点在标尺轨道上立即按位置设置并进入拖动
    const rb = layout.rulerBar;
    if (p.y <= rb.y + rb.h + 10) {
      dragMode = "scale";
      dragMoved = true;
      canvas.setPointerCapture(ev.pointerId);
      onUpdate({ scaleRatio: ratioFromRulerX(p.x) });
      return;
    }
    dragMode = "maybe";
    if (ev.pointerType === "mouse") {
      canvas.setPointerCapture(ev.pointerId);
    }
  });

  canvas.addEventListener("pointermove", (ev) => {
    const p = getPos(ev);
    if (activePointerId === ev.pointerId && dragMode) {
      const dx = p.x - dragStartX;
      const dy = p.y - dragStartY;
      if (dragMode === "maybe") {
        if (Math.abs(dx) > 6 && Math.abs(dx) >= Math.abs(dy) * 0.9) {
          dragMode = "scale";
          dragMoved = true;
          try {
            canvas.setPointerCapture(ev.pointerId);
          } catch {}
        } else if (Math.abs(dy) > 12 && ev.pointerType !== "mouse") {
          // 竖滑交还给浏览器滚动页面
          dragMode = null;
          activePointerId = null;
          return;
        }
      }
      if (dragMode === "scale") {
        const next = clamp(+(dragStartRatio + (dx / Math.max(180, w * 0.62)) * 2.2).toFixed(2), 1.0, 3.2);
        onUpdate({ scaleRatio: next }, { fromDrag: true });
        return;
      }
    }

    if (ev.pointerType === "mouse") {
      const hit = pointToCard(p.x, p.y);
      const nextId = hit ? hit.slotId : null;
      if (nextId !== hoverSlotId) {
        hoverSlotId = nextId;
        canvas.style.cursor = p.y <= 34 ? "ew-resize" : hit ? "pointer" : "ew-resize";
        dirty = true;
      }
    }
  });

  const finishPointer = (ev) => {
    if (activePointerId !== ev.pointerId) return;
    const p = getPos(ev);
    const wasClick = !dragMoved;
    dragMode = null;
    activePointerId = null;
    try {
      if (canvas.hasPointerCapture(ev.pointerId)) canvas.releasePointerCapture(ev.pointerId);
    } catch {}

    if (wasClick) {
      const hit = pointToCard(p.x, p.y);
      if (hit) {
        const st = getState();
        const layout = getLayout(w, h);
        if (hit.isVs) {
          // 点 VS 槽：循环切换到下一张有反差的卡
          const nextIdx = (hit.index + 1) % 9;
          const nextPair = hit.vsRole === "left" ? [nextIdx, st.vsPair[1]] : [st.vsPair[0], nextIdx];
          onUpdate({ vsEnabled: true, vsPair: nextPair });
        } else {
          // 点普通标本卡：送入当前轮替的 VS 左/右槽
          const nextPair =
            st.selectingSide === "left" ? [hit.index, st.vsPair[1]] : [st.vsPair[0], hit.index];
          const nextSide = st.selectingSide === "left" ? "right" : "left";
          if (layout.vsBox) {
            lastClickFlash = {
              t: performance.now() / 1000,
              fromX: hit.thumbRect.x + hit.thumbRect.w / 2,
              fromY: hit.thumbRect.y + hit.thumbRect.h / 2,
              toX: layout.vsBox.cx,
              toY: layout.vsBox.cy,
            };
          }
          onUpdate({ vsEnabled: true, vsPair: nextPair, selectingSide: nextSide });
        }
      }
    }
  };

  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", () => {
    dragMode = null;
    activePointerId = null;
  });
  canvas.addEventListener("pointerleave", () => {
    if (hoverSlotId !== null) {
      hoverSlotId = null;
      dirty = true;
    }
  });

  // 同时兼容 CDP/perf 的原始 touch 事件（确保在任何移动端或合成 touchmove 下都能实时推拉标尺）
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartRatio = 1.0;
  let touchLocked = null;
  canvas.addEventListener(
    "touchstart",
    (ev) => {
      if (!ev.touches.length) return;
      const t0 = ev.touches[0];
      touchStartX = t0.clientX;
      touchStartY = t0.clientY;
      touchStartRatio = getState().scaleRatio;
      touchLocked = null;
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (ev) => {
      if (!ev.touches.length) return;
      const t0 = ev.touches[0];
      const dx = t0.clientX - touchStartX;
      const dy = t0.clientY - touchStartY;
      if (touchLocked === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        touchLocked = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
      if (touchLocked === "x") {
        const next = clamp(+(touchStartRatio + (dx / Math.max(160, w * 0.58)) * 2.2).toFixed(2), 1.0, 3.2);
        onUpdate({ scaleRatio: next }, { fromDrag: true });
      }
    },
    { passive: true }
  );

  return {
    draw,
    markDirty,
    getSize: (force = false) => resize(force),
  };
}

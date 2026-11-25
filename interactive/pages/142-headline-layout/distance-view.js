// 142 三米远观实测窗（2D Canvas）：
// 严格由同一组 DOM 行框矩形（model.js 实测导出）按面积×字重绘出低通模糊墨团，
// 不另做离屏像素扫描，确保与页面净留白、四灯和主诊断同源一致。
import { loop, pixelRatio } from "../../lib/stage.js";

export function createDistanceView(canvas) {
  const ctx = canvas.getContext("2d");
  let latestEval = null;
  let dirty = true;
  let intro = 0; // 开场平滑显现进度 0..1

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      dirty = true;
    }
  }

  function renderFrame(t, dt, { still }) {
    resize();
    if (still) {
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 1.45);
      dirty = true;
    }
    if (!dirty || !latestEval) return;

    const W = canvas.width;
    const H = canvas.height;
    const ease = 1 - (1 - intro) ** 3;

    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // 1. 暖米白纸底（同原海报 #F7F2EA）
    ctx.fillStyle = "#F7F2EA";
    ctx.fillRect(0, 0, W, H);

    // 2. 低通柔化背景几何母题（右下出血蓝三角 + 中右钴蓝圆斜线）
    ctx.save();
    ctx.globalAlpha = 0.24 * ease;
    ctx.fillStyle = "#1446B8";
    ctx.beginPath();
    ctx.moveTo(W * 0.46, H);
    ctx.lineTo(W * 0.80, H * 0.62);
    ctx.lineTo(W * 1.06, H);
    ctx.closePath();
    ctx.fill();

    // 蓝圆微模糊阴影层
    ctx.globalAlpha = 0.22 * ease;
    ctx.fillStyle = "#235AD2";
    ctx.beginPath();
    ctx.arc(W * 0.78, H * 0.45, W * 0.145, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. 用同一组 DOM 行框矩形绘出三米眯眼低通墨团（按 weight/实底决定光学浓淡与扩散半径）
    const rects = latestEval.allRects || [];
    const blurBase = Math.max(2, W * 0.022);
    for (const r of rects) {
      const rx = r.x * W;
      const ry = r.y * H;
      const rw = Math.max(2, r.w * W);
      const rh = Math.max(2, r.h * H);

      // 多层柔边叠加模拟三米远观低通模糊（兼容无 ctx.filter 环境且软件渲染超快）
      const isBlueBlock = r.isSolidBlock;
      const baseColor = isBlueBlock ? "20, 70, 184" : r.layer === "headline" ? "17, 17, 17" : "66, 63, 58";
      const alpha = Math.min(0.92, Math.max(0.09, r.weight * 0.62)) * ease;

      const spreads = [blurBase * 1.9, blurBase * 0.95, 0];
      const factors = [0.20, 0.36, 0.78];
      for (let i = 0; i < spreads.length; i++) {
        const s = spreads[i];
        ctx.fillStyle = `rgba(${baseColor}, ${(alpha * factors[i]).toFixed(3)})`;
        ctx.beginPath();
        const rad = Math.min((rh + s * 2) * 0.42, blurBase * 1.5);
        roundRectPath(ctx, rx - s, ry - s * 0.65, rw + s * 2, rh + s * 1.3, rad);
        ctx.fill();
      }
    }

    // 4. 在计算出的「第一眼墨团」外围绘锐利印刷角标框（直接标明眼睛先落哪层）
    const first = latestEval.firstEyeLayer;
    const focusLayer = first === "split" ? null : first;
    if (focusLayer) {
      const targetRects = rects.filter((r) => r.layer === focusLayer);
      if (targetRects.length) {
        const minX = Math.min(...targetRects.map((r) => r.x)) * W - blurBase * 0.6;
        const minY = Math.min(...targetRects.map((r) => r.y)) * H - blurBase * 0.5;
        const maxX = Math.max(...targetRects.map((r) => r.x + r.w)) * W + blurBase * 0.6;
        const maxY = Math.max(...targetRects.map((r) => r.y + r.h)) * H + blurBase * 0.5;
        const isGood = latestEval.status.pass;
        const isWarn = focusLayer !== "headline" || latestEval.status.code === "OVERCROWDED" || latestEval.status.code === "LONG_BLOWN_UP";
        ctx.strokeStyle = isGood ? "#1446B8" : isWarn ? "#C6331F" : "#235AD2";
        ctx.lineWidth = Math.max(1.5, W * 0.011);
        const corner = Math.max(6, W * 0.065);
        drawCornerMarks(ctx, Math.max(3, minX), Math.max(3, minY), Math.min(W - 3, maxX), Math.min(H - 3, maxY), corner);
      }
    } else {
      // 平权分心态：绘一条淡淡的双红斜线提示「找不到唯一第一眼」
      ctx.strokeStyle = "rgba(198, 51, 31, 0.55)";
      ctx.lineWidth = Math.max(1.2, W * 0.008);
      ctx.setLineDash([W * 0.03, W * 0.025]);
      ctx.strokeRect(W * 0.07, H * 0.07, W * 0.86, H * 0.86);
      ctx.setLineDash([]);
    }

    // 外细框
    ctx.strokeStyle = "rgba(17, 17, 17, 0.16)";
    ctx.lineWidth = Math.max(1, W * 0.006);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    ctx.restore();
    if (intro >= 1) dirty = false;
  }

  const ctrl = loop(canvas, renderFrame);

  return {
    update(evalResult) {
      latestEval = evalResult;
      dirty = true;
      ctrl.draw();
    },
    resize() {
      resize();
      ctrl.draw();
    },
  };
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawCornerMarks(ctx, x1, y1, x2, y2, len) {
  ctx.beginPath();
  // 左上
  ctx.moveTo(x1, y1 + len); ctx.lineTo(x1, y1); ctx.lineTo(x1 + len, y1);
  // 右上
  ctx.moveTo(x2 - len, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y1 + len);
  // 左下
  ctx.moveTo(x1, y2 - len); ctx.lineTo(x1, y2); ctx.lineTo(x1 + len, y2);
  // 右下
  ctx.moveTo(x2 - len, y2); ctx.lineTo(x2, y2); ctx.lineTo(x2, y2 - len);
  ctx.stroke();
}

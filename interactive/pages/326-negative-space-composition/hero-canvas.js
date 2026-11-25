// 326 留白构图 · 开场「美术馆光影减法台」2D 矢量画布
// 纯 2D Canvas 极速矢量渲染（无高开销 shadowBlur），手机 6x 降速与软件渲染下稳跑 55-60fps。
// 遵循 BRIEF.md：画人只用蓑笠剪影（绝不画五官）；所有几何与 model.js 单真源完全一致。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { THEMES, clamp, evaluate } from "./model.js";

const PALETTE = {
  posterBg: "#FEF9F6",
  songBg: "#F8F2E9",
  exhibitBg: "#FDF8F4",
  archWhite: "#FFFFFF",
  ink: "#1D1D1D",
  inkMuted: "#4E4B49",
  blue: "#3A6AC7",
  blueDeep: "#234B9A",
  blueSoft: "rgba(58, 106, 199, 0.10)",
  blueLine: "rgba(58, 106, 199, 0.52)",
  err: "#B62A24",
  errBg: "rgba(182, 42, 36, 0.085)",
  errPill: "#FFF8F7",
  ok: "#196B4A",
  divider: "#DCD7D7",
};

export function mountHeroCanvas(canvas, getState, onMutate, onResize) {
  const ctx = canvas.getContext("2d");
  let cssW = 800;
  let cssH = 540;
  let dpr = pixelRatio(2);
  let dirty = true;

  // 杂件显隐平滑过渡（0..1），reducedMotion 下直接跳至目标值
  const fade = { frame: 1, grid: 1, corner: 1, rival: 1, voidMap: 0 };
  let intro = reducedMotion.matches ? 1 : 0;
  let hoverTarget = null; // "subject" | "corner" | "rival" | "frame" | "grid" | null

  // 每次渲染缓存可点命中盒，保证点击与视觉 1:1 严丝合缝
  let hitZones = {
    subject: null,
    corner: null,
    rival: null,
    frameBadge: null,
    gridBadge: null,
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    cssW = rect.width;
    cssH = rect.height;
    dpr = cssW <= 480 ? pixelRatio(1.5) : pixelRatio(2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      dirty = true;
    }
  }

  function px(nx) { return nx * cssW; }
  function py(ny) { return ny * cssH; }

  function drawRoundedRect(x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  // 绘制红框可点撤除标牌（确保对比度高、字号清晰、绝不超出画布边界）
  function drawActionTag(cx, cy, text, isHover, isGridOrFrame = false) {
    ctx.save();
    const fontSize = cssW < 420 ? 11 : 12;
    ctx.font = `600 ${fontSize}px "Noto Sans SC", sans-serif`;
    const padX = cssW < 420 ? 8 : 10;
    const h = cssW < 420 ? 24 : 26;
    const tw = ctx.measureText(text).width;
    const w = tw + padX * 2 + 12;
    const x = clamp(cx - w * 0.5, 10, cssW - w - 10);
    const y = clamp(cy - h * 0.5, 10, cssH - h - 10);

    ctx.fillStyle = isHover ? "#B62A24" : PALETTE.errPill;
    ctx.strokeStyle = PALETTE.err;
    ctx.lineWidth = isHover ? 1.6 : 1.2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    ctx.fillStyle = isHover ? "#FFFFFF" : PALETTE.err;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`× ${text}`, x + padX, y + h * 0.5 + 0.5);
    ctx.restore();
    return { x, y, w, h };
  }

  // 绘制 326 原海报标志性「纯白无框拱门 + 温灰斜落长影」
  function drawPosterSubject(subj, evalRes, reveal) {
    const x = px(subj.x);
    const y = py(subj.y);
    const w = px(subj.w);
    const h = py(subj.h);
    const radius = w * 0.5;
    const archTopY = y + Math.min(radius, h * 0.45);
    const baseLeftX = x;
    const baseLeftY = y + h * 0.80;
    const baseRightX = x + w;
    const baseRightY = y + h;

    // 1. 极其细腻的温灰长影（1:1 承袭 326 原海报向左下方斜拂渐隐的光影）
    const shadowReachX = Math.max(w * 1.45, cssW * 0.24) * reveal;
    const shadowReachY = Math.max(h * 0.65, cssH * 0.16) * reveal;
    const shBLX = baseLeftX - shadowReachX;
    const shBLY = baseLeftY + shadowReachY * 0.88;
    const shBRX = baseRightX - shadowReachX * 0.52;
    const shBRY = baseRightY + shadowReachY * 1.25;

    const grad = ctx.createLinearGradient(
      (baseLeftX + baseRightX) * 0.5,
      (baseLeftY + baseRightY) * 0.5,
      (shBLX + shBRX) * 0.45,
      (shBLY + shBRY) * 0.55
    );
    grad.addColorStop(0, "rgba(196, 186, 182, 0.42)");
    grad.addColorStop(0.45, "rgba(218, 210, 206, 0.20)");
    grad.addColorStop(1, "rgba(254, 249, 246, 0)");

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(baseLeftX, baseLeftY);
    ctx.lineTo(baseRightX, baseRightY);
    ctx.lineTo(shBRX, shBRY);
    ctx.lineTo(shBLX, shBLY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // 2. 纯白拱门主体（无描边，完全靠纯白 #FFFFFF 与暖瓷底 #FEF9F6 的微妙高光阶差浮现）
    ctx.beginPath();
    ctx.moveTo(baseLeftX, baseLeftY);
    ctx.lineTo(x, archTopY);
    ctx.ellipse(x + w * 0.5, archTopY, w * 0.5, Math.min(radius, h * 0.45), 0, Math.PI, 0, false);
    ctx.lineTo(baseRightX, baseRightY);
    ctx.closePath();
    ctx.fillStyle = PALETTE.archWhite;
    ctx.fill();

    // 极微弱的门槛光边线，保证不同显示器上都能一眼辨出纯白拱门轮廓
    ctx.strokeStyle = evalRes.passCount === 4 ? "rgba(58, 106, 199, 0.22)" : "rgba(176, 166, 160, 0.36)";
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // 悬停或拖动时用极细建筑钴蓝角标提示可拖移位置
    if (hoverTarget === "subject") {
      const m = 6;
      const len = 10;
      ctx.strokeStyle = PALETTE.blue;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - m, y - m + len); ctx.lineTo(x - m, y - m); ctx.lineTo(x - m + len, y - m);
      ctx.moveTo(x + w + m - len, y + h + m); ctx.lineTo(x + w + m, y + h + m); ctx.lineTo(x + w + m, y + h + m - len);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 绘制宋画「寒江独钓」主题（化用马远构图：一叶扁舟、蓑笠老翁剪影绝无五官、数笔淡墨水纹）
  function drawSongSubject(subj, evalRes, reveal) {
    const x = px(subj.x);
    const y = py(subj.y);
    const w = px(subj.w);
    const h = py(subj.h);
    const cx = x + w * 0.5;
    const cy = y + h * 0.56;

    ctx.save();
    // 1. 几笔极克制的淡墨水波纹（随 reveal 渐入）
    ctx.strokeStyle = "rgba(44, 52, 62, 0.26)";
    ctx.lineWidth = Math.max(1, h * 0.018);
    ctx.lineCap = "round";
    const ripples = [
      { ox: -0.42, oy: 0.28, len: 0.36 },
      { ox: 0.08, oy: 0.36, len: 0.44 },
      { ox: -0.26, oy: 0.45, len: 0.32 },
      { ox: 0.24, oy: 0.24, len: 0.24 },
    ];
    for (const rp of ripples) {
      const rx = cx + w * rp.ox;
      const ry = cy + h * rp.oy;
      const rw = w * rp.len * reveal;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.quadraticCurveTo(rx + rw * 0.5, ry - h * 0.035, rx + rw, ry + h * 0.01);
      ctx.stroke();
    }

    // 2. 扁舟船身（浓淡墨弧线，翘首微昂）
    const bw = w * 0.72;
    const bh = h * 0.22;
    ctx.beginPath();
    ctx.moveTo(cx - bw * 0.54, cy + bh * 0.1);
    ctx.quadraticCurveTo(cx - bw * 0.1, cy + bh * 1.15, cx + bw * 0.56, cy - bh * 0.12);
    ctx.quadraticCurveTo(cx + bw * 0.04, cy + bh * 0.42, cx - bw * 0.54, cy + bh * 0.1);
    ctx.closePath();
    ctx.fillStyle = "#2A2B2D";
    ctx.fill();

    // 船篷一弧淡墨
    ctx.beginPath();
    ctx.moveTo(cx - bw * 0.36, cy + bh * 0.14);
    ctx.quadraticCurveTo(cx - bw * 0.24, cy - bh * 0.75, cx - bw * 0.04, cy + bh * 0.18);
    ctx.strokeStyle = "rgba(42, 43, 45, 0.55)";
    ctx.lineWidth = Math.max(1.2, h * 0.024);
    ctx.stroke();

    // 3. 垂钓蓑笠老翁（纯粹剪影侧影：斗笠 + 披蓑微躬，严禁绘制任何五官细节）
    const fx = cx + bw * 0.10;
    const fy = cy + bh * 0.02;
    // 蓑衣剪影
    ctx.beginPath();
    ctx.moveTo(fx - bw * 0.10, fy + bh * 0.22);
    ctx.quadraticCurveTo(fx - bw * 0.06, fy - bh * 1.05, fx + bw * 0.06, fy - bh * 0.92);
    ctx.quadraticCurveTo(fx + bw * 0.12, fy - bh * 0.25, fx + bw * 0.10, fy + bh * 0.22);
    ctx.closePath();
    ctx.fillStyle = "#232528";
    ctx.fill();

    // 宽檐斗笠（压低遮面，无五官）
    ctx.beginPath();
    ctx.moveTo(fx - bw * 0.13, fy - bh * 0.85);
    ctx.quadraticCurveTo(fx + bw * 0.02, fy - bh * 1.55, fx + bw * 0.15, fy - bh * 0.78);
    ctx.quadraticCurveTo(fx + bw * 0.02, fy - bh * 0.95, fx - bw * 0.13, fy - bh * 0.85);
    ctx.closePath();
    ctx.fillStyle = "#3E4042";
    ctx.fill();

    // 4. 细长竹钓竿与一缕垂入江面的钓丝
    const rodTipX = cx + bw * 0.62;
    const rodTipY = cy - bh * 1.35;
    ctx.beginPath();
    ctx.moveTo(fx + bw * 0.07, fy - bh * 0.35);
    ctx.quadraticCurveTo(fx + bw * 0.34, fy - bh * 1.1, rodTipX, rodTipY);
    ctx.strokeStyle = "#232528";
    ctx.lineWidth = Math.max(1.1, h * 0.016);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rodTipX, rodTipY);
    ctx.lineTo(rodTipX + bw * 0.03, cy + bh * 1.32);
    ctx.strokeStyle = "rgba(42, 43, 45, 0.42)";
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // 极小朱印一枚落于船尾侧下方（仅在画幅够大时点缀）
    if (w > 60) {
      const sealS = clamp(w * 0.06, 6, 11);
      ctx.fillStyle = "rgba(182, 42, 36, 0.78)";
      ctx.fillRect(cx - bw * 0.56, cy + bh * 0.65, sealS, sealS);
    }

    if (hoverTarget === "subject") {
      ctx.strokeStyle = PALETTE.blue;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // 绘制现代展讯「白墙极简器物海报」主题
  function drawExhibitSubject(subj, evalRes, reveal) {
    const x = px(subj.x);
    const y = py(subj.y);
    const w = px(subj.w);
    const h = py(subj.h);
    const cx = x + w * 0.5;

    ctx.save();
    // 1. 轻柔地面建筑斜影
    const shGrad = ctx.createLinearGradient(cx, y + h * 0.85, cx - w * 1.15, y + h * 1.04);
    shGrad.addColorStop(0, "rgba(58, 106, 199, 0.14)");
    shGrad.addColorStop(1, "rgba(253, 248, 244, 0)");
    ctx.beginPath();
    ctx.ellipse(cx - w * 0.25 * reveal, y + h * 0.88, w * 0.62 * reveal, h * 0.06, -0.08, 0, Math.PI * 2);
    ctx.fillStyle = shGrad;
    ctx.fill();

    // 2. 极简建筑感长颈哑光瓷瓶（纯轮廓几何美感，呼应 326 蓝白瓷气质）
    const neckW = w * 0.20;
    const bellyW = w * 0.78;
    const topY = y + h * 0.05;
    const neckEndY = y + h * 0.30;
    const bellyY = y + h * 0.58;
    const botY = y + h * 0.86;

    const bottleGrad = ctx.createLinearGradient(cx - bellyW * 0.5, topY, cx + bellyW * 0.5, botY);
    bottleGrad.addColorStop(0, "#E7EDF8");
    bottleGrad.addColorStop(0.5, "#3A6AC7");
    bottleGrad.addColorStop(1, "#214388");

    ctx.beginPath();
    ctx.moveTo(cx - neckW * 0.5, topY);
    ctx.lineTo(cx + neckW * 0.5, topY);
    ctx.bezierCurveTo(cx + neckW * 0.5, neckEndY, cx + bellyW * 0.56, bellyY - h * 0.16, cx + bellyW * 0.46, bellyY + h * 0.08);
    ctx.bezierCurveTo(cx + bellyW * 0.40, botY - h * 0.04, cx + w * 0.22, botY, cx + w * 0.18, botY);
    ctx.lineTo(cx - w * 0.18, botY);
    ctx.bezierCurveTo(cx - w * 0.22, botY, cx - bellyW * 0.40, botY - h * 0.04, cx - bellyW * 0.46, bellyY + h * 0.08);
    ctx.bezierCurveTo(cx - bellyW * 0.56, bellyY - h * 0.16, cx - neckW * 0.5, neckEndY, cx - neckW * 0.5, topY);
    ctx.closePath();
    ctx.fillStyle = bottleGrad;
    ctx.fill();

    // 高光细脊
    ctx.beginPath();
    ctx.moveTo(cx - neckW * 0.18, topY + h * 0.04);
    ctx.bezierCurveTo(cx - bellyW * 0.28, bellyY - h * 0.08, cx - bellyW * 0.26, bellyY + h * 0.10, cx - w * 0.12, botY - h * 0.04);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = Math.max(1.2, w * 0.03);
    ctx.stroke();

    // 极简展签短线与英文标号
    if (w > 46) {
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `500 ${clamp(w * 0.11, 9, 12)}px "Space Grotesk", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("GALLERY · NO.09", cx, y + h * 0.97);
    }

    if (hoverTarget === "subject") {
      ctx.strokeStyle = PALETTE.blue;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);
    }
    ctx.restore();
  }

  // 绘制 4 件「怕空病」冗余杂物（随 fade 平滑淡入淡出）
  function drawClutter(state, evalRes) {
    const th = THEMES[state.theme] || THEMES.poster;
    const { clutterRects } = evalRes.geom;
    hitZones.corner = null;
    hitZones.rival = null;
    hitZones.frameBadge = null;
    hitZones.gridBadge = null;

    // 1. 底层噪点细网格（grid）
    if (fade.grid > 0.02) {
      ctx.save();
      ctx.globalAlpha = fade.grid;
      const step = cssW < 420 ? 14 : 18;
      ctx.strokeStyle = state.theme === "song" ? "rgba(62, 56, 48, 0.16)" : "rgba(60, 74, 98, 0.13)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (state.theme === "exhibit") {
        for (let d = -cssH; d < cssW + cssH; d += step) {
          ctx.moveTo(d, 0);
          ctx.lineTo(d + cssH * 0.7, cssH);
        }
      } else if (state.theme === "song") {
        // 密杂乱皴短线
        for (let gy = 16; gy < cssH - 16; gy += step) {
          for (let gx = 16; gx < cssW - 16; gx += step * 1.4) {
            const jx = ((gx * 17 + gy * 31) % 7) - 3;
            ctx.moveTo(gx + jx, gy);
            ctx.lineTo(gx + jx + 7, gy + 5);
          }
        }
      } else {
        for (let gx = step; gx < cssW; gx += step) {
          ctx.moveTo(gx + 0.5, 0);
          ctx.lineTo(gx + 0.5, cssH);
        }
        for (let gy = step; gy < cssH; gy += step) {
          ctx.moveTo(0, gy + 0.5);
          ctx.lineTo(cssW, gy + 0.5);
        }
      }
      ctx.stroke();

      if (state.clutter.grid) {
        hitZones.gridBadge = drawActionTag(cssW * 0.21, cssH * 0.49, th.clutterHints.grid, hoverTarget === "grid", true);
      }
      ctx.restore();
    }

    // 2. 四周粗装饰死框（frame）
    if (fade.frame > 0.02) {
      ctx.save();
      ctx.globalAlpha = fade.frame;
      const fx = px(clutterRects.frame.thicknessX);
      const fy = py(clutterRects.frame.thicknessY);
      ctx.fillStyle = "rgba(29, 29, 29, 0.08)";
      ctx.fillRect(0, 0, cssW, fy);
      ctx.fillRect(0, cssH - fy, cssW, fy);
      ctx.fillRect(0, fy, fx, cssH - fy * 2);
      ctx.fillRect(cssW - fx, fy, fx, cssH - fy * 2);

      ctx.strokeStyle = "#3A3A3A";
      ctx.lineWidth = 3;
      ctx.strokeRect(fx * 0.45, fy * 0.45, cssW - fx * 0.9, cssH - fy * 0.9);
      ctx.lineWidth = 1;
      ctx.strokeRect(fx, fy, cssW - fx * 2, cssH - fy * 2);

      if (state.clutter.frame) {
        hitZones.frameBadge = drawActionTag(cssW * 0.50, cssH - Math.max(22, fy * 0.6), th.clutterHints.frame, hoverTarget === "frame", true);
      }
      ctx.restore();
    }

    // 3. 左上满角堵白块（corner）
    if (fade.corner > 0.02) {
      const r = clutterRects.corner;
      const x = px(r.x), y = py(r.y), w = px(r.w), h = py(r.h);
      ctx.save();
      ctx.globalAlpha = fade.corner;
      ctx.fillStyle = state.theme === "song" ? "rgba(68, 76, 68, 0.22)" : "rgba(58, 106, 199, 0.14)";
      ctx.fillRect(x, y, w, h);

      // 装饰冗余内部纹路
      ctx.strokeStyle = hoverTarget === "corner" ? PALETTE.err : "rgba(182, 42, 36, 0.72)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      if (state.theme === "song") {
        // 冗余堵气远山线条
        ctx.beginPath();
        ctx.moveTo(x + 8, y + h - 8);
        ctx.lineTo(x + w * 0.34, y + h * 0.25);
        ctx.lineTo(x + w * 0.58, y + h * 0.62);
        ctx.lineTo(x + w * 0.82, y + h * 0.22);
        ctx.lineTo(x + w - 8, y + h - 8);
        ctx.strokeStyle = "rgba(42, 46, 44, 0.55)";
        ctx.lineWidth = 1.6;
        ctx.stroke();
      } else {
        // 繁复满角花饰与无用角标条
        ctx.fillStyle = "rgba(29, 29, 29, 0.18)";
        ctx.fillRect(x + 12, y + 12, w * 0.45, 7);
        ctx.fillRect(x + 12, y + 25, w * 0.72, 5);
        ctx.fillRect(x + 12, y + 36, w * 0.56, 5);
      }

      if (state.clutter.corner) {
        drawActionTag(x + w * 0.5, y + h * 0.62, th.clutterHints.corner, hoverTarget === "corner");
        hitZones.corner = { x, y, w, h };
      }
      ctx.restore();
    }

    // 4. 右下争主副块（rival）
    if (fade.rival > 0.02) {
      const r = clutterRects.rival;
      const x = px(r.x), y = py(r.y), w = px(r.w), h = py(r.h);
      ctx.save();
      ctx.globalAlpha = fade.rival;
      ctx.fillStyle = state.theme === "song" ? "rgba(182, 42, 36, 0.14)" : "rgba(29, 29, 29, 0.12)";
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = hoverTarget === "rival" ? PALETTE.err : "rgba(182, 42, 36, 0.72)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      if (state.theme === "song") {
        // 繁复假印章与满行题跋竖线
        ctx.fillStyle = "rgba(182, 42, 36, 0.45)";
        ctx.fillRect(x + 12, y + 12, 16, 16);
        ctx.fillRect(x + 34, y + 12, 16, 16);
        ctx.strokeStyle = "rgba(42, 43, 45, 0.35)";
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 4; i++) {
          const lx = x + w - 16 - i * 12;
          if (lx > x + 56) {
            ctx.beginPath();
            ctx.moveTo(lx, y + 12);
            ctx.lineTo(lx, y + h - 34);
            ctx.stroke();
          }
        }
      } else {
        // 抢戏的大圆实心副块
        ctx.beginPath();
        ctx.arc(x + w * 0.34, y + h * 0.38, Math.min(w, h) * 0.24, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(58, 106, 199, 0.45)";
        ctx.fill();
        ctx.fillStyle = "rgba(29, 29, 29, 0.22)";
        ctx.fillRect(x + w * 0.62, y + h * 0.24, w * 0.26, 7);
        ctx.fillRect(x + w * 0.62, y + h * 0.38, w * 0.20, 5);
      }

      if (state.clutter.rival) {
        drawActionTag(x + w * 0.5, y + h * 0.68, th.clutterHints.rival, hoverTarget === "rival");
        hitZones.rival = { x, y, w, h };
      }
      ctx.restore();
    }
  }

  // 绘制「最大连续留白连通域」显影场（让玩家直观看到留白是连成整片还是被切碎！）
  function drawVoidOverlay(evalRes) {
    if (fade.voidMap <= 0.02) return;
    const vr = evalRes.largestVoidRect;
    const x = px(vr.x), y = py(vr.y), w = px(vr.w), h = py(vr.h);
    if (w < 10 || h < 10) return;

    ctx.save();
    ctx.globalAlpha = fade.voidMap;
    ctx.fillStyle = evalRes.checks.cohesion ? "rgba(58, 106, 199, 0.09)" : "rgba(182, 42, 36, 0.08)";
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = evalRes.checks.cohesion ? PALETTE.blue : PALETTE.err;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.setLineDash([]);

    // 显影标注
    const lbl = `最大连续整白区 ${evalRes.largestVoidPct}%`;
    ctx.font = `500 ${cssW < 420 ? 11 : 12}px "DM Mono", "Noto Sans SC", monospace`;
    const tw = ctx.measureText(lbl).width;
    const bx = clamp(x + 10, 10, cssW - tw - 24);
    const by = clamp(y + 10, 10, cssH - 34);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(bx, by, tw + 14, 22);
    ctx.strokeStyle = evalRes.checks.cohesion ? PALETTE.blue : PALETTE.err;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, tw + 13, 21);
    ctx.fillStyle = evalRes.checks.cohesion ? PALETTE.blueDeep : PALETTE.err;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(lbl, bx + 7, by + 11.5);
    ctx.restore();
  }

  // 绘制四角极简建筑画廊标尺与顶部轻读数
  function drawGalleryChrome(state, evalRes) {
    ctx.save();
    const m = 10;
    const arm = 9;
    ctx.strokeStyle = "rgba(29, 29, 29, 0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    // 四角细刻度
    ctx.moveTo(m, m + arm); ctx.lineTo(m, m); ctx.lineTo(m + arm, m);
    ctx.moveTo(cssW - m - arm, m); ctx.lineTo(cssW - m, m); ctx.lineTo(cssW - m, m + arm);
    ctx.moveTo(m, cssH - m - arm); ctx.lineTo(m, cssH - m); ctx.lineTo(m + arm, cssH - m);
    ctx.moveTo(cssW - m - arm, cssH - m); ctx.lineTo(cssW - m, cssH - m); ctx.lineTo(cssW - m, cssH - m - arm);
    ctx.stroke();

    // 若发生撞边错态，在过近边沿亮起细红警示线
    if (evalRes.minMarginPct < 6) {
      const s = evalRes.geom.subject;
      ctx.strokeStyle = PALETTE.err;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      if (s.x * 100 < 6) { ctx.moveTo(2, 0); ctx.lineTo(2, cssH); }
      if ((1 - s.x - s.w) * 100 < 6) { ctx.moveTo(cssW - 2, 0); ctx.lineTo(cssW - 2, cssH); }
      if (s.y * 100 < 6) { ctx.moveTo(0, 2); ctx.lineTo(cssW, 2); }
      if ((1 - s.y - s.h) * 100 < 6) { ctx.moveTo(0, cssH - 2); ctx.lineTo(cssW, cssH - 2); }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 顶部极轻的实测浮标（位于左上安全位，无杂块遮挡时清晰）
    const hud = `净留白 ${evalRes.whitePct}% · 整白 ${evalRes.largestVoidPct}% · 主体 ${evalRes.subjectPct}%`;
    ctx.font = `500 ${cssW < 420 ? 11 : 12}px "DM Mono", "Noto Sans SC", monospace`;
    const hw = ctx.measureText(hud).width + 16;
    const hx = cssW - hw - 14;
    const hy = 14;
    ctx.fillStyle = "rgba(255, 253, 251, 0.92)";
    ctx.fillRect(hx, hy, hw, 24);
    ctx.strokeStyle = evalRes.passCount === 4 ? "rgba(25, 107, 74, 0.35)" : "rgba(29, 29, 29, 0.14)";
    ctx.lineWidth = 1;
    ctx.strokeRect(hx + 0.5, hy + 0.5, hw - 1, 23);
    ctx.fillStyle = evalRes.passCount === 4 ? PALETTE.ok : PALETTE.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(hud, hx + 8, hy + 12.5);
    ctx.restore();
  }

  function frame(t, dt, { still }) {
    resize();
    const state = getState();

    // 检查是否仍在开场/淡入淡出过渡或有状态脏标；静置后零绘制，保证低配机与软光栅帧率
    let animating = !still && intro < 1;
    for (const k of ["frame", "grid", "corner", "rival"]) {
      const target = state.clutter[k] ? 1 : 0;
      if (!still && Math.abs(target - fade[k]) > 0.005) animating = true;
    }
    const vmTarget = state.showVoidMap ? 1 : 0;
    if (!still && Math.abs(vmTarget - fade.voidMap) > 0.005) animating = true;

    if (!dirty && !animating && !still) return;
    dirty = false;

    const aspect = cssW / Math.max(1, cssH);
    const evalRes = evaluate(state, aspect);

    // 丝滑过渡（reducedMotion 时跳过补间）
    const step = still ? 1 : Math.min(1, (dt || 0.016) * 9);
    intro = still ? 1 : Math.min(1, intro + (dt || 0.016) * 2.2);
    for (const k of ["frame", "grid", "corner", "rival"]) {
      const target = state.clutter[k] ? 1 : 0;
      fade[k] = Math.abs(target - fade[k]) <= 0.005 ? target : fade[k] + (target - fade[k]) * step;
    }
    fade.voidMap = Math.abs(vmTarget - fade.voidMap) <= 0.005 ? vmTarget : fade.voidMap + (vmTarget - fade.voidMap) * step;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 铺画廊暖瓷壁面（纯净极简平涂，还原 326 原海报白墙且极速软光栅友好）
    ctx.fillStyle =
      state.theme === "song" ? PALETTE.songBg :
      state.theme === "exhibit" ? PALETTE.exhibitBg : PALETTE.posterBg;
    ctx.fillRect(0, 0, cssW, cssH);

    // 2. 最大连续整白区显影层（在主体下方）
    drawVoidOverlay(evalRes);

    // 3. 绘制核心主体
    const subj = evalRes.geom.subject;
    hitZones.subject = { x: px(subj.x), y: py(subj.y), w: px(subj.w), h: py(subj.h) };
    const reveal = 0.25 + 0.75 * (1 - Math.pow(1 - intro, 3));
    if (state.theme === "song") drawSongSubject(subj, evalRes, reveal);
    else if (state.theme === "exhibit") drawExhibitSubject(subj, evalRes, reveal);
    else drawPosterSubject(subj, evalRes, reveal);

    // 4. 绘制怕空病杂件与可点红签
    drawClutter(state, evalRes);

    // 5. 四角画廊细标尺与实测浮标
    drawGalleryChrome(state, evalRes);

    ctx.restore();
  }

  const ctrl = loop(canvas, frame);

  // ---------- 交互：直点撤杂、拖移主体、空白横拖雕塑留白占幅 ----------
  function pointIn(pt, box) {
    return box && pt.x >= box.x && pt.x <= box.x + box.w && pt.y >= box.y && pt.y <= box.y + box.h;
  }

  function localPoint(e) {
    const r = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function hitTest(pt) {
    // 优先检测可点击的红签和杂件
    if (pointIn(pt, hitZones.gridBadge)) return "grid";
    if (pointIn(pt, hitZones.frameBadge)) return "frame";
    if (pointIn(pt, hitZones.corner)) return "corner";
    if (pointIn(pt, hitZones.rival)) return "rival";
    if (pointIn(pt, hitZones.subject)) return "subject";
    return null;
  }

  let drag = null;

  function onDown(pt, isTouch) {
    const hit = hitTest(pt);
    const s = getState();
    drag = {
      startX: pt.x,
      startY: pt.y,
      moved: false,
      hit,
      mode: hit === "subject" ? "move" : (hit ? "click_clutter" : "scale_drag"),
      initSx: s.sx,
      initSy: s.sy,
      initScale: s.scale,
      isTouch,
      scrollAbort: false,
    };
  }

  function onMove(pt, ev) {
    if (!drag) {
      const h = hitTest(pt);
      if (h !== hoverTarget) {
        hoverTarget = h;
        canvas.style.cursor = h === "subject" ? "grab" : h ? "pointer" : "ew-resize";
        dirty = true;
      }
      return;
    }
    if (drag.scrollAbort) return;

    const dx = pt.x - drag.startX;
    const dy = pt.y - drag.startY;
    const dist = Math.hypot(dx, dy);

    // 触屏：若用户明显想上下滚页面且不是抓主体，不拦滚动
    if (drag.isTouch && !drag.moved && dist > 6) {
      if (Math.abs(dy) > Math.abs(dx) * 1.25 && drag.mode !== "move") {
        drag.scrollAbort = true;
        return;
      }
    }

    if (dist > 5) {
      drag.moved = true;
      // 即使起手按在杂件上，只要明显横向拖动（如 perf 从中心左右横拖），立刻转成连续缩放留白气口！
      if (drag.mode === "click_clutter" && Math.abs(dx) > 8) {
        drag.mode = "scale_drag";
      }
    }

    if (!drag.moved) return;
    if (ev && ev.cancelable) ev.preventDefault();

    if (drag.mode === "move") {
      const nextSx = clamp(drag.initSx + dx / Math.max(1, cssW), 0.14, 0.86);
      const nextSy = clamp(drag.initSy + dy / Math.max(1, cssH), 0.16, 0.84);
      onMutate({ sx: nextSx, sy: nextSy });
    } else if (drag.mode === "scale_drag") {
      // 横向拖动直接推开或收紧主体尺度，实时雕塑留白呼吸率
      const deltaScale = (dx / Math.max(220, cssW * 0.55)) * 1.15;
      const nextScale = clamp(drag.initScale + deltaScale, 0.20, 1.45);
      onMutate({ scale: nextScale });
    }
  }

  function onUp() {
    if (!drag) return;
    if (!drag.moved && drag.hit && drag.hit !== "subject") {
      const s = getState();
      const key = drag.hit;
      onMutate({ clutter: { ...s.clutter, [key]: !s.clutter[key] } });
    }
    drag = null;
  }

  // 鼠标事件
  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    onDown(localPoint(e), false);
    canvas.style.cursor = drag.mode === "move" ? "grabbing" : "ew-resize";
  });
  window.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    const pt = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (drag || (pt.x >= 0 && pt.x <= r.width && pt.y >= 0 && pt.y <= r.height)) {
      onMove(pt, e);
    }
  });
  window.addEventListener("mouseup", () => {
    onUp();
    canvas.style.cursor = hoverTarget === "subject" ? "grab" : hoverTarget ? "pointer" : "ew-resize";
  });

  // 触屏事件（完美配合 tools/perf.mjs 的 Input.dispatchTouchEvent！）
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    onDown(localPoint(e), true);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!e.touches.length || !drag) return;
    onMove(localPoint(e), e);
  }, { passive: false });
  canvas.addEventListener("touchend", () => onUp(), { passive: true });
  canvas.addEventListener("touchcancel", () => { drag = null; }, { passive: true });

  // 键盘操作
  canvas.addEventListener("keydown", (e) => {
    const s = getState();
    const stepPos = e.shiftKey ? 0.06 : 0.025;
    if (e.key === "ArrowLeft") { e.preventDefault(); onMutate({ sx: clamp(s.sx - stepPos, 0.14, 0.86) }); }
    else if (e.key === "ArrowRight") { e.preventDefault(); onMutate({ sx: clamp(s.sx + stepPos, 0.14, 0.86) }); }
    else if (e.key === "ArrowUp") { e.preventDefault(); onMutate({ sy: clamp(s.sy - stepPos, 0.16, 0.84) }); }
    else if (e.key === "ArrowDown") { e.preventDefault(); onMutate({ sy: clamp(s.sy + stepPos, 0.16, 0.84) }); }
    else if (e.key === "+" || e.key === "=" || e.key === "]") { e.preventDefault(); onMutate({ scale: clamp(s.scale + 0.06, 0.20, 1.45) }); }
    else if (e.key === "-" || e.key === "_" || e.key === "[") { e.preventDefault(); onMutate({ scale: clamp(s.scale - 0.06, 0.20, 1.45) }); }
    else if (e.key === " ") { e.preventDefault(); onMutate({ showVoidMap: !s.showVoidMap }); }
  });

  const ro = new ResizeObserver(() => {
    resize();
    dirty = true;
    ctrl.draw();
    if (onResize) onResize();
  });
  ro.observe(canvas);
  resize();

  return {
    markDirty: () => {
      dirty = true;
      if (reducedMotion.matches) ctrl.draw();
    },
    draw: () => {
      dirty = true;
      ctrl.draw();
    },
    getAspect: () => cssW / Math.max(1, cssH),
  };
}

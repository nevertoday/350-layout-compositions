// 253 悬浮层 · 轻量 2D Canvas 真三维透视投影引擎（像素空间字号，杜绝亚像素字体截断）
// 采用正交旋转矩阵 Rx(pitch) * Ry(yaw) 把三层物理卡片、侧面厚度、四壳柔边阴影与 Z 轴高程标尺直接渲染到 2D 画布，
// 零 WebGL 依赖、零高成本 shadowBlur 模糊滤镜，在 6× 降速手机与软件渲染下稳定 60fps。

import { pixelRatio } from "../../lib/stage.js";
import { analyze, clamp, LAYERS_META, SCENES, shadowTokens } from "./model.js";

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function createHeroStage(canvas, getState, onAction) {
  const ctx = canvas.getContext("2d");
  let cssW = 760;
  let cssH = 500;
  let dpr = 1;

  const anim = {
    peel: 18,
    elevation: 0,
    secElevation: 0,
    scrim: 0,
    focusShift: 0,
    intro: 0,
    zPos: { bg: 0, focus: 1, secondary: 2 },
  };
  let hoverLayer = null;
  let pointerDrag = null;
  let touchDrag = null;
  let lastDrawMatrices = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = pixelRatio(2);
    cssW = rect.width;
    cssH = rect.height;
    const bw = Math.round(cssW * dpr);
    const bh = Math.round(cssH * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
  }

  // 构建 3D 像素空间旋转投影（单位为 CSS 像素，保证字号正常且锐利）
  function buildProjection(peelDeg) {
    const yaw = (peelDeg * Math.PI) / 180;
    const pitch = ((peelDeg * 0.28) * Math.PI) / 180;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);

    const S = Math.min(cssW * 0.45, cssH * 0.64);
    const ox = cssW * 0.50 - sy * S * 0.08;
    const oy = cssH * 0.51;

    return {
      S,
      ox,
      oy,
      project(u, v, z) {
        const px = u * S;
        const py = v * S;
        const pz = z * S;
        return {
          x: ox + px * cy + pz * sy,
          y: oy + px * sy * sp + py * cp - pz * cy * sp,
        };
      },
      // 单位像素坐标 (px, py) 的 2D 仿射变换矩阵
      planeMatrixPx(z) {
        const pz = z * S;
        return [cy, sy * sp, 0, cp, ox + pz * sy, oy - pz * cy * sp];
      },
    };
  }

  function unprojectPlanePx(sx, sy, m) {
    const [a, b, c, d, e, f] = m;
    const det = a * d - b * c;
    if (Math.abs(det) < 1e-6) return null;
    const dx = sx - e;
    const dy = sy - f;
    return {
      px: (d * dx - c * dy) / det,
      py: (-b * dx + a * dy) / det,
    };
  }

  function toPxRect(r, S) {
    return { x: r.x * S, y: r.y * S, w: r.w * S, h: r.h * S, r: r.r * S };
  }

  function drawBgCardFace(r, scene, S) {
    const grad = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    grad.addColorStop(0, "#6A5284");
    grad.addColorStop(1, "#4D3963");
    roundRectPath(ctx, r.x, r.y, r.w, r.h, r.r);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.save();
    roundRectPath(ctx, r.x, r.y, r.w, r.h, r.r);
    ctx.clip();

    if (scene === "poster") {
      // 原海报背景卡右上 6×6 点阵
      ctx.fillStyle = "rgba(226, 212, 244, 0.48)";
      const cols = 6;
      const rows = 6;
      const startX = r.x + r.w * 0.56;
      const startY = r.y + r.h * 0.065;
      const stepX = (r.w * 0.36) / (cols - 1);
      const stepY = (r.h * 0.22) / (rows - 1);
      const dotR = Math.max(1.4, S * 0.0068);
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          ctx.beginPath();
          ctx.arc(startX + i * stepX, startY + j * stepY, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // 原海报背景卡三道同心弧线
      ctx.strokeStyle = "rgba(216, 200, 238, 0.26)";
      ctx.lineWidth = Math.max(1.1, S * 0.005);
      const arcCx = r.x + r.w * 0.22;
      const arcCy = r.y + r.h * 0.56;
      for (let k = 1; k <= 3; k++) {
        ctx.beginPath();
        ctx.arc(arcCx, arcCy, (0.14 + k * 0.11) * S, -Math.PI * 0.46, Math.PI * 0.24);
        ctx.stroke();
      }
    } else if (scene === "modal") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillRect(r.x, r.y, r.w, 0.11 * S);
      ctx.fillStyle = "rgba(236, 230, 224, 0.54)";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(r.x + (0.065 + i * 0.036) * S, r.y + 0.055 * S, 0.011 * S, 0, Math.PI * 2);
        ctx.fill();
      }
      const fSize = Math.max(10, Math.round(0.038 * S));
      ctx.font = `600 ${fSize}px "Sora", sans-serif`;
      ctx.fillStyle = "rgba(236, 230, 224, 0.78)";
      ctx.fillText("WORKSPACE · DESIGN SYSTEM v2.4", r.x + 0.19 * S, r.y + 0.068 * S);
      for (let row = 0; row < 6; row++) {
        const yy = r.y + (0.18 + row * 0.135) * S;
        ctx.fillStyle = row === 1 ? "rgba(236, 114, 162, 0.20)" : "rgba(255, 255, 255, 0.07)";
        roundRectPath(ctx, r.x + 0.05 * S, yy, r.w * 0.48, 0.095 * S, 0.018 * S);
        ctx.fill();
        ctx.fillStyle = "rgba(236, 230, 224, 0.44)";
        ctx.fillRect(r.x + 0.08 * S, yy + 0.03 * S, r.w * (0.28 + (row % 3) * 0.05), 0.016 * S);
        ctx.fillStyle = "rgba(236, 230, 224, 0.24)";
        ctx.fillRect(r.x + 0.08 * S, yy + 0.06 * S, r.w * 0.20, 0.012 * S);
      }
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.09)";
      ctx.fillRect(r.x, r.y, r.w, 0.10 * S);
      const fSize = Math.max(10, Math.round(0.038 * S));
      ctx.font = `600 ${fSize}px "Sora", sans-serif`;
      ctx.fillStyle = "rgba(236, 230, 224, 0.78)";
      ctx.fillText("CERAMIC STUDIO · CATALOG", r.x + 0.06 * S, r.y + 0.064 * S);
      for (let gx = 0; gx < 3; gx++) {
        for (let gy = 0; gy < 2; gy++) {
          const cx = r.x + (0.06 + gx * 0.415) * S;
          const cy = r.y + (0.145 + gy * 0.36) * S;
          ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
          roundRectPath(ctx, cx, cy, 0.365 * S, 0.30 * S, 0.024 * S);
          ctx.fill();
          ctx.fillStyle = gx === 1 && gy === 0 ? "rgba(236, 114, 162, 0.50)" : "rgba(168, 200, 187, 0.24)";
          ctx.beginPath();
          ctx.arc(cx + 0.18 * S, cy + 0.12 * S, 0.062 * S, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(236, 230, 224, 0.34)";
          ctx.fillRect(cx + 0.05 * S, cy + 0.225 * S, 0.18 * S, 0.016 * S);
        }
      }
    }

    ctx.restore();
    roundRectPath(ctx, r.x, r.y, r.w, r.h, r.r);
    ctx.strokeStyle = hoverLayer === "bg" ? "#E8DCF9" : "rgba(186, 166, 214, 0.58)";
    ctx.lineWidth = hoverLayer === "bg" ? 2.4 : 1.4;
    ctx.stroke();
  }

  function drawSecondaryCardFace(r, scene, info, S) {
    const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    grad.addColorStop(0, "#B8D6C9");
    grad.addColorStop(1, "#9BBDB0");
    roundRectPath(ctx, r.x, r.y, r.w, r.h, r.r);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.save();
    roundRectPath(ctx, r.x, r.y, r.w, r.h, r.r);
    ctx.clip();

    if (scene === "poster") {
      // 原海报次级卡暖白三角
      const tx = r.x + r.w * 0.59;
      const ty = r.y + r.h * 0.13;
      const ts = r.w * 0.48;
      ctx.fillStyle = "#ECE6E0";
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + ts * 0.54, ty + ts * 0.90);
      ctx.lineTo(tx - ts * 0.54, ty + ts * 0.90);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#142721";
      ctx.font = `700 ${Math.max(10, Math.round(0.052 * S))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(info.secTitle, r.x + 0.052 * S, r.y + r.h * 0.68);

      ctx.fillStyle = "#223F36";
      ctx.font = `500 ${Math.max(9, Math.round(0.032 * S))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(info.secSub, r.x + 0.052 * S, r.y + r.h * 0.78);

      ctx.fillStyle = "#175443";
      ctx.font = `500 ${Math.max(8, Math.round(0.0255 * S))}px "DM Mono", monospace`;
      ctx.fillText(info.secEn, r.x + 0.052 * S, r.y + r.h * 0.88);
    } else if (scene === "modal") {
      ctx.fillStyle = "#142721";
      ctx.font = `700 ${Math.max(12, Math.round(0.050 * S))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(info.secTitle, r.x + 0.055 * S, r.y + 0.115 * S);
      ctx.fillStyle = "#175443";
      ctx.font = `500 ${Math.max(9, Math.round(0.029 * S))}px "DM Mono", monospace`;
      ctx.fillText(info.secEn, r.x + 0.055 * S, r.y + 0.17 * S);
      for (let i = 0; i < 4; i++) {
        const yy = r.y + (0.24 + i * 0.135) * S;
        ctx.fillStyle = "rgba(236, 230, 224, 0.76)";
        roundRectPath(ctx, r.x + 0.055 * S, yy, r.w - 0.11 * S, 0.095 * S, 0.018 * S);
        ctx.fill();
        ctx.fillStyle = "#234037";
        ctx.fillRect(r.x + 0.085 * S, yy + 0.032 * S, (r.w - 0.21 * S) * (0.74 - i * 0.08), 0.015 * S);
        ctx.fillStyle = "rgba(35, 64, 55, 0.45)";
        ctx.fillRect(r.x + 0.085 * S, yy + 0.060 * S, (r.w - 0.21 * S) * 0.46, 0.012 * S);
      }
    } else {
      ctx.fillStyle = "#142721";
      ctx.font = `700 ${Math.max(11, Math.round(0.046 * S))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(info.secTitle, r.x + 0.055 * S, r.y + 0.11 * S);
      ctx.fillStyle = "#175443";
      ctx.font = `500 ${Math.max(10, Math.round(0.032 * S))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(info.secSub, r.x + 0.055 * S, r.y + 0.18 * S);
      const chips = ["全部 24", "哑光釉", "现货"];
      chips.forEach((c, idx) => {
        const cx = r.x + r.w - (0.56 - idx * 0.175) * S;
        ctx.fillStyle = idx === 1 ? "#175443" : "rgba(236, 230, 224, 0.82)";
        roundRectPath(ctx, cx, r.y + 0.095 * S, 0.155 * S, 0.09 * S, 0.045 * S);
        ctx.fill();
        ctx.fillStyle = idx === 1 ? "#ECE6E0" : "#142721";
        ctx.font = `600 ${Math.max(9, Math.round(0.029 * S))}px "Noto Sans SC", sans-serif`;
        ctx.fillText(c, cx + 0.022 * S, r.y + 0.152 * S);
      });
    }

    ctx.restore();
    roundRectPath(ctx, r.x, r.y, r.w, r.h, r.r);
    ctx.strokeStyle = hoverLayer === "secondary" ? "#FFFFFF" : "rgba(255, 255, 255, 0.36)";
    ctx.lineWidth = hoverLayer === "secondary" ? 2.4 : 1.2;
    ctx.stroke();
  }

  function drawFocusCardFace(r, scene, info, diag, S) {
    const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    grad.addColorStop(0, "#F2EDE7");
    grad.addColorStop(1, "#E5DED6");
    roundRectPath(ctx, r.x, r.y, r.w, r.h, r.r);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.save();
    roundRectPath(ctx, r.x, r.y, r.w, r.h, r.r);
    ctx.clip();

    if (scene === "poster") {
      // 原海报焦点层大玫瑰粉圆
      ctx.fillStyle = "#EC72A2";
      ctx.beginPath();
      ctx.arc(r.x + r.w * 0.73, r.y + r.h * 0.23, r.w * 0.165, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#1D1B1A";
      ctx.font = `800 ${Math.max(12, Math.round(0.062 * S))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(info.focusTitle, r.x + 0.062 * S, r.y + r.h * 0.45);
      ctx.fillText(info.focusSub, r.x + 0.062 * S, r.y + r.h * 0.56);

      ctx.fillStyle = "#BD3A71";
      ctx.font = `500 ${Math.max(8.5, Math.round(0.031 * S))}px "DM Mono", monospace`;
      ctx.fillText(info.focusEn, r.x + 0.062 * S, r.y + r.h * 0.655);

      const barW = [0.56, 0.56, 0.39];
      ctx.fillStyle = "#C7C0BB";
      barW.forEach((bw, idx) => {
        roundRectPath(ctx, r.x + 0.062 * S, r.y + r.h * (0.74 + idx * 0.058), r.w * bw, 0.017 * S, 0.0085 * S);
        ctx.fill();
      });
    } else if (scene === "modal") {
      ctx.fillStyle = "#EC72A2";
      ctx.beginPath();
      ctx.arc(r.x + 0.105 * S, r.y + 0.115 * S, 0.036 * S, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${Math.max(11, Math.round(0.044 * S))}px "Sora", sans-serif`;
      ctx.fillText("!", r.x + 0.097 * S, r.y + 0.130 * S);

      ctx.fillStyle = "#B02A62";
      ctx.font = `500 ${Math.max(9, Math.round(0.030 * S))}px "DM Mono", monospace`;
      ctx.fillText(info.focusEn, r.x + 0.165 * S, r.y + 0.125 * S);

      ctx.fillStyle = "#1D1B1A";
      ctx.font = `800 ${Math.max(13, Math.round(0.062 * S))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(info.focusTitle, r.x + 0.072 * S, r.y + 0.25 * S);

      ctx.fillStyle = "#4A4340";
      ctx.font = `400 ${Math.max(10, Math.round(0.036 * S))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(info.focusSub, r.x + 0.072 * S, r.y + 0.33 * S);
      ctx.fillText("可按 Esc 取消，或随时回滚。", r.x + 0.072 * S, r.y + 0.395 * S);

      ctx.strokeStyle = "rgba(31, 29, 27, 0.22)";
      ctx.lineWidth = 1.3;
      roundRectPath(ctx, r.x + 0.072 * S, r.y + r.h - 0.145 * S, 0.21 * S, 0.092 * S, 0.022 * S);
      ctx.stroke();
      ctx.fillStyle = "#3E3835";
      ctx.font = `600 ${Math.max(10, Math.round(0.035 * S))}px "Noto Sans SC", sans-serif`;
      ctx.fillText("取消", r.x + 0.138 * S, r.y + r.h - 0.086 * S);

      ctx.fillStyle = "#2D1F42";
      roundRectPath(ctx, r.x + r.w - 0.33 * S, r.y + r.h - 0.145 * S, 0.26 * S, 0.092 * S, 0.022 * S);
      ctx.fill();
      ctx.fillStyle = "#F5F0EC";
      ctx.fillText("确认发布", r.x + r.w - 0.272 * S, r.y + r.h - 0.086 * S);
    } else {
      ctx.fillStyle = "#F5E2EB";
      roundRectPath(ctx, r.x + 0.06 * S, r.y + 0.06 * S, r.w - 0.12 * S, 0.24 * S, 0.026 * S);
      ctx.fill();
      ctx.fillStyle = "#5D4774";
      roundRectPath(ctx, r.x + r.w * 0.5 - 0.07 * S, r.y + 0.105 * S, 0.14 * S, 0.145 * S, 0.032 * S);
      ctx.fill();
      ctx.strokeStyle = "#5D4774";
      ctx.lineWidth = Math.max(3, 0.017 * S);
      ctx.beginPath();
      ctx.arc(r.x + r.w * 0.5 + 0.075 * S, r.y + 0.175 * S, 0.035 * S, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
      ctx.fillStyle = "#EC72A2";
      ctx.beginPath();
      ctx.arc(r.x + r.w - 0.12 * S, r.y + 0.11 * S, 0.024 * S, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#1D1B1A";
      ctx.font = `800 ${Math.max(12, Math.round(0.054 * S))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(info.focusTitle, r.x + 0.062 * S, r.y + 0.39 * S);
      ctx.fillStyle = "#4A4340";
      ctx.font = `400 ${Math.max(10, Math.round(0.034 * S))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(info.focusSub, r.x + 0.062 * S, r.y + 0.465 * S);
      ctx.fillStyle = "#B02A62";
      ctx.font = `500 ${Math.max(9, Math.round(0.028 * S))}px "DM Mono", monospace`;
      ctx.fillText("NON-MODAL · LIGHT DISMISS", r.x + 0.062 * S, r.y + 0.545 * S);
    }

    ctx.restore();
    roundRectPath(ctx, r.x, r.y, r.w, r.h, r.r);
    ctx.strokeStyle = hoverLayer === "focus"
      ? "#EC72A2"
      : !diag.ok && diag.faults[0]?.id === "inverted"
        ? "rgba(236, 114, 162, 0.88)"
        : "rgba(255, 255, 255, 0.82)";
    ctx.lineWidth = hoverLayer === "focus" ? 2.6 : 1.4;
    ctx.stroke();
  }

  function drawPhysicalShadow(r, dp, S) {
    const sh = shadowTokens(dp);
    if (!sh.layers.length) return;
    const uScale = 0.0046 * S;
    for (let i = sh.layers.length - 1; i >= 0; i--) {
      const s = sh.layers[i];
      const pad = s.pad * uScale;
      const ox = s.ox * uScale;
      const oy = s.oy * uScale;
      roundRectPath(ctx, r.x + ox - pad, r.y + oy - pad * 0.7, r.w + pad * 2, r.h + pad * 1.7, r.r + pad * 0.6);
      ctx.fillStyle = `rgba(12, 6, 22, ${s.alpha.toFixed(3)})`;
      ctx.fill();
    }
  }

  function drawCardRimThickness(r, color, peelDeg, S) {
    if (peelDeg < 4) return;
    const thick = Math.min(0.018, (peelDeg / 52) * 0.018) * S;
    ctx.save();
    ctx.fillStyle = color;
    roundRectPath(ctx, r.x - thick * 0.85, r.y + thick * 0.35, r.w, r.h, r.r);
    ctx.fill();
    ctx.restore();
  }

  function renderFrame(t, dt, { still }) {
    resize();
    const state = getState();
    const diag = analyze(state);
    const info = SCENES[state.scene] || SCENES.poster;

    const k = still ? 1 : clamp(dt * 11, 0.10, 0.36);
    anim.intro = still ? 1 : clamp(anim.intro + (dt || 0.016) * 2.1, 0, 1);
    const easeIntro = 1 - Math.pow(1 - anim.intro, 3);

    anim.peel += (state.peel - anim.peel) * k;
    anim.elevation += (state.elevation - anim.elevation) * k;
    anim.secElevation += (state.secElevation - anim.secElevation) * k;
    anim.scrim += (state.scrim - anim.scrim) * k;
    anim.focusShift += (state.focusShift - anim.focusShift) * k;

    for (const id of ["bg", "secondary", "focus"]) {
      const targetZ = state.order.indexOf(id);
      anim.zPos[id] += (targetZ - anim.zPos[id]) * k;
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    // 深梅紫空间背景
    const bgGrad = ctx.createRadialGradient(cssW * 0.54, cssH * 0.44, cssW * 0.06, cssW * 0.5, cssH * 0.5, cssW * 0.72);
    bgGrad.addColorStop(0, "#3A2954");
    bgGrad.addColorStop(0.65, "#2C1E41");
    bgGrad.addColorStop(1, "#221633");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cssW, cssH);

    // 基准微网格
    const gridAlpha = 0.04 + (anim.peel / 52) * 0.08;
    ctx.strokeStyle = `rgba(186, 168, 214, ${gridAlpha.toFixed(3)})`;
    ctx.lineWidth = 1;
    const step = 36;
    ctx.beginPath();
    for (let x = (cssW % step) / 2; x < cssW; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cssH);
    }
    for (let y = (cssH % step) / 2; y < cssH; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(cssW, y);
    }
    ctx.stroke();

    const proj = buildProjection(anim.peel);
    const S = proj.S;
    const rects = diag.rects;

    const peelSpread = 0.04 + (anim.peel / 52) * 0.34;
    const zCoord = {};
    for (const id of ["bg", "secondary", "focus"]) {
      const rank = anim.zPos[id];
      const dpBoost = id === "focus"
        ? (anim.elevation / 24) * 0.16
        : id === "secondary"
          ? (anim.secElevation / 24) * 0.12
          : 0;
      const introDrop = (1 - easeIntro) * (id === "secondary" ? 0.16 : id === "focus" ? -0.09 : -0.16);
      zCoord[id] = (rank - 1) * peelSpread + dpBoost + introDrop;
    }

    // Z 轴剖视高程标尺（安放于左下净空区，绝不压卡片与底沿提示）
    if (anim.peel > 14 && cssW > 380 && cssH > 320) {
      const p0 = proj.project(-0.76, 0.56, zCoord.bg);
      const pTop = proj.project(-0.76, 0.56, Math.max(zCoord.focus, zCoord.secondary) + 0.04);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(236, 114, 162, 0.62)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(pTop.x, pTop.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#F5A8C8";
      ctx.font = '500 11px "DM Mono", monospace';
      ctx.fillText(`Z-AXIS · ${Math.round(anim.peel)}°`, Math.max(14, p0.x), p0.y + 16);
      ctx.restore();
    }

    lastDrawMatrices = [];
    const drawOrder = state.order;
    const topId = drawOrder[2];
    const focusRank = drawOrder.indexOf("focus");

    for (let idx = 0; idx < drawOrder.length; idx++) {
      const id = drawOrder[idx];
      const rLog = rects[id];
      const rPx = toPxRect(rLog, S);
      const z = zCoord[id];
      const m = proj.planeMatrixPx(z);

      // 背景遮罩层位于焦点卡正下方
      if (id === "focus" && idx === 2 && anim.scrim > 0.5) {
        ctx.save();
        const sm = proj.planeMatrixPx(z - 0.03);
        ctx.transform(sm[0], sm[1], sm[2], sm[3], sm[4], sm[5]);
        const scrimPx = toPxRect({ x: -0.78, y: -0.64, w: 1.56, h: 1.32, r: 0.05 }, S);
        roundRectPath(ctx, scrimPx.x, scrimPx.y, scrimPx.w, scrimPx.h, scrimPx.r);
        ctx.fillStyle = `rgba(14, 8, 26, ${(anim.scrim / 100).toFixed(3)})`;
        ctx.fill();
        if (anim.peel > 14) {
          ctx.strokeStyle = "rgba(178, 164, 205, 0.36)";
          ctx.lineWidth = 1.2;
          ctx.setLineDash([6, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
      }

      ctx.save();
      ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      const dp = id === "focus" ? anim.elevation : id === "secondary" ? anim.secElevation : 0;
      if (idx > 0 && dp > 0.2) {
        drawPhysicalShadow(rPx, dp, S);
      } else if (idx > 0 && anim.peel > 14) {
        drawPhysicalShadow(rPx, 1.5, S);
      }

      if (id === "bg") {
        drawCardRimThickness(rPx, "#3C2B50", anim.peel, S);
        drawBgCardFace(rPx, state.scene, S);
      } else if (id === "secondary") {
        drawCardRimThickness(rPx, "#76988A", anim.peel, S);
        drawSecondaryCardFace(rPx, state.scene, info, S);
      } else {
        drawCardRimThickness(rPx, "#BDB5AE", anim.peel, S);
        drawFocusCardFace(rPx, state.scene, info, diag, S);
      }
      ctx.restore();

      // 剖视展开超过 24° 时，再亮出带底胶囊的高程标牌，保证默认 18° 视角下原海报点阵纯净无遮挡
      if (anim.peel >= 24 && cssW > 420) {
        const corner = proj.project(rLog.x + rLog.w, rLog.y + 0.09, z);
        if (corner.x < cssW - 96) {
          ctx.save();
          ctx.fillStyle = LAYERS_META[id].dot;
          ctx.beginPath();
          ctx.arc(corner.x, corner.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = LAYERS_META[id].dot;
          ctx.globalAlpha = 0.72;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(corner.x + 4, corner.y);
          ctx.lineTo(corner.x + 15, corner.y);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.font = '500 11px "DM Mono", monospace';
          const label = `Z${idx + 1} · ${id === "focus" ? `${Math.round(anim.elevation)}dp` : id === "secondary" ? `${Math.round(anim.secElevation)}dp` : "0dp"}`;
          const lw = ctx.measureText(label).width + 12;
          roundRectPath(ctx, corner.x + 16, corner.y - 10, lw, 20, 4);
          ctx.fillStyle = "rgba(22, 13, 36, 0.88)";
          ctx.fill();
          ctx.strokeStyle = LAYERS_META[id].dot;
          ctx.lineWidth = 0.9;
          ctx.stroke();
          ctx.fillStyle = "#F5EFFA";
          ctx.fillText(label, corner.x + 22, corner.y + 4);
          ctx.restore();
        }
      }

      lastDrawMatrices.push({ id, rectPx: rPx, matrix: m });
    }

    // 倒挂态：标出真实被压盖的几何重叠区域
    if (focusRank < 2 && diag.occludedPct > 0) {
      const aboveIds = drawOrder.slice(focusRank + 1);
      const topCard = rects[topId];
      const fRect = rects.focus;
      const ix0 = Math.max(fRect.x, topCard.x);
      const iy0 = Math.max(fRect.y, topCard.y);
      const ix1 = Math.min(fRect.x + fRect.w, topCard.x + topCard.w);
      const iy1 = Math.min(fRect.y + fRect.h, topCard.y + topCard.h);
      if (ix1 > ix0 && iy1 > iy0 && aboveIds.includes(topId)) {
        const tm = proj.planeMatrixPx(zCoord[topId] + 0.005);
        ctx.save();
        ctx.transform(tm[0], tm[1], tm[2], tm[3], tm[4], tm[5]);
        ctx.strokeStyle = "#FF6B9D";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(ix0 * S, iy0 * S, (ix1 - ix0) * S, (iy1 - iy0) * S);
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(236, 72, 130, 0.16)";
        ctx.fillRect(ix0 * S, iy0 * S, (ix1 - ix0) * S, (iy1 - iy0) * S);
        ctx.restore();
      }
    }

    // 舞台顶部状态浮标与右下角提示
    const pillText = diag.ok ? `✓ ${diag.modeName}` : `× ${diag.modeName}`;
    ctx.save();
    ctx.font = '600 12px "Noto Sans SC", sans-serif';
    const tw = ctx.measureText(pillText).width;
    const pw = tw + 24;
    const ph = 28;
    roundRectPath(ctx, 12, 12, pw, ph, 14);
    ctx.fillStyle = diag.ok ? "rgba(22, 74, 58, 0.92)" : "rgba(134, 28, 66, 0.92)";
    ctx.fill();
    ctx.strokeStyle = diag.ok ? "rgba(168, 200, 187, 0.58)" : "rgba(255, 146, 184, 0.65)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#FBF7F4";
    ctx.fillText(pillText, 24, 30);

    const angText = `剖视 ${Math.round(anim.peel)}° · 对比 ${diag.lumContrast}:1`;
    ctx.font = '500 11px "DM Mono", monospace';
    const aw = ctx.measureText(angText).width + 20;
    if (cssW - aw - 12 > pw + 20) {
      roundRectPath(ctx, cssW - aw - 12, 12, aw, ph, 14);
      ctx.fillStyle = "rgba(24, 15, 38, 0.80)";
      ctx.fill();
      ctx.strokeStyle = "rgba(178, 164, 205, 0.36)";
      ctx.stroke();
      ctx.fillStyle = "#E8E0F4";
      ctx.fillText(angText, cssW - aw - 2, 30);
    }

    const footText = cssW < 420 ? "← 横拖剥开 Z 轴 · 点卡片置顶 →" : "← 左右横拖画布剥开 Z 轴剖面 · 直接点按卡片置顶 →";
    ctx.font = '400 11px "Noto Sans SC", sans-serif';
    const fw = ctx.measureText(footText).width;
    ctx.fillStyle = "rgba(232, 224, 244, 0.78)";
    ctx.fillText(footText, Math.max(12, (cssW - fw) / 2), cssH - 11);

    ctx.restore();
    ctx.restore();
  }

  function hitTest(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    for (let i = lastDrawMatrices.length - 1; i >= 0; i--) {
      const { id, rectPx: r, matrix } = lastDrawMatrices[i];
      const pt = unprojectPlanePx(sx, sy, matrix);
      if (pt && pt.px >= r.x && pt.px <= r.x + r.w && pt.py >= r.y && pt.py <= r.y + r.h) {
        return id;
      }
    }
    return null;
  }

  // 鼠标 / 笔走 PointerEvent；触屏走 TouchEvent，杜绝重复触发
  function onPointerDown(e) {
    if (e.pointerType === "touch" || (e.button && e.button !== 0)) return;
    const state = getState();
    pointerDrag = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startPeel: state.peel,
      moved: false,
      hit: hitTest(e.clientX, e.clientY),
    };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
  }

  function onPointerMove(e) {
    if (e.pointerType === "touch") return;
    if (!pointerDrag) {
      const h = hitTest(e.clientX, e.clientY);
      if (h !== hoverLayer) {
        hoverLayer = h;
        canvas.style.cursor = h ? "pointer" : "grab";
        onAction({ type: "redraw" });
      }
      return;
    }
    const dx = e.clientX - pointerDrag.startX;
    if (Math.abs(dx) > 5) {
      pointerDrag.moved = true;
      canvas.style.cursor = "grabbing";
      onAction({ type: "peel", value: clamp(Math.round(pointerDrag.startPeel + dx * 0.24), 0, 52) });
    }
  }

  function onPointerUp(e) {
    if (e.pointerType === "touch" || !pointerDrag) return;
    const info = pointerDrag;
    pointerDrag = null;
    canvas.style.cursor = hoverLayer ? "pointer" : "grab";
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
    if (!info.moved && info.hit) {
      onAction({ type: "clickLayer", layer: info.hit });
    }
  }

  function onTouchStart(e) {
    if (!e.touches.length) return;
    const t0 = e.touches[0];
    const state = getState();
    touchDrag = {
      startX: t0.clientX,
      startY: t0.clientY,
      startPeel: state.peel,
      moved: false,
      locked: null,
      hit: hitTest(t0.clientX, t0.clientY),
    };
  }

  function onTouchMove(e) {
    if (!touchDrag || !e.touches.length) return;
    const t0 = e.touches[0];
    const dx = t0.clientX - touchDrag.startX;
    const dy = t0.clientY - touchDrag.startY;
    if (!touchDrag.locked && Math.hypot(dx, dy) > 5) {
      touchDrag.locked = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
    }
    if (touchDrag.locked === "h") {
      touchDrag.moved = true;
      if (e.cancelable) e.preventDefault();
      onAction({ type: "peel", value: clamp(Math.round(touchDrag.startPeel + dx * 0.28), 0, 52) });
    }
  }

  function onTouchEnd() {
    if (!touchDrag) return;
    const info = touchDrag;
    touchDrag = null;
    if (!info.moved && info.hit) {
      onAction({ type: "clickLayer", layer: info.hit });
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd);

  return { renderFrame, resize };
}

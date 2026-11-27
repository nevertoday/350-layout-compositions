// 093 开场主角玩具：焦点独裁·光学暗房台（Single-Focus Saliency Darkroom）
// 纯 2D Canvas 高性能渲染（窄屏 DPR≤1.5、桌面 DPR≤2、按需重绘 + rAF 合并触控帧 + 批处理路径），
// 硬件与 SwiftShader 软件渲染在 4×/6× 降速手机下均稳定 ≥50fps。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, evaluate, mixRgb, rgbCss } from "./model.js";

const COBALT = "#0A4CF7";
const RED = "#D43222";
const GREEN = "#0D8A62";

export function mountDarkroom(canvas, getState, updateState) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let cssW = 720;
  let cssH = 480;
  let dpr = 1.5;

  let intro = reducedMotion.matches ? 1 : 0;
  let scanT = 0;
  let scanActive = false;
  let scanHold = 0;
  let dragFlash = 0;
  let dragCursorX = 0.5;
  let hoverTarget = "";
  let dirty = true;
  let pendingSuppress = null;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    // 手机窄屏使用 1.25× 像素比（桌面 2×），画面锐利同时让软件渲染拖动也能跑满 ≥45fps
    dpr = pixelRatio(r.width < 640 ? 1.25 : 2);
    cssW = r.width;
    cssH = r.height;
    const nw = Math.round(cssW * dpr);
    const nh = Math.round(cssH * dpr);
    if (canvas.width !== nw || canvas.height !== nh) {
      canvas.width = nw;
      canvas.height = nh;
      dirty = true;
    }
  }

  function markDirty() {
    dirty = true;
  }

  function triggerScan() {
    scanActive = true;
    scanT = reducedMotion.matches ? 1 : 0.01;
    scanHold = 2.4;
    dirty = true;
    ctrl.draw();
  }

  // ---------- 轻量化批处理场景绘制（避免每帧昂贵径向渐变，软件渲染同样 60fps） ----------
  function drawSkyAndBackdrop(w, h, state, ev) {
    const { pal } = ev.geom;
    const sup = state.bgSuppress;
    const clutter = pal.clutterLevel;

    // 1. 暖米弧幕双段底色（零渐变开销，高对比清晰）
    ctx.fillStyle = rgbCss(pal.skyTop);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = rgbCss(pal.skyBot);
    ctx.fillRect(0, h * 0.42, w, h * 0.58);

    // 2. 噪杂彩云与密集飞鸟（按颜色/描边批处理）
    if (clutter > 0.04) {
      const cloudAlpha = clutter * 0.55;
      const clouds = [
        [0.18, 0.19, 0.24, 0.065, [224, 134, 96]],
        [0.44, 0.13, 0.28, 0.055, [120, 146, 178]],
        [0.80, 0.22, 0.22, 0.068, [212, 128, 108]],
        [0.36, 0.34, 0.26, 0.052, [164, 136, 152]],
        [0.84, 0.38, 0.19, 0.045, [196, 142, 92]],
      ];
      for (const [cx, cy, rw, rh, col] of clouds) {
        ctx.fillStyle = rgbCss(col, cloudAlpha);
        ctx.beginPath();
        ctx.ellipse(cx * w, cy * h, rw * w * 0.5, rh * h * 0.5, -0.05, 0, Math.PI * 2);
        ctx.fill();
      }
      // 9 只海鸥合并成单次 beginPath + stroke
      ctx.strokeStyle = `rgba(38, 30, 34, ${(clutter * 0.65).toFixed(2)})`;
      ctx.lineWidth = Math.max(1.2, w * 0.0022);
      ctx.beginPath();
      const gulls = [
        [0.14, 0.34, 1.0], [0.21, 0.41, 0.85], [0.33, 0.28, 1.1],
        [0.42, 0.44, 0.9], [0.47, 0.22, 0.8], [0.76, 0.18, 1.05],
        [0.86, 0.31, 0.95], [0.89, 0.45, 0.85], [0.39, 0.52, 0.78],
      ];
      for (const [gx, gy, gs] of gulls) {
        const s = w * 0.015 * gs;
        const x = gx * w;
        const y = gy * h;
        ctx.moveTo(x - s, y + s * 0.25);
        ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.55, x, y);
        ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.55, x + s, y + s * 0.25);
      }
      ctx.stroke();
    }

    // 3. 远景地形
    if (state.scene === "lighthouse") {
      ctx.fillStyle = rgbCss(pal.hillFar, 0.8);
      ctx.beginPath();
      ctx.moveTo(0, h * 0.78);
      ctx.lineTo(w * 0.16, h * 0.68);
      ctx.lineTo(w * 0.36, h * 0.72);
      ctx.lineTo(w * 0.56, h * 0.62);
      ctx.lineTo(w * 0.82, h * 0.56);
      ctx.lineTo(w, h * 0.52);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = rgbCss(pal.hillNear, 0.55 + clutter * 0.35);
      ctx.beginPath();
      ctx.moveTo(0, h * 0.84);
      ctx.lineTo(w * 0.26, h * 0.76);
      ctx.lineTo(w * 0.52, h * 0.70);
      ctx.lineTo(w * 0.78, h * 0.64);
      ctx.lineTo(w, h * 0.60);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
    } else if (state.scene === "product") {
      if (clutter > 0.06) {
        ctx.strokeStyle = `rgba(90, 74, 62, ${(clutter * 0.36).toFixed(2)})`;
        ctx.lineWidth = 1;
        const step = Math.max(26, w / 18);
        ctx.beginPath();
        for (let x = step; x < w; x += step) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h * 0.74);
        }
        for (let y = step; y < h * 0.74; y += step) {
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
        }
        ctx.stroke();
      }
      ctx.fillStyle = rgbCss(pal.hillNear, 0.74);
      ctx.fillRect(0, h * 0.74, w, h * 0.26);
    } else {
      ctx.fillStyle = rgbCss(pal.hillFar, 0.65);
      ctx.beginPath();
      ctx.moveTo(0, h * 0.64);
      ctx.quadraticCurveTo(w * 0.24, h * 0.56, w * 0.45, h * 0.63);
      ctx.quadraticCurveTo(w * 0.74, h * 0.55, w, h * 0.62);
      ctx.lineTo(w, h * 0.67);
      ctx.lineTo(0, h * 0.67);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = rgbCss(mixRgb(pal.skyBot, pal.hillNear, 0.48));
      ctx.fillRect(0, h * 0.65, w, h * 0.16);
      ctx.fillStyle = rgbCss(pal.rockDark, 0.85);
      ctx.fillRect(0, h * 0.81, w, h * 0.19);
    }

    if (sup > 92) {
      const over = (sup - 92) / 8;
      ctx.fillStyle = `rgba(5, 6, 10, ${(over * 0.48).toFixed(2)})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function drawFocusRings(w, h, state, ev) {
    if (!state.showGuides) return;
    const { hero } = ev.geom;
    const hx = hero.cx * w;
    const hy = hero.cy * h;
    const baseR = Math.min(w, h) * clamp(0.155 * Math.sqrt(state.subjectScale / 24), 0.09, 0.27);
    const allPass = ev.passedCount === 4;
    const ringCol = allPass
      ? "rgba(10, 76, 247, 0.52)"
      : ev.flags.isCrushed
        ? "rgba(255, 115, 98, 0.6)"
        : "rgba(10, 76, 247, 0.34)";
    const triCol = allPass ? COBALT : ev.primaryFault === "rival-split" ? RED : "#2B65F5";

    ctx.save();
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = ringCol;
    ctx.lineWidth = 1.15;
    // 批处理 3 圈同心虚线圆与纵横细虚线导引轴
    const outerR = baseR * 1.9;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const r = baseR * (1 + i * 0.34);
      ctx.moveTo(hx + r, hy);
      ctx.arc(hx, hy, r, 0, Math.PI * 2);
    }
    ctx.moveTo(hx - outerR * 1.18, hy);
    ctx.lineTo(hx + outerR * 1.18, hy);
    ctx.moveTo(hx, hy - outerR * 1.12);
    ctx.lineTo(hx, Math.min(h - 6, hy + outerR * 1.08));
    ctx.stroke();
    ctx.setLineDash([]);

    // 四枚向内指的实心钴蓝小三角合并一次 fill
    const triSize = Math.max(5.5, Math.min(w, h) * 0.015);
    const dirs = [
      [hx, hy - outerR * 0.94, 0, 1],
      [hx, Math.min(h - 14, hy + outerR * 0.94), 0, -1],
      [hx - outerR * 0.96, hy, 1, 0],
      [hx + outerR * 0.96, hy, -1, 0],
    ];
    ctx.fillStyle = triCol;
    ctx.beginPath();
    for (const [tx, ty, dx, dy] of dirs) {
      ctx.moveTo(tx + dx * triSize, ty + dy * triSize);
      ctx.lineTo(tx - dx * triSize * 0.7 - dy * triSize * 0.75, ty - dy * triSize * 0.7 + dx * triSize * 0.75);
      ctx.lineTo(tx - dx * triSize * 0.7 + dy * triSize * 0.75, ty - dy * triSize * 0.7 - dx * triSize * 0.75);
      ctx.closePath();
    }
    ctx.fill();
    ctx.restore();
  }

  function drawHeroSubject(w, h, state, ev) {
    const { hero, pal } = ev.geom;
    const hx = hero.cx * w;
    const hy = hero.cy * h;
    const hw = hero.rw * w;
    const hh = hero.rh * h;
    const enter = 0.88 + 0.12 * intro;

    ctx.save();
    ctx.translate(hx, hy);
    ctx.scale(enter, enter);

    if (state.scene === "lighthouse") {
      const topW = hw * 0.44;
      const botW = hw * 0.72;
      const towerTopY = -hh * 0.24;
      const towerBotY = hh * 0.52;

      // 三段立体块面明暗（代替线性渐变，渲染快且更具版画构成感）
      ctx.fillStyle = rgbCss(pal.heroCore);
      ctx.beginPath();
      ctx.moveTo(-topW * 0.5, towerTopY);
      ctx.lineTo(topW * 0.5, towerTopY);
      ctx.lineTo(botW * 0.5, towerBotY);
      ctx.lineTo(-botW * 0.5, towerBotY);
      ctx.closePath();
      ctx.fill();

      // 左侧受光高光面
      ctx.fillStyle = rgbCss(pal.heroLit, 0.72);
      ctx.beginPath();
      ctx.moveTo(-topW * 0.5, towerTopY);
      ctx.lineTo(-topW * 0.08, towerTopY);
      ctx.lineTo(-botW * 0.08, towerBotY);
      ctx.lineTo(-botW * 0.5, towerBotY);
      ctx.closePath();
      ctx.fill();

      // 右侧暗部阴影面
      ctx.fillStyle = rgbCss(pal.heroShade, 0.75);
      ctx.beginPath();
      ctx.moveTo(topW * 0.16, towerTopY);
      ctx.lineTo(topW * 0.5, towerTopY);
      ctx.lineTo(botW * 0.5, towerBotY);
      ctx.lineTo(botW * 0.16, towerBotY);
      ctx.closePath();
      ctx.fill();

      // 石砌水平肌理线批处理一次绘制
      ctx.strokeStyle = "rgba(0, 10, 48, 0.22)";
      ctx.lineWidth = Math.max(0.8, h * 0.0018);
      ctx.beginPath();
      for (let i = 1; i < 10; i++) {
        const f = i / 10;
        const y = towerTopY + (towerBotY - towerTopY) * f;
        const curW = topW + (botW - topW) * f;
        ctx.moveTo(-curW * 0.48, y);
        ctx.lineTo(curW * 0.48, y);
      }
      ctx.stroke();

      // 细窗 + 黑色观景廊
      ctx.fillStyle = "#06080E";
      ctx.fillRect(-topW * 0.28, towerTopY + hh * 0.14, Math.max(3, topW * 0.09), hh * 0.065);
      ctx.fillRect(topW * 0.12, towerTopY + hh * 0.34, Math.max(3, topW * 0.09), hh * 0.075);

      const deckW = topW * 1.48;
      const deckH = hh * 0.048;
      ctx.fillRect(-deckW * 0.5, towerTopY - deckH, deckW, deckH);

      const railH = hh * 0.046;
      ctx.strokeStyle = "#090B0F";
      ctx.lineWidth = Math.max(1.2, hw * 0.018);
      ctx.beginPath();
      ctx.moveTo(-deckW * 0.48, towerTopY - deckH - railH);
      ctx.lineTo(deckW * 0.48, towerTopY - deckH - railH);
      for (let i = -3; i <= 3; i++) {
        const rx = (i / 3) * deckW * 0.46;
        ctx.moveTo(rx, towerTopY - deckH);
        ctx.lineTo(rx, towerTopY - deckH - railH);
      }
      ctx.stroke();

      // 发光灯笼室（双层柔光圆代替径向渐变）
      const lanW = topW * 0.78;
      const lanH = hh * 0.12;
      const lanTop = towerTopY - deckH - railH - lanH + hh * 0.02;
      const glowA = 0.14 + (state.subjectChroma / 100) * 0.24;
      ctx.fillStyle = `rgba(255, 250, 224, ${glowA.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(0, lanTop + lanH * 0.5, lanW * 1.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FBF7EC";
      ctx.fillRect(-lanW * 0.46, lanTop, lanW * 0.92, lanH);
      ctx.strokeStyle = "#07080B";
      ctx.lineWidth = Math.max(1.6, hw * 0.024);
      ctx.strokeRect(-lanW * 0.46, lanTop, lanW * 0.92, lanH);
      ctx.beginPath();
      ctx.moveTo(-lanW * 0.16, lanTop);
      ctx.lineTo(-lanW * 0.16, lanTop + lanH);
      ctx.moveTo(lanW * 0.16, lanTop);
      ctx.lineTo(lanW * 0.16, lanTop + lanH);
      ctx.stroke();

      // 穹顶与尖顶
      ctx.fillStyle = "#07080B";
      ctx.beginPath();
      ctx.moveTo(-lanW * 0.62, lanTop);
      ctx.quadraticCurveTo(0, lanTop - hh * 0.14, lanW * 0.62, lanTop);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, lanTop - hh * 0.07);
      ctx.lineTo(0, lanTop - hh * 0.175);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, lanTop - hh * 0.11, Math.max(2.5, topW * 0.08), 0, Math.PI * 2);
      ctx.fill();
    } else if (state.scene === "product") {
      const bw = hw * 1.55;
      const bh = hh * 0.48;
      ctx.fillStyle = "rgba(5, 6, 10, 0.26)";
      ctx.beginPath();
      ctx.ellipse(0, bh * 0.56, bw * 0.52, bh * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0B0D12";
      ctx.fillRect(-bw * 0.42, -bh * 0.58, bw * 0.24, bh * 0.12);
      ctx.fillRect(bw * 0.22, -bh * 0.62, bw * 0.12, bh * 0.16);

      ctx.fillStyle = rgbCss(pal.heroCore);
      ctx.fillRect(-bw * 0.5, -bh * 0.48, bw, bh);
      ctx.fillStyle = rgbCss(pal.heroLit, 0.55);
      ctx.fillRect(-bw * 0.5, -bh * 0.48, bw * 0.34, bh);

      const lr = Math.min(bw, bh) * 0.38;
      ctx.fillStyle = "#07090F";
      ctx.beginPath();
      ctx.arc(bw * 0.04, bh * 0.02, lr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#E8EEF8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bw * 0.04, bh * 0.02, lr * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = rgbCss(pal.heroLit, 0.72);
      ctx.beginPath();
      ctx.arc(bw * 0.04 - lr * 0.18, bh * 0.02 - lr * 0.18, lr * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#F4ECDA";
      ctx.fillRect(-bw * 0.41, -bh * 0.34, bw * 0.16, bh * 0.18);
    } else {
      const sailH = hh * 0.68;
      const sailW = hw * 1.15;
      ctx.fillStyle = rgbCss(pal.heroCore);
      ctx.beginPath();
      ctx.moveTo(0, -sailH * 0.62);
      ctx.lineTo(sailW * 0.56, sailH * 0.24);
      ctx.lineTo(-sailW * 0.06, sailH * 0.24);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = rgbCss(mixRgb(pal.heroLit, [244, 236, 218], 0.32));
      ctx.beginPath();
      ctx.moveTo(-sailW * 0.06, -sailH * 0.46);
      ctx.lineTo(-sailW * 0.46, sailH * 0.22);
      ctx.lineTo(-sailW * 0.08, sailH * 0.22);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#08090C";
      ctx.lineWidth = Math.max(2, hw * 0.025);
      ctx.beginPath();
      ctx.moveTo(-sailW * 0.05, -sailH * 0.64);
      ctx.lineTo(-sailW * 0.05, sailH * 0.3);
      ctx.stroke();
      ctx.fillStyle = "#090B0E";
      ctx.beginPath();
      ctx.moveTo(-sailW * 0.54, sailH * 0.28);
      ctx.lineTo(sailW * 0.6, sailH * 0.28);
      ctx.lineTo(sailW * 0.42, sailH * 0.42);
      ctx.lineTo(-sailW * 0.38, sailH * 0.42);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    if (ev.flags.isFaded) {
      drawCanvasTag(hx, hy - hh * 0.56 - 14, `主角发灰 ${state.subjectChroma}% · 点此提蓝`, RED);
    } else if (ev.flags.isBloated) {
      drawCanvasTag(hx, Math.max(46, hy - hh * 0.44), `占幅 ${ev.heroAreaPct}% 挤爆留白`, RED);
    } else if (ev.flags.isTiny) {
      drawCanvasTag(hx, hy - hh * 0.62 - 14, `占幅仅 ${ev.heroAreaPct}% 过小`, RED);
    }

    if (hoverTarget === "hero") {
      ctx.save();
      ctx.strokeStyle = "rgba(10, 76, 247, 0.72)";
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hx - hw * 0.58, hy - hh * 0.56, hw * 1.16, hh * 1.12);
      ctx.restore();
    }
  }

  function drawForegroundAndLead(w, h, state, ev) {
    const { pal, hero } = ev.geom;
    const isFocus = state.leadMode === "focus";

    ctx.save();
    if (state.scene === "lighthouse") {
      ctx.fillStyle = rgbCss(pal.rockDark);
      ctx.beginPath();
      ctx.moveTo(0, h * 0.90);
      ctx.lineTo(w * 0.14, h * 0.84);
      ctx.lineTo(w * 0.28, h * 0.87);
      ctx.lineTo(w * 0.44, h * 0.77);
      ctx.lineTo(w * 0.52, h * 0.73);
      ctx.lineTo(w * 0.74, h * 0.71);
      ctx.lineTo(w * 0.88, h * 0.67);
      ctx.lineTo(w, h * 0.69);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
      ctx.beginPath();
      ctx.moveTo(w * 0.46, h * 0.78);
      ctx.lineTo(w * 0.58, h * 0.74);
      ctx.lineTo(w * 0.69, h * 0.83);
      ctx.lineTo(w * 0.52, h * 0.85);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = rgbCss(pal.waveLight, 0.84);
      ctx.lineWidth = Math.max(2, w * 0.0042);
      ctx.lineCap = "round";
      ctx.beginPath();
      if (isFocus) {
        ctx.moveTo(w * 0.16, h * 0.92);
        ctx.bezierCurveTo(w * 0.30, h * 0.88, w * 0.44, h * 0.81, hero.cx * w - w * 0.05, h * 0.76);
      } else {
        ctx.moveTo(hero.cx * w - w * 0.03, h * 0.80);
        ctx.bezierCurveTo(w * 0.42, h * 0.85, w * 0.22, h * 0.89, w * 0.04, h * 0.96);
      }
      ctx.stroke();

      // 浪沫散点批处理一次 fill
      ctx.fillStyle = rgbCss(pal.waveLight, 0.72);
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const f = i / 11;
        const sx = isFocus ? w * (0.28 + f * 0.48) : w * (0.06 + f * 0.42);
        const sy = h * (0.88 - Math.sin(f * Math.PI) * 0.07 + ((i * 7) % 5) * 0.008);
        const r = 1.6 + (i % 3) * 1.0;
        ctx.moveTo(sx + r, sy);
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    const sx = isFocus ? w * 0.16 : w * 0.48;
    const sy = isFocus ? h * 0.91 : h * 0.81;
    const ex = isFocus ? hero.cx * w - w * 0.08 : w * 0.08;
    const ey = isFocus ? Math.min(h * 0.76, hero.cy * h + hero.rh * h * 0.36) : h * 0.93;
    const cpx = isFocus ? w * 0.36 : w * 0.28;
    const cpy = isFocus ? h * 0.89 : h * 0.85;

    ctx.strokeStyle = isFocus ? COBALT : RED;
    ctx.lineWidth = isFocus ? 2 : 2.4;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(cpx, cpy, ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);

    const ang = Math.atan2(ey - cpy, ex - cpx);
    const al = 9;
    ctx.fillStyle = isFocus ? COBALT : RED;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - al * Math.cos(ang - 0.45), ey - al * Math.sin(ang - 0.45));
    ctx.lineTo(ex - al * Math.cos(ang + 0.45), ey - al * Math.sin(ang + 0.45));
    ctx.closePath();
    ctx.fill();

    if (!isFocus) {
      drawCanvasTag(w * 0.31, h * 0.89, "× 引导线外拉 · 点此归向", RED);
    } else if (hoverTarget === "lead") {
      drawCanvasTag(w * 0.33, h * 0.89, "视线顺势聚焦 · 点可翻转", COBALT);
    }

    ctx.fillStyle = "#050505";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.955);
    ctx.quadraticCurveTo(w * 0.5, h * 1.03, w, h * 0.955);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawRivals(w, h, state, ev) {
    const { rivals } = ev.geom;
    for (const r of rivals) {
      if (r.status === "removed") continue;
      const rx = r.cx * w;
      const ry = r.cy * h;
      const rw = r.rw * w;
      const rh = r.rh * h;
      const isRival = r.status === "rival";

      ctx.save();
      ctx.translate(rx, ry);

      if (r.idx === 0) {
        if (state.scene === "lighthouse") {
          if (isRival) {
            ctx.fillStyle = "rgba(232, 54, 38, 0.16)";
            ctx.beginPath();
            ctx.arc(0, -rh * 0.05, rw * 0.68, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = rgbCss(r.rgb);
          ctx.beginPath();
          ctx.moveTo(-rw * 0.45, rh * 0.14);
          ctx.lineTo(rw * 0.48, rh * 0.14);
          ctx.lineTo(rw * 0.34, rh * 0.38);
          ctx.lineTo(-rw * 0.34, rh * 0.38);
          ctx.closePath();
          ctx.fill();
          ctx.fillRect(-rw * 0.18, -rh * 0.16, rw * 0.36, rh * 0.3);
          ctx.fillStyle = isRival ? "#FFE066" : "rgba(244,236,218,0.5)";
          ctx.fillRect(-rw * 0.1, -rh * 0.08, rw * 0.2, rh * 0.11);
          ctx.fillStyle = rgbCss(r.rgb);
          ctx.beginPath();
          ctx.moveTo(0, -rh * 0.45);
          ctx.lineTo(rw * 0.34, -rh * 0.32);
          ctx.lineTo(0, -rh * 0.2);
          ctx.closePath();
          ctx.fill();
        } else if (state.scene === "product") {
          ctx.fillStyle = rgbCss(r.rgb);
          ctx.beginPath();
          ctx.arc(0, 0, Math.min(rw, rh) * 0.46, 0, Math.PI * 2);
          ctx.fill();
          if (isRival) {
            ctx.fillStyle = "#FFFDF8";
            ctx.font = `700 ${Math.max(11, Math.round(rw * 0.18))}px "Noto Sans SC", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("热卖", 0, 1);
          }
        } else {
          ctx.fillStyle = rgbCss(r.rgb);
          ctx.fillRect(-rw * 0.24, -rh * 0.44, rw * 0.48, rh * 0.86);
          ctx.fillRect(-rw * 0.42, -rh * 0.44, rw * 0.84, rh * 0.14);
        }
      } else {
        if (state.scene === "product") {
          ctx.fillStyle = rgbCss(r.rgb);
          ctx.fillRect(-rw * 0.48, -rh * 0.34, rw * 0.96, rh * 0.68);
          if (isRival) {
            ctx.fillStyle = "#FFFDF8";
            ctx.fillRect(-rw * 0.34, -rh * 0.12, rw * 0.68, rh * 0.11);
            ctx.fillRect(-rw * 0.34, rh * 0.08, rw * 0.46, rh * 0.1);
          }
        } else {
          if (isRival) {
            ctx.fillStyle = "rgba(242, 120, 26, 0.18)";
            ctx.beginPath();
            ctx.arc(0, 0, rw * 0.64, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = rgbCss(r.rgb);
          ctx.beginPath();
          ctx.arc(0, 0, Math.min(rw, rh) * 0.38, 0, Math.PI * 2);
          ctx.fill();
          if (isRival) {
            ctx.strokeStyle = rgbCss(r.rgb, 0.78);
            ctx.lineWidth = 2;
            const r1 = Math.min(rw, rh) * 0.46;
            const r2 = Math.min(rw, rh) * 0.59;
            ctx.beginPath();
            for (let k = 0; k < 8; k++) {
              const a = (k / 8) * Math.PI * 2;
              ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
              ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
            }
            ctx.stroke();
          }
        }
      }

      if (isRival) {
        ctx.strokeStyle = RED;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(-rw * 0.54, -rh * 0.52, rw * 1.08, rh * 1.04);
        ctx.setLineDash([]);
      }

      ctx.restore();

      if (isRival) {
        const tagY = r.idx === 0 ? ry - rh * 0.52 - 14 : ry + rh * 0.52 + 14;
        drawCanvasTag(rx, tagY, `× ${r.name} · 点弱化`, RED);
      } else if (hoverTarget === r.id) {
        drawCanvasTag(rx, ry + rh * 0.55 + 12, "已弱化 · 再点移除", "#1C2436");
      }
    }
  }

  function drawSaliencyOverlay(w, h, ev) {
    if (!scanActive && scanHold <= 0) return;
    const p = clamp(scanT, 0, 1);
    const fade = scanActive ? 1 : clamp(scanHold / 0.7, 0, 1);
    const path = ev.scanpath;
    if (!path.length) return;

    ctx.save();
    ctx.globalAlpha = fade;

    // 显著度双环热晕（扁平同心圆，软件渲染零延迟）
    for (const node of path) {
      const nx = node.cx * w;
      const ny = node.cy * h;
      const rad = Math.min(w, h) * (0.09 + (node.saliency / 100) * 0.12);
      const col = node.isHero ? "10, 76, 247" : "226, 62, 38";
      ctx.fillStyle = `rgba(${col}, 0.15)`;
      ctx.beginPath();
      ctx.arc(nx, ny, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${col}, 0.24)`;
      ctx.beginPath();
      ctx.arc(nx, ny, rad * 0.54, 0, Math.PI * 2);
      ctx.fill();
    }

    const visibleSteps = Math.max(1, Math.ceil(p * path.length));
    if (visibleSteps > 1) {
      ctx.strokeStyle = ev.firstFixationIsHero && ev.passedCount === 4 ? "rgba(10, 76, 247, 0.78)" : "rgba(212, 50, 34, 0.88)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      for (let i = 0; i < visibleSteps - 1; i++) {
        ctx.moveTo(path[i].cx * w, path[i].cy * h);
        ctx.lineTo(path[i + 1].cx * w, path[i + 1].cy * h);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (let i = 0; i < visibleSteps; i++) {
      const node = path[i];
      const nx = node.cx * w;
      const ny = node.cy * h;
      const col = node.isHero ? COBALT : RED;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(nx, ny, i === 0 ? 15 : 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${i === 0 ? 12 : 11}px "Inter", "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`#${node.rank}`, nx, ny + 0.5);

      drawCanvasTag(nx, ny - (i === 0 ? 25 : 21), `${node.timeSec}s · ${node.name}`, col);
    }

    ctx.restore();
  }

  function drawDragCurtain(w, h, state) {
    if (dragFlash <= 0.02) return;
    const x = clamp(dragCursorX, 0.04, 0.96) * w;
    ctx.save();
    ctx.globalAlpha = clamp(dragFlash, 0, 1);
    ctx.strokeStyle = COBALT;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, 12);
    ctx.lineTo(x, h - 18);
    ctx.stroke();
    ctx.setLineDash([]);
    drawCanvasTag(clamp(x, 74, w - 74), 26, `背景压噪 ${state.bgSuppress}%`, "#07090F");
    ctx.restore();
  }

  function drawCanvasTag(cx, cy, text, bg) {
    ctx.save();
    ctx.font = `600 11px "Noto Sans SC", sans-serif`;
    const padX = 8;
    const tw = ctx.measureText(text).width;
    const bw = tw + padX * 2;
    const bh = 21;
    const x = clamp(cx - bw / 2, 6, cssW - bw - 6);
    const y = clamp(cy - bh / 2, 6, cssH - bh - 12);
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, bw, bh);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + bw / 2, y + bh / 2 + 0.5);
    ctx.restore();
  }

  function drawHud(w, h, state, ev) {
    const pad = 12;
    ctx.save();
    const leftText = `焦比 ${ev.dominanceRatio.toFixed(2)}× · 压噪 ${state.bgSuppress}% · 钴蓝 ${state.subjectChroma}%`;
    ctx.font = `600 11px "Inter", "Noto Sans SC", sans-serif`;
    const lw = ctx.measureText(leftText).width + 18;
    ctx.fillStyle = "rgba(8, 10, 15, 0.86)";
    ctx.fillRect(pad, pad, lw, 24);
    ctx.fillStyle = "#F4ECDA";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(leftText, pad + 9, pad + 12.5);

    const rightBg = ev.passedCount === 4 ? GREEN : RED;
    const rightText = ev.diagnosis.badge;
    const rw = ctx.measureText(rightText).width + 18;
    ctx.fillStyle = rightBg;
    ctx.fillRect(w - pad - rw, pad, rw, 24);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "right";
    ctx.fillText(rightText, w - pad - 9, pad + 12.5);
    ctx.restore();
  }

  function render(t, dt, { still }) {
    resize();

    // 合并高频触控拖动到 rAF 周期，拖动中节流 DOM 同步、放手立即全量同步
    if (pendingSuppress !== null) {
      const next = pendingSuppress;
      pendingSuppress = null;
      updateState({ bgSuppress: next }, { skipDraw: true, throttleDom: true });
      dirty = true;
    }

    let animating = false;
    if (still) {
      if (intro < 1) {
        intro = 1;
        dirty = true;
      }
    } else if (intro < 1) {
      intro = Math.min(1, intro + dt * 2.4);
      dirty = true;
      animating = true;
    }

    if (scanActive) {
      if (still) {
        scanT = 1;
        scanActive = false;
      } else {
        scanT += dt * 1.45;
        if (scanT >= 1) {
          scanT = 1;
          scanActive = false;
        }
      }
      dirty = true;
      animating = true;
    } else if (scanHold > 0 && !still) {
      scanHold = Math.max(0, scanHold - dt);
      if (scanHold < 0.72 || scanHold === 0) dirty = true;
      animating = true;
    }

    if (dragFlash > 0 && !still) {
      dragFlash = Math.max(0, dragFlash - dt * 2.1);
      dirty = true;
      animating = true;
    }

    // 静置且无变化时不重复光栅化，省电且保持 60fps 响应
    if (!dirty && !still) return;
    dirty = animating;

    const state = getState();
    const ev = evaluate(state);

    ctx.save();
    ctx.scale(dpr, dpr);
    drawSkyAndBackdrop(cssW, cssH, state, ev);
    drawFocusRings(cssW, cssH, state, ev);
    drawHeroSubject(cssW, cssH, state, ev);
    drawForegroundAndLead(cssW, cssH, state, ev);
    drawRivals(cssW, cssH, state, ev);
    drawSaliencyOverlay(cssW, cssH, ev);
    drawDragCurtain(cssW, cssH, state);
    drawHud(cssW, cssH, state, ev);
    ctx.restore();
  }

  function hitTest(nx, ny, state) {
    const geom = evaluate(state).geom;
    for (const r of geom.rivals) {
      if (r.status === "removed") continue;
      const pad = 0.04;
      if (Math.abs(nx - r.cx) <= r.rw * 0.58 + pad && Math.abs(ny - r.cy) <= r.rh * 0.58 + pad) {
        return r.id;
      }
    }
    const h = geom.hero;
    if (Math.abs(nx - h.cx) <= h.rw * 0.65 + 0.025 && Math.abs(ny - h.cy) <= h.rh * 0.58 + 0.025) {
      return "hero";
    }
    const l = geom.leadHitbox;
    if (Math.abs(nx - l.cx) <= l.rw * 0.54 && Math.abs(ny - l.cy) <= l.rh * 0.55) {
      return "lead";
    }
    return "";
  }

  function handleTap(nx, ny) {
    const state = getState();
    const hit = hitTest(nx, ny, state);
    if (hit === "rival-0" || hit === "rival-1") {
      const idx = hit === "rival-0" ? 0 : 1;
      const order = ["rival", "muted", "removed"];
      const next = order[(order.indexOf(state.rivals[idx]) + 1) % order.length];
      const nextRivals = [...state.rivals];
      nextRivals[idx] = next;
      updateState({ rivals: nextRivals });
      return true;
    }
    if (hit === "hero") {
      updateState({ subjectChroma: state.subjectChroma < 68 ? 94 : 22 });
      return true;
    }
    if (hit === "lead") {
      updateState({ leadMode: state.leadMode === "focus" ? "away" : "focus" });
      return true;
    }
    return false;
  }

  let drag = null;

  function normPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      nx: clamp((clientX - r.left) / Math.max(1, r.width), 0, 1),
      ny: clamp((clientY - r.top) / Math.max(1, r.height), 0, 1),
      w: r.width,
    };
  }

  function beginDrag(clientX, clientY, isTouch) {
    const p = normPos(clientX, clientY);
    drag = {
      startX: clientX,
      startY: clientY,
      startSuppress: getState().bgSuppress,
      moved: false,
      lockedHoriz: !isTouch,
      isTouch,
      w: p.w,
    };
  }

  function moveDrag(clientX, clientY, e) {
    if (!drag) {
      if (!e.touches) {
        const p = normPos(clientX, clientY);
        const h = hitTest(p.nx, p.ny, getState());
        if (h !== hoverTarget) {
          hoverTarget = h;
          canvas.style.cursor = h ? "pointer" : "ew-resize";
          dirty = true;
        }
      }
      return;
    }
    const dx = clientX - drag.startX;
    const dy = clientY - drag.startY;
    if (drag.isTouch && !drag.lockedHoriz) {
      if (Math.hypot(dx, dy) < 6) return;
      if (Math.abs(dx) >= Math.abs(dy) * 0.9) {
        drag.lockedHoriz = true;
      } else {
        drag = null;
        return;
      }
    }
    if (Math.abs(dx) > 4) {
      drag.moved = true;
      if (e.cancelable) e.preventDefault();
      const delta = (dx / Math.max(180, drag.w * 0.62)) * 100;
      pendingSuppress = Math.round(clamp(drag.startSuppress + delta, 0, 100));
      dragCursorX = normPos(clientX, clientY).nx;
      dragFlash = 1;
      dirty = true;
      if (reducedMotion.matches) ctrl.draw();
    }
  }

  function endDrag(clientX, clientY) {
    if (!drag) return;
    const wasMoved = drag.moved;
    drag = null;
    if (pendingSuppress !== null) {
      const next = pendingSuppress;
      pendingSuppress = null;
      updateState({ bgSuppress: next });
    } else if (wasMoved) {
      updateState({});
    }
    if (!wasMoved) {
      const p = normPos(clientX, clientY);
      handleTap(p.nx, p.ny);
    }
  }

  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    beginDrag(e.clientX, e.clientY, false);
  });
  window.addEventListener("mousemove", (e) => moveDrag(e.clientX, e.clientY, e));
  window.addEventListener("mouseup", (e) => endDrag(e.clientX, e.clientY));
  canvas.addEventListener("mouseleave", () => {
    if (hoverTarget) {
      hoverTarget = "";
      dirty = true;
    }
  });

  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      beginDrag(e.touches[0].clientX, e.touches[0].clientY, true);
    },
    { passive: true },
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length || !drag) return;
      moveDrag(e.touches[0].clientX, e.touches[0].clientY, e);
    },
    { passive: false },
  );
  canvas.addEventListener(
    "touchend",
    (e) => {
      const t0 = e.changedTouches[0];
      if (t0) endDrag(t0.clientX, t0.clientY);
      else drag = null;
    },
    { passive: true },
  );

  canvas.addEventListener("keydown", (e) => {
    const s = getState();
    if (e.key === "ArrowRight" && !e.shiftKey) {
      e.preventDefault();
      updateState({ bgSuppress: clamp(s.bgSuppress + 4, 0, 100) });
    } else if (e.key === "ArrowLeft" && !e.shiftKey) {
      e.preventDefault();
      updateState({ bgSuppress: clamp(s.bgSuppress - 4, 0, 100) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      updateState({ subjectChroma: clamp(s.subjectChroma + 6, 0, 100) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      updateState({ subjectChroma: clamp(s.subjectChroma - 6, 0, 100) });
    } else if (e.key === "ArrowRight" && e.shiftKey) {
      e.preventDefault();
      updateState({ subjectScale: clamp(s.subjectScale + 3, 6, 56) });
    } else if (e.key === "ArrowLeft" && e.shiftKey) {
      e.preventDefault();
      updateState({ subjectScale: clamp(s.subjectScale - 3, 6, 56) });
    } else if (e.code === "Space") {
      e.preventDefault();
      triggerScan();
    }
  });

  const ctrl = loop(canvas, render);
  new ResizeObserver(() => {
    resize();
    dirty = true;
    ctrl.draw();
  }).observe(canvas);
  resize();
  ctrl.draw();

  return {
    draw: () => {
      markDirty();
      ctrl.draw();
    },
    triggerScan,
  };
}

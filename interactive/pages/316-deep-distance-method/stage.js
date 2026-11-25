// 316 深远法 · 2D Canvas 建筑投影渲染器
// 包含：1) 正面重门穿透大画布（原海报重门 / 北宋重峦 / 江南漏窗）
//       2) 顶部 Z 轴俯视剖面轨（Eye -> Gates 1..N -> Far Vista，支持直拖推深与点开堵墙）
//       3) 第 02 节遮挡与 1/z 节拍双对比画布

import { pixelRatio } from "../../lib/stage.js";
import { clamp, lerp, rgbCss, SWEET } from "./model.js";

function fitCanvas(canvas, maxDpr = 2) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  const cap = w <= 520 ? Math.min(maxDpr, 1.5) : maxDpr;
  const dpr = pixelRatio(cap);
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// =====================================================================
// 1. 正面重门穿透主画布（1:1 承袭 316 原海报视觉美学 + 三题材真实重绘）
// =====================================================================
export function renderCorridor(canvas, state, ev, tSec, { still = false } = {}) {
  const { ctx, w, h } = fitCanvas(canvas, 2);
  if (w < 10 || h < 10) return;

  const breath = still ? 0 : Math.sin(tSec * 1.15) * 0.5 + 0.5;
  const layers = ev.layers;
  const vr = ev.vistaRect;

  // 1) 玄夜墨蓝深底（原海报 #040D18，无重开销逐帧渐变）
  ctx.fillStyle = state.theme === "song" ? "#061523" : state.theme === "garden" ? "#061420" : "#040D18";
  ctx.fillRect(0, 0, w, h);

  // 2) 走廊深地梯形
  const first = layers[0];
  const last = layers[layers.length - 1];
  const vpPx = ev.vpX * w;

  ctx.fillStyle = "#0D1E2C";
  ctx.beginPath();
  ctx.moveTo(last.innerLeft * w, last.innerBot * h);
  ctx.lineTo(last.innerRight * w, last.innerBot * h);
  ctx.lineTo(w * 0.94, h);
  ctx.lineTo(w * 0.06, h);
  ctx.closePath();
  ctx.fill();

  // 3) 尽头远景窗口（青月远山 / 幽谷远阁 / 竹影月洞，或错态：死黑空洞 / 炸亮白团）
  const wx = last.innerLeft * w;
  const wy = last.innerTop * h;
  const ww = last.innerW * w;
  const wh = last.innerH * h;

  ctx.save();
  ctx.beginPath();
  ctx.rect(wx - 2, wy - 2, ww + 4, wh + 4);
  ctx.clip();

  if (state.vista === "void") {
    ctx.fillStyle = "#030911";
    ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
    ctx.strokeStyle = "rgba(240, 122, 98, 0.34)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(wx + ww * 0.2, wy + wh * 0.2, ww * 0.6, wh * 0.6);
    ctx.setLineDash([]);
  } else if (state.vista === "glare") {
    ctx.fillStyle = "#F5B869";
    ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
    ctx.fillStyle = "#FFF7DC";
    ctx.beginPath();
    ctx.arc(wx + ww * 0.5, wy + wh * 0.45, Math.min(ww, wh) * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = state.theme === "song" ? "#3FA8B7" : state.theme === "garden" ? "#299EB1" : "#27A8BA";
    ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);

    // 明月微晕（轻量双同心圆替代逐帧 radialGradient）
    const mx = wx + ww * 0.5;
    const my = wy + wh * 0.34;
    const mr = Math.max(4, Math.min(ww, wh) * 0.165);
    ctx.fillStyle = "rgba(239, 230, 210, 0.20)";
    ctx.beginPath();
    ctx.arc(mx, my, mr * (1.85 + breath * 0.25), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#EFE6D2";
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();

    // 远山剪影（双层，忠实原海报）
    ctx.fillStyle = "#197CA0";
    ctx.beginPath();
    ctx.moveTo(wx - 2, wy + wh + 2);
    ctx.lineTo(wx - 2, wy + wh * 0.72);
    ctx.lineTo(wx + ww * 0.32, wy + wh * 0.58);
    ctx.lineTo(wx + ww * 0.62, wy + wh * 0.68);
    ctx.lineTo(wx + ww * 0.86, wy + wh * 0.56);
    ctx.lineTo(wx + ww + 2, wy + wh * 0.72);
    ctx.lineTo(wx + ww + 2, wy + wh + 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#015584";
    ctx.beginPath();
    ctx.moveTo(wx - 2, wy + wh + 2);
    ctx.lineTo(wx - 2, wy + wh * 0.78);
    ctx.lineTo(wx + ww * 0.22, wy + wh * 0.63);
    ctx.lineTo(wx + ww * 0.54, wy + wh * 0.79);
    ctx.lineTo(wx + ww * 0.78, wy + wh * 0.69);
    ctx.lineTo(wx + ww + 2, wy + wh * 0.82);
    ctx.lineTo(wx + ww + 2, wy + wh + 2);
    ctx.closePath();
    ctx.fill();

    // 主题细节：北宋重峦加远阁小檐；江南漏窗加疏竹枝影
    if (state.theme === "song" && ww > 26) {
      const px = wx + ww * 0.46;
      const py = wy + wh * 0.72;
      const pw = Math.max(6, ww * 0.14);
      ctx.fillStyle = "#EFE6D2";
      ctx.beginPath();
      ctx.moveTo(px - pw * 0.8, py);
      ctx.lineTo(px, py - pw * 0.45);
      ctx.lineTo(px + pw * 0.8, py);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(px - pw * 0.42, py, pw * 0.84, pw * 0.55);
    } else if (state.theme === "garden" && ww > 24) {
      ctx.strokeStyle = "rgba(4, 24, 38, 0.72)";
      ctx.lineWidth = Math.max(1, ww * 0.018);
      ctx.beginPath();
      ctx.moveTo(wx + ww * 0.18, wy + wh);
      ctx.quadraticCurveTo(wx + ww * 0.24, wy + wh * 0.55, wx + ww * 0.31, wy + wh * 0.14);
      ctx.moveTo(wx + ww * 0.82, wy + wh);
      ctx.quadraticCurveTo(wx + ww * 0.77, wy + wh * 0.58, wx + ww * 0.70, wy + wh * 0.22);
      ctx.stroke();
    }
  }
  ctx.restore();

  // 4) 地面 1/z 光带（按每重门间隔递进铺设，复刻 316 原海报地面横光条）
  for (let i = layers.length - 1; i >= 0; i--) {
    const g = layers[i];
    const zNext = i === layers.length - 1 ? ev.zVista : layers[i + 1].z;
    // 在当前门与下一重门之间绘制 2 条按物理间隔分布的地面光带
    for (let s = 0; s < 2; s++) {
      const zA = lerp(g.z, zNext, s === 0 ? 0.18 : 0.62);
      const zB = lerp(g.z, zNext, s === 0 ? 0.44 : 0.84);
      const yA = (ev.vpY + (0.82 * 0.42) / zA) * h;
      const yB = (ev.vpY + (0.82 * 0.42) / zB) * h;
      if (yA > h || yB < 0) continue;

      const halfWA = (0.80 * (1 - 0.25) * 0.5 / zA) * w * 0.84;
      const halfWB = (0.80 * (1 - 0.25) * 0.5 / zB) * w * 0.84;
      const barCxA = (lerp(g.cx, ev.vpX, s === 0 ? 0.2 : 0.6)) * w;
      const barCxB = (lerp(g.cx, ev.vpX, s === 0 ? 0.45 : 0.85)) * w;

      const barAlpha = state.attenuation === "blackout" && i >= 1 ? 0.12 : clamp(1 - g.t * 0.48, 0.25, 0.96);
      ctx.fillStyle = rgbCss(g.floorBar, barAlpha);
      ctx.beginPath();
      ctx.moveTo(barCxA - halfWA, yA);
      ctx.lineTo(barCxA + halfWA, yA);
      ctx.lineTo(barCxB + halfWB, yB);
      ctx.lineTo(barCxB - halfWB, yB);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 5) 由远及近逐层绘制重门结构（含内壁进深斜面 + 门框立面 + 主题廓形 + 堵墙错态）
  for (let i = layers.length - 1; i >= 0; i--) {
    const g = layers[i];
    const next = i < layers.length - 1 ? layers[i + 1] : null;
    const ox = g.outerLeft * w;
    const oy = g.outerTop * h;
    const ow = g.outerW * w;
    const oh = g.outerH * h;
    const ix = g.innerLeft * w;
    const iy = g.innerTop * h;
    const iw = g.innerW * w;
    const ih = g.innerH * h;

    // 5a. 与后一重门之间的暗色廊壁衔接（强化建筑实体感）
    if (next) {
      const nox = next.outerLeft * w;
      const noy = next.outerTop * h;
      const now = next.outerW * w;
      const noh = next.outerH * h;

      // 左侧内廊暗壁
      ctx.fillStyle = rgbCss(g.innerBevel, state.attenuation === "mist" ? 0.45 : 0.72);
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.lineTo(nox, noy);
      ctx.lineTo(nox, noy + noh);
      ctx.lineTo(ix, iy + ih);
      ctx.closePath();
      ctx.fill();

      // 右侧内廊暗壁
      ctx.fillStyle = rgbCss(g.innerBevel, state.attenuation === "mist" ? 0.36 : 0.56);
      ctx.beginPath();
      ctx.moveTo(ix + iw, iy);
      ctx.lineTo(nox + now, noy);
      ctx.lineTo(nox + now, noy + noh);
      ctx.lineTo(ix + iw, iy + ih);
      ctx.closePath();
      ctx.fill();

      // 顶部暗拱棚
      ctx.fillStyle = rgbCss(g.innerBevel, state.attenuation === "mist" ? 0.30 : 0.82);
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.lineTo(ix + iw, iy);
      ctx.lineTo(nox + now, noy);
      ctx.lineTo(nox, noy);
      ctx.closePath();
      ctx.fill();
    }

    // 5b. 烟岚雾带（仅在烟岚模式或北宋重峦主题下在层间铺出轻雾）
    if (state.attenuation === "mist" || state.theme === "song") {
      const mistA = state.attenuation === "mist" ? 0.14 : 0.07;
      ctx.fillStyle = `rgba(127, 176, 190, ${mistA})`;
      ctx.fillRect(ix, iy + ih * 0.52, iw, ih * 0.48);
    }

    // 5c. 门框本体（按三题材区分轮廓语言：方拱重门 / 北宋重峦崖谷 / 江南圆月门洞）
    if (state.theme === "song") {
      drawSongRidgeGate(ctx, g, ox, oy, ow, oh, ix, iy, iw, ih, w, h);
    } else if (state.theme === "garden") {
      drawGardenMoonGate(ctx, g, ox, oy, ow, oh, ix, iy, iw, ih);
    } else {
      drawArchitecturalPortal(ctx, g, ox, oy, ow, oh, ix, iy, iw, ih);
    }

    // 5d. 若本层被实墙堵死，绘出鲜明堵墙与可点击提示
    if (g.isBlocked) {
      ctx.save();
      ctx.fillStyle = "#12202C";
      ctx.fillRect(ix, iy, iw, ih);

      // 赤陶警示斜纹与 X 封条
      ctx.strokeStyle = "rgba(240, 122, 98, 0.85)";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(ix + 3, iy + 3, iw - 6, ih - 6);
      ctx.beginPath();
      ctx.moveTo(ix + 10, iy + 10);
      ctx.lineTo(ix + iw - 10, iy + ih - 10);
      ctx.moveTo(ix + iw - 10, iy + 10);
      ctx.lineTo(ix + 10, iy + ih - 10);
      ctx.stroke();

      // 中心胶囊提示（点按直接解锁）
      if (iw > 72) {
        const bw = Math.min(iw - 14, 154);
        const bh = 28;
        const bx = ix + (iw - bw) / 2;
        const by = iy + (ih - bh) / 2;
        ctx.fillStyle = "#8C2618";
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = "#F07A62";
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = "#FDF4EC";
        ctx.font = '700 12px "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("第 3 重堵墙 · 点按解锁", ix + iw / 2, by + bh / 2 + 0.5);
      }
      ctx.restore();
    }
  }

  // 6) 原海报标志性青蓝激光测绘丝线（两侧竖直带圆点丝线 + 地板透视斜轨）
  if (state.guides) {
    ctx.save();
    const cyan = "#31B1CB";
    const cyanSoft = "rgba(49, 177, 203, 0.42)";

    // 两侧地面斜向透视导轨
    ctx.strokeStyle = cyan;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(first.outerLeft * w - w * 0.04, h * 0.96);
    ctx.lineTo(last.innerLeft * w, last.innerBot * h);
    ctx.moveTo(first.outerRight * w + w * 0.04, h * 0.96);
    ctx.lineTo(last.innerRight * w, last.innerBot * h);
    ctx.stroke();

    // 每一重门左右两侧的竖直青蓝测高针（带顶部小圆点，忠实复刻 316 原海报！）
    layers.forEach((g, idx) => {
      const sideOffset = (1 - g.t * 0.65) * w * 0.032;
      const lx = g.outerLeft * w - sideOffset;
      const rx = g.outerRight * w + sideOffset;
      const botY = g.outerBot * h + (1 - g.t) * h * 0.04;
      const topY = g.outerTop * h + (g.outerBot - g.outerTop) * h * (0.14 + idx * 0.04);

      ctx.strokeStyle = idx === 0 ? cyan : cyanSoft;
      ctx.lineWidth = idx === 0 ? 1.1 : 0.9;
      ctx.beginPath();
      ctx.moveTo(lx, botY);
      ctx.lineTo(lx, topY);
      ctx.moveTo(rx, botY);
      ctx.lineTo(rx, topY);
      ctx.stroke();

      // 顶端小青圆点
      ctx.fillStyle = cyan;
      ctx.beginPath();
      ctx.arc(lx, topY, idx === 0 ? 2.4 : 1.9, 0, Math.PI * 2);
      ctx.arc(rx, topY, idx === 0 ? 2.4 : 1.9, 0, Math.PI * 2);
      ctx.fill();
    });

    // 中心贯通视线脉冲线（全部达标且未被堵死时柔和穿向远月）
    if (ev.pillars.inward.ok && state.vista !== "void") {
      const pulse = still ? 0.55 : (tSec * 0.45) % 1;
      const pyStart = h * 0.93;
      const pyEnd = vr.top * h + vr.h * h * 0.42;
      ctx.strokeStyle = "rgba(49, 177, 203, 0.34)";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(vpPx, pyStart);
      ctx.lineTo(vr.cx * w, pyEnd);
      ctx.stroke();
      ctx.setLineDash([]);

      // 移动的光粒沿着视通道向内滑入
      const pxDot = lerp(vpPx, vr.cx * w, pulse);
      const pyDot = lerp(pyStart, pyEnd, pulse);
      ctx.fillStyle = "#5AD8EE";
      ctx.beginPath();
      ctx.arc(pxDot, pyDot, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 7) 左上/右上极克制画框技术浮签（直接来自单真源）
  ctx.save();
  ctx.fillStyle = "rgba(4, 13, 24, 0.78)";
  ctx.fillRect(12, 12, 170, 24);
  ctx.strokeStyle = "rgba(49, 177, 203, 0.45)";
  ctx.lineWidth = 1;
  ctx.strokeRect(12, 12, 170, 24);
  ctx.fillStyle = "#D8E7EC";
  ctx.font = '700 11px "Space Mono", monospace';
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`DEPTH ${Math.round(state.depthSpan * 100)}% · ${ev.nearFarRatio.toFixed(1)}×`, 20, 24.5);
  ctx.restore();
}

// 绘制 316 原海报标志性方拱石门（锐利建筑三面分色，零渐变开销、软件渲染稳 60fps）
function drawArchitecturalPortal(ctx, g, ox, oy, ow, oh, ix, iy, iw, ih) {
  const faceTop = rgbCss([
    Math.max(0, Math.round(g.face[0] * 0.80)),
    Math.max(0, Math.round(g.face[1] * 0.81)),
    Math.max(0, Math.round(g.face[2] * 0.84)),
  ]);
  const faceLeft = rgbCss([
    Math.max(0, Math.round(g.face[0] * 0.93)),
    Math.max(0, Math.round(g.face[1] * 0.93)),
    Math.max(0, Math.round(g.face[2] * 0.94)),
  ]);
  const faceRight = rgbCss([
    Math.min(255, Math.round(g.face[0] * 1.05)),
    Math.min(255, Math.round(g.face[1] * 1.04)),
    Math.min(255, Math.round(g.face[2] * 1.02)),
  ]);

  // 上横梁
  ctx.fillStyle = faceTop;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + ow, oy);
  ctx.lineTo(ix + iw, iy);
  ctx.lineTo(ix, iy);
  ctx.closePath();
  ctx.fill();

  // 左立柱
  ctx.fillStyle = faceLeft;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ix, iy);
  ctx.lineTo(ix, iy + ih);
  ctx.lineTo(ox, oy + oh);
  ctx.closePath();
  ctx.fill();

  // 右立柱（最亮暖石受光边，对应原海报右柱明面）
  ctx.fillStyle = faceRight;
  ctx.beginPath();
  ctx.moveTo(ox + ow, oy);
  ctx.lineTo(ox + ow, oy + oh);
  ctx.lineTo(ix + iw, iy + ih);
  ctx.lineTo(ix + iw, iy);
  ctx.closePath();
  ctx.fill();

  // 锐利内缘微弱高光线，防止深色层糊成一片
  ctx.strokeStyle = "rgba(231, 219, 196, 0.14)";
  ctx.lineWidth = 0.8;
  ctx.strokeRect(ix, iy, iw, ih);
}

// 北宋重峦主题：以对称/错落叠障山谷夹出深远幽径（自山前而窥山后）
function drawSongRidgeGate(ctx, g, ox, oy, ow, oh, ix, iy, iw, ih, w, h) {
  const faceLeft = rgbCss(g.face);
  const faceRight = rgbCss([
    Math.max(0, Math.round(g.face[0] * 0.88)),
    Math.max(0, Math.round(g.face[1] * 0.90)),
    Math.max(0, Math.round(g.face[2] * 0.92)),
  ]);
  const ridgeLift = oh * 0.16;

  // 左重山崖（外侧高起，向山谷内收）
  ctx.fillStyle = faceLeft;
  ctx.beginPath();
  ctx.moveTo(ox - w * 0.08, oy + oh);
  ctx.lineTo(ox - w * 0.04, oy + ridgeLift * 0.6);
  ctx.quadraticCurveTo(ox + (ix - ox) * 0.48, oy - ridgeLift * 0.35, ix + iw * 0.08, iy + ih * 0.22);
  ctx.quadraticCurveTo(ix - iw * 0.02, iy + ih * 0.56, ix + iw * 0.04, iy + ih);
  ctx.closePath();
  ctx.fill();

  // 右重山崖
  ctx.fillStyle = faceRight;
  ctx.beginPath();
  ctx.moveTo(ox + ow + w * 0.08, oy + oh);
  ctx.lineTo(ox + ow + w * 0.04, oy + ridgeLift * 0.4);
  ctx.quadraticCurveTo(ox + ow - (ox + ow - ix - iw) * 0.45, oy - ridgeLift * 0.45, ix + iw * 0.92, iy + ih * 0.28);
  ctx.quadraticCurveTo(ix + iw * 1.02, iy + ih * 0.62, ix + iw * 0.96, iy + ih);
  ctx.closePath();
  ctx.fill();

  // 山脊细青勾边
  ctx.strokeStyle = "rgba(49, 177, 203, 0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ox - w * 0.04, oy + ridgeLift * 0.6);
  ctx.quadraticCurveTo(ox + (ix - ox) * 0.48, oy - ridgeLift * 0.35, ix + iw * 0.08, iy + ih * 0.22);
  ctx.moveTo(ox + ow + w * 0.04, oy + ridgeLift * 0.4);
  ctx.quadraticCurveTo(ox + ow - (ox + ow - ix - iw) * 0.45, oy - ridgeLift * 0.45, ix + iw * 0.92, iy + ih * 0.28);
  ctx.stroke();
}

// 江南漏窗主题：白墙黛瓦圆月洞门重重相套
function drawGardenMoonGate(ctx, g, ox, oy, ow, oh, ix, iy, iw, ih) {
  const face = rgbCss(g.face);
  const rim = rgbCss([
    Math.max(0, Math.round(g.face[0] * 0.62)),
    Math.max(0, Math.round(g.face[1] * 0.66)),
    Math.max(0, Math.round(g.face[2] * 0.72)),
  ]);
  const cx = ix + iw / 2;
  const cy = iy + ih * 0.54;
  const r = Math.min(iw * 0.52, ih * 0.48);

  ctx.save();
  // 外框减去圆形月洞（evenodd 挖空）
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.rect(ox, oy, ow, oh);
  ctx.moveTo(cx + r, cy);
  ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
  ctx.fill("evenodd");

  // 黛青瓦檐顶线与圆门砖缘
  ctx.fillStyle = rim;
  ctx.fillRect(ox - 2, oy, ow + 4, Math.max(3, (iy - oy) * 0.28));
  ctx.strokeStyle = rim;
  ctx.lineWidth = Math.max(1.5, (ix - ox) * 0.14);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// =====================================================================
// 2. 顶部 Z 轴俯视剖面轨（data-perf-drag 核心交互轨道）
//    左端：视点 EYE  ──  可沿 Z 轴伸缩的 1..N 重门板  ──  右端：远景 FAR
// =====================================================================
export function renderDepthPlan(canvas, state, ev) {
  const { ctx, w, h } = fitCanvas(canvas, 2);
  if (w < 10 || h < 10) return;

  ctx.fillStyle = "#061320";
  ctx.fillRect(0, 0, w, h);

  const padL = 54;
  const padR = 54;
  const trackW = Math.max(40, w - padL - padR);
  const midY = h * 0.54;
  const xStart = padL;
  const xEnd = w - padR;

  // 经验舒适纵深带（42%–85%）淡青色底域
  const sweetX0 = xStart + trackW * SWEET.depthMin;
  const sweetX1 = xStart + trackW * SWEET.depthMax;
  ctx.fillStyle = "rgba(49, 177, 203, 0.11)";
  ctx.fillRect(sweetX0, 14, sweetX1 - sweetX0, h - 24);

  // 舒适带虚边界与标注
  ctx.strokeStyle = "rgba(49, 177, 203, 0.42)";
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sweetX0, 14);
  ctx.lineTo(sweetX0, h - 10);
  ctx.moveTo(sweetX1, 14);
  ctx.lineTo(sweetX1, h - 10);
  ctx.stroke();
  ctx.setLineDash([]);

  // 顶部标尺刻度字
  ctx.fillStyle = "#7FC8D8";
  ctx.font = '700 10px "Space Mono", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  if (trackW > 180) {
    ctx.fillText("经验纵深带 42%–85%", (sweetX0 + sweetX1) / 2, 3);
  } else {
    ctx.fillText("42%–85%", (sweetX0 + sweetX1) / 2, 3);
  }

  // 主 Z 轴中心线
  ctx.strokeStyle = "rgba(231, 219, 196, 0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xStart, midY);
  ctx.lineTo(xEnd, midY);
  ctx.stroke();

  // 当前纵深末门在轨道上的 X 位置
  const spanX = xStart + trackW * clamp(state.depthSpan, 0.08, 1.0);

  // 视线锥（轻量半透明扇形替代逐帧渐变）
  const blocked = ev.layers.some((g) => g.isBlocked);
  const coneEndX = blocked
    ? lerp(xStart + 18, spanX, ev.blockerIndex / Math.max(1, ev.layers.length - 1))
    : spanX;
  ctx.fillStyle = blocked ? "rgba(240, 122, 98, 0.16)" : "rgba(49, 177, 203, 0.16)";
  ctx.beginPath();
  ctx.moveTo(xStart - 6, midY);
  ctx.lineTo(coneEndX, midY - (h * 0.26));
  ctx.lineTo(coneEndX, midY + (h * 0.26));
  ctx.closePath();
  ctx.fill();

  // 各重门板在俯视剖面上的位置（带上下留门洞）
  const firstX = xStart + 18;
  ev.layers.forEach((g, idx) => {
    const gx = lerp(firstX, spanX, g.t);
    const barHalf = h * 0.30;
    const gapHalf = g.isBlocked ? 0 : h * 0.12;
    const offY = g.shiftX * h * 1.1;

    ctx.strokeStyle = g.isBlocked ? "#F07A62" : rgbCss(g.face);
    ctx.lineWidth = idx === 0 ? 4 : 3;
    ctx.beginPath();
    if (g.isBlocked) {
      ctx.moveTo(gx, midY - barHalf);
      ctx.lineTo(gx, midY + barHalf);
    } else {
      ctx.moveTo(gx, midY - barHalf);
      ctx.lineTo(gx, midY + offY - gapHalf);
      ctx.moveTo(gx, midY + offY + gapHalf);
      ctx.lineTo(gx, midY + barHalf);
    }
    ctx.stroke();

    // 底部极细门号小点
    ctx.fillStyle = g.isBlocked ? "#F07A62" : "#31B1CB";
    ctx.beginPath();
    ctx.arc(gx, h - 8, 1.8, 0, Math.PI * 2);
    ctx.fill();
  });

  // 可拖动的末门纵深手柄（高亮青蓝 / 错态赤陶）
  const handleOk = ev.pillars.advance.ok;
  const hColor = handleOk ? "#31B1CB" : "#F07A62";
  ctx.fillStyle = hColor;
  ctx.fillRect(spanX - 8, midY - 12, 16, 24);
  ctx.fillStyle = "#040D18";
  ctx.font = '700 11px "Space Mono", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("↔", spanX, midY + 0.5);

  // 左端 EYE 图标与标签
  ctx.strokeStyle = "#31B1CB";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(14, midY);
  ctx.quadraticCurveTo(25, midY - 8, 36, midY);
  ctx.quadraticCurveTo(25, midY + 8, 14, midY);
  ctx.stroke();
  ctx.fillStyle = "#E7DBC4";
  ctx.beginPath();
  ctx.arc(25, midY, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#B8CED6";
  ctx.font = '700 10px "Space Mono", monospace';
  ctx.textAlign = "center";
  ctx.fillText("视点", 25, midY + 18);

  // 右端 FAR 远景月圆标
  const farCx = w - 26;
  ctx.fillStyle = state.vista === "void" ? "#192A38" : state.vista === "glare" ? "#FFE59E" : "#EFE6D2";
  ctx.beginPath();
  ctx.arc(farCx, midY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = state.vista === "moon" ? "#31B1CB" : "#F07A62";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(farCx, midY, 10.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#B8CED6";
  ctx.fillText("远景", farCx, midY + 18);
}

// =====================================================================
// 3. 第 02 节「遮挡与 1/z 节拍」实验画布
//    mode: "empty"（无门空廊） | "uniform"（等距平贴光带） | "framed"（真 1/z 重门）
// =====================================================================
export function renderRhythmLab(canvas, mode) {
  const { ctx, w, h } = fitCanvas(canvas, 2);
  if (w < 10 || h < 10) return;

  ctx.fillStyle = "#06121E";
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.5;
  const vpY = h * 0.54;

  // 远景青月（三种模式下大小位置完全一致，让读者亲眼看到“同一轮月亮为何显得远近不同”！）
  const vw = w * 0.16;
  const vh = h * 0.30;
  const vx = cx - vw / 2;
  const vy = vpY - vh * 0.56;

  ctx.fillStyle = "#27A8BA";
  ctx.fillRect(vx, vy, vw, vh);
  ctx.fillStyle = "#EFE6D2";
  ctx.beginPath();
  ctx.arc(cx, vy + vh * 0.35, Math.max(5, vw * 0.17), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#015584";
  ctx.beginPath();
  ctx.moveTo(vx, vy + vh);
  ctx.lineTo(vx + vw * 0.25, vy + vh * 0.64);
  ctx.lineTo(vx + vw * 0.56, vy + vh * 0.80);
  ctx.lineTo(vx + vw * 0.82, vy + vh * 0.68);
  ctx.lineTo(vx + vw, vy + vh);
  ctx.closePath();
  ctx.fill();

  // 走廊地面梯形
  ctx.fillStyle = "#112231";
  ctx.beginPath();
  ctx.moveTo(vx, vy + vh);
  ctx.lineTo(vx + vw, vy + vh);
  ctx.lineTo(w * 0.90, h);
  ctx.lineTo(w * 0.10, h);
  ctx.closePath();
  ctx.fill();

  // 地板光带：uniform 用屏幕线性等距；empty 无光带；framed 用真实 1/z 透视递进
  if (mode === "uniform") {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const y0 = lerp(vy + vh + 6, h - 14, i / n);
      const y1 = y0 + (h - (vy + vh)) / (n * 2.1);
      const t0 = (y0 - (vy + vh)) / (h - (vy + vh));
      const t1 = (y1 - (vy + vh)) / (h - (vy + vh));
      const hw0 = lerp(vw * 0.48, w * 0.36, t0);
      const hw1 = lerp(vw * 0.48, w * 0.36, t1);
      ctx.fillStyle = "rgba(229, 217, 194, 0.72)";
      ctx.beginPath();
      ctx.moveTo(cx - hw0, y0);
      ctx.lineTo(cx + hw0, y0);
      ctx.lineTo(cx + hw1, y1);
      ctx.lineTo(cx - hw1, y1);
      ctx.closePath();
      ctx.fill();
    }
  } else if (mode === "framed") {
    const zSteps = [1.1, 1.45, 1.9, 2.5, 3.3, 4.3];
    for (let i = 0; i < zSteps.length; i++) {
      const zA = zSteps[i];
      const zB = zA * 1.18;
      const yA = vpY + (h * 0.44) / zA;
      const yB = vpY + (h * 0.44) / zB;
      const hwA = (w * 0.38) / zA;
      const hwB = (w * 0.38) / zB;
      ctx.fillStyle = `rgba(229, 217, 194, ${(0.92 - i * 0.11).toFixed(2)})`;
      ctx.beginPath();
      ctx.moveTo(cx - hwA, yA);
      ctx.lineTo(cx + hwA, yA);
      ctx.lineTo(cx + hwB, yB);
      ctx.lineTo(cx - hwB, yB);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 门框层：empty 只有外框；uniform 门框屏幕等距收缩；framed 真实 1/z 收缩 + 明暗衰减
  const frames = mode === "empty" ? 1 : 5;
  const tones = ["#E7DBC4", "#BFB19D", "#778085", "#385063", "#193042"];
  for (let i = frames - 1; i >= 0; i--) {
    const t = frames === 1 ? 0 : i / (frames - 1);
    const scale = mode === "uniform" ? lerp(1.0, 0.28, t) : 1 / lerp(1.0, 3.8, t);
    const ow = w * 0.84 * scale;
    const oh = h * 0.86 * scale;
    const ox = cx - ow / 2;
    const oy = vpY - oh * 0.56;
    const thick = ow * 0.11;
    const topThick = oh * 0.10;
    const ix = ox + thick;
    const iy = oy + topThick;
    const iw = ow - thick * 2;
    const ih = oh - topThick;

    ctx.fillStyle = mode === "uniform" ? "#CFC3AF" : tones[i];
    ctx.beginPath();
    ctx.rect(ox, oy, ow, oh);
    ctx.rect(ix, iy, iw, ih);
    ctx.fill("evenodd");
  }

  // 青蓝辅助标记
  ctx.strokeStyle = "rgba(49, 177, 203, 0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.96);
  ctx.lineTo(vx, vy + vh);
  ctx.moveTo(w * 0.92, h * 0.96);
  ctx.lineTo(vx + vw, vy + vh);
  ctx.stroke();

  // 左上角说明签
  const label =
    mode === "empty"
      ? "无中景重门 · 远月显得贴脸"
      : mode === "uniform"
      ? "屏幕等距排布 · 纵深塌成梯子"
      : "真 1/z 重门 + 遮挡 · 纵深拉长";
  ctx.fillStyle = "rgba(4, 13, 24, 0.82)";
  ctx.fillRect(10, 10, Math.min(w - 20, 226), 24);
  ctx.strokeStyle = mode === "framed" ? "#31B1CB" : "#F07A62";
  ctx.strokeRect(10, 10, Math.min(w - 20, 226), 24);
  ctx.fillStyle = "#EAE0CE";
  ctx.font = '700 11px "Noto Sans SC", sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 18, 22.5);
}

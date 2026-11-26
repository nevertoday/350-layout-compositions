// 046 矩形构图 — 开场「矩形断裁叙事台」2D 画布引擎与直接操作
// 1:1 承袭原海报满宽锋利黑框、四区嵌套矩形、红墙行者实景裁图、左右底朱红虚线标尺与实时视线流。

import { PALETTE, POSTER_PHOTO_CROP, SPECIMENS, clamp, evaluate } from "./model.js";
import { pixelRatio } from "../../lib/stage.js";

function drawDottedLine(ctx, x1, y1, x2, y2, color, dash = [4, 4]) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawDot(ctx, x, y, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxW, lineH, maxLines = 4) {
  if (maxW < 22 || maxLines < 1) return 0;
  let line = "";
  let lineCount = 0;
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line.length > 0) {
      ctx.fillText(line, x, y + lineCount * lineH);
      lineCount++;
      if (lineCount >= maxLines) return lineCount;
      line = ch;
    } else {
      line = test;
    }
  }
  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, y + lineCount * lineH);
    lineCount++;
  }
  return lineCount;
}

// 绘制对象覆盖裁切图（保证照片永不变形、永不拉伸）
function drawCoverImage(ctx, img, crop, dx, dy, dw, dh) {
  const srcRatio = crop.sw / crop.sh;
  const dstRatio = dw / dh;
  let sx = crop.sx, sy = crop.sy, sw = crop.sw, sh = crop.sh;
  if (dstRatio > srcRatio) {
    const newSh = sw / dstRatio;
    sy += (sh - newSh) * 0.56; // 偏下保留台阶上的行者剪影
    sh = newSh;
  } else {
    const newSw = sh * dstRatio;
    sx += (sw - newSw) * 0.52;
    sw = newSw;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// 当处于其他三个标本（或海报尚未解码完成）时，绘制精致的建筑/影像/器物场景
function drawSpecimenScene(ctx, specimenId, z, posterImg, t) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(z.x, z.y, z.w, z.h);
  ctx.clip();

  if (specimenId === "poster" && posterImg && posterImg.complete && posterImg.naturalWidth > 0) {
    drawCoverImage(ctx, posterImg, POSTER_PHOTO_CROP, z.x, z.y, z.w, z.h);
    ctx.restore();
    return;
  }

  if (specimenId === "poster" || specimenId === "magazine") {
    // 红墙光影建筑场景（矢量精绘版，无五官剪影）
    ctx.fillStyle = PALETTE.sky;
    ctx.fillRect(z.x, z.y, z.w, z.h);

    // 阳光红墙立面
    const wallW = z.w * 0.64;
    ctx.fillStyle = specimenId === "magazine" ? "#D65B43" : PALETTE.wallLit;
    ctx.fillRect(z.x, z.y, wallW, z.h * 0.86);

    // 锐利斜向建筑阴影
    ctx.fillStyle = PALETTE.wallShadow;
    ctx.beginPath();
    ctx.moveTo(z.x, z.y);
    ctx.lineTo(z.x + wallW * 0.34, z.y);
    ctx.lineTo(z.x + wallW * 0.82, z.y + z.h * 0.86);
    ctx.lineTo(z.x, z.y + z.h * 0.86);
    ctx.closePath();
    ctx.fill();

    // 右侧黑色几何矮墙体块
    ctx.fillStyle = "#1E2226";
    ctx.fillRect(z.x + z.w * 0.72, z.y + z.h * 0.56, z.w * 0.28, z.h * 0.32);

    // 台阶横线（强化横向延展）
    ctx.fillStyle = "#E5E0D8";
    ctx.fillRect(z.x, z.y + z.h * 0.84, z.w, z.h * 0.16);
    ctx.fillStyle = PALETTE.steps;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(z.x, z.y + z.h * (0.855 + i * 0.036), z.w * 0.88, 1.5);
    }

    // 极简行者剪影（纯侧影，无五官）
    const px = z.x + z.w * 0.55;
    const py = z.y + z.h * 0.845;
    const sc = clamp(Math.min(z.w, z.h) / 210, 0.45, 1.15);
    ctx.fillStyle = "#181A1E";
    ctx.beginPath();
    ctx.arc(px, py - 28 * sc, 3.2 * sc, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px - 2.5 * sc, py - 24 * sc, 5 * sc, 13 * sc);
    ctx.strokeStyle = "#181A1E";
    ctx.lineWidth = 2.4 * sc;
    ctx.beginPath();
    ctx.moveTo(px - 1 * sc, py - 11 * sc);
    ctx.lineTo(px - 5 * sc, py);
    ctx.moveTo(px + 1 * sc, py - 11 * sc);
    ctx.lineTo(px + 6 * sc, py);
    ctx.stroke();
  } else if (specimenId === "cinema") {
    // 宽银幕电影走廊：纵深矩形门廊 + 冷暖光影
    const grad = ctx.createLinearGradient(z.x, z.y, z.x + z.w, z.y);
    grad.addColorStop(0, "#1E262E");
    grad.addColorStop(0.45, "#2C3B46");
    grad.addColorStop(1, "#C3CDD3");
    ctx.fillStyle = grad;
    ctx.fillRect(z.x, z.y, z.w, z.h);

    // 重复的建筑门框柱（层层矩形嵌套）
    const cols = 5;
    for (let i = 0; i < cols; i++) {
      const rx = z.x + z.w * (0.12 + i * 0.18);
      const rw = z.w * 0.075;
      ctx.fillStyle = i < 2 ? "#161C22" : i === 2 ? "#C84F3D" : "#384A57";
      ctx.fillRect(rx, z.y, rw, z.h * 0.82);
    }
    // 暖光地坪斜投光带
    ctx.fillStyle = "#E8D9C8";
    ctx.fillRect(z.x, z.y + z.h * 0.82, z.w, z.h * 0.18);
    ctx.fillStyle = "rgba(211, 84, 67, 0.35)";
    ctx.beginPath();
    ctx.moveTo(z.x + z.w * 0.44, z.y + z.h * 0.82);
    ctx.lineTo(z.x + z.w * 0.78, z.y + z.h * 0.82);
    ctx.lineTo(z.x + z.w * 0.92, z.y + z.h);
    ctx.lineTo(z.x + z.w * 0.32, z.y + z.h);
    ctx.closePath();
    ctx.fill();

    // 远景单人剪影（纯背影）
    const px = z.x + z.w * 0.62;
    const py = z.y + z.h * 0.83;
    const sc = clamp(Math.min(z.w, z.h) / 190, 0.45, 1.15);
    ctx.fillStyle = "#161B20";
    ctx.beginPath();
    ctx.arc(px, py - 26 * sc, 3.2 * sc, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px - 3.2 * sc, py - 22 * sc, 6.4 * sc, 22 * sc);

    // 宽银幕微细上下遮幅线
    ctx.fillStyle = "rgba(20, 24, 28, 0.22)";
    ctx.fillRect(z.x, z.y, z.w, Math.max(4, z.h * 0.05));
    ctx.fillRect(z.x, z.y + z.h - Math.max(4, z.h * 0.05), z.w, Math.max(4, z.h * 0.05));
  } else {
    // 品牌器物展陈：几何展台 + 红陶花器 + 柔和长影
    ctx.fillStyle = "#E4DED5";
    ctx.fillRect(z.x, z.y, z.w, z.h);
    // 墙面矩形光影分界
    ctx.fillStyle = "#D4CCC0";
    ctx.fillRect(z.x + z.w * 0.56, z.y, z.w * 0.44, z.h);
    // 展台矩形石块
    const baseY = z.y + z.h * 0.72;
    ctx.fillStyle = "#2E3A44";
    ctx.fillRect(z.x + z.w * 0.18, baseY, z.w * 0.64, z.h * 0.28);
    ctx.fillStyle = "#3E4E5A";
    ctx.fillRect(z.x + z.w * 0.18, baseY, z.w * 0.64, Math.max(4, z.h * 0.03));

    // 红陶高瓶 + 低圆钵（纯建筑几何静物）
    const cx = z.x + z.w * 0.45;
    const vh = z.h * 0.44;
    const vw = clamp(z.w * 0.16, 22, 66);
    // 投影
    ctx.fillStyle = "rgba(37, 42, 54, 0.18)";
    ctx.beginPath();
    ctx.moveTo(cx + vw * 0.45, baseY);
    ctx.lineTo(cx + vw * 1.9, baseY);
    ctx.lineTo(cx + vw * 1.4, baseY - vh * 0.14);
    ctx.lineTo(cx + vw * 0.35, baseY - vh * 0.14);
    ctx.closePath();
    ctx.fill();

    // 瓶身
    ctx.fillStyle = "#C94C3B";
    ctx.fillRect(cx - vw * 0.46, baseY - vh * 0.72, vw * 0.92, vh * 0.72);
    ctx.fillStyle = "#AE3B2C";
    ctx.fillRect(cx - vw * 0.46, baseY - vh * 0.72, vw * 0.32, vh * 0.72);
    // 瓶颈
    ctx.fillStyle = "#D65A48";
    ctx.fillRect(cx - vw * 0.22, baseY - vh, vw * 0.44, vh * 0.28);

    // 右侧小石方体呼应
    const bx = cx + vw * 0.85;
    const bw = vw * 0.68;
    const bh = vh * 0.28;
    ctx.fillStyle = "#F7F3ED";
    ctx.fillRect(bx, baseY - bh, bw, bh);
    ctx.strokeStyle = "#2E3A44";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(bx, baseY - bh, bw, bh);
  }

  // 轻微的呼吸光扫（仅非静止状态，极克制）
  if (t > 0 && specimenId === "cinema") {
    const scanX = z.x + ((t * 28) % (z.w + 80)) - 40;
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(scanX, z.y, 26, z.h);
  }
  ctx.restore();
}

export function createHeroCanvas(canvas, miniSvg, getState, onStateChange, getPosterImg) {
  const ctx = canvas.getContext("2d");
  let lastEval = null;
  let activeDrag = null; // { mode: 'x1'|'x2'|'y1'|'aspect'|'sweep', startX, startY, orig }
  let hoverTarget = null;
  let pulseActive = false;
  let pulsePhase = 0;
  let dirty = true;
  let lastSizeKey = "";
  const INTRO_DUR = 0.72;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(200, Math.round(rect.height));
    const sizeKey = `${w}x${h}@${dpr}`;
    if (sizeKey !== lastSizeKey) {
      lastSizeKey = sizeKey;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dirty = true;
    }
    return { w, h, dpr };
  }

  function updateMiniEmblem(ev) {
    if (!miniSvg) return;
    const { frame, zones, state: s } = ev.layout;
    // 把实绘四区归一化到 64×46 的原海报迷你徽章框里，实时同步！
    const mw = 64, mh = 46;
    const norm = (z) => ({
      x: ((z.x - frame.x) / frame.w) * mw,
      y: ((z.y - frame.y) / frame.h) * mh,
      w: (z.w / frame.w) * mw,
      h: (z.h / frame.h) * mh,
    });
    const nf = norm(zones.focus);
    const ns = norm(zones.scene);
    const nsu = norm(zones.support);
    const ng = norm(zones.guide);

    const setRect = (id, r) => {
      const el = miniSvg.querySelector(`[data-mini="${id}"]`);
      if (!el) return;
      el.setAttribute("x", r.x.toFixed(1));
      el.setAttribute("y", r.y.toFixed(1));
      el.setAttribute("width", Math.max(2, r.w).toFixed(1));
      el.setAttribute("height", Math.max(2, r.h).toFixed(1));
    };
    setRect("focus", nf);
    setRect("scene", ns);
    setRect("support", nsu);
    setRect("guide", ng);
    const borderEl = miniSvg.querySelector('[data-mini="border"]');
    if (borderEl) {
      borderEl.setAttribute("stroke-dasharray", s.borderOn ? "none" : "3 3");
      borderEl.setAttribute("stroke", s.borderOn ? PALETTE.frame : PALETTE.err);
    }
  }

  function draw(t = 0, dt = 0, { still = false } = {}) {
    const { w, h, dpr } = resize();
    const introP = still ? 1 : clamp(t / INTRO_DUR, 0, 1);
    const inIntro = !still && t < INTRO_DUR + 0.05;
    if (!dirty && !inIntro && !pulseActive && lastEval) {
      return null;
    }
    dirty = false;

    const state = getState();
    const ev = evaluate(state, w, h);
    lastEval = ev;
    const { layout, pillars, passCount } = ev;
    const { frame, zones, rails, vertical, state: s } = layout;
    const specimen = SPECIMENS.find((x) => x.id === s.specimen) || SPECIMENS[0];

    if (!still && pulseActive) {
      pulsePhase = (pulsePhase + dt * 0.55) % 1;
    }

    // 丝滑开场缓动（仅控制边框与标尺铺展，状态始终保持完整错态）
    const ease = introP >= 1 ? 1 : 1 - (1 - introP) ** 3;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 暖灰岩画廊纸底
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    // 极淡正交制图参考暗纹（不喧宾夺主）
    ctx.strokeStyle = "rgba(37, 42, 54, 0.045)";
    ctx.lineWidth = 1;
    const gridStep = 28;
    for (let gx = Math.round(frame.x) % gridStep; gx < w; gx += gridStep) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }
    for (let gy = Math.round(frame.y) % gridStep; gy < h; gy += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    // 1b. 当框比落入 0.85–1.24 暧昧近方区间时，在画框左右两侧绘出 2.07:1 原海报延展参考虚框（既消解宽屏两侧空旷，又直观提示「展宽成矩形」）
    if (frame.ratio >= 0.85 && frame.ratio <= 1.24 && w > 560) {
      const targetW = Math.min(w - 132, frame.h * 2.07);
      if (targetW > frame.w + 48) {
        const tx = frame.x - (targetW - frame.w) * 0.5;
        ctx.save();
        ctx.strokeStyle = "rgba(176, 50, 34, 0.36)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(tx, frame.y, targetW, frame.h);
        // 左右两侧淡淡底纹 + 延展提示字
        ctx.fillStyle = "rgba(222, 100, 79, 0.045)";
        ctx.fillRect(tx, frame.y, frame.x - tx, frame.h);
        ctx.fillRect(frame.x + frame.w, frame.y, tx + targetW - (frame.x + frame.w), frame.h);
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(176, 50, 34, 0.72)";
        ctx.font = `600 11px "Noto Sans SC", "DM Mono", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const lxRuler = Math.max(16, frame.x - 30);
        const leftTextRight = lxRuler - 18;
        const leftTextW = leftTextRight - tx;
        if (leftTextW > 76) {
          ctx.fillText("← 延展势能区", tx + leftTextW * 0.5, frame.y + frame.h * 0.5 - 8);
          ctx.font = `500 10.5px "DM Mono", sans-serif`;
          ctx.fillText("TARGET 2.07:1", tx + leftTextW * 0.5, frame.y + frame.h * 0.5 + 9);
        }
        const rightTextLeft = frame.x + frame.w + 68;
        const rightTextW = (tx + targetW) - rightTextLeft;
        if (rightTextW > 76) {
          ctx.font = `600 11px "Noto Sans SC", sans-serif`;
          ctx.fillText("向右拉宽画框 →", rightTextLeft + rightTextW * 0.5, frame.y + frame.h * 0.5 - 8);
          ctx.font = `500 10.5px "DM Mono", sans-serif`;
          ctx.fillText("EXTENSION ZONE", rightTextLeft + rightTextW * 0.5, frame.y + frame.h * 0.5 + 9);
        }
        ctx.restore();
      }
    }

    // 2. 外框底衬纸白（与原海报白底框内缝一致）
    ctx.fillStyle = s.borderOn ? "#FFFFFF" : "rgba(255,255,255,0.45)";
    ctx.fillRect(frame.x, frame.y, frame.w, frame.h);

    // 3. 绘制四个嵌套子矩形
    // 3a. 建筑/场景主图区
    drawSpecimenScene(ctx, s.specimen, zones.scene, getPosterImg ? getPosterImg() : null, still ? 0 : t);
    // 主图占比角标
    const compact = w < 520;
    const padIn = clamp(Math.min(zones.scene.w, zones.scene.h) * 0.08, 8, 18);

    // 3b. 朱红「视觉焦点」块（高对比朱红底 + 纯白字）
    ctx.fillStyle = PALETTE.redFill;
    ctx.fillRect(zones.focus.x, zones.focus.y, zones.focus.w, zones.focus.h);
    {
      const z = zones.focus;
      const px = clamp(z.w * 0.11, 8, 22);
      const py = clamp(z.h * 0.13, 10, 26);
      ctx.save();
      ctx.beginPath();
      ctx.rect(z.x, z.y, z.w, z.h);
      ctx.clip();
      ctx.fillStyle = "#FFFFFF";
      const titleSize = clamp(Math.min(z.w * 0.145, z.h * 0.16), 12, 22);
      ctx.font = `700 ${titleSize}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(specimen.focusTitle, z.x + px, z.y + py);

      if (z.w > 95 && z.h > 80) {
        const bodySize = clamp(Math.min(z.w * 0.068, 12.5), 10.5, 12.5);
        ctx.font = `400 ${bodySize}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
        const lines = wrapText(ctx, specimen.focusBody, z.x + px, z.y + py + titleSize + 8, z.w - px * 2, bodySize * 1.55, z.h > 130 ? 3 : 2);
        // 原海报招牌白短横杠
        const barY = z.y + py + titleSize + 14 + lines * bodySize * 1.55;
        if (barY < z.y + z.h - 14) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(z.x + px, barY, Math.min(34, z.w * 0.22), 2.5);
        }
      }
      // 左下角实测面积（避开右缘隔断把手）
      if (z.w > 54 && z.h > 36) {
        ctx.font = `500 10.5px "DM Mono", monospace`;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(`焦块 ${Math.round(z.share * 100)}%`, z.x + px, z.y + z.h - 7);
      }
      ctx.restore();
    }

    // 3c. 深靛灰「信息支撑」柱
    ctx.fillStyle = PALETTE.slate;
    ctx.fillRect(zones.support.x, zones.support.y, zones.support.w, zones.support.h);
    {
      const z = zones.support;
      const px = clamp(z.w * 0.11, 8, 20);
      const py = clamp(z.h * 0.12, 10, 28);
      ctx.save();
      ctx.beginPath();
      ctx.rect(z.x, z.y, z.w, z.h);
      ctx.clip();
      ctx.fillStyle = "#FFFFFF";
      const titleSize = clamp(Math.min(z.w * 0.16, z.h * 0.14), 12, 20);
      ctx.font = `700 ${titleSize}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(specimen.supportTitle, z.x + px, z.y + py);

      if (z.w > 78 && z.h > 72) {
        const bodySize = clamp(Math.min(z.w * 0.085, 12), 10.5, 12);
        ctx.font = `400 ${bodySize}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = "rgba(244, 239, 232, 0.9)";
        const lines = wrapText(ctx, specimen.supportBody, z.x + px, z.y + py + titleSize + 8, z.w - px * 2, bodySize * 1.55, z.h > 160 ? 4 : 2);
        const barY = z.y + py + titleSize + 14 + lines * bodySize * 1.55;
        if (barY < z.y + z.h - 24) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(z.x + px, barY, Math.min(30, z.w * 0.28), 2.5);
        }
      }
      if (z.w > 48 && z.h > 34) {
        ctx.font = `500 10.5px "DM Mono", monospace`;
        ctx.fillStyle = "rgba(244,239,232,0.88)";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(`辅柱 ${Math.round(z.share * 100)}%`, z.x + px, z.y + z.h - 7);
      }
      ctx.restore();
    }

    // 3d. 暖石灰「引导视线」导流带
    ctx.fillStyle = PALETTE.stone;
    ctx.fillRect(zones.guide.x, zones.guide.y, zones.guide.w, zones.guide.h);
    {
      const z = zones.guide;
      const px = clamp(z.w * 0.045, 8, 22);
      const py = clamp(z.h * 0.16, 7, 16);
      ctx.save();
      ctx.beginPath();
      ctx.rect(z.x, z.y, z.w, z.h);
      ctx.clip();
      ctx.fillStyle = PALETTE.ink;
      const titleSize = clamp(Math.min(z.h * 0.28, 15), 11.5, 15);
      ctx.font = `700 ${titleSize}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(specimen.guideTitle, z.x + px, z.y + py);

      const textAreaW = Math.min(z.w * 0.48, z.w - px * 2);
      if (z.h > 44 && textAreaW > 90) {
        ctx.font = `400 11px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = PALETTE.inkSoft;
        wrapText(ctx, specimen.guideBody, z.x + px, z.y + py + titleSize + 5, textAreaW, 16, z.h > 68 ? 2 : 1);
      }

      // 原海报右侧导流虚线箭（正流向右指向信息柱，逆流标红向左顶回）
      const arrowStartX = z.x + Math.max(px + textAreaW + 14, z.w * 0.54);
      const arrowEndX = z.x + z.w - Math.max(14, px);
      const arrowY = z.y + z.h * 0.56;
      if (arrowEndX - arrowStartX > 28) {
        const isRev = s.flowDir === "reversed";
        const arrowColor = isRev ? PALETTE.err : PALETTE.ink;
        drawDottedLine(ctx, arrowStartX, arrowY, arrowEndX, arrowY, arrowColor, [4, 4]);
        ctx.fillStyle = arrowColor;
        ctx.beginPath();
        if (isRev) {
          ctx.moveTo(arrowStartX - 2, arrowY);
          ctx.lineTo(arrowStartX + 7, arrowY - 4.5);
          ctx.lineTo(arrowStartX + 7, arrowY + 4.5);
        } else {
          ctx.moveTo(arrowEndX + 2, arrowY);
          ctx.lineTo(arrowEndX - 7, arrowY - 4.5);
          ctx.lineTo(arrowEndX - 7, arrowY + 4.5);
        }
        ctx.closePath();
        ctx.fill();
        if (isRev && z.h > 38) {
          ctx.font = `600 10px "Noto Sans SC", sans-serif`;
          ctx.fillStyle = PALETTE.err;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText("逆向顶回 ×", (arrowStartX + arrowEndX) * 0.5, arrowY - 5);
        }
      }
      ctx.restore();
    }

    // 主图面积小签（高对比深岩底牌）
    {
      const z = zones.scene;
      if (z.w > 64 && z.h > 36) {
        const label = `主图 ${Math.round(z.share * 100)}%`;
        ctx.font = `500 10.5px "DM Mono", "Noto Sans SC", sans-serif`;
        const tw = ctx.measureText(label).width + 12;
        ctx.fillStyle = "rgba(30, 38, 46, 0.84)";
        ctx.fillRect(z.x + 8, z.y + 8, tw, 20);
        ctx.fillStyle = "#FCFBF8";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(label, z.x + 14, z.y + 18);
      }
    }

    // 4. 锋利外框（0px 直角）或无框虚线告警
    if (s.borderOn) {
      ctx.strokeStyle = PALETTE.frame;
      ctx.lineWidth = 2;
      ctx.strokeRect(frame.x, frame.y, frame.w, frame.h);
    } else {
      ctx.save();
      ctx.strokeStyle = PALETTE.err;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.strokeRect(frame.x, frame.y, frame.w, frame.h);
      ctx.restore();
    }

    // 5. 若铁笼贴死（gutter < 5），在内缝处绘出红色紧绷压力警线
    if (s.gutter < 5) {
      ctx.save();
      ctx.strokeStyle = PALETTE.err;
      ctx.lineWidth = 1.6;
      for (const rail of Object.values(rails)) {
        ctx.beginPath();
        ctx.moveTo(rail.x1, rail.y1);
        ctx.lineTo(rail.x2, rail.y2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 6. 可拖拽隔断刃提示把手（悬停/拖拽高亮，平时克制如建筑图纸游标）
    for (const [key, rail] of Object.entries(rails)) {
      const isHot = activeDrag?.mode === key || hoverTarget === key;
      const mx = (rail.x1 + rail.x2) * 0.5;
      const my = (rail.y1 + rail.y2) * 0.5;
      if (isHot) {
        ctx.save();
        ctx.strokeStyle = PALETTE.red;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(rail.x1, rail.y1);
        ctx.lineTo(rail.x2, rail.y2);
        ctx.stroke();
        ctx.restore();
      }
      // 精致的建筑截断小柄
      ctx.save();
      const pillW = rail.axis === "x" ? 12 : 28;
      const pillH = rail.axis === "x" ? 28 : 12;
      ctx.fillStyle = isHot ? PALETTE.redFill : PALETTE.ink;
      ctx.fillRect(mx - pillW * 0.5, my - pillH * 0.5, pillW, pillH);
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(mx - pillW * 0.5, my - pillH * 0.5, pillW, pillH);
      // 双微杠纹理
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      if (rail.axis === "x") {
        ctx.moveTo(mx - 2, my - 6); ctx.lineTo(mx - 2, my + 6);
        ctx.moveTo(mx + 2, my - 6); ctx.lineTo(mx + 2, my + 6);
      } else {
        ctx.moveTo(mx - 6, my - 2); ctx.lineTo(mx + 6, my - 2);
        ctx.moveTo(mx - 6, my + 2); ctx.lineTo(mx + 6, my + 2);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 右缘画幅拉伸小手柄（提示可拖画框改长宽比）
    {
      const hx = frame.x + frame.w;
      const hy = frame.y + frame.h * 0.5;
      const hot = activeDrag?.mode === "aspect" || hoverTarget === "aspect";
      ctx.save();
      ctx.fillStyle = hot ? PALETTE.redFill : "#FFFFFF";
      ctx.strokeStyle = hot ? PALETTE.redFill : PALETTE.frame;
      ctx.lineWidth = 1.6;
      ctx.fillRect(hx - 5, hy - 16, 10, 32);
      ctx.strokeRect(hx - 5, hy - 16, 10, 32);
      ctx.restore();
    }

    // 7. 可选辅助：视线叙事动线演播（序点放在各区右上角留白处，绝不遮挡正文文字）
    if (s.showGuides) {
      const badgePt = (z) => ({
        x: z.x + Math.max(14, z.w - 15),
        y: z.y + 15,
      });
      const pts = vertical
        ? [
            badgePt(zones.scene),
            badgePt(zones.focus),
            badgePt(zones.support),
            badgePt(zones.guide),
          ]
        : s.flowDir === "reversed"
          ? [
              badgePt(zones.focus),
              badgePt(zones.scene),
              { x: zones.guide.x + zones.guide.w - 16, y: zones.guide.y + 16 },
            ]
          : [
              badgePt(zones.focus),
              badgePt(zones.scene),
              { x: zones.guide.x + zones.guide.w - 16, y: zones.guide.y + 16 },
              badgePt(zones.support),
            ];

      ctx.save();
      ctx.strokeStyle = s.flowDir === "reversed" ? "rgba(178, 40, 29, 0.72)" : "rgba(255, 255, 255, 0.76)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
      ctx.restore();

      // 序号小圆点 ① ② ③ ④
      pts.forEach((p, idx) => {
        ctx.save();
        ctx.fillStyle = s.flowDir === "reversed" ? PALETTE.err : PALETTE.ink;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `600 10px "DM Mono", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(idx + 1), p.x, p.y + 0.5);
        ctx.restore();
      });

      // 视线演播光珠
      if (pulseActive && pts.length >= 2) {
        const segCount = pts.length - 1;
        const scaled = pulsePhase * segCount;
        const seg = Math.min(segCount - 1, Math.floor(scaled));
        const f = scaled - seg;
        const px = pts[seg].x + (pts[seg + 1].x - pts[seg].x) * f;
        const py = pts[seg].y + (pts[seg + 1].y - pts[seg].y) * f;
        ctx.save();
        ctx.fillStyle = "rgba(211, 84, 67, 0.28)";
        ctx.beginPath();
        ctx.arc(px, py, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.redAccent;
        ctx.beginPath();
        ctx.arc(px, py, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 8. 忠实复刻原海报外围三道朱红虚线标尺！
    const extOk = pillars[1].ok;
    const rulerColor = extOk ? PALETTE.redText : PALETTE.err;

    // 8a. 左侧「纵向延展」朱红点虚线标尺（开场沿纵轴徐徐铺展）
    {
      const lx = Math.max(16, frame.x - (compact ? 18 : 30));
      const midY = frame.y + frame.h * 0.5;
      const gap = compact ? 18 : 26;
      const spanHalf = (frame.h * 0.5 - 3) * ease;
      const topY = midY - spanHalf;
      const botY = midY + spanHalf;
      drawDot(ctx, lx, topY, 3.2, rulerColor);
      drawDot(ctx, lx, botY, 3.2, rulerColor);
      if (midY - gap > topY + 3) drawDottedLine(ctx, lx, topY + 3, lx, midY - gap, rulerColor, [3, 4]);
      if (botY - 3 > midY + gap) drawDottedLine(ctx, lx, midY + gap, lx, botY - 3, rulerColor, [3, 4]);

      ctx.save();
      ctx.fillStyle = rulerColor;
      ctx.font = `${vertical ? 700 : 600} ${compact ? 10.5 : 12}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("纵向", lx, midY - 8);
      ctx.fillText("延展", lx, midY + 8);
      ctx.restore();
    }

    // 8b. 底部「横向延伸 扩展叙事空间」朱红点虚线标尺（开场沿横轴徐徐铺展）
    {
      const by = Math.min(h - 16, frame.y + frame.h + (compact ? 20 : 26));
      const midX = frame.x + frame.w * 0.5;
      const text = vertical
        ? `竖框 ${frame.ratio.toFixed(2)}:1 · 纵轴引导`
        : extOk
          ? `横向延伸 ${frame.ratio.toFixed(2)}:1 · 扩展叙事空间`
          : `框比 ${frame.ratio.toFixed(2)}:1 · 延展方向不足`;
      ctx.font = `600 ${compact ? 11 : 12.5}px "Noto Sans SC", "DM Mono", sans-serif`;
      const tw = ctx.measureText(text).width;
      const halfText = tw * 0.5 + 10;
      const spanHalf = (frame.w * 0.5 - 3) * ease;
      const leftX = midX - spanHalf;
      const rightX = midX + spanHalf;

      drawDot(ctx, leftX, by, 3.2, rulerColor);
      drawDot(ctx, rightX, by, 3.2, rulerColor);
      if (midX - halfText > leftX + 5) {
        drawDottedLine(ctx, leftX + 3, by, midX - halfText, by, rulerColor, [3, 4]);
      }
      if (midX + halfText < rightX - 5) {
        drawDottedLine(ctx, midX + halfText, by, rightX - 3, by, rulerColor, [3, 4]);
      }
      ctx.fillStyle = rulerColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, midX, by);
    }

    // 8c. 右侧「信息分区」朱红虚线短引注
    if (!compact) {
      const rx1 = frame.x + frame.w + 5;
      const rx2 = Math.min(w - 46, frame.x + frame.w + 26);
      const ry = frame.y + frame.h * 0.36;
      if (rx2 > rx1 + 6) {
        drawDottedLine(ctx, rx1, ry, rx2, ry, PALETTE.redText, [3, 3]);
        ctx.fillStyle = PALETTE.redText;
        ctx.font = `600 11.5px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("信息", rx2 + 5, ry - 7);
        ctx.fillText("分区", rx2 + 5, ry + 8);
      }
    }

    // 9. 左上角极简状态浮标（单真源）
    {
      const chipText = `${passCount}/4 · ${ev.metrics.aspectText} · 缝 ${s.gutter}px`;
      ctx.font = `500 11px "DM Mono", "Noto Sans SC", sans-serif`;
      const cw = ctx.measureText(chipText).width + 16;
      ctx.fillStyle = passCount === 4 ? PALETTE.ok : PALETTE.ink;
      ctx.fillRect(frame.x, Math.max(4, frame.y - 22), cw, 18);
      ctx.fillStyle = "#FCFBF8";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(chipText, frame.x + 8, Math.max(4, frame.y - 22) + 9);
    }

    ctx.restore();

    // 同步右上原海报迷你徽章
    updateMiniEmblem(ev);
    return ev;
  }

  // ---------- 指针交互（鼠标 + 触摸，保证竖屏可正常上下滚屏，横向拖拽响应流畅）----------
  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function hitTest(px, py) {
    if (!lastEval) return null;
    const { rails, frame } = lastEval.layout;
    const tol = 18;
    // 优先命中右缘拉伸柄
    if (Math.abs(px - (frame.x + frame.w)) <= 16 && Math.abs(py - (frame.y + frame.h * 0.5)) <= 26) {
      return "aspect";
    }
    // 命中三条隔断刃
    for (const [key, r] of Object.entries(rails)) {
      if (r.axis === "x") {
        if (Math.abs(px - r.pos) <= tol && py >= r.y1 - 8 && py <= r.y2 + 8) return key;
      } else {
        if (Math.abs(py - r.pos) <= tol && px >= r.x1 - 8 && px <= r.x2 + 8) return key;
      }
    }
    return null;
  }

  function hitZone(px, py) {
    if (!lastEval) return null;
    for (const [key, z] of Object.entries(lastEval.layout.zones)) {
      if (px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h) return key;
    }
    return null;
  }

  function updateCursor(hit) {
    if (!lastEval) return;
    if (hit === "aspect") {
      canvas.style.cursor = "ew-resize";
    } else if (hit && lastEval.layout.rails[hit]) {
      canvas.style.cursor = lastEval.layout.rails[hit].axis === "x" ? "ew-resize" : "ns-resize";
    } else {
      canvas.style.cursor = "grab";
    }
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const pos = getCanvasPos(e);
    const hit = hitTest(pos.x, pos.y);
    const s = getState();
    activeDrag = {
      id: e.pointerId,
      mode: hit || "sweep",
      startX: pos.x,
      startY: pos.y,
      moved: false,
      orig: { ...s },
      layoutAtStart: lastEval ? lastEval.layout : null,
    };
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    canvas.style.cursor = "grabbing";
  });

  canvas.addEventListener("pointermove", (e) => {
    const pos = getCanvasPos(e);
    if (!activeDrag) {
      const nextHover = hitTest(pos.x, pos.y);
      if (nextHover !== hoverTarget) {
        hoverTarget = nextHover;
        dirty = true;
      }
      updateCursor(hoverTarget);
      return;
    }
    if (e.pointerId !== activeDrag.id) return;
    const dx = pos.x - activeDrag.startX;
    const dy = pos.y - activeDrag.startY;
    if (Math.hypot(dx, dy) > 4) activeDrag.moved = true;
    const lay = activeDrag.layoutAtStart || (lastEval && lastEval.layout);
    if (!lay) return;
    const { inner, vertical } = lay;
    const orig = activeDrag.orig;

    // 若原本按到水平导流刃 y1，但手势明显在水平横拖（如 perf 中心横滑），自动切为 sweep 横移主断刃
    if (activeDrag.mode === "y1" && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      activeDrag.mode = "sweep";
    }

    if (activeDrag.mode === "x1") {
      const next = clamp((pos.x - inner.x) / inner.w, 0.14, vertical ? 0.76 : orig.x2 - 0.14);
      // 靠近原海报经典 0.285 轻微吸附
      const snapped = !vertical && Math.abs(next - 0.285) < 0.015 ? 0.285 : next;
      onStateChange({ x1: +snapped.toFixed(3) });
    } else if (activeDrag.mode === "x2") {
      if (vertical) {
        const next = clamp((pos.y - inner.y) / inner.h, Math.max(orig.y1 + 0.14, 0.66), 0.92);
        onStateChange({ x2: +next.toFixed(3) });
      } else {
        const next = clamp((pos.x - inner.x) / inner.w, Math.max(0.52, orig.x1 + 0.14), 0.90);
        const snapped = Math.abs(next - 0.81) < 0.015 ? 0.81 : next;
        onStateChange({ x2: +snapped.toFixed(3) });
      }
    } else if (activeDrag.mode === "y1") {
      const next = clamp((pos.y - inner.y) / inner.h, vertical ? 0.26 : 0.42, vertical ? 0.72 : 0.88);
      const snapped = !vertical && Math.abs(next - 0.765) < 0.015 ? 0.765 : next;
      onStateChange({ y1: +snapped.toFixed(3) });
    } else if (activeDrag.mode === "aspect") {
      const deltaAspect = (dx / Math.max(160, canvas.clientWidth * 0.45)) * 1.4;
      const next = clamp(orig.aspect + deltaAspect, 0.50, 2.88);
      const snapped = Math.abs(next - 2.07) < 0.04 ? 2.07 : Math.abs(next - 1.50) < 0.03 ? 1.50 : next;
      onStateChange({ aspect: +snapped.toFixed(2) });
    } else {
      // 开放区横拖（含 perf.mjs 中心左右拖动测试）：
      // 流畅横拖主断刃 x1 并联动框比微调，每一帧都能看到实绘矩形与标尺连续响应！
      const normDx = dx / Math.max(120, inner.w);
      const nextX1 = clamp(orig.x1 + normDx * 0.85, 0.15, vertical ? 0.74 : orig.x2 - 0.15);
      onStateChange({ x1: +nextX1.toFixed(3) });
    }
  });

  function endDrag(e) {
    if (!activeDrag || (e && e.pointerId !== activeDrag.id)) return;
    const wasClick = !activeDrag.moved;
    const pos = e ? getCanvasPos(e) : { x: activeDrag.startX, y: activeDrag.startY };
    activeDrag = null;
    updateCursor(hitTest(pos.x, pos.y));
    if (wasClick) {
      const zId = hitZone(pos.x, pos.y);
      if (zId === "focus" || zId === "guide") {
        // 点按焦点块或导流带：顺转或反转叙事流向
        const s = getState();
        onStateChange({ flowDir: s.flowDir === "reversed" ? "forward" : "reversed", selectedZone: zId });
      } else if (zId) {
        onStateChange({ selectedZone: zId });
      }
    }
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => {
    if (!activeDrag) hoverTarget = null;
  });

  return {
    draw,
    markDirty() {
      dirty = true;
    },
    setPulse(on) {
      pulseActive = Boolean(on);
      if (pulseActive) pulsePhase = 0;
      dirty = true;
    },
    isPulsing() {
      return pulseActive;
    },
  };
}

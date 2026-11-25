// 119 图底关系原则 · 开场主角画布 + 1:1 原海报双嵌套方框反演镜
// 100% 纯 2D Canvas（离线/无 WebGL 同样满分渲染），走 lib/stage.js loop() + pixelRatio()

import { loop, pixelRatio } from "../../lib/stage.js";
import { POSTER_COLORS, computeGeometry, evaluate, resolveColors, sampleRubinProfile } from "./model.js";

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

// 离屏小尺寸斜纹 Pattern 缓存：1 次 fillRect 替代 60 条斜线重绘，软件渲染性能飙升
const patternCache = new Map();
function getNoisePattern(ctx, strength, col) {
  const key = `${strength}|${col}`;
  if (patternCache.has(key)) return patternCache.get(key);
  const step = strength === 2 ? 14 : 22;
  const tile = document.createElement("canvas");
  tile.width = step * 2;
  tile.height = step * 2;
  const tctx = tile.getContext("2d");
  tctx.strokeStyle = col;
  tctx.lineWidth = strength === 2 ? 4.0 : 2.0;
  tctx.globalAlpha = strength === 2 ? 0.42 : 0.22;
  tctx.beginPath();
  for (let d = -step * 2; d <= step * 4; d += step) {
    tctx.moveTo(d, 0);
    tctx.lineTo(d - step * 2, step * 2);
  }
  tctx.stroke();
  if (strength === 2) {
    tctx.lineWidth = 2.0;
    tctx.globalAlpha = 0.25;
    tctx.beginPath();
    tctx.moveTo(0, 0);
    tctx.lineTo(step * 2, step * 2);
    tctx.moveTo(-step * 2, 0);
    tctx.lineTo(0, step * 2);
    tctx.moveTo(step * 2, 0);
    tctx.lineTo(step * 4, step * 2);
    tctx.stroke();
  }
  const pat = ctx.createPattern(tile, "repeat");
  patternCache.set(key, pat);
  return pat;
}

function drawDiagonalNoise(ctx, x, y, w, h, strength, col) {
  if (strength <= 0) return;
  const pat = getNoisePattern(ctx, strength, col);
  if (!pat) return;
  ctx.save();
  ctx.fillStyle = pat;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function drawPillTag(ctx, cx, cy, text, bg, fg, border) {
  ctx.save();
  ctx.font = '600 12px "Noto Sans SC", sans-serif';
  const tw = ctx.measureText(text).width;
  const padX = 11;
  const h = 26;
  const w = tw + padX * 2;
  const x = cx - w / 2;
  const y = cy - h / 2;
  drawRoundedRect(ctx, x, y, w, h, 3);
  ctx.fillStyle = bg;
  ctx.fill();
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 0.5);
  ctx.restore();
  return { x, y, w, h };
}

export function mountHeroCanvas({ mainCanvas, mirrorCanvas, getState, onUpdate }) {
  const ctx = mainCanvas.getContext("2d");
  const mctx = mirrorCanvas ? mirrorCanvas.getContext("2d") : null;

  // 平滑动画插值状态 + 尺寸缓存（避免每帧 getBoundingClientRect 触发回流）
  let displayBalance = getState().balance;
  let introProgress = 0;
  let hitZones = []; // 画布内可点击的纠错标牌矩形
  let frameRect = { x: 0, y: 0, w: 0, h: 0 };
  let mainSize = { w: 0, h: 0, dpr: 1 };
  let mirrorSize = { w: 0, h: 0, dpr: 1 };
  let lastMirrorKey = "";

  function measureCanvas(c) {
    if (!c) return { w: 0, h: 0, dpr: 1 };
    const r = c.getBoundingClientRect();
    // 手机窄屏像素比上限 1.5（GUIDE.md 性能指引），桌面保持 2×
    const dpr = pixelRatio(window.innerWidth <= 600 ? 1.5 : 2);
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (c.width !== pw || c.height !== ph) {
      c.width = pw;
      c.height = ph;
    }
    return { w, h, dpr };
  }

  function syncSizes() {
    mainSize = measureCanvas(mainCanvas);
    mirrorSize = measureCanvas(mirrorCanvas);
    lastMirrorKey = "";
  }
  syncSizes();

  // ---------- 绘制中央主舞台（鲁宾双关 / 负空间字标 / 图文海报） ----------
  function renderMain(t, dt, { still }) {
    if (mainSize.w < 20 || mainSize.h < 20) syncSizes();
    const { w, h, dpr } = mainSize;
    if (w < 20 || h < 20) return;

    const state = getState();
    const ev = evaluate(state);
    const colors = ev.colors;

    // 动画步进（still 时直接落到终点，保证 reduced-motion 完整呈现）
    if (still) {
      displayBalance = state.balance;
      introProgress = 1;
    } else {
      introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 2.4);
      displayBalance += (state.balance - displayBalance) * Math.min(1, Math.max(dt, 0.016) * 16);
      if (Math.abs(displayBalance - state.balance) < 0.0008) displayBalance = state.balance;
    }

    const animState = { ...state, balance: displayBalance };
    const animGeom = computeGeometry(animState);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // 外围暖象牙纸面衬底
    ctx.fillStyle = POSTER_COLORS.paper;
    ctx.fillRect(0, 0, w, h);

    // 极克制的版画刻度边线（只在四角落极细角标，不喧宾夺主）
    const padX = Math.max(16, Math.round(w * 0.055));
    const padTop = Math.max(14, Math.round(h * 0.055));
    const padBot = Math.max(30, Math.round(h * 0.095));
    const fx = padX;
    const fy = padTop;
    const fw = w - padX * 2;
    const fh = h - padTop - padBot;
    frameRect = { x: fx, y: fy, w: fw, h: fh };
    hitZones = [];

    // 画面本体容器背景（外侧色）
    ctx.save();
    ctx.fillStyle = colors.outer;
    ctx.fillRect(fx, fy, fw, fh);

    // 如果有背景噪纹，铺在外侧区域上
    if (state.noise > 0) {
      const noiseInk = colors.outerIsDark ? "#FEF9F3" : "#0E2044";
      drawDiagonalNoise(ctx, fx, fy, fw, fh, state.noise, noiseInk);
    }

    // 依三大题材分别绘制正负共享边界
    if (state.scene === "rubin") {
      drawRubinScene(ctx, fx, fy, fw, fh, animState, colors, t, still);
    } else if (state.scene === "wordmark") {
      drawWordmarkScene(ctx, fx, fy, fw, fh, animState, colors, t, still);
    } else {
      drawPosterScene(ctx, fx, fy, fw, fh, animState, colors, t, still);
    }

    // 外框状态：闭合完整 vs 破缺泄气
    if (state.frameOpen) {
      // 上下中段故意留出破缺白条，模拟浅区漏入纸底
      ctx.fillStyle = POSTER_COLORS.paper;
      const cutW = fw * 0.56;
      const cutH = Math.max(10, fh * 0.042);
      ctx.fillRect(fx + (fw - cutW) / 2, fy - 1, cutW, cutH);
      ctx.fillRect(fx + (fw - cutW) / 2, fy + fh - cutH + 1, cutW, cutH);

      // 红虚线警示外框破口
      ctx.strokeStyle = POSTER_COLORS.orange;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(fx + (fw - cutW) / 2, fy + 1, cutW, cutH - 1);
      ctx.strokeRect(fx + (fw - cutW) / 2, fy + fh - cutH, cutW, cutH - 1);
      ctx.setLineDash([]);
    } else {
      // 严丝合缝的锐利外框线
      ctx.strokeStyle = colors.outerIsDark ? "#0A0A0A" : "#0E2044";
      ctx.lineWidth = 2;
      ctx.strokeRect(fx, fy, fw, fh);
    }
    ctx.restore();

    // 画布顶部外侧微注：实时面积比与归属侧（位于画框外底沿，绝不挡主体！）
    const barY = fy + fh + Math.min(18, padBot * 0.56);
    ctx.font = '600 11.5px "JetBrains Mono", "Noto Sans SC", monospace';
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#1B2333";
    ctx.textAlign = "left";
    const leftLabel =
      state.scene === "rubin"
        ? `花瓶 ${animGeom.innerPct}%  ·  侧影 ${animGeom.outerPct}%`
        : state.scene === "wordmark"
          ? `负形槽 ${animGeom.innerPct}%  ·  正形 ${animGeom.outerPct}%`
          : `前景 ${animGeom.innerPct}%  ·  背景 ${animGeom.outerPct}%`;
    ctx.fillText(leftLabel, fx, barY);

    ctx.textAlign = "right";
    ctx.fillStyle = ev.checks.contrastOk ? POSTER_COLORS.green : POSTER_COLORS.orangeText;
    ctx.fillText(`WCAG ${colors.ratio.toFixed(1)}:1`, fx + fw, barY);

    // 可直接点击的画布纠错标牌（错态时出现，点一下立刻修！）
    const narrow = fw < 360;
    if (state.noise > 0) {
      const noiseTxt = narrow ? "× 噪底 · 点清" : "× 斜纹噪底 · 点此清净";
      const box = drawPillTag(
        ctx,
        fx + (narrow ? 66 : Math.min(fw * 0.24, 118)),
        fy + 26,
        noiseTxt,
        "#FEF9F3",
        POSTER_COLORS.red,
        POSTER_COLORS.red
      );
      hitZones.push({ ...box, action: "clearNoise" });
    }
    if (state.frameOpen) {
      const box = drawPillTag(
        ctx,
        fx + fw * 0.5,
        fy + fh - 26,
        narrow ? "× 外框破缺 · 闭合" : "× 外框破缺 · 点此闭合",
        "#FEF9F3",
        POSTER_COLORS.red,
        POSTER_COLORS.red
      );
      hitZones.push({ ...box, action: "closeFrame" });
    }

    // 底部中央低调横拖导引胶囊（位于画框内部下偏一点，但避开破缺标）
    const dragY = state.frameOpen ? fy + fh - 58 : fy + fh - 26;
    drawPillTag(
      ctx,
      fx + fw * 0.5,
      dragY,
      state.scene === "rubin"
        ? (narrow ? `↔ 横拖推边界 · ${animGeom.innerPct}%` : `↔ 横拖推共享边界 · 占比 ${animGeom.innerPct}%`)
        : state.scene === "wordmark"
          ? `↔ 横拖调负形字距 · 通道 ${animGeom.innerPct}%`
          : `↔ 横拖调前景体量 · 占比 ${animGeom.innerPct}%`,
      "rgba(10, 23, 51, 0.88)",
      "#FEF9F3",
      "rgba(254, 249, 243, 0.35)"
    );

    ctx.restore();

    // 同步重绘右侧 1:1 原海报双嵌套方框反演镜（仅在状态或尺寸变化时重绘，省 CPU！）
    if (mctx) {
      const mKey = `${animState.balance.toFixed(3)}|${animState.contrast}|${animState.noise}|${animState.inverted}|${animState.palette}|${mirrorSize.w}x${mirrorSize.h}`;
      if (mKey !== lastMirrorKey) {
        lastMirrorKey = mKey;
        renderMirror(animState, colors, ev, animGeom);
      }
    }
  }

  // ---------- 题材 1：1:1 原海报鲁宾花瓶 / 双侧影剪影 ----------
  function drawRubinScene(ctx, fx, fy, fw, fh, state, colors, t, still) {
    const pts = sampleRubinProfile(state.balance, 76);
    const cx = fx + fw / 2;

    // 构造闭合的中央花瓶多边形（左右严格对称的纯侧影轮廓）
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const px = cx - pts[i].halfW * fw;
      const py = fy + pts[i].y * fh;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const px = cx + pts[i].halfW * fw;
      const py = fy + pts[i].y * fh;
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = colors.inner;
    ctx.fill();

    // 若反相极性且有噪纹，噪纹应落在「背景」一侧（保证视觉逻辑统一）
    if (state.noise > 0 && state.inverted) {
      ctx.save();
      ctx.clip();
      const noiseInk = colors.outerIsDark ? "#0E2044" : "#FEF9F3";
      drawDiagonalNoise(ctx, fx, fy, fw, fh, state.noise, noiseInk);
      ctx.restore();
    }

    // 共享轮廓线上的「边界归属法线短针（Border Ownership Ticks）」——全部合并为单次 stroke()
    if (state.showNormals) {
      const pulse = still ? 1 : 0.72 + 0.28 * Math.sin(t * 3.1);
      const dir = state.focusSide === "center" ? 1 : -1;
      ctx.strokeStyle = POSTER_COLORS.orange;
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = 0.85 * pulse;

      const endIdx = Math.max(2, Math.floor(pts.length * introProgress));
      ctx.beginPath();
      for (const side of [-1, 1]) {
        for (let i = 0; i < endIdx; i++) {
          const px = cx + side * pts[i].halfW * fw;
          const py = fy + pts[i].y * fh;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        for (let i = 6; i < endIdx - 4; i += 8) {
          const pPrev = pts[i - 1];
          const pNext = pts[i + 1];
          const dx = side * (pNext.halfW - pPrev.halfW) * fw;
          const dy = (pNext.y - pPrev.y) * fh;
          const len = Math.hypot(dx, dy) || 1;
          let nx = -dy / len;
          let ny = dx / len;
          if (nx * -side < 0) {
            nx = -nx;
            ny = -ny;
          }
          const px = cx + side * pts[i].halfW * fw;
          const py = fy + pts[i].y * fh;
          const tick = 9 * dir;
          ctx.moveTo(px, py);
          ctx.lineTo(px + nx * tick, py + ny * tick);
        }
      }
      ctx.stroke();
    }

    // 角落轻巧标注当前注视归属（点另一侧即刻翻转）
    const narrow = fw < 360;
    const focusText = narrow
      ? (state.focusSide === "center" ? "● 归属：花瓶" : "● 归属：侧影")
      : (state.focusSide === "center" ? "● 边界归属：中央花瓶" : "● 边界归属：两侧侧影");
    ctx.globalAlpha = 1;
    drawPillTag(
      ctx,
      fx + fw - (narrow ? 62 : Math.min(fw * 0.23, 94)),
      fy + 26,
      focusText,
      POSTER_COLORS.orange,
      "#FEF9F3",
      null
    );

    ctx.restore();
  }

  // ---------- 题材 2：品牌负空间字标（几何 F → X 隐藏箭头） ----------
  function drawWordmarkScene(ctx, fx, fy, fw, fh, state, colors, t, still) {
    // 负空间字标背景为外侧色，大字母块用内侧色（或反相），中间缝隙构成向右箭头
    ctx.save();
    const bgCol = colors.outer;
    const fgCol = colors.inner;

    // 重填外底
    ctx.fillStyle = bgCol;
    ctx.fillRect(fx, fy, fw, fh);
    if (state.noise > 0) {
      drawDiagonalNoise(ctx, fx, fy, fw, fh, state.noise, colors.outerIsDark ? "#FEF9F3" : "#0E2044");
    }

    const cx = fx + fw / 2;
    const cy = fy + fh / 2 - 4;
    const glyphH = Math.min(fh * 0.56, fw * 0.34);
    const stroke = glyphH * 0.24;
    // balance 决定左右两个几何字形（左 E 形结构 + 右 X/楔形结构）的夹缝距离
    // balance = 0.46 时两字恰好严丝合缝夹出一支标准向右箭头！
    const gapOffset = (state.balance - 0.46) * fw * 0.38;
    const arrowLen = glyphH * 0.52;
    const arrowHead = glyphH * 0.26;

    // 左侧大几何字「E」（右上与右下横臂与中间短臂，正好围出箭头柄！）
    const eRight = cx - arrowHead * 0.08 - gapOffset;
    const eW = glyphH * 0.68;
    const eLeft = eRight - eW;
    const eTop = cy - glyphH / 2;

    ctx.fillStyle = fgCol;
    // 竖干
    ctx.fillRect(eLeft, eTop, stroke, glyphH);
    // 顶横
    ctx.fillRect(eLeft, eTop, eW, stroke);
    // 底横
    ctx.fillRect(eLeft, eTop + glyphH - stroke, eW, stroke);
    // 中横（留出右端缺口与箭头尾部契合）
    ctx.fillRect(eLeft, cy - stroke * 0.46, eW * 0.82, stroke * 0.92);

    // 右侧几何契合块（类似小写 x 的左侧 V 槽，与 E 的上下两臂恰好夹出尖锐向右箭头！）
    const xLeft = cx - arrowHead * 0.06 + gapOffset;
    const xW = glyphH * 0.64;
    const xTop = cy - glyphH * 0.36;
    const xBot = cy + glyphH * 0.36;
    // 上下两道厚斜臂拼出 X，左侧形成向左凹的三角尖槽 -> 与 E 围成向右的白色/深色箭头！
    ctx.beginPath();
    ctx.moveTo(xLeft, xTop);
    ctx.lineTo(xLeft + stroke * 1.15, xTop);
    ctx.lineTo(xLeft + xW, xBot);
    ctx.lineTo(xLeft + xW - stroke * 1.15, xBot);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(xLeft + xW - stroke * 1.15, xTop);
    ctx.lineTo(xLeft + xW, xTop);
    ctx.lineTo(xLeft + stroke * 1.15, xBot);
    ctx.lineTo(xLeft, xBot);
    ctx.closePath();
    ctx.fill();

    // 当注视侧切到「隐藏箭头」或法线开启且箭头清晰时，在负空间箭头轮廓上给一圈柔和朱橘标示
    if (state.showNormals && state.focusSide === "center") {
      const pulse = still ? 1 : 0.65 + 0.35 * Math.sin(t * 3.2);
      const ax0 = eRight - eW * 0.18;
      const ax1 = xLeft + stroke * 0.56;
      const midGap = (ax1 - ax0);
      if (midGap > 14 && midGap < glyphH * 0.8) {
        ctx.strokeStyle = POSTER_COLORS.orange;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.globalAlpha = 0.9 * pulse;
        ctx.beginPath();
        // 箭头轮廓（位于 E 的上下两臂与 X 左槽之间）
        const shaftH = glyphH * 0.14;
        const headH = glyphH * 0.32;
        const headBaseX = xLeft + stroke * 0.04;
        const tipX = xLeft + stroke * 0.58;
        ctx.moveTo(ax0, cy - shaftH);
        ctx.lineTo(headBaseX, cy - shaftH);
        ctx.lineTo(headBaseX, cy - headH);
        ctx.lineTo(tipX, cy);
        ctx.lineTo(headBaseX, cy + headH);
        ctx.lineTo(headBaseX, cy + shaftH);
        ctx.lineTo(ax0, cy + shaftH);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 底部极简说明标牌
    const fitOk = state.balance >= 0.34 && state.balance <= 0.58;
    drawPillTag(
      ctx,
      fx + fw - Math.min(fw * 0.24, 98),
      fy + 26,
      fitOk ? "● 负形箭头：已咬合" : state.balance < 0.34 ? "● 负形箭头：被挤扁" : "● 负形箭头：已散裂",
      fitOk ? POSTER_COLORS.green : POSTER_COLORS.orange,
      "#FEF9F3",
      null
    );

    ctx.restore();
  }

  // ---------- 题材 3：图文海报图底分离 ----------
  function drawPosterScene(ctx, fx, fy, fw, fh, state, colors, t, still) {
    ctx.save();
    // 外层是整张海报背景（colors.outer），中间是主体版块（colors.inner）
    const areaFrac = clamp(state.balance, 0.12, 0.85);
    const sideRatio = Math.sqrt(areaFrac);
    const bw = fw * Math.min(1.02, sideRatio * 1.08);
    const bh = fh * Math.min(1.02, sideRatio * 0.94);
    const bx = fx + (fw - bw) / 2;
    const by = fy + (fh - bh) / 2 - 4;

    ctx.fillStyle = colors.inner;
    ctx.fillRect(bx, by, bw, bh);

    // 主体版块内排简洁海报文字（文字色取外底色，保持高对比演示）
    const textCol = colors.outer;
    ctx.fillStyle = textCol;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const titleSize = clamp(Math.round(Math.min(bw * 0.16, bh * 0.22)), 14, 34);
    ctx.font = `900 ${titleSize}px "Noto Sans SC", sans-serif`;
    ctx.fillText("秋季设计展", bx + bw / 2, by + bh * 0.42);

    ctx.font = `600 ${Math.max(10, Math.round(titleSize * 0.42))}px "Syne", sans-serif`;
    ctx.fillText("AUTUMN FORM · 11.25", bx + bw / 2, by + bh * 0.66);

    // 若撑破画框（>66%），画朱橘警示角标指出「留白被切碎、底反成图」
    if (areaFrac > 0.66) {
      ctx.strokeStyle = POSTER_COLORS.orange;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(bx + 2, by + 2, bw - 4, bh - 4);
      ctx.setLineDash([]);
    }

    // 边界归属微针
    if (state.showNormals) {
      const pulse = still ? 1 : 0.7 + 0.3 * Math.sin(t * 3.0);
      const dir = state.focusSide === "center" ? 1 : -1;
      ctx.strokeStyle = POSTER_COLORS.orange;
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = 0.85 * pulse;
      for (let i = 1; i <= 5; i++) {
        const rx = bx + (bw * i) / 6;
        // 上边
        ctx.beginPath();
        ctx.moveTo(rx, by);
        ctx.lineTo(rx, by + 8 * dir);
        ctx.stroke();
        // 下边
        ctx.beginPath();
        ctx.moveTo(rx, by + bh);
        ctx.lineTo(rx, by + bh - 8 * dir);
        ctx.stroke();
      }
    }

    const tagText =
      areaFrac >= 0.44 && areaFrac <= 0.56
        ? "● 面积 50:50 僵持"
        : areaFrac > 0.66
          ? "● 撑破外框 · 底反成图"
          : "● 主体被纯底完整包围";
    ctx.globalAlpha = 1;
    drawPillTag(
      ctx,
      fx + fw - Math.min(fw * 0.25, 102),
      fy + 26,
      tagText,
      areaFrac >= 0.44 && areaFrac <= 0.56 || areaFrac > 0.66 ? POSTER_COLORS.orange : POSTER_COLORS.green,
      "#FEF9F3",
      null
    );

    ctx.restore();
  }

  // ---------- 右侧 1:1 复刻原海报下方「双嵌套方框图底互换镜」 ----------
  function renderMirror(state, colors, ev, geom) {
    const { w, h, dpr } = mirrorSize;
    if (w < 20 || h < 20) return;

    mctx.save();
    mctx.scale(dpr, dpr);
    mctx.clearRect(0, 0, w, h);

    mctx.fillStyle = POSTER_COLORS.paper;
    mctx.fillRect(0, 0, w, h);

    const padX = 14;
    const boxSize = Math.min(Math.floor((w - padX * 2 - 42) / 2), Math.floor(h - 56));
    const cy = Math.floor(h / 2) + 2;
    const leftX = Math.floor(w / 2 - 21 - boxSize);
    const rightX = Math.floor(w / 2 + 21);
    const topY = Math.floor(cy - boxSize / 2);

    // 内方大小随当前 balance 同步变化（展示「同一形状在不同图底组织下的分量」）
    const innerFrac = clamp(Math.sqrt(clamp(state.balance, 0.16, 0.78)), 0.38, 0.84);
    const innerS = Math.round(boxSize * innerFrac);
    const innerOff = Math.round((boxSize - innerS) / 2);

    // 左方框：原海报左框（外深内浅，若 inverted 则高亮右边）
    mctx.fillStyle = colors.darkCol;
    mctx.fillRect(leftX, topY, boxSize, boxSize);
    if (state.noise > 0) drawDiagonalNoise(mctx, leftX, topY, boxSize, boxSize, state.noise, "#FEF9F3");
    mctx.fillStyle = colors.lightCol;
    mctx.fillRect(leftX + innerOff, topY + innerOff, innerS, innerS);

    // 右方框：原海报右框（外浅内深）
    mctx.fillStyle = colors.lightCol;
    mctx.fillRect(rightX, topY, boxSize, boxSize);
    if (state.noise > 0) drawDiagonalNoise(mctx, rightX, topY, boxSize, boxSize, state.noise, "#0E2044");
    mctx.fillStyle = colors.darkCol;
    mctx.fillRect(rightX + innerOff, topY + innerOff, innerS, innerS);

    // 标出当前主舞台所处的极性（用清晰朱橘角框点明，不遮主体）
    const activeX = state.inverted ? rightX : leftX;
    mctx.strokeStyle = POSTER_COLORS.orange;
    mctx.lineWidth = 2.5;
    mctx.strokeRect(activeX - 3, topY - 3, boxSize + 6, boxSize + 6);

    // 中央 1:1 原海报朱橘色双向互换箭头
    const midX = w / 2;
    mctx.fillStyle = POSTER_COLORS.orange;
    mctx.beginPath();
    mctx.moveTo(midX - 15, cy);
    mctx.lineTo(midX - 6, cy - 7);
    mctx.lineTo(midX - 6, cy - 3);
    mctx.lineTo(midX + 6, cy - 3);
    mctx.lineTo(midX + 6, cy - 7);
    mctx.lineTo(midX + 15, cy);
    mctx.lineTo(midX + 6, cy + 7);
    mctx.lineTo(midX + 6, cy + 3);
    mctx.lineTo(midX - 6, cy + 3);
    mctx.lineTo(midX - 6, cy + 7);
    mctx.closePath();
    mctx.fill();

    // 上下两条 1:1 原海报虚线回环箭头
    mctx.strokeStyle = "#141A26";
    mctx.lineWidth = 1.4;
    mctx.setLineDash([4, 3]);
    const lcX = leftX + boxSize / 2;
    const rcX = rightX + boxSize / 2;
    // 上回环
    const topArcY = Math.max(10, topY - 14);
    mctx.beginPath();
    mctx.moveTo(lcX, topY - 4);
    mctx.lineTo(lcX, topArcY);
    mctx.lineTo(rcX, topArcY);
    mctx.lineTo(rcX, topY - 4);
    mctx.stroke();
    // 下回环
    const botArcY = Math.min(h - 10, topY + boxSize + 14);
    mctx.beginPath();
    mctx.moveTo(lcX, topY + boxSize + 4);
    mctx.lineTo(lcX, botArcY);
    mctx.lineTo(rcX, botArcY);
    mctx.lineTo(rcX, topY + boxSize + 4);
    mctx.stroke();
    mctx.setLineDash([]);

    // 箭头小三角
    mctx.fillStyle = "#141A26";
    // 上右指向下
    mctx.beginPath();
    mctx.moveTo(rcX, topY - 3);
    mctx.lineTo(rcX - 4, topY - 9);
    mctx.lineTo(rcX + 4, topY - 9);
    mctx.closePath();
    mctx.fill();
    // 下左指向上
    mctx.beginPath();
    mctx.moveTo(lcX, topY + boxSize + 3);
    mctx.lineTo(lcX - 4, topY + boxSize + 9);
    mctx.lineTo(lcX + 4, topY + boxSize + 9);
    mctx.closePath();
    mctx.fill();

    mctx.restore();
  }

  // ---------- 启动帧循环（自动视口暂停 & 节能） ----------
  const ctrl = loop(mainCanvas, renderMain);

  // ---------- 鼠标、触摸与键盘交互（绝不劫持竖屏页面滚动！） ----------
  let dragging = false;
  let dragMoved = false;
  let startX = 0;
  let startY = 0;
  let startBalance = 0;
  let lockAxis = null; // "h" | "v" | null

  function canvasCoords(clientX, clientY) {
    const r = mainCanvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top, w: r.width, h: r.height };
  }

  function applyDelta(dx, width) {
    const scale = 1.05 / Math.max(180, width);
    let next = clamp(startBalance + dx * scale, 0.15, 0.80);
    // 靠近理想平衡带中心（0.43 双关 / 0.28 清晰主从）轻微柔吸
    const st = getState();
    const target = st.goal === "reversible" ? (st.scene === "wordmark" ? 0.46 : 0.43) : 0.28;
    if (Math.abs(next - target) < 0.015) next = target;
    onUpdate({ balance: Number(next.toFixed(3)) });
  }

  function handleTap(cx, cy) {
    // 1. 先检查是否点中画布内朱橘错态标牌
    for (const hz of hitZones) {
      if (cx >= hz.x - 4 && cx <= hz.x + hz.w + 4 && cy >= hz.y - 4 && cy <= hz.y + hz.h + 4) {
        if (hz.action === "clearNoise") {
          onUpdate({ noise: 0 });
          return;
        }
        if (hz.action === "closeFrame") {
          onUpdate({ frameOpen: false });
          return;
        }
      }
    }
    // 2. 否则根据点中中央还是两侧，直接切换边界归属注视侧！
    const st = getState();
    const relX = (cx - frameRect.x) / Math.max(1, frameRect.w);
    const relY = (cy - frameRect.y) / Math.max(1, frameRect.h);
    if (relX >= 0 && relX <= 1 && relY >= 0 && relY <= 1) {
      let clickedCenter = false;
      if (st.scene === "rubin") {
        const pts = sampleRubinProfile(st.balance, 48);
        const idx = clamp(Math.round(relY * (pts.length - 1)), 0, pts.length - 1);
        clickedCenter = Math.abs(relX - 0.5) <= pts[idx].halfW;
      } else {
        clickedCenter = Math.abs(relX - 0.5) < 0.25;
      }
      const nextSide = clickedCenter ? "center" : "outer";
      // 如果重复点同一侧，也允许来回切换，让点击永远有明确反馈
      onUpdate({ focusSide: nextSide === st.focusSide ? (st.focusSide === "center" ? "outer" : "center") : nextSide });
    }
  }

  // Mouse
  mainCanvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    dragging = true;
    dragMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    startBalance = getState().balance;
    mainCanvas.classList.add("is-dragging");
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) dragMoved = true;
    if (dragMoved) {
      applyDelta(dx, mainSize.w || 360);
    }
  });
  window.addEventListener("mouseup", (e) => {
    if (!dragging) return;
    dragging = false;
    mainCanvas.classList.remove("is-dragging");
    if (!dragMoved) {
      const p = canvasCoords(e.clientX, e.clientY);
      handleTap(p.x, p.y);
    }
  });

  // Touch（仅水平拖动接管，垂直滑动放行给页面滚动！）
  mainCanvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const t0 = e.touches[0];
      dragging = true;
      dragMoved = false;
      lockAxis = null;
      startX = t0.clientX;
      startY = t0.clientY;
      startBalance = getState().balance;
    },
    { passive: true }
  );
  mainCanvas.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging || e.touches.length !== 1) return;
      const t0 = e.touches[0];
      const dx = t0.clientX - startX;
      const dy = t0.clientY - startY;
      if (!lockAxis && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        lockAxis = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
      }
      if (lockAxis === "h") {
        e.preventDefault();
        dragMoved = true;
        applyDelta(dx, mainSize.w || 340);
      }
    },
    { passive: false }
  );
  mainCanvas.addEventListener("touchend", (e) => {
    if (!dragging) return;
    dragging = false;
    if (!dragMoved && e.changedTouches.length) {
      const t0 = e.changedTouches[0];
      const p = canvasCoords(t0.clientX, t0.clientY);
      handleTap(p.x, p.y);
    }
    lockAxis = null;
  });

  // 键盘操作（画布 tabindex="0"）
  mainCanvas.addEventListener("keydown", (e) => {
    const st = getState();
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onUpdate({ balance: Number(clamp(st.balance - 0.03, 0.15, 0.80).toFixed(3)) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onUpdate({ balance: Number(clamp(st.balance + 0.03, 0.15, 0.80).toFixed(3)) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onUpdate({ contrast: clamp(st.contrast + 8, 0, 100) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onUpdate({ contrast: clamp(st.contrast - 8, 0, 100) });
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onUpdate({ inverted: !st.inverted });
    }
  });

  // 右侧原海报双嵌套方框反演镜点击即翻转极性！
  if (mirrorCanvas) {
    mirrorCanvas.addEventListener("click", () => {
      onUpdate({ inverted: !getState().inverted });
    });
  }

  // 监听尺寸变化更新缓存并重绘
  const ro = new ResizeObserver(() => {
    syncSizes();
    ctrl.draw();
  });
  ro.observe(mainCanvas);
  if (mirrorCanvas) ro.observe(mirrorCanvas);

  return {
    draw: () => ctrl.draw(),
  };
}

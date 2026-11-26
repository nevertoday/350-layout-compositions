// 339 比较幻灯片版式 — 开场 2D Canvas 交互放映台
// 1:1 承袭 339 原海报：蓝方案A / 黑VS / 绿方案B、蓝圆与绿方、三行虚线视线匹配轴、底部鼠尾草共性带。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { computeLayout, clamp, PALETTE } from "./model.js";

function drawIcon(ctx, type, cx, cy, r, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, r * 0.16);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (type === "bolt") {
    ctx.beginPath();
    ctx.moveTo(r * 0.14, -r * 0.62);
    ctx.lineTo(-r * 0.42, r * 0.08);
    ctx.lineTo(r * 0.04, r * 0.08);
    ctx.lineTo(-r * 0.16, r * 0.62);
    ctx.lineTo(r * 0.44, -r * 0.1);
    ctx.lineTo(-r * 0.02, -r * 0.1);
    ctx.closePath();
    ctx.fill();
  } else if (type === "bars") {
    const bw = r * 0.22;
    const gap = r * 0.13;
    const hs = [r * 0.42, r * 0.72, r * 1.0];
    const startX = -((bw * 3 + gap * 2) / 2);
    const baseY = r * 0.5;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(startX + i * (bw + gap), baseY - hs[i], bw, hs[i]);
    }
  } else if (type === "check") {
    ctx.lineWidth = Math.max(2, r * 0.22);
    ctx.beginPath();
    ctx.moveTo(-r * 0.44, r * 0.04);
    ctx.lineTo(-r * 0.1, r * 0.38);
    ctx.lineTo(r * 0.46, -r * 0.34);
    ctx.stroke();
  } else if (type === "star") {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? r * 0.6 : r * 0.27;
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (type === "rings") {
    // 精密刻度圆环图标（细节控制强）
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.34, Math.sin(a) * r * 0.34);
      ctx.lineTo(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66);
      ctx.stroke();
    }
  } else if (type === "diamond") {
    ctx.beginPath();
    ctx.moveTo(-r * 0.34, -r * 0.42);
    ctx.lineTo(r * 0.34, -r * 0.42);
    ctx.lineTo(r * 0.56, -r * 0.08);
    ctx.lineTo(0, r * 0.54);
    ctx.lineTo(-r * 0.56, -r * 0.08);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.54, -r * 0.08);
    ctx.lineTo(r * 0.54, -r * 0.08);
    ctx.moveTo(-r * 0.22, -r * 0.42);
    ctx.lineTo(0, r * 0.52);
    ctx.lineTo(r * 0.22, -r * 0.42);
    ctx.stroke();
  }
  ctx.restore();
}

function fitText(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let s = text;
  while (s.length > 2 && ctx.measureText(s + "…").width > maxW) s = s.slice(0, -1);
  return s + "…";
}

function inRect(px, py, r, pad = 0) {
  return px >= r.x - pad && px <= r.x + r.w + pad && py >= r.y - pad && py <= r.y + r.h + pad;
}

export function mountHeroCanvas(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  let W = 800;
  let H = 500;
  let dpr = pixelRatio(2);
  let lastLayout = computeLayout(state, W, H);

  // 动效状态：轻量开场进入 + 空格演练视线扫描
  let intro = reducedMotion.matches ? 1 : 0;
  let scan = { active: false, t: 0, dur: 2.8 };
  let hoverTarget = null;
  let dirty = true;

  // 交互手势追踪
  let pointer = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    W = Math.round(rect.width);
    H = Math.round(rect.height);
    dpr = pixelRatio(2);
    const cw = Math.round(W * dpr);
    const ch = Math.round(H * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    lastLayout = computeLayout(state, W, H);
    dirty = true;
  }

  function startScan() {
    if (reducedMotion.matches) {
      scan.active = true;
      scan.t = scan.dur * 0.52;
      dirty = true;
      ctl.draw();
      return;
    }
    scan.active = true;
    scan.t = 0;
    dirty = true;
    ctl.draw();
  }

  function render(t, dt, { still }) {
    if (still) {
      intro = 1;
      if (scan.active && scan.t >= scan.dur) scan.active = false;
    } else {
      if (intro < 1) {
        intro = Math.min(1, intro + Math.max(dt, 0.016) * 2.2);
        dirty = true;
      }
      if (scan.active) {
        scan.t += Math.max(dt, 0.016);
        if (scan.t >= scan.dur) {
          scan.active = false;
          scan.t = 0;
        }
        dirty = true;
      }
    }

    if (!dirty && !still) return;
    dirty = false;

    const L = (lastLayout = computeLayout(state, W, H));
    const { compact, shortH, coding, deck, audit } = L;
    const ease = 1 - Math.pow(1 - intro, 3);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 暖羊皮原纸底 + 细微坐标网格标尺（仅开启辅助标尺时显现）
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, W, H);

    if (state.showGuides) {
      ctx.save();
      ctx.strokeStyle = "rgba(10, 10, 8, 0.055)";
      ctx.lineWidth = 1;
      // 垂直中心参考线
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(L.cx + 0.5, 6);
      ctx.lineTo(L.cx + 0.5, H - 6);
      ctx.stroke();
      // 3 条理想水平基线
      for (const lr of L.leftRows) {
        ctx.beginPath();
        ctx.moveTo(L.padX, Math.round(lr.cy) + 0.5);
        ctx.lineTo(W - L.padX, Math.round(lr.cy) + 0.5);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 图层高亮暗化辅助
    const dimIfNot = (layer) =>
      state.highlightLayer && state.highlightLayer !== layer ? 0.24 : 1;

    // 2. 顶部双阵营条（方案 A / 方案 B）
    ctx.save();
    ctx.globalAlpha = dimIfNot("diff");
    const slideOff = (1 - ease) * 18;
    // 方案 A 横幅
    ctx.fillStyle = coding.aBar;
    ctx.fillRect(L.barA.x - slideOff, L.barA.y, L.barA.w, L.barA.h);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${compact ? 17 : 23}px "Noto Sans SC", sans-serif`;
    ctx.fillText(deck.optA.badge, L.barA.x - slideOff + L.barA.w / 2, L.barA.y + L.barA.h * 0.4);
    ctx.font = `600 ${compact ? 10 : 11}px "Archivo", "IBM Plex Sans", sans-serif`;
    ctx.globalAlpha = dimIfNot("diff") * 0.92;
    ctx.fillText(deck.optA.badgeEn, L.barA.x - slideOff + L.barA.w / 2, L.barA.y + L.barA.h * 0.77);

    // 方案 B 横幅
    ctx.globalAlpha = dimIfNot("diff");
    ctx.fillStyle = coding.bBar;
    ctx.fillRect(L.barB.x + slideOff, L.barB.y, L.barB.w, L.barB.h);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `900 ${compact ? 17 : 23}px "Noto Sans SC", sans-serif`;
    ctx.fillText(deck.optB.badge, L.barB.x + slideOff + L.barB.w / 2, L.barB.y + L.barB.h * 0.4);
    ctx.font = `600 ${compact ? 10 : 11}px "Archivo", "IBM Plex Sans", sans-serif`;
    ctx.globalAlpha = dimIfNot("diff") * 0.92;
    ctx.fillText(deck.optB.badgeEn, L.barB.x + slideOff + L.barB.w / 2, L.barB.y + L.barB.h * 0.77);

    // 阵营编码警示徽标（同码或双红时直标在两形之间，绝不碰边）
    if (!coding.ok) {
      const warnTxt = compact || shortH
        ? state.coding === "clash"
          ? "× 双红抢戏·点换码"
          : "× 同码失码·点换码"
        : state.coding === "clash"
          ? "× 双红告警抢戏 · 点标牌换双码"
          : "× 同色同形失码 · 点此切蓝圆/绿方";
      ctx.font = `700 ${compact || shortH ? 9.5 : 11}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(warnTxt).width + (compact ? 10 : 14);
      const bx = L.cx - tw / 2;
      const by = L.shapeA.y - (compact || shortH ? 10 : 16);
      ctx.fillStyle = PALETTE.dangerSoft;
      ctx.fillRect(bx, by, tw, compact || shortH ? 18 : 20);
      ctx.strokeStyle = PALETTE.danger;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, tw - 1, (compact || shortH ? 18 : 20) - 1);
      ctx.fillStyle = PALETTE.danger;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(warnTxt, L.cx, by + (compact || shortH ? 9.5 : 10.5));
    }

    // 3. 蓝圆 vs 绿方双形符号（严格 1:1 等比，绝不变椭圆）
    const sr = L.shapeA.r * (0.82 + 0.18 * ease);
    ctx.globalAlpha = dimIfNot("diff");
    // 方案 A 图形
    ctx.fillStyle = coding.aFill;
    if (coding.aShape === "circle") {
      ctx.beginPath();
      ctx.arc(L.shapeA.x, L.shapeA.y, sr, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(L.shapeA.x - sr, L.shapeA.y - sr, sr * 2, sr * 2);
    }
    // 方案 B 图形
    if (coding.bShape === "circle") {
      ctx.fillStyle = coding.bFill;
      ctx.beginPath();
      ctx.arc(L.shapeB.x, L.shapeB.y, sr, 0, Math.PI * 2);
      ctx.fill();
    } else if (coding.bShape === "outlineSquare") {
      ctx.fillStyle = coding.bFill;
      ctx.fillRect(L.shapeB.x - sr + 2, L.shapeB.y - sr + 2, sr * 2 - 4, sr * 2 - 4);
      ctx.strokeStyle = coding.bStroke;
      ctx.lineWidth = compact ? 4 : 5;
      ctx.strokeRect(L.shapeB.x - sr + 2.5, L.shapeB.y - sr + 2.5, sr * 2 - 5, sr * 2 - 5);
    } else {
      ctx.fillStyle = coding.bFill;
      ctx.fillRect(L.shapeB.x - sr, L.shapeB.y - sr, sr * 2, sr * 2);
    }

    // 方案 A/B 副标与招牌彩短横线
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${compact ? 15 : 19}px "Noto Sans SC", sans-serif`;
    ctx.fillText(deck.optA.focus, L.subA.x, L.subA.y);
    ctx.fillText(deck.optB.focus, L.subB.x, L.subB.y);

    ctx.fillStyle = PALETTE.inkSoft;
    ctx.font = `600 ${shortH ? 8.5 : compact ? 9.5 : 10.5}px "IBM Plex Sans", sans-serif`;
    ctx.fillText(fitText(ctx, deck.optA.focusEn, L.barA.w), L.subA.x, L.subA.y + (shortH ? 11.5 : compact ? 14 : 17));
    ctx.fillText(fitText(ctx, deck.optB.focusEn, L.barB.w), L.subB.x, L.subB.y + (shortH ? 11.5 : compact ? 14 : 17));

    // 原海报副标下的蓝/绿短杠
    const ulW = compact ? 38 : 54;
    ctx.fillStyle = coding.aBar;
    ctx.fillRect(L.subA.x - ulW / 2, L.subA.underlineY, ulW, 3);
    ctx.fillStyle = coding.bBar;
    ctx.fillRect(L.subB.x - ulW / 2, L.subB.underlineY, ulW, 3);
    ctx.restore();

    // 4. 中央比较轴（VS 黑圆 + 贯通竖轴 + 底部箭头 / 粗墙错态 / 无轴提示）
    ctx.save();
    ctx.globalAlpha = dimIfNot("axis");
    const axisEnd = L.axis.y1 + (L.axis.y2 - L.axis.y1) * ease;
    if (state.axis === "none") {
      // 虚影残缺提示
      ctx.strokeStyle = "rgba(198, 47, 36, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(L.axis.x, L.axis.y1 + 6);
      ctx.lineTo(L.axis.x, axisEnd - 6);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (state.axis === "wall") {
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(L.axis.x - L.axis.thickness / 2, L.axis.y1, L.axis.thickness, axisEnd - L.axis.y1);
      // 粗墙警示斜纹
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1.5;
      for (let yy = L.axis.y1 + 8; yy < axisEnd - 4; yy += 14) {
        ctx.beginPath();
        ctx.moveTo(L.axis.x - L.axis.thickness / 2 + 2, yy);
        ctx.lineTo(L.axis.x + L.axis.thickness / 2 - 2, yy - 8);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = L.axis.thickness;
      if (state.axis === "dashed") ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(L.axis.x, L.axis.y1);
      ctx.lineTo(L.axis.x, axisEnd);
      ctx.stroke();
      ctx.setLineDash([]);
      // 向下箭头（原海报 1:1 复刻）
      const ah = 7;
      ctx.beginPath();
      ctx.moveTo(L.axis.x - ah, axisEnd - ah);
      ctx.lineTo(L.axis.x, axisEnd + 1);
      ctx.lineTo(L.axis.x + ah, axisEnd - ah);
      ctx.stroke();
    }

    // 中央黑圆 VS 徽章（可点击切换轴体）
    ctx.beginPath();
    ctx.arc(L.vs.x, L.vs.y, L.vs.r, 0, Math.PI * 2);
    ctx.fillStyle = state.axis === "none" ? "#E8DFD1" : PALETTE.ink;
    ctx.fill();
    if (state.axis === "none") {
      ctx.strokeStyle = PALETTE.danger;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = state.axis === "none" ? PALETTE.danger : "#FFFFFF";
    ctx.font = `800 ${compact ? 13 : 16}px "Archivo", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("VS", L.vs.x, L.vs.y + 1);
    ctx.restore();

    // 5. 水平视线匹配虚线 + 交叉警示 + 跳距标尺
    ctx.save();
    ctx.globalAlpha = dimIfNot("align");
    const axisHealthy = state.axis === "classic" || state.axis === "dashed";
    for (const lk of L.links) {
      const bad = !lk.horizontalOk || state.axis === "wall";
      ctx.strokeStyle = bad ? PALETTE.danger : "#5A5850";
      ctx.lineWidth = bad ? 1.8 : 1.3;
      ctx.setLineDash(bad ? [5, 4] : [3, 4]);
      ctx.beginPath();
      ctx.moveTo(lk.x1, lk.y1);
      ctx.lineTo(lk.x2, lk.y2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 轴上黑圆节点 ●（原海报标志母题）
      if (axisHealthy && lk.horizontalOk) {
        ctx.fillStyle = PALETTE.ink;
        ctx.beginPath();
        ctx.arc(L.axis.x, lk.y1, compact ? 4 : 4.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (axisHealthy && !lk.horizontalOk) {
        // 交在轴上的空心红圈
        const tAxis = (L.axis.x - lk.x1) / Math.max(1, lk.x2 - lk.x1);
        const yAtAxis = lk.y1 + (lk.y2 - lk.y1) * tAxis;
        ctx.fillStyle = PALETTE.paper;
        ctx.strokeStyle = PALETTE.danger;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(L.axis.x, yAtAxis, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // 交叉点红 × 标
    for (const pt of L.crossings) {
      ctx.fillStyle = PALETTE.danger;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(pt.x - 3, pt.y - 3);
      ctx.lineTo(pt.x + 3, pt.y + 3);
      ctx.moveTo(pt.x + 3, pt.y - 3);
      ctx.lineTo(pt.x - 3, pt.y + 3);
      ctx.stroke();
    }

    // 实测跳距 / 断谷 / 撞轴双箭标尺（标在行区上方空白带，绝不盖字）
    if (state.showGuides) {
      const dimY = L.rowsTop - (compact ? 9 : 12);
      const spanBad = !L.probes.axis.ok && state.axis !== "none" && state.axis !== "wall";
      const rulerColor = spanBad ? PALETTE.danger : "rgba(10,10,8,0.52)";
      const xStart = L.leftRows[0].anchorX;
      const xEnd = L.rightRows[0].anchorX;
      if (xEnd - xStart > 28) {
        ctx.strokeStyle = rulerColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xStart + 2, dimY);
        ctx.lineTo(xEnd - 2, dimY);
        ctx.moveTo(xStart + 2, dimY - 3);
        ctx.lineTo(xStart + 2, dimY + 3);
        ctx.moveTo(xEnd - 2, dimY - 3);
        ctx.lineTo(xEnd - 2, dimY + 3);
        ctx.stroke();
      }
      const spanTxt = `跳距 ${L.metrics.jumpPct}% · ${L.metrics.jumpPx}px`;
      ctx.font = `700 ${compact ? 10 : 10.5}px "Space Mono", "Noto Sans SC", monospace`;
      const sw = ctx.measureText(spanTxt).width + 10;
      ctx.fillStyle = spanBad ? PALETTE.dangerSoft : PALETTE.paper;
      ctx.fillRect(L.cx - sw / 2, dimY - 8, sw, 16);
      ctx.fillStyle = spanBad ? PALETTE.danger : PALETTE.inkSoft;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(spanTxt, L.cx, dimY + 0.5);
    }
    ctx.restore();

    // 6. 左右三行对比卡片（左侧锚定，右侧可上下拖换序 + 点击配对）
    const drawRowCard = (row, side) => {
      const isLeft = side === "left";
      const matchLink = L.links.find((lk) => lk.dimIdx === row.itemIdx);
      const isMismatch = matchLink && !matchLink.horizontalOk;
      const isHovered = hoverTarget && hoverTarget.type === "rowB" && hoverTarget.slot === row.slot;
      const iconR = shortH ? 10 : compact ? 11 : 16;

      ctx.save();
      if (row.isDragging) {
        ctx.shadowColor = "rgba(10, 10, 8, 0.22)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;
      }

      // 卡片轻量纸面背景（拖动、悬停或错位时显边界提示）
      ctx.fillStyle = row.isDragging
        ? "#FFFDF8"
        : isMismatch
          ? "rgba(251, 233, 231, 0.72)"
          : isHovered
            ? "rgba(255, 253, 248, 0.88)"
            : "rgba(251, 247, 240, 0.78)";
      ctx.fillRect(row.x, row.y, row.w, row.h);

      ctx.strokeStyle = row.isDragging
        ? PALETTE.ink
        : isMismatch
          ? PALETTE.danger
          : isHovered
            ? coding.bBar
            : "rgba(10, 10, 8, 0.14)";
      ctx.lineWidth = row.isDragging ? 2 : isMismatch ? 1.3 : 1;
      if (isMismatch && !row.isDragging) ctx.setLineDash([4, 3]);
      ctx.strokeRect(row.x + 0.5, row.y + 0.5, row.w - 1, row.h - 1);
      ctx.setLineDash([]);
      ctx.shadowColor = "transparent";

      // 圆形图标徽章
      const icx = row.x + (shortH || compact ? 14 : 22);
      const icy = row.cy;
      const badgeColor = isLeft ? coding.aBar : coding.bBar;
      ctx.fillStyle = badgeColor;
      ctx.beginPath();
      ctx.arc(icx, icy, iconR, 0, Math.PI * 2);
      ctx.fill();
      drawIcon(ctx, row.item.icon, icx, icy, iconR, "#FFFFFF");

      // 主标题 + 英文副标
      const tx = icx + iconR + (shortH || compact ? 5 : 10);
      const gripPad = !isLeft ? (shortH || compact ? 14 : 24) : 6;
      const maxTw = Math.max(40, row.x + row.w - tx - gripPad);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 ${shortH ? 11.5 : compact ? 12 : 14.5}px "Noto Sans SC", sans-serif`;
      if (shortH) {
        ctx.fillText(fitText(ctx, row.item.title, maxTw), tx, row.cy + 0.5);
      } else {
        ctx.fillText(fitText(ctx, row.item.title, maxTw), tx, row.y + row.h * (compact ? 0.37 : 0.36));
        ctx.fillStyle = PALETTE.inkSoft;
        ctx.font = `600 ${compact ? 8.5 : 10}px "IBM Plex Sans", sans-serif`;
        ctx.fillText(fitText(ctx, row.item.en, maxTw), tx, row.y + row.h * 0.72);
      }

      // 右侧行卡专属拖曳抓手点阵（清楚提示可上下拖换序）
      if (!isLeft) {
        const gx = row.x + row.w - (shortH || compact ? 8 : 13);
        ctx.fillStyle = row.isDragging || isMismatch ? PALETTE.danger : "rgba(10, 10, 8, 0.38)";
        const stepG = shortH ? 4.5 : 6;
        for (let dy = -stepG; dy <= stepG; dy += stepG) {
          ctx.beginPath();
          ctx.arc(gx - 2.2, row.cy + dy, 1.3, 0, Math.PI * 2);
          ctx.arc(gx + 2.2, row.cy + dy, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    };

    for (const r of L.leftRows) drawRowCard(r, "left");
    // 先画非拖动右卡，再画正在拖动的右卡以浮在最上层
    for (const r of L.rightRows) if (!r.isDragging) drawRowCard(r, "right");
    for (const r of L.rightRows) if (r.isDragging) drawRowCard(r, "right");

    // 7. 底部通栏鼠尾草共性带（1:1 复刻原海报）
    ctx.save();
    ctx.globalAlpha = dimIfNot("common");
    const cr = L.commonRect;
    if (state.common === "band") {
      ctx.fillStyle = PALETTE.sage;
      ctx.fillRect(cr.x, cr.y, cr.w, cr.h);

      // 左侧绿方内嵌黑白交叠双圆（原海报标志共性图符）
      const boxW = compact ? 38 : 54;
      const boxH = compact ? 30 : 38;
      const bx = cr.x + (compact ? 10 : 18);
      const by = cr.y + (cr.h - boxH) / 2;
      ctx.fillStyle = PALETTE.green;
      ctx.fillRect(bx, by, boxW, boxH);
      const vr = compact ? 9 : 12;
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(bx + boxW * 0.39, by + boxH / 2, vr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(bx + boxW * 0.61, by + boxH / 2, vr, 0, Math.PI * 2);
      ctx.fill();

      // 共性标题 + 竖细线 + 双语正文
      const labelX = bx + boxW + (compact ? 8 : 14);
      ctx.fillStyle = PALETTE.ink;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = `900 ${compact ? 14 : 18}px "Noto Sans SC", sans-serif`;
      ctx.fillText(deck.common.title, labelX, cr.y + cr.h * 0.37);
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.font = `600 ${compact ? 9 : 10}px "IBM Plex Sans", sans-serif`;
      ctx.fillText(deck.common.en, labelX, cr.y + cr.h * 0.72);

      const divX = labelX + (compact ? 64 : 96);
      ctx.strokeStyle = "rgba(10, 10, 8, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(divX, cr.y + 12);
      ctx.lineTo(divX, cr.y + cr.h - 12);
      ctx.stroke();

      const bodyX = divX + (compact ? 10 : 18);
      const bodyMaxW = cr.x + cr.w - bodyX - (compact ? 8 : 16);
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 ${compact ? 11.5 : 13.5}px "Noto Sans SC", sans-serif`;
      ctx.fillText(fitText(ctx, deck.common.body, bodyMaxW), bodyX, cr.y + cr.h * (compact ? 0.42 : 0.37));
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.font = `600 ${compact ? 8.8 : 10}px "IBM Plex Sans", sans-serif`;
      ctx.fillText(fitText(ctx, deck.common.bodyEn, bodyMaxW), bodyX, cr.y + cr.h * (compact ? 0.74 : 0.72));
    } else if (state.common === "nested") {
      // 错态：共性被塞进右栏角落，破坏对称客观性
      const nx = L.barB.x;
      const nw = L.barB.w;
      ctx.fillStyle = PALETTE.dangerSoft;
      ctx.fillRect(nx, cr.y + 6, nw, cr.h - 12);
      ctx.strokeStyle = PALETTE.danger;
      ctx.lineWidth = 1.3;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(nx + 0.5, cr.y + 6.5, nw - 1, cr.h - 13);
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.danger;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${compact ? 11 : 12.5}px "Noto Sans SC", sans-serif`;
      ctx.fillText(
        fitText(ctx, `× 共性塞进右栏：${deck.common.body}`, nw - 16),
        nx + 8,
        cr.y + cr.h / 2
      );
      // 左侧空荡提示
      ctx.strokeStyle = "rgba(198, 47, 36, 0.35)";
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(L.barA.x + 0.5, cr.y + 6.5, L.barA.w - 1, cr.h - 13);
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.danger;
      ctx.textAlign = "center";
      ctx.font = `600 ${compact ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
      ctx.fillText("左栏无承接 · 点此恢复通栏共性带", L.barA.x + L.barA.w / 2, cr.y + cr.h / 2);
    } else {
      // 错态：共性带缺失
      ctx.fillStyle = "rgba(198, 47, 36, 0.06)";
      ctx.fillRect(cr.x, cr.y + 4, cr.w, cr.h - 8);
      ctx.strokeStyle = PALETTE.danger;
      ctx.lineWidth = 1.3;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(cr.x + 0.5, cr.y + 4.5, cr.w - 1, cr.h - 9);
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.danger;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${compact ? 12 : 13.5}px "Noto Sans SC", sans-serif`;
      ctx.fillText("× 缺少底部「共性」收敛带 · 点此补回共同决策前提", L.cx, cr.y + cr.h / 2);
    }
    ctx.restore();

    // 8. 空格键演练视线脉冲（沿 3 条匹配线依次跳扫 + 收口共性带）
    if (scan.active) {
      const p = clamp(scan.t / scan.dur, 0, 1);
      // 分 4 段：0..0.26 Row1, 0.26..0.52 Row2, 0.52..0.78 Row3, 0.78..1.0 Commonality
      let bx = L.cx;
      let by = L.rowsTop;
      let blocked = false;
      let segColor = PALETTE.blue;
      if (p < 0.78) {
        const rowIdx = Math.min(2, Math.floor(p / 0.26));
        const sub = (p - rowIdx * 0.26) / 0.26;
        const lk = L.links[rowIdx];
        if (state.axis === "wall" && sub > 0.48) {
          // 撞到粗黑墙反弹
          bx = L.axis.x - L.axis.thickness / 2 - 4 - (sub - 0.48) * 18;
          by = lk.y1;
          blocked = true;
          segColor = PALETTE.danger;
        } else {
          bx = lk.x1 + (lk.x2 - lk.x1) * sub;
          by = lk.y1 + (lk.y2 - lk.y1) * sub;
          segColor = lk.horizontalOk ? PALETTE.green : PALETTE.danger;
        }
        // 已扫过的轨迹尾光
        ctx.save();
        ctx.strokeStyle = segColor;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(lk.x1, lk.y1);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.restore();
      } else {
        const sub = (p - 0.78) / 0.22;
        bx = L.commonRect.x + 28 + (L.commonRect.w - 56) * sub;
        by = L.commonRect.y + L.commonRect.h / 2;
        segColor = state.common === "band" ? PALETTE.green : PALETTE.danger;
      }

      ctx.save();
      ctx.fillStyle = segColor;
      ctx.beginPath();
      ctx.arc(bx, by, blocked ? 9 : 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // 扫描读数气泡
      const tipTxt = blocked
        ? "视线撞墙受阻！"
        : audit.ok
          ? `视线顺畅对读 · 总路径 ${L.metrics.scanPathPx}px`
          : `折返绕路中 · 总路径 ${L.metrics.scanPathPx}px`;
      ctx.font = `700 ${compact ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(tipTxt).width + 16;
      const ty = Math.max(8, by - 28);
      const tx = clamp(bx - tw / 2, 8, W - tw - 8);
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(tx, ty, tw, 22);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tipTxt, tx + tw / 2, ty + 11.5);
      ctx.restore();
    }

    ctx.restore();
  }

  const ctl = loop(canvas, render);

  // 指针坐标换算
  function localPt(e) {
    const r = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function hitTest(pt) {
    const L = lastLayout;
    for (const r of L.rightRows) {
      if (inRect(pt.x, pt.y, r, 4)) return { type: "rowB", slot: r.slot };
    }
    if (Math.hypot(pt.x - L.vs.x, pt.y - L.vs.y) <= L.vs.r + 8) return { type: "axis" };
    if (Math.abs(pt.x - L.axis.x) <= 16 && pt.y >= L.axis.y1 && pt.y <= L.axis.y2) return { type: "axis" };
    if (
      inRect(pt.x, pt.y, L.barA, 2) ||
      inRect(pt.x, pt.y, L.barB, 2) ||
      Math.hypot(pt.x - L.shapeA.x, pt.y - L.shapeA.y) <= L.shapeA.r + 8 ||
      Math.hypot(pt.x - L.shapeB.x, pt.y - L.shapeB.y) <= L.shapeB.r + 8
    ) {
      return { type: "coding" };
    }
    if (inRect(pt.x, pt.y, L.commonRect, 4)) return { type: "common" };
    return { type: "coupling" };
  }

  function beginDrag(pt, isTouch) {
    const hit = hitTest(pt);
    pointer = {
      startX: pt.x,
      startY: pt.y,
      lastX: pt.x,
      lastY: pt.y,
      moved: false,
      mode: null,
      hit,
      startCoupling: state.coupling,
      isTouch,
    };
  }

  function moveDrag(pt, e) {
    if (!pointer) return;
    const dx = pt.x - pointer.startX;
    const dy = pt.y - pointer.startY;
    const dist = Math.hypot(dx, dy);

    if (!pointer.mode && dist > 5) {
      pointer.moved = true;
      // 触屏：如果是行卡且偏纵向则拖行换序；如果偏横向则调眼动跨度；空白区偏纵向则放行页面滚动
      if (pointer.hit.type === "rowB" && Math.abs(dy) >= Math.abs(dx) * 0.85) {
        pointer.mode = "rowB";
        state.dragRow = { slot: pointer.hit.slot, dy: 0 };
      } else if (Math.abs(dx) >= Math.abs(dy) * 0.75 || !pointer.isTouch) {
        pointer.mode = "coupling";
      } else {
        // 手机竖向轻扫空白区域时交还给浏览器滚动
        pointer = null;
        return;
      }
    }

    if (!pointer.mode) return;
    if (e && e.cancelable) e.preventDefault();

    if (pointer.mode === "rowB" && state.dragRow) {
      const L = lastLayout;
      const step = Math.max(36, L.rowStep);
      state.dragRow.dy = pt.y - pointer.startY;
      // 跨越相邻行中心即平滑互换顺序
      if (state.dragRow.dy > step * 0.55 && state.dragRow.slot < 2) {
        const s = state.dragRow.slot;
        [state.rightOrder[s], state.rightOrder[s + 1]] = [state.rightOrder[s + 1], state.rightOrder[s]];
        state.dragRow.slot = s + 1;
        pointer.startY += step;
        state.dragRow.dy -= step;
      } else if (state.dragRow.dy < -step * 0.55 && state.dragRow.slot > 0) {
        const s = state.dragRow.slot;
        [state.rightOrder[s], state.rightOrder[s - 1]] = [state.rightOrder[s - 1], state.rightOrder[s]];
        state.dragRow.slot = s - 1;
        pointer.startY -= step;
        state.dragRow.dy += step;
      }
      dirty = true;
      ctl.draw();
      onChange("row");
    } else if (pointer.mode === "coupling") {
      // 横拖画布实时连续调节两栏眼动跨度（右拉变宽，左拉收拢，靠近 0.36 轻吸附）
      const delta = (pt.x - pointer.startX) / Math.max(200, W * 0.55);
      let next = clamp(pointer.startCoupling + delta, 0, 1);
      if (Math.abs(next - 0.36) < 0.022) next = 0.36;
      state.coupling = +next.toFixed(3);
      dirty = true;
      ctl.draw();
      onChange("coupling");
    }
  }

  function endDrag() {
    if (!pointer) return;
    const wasTap = !pointer.moved;
    const hit = pointer.hit;
    if (state.dragRow) {
      state.dragRow = null;
      dirty = true;
      ctl.draw();
      onChange("rowEnd");
    }
    pointer = null;

    if (wasTap) {
      let changed = null;
      if (hit.type === "coding") {
        const seq = ["same", "classic", "accessible", "recommend", "clash"];
        state.coding = seq[(seq.indexOf(state.coding) + 1) % seq.length];
        changed = "coding";
      } else if (hit.type === "axis") {
        const seq = ["none", "classic", "dashed", "wall"];
        state.axis = seq[(seq.indexOf(state.axis) + 1) % seq.length];
        changed = "axis";
      } else if (hit.type === "common") {
        const seq = ["hidden", "band", "nested"];
        state.common = seq[(seq.indexOf(state.common) + 1) % seq.length];
        changed = "common";
      } else if (hit.type === "rowB") {
        // 单点错序行卡：直接与它该去的正确行互换，手机操作超顺手
        const curSlot = hit.slot;
        const itemIdx = state.rightOrder[curSlot];
        if (itemIdx !== curSlot) {
          const targetSlot = itemIdx;
          [state.rightOrder[curSlot], state.rightOrder[targetSlot]] = [
            state.rightOrder[targetSlot],
            state.rightOrder[curSlot],
          ];
        } else {
          // 如果已经对齐，轻点则与下一行试错互换体验交叉感
          const nextSlot = (curSlot + 1) % 3;
          [state.rightOrder[curSlot], state.rightOrder[nextSlot]] = [
            state.rightOrder[nextSlot],
            state.rightOrder[curSlot],
          ];
        }
        changed = "rowSwap";
      }
      if (changed) {
        dirty = true;
        ctl.draw();
        onChange(changed);
      }
    } else {
      ctl.draw();
    }
  }

  // 鼠标事件
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // touch 走原生 touch 事件以配合 perf.mjs 的 dispatchTouchEvent
    canvas.setPointerCapture(e.pointerId);
    beginDrag(localPt(e), false);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const pt = localPt(e);
    if (pointer) {
      moveDrag(pt, e);
    } else {
      const hit = hitTest(pt);
      const changed =
        !hoverTarget || hoverTarget.type !== hit.type || hoverTarget.slot !== hit.slot;
      hoverTarget = hit;
      canvas.style.cursor =
        hit.type === "rowB"
          ? "ns-resize"
          : hit.type === "coupling"
            ? "ew-resize"
            : "pointer";
      if (changed) {
        dirty = true;
        ctl.draw();
      }
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    endDrag();
  });
  canvas.addEventListener("pointercancel", () => {
    state.dragRow = null;
    pointer = null;
    dirty = true;
    ctl.draw();
  });
  canvas.addEventListener("pointerleave", () => {
    if (!pointer && hoverTarget) {
      hoverTarget = null;
      dirty = true;
      ctl.draw();
    }
  });

  // 触屏事件（兼容 CDP Input.dispatchTouchEvent 与真实手指滑动，不锁死竖向滚屏）
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      beginDrag(localPt(e), true);
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!pointer || e.touches.length !== 1) return;
      moveDrag(localPt(e), e);
    },
    { passive: false }
  );
  canvas.addEventListener("touchend", () => endDrag(), { passive: true });
  canvas.addEventListener("touchcancel", () => {
    state.dragRow = null;
    pointer = null;
    dirty = true;
    ctl.draw();
  });

  // ResizeObserver 响应视口变化
  const ro = new ResizeObserver(() => {
    resize();
    onChange("resize");
    ctl.draw();
  });
  ro.observe(canvas);
  resize();

  return {
    draw() {
      dirty = true;
      ctl.draw();
    },
    startScan,
    getLayout: () => lastLayout,
  };
}

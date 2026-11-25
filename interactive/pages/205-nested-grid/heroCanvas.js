// 205 嵌套网格 — 开场活体父子双层排格台（2D Canvas）
// 1:1 承袭 205 原海报建筑蓝图语法：外延十字刻线、①杏桃斜纹父眉、②暖米虚线子网、③浅鼠尾草实线局部网、④底部四卡分组。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { computeLayout, clamp, applyFix, SCENES } from "./model.js";

const PAL = {
  paper: "#F7F1E7",
  ink: "#121C17",
  inkSoft: "#3E4D44",
  forest: "#0E4836",
  forestMid: "#1B634B",
  terracotta: "#D35D2D",
  terracottaDeep: "#A33D14",
  apricot: "#F2D2B6",
  apricotHatch: "#DFB08A",
  creamZone: "#F4EBDC",
  sageZone: "#E3E2D0",
  sageLine: "#9AA28E",
  dashLine: "#9B968A",
  trackBand: "rgba(14, 72, 54, 0.055)",
  trackEdge: "rgba(14, 72, 54, 0.16)",
  err: "#B52B1D",
  errFill: "#FBEAE7",
  ok: "#0E6245",
  okFill: "#E2F2EB",
};

function makeHatchPattern(ctx) {
  const c = document.createElement("canvas");
  c.width = 14;
  c.height = 14;
  const g = c.getContext("2d");
  g.fillStyle = PAL.apricot;
  g.fillRect(0, 0, 14, 14);
  g.strokeStyle = PAL.apricotHatch;
  g.lineWidth = 1.1;
  g.beginPath();
  g.moveTo(-2, 14);
  g.lineTo(14, -2);
  g.moveTo(0, 28);
  g.lineTo(28, 0);
  g.moveTo(-14, 12);
  g.lineTo(12, -14);
  g.stroke();
  return ctx.createPattern(c, "repeat");
}

function drawBadge(ctx, x, y, num, active) {
  const r = active ? 13 : 11.5;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = active ? PAL.terracotta : PAL.forest;
  ctx.fill();
  if (active) {
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.fillStyle = "#FAF5EC";
  ctx.font = '700 12px "Space Grotesk", "Noto Sans SC", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(num), x, y + 0.5);
  ctx.restore();
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function createHeroCanvas(canvas, getState, onChange) {
  const ctx = canvas.getContext("2d");
  const hatch = makeHatchPattern(ctx);

  let width = 640;
  let height = 460;
  let dpr = 1;
  let dirty = true;
  let dragging = false;
  let pointerMoved = false;
  let dragStartX = 0;
  let dragStartSplit = 5.4;
  let hoverRail = false;
  let animDone = false;
  let calloutBoxes = [];
  let lastLayout = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    // 手机窄屏像素比封顶 1.5（GUIDE.md 建议），大幅减轻软件渲染填充压力
    dpr = pixelRatio(window.innerWidth <= 680 ? 1.5 : 2);
    width = Math.round(rect.width);
    height = Math.round(rect.height);
    const pw = Math.round(width * dpr);
    const ph = Math.round(height * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    dirty = true;
  }

  function drawSceneContent(layout, alpha) {
    const { state, zone1, zone2, zone3, childTracksA, childTracksB, bottomItems } = layout;
    if (state.layerMode === "parent" || state.layerMode === "zones") return;
    const isReal = state.scene !== "poster" || state.layerMode === "content";
    if (!isReal) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Zone 1 header wireframe
    const hPad = Math.max(8, zone1.w * 0.025);
    if (state.scene === "news") {
      ctx.fillStyle = PAL.forest;
      ctx.fillRect(zone1.x + hPad, zone1.y + zone1.h * 0.28, zone1.w * 0.24, Math.max(10, zone1.h * 0.44));
      ctx.fillStyle = PAL.terracotta;
      ctx.beginPath();
      ctx.arc(zone1.x + hPad + zone1.w * 0.29, zone1.y + zone1.h * 0.5, Math.min(12, zone1.h * 0.22), 0, Math.PI * 2);
      ctx.fill();
      // nav ticks right
      ctx.fillStyle = "rgba(18, 28, 23, 0.36)";
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(zone1.x + zone1.w - hPad - (i + 1) * 34, zone1.y + zone1.h * 0.44, 24, 5);
      }
    } else if (state.scene === "shop") {
      ctx.fillStyle = PAL.forest;
      ctx.fillRect(zone1.x + hPad, zone1.y + zone1.h * 0.32, zone1.w * 0.16, Math.max(8, zone1.h * 0.34));
      ctx.strokeStyle = PAL.inkSoft;
      ctx.lineWidth = 1;
      ctx.strokeRect(zone1.x + zone1.w * 0.32, zone1.y + zone1.h * 0.26, zone1.w * 0.38, zone1.h * 0.48);
      ctx.fillStyle = PAL.terracotta;
      ctx.fillRect(zone1.x + zone1.w - hPad - 46, zone1.y + zone1.h * 0.28, 46, zone1.h * 0.44);
    } else {
      // content layer mode on poster
      ctx.fillStyle = "rgba(14, 72, 54, 0.18)";
      ctx.fillRect(zone1.x + hPad, zone1.y + zone1.h * 0.28, zone1.w * 0.36, zone1.h * 0.22);
      ctx.fillRect(zone1.x + hPad, zone1.y + zone1.h * 0.58, zone1.w * 0.22, zone1.h * 0.14);
    }

    // Zone 2 child content locked strictly to childTracksA
    if (childTracksA.length > 0) {
      const topH = childTracksA[0].h * 0.48;
      const botY = childTracksA[0].y + topH + Math.max(6, layout.cGap * 0.65);
      const botH = Math.max(12, childTracksA[0].h - topH - Math.max(6, layout.cGap * 0.65));

      if (state.scene === "shop") {
        // Big product visual spanning full childTracksA width, thumbnails aligned to childTracksA below
        const fullW = childTracksA[childTracksA.length - 1].x + childTracksA[childTracksA.length - 1].w - childTracksA[0].x;
        ctx.fillStyle = "rgba(14, 72, 54, 0.12)";
        ctx.fillRect(childTracksA[0].x, childTracksA[0].y, fullW, topH);
        // minimalist bag silhouette (echoing 205 poster)
        const bx = childTracksA[0].x + fullW * 0.5;
        const by = childTracksA[0].y + topH * 0.55;
        const bw = Math.min(40, fullW * 0.24, topH * 0.52);
        const bh = bw * 0.85;
        ctx.strokeStyle = PAL.forest;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bx, by - bh * 0.48, bw * 0.26, Math.PI, 0);
        ctx.stroke();
        ctx.fillStyle = PAL.forest;
        ctx.fillRect(bx - bw / 2, by - bh * 0.45, bw, bh);
        // Thumbnails locked into child columns
        for (const tr of childTracksA) {
          ctx.fillStyle = "rgba(14, 72, 54, 0.14)";
          ctx.fillRect(tr.x, botY, tr.w, botH * 0.55);
          ctx.fillStyle = "rgba(18, 28, 23, 0.32)";
          ctx.fillRect(tr.x, botY + botH * 0.68, tr.w * 0.8, 3);
          ctx.fillRect(tr.x, botY + botH * 0.82, tr.w * 0.55, 3);
        }
      } else {
        // News / Content: cards inside each child column
        childTracksA.forEach((tr, idx) => {
          ctx.fillStyle = idx === 0 && state.scene === "news" ? "rgba(211, 93, 45, 0.22)" : "rgba(14, 72, 54, 0.11)";
          ctx.fillRect(tr.x, tr.y, tr.w, topH * 0.72);
          if (idx === 0 && state.scene === "news" && tr.w > 22) {
            ctx.fillStyle = PAL.terracotta;
            ctx.beginPath();
            ctx.arc(tr.x + tr.w * 0.5, tr.y + topH * 0.36, Math.min(12, tr.w * 0.28, topH * 0.22), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = "rgba(18, 28, 23, 0.42)";
          ctx.fillRect(tr.x, tr.y + topH * 0.82, tr.w * 0.86, 3.5);
          ctx.fillStyle = "rgba(18, 28, 23, 0.24)";
          ctx.fillRect(tr.x, botY, tr.w * 0.92, 3);
          ctx.fillRect(tr.x, botY + 8, tr.w * 0.72, 3);
          ctx.fillStyle = "rgba(14, 72, 54, 0.1)";
          ctx.fillRect(tr.x, botY + 18, tr.w, Math.max(8, botH - 22));
        });
      }
    }

    // Zone 3 sidebar / buybox aligned to childTracksB
    if (childTracksB.length > 0) {
      const fullW = childTracksB[childTracksB.length - 1].x + childTracksB[childTracksB.length - 1].w - childTracksB[0].x;
      const sx = childTracksB[0].x;
      const sy = childTracksB[0].y;
      const sh = childTracksB[0].h;
      if (state.scene === "shop") {
        // Title + Price + Terracotta CTA + Spec grid
        ctx.fillStyle = "rgba(18, 28, 23, 0.48)";
        ctx.fillRect(sx, sy, fullW * 0.85, 6);
        ctx.fillStyle = "rgba(18, 28, 23, 0.24)";
        ctx.fillRect(sx, sy + 12, fullW * 0.62, 4);
        ctx.fillStyle = PAL.terracotta;
        ctx.fillRect(sx, sy + 26, fullW, 18);
        const specY = sy + 56;
        const specH = Math.max(16, (sh - 62) / 3 - 6);
        for (let r = 0; r < 3; r++) {
          for (const tr of childTracksB) {
            ctx.fillStyle = "rgba(14, 72, 54, 0.14)";
            ctx.fillRect(tr.x, specY + r * (specH + 6), tr.w, specH);
          }
        }
      } else {
        // News digest rows inside childTracksB
        const rows = 4;
        const rh = (sh - (rows - 1) * 8) / rows;
        for (let r = 0; r < rows; r++) {
          for (const tr of childTracksB) {
            const ry = sy + r * (rh + 8);
            ctx.fillStyle = r === 0 ? "rgba(211, 93, 45, 0.22)" : "rgba(14, 72, 54, 0.12)";
            ctx.fillRect(tr.x, ry, tr.w, Math.max(6, rh * 0.56));
            ctx.fillStyle = "rgba(18, 28, 23, 0.3)";
            ctx.fillRect(tr.x, ry + rh * 0.68, tr.w * 0.78, 3);
          }
        }
      }
    }

    // Zone 4 bottom card glyphs
    bottomItems.forEach((b, i) => {
      const cx = b.x + b.w * 0.5;
      const cy = b.y + b.h * 0.46;
      const sz = Math.min(9, b.w * 0.14, b.h * 0.2);
      ctx.fillStyle = i === 0 ? PAL.terracotta : PAL.forest;
      if (i % 3 === 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, sz, 0, Math.PI * 2);
        ctx.fill();
      } else if (i % 3 === 1) {
        ctx.fillRect(cx - sz, cy - sz, sz * 2, sz * 2);
      } else {
        ctx.beginPath();
        ctx.moveTo(cx, cy - sz);
        ctx.lineTo(cx + sz, cy + sz);
        ctx.lineTo(cx - sz, cy + sz);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = "rgba(18, 28, 23, 0.35)";
      ctx.fillRect(b.x + b.w * 0.18, b.y + b.h * 0.74, b.w * 0.64, 3);
    });

    ctx.restore();
  }

  function render(t, _dt, { still }) {
    if (!dirty && animDone) return;
    const ease = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
    const prog = still ? 1 : clamp(t / 1.05, 0, 1);
    if (prog >= 1) animDone = true;
    dirty = false;

    const pFrame = ease(prog * 1.45);
    const pZones = ease((prog - 0.18) * 1.5);
    const pChild = ease((prog - 0.38) * 1.65);

    const state = getState();
    const layout = computeLayout(state, width, height);
    lastLayout = layout;
    const { frame, parentTracks, zone1, zone2, zone3, zone4, childTracksA, childTracksB, bottomItems, splitCenterX, checks, callouts } = layout;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. 暖米画板底
    ctx.fillStyle = PAL.paper;
    ctx.fillRect(0, 0, width, height);

    // 2. 父网格外延十字刻线与列轨道带（合并路径一次绘制，大幅减少绘制调用）
    const tick = 10;
    ctx.save();
    ctx.globalAlpha = pFrame;

    ctx.fillStyle = PAL.trackBand;
    for (let i = 0; i < parentTracks.length; i++) {
      const tr = parentTracks[i];
      ctx.fillRect(tr.x, frame.y, tr.w, frame.h);
    }

    ctx.strokeStyle = PAL.trackEdge;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    for (let i = 0; i < parentTracks.length; i++) {
      const tr = parentTracks[i];
      ctx.moveTo(tr.x, frame.y - tick * 0.6);
      ctx.lineTo(tr.x, frame.y + frame.h + tick * 0.6);
      ctx.moveTo(tr.right, frame.y - tick * 0.6);
      ctx.lineTo(tr.right, frame.y + frame.h + tick * 0.6);
    }
    ctx.stroke();

    ctx.fillStyle = PAL.inkSoft;
    ctx.font = '500 10px "DM Mono", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    for (let i = 0; i < parentTracks.length; i++) {
      if (state.parentCols <= 12 || i % 2 === 0 || i === state.parentCols - 1) {
        const tr = parentTracks[i];
        ctx.fillText(String(i + 1), tr.x + tr.w / 2, frame.y - 10);
      }
    }

    // 外框主线（带四边出头刻线）
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    // 上下水平出头线
    ctx.moveTo(frame.x - tick, frame.y);
    ctx.lineTo(frame.x + frame.w + tick, frame.y);
    ctx.moveTo(frame.x - tick, frame.y + frame.h);
    ctx.lineTo(frame.x + frame.w + tick, frame.y + frame.h);
    // 左右垂直出头线
    ctx.moveTo(frame.x, frame.y - tick);
    ctx.lineTo(frame.x, frame.y + frame.h + tick);
    ctx.moveTo(frame.x + frame.w, frame.y - tick);
    ctx.lineTo(frame.x + frame.w, frame.y + frame.h + tick);
    // 横向三区基准外延线
    const hLines = [zone1.y + zone1.h, zone2.y, zone2.y + zone2.h, zone4.y];
    for (const y of hLines) {
      ctx.moveTo(frame.x - tick * 0.8, y);
      ctx.lineTo(frame.x + frame.w + tick * 0.8, y);
    }
    ctx.stroke();
    ctx.restore();

    // 若用户切到「仅父网」透视层，只展示父网格列带 + 外框提示
    if (state.layerMode !== "parent") {
      ctx.save();
      ctx.globalAlpha = pZones;

      const dimOthers = state.focusZone > 0;
      const zoneAlpha = (zId) => (!dimOthers || state.focusZone === zId ? 1 : 0.36);

      // ----- 区 ①：杏桃斜纹父眉区 -----
      ctx.save();
      ctx.globalAlpha = pZones * zoneAlpha(1);
      ctx.fillStyle = hatch || PAL.apricot;
      ctx.fillRect(zone1.x, zone1.y, zone1.w, zone1.h);
      ctx.strokeStyle = state.focusZone === 1 ? PAL.terracotta : PAL.ink;
      ctx.lineWidth = state.focusZone === 1 ? 2 : 1.15;
      ctx.strokeRect(zone1.x, zone1.y, zone1.w, zone1.h);
      ctx.restore();

      // ----- 区 ②：暖米虚线子模块区 -----
      ctx.save();
      ctx.globalAlpha = pZones * zoneAlpha(2);
      ctx.fillStyle = PAL.creamZone;
      ctx.fillRect(zone2.x, zone2.y, zone2.w, zone2.h);
      ctx.strokeStyle = state.focusZone === 2 ? PAL.terracotta : PAL.ink;
      ctx.lineWidth = state.focusZone === 2 ? 2 : 1.15;
      ctx.strokeRect(zone2.x, zone2.y, zone2.w, zone2.h);

      // 区② 内部虚线子网格（原海报母题）
      if (state.layerMode !== "zones") {
        const innerAlpha = pChild * zoneAlpha(2);
        ctx.globalAlpha = innerAlpha;
        const rowsA = 3;
        const padA = Math.max(6, 14 * layout.pScale);
        const usableHA = Math.max(20, zone2.h - padA * 2);
        const rowHA = (usableHA - (rowsA - 1) * layout.cGap * 0.5) / rowsA;
        const isCrushedA = layout.metrics.refColWA < 56 || state.nestingDepth >= 4;

        ctx.save();
        ctx.fillStyle = isCrushedA ? "rgba(181, 43, 29, 0.08)" : "rgba(14, 72, 54, 0.035)";
        for (const tr of childTracksA) ctx.fillRect(tr.x, tr.y, tr.w, tr.h);

        ctx.setLineDash([4, 3.5]);
        ctx.strokeStyle = isCrushedA ? PAL.err : PAL.dashLine;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const tr of childTracksA) {
          ctx.rect(tr.x, tr.y, tr.w, tr.h);
          for (let r = 1; r < rowsA; r++) {
            const ry = tr.y + r * (rowHA + layout.cGap * 0.5) - layout.cGap * 0.25;
            ctx.moveTo(tr.x, ry);
            ctx.lineTo(tr.x + tr.w, ry);
          }
        }
        ctx.stroke();

        // 若开启「4层套娃试错」，合并路径一次画出嵌套红框
        if (state.nestingDepth >= 4) {
          ctx.setLineDash([]);
          ctx.strokeStyle = "rgba(181, 43, 29, 0.65)";
          ctx.beginPath();
          for (const tr of childTracksA) {
            if (tr.w > 12) ctx.rect(tr.x + 3, tr.y + 3, Math.max(4, tr.w - 6), Math.max(8, tr.h - 6));
            if (tr.w > 22) ctx.rect(tr.x + 7, tr.y + 7, Math.max(4, tr.w - 14), Math.max(8, tr.h - 14));
          }
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();

      // ----- 区 ③：浅鼠尾草实线局部秩序区 -----
      ctx.save();
      ctx.globalAlpha = pZones * zoneAlpha(3);
      ctx.fillStyle = PAL.sageZone;
      ctx.fillRect(zone3.x, zone3.y, zone3.w, zone3.h);
      ctx.strokeStyle = state.focusZone === 3 ? PAL.terracotta : PAL.ink;
      ctx.lineWidth = state.focusZone === 3 ? 2 : 1.15;
      ctx.strokeRect(zone3.x, zone3.y, zone3.w, zone3.h);

      if (state.layerMode !== "zones") {
        ctx.globalAlpha = pChild * zoneAlpha(3);
        const rowsB = 4;
        const padB = Math.max(6, 14 * layout.pScale);
        const usableHB = Math.max(20, zone3.h - padB * 2);
        const rowHB = usableHB / rowsB;
        const isCrushedB = layout.metrics.refColWB < 56;
        ctx.strokeStyle = isCrushedB ? PAL.err : PAL.sageLine;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        for (const tr of childTracksB) {
          ctx.rect(tr.x, tr.y, tr.w, tr.h);
          for (let r = 1; r < rowsB; r++) {
            const ry = tr.y + r * rowHB;
            ctx.moveTo(tr.x, ry);
            ctx.lineTo(tr.x + tr.w, ry);
          }
        }
        ctx.stroke();
      }
      ctx.restore();

      // ----- 区 ④：底部杏桃斜纹内容分组 -----
      ctx.save();
      ctx.globalAlpha = pZones * zoneAlpha(4);
      const groupOk = checks[3].ok;
      for (const b of bottomItems) {
        ctx.fillStyle = hatch || PAL.apricot;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = state.focusZone === 4 ? PAL.terracotta : groupOk ? PAL.ink : PAL.err;
        ctx.lineWidth = state.focusZone === 4 ? 2 : groupOk ? 1.15 : 1.35;
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        // 若不整除父网格，底边画红竖刻提醒偏离父网格线
        if (!groupOk && !b.aligned) {
          ctx.strokeStyle = PAL.err;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y + b.h);
          ctx.lineTo(b.x, b.y + b.h + 11);
          ctx.stroke();
        }
      }
      ctx.restore();

      // ----- 真实内容线框（资讯 / 电商 / 实景模式） -----
      drawSceneContent(layout, pChild);

      // ----- 间距倒挂可视化双向标尺 -----
      if (state.childGap > state.parentGap && childTracksA.length >= 2) {
        ctx.save();
        ctx.globalAlpha = pChild;
        const gx1 = childTracksA[0].x + childTracksA[0].w;
        const gx2 = childTracksA[1].x;
        const gy = zone2.y + zone2.h * 0.5;
        ctx.fillStyle = "rgba(181, 43, 29, 0.22)";
        ctx.fillRect(gx1, zone2.y + 8, Math.max(2, gx2 - gx1), zone2.h - 16);
        ctx.strokeStyle = PAL.err;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(gx1, gy);
        ctx.lineTo(gx2, gy);
        ctx.stroke();
        ctx.restore();
      }

      // ----- ① ② ③ ④ 深绿数字徽章（严格复刻原海报） -----
      if (state.layerMode !== "content") {
        ctx.save();
        ctx.globalAlpha = pZones;
        const z1BadgeX = state.scene === "poster" ? zone1.x + zone1.w * 0.5 : zone1.x + 18;
        const z1BadgeY = state.scene === "poster" ? zone1.y + zone1.h * 0.5 : zone1.y + 18;
        drawBadge(ctx, z1BadgeX, z1BadgeY, 1, state.focusZone === 1);
        drawBadge(ctx, zone2.x + zone2.w * 0.5, zone2.y + zone2.h * 0.5, 2, state.focusZone === 2);
        drawBadge(ctx, zone3.x + zone3.w * 0.5, zone3.y + zone3.h * 0.5, 3, state.focusZone === 3);
        drawBadge(ctx, zone4.x + zone4.w * 0.5, zone4.y + zone4.h * 0.5, 4, state.focusZone === 4);
        ctx.restore();
      }

      // ----- 区②/③ 内实测单列宽角标（位于子网顶空带内，绝不被虚线切穿） -----
      ctx.save();
      ctx.globalAlpha = pChild;
      ctx.font = '500 10.5px "DM Mono", "Noto Sans SC", sans-serif';
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      const lblA = `${layout.leftSpan}列 → ${state.childColsA}子列 (${layout.metrics.refColWA}px)`;
      const twA = ctx.measureText(lblA).width;
      ctx.fillStyle = PAL.creamZone;
      ctx.fillRect(zone2.x + 6, zone2.y + 4, Math.min(twA + 6, zone2.w - 12), 14);
      ctx.fillStyle = layout.metrics.refColWA < 56 ? PAL.err : PAL.forest;
      ctx.fillText(lblA, zone2.x + 8, zone2.y + 5);

      if (zone3.w > 98) {
        const lblB = `${layout.rightSpan}列 → ${state.childColsB}子列`;
        const twB = ctx.measureText(lblB).width;
        ctx.fillStyle = PAL.sageZone;
        ctx.fillRect(zone3.x + 6, zone3.y + 4, Math.min(twB + 6, zone3.w - 12), 14);
        ctx.fillStyle = layout.metrics.refColWB < 56 ? PAL.err : PAL.forest;
        ctx.fillText(lblB, zone3.x + 8, zone3.y + 5);
      }
      ctx.restore();

      ctx.restore();
    }

    // 3. 可拖拽垂直分界脊（在区②与区③之间）
    const alignOk = checks[0].ok;
    const railColor = dragging ? PAL.terracotta : alignOk ? PAL.ok : PAL.err;
    ctx.save();
    ctx.globalAlpha = pZones;

    // 贯穿区②③高度的分界脊线
    ctx.strokeStyle = railColor;
    ctx.lineWidth = dragging || hoverRail ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(splitCenterX, zone2.y - 6);
    ctx.lineTo(splitCenterX, zone2.y + zone2.h + 6);
    ctx.stroke();

    // 顶部对位小三角指针
    ctx.fillStyle = railColor;
    ctx.beginPath();
    ctx.moveTo(splitCenterX, frame.y - 2);
    ctx.lineTo(splitCenterX - 5, frame.y - 9);
    ctx.lineTo(splitCenterX + 5, frame.y - 9);
    ctx.closePath();
    ctx.fill();

    // 中央抓手胶囊
    const gripW = 24;
    const gripH = 38;
    const gx = splitCenterX - gripW / 2;
    const gy = zone2.y + zone2.h * 0.5 - gripH / 2;
    roundRectPath(ctx, gx, gy, gripW, gripH, 3);
    ctx.fillStyle = dragging ? PAL.terracotta : "#FAF5EC";
    ctx.fill();
    ctx.strokeStyle = railColor;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.fillStyle = dragging ? "#FAF5EC" : railColor;
    ctx.font = '700 11px "Space Grotesk", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("↔", splitCenterX, zone2.y + zone2.h * 0.5 + 0.5);
    ctx.restore();

    // 4. 画布底部外延实况尺（宽屏左右分列，窄屏单行居中绝不撞字）
    ctx.save();
    ctx.globalAlpha = pFrame;
    ctx.font = '500 10.5px "DM Mono", "Noto Sans SC", sans-serif';
    ctx.textBaseline = "top";
    if (width < 480) {
      ctx.textAlign = "center";
      ctx.fillStyle = layout.metrics.passCount === 4 ? PAL.ok : PAL.inkSoft;
      const shortLine =
        layout.metrics.passCount === 4
          ? `4/4 咬合达标 · 父 ${state.parentCols}列 · 外${state.parentGap}/内${state.childGap}px`
          : `父 ${state.parentCols}列 · 外${state.parentGap}/内${state.childGap}px · 横拖橙脊或点红标`;
      ctx.fillText(shortLine, frame.x + frame.w / 2, frame.y + frame.h + 11);
    } else {
      ctx.fillStyle = PAL.inkSoft;
      ctx.textAlign = "left";
      ctx.fillText(
        `${SCENES[state.scene].short} · 父 ${state.parentCols}列 · 外缝 ${state.parentGap}px / 内缝 ${state.childGap}px`,
        frame.x,
        frame.y + frame.h + 11
      );
      ctx.textAlign = "right";
      ctx.fillStyle = layout.metrics.passCount === 4 ? PAL.ok : PAL.terracottaDeep;
      ctx.fillText(
        layout.metrics.passCount === 4 ? "4/4 咬合达标" : "横拖橙脊对准父线 · 点红标纠错",
        frame.x + frame.w,
        frame.y + frame.h + 11
      );
    }
    ctx.restore();

    // 5. 可点击红框纠错标牌（绘制在最顶层，绝不超画布边界）
    calloutBoxes = [];
    if (state.layerMode !== "parent" && pChild > 0.65) {
      ctx.save();
      ctx.font = '600 11px "Noto Sans SC", sans-serif';
      for (const c of callouts) {
        const tw = ctx.measureText(c.text).width;
        const bw = tw + 18;
        const bh = 24;
        const bx = clamp(c.x - bw / 2, frame.x + 6, frame.x + frame.w - bw - 6);
        const by = clamp(c.y - bh / 2, frame.y + 6, frame.y + frame.h - bh - 6);
        calloutBoxes.push({ id: c.id, x: bx, y: by, w: bw, h: bh });
        roundRectPath(ctx, bx, by, bw, bh, 2);
        ctx.fillStyle = PAL.errFill;
        ctx.fill();
        ctx.strokeStyle = PAL.err;
        ctx.lineWidth = 1.25;
        ctx.stroke();
        ctx.fillStyle = PAL.err;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(c.text, bx + bw / 2, by + bh / 2 + 0.5);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  function clientToLocal(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function updateSplitFromClientX(localX) {
    if (!lastLayout) return;
    const state = getState();
    const { frame, pColW, pGap } = lastLayout;
    const step = pColW + pGap;
    if (step <= 0) return;
    const rawCol = (localX - frame.x + pGap / 2) / step;
    const clamped = clamp(rawCol, 1.8, state.parentCols - 1.8);
    // 靠近整数父线轻轻磁吸（±0.16 列）
    const nearest = Math.round(clamped);
    const snapped = Math.abs(clamped - nearest) < 0.16 ? nearest : Math.round(clamped * 10) / 10;
    if (snapped !== state.splitCol) {
      onChange({ splitCol: snapped });
    }
  }

  function hitBox(pt, box) {
    return pt.x >= box.x && pt.x <= box.x + box.w && pt.y >= box.y && pt.y <= box.y + box.h;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const pt = clientToLocal(e);
    dragging = true;
    pointerMoved = false;
    dragStartX = pt.x;
    dragStartSplit = getState().splitCol;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    // 若点在红标上，留给 pointerup 处理点击，不立刻乱跳分界线
    const onCallout = calloutBoxes.some((b) => hitBox(pt, b));
    if (!onCallout && lastLayout && Math.abs(pt.x - lastLayout.splitCenterX) < 34) {
      updateSplitFromClientX(pt.x);
    }
    dirty = true;
    ctrl.draw();
  });

  canvas.addEventListener("pointermove", (e) => {
    const pt = clientToLocal(e);
    if (dragging) {
      const dx = pt.x - dragStartX;
      if (Math.abs(dx) > 4) pointerMoved = true;
      if (pointerMoved && lastLayout) {
        const state = getState();
        const step = lastLayout.pColW + lastLayout.pGap;
        const nextRaw = clamp(dragStartSplit + dx / Math.max(12, step), 1.8, state.parentCols - 1.8);
        const nearest = Math.round(nextRaw);
        const snapped = Math.abs(nextRaw - nearest) < 0.15 ? nearest : Math.round(nextRaw * 10) / 10;
        if (snapped !== state.splitCol) {
          onChange({ splitCol: snapped });
        }
      }
      return;
    }
    if (lastLayout) {
      const overC = calloutBoxes.some((b) => hitBox(pt, b));
      const overR = Math.abs(pt.x - lastLayout.splitCenterX) < 22;
      if (overR !== hoverRail) {
        hoverRail = overR;
        dirty = true;
        ctrl.draw();
      }
      canvas.style.cursor = overC ? "pointer" : overR ? "ew-resize" : "grab";
    }
  });

  const endDrag = (e) => {
    if (!dragging) return;
    const pt = clientToLocal(e);
    dragging = false;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
    if (!pointerMoved && lastLayout) {
      // 1. 优先命中红框纠错标
      const hitC = calloutBoxes.find((b) => hitBox(pt, b));
      if (hitC) {
        onChange(applyFix(getState(), hitC.id));
        return;
      }
      // 2. 点击四个区域高亮解剖
      const { zone1, zone2, zone3, zone4 } = lastLayout;
      const cur = getState().focusZone;
      let zHit = 0;
      if (hitBox(pt, zone1)) zHit = 1;
      else if (hitBox(pt, zone2)) zHit = 2;
      else if (hitBox(pt, zone3)) zHit = 3;
      else if (hitBox(pt, zone4)) zHit = 4;
      if (zHit) onChange({ focusZone: cur === zHit ? 0 : zHit });
    }
    dirty = true;
    ctrl.draw();
  };

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => {
    dragging = false;
    dirty = true;
    ctrl.draw();
  });

  // 触屏兜底：让 perf.mjs 的 dispatchTouchEvent（不触发 pointermove 的合成触摸）也能丝滑重画！
  let touchStartX = 0;
  let touchStartSplit = 5.4;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const r = canvas.getBoundingClientRect();
      touchStartX = e.touches[0].clientX - r.left;
      touchStartSplit = getState().splitCol;
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length || !lastLayout) return;
      const r = canvas.getBoundingClientRect();
      const tx = e.touches[0].clientX - r.left;
      const dx = tx - touchStartX;
      if (Math.abs(dx) < 2) return;
      const state = getState();
      const step = lastLayout.pColW + lastLayout.pGap;
      const nextRaw = clamp(touchStartSplit + dx / Math.max(12, step), 1.8, state.parentCols - 1.8);
      const nearest = Math.round(nextRaw);
      const snapped = Math.abs(nextRaw - nearest) < 0.14 ? nearest : Math.round(nextRaw * 10) / 10;
      if (snapped !== state.splitCol) {
        onChange({ splitCol: snapped });
      }
    },
    { passive: true }
  );

  // 键盘精细微调（←/→ 移分界线，1–4 高亮四区）
  canvas.addEventListener("keydown", (e) => {
    const s = getState();
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = e.shiftKey
        ? clamp(Math.round((s.splitCol + dir * 0.2) * 10) / 10, 2, s.parentCols - 2)
        : clamp(Math.round(s.splitCol) + dir, 2, s.parentCols - 2);
      onChange({ splitCol: next });
    } else if (["1", "2", "3", "4"].includes(e.key)) {
      const z = Number(e.key);
      onChange({ focusZone: s.focusZone === z ? 0 : z });
    }
  });

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();

  const ctrl = loop(canvas, render);
  return {
    invalidate() {
      dirty = true;
      // 减少动态效果模式下无 rAF 循环，才立即同步绘制一帧；正常模式交给 rAF 合批防重复重画
      if (reducedMotion.matches) ctrl.draw();
    },
  };
}

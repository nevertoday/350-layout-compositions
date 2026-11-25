// 201 方格网格：8×8 活体拼装制图台（2D Canvas）
// 支持：空白格横拖调单元 1:1 宽高比、模块主体拖拽落位交点、右下橘红角标缩放跨格尺寸、键盘微调。

import { loop, pixelRatio } from "../../lib/stage.js";
import {
  GRID_N,
  THEMES,
  clampAspect,
  evaluate,
  snapCoord,
  tilePixelRect,
} from "./model.js";

const COL = {
  bg: "#FBFCF9",
  gridLine: "#BDCAC0",
  gridMajor: "#8EA396",
  gutterFill: "rgba(225, 96, 60, 0.11)",
  gutterOkFill: "rgba(46, 120, 97, 0.08)",
  green: "#1E5746",
  greenSoft: "#2E7861",
  terra: "#E1603C",
  terraTint: "#F5DCCE",
  terraInk: "#A33517",
  ink: "#0E1513",
  inkSoft: "#3B4C46",
  err: "#B22222",
  errFill: "rgba(178, 34, 34, 0.10)",
  ok: "#19624B",
  paper: "#F7F8F3",
};

export function createHeroCanvas(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let dpr = 1;
  let geom = null;
  let dirty = true;
  let introDone = false;
  let hoverTileId = null;
  let hoverHandleId = null;

  // 拖拽会话状态
  // mode: "aspect" | "move" | "resize"
  let drag = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(200, Math.round(rect.width));
    h = Math.max(200, Math.round(rect.height));
    dpr = pixelRatio(2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    dirty = true;
  }

  function computeGeom(ev) {
    const showRightNotes = w >= 590;
    const padLeft = w < 460 ? 40 : 54;
    const padTop = w < 460 ? 34 : 46;
    const padRight = showRightNotes ? Math.min(188, Math.round(w * 0.26)) : 14;
    const padBottom = w < 460 ? 14 : 22;

    const availW = Math.max(120, w - padLeft - padRight);
    const availH = Math.max(120, h - padTop - padBottom);

    const gx = ev.gutter.gx;
    const gy = ev.gutter.gy;
    const asp = ev.aspect;

    // 令单格高度为 u，单格宽度为 u * asp，缝隙为 u * gx / u * gy
    const unitsW = GRID_N * asp + (GRID_N - 1) * gx;
    const unitsH = GRID_N + (GRID_N - 1) * gy;
    const u = Math.min(availW / unitsW, availH / unitsH);

    const cellW = u * asp;
    const cellH = u;
    const gapX = u * gx;
    const gapY = u * gy;
    const totalW = GRID_N * cellW + (GRID_N - 1) * gapX;
    const totalH = GRID_N * cellH + (GRID_N - 1) * gapY;

    const ox = Math.round(padLeft + (availW - totalW) / 2);
    const oy = Math.round(padTop + (availH - totalH) / 2);

    return { ox, oy, cellW, cellH, gapX, gapY, totalW, totalH, u, showRightNotes };
  }

  function drawDoubleArrow(x1, y1, x2, y2, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const ang = Math.atan2(y2 - y1, x2 - x1);
    const s = 5.5;
    const head = (px, py, a) => {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - s * Math.cos(a - 0.45), py - s * Math.sin(a - 0.45));
      ctx.lineTo(px - s * Math.cos(a + 0.45), py - s * Math.sin(a + 0.45));
      ctx.closePath();
      ctx.fill();
    };
    head(x1, y1, ang + Math.PI);
    head(x2, y2, ang);
    ctx.restore();
  }

  function drawAnchorNode(x, y, highlight = false) {
    ctx.save();
    const r = highlight ? 5.2 : 3.8;
    ctx.strokeStyle = COL.green;
    ctx.lineWidth = highlight ? 1.8 : 1.3;
    ctx.beginPath();
    ctx.moveTo(x - r - 4, y);
    ctx.lineTo(x + r + 4, y);
    ctx.moveTo(x, y - r - 4);
    ctx.lineTo(x, y + r + 4);
    ctx.stroke();

    ctx.fillStyle = COL.bg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COL.green;
    ctx.beginPath();
    ctx.arc(x, y, 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawLetterA(r) {
    // 复刻 201 原海报左下角粗几何无衬线大字母 A，精准占满模块盒（拉扁时随模块同步变形）
    const padX = r.w * 0.08;
    const padY = r.h * 0.06;
    const x = r.x + padX;
    const y = r.y + padY;
    const aw = r.w - padX * 2;
    const ah = r.h - padY * 2;

    ctx.save();
    ctx.fillStyle = COL.terra;
    ctx.beginPath();
    // 外轮廓
    ctx.moveTo(x + aw * 0.37, y);
    ctx.lineTo(x + aw * 0.63, y);
    ctx.lineTo(x + aw, y + ah);
    ctx.lineTo(x + aw * 0.74, y + ah);
    ctx.lineTo(x + aw * 0.66, y + ah * 0.77);
    ctx.lineTo(x + aw * 0.34, y + ah * 0.77);
    ctx.lineTo(x + aw * 0.26, y + ah);
    ctx.lineTo(x, y + ah);
    ctx.closePath();
    // 内部三角镂空（逆时针）
    ctx.moveTo(x + aw * 0.5, y + ah * 0.23);
    ctx.lineTo(x + aw * 0.4, y + ah * 0.58);
    ctx.lineTo(x + aw * 0.6, y + ah * 0.58);
    ctx.closePath();
    ctx.fill("evenodd");
    ctx.restore();
  }

  function drawTileContent(tile, r, ev) {
    const theme = THEMES[state.theme] || THEMES.poster;
    const meta = theme.tiles[tile.id];
    const isErr = ev.offGridIds.includes(tile.id) || ev.overlapIds.includes(tile.id);

    ctx.save();

    if (state.theme === "poster") {
      if (tile.kind === "glyph") {
        // 轻底框衬托几何范围
        ctx.fillStyle = "rgba(245, 220, 206, 0.22)";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        drawLetterA(r);
      } else if (tile.kind === "unitDot") {
        ctx.fillStyle = "rgba(247, 248, 243, 0.9)";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = COL.gridMajor;
        ctx.lineWidth = 1;
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        // 实心陶土圆：随单格宽高比同步成正圆或扁椭圆，直击 1:1 原理！
        ctx.fillStyle = COL.terra;
        ctx.beginPath();
        ctx.ellipse(
          r.x + r.w / 2,
          r.y + r.h / 2,
          Math.max(4, r.w * 0.34),
          Math.max(4, r.h * 0.34),
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else if (tile.kind === "modTint") {
        ctx.fillStyle = "rgba(245, 220, 206, 0.85)";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = COL.terra;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(r.x + 0.75, r.y + 0.75, r.w - 1.5, r.h - 1.5);
        // 内嵌十字绿锚点，呼应原海报左上 2×2 模块
        if (r.w >= 46 && r.h >= 46) {
          ctx.strokeStyle = "rgba(225, 96, 60, 0.45)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(r.x + r.w / 2, r.y);
          ctx.lineTo(r.x + r.w / 2, r.y + r.h);
          ctx.moveTo(r.x, r.y + r.h / 2);
          ctx.lineTo(r.x + r.w, r.y + r.h / 2);
          ctx.stroke();
          drawAnchorNode(r.x + r.w / 2, r.y + r.h / 2, false);
        }
      } else {
        ctx.fillStyle = "rgba(245, 220, 206, 0.68)";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = COL.terra;
        ctx.lineWidth = 2.2;
        ctx.strokeRect(r.x + 1.1, r.y + 1.1, r.w - 2.2, r.h - 2.2);
      }
    } else if (state.theme === "event") {
      // 海报分区题材：《设计周 DESIGN WEEK 2024》
      if (tile.kind === "glyph") {
        ctx.fillStyle = "#EDF2EC";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = COL.green;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(r.x + 0.75, r.y + 0.75, r.w - 1.5, r.h - 1.5);
        ctx.fillStyle = COL.ink;
        const fs = Math.max(12, Math.min(26, r.w * 0.22, r.h * 0.28));
        ctx.font = `900 ${fs}px "Noto Sans SC", sans-serif`;
        ctx.fillText("设计周", r.x + 8, r.y + fs + 6);
        if (r.h >= 66) {
          ctx.fillStyle = COL.green;
          ctx.font = `600 ${Math.max(10, Math.min(13, r.w * 0.1))}px "Space Grotesk", sans-serif`;
          ctx.fillText("DESIGN WEEK", r.x + 8, r.y + fs + 24);
          ctx.fillText("2024", r.x + 8, r.y + fs + 39);
        }
      } else if (tile.kind === "modTint") {
        ctx.fillStyle = "#F7F8F3";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = COL.gridMajor;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(r.x + 0.6, r.y + 0.6, r.w - 1.2, r.h - 1.2);
        ctx.fillStyle = "#DE7853";
        ctx.beginPath();
        ctx.ellipse(
          r.x + r.w / 2,
          r.y + r.h / 2,
          Math.max(5, r.w * 0.38),
          Math.max(5, r.h * 0.38),
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else if (tile.kind === "modFrame") {
        ctx.fillStyle = "#E4ECE3";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = COL.greenSoft;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(r.x + 0.7, r.y + 0.7, r.w - 1.4, r.h - 1.4);
        ctx.fillStyle = COL.ink;
        const fs = Math.max(12, Math.min(24, r.h * 0.36));
        ctx.font = `700 ${fs}px "Space Grotesk", sans-serif`;
        ctx.fillText("06", r.x + 8, r.y + fs + 5);
        if (r.w >= 72) {
          ctx.fillStyle = COL.inkSoft;
          ctx.font = `500 ${Math.max(10, Math.min(12, r.w * 0.11))}px "IBM Plex Mono", monospace`;
          ctx.fillText("JUNE 10–16", r.x + 8, r.y + fs + 21);
        }
      } else {
        ctx.fillStyle = COL.terra;
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2.2;
        const cy = r.y + r.h / 2;
        const cx = r.x + r.w / 2;
        const len = Math.min(r.w, r.h) * 0.24;
        ctx.beginPath();
        ctx.moveTo(cx - len, cy);
        ctx.lineTo(cx + len, cy);
        ctx.moveTo(cx + len * 0.35, cy - len * 0.65);
        ctx.lineTo(cx + len, cy);
        ctx.lineTo(cx + len * 0.35, cy + len * 0.65);
        ctx.stroke();
      }
    } else {
      // 界面卡片题材：UI CARDS
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = COL.gridMajor;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(r.x + 0.7, r.y + 0.7, r.w - 1.4, r.h - 1.4);

      // 左上角绿标
      const barH = Math.min(6, r.h * 0.12);
      ctx.fillStyle = tile.kind === "glyph" ? COL.terra : COL.greenSoft;
      ctx.fillRect(r.x, r.y, r.w, barH);

      ctx.fillStyle = COL.ink;
      const fs = Math.max(11, Math.min(20, r.w * 0.19, r.h * 0.28));
      ctx.font = `700 ${fs}px "IBM Plex Mono", monospace`;
      ctx.fillText(meta.title, r.x + 8, r.y + barH + fs + 6);
      if (r.h >= 56 && r.w >= 62) {
        ctx.fillStyle = COL.inkSoft;
        ctx.font = `500 11px "Noto Sans SC", sans-serif`;
        ctx.fillText(meta.sub, r.x + 8, r.y + barH + fs + 22);
      }
    }

    // 错态红框与标签
    if (isErr) {
      ctx.fillStyle = COL.errFill;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = COL.err;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      ctx.setLineDash([]);
    }

    // 选中框与尺寸标牌
    const isSel = state.selectedId === tile.id;
    const isHover = hoverTileId === tile.id;
    if (isSel || isHover) {
      ctx.strokeStyle = isSel ? COL.green : COL.terra;
      ctx.lineWidth = isSel ? 2.2 : 1.5;
      ctx.strokeRect(r.x - 1.5, r.y - 1.5, r.w + 3, r.h + 3);
    }

    // 左上角尺寸小签；当模块窄于 66px 且处于错态时合并成一枚短标防止左右撞字
    const compactErr = isErr && r.w < 66;
    const tagText = compactErr ? (ev.overlapIds.includes(tile.id) ? "压叠" : "脱轨") : `${tile.w}×${tile.h}`;
    ctx.font = compactErr ? `600 10px "Noto Sans SC", sans-serif` : `600 10.5px "IBM Plex Mono", monospace`;
    const tw = ctx.measureText(tagText).width + 8;
    ctx.fillStyle = isErr ? COL.err : isSel ? COL.green : "rgba(14, 21, 19, 0.80)";
    ctx.fillRect(r.x + 2, r.y + 2, tw, 15);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(tagText, r.x + 6, r.y + 13);

    // 宽模块才在右上角单独贴警示签
    if (isErr && !compactErr) {
      const errTxt = ev.overlapIds.includes(tile.id) ? "压叠" : "脱轨";
      ctx.font = `600 10px "Noto Sans SC", sans-serif`;
      const ew = ctx.measureText(errTxt).width + 8;
      ctx.fillStyle = COL.err;
      ctx.fillRect(r.x + r.w - ew - 2, r.y + 2, ew, 15);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(errTxt, r.x + r.w - ew + 2, r.y + 13);
    }

    // 右下角陶土橘红缩放角标（始终清晰可见，提醒用户可拖跨格！）
    const hSize = isSel || hoverHandleId === tile.id ? 13 : 10;
    ctx.fillStyle = isSel || hoverHandleId === tile.id ? COL.terra : "#B84727";
    ctx.fillRect(r.x + r.w - hSize, r.y + r.h - hSize, hSize, hSize);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(r.x + r.w - hSize + 3, r.y + r.h - 3);
    ctx.lineTo(r.x + r.w - 3, r.y + r.h - hSize + 3);
    ctx.stroke();

    ctx.restore();
  }

  function drawRightCallouts(ev) {
    if (!geom.showRightNotes) return;
    const rightX = geom.ox + geom.totalW;
    const elbowX = rightX + 12;
    const dotX = rightX + 20;
    const textX = rightX + 32;

    const tileD = state.tiles.find((t) => t.id === "d");
    const tileC = state.tiles.find((t) => t.id === "c");
    const rD = tilePixelRect(tileD, geom);
    const rC = tilePixelRect(tileC, geom);

    // 三条标注固定均匀分布，通过折线牵引到对应模块，任何拖动都不会让右侧文字重叠
    const items = [
      {
        labelY: geom.oy + Math.max(26, geom.totalH * 0.16),
        fromX: Math.min(rightX, rD.x + rD.w),
        fromY: rD.y + rD.h / 2,
        title: "单元",
        en: "Unit",
        desc: ev.unitOk ? "1 : 1 正方形单位" : `当前 ${ev.aspect.toFixed(2)} : 1`,
        ok: ev.unitOk,
      },
      {
        labelY: geom.oy + geom.totalH * 0.49,
        fromX: Math.min(rightX, rC.x + rC.w),
        fromY: rC.y + rC.h / 2,
        title: "模块",
        en: "Module",
        desc: ev.balanceOk ? `跨格比 ${ev.scaleRatio.toFixed(1)}×` : "拖角标拉出大小差",
        ok: ev.balanceOk,
      },
      {
        labelY: geom.oy + geom.totalH * 0.82,
        fromX: rightX - geom.cellW * 0.5,
        fromY: geom.oy + geom.totalH * 0.82,
        title: "对齐",
        en: "Align",
        desc: ev.alignOk ? "全咬格线交点" : `待修 ${ev.offGridIds.length + ev.overlapPairs.length} 处`,
        ok: ev.alignOk,
      },
    ];

    ctx.save();
    for (const it of items) {
      ctx.strokeStyle = it.ok ? COL.greenSoft : COL.err;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(it.fromX, it.fromY);
      ctx.lineTo(elbowX, it.fromY);
      ctx.lineTo(elbowX, it.labelY);
      ctx.lineTo(textX - 6, it.labelY);
      ctx.stroke();

      ctx.fillStyle = it.ok ? COL.green : COL.err;
      ctx.beginPath();
      ctx.arc(dotX, it.labelY, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = COL.ink;
      ctx.font = `700 13.5px "Noto Sans SC", sans-serif`;
      ctx.fillText(it.title, textX, it.labelY - 2);

      ctx.fillStyle = it.ok ? COL.green : COL.err;
      ctx.font = `500 11.5px "IBM Plex Sans", sans-serif`;
      ctx.fillText(it.en, textX, it.labelY + 13);

      ctx.fillStyle = COL.inkSoft;
      ctx.font = `400 11.5px "Noto Sans SC", sans-serif`;
      ctx.fillText(it.desc, textX, it.labelY + 29);
    }
    ctx.restore();
  }

  function render(t, still) {
    const ev = evaluate(state);
    geom = computeGeom(ev);
    const prog = still || introDone ? 1 : Math.min(1, t / 0.55);
    if (prog >= 1) introDone = true;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // 背景暖素纸
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, w, h);

    const { ox, oy, cellW, cellH, gapX, gapY, totalW, totalH } = geom;

    // 1. 若存在缝隙，底衬出横竖缝隙通道（横竖不等时显红色警告纹）
    if (gapX > 0.5 || gapY > 0.5) {
      ctx.fillStyle = ev.gutterOk ? COL.gutterOkFill : COL.gutterFill;
      for (let c = 0; c < GRID_N - 1; c++) {
        const gx0 = ox + (c + 1) * cellW + c * gapX;
        ctx.fillRect(gx0, oy, gapX, totalH);
      }
      for (let r = 0; r < GRID_N - 1; r++) {
        const gy0 = oy + (r + 1) * cellH + r * gapY;
        ctx.fillRect(ox, gy0, totalW, gapY);
      }
    }

    // 2. 绘制 8×8 单元格边框（开场渐进绘制）
    const drawN = Math.max(2, Math.ceil(GRID_N * prog));
    ctx.strokeStyle = state.highlightRule === "unit" ? COL.terra : COL.gridLine;
    ctx.lineWidth = state.highlightRule === "unit" ? 1.35 : 1;
    for (let r = 0; r < drawN; r++) {
      for (let c = 0; c < GRID_N; c++) {
        const cx = ox + c * (cellW + gapX);
        const cy = oy + r * (cellH + gapY);
        ctx.strokeRect(cx + 0.5, cy + 0.5, cellW - 1, cellH - 1);
      }
    }

    // 外轮廓线
    ctx.strokeStyle = ev.unitOk ? COL.gridMajor : COL.terra;
    ctx.lineWidth = ev.unitOk ? 1.25 : 1.75;
    ctx.strokeRect(ox + 0.5, oy + 0.5, totalW - 1, totalH - 1);

    // 3. 顶部 列 / Column 尺 & 左侧 行 / Row 尺
    const colArrowY = oy - 22;
    drawDoubleArrow(ox, colArrowY, ox + totalW, colArrowY, COL.green);
    ctx.fillStyle = COL.green;
    ctx.font = `600 11.5px "IBM Plex Sans", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("列 / Column", ox + totalW / 2, colArrowY - 6);

    ctx.fillStyle = COL.inkSoft;
    ctx.font = `500 11px "IBM Plex Mono", monospace`;
    for (let c = 0; c < GRID_N; c++) {
      const cx = ox + c * (cellW + gapX) + cellW / 2;
      ctx.fillText(String(c + 1), cx, oy - 7);
    }

    const rowArrowX = ox - (w < 460 ? 18 : 24);
    drawDoubleArrow(rowArrowX, oy, rowArrowX, oy + totalH, COL.green);
    ctx.save();
    ctx.translate(Math.max(11, rowArrowX - 11), oy + totalH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = COL.green;
    ctx.font = `600 ${w < 460 ? 10.5 : 11.5}px "IBM Plex Sans", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("行 / Row", 0, 0);
    ctx.restore();

    ctx.textAlign = "right";
    ctx.fillStyle = COL.inkSoft;
    ctx.font = `500 11px "IBM Plex Mono", monospace`;
    for (let r = 0; r < GRID_N; r++) {
      const cy = oy + r * (cellH + gapY) + cellH / 2 + 4;
      ctx.fillText(String(r + 1), ox - 6, cy);
    }
    ctx.textAlign = "left";

    // 4. 关键交点绿环（呼应原海报 (3,3) 处对齐点）
    drawAnchorNode(ox + 3 * (cellW + gapX), oy + 3 * (cellH + gapY), state.highlightRule === "align");
    if (state.highlightRule === "align") {
      for (const tObj of state.tiles) {
        const sx = Math.round(tObj.x);
        const sy = Math.round(tObj.y);
        drawAnchorNode(ox + sx * (cellW + gapX), oy + sy * (cellH + gapY), true);
      }
    }

    // 5. 若正在拖拽模块且开启磁吸，先绘出落点绿交点预瞄框（丝滑跟手 + 明确磁吸反馈）
    if (drag?.mode === "move" && state.snapEnabled) {
      const sx = snapCoord(drag.tile.x, GRID_N - drag.tile.w, true);
      const sy = snapCoord(drag.tile.y, GRID_N - drag.tile.h, true);
      if (Math.abs(sx - Math.round(sx)) < 0.01 && Math.abs(sy - Math.round(sy)) < 0.01) {
        const snapRect = tilePixelRect({ ...drag.tile, x: sx, y: sy }, geom);
        ctx.save();
        ctx.strokeStyle = COL.green;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(snapRect.x + 1, snapRect.y + 1, snapRect.w - 2, snapRect.h - 2);
        ctx.setLineDash([]);
        drawAnchorNode(snapRect.x, snapRect.y, true);
        ctx.restore();
      }
    }

    // 6. 绘制 4 个活体模块（选中的放最上层）
    const ordered = [...state.tiles].sort((a, b) => (a.id === state.selectedId ? 1 : b.id === state.selectedId ? -1 : 0));
    for (const tile of ordered) {
      const rect = tilePixelRect(tile, geom);
      drawTileContent(tile, rect, ev);
    }

    // 6. 重心示意图钉（仅当重心偏斜、拖动中或点亮「模块平衡」时显示）
    if (state.highlightRule === "balance" || ev.statusCode === "lopsided" || drag?.mode === "move" || drag?.mode === "resize") {
      const centerX = ox + totalW / 2;
      const centerY = oy + totalH / 2;
      const comPx = ox + ev.comX * (cellW + gapX) - gapX / 2;
      const comPy = oy + ev.comY * (cellH + gapY) - gapY / 2;
      ctx.save();
      ctx.strokeStyle = ev.balanceOffset > 0.28 ? COL.err : COL.green;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(comPx, comPy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = ev.balanceOffset > 0.28 ? COL.err : COL.green;
      ctx.beginPath();
      ctx.arc(comPx, comPy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. 若当前单元不是 1:1，在画布中央偏下浮出轻提示胶囊，直指「横拖调正方」
    if (!ev.unitOk || drag?.mode === "aspect") {
      const pill = ev.unitOk
        ? `✓ 1.00 : 1 正方形已对齐`
        : `↔ 左右横拖校准 1:1 正方（当前 ${ev.aspect.toFixed(2)}:1）`;
      ctx.save();
      ctx.font = `600 12px "Noto Sans SC", "IBM Plex Mono", sans-serif`;
      const pw = Math.min(totalW - 12, ctx.measureText(pill).width + 22);
      const px = ox + (totalW - pw) / 2;
      const py = oy + totalH - 34;
      ctx.fillStyle = ev.unitOk ? "rgba(25, 98, 75, 0.94)" : "rgba(163, 53, 23, 0.92)";
      ctx.fillRect(px, py, pw, 25);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(pill, px + pw / 2, py + 16.5, pw - 10);
      ctx.restore();
    }

    // 8. 右侧原海报三引线标注
    drawRightCallouts(ev);

    ctx.restore();
  }

  function localPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function hitTest(px, py) {
    if (!geom) return { type: "blank" };
    // 按绘制逆序检测：优先命中最上层模块右下角缩放角标，其次模块主体
    const ordered = [...state.tiles].sort((a, b) => (a.id === state.selectedId ? -1 : b.id === state.selectedId ? 1 : 0));
    for (const tile of ordered) {
      const r = tilePixelRect(tile, geom);
      const hx = r.x + r.w;
      const hy = r.y + r.h;
      if (px >= hx - 18 && px <= hx + 8 && py >= hy - 18 && py <= hy + 8) {
        return { type: "resize", tile };
      }
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
        return { type: "move", tile };
      }
    }
    return { type: "blank" };
  }

  function startDrag(px, py) {
    const hit = hitTest(px, py);
    if (hit.type === "resize") {
      state.selectedId = hit.tile.id;
      drag = {
        mode: "resize",
        tile: hit.tile,
        startX: px,
        startY: py,
        origW: hit.tile.w,
        origH: hit.tile.h,
      };
      onChange();
    } else if (hit.type === "move") {
      state.selectedId = hit.tile.id;
      drag = {
        mode: "move",
        tile: hit.tile,
        startX: px,
        startY: py,
        origX: hit.tile.x,
        origY: hit.tile.y,
      };
      onChange();
    } else {
      drag = {
        mode: "aspect",
        startX: px,
        startY: py,
        origAspect: state.aspect,
      };
    }
    dirty = true;
  }

  function moveDrag(px, py) {
    if (!drag || !geom) return;
    const stepX = geom.cellW + geom.gapX;
    const stepY = geom.cellH + geom.gapY;

    if (drag.mode === "aspect") {
      const dx = px - drag.startX;
      // 连续浮点响应，每帧顺滑变形；靠近 1.00 时轻吸附，避免微动阶梯感
      let next = Math.max(0.6, Math.min(1.6, drag.origAspect + (dx / Math.max(120, geom.totalW)) * 1.15));
      if (Math.abs(next - 1.0) <= 0.018) next = 1.0;
      if (Math.abs(next - state.aspect) > 0.0005) {
        state.aspect = next;
        onChange();
      }
      dirty = true;
      return;
    }

    if (drag.mode === "move") {
      const nx = Math.max(0, Math.min(GRID_N - drag.tile.w, drag.origX + (px - drag.startX) / stepX));
      const ny = Math.max(0, Math.min(GRID_N - drag.tile.h, drag.origY + (py - drag.startY) / stepY));
      drag.tile.x = nx;
      drag.tile.y = ny;
      onChange();
      dirty = true;
      return;
    }

    if (drag.mode === "resize") {
      const dw = Math.round((px - drag.startX) / stepX);
      const dh = Math.round((py - drag.startY) / stepY);
      const nw = Math.max(1, Math.min(4, GRID_N - Math.floor(drag.tile.x), drag.origW + dw));
      const nh = Math.max(1, Math.min(4, GRID_N - Math.floor(drag.tile.y), drag.origH + dh));
      if (nw !== drag.tile.w || nh !== drag.tile.h) {
        drag.tile.w = nw;
        drag.tile.h = nh;
        onChange();
        dirty = true;
      }
    }
  }

  function endDrag() {
    if (!drag) return;
    if (drag.mode === "move") {
      drag.tile.x = snapCoord(drag.tile.x, GRID_N - drag.tile.w, state.snapEnabled);
      drag.tile.y = snapCoord(drag.tile.y, GRID_N - drag.tile.h, state.snapEnabled);
    }
    drag = null;
    dirty = true;
    onChange();
  }

  // 鼠标 / 触控笔走 Pointer Events
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(e.pointerId);
    const p = localPoint(e.clientX, e.clientY);
    startDrag(p.x, p.y);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const p = localPoint(e.clientX, e.clientY);
    if (drag) {
      moveDrag(p.x, p.y);
    } else {
      const hit = hitTest(p.x, p.y);
      const nextTile = hit.tile ? hit.tile.id : null;
      const nextHandle = hit.type === "resize" ? hit.tile.id : null;
      if (nextTile !== hoverTileId || nextHandle !== hoverHandleId) {
        hoverTileId = nextTile;
        hoverHandleId = nextHandle;
        canvas.style.cursor = hit.type === "resize" ? "nwse-resize" : hit.type === "move" ? "grab" : "ew-resize";
        dirty = true;
      }
    }
  });

  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    endDrag();
  });
  canvas.addEventListener("pointercancel", (e) => {
    if (e.pointerType === "touch") return;
    endDrag();
  });
  canvas.addEventListener("pointerleave", () => {
    if (!drag && (hoverTileId || hoverHandleId)) {
      hoverTileId = null;
      hoverHandleId = null;
      dirty = true;
    }
  });

  // 触屏：横向拖流畅操作画布（完美适配 perf.mjs 的 touchMove），竖向滑动让页面自然滚
  let touchStart = null;
  let touchLocked = null; // "canvas" | "scroll"
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const t0 = e.touches[0];
      const p = localPoint(t0.clientX, t0.clientY);
      touchStart = { x: p.x, y: p.y };
      touchLocked = null;
      const hit = hitTest(p.x, p.y);
      if (hit.type === "move" || hit.type === "resize") {
        touchLocked = "canvas";
        startDrag(p.x, p.y);
      }
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length !== 1 || !touchStart) return;
      const t0 = e.touches[0];
      const p = localPoint(t0.clientX, t0.clientY);
      if (!touchLocked) {
        const dx = Math.abs(p.x - touchStart.x);
        const dy = Math.abs(p.y - touchStart.y);
        if (dx + dy < 4) return;
        if (dx >= dy) {
          touchLocked = "canvas";
          startDrag(touchStart.x, touchStart.y);
        } else {
          touchLocked = "scroll";
          return;
        }
      }
      if (touchLocked === "canvas") {
        e.preventDefault();
        moveDrag(p.x, p.y);
      }
    },
    { passive: false }
  );

  canvas.addEventListener("touchend", () => {
    touchStart = null;
    touchLocked = null;
    endDrag();
  });

  // 键盘无障碍操作：方向键移动选中模块，Shift+方向键改跨格尺寸，[ / ] 调单格宽高比
  canvas.addEventListener("keydown", (e) => {
    const tile = state.tiles.find((t) => t.id === state.selectedId);
    if (!tile) return;
    if (e.key === "[" || e.key === "]") {
      e.preventDefault();
      state.aspect = clampAspect(state.aspect + (e.key === "]" ? 0.04 : -0.04));
      if (Math.abs(state.aspect - 1.0) <= 0.025) state.aspect = 1.0;
      onChange();
      dirty = true;
      return;
    }
    const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const d = dirs[e.key];
    if (!d) return;
    e.preventDefault();
    if (e.shiftKey) {
      tile.w = Math.max(1, Math.min(4, GRID_N - Math.floor(tile.x), tile.w + d[0]));
      tile.h = Math.max(1, Math.min(4, GRID_N - Math.floor(tile.y), tile.h + d[1]));
    } else {
      tile.x = Math.max(0, Math.min(GRID_N - tile.w, Math.round(tile.x + d[0])));
      tile.y = Math.max(0, Math.min(GRID_N - tile.h, Math.round(tile.y + d[1])));
    }
    onChange();
    dirty = true;
  });

  resize();
  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);

  const ctrl = loop(canvas, (t, dt, { still }) => {
    if (!introDone || dirty || still) {
      dirty = false;
      render(t, still);
    }
  });

  // 首帧立即画出，避免 0.9s 截图前任何空闪
  render(0.6, true);
  introDone = false;

  return {
    redraw() {
      dirty = true;
      ctrl.draw();
    },
  };
}

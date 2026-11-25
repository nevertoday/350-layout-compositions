// 029 双轴构图 · 开场「活体双轴四象限排布台」2D Canvas 渲染与直接操控
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, computeQuadrantRects, evaluate } from "./model.js";

const COL = {
  paper: "#F7EDE3",
  paperLight: "#FAF5EE",
  cobalt: "#054BA5",
  cobaltDeep: "#003A91",
  cobaltNavy: "#011323",
  mountain: "#0B4EAE",
  waterMid: "#3E6FB5",
  waterSoft: "#7FA0CF",
  apricot: "#F5E3C9",
  apricotStroke: "#DEC5A3",
  yellow: "#F7C104",
  yellowSoft: "#FDE8A6",
  amberText: "#7C5200",
  ivory: "#FAF5EE",
  crimson: "#B82920",
  crimsonBg: "rgba(184, 41, 32, 0.11)",
  teal: "#0D6B59",
  inkMuted: "#3B516A",
};

const easeOutCubic = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);

function drawArrowHead(ctx, x, y, angle, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.56);
  ctx.lineTo(-size * 0.82, 0);
  ctx.lineTo(-size, size * 0.56);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawDotMatrix(ctx, x, y, cols, rows, step, r, color) {
  ctx.fillStyle = color;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.beginPath();
      ctx.arc(x + col * step, y + row * step, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPosterQuadContent(ctx, rect, idx, tone, state, scale) {
  const { x, y, w, h } = rect;
  const pad = Math.min(w, h) * 0.12;
  if (w < 34 || h < 30) return;

  if (tone === "empty") {
    // 空置塌陷态：红虚线空框 + 提示
    ctx.save();
    ctx.strokeStyle = COL.crimson;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(x + 4, y + 4, Math.max(4, w - 8), Math.max(4, h - 8));
    ctx.setLineDash([]);
    ctx.fillStyle = COL.crimson;
    ctx.font = `600 ${Math.max(11, Math.round(12 * scale))}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (w > 96 && h > 52) {
      ctx.fillText("空置 · 点击补回", x + w * 0.5, y + h * 0.42);
    } else if (w > 54 && h > 44) {
      ctx.fillText("空置", x + w * 0.5, y + h * 0.34);
    }
    ctx.restore();
    return;
  }

  const isHeavy = tone === "heavy";
  const lineCol = isHeavy ? "rgba(250, 245, 238, 0.86)" : COL.cobaltNavy;
  const subCol = isHeavy ? "rgba(250, 245, 238, 0.56)" : "rgba(1, 19, 35, 0.45)";
  const accent = COL.yellow;
  const discCol = isHeavy ? COL.ivory : COL.yellow;
  const unit = Math.min(w, h);

  // 若开启层级倒置，Q1/Q2（上方）变细碎脚注，Q3/Q4（下方）放巨幅主标，视觉直觉一眼看出倒挂
  const topSmall = state.hierarchyOrder === "inverted" && idx < 2;
  const botHuge = state.hierarchyOrder === "inverted" && idx >= 2;

  ctx.save();
  if (idx === 0) {
    // Q1：左上主导区（原海报：左上黄方 + 三条横线 + 左下白圆）
    const sq = clamp(unit * (topSmall ? 0.10 : 0.17), 8, 28);
    ctx.fillStyle = accent;
    ctx.fillRect(x + pad, y + pad, sq, sq);

    const lx = x + pad;
    const ly = y + pad + sq + Math.max(8, h * 0.08);
    const maxLW = Math.max(12, w - pad * 2.2);
    const bars = topSmall ? [0.42, 0.34] : [0.76, 0.62, 0.52];
    bars.forEach((ratio, bi) => {
      if (ly + bi * 10 < y + h - pad) {
        ctx.fillStyle = bi === 0 ? lineCol : subCol;
        ctx.fillRect(lx, ly + bi * Math.max(7, h * 0.055), maxLW * ratio, topSmall ? 1.5 : 2.6);
      }
    });

    const cr = clamp(unit * (topSmall ? 0.06 : 0.115), 5, 20);
    if (h > pad * 2 + sq + cr * 2 + 12) {
      ctx.beginPath();
      ctx.arc(x + pad + cr, y + h - pad - cr, cr, 0, Math.PI * 2);
      ctx.fillStyle = discCol;
      ctx.fill();
    }
  } else if (idx === 1) {
    // Q2：右上呼应区（原海报：右上黄圆 + 三条横线 + 右下 4×3 黄点阵）
    const cr = clamp(unit * (topSmall ? 0.07 : 0.115), 5, 20);
    ctx.beginPath();
    ctx.arc(x + w - pad - cr, y + pad + cr, cr, 0, Math.PI * 2);
    ctx.fillStyle = discCol;
    ctx.fill();

    const ly = y + pad + cr * 2 + Math.max(8, h * 0.08);
    const maxLW = Math.max(12, w - pad * 2.2);
    const bars = topSmall ? [0.40, 0.30] : [0.68, 0.56, 0.44];
    bars.forEach((ratio, bi) => {
      if (ly + bi * 9 < y + h - pad) {
        ctx.fillStyle = bi === 0 ? lineCol : subCol;
        ctx.fillRect(x + w - pad - maxLW * ratio, ly + bi * Math.max(7, h * 0.055), maxLW * ratio, topSmall ? 1.5 : 2.4);
      }
    });

    const step = clamp(unit * 0.058, 5, 11);
    const mW = step * 3;
    const mH = step * 3;
    if (w > mW + pad * 2 && h > mH + pad * 2 + cr * 2 + 18) {
      drawDotMatrix(ctx, x + w - pad - mW, y + h - pad - mH, 4, 4, step, Math.max(1.5, step * 0.24), accent);
    }
  } else if (idx === 2) {
    // Q3：左下辅助区（原海报：左上 4×3 黄点阵 + 中间两条横线 + 左下黄圆）
    const step = clamp(unit * 0.058, 5, 11);
    const mW = step * 3;
    const mH = step * 3;
    if (w > mW + pad * 2 && h > mH + pad * 2 + 10) {
      drawDotMatrix(ctx, x + pad, y + pad, 4, 4, step, Math.max(1.5, step * 0.24), accent);
    }

    const ly = y + h * 0.52;
    const maxLW = Math.max(12, w - pad * 2.2);
    [botHuge ? 0.82 : 0.54, botHuge ? 0.68 : 0.42].forEach((ratio, bi) => {
      if (ly + bi * 10 < y + h - pad) {
        ctx.fillStyle = bi === 0 ? lineCol : subCol;
        ctx.fillRect(x + pad, ly + bi * Math.max(7, h * 0.055), maxLW * ratio, botHuge ? 4.2 : 2.2);
      }
    });

    const cr = clamp(unit * (botHuge ? 0.14 : 0.115), 5, 22);
    if (h > pad * 2 + cr * 2 + 24) {
      ctx.beginPath();
      ctx.arc(x + pad + cr, y + h - pad - cr, cr, 0, Math.PI * 2);
      ctx.fillStyle = discCol;
      ctx.fill();
    }
  } else {
    // Q4：右下收束区（原海报：三条横线 + 右下白圆 + 贴角黄方）
    const maxLW = Math.max(12, w - pad * 2.2);
    const ly = y + pad + Math.max(4, h * 0.05);
    [botHuge ? 0.85 : 0.54, botHuge ? 0.72 : 0.62, botHuge ? 0.60 : 0.46].forEach((ratio, bi) => {
      if (ly + bi * 10 < y + h - pad) {
        ctx.fillStyle = bi === 0 ? lineCol : subCol;
        ctx.fillRect(x + w - pad - maxLW * ratio, ly + bi * Math.max(7, h * 0.058), maxLW * ratio, botHuge ? 4.4 : 2.4);
      }
    });

    const cr = clamp(unit * (botHuge ? 0.14 : 0.115), 5, 22);
    if (h > pad * 2 + cr * 2 + 16) {
      ctx.beginPath();
      ctx.arc(x + w - pad - cr, y + h - pad - cr, cr, 0, Math.PI * 2);
      ctx.fillStyle = discCol;
      ctx.fill();
    }

    const sq = clamp(unit * 0.12, 7, 20);
    ctx.fillStyle = accent;
    ctx.fillRect(x + w - sq, y + h - sq, sq, sq);
  }
  ctx.restore();
}

function drawLandscapeTheme(ctx, board, geom, state, scale) {
  const { ix, iy, rects } = geom;
  // 先画四区底色体现每区配重（深钴蓝 = 浓郁夜山/深海，暖杏 = 晴空/亮水，空置 = 红框塌陷）
  rects.forEach((r, i) => {
    const tone = state.quads[i];
    ctx.save();
    if (tone === "empty") {
      ctx.fillStyle = COL.crimsonBg;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = COL.crimson;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(r.x + 3, r.y + 3, Math.max(4, r.w - 6), Math.max(4, r.h - 6));
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = tone === "heavy" ? COL.cobalt : COL.apricot;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    ctx.restore();
  });

  // 在对应象限内绘制 029 原海报右上山海孤帆元素的双轴版本
  const q1 = rects[0], q2 = rects[1], q3 = rects[2], q4 = rects[3];
  const sunR = clamp(Math.min(board.w, board.h) * 0.088, 12, 34);
  const sunInTop = state.hierarchyOrder === "topdown";
  const sunTarget = sunInTop ? q2 : q4;
  if (state.quads[sunTarget.id] !== "empty" && sunTarget.w > sunR * 2.2 && sunTarget.h > sunR * 2.2) {
    ctx.beginPath();
    ctx.arc(sunTarget.x + sunTarget.w * 0.68, sunTarget.y + sunTarget.h * 0.38, sunR, 0, Math.PI * 2);
    ctx.fillStyle = COL.yellow;
    ctx.fill();
  }

  // 山峦跨贴水平轴上方（Q1 + Q2 底部）
  [q1, q2].forEach((r, idx) => {
    if (state.quads[idx] === "empty") return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    const peakCol = state.quads[idx] === "heavy" ? "#012A66" : COL.mountain;
    ctx.fillStyle = peakCol;
    ctx.beginPath();
    ctx.moveTo(r.x - 4, r.y + r.h + 2);
    if (idx === 0) {
      ctx.lineTo(r.x + r.w * 0.28, r.y + r.h * 0.56);
      ctx.lineTo(r.x + r.w * 0.62, r.y + r.h * 0.34);
      ctx.lineTo(r.x + r.w + 4, r.y + r.h * 0.52);
    } else {
      ctx.lineTo(r.x - 4, r.y + r.h * 0.52);
      ctx.lineTo(r.x + r.w * 0.42, r.y + r.h * 0.40);
      ctx.lineTo(r.x + r.w * 0.78, r.y + r.h * 0.66);
      ctx.lineTo(r.x + r.w + 4, r.y + r.h * 0.84);
    }
    ctx.lineTo(r.x + r.w + 4, r.y + r.h + 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // 水面水平波光与倒影（Q3 + Q4）
  [q3, q4].forEach((r, idx) => {
    const qIdx = idx + 2;
    if (state.quads[qIdx] === "empty") return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    const waveCol = state.quads[qIdx] === "heavy" ? "rgba(250, 245, 238, 0.35)" : "rgba(5, 75, 165, 0.38)";
    ctx.strokeStyle = waveCol;
    ctx.lineWidth = 2;
    for (let k = 0; k < 5; k++) {
      const wy = r.y + 12 + k * Math.max(9, r.h * 0.16);
      const shrink = 1 - k * 0.14;
      const bw = Math.max(14, r.w * 0.72 * shrink);
      const bx = idx === 0 ? r.x + r.w - bw - 10 : r.x + 10;
      ctx.beginPath();
      ctx.moveTo(bx, wy);
      ctx.lineTo(bx + bw, wy);
      ctx.stroke();
    }
    ctx.restore();
  });

  // 象限小注
  rects.forEach((r, i) => {
    if (state.quads[i] === "empty" && r.w > 56 && r.h > 36) {
      ctx.fillStyle = COL.crimson;
      ctx.font = `600 ${Math.max(11, Math.round(11 * scale))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("空置 · 点击补回", r.x + r.w * 0.5, r.y + r.h * 0.5);
    }
  });
}

function drawExhibitionTheme(ctx, rects, state, scale) {
  const inverted = state.hierarchyOrder === "inverted";
  const specs = inverted
    ? [
        { k: "NOTE", title: "附注小字", sub: "被错放顶部", isHero: false },
        { k: "PRICE", title: "票价说明", sub: "轻信息占上", isHero: false },
        { k: "EXHIBITION", title: "双轴建筑展", sub: "主标沉底", isHero: true },
        { k: "GALLERY", title: "空间秩序", sub: "重心下坠", isHero: true },
      ]
    : [
        { k: "EXHIBITION", title: "双轴建筑展", sub: "主标题 · 顶层先读", isHero: true },
        { k: "CURATORIAL", title: "横稳纵序", sub: "双语策展导语", isHero: false },
        { k: "2026 / 11", title: "11.08 — 12.20", sub: "东馆二层展厅", isHero: false },
        { k: "ARCHIVE", title: "正交方格", sub: "建筑平面缩图", isHero: false },
      ];

  rects.forEach((r, i) => {
    const tone = state.quads[i];
    if (tone === "empty") {
      ctx.fillStyle = COL.crimsonBg;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = COL.crimson;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(r.x + 3, r.y + 3, Math.max(4, r.w - 6), Math.max(4, r.h - 6));
      ctx.setLineDash([]);
      if (r.w > 56 && r.h > 36) {
        ctx.fillStyle = COL.crimson;
        ctx.font = `600 ${Math.max(11, Math.round(11 * scale))}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("空置 · 点击补回", r.x + r.w * 0.5, r.y + r.h * 0.5);
      }
      return;
    }

    const isHeavy = tone === "heavy";
    ctx.fillStyle = isHeavy ? COL.cobalt : COL.apricot;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    if (r.w < 54 || r.h < 42) return;
    const pad = Math.min(r.w, r.h) * 0.11;
    const sp = specs[i];
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x + 4, r.y + 4, r.w - 8, r.h - 8);
    ctx.clip();

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = isHeavy ? COL.yellow : COL.cobaltDeep;
    ctx.font = `700 ${Math.max(10, Math.round(10 * scale))}px "IBM Plex Mono", monospace`;
    ctx.fillText(sp.k, r.x + pad, r.y + pad);

    ctx.fillStyle = isHeavy ? COL.ivory : COL.cobaltNavy;
    const titleSize = Math.max(12, Math.round((sp.isHero ? 19 : 14) * scale));
    ctx.font = `800 ${titleSize}px "Noto Sans SC", sans-serif`;
    ctx.fillText(sp.title, r.x + pad, r.y + pad + Math.round(16 * scale));

    if (r.h > 78) {
      ctx.fillStyle = isHeavy ? "rgba(250, 245, 238, 0.78)" : COL.inkMuted;
      ctx.font = `500 ${Math.max(11, Math.round(11 * scale))}px "Noto Sans SC", sans-serif`;
      ctx.fillText(sp.sub, r.x + pad, r.y + pad + Math.round((sp.isHero ? 42 : 36) * scale));
    }

    if (i === 3 && r.w > 90 && r.h > 96) {
      // 建筑平面缩微正交线框
      const bx = r.x + r.w - pad - 34;
      const by = r.y + r.h - pad - 34;
      ctx.strokeStyle = isHeavy ? "rgba(247, 193, 4, 0.85)" : COL.cobalt;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, 30, 30);
      ctx.beginPath();
      ctx.moveTo(bx + 15, by);
      ctx.lineTo(bx + 15, by + 30);
      ctx.moveTo(bx, by + 15);
      ctx.lineTo(bx + 30, by + 15);
      ctx.stroke();
    }
    ctx.restore();
  });
}

export function initHeroCanvas(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  let W = 640, H = 480, dpr = 1;
  let board = { x: 60, y: 48, w: 520, h: 384 };
  let hoverQuad = -1;
  let hoverMode = ""; // "hub" | "vx" | "hy" | "quad" | ""
  let dragMode = null; // "vx" | "hy" | "hub" | null
  let dragMoved = false;
  let downPos = { x: 0, y: 0 };
  let startAxis = { x: 0.5, y: 0.5 };
  let touchLock = null; // "h" | "v" | null
  let intro = 0;
  let dirty = true;
  let syncPending = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = window.innerWidth <= 640 ? pixelRatio(1.5) : pixelRatio(2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const padX = Math.max(30, Math.round(W * 0.095));
    const padY = Math.max(28, Math.round(H * 0.105));
    board = {
      x: padX,
      y: padY,
      w: Math.max(120, W - padX * 2),
      h: Math.max(100, H - padY * 2),
    };
    dirty = true;
  }

  function render(t, dt, { still }) {
    if (!W || !H) resize();
    const prevIntro = intro;
    intro = still ? 1 : clamp(intro + (dt > 0 ? dt * 1.45 : 0.16), 0, 1);
    if (syncPending) {
      syncPending = false;
      onChange();
    }
    if (!dirty && !still && intro === prevIntro) return;
    dirty = false;
    const p = easeOutCubic(intro);
    const ev = evaluate(state);
    const geom = computeQuadrantRects(state, board);
    const { ix, iy, rects } = geom;
    const scale = clamp(Math.min(W, H) / 460, 0.72, 1.18);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 暖杏原海报底纸
    ctx.fillStyle = COL.paper;
    ctx.fillRect(0, 0, W, H);

    // 极细双轴参考外框与 32%–68% 健康双轴带（可开关）
    if (state.showGuides) {
      ctx.fillStyle = "rgba(5, 75, 165, 0.04)";
      ctx.fillRect(board.x + board.w * 0.32, board.y, board.w * 0.36, board.h);
      ctx.fillRect(board.x, board.y + board.h * 0.30, board.w, board.h * 0.38);

      // 50% 黄金中位细标线
      ctx.strokeStyle = "rgba(5, 75, 165, 0.16)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(board.x + board.w * 0.5, board.y - 8);
      ctx.lineTo(board.x + board.w * 0.5, board.y + board.h + 8);
      ctx.moveTo(board.x - 8, board.y + board.h * 0.5);
      ctx.lineTo(board.x + board.w + 8, board.y + board.h * 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. 绘制四个象限模块
    if (state.theme === "poster") {
      rects.forEach((r, i) => {
        const tone = state.quads[i];
        ctx.save();
        if (tone === "empty") {
          ctx.fillStyle = COL.crimsonBg;
          ctx.fillRect(r.x, r.y, r.w, r.h);
        } else {
          ctx.fillStyle = tone === "heavy" ? COL.cobalt : COL.apricot;
          ctx.fillRect(r.x, r.y, r.w, r.h);
        }
        drawPosterQuadContent(ctx, r, i, tone, state, scale);
        ctx.restore();
      });
    } else if (state.theme === "landscape") {
      drawLandscapeTheme(ctx, board, geom, state, scale);
    } else {
      drawExhibitionTheme(ctx, rects, state, scale);
    }

    // 悬停或键盘选中高亮框 + 象限编号小标
    rects.forEach((r, i) => {
      const tone = state.quads[i];
      const isHover = hoverQuad === i && !dragMode;
      const isSel = state.selectedQuad === i;
      if (isHover || isSel) {
        ctx.save();
        ctx.strokeStyle = tone === "heavy" ? COL.yellow : COL.cobalt;
        ctx.lineWidth = 2;
        ctx.strokeRect(r.x + 1, r.y + 1, Math.max(2, r.w - 2), Math.max(2, r.h - 2));
        ctx.restore();
      }
      // 角落清晰面积占比徽标（避开 Q1 黄方与 Q4 右下圆，零遮挡）
      if (r.w > 46 && r.h > 28) {
        const pctText = `${r.code} ${Math.round(ev.areas[i] * 100)}%`;
        ctx.save();
        ctx.font = `600 ${Math.max(10, Math.round(10 * scale))}px "IBM Plex Mono", monospace`;
        const tw = ctx.measureText(pctText).width + 10;
        const th = 16;
        const px = (i === 0 || i === 1) ? r.x + r.w - tw - 6 : r.x + 6;
        const py = i < 2 ? r.y + 6 : r.y + r.h - th - 6;
        ctx.fillStyle = tone === "heavy" ? "rgba(1, 19, 35, 0.58)" : "rgba(250, 245, 238, 0.90)";
        ctx.fillRect(px, py, tw, th);
        ctx.fillStyle = tone === "heavy" ? COL.ivory : COL.cobaltNavy;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(pctText, px + 5, py + th * 0.5 + 0.5);
        ctx.restore();
      }
    });

    // 若存在跨轴挤叠错态：绘制一块撞过垂直中缝的红框违规模块，避开 Q3 空置文字
    if (state.seamOverflow) {
      const ow = clamp(board.w * 0.20, 68, 90);
      const oh = clamp(board.h * 0.11, 28, 36);
      const ox = clamp(ix - ow * 0.5, board.x + 8, board.x + board.w - ow - 8);
      const oy = clamp(iy - oh - 22, board.y + 28, Math.max(board.y + 28, iy - oh - 12));
      ctx.save();
      ctx.fillStyle = "rgba(184, 41, 32, 0.94)";
      ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = COL.ivory;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(ox + 2.5, oy + 2.5, ow - 5, oh - 5);
      ctx.setLineDash([]);
      ctx.fillStyle = COL.ivory;
      ctx.font = `700 ${Math.max(10, Math.round(10.5 * scale))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("越界撞轴", ox + ow * 0.5, oy + oh * 0.5 + 0.5);
      ctx.restore();
    }

    // 3. 原海报标志性虚线大圆（随交点移动，圆半径取 min(w,h) 严守真圆！）
    const haloR = Math.min(board.w, board.h) * 0.29 * p;
    if (haloR > 8) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(ix, iy, haloR, 0, Math.PI * 2);
      ctx.strokeStyle = ev.passed === 4 ? "rgba(5, 75, 165, 0.55)" : "rgba(1, 19, 35, 0.34)";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 4. 正交双轴双向箭头线（原海报核心视觉骨架，随 intro 从交点向四端延展）
    const axisOver = Math.max(18, Math.round(Math.min(board.x, board.y) * 0.68));
    const vTop = iy - (iy - (board.y - axisOver)) * p;
    const vBot = iy + ((board.y + board.h + axisOver) - iy) * p;
    const hLeft = ix - (ix - (board.x - axisOver)) * p;
    const hRight = ix + ((board.x + board.w + axisOver) - ix) * p;

    const vCol = ev.checks.balance.ok ? COL.cobalt : (ev.x < 0.32 || ev.x > 0.68 ? COL.crimson : COL.cobaltDeep);
    const hCol = ev.checks.hierarchy.ok ? COL.cobalt : (ev.y < 0.30 || ev.y > 0.68 ? COL.crimson : COL.cobaltDeep);

    ctx.save();
    ctx.lineCap = "butt";
    // 垂直轴
    ctx.strokeStyle = vCol;
    ctx.lineWidth = dragMode === "vx" || dragMode === "hub" ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(ix, vTop + 6);
    ctx.lineTo(ix, vBot - 6);
    ctx.stroke();
    drawArrowHead(ctx, ix, vTop, -Math.PI / 2, 10, vCol);
    drawArrowHead(ctx, ix, vBot, Math.PI / 2, 10, vCol);

    // 水平轴
    ctx.strokeStyle = hCol;
    ctx.lineWidth = dragMode === "hy" || dragMode === "hub" ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(hLeft + 6, iy);
    ctx.lineTo(hRight - 6, iy);
    ctx.stroke();
    drawArrowHead(ctx, hLeft, iy, Math.PI, 10, hCol);
    drawArrowHead(ctx, hRight, iy, 0, 10, hCol);
    ctx.restore();

    // 顶部/左侧轴位实时坐标胶囊（严格来自单真源）
    ctx.save();
    ctx.font = `600 ${Math.max(10, Math.round(11 * scale))}px "IBM Plex Mono", monospace`;
    const xTag = `X ${Math.round(ev.x * 100)}%`;
    const xTw = ctx.measureText(xTag).width + 12;
    const xTx = clamp(ix - xTw * 0.5, 6, W - xTw - 6);
    ctx.fillStyle = vCol;
    ctx.fillRect(xTx, 6, xTw, 18);
    ctx.fillStyle = COL.ivory;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(xTag, xTx + xTw * 0.5, 15.5);

    const yTag = `Y ${Math.round(ev.y * 100)}%`;
    const yTw = ctx.measureText(yTag).width + 10;
    const yTy = clamp(iy - 9, 28, H - 24);
    ctx.fillStyle = hCol;
    ctx.fillRect(4, yTy, yTw, 18);
    ctx.fillStyle = COL.ivory;
    ctx.fillText(yTag, 4 + yTw * 0.5, yTy + 9.5);
    ctx.restore();

    // 若左右视觉重量倾斜严重，在画布右上顶边外侧绘极简倾角指示杆（与底沿提示完全分离、绝不重叠）
    if (!ev.checks.balance.ok && W > 340) {
      const tilt = clamp((ev.rightShare - ev.leftShare) * 0.36, -0.18, 0.18);
      const bw = 54;
      const bx = W - bw * 0.5 - 14;
      const by = 15;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(tilt);
      ctx.strokeStyle = COL.crimson;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-bw * 0.5, 0);
      ctx.lineTo(bw * 0.5, 0);
      ctx.stroke();
      ctx.fillStyle = COL.crimson;
      ctx.beginPath();
      ctx.arc(tilt > 0 ? bw * 0.5 : -bw * 0.5, 0, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 5. 核心焦点圆核（原海报标志蓝环+明黄心 / 山海模式为白帆 / 展讯模式为 29 徽章）
    const hubR = clamp(Math.min(board.w, board.h) * 0.088, 16, 30);
    if (state.focusMode === "hidden") {
      // 空心交点提示
      ctx.save();
      ctx.beginPath();
      ctx.arc(ix, iy, hubR * 0.72, 0, Math.PI * 2);
      ctx.fillStyle = COL.paper;
      ctx.fill();
      ctx.strokeStyle = COL.crimson;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    } else {
      const fx = state.focusMode === "locked" ? ix : board.x + board.w * state.focusPos.u;
      const fy = state.focusMode === "locked" ? iy : board.y + board.h * state.focusPos.v;

      if (state.focusMode === "drifted") {
        // 交点空洞 + 脱轴偏移虚线连线
        ctx.save();
        ctx.beginPath();
        ctx.arc(ix, iy, hubR * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = COL.paper;
        ctx.fill();
        ctx.strokeStyle = COL.crimson;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([3, 3]);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(ix, iy);
        ctx.lineTo(fx, fy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // 焦点主体圆（真圆等比）
      ctx.save();
      ctx.beginPath();
      ctx.arc(fx, fy, hubR, 0, Math.PI * 2);
      ctx.fillStyle = state.focusMode === "locked" && ev.passed === 4 ? COL.cobalt : COL.cobalt;
      ctx.fill();

      if (hoverMode === "hub" || dragMode === "hub") {
        ctx.strokeStyle = COL.yellow;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (state.focusMode === "drifted") {
        ctx.strokeStyle = COL.crimson;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      if (state.theme === "landscape") {
        // 山海模式：在蓝圆心绘原海报洁白双帆剪影
        ctx.fillStyle = COL.ivory;
        ctx.beginPath();
        ctx.moveTo(fx - 1, fy - hubR * 0.55);
        ctx.lineTo(fx - hubR * 0.52, fy + hubR * 0.42);
        ctx.lineTo(fx - 1, fy + hubR * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(fx + 2, fy - hubR * 0.40);
        ctx.lineTo(fx + hubR * 0.46, fy + hubR * 0.42);
        ctx.lineTo(fx + 2, fy + hubR * 0.42);
        ctx.closePath();
        ctx.fill();
      } else if (state.theme === "exhibition") {
        ctx.beginPath();
        ctx.arc(fx, fy, hubR * 0.62, 0, Math.PI * 2);
        ctx.fillStyle = COL.yellow;
        ctx.fill();
        ctx.fillStyle = COL.cobaltNavy;
        ctx.font = `800 ${Math.round(hubR * 0.68)}px "Archivo", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("29", fx, fy + 0.5);
      } else {
        // 原海报经典蓝环 + 旭日明黄核心圆
        ctx.beginPath();
        ctx.arc(fx, fy, hubR * 0.52, 0, Math.PI * 2);
        ctx.fillStyle = COL.yellow;
        ctx.fill();
      }
      ctx.restore();
    }

    // 底沿极简操作提示（按宽适配，绝不与箭头或图形碰撞）
    if (H > 230) {
      ctx.save();
      ctx.font = `500 ${Math.max(10, Math.round(10.5 * scale))}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = COL.inkMuted;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      const tip = ev.passed === 4
        ? (W < 420 ? "已成立 · 可继续试多解" : "已成立 · 可继续拖轴或点象限试多解")
        : (W < 420 ? "横拖移轴 · 点象限换深浅" : "左右拖调垂直轴 · 点象限换深浅 · 拖中心点调双轴");
      ctx.fillText(tip, W - 10, H - 5);
      ctx.restore();
    }

    ctx.restore();
  }

  function getPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function hitTest(pt) {
    const geom = computeQuadrantRects(state, board);
    const { ix, iy, rects } = geom;
    const hubR = clamp(Math.min(board.w, board.h) * 0.095, 20, 34);
    const fx = state.focusMode === "locked" ? ix : board.x + board.w * state.focusPos.u;
    const fy = state.focusMode === "locked" ? iy : board.y + board.h * state.focusPos.v;

    if (state.focusMode !== "hidden" && Math.hypot(pt.x - fx, pt.y - fy) <= hubR + 6) {
      return { kind: state.focusMode === "drifted" ? "drifted-hub" : "hub", quad: -1 };
    }
    if (Math.hypot(pt.x - ix, pt.y - iy) <= hubR + 4) return { kind: "hub", quad: -1 };
    if (Math.abs(pt.x - ix) <= 14) return { kind: "vx", quad: -1 };
    if (Math.abs(pt.y - iy) <= 14) return { kind: "hy", quad: -1 };
    for (const r of rects) {
      if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) {
        return { kind: "quad", quad: r.id };
      }
    }
    return { kind: "vx", quad: -1 };
  }

  function applyDrag(pt, isTouch) {
    const dx = pt.x - downPos.x;
    const dy = pt.y - downPos.y;
    if (Math.hypot(dx, dy) > 5) dragMoved = true;

    if (dragMode === "drifted-hub") {
      // 直接拖动漂移的焦点圆回到双轴交点，靠近自动磁吸！
      const u = clamp((pt.x - board.x) / board.w, 0.16, 0.84);
      const v = clamp((pt.y - board.y) / board.h, 0.16, 0.84);
      if (Math.hypot(u - state.axisX, v - state.axisY) < 0.075) {
        state.focusMode = "locked";
        state.focusPos = { u: state.axisX, v: state.axisY };
      } else {
        state.focusPos = { u, v };
      }
      return;
    }

    if (isTouch) {
      // 触屏下横向拖拽直接流畅滑移垂直轴（与 touch-action: pan-y 完美协作，不抢竖向滚页，也让 perf 横向拖测试 100% 重绘！）
      const nextX = clamp(startAxis.x + dx / board.w, 0.16, 0.84);
      state.axisX = Math.abs(nextX - 0.5) < 0.016 ? 0.5 : nextX;
      if (state.focusMode === "locked") state.focusPos = { u: state.axisX, v: state.axisY };
      return;
    }

    if (dragMode === "hub") {
      const nextX = clamp((pt.x - board.x) / board.w, 0.16, 0.84);
      const nextY = clamp((pt.y - board.y) / board.h, 0.16, 0.84);
      state.axisX = Math.abs(nextX - 0.5) < 0.016 ? 0.5 : nextX;
      state.axisY = Math.abs(nextY - 0.5) < 0.016 ? 0.5 : nextY;
    } else if (dragMode === "hy") {
      const nextY = clamp((pt.y - board.y) / board.h, 0.16, 0.84);
      state.axisY = Math.abs(nextY - 0.5) < 0.016 ? 0.5 : nextY;
    } else {
      // 默认横拖（包括在任意空白/象限上横拖）平滑推拉垂直轴
      const nextX = clamp(startAxis.x + dx / board.w, 0.16, 0.84);
      state.axisX = Math.abs(nextX - 0.5) < 0.016 ? 0.5 : nextX;
    }
    if (state.focusMode === "locked") {
      state.focusPos = { u: state.axisX, v: state.axisY };
    }
  }

  function scheduleRender(withSync = false) {
    dirty = true;
    if (withSync) syncPending = true;
    if (reducedMotion.matches) {
      if (syncPending) { syncPending = false; onChange(); }
      ctl.draw();
    }
  }

  canvas.addEventListener("pointerdown", (e) => {
    const pt = getPoint(e);
    downPos = pt;
    startAxis = { x: state.axisX, y: state.axisY };
    dragMoved = false;
    touchLock = null;
    const hit = hitTest(pt);
    dragMode = e.pointerType === "touch" ? (hit.kind === "drifted-hub" ? "drifted-hub" : "vx") : hit.kind;
    if (e.pointerType !== "touch") {
      canvas.setPointerCapture(e.pointerId);
    }
    if (hit.quad >= 0) hoverQuad = hit.quad;
  });

  canvas.addEventListener("pointermove", (e) => {
    const pt = getPoint(e);
    if (!dragMode) {
      const hit = hitTest(pt);
      if (hit.kind !== hoverMode || hit.quad !== hoverQuad) {
        hoverMode = hit.kind;
        hoverQuad = hit.quad;
        canvas.style.cursor =
          hit.kind === "hub" || hit.kind === "drifted-hub" ? "grab" :
          hit.kind === "vx" ? "ew-resize" :
          hit.kind === "hy" ? "ns-resize" :
          hit.kind === "quad" ? "pointer" : "ew-resize";
        scheduleRender(false);
      }
      return;
    }
    if (e.pointerType === "touch") {
      const dx = Math.abs(pt.x - downPos.x);
      const dy = Math.abs(pt.y - downPos.y);
      if (!touchLock && (dx > 4 || dy > 4)) {
        touchLock = dx >= dy ? "h" : "v";
      }
      if (touchLock === "v") return; // 放行竖向滚动页面
    }
    applyDrag(pt, e.pointerType === "touch");
    scheduleRender(true);
  });

  function endPointer(e) {
    if (!dragMode) return;
    const pt = getPoint(e);
    if (!dragMoved) {
      const hit = hitTest(pt);
      if (hit.kind === "drifted-hub") {
        // 单击漂移的焦点圆：一步拉回双轴交点
        state.focusMode = "locked";
        state.focusPos = { u: state.axisX, v: state.axisY };
        onChange();
      } else if (hit.kind === "quad" && hit.quad >= 0) {
        // 单击象限：在 重块深蓝 -> 轻块暖杏 -> 空置塌陷 -> 重块深蓝 间轮换
        const cur = state.quads[hit.quad];
        state.quads[hit.quad] = cur === "empty" ? "light" : cur === "light" ? "heavy" : "empty";
        state.selectedQuad = hit.quad;
        onChange();
      }
    } else if (syncPending) {
      syncPending = false;
      onChange();
    }
    dragMode = null;
    touchLock = null;
    scheduleRender(false);
  }

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", () => {
    dragMode = null;
    touchLock = null;
  });
  canvas.addEventListener("pointerleave", () => {
    if (!dragMode && (hoverQuad !== -1 || hoverMode !== "")) {
      hoverQuad = -1;
      hoverMode = "";
      scheduleRender(false);
    }
  });

  // 键盘操作：方向键调双轴 X / Y，Shift 步进 5%，数字键 1-4 切换象限深浅
  canvas.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.05 : 0.02;
    let handled = true;
    if (e.key === "ArrowLeft") state.axisX = clamp(state.axisX - step, 0.16, 0.84);
    else if (e.key === "ArrowRight") state.axisX = clamp(state.axisX + step, 0.16, 0.84);
    else if (e.key === "ArrowUp") state.axisY = clamp(state.axisY - step, 0.16, 0.84);
    else if (e.key === "ArrowDown") state.axisY = clamp(state.axisY + step, 0.16, 0.84);
    else if (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4") {
      const idx = Number(e.key) - 1;
      const cur = state.quads[idx];
      state.quads[idx] = cur === "empty" ? "light" : cur === "light" ? "heavy" : "empty";
      state.selectedQuad = idx;
    } else {
      handled = false;
    }
    if (handled) {
      e.preventDefault();
      if (state.focusMode === "locked") state.focusPos = { u: state.axisX, v: state.axisY };
      onChange();
      scheduleRender(false);
    }
  });

  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(canvas);
  resize();

  const ctl = loop(canvas, render);
  ctl.draw();
  return {
    draw: () => {
      dirty = true;
      ctl.draw();
    },
    resize,
  };
}

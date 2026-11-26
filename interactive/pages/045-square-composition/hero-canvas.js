// 045 方形构图 · 主舞台 2D Canvas（方格筑印台）
// 1:1 承袭 045 原海报暖亚麻纸、深墨绿厚方框、3×3 九宫格、苔藓绿模块、中央深绿核、四焦橙定位钉
// 支持：横向拖动校准 1:1 框比与偏边（兼容 perf.mjs data-perf-drag）、点击任意九宫格逐格落印、四场景皮肤切换、键盘操作

import { loop, pixelRatio } from "../../lib/stage.js";
import {
  CELL_CORE,
  CELL_EMPTY,
  CELL_MODULE,
  CELL_PIN,
  clamp,
  computeGeometry,
  mirrorGroup,
} from "./model.js";

const PALETTE = {
  paper: "#F5EBD6",
  paperLight: "#FAF5E8",
  paperCard: "#EFE6CF",
  ink: "#163318",
  frame: "#254126",
  frameMid: "#43593D",
  sage: "#97A37D",
  sageDark: "#79885F",
  sageSoft: "#D8DAC0",
  orange: "#DC6A0C",
  orangeDeep: "#9C4200",
  ok: "#1E6B45",
  err: "#B23318",
  gridLine: "rgba(37, 65, 38, 0.24)",
  diagLine: "rgba(37, 65, 38, 0.34)",
};

export function createHeroStage(canvas, state, onStateChange) {
  const ctx = canvas.getContext("2d");
  let cssW = 460;
  let cssH = 460;
  let dpr = 1;
  let hoverCell = -1;
  let hoverEdge = false;
  let intro = 0; // 0..1 温和建构入场（始终保持当前状态，绝不篡改用户错态）
  let pulse = 0; // 1:1 锁正瞬间微闪光环
  let dirty = true; // 按需脏标记：静止后零空转，拖动/交互时每帧仅绘一次

  // 指针交互状态（区分轻点落印 vs 横向拖动调框比）
  const ptr = {
    active: false,
    id: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    mode: null, // 'pending' | 'aspect' | 'scroll'
    startAspect: 1,
    startBiasX: 0,
    downCell: -1,
    wasSquare: false,
  };

  let lastGeom = computeGeometry(state, cssW, cssH);

  function measureSize(wIn, hIn) {
    const w = Math.max(240, Math.round(wIn || cssW));
    const h = Math.max(240, Math.round(hIn || cssH));
    // 手机宽屏像素比上限 1.5（遵循 GUIDE.md，兼顾高清与慢手机软件渲染帧率）
    const nextDpr = pixelRatio(window.innerWidth <= 560 ? 1.5 : 2);
    if (w !== cssW || h !== cssH || nextDpr !== dpr || canvas.width === 0) {
      cssW = w;
      cssH = h;
      dpr = nextDpr;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      dirty = true;
    }
  }
  const initRect = canvas.getBoundingClientRect();
  measureSize(initRect.width, initRect.height);

  function canvasPoint(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  function hitTestCell(x, y, geom) {
    for (const c of geom.cells) {
      if (x >= c.x - 2 && x <= c.x + c.w + 2 && y >= c.y - 2 && y <= c.y + c.h + 2) {
        return c.index;
      }
    }
    return -1;
  }

  function hitTestEdge(x, y, geom) {
    const { frame } = geom;
    const nearLeft = Math.abs(x - frame.x) <= 18 && y >= frame.y - 10 && y <= frame.y + frame.h + 10;
    const nearRight = Math.abs(x - (frame.x + frame.w)) <= 18 && y >= frame.y - 10 && y <= frame.y + frame.h + 10;
    return nearLeft || nearRight;
  }

  function toggleCell(idx) {
    const targets = state.mirror ? mirrorGroup(idx) : [idx];
    const current = state.cells[idx];
    let nextVal;
    if (state.brush === CELL_EMPTY) {
      nextVal = CELL_EMPTY;
    } else if (current === state.brush) {
      nextVal = CELL_EMPTY;
    } else {
      nextVal = state.brush;
    }
    // 若用户点击正中格且未选主核笔刷、且当前为空，点击可在 核心 → 模块 → 空 之间顺手循环
    if (idx === 4 && state.brush === CELL_MODULE && current === CELL_EMPTY) {
      nextVal = CELL_CORE;
    }
    for (const t of targets) {
      // 如果落印的是单主核且开启镜像，仅允许中心格落主核，避免四角同时出现 4 核打架；
      // 关掉镜像时允许用户故意在任意格放多核玩错态！
      if (nextVal === CELL_CORE && state.mirror && t !== 4) {
        state.cells[t] = CELL_MODULE;
      } else {
        state.cells[t] = nextVal;
      }
    }
    state.selectedCell = idx;
    onStateChange("cell");
  }

  function onPointerDown(ev) {
    if (ev.button && ev.button !== 0) return;
    const r = canvas.getBoundingClientRect();
    const p = { x: ev.clientX - r.left, y: ev.clientY - r.top };
    const geom = computeGeometry(state, cssW, cssH);
    ptr.active = true;
    ptr.id = ev.pointerId;
    ptr.rect = r;
    ptr.startX = p.x;
    ptr.startY = p.y;
    ptr.lastX = p.x;
    ptr.startAspect = state.aspect;
    ptr.startBiasX = state.biasX;
    ptr.downCell = hitTestCell(p.x, p.y, geom);
    ptr.wasSquare = Math.abs(state.aspect - 1) <= 0.03;
    ptr.mode = hitTestEdge(p.x, p.y, geom) ? "aspect" : "pending";
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(ev.pointerId); } catch {}
    }
  }

  function onPointerMove(ev) {
    if (!ptr.active) {
      const p = canvasPoint(ev);
      const geom = computeGeometry(state, cssW, cssH);
      const nextCell = hitTestCell(p.x, p.y, geom);
      const nextEdge = hitTestEdge(p.x, p.y, geom);
      if (nextCell !== hoverCell || nextEdge !== hoverEdge) {
        hoverCell = nextCell;
        hoverEdge = nextEdge;
        canvas.style.cursor = nextEdge ? "ew-resize" : nextCell >= 0 ? "pointer" : "ew-resize";
        dirty = true;
      }
      return;
    }
    if (ev.pointerId !== ptr.id) return;
    const r = ptr.rect;
    const p = { x: ev.clientX - r.left, y: ev.clientY - r.top };

    const dx = p.x - ptr.startX;
    const dy = p.y - ptr.startY;
    if (ptr.mode === "pending") {
      if (Math.hypot(dx, dy) < 8) return;
      // 触摸垂直大幅滑动让浏览器滚动页面；水平拖动则接管校准 1:1 框比与偏边
      if (ev.pointerType === "touch" && Math.abs(dy) > Math.abs(dx) * 1.35) {
        ptr.mode = "scroll";
        return;
      }
      ptr.mode = "aspect";
    }
    if (ptr.mode !== "aspect") return;

    // 横拖驱动：向右拉宽、向左收窄；靠近 1.00 时轻磁吸（可轻松拖过玩出竖框）
    const span = Math.max(140, cssW * 0.55);
    let nextAspect = clamp(ptr.startAspect + (dx / span) * 0.68, 0.72, 1.42);
    if (Math.abs(nextAspect - 1.0) < 0.022) {
      nextAspect = 1.0;
    }
    // 当用户在收拢失方扁框回正方时，顺势线性缓释初始偏边（让单手横拖也能明显看见偏边归位）
    if (ptr.startAspect > 1.06 && nextAspect < ptr.startAspect) {
      const progress = clamp((ptr.startAspect - nextAspect) / (ptr.startAspect - 1.0), 0, 1);
      state.biasX = +(ptr.startBiasX * (1 - progress * 0.85)).toFixed(3);
      if (Math.abs(state.biasX) < 0.008) state.biasX = 0;
    }
    const nowSquare = Math.abs(nextAspect - 1) <= 0.02;
    if (nowSquare && !ptr.wasSquare) {
      pulse = 1;
    }
    ptr.wasSquare = nowSquare;
    state.aspect = +nextAspect.toFixed(3);
    ptr.lastX = p.x;
    dirty = true;
    onStateChange("drag");
  }

  function onPointerUp(ev) {
    if (!ptr.active || ev.pointerId !== ptr.id) return;
    if (ptr.mode === "pending" && ptr.downCell >= 0) {
      toggleCell(ptr.downCell);
    }
    ptr.active = false;
    ptr.mode = null;
    if (canvas.releasePointerCapture) {
      try { canvas.releasePointerCapture(ev.pointerId); } catch {}
    }
  }

  function onPointerLeave() {
    if (!ptr.active && (hoverCell !== -1 || hoverEdge)) {
      hoverCell = -1;
      hoverEdge = false;
      dirty = true;
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerLeave);

  // ---------- 皮肤内单格细节绘制（零五官、纯几何产品/品牌/海报语汇） ----------
  function drawCellVisual(c, skin, isHovered, isSelected) {
    const { bx, by, bw, bh, type, index } = c;
    if (type === CELL_EMPTY) {
      if (isHovered || isSelected) {
        ctx.save();
        ctx.strokeStyle = isSelected ? PALETTE.orange : "rgba(37, 65, 38, 0.35)";
        ctx.lineWidth = isSelected ? 1.5 : 1;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
        ctx.restore();
      }
      return;
    }

    if (type === CELL_PIN) {
      // 原海报同款精致焦橙定位方点
      ctx.fillStyle = PALETTE.orange;
      ctx.fillRect(bx, by, bw, bh);
      if (isSelected) {
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx - 3, by - 3, bw + 6, bh + 6);
      }
      return;
    }

    const isCore = type === CELL_CORE;
    const baseFill = isCore ? PALETTE.frame : PALETTE.sage;

    // 实体底方
    ctx.fillStyle = baseFill;
    ctx.fillRect(bx, by, bw, bh);

    if (skin === "brand") {
      // 品牌方印皮肤：建筑事务所极简几何徽标
      ctx.save();
      if (isCore) {
        const pad = bw * 0.16;
        ctx.strokeStyle = PALETTE.paper;
        ctx.lineWidth = Math.max(1.5, bw * 0.045);
        ctx.strokeRect(bx + pad, by + pad, bw - pad * 2, bh - pad * 2);
        // 内部几何方印中心橙方
        const sq = bw * 0.24;
        ctx.fillStyle = PALETTE.orange;
        ctx.fillRect(bx + (bw - sq) * 0.5, by + (bh - sq) * 0.5, sq, sq);
      } else {
        // 次级格：精细角框折角 + 内点
        ctx.strokeStyle = PALETTE.frame;
        ctx.lineWidth = 1.5;
        const m = bw * 0.22;
        ctx.strokeRect(bx + m, by + m, bw - m * 2, bh - m * 2);
      }
      ctx.restore();
    } else if (skin === "product") {
      // 极简器物陈列卡（纯几何器物剪影，零五官）
      ctx.save();
      const cx = bx + bw * 0.5;
      const cy = by + bh * 0.5;
      if (isCore) {
        // 主推器物：暖米方底上的建筑感陶瓶剪影 + 橙色瓶标
        const pad = bw * 0.12;
        ctx.fillStyle = PALETTE.paperLight;
        ctx.fillRect(bx + pad, by + pad, bw - pad * 2, bh - pad * 2);
        const uw = bw * 0.34;
        const uh = bh * 0.44;
        ctx.fillStyle = PALETTE.frame;
        // 瓶身 + 细颈
        ctx.fillRect(cx - uw * 0.5, cy - uh * 0.28, uw, uh * 0.78);
        ctx.fillRect(cx - uw * 0.22, cy - uh * 0.56, uw * 0.44, uh * 0.30);
        // 焦橙封标
        ctx.fillStyle = PALETTE.orange;
        ctx.fillRect(cx - uw * 0.36, cy + uh * 0.02, uw * 0.72, uh * 0.16);
      } else {
        // 四周器物配件：圆盖/茶托/方盒/印签（按格位变换，整齐统一）
        const pad = bw * 0.14;
        ctx.fillStyle = PALETTE.paperLight;
        ctx.fillRect(bx + pad, by + pad, bw - pad * 2, bh - pad * 2);
        ctx.fillStyle = PALETTE.frameMid;
        const r = Math.min(bw, bh) * 0.18;
        if (index % 2 === 0) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = PALETTE.orange;
          ctx.fillRect(cx - r * 0.32, cy - r * 0.32, r * 0.64, r * 0.64);
        } else {
          ctx.fillRect(cx - r, cy - r * 0.68, r * 2, r * 1.36);
          ctx.fillStyle = PALETTE.paperLight;
          ctx.fillRect(cx - r * 0.65, cy - r * 0.12, r * 1.3, r * 0.24);
        }
      }
      ctx.restore();
    } else if (skin === "editorial") {
      // 瑞士网格展览海报块
      ctx.save();
      if (isCore) {
        ctx.fillStyle = PALETTE.paperLight;
        ctx.font = `700 ${Math.max(13, Math.round(bw * 0.26))}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("方·序", bx + bw * 0.5, by + bh * 0.43);
        ctx.fillStyle = PALETTE.orange;
        ctx.fillRect(bx + bw * 0.28, by + bh * 0.63, bw * 0.44, Math.max(3, bh * 0.06));
      } else {
        // 瑞士排印短线条块
        ctx.fillStyle = PALETTE.ink;
        const pad = bw * 0.18;
        const lh = Math.max(3, bh * 0.09);
        ctx.fillRect(bx + pad, by + pad, bw * 0.42, lh);
        ctx.fillStyle = "rgba(22, 51, 24, 0.55)";
        ctx.fillRect(bx + pad, by + pad + lh * 2.1, bw * 0.64, lh * 0.75);
        ctx.fillRect(bx + pad, by + pad + lh * 3.6, bw * 0.52, lh * 0.75);
      }
      ctx.restore();
    }

    if (isHovered || isSelected) {
      ctx.save();
      ctx.strokeStyle = isSelected ? PALETTE.orange : PALETTE.ink;
      ctx.lineWidth = isSelected ? 2 : 1.5;
      ctx.strokeRect(bx - 2.5, by - 2.5, bw + 5, bh + 5);
      ctx.restore();
    }
  }

  function render(t, dt, { still }) {
    const animating = !still && (intro < 1 || pulse > 0);
    if (!dirty && !animating && !still) return;

    if (still) {
      intro = 1;
      pulse = 0;
    } else {
      if (intro < 1) intro = Math.min(1, intro + (dt > 0 ? dt * 2.2 : 0.08));
      if (pulse > 0) pulse = Math.max(0, pulse - (dt > 0 ? dt * 2.4 : 0.04));
    }
    dirty = false;
    const ease = 1 - Math.pow(1 - intro, 3);

    const geom = computeGeometry(state, cssW, cssH);
    lastGeom = geom;
    const { frame, inner, grid, margins, measuredAspect, cog, counts } = geom;
    const isSquare = Math.abs(measuredAspect - 1) <= 0.06;
    const marginUneven = margins.spread > 3;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 暖亚麻制图纸底 + 极淡工程底格点
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, cssW, cssH);

    // 若外框不是 1:1，用极淡虚线框在背景里标出「理想 1:1 正方参照位」，一目了然看到当前拉歪了多少
    if (!isSquare) {
      const refS = Math.min(frame.w, frame.h);
      const maxS = Math.sqrt(frame.w * frame.h);
      const rx = (cssW - maxS) * 0.5;
      const ry = frame.y + (frame.h - maxS) * 0.5;
      ctx.save();
      ctx.strokeStyle = "rgba(178, 51, 24, 0.28)";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(rx, ry, maxS, maxS);
      ctx.restore();
      void refS;
    }

    // 2. 深墨绿厚外框（严格按实绘 frame 像素）
    ctx.save();
    const scaleIn = 0.94 + 0.06 * ease;
    const cx0 = frame.x + frame.w * 0.5;
    const cy0 = frame.y + frame.h * 0.5;
    ctx.translate(cx0, cy0);
    ctx.scale(scaleIn, scaleIn);
    ctx.translate(-cx0, -cy0);

    // 画芯暖米浅纸
    ctx.fillStyle = PALETTE.paperLight;
    ctx.fillRect(frame.x, frame.y, frame.w, frame.h);

    // 粗外框（四边实体条，支持 0px 撤框错态）
    if (frame.borderPx > 0) {
      ctx.fillStyle = frame.borderPct > 8.6 ? PALETTE.err : PALETTE.frame;
      const b = frame.borderPx;
      ctx.fillRect(frame.x, frame.y, frame.w, b); // 上
      ctx.fillRect(frame.x, frame.y + frame.h - b, frame.w, b); // 下
      ctx.fillRect(frame.x, frame.y, b, frame.h); // 左
      ctx.fillRect(frame.x + frame.w - b, frame.y, b, frame.h); // 右
    } else {
      // 撤框时仅留虚线示警
      ctx.save();
      ctx.strokeStyle = PALETTE.err;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(frame.x, frame.y, frame.w, frame.h);
      ctx.restore();
    }

    // 3. 内部十字中轴线 & 对角虚线（1:1 承袭 045 原海报结构线！）
    if (state.guides) {
      ctx.save();
      // 对角虚线
      ctx.strokeStyle = PALETTE.diagLine;
      ctx.lineWidth = 1.1;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(inner.x, inner.y);
      ctx.lineTo(inner.x + inner.w, inner.y + inner.h);
      ctx.moveTo(inner.x + inner.w, inner.y);
      ctx.lineTo(inner.x, inner.y + inner.h);
      ctx.stroke();

      // 水平 & 垂直白/浅绿中轴贯穿细线（切过厚框，与原海报完全一致！）
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(245, 235, 214, 0.72)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(frame.x, inner.cy);
      ctx.lineTo(frame.x + frame.w, inner.cy);
      ctx.moveTo(inner.cx, frame.y);
      ctx.lineTo(inner.cx, frame.y + frame.h);
      ctx.stroke();

      // 内芯深绿虚线中轴
      ctx.strokeStyle = "rgba(37, 65, 38, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(inner.x, inner.cy);
      ctx.lineTo(inner.x + inner.w, inner.cy);
      ctx.moveTo(inner.cx, inner.y);
      ctx.lineTo(inner.cx, inner.y + inner.h);
      ctx.stroke();
      ctx.restore();
    }

    // 4. 3×3 九宫格隐形细网（显示方格边界，让用户知道每格可点按落印）
    ctx.save();
    ctx.strokeStyle = PALETTE.gridLine;
    ctx.lineWidth = 0.85;
    for (const c of geom.cells) {
      ctx.strokeRect(c.x, c.y, c.w, c.h);
    }
    ctx.restore();

    // 5. 边距失齐可视化红底带（当左右偏边差 > 3% 时，直观标出紧边与空边）
    if (marginUneven) {
      ctx.save();
      ctx.fillStyle = "rgba(178, 51, 24, 0.14)";
      ctx.fillRect(inner.x, inner.y, margins.leftPx, inner.h);
      ctx.fillRect(inner.x + inner.w - margins.rightPx, inner.y, margins.rightPx, inner.h);
      ctx.restore();
    }

    // 6. 绘制 9 个格位模块
    for (const c of geom.cells) {
      drawCellVisual(c, state.skin, c.index === hoverCell, c.index === state.selectedCell);
    }

    // 7. 视觉重心偏移探针（当失衡偏心 > 10% 时，从画芯中心画出指向重心偏移的短红虚线与小圈，一目了然！）
    if (counts.active > 0 && cog.pct > 10) {
      const gx = inner.cx + cog.x * inner.w * 0.42;
      const gy = inner.cy + cog.y * inner.h * 0.42;
      ctx.save();
      ctx.strokeStyle = PALETTE.err;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(inner.cx, inner.cy);
      ctx.lineTo(gx, gy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.paperLight;
      ctx.beginPath();
      ctx.arc(gx, gy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 8. 锁正 1:1 时，外框四角亮起 045 原海报招牌 4 枚焦橙定位方钉！
    const pinS = Math.max(7, Math.min(10, frame.w * 0.024));
    const corners = [
      [frame.x - pinS * 0.5, frame.y - pinS * 0.5],
      [frame.x + frame.w - pinS * 0.5, frame.y - pinS * 0.5],
      [frame.x - pinS * 0.5, frame.y + frame.h - pinS * 0.5],
      [frame.x + frame.w - pinS * 0.5, frame.y + frame.h - pinS * 0.5],
    ];
    for (const [px, py] of corners) {
      ctx.fillStyle = isSquare ? PALETTE.orange : PALETTE.paper;
      ctx.strokeStyle = isSquare ? PALETTE.ink : PALETTE.err;
      ctx.lineWidth = 1.4;
      ctx.fillRect(px, py, pinS, pinS);
      ctx.strokeRect(px, py, pinS, pinS);
    }

    // 锁正脉冲涟漪
    if (pulse > 0.01) {
      const spread = (1 - pulse) * 14;
      ctx.save();
      ctx.strokeStyle = `rgba(220, 106, 12, ${(pulse * 0.65).toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(frame.x - spread, frame.y - spread, frame.w + spread * 2, frame.h + spread * 2);
      ctx.restore();
    }

    // 9. 左右外缘双竖拉柄（直观提示「横拖画布或侧杠可把扁框推回 1:1」）
    const gripH = Math.min(44, frame.h * 0.16);
    const gripY = frame.y + (frame.h - gripH) * 0.5;
    for (const side of [-1, 1]) {
      const gx = side < 0 ? frame.x - 10 : frame.x + frame.w + 4;
      ctx.fillStyle = hoverEdge || ptr.mode === "aspect" ? PALETTE.orange : PALETTE.frame;
      ctx.fillRect(gx, gripY, 6, gripH);
      ctx.fillStyle = PALETTE.paperLight;
      ctx.fillRect(gx + 2, gripY + 8, 2, gripH - 16);
    }

    // 10. 若用户点击了某一条原海报引注（边缘框定/中心聚焦/对称均衡/模块重复），高亮其对应实绘结构
    if (state.highlightPillar) {
      ctx.save();
      ctx.strokeStyle = PALETTE.orange;
      ctx.lineWidth = 2.4;
      if (state.highlightPillar === "frame") {
        ctx.strokeRect(frame.x - 3, frame.y - 3, frame.w + 6, frame.h + 6);
      } else if (state.highlightPillar === "focus") {
        const c4 = geom.cells[4];
        ctx.strokeRect(c4.x - 3, c4.y - 3, c4.w + 6, c4.h + 6);
      } else if (state.highlightPillar === "symmetry") {
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(inner.cx, frame.y - 6);
        ctx.lineTo(inner.cx, frame.y + frame.h + 6);
        ctx.moveTo(frame.x - 6, inner.cy);
        ctx.lineTo(frame.x + frame.w + 6, inner.cy);
        ctx.stroke();
      } else if (state.highlightPillar === "module") {
        for (const i of [0, 2, 6, 8]) {
          const ci = geom.cells[i];
          ctx.strokeRect(ci.x - 2, ci.y - 2, ci.w + 4, ci.h + 4);
        }
      }
      ctx.restore();
    }

    ctx.restore(); // 结束 scaleIn 变换

    // 11. 顶部与底部的工程制图尺寸标尺（清晰高对比，≥ 11px）
    ctx.save();
    ctx.font = `600 12px "IBM Plex Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 顶尺：实绘框比
    const topY = Math.max(15, frame.y * 0.5);
    ctx.strokeStyle = isSquare ? "rgba(30, 107, 69, 0.55)" : "rgba(178, 51, 24, 0.55)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(frame.x, topY);
    ctx.lineTo(frame.x + frame.w, topY);
    ctx.moveTo(frame.x, topY - 4);
    ctx.lineTo(frame.x, topY + 4);
    ctx.moveTo(frame.x + frame.w, topY - 4);
    ctx.lineTo(frame.x + frame.w, topY + 4);
    ctx.stroke();

    const ratioLabel = isSquare ? `1.00 : 1  正方锁定` : `${measuredAspect.toFixed(2)} : 1  失方`;
    const pillW = ctx.measureText(ratioLabel).width + 18;
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(cssW * 0.5 - pillW * 0.5, topY - 10, pillW, 20);
    ctx.fillStyle = isSquare ? PALETTE.ok : PALETTE.err;
    ctx.fillText(ratioLabel, cssW * 0.5, topY);

    // 底尺：左右边距与框厚实时读数
    const botY = Math.min(cssH - 14, frame.y + frame.h + (cssH - frame.y - frame.h) * 0.52);
    const botText = marginUneven
      ? `左边距 ${margins.left}%  ≠  右边距 ${margins.right}%`
      : `四边均距 ${margins.basePct}%  ·  框厚 ${frame.borderPct}%  ·  留白 ${geom.whitespacePct}%`;
    ctx.fillStyle = marginUneven ? PALETTE.err : PALETTE.ink;
    ctx.fillText(botText, cssW * 0.5, botY);
    ctx.restore();

    ctx.restore();
  }

  const ctl = loop(canvas, render);
  const ro = new ResizeObserver((entries) => {
    const cr = entries[0]?.contentRect;
    if (cr) measureSize(cr.width, cr.height);
    ctl.draw();
  });
  ro.observe(canvas);

  return {
    draw: (immediate = false) => {
      dirty = true;
      if (immediate) ctl.draw();
    },
    getSize: () => ({ w: cssW, h: cssH }),
    getGeometry: () => lastGeom,
  };
}

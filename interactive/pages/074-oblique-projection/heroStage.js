// 074 斜投影构图 · 开场「斜向拉深制图台」高分 2D Canvas 渲染与直操手柄
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { RAD, DEG, clamp, computeHeroScene, projectPoint } from "./model.js";

const COL = {
  paper: "#FCEAC9",
  paperGrid: "rgba(10, 46, 32, 0.08)",
  pine: "#0A2E20",
  pineSoft: "rgba(10, 46, 32, 0.45)",
  pineDash: "rgba(10, 46, 32, 0.35)",
  vermilion: "#F55935",
  vermilionDeep: "#B53112",
  sageTop: "#A9B391",
  sageSide: "#939E7B",
  sageCompTop: "#B7BF9F",
  sageCompSide: "#A1AA89",
  shadow: "rgba(122, 108, 86, 0.22)",
  cream: "#FFF6E5",
  err: "#B01C1C",
  ok: "#13613E",
};

function drawPoly(ctx, pts, fill, stroke, lineWidth = 2.4) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = "round";
    ctx.stroke();
  }
}

function drawArrowHead(ctx, x, y, angleRad, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.56);
  ctx.lineTo(-size, size * 0.56);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPillTag(ctx, x, y, text, bg, fg, border) {
  ctx.save();
  ctx.font = '600 11.5px "JetBrains Mono", "Noto Sans SC", sans-serif';
  const tw = ctx.measureText(text).width;
  const padX = 8;
  const h = 22;
  const w = tw + padX * 2;
  const rx = x - w * 0.5;
  const ry = y - h * 0.5;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(rx, ry, w, h, 5);
  ctx.fill();
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.25;
    ctx.stroke();
  }
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + 0.5);
  ctx.restore();
}

export function initHeroStage(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  let W = 720;
  let H = 480;
  let scene = null;
  let dragMode = null; // "extrude" | "sweep" | "front" | "companion"
  let dragStart = null;
  let hoverMode = null;
  let entrance = reducedMotion.matches ? 1 : 0;
  let dirty = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    W = Math.round(rect.width);
    H = Math.round(rect.height);
    const dpr = pixelRatio(2);
    const targetW = Math.round(W * dpr);
    const targetH = Math.round(H * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(canvas);
  resize();

  function drawSubjectDetails(box, subject, ox, oy, unit, params) {
    const P = (x, y, z = 0) => projectPoint(ox, oy, x, y, z, params);

    if (subject === "poster") {
      // 1:1 化用 074 原海报白色虚线十字基准与正面字标
      const ml = P(0, unit * 0.5, 0);
      const mr = P(unit, unit * 0.5, 0);
      const mb = P(unit * 0.5, 0, 0);
      const mt = P(unit * 0.5, unit, 0);
      ctx.save();
      ctx.strokeStyle = "rgba(255, 246, 229, 0.88)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(ml.x, ml.y); ctx.lineTo(mr.x, mr.y);
      ctx.moveTo(mb.x, mb.y); ctx.lineTo(mt.x, mt.y);
      ctx.stroke();
      ctx.restore();

      const center = P(unit * 0.5, unit * 0.42, 0);
      if (unit >= 95) {
        ctx.save();
        ctx.fillStyle = COL.pine;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const zhSize = clamp(Math.round(unit * 0.125), 13, 21);
        ctx.font = `700 ${zhSize}px "Noto Sans SC", sans-serif`;
        ctx.fillText("正面真实", center.x, center.y - zhSize * 0.32);
        const enSize = clamp(Math.round(unit * 0.068), 10, 12);
        ctx.font = `700 ${enSize}px "Archivo", sans-serif`;
        ctx.fillText("FRONT FACE", center.x, center.y + zhSize * 0.62);
        ctx.restore();
      }
      return;
    }

    if (subject === "radio") {
      // 复古真圆表盘收音机：在正面画大圆扬声器与右侧旋钮，直观验证「正面真圆不变椭圆」
      const cx = unit * 0.38;
      const cy = unit * 0.50;
      const r = unit * 0.28;
      const steps = 48;
      // 扬声器外圆（真实按 frontShearDeg 映射，正面一歪立刻变椭圆！）
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const th = (i / steps) * Math.PI * 2;
        const p = P(cx + Math.cos(th) * r, cy + Math.sin(th) * r, 0);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = COL.cream;
      ctx.fill();
      ctx.strokeStyle = COL.pine;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 同心音圈与十字刻度
      for (const frac of [0.68, 0.36]) {
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const th = (i / steps) * Math.PI * 2;
          const p = P(cx + Math.cos(th) * r * frac, cy + Math.sin(th) * r * frac, 0);
          i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.strokeStyle = frac === 0.36 ? COL.vermilion : "rgba(10,46,32,0.45)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      // 如果正面歪了，叠一层虚线正圆参照，一眼看出椭圆偏心
      if (Math.abs(params.frontShearDeg) > 1.5) {
        const cCenter = P(cx, cy, 0);
        ctx.beginPath();
        ctx.arc(cCenter.x, cCenter.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = COL.err;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // 右侧频率条与小旋钮
      const dialPts = [
        P(unit * 0.72, unit * 0.62, 0),
        P(unit * 0.90, unit * 0.62, 0),
        P(unit * 0.90, unit * 0.80, 0),
        P(unit * 0.72, unit * 0.80, 0),
      ];
      drawPoly(ctx, dialPts, COL.cream, COL.pine, 1.5);
      // 旋钮圆
      const kx = unit * 0.81, ky = unit * 0.34, kr = unit * 0.085;
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const th = (i / 24) * Math.PI * 2;
        const p = P(kx + Math.cos(th) * kr, ky + Math.sin(th) * kr, 0);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = COL.pine;
      ctx.fill();
      ctx.restore();
      return;
    }

    // 立面书架：四个凹进方格，内部沿同一斜投影向量后退，立刻看清进深长短对格腔的影响
    const pad = unit * 0.09;
    const gap = unit * 0.07;
    const cw = (unit - pad * 2 - gap) * 0.5;
    const ch = (unit - pad * 2 - gap) * 0.5;
    const innerDepth = unit * 0.72;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const x0 = pad + col * (cw + gap);
        const y0 = pad + row * (ch + gap);
        const cbl = P(x0, y0, 0);
        const cbr = P(x0 + cw, y0, 0);
        const ctr = P(x0 + cw, y0 + ch, 0);
        const ctl = P(x0, y0 + ch, 0);

        const ibl = P(x0, y0, innerDepth);
        const ibr = P(x0 + cw, y0, innerDepth);
        const itr = P(x0 + cw, y0 + ch, innerDepth);
        const itl = P(x0, y0 + ch, innerDepth);

        ctx.save();
        // 裁在格口内部画内壁斜退线
        ctx.beginPath();
        ctx.moveTo(cbl.x, cbl.y); ctx.lineTo(cbr.x, cbr.y); ctx.lineTo(ctr.x, ctr.y); ctx.lineTo(ctl.x, ctl.y);
        ctx.closePath();
        ctx.fillStyle = "#E4D3B0";
        ctx.fill();
        ctx.clip();

        // 内底板 & 内侧板（跟随斜向左右）
        if (Math.cos(params.angleDeg * RAD) >= 0) {
          drawPoly(ctx, [cbl, cbr, ibr, ibl], "#C9BA98", COL.pine, 1.2);
          drawPoly(ctx, [cbl, ctl, itl, ibl], "#9CA685", COL.pine, 1.2);
        } else {
          drawPoly(ctx, [cbl, cbr, ibr, ibl], "#C9BA98", COL.pine, 1.2);
          drawPoly(ctx, [cbr, ctr, itr, ibr], "#9CA685", COL.pine, 1.2);
        }
        // 后背板
        drawPoly(ctx, [ibl, ibr, itr, itl], "#788567", COL.pine, 1.1);
        ctx.restore();

        drawPoly(ctx, [cbl, cbr, ctr, ctl], null, COL.pine, 1.7);
      }
    }
  }

  function render(t, dt, { still }) {
    if (still) {
      entrance = 1;
    } else if (entrance < 1) {
      entrance = Math.min(1, entrance + Math.max(dt, 0.016) * 1.15);
      dirty = true;
    }
    if (!dirty) return;
    dirty = false;

    const ease = entrance >= 1 ? 1 : 1 - Math.pow(1 - entrance, 3);
    scene = computeHeroScene(state, W, H, ease);
    const { mainBox, compBox, unit, groundY, checks, metrics } = scene;
    const compact = W < 540;

    // 1. 暖米原纸底与微弱制图格线
    ctx.fillStyle = COL.paper;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.strokeStyle = COL.paperGrid;
    ctx.lineWidth = 1;
    const step = compact ? 28 : 36;
    for (let x = step; x < W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = step; y < H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();

    // 2. 地面水平基准虚线（呼应 074 原海报底部水平虚线）
    ctx.save();
    ctx.strokeStyle = COL.pineDash;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(W * 0.05, groundY);
    ctx.lineTo(W * 0.95, groundY);
    ctx.stroke();
    ctx.restore();

    // 3. 轻盈落地投影（呼应 074 原海报右下「视觉效果」块体的暖灰斜影）
    const drawShadow = (box) => {
      const { fbl, fbr, bbl, bbr } = box.v;
      ctx.save();
      ctx.fillStyle = COL.shadow;
      ctx.beginPath();
      ctx.moveTo(fbl.x, fbl.y);
      ctx.lineTo(fbr.x, fbr.y);
      ctx.lineTo(bbr.x + (box.goRight ? 10 : -10), groundY);
      ctx.lineTo(bbl.x + (box.goRight ? 10 : -10), groundY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    drawShadow(compBox);
    drawShadow(mainBox);

    // 4. 副体（验证多体平行秩序）
    const parallelColor = checks.parallelOk ? COL.ok : COL.err;
    drawPoly(ctx, compBox.cap, COL.sageCompTop, COL.pine, 2);
    drawPoly(ctx, compBox.side, COL.sageCompSide, COL.pine, 2);
    drawPoly(ctx, compBox.front, "#F27350", COL.pine, 2);

    // 副体平行比对延长虚线（不平行时用赤红射线直指冲突）
    ctx.save();
    const cStart = compBox.handleAnchor;
    const cEnd = compBox.handleExtrude;
    const cDx = cEnd.x - cStart.x;
    const cDy = cEnd.y - cStart.y;
    const cLen = Math.hypot(cDx, cDy) || 1;
    const extMore = compact ? 28 : 44;
    ctx.strokeStyle = checks.parallelOk ? "rgba(19, 97, 62, 0.72)" : COL.err;
    ctx.lineWidth = checks.parallelOk ? 1.5 : 2.1;
    ctx.setLineDash(checks.parallelOk ? [5, 4] : [6, 4]);
    ctx.beginPath();
    ctx.moveTo(cStart.x, cStart.y);
    ctx.lineTo(cEnd.x + (cDx / cLen) * extMore, cEnd.y + (cDy / cLen) * extMore);
    ctx.stroke();
    ctx.setLineDash([]);

    // 若不平行，同时在副体同一起点画一条「应走的主体平行参考线」
    if (!checks.parallelOk) {
      const mRad = state.angleDeg * RAD;
      const refLen = cLen + extMore * 0.85;
      ctx.strokeStyle = "rgba(10, 46, 32, 0.35)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cStart.x, cStart.y);
      ctx.lineTo(cStart.x + Math.cos(mRad) * refLen, cStart.y - Math.sin(mRad) * refLen);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    // 5. 主体（074 原海报核心体块：顶面、侧面、内部虚线棱、朱红正面）
    drawPoly(ctx, mainBox.cap, COL.sageTop, COL.pine, 2.6);
    drawPoly(ctx, mainBox.side, COL.sageSide, COL.pine, 2.6);

    // 侧面与顶面中位结构虚线（还原 074 原海报从正面十字沿斜向延展的构造虚线）
    ctx.save();
    ctx.strokeStyle = "rgba(10, 46, 32, 0.55)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 4]);
    const mv = mainBox.v;
    const midP = (a, b) => ({ x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 });
    const fTopMid = midP(mv.ftl, mv.ftr);
    const bTopMid = midP(mv.btl, mv.btr);
    ctx.beginPath();
    ctx.moveTo(fTopMid.x, fTopMid.y);
    ctx.lineTo(bTopMid.x, bTopMid.y);
    if (mainBox.goRight) {
      const fSideMid = midP(mv.fbr, mv.ftr);
      const bSideMid = midP(mv.bbr, mv.btr);
      ctx.moveTo(fSideMid.x, fSideMid.y);
      ctx.lineTo(bSideMid.x, bSideMid.y);
    } else {
      const fSideMid = midP(mv.fbl, mv.ftl);
      const bSideMid = midP(mv.bbl, mv.btl);
      ctx.moveTo(fSideMid.x, fSideMid.y);
      ctx.lineTo(bSideMid.x, bSideMid.y);
    }
    ctx.stroke();
    ctx.restore();

    // 主体朱红正面
    drawPoly(ctx, mainBox.front, COL.vermilion, COL.pine, 2.8);

    // 正面内容（原海报十字 / 真圆收音机 / 立面书架）
    drawSubjectDetails(mainBox, state.subject, mainBox.v.fbl.x, mainBox.v.fbl.y, unit, {
      frontShearDeg: state.frontShearDeg,
      angleDeg: state.angleDeg,
      depthRatio: state.depthRatio * ease,
    });

    // 若正面切歪，画一道 90° 铅垂虚线标出歪角
    if (!checks.frontTrue) {
      ctx.save();
      ctx.strokeStyle = COL.err;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(mv.fbl.x, mv.fbl.y);
      ctx.lineTo(mv.fbl.x, mv.fbl.y - unit - 14);
      ctx.stroke();
      ctx.setLineDash([]);
      // 角弧
      ctx.beginPath();
      const arcR = Math.min(34, unit * 0.25);
      const startA = -Math.PI / 2;
      const endA = Math.atan2(mv.ftl.y - mv.fbl.y, mv.ftl.x - mv.fbl.x);
      ctx.arc(mv.fbl.x, mv.fbl.y, arcR, Math.min(startA, endA), Math.max(startA, endA));
      ctx.stroke();
      ctx.restore();
    } else {
      // 90° 直角小方符（精准无误时在正面左下角印出建筑制图直角记号）
      const sq = Math.min(13, unit * 0.09);
      ctx.save();
      ctx.strokeStyle = COL.cream;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(mv.fbl.x + sq, mv.fbl.y);
      ctx.lineTo(mv.fbl.x + sq, mv.fbl.y - sq);
      ctx.lineTo(mv.fbl.x, mv.fbl.y - sq);
      ctx.stroke();
      ctx.restore();
    }

    // 6. 074 原海报标志：斜角量角弧 + 延长红箭（从后角继续射出）
    const anchor = mainBox.handleAnchor;
    const tip = mainBox.handleExtrude;
    const vdx = tip.x - anchor.x;
    const vdy = tip.y - anchor.y;
    const vlen = Math.hypot(vdx, vdy);
    if (vlen > 4) {
      const angCanvas = Math.atan2(vdy, vdx);
      const arrowLead = compact ? 24 : 38;
      const ax = tip.x + Math.cos(angCanvas) * arrowLead;
      const ay = tip.y + Math.sin(angCanvas) * arrowLead;

      ctx.save();
      // 水平参考虚线（从后角基点水平延伸，呼应海报「约 45°」处的虚线夹角）
      const refDir = mainBox.goRight ? 1 : -1;
      const refR = compact ? 38 : 52;
      ctx.strokeStyle = "rgba(245, 89, 53, 0.72)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(tip.x + refDir * refR, tip.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 实线斜向延长箭
      const rayCol = checks.visualOk ? COL.vermilion : (checks.cavalierValid ? "#9A5B0C" : COL.err);
      ctx.strokeStyle = rayCol;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(ax, ay);
      ctx.stroke();
      drawArrowHead(ctx, ax, ay, angCanvas, 9.5, rayCol);

      // 夹角扇弧
      const arcRad = compact ? 24 : 32;
      ctx.strokeStyle = COL.pine;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      if (mainBox.goRight) {
        ctx.arc(tip.x, tip.y, arcRad, angCanvas, 0, false);
      } else {
        ctx.arc(tip.x, tip.y, arcRad, Math.PI, angCanvas, false);
      }
      ctx.stroke();

      // 角度 & 进深浮标（紧贴量角处，防出画界）
      const labelX = clamp(tip.x + refDir * (compact ? 42 : 58), 54, W - 54);
      const labelY = clamp(tip.y - 16, 22, H - 24);
      ctx.fillStyle = COL.pine;
      ctx.font = `700 ${compact ? 12 : 13.5}px "JetBrains Mono", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`${metrics.angleDeg.toFixed(0)}° · ${metrics.depthRatio.toFixed(2)}×`, labelX, labelY);
      ctx.restore();
    }

    // 7. 三个可交互实体圆柄（高对比几何圆环）
    // 7a. 主斜向后角矢量柄（核心拖动柄）
    const extActive = dragMode === "extrude" || dragMode === "sweep" || hoverMode === "extrude";
    ctx.save();
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, extActive ? 13 : 11, 0, Math.PI * 2);
    ctx.fillStyle = COL.vermilion;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = COL.cream;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, extActive ? 15.5 : 13, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = COL.pine;
    ctx.stroke();
    // 中心小斜箭
    ctx.fillStyle = COL.cream;
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 7b. 正面扳正手柄（正面左上角）—— 标签落在正面顶边中右上方，彻底避开左侧副体标签
    const fh = mainBox.handleFront;
    const fActive = dragMode === "front" || hoverMode === "front";
    ctx.save();
    ctx.beginPath();
    ctx.arc(fh.x, fh.y, fActive ? 10 : 8.5, 0, Math.PI * 2);
    ctx.fillStyle = checks.frontTrue ? COL.ok : COL.err;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COL.cream;
    ctx.stroke();
    ctx.restore();
    if (!checks.frontTrue) {
      const fx = clamp((mv.ftl.x + mv.ftr.x) * 0.5 + 16, 86, W - 78);
      const fy = clamp(fh.y - (compact ? 30 : 34), 22, H - 22);
      ctx.save();
      ctx.strokeStyle = COL.err;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(fh.x + 6, fh.y - 5);
      ctx.lineTo(fx - 12, fy + 10);
      ctx.stroke();
      ctx.restore();
      drawPillTag(ctx, fx, fy, `歪 ${Math.abs(state.frontShearDeg).toFixed(0)}° · 点扳正`, COL.err, COL.cream);
    }

    // 7c. 副体平行校准柄 —— 标签落在副体左上方，与主体扳正标签彻底分离零重叠
    const ch = compBox.handleExtrude;
    const cActive = dragMode === "companion" || hoverMode === "companion";
    ctx.save();
    ctx.beginPath();
    ctx.arc(ch.x, ch.y, cActive ? 9.5 : 8, 0, Math.PI * 2);
    ctx.fillStyle = parallelColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COL.cream;
    ctx.stroke();
    ctx.restore();
    if (!checks.parallelOk) {
      const cxLabel = clamp(compBox.v.ftl.x + 8, 66, Math.max(70, fh.x - 76));
      const cyLabel = clamp(compBox.v.btl.y - (compact ? 26 : 30), 22, H - 22);
      ctx.save();
      ctx.strokeStyle = COL.err;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(ch.x - 5, ch.y - 5);
      ctx.lineTo(cxLabel + 18, cyLabel + 10);
      ctx.stroke();
      ctx.restore();
      drawPillTag(ctx, cxLabel, cyLabel, `偏 ${metrics.parallelDiff.toFixed(0)}° · 点对齐`, COL.err, COL.cream);
    }

    // 8. 底部轻提示胶囊（只在宽敞或未校准时显示一行清晰操作指引）
    const footY = H - 18;
    ctx.save();
    ctx.font = `500 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = COL.pineSoft;
    ctx.textAlign = "center";
    ctx.fillText(
      compact ? "拖橙圆调斜角与进深 · 点红标修歪斜/对齐" : "拖动后角橙圆自由拉深与转角 · 横拖空白区连续扫调 · 点/拖红标扳正正面与对齐副体",
      W * 0.5,
      footY
    );
    ctx.restore();
  }

  const ctl = loop(canvas, render);

  // ---------- 指针与触屏交互（兼容鼠标 + 触屏 + tools/perf.mjs 横拖） ----------
  function localPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function hitTest(p) {
    if (!scene) return "sweep";
    const { mainBox, compBox, checks } = scene;
    const compact = W < 540;
    const mv = mainBox.v;
    const dExt = Math.hypot(p.x - mainBox.handleExtrude.x, p.y - mainBox.handleExtrude.y);
    if (dExt <= 28) return "extrude";

    const fh = mainBox.handleFront;
    const fx = clamp((mv.ftl.x + mv.ftr.x) * 0.5 + 16, 86, W - 78);
    const fy = clamp(fh.y - (compact ? 30 : 34), 22, H - 22);
    const dFront = Math.hypot(p.x - fh.x, p.y - fh.y);
    const dFrontPill = !checks.frontTrue && Math.abs(p.x - fx) <= 58 && Math.abs(p.y - fy) <= 18;
    if (dFront <= 22) return "front";
    if (dFrontPill) return "front-pill";

    const ch = compBox.handleExtrude;
    const cxLabel = clamp(compBox.v.ftl.x + 8, 66, Math.max(70, fh.x - 76));
    const cyLabel = clamp(compBox.v.btl.y - (compact ? 26 : 30), 22, H - 22);
    const dComp = Math.hypot(p.x - ch.x, p.y - ch.y);
    const dCompPill = !checks.parallelOk && Math.abs(p.x - cxLabel) <= 56 && Math.abs(p.y - cyLabel) <= 18;
    if (dComp <= 22) return "companion";
    if (dCompPill) return "companion-pill";

    return "sweep";
  }

  function applyExtrudeAt(p) {
    if (!scene) return;
    const anchor = scene.mainBox.handleAnchor;
    // 用当前主体顶面中心对应的右/左锚点无缝支持左右象限拉动
    const mv = scene.mainBox.v;
    const midTopX = (mv.ftl.x + mv.ftr.x) * 0.5;
    const useRight = p.x >= midTopX;
    const base = useRight ? mv.ftr : mv.ftl;
    const dx = p.x - base.x;
    const dy = base.y - p.y; // 向上为正
    let ang = Math.atan2(dy, dx) * DEG;
    if (ang < 0) ang = ang > -90 ? 5 : 175;
    ang = clamp(ang, 5, 175);
    const len = Math.hypot(dx, Math.max(0, dy));
    const ratio = clamp(len / (scene.unit || 120), 0.08, 1.50);
    // 靠近经典 45° / 0.50× 时做极轻吸附（不抢手）
    if (Math.abs(ang - 45) < 1.8) ang = 45;
    if (Math.abs(ang - 135) < 1.8) ang = 135;
    if (Math.abs(ratio - 0.5) < 0.025) state.depthRatio = 0.5;
    else state.depthRatio = +ratio.toFixed(2);
    state.angleDeg = +ang.toFixed(1);
    void anchor;
  }

  function onPointerDown(e) {
    if (e.pointerType === "touch") return;
    if (e.button !== undefined && e.button !== 0) return;
    const p = localPos(e);
    dragMode = hitTest(p);
    dragStart = {
      x: p.x,
      y: p.y,
      moved: false,
      angleDeg: state.angleDeg,
      depthRatio: state.depthRatio,
      frontShearDeg: state.frontShearDeg,
      companionOffsetDeg: state.companionOffsetDeg,
    };
    canvas.setPointerCapture?.(e.pointerId);
    if (dragMode === "extrude") {
      applyExtrudeAt(p);
      dirty = true;
      onChange();
      ctl.draw();
    }
  }

  function onPointerMove(e) {
    if (e.pointerType === "touch") return;
    const p = localPos(e);
    if (!dragMode) {
      const h = hitTest(p);
      if (h !== hoverMode) {
        hoverMode = h;
        canvas.style.cursor = h === "sweep" ? "ew-resize" : "grab";
        dirty = true;
        ctl.draw();
      }
      return;
    }
    const dx = p.x - dragStart.x;
    const dy = p.y - dragStart.y;
    if (Math.hypot(dx, dy) > 4) dragStart.moved = true;

    if (dragMode === "extrude") {
      applyExtrudeAt(p);
    } else if (dragMode === "front") {
      const unit = scene?.unit || 140;
      const nextShear = clamp(dragStart.frontShearDeg + (dx / unit) * 48, -24, 24);
      state.frontShearDeg = Math.abs(nextShear) < 1.8 ? 0 : +nextShear.toFixed(1);
    } else if (dragMode === "companion") {
      const nextOff = clamp(dragStart.companionOffsetDeg - (dy - dx * 0.5) * 0.45, -45, 50);
      state.companionOffsetDeg = Math.abs(nextOff) < 2.2 ? 0 : +nextOff.toFixed(1);
    } else {
      // 空白区或从胶囊发起的横向扫拖：流畅驱动斜向角度与进深比例（点击胶囊本身则执行单项校准）
      const norm = dx / Math.max(140, W * 0.52);
      state.angleDeg = +clamp(dragStart.angleDeg + norm * 48, 8, 168).toFixed(1);
      state.depthRatio = +clamp(dragStart.depthRatio - norm * 0.65, 0.14, 1.48).toFixed(2);
    }
    dirty = true;
    onChange();
    ctl.draw();
  }

  function onPointerUp(e) {
    if (e.pointerType === "touch") return;
    if (!dragMode) return;
    // 轻点（未拖动）红标手柄或胶囊时，一键校准该单项错误，零挫败感
    if (!dragStart.moved) {
      if (dragMode === "front" || dragMode === "front-pill") {
        state.frontShearDeg = Math.abs(state.frontShearDeg) > 1.5 ? 0 : 14;
        dirty = true;
        onChange();
        ctl.draw();
      } else if (dragMode === "companion" || dragMode === "companion-pill") {
        state.companionOffsetDeg = Math.abs(state.companionOffsetDeg) > 2 ? 0 : 38;
        dirty = true;
        onChange();
        ctl.draw();
      }
    }
    dragMode = null;
    dragStart = null;
    canvas.releasePointerCapture?.(e.pointerId);
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  // 触屏单指横拖：保留垂直页面滚动（touch-action: pan-y），横向位移大于纵向时接管
  let touchDrag = null;
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const p = { x: t0.clientX - r.left, y: t0.clientY - r.top };
    touchDrag = {
      mode: hitTest(p),
      x: p.x,
      y: p.y,
      moved: false,
      locked: null,
      angleDeg: state.angleDeg,
      depthRatio: state.depthRatio,
      frontShearDeg: state.frontShearDeg,
      companionOffsetDeg: state.companionOffsetDeg,
    };
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!touchDrag || e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const p = { x: t0.clientX - r.left, y: t0.clientY - r.top };
    const dx = p.x - touchDrag.x;
    const dy = p.y - touchDrag.y;
    if (Math.hypot(dx, dy) > 4) touchDrag.moved = true;
    if (!touchDrag.locked) {
      if (touchDrag.mode === "extrude" || Math.abs(dx) >= Math.abs(dy) * 0.85) {
        touchDrag.locked = "drag";
      } else if (Math.abs(dy) > 10) {
        touchDrag.locked = "scroll";
        return;
      }
    }
    if (touchDrag.locked !== "drag") return;
    if (touchDrag.mode === "extrude") {
      applyExtrudeAt(p);
    } else if (touchDrag.mode === "front") {
      const next = clamp(touchDrag.frontShearDeg + (dx / (scene?.unit || 110)) * 48, -24, 24);
      state.frontShearDeg = Math.abs(next) < 2 ? 0 : +next.toFixed(1);
    } else if (touchDrag.mode === "companion") {
      const next = clamp(touchDrag.companionOffsetDeg - (dy - dx * 0.5) * 0.5, -45, 50);
      state.companionOffsetDeg = Math.abs(next) < 2.5 ? 0 : +next.toFixed(1);
    } else {
      const norm = dx / Math.max(110, W * 0.45);
      state.angleDeg = +clamp(touchDrag.angleDeg + norm * 48, 8, 168).toFixed(1);
      state.depthRatio = +clamp(touchDrag.depthRatio - norm * 0.65, 0.14, 1.48).toFixed(2);
    }
    dirty = true;
    onChange();
    ctl.draw();
  }, { passive: true });

  canvas.addEventListener("touchend", () => {
    if (touchDrag && !touchDrag.moved) {
      if (touchDrag.mode === "front" || touchDrag.mode === "front-pill") {
        state.frontShearDeg = Math.abs(state.frontShearDeg) > 1.5 ? 0 : 14;
        dirty = true;
        onChange();
        ctl.draw();
      } else if (touchDrag.mode === "companion" || touchDrag.mode === "companion-pill") {
        state.companionOffsetDeg = Math.abs(state.companionOffsetDeg) > 2 ? 0 : 38;
        dirty = true;
        onChange();
        ctl.draw();
      }
    }
    touchDrag = null;
  }, { passive: true });
  canvas.addEventListener("touchcancel", () => { touchDrag = null; }, { passive: true });

  // 键盘可访问操作（焦点在画布上时方向键调斜角与进深，Shift 微调）
  canvas.addEventListener("keydown", (e) => {
    const stepA = e.shiftKey ? 1 : 5;
    const stepK = e.shiftKey ? 0.02 : 0.08;
    let handled = true;
    if (e.key === "ArrowRight") state.angleDeg = +clamp(state.angleDeg - stepA, 5, 175).toFixed(1);
    else if (e.key === "ArrowLeft") state.angleDeg = +clamp(state.angleDeg + stepA, 5, 175).toFixed(1);
    else if (e.key === "ArrowUp") state.depthRatio = +clamp(state.depthRatio + stepK, 0.08, 1.50).toFixed(2);
    else if (e.key === "ArrowDown") state.depthRatio = +clamp(state.depthRatio - stepK, 0.08, 1.50).toFixed(2);
    else handled = false;
    if (handled) {
      e.preventDefault();
      dirty = true;
      onChange();
      ctl.draw();
    }
  });

  return {
    redraw() {
      dirty = true;
      ctl.draw();
    },
    getScene() {
      return computeHeroScene(state, W, H, 1);
    },
  };
}

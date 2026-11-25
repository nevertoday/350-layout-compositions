// 074 斜投影构图 · 正文 01–08 节专属交互实验（相邻两节互不重复控件）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { RAD, clamp, buildObliqueBox, computeProjectionComparison, PRACTICE_OPTIONS } from "./model.js";

const PAL = {
  paper: "#FFF6E5",
  cream: "#FCEAC9",
  pine: "#0A2E20",
  pineSoft: "rgba(10, 46, 32, 0.42)",
  vermilion: "#F55935",
  vermilionDeep: "#B53112",
  sageTop: "#A9B391",
  sageSide: "#939E7B",
  shadow: "rgba(122, 108, 86, 0.22)",
  err: "#B01C1C",
  ok: "#13613E",
};

function setupCanvas(canvas, drawFn) {
  const ctx = canvas.getContext("2d");
  let W = 560, H = 320;
  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    W = Math.round(r.width);
    H = Math.round(r.height);
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFn(ctx, W, H);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  return {
    draw: () => drawFn(ctx, W, H),
    size: () => ({ W, H }),
  };
}

function fillPoly(ctx, pts, fill, stroke, lw = 2) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = "round"; ctx.stroke(); }
}

// =========================================================================
// 01 节：三步建造进程游标条（确定正面 → 延展深度 → 形成结构）+ 正面真圆检视
// =========================================================================
export function initStepBuilder() {
  const canvas = document.getElementById("steps-canvas");
  const range = document.getElementById("steps-range");
  const cap = document.getElementById("steps-caption");
  const circleBtn = document.getElementById("steps-circle-toggle");
  const stepBtns = [...document.querySelectorAll("[data-step-jump]")];
  if (!canvas || !range) return;

  let progress = 100;
  let showCircle = false;

  const draw = (ctx, W, H) => {
    ctx.fillStyle = PAL.paper;
    ctx.fillRect(0, 0, W, H);

    // 淡制图格
    ctx.strokeStyle = "rgba(10, 46, 32, 0.07)";
    ctx.lineWidth = 1;
    for (let x = 28; x < W; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 28; y < H; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const p = progress / 100;
    const s1 = clamp(p / 0.34, 0, 1);                // 0–34% 确定正面
    const s2 = clamp((p - 0.34) / 0.36, 0, 1);       // 34–70% 延展平行斜线
    const s3 = clamp((p - 0.70) / 0.30, 0, 1);       // 70–100% 封闭后壁与面色

    const unit = Math.min(W * 0.32, H * 0.52);
    const ox = W * 0.30;
    const oy = H * 0.80;
    const k = 0.52;
    const ang = 45 * RAD;
    const dx = unit * k * Math.cos(ang);
    const dy = -unit * k * Math.sin(ang);

    const fbl = { x: ox, y: oy };
    const fbr = { x: ox + unit, y: oy };
    const ftr = { x: ox + unit, y: oy - unit };
    const ftl = { x: ox, y: oy - unit };

    const bbl = { x: fbl.x + dx * s2, y: fbl.y + dy * s2 };
    const bbr = { x: fbr.x + dx * s2, y: fbr.y + dy * s2 };
    const btr = { x: ftr.x + dx * s2, y: ftr.y + dy * s2 };
    const btl = { x: ftl.x + dx * s2, y: ftl.y + dy * s2 };

    // 阶段 3 落地影与鼠尾草面填充
    if (s3 > 0.02) {
      ctx.save();
      ctx.globalAlpha = s3;
      fillPoly(ctx, [fbl, fbr, { x: bbr.x + 8, y: oy }, { x: bbl.x + 8, y: oy }], PAL.shadow, null);
      fillPoly(ctx, [ftl, ftr, btr, btl], PAL.sageTop, PAL.pine, 2.2);
      fillPoly(ctx, [fbr, bbr, btr, ftr], PAL.sageSide, PAL.pine, 2.2);
      ctx.restore();
    }

    // 阶段 2 四条严格平行的 45° 斜线（含隐藏左下后棱）
    if (s2 > 0.01) {
      ctx.save();
      // 隐藏棱用虚线
      ctx.strokeStyle = "rgba(10, 46, 32, 0.35)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(fbl.x, fbl.y); ctx.lineTo(bbl.x, bbl.y); ctx.stroke();
      ctx.setLineDash([]);

      // 三条可见平行斜棱
      ctx.strokeStyle = s3 < 0.5 ? PAL.vermilion : PAL.pine;
      ctx.lineWidth = 2.2;
      for (const [a, b] of [[ftl, btl], [ftr, btr], [fbr, bbr]]) {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      // 阶段 2 末尾连出后框虚线轮廓
      if (s2 > 0.6) {
        ctx.strokeStyle = PAL.pineSoft;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(btl.x, btl.y); ctx.lineTo(btr.x, btr.y); ctx.lineTo(bbr.x, bbr.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    // 阶段 1 确定正面（逐边描画并填入朱红真形）
    ctx.save();
    if (s1 > 0.4) {
      ctx.globalAlpha = clamp((s1 - 0.4) / 0.6, 0, 1);
      fillPoly(ctx, [fbl, fbr, ftr, ftl], PAL.vermilion, null);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = PAL.pine;
    ctx.lineWidth = 2.5;
    const perim = [fbl, fbr, ftr, ftl, fbl];
    let remain = s1 * 4;
    ctx.beginPath();
    ctx.moveTo(perim[0].x, perim[0].y);
    for (let i = 0; i < 4 && remain > 0; i++) {
      const seg = clamp(remain, 0, 1);
      const nx = perim[i].x + (perim[i + 1].x - perim[i].x) * seg;
      const ny = perim[i].y + (perim[i + 1].y - perim[i].y) * seg;
      ctx.lineTo(nx, ny);
      remain -= 1;
    }
    ctx.stroke();

    // 90° 基准方符 & 圆形检视
    if (s1 > 0.85) {
      ctx.strokeStyle = PAL.paper;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(fbl.x + 12, fbl.y); ctx.lineTo(fbl.x + 12, fbl.y - 12); ctx.lineTo(fbl.x, fbl.y - 12);
      ctx.stroke();

      if (showCircle) {
        const cx = ox + unit * 0.5, cy = oy - unit * 0.5, r = unit * 0.34;
        // 若进入阶段 2/3，连带在背后画出等半径平行的后圆轮廓，呈现斜圆柱真圆优势
        if (s2 > 0.05) {
          ctx.beginPath();
          ctx.arc(cx + dx * s2, cy + dy * s2, r, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(10, 46, 32, 0.42)";
          ctx.setLineDash([4, 3]);
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = PAL.paper;
        ctx.fill();
        ctx.strokeStyle = PAL.pine;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // 圆心与半径尺
        ctx.beginPath();
        ctx.moveTo(cx, cy); ctx.lineTo(cx + r, cy);
        ctx.strokeStyle = PAL.vermilionDeep;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = PAL.pine;
        ctx.font = '600 11px "JetBrains Mono", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText("r = r (真圆)", cx, cy + r * 0.55);
      } else {
        // 原海报白虚线十字
        ctx.strokeStyle = "rgba(255, 246, 229, 0.85)";
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(ox, oy - unit * 0.5); ctx.lineTo(ox + unit, oy - unit * 0.5);
        ctx.moveTo(ox + unit * 0.5, oy); ctx.lineTo(ox + unit * 0.5, oy - unit);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();

    // 右上角阶段标注
    const stageIdx = p <= 0.34 ? 1 : p <= 0.70 ? 2 : 3;
    const labels = [
      "",
      "步骤 01 · 确定正面（90° 真形基准）",
      "步骤 02 · 沿固定 45° 平行线拉出深度",
      "步骤 03 · 封合背面与面色，空间成形",
    ];
    ctx.fillStyle = PAL.pine;
    ctx.font = '600 12px "Noto Sans SC", "JetBrains Mono", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(labels[stageIdx], 16, 26);
  };

  const api = setupCanvas(canvas, draw);

  function syncUI() {
    range.value = String(progress);
    const step = progress <= 34 ? 1 : progress <= 70 ? 2 : 3;
    stepBtns.forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.stepJump === step)));
    const texts = {
      1: "第一步只画正对你的二维面：所有直角守住 90°，若是钟表、车轮或圆拱门，直接拿圆规画真圆，不必换算椭圆。",
      2: "第二步从正面的每个顶点拉出方向一致、互相平行的斜线（这里用 45°、0.52× 缩深），决不向远方收拢。",
      3: "第三步连出与正面完全全等的背面边缘、添上顶侧灰绿面色与地面轻影——正面保真，三维体量立刻站起。",
    };
    cap.textContent = showCircle
      ? `${texts[step]}（已叠真圆检视：前后两圆半径完全相等，这是等距与透视都做不到的省力之处。）`
      : texts[step];
    api.draw();
  }

  range.addEventListener("input", () => {
    progress = +range.value;
    syncUI();
  });
  stepBtns.forEach((b) => b.addEventListener("click", () => {
    const s = +b.dataset.stepJump;
    progress = s === 1 ? 34 : s === 2 ? 68 : 100;
    syncUI();
  }));
  circleBtn?.addEventListener("click", () => {
    showCircle = !showCircle;
    circleBtn.setAttribute("aria-pressed", String(showCircle));
    circleBtn.textContent = showCircle ? "正面真圆检视：开" : "叠入正面真圆检视";
    syncUI();
  });

  syncUI();
}

// =========================================================================
// 02 节：骑士 1:1 ↔ 橱柜 1:2 拉帘对照器 + 立面斜 / 平面斜切换
// =========================================================================
export function initCavalierCabinet() {
  const canvas = document.getElementById("compare-canvas");
  const splitRange = document.getElementById("compare-split");
  const modeBtns = [...document.querySelectorAll("[data-oblique-kind]")];
  const caption = document.getElementById("compare-caption");
  if (!canvas || !splitRange) return;

  let split = 0.5;
  let kind = "elevation"; // "elevation" | "plan"

  function drawVariant(ctx, W, H, depthRatio, label, sub) {
    ctx.fillStyle = PAL.paper;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(10, 46, 32, 0.06)";
    ctx.lineWidth = 1;
    for (let x = 24; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 24; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    if (kind === "elevation") {
      // 立面斜投影：正面墙（正方形）真形，沿 45° 延展进深 depthRatio（1.00 vs 0.50）
      const unit = Math.min(W * 0.23, H * 0.39);
      const ox = W * 0.28;
      const oy = H * 0.87;
      const box = buildObliqueBox(ox, oy, unit, unit, unit, { frontShearDeg: 0, angleDeg: 45, depthRatio });
      // 等分深度刻度线（把进深等分成 4 格，直观看出 1:1 显得有多长！）
      fillPoly(ctx, box.cap, PAL.sageTop, PAL.pine, 2.2);
      fillPoly(ctx, box.side, PAL.sageSide, PAL.pine, 2.2);
      const { ftl, ftr, fbr, btl, btr, bbr } = box.v;
      ctx.save();
      ctx.strokeStyle = "rgba(10, 46, 32, 0.28)";
      ctx.lineWidth = 1.1;
      for (let i = 1; i < 4; i++) {
        const t = i / 4;
        const tl = { x: ftl.x + (btl.x - ftl.x) * t, y: ftl.y + (btl.y - ftl.y) * t };
        const tr = { x: ftr.x + (btr.x - ftr.x) * t, y: ftr.y + (btr.y - ftr.y) * t };
        const br = { x: fbr.x + (bbr.x - fbr.x) * t, y: fbr.y + (bbr.y - fbr.y) * t };
        ctx.beginPath();
        ctx.moveTo(tl.x, tl.y); ctx.lineTo(tr.x, tr.y); ctx.lineTo(br.x, br.y);
        ctx.stroke();
      }
      ctx.restore();
      fillPoly(ctx, box.front, PAL.vermilion, PAL.pine, 2.4);
      // 正面 1:1 尺寸标记
      ctx.fillStyle = PAL.paper;
      ctx.font = '700 12px "JetBrains Mono", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("W = 1.00", ox + unit * 0.5, oy - 10);
      // 进深标注
      const mx = (fbr.x + bbr.x) * 0.5 + 24;
      const my = (fbr.y + bbr.y) * 0.5 + 14;
      ctx.fillStyle = depthRatio > 0.8 ? PAL.vermilionDeep : PAL.ok;
      ctx.font = '700 12px "JetBrains Mono", sans-serif';
      ctx.fillText(`D = ${depthRatio.toFixed(2)}×`, mx, my);
    } else {
      // 平面斜投影（Plan Oblique / 军用投影）：顶面平面图保持 90° 真形（旋转 30° 摆置），高度竖直向下拉出
      const unit = Math.min(W * 0.26, H * 0.36);
      const cx = W * 0.50;
      const cy = H * 0.34;
      const rot = 30 * RAD;
      const ux = { x: Math.cos(rot) * unit, y: Math.sin(rot) * unit };
      const uy = { x: -Math.sin(rot) * unit, y: Math.cos(rot) * unit };
      const top0 = { x: cx - (ux.x + uy.x) * 0.5, y: cy - (ux.y + uy.y) * 0.5 };
      const top1 = { x: top0.x + ux.x, y: top0.y + ux.y };
      const top2 = { x: top1.x + uy.x, y: top1.y + uy.y };
      const top3 = { x: top0.x + uy.x, y: top0.y + uy.y };
      const h = unit * depthRatio; // 1.00 全高 vs 0.65 缩高平面斜
      const drop = (p) => ({ x: p.x, y: p.y + h });
      const b1 = drop(top1), b2 = drop(top2), b3 = drop(top3);

      fillPoly(ctx, [top3, top2, b2, b3], PAL.sageTop, PAL.pine, 2.2);
      fillPoly(ctx, [top2, top1, b1, b2], PAL.sageSide, PAL.pine, 2.2);
      fillPoly(ctx, [top0, top1, top2, top3], PAL.vermilion, PAL.pine, 2.4);

      // 平面图上的真圆中庭标记
      const tc = { x: (top0.x + top2.x) * 0.5, y: (top0.y + top2.y) * 0.5 };
      ctx.beginPath();
      ctx.arc(tc.x, tc.y, unit * 0.24, 0, Math.PI * 2);
      ctx.fillStyle = PAL.paper;
      ctx.fill();
      ctx.strokeStyle = PAL.pine;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = PAL.pine;
      ctx.font = '700 11.5px "JetBrains Mono", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(`H = ${depthRatio.toFixed(2)}×`, top1.x + 10, (top1.y + b1.y) * 0.5 + 4);
    }

    // 角落徽标
    ctx.fillStyle = PAL.pine;
    ctx.font = '700 13px "Noto Sans SC", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(label, 14, 24);
    ctx.fillStyle = PAL.pineSoft;
    ctx.font = '600 11px "JetBrains Mono", sans-serif';
    ctx.fillText(sub, 14, 42);
  }

  const draw = (ctx, W, H) => {
    const sx = Math.round(W * split);
    // 左半：1:1 骑士（或全高平面斜）
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, sx, H); ctx.clip();
    drawVariant(
      ctx, W, H,
      1.00,
      kind === "elevation" ? "骑士投影 Cavalier" : "等高平面斜 1:1",
      kind === "elevation" ? "45° · 进深 1.00×（肉眼显拉长）" : "平面 90° 真形 · 竖高 1.00×"
    );
    ctx.restore();

    // 右半：1:2 橱柜（或缩高平面斜 0.67×）
    ctx.save();
    ctx.beginPath(); ctx.rect(sx, 0, W - sx, H); ctx.clip();
    drawVariant(
      ctx, W, H,
      kind === "elevation" ? 0.50 : 0.67,
      kind === "elevation" ? "橱柜投影 Cabinet" : "缩高平面斜 2:3",
      kind === "elevation" ? "45° · 进深 0.50×（体量自然）" : "平面 90° 真形 · 竖高 0.67×"
    );
    ctx.restore();

    // 中缝朱红拉帘线与手柄
    ctx.save();
    ctx.strokeStyle = PAL.vermilion;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx, H * 0.5, 14, 0, Math.PI * 2);
    ctx.fillStyle = PAL.pine; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = PAL.paper; ctx.stroke();
    ctx.fillStyle = PAL.paper;
    ctx.font = '700 12px "JetBrains Mono", sans-serif';
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("↔", sx, H * 0.5 + 0.5);
    ctx.restore();
  };

  const api = setupCanvas(canvas, draw);

  let dragging = false;
  const setFromX = (clientX) => {
    const r = canvas.getBoundingClientRect();
    split = clamp((clientX - r.left) / r.width, 0.08, 0.92);
    splitRange.value = String(Math.round(split * 100));
    api.draw();
  };
  canvas.addEventListener("pointerdown", (e) => { dragging = true; canvas.setPointerCapture?.(e.pointerId); setFromX(e.clientX); });
  canvas.addEventListener("pointermove", (e) => { if (dragging) setFromX(e.clientX); });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  splitRange.addEventListener("input", () => {
    split = clamp(+splitRange.value / 100, 0.08, 0.92);
    api.draw();
  });

  modeBtns.forEach((b) => b.addEventListener("click", () => {
    kind = b.dataset.obliqueKind;
    modeBtns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    caption.textContent = kind === "elevation"
      ? "立面斜投影（Elevation Oblique）：保持正面立面 90° 真形。左半是 1:1 骑士投影，四格进深拉得像长条；右半按 ISO 5456-3 缩半成 0.50× 橱柜投影，才像真正的正方体。"
      : "平面斜投影（Plan Oblique / 军用投影）：把地面或屋顶的 90° 平面图（含正圆中庭）完整搬上画纸，再垂直拉出建筑高度；常将竖高缩至 2/3 避免塔楼显得过高。";
    api.draw();
  }));
}

// =========================================================================
// 03 节：四投影同体实时变形对照台（074 斜投影 / 075 等距 / 070 一点 / 071 两点）
// =========================================================================
export function initProjectionMorph() {
  const canvas = document.getElementById("morph-canvas");
  const btns = [...document.querySelectorAll("[data-proj-mode]")];
  const mCorner = document.getElementById("m-corner");
  const mCircle = document.getElementById("m-circle");
  const mRays = document.getElementById("m-rays");
  const mMeas = document.getElementById("m-meas");
  const mSummary = document.getElementById("m-summary");
  if (!canvas || !btns.length) return;

  let currentMode = "oblique";
  let prevPts = null;
  let targetData = null;
  let animT = 1;
  let W = 540, H = 320;
  const ctx = canvas.getContext("2d");

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    W = Math.round(r.width);
    H = Math.round(r.height);
    const dpr = pixelRatio(2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    targetData = computeProjectionComparison(currentMode, W * 0.5, H * 0.52, Math.min(W * 0.30, H * 0.44));
    prevPts = targetData;
    animT = 1;
    ctl.draw();
  }

  function lerpPoly(a, b, t) {
    return a.map((p, i) => ({ x: p.x + (b[i].x - p.x) * t, y: p.y + (b[i].y - p.y) * t }));
  }

  const ctl = loop(canvas, (_t, dt, { still }) => {
    if (!targetData) return;
    if (still) animT = 1;
    else if (animT < 1) animT = Math.min(1, animT + Math.max(dt, 0.016) * 3.4);

    const ease = 1 - Math.pow(1 - animT, 3);
    const from = prevPts || targetData;
    const front = lerpPoly(from.front, targetData.front, ease);
    const cap = lerpPoly(from.cap, targetData.cap, ease);
    const side = lerpPoly(from.side, targetData.side, ease);
    const circle = lerpPoly(from.circlePts, targetData.circlePts, ease);

    ctx.fillStyle = PAL.paper;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(10, 46, 32, 0.06)";
    ctx.lineWidth = 1;
    for (let x = 28; x < W; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 28; y < H; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // 若有消失点（一点/两点透视），画淡虚线指向消失点
    if (targetData.vanishingPoints.length && ease > 0.35) {
      ctx.save();
      ctx.globalAlpha = clamp((ease - 0.35) / 0.65, 0, 1);
      ctx.strokeStyle = "rgba(181, 49, 18, 0.48)";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 4]);
      for (const vp of targetData.vanishingPoints) {
        // 视平线
        ctx.beginPath(); ctx.moveTo(0, vp.y); ctx.lineTo(W, vp.y); ctx.stroke();
        // 连线
        for (const p of [front[1], front[2], front[3]]) {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(vp.x, vp.y); ctx.stroke();
        }
        if (vp.x > 6 && vp.x < W - 6) {
          ctx.setLineDash([]);
          ctx.fillStyle = PAL.vermilion;
          ctx.beginPath(); ctx.arc(vp.x, vp.y, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = PAL.pine;
          ctx.font = '700 10.5px "JetBrains Mono", sans-serif';
          ctx.fillText("VP", vp.x + 8, vp.y - 6);
          ctx.setLineDash([4, 4]);
        }
      }
      ctx.restore();
    } else if (currentMode === "oblique" && ease > 0.6) {
      // 斜投影平行辅助射线
      ctx.save();
      ctx.strokeStyle = "rgba(19, 97, 62, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      const dir = { x: cap[2].x - front[2].x, y: cap[2].y - front[2].y };
      for (const p of [front[3], front[2], front[1]]) {
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + dir.x * 1.55, p.y + dir.y * 1.55); ctx.stroke();
      }
      ctx.restore();
    }

    fillPoly(ctx, cap, PAL.sageTop, PAL.pine, 2.2);
    fillPoly(ctx, side, PAL.sageSide, PAL.pine, 2.2);
    fillPoly(ctx, front, PAL.vermilion, PAL.pine, 2.5);

    // 正面圆（直观对比真圆 vs 椭圆！）
    fillPoly(ctx, circle, PAL.paper, PAL.pine, 2);

    // 刻度小尺
    ctx.save();
    ctx.strokeStyle = PAL.vermilionDeep;
    ctx.lineWidth = 1.6;
    const cCenter = {
      x: (front[0].x + front[2].x) * 0.5,
      y: (front[0].y + front[2].y) * 0.5,
    };
    ctx.beginPath();
    ctx.moveTo(circle[0].x, circle[0].y);
    ctx.lineTo(circle[Math.floor(circle.length / 2)].x, circle[Math.floor(circle.length / 2)].y);
    ctx.moveTo(circle[Math.floor(circle.length / 4)].x, circle[Math.floor(circle.length / 4)].y);
    ctx.lineTo(circle[Math.floor((circle.length * 3) / 4)].x, circle[Math.floor((circle.length * 3) / 4)].y);
    ctx.stroke();
    ctx.fillStyle = PAL.pine;
    ctx.beginPath(); ctx.arc(cCenter.x, cCenter.y, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  function select(mode) {
    currentMode = mode;
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.projMode === mode)));
    prevPts = targetData || computeProjectionComparison(mode, W * 0.5, H * 0.52, Math.min(W * 0.30, H * 0.44));
    targetData = computeProjectionComparison(mode, W * 0.5, H * 0.52, Math.min(W * 0.30, H * 0.44));
    animT = reducedMotion.matches ? 1 : 0;
    mCorner.textContent = targetData.metrics.frontCorner;
    mCircle.textContent = targetData.metrics.circleShape;
    mRays.textContent = targetData.metrics.depthRays;
    mMeas.textContent = targetData.metrics.measurable;
    mSummary.textContent = targetData.summary;
    ctl.draw();
  }

  new ResizeObserver(resize).observe(canvas);
  resize();
  select("oblique");
  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.projMode)));
}

// =========================================================================
// 04 节：四纪元历史编年切片（北宋界画 / 法军骑士堡 / 波尔克定理 / 现代与 ISO）
// =========================================================================
export function initHistoryTabs() {
  const tabs = [...document.querySelectorAll("[data-era]")];
  const panels = [...document.querySelectorAll("[data-era-panel]")];
  if (!tabs.length) return;
  const activate = (id) => {
    tabs.forEach((t) => {
      const on = t.dataset.era === id;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p) => {
      p.hidden = p.dataset.eraPanel !== id;
    });
  };
  tabs.forEach((t, idx) => {
    t.addEventListener("click", () => activate(t.dataset.era));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const next = tabs[(idx + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
        activate(next.dataset.era);
        next.focus();
      }
    });
  });
}

// =========================================================================
// 05 节：网页真 DOM 斜投影卡片生成器（实时 CSS skewX / skewY）
// =========================================================================
export function initCssExtruder() {
  const stage = document.getElementById("css-card-wrap");
  const slabTop = document.getElementById("css-slab-top");
  const slabSide = document.getElementById("css-slab-side");
  const depthInput = document.getElementById("css-depth");
  const angleInput = document.getElementById("css-angle");
  const depthOut = document.getElementById("css-depth-val");
  const angleOut = document.getElementById("css-angle-val");
  const codeBox = document.getElementById("css-code-out");
  const dirBtns = [...document.querySelectorAll("[data-css-dir]")];
  if (!stage || !slabTop || !slabSide) return;

  let dir = "tr"; // "tr" | "tl" | "br" | "bl"
  let thickness = 26;
  let angle = 45;

  function update() {
    const a = angle * RAD;
    const dx = +(thickness * Math.cos(a)).toFixed(1);
    const dy = +(thickness * Math.sin(a)).toFixed(1);
    const sx = (dir === "tr" || dir === "br") ? 1 : -1;
    const sy = (dir === "tr" || dir === "tl") ? -1 : 1; // 屏幕 Y 向下

    const skewTopDeg = +(Math.atan2(dx * sx, dy * (-sy)) * 180 / Math.PI).toFixed(1);
    const skewSideDeg = +(Math.atan2(dy * sy, dx * sx) * 180 / Math.PI).toFixed(1);

    // 水平挤出面（顶面或底面）
    if (sy < 0) {
      // 向上挤出（顶面）
      slabTop.style.top = `${-dy}px`;
      slabTop.style.bottom = "auto";
      slabTop.style.height = `${dy}px`;
      slabTop.style.transformOrigin = "bottom left";
      slabTop.style.transform = `skewX(${sx > 0 ? -Math.abs(90 - angle) : Math.abs(90 - angle)}deg)`;
    } else {
      // 向下挤出（底面）
      slabTop.style.top = "auto";
      slabTop.style.bottom = `${-dy}px`;
      slabTop.style.height = `${dy}px`;
      slabTop.style.transformOrigin = "top left";
      slabTop.style.transform = `skewX(${sx > 0 ? Math.abs(90 - angle) : -Math.abs(90 - angle)}deg)`;
    }

    // 垂直挤出面（右侧面或左侧面）
    if (sx > 0) {
      slabSide.style.left = "100%";
      slabSide.style.right = "auto";
      slabSide.style.width = `${dx}px`;
      slabSide.style.transformOrigin = "top left";
      slabSide.style.transform = `skewY(${sy < 0 ? -angle : angle}deg)`;
    } else {
      slabSide.style.left = "auto";
      slabSide.style.right = "100%";
      slabSide.style.width = `${dx}px`;
      slabSide.style.transformOrigin = "top right";
      slabSide.style.transform = `skewY(${sy < 0 ? angle : -angle}deg)`;
    }

    const topSkewVal = sy < 0
      ? (sx > 0 ? -(90 - angle) : (90 - angle))
      : (sx > 0 ? (90 - angle) : -(90 - angle));
    const sideSkewVal = sx > 0
      ? (sy < 0 ? -angle : angle)
      : (sy < 0 ? angle : -angle);

    depthOut.textContent = `${thickness}px`;
    angleOut.textContent = `${angle}°`;
    codeBox.textContent =
`.card-front { transform: none; } /* 正面 0° 真形，字形像素锐利 */
.slab-cap  { height: ${dy}px; transform: skewX(${topSkewVal}deg); }
.slab-side { width:  ${dx}px; transform: skewY(${sideSkewVal}deg); }`;
    void skewTopDeg;
    void skewSideDeg;
  }

  depthInput.addEventListener("input", () => { thickness = +depthInput.value; update(); });
  angleInput.addEventListener("input", () => { angle = +angleInput.value; update(); });
  dirBtns.forEach((b) => b.addEventListener("click", () => {
    dir = b.dataset.cssDir;
    dirBtns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    update();
  }));
  update();
}

// =========================================================================
// 06 节：浓松绿暗室 · 四类反例翻转诊断卡（症状 ↔ 改法）
// =========================================================================
export function initAntiPatternCards() {
  const btns = [...document.querySelectorAll("[data-flip-card]")];
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".anti-card");
      if (!card) return;
      const fixed = card.dataset.state === "fix";
      card.dataset.state = fixed ? "bad" : "fix";
      btn.setAttribute("aria-pressed", String(!fixed));
      btn.textContent = fixed ? "查看对口改法 →" : "← 切回斜投影翻车态";
    });
  });
}

// =========================================================================
// 07 节：小练习 · 单变量四选一几何判题台
// =========================================================================
export function initPracticeQuiz() {
  const btns = [...document.querySelectorAll("[data-quiz-opt]")];
  const verdict = document.getElementById("quiz-verdict");
  const vTitle = document.getElementById("quiz-title");
  const vBody = document.getElementById("quiz-body");
  if (!btns.length) return;

  let revealed = false;
  let pickedId = null;

  function renderOptionCanvas(canvas, opt, showGuides) {
    const ctx = canvas.getContext("2d");
    const r = canvas.getBoundingClientRect();
    const W = Math.max(220, Math.round(r.width || 280));
    const H = Math.max(150, Math.round(r.height || 180));
    const dpr = pixelRatio(2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = PAL.paper;
    ctx.fillRect(0, 0, W, H);

    // 淡基准线
    ctx.strokeStyle = "rgba(10, 46, 32, 0.14)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(W * 0.06, H * 0.80); ctx.lineTo(W * 0.94, H * 0.80); ctx.stroke();
    ctx.setLineDash([]);

    // 逐块绘制（同源多边形）
    const rayColor = opt.correct ? PAL.ok : PAL.err;
    for (const b of opt.boxes) {
      const ox = b.x * W;
      const oy = b.y * H;
      const bw = b.w * W;
      const bh = b.h * H;
      const bd = b.d * Math.min(W, H);

      const fbl = { x: ox, y: oy };
      const fbr = { x: ox + bw, y: oy };
      const ftr = { x: ox + bw, y: oy - bh };
      const ftl = { x: ox, y: oy - bh };

      let bbr, btr, btl;
      if (b.convergeTo) {
        // 偷偷汇聚到右上一点
        const vp = { x: b.convergeTo.x * W, y: b.convergeTo.y * H };
        const push = (pt) => {
          const vx = vp.x - pt.x, vy = vp.y - pt.y;
          const dist = Math.hypot(vx, vy) || 1;
          const step = Math.min(dist * 0.45, bd * b.depthRatio);
          return { x: pt.x + (vx / dist) * step, y: pt.y + (vy / dist) * step };
        };
        bbr = push(fbr);
        btr = push(ftr);
        btl = push(ftl);
      } else {
        const a = b.angleDeg * RAD;
        const dx = bd * b.depthRatio * Math.cos(a);
        const dy = -bd * b.depthRatio * Math.sin(a);
        bbr = { x: fbr.x + dx, y: fbr.y + dy };
        btr = { x: ftr.x + dx, y: ftr.y + dy };
        btl = { x: ftl.x + dx, y: ftl.y + dy };
      }

      fillPoly(ctx, [ftl, ftr, btr, btl], PAL.sageTop, PAL.pine, 1.6);
      fillPoly(ctx, [fbr, bbr, btr, ftr], PAL.sageSide, PAL.pine, 1.6);
      fillPoly(ctx, [fbl, fbr, ftr, ftl], PAL.vermilion, PAL.pine, 1.8);

      // 答题后显出检验辅助延长虚线
      if (showGuides) {
        ctx.save();
        ctx.strokeStyle = rayColor;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 3]);
        const ex = btr.x - ftr.x, ey = btr.y - ftr.y;
        const elen = Math.hypot(ex, ey) || 1;
        const reach = W * 0.55;
        ctx.beginPath();
        ctx.moveTo(ftr.x, ftr.y);
        ctx.lineTo(ftr.x + (ex / elen) * reach, ftr.y + (ey / elen) * reach);
        ctx.stroke();
        ctx.restore();
      }
    }

    if (showGuides) {
      // 右下标注检验结果
      ctx.fillStyle = opt.correct ? PAL.ok : PAL.err;
      ctx.font = '700 11px "JetBrains Mono", "Noto Sans SC", sans-serif';
      ctx.textAlign = "right";
      ctx.fillText(opt.tag, W - 10, H - 10);
    }
  }

  function redrawAll() {
    btns.forEach((btn) => {
      const opt = PRACTICE_OPTIONS.find((o) => o.id === btn.dataset.quizOpt);
      const canvas = btn.querySelector("canvas");
      if (canvas && opt) renderOptionCanvas(canvas, opt, revealed);
    });
  }

  btns.forEach((btn) => {
    const opt = PRACTICE_OPTIONS.find((o) => o.id === btn.dataset.quizOpt);
    btn.addEventListener("click", () => {
      revealed = true;
      pickedId = opt.id;
      btns.forEach((b) => {
        const o = PRACTICE_OPTIONS.find((x) => x.id === b.dataset.quizOpt);
        b.setAttribute("aria-pressed", String(b === btn));
        b.dataset.judge = o.correct ? "right" : (b === btn ? "wrong" : "dim");
      });
      verdict.dataset.state = opt.correct ? "right" : "wrong";
      vTitle.textContent = opt.correct
        ? `选对了（${opt.id}）— 严格平行 45° + 0.50× 橱柜缩深`
        : `再看看（你选了 ${opt.id}，正解是 C）— ${opt.tag}`;
      vBody.textContent = opt.correct
        ? opt.reason
        : `${opt.reason} 对比四张图刚刚显出的辅助虚线，只有 C 让三块斜线始终互相平行且进深不过长。`;
      redrawAll();
    });
  });

  const ro = new ResizeObserver(redrawAll);
  btns.forEach((b) => ro.observe(b));
  redrawAll();
  void pickedId;
}

// =========================================================================
// 08 节：原海报可放大、可拖拽、Esc 关闭灯箱
// =========================================================================
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-btn");
  const posterImg = document.getElementById("poster");
  const modal = document.getElementById("poster-modal");
  const stage = document.getElementById("lightbox-stage");
  const zoomImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomToggle = document.getElementById("lightbox-zoom");
  if (!trigger || !posterImg || !modal || !zoomImg) return;

  let zoomed = false;
  let tx = 0, ty = 0;
  let drag = null;

  function applyTransform() {
    zoomImg.style.transform = zoomed ? `translate(${tx}px, ${ty}px) scale(1.75)` : "translate(0px, 0px) scale(1)";
    stage.dataset.zoomed = zoomed ? "true" : "false";
    zoomToggle.textContent = zoomed ? "还原大小" : "放大细节";
  }

  function open() {
    zoomImg.src = posterImg.src;
    zoomed = false;
    tx = 0; ty = 0;
    applyTransform();
    modal.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    closeBtn.focus();
  }

  function close() {
    modal.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) close(); });

  zoomToggle.addEventListener("click", () => {
    zoomed = !zoomed;
    if (!zoomed) { tx = 0; ty = 0; }
    applyTransform();
  });

  stage.addEventListener("pointerdown", (e) => {
    if (!zoomed) return;
    drag = { x: e.clientX - tx, y: e.clientY - ty, moved: false };
    stage.setPointerCapture?.(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = clamp(e.clientX - drag.x, -420, 420);
    ty = clamp(e.clientY - drag.y, -560, 560);
    drag.moved = true;
    applyTransform();
  });
  stage.addEventListener("pointerup", () => { drag = null; });
  stage.addEventListener("pointercancel", () => { drag = null; });
  zoomImg.addEventListener("dblclick", () => {
    zoomed = !zoomed;
    if (!zoomed) { tx = 0; ty = 0; }
    applyTransform();
  });
}

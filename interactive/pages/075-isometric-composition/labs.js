// 075 等距构图 · 第 01–08 节全部互动实验台与海报灯箱
import { pixelRatio } from "../../lib/stage.js";
import {
  APPLICATIONS,
  INITIAL_GRID_4X4,
  ISO_PITCH,
  QUIZ_OPTIONS,
  STANDARDS,
  TILE_TYPES,
  TIMELINE,
  projectPoint,
} from "./model.js";

function fitCanvas(canvas) {
  const r = canvas.getBoundingClientRect();
  const w = Math.max(220, Math.round(r.width));
  const h = Math.max(160, Math.round(r.height));
  const dpr = pixelRatio(2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  return { w, h, dpr };
}

function drawIsoPrism(ctx, { x, y, z, dx = 1, dy = 1, dz = 1, center, projOpts, colors, stroke = "#070C14", lw = 1.3 }) {
  const pt = (lx, ly, lz) =>
    projectPoint({ x: x + lx - center.x, y: y + ly - center.y, z: z + lz - center.z }, projOpts);

  const p000 = pt(0, 0, 0);
  const p100 = pt(dx, 0, 0);
  const p110 = pt(dx, dy, 0);
  const p010 = pt(0, dy, 0);
  const p001 = pt(0, 0, dz);
  const p101 = pt(dx, 0, dz);
  const p111 = pt(dx, dy, dz);
  const p011 = pt(0, dy, dz);

  const faces = [
    { pts: [p010, p011, p111, p110], fill: colors.top },
    { pts: [p011, p001, p101, p111], fill: colors.left },
    { pts: [p111, p101, p100, p110], fill: colors.right },
  ];

  for (const f of faces) {
    ctx.beginPath();
    f.pts.forEach((p, i) => (i ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy)));
    ctx.closePath();
    ctx.fillStyle = f.fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.lineJoin = "round";
      ctx.stroke();
    }
  }
  return { p000, p100, p110, p010, p001, p101, p111, p011 };
}

// ============================================================
// 01 节：严格等角投影 (0.816) vs 1:1 简法 vs 2:1 像素二等轴测
// ============================================================
function initLab01() {
  const canvas = document.getElementById("s01-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const btns = [...document.querySelectorAll("[data-std]")];
  const noteTitle = document.getElementById("s01-std-title");
  const noteSummary = document.getElementById("s01-std-summary");
  const notePixel = document.getElementById("s01-std-pixel");
  const readAngles = document.getElementById("s01-read-angle");
  const readScales = document.getElementById("s01-read-scales");

  let active = "trueIso";

  function draw() {
    const std = STANDARDS[active];
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#F5FEFB";
    ctx.fillRect(0, 0, w, h);

    const split = w >= 520 ? w * 0.54 : w;
    const stacked = w < 520;
    const leftH = stacked ? h * 0.56 : h;

    // 左半区：立方体与三轴对比（始终叠画 0.816 严格投影虚框作为参照基准）
    const cx = split * 0.5;
    const cy = leftH * 0.55;
    const baseUnit = Math.min(split * 0.28, leftH * 0.34);
    const mult = active === "isoDrawing" ? 1 / Math.sqrt(2 / 3) : 1;

    // 基准虚线外框（严格等角 0.816）
    const refOpts = { yaw: 45, pitch: ISO_PITCH, persp: 0, scale: baseUnit, cx, cy };
    const pRef = (lx, ly, lz) => projectPoint({ x: lx - 0.5, y: ly - 0.5, z: lz - 0.5 }, refOpts);
    const hexRef = [pRef(0, 1, 0), pRef(0, 1, 1), pRef(0, 0, 1), pRef(1, 0, 1), pRef(1, 0, 0), pRef(1, 1, 0)];
    ctx.save();
    ctx.strokeStyle = "rgba(83, 18, 166, 0.38)";
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    hexRef.forEach((p, i) => (i ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy)));
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // 当前标准实绘立方体
    const curOpts = { yaw: 45, pitch: std.pitchDeg, persp: 0, scale: baseUnit * mult, cx, cy };
    const pts = drawIsoPrism(ctx, {
      x: 0,
      y: 0,
      z: 0,
      center: { x: 0.5, y: 0.5, z: 0.5 },
      projOpts: curOpts,
      colors: { top: "#FAF5CE", left: "#7C28E6", right: "#3DB698" },
      lw: 1.5,
    });

    // 标出底边与水平线夹角（30.0° vs 26.6°）
    const bBot = pts.p101;
    const bRight = pts.p100;
    ctx.save();
    ctx.strokeStyle = "#5312A6";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(bBot.sx - 68, bBot.sy);
    ctx.lineTo(bBot.sx + 78, bBot.sy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#5312A6";
    ctx.font = '700 11px "Space Mono", monospace';
    ctx.textAlign = "left";
    ctx.fillText(`${std.groundDeg.toFixed(1)}°`, bRight.sx + 6, bBot.sy - 6);
    ctx.fillStyle = "#3A4D59";
    ctx.font = '600 11px "Noto Sans SC", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("虚线 = 严格等角投影基准 (0.816×)", 14, 22);
    ctx.restore();

    // 右半区（窄屏为下半区）：14×8 像素网格放大镜，实绘底边栅格化锯齿差异
    const pxX = stacked ? 16 : split + 12;
    const pxY = stacked ? leftH + 10 : 18;
    const pxW = (stacked ? w - 32 : w - split - 26);
    const pxH = (stacked ? h - leftH - 22 : h - 36);

    ctx.save();
    ctx.fillStyle = "#E8FCF7";
    ctx.strokeStyle = "#0F5E4B";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.roundRect(pxX, pxY, pxW, pxH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#070C14";
    ctx.font = '700 11px "Noto Sans SC", sans-serif';
    ctx.fillText("像素网格放大镜（底边栅格化实测）", pxX + 12, pxY + 20);

    const cols = 14;
    const rows = 8;
    const cell = Math.min((pxW - 24) / cols, (pxH - 48) / rows);
    const gx0 = pxX + (pxW - cols * cell) * 0.5;
    const gy0 = pxY + 32 + (pxH - 44 - rows * cell) * 0.5;
    const slope = Math.tan((std.groundDeg * Math.PI) / 180);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const expectedRow = rows - 1 - Math.floor(c * slope + 0.0001);
        const lit = r === expectedRow;
        ctx.fillStyle = lit ? (active === "pixel21" ? "#0F5E4B" : "#7C28E6") : "#FFFFFF";
        ctx.fillRect(gx0 + c * cell, gy0 + r * cell, cell - 1, cell - 1);
      }
    }

    // 理想斜率白/红参考线
    ctx.strokeStyle = "#B31B34";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(gx0, gy0 + (rows - 0.5) * cell);
    ctx.lineTo(gx0 + (cols - 0.2) * cell, gy0 + (rows - 0.5 - (cols - 0.2) * slope) * cell);
    ctx.stroke();

    ctx.fillStyle = active === "pixel21" ? "#0F5E4B" : "#5312A6";
    ctx.font = '700 10px "Space Mono", "Noto Sans SC", monospace';
    ctx.fillText(
      active === "pixel21" ? "步进 2-2-2-2-2 · 零锯齿" : "步进 2-2-1-2-2-1 · 存在杂齿",
      pxX + 12,
      pxY + pxH - 10
    );
    ctx.restore();
    ctx.restore();

    if (noteTitle) noteTitle.textContent = std.label;
    if (noteSummary) noteSummary.textContent = std.summary;
    if (notePixel) notePixel.textContent = std.pixelNote;
    if (readAngles) readAngles.textContent = `底边 ${std.groundDeg.toFixed(1)}° · 俯角 ${std.pitchDeg.toFixed(1)}°`;
    if (readScales) readScales.textContent = `X ${std.scaleXYZ[0].toFixed(3)} · Y ${std.scaleXYZ[1].toFixed(3)} · Z ${std.scaleXYZ[2].toFixed(3)}`;
  }

  for (const b of btns) {
    b.addEventListener("click", () => {
      active = b.dataset.std;
      for (const o of btns) o.setAttribute("aria-pressed", String(o.dataset.std === active));
      draw();
    });
  }
  window.addEventListener("resize", draw);
  draw();
}

// ============================================================
// 02 节：前后深度传送带 × 双窗实体像素卡尺（透视 vs 等距）
// ============================================================
function initLab02() {
  const canvas = document.getElementById("s02-canvas");
  const slider = document.getElementById("s02-depth");
  if (!canvas || !slider) return;
  const ctx = canvas.getContext("2d");
  const outPersp = document.getElementById("s02-persp-px");
  const outIso = document.getElementById("s02-iso-px");
  const outDepth = document.getElementById("s02-depth-val");
  const outVerdict = document.getElementById("s02-verdict");

  let depth = Number(slider.value) || 0; // 0 (近处) .. 6 (最远)

  function draw() {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#FAF6DC";
    ctx.fillRect(0, 0, w, h);

    const half = w * 0.5;
    const pw0 = half - 16;
    const unit = Math.min(pw0 / 6.8, h / 5.4);

    // 绘制左右两个完全对称的轨道面板
    const panels = [
      { title: "透视投影（有消失点）", persp: 0.44, ox: half * 0.5, accent: "#B31B34", bg: "#FFF8F2" },
      { title: "等距投影（平行无汇聚）", persp: 0, ox: half * 1.5, accent: "#0F5E4B", bg: "#E8FCF7" },
    ];

    const measured = [];

    panels.forEach((panel, idx) => {
      const px0 = idx * half + 8;
      const pw = half - 16;
      ctx.save();
      ctx.fillStyle = panel.bg;
      ctx.strokeStyle = "#070C14";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(px0, 8, pw, h - 16, 8);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(px0 + 1, 9, pw - 2, h - 18, 7);
      ctx.clip();

      const cy = h * 0.53;
      const projOpts = { yaw: 45, pitch: ISO_PITCH, persp: panel.persp, scale: unit, cx: panel.ox + pw * 0.02, cy };
      const center = { x: 0.5, y: 0.45, z: 2.8 };

      // 轨道地面格（沿 Z 轴从 0 延伸到 5.6，前后两端完整留在画框内）
      ctx.strokeStyle = idx === 0 ? "rgba(179, 27, 52, 0.3)" : "rgba(15, 94, 75, 0.3)";
      ctx.lineWidth = 1.1;
      for (let z = 0; z <= 6; z++) {
        const a = projectPoint({ x: -0.4 - center.x, y: -center.y, z: z - center.z }, projOpts);
        const b = projectPoint({ x: 1.4 - center.x, y: -center.y, z: z - center.z }, projOpts);
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
      }
      for (const x of [-0.4, 0.5, 1.4]) {
        const a = projectPoint({ x: x - center.x, y: -center.y, z: 0 - center.z }, projOpts);
        const b = projectPoint({ x: x - center.x, y: -center.y, z: 6 - center.z }, projOpts);
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
      }

      // 在最前排 z=4.6（近）画一枚半透明固定参照虚影，depth 0..6 映射到 z=4.6..0.2
      const zFront = 4.6;
      const zCur = 4.6 - (depth / 6) * 4.4;
      const refPts = drawIsoPrism(ctx, {
        x: 0,
        y: 0,
        z: zFront,
        center,
        projOpts,
        colors: { top: "rgba(250,245,206,0.35)", left: "rgba(124,40,230,0.16)", right: "rgba(61,182,152,0.18)" },
        stroke: "rgba(7,12,20,0.35)",
        lw: 1,
      });

      // 绘制可移动的实心方块
      const curPts = drawIsoPrism(ctx, {
        x: 0,
        y: 0,
        z: zCur,
        center,
        projOpts,
        colors: { top: "#FAF5CE", left: "#7C28E6", right: "#3DB698" },
        lw: 1.5,
      });

      const curH = Math.hypot(curPts.p111.sx - curPts.p101.sx, curPts.p111.sy - curPts.p101.sy);
      const refH = Math.hypot(refPts.p111.sx - refPts.p101.sx, refPts.p111.sy - refPts.p101.sy);
      measured.push({ curH, refH });

      // 实时卡尺线
      const calX = curPts.p100.sx + 12;
      ctx.strokeStyle = panel.accent;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(calX, curPts.p110.sy);
      ctx.lineTo(calX, curPts.p100.sy);
      ctx.moveTo(calX - 4, curPts.p110.sy);
      ctx.lineTo(calX + 4, curPts.p110.sy);
      ctx.moveTo(calX - 4, curPts.p100.sy);
      ctx.lineTo(calX + 4, curPts.p100.sy);
      ctx.stroke();

      ctx.fillStyle = panel.accent;
      ctx.font = '700 11px "Space Mono", monospace';
      ctx.textAlign = "left";
      ctx.fillText(`${curH.toFixed(1)}px`, Math.min(px0 + pw - 46, calX + 6), (curPts.p110.sy + curPts.p100.sy) * 0.5 + 4);

      ctx.fillStyle = "#070C14";
      ctx.font = '700 12px "Noto Sans SC", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(panel.title, px0 + 12, 26);

      ctx.restore();
    });

    ctx.restore();

    const pShrink = measured[0].refH > 0 ? Math.round((1 - measured[0].curH / measured[0].refH) * 100) : 0;
    if (outDepth) outDepth.textContent = `退深 ${depth.toFixed(1)} 格`;
    if (outPersp) outPersp.textContent = `${measured[0].curH.toFixed(1)}px（缩水 ${pShrink}%）`;
    if (outIso) outIso.textContent = `${measured[1].curH.toFixed(1)}px（误差 0%）`;
    if (outVerdict) {
      outVerdict.textContent =
        depth < 0.4
          ? "此刻方块都在最前排起点，两边的初始体量还很接近；试着把滑轨往右推向最远端。"
          : `同一块标准模块往深处退了 ${depth.toFixed(1)} 格：左图透视缩水了 ${pShrink}%、必须按景深重算尺寸；右图等距分毫不差，一套模块素材直接复制到任何位置都能严丝合缝。`;
    }
  }

  slider.addEventListener("input", () => {
    depth = Number(slider.value);
    draw();
  });
  window.addEventListener("resize", draw);
  draw();
}

// ============================================================
// 03 节：4×4 等距地块印章建造台 × 三面明暗纪律测试
// ============================================================
function initLab03() {
  const canvas = document.getElementById("s03-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const stampBtns = [...document.querySelectorAll("[data-tile-stamp]")];
  const lightBtns = [...document.querySelectorAll("[data-light-mode]")];
  const resetBtn = document.getElementById("s03-reset");
  const readout = document.getElementById("s03-readout");

  let grid = INITIAL_GRID_4X4.map((r) => [...r]);
  let activeStamp = "cube";
  let lightMode = "discipline"; // "discipline" | "flat" | "chaos"
  let cellPolys = [];

  function cellColors(r, c) {
    if (lightMode === "flat") {
      return { top: "#8FE2CD", left: "#82D4BF", right: "#88DAC6" };
    }
    if (lightMode === "chaos") {
      const sets = [
        { top: "#7C28E6", left: "#FAF5CE", right: "#3DB698" },
        { top: "#3DB698", left: "#3DB698", right: "#FAF5CE" },
        { top: "#FAF5CE", left: "#141842", right: "#7C28E6" },
      ];
      return sets[(r * 3 + c) % sets.length];
    }
    return { top: "#FAF5CE", left: "#7C28E6", right: "#3DB698" };
  }

  function draw() {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#92F7DF";
    ctx.fillRect(0, 0, w, h);

    const unit = Math.min(w / 6.8, h / 5.4);
    const cx = w * 0.5;
    const cy = h * 0.58;
    const projOpts = { yaw: 45, pitch: ISO_PITCH, persp: 0, scale: unit, cx, cy };
    const center = { x: 2.0, y: 0.6, z: 2.0 };

    cellPolys = [];

    // 1. 先画 4×4 等距地块底座并收集点击区
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const p0 = projectPoint({ x: c - center.x, y: -center.y, z: r - center.z }, projOpts);
        const p1 = projectPoint({ x: c + 1 - center.x, y: -center.y, z: r - center.z }, projOpts);
        const p2 = projectPoint({ x: c + 1 - center.x, y: -center.y, z: r + 1 - center.z }, projOpts);
        const p3 = projectPoint({ x: c - center.x, y: -center.y, z: r + 1 - center.z }, projOpts);
        ctx.beginPath();
        ctx.moveTo(p0.sx, p0.sy);
        ctx.lineTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.lineTo(p3.sx, p3.sy);
        ctx.closePath();
        ctx.fillStyle = (r + c) % 2 === 0 ? "#E8FCF7" : "#D2FAEF";
        ctx.fill();
        ctx.strokeStyle = "rgba(15, 94, 75, 0.45)";
        ctx.lineWidth = 1;
        ctx.stroke();
        cellPolys.push({ r, c, pts: [p0, p1, p2, p3] });
      }
    }

    // 2. 按后到前画家顺序绘制已印下的模块
    let count = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const t = grid[r][c];
        if (t === "empty") continue;
        count++;
        const cols = cellColors(r, c);
        if (t === "cube") {
          drawIsoPrism(ctx, { x: c, y: 0, z: r, center, projOpts, colors: cols, lw: 1.3 });
        } else if (t === "tower") {
          drawIsoPrism(ctx, { x: c, y: 0, z: r, center, projOpts, colors: cols, lw: 1.3 });
          drawIsoPrism(ctx, { x: c, y: 1, z: r, center, projOpts, colors: cols, lw: 1.3 });
        } else if (t === "stair") {
          for (let s = 0; s < 4; s++) {
            drawIsoPrism(ctx, {
              x: c,
              y: 0,
              z: r + s * 0.25,
              dx: 1,
              dy: (4 - s) * 0.25,
              dz: 0.25,
              center,
              projOpts,
              colors: cols,
              lw: 1.1,
            });
          }
        } else if (t === "arch") {
          const pts = drawIsoPrism(ctx, { x: c, y: 0, z: r, center, projOpts, colors: cols, lw: 1.3 });
          const lerp = (a, b, u) => ({ sx: a.sx + (b.sx - a.sx) * u, sy: a.sy + (b.sy - a.sy) * u });
          const bL = lerp(pts.p001, pts.p101, 0.26);
          const bR = lerp(pts.p001, pts.p101, 0.74);
          const tL = lerp(bL, lerp(pts.p011, pts.p111, 0.26), 0.72);
          const tR = lerp(bR, lerp(pts.p011, pts.p111, 0.74), 0.72);
          ctx.beginPath();
          ctx.moveTo(bL.sx, bL.sy);
          ctx.lineTo(tL.sx, tL.sy);
          ctx.lineTo(tR.sx, tR.sy);
          ctx.lineTo(bR.sx, bR.sy);
          ctx.closePath();
          ctx.fillStyle = lightMode === "flat" ? "#77C8B3" : "#141842";
          ctx.fill();
        }
      }
    }

    ctx.fillStyle = "#070C14";
    ctx.font = '700 11px "Noto Sans SC", sans-serif';
    ctx.fillText(`点击菱形格印放「${TILE_TYPES.find((x) => x.id === activeStamp)?.label}」 · 当前 ${count} 块模块`, 14, 22);
    ctx.restore();

    if (readout) {
      if (lightMode === "discipline") {
        readout.textContent = `当前已拼装 ${count} 枚模块：所有顶面统一暖奶油最亮、左面统一电光紫最暗、右面统一翡翠绿居中。即使取消透视缩小，眼睛仍能在一瞬间切分每个转角与遮挡层次。`;
      } else if (lightMode === "flat") {
        readout.textContent = `警报（失辨反例）：已抽走三面明暗差——顶、左、右全挤在 8% 明度差内。没有透视线索又失去明暗分离后，原本立体的 ${count} 枚模块立刻融平成一张模糊六边形剪纸。`;
      } else {
        readout.textContent = `警报（光照乱向）：每个模块各自乱指光源，相邻方块明暗规则互相打架。模块化系统的秩序不仅靠 120° 线稿，更靠全局一致的三面明度映射。`;
      }
    }
  }

  function ptInQuad(px, py, pts) {
    let s = 0;
    for (let i = 0; i < 4; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % 4];
      const c = (b.sx - a.sx) * (py - a.sy) - (b.sy - a.sy) * (px - a.sx);
      if (Math.abs(c) < 1e-4) continue;
      const sg = c > 0 ? 1 : -1;
      if (!s) s = sg;
      else if (s !== sg) return false;
    }
    return s !== 0;
  }

  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    // 反向遍历优先命中前景地块
    for (let i = cellPolys.length - 1; i >= 0; i--) {
      if (ptInQuad(px, py, cellPolys[i].pts)) {
        const { r: gr, c: gc } = cellPolys[i];
        grid[gr][gc] = grid[gr][gc] === activeStamp && activeStamp !== "empty" ? "empty" : activeStamp;
        draw();
        break;
      }
    }
  });

  for (const b of stampBtns) {
    b.addEventListener("click", () => {
      activeStamp = b.dataset.tileStamp;
      for (const o of stampBtns) o.setAttribute("aria-pressed", String(o.dataset.tileStamp === activeStamp));
      draw();
    });
  }
  for (const b of lightBtns) {
    b.addEventListener("click", () => {
      lightMode = b.dataset.lightMode;
      for (const o of lightBtns) o.setAttribute("aria-pressed", String(o.dataset.lightMode === lightMode));
      draw();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      grid = INITIAL_GRID_4X4.map((r) => [...r]);
      lightMode = "discipline";
      for (const o of lightBtns) o.setAttribute("aria-pressed", String(o.dataset.lightMode === lightMode));
      draw();
    });
  }
  window.addEventListener("resize", draw);
  draw();
}

// ============================================================
// 04 节（午夜靛蓝暗室）：深度歧义（悬空投影）× 彭罗斯三角 3D 拆穿
// ============================================================
function initLab04() {
  const canvas = document.getElementById("s04-canvas");
  const modeBtns = [...document.querySelectorAll("[data-s04-mode]")];
  const shadowBtn = document.getElementById("s04-shadow-toggle");
  const rangeEl = document.getElementById("s04-range");
  const rangeLabel = document.getElementById("s04-range-label");
  const rangeVal = document.getElementById("s04-range-val");
  const noteEl = document.getElementById("s04-note");
  if (!canvas || !rangeEl) return;

  const ctx = canvas.getContext("2d");
  let mode = "shadow"; // "shadow" | "penrose"
  let showShadow = false;
  let sliderVal = 1.6; // shadow 模式下为高度 0..2.8；penrose 模式下为偏转角 0..36°

  function syncControls() {
    for (const b of modeBtns) b.setAttribute("aria-pressed", String(b.dataset.s04Mode === mode));
    if (shadowBtn) {
      shadowBtn.hidden = mode !== "shadow";
      shadowBtn.setAttribute("aria-pressed", String(showShadow));
      shadowBtn.textContent = showShadow ? "地面投影（Zaxxon 解法）：开" : "地面投影（Zaxxon 解法）：关";
    }
    if (mode === "shadow") {
      rangeEl.min = "0";
      rangeEl.max = "2.6";
      rangeEl.step = "0.1";
      rangeEl.value = String(sliderVal.toFixed(1));
      if (rangeLabel) rangeLabel.textContent = "沿视线轴 (k, k, k) 抬升高度";
      if (rangeVal) rangeVal.textContent = `悬空 +${sliderVal.toFixed(1)} 格`;
    } else {
      rangeEl.min = "0";
      rangeEl.max = "36";
      rangeEl.step = "1";
      rangeEl.value = String(Math.round(sliderVal));
      if (rangeLabel) rangeLabel.textContent = "偏离等角视向（拆穿不可能闭环）";
      if (rangeVal) rangeVal.textContent = `偏转 +${Math.round(sliderVal)}°`;
    }
  }

  function draw() {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#141842";
    ctx.fillRect(0, 0, w, h);

    if (mode === "shadow") {
      const unit = Math.min(w / 7.8, h / 5.4);
      const projOpts = { yaw: 45, pitch: ISO_PITCH, persp: 0, scale: unit, cx: w * 0.5, cy: h * 0.58 };
      const center = { x: 1.8, y: 0.7, z: 1.8 };

      // 地面 5×5 蓝图方格
      ctx.strokeStyle = "rgba(117, 240, 207, 0.22)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const a1 = projectPoint({ x: i - center.x, y: -center.y, z: 0 - center.z }, projOpts);
        const a2 = projectPoint({ x: i - center.x, y: -center.y, z: 5 - center.z }, projOpts);
        ctx.beginPath();
        ctx.moveTo(a1.sx, a1.sy);
        ctx.lineTo(a2.sx, a2.sy);
        ctx.stroke();
        const b1 = projectPoint({ x: 0 - center.x, y: -center.y, z: i - center.z }, projOpts);
        const b2 = projectPoint({ x: 5 - center.x, y: -center.y, z: i - center.z }, projOpts);
        ctx.beginPath();
        ctx.moveTo(b1.sx, b1.sy);
        ctx.lineTo(b2.sx, b2.sy);
        ctx.stroke();
      }

      // 悬空方块沿对角视线轴 (1 + k, k, 1 + k) 移动：它在二维屏幕上的位置纹丝不动！
      const k = sliderVal;
      const vx = 1.0 + k;
      const vy = k;
      const vz = 1.0 + k;

      // 地面落影 + 垂直高度测绳（开启时立刻破除歧义）
      if (showShadow) {
        const sp0 = projectPoint({ x: vx - center.x, y: -center.y, z: vz - center.z }, projOpts);
        const sp1 = projectPoint({ x: vx + 1 - center.x, y: -center.y, z: vz - center.z }, projOpts);
        const sp2 = projectPoint({ x: vx + 1 - center.x, y: -center.y, z: vz + 1 - center.z }, projOpts);
        const sp3 = projectPoint({ x: vx - center.x, y: -center.y, z: vz + 1 - center.z }, projOpts);
        ctx.beginPath();
        ctx.moveTo(sp0.sx, sp0.sy);
        ctx.lineTo(sp1.sx, sp1.sy);
        ctx.lineTo(sp2.sx, sp2.sy);
        ctx.lineTo(sp3.sx, sp3.sy);
        ctx.closePath();
        ctx.fillStyle = "rgba(117, 240, 207, 0.36)";
        ctx.fill();
        ctx.strokeStyle = "#75F0CF";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 垂直垂线
        const cBot = projectPoint({ x: vx + 0.5 - center.x, y: -center.y, z: vz + 0.5 - center.z }, projOpts);
        const cTop = projectPoint({ x: vx + 0.5 - center.x, y: vy - center.y, z: vz + 0.5 - center.z }, projOpts);
        ctx.save();
        ctx.strokeStyle = "#FAF5CE";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(cBot.sx, cBot.sy);
        ctx.lineTo(cTop.sx, cTop.sy);
        ctx.stroke();
        ctx.restore();
      }

      // 参照锚点：两侧边缘各立一枚矮柱标出真实地面标高，且不与中央悬空方块重影
      drawIsoPrism(ctx, {
        x: 0,
        y: 0,
        z: 3.6,
        dx: 0.55,
        dy: 0.45,
        dz: 0.55,
        center,
        projOpts,
        colors: { top: "#3A4485", left: "#232A66", right: "#2D3678" },
        stroke: "#75F0CF",
        lw: 1,
      });
      drawIsoPrism(ctx, {
        x: 3.6,
        y: 0,
        z: 0,
        dx: 0.55,
        dy: 0.45,
        dz: 0.55,
        center,
        projOpts,
        colors: { top: "#3A4485", left: "#232A66", right: "#2D3678" },
        stroke: "#75F0CF",
        lw: 1,
      });

      // 绘制主测试方块
      drawIsoPrism(ctx, {
        x: vx,
        y: vy,
        z: vz,
        center,
        projOpts,
        colors: { top: "#FAF5CE", left: "#9A52FF", right: "#3DB698" },
        stroke: "#070C14",
        lw: 1.5,
      });

      ctx.fillStyle = "#E8FCF7";
      ctx.font = '700 11px "Space Mono", "Noto Sans SC", monospace';
      ctx.fillText(`三维真实坐标 (${vx.toFixed(1)}, ${vy.toFixed(1)}, ${vz.toFixed(1)}) · 屏幕坐标完全不变`, 14, 22);

      if (noteEl) {
        noteEl.textContent = showShadow
          ? `打开地面阴影后真相大白：方块其实已沿视线方向升到高空 +${k.toFixed(1)} 格并移到前排 (${vx.toFixed(1)}, ${vz.toFixed(1)})。1982 年世嘉《Zaxxon》正是靠地面投影解决了等距空战的高度误判。`
          : `拖着滑轨把高度从 0 拉到 2.6 看看——方块在屏幕上的位置竟然分毫未动！因为等距没有近大远小，沿 (k, k, k) 对角视线移动的所有三维点都会投影到同一像素。打开「地面投影」立刻显形。`;
      }
    } else {
      // Penrose 三角 3D 开放 L-折臂模型：仅在 yaw=45°, pitch=35.26° 时首尾两块在屏幕上完美重叠闭合！
      const yaw = 45 + sliderVal;
      const pitch = ISO_PITCH - sliderVal * 0.22;
      const unit = Math.min(w / 7.8, h / 6.2);
      const projOpts = { yaw, pitch, persp: 0, scale: unit, cx: w * 0.5, cy: h * 0.54 };
      const center = { x: 2, y: 1.6, z: 2 };

      // 真实三维开放折臂（10 块立方体）：沿 +X 走 4 格，再沿 +Z 走 4 格，再沿 +Y 向上走 4 格
      // 注意：起点 (0, 0, 0) 与终点 (3, 3, 3) 恰好满足差向量 (3, 3, 3) 平行于等角视线向量 (1, 1, 1)！
      const blocks = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 3, y: 0, z: 0 },
        { x: 3, y: 0, z: 1 },
        { x: 3, y: 0, z: 2 },
        { x: 3, y: 0, z: 3 },
        { x: 3, y: 1, z: 3 },
        { x: 3, y: 2, z: 3 },
        { x: 3, y: 3, z: 3 },
      ];

      // 在精确 0° 偏转下用遮挡顺序制造经典 Penrose 无缝闭环；偏转 > 0 时按真实深度重排，缺口立刻暴露！
      const ordered = blocks.map((b, idx) => ({
        ...b,
        idx,
        zc: projectPoint({ x: b.x + 0.5 - center.x, y: b.y + 0.5 - center.y, z: b.z + 0.5 - center.z }, projOpts).zc,
      }));
      ordered.sort((a, b) => a.zc - b.zc);

      for (const b of ordered) {
        const isTip = b.idx === 0 || b.idx === blocks.length - 1;
        drawIsoPrism(ctx, {
          x: b.x,
          y: b.y,
          z: b.z,
          center,
          projOpts,
          colors: {
            top: isTip && sliderVal > 2 ? "#FF8DA1" : "#FAF5CE",
            left: "#8B42F5",
            right: "#3DB698",
          },
          stroke: "#070C14",
          lw: 1.4,
        });
      }

      // 偏转时画一条红色虚线连起真实三维里的起点 (0,0,0) 与终点 (3,3,3)，揭穿 3√3 的巨大空隙
      if (sliderVal > 1) {
        const a = projectPoint({ x: 0.5 - center.x, y: 0.5 - center.y, z: 0.5 - center.z }, projOpts);
        const b = projectPoint({ x: 3.5 - center.x, y: 3.5 - center.y, z: 3.5 - center.z }, projOpts);
        ctx.save();
        ctx.strokeStyle = "#FF8DA1";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
        ctx.restore();
      }

      ctx.fillStyle = "#E8FCF7";
      ctx.font = '700 11px "Space Mono", "Noto Sans SC", monospace';
      ctx.fillText(
        sliderVal < 1
          ? "等角锁死 45°/35.3°：(0,0,0) 与 (3,3,3) 首尾重叠为不可能三角"
          : `相机偏转 +${Math.round(sliderVal)}°：首尾真实间距 √27 ≈ 5.2 格立刻露馅`,
        14,
        22
      );

      if (noteEl) {
        noteEl.textContent =
          sliderVal < 1
            ? "此刻正是 Penrose（1958）与《纪念碑谷》利用的唯一魔法视向：两端在三维里相距 5.2 格，但因为差向量 (3, 3, 3) 恰好顺着视线、且等距不缩小远处方块，两块头尾严丝合缝咬成了闭合怪圈。拖动滑轨偏转相机试试！"
            : `只要视角偏开 +${Math.round(sliderVal)}°，首尾两块标粉的方块立刻分开，露出真实三维中长达 5.2 格的悬空断口——所有等距不可能图形都是「零透视 + 单一视线重合」的几何魔术。`;
      }
    }

    ctx.restore();
  }

  for (const b of modeBtns) {
    b.addEventListener("click", () => {
      mode = b.dataset.s04Mode;
      sliderVal = mode === "shadow" ? 1.6 : 0;
      syncControls();
      draw();
    });
  }
  if (shadowBtn) {
    shadowBtn.addEventListener("click", () => {
      showShadow = !showShadow;
      syncControls();
      draw();
    });
  }
  rangeEl.addEventListener("input", () => {
    sliderVal = Number(rangeEl.value);
    syncControls();
    draw();
  });
  window.addEventListener("resize", draw);
  syncControls();
  draw();
}

// ============================================================
// 05 节：两百年源流年代卡 + 对应矢量蓝图标本
// ============================================================
function initLab05() {
  const btns = [...document.querySelectorAll("[data-era]")];
  const yearEl = document.getElementById("s05-year");
  const whoEl = document.getElementById("s05-who");
  const titleEl = document.getElementById("s05-title");
  const summaryEl = document.getElementById("s05-summary");
  const detailEl = document.getElementById("s05-detail");
  const svgEl = document.getElementById("s05-svg");
  if (!btns.length || !svgEl) return;

  const DIAGRAMS = {
    farish: `
      <rect x="8" y="8" width="244" height="154" rx="8" fill="#E8FCF7" stroke="#0F5E4B" stroke-dasharray="4 3"/>
      <polygon points="130,30 184,61 130,92 76,61" fill="#FAF5CE" stroke="#070C14" stroke-width="1.5"/>
      <polygon points="76,61 130,92 130,144 76,113" fill="#7C28E6" stroke="#070C14" stroke-width="1.5"/>
      <polygon points="184,61 130,92 130,144 184,113" fill="#3DB698" stroke="#070C14" stroke-width="1.5"/>
      <line x1="130" y1="92" x2="130" y2="20" stroke="#070C14" stroke-width="1.2" stroke-dasharray="3 2"/>
      <circle cx="130" cy="61" r="14" fill="none" stroke="#5312A6" stroke-width="1.5"/>
      <text x="20" y="28" fill="#0F5E4B" font-family="'Space Mono',monospace" font-size="10" font-weight="700">1820–1822 FARISH</text>
      <text x="20" y="152" fill="#233340" font-family="'Space Mono',monospace" font-size="10">EQUAL MEASURE · 120° × 3</text>
    `,
    penrose: `
      <rect x="8" y="8" width="244" height="154" rx="8" fill="#141842" stroke="#75F0CF" stroke-dasharray="4 3"/>
      <polygon points="130,28 194,136 66,136" fill="none" stroke="#75F0CF" stroke-width="1.2" stroke-dasharray="4 3"/>
      <polygon points="130,34 146,60 98,124 82,124" fill="#FAF5CE" stroke="#070C14" stroke-width="1.4"/>
      <polygon points="130,34 186,124 170,124 122,48" fill="#3DB698" stroke="#070C14" stroke-width="1.4"/>
      <polygon points="82,124 186,124 178,138 74,138" fill="#9A52FF" stroke="#070C14" stroke-width="1.4"/>
      <text x="20" y="28" fill="#75F0CF" font-family="'Space Mono',monospace" font-size="10" font-weight="700">1934 / 1958 TRIBAR</text>
      <text x="20" y="154" fill="#B6C2E8" font-family="'Space Mono',monospace" font-size="10">ZERO FORESHORTENING LOOP</text>
    `,
    arcade: `
      <rect x="8" y="8" width="244" height="154" rx="8" fill="#FAF6DC" stroke="#5312A6" stroke-dasharray="4 3"/>
      <polygon points="130,38 164,56 130,74 96,56" fill="#FAF5CE" stroke="#070C14" stroke-width="1.4"/>
      <polygon points="96,56 130,74 130,104 96,86" fill="#7C28E6" stroke="#070C14" stroke-width="1.4"/>
      <polygon points="164,56 130,74 130,104 164,86" fill="#3DB698" stroke="#070C14" stroke-width="1.4"/>
      <polygon points="130,114 164,132 130,150 96,132" fill="rgba(15,94,75,0.28)" stroke="#0F5E4B" stroke-dasharray="3 2"/>
      <line x1="130" y1="104" x2="130" y2="132" stroke="#B31B34" stroke-width="1.6" stroke-dasharray="3 2"/>
      <text x="20" y="28" fill="#5312A6" font-family="'Space Mono',monospace" font-size="10" font-weight="700">1982 ZAXXON / Q*BERT</text>
      <text x="172" y="122" fill="#B31B34" font-family="'Noto Sans SC',sans-serif" font-size="10" font-weight="700">落影判高</text>
    `,
    iso: `
      <rect x="8" y="8" width="244" height="154" rx="8" fill="#E8FCF7" stroke="#070C14" stroke-dasharray="4 3"/>
      <circle cx="130" cy="88" r="30" fill="none" stroke="#7C28E6" stroke-width="1.3" stroke-dasharray="3 3"/>
      <line x1="130" y1="88" x2="130" y2="30" stroke="#070C14" stroke-width="2"/>
      <line x1="130" y1="88" x2="182" y2="118" stroke="#070C14" stroke-width="2"/>
      <line x1="130" y1="88" x2="78" y2="118" stroke="#070C14" stroke-width="2"/>
      <text x="166" y="66" fill="#5312A6" font-family="'Space Mono',monospace" font-size="11" font-weight="700">120°</text>
      <text x="94" y="66" fill="#5312A6" font-family="'Space Mono',monospace" font-size="11" font-weight="700">120°</text>
      <text x="130" y="138" text-anchor="middle" fill="#5312A6" font-family="'Space Mono',monospace" font-size="11" font-weight="700">√(2/3) ≈ 0.816</text>
      <text x="20" y="28" fill="#0F5E4B" font-family="'Space Mono',monospace" font-size="10" font-weight="700">ISO 5456-3:1996</text>
    `,
  };

  function show(id) {
    const item = TIMELINE.find((t) => t.id === id) || TIMELINE[0];
    for (const b of btns) b.setAttribute("aria-pressed", String(b.dataset.era === item.id));
    if (yearEl) yearEl.textContent = item.year;
    if (whoEl) whoEl.textContent = item.who;
    if (titleEl) titleEl.textContent = item.title;
    if (summaryEl) summaryEl.textContent = item.summary;
    if (detailEl) detailEl.textContent = item.detail;
    svgEl.innerHTML = DIAGRAMS[item.diagram] || DIAGRAMS.farish;
  }

  for (const b of btns) b.addEventListener("click", () => show(b.dataset.era));
  show("farish");
}

// ============================================================
// 06 节：四大应用筛选 + 「斜贴字 vs 水平标注」可读性对比开关
// ============================================================
function initLab06() {
  const appBtns = [...document.querySelectorAll("[data-app]")];
  const appTitle = document.getElementById("s06-app-title");
  const appEn = document.getElementById("s06-app-en");
  const appGood = document.getElementById("s06-app-good");
  const appWatch = document.getElementById("s06-app-watch");

  function showApp(id) {
    const item = APPLICATIONS[id] || APPLICATIONS.product;
    for (const b of appBtns) b.setAttribute("aria-pressed", String(b.dataset.app === item.id));
    if (appTitle) appTitle.textContent = item.label;
    if (appEn) appEn.textContent = item.en;
    if (appGood) appGood.textContent = item.good;
    if (appWatch) appWatch.textContent = item.watch;
  }
  for (const b of appBtns) b.addEventListener("click", () => showApp(b.dataset.app));
  showApp("product");

  // 斜贴文字 vs 水平标注对比
  const labelToggle = document.getElementById("s06-label-toggle");
  const labelSvg = document.getElementById("s06-label-svg");
  const labelCaption = document.getElementById("s06-label-caption");
  if (!labelToggle || !labelSvg) return;

  let flatLabels = false;
  function renderLabelDemo() {
    labelToggle.setAttribute("aria-pressed", String(flatLabels));
    labelToggle.textContent = flatLabels ? "当前：等距结构 + 水平标注（推荐）" : "当前：强行 30° 斜贴文字（难读）";

    const skewedBlock = `
      <g transform="translate(86,105) skewY(29) scale(0.76,0.88)">
        <text x="0" y="0" fill="#070C14" font-family="'Noto Sans SC',sans-serif" font-size="11" font-weight="700">核心节点</text>
        <text x="0" y="14" fill="#B31B34" font-family="'Space Mono',monospace" font-size="9.5" font-weight="700">98.4% SLA</text>
      </g>
      <g transform="translate(204,132) skewY(-29) scale(0.76,0.88)">
        <text x="0" y="0" fill="#070C14" font-family="'Noto Sans SC',sans-serif" font-size="11" font-weight="700">分流网关</text>
        <text x="0" y="14" fill="#B31B34" font-family="'Space Mono',monospace" font-size="9.5" font-weight="700">42ms P95</text>
      </g>
    `;
    const cleanBlock = `
      <line x1="112" y1="78" x2="54" y2="42" stroke="#5312A6" stroke-width="1.3"/>
      <circle cx="112" cy="78" r="3" fill="#5312A6"/>
      <rect x="10" y="20" width="96" height="34" rx="4" fill="#F5FEFB" stroke="#5312A6" stroke-width="1.2"/>
      <text x="58" y="34" text-anchor="middle" fill="#070C14" font-family="'Noto Sans SC',sans-serif" font-size="11" font-weight="700">核心节点</text>
      <text x="58" y="48" text-anchor="middle" fill="#0F5E4B" font-family="'Space Mono',monospace" font-size="10" font-weight="700">98.4% SLA</text>

      <line x1="202" y1="86" x2="256" y2="42" stroke="#0F5E4B" stroke-width="1.3"/>
      <circle cx="202" cy="86" r="3" fill="#0F5E4B"/>
      <rect x="206" y="20" width="96" height="34" rx="4" fill="#F5FEFB" stroke="#0F5E4B" stroke-width="1.2"/>
      <text x="254" y="34" text-anchor="middle" fill="#070C14" font-family="'Noto Sans SC',sans-serif" font-size="11" font-weight="700">分流网关</text>
      <text x="254" y="48" text-anchor="middle" fill="#0F5E4B" font-family="'Space Mono',monospace" font-size="10" font-weight="700">42ms P95</text>
    `;

    labelSvg.innerHTML = `
      <rect x="4" y="4" width="304" height="162" rx="8" fill="#E8FCF7" stroke="#0F5E4B" stroke-dasharray="4 3"/>
      <!-- 底座两块标准等距模块 -->
      <polygon points="122,64 164,88 122,112 80,88" fill="#FAF5CE" stroke="#070C14" stroke-width="1.3"/>
      <polygon points="80,88 122,112 122,146 80,122" fill="#C9A8F8" stroke="#070C14" stroke-width="1.3"/>
      <polygon points="164,88 122,112 122,146 164,122" fill="#3DB698" stroke="#070C14" stroke-width="1.3"/>

      <polygon points="200,72 242,96 200,120 158,96" fill="#FAF5CE" stroke="#070C14" stroke-width="1.3"/>
      <polygon points="158,96 200,120 200,152 158,128" fill="#7C28E6" stroke="#070C14" stroke-width="1.3"/>
      <polygon points="242,96 200,120 200,152 242,128" fill="#89DEC9" stroke="#070C14" stroke-width="1.3"/>
      ${flatLabels ? cleanBlock : skewedBlock}
    `;

    if (labelCaption) {
      labelCaption.textContent = flatLabels
        ? "图形用等距建立空间系统，数据与文字仍沿水平基线引出标注——既保留秩序感，又不让读者歪着脖子认字。"
        : "把信息文字硬生生斜切 30° 贴在方块立面上，中文笔画锯齿加重、数字难以横向比对，只在装饰性大字（如原海报封面）里克制使用。";
    }
  }

  labelToggle.addEventListener("click", () => {
    flatLabels = !flatLabels;
    renderLabelDemo();
  });
  renderLabelDemo();
}

// ============================================================
// 07 节：四选一小练习（四个中性方案，单真源几何实绘）
// ============================================================
function initLab07() {
  const canvases = [...document.querySelectorAll("[data-quiz-canvas]")];
  const cards = [...document.querySelectorAll("[data-quiz-choice]")];
  const feedback = document.getElementById("s07-feedback");
  const resetBtn = document.getElementById("s07-reset");
  if (!canvases.length || !cards.length) return;

  function renderOption(canvas, mode) {
    const { w, h, dpr } = fitCanvas(canvas);
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#E8FCF7";
    ctx.fillRect(0, 0, w, h);

    const persp = mode === "perspLeak" ? 0.42 : 0;
    const unit = Math.min(w / 6.2, h / 4.8);
    const projOpts = { yaw: 45, pitch: ISO_PITCH, persp, scale: unit, cx: w * 0.5, cy: h * 0.57 };
    const center = { x: 1.8, y: 0.7, z: 1.8 };

    // 淡网格底
    ctx.strokeStyle = "rgba(15, 94, 75, 0.22)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const a1 = projectPoint({ x: i - center.x, y: -center.y, z: 0 - center.z }, projOpts);
      const a2 = projectPoint({ x: i - center.x, y: -center.y, z: 4 - center.z }, projOpts);
      ctx.beginPath();
      ctx.moveTo(a1.sx, a1.sy);
      ctx.lineTo(a2.sx, a2.sy);
      ctx.stroke();
      const b1 = projectPoint({ x: 0 - center.x, y: -center.y, z: i - center.z }, projOpts);
      const b2 = projectPoint({ x: 4 - center.x, y: -center.y, z: i - center.z }, projOpts);
      ctx.beginPath();
      ctx.moveTo(b1.sx, b1.sy);
      ctx.lineTo(b2.sx, b2.sy);
      ctx.stroke();
    }

    const cols =
      mode === "flatTone"
        ? { top: "#9BE6D2", left: "#8EDBC7", right: "#94E0CC" }
        : { top: "#FAF5CE", left: "#7C28E6", right: "#3DB698" };

    // 悬空连廊下方投影（valid / perspLeak / offAxis 都有正常投影；确保单一变量差异清晰）
    if (mode !== "flatTone") {
      const s0 = projectPoint({ x: 1 - center.x, y: -center.y, z: 1.2 - center.z }, projOpts);
      const s1 = projectPoint({ x: 2 - center.x, y: -center.y, z: 1.2 - center.z }, projOpts);
      const s2 = projectPoint({ x: 2 - center.x, y: -center.y, z: 2.2 - center.z }, projOpts);
      const s3 = projectPoint({ x: 1 - center.x, y: -center.y, z: 2.2 - center.z }, projOpts);
      ctx.beginPath();
      ctx.moveTo(s0.sx, s0.sy);
      ctx.lineTo(s1.sx, s1.sy);
      ctx.lineTo(s2.sx, s2.sy);
      ctx.lineTo(s3.sx, s3.sy);
      ctx.closePath();
      ctx.fillStyle = "rgba(20, 24, 66, 0.24)";
      ctx.fill();
    }

    // 4 座展馆：后左、后右、前左、前右 + 空中连廊
    drawIsoPrism(ctx, { x: 0.2, y: 0, z: 0.2, dx: 1, dy: 1.4, dz: 1, center, projOpts, colors: cols, lw: 1.2 });
    drawIsoPrism(ctx, { x: 2.2, y: 0, z: 0.2, dx: 1, dy: 1.1, dz: 1, center, projOpts, colors: cols, lw: 1.2 });
    // 空中连廊
    drawIsoPrism(ctx, { x: 1.2, y: 0.8, z: 1.2, dx: 1.1, dy: 0.35, dz: 0.6, center, projOpts, colors: cols, lw: 1.1 });
    drawIsoPrism(ctx, { x: 0.2, y: 0, z: 2.2, dx: 1, dy: 1.0, dz: 1, center, projOpts, colors: cols, lw: 1.2 });

    // 右前展馆：在 offAxis 模式下底面私自偏转 +16°
    if (mode === "offAxis") {
      const rot = 16 * (Math.PI / 180);
      const ptR = (lx, ly, lz) => {
        const dx = lx - 0.5;
        const dz = lz - 0.5;
        const rx = dx * Math.cos(rot) - dz * Math.sin(rot);
        const rz = dx * Math.sin(rot) + dz * Math.cos(rot);
        return projectPoint({ x: 2.2 + 0.5 + rx - center.x, y: ly - center.y, z: 2.2 + 0.5 + rz - center.z }, projOpts);
      };
      const p010 = ptR(0, 1.2, 0), p011 = ptR(0, 1.2, 1), p111 = ptR(1, 1.2, 1), p110 = ptR(1, 1.2, 0);
      const p001 = ptR(0, 0, 1), p101 = ptR(1, 0, 1), p100 = ptR(1, 0, 0);
      for (const f of [
        { pts: [p010, p011, p111, p110], fill: cols.top },
        { pts: [p011, p001, p101, p111], fill: cols.left },
        { pts: [p111, p101, p100, p110], fill: cols.right },
      ]) {
        ctx.beginPath();
        f.pts.forEach((p, i) => (i ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy)));
        ctx.closePath();
        ctx.fillStyle = f.fill;
        ctx.fill();
        ctx.strokeStyle = "#070C14";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    } else {
      drawIsoPrism(ctx, { x: 2.2, y: 0, z: 2.2, dx: 1, dy: 1.2, dz: 1, center, projOpts, colors: cols, lw: 1.2 });
    }

    ctx.restore();
  }

  function renderAll() {
    for (const c of canvases) {
      const opt = QUIZ_OPTIONS.find((o) => o.id === c.dataset.quizCanvas);
      if (opt) renderOption(c, opt.mode);
    }
  }

  for (const card of cards) {
    card.addEventListener("click", () => {
      const id = card.dataset.quizChoice;
      const opt = QUIZ_OPTIONS.find((o) => o.id === id);
      if (!opt) return;

      for (const c of cards) {
        const cid = c.dataset.quizChoice;
        c.setAttribute("aria-pressed", String(cid === id));
        c.dataset.result = cid === id ? (opt.correct ? "correct" : "wrong") : "";
      }

      if (feedback) {
        feedback.hidden = false;
        feedback.dataset.result = opt.correct ? "correct" : "wrong";
        feedback.innerHTML = `<strong>${opt.correct ? `答对了！${opt.label}是唯一严格合规的等距方案` : `${opt.label}差了一处关键规则`}</strong><p>${opt.reason}</p>`;
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      for (const c of cards) {
        c.setAttribute("aria-pressed", "false");
        c.dataset.result = "";
      }
      if (feedback) feedback.hidden = true;
    });
  }

  window.addEventListener("resize", renderAll);
  renderAll();
}

// ============================================================
// 08 节：原海报灯箱（复用 #poster 的 src，零重复内联，支持拖动与 Esc）
// ============================================================
function initLightbox() {
  const btn = document.getElementById("poster-btn");
  const modal = document.getElementById("poster-modal");
  const stage = document.getElementById("lightbox-stage");
  const img = document.getElementById("lightbox-img");
  const poster = document.getElementById("poster");
  const zoomBtn = document.getElementById("lightbox-zoom");
  const closeBtn = document.getElementById("lightbox-close");
  if (!btn || !modal || !stage || !img || !poster) return;

  let zoomed = false;
  let tx = 0;
  let ty = 0;
  let panning = false;
  let px0 = 0;
  let py0 = 0;

  function applyTransform() {
    stage.dataset.zoomed = String(zoomed);
    img.style.transform = zoomed ? `translate(${tx}px, ${ty}px) scale(2)` : "none";
    if (zoomBtn) zoomBtn.textContent = zoomed ? "还原整张" : "放大细节";
  }

  function open() {
    if (!img.getAttribute("src")) img.src = poster.src;
    zoomed = false;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    closeBtn?.focus();
  }

  function close() {
    modal.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    btn.focus();
  }

  btn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  zoomBtn?.addEventListener("click", () => {
    zoomed = !zoomed;
    if (!zoomed) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) close();
  });

  img.addEventListener("pointerdown", (e) => {
    if (!zoomed) return;
    panning = true;
    px0 = e.clientX - tx;
    py0 = e.clientY - ty;
    try {
      img.setPointerCapture(e.pointerId);
    } catch {}
  });
  img.addEventListener("pointermove", (e) => {
    if (!panning) return;
    tx = Math.max(-420, Math.min(420, e.clientX - px0));
    ty = Math.max(-540, Math.min(540, e.clientY - py0));
    applyTransform();
  });
  const endPan = () => {
    panning = false;
  };
  img.addEventListener("pointerup", endPan);
  img.addEventListener("pointercancel", endPan);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
}

export function initLabs() {
  initLab01();
  initLab02();
  initLab03();
  initLab04();
  initLab05();
  initLab06();
  initLab07();
  initLightbox();
}

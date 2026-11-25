import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";
import {
  drawMacroTile,
  drawSubCell,
  getEffectiveTile,
  renderTapestry,
  analyzePattern,
} from "./model.js";

function fitCanvas(canvas, maxDpr = 2) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) return null;
  const dpr = pixelRatio(rect.width <= 460 ? Math.min(maxDpr, 1.5) : maxDpr);
  const pw = Math.round(rect.width * dpr);
  const ph = Math.round(rect.height * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  return { w: rect.width, h: rect.height, sx: pw / rect.width, sy: ph / rect.height };
}

// =========================================================================
// 01 · 缝隙消失，大图形才会浮出（砖缝拆合推杆 + 三套母题切换）
// =========================================================================
function initSection01() {
  const canvas = document.getElementById("sec01-canvas");
  const slider = document.getElementById("sec01-gap");
  const gapOut = document.getElementById("sec01-gap-val");
  const noteEl = document.getElementById("sec01-note");
  const motifBtns = [...document.querySelectorAll("[data-s01-motif]")];
  if (!canvas || !slider) return;

  const ctx = canvas.getContext("2d");
  const MOTIFS = {
    star: {
      label: "四角星芒",
      rule: "p1",
      cells: [
        { kind: "arc", rot: 2 },
        { kind: "arc", rot: 3 },
        { kind: "arc", rot: 1 },
        { kind: "arc", rot: 0 },
      ],
      closedText: "砖缝归零（0 px）：四块方砖的外角彼此相触，单砖里原本根本不存在的「深绿四角星芒」瞬间从十字交界处浮现出来。",
      openText: "砖缝拉开（{gap} px）：每块独立母砖里只有一个孤零零的米白圆，画布上看不到任何星芒——大图形藏在砖与砖的接缝里。",
    },
    arch: {
      label: "扇贝连拱",
      rule: "p1",
      cells: [
        { kind: "arc", rot: 0 },
        { kind: "square", rot: 0 },
        { kind: "arc", rot: 3 },
        { kind: "circle", rot: 0 },
      ],
      closedText: "砖缝归零（0 px）：108 号原海报上半区的经典排法——下一行左上弧与上一行左下弧无缝拼成连绵的米白半圆拱，右侧金方与金圆交替压阵。",
      openText: "砖缝拉开（{gap} px）：每块 2×2 母砖原形毕露，上下半弧在横缝处断成两截，连拱韵律消失。",
    },
    wave: {
      label: "特鲁谢波流",
      rule: "cm",
      cells: [
        { kind: "arc", rot: 0 },
        { kind: "empty", rot: 0 },
        { kind: "arc", rot: 3 },
        { kind: "circle", rot: 0 },
      ],
      closedText: "砖缝归零（0 px）：奇数行错开半砖并镜像，弧口在横缝处首尾相接，顺着纵向织出 S 形波浪带与悬浮金点。",
      openText: "砖缝拉开（{gap} px）：S 形波流在每一行边界被硬生生切开，视线停留在单个砖块内打转。",
    },
  };

  let curMotif = "star";
  let gap = Number(slider.value);
  let dirty = true;

  function updateReadout() {
    if (gapOut) gapOut.textContent = `${gap} px`;
    const m = MOTIFS[curMotif];
    if (noteEl) {
      noteEl.textContent = gap <= 2 ? m.closedText : m.openText.replace("{gap}", String(gap));
    }
    motifBtns.forEach((b) => {
      const on = b.dataset.s01Motif === curMotif;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    dirty = true;
    runner.draw();
  }

  slider.addEventListener("input", () => {
    gap = Number(slider.value);
    updateReadout();
  });

  motifBtns.forEach((b) => {
    b.addEventListener("click", () => {
      curMotif = b.dataset.s01Motif;
      updateReadout();
    });
  });

  const runner = loop(canvas, () => {
    if (!dirty) return;
    const dim = fitCanvas(canvas);
    if (!dim) return;
    dirty = false;
    const { w, h, sx, sy } = dim;
    ctx.save();
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    ctx.fillStyle = PALETTE.emeraldDeep;
    ctx.fillRect(0, 0, w, h);

    const m = MOTIFS[curMotif];
    const cols = 4;
    const rows = 3;
    const pad = 20;
    const tileSize = Math.min(
      (w - pad * 2 - gap * (cols - 1)) / cols,
      (h - pad * 2 - gap * (rows - 1)) / rows
    );
    const totalW = tileSize * cols + gap * (cols - 1);
    const totalH = tileSize * rows + gap * (rows - 1);
    const ox = (w - totalW) / 2;
    const oy = (h - totalH) / 2;

    for (let r = 0; r < rows; r++) {
      const shift = m.rule === "cm" && r % 2 === 1 ? (tileSize + gap) * 0.5 : 0;
      for (let c = -1; c <= cols; c++) {
        const tx = ox + c * (tileSize + gap) + shift;
        const ty = oy + r * (tileSize + gap);
        if (tx + tileSize < ox - 1 || tx > ox + totalW + 1) continue;
        ctx.save();
        ctx.beginPath();
        ctx.rect(ox - 2, oy - 2, totalW + 4, totalH + 4);
        ctx.clip();
        const wrapC = ((c % cols) + cols) % cols;
        const eff = getEffectiveTile(m.cells, m.rule, r, wrapC);
        drawMacroTile(ctx, eff, tx, ty, tileSize, {
          bg: PALETTE.emerald,
          grout: gap <= 2 ? 0.015 : 0.035,
        });
        if (gap > 2) {
          ctx.strokeStyle = "rgba(243, 187, 45, 0.55)";
          ctx.lineWidth = 1;
          ctx.strokeRect(tx + 0.5, ty + 0.5, tileSize - 1, tileSize - 1);
        }
        ctx.restore();
      }
    }

    // 标出左上第一块母砖的虚线金框
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(ox + 1, oy + 1, tileSize - 2, tileSize - 2);
    ctx.setLineDash([]);
    ctx.restore();
  });

  new ResizeObserver(() => { dirty = true; runner.draw(); }).observe(canvas);
  updateReadout();
}

// =========================================================================
// 02 · 平移之外，对称才是乘数（四张对称法则点选卡 + 对称轴透视开关）
// =========================================================================
function initSection02() {
  const canvas = document.getElementById("sec02-canvas");
  const cards = [...document.querySelectorAll("[data-s02-rule]")];
  const axesBtn = document.getElementById("sec02-axes-toggle");
  const gridBtn = document.getElementById("sec02-grid-toggle");
  const readout = document.getElementById("sec02-readout");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // 同一块不对称母砖，只换对称规则，看它如何变出四种截然不同的织锦
  const SHARED_TILE = [
    { kind: "arc", rot: 0 },
    { kind: "square", rot: 0 },
    { kind: "empty", rot: 0 },
    { kind: "circle", rot: 0 },
  ];

  const INFO = {
    p1: {
      code: "p1 · 纯平移",
      offset: 0,
      text: "只做水平与垂直平移：结构最直白，但每行每列之间的直角网格缝一目了然，大面积铺开时容易露出呆板的「网格沟槽」。",
    },
    cm: {
      code: "cm · 半砖错行滑移",
      offset: 0.5,
      text: "奇数行水平错开半砖并左右镜像：垂直缝隙被错位打散，硬邦邦的方块阵立刻化为斜向流动的纺织纹，是壁纸与印花布最常用的隐藏接缝法。",
    },
    pmm: {
      code: "pmm · 四向镜像",
      offset: 0,
      text: "横竖两条镜像轴交替反射：同一枚孤零零的左上角弧线，在四角相撞后合出完整圆形与对称菱框，视觉秩序瞬间倍增。",
    },
    p4: {
      code: "p4 · 四重旋转",
      offset: 0,
      text: "每 2×2 四块砖绕中心依次顺转 90°：不靠镜像而是靠旋转编织动势，单砖里的金圆与弧线围绕旋转中心形成风车回环。",
    },
  };

  let curRule = "pmm";
  let showAxes = true;
  let showGrid = true;
  let dirty = true;

  function sync() {
    cards.forEach((c) => {
      const on = c.dataset.s02Rule === curRule;
      c.classList.toggle("is-on", on);
      c.setAttribute("aria-pressed", String(on));
    });
    if (axesBtn) {
      axesBtn.classList.toggle("is-on", showAxes);
      axesBtn.setAttribute("aria-pressed", String(showAxes));
      axesBtn.textContent = showAxes ? "对称轴透视：开" : "对称轴透视：关";
    }
    if (gridBtn) {
      gridBtn.classList.toggle("is-on", showGrid);
      gridBtn.setAttribute("aria-pressed", String(showGrid));
      gridBtn.textContent = showGrid ? "砖缝网格：显" : "砖缝网格：隐";
    }
    if (readout) {
      readout.innerHTML = `<strong>${INFO[curRule].code}</strong> — ${INFO[curRule].text}`;
    }
    dirty = true;
    runner.draw();
  }

  cards.forEach((c) => {
    c.addEventListener("click", () => {
      curRule = c.dataset.s02Rule;
      sync();
    });
  });

  axesBtn?.addEventListener("click", () => { showAxes = !showAxes; sync(); });
  gridBtn?.addEventListener("click", () => { showGrid = !showGrid; sync(); });

  const runner = loop(canvas, () => {
    if (!dirty) return;
    const dim = fitCanvas(canvas);
    if (!dim) return;
    dirty = false;
    const { w, h, sx, sy } = dim;
    ctx.save();
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    ctx.fillStyle = PALETTE.emeraldDeep;
    ctx.fillRect(0, 0, w, h);

    const cols = 6;
    const rows = 4;
    const tileSize = Math.min(w / cols, h / rows);
    const ox = (w - tileSize * cols) / 2;
    const oy = (h - tileSize * rows) / 2;
    const off = INFO[curRule].offset;

    ctx.beginPath();
    ctx.rect(ox, oy, tileSize * cols, tileSize * rows);
    ctx.clip();

    for (let r = 0; r < rows; r++) {
      const shift = r % 2 === 1 ? off * tileSize : 0;
      for (let c = -1; c <= cols; c++) {
        const tx = ox + c * tileSize + shift;
        const ty = oy + r * tileSize;
        const eff = getEffectiveTile(SHARED_TILE, curRule, r, ((c % cols) + cols) % cols);
        drawMacroTile(ctx, eff, tx, ty, tileSize, { bg: PALETTE.emerald, grout: 0.03 });
        if (showGrid) {
          ctx.strokeStyle = "rgba(245, 233, 209, 0.25)";
          ctx.lineWidth = 1;
          ctx.strokeRect(tx + 0.5, ty + 0.5, tileSize - 1, tileSize - 1);
        }
      }
    }

    // 绘制真实对称几何标记
    if (showAxes) {
      ctx.save();
      if (curRule === "p1") {
        // 平移矢量箭头
        ctx.strokeStyle = PALETTE.goldBright;
        ctx.fillStyle = PALETTE.goldBright;
        ctx.lineWidth = 2;
        const x0 = ox + tileSize * 0.5;
        const y0 = oy + tileSize * 0.5;
        for (const [dx, dy] of [[tileSize, 0], [0, tileSize]]) {
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x0 + dx, y0 + dy);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x0 + dx, y0 + dy, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (curRule === "cm") {
        // 滑移反射虚线横轴
        ctx.strokeStyle = PALETTE.goldBright;
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 5]);
        for (let r = 1; r < rows; r++) {
          const y = oy + r * tileSize;
          ctx.beginPath();
          ctx.moveTo(ox, y);
          ctx.lineTo(ox + tileSize * cols, y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      } else if (curRule === "pmm") {
        // 四向实线镜像轴
        ctx.strokeStyle = PALETTE.goldBright;
        ctx.lineWidth = 1.8;
        for (let c = 1; c < cols; c++) {
          const x = ox + c * tileSize;
          ctx.beginPath();
          ctx.moveTo(x, oy);
          ctx.lineTo(x, oy + tileSize * rows);
          ctx.stroke();
        }
        for (let r = 1; r < rows; r++) {
          const y = oy + r * tileSize;
          ctx.beginPath();
          ctx.moveTo(ox, y);
          ctx.lineTo(ox + tileSize * cols, y);
          ctx.stroke();
        }
      } else if (curRule === "p4") {
        // 4 重旋转中心菱形标记
        ctx.fillStyle = PALETTE.goldBright;
        ctx.strokeStyle = PALETTE.emeraldDeep;
        ctx.lineWidth = 1.5;
        for (let r = 1; r < rows; r += 2) {
          for (let c = 1; c < cols; c += 2) {
            const cx = ox + c * tileSize;
            const cy = oy + r * tileSize;
            const d = 8;
            ctx.beginPath();
            ctx.moveTo(cx, cy - d);
            ctx.lineTo(cx + d, cy);
            ctx.lineTo(cx, cy + d);
            ctx.lineTo(cx - d, cy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }
    ctx.restore();
  });

  new ResizeObserver(() => { dirty = true; runner.draw(); }).observe(canvas);
  sync();
}

// =========================================================================
// 03 · 用局部密分打破死板壁纸（直点四叉树密分 / 合并 / 休止空砖画板）
// =========================================================================
function initSection03() {
  const canvas = document.getElementById("sec03-canvas");
  const brushBtns = [...document.querySelectorAll("[data-s03-brush]")];
  const presetBtns = [...document.querySelectorAll("[data-s03-preset]")];
  const statsEl = document.getElementById("sec03-stats");
  const verdictEl = document.getElementById("sec03-verdict");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const COLS = 6;
  const ROWS = 4;
  // 状态值：0=1×标准砖，1=2×密分，2=4×微砖，-1=休止留气空砖
  const makeGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  let grid = makeGrid();
  let brush = "split"; // split | merge | rest
  let dirty = true;
  let lastGeo = null;

  const BASE_TILE = [
    { kind: "arc", rot: 0 },
    { kind: "arc", rot: 1 },
    { kind: "arc", rot: 3 },
    { kind: "circle", rot: 0 },
  ];

  function applyPreset(name) {
    grid = makeGrid();
    if (name === "poster") {
      // 复刻 108 原海报右下密分
      for (const [r, c] of [[2, 4], [2, 5], [3, 3], [3, 4], [3, 5]]) grid[r][c] = 1;
      grid[3][5] = 2;
    } else if (name === "diagonal") {
      for (const [r, c] of [[0, 0], [1, 1], [1, 2], [2, 2], [2, 3], [3, 4]]) grid[r][c] = 1;
      grid[0][5] = -1;
      grid[3][0] = -1;
    } else if (name === "flat") {
      // 全等墙纸
    }
    updateStats();
  }

  function updateStats() {
    let std = 0, d2 = 0, d4 = 0, rest = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = grid[r][c];
        if (v === 0) std++;
        else if (v === 1) d2++;
        else if (v === 2) d4++;
        else rest++;
      }
    }
    const densePct = Math.round(((d2 + d4) / (ROWS * COLS)) * 100);
    if (statsEl) {
      statsEl.textContent = `标准 1×：${std} 块 · 密分 2×：${d2} 块 · 微砖 4×：${d4} 块 · 休止空砖：${rest} 块`;
    }
    if (verdictEl) {
      if (d2 + d4 === 0 && rest === 0) {
        verdictEl.textContent = "全等墙纸：24 块砖同尺度平铺，没有呼吸停顿，视线找不到主角落点。";
        verdictEl.dataset.state = "fault";
      } else if (densePct > 50 || d4 >= 6) {
        verdictEl.textContent = `高频过密（密分占 ${densePct}%）：碎砖面积压倒标准砖，细密高频纹理铺满画面，容易视觉发花。`;
        verdictEl.dataset.state = "fault";
      } else {
        verdictEl.textContent = `层级成立（密分占 ${densePct}%）：标准大砖稳住秩序底盘，局部 2×/4× 密分与休止空砖拉出清晰视觉重心。`;
        verdictEl.dataset.state = "ok";
      }
    }
    brushBtns.forEach((b) => {
      const on = b.dataset.s03Brush === brush;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    dirty = true;
    runner.draw();
  }

  brushBtns.forEach((b) => {
    b.addEventListener("click", () => {
      brush = b.dataset.s03Brush;
      updateStats();
    });
  });

  presetBtns.forEach((b) => {
    b.addEventListener("click", () => applyPreset(b.dataset.s03Preset));
  });

  canvas.addEventListener("click", (e) => {
    if (!lastGeo) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const c = Math.floor((x - lastGeo.ox) / lastGeo.ts);
    const r = Math.floor((y - lastGeo.oy) / lastGeo.ts);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (brush === "split") {
      grid[r][c] = grid[r][c] < 0 ? 0 : Math.min(2, grid[r][c] + 1);
    } else if (brush === "merge") {
      grid[r][c] = grid[r][c] < 0 ? 0 : Math.max(0, grid[r][c] - 1);
    } else {
      grid[r][c] = grid[r][c] === -1 ? 0 : -1;
    }
    updateStats();
  });

  function drawRecursiveTile(depth, r, c, x, y, size) {
    if (depth <= 0) {
      const eff = getEffectiveTile(BASE_TILE, "pmm", r, c);
      drawMacroTile(ctx, eff, x, y, size, { bg: PALETTE.emerald, grout: 0.03 });
      return;
    }
    const half = size / 2;
    for (let dr = 0; dr < 2; dr++) {
      for (let dc = 0; dc < 2; dc++) {
        drawRecursiveTile(depth - 1, r * 2 + dr, c * 2 + dc, x + dc * half, y + dr * half, half);
      }
    }
  }

  const runner = loop(canvas, () => {
    if (!dirty) return;
    const dim = fitCanvas(canvas);
    if (!dim) return;
    dirty = false;
    const { w, h, sx, sy } = dim;
    ctx.save();
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    ctx.fillStyle = PALETTE.emeraldDeep;
    ctx.fillRect(0, 0, w, h);

    const ts = Math.min((w - 16) / COLS, (h - 16) / ROWS);
    const ox = (w - ts * COLS) / 2;
    const oy = (h - ts * ROWS) / 2;
    lastGeo = { ox, oy, ts };

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tx = ox + c * ts;
        const ty = oy + r * ts;
        const v = grid[r][c];
        if (v === -1) {
          ctx.fillStyle = PALETTE.emeraldDeep;
          ctx.fillRect(tx, ty, ts, ts);
          ctx.strokeStyle = "rgba(245, 233, 209, 0.22)";
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(tx + 3, ty + 3, ts - 6, ts - 6);
          ctx.setLineDash([]);
        } else {
          drawRecursiveTile(v, r, c, tx, ty, ts);
          if (v > 0) {
            ctx.strokeStyle = "rgba(243, 187, 45, 0.55)";
            ctx.lineWidth = 1.2;
            ctx.strokeRect(tx + 0.6, ty + 0.6, ts - 1.2, ts - 1.2);
          }
        }
      }
    }
    ctx.restore();
  });

  new ResizeObserver(() => { dirty = true; runner.draw(); }).observe(canvas);
  applyPreset("poster");
}

// =========================================================================
// 04 · 图案组织从哪来（四节点史料图谱 + 可交互特鲁谢/几何/壁纸群/编织草案）
// =========================================================================
function initSection04() {
  const canvas = document.getElementById("sec04-canvas");
  const tabs = [...document.querySelectorAll("[data-s04-era]")];
  const captionEl = document.getElementById("sec04-caption");
  const actionBtn = document.getElementById("sec04-action");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let era = "truchet";
  let truchetArcMode = true; // true=1987 Smith 弧线, false=1704 Truchet 对角三角
  let jonesSkeleton = true;
  let polyaIdx = 0;
  const POLYA_MODES = ["p1", "cm", "pmm", "p4"];

  // 4×4 特鲁谢旋转表
  const truchetRot = [
    [0, 1, 2, 3],
    [3, 2, 1, 0],
    [1, 0, 3, 2],
    [2, 3, 0, 1],
  ];

  // 1965 Anni Albers 6×6 经纬二元编织格（斜纹组织初态，可点击翻转经/纬浮长）
  const weave = Array.from({ length: 6 }, (_, r) =>
    Array.from({ length: 6 }, (_, c) => ((r + c) % 3 === 0 ? 1 : 0))
  );

  let dirty = true;
  let lastBox = null;

  const CAPTIONS = {
    truchet: () =>
      truchetArcMode
        ? "1987 Cyril Stanley Smith 弧线变体（点画布任意方砖旋转 90°）：把 1704 年特鲁谢的对角砖换成两条四分之一圆弧，旋转方向不同立刻编出连绵不绝的曲线网。"
        : "1704 Sébastien Truchet 对角方砖（点画布任意方砖旋转 90°）：同一块黑白斜切砖按四个朝向排列，竟能组合出锯齿、菱格与阶梯等繁复秩序。",
    jones: () =>
      jonesSkeleton
        ? "1856 欧文·琼斯《装饰语法》命题 8：一切装饰皆立于几何构造之上。叠加底层菱形与正方形网格，可见所有繁复花纹都严格锁死在几何交点里。"
        : "隐去几何底格后，曲线花瓣显得自由灵动，但每个转折点其实仍受控于隐形几何骨架。",
    polya: () =>
      `1891 Fedorov / 1924 Pólya 17 种平面壁纸群示例（当前：${POLYA_MODES[polyaIdx]}）：平面周期图案无论纹样如何变化，背后的对称操作严格穷尽于 17 种晶体群。`,
    albers: () =>
      "1965 安妮·阿尔伯斯《论织造》经纬草案（点任意格切换经线/纬线浮沉）：织布机上的每一格只有 0 与 1 两种起伏，周期重复 6×6 单元即可织出斜纹、人字纹与几何布面。",
  };

  const ACTION_LABELS = {
    truchet: () => (truchetArcMode ? "切回 1704 对角砖" : "切到 1987 弧线砖"),
    jones: () => (jonesSkeleton ? "隐藏几何构造线" : "显示几何构造线"),
    polya: () => `切换下一个壁纸群（当前 ${POLYA_MODES[polyaIdx]}）`,
    albers: () => "切为经典 2/2 人字斜纹",
  };

  function sync() {
    tabs.forEach((t) => {
      const on = t.dataset.s04Era === era;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-selected", String(on));
    });
    if (captionEl) captionEl.textContent = CAPTIONS[era]();
    if (actionBtn) actionBtn.textContent = ACTION_LABELS[era]();
    dirty = true;
    runner.draw();
  }

  tabs.forEach((t) => t.addEventListener("click", () => { era = t.dataset.s04Era; sync(); }));

  actionBtn?.addEventListener("click", () => {
    if (era === "truchet") truchetArcMode = !truchetArcMode;
    else if (era === "jones") jonesSkeleton = !jonesSkeleton;
    else if (era === "polya") polyaIdx = (polyaIdx + 1) % POLYA_MODES.length;
    else if (era === "albers") {
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          const v = c < 3 ? (r + c) % 4 < 2 : (r - c + 8) % 4 < 2;
          weave[r][c] = v ? 1 : 0;
        }
      }
    }
    sync();
  });

  canvas.addEventListener("click", (e) => {
    if (!lastBox) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (era === "truchet") {
      const c = Math.floor((x - lastBox.ox) / lastBox.cell);
      const r = Math.floor((y - lastBox.oy) / lastBox.cell);
      if (r >= 0 && r < 4 && c >= 0 && c < 4) {
        truchetRot[r][c] = (truchetRot[r][c] + 1) % 4;
        dirty = true;
        runner.draw();
      }
    } else if (era === "albers") {
      const c = Math.floor((x - lastBox.ox) / lastBox.cell);
      const r = Math.floor((y - lastBox.oy) / lastBox.cell);
      if (r >= 0 && r < 6 && c >= 0 && c < 6) {
        weave[r][c] = weave[r][c] ? 0 : 1;
        dirty = true;
        runner.draw();
      }
    }
  });

  const runner = loop(canvas, () => {
    if (!dirty) return;
    const dim = fitCanvas(canvas);
    if (!dim) return;
    dirty = false;
    const { w, h, sx, sy } = dim;
    ctx.save();
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    ctx.fillStyle = PALETTE.emeraldDeep;
    ctx.fillRect(0, 0, w, h);

    const pad = 18;
    const side = Math.min(w - pad * 2, h - pad * 2);
    const ox = (w - side) / 2;
    const oy = (h - side) / 2;

    if (era === "truchet") {
      const cell = side / 4;
      lastBox = { ox, oy, cell };
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const x = ox + c * cell;
          const y = oy + r * cell;
          const rot = truchetRot[r][c];
          ctx.fillStyle = PALETTE.emerald;
          ctx.fillRect(x, y, cell, cell);
          if (!truchetArcMode) {
            // 1704 对角三角砖
            ctx.fillStyle = PALETTE.cream;
            ctx.beginPath();
            const pts = [
              [[0, 0], [1, 0], [0, 1]],
              [[0, 0], [1, 0], [1, 1]],
              [[1, 0], [1, 1], [0, 1]],
              [[0, 0], [1, 1], [0, 1]],
            ][rot];
            ctx.moveTo(x + pts[0][0] * cell, y + pts[0][1] * cell);
            ctx.lineTo(x + pts[1][0] * cell, y + pts[1][1] * cell);
            ctx.lineTo(x + pts[2][0] * cell, y + pts[2][1] * cell);
            ctx.closePath();
            ctx.fill();
          } else {
            // 1987 Smith 双四分之一圆弧砖
            ctx.strokeStyle = PALETTE.cream;
            ctx.lineWidth = Math.max(4, cell * 0.16);
            const r2 = cell * 0.5;
            const pair = rot % 2 === 0;
            ctx.beginPath();
            if (pair) {
              ctx.arc(x, y, r2, 0, Math.PI * 0.5);
              ctx.stroke();
              ctx.beginPath();
              ctx.arc(x + cell, y + cell, r2, Math.PI, Math.PI * 1.5);
              ctx.stroke();
            } else {
              ctx.arc(x + cell, y, r2, Math.PI * 0.5, Math.PI);
              ctx.stroke();
              ctx.beginPath();
              ctx.arc(x, y + cell, r2, Math.PI * 1.5, Math.PI * 2);
              ctx.stroke();
            }
          }
          ctx.strokeStyle = "rgba(243, 187, 45, 0.25)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
        }
      }
    } else if (era === "jones") {
      lastBox = null;
      const n = 4;
      const cell = side / n;
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const cx = ox + (c + 0.5) * cell;
          const cy = oy + (r + 0.5) * cell;
          ctx.fillStyle = PALETTE.emerald;
          ctx.fillRect(ox + c * cell, oy + r * cell, cell, cell);
          // 四瓣几何花卉（严格建在圆弧与正方格之上）
          ctx.fillStyle = PALETTE.cream;
          const rad = cell * 0.42;
          for (let k = 0; k < 4; k++) {
            const a = (k * Math.PI) / 2;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(a) * rad * 0.48, cy + Math.sin(a) * rad * 0.48, rad * 0.36, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = PALETTE.gold;
          ctx.beginPath();
          ctx.arc(cx, cy, cell * 0.14, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (jonesSkeleton) {
        ctx.strokeStyle = PALETTE.goldBright;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]);
        for (let i = 0; i <= n; i++) {
          ctx.beginPath();
          ctx.moveTo(ox + i * cell, oy);
          ctx.lineTo(ox + i * cell, oy + side);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ox, oy + i * cell);
          ctx.lineTo(ox + side, oy + i * cell);
          ctx.stroke();
        }
        // 菱形对角构造线
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            const x = ox + c * cell;
            const y = oy + r * cell;
            ctx.beginPath();
            ctx.moveTo(x + cell / 2, y);
            ctx.lineTo(x + cell, y + cell / 2);
            ctx.lineTo(x + cell / 2, y + cell);
            ctx.lineTo(x, y + cell / 2);
            ctx.closePath();
            ctx.stroke();
          }
        }
        ctx.setLineDash([]);
      }
    } else if (era === "polya") {
      lastBox = null;
      const mode = POLYA_MODES[polyaIdx];
      const base = [
        { kind: "arc", rot: 0 },
        { kind: "circle", rot: 0 },
        { kind: "empty", rot: 0 },
        { kind: "square", rot: 0 },
      ];
      const ts = side / 4;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const eff = getEffectiveTile(base, mode, r, c);
          drawMacroTile(ctx, eff, ox + c * ts, oy + r * ts, ts, { bg: PALETTE.emerald, grout: 0.03 });
        }
      }
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 2;
      ctx.strokeRect(ox, oy, ts, ts);
    } else if (era === "albers") {
      const cell = side / 6;
      lastBox = { ox, oy, cell };
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          const x = ox + c * cell;
          const y = oy + r * cell;
          const up = weave[r][c] === 1;
          ctx.fillStyle = PALETTE.emerald;
          ctx.fillRect(x, y, cell, cell);
          if (up) {
            // 经线在上（竖向琥珀金带）
            ctx.fillStyle = PALETTE.gold;
            ctx.fillRect(x + cell * 0.18, y + 1, cell * 0.64, cell - 2);
            ctx.fillStyle = "rgba(1,47,33,0.22)";
            ctx.fillRect(x + cell * 0.18, y + 1, cell * 0.12, cell - 2);
          } else {
            // 纬线在上（横向米白织带）
            ctx.fillStyle = PALETTE.cream;
            ctx.fillRect(x + 1, y + cell * 0.18, cell - 2, cell * 0.64);
            ctx.fillStyle = "rgba(1,47,33,0.18)";
            ctx.fillRect(x + 1, y + cell * 0.7, cell - 2, cell * 0.12);
          }
          ctx.strokeStyle = "rgba(1, 36, 25, 0.7)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
        }
      }
    }
    ctx.restore();
  });

  new ResizeObserver(() => { dirty = true; runner.draw(); }).observe(canvas);
  sync();
}

// =========================================================================
// 05 · 什么时候用：三个真实落点（礼盒包装 / 展墙导视 / 书刊扉页 + 反差对照）
// =========================================================================
function initSection05() {
  const sceneBtns = [...document.querySelectorAll("[data-s05-scene]")];
  const modeBtn = document.getElementById("sec05-contrast-toggle");
  const stage = document.getElementById("sec05-mockup");
  const noteEl = document.getElementById("sec05-note");
  if (!stage) return;

  let curScene = "packaging";
  let lowContrast = true; // true=正确退后托字, false=反面高反差抢字

  const SCENES = {
    packaging: {
      ok: "礼盒折面用四向镜像图案连续包过棱角，中间嵌一块纯深绿标签岛承接品名——图案负责远处认品牌，纯色窗负责近处读文字。",
      bad: "去掉纯色标签窗且图案满反差硬压文字后，礼盒远看热闹，近看品名与琥珀金圆块互相打架，信息淹没。",
    },
    wayfinding: {
      ok: "展墙将模块放大到建筑尺度并压低明度差，形成可识别的空间皮肤，导视箭头与展厅编号仍能 1 秒扫清。",
      bad: "展墙直接照搬高饱和亮色小砖满铺，导视字牌像掉进迷宫，观众还没看清方向先眼花。",
    },
    editorial: {
      ok: "书刊扉页让图案织锦稳占一侧构建视觉情绪，留出干净宣纸留白区排书名与目录，图与字各管一摊。",
      bad: "把满反差图案直接通铺到正文和书名背后，字画频率重叠，整页丧失阅读入口。",
    },
  };

  function sync() {
    sceneBtns.forEach((b) => {
      const on = b.dataset.s05Scene === curScene;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    stage.dataset.scene = curScene;
    stage.dataset.contrast = lowContrast ? "calm" : "clash";
    if (modeBtn) {
      modeBtn.classList.toggle("is-on", !lowContrast);
      modeBtn.setAttribute("aria-pressed", String(!lowContrast));
      modeBtn.textContent = lowContrast ? "看反面：高反差抢字" : "切回：低反差托字";
    }
    if (noteEl) {
      noteEl.textContent = lowContrast ? SCENES[curScene].ok : SCENES[curScene].bad;
      noteEl.dataset.state = lowContrast ? "ok" : "fault";
    }
  }

  sceneBtns.forEach((b) => b.addEventListener("click", () => { curScene = b.dataset.s05Scene; sync(); }));
  modeBtn?.addEventListener("click", () => { lowContrast = !lowContrast; sync(); });
  sync();
}

// =========================================================================
// 06 · 什么时候别用：小心图案眩光（真中文段落叠纹可读性 + 实时 WCAG 核算）
// =========================================================================
function initSection06() {
  const canvas = document.getElementById("sec06-canvas");
  const modeBtns = [...document.querySelectorAll("[data-s06-mode]")];
  const scaleBtns = [...document.querySelectorAll("[data-s06-scale]")];
  const card = document.getElementById("sec06-text-card");
  const ratioEl = document.getElementById("sec06-ratio");
  const verdictEl = document.getElementById("sec06-verdict");
  if (!canvas || !card) return;
  const ctx = canvas.getContext("2d");

  let mode = "glare"; // glare | muted | island
  let density = "dense"; // dense | calm
  let dirty = true;

  function relLum(hex) {
    const n = parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }

  function contrastRatio(hexA, hexB) {
    const l1 = relLum(hexA);
    const l2 = relLum(hexB);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  function sync() {
    modeBtns.forEach((b) => {
      const on = b.dataset.s06Mode === mode;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    scaleBtns.forEach((b) => {
      const on = b.dataset.s06Scale === density;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });

    card.dataset.mode = mode;

    // 核算正文颜色（#F5E9D1）压在最亮底层像素上的真实对比度
    const textHex = "#F5E9D1";
    const worstBg = mode === "glare" ? "#F5E9D1" : mode === "muted" ? "#1A4D3B" : "#012419";
    const ratio = contrastRatio(textHex, worstBg);

    if (ratioEl) {
      ratioEl.textContent = `最差像素对比度 ${ratio.toFixed(1)} : 1`;
      ratioEl.dataset.state = ratio >= 4.5 ? "ok" : "fault";
    }
    if (verdictEl) {
      if (mode === "glare") {
        verdictEl.textContent =
          density === "dense"
            ? "高危眩光：细密亮米白弧与亮金块在字底高频交错，最亮像素与浅色文字对比度跌至 1.0:1，文字笔画直接断裂，且空间频率贴近 Wilkins（1995）所述约 3 周/度视觉不适区间。"
            : "对比失守：即便把砖格放大，高反差米白弧依旧在字底把笔画切碎，正文只能靠猜着读。";
        verdictEl.dataset.state = "fault";
      } else if (mode === "muted") {
        verdictEl.textContent = `退为暗纹（${ratio.toFixed(1)}:1）：把纹样压缩成同色系低明度暗花，正文对比度过线；但若砖格过密，长时间长文阅读仍会轻微拖累眼睛。`;
        verdictEl.dataset.state = "ok";
      } else {
        verdictEl.textContent = `最稳做法（${ratio.toFixed(1)}:1）：图案只退居外框建立身份，正文稳稳落在纯深绿文字岛内，既保留系统气质又零干扰阅读。`;
        verdictEl.dataset.state = "ok";
      }
    }
    dirty = true;
    runner.draw();
  }

  modeBtns.forEach((b) => b.addEventListener("click", () => { mode = b.dataset.s06Mode; sync(); }));
  scaleBtns.forEach((b) => b.addEventListener("click", () => { density = b.dataset.s06Scale; sync(); }));

  const runner = loop(canvas, () => {
    if (!dirty) return;
    const dim = fitCanvas(canvas);
    if (!dim) return;
    dirty = false;
    const { w, h, sx, sy } = dim;
    ctx.save();
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    ctx.fillStyle = PALETTE.emeraldAlarm;
    ctx.fillRect(0, 0, w, h);

    const tile = [
      { kind: "arc", rot: 0 },
      { kind: "arc", rot: 1 },
      { kind: "arc", rot: 3 },
      { kind: "square", rot: 0 },
    ];
    const ts = density === "dense" ? 36 : 74;
    const cols = Math.ceil(w / ts) + 1;
    const rows = Math.ceil(h / ts) + 1;

    const arcColor = mode === "muted" ? "#1A4D3B" : PALETTE.cream;
    const goldColor = mode === "muted" ? "#154233" : PALETTE.gold;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const eff = getEffectiveTile(tile, "pmm", r, c);
        drawMacroTile(ctx, eff, c * ts, r * ts, ts, {
          bg: PALETTE.emeraldAlarm,
          arcColor,
          goldColor,
          grout: 0.02,
        });
      }
    }
    ctx.restore();
  });

  new ResizeObserver(() => { dirty = true; runner.draw(); }).observe(canvas);
  sync();
}

// =========================================================================
// 07 · 四选一：哪版图案最经看（单变量对照，中性标签 A/B/C/D）
// =========================================================================
function initSection07() {
  const buttons = [...document.querySelectorAll("[data-quiz-opt]")];
  const feedback = document.getElementById("quiz-feedback");
  const resetBtn = document.getElementById("quiz-reset");
  if (!buttons.length) return;

  const OPTIONS = {
    A: {
      correct: false,
      state: {
        cells: [
          { kind: "arc", rot: 2 },
          { kind: "arc", rot: 0 },
          { kind: "arc", rot: 1 },
          { kind: "circle", rot: 0 },
        ],
        rule: "p1",
        rowOffset: 0,
        subdivided: ["2,4", "2,5", "3,4", "3,5"],
        showSeams: false,
      },
      reason: "方案 A 的问题在「弧口背离砖缝」：四版用的元件完全相同（三枚弧配一枚金圆），但这版弧线朝向彼此错开，跨过砖缝无法咬合，整面图碎成一块块独立贴纸。",
    },
    B: {
      correct: false,
      state: {
        cells: [
          { kind: "arc", rot: 0 },
          { kind: "arc", rot: 1 },
          { kind: "arc", rot: 3 },
          { kind: "circle", rot: 0 },
        ],
        rule: "pmm",
        rowOffset: 0.28,
        subdivided: ["2,4", "2,5", "3,4", "3,5"],
        showSeams: false,
      },
      reason: "方案 B 的问题在「行缝歪斜漂移」：母砖本身与方案 C 完全一致，却把奇数行偏移卡在 28% 非整数位，上下行弧口在横缝处被剪断错位，整面图案斜向滑移。",
    },
    C: {
      correct: true,
      state: {
        cells: [
          { kind: "arc", rot: 0 },
          { kind: "arc", rot: 1 },
          { kind: "arc", rot: 3 },
          { kind: "circle", rot: 0 },
        ],
        rule: "pmm",
        rowOffset: 0,
        subdivided: ["2,4", "2,5", "3,4", "3,5"],
        showSeams: false,
      },
      reason: "答对了！方案 C 与其他三版使用完全相同的 3 弧 + 1 圆母砖，但同时稳住了行缝对齐、pmm 四向镜像跨缝咬合与右下角适度 2× 密分，既有连续秩序又有清晰层次。",
    },
    D: {
      correct: false,
      state: {
        cells: [
          { kind: "arc", rot: 0 },
          { kind: "arc", rot: 1 },
          { kind: "arc", rot: 3 },
          { kind: "circle", rot: 0 },
        ],
        rule: "pmm",
        rowOffset: 0,
        subdivided: Array.from({ length: 24 }, (_, i) => `${Math.floor(i / 6)},${i % 6}`),
        showSeams: false,
      },
      reason: "方案 D 的问题在「全幅过度密分」：虽然接口和方案 C 一样严丝合缝，但 24 块砖 100% 切碎成细密小格，失去大砖对照与重心节奏，远看容易发花。",
    },
  };

  function drawOptionCanvas(btn) {
    const key = btn.dataset.quizOpt;
    const c = btn.querySelector("canvas");
    if (!c) return;
    const dim = fitCanvas(c, 1.5);
    if (!dim) return;
    const ctx = c.getContext("2d");
    ctx.save();
    ctx.setTransform(dim.sx, 0, 0, dim.sy, 0, 0);
    const st = OPTIONS[key].state;
    const an = analyzePattern(st);
    renderTapestry(ctx, dim.w, dim.h, st, an, { bleed: 0.18, showSubGrid: false });
    ctx.restore();
  }

  let picked = null;

  function renderQuizUI() {
    buttons.forEach((btn) => {
      const k = btn.dataset.quizOpt;
      btn.classList.toggle("is-picked", picked === k);
      btn.classList.toggle("is-correct", picked !== null && OPTIONS[k].correct);
      btn.classList.toggle("is-wrong", picked === k && !OPTIONS[k].correct);
      btn.setAttribute("aria-pressed", String(picked === k));
    });
    if (feedback) {
      if (!picked) {
        feedback.textContent = "先观察四块织锦的跨缝连贯、行缝对齐与疏密层次，再选出最稳的一版。";
        feedback.dataset.state = "idle";
      } else {
        const opt = OPTIONS[picked];
        feedback.innerHTML = `<strong>${opt.correct ? "判断准确" : `你选了方案 ${picked}`}</strong>：${opt.reason}`;
        feedback.dataset.state = opt.correct ? "ok" : "fault";
      }
    }
    if (resetBtn) resetBtn.hidden = picked === null;
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      picked = btn.dataset.quizOpt;
      renderQuizUI();
    });
  });

  resetBtn?.addEventListener("click", () => {
    picked = null;
    renderQuizUI();
  });

  const redrawAll = () => buttons.forEach(drawOptionCanvas);
  const ro = new ResizeObserver(redrawAll);
  buttons.forEach((b) => {
    const c = b.querySelector("canvas");
    if (c) ro.observe(c);
  });
  redrawAll();
  renderQuizUI();
}

// =========================================================================
// 08 · 原海报灯箱（点击放大、滚轮缩放、拖拽平移 draggable="false"、Esc 关闭）
// =========================================================================
function initPosterLightbox() {
  const thumb = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const dialog = document.getElementById("poster-dialog");
  const zoomImg = document.getElementById("poster-zoom-img");
  const stage = document.getElementById("poster-zoom-stage");
  const btnIn = document.getElementById("poster-zoom-in");
  const btnOut = document.getElementById("poster-zoom-out");
  const btnReset = document.getElementById("poster-zoom-reset");
  const btnClose = document.getElementById("poster-zoom-close");
  const labelZoom = document.getElementById("poster-zoom-label");
  if (!thumb || !dialog || !zoomImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    zoomImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    if (labelZoom) labelZoom.textContent = `${Math.round(scale * 100)}%`;
  }

  function resetView() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  }

  function openModal() {
    // 复用页面内联的原海报 src，不二次内联图片
    if (!zoomImg.src || zoomImg.src !== thumb.src) zoomImg.src = thumb.src;
    resetView();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeModal() {
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    openBtn?.focus();
  }

  openBtn?.addEventListener("click", openModal);
  btnClose?.addEventListener("click", closeModal);
  btnReset?.addEventListener("click", resetView);
  btnIn?.addEventListener("click", () => { scale = Math.min(3.2, Number((scale + 0.35).toFixed(2))); applyTransform(); });
  btnOut?.addEventListener("click", () => {
    scale = Math.max(0.75, Number((scale - 0.35).toFixed(2)));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && (dialog.open || dialog.hasAttribute("open"))) {
      e.preventDefault();
      closeModal();
    }
  });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    scale = Math.max(0.75, Math.min(3.2, Number((scale + delta).toFixed(2))));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX - tx, y: e.clientY - ty, id: e.pointerId };
    try { stage.setPointerCapture(e.pointerId); } catch {}
    stage.classList.add("is-dragging");
  });

  stage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = e.clientX - drag.x;
    ty = e.clientY - drag.y;
    applyTransform();
  });

  const stopDrag = () => {
    drag = null;
    stage.classList.remove("is-dragging");
  };
  stage.addEventListener("pointerup", stopDrag);
  stage.addEventListener("pointercancel", stopDrag);
}

export function initSections() {
  initSection01();
  initSection02();
  initSection03();
  initSection04();
  initSection05();
  initSection06();
  initSection07();
  initPosterLightbox();
}

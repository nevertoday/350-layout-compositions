// 020 镜像构图 · 正文第 01–08 节交互实验模块（与开场共用 model.js 与 renderMirrorScene）

import {
  PALETTE,
  SEAM_RULE,
  QUIZ_RATIOS,
  buildQuizOptionModel,
} from "./model.js";
import { renderMirrorScene } from "./hero-canvas.js";
import { pixelRatio } from "../../lib/stage.js";

function sizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(120, Math.round(rect.width));
  const h = Math.max(80, Math.round(rect.height));
  const dpr = pixelRatio(2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/* =========================================================
   01 实验：双板近轴破缺盲找小测（Bruce & Morgan 1975 原理验证）
   ========================================================= */
export function initSpotLab() {
  const gridMirror = document.getElementById("grid-mirror");
  const gridRepeat = document.getElementById("grid-repeat");
  const timeMirrorEl = document.getElementById("spot-time-mirror");
  const timeRepeatEl = document.getElementById("spot-time-repeat");
  const readoutEl = document.getElementById("spot-readout");
  const zoneBtns = [...document.querySelectorAll("[data-spot-zone]")];
  const newBtn = document.getElementById("spot-new");
  if (!gridMirror || !gridRepeat) return;

  let zone = "near"; // "near" (紧邻中轴第4列) | "far" (远缘第6列)
  let seed = 1;
  let state = null;
  let labVisibleStarted = false;

  // 确定性伪随机生成，保证每次点阵饱满清晰且仅 1 处破缺
  const rng = (s) => {
    let x = Math.sin(s * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };

  function resetUnfoundTimers() {
    if (!state) return;
    const now = performance.now();
    if (state.mirror.foundMs === null) state.mirror.startTs = now;
    if (state.repeat.foundMs === null) state.repeat.startTs = now;
  }

  const labBox = document.getElementById("lab-spot");
  if (labBox && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !labVisibleStarted) {
        labVisibleStarted = true;
        resetUnfoundTimers();
        io.disconnect();
      }
    }, { threshold: 0.35 });
    io.observe(labBox);
  }

  function generatePuzzle() {
    seed += 1;
    const rows = 6;
    const leftM = [];
    const leftR = [];
    for (let r = 0; r < rows; r++) {
      const rowM = [];
      const rowR = [];
      for (let c = 0; c < 3; c++) {
        rowM.push(Math.floor(rng(seed * 41 + r * 7 + c * 3) * 3));
        rowR.push(Math.floor(rng(seed * 73 + r * 11 + c * 5) * 3));
      }
      leftM.push(rowM);
      leftR.push(rowR);
    }

    const defectCol = zone === "near" ? 3 : 5;
    const defectRowM = Math.floor(rng(seed * 19 + 3) * rows);
    const defectRowR = (defectRowM + 2) % rows;

    const buildGrid = (left, mode, dRow) => {
      const cells = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < 6; c++) {
          let val;
          if (c < 3) {
            val = left[r][c];
          } else if (mode === "mirror") {
            val = left[r][5 - c];
          } else {
            val = left[r][c - 3];
          }
          const isDefect = r === dRow && c === defectCol;
          if (isDefect) val = (val + 1) % 3;
          cells.push({ r, c, val, isDefect });
        }
      }
      return { cells, defectRow: dRow, defectCol, startTs: 0, foundMs: null };
    };

    state = {
      mirror: buildGrid(leftM, "mirror", defectRowM),
      repeat: buildGrid(leftR, "repeat", defectRowR),
    };

    renderBoard(gridMirror, state.mirror, "mirror", timeMirrorEl);
    renderBoard(gridRepeat, state.repeat, "repeat", timeRepeatEl);
    timeMirrorEl.textContent = "待找出";
    timeRepeatEl.textContent = "待找出";
    readoutEl.textContent =
      zone === "near"
        ? "当前为「近轴破缺」：破缺点藏在紧邻中轴的第 4 列。分别点出 A、B 两板的唯一破缺，看看哪块眼力更快。"
        : "当前为「远缘破缺」：破缺点移到最外侧第 6 列。再分别找一次，体会 Bruce & Morgan（1975）的中轴优势衰减。";
  }

  function renderBoard(container, board, key, timeEl) {
    container.innerHTML = "";
    board.startTs = performance.now();
    for (const cell of board.cells) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "spot-cell";
      btn.setAttribute("aria-label", `${key === "mirror" ? "镜像板" : "平移板"} 第${cell.r + 1}行第${cell.c + 1}列`);
      if (cell.val > 0) {
        const dot = document.createElement("span");
        dot.className = `spot-dot tone-${cell.val}`;
        btn.appendChild(dot);
      }
      btn.addEventListener("click", () => {
        if (board.foundMs !== null) return;
        if (cell.isDefect) {
          const now = performance.now();
          board.foundMs = Math.max(120, Math.round(now - board.startTs));
          btn.dataset.found = "true";
          timeEl.textContent = `找到 · ${(board.foundMs / 1000).toFixed(2)}s`;
          // 刚解完一块板时，将另一块未解板的起点重置为当前时刻，避免累计两块耗时
          const other = key === "mirror" ? state.repeat : state.mirror;
          if (other.foundMs === null) other.startTs = now;
          updateSummary();
        } else {
          btn.dataset.wrong = "true";
          readoutEl.textContent = `${key === "mirror" ? "A · 真镜像板" : "B · 平移重复板"}这一格符合规则——破缺藏在右侧半区，再对照左侧核对一下。`;
        }
      });
      container.appendChild(btn);
    }
  }

  function updateSummary() {
    const m = state.mirror.foundMs;
    const r = state.repeat.foundMs;
    if (m !== null && r !== null) {
      const cmp =
        m < r
          ? `你找镜像板更快（${(m / 1000).toFixed(2)}s 对 ${(r / 1000).toFixed(2)}s）`
          : `本次两板耗时分别为镜像 ${(m / 1000).toFixed(2)}s、平移 ${(r / 1000).toFixed(2)}s`;
      readoutEl.textContent =
        zone === "near"
          ? `${cmp}。近轴区里真镜像左右点紧贴面对面，眼睛跨中缝一扫就抓出破缺；切到「远缘破缺」试试，差距通常会缩小。`
          : `${cmp}。当破缺退到远离中轴的外缘，镜像的近轴锁定变弱，需要来回扫视更长距离才能核对出来。`;
    } else if (m !== null) {
      readoutEl.textContent = `已找出 A · 真镜像板破缺（${(m / 1000).toFixed(2)}s），接着找出 B · 平移重复板里的那 1 处破缺。`;
    } else if (r !== null) {
      readoutEl.textContent = `已找出 B · 平移重复板破缺（${(r / 1000).toFixed(2)}s），接着找出 A · 真镜像板里的那 1 处破缺。`;
    }
  }

  for (const btn of zoneBtns) {
    btn.addEventListener("click", () => {
      zone = btn.dataset.spotZone;
      for (const b of zoneBtns) b.setAttribute("aria-pressed", String(b === btn));
      generatePuzzle();
    });
  }
  newBtn?.addEventListener("click", generatePuzzle);
  generatePuzzle();
}

/* =========================================================
   02 实验：四层版画显影复选开关（带 1.0× 轴缝/层距校准标尺）
   ========================================================= */
export function initLayersLab() {
  const canvas = document.getElementById("layers-canvas");
  const readout = document.getElementById("layers-readout");
  const resetBtn = document.getElementById("layers-reset");
  const checks = [...document.querySelectorAll("[data-layer]")];
  if (!canvas || !checks.length) return;

  const layers = { reflection: true, echo: true, duality: true, rhythm: true };

  function draw() {
    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, w, h);

    const scale = Math.min(w / 480, h / 360);
    const ox = (w - 480 * scale) / 2;
    const oy = (h - 360 * scale) / 2;

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    const ax = 240;
    // 开启 Rhythm 时：单侧离轴 9 单位（轴缝 18 ≈ 层距 18 → 1.0× 经验舒服带）；关闭时压紧到 2.5 单位（0.28× 贴缝发闷）
    const layerGap = 18;
    const halfGap = layers.rhythm ? 9 : 2.5;
    const ratio = (halfGap * 2) / layerGap;

    const cTop = layers.duality ? PALETTE.magenta : "#9A9A9E";
    const cMid = layers.duality ? PALETTE.silver : "#9A9A9E";
    const cBot = layers.duality ? PALETTE.berry : "#9A9A9E";

    // Echo 外弧与四枚圆点
    if (layers.echo) {
      ctx.save();
      ctx.strokeStyle = layers.duality ? PALETTE.magenta : "#8E8E92";
      ctx.fillStyle = layers.duality ? PALETTE.magenta : "#8E8E92";
      ctx.lineWidth = 1.6;
      const dirs = layers.reflection ? [-1, 1] : [-1];
      for (const dir of dirs) {
        ctx.beginPath();
        if (dir < 0) ctx.arc(ax, 192, 152, Math.PI * 0.82, Math.PI * 1.38);
        else ctx.arc(ax, 192, 152, -Math.PI * 0.38, Math.PI * 0.18);
        ctx.stroke();
        // 上外圆点 + 下角圆点
        ctx.beginPath();
        ctx.arc(ax + dir * 136, 98, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ax + dir * 144, 306, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    const drawSide = (dir) => {
      ctx.save();
      if (dir > 0) {
        ctx.translate(ax * 2, 0);
        ctx.scale(-1, 1);
      }
      const nearX = ax - halfGap;
      // 上层圆
      ctx.fillStyle = cTop;
      ctx.beginPath();
      ctx.arc(nearX - 54, 98, 38, 0, Math.PI * 2);
      ctx.fill();

      // 中层四分之一圆（紧贴 nearX）
      ctx.fillStyle = cMid;
      ctx.beginPath();
      ctx.moveTo(nearX, 224);
      ctx.lineTo(nearX - 70, 224);
      ctx.arc(nearX, 224, 70, Math.PI, Math.PI * 1.5, false);
      ctx.closePath();
      ctx.fill();

      // 底层斜切半圆（层距 = 18）
      ctx.fillStyle = cBot;
      const yTop = 224 + layerGap;
      const yBot = yTop + 74;
      ctx.beginPath();
      ctx.moveTo(nearX - 116, yBot);
      ctx.lineTo(nearX - 74, yTop);
      ctx.arc(nearX - 74, yBot, 74, -Math.PI / 2, 0, false);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    drawSide(-1);
    if (layers.reflection) drawSide(1);

    // 竖向镜轴虚线
    ctx.strokeStyle = PALETTE.magenta;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(ax, 34);
    ctx.lineTo(ax, 336);
    ctx.stroke();
    ctx.setLineDash([]);

    // 顶三角
    ctx.fillStyle = PALETTE.magenta;
    ctx.beginPath();
    ctx.moveTo(ax, 34);
    ctx.lineTo(ax - 7, 22);
    ctx.lineTo(ax + 7, 22);
    ctx.closePath();
    ctx.fill();

    // 标出「轴缝 / 层距」校准线
    if (layers.reflection) {
      ctx.strokeStyle = PALETTE.magentaBright;
      ctx.fillStyle = PALETTE.magentaBright;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(ax - halfGap, 146);
      ctx.lineTo(ax + halfGap, 146);
      ctx.stroke();
      ctx.font = `700 12px "Syne", "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`轴缝 / 层距 ≈ ${ratio.toFixed(1)}×`, ax, 352);
    }

    ctx.restore();

    // 更新解说
    const off = Object.entries(layers)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (!off.length) {
      readout.textContent = `四层全开：镜射定骨、外弧与圆点补呼应、浅银与双阶玫红拉开明度对偶，轴缝 / 同侧层间距 ≈ ${ratio.toFixed(1)}×（落入 ${SEAM_RULE.minGood}×–${SEAM_RULE.maxGood}× 经验舒服带）。`;
    } else {
      const notes = [];
      if (!layers.reflection) notes.push("关掉 Reflection 镜射后，右侧整个消失，回到单侧孤立排布");
      if (!layers.echo) notes.push("关掉 Echo 呼应后，少了外弧与角点合围，画面略显直白");
      if (!layers.duality) notes.push("关掉 Duality 对偶后，三形压成同灰单调平涂，层次感瞬间塌平");
      if (!layers.rhythm) notes.push(`关掉 Rhythm 节奏后，轴缝压到 ${ratio.toFixed(1)}× 紧贴中缝，两翼挤成一团重块`);
      readout.textContent = notes.join("；") + "。";
    }
  }

  for (const ck of checks) {
    ck.addEventListener("change", () => {
      layers[ck.dataset.layer] = ck.checked;
      draw();
    });
  }
  resetBtn?.addEventListener("click", () => {
    for (const ck of checks) {
      ck.checked = true;
      layers[ck.dataset.layer] = true;
    }
    draw();
  });

  draw();
  window.addEventListener("resize", draw);
}

/* =========================================================
   03 实验：一实一虚双滑块调参台（水岸倒影 / 正负徽标）
   ========================================================= */
export function initDualityLab() {
  const canvas = document.getElementById("duality-canvas");
  const rngDim = document.getElementById("rng-dim");
  const rngRipple = document.getElementById("rng-ripple");
  const valDim = document.getElementById("val-dim");
  const valRipple = document.getElementById("val-ripple");
  const lblDim = document.getElementById("lbl-dim");
  const lblRipple = document.getElementById("lbl-ripple");
  const readout = document.getElementById("duality-readout");
  const sceneBtns = [...document.querySelectorAll("[data-duality-scene]")];
  if (!canvas || !rngDim || !rngRipple) return;

  let scene = "water";

  function draw() {
    const dim = Number(rngDim.value);
    const ripple = Number(rngRipple.value);
    valDim.textContent = `${dim}%`;
    valRipple.textContent = `${ripple}%`;

    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, w, h);

    if (scene === "water") {
      const midY = Math.round(h * 0.5);
      // 上半天空微调、下半水面
      ctx.fillStyle = "#121215";
      ctx.fillRect(0, 0, w, midY);
      ctx.fillStyle = "#0B0B0D";
      ctx.fillRect(0, midY, w, h - midY);

      const drawArch = (alpha, jitter) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        const cx = w * 0.5;
        const unit = Math.min(w / 460, h / 280);
        // 建筑实景（偏塔 + 主穹顶 + 阶梯翼）
        ctx.fillStyle = PALETTE.silver;
        // 底座
        ctx.fillRect(cx - 118 * unit, midY - 20 * unit, 236 * unit, 16 * unit);
        // 主穹顶
        ctx.fillRect(cx - 56 * unit, midY - 62 * unit, 112 * unit, 42 * unit);
        ctx.beginPath();
        ctx.arc(cx, midY - 62 * unit, 48 * unit, Math.PI, 0);
        ctx.fill();
        // 左尖塔
        ctx.beginPath();
        ctx.moveTo(cx - 104 * unit, midY - 20 * unit);
        ctx.lineTo(cx - 90 * unit, midY - 108 * unit);
        ctx.lineTo(cx - 76 * unit, midY - 20 * unit);
        ctx.closePath();
        ctx.fill();
        // 右侧玫红灯球与深莓翼
        ctx.fillStyle = PALETTE.berry;
        ctx.fillRect(cx + 68 * unit, midY - 56 * unit, 44 * unit, 36 * unit);
        ctx.fillStyle = PALETTE.magenta;
        ctx.beginPath();
        ctx.arc(cx + 98 * unit, midY - 94 * unit, 16 * unit, 0, Math.PI * 2);
        ctx.fill();

        // 水纹切条（仅倒影侧）
        if (jitter > 0) {
          ctx.fillStyle = "#0B0B0D";
          const bands = Math.round(4 + (jitter / 100) * 14);
          const thick = 1 + (jitter / 100) * 5.2;
          for (let i = 0; i < bands; i++) {
            const y = midY - 8 * unit - (i / bands) * 108 * unit;
            ctx.fillRect(cx - 140 * unit, y, 280 * unit, thick);
          }
        }
        ctx.restore();
      };

      // 上实景
      drawArch(1, 0);
      // 下倒影
      ctx.save();
      ctx.translate(0, midY * 2);
      ctx.scale(1, -1);
      const reflAlpha = Math.max(0.08, 1 - (dim / 100) * 0.92);
      drawArch(reflAlpha, ripple);
      ctx.restore();

      // 水平镜轴线
      ctx.strokeStyle = PALETTE.magenta;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(16, midY);
      ctx.lineTo(w - 16, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 诊断三档
      if (dim < 15 && ripple < 12) {
        readout.textContent = "死硬打架区：倒影和实景一样亮、一样锐，上下像直接复制翻转的剪纸，视线在两半之间反复抢焦点。";
      } else if (dim > 72 || ripple > 78) {
        readout.textContent = "融化失联区：倒影衰减过狠或波纹打得太碎，下半轮廓已经散掉，跨轴呼应随之变弱。";
      } else {
        readout.textContent = `一实一虚舒适区：倒影降暗 ${dim}%、横纹扰动 ${ripple}%——上实下虚主次立现，既守住对称秩序又自然透气。`;
      }
    } else {
      // 正负形品牌徽标对偶模式
      const midX = Math.round(w * 0.5);
      const unit = Math.min(w / 440, h / 260);
      // 左暗右亮（反相程度随 dim 调节）
      const inv = dim / 100;
      const rightBg = Math.round(13 + inv * 222);
      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(0, 0, midX, h);
      ctx.fillStyle = `rgb(${rightBg}, ${rightBg}, ${Math.max(13, rightBg - 2)})`;
      ctx.fillRect(midX, 0, w - midX, h);

      const gap = 8 * unit + (ripple / 100) * 28 * unit;
      const drawHalf = (dir, fill) => {
        ctx.save();
        if (dir > 0) {
          ctx.translate(midX * 2, 0);
          ctx.scale(-1, 1);
        }
        ctx.fillStyle = fill;
        const nx = midX - gap;
        const cy = h * 0.5;
        // 折翼半徽标
        ctx.beginPath();
        ctx.moveTo(nx, cy - 68 * unit);
        ctx.lineTo(nx - 92 * unit, cy - 34 * unit);
        ctx.lineTo(nx - 42 * unit, cy - 10 * unit);
        ctx.lineTo(nx, cy - 26 * unit);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(nx, cy - 6 * unit);
        ctx.lineTo(nx - 70 * unit, cy - 6 * unit);
        ctx.arc(nx, cy + 64 * unit, 70 * unit, Math.PI, Math.PI * 1.5, false);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      drawHalf(-1, PALETTE.silver);
      const rightFg = inv > 0.45 ? PALETTE.bg : PALETTE.silver;
      drawHalf(1, rightFg);

      // 中轴虚线
      ctx.strokeStyle = PALETTE.magenta;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(midX, 14);
      ctx.lineTo(midX, h - 14);
      ctx.stroke();
      ctx.setLineDash([]);

      if (dim < 20) {
        readout.textContent = "同底同色态：左右完全同底同色，规整但平铺直叙；拉高「正负反相度」让右侧翻成浅底墨形，对偶张力瞬间立起来。";
      } else if (ripple > 75) {
        readout.textContent = "中缝拉开过宽：即便正负反相明显，左右两半隔得太远也开始各自为战，略微收紧缝宽更像一枚完整徽标。";
      } else {
        readout.textContent = `正负双生舒适区：反相度 ${dim}%，利用 Baylis & Driver 的图底边缘归属让同一条中轴同时托起暗实与亮虚两半。`;
      }
    }
  }

  for (const btn of sceneBtns) {
    btn.addEventListener("click", () => {
      scene = btn.dataset.dualityScene;
      for (const b of sceneBtns) b.setAttribute("aria-pressed", String(b === btn));
      if (scene === "water") {
        lblDim.textContent = "倒影亮度衰减";
        lblRipple.textContent = "水纹扰动强度";
        rngDim.value = "35";
        rngRipple.value = "28";
      } else {
        lblDim.textContent = "右侧正负反相度";
        lblRipple.textContent = "中缝呼吸宽窄";
        rngDim.value = "85";
        rngRipple.value = "26";
      }
      draw();
    });
  }

  rngDim.addEventListener("input", draw);
  rngRipple.addEventListener("input", draw);
  draw();
  window.addEventListener("resize", draw);
}

/* =========================================================
   04 实验：五坐标历史画廊（全部经在线核实的真实镜像构图坐标）
   ========================================================= */
const HISTORY_ERAS = {
  alhambra: {
    year: "14th Century · 1333–1354",
    title: "格拉纳达阿尔罕布拉宫「桃金娘中庭」",
    axis: "镜轴类型：水平静水池镜像轴",
    body: "纳斯里德王朝优素福一世时期营建（后由穆罕默德五世续修）。中庭中央长约 34 米、宽约 7.1 米的矩形静水池以水平水面为镜轴，把北侧科马雷斯塔与细密拱廊完整倒映于水中，用零新增体量将建筑秩序纵向翻倍，1984 年列入 UNESCO 世界遗产（编号 314）。",
    source: "核实出处：UNESCO World Heritage Centre, Site No. 314（Alhambra, Generalife and Albayzín, Granada）",
  },
  taj: {
    year: "1632–1648",
    title: "印度阿格拉泰姬陵（Taj Mahal）",
    axis: "镜轴类型：竖向 qarina 成对中轴 + 水平水池倒影轴",
    body: "按 UNESCO 世界遗产档案（编号 252），泰姬陵于 1632 年起建、主陵约 1648 年竣工（园林与附属建筑约 1653 年完成）。莫卧儿建筑以 qarina（成对镜像对应）法则在白色主陵东西两侧对称安置红砂岩清真寺与「应答」殿（jawab），再配南北长条倒影池，叠成竖轴与横轴双重镜像秩序。",
    source: "核实出处：UNESCO World Heritage Centre, Site No. 252（Taj Mahal）",
  },
  kant: {
    year: "1768",
    title: "康德《论空间方位区分的终极根据》",
    axis: "镜轴类型：空间手性反射面（左右手不重合对应体）",
    body: "伊曼努尔·康德在 1768 年论文中以人体的左手与右手论证「不重合对应体（incongruent counterparts）」：两只手内部每段尺寸与部件关系完全相等，却无法靠平移或旋转重合，只能借镜面反射互换——为「镜像是手性翻转而非复制」提供了最清晰的空间几何证明。",
    source: "核实出处：Stanford Encyclopedia of Philosophy — Leibniz’s Influence on Kant / Symmetry and Symmetry Breaking",
  },
  bresson: {
    year: "1932",
    title: "布列松《圣拉扎尔车站后方》",
    axis: "镜轴类型：水平积水面上下镜像轴",
    body: "亨利·卡蒂埃-布列松 1932 年摄于巴黎（纽约现代艺术博物馆 MoMA 藏，馆藏号 249.2005）。画面以地面一汪静水为水平镜轴构成上下镜像：凌空跃起的行人脚跟几乎贴到水面，清晰倒影向上承接实体身影，远处海报里的舞者姿态再添一层呼应，把转瞬即逝的街头动态定格成严谨秩序。",
    source: "核实出处：MoMA Collection, Object No. 249.2005（works/98333, Henri Cartier-Bresson, Behind the Gare St. Lazare, 1932）",
  },
  escher: {
    year: "1952",
    title: "M. C. 埃舍尔《水洼》（Puddle）",
    axis: "镜轴类型：林间积水双界镜像面",
    body: "1952 年 2 月创作的三版套色木刻版画。泥泞林间小路布满车辙与脚印，唯有中央一汪雨后积水充当镜面，在暗调实景包围下倒映出原本不在画框之内的无云夜空、树枝与满月——直观示范镜像构图「以虚映实、一实一虚双界共生」的叙事张力。",
    source: "核实出处：Museum Escher in The Palace — Puddle（February 1952, color woodcut）",
  },
};

export function initHistoryLab() {
  const canvas = document.getElementById("history-canvas");
  const btns = [...document.querySelectorAll(".era-btn")];
  const elYear = document.getElementById("hist-year");
  const elTitle = document.getElementById("hist-title");
  const elAxis = document.getElementById("hist-axis");
  const elBody = document.getElementById("hist-body");
  const elSource = document.getElementById("hist-source");
  if (!canvas || !btns.length) return;

  let current = "alhambra";

  function draw() {
    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const u = Math.min(w / 480, h / 300);

    if (current === "alhambra") {
      // 水平水池 + 科马雷斯塔 + 七连拱廊与水中倒影
      const drawBuilding = (alpha) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = PALETTE.silver;
        // 科马雷斯方塔
        ctx.fillRect(cx - 46 * u, cy - 114 * u, 92 * u, 68 * u);
        // 拱廊主墙
        ctx.fillRect(cx - 122 * u, cy - 48 * u, 244 * u, 42 * u);
        // 拱洞
        ctx.fillStyle = PALETTE.bg;
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(cx + i * 30 * u, cy - 12 * u, 9 * u, Math.PI, 0);
          ctx.lineTo(cx + i * 30 * u + 9 * u, cy - 6 * u);
          ctx.lineTo(cx + i * 30 * u - 9 * u, cy - 6 * u);
          ctx.closePath();
          ctx.fill();
        }
        // 两侧修剪整齐的桃金娘绿篱（以深莓色统一三色体系）
        ctx.fillStyle = PALETTE.berry;
        ctx.fillRect(cx - 166 * u, cy - 18 * u, 32 * u, 12 * u);
        ctx.fillRect(cx + 134 * u, cy - 18 * u, 32 * u, 12 * u);
        ctx.restore();
      };
      drawBuilding(1);
      ctx.save();
      ctx.translate(0, cy * 2);
      ctx.scale(1, -1);
      drawBuilding(0.45);
      ctx.restore();
      // 水平水面镜轴
      ctx.strokeStyle = PALETTE.magenta;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(24 * u, cy);
      ctx.lineTo(w - 24 * u, cy);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (current === "taj") {
      // 竖轴 qarina 左右对置 + 水平水池
      const baseLine = cy + 28 * u;
      const drawComplex = (alpha) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        // 中央白色主陵
        ctx.fillStyle = PALETTE.silver;
        ctx.fillRect(cx - 42 * u, baseLine - 60 * u, 84 * u, 54 * u);
        ctx.beginPath();
        ctx.arc(cx, baseLine - 62 * u, 30 * u, Math.PI, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - 4 * u, baseLine - 90 * u);
        ctx.lineTo(cx, baseLine - 112 * u);
        ctx.lineTo(cx + 4 * u, baseLine - 90 * u);
        ctx.fill();
        // 左右成对 qarina 清真寺 & 应答殿（深莓红砂岩呼应）
        ctx.fillStyle = PALETTE.berry;
        for (const dir of [-1, 1]) {
          ctx.fillRect(cx + dir * 108 * u - 26 * u, baseLine - 44 * u, 52 * u, 38 * u);
          ctx.beginPath();
          ctx.arc(cx + dir * 108 * u, baseLine - 44 * u, 18 * u, Math.PI, 0);
          ctx.fill();
          // 细宣礼塔
          ctx.fillStyle = PALETTE.silver;
          ctx.fillRect(cx + dir * 64 * u - 3 * u, baseLine - 78 * u, 6 * u, 72 * u);
          ctx.fillStyle = PALETTE.berry;
        }
        ctx.restore();
      };
      drawComplex(1);
      ctx.save();
      ctx.translate(0, baseLine * 2);
      ctx.scale(1, -1);
      drawComplex(0.38);
      ctx.restore();
      // 竖 + 横双镜轴
      ctx.strokeStyle = PALETTE.magenta;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(cx, 16 * u);
      ctx.lineTo(cx, h - 16 * u);
      ctx.moveTo(24 * u, baseLine);
      ctx.lineTo(w - 24 * u, baseLine);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (current === "kant") {
      // 极简几何手掌剪影（左手 vs 右手：不重合对应体）
      const drawHand = (dir) => {
        ctx.save();
        if (dir > 0) {
          ctx.translate(cx * 2, 0);
          ctx.scale(-1, 1);
        }
        ctx.fillStyle = dir < 0 ? PALETTE.silver : PALETTE.magenta;
        const bx = cx - 44 * u;
        // 掌心块
        ctx.fillRect(bx - 56 * u, cy - 8 * u, 56 * u, 68 * u);
        // 四指
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(bx - 56 * u + i * 14.5 * u, cy - 64 * u + (i === 0 ? 12 * u : i === 3 ? 16 * u : 0), 10.5 * u, 58 * u);
        }
        // 大拇指朝向镜轴（手性核心标志）
        ctx.beginPath();
        ctx.moveTo(bx, cy + 40 * u);
        ctx.lineTo(bx + 24 * u, cy + 8 * u);
        ctx.lineTo(bx + 14 * u, cy - 4 * u);
        ctx.lineTo(bx, cy + 16 * u);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };
      drawHand(-1);
      drawHand(1);
      ctx.strokeStyle = PALETTE.magentaBright;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(cx, 20 * u);
      ctx.lineTo(cx, h - 20 * u);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (current === "bresson") {
      // 布列松：水平积水面上下镜像，纯几何跃影剪影（绝不画五官！）
      const waterY = cy + 14 * u;
      // 水平栅栏竖条背景
      ctx.strokeStyle = "rgba(226, 226, 226, 0.16)";
      ctx.lineWidth = 2;
      for (let x = 44 * u; x < w - 44 * u; x += 28 * u) {
        ctx.beginPath();
        ctx.moveTo(x, 28 * u);
        ctx.lineTo(x, waterY - 8 * u);
        ctx.stroke();
      }
      const drawLeaper = (alpha) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        // 左侧梯板跳台
        ctx.fillStyle = PALETTE.berry;
        ctx.fillRect(cx - 140 * u, waterY - 8 * u, 76 * u, 6 * u);
        // 极简纯黑/浅银跃起人影剪影（头圆无五官 + 躯干 + 跨步双腿）
        ctx.fillStyle = PALETTE.silver;
        ctx.strokeStyle = PALETTE.silver;
        ctx.lineCap = "round";
        // 头部纯圆剪影
        ctx.beginPath();
        ctx.arc(cx + 12 * u, waterY - 88 * u, 10 * u, 0, Math.PI * 2);
        ctx.fill();
        // 躯干与前后跨步
        ctx.lineWidth = 10 * u;
        ctx.beginPath();
        ctx.moveTo(cx + 6 * u, waterY - 72 * u);
        ctx.lineTo(cx - 8 * u, waterY - 40 * u);
        ctx.stroke();
        ctx.lineWidth = 7 * u;
        ctx.beginPath();
        // 后蹬脚贴近水面
        ctx.moveTo(cx - 8 * u, waterY - 40 * u);
        ctx.lineTo(cx - 32 * u, waterY - 12 * u);
        // 前跨步
        ctx.moveTo(cx - 8 * u, waterY - 40 * u);
        ctx.lineTo(cx + 28 * u, waterY - 26 * u);
        ctx.lineTo(cx + 44 * u, waterY - 6 * u);
        ctx.stroke();
        ctx.restore();
      };
      drawLeaper(1);
      ctx.save();
      ctx.translate(0, waterY * 2);
      ctx.scale(1, -1);
      drawLeaper(0.45);
      ctx.restore();

      // 水面涟漪圆环 + 水平镜轴
      ctx.strokeStyle = PALETTE.magenta;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(22 * u, waterY);
      ctx.lineTo(w - 22 * u, waterY);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (current === "escher") {
      // 埃舍尔《水洼》：泥路车辙斜线包围中间一汪有机水洼，洼内映出夜月与树枝剪影
      ctx.strokeStyle = "rgba(226, 226, 226, 0.2)";
      ctx.lineWidth = 2;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 54 * u - 80 * u, 16 * u);
        ctx.lineTo(cx + i * 64 * u + 40 * u, h - 16 * u);
        ctx.stroke();
      }
      // 中央水洼裁切区
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy + 6 * u, 148 * u, 82 * u, -0.06, 0, Math.PI * 2);
      ctx.fillStyle = "#16161C";
      ctx.fill();
      ctx.strokeStyle = PALETTE.magenta;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.clip();

      // 水洼内的满月与对称树冠倒影
      ctx.fillStyle = PALETTE.silver;
      ctx.beginPath();
      ctx.arc(cx + 46 * u, cy - 18 * u, 20 * u, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = PALETTE.berry;
      ctx.lineWidth = 6 * u;
      for (const tx of [-90, -40, 88]) {
        ctx.beginPath();
        ctx.moveTo(cx + tx * u, cy - 90 * u);
        ctx.lineTo(cx + tx * u * 0.72, cy + 95 * u);
        ctx.stroke();
      }
      ctx.restore();
    }

    const d = HISTORY_ERAS[current];
    elYear.textContent = d.year;
    elTitle.textContent = d.title;
    elAxis.textContent = d.axis;
    elBody.textContent = d.body;
    elSource.textContent = d.source;
  }

  for (const btn of btns) {
    btn.addEventListener("click", () => {
      current = btn.dataset.era;
      for (const b of btns) b.setAttribute("aria-selected", String(b === btn));
      draw();
    });
  }
  draw();
  window.addEventListener("resize", draw);
}

/* =========================================================
   05 实验：四大应用场景中缝对比拉帘（拖拽 + 滑块同步）
   ========================================================= */
const SCENE_COPY = {
  arch: "建筑与景观：右半建立水平水面镜轴后，孤立的建筑立面获得水面倒影承托，上下重量平衡且空间感成倍拉深。",
  brand: "品牌与标志设计：左半平移重复像排队散件，右半竖向镜像把折翼弧锁成整体徽标，并让字标独立保持正向。",
  spread: "书籍跨页排版：左半沿用不对称单页边距导致订口偏斜，右半以订口为镜轴做镜像页边距（内窄外宽、页码分落外角），摊开瞬间呈现整体秩序。",
  photo: "摄影与视觉艺术：右半借地面静水或玻璃引入镜像双界，把画外天空与几何主体一起收入镜面对偶。",
};

export function initCurtainLab() {
  const wrap = document.getElementById("curtain-wrap");
  const canvas = document.getElementById("curtain-canvas");
  const divider = document.getElementById("curtain-divider");
  const rng = document.getElementById("rng-curtain");
  const pctEl = document.getElementById("curtain-pct");
  const readout = document.getElementById("curtain-readout");
  const btns = [...document.querySelectorAll("[data-scene]")];
  if (!wrap || !canvas || !rng) return;

  let scene = "arch";
  let split = 0.5;

  function drawSide(ctx, w, h, mirrored) {
    const cx = w / 2;
    const cy = h / 2;
    const u = Math.min(w / 460, h / 280);

    ctx.fillStyle = mirrored ? "#101013" : "#18181B";
    ctx.fillRect(0, 0, w, h);

    if (scene === "arch") {
      const yLine = cy + 6 * u;
      ctx.fillStyle = PALETTE.silver;
      ctx.fillRect(cx - 90 * u, yLine - 62 * u, 180 * u, 56 * u);
      ctx.beginPath();
      ctx.arc(cx, yLine - 62 * u, 52 * u, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = PALETTE.magenta;
      ctx.beginPath();
      ctx.arc(cx + 114 * u, yLine - 88 * u, 16 * u, 0, Math.PI * 2);
      ctx.fill();
      if (mirrored) {
        ctx.save();
        ctx.translate(0, yLine * 2);
        ctx.scale(1, -1);
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = PALETTE.silver;
        ctx.fillRect(cx - 90 * u, yLine - 62 * u, 180 * u, 56 * u);
        ctx.beginPath();
        ctx.arc(cx, yLine - 62 * u, 52 * u, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = PALETTE.magenta;
        ctx.beginPath();
        ctx.arc(cx + 114 * u, yLine - 88 * u, 16 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = PALETTE.magenta;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(14, yLine);
        ctx.lineTo(w - 14, yLine);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = "#242428";
        ctx.fillRect(0, yLine, w, h - yLine);
      }
    } else if (scene === "brand") {
      const drawMark = (x, flip) => {
        ctx.save();
        ctx.translate(x, cy - 12 * u);
        if (flip) ctx.scale(-1, 1);
        ctx.fillStyle = PALETTE.magenta;
        ctx.beginPath();
        ctx.moveTo(-42 * u, -48 * u);
        ctx.lineTo(-4 * u, -48 * u);
        ctx.lineTo(-4 * u, 36 * u);
        ctx.lineTo(-68 * u, 36 * u);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = PALETTE.silver;
        ctx.fillRect(-34 * u, -20 * u, 24 * u, 24 * u);
        ctx.restore();
      };
      drawMark(cx - 6 * u, false);
      drawMark(mirrored ? cx + 6 * u : cx + 76 * u, mirrored);
      ctx.fillStyle = PALETTE.silver;
      ctx.font = `700 ${Math.round(16 * u)}px "Syne", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("MIRROR", cx, cy + 68 * u);
      if (mirrored) {
        ctx.strokeStyle = PALETTE.magenta;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(cx, 18 * u);
        ctx.lineTo(cx, h - 18 * u);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (scene === "spread") {
      // 书籍双页摊开：对比非镜像页边距 vs 镜像页边距
      const bw = 340 * u;
      const bh = 216 * u;
      const bx = cx - bw / 2;
      const by = cy - bh / 2;
      ctx.fillStyle = "#ECEAE8";
      ctx.fillRect(bx, by, bw, bh);
      // 书脊订口
      ctx.strokeStyle = mirrored ? PALETTE.magenta : "#888";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, by - 10 * u);
      ctx.lineTo(cx, by + bh + 10 * u);
      ctx.stroke();
      ctx.setLineDash([]);

      const pageW = bw / 2;
      // 左页正文块
      const drawTextBlock = (x, y, tw, th, alignPageNo) => {
        ctx.fillStyle = "#222226";
        for (let i = 0; i < 6; i++) {
          ctx.fillRect(x, y + i * 16 * u, i === 5 ? tw * 0.65 : tw, 6 * u);
        }
        ctx.fillStyle = PALETTE.magenta;
        ctx.fillRect(x, y - 22 * u, tw * 0.45, 9 * u);
        ctx.fillStyle = "#555";
        ctx.fillRect(alignPageNo === "left" ? x : x + tw - 16 * u, by + bh - 16 * u, 16 * u, 5 * u);
      };
      if (mirrored) {
        // 镜像页边距：外宽内窄，沿书脊镜像对称
        drawTextBlock(bx + 36 * u, by + 46 * u, pageW - 54 * u, bh - 82 * u, "left");
        drawTextBlock(cx + 18 * u, by + 46 * u, pageW - 54 * u, bh - 82 * u, "right");
      } else {
        // 普通相同页边距：左右都靠左，造成订口偏重不对称
        drawTextBlock(bx + 18 * u, by + 46 * u, pageW - 54 * u, bh - 82 * u, "left");
        drawTextBlock(cx + 18 * u, by + 46 * u, pageW - 54 * u, bh - 82 * u, "left");
      }
    } else {
      // 摄影双界
      const yLine = cy + 16 * u;
      ctx.fillStyle = PALETTE.silver;
      ctx.beginPath();
      ctx.moveTo(cx - 120 * u, yLine - 6 * u);
      ctx.lineTo(cx - 56 * u, yLine - 94 * u);
      ctx.lineTo(cx + 16 * u, yLine - 6 * u);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PALETTE.magenta;
      ctx.beginPath();
      ctx.arc(cx + 76 * u, yLine - 72 * u, 24 * u, 0, Math.PI * 2);
      ctx.fill();
      if (mirrored) {
        ctx.save();
        ctx.translate(0, yLine * 2);
        ctx.scale(1, -1);
        ctx.globalAlpha = 0.52;
        ctx.fillStyle = PALETTE.silver;
        ctx.beginPath();
        ctx.moveTo(cx - 120 * u, yLine - 6 * u);
        ctx.lineTo(cx - 56 * u, yLine - 94 * u);
        ctx.lineTo(cx + 16 * u, yLine - 6 * u);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = PALETTE.magenta;
        ctx.beginPath();
        ctx.arc(cx + 76 * u, yLine - 72 * u, 24 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = PALETTE.magenta;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(14, yLine);
        ctx.lineTo(w - 14, yLine);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = "#222226";
        ctx.fillRect(0, yLine, w, h - yLine);
      }
    }
  }

  function draw() {
    const { ctx, w, h } = sizeCanvas(canvas);
    const sx = Math.round(w * split);
    // 左半：普通无镜像
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, sx, h);
    ctx.clip();
    drawSide(ctx, w, h, false);
    ctx.restore();

    // 右半：建立镜像轴
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx, 0, w - sx, h);
    ctx.clip();
    drawSide(ctx, w, h, true);
    ctx.restore();

    // 角标文字
    ctx.fillStyle = "rgba(13,13,13,0.82)";
    ctx.fillRect(10, 10, 88, 22);
    ctx.fillRect(w - 98, 10, 88, 22);
    ctx.fillStyle = PALETTE.silver;
    ctx.font = `700 11.5px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("无镜像排法", 54, 21);
    ctx.fillStyle = PALETTE.magentaBright;
    ctx.fillText("建立镜像轴", w - 54, 21);

    divider.style.left = `${(split * 100).toFixed(1)}%`;
    pctEl.textContent = `${Math.round(split * 100)}%`;
    readout.textContent = SCENE_COPY[scene];
  }

  function setFromClientX(clientX) {
    const rect = wrap.getBoundingClientRect();
    split = Math.max(0.1, Math.min(0.9, (clientX - rect.left) / rect.width));
    rng.value = String(Math.round(split * 100));
    draw();
  }

  let dragging = false;
  wrap.addEventListener("pointerdown", (e) => {
    dragging = true;
    wrap.setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  });
  wrap.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setFromClientX(e.clientX);
  });
  const endDrag = () => { dragging = false; };
  wrap.addEventListener("pointerup", endDrag);
  wrap.addEventListener("pointercancel", endDrag);

  rng.addEventListener("input", () => {
    split = Number(rng.value) / 100;
    draw();
  });

  for (const btn of btns) {
    btn.addEventListener("click", () => {
      scene = btn.dataset.scene;
      for (const b of btns) b.setAttribute("aria-pressed", String(b === btn));
      draw();
    });
  }

  draw();
  window.addEventListener("resize", draw);
}

/* =========================================================
   06 实验：四张病历翻转卡（查看救法 ↔ 看翻车态）
   ========================================================= */
export function initPitfallCards() {
  const cards = [...document.querySelectorAll(".pitfall-card")];
  for (const card of cards) {
    const btn = card.querySelector(".pit-btn");
    const desc = card.querySelector(".pit-desc");
    const state = card.querySelector(".pit-state");
    if (!btn || !desc || !state) continue;
    btn.addEventListener("click", () => {
      const fixed = card.dataset.fixed !== "true";
      card.dataset.fixed = String(fixed);
      state.textContent = fixed ? "修正后" : "翻车态";
      desc.textContent = fixed ? desc.dataset.good : desc.dataset.bad;
      btn.textContent = fixed ? "看回翻车态" : "查看救法";
    });
  }
}

/* =========================================================
   07 实验：严格单变量盲测（全部直接调用 model.js + renderMirrorScene）
   ========================================================= */
export function initQuizLab(onLoadIntoHero) {
  const cards = [...document.querySelectorAll(".quiz-card")];
  const titleEl = document.getElementById("qv-title");
  const bodyEl = document.getElementById("qv-body");
  const tryBtn = document.getElementById("btn-try-hero");
  if (!cards.length) return;

  const models = {};
  for (const q of QUIZ_RATIOS) {
    models[q.id] = buildQuizOptionModel(q.id);
  }

  let pickedId = null;

  function drawAll(reveal) {
    for (const card of cards) {
      const id = card.dataset.opt;
      const m = models[id];
      const canvas = card.querySelector("canvas");
      const tag = card.querySelector("[data-quiz-tag]");
      if (canvas) {
        renderMirrorScene(canvas, m.state, {
          customSpec: m.spec,
          mini: true,
          revealMetrics: reveal,
        });
      }
      if (tag) {
        tag.textContent = reveal ? `${m.eval.ratio.toFixed(1)}× · ${m.verdict.label}` : "";
      }
      if (reveal) {
        card.dataset.result = m.isCorrect ? "correct" : id === pickedId ? "wrong" : "other";
      } else {
        delete card.dataset.result;
      }
    }
  }

  for (const card of cards) {
    card.addEventListener("click", () => {
      pickedId = card.dataset.opt;
      const picked = models[pickedId];
      const correct = Object.values(models).find((m) => m.isCorrect);

      for (const c of cards) c.setAttribute("aria-pressed", String(c === card));
      drawAll(true);

      if (picked.isCorrect) {
        titleEl.textContent = `选对了：${picked.id} 版（轴缝 / 层间距 = ${picked.eval.ratio.toFixed(1)}× · ${picked.verdict.label}）`;
        bodyEl.textContent = `${picked.verdict.reason} 其余三版都在框内且未相撞：C 版（${models.C.eval.ratio.toFixed(1)}×）${models.C.verdict.label}，A 版（${models.A.eval.ratio.toFixed(1)}×）${models.A.verdict.label}，D 版（${models.D.eval.ratio.toFixed(1)}×）${models.D.verdict.label}。`;
      } else {
        titleEl.textContent = `你选了 ${picked.id} 版（${picked.eval.ratio.toFixed(1)}× · ${picked.verdict.label}），最稳的是 ${correct.id} 版（${correct.eval.ratio.toFixed(1)}×）`;
        bodyEl.textContent = `${picked.verdict.reason} 对照第 02 节经验规则（${SEAM_RULE.minGood}×–${SEAM_RULE.maxGood}×），${correct.id} 版的轴缝与同侧层间距正好 1:1 呼应（单侧离轴 ${correct.eval.halfGapPct.toFixed(1)}%，贴合原海报 1.5%–2.5%）。`;
      }

      if (tryBtn) {
        tryBtn.hidden = false;
        tryBtn.textContent = `把 ${picked.id} 版（${picked.eval.ratio.toFixed(1)}×）带入开场工作台`;
      }
    });
  }

  tryBtn?.addEventListener("click", () => {
    if (!pickedId || !onLoadIntoHero) return;
    onLoadIntoHero(models[pickedId]);
  });

  drawAll(false);
  window.addEventListener("resize", () => drawAll(pickedId !== null));
}

/* =========================================================
   08 原海报放大灯箱（支持拖动、缩放与 Esc 关闭）
   ========================================================= */
export function initPosterLightbox() {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-btn");
  const lb = document.getElementById("lightbox");
  const lbStage = document.getElementById("lb-stage");
  const lbImg = document.getElementById("lb-img");
  const closeBtn = document.getElementById("lb-close");
  const zoomIn = document.getElementById("lb-zoom-in");
  const zoomOut = document.getElementById("lb-zoom-out");
  const zoomReset = document.getElementById("lb-zoom-reset");
  if (!posterImg || !openBtn || !lb || !lbImg) return;

  let zoom = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
    zoomReset.textContent = `${Math.round(zoom * 100)}%`;
  }

  function open() {
    lbImg.src = posterImg.src;
    zoom = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    closeBtn.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  zoomIn.addEventListener("click", () => {
    zoom = Math.min(3, +(zoom + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOut.addEventListener("click", () => {
    zoom = Math.max(0.7, +(zoom - 0.35).toFixed(2));
    if (zoom <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomReset.addEventListener("click", () => {
    zoom = 1; tx = 0; ty = 0;
    applyTransform();
  });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoom = Math.max(0.7, Math.min(3, +(zoom + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
    applyTransform();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbStage.classList.add("grabbing");
    lbStage.setPointerCapture?.(e.pointerId);
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const stopDrag = () => {
    dragging = false;
    lbStage.classList.remove("grabbing");
  };
  lbStage.addEventListener("pointerup", stopDrag);
  lbStage.addEventListener("pointercancel", stopDrag);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

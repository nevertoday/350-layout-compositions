// 022 垂直构图 · 第 01 至 08 节全部交互实验与原海报灯箱
// 相邻两节控件完全不重复；全部画布/SVG 等比缩放、不画五官、响应键盘与触屏。

import {
  FICK_MODES,
  HISTORY_ITEMS,
  QUIZZES,
  RHYTHM_PRESETS,
  USAGE_CASES,
  evaluateBeat,
  evaluateFick,
  evaluateGravity,
} from "./model.js";
import { pixelRatio } from "../../lib/stage.js";

const C = {
  paper: "#F5ECDF",
  paper2: "#ECE2D1",
  deepGreen: "#10372E",
  pine: "#1E4D41",
  midGreen: "#2B6455",
  charcoal: "#1B241E",
  sand: "#DFD2BE",
  taupe: "#BFB19B",
  gold: "#D39939",
  goldBright: "#E6B85C",
  goldDark: "#875B12",
  alert: "#B23A27",
  alertBright: "#F2917A",
};

function setupCanvas(canvas) {
  const dpr = pixelRatio(2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return null;
  const tw = Math.round(w * dpr);
  const th = Math.round(h * dpr);
  if (canvas.width !== tw || canvas.height !== th) {
    canvas.width = tw;
    canvas.height = th;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// ==================== 01 节：菲克垂直—水平错觉亲手量 ====================
export function initSection1() {
  const canvas = document.getElementById("s1-canvas");
  const slider = document.getElementById("s1-slider");
  const valEl = document.getElementById("s1-val");
  const checkBtn = document.getElementById("s1-check");
  const resetBtn = document.getElementById("s1-reset");
  const hintEl = document.getElementById("s1-hint");
  const resultEl = document.getElementById("s1-result");
  const modeBtns = [...document.querySelectorAll("[data-fick-mode]")];

  const H_LEN = 200;
  const st = { mode: "invT", vLen: 148, revealed: false };

  function draw() {
    const g = setupCanvas(canvas);
    if (!g) return;
    const { ctx, w, h } = g;

    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, w, h);

    // 淡灰制图纸框线（不提供刻度免剧透，揭晓后才画毫米标尺）
    ctx.strokeStyle = "rgba(16, 55, 46, 0.14)";
    ctx.lineWidth = 1;
    ctx.strokeRect(10.5, 10.5, w - 21, h - 21);

    const scale = Math.min((w - 72) / 280, (h - 76) / 260);
    const hPx = H_LEN * scale;
    const vPx = st.vLen * scale;
    const cx = w / 2;
    const baseY = h - Math.max(36, (h - hPx * 1.08) * 0.42);

    ctx.lineCap = "butt";

    if (st.mode === "invT") {
      // 固定横线（炭墨）
      ctx.strokeStyle = C.charcoal;
      ctx.lineWidth = Math.max(4, 5.5 * scale);
      ctx.beginPath();
      ctx.moveTo(cx - hPx / 2, baseY);
      ctx.lineTo(cx + hPx / 2, baseY);
      ctx.stroke();

      // 可调竖线（深松绿，居中立于横线中点）
      ctx.strokeStyle = C.pine;
      ctx.lineWidth = Math.max(4, 5.5 * scale);
      ctx.beginPath();
      ctx.moveTo(cx, baseY);
      ctx.lineTo(cx, baseY - vPx);
      ctx.stroke();

      // 顶端小金点提示正在调的长度端点
      ctx.fillStyle = C.gold;
      ctx.beginPath();
      ctx.arc(cx, baseY - vPx, 4.5, 0, Math.PI * 2);
      ctx.fill();

      if (st.revealed) {
        // 亮出精确等长参照线（200 单位）与标尺
        const trueTop = baseY - hPx;
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = C.goldDark;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx - hPx / 2, trueTop);
        ctx.lineTo(cx + hPx / 2, trueTop);
        ctx.stroke();
        ctx.restore();

        // 标示横线 200 与竖线实测值
        drawRulerTick(ctx, cx - hPx / 2, baseY + 14, cx + hPx / 2, baseY + 14, `横线 ${H_LEN}`, C.charcoal);
        drawVertTick(ctx, cx + hPx / 2 + 16, baseY, baseY - hPx, `等长 ${H_LEN}`, C.goldDark);
        drawVertTick(ctx, cx - hPx / 2 - 16, baseY, baseY - vPx, `你调的 ${st.vLen}`, C.alert);
      }
    } else if (st.mode === "Lshape") {
      const lx = cx - hPx / 2;
      ctx.strokeStyle = C.charcoal;
      ctx.lineWidth = Math.max(4, 5.5 * scale);
      ctx.beginPath();
      ctx.moveTo(lx, baseY);
      ctx.lineTo(lx + hPx, baseY);
      ctx.stroke();

      ctx.strokeStyle = C.pine;
      ctx.beginPath();
      ctx.moveTo(lx, baseY);
      ctx.lineTo(lx, baseY - vPx);
      ctx.stroke();

      ctx.fillStyle = C.gold;
      ctx.beginPath();
      ctx.arc(lx, baseY - vPx, 4.5, 0, Math.PI * 2);
      ctx.fill();

      if (st.revealed) {
        const trueTop = baseY - hPx;
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = C.goldDark;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(lx - 10, trueTop);
        ctx.lineTo(lx + hPx, trueTop);
        ctx.stroke();
        ctx.restore();

        drawRulerTick(ctx, lx, baseY + 14, lx + hPx, baseY + 14, `横线 ${H_LEN}`, C.charcoal);
        drawVertTick(ctx, lx + hPx + 16, baseY, baseY - hPx, `等长 ${H_LEN}`, C.goldDark);
        drawVertTick(ctx, lx - 18, baseY, baseY - vPx, `${st.vLen}`, C.alert);
      }
    } else {
      // 建筑门框（正方形 vs 你调出的高度）
      const lx = cx - hPx / 2;
      ctx.fillStyle = "rgba(30, 77, 65, 0.12)";
      ctx.fillRect(lx, baseY - vPx, hPx, vPx);
      ctx.strokeStyle = C.pine;
      ctx.lineWidth = Math.max(3, 4 * scale);
      ctx.strokeRect(lx, baseY - vPx, hPx, vPx);

      // 底部横宽用炭墨加重强调
      ctx.strokeStyle = C.charcoal;
      ctx.lineWidth = Math.max(4, 5 * scale);
      ctx.beginPath();
      ctx.moveTo(lx, baseY);
      ctx.lineTo(lx + hPx, baseY);
      ctx.stroke();

      if (st.revealed) {
        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = C.goldDark;
        ctx.lineWidth = 1.6;
        ctx.strokeRect(lx, baseY - hPx, hPx, hPx);
        ctx.restore();
        drawRulerTick(ctx, lx, baseY + 14, lx + hPx, baseY + 14, `宽 ${H_LEN}`, C.charcoal);
        drawVertTick(ctx, lx + hPx + 16, baseY, baseY - hPx, `真方 ${H_LEN}`, C.goldDark);
        drawVertTick(ctx, lx - 18, baseY, baseY - vPx, `高 ${st.vLen}`, C.alert);
      }
    }
  }

  function drawRulerTick(ctx, x1, y1, x2, y2, text, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.moveTo(x1, y1 - 4);
    ctx.lineTo(x1, y1 + 4);
    ctx.moveTo(x2, y2 - 4);
    ctx.lineTo(x2, y2 + 4);
    ctx.stroke();
    ctx.font = '600 11px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(text, (x1 + x2) / 2, y1 + 4);
  }

  function drawVertTick(ctx, x, yBot, yTop, text, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, yBot);
    ctx.lineTo(x, yTop);
    ctx.moveTo(x - 4, yBot);
    ctx.lineTo(x + 4, yBot);
    ctx.moveTo(x - 4, yTop);
    ctx.lineTo(x + 4, yTop);
    ctx.stroke();
    ctx.font = '600 11px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(text, x, Math.min(yTop, yBot) - 4);
  }

  function sync() {
    const mode = FICK_MODES[st.mode];
    modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.fickMode === st.mode)));
    hintEl.textContent = mode.hint;
    slider.value = String(st.vLen);
    if (st.revealed) {
      valEl.textContent = `竖线 ${st.vLen} vs 横线 ${H_LEN}`;
      const ev = evaluateFick(st.vLen, H_LEN);
      resultEl.textContent = ev.verdict;
      resultEl.dataset.state = "revealed";
    } else {
      valEl.textContent = "盲测中（先凭眼力调）";
      resultEl.textContent = "拖动滑杆把墨绿竖线调到「看起来与炭墨横线等长」，再点「亮出标尺核验」。";
      resultEl.dataset.state = "blind";
    }
    draw();
  }

  modeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      st.mode = b.dataset.fickMode;
      st.vLen = st.mode === "invT" ? 148 : st.mode === "Lshape" ? 156 : 162;
      st.revealed = false;
      sync();
    });
  });
  slider.addEventListener("input", () => {
    st.vLen = Number(slider.value);
    sync();
  });
  checkBtn.addEventListener("click", () => {
    st.revealed = true;
    sync();
  });
  resetBtn.addEventListener("click", () => {
    st.vLen = 148;
    st.revealed = false;
    sync();
  });

  sync();
  return { draw };
}

// ==================== 02 节：视觉重力翻转实验（底稳 + 顶白 + 收分 + 明暗） ====================
export function initSection2() {
  const canvas = document.getElementById("s2-canvas");
  const tierEl = document.getElementById("s2-tier");
  const msgEl = document.getElementById("s2-msg");
  const toggleBtns = [...document.querySelectorAll("[data-grav-key]")];
  const presetUpBtn = document.getElementById("s2-preset-up");
  const presetDownBtn = document.getElementById("s2-preset-down");

  // 默认先停在「全关下坠态」或「半失衡态」，让读者切开关看它翻转升起
  const flags = {
    baseAnchored: false,
    topBreathing: false,
    taperUp: false,
    lightTop: false,
  };

  function draw() {
    const g = setupCanvas(canvas);
    if (!g) return;
    const { ctx, w, h } = g;

    const ev = evaluateGravity(flags);

    // 画框背景
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, w, h);

    // 淡竖向暗格
    ctx.strokeStyle = "rgba(16, 55, 46, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const gx = (w * i) / 6;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }

    const padX = w * 0.14;
    const innerW = w - padX * 2;
    const topY = flags.topBreathing ? h * 0.21 : 0;
    const botY = flags.baseAnchored ? h * 0.85 : h * 0.77;
    const colH = botY - topY;

    // 5 根垂直主柱
    const specs = [
      { x: 0.12, wBot: 0.12, hFrac: 0.68 },
      { x: 0.30, wBot: 0.14, hFrac: 0.84 },
      { x: 0.50, wBot: 0.19, hFrac: 1.00 },
      { x: 0.70, wBot: 0.14, hFrac: 0.80 },
      { x: 0.88, wBot: 0.12, hFrac: 0.64 },
    ];

    for (const s of specs) {
      const cx = padX + s.x * innerW;
      const bw = s.wBot * innerW;
      // taperUp: 底宽顶窄；反过来则是上宽下窄倒悬
      const wTop = flags.taperUp ? bw * 0.64 : bw * 1.24;
      const wBot = flags.taperUp ? bw * 1.14 : bw * 0.60;
      const yTop = flags.topBreathing
        ? botY - colH * s.hFrac
        : topY; // 顶死上框沿，所有柱子头顶贴死天花板
      const yBot = flags.baseAnchored
        ? botY
        : botY - (1 - s.hFrac) * colH * 0.32;

      const grad = ctx.createLinearGradient(0, yBot, 0, yTop);
      if (flags.lightTop) {
        // 下深上明，视线往上走
        grad.addColorStop(0, C.deepGreen);
        grad.addColorStop(0.55, C.midGreen);
        grad.addColorStop(1, "#A8BAAC");
      } else {
        // 上暗下浅，视觉重量死压顶部往下坠
        grad.addColorStop(0, "#CFC3AE");
        grad.addColorStop(0.5, "#3E544C");
        grad.addColorStop(1, "#121B16");
      }

      ctx.beginPath();
      ctx.moveTo(cx - wBot / 2, yBot);
      ctx.lineTo(cx + wBot / 2, yBot);
      ctx.lineTo(cx + wTop / 2, yTop);
      ctx.lineTo(cx - wTop / 2, yTop);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // 底部厚稳基台 vs 悬空虚线
    if (flags.baseAnchored) {
      ctx.fillStyle = C.deepGreen;
      ctx.fillRect(0, botY, w, h - botY);
      ctx.fillStyle = C.gold;
      ctx.fillRect(w * 0.36, botY, w * 0.28, 3);
    } else {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = C.alert;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(padX * 0.6, h * 0.88);
      ctx.lineTo(w - padX * 0.6, h * 0.88);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = C.alert;
      ctx.font = '600 11px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("底脚悬空 · 缺少承托基座", w / 2, h - 10);
    }

    // 顶部空间标注
    if (flags.topBreathing) {
      ctx.fillStyle = C.gold;
      ctx.beginPath();
      ctx.arc(w * 0.78, h * 0.11, Math.min(w, h) * 0.045, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(178, 58, 39, 0.88)";
      ctx.fillRect(0, 0, w, 5);
    }

    // 右侧大视觉矢量箭头（直接画出视线的上升/下坠/拉扯方向）
    const ax = w - Math.max(24, padX * 0.48);
    const aMid = h * 0.50;
    const aSpan = h * 0.24;
    ctx.strokeStyle = ev.dir === "up" ? C.goldDark : ev.dir === "down" ? C.alert : C.charcoal;
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(ax, aMid + aSpan);
    ctx.lineTo(ax, aMid - aSpan);
    ctx.stroke();

    if (ev.dir === "up") {
      drawArrowHead(ctx, ax, aMid - aSpan - 2, -1);
    } else if (ev.dir === "down") {
      drawArrowHead(ctx, ax, aMid + aSpan + 2, 1);
    } else {
      drawArrowHead(ctx, ax, aMid - aSpan - 2, -1);
      drawArrowHead(ctx, ax, aMid + aSpan + 2, 1);
    }

    // 外框
    ctx.strokeStyle = "rgba(16, 55, 46, 0.24)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }

  function drawArrowHead(ctx, x, y, dirY) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 6, y - dirY * 10);
    ctx.lineTo(x + 6, y - dirY * 10);
    ctx.closePath();
    ctx.fill();
  }

  function sync() {
    const ev = evaluateGravity(flags);
    toggleBtns.forEach((btn) => {
      const k = btn.dataset.gravKey;
      const on = flags[k];
      btn.setAttribute("aria-pressed", String(on));
      const stateSpan = btn.querySelector(".sw-state");
      if (stateSpan) stateSpan.textContent = on ? btn.dataset.onText : btn.dataset.offText;
    });
    tierEl.textContent = ev.tier;
    tierEl.dataset.dir = ev.dir;
    msgEl.textContent = ev.msg;
    draw();
  }

  toggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.gravKey;
      flags[k] = !flags[k];
      sync();
    });
  });
  presetUpBtn.addEventListener("click", () => {
    flags.baseAnchored = true;
    flags.topBreathing = true;
    flags.taperUp = true;
    flags.lightTop = true;
    sync();
  });
  presetDownBtn.addEventListener("click", () => {
    flags.baseAnchored = false;
    flags.topBreathing = false;
    flags.taperUp = false;
    flags.lightTop = false;
    sync();
  });

  sync();
  return { draw };
}

// ==================== 03 节：7 柱点按垂直节奏编排器（深松绿底） ====================
export function initSection3() {
  const board = document.getElementById("s3-board");
  const waveSvg = document.getElementById("s3-wave");
  const levelEl = document.getElementById("s3-level");
  const noteEl = document.getElementById("s3-note");
  const modeBtns = [...document.querySelectorAll("[data-s3-tool]")];
  const presetBtns = [...document.querySelectorAll("[data-s3-preset]")];

  // 开场先放死板铁栅栏，让用户动手点出退台与节拍
  let cols = RHYTHM_PRESETS.fence.cols.map((c) => ({ ...c }));
  let tool = "height"; // height | width | depth
  const DEPTH_NAMES = ["前景炭墨", "中景松绿", "远景暖石"];
  const WIDTH_NAMES = ["细线", "中柱", "宽柱"];

  function renderBoard() {
    board.innerHTML = "";
    cols.forEach((col, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `r-col r-w${col.w} r-d${col.d}`;
      btn.style.setProperty("--h-pct", `${26 + col.h * 14}%`);
      btn.setAttribute("aria-label", `第 ${i + 1} 柱：高 ${col.h} 级、${WIDTH_NAMES[col.w - 1]}、${DEPTH_NAMES[col.d]}，点击调整`);
      btn.innerHTML = `
        <span class="r-bar" aria-hidden="true">
          <span class="r-gold-seam"></span>
        </span>
        <span class="r-meta">0${i + 1}</span>
      `;
      btn.addEventListener("click", () => {
        if (tool === "height") col.h = (col.h % 5) + 1;
        else if (tool === "width") col.w = (col.w % 3) + 1;
        else col.d = (col.d + 1) % 3;
        sync();
      });
      board.appendChild(btn);
    });
  }

  function renderWave() {
    const W = 280;
    const H = 64;
    const pts = cols.map((c, i) => {
      const x = 18 + (i / (cols.length - 1)) * (W - 36);
      const y = H - 10 - ((c.h - 1) / 4) * (H - 22);
      return { x, y, w: c.w };
    });
    const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const dots = pts
      .map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${2.5 + p.w * 1.1}" fill="#E6B85C" />`)
      .join("");
    waveSvg.innerHTML = `
      <line x1="12" y1="${H - 10}" x2="${W - 12}" y2="${H - 10}" stroke="rgba(245,236,223,0.22)" stroke-width="1" />
      <path d="${pathD}" fill="none" stroke="#E6B85C" stroke-width="2" />
      ${dots}
    `;
  }

  function sync() {
    modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s3Tool === tool)));
    renderBoard();
    renderWave();
    const ev = evaluateBeat(cols);
    levelEl.textContent = ev.level;
    levelEl.dataset.ok = String(ev.ok);
    noteEl.textContent = ev.note;
  }

  modeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      tool = b.dataset.s3Tool;
      sync();
    });
  });
  presetBtns.forEach((b) => {
    b.addEventListener("click", () => {
      const p = RHYTHM_PRESETS[b.dataset.s3Preset];
      if (!p) return;
      cols = p.cols.map((c) => ({ ...c }));
      sync();
    });
  });

  sync();
}

// ==================== 04 节：大画幅前组升移光路剖面 + 取景双窗 ====================
export function initSection4() {
  const opticsCanvas = document.getElementById("s4-optics");
  const viewCanvas = document.getElementById("s4-view");
  const titleEl = document.getElementById("s4-title");
  const descEl = document.getElementById("s4-desc");
  const modeBtns = [...document.querySelectorAll("[data-s4-mode]")];

  const MODES = {
    levelCrop: {
      title: "① 机背铅直 · 未移轴（楼顶被切）",
      desc: "相机水平直视，感光元件与建筑墙面严格平行，所以竖线绝对笔直；可惜标准镜头视野上下对称，下半幅拍进大片空地，大楼上半截直接冲出画框被截断。",
      tiltDeg: 0,
      shiftY: 0,
    },
    tiltUp: {
      title: "② 抬头仰拍 +18°（梯形内倾）",
      desc: "普通相机为了把塔尖收进框内只能抬头仰拍。此时楼顶距离镜头远于楼底，透视投影让平行竖线向天顶汇聚，高楼像向后倒塌的梯形，庄重秩序瞬间瓦解。",
      tiltDeg: 18,
      shiftY: 0,
    },
    risingFront: {
      title: "③ 大画幅前组升移 Rising Front（直立且完整）",
      desc: "保持机背 0° 绝对垂直不动，只在更大成像圈内把镜头前组向上平移：光轴扫过楼顶与天空，既收进完整塔尖与顶部留白，又保住 90° 笔直平行竖线。",
      tiltDeg: 0,
      shiftY: 1,
    },
  };

  let cur = "tiltUp"; // 开场先展示最常犯的仰拍梯形畸变

  function drawOptics() {
    const g = setupCanvas(opticsCanvas);
    if (!g) return;
    const { ctx, w, h } = g;
    const m = MODES[cur];

    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, w, h);

    const groundY = h * 0.84;
    // 地面线
    ctx.strokeStyle = C.deepGreen;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(16, groundY);
    ctx.lineTo(w - 16, groundY);
    ctx.stroke();

    // 右侧高楼侧剖面
    const bX = w * 0.78;
    const bW = Math.max(36, w * 0.13);
    const bTop = h * 0.14;
    ctx.fillStyle = C.pine;
    ctx.fillRect(bX, bTop, bW, groundY - bTop);
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bX + bW / 2, bTop + 8);
    ctx.lineTo(bX + bW / 2, groundY - 8);
    ctx.stroke();

    // 左侧相机位置（机背 + 镜头 + 光线锥）
    const camX = w * 0.22;
    const camY = groundY - (groundY - bTop) * 0.26;
    const rad = (-m.tiltDeg * Math.PI) / 180;
    const shiftPx = m.shiftY * (h * 0.11);

    // 成像圈示意（移轴时显示大像圈）
    if (m.shiftY > 0) {
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = C.goldDark;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(camX - 18, camY - shiftPx * 0.5, h * 0.22, -Math.PI * 0.65, Math.PI * 0.65);
      ctx.stroke();
      ctx.restore();
    }

    // 视野两条边界光线
    const lensX = camX + 20 * Math.cos(rad);
    const lensY = camY + 20 * Math.sin(rad) - shiftPx;

    let rayTopY, rayBotY;
    if (cur === "levelCrop") {
      rayTopY = bTop + (groundY - bTop) * 0.36;
      rayBotY = groundY + (h - groundY) * 0.72;
    } else if (cur === "tiltUp") {
      rayTopY = bTop - 12;
      rayBotY = groundY + 6;
    } else {
      rayTopY = bTop - 14;
      rayBotY = groundY + 4;
    }

    ctx.fillStyle = cur === "tiltUp" ? "rgba(178, 58, 39, 0.13)" : "rgba(211, 153, 57, 0.16)";
    ctx.beginPath();
    ctx.moveTo(lensX, lensY);
    ctx.lineTo(bX, rayTopY);
    ctx.lineTo(bX, rayBotY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = cur === "tiltUp" ? C.alert : C.goldDark;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(lensX, lensY);
    ctx.lineTo(bX, rayTopY);
    ctx.moveTo(lensX, lensY);
    ctx.lineTo(bX, rayBotY);
    ctx.stroke();

    // 画相机机背（焦平面）与前组镜头
    ctx.save();
    ctx.translate(camX, camY);
    ctx.rotate(rad);
    // 机背线（垂直于光轴的焦平面）
    ctx.strokeStyle = cur === "tiltUp" ? C.alert : C.deepGreen;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-14, -22);
    ctx.lineTo(-14, 22);
    ctx.stroke();
    // 皮腔连接
    ctx.strokeStyle = C.charcoal;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-12, -16);
    ctx.lineTo(18, -11 - shiftPx);
    ctx.lineTo(18, 11 - shiftPx);
    ctx.lineTo(-12, 16);
    ctx.stroke();
    // 镜头前组
    ctx.fillStyle = C.gold;
    ctx.fillRect(16, -13 - shiftPx, 7, 26);
    ctx.restore();

    // 标注文字
    ctx.font = '600 11px "Noto Sans SC", sans-serif';
    ctx.fillStyle = cur === "tiltUp" ? C.alert : C.deepGreen;
    ctx.textAlign = "left";
    ctx.fillText(cur === "tiltUp" ? "机背倾斜 +18°（不平行墙面）" : "机背 0° 铅直（与墙面平行）", 14, 22);

    ctx.fillStyle = C.deepGreen;
    ctx.textAlign = "right";
    ctx.fillText("建筑立面", w - 14, 22);

    if (m.shiftY > 0) {
      ctx.fillStyle = C.goldDark;
      ctx.textAlign = "left";
      ctx.fillText("↑ 镜头前组上移", 14, 40);
    }

    ctx.strokeStyle = "rgba(16, 55, 46, 0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }

  function drawView() {
    const g = setupCanvas(viewCanvas);
    if (!g) return;
    const { ctx, w, h } = g;

    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, w, h);

    // 居中绘 3:4 取景小窗
    const fh = h - 24;
    const fw = Math.min(w - 24, fh * 0.76);
    const fx = (w - fw) / 2;
    const fy = (h - fh) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(fx, fy, fw, fh);
    ctx.clip();

    ctx.fillStyle = "#F7EFE2";
    ctx.fillRect(fx, fy, fw, fh);

    // 右上小金日
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    ctx.arc(fx + fw * 0.78, fy + fh * 0.14, Math.min(fw, fh) * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // 建筑轮廓按三种机位真实呈现
    const mid = fx + fw / 2;
    if (cur === "levelCrop") {
      // 竖线笔直，但楼顶冲出画框上沿，底部露出太多空地
      const bW = fw * 0.54;
      const baseY = fy + fh * 0.66;
      ctx.fillStyle = C.pine;
      ctx.fillRect(mid - bW / 2, fy - 20, bW, baseY - (fy - 20));
      ctx.fillStyle = C.charcoal;
      ctx.fillRect(mid - bW * 0.72, fy + fh * 0.05, bW * 0.22, baseY - (fy + fh * 0.05));
      ctx.fillRect(mid + bW * 0.5, fy + fh * 0.05, bW * 0.22, baseY - (fy + fh * 0.05));
      // 顶部被削红条
      ctx.fillStyle = C.alert;
      ctx.fillRect(fx, fy, fw, 5);
      // 底部空地
      ctx.fillStyle = C.sand;
      ctx.fillRect(fx, baseY, fw, fy + fh - baseY);
    } else if (cur === "tiltUp") {
      // 梯形向内汇聚
      const baseY = fy + fh * 0.90;
      const topY = fy + fh * 0.16;
      ctx.beginPath();
      ctx.moveTo(mid - fw * 0.34, baseY);
      ctx.lineTo(mid + fw * 0.34, baseY);
      ctx.lineTo(mid + fw * 0.16, topY);
      ctx.lineTo(mid - fw * 0.16, topY);
      ctx.closePath();
      ctx.fillStyle = C.pine;
      ctx.fill();

      // 汇聚红虚线直指灭点
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = C.alert;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mid - fw * 0.34, baseY);
      ctx.lineTo(mid - fw * 0.09, fy);
      ctx.moveTo(mid + fw * 0.34, baseY);
      ctx.lineTo(mid + fw * 0.09, fy);
      ctx.stroke();
      ctx.restore();
    } else {
      // 移轴校正：严格 90° 垂直、退台完整、顶白约 18%、稳基扎底
      const baseY = fy + fh * 0.88;
      const topY = fy + fh * 0.17;
      ctx.fillStyle = C.sand;
      ctx.fillRect(mid - fw * 0.34, fy + fh * 0.34, fw * 0.68, baseY - (fy + fh * 0.34));
      ctx.fillStyle = C.charcoal;
      ctx.fillRect(mid - fw * 0.25, fy + fh * 0.26, fw * 0.50, baseY - (fy + fh * 0.26));
      ctx.fillStyle = C.pine;
      ctx.fillRect(mid - fw * 0.15, topY, fw * 0.30, baseY - topY);
      // 中央细金线
      ctx.strokeStyle = C.goldBright;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(mid, topY + 6);
      ctx.lineTo(mid, baseY - 12);
      ctx.stroke();
      // 底部厚基座
      ctx.fillStyle = C.deepGreen;
      ctx.fillRect(fx, baseY, fw, fy + fh - baseY);
      // 两侧平行金虚线证明绝对垂直
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = C.goldDark;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(mid - fw * 0.15, fy + 6);
      ctx.lineTo(mid - fw * 0.15, baseY);
      ctx.moveTo(mid + fw * 0.15, fy + 6);
      ctx.lineTo(mid + fw * 0.15, baseY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
    ctx.strokeStyle = cur === "risingFront" ? C.gold : C.deepGreen;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(fx + 0.5, fy + 0.5, fw, fh);
  }

  function sync() {
    const m = MODES[cur];
    modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s4Mode === cur)));
    titleEl.textContent = m.title;
    descEl.textContent = m.desc;
    drawOptics();
    drawView();
  }

  modeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      cur = b.dataset.s4Mode;
      sync();
    });
  });

  sync();
  return { draw: () => { drawOptics(); drawView(); } };
}

// ==================== 05 节：四年代纪念碑历史档案 ====================
export function initSection5() {
  const tabs = [...document.querySelectorAll("[data-hist-id]")];
  const svg = document.getElementById("s5-svg");
  const yearEl = document.getElementById("s5-year");
  const titleEl = document.getElementById("s5-title");
  const whoEl = document.getElementById("s5-who");
  const workEl = document.getElementById("s5-work");
  const bodyEl = document.getElementById("s5-body");

  let curId = HISTORY_ITEMS[1].id; // 默认停在 1896 路易·沙利文三段式摩天楼

  function renderDiagram(kind) {
    if (kind === "fick") {
      return `
        <rect x="0" y="0" width="260" height="190" fill="#F5ECDF"/>
        <line x1="40" y1="152" x2="220" y2="152" stroke="#1B241E" stroke-width="5"/>
        <line x1="130" y1="152" x2="130" y2="34" stroke="#1E4D41" stroke-width="5"/>
        <line x1="40" y1="34" x2="220" y2="34" stroke="#875B12" stroke-width="1.2" stroke-dasharray="4 4"/>
        <text x="130" y="174" text-anchor="middle" fill="#1B241E" font-size="11" font-weight="600">横线 = L（1851 菲克等长错觉）</text>
        <text x="142" y="96" fill="#1E4D41" font-size="11" font-weight="600">竖线 = L（目测更长）</text>
      `;
    }
    if (kind === "sullivan") {
      return `
        <rect x="0" y="0" width="260" height="190" fill="#F5ECDF"/>
        <!-- 三段式摩天楼剖面 -->
        <rect x="74" y="146" width="112" height="32" fill="#10372E"/>
        <rect x="82" y="48" width="96" height="98" fill="#1E4D41"/>
        <rect x="78" y="34" width="104" height="14" fill="#D39939"/>
        <!-- 连续竖向窗间墙 -->
        <g stroke="#F5ECDF" stroke-width="2">
          <line x1="98" y1="52" x2="98" y2="144"/>
          <line x1="114" y1="52" x2="114" y2="144"/>
          <line x1="130" y1="52" x2="130" y2="144"/>
          <line x1="146" y1="52" x2="146" y2="144"/>
          <line x1="162" y1="52" x2="162" y2="144"/>
        </g>
        <text x="196" y="45" fill="#875B12" font-size="11" font-weight="600">顶冠</text>
        <text x="196" y="102" fill="#10372E" font-size="11" font-weight="600">竖向标准层</text>
        <text x="196" y="166" fill="#10372E" font-size="11" font-weight="600">稳固底座</text>
      `;
    }
    if (kind === "kandinsky") {
      return `
        <rect x="0" y="0" width="260" height="190" fill="#F5ECDF"/>
        <rect x="30" y="20" width="200" height="150" fill="none" stroke="#10372E" stroke-width="1.5"/>
        <!-- 冷水平 vs 暖垂直 -->
        <line x1="48" y1="138" x2="212" y2="138" stroke="#1B241E" stroke-width="4"/>
        <line x1="130" y1="158" x2="130" y2="34" stroke="#D39939" stroke-width="4"/>
        <polygon points="130,26 124,38 136,38" fill="#D39939"/>
        <text x="142" y="54" fill="#875B12" font-size="11" font-weight="600">垂直 · 暖 / 向上无依</text>
        <text x="130" y="156" text-anchor="middle" fill="#1B241E" font-size="11" font-weight="600">水平 · 冷 / 贴地休止</text>
      `;
    }
    // seagram
    return `
      <rect x="0" y="0" width="260" height="190" fill="#F5ECDF"/>
      <!-- 退让广场与台基 -->
      <rect x="20" y="154" width="220" height="22" fill="#CFC2AD"/>
      <rect x="28" y="160" width="52" height="8" fill="#2B6455"/>
      <rect x="180" y="160" width="52" height="8" fill="#2B6455"/>
      <!-- 38 层铜肋矩形塔楼 -->
      <rect x="86" y="24" width="88" height="130" fill="#1B241E"/>
      <g stroke="#D39939" stroke-width="1.4">
        <line x1="94" y1="24" x2="94" y2="154"/>
        <line x1="106" y1="24" x2="106" y2="154"/>
        <line x1="118" y1="24" x2="118" y2="154"/>
        <line x1="130" y1="24" x2="130" y2="154"/>
        <line x1="142" y1="24" x2="142" y2="154"/>
        <line x1="154" y1="24" x2="154" y2="154"/>
        <line x1="166" y1="24" x2="166" y2="154"/>
      </g>
      <text x="130" y="186" text-anchor="middle" fill="#10372E" font-size="11" font-weight="600">退让花岗岩广场 + 青铜竖向工字肋（1958）</text>
    `;
  }

  function sync() {
    const item = HISTORY_ITEMS.find((x) => x.id === curId) || HISTORY_ITEMS[0];
    tabs.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.histId === item.id)));
    yearEl.textContent = item.year;
    titleEl.textContent = item.title;
    whoEl.textContent = item.who;
    workEl.textContent = item.work;
    bodyEl.textContent = item.body;
    svg.innerHTML = renderDiagram(item.diagram);
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      curId = t.dataset.histId;
      sync();
    });
  });

  sync();
}

// ==================== 06 节：什么时候用 / 什么时候别用对照诊所 ====================
export function initSection6() {
  const tabs = [...document.querySelectorAll("[data-u-id]")];
  const verdictEl = document.getElementById("s6-verdict");
  const badTitleEl = document.getElementById("s6-bad-title");
  const badDescEl = document.getElementById("s6-bad-desc");
  const badSvg = document.getElementById("s6-bad-svg");
  const goodTitleEl = document.getElementById("s6-good-title");
  const goodDescEl = document.getElementById("s6-good-desc");
  const goodSvg = document.getElementById("s6-good-svg");
  const linkEl = document.getElementById("s6-link");

  let curId = USAGE_CASES[1].id; // 默认看「宽银幕草原远景」反面例子，让人警醒

  function drawSceneSvg(id, isGood) {
    if (id === "museum") {
      if (!isGood) {
        return `<rect width="220" height="140" fill="#F5ECDF"/>
          <rect x="65" y="10" width="90" height="120" fill="#EAE0CF" stroke="#B23A27" stroke-width="1.5"/>
          <rect x="72" y="34" width="76" height="16" fill="#1E4D41"/>
          <rect x="72" y="60" width="76" height="16" fill="#1B241E"/>
          <rect x="72" y="86" width="76" height="16" fill="#CFC2AD"/>`;
      }
      return `<rect width="220" height="140" fill="#F5ECDF"/>
        <rect x="65" y="10" width="90" height="120" fill="#F7EFE2" stroke="#10372E" stroke-width="1.5"/>
        <circle cx="136" cy="28" r="7" fill="#D39939"/>
        <rect x="86" y="48" width="12" height="62" fill="#1B241E"/>
        <rect x="102" y="26" width="18" height="84" fill="#1E4D41"/>
        <line x1="111" y1="30" x2="111" y2="108" stroke="#E6B85C" stroke-width="1.2"/>
        <rect x="124" y="44" width="12" height="66" fill="#CFC2AD"/>
        <rect x="65" y="110" width="90" height="20" fill="#10372E"/>`;
    }
    if (id === "prairie") {
      if (!isGood) {
        return `<rect width="220" height="140" fill="#F5ECDF"/>
          <rect x="12" y="26" width="196" height="88" fill="#EAE0CF"/>
          <rect x="12" y="72" width="196" height="42" fill="#2B6455"/>
          <g fill="#10372E"><rect x="44" y="26" width="10" height="88"/><rect x="88" y="26" width="10" height="88"/><rect x="132" y="26" width="10" height="88"/><rect x="176" y="26" width="10" height="88"/></g>`;
      }
      return `<rect width="220" height="140" fill="#F5ECDF"/>
        <rect x="12" y="26" width="196" height="88" fill="#F5ECDF" stroke="#10372E" stroke-width="1.5"/>
        <rect x="12" y="78" width="196" height="36" fill="#2B6455"/>
        <line x1="12" y1="78" x2="208" y2="78" stroke="#F5ECDF" stroke-width="2"/>
        <circle cx="168" cy="52" r="10" fill="#D39939"/>`;
    }
    if (id === "sprint") {
      if (!isGood) {
        return `<rect width="220" height="140" fill="#F5ECDF"/>
          <g fill="#1E4D41"><rect x="34" y="16" width="14" height="108"/><rect x="74" y="16" width="14" height="108"/><rect x="114" y="16" width="14" height="108"/><rect x="154" y="16" width="14" height="108"/></g>
          <circle cx="101" cy="70" r="16" fill="#B23A27"/>`;
      }
      return `<rect width="220" height="140" fill="#F5ECDF"/>
        <polygon points="24,116 196,24 206,38 34,130" fill="#1E4D41"/>
        <polygon points="18,92 162,18 168,26 24,100" fill="#D39939"/>
        <circle cx="152" cy="54" r="14" fill="#10372E"/>`;
    }
    // narrowText
    if (!isGood) {
      let cols = "";
      for (let i = 0; i < 6; i++) {
        const x = 18 + i * 31;
        cols += `<rect x="${x}" y="18" width="23" height="104" fill="#EAE0CF" stroke="#B23A27" stroke-width="1"/>`;
        for (let r = 0; r < 9; r++) {
          cols += `<line x1="${x + 4}" y1="${28 + r * 10}" x2="${x + 19}" y2="${28 + r * 10}" stroke="#1B241E" stroke-width="2"/>`;
        }
      }
      return `<rect width="220" height="140" fill="#F5ECDF"/>${cols}`;
    }
    let lines = "";
    for (let r = 0; r < 7; r++) {
      lines += `<line x1="68" y1="${34 + r * 13}" x2="${r === 6 ? 156 : 196}" y2="${34 + r * 13}" stroke="#1B241E" stroke-width="3"/>`;
    }
    return `<rect width="220" height="140" fill="#F5ECDF"/>
      <rect x="20" y="18" width="28" height="104" fill="#10372E"/>
      <line x1="34" y1="26" x2="34" y2="114" stroke="#E6B85C" stroke-width="1.5"/>
      <rect x="56" y="18" width="148" height="104" fill="#F7EFE2"/>
      ${lines}`;
  }

  function sync() {
    const item = USAGE_CASES.find((x) => x.id === curId) || USAGE_CASES[0];
    tabs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.uId === item.id)));
    verdictEl.textContent = item.verdict;
    verdictEl.dataset.good = String(item.good);
    badTitleEl.textContent = item.badTitle;
    badDescEl.textContent = item.badNote;
    badSvg.innerHTML = drawSceneSvg(item.id, false);
    goodTitleEl.textContent = item.goodTitle;
    goodDescEl.textContent = item.goodNote;
    goodSvg.innerHTML = drawSceneSvg(item.id, true);
    linkEl.innerHTML = item.linkHtml;
  }

  tabs.forEach((b) => {
    b.addEventListener("click", () => {
      curId = b.dataset.uId;
      sync();
    });
  });

  sync();
}

// ==================== 07 节：双题单变量小练习（标签完全中性 A/B/C/D） ====================
export function initSection7() {
  const qBtns = [...document.querySelectorAll("[data-q-id]")];
  const promptEl = document.getElementById("s7-prompt");
  const gridEl = document.getElementById("s7-grid");
  const resultEl = document.getElementById("s7-result");
  const retryBtn = document.getElementById("s7-retry");

  const st = { qid: "q1", picked: { q1: null, q2: null } };

  function renderOptionSvg(mode, showGuide) {
    const W = 180;
    const H = 240;
    let body = "";

    // 第 1 题：管风琴音乐厅竖幅海报（配色、底栏文案块一致，只差一个垂直结构变量）
    if (["fence", "tilted", "ideal", "cramped"].includes(mode)) {
      const baseTop = mode === "cramped" ? 196 : 186;
      const sun = `<circle cx="144" cy="34" r="10" fill="#D39939"/>`;
      const base = `
        <rect x="0" y="188" width="${W}" height="52" fill="#10372E"/>
        <rect x="26" y="204" width="128" height="7" fill="#F5ECDF"/>
        <rect x="46" y="218" width="88" height="4" fill="#D4AD6A"/>
      `;

      if (mode === "fence") {
        // 等宽等高平顶铁栅栏（同配中柱细金线，绝不靠装饰剧透答案）
        let pipes = "";
        for (let i = 0; i < 7; i++) {
          const x = 22 + i * 20;
          pipes += `<rect x="${x}" y="52" width="14" height="${baseTop - 52}" fill="${i % 2 === 0 ? "#1E4D41" : "#1B241E"}"/>`;
          if (i === 3) {
            pipes += `<line x1="${x + 7}" y1="58" x2="${x + 7}" y2="${baseTop - 8}" stroke="#E6B85C" stroke-width="1.6"/>`;
          }
        }
        body = `${sun}${pipes}${base}`;
        if (showGuide) {
          body += `<line x1="16" y1="52" x2="164" y2="52" stroke="#B23A27" stroke-width="1.8" stroke-dasharray="4 3"/>`;
        }
      } else if (mode === "tilted") {
        // 退台音管但整体向内倾斜 11°（同配中柱细金线）
        const pipes = [
          { x: 24, w: 14, top: 96, c: "#CFC2AD" },
          { x: 42, w: 16, top: 76, c: "#1B241E" },
          { x: 62, w: 16, top: 58, c: "#25584B" },
          { x: 82, w: 20, top: 40, c: "#1E4D41", gold: true },
          { x: 106, w: 16, top: 62, c: "#1B241E" },
          { x: 126, w: 16, top: 82, c: "#CFC2AD" },
          { x: 146, w: 12, top: 102, c: "#25584B" },
        ];
        const polys = pipes.map((p) => {
          const mid = 90;
          const shiftL = (mid - p.x) * 0.24;
          const shiftR = (mid - (p.x + p.w)) * 0.24;
          const goldEl = p.gold
            ? `<line x1="${p.x + p.w / 2}" y1="${baseTop - 8}" x2="${(p.x + p.w / 2 + (shiftL + shiftR) / 2).toFixed(1)}" y2="${p.top + 6}" stroke="#E6B85C" stroke-width="1.6"/>`
            : "";
          return `<polygon points="${p.x},${baseTop} ${p.x + p.w},${baseTop} ${(p.x + p.w + shiftR).toFixed(1)},${p.top} ${(p.x + shiftL).toFixed(1)},${p.top}" fill="${p.c}"/>${goldEl}`;
        }).join("");
        body = `${sun}${polys}${base}`;
        if (showGuide) {
          body += `<line x1="24" y1="186" x2="24" y2="24" stroke="#875B12" stroke-width="1.2" stroke-dasharray="4 3"/>
                   <line x1="24" y1="186" x2="40" y2="96" stroke="#B23A27" stroke-width="2"/>`;
        }
      } else if (mode === "ideal") {
        // 铅直 + 退台主峰 + 稳基 + 18% 顶白
        const pipes = [
          { x: 24, w: 13, top: 104, c: "#CFC2AD" },
          { x: 41, w: 15, top: 82, c: "#1B241E" },
          { x: 60, w: 15, top: 62, c: "#25584B" },
          { x: 79, w: 22, top: 42, c: "#1E4D41", gold: true },
          { x: 105, w: 15, top: 66, c: "#1B241E" },
          { x: 124, w: 15, top: 86, c: "#CFC2AD" },
          { x: 143, w: 13, top: 108, c: "#25584B" },
        ];
        const rects = pipes.map((p) =>
          `<rect x="${p.x}" y="${p.top}" width="${p.w}" height="${baseTop - p.top}" fill="${p.c}"/>` +
          (p.gold ? `<line x1="${p.x + p.w / 2}" y1="${p.top + 6}" x2="${p.x + p.w / 2}" y2="${baseTop - 8}" stroke="#E6B85C" stroke-width="1.6"/>` : "")
        ).join("");
        body = `${sun}${rects}${base}`;
        if (showGuide) {
          body += `<line x1="79" y1="186" x2="79" y2="12" stroke="#D39939" stroke-width="1.5" stroke-dasharray="4 3"/>
                   <line x1="164" y1="4" x2="164" y2="42" stroke="#1E4D41" stroke-width="1.8"/>`;
        }
      } else {
        // cramped：顶死上框（top=0）且管脚悬空离开底座（同配中柱细金线）
        const pipes = [
          { x: 24, w: 13, top: 46, c: "#CFC2AD" },
          { x: 41, w: 15, top: 28, c: "#1B241E" },
          { x: 60, w: 15, top: 14, c: "#25584B" },
          { x: 79, w: 22, top: 0, c: "#1E4D41", gold: true },
          { x: 105, w: 15, top: 18, c: "#1B241E" },
          { x: 124, w: 15, top: 34, c: "#CFC2AD" },
          { x: 143, w: 13, top: 52, c: "#25584B" },
        ];
        const footY = 160; // 悬空 28px 离开底座
        const rects = pipes.map((p) =>
          `<rect x="${p.x}" y="${p.top}" width="${p.w}" height="${footY - p.top}" fill="${p.c}"/>` +
          (p.gold ? `<line x1="${p.x + p.w / 2}" y1="${p.top + 6}" x2="${p.x + p.w / 2}" y2="${footY - 8}" stroke="#E6B85C" stroke-width="1.6"/>` : "")
        ).join("");
        body = `${sun}${rects}${base}`;
        if (showGuide) {
          body += `<rect x="0" y="0" width="${W}" height="5" fill="#B23A27"/>
                   <line x1="20" y1="174" x2="160" y2="174" stroke="#B23A27" stroke-width="1.6" stroke-dasharray="4 3"/>`;
        }
      }
    } else {
      // 第 2 题：城市建筑年鉴封面（5 根严格铅直立柱，只差重心/横截/留白）
      const masthead = `<rect x="24" y="210" width="96" height="6" fill="#F5ECDF"/><rect x="24" y="221" width="60" height="4" fill="#D4AD6A"/>`;
      if (mode === "topHeavy") {
        // 上重下轻倒悬（同配细金线，绝不剧透）
        body = `
          <rect x="0" y="0" width="${W}" height="54" fill="#10372E"/>
          <rect x="34" y="54" width="20" height="94" fill="#1B241E"/>
          <rect x="64" y="54" width="24" height="114" fill="#1E4D41"/>
          <line x1="76" y1="58" x2="76" y2="162" stroke="#E6B85C" stroke-width="1.6"/>
          <rect x="98" y="54" width="18" height="102" fill="#25584B"/>
          <rect x="126" y="54" width="20" height="86" fill="#CFC2AD"/>
          <rect x="0" y="200" width="${W}" height="40" fill="#1B241E" fill-opacity="0.12"/>
          <rect x="24" y="210" width="96" height="6" fill="#10372E"/>
          <rect x="24" y="221" width="60" height="4" fill="#875B12"/>
        `;
        if (showGuide) body += `<path d="M90 62 L90 166 M84 156 L90 168 L96 156" stroke="#B23A27" stroke-width="2" fill="none"/>`;
      } else if (mode === "idealCover") {
        body = `
          <circle cx="144" cy="36" r="10" fill="#D39939"/>
          <rect x="28" y="102" width="18" height="88" fill="#CFC2AD"/>
          <rect x="52" y="76" width="22" height="114" fill="#1B241E"/>
          <rect x="78" y="46" width="26" height="144" fill="#1E4D41"/>
          <line x1="91" y1="52" x2="91" y2="184" stroke="#E6B85C" stroke-width="1.6"/>
          <rect x="108" y="72" width="20" height="118" fill="#25584B"/>
          <rect x="132" y="96" width="18" height="94" fill="#CFC2AD"/>
          <rect x="0" y="190" width="${W}" height="50" fill="#10372E"/>
          ${masthead}
        `;
        if (showGuide) body += `<path d="M91 174 L91 22 M85 32 L91 20 L97 32" stroke="#D39939" stroke-width="2" fill="none"/>`;
      } else if (mode === "crossBar") {
        // 中段粗横带拦腰截断竖线（同配细金线）
        body = `
          <circle cx="144" cy="36" r="10" fill="#D39939"/>
          <rect x="28" y="102" width="18" height="88" fill="#CFC2AD"/>
          <rect x="52" y="76" width="22" height="114" fill="#1B241E"/>
          <rect x="78" y="46" width="26" height="144" fill="#1E4D41"/>
          <line x1="91" y1="52" x2="91" y2="184" stroke="#E6B85C" stroke-width="1.6"/>
          <rect x="108" y="72" width="20" height="118" fill="#25584B"/>
          <rect x="132" y="96" width="18" height="94" fill="#CFC2AD"/>
          <rect x="0" y="106" width="${W}" height="32" fill="#10372E"/>
          <rect x="24" y="119" width="132" height="6" fill="#F5ECDF"/>
          <rect x="0" y="190" width="${W}" height="50" fill="#10372E"/>
          ${masthead}
        `;
        if (showGuide) body += `<rect x="0" y="106" width="${W}" height="32" fill="none" stroke="#B23A27" stroke-width="2.2"/>`;
      } else {
        // choppedTop：主塔顶破上框且底座脱离底缘（同配细金线）
        body = `
          <circle cx="144" cy="36" r="10" fill="#D39939"/>
          <rect x="28" y="52" width="18" height="106" fill="#CFC2AD"/>
          <rect x="52" y="24" width="22" height="134" fill="#1B241E"/>
          <rect x="78" y="0" width="26" height="158" fill="#1E4D41"/>
          <line x1="91" y1="6" x2="91" y2="152" stroke="#E6B85C" stroke-width="1.6"/>
          <rect x="108" y="22" width="20" height="136" fill="#25584B"/>
          <rect x="132" y="48" width="18" height="110" fill="#CFC2AD"/>
          <rect x="24" y="210" width="96" height="6" fill="#10372E"/>
          <rect x="24" y="221" width="60" height="4" fill="#875B12"/>
        `;
        if (showGuide) body += `<rect x="0" y="0" width="${W}" height="5" fill="#B23A27"/><line x1="18" y1="168" x2="162" y2="168" stroke="#B23A27" stroke-width="1.6" stroke-dasharray="4 3"/>`;
      }
    }

    return `<svg class="q-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <rect width="${W}" height="${H}" fill="#F5ECDF"/>
      ${body}
      <rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" fill="none" stroke="rgba(16,55,46,0.22)" stroke-width="1.5"/>
    </svg>`;
  }

  function render() {
    const q = QUIZZES[st.qid];
    const picked = st.picked[st.qid];
    qBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.qId === st.qid)));
    promptEl.textContent = q.prompt;
    retryBtn.hidden = !picked;

    gridEl.innerHTML = "";
    q.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "q-card";
      if (picked) {
        if (opt.key === q.correct) btn.classList.add("is-correct");
        else if (opt.key === picked) btn.classList.add("is-wrong");
        else btn.classList.add("is-dim");
      }
      btn.setAttribute("aria-pressed", String(picked === opt.key));
      btn.innerHTML = `
        <span class="q-head">
          <span class="q-tag">${opt.label}</span>
          ${picked && opt.key === q.correct ? '<span class="q-mark mark-ok">正解</span>' : ""}
          ${picked && opt.key === picked && opt.key !== q.correct ? '<span class="q-mark mark-bad">已选</span>' : ""}
        </span>
        ${renderOptionSvg(opt.mode, Boolean(picked))}
        ${picked ? `<span class="q-exp">${opt.explain}</span>` : ""}
      `;
      btn.addEventListener("click", () => {
        st.picked[st.qid] = opt.key;
        render();
      });
      gridEl.appendChild(btn);
    });

    if (!picked) {
      resultEl.textContent = "点击任意一张海报作出判断；选完后会叠出铅垂线与留白校验线，逐项复盘。";
      resultEl.dataset.state = "idle";
    } else if (picked === q.correct) {
      resultEl.textContent = `选对了！${q.options.find((o) => o.key === q.correct).explain}`;
      resultEl.dataset.state = "ok";
    } else {
      const mine = q.options.find((o) => o.key === picked);
      const ans = q.options.find((o) => o.key === q.correct);
      resultEl.textContent = `你选了${mine.label}——${mine.explain} 正确答案为${ans.label}。`;
      resultEl.dataset.state = "wrong";
    }
  }

  qBtns.forEach((b) => {
    b.addEventListener("click", () => {
      st.qid = b.dataset.qId;
      render();
    });
  });
  retryBtn.addEventListener("click", () => {
    st.picked[st.qid] = null;
    render();
  });

  render();
}

// ==================== 08 节：原海报放大灯箱（缩放、拖动平移、Esc 关） ====================
export function initPosterLightbox() {
  const openBtn = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const btnIn = document.getElementById("lb-in");
  const btnClose = document.getElementById("lb-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    btnReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    btnClose.focus();
  }

  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    document.body.style.overflow = "";
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => { scale = Math.min(3, +(scale + 0.25).toFixed(2)); applyTransform(); });
  btnOut.addEventListener("click", () => { scale = Math.max(0.6, +(scale - 0.25).toFixed(2)); applyTransform(); });
  btnReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.6, Math.min(3.5, +(scale + (e.deltaY < 0 ? 0.15 : -0.15)).toFixed(2)));
    applyTransform();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage && scale <= 1) { close(); return; }
    drag = { x: e.clientX, y: e.clientY, tx0: tx, ty0: ty };
    lbStage.setPointerCapture?.(e.pointerId);
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = drag.tx0 + (e.clientX - drag.x);
    ty = drag.ty0 + (e.clientY - drag.y);
    applyTransform();
  });
  const endDrag = () => { drag = null; };
  lbStage.addEventListener("pointerup", endDrag);
  lbStage.addEventListener("pointercancel", endDrag);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

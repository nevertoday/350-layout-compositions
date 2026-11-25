// 195 · 分栏网格 COLUMN GRID — 全页交互总控
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  INITIAL_STATE,
  TOPICS,
  setColsPreserve,
  evaluateBoard,
  evaluate12Grid,
  evaluateResponsive,
  QUIZ_OPTIONS
} from "./model.js";
import { mountHeroStage } from "./stage-hero.js";

// ==================== 1. 开场活体分栏拼版台 ====================
let boardState = structuredClone(INITIAL_STATE);
const heroCanvas = document.getElementById("hero-canvas");

const elTopPill = document.getElementById("top-status-pill");
const elMobPill = document.getElementById("mobile-status-pill");
const elTitleRuler = document.getElementById("title-col-ruler");
const elDiagBadge = document.getElementById("diag-badge");
const elDiagTitle = document.getElementById("diag-title");
const elDiagReason = document.getElementById("diag-reason");
const elDiagAction = document.getElementById("diag-action");
const elMRatio = document.getElementById("m-ratio");
const elMChars = document.getElementById("m-chars");
const elMGutter = document.getElementById("m-gutter");
const elMAlign = document.getElementById("m-align");

const elCtrlGutter = document.getElementById("ctrl-gutter");
const elCtrlMargin = document.getElementById("ctrl-margin");
const elValGutter = document.getElementById("val-gutter");
const elValMargin = document.getElementById("val-margin");
const elBtnAlign = document.getElementById("btn-align");
const elBtnReset = document.getElementById("btn-reset");
const elBtnGrid = document.getElementById("btn-grid");
const elBtnBaseline = document.getElementById("btn-baseline");
const elBtnSpan = document.getElementById("btn-span");

const topicBtns = [...document.querySelectorAll("[data-topic]")];
const colBtns = [...document.querySelectorAll("[data-cols]")];
const takeawayBtns = [...document.querySelectorAll(".ta-item[data-check]")];

function setText(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}

function syncHeroUI() {
  const ev = evaluateBoard(boardState);
  const allOk = ev.passCount === 4;
  const pillText = allOk ? "4 / 4 秩序就位" : `${ev.passCount} / 4 待理栏`;

  [elTopPill, elMobPill].forEach((p) => {
    if (!p) return;
    setText(p, pillText);
    p.classList.toggle("is-ok", allOk);
    p.classList.toggle("is-err", !allOk);
  });

  // 示范大标内嵌的金黄微缩栏尺：复用 <i> 节点避免高频拖拽重排 DOM
  if (elTitleRuler.children.length !== ev.columns.length) {
    elTitleRuler.innerHTML = "";
    ev.columns.forEach((c) => {
      const seg = document.createElement("i");
      seg.style.flex = String(c.weight);
      elTitleRuler.appendChild(seg);
    });
  } else {
    ev.columns.forEach((c, i) => {
      elTitleRuler.children[i].style.flex = String(c.weight);
    });
  }

  // 诊单
  setText(elDiagBadge, ev.badge);
  elDiagBadge.classList.toggle("is-ok", allOk);
  elDiagBadge.classList.toggle("is-err", !allOk);
  setText(elDiagTitle, ev.title);
  setText(elDiagReason, ev.reason);
  setText(elDiagAction, ev.action);

  setText(elMRatio, ev.ratioText);
  setText(elMChars, `${ev.minChars} 字/行`);
  setText(elMGutter, ev.cols === 1 ? "无栏缝" : `${ev.gutterPx}px (${ev.gutterRatio.toFixed(1)}×)`);
  setText(elMAlign, ev.offGridPx === 0 ? "0px 贴栏" : `+${ev.offGridPx}px 脱栏`);

  // 按钮状态同步
  topicBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.topic === boardState.topic));
  colBtns.forEach((b) => b.classList.toggle("is-active", Number(b.dataset.cols) === boardState.cols));

  const gStr = String(boardState.gutterPx);
  if (elCtrlGutter.value !== gStr) elCtrlGutter.value = gStr;
  elCtrlGutter.disabled = boardState.cols === 1;
  setText(elValGutter, boardState.cols === 1 ? "单栏无缝" : `${boardState.gutterPx}px`);

  const mStr = String(boardState.marginPct);
  if (elCtrlMargin.value !== mStr) elCtrlMargin.value = mStr;
  setText(elValMargin, `${boardState.marginPct}%`);

  setText(elBtnAlign, boardState.aligned ? "已贴齐栏线 ✓" : "吸附对齐栏线");
  elBtnAlign.classList.toggle("is-ok", boardState.aligned);
  elBtnAlign.classList.toggle("is-warn", !boardState.aligned);

  elBtnGrid.classList.toggle("is-on", boardState.showGrid);
  elBtnGrid.setAttribute("aria-pressed", String(boardState.showGrid));
  elBtnBaseline.classList.toggle("is-on", boardState.showBaseline);
  elBtnBaseline.setAttribute("aria-pressed", String(boardState.showBaseline));
  setText(elBtnSpan, boardState.heroSpan >= 2 ? `跨 ${Math.min(boardState.heroSpan, boardState.cols)} 栏主图` : "单栏主图");
  elBtnSpan.classList.toggle("is-on", boardState.heroSpan >= 2);

  // 底部四栏国际蓝设计要点实时状态灯
  for (const key of ["fit", "align", "gutter", "rhythm"]) {
    const tagEl = document.getElementById(`tag-${key}`);
    const check = ev.checks[key];
    if (tagEl && check) {
      setText(tagEl, check.tag);
      tagEl.classList.toggle("is-ok", check.ok);
      tagEl.classList.toggle("is-err", !check.ok);
    }
  }
}

const heroStage = mountHeroStage(
  heroCanvas,
  () => boardState,
  (next) => { boardState = next; },
  syncHeroUI
);

topicBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const topicId = btn.dataset.topic;
    boardState = { ...boardState, topic: topicId };
    syncHeroUI();
    heroStage.draw();
  });
});

colBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    boardState = setColsPreserve(boardState, Number(btn.dataset.cols));
    syncHeroUI();
    heroStage.draw();
  });
});

elCtrlGutter.addEventListener("input", () => {
  boardState = { ...boardState, gutterPx: Number(elCtrlGutter.value) };
  syncHeroUI();
  heroStage.draw();
});

elCtrlMargin.addEventListener("input", () => {
  boardState = { ...boardState, marginPct: Number(elCtrlMargin.value) };
  syncHeroUI();
  heroStage.draw();
});

elBtnAlign.addEventListener("click", () => {
  boardState = { ...boardState, aligned: !boardState.aligned };
  syncHeroUI();
  heroStage.draw();
});

elBtnReset.addEventListener("click", () => {
  boardState = structuredClone(INITIAL_STATE);
  syncHeroUI();
  heroStage.draw();
});

elBtnGrid.addEventListener("click", () => {
  boardState = { ...boardState, showGrid: !boardState.showGrid };
  syncHeroUI();
  heroStage.draw();
});

elBtnBaseline.addEventListener("click", () => {
  boardState = { ...boardState, showBaseline: !boardState.showBaseline };
  syncHeroUI();
  heroStage.draw();
});

elBtnSpan.addEventListener("click", () => {
  const nextSpan = boardState.heroSpan >= 2 ? 1 : Math.min(2, Math.max(1, boardState.cols));
  boardState = { ...boardState, heroSpan: nextSpan };
  syncHeroUI();
  heroStage.draw();
});

// 点击底部四栏要点卡片：演示对应维度的快捷修正或聚焦说明（但不一键给全答案，只帮用户修当前单项或高亮引导）
takeawayBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const kind = btn.dataset.check;
    const preset = (TOPICS[boardState.topic] || TOPICS.magazine).recommendedPreset;
    if (kind === "fit") {
      boardState = { ...boardState, cols: preset.cols, weights: [...preset.weights], heroSpan: preset.heroSpan };
    } else if (kind === "align") {
      boardState = { ...boardState, aligned: true };
    } else if (kind === "gutter") {
      boardState = { ...boardState, gutterPx: preset.gutterPx };
    } else if (kind === "rhythm") {
      boardState = { ...boardState, marginPct: preset.marginPct, weights: boardState.cols >= 2 ? [...preset.weights].slice(0, boardState.cols) : [1] };
    }
    syncHeroUI();
    heroStage.draw();
  });
});

syncHeroUI();
heroStage.draw();

// ==================== 2. 01 节：宽幅单栏 vs 三栏视线扫读对决 ====================
(() => {
  const canvas = document.getElementById("scan-canvas");
  const btnRun = document.getElementById("btn-scan-run");
  const btnMode = document.getElementById("btn-scan-mode");
  const elSingle = document.getElementById("scan-single-stat");
  const elMulti = document.getElementById("scan-multi-stat");
  const ctx = canvas.getContext("2d");

  let mode = "read"; // read: 逐行通读 | find: 寻读重点词
  let progress = 0.62; // 初始画面停在清晰可见的扫读轨迹上，不是空画布
  let playing = false;

  function drawScan(t, dt, { still }) {
    const dpr = pixelRatio(2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, rect.width || 900);
    const stacked = w < 640;
    const h = stacked ? 370 : 252;
    if (canvas.style.height !== `${h}px`) canvas.style.height = `${h}px`;

    const nw = Math.round(w * dpr);
    const nh = Math.round(h * dpr);
    if (canvas.width !== nw || canvas.height !== nh) {
      canvas.width = nw;
      canvas.height = nh;
    }

    if (playing && !still) {
      progress += (dt || 0.016) * 0.28;
      if (progress >= 1) {
        progress = 1;
        playing = false;
        btnRun.textContent = "再扫一遍";
      }
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#F5F0E9";
    ctx.fillRect(0, 0, w, h);

    const gap = 16;
    const pad = 14;
    const panelW = stacked ? w - pad * 2 : (w - pad * 2 - gap) / 2;
    const panelH = stacked ? (h - pad * 2 - gap) / 2 : h - pad * 2;

    const p1 = { x: pad, y: pad, w: panelW, h: panelH };
    const p2 = stacked
      ? { x: pad, y: pad + panelH + gap, w: panelW, h: panelH }
      : { x: pad + panelW + gap, y: pad, w: panelW, h: panelH };

    // 左/上：无分栏通宽
    drawPanel(p1, "无分栏通宽（单行 54 字）", "#C62828", false);
    // 右/下：三栏垂直通道
    drawPanel(p2, "三栏垂直通道（每栏 17 字）", "#013DBF", true);

    ctx.restore();
  }

  function drawPanel(box, title, accent, multi) {
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeStyle = "#D4CFC6";
    ctx.lineWidth = 1;
    ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);

    // 标题条
    ctx.fillStyle = accent;
    ctx.fillRect(box.x, box.y, box.w, 28);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(title, box.x + 12, box.y + 14.5);

    const innerX = box.x + 16;
    const innerY = box.y + 42;
    const innerW = box.w - 32;
    const innerH = box.h - 56;

    if (!multi) {
      // 6 条通宽长行
      const rows = 6;
      const stepY = innerH / rows;
      const pts = [];
      for (let r = 0; r < rows; r++) {
        const y = innerY + r * stepY + 7;
        ctx.fillStyle = "#E1DDD4";
        ctx.fillRect(innerX, y - 3, innerW, 6);
        // 标记第 4 行尾端附近的重点词
        if (mode === "find" && r === 3) {
          ctx.fillStyle = "#F5C02C";
          ctx.fillRect(innerX + innerW * 0.68, y - 5, 42, 10);
        }
        pts.push({ x: innerX, y }, { x: innerX + innerW, y });
      }
      // 绘制长距红虚折返线
      drawPathTrace(pts, "#C62828", progress, true);
    } else {
      // 三栏垂直柱
      const g = 14;
      const cw = (innerW - g * 2) / 3;
      const rows = 5;
      const stepY = innerH / rows;
      const pts = [];
      for (let c = 0; c < 3; c++) {
        const cx = innerX + c * (cw + g);
        ctx.fillStyle = "rgba(219, 219, 240, 0.55)";
        ctx.fillRect(cx, innerY - 4, cw, innerH + 4);
        // 栏首蓝标
        ctx.fillStyle = "#013DBF";
        ctx.fillRect(cx + 6, innerY + 2, Math.min(28, cw - 12), 4);
        for (let r = 1; r < rows; r++) {
          const y = innerY + r * stepY + 6;
          ctx.fillStyle = "#9BAAD6";
          ctx.fillRect(cx + 6, y - 2.5, cw - 12, 5);
          if (mode === "find" && c === 1 && r === 1) {
            ctx.fillStyle = "#F5C02C";
            ctx.fillRect(cx + 6, y - 5, cw - 12, 10);
          }
          if (mode === "read" && c === 0) {
            pts.push({ x: cx + 6, y }, { x: cx + cw - 6, y });
          }
        }
        if (mode === "find") {
          pts.push({ x: cx + cw * 0.5, y: innerY + 6 });
          if (c === 1) pts.push({ x: cx + cw * 0.5, y: innerY + stepY + 6 });
        }
      }
      drawPathTrace(pts, "#013DBF", progress, false);
    }
    ctx.restore();
  }

  function drawPathTrace(pts, color, p, isReturnLong) {
    if (pts.length < 2) return;
    // 计算总路径长
    let total = 0;
    const lens = [0];
    for (let i = 1; i < pts.length; i++) {
      total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      lens.push(total);
    }
    const target = total * Math.max(0.05, Math.min(1, p));
    ctx.save();
    let cur = pts[0];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const segStart = lens[i - 1];
      const segEnd = lens[i];
      if (target < segStart) break;
      const frac = Math.min(1, (target - segStart) / Math.max(0.001, segEnd - segStart));
      const ex = a.x + (b.x - a.x) * frac;
      const ey = a.y + (b.y - a.y) * frac;
      cur = { x: ex, y: ey };
      const isBackSweep = b.x < a.x - 10;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = isBackSweep && isReturnLong ? "#C62828" : color;
      ctx.lineWidth = isBackSweep ? 1.8 : 2.2;
      ctx.setLineDash(isBackSweep ? [5, 4] : []);
      ctx.stroke();
    }
    // 视线焦点圆点
    ctx.setLineDash([]);
    ctx.fillStyle = "#F5C02C";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cur.x, cur.y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  const scanRunner = loop(canvas, drawScan);

  btnRun.addEventListener("click", () => {
    progress = 0;
    playing = !reducedMotion.matches;
    if (reducedMotion.matches) progress = 1;
    btnRun.textContent = playing ? "扫读演示中…" : "再扫一遍";
    scanRunner.draw();
  });

  btnMode.addEventListener("click", () => {
    mode = mode === "read" ? "find" : "read";
    btnMode.textContent = mode === "read" ? "切换：寻读重点词" : "切换：连续通读";
    if (mode === "read") {
      elSingle.textContent = "54 字/行 · 长距折返 860px";
      elMulti.textContent = "17 字/行 · 短距回扫 268px（缩短 69%）";
    } else {
      elSingle.textContent = "逐行搜寻 4 行长文才能命中黄标";
      elMulti.textContent = "扫 2 个栏首立刻定位中栏黄标";
    }
    progress = reducedMotion.matches ? 1 : 0;
    playing = !reducedMotion.matches;
    scanRunner.draw();
  });

  new ResizeObserver(() => scanRunner.draw()).observe(canvas);
  scanRunner.draw();
})();

// ==================== 3. 02 节：五层基准线 X 光解剖 + 栏缝安全阀 ====================
(() => {
  const svg = document.getElementById("anatomy-svg");
  const titleEl = document.getElementById("anat-title");
  const descEl = document.getElementById("anat-desc");
  const partBtns = [...document.querySelectorAll(".anat-item[data-part]")];
  const valveBtns = [...document.querySelectorAll(".valve-btn[data-valve]")];

  const PARTS = {
    gutter: {
      title: "栏间距 Gutter：经验上应大于等于正文行距",
      desc: "如果正文行距是 20px，栏间距却只有 8px，左右两栏的字就会比上下两行更亲近，眼睛读完左栏第一行很容易横向串进右栏。把栏距设在行距的 1.1 至 1.8 倍，通道才稳固清晰。"
    },
    margin: {
      title: "页边距 Margin：把内容和外界杂讯隔开的呼吸框",
      desc: "四周页边距不是「没填满的废纸」，它先确立整页版心的边界，让最左栏和最右栏不会撞向屏幕或裁切边。"
    },
    column: {
      title: "栏 Column：决定节奏的垂直骨架",
      desc: "一栏承载一条清晰的信息流。栏越少，每栏越宽、节奏越舒缓；栏越多，并列密度越高、节奏越紧凑。"
    },
    content: {
      title: "内容区 Content：严守「起于栏左、止于栏右」",
      desc: "单栏元素乖乖留在栏内；当大图或大标题要跨两栏时，它必须把中间那道栏间距一并包进来，绝不能悬空停在栏缝正中。"
    },
    baseline: {
      title: "基线 Baseline：让相邻栏的文字脚底排齐",
      desc: "水平基线穿过全部栏位，保证左栏第五行与右栏第五行落在同一条水平线上，整页呈现出瑞士印刷品般的克制与整齐。"
    }
  };

  let activePart = "gutter";
  let valve = "safe"; // narrow | safe | wide

  function renderAnatomy() {
    const W = 640, H = 340;
    const mx = 52, my = 32;
    const innerW = W - mx * 2;
    const innerH = H - my * 2;
    const gutter = valve === "narrow" ? 8 : valve === "wide" ? 76 : 28;
    const colW = (innerW - gutter * 2) / 3;
    const cols = [0, 1, 2].map((i) => ({ x: mx + i * (colW + gutter), w: colW }));

    const hi = (name) => activePart === name;
    const isErr = valve !== "safe";
    const gutterColor = valve === "safe" ? "#013DBF" : "#C62828";

    let out = `<rect x="0" y="0" width="${W}" height="${H}" fill="#FFFFFF"/>`;

    // 页边距高亮区
    if (hi("margin")) {
      out += `
        <rect x="0" y="0" width="${mx}" height="${H}" fill="rgba(245,192,44,0.28)"/>
        <rect x="${W - mx}" y="0" width="${mx}" height="${H}" fill="rgba(245,192,44,0.28)"/>
        <rect x="${mx}" y="0" width="${innerW}" height="${my}" fill="rgba(245,192,44,0.28)"/>
        <rect x="${mx}" y="${H - my}" width="${innerW}" height="${my}" fill="rgba(245,192,44,0.28)"/>
      `;
    }

    // 三道淡蓝紫栏柱与栏内模拟行
    cols.forEach((c) => {
      out += `<rect x="${c.x}" y="${my}" width="${c.w}" height="${innerH}" fill="${hi("column") ? "rgba(64,108,235,0.28)" : "#E2E4F5"}" stroke="${hi("column") ? "#013DBF" : "none"}" stroke-width="2"/>`;
      // 栏内模拟文本线（按 20px 行距）
      for (let y = my + 56; y < H - my - 56; y += 20) {
        out += `<rect x="${c.x + 10}" y="${y}" width="${Math.max(18, c.w - 22)}" height="5" fill="${hi("content") ? "#013DBF" : "#7D8EB8"}" opacity="${hi("content") ? 0.9 : 0.65}"/>`;
      }
    });

    // 跨两栏内容示范块（在三栏底色画完后再绘，清晰跨过前两栏并包住中间栏缝！）
    const spanW = cols[1].x + cols[1].w - cols[0].x;
    out += `<rect x="${cols[0].x}" y="${H - my - 46}" width="${spanW}" height="34" fill="${hi("content") ? "#013DBF" : "#406CEB"}"/>`;
    out += `<text x="${cols[0].x + spanW / 2}" y="${H - my - 25}" text-anchor="middle" fill="#FFFFFF" font-size="12" font-weight="700" font-family="Noto Sans SC, sans-serif">跨两栏内容区（包住中间栏缝，边缘贴栏线）</text>`;

    // 第三栏单栏引语金黄块
    out += `<rect x="${cols[2].x}" y="${H - my - 46}" width="${cols[2].w}" height="34" fill="#F5C02C"/>`;
    out += `<text x="${cols[2].x + cols[2].w / 2}" y="${H - my - 25}" text-anchor="middle" fill="#151924" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">单栏引语</text>`;

    // 栏间距高亮条与读数
    [0, 1].forEach((gi) => {
      const gx = cols[gi].x + cols[gi].w;
      const showG = hi("gutter") || isErr;
      out += `<rect x="${gx}" y="${my}" width="${gutter}" height="${innerH}" fill="${showG ? (valve === "safe" ? "rgba(245,192,44,0.34)" : "rgba(198,40,40,0.22)") : "transparent"}"/>`;
      out += `<line x1="${gx + gutter / 2}" y1="${my - 14}" x2="${gx + gutter / 2}" y2="${H - my + 8}" stroke="${gutterColor}" stroke-width="${showG ? 1.5 : 1}" stroke-dasharray="4 3"/>`;
      if (gi === 0) {
        out += `<text x="${gx + gutter / 2}" y="${my - 18}" text-anchor="middle" fill="${gutterColor}" font-size="12" font-weight="700" font-family="DM Mono, Noto Sans SC, monospace">Gutter ${gutter}px</text>`;
      }
    });

    // 窄缝串行赤红跳线演示
    if (valve === "narrow") {
      const yCross = my + 98;
      const xA = cols[0].x + cols[0].w - 28;
      const xB = cols[1].x + 42;
      out += `
        <line x1="${xA}" y1="${yCross}" x2="${xB}" y2="${yCross}" stroke="#C62828" stroke-width="2.5" stroke-dasharray="5 3"/>
        <polygon points="${xB + 6},${yCross} ${xB - 2},${yCross - 4} ${xB - 2},${yCross + 4}" fill="#C62828"/>
        <rect x="${cols[0].x + cols[0].w - 72}" y="${yCross - 28}" width="160" height="22" fill="#C62828"/>
        <text x="${cols[0].x + cols[0].w + 8}" y="${yCross - 13}" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="700" font-family="Noto Sans SC, sans-serif">8px &lt; 20px 行距 · 视线串行</text>
      `;
    } else if (valve === "wide") {
      const gx = cols[0].x + cols[0].w;
      out += `
        <rect x="${gx - 28}" y="${my + 92}" width="${gutter + 56}" height="24" fill="#C62828"/>
        <text x="${gx + gutter / 2}" y="${my + 108}" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="700" font-family="Noto Sans SC, sans-serif">76px 过宽 · 页面散成孤柱</text>
      `;
    }

    // 水平基线虚线
    for (let y = my + 20; y <= H - my; y += 20) {
      out += `<line x1="${mx - 12}" y1="${y}" x2="${W - mx + 12}" y2="${y}" stroke="${hi("baseline") ? "#013DBF" : "#6F8CE0"}" stroke-width="${hi("baseline") ? 1.5 : 0.9}" stroke-dasharray="4 4" opacity="${hi("baseline") ? 0.95 : 0.4}"/>`;
    }

    // 页边距虚线外框
    out += `<rect x="${mx}" y="${my}" width="${innerW}" height="${innerH}" fill="none" stroke="${hi("margin") ? "#C62828" : "#013DBF"}" stroke-width="${hi("margin") ? 2 : 1.2}" stroke-dasharray="6 4"/>`;

    // 通栏标题占位条
    out += `<rect x="${mx}" y="${my + 12}" width="${innerW * 0.62}" height="24" fill="${hi("content") ? "#013DBF" : "#151924"}"/>`;
    out += `<text x="${mx + 10}" y="${my + 28}" fill="#FFFFFF" font-size="12" font-weight="700" font-family="Noto Sans SC, sans-serif">通栏标题与栏轨左缘齐平</text>`;

    svg.innerHTML = out;
    titleEl.textContent = PARTS[activePart].title;
    descEl.textContent = PARTS[activePart].desc;
  }

  partBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      activePart = btn.dataset.part;
      partBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      renderAnatomy();
    });
  });

  valveBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      valve = btn.dataset.valve;
      valveBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
      activePart = "gutter";
      partBtns.forEach((b) => {
        const on = b.dataset.part === "gutter";
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      renderAnatomy();
    });
  });

  renderAnatomy();
})();

// ==================== 4. 03 节：12 栏母网格自由切分板 ====================
(() => {
  const board = document.getElementById("grid12-board");
  const elRatio = document.getElementById("g12-ratio");
  const elFit = document.getElementById("g12-fit");
  const elVerdict = document.getElementById("g12-verdict");
  const presetBtns = [...document.querySelectorAll(".g12-preset")];

  let cuts = new Set([3, 9]); // 默认展示海报最经典的三栏 1 : 2 : 1

  function render12() {
    const res = evaluate12Grid([...cuts]);
    elRatio.textContent = res.ratio;
    elFit.textContent = `${res.fit}（格数：${res.spans.join(" + ")}）`;
    elVerdict.textContent = res.verdict;

    // 渲染 12 个轨道单元与 11 个可点击切口
    const pts = [0, ...[...cuts].sort((a, b) => a - b), 12];
    const spanOfCell = new Array(12).fill(0);
    for (let s = 0; s < pts.length - 1; s++) {
      for (let i = pts[s]; i < pts[s + 1]; i++) spanOfCell[i] = s;
    }

    let html = `<div class="g12-tracks">`;
    for (let s = 0; s < res.spans.length; s++) {
      const span = res.spans[s];
      const highlight = span === Math.max(...res.spans) && !res.equal;
      html += `<div class="g12-span ${highlight ? "is-main" : ""} ${span === 1 ? "is-thin" : ""}" style="flex:${span}">
        <span class="g12-span-num">${span} 格</span>
        <span class="g12-span-sub">${Math.round((span / 12) * 100)}%</span>
      </div>`;
    }
    html += `</div><div class="g12-cut-row" role="group" aria-label="点击切换 1 至 11 号分栏切口">`;
    for (let i = 1; i <= 11; i++) {
      const on = cuts.has(i);
      html += `<button type="button" class="g12-cut ${on ? "is-cut" : ""}" data-cut="${i}" aria-pressed="${on}" aria-label="第 ${i} 条分栏线：${on ? "已切开" : "已合并"}">
        <span class="g12-cut-line"></span>
        <span class="g12-cut-idx">${i}</span>
      </button>`;
    }
    html += `</div>`;
    board.innerHTML = html;

    board.querySelectorAll(".g12-cut").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.cut);
        if (cuts.has(idx)) cuts.delete(idx);
        else cuts.add(idx);
        syncPresetHighlight();
        render12();
      });
    });
  }

  function syncPresetHighlight() {
    const key = [...cuts].sort((a, b) => a - b).join(",");
    presetBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.cuts === key));
  }

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const arr = btn.dataset.cuts ? btn.dataset.cuts.split(",").map(Number) : [];
      cuts = new Set(arr);
      syncPresetHighlight();
      render12();
    });
  });

  render12();
})();

// ==================== 5. 04 节：四种真实版面压力切换 ====================
(() => {
  const wrap = document.getElementById("app-cards");
  const note = document.getElementById("app-note");
  const modeBtns = [...document.querySelectorAll(".app-mode-btn")];
  const overlayBtn = document.getElementById("btn-app-overlay");

  const NOTES = {
    poster: "当前为原海报推荐落栏：杂志双栏图文平衡、产品三栏图标齐平、数据四栏同基线比大小、新闻三栏配通栏标题与金黄引语框。",
    single: "强行压成单栏后：杂志图文被上下拆开、数据对比页只能竖着一条条往下找、产品页留出大片废白，横向扫读效率大幅折损。",
    cramped: "硬塞进过密 6 栏后：每栏只剩细窄一条，正文断成竖列碎词、数字与图标互相挤压，分栏从建立秩序变成了制造视觉噪音。"
  };

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const m = btn.dataset.appmode;
      wrap.dataset.mode = m;
      note.textContent = NOTES[m];
      modeBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
    });
  });

  overlayBtn.addEventListener("click", () => {
    const on = wrap.classList.toggle("show-overlay");
    overlayBtn.classList.toggle("is-on", on);
    overlayBtn.setAttribute("aria-pressed", String(on));
    overlayBtn.textContent = on ? "显示蓝紫栏轨透视" : "隐藏蓝紫栏轨透视";
  });
})();

// ==================== 6. 05 节：屏幕变窄折栏对比 ====================
(() => {
  const slider = document.getElementById("resp-width");
  const vwVal = document.getElementById("resp-vw-val");
  const fixedPill = document.getElementById("resp-fixed-pill");
  const smartPill = document.getElementById("resp-smart-pill");
  const fixedDev = document.getElementById("resp-fixed-device");
  const smartDev = document.getElementById("resp-smart-device");
  const fixedVerdict = document.getElementById("resp-fixed-verdict");
  const smartVerdict = document.getElementById("resp-smart-verdict");
  const quickBtns = [...document.querySelectorAll(".rq-btn")];

  const CARDS = [
    { num: "01", title: "栏宽秩序", copy: "根据屏幕宽度保留舒适可读单行字数。" },
    { num: "02", title: "栏距呼吸", copy: "始终大于行距，避免窄屏字块贴连。" },
    { num: "03", title: "顺流折叠", copy: "左到右自然折成上到下，逻辑不断。" },
    { num: "04", title: "触控留裕", copy: "卡片变宽后按钮与文字都能轻松点按。" }
  ];

  function renderResp(vw) {
    const r = evaluateResponsive(vw);
    vwVal.textContent = `${r.vw}px · ${r.device}`;

    // 设备框架宽度按 360..1440 映射到 38%..100%，直观看见屏宽收放
    const pctWidth = Math.round(38 + ((r.vw - 360) / (1440 - 360)) * 62);

    fixedPill.textContent = `${r.fixed.cols} 栏 · ${r.fixed.colW}px/栏`;
    fixedPill.className = `resp-pill ${r.fixed.bad ? "is-err" : "is-ok"}`;
    fixedVerdict.textContent = r.fixed.verdict;
    fixedDev.style.width = `${pctWidth}%`;
    fixedDev.innerHTML = `<div class="rd-grid" style="grid-template-columns:repeat(4,minmax(0,1fr));gap:${Math.max(3, Math.round(r.fixed.gutter / 3))}px">
      ${CARDS.map((c) => `<div class="rd-card ${r.fixed.bad ? "is-squeezed" : ""}"><b>${c.num}</b><span>${c.title}</span><p>${c.copy}</p></div>`).join("")}
    </div>`;

    smartPill.textContent = `${r.smart.cols} 栏 · ${r.smart.colW}px/栏`;
    smartVerdict.textContent = r.smart.verdict;
    smartDev.style.width = `${pctWidth}%`;
    smartDev.innerHTML = `<div class="rd-grid" style="grid-template-columns:repeat(${r.smart.cols},minmax(0,1fr));gap:8px">
      ${CARDS.map((c) => `<div class="rd-card"><b>${c.num}</b><span>${c.title}</span><p>${c.copy}</p></div>`).join("")}
    </div>`;

    quickBtns.forEach((b) => b.classList.toggle("is-active", Number(b.dataset.vw) === r.vw));
  }

  slider.addEventListener("input", () => renderResp(Number(slider.value)));
  quickBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const vw = Number(btn.dataset.vw);
      slider.value = String(vw);
      renderResp(vw);
    });
  });

  renderResp(Number(slider.value));
})();

// ==================== 7. 08 节：小练习四幅精绘 SVG 选项 ====================
(() => {
  const grid = document.getElementById("quiz-grid");
  const resultBox = document.getElementById("quiz-result");
  const resHead = document.getElementById("quiz-result-head");
  const resBody = document.getElementById("quiz-result-body");

  function buildOptionSVG(opt) {
    // 严格按 1200px 逻辑宽等比缩到 300×184 viewBox（1px 逻辑 = 0.25 单位，比例 100% 忠实于参数！）
    const W = 300, H = 184;
    const mx = 16, my = 14;
    const innerW = W - mx * 2;
    const g = opt.gutterPx * 0.25; // 12px->3, 32px->8, 96px->24
    const netW = innerW - g * 2;
    const sum = opt.ratio.reduce((a, b) => a + b, 0);
    const cols = [];
    let x = mx;
    opt.ratio.forEach((w) => {
      const cw = (w / sum) * netW;
      cols.push({ x, w: cw });
      x += cw + g;
    });

    let svg = `<svg viewBox="0 0 ${W} ${H}" class="quiz-svg" aria-hidden="true">`;
    svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="#FBF9F5"/>`;
    // 淡蓝紫栏底
    cols.forEach((c) => {
      svg += `<rect x="${c.x}" y="${my}" width="${c.w}" height="${H - my * 2}" fill="#E0E3F5"/>`;
    });
    // 通栏标题条
    svg += `<rect x="${mx}" y="${my + 6}" width="${innerW}" height="14" fill="#013DBF"/>`;
    // 每栏正文模拟行（按 24px 行距 -> 6 单位行距！）
    cols.forEach((c, idx) => {
      const rowEnd = idx === 2 ? H - my - 42 : H - my - 10;
      for (let y = my + 30; y < rowEnd; y += 6) {
        svg += `<rect x="${c.x + 2.5}" y="${y}" width="${Math.max(6, c.w - 5)}" height="2.4" fill="#3B4660" opacity="0.72"/>`;
      }
    });
    // 金黄引语块：aligned 时贴齐第 3 栏，不对齐时故意居中悬空跨压栏缝！
    if (opt.aligned) {
      const c2 = cols[2];
      svg += `<rect x="${c2.x}" y="${H - my - 38}" width="${c2.w}" height="32" fill="#F5C02C"/>`;
      svg += `<rect x="${c2.x + 5}" y="${H - my - 28}" width="${c2.w - 10}" height="2.5" fill="#151924"/>`;
      svg += `<rect x="${c2.x + 5}" y="${H - my - 21}" width="${c2.w - 14}" height="2.5" fill="#151924"/>`;
    } else {
      const qw = 92;
      const qx = W / 2 - qw / 2 + 24; // 横跨中栏与右栏之间的栏缝！
      svg += `<rect x="${qx}" y="${H - my - 46}" width="${qw}" height="34" fill="#F5C02C" stroke="#151924" stroke-width="0.8"/>`;
      svg += `<rect x="${qx + 8}" y="${H - my - 34}" width="${qw - 16}" height="2.6" fill="#151924"/>`;
      svg += `<rect x="${qx + 8}" y="${H - my - 26}" width="${qw - 24}" height="2.6" fill="#151924"/>`;
    }
    svg += `<rect x="${mx}" y="${my}" width="${innerW}" height="${H - my * 2}" fill="none" stroke="#8FA6E6" stroke-width="0.8" stroke-dasharray="3 2"/>`;
    svg += `</svg>`;
    return svg;
  }

  grid.innerHTML = QUIZ_OPTIONS.map(
    (opt) => `<button type="button" class="quiz-card" data-opt="${opt.id}" role="radio" aria-checked="false">
      ${buildOptionSVG(opt)}
      <span class="quiz-label">${opt.label}</span>
    </button>`
  ).join("");

  const cards = [...grid.querySelectorAll(".quiz-card")];
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const opt = QUIZ_OPTIONS.find((o) => o.id === card.dataset.opt);
      if (!opt) return;
      cards.forEach((c) => {
        const isMe = c === card;
        const item = QUIZ_OPTIONS.find((o) => o.id === c.dataset.opt);
        c.setAttribute("aria-checked", String(isMe));
        c.classList.remove("is-picked", "is-right", "is-wrong");
        if (isMe) {
          c.classList.add("is-picked", opt.correct ? "is-right" : "is-wrong");
        } else if (!opt.correct && item.correct) {
          c.classList.add("is-right");
        }
      });
      resultBox.hidden = false;
      resultBox.className = `quiz-result ${opt.correct ? "is-right" : "is-wrong"}`;
      resHead.textContent = opt.correct ? "回答正确 · 选项 B 成立" : `再想想 · 选项 ${opt.id} 有隐蔽隐患（正确答案是 B）`;
      resBody.textContent = opt.feedback;
    });
  });
})();

// ==================== 8. 09 节：原海报放大灯箱（缩放 / 拖拽 / Esc 关闭） ====================
(() => {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const box = document.getElementById("lightbox");
  const vp = document.getElementById("lb-viewport");
  const lbImg = document.getElementById("lb-img");
  const btnClose = document.getElementById("lb-close");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const zoomVal = document.getElementById("lb-zoom-val");

  let zoom = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
    zoomVal.textContent = `${Math.round(zoom * 100)}%`;
  }

  function openLightbox() {
    lbImg.src = posterImg.src;
    zoom = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    box.hidden = false;
    document.body.style.overflow = "hidden";
    btnClose.focus();
  }

  function closeLightbox() {
    if (box.hidden) return;
    box.hidden = true;
    document.body.style.overflow = "";
    openBtn.focus();
  }

  openBtn.addEventListener("click", openLightbox);
  btnClose.addEventListener("click", closeLightbox);
  btnIn.addEventListener("click", () => {
    zoom = Math.min(3, +(zoom + 0.35).toFixed(2));
    applyTransform();
  });
  btnOut.addEventListener("click", () => {
    zoom = Math.max(0.7, +(zoom - 0.35).toFixed(2));
    if (zoom <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });

  vp.addEventListener("pointerdown", (e) => {
    if (e.target === vp) {
      closeLightbox();
      return;
    }
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    vp.setPointerCapture(e.pointerId);
  });

  vp.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });

  vp.addEventListener("pointerup", (e) => {
    dragging = false;
    try { vp.releasePointerCapture(e.pointerId); } catch {}
  });

  vp.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    zoom = Math.max(0.7, Math.min(3, +(zoom + delta).toFixed(2)));
    if (zoom <= 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) closeLightbox();
  });
})();

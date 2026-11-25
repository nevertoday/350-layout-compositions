// 正文 01–08 节独立互动模块（labs.js）
// 相邻两节各用不同控件与交互机制，确保每节都有真实的动手收获

import { loop, pixelRatio } from "../../lib/stage.js";
import {
  BERTIN_BASE,
  HISTORY_ERAS,
  HUNT_ROUNDS,
  INK_STAGES,
  PILLAR_ANATOMY,
  POSTER_ITEMS,
  QUIZ_DATA,
  QUIZ_OPTIONS,
  TOTAL_ROW,
} from "./model.js";

const $ = (id) => document.getElementById(id);

// ==================== 01 四柱结构透视解剖 ====================
function initSec01() {
  const xray = $("s1-xray");
  const body = $("s1-xray-body");
  const foot = $("s1-xray-foot");
  const btnPoster = $("s1-mode-poster");
  const btnWork = $("s1-mode-work");

  let activeId = "structure";
  let mode = "poster"; // "poster" | "work"

  const zoneText = {
    structure: "当前透视区：表头 · 数据体 · 独立汇总行",
    align: "当前透视区：数值右缘与位值垂直对齐轴",
    compare: "当前透视区：深海军蓝焦点列 + 占比内嵌条",
    precise: "当前透视区：占比口径核验（原海报 92.2% vs 实务平账 100.0%）",
  };

  function renderXray() {
    xray.dataset.focus = activeId;
    xray.dataset.mode = mode;
    $("s1-zone-label").textContent = zoneText[activeId];

    const rows = POSTER_ITEMS.slice(0, 4);
    body.innerHTML = rows.map((r) => {
      const sh = mode === "poster" ? r.posterShare : r.realShare;
      return `<tr>
        <td class="xr-text"><strong>${r.name}</strong></td>
        <td class="xr-num">${r.q2.toLocaleString("en-US")}</td>
        <td class="xr-num xr-spot">+${r.qoq.toFixed(1)}% ↗</td>
        <td class="xr-share">${sh.toFixed(1)}%</td>
      </tr>`;
    }).join("") + `<tr>
      <td class="xr-text"><strong>${POSTER_ITEMS[4].name}</strong></td>
      <td class="xr-num">${POSTER_ITEMS[4].q2.toLocaleString("en-US")}</td>
      <td class="xr-num xr-spot">+${POSTER_ITEMS[4].qoq.toFixed(1)}% ↗</td>
      <td class="xr-share">${(mode === "poster" ? POSTER_ITEMS[4].posterShare : POSTER_ITEMS[4].realShare).toFixed(1)}%</td>
    </tr>`;

    const shareFoot = mode === "poster" ? "100.0%（五项实加 92.2%）" : "100.0%（五项实加 100.0%）";
    foot.innerHTML = `<tr>
      <td class="xr-text">合计 TOTAL</td>
      <td class="xr-num">5,060</td>
      <td class="xr-num xr-spot">+15.0%</td>
      <td class="xr-share">${shareFoot}</td>
    </tr>`;

    const info = PILLAR_ANATOMY.find((p) => p.id === activeId);
    $("s1-plain").textContent = info.plain;
    $("s1-badge").textContent = (activeId === "align" || activeId === "precise") ? "海报细看" : `${info.zh}要点`;
    $("s1-detail").textContent = info.detail;

    btnPoster.setAttribute("aria-pressed", String(mode === "poster"));
    btnWork.setAttribute("aria-pressed", String(mode === "work"));
  }

  document.querySelectorAll(".pillar-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      activeId = tab.dataset.p;
      document.querySelectorAll(".pillar-tab").forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      renderXray();
    });
  });

  btnPoster.addEventListener("click", () => { mode = "poster"; renderXray(); });
  btnWork.addEventListener("click", () => { mode = "work"; renderXray(); });
  renderXray();
}

// ==================== 02 找最大数计时微测 + 2D Canvas 数字游标卡尺 ====================
function initSec02() {
  const listEl = $("hunt-list");
  const startBtn = $("hunt-start");
  const resEl = $("hunt-result");

  let huntMode = "left";
  let roundIdx = 0;
  let startedAt = 0;
  let running = false;

  const modeLabels = {
    left: "数值左对齐",
    center: "数值居中",
    "right-prop": "右对齐·比例数字",
    "right-tab": "右对齐·等宽数字",
  };

  function renderHunt(markIdx = -1, hitOk = false) {
    listEl.dataset.mode = huntMode;
    const round = HUNT_ROUNDS[roundIdx];
    listEl.innerHTML = round.rows.map((r, i) => {
      const cls = markIdx === i ? (hitOk ? "is-hit" : "is-miss") : "";
      return `<button type="button" class="hunt-row ${cls}" data-idx="${i}">
        <span>${r.label}</span>
        <span class="hunt-val">${r.text}</span>
      </button>`;
    }).join("");
  }

  startBtn.addEventListener("click", () => {
    roundIdx = (roundIdx + 1) % HUNT_ROUNDS.length;
    running = true;
    startedAt = performance.now();
    renderHunt();
    resEl.textContent = `计时中（${modeLabels[huntMode]}）—— ${HUNT_ROUNDS[roundIdx].prompt}`;
  });

  listEl.addEventListener("click", (e) => {
    const row = e.target.closest(".hunt-row");
    if (!row) return;
    const idx = Number(row.dataset.idx);
    const round = HUNT_ROUNDS[roundIdx];
    const ok = idx === round.answerIdx;
    const elapsed = running ? Math.round(performance.now() - startedAt) : 0;
    running = false;
    renderHunt(idx, ok);
    const best = round.rows[round.answerIdx];
    if (ok) {
      resEl.textContent = elapsed
        ? `命中最大项「${best.label} ${best.text}」，本次用时 ${elapsed} ms（${modeLabels[huntMode]}）。换一种对齐方式再测一次，对比手感差异。`
        : `命中最大项「${best.label} ${best.text}」。点「开始计时」可记录真实反应毫秒数。`;
    } else {
      const picked = round.rows[idx];
      resEl.textContent = `点到了 ${picked.text}，最大项其实是「${best.label} ${best.text}」——${huntMode === "left" ? "左对齐把 988/994 的 9 顶到了 1,118 的 1 上方，正是典型的量级错觉。" : "切换成「右齐·等宽数字」再看，四位数的左缘立刻多出一整列。"}`;
    }
  });

  document.querySelectorAll("[data-hunt-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      huntMode = btn.dataset.huntMode;
      running = false;
      document.querySelectorAll("[data-hunt-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      renderHunt();
      resEl.textContent = `已切至「${modeLabels[huntMode]}」：点「开始计时」实测你一眼挑出最大数的耗时。`;
    });
  });
  renderHunt();

  // --- 2D Canvas 数字游标卡尺放大镜 ---
  const canvas = $("caliper-canvas");
  const ctx = canvas.getContext("2d");
  const btnProp = $("caliper-prop");
  const btnTab = $("caliper-tab");
  const noteEl = $("caliper-note");

  let targetTab = 0; // 0 = proportional, 1 = tabular
  let blend = 0;

  function resizeCaliper() {
    const r = canvas.parentElement.getBoundingClientRect();
    const dpr = pixelRatio(2);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawCaliper(t, dt, { still }) {
    const w = canvas.parentElement.clientWidth || 440;
    const h = canvas.parentElement.clientHeight || 256;
    if (still) blend = targetTab;
    else blend += (targetTab - blend) * Math.min(1, dt * 10);

    ctx.clearRect(0, 0, w, h);

    // 淡工程网格底
    ctx.strokeStyle = "rgba(194, 206, 202, 0.45)";
    ctx.lineWidth = 1;
    for (let x = 24; x < w; x += 24) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }

    const row1 = ["1", ",", "1", "1", "8", ".", "1"];
    const row2 = ["8", ",", "8", "8", "8", ".", "8"];

    const fontSize = Math.min(46, Math.max(28, w * 0.088));
    const tabCell = fontSize * 0.62;
    const propWidth = (ch) => {
      if (ch === "1") return fontSize * 0.38;
      if (ch === "," || ch === ".") return fontSize * 0.28;
      return fontSize * 0.64;
    };

    const rightEdge = w - Math.max(26, w * 0.08);
    const y1 = h * 0.36;
    const y2 = h * 0.72;

    const layoutGlyphs = (chars) => {
      const boxes = [];
      let cursor = rightEdge;
      for (let i = chars.length - 1; i >= 0; i--) {
        const ch = chars[i];
        const cw = propWidth(ch) * (1 - blend) + tabCell * blend;
        cursor -= cw;
        boxes.unshift({ ch, x: cursor, w: cw, cx: cursor + cw / 2 });
      }
      return boxes;
    };

    const b1 = layoutGlyphs(row1);
    const b2 = layoutGlyphs(row2);

    // 绘制对应位值（逗号与小数点）的垂直连线，上下错层放标牌避免窄屏碰贴
    const trackIndices = [1, 5]; // "," 和 "."
    trackIndices.forEach((idx, order) => {
      const p1 = b1[idx], p2 = b2[idx];
      const drift = Math.abs(p1.cx - p2.cx);
      const aligned = drift < 1.2;
      ctx.save();
      ctx.strokeStyle = aligned ? "#018868" : "#b52b21";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(p1.cx, y1 - fontSize * 0.52);
      ctx.lineTo(p1.cx, y1 + 14);
      ctx.lineTo(p2.cx, y2 - fontSize * 0.52);
      ctx.lineTo(p2.cx, y2 + 18);
      ctx.stroke();

      // 偏差标签：窄屏时逗号标牌靠左微上，小数点标牌靠右微下，互不碰撞
      const tag = aligned ? "对齐 0px" : `错开 ${Math.round(drift)}px`;
      ctx.setLineDash([]);
      ctx.font = '500 11px "DM Mono", monospace';
      const tw = ctx.measureText(tag).width + 10;
      const rawX = (p1.cx + p2.cx) / 2 - tw / 2 + (order === 0 ? -12 : 8);
      const midX = Math.max(6, Math.min(w - tw - 6, rawX));
      const midY = (y1 + y2) / 2 + (order === 0 ? -20 : 2);
      ctx.fillStyle = aligned ? "#018868" : "#b52b21";
      ctx.fillRect(midX, midY, tw, 18);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(tag, midX + 5, midY + 12.5);
      ctx.restore();
    });

    // 右基准线
    ctx.strokeStyle = "#002252";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rightEdge + 2, 20);
    ctx.lineTo(rightEdge + 2, h - 22);
    ctx.stroke();

    // 画字框与字形
    const drawRow = (boxes, y, color) => {
      for (const b of boxes) {
        ctx.fillStyle = blend > 0.5 ? "rgba(1, 136, 104, 0.08)" : "rgba(0, 34, 82, 0.06)";
        ctx.strokeStyle = blend > 0.5 ? "rgba(1, 136, 104, 0.35)" : "rgba(181, 43, 33, 0.32)";
        ctx.lineWidth = 1;
        ctx.fillRect(b.x + 1, y - fontSize * 0.72, b.w - 2, fontSize * 0.88);
        ctx.strokeRect(b.x + 1, y - fontSize * 0.72, b.w - 2, fontSize * 0.88);

        ctx.fillStyle = color;
        ctx.font = `${blend > 0.5 ? '500' : '600'} ${fontSize}px ${blend > 0.5 ? '"DM Mono", monospace' : '"IBM Plex Sans", sans-serif'}`;
        ctx.textAlign = "center";
        ctx.fillText(b.ch, b.cx, y);
      }
    };

    drawRow(b1, y1, "#002252");
    drawRow(b2, y2, "#0d1112");

    // 左上角模式标签
    ctx.textAlign = "left";
    ctx.font = '500 11.5px "DM Mono", monospace';
    ctx.fillStyle = blend > 0.5 ? "#01694f" : "#b52b21";
    ctx.fillText(blend > 0.5 ? "TABULAR-NUMS · 每位同宽" : "PROPORTIONAL · 1 比 8 窄", 14, 22);
    ctx.fillStyle = "#51605b";
    ctx.fillText("右边缘已对齐", rightEdge - 74, h - 8);
  }

  const calLoop = loop(canvas, drawCaliper);
  new ResizeObserver(() => { resizeCaliper(); calLoop.draw(); }).observe(canvas.parentElement);
  resizeCaliper();

  const setCaliper = (isTab) => {
    targetTab = isTab ? 1 : 0;
    btnProp.setAttribute("aria-pressed", String(!isTab));
    btnTab.setAttribute("aria-pressed", String(isTab));
    noteEl.innerHTML = isTab
      ? `开启 <code>font-variant-numeric: tabular-nums</code> 后，每个数字占据完全相同的水平槽宽；无论是 <code>1,118.1</code> 还是 <code>8,888.8</code>，千位逗号、百位、小数点全部锁成笔直纵轴。`
      : `在比例数字下，<code>1,118.1</code> 里的四个「1」比 <code>8,888.8</code> 里的「8」更瘦，即使右边缘对齐，千位逗号与百位已经向右侧错开了半个字符宽度。`;
    calLoop.draw();
  };
  btnProp.addEventListener("click", () => setCaliper(false));
  btnTab.addEventListener("click", () => setCaliper(true));
  calLoop.draw();
}

// ==================== 03 五段去墨剥离器（Tufte & Ehrenberg） ====================
function initSec03() {
  const range = $("ink-range");
  const card = $("ink-table-card");
  const tbl = $("ink-table");

  function renderStage(lv) {
    const info = INK_STAGES[lv - 1];
    card.dataset.stage = String(lv);
    $("ink-stage-name").textContent = `${lv}/5 · ${info.name}`;
    $("ink-stage-en").textContent = info.en;
    $("ink-share-label").textContent = info.inkShare;
    $("ink-bar-fill").style.width = `${info.ratioBar}%`;
    $("ink-note").textContent = info.note;

    const unitInCell = lv <= 2;
    const fourDec = lv <= 3;

    const fmtVal = (n, extra) => {
      if (fourDec) return `${n.toLocaleString("en-US")}.${extra}${unitInCell ? " 万元" : ""}`;
      return `${n.toLocaleString("en-US")}`;
    };
    const fmtQoq = (v) => (fourDec ? `+${v.toFixed(4)}%` : `+${v.toFixed(1)}%`);

    const headQ1 = unitInCell ? "Q1 销售额" : "Q1（万元）";
    const headQ2 = unitInCell ? "Q2 销售额" : "Q2（万元）";

    tbl.innerHTML = `
      <thead>
        <tr>
          <th class="txt">品类</th>
          <th class="num">${headQ1}</th>
          <th class="num">${headQ2}</th>
          <th class="num spot">环比增长</th>
        </tr>
      </thead>
      <tbody>
        ${POSTER_ITEMS.map((r, i) => `<tr>
          <td class="txt"><strong>${r.name}</strong></td>
          <td class="num">${fmtVal(r.q1, ["0042", "0000", "0000", "0000", "0000"][i])}</td>
          <td class="num">${fmtVal(r.q2, ["0018", "0005", "0000", "0000", "0000"][i])}</td>
          <td class="num spot">${fmtQoq(r.qoq)}</td>
        </tr>`).join("")}
      </tbody>
      <tfoot>
        <tr>
          <td class="txt"><strong>合计</strong></td>
          <td class="num"><strong>${fmtVal(TOTAL_ROW.q1, "0042")}</strong></td>
          <td class="num"><strong>${fmtVal(TOTAL_ROW.q2, "0023")}</strong></td>
          <td class="num spot"><strong>${fmtQoq(TOTAL_ROW.qoq)}</strong></td>
        </tr>
      </tfoot>
    `;
  }

  range.addEventListener("input", () => renderStage(Number(range.value)));
  renderStage(1);
}

// ==================== 04 Jacques Bertin 可重排矩阵 ====================
function initSec04() {
  const tbl = $("bertin-table");
  const verdict = $("bertin-verdict");

  let rowOrder = BERTIN_BASE.rows.map((_, i) => i);
  let colOrder = BERTIN_BASE.cols.map((_, i) => i);
  let selectedRowPos = -1;
  let mode = "plain"; // "plain" | "heat" | "bar"

  const rowMean = (rIdx) => {
    const vals = BERTIN_BASE.rows[rIdx].vals;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };
  const colMean = (cIdx) => {
    return BERTIN_BASE.rows.reduce((sum, r) => sum + r.vals[cIdx], 0) / BERTIN_BASE.rows.length;
  };

  function isRowSortedDesc() {
    for (let i = 1; i < rowOrder.length; i++) {
      if (rowMean(rowOrder[i]) > rowMean(rowOrder[i - 1])) return false;
    }
    return true;
  }

  function renderMatrix() {
    tbl.dataset.mode = mode;
    const theadHtml = `<thead><tr><th>品类（点击两行互换）</th>${colOrder.map((ci) => `<th>${BERTIN_BASE.cols[ci].label}</th>`).join("")}<th>均值</th></tr></thead>`;
    const tbodyHtml = `<tbody>${rowOrder.map((ri, pos) => {
      const r = BERTIN_BASE.rows[ri];
      const mean = rowMean(ri).toFixed(1);
      const isSel = pos === selectedRowPos;
      return `<tr>
        <td class="b-row-head">
          <button type="button" class="b-swap-btn" data-pos="${pos}" aria-pressed="${isSel}">
            <span>${r.name}</span>
            <span aria-hidden="true">${isSel ? "待换" : "⇅"}</span>
          </button>
        </td>
        ${colOrder.map((ci) => {
          const v = r.vals[ci];
          let bg = "";
          let fg = "";
          if (mode === "heat") {
            if (v >= 85) { bg = "background:#002252;"; fg = "color:#ffffff;"; }
            else if (v >= 70) { bg = "background:#018868;"; fg = "color:#ffffff;"; }
            else if (v >= 55) { bg = "background:#c8e4da;"; fg = "color:#0d1112;"; }
            else if (v >= 40) { bg = "background:#ebf4f0;"; fg = "color:#0d1112;"; }
            else { bg = "background:#f6f7f6;"; fg = "color:#3d4a46;"; }
          }
          if (mode === "bar") {
            return `<td><div class="b-bar-cell"><span>${v}</span><span class="b-mini-track" aria-hidden="true"><span class="b-mini-fill" style="width:${v}%"></span></span></div></td>`;
          }
          return `<td style="${bg}${fg}">${v}</td>`;
        }).join("")}
        <td><strong>${mean}</strong></td>
      </tr>`;
    }).join("")}</tbody>`;

    tbl.innerHTML = theadHtml + tbodyHtml;

    const sorted = isRowSortedDesc();
    if (sorted && mode !== "plain") {
      verdict.textContent = "规律浮现了！按均值重排行序并叠加视觉编码后，消费电子→运动户外→家居生活→服饰箱包→美妆个护→生鲜日配的梯队断层一眼可读。";
    } else if (sorted) {
      verdict.textContent = "行序已按量级排顺（从 90.8 梯降到 31.6），再把编码切到「明度色阶」或「内嵌迷你条」，看看贝尔坦的视觉分组威力。";
    } else if (mode !== "plain") {
      verdict.textContent = "色块/条形已经标出了高值和低值，但行序仍然打乱，深浅块散落各处——点「按行均值降序重排」把它们聚成一条清晰斜带。";
    } else {
      verdict.textContent = "当前处于乱序纯数字状态：高分品类与低分品类穿插混排，人眼必须逐格心算才能找出最强梯队。";
    }
  }

  tbl.addEventListener("click", (e) => {
    const btn = e.target.closest(".b-swap-btn");
    if (!btn) return;
    const pos = Number(btn.dataset.pos);
    if (selectedRowPos === -1) {
      selectedRowPos = pos;
    } else if (selectedRowPos === pos) {
      selectedRowPos = -1;
    } else {
      [rowOrder[selectedRowPos], rowOrder[pos]] = [rowOrder[pos], rowOrder[selectedRowPos]];
      selectedRowPos = -1;
    }
    renderMatrix();
  });

  $("b-sort-rows").addEventListener("click", () => {
    rowOrder.sort((a, b) => rowMean(b) - rowMean(a));
    selectedRowPos = -1;
    renderMatrix();
  });
  $("b-sort-cols").addEventListener("click", () => {
    colOrder.sort((a, b) => colMean(b) - colMean(a));
    renderMatrix();
  });
  $("b-reset").addEventListener("click", () => {
    rowOrder = BERTIN_BASE.rows.map((_, i) => i);
    colOrder = BERTIN_BASE.cols.map((_, i) => i);
    selectedRowPos = -1;
    renderMatrix();
  });

  document.querySelectorAll("[data-bmode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.bmode;
      document.querySelectorAll("[data-bmode]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      renderMatrix();
    });
  });

  renderMatrix();
}

// ==================== 05 五代历史标本切换 ====================
function initSec05() {
  const spec = $("era-specimen");

  function renderEra(id) {
    const era = HISTORY_ERAS.find((e) => e.id === id) || HISTORY_ERAS[0];
    $("era-year").textContent = era.year;
    $("era-place").textContent = era.place;
    $("era-person").textContent = era.person;
    $("era-work").textContent = era.work;
    $("era-summary").textContent = era.summary;
    $("era-caption").textContent = era.caption;
    spec.dataset.era = era.id;

    if (id === "1494") {
      spec.innerHTML = `<table>
        <thead><tr><th style="text-align:left">科目 ITEM</th><th style="text-align:right">借方 Q1</th><th style="text-align:right">贷方 Q2</th></tr></thead>
        <tbody>
          ${POSTER_ITEMS.slice(0, 4).map((r) => `<tr><td>${r.name}</td><td style="text-align:right">${r.q1.toLocaleString("en-US")}</td><td style="text-align:right">${r.q2.toLocaleString("en-US")}</td></tr>`).join("")}
        </tbody>
        <tfoot><tr><td><strong>试算平衡 SUMMA</strong></td><td style="text-align:right"><strong>3,840</strong></td><td style="text-align:right"><strong>4,450</strong></td></tr></tfoot>
      </table>`;
    } else if (id === "1967") {
      spec.innerHTML = `<table>
        <thead><tr><th style="text-align:left">排序项</th><th>Q1</th><th>Q2</th><th>增速</th><th>达成</th></tr></thead>
        <tbody>
          ${[
            ["消费电子", 4, 4, 4, 3],
            ["运动户外", 2, 2, 4, 4],
            ["家居生活", 3, 3, 3, 2],
            ["服饰箱包", 2, 2, 1, 2],
          ].map(([n, ...lv]) => `<tr><td style="text-align:left;font-weight:700">${n}</td>${lv.map((v) => {
            const bg = ["#f3f4f4", "#c2d6cf", "#459e84", "#002252"][v - 1];
            return `<td><span style="display:inline-block;width:20px;height:14px;background:${bg}"></span></td>`;
          }).join("")}</tr>`).join("")}
        </tbody>
      </table>`;
    } else if (id === "1977") {
      spec.innerHTML = `<table>
        <thead><tr><th style="text-align:left">品类（按 Q2 降序）</th><th style="text-align:right">Q1</th><th style="text-align:right">Q2</th><th style="text-align:right">增幅</th></tr></thead>
        <tbody>
          ${POSTER_ITEMS.slice(0, 4).map((r) => `<tr><td>${r.name}</td><td style="text-align:right;font-family:var(--font-mono)">${Math.round(r.q1 / 10) * 10}</td><td style="text-align:right;font-family:var(--font-mono)">${Math.round(r.q2 / 10) * 10}</td><td style="text-align:right;font-family:var(--font-mono)">+${Math.round(r.qoq)}%</td></tr>`).join("")}
        </tbody>
        <tfoot><tr><td>均值 AVERAGE</td><td style="text-align:right;font-family:var(--font-mono)">960</td><td style="text-align:right;font-family:var(--font-mono)">1,110</td><td style="text-align:right;font-family:var(--font-mono)">+15%</td></tr></tfoot>
      </table>`;
    } else if (id === "1979") {
      spec.innerHTML = `<table>
        <thead><tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>ITEM</td><td>Q1</td><td>Q2</td><td>QOQ</td></tr>
          <tr><td>2</td><td>ELEC</td><td style="text-align:right">1280</td><td style="text-align:right">1560</td><td style="text-align:right">+21.9%</td></tr>
          <tr><td>3</td><td>HOME</td><td style="text-align:right">980</td><td style="text-align:right">1120</td><td style="text-align:right">+14.3%</td></tr>
          <tr><td>4</td><td>SPRT</td><td style="text-align:right">720</td><td style="text-align:right">860</td><td style="text-align:right">+19.4%</td></tr>
          <tr><td>5</td><td>TOTAL</td><td style="text-align:right">=SUM(B2:B4)</td><td style="text-align:right">3540</td><td style="text-align:right">+18.8%</td></tr>
        </tbody>
      </table>`;
    } else {
      spec.innerHTML = `<table>
        <thead><tr><th style="text-align:left">项目</th><th style="text-align:right">Q2 销售额</th><th class="spot" style="text-align:right">环比增长</th><th style="text-align:left">占比</th></tr></thead>
        <tbody>
          ${POSTER_ITEMS.slice(0, 4).map((r) => `<tr><td><strong>${r.name}</strong></td><td style="text-align:right;font-family:var(--font-mono)">${r.q2.toLocaleString("en-US")}</td><td class="spot" style="text-align:right;font-family:var(--font-mono)">+${r.qoq.toFixed(1)}% ↗</td><td>${r.realShare.toFixed(1)}%</td></tr>`).join("")}
        </tbody>
      </table>`;
    }
  }

  document.querySelectorAll(".era-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".era-tab").forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      renderEra(tab.dataset.era);
    });
  });
  renderEra("1494");
}

// ==================== 06 窄屏模拟器 ====================
function initSec06() {
  const phoneBody = $("phone-body");
  const modeTag = $("phone-mode-tag");
  let strat = "freeze";
  let openIdx = 0;

  const copy = {
    freeze: {
      tag: "冻结首列 + 横向滚动",
      title: "冻结首列横滚：保住纵列比大小，接受左右滑",
      pro: "保住了什么：第一列品类名称牢牢钉在左缘，用户向左滑就能沿同一纵列继续比 Q1、环比、占比和达成率，非常适合财务报表和运营后台。",
      con: "牺牲了什么：第一眼看不到全部 6 列，必须给出明确的横向可滑视觉暗示（如冻结列右侧细分隔线），否则用户以为后面没数据。",
    },
    collapse: {
      tag: "折叠次列 + 点击展开",
      title: "折叠次要列：一屏零横滑，明细按需点开",
      pro: "保住了什么：主屏只留「品类 + 环比增长」两个核心决策列，既能纵向速比又能免去左右滑动，点击任意一行再展开 Q1、Q2 和达成率。",
      con: "牺牲了什么：无法同时横向比对 5 个品类的次要列（比如同时扫五行的目标达成率），展开多行后页面会变长。",
    },
    cards: {
      tag: "窄屏转卡片堆叠",
      title: "窄屏转卡片：单条信息最完整，但牺牲跨行对齐",
      pro: "保住了什么：不用横滑也不用点开，每张小卡把单品类的 4 个指标一次摆全，适合只看一两条订单/账单详情的消费级应用。",
      con: "牺牲了什么：原本在同一垂直轴上的数字被拆散进上下卡片里，跨行比大小变得费力——此时其实已经退出了表格布局，转向列表/卡片模式。",
    },
  };

  function renderSim() {
    const info = copy[strat];
    modeTag.textContent = info.tag;
    $("tradeoff-title").textContent = info.title;
    $("tradeoff-pro").innerHTML = `<strong>保住了什么：</strong>${info.pro.replace(/^保住了什么：/, "")}`;
    $("tradeoff-con").innerHTML = `<strong>牺牲了什么：</strong>${info.con.replace(/^牺牲了什么：/, "")}`;

    if (strat === "freeze") {
      phoneBody.innerHTML = `<div class="sim-freeze-wrap"><table class="sim-table">
        <thead><tr><th class="sticky-col">项目</th><th class="num">Q2</th><th class="num">环比</th><th class="num">占比</th><th class="num">达成</th></tr></thead>
        <tbody>${POSTER_ITEMS.slice(0, 4).map((r) => `<tr>
          <td class="sticky-col">${r.name}</td>
          <td class="num">${r.q2.toLocaleString("en-US")}</td>
          <td class="num">+${r.qoq.toFixed(1)}%</td>
          <td class="num">${r.realShare.toFixed(1)}%</td>
          <td class="num">${r.achieve}%</td>
        </tr>`).join("")}</tbody>
      </table></div>`;
    } else if (strat === "collapse") {
      phoneBody.innerHTML = POSTER_ITEMS.slice(0, 4).map((r, i) => `
        <div class="sim-collapse-row">
          <button type="button" class="sim-collapse-btn" data-cidx="${i}" aria-expanded="${i === openIdx}">
            <strong>${r.name}</strong>
            <span style="font-family:var(--font-mono);color:var(--emerald-text)">+${r.qoq.toFixed(1)}% ${i === openIdx ? "▲" : "▼"}</span>
          </button>
          ${i === openIdx ? `<div class="sim-collapse-detail"><span>Q1 ${r.q1}</span><span>Q2 ${r.q2}</span><span>占比 ${r.realShare}%</span><span>达成 ${r.achieve}%</span></div>` : ""}
        </div>
      `).join("");
    } else {
      phoneBody.innerHTML = `<div class="sim-cards">${POSTER_ITEMS.slice(0, 3).map((r) => `
        <div class="sim-card">
          <div class="sim-card-top"><span>${r.name}</span><span style="color:var(--emerald-text)">+${r.qoq.toFixed(1)}%</span></div>
          <div class="sim-card-meta"><span>Q2 ${r.q2}</span><span>占比 ${r.realShare}%</span><span>达成 ${r.achieve}%</span></div>
        </div>
      `).join("")}</div>`;
    }
  }

  phoneBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".sim-collapse-btn");
    if (!btn) return;
    const idx = Number(btn.dataset.cidx);
    openIdx = openIdx === idx ? -1 : idx;
    renderSim();
  });

  document.querySelectorAll("[data-mstrat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      strat = btn.dataset.mstrat;
      document.querySelectorAll("[data-mstrat]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      renderSim();
    });
  });

  renderSim();
}

// ==================== 07 单变量四选一小练习 ====================
function initSec07() {
  const grid = $("quiz-grid");
  const vBox = $("quiz-verdict");
  const vTitle = $("qv-title");
  const vReason = $("qv-reason");
  let chosen = null;

  function buildQuizTable(opt) {
    // 选完后在第二列右侧叠绘真实对齐透视线（直观呈现笔直 vs 锯齿漂移）
    const guidePaths = {
      A: `<path d="M168 38 L162 68 L160 98 L149 128" fill="none" stroke="#b52b21" stroke-width="2" stroke-dasharray="4 3"/>`,
      B: `<path d="M214 38 L214 68 L219 98 L214 128" fill="none" stroke="#b52b21" stroke-width="2" stroke-dasharray="4 3"/>`,
      C: `<path d="M218 12 L218 134" fill="none" stroke="#018868" stroke-width="2.2" stroke-dasharray="4 3"/>`,
      D: `<path d="M188 38 L184 68 L181 98 L175 128" fill="none" stroke="#b52b21" stroke-width="2" stroke-dasharray="4 3"/>`,
    };
    return `<button type="button" class="quiz-opt" data-qid="${opt.id}" aria-pressed="false">
      <div class="quiz-opt-head">
        <span>${opt.label}</span>
        <span class="quiz-badge" data-qbadge="${opt.id}">点击选择</span>
      </div>
      <div class="mini-q-wrap">
        <table class="mini-q-table ${opt.cls}">
          <thead><tr><th class="qt">大区</th><th class="qn">季度营收</th><th class="qn">环比</th></tr></thead>
          <tbody>
            ${QUIZ_DATA.map((d) => `<tr><td class="qt">${d.region}</td><td class="qn">${d.rev}</td><td class="qn">${d.qoq}</td></tr>`).join("")}
          </tbody>
        </table>
        <svg class="quiz-guide-svg" viewBox="0 0 320 144" preserveAspectRatio="none" aria-hidden="true">
          ${guidePaths[opt.id]}
        </svg>
      </div>
    </button>`;
  }

  grid.innerHTML = QUIZ_OPTIONS.map(buildQuizTable).join("");

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".quiz-opt");
    if (!btn) return;
    const id = btn.dataset.qid;
    chosen = QUIZ_OPTIONS.find((o) => o.id === id);
    grid.classList.add("revealed");

    grid.querySelectorAll(".quiz-opt").forEach((el) => {
      const oid = el.dataset.qid;
      const o = QUIZ_OPTIONS.find((x) => x.id === oid);
      el.setAttribute("aria-pressed", String(oid === id));
      el.classList.toggle("is-right", o.ok);
      el.classList.toggle("is-wrong", oid === id && !o.ok);
      const b = el.querySelector(`[data-qbadge="${oid}"]`);
      if (b) {
        if (o.ok) b.textContent = "最佳排法 ✓";
        else if (oid === id) b.textContent = "有对齐隐患 ×";
        else b.textContent = "可对比查看";
      }
    });

    vBox.dataset.state = chosen.ok ? "right" : "wrong";
    vTitle.textContent = chosen.title;
    vReason.textContent = chosen.reason;
  });
}

// ==================== 08 原海报放大、拖动平移与 Esc 关闭 ====================
function initPosterLightbox() {
  const posterImg = $("poster");
  const openBtn = $("poster-btn");
  const lb = $("poster-lightbox");
  const lbImg = $("lb-img");
  const lbStage = $("lb-stage");
  const scaleEl = $("lb-scale");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  const applyTransform = () => {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    scaleEl.textContent = `${Math.round(scale * 100)}%`;
  };

  const open = () => {
    lbImg.src = posterImg.src;
    scale = 1.25;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    $("lb-close").focus();
  };

  const close = () => {
    lb.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  };

  openBtn.addEventListener("click", open);
  $("lb-close").addEventListener("click", close);
  $("lb-zoom-in").addEventListener("click", () => { scale = Math.min(3.5, scale + 0.35); applyTransform(); });
  $("lb-zoom-out").addEventListener("click", () => { scale = Math.max(0.75, scale - 0.35); applyTransform(); });
  $("lb-reset").addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.18 : -0.18;
    scale = Math.min(3.5, Math.max(0.75, scale + delta));
    applyTransform();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    pan = { x: e.clientX - tx, y: e.clientY - ty };
    try { lbStage.setPointerCapture(e.pointerId); } catch {}
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!pan) return;
    tx = e.clientX - pan.x;
    ty = e.clientY - pan.y;
    applyTransform();
  });
  const endPan = () => { pan = null; };
  lbStage.addEventListener("pointerup", endPan);
  lbStage.addEventListener("pointercancel", endPan);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

export function initLabs() {
  initSec01();
  initSec02();
  initSec03();
  initSec04();
  initSec05();
  initSec06();
  initSec07();
  initPosterLightbox();
}

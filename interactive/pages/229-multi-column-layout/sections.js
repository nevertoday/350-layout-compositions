// 01–08 节各自的独立交互模块（相邻两节绝不用同一种控件做同一件事）

import { loop, pixelRatio } from "../../lib/stage.js";
import {
  ERAS,
  MATRIX_LEADINGS,
  MATRIX_GAPS_EM,
  evaluateMatrixCell,
  DEVICE_WIDTHS,
  CSS_STRATEGIES,
  computeMulticol,
  YOYO_SCENARIOS,
  computeYoyoTravel,
  QUIZ_OPTIONS,
} from "./model.js";

// ==================== 01 节：眼动回扫模拟器（2D Canvas + 栏数切换 + 播放/暂停） ====================
export function initEyeSweep() {
  const canvas = document.getElementById("sweep-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const btns = [...document.querySelectorAll("[data-sweep-cols]")];
  const toggleBtn = document.getElementById("sweep-toggle");
  const noteEl = document.getElementById("sweep-note");
  const statJump = document.getElementById("sweep-jump");
  const statRisk = document.getElementById("sweep-risk");

  let cols = 1;
  let playing = true;
  let clock = 0;

  const INFO = {
    1: {
      jump: "回扫跨度 100% 版宽（长跳）",
      risk: "易串行 / 漏行",
      note: "整幅通栏排满时，每行约 48 个汉字。眼睛扫到最右端后再斜跨整屏折回下一行开头，落点偏差大，读几段就开始发累。",
    },
    2: {
      jump: "回扫跨度 47% 版宽（中短）",
      risk: "稳健舒适",
      note: "拆成双栏后，单行缩到约 23 个汉字，每次换行回扫的距离折半，视线能轻松咬住下一行起首。",
    },
    3: {
      jump: "回扫跨度 30% 版宽（短促）",
      risk: "节奏明快（需配足栏距）",
      note: "拆成三栏后单行约 15 个汉字，适合快节奏导读、杂志内页与报刊专栏——前提是栏距要宽于行间净空。",
    },
  };

  function updateInfo() {
    const info = INFO[cols];
    if (noteEl) noteEl.textContent = info.note;
    if (statJump) statJump.textContent = info.jump;
    if (statRisk) {
      statRisk.textContent = info.risk;
      statRisk.dataset.warn = cols === 1 ? "1" : "0";
    }
    btns.forEach((b) => b.setAttribute("aria-pressed", Number(b.dataset.sweepCols) === cols ? "true" : "false"));
    if (toggleBtn) toggleBtn.textContent = playing ? "暂停模拟" : "继续模拟";
  }

  function draw(t, dt, { still }) {
    if (playing && !still) clock += dt;
    const dpr = pixelRatio(2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(180, Math.round(rect.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 暖纸底
    ctx.fillStyle = "#F9F4EC";
    ctx.fillRect(0, 0, w, h);

    const padX = 24;
    const padY = 26;
    const gap = cols === 1 ? 0 : 22;
    const colW = (w - padX * 2 - gap * (cols - 1)) / cols;
    const linesPerCol = 6;
    const lineH = (h - padY * 2) / linesPerCol;

    // 绘制模拟文本行条（每栏 6 行）
    const lineSegs = [];
    for (let c = 0; c < cols; c++) {
      const x0 = padX + c * (colW + gap);
      // 淡栏底
      ctx.fillStyle = "rgba(233, 222, 201, 0.45)";
      ctx.fillRect(x0 - 4, padY - 10, colW + 8, h - padY * 2 + 12);

      for (let l = 0; l < linesPerCol; l++) {
        const y = padY + l * lineH + lineH * 0.36;
        const len = l === linesPerCol - 1 ? colW * 0.68 : colW * (0.94 + ((l * 13 + c * 7) % 5) * 0.012);
        ctx.fillStyle = "#C9C2B3";
        ctx.fillRect(x0, y - 3, len, 6);
        lineSegs.push({ c, l, x0, x1: x0 + len, y });
      }
    }

    // 计算当前眼动进度（每行读 0.65s + 回扫 0.28s）
    const totalLines = lineSegs.length;
    const cycleDur = totalLines * 0.93;
    const curTime = still ? 1.45 : clock % cycleDur;
    const idx = Math.min(totalLines - 1, Math.floor(curTime / 0.93));
    const frac = (curTime % 0.93) / 0.93;

    // 已读过的回扫斜线（1 栏时用警示红体现超长对角折返，2/3 栏用松绿体现短促利落）
    ctx.save();
    for (let i = 0; i < idx; i++) {
      const a = lineSegs[i];
      const b = lineSegs[i + 1];
      if (!b) break;
      const crossCol = a.c !== b.c;
      ctx.strokeStyle = crossCol
        ? "rgba(232, 93, 65, 0.72)"
        : cols === 1
        ? "rgba(201, 59, 30, 0.55)"
        : "rgba(22, 56, 40, 0.36)";
      ctx.lineWidth = crossCol ? 1.8 : 1.3;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(a.x1, a.y);
      if (crossCol) {
        const mx = (a.x1 + b.x0) / 2;
        ctx.bezierCurveTo(mx, a.y + 10, mx, b.y - 10, b.x0, b.y);
      } else {
        ctx.lineTo(b.x0, b.y);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 当前注视点位置
    const seg = lineSegs[idx];
    const nextSeg = lineSegs[idx + 1] || lineSegs[0];
    let gx = seg.x0;
    let gy = seg.y;
    let isReturn = false;

    if (frac < 0.7) {
      const p = frac / 0.7;
      gx = seg.x0 + (seg.x1 - seg.x0) * p;
      gy = seg.y;
      // 正在阅读的墨绿高亮行
      ctx.fillStyle = "#163828";
      ctx.fillRect(seg.x0, seg.y - 3, gx - seg.x0, 6);
    } else {
      isReturn = true;
      const p = (frac - 0.7) / 0.3;
      // 回扫轨迹
      gx = seg.x1 + (nextSeg.x0 - seg.x1) * p;
      gy = seg.y + (nextSeg.y - seg.y) * p;
      ctx.fillStyle = "#163828";
      ctx.fillRect(seg.x0, seg.y - 3, seg.x1 - seg.x0, 6);
      ctx.strokeStyle = cols === 1 ? "#C93B1E" : "#E85D41";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y);
      ctx.lineTo(gx, gy);
      ctx.stroke();
    }

    // 视线圆点
    ctx.fillStyle = isReturn && cols === 1 ? "#C93B1E" : "#E85D41";
    ctx.beginPath();
    ctx.arc(gx, gy, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#F9F4EC";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 底部标注单行回扫长度标尺（文字配底色避开红线穿越）
    const rY = h - 12;
    ctx.strokeStyle = cols === 1 ? "#C93B1E" : "#163828";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padX, rY);
    ctx.lineTo(padX + colW, rY);
    ctx.moveTo(padX, rY - 4);
    ctx.lineTo(padX, rY + 4);
    ctx.moveTo(padX + colW, rY - 4);
    ctx.lineTo(padX + colW, rY + 4);
    ctx.stroke();

    const mLabel = `1-COL MEASURE ${Math.round((colW / (w - padX * 2)) * 100)}%`;
    ctx.font = '700 10px "Space Mono", monospace';
    const mw = ctx.measureText(mLabel).width + 10;
    ctx.fillStyle = "#F9F4EC";
    ctx.fillRect(w - padX - mw, rY - 8, mw, 14);
    ctx.fillStyle = cols === 1 ? "#B9381E" : "#163828";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(mLabel, w - padX - 4, rY);
    ctx.restore();
  }

  const runner = loop(canvas, draw);
  btns.forEach((b) => {
    b.addEventListener("click", () => {
      cols = Number(b.dataset.sweepCols);
      clock = 0;
      updateInfo();
      runner.draw();
    });
  });
  toggleBtn?.addEventListener("click", () => {
    playing = !playing;
    updateInfo();
    runner.draw();
  });
  updateInfo();
  runner.draw();
}

// ==================== 02 节：四时代历史版样切换书签 ====================
export function initEraSpecimen() {
  const tabs = [...document.querySelectorAll("[data-era]")];
  const yearEl = document.getElementById("era-year");
  const titleEl = document.getElementById("era-title");
  const summaryEl = document.getElementById("era-summary");
  const noteEl = document.getElementById("era-note");
  const accentEl = document.getElementById("era-accent");
  const diagramEl = document.getElementById("era-diagram");
  if (!tabs.length || !diagramEl) return;

  function render(key) {
    const era = ERAS[key] || ERAS.b42;
    tabs.forEach((t) => {
      const on = t.dataset.era === key;
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (yearEl) yearEl.textContent = era.year;
    if (titleEl) titleEl.textContent = era.title;
    if (summaryEl) summaryEl.textContent = era.summary;
    if (noteEl) noteEl.textContent = era.note;
    if (accentEl) accentEl.textContent = era.accent;

    // 动态渲染对应时代的微型结构解剖图
    const colsHtml = Array.from({ length: era.cols }, (_, ci) => {
      const bars = Array.from({ length: era.linesPerCol }, (_, li) => {
        const w = li === era.linesPerCol - 1 ? 66 : 92 + ((ci * 7 + li * 11) % 8);
        const dropCap = key === "b42" && ci === 0 && li === 0 ? `<span class="era-dropcap">B</span>` : "";
        return `<span class="era-line" style="width:${w}%">${dropCap}</span>`;
      }).join("");
      return `<div class="era-col">${bars}</div>`;
    }).join("");

    diagramEl.dataset.era = key;
    diagramEl.innerHTML = `
      <div class="era-sheet ${era.fluid ? "is-fluid" : "is-fixed"}">
        <div class="era-sheet-top">
          <span>${era.fluid ? "视口宽度可变 · 高度随内容滚动" : "固定纸张开本 · 栏高受限于纸页"}</span>
          <span>${era.cols} 栏</span>
        </div>
        ${era.spanBar ? `<div class="era-span-head">SPANNING HEADLINE · 通栏主标</div>` : ""}
        <div class="era-cols" style="--ec:${era.cols}">${colsHtml}</div>
      </div>
    `;
  }

  tabs.forEach((t) => t.addEventListener("click", () => render(t.dataset.era)));
  render("b42");
}

// ==================== 03 节：栏距 × 行距 4×4 点击矩阵 + 竖分隔线开关 ====================
export function initGutterMatrix() {
  const gridEl = document.getElementById("gutter-matrix");
  const ruleBtn = document.getElementById("matrix-rule-btn");
  const sampleEl = document.getElementById("matrix-sample");
  const tagEl = document.getElementById("matrix-tag");
  const ratioEl = document.getElementById("matrix-ratio");
  const verdictEl = document.getElementById("matrix-verdict");
  if (!gridEl || !sampleEl) return;

  let activeL = 1.75;
  let activeG = 0.5; // 默认落到海报下限 0.5em，立刻看清无竖线为何串行
  let hasRule = false;

  function render() {
    gridEl.innerHTML = "";
    // 左上角表头
    const corner = document.createElement("div");
    corner.className = "mx-head mx-corner";
    corner.textContent = "行高 \\ 栏距";
    gridEl.append(corner);

    for (const g of MATRIX_GAPS_EM) {
      const th = document.createElement("div");
      th.className = "mx-head";
      th.textContent = `${g}em`;
      gridEl.append(th);
    }

    for (const l of MATRIX_LEADINGS) {
      const rh = document.createElement("div");
      rh.className = "mx-rowhead";
      rh.textContent = `${l.toFixed(2)}`;
      gridEl.append(rh);

      for (const g of MATRIX_GAPS_EM) {
        const res = evaluateMatrixCell(l, g, hasRule);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `mx-cell is-${res.grade}`;
        const isCur = l === activeL && g === activeG;
        btn.setAttribute("aria-pressed", isCur ? "true" : "false");
        btn.innerHTML = `<span class="mx-ratio">${res.ratio.toFixed(1)}×</span><span class="mx-mini">${res.grade === "good" ? "稳" : res.grade === "slip" ? "串" : "散"}</span>`;
        btn.addEventListener("click", () => {
          activeL = l;
          activeG = g;
          render();
        });
        gridEl.append(btn);
      }
    }

    const cur = evaluateMatrixCell(activeL, activeG, hasRule);
    sampleEl.style.lineHeight = String(activeL);
    sampleEl.style.columnGap = `${activeG}em`;
    sampleEl.style.columnRule = hasRule ? "1px solid rgba(249, 244, 236, 0.38)" : "none";
    sampleEl.dataset.grade = cur.grade;

    if (tagEl) {
      tagEl.textContent = cur.tag;
      tagEl.dataset.grade = cur.grade;
    }
    if (ratioEl) {
      ratioEl.textContent = `栏距 ${cur.gapPx.toFixed(0)}px ÷ 行间净空 ${cur.lineGapPx.toFixed(1)}px = ${cur.ratio.toFixed(2)}×`;
    }
    if (verdictEl) verdictEl.textContent = cur.verdict;
    if (ruleBtn) {
      ruleBtn.setAttribute("aria-pressed", hasRule ? "true" : "false");
      ruleBtn.textContent = hasRule ? "竖分隔线 column-rule：开" : "竖分隔线 column-rule：关";
    }
  }

  ruleBtn?.addEventListener("click", () => {
    hasRule = !hasRule;
    render();
  });

  render();
}

// ==================== 04 节：W3C 算栏伪算法四设备宽对照 ====================
export function initAlgoCompare() {
  const devBtns = [...document.querySelectorAll("[data-dev-w]")];
  const cardsWrap = document.getElementById("algo-cards");
  if (!devBtns.length || !cardsWrap) return;

  let curW = 320; // 默认从最容易踩坑的 320px 手机宽开始，直观看到 column-count: 3 怎么挤扁！

  function render() {
    devBtns.forEach((b) => b.setAttribute("aria-pressed", Number(b.dataset.devW) === curW ? "true" : "false"));
    cardsWrap.innerHTML = CSS_STRATEGIES.map((s) => {
      const r = computeMulticol(curW, s);
      const chars = r.W / 15;
      const tooTight = r.N > 1 && chars < 11.5;
      const tooMany = r.N >= 5;
      const status = tooTight ? "文字挤成窄条" : tooMany ? "过宽屏易拆太细" : "自动落位舒适";
      const cls = tooTight ? "is-bad" : tooMany ? "is-warn" : "is-good";
      const bars = Array.from({ length: r.N }, (_, i) => {
        return `<div class="algo-col"><span>第 ${i + 1} 栏</span><b>${Math.round(r.W)}px</b></div>`;
      }).join("");
      return `
        <article class="algo-card ${cls}">
          <div class="algo-top">
            <div>
              <h3>${s.name}</h3>
              <code>${s.code}</code>
            </div>
            <span class="algo-badge">${status}</span>
          </div>
          <div class="algo-viz" style="--ac:${r.N}">${bars}</div>
          <p class="algo-formula">${s.formulaText(curW, r)}（约 ${chars.toFixed(1)} 汉字/行）</p>
        </article>
      `;
    }).join("");
  }

  devBtns.forEach((b) => {
    b.addEventListener("click", () => {
      curW = Number(b.dataset.devW);
      render();
    });
  });

  render();
}

// ==================== 05 节：三处错版热点逐项点击修复 ====================
export function initFragmentRepair() {
  const sample = document.getElementById("frag-sample");
  const btns = [...document.querySelectorAll("[data-fix]")];
  const progress = document.getElementById("frag-progress");
  const explain = document.getElementById("frag-explain");
  if (!sample || !btns.length) return;

  const fixed = { heading: false, card: false, fill: false };

  const NOTES = {
    heading: "加上 break-after: avoid 后，孤立小标题不再粘在第一栏最底端，自动带着正文首行一起落到第二栏顶部。",
    card: "加上 break-inside: avoid 后，整张数据卡片作为一个不可切分的整体完整进入下一栏，不再拦腰断裂。",
    fill: "把定高容器的 column-fill 从 auto 切回 balance，浏览器重新平衡各栏高度，消灭右侧大片空洞。",
  };

  function render(lastKey) {
    sample.classList.toggle("fix-heading", fixed.heading);
    sample.classList.toggle("fix-card", fixed.card);
    sample.classList.toggle("fix-fill", fixed.fill);

    const doneCount = Object.values(fixed).filter(Boolean).length;
    if (progress) {
      progress.textContent = doneCount === 3 ? "3 / 3 全部修平" : `已修复 ${doneCount} / 3 处断点毛病`;
      progress.dataset.ok = doneCount === 3 ? "1" : "0";
    }
    if (explain) {
      explain.textContent = lastKey
        ? NOTES[lastKey]
        : "点按旁边三个朱红病灶按钮，逐一为这份定高多栏专栏补上 CSS Fragmentation 规则。";
    }

    btns.forEach((b) => {
      const k = b.dataset.fix;
      b.setAttribute("aria-pressed", fixed[k] ? "true" : "false");
    });
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.fix;
      fixed[k] = !fixed[k];
      render(fixed[k] ? k : null);
    });
  });

  render(null);
}

// ==================== 06 节：溜溜球往返滚屏模拟器 ====================
export function initYoyoSim() {
  const btns = [...document.querySelectorAll("[data-yoyo]")];
  const vpEl = document.getElementById("yoyo-viewport");
  const titleEl = document.getElementById("yoyo-title");
  const explainEl = document.getElementById("yoyo-explain");
  const metricReturns = document.getElementById("yoyo-returns");
  const metricTravel = document.getElementById("yoyo-travel");
  const verdictEl = document.getElementById("yoyo-verdict");
  if (!btns.length || !vpEl) return;

  function render(key) {
    const sc = YOYO_SCENARIOS[key] || YOYO_SCENARIOS.tall;
    const stats = computeYoyoTravel(sc);

    btns.forEach((b) => b.setAttribute("aria-pressed", b.dataset.yoyo === key ? "true" : "false"));
    if (titleEl) titleEl.textContent = sc.title;
    if (explainEl) explainEl.textContent = sc.explain;
    if (metricReturns) metricReturns.textContent = `${stats.returns} 次折返爬楼`;
    if (metricTravel) metricTravel.textContent = `${stats.totalScreens} 屏总滚动量`;
    if (verdictEl) {
      verdictEl.textContent = sc.verdict;
      verdictEl.dataset.ok = sc.ok ? "1" : "0";
    }

    // 用等比缩放 SVG 清晰画出「视口框（1.0 屏）」vs「实际 3 栏总高度」以及上下往返箭头
    const boxW = 360;
    const screenH = 66;
    const colH = Math.round(screenH * sc.colHeightScreens);
    const svgH = Math.max(screenH + 34, colH + 34);
    const cW = 86;
    const gap = 22;
    const x0 = 30;
    const y0 = 16;

    const cols = [0, 1, 2]
      .map((i) => {
        const cx = x0 + i * (cW + gap);
        return `
          <rect x="${cx}" y="${y0}" width="${cW}" height="${colH}" fill="#E9DEC9" stroke="#163828" stroke-opacity="0.28"/>
          <text x="${cx + cW / 2}" y="${y0 + 16}" text-anchor="middle" fill="#163828" font-size="11" font-weight="700">第 ${i + 1} 栏</text>
        `;
      })
      .join("");

    // 往返滚屏红色箭头路径
    const arrows = [0, 1]
      .map((i) => {
        const xA = x0 + i * (cW + gap) + cW * 0.5;
        const xB = x0 + (i + 1) * (cW + gap) + cW * 0.5;
        const yBot = y0 + colH - 8;
        const yTop = y0 + 24;
        const color = sc.ok ? "#163828" : "#C93B1E";
        return `
          <line x1="${xA}" y1="${yTop}" x2="${xA}" y2="${yBot}" stroke="${color}" stroke-width="2" stroke-dasharray="4 3"/>
          <path d="M ${xA} ${yBot} C ${(xA + xB) / 2} ${yBot + 12}, ${(xA + xB) / 2} ${yTop - 12}, ${xB} ${yTop}" fill="none" stroke="${color}" stroke-width="2.2"/>
          <circle cx="${xB}" cy="${yTop}" r="3.5" fill="${color}"/>
        `;
      })
      .join("");

    vpEl.innerHTML = `
      <svg viewBox="0 0 ${boxW} ${svgH}" role="img" aria-label="视口高度与三栏高度对比示意图">
        ${cols}
        ${arrows}
        <rect x="12" y="${y0 - 4}" width="${boxW - 24}" height="${screenH + 4}" fill="rgba(22, 56, 40, 0.08)" stroke="#163828" stroke-width="2" stroke-dasharray="6 4"/>
        <rect x="${boxW - 144}" y="${y0 + screenH - 19}" width="128" height="16" fill="#F9F4EC" fill-opacity="0.94" stroke="#163828" stroke-opacity="0.35"/>
        <text x="${boxW - 20}" y="${y0 + screenH - 7}" text-anchor="end" fill="#163828" font-size="10.5" font-weight="700">首屏可见窗口（1.0 屏）</text>
      </svg>
    `;
  }

  btns.forEach((b) => b.addEventListener("click", () => render(b.dataset.yoyo)));
  render("tall");
}

// ==================== 07 节：单变量小练习（只差 column-gap） ====================
export function initQuiz() {
  const grid = document.getElementById("quiz-grid");
  const feedback = document.getElementById("quiz-feedback");
  if (!grid || !feedback) return;

  let picked = null;

  function render() {
    grid.innerHTML = QUIZ_OPTIONS.map((opt) => {
      const isPicked = picked === opt.id;
      let cls = "quiz-card";
      if (picked) {
        if (opt.correct) cls += " is-right";
        else if (isPicked) cls += " is-wrong";
      }
      // 缩比 0.45 模拟 720px 三栏报样上的栏距比例（严格保持 6 : 10 : 26 : 64 真实比例）
      const scaledGap = Math.max(2, Math.round(opt.gapPx * 0.45));
      return `
        <button type="button" class="${cls}" data-quiz="${opt.id}" aria-pressed="${isPicked ? "true" : "false"}">
          <div class="qz-head">
            <span class="qz-id">${opt.title}</span>
            ${picked ? `<span class="qz-meta">${opt.meta}（${opt.gapEm}）</span>` : `<span class="qz-meta">3 栏 · 无竖线</span>`}
          </div>
          <div class="qz-mini-sheet">
            <div class="qz-mini-span">城市慢读导览简报</div>
            <div class="qz-mini-cols" style="column-gap:${scaledGap}px">
              <p>多栏让过宽的纸面拆成紧凑的视线通道，减少换行回扫偏差，让连续阅读更轻松。</p>
              <p>栏与栏之间需要足够清晰的空隙，读者才不会把左栏行尾误接成右栏正文。</p>
              <p>跨栏标题稳住整版重心，防断块规则护住小图卡，使全文自左而右顺畅流完。</p>
            </div>
          </div>
        </button>
      `;
    }).join("");

    grid.querySelectorAll("[data-quiz]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked = btn.dataset.quiz;
        const opt = QUIZ_OPTIONS.find((x) => x.id === picked);
        feedback.hidden = false;
        feedback.dataset.ok = opt.correct ? "1" : "0";
        feedback.innerHTML = `
          <p class="qf-title">${opt.correct ? "判断准确 · 方案 C" : `再看一眼 · 你选了 ${opt.title}`}</p>
          <p>${opt.feedback}</p>
        `;
        render();
      });
    });
  }

  render();
}

// ==================== 08 节：原海报灯箱（放大、拖动、Esc 关，draggable="false"） ====================
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const modal = document.getElementById("poster-modal");
  const modalImg = document.getElementById("poster-modal-img");
  const stage = document.getElementById("poster-modal-stage");
  const btnIn = document.getElementById("pm-in");
  const btnOut = document.getElementById("pm-out");
  const btnReset = document.getElementById("pm-reset");
  const btnClose = document.getElementById("pm-close");
  const zoomReadout = document.getElementById("pm-zoom");
  if (!poster || !modal || !modalImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let panning = false;
  let sx = 0;
  let sy = 0;
  let stx = 0;
  let sty = 0;

  function applyTransform() {
    modalImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    if (zoomReadout) zoomReadout.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    modalImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    btnClose?.focus();
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  openBtn?.addEventListener("click", open);
  poster.addEventListener("click", open);
  btnClose?.addEventListener("click", close);

  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) close();
  });

  btnIn?.addEventListener("click", () => {
    scale = Math.min(3.5, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  btnOut?.addEventListener("click", () => {
    scale = Math.max(0.7, +(scale - 0.35).toFixed(2));
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  btnReset?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = Math.min(3.5, Math.max(0.7, +(scale + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2)));
      applyTransform();
    },
    { passive: false }
  );

  modalImg.addEventListener("pointerdown", (e) => {
    panning = true;
    sx = e.clientX;
    sy = e.clientY;
    stx = tx;
    sty = ty;
    modalImg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  modalImg.addEventListener("pointermove", (e) => {
    if (!panning) return;
    tx = stx + (e.clientX - sx);
    ty = sty + (e.clientY - sy);
    applyTransform();
  });
  const endPan = () => {
    panning = false;
  };
  modalImg.addEventListener("pointerup", endPan);
  modalImg.addEventListener("pointercancel", endPan);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
}

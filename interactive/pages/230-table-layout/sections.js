// 230 表格布局 · 第 01–09 节独立互动实验台
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  ALIGN_LAB_DATA,
  ANATOMY_LAYERS,
  HISTORY_NODES,
  INK_STEPS,
  MOBILE_STRATEGIES,
  QUIZ_DATA,
  QUIZ_OPTIONS,
  STRESS_PAYLOADS,
  TRIAGE_SCENARIOS,
  formatLabNumber,
} from "./model.js";

// ---------- 01 · 原海报 5×5 几何矩阵语义解剖器 ----------
function initAnatomyLab() {
  const root = document.getElementById("anatomy-lab");
  if (!root) return;
  const tagEl = document.getElementById("anat-tag");
  const quoteEl = document.getElementById("anat-quote");
  const explainEl = document.getElementById("anat-explain");
  const srEl = document.getElementById("anat-sr");
  const cells = [...root.querySelectorAll("[data-mcell]")];
  const btns = [...root.querySelectorAll("[data-layer]")];

  let activeLayer = "row";

  function applyLayer(layerKey) {
    activeLayer = layerKey;
    const info = ANATOMY_LAYERS[layerKey];
    if (!info) return;
    const hitSet = new Set(info.cells.map(([r, c]) => `${r}-${c}`));
    cells.forEach((cell) => {
      const hit = hitSet.has(cell.dataset.mcell);
      cell.classList.toggle("is-lit", hit);
    });
    btns.forEach((b) => {
      const on = b.dataset.layer === layerKey;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    tagEl.textContent = info.tag;
    quoteEl.textContent = `「${info.posterQuote}」`;
    explainEl.textContent = info.explain;
    srEl.textContent = info.sr;
  }

  btns.forEach((btn) => {
    btn.addEventListener("click", () => applyLayer(btn.dataset.layer));
  });

  // 直接点击矩阵单元格可回显它所属的具体二维坐标
  cells.forEach((cell) => {
    cell.addEventListener("click", () => {
      const [r, c] = cell.dataset.mcell.split("-").map(Number);
      const colNames = ["项目", "第一列", "第二列", "第三列", "第四列"];
      const rowNames = ["第一行", "第二行", "第三行", "第四行", "第五行"];
      const val = cell.dataset.symbol || cell.textContent.trim();
      cells.forEach((el) => {
        const [er, ec] = el.dataset.mcell.split("-").map(Number);
        el.classList.toggle("is-lit", er === r || ec === c);
      });
      btns.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      tagEl.textContent = `单元格坐标 · 第 ${r + 1} 行 × 第 ${c + 1} 列`;
      quoteEl.textContent = `「${rowNames[r]}」与「${colNames[c]}」的交集`;
      explainEl.textContent = `点亮整行与整列后，你能立刻定位这个最小数据单元（当前内容：${val}）的唯一含义。`;
      srEl.textContent = `读屏器播报：「${rowNames[r]}，${colNames[c]}：${val}（行 ${r + 1}，列 ${c + 1}）」`;
    });
  });

  applyLayer(activeLayer);
}

// ---------- 02 · 左文右数与 Ehrenberg 精度取整 · 2D Canvas 扫视路径仪 ----------
function initAlignLab() {
  const root = document.getElementById("align-lab");
  const canvas = document.getElementById("align-canvas");
  const slider = document.getElementById("align-precision");
  const precVal = document.getElementById("align-prec-val");
  const readout = document.getElementById("align-readout");
  const sortToggle = document.getElementById("align-sort-btn");
  if (!root || !canvas || !slider) return;

  const ctx = canvas.getContext("2d");
  const modes = ["raw", "fixed2", "ehrenberg"];
  const modeLabels = ["原始杂乱小数（0–3 位）", "统一 2 位小数", "两位有效数字（Ehrenberg）"];
  let precIdx = 0;
  let sorted = false;
  let phase = 0;

  function getRows() {
    const list = [...ALIGN_LAB_DATA];
    if (sorted) list.sort((a, b) => b.raw - a.raw);
    return list;
  }

  function updateReadout() {
    const mode = modes[precIdx];
    precVal.textContent = modeLabels[precIdx];
    if (mode === "raw") {
      readout.textContent =
        "左侧居中且小数位参差（0–3 位），眼睛每往下扫一行都要横向大幅折返寻找小数点；右侧右对齐加等宽数字后，就算数值长短不一，量级轮廓仍一眼分明。试着把精度滑到「两位有效数字」。";
    } else if (mode === "fixed2") {
      readout.textContent =
        "统一保留 2 位小数后，右侧每一行的小数点、个位、千分位严丝合缝排成一条直线；左侧因为居中排布，长短数字依然左右摆动。";
    } else {
      readout.textContent =
        "按 Ehrenberg（1977）原则化简为两位有效数字（以千元为单位）" +
        (sorted ? "，再叠加从大到小排序，华北 125k 到西南 0.9k 的阶梯一眼看透！" : "，大脑短期记忆负担大减；再点「按大小排序」，规律会瞬间浮现。");
    }
  }

  function draw(t, { still }) {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(240, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 淡紫账本底面
    ctx.fillStyle = "#1F0B31";
    ctx.fillRect(0, 0, w, h);

    const rows = getRows();
    const mode = modes[precIdx];
    const compact = w < 460;
    const padX = compact ? 10 : 22;
    const mid = w / 2;
    const colW = mid - padX * 1.4;
    const headY = 32;
    const rowStart = 58;
    const rowH = (h - rowStart - 18) / rows.length;
    const fontSize = compact ? 11.5 : 14;

    // 中线
    ctx.strokeStyle = "rgba(243, 222, 250, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mid, 14);
    ctx.lineTo(mid, h - 14);
    ctx.stroke();

    // 左右标题
    ctx.font = `700 ${w < 420 ? 11 : 12}px "IBM Plex Sans", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillStyle = "#FF7E97";
    ctx.fillText("× 居中 · 比例字", padX, headY);
    ctx.fillStyle = "#7EE0B5";
    ctx.fillText("✓ 左文右数 · 等宽数字", mid + padX * 0.7, headY);

    // 扫描点进度（reducedMotion 时直接展示完整轨迹）
    const scanPos = still ? rows.length - 1 : ((phase % 4.2) / 3.2) * (rows.length - 1);
    const clampedPos = Math.min(rows.length - 1, Math.max(0, scanPos));

    const leftPts = [];
    const rightPts = [];

    rows.forEach((r, idx) => {
      const y = rowStart + idx * rowH + rowH * 0.52;
      const text = formatLabNumber(r.raw, mode);

      // 细横线
      ctx.strokeStyle = "rgba(243, 222, 250, 0.14)";
      ctx.beginPath();
      ctx.moveTo(padX, y + rowH * 0.42);
      ctx.lineTo(mid - padX * 0.7, y + rowH * 0.42);
      ctx.moveTo(mid + padX * 0.7, y + rowH * 0.42);
      ctx.lineTo(w - padX, y + rowH * 0.42);
      ctx.stroke();

      // 左侧面板：标签居中 + 数字居中（无等宽）
      const lxArea = padX;
      const lNumCenter = lxArea + colW * (compact ? 0.65 : 0.72);
      ctx.font = `400 ${fontSize}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "rgba(240, 229, 214, 0.78)";
      ctx.textAlign = "center";
      ctx.fillText(r.region, lxArea + colW * (compact ? 0.16 : 0.22), y);

      ctx.font = `500 ${fontSize}px "IBM Plex Sans", sans-serif`;
      ctx.fillStyle = "#FCFAF8";
      ctx.textAlign = "center";
      ctx.fillText(text, lNumCenter, y);
      const lw = ctx.measureText(text).width;
      leftPts.push({ x: Math.min(mid - 8, lNumCenter + lw / 2 + 4), y: y - 4 });

      // 右侧面板：文字左对齐 + 数字右对齐 + DM Mono 等宽数字
      const rxArea = mid + padX * 0.7;
      const rNumRight = w - padX - 8;
      ctx.font = `400 ${fontSize}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "rgba(240, 229, 214, 0.88)";
      ctx.textAlign = "left";
      ctx.fillText(r.region, rxArea, y);

      ctx.font = `500 ${fontSize}px "DM Mono", monospace`;
      ctx.fillStyle = "#F0E5D6";
      ctx.textAlign = "right";
      ctx.fillText(text, rNumRight, y);
      rightPts.push({ x: rNumRight + 4, y: y - 4 });
    });

    // 绘制左右扫视路径（左侧锯齿折返 vs 右侧笔直铅垂线）
    const drawPath = (pts, color, dashed) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash(dashed ? [4, 3] : []);
      ctx.beginPath();
      pts.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
      ctx.stroke();
      ctx.setLineDash([]);
      pts.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      });

      // 动态视线光点
      const i0 = Math.floor(clampedPos);
      const i1 = Math.min(pts.length - 1, i0 + 1);
      const frac = clampedPos - i0;
      const px = pts[i0].x + (pts[i1].x - pts[i0].x) * frac;
      const py = pts[i0].y + (pts[i1].y - pts[i0].y) * frac;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawPath(leftPts, "#FF7E97", false);
    drawPath(rightPts, "#7EE0B5", true);
  }

  const ctrl = loop(root, (t, dt, opts) => {
    if (!opts.still) phase += dt;
    draw(t, opts);
  });

  slider.addEventListener("input", () => {
    precIdx = Number(slider.value);
    updateReadout();
    ctrl.draw();
  });

  if (sortToggle) {
    sortToggle.addEventListener("click", () => {
      sorted = !sorted;
      sortToggle.classList.toggle("is-active", sorted);
      sortToggle.setAttribute("aria-pressed", sorted ? "true" : "false");
      sortToggle.textContent = sorted ? "已按大小降序" : "按大小排序";
      updateReadout();
      ctrl.draw();
    });
  }

  updateReadout();
  ctrl.draw();
}

// ---------- 03 · auto vs fixed 脏数据压力测试 + border-collapse ----------
function initAlgorithmLab() {
  const root = document.getElementById("algo-lab");
  if (!root) return;
  const autoId = document.getElementById("algo-auto-id");
  const autoNote = document.getElementById("algo-auto-note");
  const fixedId = document.getElementById("algo-fixed-id");
  const fixedNote = document.getElementById("algo-fixed-note");
  const autoTable = document.getElementById("algo-table-auto");
  const fixedTable = document.getElementById("algo-table-fixed");
  const explainEl = document.getElementById("algo-explain");
  const autoMeasure = document.getElementById("algo-auto-w");
  const fixedMeasure = document.getElementById("algo-fixed-w");

  let payloadKey = "longId";
  let overflowMode = "wrap"; // "wrap" | "ellipsis"
  let collapseMode = "collapse"; // "collapse" | "separate"

  function measureCols(tbl) {
    const ths = [...tbl.querySelectorAll("thead th")];
    return ths.map((th) => `${Math.round(th.getBoundingClientRect().width)}px`).join(" / ");
  }

  function apply() {
    const p = STRESS_PAYLOADS[payloadKey];
    autoId.textContent = p.orderId;
    autoNote.textContent = p.note;
    fixedId.textContent = p.orderId;
    fixedNote.textContent = p.note;
    explainEl.textContent = p.explain;

    fixedTable.dataset.overflow = overflowMode;
    autoTable.dataset.border = collapseMode;
    fixedTable.dataset.border = collapseMode;

    root.querySelectorAll("[data-payload]").forEach((b) => {
      const on = b.dataset.payload === payloadKey;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    root.querySelectorAll("[data-ov]").forEach((b) => {
      const on = b.dataset.ov === overflowMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    root.querySelectorAll("[data-bc]").forEach((b) => {
      const on = b.dataset.bc === collapseMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });

    requestAnimationFrame(() => {
      autoMeasure.textContent = `实测列宽：${measureCols(autoTable)}`;
      fixedMeasure.textContent = `实测列宽：${measureCols(fixedTable)}`;
    });
  }

  root.addEventListener("click", (e) => {
    const pb = e.target.closest("[data-payload]");
    if (pb) {
      payloadKey = pb.dataset.payload;
      apply();
      return;
    }
    const ob = e.target.closest("[data-ov]");
    if (ob) {
      overflowMode = ob.dataset.ov;
      apply();
      return;
    }
    const bb = e.target.closest("[data-bc]");
    if (bb) {
      collapseMode = bb.dataset.bc;
      apply();
    }
  });

  apply();
}

// ---------- 04 · 4 步数据墨水剥离阶梯 + 表头/正文合并边界对照 ----------
function initInkAndMergeLab() {
  const root = document.getElementById("ink-lab");
  if (!root) return;
  const tableEl = document.getElementById("ink-table");
  const ratioEl = document.getElementById("ink-ratio");
  const summaryEl = document.getElementById("ink-summary");
  const detailEl = document.getElementById("ink-detail");
  const mergeBox = document.getElementById("merge-compare");
  const mergeVerdict = document.getElementById("merge-verdict");

  let stepIdx = 0;
  let mergeMode = "header"; // "header" | "body"

  function applyStep(idx) {
    stepIdx = idx;
    const s = INK_STEPS[idx];
    tableEl.dataset.inkStep = String(idx);
    ratioEl.textContent = s.inkRatio;
    summaryEl.textContent = s.summary;
    detailEl.textContent = s.detail;
    root.querySelectorAll("[data-ink-step]").forEach((b) => {
      const on = Number(b.dataset.inkStep) === idx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function applyMerge(mode) {
    mergeMode = mode;
    mergeBox.dataset.mergeMode = mode;
    root.querySelectorAll("[data-merge]").forEach((b) => {
      const on = b.dataset.merge === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (mode === "header") {
      mergeVerdict.textContent =
        "✓ 推荐用法（表头分组 colspan）：把「上半年」「下半年」做成二级表头，底下的 4 个季度数据依然一格一值，排序、复制与读屏器定位全部正常。";
      mergeVerdict.dataset.state = "good";
    } else {
      mergeVerdict.textContent =
        "× 慎用场景（正文跨格合并）：正文行合并虽然醒目，但一旦需要按 Q2 排序、导出 CSV 或键盘逐格朗读，合并格立刻制造归属歧义。";
      mergeVerdict.dataset.state = "bad";
    }
  }

  root.addEventListener("click", (e) => {
    const sb = e.target.closest("[data-ink-step]");
    if (sb) {
      applyStep(Number(sb.dataset.inkStep));
      return;
    }
    const mb = e.target.closest("[data-merge]");
    if (mb) applyMerge(mb.dataset.merge);
  });

  applyStep(stepIdx);
  applyMerge(mergeMode);
}

// ---------- 05 · 移动端窄屏响应式模拟器 ----------
function initMobileLab() {
  const root = document.getElementById("mobile-lab");
  if (!root) return;
  const frame = document.getElementById("mobile-frame");
  const widthSlider = document.getElementById("mobile-width");
  const widthVal = document.getElementById("mobile-width-val");
  const verdictEl = document.getElementById("mobile-verdict");
  const tradeoffEl = document.getElementById("mobile-tradeoff");

  let strategy = "sticky";

  function apply() {
    const w = Number(widthSlider.value);
    frame.style.maxWidth = `${w}px`;
    frame.dataset.strategy = strategy;
    widthVal.textContent = `模拟视口宽 ${w}px`;
    const info = MOBILE_STRATEGIES[strategy];
    verdictEl.textContent = info.verdict;
    tradeoffEl.textContent = info.tradeoff;
    root.querySelectorAll("[data-strat]").forEach((b) => {
      const on = b.dataset.strat === strategy;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-strat]");
    if (b) {
      strategy = b.dataset.strat;
      apply();
    }
  });
  widthSlider.addEventListener("input", apply);
  apply();
}

// ---------- 06 · 历史年代源码切片 ----------
function initHistoryLab() {
  const root = document.getElementById("history-lab");
  if (!root) return;
  const whoEl = document.getElementById("hist-who");
  const workEl = document.getElementById("hist-work");
  const venueEl = document.getElementById("hist-venue");
  const bodyEl = document.getElementById("hist-body");
  const codeTitleEl = document.getElementById("hist-code-title");
  const codeEl = document.getElementById("hist-code");
  const tabs = [...root.querySelectorAll("[data-hidx]")];

  function apply(idx) {
    const item = HISTORY_NODES[idx] || HISTORY_NODES[0];
    whoEl.textContent = `${item.year} · ${item.who}`;
    workEl.textContent = item.work;
    venueEl.textContent = item.venue;
    bodyEl.textContent = item.body;
    codeTitleEl.textContent = item.codeTitle;
    codeEl.textContent = item.code;
    tabs.forEach((t) => {
      const on = Number(t.dataset.hidx) === idx;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => apply(Number(t.dataset.hidx))));
  apply(2); // 默认落在 1996 RFC 1942 & 表格拼版分水岭，最抓人
}

// ---------- 07 · 6 场景分诊卡 ----------
function initTriageLab() {
  const root = document.getElementById("triage-lab");
  if (!root) return;
  const verdictBadge = document.getElementById("triage-badge");
  const titleEl = document.getElementById("triage-title");
  const reasonEl = document.getElementById("triage-reason");
  const linkWrap = document.getElementById("triage-link-wrap");
  const cards = [...root.querySelectorAll("[data-triage]")];

  function apply(id) {
    const item = TRIAGE_SCENARIOS.find((s) => s.id === id) || TRIAGE_SCENARIOS[0];
    verdictBadge.textContent = item.verdictLabel;
    verdictBadge.dataset.kind = item.verdict;
    titleEl.textContent = `${item.title} — ${item.sample}`;
    reasonEl.textContent = item.reason;
    if (item.link) {
      linkWrap.innerHTML = `推荐改用：<a href="${item.link.url}" target="_blank" rel="noopener">${item.link.name} →</a>`;
      linkWrap.hidden = false;
    } else {
      linkWrap.innerHTML = "";
      linkWrap.hidden = true;
    }
    cards.forEach((c) => {
      const on = c.dataset.triage === id;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  cards.forEach((c) => c.addEventListener("click", () => apply(c.dataset.triage)));
  apply(TRIAGE_SCENARIOS[0].id);
}

// ---------- 08 · 小练习：四张同数据集报价表（中性标签，单变量差异） ----------
function initQuiz() {
  const root = document.getElementById("quiz-lab");
  if (!root) return;
  const grid = document.getElementById("quiz-grid");
  const fbBox = document.getElementById("quiz-feedback");
  const fbTitle = document.getElementById("quiz-fb-title");
  const fbText = document.getElementById("quiz-fb-text");
  const retryBtn = document.getElementById("quiz-retry");

  // 动态渲染 4 张结构一致、仅差单一变量的真实小表格
  grid.innerHTML = QUIZ_OPTIONS.map((opt) => {
    const rowsHtml = QUIZ_DATA.map(
      (r) => `<tr><th scope="row">${r.plan}</th><td class="q-num">${r.price}</td><td class="q-num">${r.quota}</td></tr>`
    ).join("");
    return `<button type="button" class="quiz-card" data-opt="${opt.id}" aria-pressed="false">
      <span class="quiz-opt-head"><span class="quiz-letter" lang="en">${opt.id}</span><span>方案 ${opt.id}</span></span>
      <table class="q-table" data-variant="${opt.variant}">
        <thead><tr><th scope="col">方案</th><th scope="col" class="q-num">月费</th><th scope="col" class="q-num">流量</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </button>`;
  }).join("");

  const cards = [...grid.querySelectorAll(".quiz-card")];

  function reset() {
    cards.forEach((c) => {
      c.classList.remove("is-selected", "is-correct", "is-wrong");
      c.setAttribute("aria-pressed", "false");
    });
    fbBox.hidden = true;
  }

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".quiz-card");
    if (!card) return;
    const opt = QUIZ_OPTIONS.find((o) => o.id === card.dataset.opt);
    if (!opt) return;
    cards.forEach((c) => {
      const o = QUIZ_OPTIONS.find((x) => x.id === c.dataset.opt);
      c.classList.toggle("is-selected", c === card);
      c.setAttribute("aria-pressed", c === card ? "true" : "false");
      c.classList.toggle("is-correct", o.correct);
      c.classList.toggle("is-wrong", c === card && !o.correct);
    });
    fbBox.hidden = false;
    fbBox.dataset.state = opt.correct ? "good" : "bad";
    fbTitle.textContent = opt.correct ? "判断准确 · 方案 C 胜出" : `再看一眼 · 你选了方案 ${opt.id}（正确解是方案 C）`;
    fbText.textContent = opt.feedback;
  });

  if (retryBtn) retryBtn.addEventListener("click", reset);
}

// ---------- 09 · 原海报可缩放拖动灯箱 ----------
function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const trigger = document.getElementById("poster-open");
  const dlg = document.getElementById("poster-dialog");
  const stage = document.getElementById("lb-stage");
  const img = document.getElementById("lb-img");
  const closeBtn = document.getElementById("lb-close");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const zoomResetBtn = document.getElementById("lb-zoom-reset");
  if (!poster || !trigger || !dlg || !img) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomResetBtn) zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    img.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
  }

  function close() {
    if (typeof dlg.close === "function" && dlg.open) dlg.close();
    else dlg.removeAttribute("open");
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) close();
  });
  zoomInBtn.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  zoomResetBtn.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    stage.setPointerCapture?.(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const endPan = () => {
    dragging = false;
  };
  stage.addEventListener("pointerup", endPan);
  stage.addEventListener("pointercancel", endPan);
  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = Math.max(0.75, Math.min(3, +(scale + (e.deltaY < 0 ? 0.15 : -0.15)).toFixed(2)));
      applyTransform();
    },
    { passive: false }
  );
}

export function initSections() {
  initAnatomyLab();
  initAlignLab();
  initAlgorithmLab();
  initInkAndMergeLab();
  initMobileLab();
  initHistoryLab();
  initTriageLab();
  initQuiz();
  initPosterLightbox();
}

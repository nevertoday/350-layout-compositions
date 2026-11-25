// 章节 01、03、04、05、06、07 互动实验 + 章节 08 原海报放大拖动灯箱 + 滚动显隐

import { reducedMotion } from "../../lib/stage.js";
import { BIB_SAMPLES, evaluateMeasureDepth, GLOSSARY_TERMS, QUIZ_OPTIONS } from "./model.js";

const $ = (id) => document.getElementById(id);

// 测量元素内各视觉行的纵坐标（用于续行对齐轨避开首行文字 + 真实折行行数统计）
function measureVisualLines(el) {
  const rects = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.nodeValue || !node.nodeValue.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      if (r.width < 0.8 || r.height < 4) continue;
      rects.push(r);
    }
  }
  if (!rects.length) return [];
  rects.sort((a, b) => a.top - b.top || a.left - b.left);
  const lines = [];
  for (const r of rects) {
    const mid = (r.top + r.bottom) * 0.5;
    const last = lines[lines.length - 1];
    if (last && Math.abs(mid - last.mid) < Math.max(6, last.h * 0.45)) {
      last.top = Math.min(last.top, r.top);
      last.bottom = Math.max(last.bottom, r.bottom);
      last.h = last.bottom - last.top;
      last.mid = (last.top + last.bottom) * 0.5;
    } else {
      lines.push({ top: r.top, bottom: r.bottom, h: r.height, mid });
    }
  }
  return lines;
}

function positionContRails(container, rowSel, railSel, getLeftPx) {
  let totalLines = 0;
  for (const row of container.querySelectorAll(rowSel)) {
    const rail = row.querySelector(railSel);
    const lines = measureVisualLines(row);
    totalLines += Math.max(1, lines.length);
    if (!rail) continue;
    if (lines.length < 2) {
      rail.hidden = true;
      continue;
    }
    const rowRect = row.getBoundingClientRect();
    const topPx = Math.max(0, Math.round(lines[1].top - rowRect.top) + 1);
    const hPx = Math.max(8, Math.round(lines[lines.length - 1].bottom - lines[1].top) - 2);
    const leftPx = Math.max(0, Math.round(getLeftPx(row)));
    rail.hidden = false;
    rail.style.left = `${leftPx}px`;
    rail.style.top = `${topPx}px`;
    rail.style.height = `${hPx}px`;
  }
  return totalLines;
}

function shuffleList(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// 01: 「找词头」两轮实测计时（20 条真实排版术语表，齐左 vs 悬挂，仅展示用户自己的真实用时）
export function initFinderLab() {
  const listEl = $("finder-list");
  const promptEl = $("finder-prompt");
  const roundTag = $("finder-round-tag");
  const clockEl = $("finder-clock");
  const actionBtn = $("finder-action");
  const resetBtn = $("finder-reset");
  const scoreFlush = $("score-flush");
  const scoreHang = $("score-hang");
  const scoreDiff = $("score-diff");
  const previewSeg = $("finder-preview-seg");
  const readEl = $("finder-read");

  let phase = "idle"; // "idle" | "round1" | "between" | "round2" | "done"
  let targetTerm = "";
  let prevTarget = "";
  let startTime = 0;
  let timerId = 0;
  let flushMs = null;
  let hangMs = null;
  let misses = 0;

  const fmtSec = (ms) => `${(ms / 1000).toFixed(2)} s`;

  function stopClock() {
    if (timerId) {
      clearInterval(timerId);
      timerId = 0;
    }
  }

  function renderEntries(entries, mode) {
    listEl.dataset.mode = mode;
    listEl.innerHTML = entries
      .map(
        (it) =>
          `<button type="button" class="gl-item" data-term="${it.term}"><strong>${it.term}</strong>　${it.def}</button>`
      )
      .join("");
    listEl.scrollTop = 0;
  }

  function setPreviewEnabled(enabled) {
    for (const inp of previewSeg.querySelectorAll("input")) inp.disabled = !enabled;
  }

  function syncPreviewRadio(mode) {
    const inp = previewSeg.querySelector(`input[value="${mode}"]`);
    if (inp) inp.checked = true;
  }

  function startRound(which) {
    stopClock();
    misses = 0;
    const mode = which === 1 ? "flush" : "hanging";
    const shuffled = shuffleList(GLOSSARY_TERMS);
    // 目标词条落在中后段（第 8–16 条），保证两轮都需要真实向下纵扫，避免碰巧落在第一条
    let pickIdx = 7 + Math.floor(Math.random() * 9);
    if (shuffled[pickIdx].term === prevTarget) {
      pickIdx = pickIdx < 15 ? pickIdx + 1 : pickIdx - 1;
    }
    targetTerm = shuffled[pickIdx].term;
    if (which === 1) prevTarget = targetTerm;

    phase = which === 1 ? "round1" : "round2";
    renderEntries(shuffled, mode);
    syncPreviewRadio(mode);
    setPreviewEnabled(false);

    roundTag.textContent = which === 1 ? "第 1 轮 · 齐左无缩进" : "第 2 轮 · 悬挂缩进";
    roundTag.dataset.state = "active";
    promptEl.innerHTML = `请在下方 20 条术语里找出并点击：<strong class="finder-target">「${targetTerm}」</strong>`;
    actionBtn.textContent = which === 1 ? "重抽第 1 轮" : "重抽第 2 轮";
    resetBtn.hidden = false;
    clockEl.textContent = "0.00 s";
    readEl.textContent =
      which === 1
        ? "第 1 轮计时中（齐左无缩进）：词头和上一条释义的续行都贴死在同一条左边缘上，顺着往下找目标词头。"
        : "第 2 轮计时中（悬挂缩进）：同一批 20 条术语已重新洗牌，但续行统统向里退开了——试着直接沿最左缘一路纵扫。";

    startTime = performance.now();
    timerId = window.setInterval(() => {
      clockEl.textContent = fmtSec(performance.now() - startTime);
    }, 60);
  }

  function finishRound(btn) {
    const elapsed = Math.max(10, performance.now() - startTime);
    stopClock();
    clockEl.textContent = fmtSec(elapsed);
    btn.classList.add("is-hit");

    if (phase === "round1") {
      flushMs = elapsed;
      scoreFlush.textContent = fmtSec(flushMs);
      phase = "between";
      roundTag.textContent = "第 1 轮完成";
      roundTag.dataset.state = "done";
      promptEl.innerHTML = `找到「${targetTerm}」，齐左无缩进用时 <strong>${fmtSec(flushMs)}</strong>。现在换悬挂缩进测第 2 轮。`;
      actionBtn.textContent = "开始第 2 轮（悬挂）";
      readEl.textContent = `第 1 轮（齐左）你花了 ${fmtSec(flushMs)}${misses ? `（误点 ${misses} 次）` : ""}。点击「开始第 2 轮（悬挂）」，用同一份 20 条术语重新洗牌再测一次。`;
      actionBtn.focus();
    } else if (phase === "round2") {
      hangMs = elapsed;
      scoreHang.textContent = fmtSec(hangMs);
      phase = "done";
      setPreviewEnabled(true);
      roundTag.textContent = "两轮实测完成";
      roundTag.dataset.state = "done";
      actionBtn.textContent = "再来一轮";

      const diffMs = flushMs - hangMs;
      if (diffMs > 120) {
        const pct = Math.round((diffMs / flushMs) * 100);
        scoreDiff.textContent = `悬挂快 ${fmtSec(diffMs)}`;
        promptEl.innerHTML = `你的实测：悬挂缩进（<strong>${fmtSec(hangMs)}</strong>）比齐左（${fmtSec(flushMs)}）快了 <strong>${fmtSec(diffMs)}</strong>。`;
        readEl.textContent = `这一次你用悬挂缩进快了 ${fmtSec(diffMs)}（少花约 ${pct}% 时间）：续行向内退让后，左侧只剩 20 个词头排成一列，视线不必钻进正文句子里辨认哪一行是新条目。`;
      } else if (diffMs < -120) {
        const faster = Math.abs(diffMs);
        scoreDiff.textContent = `本次齐左快 ${fmtSec(faster)}`;
        promptEl.innerHTML = `你的实测：齐左 ${fmtSec(flushMs)} vs 悬挂 ${fmtSec(hangMs)}（本次齐左快了 ${fmtSec(faster)}）。`;
        readEl.textContent = `单次测试里目标位置刚好落进视野，齐左偶然更快很正常。点「再来一轮」多测两次，留意两版里眼睛扫描左边缘时的费力程度。`;
      } else {
        scoreDiff.textContent = "两次几乎持平";
        promptEl.innerHTML = `你的实测：齐左 ${fmtSec(flushMs)} vs 悬挂 ${fmtSec(hangMs)}（两次用时接近）。`;
        readEl.textContent = `这一次两组用时几乎相同；你可以点「再来一轮」再测一次，或用上方预览开关切换两版，直观比较左边缘的干净程度。`;
      }
    }
  }

  function resetAll() {
    stopClock();
    phase = "idle";
    targetTerm = "";
    prevTarget = "";
    flushMs = null;
    hangMs = null;
    misses = 0;
    roundTag.textContent = "准备实测";
    roundTag.dataset.state = "";
    promptEl.textContent = "两轮找词头计时：同一份 20 条术语表，分别用齐左与悬挂排，比比你自己的真实用时。";
    clockEl.textContent = "0.00 s";
    actionBtn.textContent = "开始第 1 轮（齐左）";
    resetBtn.hidden = true;
    scoreFlush.textContent = "待测";
    scoreHang.textContent = "待测";
    scoreDiff.textContent = "两轮后揭晓";
    setPreviewEnabled(true);
    syncPreviewRadio("flush");
    renderEntries(GLOSSARY_TERMS, "flush");
    readEl.textContent = "点击「开始第 1 轮（齐左）」启动真实计时；下方 20 条术语也会同步洗牌。静置时也可切换「齐左预览 / 悬挂预览」对比视觉差异。";
  }

  actionBtn.addEventListener("click", () => {
    if (phase === "idle" || phase === "done" || phase === "round1") startRound(1);
    else if (phase === "between" || phase === "round2") startRound(2);
  });

  resetBtn.addEventListener("click", resetAll);

  previewSeg.addEventListener("change", () => {
    if (phase === "round1" || phase === "round2") return;
    const mode = document.querySelector('input[name="finder-preview"]:checked')?.value || "flush";
    listEl.dataset.mode = mode;
    readEl.textContent =
      mode === "hanging"
        ? "悬挂预览：所有后续行退回 2.8 em 以内，20 个长短不一的术语词头立刻在左缘独立站成一列。"
        : "齐左预览：所有行齐刷刷顶死左缘，词头和上一条释义的残句混在一起。点「开始第 1 轮（齐左）」亲自测测用时。";
  });

  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".gl-item");
    if (!btn) return;
    if (phase !== "round1" && phase !== "round2") {
      readEl.textContent = "还没开始计时——点上方「开始第 1 轮（齐左）」按钮，系统会给出目标词头并开始计时。";
      return;
    }
    const picked = btn.dataset.term;
    if (picked === targetTerm) {
      finishRound(btn);
    } else {
      misses++;
      btn.classList.remove("is-miss");
      void btn.offsetWidth;
      btn.classList.add("is-miss");
      readEl.textContent = `点到「${picked}」了，继续找目标词条「${targetTerm}」……`;
    }
  });

  resetAll();
}

// 03: 版心栏宽 × 缩进深度 真实书目压力测试（姓氏长短不一，续行虚线避开首行不压字）
export function initMeasureLab() {
  const measureInput = $("cal-measure");
  const indentInput = $("cal-indent");
  const measureOut = $("cal-measure-out");
  const indentOut = $("cal-indent-out");
  const stage = $("cal-stage");
  const sheet = $("cal-sheet");
  const entriesEl = $("cal-entries");
  const crHang = $("cr-hang");
  const crRem = $("cr-rem");
  const cmHang = $("cm-hang");
  const cmRem = $("cm-rem");
  const tag = $("cal-tag");
  const summary = $("cal-summary");
  const paperBtn = $("cal-paper");
  const presetSeg = $("cal-preset");

  entriesEl.innerHTML = BIB_SAMPLES.map(
    (d) =>
      `<p class="cal-entry"><i class="cont-rail" aria-hidden="true"></i><strong>${d.author}</strong> ${d.year} <cite lang="en">${d.title}</cite>${d.rest}</p>`
  ).join("");

  function render() {
    const measure = parseFloat(measureInput.value);
    const indent = parseFloat(indentInput.value);
    const pct = Math.min(90, Math.round((indent / measure) * 100));
    const remain = Math.max(4, measure - indent);

    measureOut.textContent = `${measure} em`;
    indentOut.textContent = `${indent.toFixed(1)} em`;

    sheet.style.setProperty("--measure", `${measure}em`);
    sheet.style.setProperty("--hang", `${indent}em`);

    const fs = parseFloat(getComputedStyle(entriesEl).fontSize) || 14.7;
    const actualEm = Math.round((sheet.getBoundingClientRect().width / fs) * 10) / 10;
    const effMeasure = actualEm > 8 && actualEm < measure - 0.8 ? actualEm : measure;
    const effPct = Math.min(90, Math.round((indent / effMeasure) * 100));
    const effRemain = Math.max(4, effMeasure - indent);
    sheet.dataset.tight = String(indent / effMeasure > 0.28 || effRemain < 13);

    crHang.style.width = `${effPct}%`;
    crRem.style.width = `${100 - effPct}%`;

    // 精确测量每条书目折出的实际行数，并只在续行（第 2 行起）画虚线，绝不压首行姓氏
    const totalLines = positionContRails(entriesEl, ".cal-entry", ".cont-rail", (row) => {
      const padL = parseFloat(getComputedStyle(row).paddingLeft) || 0;
      return Math.max(0, padL - 5);
    });

    const clampNote = effMeasure < measure - 0.8 ? `（当前屏宽实为 ${effMeasure.toFixed(0)}em）` : "";
    cmHang.textContent = `缩进 ${indent.toFixed(1)}em（占 ${effPct}%）`;
    cmRem.textContent = `续行宽 ${effRemain.toFixed(1)}em${clampNote} · 4 条共折 ${totalLines} 行`;

    const ev = evaluateMeasureDepth(indent, Math.round(effMeasure), totalLines);
    tag.textContent = ev.tag;
    tag.dataset.status = ev.status;
    summary.textContent = ev.summary;

    for (const inp of presetSeg.querySelectorAll("input")) {
      inp.checked = parseFloat(inp.value) === measure;
    }
  }

  measureInput.addEventListener("input", render);
  indentInput.addEventListener("input", render);
  presetSeg.addEventListener("change", () => {
    const picked = document.querySelector('input[name="cal-preset"]:checked')?.value;
    if (!picked) return;
    measureInput.value = picked;
    render();
  });
  paperBtn.addEventListener("click", () => {
    const light = paperBtn.getAttribute("aria-pressed") !== "true";
    paperBtn.setAttribute("aria-pressed", String(light));
    stage.dataset.paper = light ? "light" : "dark";
    paperBtn.textContent = light ? "切回深紫底" : "切换纸面预览";
  });

  const ro = new ResizeObserver(render);
  ro.observe(stage);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(render);
  }
  render();
}

// 04: 三种悬挂结构对比（真实书目：个人著者 vs 国家标准长机构名；续行轨避开首行不压字）
export function initStructLab() {
  const stage = $("struct-stage");
  const list = $("struct-list");
  const read = $("struct-read");
  const xrayBtn = $("struct-xray");
  const srB = stage.querySelector(".sr-b");

  const ITEMS = [
    {
      mk: "01.",
      k: "钱存训",
      v: "《书于竹帛：中国古代的文字记录》（东方出版中心，2022），系统考证商周简牍、战国帛书、早期纸卷与书写工具的形制演变。",
    },
    {
      mk: "02.",
      k: "全国信息与文献标准化技术委员会",
      v: "《信息与文献 参考文献著录规则》（GB/T 7714-2015），规定顺序编码制与著者—出版年制的著录格式与标点规范。",
    },
    {
      mk: "03.",
      k: "吕敬人",
      v: "《书艺问道》（上海人民美术出版社，2017），从书籍网格、留白节奏、纸张触感到翻阅秩序系统梳理中文图书的整体设计。",
    },
  ];

  const DESC = {
    standard:
      "标准悬挂缩进：不管是 3 字著者「钱存训」还是 15 字机构名「全国信息与文献标准化技术委员会」，首行都自然流淌，所有续行统一内缩 2.4 em；对齐虚线只在续行起点处显影，碰到首行词头自动断开让路。",
    marker:
      "编号外挂（列表对齐）：只把等宽序号「01. / 02. / 03.」留在左侧走廊里，每条首行与续行全部从 2.8 em 处齐平起排，对齐轨落在序号与正文之间的空隙里，绝不碰字。",
    sidehead:
      "定宽词头列（两栏）：只适合字数整齐的短词表；一旦遇上真实书目里的长机构名「全国信息与文献标准化技术委员会」，定宽左列立刻被折成三行窄条，明显吃力。",
  };

  function updateRails() {
    const kind = stage.dataset.kind || "standard";
    if (kind === "standard") {
      positionContRails(list, ".st-row.is-standard", ".cont-rail", (row) => {
        const padL = parseFloat(getComputedStyle(row).paddingLeft) || 0;
        return Math.max(0, padL - 5);
      });
    } else if (kind === "marker") {
      const firstRow = list.querySelector(".st-row.is-marker");
      const textEl = firstRow?.querySelector(".st-txt");
      const railsBox = stage.querySelector(".struct-rails");
      if (textEl && railsBox && srB) {
        const x = textEl.getBoundingClientRect().left - railsBox.getBoundingClientRect().left - 5;
        srB.style.left = `${Math.max(18, Math.round(x))}px`;
      }
    } else if (kind === "sidehead") {
      const firstRow = list.querySelector(".st-row.is-sidehead");
      const kEl = firstRow?.querySelector(".st-k");
      const vEl = firstRow?.querySelector(".st-v");
      const railsBox = stage.querySelector(".struct-rails");
      if (kEl && vEl && railsBox && srB) {
        const midX = (kEl.getBoundingClientRect().right + vEl.getBoundingClientRect().left) * 0.5;
        const x = midX - railsBox.getBoundingClientRect().left;
        srB.style.left = `${Math.max(40, Math.round(x))}px`;
      }
    }
  }

  function render() {
    const kind = document.querySelector('input[name="struct"]:checked')?.value || "standard";
    stage.dataset.kind = kind;
    if (kind === "standard") {
      list.innerHTML = ITEMS.map(
        (it) =>
          `<div class="st-row is-standard"><i class="cont-rail" aria-hidden="true"></i><strong>${it.k}</strong>　${it.v}</div>`
      ).join("");
    } else if (kind === "marker") {
      list.innerHTML = ITEMS.map(
        (it) =>
          `<div class="st-row is-marker"><span class="st-mk">${it.mk}</span><span class="st-txt"><strong>${it.k}</strong>　${it.v}</span></div>`
      ).join("");
    } else {
      list.innerHTML = ITEMS.map(
        (it) => `<div class="st-row is-sidehead"><span class="st-k">${it.k}</span><span class="st-v">${it.v}</span></div>`
      ).join("");
    }
    read.textContent = DESC[kind];
    updateRails();
  }

  $("struct-seg").addEventListener("change", render);
  xrayBtn.addEventListener("click", () => {
    const next = xrayBtn.getAttribute("aria-pressed") !== "true";
    xrayBtn.setAttribute("aria-pressed", String(next));
    stage.dataset.xray = String(next);
  });

  const ro = new ResizeObserver(updateRails);
  ro.observe(stage);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateRails);
  }
  render();
}

// 05: CSS 真缩进 vs 手动回车空格 窄屏折行测试（按 100% 实测自然断行烘焙假回车，100% 时左右完全一致，一收窄立现散架）
export function initCodeLab() {
  const narrow = $("narrow-range");
  const narrowOut = $("narrow-out");
  const fakeBox = $("fake-box");
  const realBox = $("real-box");
  const probeBox = $("code-probe");
  const narrowRead = $("narrow-read");
  const snippet = $("css-snippet");

  const CODE_ITEMS = [
    {
      head: "缩进规则",
      body: "在多行条目与书目里由段落样式统一控制续行退让距离，无需手工断句，改字号或换屏宽也能自动重新折行。",
    },
    {
      head: "窄屏适配",
      body: "同一段文字从宽屏桌面收窄到手机竖屏时，真正由规则算出的悬挂缩进始终保持左缘走廊笔直清晰，不会裂出残行。",
    },
  ];

  const SNIPPETS = {
    classic: `/* 通用兼容写法（全平台生效） */
.entry {
  padding-left: 2em;  /* 整体右移 */
  text-indent: -2em;  /* 首行拉回 */
}`,
    modern: `/* W3C CSS Text Level 3 原生语法
   Safari 15+ / Firefox 121+ / Chrome & Edge 146+ */
.entry {
  text-indent: 2em hanging;
}`,
  };

  const realHtml = CODE_ITEMS.map(
    (it) => `<p class="real-hang"><strong>${it.head}</strong>　${it.body}</p>`
  ).join("");
  realBox.innerHTML = realHtml;
  probeBox.innerHTML = realHtml;

  let lastBakedW = 0;

  // 提取 100% 宽度下真实 CSS 悬挂缩进的每一行自然断行点，烘焙成左栏的「手动回车 + 两格空格」
  function extractWrappedLines(pEl) {
    const lines = [];
    const walker = document.createTreeWalker(pEl, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    let node;
    let curLine = [];
    let curTop = null;

    while ((node = walker.nextNode())) {
      const text = node.nodeValue || "";
      const isBold = node.parentElement && node.parentElement.tagName === "STRONG";
      for (let i = 0; i < text.length; i++) {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rect = range.getBoundingClientRect();
        if (rect.height < 2) continue;
        const top = rect.top;
        if (curTop !== null && Math.abs(top - curTop) > Math.max(6, rect.height * 0.45)) {
          lines.push(curLine);
          curLine = [];
        }
        curTop = top;
        const prev = curLine[curLine.length - 1];
        if (prev && prev.bold === isBold) prev.text += text[i];
        else curLine.push({ bold: isBold, text: text[i] });
      }
    }
    if (curLine.length) lines.push(curLine);
    return lines;
  }

  function bakeFakeBreaks(force = false) {
    const w = Math.round(probeBox.getBoundingClientRect().width);
    if (w < 80 || (!force && Math.abs(w - lastBakedW) < 2)) return;
    lastBakedW = w;

    const ps = [...probeBox.querySelectorAll("p")];
    const html = ps
      .map((p) => {
        const lines = extractWrappedLines(p);
        const body = lines
          .map((segs, li) => {
            const inner = segs.map((s) => (s.bold ? `<strong>${s.text}</strong>` : s.text)).join("");
            if (li === 0) return inner;
            return `<br><span class="fk-sp" aria-hidden="true">\u3000\u3000</span>${inner}`;
          })
          .join("");
        return `<p class="fake-hang">${body}</p>`;
      })
      .join("");
    fakeBox.innerHTML = html;
  }

  function render() {
    const w = parseInt(narrow.value, 10);
    const syn = document.querySelector('input[name="css-syntax"]:checked')?.value || "classic";
    narrowOut.textContent = `${w}%`;
    fakeBox.style.setProperty("--narrow", `${w}%`);
    realBox.style.setProperty("--narrow", `${w}%`);
    fakeBox.dataset.exposed = String(w < 98);
    snippet.textContent = SNIPPETS[syn];

    if (w >= 98) {
      narrowRead.textContent = `当前栏宽 ${w}%：手动回车正好按原始宽度敲在行尾，左栏与右栏看起来一模一样。把滑块往左拖一点，立刻看它怎么当场露馅。`;
    } else if (w >= 76) {
      narrowRead.textContent = `栏宽收窄到 ${w}%：左栏在手动回车之前被迫提前折行，甩出孤零零的几字残句顶回最左，原本伪装缩进的空格（标红处）瞬间错位；右栏用段落规则重新折行，一丝不乱。`;
    } else {
      narrowRead.textContent = `窄栏 ${w}%（接近手机竖屏）：左栏的硬回车与假空格彻底散架成锯齿残片；右栏由 CSS / 段落样式实时重排，左侧检索走廊依然笔直干净。`;
    }
  }

  narrow.addEventListener("input", render);
  $("css-syntax").addEventListener("change", render);

  const ro = new ResizeObserver(() => {
    bakeFakeBreaks(false);
  });
  ro.observe(probeBox);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      bakeFakeBreaks(true);
    });
  }
  bakeFakeBreaks(true);
  render();
}

// 06: 错配体验（散文 vs 参考文献互换缩进方向）
export function initMismatchLab() {
  const grid = $("mismatch-grid");
  const proseTag = $("mm-prose-tag");
  const bibTag = $("mm-bib-tag");
  const read = $("mismatch-read");

  function render() {
    const st = document.querySelector('input[name="mismatch"]:checked')?.value || "right";
    grid.dataset.state = st;
    if (st === "right") {
      proseTag.textContent = "首行缩进 ✓";
      bibTag.textContent = "悬挂缩进 ✓";
      read.textContent = "各归其位：随笔开头轻收两格，视线顺滑地往下读；参考文献把三位作者姓氏（Bringhurst、De Vinne、Johnson）推在最左，竖向一扫即得。";
    } else {
      proseTag.textContent = "误用悬挂 ×";
      bibTag.textContent = "误用首行 ×";
      read.textContent = "互换之后立刻别扭：随笔每段第一行像标题一样硬顶出来，打断阅读呼吸；参考文献的作者姓氏缩进坑里，最左缘露出的反而是毫无检索意义的出版地与书名残片。";
    }
  }

  $("mismatch-seg").addEventListener("change", render);
  render();
}

// 07: 小练习
export function initQuiz() {
  const quiz = $("quiz");
  const verdict = $("quiz-verdict");
  const vTitle = $("quiz-title");
  const vText = $("quiz-text");
  const buttons = [...quiz.querySelectorAll(".q-opt")];

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.opt;
      const info = QUIZ_OPTIONS[choice];
      if (!info) return;

      quiz.classList.add("answered");
      buttons.forEach((b) => {
        const k = b.dataset.opt;
        const isPick = k === choice;
        const isRight = QUIZ_OPTIONS[k].correct;
        b.setAttribute("aria-pressed", String(isPick));
        b.classList.toggle("is-correct", isRight);
        b.classList.toggle("is-wrong", isPick && !isRight);
        const mark = b.querySelector(".q-mark");
        if (mark) mark.textContent = isRight ? "✓ 标准" : isPick ? "× 偏误" : "";
      });

      verdict.classList.toggle("is-wrong", !info.correct);
      vTitle.textContent = info.title;
      vText.textContent = info.text;
    });
  });
}

// 08: 原海报灯箱（放大、拖动、双击缩放、Esc 关闭，只复用 #poster.src 不多内联图片）
export function initLightbox() {
  const posterImg = $("poster");
  const openBtn = $("poster-btn");
  const lb = $("lightbox");
  const lbStage = $("lb-stage");
  const lbImg = $("lb-img");
  const closeBtn = $("lb-close");
  const zoomBtn = $("lb-zoom");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    lbImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    zoomBtn.setAttribute("aria-pressed", String(scale > 1));
    zoomBtn.textContent = scale > 1 ? "还原 1×" : "放大 1.8×";
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    closeBtn.focus();
  }

  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  }

  function toggleZoom() {
    scale = scale > 1 ? 1 : 1.8;
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  zoomBtn.addEventListener("click", toggleZoom);
  lbImg.addEventListener("dblclick", toggleZoom);

  lbStage.addEventListener("click", (e) => {
    if (e.target === lbStage) close();
  });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target !== lbImg) return;
    e.preventDefault();
    try {
      lbStage.setPointerCapture(e.pointerId);
    } catch {}
    lbStage.classList.add("dragging");
    drag = { id: e.pointerId, sx: e.clientX - tx, sy: e.clientY - ty };
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    tx = e.clientX - drag.sx;
    ty = e.clientY - drag.sy;
    applyTransform();
  });
  const endPan = (e) => {
    if (!drag || (e.pointerId != null && e.pointerId !== drag.id)) return;
    drag = null;
    lbStage.classList.remove("dragging");
  };
  window.addEventListener("pointerup", endPan);
  window.addEventListener("pointercancel", endPan);
  lbStage.addEventListener("lostpointercapture", endPan);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

// 滚动渐显（遵循 prefers-reduced-motion）
export function initReveal() {
  const nodes = document.querySelectorAll(".reveal");
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.04 }
  );
  nodes.forEach((n) => io.observe(n));
}

// 133 双栏 版式 · 全部交互模块（开场单真源、七节独立互动与原海报灯箱）
import { INITIAL_STATE, PRESETS, clamp, evaluate } from "./model.js";
import { mountHeroCanvas } from "./canvas.js";

/* ==================== 0. 开场蓝图排印台状态绑定 ==================== */
const state = { ...INITIAL_STATE };
let heroCtrl = null;
let lastDomSig = "";

const el = {
  canvas: document.getElementById("heroCanvas"),
  statusPill: document.getElementById("heroStatusPill"),
  mobileStatusPill: document.getElementById("mobileStatusPill"),
  titleSplitA: document.getElementById("titleSplitA"),
  titleSplitB: document.getElementById("titleSplitB"),
  probeColumn: document.getElementById("probeColumn"),
  probeColumnVal: document.getElementById("probeColumnVal"),
  probeComparison: document.getElementById("probeComparison"),
  probeComparisonVal: document.getElementById("probeComparisonVal"),
  probeGutter: document.getElementById("probeGutter"),
  probeGutterVal: document.getElementById("probeGutterVal"),
  probePath: document.getElementById("probePath"),
  probePathVal: document.getElementById("probePathVal"),
  diagCard: document.getElementById("diagCard"),
  diagBadge: document.getElementById("diagBadge"),
  diagTitle: document.getElementById("diagTitle"),
  diagWhy: document.getElementById("diagWhy"),
  diagHint: document.getElementById("diagHint"),
  diagFixBtn: document.getElementById("diagFixBtn"),
  metricSplit: document.getElementById("metricSplit"),
  metricRatio: document.getElementById("metricRatio"),
  metricDrift: document.getElementById("metricDrift"),
  rngSplit: document.getElementById("rngSplit"),
  rngGutter: document.getElementById("rngGutter"),
  rngDrift: document.getElementById("rngDrift"),
  valSplit: document.getElementById("valSplit"),
  valGutter: document.getElementById("valGutter"),
  valDrift: document.getElementById("valDrift"),
  flowToggleBtn: document.getElementById("flowToggleBtn"),
  guidesToggleBtn: document.getElementById("guidesToggleBtn"),
  clashToggleBtn: document.getElementById("clashToggleBtn"),
};

let currentFixPatch = null;

function syncHeroDom(m) {
  // 仅当关键量化指标或状态变化时写 DOM，避免空闲 rAF 帧引发 DOM 抖动
  const sig = [
    state.specimen,
    m.leftPct,
    m.gutterPx,
    m.gutterPct,
    m.driftPx,
    state.entryClash,
    state.ruleStyle,
    state.flowPlaying,
    state.showGuides,
    m.score,
    m.diagnosis.badge,
  ].join("|");
  if (sig === lastDomSig) return;
  lastDomSig = sig;

  const isOk = m.score === 4;
  el.statusPill.textContent = m.diagnosis.badge;
  el.statusPill.classList.toggle("is-ok", isOk);
  el.mobileStatusPill.textContent = m.diagnosis.badge;
  el.mobileStatusPill.classList.toggle("is-ok", isOk);

  // 自示范大标题「双|栏 / 版|式」中间的虚线缝宽随实际栏距同步呼吸
  const titleGap = Math.round(clamp(m.gutterPct * 1.6, 3, 28));
  el.titleSplitA.style.width = `${titleGap}px`;
  el.titleSplitB.style.width = `${titleGap}px`;

  // 四枚原海报图标实况探针
  el.probeColumn.dataset.state = m.probes.column.ok ? "ok" : "bad";
  el.probeColumnVal.textContent = m.probes.column.tag;
  el.probeComparison.dataset.state = m.probes.comparison.ok ? "ok" : "bad";
  el.probeComparisonVal.textContent = m.probes.comparison.tag;
  el.probeGutter.dataset.state = m.probes.gutter.ok ? "ok" : "bad";
  el.probeGutterVal.textContent = m.probes.gutter.tag;
  el.probePath.dataset.state = m.probes.path.ok ? "ok" : "bad";
  el.probePathVal.textContent = m.probes.path.tag;

  // 单真源白话诊单
  el.diagCard.dataset.level = m.diagnosis.level;
  el.diagBadge.textContent = m.diagnosis.badge;
  el.diagTitle.textContent = m.diagnosis.title;
  el.diagWhy.textContent = m.diagnosis.why;
  el.diagHint.textContent = m.diagnosis.hint;
  currentFixPatch = m.diagnosis.fixPatch;
  if (m.diagnosis.fixLabel && m.diagnosis.fixPatch) {
    el.diagFixBtn.hidden = false;
    el.diagFixBtn.textContent = m.diagnosis.fixLabel;
  } else {
    el.diagFixBtn.hidden = true;
  }

  el.metricSplit.textContent = `${m.leftPct}:${m.rightPct}`;
  el.metricRatio.textContent = `${m.gutterToLeading.toFixed(2)}×`;
  el.metricDrift.textContent = `${m.driftPx > 0 ? "+" : ""}${m.driftPx}px`;

  // 滑块与按钮状态同步
  el.rngSplit.value = String(m.leftPct);
  el.valSplit.textContent = `${m.leftPct}% : ${m.rightPct}%`;
  el.rngGutter.value = String(Math.round(state.gutterRatio * 1000));
  el.valGutter.textContent = `${m.gutterPx}px (${m.gutterPct}%)`;
  el.rngDrift.value = String(m.driftPx);
  el.valDrift.textContent = `${m.driftPx > 0 ? "+" : ""}${m.driftPx}px`;

  document.querySelectorAll("[data-specimen]").forEach((btn) => {
    const active = btn.dataset.specimen === state.specimen;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll("[data-rule]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.rule === state.ruleStyle);
  });

  el.clashToggleBtn.classList.toggle("is-warn", state.entryClash);
  el.clashToggleBtn.classList.toggle("is-active", !state.entryClash);
  el.clashToggleBtn.setAttribute("aria-pressed", String(state.entryClash));
  el.clashToggleBtn.textContent = state.entryClash ? "抢焦块: 开" : "抢焦块: 关";

  el.flowToggleBtn.classList.toggle("is-on", state.flowPlaying);
  el.flowToggleBtn.setAttribute("aria-pressed", String(state.flowPlaying));
  el.flowToggleBtn.textContent = state.flowPlaying ? "暂停视线" : "演播视线";

  el.guidesToggleBtn.classList.toggle("is-on", state.showGuides);
  el.guidesToggleBtn.setAttribute("aria-pressed", String(state.showGuides));
  el.guidesToggleBtn.textContent = state.showGuides ? "标尺: 开" : "标尺: 关";
}

function setState(patch, deferDraw = false) {
  Object.assign(state, patch);
  lastDomSig = "";
  if (heroCtrl && !deferDraw) heroCtrl.draw();
}

heroCtrl = mountHeroCanvas(el.canvas, () => state, setState, syncHeroDom);

// 控件事件绑定
document.querySelectorAll("[data-specimen]").forEach((btn) => {
  btn.addEventListener("click", () => setState({ specimen: btn.dataset.specimen }));
});
el.rngSplit.addEventListener("input", () => setState({ leftRatio: Number(el.rngSplit.value) / 100 }));
el.rngGutter.addEventListener("input", () => setState({ gutterRatio: Number(el.rngGutter.value) / 1000 }));
el.rngDrift.addEventListener("input", () => setState({ baselineDrift: Number(el.rngDrift.value) }));

document.querySelectorAll("[data-rule]").forEach((btn) => {
  btn.addEventListener("click", () => setState({ ruleStyle: btn.dataset.rule }));
});
el.clashToggleBtn.addEventListener("click", () => setState({ entryClash: !state.entryClash }));
el.flowToggleBtn.addEventListener("click", () => setState({ flowPlaying: !state.flowPlaying }));
el.guidesToggleBtn.addEventListener("click", () => setState({ showGuides: !state.showGuides }));
el.diagFixBtn.addEventListener("click", () => {
  if (currentFixPatch) setState(currentFixPatch);
});
document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) setState({ ...p.patch });
  });
});

/* ==================== 01 为什么分成两栏 · 行宽与回扫对比 ==================== */
const S1_SCENARIOS = {
  360: {
    singleChars: 20,
    dualChars: 8,
    singleBadge: "20 字/行 · 舒适贴合",
    dualBadge: "每栏 8 字 · 挤碎锯齿",
    singleOk: true,
    dualOk: false,
    verdict: "360px 窄屏下，单栏正好落在 20 字左右的黄金阅读区间；硬拆双栏后每栏只剩 8 个汉字，换行频率翻倍，双栏反而更慢。",
  },
  760: {
    singleChars: 38,
    dualChars: 17,
    singleBadge: "38 字/行 · 偏长临界",
    dualBadge: "每栏 17 字 · 轻快省力",
    singleOk: true,
    dualOk: true,
    verdict: "760px 书刊对开页是分水岭：单栏 38 字已逼近舒适上限，拆成双栏后每栏约 17 字，回扫距离直接减半，且能轻松排入插图与边注。",
  },
  1160: {
    singleChars: 58,
    dualChars: 25,
    singleBadge: "58 字/行 · 回扫易串行",
    dualBadge: "每栏 25 字 · 回扫稳健",
    singleOk: false,
    dualOk: true,
    verdict: "1160px 宽页通排单栏高达 58 字/行，读完行尾折返找下一行极易跳行；拆成双栏后每栏 25 字，既充分利用纸面，又守住了眼动回扫精度。",
  },
};

function renderSec01(widthKey) {
  const cfg = S1_SCENARIOS[widthKey] || S1_SCENARIOS[1160];
  const sStat = document.getElementById("s1SingleStat");
  const dStat = document.getElementById("s1DualStat");
  const verdict = document.getElementById("s1Verdict");
  const sSvg = document.getElementById("s1SingleSvg");
  const dSvg = document.getElementById("s1DualSvg");

  sStat.textContent = cfg.singleBadge;
  sStat.className = `mono-pill ${cfg.singleOk ? "is-ok" : "is-bad"}`;
  dStat.textContent = cfg.dualBadge;
  dStat.className = `mono-pill ${cfg.dualOk ? "is-ok" : "is-bad"}`;
  verdict.textContent = cfg.verdict;

  const wRatio = widthKey === 360 ? 0.44 : widthKey === 760 ? 0.72 : 0.96;
  const boxW = Math.round(292 * wRatio);
  const x0 = Math.round((320 - boxW) / 2);

  // 单栏 SVG
  const sCol = cfg.singleOk ? "#3EE0A8" : "#FF7878";
  const sLines = [26, 48, 70, 92]
    .map((y, i) => `<line x1="${x0 + 10}" y1="${y}" x2="${x0 + boxW - (i === 3 ? 44 : 10)}" y2="${y}" stroke="#6A9AE3" stroke-width="3"/>`)
    .join("");
  sSvg.innerHTML = `
    <rect x="${x0}" y="10" width="${boxW}" height="96" fill="#061B44" stroke="#345CA0" stroke-width="1.2"/>
    ${sLines}
    <path d="M ${x0 + boxW - 12} 26 Q ${(x0 * 2 + boxW) / 2} 37 ${x0 + 14} 48" fill="none" stroke="${sCol}" stroke-width="1.8" stroke-dasharray="4 3"/>
    <circle cx="${x0 + 14}" cy="48" r="3.5" fill="${sCol}"/>
    <text x="${x0 + boxW - 8}" y="101" text-anchor="end" fill="${sCol}" font-size="10.5" font-family="IBM Plex Mono, monospace">回扫 ${Math.round(boxW - 24)}u</text>
  `;

  // 双栏 SVG
  const dCol = cfg.dualOk ? "#3EE0A8" : "#FF7878";
  const gut = Math.max(14, Math.round(boxW * 0.09));
  const cw = Math.round((boxW - gut - 20) / 2);
  const lx = x0 + 10;
  const rx = lx + cw + gut;
  const dLines = [26, 48, 70, 92]
    .map(
      (y, i) => `
      <line x1="${lx}" y1="${y}" x2="${lx + cw - (i === 3 ? 12 : 0)}" y2="${y}" stroke="#6A9AE3" stroke-width="3"/>
      <line x1="${rx}" y1="${y}" x2="${rx + cw - (i === 3 ? 18 : 0)}" y2="${y}" stroke="#F59E18" stroke-width="3"/>
    `
    )
    .join("");
  dSvg.innerHTML = `
    <rect x="${x0}" y="10" width="${boxW}" height="96" fill="#061B44" stroke="#345CA0" stroke-width="1.2"/>
    <line x1="${lx + cw + 2}" y1="12" x2="${lx + cw + 2}" y2="104" stroke="#6A9AE3" stroke-width="1" stroke-dasharray="3 3"/>
    <line x1="${rx - 2}" y1="12" x2="${rx - 2}" y2="104" stroke="#6A9AE3" stroke-width="1" stroke-dasharray="3 3"/>
    ${dLines}
    <path d="M ${lx + cw - 2} 26 Q ${lx + cw / 2} 37 ${lx + 4} 48" fill="none" stroke="${dCol}" stroke-width="1.8" stroke-dasharray="4 3"/>
    <circle cx="${lx + 4}" cy="48" r="3.5" fill="${dCol}"/>
    <text x="${x0 + boxW - 8}" y="101" text-anchor="end" fill="${dCol}" font-size="10.5" font-family="IBM Plex Mono, monospace">回扫 ${Math.max(12, cw - 6)}u</text>
  `;
}

document.getElementById("s1WidthBtns").addEventListener("click", (ev) => {
  const btn = ev.target.closest("[data-w]");
  if (!btn) return;
  document.querySelectorAll("#s1WidthBtns .chip-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
  renderSec01(Number(btn.dataset.w));
});
renderSec01(1160);

/* ==================== 02 栏距决定生死 · 4×4 行距×栏距矩阵 ==================== */
const S2_LEADINGS = [1.35, 1.55, 1.75, 2.0];
const S2_GUTTERS = [10, 22, 38, 72];
let s2State = { li: 2, gi: 2, rule: "none" }; // 默认 1.75× 行距 + 38px 栏距

function buildSec02Matrix() {
  const host = document.getElementById("s2Matrix");
  host.innerHTML = "";
  const baseFont = 14;
  S2_LEADINGS.forEach((lh, li) => {
    const row = document.createElement("div");
    row.className = "matrix-row";
    const yl = document.createElement("span");
    yl.className = "matrix-y-label";
    yl.textContent = `行距 ${lh.toFixed(2)}×`;
    row.append(yl);
    S2_GUTTERS.forEach((gp, gi) => {
      const ratio = gp / (baseFont * lh);
      const zone = ratio < 0.98 ? "bleed" : ratio > 2.65 ? "chasm" : "ok";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "m-cell";
      btn.dataset.li = String(li);
      btn.dataset.gi = String(gi);
      btn.dataset.zone = zone;
      btn.textContent = `${ratio.toFixed(2)}×`;
      btn.addEventListener("click", () => {
        s2State.li = li;
        s2State.gi = gi;
        renderSec02();
      });
      row.append(btn);
    });
    host.append(row);
  });
}

function renderSec02() {
  const lh = S2_LEADINGS[s2State.li];
  const gp = S2_GUTTERS[s2State.gi];
  const leadPx = +(14 * lh).toFixed(1);
  const ratio = +(gp / leadPx).toFixed(2);
  const cols = document.getElementById("s2SpecimenCols");
  const readout = document.getElementById("s2Readout");
  const cssBox = document.getElementById("s2CssCode");

  cols.style.lineHeight = String(lh);
  cols.style.columnGap = `${gp}px`;
  cols.style.gap = `${gp}px`;
  cols.classList.remove("rule-dashed", "rule-solid");
  if (s2State.rule === "dashed") cols.classList.add("rule-dashed");
  if (s2State.rule === "solid") cols.classList.add("rule-solid");

  document.querySelectorAll("#s2Matrix .m-cell").forEach((c) => {
    c.classList.toggle("is-selected", Number(c.dataset.li) === s2State.li && Number(c.dataset.gi) === s2State.gi);
  });

  let msg;
  if (s2State.rule === "solid") {
    msg = `栏距 ${gp}px / 行距 ${leadPx}px = ${ratio}×，但 5px 粗实线硬插在两栏正中，把柔和的对照关系劈成生硬隔墙。`;
  } else if (ratio < 0.98) {
    msg = `危险（${ratio}×）：中央栏距 ${gp}px 窄于行距 ${leadPx}px！按格式塔亲密性原则，视线读到左栏行尾会直接横向串进右栏。`;
  } else if (ratio > 2.65) {
    msg = `过宽（${ratio}×）：中央栏距达到 ${gp}px，两栏被推成彼此孤立的窄条，整体感与横向对照都开始散架。`;
  } else {
    msg = `稳健（${ratio}×）：中央栏距 ${gp}px 明显宽过行距 ${leadPx}px，既守住每栏独立垂直流，又保留两栏成对呼应。`;
  }
  readout.textContent = msg;

  const ruleCss =
    s2State.rule === "dashed"
      ? " column-rule: 1px dashed #1A4994;"
      : s2State.rule === "solid"
        ? " column-rule: 5px solid #091836;"
        : " column-rule: none;";
  cssBox.textContent = `column-count: 2; column-gap: ${gp}px; line-height: ${lh};${ruleCss}`;
}

document.getElementById("s2RuleBtns").addEventListener("click", (ev) => {
  const btn = ev.target.closest("[data-s2rule]");
  if (!btn) return;
  s2State.rule = btn.dataset.s2rule;
  document.querySelectorAll("#s2RuleBtns .chip-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
  renderSec02();
});
buildSec02Matrix();
renderSec02();

/* ==================== 03 四种双栏分工 · 建筑蓝图 SVG 切卡 ==================== */
const S3_ARCHS = {
  flow: {
    ratio: 0.5,
    pathTag: "N 形连续阅读",
    css: "column-count: 2; column-gap: 2.2rem;",
    title: "连续连读：左栏读尽，抬眼接右栏",
    desc: "最经典的报刊与书籍长文模式。两栏完全等宽、字体字号与基线完全一致，让一篇长文拆成两段舒适的短行流，整页呈现平稳的「银灰色」字面密度。",
    rules: [
      "两栏保持 50 : 50 均等宽度，避免读者在换栏后被迫重新适应行长。",
      "严格锁死跨栏基线，左右两栏的文字底线处在同一水平线上。",
      "限定在单页纸面或固定高度区域内使用，避免网页滚动爬顶。",
    ],
  },
  compare: {
    ratio: 0.5,
    pathTag: "Z 形横向对照",
    css: "grid-template-columns: 1fr 1fr; column-gap: 2.5rem;",
    title: "平行对照：左右逐行并置，一眼见高下",
    desc: "专为双语原文/译文、旧版/新版规格、正反观点或改造前后对比设计。眼睛不是读完左栏再去右栏，而是按主题一行行横向扫过中缝。",
    rules: [
      "左右权重必须均等（45%–55%），切忌把一方挤成窄条造成偏袒感。",
      "每组对照条款的顶部必须跨栏对齐，最好配合淡色水平细线帮眼睛定位。",
      "用克制色相区分两栏身份（如原海报的琥珀实心方 vs 蓝图斜线方）。",
    ],
  },
  editorial: {
    ratio: 0.38,
    pathTag: "左文右图 · S 形衔接",
    css: "grid-template-columns: 38% 1fr; column-gap: 2.4rem;",
    title: "主副图文：38 : 62 让文字叙事托起右侧图版",
    desc: "正是 133 原海报本身采用的结构：左栏收敛成精炼的标题、总述与要点导航，右栏获得更充裕的 62% 舞台展示大幅色块、图表或摄影作品。",
    rules: [
      "一栏放文字纲领，另一栏放视觉主体，避免两侧同时塞满同量级大字。",
      "用右指箭头、细蓝虚线或 S 形引导线明确「先读哪栏、再看哪块」。",
      "窄栏净宽仍须兜底，保证标题与要点不会折成四五行的碎段。",
    ],
  },
  nav: {
    ratio: 0.28,
    pathTag: "左索引 · 右长文",
    css: "grid-template-columns: minmax(220px, 28%) 1fr; gap: 2.5rem;",
    title: "索引正文：把目录钉在旁边，解放右侧阅读流",
    desc: "现代技术文档、产品手册与学术长文最可靠的网页双栏：左侧窄栏只放目录、年份或边注（桌面端可随滚动吸附），右侧 72% 主栏承担完整叙事。",
    rules: [
      "左栏只放短标签与导航，绝不塞进长段落，防止短行锯齿。",
      "左栏视觉明度必须退让一级，把最高对比度留给右侧正文。",
      "屏幕窄于平板宽度时，把左栏折叠成顶部抽屉或横排胶囊。",
    ],
  },
};

function renderSec03(key) {
  const a = S3_ARCHS[key] || S3_ARCHS.flow;
  document.getElementById("s3PathTag").textContent = a.pathTag;
  document.getElementById("s3CssTag").textContent = a.css;
  document.getElementById("s3Title").textContent = a.title;
  document.getElementById("s3Desc").textContent = a.desc;
  document.getElementById("s3Rules").innerHTML = a.rules.map((r) => `<li>${r}</li>`).join("");

  const svg = document.getElementById("s3Svg");
  const pad = 26;
  const gut = 34;
  const usable = 560 - pad * 2 - gut;
  const lw = Math.round(usable * a.ratio);
  const rw = usable - lw;
  const lx = pad;
  const rx = lx + lw + gut;
  const gx = lx + lw;

  let inner = "";
  if (key === "flow") {
    const lLines = [58, 78, 98, 118, 138, 158, 178, 198, 218, 238]
      .map((y) => `<line x1="${lx + 14}" y1="${y}" x2="${lx + lw - 14}" y2="${y}" stroke="#6A9AE3" stroke-width="2.4"/>`)
      .join("");
    const rLines = [58, 78, 98, 118, 138, 158, 178, 198, 218]
      .map((y) => `<line x1="${rx + 14}" y1="${y}" x2="${rx + rw - 14}" y2="${y}" stroke="#6A9AE3" stroke-width="2.4"/>`)
      .join("");
    inner = `
      ${lLines}${rLines}
      <path d="M ${lx + lw / 2} 54 L ${lx + lw / 2} 252 L ${rx + rw / 2} 54 L ${rx + rw / 2} 234" fill="none" stroke="#F59E18" stroke-width="2.6" stroke-dasharray="6 4"/>
      <circle cx="${lx + lw / 2}" cy="54" r="5" fill="#F59E18"/>
      <polyline points="${rx + rw / 2 - 6},226 ${rx + rw / 2},236 ${rx + rw / 2 + 6},226" fill="none" stroke="#F59E18" stroke-width="2.6"/>
    `;
  } else if (key === "compare") {
    const rows = [74, 132, 190, 248]
      .map(
        (y) => `
        <rect x="${lx + 14}" y="${y}" width="${lw - 28}" height="32" fill="rgba(106,154,227,0.16)" stroke="#6A9AE3" stroke-width="1.2"/>
        <rect x="${rx + 14}" y="${y}" width="${rw - 28}" height="32" fill="rgba(245,158,24,0.22)" stroke="#F59E18" stroke-width="1.2"/>
        <path d="M ${lx + lw - 10} ${y + 16} L ${rx + 10} ${y + 16}" stroke="#3EE0A8" stroke-width="1.6" stroke-dasharray="3 3"/>
      `
      )
      .join("");
    inner = `
      <rect x="${lx + 14}" y="44" width="${lw - 28}" height="18" fill="#6A9AE3"/>
      <rect x="${rx + 14}" y="44" width="${rw - 28}" height="18" fill="#F59E18"/>
      ${rows}
    `;
  } else if (key === "editorial") {
    inner = `
      <rect x="${lx + 14}" y="48" width="${lw - 28}" height="34" fill="#F4ECDA"/>
      <line x1="${lx + 14}" y1="100" x2="${lx + lw - 24}" y2="100" stroke="#6A9AE3" stroke-width="2"/>
      ${[126, 146, 166, 186, 206, 226].map((y) => `<line x1="${lx + 14}" y1="${y}" x2="${lx + lw - 16}" y2="${y}" stroke="#6A9AE3" stroke-width="2"/>`).join("")}
      <rect x="${rx + 14}" y="48" width="${rw - 28}" height="74" fill="#F59E18"/>
      <circle cx="${rx + 46}" cy="176" r="28" fill="#F59E18"/>
      ${[156, 170, 184, 198].map((y) => `<line x1="${rx + 88}" y1="${y}" x2="${rx + rw - 16}" y2="${y}" stroke="#6A9AE3" stroke-width="2"/>`).join("")}
      <rect x="${rx + 14}" y="224" width="${Math.round((rw - 42) / 2)}" height="54" fill="#F59E18"/>
      <rect x="${rx + 28 + Math.round((rw - 42) / 2)}" y="224" width="${Math.round((rw - 42) / 2)}" height="54" fill="none" stroke="#6A9AE3" stroke-width="1.8"/>
      <line x1="${rx + 28 + Math.round((rw - 42) / 2)}" y1="224" x2="${rx + 28 + Math.round((rw - 42) / 2) * 2}" y2="278" stroke="#6A9AE3" stroke-width="1.5"/>
      <path d="M ${lx + lw - 12} 100 C ${gx + 10} 100 ${gx + 22} 134 ${rx + 18} 134 L ${rx + rw - 18} 134" fill="none" stroke="#6A9AE3" stroke-width="2.2"/>
    `;
  } else {
    inner = `
      ${[56, 86, 116, 146, 176]
        .map(
          (y, i) => `
          <rect x="${lx + 12}" y="${y}" width="${lw - 24}" height="16" fill="${i === 1 ? "#F59E18" : "rgba(106,154,227,0.22)"}"/>
        `
        )
        .join("")}
      <rect x="${rx + 16}" y="52" width="${Math.round(rw * 0.56)}" height="22" fill="#F4ECDA"/>
      ${[94, 114, 134, 154, 174, 204, 224, 244, 264]
        .map((y, i) => `<line x1="${rx + 16}" y1="${y}" x2="${rx + rw - (i === 4 || i === 8 ? 64 : 16)}" y2="${y}" stroke="#6A9AE3" stroke-width="2.5"/>`)
        .join("")}
      <path d="M ${lx + lw - 10} 94 L ${rx + 12} 94" stroke="#F59E18" stroke-width="2.2" stroke-dasharray="4 3"/>
    `;
  }

  svg.innerHTML = `
    <rect x="0" y="0" width="560" height="320" fill="#001438"/>
    <rect x="${lx}" y="30" width="${lw}" height="262" fill="#061B44" stroke="#1E3E78"/>
    <rect x="${rx}" y="30" width="${rw}" height="262" fill="#061B44" stroke="#1E3E78"/>
    <line x1="${gx + 2}" y1="22" x2="${gx + 2}" y2="298" stroke="#6A9AE3" stroke-width="1.4" stroke-dasharray="5 4"/>
    <line x1="${rx - 2}" y1="22" x2="${rx - 2}" y2="298" stroke="#6A9AE3" stroke-width="1.4" stroke-dasharray="5 4"/>
    <text x="${lx + lw / 2}" y="20" text-anchor="middle" fill="#6A9AE3" font-size="12" font-family="IBM Plex Mono, monospace">${Math.round(a.ratio * 100)}%</text>
    <text x="${rx + rw / 2}" y="20" text-anchor="middle" fill="#F59E18" font-size="12" font-family="IBM Plex Mono, monospace">${Math.round((1 - a.ratio) * 100)}%</text>
    <text x="${gx + gut / 2}" y="164" text-anchor="middle" fill="#6A9AE3" font-size="13" font-family="IBM Plex Mono, monospace">↔</text>
    ${inner}
  `;
}

document.getElementById("s3Tabs").addEventListener("click", (ev) => {
  const btn = ev.target.closest("[data-arch]");
  if (!btn) return;
  document.querySelectorAll("#s3Tabs .arch-tab").forEach((b) => {
    const active = b === btn;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
  renderSec03(btn.dataset.arch);
});
renderSec03("flow");

/* ==================== 04 双栏从哪来 · 四时期版芯比例检视台 ==================== */
const S4_ERAS = {
  sinaiticus: {
    eyebrow: "CODEX SINAITICUS · 4TH CENTURY",
    title: "从卷轴窄栏走向册页双栏",
    body1: "现藏大英图书馆（编号 Add MS 43725）的 4 世纪希腊语《西奈抄本》，正处在古代莎草纸卷轴转向装订册页的过渡节点。它的散文卷延续卷轴习惯，每页抄成四道窄栏。",
    body2: "但到了《诗篇》《约伯记》等诗歌书卷，抄写员主动改成了每页两道更宽的纵栏——因为诗句按节拍分行，四窄栏装不下完整诗行，单栏又太宽。这让双栏成为早期册页平衡行长与节奏的经典解法。",
    facts: ["4 世纪", "羊皮纸册页", "散文 4 栏 → 诗歌 2 栏"],
    cap: "西奈抄本诗歌卷 · 宽册页双栏版芯示意",
    pageW: 210,
    pageH: 230,
    cols: 2,
    lines: 18,
    accent: "poetry",
  },
  gutenberg: {
    eyebrow: "GUTENBERG 42-LINE BIBLE · c. 1455",
    title: "古登堡四十二行圣经定型印刷双栏",
    body1: "约 1455 年，约翰内斯·古登堡在德国美因茨用金属活字印制了全书约 1282 页的《四十二行圣经》（B42，美国国会图书馆藏本单页尺寸约 17 × 12 英寸）。整部大对开本通篇采用规整的左右双栏，每栏排满四十二行。",
    body2: "大开本若排成通栏，一行会拖得极长；拆成双栏后，哥特体活字在两栏里形成均匀严密的墨色纹理，中缝留白像一条竖直脊柱稳住整页，为此后五百年的出版双栏立下了工程样板。",
    facts: ["约 1455 年 · 美因茨", "单页 17 × 12 英寸", "双栏 × 42 行"],
    cap: "古登堡 B42（17×12 英寸比例）· 双栏 42 行示意",
    pageW: 168,
    pageH: 238,
    cols: 2,
    lines: 24,
    accent: "b42",
  },
  brockmann: {
    eyebrow: "GRID SYSTEMS IN GRAPHIC DESIGN · 1981",
    title: "瑞士网格把「栏距」写进结构公式",
    body1: "1981 年，瑞士平面设计师约瑟夫·米勒-布罗克曼（Josef Müller-Brockmann）经由 Arthur Niggli 出版社推出《平面设计中的网格系统》（Raster Systeme für die visuelle Gestaltung），系统整理了从双栏到八栏、二十格的模块网格。",
    body2: "他在书中明确赋予栏间空隙（中间间距）严格的功能定位：栏距不是视觉装饰，而是防止文字块彼此粘连、让图注紧挨插图而不混淆的硬性隔离带。",
    facts: ["1981 年 · Arthur Niggli 出版社", "模块化图文双栏", "栏距作为功能隔离带"],
    cap: "1981 瑞士模块双栏网格 · 图文单元与栏距示意",
    pageW: 176,
    pageH: 232,
    cols: 2,
    lines: 14,
    accent: "swiss",
  },
  web: {
    eyebrow: "BRINGHURST (1992) & W3C CSS MULTICOL",
    title: "测度经验值与响应式双栏并轨",
    body1: "1992 年，罗伯特·布林赫斯特在《排版风格要素》中把多栏每行舒适测度概括为 40–50 拉丁字符（低于单栏的 45–75 字符），解释了为何同样一张宽页分成两栏反而更轻松。",
    body2: "进入屏幕时代后，W3C 在《CSS 多栏布局规范 Level 1》中标准化了 column-gap 与 column-rule，配合现代 CSS Grid 与媒体查询，设计师终于可以让页面在宽屏舒展为双栏对照、在手机自动收拢回单栏。",
    facts: ["1992 年 · 测度经验值", "W3C CSS Multicol L1", "宽屏双栏 / 窄屏退单"],
    cap: "现代 CSS Grid & Multicol · 响应式断点双栏示意",
    pageW: 260,
    pageH: 184,
    cols: 2,
    lines: 12,
    accent: "web",
  },
};

function renderSec04(key) {
  const e = S4_ERAS[key] || S4_ERAS.sinaiticus;
  document.getElementById("s4Eyebrow").textContent = e.eyebrow;
  document.getElementById("s4Title").textContent = e.title;
  document.getElementById("s4Body1").textContent = e.body1;
  document.getElementById("s4Body2").textContent = e.body2;
  document.getElementById("s4PlateCap").textContent = e.cap;
  document.getElementById("s4Facts").innerHTML = e.facts.map((f) => `<span class="era-fact">${f}</span>`).join("");

  const svg = document.getElementById("s4PlateSvg");
  const px = Math.round((360 - e.pageW) / 2);
  const py = Math.round((280 - e.pageH) / 2);
  const mL = Math.round(e.pageW * 0.11);
  const mR = Math.round(e.pageW * 0.11);
  const mT = Math.round(e.pageH * 0.11);
  const mB = Math.round(e.pageH * 0.15);
  const gut = Math.round(e.pageW * 0.085);
  const cw = Math.round((e.pageW - mL - mR - gut) / 2);
  const ch = e.pageH - mT - mB;
  const lx = px + mL;
  const rx = lx + cw + gut;
  const step = ch / e.lines;

  let marks = "";
  for (let i = 0; i < e.lines; i++) {
    const y = py + mT + 4 + i * step;
    const isShort = e.accent === "poetry" && i % 3 === 2;
    const isSwissTop = e.accent === "swiss" && i < 5;
    if (isSwissTop) continue;
    marks += `<line x1="${lx}" y1="${y}" x2="${lx + cw - (isShort ? 14 : 0)}" y2="${y}" stroke="#6A9AE3" stroke-width="${e.accent === "b42" ? 2.4 : 1.8}"/>`;
    marks += `<line x1="${rx}" y1="${y}" x2="${rx + cw - (isShort ? 10 : 0)}" y2="${y}" stroke="${e.accent === "web" ? "#F59E18" : "#6A9AE3"}" stroke-width="${e.accent === "b42" ? 2.4 : 1.8}"/>`;
  }
  if (e.accent === "b42") {
    marks += `<rect x="${lx}" y="${py + mT}" width="20" height="22" fill="#F59E18"/>`;
  }
  if (e.accent === "swiss") {
    marks += `<rect x="${rx}" y="${py + mT}" width="${cw}" height="${Math.round(step * 4.4)}" fill="#F59E18"/>`;
    marks += `<rect x="${lx}" y="${py + mT}" width="${cw}" height="${Math.round(step * 2.4)}" fill="#F4ECDA"/>`;
  }

  svg.innerHTML = `
    <rect x="${px}" y="${py}" width="${e.pageW}" height="${e.pageH}" fill="#061B44" stroke="#6A9AE3" stroke-width="1.4"/>
    <line x1="${lx + cw + 2}" y1="${py + 8}" x2="${lx + cw + 2}" y2="${py + e.pageH - 8}" stroke="#F59E18" stroke-width="1.2" stroke-dasharray="4 3"/>
    <line x1="${rx - 2}" y1="${py + 8}" x2="${rx - 2}" y2="${py + e.pageH - 8}" stroke="#F59E18" stroke-width="1.2" stroke-dasharray="4 3"/>
    ${marks}
  `;
}

document.getElementById("s4Btns").addEventListener("click", (ev) => {
  const btn = ev.target.closest("[data-era]");
  if (!btn) return;
  document.querySelectorAll("#s4Btns .era-btn").forEach((b) => {
    const active = b === btn;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
  renderSec04(btn.dataset.era);
});
renderSec04("sinaiticus");

/* ==================== 05 什么时候别用双栏 · 断点压力测试机 ==================== */
let s5Mode = "forced";
const s5Rng = document.getElementById("s5WidthRng");

function renderSec05() {
  const w = Number(s5Rng.value);
  const collapse = s5Mode === "responsive" && w < 640;
  const cols = collapse ? 1 : 2;
  const label = w < 480 ? "手机竖屏" : w < 720 ? "大屏手机 / 分屏" : "平板 / 桌面宽屏";

  document.getElementById("s5WidthVal").textContent = `${w}px（${label}）`;
  const dev = document.getElementById("s5Device");
  dev.style.width = `${w}px`;

  const content = document.getElementById("s5Content");
  content.classList.toggle("is-two", cols === 2);
  content.classList.toggle("is-one", cols === 1);

  const usable = w - 28 - (cols === 2 ? 18 : 0);
  const colW = usable / cols;
  const approxChars = Math.max(5, Math.floor(colW / 14.8));

  document.getElementById("s5DeviceTag").textContent = `${w}px · ${cols === 2 ? "双栏排布" : "已退回单栏"}`;
  document.getElementById("s5CharsTag").textContent = `每栏约 ${approxChars} 字/行`;

  const verdict = document.getElementById("s5Verdict");
  if (cols === 2 && (w < 640 || approxChars < 15)) {
    verdict.textContent = `窄屏碎行：在 ${w}px 屏宽下硬保双栏，每栏仅容约 ${approxChars} 个汉字，句子被频繁折断、右缘锯齿剧烈。点旁边「低于 640px 退单栏」看响应式断点如何救场。`;
  } else if (cols === 1) {
    verdict.textContent = `响应式接管：屏宽 ${w}px 低于 640px 断点，双栏主动折叠成单栏（约 ${approxChars} 字/行），保住完整词组又省去中缝浪费。`;
  } else {
    verdict.textContent = `宽屏适得其所：在 ${w}px 宽度下，每栏保有约 ${approxChars} 个汉字，行长紧凑、左右对照从容，此时正是双栏发挥优势的主场。`;
  }
}

s5Rng.addEventListener("input", renderSec05);
document.getElementById("s5ModeBtns").addEventListener("click", (ev) => {
  const btn = ev.target.closest("[data-s5mode]");
  if (!btn) return;
  s5Mode = btn.dataset.s5mode;
  document.querySelectorAll("#s5ModeBtns .chip-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
  renderSec05();
});
renderSec05();

/* ==================== 06 动手练一练 · 两道单一变量诊断题 ==================== */
const QUIZ_ROUNDS = [
  {
    prompt: "第 1 题（只变栏距）：一份宽 840px 的书刊双栏内页，正文行距固定为 26px、两栏严格 50 : 50 等宽。下面四版只改变中央栏距，哪一版最不容易跨栏串读，同时保持两栏整体感？",
    correct: 2,
    options: [
      {
        label: "方案 A",
        reveal: "栏距 10px（0.38×）",
        gutterSvg: 5,
        split: 0.5,
        reason: "方案 A 栏距只有 10px，还不到行距（26px）的一半。左右两栏贴得比上下行还近，扫读极易直接横向串进右栏。",
      },
      {
        label: "方案 B",
        reveal: "栏距 20px（0.77×）",
        gutterSvg: 11,
        split: 0.5,
        reason: "方案 B 是常见干扰陷阱：20px 看似留了缝，但仍小于 26px 行距（0.77×）。读者稍一加速阅读，视线仍会在中缝处跳栏。",
      },
      {
        label: "方案 C",
        reveal: "栏距 42px（1.62×）",
        gutterSvg: 24,
        split: 0.5,
        reason: "答对了！方案 C 栏距 42px 达到行距的 1.62 倍，在格式塔亲密性上稳稳切断了跨栏串读，同时没有浪费两侧净宽，两栏依然成对呼应。",
      },
      {
        label: "方案 D",
        reveal: "栏距 156px（6.00×）",
        gutterSvg: 76,
        split: 0.5,
        reason: "方案 D 把栏距撑到了行距的 6 倍，中间裂出一道大峡谷，把左右两栏撕成彼此孤立的窄条，整体感瓦解。",
      },
    ],
  },
  {
    prompt: "第 2 题（只变栏宽配比）：要把「旧版工艺」与「新版工艺」四项参数做平行横向对照，栏距与基线完全锁定。下面四版只改变左右栏宽比例，哪一版最适合快速公平比对？",
    correct: 2,
    options: [
      {
        label: "方案 A",
        reveal: "26% : 74%",
        gutterSvg: 22,
        split: 0.26,
        reason: "方案 A 左栏被压到 26%，旧版参数被迫折成多行碎条，同行高低完全错开，横向扫视对照非常吃力。",
      },
      {
        label: "方案 B",
        reveal: "38% : 62%",
        gutterSvg: 22,
        split: 0.38,
        reason: "方案 B 的 38 : 62 很适合「左文右图」的主副结构，但用在甲乙同类参数对比里，会给读者造成「右边才是主角、左边只是附注」的失衡感。",
      },
      {
        label: "方案 C",
        reveal: "50% : 50%",
        gutterSvg: 22,
        split: 0.5,
        reason: "答对了！平行对照型双栏依赖均等视觉权重与等高行对齐，50 : 50 让左右两栏势均力敌，眼睛逐行横扫零偏差。",
      },
      {
        label: "方案 D",
        reveal: "70% : 30%",
        gutterSvg: 22,
        split: 0.7,
        reason: "方案 D 左胖右瘦，右侧新版参数被挤成窄栏，视觉权重严重倒挂，对照效率下降。",
      },
    ],
  },
];

let quizRound = 0;
let quizPicked = [null, null];

function makeQuizSvg(opt, isCompare) {
  const W = 220;
  const H = 136;
  const pad = 14;
  const gut = opt.gutterSvg;
  const usable = W - pad * 2 - gut;
  const lw = Math.round(usable * opt.split);
  const rw = usable - lw;
  const lx = pad;
  const rx = lx + lw + gut;

  let body = "";
  if (!isCompare) {
    for (let y = 26; y <= 110; y += 14) {
      body += `<line x1="${lx + 5}" y1="${y}" x2="${lx + lw - 5}" y2="${y}" stroke="#6A9AE3" stroke-width="2.2"/>`;
      body += `<line x1="${rx + 5}" y1="${y}" x2="${rx + rw - 5}" y2="${y}" stroke="#6A9AE3" stroke-width="2.2"/>`;
    }
  } else {
    body += `<rect x="${lx + 4}" y="20" width="${lw - 8}" height="12" fill="#6A9AE3"/>`;
    body += `<rect x="${rx + 4}" y="20" width="${rw - 8}" height="12" fill="#F59E18"/>`;
    for (let y = 42; y <= 104; y += 22) {
      body += `<rect x="${lx + 4}" y="${y}" width="${lw - 8}" height="14" fill="rgba(106,154,227,0.22)" stroke="#6A9AE3" stroke-width="1"/>`;
      body += `<rect x="${rx + 4}" y="${y}" width="${rw - 8}" height="14" fill="rgba(245,158,24,0.24)" stroke="#F59E18" stroke-width="1"/>`;
    }
  }

  return `
    <svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <rect x="0" y="0" width="${W}" height="${H}" fill="#041330"/>
      <rect x="${lx}" y="12" width="${lw}" height="${H - 24}" fill="#08204F" stroke="#1E3E78"/>
      <rect x="${rx}" y="12" width="${rw}" height="${H - 24}" fill="#08204F" stroke="#1E3E78"/>
      <line x1="${lx + lw + 1}" y1="10" x2="${lx + lw + 1}" y2="${H - 10}" stroke="#6A9AE3" stroke-width="1" stroke-dasharray="3 3"/>
      <line x1="${rx - 1}" y1="10" x2="${rx - 1}" y2="${H - 10}" stroke="#6A9AE3" stroke-width="1" stroke-dasharray="3 3"/>
      ${body}
    </svg>
  `;
}

function renderQuiz() {
  const r = QUIZ_ROUNDS[quizRound];
  const picked = quizPicked[quizRound];
  document.getElementById("quizPrompt").textContent = r.prompt;
  const grid = document.getElementById("quizGrid");
  grid.innerHTML = "";

  r.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-opt";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", String(picked === idx));
    if (picked !== null) {
      if (idx === r.correct) btn.classList.add("is-right");
      else if (idx === picked) btn.classList.add("is-wrong");
    }
    btn.innerHTML = `
      <div class="quiz-opt-head">
        <span class="quiz-opt-label">${opt.label}</span>
        <span class="quiz-opt-reveal">${picked !== null ? opt.reveal : ""}</span>
      </div>
      ${makeQuizSvg(opt, quizRound === 1)}
    `;
    btn.addEventListener("click", () => {
      quizPicked[quizRound] = idx;
      renderQuiz();
    });
    grid.append(btn);
  });

  const fb = document.getElementById("quizFeedback");
  if (picked === null) {
    fb.className = "quiz-feedback";
    fb.textContent = "点击上方任意一版（四版只差一个变量），立即揭晓参数并查看排印判词。";
  } else {
    const ok = picked === r.correct;
    fb.className = `quiz-feedback ${ok ? "is-right" : "is-wrong"}`;
    fb.textContent = `${r.options[picked].reason}${ok ? "" : `（最佳选项是 ${r.options[r.correct].label}：${r.options[r.correct].reveal}）`}`;
  }

  document.querySelectorAll("#quizRoundTabs .seg-btn").forEach((b) => {
    const active = Number(b.dataset.round) === quizRound;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
}

document.getElementById("quizRoundTabs").addEventListener("click", (ev) => {
  const btn = ev.target.closest("[data-round]");
  if (!btn) return;
  quizRound = Number(btn.dataset.round);
  renderQuiz();
});
document.getElementById("quizResetBtn").addEventListener("click", () => {
  quizPicked[quizRound] = null;
  renderQuiz();
});
renderQuiz();

/* ==================== 07 原海报放大灯箱（复用 #poster.src） ==================== */
const lb = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbViewport = document.getElementById("lbViewport");
const posterImg = document.getElementById("poster");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lb.hidden = false;
  document.getElementById("lbClose").focus();
}

function closeLightbox() {
  lb.hidden = true;
  document.getElementById("posterOpenBtn").focus();
}

document.getElementById("posterOpenBtn").addEventListener("click", openLightbox);
document.getElementById("lbClose").addEventListener("click", closeLightbox);
document.getElementById("lbZoomIn").addEventListener("click", () => {
  lbScale = clamp(lbScale + 0.35, 1, 3.4);
  applyLbTransform();
});
document.getElementById("lbZoomOut").addEventListener("click", () => {
  lbScale = clamp(lbScale - 0.35, 1, 3.4);
  if (lbScale === 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
});
document.getElementById("lbReset").addEventListener("click", () => {
  lbScale = 1; lbX = 0; lbY = 0;
  applyLbTransform();
});

lbViewport.addEventListener("wheel", (ev) => {
  ev.preventDefault();
  lbScale = clamp(lbScale + (ev.deltaY < 0 ? 0.2 : -0.2), 1, 3.4);
  if (lbScale === 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
}, { passive: false });

lbViewport.addEventListener("pointerdown", (ev) => {
  if (ev.target === lbViewport && lbScale === 1) {
    closeLightbox();
    return;
  }
  lbDrag = { id: ev.pointerId, sx: ev.clientX, sy: ev.clientY, ox: lbX, oy: lbY };
  try { lbViewport.setPointerCapture(ev.pointerId); } catch {}
});
lbViewport.addEventListener("pointermove", (ev) => {
  if (!lbDrag) return;
  lbX = lbDrag.ox + (ev.clientX - lbDrag.sx);
  lbY = lbDrag.oy + (ev.clientY - lbDrag.sy);
  applyLbTransform();
});
lbViewport.addEventListener("pointerup", () => { lbDrag = null; });
lbViewport.addEventListener("pointercancel", () => { lbDrag = null; });

window.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && !lb.hidden) closeLightbox();
});

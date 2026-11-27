// 347 流程页幻灯片版式 — 主交互控制器（单真源同步 + 7 大节独立交互 + 原海报 Lightbox）

import {
  SCENARIOS,
  cloneStep,
  computeLayout,
  createBrokenState,
  createPresetState,
  diagnose,
} from "./model.js";
import { mountFlowStage } from "./stage-flow.js";
import { mountChunkStage } from "./stage-chunk.js";

let state = createBrokenState("poster");

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const flowCanvas = $("#flow-canvas");
const topStatus = $("#top-status");
const heroRail = $("#hero-rail");
const fiveList = $("#five-list");
const diagChip = $("#diag-chip");
const diagGrade = $("#diag-grade");
const diagHeadline = $("#diag-headline");
const diagBody = $("#diag-body");
const diagFix = $("#diag-fix");
const mqChip = $("#mq-chip");
const mqHeadline = $("#mq-headline");
const pillarsGrid = $("#pillars-grid");
const rngBreath = $("#rng-breath");
const valBreath = $("#val-breath");
const valSteps = $("#val-steps");
const togInput = $("#tog-input");
const togOutput = $("#tog-output");
const togCaps = $("#tog-caps");

const FIVE_ICONS = {
  steps: `<svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 3v12M4 4h9l-2 3 2 3H4"/></svg>`,
  direction: `<svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h11M10 5l4 4-4 4"/></svg>`,
  relation: `<svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7.5 10.5l3-3M6 12a3 3 0 0 1 0-4.2l1.2-1.2M12 6a3 3 0 0 1 0 4.2l-1.2 1.2"/></svg>`,
  transform: `<svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7a5 5 0 0 1 8.5-2.5L14 6M14 11a5 5 0 0 1-8.5 2.5L4 12"/></svg>`,
  result: `<svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="9" r="6"/><circle cx="9" cy="9" r="2.2" fill="currentColor"/></svg>`,
};

const stage = mountFlowStage(
  flowCanvas,
  () => state,
  (mutator) => {
    mutator(state);
    syncUI();
  }
);

let lastFiveHtml = "";
let lastPillarsHtml = "";

function syncUI() {
  const rect = flowCanvas.getBoundingClientRect();
  const layout = computeLayout(state, Math.max(280, rect.width || 900), Math.max(240, rect.height || 390));
  const diag = diagnose(state, layout);

  // 顶栏状态徽章
  const chipText = diag.score === 4 ? "4/4 · 清晰流转" : `${diag.score}/4 · ${diag.topIssue ? diag.topIssue.badge : "待修"}`;
  if (topStatus.textContent !== chipText) topStatus.textContent = chipText;
  topStatus.classList.toggle("is-ok", diag.score === 4);
  topStatus.classList.toggle("is-bad", diag.score < 4);

  // 标题下自示范推进轨实时亮灭
  const railMap = {
    in: state.hasInput,
    s1: diag.fiveElements[0].pass,
    s2: diag.fiveElements[1].pass && diag.fiveElements[3].pass,
    out: state.hasOutput,
  };
  for (const node of heroRail.querySelectorAll(".rail-node")) {
    const ok = railMap[node.dataset.rail];
    node.classList.toggle("is-lit", ok);
    node.classList.toggle("is-err", !ok);
  }

  // 右上角原海报同款五要素实时检视匣（仅在内容变化时更新 DOM，拖动零回流）
  const nextFiveHtml = diag.fiveElements
    .map(
      (el) => `
      <li>
        <button type="button" class="five-item-btn" data-five-key="${el.key}">
          <span class="five-ico" aria-hidden="true">${FIVE_ICONS[el.key]}</span>
          <span class="five-key">${el.label}</span>
          <span class="five-desc">${el.posterDesc}</span>
          <span class="five-tag ${el.pass ? "is-ok" : "is-bad"}">${el.status}</span>
        </button>
      </li>`
    )
    .join("");
  if (nextFiveHtml !== lastFiveHtml) {
    fiveList.innerHTML = nextFiveHtml;
    lastFiveHtml = nextFiveHtml;
  }

  // 单真源白话诊单
  if (diagChip.textContent !== chipText) diagChip.textContent = chipText;
  diagChip.classList.toggle("is-ok", diag.score === 4);
  diagChip.classList.toggle("is-bad", diag.score < 4);
  if (diagGrade.textContent !== diag.gradeLabel) diagGrade.textContent = diag.gradeLabel;
  if (diagHeadline.textContent !== diag.headline) diagHeadline.textContent = diag.headline;
  if (diagBody.textContent !== diag.body) diagBody.textContent = diag.body;
  if (diagFix.textContent !== diag.nextStep) diagFix.textContent = diag.nextStep;

  // 移动端快捷诊断条同步
  if (mqChip.textContent !== chipText) mqChip.textContent = chipText;
  mqChip.classList.toggle("is-ok", diag.score === 4);
  mqChip.classList.toggle("is-bad", diag.score < 4);
  if (mqHeadline.textContent !== diag.headline) mqHeadline.textContent = diag.headline;

  // 四大版式要点圆徽探针（SVG 图标，避免等宽字体缺少勾选字形）
  const icoOk = `<svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 7.2L5.6 10.2L11.5 3.8"/></svg>`;
  const icoBad = `<svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M7 3.2v4.6"/><circle cx="7" cy="10.8" r="1" fill="currentColor" stroke="none"/></svg>`;
  const nextPillarsHtml = diag.pillars
    .map(
      (p) => `
      <li class="pillar-row ${p.pass ? "is-ok" : "is-bad"}">
        <span class="pillar-badge-circle" aria-hidden="true">${p.pass ? icoOk : icoBad}</span>
        <div class="pillar-info">
          <div class="pillar-title-line">
            <span class="pillar-name">${p.title}</span>
            <span class="pillar-stat">${p.badge}</span>
          </div>
          <div class="pillar-sub">${p.posterBody}</div>
        </div>
      </li>`
    )
    .join("");
  if (nextPillarsHtml !== lastPillarsHtml) {
    pillarsGrid.innerHTML = nextPillarsHtml;
    lastPillarsHtml = nextPillarsHtml;
  }

  // 手术控制刀闸同步
  rngBreath.value = String(Math.round(state.breath * 100));
  valBreath.textContent = `留白 ${diag.metrics.whitespacePct}%`;
  valSteps.textContent = `${state.steps.length} 步`;
  togInput.setAttribute("aria-pressed", String(state.hasInput));
  togOutput.setAttribute("aria-pressed", String(state.hasOutput));
  togCaps.setAttribute("aria-pressed", String(state.showCaps));

  for (const btn of $$("[data-density]")) {
    btn.classList.toggle("is-active", btn.dataset.density === state.density);
  }
  for (const btn of $$("[data-loop]")) {
    btn.classList.toggle("is-active", btn.dataset.loop === state.loopMode);
  }
  for (const tab of $$(".sc-tab")) {
    const active = tab.dataset.scenario === state.scenario;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  }

  stage.draw();
}

// 点五要素匣中某一项，自动修正或提示对应维度
fiveList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-five-key]");
  if (!btn) return;
  const k = btn.dataset.fiveKey;
  const sc = SCENARIOS[state.scenario] || SCENARIOS.poster;
  if (k === "steps") {
    state.steps = state.steps.filter((s) => !s.redundant);
    while (state.steps.length < 3) state.steps.push(cloneStep(sc.coreSteps[state.steps.length]));
    state.arrows = Array(Math.max(0, state.steps.length - 1)).fill("fwd");
  } else if (k === "direction") {
    state.arrows = state.arrows.map(() => "fwd");
  } else if (k === "relation") {
    state.steps.sort((a, b) => a.order - b.order);
    if (state.loopMode === "spaghetti") state.loopMode = "clean";
  } else if (k === "transform") {
    state.hasInput = true;
    state.showCaps = true;
    state.density = "focused";
  } else if (k === "result") {
    state.hasOutput = true;
  }
  syncUI();
});

// 剧本切换
for (const tab of $$(".sc-tab")) {
  tab.addEventListener("click", () => {
    const nextId = tab.dataset.scenario;
    if (nextId === state.scenario) return;
    // 切换剧本时保留当前健康程度（如果刚打开是坏态则给新剧本坏态；如果已修好则切对应新剧本四步解）
    const curDiag = diagnose(state);
    state = curDiag.score === 4 ? createPresetState("poster-ideal", nextId) : createBrokenState(nextId);
    syncUI();
  });
}

// 主操作按钮
$("#btn-fix-ideal").addEventListener("click", () => {
  state = createPresetState("poster-ideal", state.scenario);
  syncUI();
});
$("#btn-mq-fix").addEventListener("click", () => {
  state = createPresetState("poster-ideal", state.scenario);
  syncUI();
});
$("#btn-reset-broken").addEventListener("click", () => {
  state = createBrokenState(state.scenario);
  syncUI();
});
for (const id of ["#btn-top-signal", "#btn-run-signal", "#btn-mq-signal"]) {
  $(id).addEventListener("click", () => stage.triggerSignal());
}

// 留白滑轨
rngBreath.addEventListener("input", () => {
  state.breath = Number(rngBreath.value) / 100;
  syncUI();
});

// 增删步骤
$("#btn-step-del").addEventListener("click", () => {
  if (state.steps.length <= 2) return;
  const redIdx = state.steps.findIndex((s) => s.redundant);
  const removeAt = redIdx >= 0 ? redIdx : state.steps.length - 1;
  state.steps.splice(removeAt, 1);
  state.arrows.splice(Math.min(removeAt, state.arrows.length - 1), 1);
  syncUI();
});

$("#btn-step-add").addEventListener("click", () => {
  if (state.steps.length >= 6) return;
  const sc = SCENARIOS[state.scenario] || SCENARIOS.poster;
  const pool = [...sc.coreSteps, sc.extraStep, ...sc.redundantSteps];
  const existing = new Set(state.steps.map((s) => s.id));
  const nextStep = pool.find((s) => !existing.has(s.id));
  if (!nextStep) return;
  state.steps.push(cloneStep(nextStep));
  state.arrows.push("fwd");
  syncUI();
});

// 端锚与胶囊开关
togInput.addEventListener("click", () => {
  state.hasInput = !state.hasInput;
  syncUI();
});
togOutput.addEventListener("click", () => {
  state.hasOutput = !state.hasOutput;
  syncUI();
});
togCaps.addEventListener("click", () => {
  state.showCaps = !state.showCaps;
  syncUI();
});

// 文案密度与回环切换
for (const btn of $$("[data-density]")) {
  btn.addEventListener("click", () => {
    state.density = btn.dataset.density;
    syncUI();
  });
}
for (const btn of $$("[data-loop]")) {
  btn.addEventListener("click", () => {
    state.loopMode = btn.dataset.loop;
    syncUI();
  });
}

// 合法多解与反向试错预设
for (const btn of $$("[data-preset]")) {
  btn.addEventListener("click", () => {
    state = createPresetState(btn.dataset.preset, state.scenario);
    syncUI();
  });
}

// 键盘操作：Space 注入信号流，左右方向键在画布聚焦时微调留白
window.addEventListener("keydown", (e) => {
  const lb = $("#lightbox");
  if (!lb.hidden) {
    if (e.key === "Escape") closeLightbox();
    return;
  }
  const tag = document.activeElement?.tagName;
  if (e.code === "Space" && tag !== "BUTTON" && tag !== "INPUT" && tag !== "A") {
    e.preventDefault();
    stage.triggerSignal();
  } else if (document.activeElement === flowCanvas) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      state.breath = Math.min(0.44, +(state.breath + 0.02).toFixed(2));
      syncUI();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      state.breath = Math.max(0.08, +(state.breath - 0.02).toFixed(2));
      syncUI();
    }
  }
});

/* ================= 01 流程五件套：剥离实验 ================= */
const stripState = {
  steps: true,
  direction: true,
  relation: true,
  transform: true,
  result: true,
};

function renderStripLab() {
  const host = $("#strip-svg-host");
  const verdict = $("#strip-verdict");
  const missing = Object.entries(stripState).filter(([, on]) => !on).map(([k]) => k);

  // 更新按钮外观
  for (const btn of $$("#strip-controls .strip-btn")) {
    const on = stripState[btn.dataset.el];
    btn.classList.toggle("is-on", on);
    btn.classList.toggle("is-off", !on);
    btn.setAttribute("aria-pressed", String(on));
    btn.querySelector(".sb-state").textContent = on ? "保留中" : "已剥离";
  }

  const showSteps = stripState.steps;
  const showDir = stripState.direction;
  const showRel = stripState.relation;
  const showTrans = stripState.transform;
  const showRes = stripState.result;

  const titles = showRel ? ["发现", "分析", "执行", "输出"] : ["执行", "发现", "输出", "分析"];
  const subTxt = showTrans ? ["识别问题", "拆解因素", "推进落地", "交付验证"] : ["背景说明", "补充材料", "会议记录", "相关资料"];
  const miniGlyphs = [
    (cx, cy) => `<circle cx="${cx - 1.5}" cy="${cy - 1.5}" r="5.2" fill="none" stroke="#FEF9EF" stroke-width="1.8"/><line x1="${cx + 2.4}" y1="${cy + 2.4}" x2="${cx + 6.5}" y2="${cy + 6.5}" stroke="#FEF9EF" stroke-width="1.8" stroke-linecap="round"/>`,
    (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="6.5" fill="#FEF9EF"/><path d="M${cx} ${cy}V${cy - 6.8}M${cx} ${cy}H${cx + 6.8}M${cx} ${cy}L${cx + 4.5} ${cy + 4.8}" stroke="#0E6042" stroke-width="1.6"/>`,
    (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="5.5" fill="none" stroke="#FEF9EF" stroke-width="2.6" stroke-dasharray="3.2 2.2"/><circle cx="${cx}" cy="${cy}" r="2.2" fill="#0E6042"/>`,
    (cx, cy) => `<rect x="${cx - 5}" y="${cy - 6}" width="10" height="12" rx="1.8" fill="#FEF9EF"/><path d="M${cx - 2.6} ${cy + 0.5}l2 2 3.8-4.2" fill="none" stroke="#0E6042" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  ];

  let cardsSvg = "";
  if (showSteps) {
    cardsSvg = titles
      .map((t, i) => {
        const x = 104 + i * 116;
        const y = 46;
        const arrow =
          i < 3
            ? showDir
              ? `<path d="M${x + 92} ${y + 42}h14l-4-6 10 8-10 8 4-6h-14z" fill="${showRel ? "#8ADDBA" : "#FF7B66"}"/>`
              : `<line x1="${x + 93}" y1="${y + 42}" x2="${x + 111}" y2="${y + 42}" stroke="#5F8D7B" stroke-dasharray="3 3" stroke-width="2"/>`
            : "";
        return `
          <rect x="${x + 14}" y="${y - 22}" width="60" height="18" rx="4" fill="${showRel ? "#8ADDBA" : "#F5C451"}"/>
          <text x="${x + 44}" y="${y - 10}" text-anchor="middle" font-size="11" font-weight="700" fill="#001C0F">${t}</text>
          <rect x="${x}" y="${y}" width="88" height="96" rx="8" fill="#F9F5E6"/>
          <circle cx="${x + 44}" cy="${y + 30}" r="14" fill="${showTrans ? "#0E6042" : "#7F998D"}"/>
          ${showTrans ? miniGlyphs[i](x + 44, y + 30) : ""}
          <text x="${x + 44}" y="${y + 62}" text-anchor="middle" font-size="13" font-weight="900" fill="#001C0F">${t}</text>
          <text x="${x + 44}" y="${y + 80}" text-anchor="middle" font-size="10.5" fill="#274335">${subTxt[i]}</text>
          ${arrow}
        `;
      })
      .join("");
  } else {
    cardsSvg = `
      <rect x="108" y="42" width="430" height="102" rx="10" fill="#F9F5E6"/>
      <text x="323" y="76" text-anchor="middle" font-size="15" font-weight="900" fill="#001C0F">一整团未拆分的项目大段落</text>
      <text x="323" y="102" text-anchor="middle" font-size="12" fill="#4A5E54">识别问题收集信息再拆解因素评估方案接着制定计划分配任务最终验证复盘……</text>
      <text x="323" y="124" text-anchor="middle" font-size="11" fill="#A82317">没有阶段边界，听众找不到落脚点</text>
    `;
  }

  const inputSvg = showTrans
    ? `<rect x="14" y="72" width="66" height="28" rx="6" fill="#8ADDBA"/><text x="47" y="90" text-anchor="middle" font-size="12" font-weight="700" fill="#001C0F">输入</text><path d="M84 86h14" stroke="#8ADDBA" stroke-width="4"/>`
    : `<rect x="14" y="72" width="66" height="28" rx="6" fill="none" stroke="#FF7B66" stroke-dasharray="4 3" stroke-width="1.6"/><text x="47" y="90" text-anchor="middle" font-size="11" fill="#FFB0A3">缺输入</text>`;

  const outputSvg = showRes
    ? `<path d="M554 86h14" stroke="#8ADDBA" stroke-width="4"/><rect x="570" y="72" width="66" height="28" rx="6" fill="#8ADDBA"/><text x="603" y="90" text-anchor="middle" font-size="12" font-weight="700" fill="#001C0F">结果</text>`
    : `<rect x="570" y="72" width="66" height="28" rx="6" fill="none" stroke="#FF7B66" stroke-dasharray="4 3" stroke-width="1.6"/><text x="603" y="90" text-anchor="middle" font-size="11" fill="#FFB0A3">无产出</text>`;

  host.innerHTML = `
    <svg viewBox="0 0 650 176" role="img" aria-label="流程五件套剥离实时示意图">
      ${inputSvg}
      ${cardsSvg}
      ${outputSvg}
    </svg>
  `;

  if (missing.length === 0) {
    verdict.classList.remove("is-broken");
    verdict.innerHTML = `<h3>五件套齐备：从输入到结果的因果一目了然</h3><p>点掉左侧任意一块零件试试——少任何一项，流程页就会立刻退化成普通文字块或并列卡片。</p>`;
  } else {
    verdict.classList.add("is-broken");
    const msgs = {
      steps: ["少了「步骤」：退化成一整块大段落", "过程没有被切成清晰阶段，读者必须在长句里自己划停顿，失去流程页的结构感。"],
      direction: ["少了「方向」：退化成四张并列卡片", "拿走箭头后，视觉上看不出先后流向，听众会把流程误读成四个互相独立的并行模块。"],
      relation: ["少了「关系」：顺序错乱、无法环环相扣", "步骤间失去承接因果，前一步做完不知道为什么进入下一步，逻辑链条当场断裂。"],
      transform: ["少了「转换」：变成枯燥的流水账", "既看不见原料输入，卡内也没写清发生了什么加工动作，观众只看到一串空洞名词。"],
      result: ["少了「结果」：忙活四步却不知道产出什么", "没有终点价值锚，汇报最关键的「所以带来了什么成果」悬在半空。"],
    };
    const [h, p] = msgs[missing[0]];
    verdict.innerHTML = `<h3>${h}${missing.length > 1 ? `（共剥离 ${missing.length} 项）` : ""}</h3><p>${p}</p>`;
  }
}

for (const btn of $$("#strip-controls .strip-btn")) {
  btn.addEventListener("click", () => {
    const k = btn.dataset.el;
    stripState[k] = !stripState[k];
    renderStripLab();
  });
}
renderStripLab();

/* ================= 02 拓扑选型图 ================= */
const TOPO_DATA = {
  loop: {
    title: "闭环迭代（原海报示范）：主干单向推进 + 底部统一虚线回环",
    body: "适用于产品研发、运营增长、教学改进等需要持续复盘的工作法。主干保持清晰的左→右单向粗箭头，再在卡片下方用细虚线与「迭代优化」胶囊回指各阶段，既表达闭环又不干扰主读线。",
    rule: "排布铁律：主干用实心粗箭，反馈用轻虚线；千万不要在卡片之间画满双向箭头。",
    svg: `<svg viewBox="0 0 640 210" role="img" aria-label="闭环迭代拓扑图">
      <rect x="16" y="70" width="54" height="28" rx="6" fill="#8ADDBA"/><text x="43" y="88" text-anchor="middle" font-size="12" font-weight="700" fill="#001C0F">输入</text>
      <path d="M76 84h18" stroke="#8ADDBA" stroke-width="5"/><polygon points="94,76 108,84 94,92" fill="#8ADDBA"/>
      ${["发现", "分析", "执行", "输出"].map((t, i) => {
        const x = 114 + i * 112;
        return `<rect x="${x}" y="44" width="84" height="86" rx="9" fill="#F9F5E6"/><text x="${x + 42}" y="92" text-anchor="middle" font-size="15" font-weight="900" fill="#001C0F">${t}</text>${
          i < 3 ? `<path d="M${x + 88} 84h12" stroke="#8ADDBA" stroke-width="5"/><polygon points="${x + 100},76 ${x + 111},84 ${x + 100},92" fill="#8ADDBA"/>` : ""
        }<line x1="${x + 42}" y1="168" x2="${x + 42}" y2="136" stroke="#C7DDD0" stroke-width="1.8" stroke-dasharray="5 4"/><polygon points="${x + 37},140 ${x + 42},132 ${x + 47},140" fill="#C7DDD0"/>`;
      }).join("")}
      <path d="M538 84h16" stroke="#8ADDBA" stroke-width="5"/><polygon points="554,76 566,84 554,92" fill="#8ADDBA"/>
      <rect x="570" y="70" width="54" height="28" rx="6" fill="#8ADDBA"/><text x="597" y="88" text-anchor="middle" font-size="12" font-weight="700" fill="#001C0F">结果</text>
      <line x1="156" y1="168" x2="492" y2="168" stroke="#C7DDD0" stroke-width="1.8" stroke-dasharray="6 5"/>
      <rect x="274" y="155" width="96" height="26" rx="6" fill="#8ADDBA"/><text x="322" y="172" text-anchor="middle" font-size="12" font-weight="700" fill="#001C0F">迭代优化</text>
    </svg>`,
  },
  linear: {
    title: "线性直推：一次性项目交付与标准操作步骤",
    body: "适用于活动筹备、入职指引、一次性的工程上线。没有多余反馈弧线，留白更慷慨，让观众把全部注意力放在「第 1 步到最后一步的推进节奏与交付物」上。",
    rule: "排布铁律：卡片等高齐底、间距均等，步数严控在 3–5 步，一眼扫到终点。",
    svg: `<svg viewBox="0 0 640 210" role="img" aria-label="线性直推拓扑图">
      <rect x="20" y="90" width="60" height="30" rx="6" fill="#8ADDBA"/><text x="50" y="109" text-anchor="middle" font-size="12" font-weight="700" fill="#001C0F">需求</text>
      <path d="M86 105h20" stroke="#8ADDBA" stroke-width="5"/><polygon points="106,97 120,105 106,113" fill="#8ADDBA"/>
      ${["01 立项", "02 开发", "03 验收"].map((t, i) => {
        const x = 128 + i * 144;
        return `<rect x="${x}" y="58" width="110" height="94" rx="10" fill="#F9F5E6"/><text x="${x + 55}" y="110" text-anchor="middle" font-size="16" font-weight="900" fill="#001C0F">${t}</text>${
          i < 2 ? `<path d="M${x + 115} 105h14" stroke="#8ADDBA" stroke-width="5"/><polygon points="${x + 129},97 ${x + 141},105 ${x + 129},113" fill="#8ADDBA"/>` : ""
        }`;
      }).join("")}
      <path d="M532 105h18" stroke="#8ADDBA" stroke-width="5"/><polygon points="550,97 564,105 550,113" fill="#8ADDBA"/>
      <rect x="568" y="90" width="56" height="30" rx="6" fill="#8ADDBA"/><text x="596" y="109" text-anchor="middle" font-size="12" font-weight="700" fill="#001C0F">上线</text>
    </svg>`,
  },
  branch: {
    title: "条件分叉：带审核闸口或路由判断的业务流程",
    body: "当流程中途存在「通过 / 驳回」「高价值 / 普通」等二选一闸口时，用一个醒目的判断菱形（承袭 ISO 5807 决策符号）分出上下双支线，千万不要为了对齐把分支硬抹平。",
    rule: "排布铁律：主路径保持水平直行，异常或补救分支走下轨，并在箭头上写清「是 / 否」条件。",
    svg: `<svg viewBox="0 0 640 210" role="img" aria-label="条件分叉拓扑图">
      <rect x="24" y="76" width="94" height="58" rx="9" fill="#F9F5E6"/><text x="71" y="110" text-anchor="middle" font-size="14" font-weight="900" fill="#001C0F">初审提交</text>
      <path d="M124 105h26" stroke="#8ADDBA" stroke-width="4"/><polygon points="150,98 162,105 150,112" fill="#8ADDBA"/>
      <polygon points="222,56 280,105 222,154 164,105" fill="#8ADDBA"/>
      <text x="222" y="109" text-anchor="middle" font-size="13" font-weight="900" fill="#001C0F">达标?</text>
      <path d="M282 105h48V56h42" fill="none" stroke="#8ADDBA" stroke-width="3.5"/><polygon points="372,49 384,56 372,63" fill="#8ADDBA"/>
      <text x="336" y="46" font-size="12" font-weight="700" fill="#9FEACC">是 · 放行</text>
      <rect x="388" y="28" width="110" height="56" rx="9" fill="#F9F5E6"/><text x="443" y="61" text-anchor="middle" font-size="14" font-weight="900" fill="#001C0F">正式发布</text>
      <path d="M282 105h48v48h42" fill="none" stroke="#FF7B66" stroke-width="3" stroke-dasharray="5 4"/><polygon points="372,146 384,153 372,160" fill="#FF7B66"/>
      <text x="336" y="176" font-size="12" font-weight="700" fill="#FFB0A3">否 · 退回修正</text>
      <rect x="388" y="125" width="110" height="56" rx="9" fill="#FDEEEB" stroke="#FF7B66" stroke-width="2"/><text x="443" y="158" text-anchor="middle" font-size="14" font-weight="900" fill="#8E1E14">补充材料</text>
      <path d="M504 56h32" stroke="#8ADDBA" stroke-width="4"/><polygon points="536,49 548,56 536,63" fill="#8ADDBA"/>
      <rect x="552" y="41" width="64" height="30" rx="6" fill="#8ADDBA"/><text x="584" y="60" text-anchor="middle" font-size="12" font-weight="700" fill="#001C0F">交付</text>
    </svg>`,
  },
  swimlane: {
    title: "双轨泳道：跨部门协作与交接职责",
    body: "当听众最关心「哪一步归谁做、在哪交接」时，用横向浅色泳道把角色隔开（如业务方 vs 研发方），让箭头跨过中线清晰标出每一次交接球。",
    rule: "排布铁律：单页幻灯片泳道不超过 2–3 条，否则行高被压扁、箭头交叉变乱。",
    svg: `<svg viewBox="0 0 640 210" role="img" aria-label="双轨泳道拓扑图">
      <rect x="16" y="18" width="608" height="78" rx="8" fill="#063927" stroke="#1C644A"/>
      <rect x="16" y="112" width="608" height="78" rx="8" fill="#063927" stroke="#1C644A"/>
      <text x="34" y="62" font-size="13" font-weight="700" fill="#9FEACC">产品团队</text>
      <text x="34" y="156" font-size="13" font-weight="700" fill="#9FEACC">研发团队</text>
      <rect x="120" y="34" width="108" height="46" rx="8" fill="#F9F5E6"/><text x="174" y="62" text-anchor="middle" font-size="13" font-weight="900" fill="#001C0F">定义需求</text>
      <path d="M228 57h28v94h24" fill="none" stroke="#8ADDBA" stroke-width="3.5"/><polygon points="280,144 292,151 280,158" fill="#8ADDBA"/>
      <rect x="296" y="128" width="114" height="46" rx="8" fill="#F9F5E6"/><text x="353" y="156" text-anchor="middle" font-size="13" font-weight="900" fill="#001C0F">开发与联调</text>
      <path d="M410 151h28V57h24" fill="none" stroke="#8ADDBA" stroke-width="3.5"/><polygon points="462,50 474,57 462,64" fill="#8ADDBA"/>
      <rect x="478" y="34" width="116" height="46" rx="8" fill="#8ADDBA"/><text x="536" y="62" text-anchor="middle" font-size="13" font-weight="900" fill="#001C0F">验收并上线</text>
    </svg>`,
  },
};

function renderTopo(key) {
  const item = TOPO_DATA[key] || TOPO_DATA.loop;
  $("#topo-svg-box").innerHTML = item.svg;
  $("#topo-explain").innerHTML = `<h3>${item.title}</h3><p>${item.body}</p><p class="topo-rule">${item.rule}</p>`;
  for (const tab of $$(".topo-tab")) {
    const on = tab.dataset.topo === key;
    tab.classList.toggle("is-active", on);
    tab.setAttribute("aria-selected", String(on));
  }
}

for (const tab of $$(".topo-tab")) {
  tab.addEventListener("click", () => renderTopo(tab.dataset.topo));
}
renderTopo("loop");

/* ================= 03 记忆四组块 ================= */
const rngChunks = $("#rng-chunks");
const valChunks = $("#val-chunks");
let chunkCount = Number(rngChunks.value);

const chunkStage = mountChunkStage($("#chunk-canvas"), () => chunkCount);

function updateChunkUI() {
  rngChunks.value = String(chunkCount);
  const tag = chunkCount >= 6 ? "超载" : chunkCount <= 2 ? "过少" : "甜点区间";
  valChunks.textContent = `${chunkCount} 步 · ${tag}`;
  chunkStage.draw();
}

rngChunks.addEventListener("input", () => {
  chunkCount = Number(rngChunks.value);
  updateChunkUI();
});
for (const btn of $$("[data-set-chunk]")) {
  btn.addEventListener("click", () => {
    chunkCount = Number(btn.dataset.setChunk);
    updateChunkUI();
  });
}
updateChunkUI();

/* ================= 04 流程从哪来：年代碑卡展开 ================= */
for (const card of $$("#history-grid .hist-card")) {
  const btn = card.querySelector(".hist-head");
  const tog = card.querySelector(".hist-toggle");
  btn.addEventListener("click", () => {
    const open = card.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
    tog.textContent = open ? "收起" : "展开";
  });
}

/* ================= 05 什么时候别用：分诊卡切换（可独立展开对比，无空洞拉伸） ================= */
for (const card of $$("#triage-grid .triage-card")) {
  const btn = card.querySelector(".triage-btn");
  btn.addEventListener("click", () => {
    const on = card.classList.toggle("is-active");
    btn.setAttribute("aria-pressed", String(on));
  });
}

/* ================= 06 小练习验真：单变量四选一 ================= */
const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    correct: false,
    reason: "A 版四张卡片和端锚都齐全，但步骤之间全画成了双向箭头（↔），听众分不清哪一步驱动哪一步；需要复盘迭代时，应保持主干单向并在底部画轻虚线回环。",
    svg: `<svg viewBox="0 0 420 130" aria-hidden="true">
      <rect x="6" y="46" width="38" height="22" rx="4" fill="#8ADDBA"/><text x="25" y="61" text-anchor="middle" font-size="9.5" font-weight="700" fill="#001C0F">沉默客</text>
      <path d="M48 57h14" stroke="#8ADDBA" stroke-width="2.5"/>
      ${["分层", "触达", "试跑", "复购"].map((t, i) => {
        const x = 66 + i * 76;
        return `<rect x="${x}" y="26" width="58" height="66" rx="6" fill="#F9F5E6"/><text x="${x + 29}" y="56" text-anchor="middle" font-size="11" font-weight="900" fill="#001C0F">${t}</text><line x1="${x + 12}" y1="70" x2="${x + 46}" y2="70" stroke="#7A978A" stroke-width="2"/><line x1="${x + 12}" y1="79" x2="${x + 40}" y2="79" stroke="#7A978A" stroke-width="2"/>${
          i < 3 ? `<text x="${x + 67}" y="61" text-anchor="middle" font-size="13" font-weight="700" fill="#8ADDBA">↔</text>` : ""
        }`;
      }).join("")}
      <path d="M356 57h14" stroke="#8ADDBA" stroke-width="2.5"/>
      <rect x="374" y="46" width="40" height="22" rx="4" fill="#8ADDBA"/><text x="394" y="61" text-anchor="middle" font-size="9.5" font-weight="700" fill="#001C0F">复购升</text>
    </svg>`,
  },
  {
    id: "B",
    label: "方案 B",
    correct: true,
    reason: "B 版最符合流程页的视觉逻辑：4 个关键阶段恰好在 4 组块记忆甜点内，主干单向箭头清晰推进，左右「沉默客 → 复购升」端锚交代来去，底部轻虚线承载持续复盘。",
    svg: `<svg viewBox="0 0 420 130" aria-hidden="true">
      <rect x="6" y="46" width="38" height="22" rx="4" fill="#8ADDBA"/><text x="25" y="61" text-anchor="middle" font-size="9.5" font-weight="700" fill="#001C0F">沉默客</text>
      <path d="M48 57h14" stroke="#8ADDBA" stroke-width="2.5"/>
      ${["分层", "触达", "试跑", "复购"].map((t, i) => {
        const x = 66 + i * 76;
        return `<rect x="${x}" y="22" width="58" height="66" rx="6" fill="#F9F5E6"/><text x="${x + 29}" y="52" text-anchor="middle" font-size="11" font-weight="900" fill="#001C0F">${t}</text><line x1="${x + 12}" y1="66" x2="${x + 46}" y2="66" stroke="#7A978A" stroke-width="2"/><line x1="${x + 12}" y1="75" x2="${x + 40}" y2="75" stroke="#7A978A" stroke-width="2"/>${
          i < 3 ? `<text x="${x + 67}" y="57" text-anchor="middle" font-size="13" font-weight="700" fill="#8ADDBA">→</text>` : ""
        }`;
      }).join("")}
      <path d="M356 57h14" stroke="#8ADDBA" stroke-width="2.5"/>
      <rect x="374" y="46" width="40" height="22" rx="4" fill="#8ADDBA"/><text x="394" y="61" text-anchor="middle" font-size="9.5" font-weight="700" fill="#001C0F">复购升</text>
      <line x1="95" y1="108" x2="323" y2="108" stroke="#C7DDD0" stroke-width="1.5" stroke-dasharray="4 3"/>
      <rect x="180" y="99" width="60" height="18" rx="4" fill="#8ADDBA"/><text x="210" y="111" text-anchor="middle" font-size="9.5" font-weight="700" fill="#001C0F">迭代复盘</text>
    </svg>`,
  },
  {
    id: "C",
    label: "方案 C",
    correct: false,
    reason: "C 版方向和端锚都对，但硬把 7 个琐碎动作（导表、建群、审批等）平铺在一页里，每张卡片被压成细条、突破 3–5 步认知甜点，后排观众一眼看不清主线。",
    svg: `<svg viewBox="0 0 420 130" aria-hidden="true">
      <rect x="4" y="48" width="32" height="20" rx="4" fill="#8ADDBA"/><text x="20" y="61" text-anchor="middle" font-size="8.5" font-weight="700" fill="#001C0F">输入</text>
      ${["导表", "分层", "建群", "写稿", "审批", "试跑", "存档"].map((t, i) => {
        const x = 42 + i * 48;
        return `<rect x="${x}" y="28" width="38" height="66" rx="4" fill="#F9F5E6"/><text x="${x + 19}" y="58" text-anchor="middle" font-size="9.5" font-weight="900" fill="#001C0F">${t}</text><line x1="${x + 7}" y1="72" x2="${x + 31}" y2="72" stroke="#7A978A" stroke-width="1.6"/>${
          i < 6 ? `<text x="${x + 43}" y="61" text-anchor="middle" font-size="9.5" fill="#8ADDBA">→</text>` : ""
        }`;
      }).join("")}
      <rect x="382" y="48" width="34" height="20" rx="4" fill="#8ADDBA"/><text x="399" y="61" text-anchor="middle" font-size="8.5" font-weight="700" fill="#001C0F">结果</text>
    </svg>`,
  },
  {
    id: "D",
    label: "方案 D",
    correct: false,
    reason: "D 版虽然也是 4 张卡配单向箭头，但省掉了左右「输入 / 结果」端锚，还把「试跑」排在了「分层」之前，观众既看不到起点与产出，也在因果顺序上当场打结。",
    svg: `<svg viewBox="0 0 420 130" aria-hidden="true">
      ${["试跑", "分层", "触达", "复购"].map((t, i) => {
        const x = 46 + i * 86;
        return `<rect x="${x}" y="26" width="66" height="70" rx="6" fill="#F9F5E6"/><text x="${x + 33}" y="58" text-anchor="middle" font-size="11.5" font-weight="900" fill="#001C0F">${t}</text><line x1="${x + 14}" y1="73" x2="${x + 52}" y2="73" stroke="#7A978A" stroke-width="2"/><line x1="${x + 14}" y1="82" x2="${x + 44}" y2="82" stroke="#7A978A" stroke-width="2"/>${
          i < 3 ? `<text x="${x + 76}" y="63" text-anchor="middle" font-size="13" font-weight="700" fill="#8ADDBA">→</text>` : ""
        }`;
      }).join("")}
    </svg>`,
  },
];

const quizGrid = $("#quiz-grid");
const quizFeedback = $("#quiz-feedback");

function renderQuiz(pickedId = null) {
  quizGrid.innerHTML = QUIZ_OPTIONS.map((opt) => {
    const picked = pickedId === opt.id;
    const cls = picked ? (opt.correct ? "is-picked-ok" : "is-picked-bad") : "";
    return `
      <button type="button" class="quiz-opt ${cls}" data-quiz="${opt.id}" role="radio" aria-checked="${picked}">
        <div class="quiz-opt-head">
          <span class="quiz-opt-label">${opt.label}</span>
          <span>${picked ? (opt.correct ? "已选 · 正确" : "已选 · 再对比变量") : "点击选择"}</span>
        </div>
        <div class="quiz-opt-svg">${opt.svg}</div>
      </button>
    `;
  }).join("");

  if (!pickedId) {
    quizFeedback.hidden = true;
    return;
  }
  const chosen = QUIZ_OPTIONS.find((o) => o.id === pickedId);
  quizFeedback.hidden = false;
  quizFeedback.classList.toggle("is-wrong", !chosen.correct);
  quizFeedback.innerHTML = `
    <h3>${chosen.correct ? "选对了！方案 B 兼顾了单向推进、四组块容量与起止端锚" : `选了 ${chosen.label}，再核对一下它变动的那一个结构变量`}</h3>
    <p>${chosen.reason}</p>
    <ul class="quiz-breakdown">
      ${QUIZ_OPTIONS.map((o) => `<li><strong>${o.label}${o.correct ? "（最佳）" : ""}：</strong>${o.reason}</li>`).join("")}
    </ul>
    <button type="button" class="btn-outline" id="btn-quiz-retry">清除选择再看一遍</button>
  `;
  $("#btn-quiz-retry").addEventListener("click", () => renderQuiz(null));
}

quizGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-quiz]");
  if (!btn) return;
  renderQuiz(btn.dataset.quiz);
});
renderQuiz(null);

/* ================= 07 原海报 Lightbox（放大 / 拖动 / Esc 关） ================= */
const lb = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbZoomVal = $("#lb-zoom-val");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbZoomVal.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = $("#poster").src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lb.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  lb.hidden = true;
  $("#poster-trigger").focus();
}

$("#poster-trigger").addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => {
  lbScale = Math.min(3.2, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
$("#lb-zoom-out").addEventListener("click", () => {
  lbScale = Math.max(0.6, +(lbScale - 0.35).toFixed(2));
  applyLbTransform();
});
$("#lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.16 : -0.16;
  lbScale = Math.max(0.6, Math.min(3.5, +(lbScale + delta).toFixed(2)));
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  lbDrag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: lbX, oy: lbY };
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag || lbDrag.id !== e.pointerId) return;
  lbX = lbDrag.ox + (e.clientX - lbDrag.sx);
  lbY = lbDrag.oy + (e.clientY - lbDrag.sy);
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => { lbDrag = null; });
lbStage.addEventListener("pointercancel", () => { lbDrag = null; });

// 初次渲染同步
syncUI();

// 222 普通流布局 · 主交互入口
// 串联：开场活体文档流修复台、01 路径对比、02 真实 DOM 普通流沙盒、03 历史时间轴、04 破流场景切签、05 CSS 四道细活、06 单变量小练习、07 原海报灯箱

import {
  createInitialState,
  computeFlowLayout,
  VALID_PRESETS,
  FAIL_PRESETS,
} from "./model.js";
import { mountHeroStage } from "./hero-stage.js";

const state = createInitialState();

// ==================== HERO 文档自然流修复台 ====================
const canvas = document.getElementById("hero-canvas");
const railBead = document.getElementById("rail-bead");
const btnSweep = document.getElementById("btn-sweep");
const heroStatusPill = document.getElementById("hero-status-pill");
const stageCaption = document.getElementById("stage-caption");

const ctrlMeasure = document.getElementById("ctrl-measure");
const outMeasure = document.getElementById("out-measure");
const ctrlRhythm = document.getElementById("ctrl-rhythm");
const outRhythm = document.getElementById("out-rhythm");

const btnFigFlow = document.getElementById("btn-fig-flow");
const btnOrder = document.getElementById("btn-order");
const btnFixedH = document.getElementById("btn-fixed-h");
const btnMultiCol = document.getElementById("btn-multi-col");

const probeOrder = document.getElementById("probe-order");
const probeRhythm = document.getElementById("probe-rhythm");
const probeContinuity = document.getElementById("probe-continuity");

const diagCard = document.getElementById("diag-card");
const diagScore = document.getElementById("diag-score");
const diagTitle = document.getElementById("diag-title");
const diagDetail = document.getElementById("diag-detail");
const diagHint = document.getElementById("diag-hint");

function setChipState(el, text, kind, pressed) {
  el.textContent = text;
  el.classList.remove("is-err", "is-ok");
  if (kind) el.classList.add(kind);
  el.setAttribute("aria-pressed", String(!!pressed));
}

function syncHeroUI() {
  const rect = canvas.getBoundingClientRect();
  const lay = computeFlowLayout(state, {
    w: Math.max(300, Math.round(rect.width || 720)),
    h: Math.max(260, Math.round(rect.height || 460)),
  });

  // 顶部状态徽标
  heroStatusPill.textContent = lay.badge;
  heroStatusPill.classList.toggle("is-ok", lay.isValid);
  heroStatusPill.classList.toggle("is-err", !lay.isValid);

  // 图注同步
  const capSpan = stageCaption.querySelector("span:first-child");
  if (capSpan) capSpan.textContent = lay.spec.caption;

  // 滑杆与读数（单真源，手机短格避免换行）
  ctrlMeasure.value = String(state.measurePct);
  const narrow = window.innerWidth <= 640;
  outMeasure.textContent = narrow ? `${lay.charsPerLine} 字/行` : `${lay.charsPerLine} 字/行 (${lay.equivPx}px)`;
  ctrlRhythm.value = String(state.rhythm);
  outRhythm.textContent = `${lay.rhythmPx}px`;

  // 四个流状态按钮
  const isAbs = state.figureFlow === "absolute";
  setChipState(btnFigFlow, isAbs ? "插图：脱流 absolute" : "插图：在流内 static", isAbs ? "is-err" : "is-ok", isAbs);

  const isRev = lay.inversions > 0;
  setChipState(btnOrder, isRev ? "顺序：逆流交叉" : "顺序：DOM 顺排", isRev ? "is-err" : "is-ok", isRev);

  setChipState(btnFixedH, state.fixedHeight ? "定高陷阱：开" : "定高陷阱：关", state.fixedHeight ? "is-err" : "", state.fixedHeight);
  setChipState(btnMultiCol, state.multiCol ? "强制双栏：开" : "强制双栏：关", state.multiCol ? "is-err" : "", state.multiCol);

  // 三大支柱实时探针
  const setProbe = (el, p) => {
    el.textContent = p.tag;
    el.classList.toggle("is-ok", p.ok);
    el.classList.toggle("is-err", !p.ok);
  };
  setProbe(probeOrder, lay.pillars.order);
  setProbe(probeRhythm, lay.pillars.rhythm);
  setProbe(probeContinuity, lay.pillars.continuity);

  // 单真源诊断卡
  diagCard.classList.toggle("is-ok", lay.isValid);
  diagCard.classList.toggle("is-err", !lay.isValid);
  diagScore.textContent = lay.isValid ? "4/4 · 全部通过" : `${lay.passedCount}/4 · 尚有 ${4 - lay.passedCount} 项待修`;
  diagTitle.textContent = lay.headline;
  diagDetail.textContent = lay.detail;
  diagHint.textContent = lay.actionHint;

  // 语境按钮高亮
  document.querySelectorAll("[data-specimen]").forEach((btn) => {
    const on = btn.dataset.specimen === state.specimen;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  });
}

let stage = null;
let dragUiRaf = 0;
function patchState(patch, opts = {}) {
  Object.assign(state, patch);
  if (patch.visualOrder) state.visualOrder = [...patch.visualOrder];
  if (opts.fromDrag) {
    if (!dragUiRaf) {
      dragUiRaf = requestAnimationFrame(() => {
        dragUiRaf = 0;
        syncHeroUI();
      });
    }
  } else {
    syncHeroUI();
  }
  if (stage) stage.draw();
}

stage = mountHeroStage(
  canvas,
  () => state,
  (patch, opts) => patchState(patch, opts),
  (running, progress) => {
    btnSweep.classList.toggle("is-running", running);
    if (railBead) {
      railBead.classList.toggle("is-active", running);
      const track = railBead.parentElement;
      if (track) {
        const span = Math.max(40, track.clientHeight - 28);
        railBead.style.transform = `translate(-50%, ${Math.round(progress * span)}px)`;
      }
    }
  }
);

syncHeroUI();

// 控件监听
document.querySelectorAll("[data-specimen]").forEach((btn) => {
  btn.addEventListener("click", () => patchState({ specimen: btn.dataset.specimen }));
});

ctrlMeasure.addEventListener("input", () => patchState({ measurePct: Number(ctrlMeasure.value) }));
ctrlRhythm.addEventListener("input", () => patchState({ rhythm: Number(ctrlRhythm.value) }));

btnFigFlow.addEventListener("click", () => {
  patchState({ figureFlow: state.figureFlow === "absolute" ? "static" : "absolute" });
});

btnOrder.addEventListener("click", () => {
  const isNatural = state.visualOrder.every((v, i) => v === i);
  patchState({ visualOrder: isNatural ? [0, 4, 1, 2, 3] : [0, 1, 2, 3, 4] });
});

btnFixedH.addEventListener("click", () => patchState({ fixedHeight: !state.fixedHeight }));
btnMultiCol.addEventListener("click", () => patchState({ multiCol: !state.multiCol }));

document.querySelectorAll("[data-valid]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = VALID_PRESETS[btn.dataset.valid];
    if (p) patchState(p.patch);
  });
});

document.querySelectorAll("[data-fail]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = FAIL_PRESETS[btn.dataset.fail];
    if (p) patchState(p.patch);
  });
});

document.getElementById("btn-fix-all").addEventListener("click", () => {
  patchState(VALID_PRESETS.standard.patch);
});

document.getElementById("btn-reset-broken").addEventListener("click", () => {
  const fresh = createInitialState();
  fresh.specimen = state.specimen;
  patchState(fresh);
});

btnSweep.addEventListener("click", () => stage.triggerSweep());

// 全局 Space 演播（仅在未聚焦按钮/输入框时生效，避免拦截正常表单）
window.addEventListener("keydown", (ev) => {
  if (ev.code === "Space" && document.activeElement === document.body) {
    ev.preventDefault();
    stage.triggerSweep();
  }
});

// ==================== 01 双模式路径对比 ====================
const CMP_DATA = {
  essay: {
    flowStat: "分岔 0 次 · 顺流直达（示意）",
    scatterStat: "分岔 4 次 · 反复跳读（示意）",
    flowNote: "视线从主标题直落导语、插图与承接段，整篇文章只有一条纵轴，零决策负担。",
    scatterNote: "长文被拆进大小不一的悬浮卡片与侧栏，每读完一段都得停下来判断该往右看还是往下看。",
    flowBlocks: [
      { x: 96, y: 18, w: 168, h: 16, fill: "#045EC8", lbl: "1 标题" },
      { x: 96, y: 44, w: 168, h: 32, fill: "#BFD9F4", lbl: "2 导语" },
      { x: 96, y: 86, w: 168, h: 48, fill: "#9CC4EC", lbl: "3 插图" },
      { x: 96, y: 144, w: 168, h: 30, fill: "#BFD9F4", lbl: "4 承接" },
      { x: 96, y: 184, w: 168, h: 22, fill: "#DCEBFB", lbl: "5 结语" },
    ],
    scatterBlocks: [
      { x: 22, y: 18, w: 148, h: 22, fill: "#045EC8", lbl: "1 标题" },
      { x: 186, y: 18, w: 150, h: 66, fill: "#9CC4EC", lbl: "3 插图提前" },
      { x: 22, y: 52, w: 148, h: 54, fill: "#BFD9F4", lbl: "2 导语" },
      { x: 186, y: 126, w: 150, h: 76, fill: "#DCEBFB", lbl: "5 结语插队" },
      { x: 22, y: 120, w: 148, h: 82, fill: "#BFD9F4", lbl: "4 承接" },
    ],
  },
  guide: {
    flowStat: "步骤 1→4 单向递进（示意）",
    scatterStat: "视线折返 3 次 · 易漏步（示意）",
    flowNote: "操作步骤按先后顺排，读完第一步眼睛自然落到第二步，不易跳漏前提条件。",
    scatterNote: "多栏格网里用户常不确定是横向 1→2 还是纵向 1→2，易漏看右侧警示框。",
    flowBlocks: [
      { x: 96, y: 18, w: 168, h: 20, fill: "#045EC8", lbl: "Step 1 准备" },
      { x: 96, y: 48, w: 168, h: 36, fill: "#BFD9F4", lbl: "Step 2 安装" },
      { x: 96, y: 94, w: 168, h: 44, fill: "#9CC4EC", lbl: "Step 3 验证" },
      { x: 96, y: 148, w: 168, h: 26, fill: "#BFD9F4", lbl: "Step 4 发布" },
      { x: 96, y: 184, w: 168, h: 20, fill: "#DCEBFB", lbl: "提示" },
    ],
    scatterBlocks: [
      { x: 20, y: 18, w: 100, h: 60, fill: "#045EC8", lbl: "Step 1" },
      { x: 132, y: 18, w: 100, h: 84, fill: "#BFD9F4", lbl: "Step 3?" },
      { x: 244, y: 18, w: 96, h: 52, fill: "#DCEBFB", lbl: "提示" },
      { x: 20, y: 90, w: 100, h: 108, fill: "#9CC4EC", lbl: "Step 2" },
      { x: 132, y: 114, w: 208, h: 84, fill: "#BFD9F4", lbl: "Step 4" },
    ],
  },
  mobile: {
    flowStat: "单指纵滑 · 0 横移（示意）",
    scatterStat: "双栏挤压 · 折行破碎（示意）",
    flowNote: "390px 窄屏上普通流天生贴合拇指纵向滑动，每个块都拿到完整可读宽度。",
    scatterNote: "窄屏强留两列卡片会让每行只剩 6–8 个汉字，同时出现左右视差与错位留白。",
    flowBlocks: [
      { x: 118, y: 16, w: 124, h: 18, fill: "#045EC8", lbl: "1 标题" },
      { x: 118, y: 42, w: 124, h: 38, fill: "#BFD9F4", lbl: "2 正文段" },
      { x: 118, y: 88, w: 124, h: 48, fill: "#9CC4EC", lbl: "3 配图" },
      { x: 118, y: 144, w: 124, h: 34, fill: "#BFD9F4", lbl: "4 续段" },
      { x: 118, y: 186, w: 124, h: 20, fill: "#DCEBFB", lbl: "5 按钮" },
    ],
    scatterBlocks: [
      { x: 112, y: 16, w: 62, h: 54, fill: "#045EC8", lbl: "1 窄标" },
      { x: 180, y: 16, w: 68, h: 38, fill: "#9CC4EC", lbl: "3 小图" },
      { x: 112, y: 78, w: 62, h: 82, fill: "#BFD9F4", lbl: "2 碎段" },
      { x: 180, y: 62, w: 68, h: 74, fill: "#BFD9F4", lbl: "4 碎段" },
      { x: 180, y: 144, w: 68, h: 56, fill: "#DCEBFB", lbl: "5 按钮" },
    ],
  },
};

let activeCmp = "essay";
let showTrace = true;

function renderCompareSVG(svg, blocks, isFlow) {
  const color = isFlow ? "#045EC8" : "#C82820";
  const parts = [];
  blocks.forEach((b) => {
    const textFill = b.fill === "#045EC8" ? "#FFFFFF" : "#0A1B33";
    parts.push(
      `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="6" fill="${b.fill}"/>` +
      `<text x="${b.x + 10}" y="${b.y + Math.min(b.h / 2 + 4, 18)}" font-size="11" font-weight="700" fill="${textFill}">${b.lbl}</text>`
    );
  });

  if (showTrace) {
    // 按逻辑顺序连线（scatter 里故意按 1→2→3→4→5 的逻辑跳动展示折返）
    const seq = isFlow ? [0, 1, 2, 3, 4] : [0, 2, 1, 4, 3];
    const pts = seq.map((i) => {
      const b = blocks[i];
      return { x: b.x + b.w * 0.72, y: b.y + b.h * 0.5 };
    });
    const d = pts.map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    parts.push(
      `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.4" ${isFlow ? "" : 'stroke-dasharray="5 4"'} stroke-linecap="round" stroke-linejoin="round"/>`
    );
    pts.forEach((p, idx) => {
      parts.push(
        `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="8.5" fill="${color}"/>` +
        `<text x="${p.x.toFixed(1)}" y="${(p.y + 3.5).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#FFFFFF">${idx + 1}</text>`
      );
    });
  }
  svg.innerHTML = parts.join("");
}

function updateCompare() {
  const d = CMP_DATA[activeCmp];
  document.getElementById("cmp-flow-stat").textContent = d.flowStat;
  document.getElementById("cmp-scatter-stat").textContent = d.scatterStat;
  document.getElementById("cmp-flow-note").textContent = d.flowNote;
  document.getElementById("cmp-scatter-note").textContent = d.scatterNote;
  renderCompareSVG(document.getElementById("svg-cmp-flow"), d.flowBlocks, true);
  renderCompareSVG(document.getElementById("svg-cmp-scatter"), d.scatterBlocks, false);
}

document.querySelectorAll("[data-cmp]").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeCmp = btn.dataset.cmp;
    document.querySelectorAll("[data-cmp]").forEach((b) => {
      const on = b.dataset.cmp === activeCmp;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    updateCompare();
  });
});

const btnTrace = document.getElementById("btn-trace");
btnTrace.addEventListener("click", () => {
  showTrace = !showTrace;
  btnTrace.textContent = showTrace ? "路径透视线：开" : "路径透视线：关";
  btnTrace.setAttribute("aria-pressed", String(showTrace));
  updateCompare();
});

updateCompare();

// ==================== 02 真实 DOM 普通流沙盒 ====================
const EXTRA_SENTENCES = [
  " 当编辑再补充一句话，段落盒会自动向下延展，并实时通知下方所有兄弟块一起挪位。",
  " 哪怕读者在手机上把字号放大到 130%，普通流也会平滑重排，不会出现两段文字互相盖住的事故。",
  " 这就是浏览器默认布局最可贵的地方：不靠人工算像素坐标，整页自然保持安全距离。",
];

let extraCount = 0;
let baseSiblingTop = null;
const sbDoc = document.getElementById("sb-doc");
const sbLead = document.getElementById("sb-lead");
const sbLeadCopy = document.getElementById("sb-lead-copy");
const sbSibling = document.getElementById("sb-sibling");
const sbMH1 = document.getElementById("sb-m-h1");
const sbMShift = document.getElementById("sb-m-shift");
const sbMGap = document.getElementById("sb-m-gap");
const sbExpTitle = document.getElementById("sb-exp-title");
const sbExpBody = document.getElementById("sb-exp-body");

const BASE_LEAD_TEXT = sbLeadCopy.textContent;

function measureSandbox() {
  const rLead = sbLead.getBoundingClientRect();
  const rSib = sbSibling.getBoundingClientRect();
  const rDoc = sbDoc.getBoundingClientRect();
  const relSibTop = Math.round(rSib.top - rDoc.top);
  if (baseSiblingTop === null) baseSiblingTop = relSibTop;
  const shift = relSibTop - baseSiblingTop;
  const gap = Math.round(rSib.top - rLead.bottom);

  sbMH1.textContent = `${Math.round(rLead.height)} px`;
  sbMShift.textContent = `${shift >= 0 ? "+" : ""}${shift} px`;
  sbMGap.textContent = `${gap} px`;

  const liveCss = document.getElementById("sb-css-live");
  if (liveCss) {
    const fixed = sbDoc.classList.contains("is-fixed-h");
    const blk = sbDoc.classList.contains("is-block-chips");
    liveCss.innerHTML = `<code>.lead { height: ${fixed ? "54px; /* 溢出撞段 */" : "auto;"} margin-bottom: 24px; }\n.sibling { margin-top: 18px; } /* 实测净距 ${gap}px */\n.chip { display: ${blk ? "block" : "inline-block"}; }</code>`;
  }
}

document.getElementById("sb-add-text").addEventListener("click", () => {
  if (extraCount < EXTRA_SENTENCES.length) {
    extraCount++;
    sbLeadCopy.textContent = BASE_LEAD_TEXT + EXTRA_SENTENCES.slice(0, extraCount).join("");
  } else {
    extraCount = 0;
    sbLeadCopy.textContent = BASE_LEAD_TEXT;
  }
  measureSandbox();
  if (sbDoc.classList.contains("is-fixed-h")) {
    sbExpTitle.textContent = "定高锁死：第一段文字溢出撞进兄弟块";
    sbExpBody.textContent = "因为写死了 height: 54px，兄弟块以为第一段只有 54px 高而不肯再让位，多出来的字直接盖到了兄弟块身上。";
  } else {
    sbExpTitle.textContent = extraCount > 0 ? "实测生效：第一段撑高，兄弟块顺流下推" : "已还原初始字数，兄弟块自动回弹";
    sbExpBody.textContent = "浏览器并没有写任何坐标动画——仅仅因为两个块都在普通流里且 height: auto，下游元素就会永远保持安全净距。";
  }
});

document.getElementById("sb-reset-text").addEventListener("click", () => {
  extraCount = 0;
  sbLeadCopy.textContent = BASE_LEAD_TEXT;
  sbDoc.classList.remove("is-fixed-h", "show-collapse", "is-block-chips");
  ["sb-toggle-collapse", "sb-toggle-display", "sb-toggle-fixed"].forEach((id) => {
    const b = document.getElementById(id);
    b.classList.remove("is-active");
    b.setAttribute("aria-pressed", "false");
  });
  measureSandbox();
  sbExpTitle.textContent = "默认普通流：内容变长，兄弟自动下移";
  sbExpBody.textContent = "已回到干净的普通流状态。可以继续往第一段加字，或切换外边距折叠、行内/块级与定高陷阱对照观察。";
});

document.getElementById("sb-toggle-collapse").addEventListener("click", (ev) => {
  const on = sbDoc.classList.toggle("show-collapse");
  ev.currentTarget.classList.toggle("is-active", on);
  ev.currentTarget.setAttribute("aria-pressed", String(on));
  measureSandbox();
  sbExpTitle.textContent = on ? "外边距折叠（Margin Collapse）" : "已关闭外边距折叠透视";
  sbExpBody.textContent = on
    ? "普通流块格式化上下文（BFC）里，相邻两块的竖向外边距不会相加（24 + 18 ≠ 42px），而是取较大值 24px 合并。想隔断折叠可用 display: flow-root。"
    : "回到常规观察视图。继续点击任意按钮验证浏览器真实几何测量。";
});

document.getElementById("sb-toggle-display").addEventListener("click", (ev) => {
  const on = sbDoc.classList.toggle("is-block-chips");
  ev.currentTarget.classList.toggle("is-active", on);
  ev.currentTarget.setAttribute("aria-pressed", String(on));
  measureSandbox();
  sbExpTitle.textContent = on ? "切为 display: block（块级纵向堆叠）" : "切回 display: inline-block（行内横向流淌）";
  sbExpBody.textContent = on
    ? "三枚标签改为块级后，每一枚都独占整行并把下一枚往下推——块级纵向、行内横向共同组成了 CSS 普通流。"
    : "三枚标签回到行内方向横向排队，宽不够时才折到下一行。";
});

document.getElementById("sb-toggle-fixed").addEventListener("click", (ev) => {
  const on = sbDoc.classList.toggle("is-fixed-h");
  ev.currentTarget.classList.toggle("is-active", on);
  ev.currentTarget.setAttribute("aria-pressed", String(on));
  if (on && extraCount === 0) {
    extraCount = 1;
    sbLeadCopy.textContent = BASE_LEAD_TEXT + EXTRA_SENTENCES[0];
  }
  measureSandbox();
  sbExpTitle.textContent = on ? "定高陷阱开启：height: 54px 破坏自动让位" : "已恢复 height: auto，叠字立刻消除";
  sbExpBody.textContent = on
    ? "把段落高度锁死在 54px 后，长文字冲出红虚线盒底，直接盖住下方兄弟块。写普通流页面时，除特殊裁切需求外不要给文本块写死 height。"
    : "解除固定高度后，浏览器重新按实际文本高度撑开段落，兄弟块顺流下移。";
});

requestAnimationFrame(() => measureSandbox());

// ==================== 03 演进时间轴 ====================
const ERAS = {
  "1991": {
    kicker: "TIM BERNERS-LEE · CERN · 1991",
    title: "第一份 HTML 标签说明书，只有一条线性流",
    body: "1991 年末，蒂姆·伯纳斯-李（Tim Berners-Lee）在欧洲核子研究中心（CERN）整理出《HTML Tags》，列出最初约 18 个用于学术文档的语义标签（标题、段落、列表、超链接）。无论是早期的 WorldWideWeb 浏览器还是纯字符界面的 Line Mode Browser，都按源码顺序从上到下线性排版，不依赖固定像素坐标。",
    cite: "出处：Tim Berners-Lee, HTML Tags (CERN, 1991)",
    winTitle: "CERN Line Mode Browser (1991)",
    winTag: "LINEAR STREAM",
    cls: "is-1991",
    html: `<p class="ep-h1">NORMAL FLOW DOCUMENT</p>
      <p class="ep-p">Title, paragraph, and list flow strictly in HTML source order without fixed coordinates.</p>
      <p class="ep-fig">[ FIGURE: AUTO-PLACED IN FLOW ]</p>
      <p class="ep-p">Every terminal width wraps lines naturally and pushes following lines downward.</p>`,
  },
  "1996": {
    kicker: "HÅKON WIUM LIE & BERT BOS · W3C · 1996",
    title: "CSS1 正式分离结构与样式，守住普通流底座",
    body: "1994 年 Håkon Wium Lie 在 CERN 提出级联样式表构想，随后与 Bert Bos 合作完善。1996 年 12 月 17 日 W3C 正式发布 CSS Level 1 推荐标准：HTML 继续专注线性文档结构，CSS 接管字体、颜色与外边距，而默认块级/行内流排布仍是所有页面的出发点。",
    cite: "出处：W3C CSS Level 1 Recommendation (1996-12-17) / Bert Bos, A brief history of CSS",
    winTitle: "W3C CSS1 Document (1996)",
    winTag: "STRUCTURE + STYLE",
    cls: "is-1996",
    html: `<p class="ep-h1">Cascading Style Sheets, Level 1</p>
      <p class="ep-p">Margins, typography, and colors arrive — while headings and paragraphs still stack automatically in source order.</p>
      <p class="ep-fig">margin-top: 1.5em; margin-bottom: 0.6em;</p>
      <p class="ep-p">Separating style from markup keeps the reading sequence clean across browsers.</p>`,
  },
  "2011": {
    kicker: "W3C CSS 2.0 (1998) → CSS 2.1 §9.4 (2011)",
    title: "CSS 2.1 第 9.4 节正式写清普通流的数学规则",
    body: "1998 年 5 月发布的 CSS2 与 2011 年 6 月 7 日定稿的 CSS 2.1 推荐标准在第 9.4 节（Normal flow）中系统定义了块格式化上下文（BFC）与行内格式化上下文（IFC），并明确区分「在普通流内」与「浮动 / 绝对定位脱流」两大阵营——这套视觉格式化模型至今仍是浏览器的核心排版规则。",
    cite: "出处：W3C CSS 2.1 Recommendation, Section 9.4 Normal flow (2011-06-07)",
    winTitle: "CSS 2.1 §9.4 Visual Formatting Model",
    winTag: "BFC + IFC",
    cls: "is-2011",
    html: `<p class="ep-h1">[BFC] block-level box #1 (width: auto)</p>
      <p class="ep-p">[IFC] line box 1 → wraps inline boxes → line box 2</p>
      <p class="ep-fig">[BFC] adjacent vertical margins collapse inside flow</p>
      <p class="ep-p">Out-of-flow (float / absolute) exits normal flow.</p>`,
  },
  "2018": {
    kicker: "CSS DISPLAY LEVEL 3 & WCAG 2.1 (C27)",
    title: "拆解内外流类型，并将「读序一致」写入无障碍标准",
    body: "现代 W3C CSS Display Module Level 3 把 display 拆分为外部显示（参与父流）与内部显示（flow / flow-root / flex / grid）；同时 WCAG 2.1 成功标准 1.3.2（技术 C27）明确指出：让视觉顺序与 DOM 源码的普通流顺序保持一致，是保障键盘导航与屏幕阅读器可访问性的最稳妥方法。",
    cite: "出处：W3C CSS Display Module Level 3 / WCAG 2.1 SC 1.3.2 Technique C27",
    winTitle: "Display Level 3 + WCAG 1.3.2",
    winTag: "FLOW & A11Y",
    cls: "is-2018",
    html: `<p class="ep-h1">display: block flow; /* outer + inner */</p>
      <p class="ep-p">DOM Order #1 → #2 → #3 === Visual Order === Tab &amp; Screen Reader Order</p>
      <p class="ep-fig">Logical axes: block-axis &amp; inline-axis adapt cleanly to horizontal-tb or vertical-rl.</p>
      <p class="ep-p">Normal flow remains the resilient foundation beneath Flex and Grid.</p>`,
  },
};

document.querySelectorAll("[data-era]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const e = ERAS[btn.dataset.era];
    if (!e) return;
    document.querySelectorAll("[data-era]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    document.getElementById("era-kicker").textContent = e.kicker;
    document.getElementById("era-title").textContent = e.title;
    document.getElementById("era-body").textContent = e.body;
    document.getElementById("era-cite").textContent = e.cite;
    document.getElementById("era-win-title").textContent = e.winTitle;
    document.getElementById("era-win-tag").textContent = e.winTag;
    const box = document.getElementById("era-canvas-box");
    box.className = `era-canvas-box ${e.cls}`;
    box.innerHTML = e.html;
  });
});

// ==================== 04 破流场景切签 ====================
const ESCAPE_DATA = {
  align: {
    desc: "导航条、工具按钮排成一排，或仪表面板要同时对齐横纵两轴时，普通流只能竖排拉长页面。",
    links: [
      '一维对齐与空间分配交给 <a href="https://layout.xiaoxiaodong.ai/226/play/" target="_blank" rel="noopener">226 弹性盒布局</a>。',
      '二维行列骨架交给 <a href="https://layout.xiaoxiaodong.ai/227/play/" target="_blank" rel="noopener">227 网格布局</a>，嵌套卡片跨级对齐交给 <a href="https://layout.xiaoxiaodong.ai/228/play/" target="_blank" rel="noopener">228 子网格布局</a>。',
      '不等高图库密铺交给 <a href="https://layout.xiaoxiaodong.ai/236/play/" target="_blank" rel="noopener">236 瀑布流布局</a>。',
    ],
  },
  pos: {
    desc: "需要图文绕排、角标压图、吸顶目录或全屏弹窗时，必须有节制地离开或偏移普通流。",
    links: [
      '文字绕图用 <a href="https://layout.xiaoxiaodong.ai/231/play/" target="_blank" rel="noopener">231 浮动布局</a>，微调原位用 <a href="https://layout.xiaoxiaodong.ai/232/play/" target="_blank" rel="noopener">232 相对定位布局</a>。',
      '局部精准锚定用 <a href="https://layout.xiaoxiaodong.ai/233/play/" target="_blank" rel="noopener">233 绝对定位布局</a>，始终贴住视口用 <a href="https://layout.xiaoxiaodong.ai/234/play/" target="_blank" rel="noopener">234 固定定位布局</a>。',
      '先随流滚再贴顶用 <a href="https://layout.xiaoxiaodong.ai/235/play/" target="_blank" rel="noopener">235 粘性定位布局</a>，有意叠层弹框用 <a href="https://layout.xiaoxiaodong.ai/237/play/" target="_blank" rel="noopener">237 覆盖布局</a>。',
    ],
  },
  dense: {
    desc: "需要横向对照字段数值，或在宽屏报刊里让文本自动跨栏流淌时，单列普通流效率偏低。",
    links: [
      '报刊式连续分栏文本交给 <a href="https://layout.xiaoxiaodong.ai/229/play/" target="_blank" rel="noopener">229 多栏布局</a>。',
      '行列交叉的参数表与财务明细交给 <a href="https://layout.xiaoxiaodong.ai/230/play/" target="_blank" rel="noopener">230 表格布局</a>。',
    ],
  },
  screen: {
    desc: "普通流提供纵向顺序，但页面如何响应从 390px 手机到 2560px 宽屏的尺度变化，需要配合宽度与断点策略。",
    links: [
      '定宽与百分比伸缩见 <a href="https://layout.xiaoxiaodong.ai/238/play/" target="_blank" rel="noopener">238 固定宽度布局</a> 与 <a href="https://layout.xiaoxiaodong.ai/239/play/" target="_blank" rel="noopener">239 流体布局</a>。',
      '跨屏断点重构见 <a href="https://layout.xiaoxiaodong.ai/240/play/" target="_blank" rel="noopener">240 响应式布局</a> 与 <a href="https://layout.xiaoxiaodong.ai/241/play/" target="_blank" rel="noopener">241 自适应布局</a>。',
      '按局部容器宽切换形态见 <a href="https://layout.xiaoxiaodong.ai/242/play/" target="_blank" rel="noopener">242 容器查询布局</a>。',
    ],
  },
};

document.querySelectorAll("[data-esc]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const d = ESCAPE_DATA[btn.dataset.esc];
    if (!d) return;
    document.querySelectorAll("[data-esc]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    document.getElementById("escape-detail").innerHTML =
      `<p class="esc-desc">${d.desc}</p><ul class="esc-links">${d.links.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  });
});

// ==================== 05 写好普通流的四道细活 ====================
const cfMeasure = document.getElementById("cf-measure");
const cfRhythm = document.getElementById("cf-rhythm");
const cfFocus = document.getElementById("cf-focus");
const cfNoCss = document.getElementById("cf-nocss");
const craftArticle = document.getElementById("craft-article");
const craftCode = document.getElementById("craft-code");

function syncCraft() {
  const noCss = cfNoCss.checked;
  craftArticle.classList.toggle("no-css", noCss);
  craftArticle.classList.toggle("has-measure", !noCss && cfMeasure.checked);
  craftArticle.classList.toggle("has-rhythm", !noCss && cfRhythm.checked);
  craftArticle.classList.toggle("show-focus", cfFocus.checked);

  const stW = document.getElementById("cf-st-width");
  const stA = document.getElementById("cf-st-a11y");

  if (noCss) {
    craftCode.innerHTML = `<code>/* 所有视觉样式已剥离 (WCAG 1.3.2 C27 体检)\n   仅凭语义 HTML 与浏览器默认普通流，\n   标题与正文仍保持清晰阅读顺序。 */</code>`;
    if (stW) stW.textContent = "零 CSS 裸流：HTML 语义顺序完好";
    if (stA) stA.textContent = "WCAG 1.3.2 C27 体检通过";
    return;
  }
  const lines = [];
  if (cfMeasure.checked) {
    lines.push("article {\n  max-inline-size: 34em;\n  margin-inline: auto;\n}");
    if (stW) stW.textContent = "行长上限：34em（满足 WCAG 1.4.8）";
  } else {
    lines.push("article {\n  max-inline-size: none; /* 桌面行过宽 */\n}");
    if (stW) stW.textContent = "行长上限：已解除（宽屏易串行）";
  }
  if (cfRhythm.checked) {
    lines.push("h3 { margin-block: 1.9em 0.55em; }");
  } else {
    lines.push("h3, p { margin-block: 1em; } /* 上下等距 */");
  }
  if (cfFocus.checked) {
    lines.push("/* DOM 序 #1→#2→#3→#4 === 视觉序 === Tab 序 */");
  }
  if (stA) stA.textContent = cfFocus.checked ? "已标出 #1→#4 键盘/读屏顺读焦点" : "WCAG 1.3.2 顺读一致";
  craftCode.innerHTML = `<code>${lines.join("\n")}</code>`;
}

[cfMeasure, cfRhythm, cfFocus, cfNoCss].forEach((el) => el.addEventListener("change", syncCraft));
syncCraft();

// ==================== 06 单变量小练习 ====================
const QUIZ_FEEDBACK = {
  A: {
    ok: false,
    head: "方案 A 还差一步：小标题失去了视觉归属",
    body: "顺序、不重叠和行宽都做对了，但把小标题上下间距与段距全设为相等的 18px 后，标题悬在两段正中间，读者一瞥很难分清它统领的是上一段还是下一段。普通流的「节奏」靠标题上大下小建立亲密性。",
  },
  B: {
    ok: true,
    head: "选对了！方案 B 四项普通流要素全部到位",
    body: "DOM 顺序与视觉顺序一致，全员留在普通流（static + height: auto）保证手机折行或放大字号也不叠字，32 汉字/行落在 WCAG 1.4.8（≤ 40 字）舒适区间内，小标题上 32px 大于下 10px 让章节节奏一眼分明。",
  },
  C: {
    ok: false,
    head: "方案 C 踩了脱流坑：插图会在窄屏或放字时压住正文",
    body: "给插图写死 position: absolute; top: 180px 后，它立刻脱离普通流不再占位。只要屏幕缩到 390px 导致导语多折两行，下方正文就会直接钻到插图背面被遮挡。",
  },
  D: {
    ok: false,
    head: "方案 D 少了行长上限：桌面端 62 汉字/行极易串行",
    body: "虽然块都乖乖留在普通流里，但块级容器默认 width: 100% 会撑满 1280px 屏幕，远远超过 WCAG 1.4.8 建议的 40 汉字上限。加上 max-inline-size 才是完整的单列阅读流。",
  },
};

const quizCards = [...document.querySelectorAll(".quiz-card")];
const qfBox = document.getElementById("quiz-feedback");
const qfHead = document.getElementById("qf-head");
const qfBody = document.getElementById("qf-body");

quizCards.forEach((card) => {
  card.addEventListener("click", () => {
    const opt = card.dataset.opt;
    const res = QUIZ_FEEDBACK[opt];
    if (!res) return;
    quizCards.forEach((c) => {
      c.classList.remove("is-right", "is-wrong");
      c.setAttribute("aria-pressed", String(c === card));
    });
    card.classList.add(res.ok ? "is-right" : "is-wrong");
    qfBox.hidden = false;
    qfBox.classList.toggle("is-right", res.ok);
    qfBox.classList.toggle("is-wrong", !res.ok);
    qfHead.textContent = res.head;
    qfBody.textContent = res.body;
  });
});

document.getElementById("qf-reset").addEventListener("click", () => {
  quizCards.forEach((c) => {
    c.classList.remove("is-right", "is-wrong");
    c.setAttribute("aria-pressed", "false");
  });
  qfBox.hidden = true;
});

// ==================== 07 原海报放大、拖动与 Esc 关闭 ====================
const posterOpen = document.getElementById("poster-open");
const posterImg = document.getElementById("poster");
const lightbox = document.getElementById("lightbox");
const lbViewport = document.getElementById("lb-viewport");
const lbImg = document.getElementById("lb-img");
const lbZoomReset = document.getElementById("lb-zoom-reset");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDrag = false;
let lbStartX = 0;
let lbStartY = 0;
let lbBaseX = 0;
let lbBaseY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbZoomReset.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterImg.currentSrc || posterImg.src;
  lbScale = 1.15;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
  lightbox.hidden = false;
  posterOpen.setAttribute("aria-expanded", "true");
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterOpen.setAttribute("aria-expanded", "false");
  posterOpen.focus();
}

posterOpen.addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-zoom-in").addEventListener("click", () => {
  lbScale = Math.min(3.5, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
document.getElementById("lb-zoom-out").addEventListener("click", () => {
  lbScale = Math.max(0.6, +(lbScale - 0.35).toFixed(2));
  applyLbTransform();
});
lbZoomReset.addEventListener("click", () => {
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
});

lbViewport.addEventListener("pointerdown", (ev) => {
  lbDrag = true;
  lbStartX = ev.clientX;
  lbStartY = ev.clientY;
  lbBaseX = lbTx;
  lbBaseY = lbTy;
  lbViewport.classList.add("is-grabbing");
  try {
    lbViewport.setPointerCapture(ev.pointerId);
  } catch {}
});

lbViewport.addEventListener("pointermove", (ev) => {
  if (!lbDrag) return;
  lbTx = lbBaseX + (ev.clientX - lbStartX);
  lbTy = lbBaseY + (ev.clientY - lbStartY);
  applyLbTransform();
});

const stopLbDrag = () => {
  lbDrag = false;
  lbViewport.classList.remove("is-grabbing");
};
lbViewport.addEventListener("pointerup", stopLbDrag);
lbViewport.addEventListener("pointercancel", stopLbDrag);

lbViewport.addEventListener("wheel", (ev) => {
  ev.preventDefault();
  const delta = ev.deltaY < 0 ? 0.2 : -0.2;
  lbScale = Math.max(0.6, Math.min(3.5, +(lbScale + delta).toFixed(2)));
  applyLbTransform();
}, { passive: false });

window.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && !lightbox.hidden) {
    ev.preventDefault();
    closeLightbox();
  }
});

// 窗口尺寸变化时重算沙盒与画布
window.addEventListener("resize", () => {
  syncHeroUI();
  measureSandbox();
});

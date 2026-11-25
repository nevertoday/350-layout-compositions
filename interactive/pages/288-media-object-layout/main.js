// 288 媒体对象布局 · 主控逻辑（串联开场单真源、01–07 全部交互与原海报灯箱）

import { evaluate, INITIAL_STATE, PRESETS } from "./model.js";
import { mountHeroStage } from "./stage-canvas.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ==================== HERO：单真源活体配对放映台 ====================
const state = { ...INITIAL_STATE };
const heroCanvas = $("#hero-stage");

const ui = {
  statusPill: $("#hero-status-pill"),
  playBtn: $("#hero-play-btn"),
  shareInput: $("#ctrl-share"),
  gapInput: $("#ctrl-gap"),
  valShare: $("#val-share"),
  valGap: $("#val-gap"),
  wrapBtn: $("#ctrl-wrap"),
  wrapGroup: $("#wrap-group"),
  diagCard: $("#diag-card"),
  diagBadge: $("#diag-badge"),
  diagTitle: $("#diag-title"),
  diagBody: $("#diag-body"),
  diagNext: $("#diag-next"),
  mShare: $("#m-share"),
  mGap: $("#m-gap"),
  mRatio: $("#m-ratio"),
  mScan: $("#m-scan"),
  nodeVisual: $("#node-visual"),
  nodeProximity: $("#node-proximity"),
  nodeContext: $("#node-context"),
  pillVisual: $("#pill-visual"),
  pillProximity: $("#pill-proximity"),
  pillContext: $("#pill-context"),
  prVisual: $("#pr-visual"),
  prProximity: $("#pr-proximity"),
  prHierarchy: $("#pr-hierarchy"),
  prConsistency: $("#pr-consistency"),
  prBVisual: $("#pr-b-visual"),
  prBProximity: $("#pr-b-proximity"),
  prBHierarchy: $("#pr-b-hierarchy"),
  prBConsistency: $("#pr-b-consistency"),
  takeawayCapsule: $("#takeaway-capsule"),
  tkMoons: $("#tk-moons"),
  tkScore: $("#tk-score"),
  mobileDiagStrip: $("#mobile-diag-strip"),
  mdsBadge: $("#mds-badge"),
  mdsTitle: $("#mds-title"),
};

function setText(el, val) {
  if (el.textContent !== val) el.textContent = val;
}

function setAttr(el, k, val) {
  if (el.getAttribute(k) !== val) el.setAttribute(k, val);
}

function syncHeroUI() {
  const sz = stageCtrl ? stageCtrl.getSize() : { w: 720, h: 416 };
  const ev = evaluate(state, sz.w, sz.h);

  // 顶部状态胶囊
  setText(ui.statusPill, ev.allGood ? "4/4 图文同频" : `${ev.passedCount}/4 待配对`);
  ui.statusPill.dataset.state = ev.allGood ? "ok" : "bad";

  // 播放按钮（全字体覆盖零缺字）
  setAttr(ui.playBtn, "aria-pressed", String(state.playing));
  setText(ui.playBtn, state.playing ? "|| 暂停画面" : "▶ 播放晨光");

  // 滑轨与数值同步
  if (ui.shareInput.value !== String(ev.sharePct)) ui.shareInput.value = String(ev.sharePct);
  if (ui.gapInput.value !== String(ev.gap)) ui.gapInput.value = String(ev.gap);
  setText(ui.valShare, `${ev.sharePct}%`);
  setText(ui.valGap, `${ev.gap}px`);

  // 按钮组激活态
  $$("[data-scene]").forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    setAttr(b, "aria-pressed", String(on));
  });
  $$("[data-arr]").forEach((b) => {
    const on = b.dataset.arr === state.arrangement;
    b.classList.toggle("is-active", on);
    setAttr(b, "aria-pressed", String(on));
  });
  $$("[data-hier]").forEach((b) => {
    const on = b.dataset.hier === state.hierarchy;
    b.classList.toggle("is-active", on);
    setAttr(b, "aria-pressed", String(on));
  });
  $$("[data-ctx]").forEach((b) => {
    const on = b.dataset.ctx === state.contextMode;
    b.classList.toggle("is-active", on);
    setAttr(b, "aria-pressed", String(on));
  });

  // 浮动绕排仅在横排时有效
  const isStacked = state.arrangement === "stacked";
  ui.wrapGroup.classList.toggle("is-dim", isStacked);
  ui.wrapBtn.disabled = isStacked;
  setAttr(ui.wrapBtn, "aria-pressed", String(!isStacked && state.wrapUnder));
  setText(
    ui.wrapBtn,
    isStacked
      ? "横排可测绕排"
      : state.wrapUnder
        ? "浮动绕排试错：开（断轴）"
        : "浮动绕排试错：关"
  );

  // 单真源白话诊单（同步手机首屏诊单条）
  ui.diagCard.dataset.ok = String(ev.allGood);
  setText(ui.diagBadge, ev.summaryBadge);
  setText(ui.diagTitle, ev.summaryTitle);
  setText(ui.diagBody, ev.summaryDetail);
  setText(ui.diagNext, ev.summaryNext);
  ui.mobileDiagStrip.dataset.ok = String(ev.allGood);
  setText(ui.mdsBadge, ev.allGood ? "4/4 成立" : `${ev.passedCount}/4 失配`);
  setText(ui.mdsTitle, ev.summaryTitle);

  setText(ui.mShare, `${ev.sharePct}% / ${ev.actualAreaPct}%`);
  setText(ui.mGap, `${ev.gap}px`);
  setText(ui.mRatio, `${ev.hierarchyRatio.toFixed(2)}×`);
  setText(ui.mScan, ev.scanLoad);

  // 右侧三节点原海报标注状态
  ui.nodeVisual.dataset.ok = String(ev.checks.visual.ok);
  setText(ui.pillVisual, ev.checks.visual.badge);
  ui.nodeProximity.dataset.ok = String(ev.checks.proximity.ok);
  setText(ui.pillProximity, ev.checks.proximity.badge);
  ui.nodeContext.dataset.ok = String(ev.checks.context.ok);
  setText(ui.pillContext, ev.checks.context.badge);

  // 底部四项布局原则实况
  ui.prVisual.dataset.ok = String(ev.checks.visual.ok);
  setText(ui.prBVisual, ev.checks.visual.badge);
  ui.prProximity.dataset.ok = String(ev.checks.proximity.ok);
  setText(ui.prBProximity, ev.checks.proximity.badge);
  ui.prHierarchy.dataset.ok = String(ev.checks.hierarchy.ok);
  setText(ui.prBHierarchy, ev.checks.hierarchy.badge);
  ui.prConsistency.dataset.ok = String(ev.allGood);
  setText(ui.prBConsistency, ev.allGood ? "4/4 统一" : `${ev.passedCount}/4 失配`);

  // 底部五相月蚀青圆进度点亮（0/4 → 5 枚暗；每过 1 项亮 1 格，4/4 全 5 枚齐亮！）
  const litCount = ev.allGood ? 5 : ev.passedCount;
  ui.takeawayCapsule.dataset.score = String(ev.passedCount);
  setText(ui.tkScore, `${ev.passedCount}/4`);
  setAttr(ui.tkMoons, "aria-label", `配对完成度 ${ev.passedCount} 格，满分 4 格`);
  $$(".moon", ui.tkMoons).forEach((m, idx) => {
    m.classList.toggle("is-lit", idx < litCount);
  });
}

let stageCtrl = null;
let uiQueued = false;
function mutateState(patch) {
  Object.assign(state, patch);
  if (stageCtrl) stageCtrl.markDirty();
  if (!uiQueued) {
    uiQueued = true;
    requestAnimationFrame(() => {
      uiQueued = false;
      syncHeroUI();
      if (stageCtrl) stageCtrl.draw();
    });
  }
}

stageCtrl = mountHeroStage(heroCanvas, () => state, mutateState);
syncHeroUI();

// 绑定开场全部原生控件
$$("[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => mutateState({ scene: btn.dataset.scene }));
});
$$("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) mutateState({ ...p.patch });
  });
});
$$("[data-arr]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const arr = btn.dataset.arr;
    mutateState({
      arrangement: arr,
      wrapUnder: arr === "stacked" ? false : state.wrapUnder,
    });
  });
});
$$("[data-hier]").forEach((btn) => {
  btn.addEventListener("click", () => mutateState({ hierarchy: btn.dataset.hier }));
});
$$("[data-ctx]").forEach((btn) => {
  btn.addEventListener("click", () => mutateState({ contextMode: btn.dataset.ctx }));
});
ui.shareInput.addEventListener("input", () => {
  mutateState({ mediaShare: Number(ui.shareInput.value) / 100 });
});
ui.gapInput.addEventListener("input", () => {
  mutateState({ gapPx: Number(ui.gapInput.value) });
});
ui.wrapBtn.addEventListener("click", () => {
  if (state.arrangement === "stacked") return;
  mutateState({ wrapUnder: !state.wrapUnder });
});
ui.playBtn.addEventListener("click", () => {
  mutateState({ playing: !state.playing });
});

// ==================== 01 节：拖幕分割对比器 + 眼跳路径重播 ====================
const curtainRange = $("#curtain-range");
const curtainBad = $("#curtain-bad");
const curtainHandle = $("#curtain-handle");
const curtainReadout = $("#curtain-readout");
const replayBtn = $("#replay-saccade");

function updateCurtain(pct) {
  curtainBad.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
  curtainHandle.style.left = `${pct}%`;
  const hint =
    pct <= 28
      ? "画面以「就近配对」为主：说明紧邻图像，1 步短跳读懂"
      : pct >= 72
        ? "画面以「图文割裂」为主：注释放到页底，视线被迫跨段折返"
        : "左右拖动幕柄，直看图文割裂与空间邻近的眼跳差别";
  curtainReadout.textContent = `当前幕帘 ${pct}% · ${hint}`;
}

curtainRange.addEventListener("input", () => updateCurtain(Number(curtainRange.value)));
updateCurtain(50);

replayBtn.addEventListener("click", () => {
  $$(".saccade-path").forEach((p) => {
    p.classList.remove("is-anim");
    void p.getBoundingClientRect();
    p.classList.add("is-anim");
  });
});

// ==================== 02 节：三档容器宽 @container 自适应演示 ====================
const demoContainer = $("#demo-container");
const cwLabel = $("#cw-label");
const cwModeBadge = $("#cw-mode-badge");
const cwCssCode = $("#cw-css-code");
const cwExplain = $("#cw-explain");
const moDemoTitle = $("#mo-demo-title");
const moDemoDesc = $("#mo-demo-desc");
const moDemoMeta = $("#mo-demo-meta");

const CW_STATE = { width: 720, type: "showcase" };

function renderContainerDemo() {
  const { width, type } = CW_STATE;
  const stacked = type === "showcase" ? width < 440 : width < 300;
  demoContainer.style.maxWidth = `${width}px`;
  demoContainer.dataset.mode = stacked ? "stack" : "row";
  demoContainer.dataset.type = type;

  cwLabel.textContent = `container-width: ${width}px`;
  cwModeBadge.textContent = stacked
    ? "竖排 · 上图下文（窄槽自动翻折）"
    : type === "showcase"
      ? "横排 · 220px 媒体 + 1fr 说明"
      : "横排 · 64px 紧凑徽标 + 1fr 正文";

  if (type === "showcase") {
    moDemoTitle.textContent = "清晨光线决定山脊的立体层次";
    moDemoDesc.textContent = "父容器宽于 440px 时，媒体与说明并肩铺展；塞进侧栏或手机窄槽后，同一组件自动切回上图下文，避免文字被挤成碎条。";
    moDemoMeta.innerHTML = '<span>摄影师 / Ellie Chen</span><span>阿尔卑斯山脉</span><span lang="en">2024.04.12</span>';
  } else {
    moDemoTitle.textContent = "周明远 · 把媒体栏锁在 64px 才能一屏扫六条";
    moDemoDesc.textContent = "列表型媒体对象不需要大画面抢风头：48–64px 固定缩略图负责认人识类，把 80% 宽度留给发言与时间戳，扫读速度才快。";
    moDemoMeta.innerHTML = '<span>界面架构组</span><span>12 分钟前</span><span>3 条嵌套回复</span>';
  }

  const bp = type === "showcase" ? 440 : 300;
  const col = type === "showcase" ? "fit-content(220px) 1fr" : "64px 1fr";
  cwCssCode.textContent = `.card-slot { container-type: inline-size; }\n\n.media-object {\n  display: grid;\n  grid-template-columns: 1fr;\n  gap: 12px;\n}\n\n@container (min-width: ${bp}px) {\n  .media-object {\n    grid-template-columns: ${col};\n    gap: ${type === "showcase" ? "18px" : "14px"};\n    align-items: start;\n  }\n}\n/* 当前实宽 ${width}px → 命中「${stacked ? "默认竖排" : "横排两栏"}」 */`;

  cwExplain.textContent =
    type === "showcase"
      ? stacked
        ? `窄容器 ${width}px 小于 440px 阈值：如果强行横排，右侧文字只剩几字一折；容器查询自动翻成 288 原海报式的上图下文，画面与说明都舒展。`
        : `宽容器 ${width}px 命中 @container 横排规则：媒体固定上限 220px，说明栏吃满余宽，图文并肩一眼配对。`
      : stacked
        ? `极限 290px 窄槽里即使 64px 头像也留不下充足正文宽，自动转竖排保底可读性。`
        : `列表型在 ${width}px 下仅占 64px 缩略图宽，留足正文扫读空间——这就是「图像优先」在不同密度下的弹性尺度。`;
}

$$("[data-cwidth]").forEach((btn) => {
  btn.addEventListener("click", () => {
    CW_STATE.width = Number(btn.dataset.cwidth);
    $$("[data-cwidth]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderContainerDemo();
  });
});

$$("[data-ctype]").forEach((btn) => {
  btn.addEventListener("click", () => {
    CW_STATE.type = btn.dataset.ctype;
    $$("[data-ctype]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderContainerDemo();
  });
});
renderContainerDemo();

// ==================== 03 节：年代胶片步进器 + 2010 float 绕排 X 光 ====================
const ERAS = {
  1971: {
    meta: "1971 · Allan Paivio · 《Imagery and Verbal Processes》",
    heading: "图像与语言在脑中走两条互补通道",
    text: "加拿大心理学家 Allan Paivio 在 1971 年出版的《Imagery and Verbal Processes》（Holt, Rinehart and Winston）中正式提出双重编码理论：非言语图像系统与言语文字系统相互独立又能彼此唤醒。后来杂志、教科书与网页把配图与说明成组排布，底层记忆依据正是这一发现。",
    cite: "出处核实：Allan Paivio, Imagery and Verbal Processes (Holt, Rinehart and Winston, 1971)",
  },
  2001: {
    meta: "2001 · Richard E. Mayer · 《Multimedia Learning》",
    heading: "空间邻近原则：图文靠得越近，认知负荷越低",
    text: "加州大学圣巴巴拉分校心理学家 Richard E. Mayer 在 2001 年《Multimedia Learning》（Cambridge University Press）中系统验证了空间邻近原则：当文字说明紧挨对应图像出现时，学习者无需消耗工作记忆在版面间来回搜寻对应关系，理解深度与迁移表现显著提升。",
    cite: "出处核实：Richard E. Mayer, Multimedia Learning (Cambridge University Press, 2001, ISBN 978-0521782395)",
  },
  2010: {
    meta: "2010 年 6 月 25 日 · Nicole Sullivan · Stubbornella / OOCSS",
    heading: "前端工程正式命名「Media Object」，省下数百行样式",
    text: "前端性能工程师 Nicole Sullivan 在 Stubbornella 发表《The media object saves hundreds of lines of code》，指出 Facebook 信息流、评论、消息列表全都是同一种「固定媒体块 + 自适应内容块」的嵌套骨架。用 OOCSS 抽成单一 .media 类，并靠 overflow: hidden 建立块级格式化上下文防绕排，奠定了组件化 CSS 思维。",
    cite: "出处核实：Nicole Sullivan, Stubbornella.org (June 25, 2010)",
  },
  modern: {
    meta: "2018–至今 · MDN CSS Layout Cookbook & CSS Container Queries",
    heading: "Grid fit-content() 与 @container 让同一媒体对象自由变形",
    text: "随着 Flexbox、CSS Grid 与容器查询落地，媒体对象告别了脆弱的 float 清除技巧。MDN 布局指南采用 grid-template-columns: fit-content(200px) 1fr 与 grid-template-areas，一键支持 .media-flip 左右反转与底栏对齐；配合 @container 还能随所在栏宽在横排与竖排间无缝切换。",
    cite: "出处核实：MDN Web Docs, CSS Layout Cookbook — Media objects",
  },
};

const eraMeta = $("#era-meta");
const eraHeading = $("#era-heading");
const eraText = $("#era-text");
const eraCite = $("#era-cite");

$$("[data-era]").forEach((tab) => {
  tab.addEventListener("click", () => {
    const info = ERAS[tab.dataset.era];
    if (!info) return;
    $$("[data-era]").forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    eraMeta.textContent = info.meta;
    eraHeading.textContent = info.heading;
    eraText.textContent = info.text;
    eraCite.textContent = info.cite;
  });
});

const xrayDemo = $("#xray-demo");
const xrayVerdict = $("#xray-verdict");
$$("[data-xray]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.xray;
    xrayDemo.dataset.mode = mode;
    $$("[data-xray]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    xrayVerdict.textContent =
      mode === "broken"
        ? "当前为旧 float 漏气态：未给正文建立块级上下文（overflow: hidden / flex / grid），长段落和二级回复钻到头像底端折成 L 形，左对齐扫读轴彻底断裂。"
        : "当前为独立块级上下文（BFC / Grid）：无论正文写三行还是十行，所有文字与二级嵌套回复都紧贴青色左轴对齐，扫读线笔直。";
  });
});

// ==================== 04 节：3 条片单 2×2 故障注入审稿台 ====================
const auditFeed = $("#audit-feed");
const auditPill = $("#audit-pill");
const auditSummary = $("#audit-summary");
const activeFaults = new Set();

const FAULT_NOTES = {
  ratio: "缩略图在 16:9 / 1:1 / 4:3 间跳变，文字左起点左右晃动",
  align: "第二条突然翻成右图左文，向下扫读时视线被迫 Z 字折返",
  hier: "顶部高饱和时间标签压过标题，读者先读日期却看不到主题",
  space: "组外间距缩成 4px 而组内间距忽宽忽窄，分不清哪行字配哪张图",
};

function updateAuditBoard() {
  const n = activeFaults.size;
  auditPill.dataset.clean = String(n === 0);
  auditPill.textContent = n === 0 ? "一致性完整 · 0 处破坏" : `已注入 ${n} 处一致性破坏`;
  if (n === 0) {
    auditSummary.textContent =
      "三条片单共用同一条缩略图右缘与文字左缘，眼睛向下直扫就能逐条读取标题、说明与地点，零额外定位成本。";
  } else {
    const msgs = [...activeFaults].map((k) => FAULT_NOTES[k]);
    auditSummary.textContent = `${msgs.join("；")}。`;
  }
}

$$("[data-fault]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.fault;
    const on = !activeFaults.has(k);
    if (on) activeFaults.add(k);
    else activeFaults.delete(k);
    btn.setAttribute("aria-pressed", String(on));
    $(".ft-state", btn).textContent = on ? "已破坏" : "正常";
    auditFeed.classList.toggle(`f-${k}`, on);
    updateAuditBoard();
  });
});

// ==================== 05 节：6 张场景研判翻卡 ====================
$$(".triage-card").forEach((card) => {
  card.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    const expanded = card.getAttribute("aria-expanded") === "true";
    card.setAttribute("aria-expanded", String(!expanded));
  });
});

// ==================== 06 节：单一变量 4 选 1 练习 ====================
const quizGrid = $("#quiz-grid");
const quizVerdict = $("#quiz-verdict");
const qvTitle = $("#qv-title");
const qvBody = $("#qv-body");

const QUIZ_EXPLAIN = {
  A: {
    right: false,
    title: "选 A 会发生「跨组错归」",
    body: "方案 A 把图和自己说明拉开 28px，却只给下一条画面留 12px。按格式塔邻近原则，眼睛会误以为第一段说明是在解释下面那张图——这就是最危险的间距倒挂。",
  },
  B: {
    right: false,
    title: "选 B 把边界顶死了（仅剩 2px）",
    body: "虽然外距 42px 拉开了条目界限，但图框描边和说明卡只隔 2px，视觉上粘连发紧，失去卡片之间应有的呼吸缝。紧邻不等于撞边。",
  },
  C: {
    right: true,
    title: "选对了：方案 C 做到「内紧外疏，边界清晰」",
    body: "图与说明隔 11px，既留出舒展的呼吸缝又守在空间邻近带内；两条之间拉开 36px（内距的 3.3 倍），一眼就能把每一对「图 + 文」打包成一个独立单元。",
  },
  D: {
    right: false,
    title: "选 D 让配对边界消解成了均质条纹",
    body: "内距 22px、组距也是 22px，所有缝隙一模一样。眼睛扫过整列时，分不清哪段文字归上面还是归下面，只能靠逐字默读来手动配对。",
  },
};

$$(".quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    const opt = card.dataset.opt;
    const res = QUIZ_EXPLAIN[opt];
    quizGrid.classList.add("is-revealed");
    $$(".quiz-card").forEach((c) => {
      c.setAttribute("aria-pressed", String(c === card));
      c.classList.remove("is-right", "is-wrong");
      if (c.dataset.opt === "C") c.classList.add("is-right");
      else if (c === card) c.classList.add("is-wrong");
    });
    quizVerdict.dataset.result = res.right ? "right" : "wrong";
    qvTitle.textContent = res.title;
    qvBody.textContent = res.body;
  });
});

// ==================== 07 节：原海报放大平移灯箱 ====================
const posterOpen = $("#poster-open");
const posterImg = $("#poster");
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbZoomVal = $("#lb-zoom-val");
const lbZoomIn = $("#lb-zoom-in");
const lbZoomOut = $("#lb-zoom-out");
const lbReset = $("#lb-reset");
const lbClose = $("#lb-close");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbZoomVal.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1.2;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
  lightbox.hidden = false;
  posterOpen.setAttribute("aria-expanded", "true");
  lbClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterOpen.setAttribute("aria-expanded", "false");
  posterOpen.focus();
}

posterOpen.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbZoomIn.addEventListener("click", () => {
  lbScale = Math.min(3, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
lbZoomOut.addEventListener("click", () => {
  lbScale = Math.max(0.8, +(lbScale - 0.35).toFixed(2));
  applyLbTransform();
});
lbReset.addEventListener("click", () => {
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
});

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lbScale <= 1.05) {
    closeLightbox();
    return;
  }
  lbDrag = { x: e.clientX - lbTx, y: e.clientY - lbTy };
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbTx = e.clientX - lbDrag.x;
  lbTy = e.clientY - lbDrag.y;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => { lbDrag = null; });
lbStage.addEventListener("pointercancel", () => { lbDrag = null; });

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

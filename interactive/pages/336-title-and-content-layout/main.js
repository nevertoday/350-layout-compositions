// 336 标题和内容 幻灯片版式 · 主控制器
import { applyFixAction, INITIAL_STATE, PRESETS } from "./model.js";
import { createSlideStage } from "./stage.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// ==================== 1. 开场主角：母版手术台 ====================
const state = {
  ...INITIAL_STATE,
  guides: { ...INITIAL_STATE.guides },
};

const elCanvas = $("#slide-canvas");
const elHeroStatus = $("#hero-status");
const elDiagCard = $("#diag-card");
const elDiagPosture = $("#diag-posture");
const elDiagTitle = $("#diag-title");
const elDiagWhy = $("#diag-why");
const elDiagFix = $("#diag-fix");
const elBtnFixNow = $("#btn-fix-now");
const elRailHeader = $("#rail-header");

const rngSplit = $("#rng-split");
const rngMargin = $("#rng-margin");
const rngGutter = $("#rng-gutter");
const rngRatio = $("#rng-ratio");

const valSplit = $("#val-split");
const valMargin = $("#val-margin");
const valGutter = $("#val-gutter");
const valRatio = $("#val-ratio");

const mSplit = $("#m-split");
const mWhite = $("#m-white");
const mChars = $("#m-chars");
const mRatio = $("#m-ratio");

const btnAlign = $("#btn-align");
const btnCaption = $("#btn-caption");
const btnScan = $("#btn-scan");

let lastAudit = null;

function syncUI(layout, res) {
  lastAudit = res;

  // 顶栏实况胶囊
  elHeroStatus.textContent = res.statusShort;
  elHeroStatus.classList.toggle("is-ok", res.allPass);
  elHeroStatus.classList.toggle("is-bad", !res.allPass);

  // 左侧原海报解剖轨动态对齐标题区高度
  if (elRailHeader && layout && window.innerWidth > 760) {
    const canvasH = elCanvas.getBoundingClientRect().height || 440;
    const hPx = Math.max(66, Math.round((layout.headerRect.h / layout.H) * canvasH));
    elRailHeader.style.minHeight = `${hPx}px`;
  }

  // 滑轨数值与读数（严格来自 layout 单真源）
  rngSplit.value = String(layout.leftRatioPct);
  rngMargin.value = String(layout.marginPctInt);
  rngGutter.value = String(layout.gutterPctInt);
  rngRatio.value = String(layout.titleRatioNum);

  valSplit.textContent = `${layout.leftRatioPct} : ${layout.rightRatioPct}`;
  valMargin.textContent = `${layout.marginPctInt}%`;
  valGutter.textContent = `${layout.gutterPctInt}%`;
  valRatio.textContent = `${layout.titleRatioNum.toFixed(2)}×`;

  mSplit.textContent = `${layout.leftRatioPct} : ${layout.rightRatioPct}`;
  mWhite.textContent = `${layout.whitespacePct}%`;
  mChars.textContent = `${layout.avgCharsPerLine} 字`;
  mRatio.textContent = `${layout.titleRatioNum.toFixed(2)}×`;

  // 按钮态同步
  $$(".scene-btn").forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  $$("[data-title]").forEach((b) => {
    const on = b.dataset.title === state.titleMode;
    b.setAttribute("aria-pressed", String(on));
    b.classList.toggle("is-warn", on && state.titleMode !== "assertion");
  });
  $$("[data-bullet]").forEach((b) => {
    const on = b.dataset.bullet === state.bulletMode;
    b.setAttribute("aria-pressed", String(on));
    b.classList.toggle("is-warn", on && (state.bulletMode === "overload" || state.bulletMode === "sparse"));
  });
  $$("[data-visual]").forEach((b) => {
    const on = b.dataset.visual === state.visualMode;
    b.setAttribute("aria-pressed", String(on));
    b.classList.toggle("is-warn", on && state.visualMode !== "complement");
  });

  btnAlign.setAttribute("aria-pressed", String(state.aligned));
  btnAlign.classList.toggle("is-warn", !state.aligned);
  btnAlign.textContent = state.aligned ? "左缘已齐" : "左缘错牙";

  btnCaption.setAttribute("aria-pressed", String(state.captionOn));
  btnCaption.textContent = state.captionOn ? "图注：开" : "图注：关";

  $$(".guide-btn").forEach((b) => {
    const on = !!state.guides[b.dataset.guide];
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 旁侧蓝星 TIP 诊单
  elDiagCard.classList.toggle("is-ok", res.allPass);
  elDiagPosture.textContent = `${res.passCount}/4 · ${res.posture}`;
  elDiagTitle.textContent = res.headline;
  elDiagWhy.textContent = res.why;
  elDiagFix.textContent = res.fix;
  elBtnFixNow.textContent = res.actionLabel;

  // 四列原海报原则卡
  res.principles.forEach((p, idx) => {
    const badge = $(`#pb-${idx}`);
    if (badge) {
      badge.textContent = p.badge;
      badge.classList.toggle("is-ok", p.ok);
      badge.classList.toggle("is-bad", !p.ok);
    }
    const card = $(`.p-card[data-pidx="${idx}"]`);
    if (card) {
      card.setAttribute("aria-pressed", String(state.focusPrinciple === idx));
    }
  });
}

function patchState(patch) {
  Object.assign(state, patch);
  stage.draw();
}

const stage = createSlideStage({
  canvas: elCanvas,
  getState: () => state,
  onPatch: (patch) => patchState(patch),
  onAfterRender: (layout, res) => syncUI(layout, res),
});

// 绑定开场控件
$$(".scene-btn").forEach((b) =>
  b.addEventListener("click", () => patchState({ scene: b.dataset.scene }))
);
$$("[data-title]").forEach((b) =>
  b.addEventListener("click", () => patchState({ titleMode: b.dataset.title }))
);
$$("[data-bullet]").forEach((b) =>
  b.addEventListener("click", () => patchState({ bulletMode: b.dataset.bullet }))
);
$$("[data-visual]").forEach((b) =>
  b.addEventListener("click", () => patchState({ visualMode: b.dataset.visual }))
);

rngSplit.addEventListener("input", () => patchState({ split: Number(rngSplit.value) / 100 }));
rngMargin.addEventListener("input", () => patchState({ marginPct: Number(rngMargin.value) / 100 }));
rngGutter.addEventListener("input", () => patchState({ gutterPct: Number(rngGutter.value) / 100 }));
rngRatio.addEventListener("input", () => patchState({ titleRatio: Number(rngRatio.value) }));

btnAlign.addEventListener("click", () => patchState({ aligned: !state.aligned }));
btnCaption.addEventListener("click", () => patchState({ captionOn: !state.captionOn }));
btnScan.addEventListener("click", () => stage.playScan());

elBtnFixNow.addEventListener("click", () => {
  if (!lastAudit) return;
  if (lastAudit.action === "playScan") {
    stage.playScan();
    return;
  }
  const next = applyFixAction(state, lastAudit.action);
  patchState(next);
});

$$(".preset-btn").forEach((b) =>
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (p) patchState({ ...p.patch, focusPrinciple: null });
  })
);

$$(".p-card").forEach((card) =>
  card.addEventListener("click", () => {
    const idx = Number(card.dataset.pidx);
    patchState({ focusPrinciple: state.focusPrinciple === idx ? null : idx });
  })
);

$$(".guide-btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    const key = btn.dataset.guide;
    state.guides = { ...state.guides, [key]: !state.guides[key] };
    stage.draw();
  })
);

// 初次立刻同步一帧，确保 0 延迟可读
stage.draw();

// ==================== 2. 第 01 节：四层透视膜开关 ====================
const anatState = { margin: true, header: true, gutter: true, balance: true };
const elAnatVerdict = $("#anatomy-verdict");

function renderAnatomy() {
  $("#al-margin").style.opacity = anatState.margin ? "1" : "0.08";
  $("#al-header").style.opacity = anatState.header ? "1" : "0";
  $("#al-header-off").style.opacity = anatState.header ? "0" : "1";
  $("#al-gutter").style.opacity = anatState.gutter ? "1" : "0";
  $("#al-balance").style.opacity = anatState.balance ? "1" : "0";
  $("#al-balance-off").style.opacity = anatState.balance ? "0" : "1";

  const missing = [];
  if (!anatState.margin) missing.push("外边距撤掉后内容贴边，会场投影极易裁切四周字符");
  if (!anatState.header) missing.push("失去结论标题锚区，观众看完全屏也不清楚本页想表达什么主张");
  if (!anatState.gutter) missing.push("中缝消失后左列文字行尾直接撞上右图，视线容易横向串读");
  if (!anatState.balance) missing.push("右侧失去视觉证据槽，整页退化成沉闷文档，双通道记忆归零");

  elAnatVerdict.textContent = missing.length
    ? `当前缺失 ${missing.length} 层：${missing.join("；")}。`
    : "四层结构齐全：顶部结论定调、外边距防裁切、中缝分清左右、右图与图注承担视觉作证。";
}

$$(".layer-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.layer;
    anatState[k] = !anatState[k];
    btn.classList.toggle("is-on", anatState[k]);
    btn.setAttribute("aria-pressed", String(anatState[k]));
    renderAnatomy();
  });
});

// ==================== 3. 第 02 节：年代演变切页卡 ====================
const ERAS = [
  {
    badge: "1978 · 1987",
    title: "先说结论的咨询习惯，遇上第一张「幻灯片母版」",
    body: "1973 年起，芭芭拉·明托（Barbara Minto）在麦肯锡培训手册中整理出「结论先行」逻辑，并于 1978 年正式出版《金字塔原理》（The Pyramid Principle）。九年后的 1987 年 4 月 20 日，罗伯特·加斯金斯（Robert Gaskins）与丹尼斯·奥斯汀（Dennis Austin）在 Forethought 推出 Macintosh 版 PowerPoint 1.0（最初用于打印黑白投影胶片），首创 Slide Master（幻灯片母版），把标题框、边距与页脚统一定在底层。",
    ref: "核实来源：Robert Gaskins, Sweating Bullets (2012)；Barbara Minto, The Pyramid Principle (1978)。",
    svg: `
      <rect width="520" height="292" fill="#EAE6DC"/>
      <rect x="34" y="24" width="452" height="244" fill="#FAF7F0" stroke="#111318" stroke-width="2"/>
      <rect x="46" y="36" width="428" height="220" fill="none" stroke="#0A44C6" stroke-dasharray="5 4"/>
      <text x="58" y="64" font-size="11" font-family="JetBrains Mono, monospace" fill="#0A44C6">SLIDE MASTER · 1987 OVERHEAD TRANSPARENCY</text>
      <rect x="58" y="76" width="320" height="28" fill="#111318"/>
      <text x="68" y="95" font-size="14" font-weight="700" fill="#FFFFFF">一页母版定规矩，全套胶片不跑位</text>
      <rect x="58" y="122" width="404" height="118" fill="none" stroke="#111318" stroke-dasharray="4 3"/>
      <text x="74" y="152" font-size="13" fill="#3D4350">• 顶部固定标题位置与边距框</text>
      <text x="74" y="178" font-size="13" fill="#3D4350">• 中央自由绘制图表或手工排版</text>
      <text x="74" y="204" font-size="13" fill="#3D4350">• 一次修改母版，全套透明胶片同步生效</text>
    `,
  },
  {
    badge: "1994 · AUTOLAYOUT",
    title: "PowerPoint 4.0 推出自动版式，圆点列表统治会议室",
    body: "1994 年发布的 PowerPoint 4.0 引入了 AutoLayout（自动版式）对话框，内置 21 种预设占位框，其中最常用的就是「Title and Text / Bulleted List（标题与项目符号列表）」。它把排版门槛降到了零，却也埋下副作用：用户习惯在默认文本框里越敲越多，催生了整整一代密不透风的圆点字墙。",
    ref: "核实来源：Microsoft PowerPoint 4.0 (1994) AutoLayout 机制与早期 Office 用户手册。",
    svg: `
      <rect width="520" height="292" fill="#E3E8F2"/>
      <rect x="34" y="24" width="452" height="244" fill="#FFFFFF" stroke="#586070" stroke-width="1.5"/>
      <rect x="52" y="42" width="416" height="44" fill="#F1F4FA" stroke="#8C99B5" stroke-dasharray="4 3"/>
      <text x="66" y="69" font-size="15" font-weight="700" fill="#3D4350">单击此处添加标题（短语目录）</text>
      <rect x="52" y="98" width="416" height="152" fill="#FAFBFD" stroke="#8C99B5" stroke-dasharray="4 3"/>
      <text x="68" y="124" font-size="12.5" fill="#3D4350">• 一级项目符号要点一：大段文字开始挤满画框</text>
      <text x="86" y="146" font-size="11.5" fill="#586070">– 二级子要点嵌套缩进</text>
      <text x="104" y="166" font-size="11" fill="#586070">› 三级细项导致字号自动越缩越小</text>
      <text x="68" y="190" font-size="12.5" fill="#3D4350">• 一级项目符号要点二：视觉图形常被遗忘</text>
      <text x="68" y="214" font-size="12.5" fill="#3D4350">• 一级项目符号要点三：幻灯片沦为提词卡</text>
    `,
  },
  {
    badge: "2001 – 2008",
    title: "认知心理学与视觉演讲掀起「去字墙」浪潮",
    body: "2001 年迈耶出版《多媒体学习》奠定双通道与冗余原则；2003 年爱德华·塔夫特发表《PowerPoint 的认知风格》，痛批层层嵌套的圆点肢解逻辑；2002/2003 年迈克尔·艾利在《科学演讲的技艺》中提出「论断-证据」范式；随后阿特金森《超越项目符号》（2005）、雷诺兹《演说之禅》（2008）与杜阿尔特《slide:ology》（2008）共同确立了「标题说结论、画面拿图作证」的现代规范。",
    ref: "核实来源：Mayer (2001)；Tufte (2003)；Alley (2002/2003, 2013)；Atkinson (2005)；Reynolds (2008)；Duarte (2008)。",
    svg: `
      <rect width="520" height="292" fill="#07246A"/>
      <rect x="34" y="24" width="452" height="244" fill="#F3EDE3"/>
      <text x="54" y="60" font-size="15.5" font-weight="900" fill="#111318">顶部写一句完整论断句，不再只写名词目录</text>
      <rect x="54" y="68" width="48" height="4" fill="#F6BC07"/>
      <rect x="54" y="92" width="150" height="150" fill="#FAF7F0" stroke="#C5C1B8"/>
      <text x="66" y="120" font-size="12" font-weight="700" fill="#0A44C6">精简论据</text>
      <text x="66" y="148" font-size="11.5" fill="#3D4350">• 保留 3 条短句</text>
      <text x="66" y="174" font-size="11.5" fill="#3D4350">• 砍掉复读废话</text>
      <text x="66" y="200" font-size="11.5" fill="#3D4350">• 留足呼吸白边</text>
      <rect x="224" y="92" width="242" height="150" fill="#0A44C6"/>
      <polyline points="244,214 294,188 346,152 400,132 444,114" fill="none" stroke="#F6BC07" stroke-width="3.5"/>
      <circle cx="444" cy="114" r="6" fill="#F6BC07"/>
      <text x="244" y="118" font-size="12" font-weight="700" fill="#FFFFFF">VISUAL EVIDENCE · 视觉证据直连结论</text>
    `,
  },
  {
    badge: "2007 – TODAY",
    title: "从「标题和文本」演化为万能的「标题和内容」",
    body: "从 PowerPoint 2007 的界面革新起，默认的第二张工作母版正式更名为「Title and Content（标题和内容）」。下方占位符不再逼人只打项目符号，而是变成支持要点、图表、结构图、表格与媒体的通用内容区——也就是 336 原海报所拆解的「标题区 + 图文互补内容区 + 边距与栏间距参考网格」。",
    ref: "核实来源：Microsoft Office PowerPoint 2007 起标准母版布局体系与 336 原海报结构。",
    svg: `
      <rect width="520" height="292" fill="#F3EDE3"/>
      <rect x="34" y="22" width="452" height="248" fill="none" stroke="#0A44C6" stroke-width="1.5" stroke-dasharray="5 4"/>
      <text x="50" y="54" font-size="17" font-weight="900" fill="#111318">在此输入结论型幻灯片标题</text>
      <rect x="50" y="62" width="42" height="4" fill="#F6BC07"/>
      <line x1="34" y1="78" x2="486" y2="78" stroke="#AEB2BA" stroke-dasharray="4 4"/>
      <rect x="50" y="92" width="196" height="162" fill="#FAF7F0" stroke="#D5D0C6"/>
      <circle cx="64" cy="122" r="3.5" fill="#0A44C6"/><text x="76" y="126" font-size="11.5" fill="#3D4350">文字简洁聚焦单一核心</text>
      <circle cx="64" cy="148" r="3.5" fill="#0A44C6"/><text x="76" y="152" font-size="11.5" fill="#3D4350">清晰对齐与合理留白</text>
      <circle cx="64" cy="174" r="3.5" fill="#0A44C6"/><text x="76" y="178" font-size="11.5" fill="#3D4350">图文互补强化记忆</text>
      <rect x="268" y="92" width="202" height="118" fill="#DBDAD5"/>
      <circle cx="332" cy="138" r="34" fill="#0A44C6"/>
      <polygon points="282,202 456,202 369,134" fill="#F6BC07"/>
      <text x="268" y="232" font-size="11" font-weight="700" fill="#111318">图注：图表 / 图形 / 实拍皆可入槽</text>
    `,
  },
];

const elEraSvg = $("#era-svg");
const elEraBadge = $("#era-badge");
const elEraTitle = $("#era-title");
const elEraBody = $("#era-body");
const elEraRef = $("#era-ref");

function renderEra(idx) {
  const e = ERAS[idx] || ERAS[0];
  elEraSvg.innerHTML = e.svg;
  elEraBadge.textContent = e.badge;
  elEraTitle.textContent = e.title;
  elEraBody.textContent = e.body;
  elEraRef.textContent = e.ref;
  $$(".era-tab").forEach((t, i) => {
    const on = i === idx;
    t.classList.toggle("is-active", on);
    t.setAttribute("aria-selected", String(on));
  });
}

$$(".era-tab").forEach((t) =>
  t.addEventListener("click", () => renderEra(Number(t.dataset.era)))
);
renderEra(0);

// ==================== 4. 第 03 节：三步改造翻片器 ====================
const STEPS = [
  {
    tag: "第 1 稿 · 目录空题 + 冗余复读",
    head: "标题只写「仓储拣货优化情况」，结论被埋在第五行",
    bullets: [
      "标题是空洞名词，观众必须自己从满屏文字里提炼结果。",
      "右侧三个花哨色块把左列句子又抄了一遍，触发迈耶冗余过载。",
      "要点过长导致字号偏小，整页留白几乎被挤光。",
    ],
    nextLabel: "看第 2 稿怎么砍字 →",
    svg: `
      <rect width="640" height="360" fill="#F3EDE3"/>
      <rect x="14" y="14" width="612" height="332" fill="none" stroke="#C42B1C" stroke-dasharray="4 3"/>
      <text x="24" y="42" font-size="18" font-weight="900" fill="#111318">华东仓第三季度拣货流程优化情况汇总</text>
      <text x="24" y="74" font-size="11.5" fill="#3D4350">• 过去拣货员每日在高频商品与低频商品货架之间反复折返行走超过十公里。</text>
      <text x="24" y="98" font-size="11.5" fill="#3D4350">• 本季我们按照订单出库频次重新划定热区货位，把前两成爆款移至打包台旁。</text>
      <text x="24" y="122" font-size="11.5" fill="#3D4350">• 同时引入手持扫码波次合并算法，一次路径可同步完成六笔相邻订单的拣选。</text>
      <text x="24" y="146" font-size="11.5" fill="#3D4350">• 经过八周实测验证，单笔订单平均拣货耗时从原本的 4.8 分钟下降至 2.9 分钟。</text>
      <text x="24" y="170" font-size="11.5" fill="#3D4350">• 团队士气明显提升，高峰期错发率也同步回落，后续将推广到华北分仓。</text>
      <rect x="24" y="200" width="592" height="128" fill="#EAE4D9" stroke="#C42B1C" stroke-dasharray="4 3"/>
      <rect x="40" y="220" width="174" height="84" fill="#0A44C6"/>
      <text x="127" y="256" text-anchor="middle" font-size="12" font-weight="700" fill="#FFFFFF">重新划定热区货位</text>
      <text x="127" y="278" text-anchor="middle" font-size="10.5" fill="#DCE7FF">（重复抄左文）</text>
      <rect x="233" y="220" width="174" height="84" fill="#0A44C6"/>
      <text x="320" y="256" text-anchor="middle" font-size="12" font-weight="700" fill="#FFFFFF">引入波次合并算法</text>
      <text x="320" y="278" text-anchor="middle" font-size="10.5" fill="#DCE7FF">（重复抄左文）</text>
      <rect x="426" y="220" width="174" height="84" fill="#F6BC07"/>
      <text x="513" y="256" text-anchor="middle" font-size="12" font-weight="700" fill="#111318">拣货耗时下降明显</text>
      <text x="513" y="278" text-anchor="middle" font-size="10.5" fill="#111318">（无数据坐标）</text>
    `,
  },
  {
    tag: "第 2 稿 · 结论上移、狠砍一半冗余文字",
    head: "把「耗时降 40%」请上顶部标题区，左列只留三条改动",
    bullets: [
      "顶部标题改成完整论断句，观众抬头 3 秒就能收走核心价值。",
      "把原本 5 条长段落压缩成 3 条动词短句，腾出宽裕留白与中缝。",
      "但右侧暂时还留着抽象图标，缺少一眼坐实「4.8 → 2.9 分钟」的数据证据。",
    ],
    nextLabel: "看第 3 稿补上互补证据图 →",
    svg: `
      <rect width="640" height="360" fill="#F3EDE3"/>
      <rect x="42" y="28" width="556" height="304" fill="none" stroke="#0A44C6" stroke-dasharray="4 4"/>
      <text x="52" y="64" font-size="21" font-weight="900" fill="#111318">重排热区并合并波次后，拣货耗时降 40%</text>
      <rect x="52" y="74" width="48" height="4" fill="#F6BC07"/>
      <line x1="42" y1="92" x2="598" y2="92" stroke="#AEB2BA" stroke-dasharray="4 4"/>
      <text x="52" y="124" font-size="14" font-weight="700" fill="#111318">三项现场改动</text>
      <circle cx="57" cy="154" r="3.5" fill="#0A44C6"/><text x="70" y="159" font-size="13" fill="#3D4350">前 20% 爆款货位移至打包台旁</text>
      <circle cx="57" cy="190" r="3.5" fill="#0A44C6"/><text x="70" y="195" font-size="13" fill="#3D4350">扫码终端一次合并 6 笔相邻波次</text>
      <circle cx="57" cy="226" r="3.5" fill="#0A44C6"/><text x="70" y="231" font-size="13" fill="#3D4350">拣货员日均步行里程缩短 4.2 公里</text>
      <rect x="356" y="110" width="230" height="196" fill="#EAE5DB" stroke="#825300" stroke-dasharray="5 4"/>
      <text x="471" y="200" text-anchor="middle" font-size="14" font-weight="700" fill="#825300">待补：真实数据证据图</text>
      <text x="471" y="224" text-anchor="middle" font-size="11.5" fill="#586070">不要再放复读文字框</text>
    `,
  },
  {
    tag: "第 3 稿 · 成稿（论断 + 左因 + 右图 + 空间邻近标注）",
    head: "左列讲清「为什么变快」，右图直接亮出「快了多少」",
    bullets: [
      "结论、原因、证据严格分工，零文字复读。",
      "直接把「−40%」与「4.8 → 2.9 分」标在柱顶，遵守迈耶空间邻近原则，免去眼睛反复对照图例。",
      "边距、中缝与左缘基准线一丝不苟，后排 12 米依然一目了然。",
    ],
    nextLabel: "回到第 1 稿重新对照",
    svg: `
      <rect width="640" height="360" fill="#F3EDE3"/>
      <rect x="42" y="28" width="556" height="304" fill="none" stroke="#0C6B4B" stroke-dasharray="4 4"/>
      <text x="52" y="64" font-size="21" font-weight="900" fill="#111318">重排热区并合并波次后，拣货耗时降 40%</text>
      <rect x="52" y="74" width="48" height="4" fill="#F6BC07"/>
      <line x1="42" y1="92" x2="598" y2="92" stroke="#AEB2BA" stroke-dasharray="4 4"/>
      <text x="52" y="124" font-size="14" font-weight="700" fill="#111318">三项现场改动</text>
      <circle cx="57" cy="154" r="3.5" fill="#0A44C6"/><text x="70" y="159" font-size="13" fill="#3D4350">前 20% 爆款货位移至打包台旁</text>
      <circle cx="57" cy="190" r="3.5" fill="#0A44C6"/><text x="70" y="195" font-size="13" fill="#3D4350">扫码终端一次合并 6 笔相邻波次</text>
      <circle cx="57" cy="226" r="3.5" fill="#0A44C6"/><text x="70" y="231" font-size="13" fill="#3D4350">拣货员日均步行缩短 4.2 公里</text>
      <rect x="356" y="108" width="230" height="158" fill="#FAF7F0" stroke="#D4D2CA"/>
      <rect x="394" y="138" width="54" height="106" fill="#DBDAD5"/>
      <text x="421" y="130" text-anchor="middle" font-size="13" font-weight="700" fill="#3D4350">4.8 分</text>
      <text x="421" y="258" text-anchor="middle" font-size="11" fill="#3D4350">改造前</text>
      <rect x="494" y="180" width="54" height="64" fill="#0A44C6"/>
      <text x="521" y="172" text-anchor="middle" font-size="13" font-weight="900" fill="#0A44C6">2.9 分</text>
      <text x="521" y="258" text-anchor="middle" font-size="11" font-weight="700" fill="#0A44C6">改造后</text>
      <path d="M448 148 Q484 148 512 162" fill="none" stroke="#825300" stroke-width="2" stroke-dasharray="4 3"/>
      <rect x="478" y="122" width="64" height="22" fill="#F6BC07"/>
      <text x="510" y="137" text-anchor="middle" font-size="12" font-weight="900" fill="#111318">−40%</text>
      <text x="356" y="290" font-size="12" font-weight="700" fill="#111318">图注 · 单笔订单平均拣货耗时（示意）</text>
      <text x="356" y="308" font-size="11" fill="#3D4350">标签直接紧贴柱顶，省去来回对照图例。</text>
    `,
  },
];

let stepIdx = 0;
const elRewriteSvg = $("#rewrite-svg");
const elRnTag = $("#rn-tag");
const elRnHead = $("#rn-head");
const elRnList = $("#rn-list");
const elStepPrev = $("#btn-step-prev");
const elStepNext = $("#btn-step-next");

function renderStep(idx) {
  stepIdx = idx;
  const s = STEPS[idx];
  elRewriteSvg.innerHTML = s.svg;
  elRnTag.textContent = s.tag;
  elRnHead.textContent = s.head;
  elRnList.innerHTML = s.bullets.map((b) => `<li>${b}</li>`).join("");
  elStepPrev.disabled = idx === 0;
  elStepNext.textContent = s.nextLabel;
  $$(".step-btn").forEach((b, i) => {
    const on = i === idx;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

$$(".step-btn").forEach((b) => b.addEventListener("click", () => renderStep(Number(b.dataset.step))));
elStepPrev.addEventListener("click", () => { if (stepIdx > 0) renderStep(stepIdx - 1); });
elStepNext.addEventListener("click", () => renderStep((stepIdx + 1) % STEPS.length));
renderStep(0);

// ==================== 5. 第 04 节：后排视距与字阶压测台 ====================
const rngDist = $("#rng-dist");
const rngPt = $("#rng-pt");
const valDist = $("#val-dist");
const valPt = $("#val-pt");
const btnOverscan = $("#btn-overscan");
const elHallSvg = $("#hall-svg");
const elHallReadout = $("#hall-readout");
const elHrGrade = $("#hr-grade");
const elHrAngle = $("#hr-angle");
const elHrDesc = $("#hr-desc");

let overscanOn = true;

function renderHall() {
  const dist = Number(rngDist.value);
  const pt = Number(rngPt.value);
  const zone = dist <= 4 ? "前排" : dist <= 9 ? "中排" : "后排";
  valDist.textContent = `${dist} m（${zone}）`;
  valPt.textContent = `${pt} pt`;

  // 假设常见中型会场 3.2m 宽 16:9 投影幕布（高 1.8m），计算物理字高与视觉角（角分，仅作示意）
  const slideHeightMm = 1800;
  const charHeightMm = (pt / 540) * slideHeightMm * 1.15;
  const arcmin = (Math.atan(charHeightMm / (dist * 1000)) * 180 * 60) / Math.PI;
  const blurPx = Math.max(0, (14 - arcmin) * 0.22);
  const scale = Math.max(0.56, 1.02 - (dist - 2) * 0.032);
  const sw = Math.round(520 * scale);
  const sh = Math.round((sw * 9) / 16);
  const sx = Math.round((640 - sw) / 2);
  const sy = Math.round((312 - sh) / 2) + 8;

  const bodyPx = (pt / 20) * 14 * scale;
  const titlePx = Math.max(bodyPx * 1.8, 16 * scale);
  const safePadX = Math.round(sw * 0.045);
  const safePadY = Math.round(sh * 0.045);

  elHallSvg.innerHTML = `
    <defs>
      <filter id="hall-blur"><feGaussianBlur stdDeviation="${blurPx.toFixed(2)}"/></filter>
    </defs>
    <rect width="640" height="360" fill="#131926"/>
    <!-- 报告厅墙面与地平透视微线 -->
    <line x1="0" y1="316" x2="640" y2="316" stroke="#28344F" stroke-width="1.5"/>
    <!-- 听众剪影（无五官） -->
    <g fill="#0A101C">
      <circle cx="150" cy="332" r="14"/><path d="M126 360 Q150 342 174 360 Z"/>
      <circle cx="240" cy="336" r="13"/><path d="M218 360 Q240 345 262 360 Z"/>
      <circle cx="320" cy="330" r="15"/><path d="M294 360 Q320 341 346 360 Z"/>
      <circle cx="408" cy="335" r="13"/><path d="M386 360 Q408 345 430 360 Z"/>
      <circle cx="496" cy="332" r="14"/><path d="M472 360 Q496 342 520 360 Z"/>
    </g>
    <!-- 投影幕布 -->
    <rect x="${sx - 4}" y="${sy - 4}" width="${sw + 8}" height="${sh + 8}" fill="#050811"/>
    <g filter="${blurPx > 0.15 ? "url(#hall-blur)" : "none"}">
      <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="#F3EDE3"/>
      <text x="${sx + sw * 0.075}" y="${sy + sh * 0.2}" font-size="${titlePx.toFixed(1)}" font-weight="900" font-family="Noto Sans SC, sans-serif" fill="#111318">换装低功耗芯片，续航翻倍</text>
      <rect x="${sx + sw * 0.075}" y="${sy + sh * 0.235}" width="${(sw * 0.08).toFixed(1)}" height="${Math.max(2, 3.5 * scale).toFixed(1)}" fill="#F6BC07"/>
      <circle cx="${sx + sw * 0.082}" cy="${sy + sh * 0.42}" r="${Math.max(2, 3 * scale).toFixed(1)}" fill="#0A44C6"/>
      <text x="${sx + sw * 0.11}" y="${sy + sh * 0.44}" font-size="${bodyPx.toFixed(1)}" font-family="Noto Sans SC, sans-serif" fill="#3D4350">主控休眠电流下降 62%</text>
      <circle cx="${sx + sw * 0.082}" cy="${sy + sh * 0.56}" r="${Math.max(2, 3 * scale).toFixed(1)}" fill="#0A44C6"/>
      <text x="${sx + sw * 0.11}" y="${sy + sh * 0.58}" font-size="${bodyPx.toFixed(1)}" font-family="Noto Sans SC, sans-serif" fill="#3D4350">传感器改为脉冲间歇采样</text>
      <circle cx="${sx + sw * 0.082}" cy="${sy + sh * 0.70}" r="${Math.max(2, 3 * scale).toFixed(1)}" fill="#0A44C6"/>
      <text x="${sx + sw * 0.11}" y="${sy + sh * 0.72}" font-size="${bodyPx.toFixed(1)}" font-family="Noto Sans SC, sans-serif" fill="#3D4350">抬腕算法过滤一半误触</text>
      <rect x="${sx + sw * 0.57}" y="${sy + sh * 0.34}" width="${(sw * 0.35).toFixed(1)}" height="${(sh * 0.46).toFixed(1)}" fill="#DBDAD5"/>
      <circle cx="${sx + sw * 0.68}" cy="${sy + sh * 0.50}" r="${(Math.min(sw, sh) * 0.11).toFixed(1)}" fill="#0A44C6"/>
      <polygon points="${sx + sw * 0.59},${sy + sh * 0.78} ${sx + sw * 0.90},${sy + sh * 0.78} ${sx + sw * 0.745},${sy + sh * 0.51}" fill="#F6BC07"/>
    </g>
    ${
      overscanOn
        ? `<rect x="${sx + safePadX}" y="${sy + safePadY}" width="${sw - safePadX * 2}" height="${sh - safePadY * 2}" fill="none" stroke="#FF9488" stroke-width="1.4" stroke-dasharray="5 4"/>
           <text x="616" y="302" text-anchor="end" font-size="11" font-family="JetBrains Mono, monospace" fill="#FF9488">4% 投影安全边距（框外易裁切）</text>`
        : ""
    }
    <text x="24" y="302" text-anchor="start" font-size="11" font-family="JetBrains Mono, monospace" fill="#C2D5FF">模拟 3.2m 幕布 · 距 ${dist}m · ${pt}pt</text>
  `;

  const ok = arcmin >= 14 && pt >= 18;
  elHallReadout.classList.toggle("is-ok", ok);
  if (ok) {
    elHrGrade.textContent = "清晰易读（示意）";
    elHrAngle.textContent = `视距充裕 · ${pt}pt @ ${dist}m`;
    elHrDesc.textContent = `在 ${dist} 米处看 ${pt}pt 正文，汉字笔画清晰可辨，配合四周 6%–10% 外边距也完全避开了投影仪边缘裁切区。`;
  } else if (pt < 18) {
    elHrGrade.textContent = "字号偏小（示意）";
    elHrAngle.textContent = `低于 18pt 经验线 · ${pt}pt @ ${dist}m`;
    elHrDesc.textContent = `把 ${pt}pt 正文投到 ${dist} 米外的幕布上，后排观众需要眯眼辨认。演讲型幻灯片正文建议至少 18–20pt（经验值），字太多时先删字，别缩字号。`;
  } else {
    elHrGrade.textContent = "后排吃力（示意）";
    elHrAngle.textContent = `视距过远 · ${pt}pt @ ${dist}m`;
    elHrDesc.textContent = `排距拉远到 ${dist} 米后，${pt}pt 正文视角已逼近分辨边缘。大报告厅建议把正文进一步推到 22–26pt，并依靠右图几何对比传递核心信息。`;
  }
}

rngDist.addEventListener("input", renderHall);
rngPt.addEventListener("input", renderHall);
btnOverscan.addEventListener("click", () => {
  overscanOn = !overscanOn;
  btnOverscan.classList.toggle("is-on", overscanOn);
  btnOverscan.setAttribute("aria-pressed", String(overscanOn));
  btnOverscan.textContent = overscanOn ? "投影 4% 裁切框：开" : "投影 4% 裁切框：关";
  renderHall();
});
renderHall();

// ==================== 6. 第 05 节：6 场景诊断选版器 ====================
const TASKS = [
  {
    ok: true,
    badge: "适合用 336",
    title: "标题和内容版式正是主场",
    text: "把核心结论写进顶部标题区，左列用 3 条要点说清业务动作，右侧配 6–9 月留存曲线与一句图注，观众 5 秒就能建立因果记忆。",
    url: "",
    linkLabel: "",
  },
  {
    ok: false,
    badge: "别用 336 · 换 335",
    title: "开场封面需要仪式感，不要提前塞要点",
    text: "第一张幻灯片只负责亮明主题、副标、主视觉焦点与落款身份；直接上 336 要点框会让开场显得像内部周报。",
    url: "https://layout.xiaoxiaodong.ai/335/play/",
    linkLabel: "去看 335 标题幻灯片版式 →",
  },
  {
    ok: false,
    badge: "别用 336 · 换 339",
    title: "方案正反逐项对垒，应该用专用比较版式",
    text: "336 左右分工是「文字解释 × 图形证据」；当你需要 A/B 两个方案同权并列、带各自小标题逐项对比时，339 结构更清晰。",
    url: "https://layout.xiaoxiaodong.ai/339/play/",
    linkLabel: "去看 339 比较幻灯片版式 →",
  },
  {
    ok: false,
    badge: "别用 336 · 换 340",
    title: "复杂全景架构图需要整块内容画布，不要硬拆两栏",
    text: "跨屏拓扑图最怕被压进 336 的半边栏里导致字小如蚁；保留顶部一句话标题，把下方整片空间全交给架构图更从容。",
    url: "https://layout.xiaoxiaodong.ai/340/play/",
    linkLabel: "去看 340 仅标题幻灯片版式 →",
  },
  {
    ok: false,
    badge: "别用 336 · 换 343 / 341",
    title: "产品实拍大片靠画面情绪说话，别用圆点要点抢戏",
    text: "需要极简图说时选 343 图片与标题说明版式；若是纯全出血震撼主视觉，直接切去 341 空白幻灯片版式。",
    url: "https://layout.xiaoxiaodong.ai/343/play/",
    linkLabel: "去看 343 图片与标题说明幻灯片版式 →",
  },
  {
    ok: false,
    badge: "别用幻灯片",
    title: "80 项财务科目核对，请发书面一页纸简报",
    text: "正如塔夫特（2003）指出的，低信息密度的投影幻灯片不适合承载逐行审计表。把完整表格印成可批注文档，会前分发阅读，台上只用 336 讲最关键的三处异常项。",
    url: "",
    linkLabel: "",
  },
];

const elRrBadge = $("#rr-badge");
const elRrTitle = $("#rr-title");
const elRrText = $("#rr-text");
const elRrLinkWrap = $("#rr-link-wrap");
const elRrLink = $("#rr-link");

function renderTask(idx) {
  const t = TASKS[idx] || TASKS[0];
  elRrBadge.textContent = t.badge;
  elRrBadge.classList.toggle("is-yes", t.ok);
  elRrBadge.classList.toggle("is-no", !t.ok);
  elRrTitle.textContent = t.title;
  elRrText.textContent = t.text;
  if (t.url) {
    elRrLinkWrap.hidden = false;
    elRrLink.href = t.url;
    elRrLink.textContent = t.linkLabel;
  } else {
    elRrLinkWrap.hidden = true;
  }
  $$(".router-chip").forEach((c, i) => {
    const on = i === idx;
    c.classList.toggle("is-active", on);
    c.setAttribute("aria-pressed", String(on));
  });
}

$$(".router-chip").forEach((c) =>
  c.addEventListener("click", () => renderTask(Number(c.dataset.task)))
);

// ==================== 7. 第 06 节：四选一盲测判卷 ====================
const QUIZ_FEEDBACK = {
  A: {
    title: "A 差在一处：顶部只写了空洞目录词，把结论藏进正文",
    body: "A 的外边距、栏间距、左缘对齐和右侧折线图其实都很规范，唯独顶部标题写成「手环续航测试情况概览（三）」，最核心的「续航翻倍至 14 天」被埋在左列第 3 条里，观众扫视标题区拿不到主张。正确答案是 B。",
  },
  B: {
    title: "答对了 · B 四项核心原则全部到位",
    body: "顶部一句完整结论先立主张，左列精简 3 条改动原因，右侧给出 7 天 vs 14 天的实测折线证据图与图注，图文互补零复读；同时保持均匀外边距、清晰中缝与严格左缘对齐。",
  },
  C: {
    title: "C 差在一处：右侧色块只是把左列三句话原样复读",
    body: "C 的标题、对齐和留白都没问题，但右侧没有放实测耗电证据，而是用三个花哨方框重复抄了左边三条要点。按迈耶冗余原则，图文复读既浪费宝贵的半幅空间，又加重视觉负担。正确答案是 B。",
  },
  D: {
    title: "D 差在一处：外边距贴边、左缘错牙且中缝栏间距塌死",
    body: "D 的标题结论和右图曲线内容本身是对的，但正文紧贴左框边缘（与标题明显错牙），且左列行尾直接顶在右图边框上毫无栏间距，整体显得仓促凌乱且投影极易裁切。正确答案是 B。",
  },
};

const elQuizGrid = $(".quiz-grid");
const elQvTitle = $("#qv-title");
const elQvBody = $("#qv-body");

$$(".quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    const ch = card.dataset.choice;
    elQuizGrid.classList.add("is-revealed");
    $$(".quiz-card").forEach((c) => {
      const picked = c.dataset.choice === ch;
      c.classList.toggle("is-picked", picked);
      c.classList.toggle("is-right", c.dataset.choice === "B");
      c.setAttribute("aria-pressed", String(picked));
    });
    const fb = QUIZ_FEEDBACK[ch];
    elQvTitle.textContent = fb.title;
    elQvBody.textContent = fb.body;
  });
});

// ==================== 8. 第 07 节：原海报全屏灯箱（拖拽、缩放、Esc 关） ====================
const elPoster = $("#poster");
const elPosterOpen = $("#poster-open");
const elLightbox = $("#lightbox");
const elLbImg = $("#lb-img");
const elLbViewport = $("#lb-viewport");
const elLbScale = $("#lb-scale");
const elLbClose = $("#lb-close");
const elLbIn = $("#lb-zoom-in");
const elLbOut = $("#lb-zoom-out");

let lbZoom = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = false;
let lbStartX = 0;
let lbStartY = 0;

function updateLbTransform() {
  elLbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbZoom})`;
  elLbScale.textContent = `${Math.round(lbZoom * 100)}%`;
}

function openLightbox() {
  elLbImg.src = elPoster.src;
  lbZoom = 1;
  lbX = 0;
  lbY = 0;
  updateLbTransform();
  elLightbox.hidden = false;
  elPosterOpen.setAttribute("aria-expanded", "true");
  elLbClose.focus();
}

function closeLightbox() {
  if (elLightbox.hidden) return;
  elLightbox.hidden = true;
  elPosterOpen.setAttribute("aria-expanded", "false");
  elPosterOpen.focus();
}

elPosterOpen.addEventListener("click", openLightbox);
elLbClose.addEventListener("click", closeLightbox);
elLbIn.addEventListener("click", () => {
  lbZoom = Math.min(2.6, Number((lbZoom + 0.3).toFixed(2)));
  updateLbTransform();
});
elLbOut.addEventListener("click", () => {
  lbZoom = Math.max(0.7, Number((lbZoom - 0.3).toFixed(2)));
  if (lbZoom <= 1) { lbX = 0; lbY = 0; }
  updateLbTransform();
});

elLbViewport.addEventListener("mousedown", (e) => {
  if (e.target === elLbViewport) {
    closeLightbox();
    return;
  }
  lbDrag = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  elLbViewport.classList.add("is-dragging");
});
window.addEventListener("mousemove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbStartX;
  lbY = e.clientY - lbStartY;
  updateLbTransform();
});
window.addEventListener("mouseup", () => {
  lbDrag = false;
  elLbViewport.classList.remove("is-dragging");
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !elLightbox.hidden) closeLightbox();
});

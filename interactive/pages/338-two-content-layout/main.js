import { INITIAL_STATE, SOLUTIONS, REVERSE_FAULTS, evaluateSlide } from "./model.js";
import { createWorkbench } from "./workbench.js";
import { createPingPongLab } from "./lab.js";

// ==================== 1. HERO WORKBENCH ====================
const state = { ...INITIAL_STATE };
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const heroStatus = $("#hero-status");
const auditBadge = $("#audit-badge");
const auditHeadline = $("#audit-headline");
const auditWhy = $("#audit-why");
const auditFix = $("#audit-fix");
const btnAuditCta = $("#btn-audit-cta");
const teleRatio = $("#tele-ratio");
const teleGap = $("#tele-gap");
const teleLines = $("#tele-lines");
const teleTilt = $("#tele-tilt");

const rngSplit = $("#rng-split");
const rngGutter = $("#rng-gutter");
const rngOffsetY = $("#rng-offsety");
const valSplit = $("#val-split");
const valGutter = $("#val-gutter");
const valOffsetY = $("#val-offsety");
const btnD1 = $("#btn-d1");
const btnD2 = $("#btn-d2");
const btnV1 = $("#btn-v1");
const btnV2 = $("#btn-v2");
const btnGuides = $("#btn-guides");

const DENSITY_TXT = { wall: "7行字墙", concise: "3条精炼", empty: "1行空壳" };
let lastAudit = null;
const setTxt = (el, v) => { if (el.textContent !== v) el.textContent = v; };
const setCls = (el, v) => { if (el.className !== v) el.className = v; };

function syncUI(ev) {
  lastAudit = ev;

  setTxt(heroStatus, ev.verdict.badge);
  setCls(heroStatus, `status-pill ${ev.score === 4 ? "is-pass" : "is-fault"}`);

  setTxt(auditBadge, ev.verdict.badge);
  setCls(auditBadge, `audit-score-pill ${ev.score === 4 ? "is-pass" : ""}`);
  setTxt(auditHeadline, ev.verdict.headline);
  setTxt(auditWhy, ev.verdict.why);
  setTxt(auditFix, ev.verdict.fixHint);
  setTxt(btnAuditCta, ev.verdict.cta);

  setTxt(teleRatio, `${ev.splitPct1}:${ev.splitPct2} (${ev.cpl1}/${ev.cpl2}字)`);
  setTxt(teleGap, `${ev.gutterPx}px / ${ev.deltaYPx >= 0 ? "+" : ""}${ev.deltaYPx}px`);
  setTxt(teleLines, `${ev.totalTextLines1} 行 : ${ev.totalTextLines2} 行`);
  setTxt(
    teleTilt,
    Math.abs(ev.tiltPct) <= 6
      ? `居中 (${ev.tiltPct >= 0 ? "+" : ""}${ev.tiltPct}%)`
      : ev.tiltPct < 0
        ? `左倾 ${Math.abs(ev.tiltPct)}%`
        : `右倾 +${ev.tiltPct}%`
  );

  // Pillar probes
  for (const key of ["modules", "alignment", "priority", "balance"]) {
    const tag = $(`#tag-${key}`);
    const p = ev.pillars[key];
    setTxt(tag, p.tag);
    setCls(tag, `pillar-tag ${p.pass ? "is-pass" : "is-fault"}`);
  }

  // Controls reflect single-source state
  const sStr = String(ev.splitPct1);
  if (rngSplit.value !== sStr) rngSplit.value = sStr;
  setTxt(valSplit, `${ev.splitPct1}:${ev.splitPct2}`);
  const gStr = String(ev.gutterPx);
  if (rngGutter.value !== gStr) rngGutter.value = gStr;
  setTxt(valGutter, `${ev.gutterPx}px`);
  const yStr = String(ev.deltaYPx);
  if (rngOffsetY.value !== yStr) rngOffsetY.value = yStr;
  setTxt(valOffsetY, `${ev.deltaYPx >= 0 ? "+" : ""}${ev.deltaYPx}px`);

  $$("#grp-polarity .chip").forEach((b) => b.classList.toggle("is-active", b.dataset.polarity === state.polarity));
  $$("#grp-align .chip").forEach((b) => b.classList.toggle("is-active", b.dataset.align === state.alignMode));
  $$(".deck-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.deck === state.deck));

  setTxt(btnD1, `左01：${DENSITY_TXT[state.density1]}`);
  setTxt(btnD2, `右02：${DENSITY_TXT[state.density2]}`);
  setTxt(btnV1, `左图：${state.visual1 ? "开" : "关"}`);
  btnV1.classList.toggle("is-active", state.visual1);
  setTxt(btnV2, `右图：${state.visual2 ? "开" : "关"}`);
  btnV2.classList.toggle("is-active", state.visual2);

  setTxt(btnGuides, `标尺：${state.showGuides ? "开" : "关"}`);
  btnGuides.classList.toggle("is-on", state.showGuides);
  btnGuides.setAttribute("aria-pressed", String(state.showGuides));
}

function patchState(patch, deferDraw = false) {
  Object.assign(state, patch);
  wb.redraw(!deferDraw);
}

const wb = createWorkbench($("#workbench"), () => state, patchState, syncUI);

// Populate multi-solution & reverse-fault buttons
const grpSolutions = $("#grp-solutions");
SOLUTIONS.forEach((s) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip is-sol";
  b.textContent = s.label;
  b.title = s.note;
  b.addEventListener("click", () => patchState({ ...s.patch, focusLayer: null }));
  grpSolutions.appendChild(b);
});

const grpFaults = $("#grp-faults");
REVERSE_FAULTS.forEach((f) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip is-fault-btn";
  b.textContent = f.label;
  b.addEventListener("click", () => patchState({ ...f.patch, focusLayer: null }));
  grpFaults.appendChild(b);
});

// Wire controls
$$(".deck-btn").forEach((b) => b.addEventListener("click", () => patchState({ deck: b.dataset.deck })));
rngSplit.addEventListener("input", () => patchState({ split: Number(rngSplit.value) / 100 }));
rngGutter.addEventListener("input", () => patchState({ gutter: Number(rngGutter.value) / 960 }));
rngOffsetY.addEventListener("input", () => {
  const px = Number(rngOffsetY.value);
  patchState({ offsetY: Math.abs(px) <= 3 ? 0 : px / 540 });
});

$$("#grp-polarity .chip").forEach((b) =>
  b.addEventListener("click", () => patchState({ polarity: b.dataset.polarity }))
);
$$("#grp-align .chip").forEach((b) =>
  b.addEventListener("click", () => patchState({ alignMode: b.dataset.align }))
);

const DENSITY_RING = ["wall", "concise", "empty"];
btnD1.addEventListener("click", () =>
  patchState({ density1: DENSITY_RING[(DENSITY_RING.indexOf(state.density1) + 1) % 3] })
);
btnD2.addEventListener("click", () =>
  patchState({ density2: DENSITY_RING[(DENSITY_RING.indexOf(state.density2) + 1) % 3] })
);
btnV1.addEventListener("click", () => patchState({ visual1: !state.visual1 }));
btnV2.addEventListener("click", () => patchState({ visual2: !state.visual2 }));
btnGuides.addEventListener("click", () => patchState({ showGuides: !state.showGuides }));

$$(".pillar-card").forEach((card) => {
  card.addEventListener("click", () => {
    const p = card.dataset.pillar;
    const next = state.focusLayer === p ? null : p;
    $$(".pillar-card").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.pillar === next)));
    patchState({ focusLayer: next });
  });
});

btnAuditCta.addEventListener("click", () => {
  if (!lastAudit) return;
  if (lastAudit.verdict.ctaAction === "gaze") {
    wb.triggerGaze();
  } else if (lastAudit.verdict.ctaPatch) {
    patchState({ ...lastAudit.verdict.ctaPatch, focusLayer: null });
  }
});
$("#btn-reset-broken").addEventListener("click", () => patchState({ ...INITIAL_STATE, deck: state.deck }));
$("#btn-gaze-top").addEventListener("click", () => wb.triggerGaze());

syncUI(evaluateSlide(state));

// ==================== 2. SECTION 01: 4 ARCHETYPE BLUEPRINTS ====================
const ARCHETYPES = {
  parallel: {
    caption: "并列双柱（50:50）：两项核心议题权重相当，用「左浅米 + 右深酒红」或双卡清晰区隔建立节奏，避免读者把两块要点看串行。",
    svg: `<svg viewBox="0 0 560 300" role="img" aria-label="并列双柱 50:50 结构蓝图">
      <rect x="24" y="18" width="210" height="16" rx="4" fill="#1D1315"/>
      <rect x="24" y="42" width="140" height="6" rx="3" fill="#BB4C56"/>
      <path d="M36 66 V58 H216 M344 58 H524 V66" fill="none" stroke="#6D1E29" stroke-width="1.5"/>
      <text x="280" y="62" text-anchor="middle" fill="#6D1E29" font-size="12" font-weight="700">共享总题 · 50:50</text>
      <rect x="24" y="76" width="236" height="196" rx="12" fill="#FFF8F0" stroke="#D9C3AD" stroke-width="1.5"/>
      <circle cx="52" cy="104" r="13" fill="#6D1E29"/><text x="52" y="108" text-anchor="middle" fill="#FFF8F0" font-size="11" font-weight="700">01</text>
      <rect x="74" y="96" width="90" height="10" rx="3" fill="#1D1315"/>
      <circle cx="96" cy="166" r="24" fill="#6D1E29"/><rect x="108" y="148" width="38" height="38" fill="#E1C4A7"/>
      <rect x="44" y="216" width="164" height="7" rx="3" fill="#594145"/><rect x="44" y="232" width="140" height="7" rx="3" fill="#594145"/><rect x="44" y="248" width="120" height="7" rx="3" fill="#594145"/>
      <line x1="280" y1="88" x2="280" y2="262" stroke="#6D1E29" stroke-dasharray="4 4" stroke-width="1.5"/>
      <circle cx="280" cy="174" r="15" fill="#E1C4A7" stroke="#6D1E29" stroke-width="1.5"/><text x="280" y="179" text-anchor="middle" fill="#6D1E29" font-size="17" font-weight="700">+</text>
      <rect x="300" y="76" width="236" height="196" rx="12" fill="#6D1E29"/>
      <circle cx="328" cy="104" r="13" fill="#E1C4A7"/><text x="328" y="108" text-anchor="middle" fill="#6D1E29" font-size="11" font-weight="700">02</text>
      <rect x="350" y="96" width="96" height="10" rx="3" fill="#FFF8F0"/>
      <polygon points="376,140 342,190 410,190" fill="#EEDBC8"/><circle cx="418" cy="162" r="20" fill="#BB4C56"/>
      <rect x="320" y="216" width="166" height="7" rx="3" fill="#F2DAD1"/><rect x="320" y="232" width="146" height="7" rx="3" fill="#F2DAD1"/><rect x="320" y="248" width="126" height="7" rx="3" fill="#F2DAD1"/>
      <line x1="16" y1="76" x2="544" y2="76" stroke="#155A3E" stroke-dasharray="5 4" stroke-width="1.3"/>
      <text x="536" y="71" text-anchor="end" fill="#155A3E" font-size="10.5" font-weight="700">齐顶基准 ΔY 0px</text>
    </svg>`,
  },
  chartText: {
    caption: "图文互补（58:42）：左卡留足 58% 宽度展示数据图表并就地直标数值，右卡 42% 以深酒红实底压缩为 3 条核心结论——面积与明暗互相配平。",
    svg: `<svg viewBox="0 0 560 300" role="img" aria-label="图文互补 58:42 结构蓝图">
      <rect x="24" y="18" width="260" height="16" rx="4" fill="#1D1315"/>
      <rect x="24" y="42" width="160" height="6" rx="3" fill="#BB4C56"/>
      <rect x="24" y="76" width="286" height="196" rx="12" fill="#FFF8F0" stroke="#D9C3AD" stroke-width="1.5"/>
      <text x="44" y="102" fill="#6D1E29" font-size="12" font-weight="800">01 证据图表区 · 58%</text>
      <rect x="52" y="198" width="40" height="52" rx="4" fill="#E1C4A7"/>
      <rect x="110" y="170" width="40" height="80" rx="4" fill="#D4A688"/>
      <rect x="168" y="144" width="40" height="106" rx="4" fill="#BB4C56"/>
      <rect x="226" y="118" width="40" height="132" rx="4" fill="#6D1E29"/>
      <text x="246" y="112" text-anchor="middle" fill="#6D1E29" font-size="11" font-weight="700">+28%</text>
      <circle cx="326" cy="174" r="14" fill="#E1C4A7" stroke="#6D1E29" stroke-width="1.5"/><text x="326" y="178" text-anchor="middle" fill="#6D1E29" font-size="13" font-weight="700">→</text>
      <rect x="342" y="76" width="194" height="196" rx="12" fill="#6D1E29"/>
      <text x="360" y="102" fill="#F0D6BC" font-size="12" font-weight="800">02 提炼结论 · 42%</text>
      <rect x="360" y="128" width="150" height="9" rx="3" fill="#FFF8F0"/>
      <rect x="360" y="145" width="124" height="7" rx="3" fill="#F2DAD1"/>
      <rect x="360" y="176" width="154" height="9" rx="3" fill="#FFF8F0"/>
      <rect x="360" y="193" width="118" height="7" rx="3" fill="#F2DAD1"/>
      <rect x="360" y="224" width="142" height="9" rx="3" fill="#FFF8F0"/>
      <rect x="360" y="241" width="110" height="7" rx="3" fill="#F2DAD1"/>
    </svg>`,
  },
  problemFix: {
    caption: "痛点→方案（46:54）：左卡用低饱和柔浅底客观陈述现状瓶颈，右卡加宽至 54% 并用深酒红凸显重构解法，天然引导观众把视线落在行动上。",
    svg: `<svg viewBox="0 0 560 300" role="img" aria-label="痛点到方案 46:54 结构蓝图">
      <rect x="24" y="18" width="240" height="16" rx="4" fill="#1D1315"/>
      <rect x="24" y="76" width="218" height="196" rx="12" fill="#F7ECEB" stroke="#D4B5AE" stroke-width="1.5" stroke-dasharray="5 3"/>
      <text x="42" y="104" fill="#594145" font-size="12" font-weight="800">01 现状痛点 · 46%（退后）</text>
      <rect x="42" y="128" width="176" height="22" rx="5" fill="#EAD5D0"/>
      <rect x="42" y="162" width="150" height="22" rx="5" fill="#EAD5D0"/>
      <rect x="42" y="196" width="124" height="22" rx="5" fill="#EAD5D0"/>
      <text x="42" y="248" fill="#AD1B24" font-size="11.5" font-weight="700">首屏流失率 41%</text>
      <circle cx="262" cy="174" r="15" fill="#6D1E29"/><text x="262" y="178" text-anchor="middle" fill="#FFF8F0" font-size="14" font-weight="700">→</text>
      <rect x="282" y="76" width="254" height="196" rx="12" fill="#6D1E29"/>
      <text x="302" y="104" fill="#F0D6BC" font-size="12" font-weight="800">02 渐进式重构 · 54%（主焦点）</text>
      <rect x="302" y="126" width="214" height="32" rx="7" fill="rgba(255,248,240,0.14)"/>
      <text x="314" y="146" fill="#FFF8F0" font-size="11.5" font-weight="700">① 手机号直进沙箱体验</text>
      <rect x="302" y="168" width="214" height="32" rx="7" fill="rgba(255,248,240,0.14)"/>
      <text x="314" y="188" fill="#FFF8F0" font-size="11.5" font-weight="700">② 资质核验延后至发布前</text>
      <rect x="302" y="210" width="214" height="36" rx="7" fill="#EEDBC8"/>
      <text x="314" y="232" fill="#380D14" font-size="12" font-weight="800">目标：30 秒内完成首次可用</text>
    </svg>`,
  },
  causeEffect: {
    caption: "原则+案例（50:50）：左卡给抽象方法论与三句口诀，右卡配具体标本或落地截图，帮助观众把抽象概念立刻落回真实画面。",
    svg: `<svg viewBox="0 0 560 300" role="img" aria-label="原则加案例 50:50 结构蓝图">
      <rect x="24" y="18" width="230" height="16" rx="4" fill="#1D1315"/>
      <rect x="24" y="76" width="236" height="196" rx="12" fill="#6D1E29"/>
      <text x="44" y="104" fill="#F0D6BC" font-size="12" font-weight="800">01 核心原则（左深锚定）</text>
      <text x="44" y="142" fill="#FFF8F0" font-size="16" font-weight="900">“先给结论，再给证据”</text>
      <line x1="44" y1="158" x2="238" y2="158" stroke="rgba(240,214,188,0.35)"/>
      <rect x="44" y="176" width="176" height="8" rx="3" fill="#F2DAD1"/>
      <rect x="44" y="198" width="160" height="8" rx="3" fill="#F2DAD1"/>
      <rect x="44" y="220" width="144" height="8" rx="3" fill="#F2DAD1"/>
      <circle cx="280" cy="174" r="14" fill="#E1C4A7" stroke="#6D1E29" stroke-width="1.5"/><text x="280" y="179" text-anchor="middle" fill="#6D1E29" font-size="16" font-weight="700">+</text>
      <rect x="300" y="76" width="236" height="196" rx="12" fill="#FFF8F0" stroke="#D9C3AD" stroke-width="1.5"/>
      <text x="320" y="104" fill="#6D1E29" font-size="12" font-weight="800">02 落地标本（右浅举例）</text>
      <rect x="320" y="122" width="196" height="86" rx="8" fill="#FDE7E3" stroke="#E0C1B9"/>
      <circle cx="378" cy="165" r="22" fill="#6D1E29"/><rect x="394" y="147" width="38" height="36" fill="#E1C4A7"/>
      <rect x="446" y="152" width="54" height="7" rx="3" fill="#6D1E29"/><rect x="446" y="166" width="44" height="7" rx="3" fill="#BB4C56"/>
      <text x="320" y="232" fill="#1D1315" font-size="12" font-weight="700">案例验证：阅读耗时压缩 45%</text>
      <text x="320" y="250" fill="#594145" font-size="11">具体标本让抽象规则一眼可照抄</text>
    </svg>`,
  },
};

const bpStage = $("#bp-stage");
const bpCaption = $("#bp-caption");
function setArchetype(key) {
  const a = ARCHETYPES[key];
  bpStage.innerHTML = a.svg;
  bpCaption.textContent = a.caption;
  $$(".bp-tab").forEach((t) => {
    const active = t.dataset.arch === key;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", String(active));
  });
}
$$(".bp-tab").forEach((t) => t.addEventListener("click", () => setArchetype(t.dataset.arch)));
setArchetype("parallel");

// ==================== 3. SECTION 02: ORIGIN ERAS ====================
const ERAS = {
  1992: {
    year: "1992",
    title: "分离注意效应与空间邻近的认知根基",
    body: "Paul Chandler 与 John Sweller 在《英国教育心理学杂志》（1992）发表论文，证明把相互依赖的图与文字拆开摆放会逼迫人脑反复整合，带来高昂的外在认知负荷。这一发现后来直接塑造了双内容幻灯片的铁律：左图必须自带标签，右栏只能放独立归纳的结论。",
    src: "来源：Chandler & Sweller, British Journal of Educational Psychology, 62(2), 233–246 (1992)",
    wire: `<svg viewBox="0 0 420 120"><rect x="14" y="12" width="174" height="96" rx="8" fill="#FFF8F0" stroke="#D9C3AD"/><text x="26" y="34" fill="#6D1E29" font-size="11" font-weight="700">视觉图形（就地直标）</text><rect x="30" y="48" width="28" height="44" fill="#6D1E29"/><rect x="74" y="64" width="28" height="28" fill="#BB4C56"/><rect x="118" y="54" width="28" height="38" fill="#E1C4A7"/><path d="M192 60 H224 M218 55 L225 60 L218 65" fill="none" stroke="#155A3E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="210" y="50" text-anchor="middle" fill="#155A3E" font-size="10.5" font-weight="700">1 次跨缝</text><rect x="232" y="12" width="174" height="96" rx="8" fill="#6D1E29"/><text x="246" y="34" fill="#F0D6BC" font-size="11" font-weight="700">独立语义收口</text><rect x="246" y="50" width="132" height="7" rx="3" fill="#FFF8F0"/><rect x="246" y="68" width="118" height="7" rx="3" fill="#F2DAD1"/><rect x="246" y="86" width="102" height="7" rx="3" fill="#F2DAD1"/></svg>`,
  },
  1994: {
    year: "1994",
    title: "PowerPoint 4.0 首次推出 AutoLayout 双栏母版",
    body: "PowerPoint 共同创始人 Robert Gaskins 在回忆录《Sweating Bullets》（2012）中记载，1994 年发布的 PowerPoint 4.0 引入了 AutoLayout 预设版式库，首次把「2 Column Text」「Text & Chart」「Text & Clip Art」做成一键占位框。不过当时每种媒体组合都要单独占一个死板模板，列表臃肿。",
    src: "来源：Robert Gaskins, Sweating Bullets: Notes about Inventing PowerPoint (2012)",
    wire: `<svg viewBox="0 0 420 120"><rect x="12" y="14" width="122" height="92" rx="6" fill="#FFF8F0" stroke="#D9C3AD"/><text x="73" y="32" text-anchor="middle" fill="#594145" font-size="10" font-weight="700">2 Column Text</text><rect x="22" y="42" width="46" height="54" fill="#F3E2D8"/><rect x="78" y="42" width="46" height="54" fill="#F3E2D8"/><rect x="148" y="14" width="122" height="92" rx="6" fill="#FFF8F0" stroke="#D9C3AD"/><text x="209" y="32" text-anchor="middle" fill="#594145" font-size="10" font-weight="700">Text &amp; Chart</text><rect x="158" y="42" width="46" height="54" fill="#F3E2D8"/><rect x="214" y="42" width="46" height="54" fill="#E1C4A7"/><rect x="284" y="14" width="122" height="92" rx="6" fill="#FFF8F0" stroke="#D9C3AD"/><text x="345" y="32" text-anchor="middle" fill="#594145" font-size="10" font-weight="700">Text &amp; Clip Art</text><rect x="294" y="42" width="46" height="54" fill="#F3E2D8"/><circle cx="373" cy="69" r="19" fill="#BB4C56"/></svg>`,
  },
  2006: {
    year: "2006–2007",
    title: "ECMA-376 标准确立 twoObj 与九大基础母版",
    body: "2006 年 12 月 Ecma 国际发布 Office Open XML 标准 ECMA-376（2008 年成为 ISO/IEC 29500），随后 PowerPoint 2007 将几十个零散模板收编为九大标准基础版式：两项内容被正式命名为 twoObj（Two Content），两个多态占位框可自由填入文字、图表、表格或图片，而自带两栏子标题的对照则独立为 339 比较（twoTxTwoObj）。",
    src: "来源：Ecma International ECMA-376 (2006) & Microsoft Open XML SDK SlideLayoutValues",
    wire: `<svg viewBox="0 0 420 120"><rect x="14" y="10" width="392" height="100" rx="8" fill="#FFF8F0" stroke="#6D1E29" stroke-width="1.5"/><text x="26" y="28" fill="#6D1E29" font-size="10.5" font-family="DM Mono, monospace" font-weight="700">&lt;p:sldLayout type="twoObj"&gt; · 九大母版第 4 号</text><rect x="26" y="38" width="176" height="62" rx="6" fill="#FCEEEB" stroke="#D9C3AD" stroke-dasharray="4 3"/><text x="114" y="73" text-anchor="middle" fill="#1D1315" font-size="11" font-weight="700">多态占位 01（文/图/表）</text><rect x="218" y="38" width="176" height="62" rx="6" fill="#6D1E29"/><text x="306" y="73" text-anchor="middle" fill="#FFF8F0" font-size="11" font-weight="700">多态占位 02（文/图/表）</text></svg>`,
  },
  2008: {
    year: "2007–2008",
    title: "告别「双栏密字」，进入对比与留白时代",
    body: "Stephen Kosslyn《Clear and to the Point》（牛津大学出版社，2007）从知觉分辨度与容量限制抨击满屏要点列表；Nancy Duarte 在《slide:ology》（O'Reilly，2008）中明确指出双栏最易掉进「双栏等重文字墙」陷阱，主张借明暗反差、图形替换与非对称留白建立第一眼主次——这正是 338 原海报一浅一深的视觉心法。",
    src: "来源：Kosslyn (Oxford Univ. Press, 2007); Duarte, slide:ology (O'Reilly Media, 2008)",
    wire: `<svg viewBox="0 0 420 120"><rect x="14" y="14" width="182" height="92" rx="8" fill="#FFF8F0" stroke="#D9C3AD"/><text x="28" y="36" fill="#594145" font-size="11" font-weight="700">01 暖米浅底 · 轻盈图解</text><circle cx="66" cy="72" r="18" fill="#6D1E29"/><rect x="78" y="58" width="32" height="28" fill="#E1C4A7"/><rect x="224" y="14" width="182" height="92" rx="8" fill="#6D1E29"/><text x="238" y="36" fill="#F0D6BC" font-size="11" font-weight="700">02 深酒红底 · 强对比结论</text><rect x="238" y="52" width="136" height="8" rx="3" fill="#FFF8F0"/><rect x="238" y="70" width="118" height="8" rx="3" fill="#F2DAD1"/><rect x="238" y="88" width="96" height="8" rx="3" fill="#F2DAD1"/></svg>`,
  },
};

const eraCard = $("#era-card");
function setEra(yr) {
  const e = ERAS[yr];
  eraCard.innerHTML = `<p class="era-year" lang="en">${e.year}</p><h3>${e.title}</h3><p>${e.body}</p><div class="era-wire">${e.wire}</div><p class="era-src">${e.src}</p>`;
  $$(".era-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.era === yr));
}
$$(".era-btn").forEach((b) => b.addEventListener("click", () => setEra(b.dataset.era)));
setEra("1992");

// ==================== 4. SECTION 03: DARKROOM PING-PONG LAB ====================
const labState = { mode: "split", pacing: "all" };
const labCrossings = $("#lab-crossings");
const labTier = $("#lab-tier");
const labVerdict = $("#lab-verdict");

const lab = createPingPongLab(
  $("#pingpong-canvas"),
  () => labState,
  (sim) => {
    labCrossings.textContent = `${sim.crossings} 次`;
    labTier.textContent = sim.loadTier;
    labVerdict.textContent = sim.verdict;
  }
);

$$("[data-lab-mode]").forEach((b) =>
  b.addEventListener("click", () => {
    labState.mode = b.dataset.labMode;
    $$("[data-lab-mode]").forEach((x) => x.classList.toggle("is-active", x.dataset.labMode === labState.mode));
    lab.refresh();
  })
);
$$("[data-lab-pacing]").forEach((b) =>
  b.addEventListener("click", () => {
    labState.pacing = b.dataset.labPacing;
    $$("[data-lab-pacing]").forEach((x) => x.classList.toggle("is-active", x.dataset.labPacing === labState.pacing));
    lab.refresh();
  })
);

// ==================== 5. SECTION 04: BEFORE/AFTER CURTAIN ====================
const SCENARIOS = {
  chart: {
    title: "数据图表 + 核心结论：把 12 行汇报压成 3 秒看懂的双模块",
    notes: [
      "把原本塞在同一框里的 8 行文字与压缩小图拆成 56:44 独立双区，左图呼吸空间翻倍。",
      "把柱状图数值直接标在柱顶，消除图例分离注意；右卡换波尔多深酒红承接 3 条决策结论。",
      "双卡严格齐顶对齐，中央用暖沙小圆 + 承接『数据 → 结论』的自然递进。",
    ],
    beforeSvg: `<svg viewBox="0 0 640 360">
      <rect width="640" height="360" fill="#F5E9E6"/>
      <text x="28" y="38" fill="#1D1315" font-size="18" font-weight="900">三季度销售与复购运营汇报（数据明细）</text>
      <rect x="28" y="58" width="584" height="270" rx="6" fill="#FFFFFF" stroke="#CFAFA8" stroke-dasharray="4 3"/>
      <text x="44" y="86" fill="#594145" font-size="12">• 七月华东区与华南区拉新总访客达四十二万人次，同比上涨二十八个百分点</text>
      <text x="44" y="108" fill="#594145" font-size="12">• 八月自然搜索及老客裂变渠道占比提升至百分之六十一，低于行业均值成本</text>
      <text x="44" y="130" fill="#594145" font-size="12">• 九月开学专题带动首单转化率提升四个百分点，次月留存稳居百分之六十四</text>
      <text x="44" y="152" fill="#594145" font-size="12">• 华东三仓完成合并调度后，干线满载率提升并压缩单票履约成本十九个点</text>
      <text x="44" y="174" fill="#594145" font-size="12">• 周度预测补货模型命中率达百分之九十一，单均履约毛利首次转正两块四</text>
      <text x="44" y="196" fill="#594145" font-size="12">• 其余各省区明细见下表及附录四十二页，建议各业务线会后逐项自行核对</text>
      <rect x="44" y="216" width="552" height="94" fill="#EFE4E0"/>
      <rect x="76" y="266" width="38" height="32" fill="#9E8285"/><rect x="136" y="252" width="38" height="46" fill="#9E8285"/><rect x="196" y="236" width="38" height="62" fill="#9E8285"/>
      <text x="276" y="270" fill="#AD1B24" font-size="13" font-weight="800">× 图被挤到角落，文字与结论混成一堵字墙</text>
    </svg>`,
    afterSvg: `<svg viewBox="0 0 640 360">
      <rect width="640" height="360" fill="#FCEEEB"/>
      <text x="28" y="38" fill="#1D1315" font-size="18" font-weight="900">Q3 拉新增长 28%，仓配并线带动单均毛利转正</text>
      <rect x="28" y="48" width="38" height="2.5" fill="#6D1E29"/>
      <rect x="28" y="68" width="320" height="258" rx="14" fill="#FFF8F0" stroke="#D9C3AD" stroke-width="1.5"/>
      <text x="48" y="96" fill="#6D1E29" font-size="13" font-weight="900">01 获客趋势 · 56%</text>
      <rect x="64" y="214" width="44" height="58" rx="4" fill="#E1C4A7"/><text x="86" y="206" text-anchor="middle" fill="#594145" font-size="11">Q1</text>
      <rect x="134" y="182" width="44" height="90" rx="4" fill="#D2A085"/><text x="156" y="174" text-anchor="middle" fill="#594145" font-size="11">Q2</text>
      <rect x="204" y="142" width="44" height="130" rx="4" fill="#6D1E29"/><text x="226" y="132" text-anchor="middle" fill="#6D1E29" font-size="12" font-weight="800">+28%</text>
      <text x="48" y="302" fill="#594145" font-size="12">自然搜索占 61% · 次月留存 64%</text>
      <circle cx="366" cy="196" r="14" fill="#E1C4A7" stroke="#6D1E29" stroke-width="1.5"/><text x="366" y="201" text-anchor="middle" fill="#6D1E29" font-size="16" font-weight="700">+</text>
      <rect x="384" y="68" width="228" height="258" rx="14" fill="#6D1E29"/>
      <text x="404" y="96" fill="#F0D6BC" font-size="13" font-weight="900">02 核心结论 · 44%</text>
      <text x="404" y="142" fill="#FFF8F0" font-size="13" font-weight="700">• 干线降本 19%</text>
      <text x="404" y="162" fill="#F2DAD1" font-size="11.5">华东三仓完成合并调度</text>
      <text x="404" y="204" fill="#FFF8F0" font-size="13" font-weight="700">• 补货命中 91%</text>
      <text x="404" y="224" fill="#F2DAD1" font-size="11.5">周度预测模型压低滞销</text>
      <text x="404" y="266" fill="#EEDBC8" font-size="14" font-weight="900">• 毛利转正 +2.4 元/单</text>
    </svg>`,
  },
  pain: {
    title: "背景痛点 + 重构方案：用一浅一深把注意力推向解法",
    notes: [
      "改稿前左右同底色且顶线错开，痛点写得密密麻麻反而抢走了解法的风头。",
      "改稿后左卡退为浅米淡框、只留 3 级流失漏斗；右卡铺深酒红凸显渐进式三步重构。",
      "宽比调整为 46:54，让「解决方案」无论面积还是明暗都稳稳占住视觉主位。",
    ],
    beforeSvg: `<svg viewBox="0 0 640 360">
      <rect width="640" height="360" fill="#F5E9E6"/>
      <text x="28" y="38" fill="#1D1315" font-size="18" font-weight="900">开户流程现状问题及后续改版建议</text>
      <rect x="28" y="64" width="356" height="260" fill="#FFFFFF" stroke="#C7B1AD"/>
      <text x="44" y="92" fill="#1D1315" font-size="13" font-weight="800">现存问题（7条全列）</text>
      <text x="44" y="122" fill="#594145" font-size="11.5">1. 首屏必填七项企业资质字段过长</text>
      <text x="44" y="146" fill="#594145" font-size="11.5">2. 移动端跳转外链实名验证跳出高</text>
      <text x="44" y="170" fill="#594145" font-size="11.5">3. 表单提交才校验并清空已选项</text>
      <text x="44" y="194" fill="#594145" font-size="11.5">4. 未体验产品即要求授权高敏权限</text>
      <text x="44" y="218" fill="#594145" font-size="11.5">5. 安卓上传营业执照大图偶发闪退</text>
      <text x="44" y="242" fill="#594145" font-size="11.5">6. 客服工单里三成集中在开户卡顿</text>
      <rect x="392" y="102" width="220" height="222" fill="#FFFFFF" stroke="#C7B1AD"/>
      <text x="406" y="132" fill="#1D1315" font-size="13" font-weight="800">优化思路（挤窄+掉顶）</text>
      <text x="406" y="164" fill="#594145" font-size="11.5">• 改成手机号先登</text>
      <text x="406" y="190" fill="#594145" font-size="11.5">• 资质后置补全</text>
      <text x="406" y="240" fill="#AD1B24" font-size="12" font-weight="800">× 痛点压垮解法，两栏错顶粘连</text>
    </svg>`,
    afterSvg: `<svg viewBox="0 0 640 360">
      <rect width="640" height="360" fill="#FCEEEB"/>
      <text x="28" y="38" fill="#1D1315" font-size="18" font-weight="900">三步渐进开户，把首屏 41% 流失压缩一半</text>
      <rect x="28" y="48" width="38" height="2.5" fill="#6D1E29"/>
      <rect x="28" y="68" width="256" height="258" rx="14" fill="#FFF8F0" stroke="#D9C3AD" stroke-width="1.5"/>
      <text x="48" y="96" fill="#594145" font-size="13" font-weight="900">01 现状流失瓶颈 · 46%</text>
      <rect x="58" y="120" width="196" height="28" rx="6" fill="#EEDBC8"/><text x="156" y="138" text-anchor="middle" fill="#1D1315" font-size="11.5" font-weight="700">首屏进入 100%</text>
      <rect x="82" y="162" width="148" height="28" rx="6" fill="#BB4C56"/><text x="156" y="180" text-anchor="middle" fill="#FFF8F0" font-size="11.5" font-weight="700">7项填表后仅剩 59%</text>
      <rect x="108" y="204" width="96" height="28" rx="6" fill="#6D1E29"/><text x="156" y="222" text-anchor="middle" fill="#FFF8F0" font-size="11.5" font-weight="700">最终激活 31%</text>
      <text x="48" y="284" fill="#AD1B24" font-size="12" font-weight="700">核心症结：未先给价值就索要资质</text>
      <circle cx="304" cy="196" r="14" fill="#E1C4A7" stroke="#6D1E29" stroke-width="1.5"/><text x="304" y="200" text-anchor="middle" fill="#6D1E29" font-size="14" font-weight="700">→</text>
      <rect x="324" y="68" width="288" height="258" rx="14" fill="#6D1E29"/>
      <text x="344" y="96" fill="#F0D6BC" font-size="13" font-weight="900">02 渐进式重构方案 · 54%</text>
      <rect x="344" y="122" width="248" height="44" rx="8" fill="rgba(255,248,240,0.12)"/><text x="358" y="148" fill="#FFF8F0" font-size="12.5" font-weight="700">① 仅手机号登录，3 秒进沙箱体验</text>
      <rect x="344" y="178" width="248" height="44" rx="8" fill="rgba(255,248,240,0.12)"/><text x="358" y="204" fill="#FFF8F0" font-size="12.5" font-weight="700">② 企业实名延后至首次发布前</text>
      <rect x="344" y="236" width="248" height="48" rx="8" fill="#EEDBC8"/><text x="358" y="264" fill="#380D14" font-size="13" font-weight="900">③ OCR 回填，首次可用压至 30 秒内</text>
    </svg>`,
  },
  pillars: {
    title: "双引擎并列阐述：两项战略同等重要，但拒绝双深撞车",
    notes: [
      "改稿前把左右两块都涂满深色高饱和实底，两卡互抢视觉焦点，整页沉重压抑。",
      "改稿后严格 50:50 等宽表示战略并行，同时以浅米配深酒红区分「存量基本盘」与「新增第二曲线」。",
      "双卡内部保持完全一致的『编号 + 一句定位 + 三条精炼动作』结构，观众一眼扫通。",
    ],
    beforeSvg: `<svg viewBox="0 0 640 360">
      <rect width="640" height="360" fill="#F5E9E6"/>
      <text x="28" y="38" fill="#1D1315" font-size="18" font-weight="900">年度双引擎增长策略</text>
      <rect x="28" y="66" width="286" height="258" rx="12" fill="#4A1019"/>
      <text x="48" y="102" fill="#FFF8F0" font-size="15" font-weight="900">国内直营业务</text>
      <text x="48" y="142" fill="#F2DAD1" font-size="12">• 存量门店翻新与会员复购深耕</text>
      <text x="48" y="172" fill="#F2DAD1" font-size="12">• 供应链标准件集中采购降本</text>
      <rect x="326" y="66" width="286" height="258" rx="12" fill="#4A1019"/>
      <text x="346" y="102" fill="#FFF8F0" font-size="15" font-weight="900">海外加盟扩张</text>
      <text x="346" y="142" fill="#F2DAD1" font-size="12">• 东南亚样板店模型输出</text>
      <text x="346" y="172" fill="#F2DAD1" font-size="12">• 区域合伙人轻资产授权</text>
      <text x="320" y="294" text-anchor="middle" fill="#FF9494" font-size="13" font-weight="800">× 双全深底互抢，中缝仅 12px 且整页发闷</text>
    </svg>`,
    afterSvg: `<svg viewBox="0 0 640 360">
      <rect width="640" height="360" fill="#FCEEEB"/>
      <text x="28" y="38" fill="#1D1315" font-size="18" font-weight="900">稳固国内现金流，以轻资产模式撬动海外增量</text>
      <rect x="28" y="48" width="38" height="2.5" fill="#6D1E29"/>
      <rect x="28" y="68" width="272" height="258" rx="14" fill="#FFF8F0" stroke="#D9C3AD" stroke-width="1.5"/>
      <circle cx="56" cy="98" r="14" fill="#6D1E29"/><text x="56" y="103" text-anchor="middle" fill="#FFF8F0" font-size="12" font-weight="700">01</text>
      <text x="80" y="103" fill="#1D1315" font-size="15" font-weight="900">国内直营（基本盘）</text>
      <line x1="46" y1="126" x2="280" y2="126" stroke="#D9C3AD"/>
      <text x="46" y="160" fill="#1D1315" font-size="13">• 存量门店翻新，同店复购 +12%</text>
      <text x="46" y="198" fill="#1D1315" font-size="13">• 供应链集采压降原料成本 8%</text>
      <text x="46" y="236" fill="#1D1315" font-size="13">• 贡献全年 70% 稳定现金流</text>
      <circle cx="320" cy="196" r="14" fill="#E1C4A7" stroke="#6D1E29" stroke-width="1.5"/><text x="320" y="201" text-anchor="middle" fill="#6D1E29" font-size="16" font-weight="700">+</text>
      <rect x="340" y="68" width="272" height="258" rx="14" fill="#6D1E29"/>
      <circle cx="368" cy="98" r="14" fill="#E1C4A7"/><text x="368" y="103" text-anchor="middle" fill="#6D1E29" font-size="12" font-weight="700">02</text>
      <text x="392" y="103" fill="#FFF8F0" font-size="15" font-weight="900">海外加盟（新曲线）</text>
      <line x1="358" y1="126" x2="592" y2="126" stroke="rgba(240,214,188,0.35)"/>
      <text x="358" y="160" fill="#FFF8F0" font-size="13">• 东南亚首期落地 15 家样板店</text>
      <text x="358" y="198" fill="#FFF8F0" font-size="13">• 轻资产授权，单店回本缩至 9 月</text>
      <text x="358" y="236" fill="#EEDBC8" font-size="13" font-weight="700">• 撬动次年增量营收占比 30%</text>
    </svg>`,
  },
  ruleCase: {
    title: "原则定义 + 落地案例：左深锚定抽象规则，右浅展出真实标本",
    notes: [
      "改稿前把原则定义居中大字堆满上半页，案例塞成底下扁条，观众看不清前后对应。",
      "改稿后采用「左深酒红 46% 锚定原则 + 右暖米 54% 展开图示标本」的左重反拍解。",
      "两种不同媒介（文字口诀 + 视觉标本）靠齐顶基准与等量留白达成自然视觉平衡。",
    ],
    beforeSvg: `<svg viewBox="0 0 640 360">
      <rect width="640" height="360" fill="#F5E9E6"/>
      <text x="320" y="42" text-anchor="middle" fill="#1D1315" font-size="18" font-weight="900">什么是渐进式信息披露</text>
      <text x="320" y="96" text-anchor="middle" fill="#594145" font-size="13">在用户需要的时候才展示次级选项，避免首屏认知超载，提高首次任务完成率</text>
      <text x="320" y="122" text-anchor="middle" fill="#594145" font-size="13">同时保持高级入口可发现，不把高频操作藏进三层以上折叠菜单里</text>
      <rect x="44" y="164" width="552" height="148" rx="8" fill="#FFFFFF" stroke="#CFAFA8"/>
      <text x="320" y="242" text-anchor="middle" fill="#AD1B24" font-size="13" font-weight="800">× 居中长文与底部扁盒割裂，看不出原则如何落到界面</text>
    </svg>`,
    afterSvg: `<svg viewBox="0 0 640 360">
      <rect width="640" height="360" fill="#FCEEEB"/>
      <text x="28" y="38" fill="#1D1315" font-size="18" font-weight="900">渐进式披露：首屏只留主路径，次级项按需展开</text>
      <rect x="28" y="48" width="38" height="2.5" fill="#6D1E29"/>
      <rect x="28" y="68" width="256" height="258" rx="14" fill="#6D1E29"/>
      <text x="48" y="98" fill="#F0D6BC" font-size="12.5" font-weight="800">01 设计原则（左深锚定）</text>
      <text x="48" y="142" fill="#FFF8F0" font-size="15" font-weight="900">首屏 80% 高频动作直出</text>
      <text x="48" y="182" fill="#F2DAD1" font-size="12.5">• 低频高级参数收进折叠区</text>
      <text x="48" y="214" fill="#F2DAD1" font-size="12.5">• 展开不离开当前任务上下文</text>
      <text x="48" y="246" fill="#F2DAD1" font-size="12.5">• 减少新手首屏决策摩擦</text>
      <circle cx="304" cy="196" r="14" fill="#E1C4A7" stroke="#6D1E29" stroke-width="1.5"/><text x="304" y="201" text-anchor="middle" fill="#6D1E29" font-size="16" font-weight="700">+</text>
      <rect x="324" y="68" width="288" height="258" rx="14" fill="#FFF8F0" stroke="#D9C3AD" stroke-width="1.5"/>
      <text x="344" y="98" fill="#6D1E29" font-size="12.5" font-weight="800">02 落地标本（导出弹窗改版）</text>
      <rect x="344" y="118" width="248" height="122" rx="10" fill="#FDE7E3" stroke="#E0C1B9"/>
      <rect x="360" y="136" width="110" height="28" rx="6" fill="#6D1E29"/><text x="415" y="154" text-anchor="middle" fill="#FFF8F0" font-size="11.5" font-weight="700">一键导出 PDF</text>
      <rect x="482" y="136" width="92" height="28" rx="6" fill="#FFF8F0" stroke="#D9C3AD"/><text x="528" y="154" text-anchor="middle" fill="#594145" font-size="11">高级设置 ▼</text>
      <text x="360" y="198" fill="#594145" font-size="11.5">出血线 / CMYK / 压缩率默认收起</text>
      <text x="344" y="274" fill="#155A3E" font-size="12.5" font-weight="800">实测结果：新用户导出耗时缩短 42%</text>
    </svg>`,
  },
};

const curtainBefore = $("#curtain-before");
const curtainAfter = $("#curtain-after");
const curtainDivider = $("#curtain-divider");
const curtainRange = $("#curtain-range");
const curtainNotes = $("#curtain-notes");

function setCurtainPos(pct) {
  curtainBefore.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
  curtainDivider.style.left = `${pct}%`;
}
function setScenario(key) {
  const s = SCENARIOS[key];
  curtainBefore.innerHTML = s.beforeSvg;
  curtainAfter.innerHTML = s.afterSvg;
  curtainNotes.innerHTML = `<h3>${s.title}</h3><ol class="cn-list">${s.notes
    .map((n, i) => `<li><span class="cn-idx">${i + 1}</span><span>${n}</span></li>`)
    .join("")}</ol>`;
  $$(".sc-tab").forEach((b) => b.classList.toggle("is-active", b.dataset.sc === key));
}
curtainRange.addEventListener("input", () => setCurtainPos(Number(curtainRange.value)));
$$(".sc-tab").forEach((b) => b.addEventListener("click", () => setScenario(b.dataset.sc)));
setScenario("chart");
setCurtainPos(52);

// ==================== 6. SECTION 05: TRIAGE CARDS ====================
const TRIAGE_ANSWERS = [
  {
    expect: "avoid",
    msg: "更推荐换用 <a href=\"https://layout.xiaoxiaodong.ai/339/play/\" target=\"_blank\" rel=\"noopener\">339 比较幻灯片版式</a>（<code>twoTxTwoObj</code>）。逐项打分对比需要两栏各自带固定的子标题头槽与对齐行格，而 338 偏重共享大标题下的互补双块。",
  },
  {
    expect: "avoid",
    msg: "不要为了填满两栏硬拆一条连续链条！请退回 <a href=\"https://layout.xiaoxiaodong.ai/336/play/\" target=\"_blank\" rel=\"noopener\">336 标题和内容</a> 做单向流程轴，或把 6 步精简成 3 个阶段。",
  },
  {
    expect: "use",
    msg: "正是 338 两项内容的黄金主场！左卡用数据图呈证据、右卡用深酒红收口三条动作，共用一句总标题，信息独立又逻辑并行。",
  },
  {
    expect: "avoid",
    msg: "高情绪单图与金句会被双卡容器切碎冲击力。这类页面交给 <a href=\"https://layout.xiaoxiaodong.ai/343/play/\" target=\"_blank\" rel=\"noopener\">343 图片与标题说明</a>、<a href=\"https://layout.xiaoxiaodong.ai/340/play/\" target=\"_blank\" rel=\"noopener\">340 仅标题</a> 或 <a href=\"https://layout.xiaoxiaodong.ai/341/play/\" target=\"_blank\" rel=\"noopener\">341 空白</a> 更有力量。",
  },
];

$$(".triage-card").forEach((card) => {
  const idx = Number(card.dataset.triage);
  const ans = TRIAGE_ANSWERS[idx];
  const stEl = $(`#tr-st-${idx}`);
  const fbEl = $(`#tr-fb-${idx}`);
  card.querySelectorAll(".tr-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.pick;
      const ok = pick === ans.expect;
      card.querySelectorAll(".tr-btn").forEach((b) => b.classList.toggle("is-picked", b === btn));
      stEl.textContent = ok ? "判断准确" : "可以再想一步";
      stEl.className = `triage-state ${ok ? "is-right" : "is-wrong"}`;
      fbEl.hidden = false;
      fbEl.innerHTML = `${ok ? "<strong>✓ 选对了：</strong>" : "<strong>提示：</strong>"}${ans.msg}`;
    });
  });
});

// ==================== 7. SECTION 06: SINGLE-VARIABLE STUDIO QUIZ ====================
function miniSlideSvg({ w1, gap, dy, tone1, tone2 }) {
  // Logical 320x180 miniature slide differing strictly in the tested variable
  const x0 = 16;
  const avail = 288 - gap;
  const cw1 = Math.round((avail * w1) / 100);
  const cw2 = avail - cw1;
  const y1 = 44;
  const y2 = 44 + dy;
  const ch = 120;
  const fillOf = (t) => (t === "dark" ? "#6D1E29" : t === "cream" ? "#FFF8F0" : t === "bare" ? "none" : "#F3E4DE");
  const strokeOf = (t) => (t === "bare" ? "#D0AFA8" : t === "dark" ? "#52131C" : "#D9C3AD");
  const inkOf = (t) => (t === "dark" ? "#FFF8F0" : "#1D1315");
  const subOf = (t) => (t === "dark" ? "#F0D6BC" : "#6D1E29");
  const dash1 = tone1 === "bare" ? 'stroke-dasharray="3 3"' : "";
  const dash2 = tone2 === "bare" ? 'stroke-dasharray="3 3"' : "";

  return `<svg viewBox="0 0 320 180" aria-hidden="true">
    <rect width="320" height="180" fill="#FCEEEB"/>
    <rect x="16" y="14" width="150" height="9" rx="2.5" fill="#1D1315"/>
    <rect x="16" y="28" width="28" height="2" fill="#6D1E29"/>
    <rect x="${x0}" y="${y1}" width="${cw1}" height="${ch}" rx="7" fill="${fillOf(tone1)}" stroke="${strokeOf(tone1)}" stroke-width="1.2" ${dash1}/>
    <circle cx="${x0 + 16}" cy="${y1 + 17}" r="6.5" fill="${subOf(tone1)}"/>
    <rect x="${x0 + 27}" y="${y1 + 13}" width="${Math.min(58, cw1 - 36)}" height="6" rx="2" fill="${inkOf(tone1)}"/>
    <rect x="${x0 + 12}" y="${y1 + 42}" width="${Math.max(18, cw1 * 0.16)}" height="32" rx="2" fill="${tone1 === "dark" ? "#E1C4A7" : "#D9C3AD"}"/>
    <rect x="${x0 + 16 + Math.max(18, cw1 * 0.16)}" y="${y1 + 32}" width="${Math.max(18, cw1 * 0.16)}" height="42" rx="2" fill="${tone1 === "dark" ? "#F0D6BC" : "#6D1E29"}"/>
    <rect x="${x0 + 12}" y="${y1 + 86}" width="${Math.max(30, cw1 - 26)}" height="4.5" rx="2" fill="${inkOf(tone1)}" opacity="0.78"/>
    <rect x="${x0 + 12}" y="${y1 + 98}" width="${Math.max(24, cw1 - 40)}" height="4.5" rx="2" fill="${inkOf(tone1)}" opacity="0.78"/>
    <rect x="${x0 + cw1 + gap}" y="${y2}" width="${cw2}" height="${ch}" rx="7" fill="${fillOf(tone2)}" stroke="${strokeOf(tone2)}" stroke-width="1.2" ${dash2}/>
    <circle cx="${x0 + cw1 + gap + 16}" cy="${y2 + 17}" r="6.5" fill="${subOf(tone2)}"/>
    <rect x="${x0 + cw1 + gap + 27}" y="${y2 + 13}" width="${Math.min(54, Math.max(16, cw2 - 36))}" height="6" rx="2" fill="${inkOf(tone2)}"/>
    <rect x="${x0 + cw1 + gap + 12}" y="${y2 + 42}" width="${Math.max(24, cw2 - 26)}" height="5" rx="2" fill="${inkOf(tone2)}" opacity="0.88"/>
    <rect x="${x0 + cw1 + gap + 12}" y="${y2 + 58}" width="${Math.max(22, cw2 - 34)}" height="5" rx="2" fill="${inkOf(tone2)}" opacity="0.82"/>
    <rect x="${x0 + cw1 + gap + 12}" y="${y2 + 74}" width="${Math.max(20, cw2 - 42)}" height="5" rx="2" fill="${inkOf(tone2)}" opacity="0.82"/>
    <rect x="${x0 + cw1 + gap + 12}" y="${y2 + 94}" width="${Math.max(26, cw2 - 28)}" height="6" rx="2" fill="${subOf(tone2)}"/>
  </svg>`;
}

const QUIZ_ROUNDS = [
  {
    prompt: "下面四张「季度增长与提效」幻灯片的内容、条数与左浅右深配色完全相同，只差一个空间结构变量。哪一张最符合两项内容版式的阅读效率？",
    correct: 1,
    options: [
      {
        letter: "方案 A",
        spec: "50:50 · 缝 3px · ΔY 0",
        svg: miniSlideSvg({ w1: 50, gap: 3, dy: 0, tone1: "cream", tone2: "dark" }),
        reason: "方案 A 看似齐整，但中缝被压到极窄（约 3px 示意），远小于正文行距，观众横扫时视线容易直接跨缝撞进右栏。",
      },
      {
        letter: "方案 B",
        spec: "54:46 · 缝 16px · ΔY 0",
        svg: miniSlideSvg({ w1: 54, gap: 16, dy: 0, tone1: "cream", tone2: "dark" }),
        reason: "选对了！方案 B 给左图留出 54% 宽裕画布，右卡 46% 靠深酒红收口结论、光学配重恰好持平，同时保持清晰呼吸中缝与零错牙齐顶基准。",
      },
      {
        letter: "方案 C",
        spec: "54:46 · 缝 16px · 右降 14px",
        svg: miniSlideSvg({ w1: 54, gap: 16, dy: 14, tone1: "cream", tone2: "dark" }),
        reason: "方案 C 的宽比与中缝都合适，但右卡顶线整体掉低了一截，破坏了左右水平起跑线的平行秩序。",
      },
      {
        letter: "方案 D",
        spec: "72:28 · 缝 16px · ΔY 0",
        svg: miniSlideSvg({ w1: 72, gap: 16, dy: 0, tone1: "cream", tone2: "dark" }),
        reason: "方案 D 把右栏挤窄到 28%，要点行宽被压成碎条，两项内容的独立并行感荡然无存。",
      },
    ],
  },
  {
    prompt: "进阶题：下面四张幻灯片的宽比（52:48）、中缝与顶线对齐完全相同，只差卡片表面明暗处理这一个变量。哪一张的主次层级最清晰？",
    correct: 2,
    options: [
      {
        letter: "方案 A",
        spec: "双无界裸排",
        svg: miniSlideSvg({ w1: 52, gap: 16, dy: 0, tone1: "bare", tone2: "bare" }),
        reason: "方案 A 两栏都没有清晰容器边界与明暗区分，远距离投影时模块边界模糊且缺少视线锚点。",
      },
      {
        letter: "方案 B",
        spec: "双全深酒红",
        svg: miniSlideSvg({ w1: 52, gap: 16, dy: 0, tone1: "dark", tone2: "dark" }),
        reason: "方案 B 左右两卡同时铺满高饱和深酒红，双双高声抢戏，整页沉重压抑且抹平了主次层次。",
      },
      {
        letter: "方案 C",
        spec: "左暖米 + 右深酒红",
        svg: miniSlideSvg({ w1: 52, gap: 16, dy: 0, tone1: "cream", tone2: "dark" }),
        reason: "选对了！正如 338 原海报所示，一浅一深既清晰划出双模块独立边界，又一眼建立「左读证据 → 右落重点」的视觉主次。",
      },
      {
        letter: "方案 D",
        spec: "左浅米 + 右无界裸排",
        svg: miniSlideSvg({ w1: 52, gap: 16, dy: 0, tone1: "cream", tone2: "bare" }),
        reason: "方案 D 右栏去掉了容器衬底，虽然区分出了左右，但右半页视觉分量过轻且边界松散，导致左重右飘。",
      },
    ],
  },
];

const quizGrid = $("#quiz-grid");
const quizFeedback = $("#quiz-feedback");
const quizPrompt = $("#quiz-prompt");
let currentRound = 0;

function renderQuiz(roundIdx) {
  currentRound = roundIdx;
  const r = QUIZ_ROUNDS[roundIdx];
  quizPrompt.textContent = r.prompt;
  quizFeedback.hidden = true;
  quizGrid.innerHTML = "";
  $$(".qr-btn").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.q) === roundIdx));

  r.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-opt";
    btn.innerHTML = `<div class="qo-head"><span class="qo-letter">${opt.letter}</span><span class="qo-spec">${opt.spec}</span></div>${opt.svg}`;
    btn.addEventListener("click", () => {
      const ok = i === r.correct;
      $$(".quiz-opt").forEach((el, idx) => {
        el.classList.remove("is-correct", "is-wrong");
        if (idx === r.correct) el.classList.add("is-correct");
        else if (idx === i && !ok) el.classList.add("is-wrong");
      });
      quizFeedback.hidden = false;
      quizFeedback.innerHTML = `<h3>${ok ? `✓ 回答正确（${opt.letter}）` : `× 你选了 ${opt.letter}，更佳答案是 ${r.options[r.correct].letter}`}</h3><p>${opt.reason}${ok ? "" : ` ${r.options[r.correct].reason}`}</p>`;
    });
    quizGrid.appendChild(btn);
  });
}
$$(".qr-btn").forEach((b) => b.addEventListener("click", () => renderQuiz(Number(b.dataset.q))));
renderQuiz(0);

// ==================== 8. SECTION 07: POSTER LIGHTBOX ====================
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const posterImg = $("#poster");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  $("#lb-reset").textContent = `${Math.round(lbScale * 100)}%`;
}
function openLightbox() {
  lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  $("#lb-close").focus();
}
function closeLightbox() {
  lightbox.hidden = true;
}

$("#poster-open").addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-in").addEventListener("click", () => {
  lbScale = Math.min(3.5, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
$("#lb-out").addEventListener("click", () => {
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
  const delta = e.deltaY < 0 ? 0.18 : -0.18;
  lbScale = Math.max(0.6, Math.min(3.5, +(lbScale + delta).toFixed(2)));
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) {
    closeLightbox();
    return;
  }
  lbDrag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: lbX, oy: lbY };
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag || e.pointerId !== lbDrag.id) return;
  lbX = lbDrag.ox + (e.clientX - lbDrag.sx);
  lbY = lbDrag.oy + (e.clientY - lbDrag.sy);
  applyLbTransform();
});
const endLb = () => { lbDrag = null; };
lbStage.addEventListener("pointerup", endLb);
lbStage.addEventListener("pointercancel", endLb);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

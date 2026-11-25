// 035 Z形构图 — 主入口：连接开场 Z 轨眼动编排台与七大交互小节

import { loop } from "../../lib/stage.js";
import {
  clamp,
  cloneState,
  evaluate,
  HSPAN_MAX,
  HSPAN_MIN,
  INITIAL_STATE,
  PRESETS,
  SPAN_MAX,
  SPAN_MIN,
  zeroOffsets,
} from "./model.js";
import { createHeroCanvas } from "./hero-canvas.js";
import { BRIDGE_MODES, createBridgeCanvas } from "./bridge-canvas.js";

// =========================================================================
// 1. 开场：Z 轨眼动编排台（单真源同步到画布、刊头大Z、诊单、控槽与底沿四栏框）
// =========================================================================
const state = cloneState(INITIAL_STATE);

const els = {
  canvas: document.getElementById("hero-canvas"),
  titleZ: document.getElementById("title-z"),
  topStatus: document.getElementById("top-status"),
  diagStrip: document.getElementById("diag-strip"),
  diagBadge: document.getElementById("diag-badge"),
  diagHeadline: document.getElementById("diag-headline"),
  diagBody: document.getElementById("diag-body"),
  diagNext: document.getElementById("diag-next"),
  mSpan: document.getElementById("m-span"),
  mAngle: document.getElementById("m-angle"),
  mGaze: document.getElementById("m-gaze"),
  mTier: document.getElementById("m-tier"),
  rngSpan: document.getElementById("rng-span"),
  valSpan: document.getElementById("val-span"),
  rngHeight: document.getElementById("rng-height"),
  valHeight: document.getElementById("val-height"),
  btnOrder: document.getElementById("btn-fix-order"),
  btnBridge: document.getElementById("btn-bridge"),
  btnDistractor: document.getElementById("btn-distractor"),
  btnWeight: document.getElementById("btn-weight"),
  btnDensity: document.getElementById("btn-density"),
  btnGaze: document.getElementById("btn-gaze"),
  posterBar: document.getElementById("poster-bar"),
};

let heroLoop = null;

function syncHeroUI() {
  const ev = evaluate(state);

  // 刊头大 Z 随实时对角倾角呼应微斜
  const skew = clamp((ev.diagAngle - 50) * 0.22 - 6, -14, 4);
  els.titleZ.style.setProperty("--z-skew", `${skew.toFixed(1)}deg`);

  // 顶部状态胶囊
  els.topStatus.textContent = ev.passCount === 4 ? "4 / 4 贯通达标" : `${ev.passCount} / 4 待贯通`;
  els.topStatus.classList.toggle("is-ok", ev.passCount === 4);
  els.topStatus.classList.toggle("is-err", ev.passCount < 4);

  // 白话单真源诊单
  els.diagStrip.classList.toggle("is-pass", ev.passCount === 4);
  els.diagBadge.textContent = ev.tag;
  els.diagBadge.classList.toggle("is-ok", ev.passCount === 4);
  els.diagBadge.classList.toggle("is-err", ev.passCount < 4);
  els.diagHeadline.textContent = ev.headline;
  els.diagBody.textContent = ev.body;
  els.diagNext.textContent = `下一步：${ev.nextStep}`;

  // 四项单真源读数
  els.mSpan.textContent = `${Math.round(ev.effectiveSpan * 100)}%`;
  els.mAngle.textContent = `${ev.diagAngle}°`;
  els.mGaze.textContent = ev.gazeLabel;
  els.mTier.textContent = ev.fluencyTier;

  // 同步滑杆与快捷按钮状态
  const spanPct = Math.round(state.span * 100);
  const hPct = Math.round(state.heightSpan * 100);
  els.rngSpan.value = String(spanPct);
  els.valSpan.textContent = `${spanPct}%`;
  els.rngHeight.value = String(hPct);
  els.valHeight.textContent = `${hPct}%`;

  const orderBad = !ev.entryAtStart || !ev.ctaAtEnd;
  els.btnOrder.textContent = orderBad ? "归正首尾顺序" : "试错：倒置首尾";
  els.btnOrder.classList.toggle("is-urgent", orderBad);

  els.btnBridge.textContent = state.bridge ? "断开对角桥（试错）" : "接通对角桥";
  els.btnBridge.classList.toggle("is-urgent", !state.bridge);

  els.btnDistractor.textContent = state.distractor ? "清场中路干扰" : "加中路干扰（试错）";
  els.btnDistractor.classList.toggle("is-urgent", state.distractor);

  const wMap = { graded: "梯次：梯度", equal: "梯次：平权（错）", weak_end: "梯次：弱终点（错）" };
  els.btnWeight.textContent = wMap[state.weightMode];
  els.btnWeight.classList.toggle("is-urgent", state.weightMode !== "graded");

  els.btnDensity.textContent = state.textLoad === "sparse" ? "密度：稀疏" : "密度：密集 F（错）";
  els.btnDensity.classList.toggle("is-urgent", state.textLoad !== "sparse");

  els.btnGaze.textContent = state.showGaze ? "眼动探针：开" : "眼动探针：关";
  els.btnGaze.setAttribute("aria-pressed", String(state.showGaze));

  // 题材按钮高亮
  document.querySelectorAll("[data-scene]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.scene === state.scene);
  });

  // 底沿原海报四栏实况框同步
  ev.checks.forEach((chk) => {
    const col = els.posterBar.querySelector(`[data-check="${chk.key}"]`);
    if (!col) return;
    col.classList.toggle("is-ok", chk.ok);
    col.classList.toggle("is-err", !chk.ok);
    const pill = col.querySelector(".pbar-state");
    if (pill) {
      pill.textContent = chk.badge;
      pill.classList.toggle("is-ok", chk.ok);
      pill.classList.toggle("is-err", !chk.ok);
    }
  });
}

function mutateState(fn) {
  fn(state);
  syncHeroUI();
  heroLoop?.draw();
}

const heroCanvasCtrl = createHeroCanvas(els.canvas, () => state, mutateState);
heroLoop = loop(els.canvas, (t, dt, opts) => {
  heroCanvasCtrl.render(t, dt, opts);
});

// 题材与预设事件
document.querySelectorAll("[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => {
    mutateState((s) => { s.scene = btn.dataset.scene; });
  });
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    mutateState((s) => {
      if (p.scene) s.scene = p.scene;
      s.span = p.span;
      s.heightSpan = p.heightSpan;
      s.roles = [...p.roles];
      s.bridge = p.bridge;
      s.distractor = p.distractor;
      s.weightMode = p.weightMode;
      s.textLoad = p.textLoad;
      s.showGaze = p.showGaze;
      s.offsets = zeroOffsets();
    });
  });
});

els.rngSpan.addEventListener("input", () => {
  mutateState((s) => { s.span = clamp(Number(els.rngSpan.value) / 100, SPAN_MIN, SPAN_MAX); });
});

els.rngHeight.addEventListener("input", () => {
  mutateState((s) => { s.heightSpan = clamp(Number(els.rngHeight.value) / 100, HSPAN_MIN, HSPAN_MAX); });
});

els.btnOrder.addEventListener("click", () => {
  mutateState((s) => {
    if (s.roles[0] !== "entry" || s.roles[3] !== "cta") {
      s.roles = ["entry", "progress", "pivot", "cta"];
      s.offsets = zeroOffsets();
    } else {
      s.roles = ["cta", "progress", "pivot", "entry"];
    }
  });
});

els.btnBridge.addEventListener("click", () => {
  mutateState((s) => { s.bridge = !s.bridge; });
});

els.btnDistractor.addEventListener("click", () => {
  mutateState((s) => { s.distractor = !s.distractor; });
});

els.btnWeight.addEventListener("click", () => {
  const order = ["graded", "equal", "weak_end"];
  mutateState((s) => {
    s.weightMode = order[(order.indexOf(s.weightMode) + 1) % order.length];
  });
});

els.btnDensity.addEventListener("click", () => {
  mutateState((s) => {
    s.textLoad = s.textLoad === "sparse" ? "dense" : "sparse";
  });
});

els.btnGaze.addEventListener("click", () => {
  mutateState((s) => { s.showGaze = !s.showGaze; });
});

// 画布键盘操控
els.canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    mutateState((s) => { s.span = clamp(s.span + 0.04, SPAN_MIN, SPAN_MAX); });
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    mutateState((s) => { s.span = clamp(s.span - 0.04, SPAN_MIN, SPAN_MAX); });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    mutateState((s) => { s.heightSpan = clamp(s.heightSpan + 0.04, HSPAN_MIN, HSPAN_MAX); });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    mutateState((s) => { s.heightSpan = clamp(s.heightSpan - 0.04, HSPAN_MIN, HSPAN_MAX); });
  } else if (e.key === " ") {
    e.preventDefault();
    mutateState((s) => { s.distractor = !s.distractor; });
  } else if (e.key === "r" || e.key === "R") {
    e.preventDefault();
    const p = PRESETS.broken;
    mutateState((s) => Object.assign(s, cloneState(p)));
  } else if (["1", "2", "3", "4"].includes(e.key)) {
    mutateState((s) => { s.selectedSlot = Number(e.key) - 1; });
  }
});

syncHeroUI();

// =========================================================================
// 2. 01 节：四站步进剖析器
// =========================================================================
const RELAY_DATA = [
  {
    quote: "原海报说：「从左上角切入，吸引注意力，开启视觉旅程。」",
    title: "第一站：左上角抓眼，先回答「这是什么」",
    body: "从左到右阅读的观者进入画面时，视线落点天然偏向左上象限。这里适合放品牌标识、活动大标题或最抓眼的视觉符号——用极简的一眼信息锁住注意力，不要塞长篇解释。",
    weight: "次高视觉重量（经验占比约整页核心焦点的 25%–30%），干脆利落，但不喧宾夺主。",
    miss: "左上空荡或放了无关细字时，观者第一眼会到处乱找入口，整条 Z 路径无从起步。",
  },
  {
    quote: "原海报说：「沿对角线深入，信息由浅入深，层层展开，增强理解。」",
    title: "第二站：右上承接 + 对角斜桥，往下送出理由",
    body: "眼球沿顶边扫到右上角，顺手接住时间、导航或副行动入口；紧接着必须靠一条看得见或感觉得到的对角斜桥，把眼睛拉进画面中腹，展开核心卖点或主图。",
    weight: "轻快承接（右上比左上略轻一档），中段斜桥保持连贯方向，绝不塞弹窗拦路。",
    miss: "若右上过重或对角线空白无桥，眼睛看完顶栏就会直接跳去右下甚至离开页面。",
  },
  {
    quote: "原海报说：「转折处形成停顿与对比，调整节奏，强化记忆点。」",
    title: "第三站：左下顿挫，给大脑半秒消化",
    body: "左下角在古腾堡图里本来是容易被略过的「弱休止区」。Z 形构图偏偏在这里设一个转折点，用一句硬核卖点、社会证明或视觉反差让眼睛停顿一拍，把「为什么信你」补齐。",
    weight: "中等稳重（弱于首尾，强于背景），像乐句里的重拍换气，推着眼睛冲向最后一行。",
    miss: "左下角空着或内容与主题无关时，Z 形瞬间塌成「7」字，少了转折铺垫，右下行动按钮显得突兀。",
  },
  {
    quote: "原海报说：「到达终点，聚焦核心信息，留下清晰印象，促成行动。」",
    title: "第四站：右下收口，把整页势能换成行动",
    body: "经过前面三站铺垫，视线来到右下角终点区——这也是古腾堡图里的 Terminal Area。这里理应放全场对比最鲜明的购票码、主按钮或结论金句，接住全部视觉惯性。",
    weight: "全场最鲜明收口（靠高饱和主色块或清晰轮廓锁定），确保视线稳稳刹停而不滑出画框。",
    miss: "如果右下终点做得灰扑扑、字号太小，前戏白做一场，视线会顺着右下角直接溜走。",
  },
];

const relayTabs = document.querySelectorAll(".relay-tab");
const relayNodes = document.querySelectorAll("#relay-svg .rs-node");
const relaySegs = [
  document.getElementById("rs-seg1"),
  document.getElementById("rs-seg2"),
  document.getElementById("rs-seg3"),
];

function setRelayStop(idx) {
  const d = RELAY_DATA[idx] || RELAY_DATA[0];
  relayTabs.forEach((b, i) => {
    const active = i === idx;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
  relayNodes.forEach((n, i) => {
    n.classList.toggle("is-focus", i === idx);
    n.classList.toggle("is-dim", i !== idx);
  });
  relaySegs.forEach((seg, sIdx) => {
    const lit = (idx === 0 && sIdx === 0) || (idx === 1 && sIdx <= 1) || (idx === 2 && sIdx >= 1) || (idx === 3 && sIdx === 2);
    seg.setAttribute("opacity", lit ? "1" : "0.28");
  });
  document.getElementById("relay-quote").textContent = d.quote;
  document.getElementById("relay-title").textContent = d.title;
  document.getElementById("relay-body").textContent = d.body;
  document.getElementById("relay-weight").textContent = d.weight;
  document.getElementById("relay-miss").textContent = d.miss;
}

relayTabs.forEach((b) => b.addEventListener("click", () => setRelayStop(Number(b.dataset.stop))));
setRelayStop(0);

// =========================================================================
// 3. 02 节：历史模型切换 + 左→右 / 右→左阅读方向镜像器
// =========================================================================
let hModel = "gutenberg";
let isRtl = false;

const hSvg = document.getElementById("history-svg");
const hCaption = document.getElementById("hlab-caption");
const btnRtl = document.getElementById("btn-rtl");

function renderHistorySvg() {
  const X = (x) => (isRtl ? 460 - x : x);
  const dirLabel = isRtl ? "右 → 左（如阿拉伯语/希伯来语）" : "左 → 右（中文横排 / 英文）";
  let body = "";

  if (hModel === "gutenberg") {
    body = `
      <rect x="24" y="24" width="206" height="132" fill="${isRtl ? "#EFE9DF" : "#FFE7DF"}" stroke="#DDD5C7"/>
      <rect x="230" y="24" width="206" height="132" fill="${isRtl ? "#FFE7DF" : "#EFE9DF"}" stroke="#DDD5C7"/>
      <rect x="24" y="156" width="206" height="140" fill="${isRtl ? "#DCE6FF" : "#F5F1E9"}" stroke="#DDD5C7"/>
      <rect x="230" y="156" width="206" height="140" fill="${isRtl ? "#F5F1E9" : "#DCE6FF"}" stroke="#DDD5C7"/>
      <line x1="${X(70)}" y1="68" x2="${X(390)}" y2="252" stroke="#FA4718" stroke-width="5" stroke-dasharray="8 6"/>
      <circle cx="${X(70)}" cy="68" r="14" fill="#FA4718"/>
      <text x="${X(70)}" y="73" text-anchor="middle" fill="#FFF" font-size="12" font-weight="800">起</text>
      <circle cx="${X(390)}" cy="252" r="14" fill="#002B93"/>
      <text x="${X(390)}" y="257" text-anchor="middle" fill="#FFF" font-size="12" font-weight="800">终</text>
      <text x="${X(158)}" y="58" text-anchor="middle" fill="#C12B06" font-size="13" font-weight="800">主视觉区</text>
      <text x="${X(332)}" y="96" text-anchor="middle" fill="#38476B" font-size="12.5" font-weight="700">强休止区</text>
      <text x="${X(126)}" y="232" text-anchor="middle" fill="#38476B" font-size="12.5" font-weight="700">弱休止区</text>
      <text x="${X(302)}" y="274" text-anchor="middle" fill="#002B93" font-size="13" font-weight="800">终点区</text>
      <text x="230" y="312" text-anchor="middle" fill="#38476B" font-size="11.5">当前阅读方向：${dirLabel}</text>
    `;
    hCaption.innerHTML = isRtl
      ? "<strong>1956 古腾堡图（镜像反轴）</strong>：切换为右→左阅读习惯后，阅读重力从右上斜切向左下，四个象限整幅镜像翻转。"
      : "<strong>1956 古腾堡图（均质文本版面）</strong>：左上为主视觉区、右下为终点区，中间是一条斜向「阅读重力轴」；左下角若不主动加强，容易沦为弱休止区。";
  } else if (hModel === "zpattern") {
    body = `
      <rect x="24" y="24" width="412" height="272" fill="#FFFBF2" stroke="#DDD5C7" rx="4"/>
      <polyline points="${X(76)},74 ${X(384)},74 ${X(76)},236 ${X(384)},236" fill="none" stroke="#FA4718" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="${X(96)},74 ${X(364)},74 ${X(96)},236 ${X(364)},236" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="6 5"/>
      <circle cx="${X(76)}" cy="74" r="18" fill="#002B93"/><text x="${X(76)}" y="79" text-anchor="middle" fill="#FFF" font-size="13" font-weight="800">1</text>
      <circle cx="${X(384)}" cy="74" r="16" fill="#002B93"/><text x="${X(384)}" y="79" text-anchor="middle" fill="#FFF" font-size="12" font-weight="800">2</text>
      <circle cx="${X(76)}" cy="236" r="16" fill="#002B93"/><text x="${X(76)}" y="241" text-anchor="middle" fill="#FFF" font-size="12" font-weight="800">3</text>
      <circle cx="${X(384)}" cy="236" r="20" fill="#C82F08"/><text x="${X(384)}" y="241" text-anchor="middle" fill="#FFF" font-size="13" font-weight="800">4</text>
      <text x="230" y="312" text-anchor="middle" fill="#38476B" font-size="11.5">当前阅读方向：${dirLabel}</text>
    `;
    hCaption.innerHTML = isRtl
      ? "<strong>现代反 Z 轨（右→左文化）</strong>：在阿拉伯语等右向左网页与海报里，入口落右上、终点落左下，轨迹镜像成「反 Z」。"
      : "<strong>现代 Z 形轨（四站锚定）</strong>：主动在右上②与左下③安放清晰锚点并搭出斜桥，把古腾堡图里原本薄弱的左下区激活为第三拍转折。";
  } else {
    const lx = isRtl ? 404 : 56;
    const w1 = isRtl ? -320 : 320;
    const w2 = isRtl ? -210 : 210;
    const bars = [56, 78, 100, 134, 156, 178, 212, 234, 256]
      .map((y, idx) => {
        const bw = idx % 3 === 0 ? 180 : 320;
        const bx = isRtl ? 416 - bw : 44;
        return `<rect x="${bx}" y="${y}" width="${bw}" height="${idx % 3 === 0 ? 10 : 6}" rx="2" fill="${idx % 3 === 0 ? "rgba(0,43,147,0.28)" : "rgba(14,29,66,0.14)"}"/>`;
      })
      .join("");
    body = `
      <rect x="24" y="24" width="412" height="272" fill="#FFFBF2" stroke="#DDD5C7" rx="4"/>
      ${bars}
      <path d="M${lx},66 L${lx + w1},66 M${lx},66 L${lx},268 M${lx},144 L${lx + w2},144" fill="none" stroke="#B51D29" stroke-width="12" stroke-linecap="round" opacity="0.82"/>
      <text x="230" y="312" text-anchor="middle" fill="#38476B" font-size="11.5">当前阅读方向：${dirLabel}</text>
    `;
    hCaption.innerHTML = isRtl
      ? "<strong>2006 NN/g 密集文本（镜像反 F）</strong>：右向左语言的密集文章会贴着右边缘扫描，形成反 F 扫视——同样不会走出斜对角。"
      : "<strong>2006 NN/g 密集文本 F 形扫视</strong>：字一多，眼睛就在前两行横扫后直接顺着左缘速降，右下角几乎成为盲区——这是 Z 形失效的典型分水岭。";
  }
  hSvg.innerHTML = body;
}

document.querySelectorAll("[data-hmodel]").forEach((btn) => {
  btn.addEventListener("click", () => {
    hModel = btn.dataset.hmodel;
    document.querySelectorAll("[data-hmodel]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderHistorySvg();
  });
});

btnRtl.addEventListener("click", () => {
  isRtl = !isRtl;
  btnRtl.setAttribute("aria-pressed", String(isRtl));
  btnRtl.textContent = isRtl ? "阅读方向：右 → 左（镜像）" : "阅读方向：左 → 右";
  renderHistorySvg();
});

renderHistorySvg();

// =========================================================================
// 4. 03 节：深钴暗室对角视觉桥实验台
// =========================================================================
const bridgeCfg = { mode: "none", glance: true };
const bridgeCanvas = document.getElementById("bridge-canvas");
const bridgeCtrl = createBridgeCanvas(bridgeCanvas, () => bridgeCfg);
const bridgeLoop = loop(bridgeCanvas, (t, dt, opts) => bridgeCtrl.render(t, dt, opts));

function syncBridgeUI() {
  const info = BRIDGE_MODES[bridgeCfg.mode];
  const verdictEl = document.getElementById("bridge-verdict");
  verdictEl.textContent = info.verdict;
  verdictEl.classList.toggle("is-ok", info.pullsBack);
  verdictEl.classList.toggle("is-err", !info.pullsBack);
  document.getElementById("bridge-title").textContent = `${info.label}：${info.pullsBack ? "稳稳拉回左下角" : "眼睛不愿逆向回头"}`;
  document.getElementById("bridge-desc").textContent = info.desc;
  document.querySelectorAll("[data-bmode]").forEach((b) => b.classList.toggle("is-active", b.dataset.bmode === bridgeCfg.mode));
  const btnGlance = document.getElementById("btn-glance");
  btnGlance.setAttribute("aria-pressed", String(bridgeCfg.glance));
  btnGlance.textContent = bridgeCfg.glance ? "2 秒一瞥聚光：开" : "2 秒一瞥聚光：关";
  bridgeLoop.draw();
}

document.querySelectorAll("[data-bmode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    bridgeCfg.mode = btn.dataset.bmode;
    syncBridgeUI();
  });
});
document.getElementById("btn-glance").addEventListener("click", () => {
  bridgeCfg.glance = !bridgeCfg.glance;
  syncBridgeUI();
});
syncBridgeUI();

// =========================================================================
// 5. 04 节：字数密度连续变态滑杆（Z -> 临界 -> F）
// =========================================================================
const rngWords = document.getElementById("rng-words");
const valWords = document.getElementById("val-words");
const dcMode = document.getElementById("dc-mode");
const densitySvg = document.getElementById("density-svg");
const densityNote = document.getElementById("density-note");

function renderDensity() {
  const words = Number(rngWords.value);
  valWords.textContent = String(words);
  const fRatio = clamp((words - 80) / 300, 0, 1);

  if (fRatio < 0.28) {
    dcMode.textContent = "清爽 Z 形路径";
    dcMode.className = "dc-mode is-z";
    densityNote.textContent = `约 ${words} 字：四块信息留足呼吸空白，眼睛轻松沿「左上→右上→对角→右下」走完一圈，右下按钮清晰可见。`;
  } else if (fRatio < 0.68) {
    dcMode.textContent = "临界拉扯（Z 开始瓦解）";
    dcMode.className = "dc-mode is-mid";
    densityNote.textContent = `约 ${words} 字：中段正文变密，对角斜线被文字行切碎，读者开始贴左侧跳读小标题，右下角关注度明显衰减。`;
  } else {
    dcMode.textContent = "已塌缩为左缘 F 形扫视";
    dcMode.className = "dc-mode is-f";
    densityNote.textContent = `约 ${words} 字：面对整墙文字，眼睛自动切入高效检索模式——扫完顶行就顺左缘直落，右下角按钮几乎被彻底忽略。`;
  }

  // 生成随字数递增的文本模拟条
  const lineCount = Math.round(2 + fRatio * 10);
  let textBars = "";
  for (let i = 0; i < lineCount; i++) {
    const y = 78 + i * (160 / Math.max(4, lineCount));
    const isSub = i % 3 === 0;
    const w = isSub ? 190 : 380 + ((i * 37) % 150);
    textBars += `<rect x="46" y="${y.toFixed(1)}" width="${w}" height="${isSub ? 8 : 5}" rx="2" fill="${isSub ? "rgba(0,43,147,0.28)" : "rgba(14,29,66,0.14)"}"/>`;
  }

  const zOp = (1 - fRatio).toFixed(2);
  const fOp = fRatio.toFixed(2);
  const ctaDim = (1 - fRatio * 0.65).toFixed(2);

  densitySvg.innerHTML = `
    <rect x="18" y="14" width="644" height="252" rx="6" fill="#FFFBF2" stroke="#DDD5C7"/>
    <!-- 顶部品牌与导航 -->
    <rect x="46" y="34" width="128" height="22" rx="4" fill="#002B93"/>
    <rect x="524" y="38" width="108" height="14" rx="3" fill="#DDD5C7"/>
    ${textBars}
    <!-- 右下 CTA -->
    <rect x="514" y="210" width="118" height="36" rx="5" fill="#C82F08" opacity="${ctaDim}"/>
    <text x="573" y="233" text-anchor="middle" fill="#FFFFFF" font-size="13" font-weight="800" opacity="${ctaDim}">右下主按钮</text>
    <!-- Z 路径渐变淡出（终点优雅停在按钮左沿外侧，绝不遮盖按钮字） -->
    <g opacity="${zOp}">
      <polyline points="110,45 578,45 104,228 498,228" fill="none" stroke="#FA4718" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="110,45 578,45 104,228 494,228" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="6 5"/>
      <circle cx="496" cy="228" r="11" fill="#0B6B68"/>
      <text x="496" y="232" text-anchor="middle" fill="#FFF" font-size="11" font-weight="800">Z</text>
    </g>
    <!-- F 路径渐变浮现 -->
    <g opacity="${fOp}">
      <path d="M58,45 L560,45 M58,45 L58,244 M58,128 L340,128" fill="none" stroke="#B51D29" stroke-width="12" stroke-linecap="round" opacity="0.82"/>
      <circle cx="58" cy="244" r="11" fill="#B51D29"/>
      <text x="58" y="248" text-anchor="middle" fill="#FFF" font-size="11" font-weight="800">F</text>
    </g>
  `;
}

rngWords.addEventListener("input", renderDensity);
renderDensity();

// =========================================================================
// 6. 05 节：6 张真实项目派单分诊卡
// =========================================================================
document.querySelectorAll(".triage-card").forEach((card) => {
  card.addEventListener("click", () => {
    const open = card.classList.toggle("is-open");
    card.setAttribute("aria-expanded", String(open));
  });
});

// =========================================================================
// 7. 06 节：单变量四选一小练习
// =========================================================================
const QUIZ_REASONS = {
  A: "选了 A — 这一版踩中了「四站平权」。四个角落用了一模一样的面积和高饱和红块，谁都在喊「先看我」，眼睛会在四角之间反复打乒乓，形不成先后递进。",
  B: "答对了，就是 B！四站拉开了清晰的轻重梯度：左上大标抓眼 → 右上日期轻承接 → 中段乐手与萨克斯斜向把视线稳稳带回左下「四重奏首演」停顿一拍 → 最后由右下唯一的高饱和购票块稳稳收口。",
  C: "选了 C — 和 B 相比只多了一张压在斜桥正中的「全场限时 8 折」高饱和促销爆签。它把对角通道拦腰截断，路人视线刚滑进中央就被截胡打转，反而妨碍顺利走到底部购票区。",
  D: "选了 D — 这一版踩中了「断桥跳角成 7 字」。斜线从左上直坠右下，左下角完全留空、看点全挤到右侧竖排，视线从左上→右上直接垂直掉到右下，第三拍转折和呼吸空间全没了。",
};

const quizCards = document.querySelectorAll(".quiz-card");
const quizFeedback = document.getElementById("quiz-feedback");

quizCards.forEach((card) => {
  card.addEventListener("click", () => {
    const opt = card.dataset.opt;
    const right = opt === "B";
    quizCards.forEach((c) => {
      const isSelected = c === card;
      c.setAttribute("aria-pressed", String(isSelected));
      c.classList.add("is-reveal");
      c.classList.toggle("is-right", c.dataset.opt === "B");
      c.classList.toggle("is-wrong", isSelected && !right);
    });
    quizFeedback.textContent = QUIZ_REASONS[opt];
    quizFeedback.classList.toggle("is-right", right);
    quizFeedback.classList.toggle("is-wrong", !right);
  });
});

// =========================================================================
// 8. 07 节：原海报放大拖拽灯箱（只读 #poster.src，绝不二次内联）
// =========================================================================
const posterImg = document.getElementById("poster");
const posterTrigger = document.getElementById("poster-trigger");
const lightbox = document.getElementById("lightbox");
const lbViewport = document.getElementById("lb-viewport");
const lbImg = document.getElementById("lb-img");
const lbReset = document.getElementById("lb-reset");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLb() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbReset.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLb();
  lightbox.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-in").addEventListener("click", () => {
  lbScale = clamp(lbScale + 0.35, 0.8, 3.6);
  applyLb();
});
document.getElementById("lb-out").addEventListener("click", () => {
  lbScale = clamp(lbScale - 0.35, 0.8, 3.6);
  applyLb();
});
lbReset.addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLb();
});

lbViewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.2 : -0.2;
  lbScale = clamp(lbScale + delta, 0.8, 3.6);
  applyLb();
}, { passive: false });

lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target === lbViewport) {
    closeLightbox();
    return;
  }
  lbDrag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, bx: lbX, by: lbY };
  lbViewport.setPointerCapture?.(e.pointerId);
});

lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag || e.pointerId !== lbDrag.id) return;
  lbX = lbDrag.bx + (e.clientX - lbDrag.sx);
  lbY = lbDrag.by + (e.clientY - lbDrag.sy);
  applyLb();
});

lbViewport.addEventListener("pointerup", (e) => {
  if (lbDrag && e.pointerId === lbDrag.id) lbDrag = null;
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// 337 节标题幻灯片版式 · 主控制器
// 协调：单真源 model.js、2D 胶片转场画布、01-06 各节专属交互与 07 原海报灯箱。

import { loop, reducedMotion } from "../../lib/stage.js";
import { INITIAL_STATE, PRESETS, auditSlide } from "./model.js";
import { createFilmstrip } from "./filmstrip.js";

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

// ================= 开场状态与单真源同步 =================
const state = { ...INITIAL_STATE };
let cachedAudit = auditSlide(state);

const canvas = $("#filmstrip");
let filmLoop = null;
let filmstrip = null;

function setState(patch, { flash = false } = {}) {
  Object.assign(state, patch);
  cachedAudit = auditSlide(state);
  if (flash && filmstrip) filmstrip.triggerFlash();
  syncHeroUI();
  if (filmLoop) filmLoop.draw();
}

function syncHeroUI() {
  const a = cachedAudit;
  const g = a.geom;
  const isPass = a.score === 4;

  // 状态胶囊
  const pill = $("#hero-status-pill");
  if (pill) {
    pill.textContent = a.issue.badge;
    pill.classList.toggle("is-pass", isPass);
  }
  const mBadge = $("#mobile-score-badge");
  if (mBadge) mBadge.textContent = a.issue.badge;

  // 四枚原海报橙线探针
  for (const key of ["cue", "transition", "mood", "whitespace"]) {
    const p = a.pillars[key];
    const btn = $(`#probe-${key}`);
    const val = $(`#probe-${key}-val`);
    if (btn) btn.classList.toggle("is-ok", p.ok);
    if (val) val.textContent = p.tag;
  }

  // 帧号读数
  const sr = $("#scrub-readout");
  if (sr) {
    const curSlide = state.scrub < 0.25 ? g.deck.prevSlide.num : state.scrub > 0.75 ? g.deck.nextSlide.num : "05";
    sr.textContent = `SLIDE ${curSlide} / ${g.deck.name.split("·")[1]?.trim() || "12页"}`;
  }

  // 单真源诊单
  $("#audit-score").textContent = `${a.score}/4`;
  $("#audit-headline").textContent = a.issue.headline;
  $("#audit-why").textContent = a.issue.why;
  $("#audit-action").textContent = a.issue.action;
  $("#btn-primary-fix").textContent = a.issue.fixLabel;

  $("#m-ws").textContent = `${g.whitespacePct}%`;
  $("#m-dl").textContent = g.deltaL.toFixed(2);
  $("#m-scan").textContent = `${g.scanSec}s`;
  $("#m-pt").textContent = `${g.titlePt}pt`;

  // 同步四维分段按钮与滑块
  for (const grp of $$(".seg-group")) {
    const k = grp.dataset.ctrl;
    for (const btn of $$("button", grp)) {
      const active = btn.dataset.val === state[k];
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    }
  }
  const slider = $("#slider-pt");
  if (slider) slider.value = String(state.titlePt);
  $("#slider-pt-val").textContent = `${state.titlePt} pt`;

  // 同步剧本按钮（桌面竖带与手机栏）
  for (const btn of $$("[data-deck]")) {
    btn.classList.toggle("is-active", btn.dataset.deck === state.deckId);
  }
}

// 点击画布内 05 页热区时的智能就地手术
function handleCanvasZoneClick(zoneId) {
  const a = cachedAudit;
  if (zoneId === "title" || zoneId === "cue") {
    const order = ["long", "vague", "clear", "progress"];
    const next = !a.pillars.cue.ok
      ? (state.cueMode === "long" || state.cueMode === "vague" ? "clear" : state.cueMode)
      : order[(order.indexOf(state.cueMode) + 1) % order.length];
    const nextPt = state.titlePt < 48 || state.titlePt > 88 ? 70 : state.titlePt;
    setState({ cueMode: next, titlePt: nextPt, scrub: 0.5 }, { flash: true });
  } else if (zoneId === "payload") {
    const next = state.payloadMode === "bullets" || state.payloadMode === "prose"
      ? "subline"
      : state.payloadMode === "subline" ? "minimal" : "bullets";
    setState({ payloadMode: next, scrub: 0.5 }, { flash: true });
  } else if (zoneId === "mood") {
    const order = ["ribbon", "numeral", "horizon", "flat"];
    const next = state.moodMode === "flat"
      ? "ribbon"
      : order[(order.indexOf(state.moodMode) + 1) % order.length];
    setState({ moodMode: next, scrub: 0.5 }, { flash: true });
  } else if (zoneId === "surface") {
    const order = ["dark", "orange", "same", "noisy"];
    const next = state.surfaceMode === "same" || state.surfaceMode === "noisy"
      ? "dark"
      : order[(order.indexOf(state.surfaceMode) + 1) % order.length];
    setState({ surfaceMode: next, scrub: 0.5 }, { flash: true });
  }
}

function togglePlay() {
  if (!filmstrip) return;
  if (reducedMotion.matches) {
    // 减少动态效果下在 04 → 05 → 06 间步进切换
    const next = state.scrub < 0.25 ? 0.5 : state.scrub < 0.75 ? 1.0 : 0.0;
    setState({ scrub: next });
    return;
  }
  if (filmstrip.isPlaying()) {
    filmstrip.stopPlay();
    updatePlayLabels(false);
  } else {
    filmstrip.startPlay();
    updatePlayLabels(true);
    if (filmLoop) filmLoop.draw();
  }
}

function updatePlayLabels(playing) {
  const m = $("#btn-play-main");
  const s = $("#btn-play-mobile");
  if (m) m.textContent = playing ? "■ 停止转场" : "▶ 播放 04→05→06";
  if (s) s.textContent = playing ? "■ 停止" : "▶ 播转场";
}

// 初始化片轨 2D Canvas
filmstrip = createFilmstrip(canvas, {
  getState: () => state,
  getAudit: () => cachedAudit,
  onScrub: (u, fromPlay) => {
    state.scrub = Math.max(0, Math.min(1, u));
    const sr = $("#scrub-readout");
    if (sr) {
      const g = cachedAudit.geom;
      const curSlide = state.scrub < 0.25 ? g.deck.prevSlide.num : state.scrub > 0.75 ? g.deck.nextSlide.num : "05";
      sr.textContent = `SLIDE ${curSlide} / ${g.deck.name.split("·")[1]?.trim() || "12页"}`;
    }
    if (!fromPlay && filmLoop) filmLoop.draw();
  },
  onClickZone: handleCanvasZoneClick,
  onPlayEnd: () => updatePlayLabels(false)
});

filmLoop = loop(canvas, (t, dt, meta) => filmstrip.render(t, dt, meta));

// 绑定四维分段按钮、滑块、剧本、探针与多解预设
for (const grp of $$(".seg-group")) {
  const k = grp.dataset.ctrl;
  grp.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-val]");
    if (!btn) return;
    filmstrip.stopPlay();
    updatePlayLabels(false);
    setState({ [k]: btn.dataset.val, scrub: 0.5 }, { flash: true });
  });
}

$("#slider-pt").addEventListener("input", (ev) => {
  filmstrip.stopPlay();
  updatePlayLabels(false);
  setState({ titlePt: Number(ev.target.value), scrub: 0.5 });
});

for (const btn of $$("[data-deck]")) {
  btn.addEventListener("click", () => {
    setState({ deckId: btn.dataset.deck, scrub: 0.5 }, { flash: true });
  });
}

$("#btn-primary-fix").addEventListener("click", () => {
  const patch = cachedAudit.issue.fixPatch;
  if (patch) {
    filmstrip.stopPlay();
    updatePlayLabels(false);
    setState({ ...patch, scrub: 0.5 }, { flash: true });
  } else {
    togglePlay();
  }
});

$("#btn-play-main").addEventListener("click", togglePlay);
$("#btn-play-mobile").addEventListener("click", togglePlay);

// 点击顶部四枚橙线探针，一键修复对应维度或演练切换
for (const btn of $$(".cue-probe")) {
  btn.addEventListener("click", () => {
    const p = btn.dataset.probe;
    if (p === "cue") handleCanvasZoneClick("title");
    else if (p === "transition") handleCanvasZoneClick("surface");
    else if (p === "mood") handleCanvasZoneClick("mood");
    else if (p === "whitespace") handleCanvasZoneClick("payload");
  });
}

// 渲染多解与试错预设按钮
const chipsHost = $("#preset-chips");
for (const [id, item] of Object.entries(PRESETS)) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = `preset-chip is-${item.kind}`;
  b.dataset.preset = id;
  b.textContent = item.label;
  b.addEventListener("click", () => {
    filmstrip.stopPlay();
    updatePlayLabels(false);
    setState(item.patch, { flash: true });
  });
  chipsHost.appendChild(b);
}

// 键盘操作画布：←/→ 推演胶片，↑/↓ 调字号，Space 播放转场
canvas.addEventListener("keydown", (ev) => {
  if (ev.key === "ArrowLeft") {
    ev.preventDefault();
    setState({ scrub: Math.max(0, state.scrub - 0.1) });
  } else if (ev.key === "ArrowRight") {
    ev.preventDefault();
    setState({ scrub: Math.min(1, state.scrub + 0.1) });
  } else if (ev.key === "ArrowUp") {
    ev.preventDefault();
    setState({ titlePt: Math.min(96, state.titlePt + 4) });
  } else if (ev.key === "ArrowDown") {
    ev.preventDefault();
    setState({ titlePt: Math.max(24, state.titlePt - 4) });
  } else if (ev.key === " " || ev.key === "Enter") {
    ev.preventDefault();
    togglePlay();
  }
});

window.addEventListener("resize", () => {
  if (filmLoop) filmLoop.draw();
});

syncHeroUI();
filmLoop.draw();

// ================= 01 为什么需要喘一口气：12 页认知负荷模拟器 =================
const PACE_DATA = {
  none: {
    summary: "连讲 12 页零转场：第 6 页后工作记忆持续高位堆积",
    desc: "前 4 页的营收数据和后 4 页的渠道策略在视觉上毫无区隔。听众还在心里消化上一组表格，屏幕已经切到新主题，前后信息在工作记忆里互相挤压。",
    stat: "节标题 0 张 · 负荷峰值持续（示意）",
    dividers: [],
    loads: [0.46, 0.62, 0.74, 0.81, 0.85, 0.89, 0.91, 0.93, 0.92, 0.94, 0.95, 0.96],
    notes: [
      "封面：开场注意力在线", "目录页：信息量开始上升", "营收图表：数据进入工作记忆", "毛利拆解：负荷攀升",
      "直接跳进渠道策略：无边界提示", "听众仍在回想上一页毛利数", "案例堆叠：理解开始滞后", "费用细表：前排开始走神",
      "又直接切进组织架构", "三章内容在脑中混成一团", "预算压力测试：严重过载", "收尾结论：记不住主线"
    ]
  },
  balanced: {
    summary: "插入 3 张节标题（第 2、6、10 页）：三次显式换气谷",
    desc: "每讲完 3 页高密度论证，就用一张高反差、大留白的节标题页做事件边界。大脑自然把上一章打包封存，工作记忆负荷迅速回落，听众抬头重新锁定演讲者。",
    stat: "节标题 3 张 · 节奏疏密分明（示意）",
    dividers: [1, 5, 9], // 0-based -> 第 2、6、10 页
    loads: [0.42, 0.22, 0.56, 0.71, 0.78, 0.20, 0.58, 0.72, 0.79, 0.21, 0.62, 0.54],
    notes: [
      "01 封面：建立全场总命题", "02 节标题「一·营收复盘」：清空预期，定下首章方向", "03 营收总览：干净接住核心数", "04 毛利拆解：负荷有序爬升",
      "05 本章小结：收拢第一章论据", "06 节标题「二·增长引擎」：强反差换气，切换心智模型", "07 单店模型：精力恢复后吸收顺畅", "08 城市复制：论证层层推进",
      "09 渠道验证：负荷到达高点", "10 节标题「三·行动排期」：再次深呼吸，转入落地决策", "11 季度路线图：聚焦执行", "12 行动号召：全场脉络清晰"
    ]
  },
  over: {
    summary: "每 2 页乱插节标题（共 6 张）：反差耗尽，叙事支离破碎",
    desc: "整套 12 页里一半都在翻「空白大字页」。论点刚起个头就被转场打断，深色反转不再稀缺，听众反而觉得节奏拖沓、干货稀薄。",
    stat: "节标题 6 张 · 节奏过碎（示意）",
    dividers: [1, 3, 5, 7, 9, 11],
    loads: [0.44, 0.30, 0.52, 0.36, 0.54, 0.42, 0.56, 0.46, 0.58, 0.50, 0.56, 0.52],
    notes: [
      "01 封面：开场", "02 节标题：刚开场就插转场", "03 仅讲了一页数据", "04 又切节标题：论证被腰斩",
      "05 刚展开半个结论", "06 再次大字黑屏：开始审美疲劳", "07 零散要点：拼不成完整逻辑", "08 第四次节标题：观众觉得拖沓",
      "09 简短图表", "10 第五次节标题：反差彻底钝化", "11 仓促补一条预算", "12 结尾又放一张转场页"
    ]
  }
};

let activePace = "balanced";
let selectedTile = 5;

function renderPaceLab() {
  const data = PACE_DATA[activePace];
  const svg = $("#pace-svg");
  const W = 840, H = 190, padL = 44, padR = 24, padT = 26, padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const pts = data.loads.map((v, i) => ({
    x: padL + (i / 11) * innerW,
    y: padT + (1 - v) * innerH,
    isDiv: data.dividers.includes(i),
    v,
    i
  }));

  const pathD = pts.map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD = `${pathD} L${pts[pts.length - 1].x.toFixed(1)},${(padT + innerH).toFixed(1)} L${pts[0].x.toFixed(1)},${(padT + innerH).toFixed(1)} Z`;
  const strokeCol = activePace === "balanced" ? "#5CE0B3" : "#FF8240";
  const fillCol = activePace === "balanced" ? "rgba(92,224,179,0.16)" : "rgba(255,130,64,0.18)";

  let markup = `
    <line x1="${padL}" y1="${padT}" x2="${W - padR}" y2="${padT}" stroke="rgba(245,228,206,0.14)" stroke-dasharray="4 4"/>
    <line x1="${padL}" y1="${padT + innerH * 0.5}" x2="${W - padR}" y2="${padT + innerH * 0.5}" stroke="rgba(245,228,206,0.12)" stroke-dasharray="4 4"/>
    <line x1="${padL}" y1="${padT + innerH}" x2="${W - padR}" y2="${padT + innerH}" stroke="rgba(245,228,206,0.3)"/>
    <text x="6" y="${padT + 4}" fill="#B6CBC9" font-size="11" font-family="Noto Sans SC, sans-serif">高负荷</text>
    <text x="6" y="${padT + innerH}" fill="#B6CBC9" font-size="11" font-family="Noto Sans SC, sans-serif">换气谷</text>
    <path d="${areaD}" fill="${fillCol}"/>
    <path d="${pathD}" fill="none" stroke="${strokeCol}" stroke-width="3"/>
  `;

  for (const p of pts) {
    const isSel = p.i === selectedTile;
    if (p.isDiv) {
      markup += `<line x1="${p.x.toFixed(1)}" y1="${padT}" x2="${p.x.toFixed(1)}" y2="${padT + innerH}" stroke="#F16318" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    }
    markup += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${isSel ? 7 : p.isDiv ? 5.5 : 4}" fill="${p.isDiv ? "#F5E4CE" : strokeCol}" stroke="${isSel ? "#F16318" : "#012527"}" stroke-width="${isSel ? 3 : 2}"/>`;
    markup += `<text x="${p.x.toFixed(1)}" y="${H - 8}" text-anchor="middle" fill="${p.isDiv ? "#FF8240" : "#B6CBC9"}" font-size="11" font-family="Space Mono, monospace">${String(p.i + 1).padStart(2, "0")}</text>`;
  }
  svg.innerHTML = markup;

  // 12 页可点胶片格
  const strip = $("#pace-strip");
  strip.innerHTML = "";
  data.loads.forEach((_, idx) => {
    const isDiv = data.dividers.includes(idx);
    const b = document.createElement("button");
    b.type = "button";
    b.className = `pace-tile${isDiv ? " is-divider" : ""}${idx === selectedTile ? " is-selected" : ""}`;
    b.innerHTML = `<span>${String(idx + 1).padStart(2, "0")}</span><small>${isDiv ? "节标题" : "正文页"}</small>`;
    b.addEventListener("click", () => {
      selectedTile = idx;
      renderPaceLab();
    });
    strip.appendChild(b);
  });

  const ro = $("#pace-readout");
  ro.innerHTML = `
    <div>
      <h3>${data.summary}</h3>
      <p><b>当前选中第 ${String(selectedTile + 1).padStart(2, "0")} 页：</b>${data.notes[selectedTile]}。${data.desc}</p>
    </div>
    <span class="pace-stat">${data.stat}</span>
  `;
}

for (const tab of $$(".pace-tab")) {
  tab.addEventListener("click", () => {
    activePace = tab.dataset.pace;
    selectedTile = activePace === "balanced" ? 5 : activePace === "none" ? 4 : 3;
    for (const t of $$(".pace-tab")) {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    }
    renderPaceLab();
  });
}
renderPaceLab();

// ================= 02 一页只留四样东西：四层蓝图开关 =================
const bpState = { cue: true, transition: true, mood: true, whitespace: true };
const BP_CAPTIONS = {
  all: "四个图层全部亮起：反色底制造顿挫，章号与短主题给出方向，弯带与圆球立住情绪，大块留白让眼睛停下来。",
  none: "四个图层全部关掉后，这只是一块无方向的黑屏——点亮任意一项看它如何支起整页节标题。",
  cueOnly: "只留「章节提示」：文字方向清楚，但少了反色与视觉锚点，看起来就像一页还没排版完的草稿。",
  noCue: "关掉了「章节提示」：色块和留白依然好看，但观众完全不知道下一章要讲什么（典型的「少过头」）。",
  noTrans: "关掉了「转场」反色：画面退回普通内容页的视觉温度，翻页时的章节断句感大幅减弱。"
};

function syncBlueprint() {
  for (const layer of $$(".bp-layer")) {
    const key = layer.dataset.layer;
    layer.classList.toggle("is-dim", !bpState[key]);
  }
  const activeKeys = Object.keys(bpState).filter((k) => bpState[k]);
  let text = BP_CAPTIONS.all;
  if (activeKeys.length === 0) text = BP_CAPTIONS.none;
  else if (activeKeys.length === 1 && activeKeys[0] === "cue") text = BP_CAPTIONS.cueOnly;
  else if (!bpState.cue) text = BP_CAPTIONS.noCue;
  else if (!bpState.transition) text = BP_CAPTIONS.noTrans;
  else if (activeKeys.length < 4) {
    const missing = ["cue", "transition", "mood", "whitespace"].filter((k) => !bpState[k]).map((k) => ({
      cue: "章节提示", transition: "转场反差", mood: "情绪锚点", whitespace: "留白边界"
    }[k]));
    text = `当前关闭了「${missing.join("、")}」：对比观察缺了这一层后，这页节标题的稳定感或转场力度发生了什么变化。`;
  }
  $("#bp-caption").textContent = text;
}

for (const btn of $$(".bp-toggle")) {
  btn.addEventListener("click", () => {
    const k = btn.dataset.bp;
    bpState[k] = !bpState[k];
    btn.classList.toggle("is-on", bpState[k]);
    btn.setAttribute("aria-pressed", String(bpState[k]));
    syncBlueprint();
  });
}

// ================= 03 四种转场变体对比 + 后排 15m 视距 =================
const ARCH_VARIANTS = {
  invert: {
    name: "反色色块型（Solid Inversion）",
    desc: "正文全套浅米底时，节标题整页切为深石油青或品牌满铺炽橙。这是明度反差最大、最不容易出错的经典转场，尤其适合投影环境偏亮的普通会议室。",
    best: "经营复盘、方案提案、常规商务汇报",
    watch: "全套 PPT 需保持同一色系，不要每一章随机换一种无关的新色。",
    svg: `
      <rect width="640" height="360" fill="#012527"/>
      <rect x="556" y="0" width="84" height="360" fill="#F16318"/>
      <polygon points="574,44 602,64 574,84" fill="#012527"/>
      <text x="58" y="138" fill="#FF8240" font-size="18" font-weight="800" font-family="Syne, sans-serif">SECTION 02 / 04</text>
      <text x="58" y="212" fill="#F5E4CE" font-size="52" font-weight="900" font-family="Noto Sans SC, sans-serif">增长引擎</text>
      <text x="58" y="254" fill="#B6CBC9" font-size="16" font-family="Noto Sans SC, sans-serif">把试点打法复制到八座核心城市</text>
      <line x1="58" y1="274" x2="290" y2="274" stroke="#F16318" stroke-width="2"/>
      <circle cx="294" cy="274" r="4.5" fill="#F16318"/>
    `
  },
  numeral: {
    name: "巨号编排型（Oversized Numeral）",
    desc: "把章节数字放大到占据三分之一画幅，用尺度反差本身制造仪式感，主标题克制地落在数字旁或底边。不靠配图也能撑出出版物级别的建筑感。",
    best: "设计评审、品牌策略、建筑与文化主题演讲",
    watch: "巨号作为背景层次时降低饱和度或明度，避免与中文主标题抢对比度。",
    svg: `
      <rect width="640" height="360" fill="#D94F0A"/>
      <text x="348" y="268" fill="rgba(1,37,39,0.22)" font-size="230" font-weight="800" font-family="Syne, sans-serif">02</text>
      <text x="56" y="146" fill="#012527" font-size="15" font-weight="700" font-family="Outfit, sans-serif" letter-spacing="2">CHAPTER TWO</text>
      <text x="56" y="218" fill="#FFF6EB" font-size="54" font-weight="900" font-family="Noto Sans SC, sans-serif">增长引擎</text>
      <line x1="56" y1="294" x2="564" y2="294" stroke="#012527" stroke-width="2.5"/>
      <circle cx="570" cy="294" r="5" fill="#012527"/>
    `
  },
  agenda: {
    name: "进度高亮型（Progress Highlight）",
    desc: "把整场 3–4 个大章排成一列，已讲完的压暗，当前章用品牌色高亮并配一句短导语。它是长汇报里最贴心的「路标型」节标题，能立刻救回走神的听众。",
    best: "超过 25 页、时长 30 分钟以上的长篇汇报或学术答辩",
    watch: "章节数控制在 3–5 项以内；列 8 项以上会退化成密集目录表，失去留白。",
    svg: `
      <rect width="640" height="360" fill="#012527"/>
      <rect x="56" y="68" width="118" height="3" fill="rgba(245,228,206,0.24)"/>
      <text x="56" y="58" fill="#7D9B99" font-size="13" font-family="Noto Sans SC, sans-serif">01 营收结构</text>
      <rect x="192" y="66" width="128" height="6" fill="#F16318"/>
      <text x="192" y="58" fill="#FF8240" font-size="14" font-weight="700" font-family="Noto Sans SC, sans-serif">02 增长引擎</text>
      <rect x="338" y="68" width="118" height="3" fill="rgba(245,228,206,0.24)"/>
      <text x="338" y="58" fill="#7D9B99" font-size="13" font-family="Noto Sans SC, sans-serif">03 组织提效</text>
      <rect x="474" y="68" width="110" height="3" fill="rgba(245,228,206,0.24)"/>
      <text x="474" y="58" fill="#7D9B99" font-size="13" font-family="Noto Sans SC, sans-serif">04 明年预算</text>
      <text x="56" y="196" fill="#F5E4CE" font-size="50" font-weight="900" font-family="Noto Sans SC, sans-serif">02 · 增长引擎</text>
      <text x="56" y="238" fill="#B6CBC9" font-size="16" font-family="Noto Sans SC, sans-serif">已完成 25% · 接下来拆解八城复制模型</text>
    `
  },
  mood: {
    name: "满版氛围型（Atmospheric Breather）",
    desc: "保留极大面积的静谧几何地平线或低对比暗场，把标题压在黄金偏上，靠克制的线条与单一暖色圆点瞬间改变会场空气温度。",
    best: "新品发布 Keynote、年度主旨演讲、叙事性强的公开分享",
    watch: "背景绝不能杂乱，文字落点下方必须保证干净暗区和高对比度。",
    svg: `
      <rect width="640" height="360" fill="#031C1E"/>
      <circle cx="516" cy="242" r="84" fill="rgba(241,99,24,0.20)"/>
      <circle cx="516" cy="242" r="34" fill="#F5E4CE"/>
      <path d="M0 294 Q250 222 548 312" fill="none" stroke="#F5E4CE" stroke-width="1.6" opacity="0.72"/>
      <circle cx="552" cy="313" r="5" fill="#F16318"/>
      <text x="58" y="132" fill="#FF8240" font-size="14" font-weight="700" font-family="Outfit, sans-serif" letter-spacing="3">PART 02 · MOOD SHIFT</text>
      <text x="58" y="196" fill="#F5E4CE" font-size="48" font-weight="900" font-family="Noto Sans SC, sans-serif">增长引擎</text>
      <text x="58" y="232" fill="#B6CBC9" font-size="15" font-family="Noto Sans SC, sans-serif">少即是多，只保留方向与重点</text>
    `
  }
};

let activeArch = "invert";
function renderArch() {
  const v = ARCH_VARIANTS[activeArch];
  $("#proj-svg").innerHTML = v.svg;
  $("#proj-spec").innerHTML = `
    <h3>${v.name}</h3>
    <p>${v.desc}</p>
    <dl class="proj-kv">
      <div><dt>最适合场合</dt><dd>${v.best}</dd></div>
      <div><dt>特别注意</dt><dd>${v.watch}</dd></div>
    </dl>
  `;
}

for (const tab of $$(".proj-tab")) {
  tab.addEventListener("click", () => {
    activeArch = tab.dataset.arch;
    for (const t of $$(".proj-tab")) {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    }
    renderArch();
  });
}

for (const btn of $$(".dist-btn")) {
  btn.addEventListener("click", () => {
    const dist = btn.dataset.dist;
    for (const b of $$(".dist-btn")) b.classList.toggle("is-active", b === btn);
    $("#proj-frame").dataset.dist = dist;
    $("#proj-dist-tag").textContent = dist === "far"
      ? "AUDITORIUM VIEW · 15M BACK ROW（后排视角下大字与反差决定辨识）"
      : "AUDITORIUM VIEW · 3M FRONT ROW";
  });
}
renderArch();

// ================= 04 从哪来：四时代历史卡片 =================
const ERAS = [
  {
    title: "古典书籍的「篇章扉页」（Divisional / Part Title）",
    body: "早在幻灯片诞生数百年之前，书籍排版就在一部书的大篇章之间插入几乎空白的奇数右页（recto），整页只放「第一部」和简短篇名，背面留空。罗伯特·布林赫斯特（Robert Bringhurst）在《字体排印风格要素》（1992）以及《芝加哥格式手册》都指出，这种篇章扉页不是浪费纸张，而是给读者在跨越重大结构时提供视觉喘息与比例节奏。",
    src: "核实来源：Robert Bringhurst, The Elements of Typographic Style (Hartley & Marks, 1992)",
    svg: `<svg viewBox="0 0 260 170"><rect x="14" y="14" width="112" height="142" fill="#F2EAE0" stroke="#BDB2A2"/><rect x="134" y="14" width="112" height="142" fill="#FFFDF9" stroke="#072123" stroke-width="1.5"/><text x="150" y="64" fill="#B53D04" font-size="10" font-family="Space Mono, monospace">PART II</text><text x="150" y="88" fill="#072123" font-size="16" font-weight="900" font-family="Noto Sans SC, sans-serif">篇章扉页</text><line x1="150" y1="98" x2="210" y2="98" stroke="#F16318" stroke-width="1.5"/><text x="32" y="88" fill="#788485" font-size="10" font-family="Noto Sans SC, sans-serif">左页留空</text></svg>`
  },
  {
    title: "1855 诗句、1947 建筑宣言与银幕幕间卡",
    body: "原海报引用的「少即是多（Less is more）」最早出自英国诗人罗伯特·勃朗宁 1855 年诗作《安德烈亚·德尔·萨尔托》，并于 1947 年经菲利普·约翰逊在纽约现代艺术博物馆（MoMA）专著《密斯·凡·德·罗》中广为流传。与此同时，电影默片时期的幕间字幕卡（Intertitle）早已证明：在连续镜头中切入一块暗底白字，能瞬间重置观众的时间感与情绪。",
    src: "核实来源：Philip Johnson, Mies van der Rohe (MoMA, 1947) · moma.org/calendar/exhibitions/2734",
    svg: `<svg viewBox="0 0 260 170"><rect x="16" y="18" width="228" height="134" fill="#012527"/><rect x="26" y="28" width="208" height="114" fill="none" stroke="#F5E4CE" stroke-width="1.2" opacity="0.6"/><text x="130" y="82" text-anchor="middle" fill="#F5E4CE" font-size="19" font-style="italic" font-family="DM Serif Display, Georgia, serif">Less is more.</text><text x="130" y="106" text-anchor="middle" fill="#FF8240" font-size="10" font-family="Space Mono, monospace">ACT II · INTERTITLE</text></svg>`
  },
  {
    title: "2001–2009：分段效应与事件边界的认知证据",
    body: "迈耶与钱德勒（Mayer & Chandler, 2001）在《教育心理学杂志》发现，把连续复杂的多媒体讲解切分成带暂停按钮的片段后，学习者对原理的深度迁移显著改善；迈耶在 2009 年《多媒体学习》第二版将其正式归纳为「分段原则（Segmenting Principle）」。2007 年扎克斯团队（Zacks et al.）在《心理学公报》提出的事件切分理论则说明：明显的感官边界会触发大脑闭合旧事件模型、开启新编码。",
    src: "核实来源：DOI 10.1037/0022-0663.93.2.390 (2001) · DOI 10.1037/0033-2909.133.2.273 (2007)",
    svg: `<svg viewBox="0 0 260 170"><rect width="260" height="170" fill="#012527"/><path d="M18 118 L66 56 L104 48 L130 128 L168 58 L208 46 L242 52" fill="none" stroke="#5CE0B3" stroke-width="2.5"/><line x1="130" y1="24" x2="130" y2="146" stroke="#F16318" stroke-dasharray="4 3" stroke-width="1.5"/><circle cx="130" cy="128" r="5" fill="#F5E4CE"/><text x="130" y="158" text-anchor="middle" fill="#FF8240" font-size="10" font-family="Space Mono, monospace">EVENT BOUNDARY</text></svg>`
  },
  {
    title: "2008–2010：现代演讲设计革命与软件「分节」母版",
    body: "2008 年，南希·杜阿尔特（Nancy Duarte）出版《slide:ology》，加尔·雷诺兹（Garr Reynolds）出版《演说之禅》（Presentation Zen），双双猛烈批评密密麻麻的「文档型幻灯片（Slideument）」，主张用高留白、强对比的章节过渡页替演讲建立呼吸感。2010 年，Microsoft PowerPoint 正式加入原生「节（Sections）」分组功能，与标准「节标题（Section Header）」母版配套使用至今。",
    src: "核实来源：Duarte (O'Reilly, 2008) · Reynolds (New Riders, 2008) · PowerPoint 2010 Sections",
    svg: `<svg viewBox="0 0 260 170"><rect x="14" y="20" width="66" height="44" fill="#F7F1E7" stroke="#BDB2A2"/><rect x="96" y="20" width="68" height="44" fill="#012527" stroke="#F16318" stroke-width="2"/><rect x="180" y="20" width="66" height="44" fill="#F7F1E7" stroke="#BDB2A2"/><text x="130" y="46" text-anchor="middle" fill="#F5E4CE" font-size="11" font-weight="700" font-family="Noto Sans SC, sans-serif">节标题</text><text x="130" y="106" text-anchor="middle" fill="#072123" font-size="12" font-weight="700" font-family="Noto Sans SC, sans-serif">Section Header Master</text><text x="130" y="128" text-anchor="middle" fill="#B53D04" font-size="10" font-family="Space Mono, monospace">POWERPOINT 2010+ SECTIONS</text></svg>`
  }
];

function renderEra(idx) {
  const e = ERAS[idx];
  $("#era-panel").innerHTML = `
    <div>
      <h3>${e.title}</h3>
      <p>${e.body}</p>
      <p class="era-src">${e.src}</p>
    </div>
    <div class="era-diagram">${e.svg}</div>
  `;
}

for (const btn of $$(".era-btn")) {
  btn.addEventListener("click", () => {
    const idx = Number(btn.dataset.era);
    for (const b of $$(".era-btn")) {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    }
    renderEra(idx);
  });
}
renderEra(0);

// ================= 05 什么时候别用：真实场景分诊器 =================
const TRIAGE = {
  pitch: {
    verdict: "建议省去节标题页",
    skip: true,
    title: "5 分钟电梯路演（6 页）：整场只有一口气，千万别自己掐断",
    body: "总共 6 页里如果塞进 2 张节标题，三分之一的翻页都在看空荡荡的大字。短汇报不需要中途换气，观众的注意力本来就足够连贯——把宝贵的每一页都留给痛点、方案、证据和行动。",
    alt: "替代做法：在每页左上角放极小的页眉标（如「02 / 产品方案」）就足够指路，绝不单独拆页。"
  },
  doc: {
    verdict: "建议省去或大幅压薄",
    skip: true,
    title: "纯邮件传阅的 PDF 备忘录（20 页）：没有口头过渡，空白大字页显拖沓",
    body: "节标题页原本是为了给「听讲者抬头看屏幕的 2 秒」服务的。如果这份文件发进邮箱让老板自己快速滚动阅读，连续撞上三四张只写了四个大字的满屏深色页，读者只会狂滑滚轮嫌占地方。",
    alt: "替代做法：改用顶栏章节导航条（Running Header），或仅在真正跨业务线的大板块前留 1 张带一句话核心结论的章节页。"
  },
  review: {
    verdict: "强烈推荐使用（3–4 张）",
    skip: false,
    title: "40 分钟跨部门年度经营复盘（28 页）：节标题是救回注意力的锚点",
    body: "从营收数据切到研发排期，再切到明年预算，内容跨度大、密度极高。每隔 6–8 页插一张反色节标题页（推荐带顶部进度条的「进度高亮型」），能让听众立刻清零上一模块记忆，并清晰感知汇报还剩几章。",
    alt: "执行要点：全套控制在 3–4 张，统一使用同色系深底反色与 50–76pt 主标，切忌把每章 5 条议程又塞进去。"
  },
  story: {
    verdict: "视转折力度决定，宁少勿多",
    skip: true,
    title: "15 分钟单一故事线分享（12 页）：线性悬念不宜被机械章节切碎",
    body: "如果整场演讲像电影一样围绕同一个案例层层推进，强行贴上「01 背景 / 02 过程 / 03 结果」的工业章节牌，反而会暴露公式化的汇报腔，打断听众的沉浸感。",
    alt: "替代做法：只在情绪发生剧烈反转的那一刻留 1 张「满版氛围留白型」转场页（如只放一句关键问题），其余页面自然衔接。"
  }
};

function renderTriage(key) {
  const t = TRIAGE[key];
  $("#triage-verdict").innerHTML = `
    <span class="tv-badge ${t.skip ? "is-skip" : "is-use"}">${t.verdict}</span>
    <h3>${t.title}</h3>
    <p>${t.body}</p>
    <div class="tv-alt"><b>实操建议：</b>${t.alt}</div>
  `;
}

for (const card of $$(".triage-card")) {
  card.addEventListener("click", () => {
    for (const c of $$(".triage-card")) c.classList.toggle("is-active", c === card);
    renderTriage(card.dataset.triage);
  });
}
renderTriage("pitch");

// ================= 06 小练习：中性四选一（只各差一个变量） =================
const QUIZ_OPTS = [
  {
    id: "A",
    ok: false,
    reason: "方案 A 踩中了「少过头失方向」陷阱：它有深青反色、有大面积留白，也有巨号 02，唯独把章节主题名删成了空洞的「SECTION TWO」。观众抬眼看完仍然不知道第二章到底要讲什么。",
    centerSvg: `
      <clipPath id="qclip-a"><rect x="92" y="14" width="216" height="122"/></clipPath>
      <rect x="92" y="14" width="216" height="122" fill="#012527" stroke="#F16318" stroke-width="1.5"/>
      <g clip-path="url(#qclip-a)">
        <text x="216" y="112" fill="rgba(241,99,24,0.26)" font-size="64" font-weight="800" font-family="Syne, sans-serif">02</text>
        <text x="108" y="60" fill="#FF8240" font-size="9" font-weight="700" font-family="Outfit, sans-serif">PART 02</text>
        <text x="108" y="84" fill="#F5E4CE" font-size="14" font-weight="800" font-family="Syne, sans-serif">SECTION TWO</text>
        <line x1="108" y1="98" x2="188" y2="98" stroke="#F16318" stroke-width="1.5"/>
      </g>
    `
  },
  {
    id: "B",
    ok: true,
    reason: "方案 B 四项支柱全部成立：深石油青底与左右两张浅米数据页拉开强明度反差（ΔL 0.87）；清晰标出「02 · 渠道破局」与一句 10 字方向导语，后排 1–2 秒读完；保留约 74% 静默留白并用细橙弯带钉住视觉重心。",
    centerSvg: `
      <rect x="92" y="14" width="216" height="122" fill="#012527" stroke="#F16318" stroke-width="1.5"/>
      <rect x="282" y="14" width="26" height="122" fill="#F16318"/>
      <text x="108" y="54" fill="#FF8240" font-size="9" font-weight="800" font-family="Syne, sans-serif">SECTION 02 / 04</text>
      <text x="108" y="84" fill="#F5E4CE" font-size="23" font-weight="900" font-family="Noto Sans SC, sans-serif">渠道破局</text>
      <text x="108" y="102" fill="#B6CBC9" font-size="9" font-family="Noto Sans SC, sans-serif">八座核心城市的标准复制路径</text>
      <line x1="108" y1="112" x2="210" y2="112" stroke="#F16318" stroke-width="1.4"/>
      <circle cx="212" cy="112" r="2.5" fill="#F16318"/>
    `
  },
  {
    id: "C",
    ok: false,
    reason: "方案 C 的标题、字号和留白都没问题，唯独缺了「转场底色反差」这一项：它沿用了和前后 04、06 内容页一模一样的浅米白底。快速翻页时没有光暗顿挫，容易混进普通正文页里。",
    centerSvg: `
      <rect x="92" y="14" width="216" height="122" fill="#F7F1E7" stroke="#BDB2A2" stroke-width="1.5"/>
      <rect x="282" y="14" width="26" height="122" fill="#E3D7C5"/>
      <text x="108" y="54" fill="#B53D04" font-size="9" font-weight="800" font-family="Syne, sans-serif">SECTION 02 / 04</text>
      <text x="108" y="84" fill="#072123" font-size="23" font-weight="900" font-family="Noto Sans SC, sans-serif">渠道破局</text>
      <text x="108" y="102" fill="#465D5F" font-size="9" font-family="Noto Sans SC, sans-serif">八座核心城市的标准复制路径</text>
      <line x1="108" y1="112" x2="210" y2="112" stroke="#B53D04" stroke-width="1.4"/>
    `
  },
  {
    id: "D",
    ok: false,
    reason: "方案 D 的深色反色与大标题都对了，唯独破坏了「信息留白」：下方硬塞了 5 条细目提纲，把本来用来清空工作记忆的换气页重新变成了让听众低头默读的目录字墙。",
    centerSvg: `
      <rect x="92" y="14" width="216" height="122" fill="#012527" stroke="#F16318" stroke-width="1.5"/>
      <text x="106" y="34" fill="#FF8240" font-size="8" font-weight="800" font-family="Syne, sans-serif">SECTION 02 / 04</text>
      <text x="106" y="54" fill="#F5E4CE" font-size="18" font-weight="900" font-family="Noto Sans SC, sans-serif">渠道破局</text>
      <text x="106" y="72" fill="#D5E4E2" font-size="7.5" font-family="Noto Sans SC, sans-serif">■ 01 华东华南直营标准动线复盘</text>
      <text x="106" y="85" fill="#D5E4E2" font-size="7.5" font-family="Noto Sans SC, sans-serif">■ 02 代理商分层返利与考核口径</text>
      <text x="106" y="98" fill="#D5E4E2" font-size="7.5" font-family="Noto Sans SC, sans-serif">■ 03 会员私域复购与优惠券核销</text>
      <text x="106" y="111" fill="#D5E4E2" font-size="7.5" font-family="Noto Sans SC, sans-serif">■ 04 供应链冷链履约单票成本拆解</text>
      <text x="106" y="124" fill="#D5E4E2" font-size="7.5" font-family="Noto Sans SC, sans-serif">■ 05 三季度预算审批与风险兜底</text>
    `
  }
];

function buildQuizSvg(centerSvg) {
  // 左右夹着两张相同浅底高密数据页（04 与 06），真实还原上下文
  return `
    <svg viewBox="0 0 400 150" aria-hidden="true">
      <rect width="400" height="150" fill="#011517"/>
      <!-- 左 04 浅底内容页缩略 -->
      <rect x="8" y="28" width="76" height="94" fill="#F7F1E7" opacity="0.82"/>
      <rect x="14" y="38" width="56" height="6" fill="#072123"/>
      <rect x="14" y="50" width="44" height="4" fill="#7D8E8F"/>
      <rect x="14" y="60" width="58" height="4" fill="#7D8E8F"/>
      <rect x="14" y="72" width="14" height="36" fill="#0B464A"/>
      <rect x="33" y="82" width="14" height="26" fill="#3E6B6E"/>
      <rect x="52" y="76" width="14" height="32" fill="#D9520E"/>
      <text x="46" y="136" text-anchor="middle" fill="#9BB3B1" font-size="8" font-family="Space Mono, monospace">04</text>
      <!-- 中 05 候选节标题 -->
      ${centerSvg}
      <text x="200" y="146" text-anchor="middle" fill="#FF8240" font-size="8" font-family="Space Mono, monospace">05 候选页</text>
      <!-- 右 06 浅底内容页缩略 -->
      <rect x="316" y="28" width="76" height="94" fill="#F7F1E7" opacity="0.82"/>
      <rect x="322" y="38" width="56" height="6" fill="#072123"/>
      <rect x="322" y="52" width="28" height="26" fill="#E3D7C5"/>
      <rect x="354" y="52" width="28" height="26" fill="#E3D7C5"/>
      <rect x="322" y="84" width="28" height="26" fill="#E3D7C5"/>
      <rect x="354" y="84" width="28" height="26" fill="#E3D7C5"/>
      <text x="354" y="136" text-anchor="middle" fill="#9BB3B1" font-size="8" font-family="Space Mono, monospace">06</text>
    </svg>
  `;
}

let quizAnswered = null;
function renderQuiz() {
  const grid = $("#quiz-grid");
  grid.innerHTML = "";
  for (const opt of QUIZ_OPTS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "quiz-opt";
    b.dataset.opt = opt.id;
    if (quizAnswered) {
      if (opt.ok) b.classList.add("is-right");
      else if (quizAnswered === opt.id) b.classList.add("is-wrong");
    }
    b.innerHTML = `
      <span class="quiz-opt-head"><span>方案 ${opt.id}</span><span>${quizAnswered ? (opt.ok ? "✓ 正解" : quizAnswered === opt.id ? "× 已选" : "") : "点击选择"}</span></span>
      ${buildQuizSvg(opt.centerSvg)}
    `;
    b.addEventListener("click", () => {
      quizAnswered = opt.id;
      renderQuiz();
      const chosen = QUIZ_OPTS.find((x) => x.id === opt.id);
      const fb = $("#quiz-feedback");
      fb.classList.add("is-show");
      fb.innerHTML = `
        <h3>${chosen.ok ? "答对了：方案 B 完成了真正的章节转场" : `再对照一下：你选了方案 ${chosen.id}，但方案 B 才四项俱全`}</h3>
        <p>${chosen.reason}</p>
        ${chosen.ok ? "" : `<p><b>为什么选方案 B：</b>${QUIZ_OPTS[1].reason}</p>`}
        <button type="button" class="quiz-reset-btn" id="quiz-reset">重新作答</button>
      `;
      $("#quiz-reset").addEventListener("click", () => {
        quizAnswered = null;
        fb.classList.remove("is-show");
        renderQuiz();
      });
    });
    grid.appendChild(b);
  }
}
renderQuiz();

// ================= 07 原海报灯箱（放大、拖拽、Esc 关闭） =================
const lb = $("#lightbox");
const lbImg = $("#lb-img");
const lbVp = $("#lb-viewport");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = false;
let lbStartX = 0;
let lbStartY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  $("#lb-reset").textContent = `${Math.round(lbScale * 100)}%`;
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
$("#lb-in").addEventListener("click", () => { lbScale = Math.min(3.5, lbScale + 0.35); applyLbTransform(); });
$("#lb-out").addEventListener("click", () => { lbScale = Math.max(0.75, lbScale - 0.35); applyLbTransform(); });
$("#lb-reset").addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLbTransform(); });

lbVp.addEventListener("wheel", (ev) => {
  ev.preventDefault();
  lbScale = Math.max(0.75, Math.min(3.5, lbScale + (ev.deltaY < 0 ? 0.18 : -0.18)));
  applyLbTransform();
}, { passive: false });

lbVp.addEventListener("pointerdown", (ev) => {
  if (ev.target === lbVp) { closeLightbox(); return; }
  lbDrag = true;
  lbStartX = ev.clientX - lbX;
  lbStartY = ev.clientY - lbY;
  lbVp.classList.add("is-drag");
  try { lbVp.setPointerCapture(ev.pointerId); } catch {}
});
lbVp.addEventListener("pointermove", (ev) => {
  if (!lbDrag) return;
  lbX = ev.clientX - lbStartX;
  lbY = ev.clientY - lbStartY;
  applyLbTransform();
});
lbVp.addEventListener("pointerup", () => { lbDrag = false; lbVp.classList.remove("is-drag"); });
lbVp.addEventListener("pointercancel", () => { lbDrag = false; lbVp.classList.remove("is-drag"); });

document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && !lb.hidden) closeLightbox();
});

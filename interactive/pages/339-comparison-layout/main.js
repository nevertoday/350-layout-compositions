// 339 比较幻灯片版式 — 主控脚本（开场单真源绑定 + 七节互动 + 灯箱）
import {
  createInitialState,
  PRESETS,
  SCAN_TASKS,
  XRAY_LAYERS,
  MILESTONES,
  SIBLING_SLIDES,
  triageScenario,
  CLINIC_CASES,
  QUIZ_ITEMS,
  PALETTE,
  clamp,
} from "./model.js";
import { mountHeroCanvas } from "./heroCanvas.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ==================== 1. 开场放映台与单真源 UI 同步 ====================
const state = createInitialState();
const heroCanvas = $("#hero-canvas");

const elStatus = $("#hero-status");
const elAuditPill = $("#audit-pill");
const elAuditChamber = $("#audit-chamber");
const elAuditTitle = $("#audit-title");
const elAuditReason = $("#audit-reason");
const elAuditTip = $("#audit-tip");
const elBtnFix = $("#btn-fix");

const elProbeDiff = $("#probe-diff");
const elProbeCommon = $("#probe-common");
const elProbeAxis = $("#probe-axis");
const elProbeAlign = $("#probe-align");

const elMMatched = $("#m-matched");
const elMStagger = $("#m-stagger");
const elMJump = $("#m-jump");
const elMScan = $("#m-scan");

const elCoupling = $("#ctl-coupling");
const elCouplingVal = $("#val-coupling");
const elStagger = $("#ctl-stagger");
const elStaggerVal = $("#val-stagger");
const elBtnGuides = $("#btn-guides");

function applyPreset(key) {
  const p = PRESETS[key];
  if (!p) return;
  state.rightOrder = [...p.rightOrder];
  state.staggerY = p.staggerY;
  state.coupling = p.coupling;
  state.coding = p.coding;
  state.axis = p.axis;
  state.common = p.common;
  state.highlightLayer = null;
  hero.draw();
  syncUI();
}

function syncProbe(el, p) {
  el.textContent = p.badge;
  el.classList.toggle("is-ok", p.ok);
  el.classList.toggle("is-bad", !p.ok);
}

let hero;

function syncUI() {
  if (!hero) return;
  const L = hero.getLayout();
  const { audit, probes, metrics } = L;

  elStatus.textContent = audit.shortTag;
  elStatus.classList.toggle("is-ok", audit.ok);
  elStatus.classList.toggle("is-bad", !audit.ok);

  elAuditPill.textContent = audit.shortTag;
  elAuditPill.classList.toggle("is-ok", audit.ok);
  elAuditPill.classList.toggle("is-bad", !audit.ok);
  elAuditChamber.classList.toggle("is-ok", audit.ok);

  elAuditTitle.textContent = audit.headline;
  elAuditReason.textContent = audit.reason;
  elAuditTip.textContent = audit.actionTip;
  elBtnFix.textContent = audit.fixLabel;
  elBtnFix.dataset.fixKind = audit.fixKind;

  syncProbe(elProbeDiff, probes.diff);
  syncProbe(elProbeCommon, probes.common);
  syncProbe(elProbeAxis, probes.axis);
  syncProbe(elProbeAlign, probes.align);

  elMMatched.textContent = `${metrics.matchedRows} / 3 行`;
  elMStagger.textContent = `${metrics.staggerPx >= 0 ? "+" : ""}${metrics.staggerPx}px`;
  elMJump.textContent = `${metrics.jumpPct}% · ${metrics.jumpPx}px`;
  elMScan.textContent = `${metrics.scanPathPx}px`;

  const cpPct = Math.round(state.coupling * 100);
  elCoupling.value = String(cpPct);
  elCouplingVal.textContent = `${cpPct}%`;

  const sg = Math.round(state.staggerY);
  elStagger.value = String(sg);
  elStaggerVal.textContent = `${sg >= 0 ? "+" : ""}${sg}px`;

  elBtnGuides.setAttribute("aria-pressed", String(state.showGuides));
  elBtnGuides.textContent = state.showGuides ? "标尺：开" : "标尺：关";

  $$(".deck-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.deck === state.deck));
  $$("[data-coding]").forEach((b) => b.classList.toggle("is-active", b.dataset.coding === state.coding));
  $$("[data-axis]").forEach((b) => b.classList.toggle("is-active", b.dataset.axis === state.axis));
  $$("[data-common]").forEach((b) => b.classList.toggle("is-active", b.dataset.common === state.common));
  $$(".leg-row").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.layer === state.highlightLayer)));
}

hero = mountHeroCanvas(heroCanvas, state, () => syncUI());
syncUI();

// 控件事件绑定
$$(".deck-btn").forEach((b) =>
  b.addEventListener("click", () => {
    state.deck = b.dataset.deck;
    hero.draw();
    syncUI();
  })
);

$$(".leg-row").forEach((b) =>
  b.addEventListener("click", () => {
    const layer = b.dataset.layer;
    state.highlightLayer = state.highlightLayer === layer ? null : layer;
    hero.draw();
    syncUI();
  })
);

$("#btn-scan").addEventListener("click", () => hero.startScan());

elBtnFix.addEventListener("click", () => {
  const kind = elBtnFix.dataset.fixKind;
  if (kind === "classic") applyPreset("classic");
  else if (kind === "accessible") applyPreset("accessible");
  else if (kind === "fixStagger") {
    state.staggerY = 0;
    hero.draw();
    syncUI();
  } else if (kind === "fixAxis") {
    state.axis = "classic";
    hero.draw();
    syncUI();
  } else if (kind === "fixSpan") {
    state.coupling = 0.36;
    hero.draw();
    syncUI();
  } else if (kind === "fixCoding") {
    state.coding = "classic";
    hero.draw();
    syncUI();
  } else if (kind === "fixCommon") {
    state.common = "band";
    hero.draw();
    syncUI();
  }
});

$("#btn-reset").addEventListener("click", () => applyPreset("broken"));

elBtnGuides.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  hero.draw();
  syncUI();
});

elCoupling.addEventListener("input", () => {
  state.coupling = clamp(+elCoupling.value / 100, 0, 1);
  hero.draw();
  syncUI();
});

elStagger.addEventListener("input", () => {
  let v = +elStagger.value;
  if (Math.abs(v) <= 2) v = 0;
  state.staggerY = v;
  hero.draw();
  syncUI();
});

$$("[data-coding]").forEach((b) =>
  b.addEventListener("click", () => {
    state.coding = b.dataset.coding;
    hero.draw();
    syncUI();
  })
);

$$("[data-axis]").forEach((b) =>
  b.addEventListener("click", () => {
    state.axis = b.dataset.axis;
    hero.draw();
    syncUI();
  })
);

$$("[data-common]").forEach((b) =>
  b.addEventListener("click", () => {
    state.common = b.dataset.common;
    hero.draw();
    syncUI();
  })
);

$$("[data-preset]").forEach((b) =>
  b.addEventListener("click", () => applyPreset(b.dataset.preset))
);

// 画布键盘操作（←/→ 调眼动跨度，↑/↓ 齐行高，Space 演练视线）
heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.coupling = clamp(+(state.coupling - 0.04).toFixed(3), 0, 1);
    hero.draw();
    syncUI();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.coupling = clamp(+(state.coupling + 0.04).toFixed(3), 0, 1);
    hero.draw();
    syncUI();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.staggerY = clamp(state.staggerY - 2, -26, 26);
    hero.draw();
    syncUI();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    state.staggerY = clamp(state.staggerY + 2, -26, 26);
    hero.draw();
    syncUI();
  } else if (e.key === " ") {
    e.preventDefault();
    hero.startScan();
  }
});

// ==================== 2. 第 01 节：眼动回溯对比实验 ====================
const scanTrio = $("#scan-trio");
let scanQIdx = 0;

function renderScanLab() {
  const q = SCAN_TASKS[scanQIdx];
  const rowY = [52, 82, 112];
  const ty = rowY[q.targetRow];
  const scrambledB = [rowY[2], rowY[0], rowY[1]][q.targetRow];

  const cards = [
    {
      title: "方案一：分页先后讲",
      badge: `翻页 ${q.serial.pages} 页 · 跳扫 ${q.serial.hops} 次`,
      good: false,
      verdict: q.serial.verdict,
      svg: `<svg class="sc-svg" viewBox="0 0 280 156" aria-hidden="true">
        <rect x="12" y="14" width="114" height="128" fill="#FBF7F0" stroke="#0A0A08" stroke-width="1.2"/>
        <rect x="20" y="22" width="98" height="14" fill="${PALETTE.blue}"/>
        <text x="69" y="32" text-anchor="middle" fill="#FFF" font-size="9" font-weight="700">第 1 页 · 方案 A</text>
        ${rowY.map((y, i) => `<rect x="22" y="${y}" width="84" height="12" fill="${i === q.targetRow ? "#D9E4FC" : "#EFE9DF"}"/>`).join("")}
        <rect x="154" y="14" width="114" height="128" fill="#FBF7F0" stroke="#0A0A08" stroke-width="1.2"/>
        <rect x="162" y="22" width="98" height="14" fill="${PALETTE.green}"/>
        <text x="211" y="32" text-anchor="middle" fill="#FFF" font-size="9" font-weight="700">第 2 页 · 方案 B</text>
        ${rowY.map((y, i) => `<rect x="164" y="${y}" width="84" height="12" fill="${i === q.targetRow ? "#D7EFE5" : "#EFE9DF"}"/>`).join("")}
        <path d="M106 ${ty + 6} C135 ${ty - 24}, 145 ${ty + 34}, 164 ${ty + 6}" fill="none" stroke="${PALETTE.danger}" stroke-width="2" stroke-dasharray="4 3"/>
        <path d="M164 ${ty + 10} C142 ${ty + 42}, 130 ${ty - 16}, 106 ${ty + 10}" fill="none" stroke="${PALETTE.danger}" stroke-width="1.6" stroke-dasharray="3 3"/>
        <circle cx="106" cy="${ty + 6}" r="4" fill="${PALETTE.danger}"/>
        <circle cx="164" cy="${ty + 6}" r="4" fill="${PALETTE.danger}"/>
      </svg>`,
    },
    {
      title: "方案二：同页但错序",
      badge: `单页 · 斜向搜寻 ${q.scrambled.hops} 次`,
      good: false,
      verdict: q.scrambled.verdict,
      svg: `<svg class="sc-svg" viewBox="0 0 280 156" aria-hidden="true">
        <rect x="12" y="14" width="256" height="128" fill="#FBF7F0" stroke="#0A0A08" stroke-width="1.2"/>
        <rect x="22" y="22" width="102" height="14" fill="${PALETTE.blue}"/>
        <rect x="156" y="22" width="102" height="14" fill="${PALETTE.green}"/>
        <text x="73" y="32" text-anchor="middle" fill="#FFF" font-size="9" font-weight="700">方案 A</text>
        <text x="207" y="32" text-anchor="middle" fill="#FFF" font-size="9" font-weight="700">方案 B（乱序）</text>
        ${rowY.map((y, i) => `<rect x="24" y="${y}" width="92" height="12" fill="${i === q.targetRow ? "#D9E4FC" : "#EFE9DF"}"/>`).join("")}
        ${rowY.map((y) => `<rect x="164" y="${y}" width="92" height="12" fill="${y === scrambledB ? "#D7EFE5" : "#EFE9DF"}"/>`).join("")}
        <line x1="116" y1="${ty + 6}" x2="164" y2="${scrambledB + 6}" stroke="${PALETTE.danger}" stroke-width="2.2" stroke-dasharray="4 3"/>
        <line x1="116" y1="${rowY[(q.targetRow + 1) % 3] + 6}" x2="164" y2="${rowY[(q.targetRow + 2) % 3] + 6}" stroke="rgba(184,39,30,0.35)" stroke-width="1.2" stroke-dasharray="3 3"/>
        <circle cx="116" cy="${ty + 6}" r="4" fill="${PALETTE.danger}"/>
        <circle cx="164" cy="${scrambledB + 6}" r="4" fill="${PALETTE.danger}"/>
      </svg>`,
    },
    {
      title: "方案三：339 同轴齐平",
      badge: `单页 · 水平直扫 ${q.aligned.hops} 次`,
      good: true,
      verdict: q.aligned.verdict,
      svg: `<svg class="sc-svg" viewBox="0 0 280 156" aria-hidden="true">
        <rect x="12" y="14" width="256" height="128" fill="#FBF7F0" stroke="#0A0A08" stroke-width="1.2"/>
        <rect x="22" y="22" width="100" height="14" fill="${PALETTE.blue}"/>
        <rect x="158" y="22" width="100" height="14" fill="${PALETTE.green}"/>
        <circle cx="140" cy="29" r="9" fill="#0A0A08"/>
        <text x="140" y="32" text-anchor="middle" fill="#FFF" font-size="7.5" font-weight="700">VS</text>
        <line x1="140" y1="38" x2="140" y2="118" stroke="#0A0A08" stroke-width="1.4"/>
        ${rowY.map((y, i) => `<rect x="24" y="${y}" width="88" height="12" fill="${i === q.targetRow ? "#D9E4FC" : "#EFE9DF"}"/>`).join("")}
        ${rowY.map((y, i) => `<rect x="168" y="${y}" width="88" height="12" fill="${i === q.targetRow ? "#D7EFE5" : "#EFE9DF"}"/>`).join("")}
        ${
          q.id === "common"
            ? `<rect x="22" y="122" width="236" height="14" fill="${PALETTE.sage}" stroke="${PALETTE.green}" stroke-width="1.5"/>
               <line x1="40" y1="129" x2="240" y2="129" stroke="${PALETTE.greenDeep}" stroke-width="2.2"/>`
            : `<rect x="22" y="122" width="236" height="14" fill="${PALETTE.sage}"/>
               <line x1="112" y1="${ty + 6}" x2="168" y2="${ty + 6}" stroke="${PALETTE.greenDeep}" stroke-width="2.4"/>
               <circle cx="140" cy="${ty + 6}" r="4" fill="#0A0A08"/>`
        }
      </svg>`,
    },
  ];

  scanTrio.innerHTML = cards
    .map(
      (c) => `
    <article class="scan-card ${c.good ? "is-best" : ""}">
      <div class="sc-head">
        <h3 class="sc-title">${c.title}</h3>
        <span class="sc-badge ${c.good ? "good" : "bad"}">${c.badge}</span>
      </div>
      ${c.svg}
      <p class="sc-verdict">${c.verdict}</p>
    </article>`
    )
    .join("");
}

$$(".q-btn").forEach((b) =>
  b.addEventListener("click", () => {
    scanQIdx = +b.dataset.scanQ;
    $$(".q-btn").forEach((x) => x.classList.toggle("is-active", +x.dataset.scanQ === scanQIdx));
    renderScanLab();
  })
);
renderScanLab();

// ==================== 3. 第 02 节：四层 X 光骨架叠片 ====================
const xrayState = { coding: true, axis: true, align: true, common: true };
let lastXrayLayer = "coding";
const xraySvgWrap = $("#xray-svg-wrap");
const xrayReadout = $("#xray-readout");

function renderXray() {
  const { coding, axis, align, common } = xrayState;
  const aCol = coding ? PALETTE.blue : "#8E9399";
  const bCol = coding ? PALETTE.green : "#8E9399";
  const rY = align ? [118, 152, 186] : [132, 168, 108];

  xraySvgWrap.innerHTML = `
  <svg viewBox="0 0 540 264" aria-hidden="true">
    <rect x="0" y="0" width="540" height="264" fill="#F6EFE4"/>
    <!-- 顶部方案条 -->
    <rect x="26" y="16" width="212" height="32" fill="${aCol}"/>
    <rect x="302" y="16" width="212" height="32" fill="${bCol}"/>
    <text x="132" y="37" text-anchor="middle" fill="#FFF" font-size="14" font-weight="900">方案 A</text>
    <text x="408" y="37" text-anchor="middle" fill="#FFF" font-size="14" font-weight="900">方案 B</text>

    <!-- 蓝圆 vs 绿方 -->
    ${
      coding
        ? `<circle cx="132" cy="76" r="19" fill="${PALETTE.blue}"/>
           <rect x="390" y="58" width="36" height="36" fill="${PALETTE.green}"/>`
        : `<rect x="114" y="58" width="36" height="36" fill="#8E9399"/>
           <rect x="390" y="58" width="36" height="36" fill="#8E9399"/>`
    }

    <!-- 中央比较轴 -->
    ${
      axis
        ? `<line x1="270" y1="48" x2="270" y2="205" stroke="#0A0A08" stroke-width="2"/>
           <path d="M264 198 L270 206 L276 198" fill="none" stroke="#0A0A08" stroke-width="2"/>
           <circle cx="270" cy="32" r="17" fill="#0A0A08"/>
           <text x="270" y="37" text-anchor="middle" fill="#FFF" font-size="12" font-weight="800">VS</text>`
        : `<text x="270" y="36" text-anchor="middle" fill="#B8271E" font-size="11" font-weight="700">无比较轴</text>`
    }

    <!-- 三对行与水平视线匹配 -->
    ${[0, 1, 2]
      .map((i) => {
        const ly = [118, 152, 186][i];
        const ry = rY[i];
        return `
        <line x1="208" y1="${ly + 11}" x2="332" y2="${ry + 11}" stroke="${align ? "#5A5850" : "#B8271E"}" stroke-width="${align ? 1.4 : 1.8}" stroke-dasharray="4 4"/>
        ${axis && align ? `<circle cx="270" cy="${ly + 11}" r="4" fill="#0A0A08"/>` : ""}
        <rect x="38" y="${ly}" width="166" height="22" fill="#FBF7F0" stroke="rgba(10,10,8,0.2)"/>
        <circle cx="52" cy="${ly + 11}" r="7" fill="${aCol}"/>
        <text x="66" y="${ly + 15}" fill="#0A0A08" font-size="11" font-weight="700">${["处理速度快", "资源占用低", "适合批量任务"][i]}</text>
        <rect x="336" y="${ry}" width="166" height="22" fill="#FBF7F0" stroke="${align ? "rgba(10,10,8,0.2)" : "#B8271E"}"/>
        <circle cx="350" cy="${ry + 11}" r="7" fill="${bCol}"/>
        <text x="364" y="${ry + 15}" fill="#0A0A08" font-size="11" font-weight="700">${["输出更精确", "细节控制强", "适合关键场景"][i]}</text>`;
      })
      .join("")}

    <!-- 底部鼠尾草共性带 -->
    ${
      common
        ? `<rect x="26" y="216" width="488" height="36" fill="${PALETTE.sage}"/>
           <rect x="38" y="223" width="32" height="22" fill="${PALETTE.green}"/>
           <circle cx="50" cy="234" r="6.5" fill="#0A0A08"/>
           <circle cx="58" cy="234" r="6.5" fill="#FFFFFF"/>
           <text x="82" y="238" fill="#0A0A08" font-size="12" font-weight="900">共性</text>
           <line x1="118" y1="224" x2="118" y2="244" stroke="rgba(10,10,8,0.28)"/>
           <text x="130" y="238" fill="#0A0A08" font-size="11.5" font-weight="700">都旨在解决问题、提升效果、服务目标受众。</text>`
        : `<rect x="26" y="216" width="488" height="36" fill="#FCECE9" stroke="#B8271E" stroke-dasharray="5 4"/>
           <text x="270" y="238" text-anchor="middle" fill="#B8271E" font-size="11.5" font-weight="700">共性带已抽离：只剩对立，缺少共同决策基准</text>`
    }
  </svg>`;

  const info = XRAY_LAYERS.find((x) => x.id === lastXrayLayer) || XRAY_LAYERS[0];
  const isOn = xrayState[info.id];
  const activeCount = Object.values(xrayState).filter(Boolean).length;
  xrayReadout.textContent = `当前保留 ${activeCount}/4 层骨架 · [${info.key} ${isOn ? "已开启" : "已剥离"}]：${isOn ? info.withMsg : info.withoutMsg}`;
}

$$(".xtog").forEach((b) =>
  b.addEventListener("click", () => {
    const id = b.dataset.xlayer;
    xrayState[id] = !xrayState[id];
    lastXrayLayer = id;
    b.classList.toggle("is-on", xrayState[id]);
    b.setAttribute("aria-pressed", String(xrayState[id]));
    renderXray();
  })
);
renderXray();

// ==================== 4. 第 03 节：历史里程碑 + 同小类链接 ====================
const msRail = $("#milestone-rail");
const msStage = $("#milestone-stage");
let msIdx = 3; // 默认展示 OOXML twoTxTwoObj vs twoObj 里程碑

function milestoneSvg(kind) {
  if (kind === "multiples") {
    return `<svg viewBox="0 0 260 156" aria-hidden="true">
      <text x="14" y="20" fill="#79ADFF" font-size="10" font-family="Space Mono, monospace">SMALL MULTIPLES · 1990</text>
      ${[0, 1, 2]
        .map(
          (i) => `<rect x="${14 + i * 80}" y="32" width="70" height="84" fill="#142220" stroke="#52DCA9" stroke-width="1.2"/>
          <polyline points="${22 + i * 80},${98 - i * 10} ${42 + i * 80},${78 - i * 6} ${60 + i * 80},${64 - i * 12} ${76 + i * 80},${48 + i * 8}" fill="none" stroke="${i === 1 ? "#52DCA9" : "#79ADFF"}" stroke-width="2"/>`
        )
        .join("")}
      <text x="130" y="138" text-anchor="middle" fill="#C6D1CC" font-size="10.5">同视野同尺度并置：答案直接浮现</text>
    </svg>`;
  }
  if (kind === "common") {
    return `<svg viewBox="0 0 260 156" aria-hidden="true">
      <text x="14" y="20" fill="#79ADFF" font-size="10" font-family="Space Mono, monospace">COMMON REGION · 1992</text>
      <rect x="20" y="34" width="96" height="54" fill="rgba(121,173,255,0.16)" stroke="#79ADFF"/>
      <rect x="144" y="34" width="96" height="54" fill="rgba(82,220,169,0.16)" stroke="#52DCA9"/>
      <rect x="20" y="98" width="220" height="32" fill="rgba(82,220,169,0.28)" stroke="#52DCA9" stroke-width="1.6"/>
      <circle cx="44" cy="114" r="7" fill="#0D1615"/>
      <circle cx="53" cy="114" r="7" fill="#F6EFE4"/>
      <text x="146" y="118" text-anchor="middle" fill="#F6EFE4" font-size="11" font-weight="700">闭合共同区域收束双方</text>
    </svg>`;
  }
  if (kind === "align") {
    return `<svg viewBox="0 0 260 156" aria-hidden="true">
      <text x="14" y="20" fill="#79ADFF" font-size="10" font-family="Space Mono, monospace">STRUCTURAL ALIGNMENT · 1994</text>
      <line x1="130" y1="32" x2="130" y2="128" stroke="#F6EFE4" stroke-width="1.5"/>
      ${[46, 78, 110]
        .map(
          (y, i) => `
          <rect x="20" y="${y - 9}" width="76" height="18" fill="rgba(121,173,255,0.22)" stroke="#79ADFF"/>
          <rect x="164" y="${y - 9}" width="76" height="18" fill="rgba(82,220,169,0.22)" stroke="#52DCA9"/>
          <line x1="96" y1="${y}" x2="164" y2="${y}" stroke="#F6EFE4" stroke-dasharray="3 3"/>
          <circle cx="130" cy="${y}" r="3.5" fill="#52DCA9"/>
          <text x="58" y="${y + 4}" text-anchor="middle" fill="#F6EFE4" font-size="9.5">维度 ${i + 1} · A</text>
          <text x="202" y="${y + 4}" text-anchor="middle" fill="#F6EFE4" font-size="9.5">维度 ${i + 1} · B</text>`
        )
        .join("")}
    </svg>`;
  }
  return `<svg viewBox="0 0 260 156" aria-hidden="true">
    <text x="14" y="18" fill="#C6D1CC" font-size="9.5" font-family="Space Mono, monospace">338 twoObj</text>
    <rect x="14" y="24" width="106" height="94" fill="#142220" stroke="rgba(246,239,228,0.4)"/>
    <rect x="22" y="32" width="90" height="10" fill="rgba(246,239,228,0.24)"/>
    <rect x="22" y="48" width="42" height="62" fill="rgba(121,173,255,0.18)" stroke="#79ADFF"/>
    <rect x="70" y="48" width="42" height="62" fill="rgba(121,173,255,0.18)" stroke="#79ADFF"/>
    <text x="67" y="136" text-anchor="middle" fill="#C6D1CC" font-size="9.5">仅双内容框</text>

    <text x="140" y="18" fill="#52DCA9" font-size="9.5" font-family="Space Mono, monospace">339 twoTxTwoObj</text>
    <rect x="140" y="24" width="106" height="94" fill="#142220" stroke="#52DCA9" stroke-width="1.5"/>
    <rect x="148" y="32" width="90" height="10" fill="rgba(246,239,228,0.24)"/>
    <rect x="148" y="46" width="41" height="11" fill="#1A4FE4"/>
    <rect x="197" y="46" width="41" height="11" fill="#22A37C"/>
    <rect x="148" y="61" width="41" height="49" fill="rgba(121,173,255,0.18)" stroke="#79ADFF"/>
    <rect x="197" y="61" width="41" height="49" fill="rgba(82,220,169,0.18)" stroke="#52DCA9"/>
    <line x1="193" y1="46" x2="193" y2="110" stroke="#F6EFE4" stroke-dasharray="3 2"/>
    <text x="193" y="136" text-anchor="middle" fill="#52DCA9" font-size="9.5" font-weight="700">双标头 + 双内容 + 对比轴</text>
  </svg>`;
}

function renderMilestones() {
  msRail.innerHTML = MILESTONES.map(
    (m, i) => `
    <button type="button" class="ms-tab" role="tab" aria-selected="${i === msIdx}" data-ms="${i}">
      <span class="ms-year">${m.year}</span>
      <span class="ms-tag">${m.tag}</span>
      <span class="ms-who">${m.who}</span>
    </button>`
  ).join("");

  const cur = MILESTONES[msIdx];
  msStage.innerHTML = `
    <div class="ms-detail">
      <h3>${cur.year} · ${cur.who}</h3>
      <p class="ms-place">${cur.place}</p>
      <p>${cur.summary}</p>
    </div>
    <div class="ms-wireframe">${milestoneSvg(cur.wireframe)}</div>`;

  $$(".ms-tab", msRail).forEach((btn) =>
    btn.addEventListener("click", () => {
      msIdx = +btn.dataset.ms;
      renderMilestones();
    })
  );
}
renderMilestones();

$("#sibling-list").innerHTML = SIBLING_SLIDES.map(
  (s) => `
  <li>
    <span class="sib-id">${s.id}</span>
    <a href="https://layout.xiaoxiaodong.ai/${s.id}/play/" target="_blank" rel="noopener">${s.name}</a>
    <p>${s.role}</p>
  </li>`
).join("");

// ==================== 5. 第 04 节：场景分诊滑块工作台 ====================
const trState = { count: 2, dims: 3, relation: "compare" };
const elTrCount = $("#tr-count");
const elTrCountVal = $("#tr-count-val");
const elTrDims = $("#tr-dims");
const elTrDimsVal = $("#tr-dims-val");
const elTrResult = $("#triage-result");

function triageWireSvg(type) {
  if (type === "comp339") {
    return `<svg viewBox="0 0 210 132" aria-hidden="true">
      <rect x="12" y="12" width="78" height="18" fill="${PALETTE.blue}"/>
      <rect x="120" y="12" width="78" height="18" fill="${PALETTE.green}"/>
      <circle cx="105" cy="21" r="10" fill="#0A0A08"/>
      <text x="105" y="24" text-anchor="middle" fill="#FFF" font-size="8" font-weight="700">VS</text>
      <line x1="105" y1="31" x2="105" y2="94" stroke="#0A0A08" stroke-width="1.5"/>
      ${[44, 62, 80].map((y) => `<rect x="18" y="${y}" width="66" height="10" fill="#E5ECFB"/><rect x="126" y="${y}" width="66" height="10" fill="#E1F2EB"/><line x1="84" y1="${y + 5}" x2="126" y2="${y + 5}" stroke="#555" stroke-dasharray="3 2"/><circle cx="105" cy="${y + 5}" r="3" fill="#0A0A08"/>`).join("")}
      <rect x="12" y="102" width="186" height="18" fill="${PALETTE.sage}"/>
    </svg>`;
  }
  if (type === "threeCol") {
    return `<svg viewBox="0 0 210 132" aria-hidden="true">
      ${[12, 76, 140].map((x, i) => `<rect x="${x}" y="14" width="58" height="16" fill="${i === 1 ? PALETTE.green : "#7E848C"}"/><rect x="${x}" y="38" width="58" height="58" fill="${i === 1 ? "#E1F2EB" : "#EFE9DF"}" stroke="#0A0A08" stroke-width="1"/>`).join("")}
      <rect x="12" y="104" width="186" height="16" fill="${PALETTE.sage}"/>
    </svg>`;
  }
  if (type === "matrix") {
    return `<svg viewBox="0 0 210 132" aria-hidden="true">
      <rect x="12" y="12" width="186" height="16" fill="#0A0A08"/>
      ${[34, 52, 70, 88, 106].map((y) => `<line x1="12" y1="${y}" x2="198" y2="${y}" stroke="rgba(10,10,8,0.2)"/>`).join("")}
      ${[58, 94, 130, 166].map((x) => `<line x1="${x}" y1="28" x2="${x}" y2="118" stroke="rgba(10,10,8,0.2)"/>`).join("")}
      <rect x="130" y="28" width="36" height="90" fill="rgba(34,163,124,0.18)"/>
    </svg>`;
  }
  if (type === "timeline") {
    return `<svg viewBox="0 0 210 132" aria-hidden="true">
      <line x1="20" y1="66" x2="186" y2="66" stroke="#0A0A08" stroke-width="2"/>
      <path d="M180 60 L190 66 L180 72" fill="none" stroke="#0A0A08" stroke-width="2"/>
      ${[36, 96, 156].map((x, i) => `<circle cx="${x}" cy="66" r="8" fill="${i === 2 ? PALETTE.green : PALETTE.blue}"/><rect x="${x - 20}" y="26" width="40" height="24" fill="#EFE9DF" stroke="#0A0A08"/>`).join("")}
    </svg>`;
  }
  if (type === "chart") {
    return `<svg viewBox="0 0 210 132" aria-hidden="true">
      <line x1="24" y1="20" x2="24" y2="110" stroke="#0A0A08" stroke-width="1.5"/>
      <line x1="24" y1="110" x2="194" y2="110" stroke="#0A0A08" stroke-width="1.5"/>
      <polyline points="34,94 74,80 114,68 154,50 186,34" fill="none" stroke="${PALETTE.blue}" stroke-width="2.5"/>
      <polyline points="34,98 74,92 114,76 154,68 186,62" fill="none" stroke="${PALETTE.green}" stroke-width="2.5"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 210 132" aria-hidden="true">
    <rect x="14" y="16" width="84" height="100" fill="#E5ECFB" stroke="#0A0A08"/>
    <rect x="112" y="16" width="84" height="100" fill="#EFE9DF" stroke="#0A0A08"/>
    <text x="56" y="70" text-anchor="middle" fill="#123EC2" font-size="11" font-weight="700">配图/图表</text>
    <text x="154" y="70" text-anchor="middle" fill="#0A0A08" font-size="11" font-weight="700">核心结论</text>
  </svg>`;
}

function renderTriage() {
  elTrCountVal.textContent = `${trState.count} 个`;
  elTrDimsVal.textContent = `${trState.dims} 条`;
  const res = triageScenario(trState);
  elTrResult.innerHTML = `
    <div>
      <span class="tr-badge ${res.tone}">${res.badge}</span>
      <h4>${res.verdict}</h4>
      <p>${res.why}</p>
      <p class="tr-tip">${res.tip}</p>
    </div>
    <div class="tr-wire">${triageWireSvg(res.layoutType)}</div>`;
}

elTrCount.addEventListener("input", () => {
  trState.count = +elTrCount.value;
  renderTriage();
});
elTrDims.addEventListener("input", () => {
  trState.dims = +elTrDims.value;
  renderTriage();
});
$$("[data-rel]").forEach((b) =>
  b.addEventListener("click", () => {
    trState.relation = b.dataset.rel;
    $$("[data-rel]").forEach((x) => x.classList.toggle("is-active", x.dataset.rel === trState.relation));
    renderTriage();
  })
);
renderTriage();

// ==================== 6. 第 05 节：四类翻车诊室（拉帘 + 灰阶模拟） ====================
let clinicIdx = 0;
let curtainPct = 50;
const elCurtainBox = $("#curtain-box");
const elCurtainBefore = $("#curtain-before");
const elCurtainAfter = $("#curtain-after");
const elCurtainDivider = $("#curtain-divider");
const elCurtainRange = $("#ctl-curtain");
const elClinicCaption = $("#clinic-caption");
const elBtnGray = $("#btn-grayscale");

function buildClinicSlide(id, fixed) {
  const bg = "#F6EFE4";
  const aCol = id === "coloronly" && !fixed ? "#D83B2D" : PALETTE.blue;
  const bCol = id === "coloronly" && !fixed ? "#32A04E" : PALETTE.green;
  const badge = fixed ? "修复后 · 339 规范" : "修复前 · 常见翻车";
  const badgeBg = fixed ? PALETTE.green : PALETTE.danger;
  const badgeX = fixed ? 498 : 14;

  let leftItems = ["处理速度快", "资源占用低", "适合批量任务"];
  let rightItems = ["输出更精确", "细节控制强", "适合关键场景"];
  let rightYs = [132, 174, 216];
  let showCommon = true;
  let showShapes = true;
  let leftShape = "circle";
  let rightShape = "square";

  if (id === "apples" && !fixed) {
    leftItems = ["响应 120ms", "内存占 2GB", "支持万级并发"];
    rightItems = ["品牌口碑好", "7×24 售后", "界面更美观"];
  }
  if (id === "nobase" && !fixed) {
    leftItems = ["× 老旧笨重", "× 频繁卡顿", "× 维护困难"];
    rightItems = ["✓ 全新架构", "✓ 速度极快", "✓ 零成本维护"];
    showCommon = false;
  }
  if (id === "coloronly" && !fixed) {
    leftShape = "square";
    rightShape = "square";
  }
  if (id === "textwall" && !fixed) {
    leftItems = ["快", "省资源", "批量佳"];
    rightItems = [
      "输出精度极高并附带完整校验日志与回滚机制",
      "细粒度参数支持逐层配置且兼容历史多版本规则",
      "关键交易链路可保障零差错交付与全程人工复核",
    ];
    rightYs = [122, 178, 232];
  }

  return `<svg viewBox="0 0 640 312" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <rect width="640" height="312" fill="${bg}"/>
    <rect x="${badgeX}" y="10" width="128" height="22" fill="${badgeBg}"/>
    <text x="${badgeX + 64}" y="25" text-anchor="middle" fill="#FFF" font-size="11.5" font-weight="700">${badge}</text>

    <rect x="28" y="42" width="256" height="34" fill="${aCol}"/>
    <rect x="356" y="42" width="256" height="34" fill="${bCol}"/>
    <text x="156" y="64" text-anchor="middle" fill="#FFF" font-size="15" font-weight="900">方案 A</text>
    <text x="484" y="64" text-anchor="middle" fill="#FFF" font-size="15" font-weight="900">方案 B</text>
    <circle cx="320" cy="59" r="18" fill="#0A0A08"/>
    <text x="320" y="64" text-anchor="middle" fill="#FFF" font-size="12" font-weight="800">VS</text>
    <line x1="320" y1="77" x2="320" y2="246" stroke="#0A0A08" stroke-width="1.8"/>

    ${
      showShapes
        ? leftShape === "circle"
          ? `<circle cx="156" cy="100" r="16" fill="${aCol}"/>`
          : `<rect x="140" y="84" width="32" height="32" fill="${aCol}"/>`
        : ""
    }
    ${
      showShapes
        ? rightShape === "square"
          ? `<rect x="468" y="84" width="32" height="32" fill="${bCol}"/>`
          : `<circle cx="484" cy="100" r="16" fill="${bCol}"/>`
        : ""
    }

    ${[0, 1, 2]
      .map((i) => {
        const ly = [132, 174, 216][i];
        const ry = rightYs[i];
        const crooked = Math.abs(ry - ly) > 4 || (id === "apples" && !fixed);
        return `
        <line x1="258" y1="${ly + 12}" x2="382" y2="${ry + 12}" stroke="${crooked ? PALETTE.danger : "#5A5850"}" stroke-width="1.5" stroke-dasharray="4 4"/>
        ${!crooked ? `<circle cx="320" cy="${ly + 12}" r="4" fill="#0A0A08"/>` : ""}
        <rect x="40" y="${ly}" width="214" height="24" fill="#FBF7F0" stroke="rgba(10,10,8,0.18)"/>
        <circle cx="56" cy="${ly + 12}" r="7" fill="${aCol}"/>
        <text x="70" y="${ly + 16}" fill="#0A0A08" font-size="12" font-weight="700">${leftItems[i]}</text>
        <rect x="386" y="${ry}" width="214" height="${id === "textwall" && !fixed ? 42 : 24}" fill="#FBF7F0" stroke="${crooked ? PALETTE.danger : "rgba(10,10,8,0.18)"}"/>
        <circle cx="402" cy="${ry + 12}" r="7" fill="${bCol}"/>
        <text x="416" y="${ry + 16}" fill="#0A0A08" font-size="${id === "textwall" && !fixed ? 10 : 12}" font-weight="700">${rightItems[i].slice(0, 14)}</text>
        ${id === "textwall" && !fixed ? `<text x="416" y="${ry + 32}" fill="#4A4943" font-size="9.5">${rightItems[i].slice(14, 30)}</text>` : ""}`;
      })
      .join("")}

    ${
      showCommon
        ? `<rect x="28" y="260" width="584" height="38" fill="${PALETTE.sage}"/>
           <rect x="42" y="268" width="32" height="22" fill="${PALETTE.green}"/>
           <circle cx="54" cy="279" r="6" fill="#0A0A08"/><circle cx="62" cy="279" r="6" fill="#FFF"/>
           <text x="86" y="283" fill="#0A0A08" font-size="13" font-weight="900">共性</text>
           <text x="134" y="283" fill="#0A0A08" font-size="12" font-weight="700">都旨在解决问题、提升效果、服务目标受众。</text>`
        : `<rect x="28" y="260" width="584" height="38" fill="#FCECE9" stroke="#B8271E" stroke-dasharray="5 4"/>
           <text x="320" y="283" text-anchor="middle" fill="#B8271E" font-size="12" font-weight="700">缺少共同前提 · 沦为片面拉踩</text>`
    }
  </svg>`;
}

function updateCurtain(pct) {
  curtainPct = clamp(pct, 8, 92);
  elCurtainBefore.style.clipPath = `inset(0 ${100 - curtainPct}% 0 0)`;
  elCurtainDivider.style.left = `${curtainPct}%`;
  elCurtainRange.value = String(Math.round(curtainPct));
}

function renderClinic() {
  const c = CLINIC_CASES[clinicIdx];
  elCurtainBefore.innerHTML = buildClinicSlide(c.id, false);
  elCurtainAfter.innerHTML = buildClinicSlide(c.id, true);
  elClinicCaption.innerHTML = `
    <div class="cc-item cc-bad"><strong>修复前 · ${c.badTag}</strong>${c.badNote}</div>
    <div class="cc-item cc-good"><strong>修复后 · ${c.goodTag}</strong>${c.goodNote}</div>`;
  updateCurtain(curtainPct);
}

$$(".ctab").forEach((b) =>
  b.addEventListener("click", () => {
    clinicIdx = +b.dataset.clinic;
    $$(".ctab").forEach((x) => {
      const active = +x.dataset.clinic === clinicIdx;
      x.classList.toggle("is-active", active);
      x.setAttribute("aria-selected", String(active));
    });
    renderClinic();
  })
);

elCurtainRange.addEventListener("input", () => updateCurtain(+elCurtainRange.value));

let draggingCurtain = false;
const setCurtainFromEvent = (e) => {
  const r = elCurtainBox.getBoundingClientRect();
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  updateCurtain(((cx - r.left) / r.width) * 100);
};
elCurtainBox.addEventListener("pointerdown", (e) => {
  draggingCurtain = true;
  elCurtainBox.setPointerCapture(e.pointerId);
  setCurtainFromEvent(e);
});
elCurtainBox.addEventListener("pointermove", (e) => {
  if (draggingCurtain) setCurtainFromEvent(e);
});
elCurtainBox.addEventListener("pointerup", () => {
  draggingCurtain = false;
});

elBtnGray.addEventListener("click", () => {
  const on = !elCurtainBox.classList.contains("is-gray");
  elCurtainBox.classList.toggle("is-gray", on);
  elBtnGray.setAttribute("aria-pressed", String(on));
  elBtnGray.textContent = on ? "灰阶 / 褪色投影模拟：开" : "灰阶 / 褪色投影模拟：关";
});

renderClinic();

// ==================== 7. 第 06 节：单变量四选一小练习 ====================
const quizGrid = $("#quiz-grid");
const quizFeedback = $("#quiz-feedback");
const qfBadge = $("#qf-badge");
const qfText = $("#qf-text");

function quizSvg(id) {
  // 四张草图同字、同色、同边距，仅变一项空间变量
  const isCanyon = id === "C";
  const isCross = id === "A";
  const isNested = id === "D";
  const lx = isCanyon ? 12 : 30;
  const rx = isCanyon ? 180 : 162;
  const rw = 88;
  const ys = [86, 114, 142];
  const rOrder = isCross ? [2, 0, 1] : [0, 1, 2];

  return `<svg viewBox="0 0 280 200" aria-hidden="true">
    <rect width="280" height="200" fill="#F6EFE4"/>
    <rect x="12" y="14" width="110" height="22" fill="${PALETTE.blue}"/>
    <rect x="158" y="14" width="110" height="22" fill="${PALETTE.green}"/>
    <text x="67" y="28" text-anchor="middle" fill="#FFF" font-size="10" font-weight="700">离线批处理</text>
    <text x="213" y="28" text-anchor="middle" fill="#FFF" font-size="10" font-weight="700">实时流计算</text>

    ${
      !isCanyon
        ? `<circle cx="140" cy="25" r="11" fill="#0A0A08"/>
           <text x="140" y="28.5" text-anchor="middle" fill="#FFF" font-size="8.5" font-weight="800">VS</text>
           <line x1="140" y1="36" x2="140" y2="160" stroke="#0A0A08" stroke-width="1.5"/>`
        : ""
    }

    <circle cx="67" cy="58" r="13" fill="${PALETTE.blue}"/>
    <rect x="200" y="45" width="26" height="26" fill="${PALETTE.green}"/>

    ${[0, 1, 2]
      .map((i) => {
        const ly = ys[i];
        const rSlot = rOrder.indexOf(i);
        const ry = ys[rSlot];
        return `
        <line x1="${lx + rw + 2}" y1="${ly + 9}" x2="${rx - 2}" y2="${ry + 9}" stroke="#5A5850" stroke-width="1.2" stroke-dasharray="3 3"/>
        ${!isCanyon && !isCross ? `<circle cx="140" cy="${ly + 9}" r="3" fill="#0A0A08"/>` : ""}
        <rect x="${lx}" y="${ly}" width="${rw}" height="18" fill="#FBF7F0" stroke="rgba(10,10,8,0.2)"/>
        <circle cx="${lx + 10}" cy="${ly + 9}" r="4.5" fill="${PALETTE.blue}"/>
        <text x="${lx + 20}" y="${ly + 12.5}" fill="#0A0A08" font-size="8.5" font-weight="700">${["吞吐极高", "成本较低", "适合离线"][i]}</text>`;
      })
      .join("")}

    ${rOrder
      .map((itemIdx, slot) => {
        const ry = ys[slot];
        return `
        <rect x="${rx}" y="${ry}" width="${rw}" height="18" fill="#FBF7F0" stroke="rgba(10,10,8,0.2)"/>
        <circle cx="${rx + 10}" cy="${ry + 9}" r="4.5" fill="${PALETTE.green}"/>
        <text x="${rx + 20}" y="${ry + 12.5}" fill="#0A0A08" font-size="8.5" font-weight="700">${["毫秒延迟", "算力较高", "适合风控"][itemIdx]}</text>`;
      })
      .join("")}

    ${
      isNested
        ? `<rect x="158" y="166" width="110" height="22" fill="${PALETTE.sage}"/>
           <text x="213" y="180" text-anchor="middle" fill="#0A0A08" font-size="8" font-weight="700">共性：同源数据指标</text>`
        : `<rect x="12" y="166" width="256" height="22" fill="${PALETTE.sage}"/>
           <rect x="20" y="171" width="18" height="12" fill="${PALETTE.green}"/>
           <circle cx="27" cy="177" r="3.5" fill="#0A0A08"/><circle cx="31" cy="177" r="3.5" fill="#FFF"/>
           <text x="46" y="180" fill="#0A0A08" font-size="8.5" font-weight="700">共性：产出同一套核心业务口径</text>`
    }
  </svg>`;
}

function renderQuiz() {
  quizGrid.innerHTML = QUIZ_ITEMS.map(
    (q) => `
    <button type="button" class="quiz-card" data-quiz="${q.id}">
      ${quizSvg(q.id)}
      <span class="quiz-lbl">${q.label}</span>
    </button>`
  ).join("");

  $$(".quiz-card", quizGrid).forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = btn.dataset.quiz;
      const item = QUIZ_ITEMS.find((x) => x.id === id);
      $$(".quiz-card", quizGrid).forEach((c) => {
        c.classList.remove("is-picked-ok", "is-picked-bad");
        if (c.dataset.quiz === id) {
          c.classList.add(item.correct ? "is-picked-ok" : "is-picked-bad");
        }
      });
      quizFeedback.hidden = false;
      quizFeedback.classList.toggle("is-wrong", !item.correct);
      qfBadge.textContent = item.correct ? `✓ ${item.label} · 正确` : `× ${item.label} · 再看一眼`;
      qfText.textContent = item.feedback;
    })
  );
}

$("#btn-quiz-reset").addEventListener("click", () => {
  $$(".quiz-card", quizGrid).forEach((c) => c.classList.remove("is-picked-ok", "is-picked-bad"));
  quizFeedback.hidden = true;
});
renderQuiz();

// ==================== 8. 第 07 节：原海报灯箱（复用 #poster.src，不重复内联） ====================
const posterImg = $("#poster");
const posterBtn = $("#poster-btn");
const lightbox = $("#lightbox");
const lbStage = $("#lb-stage");
const lbImg = $("#lb-img");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLb() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  $("#lb-reset").textContent = `${Math.round(lbScale * 100)}%`;
}

function openLb() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLb();
  lightbox.hidden = false;
  $("#lb-close").focus();
}

function closeLb() {
  lightbox.hidden = true;
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLb);
$("#lb-close").addEventListener("click", closeLb);
$("#lb-in").addEventListener("click", () => {
  lbScale = clamp(+(lbScale + 0.35).toFixed(2), 0.6, 4);
  applyLb();
});
$("#lb-out").addEventListener("click", () => {
  lbScale = clamp(+(lbScale - 0.35).toFixed(2), 0.6, 4);
  applyLb();
});
$("#lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLb();
});

lbStage.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    lbScale = clamp(+(lbScale + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2), 0.6, 4);
    applyLb();
  },
  { passive: false }
);

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) {
    closeLb();
    return;
  }
  lbDrag = { x: e.clientX - lbX, y: e.clientY - lbY };
  lbStage.setPointerCapture(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbDrag.x;
  lbY = e.clientY - lbDrag.y;
  applyLb();
});
lbStage.addEventListener("pointerup", () => {
  lbDrag = null;
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLb();
});

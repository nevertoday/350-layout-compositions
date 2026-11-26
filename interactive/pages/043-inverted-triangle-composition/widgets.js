// 043 倒三角构图 · 第 01–07 节独立交互组件（相邻两节控件类型零重复）

import {
  COMPARE_MODES,
  ANATOMY_ZONES,
  LINEAGE_ITEMS,
  APPLICATIONS,
  ANTIPATTERNS,
  QUIZ_OPTIONS,
} from "./model.js";
import { reducedMotion } from "../../lib/stage.js";

// ==================== 01 物理稳态对比仪 + 轻推脉冲 ====================
export function initCompareWidget() {
  const svg = document.getElementById("pendulum-svg");
  const tabs = [...document.querySelectorAll(".comp-tab")];
  const nudgeBtn = document.getElementById("nudge-btn");
  const nameEl = document.getElementById("comp-name");
  const tagsEl = document.getElementById("comp-tags");
  const noteEl = document.getElementById("comp-note");

  let mode = "inverted";
  let angle = 0;
  let vel = 0;
  let raf = 0;

  function render(deg) {
    const m = COMPARE_MODES[mode];
    const pivotY = mode === "centered" ? 115 : mode === "upright" ? 186 : 192;
    const pivotX = 210;

    let shapeMarkup = "";
    let cgY = 115;
    if (mode === "centered") {
      cgY = 115;
      shapeMarkup = `
        <rect x="148" y="53" width="124" height="124" fill="rgba(55,99,121,0.22)" stroke="#A9BCC6" stroke-width="1.6" stroke-dasharray="5 4"/>
        <circle cx="210" cy="115" r="30" fill="#376379" stroke="#EEF4F7" stroke-width="1.5"/>
        <circle cx="210" cy="115" r="5" fill="#EEF4F7"/>
      `;
    } else if (mode === "upright") {
      cgY = 148;
      shapeMarkup = `
        <polygon points="210,44 294,186 126,186" fill="rgba(55,99,121,0.34)" stroke="#EEF4F7" stroke-width="2"/>
        <circle cx="210" cy="148" r="18" fill="#376379"/>
        <circle cx="210" cy="44" r="4" fill="#EEF4F7"/>
        <circle cx="294" cy="186" r="4" fill="#EEF4F7"/>
        <circle cx="126" cy="186" r="4" fill="#EEF4F7"/>
        <line x1="126" y1="186" x2="294" y2="186" stroke="#5EE6B8" stroke-width="3"/>
      `;
    } else {
      cgY = 92;
      shapeMarkup = `
        <polygon points="122,42 298,42 210,192" fill="rgba(55,99,121,0.38)" stroke="#6ECDF0" stroke-width="2.2"/>
        <circle cx="210" cy="92" r="24" fill="#376379" stroke="#8CE4FF" stroke-width="1.4"/>
        <line x1="122" y1="42" x2="205" y2="183" stroke="#6ECDF0" stroke-width="1.4" stroke-dasharray="5 4"/>
        <line x1="298" y1="42" x2="215" y2="183" stroke="#6ECDF0" stroke-width="1.4" stroke-dasharray="5 4"/>
        <circle cx="122" cy="42" r="4" fill="#EEF4F7"/>
        <circle cx="298" cy="42" r="4" fill="#EEF4F7"/>
        <circle cx="210" cy="192" r="7" fill="#8CE4FF"/>
      `;
    }

    const cgLabel = mode === "inverted" ? "视觉重心 67% 高位（上重下尖）" : mode === "upright" ? "视觉重心 33% 低位（底宽稳坐）" : "视觉重心 50% 居中（四向均衡）";
    const tiltBadge = Math.abs(deg) > 0.25 ? `当前摆角 ${deg > 0 ? "+" : ""}${deg.toFixed(1)}°` : "静立中 · 点「轻推一下」测试";

    svg.innerHTML = `
      <rect width="420" height="230" fill="#10171A" rx="6"/>
      <line x1="36" y1="192" x2="384" y2="192" stroke="#2A3E4B" stroke-width="1.4"/>
      <line x1="210" y1="22" x2="210" y2="206" stroke="rgba(110,205,240,0.22)" stroke-dasharray="4 4"/>
      <g transform="rotate(${deg.toFixed(2)} ${pivotX} ${pivotY})">
        ${shapeMarkup}
        <circle cx="210" cy="${cgY}" r="9" fill="#10171A" stroke="#F3C46B" stroke-width="1.8"/>
        <text x="210" y="${cgY + 3.5}" text-anchor="middle" fill="#EEF4F7" font-size="10" font-family="Space Mono, monospace">G</text>
      </g>
      ${mode === "inverted" ? `<ellipse cx="210" cy="200" rx="44" ry="7" fill="none" stroke="rgba(110,205,240,0.45)" stroke-width="1.2"/><ellipse cx="210" cy="202" rx="74" ry="11" fill="none" stroke="rgba(110,205,240,0.22)" stroke-width="1"/>` : ""}
      <text x="16" y="22" fill="#A9BCC6" font-size="11.5" font-family="Space Mono, Noto Sans SC, monospace">${cgLabel}</text>
      <text x="404" y="22" text-anchor="end" fill="#6ECDF0" font-size="11.5" font-family="Space Mono, Noto Sans SC, monospace">${tiltBadge}</text>
    `;

    nameEl.textContent = m.name;
    tagsEl.textContent = m.tags;
    noteEl.textContent = m.note;
  }

  function step() {
    const m = COMPARE_MODES[mode];
    const k = mode === "inverted" ? 0.045 : 0.14;
    vel = (vel - k * angle) * m.damping;
    angle += vel;
    render(angle);
    if (Math.abs(angle) > 0.08 || Math.abs(vel) > 0.05) {
      raf = requestAnimationFrame(step);
    } else {
      angle = 0;
      vel = 0;
      raf = 0;
      render(0);
    }
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      tabs.forEach((b) => b.classList.toggle("is-active", b === btn));
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      angle = 0;
      vel = 0;
      render(0);
    });
  });

  nudgeBtn.addEventListener("click", () => {
    const m = COMPARE_MODES[mode];
    if (reducedMotion.matches) {
      angle = angle ? 0 : m.maxTilt * 0.7;
      render(angle);
      return;
    }
    vel = m.maxTilt * 0.36;
    if (!raf) raf = requestAnimationFrame(step);
  });

  render(0);
}

// ==================== 02 三层骨架抽层解体台 ====================
export function initAnatomyWidget() {
  const controls = document.getElementById("anatomy-controls");
  const svg = document.getElementById("anatomy-svg");
  const verdict = document.getElementById("anatomy-verdict");

  const active = { open: true, guide: true, point: true };

  function buildControls() {
    controls.innerHTML = "";
    for (const z of ANATOMY_ZONES) {
      const card = document.createElement("div");
      card.className = `zone-card${active[z.id] ? "" : " is-off"}`;
      card.innerHTML = `
        <div class="zone-top">
          <div><strong>${z.title}</strong><span class="zone-en" lang="en">${z.en}</span></div>
          <button type="button" class="zone-toggle" data-zone="${z.id}" aria-pressed="${active[z.id]}">
            ${active[z.id] ? "已开启 · 点此抽掉" : "已抽掉 · 点此恢复"}
          </button>
        </div>
        <p class="zone-quote">${active[z.id] ? `「${z.posterQuote}」` : z.offExplain}</p>
      `;
      card.querySelector(".zone-toggle").addEventListener("click", () => {
        active[z.id] = !active[z.id];
        buildControls();
        renderSvg();
      });
      controls.appendChild(card);
    }
  }

  function renderSvg() {
    const hasOpen = active.open;
    const hasGuide = active.guide;
    const hasPoint = active.point;

    const topY = hasOpen ? 46 : 22;
    const peakY = hasOpen ? 102 : 30;
    const blX = hasGuide ? 230 : 102;
    const brX = hasGuide ? 230 : 358;
    const botY = 278;

    const broken = ANATOMY_ZONES.filter((z) => !active[z.id]);

    svg.innerHTML = `
      <rect width="460" height="320" fill="#10171A" rx="6"/>
      <defs>
        <clipPath id="anat-clip">
          <polygon points="84,${topY} 376,${topY} ${brX},${botY} ${blX},${botY}"/>
        </clipPath>
      </defs>
      <g clip-path="url(#anat-clip)">
        <rect x="0" y="0" width="460" height="156" fill="#6F8496"/>
        <polygon points="128,156 196,94 234,${peakY} 286,110 342,156" fill="#E9F2F7"/>
        <polygon points="234,${peakY} 286,110 342,156 232,156" fill="#5D839F"/>
        <rect x="0" y="156" width="460" height="164" fill="#0B2E40"/>
        <polygon points="128,156 342,156 266,242 230,276 194,240" fill="#174D66"/>
        <line x1="0" y1="156" x2="460" y2="156" stroke="#C8E6F5" stroke-width="1.5"/>
      </g>
      <polygon points="84,${topY} 376,${topY} ${brX},${botY} ${blX},${botY}" fill="none" stroke="${hasGuide ? "#6ECDF0" : "#FF7B66"}" stroke-width="2" stroke-dasharray="6 5"/>
      ${!hasOpen ? `<rect x="84" y="${topY}" width="292" height="22" fill="rgba(255,123,102,0.28)"/><text x="230" y="${topY + 15}" text-anchor="middle" fill="#FF7B66" font-size="11.5" font-weight="700">压顶窒息：上方无呼吸留白</text>` : `<text x="230" y="34" text-anchor="middle" fill="#6ECDF0" font-size="11.5">上区：宽阔呼吸留白</text>`}
      ${hasGuide ? `<text x="394" y="180" fill="#6ECDF0" font-size="11.5">中区</text><text x="394" y="196" fill="#A9BCC6" font-size="11">斜线收束</text>` : `<text x="390" y="180" fill="#FF7B66" font-size="11.5">无收束</text><text x="390" y="196" fill="#FF7B66" font-size="11">退成矩形</text>`}
      ${hasPoint ? `
        <ellipse cx="230" cy="288" rx="46" ry="7" fill="none" stroke="rgba(110,205,240,0.48)" stroke-width="1.4"/>
        <circle cx="230" cy="${botY}" r="9" fill="#8CE4FF"/>
      ` : `
        <line x1="230" y1="264" x2="230" y2="312" stroke="#FF7B66" stroke-width="2" stroke-dasharray="4 3"/>
        <text x="230" y="308" text-anchor="middle" fill="#FF7B66" font-size="11.5">底部无落点：视线直接漏出</text>
      `}
    `;

    if (!broken.length) {
      verdict.className = "anatomy-verdict";
      verdict.innerHTML = "<strong>三层完整咬合：宽阔上空 → 斜线收束 → 强对比落点</strong>试着点击对应的任意一层按钮，亲手把它抽掉观察结构怎样失效。";
    } else {
      verdict.className = "anatomy-verdict is-broken";
      verdict.innerHTML = `<strong>${broken.map((b) => b.offTitle).join(" ＋ ")}</strong>${broken[0].offExplain}`;
    }
  }

  buildControls();
  renderSvg();
}

// ==================== 03 历史与建筑脉络展轨（1903–1991） ====================
export function initLineageWidget() {
  const rail = document.getElementById("lineage-rail");
  const svg = document.getElementById("lineage-svg");
  const yearEl = document.getElementById("lin-year");
  const shortEl = document.getElementById("lin-short");
  const authorEl = document.getElementById("lin-author");
  const workEl = document.getElementById("lin-work");
  const bodyEl = document.getElementById("lin-body");

  let idx = 0;

  function drawSchema(kind) {
    if (kind === "poore") {
      return `
        <rect width="420" height="260" fill="#0B1115" rx="6"/>
        <polygon points="105,204 185,204 145,76" fill="none" stroke="#A9BCC6" stroke-width="1.6"/>
        <text x="145" y="226" text-anchor="middle" fill="#A9BCC6" font-size="11.5">正立金字塔 · 静稳</text>
        <polygon points="232,76 346,76 289,204" fill="rgba(110,205,240,0.16)" stroke="#6ECDF0" stroke-width="2.2"/>
        <circle cx="289" cy="204" r="6" fill="#8CE4FF"/>
        <path d="M254,54 Q289,36 324,54" fill="none" stroke="#6ECDF0" stroke-width="1.4" stroke-dasharray="4 3"/>
        <text x="289" y="226" text-anchor="middle" fill="#6ECDF0" font-size="11.5">倒置三角 · 支点反力托衡</text>
      `;
    }
    if (kind === "kandinsky") {
      return `
        <rect width="420" height="260" fill="#0B1115" rx="6"/>
        <rect x="85" y="34" width="250" height="192" fill="none" stroke="#2A3E4B" stroke-width="1.5"/>
        <line x1="85" y1="130" x2="335" y2="130" stroke="#2A3E4B" stroke-dasharray="4 4"/>
        <text x="98" y="54" fill="#8CE4FF" font-size="11.5">上方 ABOVE · 轻盈 / 开放 / 松弛</text>
        <text x="98" y="216" fill="#A9BCC6" font-size="11.5">下方 BELOW · 致密 / 承重 / 聚焦</text>
        <polygon points="122,70 298,70 210,196" fill="rgba(110,205,240,0.14)" stroke="#6ECDF0" stroke-width="2.2"/>
        <line x1="210" y1="70" x2="210" y2="188" stroke="#F3C46B" stroke-width="1.6" stroke-dasharray="4 3"/>
        <circle cx="210" cy="196" r="5.5" fill="#F3C46B"/>
      `;
    }
    if (kind === "arnheim") {
      return `
        <rect width="420" height="260" fill="#0B1115" rx="6"/>
        <polygon points="104,44 316,44 210,204" fill="rgba(55,99,121,0.34)" stroke="#6ECDF0" stroke-width="2"/>
        <circle cx="210" cy="96" r="30" fill="rgba(110,205,240,0.28)" stroke="#8CE4FF" stroke-width="1.8"/>
        <text x="210" y="100" text-anchor="middle" fill="#EEF4F7" font-size="12" font-weight="700">视觉重量</text>
        <line x1="210" y1="126" x2="210" y2="192" stroke="#FF7B66" stroke-width="2" stroke-dasharray="4 3"/>
        <polygon points="204,186 216,186 210,198" fill="#FF7B66"/>
        <text x="210" y="232" text-anchor="middle" fill="#A9BCC6" font-size="11.5">上重下窄激发重力势能，迫使视线沿结构骨架下行</text>
      `;
    }
    if (kind === "wright") {
      return `
        <rect width="420" height="260" fill="#0B1115" rx="6"/>
        <path d="M110,46 L310,46 L295,88 L125,88 Z" fill="rgba(110,205,240,0.24)" stroke="#8CE4FF" stroke-width="1.6"/>
        <path d="M128,94 L292,94 L278,136 L142,136 Z" fill="rgba(110,205,240,0.18)" stroke="#6ECDF0" stroke-width="1.5"/>
        <path d="M146,142 L274,142 L262,182 L158,182 Z" fill="rgba(110,205,240,0.13)" stroke="#6ECDF0" stroke-width="1.4"/>
        <rect x="164" y="188" width="92" height="24" fill="rgba(55,99,121,0.35)" stroke="#A9BCC6" stroke-width="1.3"/>
        <path d="M124,66 Q210,78 286,112 Q210,126 154,160 Q210,174 234,198" fill="none" stroke="#F3C46B" stroke-width="1.8" stroke-dasharray="5 3"/>
        <text x="210" y="34" text-anchor="middle" fill="#8CE4FF" font-size="11.5">顶部穹顶天光 · 逐层外扩的倒置金字塔中庭</text>
        <text x="210" y="236" text-anchor="middle" fill="#A9BCC6" font-size="11.5">乘梯登顶 → 顺螺旋坡道自上而下观展（1959）</text>
      `;
    }
    return `
      <rect width="420" height="260" fill="#0B1115" rx="6"/>
      <polygon points="102,196 198,196 150,94" fill="#376379" stroke="#EEF4F7" stroke-width="1.6"/>
      <text x="150" y="220" text-anchor="middle" fill="#A9BCC6" font-size="11.5">平底贴地 · 安稳踏实</text>
      <polygon points="236,74 338,74 287,194" fill="#6ECDF0" stroke="#EEF4F7" stroke-width="1.6"/>
      <circle cx="287" cy="196" r="5" fill="#FF7B66"/>
      <text x="287" y="220" text-anchor="middle" fill="#8CE4FF" font-size="11.5">尖端支立 · 警觉与动势</text>
    `;
  }

  function render() {
    const item = LINEAGE_ITEMS[idx];
    rail.querySelectorAll(".lin-btn").forEach((b, i) => {
      b.classList.toggle("is-active", i === idx);
      b.setAttribute("aria-selected", String(i === idx));
    });
    yearEl.textContent = item.year;
    shortEl.textContent = item.short;
    authorEl.textContent = item.author;
    const parts = [];
    if (item.workZh) parts.push(`<span>${item.workZh}</span>`);
    if (item.workEn) {
      const enHtml = `<em lang="en">${item.workEn}</em>`;
      parts.push(item.workZh ? `（${enHtml}${item.workNote ? `，${item.workNote}` : ""}）` : `${enHtml}${item.workNote ? `（${item.workNote}）` : ""}`);
    }
    workEl.innerHTML = parts.join("");
    bodyEl.textContent = item.body;
    svg.innerHTML = drawSchema(item.diagram);
  }

  LINEAGE_ITEMS.forEach((item, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lin-btn";
    btn.setAttribute("role", "tab");
    btn.innerHTML = `<strong>${item.year}</strong><span>${item.short}</span>`;
    btn.addEventListener("click", () => {
      idx = i;
      render();
    });
    rail.appendChild(btn);
  });

  render();
}

// ==================== 04 四类高光场景样张 + X 光导流线开关 ====================
export function initAppsWidget() {
  const tabsEl = document.getElementById("apps-tabs");
  const xrayBtn = document.getElementById("xray-toggle");
  const svg = document.getElementById("specimen-svg");
  const kickerEl = document.getElementById("app-kicker");
  const titleEl = document.getElementById("app-title");
  const captionEl = document.getElementById("app-caption");

  let activeIdx = 0;
  let xray = true;

  function drawSpecimen(app) {
    let body = "";
    if (app.id === "nature") {
      body = `
        <rect width="560" height="350" fill="#10171A" rx="6"/>
        <polygon points="86,38 474,38 280,308" fill="#193445"/>
        <rect x="86" y="38" width="388" height="114" fill="#6F8699" clip-path="url(#sp-v)"/>
        <polygon points="154,152 246,74 286,58 344,104 402,152" fill="#ECF5FA" clip-path="url(#sp-v)"/>
        <polygon points="286,58 344,104 402,152 280,152" fill="#5D839F" clip-path="url(#sp-v)"/>
        <polygon points="158,152 400,152 322,258 280,306 236,252" fill="#0B2E40" clip-path="url(#sp-v)"/>
        <line x1="86" y1="152" x2="474" y2="152" stroke="#BFE4F5" stroke-width="1.4" clip-path="url(#sp-v)"/>
        <circle cx="280" cy="308" r="7" fill="#8CE4FF"/>
        <ellipse cx="280" cy="318" rx="46" ry="6" fill="none" stroke="rgba(110,205,240,0.45)"/>
      `;
    } else if (app.id === "stage") {
      body = `
        <rect width="560" height="350" fill="#0D1419" rx="6"/>
        <polygon points="88,36 472,36 280,304" fill="rgba(110,205,240,0.16)"/>
        <line x1="92" y1="48" x2="468" y2="48" stroke="rgba(140,228,255,0.4)" stroke-width="2"/>
        <circle cx="280" cy="144" r="10" fill="#E6F4FA"/>
        <path d="M226,118 Q254,142 280,158 Q306,142 334,118" fill="none" stroke="#E6F4FA" stroke-width="5.5" stroke-linecap="round"/>
        <polygon points="272,156 288,156 306,204 254,204" fill="#E6F4FA"/>
        <line x1="280" y1="204" x2="280" y2="296" stroke="#E6F4FA" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="280" cy="304" rx="34" ry="7" fill="rgba(140,228,255,0.48)"/>
      `;
    } else if (app.id === "sport") {
      body = `
        <rect width="560" height="350" fill="#13222C" rx="6"/>
        <rect x="0" y="0" width="560" height="266" fill="#3B596E"/>
        <rect x="0" y="266" width="560" height="84" fill="#0B2E40"/>
        <rect x="44" y="64" width="136" height="10" fill="#0F1A22"/>
        <rect x="380" y="64" width="136" height="10" fill="#0F1A22"/>
        <polygon points="150,74 410,74 288,266 272,266" fill="rgba(140,228,255,0.22)"/>
        <polygon points="272,118 288,118 285,204 280,256 275,204" fill="#0C171E"/>
        <circle cx="280" cy="212" r="8" fill="#0C171E"/>
        <circle cx="280" cy="268" r="8" fill="#8CE4FF"/>
        <ellipse cx="280" cy="272" rx="48" ry="8" fill="none" stroke="#8CE4FF" stroke-width="1.5"/>
      `;
    } else {
      body = `
        <rect width="560" height="350" fill="#0E171D" rx="6"/>
        <rect x="40" y="28" width="480" height="294" rx="10" fill="#152129" stroke="#2A3E4B"/>
        <text x="280" y="72" text-anchor="middle" fill="#6ECDF0" font-size="11" letter-spacing="3" font-family="Space Mono, monospace">NOIR CRYSTAL · 2026</text>
        <text x="280" y="118" text-anchor="middle" fill="#F2F8FB" font-size="30" font-weight="900">宽幅主标先打开视野</text>
        <text x="280" y="156" text-anchor="middle" fill="#A9BCC6" font-size="14">次级一行收窄说明，去掉多余左右干扰</text>
        <line x1="170" y1="184" x2="390" y2="184" stroke="#2A3E4B"/>
        <text x="280" y="214" text-anchor="middle" fill="#8FA8B8" font-size="12.5">48 小时留香 · 极地冷雪松调</text>
        <rect x="206" y="246" width="148" height="42" rx="21" fill="#6ECDF0"/>
        <text x="280" y="272" text-anchor="middle" fill="#07141C" font-size="14" font-weight="700">${app.cta}</text>
      `;
    }

    const overlay = xray ? `
      <polygon points="86,38 474,38 280,308" fill="none" stroke="#8CE4FF" stroke-width="2" stroke-dasharray="7 5"/>
      <line x1="120" y1="68" x2="262" y2="278" stroke="rgba(243,196,107,0.75)" stroke-width="1.5" stroke-dasharray="4 4"/>
      <line x1="440" y1="68" x2="298" y2="278" stroke="rgba(243,196,107,0.75)" stroke-width="1.5" stroke-dasharray="4 4"/>
      <circle cx="280" cy="308" r="14" fill="none" stroke="#F3C46B" stroke-width="2"/>
      <text x="24" y="24" fill="#8CE4FF" font-size="11.5" font-family="Space Mono, Noto Sans SC, monospace">X-RAY · 上宽下收导流骨架</text>
    ` : "";

    svg.innerHTML = `
      <defs><clipPath id="sp-v"><polygon points="86,38 474,38 280,308"/></clipPath></defs>
      ${body}
      ${overlay}
    `;
  }

  function render() {
    const app = APPLICATIONS[activeIdx];
    tabsEl.querySelectorAll(".app-tab").forEach((b, i) => {
      b.classList.toggle("is-active", i === activeIdx);
      b.setAttribute("aria-selected", String(i === activeIdx));
    });
    xrayBtn.setAttribute("aria-pressed", String(xray));
    xrayBtn.textContent = `显影倒三角导流线：${xray ? "开" : "关"}`;
    kickerEl.textContent = app.kicker;
    titleEl.textContent = app.title;
    captionEl.textContent = app.caption;
    drawSpecimen(app);
  }

  APPLICATIONS.forEach((app, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "app-tab";
    btn.setAttribute("role", "tab");
    btn.textContent = app.label;
    btn.addEventListener("click", () => {
      activeIdx = i;
      render();
    });
    tabsEl.appendChild(btn);
  });

  xrayBtn.addEventListener("click", () => {
    xray = !xray;
    render();
  });

  render();
}

// ==================== 05 什么时候别用 · 四张双态诊断卡 ====================
export function initAntiPatternWidget() {
  const grid = document.getElementById("anti-grid");

  function drawAntiSvg(id, fixed) {
    if (!fixed) {
      if (id === "authority") {
        return `<svg viewBox="0 0 320 126" aria-hidden="true"><rect width="320" height="126" fill="#10171A" rx="4"/><polygon points="94,14 226,14 160,96" fill="rgba(255,123,102,0.2)" stroke="#FF7B66" stroke-width="1.8"/><text x="160" y="42" text-anchor="middle" fill="#EEF4F7" font-size="12" font-weight="700">百年机构年报</text><text x="160" y="116" text-anchor="middle" fill="#FF7B66" font-size="11">尖端支立显得摇晃不稳</text></svg>`;
      }
      if (id === "heavy_footer") {
        return `<svg viewBox="0 0 320 126" aria-hidden="true"><rect width="320" height="126" fill="#10171A" rx="4"/><polygon points="88,12 232,12 160,84" fill="rgba(255,123,102,0.16)" stroke="#FF7B66" stroke-dasharray="4 3"/><rect x="34" y="68" width="78" height="28" rx="3" fill="#2A3E4B" stroke="#FF7B66"/><rect x="121" y="68" width="78" height="28" rx="3" fill="#2A3E4B" stroke="#FF7B66"/><rect x="208" y="68" width="78" height="28" rx="3" fill="#2A3E4B" stroke="#FF7B66"/><text x="160" y="116" text-anchor="middle" fill="#FF7B66" font-size="11">底部三栏把收束尖角踩扁</text></svg>`;
      }
      if (id === "bidirectional") {
        return `<svg viewBox="0 0 320 126" aria-hidden="true"><rect width="320" height="126" fill="#10171A" rx="4"/><polygon points="94,14 226,14 160,96" fill="rgba(255,123,102,0.18)" stroke="#FF7B66" stroke-width="1.6"/><circle cx="160" cy="48" r="21" fill="none" stroke="#A9BCC6" stroke-dasharray="3 3"/><text x="160" y="116" text-anchor="middle" fill="#FF7B66" font-size="11">单向下压削去柔和围合</text></svg>`;
      }
      return `<svg viewBox="0 0 320 126" aria-hidden="true"><rect width="320" height="126" fill="#10171A" rx="4"/><polygon points="62,14 258,14 160,96" fill="rgba(255,123,102,0.14)" stroke="#FF7B66" stroke-dasharray="4 3"/><circle cx="96" cy="36" r="12" fill="#6ECDF0"/><circle cx="138" cy="36" r="12" fill="#6ECDF0"/><circle cx="182" cy="36" r="12" fill="#6ECDF0"/><circle cx="224" cy="36" r="12" fill="#6ECDF0"/><text x="160" y="116" text-anchor="middle" fill="#FF7B66" font-size="11">多主角并排，底端收不住</text></svg>`;
    }
    if (id === "authority") {
      return `<svg viewBox="0 0 320 126" aria-hidden="true"><rect width="320" height="126" fill="#10171A" rx="4"/><polygon points="160,14 242,96 78,96" fill="rgba(94,230,184,0.18)" stroke="#5EE6B8" stroke-width="2"/><text x="160" y="74" text-anchor="middle" fill="#EEF4F7" font-size="12" font-weight="700">宽基稳坐</text><text x="160" y="116" text-anchor="middle" fill="#5EE6B8" font-size="11">改用 041 三角 / 042 金字塔</text></svg>`;
    }
    if (id === "heavy_footer") {
      return `<svg viewBox="0 0 320 126" aria-hidden="true"><rect width="320" height="126" fill="#10171A" rx="4"/><rect x="44" y="14" width="110" height="36" rx="4" fill="rgba(94,230,184,0.16)" stroke="#5EE6B8"/><rect x="166" y="14" width="110" height="36" rx="4" fill="rgba(94,230,184,0.16)" stroke="#5EE6B8"/><rect x="44" y="58" width="110" height="36" rx="4" fill="rgba(94,230,184,0.16)" stroke="#5EE6B8"/><rect x="166" y="58" width="110" height="36" rx="4" fill="rgba(94,230,184,0.16)" stroke="#5EE6B8"/><text x="160" y="116" text-anchor="middle" fill="#5EE6B8" font-size="11">改用 046 矩形 / 056 四象限</text></svg>`;
    }
    if (id === "bidirectional") {
      return `<svg viewBox="0 0 320 126" aria-hidden="true"><rect width="320" height="126" fill="#10171A" rx="4"/><polygon points="104,14 146,56 104,98 62,56" fill="rgba(94,230,184,0.18)" stroke="#5EE6B8" stroke-width="1.8"/><circle cx="218" cy="56" r="36" fill="rgba(110,205,240,0.16)" stroke="#6ECDF0" stroke-width="1.8"/><text x="160" y="116" text-anchor="middle" fill="#5EE6B8" font-size="11">改用 044 菱形 / 047 圆形 / 053 向心</text></svg>`;
    }
    return `<svg viewBox="0 0 320 126" aria-hidden="true"><rect width="320" height="126" fill="#10171A" rx="4"/><rect x="92" y="14" width="136" height="82" fill="none" stroke="#5EE6B8" stroke-width="1.8"/><circle cx="132" cy="40" r="11" fill="#5EE6B8"/><circle cx="188" cy="40" r="11" fill="#5EE6B8"/><circle cx="132" cy="72" r="11" fill="#5EE6B8"/><circle cx="188" cy="72" r="11" fill="#5EE6B8"/><text x="160" y="116" text-anchor="middle" fill="#5EE6B8" font-size="11">改用 045 方形平权秩序</text></svg>`;
  }

  ANTIPATTERNS.forEach((item) => {
    let fixed = false;
    const card = document.createElement("article");
    card.className = "anti-card";

    function renderCard() {
      card.classList.toggle("is-fixed", fixed);
      card.innerHTML = `
        <div class="anti-head">
          <span class="anti-badge">${fixed ? "推荐改用" : "硬套翻车"}</span>
          <button type="button" class="anti-swap-btn" aria-pressed="${fixed}">
            ${fixed ? "看回翻车状态" : "切换更优构图 →"}
          </button>
        </div>
        <div class="anti-vis">${drawAntiSvg(item.id, fixed)}</div>
        <h3>${fixed ? item.fixTitle : item.badTitle}</h3>
        <p>${fixed ? item.fixDesc : item.badDesc}</p>
        <div class="anti-links">
          ${item.links.map((l) => `<a href="${l.href}">${l.name}</a>`).join("")}
        </div>
      `;
      card.querySelector(".anti-swap-btn").addEventListener("click", () => {
        fixed = !fixed;
        renderCard();
      });
    }

    renderCard();
    grid.appendChild(card);
  });
}

// ==================== 06 单变量眼力自测（中性标签 A/B/C/D，仅差底部落点一变量） ====================
export function initQuizWidget() {
  const grid = document.getElementById("quiz-grid");
  const feedback = document.getElementById("quiz-feedback");
  let picked = null;

  function drawQuizCardSvg(opt, reveal) {
    // 四帧上方冰山、留白与对称 V 形斜线完全一致（26,34 → 194,34 → 110,216），唯一变化是底部探照灯落点
    const beaconX = 110 + opt.apexDx * 220;
    const beaconY = 216;
    const clipId = `qclip-${opt.key}`;

    let anchorSvg = "";
    if (opt.anchorMode === "focus") {
      anchorSvg = `
        <ellipse cx="${beaconX}" cy="224" rx="28" ry="4.5" fill="none" stroke="rgba(110,205,240,0.48)" stroke-width="1.1"/>
        <circle cx="${beaconX}" cy="${beaconY}" r="13" fill="rgba(110,205,240,0.28)"/>
        <circle cx="${beaconX}" cy="${beaconY}" r="5.2" fill="#8CE4FF"/>
      `;
    } else if (opt.anchorMode === "none") {
      anchorSvg = `
        <circle cx="110" cy="216" r="4" fill="rgba(55,99,121,0.34)" stroke="rgba(110,205,240,0.2)" stroke-width="1"/>
      `;
    } else if (opt.anchorMode === "glare") {
      anchorSvg = `
        <ellipse cx="110" cy="218" rx="68" ry="20" fill="rgba(110,205,240,0.28)"/>
        <ellipse cx="110" cy="216" rx="44" ry="13" fill="rgba(140,228,255,0.48)"/>
        <ellipse cx="110" cy="216" rx="22" ry="8" fill="#D4F5FF"/>
      `;
    }

    const guide = reveal ? `
      <line x1="110" y1="68" x2="110" y2="216" stroke="${opt.correct ? "#5EE6B8" : "#FF7B66"}" stroke-width="1.4" stroke-dasharray="3 3"/>
      ${opt.apexDx !== 0 ? `<line x1="110" y1="216" x2="${beaconX}" y2="216" stroke="#FF7B66" stroke-width="2"/><circle cx="110" cy="216" r="3" fill="none" stroke="#FF7B66" stroke-width="1.4"/>` : ""}
    ` : "";

    return `
      <svg viewBox="0 0 220 250" aria-hidden="true">
        <defs><clipPath id="${clipId}"><polygon points="26,34 194,34 110,216"/></clipPath></defs>
        <rect width="220" height="250" fill="#0B1115" rx="6"/>
        <g clip-path="url(#${clipId})">
          <rect x="0" y="0" width="220" height="114" fill="#6F8497"/>
          <polygon points="56,114 96,74 114,60 140,86 164,114" fill="#EEF5FA"/>
          <polygon points="114,60 140,86 164,114 110,114" fill="#5D839F"/>
          <rect x="0" y="114" width="220" height="136" fill="#0A2B3C"/>
          <polygon points="58,114 162,114 128,178 110,216 92,174" fill="#174D66"/>
          <line x1="0" y1="114" x2="220" y2="114" stroke="#CBE8F7" stroke-width="1.2"/>
        </g>
        <polygon points="26,34 194,34 110,216" fill="none" stroke="rgba(110,205,240,0.72)" stroke-width="1.4" stroke-dasharray="4 4"/>
        ${anchorSvg}
        ${guide}
        <text x="110" y="20" text-anchor="middle" fill="#A9BCC6" font-size="9.5" font-family="Space Mono, monospace" letter-spacing="1.2">ARCTIC NIGHT EXPEDITION</text>
      </svg>
    `;
  }

  function render() {
    grid.innerHTML = "";
    QUIZ_OPTIONS.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      const isPicked = picked === opt.key;
      const cls = isPicked ? (opt.correct ? " is-picked-ok" : " is-picked-bad") : "";
      btn.className = `quiz-opt${cls}`;
      btn.setAttribute("aria-pressed", String(isPicked));
      btn.innerHTML = `
        ${drawQuizCardSvg(opt, picked !== null)}
        <span class="quiz-opt-label">
          <span>${opt.label}</span>
          <span>${isPicked ? (opt.correct ? "✓ 选中" : "× 再看看") : "选择"}</span>
        </span>
      `;
      btn.addEventListener("click", () => {
        picked = opt.key;
        render();
        feedback.innerHTML = `
          <div class="qf-head ${opt.correct ? "is-ok" : "is-bad"}">
            <strong>${opt.label} · ${opt.verdict}</strong>
            <button type="button" id="quiz-reset" class="btn-ghost-xs">重选测试</button>
          </div>
          <p class="qf-body">${opt.explain}</p>
        `;
        feedback.querySelector("#quiz-reset").addEventListener("click", () => {
          picked = null;
          render();
          feedback.innerHTML = `<p class="qf-idle">点选上方任意一帧（方案 A / B / C / D），立即查看该方案的几何与视觉重心拆解。</p>`;
        });
      });
      grid.appendChild(btn);
    });
  }

  render();
}

// ==================== 07 原海报放大拖拽灯箱 ====================
export function initLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const dialog = document.getElementById("poster-lightbox");
  const stage = document.getElementById("lightbox-stage");
  const img = document.getElementById("lightbox-img");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let start = null;

  function apply() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    btnReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function setScale(next) {
    scale = Math.max(1, Math.min(3, Math.round(next * 100) / 100));
    if (scale === 1) { tx = 0; ty = 0; }
    apply();
  }

  openBtn.addEventListener("click", () => {
    img.src = poster.currentSrc || poster.src;
    setScale(1);
    dialog.showModal();
  });

  btnIn.addEventListener("click", () => setScale(scale + 0.4));
  btnOut.addEventListener("click", () => setScale(scale - 0.4));
  btnReset.addEventListener("click", () => setScale(1));
  btnClose.addEventListener("click", () => dialog.close());
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) {
      e.preventDefault();
      dialog.close();
    }
  });

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    setScale(scale + (e.deltaY < 0 ? 0.25 : -0.25));
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    if (scale <= 1) return;
    dragging = true;
    stage.classList.add("is-dragging");
    start = { x: e.clientX - tx, y: e.clientY - ty };
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });

  stage.addEventListener("pointermove", (e) => {
    if (!dragging || !start) return;
    tx = e.clientX - start.x;
    ty = e.clientY - start.y;
    apply();
  });

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("is-dragging");
    try { stage.releasePointerCapture(e.pointerId); } catch {}
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
}

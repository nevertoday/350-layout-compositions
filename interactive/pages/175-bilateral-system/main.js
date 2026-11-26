// 175 双边系统 · 整页交互编排
// 串联开场单真源排印台、01 三要素解剖、02 四时代标本、03 暗室断行与光学修正、
// 04 双翼对话矩阵、05 长文灾难对比、06 单变量两轮考场与 07 海报灯箱。

import { createInitialState, PRESETS, sanitizeState } from "./model.js";
import { createHeroStage } from "./hero-stage.js";

const state = createInitialState();

// ==================== 1. 开场互动台与单真源 DOM 同步 ====================
const canvas = document.getElementById("hero-canvas");
const statusPill = document.getElementById("hero-status-pill");
const pillarSymTag = document.getElementById("pillar-symmetry-tag");
const pillarBalTag = document.getElementById("pillar-balance-tag");
const pillarDiaTag = document.getElementById("pillar-dialogue-tag");
const diagSeverity = document.getElementById("diag-severity");
const diagTitle = document.getElementById("diag-title");
const diagWhy = document.getElementById("diag-why");
const diagAction = document.getElementById("diag-action");
const btnOpticalToggle = document.getElementById("btn-optical-toggle");

const rngAxis = document.getElementById("rng-axis");
const rngGap = document.getElementById("rng-gap");
const rngWeight = document.getElementById("rng-weight");
const rngDy = document.getElementById("rng-dy");
const outAxis = document.getElementById("out-axis");
const outGap = document.getElementById("out-gap");
const outWeight = document.getElementById("out-weight");
const outDy = document.getElementById("out-dy");

const embRodGroup = document.getElementById("emb-rod-group");
const embRodLine = document.getElementById("emb-rod-line");
const embTopDot = document.getElementById("emb-top-dot");
const embBotDot = document.getElementById("emb-bot-dot");
const embReadout = document.getElementById("emblem-readout");
const mAxis = document.getElementById("m-axis");
const mWeight = document.getElementById("m-weight");
const mGap = document.getElementById("m-gap");
const mDy = document.getElementById("m-dy");

function syncHeroUI(L) {
  if (!L) return;
  const { state: s, metrics, checks, audit } = L;

  // 顶栏状态章
  statusPill.textContent = audit.badgeText;
  statusPill.classList.toggle("is-pass", audit.allPass);
  statusPill.classList.toggle("is-error", !audit.allPass);

  // 三大关键词柱状态
  const setPillar = (el, info) => {
    el.textContent = info.tag;
    el.classList.toggle("is-ok", info.ok);
    el.classList.toggle("is-err", !info.ok);
  };
  setPillar(pillarSymTag, audit.pillarStatus.symmetry);
  setPillar(pillarBalTag, audit.pillarStatus.balance);
  setPillar(pillarDiaTag, audit.pillarStatus.dialogue);

  // 白话诊单
  diagSeverity.textContent = audit.severityLabel;
  diagSeverity.classList.toggle("is-pass", audit.allPass);
  diagTitle.textContent = audit.title;
  diagWhy.textContent = audit.why;
  diagAction.textContent = audit.action;

  // 滑轨与数字输出（全部同步自单真源）
  const axisPct = Math.round(s.axisX * 1000) / 10;
  const gapPct = Math.round(s.corridorGap * 1000) / 10;
  const wtPct = Math.round(s.rightWeight * 100);
  if (document.activeElement !== rngAxis) rngAxis.value = String(axisPct);
  if (document.activeElement !== rngGap) rngGap.value = String(gapPct);
  if (document.activeElement !== rngWeight) rngWeight.value = String(wtPct);
  if (document.activeElement !== rngDy) rngDy.value = String(s.verticalDelta);

  outAxis.textContent = `${Math.round(axisPct)}%`;
  outGap.textContent = `${metrics.corridorRatioPct}%`;
  outWeight.textContent = `${metrics.weightRatioPct}%`;
  outDy.textContent = `${metrics.deltaYPx > 0 ? "+" : ""}${metrics.deltaYPx}px`;

  // 按钮激活态
  document.querySelectorAll("[data-specimen]").forEach((btn) => {
    const active = btn.dataset.specimen === s.specimen;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll("[data-orb]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.orb === s.orbMode);
  });
  document.querySelectorAll("[data-align]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.align === s.alignMode);
  });
  btnOpticalToggle.setAttribute("aria-pressed", String(s.opticalVariant === "optical-pair"));
  btnOpticalToggle.textContent =
    s.opticalVariant === "optical-pair" ? "当前：异形光学配重（点切镜像）" : "切换：异形光学配重";

  // 活体圆形双边徽章
  embRodGroup.setAttribute(
    "transform",
    `translate(${audit.emblemAxisShift.toFixed(1)}, 0) rotate(${audit.emblemTiltDeg.toFixed(1)} 90 90)`
  );
  const rodColor = audit.allPass ? "#113F29" : "#B6261E";
  embRodLine.setAttribute("stroke", rodColor);
  embTopDot.setAttribute("fill", rodColor);
  embBotDot.setAttribute("fill", rodColor);
  if (audit.allPass) {
    embReadout.textContent = s.opticalVariant === "optical-pair" ? "中轴垂直 · 异形光学端平" : "中轴垂直 · 双翼平衡成立";
  } else if (Math.abs(metrics.axisOffsetPct) > 2) {
    embReadout.textContent = `中轴偏${metrics.axisOffsetPct > 0 ? "右" : "左"} ${Math.abs(metrics.axisOffsetPct)}%`;
  } else if (!checks.balance) {
    embReadout.textContent = metrics.weightRatioPct < 88 ? "天平左倾 · 右翼偏轻" : "天平右倾 · 右翼过重";
  } else if (!checks.dialogue) {
    embReadout.textContent = "中轴端正 · 对话失联";
  } else {
    embReadout.textContent = "图形平衡 · 排印语法未齐";
  }

  // 四格实测账本
  mAxis.textContent = `${metrics.axisOffsetPct > 0 ? "+" : ""}${metrics.axisOffsetPct}%`;
  mAxis.className = Math.abs(metrics.axisOffsetPct) <= 2 ? "is-ok" : "is-err";

  mWeight.textContent = `${metrics.weightRatioPct}%`;
  mWeight.className = checks.balance ? "is-ok" : "is-err";

  mGap.textContent = `${metrics.corridorRatioPct}%`;
  mGap.className = metrics.corridorRatioPct >= 5 && metrics.corridorRatioPct <= 23 ? "is-ok" : "is-err";

  mDy.textContent = `${metrics.deltaYPx > 0 ? "+" : ""}${metrics.deltaYPx}px`;
  mDy.className = Math.abs(metrics.deltaYPx) <= 8 ? "is-ok" : "is-err";
}

let heroStage = null;

function updateState(patch) {
  Object.assign(state, patch);
  sanitizeState(state);
  if (heroStage) heroStage.markDirty();
}

heroStage = createHeroStage({
  canvas,
  getState: () => state,
  updateState,
  onAfterDraw: syncHeroUI,
});

// 标本签、滑轨、预设与工具按钮事件
document.querySelectorAll("[data-specimen]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ specimen: btn.dataset.specimen }));
});

document.querySelectorAll(".pillar-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.highlight;
    const next = state.highlightKey === k ? null : k;
    document.querySelectorAll(".pillar-btn").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.highlight === next));
    });
    updateState({ highlightKey: next });
  });
});

document.getElementById("btn-mirror-lock").addEventListener("click", (e) => {
  const next = !state.mirrorLock;
  e.currentTarget.setAttribute("aria-pressed", String(next));
  e.currentTarget.classList.toggle("is-on", next);
  e.currentTarget.textContent = next ? "镜像联动：开" : "镜像联动：关";
  updateState({ mirrorLock: next });
});

document.getElementById("btn-guides").addEventListener("click", (e) => {
  const next = !state.showGuides;
  e.currentTarget.setAttribute("aria-pressed", String(next));
  e.currentTarget.classList.toggle("is-on", next);
  e.currentTarget.textContent = next ? "标尺：开" : "标尺：关";
  updateState({ showGuides: next });
});

document.getElementById("btn-pulse").addEventListener("click", () => heroStage.triggerPulse());

document.getElementById("btn-calibrate").addEventListener("click", () => {
  updateState({ ...PRESETS.classic.state });
  heroStage.triggerPulse();
});

document.getElementById("btn-reset-broken").addEventListener("click", () => {
  updateState({ ...PRESETS.broken.state });
});

btnOpticalToggle.addEventListener("click", () => {
  const next = state.opticalVariant === "optical-pair" ? "mirror" : "optical-pair";
  updateState({
    ...PRESETS.classic.state,
    opticalVariant: next,
  });
});

rngAxis.addEventListener("input", () => updateState({ axisX: Number(rngAxis.value) / 100 }));
rngGap.addEventListener("input", () => updateState({ corridorGap: Number(rngGap.value) / 100 }));
rngWeight.addEventListener("input", () => updateState({ rightWeight: Number(rngWeight.value) / 100 }));
rngDy.addEventListener("input", () => updateState({ verticalDelta: Number(rngDy.value) }));

document.querySelectorAll("[data-orb]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ orbMode: btn.dataset.orb }));
});

document.querySelectorAll("[data-align]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ alignMode: btn.dataset.align }));
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) updateState({ ...p.state });
  });
});

// ==================== 2. 01 节：三要素几何解剖 ====================
const ANATOMY_DATA = {
  symmetry: {
    title: "垂直中轴：把整张版面变成一架视觉天平",
    body: "原海报正中那条贯通上下的虚线不是装饰，而是整个系统的支点。左右两片深松墨绿半圆、外侧橘红点阵和底部四道排印线全部向它报到——只要轴线稳居中位，读者无需额外边框就能感受到端庄与秩序。",
    note: "经验参考：单轴双边版面的中轴若偏离版心超过约 3%，人眼常把它读成「没对齐」而非刻意不对称。",
    svg: `
      <rect x="0" y="0" width="560" height="250" fill="#F7E9D2"/>
      <line x1="280" y1="16" x2="280" y2="234" stroke="#0F0F0E" stroke-width="2" stroke-dasharray="8 6"/>
      <circle cx="280" cy="16" r="5" fill="#113F29"/>
      <circle cx="280" cy="234" r="5" fill="#113F29"/>
      <path d="M 232 45 A 80 80 0 0 0 232 205 Z" fill="#113F29" opacity="0.22"/>
      <path d="M 328 45 A 80 80 0 0 1 328 205 Z" fill="#113F29" opacity="0.22"/>
      <line x1="152" y1="125" x2="280" y2="125" stroke="#ED731C" stroke-width="2"/>
      <line x1="280" y1="125" x2="408" y2="125" stroke="#ED731C" stroke-width="2"/>
      <circle cx="152" cy="125" r="5" fill="#ED731C"/>
      <circle cx="408" cy="125" r="5" fill="#ED731C"/>
      <rect x="192" y="100" width="46" height="20" fill="#FCF4E7" stroke="#113F29"/>
      <text x="215" y="114" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="#113F29">d = L</text>
      <rect x="322" y="100" width="46" height="20" fill="#FCF4E7" stroke="#113F29"/>
      <text x="345" y="114" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="#113F29">d = R</text>
      <text x="280" y="246" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="700" fill="#113F29">中轴 X = 50% · 左右等距镜像</text>
    `,
  },
  balance: {
    title: "视觉平衡：墨重对等，不必长得一模一样",
    body: "左翼是实心深松半圆，右翼也可以换成长线条与留白构成的建筑拱框——只要两者在视觉面积和深浅墨量上接近，天平依然稳稳端平。相反，哪怕外形对称，一侧填满粗体大字、另一侧只放两行细小灰字，画面照样会往重的一边倾倒。",
    note: "实战法则：当左右字体不同（如中文方块字配拉丁字母）时，应微调西文字号或字重，让两翼灰度体量持平。",
    svg: `
      <rect x="0" y="0" width="560" height="250" fill="#F7E9D2"/>
      <line x1="110" y1="196" x2="450" y2="196" stroke="#113F29" stroke-width="2.5"/>
      <polygon points="280,196 268,220 292,220" fill="#ED731C"/>
      <path d="M 226 52 A 64 64 0 0 0 226 180 Z" fill="#113F29"/>
      <path d="M 334 52 A 64 64 0 0 1 334 180 Z" fill="none" stroke="#113F29" stroke-width="11"/>
      <rect x="348" y="84" width="28" height="64" fill="#113F29"/>
      <rect x="353" y="96" width="18" height="4" fill="#F7E9D2"/>
      <rect x="353" y="114" width="18" height="4" fill="#F7E9D2"/>
      <rect x="353" y="132" width="18" height="4" fill="#F7E9D2"/>
      <text x="190" y="38" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="700" fill="#113F29">左翼：实心体块</text>
      <text x="366" y="38" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="700" fill="#113F29">右翼：异形等重</text>
      <text x="280" y="242" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11.5" font-weight="600" fill="#A63F04">OPTICAL WEIGHT L ≈ R（100%）</text>
    `,
  },
  dialogue: {
    title: "跨轴对话：留出中缝走廊，让两翼隔空应答",
    body: "原海报里，两枚炙柿橘红圆核没有藏在远端，而是双双贴在面对中轴的直弦上。它们像一对坐在长桌两侧的对谈者：既不被挤成一团，也不远到听不见彼此，视线自然会在中缝之间轻轻往返。",
    note: "经验参考：中缝占整体宽度的 8%–20% 时，左右两翼既保持清晰边界，又维持强烈成组呼应。",
    svg: `
      <rect x="0" y="0" width="560" height="250" fill="#F7E9D2"/>
      <rect x="234" y="24" width="92" height="196" fill="rgba(237,115,28,0.12)"/>
      <line x1="280" y1="20" x2="280" y2="224" stroke="#0F0F0E" stroke-width="1.6" stroke-dasharray="6 6"/>
      <path d="M 234 52 A 70 70 0 0 0 234 192 Z" fill="#113F29"/>
      <path d="M 326 52 A 70 70 0 0 1 326 192 Z" fill="#113F29"/>
      <circle cx="234" cy="122" r="20" fill="#ED731C"/>
      <circle cx="326" cy="122" r="20" fill="#ED731C"/>
      <line x1="258" y1="122" x2="302" y2="122" stroke="#A63F04" stroke-width="2" stroke-dasharray="4 4"/>
      <text x="280" y="42" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="700" fill="#A63F04">中缝对话带</text>
      <text x="280" y="242" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="700" fill="#113F29">贴轴对望：清晰分隔 + 视线往返</text>
    `,
  },
};

const anatomySvg = document.getElementById("anatomy-svg");
const anatomyCopy = document.getElementById("anatomy-copy");

function renderAnatomy(key) {
  const d = ANATOMY_DATA[key] || ANATOMY_DATA.symmetry;
  anatomySvg.innerHTML = d.svg;
  anatomyCopy.innerHTML = `<h3>${d.title}</h3><p>${d.body}</p><p class="anat-note">${d.note}</p>`;
  document.querySelectorAll(".anat-tab").forEach((t) => {
    const active = t.dataset.anat === key;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", String(active));
  });
}

document.querySelectorAll(".anat-tab").forEach((btn) => {
  btn.addEventListener("click", () => renderAnatomy(btn.dataset.anat));
});
renderAnatomy("symmetry");

// ==================== 3. 02 节：四时代历史标本步进器 ====================
const ERA_DATA = {
  "1499": {
    title: "威尼斯文艺复兴：居中文字收束成器皿轮廓",
    work: "Aldus Manutius & Francesco Griffo ·《Hypnerotomachia Poliphili》（1499 年 12 月）",
    body: "出版家阿尔杜斯·马努提乌斯在威尼斯印制的《寻爱绮梦》被公认为摇篮本印刷的巅峰。书中多处正文与题词沿垂直中轴逐行向内收束，排成古希腊酒杯与陶瓮般的对称剪影——证明居中排印不仅能对齐文字，还能直接用字行长短雕琢出优雅的外轮廓。",
    source: "核实来源：大都会艺术博物馆（The Met）1499 年馆藏本记录（Object 23.73.1）。",
    specimen: `
      <div style="font-family:var(--font-serif);color:#113F29;line-height:1.45;">
        <div style="font-size:18px;font-weight:600;letter-spacing:0.12em;">HYPNEROTOMACHIA</div>
        <div style="font-size:15px;letter-spacing:0.14em;margin-top:4px;">POLIPHILI · VENETIIS</div>
        <div style="font-size:13px;font-style:italic;margin-top:6px;color:#363C38;">In aedibus Aldi Manutii</div>
        <div style="font-size:12px;margin-top:4px;color:#363C38;">accuratissime impressum</div>
        <div style="font-size:11px;margin-top:4px;color:#A63F04;font-weight:600;">M · CCCC · XCIX</div>
        <div style="width:8px;height:8px;border-radius:50%;background:#ED731C;margin:8px auto 0;"></div>
      </div>
    `,
  },
  "1818": {
    title: "新古典主义巅峰：大留白与严格对称扉页",
    work: "Giambattista Bodoni ·《Manuale tipografico》（帕尔马，1818）",
    body: "意大利印刷大师博多尼逝世后，其遗孀于 1818 年在帕尔马印出两卷本《字体手册》。书页把高反差现代衬线字与近乎建筑立面般的严格居中排印推向极致：大幅空白托起寥寥数行精雕细琢的文字，奠定了近两百年来古典精装书扉页与歌剧节目单的仪式感范式。",
    source: "核实来源：美国国会图书馆善本馆藏记录（LCCN 02018918）。",
    specimen: `
      <div style="border:1.5px solid #113F29;padding:18px 22px;width:86%;background:#FCF4E7;">
        <div style="font-family:var(--font-serif);font-size:12px;letter-spacing:0.24em;color:#A63F04;">PARMA · MDCCCXVIII</div>
        <div style="font-family:var(--font-serif);font-size:24px;font-weight:600;letter-spacing:0.14em;margin:12px 0 8px;color:#0F0F0E;">MANUALE</div>
        <div style="font-family:var(--font-serif);font-size:15px;letter-spacing:0.28em;color:#113F29;">TIPOGRAFICO</div>
        <div style="width:48px;height:1.5px;background:#ED731C;margin:14px auto;"></div>
        <div style="font-family:var(--font-serif);font-size:12px;font-style:italic;color:#363C38;">Giambattista Bodoni</div>
      </div>
    `,
  },
  "1958": {
    title: "破除迷思：不是「对称排印」，而是「轴心居中排印」",
    work: "Jan Tschichold ·《The Form of the Book》（德文 1975 / 英文 1991；含 1958 与 1965 论文）",
    body: "曾在 1928 年高举不对称新排印旗帜的奇肖尔德，在晚年回归古典书籍设计。他在 1965 年《对称还是不对称排印？》中尖锐指出：由于每个字母形状与宽窄不同，排版里根本不存在严格的几何镜像，真正优雅的是沿着垂直中心轴按语义断行、讲求呼吸比例的居中排印。",
    source: "核实来源：Hartley & Marks 1991 年英文版《The Form of the Book》（ISBN 978-0881790344）。",
    specimen: `
      <div style="font-family:var(--font-song);color:#0F0F0E;line-height:1.6;">
        <div style="font-size:12px;font-family:var(--font-en);letter-spacing:0.22em;color:#A63F04;">JAN TSCHICHOLD · 1958</div>
        <div style="font-size:22px;letter-spacing:0.16em;margin:10px 0 4px;">传统扉页之法度</div>
        <div style="font-size:13.5px;font-family:var(--font-sans);color:#363C38;">字宽各异，故无绝对镜像；</div>
        <div style="font-size:13.5px;font-family:var(--font-sans);color:#363C38;">惟以语义断行，守一中轴而得端庄。</div>
        <div style="font-family:var(--font-mono);font-size:11px;color:#113F29;margin-top:10px;">CENTERED AXIAL HARMONY</div>
      </div>
    `,
  },
  "2007": {
    title: "现代教学归类：八大字体组织系统中的双边支脉",
    work: "Kimberly Elam ·《Typographic Systems》（Princeton Architectural Press, 2007）",
    body: "设计教育家金伯利·伊拉姆在 2007 年将网格之外的排印结构系统归纳为八大组织体系，并将「双边系统（Bilateral System）」单列一章：它以对称垂直轴为骨架，靠字号、字重、断行和留白构建纯文字层级，同时允许一枚恰到好处的「破格元素（wildcard）」点亮静态对称。",
    source: "核实来源：Princeton Architectural Press 2007 年版（ISBN 978-1568986876，LCCN 2006031370）。",
    specimen: `
      <div style="width:92%;display:grid;grid-template-columns:1fr 2px 1fr;gap:12px;align-items:center;">
        <div style="text-align:right;font-size:13px;line-height:1.55;color:#113F29;font-weight:700;">
          纯文字层级<br><span style="font-weight:400;color:#363C38;">字号与留白</span><br>守住中心轴
        </div>
        <div style="height:110px;border-left:1.5px dashed #0F0F0E;position:relative;">
          <span style="position:absolute;top:46px;left:-7px;width:12px;height:12px;border-radius:50%;background:#ED731C;"></span>
        </div>
        <div style="text-align:left;font-family:var(--font-en);font-size:11.5px;line-height:1.6;color:#113F29;font-weight:600;">
          TYPE HIERARCHY<br><span style="font-weight:400;color:#363C38;">Tone &amp; Break</span><br>WILDCARD ACCENT
        </div>
      </div>
    `,
  },
};

const eraSpecimen = document.getElementById("era-specimen");
const eraDetail = document.getElementById("era-detail");

function renderEra(key) {
  const d = ERA_DATA[key] || ERA_DATA["1499"];
  eraSpecimen.innerHTML = d.specimen;
  eraDetail.innerHTML = `
    <h3>${d.title}</h3>
    <p class="era-work">${d.work}</p>
    <p>${d.body}</p>
    <p class="era-source">${d.source}</p>
  `;
  document.querySelectorAll(".era-step").forEach((b) => {
    const active = b.dataset.era === key;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
}

document.querySelectorAll(".era-step").forEach((btn) => {
  btn.addEventListener("click", () => renderEra(btn.dataset.era));
});
renderEra("1499");

// ==================== 4. 03 节：暗室活版断行轮廓 + 光学居中修正 ====================
const galleyState = { contour: "urn", optical: "geo" };
const plateStack = document.getElementById("plate-type-stack");
const plateAxisOpt = document.getElementById("plate-axis-opt");
const plateOptLabel = document.getElementById("plate-opt-label");
const galleyNote = document.getElementById("galley-note");

const GALLEY_PRESETS = {
  brick: {
    rows: [
      { text: "双边排印秩序选集", cls: "is-body is-brick" },
      { text: "关于对称中轴平衡", cls: "is-body is-brick" },
      { text: "古典扉页与双栏谈", cls: "is-body is-brick" },
      { text: "第二版修订印刷。", cls: "is-body is-brick" },
    ],
    geoShift: 48.6,
    optShift: 49.9,
    noteGeo: "四行全被硬扯成相同字宽，层级和外轮廓全部消失，退化成毫无呼吸感的「墓碑砖块」，且末行句号把视觉重心向左拉偏了 1.4%。",
    noteOpt: "虽然句号已做光学悬挂、重心回到中轴，但四行等宽无节奏的问题依然存在——先拉开断行长短与字号层级，再微调光学居中。",
  },
  orphan: {
    rows: [
      { text: "双边排印与对称秩序", cls: "is-title" },
      { text: "SYMMETRY & DIALOGUE", cls: "is-sub" },
      { text: "一本关于如何在中轴两侧建立稳定视觉平衡的", cls: "is-body" },
      { text: "书。", cls: "is-body is-orphan" },
    ],
    geoShift: 47.4,
    optShift: 49.6,
    noteGeo: "第三行把语义截断，导致末尾落出一枚单字孤行「书。」——视觉像一根倒立的图钉，同时标点把重心进一步拖偏至 47.4%。",
    noteOpt: "光学悬挂修正了句号偏心，但单字孤行依然刺眼。居中排印必须按语义停顿手动断行，宁可提前折行，绝不留孤字尾巴。",
  },
  urn: {
    rows: [
      { text: "双边排印秩序", cls: "is-title" },
      { text: "SYMMETRY & DIALOGUE", cls: "is-sub" },
      { text: "在中轴两侧建立稳定与平衡，", cls: "is-body" },
      { text: "让版面展开温和对话。", cls: "is-body" },
    ],
    geoShift: 48.2,
    optShift: 50.0,
    noteGeo: "外轮廓呈经典的微收花瓶形，层级分明；但注意两行末尾的中文全角逗号与句号占去右侧空隙，令视觉重心往左微偏至 48.2%——切换「光学悬挂修正」对比看看。",
    noteOpt: "理想状态达成！按语义断出收束轮廓，再将末位全角标点向右轻微悬挂半格，眼睛感受到的光学重心与 50.0% 数学中轴严丝合缝。",
  },
};

function renderGalley() {
  const cfg = GALLEY_PRESETS[galleyState.contour];
  const isOpt = galleyState.optical === "opt";
  const pct = isOpt ? cfg.optShift : cfg.geoShift;
  plateAxisOpt.style.left = `${pct}%`;
  plateOptLabel.textContent = `光学重心 ${pct.toFixed(1)}%`;

  plateStack.innerHTML = cfg.rows
    .map((r) => {
      const hasPunct = /[，。]$/.test(r.text);
      const shiftStyle = isOpt && hasPunct ? ' style="transform:translateX(0.45em)"' : "";
      return `<div class="plate-row ${r.cls}"${shiftStyle}>${r.text}</div>`;
    })
    .join("");

  galleyNote.innerHTML = `<strong>当前诊断：</strong>${isOpt ? cfg.noteOpt : cfg.noteGeo}`;
  document.querySelectorAll("[data-contour]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.contour === galleyState.contour);
  });
  document.querySelectorAll("[data-optical]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.optical === galleyState.optical);
  });
}

document.querySelectorAll("[data-contour]").forEach((b) => {
  b.addEventListener("click", () => {
    galleyState.contour = b.dataset.contour;
    renderGalley();
  });
});
document.querySelectorAll("[data-optical]").forEach((b) => {
  b.addEventListener("click", () => {
    galleyState.optical = b.dataset.optical;
    renderGalley();
  });
});
renderGalley();

// ==================== 5. 04 节：双翼对话矩阵 + 中缝耦合滑尺 ====================
const DIALOGUE_MODES = {
  bilingual: {
    left: { kicker: "中文展签 · 靠轴右齐", head: "双边之秩序", text: "左右两栏各守中轴一侧，让两种语言在平等的体量与视线高度上自然对读。" },
    right: { kicker: "ENGLISH · FLUSH LEFT", head: "Bilateral Order", text: "Both columns anchor along one vertical spine, turning parallel languages into quiet dialogue." },
  },
  spec: {
    left: { kicker: "声学特性 · 左翼", head: "静谧低噪腔体", text: "双层胡桃木共鸣壁吸收多余驻波，在近场聆听中保持中频清透。" },
    right: { kicker: "结构参数 · 右翼", head: "精密对称配重", text: "左右声道单元镜像校准至误差 0.3 dB 以内，声场结像稳居中轴。" },
  },
  poem: {
    left: { kicker: "正文 · 左翼", head: "松风过竹院", text: "明月照中庭，清影分左右。<br>一轴定虚实，静观意自留。" },
    right: { kicker: "注疏 · 右翼", head: "版式按语", text: "诗句短促工整，适合靠轴而立；旁注等高对位，读完一句抬眼即见释义。" },
  },
  visual: {
    left: { kicker: "图形主翼 · 左", head: "深松墨绿半圆", text: "高饱和色块与点阵承担左侧主要视觉重量，直弦紧贴中轴边界。" },
    right: { kicker: "文字提要 · 右", head: "四行等重排印", text: "用加粗小标配三行密排正文与一枚橘红标点，使右翼墨量与左侧半圆打平。" },
  },
};

let currentDMode = "bilingual";
const dwLeft = document.getElementById("dw-left");
const dwRight = document.getElementById("dw-right");
const rngDGutter = document.getElementById("rng-d-gutter");
const outDGutter = document.getElementById("out-d-gutter");
const dialogueVerdict = document.getElementById("dialogue-verdict");

function renderDialogueLab() {
  const m = DIALOGUE_MODES[currentDMode];
  const g = Number(rngDGutter.value);
  const half = Math.round(g / 2);
  outDGutter.textContent = `${g}px`;
  dwLeft.style.paddingRight = `${half}px`;
  dwRight.style.paddingLeft = `${half}px`;
  dwLeft.innerHTML = `<span class="dw-kicker">${m.left.kicker}</span><h3 class="dw-head">${m.left.head}</h3><p class="dw-text">${m.left.text}</p>`;
  dwRight.innerHTML = `<span class="dw-kicker">${m.right.kicker}</span><h3 class="dw-head">${m.right.head}</h3><p class="dw-text">${m.right.text}</p>`;

  if (g < 18) {
    dialogueVerdict.textContent = `中缝仅 ${g}px：两翼齐边几乎撞上中轴线，左右文字挤成一团，呼吸感被堵死。`;
    dialogueVerdict.classList.add("is-warn");
  } else if (g > 76) {
    dialogueVerdict.textContent = `中缝拉宽到 ${g}px：跨轴跳距过远，左翼和右翼各自为政，双边对话关系断裂。`;
    dialogueVerdict.classList.add("is-warn");
  } else {
    dialogueVerdict.textContent = `中缝 ${g}px：左右齐边隔轴相望，眼球只需轻松水平扫视就能逐行往返对读。`;
    dialogueVerdict.classList.remove("is-warn");
  }

  document.querySelectorAll("[data-dmode]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.dmode === currentDMode);
  });
}

document.querySelectorAll("[data-dmode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentDMode = btn.dataset.dmode;
    renderDialogueLab();
  });
});
rngDGutter.addEventListener("input", renderDialogueLab);
renderDialogueLab();

// ==================== 6. 05 节：长文居中灾难一秒对比 ====================
let ltCentered = false;
const btnLtToggle = document.getElementById("btn-lt-toggle");
const ltSample = document.getElementById("lt-sample");
const ltVerdict = document.getElementById("lt-verdict");

btnLtToggle.addEventListener("click", () => {
  ltCentered = !ltCentered;
  btnLtToggle.setAttribute("aria-pressed", String(ltCentered));
  ltSample.classList.toggle("is-center", ltCentered);
  ltSample.classList.toggle("is-left", !ltCentered);
  btnLtToggle.textContent = ltCentered ? "切回「齐左排印」恢复直落点" : "切到「双边居中」看回扫落点";
  ltVerdict.classList.toggle("is-warn", ltCentered);
  ltVerdict.textContent = ltCentered
    ? "当前：双边居中。看每行开头的红点——4 个起点左右参差跳跃，读长段落时眼睛每换一行都要重新搜索起笔位置。"
    : "当前：齐左排印。4 个行首深绿锚点排成一条笔直垂线，眼睛换行回扫时无需二次寻找起点。";
});

// ==================== 7. 06 节：单变量两轮辨析考场 ====================
const QUIZ_ROUNDS = [
  {
    prompt: "下面四张居中扉页用完全相同的文字、中轴、字号范围和页边距，<strong>只差「断行轮廓与层级收束」一个变量</strong>。哪一版真正成立？",
    correct: 2,
    options: [
      {
        code: "方案 A",
        why: "末行掉出一小段孤短尾行，中段却骤然膨胀，轮廓上下失重。",
        svg: `
          <svg class="quiz-svg" viewBox="0 0 220 260" aria-hidden="true">
            <line x1="110" y1="14" x2="110" y2="246" stroke="rgba(17,63,41,0.22)" stroke-dasharray="4 4"/>
            <rect x="46" y="44" width="128" height="18" fill="#113F29"/>
            <rect x="24" y="76" width="172" height="11" fill="#363C38"/>
            <rect x="28" y="102" width="164" height="11" fill="#363C38"/>
            <rect x="97" y="128" width="26" height="11" fill="#363C38"/>
            <circle cx="110" cy="186" r="6" fill="#ED731C"/>
            <rect x="64" y="210" width="92" height="7" fill="#113F29"/>
          </svg>
        `,
      },
      {
        code: "方案 B",
        why: "所有副文和主标字级几乎贴平，头重脚轻堆成倒块，看不出阅读入口。",
        svg: `
          <svg class="quiz-svg" viewBox="0 0 220 260" aria-hidden="true">
            <line x1="110" y1="14" x2="110" y2="246" stroke="rgba(17,63,41,0.22)" stroke-dasharray="4 4"/>
            <rect x="30" y="44" width="160" height="13" fill="#113F29"/>
            <rect x="34" y="68" width="152" height="13" fill="#363C38"/>
            <rect x="38" y="92" width="144" height="13" fill="#363C38"/>
            <rect x="44" y="116" width="132" height="13" fill="#363C38"/>
            <circle cx="110" cy="186" r="6" fill="#ED731C"/>
            <rect x="64" y="210" width="92" height="7" fill="#113F29"/>
          </svg>
        `,
      },
      {
        code: "方案 C",
        why: "判断准确！主标题字级压阵、副行按语义逐级向内收束成经典花瓶轮廓，再以一枚橘红饰点收尾，层次和节奏一次成立。",
        svg: `
          <svg class="quiz-svg" viewBox="0 0 220 260" aria-hidden="true">
            <line x1="110" y1="14" x2="110" y2="246" stroke="rgba(17,63,41,0.22)" stroke-dasharray="4 4"/>
            <rect x="36" y="44" width="148" height="20" fill="#113F29"/>
            <rect x="54" y="78" width="112" height="9" fill="#363C38"/>
            <rect x="48" y="102" width="124" height="10" fill="#363C38"/>
            <rect x="68" y="126" width="84" height="10" fill="#363C38"/>
            <circle cx="110" cy="186" r="6" fill="#ED731C"/>
            <rect x="74" y="210" width="72" height="7" fill="#113F29"/>
          </svg>
        `,
      },
      {
        code: "方案 D",
        why: "强行把每一行都拉伸成完全等宽的长方砖，双边居中特有的外轮廓韵律被彻底抹平。",
        svg: `
          <svg class="quiz-svg" viewBox="0 0 220 260" aria-hidden="true">
            <line x1="110" y1="14" x2="110" y2="246" stroke="rgba(17,63,41,0.22)" stroke-dasharray="4 4"/>
            <rect x="32" y="46" width="156" height="14" fill="#113F29"/>
            <rect x="32" y="76" width="156" height="14" fill="#363C38"/>
            <rect x="32" y="106" width="156" height="14" fill="#363C38"/>
            <rect x="32" y="136" width="156" height="14" fill="#363C38"/>
            <circle cx="110" cy="186" r="6" fill="#ED731C"/>
            <rect x="32" y="210" width="156" height="8" fill="#113F29"/>
          </svg>
        `,
      },
    ],
  },
  {
    prompt: "下面四块双语展板拥有完全相同的 50% 中轴与画幅，<strong>只差「两翼朝向、中缝与配重」一个变量</strong>。哪一版最符合双边对话原则？",
    correct: 3,
    options: [
      {
        code: "方案 A",
        why: "左右两翼几乎零缝撞死在中轴线上，图文挤粘在一起，失去清晰分隔与呼吸。",
        svg: `
          <svg class="quiz-svg" viewBox="0 0 220 260" aria-hidden="true">
            <line x1="110" y1="16" x2="110" y2="244" stroke="#0F0F0E" stroke-dasharray="5 4"/>
            <path d="M 108 66 A 48 48 0 0 0 108 162 Z" fill="#113F29"/>
            <path d="M 112 66 A 48 48 0 0 1 112 162 Z" fill="#113F29"/>
            <circle cx="107" cy="114" r="11" fill="#ED731C"/>
            <circle cx="113" cy="114" r="11" fill="#ED731C"/>
            <rect x="36" y="182" width="72" height="6" fill="#113F29"/>
            <rect x="112" y="182" width="72" height="6" fill="#113F29"/>
            <rect x="44" y="196" width="64" height="6" fill="#113F29"/>
            <rect x="112" y="196" width="64" height="6" fill="#113F29"/>
          </svg>
        `,
      },
      {
        code: "方案 B",
        why: "底部左右排印硬套单向左齐，左翼文字往外逃离中轴，破坏了围绕垂直轴线的镜像凝聚力。",
        svg: `
          <svg class="quiz-svg" viewBox="0 0 220 260" aria-hidden="true">
            <line x1="110" y1="16" x2="110" y2="244" stroke="#0F0F0E" stroke-dasharray="5 4"/>
            <path d="M 94 66 A 44 44 0 0 0 94 154 Z" fill="#113F29"/>
            <path d="M 126 66 A 44 44 0 0 1 126 154 Z" fill="#113F29"/>
            <circle cx="94" cy="110" r="11" fill="#ED731C"/>
            <circle cx="126" cy="110" r="11" fill="#ED731C"/>
            <rect x="22" y="182" width="52" height="6" fill="#113F29"/>
            <rect x="22" y="196" width="38" height="6" fill="#113F29"/>
            <rect x="126" y="182" width="52" height="6" fill="#113F29"/>
            <rect x="126" y="196" width="38" height="6" fill="#113F29"/>
          </svg>
        `,
      },
      {
        code: "方案 C",
        why: "右翼视觉体量比左翼轻了一半以上，整个版面像断了右臂的天平一样明显向左下坠。",
        svg: `
          <svg class="quiz-svg" viewBox="0 0 220 260" aria-hidden="true">
            <line x1="110" y1="16" x2="110" y2="244" stroke="#0F0F0E" stroke-dasharray="5 4"/>
            <path d="M 94 54 A 56 56 0 0 0 94 166 Z" fill="#113F29"/>
            <path d="M 126 88 A 24 24 0 0 1 126 136 Z" fill="#113F29"/>
            <circle cx="94" cy="110" r="13" fill="#ED731C"/>
            <circle cx="126" cy="112" r="7" fill="#ED731C"/>
            <rect x="26" y="182" width="68" height="6" fill="#113F29"/>
            <rect x="34" y="196" width="60" height="6" fill="#113F29"/>
            <rect x="126" y="182" width="32" height="6" fill="#113F29"/>
            <rect x="126" y="196" width="24" height="6" fill="#113F29"/>
          </svg>
        `,
      },
      {
        code: "方案 D",
        why: "判断准确！左翼靠轴右齐、右翼靠轴左齐，两翼墨重均衡，双橘核隔着清晰呼吸中缝相望，对称、平衡与对话同时成立。",
        svg: `
          <svg class="quiz-svg" viewBox="0 0 220 260" aria-hidden="true">
            <line x1="110" y1="16" x2="110" y2="244" stroke="#0F0F0E" stroke-dasharray="5 4"/>
            <path d="M 94 64 A 46 46 0 0 0 94 156 Z" fill="#113F29"/>
            <path d="M 126 64 A 46 46 0 0 1 126 156 Z" fill="#113F29"/>
            <circle cx="94" cy="110" r="11" fill="#ED731C"/>
            <circle cx="126" cy="110" r="11" fill="#ED731C"/>
            <rect x="30" y="182" width="64" height="6" fill="#113F29"/>
            <rect x="38" y="196" width="56" height="6" fill="#113F29"/>
            <rect x="126" y="182" width="64" height="6" fill="#113F29"/>
            <rect x="126" y="196" width="56" height="6" fill="#113F29"/>
          </svg>
        `,
      },
    ],
  },
];

let quizRound = 0;
const quizAnswers = [null, null];
const quizPrompt = document.getElementById("quiz-prompt");
const quizGrid = document.getElementById("quiz-grid");
const quizFeedback = document.getElementById("quiz-feedback");
const quizScore = document.getElementById("quiz-score");

function renderQuiz() {
  const q = QUIZ_ROUNDS[quizRound];
  const chosen = quizAnswers[quizRound];
  quizPrompt.innerHTML = q.prompt;
  const answeredCount = quizAnswers.filter((x) => x !== null).length;
  const rightCount = quizAnswers.filter((x, i) => x === QUIZ_ROUNDS[i].correct).length;
  quizScore.textContent = `已答 ${answeredCount} / ${QUIZ_ROUNDS.length} 题 · 答对 ${rightCount} 题`;

  document.querySelectorAll("[data-qround]").forEach((b) => {
    const active = Number(b.dataset.qround) === quizRound;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });

  quizGrid.innerHTML = q.options
    .map((opt, idx) => {
      let cls = "quiz-card";
      let mark = "";
      if (chosen !== null) {
        if (idx === q.correct) {
          cls += " is-correct";
          mark = "✓ 正解";
        } else if (idx === chosen) {
          cls += " is-wrong";
          mark = "× 误选";
        }
      }
      return `
        <button type="button" class="${cls}" data-qopt="${idx}" aria-pressed="${chosen === idx}">
          <span class="quiz-card-label"><span>${opt.code}</span><span>${mark}</span></span>
          ${opt.svg}
        </button>
      `;
    })
    .join("");

  quizGrid.querySelectorAll("[data-qopt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      quizAnswers[quizRound] = Number(btn.dataset.qopt);
      renderQuiz();
    });
  });

  if (chosen === null) {
    quizFeedback.className = "quiz-feedback";
    quizFeedback.textContent = "点击任意方案作答，系统会即时拆解唯一变量的视觉成败。";
  } else {
    const isOk = chosen === q.correct;
    const picked = q.options[chosen];
    const right = q.options[q.correct];
    quizFeedback.className = `quiz-feedback ${isOk ? "is-ok" : "is-err"}`;
    quizFeedback.innerHTML = isOk
      ? `<strong>${picked.code} 正确：</strong>${picked.why}`
      : `<strong>你选了 ${picked.code}：</strong>${picked.why}<br><strong>正确参考（${right.code}）：</strong>${right.why}`;
  }
}

document.querySelectorAll("[data-qround]").forEach((btn) => {
  btn.addEventListener("click", () => {
    quizRound = Number(btn.dataset.qround);
    renderQuiz();
  });
});
renderQuiz();

// ==================== 8. 07 节：原海报放大灯箱（复用 #poster.src，不重复内联） ====================
const posterImg = document.getElementById("poster");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbStage = document.getElementById("lb-stage");
const lbZoomVal = document.getElementById("lb-zoom-val");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbPan = null;

function applyLightboxTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbZoomVal.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLightboxTransform();
  lightbox.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.getElementById("btn-open-lightbox").focus();
}

document.getElementById("btn-open-lightbox").addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-zoom-in").addEventListener("click", () => {
  lbScale = Math.min(3.2, +(lbScale + 0.35).toFixed(2));
  applyLightboxTransform();
});
document.getElementById("lb-zoom-out").addEventListener("click", () => {
  lbScale = Math.max(0.6, +(lbScale - 0.35).toFixed(2));
  applyLightboxTransform();
});
document.getElementById("lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLightboxTransform();
});

lbStage.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    lbScale = Math.max(0.6, Math.min(3.5, +(lbScale + delta).toFixed(2)));
    applyLightboxTransform();
  },
  { passive: false }
);

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lbScale === 1) {
    closeLightbox();
    return;
  }
  lbPan = { id: e.pointerId, x: e.clientX - lbTx, y: e.clientY - lbTy };
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
  lbStage.classList.add("is-panning");
});

lbStage.addEventListener("pointermove", (e) => {
  if (!lbPan) return;
  lbTx = e.clientX - lbPan.x;
  lbTy = e.clientY - lbPan.y;
  applyLightboxTransform();
});

function endLbPan() {
  if (!lbPan) return;
  try { lbStage.releasePointerCapture(lbPan.id); } catch {}
  lbPan = null;
  lbStage.classList.remove("is-panning");
}
lbStage.addEventListener("pointerup", endLbPan);
lbStage.addEventListener("pointercancel", endLbPan);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) {
    e.preventDefault();
    closeLightbox();
  }
});

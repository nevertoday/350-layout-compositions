// 297 顺序重排 — 01–07 节专属互动模块
// 严格做到相邻两节不复用同类控件：
// 01: 5 秒首屏扫读耐心模拟器（进度滑尺 + 回放动画）
// 02: 五节点蓝图年表切签与结构微图窗（SVG 动态切换）
// 03: 双设备目标驱动编排对照台（桌面双栏 × 手机单列 + 实时 CSS）
// 04: 活体 Tab 焦点步进仪（单步步进 + SVG 焦线轨迹 + 读屏朗读队列）
// 05: 四场景反例翻切验伤卡（硬套重排 vs 保留自然序）
// 06: 严格单变量 A/B/C/D 盲测蓝图卡（键盘 1–4 + 同源逆序叠加）
// 07: 原海报蓝图灯箱检视器（缩放 + 拖拽 + Esc 关闭）

import {
  ANTIPATTERNS,
  HISTORY_NODES,
  INTENT_MATRICES,
  QUIZ_MODULES,
  QUIZ_OPTIONS,
  SHAPES,
  SLOT_CIRCLES,
  TAB_MODES,
  simulateScan,
} from "./model.js";
import { reducedMotion } from "../../lib/stage.js";

/** 返回与原海报一致的 crisp 内联 SVG 几何图符（杜绝缺字或基线偏移） */
export function shapeSvg(id, size = 18) {
  const s = size;
  if (id === "focus") {
    return `<svg class="geo-ico" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="currentColor"/></svg>`;
  }
  if (id === "support") {
    return `<svg class="geo-ico" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" fill="currentColor"/></svg>`;
  }
  if (id === "supplement") {
    return `<svg class="geo-ico" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,2.5 22,20.5 2,20.5" fill="currentColor"/></svg>`;
  }
  return `<svg class="geo-ico" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="3.2" fill="currentColor"/><rect x="2" y="10.4" width="20" height="3.2" fill="currentColor"/><rect x="2" y="16.8" width="20" height="3.2" fill="currentColor"/></svg>`;
}

// =====================================================================
// 01 节：5 秒首屏扫读耐心模拟器
// =====================================================================
function initScanSim() {
  const slider = document.getElementById("scan-budget");
  const valEl = document.getElementById("scan-budget-val");
  const playBtn = document.getElementById("scan-play");
  const origList = document.getElementById("scan-orig");
  const reordList = document.getElementById("scan-reord");
  const verdict = document.getElementById("scan-verdict");
  if (!slider || !origList || !reordList) return;

  const ORIG_ORDER = ["supplement", "focus", "support", "extend"];
  const REORD_ORDER = ["focus", "support", "supplement", "extend"];
  let rafId = 0;

  function renderColumn(container, items, isReord) {
    container.innerHTML = items
      .map((item, idx) => {
        const pct = Math.round(item.progress * 100);
        const stateLabel =
          item.state === "read" ? "已读完" : item.state === "partial" ? `读到 ${pct}%` : "尚未触达";
        return `
          <div class="scan-card is-${item.state}${item.isCore ? " is-core" : ""}">
            <div class="scan-fill" style="width:${pct}%"></div>
            <div class="scan-row">
              <span class="scan-slot">${SLOT_CIRCLES[idx]}</span>
              <span class="scan-ico">${shapeSvg(item.id, 15)}</span>
              <strong class="scan-name">${item.name}</strong>
              <span class="scan-state">${stateLabel}</span>
            </div>
            <p class="scan-desc">${item.desc}</p>
          </div>
        `;
      })
      .join("");
    container.dataset.mode = isReord ? "reord" : "orig";
  }

  function update(sec) {
    valEl.textContent = `${sec.toFixed(1)} 秒`;
    const orig = simulateScan(ORIG_ORDER, sec);
    const reord = simulateScan(REORD_ORDER, sec);
    renderColumn(origList, orig.items, false);
    renderColumn(reordList, reord.items, true);

    if (sec <= 3.6) {
      verdict.textContent = `在 ${sec.toFixed(1)} 秒耐心窗口里：原始顺序的读者几乎把时间全花在了「产品背景」上，还没看到核心优势；重排后的读者已经完整拿到了「产品优势」，并开始读「使用方法」。`;
    } else if (sec <= 6.2) {
      verdict.textContent = `在 ${sec.toFixed(1)} 秒时：原始顺序刚刚才触及「产品优势」，「使用方法」几乎没看；重排后已经连读完「产品优势 + 使用方法」两块核心决策信息。`;
    } else if (sec <= 9.5) {
      verdict.textContent = `到 ${sec.toFixed(1)} 秒时：两版都已经读到产品优势与使用方法，但重排后早在第 2.5 秒就完成了第一印象定锚，中途流失风险远低于原始顺序。`;
    } else {
      verdict.textContent = `只有当读者愿意花满 ${sec.toFixed(1)} 秒从头读到尾，两版吸收的信息量才会追平——但在网页扫读环境里，大多数访客根本撑不到这一刻。`;
    }
  }

  slider.addEventListener("input", () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    update(parseFloat(slider.value));
  });

  playBtn?.addEventListener("click", () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (reducedMotion.matches) {
      slider.value = "5.0";
      update(5.0);
      return;
    }
    const targetSec = 5.0;
    const durMs = 1500;
    const t0 = performance.now();
    playBtn.disabled = true;
    const step = (now) => {
      const u = Math.min(1, (now - t0) / durMs);
      const val = +(0.5 + u * (targetSec - 0.5)).toFixed(1);
      slider.value = String(val);
      update(val);
      if (u < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        rafId = 0;
        playBtn.disabled = false;
      }
    };
    rafId = requestAnimationFrame(step);
  });

  update(parseFloat(slider.value));
}

// =====================================================================
// 02 节：五节点蓝图年表切签与结构微图窗
// =====================================================================
function historyDiagramSvg(kind) {
  if (kind === "pyramid") {
    return `<svg viewBox="0 0 280 144" class="hist-svg" role="img" aria-label="倒金字塔结构示意">
      <polygon points="16,14 264,14 220,54 60,54" fill="#011A8C" stroke="#011A8C" stroke-width="1.5"/>
      <polygon points="62,60 218,60 182,96 98,96" fill="#2341B5" stroke="#011A8C" stroke-width="1.2"/>
      <polygon points="100,102 180,102 140,134" fill="#C6D4F8" stroke="#011A8C" stroke-width="1.2"/>
      <text x="140" y="38" text-anchor="middle" fill="#E1DE36" font-size="11.5" font-weight="700">首段：最核心事实（5W）</text>
      <text x="140" y="82" text-anchor="middle" fill="#FDFFF3" font-size="10.5" font-weight="600">中段：关键细节支撑</text>
      <text x="140" y="117" text-anchor="middle" fill="#0A1647" font-size="9.5" font-weight="700">背景</text>
    </svg>`;
  }
  if (kind === "u-curve") {
    return `<svg viewBox="0 0 260 140" class="hist-svg" role="img" aria-label="系列位置 U 形回忆曲线示意">
      <line x1="28" y1="116" x2="240" y2="116" stroke="#011A8C" stroke-width="1.5"/>
      <line x1="28" y1="18" x2="28" y2="116" stroke="#011A8C" stroke-width="1.5"/>
      <path d="M 40 30 Q 108 112 152 94 T 228 42" fill="none" stroke="#011A8C" stroke-width="3"/>
      <circle cx="44" cy="34" r="6" fill="#E1DE36" stroke="#011A8C" stroke-width="2"/>
      <circle cx="136" cy="96" r="5" fill="#B82914"/>
      <circle cx="226" cy="44" r="6" fill="#E1DE36" stroke="#011A8C" stroke-width="2"/>
      <text x="48" y="24" fill="#011A8C" font-size="11" font-weight="700">首因高地</text>
      <text x="136" y="84" text-anchor="middle" fill="#B82914" font-size="10.5" font-weight="700">中段遗忘谷</text>
      <text x="218" y="31" text-anchor="end" fill="#011A8C" font-size="11" font-weight="700">近因高地</text>
      <text x="134" y="132" text-anchor="middle" fill="#334375" font-size="10">条目出现次序（前 → 后）</text>
    </svg>`;
  }
  if (kind === "web-fold") {
    return `<svg viewBox="0 0 260 140" class="hist-svg" role="img" aria-label="网页首屏截断与扫读示意">
      <rect x="30" y="12" width="200" height="116" fill="#FFFFFF" stroke="#011A8C" stroke-width="1.6"/>
      <rect x="42" y="22" width="176" height="34" fill="#011A8C"/>
      <text x="130" y="43" text-anchor="middle" fill="#E1DE36" font-size="12" font-weight="700">首屏直给结论与价值</text>
      <line x1="20" y1="68" x2="240" y2="68" stroke="#B82914" stroke-width="1.5" stroke-dasharray="5,4"/>
      <text x="234" y="63" text-anchor="end" fill="#B82914" font-size="10" font-weight="700">首屏线 FOLD</text>
      <rect x="42" y="78" width="110" height="16" fill="#DCE5FA"/>
      <rect x="42" y="100" width="150" height="16" fill="#EAEFF9"/>
      <text x="97" y="90" text-anchor="middle" fill="#0A1647" font-size="10">支撑与展开链接</text>
      <text x="117" y="112" text-anchor="middle" fill="#334375" font-size="10">背景与附录后置</text>
    </svg>`;
  }
  if (kind === "choreography") {
    return `<svg viewBox="0 0 260 140" class="hist-svg" role="img" aria-label="响应式内容编排跨屏换序示意">
      <rect x="14" y="16" width="106" height="108" fill="#FFFFFF" stroke="#011A8C" stroke-width="1.5"/>
      <rect x="22" y="26" width="56" height="40" fill="#011A8C"/>
      <text x="50" y="50" text-anchor="middle" fill="#E1DE36" font-size="11" font-weight="700">主区 ①</text>
      <rect x="84" y="26" width="28" height="88" fill="#DCE5FA" stroke="#011A8C" stroke-width="1"/>
      <text x="98" y="74" text-anchor="middle" fill="#0A1647" font-size="10" font-weight="700">②</text>
      <rect x="22" y="74" width="56" height="40" fill="#EEF2FB" stroke="#011A8C" stroke-width="1"/>
      <text x="50" y="98" text-anchor="middle" fill="#334375" font-size="10">③ 背景</text>
      <path d="M126 70 L164 70" stroke="#011A8C" stroke-width="2"/>
      <polygon points="168,70 159,65 159,75" fill="#011A8C"/>
      <rect x="176" y="16" width="70" height="108" fill="#FFFFFF" stroke="#011A8C" stroke-width="1.5"/>
      <rect x="184" y="24" width="54" height="26" fill="#011A8C"/>
      <text x="211" y="41" text-anchor="middle" fill="#E1DE36" font-size="11" font-weight="700">① 核心</text>
      <rect x="184" y="56" width="54" height="26" fill="#DCE5FA" stroke="#011A8C" stroke-width="1"/>
      <text x="211" y="73" text-anchor="middle" fill="#0A1647" font-size="10.5" font-weight="700">② 穿插</text>
      <rect x="184" y="88" width="54" height="26" fill="#EEF2FB" stroke="#011A8C" stroke-width="1"/>
      <text x="211" y="105" text-anchor="middle" fill="#334375" font-size="10">③ 后置</text>
    </svg>`;
  }
  return `<svg viewBox="0 0 260 140" class="hist-svg" role="img" aria-label="CSS reading-flow 同步视觉与焦点顺序示意">
    <rect x="16" y="28" width="50" height="46" fill="#011A8C"/>
    <rect x="76" y="28" width="50" height="46" fill="#011A8C"/>
    <rect x="136" y="28" width="50" height="46" fill="#011A8C"/>
    <rect x="196" y="28" width="50" height="46" fill="#011A8C"/>
    <text x="41" y="55" text-anchor="middle" fill="#E1DE36" font-size="12" font-weight="700">1</text>
    <text x="101" y="55" text-anchor="middle" fill="#E1DE36" font-size="12" font-weight="700">2</text>
    <text x="161" y="55" text-anchor="middle" fill="#E1DE36" font-size="12" font-weight="700">3</text>
    <text x="221" y="55" text-anchor="middle" fill="#E1DE36" font-size="12" font-weight="700">4</text>
    <path d="M41 88 L221 88" stroke="#0D6644" stroke-width="2.5"/>
    <polygon points="227,88 217,83 217,93" fill="#0D6644"/>
    <text x="130" y="114" text-anchor="middle" fill="#0D6644" font-size="11" font-weight="700">reading-flow：视线与 Tab 焦点同向推进</text>
  </svg>`;
}

function initHistoryTimeline() {
  const nav = document.getElementById("hist-tabs");
  const detail = document.getElementById("hist-detail");
  if (!nav || !detail) return;

  let active = 0;

  function render() {
    nav.innerHTML = HISTORY_NODES.map(
      (n, i) => `
        <button type="button" class="hist-tab${i === active ? " is-active" : ""}" data-idx="${i}" aria-pressed="${i === active}">
          <span class="hist-year" lang="en">${n.year}</span>
          <span class="hist-short">${n.title}</span>
        </button>
      `
    ).join("");

    const cur = HISTORY_NODES[active];
    detail.innerHTML = `
      <div class="hist-copy">
        <p class="hist-meta"><span lang="en">${cur.year}</span> · ${cur.person}</p>
        <h3>${cur.title}</h3>
        <p class="hist-work">${cur.work}</p>
        <p class="hist-text">${cur.summary}</p>
        <p class="hist-take"><strong>对顺序重排的启发：</strong>${cur.takeaway}</p>
      </div>
      <div class="hist-fig">${historyDiagramSvg(cur.diagram)}</div>
    `;
  }

  nav.addEventListener("click", (e) => {
    const btn = e.target.closest(".hist-tab");
    if (!btn) return;
    active = Number(btn.dataset.idx);
    render();
  });

  render();
}

// =====================================================================
// 03 节：双设备目标驱动编排对照台
// =====================================================================
function initIntentMatrix() {
  const tabsEl = document.getElementById("intent-tabs");
  const briefEl = document.getElementById("intent-brief");
  const deskEl = document.getElementById("intent-desktop");
  const mobEl = document.getElementById("intent-mobile");
  const codeEl = document.getElementById("intent-code");
  if (!tabsEl || !deskEl || !mobEl) return;

  let curId = "browse";

  function render() {
    const m = INTENT_MATRICES[curId];
    tabsEl.querySelectorAll("button").forEach((b) => {
      const on = b.dataset.intent === curId;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    briefEl.textContent = m.brief;

    // 桌面 3 列 × 2 行 Grid 实装
    const areas = m.desktopAreas.map((row) => `"${row.join(" ")}"`).join(" ");
    deskEl.style.gridTemplateAreas = areas;
    deskEl.innerHTML = m.mobileOrder
      .map((id, idx) => {
        const info = m.names[id];
        return `
          <div class="mx-block mx-area-${id}${idx === 0 ? " is-lead" : ""}" style="grid-area:${id}">
            <div class="mx-head">
              <span class="mx-rank">${SLOT_CIRCLES[idx]}</span>
              <span class="mx-ico">${shapeSvg(id, 14)}</span>
              <strong>${info.title}</strong>
            </div>
            <p>${info.sub}</p>
          </div>
        `;
      })
      .join("");

    // 手机单列实装
    mobEl.innerHTML = m.mobileOrder
      .map((id, idx) => {
        const info = m.names[id];
        return `
          <div class="mx-mob-item${idx === 0 ? " is-lead" : ""}">
            <span class="mx-rank">${SLOT_CIRCLES[idx]}</span>
            <span class="mx-ico">${shapeSvg(id, 13)}</span>
            <div class="mx-mob-txt">
              <strong>${info.title}</strong>
              <span>${info.sub}</span>
            </div>
          </div>
        `;
      })
      .join("");

    if (codeEl) codeEl.textContent = m.cssSnippet;
  }

  tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-intent]");
    if (!btn) return;
    curId = btn.dataset.intent;
    render();
  });

  render();
}

// =====================================================================
// 04 节：活体 Tab 焦点步进仪
// =====================================================================
function initTabStepper() {
  const modeWrap = document.getElementById("tab-modes");
  const stepBtn = document.getElementById("tab-step");
  const resetBtn = document.getElementById("tab-reset");
  const stageEl = document.getElementById("tab-stage");
  const svgEl = document.getElementById("tab-svg");
  const srEl = document.getElementById("tab-sr");
  const badgeEl = document.getElementById("tab-badge");
  const expEl = document.getElementById("tab-explain");
  const codeEl = document.getElementById("tab-code");
  if (!modeWrap || !stageEl || !svgEl) return;

  let modeKey = "cssOrder"; // 开场先停在反例「只用 CSS order 硬挪」，让用户亲眼看到焦点跳线
  let stepIdx = 0; // 0..3 表示当前聚焦到第几下 Tab

  const LABELS = {
    focus: { title: "产品优势", domIdx: 2 },
    support: { title: "使用方法", domIdx: 3 },
    supplement: { title: "产品背景", domIdx: 1 },
    extend: { title: "用户案例", domIdx: 4 },
  };

  function render() {
    const cfg = TAB_MODES[modeKey];
    modeWrap.querySelectorAll("button").forEach((b) => {
      const on = b.dataset.tabMode === modeKey;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    const activeVisualSlot = cfg.tabTrail[stepIdx];
    stageEl.innerHTML = cfg.visualItems
      .map((id, visIdx) => {
        const orderInTab = cfg.tabTrail.indexOf(visIdx) + 1;
        const focused = visIdx === activeVisualSlot;
        const domNum = modeKey === "cssOrder" ? LABELS[id].domIdx : visIdx + 1;
        return `
          <button type="button" class="tab-card${focused ? " is-focused" : ""}${!cfg.ok && focused ? " is-warn" : ""}" data-vis="${visIdx}">
            <span class="tab-slot-tag" lang="en">视觉 #${visIdx + 1} · DOM #${domNum}</span>
            <span class="tab-card-title">${shapeSvg(id, 15)} ${LABELS[id].title}</span>
            <span class="tab-hit" lang="en">第 ${orderInTab} 次 Tab</span>
          </button>
        `;
      })
      .join("");

    // SVG 跳线轨迹（等比 800×72 坐标系，绝不拉扁圆点）
    const xs = [100, 300, 500, 700];
    let paths = "";
    for (let i = 0; i < cfg.tabTrail.length - 1; i++) {
      const x1 = xs[cfg.tabTrail[i]];
      const x2 = xs[cfg.tabTrail[i + 1]];
      const isJump = cfg.tabTrail[i + 1] < cfg.tabTrail[i] || cfg.tabTrail[i + 1] - cfg.tabTrail[i] > 1;
      const reached = i < stepIdx;
      const midX = (x1 + x2) / 2;
      const ctrlY = isJump ? (i % 2 === 0 ? 8 : 66) : 24;
      const stroke = isJump ? "#B82914" : "#0D6644";
      const op = reached ? 1 : 0.55;
      paths += `<path d="M ${x1} 44 Q ${midX} ${ctrlY} ${x2} 44" fill="none" stroke="${stroke}" stroke-width="${reached ? 3.2 : 2.2}" stroke-opacity="${op}" ${isJump ? 'stroke-dasharray="7,5"' : ""}/>`;
      paths += `<circle cx="${x2}" cy="44" r="4.5" fill="${stroke}" fill-opacity="${op}"/>`;
    }
    const curX = xs[activeVisualSlot];
    paths += `<circle cx="${curX}" cy="44" r="8" fill="${cfg.ok ? "#011A8C" : "#B82914"}" stroke="#E1DE36" stroke-width="3"/>`;
    svgEl.innerHTML = paths;

    // 读屏朗读顺序队列
    const srQueue = cfg.tabTrail
      .map((visIdx, k) => {
        const id = cfg.visualItems[visIdx];
        const cls = k === stepIdx ? "is-now" : "";
        return `<span class="sr-pill ${cls}">Tab ${k + 1}：${LABELS[id].title}</span>`;
      })
      .join(`<span class="sr-arr" aria-hidden="true">→</span>`);
    srEl.innerHTML = srQueue;

    badgeEl.textContent = cfg.badge;
    badgeEl.className = `tab-badge ${cfg.ok ? "is-ok" : "is-bad"}`;
    expEl.textContent = cfg.explain;
    if (codeEl) codeEl.textContent = cfg.code;
  }

  modeWrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-tab-mode]");
    if (!btn) return;
    modeKey = btn.dataset.tabMode;
    stepIdx = 0;
    render();
  });

  stepBtn?.addEventListener("click", () => {
    stepIdx = (stepIdx + 1) % 4;
    render();
  });

  resetBtn?.addEventListener("click", () => {
    stepIdx = 0;
    render();
  });

  stageEl.addEventListener("click", (e) => {
    const card = e.target.closest(".tab-card");
    if (!card) return;
    const vis = Number(card.dataset.vis);
    const idx = TAB_MODES[modeKey].tabTrail.indexOf(vis);
    if (idx !== -1) {
      stepIdx = idx;
      render();
    }
  });

  render();
}

// =====================================================================
// 05 节：什么时候别硬做顺序重排（四场景反例翻切验伤卡）
// =====================================================================
function initAntiPatterns() {
  const tabsEl = document.getElementById("anti-tabs");
  const toggleBtn = document.getElementById("anti-toggle");
  const cardEl = document.getElementById("anti-card");
  if (!tabsEl || !toggleBtn || !cardEl) return;

  let curKey = "safety";
  let showGood = false;

  function render() {
    const item = ANTIPATTERNS[curKey];
    tabsEl.querySelectorAll("button").forEach((b) => {
      const on = b.dataset.anti === curKey;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    toggleBtn.textContent = showGood ? "切回「硬套顺序重排」看翻车" : "切换「保留自然序」看稳妥做法";
    toggleBtn.setAttribute("aria-pressed", String(showGood));

    const list = showGood ? item.goodItems : item.badItems;
    cardEl.className = `anti-board ${showGood ? "is-good" : "is-bad"}`;
    cardEl.innerHTML = `
      <div class="anti-head">
        <span class="anti-pill">${showGood ? "✓ 稳妥做法" : "× 硬套重排翻车"} · ${item.tag}</span>
        <h3>${showGood ? item.goodTitle : item.badTitle}</h3>
      </div>
      <ol class="anti-list">
        ${list
          .map(
            (row) => `
          <li class="anti-row${row.warn ? " is-warn" : ""}">
            <span class="anti-k">${row.k}</span>
            <span class="anti-t">${row.t}</span>
          </li>`
          )
          .join("")}
      </ol>
      <p class="anti-why">${showGood ? item.goodWhy : item.badWhy}</p>
    `;
  }

  tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-anti]");
    if (!btn) return;
    curKey = btn.dataset.anti;
    showGood = false;
    render();
  });

  toggleBtn.addEventListener("click", () => {
    showGood = !showGood;
    render();
  });

  render();
}

// =====================================================================
// 06 节：严格单变量小练习（A / B / C / D 中性蓝图卡）
// =====================================================================
function initQuiz() {
  const grid = document.getElementById("quiz-grid");
  const fb = document.getElementById("quiz-feedback");
  const retryBtn = document.getElementById("quiz-retry");
  if (!grid || !fb) return;

  let picked = null;

  function render() {
    grid.innerHTML = QUIZ_OPTIONS.map((opt) => {
      const isPicked = picked === opt.key;
      const reveal = picked !== null;
      const cls = [
        "quiz-card",
        isPicked ? "is-picked" : "",
        reveal && opt.correct ? "is-right" : "",
        reveal && isPicked && !opt.correct ? "is-wrong" : "",
      ]
        .filter(Boolean)
        .join(" ");

      const blocks = opt.order
        .map((id, i) => {
          const m = QUIZ_MODULES[id];
          const isBack = reveal && opt.adjacentBacktracks.some(([a]) => a === i);
          return `
            <div class="q-mod${isBack ? " is-break" : ""}">
              <span class="q-num">${SLOT_CIRCLES[i]}</span>
              <span class="q-ico">${shapeSvg(id, 13)}</span>
              <div class="q-txt">
                <strong>${m.title}</strong>
                <span>${m.desc}</span>
              </div>
            </div>
          `;
        })
        .join("");

      const postBadge = reveal
        ? `<span class="q-result">${opt.correct ? "✓ 0 处逆序 · 最佳顺次" : `逆序 ${opt.inversions} 处`}</span>`
        : "";

      return `
        <button type="button" class="${cls}" data-key="${opt.key}" aria-pressed="${isPicked}">
          <div class="q-head">
            <span class="q-letter" lang="en">${opt.key}</span>
            ${postBadge}
          </div>
          <div class="q-stack">${blocks}</div>
        </button>
      `;
    }).join("");

    if (!picked) {
      fb.innerHTML = `<p class="q-prompt">点选 <strong>A / B / C / D</strong>（或按键盘数字键 1–4），观察四张仅顺序不同的移动端报名页，选出最适合「15 秒判断值不值得学」的版本。</p>`;
      if (retryBtn) retryBtn.hidden = true;
    } else {
      const chosen = QUIZ_OPTIONS.find((o) => o.key === picked);
      const best = QUIZ_OPTIONS.find((o) => o.correct);
      fb.innerHTML = `
        <p class="q-verdict ${chosen.correct ? "is-right" : "is-wrong"}">
          ${chosen.correct ? `答对了！选项 ${chosen.key} 正是零逆序的标准顺次。` : `你选了 ${chosen.key}（存在 ${chosen.inversions} 处逆序）——更顺手的是选项 ${best.key}。`}
        </p>
        <p class="q-detail"><strong>你选的 ${chosen.key}：</strong>${chosen.reason}</p>
        ${chosen.correct ? "" : `<p class="q-detail"><strong>为什么选 ${best.key}：</strong>${best.reason}</p>`}
      `;
      if (retryBtn) retryBtn.hidden = false;
    }
  }

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".quiz-card");
    if (!card) return;
    picked = card.dataset.key;
    render();
  });

  retryBtn?.addEventListener("click", () => {
    picked = null;
    render();
  });

  document.addEventListener("keydown", (e) => {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const map = { "1": "A", "2": "B", "3": "C", "4": "D" };
    if (!map[e.key]) return;
    // 只有当小练习大致在视口内时响应 1-4，避免打断别处
    const r = grid.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      picked = map[e.key];
      render();
    }
  });

  render();
}

// =====================================================================
// 07 节：原海报蓝图灯箱（缩放、拖拽、draggable="false"、Esc 关闭）
// =====================================================================
function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const dlg = document.getElementById("lightbox");
  const img = document.getElementById("lb-img");
  const zoomIn = document.getElementById("lb-in");
  const zoomOut = document.getElementById("lb-out");
  const zoomReset = document.getElementById("lb-reset");
  const closeBtn = document.getElementById("lb-close");
  const stage = document.getElementById("lb-stage");
  if (!poster || !dlg || !img || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function open() {
    if (!img.src) img.src = poster.currentSrc || poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    if (typeof dlg.showModal === "function") {
      if (!dlg.open) dlg.showModal();
    } else {
      dlg.setAttribute("open", "");
    }
  }

  function close() {
    if (typeof dlg.close === "function" && dlg.open) dlg.close();
    else dlg.removeAttribute("open");
  }

  openBtn?.addEventListener("click", open);
  poster.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dlg.open) {
      e.preventDefault();
      close();
    }
  });

  zoomIn?.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOut?.addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  zoomReset?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  stage.addEventListener("pointerup", () => {
    dragging = false;
  });
  stage.addEventListener("pointercancel", () => {
    dragging = false;
  });
}

export function initSections() {
  initScanSim();
  initHistoryTimeline();
  initIntentMatrix();
  initTabStepper();
  initAntiPatterns();
  initQuiz();
  initPosterLightbox();
}

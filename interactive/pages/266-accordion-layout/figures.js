import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  LINEAGE_ITEMS,
  QUIZ_ITEMS,
  computeTaskMetrics,
} from "./model.js";

// ---------- 01 折叠与代价：三类真实翻找任务对比 ----------
export function initTaskLab() {
  const buttons = [...document.querySelectorAll("[data-task-id]")];
  const goalEl = document.getElementById("task-goal");
  const svgEl = document.getElementById("task-svg");
  const accVerdictEl = document.getElementById("task-acc-verdict");
  const accMetricsEl = document.getElementById("task-acc-metrics");
  const accExplainEl = document.getElementById("task-acc-explain");
  const flatVerdictEl = document.getElementById("task-flat-verdict");
  const flatMetricsEl = document.getElementById("task-flat-metrics");
  const flatExplainEl = document.getElementById("task-flat-explain");
  if (!buttons.length || !svgEl) return;

  function render(taskId) {
    const m = computeTaskMetrics(taskId);
    buttons.forEach((b) => {
      const on = b.dataset.taskId === taskId;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    goalEl.textContent = m.userGoal;
    accVerdictEl.textContent = m.accordion.verdict;
    accVerdictEl.dataset.good = String(m.accordion.good);
    accMetricsEl.innerHTML = `<span>首屏高 ${m.accVisiblePct}%</span><span>点击 ${m.accordion.clicks} 次</span><span>跳过 ${m.accordion.skippedBlocks} 段</span>`;
    accExplainEl.textContent = m.accordion.explain;

    flatVerdictEl.textContent = m.flat.verdict;
    flatVerdictEl.dataset.good = String(m.flat.good);
    flatMetricsEl.innerHTML = `<span>首屏高 100%</span><span>点击 0 次</span><span>${m.flat.ctrlF}</span>`;
    flatExplainEl.textContent = m.flat.explain;

    // SVG side-by-side schematic comparing Accordion stack vs Full Open Column
    const n = m.sections;
    const accRows = [];
    let ay = 40;
    for (let i = 0; i < n; i++) {
      const isOpen = i === 0;
      const isNeeded = i < m.needed;
      const h = isOpen ? 36 : 14;
      const fill = isOpen ? "#F85822" : isNeeded ? "#FA7747" : "#D6C8B2";
      accRows.push(
        `<rect x="28" y="${ay}" width="176" height="${h}" fill="${fill}" opacity="${isOpen ? 1 : 0.88}"/>` +
          `<text x="36" y="${ay + 10.5}" fill="${isOpen ? "#FFFDF9" : "#18130F"}" font-size="9.5" font-family="JetBrains Mono, Noto Sans SC, sans-serif">0${i + 1}${isOpen ? " ▾ 已展开" : isNeeded ? " ▸ 仍需点开" : " ▸ 已收合跳过"}</text>`
      );
      ay += h + 4;
    }

    const flatRows = [];
    let fy = 40;
    const flatH = Math.min(24, Math.floor(172 / n) - 3);
    for (let i = 0; i < n; i++) {
      const isNeeded = i < m.needed;
      const fill = isNeeded ? "#14664A" : "#C9BBA4";
      flatRows.push(
        `<rect x="256" y="${fy}" width="176" height="${flatH}" fill="${fill}" opacity="${isNeeded ? 0.92 : 0.72}"/>` +
          `<text x="264" y="${fy + flatH * 0.65}" fill="${isNeeded ? "#FFFDF9" : "#2D2A24"}" font-size="9" font-family="JetBrains Mono, monospace">0${i + 1} ${isNeeded ? "直读目标段" : "需滑过"}</text>`
      );
      fy += flatH + 3;
    }

    svgEl.innerHTML = `
      <rect x="0" y="0" width="460" height="248" fill="#F6EDDD"/>
      <line x1="230" y1="16" x2="230" y2="234" stroke="#B9AC96" stroke-dasharray="3 3"/>
      <text x="28" y="25" fill="#050504" font-size="11" font-weight="700" font-family="Noto Sans SC, sans-serif">手风琴 266（首屏省高 ${m.accSavedPct}% · 需点 ${m.accordion.clicks} 次）</text>
      <text x="256" y="25" fill="#050504" font-size="11" font-weight="700" font-family="Noto Sans SC, sans-serif">单列平铺 255（全文 100% · 0 点击）</text>
      ${accRows.join("")}
      ${flatRows.join("")}
      <text x="28" y="236" fill="${m.accordion.good ? "#14664A" : "#B81D13"}" font-size="10.5" font-weight="700" font-family="Noto Sans SC, sans-serif">${m.accordion.good ? "✓" : "×"} ${m.accordion.verdict}</text>
      <text x="256" y="236" fill="${m.flat.good ? "#14664A" : "#B53105"}" font-size="10.5" font-weight="700" font-family="Noto Sans SC, sans-serif">${m.flat.good ? "✓" : "△"} ${m.flat.verdict}</text>
    `;
  }

  buttons.forEach((b) => b.addEventListener("click", () => render(b.dataset.taskId)));
  render("lookup");
}

// ---------- 02 折标与气味：四大折标真按台 + 裂开热区实验 ----------
export function initSignifierLab() {
  const wrap = document.getElementById("sig-lab-rows");
  const modeBtns = [...document.querySelectorAll("[data-hitbox-mode]")];
  const logEl = document.getElementById("sig-lab-log");
  if (!wrap || !logEl) return;

  let hitboxMode = "full"; // "full" | "split"
  const rows = [
    {
      id: "caret",
      iconClosed: "▾",
      iconOpen: "▴",
      tag: "角标 ▾/▴（推荐）",
      title: "开具企业增值税专用发票需要哪些材料？",
      body: "NN/g 2020 实证研究显示：向下/向上角标是最清晰的原地展开信号，用户一眼知道内容会在原地滑开，不会跳离当前页。",
      open: true,
      grade: "good",
    },
    {
      id: "plus",
      iconClosed: "+",
      iconOpen: "−",
      tag: "加减号 +/−（可用）",
      title: "海外直邮订单如何清关与计算关税？",
      body: "加减号同样能明确传达「添加/展开更多细节」，在参数表与树状结构中十分常见，略逊于角标但在工程界面中表现稳健。",
      open: false,
      grade: "ok",
    },
    {
      id: "arrow",
      iconClosed: "→",
      iconOpen: "→",
      tag: "右箭头 →（歧义）",
      title: "延长保修服务如何激活与查询？",
      body: "右箭头常表示「进入下一级页面」。把右箭头放在手风琴上会制造语义摇摆：用户点之前拿不准会原地展开还是跳走。",
      open: false,
      grade: "warn",
    },
    {
      id: "none",
      iconClosed: "",
      iconOpen: "",
      tag: "无图标（误导）",
      title: "会员积分清零提醒与补登规则",
      body: "没有任何折标时，多数读者会把整行看成纯文字标题或页面跳转链接，根本意识不到这里可以原地展开隐藏内容。",
      open: false,
      grade: "bad",
    },
  ];

  function render() {
    modeBtns.forEach((b) => {
      const on = b.dataset.hitboxMode === hitboxMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    wrap.innerHTML = rows
      .map((r) => {
        const icon = r.open ? r.iconOpen : r.iconClosed;
        if (hitboxMode === "full") {
          return `<div class="sig-row sig-row--${r.grade}${r.open ? " is-open" : ""}">
            <button type="button" class="sig-trigger-full" data-sig-toggle="${r.id}" aria-expanded="${r.open}">
              <span class="sig-tag">${r.tag}</span>
              <span class="sig-title">${r.title}</span>
              <span class="sig-glyph" aria-hidden="true">${icon || "∅"}</span>
            </button>
            <div class="sig-body"${r.open ? "" : " hidden"}><p>${r.body}</p></div>
          </div>`;
        }
        return `<div class="sig-row sig-row--${r.grade} is-split${r.open ? " is-open" : ""}">
          <div class="sig-split-bar">
            <button type="button" class="sig-split-link" data-sig-jump="${r.id}">
              <span class="sig-tag">${r.tag}</span>
              <span class="sig-title">${r.title}</span>
              <span class="sig-split-hint">文字区 84%（跳转）</span>
            </button>
            <button type="button" class="sig-split-icon" data-sig-toggle="${r.id}" aria-expanded="${r.open}" aria-label="仅图标展开 ${r.title}">
              ${icon || "∅"}
            </button>
          </div>
          <div class="sig-body"${r.open ? "" : " hidden"}><p>${r.body}</p></div>
        </div>`;
      })
      .join("");
  }

  wrap.addEventListener("click", (e) => {
    const jump = e.target.closest("[data-sig-jump]");
    if (jump) {
      logEl.dataset.tone = "warn";
      logEl.textContent = "误触跳转！你点中了占 84% 宽度的标题文字——「裂开热区」让想展开内容的用户意外跳离本页，这是手风琴最常见的高频失误。";
      return;
    }
    const tog = e.target.closest("[data-sig-toggle]");
    if (!tog) return;
    const item = rows.find((r) => r.id === tog.dataset.sigToggle);
    if (!item) return;
    item.open = !item.open;
    render();
    logEl.dataset.tone = item.grade === "good" || item.grade === "ok" ? "ok" : "warn";
    logEl.textContent =
      hitboxMode === "split"
        ? `你精准点中了窄小的图标热区，${item.open ? "展开" : "收起"}了「${item.tag}」。但在手机触屏上，多数人会直接点中左侧文字区。`
        : `${item.open ? "已展开" : "已收起"}「${item.tag}」——整行都是安全点击区，点击容错率提升约 5 倍。`;
  });

  modeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      hitboxMode = b.dataset.hitboxMode;
      render();
      logEl.dataset.tone = hitboxMode === "full" ? "ok" : "warn";
      logEl.textContent =
        hitboxMode === "full"
          ? "当前为「整行触发」：点标题文字或图标任意位置都会稳定原地展开，零跳转歧义。"
          : "当前为「裂开热区（反模式）」：试试点标题文字看看会发生什么——只有最末端的 48px 小框才能展开！";
    });
  });

  render();
}

// ---------- 03 展开机制暗室：折叠运动学 + 防跳屏 Canvas & 原生 <details name> ----------
export function initDarkroomLab() {
  const canvas = document.getElementById("motion-canvas");
  const speedBtns = [...document.querySelectorAll("[data-motion-speed]")];
  const anchorBtns = [...document.querySelectorAll("[data-jump-mode]")];
  const triggerBtn = document.getElementById("motion-trigger-btn");
  const motionNote = document.getElementById("motion-note");

  // Native <details> live lab
  const nativeToggleBtns = [...document.querySelectorAll("[data-native-mode]")];
  const nativeGroup = document.getElementById("native-details-demo");
  const nativeCode = document.getElementById("native-code-view");

  if (nativeGroup && nativeCode) {
    let nativeExclusive = true;
    const updateNative = () => {
      nativeToggleBtns.forEach((b) => {
        const on = (b.dataset.nativeMode === "exclusive") === nativeExclusive;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      const detailsList = [...nativeGroup.querySelectorAll("details")];
      detailsList.forEach((d) => {
        if (nativeExclusive) d.setAttribute("name", "xxd-266-exclusive");
        else d.removeAttribute("name");
      });
      const openIdx = detailsList.findIndex((d) => d.open);
      nativeCode.textContent = nativeExclusive
        ? `<!-- 2024 原生互斥手风琴（零 JS） -->
<details name="faq-266"${openIdx === 0 ? " open" : ""}>
  <summary>01 · 原生互斥如何生效？</summary>
  <p>相同 name 构成互斥组，开一关余。</p>
</details>
<details name="faq-266"${openIdx === 1 ? " open" : ""}>...</details>

/* 允许 0 → auto 平滑高度过渡 */
:root { interpolate-size: allow-keywords; }`
        : `<!-- 移除 name 即切换为多开并行 -->
<details${detailsList[0]?.open ? " open" : ""}>
  <summary>01 · 原生多开对照</summary>
  <p>可同时保留多个展开段落并排核对。</p>
</details>
<details${detailsList[1]?.open ? " open" : ""}>...</details>

/* ARIA 语义与键盘 Enter/Space 内置 */`;
    };
    nativeToggleBtns.forEach((b) =>
      b.addEventListener("click", () => {
        nativeExclusive = b.dataset.nativeMode === "exclusive";
        if (nativeExclusive) {
          const all = [...nativeGroup.querySelectorAll("details")];
          let kept = false;
          all.forEach((d) => {
            if (d.open && !kept) kept = true;
            else d.open = false;
          });
        }
        updateNative();
      })
    );
    nativeGroup.addEventListener("toggle", updateNative, true);
    updateNative();
  }

  if (!canvas) return;
  const c = canvas.getContext("2d");

  const OPEN_PANEL_H = 74;
  let speedMs = 240; // 0 | 240 | 900
  let jumpMode = "jump"; // "jump" (unanchored exclusive) | "anchored" (scroll anchored / multi)
  let phase = 0; // 0 = panel 1 open, 1 = panel 4 open
  let anim = 0; // 0..1 interpolation
  let targetPhase = 0;
  let dirty = true;

  function syncText() {
    speedBtns.forEach((b) => {
      const on = Number(b.dataset.motionSpeed) === speedMs;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    anchorBtns.forEach((b) => {
      const on = b.dataset.jumpMode === jumpMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    const speedTxt =
      speedMs === 0
        ? "0ms 瞬间硬切：高度突变让眼睛失去上下位移参照。"
        : speedMs === 900
        ? "900ms 拖沓慢放：用户想连续点下一项时被迫苦等近一秒。"
        : "240ms ease-out 利落折返：既保留风箱伸缩的空间因果，又不拖慢下一次点击。";

    const jumpTxt =
      jumpMode === "jump"
        ? `当前演示「无锚定跳屏」：点开下方 04 时，上方高面板 01 突然收起，把 04 整条向上猛抽 ${OPEN_PANEL_H}px——标题直接从光标底下逃跑！`
        : "当前演示「滚动锚定稳态」：收起上方 01 时同步补偿滚动偏移（或采用多开不强关），04 标题牢牢稳在光标原位。";

    if (motionNote) motionNote.textContent = `${speedTxt} ${jumpTxt}`;
  }

  function easeOut(x) {
    const k = 1 - Math.max(0, Math.min(1, x));
    return 1 - k * k * k;
  }

  function draw(t, dt, { still }) {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(240, Math.round(rect.width));
    const cssH = Math.max(210, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      dirty = true;
    }

    let running = false;
    if (still || speedMs === 0) {
      if (anim !== targetPhase) {
        anim = targetPhase;
        dirty = true;
      }
    } else if (Math.abs(targetPhase - anim) > 0.002) {
      const step = ((dt || 0.016) * 1000) / speedMs;
      anim = targetPhase > anim ? Math.min(targetPhase, anim + step) : Math.max(targetPhase, anim - step);
      running = true;
      dirty = true;
    } else if (anim !== targetPhase) {
      anim = targetPhase;
      dirty = true;
    }

    if (!dirty && !running) return;
    dirty = false;

    const p = easeOut(anim);
    c.save();
    c.scale(dpr, dpr);

    // Darkroom backdrop
    c.fillStyle = "#18130F";
    c.fillRect(0, 0, cssW, cssH);

    // Left track: simulated viewport box
    const narrowM = cssW < 380;
    const pad = narrowM ? 10 : 16;
    const boxW = cssW - pad * 2;
    const headerH = 26;
    const openH = OPEN_PANEL_H;
    const gap = 5;

    // Panel 1 collapses as p goes 0 -> 1; Panel 4 opens as p goes 0 -> 1
    const h1Body = openH * (1 - p);
    const h4Body = openH * p;

    // Cursor anchor line sits where Panel 4 originally was at p = 0
    const origY4 = pad + 26 + (headerH + gap) * 3 + openH;
    // Scroll compensation keeps panel 4 pinned when anchored
    const scrollComp = jumpMode === "anchored" ? openH * p : 0;

    c.font = `500 ${narrowM ? 10 : 10.5}px "JetBrains Mono", monospace`;
    c.fillStyle = "#CBBCA4";
    c.fillText(
      narrowM
        ? `${speedMs}ms · ${jumpMode === "jump" ? "无锚定跳屏" : "滚动锚定"}`
        : `TRANSITION ${speedMs}ms  ·  ${jumpMode === "jump" ? "UNANCHORED JUMP" : "ANCHORED STABLE"}`,
      pad,
      18
    );

    let y = pad + 26 + scrollComp;
    const labels = narrowM
      ? ["01 · 上方高面板", "02 · 物流时效", "03 · 发票凭证", "04 · 质保（点击项）"]
      : [
          "01 · 较长说明段落（上方高面板）",
          "02 · 物流与配送时效",
          "03 · 发票与报销凭证",
          "04 · 质保换新（用户刚点击此处）",
        ];
    let currentY4 = y;

    for (let i = 0; i < 4; i++) {
      const bodyH = i === 0 ? h1Body : i === 3 ? h4Body : 0;
      const isTarget = i === 3;
      if (isTarget) currentY4 = y;

      // Clip cleanly inside viewport frame
      if (y + headerH > 26 && y < cssH - 12) {
        c.fillStyle = isTarget ? "#F85822" : i === 0 && h1Body > 4 ? "#35281F" : "#261E18";
        c.fillRect(pad, y, boxW, headerH);
        c.strokeStyle = isTarget ? "#FF9B73" : "#4A3C31";
        c.lineWidth = 1;
        c.strokeRect(pad + 0.5, y + 0.5, boxW - 1, headerH - 1);

        c.fillStyle = isTarget ? "#FFFDF9" : "#E8DCC8";
        c.font = `600 11px "Noto Sans SC", sans-serif`;
        c.fillText(labels[i], pad + 10, y + 17);

        c.textAlign = "right";
        c.font = '600 13px "JetBrains Mono", monospace';
        c.fillText(bodyH > 12 ? "▴" : "▾", pad + boxW - 10, y + 17);
        c.textAlign = "left";
      }

      if (bodyH > 1) {
        c.fillStyle = isTarget ? "rgba(248, 88, 34, 0.16)" : "rgba(246, 237, 221, 0.08)";
        c.fillRect(pad, y + headerH, boxW, bodyH);
        // Schematic content bars inside expanding panel
        const lines = Math.floor((bodyH - 10) / 14);
        for (let k = 0; k < lines; k++) {
          c.fillStyle = isTarget ? "rgba(255, 196, 170, 0.55)" : "rgba(232, 220, 200, 0.34)";
          c.fillRect(pad + 12, y + headerH + 10 + k * 14, (boxW - 24) * (k === lines - 1 ? 0.56 : 0.88), 5);
        }
      }

      y += headerH + bodyH + gap;
    }

    // Cursor reference horizontal dashed line at original Panel 4 click height
    const clampedOrigY4 = Math.min(cssH - 28, origY4);
    const drift = Math.round(currentY4 - origY4);
    c.save();
    c.setLineDash([4, 3]);
    c.strokeStyle = jumpMode === "jump" && Math.abs(drift) > 8 ? "#FF7066" : "#5CD6A8";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(pad, clampedOrigY4 + headerH / 2);
    c.lineTo(pad + boxW, clampedOrigY4 + headerH / 2);
    c.stroke();
    c.setLineDash([]);

    // Drift annotation pill
    const pill =
      Math.abs(drift) > 8
        ? narrowM
          ? `× 上跳 ${Math.abs(drift)}px`
          : `× 标题向上逃离 ${Math.abs(drift)}px`
        : targetPhase === 1
        ? narrowM
          ? "✓ 0px 稳在原位"
          : "✓ 04 标题稳在原光标位（0px 跳屏）"
        : narrowM
        ? "← 原位"
        : "← 光标停在 04 标题行";
    c.font = '600 10.5px "Noto Sans SC", sans-serif';
    const pw = c.measureText(pill).width + 14;
    c.fillStyle = Math.abs(drift) > 8 ? "#B81D13" : "#14664A";
    c.fillRect(pad + boxW - pw - 6, clampedOrigY4 + 3, pw, 20);
    c.fillStyle = "#FFFDF9";
    c.fillText(pill, pad + boxW - pw + 1, clampedOrigY4 + 16.5);
    c.restore();

    c.restore();
  }

  const runner = loop(canvas, draw);

  speedBtns.forEach((b) =>
    b.addEventListener("click", () => {
      speedMs = Number(b.dataset.motionSpeed);
      targetPhase = targetPhase === 1 ? 0 : 1;
      syncText();
      dirty = true;
      runner.draw();
    })
  );

  anchorBtns.forEach((b) =>
    b.addEventListener("click", () => {
      jumpMode = b.dataset.jumpMode;
      targetPhase = 1;
      anim = 0;
      syncText();
      dirty = true;
      runner.draw();
    })
  );

  if (triggerBtn) {
    triggerBtn.addEventListener("click", () => {
      phase = phase === 1 ? 0 : 1;
      targetPhase = phase;
      triggerBtn.textContent = targetPhase === 1 ? "复原：展开上方 01" : "点开下方 04（实测跳屏）";
      syncText();
      dirty = true;
      runner.draw();
    });
  }

  new ResizeObserver(() => {
    dirty = true;
    runner.draw();
  }).observe(canvas);

  syncText();
  runner.draw();
}

// ---------- 04 从经折装到网页：五代折叠演化折页带 ----------
export function initLineageLab() {
  const strip = document.getElementById("lineage-strip");
  if (!strip) return;

  let activeId = LINEAGE_ITEMS[0].id;

  const diagramSvg = (kind) => {
    if (kind === "sutra") {
      return `<svg viewBox="0 0 120 56" class="lineage-svg" aria-hidden="true">
        <polygon points="8,14 28,6 28,48 8,54" fill="#F85822"/>
        <polygon points="28,6 48,14 48,54 28,48" fill="#FA7747"/>
        <polygon points="48,14 68,6 68,48 48,54" fill="#F85822"/>
        <polygon points="68,6 88,14 88,54 68,48" fill="#FA7747"/>
        <polygon points="88,14 112,6 112,48 88,54" fill="#F85822"/>
      </svg>`;
    }
    if (kind === "bellows") {
      return `<svg viewBox="0 0 120 56" class="lineage-svg" aria-hidden="true">
        <path d="M10 28 H24 M20 24 L24 28 L20 32" stroke="#050504" stroke-width="1.8" fill="none"/>
        <polygon points="30,14 46,8 46,48 30,42" fill="#F85822"/>
        <polygon points="46,8 62,14 62,42 46,48" fill="#FA7747"/>
        <polygon points="62,14 78,8 78,48 62,42" fill="#F85822"/>
        <polygon points="78,8 92,14 92,42 78,48" fill="#FA7747"/>
        <path d="M98 28 H112 M108 24 L112 28 L108 32" stroke="#050504" stroke-width="1.8" fill="none"/>
      </svg>`;
    }
    if (kind === "wheels") {
      return `<svg viewBox="0 0 120 56" class="lineage-svg" aria-hidden="true">
        <rect x="12" y="10" width="96" height="14" fill="#050504"/>
        <rect x="12" y="28" width="64" height="10" fill="#F85822"/>
        <rect x="12" y="42" width="96" height="8" fill="none" stroke="#3D3C35" stroke-dasharray="3 2"/>
      </svg>`;
    }
    if (kind === "disclosure") {
      return `<svg viewBox="0 0 120 56" class="lineage-svg" aria-hidden="true">
        <rect x="10" y="8" width="100" height="12" fill="#F85822"/>
        <rect x="10" y="22" width="100" height="14" fill="#FA7747" opacity="0.35"/>
        <rect x="10" y="39" width="100" height="10" fill="#3D3C35"/>
      </svg>`;
    }
    return `<svg viewBox="0 0 120 56" class="lineage-svg" aria-hidden="true">
      <rect x="10" y="8" width="100" height="40" fill="none" stroke="#050504" stroke-width="1.5"/>
      <line x1="10" y1="22" x2="110" y2="22" stroke="#F85822" stroke-width="2"/>
      <text x="18" y="18" fill="#050504" font-size="9" font-family="JetBrains Mono, monospace">&lt;details name&gt;</text>
      <text x="18" y="38" fill="#B53105" font-size="9" font-family="JetBrains Mono, monospace">aria-expanded</text>
    </svg>`;
  };

  function render() {
    strip.innerHTML = LINEAGE_ITEMS.map((item, idx) => {
      const open = item.id === activeId;
      return `<div class="lineage-fold${open ? " is-open" : ""}${idx % 2 === 0 ? " is-odd" : " is-even"}">
        <button type="button" class="lineage-spine" data-lineage-id="${item.id}" aria-expanded="${open}">
          <span class="lineage-era">${item.era}</span>
          <span class="lineage-short">${item.short}</span>
          <span class="lineage-arrow" aria-hidden="true">${open ? "▴" : "▾"}</span>
        </button>
        <div class="lineage-body"${open ? "" : " hidden"}>
          <div class="lineage-body-grid">
            <div>
              <h3>${item.title}</h3>
              <p>${item.fact}</p>
              <p class="lineage-note">${item.linkNote}</p>
            </div>
            ${diagramSvg(item.diagram)}
          </div>
        </div>
      </div>`;
    }).join("");
  }

  strip.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lineage-id]");
    if (!btn) return;
    activeId = btn.dataset.lineageId;
    render();
  });

  render();
}

// ---------- 05 什么时候别用：四维项目分诊器 ----------
export function initTriageLab() {
  const switches = [...document.querySelectorAll("[data-triage-key]")];
  const verdictTitle = document.getElementById("triage-verdict-title");
  const verdictBody = document.getElementById("triage-verdict-body");
  const verdictBox = document.getElementById("triage-verdict-box");
  if (!switches.length || !verdictBox) return;

  const state = {
    readAll: false,
    shortPage: false,
    compareSide: false,
    deepTree: false,
  };

  function update() {
    switches.forEach((btn) => {
      const k = btn.dataset.triageKey;
      const on = state[k];
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-active", on);
      const pill = btn.querySelector(".triage-state");
      if (pill) pill.textContent = on ? "是" : "否";
    });

    const active = Object.entries(state).filter(([, v]) => v).map(([k]) => k);
    if (active.length === 0) {
      verdictBox.dataset.status = "keep";
      verdictTitle.textContent = "适合使用 266 手风琴布局";
      verdictBody.innerHTML =
        "内容较长、条目彼此独立、用户只需按需打开其中 1–2 项——这正是手风琴布局的甜区。记得补齐具体标题与 <code>▾/▴</code> 角标。";
      return;
    }

    verdictBox.dataset.status = "switch";
    if (state.compareSide) {
      verdictTitle.textContent = "别用互斥手风琴 → 改用对照表或列表—详情";
      verdictBody.innerHTML =
        '横向核对参数或频繁跨条目对照时，收合会逼用户靠记忆来回翻切。建议改用并排结构或 <a href="https://layout.xiaoxiaodong.ai/267/play/" target="_blank" rel="noopener">267 列表—详情布局</a>，或用顶层 <a href="https://layout.xiaoxiaodong.ai/265/play/" target="_blank" rel="noopener">265 标签页布局</a> 分组比较。';
    } else if (state.deepTree) {
      verdictTitle.textContent = "别做多层手风琴套娃 → 改用导航抽屉或侧边目录";
      verdictBody.innerHTML =
        '超过两层的树形结构塞进手风琴会让定位迷失。多级应用导航建议改用 <a href="https://layout.xiaoxiaodong.ai/263/play/" target="_blank" rel="noopener">263 导航抽屉布局</a> 或 <a href="https://layout.xiaoxiaodong.ai/258/play/" target="_blank" rel="noopener">258 侧边栏页面</a>。';
    } else if (state.readAll || state.shortPage) {
      verdictTitle.textContent = "别强行折叠 → 改用开放的单列页面";
      verdictBody.innerHTML =
        '当页面本身不长，或读者需要顺畅通读全部内容并随时 <code>Ctrl+F</code> 查找时，折叠只会平添点击疲劳。直接采用 <a href="https://layout.xiaoxiaodong.ai/255/play/" target="_blank" rel="noopener">255 单列页面</a>，长文再辅以 <a href="https://layout.xiaoxiaodong.ai/258/play/" target="_blank" rel="noopener">258 侧边栏页面</a> 锚点目录。';
    }
  }

  switches.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.triageKey;
      state[k] = !state[k];
      update();
    });
  });

  update();
}

// ---------- 06 小练习：单变量控制微型线框诊断 ----------
export function initQuizLab() {
  const qTabs = [...document.querySelectorAll("[data-quiz-tab]")];
  const badgeEl = document.getElementById("quiz-badge");
  const promptEl = document.getElementById("quiz-prompt");
  const gridEl = document.getElementById("quiz-options");
  const feedbackEl = document.getElementById("quiz-feedback");
  if (!gridEl || !feedbackEl) return;

  let qIdx = 0;
  const answers = {};

  function miniWireframe(variant) {
    if (variant === "good") {
      return `<svg viewBox="0 0 200 108" class="quiz-wire" aria-hidden="true">
        <rect x="6" y="6" width="188" height="38" fill="#2A211A" stroke="#FF7C4D" stroke-width="1.2"/>
        <text x="14" y="20" fill="#FFF6EA" font-size="9" font-family="Noto Sans SC, sans-serif">01 七天退货运费谁承担？</text>
        <text x="184" y="20" text-anchor="end" fill="#FF7C4D" font-size="10">▴</text>
        <rect x="14" y="26" width="142" height="4" fill="#C6B79F"/>
        <rect x="14" y="34" width="108" height="4" fill="#9E8F79"/>
        <rect x="6" y="48" width="188" height="16" fill="#231B15" stroke="#4D4036"/>
        <text x="14" y="59" fill="#E6D9C4" font-size="8.5" font-family="Noto Sans SC, sans-serif">02 发货后如何修改收货地址？</text>
        <text x="184" y="59" text-anchor="end" fill="#E6D9C4" font-size="10">▾</text>
        <rect x="6" y="68" width="188" height="16" fill="#231B15" stroke="#4D4036"/>
        <text x="14" y="79" fill="#E6D9C4" font-size="8.5" font-family="Noto Sans SC, sans-serif">03 电子专票多久开具？</text>
        <text x="184" y="79" text-anchor="end" fill="#E6D9C4" font-size="10">▾</text>
        <rect x="6" y="88" width="188" height="14" fill="#231B15" stroke="#4D4036"/>
        <text x="14" y="98" fill="#E6D9C4" font-size="8.5" font-family="Noto Sans SC, sans-serif">04 主机一年质保如何寄修？</text>
        <text x="184" y="98" text-anchor="end" fill="#E6D9C4" font-size="10">▾</text>
      </svg>`;
    }
    if (variant === "vague") {
      return `<svg viewBox="0 0 200 108" class="quiz-wire" aria-hidden="true">
        <rect x="6" y="6" width="188" height="38" fill="#2A211A" stroke="#FF7C4D" stroke-width="1.2"/>
        <text x="14" y="20" fill="#FFF6EA" font-size="9" font-family="Noto Sans SC, sans-serif">01 规则一 · 详情</text>
        <text x="184" y="20" text-anchor="end" fill="#FF7C4D" font-size="10">▴</text>
        <rect x="14" y="26" width="142" height="4" fill="#C6B79F"/>
        <rect x="14" y="34" width="108" height="4" fill="#9E8F79"/>
        <rect x="6" y="48" width="188" height="16" fill="#231B15" stroke="#4D4036"/>
        <text x="14" y="59" fill="#E6D9C4" font-size="8.5" font-family="Noto Sans SC, sans-serif">02 更多说明</text>
        <text x="184" y="59" text-anchor="end" fill="#E6D9C4" font-size="10">▾</text>
        <rect x="6" y="68" width="188" height="16" fill="#231B15" stroke="#4D4036"/>
        <text x="14" y="79" fill="#E6D9C4" font-size="8.5" font-family="Noto Sans SC, sans-serif">03 相关事项</text>
        <text x="184" y="79" text-anchor="end" fill="#E6D9C4" font-size="10">▾</text>
        <rect x="6" y="88" width="188" height="14" fill="#231B15" stroke="#4D4036"/>
        <text x="14" y="98" fill="#E6D9C4" font-size="8.5" font-family="Noto Sans SC, sans-serif">04 其他条款</text>
        <text x="184" y="98" text-anchor="end" fill="#E6D9C4" font-size="10">▾</text>
      </svg>`;
    }
    if (variant === "arrow") {
      return `<svg viewBox="0 0 200 108" class="quiz-wire" aria-hidden="true">
        <rect x="6" y="6" width="188" height="38" fill="#2A211A" stroke="#FF7C4D" stroke-width="1.2"/>
        <text x="14" y="20" fill="#FFF6EA" font-size="9" font-family="Noto Sans SC, sans-serif">01 七天退货运费谁承担？</text>
        <text x="184" y="20" text-anchor="end" fill="#FF7C4D" font-size="10">→</text>
        <rect x="14" y="26" width="142" height="4" fill="#C6B79F"/>
        <rect x="14" y="34" width="108" height="4" fill="#9E8F79"/>
        <rect x="6" y="48" width="188" height="16" fill="#231B15" stroke="#4D4036"/>
        <text x="14" y="59" fill="#E6D9C4" font-size="8.5" font-family="Noto Sans SC, sans-serif">02 发货后如何修改收货地址？</text>
        <text x="184" y="59" text-anchor="end" fill="#E6D9C4" font-size="10">→</text>
        <rect x="6" y="68" width="188" height="16" fill="#231B15" stroke="#4D4036"/>
        <text x="14" y="79" fill="#E6D9C4" font-size="8.5" font-family="Noto Sans SC, sans-serif">03 电子专票多久开具？</text>
        <text x="184" y="79" text-anchor="end" fill="#E6D9C4" font-size="10">→</text>
        <rect x="6" y="88" width="188" height="14" fill="#231B15" stroke="#4D4036"/>
        <text x="14" y="98" fill="#E6D9C4" font-size="8.5" font-family="Noto Sans SC, sans-serif">04 主机一年质保如何寄修？</text>
        <text x="184" y="98" text-anchor="end" fill="#E6D9C4" font-size="10">→</text>
      </svg>`;
    }
    if (variant === "nested") {
      return `<svg viewBox="0 0 200 108" class="quiz-wire" aria-hidden="true">
        <rect x="6" y="6" width="188" height="68" fill="#2A211A" stroke="#FF7C4D" stroke-width="1.2"/>
        <text x="14" y="19" fill="#FFF6EA" font-size="9" font-family="Noto Sans SC, sans-serif">一 · 交易与物流大类</text>
        <text x="184" y="19" text-anchor="end" fill="#FF7C4D" font-size="10">▴</text>
        <rect x="16" y="25" width="168" height="24" fill="#1F1812" stroke="#6E5A4C" stroke-dasharray="3 2"/>
        <text x="22" y="36" fill="#E6D9C4" font-size="8" font-family="Noto Sans SC, sans-serif">└ 01 七天退货运费谁承担？</text>
        <text x="178" y="36" text-anchor="end" fill="#E6D9C4" font-size="9">▴</text>
        <rect x="24" y="41" width="110" height="3.5" fill="#9E8F79"/>
        <rect x="16" y="53" width="168" height="15" fill="#1F1812" stroke="#6E5A4C" stroke-dasharray="3 2"/>
        <text x="22" y="63" fill="#E6D9C4" font-size="8" font-family="Noto Sans SC, sans-serif">└ 02 发货后如何修改地址？</text>
        <text x="178" y="63" text-anchor="end" fill="#E6D9C4" font-size="9">▾</text>
        <rect x="6" y="80" width="188" height="20" fill="#231B15" stroke="#4D4036"/>
        <text x="14" y="93" fill="#E6D9C4" font-size="8.5" font-family="Noto Sans SC, sans-serif">二 · 发票与质保大类</text>
        <text x="184" y="93" text-anchor="end" fill="#E6D9C4" font-size="10">▾</text>
      </svg>`;
    }
    if (variant === "flat-open") {
      return `<svg viewBox="0 0 200 108" class="quiz-wire" aria-hidden="true">
        <rect x="6" y="6" width="188" height="14" fill="#2D241C" stroke="#5B4C40"/>
        <text x="12" y="16" fill="#FF9B73" font-size="8" font-family="Noto Sans SC, sans-serif">目录：总则 · 隐私 · 费用 · 退款 · 终止</text>
        <text x="10" y="32" fill="#FFF6EA" font-size="8.5" font-weight="700" font-family="Noto Sans SC, sans-serif">01 服务总则</text>
        <rect x="10" y="37" width="176" height="4" fill="#C6B79F"/>
        <rect x="10" y="44" width="144" height="4" fill="#9E8F79"/>
        <text x="10" y="60" fill="#FFF6EA" font-size="8.5" font-weight="700" font-family="Noto Sans SC, sans-serif">02 隐私与数据</text>
        <rect x="10" y="65" width="170" height="4" fill="#C6B79F"/>
        <rect x="10" y="72" width="152" height="4" fill="#9E8F79"/>
        <text x="10" y="88" fill="#FFF6EA" font-size="8.5" font-weight="700" font-family="Noto Sans SC, sans-serif">03 订阅与退款</text>
        <rect x="10" y="93" width="164" height="4" fill="#C6B79F"/>
      </svg>`;
    }
    if (variant === "exclusive-contract") {
      return `<svg viewBox="0 0 200 108" class="quiz-wire" aria-hidden="true">
        <rect x="6" y="6" width="188" height="36" fill="#2A211A" stroke="#FF7C4D"/>
        <text x="14" y="19" fill="#FFF6EA" font-size="8.5" font-family="Noto Sans SC, sans-serif">01 服务总则</text>
        <text x="184" y="19" text-anchor="end" fill="#FF7C4D" font-size="10">▴</text>
        <rect x="14" y="25" width="150" height="4" fill="#C6B79F"/>
        <rect x="14" y="33" width="110" height="4" fill="#9E8F79"/>
        <rect x="6" y="46" width="188" height="13" fill="#231B15" stroke="#4D4036"/><text x="14" y="55.5" fill="#E6D9C4" font-size="8">02 隐私与数据（折叠）</text><text x="184" y="55.5" text-anchor="end" fill="#E6D9C4" font-size="9">▾</text>
        <rect x="6" y="62" width="188" height="13" fill="#231B15" stroke="#4D4036"/><text x="14" y="71.5" fill="#E6D9C4" font-size="8">03 订阅与退款（折叠）</text><text x="184" y="71.5" text-anchor="end" fill="#E6D9C4" font-size="9">▾</text>
        <rect x="6" y="78" width="188" height="13" fill="#231B15" stroke="#4D4036"/><text x="14" y="87.5" fill="#E6D9C4" font-size="8">04 责任边界（折叠）</text><text x="184" y="87.5" text-anchor="end" fill="#E6D9C4" font-size="9">▾</text>
        <rect x="6" y="94" width="188" height="11" fill="#231B15" stroke="#4D4036"/><text x="14" y="102" fill="#E6D9C4" font-size="7.5">05 协议终止（折叠）</text>
      </svg>`;
    }
    if (variant === "all-closed-contract") {
      return `<svg viewBox="0 0 200 108" class="quiz-wire" aria-hidden="true">
        <rect x="6" y="8" width="188" height="16" fill="#231B15" stroke="#4D4036"/><text x="14" y="19" fill="#E6D9C4" font-size="8.5">01 服务总则</text><text x="184" y="19" text-anchor="end" fill="#E6D9C4" font-size="9">▾</text>
        <rect x="6" y="28" width="188" height="16" fill="#231B15" stroke="#4D4036"/><text x="14" y="39" fill="#E6D9C4" font-size="8.5">02 隐私与数据</text><text x="184" y="39" text-anchor="end" fill="#E6D9C4" font-size="9">▾</text>
        <rect x="6" y="48" width="188" height="16" fill="#231B15" stroke="#4D4036"/><text x="14" y="59" fill="#E6D9C4" font-size="8.5">03 订阅与退款</text><text x="184" y="59" text-anchor="end" fill="#E6D9C4" font-size="9">▾</text>
        <rect x="6" y="68" width="188" height="16" fill="#231B15" stroke="#4D4036"/><text x="14" y="79" fill="#E6D9C4" font-size="8.5">04 责任边界</text><text x="184" y="79" text-anchor="end" fill="#E6D9C4" font-size="9">▾</text>
        <rect x="6" y="88" width="188" height="16" fill="#231B15" stroke="#4D4036"/><text x="14" y="99" fill="#E6D9C4" font-size="8.5">05 协议终止</text><text x="184" y="99" text-anchor="end" fill="#E6D9C4" font-size="9">▾</text>
      </svg>`;
    }
    return `<svg viewBox="0 0 200 108" class="quiz-wire" aria-hidden="true">
      <rect x="6" y="8" width="188" height="48" fill="#2A211A" stroke="#FF7C4D"/>
      <text x="14" y="20" fill="#FFF6EA" font-size="8.5">母组 A · 基本条款</text><text x="184" y="20" text-anchor="end" fill="#FF7C4D" font-size="9">▴</text>
      <rect x="16" y="26" width="168" height="12" fill="#1F1812" stroke="#6E5A4C" stroke-dasharray="3 2"/><text x="22" y="35" fill="#E6D9C4" font-size="8">└ 01 服务总则</text>
      <rect x="16" y="41" width="168" height="12" fill="#1F1812" stroke="#6E5A4C" stroke-dasharray="3 2"/><text x="22" y="50" fill="#E6D9C4" font-size="8">└ 02 隐私与数据</text>
      <rect x="6" y="64" width="188" height="18" fill="#231B15" stroke="#4D4036"/><text x="14" y="76" fill="#E6D9C4" font-size="8.5">母组 B · 费用与终止</text><text x="184" y="76" text-anchor="end" fill="#E6D9C4" font-size="9">▾</text>
    </svg>`;
  }

  function render() {
    const q = QUIZ_ITEMS[qIdx];
    const picked = answers[q.id] || null;
    qTabs.forEach((b) => {
      const on = Number(b.dataset.quizTab) === qIdx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    badgeEl.textContent = q.badge;
    promptEl.textContent = q.prompt;

    gridEl.innerHTML = q.options
      .map((opt) => {
        let stateCls = "";
        if (picked) {
          if (opt.key === q.correct) stateCls = " is-correct";
          else if (opt.key === picked) stateCls = " is-wrong";
        }
        return `<button type="button" class="quiz-card${stateCls}" data-quiz-choice="${opt.key}" aria-pressed="${picked === opt.key}">
          <div class="quiz-card-top">
            <span class="quiz-key">${opt.label}</span>
            <span class="quiz-meta">${opt.meta}</span>
          </div>
          ${miniWireframe(opt.variant)}
        </button>`;
      })
      .join("");

    if (!picked) {
      feedbackEl.dataset.state = "idle";
      feedbackEl.innerHTML = "<p>请直接点击上方四个方案之一作答（四张线框视觉一致，各自仅差一个结构变量）。</p>";
    } else {
      const chosen = q.options.find((o) => o.key === picked);
      const isRight = picked === q.correct;
      feedbackEl.dataset.state = isRight ? "correct" : "wrong";
      feedbackEl.innerHTML = `
        <p class="quiz-fb-head">${isRight ? "✓ 判断准确" : `× 已选 ${chosen.label}（最佳应为方案 ${q.correct}）`}</p>
        <p class="quiz-fb-body">${chosen.why}</p>
      `;
    }
  }

  gridEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-quiz-choice]");
    if (!btn) return;
    answers[QUIZ_ITEMS[qIdx].id] = btn.dataset.quizChoice;
    render();
  });

  qTabs.forEach((b) =>
    b.addEventListener("click", () => {
      qIdx = Number(b.dataset.quizTab);
      render();
    })
  );

  render();
}

// ---------- 07 原海报灯箱（可放大、拖动、Esc 关闭） ----------
export function initPosterLightbox() {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-zoom-btn");
  const modal = document.getElementById("poster-modal");
  const modalImg = document.getElementById("poster-modal-img");
  const closeBtn = document.getElementById("poster-modal-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const zoomResetBtn = document.getElementById("poster-zoom-reset");
  const stage = document.getElementById("poster-modal-stage");

  if (!posterImg || !modal || !modalImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let lastFocus = null;

  function applyTransform() {
    modalImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
  }

  function openModal() {
    lastFocus = document.activeElement;
    modalImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  posterImg.addEventListener("click", openModal);
  openBtn?.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) closeModal();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(3.2, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.16 : -0.16;
      scale = Math.max(0.75, Math.min(3.5, +(scale + delta).toFixed(2)));
      applyTransform();
    },
    { passive: false }
  );

  modalImg.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    modalImg.classList.add("is-dragging");
    try {
      modalImg.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  });
  modalImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const stopPan = () => {
    dragging = false;
    modalImg.classList.remove("is-dragging");
  };
  modalImg.addEventListener("pointerup", stopPan);
  modalImg.addEventListener("pointercancel", stopPan);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });
}

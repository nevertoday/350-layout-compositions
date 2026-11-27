import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  CONTEXTS,
  PRESETS,
  SIGNIFIER_META,
  auditAccordion,
  createInitialState,
  toggleNestedPanel,
  togglePanel,
} from "./model.js";

const COLORS = {
  paper: "#F6EDDD",
  paperLight: "#FBF6EC",
  darkFold: "#F85822",
  lightFold: "#FA7747",
  openDarkFold: "#EB4F1B",
  openLightFold: "#FF895C",
  foldCrease: "rgba(92, 22, 4, 0.24)",
  ink: "#050504",
  subInk: "#3D3C35",
  warnBg: "#B81D13",
  warnSoft: "rgba(184, 29, 19, 0.14)",
  ok: "#14664A",
  okSoft: "rgba(20, 102, 74, 0.15)",
  white: "#FFFDF9",
};

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function easeOutCubic(t) {
  const k = 1 - clamp(t, 0, 1);
  return 1 - k * k * k;
}

export function initHero() {
  let state = createInitialState();

  const canvas = document.getElementById("bellows-canvas");
  const accList = document.getElementById("hero-accordion");
  const titleEl = document.getElementById("hero-title");
  const navBadge = document.getElementById("nav-status-badge");
  const spanSlider = document.getElementById("span-slider");
  const spanReadout = document.getElementById("span-readout");
  const clicksReadout = document.getElementById("clicks-readout");
  const savedReadout = document.getElementById("saved-readout");
  const modeReadout = document.getElementById("mode-readout");

  // Diagnosis panel DOM
  const diagCard = document.getElementById("hero-diag");
  const diagBadge = document.getElementById("diag-badge");
  const diagGrade = document.getElementById("diag-grade");
  const diagHeadline = document.getElementById("diag-headline");
  const diagWhy = document.getElementById("diag-why");
  const diagNext = document.getElementById("diag-next");
  const diagFaultList = document.getElementById("diag-fault-list");

  // 4 Poster Principles live probes
  const pillarEls = {
    fold: document.getElementById("pillar-fold"),
    rhythm: document.getElementById("pillar-rhythm"),
    hierarchy: document.getElementById("pillar-hierarchy"),
    expand: document.getElementById("pillar-expand"),
  };

  if (!canvas || !accList) return;
  const ctx2d = canvas.getContext("2d");

  // Smooth animation state for bellows canvas
  let introProgress = reducedMotion.matches ? 1 : 0;
  let displaySpan = state.bellowsSpan;
  let panelOpenAnim = [1, 1, 1, 0, 0, 0];
  let scanActive = false;
  let scanT = 0;
  let hoverIdx = -1;
  let pleatRects = [];
  let dirty = true;
  let lastStructuralSig = "";
  let lastAuditSig = "";

  // Dragging state
  let dragging = false;
  let dragStartX = 0;
  let dragStartSpan = 0;
  let dragMoved = false;
  let activePointerId = null;

  function currentAudit() {
    return auditAccordion(state);
  }

  function structuralSig(s) {
    return [
      s.context,
      s.mode,
      s.openIds.join(","),
      s.nestedOpenIds.join(","),
      s.labelStyle,
      s.signifier,
      s.nested ? "1" : "0",
    ].join("|");
  }

  function syncTitleTrack() {
    if (!titleEl) return;
    // Gentle self-demonstrating compression/expansion matching bellowsSpan, capped safely so no overflow
    const delta = (state.bellowsSpan - 0.62) * 0.14;
    titleEl.style.setProperty("--fold-track", `${clamp(delta, -0.04, 0.06).toFixed(4)}em`);
  }

  function syncControlsAndDiagnosis(forceDom = false) {
    const audit = currentAudit();
    syncTitleTrack();

    if (spanSlider && Number(spanSlider.value) !== audit.spanPct) {
      spanSlider.value = String(audit.spanPct);
    }
    if (spanReadout) spanReadout.textContent = `${audit.spanPct}%`;
    if (savedReadout) savedReadout.textContent = `省高 ${audit.savedPct}%`;
    if (clicksReadout) clicksReadout.textContent = `点击 ${state.clicks} 次`;
    if (modeReadout) {
      const modeName =
        state.mode === "exclusive"
          ? "互斥单开"
          : state.mode === "multi"
          ? "多开并行"
          : "全摊锁死";
      modeReadout.textContent = `${modeName} · 展开 ${audit.openCount}/6`;
    }

    const auditSig = `${audit.badgeShort}|${audit.savedPct}|${audit.spanPct}|${audit.pillars.fold.note}|${audit.pillars.rhythm.note}|${audit.pillars.hierarchy.note}|${audit.pillars.expand.note}|${audit.headline}`;
    if (!forceDom && auditSig === lastAuditSig) return;
    lastAuditSig = auditSig;

    // Top badge
    if (navBadge) {
      navBadge.textContent = audit.badgeShort;
      navBadge.dataset.status = audit.isPass ? "pass" : "fail";
    }

    // Diagnosis card
    if (diagCard) diagCard.dataset.status = audit.isPass ? "pass" : "fail";
    if (diagBadge) {
      diagBadge.textContent = audit.badgeShort;
      diagBadge.dataset.status = audit.isPass ? "pass" : "fail";
    }
    if (diagGrade) diagGrade.textContent = audit.grade;
    if (diagHeadline) diagHeadline.textContent = audit.headline;
    if (diagWhy) diagWhy.textContent = audit.why;
    if (diagNext) diagNext.textContent = audit.next;
    if (diagFaultList) {
      if (audit.isPass) {
        diagFaultList.innerHTML = `<span class="fault-chip is-pass">✓ ${audit.solutionName} · 4/4 成立</span>`;
      } else {
        diagFaultList.innerHTML = audit.faults
          .slice(0, 4)
          .map((f) => `<span class="fault-chip is-fail">× ${f.short}</span>`)
          .join("");
      }
    }

    // 4 Poster Principles live probes
    for (const key of ["fold", "rhythm", "hierarchy", "expand"]) {
      const wrap = pillarEls[key];
      if (!wrap) continue;
      const p = audit.pillars[key];
      wrap.dataset.status = p.ok ? "pass" : "fail";
      const pill = wrap.querySelector(".pillar-pill");
      if (pill) pill.textContent = p.note;
    }

    // Sync active states of lever buttons
    document.querySelectorAll("[data-hero-context]").forEach((btn) => {
      const on = btn.dataset.heroContext === state.context;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-active", on);
    });
    document.querySelectorAll("[data-hero-mode]").forEach((btn) => {
      const on = btn.dataset.heroMode === state.mode;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-active", on);
    });
    document.querySelectorAll("[data-hero-label]").forEach((btn) => {
      const on = btn.dataset.heroLabel === state.labelStyle;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-active", on);
    });
    document.querySelectorAll("[data-hero-signifier]").forEach((btn) => {
      const on = btn.dataset.heroSignifier === state.signifier;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-active", on);
    });
    document.querySelectorAll("[data-hero-nested]").forEach((btn) => {
      const on = (btn.dataset.heroNested === "true") === state.nested;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-active", on);
    });
  }

  function renderAccordionDom(force = false) {
    const sig = structuralSig(state);
    if (!force && sig === lastStructuralSig) return;
    lastStructuralSig = sig;

    const prevFocusId =
      document.activeElement && accList.contains(document.activeElement)
        ? document.activeElement.id
        : "";

    const ctxData = CONTEXTS[state.context];
    const sigMeta = SIGNIFIER_META[state.signifier];
    const effectiveOpen =
      state.mode === "all-open"
        ? ctxData.panels.map((p) => p.id)
        : state.openIds;

    const rowsHtml = ctxData.panels
      .map((panel, idx) => {
        const isOpen = effectiveOpen.includes(panel.id);
        const headingText =
          state.labelStyle === "concrete" ? panel.goodTitle : panel.vagueTitle;
        const iconChar = isOpen ? sigMeta.open : sigMeta.closed;
        const subOpen = state.nestedOpenIds.includes(panel.id);

        const nestedHtml = state.nested
          ? `<div class="acc-sub">
              <button type="button" class="acc-sub-trigger" data-sub-toggle="${panel.id}" aria-expanded="${subOpen}">
                <span class="acc-sub-badge">2 级套娃</span>
                <span class="acc-sub-title">${panel.subItem.title}</span>
                <span class="acc-sub-icon" aria-hidden="true">${subOpen ? "▴" : "▾"}</span>
              </button>
              <div class="acc-sub-body"${subOpen ? "" : " hidden"}>
                <p>${panel.subItem.body}</p>
              </div>
            </div>`
          : "";

        return `<article class="acc-item${isOpen ? " is-open" : ""}${
          state.mode === "all-open" ? " is-locked" : ""
        }" data-panel-id="${panel.id}">
          <h3 class="acc-heading">
            <button
              type="button"
              class="acc-trigger"
              id="acc-btn-${panel.id}"
              data-acc-toggle="${panel.id}"
              data-acc-index="${idx}"
              aria-expanded="${isOpen}"
              aria-controls="acc-region-${panel.id}"
              ${state.mode === "all-open" ? 'aria-disabled="true"' : ""}
            >
              <span class="acc-code">${panel.code}</span>
              <span class="acc-title-wrap">
                <span class="acc-title${state.labelStyle === "vague" ? " is-vague" : ""}">${headingText}</span>
                <span class="acc-meta">${state.labelStyle === "concrete" ? panel.meta : "未标主题"}</span>
              </span>
              ${
                iconChar
                  ? `<span class="acc-icon acc-icon--${state.signifier}" aria-hidden="true">${iconChar}</span>`
                  : `<span class="acc-icon acc-icon--none" aria-hidden="true"></span>`
              }
            </button>
          </h3>
          <div
            class="acc-panel"
            id="acc-region-${panel.id}"
            role="region"
            aria-labelledby="acc-btn-${panel.id}"
            ${isOpen ? "" : "hidden"}
          >
            <div class="acc-panel-inner">
              <p class="acc-summary">${panel.summary}</p>
              ${nestedHtml}
            </div>
          </div>
        </article>`;
      })
      .join("");

    accList.innerHTML = rowsHtml;
    if (prevFocusId) {
      const nextEl = document.getElementById(prevFocusId);
      if (nextEl && accList.contains(nextEl)) nextEl.focus({ preventScroll: true });
    }
  }

  function applyState(nextState, { rebuildDom = true } = {}) {
    state = nextState;
    dirty = true;
    if (rebuildDom) renderAccordionDom();
    syncControlsAndDiagnosis(rebuildDom);
    runner.draw();
  }

  function triggerScan() {
    scanActive = true;
    scanT = 0;
    dirty = true;
    runner.draw();
  }

  // ---------- 2D Canvas：1:1 转译 266 原海报双色朱橙锯齿风箱 ----------
  function drawDottedArrow(c, x1, x2, y, isLeft, pulseX, narrow) {
    const dotCount = narrow ? 3 : 5;
    const dotStep = narrow ? 7 : 9;
    const arrowLen = narrow ? 16 : 24;
    const headSize = narrow ? 5.5 : 7;

    c.save();
    c.strokeStyle = COLORS.ink;
    c.fillStyle = COLORS.ink;
    c.lineWidth = 2;
    c.lineCap = "round";
    c.lineJoin = "round";

    if (isLeft) {
      // ••••• →
      const arrowEnd = x2;
      const arrowStart = arrowEnd - arrowLen;
      const dotsEnd = arrowStart - (narrow ? 7 : 10);
      for (let i = 0; i < dotCount; i++) {
        const dx = dotsEnd - (dotCount - 1 - i) * dotStep;
        if (dx < x1) continue;
        const lit = pulseX != null && Math.abs(pulseX - dx) < 28;
        c.fillStyle = lit ? COLORS.darkFold : COLORS.ink;
        c.beginPath();
        c.arc(dx, y, lit ? 2.6 : 1.7, 0, Math.PI * 2);
        c.fill();
      }
      c.strokeStyle = pulseX != null && Math.abs(pulseX - arrowEnd) < 36 ? COLORS.darkFold : COLORS.ink;
      c.beginPath();
      c.moveTo(arrowStart, y);
      c.lineTo(arrowEnd, y);
      c.moveTo(arrowEnd - headSize, y - headSize);
      c.lineTo(arrowEnd, y);
      c.lineTo(arrowEnd - headSize, y + headSize);
      c.stroke();
    } else {
      // → •••••
      const arrowStart = x1;
      const arrowEnd = arrowStart + arrowLen;
      const dotsStart = arrowEnd + (narrow ? 7 : 10);
      c.strokeStyle = pulseX != null && Math.abs(pulseX - arrowStart) < 36 ? COLORS.darkFold : COLORS.ink;
      c.beginPath();
      c.moveTo(arrowStart, y);
      c.lineTo(arrowEnd, y);
      c.moveTo(arrowEnd - headSize, y - headSize);
      c.lineTo(arrowEnd, y);
      c.lineTo(arrowEnd - headSize, y + headSize);
      c.stroke();
      for (let i = 0; i < dotCount; i++) {
        const dx = dotsStart + i * dotStep;
        if (dx > x2) continue;
        const lit = pulseX != null && Math.abs(pulseX - dx) < 28;
        c.fillStyle = lit ? COLORS.darkFold : COLORS.ink;
        c.beginPath();
        c.arc(dx, y, lit ? 2.6 : 1.7, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
  }

  function drawCanvas(t, dt, { still }) {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(260, Math.round(rect.width));
    const cssH = Math.max(140, Math.round(rect.height));
    const dpr = pixelRatio(2);
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      dirty = true;
    }

    const audit = currentAudit();
    const ctxData = CONTEXTS[state.context];
    const panels = ctxData.panels;

    // Advance animations smoothly
    let animating = false;
    if (still) {
      introProgress = 1;
      displaySpan = state.bellowsSpan;
      for (let i = 0; i < panels.length; i++) {
        panelOpenAnim[i] = audit.effectiveOpen.includes(panels[i].id) ? 1 : 0;
      }
      scanActive = false;
    } else {
      if (introProgress < 1) {
        introProgress = clamp(introProgress + (dt || 0.016) * 1.45, 0, 1);
        animating = true;
      }
      const spanDiff = state.bellowsSpan - displaySpan;
      if (Math.abs(spanDiff) > 0.0015) {
        displaySpan += spanDiff * Math.min(1, (dt || 0.016) * 14);
        animating = true;
      } else {
        displaySpan = state.bellowsSpan;
      }
      for (let i = 0; i < panels.length; i++) {
        const goal = audit.effectiveOpen.includes(panels[i].id) ? 1 : 0;
        const d = goal - panelOpenAnim[i];
        if (Math.abs(d) > 0.005) {
          panelOpenAnim[i] += d * Math.min(1, (dt || 0.016) * 12);
          animating = true;
        } else {
          panelOpenAnim[i] = goal;
        }
      }
      if (scanActive) {
        scanT += (dt || 0.016) * 0.42;
        if (scanT >= 1) {
          scanActive = false;
          scanT = 0;
        } else {
          animating = true;
        }
      }
    }

    if (!dirty && !animating && !dragging) return;
    dirty = false;

    const c = ctx2d;
    c.save();
    c.scale(dpr, dpr);

    // Warm bone paper ground matching Poster 266 seamlessly
    c.fillStyle = COLORS.paper;
    c.fillRect(0, 0, cssW, cssH);

    const narrow = cssW < 520;
    const flankW = narrow ? 56 : 114;
    const maxBellowsW = Math.max(150, cssW - flankW * 2);

    // Intro unfold eases smoothly from 0.45 -> displaySpan so even 0.2s–0.9s looks complete & sculptural
    const introEase = easeOutCubic(introProgress);
    const liveSpan = 0.48 + (displaySpan - 0.48) * introEase;
    const spanRatio = clamp(0.32 + liveSpan * 0.68, 0.34, 1.0);
    const bellowsW = maxBellowsW * spanRatio;
    const startX = (cssW - bellowsW) / 2;

    // Peak/valley zigzag geometry (steep crisp sawtooth when pleated, shallow when stretched flat)
    const topPad = narrow ? 24 : 28;
    const botPad = narrow ? 28 : 34;
    const bodyH = cssH - topPad - botPad;
    const midY = topPad + bodyH * 0.5;
    // Authentic Poster 266 sawtooth peak amplitude responds physically to compression!
    const ampFactor = clamp(1.24 - liveSpan * 0.44, 0.58, 1.16);
    const baseAmp = (narrow ? 19 : 28) * ampFactor;

    // Calculate weights for the 6 live content pleats + 1 rhythmic closing end-flap (7 faces total like Poster 266!)
    // Wait: let's keep 6 interactive content pleats plus a narrow closing fold OR 6 interactive pleats with crisp 7-vertex sawtooth!
    // 6 live interactive panels = 7 vertical crease lines (0..6) with peaks at odd vertices (1,3,5) and valleys at even (0,2,4,6) -> exact Poster 266 zigzag silhouette!
    const weights = panels.map((p, i) => {
      const openVal = panelOpenAnim[i];
      const openBoost = audit.openCount >= 4 ? 0.22 : 0.72;
      return 1 + openVal * openBoost;
    });
    const sumW = weights.reduce((a, b) => a + b, 0);

    // Scan beam x-position
    const pulseX = scanActive ? startX - flankW * 0.75 + scanT * (bellowsW + flankW * 1.5) : null;

    // Draw flanking Poster 266 dotted arrows: ••••• →  [BELLOWS]  → •••••
    drawDottedArrow(c, 8, startX - (narrow ? 8 : 16), midY, true, pulseX, narrow);
    drawDottedArrow(c, startX + bellowsW + (narrow ? 8 : 16), cssW - 8, midY, false, pulseX, narrow);

    // Soft architectural ground shadow under the pleated bellows
    c.save();
    c.fillStyle = "rgba(38, 18, 6, 0.06)";
    c.beginPath();
    c.ellipse(cssW / 2, topPad + bodyH + 10, bellowsW * 0.48, narrow ? 5 : 7, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // Draw the 6 sculptural zigzag accordion panels (1:1 Poster 266 alternating vermilion #F85822 & coral #FA7747!)
    pleatRects = [];
    let curX = startX;
    for (let i = 0; i < panels.length; i++) {
      const p = panels[i];
      const pw = (weights[i] / sumW) * bellowsW;
      const xL = curX;
      const xR = curX + pw;
      curX = xR;

      const openVal = panelOpenAnim[i];
      // Even vertices lower, odd vertices higher -> classic zigzag concertina peaks
      const localAmp = baseAmp * (1 - openVal * 0.34);
      const yTopL = topPad + (i % 2 === 0 ? localAmp : 0);
      const yTopR = topPad + (i % 2 === 0 ? 0 : localAmp);
      const yBotL = topPad + bodyH - (i % 2 === 0 ? 0 : localAmp);
      const yBotR = topPad + bodyH - (i % 2 === 0 ? localAmp : 0);

      pleatRects.push({
        index: i,
        id: p.id,
        xL,
        xR,
        yTop: Math.min(yTopL, yTopR),
        yBot: Math.max(yBotL, yBotR),
      });

      // Panel face fill: Poster 266 signature two-tone vermilion/coral
      const isEven = i % 2 === 0;
      const baseFill = isEven
        ? openVal > 0.5
          ? COLORS.openDarkFold
          : COLORS.darkFold
        : openVal > 0.5
        ? COLORS.openLightFold
        : COLORS.lightFold;

      c.beginPath();
      c.moveTo(xL, yTopL);
      c.lineTo(xR, yTopR);
      c.lineTo(xR, yBotR);
      c.lineTo(xL, yBotL);
      c.closePath();
      c.fillStyle = baseFill;
      c.fill();

      // Subtle inner paper highlight when panel is expanded
      if (openVal > 0.08) {
        c.save();
        c.clip();
        c.fillStyle = `rgba(255, 250, 240, ${(0.16 * openVal).toFixed(3)})`;
        c.fillRect(xL, topPad, pw, bodyH);

        // Schematic expanded content lines inside the open fold
        const padX = Math.max(8, pw * 0.14);
        const lineW = Math.max(0, pw - padX * 2);
        if (lineW > 18) {
          const lineStartY = midY - (narrow ? 12 : 16);
          const barCount = state.nested ? 4 : 3;
          for (let b = 0; b < barCount; b++) {
            const frac = b === barCount - 1 ? 0.58 : b === 0 ? 0.92 : 0.78;
            c.fillStyle =
              b === barCount - 1 && state.nested
                ? "rgba(5, 5, 4, 0.42)"
                : `rgba(255, 251, 244, ${(0.42 * openVal).toFixed(3)})`;
            c.fillRect(xL + padX, lineStartY + b * (narrow ? 9 : 12), lineW * frac, narrow ? 3 : 4);
          }
          // If nested trap is ON, draw a sharp dashed inner box to show "accordion inside accordion"
          if (state.nested && lineW > 30) {
            c.strokeStyle = "rgba(5, 5, 4, 0.72)";
            c.lineWidth = 1.2;
            c.setLineDash([3, 2]);
            c.strokeRect(xL + padX - 3, lineStartY + (narrow ? 23 : 31), lineW * 0.72 + 6, narrow ? 12 : 15);
            c.setLineDash([]);
          }
        }
        c.restore();
      }

      // Hover or keyboard focus hairline highlight
      if (i === hoverIdx || i === state.focusedIndex) {
        c.save();
        c.strokeStyle = "rgba(255, 253, 248, 0.78)";
        c.lineWidth = i === hoverIdx ? 2 : 1.25;
        c.beginPath();
        c.moveTo(xL + 1, yTopL + 1);
        c.lineTo(xR - 1, yTopR + 1);
        c.lineTo(xR - 1, yBotR - 1);
        c.lineTo(xL + 1, yBotL - 1);
        c.closePath();
        c.stroke();
        c.restore();
      }

      // Vertical crease line between folds
      if (i > 0) {
        c.strokeStyle = COLORS.foldCrease;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(xL, yTopL);
        c.lineTo(xL, yBotL);
        c.stroke();
      }

      // Panel code & signifier glyph right on the pleat
      const cx = (xL + xR) / 2;
      const sigMeta = SIGNIFIER_META[state.signifier];
      const glyph = openVal > 0.5 ? sigMeta.open : sigMeta.closed;

      c.save();
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = "rgba(255, 252, 247, 0.94)";
      c.font = `600 ${narrow ? 11 : 12}px "JetBrains Mono", monospace`;
      c.fillText(p.code, cx, topPad + (narrow ? 22 : 28));

      // Show concise state label or title snippet when pleat has room
      if (pw >= (narrow ? 44 : 68)) {
        const tag =
          state.labelStyle === "vague"
            ? "盲盒?"
            : p.meta;
        c.font = `600 ${narrow ? 10 : 11}px "Noto Sans SC", sans-serif`;
        c.fillStyle = state.labelStyle === "vague" ? "rgba(5, 5, 4, 0.82)" : "rgba(255, 252, 247, 0.92)";
        c.fillText(tag, cx, topPad + bodyH - (narrow ? 22 : 28));
      }

      // Signifier symbol at bottom of pleat (when enabled)
      if (glyph) {
        c.font = `600 ${narrow ? 13 : 16}px "JetBrains Mono", "Inter", sans-serif`;
        c.fillStyle = "rgba(255, 252, 247, 0.96)";
        c.fillText(glyph, cx, topPad + (narrow ? 39 : 48));
      }
      c.restore();
    }

    // Active reading-flow scan pulse (Space / 视线验读)
    if (scanActive && pulseX != null) {
      const scanY = midY;
      // If broken, show a jitter/bounce ring at the middle to visualize disrupted scanning
      const bounceOffset = audit.isPass ? 0 : Math.sin(scanT * Math.PI * 10) * 14;
      const bx = clamp(pulseX, 16, cssW - 16);
      const by = scanY + bounceOffset;

      c.save();
      // Trail line
      const grad = c.createLinearGradient(Math.max(0, bx - 90), by, bx, by);
      grad.addColorStop(0, "rgba(255,253,248,0)");
      grad.addColorStop(1, audit.isPass ? "rgba(255,253,248,0.92)" : "rgba(5,5,4,0.85)");
      c.strokeStyle = grad;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(Math.max(startX - flankW * 0.5, bx - 90), by);
      c.lineTo(bx, by);
      c.stroke();

      // Reading-eye beacon dot
      c.fillStyle = audit.isPass ? COLORS.white : COLORS.ink;
      c.beginPath();
      c.arc(bx, by, 6, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = audit.isPass ? COLORS.ok : COLORS.warnBg;
      c.lineWidth = 2.5;
      c.stroke();
      c.restore();
    }

    // Top-left crisp telemetry strip + top-right live pass/fault badge inside paper margin
    c.save();
    c.font = `500 ${narrow ? 10 : 11}px "JetBrains Mono", monospace`;
    c.fillStyle = COLORS.subInk;
    c.textAlign = "left";
    c.textBaseline = "top";
    const metaText = narrow
      ? `张幅 ${audit.spanPct}% · 开 ${audit.openCount}/6 · 省高 ${audit.savedPct}%`
      : `FOLD SPAN ${audit.spanPct}%  ·  OPEN ${audit.openCount}/6  ·  HEIGHT SAVED ${audit.savedPct}%`;
    c.fillText(metaText, 12, 6);

    // Compact status tag top-right
    const tagText = audit.isPass ? `✓ ${audit.badgeShort}` : `× ${audit.badgeShort}`;
    c.font = `700 ${narrow ? 10 : 11}px "Noto Sans SC", "Inter", sans-serif`;
    const tw = c.measureText(tagText).width + 14;
    const tx = cssW - tw - 10;
    const ty = 4;
    c.fillStyle = audit.isPass ? COLORS.ok : COLORS.warnBg;
    c.fillRect(tx, ty, tw, 18);
    c.fillStyle = COLORS.white;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(tagText, tx + tw / 2, ty + 9.5);
    c.restore();

    // Bottom tactile drag hint strip (shows interactive affordance directly on the canvas)
    c.save();
    const hintText = dragging
      ? `正在拉动风箱张幅：${audit.spanPct}%（推荐 35%–82%）`
      : narrow
      ? "← 横拖拉展风箱 · 点折面展开收合 →"
      : "← 左右横拖拉展/压紧风箱 · 单击任意朱橙折面直接展开/收合 · 按 Space 放飞视线验读 →";
    c.font = `500 ${narrow ? 10 : 11}px "Noto Sans SC", sans-serif`;
    c.fillStyle = dragging ? COLORS.darkFold : COLORS.subInk;
    c.textAlign = "center";
    c.textBaseline = "bottom";
    c.fillText(hintText, cssW / 2, cssH - 6);
    c.restore();

    c.restore();
  }

  const runner = loop(canvas, drawCanvas);

  // ---------- Pointer & Touch Interaction on Bellows Canvas (data-perf-drag) ----------
  function pleatAt(clientX) {
    const r = canvas.getBoundingClientRect();
    const x = clientX - r.left;
    return pleatRects.find((p) => x >= p.xL && x <= p.xR) || null;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    dragging = true;
    dragMoved = false;
    activePointerId = e.pointerId;
    dragStartX = e.clientX;
    dragStartSpan = state.bellowsSpan;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic events may not have active pointer */
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) {
      const hit = pleatAt(e.clientX);
      const nextHover = hit ? hit.index : -1;
      if (nextHover !== hoverIdx) {
        hoverIdx = nextHover;
        dirty = true;
        runner.draw();
      }
      return;
    }
    if (activePointerId !== null && e.pointerId !== activePointerId) return;
    const dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 4) dragMoved = true;
    if (!dragMoved) return;

    const r = canvas.getBoundingClientRect();
    const scale = Math.max(180, r.width * 0.55);
    const nextSpan = clamp(dragStartSpan + dx / scale, 0.16, 1.0);
    if (Math.abs(nextSpan - state.bellowsSpan) > 0.002) {
      state = { ...state, bellowsSpan: nextSpan };
      dirty = true;
      // Lightweight sync during drag (no full accordion DOM rebuild -> 60 FPS on slow mobile!)
      syncControlsAndDiagnosis(false);
      runner.draw();
    }
  });

  function endDrag(e) {
    if (!dragging) return;
    const wasMoved = dragMoved;
    dragging = false;
    dragMoved = false;
    activePointerId = null;
    dirty = true;

    if (!wasMoved && e && typeof e.clientX === "number") {
      const hit = pleatAt(e.clientX);
      if (hit) {
        applyState(togglePanel(state, hit.id));
        return;
      }
    }
    syncControlsAndDiagnosis(true);
    runner.draw();
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => {
    dragging = false;
    dragMoved = false;
    activePointerId = null;
    dirty = true;
    runner.draw();
  });
  canvas.addEventListener("pointerleave", () => {
    if (hoverIdx !== -1) {
      hoverIdx = -1;
      dirty = true;
      runner.draw();
    }
  });

  // Fallback touch handlers specifically for browsers / CDP synthetic touch where pointer capture may skip
  let touchDragging = false;
  let touchStartX = 0;
  let touchStartSpan = 0;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      touchDragging = true;
      touchStartX = e.touches[0].clientX;
      touchStartSpan = state.bellowsSpan;
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!touchDragging || !e.touches.length || dragging) return;
      const dx = e.touches[0].clientX - touchStartX;
      if (Math.abs(dx) < 3) return;
      const r = canvas.getBoundingClientRect();
      const scale = Math.max(180, r.width * 0.55);
      const nextSpan = clamp(touchStartSpan + dx / scale, 0.16, 1.0);
      state = { ...state, bellowsSpan: nextSpan };
      dirty = true;
      syncControlsAndDiagnosis(false);
      runner.draw();
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchend",
    () => {
      touchDragging = false;
    },
    { passive: true }
  );

  // ---------- Live HTML Accordion Events + WAI-ARIA APG Keyboard Contract ----------
  accList.addEventListener("click", (e) => {
    const subBtn = e.target.closest("[data-sub-toggle]");
    if (subBtn) {
      applyState(toggleNestedPanel(state, subBtn.dataset.subToggle));
      return;
    }
    const btn = e.target.closest("[data-acc-toggle]");
    if (!btn) return;
    applyState(togglePanel(state, btn.dataset.accToggle));
  });

  // WAI-ARIA APG optional Up/Down/Home/End navigation across accordion headers
  accList.addEventListener("keydown", (e) => {
    const btn = e.target.closest("[data-acc-toggle]");
    if (!btn) return;
    const triggers = [...accList.querySelectorAll("[data-acc-toggle]")];
    const idx = triggers.indexOf(btn);
    if (idx < 0) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      applyState(togglePanel(state, btn.dataset.accToggle));
      return;
    }

    let nextIdx = -1;
    if (e.key === "ArrowDown") nextIdx = (idx + 1) % triggers.length;
    else if (e.key === "ArrowUp") nextIdx = (idx - 1 + triggers.length) % triggers.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = triggers.length - 1;

    if (nextIdx >= 0) {
      e.preventDefault();
      triggers[nextIdx].focus();
      state = { ...state, focusedIndex: nextIdx };
      dirty = true;
      runner.draw();
    }
  });

  // ---------- Control Levers & Presets ----------
  document.querySelectorAll("[data-hero-context]").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyState({ ...state, context: btn.dataset.heroContext });
    });
  });

  document.querySelectorAll("[data-hero-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.heroMode;
      let nextOpen = state.openIds;
      if (mode === "exclusive" && nextOpen.length > 1) {
        nextOpen = [nextOpen[0]];
      } else if (mode === "all-open") {
        nextOpen = CONTEXTS[state.context].panels.map((p) => p.id);
      }
      applyState({ ...state, mode, openIds: nextOpen, clicks: state.clicks + 1 });
    });
  });

  document.querySelectorAll("[data-hero-label]").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyState({ ...state, labelStyle: btn.dataset.heroLabel, clicks: state.clicks + 1 });
    });
  });

  document.querySelectorAll("[data-hero-signifier]").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyState({ ...state, signifier: btn.dataset.heroSignifier, clicks: state.clicks + 1 });
    });
  });

  document.querySelectorAll("[data-hero-nested]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nested = btn.dataset.heroNested === "true";
      applyState({
        ...state,
        nested,
        nestedOpenIds: nested ? [state.openIds[0] || "p1"] : [],
        clicks: state.clicks + 1,
      });
    });
  });

  if (spanSlider) {
    spanSlider.addEventListener("input", () => {
      const nextSpan = clamp(Number(spanSlider.value) / 100, 0.16, 1.0);
      state = { ...state, bellowsSpan: nextSpan };
      dirty = true;
      syncControlsAndDiagnosis(false);
      runner.draw();
    });
  }

  document.querySelectorAll("[data-hero-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = PRESETS[btn.dataset.heroPreset];
      if (!preset) return;
      applyState(preset.apply(state));
    });
  });

  document.querySelectorAll("[data-hero-scan]").forEach((btn) => {
    btn.addEventListener("click", triggerScan);
  });

  // Global keyboard shortcuts when not typing in an input or clicking native buttons
  document.addEventListener("keydown", (e) => {
    if (e.target && /^(INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY)$/.test(e.target.tagName)) return;
    if (e.code === "Space") {
      e.preventDefault();
      triggerScan();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      applyState({ ...state, bellowsSpan: clamp(state.bellowsSpan - 0.05, 0.16, 1.0) }, { rebuildDom: false });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      applyState({ ...state, bellowsSpan: clamp(state.bellowsSpan + 0.05, 0.16, 1.0) }, { rebuildDom: false });
    }
  });

  // Resize observer keeps bellows razor sharp
  new ResizeObserver(() => {
    dirty = true;
    runner.draw();
  }).observe(canvas);

  // Initial render
  renderAccordionDom(true);
  syncControlsAndDiagnosis(true);
  runner.draw();
}

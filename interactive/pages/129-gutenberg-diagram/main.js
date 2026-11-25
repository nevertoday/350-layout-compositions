import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  ARTICLES,
  INITIAL_SLOTS,
  QUADRANT_INFO,
  QUIZ_CORRECT,
  QUIZ_FEEDBACK,
  SCRIPT_MODES,
  TIMELINE,
  evaluateOverride,
  evaluateProof,
  swapSlots,
} from "./model.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeInOutSine(x) {
  return 0.5 - 0.5 * Math.cos(Math.PI * x);
}

// ==================== HERO: HOMOGENEOUS BROADSHEET PROOF ====================
function initHero() {
  const board = document.getElementById("proof-board");
  const canvas = document.getElementById("proof-canvas");
  const ctx = canvas.getContext("2d");
  const gazeSvg = document.getElementById("gaze-svg");
  const slotsEls = [0, 1, 2, 3].map((i) => document.getElementById(`proof-slot-${i}`));
  const gripEls = [0, 1, 2, 3].map((i) => document.getElementById(`slot-grip-${i}`));
  const slotTagEls = [0, 1, 2, 3].map((i) => document.getElementById(`slot-tag-${i}`));
  const resetBtn = document.getElementById("btn-reset-proof");

  const stampEl = document.getElementById("hero-stamp");
  const heroCountEl = document.getElementById("hero-count");
  const roTier = document.getElementById("ro-tier");
  const roCount = document.getElementById("ro-count");
  const roWhy = document.getElementById("ro-why");
  const stVals = [0, 1, 2, 3].map((i) => document.getElementById(`st-val-${i}`));
  const stItems = [...document.querySelectorAll("#station-track li")];

  // Build reusable lightweight SVG elements for live corridor gaze sweep & floating drag ghost
  gazeSvg.innerHTML = `
    <rect id="gz-drop-box" fill="rgba(67, 94, 69, 0.10)" stroke="#435E45" stroke-width="2" stroke-dasharray="6 4" opacity="0"/>
    <line id="gz-drag-line" stroke="rgba(185, 65, 76, 0.42)" stroke-width="1.5" stroke-dasharray="4 4" opacity="0"/>
    <path id="gz-trail" fill="none" stroke="#B9414C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="5 4" opacity="0"/>
    <g id="gz-head" opacity="0">
      <circle id="gz-halo" r="13" fill="rgba(185, 65, 76, 0.22)"/>
      <circle id="gz-ring" r="7.5" fill="#FAF6EE" stroke="#B9414C" stroke-width="2.2"/>
      <circle id="gz-core" r="3.6" fill="#B9414C"/>
    </g>
    <g id="gz-ghost" opacity="0">
      <rect id="gz-ghost-bg" rx="2" fill="rgba(251, 247, 240, 0.96)" stroke="#B9414C" stroke-width="2"/>
      <rect id="gz-ghost-top" height="5" fill="#B9414C"/>
      <text id="gz-ghost-txt" fill="#161816" font-size="13" font-weight="900"></text>
    </g>
  `;
  const gzDropBox = document.getElementById("gz-drop-box");
  const gzDragLine = document.getElementById("gz-drag-line");
  const gzTrail = document.getElementById("gz-trail");
  const gzHead = document.getElementById("gz-head");
  const gzHalo = document.getElementById("gz-halo");
  const gzRing = document.getElementById("gz-ring");
  const gzCore = document.getElementById("gz-core");
  const gzGhost = document.getElementById("gz-ghost");
  const gzGhostBg = document.getElementById("gz-ghost-bg");
  const gzGhostTop = document.getElementById("gz-ghost-top");
  const gzGhostTxt = document.getElementById("gz-ghost-txt");

  let slots = INITIAL_SLOTS.slice();
  let selectedSlot = -1;
  let layoutDirty = true;
  let canvasDirty = true;
  let svgDirty = true;
  let currentEval = evaluateProof(slots);

  // Poster-corridor ~4s reading-gravity sweep + smooth fade-out:
  //   1. TL bullseye long dwell (0.88s) — Primary Optical Area
  //   2. Top red arrow horizontal sweep -> TR crimson eye (0.38s)
  //   3. TR eye short dwell (0.46s) — Strong Fallow Area
  //   4. Fast muted return along top margin rail to left margin (0.16s, zero diagonal Z-line!)
  //   5. Unbroken gravity glide (1.16s): down left red stem past walnut mid-dot (SKIMS BL without stopping!)
  //      -> right across central horizontal gutter red arrow -> down right outer corridor into BR terminal
  //   6. BR pine-green terminal bullseye longest dwell (0.94s) — Terminal Area
  //   7. Smooth trail & gaze-dot fade-out (0.52s)
  const SWEEP_SEGS = [
    { kind: "dwell-tl", dur: 0.88 },
    { kind: "move-top", dur: 0.38 },
    { kind: "dwell-tr", dur: 0.46 },
    { kind: "return-top", dur: 0.16 },
    { kind: "move-cascade", dur: 1.16 },
    { kind: "dwell-br", dur: 0.94 },
    { kind: "fade", dur: 0.52 },
  ];
  const SWEEP_TOTAL = SWEEP_SEGS.reduce((s, x) => s + x.dur, 0);

  const sweep = {
    active: true,
    elapsed: 0,
    revealedMask: [false, false, false, false],
    scanningSlot: -1,
    blSkimming: false,
    settled: false,
  };

  // Offscreen cache for the FIXED poster-motif & unified 3-tier heat backdrop
  const bgCanvas = document.createElement("canvas");
  let cw = 0;
  let ch = 0;
  let dpr = 1;
  let layoutSig = "";
  let corridor = null;

  const drag = {
    active: false,
    moved: false,
    fromSlot: -1,
    hoverSlot: -1,
    pointerId: null,
    startX: 0,
    startY: 0,
    curX: 0,
    curY: 0,
    boardLeft: 0,
    boardTop: 0,
    boardW: 320,
    boardH: 320,
    boxW: 160,
    boxH: 46,
  };

  function drawBullseye(c, x, y, color, rOut = 9.5, rIn = 5.2) {
    c.save();
    c.beginPath();
    c.arc(x, y, rOut, 0, Math.PI * 2);
    c.fillStyle = "#F8F3E9";
    c.fill();
    c.lineWidth = Math.max(1.6, rOut * 0.22);
    c.strokeStyle = color;
    c.stroke();
    c.beginPath();
    c.arc(x, y, rIn, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
    c.restore();
  }

  function drawEyeIcon(c, x, y, color, scale = 1) {
    c.save();
    c.translate(x, y);
    c.scale(scale, scale);
    c.beginPath();
    c.moveTo(-12, 0);
    c.quadraticCurveTo(0, -8.5, 12, 0);
    c.quadraticCurveTo(0, 8.5, -12, 0);
    c.closePath();
    c.fillStyle = "#FBF7F0";
    c.fill();
    c.lineWidth = 1.8;
    c.strokeStyle = color;
    c.stroke();
    c.beginPath();
    c.arc(0, 0, 3.3, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
    c.restore();
  }

  function drawArrowHead(c, x, y, ang, color, size = 7) {
    c.save();
    c.translate(x, y);
    c.rotate(ang);
    c.strokeStyle = color;
    c.lineWidth = Math.max(1.7, size * 0.32);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(-size, -size * 0.72);
    c.lineTo(0, 0);
    c.lineTo(-size, size * 0.72);
    c.stroke();
    c.restore();
  }

  // Measure ACTUAL board-local corridors & gutters from the 4 live proof-slot rectangles so
  // poster motifs, diagonal masking, and the live gaze path NEVER touch card text on any screen!
  function measureCorridorLayout(w, h) {
    const bRect = board.getBoundingClientRect();
    const sRects = slotsEls.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left - bRect.left,
        top: r.top - bRect.top,
        right: r.right - bRect.left,
        bottom: r.bottom - bRect.top,
        width: r.width,
        height: r.height,
      };
    });
    const hasDom = bRect.width > 100 && sRects.every((r) => r.width > 20 && r.height > 20);
    const topMargin = hasDom ? Math.max(16, Math.min(sRects[0].top, sRects[1].top)) : (w < 460 ? 30 : 36);
    const leftMargin = hasDom ? Math.max(12, Math.min(sRects[0].left, sRects[2].left)) : (w < 460 ? 18 : 36);
    const rightMargin = hasDom ? Math.max(12, w - Math.max(sRects[1].right, sRects[3].right)) : (w < 460 ? 18 : 36);
    const botMargin = hasDom ? Math.max(14, h - Math.max(sRects[2].bottom, sRects[3].bottom)) : (w < 460 ? 28 : 32);

    const midX = hasDom
      ? (Math.max(sRects[0].right, sRects[2].right) + Math.min(sRects[1].left, sRects[3].left)) * 0.5
      : w * 0.5;
    const midY = hasDom
      ? (Math.max(sRects[0].bottom, sRects[1].bottom) + Math.min(sRects[2].top, sRects[3].top)) * 0.5
      : h * 0.5;
    const rowGap = hasDom
      ? Math.max(10, Math.min(sRects[2].top, sRects[3].top) - Math.max(sRects[0].bottom, sRects[1].bottom))
      : 22;
    const colGap = hasDom
      ? Math.max(8, Math.min(sRects[1].left, sRects[3].left) - Math.max(sRects[0].right, sRects[2].right))
      : 22;

    const compact = w < 460 || topMargin < 27;
    const leftX = Math.max(7, leftMargin * 0.5);
    const rightX = Math.min(w - 7, w - rightMargin * 0.5);
    const topY = Math.max(10, topMargin * 0.56);
    const botY = Math.min(h - 9, h - botMargin * 0.52);

    // Reserve deterministic clearance for the widest top-right status badge so the eye never collides or jumps
    const safeStatusLeft = w - (compact ? 156 : 215);
    const eyeTopX = compact
      ? Math.max(midX + 14, Math.min(w * 0.62, safeStatusLeft))
      : Math.min(w * 0.72, safeStatusLeft);

    const midDot2X = Math.min(rightX - (compact ? 24 : 46), w * (compact ? 0.76 : 0.67));
    const eyeBotX = rightX - (compact ? 70 : 112);

    const minCorridor = Math.min(leftMargin, rightMargin, topMargin, botMargin, rowGap);
    const rBull = Math.max(5.5, Math.min(10, minCorridor * 0.31));
    const rGaze = Math.max(4.6, Math.min(7.8, minCorridor * 0.27));
    const cornerR = Math.max(4, Math.min(10, Math.min(rightMargin * 0.5, rowGap * 0.5) * 0.65));

    const slotCenters = hasDom
      ? sRects.map((r) => ({ x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 }))
      : [
          { x: w * 0.25, y: h * 0.25 },
          { x: w * 0.75, y: h * 0.25 },
          { x: w * 0.25, y: h * 0.75 },
          { x: w * 0.75, y: h * 0.75 },
        ];

    const sig = hasDom
      ? `${w}x${h}:${sRects.map((r) => `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}`).join("|")}`
      : `${w}x${h}:est`;

    return {
      compact,
      w,
      h,
      leftX,
      rightX,
      topY,
      botY,
      midX,
      midY,
      rowGap,
      colGap,
      eyeTopX,
      midDot2X,
      eyeBotX,
      rBull,
      rGaze,
      cornerR,
      slotRects: hasDom ? sRects : [],
      slotCenters,
      sig,
    };
  }

  function buildFixedBackdrop(w, h, r, g) {
    bgCanvas.width = Math.max(1, Math.round(w * r));
    bgCanvas.height = Math.max(1, Math.round(h * r));
    const b = bgCanvas.getContext("2d");
    b.setTransform(r, 0, 0, r, 0, 0);
    b.clearRect(0, 0, w, h);

    const { compact, leftX, topY, botY, rightX, midX, midY, colGap, eyeTopX, midDot2X, eyeBotX, rBull, cornerR, slotRects } = g;

    // 1. Warm Xuan paper base
    b.fillStyle = "#FBF7F0";
    b.fillRect(0, 0, w, h);

    // 2. UNIFIED 3-TIER FIXED HEAT WASH (strictly clipped per quadrant — zero contradiction with legend!)
    b.save();
    b.beginPath();
    b.rect(0, 0, midX, midY);
    b.clip();
    const gTL = b.createRadialGradient(w * 0.08, h * 0.1, 8, w * 0.18, h * 0.22, Math.max(midX, midY) * 1.12);
    gTL.addColorStop(0, "rgba(228, 141, 145, 0.44)");
    gTL.addColorStop(0.62, "rgba(239, 184, 182, 0.20)");
    gTL.addColorStop(1, "rgba(251, 247, 240, 0.02)");
    b.fillStyle = gTL;
    b.fillRect(0, 0, midX, midY);
    b.restore();

    b.save();
    b.fillStyle = "rgba(213, 185, 163, 0.28)";
    b.fillRect(midX, 0, w - midX, midY);
    b.restore();

    b.save();
    b.fillStyle = "rgba(199, 204, 192, 0.40)";
    b.fillRect(0, midY, midX, h - midY);
    b.restore();

    b.save();
    b.beginPath();
    b.rect(midX, midY, w - midX, h - midY);
    b.clip();
    const gBR = b.createRadialGradient(w * 0.92, h * 0.90, 8, w * 0.80, h * 0.78, Math.max(w - midX, h - midY) * 1.1);
    gBR.addColorStop(0, "rgba(228, 141, 145, 0.40)");
    gBR.addColorStop(0.62, "rgba(239, 184, 182, 0.18)");
    gBR.addColorStop(1, "rgba(251, 247, 240, 0.02)");
    b.fillStyle = gBR;
    b.fillRect(midX, midY, w - midX, h - midY);
    b.restore();

    // 3. Fixed dashed quadrant divider crosshairs (aligned strictly down center of gutters)
    b.save();
    b.strokeStyle = "#C4BAAE";
    b.lineWidth = 1.25;
    b.setLineDash([6, 5]);
    b.beginPath();
    b.moveTo(midX, 8);
    b.lineTo(midX, h - 8);
    b.moveTo(8, midY);
    b.lineTo(w - 8, midY);
    b.stroke();
    b.restore();

    // 4a. Subtle Diagonal Reading Gravity Axis — strictly clipped OUT of all 4 proof-slot boxes via evenodd!
    //     Appears ONLY in outer corner whitespace & open central cross-gutter, NEVER behind card text!
    b.save();
    if (slotRects.length === 4) {
      b.beginPath();
      b.rect(0, 0, w, h);
      for (const sr of slotRects) {
        const pad = 2;
        b.rect(sr.left - pad, sr.top - pad, sr.width + pad * 2, sr.height + pad * 2);
      }
      b.clip("evenodd");
    }
    const gradAxis = b.createLinearGradient(leftX, topY, rightX, botY);
    gradAxis.addColorStop(0, "rgba(185, 65, 76, 0.56)");
    gradAxis.addColorStop(0.5, "rgba(133, 81, 45, 0.52)");
    gradAxis.addColorStop(1, "rgba(67, 94, 69, 0.58)");
    b.strokeStyle = gradAxis;
    b.lineWidth = compact ? 1.7 : 2.1;
    b.setLineDash([5, 4]);
    b.lineCap = "round";
    b.beginPath();
    b.moveTo(leftX, topY);
    b.lineTo(rightX, botY);
    b.stroke();
    b.restore();

    // 4b. Poster Horizontal Red Arrow #1 along top outer corridor -> Crimson Open Eye Icon
    const arrow1EndX = eyeTopX - (compact ? 14 : 20);
    if (arrow1EndX > leftX + 26) {
      b.save();
      b.strokeStyle = "#B9414C";
      b.lineWidth = compact ? 1.8 : 2.2;
      b.lineCap = "round";
      b.beginPath();
      b.moveTo(leftX + rBull + 2, topY);
      b.lineTo(arrow1EndX, topY);
      b.stroke();
      drawArrowHead(b, arrow1EndX, topY, 0, "#B9414C", compact ? 5 : 6.5);
      b.restore();
      drawEyeIcon(b, eyeTopX, topY, "#B9414C", compact ? 0.68 : 0.9);
    }

    // 4c. Poster Left Vertical Red Stem -> Walnut Mid-Dot #1 (skimming BL) + faint downward tail
    b.save();
    b.strokeStyle = "rgba(185, 65, 76, 0.80)";
    b.lineWidth = compact ? 1.6 : 2;
    b.beginPath();
    b.moveTo(leftX, topY + rBull + 2);
    b.lineTo(leftX, midY);
    b.stroke();
    const gVert = b.createLinearGradient(leftX, midY, leftX, h - 22);
    gVert.addColorStop(0, "rgba(185, 65, 76, 0.45)");
    gVert.addColorStop(1, "rgba(185, 65, 76, 0.10)");
    b.strokeStyle = gVert;
    b.beginPath();
    b.moveTo(leftX, midY + 6);
    b.lineTo(leftX, h - 22);
    b.stroke();
    b.restore();

    // 4d. Poster Horizontal Red Arrow #2 in central horizontal gutter -> Walnut Mid-Dot #2
    const arrow2EndX = midDot2X - (compact ? 11 : 15);
    b.save();
    b.strokeStyle = "#B9414C";
    b.lineWidth = compact ? 1.8 : 2.2;
    b.lineCap = "round";
    b.beginPath();
    b.moveTo(leftX + 6, midY);
    b.lineTo(arrow2EndX, midY);
    b.stroke();
    drawArrowHead(b, arrow2EndX, midY, 0, "#B9414C", compact ? 5 : 6.5);
    b.restore();

    // Subtle dashed gutter-to-right-margin gravity continuation into BR terminal bullseye (strictly outside cards!)
    b.save();
    b.strokeStyle = "rgba(133, 81, 45, 0.42)";
    b.lineWidth = compact ? 1.3 : 1.5;
    b.setLineDash([4, 4]);
    b.lineCap = "round";
    b.beginPath();
    b.moveTo(midDot2X + 7, midY);
    b.lineTo(rightX - cornerR, midY);
    b.quadraticCurveTo(rightX, midY, rightX, midY + cornerR);
    b.lineTo(rightX, botY - rBull - 3);
    b.stroke();
    drawArrowHead(b, rightX, botY - rBull - 4, Math.PI * 0.5, "rgba(67, 94, 69, 0.72)", compact ? 4.2 : 5.2);
    b.restore();

    // Poster's signature Walnut-Brown Mid-Dots (#85512D)
    b.save();
    b.fillStyle = "#85512D";
    const rWalnut = compact ? 3.8 : 5.4;
    b.beginPath();
    b.arc(leftX, midY, rWalnut, 0, Math.PI * 2);
    b.fill();
    b.beginPath();
    b.arc(midDot2X, midY, rWalnut, 0, Math.PI * 2);
    b.fill();
    b.restore();

    // 4e. Poster's Wavy Pine-Green Flow-Balance Squiggle in open central vertical gutter (desktop/tablet)
    if (!compact && colGap >= 20) {
      const wx = midX;
      const wy = midY + 26;
      b.save();
      b.strokeStyle = "#435E45";
      b.lineWidth = 1.6;
      b.lineCap = "round";
      b.beginPath();
      b.moveTo(wx, wy);
      b.bezierCurveTo(wx - 5.5, wy + 7, wx + 5.5, wy + 15, wx, wy + 22);
      b.stroke();
      drawArrowHead(b, wx, wy + 24, Math.PI * 0.5, "#435E45", 4.5);
      b.restore();

      // Subtle poster-style dashed callout leader dots on outer side margins
      b.save();
      b.fillStyle = "#ABA094";
      b.strokeStyle = "#B8AEA2";
      b.lineWidth = 1;
      b.setLineDash([3, 3]);
      for (const [cx, cy, tx] of [
        [w - 14, h * 0.25, w - 2],
        [14, h * 0.72, 2],
      ]) {
        b.beginPath();
        b.arc(cx, cy, 2.6, 0, Math.PI * 2);
        b.fill();
        b.beginPath();
        b.moveTo(cx, cy);
        b.lineTo(tx, cy);
        b.stroke();
      }
      b.restore();
    }

    // 4f. Poster's Bottom-Right Pine-Green Eye Icon + dashed curved guide into Terminal Bullseye
    if (eyeBotX > midX + 14) {
      b.save();
      b.strokeStyle = "rgba(67, 94, 69, 0.72)";
      b.lineWidth = 1.4;
      b.setLineDash([4, 4]);
      b.beginPath();
      b.moveTo(eyeBotX + (compact ? 11 : 15), botY);
      b.quadraticCurveTo((eyeBotX + rightX) * 0.5, botY - 3.5, rightX - rBull - 3, botY);
      b.stroke();
      b.restore();
      drawEyeIcon(b, eyeBotX, botY, "#435E45", compact ? 0.68 : 0.88);
    }

    // 4g. Poster's Start Crimson Bullseye (TL) & Pine-Green Terminal Bullseye (BR) with dashed stamp links
    b.save();
    b.strokeStyle = "#435E45";
    b.lineWidth = 1.25;
    b.setLineDash([3, 3]);
    b.beginPath();
    b.moveTo(leftX, 0);
    b.lineTo(leftX, Math.max(0, topY - rBull));
    b.moveTo(rightX, Math.min(h, botY + rBull));
    b.lineTo(rightX, h);
    b.stroke();
    b.restore();

    drawBullseye(b, leftX, topY, "#B9414C", rBull, rBull * 0.54);
    drawBullseye(b, rightX, botY, "#435E45", rBull, rBull * 0.54);
  }

  function resizeCanvas(force = false) {
    if (!force && !layoutDirty && cw > 0 && ch > 0) return;
    layoutDirty = false;
    const rect = board.getBoundingClientRect();
    const w = Math.max(240, Math.round(rect.width));
    const h = Math.max(200, Math.round(rect.height));
    const r = pixelRatio(2);
    const nextCorridor = measureCorridorLayout(w, h);
    if (force || w !== cw || h !== ch || r !== dpr || nextCorridor.sig !== layoutSig) {
      cw = w;
      ch = h;
      dpr = r;
      corridor = nextCorridor;
      layoutSig = nextCorridor.sig;
      canvas.width = Math.round(w * r);
      canvas.height = Math.round(h * r);
      gazeSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      buildFixedBackdrop(w, h, r, corridor);
      canvasDirty = true;
      svgDirty = true;
    }
  }

  function applySlotVisualClasses() {
    const ev = currentEval;
    slotsEls.forEach((slotEl, i) => {
      const revealed = sweep.settled || sweep.revealedMask[i];
      const st = ev.stations[i].visualState;
      slotEl.classList.toggle("is-pending", !revealed);
      slotEl.classList.toggle("is-scanning", sweep.active && sweep.scanningSlot === i);
      slotEl.classList.toggle("is-skimmed-pass", sweep.active && i === 2 && sweep.blSkimming);
      slotEl.classList.toggle("is-caught", revealed && st === "caught");
      slotEl.classList.toggle("is-quiet", revealed && st === "quiet");
      slotEl.classList.toggle("is-skimmed", revealed && st === "skimmed");
      slotEl.classList.toggle("is-missed", revealed && st === "missed");
    });
  }

  function renderSlots({ restartSweep = false } = {}) {
    currentEval = evaluateProof(slots);
    const ev = currentEval;

    slots.forEach((artId, i) => {
      const art = ARTICLES[artId];
      const slotEl = slotsEls[i];
      const grip = gripEls[i];
      slotEl.querySelector('[data-role="kicker"]').textContent = art.kicker;
      slotEl.querySelector('[data-role="head"]').textContent = art.head;
      slotEl.querySelector('[data-role="body"]').textContent = art.body;
      slotTagEls[i].textContent = ev.stations[i].shortTag;

      slotEl.classList.toggle("is-selected", selectedSlot === i);
      slotEl.classList.toggle("is-dragging", drag.active && drag.moved && drag.fromSlot === i);
      slotEl.classList.toggle("is-drop-target", drag.active && drag.moved && drag.hoverSlot === i && drag.hoverSlot !== drag.fromSlot);
      grip.setAttribute("aria-pressed", String(selectedSlot === i));
      grip.setAttribute("aria-label", `${ev.stations[i].loc}：${art.kicker}，拖动或按方向键与其他象限调位`);
    });

    // Sync BOTH top-rim board status (visible in 390px first screen!) AND bottom readout band
    stampEl.textContent = ev.tierLabel;
    stampEl.dataset.tier = ev.tierKey;
    heroCountEl.textContent = `${ev.matches} / 4`;
    roTier.textContent = ev.tierLabel;
    roTier.dataset.tier = ev.tierKey;
    roCount.textContent = `${ev.matches} / 4`;
    roWhy.textContent = ev.why;
    resetBtn.disabled = ev.isInitial;

    ev.stations.forEach((st, i) => {
      stVals[i].textContent = st.article.short;
      stItems[i].classList.toggle("is-match", st.matched);
      stItems[i].classList.toggle("is-mismatch", !st.matched);
    });

    if (restartSweep) {
      sweep.active = true;
      sweep.elapsed = 0;
      sweep.revealedMask = [false, false, false, false];
      sweep.scanningSlot = 0;
      sweep.blSkimming = false;
      sweep.settled = false;
    }

    applySlotVisualClasses();
    svgDirty = true;
  }

  function commitSwap(a, b) {
    if (a === b || a < 0 || b < 0) return;
    slots = swapSlots(slots, a, b);
    selectedSlot = -1;
    renderSlots({ restartSweep: true });
    heroLoop.draw();
  }

  function findSlotAtPoint(clientX, clientY) {
    const rx = clientX - drag.boardLeft;
    const ry = clientY - drag.boardTop;
    if (rx < -24 || ry < -24 || rx > drag.boardW + 24 || ry > drag.boardH + 24) return -1;
    const col = rx < drag.boardW * 0.5 ? 0 : 1;
    const row = ry < drag.boardH * 0.5 ? 0 : 1;
    return row * 2 + col;
  }

  function beginDrag(slotIdx, e) {
    const bRect = board.getBoundingClientRect();
    const sRect = slotsEls[slotIdx].getBoundingClientRect();
    drag.active = true;
    drag.moved = false;
    drag.fromSlot = slotIdx;
    drag.hoverSlot = slotIdx;
    drag.pointerId = e.pointerId;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.boardLeft = bRect.left;
    drag.boardTop = bRect.top;
    drag.boardW = bRect.width;
    drag.boardH = bRect.height;
    drag.curX = e.clientX - bRect.left;
    drag.curY = e.clientY - bRect.top;
    drag.boxW = Math.min(Math.max(126, sRect.width * 0.65), 220);
    drag.boxH = 44;
    svgDirty = true;
  }

  gripEls.forEach((grip, idx) => {
    grip.addEventListener("pointerdown", (e) => {
      if (e.button && e.button !== 0) return;
      beginDrag(idx, e);
      try { grip.setPointerCapture(e.pointerId); } catch {}
    });

    grip.addEventListener("keydown", (e) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      let target = -1;
      if (e.key === "ArrowRight") target = row * 2 + (1 - col);
      else if (e.key === "ArrowLeft") target = row * 2 + (1 - col);
      else if (e.key === "ArrowDown") target = (1 - row) * 2 + col;
      else if (e.key === "ArrowUp") target = (1 - row) * 2 + col;
      if (target >= 0) {
        e.preventDefault();
        commitSwap(idx, target);
        gripEls[target].focus();
      } else if (e.key === "Escape" && selectedSlot >= 0) {
        selectedSlot = -1;
        renderSlots();
      }
    });

    grip.addEventListener("click", () => {
      if (drag.moved) return;
      handleSlotClick(idx);
    });
  });

  board.querySelectorAll("[data-slot-click]").forEach((el) => {
    const idx = Number(el.dataset.slotClick);
    el.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button === 0) {
        beginDrag(idx, e);
      }
    });
    el.addEventListener("click", () => {
      if (drag.moved) return;
      handleSlotClick(idx);
    });
  });

  function handleSlotClick(idx) {
    if (selectedSlot === -1) {
      selectedSlot = idx;
      renderSlots();
    } else if (selectedSlot === idx) {
      selectedSlot = -1;
      renderSlots();
    } else {
      commitSwap(selectedSlot, idx);
    }
  }

  window.addEventListener("pointermove", (e) => {
    if (!drag.active || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > 4) {
      drag.moved = true;
      selectedSlot = -1;
      // Settle any active sweep immediately so dragging stays ultra crisp
      if (sweep.active) {
        sweep.active = false;
        sweep.settled = true;
        sweep.scanningSlot = -1;
        sweep.blSkimming = false;
        sweep.revealedMask = [true, true, true, true];
      }
      renderSlots();
    }
    if (drag.moved) {
      drag.curX = Math.max(12, Math.min(drag.boardW - 12, e.clientX - drag.boardLeft));
      drag.curY = Math.max(12, Math.min(drag.boardH - 12, e.clientY - drag.boardTop));
      const hSlot = findSlotAtPoint(e.clientX, e.clientY);
      if (hSlot !== drag.hoverSlot) {
        drag.hoverSlot = hSlot;
        slotsEls.forEach((el, i) => {
          el.classList.toggle("is-drop-target", hSlot === i && hSlot !== drag.fromSlot);
        });
      }
      svgDirty = true;
      if (reducedMotion.matches) heroLoop.draw();
    }
  });

  function finishDrag(e) {
    if (!drag.active || (e.pointerId !== undefined && e.pointerId !== drag.pointerId)) return;
    const wasMoved = drag.moved;
    const from = drag.fromSlot;
    const to = drag.hoverSlot;
    drag.active = false;
    drag.pointerId = null;
    if (wasMoved) {
      if (to >= 0 && to !== from) {
        commitSwap(from, to);
      } else {
        renderSlots();
      }
      setTimeout(() => { drag.moved = false; }, 0);
    } else {
      drag.moved = false;
    }
    svgDirty = true;
    heroLoop.draw();
  }

  window.addEventListener("pointerup", finishDrag);
  window.addEventListener("pointercancel", finishDrag);

  resetBtn.addEventListener("click", () => {
    slots = INITIAL_SLOTS.slice();
    selectedSlot = -1;
    renderSlots({ restartSweep: true });
    heroLoop.draw();
  });

  function updateGazeVisuals(still) {
    if (!corridor) return;
    const { leftX, rightX, topY, botY, midY, eyeTopX, rGaze, cornerR } = corridor;

    // 1. Floating letterpress drag slug ghost when dragging
    if (drag.active && drag.moved) {
      const art = ARTICLES[slots[drag.fromSlot]];
      const gx = Math.max(6, Math.min(cw - drag.boxW - 6, drag.curX - drag.boxW * 0.5));
      const gy = Math.max(6, Math.min(ch - drag.boxH - 6, drag.curY - 22));
      gzGhost.setAttribute("opacity", "1");
      gzGhostBg.setAttribute("x", gx.toFixed(1));
      gzGhostBg.setAttribute("y", gy.toFixed(1));
      gzGhostBg.setAttribute("width", drag.boxW.toFixed(1));
      gzGhostBg.setAttribute("height", drag.boxH.toFixed(1));
      gzGhostTop.setAttribute("x", gx.toFixed(1));
      gzGhostTop.setAttribute("y", gy.toFixed(1));
      gzGhostTop.setAttribute("width", drag.boxW.toFixed(1));
      gzGhostTxt.setAttribute("x", (gx + 12).toFixed(1));
      gzGhostTxt.setAttribute("y", (gy + 29).toFixed(1));
      gzGhostTxt.textContent = `${art.kicker} · 换位中`;
      const src = corridor.slotCenters[drag.fromSlot];
      gzDragLine.setAttribute("x1", src.x.toFixed(1));
      gzDragLine.setAttribute("y1", src.y.toFixed(1));
      gzDragLine.setAttribute("x2", drag.curX.toFixed(1));
      gzDragLine.setAttribute("y2", drag.curY.toFixed(1));
      gzDragLine.setAttribute("opacity", "1");
      if (drag.hoverSlot >= 0 && drag.hoverSlot !== drag.fromSlot) {
        const hx = (drag.hoverSlot % 2) * (cw * 0.5) + 10;
        const hy = Math.floor(drag.hoverSlot / 2) * (ch * 0.5) + 10;
        gzDropBox.setAttribute("x", hx.toFixed(1));
        gzDropBox.setAttribute("y", hy.toFixed(1));
        gzDropBox.setAttribute("width", (cw * 0.5 - 20).toFixed(1));
        gzDropBox.setAttribute("height", (ch * 0.5 - 20).toFixed(1));
        gzDropBox.setAttribute("opacity", "1");
      } else {
        gzDropBox.setAttribute("opacity", "0");
      }
      gzHead.setAttribute("opacity", "0");
      gzTrail.setAttribute("opacity", "0");
      gzTrail.setAttribute("d", "");
      return;
    }
    gzGhost.setAttribute("opacity", "0");
    gzDragLine.setAttribute("opacity", "0");
    gzDropBox.setAttribute("opacity", "0");

    if (still || !sweep.active) {
      gzHead.setAttribute("opacity", "0");
      gzTrail.setAttribute("opacity", "0");
      gzTrail.setAttribute("d", "");
      return;
    }

    // 2. Evaluate current phase along the poster's outer corridors & central horizontal gutter
    const topBranchFull = `M${leftX.toFixed(1)} ${topY.toFixed(1)} L${eyeTopX.toFixed(1)} ${topY.toFixed(1)}`;
    const cascadeBranchFull =
      `M${leftX.toFixed(1)} ${topY.toFixed(1)} ` +
      `L${leftX.toFixed(1)} ${midY.toFixed(1)} ` +
      `L${(rightX - cornerR).toFixed(1)} ${midY.toFixed(1)} ` +
      `Q${rightX.toFixed(1)} ${midY.toFixed(1)} ${rightX.toFixed(1)} ${(midY + cornerR).toFixed(1)} ` +
      `L${rightX.toFixed(1)} ${botY.toFixed(1)}`;

    let acc = 0;
    let curX = leftX;
    let curY = topY;
    let ringR = rGaze;
    let haloR = rGaze + 4;
    let curColor = "#B9414C";
    let headOpacity = 1;
    let trailOpacity = 0;
    let trailD = "";
    let activeSlot = -1;
    let blSkimming = false;
    let revealIdx = -1;

    for (const seg of SWEEP_SEGS) {
      if (sweep.elapsed <= acc + seg.dur || seg === SWEEP_SEGS[SWEEP_SEGS.length - 1]) {
        const u = Math.max(0, Math.min(1, (sweep.elapsed - acc) / seg.dur));

        if (seg.kind === "dwell-tl") {
          curX = leftX;
          curY = topY;
          activeSlot = 0;
          revealIdx = 0;
          const st = currentEval.stations[0].visualState;
          curColor = st === "caught" ? "#435E45" : "#B9414C";
          haloR = rGaze + 4.5 + Math.sin(u * Math.PI) * 5.2;
          trailD = "";
          trailOpacity = 0;
        } else if (seg.kind === "move-top") {
          const eu = easeInOutCubic(u);
          curX = leftX + (eyeTopX - leftX) * eu;
          curY = topY;
          revealIdx = 0;
          curColor = "#B9414C";
          haloR = rGaze + 3;
          trailD = `M${leftX.toFixed(1)} ${topY.toFixed(1)} L${curX.toFixed(1)} ${topY.toFixed(1)}`;
          trailOpacity = 0.72;
        } else if (seg.kind === "dwell-tr") {
          curX = eyeTopX;
          curY = topY;
          activeSlot = 1;
          revealIdx = 1;
          const st = currentEval.stations[1].visualState;
          curColor = st === "caught" ? "#435E45" : "#B9414C";
          haloR = rGaze + 3.5 + Math.sin(u * Math.PI) * 3.8;
          trailD = topBranchFull;
          trailOpacity = 0.72;
        } else if (seg.kind === "return-top") {
          // Fast muted return-sweep strictly along top corridor rail — ZERO diagonal Z-line!
          const eu = easeInOutCubic(u);
          curX = eyeTopX + (leftX - eyeTopX) * eu;
          curY = topY;
          revealIdx = 1;
          ringR = rGaze * 0.74;
          haloR = rGaze + 1.5;
          headOpacity = 0.56;
          curColor = "#85512D";
          trailD = topBranchFull;
          trailOpacity = 0.64;
        } else if (seg.kind === "move-cascade") {
          // One fluid, unstoppable gravity glide: left stem -> mid horizontal gutter -> right outer corridor -> BR terminal
          const len1 = Math.max(1, midY - topY);
          const len2 = Math.max(1, (rightX - cornerR) - leftX);
          const lenArc = Math.max(1, cornerR * 1.5708);
          const len3 = Math.max(1, botY - (midY + cornerR));
          const totalLen = len1 + len2 + lenArc + len3;
          const dist = easeInOutSine(u) * totalLen;
          let branch2 = "";

          if (dist <= len1) {
            const f = dist / len1;
            curX = leftX;
            curY = topY + len1 * f;
            branch2 = `M${leftX.toFixed(1)} ${topY.toFixed(1)} L${curX.toFixed(1)} ${curY.toFixed(1)}`;
            curColor = f > 0.7 ? "#85512D" : "#B9414C";
            if (f >= 0.76) {
              revealIdx = 2;
              blSkimming = true;
            } else {
              revealIdx = 1;
            }
          } else if (dist <= len1 + len2) {
            const f = (dist - len1) / len2;
            curX = leftX + len2 * f;
            curY = midY;
            branch2 = `M${leftX.toFixed(1)} ${topY.toFixed(1)} L${leftX.toFixed(1)} ${midY.toFixed(1)} L${curX.toFixed(1)} ${curY.toFixed(1)}`;
            curColor = f > 0.75 ? "#435E45" : "#B9414C";
            revealIdx = 2;
            blSkimming = f < 0.24;
          } else if (dist <= len1 + len2 + lenArc) {
            const tArc = (dist - len1 - len2) / lenArc;
            const mt = 1 - tArc;
            curX = mt * mt * (rightX - cornerR) + 2 * mt * tArc * rightX + tArc * tArc * rightX;
            curY = mt * mt * midY + 2 * mt * tArc * midY + tArc * tArc * (midY + cornerR);
            const qcx = (rightX - cornerR) + cornerR * tArc;
            branch2 =
              `M${leftX.toFixed(1)} ${topY.toFixed(1)} ` +
              `L${leftX.toFixed(1)} ${midY.toFixed(1)} ` +
              `L${(rightX - cornerR).toFixed(1)} ${midY.toFixed(1)} ` +
              `Q${qcx.toFixed(1)} ${midY.toFixed(1)} ${curX.toFixed(1)} ${curY.toFixed(1)}`;
            curColor = "#435E45";
            revealIdx = 2;
          } else {
            const f = Math.min(1, (dist - len1 - len2 - lenArc) / len3);
            curX = rightX;
            curY = (midY + cornerR) + len3 * f;
            branch2 =
              `M${leftX.toFixed(1)} ${topY.toFixed(1)} ` +
              `L${leftX.toFixed(1)} ${midY.toFixed(1)} ` +
              `L${(rightX - cornerR).toFixed(1)} ${midY.toFixed(1)} ` +
              `Q${rightX.toFixed(1)} ${midY.toFixed(1)} ${rightX.toFixed(1)} ${(midY + cornerR).toFixed(1)} ` +
              `L${curX.toFixed(1)} ${curY.toFixed(1)}`;
            curColor = "#435E45";
            revealIdx = 2;
          }

          haloR = rGaze + 3;
          trailD = `${topBranchFull} ${branch2}`;
          trailOpacity = 0.72;
        } else if (seg.kind === "dwell-br") {
          curX = rightX;
          curY = botY;
          activeSlot = 3;
          revealIdx = 3;
          const st = currentEval.stations[3].visualState;
          curColor = st === "caught" ? "#435E45" : "#B9414C";
          haloR = rGaze + 5 + Math.sin(u * Math.PI) * 5.6;
          trailD = `${topBranchFull} ${cascadeBranchFull}`;
          trailOpacity = 0.72;
        } else {
          // Smooth trail & gaze-dot fade-out after completing the Gutenberg sweep
          const fade = 1 - easeInOutCubic(u);
          curX = rightX;
          curY = botY;
          activeSlot = -1;
          revealIdx = 3;
          const st = currentEval.stations[3].visualState;
          curColor = st === "caught" ? "#435E45" : "#B9414C";
          haloR = rGaze + 4;
          trailD = `${topBranchFull} ${cascadeBranchFull}`;
          trailOpacity = 0.72 * fade;
          headOpacity = fade;
        }
        break;
      }
      acc += seg.dur;
    }

    // Sequentially reveal slots as reading gravity passes (TL -> TR -> BL skim -> BR)
    let stateChanged = false;
    if (revealIdx >= 0) {
      for (let k = 0; k <= revealIdx; k++) {
        if (!sweep.revealedMask[k]) {
          sweep.revealedMask[k] = true;
          stateChanged = true;
        }
      }
    }
    if (sweep.scanningSlot !== activeSlot || sweep.blSkimming !== blSkimming) {
      sweep.scanningSlot = activeSlot;
      sweep.blSkimming = blSkimming;
      stateChanged = true;
    }
    if (stateChanged) applySlotVisualClasses();

    // Update SVG corridor gaze tracer
    gzTrail.setAttribute("d", trailD);
    gzTrail.setAttribute("opacity", trailOpacity > 0.01 ? trailOpacity.toFixed(3) : "0");
    gzHead.setAttribute("opacity", headOpacity > 0.01 ? headOpacity.toFixed(3) : "0");
    gzHead.setAttribute("transform", `translate(${curX.toFixed(1)}, ${curY.toFixed(1)})`);
    gzHalo.setAttribute("r", haloR.toFixed(1));
    gzHalo.setAttribute(
      "fill",
      curColor === "#435E45"
        ? "rgba(67, 94, 69, 0.24)"
        : curColor === "#85512D"
          ? "rgba(133, 81, 45, 0.22)"
          : "rgba(185, 65, 76, 0.24)"
    );
    gzRing.setAttribute("r", ringR.toFixed(1));
    gzRing.setAttribute("stroke", curColor);
    gzCore.setAttribute("r", (ringR * 0.48).toFixed(1));
    gzCore.setAttribute("fill", curColor);
  }

  function drawFrame(t, dt, { still }) {
    resizeCanvas();
    if (!cw || !ch) return;

    if (still) {
      if (sweep.active || !sweep.settled) {
        sweep.active = false;
        sweep.settled = true;
        sweep.scanningSlot = -1;
        sweep.blSkimming = false;
        sweep.revealedMask = [true, true, true, true];
        applySlotVisualClasses();
        svgDirty = true;
      }
    } else if (sweep.active) {
      if (dt > 0) {
        sweep.elapsed += Math.min(dt, 0.08);
      }
      if (sweep.elapsed >= SWEEP_TOTAL) {
        sweep.active = false;
        sweep.settled = true;
        sweep.scanningSlot = -1;
        sweep.blSkimming = false;
        sweep.revealedMask = [true, true, true, true];
        applySlotVisualClasses();
      }
      svgDirty = true;
    }

    if (!canvasDirty && !svgDirty && !(drag.active && drag.moved)) return;

    if (canvasDirty) {
      canvasDirty = false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      // Blit FIXED poster-motif & unified 3-tier reading-gravity field (zero per-frame canvas blits during drag!)
      ctx.drawImage(bgCanvas, 0, 0, cw, ch);
    }

    if (svgDirty || (drag.active && drag.moved)) {
      svgDirty = false;
      updateGazeVisuals(still);
    }
  }

  const heroLoop = loop(board, drawFrame);
  new ResizeObserver(() => {
    layoutDirty = true;
    resizeCanvas(true);
    heroLoop.draw();
  }).observe(board);
  document.fonts?.ready?.then(() => {
    layoutDirty = true;
    resizeCanvas(true);
    heroLoop.draw();
  });

  renderSlots({ restartSweep: true });
  resizeCanvas(true);
  heroLoop.draw();
}

// ==================== SECTION 01: QUADRANT INSPECTOR & VIEW TOGGLE ====================
function initSection01() {
  const viewBtns = [...document.querySelectorAll("[data-s1-view]")];
  const layerClassic = document.getElementById("s1-layer-classic");
  const layerPoster = document.getElementById("s1-layer-poster");
  const quads = [...document.querySelectorAll(".s1-q")];

  const qTitle = document.getElementById("s1-q-title");
  const qEn = document.getElementById("s1-q-en");
  const qWeight = document.getElementById("s1-q-weight");
  const qDesc = document.getElementById("s1-q-desc");
  const qPlace = document.getElementById("s1-q-place");

  function setQuad(key) {
    const info = QUADRANT_INFO[key] || QUADRANT_INFO.poa;
    quads.forEach((r) => r.classList.toggle("is-selected", r.dataset.q === key));
    qTitle.textContent = info.title;
    qEn.textContent = info.en;
    qWeight.textContent = info.weight;
    qDesc.textContent = info.desc;
    qPlace.textContent = info.place;
  }

  viewBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.s1View;
      viewBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      if (mode === "poster") {
        layerClassic.setAttribute("hidden", "");
        layerPoster.removeAttribute("hidden");
      } else {
        layerPoster.setAttribute("hidden", "");
        layerClassic.removeAttribute("hidden");
      }
    });
  });

  quads.forEach((rect) => {
    rect.addEventListener("click", () => setQuad(rect.dataset.q));
    rect.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setQuad(rect.dataset.q);
      }
    });
  });

  setQuad("poa");
}

// ==================== SECTION 02: HOMOGENEITY OVERRIDE CANVAS ====================
function initSection02() {
  const canvas = document.getElementById("override-canvas");
  const ctx = canvas.getContext("2d");
  const toggleBtn = document.getElementById("s2-disrupt-btn");
  const slider = document.getElementById("s2-contrast");
  const valEl = document.getElementById("s2-contrast-val");
  const tierEl = document.getElementById("s2-tier");
  const verdictEl = document.getElementById("s2-verdict");
  const anchorBtns = [...document.querySelectorAll("[data-anchor]")];

  let targetContrast = 0;
  let smoothContrast = 0;
  let anchor = "bl";
  let cw = 0;
  let ch = 0;
  let dpr = 1;
  let dirty = true;

  const ANCHOR_COORDS = {
    tl: [0.24, 0.26],
    tr: [0.76, 0.26],
    bl: [0.24, 0.74],
    br: [0.76, 0.74],
  };

  function syncUI() {
    const ev = evaluateOverride(targetContrast, anchor);
    slider.value = String(ev.pct);
    valEl.textContent = `${ev.pct}%`;
    toggleBtn.setAttribute("aria-pressed", String(ev.disruptorOn));
    toggleBtn.textContent = ev.disruptorOn ? "撤掉强对比主图（恢复均质）" : "插入强对比主图（打破同质）";
    tierEl.textContent = ev.tierLabel;
    tierEl.dataset.tier = ev.tierKey;
    verdictEl.textContent = ev.verdict;
    anchorBtns.forEach((b) => {
      const on = b.dataset.anchor === anchor;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    dirty = true;
    ovLoop.draw();
  }

  toggleBtn.addEventListener("click", () => {
    targetContrast = targetContrast >= 20 ? 0 : 84;
    syncUI();
  });

  slider.addEventListener("input", () => {
    targetContrast = Number(slider.value);
    syncUI();
  });

  anchorBtns.forEach((b) => {
    b.addEventListener("click", () => {
      anchor = b.dataset.anchor;
      if (targetContrast < 20) targetContrast = 84;
      syncUI();
    });
  });

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(240, Math.round(rect.width));
    const h = Math.max(150, Math.round(rect.height));
    const r = pixelRatio(2);
    if (w !== cw || h !== ch || r !== dpr) {
      cw = w;
      ch = h;
      dpr = r;
      canvas.width = Math.round(w * r);
      canvas.height = Math.round(h * r);
      dirty = true;
    }
  }

  function drawFrame(t, dt, { still }) {
    resize();
    if (!cw || !ch) return;

    if (still) {
      smoothContrast = targetContrast;
    } else if (Math.abs(smoothContrast - targetContrast) > 0.25) {
      smoothContrast += (targetContrast - smoothContrast) * Math.min(1, Math.max(dt, 0.016) * 10);
      dirty = true;
    } else if (smoothContrast !== targetContrast) {
      smoothContrast = targetContrast;
      dirty = true;
    }

    if (!dirty) return;
    dirty = false;

    const k = smoothContrast / 100;
    const fade = 1 - k * 0.6;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    // Broadsheet warm paper
    ctx.fillStyle = "#F8F3E9";
    ctx.fillRect(0, 0, cw, ch);

    // Unified 3-tier baseline heat glow (TL & BR crimson high, TR walnut mid, BL sage-grey low)
    const gTL = ctx.createRadialGradient(cw * 0.14, ch * 0.18, 6, cw * 0.24, ch * 0.26, cw * 0.45);
    gTL.addColorStop(0, `rgba(228, 141, 145, ${(0.40 * fade).toFixed(3)})`);
    gTL.addColorStop(1, "rgba(248, 243, 233, 0)");
    ctx.fillStyle = gTL;
    ctx.fillRect(0, 0, cw * 0.5, ch * 0.5);

    ctx.fillStyle = `rgba(213, 185, 163, ${(0.20 * fade).toFixed(3)})`;
    ctx.fillRect(cw * 0.5, 0, cw * 0.5, ch * 0.5);

    ctx.fillStyle = `rgba(199, 204, 192, ${(0.28 * fade).toFixed(3)})`;
    ctx.fillRect(0, ch * 0.5, cw * 0.5, ch * 0.5);

    const gBR = ctx.createRadialGradient(cw * 0.86, ch * 0.82, 6, cw * 0.76, ch * 0.74, cw * 0.45);
    gBR.addColorStop(0, `rgba(228, 141, 145, ${(0.34 * fade).toFixed(3)})`);
    gBR.addColorStop(1, "rgba(248, 243, 233, 0)");
    ctx.fillStyle = gBR;
    ctx.fillRect(cw * 0.5, ch * 0.5, cw * 0.5, ch * 0.5);

    // Uniform 4-column newspaper gray text slugs (homogeneous baseline)
    const pad = Math.min(20, cw * 0.055);
    const innerW = cw - pad * 2;
    const cols = 4;
    const colGap = 10;
    const colW = (innerW - colGap * (cols - 1)) / cols;

    ctx.fillStyle = "rgba(85, 80, 73, 0.22)";
    for (let c = 0; c < cols; c++) {
      const x = pad + c * (colW + colGap);
      for (let y = pad + 10; y < ch - pad - 8; y += 10) {
        const lineW = (y % 30 === 0) ? colW * 0.72 : colW;
        ctx.fillRect(x, y, lineW, 3.6);
      }
    }

    // Quadrant dashed crosshairs
    ctx.save();
    ctx.strokeStyle = "#C4BAAE";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(cw * 0.5, pad);
    ctx.lineTo(cw * 0.5, ch - pad);
    ctx.moveTo(pad, ch * 0.5);
    ctx.lineTo(cw - pad, ch * 0.5);
    ctx.stroke();
    ctx.restore();

    const [axf, ayf] = ANCHOR_COORDS[anchor];
    const ax = cw * axf;
    const ay = ch * ayf;

    // Dominant high-contrast graphic block (woodcut poster card) growing with k
    if (k > 0.02) {
      const bw = cw * (0.14 + 0.28 * k);
      const bh = ch * (0.16 + 0.26 * k);
      const bx = Math.max(pad + 6, Math.min(cw - pad - bw - 6, ax - bw * 0.5));
      const by = Math.max(pad + 6, Math.min(ch - pad - bh - 6, ay - bh * 0.5));

      ctx.save();
      ctx.fillStyle = `rgba(34, 48, 35, ${(0.25 + 0.72 * k).toFixed(3)})`;
      ctx.fillRect(bx, by, bw, bh);

      ctx.fillStyle = `rgba(185, 65, 76, ${(0.35 + 0.62 * k).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(bx + bw * 0.38, by + bh * 0.45, Math.min(bw, bh) * 0.24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(248, 243, 233, ${(0.4 + 0.55 * k).toFixed(3)})`;
      ctx.fillRect(bx + bw * 0.12, by + bh * 0.76, bw * 0.64, Math.max(4, bh * 0.08));

      ctx.strokeStyle = "#B9414C";
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.restore();
    }

    // Ghost baseline diagonal (original gravity reference)
    const sx = cw * 0.12;
    const sy = ch * 0.16;
    const ex = cw * 0.88;
    const ey = ch * 0.84;

    if (k > 0.15) {
      ctx.save();
      ctx.strokeStyle = "rgba(133, 81, 45, 0.38)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.restore();
    }

    // Active reading path: bends from smooth TL->BR diagonal into the dominant visual block!
    const pull = Math.min(1, Math.max(0, (k - 0.12) / 0.65));
    const entryX = sx + (ax - sx) * (pull * 0.92);
    const entryY = sy + (ay - sy) * (pull * 0.92);
    const cpX = cw * 0.5 + (ax - cw * 0.5) * pull * 0.7;
    const cpY = ch * 0.5 + (ay - ch * 0.5) * pull * 0.7;

    ctx.save();
    ctx.strokeStyle = pull > 0.55 ? "#B9414C" : "#435E45";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(entryX, entryY);
    if (pull > 0.2) {
      ctx.quadraticCurveTo(cpX, cpY, ex, ey);
    } else {
      ctx.lineTo(ex, ey);
    }
    ctx.stroke();

    // First-eye entry marker
    ctx.beginPath();
    ctx.arc(entryX, entryY, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#F8F3E9";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#B9414C";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(entryX, entryY, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#B9414C";
    ctx.fill();

    // Terminal dot
    ctx.beginPath();
    ctx.arc(ex, ey, 8.5, 0, Math.PI * 2);
    ctx.fillStyle = "#F8F3E9";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#435E45";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex, ey, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = "#435E45";
    ctx.fill();

    // Entry label pill
    const lbl = pull >= 0.65 ? "第一眼被主图截走" : pull >= 0.25 ? "入口正在偏移" : "第一眼：左上起点";
    ctx.font = '700 11.5px "Noto Serif SC", serif';
    const tw = ctx.measureText(lbl).width + 16;
    const lx = Math.max(8, Math.min(cw - tw - 8, entryX - tw * 0.5));
    const ly = entryY > ch * 0.5 ? entryY - 34 : entryY + 16;
    ctx.fillStyle = pull >= 0.65 ? "#B9414C" : "#435E45";
    ctx.fillRect(lx, ly, tw, 22);
    ctx.fillStyle = "#FAF6EE";
    ctx.textBaseline = "middle";
    ctx.fillText(lbl, lx + 8, ly + 11);
    ctx.restore();
  }

  const ovLoop = loop(canvas, drawFrame);
  new ResizeObserver(() => {
    resize();
    ovLoop.draw();
  }).observe(canvas);

  syncUI();
}

// ==================== SECTION 03: HISTORY TIMELINE ====================
function initSection03() {
  const nodes = [...document.querySelectorAll("[data-tl]")];
  const prevBtn = document.getElementById("tl-prev");
  const nextBtn = document.getElementById("tl-next");
  const visualEl = document.getElementById("tl-visual");
  const yearBig = document.getElementById("tl-year-big");
  const placeEl = document.getElementById("tl-place");
  const titleEl = document.getElementById("tl-title");
  const textEl = document.getElementById("tl-text");
  const sourceEl = document.getElementById("tl-source");
  const stepEl = document.getElementById("tl-step");

  const SVGS = {
    gutenberg: `<svg viewBox="0 0 280 200"><rect x="20" y="14" width="240" height="172" rx="6" fill="#F8F3E9" stroke="#C4BAAE" stroke-width="1.5"/><rect x="38" y="32" width="94" height="136" fill="none" stroke="#85512D" stroke-dasharray="3 3"/><rect x="148" y="32" width="94" height="136" fill="none" stroke="#85512D" stroke-dasharray="3 3"/><g fill="#555049" opacity="0.55">${Array.from({ length: 12 }, (_, i) => `<rect x="44" y="${38 + i * 10.5}" width="82" height="4"/><rect x="154" y="${38 + i * 10.5}" width="82" height="4"/>`).join("")}</g><rect x="44" y="38" width="20" height="22" fill="#B9414C"/><text x="140" y="196" text-anchor="middle" fill="#555049" font-size="11">双栏 42 行 · 均匀活字版面</text></svg>`,
    arnold: `<svg viewBox="0 0 280 200"><rect x="20" y="14" width="240" height="172" rx="6" fill="#F8F3E9" stroke="#C4BAAE" stroke-width="1.5"/><line x1="140" y1="14" x2="140" y2="186" stroke="#C4BAAE" stroke-dasharray="4 4"/><line x1="20" y1="100" x2="260" y2="100" stroke="#C4BAAE" stroke-dasharray="4 4"/><path d="M52 44 C 115 80, 165 120, 226 156" fill="none" stroke="#B9414C" stroke-width="3"/><circle cx="52" cy="44" r="9" fill="#B9414C"/><circle cx="226" cy="156" r="9" fill="#435E45"/><text x="68" y="48" fill="#B9414C" font-size="12" font-weight="700">POA</text><text x="190" y="160" fill="#435E45" font-size="12" font-weight="700">TA</text></svg>`,
    poynter: `<svg viewBox="0 0 280 200"><rect x="20" y="14" width="240" height="172" rx="6" fill="#F8F3E9" stroke="#C4BAAE" stroke-width="1.5"/><rect x="128" y="36" width="112" height="76" rx="3" fill="#223023"/><circle cx="176" cy="74" r="18" fill="#B9414C"/><rect x="34" y="38" width="80" height="10" fill="#161816"/><rect x="34" y="56" width="76" height="5" fill="#85512D" opacity="0.5"/><rect x="34" y="68" width="70" height="5" fill="#85512D" opacity="0.5"/><circle cx="176" cy="74" r="28" fill="none" stroke="#EFB8B6" stroke-width="2" stroke-dasharray="4 3"/><path d="M176 74 Q 120 46, 74 44" fill="none" stroke="#B9414C" stroke-width="2.5"/></svg>`,
    lidwell: `<svg viewBox="0 0 280 200"><rect x="20" y="14" width="240" height="172" rx="6" fill="#F8F3E9" stroke="#C4BAAE" stroke-width="1.5"/><rect x="20" y="14" width="120" height="86" fill="#EFB8B6" opacity="0.42"/><rect x="140" y="14" width="120" height="86" fill="#D5B9A3" opacity="0.34"/><rect x="20" y="100" width="120" height="86" fill="#C7CCC0" opacity="0.46"/><rect x="140" y="100" width="120" height="86" fill="#EFB8B6" opacity="0.36"/><line x1="140" y1="14" x2="140" y2="186" stroke="#85512D" stroke-dasharray="4 4"/><line x1="20" y1="100" x2="260" y2="100" stroke="#85512D" stroke-dasharray="4 4"/><line x1="48" y1="40" x2="232" y2="160" stroke="#B9414C" stroke-width="2.5"/><text x="40" y="64" fill="#B9414C" font-size="11" font-weight="700">1 主光学区</text><text x="156" y="64" fill="#85512D" font-size="11" font-weight="600">2 强休耕区</text><text x="40" y="148" fill="#555049" font-size="11">3 弱休耕区</text><text x="156" y="148" fill="#B9414C" font-size="11" font-weight="700">4 终端区域</text></svg>`,
    nng: `<svg viewBox="0 0 280 200"><rect x="20" y="14" width="240" height="172" rx="6" fill="#F8F3E9" stroke="#C4BAAE" stroke-width="1.5"/><rect x="44" y="34" width="186" height="18" rx="9" fill="#B9414C" opacity="0.82"/><rect x="44" y="76" width="126" height="16" rx="8" fill="#B9414C" opacity="0.62"/><rect x="44" y="34" width="22" height="132" rx="11" fill="#B9414C" opacity="0.48"/><line x1="56" y1="44" x2="224" y2="158" stroke="#435E45" stroke-width="2" stroke-dasharray="5 4"/><text x="154" y="138" fill="#435E45" font-size="11" font-weight="700">F 形 ≠ 对角重力</text></svg>`,
  };

  let idx = 0;

  function render() {
    const item = TIMELINE[idx];
    nodes.forEach((n, i) => {
      const on = i === idx;
      n.classList.toggle("is-on", on);
      n.setAttribute("aria-selected", String(on));
    });
    visualEl.innerHTML = SVGS[item.visual];
    yearBig.textContent = item.year;
    placeEl.textContent = item.place;
    titleEl.textContent = item.title;
    textEl.textContent = item.text;
    sourceEl.textContent = item.source;
    stepEl.textContent = `${idx + 1} / ${TIMELINE.length}`;
  }

  nodes.forEach((n, i) => n.addEventListener("click", () => { idx = i; render(); }));
  prevBtn.addEventListener("click", () => { idx = (idx - 1 + TIMELINE.length) % TIMELINE.length; render(); });
  nextBtn.addEventListener("click", () => { idx = (idx + 1) % TIMELINE.length; render(); });

  render();
}

// ==================== SECTION 04: SCRIPT DIRECTION MIRROR (margin tracks clear of text!) ====================
function initSection04() {
  const btns = [...document.querySelectorAll("[data-dir]")].filter((el) => el.tagName === "BUTTON");
  const stage = document.getElementById("s4-stage");
  const modeTag = document.getElementById("s4-mode-tag");
  const badgeEl = document.getElementById("s4-infer-badge");
  const noteEl = document.getElementById("s4-note");
  const typeset = document.getElementById("s4-typeset");
  const overlay = document.getElementById("s4-overlay");

  function setDir(dir) {
    const info = SCRIPT_MODES[dir];
    stage.dataset.dir = dir;
    modeTag.textContent = info.modeTag;
    badgeEl.textContent = info.badge;
    noteEl.textContent = info.note;

    btns.forEach((b) => {
      const on = b.dataset.dir === dir;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-checked", String(on));
    });

    typeset.className = `s4-typeset mode-${dir}`;
    if (dir === "ltr") {
      typeset.innerHTML = `
        <p class="ts-head">铅字印页 · 自左向右横排</p>
        <p class="ts-p">视线从左上角第一字切入，自左向右扫过一行，换行回左并逐行沉降，最终自然停在右下角收尾。</p>
        <p class="ts-p">本册收编活字样本十二则，页尾附版次与索取回执。</p>
      `;
      overlay.innerHTML = `
        <line x1="210" y1="6" x2="210" y2="294" stroke="#C4BAAE" stroke-dasharray="4 4"/>
        <line x1="6" y1="150" x2="414" y2="150" stroke="#C4BAAE" stroke-dasharray="4 4"/>
        <!-- Diagonal passes cleanly BEHIND solid central type-area paper well, emerging at both corners -->
        <path d="M22 22 L398 278" fill="none" stroke="#B9414C" stroke-width="2.6" stroke-linecap="round"/>
        <!-- Top-margin horizontal reading-sweep arrow (completely outside text well!) -->
        <line x1="92" y1="22" x2="384" y2="22" stroke="#B9414C" stroke-width="2" stroke-linecap="round"/>
        <polyline points="376,16 386,22 376,28" fill="none" stroke="#B9414C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Right-margin downward progression tick -->
        <line x1="400" y1="42" x2="400" y2="254" stroke="#85512D" stroke-width="1.5" stroke-dasharray="4 4"/>
        <polyline points="395,247 400,256 405,247" fill="none" stroke="#85512D" stroke-width="1.6"/>
        <!-- Corner bullseyes & pills -->
        <circle cx="22" cy="22" r="9.5" fill="#F8F3E9" stroke="#B9414C" stroke-width="2"/>
        <circle cx="22" cy="22" r="5" fill="#B9414C"/>
        <rect x="38" y="11" width="44" height="22" rx="4" fill="#B9414C"/><text x="60" y="26" text-anchor="middle" fill="#FAF6EE" font-size="11.5" font-weight="700">起点</text>
        <circle cx="398" cy="278" r="9.5" fill="#F8F3E9" stroke="#435E45" stroke-width="2"/>
        <circle cx="398" cy="278" r="5" fill="#435E45"/>
        <rect x="338" y="267" width="44" height="22" rx="4" fill="#435E45"/><text x="360" y="282" text-anchor="middle" fill="#FAF6EE" font-size="11.5" font-weight="700">终点</text>
      `;
    } else if (dir === "rtl") {
      typeset.innerHTML = `
        <p class="ts-head">← 右起横排书页（推论示意）</p>
        <div class="rtl-bars" aria-hidden="true">
          <span class="rtl-bar" style="width:86%"></span>
          <span class="rtl-bar" style="width:94%"></span>
          <span class="rtl-bar" style="width:72%"></span>
          <span class="rtl-bar" style="width:88%"></span>
          <span class="rtl-bar" style="width:64%"></span>
        </div>
        <p class="ts-p">如阿拉伯文、希伯来文均自右向左起行；按方向习惯推论，起点移至右上，终端落到左下。</p>
      `;
      overlay.innerHTML = `
        <line x1="210" y1="6" x2="210" y2="294" stroke="#C4BAAE" stroke-dasharray="4 4"/>
        <line x1="6" y1="150" x2="414" y2="150" stroke="#C4BAAE" stroke-dasharray="4 4"/>
        <!-- Mirrored diagonal masked cleanly behind solid type-area well -->
        <path d="M398 22 L22 278" fill="none" stroke="#B9414C" stroke-width="2.6" stroke-dasharray="6 4"/>
        <!-- Top-margin leftward sweep arrow (clear of text!) -->
        <line x1="328" y1="22" x2="36" y2="22" stroke="#B9414C" stroke-width="2" stroke-linecap="round"/>
        <polyline points="44,16 34,22 44,28" fill="none" stroke="#B9414C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Left-margin downward progression tick -->
        <line x1="20" y1="42" x2="20" y2="254" stroke="#85512D" stroke-width="1.5" stroke-dasharray="4 4"/>
        <polyline points="15,247 20,256 25,247" fill="none" stroke="#85512D" stroke-width="1.6"/>
        <circle cx="398" cy="22" r="9.5" fill="#F8F3E9" stroke="#B9414C" stroke-width="2"/>
        <circle cx="398" cy="22" r="5" fill="#B9414C"/>
        <rect x="338" y="11" width="44" height="22" rx="4" fill="#B9414C"/><text x="360" y="26" text-anchor="middle" fill="#FAF6EE" font-size="11.5" font-weight="700">起点</text>
        <circle cx="22" cy="278" r="9.5" fill="#F8F3E9" stroke="#435E45" stroke-width="2"/>
        <circle cx="22" cy="278" r="5" fill="#435E45"/>
        <rect x="38" y="267" width="44" height="22" rx="4" fill="#435E45"/><text x="60" y="282" text-anchor="middle" fill="#FAF6EE" font-size="11.5" font-weight="700">终点</text>
      `;
    } else {
      typeset.innerHTML = `
        <p class="ts-head">古籍竖排（推论示意）</p>
        <p class="ts-p">自右上起首直行下读，行尽向左换列。</p>
        <p class="ts-p">视线随列序由右而左移行，终至左下尾款落印。</p>
        <p class="ts-p">故传统题签与落款多置左下。</p>
      `;
      overlay.innerHTML = `
        <line x1="210" y1="6" x2="210" y2="294" stroke="#C4BAAE" stroke-dasharray="4 4"/>
        <line x1="6" y1="150" x2="414" y2="150" stroke="#C4BAAE" stroke-dasharray="4 4"/>
        <!-- Mirrored diagonal masked cleanly behind solid vertical type-area well -->
        <path d="M398 22 L22 278" fill="none" stroke="#B9414C" stroke-width="2.6" stroke-dasharray="6 4"/>
        <!-- Right-margin downward vertical reading arrow (first column!) -->
        <line x1="398" y1="38" x2="398" y2="258" stroke="#B9414C" stroke-width="2" stroke-linecap="round"/>
        <polyline points="392,250 398,260 404,250" fill="none" stroke="#B9414C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Top-margin leftward column-shift arrow -->
        <line x1="328" y1="22" x2="36" y2="22" stroke="#85512D" stroke-width="1.7" stroke-dasharray="5 4"/>
        <polyline points="44,16 34,22 44,28" fill="none" stroke="#85512D" stroke-width="1.8"/>
        <!-- Left-margin downward final column into bottom-left terminal -->
        <line x1="22" y1="38" x2="22" y2="256" stroke="#435E45" stroke-width="2" stroke-linecap="round"/>
        <polyline points="16,248 22,258 28,248" fill="none" stroke="#435E45" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="398" cy="22" r="9.5" fill="#F8F3E9" stroke="#B9414C" stroke-width="2"/>
        <circle cx="398" cy="22" r="5" fill="#B9414C"/>
        <rect x="338" y="11" width="44" height="22" rx="4" fill="#B9414C"/><text x="360" y="26" text-anchor="middle" fill="#FAF6EE" font-size="11.5" font-weight="700">起点</text>
        <circle cx="22" cy="278" r="9.5" fill="#F8F3E9" stroke="#435E45" stroke-width="2"/>
        <circle cx="22" cy="278" r="5" fill="#435E45"/>
        <rect x="38" y="267" width="44" height="22" rx="4" fill="#435E45"/><text x="60" y="282" text-anchor="middle" fill="#FAF6EE" font-size="11.5" font-weight="700">终点</text>
      `;
    }
  }

  btns.forEach((b) => b.addEventListener("click", () => setDir(b.dataset.dir)));
  setDir("ltr");
}

// ==================== SECTION 05: APPLICATION UI LABS ====================
function initSection05() {
  const COPY = {
    dialog: {
      good: "顺重力：眼睛从左上标题读过说明，自然停在右下「确认导出」，不用折返。",
      bad: "反重力：主按钮被塞进左下弱休耕区，读完说明后视线还要往回找，容易误点右侧的取消。",
      tryGood: "已按「确认导出」——正好顺着从左上到右下的读完惯性一次落手。",
      tryBad: "在左下角点到了「确认导出」——目光刚滑向右下方又不得不折回左角。",
    },
    editorial: {
      good: "顺重力：主标稳住左上起点，读完正文后右下顺手接「读下一篇」。",
      bad: "反重力：标题掉到左下，还没读文右上角就伸出「读下一篇」，阅读顺序全乱。",
      tryGood: "已按「读下一篇」——读完正文正好落在右下终点，承接最顺。",
      tryBad: "在右上角点到了「读下一篇」——文章还没看清就被过早推离本页。",
    },
    slip: {
      good: "顺重力：先认清活动主题与时间，须知让给左下，终点右下落手「登记席位」。",
      bad: "反重力：左上先撞见注意事项小字，主体讲座名被挤到右侧，读完后行动入口偏在左缘。",
      tryGood: "已按「登记席位」——核对完讲座信息后，在右下角自然完成登记。",
      tryBad: "在反重力排法里点了「登记席位」——先被迫扫了一遍免责须知才找到正题。",
    },
  };

  document.querySelectorAll("[data-flip]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.flip;
      const card = btn.closest(".lab-card");
      const nextBad = card.dataset.mode === "good";
      card.dataset.mode = nextBad ? "bad" : "good";
      btn.setAttribute("aria-pressed", String(nextBad));
      btn.textContent = nextBad ? "恢复顺重力" : "切为反重力";
      document.getElementById(`fb-${key}`).textContent = COPY[key][nextBad ? "bad" : "good"];
    });
  });

  document.querySelectorAll("[data-try]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [key, kind] = btn.dataset.try.split("-");
      const card = btn.closest(".lab-card");
      const fb = document.getElementById(`fb-${key}`);
      if (kind === "sec") {
        fb.textContent = card.dataset.mode === "good"
          ? "点到的是次要的「取消」，它退在主按钮左侧，避免和终端主动作抢手。"
          : "反重力排法下「取消」占住了右下终端位置，顺手一点最容易误取消。";
      } else {
        fb.textContent = COPY[key][card.dataset.mode === "good" ? "tryGood" : "tryBad"];
      }
    });
  });
}

// ==================== SECTION 06: PITFALL EXPANDABLE CARDS ====================
function initSection06() {
  document.querySelectorAll(".pit-trigger").forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      const body = document.getElementById(btn.getAttribute("aria-controls"));
      btn.setAttribute("aria-expanded", String(!expanded));
      body.hidden = expanded;
      btn.querySelector(".pit-tag").textContent = expanded ? "点开排雷" : "收起诊断";
    });
  });
}

// ==================== SECTION 07: SINGLE-VARIABLE VERTICAL-RL PRACTICE QUIZ ====================
function initSection07() {
  const grid = document.getElementById("quiz-grid");
  const cards = [...grid.querySelectorAll(".quiz-card")];
  const vTitle = document.getElementById("qv-title");
  const vBody = document.getElementById("qv-body");

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const opt = card.dataset.opt;
      const fb = QUIZ_FEEDBACK[opt];
      grid.classList.add("is-revealed");
      cards.forEach((c) => {
        const key = c.dataset.opt;
        const isCorrect = key === QUIZ_CORRECT;
        const isPicked = c === card;
        c.setAttribute("aria-pressed", String(isPicked));
        c.classList.toggle("is-picked", isPicked);
        c.classList.toggle("is-correct", isCorrect);
        c.classList.toggle("is-wrong", !isCorrect && isPicked);
        c.querySelector(".qc-flag").textContent = QUIZ_FEEDBACK[key].flag;
      });
      vTitle.textContent = fb.title;
      vBody.textContent = fb.body;
    });
  });
}

// ==================== SECTION 08: POSTER LIGHTBOX ====================
function initLightbox() {
  const openBtn = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const box = document.getElementById("lightbox");
  const stage = document.getElementById("lb-stage");
  const lbImg = document.getElementById("lb-img");
  const zoomBtn = document.getElementById("lb-zoom");
  const closeBtn = document.getElementById("lb-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomBtn.textContent = scale > 1.1 ? "还原 1×" : "放大 1.8×";
  }

  function open() {
    lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    box.hidden = false;
    closeBtn.focus();
  }

  function close() {
    box.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  zoomBtn.addEventListener("click", () => {
    scale = scale > 1.1 ? 1 : 1.8;
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  });

  stage.addEventListener("click", (e) => {
    if (e.target === stage) close();
  });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(1, Math.min(3, scale + (e.deltaY < 0 ? 0.25 : -0.25)));
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    if (e.target !== lbImg) return;
    pan = { id: e.pointerId, sx: e.clientX - tx, sy: e.clientY - ty };
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!pan || e.pointerId !== pan.id) return;
    tx = e.clientX - pan.sx;
    ty = e.clientY - pan.sy;
    applyTransform();
  });
  stage.addEventListener("pointerup", () => { pan = null; });
  stage.addEventListener("pointercancel", () => { pan = null; });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });
}

// ==================== BOOT ====================
initHero();
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initSection07();
initLightbox();

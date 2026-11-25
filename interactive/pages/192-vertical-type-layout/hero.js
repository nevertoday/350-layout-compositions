// 192 开场主角玩具：宣纸立卷排字台（2D Canvas + 卷轴拉尺 data-perf-drag）
// 渲染完全读取 model.js 的 analyzeScroll，保证画布几何、标尺、读数 100% 同源。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  HERO_BOUNDS,
  HERO_INITIAL,
  PALETTE,
  analyzeScroll,
  clampHeroState,
} from "./model.js";

const easeOutCubic = (x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);

export function mountHero() {
  const stageEl = document.getElementById("hero-stage");
  const canvas = document.getElementById("scroll-canvas");
  const rollerTrack = document.getElementById("roller-track");
  const rollerThumb = document.getElementById("roller-thumb");
  const rollerVal = document.getElementById("roller-val");
  if (!stageEl || !canvas || !rollerTrack || !rollerThumb) return null;

  const ctx = canvas.getContext("2d");

  // 控件引用
  const els = {
    sealCount: document.getElementById("hero-seal-count"),
    sealStatus: document.getElementById("hero-seal-status"),
    diagTag: document.getElementById("diag-tag"),
    diagHead: document.getElementById("diag-head"),
    diagDetail: document.getElementById("diag-detail"),
    diagAction: document.getElementById("diag-action"),
    diagCard: document.getElementById("diag-card"),
    mLeading: document.getElementById("m-leading"),
    mTracking: document.getElementById("m-tracking"),
    mRatio: document.getElementById("m-ratio"),
    mColChars: document.getElementById("m-colchars"),
    cDir: document.getElementById("chk-dir"),
    cRhythm: document.getElementById("chk-rhythm"),
    cLen: document.getElementById("chk-len"),
    cPunct: document.getElementById("chk-punct"),
    rTrack: document.getElementById("ctrl-tracking"),
    rTrackOut: document.getElementById("out-tracking"),
    rCol: document.getElementById("ctrl-collimit"),
    rColOut: document.getElementById("out-collimit"),
    btnGuides: document.getElementById("btn-guides"),
    btnReset: document.getElementById("btn-reset"),
    dirBtns: [...document.querySelectorAll("[data-dir]")],
    punctBtns: [...document.querySelectorAll("[data-punct]")],
    specBtns: [...document.querySelectorAll("[data-specimen]")],
  };

  let state = clampHeroState(HERO_INITIAL);
  let analysis = analyzeScroll(state);
  let introProgress = reducedMotion.matches ? 1 : 0;
  let dirty = true;
  let cssW = 760;
  let cssH = 480;
  let hoverDrag = false;
  let lastLayout = null; // 供画布指针点击/拖拽感知文字区域

  function syncUI() {
    analysis = analyzeScroll(state);
    const a = analysis;

    // 卷轴拉尺位置 (leading: min..max -> 0..100%)
    const frac =
      (state.leading - HERO_BOUNDS.leading.min) /
      (HERO_BOUNDS.leading.max - HERO_BOUNDS.leading.min);
    rollerThumb.style.left = `${(frac * 100).toFixed(2)}%`;
    rollerThumb.setAttribute("aria-valuenow", state.leading.toFixed(2));
    rollerThumb.setAttribute(
      "aria-valuetext",
      `行距 ${state.leading.toFixed(2)} 倍字号，${a.checks.rhythm.value}`
    );
    rollerThumb.dataset.state = a.checks.rhythm.ok ? "ok" : "err";
    if (rollerVal) {
      rollerVal.textContent = `${state.leading.toFixed(2)}×（净空 ${a.colGapEm.toFixed(2)}em）`;
    }

    // 滑杆
    if (els.rTrack) {
      els.rTrack.value = String(Math.round(state.tracking * 100));
      if (els.rTrackOut) els.rTrackOut.textContent = `+${state.tracking.toFixed(2)}em`;
    }
    if (els.rCol) {
      els.rCol.value = String(state.colLimit);
      if (els.rColOut) els.rColOut.textContent = `${state.colLimit} 字`;
    }

    // 按钮组状态
    els.dirBtns.forEach((b) => {
      const on = b.dataset.dir === state.direction;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-on", on);
    });
    els.punctBtns.forEach((b) => {
      const want = b.dataset.punct === "vert";
      const on = state.verticalPunct === want;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-on", on);
    });
    els.specBtns.forEach((b) => {
      const on = b.dataset.specimen === state.specimen;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-on", on);
    });
    if (els.btnGuides) {
      els.btnGuides.setAttribute("aria-pressed", String(state.guides));
      els.btnGuides.classList.toggle("is-on", state.guides);
      els.btnGuides.textContent = state.guides ? "网格视线：开" : "网格视线：关";
    }

    // 右上朱印状态
    if (els.sealCount) els.sealCount.textContent = `${a.passCount} / 4`;
    if (els.sealStatus) {
      els.sealStatus.textContent = a.passCount === 4 ? "立卷已成" : "待校错版";
      els.sealStatus.dataset.ok = String(a.passCount === 4);
    }

    // 四项体检行
    const mapCheck = (el, item) => {
      if (!el) return;
      el.dataset.ok = String(item.ok);
      const val = el.querySelector(".chk-v");
      if (val) val.textContent = item.value;
    };
    mapCheck(els.cDir, a.checks.dir);
    mapCheck(els.cRhythm, a.checks.rhythm);
    mapCheck(els.cLen, a.checks.len);
    mapCheck(els.cPunct, a.checks.punct);

    // 核心诊断签
    if (els.diagCard) els.diagCard.dataset.severity = a.severity;
    if (els.diagTag) els.diagTag.textContent = a.tag;
    if (els.diagHead) els.diagHead.textContent = a.headline;
    if (els.diagDetail) els.diagDetail.textContent = a.detail;
    if (els.diagAction) els.diagAction.textContent = a.action;

    // 精确几何读数
    if (els.mLeading) els.mLeading.textContent = `${a.colGapEm.toFixed(2)}em`;
    if (els.mTracking) els.mTracking.textContent = `${a.charGapEm.toFixed(2)}em`;
    if (els.mRatio) els.mRatio.textContent = `${a.gapRatio.toFixed(1)}×`;
    if (els.mColChars) els.mColChars.textContent = `${a.maxColChars} 字`;

    dirty = true;
    if (runner) runner.draw();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(240, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (w !== cssW || h !== cssH || canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      cssW = w;
      cssH = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dirty = true;
    }
  }

  // 画布主绘制函数：完全按等比坐标绘制原海报深松绿半圆、赭金圆月、阅读起点、竖排诗阵、乌丝栏、朱印与格式塔串行桥
  function drawFrame(t, dt, { still }) {
    resize();
    if (still) {
      introProgress = 1;
    } else if (introProgress < 1) {
      introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 1.15);
      dirty = true;
    }
    if (!dirty && introProgress >= 1) return;
    dirty = false;

    const dpr = canvas.width / cssW;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = cssW;
    const H = cssH;
    const ease = easeOutCubic(introProgress);
    const a = analysis;
    const st = a.state;
    const compact = W < 460;
    const flatLand = H < 270;

    // 1. 内卷宣纸底面 + 细微纸边框
    ctx.fillStyle = PALETTE.scroll;
    ctx.fillRect(0, 0, W, H);

    // 极克制的竖向纸帘纤维纹理（轻描几条淡竖线，增添宣纸手卷气韵）
    ctx.strokeStyle = "rgba(155, 140, 118, 0.09)";
    ctx.lineWidth = 1;
    const grainStep = Math.max(26, Math.round(W / 24));
    ctx.beginPath();
    for (let x = grainStep; x < W; x += grainStep) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
    }
    ctx.stroke();

    // 2. 忠实承袭 192 原海报左侧的深松绿半圆 + 赭金圆月（严格正圆，绝不拉成椭圆）
    const minDim = Math.min(W, H);
    const tealR = minDim * (compact ? 0.34 : flatLand ? 0.37 : 0.4);
    const tealCx = -tealR * 0.28;
    const tealCy = H * 0.49;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();

    // 随开场从左缓入
    const arcShift = (1 - ease) * -22;
    ctx.fillStyle = PALETTE.teal;
    ctx.beginPath();
    ctx.arc(tealCx + arcShift, tealCy, tealR, 0, Math.PI * 2);
    ctx.fill();

    // 赭金圆月（压在深松绿大圆左下边缘，同原海报比例）
    const goldR = tealR * 0.36;
    const goldCx = tealCx + tealR * 0.42 + arcShift * 0.6;
    const goldCy = tealCy + tealR * 0.68;
    ctx.fillStyle = PALETTE.ochre;
    ctx.beginPath();
    ctx.arc(goldCx, goldCy, goldR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. 竖排字阵排布几何计算（与 model.js 完全一致的 em 比例）
    const padTop = flatLand ? 32 : compact ? 52 : 66;
    const padBottom = flatLand ? 30 : compact ? 46 : 58;
    const padRight = compact ? 20 : flatLand ? 24 : 48;
    const availH = Math.max(110, H - padTop - padBottom);
    // 文字安全左边界（给左侧图形留呼吸区）
    const motifRight = Math.max(compact ? W * 0.25 : W * 0.26, tealCx + tealR * 0.96);
    const textZoneLeft = compact ? Math.max(36, W * 0.14) : Math.max(82, motifRight + 22);
    const textZoneRight = W - padRight;
    const textZoneW = Math.max(160, textZoneRight - textZoneLeft);

    // 动态求字号：按画布高宽等比自适应，2560 舒展大方，844×390 横屏紧凑不叠底沿
    const cols = a.cols;
    const nBody = cols.length;
    const titleChars = [...a.spec.title];

    const maxCellsInCol = Math.max(st.colLimit, ...cols.map((c) => c.length));
    const cellPitchEm = 1 + st.tracking;
    const hNeededEm = Math.max(6, maxCellsInCol) * cellPitchEm;
    const fsCap = flatLand ? 14 : compact ? 18 : Math.min(28, Math.max(21, H * 0.048));
    const fsFloor = flatLand ? 7.6 : compact ? 10.5 : 12.5;
    let bodyFs = Math.min(fsCap, availH / Math.max(8.5, hNeededEm * 0.98));

    const titleColSpaceEm = 2.05;
    const totalWEm = titleColSpaceEm + Math.max(1, nBody) * st.leading + 0.8;
    const maxFsByW = textZoneW / Math.max(4, totalWEm);
    bodyFs = Math.max(fsFloor, Math.min(bodyFs, maxFsByW));

    const titleFsMax = flatLand ? 16 : compact ? 25 : Math.min(42, H * 0.072);
    const titleFs = Math.min(
      titleFsMax,
      Math.max(bodyFs * 1.44, flatLand ? 12.5 : compact ? 18 : 24),
      availH / Math.max(8.6, titleChars.length * 1.12)
    );
    const colPitchPx = bodyFs * st.leading;
    const rowPitchPx = bodyFs * (1 + st.tracking);

    // 决定每列 X 坐标：rl 从右向左靠右舒展，lr 从左向右（错态）居中略偏左
    const titleGapPx = Math.max(colPitchPx * 1.24, titleFs * 1.42);
    const isRL = st.direction === "rl";

    const groupW = titleGapPx + Math.max(0, nBody - 1) * colPitchPx + bodyFs;
    const midCenter = textZoneLeft + textZoneW * (isRL ? 0.56 : 0.44);
    const clampedLeft = Math.max(textZoneLeft + titleFs * 0.55, Math.min(textZoneRight - groupW, midCenter - groupW * 0.5));
    const clampedRight = Math.min(textZoneRight - titleFs * 0.55, Math.max(textZoneLeft + groupW, midCenter + groupW * 0.5));

    const titleX = isRL ? clampedRight : clampedLeft;
    const colXs = cols.map((_, i) =>
      isRL
        ? titleX - titleGapPx - i * colPitchPx
        : titleX + titleGapPx + i * colPitchPx
    );

    const topY = padTop + bodyFs * 0.6;
    const bodyBottomY = topY + Math.max(4, maxCellsInCol - 1) * rowPitchPx + bodyFs * 0.6;
    const clampedBottomY = Math.min(H - padBottom + 4, Math.max(topY + 90, bodyBottomY));

    lastLayout = { titleX, colXs, topY, clampedBottomY, bodyFs, colPitchPx, isRL };

    // 4. 乌丝栏竖虚线网格（原海报经典视觉母题）
    if (st.guides) {
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = a.checks.rhythm.ok
        ? "rgba(30, 95, 87, 0.36)"
        : "rgba(169, 57, 49, 0.36)";
      const railTop = padTop - (flatLand ? 8 : 12);
      const railBot = H - padBottom + (flatLand ? 4 : 10);

      const halfPitch = colPitchPx * 0.5;
      const seenX = new Set();
      colXs.forEach((cx) => {
        for (const bx of [cx - halfPitch, cx + halfPitch]) {
          const rx = Math.round(bx);
          if ([...seenX].some((p) => Math.abs(p - rx) < 4)) continue;
          seenX.add(rx);
          if (rx > 12 && rx < W - 8) {
            ctx.beginPath();
            ctx.moveTo(rx + 0.5, railTop);
            ctx.lineTo(rx + 0.5, railBot);
            ctx.stroke();
          }
        }
      });
      ctx.restore();
    }

    // 5. 原海报「阅读起点」细竖线（带两端圆点）—— 紧贴主标外侧，绝不和列号重叠
    const startLineX = isRL
      ? Math.min(W - 14, titleX + titleFs * 0.72)
      : Math.max(16, titleX - titleFs * 0.72);
    const startTop = padTop - (flatLand ? 6 : 10);
    const startBot = Math.min(H - padBottom + 2, topY + titleChars.length * titleFs * 1.12);
    ctx.save();
    ctx.strokeStyle = isRL ? PALETTE.ink : PALETTE.seal;
    ctx.fillStyle = isRL ? PALETTE.ink : PALETTE.seal;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(startLineX, startTop);
    ctx.lineTo(startLineX, startTop + (startBot - startTop) * ease);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(startLineX, startTop, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(startLineX, startTop + (startBot - startTop) * ease, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // 起点标签摆在起点竖线的外侧或正上方，与正文列编号完全错开
    ctx.font = `600 ${flatLand ? 9.5 : compact ? 10.5 : 11.5}px "Noto Serif SC", serif`;
    ctx.textBaseline = "bottom";
    const startLabel = isRL ? "阅读起点 ↓" : "错·左起 ↓";
    if (isRL) {
      ctx.textAlign = "right";
      ctx.fillText(startLabel, Math.min(W - 10, startLineX + 6), startTop - 6);
    } else {
      ctx.textAlign = "right";
      const lx = Math.max(66, startLineX - 6);
      ctx.fillText(startLabel, lx, startTop + 14);
    }
    ctx.restore();

    // 6. 横向串行格式塔警告桥接（当列间净空 <= 上下字缝时点亮，警示签置在侧旁绝不撞顶标）
    if (st.guides && a.isCrossReading && colXs.length >= 2) {
      ctx.save();
      const rowsToShow = Math.min(flatLand ? 3 : 5, cols[0].length, cols[1].length);
      for (let r = 0; r < rowsToShow; r++) {
        const y = topY + r * rowPitchPx;
        if (y > H - padBottom - 8) break;
        const x1 = colXs[0];
        const x2 = colXs[1];
        const midL = Math.min(x1, x2) + bodyFs * 0.36;
        const midR = Math.max(x1, x2) - bodyFs * 0.36;
        ctx.fillStyle = "rgba(169, 57, 49, 0.15)";
        ctx.fillRect(
          Math.min(x1, x2) - bodyFs * 0.5,
          y - bodyFs * 0.5,
          Math.abs(x2 - x1) + bodyFs,
          bodyFs
        );
        ctx.strokeStyle = PALETTE.seal;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(midL, y);
        ctx.lineTo(midR, y);
        ctx.stroke();
      }
      // 侧旁引出「↔ 横向串行」签，与顶沿数字 01 02 03 彻底分离
      const outerRight = Math.max(...colXs) + bodyFs * 0.72;
      const bw = flatLand ? 68 : 82;
      const bh = flatLand ? 17 : 20;
      const putRight = outerRight + bw + 14 < W;
      const bx = putRight ? outerRight + 10 : Math.max(10, Math.min(...colXs) - bodyFs * 0.72 - bw - 10);
      const by = topY + rowPitchPx * (flatLand ? 0.6 : 1.1) - bh * 0.5;
      ctx.strokeStyle = PALETTE.seal;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(putRight ? outerRight - 2 : bx + bw, by + bh * 0.5);
      ctx.lineTo(putRight ? bx : Math.min(...colXs) - bodyFs * 0.5, by + bh * 0.5);
      ctx.stroke();
      ctx.fillStyle = PALETTE.seal;
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = PALETTE.paperLight;
      ctx.font = `600 ${flatLand ? 9.5 : 11}px "Noto Serif SC", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("↔ 横向串行", bx + bw * 0.5, by + bh * 0.5);
      ctx.restore();
    }

    // 7. 视线流箭头 01→02→03（干净置于正文列上方）
    if (st.guides && colXs.length >= 2) {
      ctx.save();
      const arrowY = padTop - (flatLand ? 10 : 16);
      ctx.strokeStyle = isRL ? PALETTE.teal : PALETTE.seal;
      ctx.fillStyle = isRL ? PALETTE.teal : PALETTE.seal;
      ctx.lineWidth = 1.2;
      const xStart = colXs[0];
      const xEnd = colXs[colXs.length - 1];
      if (Math.abs(xEnd - xStart) > 22) {
        ctx.beginPath();
        ctx.moveTo(xStart, arrowY);
        ctx.lineTo(xEnd, arrowY);
        ctx.stroke();
        const dirSign = xEnd < xStart ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(xEnd, arrowY);
        ctx.lineTo(xEnd - dirSign * 6, arrowY - 3);
        ctx.lineTo(xEnd - dirSign * 6, arrowY + 3);
        ctx.closePath();
        ctx.fill();
      }
      ctx.font = `500 ${flatLand ? 9 : compact ? 10 : 11}px "DM Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      colXs.forEach((cx, idx) => {
        if (idx < 6 && cx > 18 && cx < W - 18) {
          ctx.fillText(String(idx + 1).padStart(2, "0"), cx, arrowY - 3);
        }
      });
      ctx.restore();
    }

    // 8. 绘制主标题纵列（ZCOOL XiaoWei 窄长宋体；中点「·」以实心圆点绘制，字体零缺字）
    ctx.save();
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `400 ${titleFs}px "ZCOOL XiaoWei", "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const titleStep = titleFs * 1.1;
    const titleStartY = topY + titleFs * 0.18;
    titleChars.forEach((ch, idx) => {
      const charReveal = Math.max(0, Math.min(1, ease * 1.4 - idx * 0.05));
      if (charReveal <= 0.02) return;
      ctx.globalAlpha = charReveal;
      const y = titleStartY + idx * titleStep - (1 - charReveal) * 8;
      if (y > H - padBottom + 2) return;
      if (ch === "·") {
        ctx.beginPath();
        ctx.arc(titleX, y, Math.max(1.8, titleFs * 0.09), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillText(ch, titleX, y);
      }
    });
    ctx.restore();

    // 9. 绘制正文竖排字阵（逐字定位，完整呈现竖排标点右上移位、直排引号、纵中横 vs 侧躺数字、列首避头警示）
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let sealAnchor = { x: colXs[colXs.length - 1] || titleX, y: topY + bodyFs * 4 };

    cols.forEach((col, ci) => {
      const cx = colXs[ci];
      if (cx < 8 || cx > W - 8) return;
      const colReveal = Math.max(0, Math.min(1, ease * 1.5 - ci * 0.08));
      ctx.globalAlpha = colReveal;

      col.forEach((tok, ri) => {
        const y = topY + ri * rowPitchPx - (1 - colReveal) * 6;
        if (y > H - padBottom + 2) return;

        // 标注列首禁则错标点（红圈）
        if (ri === 0 && !st.verticalPunct && (tok.kind === "hpunct" || tok.rawChar === "”")) {
          ctx.save();
          ctx.strokeStyle = PALETTE.seal;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(cx, y, bodyFs * 0.58, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // 字底落在深松绿半圆上时自动提亮墨色，确保高对比度清晰可读
        const dxTeal = cx - tealCx;
        const dyTeal = y - tealCy;
        const onTeal = Math.hypot(dxTeal, dyTeal) < tealR - 2 && Math.hypot(cx - goldCx, y - goldCy) > goldR;
        const glyphColor = onTeal ? PALETTE.paperLight : PALETTE.ink;

        if (tok.kind === "tcy") {
          ctx.save();
          ctx.fillStyle = st.guides ? (onTeal ? PALETTE.ochreBright : PALETTE.teal) : glyphColor;
          ctx.font = `500 ${bodyFs * 0.72}px "DM Mono", "Noto Serif SC", monospace`;
          ctx.fillText(tok.text, cx, y + 0.5, bodyFs * 0.96);
          if (st.guides) {
            ctx.strokeStyle = onTeal ? "rgba(232,184,95,0.65)" : "rgba(30,95,87,0.45)";
            ctx.lineWidth = 1;
            ctx.strokeRect(cx - bodyFs * 0.48, y - bodyFs * 0.46, bodyFs * 0.96, bodyFs * 0.92);
          }
          ctx.restore();
        } else if (tok.kind === "sideways") {
          ctx.save();
          ctx.translate(cx, y);
          ctx.rotate(Math.PI / 2);
          ctx.fillStyle = st.guides ? (onTeal ? PALETTE.sealBright : PALETTE.seal) : glyphColor;
          ctx.font = `500 ${bodyFs * 0.88}px "DM Mono", monospace`;
          ctx.fillText(tok.text, 0, 0);
          ctx.restore();
        } else if (tok.kind === "vpunct") {
          ctx.save();
          ctx.fillStyle = glyphColor;
          ctx.font = `400 ${bodyFs}px "Noto Serif SC", serif`;
          ctx.fillText(tok.text, cx + bodyFs * 0.28, y - bodyFs * 0.24);
          ctx.restore();
        } else if (tok.kind === "hpunct") {
          ctx.save();
          ctx.fillStyle = st.guides ? (onTeal ? PALETTE.sealBright : PALETTE.seal) : glyphColor;
          ctx.font = `400 ${bodyFs}px "Noto Serif SC", serif`;
          ctx.fillText(tok.text, cx - bodyFs * 0.22, y + bodyFs * 0.22);
          ctx.restore();
        } else if (tok.kind === "vquote") {
          ctx.save();
          ctx.fillStyle = st.guides ? (onTeal ? PALETTE.ochreBright : PALETTE.teal) : glyphColor;
          ctx.font = `400 ${bodyFs}px "Noto Serif SC", serif`;
          ctx.fillText(tok.text, cx, y);
          ctx.restore();
        } else if (tok.kind === "hquote") {
          ctx.save();
          ctx.fillStyle = st.guides ? (onTeal ? PALETTE.sealBright : PALETTE.seal) : glyphColor;
          ctx.font = `400 ${bodyFs}px "Noto Serif SC", serif`;
          ctx.fillText(tok.text, cx, y);
          ctx.restore();
        } else {
          ctx.fillStyle = glyphColor;
          ctx.font = `400 ${bodyFs}px "Noto Serif SC", serif`;
          ctx.fillText(tok.text, cx, y);
        }

        if (ci === cols.length - 1) {
          sealAnchor = { x: cx, y: Math.min(H - padBottom - 8, y + rowPitchPx * 1.18) };
        }
      });
    });
    ctx.restore();

    // 10. 朱红方印（紧随末列落款，呼应原海报最末列下方朱印）
    const sealSize = flatLand ? 16 : Math.max(22, Math.min(34, bodyFs * 1.48));
    const sx = Math.max(16, Math.min(W - sealSize - 10, sealAnchor.x - sealSize * 0.5));
    const sy = Math.min(H - padBottom - sealSize + 4, sealAnchor.y - sealSize * 0.45);
    ctx.save();
    ctx.globalAlpha = ease;
    ctx.fillStyle = PALETTE.seal;
    ctx.fillRect(sx, sy, sealSize, sealSize);
    ctx.strokeStyle = PALETTE.paperLight;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 2.2, sy + 2.2, sealSize - 4.4, sealSize - 4.4);
    ctx.fillStyle = PALETTE.paperLight;
    ctx.font = `700 ${Math.max(7.5, sealSize * 0.34)}px "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const [s1, s2] = [...a.spec.seal];
    ctx.fillText(s1, sx + sealSize * 0.5, sy + sealSize * 0.34);
    ctx.fillText(s2, sx + sealSize * 0.5, sy + sealSize * 0.7);
    ctx.restore();

    // 11. 底沿「行距 Leading（横向列间）」与右侧「字距 Tracking（纵向字间）」实测标尺
    if (st.guides && colXs.length >= 2) {
      ctx.save();
      const calY = H - (flatLand ? 11 : 18);
      const xA = Math.min(colXs[0], colXs[1]);
      const xB = Math.max(colXs[0], colXs[1]);
      const calColor = a.checks.rhythm.ok ? PALETTE.teal : PALETTE.seal;
      ctx.strokeStyle = calColor;
      ctx.fillStyle = calColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(xA, calY);
      ctx.lineTo(xB, calY);
      ctx.moveTo(xA, calY - 3.5);
      ctx.lineTo(xA, calY + 3.5);
      ctx.moveTo(xB, calY - 3.5);
      ctx.lineTo(xB, calY + 3.5);
      ctx.stroke();

      ctx.font = `500 ${flatLand ? 9.5 : compact ? 10 : 11}px "DM Mono", "Noto Serif SC", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      const labelMid = Math.max(54, Math.min(W - 54, (xA + xB) * 0.5));
      ctx.fillText(`行距 ${st.leading.toFixed(2)}×`, labelMid, calY - 4);

      if (cols[0] && cols[0].length >= 2) {
        const vx = isRL ? colXs[0] + bodyFs * 0.62 : colXs[0] - bodyFs * 0.62;
        const y0 = topY + bodyFs * 0.44;
        const y1 = topY + rowPitchPx - bodyFs * 0.44;
        if (vx > 10 && vx < W - 10 && y1 > y0 + 1) {
          ctx.strokeStyle = PALETTE.ochreInk;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(vx, y0);
          ctx.lineTo(vx, y1);
          ctx.moveTo(vx - 3, y0);
          ctx.lineTo(vx + 3, y0);
          ctx.moveTo(vx - 3, y1);
          ctx.lineTo(vx + 3, y1);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 12. 卷面可拖拽轻提示（悬停或初始时微弱显示，不喧宾夺主）
    if (!compact && hoverDrag) {
      ctx.save();
      ctx.fillStyle = "rgba(22, 27, 25, 0.78)";
      ctx.fillRect(14, 14, 152, 24);
      ctx.fillStyle = PALETTE.paperLight;
      ctx.font = `500 11px "Noto Serif SC", serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("左右拖卷面：实调行距", 24, 26);
      ctx.restore();
    }

    ctx.restore();
  }

  const runner = loop(stageEl, drawFrame);

  // ---------- 交互绑定 ----------
  function setLeadingFromClientX(clientX) {
    const r = rollerTrack.getBoundingClientRect();
    if (!r.width) return;
    const t = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const val = HERO_BOUNDS.leading.min + t * (HERO_BOUNDS.leading.max - HERO_BOUNDS.leading.min);
    state = clampHeroState({ ...state, leading: val });
    syncUI();
  }

  // 1) 主拖拽柄（data-perf-drag）：同时支持 Pointer 与原生 Touch，保证 perf.mjs 触屏拖满帧率
  let trackDragging = false;
  rollerTrack.addEventListener("pointerdown", (e) => {
    trackDragging = true;
    rollerTrack.setPointerCapture?.(e.pointerId);
    setLeadingFromClientX(e.clientX);
  });
  rollerTrack.addEventListener("pointermove", (e) => {
    if (!trackDragging) return;
    setLeadingFromClientX(e.clientX);
  });
  const endTrackDrag = () => {
    trackDragging = false;
  };
  rollerTrack.addEventListener("pointerup", endTrackDrag);
  rollerTrack.addEventListener("pointercancel", endTrackDrag);

  // Touch 兜底（CDP dispatchTouchEvent 在某些移动端模拟中直接派发 touchstart/touchmove）
  rollerTrack.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      trackDragging = true;
      setLeadingFromClientX(e.touches[0].clientX);
    },
    { passive: true }
  );
  rollerTrack.addEventListener(
    "touchmove",
    (e) => {
      if (!trackDragging || !e.touches.length) return;
      e.preventDefault();
      setLeadingFromClientX(e.touches[0].clientX);
    },
    { passive: false }
  );
  rollerTrack.addEventListener("touchend", endTrackDrag, { passive: true });
  rollerTrack.addEventListener("touchcancel", endTrackDrag, { passive: true });

  // 2) 画布上直接左右拖动也能平滑调整行距（仅取横向，不拦竖向页面滚动！）
  let canvasDrag = null;
  canvas.addEventListener("pointerdown", (e) => {
    canvasDrag = { x0: e.clientX, y0: e.clientY, lead0: state.leading, locked: null };
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!canvasDrag) return;
    const dx = e.clientX - canvasDrag.x0;
    const dy = e.clientY - canvasDrag.y0;
    if (canvasDrag.locked === null && Math.hypot(dx, dy) > 6) {
      canvasDrag.locked = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
    }
    if (canvasDrag.locked === "h") {
      // 往左拉（从右向左展卷）或往右推都平滑映射，方向直觉：向右增宽行距，向左收紧
      const delta = (dx / Math.max(240, cssW * 0.72)) * (HERO_BOUNDS.leading.max - HERO_BOUNDS.leading.min);
      state = clampHeroState({ ...state, leading: canvasDrag.lead0 + delta });
      syncUI();
    }
  });
  const endCanvasDrag = () => {
    canvasDrag = null;
  };
  canvas.addEventListener("pointerup", endCanvasDrag);
  canvas.addEventListener("pointercancel", endCanvasDrag);
  canvas.addEventListener("pointerenter", () => {
    hoverDrag = true;
    dirty = true;
    runner.draw();
  });
  canvas.addEventListener("pointerleave", () => {
    hoverDrag = false;
    dirty = true;
    runner.draw();
  });

  // 3) 键盘操控卷轴拉柄（← / → 微调行距，Shift 加速）
  rollerThumb.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.12 : 0.04;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      state = clampHeroState({ ...state, leading: state.leading - step });
      syncUI();
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      state = clampHeroState({ ...state, leading: state.leading + step });
      syncUI();
    }
  });

  // 4) 其余原生控件
  els.rTrack?.addEventListener("input", (e) => {
    state = clampHeroState({ ...state, tracking: Number(e.target.value) / 100 });
    syncUI();
  });
  els.rCol?.addEventListener("input", (e) => {
    state = clampHeroState({ ...state, colLimit: Number(e.target.value) });
    syncUI();
  });
  els.dirBtns.forEach((b) =>
    b.addEventListener("click", () => {
      state = clampHeroState({ ...state, direction: b.dataset.dir });
      syncUI();
    })
  );
  els.punctBtns.forEach((b) =>
    b.addEventListener("click", () => {
      state = clampHeroState({ ...state, verticalPunct: b.dataset.punct === "vert" });
      syncUI();
    })
  );
  els.specBtns.forEach((b) =>
    b.addEventListener("click", () => {
      state = clampHeroState({ ...state, specimen: b.dataset.specimen });
      syncUI();
    })
  );
  els.btnGuides?.addEventListener("click", () => {
    state = clampHeroState({ ...state, guides: !state.guides });
    syncUI();
  });
  els.btnReset?.addEventListener("click", () => {
    state = clampHeroState(HERO_INITIAL);
    syncUI();
  });

  // 尺寸变化 & 字体加载就绪后重画
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      dirty = true;
      runner.draw();
    }).observe(canvas);
  }
  window.addEventListener("resize", () => {
    dirty = true;
    runner.draw();
  });
  document.fonts?.ready?.then(() => {
    dirty = true;
    runner.draw();
  });

  syncUI();
  return {
    redraw: () => {
      dirty = true;
      runner.draw();
    },
  };
}

// 01–08 节各自独立的交互模块（全部共用 model.js 扫描线引擎，相邻两节控件形态互不重复）

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  POSTER_BODY,
  RULES,
  SHAPES,
  layoutShapedText,
  traceShapePath,
} from "./model.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function fitCanvas(canvas) {
  const r = canvas.getBoundingClientRect();
  const w = Math.max(180, Math.round(r.width));
  const h = Math.max(160, Math.round(r.height));
  const dpr = pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  return { w, h, dpr };
}

// =========================================================================
// 01 节：可拖分界对比帘（左：矩形硬叠 vs 右：弦宽随形）
// =========================================================================
export function initSec01() {
  const stage = document.getElementById("curtain-stage");
  const canvas = document.getElementById("curtain-canvas");
  const handle = document.getElementById("curtain-handle");
  const pctEl = document.getElementById("curtain-pct");
  const sideEl = document.getElementById("cr-side");
  const textEl = document.getElementById("cr-text");
  if (!stage || !canvas || !handle) return;
  const ctx = canvas.getContext("2d");

  let split = 0.5;
  let dirty = true;

  // 同一段原海报正文，统一 21px 字号与 ry=180 水滴，仅改变排法
  const rectLayout = layoutShapedText({
    text: POSTER_BODY,
    shapeId: "teardrop",
    fontSize: 21,
    padPx: 12,
    mode: "rect",
    ry: 180,
  });
  const shapedLayout = layoutShapedText({
    text: POSTER_BODY,
    shapeId: "teardrop",
    fontSize: 21,
    padPx: 12,
    mode: "shaped",
    ry: 180,
  });

  function updateReadout() {
    const p = Math.round(split * 100);
    handle.style.left = `${p}%`;
    handle.setAttribute("aria-valuenow", String(p));
    pctEl.textContent = `${p}%`;
    if (p >= 75) {
      sideEl.textContent = `偏向矩形硬叠 (${p}%)`;
      textEl.textContent = `矩形文本框实测有 ${rectLayout.protrudingChars} 个字角戳破绿水滴边界，图底和文字各讲各话，完全没形成一体轮廓。`;
    } else if (p <= 25) {
      sideEl.textContent = `偏向弦宽随形 (${p}%)`;
      textEl.textContent = `每一行按水滴在该高度的弦宽自动收放（${shapedLayout.minLineChars}–${shapedLayout.maxLineChars} 字/行），留出 13px 安全内壁，字群本身就是水滴。`;
    } else {
      sideEl.textContent = `${p}% 对比中`;
      textEl.textContent = `左右拖动分界帘：左侧矩形硬叠有 ${rectLayout.protrudingChars} 个字角戳出绿壳；右侧逐行按弦宽折行，每行自然贴壁呼吸。`;
    }
    dirty = true;
    if (reducedMotion.matches) ctrl.draw();
  }

  function drawSide(layout, isRect, cx, cy, scale) {
    const ry = 180 * scale;
    traceShapePath(ctx, "teardrop", cx, cy, ry, 0);
    ctx.fillStyle = "#0C9468";
    ctx.fill();

    if (isRect) {
      const rw = layout.rectW * scale;
      const rh = layout.lines.length * layout.lineH * scale + 6;
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = "#B02418";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - rw / 2, cy - rh / 2, rw, rh);
      ctx.setLineDash([]);
    } else {
      traceShapePath(ctx, "teardrop", cx, cy, ry, 12 * scale);
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "rgba(243, 251, 245, 0.36)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(243, 251, 245, 0.22)";
      for (const ln of layout.lines) {
        ctx.beginPath();
        ctx.moveTo(cx + ln.spanLeft * scale, cy + ln.cy * scale);
        ctx.lineTo(cx + ln.spanRight * scale, cy + ln.cy * scale);
        ctx.stroke();
      }
    }

    const fontPx = layout.fontSize * scale;
    ctx.font = `700 ${fontPx.toFixed(2)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const ln of layout.lines) {
      const y = cy + ln.cy * scale;
      if (isRect) {
        for (const g of ln.glyphs) {
          ctx.fillStyle = g.out ? "#B02418" : "#F4FCF6";
          ctx.fillText(g.ch, cx + g.x * scale, y);
        }
      } else {
        ctx.fillStyle = "#F4FCF6";
        ctx.fillText(ln.text, cx + ((ln.spanLeft + ln.spanRight) * 0.5) * scale, y);
      }
    }
  }

  function render() {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.51;
    const scale = Math.min((w - 56) / 365, (h - 46) / 375);
    const splitX = Math.round(w * split);

    // 左侧：矩形硬叠
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, h);
    ctx.clip();
    drawSide(rectLayout, true, cx, cy, scale);
    ctx.restore();

    // 右侧：弦宽随形
    ctx.save();
    ctx.beginPath();
    ctx.rect(splitX, 0, w - splitX, h);
    ctx.clip();
    drawSide(shapedLayout, false, cx, cy, scale);
    ctx.restore();

    // 分界线与顶角标签
    ctx.strokeStyle = "#0B140E";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, h);
    ctx.stroke();

    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    if (splitX > 96) {
      ctx.fillStyle = "#A32117";
      ctx.textAlign = "left";
      ctx.fillText("矩形硬叠", 12, 12);
    }
    if (w - splitX > 96) {
      ctx.fillStyle = "#075F42";
      ctx.textAlign = "right";
      ctx.fillText("弦宽随形", w - 12, 12);
    }
  }

  let dragging = false;
  const setFromX = (clientX) => {
    const r = stage.getBoundingClientRect();
    split = clamp((clientX - r.left) / Math.max(1, r.width), 0.06, 0.94);
    updateReadout();
  };

  stage.addEventListener("mousedown", (e) => {
    dragging = true;
    setFromX(e.clientX);
    e.preventDefault();
  });
  window.addEventListener("mousemove", (e) => {
    if (dragging) setFromX(e.clientX);
  });
  window.addEventListener("mouseup", () => {
    dragging = false;
  });
  stage.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length) {
        dragging = true;
        setFromX(e.touches[0].clientX);
      }
    },
    { passive: true }
  );
  stage.addEventListener(
    "touchmove",
    (e) => {
      if (dragging && e.touches.length) setFromX(e.touches[0].clientX);
    },
    { passive: true }
  );
  stage.addEventListener("touchend", () => {
    dragging = false;
  });
  handle.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      split = clamp(split - 0.05, 0.06, 0.94);
      updateReadout();
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      split = clamp(split + 0.05, 0.06, 0.94);
      updateReadout();
      e.preventDefault();
    }
  });

  const ctrl = loop(stage, () => {
    if (!dirty) return;
    dirty = false;
    render();
  });
  window.addEventListener("resize", () => {
    dirty = true;
    ctrl.draw();
  });
  updateReadout();
}

// =========================================================================
// 02 节：六形几何容器可排性测试 + 断流扫描
// =========================================================================
export function initSec02() {
  const canvas = document.getElementById("s2-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const btns = [...document.querySelectorAll("[data-s2-shape]")];
  const verdict = document.getElementById("s2-verdict");
  const badge = document.getElementById("s2-badge");
  const title = document.getElementById("s2-title");
  const splitsEl = document.getElementById("s2-splits");
  const orphansEl = document.getElementById("s2-orphans");
  const rangeEl = document.getElementById("s2-range");
  const explainEl = document.getElementById("s2-explain");
  const scanBtn = document.getElementById("s2-scan-btn");

  const TEST_TEXT =
    "将文字放入几何容器时，每一行都需要连续且平缓变化的弦宽。如果容器出现深凹口或过尖的锐角，水平扫描线会在中途被凹槽生生劈成左右两段，读者读到半行被迫跨沟寻找下半句，尖角处还会挤出大量孤零零的单字碎行，把原本顺滑的节奏彻底扯断。";

  let currentShape = "star";
  let scanOn = true;
  let dirty = true;
  let curLayout = null;

  function recompute() {
    const fs = currentShape === "star" ? 18.5 : currentShape === "crescent" ? 19.0 : 20;
    const pad = currentShape === "star" || currentShape === "crescent" ? 6 : 11;
    curLayout = layoutShapedText({
      text: TEST_TEXT,
      shapeId: currentShape,
      fontSize: fs,
      padPx: pad,
      mode: "shaped",
      ry: 184,
      allowMultiSpan: true,
    });

    const sh = SHAPES[currentShape];
    title.textContent = sh.name;
    splitsEl.textContent = `${curLayout.splitLineCount} 行`;
    orphansEl.textContent = `${curLayout.orphanLines} 行`;
    rangeEl.textContent = `${curLayout.minLineChars}–${curLayout.maxLineChars} 字`;

    if (!sh.convex) {
      verdict.dataset.tone = "err";
      badge.textContent = curLayout.splitLineCount > 0 ? "高危凹形 · 行流劈裂" : "高危凹形 · 通道过窄";
      explainEl.textContent =
        curLayout.splitLineCount > 0
          ? `${sh.note} 实测出现 ${curLayout.splitLineCount} 处同一水平行被凹槽劈断，且产生 ${curLayout.orphanLines} 行单字孤行。`
          : `${sh.note} 实测有效通道被内凹挤得极窄，整段文字被切出 ${curLayout.orphanLines} 行单字碎行，阅读节奏彻底打断。`;
    } else if (curLayout.orphanLines > 0) {
      verdict.dataset.tone = "warn";
      badge.textContent = "慎用锐角 · 尖端易出孤字";
      explainEl.textContent = `${sh.note} 本次实测有 ${curLayout.orphanLines} 行在尖角处被挤成 1 字孤行，实战时应放大内壁起止距或把首尾两字主动留空。`;
    } else {
      verdict.dataset.tone = "ok";
      badge.textContent = "推荐凸形 · 行流顺畅";
      explainEl.textContent = `${sh.note} 实测 0 处跨沟劈裂、0 行单字孤行，每行宽度从 ${curLayout.minLineChars} 字平缓过渡到 ${curLayout.maxLineChars} 字。`;
    }

    btns.forEach((b) => b.classList.toggle("is-active", b.dataset.s2Shape === currentShape));
    scanBtn.setAttribute("aria-pressed", String(scanOn));
    scanBtn.textContent = scanOn ? "断流扫描透视：开" : "断流扫描透视：关";
    dirty = true;
    if (reducedMotion.matches) ctrl.draw();
  }

  function render() {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const scale = Math.min((w - 50) / 390, (h - 42) / 386);
    const ry = 184 * scale;

    traceShapePath(ctx, currentShape, cx, cy, ry, 0);
    ctx.fillStyle = "#0C9468";
    ctx.fill();

    // 扫描高亮与文字
    const fontPx = curLayout.fontSize * scale;
    ctx.font = `700 ${fontPx.toFixed(2)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 按 y 分组检测跨沟分裂对
    const byY = new Map();
    for (const ln of curLayout.lines) {
      const key = Math.round(ln.cy);
      if (!byY.has(key)) byY.set(key, []);
      byY.get(key).push(ln);
    }

    if (scanOn) {
      for (const group of byY.values()) {
        if (group.length > 1) {
          group.sort((a, b) => a.spanLeft - b.spanLeft);
          for (let i = 0; i < group.length - 1; i++) {
            const x1 = cx + group[i].spanRight * scale;
            const x2 = cx + group[i + 1].spanLeft * scale;
            const y = cy + group[i].cy * scale;
            ctx.save();
            ctx.strokeStyle = "#C93326";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(x1 + 2, y);
            ctx.lineTo(x2 - 2, y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = "#FDECE9";
            ctx.strokeStyle = "#C93326";
            ctx.lineWidth = 1.2;
            const mx = (x1 + x2) * 0.5;
            ctx.fillRect(mx - 22, y - 9, 44, 18);
            ctx.strokeRect(mx - 22, y - 9, 44, 18);
            ctx.fillStyle = "#A32117";
            ctx.font = `700 10px "Noto Sans SC", sans-serif`;
            ctx.fillText("跨沟", mx, y);
            ctx.restore();
          }
        }
      }
    }

    ctx.font = `700 ${fontPx.toFixed(2)}px "Noto Sans SC", sans-serif`;
    for (const ln of curLayout.lines) {
      const y = cy + ln.cy * scale;
      const sx = cx + ((ln.spanLeft + ln.spanRight) * 0.5) * scale;
      if (scanOn && ln.hanCount <= 1) {
        ctx.fillStyle = "rgba(255, 224, 150, 0.42)";
        ctx.fillRect(cx + ln.spanLeft * scale - 2, cy + ln.yTop * scale, (ln.spanRight - ln.spanLeft) * scale + 4, fontPx);
      }
      ctx.fillStyle = "#F4FCF6";
      ctx.fillText(ln.text, sx, y);
    }
  }

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      currentShape = b.dataset.s2Shape;
      recompute();
    })
  );
  scanBtn.addEventListener("click", () => {
    scanOn = !scanOn;
    recompute();
  });

  const ctrl = loop(canvas, () => {
    if (!dirty) return;
    dirty = false;
    render();
  });
  window.addEventListener("resize", () => {
    dirty = true;
    ctrl.draw();
  });
  recompute();
}

// =========================================================================
// 03 节：深翡翠绿节里的 4× 局部显微放大解剖镜（内壁余量 × 行内对齐）
// =========================================================================
export function initSec03() {
  const canvas = document.getElementById("s3-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const alignBtns = [...document.querySelectorAll("[data-s3-align]")];
  const padBtns = [...document.querySelectorAll("[data-s3-pad]")];
  const noteWrap = document.getElementById("s3-note");
  const noteBody = document.getElementById("s3-note-body");

  const SAMPLE =
    "几何边界替文字框出第一眼识别，但真正决定耐不耐看的是内壁留白与行内字距：方正汉字贴紧圆弧容易咬破边界，而窄行强行两端拉齐会把字缝撕成白河。留出约零点六五字宽的安全内壁，并改用随形居中，字群轮廓既完整又干净。";

  let mode = "shaped";
  let padPx = 13;
  let dirty = true;
  let curLayout = null;

  function recompute() {
    curLayout = layoutShapedText({
      text: SAMPLE,
      shapeId: "circle",
      fontSize: 19.5,
      padPx,
      mode,
      ry: 154,
    });
    alignBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.s3Align === mode));
    padBtns.forEach((b) => b.classList.toggle("is-active", Number(b.dataset.s3Pad) === padPx));

    const strong = noteWrap.querySelector("strong");
    const alignName = mode === "shaped" ? "随形居中" : "两端强齐行";
    const padName = padPx === 0 ? "0px 贴壁" : "0.65em 安全内壁";
    strong.textContent = `当前观察：${alignName} + ${padName}`;

    if (mode === "justify" && padPx === 0) {
      noteBody.textContent = `双重踩雷：3× 显微圈里可见窄行字缝被硬扯到 ${curLayout.maxGapRatio.toFixed(2)}em（刺眼白河），同时外侧 ${curLayout.biteCount} 处方角直接啃住圆弧。`;
    } else if (mode === "justify") {
      noteBody.textContent = `内壁干净，但 3× 显微圈里清楚可见：为了贴满左右弧线，窄行字距被迫拉宽到 ${curLayout.maxGapRatio.toFixed(2)}em，撕开明显白缝。`;
    } else if (padPx === 0) {
      noteBody.textContent = `字距均匀，但 0px 内壁让 ${curLayout.biteCount} 处汉字方角直接顶撞绿圆弧边（红点处），远看轮廓像被剪刀剪毛。`;
    } else {
      noteBody.textContent = `3× 显微圈里字距始终匀称，最外侧汉字方角距离绿边稳留约 13px 清晰缓冲带，既护边又稳撑正圆。`;
    }

    dirty = true;
    if (reducedMotion.matches) ctrl.draw();
  }

  function drawCircleScene(c, cx, cy, scale, showHelpers) {
    const ry = 154 * scale;
    traceShapePath(c, "circle", cx, cy, ry, 0);
    c.fillStyle = "#0C9468";
    c.fill();

    if (padPx > 0 && showHelpers) {
      traceShapePath(c, "circle", cx, cy, ry, padPx * scale);
      c.setLineDash([4, 3]);
      c.strokeStyle = "rgba(243, 251, 245, 0.45)";
      c.lineWidth = 1.2;
      c.stroke();
      c.setLineDash([]);
    }

    const fontPx = curLayout.fontSize * scale;
    c.font = `700 ${fontPx.toFixed(2)}px "Noto Sans SC", sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";

    for (const ln of curLayout.lines) {
      const y = cy + ln.cy * scale;
      // 强制齐行拉出白河标亮
      if (mode === "justify" && ln.gapRatio >= RULES.maxJustifyGapRatio * 0.65 && ln.glyphs.length >= 2) {
        c.fillStyle = "rgba(255, 206, 86, 0.36)";
        for (let i = 0; i < ln.glyphs.length - 1; i++) {
          const g1 = ln.glyphs[i];
          const g2 = ln.glyphs[i + 1];
          const x1 = cx + (g1.x + g1.w * 0.5) * scale;
          const x2 = cx + (g2.x - g2.w * 0.5) * scale;
          if (x2 - x1 > 2) {
            c.fillRect(x1, cy + ln.yTop * scale, x2 - x1, fontPx);
          }
        }
      }
      c.fillStyle = "#F4FCF6";
      for (const g of ln.glyphs) {
        c.fillText(g.ch, cx + g.x * scale, y);
      }
    }

    if (padPx === 0 && curLayout.bitePoints.length) {
      c.fillStyle = "#E03A2B";
      c.strokeStyle = "#FFFFFF";
      c.lineWidth = 1.2;
      for (const bp of curLayout.bitePoints) {
        c.beginPath();
        c.arc(cx + bp.x * scale, cy + bp.y * scale, 3.2 * scale, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
    }
  }

  function render() {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 主圆置左偏下，右上角单独留白摆 3× 圆形显微放大镜，彼此零遮挡
    const scale = Math.min((w * 0.62) / 330, (h * 0.78) / 330);
    const cx = w * 0.34;
    const cy = h * 0.56;
    drawCircleScene(ctx, cx, cy, scale, true);

    // 瞄准框：取圆右上肩（第 2 行右侧边缘，既看得到咬边，又看得到短行强齐行白河）
    const focusLine = curLayout.lines[1] || curLayout.lines[0];
    const focusLX = focusLine ? focusLine.spanRight - 22 : 84;
    const focusLY = focusLine ? focusLine.cy : -96;
    const fx = cx + focusLX * scale;
    const fy = cy + focusLY * scale;

    ctx.strokeStyle = "#0B140E";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(fx, fy, 17, 0, Math.PI * 2);
    ctx.stroke();

    // 显微圆位置（右上清净区域，不压主圆任何文字）
    const lensR = Math.min(w * 0.21, h * 0.24);
    const lx = w - lensR - 18;
    const ly = lensR + 20;

    // 折线虚线连接瞄准圈与显微镜
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "#0B140E";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(fx + 14, fy - 10);
    ctx.lineTo(lx - lensR * 0.88, ly + lensR * 0.32);
    ctx.stroke();
    ctx.setLineDash([]);

    // 显微圆裁剪内重绘 3× 放大视野
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx, ly, lensR, 0, Math.PI * 2);
    ctx.fillStyle = "#D8EADB";
    ctx.fill();
    ctx.clip();
    const zoom = 3.0;
    drawCircleScene(ctx, lx - focusLX * scale * zoom, ly - focusLY * scale * zoom, scale * zoom, true);
    ctx.restore();

    ctx.strokeStyle = "#0B140E";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(lx, ly, lensR, 0, Math.PI * 2);
    ctx.stroke();

    // 显微标签
    ctx.fillStyle = "#0B140E";
    ctx.fillRect(lx - 34, ly + lensR - 10, 68, 20);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `500 11px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("3× 边缘", lx, ly + lensR);
  }

  alignBtns.forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.s3Align;
      recompute();
    })
  );
  padBtns.forEach((b) =>
    b.addEventListener("click", () => {
      padPx = Number(b.dataset.s3Pad);
      recompute();
    })
  );

  const ctrl = loop(canvas, () => {
    if (!dirty) return;
    dirty = false;
    render();
  });
  window.addEventListener("resize", () => {
    dirty = true;
    ctrl.draw();
  });
  recompute();
}

// =========================================================================
// 04 节：四种空间关系动态剖面演示（入壳 / 外绕 / 沿线 / 图形诗）
// =========================================================================
export function initSec04() {
  const canvas = document.getElementById("s4-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const cards = [...document.querySelectorAll("[data-s4-mode]")];

  let activeMode = "inside";
  let dirty = true;

  const SHORT_TEXT =
    "设计是传达与解决问题。把文字置入几何容器内部之后，每一行的起止都会顺着弧线自然收放，让字群本身撑出饱满清晰的视觉边界与节奏。";
  const insideLayout = layoutShapedText({
    text: SHORT_TEXT,
    shapeId: "circle",
    fontSize: 19.5,
    padPx: 11,
    mode: "shaped",
    ry: 112,
  });

  function render() {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.52;
    const r = Math.min(w * 0.24, h * 0.37);

    // 顶部关系签
    const labels = {
      inside: "189 形状文字：文字住进容器内部（本页主题）",
      wrap: "182 / 183 绕排：文字躲在图形外部流动",
      path: "191 路径文字：单行文字踩在边线上走",
      poem: "190 图形诗：摆脱固定壳，诗行自画具象物象",
    };
    ctx.fillStyle = "#075F42";
    ctx.font = `700 13px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(labels[activeMode], 16, 12);

    if (activeMode === "inside") {
      const sc = r / 112;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "#0C9468";
      ctx.fill();

      ctx.font = `700 ${(18 * sc).toFixed(1)}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "#F4FCF6";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const ln of insideLayout.lines) {
        ctx.fillText(ln.text, cx + ((ln.spanLeft + ln.spanRight) * 0.5) * sc, cy + ln.cy * sc);
      }
    } else if (activeMode === "wrap") {
      // 左侧实心绿圆 + 右侧多行正文避开圆弧外绕
      const ocx = cx - r * 0.72;
      ctx.beginPath();
      ctx.arc(ocx, cy, r * 0.85, 0, Math.PI * 2);
      ctx.fillStyle = "#0C9468";
      ctx.fill();

      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "#075F42";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(ocx, cy, r * 0.85 + 12, -Math.PI * 0.48, Math.PI * 0.48);
      ctx.stroke();
      ctx.setLineDash([]);

      const rows = [
        "文字留在几何图形外部，",
        "沿着外廓安全距顺弧线",
        "自然避让并继续向右铺",
        "展。图形本身仍是独立",
        "插图，文字并不住进它",
        "的内部空间，重点在于",
        "外部避让缝是否匀顺。",
      ];
      const fs = Math.max(12, Math.min(16, r * 0.16));
      const lh = fs * 1.48;
      ctx.font = `700 ${fs.toFixed(1)}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "#0B140E";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      rows.forEach((line, i) => {
        const dy = (i - (rows.length - 1) / 2) * lh;
        const rad = r * 0.85 + 16;
        const dx = Math.abs(dy) < rad ? Math.sqrt(rad * rad - dy * dy) : 0;
        const x0 = Math.max(ocx + dx, ocx + r * 0.22);
        ctx.fillText(line, x0, cy + dy);
      });
    } else if (activeMode === "path") {
      // 空心虚线圆轨 + 文字沿圆周弧线排列
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = "#0C9468";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const ringText = "文字沿着闭合轮廓的一条边线奔跑·中间保持空心·";
      const chars = [...ringText];
      const fs = Math.max(13, Math.min(18, r * 0.18));
      ctx.font = `700 ${fs.toFixed(1)}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "#0B140E";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const trackR = r * 0.82 + fs * 0.72;
      chars.forEach((ch, i) => {
        const ang = -Math.PI / 2 + (i / chars.length) * Math.PI * 2;
        ctx.save();
        ctx.translate(cx + Math.cos(ang) * trackR, cy + Math.sin(ang) * trackR);
        ctx.rotate(ang + Math.PI / 2);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });
    } else if (activeMode === "poem") {
      // 图形诗：不用固定几何色壳，靠诗行长短与位置直接拼画一棵松树剪影
      const poemLines = [
        "风",
        "掠过",
        "山脊青松",
        "针叶细密成层",
        "不借外加几何色块",
        "行长自己画出一棵树",
        "枝影摇曳在留白纸面之间",
        "干",
        "立",
      ];
      const fs = Math.max(12, Math.min(16, h * 0.068));
      const lh = fs * 1.38;
      ctx.font = `700 ${fs.toFixed(1)}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "#075F42";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const startY = cy - ((poemLines.length - 1) * lh) / 2 + 6;
      poemLines.forEach((str, i) => {
        ctx.fillText(str, cx, startY + i * lh);
      });
    }
  }

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      activeMode = card.dataset.s4Mode;
      cards.forEach((c) => c.classList.toggle("is-active", c === card));
      dirty = true;
      if (reducedMotion.matches) ctrl.draw();
    });
  });

  const ctrl = loop(canvas, () => {
    if (!dirty) return;
    dirty = false;
    render();
  });
  window.addEventListener("resize", () => {
    dirty = true;
    ctrl.draw();
  });
}

// =========================================================================
// 05 节：四时期史料演进活体排印样张（全部经权威资料核实）
// =========================================================================
export function initSec05() {
  const canvas = document.getElementById("s5-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const tabs = [...document.querySelectorAll("[data-era]")];
  const locEl = document.getElementById("era-loc");
  const titleEl = document.getElementById("era-title");
  const p1El = document.getElementById("era-p1");
  const srcEl = document.getElementById("era-source");

  const ERAS = [
    {
      loc: "希腊化时期 · 罗得岛（约公元前 300 年）",
      title: "西米亚斯与《希腊诗选》里的蛋、斧、翼",
      p1: "有文献可查的最早形状排字出自约公元前 300 年的希腊诗人罗得岛的西米亚斯（Simias of Rhodes）。他写下的《斧》《蛋》《翼》被称为图画诗（technopaegnia），收录于《希腊诗选》第 15 卷。没有几何容器工具的年代，他靠精确增减每一行的格律音步长短，让诗行自身长成一颗蛋或双刃斧。",
      src: "核实出处：Encyclopædia Britannica《Greek Anthology》；Loeb Classical Library《The Greek Bucolic Poets》。更多诗体造型见 190 图形诗排版。",
      draw(c, w, h) {
        // 蛋形诗格律行宽示意
        c.fillStyle = "#075F42";
        c.font = `500 11px "DM Mono", monospace`;
        c.textAlign = "left";
        c.fillText("OON (EGG) · c. 300 BCE", 14, 22);
        const rows = [
          "微声",
          "自卵壳起",
          "格律逐行伸展",
          "由短入长复由长归短",
          "诗句不靠外框而自成轮廓",
          "从首行与末行交替向中收束",
          "每一音步都丈量着蛋壳的弧度",
          "直到最宽一笔稳托全篇重心",
          "再循着同样的节奏收回",
          "留下一枚无墨线的",
          "文字之卵",
          "止",
        ];
        const fs = Math.max(11, Math.min(14, h * 0.047));
        const lh = fs * 1.42;
        c.font = `700 ${fs.toFixed(1)}px "Noto Sans SC", sans-serif`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        const y0 = h * 0.56 - ((rows.length - 1) * lh) / 2;
        rows.forEach((line, i) => {
          c.fillStyle = "#0B140E";
          c.fillText(line, w * 0.5, y0 + i * lh);
        });
        c.setLineDash([3, 4]);
        c.strokeStyle = "rgba(12, 148, 104, 0.5)";
        c.lineWidth = 1.2;
        c.beginPath();
        c.ellipse(w * 0.5, h * 0.56, w * 0.34, h * 0.36, 0, 0, Math.PI * 2);
        c.stroke();
        c.setLineDash([]);
      },
    },
    {
      loc: "文艺复兴 · 威尼斯（1499 年 12 月）",
      title: "《寻爱绮梦》的倒三角与圣杯活字尾饰",
      p1: "1499 年 12 月，威尼斯出版家阿尔杜斯·马努提乌斯（Aldus Manutius）印行《寻爱绮梦》（Hypnerotomachia Poliphili），采用弗朗切斯科·格里福刻制的罗马体活字。书中多处章节末尾与牌记采用了工整的倒三角和圣杯收尾排法（法语称 cul-de-lampe，意为油灯底坠），让金属铅字在书页底部自然收敛成几何容器。",
      src: "核实出处：大都会艺术博物馆馆藏（1499 年威尼斯初版）；《Hypnerotomachia Poliphili》书史条目。",
      draw(c, w, h) {
        c.fillStyle = "#075F42";
        c.font = `500 11px "DM Mono", monospace`;
        c.textAlign = "left";
        c.fillText("CUL-DE-LAMPE · VENICE 1499", 14, 22);
        const rows = [
          "威尼斯阿尔杜斯印书馆于一四九九年十二月印行",
          "章节收束之处不生硬留空而是逐行收窄行宽",
          "金属铅字如古灯底坠般沿对称斜坡收敛",
          "让正文末尾本身化作一枚端庄几何尾饰",
          "每一行居中落位与上方版心稳稳咬合",
          "字块与纸白由此达成古典书籍秩序",
          "直至最末一行凝成一点收口",
          "威尼斯初版牌记",
          "终",
        ];
        const fs = Math.max(11, Math.min(14, w * 0.036));
        const lh = fs * 1.62;
        const y0 = h * 0.24;
        c.strokeStyle = "rgba(12, 148, 104, 0.45)";
        c.setLineDash([4, 3]);
        c.beginPath();
        c.moveTo(w * 0.12, y0 - 12);
        c.lineTo(w * 0.88, y0 - 12);
        c.lineTo(w * 0.5, y0 + rows.length * lh + 4);
        c.closePath();
        c.stroke();
        c.setLineDash([]);

        c.font = `700 ${fs.toFixed(1)}px "Noto Sans SC", sans-serif`;
        c.fillStyle = "#0B140E";
        c.textAlign = "center";
        c.textBaseline = "middle";
        rows.forEach((line, i) => {
          c.fillText(line, w * 0.5, y0 + i * lh);
        });
      },
    },
    {
      loc: "现代前卫艺术 · 巴黎（1918 年 4 月）",
      title: "阿波利奈尔《图画诗集》打破直角版心",
      p1: "1918 年 4 月，纪尧姆·阿波利奈尔（Guillaume Apollinaire）在巴黎水星出版社（Mercure de France）推出《图画诗集》（Calligrammes）。他彻底挣脱铅印直角版心的束缚，让句子化作星光、雨线与喷泉；这一突破直接影响了 20 世纪的海报与现代图形排版，促使设计师把「字形」和「图形轮廓」当作同一种视觉材料。",
      src: "核实出处：Encyclopædia Britannica《Calligrammes》；法国国家图书馆（BnF）初版档案。",
      draw(c, w, h) {
        c.fillStyle = "#075F42";
        c.font = `500 11px "DM Mono", monospace`;
        c.textAlign = "left";
        c.fillText("CALLIGRAMMES · PARIS 1918", 14, 22);
        // 放射弧线喷泉示意
        const cx = w * 0.5;
        const baseY = h * 0.84;
        const streams = [
          { dx: -0.32, text: "字行挣脱直角版心" },
          { dx: -0.14, text: "像雨线从页面垂落" },
          { dx: 0.14, text: "阅读与观看同时发生" },
          { dx: 0.32, text: "轮廓本身即在说话" },
        ];
        const fs = Math.max(11, Math.min(14, h * 0.052));
        c.font = `700 ${fs.toFixed(1)}px "Noto Sans SC", sans-serif`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        streams.forEach((st) => {
          const chars = [...st.text];
          chars.forEach((ch, idx) => {
            const u = (idx + 1) / (chars.length + 1);
            const x = cx + st.dx * w * Math.sin(u * Math.PI * 0.72);
            const y = baseY - u * (h * 0.62) + Math.pow(u, 2) * (h * 0.1);
            c.fillStyle = idx % 2 === 0 ? "#0B140E" : "#075F42";
            c.fillText(ch, x, y);
          });
        });
        c.beginPath();
        c.arc(cx, baseY + 6, 5, 0, Math.PI * 2);
        c.fillStyle = "#0C9468";
        c.fill();
      },
    },
    {
      loc: "数字排版与 Web 标准（2014 年至今）",
      title: "区域文字工具与 W3C shape-inside 草案",
      p1: "桌面出版时代，Adobe Illustrator 等矢量工具以「区域文字（Area Type）」让文字自动灌进任意闭合路径。到了网页端，W3C 于 2014 年 3 月发布 CSS Shapes Module Level 1 候选推荐标准（落地了外部绕排 shape-outside），并在 CSS Shapes Level 2 与 SVG 2 草案中提出了容器内排的 shape-inside——因跨浏览器尚未全面实装，网页端至今多由脚本逐行计算扫描弦宽来实现（正如本页所用）。",
      src: "核实出处：W3C CSS Shapes Module Level 1 (2014 / 2022)、CSS Shapes Level 2 Editor's Draft、SVG 2 Text 规范及 Adobe Illustrator 官方文档。",
      draw(c, w, h) {
        c.fillStyle = "#075F42";
        c.font = `500 11px "DM Mono", monospace`;
        c.textAlign = "left";
        c.fillText("shape-inside: polygon(...) · SCANLINE", 14, 22);
        const cx = w * 0.5;
        const cy = h * 0.55;
        const r = Math.min(w * 0.34, h * 0.36);
        traceShapePath(ctx, "hexagon", cx, cy, r, 0);
        c.fillStyle = "rgba(12, 148, 104, 0.14)";
        c.fill();
        c.strokeStyle = "#0C9468";
        c.lineWidth = 2;
        c.stroke();
        const lay = layoutShapedText({
          text: "扫描线逐行求容器左右交点扣除内壁安全距再把字符依次灌入每一段可用弦宽",
          shapeId: "hexagon",
          fontSize: 16,
          padPx: 10,
          mode: "shaped",
          ry: 108,
        });
        const sc = r / 108;
        c.font = `700 ${(16 * sc).toFixed(1)}px "Noto Sans SC", sans-serif`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        for (const ln of lay.lines) {
          c.strokeStyle = "rgba(7, 95, 66, 0.3)";
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(cx + ln.spanLeft * sc, cy + ln.cy * sc);
          c.lineTo(cx + ln.spanRight * sc, cy + ln.cy * sc);
          c.stroke();
          c.fillStyle = "#0B140E";
          c.fillText(ln.text, cx + ((ln.spanLeft + ln.spanRight) * 0.5) * sc, cy + ln.cy * sc);
        }
      },
    },
  ];

  let idx = 0;
  let dirty = true;

  function selectEra(next) {
    idx = next;
    const item = ERAS[idx];
    locEl.textContent = item.loc;
    titleEl.textContent = item.title;
    p1El.textContent = item.p1;
    srcEl.textContent = item.src;
    if (idx === 0) {
      srcEl.textContent = "核实出处：Encyclopædia Britannica《Greek Anthology》；Loeb Classical Library《The Greek Bucolic Poets》。更多诗体造型见 ";
      const a = document.createElement("a");
      a.href = "https://layout.xiaoxiaodong.ai/190/play/";
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "190 图形诗排版";
      srcEl.appendChild(a);
      srcEl.append("。");
    }
    tabs.forEach((t, i) => {
      t.classList.toggle("is-active", i === idx);
      t.setAttribute("aria-selected", String(i === idx));
    });
    dirty = true;
    if (reducedMotion.matches) ctrl.draw();
  }

  function render() {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ERAS[idx].draw(ctx, w, h);
  }

  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      selectEra(Number(t.dataset.era));
    })
  );

  const ctrl = loop(canvas, () => {
    if (!dirty) return;
    dirty = false;
    render();
  });
  window.addEventListener("resize", () => {
    dirty = true;
    ctrl.draw();
  });
  selectEra(0);
}

// =========================================================================
// 06 节：三段真实业务字量灌入水滴实测（修正原海报说得略宽处）
// =========================================================================
export function initSec06() {
  const canvas = document.getElementById("s6-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const btns = [...document.querySelectorAll("[data-s6-case]")];
  const badgeEl = document.getElementById("s6-badge");
  const titleEl = document.getElementById("s6-title");
  const descEl = document.getElementById("s6-desc");
  const statsEl = document.getElementById("s6-stats");

  const CASES = {
    short: {
      text: "春季设计展即将开幕",
      fontSize: 28,
      padPx: 14,
      tone: "warn",
      badge: "字量过短 · 撑不起轮廓",
      titlePrefix: "短标题：靠绿底硬撑，脱壳只剩零碎短行",
      desc: "字数太少，哪怕放大到 28px 也只占了水滴顶部一小条；拿掉底色后读者完全看不出任何几何轮廓。极短标题更适合直接放大做版面主标，而不是硬套容器。",
    },
    sweet: {
      text: "走进这场春季字体展，你会看到文字如何从规整的矩形栏框里走出来，顺着水滴、圆盘与多边形的内壁自然舒展。每一行字宽都在和轮廓对话，让观看与阅读在同一瞬间完成。",
      fontSize: 21.8,
      padPx: 12,
      tone: "ok",
      badge: "黄金甜区 · 图文一体",
      titlePrefix: "展签导语：轮廓饱满，一口气读完不累眼",
      desc: "字数稳落在 20–120 字经验甜区内：字号清晰、留足安全内壁，既顺着水滴弧线自然填满底部，又不会让视线在过长段落里频繁折返。",
    },
    long: {
      text: "本次春季字体与空间展将于四月十二日至六月三十日在东馆二层展厅向公众开放。全展分为古典活字、现代网格、东亚竖排、容器文字与动态字形五个单元，共展出珍贵书影、实体铅字模与互动装置一百二十余件。每周二至周日十点至十八点开馆，周一闭馆维护，法定节假日另行公告。参观需提前三日在官方小程序实名预约，学生及六十五岁以上观众凭有效证件享受半价优惠，团队导览请至少提前一周电话登记。展厅内请勿使用闪光灯拍摄，并保持安静，共同维护良好的观展与阅读环境，祝您收获愉快体验。",
      fontSize: 13.5,
      padPx: 9,
      tone: "err",
      badge: "字量过载 · 扫读崩溃",
      titlePrefix: "长正文：字小如蚁、行首不停左右跳动",
      desc: "两百余字硬塞进同一枚水滴，字号被迫缩到 13.5px 仍装不下还会溢流；更致命的是十几行起读左缘随曲线来回飘移，眼睛连续扫读极易发晕。长正文务必回到普通矩形栏。",
    },
  };

  let curKey = "sweet";
  let dirty = true;
  let curLayout = null;

  function selectCase(k) {
    curKey = k;
    const c = CASES[k];
    curLayout = layoutShapedText({
      text: c.text,
      shapeId: "teardrop",
      fontSize: c.fontSize,
      padPx: c.padPx,
      mode: "shaped",
      ry: 158,
    });

    badgeEl.dataset.tone = c.tone;
    badgeEl.textContent = c.badge;
    titleEl.textContent = `${curLayout.totalChars} 字${c.titlePrefix}`;
    descEl.textContent = c.desc;
    const fillPct = Math.round(curLayout.fillRatio * 100);
    const ovStr = curLayout.overflowCount > 0 ? ` · 溢出 ${curLayout.overflowCount} 字` : "";
    statsEl.textContent = `${curLayout.totalChars} 字 · ${curLayout.lines.length} 行 · 垂向填满 ${fillPct}%${ovStr}`;
    btns.forEach((b) => b.classList.toggle("is-active", b.dataset.s6Case === k));
    dirty = true;
    if (reducedMotion.matches) ctrl.draw();
  }

  function render() {
    const { w, h, dpr } = fitCanvas(canvas);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const scale = Math.min((w - 28) / 336, (h - 28) / 336);
    const ry = 158 * scale;

    traceShapePath(ctx, "teardrop", cx, cy, ry, 0);
    ctx.fillStyle = "#0C9468";
    ctx.fill();

    const fontPx = curLayout.fontSize * scale;
    ctx.font = `700 ${fontPx.toFixed(2)}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "#F4FCF6";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const ln of curLayout.lines) {
      ctx.fillText(ln.text, cx + ((ln.spanLeft + ln.spanRight) * 0.5) * scale, cy + ln.cy * scale);
    }

    if (curLayout.overflowCount > 0) {
      ctx.fillStyle = "#FDECE9";
      ctx.strokeStyle = "#B02418";
      ctx.lineWidth = 1.3;
      ctx.fillRect(cx - 88, cy + ry - 26, 176, 22);
      ctx.strokeRect(cx - 88, cy + ry - 26, 176, 22);
      ctx.fillStyle = "#A32117";
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      ctx.fillText(`仍有 ${curLayout.overflowCount} 字装不下`, cx, cy + ry - 15);
    }
  }

  btns.forEach((b) => b.addEventListener("click", () => selectCase(b.dataset.s6Case)));
  const ctrl = loop(canvas, () => {
    if (!dirty) return;
    dirty = false;
    render();
  });
  window.addEventListener("resize", () => {
    dirty = true;
    ctrl.draw();
  });
  selectCase("sweet");
}

// =========================================================================
// 07 节：小练习 A/B/C/D 盲测（四个选项只差单一变量，支持四版同时脱壳验证）
// =========================================================================
export function initSec07() {
  const grid = document.getElementById("quiz-grid");
  if (!grid) return;

  const QUIZ_TEXT =
    "文字住进几何轮廓内部之后，每一行的起止都在描摹图形边界。留足安全内壁、撑满圆腹容积，拿掉底色依然一眼认出完整圆形。";

  // 四版共用同一正圆（ry = 112）与同一 57 字展签，彼此仅差单一变量
  const OPTIONS = {
    A: { fontSize: 18.2, padPx: 0, mode: "shaped" },
    B: { fontSize: 13.8, padPx: 11, mode: "shaped" },
    C: { fontSize: 18.2, padPx: 11, mode: "shaped" },
    D: { fontSize: 18.2, padPx: 11, mode: "justify" },
  };
  const ANSWER = "C";

  const layouts = {};
  for (const [k, opt] of Object.entries(OPTIONS)) {
    layouts[k] = layoutShapedText({
      text: QUIZ_TEXT,
      shapeId: "circle",
      fontSize: opt.fontSize,
      padPx: opt.padPx,
      mode: opt.mode,
      ry: 112,
    });
  }

  const cards = [...grid.querySelectorAll(".quiz-card")];
  const shellBtn = document.getElementById("quiz-shell-btn");
  const retryBtn = document.getElementById("quiz-retry-btn");
  const fb = document.getElementById("quiz-feedback");
  const fbBadge = document.getElementById("qf-badge");
  const fbTitle = document.getElementById("qf-title");
  const fbMain = document.getElementById("qf-main");
  const fbList = document.getElementById("qf-list");

  let picked = null;
  let peeled = false;

  function drawAll() {
    for (const card of cards) {
      const k = card.dataset.choice;
      const cv = card.querySelector("canvas");
      const ctx = cv.getContext("2d");
      const { w, h, dpr } = fitCanvas(cv);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.52;
      const scale = Math.min((w - 18) / 236, (h - 18) / 236);
      const ry = 112 * scale;
      const lay = layouts[k];

      traceShapePath(ctx, "circle", cx, cy, ry, 0);
      if (!peeled) {
        ctx.fillStyle = "#0C9468";
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(12, 148, 104, 0.04)";
        ctx.fill();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(7, 95, 66, 0.28)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const fontPx = lay.fontSize * scale;
      ctx.font = `700 ${fontPx.toFixed(2)}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = peeled ? "#073626" : "#F4FCF6";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const ln of lay.lines) {
        const y = cy + ln.cy * scale;
        if (lay.mode === "justify") {
          for (const g of ln.glyphs) {
            ctx.fillText(g.ch, cx + g.x * scale, y);
          }
        } else {
          ctx.fillText(ln.text, cx + ((ln.spanLeft + ln.spanRight) * 0.5) * scale, y);
        }
      }
    }
  }

  function showResult(choice) {
    picked = choice;
    const isOk = choice === ANSWER;
    cards.forEach((c) => {
      const k = c.dataset.choice;
      c.classList.toggle("is-picked", k === choice);
      c.classList.toggle("is-correct", k === ANSWER);
      c.classList.toggle("is-wrong", k === choice && !isOk);
    });

    shellBtn.hidden = false;
    retryBtn.hidden = false;
    fb.hidden = false;
    fbBadge.dataset.tone = isOk ? "ok" : "err";
    fbBadge.textContent = isOk ? "判断准确" : `选了 ${choice} · 再看细节`;
    fbTitle.textContent = isOk ? "选项 C 最稳：满度、内壁与字距三项同时过关" : "最稳的是选项 C——其它三版各自漏了一根弦";
    fbMain.textContent =
      "点上方「四版同时脱壳对照」隐去绿圆底，对比四组纯文字边界，差别一秒看穿：";

    const fillA = Math.round(layouts.A.fillRatio * 100);
    const fillB = Math.round(layouts.B.fillRatio * 100);
    const fillC = Math.round(layouts.C.fillRatio * 100);
    const gapD = layouts.D.maxGapRatio.toFixed(2);

    const items = [
      `A（只差内壁距 = 0px）：虽然装满 ${fillA}%，但实测 ${layouts.A.biteCount} 处汉字方角直接啃住圆弧边缘，远看毛糙。`,
      `B（只差字号偏小 = 13.8px）：安全距和字距没问题，但只填了 ${fillB}% 高度，底部空出一大片，脱壳后下半圆直接塌掉。`,
      `C（正确答案）：0 溢流、0 啃边、0 单字孤行，内壁约 ${(11 / 18.2).toFixed(2)}em、填满 ${fillC}%，随形居中字距匀称，脱壳仍是饱满正圆。`,
      `D（只差排法 = 两端强齐行）：字号与内壁全同 C，但上下窄行被迫把字缝扯宽到 ${gapD}em，生生拉出难读的断层白河。`,
    ];
    fbList.innerHTML = "";
    for (const s of items) {
      const li = document.createElement("li");
      li.textContent = s;
      fbList.appendChild(li);
    }
  }

  cards.forEach((c) =>
    c.addEventListener("click", () => {
      showResult(c.dataset.choice);
    })
  );

  shellBtn.addEventListener("click", () => {
    peeled = !peeled;
    shellBtn.setAttribute("aria-pressed", String(peeled));
    shellBtn.textContent = peeled ? "恢复四版绿底" : "四版同时脱壳对照";
    drawAll();
  });

  retryBtn.addEventListener("click", () => {
    picked = null;
    peeled = false;
    shellBtn.hidden = true;
    shellBtn.setAttribute("aria-pressed", "false");
    shellBtn.textContent = "四版同时脱壳对照";
    retryBtn.hidden = true;
    fb.hidden = true;
    cards.forEach((c) => c.classList.remove("is-picked", "is-correct", "is-wrong"));
    drawAll();
  });

  drawAll();
  window.addEventListener("resize", drawAll);
}

// =========================================================================
// 08 节：原海报放大拖动灯箱（复用 #poster.src，仅内联一次）
// =========================================================================
export function initPosterLightbox() {
  const openBtn = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbStage = document.getElementById("lb-stage");
  const lbImg = document.getElementById("lb-img");
  const lbScale = document.getElementById("lb-scale");
  const btnIn = document.getElementById("lb-in");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");
  if (!openBtn || !posterImg || !lb || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function apply() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    lbScale.textContent = `${Math.round(scale * 100)}%`;
  }

  function reset() {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    reset();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => {
    scale = clamp(scale + 0.35, 0.7, 3.5);
    apply();
  });
  btnOut.addEventListener("click", () => {
    scale = clamp(scale - 0.35, 0.7, 3.5);
    apply();
  });
  btnReset.addEventListener("click", reset);

  lbStage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = clamp(scale * (e.deltaY < 0 ? 1.14 : 0.88), 0.7, 3.5);
      apply();
    },
    { passive: false }
  );

  lbStage.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX - tx, y: e.clientY - ty };
    lbStage.classList.add("is-dragging");
    lbStage.setPointerCapture(e.pointerId);
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = e.clientX - drag.x;
    ty = e.clientY - drag.y;
    apply();
  });
  const endDrag = () => {
    drag = null;
    lbStage.classList.remove("is-dragging");
  };
  lbStage.addEventListener("pointerup", endDrag);
  lbStage.addEventListener("pointercancel", endDrag);

  lb.addEventListener("click", (e) => {
    if (e.target === lbStage && !drag) return;
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) {
      close();
    }
  });
}

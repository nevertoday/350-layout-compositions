// 240 响应式布局 · 2D Canvas 绘制模块
// 1) 开场视口断点标尺（#bp-ruler，含由内容算出的双浅色安全带、可拖双断点切刀、三测试点标记）
// 2) 05 节弹性媒体与艺术指导取景对比画布（#media-canvas，复刻原海报包豪斯几何组合）

import { loop, pixelRatio } from "../../lib/stage.js";
import { DEVICES, RULER_MAX, RULER_MIN, clampBreakpoints, snapBreakpoint } from "./model.js";

const PALETTE = {
  paper: "#F9F5F0",
  card: "#FFFFFF",
  sage: "#E1E9DD",
  green: "#11956D",
  greenSoft: "#D5EDE4",
  greenBand: "rgba(17, 149, 109, 0.22)",
  greenDeep: "#0B6F50",
  blue: "#0C4DB7",
  blueSoft: "#DCE7FA",
  blueBand: "rgba(12, 77, 183, 0.18)",
  ink: "#111514",
  muted: "#505A55",
  rule: "#C7CFC8",
  danger: "#B4281E",
  warn: "#9A5806",
};

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function createRulerCanvas(canvas, getState, onChange) {
  const ctx = canvas.getContext("2d");
  let cssW = 800;
  let cssH = 104;
  let activeHandle = null; // "bp1" | "bp2" | null
  let hoverHandle = null;
  let dirty = true;
  let introDone = false;
  let introElapsed = 0;

  const padX = () => (cssW < 520 ? 18 : 28);
  const trackLeft = () => padX();
  const trackRight = () => cssW - padX();
  const valToX = (v) => trackLeft() + ((v - RULER_MIN) / (RULER_MAX - RULER_MIN)) * (trackRight() - trackLeft());
  const xToVal = (x) => RULER_MIN + ((x - trackLeft()) / Math.max(1, trackRight() - trackLeft())) * (RULER_MAX - RULER_MIN);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    cssW = rect.width;
    cssH = rect.height;
    const dpr = pixelRatio(2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    dirty = true;
  }

  function drawHatchBand(xStart, xEnd, y, h, fill, stroke) {
    const bw = Math.max(2, xEnd - xStart);
    ctx.save();
    ctx.beginPath();
    ctx.rect(xStart, y, bw, h);
    ctx.clip();
    ctx.fillStyle = fill;
    ctx.fillRect(xStart, y, bw, h);
    // 细 45° 斜纹标示内容安全带
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    for (let sx = xStart - h; sx < xEnd + h; sx += 7) {
      ctx.beginPath();
      ctx.moveTo(sx, y + h);
      ctx.lineTo(sx + h, y);
      ctx.stroke();
    }
    ctx.restore();
    // 左侧最早可切底线加实线竖标
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xStart, y - 3);
    ctx.lineTo(xStart, y + h + 3);
    ctx.stroke();
  }

  function render(t, dt, { still }) {
    if (!still && !introDone) {
      introElapsed += dt;
      if (introElapsed >= 1.15) introDone = true;
      dirty = true;
    }
    if (!dirty && !activeHandle) return;
    dirty = false;

    const dpr = canvas.width / Math.max(1, cssW);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const state = getState();
    const evalRes = state.evalRes;
    const zones = evalRes.zones;
    const progress = still ? 1 : Math.min(1, introElapsed / 0.85);
    const ease = 1 - Math.pow(1 - progress, 3);

    const x0 = trackLeft();
    const x1 = trackRight();
    const trackW = x1 - x0;
    const isNarrow = cssW < 520;
    const isCompactH = cssH <= 82;

    // 清晰四层纵排，确保任何尺寸下切刀胶囊、内容区标签、轨道、测试点互不重叠
    const pillY = isCompactH ? 3.5 : 4;
    const pillH = isCompactH ? 19 : 21;
    const zoneLblY = isCompactH ? 30 : 33;
    const trackY = isCompactH ? 37 : 42;
    const trackH = isCompactH ? 14 : 16;

    // 标尺底板
    roundRect(ctx, 0.5, 0.5, cssW - 1, cssH - 1, 6);
    ctx.fillStyle = PALETTE.card;
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 动画进场：两把切刀从两侧汇入初始偏离位
    const dispBp1 = still ? state.bp1 : RULER_MIN + (state.bp1 - RULER_MIN) * ease;
    const dispBp2 = still ? state.bp2 : RULER_MAX - (RULER_MAX - state.bp2) * ease;
    const xBp1 = valToX(dispBp1);
    const xBp2 = valToX(dispBp2);

    // 内容反推的两段浅色安全带坐标
    const z1L = valToX(zones.minBp1);
    const z1R = valToX(zones.maxBp1);
    const z2L = valToX(zones.minBp2);
    const z2R = valToX(zones.maxBp2);

    // 内容安全带淡底投影（贯穿至标签下方，清晰呈现“切刀该往哪落”）
    ctx.fillStyle = "rgba(12, 77, 183, 0.08)";
    ctx.fillRect(z1L, zoneLblY - 7, Math.max(2, z1R - z1L), trackY + trackH - (zoneLblY - 7));
    ctx.fillStyle = "rgba(17, 149, 109, 0.09)";
    ctx.fillRect(z2L, zoneLblY - 7, Math.max(2, z2R - z2L), trackY + trackH - (zoneLblY - 7));

    // 内容安全带文字标注（自带防碰间距，绝不和顶部切刀胶囊重叠）
    ctx.font = `600 ${isNarrow || isCompactH ? 10 : 11}px "Inter", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lbl1 = isNarrow || isCompactH ? `2列≥${zones.minBp1}` : `2列安全带 ${zones.minBp1}–${zones.maxBp1}`;
    const lbl2 = isNarrow || isCompactH ? `${zones.wideCols}列≥${zones.minBp2}` : `${zones.wideCols}列安全带 ${zones.minBp2}–${zones.maxBp2}`;
    const w1 = ctx.measureText(lbl1).width;
    const w2 = ctx.measureText(lbl2).width;
    let cx1 = Math.max(x0 + w1 / 2 + 2, Math.min(x1 - w1 / 2 - 2, (z1L + z1R) / 2));
    let cx2 = Math.max(x0 + w2 / 2 + 2, Math.min(x1 - w2 / 2 - 2, (z2L + z2R) / 2));
    const minSep = (w1 + w2) / 2 + 10;
    if (cx2 - cx1 < minSep) {
      const mid = (cx1 + cx2) / 2;
      cx1 = Math.max(x0 + w1 / 2 + 2, mid - minSep / 2);
      cx2 = Math.min(x1 - w2 / 2 - 2, mid + minSep / 2);
    }
    ctx.fillStyle = PALETTE.blue;
    ctx.fillText(lbl1, cx1, zoneLblY);
    ctx.fillStyle = PALETTE.greenDeep;
    ctx.fillText(lbl2, cx2, zoneLblY);

    // 主轨道：当前切刀分出的 1 列 / 2 列 / 多列区间 + 叠画内容安全带
    roundRect(ctx, x0, trackY, trackW, trackH, 6);
    ctx.save();
    ctx.clip();

    ctx.fillStyle = "#F4F6FA";
    ctx.fillRect(x0, trackY, Math.max(0, xBp1 - x0), trackH);

    ctx.fillStyle = "#F4F5F2";
    ctx.fillRect(xBp1, trackY, Math.max(0, xBp2 - xBp1), trackH);

    ctx.fillStyle = "#EFF8F4";
    ctx.fillRect(xBp2, trackY, Math.max(0, x1 - xBp2), trackH);

    // 标尺上的两段内容安全带（随「长文案 / 4 卡」实时移动）
    drawHatchBand(z1L, z1R, trackY, trackH, PALETTE.blueBand, "rgba(12, 77, 183, 0.55)");
    drawHatchBand(z2L, z2R, trackY, trackH, PALETTE.greenBand, "rgba(17, 149, 109, 0.65)");

    // 100px 细刻度
    ctx.strokeStyle = "rgba(17, 21, 20, 0.14)";
    ctx.lineWidth = 1;
    for (let px = 400; px <= 1400; px += 100) {
      const gx = valToX(px);
      ctx.beginPath();
      ctx.moveTo(gx, trackY);
      ctx.lineTo(gx, trackY + trackH);
      ctx.stroke();
    }

    // 轨道内简短列数标注（加白底微胶囊，即使落在斜纹安全带边界上也清晰可读）
    ctx.font = `700 10px "Inter", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const segs = [
      { l: x0, r: xBp1, txt: "1列", col: PALETTE.blue },
      { l: xBp1, r: xBp2, txt: "2列", col: PALETTE.ink },
      { l: xBp2, r: x1, txt: `${zones.wideCols}列`, col: PALETTE.greenDeep },
    ];
    for (const s of segs) {
      if (s.r - s.l >= 58) {
        const cx = (s.l + s.r) / 2;
        const tw = ctx.measureText(s.txt).width + 8;
        const th = Math.min(13, trackH - 2);
        roundRect(ctx, cx - tw / 2, trackY + (trackH - th) / 2, tw, th, 3);
        ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
        ctx.fill();
        ctx.fillStyle = s.col;
        ctx.fillText(s.txt, cx, trackY + trackH / 2 + 0.5);
      }
    }
    ctx.restore();

    // 轨道外框
    roundRect(ctx, x0, trackY, trackW, trackH, 6);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.25;
    ctx.stroke();

    // 三台抽样测试点（375 / 768 / 1200）—— 明确标作测试点，而非应死背的断点线
    for (const dev of DEVICES) {
      const dx = valToX(dev.width);
      const dRes = evalRes.byId[dev.id];
      const dotColor =
        dRes.status === "error" ? PALETTE.danger : dRes.status === "warn" ? PALETTE.warn : PALETTE.greenDeep;

      ctx.save();
      ctx.setLineDash([2, 2.5]);
      ctx.strokeStyle = dotColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(dx, trackY + trackH + 1);
      ctx.lineTo(dx, cssH - (isCompactH ? 14 : 18));
      ctx.stroke();
      ctx.restore();

      // 空心菱形测试针（与圆形切刀把手清晰区分）
      const cy = trackY + trackH + (isCompactH ? 4 : 5);
      const r = isCompactH ? 3.5 : 4;
      ctx.beginPath();
      ctx.moveTo(dx, cy - r);
      ctx.lineTo(dx + r, cy);
      ctx.lineTo(dx, cy + r);
      ctx.lineTo(dx - r, cy);
      ctx.closePath();
      ctx.fillStyle = PALETTE.card;
      ctx.fill();
      ctx.lineWidth = 1.75;
      ctx.strokeStyle = dotColor;
      ctx.stroke();

      ctx.font = `600 ${isNarrow || isCompactH ? 10 : 11}px "Inter", "Noto Sans SC", sans-serif`;
      ctx.fillStyle = dotColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      const label = isNarrow || isCompactH ? `测 ${dev.width}` : `测试点 ${dev.width}px`;
      ctx.fillText(label, Math.max(x0 + 30, Math.min(x1 - 30, dx)), cssH - (isCompactH ? 2.5 : 4.5));
    }

    // 绘制两把断点切刀（蓝刀 BP1、绿刀 BP2）
    const drawCutter = (x, value, kind, color, tag) => {
      const active = activeHandle === kind;
      const hover = hoverHandle === kind;

      // 垂直切刃线
      ctx.strokeStyle = color;
      ctx.lineWidth = active ? 3 : 2.25;
      ctx.beginPath();
      ctx.moveTo(x, pillY + pillH);
      ctx.lineTo(x, trackY + trackH + 4);
      ctx.stroke();

      // 顶部抓手胶囊
      const pillW = isNarrow ? 68 : isCompactH ? 72 : 80;
      const clampedX = Math.max(pillW / 2 + 4, Math.min(cssW - pillW / 2 - 4, x));

      if (active || hover) {
        roundRect(ctx, clampedX - pillW / 2 - 2, pillY - 2, pillW + 4, pillH + 4, 5);
        ctx.fillStyle = "rgba(17, 21, 20, 0.14)";
        ctx.fill();
      }
      roundRect(ctx, clampedX - pillW / 2, pillY, pillW, pillH, 4);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = active ? 2 : 1.25;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${isNarrow ? 10 : 11}px "Inter", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${tag} ${Math.round(value)}`, clampedX, pillY + pillH / 2 + 0.5);

      // 轨道中心圆把（触屏直观抓点）
      ctx.beginPath();
      ctx.arc(x, trackY + trackH / 2, active ? 9.5 : 8, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.card;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = color;
      ctx.stroke();

      // 抓手双竖纹
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - 2, trackY + trackH / 2 - 3);
      ctx.lineTo(x - 2, trackY + trackH / 2 + 3);
      ctx.moveTo(x + 2, trackY + trackH / 2 - 3);
      ctx.lineTo(x + 2, trackY + trackH / 2 + 3);
      ctx.stroke();
    };

    drawCutter(xBp1, dispBp1, "bp1", PALETTE.blue, "BP1");
    drawCutter(xBp2, dispBp2, "bp2", PALETTE.green, "BP2");
  }

  let dragRectLeft = 0;

  function pickHandle(clientX) {
    const rect = canvas.getBoundingClientRect();
    dragRectLeft = rect.left;
    const x = clientX - dragRectLeft;
    const st = getState();
    const d1 = Math.abs(x - valToX(st.bp1));
    const d2 = Math.abs(x - valToX(st.bp2));
    return d1 <= d2 ? "bp1" : "bp2";
  }

  function applyPointer(clientX, snap = false) {
    if (!activeHandle) return;
    const raw = xToVal(clientX - dragRectLeft);
    const st = getState();
    let bp1 = st.bp1;
    let bp2 = st.bp2;
    if (activeHandle === "bp1") {
      bp1 = snap ? snapBreakpoint(raw, "bp1", bp2, st.preset) : clampBreakpoints(raw, bp2).bp1;
    } else {
      bp2 = snap ? snapBreakpoint(raw, "bp2", bp1, st.preset) : clampBreakpoints(bp1, raw).bp2;
    }
    dirty = true;
    if (bp1 !== st.bp1 || bp2 !== st.bp2) {
      onChange(bp1, bp2, activeHandle);
    }
  }

  let pointerId = null;
  canvas.addEventListener("pointerdown", (e) => {
    pointerId = e.pointerId;
    activeHandle = pickHandle(e.clientX);
    introDone = true;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    applyPointer(e.clientX, false);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (activeHandle && e.pointerId === pointerId) {
      applyPointer(e.clientX, false);
    } else if (!activeHandle) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const st = getState();
      const near1 = Math.abs(x - valToX(st.bp1)) < 36;
      const near2 = Math.abs(x - valToX(st.bp2)) < 36;
      const next = near1 ? "bp1" : near2 ? "bp2" : null;
      if (next !== hoverHandle) {
        hoverHandle = next;
        canvas.style.cursor = next ? "ew-resize" : "pointer";
        dirty = true;
        ctl.draw();
      }
    }
  });
  const endDrag = (e) => {
    if (!activeHandle || (pointerId !== null && e.pointerId !== pointerId)) return;
    applyPointer(e.clientX, true);
    activeHandle = null;
    pointerId = null;
    dirty = true;
    ctl.draw();
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => {
    activeHandle = null;
    pointerId = null;
    dirty = true;
    ctl.draw();
  });

  canvas.addEventListener("touchstart", (e) => {
    if (pointerId !== null || !e.touches.length) return;
    activeHandle = pickHandle(e.touches[0].clientX);
    introDone = true;
    applyPointer(e.touches[0].clientX, false);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (pointerId !== null || !activeHandle || !e.touches.length) return;
    applyPointer(e.touches[0].clientX, false);
  }, { passive: true });
  canvas.addEventListener("touchend", () => {
    if (pointerId !== null || !activeHandle) return;
    activeHandle = null;
    dirty = true;
    ctl.draw();
  }, { passive: true });

  resize();
  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(canvas);

  const ctl = loop(canvas, render);
  return {
    redraw() {
      dirty = true;
      ctl.draw();
    },
  };
}

// ---------- 05 节：弹性媒体与艺术指导取景对比画布 ----------
export function createMediaCanvas(canvas, getState) {
  const ctx = canvas.getContext("2d");
  let cssW = 720;
  let cssH = 300;
  let dirty = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    cssW = rect.width;
    cssH = rect.height;
    const dpr = pixelRatio(2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    dirty = true;
  }

  function drawBauhausArtwork(x, y, w, h, cropFocus) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    ctx.fillStyle = PALETTE.sage;
    ctx.fillRect(x, y, w, h);

    const scale = cropFocus ? 1.48 : 1.0;
    const cx = x + w * (cropFocus ? 0.5 : 0.52);
    const cy = y + h * (cropFocus ? 0.52 : 0.5);
    const unit = Math.min(w, h) * 0.42 * scale;

    ctx.fillStyle = PALETTE.green;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, unit * 1.08, -Math.PI / 2, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = PALETTE.blue;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy + unit * 0.92);
    ctx.lineTo(cx - unit * 0.95, cy + unit * 0.92);
    ctx.closePath();
    ctx.fill();

    const rMain = unit * 0.34;
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(cx - unit * 0.52, cy - unit * 0.16, rMain, 0, Math.PI * 2);
    ctx.fill();

    const cols = cropFocus ? 4 : 6;
    const rows = 4;
    const step = Math.max(5, unit * 0.18);
    const dx0 = cx + unit * 0.24;
    const dy0 = cy + unit * 0.22;
    ctx.fillStyle = PALETTE.ink;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        ctx.arc(dx0 + c * step, dy0 + r * step, Math.max(1.6, unit * 0.036), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function render() {
    if (!dirty) return;
    dirty = false;
    const dpr = canvas.width / Math.max(1, cssW);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const { mode, hasViewport } = getState();
    const stacked = cssW < 520;

    roundRect(ctx, 0.5, 0.5, cssW - 1, cssH - 1, 8);
    ctx.fillStyle = PALETTE.card;
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const pad = stacked ? 14 : 22;
    const leftW = stacked ? cssW - pad * 2 : (cssW - pad * 3) * 0.58;
    const leftH = stacked ? Math.min(126, leftW * 0.48) : cssH - pad * 2 - 36;
    const leftX = pad;
    const leftY = pad + 24;

    ctx.fillStyle = PALETTE.ink;
    ctx.font = `600 12px "Noto Sans SC", "Inter", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("桌面原图 16:9（同一套视觉资产）", leftX, pad + 2);

    const artH = Math.min(leftH, leftW * 0.5625);
    const artY = stacked ? leftY : leftY + (leftH - artH) / 2;
    drawBauhausArtwork(leftX, artY, leftW, artH, false);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.25;
    ctx.strokeRect(leftX, artY, leftW, artH);

    if (mode === "art") {
      const cw = artH * 0.84;
      const ch = artH * 0.92;
      const cx = leftX + leftW * 0.5 - cw * 0.52;
      const cy = artY + (artH - ch) / 2;
      ctx.fillStyle = "rgba(17, 21, 20, 0.34)";
      ctx.fillRect(leftX, artY, Math.max(0, cx - leftX), artH);
      ctx.fillRect(cx + cw, artY, Math.max(0, leftX + leftW - (cx + cw)), artH);
      ctx.strokeStyle = PALETTE.green;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(cx, cy, cw, ch);
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.green;
      ctx.fillRect(cx, cy - 18, 92, 18);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 10px "Inter", "Noto Sans SC", sans-serif`;
      ctx.fillText("<picture> 裁切", cx + 6, cy - 14);
    }

    const rightX = stacked ? pad : leftX + leftW + pad;
    const rightLabelY = stacked ? artY + artH + 14 : pad + 2;
    const rightY = rightLabelY + 22;
    const rightW = stacked ? cssW - pad * 2 : cssW - rightX - pad;
    const rightH = stacked ? cssH - rightY - pad : cssH - pad * 2 - 36;

    ctx.fillStyle = PALETTE.ink;
    ctx.font = `600 12px "Noto Sans SC", "Inter", sans-serif`;
    ctx.fillText(hasViewport ? "手机 375px 实际效果（已写 viewport）" : "漏写 viewport：手机按 980px 硬缩", rightX, rightLabelY);

    const phoneW = Math.min(rightW, stacked ? 164 : 162);
    const phoneH = Math.min(rightH, stacked ? 210 : 228);
    const phoneX = rightX + (rightW - phoneW) / 2;
    const phoneY = rightY + Math.max(0, (rightH - phoneH) / 2);

    roundRect(ctx, phoneX, phoneY, phoneW, phoneH, 16);
    ctx.fillStyle = PALETTE.paper;
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();

    // 手机顶部听筒短条
    ctx.fillStyle = PALETTE.ink;
    roundRect(ctx, phoneX + phoneW / 2 - 18, phoneY + 6, 36, 3.5, 2);
    ctx.fill();

    const scrX = phoneX + 9;
    const scrY = phoneY + 15;
    const scrW = phoneW - 18;
    const scrH = phoneH - 28;

    if (!hasViewport) {
      const miniH = scrW * 0.42;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(scrX, scrY, scrW, miniH);
      ctx.strokeStyle = PALETTE.danger;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(scrX, scrY, scrW, miniH);
      ctx.fillStyle = PALETTE.ink;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(scrX + 6, scrY + 10 + i * 7, scrW * 0.42, 2.5);
      }
      drawBauhausArtwork(scrX + scrW * 0.54, scrY + 8, scrW * 0.4, miniH - 16, false);
      ctx.fillStyle = PALETTE.danger;
      ctx.font = `600 10px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("980px 整页缩成 38%", phoneX + phoneW / 2, scrY + miniH + 18);
      ctx.fillStyle = PALETTE.muted;
      ctx.fillText("正文缩到 ~6px 需捏合", phoneX + phoneW / 2, scrY + miniH + 34);
    } else {
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText("高效协作 驱动增长", scrX + 4, scrY + 4);
      ctx.fillStyle = PALETTE.muted;
      ctx.fillRect(scrX + 4, scrY + 22, scrW * 0.85, 3);
      ctx.fillRect(scrX + 4, scrY + 29, scrW * 0.64, 3);

      const imgTop = scrY + 40;
      if (mode === "scale") {
        const h16 = scrW * 0.5625;
        drawBauhausArtwork(scrX, imgTop, scrW, h16, false);
        ctx.strokeStyle = PALETTE.warn;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(scrX, imgTop, scrW, h16);
        ctx.fillStyle = PALETTE.warn;
        ctx.font = `600 10px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("16:9 压扁 · 主体示意约 19%", phoneX + phoneW / 2, imgTop + h16 + 14);
      } else {
        const hArt = Math.min(scrH - 58, scrW * 0.88);
        drawBauhausArtwork(scrX, imgTop, scrW, hArt, true);
        ctx.strokeStyle = PALETTE.green;
        ctx.lineWidth = 1.8;
        ctx.strokeRect(scrX, imgTop, scrW, hArt);
        ctx.fillStyle = PALETTE.greenDeep;
        ctx.font = `600 10px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("<picture> 换幅 · 主体示意 46%", phoneX + phoneW / 2, imgTop + hArt + 12);
      }
    }
  }

  resize();
  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(canvas);
  const ctl = loop(canvas, () => render());
  return {
    redraw() {
      dirty = true;
      ctl.draw();
    },
  };
}

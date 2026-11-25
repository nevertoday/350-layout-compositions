// 191 路径文字 · 开场主角玩具（活体贝塞尔路径排字台）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  STAGE_W,
  STAGE_H,
  RULES,
  controlsFromBend,
  estimateBend,
  createFaultState,
  evaluateLayout,
  evalAtArc,
  clamp,
} from "./model.js";

const COLORS = {
  ink: "#032B26",
  badge: "#061E18",
  inkSoft: "#264F47",
  coral: "#EB6847",
  coralText: "#B63B1D",
  sage: "#C1D2BE",
  sageFaint: "rgba(193, 210, 190, 0.42)",
  paper: "#F6F8EA",
  ok: "#136B52",
  warnFill: "rgba(235, 104, 71, 0.24)",
};

export function initHero() {
  const canvas = document.getElementById("hero-canvas");
  const wrap = document.getElementById("hero-canvas-wrap");
  const ctx = canvas.getContext("2d");

  const elScore = document.getElementById("hero-score");
  const elBendRead = document.getElementById("bend-read");
  const elBendRail = document.getElementById("bend-rail");
  const elRailFill = document.getElementById("rail-fill");
  const elRailBead = document.getElementById("rail-bead");
  const elTrackRange = document.getElementById("track-range");
  const elTrackVal = document.getElementById("track-val");
  const elBtnFlip = document.getElementById("btn-flip");
  const elBtnNormals = document.getElementById("btn-normals");
  const elBtnReset = document.getElementById("btn-reset");
  const elDiagNote = document.getElementById("diag-note");
  const elDiagBadge = document.getElementById("diag-badge");
  const elDiagTitle = document.getElementById("diag-title");
  const elDiagBody = document.getElementById("diag-body");
  const elCheckStrip = document.getElementById("check-strip");
  const elMCol = document.getElementById("m-col");
  const elMDeg = document.getElementById("m-deg");
  const elMRad = document.getElementById("m-rad");
  const elMCov = document.getElementById("m-cov");

  const presetBtns = [...document.querySelectorAll("#preset-group button")];
  const kbdChips = [...document.querySelectorAll(".kbd-chip")];

  let state = createFaultState("sCurve");
  let layout = evaluateLayout(state);

  // 视口等比变换缓存
  let view = { w: STAGE_W, h: STAGE_H, scale: 1, ox: 0, oy: 0, dpr: 1 };
  let dirty = true;
  let intro = reducedMotion.matches ? 1 : 0;
  let dragging = null; // null | "c1" | "c2" | "start" | "rail"
  let hoverHandle = null;

  function resize() {
    const rect = wrap.getBoundingClientRect();
    const w = Math.max(240, Math.round(rect.width));
    const h = Math.max(160, Math.round(rect.height));
    const dpr = pixelRatio(w < 560 ? 1.5 : 2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width === pw && canvas.height === ph && view.w === w && view.h === h) return;
    canvas.width = pw;
    canvas.height = ph;
    const padX = 14;
    const padY = 12;
    const scale = Math.min((w - padX * 2) / STAGE_W, (h - padY * 2) / STAGE_H);
    view = {
      w,
      h,
      scale,
      ox: (w - STAGE_W * scale) * 0.5,
      oy: (h - STAGE_H * scale) * 0.5,
      dpr,
    };
    dirty = true;
  }

  function clientToStage(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (cx - rect.left - view.ox) / view.scale,
      y: (cy - rect.top - view.oy) / view.scale,
    };
  }

  // 把所有 DOM 读数同步到 model.js 的单真源结果
  function syncDOM() {
    layout = evaluateLayout(state);
    const { metrics, checks, passCount, diagnosis } = layout;

    elScore.textContent = `${passCount} / 4 达标`;
    elScore.classList.toggle("is-ok", passCount === 4);

    const bendPct = Math.round(state.bend * 100);
    elBendRead.textContent = `${bendPct}% · 最小半径 ${Math.round(metrics.minRadius)}px`;
    elBendRail.setAttribute("aria-valuenow", String(bendPct));
    elRailFill.style.width = `${bendPct}%`;
    elRailBead.style.left = `calc(18px + ${state.bend} * (100% - 36px))`;

    elTrackRange.value = String(state.tracking);
    elTrackVal.textContent = `${state.tracking >= 0 ? "+" : ""}${state.tracking.toFixed(2)}em`;

    elBtnFlip.textContent = state.side === "outside" ? "基线外侧" : "已翻至内侧";
    elBtnFlip.classList.toggle("is-on", state.side === "inside");
    elBtnFlip.setAttribute("aria-pressed", String(state.side === "inside"));

    elBtnNormals.textContent = state.showNormals ? "法线透视：开" : "法线透视：关";
    elBtnNormals.classList.toggle("is-on", state.showNormals);
    elBtnNormals.setAttribute("aria-pressed", String(state.showNormals));

    for (const b of presetBtns) {
      const on = b.dataset.preset === state.preset;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    }
    for (const c of kbdChips) {
      const on = c.dataset.handle === state.activeHandle;
      c.classList.toggle("is-on", on);
      c.setAttribute("aria-pressed", String(on));
    }

    for (const li of elCheckStrip.querySelectorAll("li")) {
      li.classList.toggle("is-pass", Boolean(checks[li.dataset.k]));
    }
    elMCol.textContent = metrics.collisionCount === 0 ? "0 处" : `${metrics.collisionCount} 处`;
    elMDeg.textContent = metrics.upsideDownCount > 0 ? `倒 ${Math.round(metrics.maxAbsAngleDeg)}°` : `${Math.round(metrics.maxAbsAngleDeg)}°`;
    elMRad.textContent = metrics.archRatio < RULES.minArchRatio
      ? `直 ${Math.round(metrics.archRatio * 100)}%`
      : `R ${Math.round(metrics.minRadius)}`;
    elMCov.textContent = metrics.overflowCount > 0
      ? `溢 ${metrics.overflowCount} 字`
      : `${Math.round(metrics.coverage * 100)}%`;

    elDiagNote.dataset.tone = diagnosis.tone;
    elDiagBadge.textContent = diagnosis.badge;
    elDiagTitle.textContent = diagnosis.headline;
    elDiagBody.textContent = diagnosis.body;
    dirty = true;
  }

  // 在画布中绘制圆角深墨标牌（忠实承袭 191 原海报）
  function drawTag(x, y, text, align = "center") {
    ctx.save();
    ctx.font = '700 11.5px "Noto Sans SC", sans-serif';
    const tw = ctx.measureText(text).width;
    const pw = tw + 18;
    const ph = 24;
    const rx = align === "left" ? x : align === "right" ? x - pw : x - pw * 0.5;
    const ry = y - ph * 0.5;
    ctx.fillStyle = COLORS.badge;
    ctx.beginPath();
    ctx.roundRect(rx, ry, pw, ph, 5);
    ctx.fill();
    ctx.fillStyle = COLORS.paper;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, rx + pw * 0.5, ry + ph * 0.5 + 0.5);
    ctx.restore();
  }

  function drawScene(progress) {
    const p = clamp(progress, 0.02, 1);
    const { p0, p3, c1, c2, lut, glyphs, collisions, sharpestPoint, metrics, checks } = layout;

    ctx.save();
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.clearRect(0, 0, view.w, view.h);

    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);

    // 1. 极淡的制图辅助参考网格（低干扰，凸显纸面秩序）
    ctx.strokeStyle = COLORS.sageFaint;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 60; x <= STAGE_W - 60; x += 100) {
      ctx.moveTo(x, 22);
      ctx.lineTo(x, STAGE_H - 22);
    }
    for (let y = 70; y <= STAGE_H - 50; y += 90) {
      ctx.moveTo(26, y);
      ctx.lineTo(STAGE_W - 26, y);
    }
    ctx.stroke();

    // 2. 贝塞尔控制柄切线杆（始终与圆心严丝合缝）
    const h1 = { x: clamp(c1.x, 22, STAGE_W - 22), y: clamp(c1.y, 22, STAGE_H - 22) };
    const h2 = { x: clamp(c2.x, 22, STAGE_W - 22), y: clamp(c2.y, 22, STAGE_H - 22) };
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(38, 79, 71, 0.48)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(h1.x, h1.y);
    ctx.moveTo(p3.x, p3.y);
    ctx.lineTo(h2.x, h2.y);
    ctx.stroke();
    ctx.restore();

    // 3. 若开启法线透视且曲率偏急，在最急拐点画出真实曲率圆弧
    if (state.showNormals && sharpestPoint && metrics.minRadius < 150) {
      const sp = sharpestPoint;
      const sign = sp.kappa >= 0 ? 1 : -1;
      const r = sp.r;
      const ccx = sp.x + sp.nx * sign * r;
      const ccy = sp.y + sp.ny * sign * r;
      if (r > 12 && r < 220) {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = checks.curveGrace ? "rgba(19, 107, 82, 0.35)" : "rgba(235, 104, 71, 0.62)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(ccx, ccy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(ccx, ccy);
        ctx.stroke();
        ctx.fillStyle = checks.curveGrace ? COLORS.ok : COLORS.coralText;
        ctx.font = '700 11px "Space Mono", monospace';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const rxLbl = clamp(ccx + r * 0.42, 46, STAGE_W - 46);
        const ryLbl = clamp(ccy + r * 0.52, 28, STAGE_H - 24);
        ctx.fillText(`R=${Math.round(r)}px`, rxLbl, ryLbl);
        ctx.restore();
      }
    }

    // 4. 原海报标志性深孔雀松黛粗路径曲线（按开场进度 p 逐步画出）
    const maxIdx = Math.max(2, Math.floor((lut.pts.length - 1) * p));
    ctx.save();
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 7.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lut.pts[0].x, lut.pts[0].y);
    for (let i = 1; i <= maxIdx; i++) {
      ctx.lineTo(lut.pts[i].x, lut.pts[i].y);
    }
    ctx.stroke();
    ctx.restore();

    // 5. 右上终点朱橘大三角形箭头（沿终点真实切线朝向）
    const endPt = lut.pts[maxIdx];
    ctx.save();
    ctx.translate(endPt.x, endPt.y);
    ctx.rotate(endPt.angle);
    ctx.fillStyle = COLORS.coral;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-10, -15);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-10, 15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 6. 左下起点固定锚点与可拖动的文字「路径起点」朱橘圆点
    const startMargin = 22;
    const endMargin = 32;
    const usable = Math.max(120, lut.total - startMargin - endMargin);
    const startArc = startMargin + clamp(state.startOffset, 0, 0.72) * usable;
    const startPt = evalAtArc(p0, c1, c2, p3, lut, startArc);

    // 轨道物理端小墨点
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath();
    ctx.arc(p0.x, p0.y, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // 原海报深墨「路径」虚线胶囊标牌（永远落在文字法线的反侧空白处，避开曲率圆标注）
    const sideSign = state.side === "inside" ? -1 : 1;
    const midPt = lut.pts[Math.floor(lut.pts.length * 0.72)];
    const oppNx = -midPt.nx * sideSign;
    const oppNy = -midPt.ny * sideSign;
    const tagX = clamp(midPt.x + oppNx * 54 + 28, 74, STAGE_W - 74);
    const tagY = clamp(midPt.y + oppNy * 52, 40, STAGE_H - 36);
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(midPt.x, midPt.y);
    ctx.lineTo(tagX, tagY);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath();
    ctx.arc(midPt.x, midPt.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    drawTag(tagX, tagY, "路径");

    // 7. 法线透视短线（合并为 2 次 batch stroke，极大降低软件渲染开销）
    const shownCount = Math.ceil(glyphs.length * p);
    if (state.showNormals) {
      ctx.save();
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = "rgba(19, 107, 82, 0.34)";
      ctx.beginPath();
      for (let i = 0; i < shownCount; i++) {
        const g = glyphs[i];
        if (g.collided || g.upsideDown || g.overflow) continue;
        const len = state.baselineGap + g.fontSize * 1.15;
        ctx.moveTo(g.baseX, g.baseY);
        ctx.lineTo(g.baseX + g.nx * len, g.baseY + g.ny * len);
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(235, 104, 71, 0.78)";
      ctx.beginPath();
      for (let i = 0; i < shownCount; i++) {
        const g = glyphs[i];
        if (!(g.collided || g.upsideDown || g.overflow)) continue;
        const len = state.baselineGap + g.fontSize * 1.15;
        ctx.moveTo(g.baseX, g.baseY);
        ctx.lineTo(g.baseX + g.nx * len, g.baseY + g.ny * len);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 8. 逐字沿切线绘制汉字与标点（字体样式提到循环外）
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const gFont = glyphs.length ? `700 ${glyphs[0].fontSize}px "Noto Sans SC", sans-serif` : '700 17px "Noto Sans SC", sans-serif';
    ctx.font = gFont;
    for (let i = 0; i < shownCount; i++) {
      const g = glyphs[i];
      ctx.save();
      ctx.translate(g.cx, g.cy);
      ctx.rotate(g.angle);

      if (g.collided || g.upsideDown || g.overflow) {
        ctx.fillStyle = COLORS.warnFill;
        ctx.strokeStyle = COLORS.coralText;
        ctx.lineWidth = 1.2;
        ctx.fillRect(-g.w * 0.54, -g.h * 0.54, g.w * 1.08, g.h * 1.08);
        ctx.strokeRect(-g.w * 0.54, -g.h * 0.54, g.w * 1.08, g.h * 1.08);
      }

      if (g.overflow) {
        ctx.fillStyle = COLORS.coralText;
        ctx.globalAlpha = 0.72;
      } else if (g.highlight) {
        ctx.fillStyle = COLORS.coralText;
      } else {
        ctx.fillStyle = COLORS.ink;
      }
      ctx.fillText(g.ch, 0, 1);
      ctx.restore();
    }
    ctx.restore();

    // 9. 碰撞红点标记（合并单次 fill）
    if (p > 0.92 && collisions.length > 0) {
      ctx.save();
      ctx.fillStyle = COLORS.coralText;
      ctx.beginPath();
      for (const col of collisions) {
        ctx.moveTo(col.x + 4, col.y);
        ctx.arc(col.x, col.y, 4, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    }

    // 10. 可拖拽朱橘「路径起点」圆点 + 永远避开文字一侧的虚线胶囊牌
    const stOppX = -startPt.nx * sideSign;
    const stOppY = -startPt.ny * sideSign;
    const stTagX = clamp(startPt.x + stOppX * 56, 60, STAGE_W - 60);
    const stTagY = clamp(startPt.y + stOppY * 54 + (Math.abs(stOppY) < 0.35 ? 36 : 0), 36, STAGE_H - 30);
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(startPt.x, startPt.y);
    ctx.lineTo(stTagX, stTagY);
    ctx.stroke();
    ctx.restore();
    drawTag(stTagX, stTagY, "路径起点");

    const isStartHot = dragging === "start" || hoverHandle === "start" || state.activeHandle === "start";
    ctx.save();
    if (isStartHot) {
      ctx.strokeStyle = "rgba(235, 104, 71, 0.35)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(startPt.x, startPt.y, 17, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = COLORS.coral;
    ctx.beginPath();
    ctx.arc(startPt.x, startPt.y, 13.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = '700 10px "Space Mono", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("S", startPt.x, startPt.y + 0.5);
    ctx.restore();

    // 11. 两个可捏塑贝塞尔控制柄 P1、P2（限位在可视区内便于用户抓握）
    const drawHandle = (pt, id, label) => {
      const hx = clamp(pt.x, 22, STAGE_W - 22);
      const hy = clamp(pt.y, 22, STAGE_H - 22);
      const hot = dragging === id || hoverHandle === id || state.activeHandle === id;
      ctx.save();
      if (hot) {
        ctx.fillStyle = "rgba(235, 104, 71, 0.22)";
        ctx.beginPath();
        ctx.arc(hx, hy, 18, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = hot ? COLORS.coral : COLORS.paper;
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(hx, hy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = hot ? "#FFFFFF" : COLORS.ink;
      ctx.font = '700 10px "Space Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, hx, hy + 0.5);
      ctx.restore();
    };
    drawHandle(c1, "c1", "P1");
    drawHandle(c2, "c2", "P2");

    ctx.restore();
  }

  function getHandlePositions() {
    const startMargin = 22;
    const endMargin = 32;
    const usable = Math.max(120, layout.lut.total - startMargin - endMargin);
    const startPt = evalAtArc(layout.p0, state.c1, state.c2, layout.p3, layout.lut, startMargin + state.startOffset * usable);
    return {
      c1: { x: clamp(state.c1.x, 22, STAGE_W - 22), y: clamp(state.c1.y, 22, STAGE_H - 22) },
      c2: { x: clamp(state.c2.x, 22, STAGE_W - 22), y: clamp(state.c2.y, 22, STAGE_H - 22) },
      start: { x: startPt.x, y: startPt.y },
    };
  }

  function hitTest(pt, radius = 34) {
    const hs = getHandlePositions();
    let best = null;
    let bestD = radius;
    for (const [key, pos] of Object.entries(hs)) {
      const d = Math.hypot(pt.x - pos.x, pt.y - pos.y);
      if (d < bestD) {
        bestD = d;
        best = key;
      }
    }
    return best;
  }

  // 根据画布点投影求最近弧长比例（拖动起点圆用）
  function nearestStartOffset(pt) {
    const { pts, total } = layout.lut;
    let bestS = 0;
    let bestD = Infinity;
    for (let i = 0; i < pts.length; i += 2) {
      const d = Math.hypot(pt.x - pts[i].x, pt.y - pts[i].y);
      if (d < bestD) {
        bestD = d;
        bestS = pts[i].s;
      }
    }
    const usable = Math.max(120, total - 54);
    return clamp((bestS - 22) / usable, 0, 0.72);
  }

  function applyBend(rawBend) {
    let b = clamp(rawBend, 0, 1);
    const snapTarget = state.preset === "sCurve" ? RULES.idealBend : state.preset === "arch" ? 0.36 : 0.48;
    if (Math.abs(b - snapTarget) < RULES.snapBendRadius) b = snapTarget;
    if (Math.abs(b - state.bend) < 0.002 && intro >= 1) return;
    const { c1, c2 } = controlsFromBend(state.preset, b);
    state.bend = b;
    state.c1 = c1;
    state.c2 = c2;
    intro = 1;
    syncDOM();
    if (reducedMotion.matches) runner.draw();
  }

  // ---------- 画布指针交互（鼠标 + 触摸仅在抓到手柄时接管，空白处允许滚页） ----------
  let activePointerId = null;

  canvas.addEventListener("pointerdown", (e) => {
    const pt = clientToStage(e.clientX, e.clientY);
    const hit = hitTest(pt, e.pointerType === "touch" ? 44 : 32);
    if (!hit) return;
    e.preventDefault();
    dragging = hit;
    activePointerId = e.pointerId;
    state.activeHandle = hit;
    intro = 1;
    canvas.classList.add("is-dragging");
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    syncDOM();
    runner.draw();
  });

  canvas.addEventListener("pointermove", (e) => {
    const pt = clientToStage(e.clientX, e.clientY);
    if (!dragging) {
      const h = hitTest(pt, 28);
      if (h !== hoverHandle) {
        hoverHandle = h;
        canvas.style.cursor = h ? "grab" : "default";
        dirty = true;
        runner.draw();
      }
      return;
    }
    if (activePointerId !== null && e.pointerId !== activePointerId) return;
    e.preventDefault();
    if (dragging === "c1") {
      state.c1 = { x: clamp(pt.x, 22, STAGE_W - 22), y: clamp(pt.y, 22, STAGE_H - 22) };
      state.bend = estimateBend(state.preset, state.c1, state.c2);
    } else if (dragging === "c2") {
      state.c2 = { x: clamp(pt.x, 22, STAGE_W - 22), y: clamp(pt.y, 22, STAGE_H - 22) };
      state.bend = estimateBend(state.preset, state.c1, state.c2);
    } else if (dragging === "start") {
      state.startOffset = nearestStartOffset(pt);
    }
    syncDOM();
    runner.draw();
  });

  const endCanvasDrag = () => {
    if (!dragging) return;
    dragging = null;
    activePointerId = null;
    canvas.classList.remove("is-dragging");
    dirty = true;
    runner.draw();
  };
  canvas.addEventListener("pointerup", endCanvasDrag);
  canvas.addEventListener("pointercancel", endCanvasDrag);

  // ---------- 底沿朱橘细箭头弯曲张力轨（data-perf-drag，支持鼠标+触摸+键盘） ----------
  function bendFromClientX(clientX) {
    const r = elBendRail.getBoundingClientRect();
    const pad = 18;
    const span = Math.max(20, r.width - pad * 2);
    return clamp((clientX - r.left - pad) / span, 0, 1);
  }

  let railDragging = false;
  elBendRail.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    railDragging = true;
    try { elBendRail.setPointerCapture(e.pointerId); } catch {}
    applyBend(bendFromClientX(e.clientX));
  });
  elBendRail.addEventListener("pointermove", (e) => {
    if (!railDragging) return;
    e.preventDefault();
    applyBend(bendFromClientX(e.clientX));
  });
  const endRail = () => { railDragging = false; };
  elBendRail.addEventListener("pointerup", endRail);
  elBendRail.addEventListener("pointercancel", endRail);

  elBendRail.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.1 : 0.04;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      applyBend(state.bend - step);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      applyBend(state.bend + step);
    }
  });

  // 画布键盘微调当前选中手柄
  canvas.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 28 : 12;
    let handled = true;
    if (state.activeHandle === "start") {
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") state.startOffset = clamp(state.startOffset - 0.04, 0, 0.72);
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") state.startOffset = clamp(state.startOffset + 0.04, 0, 0.72);
      else handled = false;
    } else {
      const target = state.activeHandle === "c2" ? state.c2 : state.c1;
      if (e.key === "ArrowLeft") target.x = clamp(target.x - step, -40, STAGE_W + 40);
      else if (e.key === "ArrowRight") target.x = clamp(target.x + step, -40, STAGE_W + 40);
      else if (e.key === "ArrowUp") target.y = clamp(target.y - step, -280, STAGE_H + 220);
      else if (e.key === "ArrowDown") target.y = clamp(target.y + step, -280, STAGE_H + 220);
      else handled = false;
      if (handled) state.bend = estimateBend(state.preset, state.c1, state.c2);
    }
    if (handled) {
      e.preventDefault();
      intro = 1;
      syncDOM();
      runner.draw();
    }
  });

  // ---------- 按钮控件 ----------
  for (const btn of presetBtns) {
    btn.addEventListener("click", () => {
      state = createFaultState(btn.dataset.preset);
      intro = reducedMotion.matches ? 1 : 0.2;
      syncDOM();
      runner.draw();
    });
  }

  for (const chip of kbdChips) {
    chip.addEventListener("click", () => {
      state.activeHandle = chip.dataset.handle;
      syncDOM();
      canvas.focus({ preventScroll: true });
      runner.draw();
    });
  }

  elBtnFlip.addEventListener("click", () => {
    state.side = state.side === "outside" ? "inside" : "outside";
    intro = 1;
    syncDOM();
    runner.draw();
  });

  elBtnNormals.addEventListener("click", () => {
    state.showNormals = !state.showNormals;
    syncDOM();
    runner.draw();
  });

  elBtnReset.addEventListener("click", () => {
    state = createFaultState(state.preset);
    intro = 1;
    syncDOM();
    runner.draw();
  });

  elTrackRange.addEventListener("input", () => {
    state.tracking = Number(elTrackRange.value);
    intro = 1;
    syncDOM();
    runner.draw();
  });

  const ro = new ResizeObserver(() => {
    resize();
    runner.draw();
  });
  ro.observe(wrap);

  resize();
  syncDOM();

  const runner = loop(canvas, (_t, dt, { still }) => {
    if (still) {
      intro = 1;
      drawScene(1);
      dirty = false;
      return;
    }
    if (intro < 1) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 1.15);
      // 缓出曲线让开场 0.9 秒时已呈饱满优美态势
      const eased = 1 - Math.pow(1 - intro, 3);
      drawScene(eased);
      dirty = false;
    } else if (dirty) {
      drawScene(1);
      dirty = false;
    }
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      dirty = true;
      runner.draw();
    });
  }
}

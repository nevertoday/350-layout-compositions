// 144 框架版式 · 三个轻量 2D Canvas 模块（高 DPR、降级一致、尊重 reducedMotion、软件渲染 60fps 优化）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";

const COL = {
  paper: "#F9F0E3",
  sand: "#EFE3D1",
  teal: "#032D35",
  tealMid: "rgba(3, 45, 53, 0.55)",
  ochre: "#C05C21",
  ochreDeep: "#A34714",
  danger: "#B02F14",
};

function sizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// ---------- 1. Hero 叠加层：缓存 DOM 几何，合并斜纹单次 stroke，仅脏帧重画 ----------
export function mountHeroOverlay(canvas, sheetEl, getState, getEval) {
  let lastEvalStatus = "";
  let okAnim = 0;
  let dirty = true;
  let cachedLayout = null;
  let layoutDirty = true;

  function measureLayout() {
    const sRect = sheetEl.getBoundingClientRect();
    if (sRect.width < 10 || sRect.height < 10) return null;
    const rel = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - sRect.left, y: r.top - sRect.top, w: r.width, h: r.height };
    };
    const zones = {};
    for (const el of sheetEl.querySelectorAll("[data-zone]")) {
      zones[el.dataset.zone] = rel(el);
    }
    const items = [...sheetEl.querySelectorAll(".spec-item")].map(rel);
    layoutDirty = false;
    cachedLayout = { w: sRect.width, h: sRect.height, zones, items };
    return cachedLayout;
  }

  const ctl = loop(canvas, (_t, dt, { still }) => {
    const state = getState();
    const ev = getEval();
    if (ev.status === "ok" && lastEvalStatus !== "ok") {
      okAnim = still ? 1 : 0.01;
      dirty = true;
    }
    if (ev.status !== "ok" && okAnim !== 0) {
      okAnim = 0;
      dirty = true;
    }
    lastEvalStatus = ev.status;

    let animating = false;
    if (!still && okAnim > 0 && okAnim < 1) {
      okAnim = Math.min(1, okAnim + dt * 1.8);
      animating = true;
    } else if (still && ev.status === "ok") {
      okAnim = 1;
    }

    if (!dirty && !animating && !layoutDirty) return;
    dirty = false;

    const layout = layoutDirty || !cachedLayout ? measureLayout() : cachedLayout;
    if (!layout) return;

    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    // 绘制选中分区的真实框内呼吸留白标注
    const pad = state.padding;
    if (state.selected !== "outer" && state.zones[state.selected] !== "none") {
      const r = layout.zones[state.selected];
      if (r) {
        const isTight = pad < 12;
        const isLoose = pad > 26;
        const markColor = isTight || isLoose ? COL.danger : COL.ochreDeep;

        ctx.fillStyle = isTight || isLoose ? "rgba(176, 47, 20, 0.13)" : "rgba(192, 92, 33, 0.13)";
        ctx.fillRect(r.x + 1, r.y + 1, Math.min(pad, r.w * 0.4), r.h - 2);
        ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, Math.min(pad, r.h * 0.4));

        // 水平尺寸卡尺箭（落在下沿左侧空白，避免压住内容文字）
        const ay = r.y + r.h - 9;
        const ax1 = r.x + 2;
        const ax2 = r.x + Math.max(5, pad);
        ctx.strokeStyle = markColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ax1, ay - 3.5);
        ctx.lineTo(ax1, ay + 3.5);
        ctx.moveTo(ax2, ay - 3.5);
        ctx.lineTo(ax2, ay + 3.5);
        ctx.moveTo(ax1, ay);
        ctx.lineTo(ax2, ay);
        ctx.stroke();

        // 清晰尺寸小签：骑压在选中分区顶边正中
        const tag = `内距 ${Math.round(pad)}px`;
        ctx.font = '700 10.5px "Outfit", "Noto Sans SC", sans-serif';
        const tw = ctx.measureText(tag).width + 10;
        const tx = Math.min(w - tw - 4, Math.max(4, r.x + r.w * 0.5 - tw * 0.5));
        const ty = Math.max(2, r.y - 9);
        ctx.fillStyle = markColor;
        ctx.fillRect(tx, ty, tw, 17);
        ctx.fillStyle = "#FDF8F0";
        ctx.fillText(tag, tx + 5, ty + 12);
      }
    }

    // 1+1=3 冲突夹缝透视（将所有斜纹合并为单次 stroke，大幅降低绘制开销）
    const showNoise = state.xray || (ev.conflictEdges >= 3 && (state.itemBoxes || ev.heavyCount >= 3));
    if (showNoise && ev.conflictEdges > 0) {
      const rects = layout.zones;
      const bands = [];
      const pairs = [
        ["art", "brief", "h"],
        ["list", "callout", "h"],
        ["art", "list", "v"],
        ["brief", "callout", "v"],
      ];
      for (const [a, b, dir] of pairs) {
        const ma = state.zones[a];
        const mb = state.zones[b];
        const ra = rects[a];
        const rb = rects[b];
        if (!ra || !rb) continue;
        const clash =
          (ma === "heavy" || ma === "hairline") &&
          (mb === "heavy" || mb === "hairline") &&
          (ma === "heavy" || mb === "heavy" || ev.framedZones === 4);
        if (!clash) continue;

        if (dir === "v" && Math.abs(ra.y - rb.y) < 40 && rb.x > ra.x + ra.w - 4) {
          const gx = ra.x + ra.w;
          const gw = Math.max(6, rb.x - gx);
          const gy = Math.max(ra.y, rb.y);
          const gh = Math.min(ra.y + ra.h, rb.y + rb.h) - gy;
          if (gw >= 2 && gh >= 2) bands.push({ x: gx, y: gy, w: gw, h: gh, label: "1+1=3" });
        } else if (dir === "h" && rb.y > ra.y + ra.h - 4 && Math.abs(ra.x - rb.x) < 40) {
          const gy = ra.y + ra.h;
          const gh = Math.max(6, rb.y - gy);
          const gx = Math.max(ra.x, rb.x);
          const gw = Math.min(ra.x + ra.w, rb.x + rb.w) - gx;
          if (gw >= 2 && gh >= 2) bands.push({ x: gx, y: gy, w: gw, h: gh, label: "1+1=3" });
        }
      }

      if (state.itemBoxes && layout.items.length > 1) {
        for (let i = 0; i < layout.items.length - 1; i++) {
          const a = layout.items[i];
          const b = layout.items[i + 1];
          const gy = a.y + a.h;
          const gh = Math.max(4, b.y - gy);
          if (a.w >= 2 && gh >= 2) bands.push({ x: a.x, y: gy, w: a.w, h: gh, label: i === 0 ? "套娃" : "" });
        }
      }

      if (bands.length) {
        const alpha = state.xray ? 0.85 : 0.48;
        ctx.fillStyle = `rgba(176, 47, 20, ${0.16 * alpha})`;
        for (const b of bands) ctx.fillRect(b.x, b.y, b.w, b.h);

        // 单次批量绘制所有夹缝斜线（仅 1 次 stroke 调用！）
        ctx.save();
        ctx.beginPath();
        for (const b of bands) ctx.rect(b.x, b.y, b.w, b.h);
        ctx.clip();
        ctx.strokeStyle = `rgba(176, 47, 20, ${0.78 * alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (const b of bands) {
          for (let d = -b.h; d < b.w + b.h; d += 9) {
            ctx.moveTo(b.x + d, b.y);
            ctx.lineTo(b.x + d - b.h, b.y + b.h);
          }
        }
        ctx.stroke();
        ctx.restore();

        if (state.xray) {
          ctx.font = '700 10px "Outfit", "Noto Sans SC", sans-serif';
          for (const b of bands) {
            if (!b.label) continue;
            const tw = ctx.measureText(b.label).width + 8;
            const lx = Math.max(4, Math.min(w - tw - 4, b.x + b.w / 2 - tw / 2));
            const ly = Math.max(4, Math.min(h - 18, b.y + b.h / 2 - 8));
            ctx.fillStyle = COL.danger;
            ctx.fillRect(lx, ly, tw, 16);
            ctx.fillStyle = "#FDF8F0";
            ctx.fillText(b.label, lx + 4, ly + 11.5);
          }
        }
      }
    }

    // 成立 4/4 时的收束确认细线
    if (okAnim > 0) {
      ctx.save();
      const inset = 6;
      const perim = 2 * ((w - inset * 2) + (h - inset * 2));
      ctx.strokeStyle = "rgba(192, 92, 33, 0.55)";
      ctx.lineWidth = 2;
      ctx.setLineDash([perim * okAnim, perim]);
      ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
      ctx.restore();
    }
  });

  return {
    markDirty(relayout = true) {
      dirty = true;
      if (relayout) layoutDirty = true;
      if (reducedMotion.matches) ctl.draw();
    },
    draw: () => {
      dirty = true;
      layoutDirty = true;
      if (reducedMotion.matches) ctl.draw();
    },
  };
}

// ---------- 2. 01 节 Canvas：Palmer (1992) 共同区域律活体实验（静止时自动休眠零重绘） ----------
export function mountGestaltCanvas(canvas, getState) {
  let curFrameAlpha = 1;
  let curPairRatio = 0.21;
  let dirty = true;

  const ctl = loop(canvas, (_t, dt, { still }) => {
    const st = getState();
    const targetFrame = st.mode === "none" ? 0 : 1;
    const targetRatio = 0.14 + (st.proximity / 100) * 0.28;
    const moving =
      Math.abs(targetFrame - curFrameAlpha) > 0.004 ||
      Math.abs(targetRatio - curPairRatio) > 0.002;

    if (!dirty && !moving) return;
    dirty = false;

    if (still || dt === 0 || !moving) {
      curFrameAlpha = targetFrame;
      curPairRatio = targetRatio;
    } else {
      const k = Math.min(1, dt * 11);
      curFrameAlpha += (targetFrame - curFrameAlpha) * k;
      curPairRatio += (targetRatio - curPairRatio) * k;
    }

    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.fillStyle = "#FDF8F0";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(3, 45, 53, 0.14)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    const padX = Math.max(24, w * 0.08);
    const span = w - padX * 2;
    const cy = h * 0.52;
    const pairStep = span / 3;
    const within = pairStep * curPairRatio;
    const r = Math.max(8, Math.min(13, w * 0.022));

    const xs = [];
    for (let g = 0; g < 3; g++) {
      const mid = padX + pairStep * (g + 0.5);
      xs.push(mid - within / 2, mid + within / 2);
    }

    const nearDist = Math.round(xs[1] - xs[0]);
    const crossDist = Math.round(xs[2] - xs[1]);

    if (curFrameAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = curFrameAlpha;
      const boxH = Math.min(h * 0.42, 74);
      const boxY = cy - boxH / 2;
      const midGap = xs[3] - xs[2];
      const margin = Math.min(r + 12, Math.max(r + 5, midGap * 0.36));

      for (const [i, j] of [
        [1, 2],
        [3, 4],
      ]) {
        const bx = xs[i] - margin;
        const bw = xs[j] - xs[i] + margin * 2;
        if (st.mode === "fill") {
          ctx.fillStyle = "rgba(192, 92, 33, 0.16)";
          ctx.fillRect(bx, boxY, bw, boxH);
          ctx.strokeStyle = COL.ochre;
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, boxY, bw, boxH);
        } else {
          ctx.strokeStyle = COL.teal;
          ctx.lineWidth = 2.5;
          ctx.strokeRect(bx, boxY, bw, boxH);
        }
      }
      ctx.restore();
    }

    // 批量画 6 颗圆点（1 次 fill）
    ctx.fillStyle = COL.teal;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      ctx.moveTo(xs[i] + r, cy);
      ctx.arc(xs[i], cy, r, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.fillStyle = COL.tealMid;
    ctx.font = '600 11px "Outfit", sans-serif';
    ctx.textAlign = "center";
    for (let i = 0; i < 6; i++) ctx.fillText(String(i + 1), xs[i], cy + r + 18);

    ctx.save();
    const arcY = cy - Math.min(h * 0.3, 52);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    if (st.mode === "none") {
      ctx.strokeStyle = COL.teal;
      ctx.beginPath();
      for (const [i, j] of [
        [0, 1],
        [2, 3],
        [4, 5],
      ]) {
        ctx.moveTo(xs[i], arcY + 8);
        ctx.lineTo(xs[i], arcY);
        ctx.lineTo(xs[j], arcY);
        ctx.lineTo(xs[j], arcY + 8);
      }
      ctx.stroke();
      ctx.fillStyle = COL.teal;
      ctx.font = '600 11px "Noto Sans SC", sans-serif';
      ctx.fillText(`按距离接近归组（对内 ${nearDist}px）`, w / 2, arcY - 8);
    } else {
      ctx.strokeStyle = COL.ochreDeep;
      ctx.beginPath();
      for (const [i, j] of [
        [1, 2],
        [3, 4],
      ]) {
        ctx.moveTo(xs[i], arcY + 8);
        ctx.lineTo(xs[i], arcY);
        ctx.lineTo(xs[j], arcY);
        ctx.lineTo(xs[j], arcY + 8);
      }
      ctx.stroke();
      ctx.fillStyle = COL.ochreDeep;
      ctx.font = '600 11px "Noto Sans SC", sans-serif';
      const msg =
        w < 430
          ? `共同区域胜出：跨距 ${crossDist}px > 近距 ${nearDist}px`
          : `共同区域反杀距离：即使跨距 ${crossDist}px > 近距 ${nearDist}px，人眼仍把框内两点判为一对`;
      ctx.fillText(msg, w / 2, arcY - 8);
    }
    ctx.restore();

    ctx.fillStyle = COL.tealMid;
    ctx.font = '600 11px "Outfit", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(`PAIR GAP ${nearDist}PX`, 14, h - 12);
    ctx.textAlign = "right";
    ctx.fillText(`CROSS GAP ${crossDist}PX`, w - 14, h - 12);
    ctx.textAlign = "start";
  });

  new ResizeObserver(() => {
    dirty = true;
    ctl.draw();
  }).observe(canvas);

  return {
    draw: () => {
      dirty = true;
      ctl.draw();
    },
  };
}

// ---------- 3. 04 节 Canvas：原海报几何重构（批量点阵 + 静止自动休眠） ----------
export function mountBreakoutCanvas(canvas, getState) {
  let animBreak = 0.5;
  let animPad = 18;
  let dirty = true;

  const ctl = loop(canvas, (_t, dt, { still }) => {
    const st = getState();
    const targetBreak = st.anchor === "inside" ? 0 : st.anchor === "straddle" ? 0.5 : 1.38;
    const moving = Math.abs(targetBreak - animBreak) > 0.004 || Math.abs(st.pad - animPad) > 0.05;

    if (!dirty && !moving) return;
    dirty = false;

    if (still || dt === 0 || !moving) {
      animBreak = targetBreak;
      animPad = st.pad;
    } else {
      const k = Math.min(1, dt * 11);
      animBreak += (targetBreak - animBreak) * k;
      animPad += (st.pad - animPad) * k;
    }

    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.fillStyle = COL.paper;
    ctx.fillRect(0, 0, w, h);

    const outerM = Math.max(24, Math.min(46, w * 0.08));
    const fx = outerM;
    const fy = outerM * 0.85;
    const fw = w - outerM * 2;
    const fh = h - outerM * 1.7;

    ctx.save();
    ctx.strokeStyle = "rgba(3, 45, 53, 0.10)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + fw, fy + fh);
    ctx.moveTo(fx + fw, fy);
    ctx.lineTo(fx, fy + fh);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = COL.teal;
    ctx.lineWidth = 3.5;
    ctx.strokeRect(fx, fy, fw, fh);

    const scalePad = Math.min(animPad * (w / 460), fw * 0.24, fh * 0.22);
    const ix = fx + scalePad;
    const iy = fy + scalePad;
    const iw = fw - scalePad * 2;
    const ih = fh - scalePad * 2;

    const padTight = st.pad < 12;
    const padLoose = st.pad > 26;
    ctx.fillStyle = padTight || padLoose ? "rgba(176, 47, 20, 0.11)" : "rgba(192, 92, 33, 0.08)";
    ctx.fillRect(fx + 2, fy + 2, fw - 4, Math.max(0, scalePad - 2));
    ctx.fillRect(fx + 2, fy + fh - scalePad, fw - 4, Math.max(0, scalePad - 2));
    ctx.fillRect(fx + 2, iy, Math.max(0, scalePad - 2), ih);
    ctx.fillRect(ix + iw, iy, Math.max(0, scalePad - 2), ih);

    ctx.save();
    ctx.strokeStyle = padTight || padLoose ? "rgba(176, 47, 20, 0.65)" : "rgba(3, 45, 53, 0.35)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.strokeRect(ix, iy, iw, ih);
    ctx.restore();

    const leftW = iw * 0.44;
    ctx.fillStyle = COL.teal;
    ctx.fillRect(ix, iy, leftW * 0.84, Math.max(16, ih * 0.14));
    ctx.fillRect(ix, iy + Math.max(22, ih * 0.18), leftW * 0.72, Math.max(16, ih * 0.14));
    ctx.fillStyle = COL.ochre;
    ctx.fillRect(ix, iy + Math.max(46, ih * 0.37), leftW * 0.56, 5);
    ctx.fillStyle = "rgba(3, 45, 53, 0.45)";
    for (let r = 0; r < 3; r++) {
      ctx.fillRect(ix, iy + Math.max(62, ih * 0.48) + r * 12, leftW * (r === 2 ? 0.65 : 0.92), 4);
    }

    const px = ix + iw * 0.5;
    const py = iy + ih * 0.3;
    const pw = iw * 0.48;
    const ph = ih * 0.56;
    ctx.fillStyle = COL.paper;
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = COL.teal;
    ctx.lineWidth = 4;
    ctx.strokeRect(px, py, pw, ph);

    const sunR = Math.min(pw, ph) * 0.14;
    ctx.beginPath();
    ctx.arc(px + pw * 0.3, py + ph * 0.34, sunR, 0, Math.PI * 2);
    ctx.fillStyle = COL.ochre;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(px + pw * 0.24, py + ph - 2);
    ctx.lineTo(px + pw * 0.66, py + ph * 0.32);
    ctx.lineTo(px + pw - 2, py + ph - 2);
    ctx.closePath();
    ctx.fillStyle = COL.teal;
    ctx.fill();

    // 批量画 20 颗点阵（1 次 fill）
    ctx.fillStyle = COL.ochre;
    ctx.beginPath();
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 5; r++) {
        const dx = ix + iw - 6 - c * 8;
        const dy = iy + 6 + r * 8;
        ctx.moveTo(dx + 1.8, dy);
        ctx.arc(dx, dy, 1.8, 0, Math.PI * 2);
      }
    }
    ctx.fill();

    const tri = Math.min(34, fw * 0.09);
    ctx.beginPath();
    ctx.moveTo(fx + fw, fy + fh);
    ctx.lineTo(fx + fw - tri, fy + fh);
    ctx.lineTo(fx + fw, fy + fh - tri);
    ctx.closePath();
    ctx.fillStyle = COL.teal;
    ctx.fill();

    const bigSq = Math.min(44, fw * 0.115);
    const smSq = Math.min(24, fw * 0.065);
    const trX = fx + fw - bigSq + bigSq * 0.52 * animBreak;
    const trY = fy - bigSq * 0.45 * animBreak;
    ctx.fillStyle = COL.ochre;
    ctx.fillRect(trX, trY, bigSq, bigSq);

    const blX = fx - smSq * 0.52 * animBreak;
    const blY = fy + fh - smSq + smSq * 0.48 * animBreak;
    ctx.fillRect(blX, blY, smSq, smSq);

    if (animBreak > 0.95) {
      ctx.save();
      ctx.strokeStyle = COL.danger;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fx + fw, fy);
      ctx.lineTo(trX, trY + bigSq);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = padTight || padLoose ? COL.danger : COL.teal;
    ctx.font = '700 11px "Outfit", sans-serif';
    ctx.fillText(`PAD ${Math.round(st.pad)}PX · ${(st.pad / 14).toFixed(2)}×`, fx + 10, fy - 8);
  });

  new ResizeObserver(() => {
    dirty = true;
    ctl.draw();
  }).observe(canvas);

  return {
    draw: () => {
      dirty = true;
      ctl.draw();
    },
  };
}

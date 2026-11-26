// 257 三列页面 · 开场 2D Canvas 三列分工与双缝配比工作台渲染与交互
import { pixelRatio } from "../../lib/stage.js";
import { evaluateLayout } from "./model.js";

const C = {
  cobalt: "#002EAA",
  cobaltDeep: "#001C6E",
  cobaltMid: "#1B46C2",
  cobaltSoft: "#DCE6FA",
  cobaltTint: "#EDF2FC",
  orange: "#F36301",
  orangeBright: "#FF7E26",
  orangeSoft: "#FDE7D4",
  cream: "#F9EED5",
  ivory: "#FDF8EC",
  sand: "#EFE2C4",
  ink: "#0B1A4A",
  inkMuted: "#3A4E82",
  line: "#2E4998",
  lineFaint: "rgba(0,46,170,0.16)",
  ok: "#0A7A5C",
  okBg: "#DCF5EC",
  bad: "#C42419",
  badBg: "#FCE5E3",
};

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function createHeroCanvas(canvas, getState, onChange) {
  const ctx = canvas.getContext("2d");
  let geom = null;
  let dragMode = null; // "s1" | "s2" | "center" | null
  let dragStart = null;
  let selectedSlot = -1; // 点击列头选中以交换列序
  let hoverTarget = null;
  let intro = 0;
  let dirty = true;
  let lastW = 0;
  let lastH = 0;
  let dotPattern = null;

  function getDotPattern(step) {
    if (dotPattern && dotPattern._step === step) return dotPattern;
    const tile = document.createElement("canvas");
    tile.width = step;
    tile.height = step;
    const tctx = tile.getContext("2d");
    tctx.fillStyle = C.cream;
    tctx.fillRect(0, 0, step, step);
    tctx.fillStyle = "rgba(0,46,170,0.09)";
    tctx.fillRect(Math.floor(step / 2), Math.floor(step / 2), 1.5, 1.5);
    const pat = ctx.createPattern(tile, "repeat");
    if (pat) pat._step = step;
    dotPattern = pat;
    return pat;
  }

  function markDirty() {
    dirty = true;
  }

  function computeGeom(W, H, ev) {
    const compact = W < 540;
    const topBarH = compact ? 32 : 38;
    const footerH = compact ? 40 : 44;
    const padOuter = compact ? 10 : 18;

    // 模拟浏览器窗体在画布内按 simulated viewport 等比呈现（让 1280 vs 560 窄屏肉眼可见收窄！）
    const availW = W - padOuter * 2;
    const vpScale = Math.max(0.56, Math.min(1, ev.state.viewport / 1200));
    const frameW = Math.round(availW * (compact ? Math.max(0.82, vpScale) : vpScale));
    const frameX = Math.round((W - frameW) / 2);
    const frameY = padOuter;
    const frameH = H - padOuter * 2 - footerH;

    const browserHeadH = compact ? 26 : 30;
    const innerPadX = compact ? 10 : 18;
    const innerPadTop = compact ? 36 : 42;
    const innerPadBot = compact ? 8 : 12;
    const contentX = frameX + innerPadX;
    const contentY = frameY + browserHeadH + innerPadTop;
    const contentW = frameW - innerPadX * 2;
    const contentH = frameH - browserHeadH - innerPadTop - innerPadBot;

    // 按当前画布实宽映射双缝距（保持与模拟 viewport 严格同比例）
    const pxRatio = contentW / Math.max(300, ev.innerW);
    const gapPx = Math.max(3, Math.round(ev.state.gutter * pxRatio));
    const tracksW = Math.max(120, contentW - gapPx * 2);

    const w0 = Math.round(tracksW * ev.state.s1);
    const w1 = Math.round(tracksW * (ev.state.s2 - ev.state.s1));
    const w2 = Math.max(24, tracksW - w0 - w1);

    const x0 = contentX;
    const x1 = x0 + w0 + gapPx;
    const x2 = x1 + w1 + gapPx;

    const seams = [
      { id: "s1", x: x0 + w0 + gapPx / 2, left: x0 + w0, right: x1, gapPx },
      { id: "s2", x: x1 + w1 + gapPx / 2, left: x1 + w1, right: x2, gapPx },
    ];

    const colRects = [
      { slot: 0, x: x0, y: contentY + ev.cols[0].topOffset * (compact ? 0.55 : 0.8), w: w0, h: contentH - ev.cols[0].topOffset * (compact ? 0.55 : 0.8) },
      { slot: 1, x: x1, y: contentY + ev.cols[1].topOffset * (compact ? 0.55 : 0.8), w: w1, h: contentH - ev.cols[1].topOffset * (compact ? 0.55 : 0.8) },
      { slot: 2, x: x2, y: contentY + ev.cols[2].topOffset * (compact ? 0.55 : 0.8), w: w2, h: contentH - ev.cols[2].topOffset * (compact ? 0.55 : 0.8) },
    ];

    const headerHits = colRects.map((r) => ({
      slot: r.slot,
      x: r.x,
      y: r.y,
      w: r.w,
      h: compact ? 30 : 34,
    }));

    const beamY = frameY + frameH + (compact ? 14 : 16);
    return {
      W,
      H,
      compact,
      topBarH,
      footerH,
      frameX,
      frameY,
      frameW,
      frameH,
      browserHeadH,
      contentX,
      contentY,
      contentW,
      contentH,
      gapPx,
      tracksW,
      seams,
      colRects,
      headerHits,
      beamY,
    };
  }

  function drawColGraphic(ctx, visual, x, y, w, h, inverted, compact) {
    if (h < 22 || w < 44) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    if (visual === "nav") {
      // 导航色条组
      const bg = inverted ? "rgba(255,255,255,0.14)" : C.cobaltTint;
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, w, h);
      const rows = Math.min(4, Math.max(2, Math.floor(h / 15)));
      for (let i = 0; i < rows; i++) {
        const ry = y + 7 + i * ((h - 14) / rows);
        ctx.fillStyle = i === 1 ? C.orange : inverted ? "rgba(251,242,220,0.65)" : C.cobalt;
        ctx.fillRect(x + 8, ry, i === 1 ? w * 0.72 : w * (0.48 + (i % 2) * 0.16), compact ? 4 : 5);
      }
    } else if (visual === "arch") {
      // 呼应 257 原海报几何图式：钴蓝弧形 + 橙日圆 + 水平条纹
      ctx.fillStyle = inverted ? "rgba(255,255,255,0.12)" : C.cream;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = inverted ? C.orangeBright : C.cobalt;
      ctx.fillRect(x, y, w * 0.34, h);
      ctx.fillStyle = inverted ? C.cream : C.orange;
      const r = Math.min(w * 0.14, h * 0.34);
      ctx.beginPath();
      ctx.arc(x + w * 0.56, y + h * 0.5, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = inverted ? "rgba(251,242,220,0.45)" : C.cobalt;
      const dotCols = Math.max(3, Math.floor((w * 0.22) / 7));
      const dotRows = Math.max(3, Math.floor((h - 10) / 8));
      ctx.beginPath();
      for (let r0 = 0; r0 < dotRows; r0++) {
        for (let c0 = 0; c0 < dotCols; c0++) {
          ctx.rect(x + w * 0.76 + c0 * 7, y + 6 + r0 * 8, 2, 2);
        }
      }
      ctx.fill();
    } else if (visual === "media") {
      // 呼应 257 原海报图文示例：三角山影 + 圆月 + 点阵
      ctx.fillStyle = inverted ? "rgba(255,255,255,0.14)" : C.cobalt;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = C.cream;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.06, y + h);
      ctx.lineTo(x + w * 0.38, y + h * 0.28);
      ctx.lineTo(x + w * 0.68, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(249,238,213,0.72)";
      ctx.beginPath();
      ctx.moveTo(x + w * 0.44, y + h);
      ctx.lineTo(x + w * 0.74, y + h * 0.44);
      ctx.lineTo(x + w * 0.98, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C.orangeBright;
      ctx.beginPath();
      ctx.arc(x + w * 0.76, y + h * 0.26, Math.min(7, h * 0.16), 0, Math.PI * 2);
      ctx.fill();
    } else if (visual.startsWith("chart")) {
      ctx.fillStyle = inverted ? "rgba(255,255,255,0.12)" : C.cobaltTint;
      ctx.fillRect(x, y, w, h);
      const bars = visual === "chart-a" ? [0.42, 0.56, 0.48, 0.62] : visual === "chart-b" ? [0.58, 0.78, 0.92, 0.85] : [0.7, 0.65, 0.88, 0.96];
      const bw = Math.max(6, (w - 28) / bars.length - 6);
      bars.forEach((v, i) => {
        const bh = (h - 14) * v;
        ctx.fillStyle = i === 2 ? C.orange : inverted ? C.cream : C.cobalt;
        ctx.fillRect(x + 12 + i * (bw + 6), y + h - 7 - bh, bw, bh);
      });
    } else if (visual === "silhouette") {
      // 无五官剪影（严格遵守规范）
      ctx.fillStyle = inverted ? "rgba(255,255,255,0.14)" : C.cobalt;
      ctx.fillRect(x, y, w, h);
      const cx = x + w * 0.5;
      const r = Math.min(w * 0.18, h * 0.24);
      ctx.fillStyle = C.cream;
      ctx.beginPath();
      ctx.arc(cx, y + h * 0.36, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, y + h * 1.05, r * 1.9, Math.PI * 1.05, Math.PI * 1.95);
      ctx.fill();
    } else if (visual === "timeline") {
      ctx.fillStyle = inverted ? "rgba(255,255,255,0.12)" : C.cream;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = inverted ? C.cream : C.cobalt;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 12, y + h * 0.5);
      ctx.lineTo(x + w - 12, y + h * 0.5);
      ctx.stroke();
      [0.2, 0.5, 0.8].forEach((p, idx) => {
        ctx.fillStyle = idx === 1 ? C.orange : inverted ? C.cream : C.cobalt;
        ctx.beginPath();
        ctx.arc(x + w * p, y + h * 0.5, idx === 1 ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      // badges: 星标与条纹
      ctx.fillStyle = inverted ? "rgba(255,255,255,0.14)" : C.orange;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = C.cream;
      const cx = x + w * 0.5;
      const cy = y + h * 0.5;
      const r1 = Math.min(w, h) * 0.28;
      const r2 = r1 * 0.45;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const rad = i % 2 === 0 ? r1 : r2;
        const px = cx + Math.cos(a) * rad;
        const py = cy + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function render(t, dt, opts = {}) {
    const still = !!opts.still;
    const prevIntro = intro;
    intro = still ? 1 : Math.min(1, intro + (dt || 0.016) * 2.4);
    const ease = 1 - Math.pow(1 - intro, 3);

    const rect = canvas.getBoundingClientRect();
    const W = Math.max(280, Math.round(rect.width));
    const H = Math.max(220, Math.round(rect.height));
    const dpr = pixelRatio(W < 540 ? 1.5 : 2);
    const resized = W !== lastW || H !== lastH || canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr);
    if (!dirty && !resized && prevIntro >= 1 && !still) return;

    dirty = false;
    lastW = W;
    lastH = H;
    if (resized) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const st = getState();
    const ev = evaluateLayout(st);
    geom = computeGeom(W, H, ev);

    // 1. 暖米工程底纸 + 极细蓝色测绘网点（单次 pattern 填充，零循环开销）
    const step = geom.compact ? 18 : 22;
    ctx.fillStyle = getDotPattern(step) || C.cream;
    ctx.fillRect(0, 0, W, H);

    // 如果处于窄屏模拟，画出外侧桌面留白阴影对比区
    if (geom.frameX > 26 && ev.state.viewport < 1020) {
      ctx.fillStyle = "rgba(0,46,170,0.06)";
      ctx.fillRect(10, geom.frameY, geom.frameX - 18, geom.frameH);
      ctx.fillRect(geom.frameX + geom.frameW + 8, geom.frameY, W - (geom.frameX + geom.frameW) - 18, geom.frameH);
      ctx.save();
      ctx.fillStyle = C.inkMuted;
      ctx.font = `600 10px "Space Mono", monospace`;
      ctx.textAlign = "center";
      ctx.fillText(`VIEWPORT ${ev.state.viewport}px`, W / 2, geom.frameY - 4);
      ctx.restore();
    }

    // 2. 迷你浏览器外框（锐利建筑直角，贴合 257 原海报语言）
    const { frameX, frameY, frameW, frameH, browserHeadH } = geom;
    ctx.fillStyle = C.ivory;
    ctx.fillRect(frameX, frameY, frameW, frameH);
    ctx.strokeStyle = C.cobalt;
    ctx.lineWidth = 2;
    ctx.strokeRect(frameX + 1, frameY + 1, frameW - 2, frameH - 2);

    // 浏览器顶条（钴蓝底 + 三点 + 站名 + 实时宽比）
    ctx.fillStyle = C.cobalt;
    ctx.fillRect(frameX, frameY, frameW, browserHeadH);
    const dotY = frameY + browserHeadH / 2;
    [C.orangeBright, C.cream, "rgba(249,238,213,0.5)"].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(frameX + 14 + i * 11, dotY, 3.2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = C.cream;
    ctx.font = `700 ${geom.compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(ev.scenario.siteTitle, frameX + 48, dotY + 0.5);

    ctx.font = `700 ${geom.compact ? 10 : 11}px "Space Mono", monospace`;
    ctx.textAlign = "right";
    ctx.fillStyle = C.orangeBright;
    ctx.fillText(
      `${ev.state.viewport}px · ${ev.pcts.join(":")}`,
      frameX + frameW - 12,
      dotY + 0.5
    );

    // 3. 顶部三列比例标尺条（在内容区正上方，留出缝宽徽标空间不重叠）
    const rulerY = frameY + browserHeadH + (geom.compact ? 11 : 13);
    ev.cols.forEach((col, idx) => {
      const r = geom.colRects[idx];
      const isBadW = col.px < 170 || (col.isPrimary && col.cpl > 40);
      ctx.fillStyle = isBadW ? C.badBg : col.isFocus ? C.orangeSoft : C.cobaltTint;
      ctx.fillRect(r.x, rulerY - 9, r.w, 18);
      ctx.strokeStyle = isBadW ? C.bad : col.isFocus ? C.orange : C.line;
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + 0.5, rulerY - 8.5, r.w - 1, 17);

      ctx.fillStyle = isBadW ? C.bad : col.isFocus ? "#A33B00" : C.cobalt;
      ctx.font = `700 ${geom.compact ? 9.5 : 10.5}px "Space Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = r.w > 118 ? `${col.pct}% · ${col.px}px` : `${col.pct}%`;
      ctx.fillText(label, r.x + r.w / 2, rulerY + 0.5);
    });

    // 如果未对齐，画顶部水平基线参考虚线，直观暴露锯齿错顶
    if (ev.state.showGuides && !ev.state.aligned) {
      ctx.save();
      ctx.strokeStyle = C.bad;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(geom.contentX, geom.contentY);
      ctx.lineTo(geom.contentX + geom.contentW, geom.contentY);
      ctx.stroke();
      ctx.restore();
    }

    // 4. 绘制三列真实内容卡（带开场丝滑落位）
    ev.cols.forEach((col, idx) => {
      const r = geom.colRects[idx];
      const drop = (1 - ease) * (10 + idx * 6);
      const rx = r.x;
      const ry = r.y + drop;
      const rw = r.w;
      const rh = Math.max(40, r.h - drop);

      // 决定三列视觉底色（根据 contrast 模式：flat / focal / clash）
      let bg = C.cream;
      let border = C.line;
      let headBg = C.cobaltTint;
      let headFg = C.cobalt;
      let textFg = C.ink;
      let subFg = C.inkMuted;
      let inverted = false;

      if (ev.state.contrast === "flat") {
        bg = C.ivory;
        border = "rgba(11,26,74,0.22)";
        headBg = "#F2EDE1";
        headFg = C.inkMuted;
        textFg = C.inkMuted;
      } else if (ev.state.contrast === "clash") {
        inverted = true;
        bg = idx === 1 ? C.orange : C.cobalt;
        border = idx === 1 ? C.cobalt : C.orange;
        headBg = idx === 1 ? "#C44D00" : C.cobaltDeep;
        headFg = C.cream;
        textFg = C.cream;
        subFg = "rgba(251,242,220,0.88)";
      } else if (col.isFocus) {
        // 单主突显：焦列用 257 标志钴蓝/信号橙强调
        inverted = true;
        bg = C.cobalt;
        border = C.orange;
        headBg = C.orange;
        headFg = "#FFFFFF";
        textFg = C.cream;
        subFg = "rgba(251,242,220,0.85)";
      } else {
        bg = C.cream;
        border = C.line;
        headBg = C.cobaltTint;
        headFg = C.cobalt;
        textFg = C.ink;
      }

      const isBadCol = col.px < 170;
      const isSelected = selectedSlot === idx;

      ctx.save();
      ctx.fillStyle = bg;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = isSelected ? C.orange : isBadCol ? C.bad : border;
      ctx.lineWidth = isSelected || col.isFocus ? 2.2 : 1.2;
      ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);

      // 裁切列内容防溢出
      ctx.beginPath();
      ctx.rect(rx + 1, ry + 1, rw - 2, rh - 2);
      ctx.clip();

      // 列头槽（点击可互换列序）
      const hh = geom.compact ? 26 : 28;
      ctx.fillStyle = isSelected ? C.orange : headBg;
      ctx.fillRect(rx, ry, rw, hh);

      ctx.fillStyle = isSelected ? "#FFFFFF" : headFg;
      ctx.font = `700 ${geom.compact ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const headerTxt = isSelected ? `⇄ 点别列互换` : `${idx + 1} · ${col.mod.roleLabel}`;
      ctx.fillText(headerTxt, rx + 8, ry + hh / 2 + 0.5);

      if (rw > 130 && !isSelected) {
        ctx.font = `700 9.5px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "right";
        ctx.fillStyle = isSelected ? "#FFFFFF" : col.isFocus || ev.state.contrast === "clash" ? C.cream : C.inkMuted;
        ctx.fillText(col.isFocus ? "★ 主焦" : "点换位", rx + rw - 8, ry + hh / 2 + 0.5);
      }

      // 短信号橙横杠（致敬 257 原海报三列标题下的短橙杠）
      const pad = geom.compact ? 8 : 10;
      let cy = ry + hh + (geom.compact ? 7 : 8);
      ctx.fillStyle = ev.state.contrast === "flat" ? "#B8B09E" : C.orange;
      ctx.fillRect(rx + pad, cy, Math.min(26, rw - pad * 2), 3);
      cy += geom.compact ? 9 : 10;

      // 列主标题
      const titleSize = ev.state.contrast === "flat" ? (geom.compact ? 11.5 : 12.5) : col.isFocus ? (geom.compact ? 12.5 : 14) : geom.compact ? 11.5 : 12.5;
      ctx.fillStyle = textFg;
      ctx.font = `${ev.state.contrast === "flat" ? 500 : 800} ${titleSize}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(col.mod.title, rx + pad, cy);
      cy += titleSize + (geom.compact ? 5 : 6);

      // 数据模式显示价格/指标
      if (col.mod.metric && rh > 120) {
        ctx.fillStyle = inverted ? C.orangeBright : C.orange;
        ctx.font = `700 ${geom.compact ? 12.5 : 14}px "Space Mono", "Noto Sans SC", monospace`;
        ctx.fillText(col.mod.metric, rx + pad, cy);
        cy += geom.compact ? 16 : 19;
      }

      // 配图几何块（随高度自适应，1440×900 下也稳稳露出几何配图！）
      const graphicH = Math.min(geom.compact ? 38 : 48, Math.max(0, rh - (cy - ry) - (geom.compact ? 52 : 58)));
      if (graphicH >= 20 && rw > 54) {
        drawColGraphic(ctx, col.mod.visual, rx + pad, cy, rw - pad * 2, graphicH, inverted, geom.compact);
        cy += graphicH + (geom.compact ? 6 : 8);
      }

      // 实绘逐字折行正文（与 model.js 完全一致的每行字数）
      const bodySize = geom.compact ? 10.5 : 11.5;
      const lineH = geom.compact ? 14.5 : 16.5;
      ctx.fillStyle = subFg;
      ctx.font = `400 ${bodySize}px "Noto Sans SC", sans-serif`;
      const availLines = Math.max(1, Math.floor((ry + rh - cy - 22) / lineH));
      const drawnLines = col.lines.slice(0, availLines);
      drawnLines.forEach((ln, li) => {
        ctx.fillText(ln, rx + pad, cy + li * lineH);
      });
      cy += drawnLines.length * lineH + 4;

      // 底部行宽实测徽条（每列底沿直接报「约 N 字/行」）
      if (rh > 90) {
        const chipH = 17;
        const chipY = ry + rh - chipH - 5;
        ctx.fillStyle = isBadCol
          ? C.badBg
          : inverted
          ? "rgba(0,0,0,0.24)"
          : "rgba(0,46,170,0.07)";
        ctx.fillRect(rx + pad, chipY, Math.max(40, rw - pad * 2), chipH);
        ctx.fillStyle = isBadCol ? C.bad : inverted ? C.cream : C.cobalt;
        ctx.font = `700 10px "Space Mono", "Noto Sans SC", monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const chipText = rw > 118 ? `约 ${col.cpl} 字/行 · ${col.mod.tag}` : `${col.cpl}字/行`;
        ctx.fillText(chipText, rx + pad + 5, chipY + chipH / 2 + 0.5);
      }

      ctx.restore();

      // 若未对齐，把错顶标尺画在列框正上方落差缝里，绝不遮挡列头文字！
      if (ev.state.showGuides && !ev.state.aligned && col.topOffset > 0 && ease > 0.7) {
        const gapTop = geom.contentY;
        const gapH = Math.max(8, ry - gapTop);
        ctx.save();
        ctx.fillStyle = "rgba(196,36,25,0.12)";
        ctx.fillRect(rx, gapTop, rw, gapH);
        const bw = Math.min(rw - 4, 58);
        const bx = rx + (rw - bw) / 2;
        const by = gapTop + Math.max(0, (gapH - 13) / 2);
        ctx.fillStyle = C.bad;
        ctx.fillRect(bx, by, bw, 13);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 9px "Space Mono", "Noto Sans SC", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`+${col.topOffset}px`, bx + bw / 2, by + 6.5);
        ctx.restore();
      }
    });

    // 5. 绘制双道可拖轨缝（Seam 1 & Seam 2）+ 跨缝串行红弧 / 宽缝割裂标尺
    geom.seams.forEach((seam, sIdx) => {
      const isHot = dragMode === seam.id || hoverTarget === seam.id;
      const isTight = ev.state.gutter < 14;
      const isWide = ev.state.gutter > 44;

      if (ev.state.showGuides) {
        // 缝隙底带
        ctx.fillStyle = isTight
          ? "rgba(196,36,25,0.18)"
          : isWide
          ? "rgba(243,99,1,0.16)"
          : "rgba(0,46,170,0.06)";
        ctx.fillRect(seam.left, geom.contentY, seam.gapPx, geom.contentH);

        // 中心轨线
        ctx.save();
        ctx.strokeStyle = isTight ? C.bad : isHot ? C.orange : C.cobalt;
        ctx.lineWidth = isHot ? 2.2 : 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(seam.x, geom.contentY);
        ctx.lineTo(seam.x, geom.contentY + geom.contentH);
        ctx.stroke();
        ctx.restore();

        // 窄缝串行红色跨列跳读弧
        if (isTight) {
          ctx.save();
          ctx.strokeStyle = C.bad;
          ctx.lineWidth = 1.8;
          ctx.setLineDash([3, 2]);
          const arcY1 = geom.contentY + geom.contentH * 0.42;
          const arcY2 = geom.contentY + geom.contentH * 0.6;
          [arcY1, arcY2].forEach((ay) => {
            ctx.beginPath();
            ctx.moveTo(seam.x - 16, ay);
            ctx.quadraticCurveTo(seam.x, ay - 14, seam.x + 16, ay);
            ctx.stroke();
          });
          ctx.restore();
        }
      }

      // 可拖轨缝手柄（胶囊竖柄，触控显眼）
      const handleH = geom.compact ? 40 : 48;
      const handleW = geom.compact ? 14 : 16;
      const hy = geom.contentY + geom.contentH * 0.52 - handleH / 2;
      roundRect(ctx, seam.x - handleW / 2, hy, handleW, handleH, 3);
      ctx.fillStyle = isHot ? C.orange : isTight ? C.bad : C.cobalt;
      ctx.fill();
      ctx.strokeStyle = C.cream;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 手柄双竖刻线
      ctx.fillStyle = C.cream;
      ctx.fillRect(seam.x - 2.5, hy + handleH / 2 - 7, 1.5, 14);
      ctx.fillRect(seam.x + 1, hy + handleH / 2 - 7, 1.5, 14);

      // 轨缝顶沿实测 px 标签（落在标尺与内容区之间的独立缓冲带，绝不压住标尺）
      if (ev.state.showGuides) {
        const tagW = geom.compact ? 34 : 40;
        const tagY = geom.contentY - 9;
        ctx.fillStyle = isTight ? C.bad : isWide ? C.orange : C.cobalt;
        ctx.fillRect(seam.x - tagW / 2, tagY - 7, tagW, 13);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 9px "Space Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${ev.state.gutter}px`, seam.x, tagY);
      }

      // 窄缝/宽缝浮标（仅标在第一道缝，用标准 × 替代缺字 ✕）
      if (sIdx === 0 && (isTight || isWide)) {
        const bw = geom.compact ? 72 : 84;
        const bx = Math.max(frameX + 8, Math.min(frameX + frameW - bw - 8, seam.x - bw / 2));
        const by = geom.contentY + geom.contentH * 0.34;
        ctx.fillStyle = isTight ? C.bad : C.orange;
        ctx.fillRect(bx, by, bw, 19);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 10px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isTight ? "× 跨缝串行" : "× 宽缝割裂", bx + bw / 2, by + 10);
      }
    });

    // 6. 底部视觉重心与操作提示标尺条
    const beamX = frameX;
    const beamW = frameW;
    const by = geom.beamY;
    const barW = Math.min(260, beamW * (geom.compact ? 0.44 : 0.34));
    const barX = beamX + (beamW - barW) / 2;
    const barY = by + 6;

    // 重心条轨道
    ctx.fillStyle = "rgba(0,46,170,0.14)";
    ctx.fillRect(barX, barY, barW, 5);
    // 中心基准刻度
    ctx.fillStyle = C.cobalt;
    ctx.fillRect(barX + barW / 2 - 1, barY - 4, 2, 13);
    // 实时重心圆点
    const dotX = barX + barW * (0.5 + Math.max(-0.46, Math.min(0.46, ev.cog * 1.1)));
    ctx.fillStyle = ev.ok ? C.ok : Math.abs(ev.cog) > 0.14 ? C.bad : C.orange;
    ctx.beginPath();
    ctx.arc(dotX, barY + 2.5, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.cream;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = `700 ${geom.compact ? 10 : 11}px "Space Mono", "Noto Sans SC", monospace`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = C.cobalt;
    ctx.textAlign = "left";
    ctx.fillText(geom.compact ? `重心 ${ev.cogText}` : `视觉重心 · ${ev.cogText}`, beamX + 2, barY + 2.5);

    ctx.textAlign = "right";
    ctx.fillStyle = ev.ok ? C.ok : C.bad;
    ctx.fillText(
      ev.ok ? `✓ ${ev.modeLabel}` : `${ev.score}/4 · ${ev.topIssue ? ev.topIssue.short : ""}`,
      beamX + beamW - 2,
      barY + 2.5
    );

    // 极简操作指引
    ctx.fillStyle = C.inkMuted;
    ctx.font = `400 ${geom.compact ? 10 : 11}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(
      geom.compact
        ? "拖双缝或中列调三列宽比 · 点列头互换位置"
        : "横拖两条轨缝调各列宽比 · 拖中列整体滑移中轴 · 点列头调换列序 · 方向键 ←/→ 精调",
      W / 2,
      H - 8
    );
  }

  function pointerPos(e) {
    const r = canvas.getBoundingClientRect();
    const pt = e.touches && e.touches[0] ? e.touches[0] : e;
    return { x: pt.clientX - r.left, y: pt.clientY - r.top };
  }

  function hitTest(x, y) {
    if (!geom) return null;
    // 优先检测两条轨缝手柄（ generous 22px 容差方便触屏）
    for (const s of geom.seams) {
      if (Math.abs(x - s.x) <= 22 && y >= geom.contentY - 12 && y <= geom.contentY + geom.contentH + 12) {
        return s.id;
      }
    }
    // 其次检测三列顶部槽位（点击互换列序）
    for (const h of geom.headerHits) {
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
        return `head-${h.slot}`;
      }
    }
    // 画布主体横向拖动：中列滑移中轴窗，左右列拉动邻缝
    if (y >= geom.contentY && y <= geom.contentY + geom.contentH) {
      const r1 = geom.colRects[1];
      if (x >= r1.x && x <= r1.x + r1.w) return "center";
      if (x < r1.x) return "s1";
      return "s2";
    }
    return "center";
  }

  function startDrag(x, y, pointerId) {
    if (!geom) return;
    const hit = hitTest(x, y);
    const st = getState();
    dragStart = { x, y, s1: st.s1, s2: st.s2, hit, moved: false };
    if (hit && hit.startsWith("head-")) {
      dragMode = "head";
    } else {
      dragMode = hit || "center";
    }
    if (pointerId != null && canvas.setPointerCapture) {
      try { canvas.setPointerCapture(pointerId); } catch {}
    }
  }

  function moveDrag(x, y) {
    if (!geom) return;
    if (!dragStart) {
      const h = hitTest(x, y);
      if (h !== hoverTarget) {
        hoverTarget = h;
        dirty = true;
      }
      canvas.style.cursor =
        h === "s1" || h === "s2" ? "ew-resize" : h && h.startsWith("head-") ? "pointer" : "grab";
      return;
    }
    const dx = x - dragStart.x;
    const dy = y - dragStart.y;
    if (!dragStart.moved && Math.hypot(dx, dy) > 5) {
      dragStart.moved = true;
      if (dragMode === "head") dragMode = "center";
    }
    if (!dragStart.moved) return;

    const df = dx / Math.max(120, geom.tracksW);
    const st = getState();
    if (dragMode === "s1") {
      onChange({ ...st, s1: dragStart.s1 + df });
    } else if (dragMode === "s2") {
      onChange({ ...st, s2: dragStart.s2 + df });
    } else if (dragMode === "center") {
      // 中轴窗整体水平滑移（保持中列宽不变，左右两翼此消彼长！）
      const midW = dragStart.s2 - dragStart.s1;
      const minW = 0.11;
      let ns1 = dragStart.s1 + df;
      ns1 = Math.max(minW, Math.min(1 - minW - midW, ns1));
      onChange({ ...st, s1: ns1, s2: ns1 + midW });
    }
  }

  function endDrag() {
    if (dragStart && !dragStart.moved && dragStart.hit && dragStart.hit.startsWith("head-")) {
      const slot = Number(dragStart.hit.split("-")[1]);
      const st = getState();
      if (selectedSlot === -1) {
        selectedSlot = slot;
        onChange({ ...st }); // 触发重绘选中态
      } else if (selectedSlot === slot) {
        // 再次点击同一列头：把视觉焦点切到这一列
        selectedSlot = -1;
        onChange({ ...st, focusSlot: slot, contrast: st.contrast === "flat" ? "focal" : st.contrast });
      } else {
        // 点击另一列头：互换两列模块位置
        const nextOrder = [...st.order];
        [nextOrder[selectedSlot], nextOrder[slot]] = [nextOrder[slot], nextOrder[selectedSlot]];
        let nextFocus = st.focusSlot;
        if (st.focusSlot === selectedSlot) nextFocus = slot;
        else if (st.focusSlot === slot) nextFocus = selectedSlot;
        selectedSlot = -1;
        onChange({ ...st, order: nextOrder, focusSlot: nextFocus });
      }
    }
    dragMode = null;
    dragStart = null;
    dirty = true;
  }

  // Pointer Events（仅桌面鼠标与触控笔；触屏走下方 touch 事件避免双触发并放行竖向滚屏）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const p = pointerPos(e);
    startDrag(p.x, p.y, e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const p = pointerPos(e);
    moveDrag(p.x, p.y);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    endDrag();
  });
  canvas.addEventListener("pointercancel", (e) => {
    if (e.pointerType === "touch") return;
    endDrag();
  });

  // 显式监听 Touch Events（配合 tools/perf.mjs 的 Input.dispatchTouchEvent，且不阻断竖屏页面滚动）
  let touchAxis = null;
  let t0 = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const p = pointerPos(e);
      t0 = p;
      touchAxis = null;
      startDrag(p.x, p.y, null);
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!t0 || e.touches.length !== 1) return;
      const p = pointerPos(e);
      if (!touchAxis) {
        const adx = Math.abs(p.x - t0.x);
        const ady = Math.abs(p.y - t0.y);
        if (adx > 4 || ady > 4) touchAxis = adx >= ady ? "x" : "y";
      }
      if (touchAxis === "x") {
        if (e.cancelable) e.preventDefault();
        moveDrag(p.x, p.y);
      }
    },
    { passive: false }
  );
  canvas.addEventListener("touchend", () => {
    if (touchAxis !== "y") endDrag();
    else {
      dragMode = null;
      dragStart = null;
    }
    t0 = null;
    touchAxis = null;
  });

  // 键盘无障碍操作（焦点在画布时方向键调双缝，空格键切主焦列）
  canvas.addEventListener("keydown", (e) => {
    const st = getState();
    const step = 0.02;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onChange({ ...st, s1: st.s1 - step, s2: st.s2 - step });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onChange({ ...st, s1: st.s1 + step, s2: st.s2 + step });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onChange({ ...st, s1: st.s1 - step, s2: st.s2 + step }); // 展宽中列
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onChange({ ...st, s1: st.s1 + step, s2: st.s2 - step }); // 收窄中列
    } else if (e.key === " ") {
      e.preventDefault();
      onChange({ ...st, focusSlot: (st.focusSlot + 1) % 3, contrast: "focal" });
    }
  });

  return { render, markDirty };
}

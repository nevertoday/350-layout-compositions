// 162 栏目开启页 · 开场 2D Canvas 活体跨栏切面台
// 1:1 承袭原海报暖米纸 × 构成主义朱红大箭 × 半圆弧豁口 × 立体书口阶梯切口
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, computeLayout } from "./model.js";

export function createHeroStudio(canvas, getState, updateState, onAfterRender) {
  const ctx = canvas.getContext("2d");
  let W = 900;
  let H = 560;
  let dpr = 1;
  let animFlow = getState().arrowFlow;
  let animScale = getState().titleScale;
  let intro = reducedMotion.matches ? 1 : 0;
  let lastLayout = null;
  let dragging = false;
  let dragStartX = 0;
  let dragStartFlow = 0;
  let activePointerId = null;
  let hoveredCallout = null;
  let hoverForeTab = -1;

  // 视线扫描光点（轻量粒子，最多 14 个）
  const beacons = Array.from({ length: 12 }, (_, i) => i / 12);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return false;
    dpr = pixelRatio(2);
    W = Math.round(rect.width);
    H = Math.round(rect.height);
    const pw = Math.round(W * dpr);
    const ph = Math.round(H * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    return true;
  }

  function roundedPill(x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  function drawWavy(x, y, len, amp, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const px = x + (len * i) / steps;
      const py = y + Math.sin((i / steps) * Math.PI * 5) * amp;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawFrame(t, dt, { still }) {
    if (!resize()) return;
    const state = getState();

    // 开场渐入与平滑阻尼（开场第 0.9s 已完整可读，每一帧都好看）
    if (still) {
      intro = 1;
      animFlow = state.arrowFlow;
      animScale = state.titleScale;
    } else {
      intro = Math.min(1, intro + dt * 2.8);
      const k = 1 - Math.exp(-Math.min(0.1, dt || 0.016) * 14);
      animFlow += (state.arrowFlow - animFlow) * (dragging ? 0.55 : k);
      animScale += (state.titleScale - animScale) * k;
    }

    const renderState = {
      ...state,
      arrowFlow: dragging ? state.arrowFlow : animFlow,
      titleScale: animScale,
    };
    const L = computeLayout(renderState, W, H);
    lastLayout = L;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 0. 工作台底板（沉稳暖砂色，承托立体书页阴影）
    ctx.fillStyle = "#E4D7C2";
    ctx.fillRect(0, 0, W, H);

    // 极细工程裁切角标（呼应出版印刷打样台）
    ctx.strokeStyle = "rgba(18, 19, 17, 0.16)";
    ctx.lineWidth = 1;
    const mark = 9;
    [
      [8, 8, 1, 1],
      [W - 8, 8, -1, 1],
      [8, H - 8, 1, -1],
      [W - 8, H - 8, -1, -1],
    ].forEach(([mx, my, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(mx, my + dy * mark);
      ctx.lineTo(mx, my);
      ctx.lineTo(mx + dx * mark, my);
      ctx.stroke();
    });

    // 1. 左缘：上一栏目冷灰密排尾页（视觉隔离参照）
    const pr = L.prevRect;
    ctx.save();
    ctx.fillStyle = L.theme.prevBg;
    ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
    ctx.strokeStyle = "rgba(18, 19, 17, 0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(pr.x + 0.5, pr.y + 0.5, pr.w - 1, pr.h - 1);

    // 上一栏页眉和密排灰度正文线条
    ctx.fillStyle = L.theme.prevInk;
    ctx.font = `600 ${Math.max(9, Math.round(W * 0.011))}px "Chivo", "Noto Sans SC", sans-serif`;
    ctx.fillText("上栏尾页", pr.x + 8, pr.y + 20);
    const lineGap = Math.max(9, Math.round(pr.h / 26));
    for (let y = pr.y + 34; y < pr.y + pr.h - 28; y += lineGap) {
      const lw = pr.w - 16 - ((y * 13) % Math.max(12, Math.round(pr.w * 0.34)));
      ctx.fillStyle = "rgba(70, 76, 74, 0.28)";
      ctx.fillRect(pr.x + 8, y, Math.max(18, lw), 3.2);
    }
    // 书脊阴影过渡
    const spineGrad = ctx.createLinearGradient(pr.x + pr.w - 16, 0, pr.x + pr.w, 0);
    spineGrad.addColorStop(0, "rgba(18,19,17,0)");
    spineGrad.addColorStop(1, "rgba(18,19,17,0.18)");
    ctx.fillStyle = spineGrad;
    ctx.fillRect(pr.x + pr.w - 16, pr.y, 16, pr.h);
    ctx.restore();

    // 2. 最右侧立体书口阶梯页堆（先画在开启页后层，体现书本厚度与翻口阶梯索引）
    const fe = L.foreEdgeRect;
    ctx.save();
    // 纸页侧切细纹
    ctx.fillStyle = "#F7F1E5";
    ctx.fillRect(fe.x, fe.y, fe.w, fe.h);
    ctx.strokeStyle = "rgba(18, 19, 17, 0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(fe.x + 0.5, fe.y + 0.5, fe.w - 1, fe.h - 1);
    for (let sx = fe.x + 4; sx < fe.x + fe.w - 2; sx += 4) {
      ctx.strokeStyle = "rgba(18, 19, 17, 0.08)";
      ctx.beginPath();
      ctx.moveTo(sx, fe.y + 2);
      ctx.lineTo(sx, fe.y + fe.h - 2);
      ctx.stroke();
    }

    // 三级阶梯书口切口（点击可直接切换 01/02/03 栏目！）
    L.foreTabs.forEach((ft) => {
      const r = ft.rect;
      const isBleed = state.tabStyle === "bleed";
      const isMuted = state.tabStyle === "muted";
      if (ft.active) {
        ctx.fillStyle = isBleed ? L.theme.accent : isMuted ? "#8D8A82" : "#D6CDBB";
      } else {
        ctx.fillStyle = hoverForeTab === ft.index ? "#C94729" : isBleed ? "rgba(214, 61, 30, 0.24)" : "rgba(18, 19, 17, 0.08)";
      }
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = ft.active ? "rgba(18,19,17,0.45)" : "rgba(18,19,17,0.16)";
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

      ctx.fillStyle = ft.active && (isBleed || isMuted) ? "#FAF4E8" : "#121311";
      ctx.font = `700 ${Math.max(10, Math.min(13, Math.round(r.w * 0.34)))}px "Space Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ft.num, r.x + r.w / 2, r.y + r.h / 2);
    });
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.restore();

    // 3. 主纸面：本栏目开启页（带硬朗出版投影）
    const pg = L.pageRect;
    ctx.save();
    ctx.fillStyle = "rgba(18, 19, 17, 0.14)";
    ctx.fillRect(pg.x + 5, pg.y + 6, pg.w, pg.h);

    ctx.beginPath();
    ctx.rect(pg.x, pg.y, pg.w, pg.h);
    ctx.clip();

    // 暖米原纸底
    ctx.fillStyle = L.theme.paperBg;
    ctx.fillRect(pg.x, pg.y, pg.w, pg.h);

    // 极轻瑞士网格隐线（swiss 模式稍显明晰）
    const gridAlpha = state.presetStyle === "swiss" ? 0.09 : 0.045;
    ctx.strokeStyle = `rgba(18, 19, 17, ${gridAlpha})`;
    ctx.lineWidth = 1;
    const cols = 6;
    for (let c = 1; c < cols; c++) {
      const gx = Math.round(pg.x + (pg.w * c) / cols) + 0.5;
      ctx.beginPath();
      ctx.moveTo(gx, pg.y);
      ctx.lineTo(gx, pg.y + pg.h);
      ctx.stroke();
    }

    // 4. 右缘出血朱红纵带 + 标志性巨幅半圆弧暖纸豁口（1:1 复刻 162 原海报！）
    if (state.tabStyle === "bleed") {
      const tr = L.tabRect;
      const nc = L.notchCircle;
      ctx.save();
      ctx.fillStyle = L.theme.accent;
      ctx.fillRect(tr.x, tr.y, tr.w, tr.h);

      // 用纯圆切出半圆弧暖米纸豁口，并在圆弧最右沿透露一点下一页正文细栏格！
      ctx.beginPath();
      ctx.arc(nc.cx, nc.cy, nc.r, -Math.PI / 2, Math.PI / 2, false);
      ctx.closePath();
      ctx.fillStyle = L.theme.paperBg;
      ctx.fill();

      // 半圆豁口最右弧边露出微缩「下页正文栏格」预览
      ctx.save();
      ctx.beginPath();
      ctx.arc(nc.cx, nc.cy, nc.r - 4, -Math.PI / 2, Math.PI / 2, false);
      ctx.closePath();
      ctx.clip();
      const peekX = nc.cx + Math.round(nc.r * 0.52);
      ctx.fillStyle = "rgba(18, 19, 17, 0.05)";
      ctx.fillRect(peekX, nc.cy - nc.r, nc.r, nc.r * 2);
      for (let py = nc.cy - nc.r + 16; py < nc.cy + nc.r - 12; py += 9) {
        ctx.fillStyle = "rgba(18, 19, 17, 0.16)";
        ctx.fillRect(peekX + 6, py, nc.r * 0.4, 2.5);
      }
      ctx.restore();

      // 朱红带顶部的当前栏目编号竖印
      ctx.fillStyle = "#FAF3E6";
      ctx.font = `700 ${Math.max(11, Math.round(tr.w * 0.24))}px "Space Mono", monospace`;
      ctx.fillText(`SEC.${L.section.num}`, tr.x + Math.round(tr.w * 0.16), tr.y + 30);
      ctx.fillStyle = "rgba(250, 243, 230, 0.72)";
      ctx.fillRect(tr.x + Math.round(tr.w * 0.16), tr.y + 38, Math.round(tr.w * 0.42), 2);

      // 若是色块切口解，在右带底部加一段极简白细格
      if (state.presetStyle === "slab") {
        ctx.fillStyle = "rgba(250, 243, 230, 0.85)";
        ctx.font = `700 10px "Space Mono", monospace`;
        ctx.fillText(`P.${L.section.items[0].p} →`, tr.x + Math.round(tr.w * 0.16), tr.y + tr.h - 22);
      }
      ctx.restore();
    } else if (state.tabStyle === "muted") {
      // 弱灰细条（对比说明为什么不够）
      ctx.fillStyle = "#B8B2A5";
      ctx.fillRect(L.tabRect.x, L.tabRect.y, L.tabRect.w, L.tabRect.h);
    }

    // 5. 左上刊眉（完全呼应 162 原海报左上角「版式设计原理 / LAYOUT DESIGN / 红短杠」）
    const eb = L.eyebrowRect;
    ctx.fillStyle = L.theme.accentDeep;
    ctx.font = `700 ${Math.max(10, Math.round(L.baseBodyPx * 0.86))}px "Noto Sans SC", sans-serif`;
    ctx.fillText(L.theme.issue, eb.x, eb.y + 10);
    ctx.fillStyle = L.theme.ink;
    ctx.font = `700 ${Math.max(9, Math.round(L.baseBodyPx * 0.74))}px "Chivo", sans-serif`;
    ctx.fillText(L.section.tag, eb.x, eb.y + 23);
    ctx.fillStyle = L.theme.accent;
    ctx.fillRect(eb.x, eb.y + 29, 20, 2.5);

    // 6. 巨幅粗黑栏目主标题 + 朱红英文副标
    const tr = L.titleRect;
    ctx.fillStyle = L.theme.ink;
    ctx.font = `900 ${L.titleFontPx}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText(L.section.titleA, tr.x, tr.y);
    ctx.fillText(L.section.titleB, tr.x, tr.y + L.titleLineH);
    ctx.textBaseline = "alphabetic";

    // 若大字撑爆越界，标出红色冲突框线让用户一眼看见撞击
    if (L.metrics.titleOverflowPx > 0 || L.metrics.titleRatio > 5.2) {
      ctx.save();
      ctx.strokeStyle = "#A51B14";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(tr.x - 4, tr.y - 3, tr.w + 8, tr.h + 6);
      ctx.restore();
    }

    // 朱红英文副标（对应原海报 SECTION OPENER）
    ctx.fillStyle = L.theme.accentDeep;
    ctx.font = `700 ${Math.max(10, Math.round(L.baseBodyPx * 0.95))}px "Syne", "Chivo", sans-serif`;
    ctx.fillText(`SECTION ${L.section.num} OPENER`, L.subEnRect.x, L.subEnRect.y + L.subEnRect.h * 0.78);

    // 7. 标志构成主义朱红导流大箭（1:1 复刻原海报，支持水平拖拽！）
    const ar = L.arrow;
    ctx.save();
    const arrowColor = state.arrowFlow < 0 ? "#A81C18" : L.theme.accent;
    const drawTipX = ar.startX + (ar.tipX - ar.startX) * intro;

    if (state.presetStyle === "swiss") {
      // 瑞士大字解：精炼粗黑双轨 + 朱红指示箭头，同样有清晰向右动势
      ctx.fillStyle = arrowColor;
      const barY = ar.y - ar.thickness / 2;
      if (ar.dir > 0) {
        const bodyEnd = Math.max(ar.startX + 10, drawTipX - ar.headLen * 0.7);
        ctx.fillRect(ar.startX, barY, bodyEnd - ar.startX, ar.thickness);
        ctx.beginPath();
        ctx.moveTo(bodyEnd - 6, ar.y - ar.headHalf * 0.85);
        ctx.lineTo(drawTipX, ar.y);
        ctx.lineTo(bodyEnd - 6, ar.y + ar.headHalf * 0.85);
        ctx.lineTo(bodyEnd - 18, ar.y + ar.headHalf * 0.85);
        ctx.lineTo(drawTipX - 13, ar.y);
        ctx.lineTo(bodyEnd - 18, ar.y - ar.headHalf * 0.85);
        ctx.closePath();
        ctx.fill();
      } else {
        const bodyEnd = Math.min(ar.startX - 10, drawTipX + ar.headLen * 0.7);
        ctx.fillRect(bodyEnd, barY, ar.startX - bodyEnd, ar.thickness);
        ctx.beginPath();
        ctx.moveTo(bodyEnd + 6, ar.y - ar.headHalf * 0.85);
        ctx.lineTo(drawTipX, ar.y);
        ctx.lineTo(bodyEnd + 6, ar.y + ar.headHalf * 0.85);
        ctx.lineTo(bodyEnd + 18, ar.y + ar.headHalf * 0.85);
        ctx.lineTo(drawTipX + 13, ar.y);
        ctx.lineTo(bodyEnd + 18, ar.y - ar.headHalf * 0.85);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // 原海报经典厚重全出血平直大箭
      ctx.fillStyle = arrowColor;
      const barY = ar.y - ar.thickness / 2;
      if (ar.dir > 0) {
        const bodyW = Math.max(12, drawTipX - ar.startX - ar.headLen * 0.45);
        ctx.fillRect(ar.startX, barY, bodyW, ar.thickness);
        ctx.beginPath();
        ctx.moveTo(drawTipX - ar.headLen * 0.92, ar.y - ar.headHalf);
        ctx.lineTo(drawTipX - ar.headLen * 0.56, ar.y - ar.headHalf);
        ctx.lineTo(drawTipX, ar.y);
        ctx.lineTo(drawTipX - ar.headLen * 0.56, ar.y + ar.headHalf);
        ctx.lineTo(drawTipX - ar.headLen * 0.92, ar.y + ar.headHalf);
        ctx.lineTo(drawTipX - ar.headLen * 0.36, ar.y);
        ctx.closePath();
        ctx.fill();
      } else {
        // 反指左页
        const bodyX = drawTipX + ar.headLen * 0.45;
        const bodyW = Math.max(12, ar.startX - bodyX);
        ctx.fillRect(bodyX, barY, bodyW, ar.thickness);
        ctx.beginPath();
        ctx.moveTo(drawTipX + ar.headLen * 0.92, ar.y - ar.headHalf);
        ctx.lineTo(drawTipX + ar.headLen * 0.56, ar.y - ar.headHalf);
        ctx.lineTo(drawTipX, ar.y);
        ctx.lineTo(drawTipX + ar.headLen * 0.56, ar.y + ar.headHalf);
        ctx.lineTo(drawTipX + ar.headLen * 0.92, ar.y + ar.headHalf);
        ctx.lineTo(drawTipX + ar.headLen * 0.36, ar.y);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 箭头中心线上的视线扫描光点（实时展示眼动推力，reducedMotion 下画出静态等距点）
    const spanLen = drawTipX - ar.startX;
    if (Math.abs(spanLen) > 40) {
      ctx.fillStyle = "rgba(250, 243, 230, 0.85)";
      const speed = ar.dir > 0 ? 0.32 : 0.42;
      for (let i = 0; i < beacons.length; i++) {
        const u = still ? (i + 0.5) / beacons.length : (beacons[i] + t * speed) % 1;
        const bx = ar.startX + spanLen * (0.06 + u * 0.82);
        const r = 2.1 + Math.sin(u * Math.PI) * 1.4;
        ctx.beginPath();
        ctx.arc(bx, ar.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 拖动抓握标提示（位于箭身中段的三条极简印刷抓痕）
    const gripX = Math.round(ar.startX + spanLen * 0.5);
    ctx.strokeStyle = "rgba(250, 243, 230, 0.92)";
    ctx.lineWidth = 1.6;
    [-5, 0, 5].forEach((dx) => {
      ctx.beginPath();
      ctx.moveTo(gripX + dx, ar.y - ar.thickness * 0.28);
      ctx.lineTo(gripX + dx, ar.y + ar.thickness * 0.28);
      ctx.stroke();
    });
    ctx.restore();

    // 8. 下半区：导语（原海报竖红杠引导）+ 子目路标 / 伪目录 / 空壳
    if (state.subMode === "curated" && L.leadRect) {
      // 竖朱红细线 + 简洁导语（1:1 复刻原海报左下角）
      const lr = L.leadRect;
      ctx.fillStyle = L.theme.accent;
      ctx.fillRect(lr.x, lr.y + 2, 3, Math.min(lr.h - 4, 52));
      ctx.fillStyle = L.theme.ink;
      ctx.font = `400 ${Math.max(10.5, Math.round(L.baseBodyPx * 0.88))}px "Noto Sans SC", sans-serif`;
      // 自动按字宽换行（最多 3 行）
      const chars = [...L.section.lead];
      let line = "";
      let ly = lr.y + 13;
      const maxW = lr.w - 14;
      let lineCount = 0;
      for (const ch of chars) {
        if (ctx.measureText(line + ch).width > maxW && line) {
          ctx.fillText(line, lr.x + 11, ly);
          line = ch;
          ly += Math.round(L.baseBodyPx * 1.45);
          lineCount++;
          if (lineCount >= 3) break;
        } else {
          line += ch;
        }
      }
      if (line && lineCount < 3) ctx.fillText(line, lr.x + 11, ly);

      // 左下朱红三峰波浪线（1:1 致敬 162 原海报左下角）
      drawWavy(lr.x, Math.min(pg.y + pg.h - 14, ly + 18), 44, 2.8, L.theme.accent);

      // 右侧 3 条精炼子目页码路标
      L.subItems.forEach((it) => {
        const r = it.rect;
        ctx.fillStyle = L.theme.accentDeep;
        ctx.font = `700 ${Math.max(10, Math.round(L.baseBodyPx * 0.82))}px "Space Mono", monospace`;
        ctx.fillText(it.page, r.x, r.y + r.h * 0.65);
        ctx.fillStyle = L.theme.ink;
        ctx.font = `500 ${Math.max(10, Math.round(L.baseBodyPx * 0.86))}px "Noto Sans SC", sans-serif`;
        ctx.fillText(it.text, r.x + 30, r.y + r.h * 0.65);
        ctx.strokeStyle = "rgba(18, 19, 17, 0.14)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y + r.h);
        ctx.lineTo(r.x + r.w, r.y + r.h);
        ctx.stroke();
      });
    } else if (state.subMode === "overload") {
      // 伪目录过载：8 篇密排全文提要塞死下半页，并框出虚红警示线
      const first = L.subItems[0]?.rect;
      const last = L.subItems[L.subItems.length - 1]?.rect;
      if (first && last) {
        const boxX = first.x - 6;
        const boxY = first.y - 6;
        const boxW = L.pageRect.w - (first.x - L.pageRect.x) - (state.tabStyle === "bleed" ? L.tabRect.w + 12 : 18) + 6;
        const boxH = Math.min(pg.y + pg.h - boxY - 8, last.y + last.h - boxY + 8);
        ctx.fillStyle = "rgba(165, 27, 20, 0.065)";
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.save();
        ctx.strokeStyle = "rgba(165, 27, 20, 0.52)";
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);
        ctx.restore();
      }
      L.subItems.forEach((it) => {
        const r = it.rect;
        const baseY = r.y + Math.min(11, Math.max(8, r.h * 0.78));
        if (baseY > pg.y + pg.h - 7) return;
        ctx.fillStyle = "#8C2217";
        const fz = Math.max(8.5, Math.min(10.5, r.h * 0.72));
        ctx.font = `700 ${fz.toFixed(1)}px "Space Mono", monospace`;
        ctx.fillText(it.page, r.x, baseY);
        ctx.fillStyle = "#3B3935";
        ctx.font = `400 ${Math.max(9, Math.min(11, r.h * 0.76)).toFixed(1)}px "Noto Sans SC", sans-serif`;
        // 截断至列宽避免溢出
        let label = it.text;
        const avail = Math.max(40, r.w - 28);
        while (label.length > 4 && ctx.measureText(label).width > avail) {
          label = label.slice(0, -1);
        }
        ctx.fillText(label, r.x + 25, baseY);
      });
    } else {
      // empty 空壳提示线
      const ex = L.eyebrowRect.x;
      const ey = ar.y + ar.headHalf + 24;
      ctx.save();
      ctx.strokeStyle = "rgba(165, 27, 20, 0.38)";
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(ex, ey, Math.min(280, pg.w * 0.52), 46);
      ctx.fillStyle = "#8E2017";
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.fillText("空壳区：无导语、无子目路标（读者不知本栏讲什么）", ex + 10, ey + 27);
      ctx.restore();
    }

    // 9. 干扰促销角标（双焦冲突错态）
    if (L.clutterRect) {
      const cr = L.clutterRect;
      ctx.save();
      ctx.fillStyle = "#A81C18";
      ctx.fillRect(cr.x, cr.y, cr.w, cr.h);
      ctx.strokeStyle = "#121311";
      ctx.lineWidth = 2;
      ctx.strokeRect(cr.x + 1, cr.y + 1, cr.w - 2, cr.h - 2);
      ctx.fillStyle = "#FAF4E8";
      const cf1 = Math.max(10, Math.min(15, Math.round(Math.min(cr.w * 0.135, cr.h * 0.25))));
      const cf2 = Math.max(9.5, Math.min(12, Math.round(Math.min(cr.w * 0.105, cr.h * 0.19))));
      ctx.font = `800 ${cf1}px "Noto Sans SC", sans-serif`;
      ctx.fillText(cr.w < 120 ? "特惠订阅" : "限时特惠订阅", cr.x + 9, cr.y + Math.round(cr.h * 0.44));
      ctx.font = `400 ${cf2}px "Noto Sans SC", sans-serif`;
      ctx.fillText(cr.w < 120 ? "扫码领赠品 →" : "扫码领年刊赠品 →", cr.x + 9, cr.y + Math.round(cr.h * 0.77));
      ctx.restore();
    }

    // 10. 纸面外框收边
    ctx.strokeStyle = "#121311";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pg.x + 0.75, pg.y + 0.75, pg.w - 1.5, pg.h - 1.5);
    ctx.restore(); // 结束 pageRect 裁切

    // 11. 画布上可直点的红色纠错胶囊（位于最顶层不被裁切）
    L.callouts.forEach((c) => {
      ctx.save();
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(c.label).width;
      const bw = Math.round(tw + 18);
      const bh = 24;
      const bx = clamp(Math.round(c.x - bw / 2), 10, W - bw - 10);
      const by = clamp(Math.round(c.y - bh / 2), 10, H - bh - 10);
      c._box = { x: bx, y: by, w: bw, h: bh };

      const isHover = hoveredCallout === c.id;
      roundedPill(bx, by, bw, bh, 2);
      ctx.fillStyle = isHover ? "#121311" : "#A51B14";
      ctx.fill();
      ctx.strokeStyle = "#FAF3E6";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#FAF3E6";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(c.label, bx + bw / 2, by + bh / 2 + 0.5);
      ctx.restore();
    });

    // 12. 顶部极简实况角标（与诊单共享同一套当前状态单真源）
    const truthLayout = computeLayout(state, W, H);
    ctx.save();
    ctx.font = `700 10.5px "Space Mono", "Noto Sans SC", sans-serif`;
    const hudText = `主标 ${truthLayout.metrics.titleRatio.toFixed(1)}× · 导流 ${truthLayout.metrics.forwardPct >= 0 ? "+" : ""}${truthLayout.metrics.forwardPct}% · 留白 ${truthLayout.metrics.whitespacePct}%`;
    const hw = Math.round(ctx.measureText(hudText).width + 16);
    ctx.fillStyle = "rgba(18, 19, 17, 0.88)";
    ctx.fillRect(W - hw - 12, 10, hw, 22);
    ctx.fillStyle = "#FAF3E6";
    ctx.fillText(hudText, W - hw - 4, 24.5);
    ctx.restore();

    ctx.restore(); // 结束 dpr scale
    if (onAfterRender) onAfterRender(truthLayout);
  }

  const runner = loop(canvas, drawFrame);

  // 坐标换算与命中测试
  function canvasXY(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function hitBox(p, b) {
    return b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  }

  function applyAction(action) {
    if (action === "fixClutter") updateState({ clutter: false });
    else if (action === "fixFlow") updateState({ arrowFlow: 0.86 });
    else if (action === "fixSub") updateState({ subMode: "curated" });
    else if (action === "fixTab") updateState({ tabStyle: "bleed" });
    else if (action === "fixTitle") updateState({ titleScale: 3.4 });
  }

  function handleClickPoint(pt) {
    if (!lastLayout) return false;
    // 1. 优先命中红色纠错胶囊
    for (const c of lastLayout.callouts) {
      if (hitBox(pt, c._box)) {
        applyAction(c.action);
        return true;
      }
    }
    // 2. 命中干扰角标本体直接清掉
    if (lastLayout.clutterRect && hitBox(pt, lastLayout.clutterRect)) {
      updateState({ clutter: false });
      return true;
    }
    // 3. 命中右侧立体书口阶梯 01/02/03 切栏
    for (const ft of lastLayout.foreTabs) {
      if (hitBox(pt, ft.rect)) {
        updateState({ sectionIndex: ft.index });
        return true;
      }
    }
    return false;
  }

  // 指针交互（兼容鼠标 + 触屏，触屏仅在横向滑动主导时拦截，确保页面可上下滚动）
  let touchStartX = 0;
  let touchStartY = 0;
  let movedDist = 0;

  canvas.addEventListener("pointerdown", (e) => {
    const pt = canvasXY(e.clientX, e.clientY);
    activePointerId = e.pointerId;
    dragStartX = e.clientX;
    touchStartX = e.clientX;
    touchStartY = e.clientY;
    dragStartFlow = getState().arrowFlow;
    movedDist = 0;

    // 如果点在红标、干扰块或书口阶梯上，等 pointerup 触发点击
    if (lastLayout) {
      const onDirectBtn =
        lastLayout.callouts.some((c) => hitBox(pt, c._box)) ||
        (lastLayout.clutterRect && hitBox(pt, lastLayout.clutterRect)) ||
        lastLayout.foreTabs.some((ft) => hitBox(pt, ft.rect));
      if (onDirectBtn) {
        dragging = false;
        return;
      }
    }

    dragging = true;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
  });

  canvas.addEventListener("pointermove", (e) => {
    const pt = canvasXY(e.clientX, e.clientY);
    if (dragging && e.pointerId === activePointerId) {
      const dx = e.clientX - dragStartX;
      movedDist = Math.max(movedDist, Math.abs(dx));
      const span = Math.max(180, (lastLayout ? lastLayout.pageRect.w : W) * 0.56);
      const next = clamp(dragStartFlow + dx / span, -0.65, 1.0);
      updateState({ arrowFlow: +next.toFixed(3) });
      return;
    }
    if (!lastLayout) return;
    let hc = null;
    for (const c of lastLayout.callouts) {
      if (hitBox(pt, c._box)) {
        hc = c.id;
        break;
      }
    }
    let hf = -1;
    for (const ft of lastLayout.foreTabs) {
      if (hitBox(pt, ft.rect)) {
        hf = ft.index;
        break;
      }
    }
    if (hc !== hoveredCallout || hf !== hoverForeTab) {
      hoveredCallout = hc;
      hoverForeTab = hf;
      canvas.style.cursor = hc || hf >= 0 || (lastLayout.clutterRect && hitBox(pt, lastLayout.clutterRect)) ? "pointer" : "ew-resize";
      runner.draw();
    } else {
      canvas.style.cursor = hc || hf >= 0 ? "pointer" : "ew-resize";
    }
  });

  function endDrag(e) {
    if (e.pointerId !== activePointerId) return;
    const pt = canvasXY(e.clientX, e.clientY);
    const wasClick = movedDist < 8 && Math.abs(e.clientY - touchStartY) < 12;
    dragging = false;
    activePointerId = null;
    if (wasClick) handleClickPoint(pt);
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => {
    dragging = false;
    activePointerId = null;
  });

  // 兼顾 tools/perf.mjs 派发的原生 touchstart/touchmove 事件，确保 drag 帧率采样真实重画
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      dragStartFlow = getState().arrowFlow;
      movedDist = 0;
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 4) {
        movedDist = Math.max(movedDist, Math.abs(dx));
        const span = Math.max(160, W * 0.55);
        const next = clamp(dragStartFlow + dx / span, -0.65, 1.0);
        updateState({ arrowFlow: +next.toFixed(3) });
      }
    },
    { passive: true }
  );

  // 键盘无障碍操作：左右箭头调导流方向，上下箭头调标题字号反差
  canvas.addEventListener("keydown", (e) => {
    const st = getState();
    if (e.key === "ArrowRight") {
      e.preventDefault();
      updateState({ arrowFlow: +clamp(st.arrowFlow + 0.1, -0.65, 1.0).toFixed(2) });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      updateState({ arrowFlow: +clamp(st.arrowFlow - 0.1, -0.65, 1.0).toFixed(2) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      updateState({ titleScale: +clamp(st.titleScale + 0.25, 1.1, 6.0).toFixed(2) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      updateState({ titleScale: +clamp(st.titleScale - 0.25, 1.1, 6.0).toFixed(2) });
    }
  });

  window.addEventListener("resize", () => runner.draw());

  return {
    draw: () => runner.draw(),
    applyAction,
    getLayout: () => computeLayout(getState(), W, H),
    getSize: () => ({ W, H }),
  };
}

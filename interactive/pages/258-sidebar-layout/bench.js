// 258 侧边栏页面 — 开场「活体侧边栏工作台」2D Canvas 渲染与直接交互引擎
// 严格遵循单真源：画面、文字截断、热区点击、诊单读数共用 model.js 的 computeLayout / auditLayout。
import { PALETTE as P } from "./palette.js";
import { SCENES, clamp, computeLayout, auditLayout } from "./model.js";
import { pixelRatio } from "../../lib/stage.js";

export function createBench(canvas, getState, onPatch) {
  const ctx = canvas.getContext("2d");
  let lastBox = { w: 720, h: 380 };
  let lastLayout = null;
  let lastAudit = null;

  // 轻量视觉缓动（仅用于入场与切章微反馈，不改写单真源数值）
  let intro = 0;
  let introDone = false;
  let chapterPulse = 0;
  let dirty = true;

  // 指针交互态
  let dragMode = null; // 'divider' | 'scroll' | null
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartRatio = 0.42;
  let dragStartScroll = 0;
  let dragMoved = false;
  let activePointerId = null;

  function resizeIfNeeded() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(240, Math.round(rect.height));
    const dpr = pixelRatio(2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      dirty = true;
    }
    lastBox = { w, h, dpr };
    return lastBox;
  }

  function markDirty(pulse = false) {
    dirty = true;
    if (pulse) chapterPulse = 1;
  }

  function wrapCJK(text, maxW, maxLines = 3) {
    const lines = [];
    let cur = "";
    for (const ch of text) {
      const next = cur + ch;
      if (ctx.measureText(next).width > maxW && cur.length > 0) {
        lines.push(cur);
        cur = ch;
        if (lines.length >= maxLines) break;
      } else {
        cur = next;
      }
    }
    if (cur && lines.length < maxLines) lines.push(cur);
    if (lines.length === maxLines && lines.join("").length < text.length) {
      const last = lines[maxLines - 1];
      lines[maxLines - 1] = last.length > 1 ? last.slice(0, -1) + "…" : "…";
    }
    return lines;
  }

  function drawNavIcon(kind, cx, cy, s, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.4, s * 0.12);
    const r = s * 0.5;
    if (kind === "grid") {
      const g = s * 0.14;
      const b = (s - g) * 0.44;
      roundRect(ctx, cx - r, cy - r, b, b, 1.5); ctx.fill();
      roundRect(ctx, cx + g * 0.5, cy - r, b, b, 1.5); ctx.fill();
      roundRect(ctx, cx - r, cy + g * 0.5, b, b, 1.5); ctx.fill();
      roundRect(ctx, cx + g * 0.5, cy + g * 0.5, b, b, 1.5); ctx.fill();
    } else if (kind === "heart") {
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.78);
      ctx.bezierCurveTo(cx - r * 1.25, cy + r * 0.1, cx - r * 1.05, cy - r * 0.9, cx, cy - r * 0.25);
      ctx.bezierCurveTo(cx + r * 1.05, cy - r * 0.9, cx + r * 1.25, cy + r * 0.1, cx, cy + r * 0.78);
      ctx.fill();
    } else if (kind === "doc") {
      roundRect(ctx, cx - r * 0.75, cy - r * 0.9, s * 0.75, s * 0.9, 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.35, cy - r * 0.18);
      ctx.lineTo(cx + r * 0.35, cy - r * 0.18);
      ctx.moveTo(cx - r * 0.35, cy + r * 0.24);
      ctx.lineTo(cx + r * 0.2, cy + r * 0.24);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx - r * 0.24, cy - r * 0.28, r * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - r * 0.24, cy + r * 0.65, r * 0.58, Math.PI * 1.08, Math.PI * 1.92);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r * 0.48, cy - r * 0.14, r * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawHeroGraphic(kind, x, y, w, h) {
    ctx.save();
    roundRect(ctx, x, y, w, h, 7);
    ctx.fillStyle = P.coral;
    ctx.fill();
    ctx.clip();

    if (kind === "peaks") {
      // 1:1 复刻原海报双峰山与圆日
      ctx.fillStyle = P.cardSand;
      ctx.beginPath();
      ctx.arc(x + w * 0.77, y + h * 0.26, Math.min(w, h) * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + w * 0.06, y + h);
      ctx.lineTo(x + w * 0.38, y + h * 0.36);
      ctx.lineTo(x + w * 0.58, y + h * 0.66);
      ctx.lineTo(x + w * 0.74, y + h * 0.44);
      ctx.lineTo(x + w * 0.96, y + h);
      ctx.closePath();
      ctx.fillStyle = P.bauhausSand;
      ctx.fill();
    } else if (kind === "bars") {
      const vals = [0.46, 0.78, 0.62, 0.92, 0.55];
      const bw = (w - 28) / vals.length;
      vals.forEach((v, i) => {
        const bh = (h - 24) * v;
        ctx.fillStyle = i === 3 ? P.espresso : P.cardSand;
        roundRect(ctx, x + 14 + i * bw + 3, y + h - 10 - bh, Math.max(6, bw - 8), bh, 3);
        ctx.fill();
      });
    } else if (kind === "steps") {
      const rows = 3;
      const rh = (h - 28) / rows;
      for (let i = 0; i < rows; i++) {
        const rw = (w - 28) * (0.48 + i * 0.24);
        ctx.fillStyle = i === 1 ? P.espresso : P.cardSand;
        roundRect(ctx, x + 14, y + 12 + i * (rh + 4), rw, Math.max(10, rh - 2), 4);
        ctx.fill();
      }
    } else {
      const cx = x + w * 0.5, cy = y + h * 0.5, rad = Math.min(w, h) * 0.32;
      ctx.strokeStyle = P.cardSand;
      ctx.lineWidth = Math.max(6, rad * 0.35);
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = P.espresso;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, -Math.PI * 0.5, Math.PI * 0.72);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSidebarBody(state, layout, scene, rail, isOverlay = false) {
    ctx.save();
    roundRect(ctx, rail.x, rail.y, rail.w, rail.h, isOverlay ? 8 : 0);
    ctx.fillStyle = P.coral;
    ctx.fill();
    ctx.clip();

    if (isOverlay) {
      ctx.strokeStyle = P.espresso;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const isRailMode = state.mode === "rail" && !isOverlay;
    const isTinyW = rail.w < 78;

    // 1. 顶部暖沙圆形头像（原海报微缩侧栏招牌）
    const av = layout.avatar;
    if (av.y + av.r > rail.y + 2) {
      ctx.beginPath();
      ctx.arc(rail.x + rail.w / 2, av.y, av.r, 0, Math.PI * 2);
      ctx.fillStyle = P.cardSand;
      ctx.fill();
      // 头像内极简四角星芒
      ctx.fillStyle = P.espresso;
      const sr = av.r * 0.42;
      ctx.beginPath();
      ctx.moveTo(rail.x + rail.w / 2, av.y - sr);
      ctx.lineTo(rail.x + rail.w / 2 + sr * 0.32, av.y - sr * 0.32);
      ctx.lineTo(rail.x + rail.w / 2 + sr, av.y);
      ctx.lineTo(rail.x + rail.w / 2 + sr * 0.32, av.y + sr * 0.32);
      ctx.lineTo(rail.x + rail.w / 2, av.y + sr);
      ctx.lineTo(rail.x + rail.w / 2 - sr * 0.32, av.y + sr * 0.32);
      ctx.lineTo(rail.x + rail.w / 2 - sr, av.y);
      ctx.lineTo(rail.x + rail.w / 2 - sr * 0.32, av.y - sr * 0.32);
      ctx.closePath();
      ctx.fill();
    }

    // 2. 四项真实可点导航条
    scene.nav.forEach((item, idx) => {
      const r = layout.navItemRects[idx];
      if (!r) return;
      const rx = isOverlay ? rail.x + 8 : r.x;
      const rw = isOverlay ? rail.w - 16 : r.w;
      const ry = isOverlay ? rail.y + 52 + idx * 38 : r.y;
      const rh = isOverlay ? 32 : r.h;
      const isSelected = idx === state.activeNav;
      const showActive = isSelected && state.highlight;

      if (showActive) {
        roundRect(ctx, rx, ry, rw, rh, 6);
        ctx.fillStyle = P.espresso;
        ctx.fill();
        // 左缘暖白锚条
        roundRect(ctx, rx + 2, ry + 5, 3.5, rh - 10, 2);
        ctx.fillStyle = P.paper;
        ctx.fill();
      } else {
        // 未高亮状态下底色微弱统一，体现无坐标感
        roundRect(ctx, rx, ry, rw, rh, 6);
        ctx.fillStyle = "rgba(33, 16, 6, 0.08)";
        ctx.fill();
      }

      const icoColor = showActive ? P.paper : P.espresso;
      if (isRailMode || isTinyW) {
        drawNavIcon(item.icon, rx + rw / 2, ry + rh / 2, Math.min(15, rh * 0.5), icoColor);
      } else {
        const icoCx = rx + 17;
        drawNavIcon(item.icon, icoCx, ry + rh / 2, Math.min(13, rh * 0.44), icoColor);

        // 文字槽（严格按单真源截断判定真实呈现截断感！）
        let label = item.zh;
        if (!isOverlay && layout.isTruncated) {
          const fit = Math.max(1, layout.maxFitChars);
          label = label.slice(0, fit) + "…";
        }
        ctx.fillStyle = showActive ? P.paper : P.espresso;
        ctx.font = `${showActive ? "700" : "600"} ${Math.max(11, Math.min(13, rh * 0.42))}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const maxLabelW = Math.max(14, rw - 34);
        ctx.fillText(label, rx + 30, ry + rh / 2 + 0.5, maxLabelW);

        // 若当前发生截断，在右侧打赤红截断提示边
        if (!isOverlay && layout.isTruncated && idx === 0) {
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          ctx.strokeRect(rx + 28, ry + 3, maxLabelW, rh - 6);
          ctx.setLineDash([]);
        }
      }
    });

    // 3. 原海报白色点阵虚线 + 参考支持两横线
    const lastNav = layout.navItemRects[3];
    const dotsY = isOverlay
      ? rail.y + 52 + 4 * 38 + 10
      : (lastNav ? lastNav.y + lastNav.h + 12 : rail.y + rail.h * 0.72);
    if (dotsY < rail.y + rail.h - 24 && dotsY > rail.y + 18) {
      ctx.fillStyle = "rgba(250, 242, 231, 0.85)";
      const dotCount = Math.max(3, Math.floor((rail.w - 22) / 9));
      const startX = rail.x + (rail.w - (dotCount - 1) * 9) / 2;
      for (let i = 0; i < dotCount; i++) {
        ctx.beginPath();
        ctx.arc(startX + i * 9, dotsY, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!state.clutter && dotsY + 26 < rail.y + rail.h) {
        ctx.fillStyle = "rgba(250, 242, 231, 0.75)";
        const barW = Math.max(16, rail.w - 28);
        roundRect(ctx, rail.x + 14, dotsY + 12, barW * 0.72, 4, 2); ctx.fill();
        roundRect(ctx, rail.x + 14, dotsY + 22, barW * 0.52, 4, 2); ctx.fill();
      }
    }

    // 4. 冗余杂物促销卡（可点击红叉直接清场！）
    if (state.clutter && !isOverlay) {
      const cr = layout.clutterRect;
      roundRect(ctx, cr.x, cr.y, cr.w, cr.h, 6);
      ctx.fillStyle = P.espresso;
      ctx.fill();
      ctx.strokeStyle = "#FF8B7A";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.fillStyle = "#FF8B7A";
      ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(cr.w > 70 ? "限时弹窗杂物" : "杂物", cr.x + 8, cr.y + 8, cr.w - 30);

      if (cr.w > 96) {
        ctx.fillStyle = P.sand;
        ctx.font = `400 10px "Noto Sans SC", sans-serif`;
        ctx.fillText("与主区抢夺视线", cr.x + 8, cr.y + 25, cr.w - 16);
      }

      // 可点击红叉按钮
      const xr = layout.clutterCloseRect;
      roundRect(ctx, xr.x, xr.y, xr.w, xr.h, 4);
      ctx.fillStyle = P.errLight;
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 11px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("×", xr.x + xr.w / 2, xr.y + xr.h / 2 + 0.5);
    }

    // 5. 若因未开 sticky 导致滚丢导航，在侧栏顶部画醒目警示条（左对齐避开右上折叠钮）
    if (!isOverlay && !state.sticky && state.mode !== "drawer" && layout.visibleNavCount < 4) {
      const lost = 4 - layout.visibleNavCount;
      ctx.fillStyle = P.errLight;
      ctx.fillRect(rail.x, rail.y, rail.w, 26);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const alertW = Math.max(24, rail.w - 38);
      ctx.fillText(alertW > 76 ? `↑ 滚丢 ${lost} 项（未锚定）` : `↑丢${lost}`, rail.x + 8, rail.y + 13, alertW);
    }

    // 6. 顶角收放折叠钮（完整栏 ⇄ 图标轨，与顶栏红条分槽零重叠）
    if (!isOverlay) {
      const tb = layout.toggleBtnRect;
      roundRect(ctx, tb.x, rail.y + 3, tb.w, tb.h, 4);
      ctx.fillStyle = P.espresso;
      ctx.fill();
      ctx.fillStyle = P.paper;
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(isRailMode ? "→" : "⇄", tb.x + tb.w / 2, rail.y + 3 + tb.h / 2 + 0.5);
    }

    ctx.restore();
  }

  function render(t, dt, { still }) {
    const box = resizeIfNeeded();
    const state = getState();
    const scene = SCENES[state.scene] || SCENES.course;
    const active = scene.nav[state.activeNav] || scene.nav[0];

    if (still) {
      intro = 1;
      introDone = true;
      chapterPulse = 0;
    } else {
      if (!introDone) {
        intro = Math.min(1, intro + Math.max(dt, 0.016) * 2.1);
        if (intro >= 1) introDone = true;
        dirty = true;
      }
      if (chapterPulse > 0) {
        chapterPulse = Math.max(0, chapterPulse - Math.max(dt, 0.016) * 3.5);
        dirty = true;
      }
    }

    if (!dirty) return;
    dirty = false;

    const layout = computeLayout(state, box);
    const audit = auditLayout(state, layout);
    lastLayout = layout;
    lastAudit = audit;

    ctx.setTransform(box.dpr, 0, 0, box.dpr, 0, 0);
    ctx.clearRect(0, 0, box.w, box.h);

    // 0. 外部浅测绘底纹（切到 820 平板或 390 手机时，外侧空白显出真实视口缩窄边界）
    ctx.fillStyle = P.cardCream;
    ctx.fillRect(0, 0, box.w, box.h);
    if (state.viewport < 1200) {
      ctx.save();
      ctx.strokeStyle = "rgba(93, 70, 56, 0.14)";
      ctx.lineWidth = 1;
      for (let gx = 16; gx < box.w; gx += 20) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, box.h); ctx.stroke();
      }
      ctx.fillStyle = P.inkMuted;
      ctx.font = `600 10.5px "JetBrains Mono", monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`SIM ${state.viewport}px`, 10, 8);
      ctx.restore();
    }

    const fr = layout.frame;

    // 1. 模拟网页外框（1:1 承袭 258 原海报暖米圆角卡）
    ctx.save();
    roundRect(ctx, fr.x, fr.y, fr.w, fr.h, 12);
    ctx.fillStyle = P.paper;
    ctx.fill();
    ctx.strokeStyle = audit.ok ? P.okLight : P.espresso;
    ctx.lineWidth = audit.ok ? 2 : 1.8;
    ctx.stroke();
    ctx.clip();

    // 1a. 抽屉模式下的紧凑顶栏（手绘 3 杠矢量图标，零缺字）
    if (state.mode === "drawer") {
      ctx.fillStyle = P.espresso;
      ctx.fillRect(fr.x, fr.y, fr.w, layout.headerH);
      const tb = layout.toggleBtnRect;
      roundRect(ctx, tb.x, tb.y, tb.w, tb.h, 5);
      ctx.fillStyle = P.coral;
      ctx.fill();
      ctx.fillStyle = P.espresso;
      if (!state.drawerOpen) {
        const lx = tb.x + 11;
        const ly = tb.y + tb.h / 2;
        ctx.fillRect(lx, ly - 4.5, 11, 1.8);
        ctx.fillRect(lx, ly - 0.9, 11, 1.8);
        ctx.fillRect(lx, ly + 2.7, 11, 1.8);
        ctx.font = `700 11px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("目录", lx + 15, ly + 0.5);
      } else {
        ctx.font = `700 11px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("× 收起", tb.x + tb.w / 2, tb.y + tb.h / 2 + 0.5);
      }

      ctx.fillStyle = P.paper;
      ctx.font = `700 12px "Noto Sans SC", sans-serif`;
      ctx.textAlign = state.side === "right" ? "left" : "right";
      ctx.fillText(`${scene.siteTitle} · ${active.zh}`, state.side === "right" ? fr.x + 12 : fr.x + fr.w - 12, fr.y + layout.headerH / 2 + 0.5);
    }

    // 2. 主内容区绘制（滚读文档严格裁剪在顶沿比例尺下方，彻底杜绝半截残字贴顶）
    const mr = layout.mainRect;
    const topBannerH = 24;
    ctx.save();
    ctx.beginPath();
    ctx.rect(mr.x, mr.y, mr.w, mr.h);
    ctx.clip();

    ctx.fillStyle = chapterPulse > 0 ? `rgba(246, 96, 65, ${(chapterPulse * 0.08).toFixed(3)})` : P.paper;
    ctx.fillRect(mr.x, mr.y, mr.w, mr.h);

    // 滚动正文子裁剪区：严格处于 topBannerH + 4 之下，留足呼吸间隙不与红虚框碰撞
    ctx.save();
    ctx.beginPath();
    ctx.rect(mr.x + 6, mr.y + topBannerH + 5, Math.max(20, mr.w - 22), Math.max(20, mr.h - topBannerH - 10));
    ctx.clip();

    const pad = Math.max(12, Math.min(22, Math.round(mr.w * 0.052)));
    const innerW = Math.max(40, mr.w - pad * 2 - 10);
    // 主区滚读偏移：平缓展示正文与延伸小结，保留标题层次
    const docScrollPx = state.scroll * Math.min(82, mr.h * 0.24);
    let curY = mr.y + topBannerH + pad + 4 - docScrollPx;

    // 主区章节标签 + 标题
    const split = layout.heroSplit && innerW >= 290;
    const textW = split ? Math.round(innerW * 0.55) : innerW;
    const graphicW = split ? innerW - textW - 14 : innerW;
    const graphicH = split ? Math.min(116, Math.max(76, Math.round(mr.h * 0.34))) : Math.min(82, Math.round(mr.h * 0.24));

    ctx.fillStyle = P.coralDarkText;
    ctx.font = `700 10.5px "Chivo", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`${scene.en} · ${active.en}`, mr.x + pad, curY, textW);
    curY += 16;

    // 章节标题（逐字真实折行）
    const titleSize = mr.w < 210 ? 13 : (mr.w < 320 ? 15 : 18);
    ctx.fillStyle = P.ink;
    ctx.font = `900 ${titleSize}px "Noto Sans SC", sans-serif`;
    const titleLines = wrapCJK(active.heading, textW, 2);
    titleLines.forEach((line, i) => {
      ctx.fillText(line, mr.x + pad, curY + i * (titleSize + 4));
    });
    const afterTitleY = curY + titleLines.length * (titleSize + 4) + 5;

    // 招牌朱红短横杠
    ctx.fillStyle = P.coral;
    ctx.fillRect(mr.x + pad, afterTitleY, Math.min(44, textW * 0.35), 3);

    // 中文导语（逐字折行）
    ctx.fillStyle = P.inkMuted;
    ctx.font = `400 ${mr.w < 230 ? 11 : 12}px "Noto Sans SC", sans-serif`;
    const leadLines = wrapCJK(active.lead, textW, split ? 4 : 3);
    leadLines.forEach((line, i) => {
      ctx.fillText(line, mr.x + pad, afterTitleY + 10 + i * 17);
    });
    const textBottomY = afterTitleY + 10 + leadLines.length * 17;

    // 1:1 复刻原海报双峰插画 / 场景图
    let cardsTopY;
    if (split) {
      drawHeroGraphic(active.chart, mr.x + pad + textW + 14, curY - 12, graphicW, graphicH);
      cardsTopY = Math.max(textBottomY, curY - 12 + graphicH) + 16;
    } else {
      const gy = textBottomY + 10;
      drawHeroGraphic(active.chart, mr.x + pad, gy, graphicW, graphicH);
      cardsTopY = gy + graphicH + 14;
    }

    // 下部三张原海报暖沙卡片（按单真源 cardCols 自适应 3 / 2 / 1 列）
    const cols = Math.min(layout.cardCols, innerW < 180 ? 1 : (innerW < 290 ? 2 : 3));
    const cGap = 10;
    const cardW = (innerW - cGap * (cols - 1)) / cols;
    const cardH = Math.max(66, Math.min(92, Math.round(mr.h * 0.27)));
    active.cards.forEach((c, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cx = mr.x + pad + col * (cardW + cGap);
      const cy = cardsTopY + row * (cardH + cGap);
      roundRect(ctx, cx, cy, cardW, cardH, 7);
      ctx.fillStyle = P.cardSand;
      ctx.fill();
      // 原海报三卡圆点（前两朱红，第三深焙黑）
      ctx.beginPath();
      ctx.arc(cx + 14, cy + 16, 6, 0, Math.PI * 2);
      ctx.fillStyle = c.dot === "dark" ? P.espresso : P.coral;
      ctx.fill();

      ctx.fillStyle = P.ink;
      ctx.font = `700 ${cardW < 105 ? 11 : 12}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(c.title, cx + 26, cy + 16, Math.max(20, cardW - 32));

      ctx.fillStyle = P.inkMuted;
      ctx.font = `400 10.5px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(c.line1, cx + 10, cy + 32, Math.max(20, cardW - 18));
      if (cardH >= 64) {
        ctx.fillText(c.line2, cx + 10, cy + 48, Math.max(20, cardW - 18));
      }
    });

    // 底部附加延伸段落（滚读到底部时浮现，验证真滚读！）
    const extraY = cardsTopY + Math.ceil(active.cards.length / cols) * (cardH + cGap) + 6;
    roundRect(ctx, mr.x + pad, extraY, innerW, 44, 6);
    ctx.fillStyle = P.cardCream;
    ctx.fill();
    ctx.fillStyle = P.inkMuted;
    ctx.font = `600 11px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("延伸小结：滚读到此处时，抬头看侧边栏是否仍稳稳停在视野内。", mr.x + pad + 10, extraY + 22, innerW - 20);

    // 结束滚动正文子裁剪区
    ctx.restore();

    // 如果主区被侧栏挤扁（过肥或手机硬撑），叠一层柔和赤红边界提示
    if (audit.primary && (audit.primary.id === "sidebar-fat" || audit.primary.id === "mobile-crush")) {
      ctx.strokeStyle = P.errLight;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(mr.x + 4, mr.y + topBannerH + 3, mr.w - 16, mr.h - topBannerH - 7);
      ctx.setLineDash([]);
    }

    // 主区顶沿轻薄比例尺条（完全不透明，盖稳顶边零穿帮）
    ctx.fillStyle = P.paper;
    ctx.fillRect(mr.x, mr.y, mr.w, topBannerH);
    ctx.strokeStyle = P.lineSand;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mr.x, mr.y + topBannerH); ctx.lineTo(mr.x + mr.w, mr.y + topBannerH); ctx.stroke();

    ctx.fillStyle = audit.ok ? P.okLight : P.errLight;
    ctx.font = `600 10.5px "JetBrains Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const ratioLabel = state.mode === "drawer"
      ? `主区 100% (${layout.mainSimPx}px) · 约${layout.mainCpl}字/行`
      : `侧 ${audit.pctRail}% (${layout.railSimPx}px) | 主 ${audit.pctMain}% (${layout.mainSimPx}px) · ${layout.mainCpl}字/行`;
    ctx.fillText(ratioLabel, mr.x + 10, mr.y + topBannerH / 2 + 0.5, mr.w - 22);

    // 主区右侧滚轮轨
    const st = layout.scrollTrackRect;
    roundRect(ctx, st.x, st.y + topBannerH, st.w, Math.max(30, st.h - topBannerH), 3);
    ctx.fillStyle = "rgba(33, 16, 6, 0.10)";
    ctx.fill();
    const thumbH = Math.max(24, (st.h - topBannerH) * 0.34);
    const thumbY = st.y + topBannerH + (st.h - topBannerH - thumbH) * state.scroll;
    roundRect(ctx, st.x, thumbY, st.w, thumbH, 3);
    ctx.fillStyle = P.espresso;
    ctx.fill();

    ctx.restore();

    // 3. 侧边栏（常驻模式 or 抽屉展开浮层）
    if (state.mode !== "drawer") {
      drawSidebarBody(state, layout, scene, layout.railRect, false);
    } else if (state.drawerOpen) {
      // 半透明遮罩 + 浮层抽屉
      ctx.fillStyle = "rgba(24, 11, 4, 0.42)";
      ctx.fillRect(mr.x, mr.y, mr.w, mr.h);
      drawSidebarBody(state, layout, scene, layout.railRect, true);
    }

    // 4. 中间可拖拽朱红/深焙分隔轨手柄（仅非抽屉态绘制）
    if (state.mode !== "drawer") {
      const dx = layout.dividerX;
      ctx.strokeStyle = P.espresso;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dx, fr.y);
      ctx.lineTo(dx, fr.y + fr.h);
      ctx.stroke();

      // 手柄胶囊（随入场动画轻微滑到位）
      const hy = fr.y + fr.h * 0.5 + (1 - intro) * 14;
      roundRect(ctx, dx - 9, hy - 22, 18, 44, 9);
      ctx.fillStyle = P.espresso;
      ctx.fill();
      ctx.strokeStyle = P.paper;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // 胶囊内双竖纹
      ctx.fillStyle = P.coral;
      ctx.fillRect(dx - 3, hy - 9, 2, 18);
      ctx.fillRect(dx + 1, hy - 9, 2, 18);
    }

    ctx.restore();

    // 5. 画布外底角微标（明确告知当前通过状态）
    if (audit.ok) {
      const tagText = `✓ ${audit.passPattern}`;
      ctx.font = `700 11px "JetBrains Mono", monospace`;
      const tw = ctx.measureText(tagText).width + 18;
      roundRect(ctx, fr.x + fr.w - tw - 8, fr.y + fr.h - 28, tw, 22, 5);
      ctx.fillStyle = P.okLight;
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tagText, fr.x + fr.w - tw / 2 - 8, fr.y + fr.h - 16.5);
    }
  }

  // ---------- 指针与触屏交互（兼容鼠标 + Pointer + perf.mjs 触屏横拖） ----------
  function toLocal(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function inRect(pt, rect, pad = 0) {
    return rect && pt.x >= rect.x - pad && pt.x <= rect.x + rect.w + pad && pt.y >= rect.y - pad && pt.y <= rect.y + rect.h + pad;
  }

  function handleTap(pt) {
    if (!lastLayout) return;
    const state = getState();

    // 1. 折叠 / 抽屉开关按钮
    if (inRect(pt, lastLayout.toggleBtnRect, 6)) {
      if (state.mode === "drawer") {
        onPatch({ drawerOpen: !state.drawerOpen });
      } else {
        onPatch({ mode: state.mode === "rail" ? "full" : "rail" });
      }
      return;
    }

    // 2. 侧栏底部杂物红叉清场
    if (state.clutter && state.mode !== "drawer" && inRect(pt, lastLayout.clutterCloseRect, 8)) {
      onPatch({ clutter: false });
      return;
    }

    // 3. 点击导航项真实切换章节
    const navVisible = state.mode !== "drawer" || state.drawerOpen;
    if (navVisible) {
      for (let i = 0; i < 4; i++) {
        const r = lastLayout.navItemRects[i];
        const hitRect = state.mode === "drawer"
          ? { x: lastLayout.railRect.x + 8, y: lastLayout.railRect.y + 52 + i * 38, w: lastLayout.railRect.w - 16, h: 32 }
          : r;
        if (inRect(pt, hitRect, 2)) {
          onPatch({ activeNav: i, drawerOpen: false }, { pulse: true });
          return;
        }
      }
    }

    // 4. 抽屉展开时点遮罩收起抽屉
    if (state.mode === "drawer" && state.drawerOpen && !inRect(pt, lastLayout.railRect)) {
      onPatch({ drawerOpen: false });
    }
  }

  function beginDrag(x, y) {
    const state = getState();
    dragStartX = x;
    dragStartY = y;
    dragStartRatio = state.railRatio;
    dragStartScroll = state.scroll;
    dragMoved = false;

    if (lastLayout && inRect({ x, y }, lastLayout.scrollTrackRect, 14)) {
      dragMode = "scroll";
    } else {
      dragMode = "divider";
    }
  }

  function moveDrag(x, y) {
    if (!dragMode || !lastLayout) return false;
    const dx = x - dragStartX;
    const dy = y - dragStartY;
    if (!dragMoved && Math.hypot(dx, dy) < 4) return false;

    const state = getState();
    if (dragMode === "scroll") {
      dragMoved = true;
      const trackH = Math.max(40, lastLayout.scrollTrackRect.h - 24);
      const nextScroll = clamp(dragStartScroll + dy / trackH, 0, 1);
      onPatch({ scroll: Number(nextScroll.toFixed(2)) });
      return true;
    }

    // 横向拖动才接管调宽，纵向手势交给浏览器正常滚动页面！
    if (!dragMoved && Math.abs(dy) > Math.abs(dx) * 1.15) {
      dragMode = null;
      return false;
    }
    dragMoved = true;
    const dir = state.side === "right" ? -1 : 1;
    const deltaRatio = (dx * dir) / Math.max(180, lastLayout.frame.w);
    const nextRatio = clamp(Number((dragStartRatio + deltaRatio).toFixed(3)), 0.08, 0.48);
    // 如果本来在图标轨/抽屉态，横向拖拉直接切到完整栏让用户即时手感调节
    if (state.mode !== "full") {
      onPatch({ mode: "full", drawerOpen: false, railRatio: nextRatio });
    } else {
      onPatch({ railRatio: nextRatio });
    }
    return true;
  }

  function endDrag(pt) {
    const wasTap = !dragMoved;
    dragMode = null;
    dragMoved = false;
    if (wasTap && pt) handleTap(pt);
  }

  // 鼠标 Pointer 事件
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏交由 touch 事件精细判横纵锁
    activePointerId = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    const pt = toLocal(e.clientX, e.clientY);
    beginDrag(pt.x, pt.y);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const pt = toLocal(e.clientX, e.clientY);
    if (activePointerId === e.pointerId) {
      moveDrag(pt.x, pt.y);
    } else if (lastLayout) {
      // 悬停光标提示
      const overBtn = inRect(pt, lastLayout.toggleBtnRect, 4) ||
        (getState().clutter && inRect(pt, lastLayout.clutterCloseRect, 6)) ||
        lastLayout.navItemRects.some((r) => inRect(pt, r, 2));
      canvas.style.cursor = overBtn ? "pointer" : "ew-resize";
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch" || activePointerId !== e.pointerId) return;
    activePointerId = null;
    endDrag(toLocal(e.clientX, e.clientY));
  });
  canvas.addEventListener("pointercancel", () => {
    activePointerId = null;
    dragMode = null;
  });

  // 触屏事件（完美兼容真实手机与 perf.mjs 的 Input.dispatchTouchEvent！）
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const pt = toLocal(e.touches[0].clientX, e.touches[0].clientY);
    beginDrag(pt.x, pt.y);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!e.touches.length || !dragMode) return;
    const pt = toLocal(e.touches[0].clientX, e.touches[0].clientY);
    if (moveDrag(pt.x, pt.y)) {
      e.preventDefault();
    }
  }, { passive: false });
  canvas.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    endDrag(t ? toLocal(t.clientX, t.clientY) : null);
  });

  // 鼠标滚轮直接体验主区滚读（不劫持整页滚轮：仅当按住 Shift 或指针在滚轨上时触发，避免干扰整页滚读）
  canvas.addEventListener("keydown", (e) => {
    const state = getState();
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const step = e.key === "ArrowRight" ? 0.02 : -0.02;
      const dir = state.side === "right" ? -1 : 1;
      onPatch({ mode: "full", railRatio: clamp(Number((state.railRatio + step * dir).toFixed(2)), 0.08, 0.48) });
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (state.activeNav + (e.key === "ArrowDown" ? 1 : 3)) % 4;
      onPatch({ activeNav: next }, { pulse: true });
    } else if (e.key === " ") {
      e.preventDefault();
      onPatch({ sticky: !state.sticky });
    } else if (e.key.toLowerCase() === "c") {
      onPatch({ mode: state.mode === "rail" ? "full" : "rail" });
    }
  });

  return {
    render,
    markDirty,
    getLast: () => ({ layout: lastLayout, audit: lastAudit }),
  };
}

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

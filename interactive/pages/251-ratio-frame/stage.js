// 251 比例框 · 开场主画布（三框联动·比例装裱与裁切工坊）
// 1:1 承袭原海报暖杏米纸、外圈虚线裁切安全框、四角 L 标、左上绛红比例角标、五重霞山落日与三卡联排对照。
// 支持画布直接左右横拖（data-perf-drag）、触摸友好（touch-action: pan-y）、画布内点击红标直修、慢网 CLS 跳屏动画。

import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, SCENES } from "./artwork.js";
import {
  RATIO_MAX,
  RATIO_MIN,
  TRIO_CARDS,
  clampRatio,
  evaluate,
  formatRatio,
  mapMediaRect,
  snapRatio,
} from "./model.js";

export function mountHeroStage(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  let cssW = 0;
  let cssH = 0;
  let intro = 0; // 0..1 进场展框动效
  let animRatio = state.ratio;
  let hotFixRect = null; // 画布内红标一键纠偏点击区
  let dragging = false;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startRatio = state.ratio;
  let dragLocked = false; // 区分横向拖与竖向滚屏
  let lastRenderSig = "";

  function resize(force = false) {
    if (!force && cssW > 0 && cssH > 0 && canvas.width > 0 && canvas.height > 0) return;
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const nw = Math.round(r.width);
    const nh = Math.round(r.height);
    const dpr = pixelRatio(1.5);
    const pw = Math.max(1, Math.round(nw * dpr));
    const ph = Math.max(1, Math.round(nh * dpr));
    if (nw !== cssW || nh !== cssH || canvas.width !== pw || canvas.height !== ph) {
      cssW = nw;
      cssH = nh;
      canvas.width = pw;
      canvas.height = ph;
      lastRenderSig = "";
    }
  }

  function drawLCorner(x, y, dx, dy, len) {
    ctx.beginPath();
    ctx.moveTo(x + dx * len, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * len);
    ctx.stroke();
  }

  function renderFrame(t, dt, { still }) {
    resize();
    if (still) {
      intro = 1;
      animRatio = state.ratio;
      if (state.clsRunning) {
        state.clsRunning = false;
        state.clsProgress = 1;
      }
    } else {
      if (intro < 1) intro = Math.min(1, intro + Math.max(0.016, dt) * 1.45);
      // 顺滑追随目标比例（拖曳时紧跟手感，点击按钮时有柔和弹性）
      const k = dragging ? 0.55 : Math.min(1, Math.max(0.18, dt * 15));
      animRatio += (state.ratio - animRatio) * k;
      if (Math.abs(state.ratio - animRatio) < 0.0015) animRatio = state.ratio;

      if (state.clsRunning) {
        state.clsProgress = Math.min(1, state.clsProgress + Math.max(0.016, dt) * 0.72);
        if (state.clsProgress >= 1) {
          state.clsRunning = false;
          onChange({ silentStage: true });
        }
      }
    }

    // 静置且状态未变时跳过重绘，保持极致省电与高帧率
    const sig = [
      cssW | 0,
      cssH | 0,
      intro.toFixed(3),
      animRatio.toFixed(4),
      state.enabled ? 1 : 0,
      state.fit,
      state.focusKey,
      state.scene,
      state.highlightPillar || "",
      state.clsRunning ? state.clsProgress.toFixed(3) : state.clsProgress,
    ].join("|");
    if (sig === lastRenderSig) return;
    lastRenderSig = sig;

    const dpr = canvas.width / Math.max(1, cssW);
    ctx.save();
    ctx.scale(dpr, dpr);

    // 用动画中的比例构造视觉渲染用评估（数值与 model 保持单真源一致）
    const ev = evaluate({ ...state, ratio: animRatio });
    const compact = cssW < 460;
    const ease = 1 - Math.pow(1 - intro, 3);

    // 1. 暖杏原纸背景 + 极淡制图标尺微格
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.strokeStyle = "rgba(164, 60, 69, 0.055)";
    ctx.lineWidth = 1;
    const grid = compact ? 24 : 30;
    ctx.beginPath();
    for (let gx = grid; gx < cssW; gx += grid) {
      ctx.moveTo(gx + 0.5, 0);
      ctx.lineTo(gx + 0.5, cssH);
    }
    for (let gy = grid; gy < cssH; gy += grid) {
      ctx.moveTo(0, gy + 0.5);
      ctx.lineTo(cssW, gy + 0.5);
    }
    ctx.stroke();

    // 划分上下两区：上方装裱主框区，下方同源三卡联排槽
    const padX = compact ? 14 : 26;
    const padTop = compact ? 14 : 20;
    const trioH = compact ? Math.max(118, cssH * 0.34) : Math.max(134, cssH * 0.34);
    const dividerY = cssH - trioH;
    const topStageH = dividerY - padTop - (compact ? 14 : 20);
    const topStageW = cssW - padX * 2;

    // 计算主框在 topStage 内的等比视觉尺寸（无论横竖都不超出安全域，也不拉成椭圆）
    const maxW = Math.min(topStageW * (compact ? 0.88 : 0.78), topStageW - 24);
    const maxH = Math.min(topStageH * 0.80, topStageH - (state.clsRunning ? 46 : 24));
    // 用恒定视觉面积驱动，让 1:1 / 4:3 / 16:9 切换时有真实画幅伸缩感
    const targetArea = Math.min(maxW * maxH * 0.78, (compact ? 36000 : 88000));
    let fw = Math.sqrt(targetArea * animRatio);
    let fh = Math.sqrt(targetArea / animRatio);
    if (fw > maxW) {
      fw = maxW;
      fh = fw / animRatio;
    }
    if (fh > maxH) {
      fh = maxH;
      fw = fh * animRatio;
    }
    // 进场轻展
    const drawFw = Math.max(40, fw * (0.9 + 0.1 * ease));
    const drawFh = Math.max(36, fh * (0.9 + 0.1 * ease));

    // 慢网 CLS 仿真：加载前阶段（clsProgress < 0.52）若未开比例框，框高塌缩为 4px，加载后骤然撑开把文字向下推！
    const clsLoading = state.clsRunning && state.clsProgress < 0.52;
    const clsJustLanded = state.clsRunning && state.clsProgress >= 0.52;
    const effectiveFh = clsLoading && !state.enabled ? 6 : drawFh;

    const fx = (cssW - drawFw) / 2;
    const fy = padTop + (topStageH - drawFh - (state.clsRunning ? 28 : 4)) / 2;

    // 2. 原图透视幽灵层（仅 cover 有裁切时在框外淡显，让用户直观看见「框外被裁去了什么」）
    const m = mapMediaRect(drawFw, effectiveFh, ev.natRatio, state.fit, ev.focus.x, ev.focus.y);
    if (!clsLoading && state.fit === "cover" && (m.w > drawFw + 2 || m.h > effectiveFh + 2)) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(padX * 0.4, 4, cssW - padX * 0.8, dividerY - 8);
      ctx.clip();
      ctx.globalAlpha = 0.22 * ease;
      ev.scene.draw(ctx, fx + m.x, fy + m.y, m.w, m.h);
      ctx.globalAlpha = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(164, 60, 69, 0.42)";
      ctx.lineWidth = 1;
      ctx.strokeRect(fx + m.x + 0.5, fy + m.y + 0.5, m.w - 1, m.h - 1);
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 3. 1:1 复刻原海报外圈虚线裁切框 + 四角绛红 L 标
    const outerGap = compact ? 9 : 13;
    ctx.save();
    ctx.strokeStyle = state.highlightPillar === "crop" ? PALETTE.seal : "rgba(164, 60, 69, 0.52)";
    ctx.lineWidth = state.highlightPillar === "crop" ? 1.5 : 1;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(
      fx - outerGap + 0.5,
      fy - outerGap + 0.5,
      drawFw + outerGap * 2 - 1,
      effectiveFh + outerGap * 2 - 1
    );
    ctx.setLineDash([]);
    // 四角实线 L 标
    ctx.strokeStyle = PALETTE.crimson;
    ctx.lineWidth = 1.6;
    const cornerLen = compact ? 8 : 11;
    drawLCorner(fx - outerGap, fy - outerGap, 1, 1, cornerLen);
    drawLCorner(fx + drawFw + outerGap, fy - outerGap, -1, 1, cornerLen);
    drawLCorner(fx - outerGap, fy + effectiveFh + outerGap, 1, -1, cornerLen);
    drawLCorner(fx + drawFw + outerGap, fy + effectiveFh + outerGap, -1, -1, cornerLen);
    ctx.restore();

    // 4. 主框内部渲染（含慢网骨架占位态 / 真实装裱画幅）
    ctx.save();
    ctx.beginPath();
    ctx.rect(fx, fy, drawFw, effectiveFh);
    ctx.clip();

    if (clsLoading) {
      // 慢网下载中：有比例框则稳固占位斜纹骨架，无比例框则塌成一条红细缝
      ctx.fillStyle = state.enabled ? "#EEDCD2" : "#FCE4E6";
      ctx.fillRect(fx, fy, drawFw, effectiveFh);
      if (state.enabled) {
        ctx.strokeStyle = "rgba(164, 60, 69, 0.16)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let sx = -effectiveFh; sx < drawFw + effectiveFh; sx += 16) {
          ctx.moveTo(fx + sx, fy);
          ctx.lineTo(fx + sx + effectiveFh, fy + effectiveFh);
        }
        ctx.stroke();
        // 对角虚线与中央红十字（呼应原海报 NOTE 与速查框母题）
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(164, 60, 69, 0.45)";
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + drawFw, fy + effectiveFh);
        ctx.moveTo(fx + drawFw, fy);
        ctx.lineTo(fx, fy + effectiveFh);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = PALETTE.crimsonDeep;
        ctx.font = `700 ${compact ? 11 : 12}px "Outfit", "Noto Serif SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`骨架预占中 · aspect-ratio: ${ev.cssRatioStr}`, fx + drawFw / 2, fy + effectiveFh / 2);
      }
    } else {
      // 含 contain 留边底衬（轻斜纹提示空边）
      ctx.fillStyle = "#EFE2D7";
      ctx.fillRect(fx, fy, drawFw, effectiveFh);
      if (state.fit === "contain" && ev.emptyRatio > 0.04) {
        ctx.strokeStyle = "rgba(164, 60, 69, 0.14)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let sx = -effectiveFh; sx < drawFw + effectiveFh; sx += 12) {
          ctx.moveTo(fx + sx, fy);
          ctx.lineTo(fx + sx + effectiveFh, fy + effectiveFh);
        }
        ctx.stroke();
      }
      // 绘制实绘素材
      ev.scene.draw(ctx, fx + m.x, fy + m.y, m.w, m.h);

      // 若是 fill 强行拉伸畸变，给圆形锚点画出一圈对比正圆虚线，一眼看出被压扁/拉瘦多少！
      if (state.fit === "fill" && ev.distortion > 1.12) {
        const ca = ev.scene.circleAnchor;
        const cx = fx + m.x + ca.x * m.w;
        const cy = fy + m.y + ca.y * m.h;
        const trueR = Math.min(m.w, m.h) * ca.r * 1.08;
        ctx.save();
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, trueR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = PALETTE.err;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, trueR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 若是 cover 切掉了主体，高亮主体被截的边线
      if (state.fit === "cover" && ev.subjectVisible < 0.86) {
        ctx.strokeStyle = PALETTE.err;
        ctx.lineWidth = 4;
        if (ev.cutSides.top) {
          ctx.beginPath(); ctx.moveTo(fx, fy + 2); ctx.lineTo(fx + drawFw, fy + 2); ctx.stroke();
        }
        if (ev.cutSides.bottom) {
          ctx.beginPath(); ctx.moveTo(fx, fy + effectiveFh - 2); ctx.lineTo(fx + drawFw, fy + effectiveFh - 2); ctx.stroke();
        }
        if (ev.cutSides.left) {
          ctx.beginPath(); ctx.moveTo(fx + 2, fy); ctx.lineTo(fx + 2, fy + effectiveFh); ctx.stroke();
        }
        if (ev.cutSides.right) {
          ctx.beginPath(); ctx.moveTo(fx + drawFw - 2, fy); ctx.lineTo(fx + drawFw - 2, fy + effectiveFh); ctx.stroke();
        }
      }

      // 焦心指示微圆（仅 cover 且裁切发生时在重心处标出小圆点）
      if (state.fit === "cover" && ev.cropLoss > 0.03) {
        const px = fx + drawFw * ev.focus.x;
        const py = fy + effectiveFh * ev.focus.y;
        ctx.fillStyle = "rgba(255, 251, 247, 0.92)";
        ctx.beginPath();
        ctx.arc(px, py, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = ev.subjectVisible < 0.86 ? PALETTE.err : PALETTE.crimson;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 5. 主框实线描边 + 1:1 复刻原海报左上实底绛红比例角标
    ctx.strokeStyle = ev.ok ? PALETTE.crimson : PALETTE.err;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(fx + 0.5, fy + 0.5, drawFw - 1, effectiveFh - 1);

    const badgeText = ev.ratioLabel;
    ctx.font = `700 ${compact ? 12 : 14}px "Outfit", sans-serif`;
    const bw = Math.max(44, ctx.measureText(badgeText).width + 18);
    const bh = compact ? 22 : 26;
    if (effectiveFh >= bh) {
      ctx.fillStyle = ev.ok ? PALETTE.tag : PALETTE.err;
      ctx.fillRect(fx, fy, bw, bh);
      ctx.fillStyle = "#FFFBF7";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeText, fx + bw / 2, fy + bh / 2 + 0.5);
    }

    // 右缘轻巧拉拽指示刻线（呼应画布可横拖推拉）
    const gripX = fx + drawFw + outerGap + (compact ? 6 : 9);
    const gripMidY = fy + effectiveFh / 2;
    ctx.strokeStyle = PALETTE.crimson;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gripX, gripMidY - 12);
    ctx.lineTo(gripX, gripMidY + 12);
    ctx.stroke();

    // 慢网仿真模式下的跟随文字行（亲眼目睹 CLS 跳屏 vs 稳如磐石！）
    if (state.clsRunning || (state.clsTriggeredOnce && !state.enabled)) {
      const captionY = fy + effectiveFh + outerGap + 8;
      ctx.fillStyle = state.enabled ? PALETTE.ok : PALETTE.err;
      ctx.font = `700 ${compact ? 11 : 12}px "Space Mono", "Noto Serif SC", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const clsMsg = clsLoading
        ? (state.enabled ? "文字稳居原位 · 位移 0px" : "⚠ 框高塌缩为 0 · 正文已顶上")
        : state.enabled
          ? "✓ 慢网出图完成 · 布局位移 0px（零 CLS）"
          : `× 出图瞬间正文被猛推下移 +${ev.clsShiftPx}px（高 CLS）`;
      ctx.fillText(clsMsg, cssW / 2, Math.min(dividerY - 18, captionY));
    }

    // 6. 画布内红标警报条（有问题且非加载态时浮于主框底缘，点击即可一步纠偏！）
    hotFixRect = null;
    if (!ev.ok && !clsLoading && ev.fixAction) {
      const chipText = compact ? `× ${ev.fixLabel}` : `× ${ev.stamp} · ${ev.fixLabel}`;
      ctx.font = `700 ${compact ? 11 : 12}px "Noto Serif SC", serif`;
      const tw = ctx.measureText(chipText).width;
      const cw = Math.min(cssW - 24, tw + 22);
      const ch = 26;
      const cx = (cssW - cw) / 2;
      const cy = Math.min(dividerY - ch - 6, fy + effectiveFh - ch - 8);
      ctx.fillStyle = PALETTE.err;
      ctx.fillRect(cx, cy, cw, ch);
      ctx.strokeStyle = "#FFFBF7";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + 0.5, cy + 0.5, cw - 1, ch - 1);
      ctx.fillStyle = "#FFFBF7";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(chipText, cx + cw / 2, cy + ch / 2 + 0.5, cw - 12);
      hotFixRect = { x: cx, y: cy, w: cw, h: ch, action: ev.fixAction };
    }

    // 7. 分隔细线 + 下半区「同源三卡联排对照槽」（3:4 竖图 / 4:3 霞山 / 16:9 拱窗）
    ctx.strokeStyle = "rgba(164, 60, 69, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, dividerY + 0.5);
    ctx.lineTo(cssW - padX, dividerY + 0.5);
    ctx.stroke();

    // 小区标题与实时齐平读数（窄宽下自动精简，绝不互相碰撞）
    const narrowTrio = cssW < 430;
    ctx.font = `700 ${compact ? 10.5 : 11.5}px "Noto Serif SC", serif`;
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(
      narrowTrio ? "三卡混源同排检验" : "三张混源原图同排检验（3:4 · 4:3 · 16:9）",
      padX,
      dividerY + 8
    );

    ctx.font = `700 ${compact ? 10.5 : 11.5}px "Space Mono", "Noto Serif SC", monospace`;
    ctx.fillStyle = ev.deltaH === 0 ? PALETTE.ok : PALETTE.err;
    ctx.textAlign = "right";
    ctx.fillText(
      ev.deltaH === 0
        ? (narrowTrio ? `齐平 ${ev.ratioLabel}` : `统一 ${ev.ratioLabel} · 差高 0px`)
        : (narrowTrio ? `差高 ${ev.deltaH}px` : `未设比例框 · 差高 ${ev.deltaH}px`),
      cssW - padX,
      dividerY + 8
    );

    // 绘制三张等宽联排卡
    const gap = compact ? 10 : 18;
    const cardsTotalW = cssW - padX * 2;
    const cardW = (cardsTotalW - gap * 2) / 3;
    const cardTop = dividerY + 28;
    const availCardH = cssH - cardTop - 22;

    // 计算每张卡在槽里的等比例高度（限高防越界）
    const rawCardHeights = TRIO_CARDS.map((c) => {
      const r = state.enabled ? animRatio : c.naturalRatio;
      return cardW / r;
    });
    const maxRawH = Math.max(...rawCardHeights, 1);
    const scaleH = maxRawH > availCardH ? availCardH / maxRawH : 1;

    const renderedBottoms = [];
    TRIO_CARDS.forEach((c, idx) => {
      const cx = padX + idx * (cardW + gap);
      const r = state.enabled ? animRatio : c.naturalRatio;
      const drawW = cardW * scaleH;
      const drawX = cx + (cardW - drawW) / 2;
      const drawH = Math.max(20, rawCardHeights[idx] * scaleH);
      const sc = SCENES[c.scene];
      const cm = mapMediaRect(drawW, drawH, c.naturalRatio, state.enabled ? state.fit : "cover", ev.focus.x, ev.focus.y);

      ctx.save();
      ctx.beginPath();
      ctx.rect(drawX, cardTop, drawW, drawH);
      ctx.clip();
      ctx.fillStyle = "#EFE2D7";
      ctx.fillRect(drawX, cardTop, drawW, drawH);
      sc.draw(ctx, drawX + cm.x, cardTop + cm.y, cm.w, cm.h);
      ctx.restore();

      ctx.strokeStyle = state.highlightPillar === "order" ? PALETTE.seal : PALETTE.crimson;
      ctx.lineWidth = state.enabled ? 1.3 : 1;
      ctx.strokeRect(drawX + 0.5, cardTop + 0.5, drawW - 1, drawH - 1);

      // 小角标
      const tagStr = state.enabled ? ev.ratioLabel : `原 ${c.natLabel}`;
      ctx.font = `700 10px "Outfit", sans-serif`;
      const tw = ctx.measureText(tagStr).width + 8;
      ctx.fillStyle = state.enabled ? PALETTE.crimsonBanner : PALETTE.inkMuted;
      ctx.fillRect(drawX, cardTop, tw, 15);
      ctx.fillStyle = "#FFFBF7";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(tagStr, drawX + 4, cardTop + 8);

      // 底部标题条模拟真实卡片正文，高矮错落一目了然！
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.font = `400 10.5px "Noto Serif SC", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(c.title, cx + cardW / 2, cardTop + drawH + 4);
      renderedBottoms.push({ x: drawX, w: drawW, bottom: cardTop + drawH });
    });

    // 底部齐平线 / 参差红虚线
    ctx.save();
    if (ev.deltaH === 0) {
      const yLine = renderedBottoms[0].bottom + 1.5;
      ctx.strokeStyle = PALETTE.ok;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padX, yLine);
      ctx.lineTo(cssW - padX, yLine);
      ctx.stroke();
    } else {
      ctx.strokeStyle = PALETTE.err;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      renderedBottoms.forEach((b, i) => {
        if (i === 0) ctx.moveTo(b.x, b.bottom);
        else ctx.lineTo(b.x, b.bottom);
        ctx.lineTo(b.x + b.w, b.bottom);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    ctx.restore();
  }

  const ctrl = loop(canvas, renderFrame);

  // ---------- 指针 + 触摸交互（横拖改比例、点击红标一步纠偏） ----------
  function toLocal(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function applyDragDelta(dx) {
    // 拖过画布宽度的 60% 扫完整条 9:16–21:9 比例区间
    const span = Math.max(180, cssW * 0.62);
    const next = clampRatio(startRatio + (dx / span) * (RATIO_MAX - RATIO_MIN));
    state.ratio = snapRatio(next, 0.024);
    onChange({ fromDrag: true });
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) ctrl.draw();
  }

  canvas.addEventListener("pointerdown", (e) => {
    const p = toLocal(e.clientX, e.clientY);
    if (
      hotFixRect &&
      p.x >= hotFixRect.x &&
      p.x <= hotFixRect.x + hotFixRect.w &&
      p.y >= hotFixRect.y &&
      p.y <= hotFixRect.y + hotFixRect.h
    ) {
      applyFixAction(state, hotFixRect.action);
      onChange({ fromFix: true });
      ctrl.draw();
      return;
    }
    dragging = true;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startRatio = state.ratio;
    dragLocked = e.pointerType === "mouse";
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!dragLocked) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.15) {
        dragging = false;
        return;
      }
      dragLocked = true;
    }
    applyDragDelta(dx);
  });

  const endPointer = (e) => {
    if (dragging && e.pointerId === pointerId) {
      dragging = false;
      pointerId = null;
      dragLocked = false;
    }
  };
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  // 兼容 perf.mjs 直接派发的原生 TouchEvent（不重复触发 pointer）
  let touchActive = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartRatio = state.ratio;
  let touchLocked = false;

  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (dragging || !e.touches.length) return;
      const t = e.touches[0];
      touchActive = true;
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchStartRatio = state.ratio;
      touchLocked = false;
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (dragging || !touchActive || !e.touches.length) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (!touchLocked) {
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
        if (Math.abs(dy) > Math.abs(dx) * 1.2) {
          touchActive = false;
          return;
        }
        touchLocked = true;
      }
      const span = Math.max(180, cssW * 0.62);
      const next = clampRatio(touchStartRatio + (dx / span) * (RATIO_MAX - RATIO_MIN));
      state.ratio = Math.round(next * 100) / 100;
      onChange({ fromDrag: true });
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) ctrl.draw();
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchend",
    () => {
      touchActive = false;
      touchLocked = false;
    },
    { passive: true }
  );

  // 键盘支持：聚焦画布时左右微调比例
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      state.ratio = clampRatio(Math.round((state.ratio - 0.05) * 100) / 100);
      onChange({});
      ctrl.draw();
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      state.ratio = clampRatio(Math.round((state.ratio + 0.05) * 100) / 100);
      onChange({});
      ctrl.draw();
    }
  });

  window.addEventListener("resize", () => {
    resize(true);
    ctrl.draw();
  });

  if (typeof ResizeObserver === "function") {
    new ResizeObserver(() => {
      resize(true);
      ctrl.draw();
    }).observe(canvas);
  }

  return {
    draw() {
      lastRenderSig = "";
      ctrl.draw();
    },
  };
}

export function applyFixAction(state, action) {
  if (!action) return;
  if (action.type === "fit") state.fit = action.value;
  else if (action.type === "enable") state.enabled = action.value;
  else if (action.type === "focus") state.focusKey = action.value;
  else if (action.type === "ratio") state.ratio = action.value;
  else if (action.type === "rescue") {
    state.enabled = true;
    state.fit = "cover";
    if (action.ratio != null) state.ratio = action.ratio;
    if (action.focusKey) state.focusKey = action.focusKey;
  }
}

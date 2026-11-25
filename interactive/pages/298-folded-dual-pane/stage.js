// 298 折叠双窗格 · 2D 真透视立体双折页工作台引擎
// 1:1 承袭原海报松林深绿底上的中央垂直虚线折叠轴 ○---○ 双页纸面。
// 性能优化：左右两页高清平面贴图缓存于离屏 canvas，仅在内容/比例/错态变化时重绘；
// 拖拽翻折动画每帧仅执行 20 条高精度透视切片映射与折痕光影，慢手机与软件渲染稳 60fps。

import { SCENES, clamp, evaluate, syncFoldMemory } from "./model.js";
import { loop, pixelRatio } from "../../lib/stage.js";

const C = {
  pine: "#116D57",
  pineShadow: "#0B4D3E",
  ivory: "#F6EBDC",
  ivoryEdge: "#DFD2BE",
  sand: "#E6DBC6",
  sandActive: "#DEC9A9",
  sage: "#D0D5C3",
  sageEdge: "#AEB8A2",
  sageHeader: "#7E9B81",
  creamCard: "#F1E7D4",
  orange: "#F25421",
  orangeDeep: "#B83208",
  orangeSoft: "#FF9B70",
  ink: "#163027",
  inkSoft: "#4B6156",
  white: "#FBF4E6",
  lineLight: "rgba(251, 244, 230, 0.72)",
  alertBg: "#B82914",
  alertFill: "rgba(242, 84, 33, 0.16)",
  okBadge: "#13684E",
};

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// 绘制一侧离屏圆角页面贴图（仅右侧或左侧外角圆角，靠折轴一侧微圆角如原海报）
function panePath(ctx, x, y, w, h, rOuter, rInner, side) {
  const tl = side === "left" ? rOuter : rInner;
  const tr = side === "left" ? rInner : rOuter;
  const br = side === "left" ? rInner : rOuter;
  const bl = side === "left" ? rOuter : rInner;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

export function mountStage(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  const mainBuf = document.createElement("canvas");
  const subBuf = document.createElement("canvas");
  const mainCtx = mainBuf.getContext("2d");
  const subCtx = subBuf.getContext("2d");

  let W = 720;
  let H = 480;
  let dpr = 1;
  let bufKey = "";
  let hitZones = []; // 每帧更新的真实投影点击区（主窗卡 / 副窗卡 / 折边耳签 / 跨缝警报）
  let hoverId = null;
  let dirty = true;
  let introDone = false;

  // 绘制左页（主窗 FOCUS）离屏高清贴图
  function paintMainBuffer(bw, bh, ev) {
    mainBuf.width = bw;
    mainBuf.height = bh;
    const g = mainCtx;
    g.clearRect(0, 0, bw, bh);

    const sc = SCENES[state.scene];
    const pad = Math.round(bw * 0.075);
    const rOut = Math.round(Math.min(bw, bh) * 0.055);
    const rIn = Math.round(rOut * 0.32);

    // 纸底
    panePath(g, 0, 0, bw, bh, rOut, rIn, "left");
    g.fillStyle = C.ivory;
    g.fill();

    // 若模拟 390px 窄屏且展开，叠一层挤迫告警内框
    const narrowSqueeze = state.simWidth <= 420 && !ev.isFolded;

    // 顶部左侧原海报标志炽热朱橘圆 + 右侧三条标题横杠 / 真实标题
    const topY = pad;
    const circR = Math.round(Math.min(bw * 0.115, bh * 0.095));
    const cx = pad + circR;
    const cy = topY + circR;

    g.beginPath();
    g.arc(cx, cy, circR, 0, Math.PI * 2);
    g.fillStyle = C.orange;
    g.fill();

    // 圆内极简白标（固定显示主窗占比，折叠态在主渲染层叠加 100% 避免拖过阈值重建离屏贴图）
    g.fillStyle = C.white;
    g.font = `700 ${Math.max(11, Math.round(circR * 0.46))}px "Sora", sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(`${ev.openMainPct}%`, cx, cy + 1);

    // 右上主标题区（复刻原海报三条横条 + 清晰短标题）
    const tx = cx + circR + Math.round(bw * 0.055);
    const tw = bw - tx - pad;
    g.textAlign = "left";
    g.textBaseline = "top";
    g.fillStyle = C.ink;
    const hFont = Math.max(13, Math.round(bw * 0.044));
    g.font = `700 ${hFont}px "Noto Sans SC", sans-serif`;
    g.fillText(sc.mainTitle, tx, topY + 2, tw);

    // 复刻原海报横条肌理
    const barY1 = topY + hFont + Math.round(bh * 0.025);
    const barH = Math.max(6, Math.round(bh * 0.022));
    roundRectPath(g, tx, barY1, tw * 0.94, barH, barH / 2);
    g.fillStyle = C.sand;
    g.fill();

    roundRectPath(g, tx, barY1 + barH + Math.round(bh * 0.018), tw * 0.72, barH, barH / 2);
    g.fillStyle = C.sand;
    g.fill();

    // 中央大内容画布区（原海报大暖砂矩形，内含选中条目联动正文）
    const heroY = cy + circR + Math.round(bh * 0.055);
    const heroH = Math.round(bh * 0.39);
    const heroW = bw - pad * 2;
    roundRectPath(g, pad, heroY, heroW, heroH, Math.round(rOut * 0.45));
    g.fillStyle = narrowSqueeze ? "#F1DDD2" : C.sand;
    g.fill();

    if (narrowSqueeze) {
      g.strokeStyle = C.alertBg;
      g.lineWidth = Math.max(2, bw * 0.006);
      g.setLineDash([8, 6]);
      g.stroke();
      g.setLineDash([]);
    }

    // 中央画布区里的真实聚焦内容（随 activeItem 联动）
    const activeCard = sc.mainCards[state.activeItem];
    const activeSub = sc.subItems[state.activeItem];
    const innerPad = Math.round(heroW * 0.065);
    g.fillStyle = C.orangeDeep;
    g.font = `600 ${Math.max(11, Math.round(bw * 0.03))}px "DM Mono", monospace`;
    g.fillText(`${activeCard.id} · FOCUS ACTIVE`, pad + innerPad, heroY + innerPad);

    g.fillStyle = C.ink;
    g.font = `700 ${Math.max(15, Math.round(bw * 0.052))}px "Noto Sans SC", sans-serif`;
    g.fillText(activeCard.title, pad + innerPad, heroY + innerPad + Math.round(bh * 0.062), heroW - innerPad * 2);

    g.fillStyle = C.inkSoft;
    g.font = `400 ${Math.max(12, Math.round(bw * 0.035))}px "Noto Sans SC", sans-serif`;
    g.fillText(
      narrowSqueeze
        ? `仅剩 ${ev.mainPx}px，每行折成 ${ev.charsPerLine} 字`
        : `${activeCard.sub} · 关联副窗「${activeSub.tag}」`,
      pad + innerPad,
      heroY + innerPad + Math.round(bh * 0.145),
      heroW - innerPad * 2
    );

    // 示意正文排版行（行宽真实响应主窗宽度与是否折叠）
    const lineStartY = heroY + innerPad + Math.round(bh * 0.22);
    const lineGap = Math.round(bh * 0.042);
    const lineCount = 3;
    for (let i = 0; i < lineCount; i++) {
      const lw = (heroW - innerPad * 2) * (i === 2 ? 0.62 : i === 0 ? 0.96 : 0.88);
      roundRectPath(g, pad + innerPad, lineStartY + i * lineGap, lw, Math.max(5, bh * 0.016), 4);
      g.fillStyle = i === 0 ? "rgba(22, 48, 39, 0.22)" : "rgba(22, 48, 39, 0.12)";
      g.fill();
    }

    // 底部三张并列卡（1:1 复刻原海报左页底下三个浅米方块，且可点击选中）
    const cardsY = heroY + heroH + Math.round(bh * 0.048);
    const cardsH = bh - cardsY - pad;
    const gap = Math.round(bw * 0.034);
    const cw = (heroW - gap * 2) / 3;
    for (let i = 0; i < 3; i++) {
      const cx0 = pad + i * (cw + gap);
      const isAct = i === state.activeItem;
      roundRectPath(g, cx0, cardsY, cw, cardsH, Math.round(rOut * 0.32));
      g.fillStyle = isAct ? C.sandActive : C.sand;
      g.fill();
      if (isAct) {
        g.strokeStyle = C.orange;
        g.lineWidth = Math.max(2.5, bw * 0.008);
        g.stroke();
      }
      g.fillStyle = isAct ? C.orangeDeep : C.inkSoft;
      g.font = `700 ${Math.max(11, Math.round(bw * 0.032))}px "DM Mono", monospace`;
      g.textAlign = "left";
      g.textBaseline = "top";
      g.fillText(sc.mainCards[i].id, cx0 + Math.round(cw * 0.12), cardsY + Math.round(cardsH * 0.16));

      g.fillStyle = C.ink;
      g.font = `600 ${Math.max(11, Math.round(bw * 0.031))}px "Noto Sans SC", sans-serif`;
      g.fillText(
        sc.mainCards[i].title.slice(0, 4),
        cx0 + Math.round(cw * 0.12),
        cardsY + Math.round(cardsH * 0.5),
        cw * 0.8
      );
    }

    // 如果未跨折缝，主窗右下安全区画一枚温和的「主线操作胶囊」，体现归位安全感
    if (!state.crossSeam && ev.isOpen) {
      const bw2 = Math.round(heroW * 0.42);
      const bh2 = Math.round(bh * 0.068);
      const bx2 = pad + heroW - bw2 - innerPad * 0.5;
      const by2 = heroY + heroH - bh2 - innerPad * 0.45;
      roundRectPath(g, bx2, by2, bw2, bh2, bh2 / 2);
      g.fillStyle = C.pine;
      g.fill();
      g.fillStyle = C.white;
      g.font = `600 ${Math.max(11, Math.round(bw * 0.028))}px "Noto Sans SC", sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(sc.actionLabel, bx2 + bw2 / 2, by2 + bh2 / 2 + 0.5, bw2 - 12);
    }
  }

  // 绘制右页（副窗 CONTEXT）离屏高清贴图
  function paintSubBuffer(bw, bh, ev) {
    subBuf.width = bw;
    subBuf.height = bh;
    const g = subCtx;
    g.clearRect(0, 0, bw, bh);

    const sc = SCENES[state.scene];
    const pad = Math.round(bw * 0.095);
    const rOut = Math.round(Math.min(bw, bh) * 0.068);
    const rIn = Math.round(rOut * 0.3);

    // 鼠尾草浅青灰纸底（1:1 复刻原海报右页）
    panePath(g, 0, 0, bw, bh, rOut, rIn, "right");
    g.fillStyle = C.sage;
    g.fill();

    // 顶部原海报青绿小方标 + 两道横杠
    const topY = pad;
    const sq = Math.round(Math.min(bw * 0.15, bh * 0.075));
    roundRectPath(g, pad, topY, sq, sq, 4);
    g.fillStyle = state.subNoise ? C.orange : C.sageHeader;
    g.fill();

    const htx = pad + sq + Math.round(bw * 0.06);
    const htw = bw - htx - pad;
    g.fillStyle = C.ink;
    g.font = `700 ${Math.max(12, Math.round(Math.min(bw * 0.068, bh * 0.04)))}px "Noto Sans SC", sans-serif`;
    g.textAlign = "left";
    g.textBaseline = "top";
    g.fillText(sc.subTitle, htx, topY, htw);

    roundRectPath(g, htx, topY + sq * 0.64, htw * 0.82, Math.max(5, bh * 0.015), 3);
    g.fillStyle = C.sageHeader;
    g.fill();

    // 内层暖米卡片（复刻原海报右页里的米白长卡）
    const cardY = topY + sq + Math.round(bh * 0.045);
    const cardH = bh - cardY - pad;
    const cardW = bw - pad * 2;
    roundRectPath(g, pad, cardY, cardW, cardH, Math.round(rOut * 0.42));
    g.fillStyle = C.creamCard;
    g.fill();

    const cramped = state.subRatio < 0.22;
    const cPad = Math.round(cardW * 0.09);
    const rowGap = Math.round(cardH * 0.04);
    const innerH = cardH - cPad * 2;
    const rowH = (innerH - rowGap * 2) / 3;

    // 绘制 3 条副窗补充项（含原海报中段标志朱橘块：正常态克制、高噪态霸屏抢焦！）
    for (let i = 0; i < 3; i++) {
      const ry = cardY + cPad + i * (rowH + rowGap);
      const item = sc.subItems[i];
      const isAct = i === state.activeItem;

      // 高噪抢焦模式下，副窗第 1、2 条直接铺满高饱和朱橘大块压过主窗
      const noisyRow = state.subNoise && (i === 0 || i === 1);
      roundRectPath(g, pad + cPad * 0.6, ry, cardW - cPad * 1.2, rowH, 8);
      if (noisyRow) {
        g.fillStyle = C.orange;
        g.fill();
      } else if (isAct) {
        g.fillStyle = "#E8DEC9";
        g.fill();
        g.strokeStyle = C.orange;
        g.lineWidth = Math.max(2, bw * 0.01);
        g.stroke();
      } else {
        g.fillStyle = "rgba(126, 155, 129, 0.14)";
        g.fill();
      }

      // 左侧朱橘小方点（1:1 复刻原海报）
      const dotS = Math.round(Math.min(rowH * 0.26, bw * 0.085));
      const dx = pad + cPad;
      const dy = ry + Math.round(rowH * 0.2);
      roundRectPath(g, dx, dy, dotS, dotS, 3);
      g.fillStyle = noisyRow ? C.white : isAct ? C.orange : C.sageHeader;
      g.fill();

      // 文本
      const textX = dx + dotS + Math.round(bw * 0.045);
      const textW = Math.max(16, cardW - cPad * 2 - dotS - Math.round(bw * 0.045));
      g.textAlign = "left";
      g.textBaseline = "top";
      g.fillStyle = noisyRow ? C.white : isAct ? C.orangeDeep : C.inkSoft;
      const tSz = Math.max(10, Math.round(Math.min(bw * 0.052, bh * 0.028)));
      g.font = `700 ${tSz}px "DM Mono", monospace`;
      g.fillText(cramped ? item.id : item.tag, textX, dy - 1, textW);

      g.fillStyle = noisyRow ? C.white : C.ink;
      const bSz = Math.max(11, Math.round(Math.min(bw * 0.06, bh * 0.032)));
      g.font = `600 ${bSz}px "Noto Sans SC", sans-serif`;
      g.fillText(cramped ? item.title.slice(0, 3) + "…" : item.title, textX, dy + tSz + 4, textW);

      if (!cramped && rowH > 58) {
        g.fillStyle = noisyRow ? "rgba(251,244,230,0.9)" : C.inkSoft;
        g.font = `400 ${Math.max(10, Math.round(bSz * 0.82))}px "Noto Sans SC", sans-serif`;
        g.fillText(
          noisyRow ? "高饱和抢占主窗视线" : isAct && state.preserveState ? "● 折合后保留此定位" : item.note,
          textX,
          dy + tSz + bSz + 9,
          textW
        );
      }
    }
  }

  // 把离屏贴图沿竖向条带做精确 2D 透视梯形映射（慢手机用 10 条、桌面用 14 条，零可见锯齿且软件渲染 60fps）
  function drawPerspectivePane(buf, x0, y0Top, y0Bot, x1, y1Top, y1Bot, shadeAlpha) {
    const slices = W < 500 ? 10 : 14;
    const sw = buf.width / slices;
    const sh = buf.height;
    const dir = x1 >= x0 ? 1 : -1;
    const span = Math.abs(x1 - x0);
    if (span < 1.5) return;

    for (let i = 0; i < slices; i++) {
      const t0 = i / slices;
      const t1 = (i + 1) / slices;
      const px0 = x0 + (x1 - x0) * t0;
      const px1 = x0 + (x1 - x0) * t1;
      const topY = y0Top + (y1Top - y0Top) * t0;
      const botY = y0Bot + (y1Bot - y0Bot) * t0;
      const drawW = Math.abs(px1 - px0) + 0.9;
      const drawX = dir > 0 ? px0 : px1;
      ctx.drawImage(buf, i * sw, 0, sw, sh, drawX, topY, drawW, botY - topY);
    }

    // 叠加折页光影（朝折缝一侧渐暗，模拟实体纸张折痕）
    if (shadeAlpha > 0.005) {
      const grad = ctx.createLinearGradient(x0, 0, x1, 0);
      grad.addColorStop(0, `rgba(11, 56, 44, ${shadeAlpha.toFixed(3)})`);
      grad.addColorStop(0.28, `rgba(11, 56, 44, ${(shadeAlpha * 0.25).toFixed(3)})`);
      grad.addColorStop(1, "rgba(11, 56, 44, 0)");
      ctx.beginPath();
      ctx.moveTo(x0, y0Top);
      ctx.lineTo(x1, y1Top);
      ctx.lineTo(x1, y1Bot);
      ctx.lineTo(x0, y0Bot);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nextW = Math.round(rect.width);
    const nextH = Math.round(rect.height);
    const nextDpr = nextW < 500 ? pixelRatio(1.5) : pixelRatio(2);
    if (nextW !== W || nextH !== H || nextDpr !== dpr) {
      W = nextW;
      H = nextH;
      dpr = nextDpr;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      bufKey = "";
      dirty = true;
    }
  }

  function render(t, dt, { still }) {
    resize();

    // 0.55 秒开场轻翻入场动效（0.9 秒截图时已稳停在精确的 102° 错态）
    let animating = false;
    let introOffset = 0;
    if (!still && !introDone) {
      if (t < 0.55) {
        const p = clamp(t / 0.55, 0, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        introOffset = (1 - ease) * 18;
        animating = true;
      } else {
        introDone = true;
        dirty = true;
      }
    }

    // 丝滑阻尼追随目标折角
    if (still) {
      state.foldDeg = state.targetFoldDeg;
      introDone = true;
    } else if (Math.abs(state.targetFoldDeg - state.foldDeg) > 0.08) {
      const k = 1 - Math.exp(-Math.min(dt || 0.016, 0.05) * 14);
      state.foldDeg += (state.targetFoldDeg - state.foldDeg) * k;
      if (Math.abs(state.targetFoldDeg - state.foldDeg) < 0.12) state.foldDeg = state.targetFoldDeg;
      syncFoldMemory(state);
      onChange("anim");
      animating = true;
    }

    // 静止且无变更时不重绘，彻底省电并让软件渲染帧率满格
    if (!dirty && !animating && !still) return;
    dirty = false;

    const ev = evaluate(state);
    const deg = clamp(state.foldDeg - introOffset, 0, 180);
    const subRatio = clamp(state.subRatio, 0.16, 0.56);

    // 仅在内容/比例/开关变化时刷新离屏贴图，拖拽 0°–180° 全程 0 次离屏重建
    const nextKey = `${W}x${H}|${dpr}|${state.scene}|${Math.round(subRatio * 100)}|${state.subNoise}|${state.crossSeam}|${state.preserveState}|${state.simWidth}|${state.activeItem}`;
    const spreadW = W * (W < 440 ? 0.86 : 0.78);
    const paneH = H * (W < 440 ? 0.65 : 0.64);
    const mainFlatW = spreadW * (1 - subRatio);
    const subFlatW = spreadW * subRatio;

    if (nextKey !== bufKey) {
      bufKey = nextKey;
      paintMainBuffer(Math.max(220, Math.round(mainFlatW * dpr)), Math.max(200, Math.round(paneH * dpr)), ev);
      paintSubBuffer(Math.max(140, Math.round(subFlatW * dpr)), Math.max(200, Math.round(paneH * dpr)), ev);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // 1. 计算真实立体折页几何坐标
    // foldFactor: 0 = 完全折叠(0°)，1 = 完全平摊(180°)
    const foldT = deg / 180;
    // 透视深度系数：180° 平摊时 0，138° 原海报立体微折最饱满，0° 收折归平
    const stereoAmt = Math.sin(foldT * Math.PI);
    const foldRad = (deg * Math.PI) / 180;

    // 当折角趋近 0° 时，主窗居中并回收宽度；展开时折轴按主副比自然偏移并略偏向视觉中心
    const expandEase = clamp(deg / 115, 0, 1);
    const mainVisW = spreadW * (0.82 * (1 - expandEase) + (1 - subRatio) * (0.9 + 0.1 * foldT) * expandEase);
    // 副窗随折角 sin(foldRad/2) 从主窗背后旋出并展开
    const subProjScale = Math.sin(foldRad * 0.5);
    const subVisW = subFlatW * subProjScale;

    // 整体水平居中定位
    const totalVisW = mainVisW + subVisW;
    const leftX = (W - totalVisW) * 0.5;
    const axisX = leftX + mainVisW;
    const rightX = axisX + subVisW;

    const midY = H * 0.51;
    const halfH = paneH * 0.5;

    // 立体透视上下斜切量（原海报中轴略低缩、外沿微张扬）
    const perspMain = stereoAmt * paneH * 0.068;
    const perspSub = stereoAmt * paneH * 0.088 * (0.55 + 0.45 * subProjScale);

    const axisTopY = midY - halfH + perspMain * 0.42;
    const axisBotY = midY + halfH - perspMain * 0.42;

    const leftTopY = midY - halfH - perspMain * 0.25;
    const leftBotY = midY + halfH + perspMain * 0.25;

    const rightTopY = midY - halfH - perspSub * 0.3;
    const rightBotY = midY + halfH + perspSub * 0.3;

    // 2. 松林深绿地面斜投影（复刻原海报左后方深墨绿投影）
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(leftX + 10, leftBotY - 8);
    ctx.lineTo(leftX - Math.min(82, W * 0.14), leftBotY - 20);
    ctx.lineTo(leftX - Math.min(48, W * 0.08), leftBotY + 14);
    ctx.lineTo(axisX, axisBotY + 10);
    ctx.lineTo(rightX, rightBotY + 6);
    ctx.lineTo(axisX, axisBotY - 12);
    ctx.closePath();
    ctx.fillStyle = "rgba(8, 63, 50, 0.55)";
    ctx.fill();
    ctx.restore();

    hitZones = [];

    // 3. 折叠态背后露出的淡鼠尾草青折页厚边（1:1 复刻原海报底部「折叠状态 FOLDED」！）
    if (deg < 35) {
      const peek = clamp(1 - deg / 35, 0, 1);
      const edgeW = Math.max(10, Math.round(14 * peek));
      const ex = axisX - 4;
      const ey = leftTopY + 4;
      const eh = leftBotY - leftTopY - 8;
      panePath(ctx, ex, ey, edgeW + 6, eh, 12, 4, "right");
      ctx.fillStyle = C.sage;
      ctx.fill();
      ctx.strokeStyle = "rgba(17, 109, 87, 0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // 唤回耳签（右侧淡青边上的微橘竖条，点一下即可展开）
      const tabH = Math.min(54, eh * 0.24);
      const tabY = midY - tabH / 2;
      roundRectPath(ctx, ex + edgeW - 2, tabY, 12, tabH, 6);
      ctx.fillStyle = hoverId === "edge-tab" ? C.orangeSoft : C.orange;
      ctx.fill();

      // 小箭头指示展开
      ctx.fillStyle = C.white;
      ctx.font = `700 10px "DM Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("›", ex + edgeW + 4, midY);

      hitZones.push({
        id: "edge-tab",
        x: ex - 4,
        y: ey,
        w: edgeW + 26,
        h: eh,
        cursor: "pointer",
        action: () => {
          state.targetFoldDeg = 142;
          onChange("edge-open");
        },
      });
    }

    // 4. 绘制左侧主窗（纸边厚度 + 透视映射）
    // 纸页微厚底边
    ctx.beginPath();
    ctx.moveTo(leftX - 3, leftTopY + 2);
    ctx.lineTo(axisX, axisTopY);
    ctx.lineTo(axisX, axisBotY);
    ctx.lineTo(leftX - 3, leftBotY - 1);
    ctx.closePath();
    ctx.fillStyle = C.ivoryEdge;
    ctx.fill();

    drawPerspectivePane(mainBuf, leftX, leftTopY, leftBotY, axisX, axisTopY, axisBotY, stereoAmt * 0.14);

    // 记录主窗底部三张卡片的点击区
    const mCardTop = leftTopY + (leftBotY - leftTopY) * 0.72;
    const mCardBot = leftBotY - (leftBotY - leftTopY) * 0.06;
    const mCardW = (axisX - leftX) * 0.28;
    for (let i = 0; i < 3; i++) {
      const cx = leftX + (axisX - leftX) * (0.075 + i * 0.295);
      hitZones.push({
        id: `main-${i}`,
        x: cx,
        y: mCardTop,
        w: mCardW,
        h: mCardBot - mCardTop,
        cursor: "pointer",
        action: () => {
          state.activeItem = i;
          if (state.preserveState) state.savedItem = i;
          onChange("pick-main");
        },
      });
    }

    // 5. 绘制右侧副窗（只要折角 > 3° 就渲染立体旋出过程）
    if (deg > 3 && subVisW > 2) {
      // 副窗外沿纸厚
      ctx.beginPath();
      ctx.moveTo(axisX, axisTopY);
      ctx.lineTo(rightX + 3, rightTopY + 2);
      ctx.lineTo(rightX + 3, rightBotY - 1);
      ctx.lineTo(axisX, axisBotY);
      ctx.closePath();
      ctx.fillStyle = C.sageEdge;
      ctx.fill();

      const subShade = stereoAmt * 0.24 + (1 - subProjScale) * 0.18;
      drawPerspectivePane(subBuf, axisX, axisTopY, axisBotY, rightX, rightTopY, rightBotY, subShade);

      // 当副窗充分展开时，登记 3 条副窗条目的真实点击区
      if (subVisW > 46) {
        const sTop = axisTopY + (axisBotY - axisTopY) * 0.22;
        const sH = (axisBotY - axisTopY) * 0.68;
        const rowH = sH / 3;
        for (let i = 0; i < 3; i++) {
          hitZones.push({
            id: `sub-${i}`,
            x: axisX + 6,
            y: sTop + i * rowH,
            w: Math.max(24, subVisW - 12),
            h: rowH - 4,
            cursor: "pointer",
            action: () => {
              state.activeItem = i;
              if (state.preserveState) state.savedItem = i;
              onChange("pick-sub");
            },
          });
        }
      }
    }

    // 6. 中央垂直白色虚线「折叠轴 FOLD AXIS ○---○」（1:1 复刻原海报灵魂母题！）
    ctx.save();
    if (!ev.isFolded) {
      // 深绿中轴折缝微槽
      ctx.strokeStyle = "rgba(10, 56, 44, 0.55)";
      ctx.lineWidth = state.simWidth === 880 ? 8 : 3;
      ctx.beginPath();
      ctx.moveTo(axisX, axisTopY + 2);
      ctx.lineTo(axisX, axisBotY - 2);
      ctx.stroke();
    }

    // 垂直白虚线
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(axisX, axisTopY - 6);
    ctx.lineTo(axisX, axisBotY + 6);
    ctx.stroke();
    ctx.setLineDash([]);

    // 上下两枚空心白圆 ○
    for (const cy of [axisTopY - 9, axisBotY + 9]) {
      ctx.beginPath();
      ctx.arc(axisX, cy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = C.pine;
      ctx.fill();
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    ctx.restore();

    // 7. 跨折缝错态可视化：若 crossSeam 开启且展开，在折轴上直接画出被劈开的操作条 + 可点纠偏标签
    if (!ev.isFolded && state.crossSeam) {
      const compact = W < 440;
      const btnW = compact ? Math.min(W - 44, 174) : Math.min(182, Math.max(156, spreadW * 0.36));
      const btnH = compact ? 30 : 34;
      const bx = clamp(axisX - btnW / 2, 12, W - btnW - 12);
      const by = axisBotY - (compact ? 48 : 54);
      roundRectPath(ctx, bx, by, btnW, btnH, 6);
      ctx.fillStyle = C.alertBg;
      ctx.fill();
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 中轴白缝直接劈过按钮
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(axisX, by - 5);
      ctx.lineTo(axisX, by + btnH + 5);
      ctx.stroke();

      ctx.fillStyle = C.white;
      ctx.font = `700 ${compact ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("× 跨折缝被劈断 · 点此归位", bx + btnW / 2, by + btnH / 2, btnW - 14);

      hitZones.push({
        id: "fix-seam",
        x: bx - 4,
        y: by - 4,
        w: btnW + 8,
        h: btnH + 8,
        cursor: "pointer",
        action: () => {
          state.crossSeam = false;
          onChange("fix-seam");
        },
      });
    }

    // 8. 顶部原海报「折叠轴 FOLD AXIS」弧形双向箭头 + 实时度数（文字居上，弧箭居下零重叠）
    const topLabelY = Math.max(20, axisTopY - 52);
    ctx.save();
    ctx.fillStyle = C.white;
    ctx.font = `600 ${W < 420 ? 11 : 12}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`折叠轴 · ${ev.deg}°`, axisX, topLabelY + 1);

    ctx.fillStyle = "rgba(251, 244, 230, 0.85)";
    ctx.font = `500 ${W < 420 ? 9.5 : 10.5}px "Sora", sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText("FOLD AXIS", axisX, topLabelY + 3);

    // 两侧微弧双向箭放在 FOLD AXIS 外侧下方，完全不碰文字
    const arcY = topLabelY + 19;
    const arcIn = W < 420 ? 34 : 40;
    const arcOut = W < 420 ? 52 : 62;
    ctx.strokeStyle = C.lineLight;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(axisX - arcIn, arcY);
    ctx.quadraticCurveTo(axisX - arcOut + 4, arcY + 3, axisX - arcOut, arcY + 13);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(axisX + arcIn, arcY);
    ctx.quadraticCurveTo(axisX + arcOut - 4, arcY + 3, axisX + arcOut, arcY + 13);
    ctx.stroke();
    // 右弧箭头
    ctx.beginPath();
    ctx.moveTo(axisX + arcOut, arcY + 13);
    ctx.lineTo(axisX + arcOut, arcY + 7);
    ctx.moveTo(axisX + arcOut, arcY + 13);
    ctx.lineTo(axisX + arcOut - 6, arcY + 11);
    ctx.stroke();
    // 左弧箭头
    ctx.beginPath();
    ctx.moveTo(axisX - arcOut, arcY + 13);
    ctx.lineTo(axisX - arcOut, arcY + 7);
    ctx.moveTo(axisX - arcOut, arcY + 13);
    ctx.lineTo(axisX - arcOut + 6, arcY + 11);
    ctx.stroke();
    ctx.restore();

    // 9. 底部原海报「折叠切换 SWITCH」虚线双向弧箭（弧线在文字上方，数据在文字下方，彻底零重叠）
    const botArcY = Math.min(H - 38, axisBotY + 22);
    ctx.save();
    const swSpan = Math.min(124, W * 0.29);
    ctx.strokeStyle = ev.isHalf ? C.orangeSoft : "rgba(251, 244, 230, 0.78)";
    ctx.lineWidth = 1.35;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(axisX - swSpan, botArcY - 4);
    ctx.quadraticCurveTo(axisX, botArcY + 12, axisX + swSpan, botArcY - 4);
    ctx.stroke();
    ctx.setLineDash([]);

    // 弧两头箭头
    ctx.beginPath();
    ctx.moveTo(axisX - swSpan, botArcY - 4);
    ctx.lineTo(axisX - swSpan + 6, botArcY - 5);
    ctx.moveTo(axisX - swSpan, botArcY - 4);
    ctx.lineTo(axisX - swSpan + 3, botArcY + 2);
    ctx.moveTo(axisX + swSpan, botArcY - 4);
    ctx.lineTo(axisX + swSpan - 6, botArcY - 5);
    ctx.moveTo(axisX + swSpan, botArcY - 4);
    ctx.lineTo(axisX + swSpan - 3, botArcY + 2);
    ctx.stroke();

    const botTextY = Math.min(H - 20, botArcY + 19);
    ctx.fillStyle = C.orangeSoft;
    ctx.font = `700 ${W < 420 ? 11.5 : 12.5}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(ev.isFolded ? "向右横拖展开 · OPEN" : "向左横拖折叠 · SWITCH", axisX, botTextY);

    ctx.fillStyle = "rgba(251, 244, 230, 0.88)";
    ctx.font = `500 ${W < 420 ? 10 : 10.5}px "DM Mono", monospace`;
    ctx.textBaseline = "top";
    ctx.fillText(
      ev.isFolded ? "0° FOLDED · 主窗 100%" : `主 ${ev.openMainPct}% : 副 ${ev.openSubPct}% · ${state.simWidth}px 模拟`,
      axisX,
      botTextY + 3
    );
    ctx.restore();

    // 10. 顶部浮动微胶囊（仅在刚发生记忆重置或主副失衡时轻提示）
    if (state.lastEvent === "lost" && !state.preserveState) {
      const pillW = Math.min(238, W - 24);
      const pillX = (W - pillW) / 2;
      const pillY = 6;
      roundRectPath(ctx, pillX, pillY, pillW, 24, 12);
      ctx.fillStyle = C.alertBg;
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("× 刚才折叠触发了卸载，选定项已清零", W / 2, pillY + 12.5);
    }

    ctx.restore();
  }

  const ctrl = loop(canvas, render);

  // 指针与触摸手势：严格区分横向翻折与纵向滚页，同时支持直接点击卡片/耳签/红标
  let drag = null;

  function toLocal(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function findHit(pt) {
    for (let i = hitZones.length - 1; i >= 0; i--) {
      const z = hitZones[i];
      if (pt.x >= z.x && pt.x <= z.x + z.w && pt.y >= z.y && pt.y <= z.y + z.h) return z;
    }
    return null;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const pt = toLocal(e);
    drag = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startDeg: state.foldDeg,
      locked: false, // 仅在水平位移大于垂直位移时锁住翻折
      moved: false,
      hit: findHit(pt),
    };
  });

  canvas.addEventListener("pointermove", (e) => {
    const pt = toLocal(e);
    if (!drag) {
      const h = findHit(pt);
      const nextHover = h ? h.id : null;
      if (nextHover !== hoverId) {
        hoverId = nextHover;
        dirty = true;
      }
      canvas.style.cursor = h ? h.cursor : "ew-resize";
      return;
    }
    if (e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.locked) {
      if (Math.hypot(dx, dy) < 6) return;
      if (Math.abs(dx) >= Math.abs(dy) * 0.9) {
        drag.locked = true;
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {}
      } else {
        drag = null; // 交还给浏览器正常竖向滚动页面
        return;
      }
    }
    drag.moved = true;
    introDone = true;
    const degPerPx = 180 / Math.max(180, W * 0.52);
    const next = clamp(drag.startDeg + dx * degPerPx, 0, 180);
    state.foldDeg = next;
    state.targetFoldDeg = next;
    syncFoldMemory(state);
    dirty = true;
    onChange("drag");
  });

  function finishDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const wasMoved = drag.moved;
    const hit = drag.hit;
    drag = null;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
    if (!wasMoved && hit) {
      dirty = true;
      hit.action();
      ctrl.draw();
      return;
    }
    // 靠近 0° 或 142° / 180° 时轻轻吸附（保留 20°–115° 错态区间让用户可以故意玩错）
    if (wasMoved) {
      if (state.foldDeg < 12) state.targetFoldDeg = 0;
      else if (Math.abs(state.foldDeg - 142) < 6) state.targetFoldDeg = 142;
      else if (state.foldDeg > 172) state.targetFoldDeg = 180;
      syncFoldMemory(state);
      dirty = true;
      onChange("drag-end");
      ctrl.draw();
    }
  }

  canvas.addEventListener("pointerup", finishDrag);
  canvas.addEventListener("pointercancel", finishDrag);

  // 键盘操作：←/→ 翻折 14°，Space/Enter 在折叠/展开间切换，1/2/3 切换联动条目
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      state.targetFoldDeg = clamp(state.targetFoldDeg - 14, 0, 180);
      state.foldDeg = state.targetFoldDeg;
      syncFoldMemory(state);
      dirty = true;
      onChange("key");
      ctrl.draw();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      state.targetFoldDeg = clamp(state.targetFoldDeg + 14, 0, 180);
      state.foldDeg = state.targetFoldDeg;
      syncFoldMemory(state);
      dirty = true;
      onChange("key");
      ctrl.draw();
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      state.targetFoldDeg = state.foldDeg < 45 ? 142 : 0;
      dirty = true;
      onChange("toggle");
      ctrl.draw();
    } else if (e.key === "1" || e.key === "2" || e.key === "3") {
      state.activeItem = Number(e.key) - 1;
      if (state.preserveState) state.savedItem = state.activeItem;
      dirty = true;
      onChange("key-pick");
      ctrl.draw();
    }
  });

  window.addEventListener("resize", () => {
    bufKey = "";
    dirty = true;
    ctrl.draw();
  });

  return {
    draw: () => {
      bufKey = "";
      dirty = true;
      ctrl.draw();
    },
    repaint: () => {
      dirty = true;
      ctrl.draw();
    },
  };
}

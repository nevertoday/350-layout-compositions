// 209 响应式网格 — 2D Canvas 三屏同源断点跃迁舞台
// 宽屏/平板：1:1 承袭原海报桌面→平板→手机三屏并列演化 + 顶沿连续断点轨道尺与切刀
// 窄屏手机（<680px）：大画幅当前视口设备 + 顶沿手拖断点轨道 + 底沿三端联动缩略切换条（绝不把三台设备压成细条）

import { loop, pixelRatio } from "../../lib/stage.js";
import { DEVICES, clampState, evaluateAll } from "./model.js";

const COL = {
  amber: "#FCC300",
  amberDeep: "#D9A300",
  amberSoft: "#FFD84D",
  ink: "#0B0B09",
  inkMuted: "#47443B",
  inkLight: "#767162",
  paper: "#FFFFFF",
  cardBg: "#F6F4EF",
  border: "#0B0B09",
  rule: "#DFDDD6",
  danger: "#C0261D",
  dangerSoft: "rgba(192, 38, 29, 0.14)",
  dangerStripe: "rgba(192, 38, 29, 0.32)",
  ok: "#0F6B43",
  okSoft: "rgba(15, 107, 67, 0.12)",
};

const FONT_SANS = '"Noto Sans SC", "Outfit", sans-serif';
const FONT_EN = '"Outfit", "Bricolage Grotesque", sans-serif';
const FONT_MONO = '"DM Mono", monospace';

export function createHeroStage(canvas, getState, onStateChange, onFixAction) {
  const ctx = canvas.getContext("2d");
  let cssW = 900;
  let cssH = 440;
  let dpr = pixelRatio(2);
  let dirty = true;
  let intro = 0; // 0 -> 1 入场进度
  let pulse = 0; // 跨断点脉冲反馈 0 -> 1
  let lastTier = null;
  let focusSlot = "mobile"; // 手机窄屏模式当前放大的设备槽位

  // 平滑动画插值量
  const anim = {
    vw: getState().viewportWidth,
    bp1: getState().bp1,
    bp2: getState().bp2,
  };

  // 可点击热区（每帧绘制时写入，避免坐标漂移）
  let hitTargets = {
    track: null, // { x, y, w, h }
    vwKnob: null,
    bp1Knob: null,
    bp2Knob: null,
    fixBadges: [], // [{ x, y, w, h, action }]
    deviceCards: [], // [{ x, y, w, h, id, width }]
  };

  // 拖拽状态
  let drag = null; // { kind: 'vw' | 'bp1' | 'bp2' | 'swipe', startX, startY, startVal, pointerId, locked }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(280, Math.round(rect.width));
    cssH = Math.max(260, Math.round(rect.height));
    dpr = pixelRatio(2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    dirty = true;
  }

  function xFromWidth(wPx, track) {
    const t = (wPx - 320) / (1440 - 320);
    return track.x + Math.max(0, Math.min(1, t)) * track.w;
  }

  function widthFromX(clientX, track) {
    const t = (clientX - track.x) / track.w;
    return Math.round(320 + Math.max(0, Math.min(1, t)) * (1440 - 320));
  }

  function roundRect(x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  // 绘制山月 / 建筑 / 音箱等比例主图（严格等比不变形）
  function drawMotifArt(x, y, w, h, motif) {
    ctx.save();
    ctx.fillStyle = COL.amber;
    ctx.fillRect(x, y, w, h);
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    const s = Math.min(w, h);
    const cx = x + w * 0.5;
    const cy = y + h * 0.5;

    ctx.fillStyle = COL.ink;
    if (motif === "mountain") {
      // 1:1 复刻原海报山月占位符：左侧大峰 + 右侧小峰 + 右上圆日
      const baseY = y + h * 0.86;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.1, baseY);
      ctx.lineTo(x + w * 0.42, y + h * 0.36);
      ctx.lineTo(x + w * 0.62, y + h * 0.66);
      ctx.lineTo(x + w * 0.75, y + h * 0.5);
      ctx.lineTo(x + w * 0.92, baseY);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x + w * 0.72, y + h * 0.28, Math.max(3, s * 0.105), 0, Math.PI * 2);
      ctx.fill();
    } else if (motif === "arch") {
      // 建筑拱廊剪影
      const baseY = y + h * 0.88;
      const bw = s * 0.72;
      const bh = s * 0.66;
      const bx = cx - bw / 2;
      const by = baseY - bh;
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = COL.amber;
      const aw = bw * 0.42;
      ctx.beginPath();
      ctx.arc(cx, by + bh * 0.52, aw / 2, Math.PI, 0);
      ctx.lineTo(cx + aw / 2, baseY + 2);
      ctx.lineTo(cx - aw / 2, baseY + 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = COL.ink;
      ctx.beginPath();
      ctx.arc(cx, by + bh * 0.52, Math.max(2.5, aw * 0.16), 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 监听音箱声学单元
      const boxW = s * 0.58;
      const boxH = s * 0.78;
      roundRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH, 4);
      ctx.fill();
      ctx.fillStyle = COL.amber;
      ctx.beginPath();
      ctx.arc(cx, cy - boxH * 0.2, boxW * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy + boxH * 0.17, boxW * 0.29, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COL.ink;
      ctx.beginPath();
      ctx.arc(cx, cy + boxH * 0.17, boxW * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 绘制原海报同款极简 4 枚图标
  function drawMiniIcon(type, cx, cy, size) {
    const r = size / 2;
    ctx.save();
    ctx.strokeStyle = COL.ink;
    ctx.fillStyle = COL.ink;
    ctx.lineWidth = Math.max(1, size * 0.085);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (type === "grid") {
      ctx.strokeRect(cx - r, cy - r, size, size);
      ctx.beginPath();
      ctx.moveTo(cx - r / 3, cy - r);
      ctx.lineTo(cx - r / 3, cy + r);
      ctx.moveTo(cx + r / 3, cy - r);
      ctx.lineTo(cx + r / 3, cy + r);
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.stroke();
    } else if (type === "hierarchy") {
      const ys = [-r * 0.62, 0, r * 0.62];
      const ws = [r * 0.95, r * 0.65, r * 0.42];
      ys.forEach((dy, i) => {
        ctx.beginPath();
        ctx.moveTo(cx - ws[i], cy + dy);
        ctx.lineTo(cx + ws[i], cy + dy);
        ctx.stroke();
      });
    } else if (type === "rhythm") {
      ctx.beginPath();
      ctx.moveTo(cx - r, cy - r * 0.72);
      ctx.lineTo(cx - r, cy + r * 0.72);
      ctx.moveTo(cx + r, cy - r * 0.72);
      ctx.lineTo(cx + r, cy + r * 0.72);
      // 双向小箭
      ctx.moveTo(cx - r * 0.62, cy);
      ctx.lineTo(cx - r * 0.16, cy);
      ctx.moveTo(cx + r * 0.16, cy);
      ctx.lineTo(cx + r * 0.62, cy);
      ctx.stroke();
    } else {
      ctx.strokeRect(cx - r, cy - r, size, size);
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 绘制顶沿连续断点轨道尺（320px — 1440px）
  function drawRuler(evalRes, compact) {
    const padX = compact ? 16 : 24;
    const trackX = padX;
    const trackW = cssW - padX * 2;
    const trackY = compact ? 30 : 34;
    const trackH = compact ? 12 : 14;
    const track = { x: trackX, y: trackY, w: trackW, h: trackH };
    hitTargets.track = track;

    const { state, live } = evalRes;
    const bp1X = xFromWidth(anim.bp1, track);
    const bp2X = xFromWidth(anim.bp2, track);
    const vwX = xFromWidth(anim.vw, track);

    // 轨道背景分区（移动 / 平板 / 桌面）
    ctx.save();
    roundRect(trackX, trackY, trackW, trackH, 3);
    ctx.fillStyle = "#E8B000";
    ctx.fill();

    // 三档断点带着色（高区分度，贴合信号黄+墨黑工业标尺）
    ctx.save();
    roundRect(trackX, trackY, trackW, trackH, 3);
    ctx.clip();
    if (state.adaptMode === "fluid") {
      ctx.fillStyle = "rgba(11, 11, 9, 0.14)";
      ctx.fillRect(trackX, trackY, bp1X - trackX, trackH);
      ctx.fillStyle = "rgba(11, 11, 9, 0.28)";
      ctx.fillRect(bp1X, trackY, bp2X - bp1X, trackH);
      ctx.fillStyle = "rgba(11, 11, 9, 0.45)";
      ctx.fillRect(bp2X, trackY, trackX + trackW - bp2X, trackH);
    } else {
      ctx.fillStyle = "rgba(192, 38, 29, 0.28)";
      ctx.fillRect(trackX, trackY, trackW, trackH);
    }
    ctx.restore();

    // 轨道纯黑外框
    roundRect(trackX, trackY, trackW, trackH, 3);
    ctx.strokeStyle = COL.ink;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 刻度线（320, 480, 768, 1024, 1280, 1440）
    const ticks = compact ? [320, 768, 1280, 1440] : [320, 480, 768, 1024, 1280, 1440];
    ctx.font = `500 ${compact ? 10 : 11}px ${FONT_MONO}`;
    ctx.fillStyle = COL.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const tk of ticks) {
      const tx = xFromWidth(tk, track);
      ctx.beginPath();
      ctx.moveTo(tx, trackY + trackH);
      ctx.lineTo(tx, trackY + trackH + 4);
      ctx.strokeStyle = COL.ink;
      ctx.lineWidth = 1;
      ctx.stroke();
      const alignX = tk === 320 ? tx + 10 : tk === 1440 ? tx - 14 : tx;
      ctx.fillText(`${tk}`, alignX, trackY + trackH + 6);
    }

    // 先算出实时视口游标胶囊的实际占位区间，确保 BP1 / BP2 文字在任何屏宽都绝对零重叠
    const tagText = `${state.viewportWidth}px · ${live.activeCols}列`;
    ctx.font = `600 ${compact ? 11 : 12}px ${FONT_MONO}`;
    const pillW = ctx.measureText(tagText).width + 18;
    const pillH = compact ? 22 : 24;
    const pillX = Math.max(trackX, Math.min(trackX + trackW - pillW, vwX - pillW / 2));
    const pillY = 2;

    // 绘制两把实体断点切刀 BP1 / BP2（与游标胶囊边界严格求交避让，零重叠）
    const drawBlade = (bx, label, isMuted, avoidX) => {
      ctx.save();
      ctx.strokeStyle = isMuted ? "rgba(11,11,9,0.45)" : COL.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, trackY - 5);
      ctx.lineTo(bx, trackY + trackH + 5);
      ctx.stroke();

      // 顶部菱形切刀帽
      ctx.fillStyle = isMuted ? "#E0B424" : COL.paper;
      ctx.beginPath();
      ctx.moveTo(bx, trackY - 11);
      ctx.lineTo(bx + 5.5, trackY - 5);
      ctx.lineTo(bx, trackY + 1);
      ctx.lineTo(bx - 5.5, trackY - 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      let placedX = null;
      if (!compact) {
        ctx.font = `600 10px ${FONT_MONO}`;
        const tw = ctx.measureText(label).width;
        let lx = bx;
        const collidesPill = lx + tw / 2 > pillX - 6 && lx - tw / 2 < pillX + pillW + 6;
        if (collidesPill) {
          lx = pillX + pillW + tw / 2 + 10;
        }
        if (avoidX != null && Math.abs(lx - avoidX) < tw + 12) {
          lx = avoidX + tw + 14;
        }
        if (lx + tw / 2 <= trackX + trackW) {
          ctx.fillStyle = isMuted ? COL.inkMuted : COL.ink;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(label, lx, trackY - 12);
          placedX = lx;
        }
      }
      ctx.restore();
      return { x: bx - 14, y: trackY - 18, w: 28, h: trackH + 26, placedX };
    };

    const mutedBlades = state.adaptMode !== "fluid";
    const b1 = drawBlade(bp1X, `BP1 ${state.bp1}`, mutedBlades, null);
    const b2 = drawBlade(bp2X, `BP2 ${state.bp2}`, mutedBlades, b1.placedX);
    hitTargets.bp1Knob = b1;
    hitTargets.bp2Knob = b2;

    // 跨断点脉冲圈
    if (pulse > 0.02) {
      ctx.save();
      ctx.strokeStyle = `rgba(11, 11, 9, ${pulse * 0.55})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(vwX, trackY + trackH / 2, 10 + (1 - pulse) * 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 游标指针竖线
    ctx.strokeStyle = live.ok ? COL.ink : COL.danger;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(vwX, pillY + pillH);
    ctx.lineTo(vwX, trackY + trackH + 4);
    ctx.stroke();

    // 游标胶囊本体
    roundRect(pillX, pillY, pillW, pillH, 12);
    ctx.fillStyle = live.ok ? COL.ink : COL.danger;
    ctx.fill();
    ctx.fillStyle = live.ok ? COL.amber : "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tagText, pillX + pillW / 2, pillY + pillH / 2 + 0.5);

    // 轨道上的圆握柄
    ctx.beginPath();
    ctx.arc(vwX, trackY + trackH / 2, compact ? 7 : 8, 0, Math.PI * 2);
    ctx.fillStyle = live.ok ? COL.ink : COL.danger;
    ctx.fill();
    ctx.strokeStyle = COL.paper;
    ctx.lineWidth = 2;
    ctx.stroke();

    hitTargets.vwKnob = { x: vwX - 20, y: 0, w: 40, h: trackY + trackH + 14 };
    ctx.restore();
  }

  // 绘制单台实体设备（1:1 承袭原海报白屏粗黑框 + 三点浏览器顶栏 + 山月主图 + 四卡重排 + 溢出红斜线）
  function drawDeviceFrame(rect, devEval, meta, theme, isActive, compact, maxOverflowBand = 24) {
    const { x, y, w, h } = rect;
    const isDesktop = meta.id === "desktop";
    const radius = isDesktop ? 10 : 12;

    // 设备顶部标题栏（设备名 + 像素范围，窄宽下精简红章文案绝不碰字）
    if (!compact) {
      ctx.save();
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.font = `700 ${w < 190 ? 12 : 13}px ${FONT_SANS}`;
      ctx.fillStyle = COL.ink;
      ctx.fillText(w < 185 ? meta.name : `${meta.name} / ${meta.en}`, x, y - 22);

      ctx.font = `500 11px ${FONT_MONO}`;
      ctx.fillStyle = COL.ink;
      const specText = w < 185 ? `${devEval.width}·${devEval.activeCols}列` : `${devEval.width}px · ${devEval.activeCols}列`;
      ctx.fillText(specText, x, y - 7);

      // 状态小章（右对齐，窄卡自动缩短）
      const rawBadge = devEval.ok ? "正常重排" : devEval.issues[0].short;
      const badgeStr = w < 185 ? rawBadge.replace("溢出 ", "溢").replace("正常重排", "达标") : rawBadge;
      ctx.font = `600 10.5px ${FONT_MONO}`;
      const bw = ctx.measureText(badgeStr).width + 11;
      const bx = x + w - bw;
      const by = y - 22;
      roundRect(bx, by, bw, 18, 3);
      ctx.fillStyle = devEval.ok ? COL.ink : COL.danger;
      ctx.fill();
      ctx.fillStyle = devEval.ok ? COL.amber : "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeStr, bx + bw / 2, by + 9.5);
      ctx.restore();
    }

    // 激活态柔和光影衬底
    ctx.save();
    if (isActive) {
      ctx.fillStyle = "rgba(11, 11, 9, 0.14)";
      roundRect(x + 5, y + 6, w, h, radius);
      ctx.fill();
    }

    // 设备白底主体
    roundRect(x, y, w, h, radius);
    ctx.fillStyle = COL.paper;
    ctx.fill();

    // 在机身内部裁切绘制页面真实内容
    ctx.save();
    roundRect(x + 1.5, y + 1.5, w - 3, h - 3, radius - 1);
    ctx.clip();

    // 浏览器顶栏（桌面端三圆点 + 汉堡，平板/手机极简汉堡）
    const barH = isDesktop ? Math.max(18, h * 0.082) : Math.max(16, h * 0.072);
    ctx.strokeStyle = COL.ink;
    ctx.lineWidth = 1;
    if (isDesktop) {
      ctx.beginPath();
      ctx.moveTo(x, y + barH);
      ctx.lineTo(x + w, y + barH);
      ctx.stroke();
      const dotY = y + barH / 2;
      const dotR = Math.max(2.2, barH * 0.14);
      [0, 1, 2].forEach((i) => {
        ctx.beginPath();
        ctx.arc(x + 12 + i * (dotR * 3.1), dotY, dotR, 0, Math.PI * 2);
        ctx.fillStyle = COL.ink;
        ctx.fill();
      });
    }
    // 右上角汉堡双线/三线
    const hbX = x + w - 18;
    const hbY = y + barH * 0.5;
    ctx.lineWidth = 1.4;
    const lines = isDesktop ? [-2.5, 2.5] : [-3.5, 0, 3.5];
    for (const dy of lines) {
      ctx.beginPath();
      ctx.moveTo(hbX, hbY + dy);
      ctx.lineTo(hbX + 10, hbY + dy);
      ctx.stroke();
    }

    // 内容视口区域
    const contentTop = y + barH;
    const contentH = h - barH;
    const pad = Math.max(7, w * (isDesktop ? 0.048 : 0.068));

    // 如果是整页微缩模式，直接按真实 scale 缩小绘制整份桌面内容！
    if (devEval.scale < 0.99) {
      ctx.save();
      ctx.translate(x, contentTop);
      const shrinkRatio = devEval.scale;
      const virtualW = w / shrinkRatio;
      const virtualH = contentH / shrinkRatio;
      ctx.scale(shrinkRatio, shrinkRatio);
      drawInnerPage(0, 0, virtualW, virtualH, devEval, theme, true);
      ctx.restore();
      // 底部空白灰纹标示微缩后的下半空白
      const usedH = contentH * shrinkRatio;
      if (usedH < contentH - 12) {
        ctx.fillStyle = "rgba(11,11,9,0.04)";
        ctx.fillRect(x, contentTop + usedH, w, contentH - usedH);
      }
    } else if (devEval.overflowPx > 0) {
      // 固定 1280px 锁死溢出态：页面仍按宽大比例排版，直接向右冲出设备右壁！
      const overflowRatio = devEval.renderedWidth / devEval.width;
      const rawDrawW = w * Math.min(overflowRatio, 2.4);
      drawInnerPage(x, contentTop, rawDrawW, contentH, devEval, theme, false);
    } else {
      // 正常弹性重排（或窄屏挤扁 / 宽屏单列 / 层级倒置等 fluid 态）
      drawInnerPage(x, contentTop, w, contentH, devEval, theme, false);
    }

    // 机身内细网格线水印（流体/响应式开启时淡淡浮现列轨参考线）
    if (devEval.overflowPx === 0 && devEval.scale >= 0.99) {
      const innerW = w - pad * 2;
      const gap = Math.max(4, w * 0.022);
      const cols = devEval.activeCols;
      const colW = (innerW - (cols - 1) * gap) / cols;
      ctx.fillStyle = "rgba(252, 195, 0, 0.08)";
      for (let c = 0; c < cols; c++) {
        ctx.fillRect(x + pad + c * (colW + gap), contentTop + 2, colW, contentH - 4);
      }
    }

    ctx.restore(); // 结束机身内部裁切

    // 如果发生横向溢出：在机身右壁外侧真正画出冲破边框的红色斜线警戒溢出带（宽度受限，绝不碰脏右侧箭头）
    if (devEval.overflowPx > 0) {
      const extraW = Math.min(maxOverflowBand, Math.max(12, (devEval.overflowPx / 1000) * maxOverflowBand));
      ctx.save();
      ctx.fillStyle = COL.dangerSoft;
      ctx.fillRect(x + w, y + 6, extraW, h - 12);
      ctx.beginPath();
      ctx.rect(x + w, y + 6, extraW, h - 12);
      ctx.clip();
      ctx.strokeStyle = COL.dangerStripe;
      ctx.lineWidth = 2;
      for (let sy = y - extraW; sy < y + h + extraW; sy += 9) {
        ctx.beginPath();
        ctx.moveTo(x + w - 2, sy);
        ctx.lineTo(x + w + extraW + 2, sy + extraW);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = COL.danger;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(x + w, y + 6, extraW, h - 12);
      ctx.setLineDash([]);
    }

    // 设备纯黑粗框（出错变朱红，选中加粗）
    roundRect(x, y, w, h, radius);
    ctx.strokeStyle = !devEval.ok ? COL.danger : isActive ? COL.ink : COL.ink;
    ctx.lineWidth = isActive ? 3 : 2.2;
    ctx.stroke();

    // 机身底部可点击红标纠偏胶囊（有故障时直接显示，点一下就地修！）
    if (!devEval.ok) {
      const iss = devEval.issues[0];
      const pillLabel = `× ${iss.short} · 点此修`;
      ctx.font = `600 ${compact ? 11 : 10.5}px ${FONT_SANS}`;
      const pw = Math.min(w - 10, ctx.measureText(pillLabel).width + 16);
      const ph = compact ? 24 : 22;
      const px = x + (w - pw) / 2;
      const py = y + h - ph - 8;
      roundRect(px, py, pw, ph, 11);
      ctx.fillStyle = COL.danger;
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(pillLabel, px + pw / 2, py + ph / 2 + 0.5, pw - 8);
      hitTargets.fixBadges.push({ x: px, y: py, w: pw, h: ph, action: iss.fixAction });
    }

    hitTargets.deviceCards.push({ x, y, w, h, id: meta.id, width: meta.width });
    ctx.restore();
  }

  // 绘制设备屏幕内部页面（Hero + 四卡区域，严格根据 model.js 决策呈现）
  function drawInnerPage(ox, oy, w, h, devEval, theme, isShrunk) {
    const pad = Math.max(7, Math.min(18, w * 0.055));
    const innerW = Math.max(40, w - pad * 2);
    const inverted = devEval.inverted;

    // 分配 Hero 区与卡片区垂直高度
    const heroRatio = devEval.heroMode === "side" ? 0.52 : devEval.listRowMode ? 0.49 : 0.52;
    const heroH = Math.max(48, (h - pad * 2) * heroRatio);
    const cardsH = Math.max(44, h - pad * 2 - heroH - 6);

    const heroY = inverted ? oy + pad + cardsH + 6 : oy + pad;
    const cardsY = inverted ? oy + pad : oy + pad + heroH + 6;

    // 1. 绘制 Hero 区
    drawHeroBlock(ox + pad, heroY, innerW, heroH, devEval, theme, isShrunk);

    // 2. 分割线
    const sepY = inverted ? cardsY + cardsH + 3 : heroY + heroH + 3;
    ctx.fillStyle = COL.cardBg;
    ctx.fillRect(ox, sepY, w, h - (sepY - oy));
    ctx.strokeStyle = COL.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox, sepY);
    ctx.lineTo(ox + w, sepY);
    ctx.stroke();

    // 3. 绘制四张特性卡（或移动端单列箭头列表）
    drawCardsBlock(ox + pad, cardsY + (inverted ? 0 : 4), innerW, cardsH - 4, devEval, theme);
  }

  function drawHeroBlock(x, y, w, h, devEval, theme, isShrunk) {
    ctx.save();
    const sideBySide = devEval.heroMode === "side";

    if (sideBySide) {
      const colGap = Math.max(6, w * 0.045);
      const textW = w * 0.47;
      const artW = w - textW - colGap;
      const artH = Math.min(h - 4, artW * 0.88);
      const artY = y + Math.max(2, (h - artH) / 2);

      // 左侧文字：标题 + 英文副标 + 示意正文线 + 黑底白字 CTA 钮
      const titleSize = Math.max(8, Math.min(18, textW * 0.145));
      ctx.fillStyle = COL.ink;
      ctx.font = `900 ${titleSize}px ${FONT_SANS}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(theme.heroTitle, x, y + 4, textW);

      const enSize = Math.max(6, Math.min(9.5, textW * 0.068));
      ctx.font = `600 ${enSize}px ${FONT_EN}`;
      ctx.fillStyle = COL.inkMuted;
      ctx.fillText(theme.heroEn, x, y + 4 + titleSize * 1.18, textW);

      // 正文示意条（窄屏硬拼时明显折成挤碎短行）
      const lineTop = y + 4 + titleSize * 1.18 + enSize * 1.8;
      const cramped = devEval.heroTextWidth < 175 && !isShrunk && devEval.overflowPx === 0;
      const lineCount = cramped ? 4 : 2;
      ctx.fillStyle = cramped ? COL.danger : "#6E6A60";
      for (let i = 0; i < lineCount; i++) {
        const ly = lineTop + i * Math.max(5.5, h * 0.085);
        if (ly + 3 > y + h - 24) break;
        const lw = textW * (i === lineCount - 1 ? 0.65 : 0.94);
        ctx.fillRect(x, ly, lw, Math.max(2.2, h * 0.032));
      }

      // 黑色行动按钮
      const btnH = Math.max(12, Math.min(20, h * 0.16));
      const btnW = Math.min(textW * 0.88, Math.max(46, textW * 0.72));
      const btnY = Math.min(y + h - btnH - 2, lineTop + lineCount * Math.max(6, h * 0.09) + 6);
      if (btnY > y + 20) {
        roundRect(x, btnY, btnW, btnH, 2.5);
        ctx.fillStyle = COL.ink;
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `600 ${Math.max(6, btnH * 0.45)}px ${FONT_SANS}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("了解更多 →", x + btnW / 2, btnY + btnH / 2 + 0.5, btnW - 6);
      }

      // 右侧山月黄图
      drawMotifArt(x + textW + colGap, artY, artW, artH, theme.motif);
    } else {
      // 上文下图 / 上标中图下文堆叠模式（1:1 复刻原海报平板端与移动端）
      const titleSize = Math.max(10, Math.min(16, w * 0.11));
      ctx.fillStyle = COL.ink;
      ctx.font = `900 ${titleSize}px ${FONT_SANS}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(theme.heroTitle, x, y + 1, w);

      const enSize = Math.max(6.5, Math.min(8.5, w * 0.055));
      ctx.font = `600 ${enSize}px ${FONT_EN}`;
      ctx.fillStyle = COL.inkMuted;
      ctx.fillText(theme.heroEn, x, y + titleSize * 1.15, w);

      const artTop = y + titleSize * 1.15 + enSize * 1.5;
      const artH = Math.max(22, Math.min(h * 0.42, w * 0.46));
      drawMotifArt(x, artTop, w, artH, theme.motif);

      const lineY = artTop + artH + 5;
      ctx.fillStyle = "#6E6A60";
      ctx.fillRect(x, lineY, w * 0.92, 2.5);
      if (lineY + 6 < y + h - 16) ctx.fillRect(x, lineY + 5.5, w * 0.68, 2.5);

      const btnH = Math.max(11, Math.min(17, h * 0.14));
      const btnY = Math.min(y + h - btnH - 1, lineY + 11);
      if (btnY + btnH <= y + h + 1) {
        const btnW = Math.min(w * 0.72, 92);
        roundRect(x, btnY, btnW, btnH, 2.5);
        ctx.fillStyle = COL.ink;
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `600 ${Math.max(6, btnH * 0.48)}px ${FONT_SANS}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("了解更多 →", x + btnW / 2, btnY + btnH / 2 + 0.5, btnW - 6);
      }
    }
    ctx.restore();
  }

  function drawCardsBlock(x, y, w, h, devEval, theme) {
    ctx.save();
    const cols = devEval.activeCols;
    const rows = Math.ceil(4 / cols);
    const gapX = cols > 1 ? Math.max(3, Math.min(10, w * 0.024)) : 0;
    const gapY = rows > 1 ? Math.max(3, Math.min(8, h * 0.06)) : 0;
    const cellW = (w - (cols - 1) * gapX) / cols;
    const cellH = (h - (rows - 1) * gapY) / rows;
    const cramped = devEval.cardWidth < 138 && !devEval.listRowMode && devEval.overflowPx === 0;

    for (let i = 0; i < 4; i++) {
      const card = theme.cards[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = x + col * (cellW + gapX);
      const cy = y + row * (cellH + gapY);

      if (devEval.listRowMode) {
        // 原海报移动端标志性的单列行列表（图标 + 双行文字 + 右侧 `>` 箭头）
        if (i > 0) {
          ctx.strokeStyle = COL.rule;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx, cy - gapY / 2);
          ctx.lineTo(cx + cellW, cy - gapY / 2);
          ctx.stroke();
        }
        const iconSize = Math.max(9, Math.min(15, cellH * 0.56));
        drawMiniIcon(card.icon, cx + iconSize * 0.65, cy + cellH / 2, iconSize);
        const tx = cx + iconSize * 1.6;
        ctx.fillStyle = COL.ink;
        ctx.font = `700 ${Math.max(7.5, Math.min(11, cellH * 0.42))}px ${FONT_SANS}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(card.title, tx, cy + cellH * 0.36, cellW - iconSize * 2.4);
        ctx.fillStyle = COL.inkLight;
        ctx.font = `500 ${Math.max(6, Math.min(8.5, cellH * 0.28))}px ${FONT_EN}`;
        ctx.fillText(card.en, tx, cy + cellH * 0.72, cellW - iconSize * 2.4);
        // 右侧 `>`
        ctx.strokeStyle = COL.inkMuted;
        ctx.lineWidth = 1.3;
        const ax = cx + cellW - 7;
        const ay = cy + cellH / 2;
        ctx.beginPath();
        ctx.moveTo(ax - 3, ay - 3.5);
        ctx.lineTo(ax + 1, ay);
        ctx.lineTo(ax - 3, ay + 3.5);
        ctx.stroke();
      } else {
        // 卡片网格（桌面 4 列 / 平板 2×2 / 挤扁告警框）
        if (cramped) {
          ctx.fillStyle = "rgba(192, 38, 29, 0.08)";
          ctx.fillRect(cx, cy, cellW, cellH);
          ctx.strokeStyle = COL.danger;
          ctx.lineWidth = 1;
          ctx.strokeRect(cx, cy, cellW, cellH);
        }
        const horizontal2x2 = cols === 2 && cellW > cellH * 1.45;
        if (horizontal2x2) {
          const iconSize = Math.max(10, Math.min(18, cellH * 0.45));
          drawMiniIcon(card.icon, cx + iconSize * 0.65, cy + cellH * 0.46, iconSize);
          const tx = cx + iconSize * 1.55;
          ctx.fillStyle = COL.ink;
          ctx.font = `700 ${Math.max(8, Math.min(11.5, cellH * 0.3))}px ${FONT_SANS}`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(card.title, tx, cy + cellH * 0.34, cellW - iconSize * 1.7);
          ctx.fillStyle = COL.inkLight;
          ctx.font = `500 ${Math.max(6, Math.min(8.5, cellH * 0.2))}px ${FONT_EN}`;
          ctx.fillText(card.en, tx, cy + cellH * 0.66, cellW - iconSize * 1.7);
        } else {
          const iconSize = Math.max(9, Math.min(20, Math.min(cellW * 0.45, cellH * 0.32)));
          drawMiniIcon(card.icon, cx + cellW / 2, cy + iconSize * 0.8 + 4, iconSize);
          ctx.fillStyle = cramped ? COL.danger : COL.ink;
          ctx.font = `700 ${Math.max(7, Math.min(12, cellW * 0.14))}px ${FONT_SANS}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          const titleY = cy + iconSize * 1.65 + 6;
          ctx.fillText(card.title, cx + cellW / 2, titleY, cellW - 4);
          if (cellH > 58) {
            ctx.fillStyle = COL.inkLight;
            ctx.font = `500 ${Math.max(5.5, Math.min(8.5, cellW * 0.088))}px ${FONT_EN}`;
            ctx.fillText(card.en, cx + cellW / 2, titleY + Math.max(11, cellW * 0.17), cellW - 4);
          }
        }
      }
    }
    ctx.restore();
  }

  // 绘制设备之间的 `→` 原海报箭头
  function drawFlowArrow(cx, cy) {
    ctx.save();
    ctx.strokeStyle = COL.ink;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.moveTo(cx + 4, cy - 6);
    ctx.lineTo(cx + 10, cy);
    ctx.lineTo(cx + 4, cy + 6);
    ctx.stroke();
    ctx.restore();
  }

  function render(t, dt, { still }) {
    const rawState = getState();
    const evalRes = evaluateAll(rawState);
    const { state, devices, live, theme } = evalRes;

    // 跨断点检测并触发脉冲反馈
    if (lastTier && lastTier !== live.tier) {
      pulse = 1;
    }
    lastTier = live.tier;

    // 推进动画与平滑插值
    let moving = false;
    if (still) {
      intro = 1;
      anim.vw = state.viewportWidth;
      anim.bp1 = state.bp1;
      anim.bp2 = state.bp2;
      pulse = 0;
    } else {
      if (intro < 1) {
        intro = Math.min(1, intro + Math.max(0.016, dt) * 1.8);
        moving = true;
      }
      const ease = 1 - Math.exp(-Math.max(0.016, dt) * 16);
      if (Math.abs(anim.vw - state.viewportWidth) > 0.4) {
        anim.vw += (state.viewportWidth - anim.vw) * ease;
        moving = true;
      } else {
        anim.vw = state.viewportWidth;
      }
      if (Math.abs(anim.bp1 - state.bp1) > 0.4) {
        anim.bp1 += (state.bp1 - anim.bp1) * ease;
        moving = true;
      } else {
        anim.bp1 = state.bp1;
      }
      if (Math.abs(anim.bp2 - state.bp2) > 0.4) {
        anim.bp2 += (state.bp2 - anim.bp2) * ease;
        moving = true;
      } else {
        anim.bp2 = state.bp2;
      }
      if (pulse > 0.02) {
        pulse = Math.max(0, pulse - Math.max(0.016, dt) * 2.2);
        moving = true;
      }
    }

    if (!dirty && !moving) return;
    dirty = false;

    hitTargets = { track: null, vwKnob: null, bp1Knob: null, bp2Knob: null, fixBadges: [], deviceCards: [] };

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    // 与原海报一致的明黄舞台底面
    ctx.fillStyle = COL.amber;
    ctx.fillRect(0, 0, cssW, cssH);

    const compact = cssW < 680;
    drawRuler(evalRes, compact);

    const easeOut = 1 - Math.pow(1 - intro, 3);
    const activeSlot = state.viewportWidth >= 1060 ? "desktop" : state.viewportWidth >= 640 ? "tablet" : "mobile";

    if (!compact) {
      // 宽屏 / 平板：三联设备并排演化矩阵（1:1 承袭原海报桌面→平板→手机比例）
      const topY = 98;
      const bottomPad = 14;
      const devH = Math.max(180, cssH - topY - bottomPad);
      const sidePad = 24;
      const arrowGap = Math.max(36, Math.min(54, cssW * 0.042));
      const availW = cssW - sidePad * 2 - arrowGap * 2 - (devices.mobile.overflowPx > 0 ? 22 : 0);

      const dW = Math.round(availW * 0.455);
      const tW = Math.round(availW * 0.295);
      const mW = Math.round(availW * 0.25);

      const dX = sidePad;
      const tX = dX + dW + arrowGap;
      const mX = tX + tW + arrowGap;
      const bandMax = Math.max(12, Math.floor(arrowGap * 0.36));

      const liftY = (1 - easeOut) * 18;
      drawDeviceFrame({ x: dX, y: topY + liftY, w: dW, h: devH }, devices.desktop, DEVICES[0], theme, activeSlot === "desktop", false, bandMax);
      drawFlowArrow(dX + dW + arrowGap * 0.56, topY + devH * 0.48 + liftY);
      drawDeviceFrame({ x: tX, y: topY + liftY * 1.2, w: tW, h: devH }, devices.tablet, DEVICES[1], theme, activeSlot === "tablet", false, bandMax);
      drawFlowArrow(tX + tW + arrowGap * 0.56, topY + devH * 0.48 + liftY * 1.2);
      drawDeviceFrame({ x: mX, y: topY + liftY * 1.4, w: mW, h: devH }, devices.mobile, DEVICES[2], theme, activeSlot === "mobile", false, 20);
    } else {
      // 手机窄屏/横屏模式：按物理视口区间放大对应实体设备 + 底部三端联动切换缩略条
      focusSlot = activeSlot;
      const devMeta = DEVICES.find((d) => d.id === focusSlot) || DEVICES[2];
      const devEval = devices[focusSlot];

      const isShort = cssH < 320;
      const stripH = isShort ? 44 : 52;
      const topY = isShort ? 58 : 66;
      const mainH = Math.max(138, cssH - topY - stripH - 18);

      // 按当前视口宽真实缩放主设备画幅宽（320px 瘦机 → 1440px 宽屏），一眼看懂因屏而变
      const widthFrac = 0.56 + ((anim.vw - 320) / (1440 - 320)) * 0.34;
      const maxMainW = cssW - (devEval.overflowPx > 0 ? 52 : 28);
      const mainW = Math.min(maxMainW, Math.round(cssW * widthFrac));
      const mainX = Math.round((cssW - mainW) / 2) - (devEval.overflowPx > 0 ? 10 : 0);

      drawDeviceFrame({ x: mainX, y: topY, w: mainW, h: mainH }, devEval, devMeta, theme, true, true, 28);

      // 底部三端联动切换条
      const stripY = cssH - stripH - 4;
      const gap = 8;
      const padX = 14;
      const tabW = (cssW - padX * 2 - gap * 2) / 3;
      DEVICES.forEach((dm, idx) => {
        const de = devices[dm.id];
        const tx = padX + idx * (tabW + gap);
        const sel = dm.id === focusSlot;
        roundRect(tx, stripY, tabW, stripH - 4, 8);
        ctx.fillStyle = sel ? COL.ink : "rgba(255,255,255,0.88)";
        ctx.fill();
        ctx.strokeStyle = de.ok ? COL.ink : COL.danger;
        ctx.lineWidth = sel ? 2 : 1.5;
        ctx.stroke();

        // 状态小圆点
        ctx.beginPath();
        ctx.arc(tx + 12, stripY + (isShort ? 13 : 15), 3.8, 0, Math.PI * 2);
        ctx.fillStyle = de.ok ? (sel ? "#58E09B" : COL.ok) : (sel ? "#FF7366" : COL.danger);
        ctx.fill();

        ctx.fillStyle = sel ? "#FFFFFF" : COL.ink;
        ctx.font = `700 11px ${FONT_SANS}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(dm.name, tx + 21, stripY + (isShort ? 13.5 : 15.5));

        ctx.fillStyle = sel ? COL.amber : COL.inkMuted;
        ctx.font = `500 10px ${FONT_MONO}`;
        ctx.fillText(`${de.width} · ${de.activeCols}列`, tx + 10, stripY + (isShort ? 29 : 34));

        hitTargets.deviceCards.push({ x: tx, y: stripY, w: tabW, h: stripH, id: dm.id, width: dm.width });
      });
    }

    ctx.restore();
  }

  function localPoint(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  function inBox(pt, box) {
    return box && pt.x >= box.x && pt.x <= box.x + box.w && pt.y >= box.y && pt.y <= box.y + box.h;
  }

  function onPointerDown(ev) {
    if (ev.pointerType === "touch") return;
    const pt = localPoint(ev);
    const s = getState();

    // 优先检测纠偏红标点击
    for (const badge of hitTargets.fixBadges) {
      if (inBox(pt, badge)) {
        ev.preventDefault();
        onFixAction(badge.action);
        dirty = true;
        return;
      }
    }

    // 检测游标与两把断点刀
    if (inBox(pt, hitTargets.vwKnob)) {
      drag = { kind: "vw", startX: pt.x, startY: pt.y, startVal: s.viewportWidth, pointerId: ev.pointerId, locked: true };
      canvas.setPointerCapture?.(ev.pointerId);
      ev.preventDefault();
      return;
    }
    if (s.adaptMode === "fluid" && inBox(pt, hitTargets.bp1Knob)) {
      drag = { kind: "bp1", startX: pt.x, startY: pt.y, startVal: s.bp1, pointerId: ev.pointerId, locked: true };
      canvas.setPointerCapture?.(ev.pointerId);
      ev.preventDefault();
      return;
    }
    if (s.adaptMode === "fluid" && inBox(pt, hitTargets.bp2Knob)) {
      drag = { kind: "bp2", startX: pt.x, startY: pt.y, startVal: s.bp2, pointerId: ev.pointerId, locked: true };
      canvas.setPointerCapture?.(ev.pointerId);
      ev.preventDefault();
      return;
    }
    if (hitTargets.track && pt.y >= 0 && pt.y <= hitTargets.track.y + hitTargets.track.h + 18) {
      const nextW = widthFromX(pt.x, hitTargets.track);
      onStateChange({ viewportWidth: nextW });
      drag = { kind: "vw", startX: pt.x, startY: pt.y, startVal: nextW, pointerId: ev.pointerId, locked: true };
      canvas.setPointerCapture?.(ev.pointerId);
      ev.preventDefault();
      return;
    }

    // 在画布设备区上启动横向拖拽（不拦截竖向滚动；点按不拖则切换聚焦设备）
    drag = { kind: "swipe", startX: pt.x, startY: pt.y, startVal: s.viewportWidth, pointerId: ev.pointerId, locked: false, moved: false };
  }

  function onPointerMove(ev) {
    const pt = localPoint(ev);
    if (!drag) {
      // 更新手势光标
      const overFix = hitTargets.fixBadges.some((b) => inBox(pt, b));
      const overKnob = inBox(pt, hitTargets.vwKnob) || inBox(pt, hitTargets.bp1Knob) || inBox(pt, hitTargets.bp2Knob);
      canvas.style.cursor = overFix ? "pointer" : overKnob ? "ew-resize" : "grab";
      return;
    }

    const dx = pt.x - drag.startX;
    const dy = pt.y - drag.startY;
    if (drag.kind === "swipe" && !drag.locked) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
        drag = null; // 放行竖向滚屏
        return;
      }
      if (Math.abs(dx) > 5) {
        drag.locked = true;
        drag.moved = true;
        canvas.setPointerCapture?.(drag.pointerId);
      } else {
        return;
      }
    }

    if (!hitTargets.track) return;
    ev.preventDefault();
    const pxPerUnit = (1440 - 320) / hitTargets.track.w;
    if (drag.kind === "vw" || drag.kind === "swipe") {
      const nextW = drag.kind === "vw" ? widthFromX(pt.x, hitTargets.track) : Math.round(drag.startVal + dx * pxPerUnit);
      onStateChange({ viewportWidth: Math.max(320, Math.min(1440, nextW)) });
    } else if (drag.kind === "bp1") {
      const s = getState();
      const nextBp1 = Math.max(320, Math.min(s.bp2 - 120, widthFromX(pt.x, hitTargets.track)));
      onStateChange({ bp1: nextBp1 });
    } else if (drag.kind === "bp2") {
      const s = getState();
      const nextBp2 = Math.max(s.bp1 + 120, Math.min(1400, widthFromX(pt.x, hitTargets.track)));
      onStateChange({ bp2: nextBp2 });
    }
    dirty = true;
  }

  function onPointerUp(ev) {
    if (!drag) return;
    const pt = localPoint(ev);
    const wasTap = drag.kind === "swipe" && !drag.moved;
    drag = null;
    if (wasTap) {
      // 轻点任意设备切换到该设备的典型视口宽
      for (const dc of hitTargets.deviceCards) {
        if (inBox(pt, dc)) {
          onStateChange({ viewportWidth: dc.width });
          dirty = true;
          break;
        }
      }
    }
  }

  // 支持触摸直拖与点击红标/设备卡（供 perf.mjs 的 touch 事件以及真机手指横向拉动）
  let touchDrag = null;
  canvas.addEventListener("touchstart", (ev) => {
    if (ev.touches.length !== 1) return;
    const t0 = ev.touches[0];
    const r = canvas.getBoundingClientRect();
    const pt = { x: t0.clientX - r.left, y: t0.clientY - r.top };
    touchDrag = { startX: pt.x, startY: pt.y, startVal: getState().viewportWidth, locked: false, moved: false };
  }, { passive: true });

  canvas.addEventListener("touchmove", (ev) => {
    if (!touchDrag || ev.touches.length !== 1 || !hitTargets.track) return;
    const t0 = ev.touches[0];
    const r = canvas.getBoundingClientRect();
    const pt = { x: t0.clientX - r.left, y: t0.clientY - r.top };
    const dx = pt.x - touchDrag.startX;
    const dy = pt.y - touchDrag.startY;
    if (!touchDrag.locked) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
        touchDrag = null;
        return;
      }
      if (Math.abs(dx) > 4) {
        touchDrag.locked = true;
        touchDrag.moved = true;
      } else return;
    }
    ev.preventDefault();
    const pxPerUnit = (1440 - 320) / Math.max(180, hitTargets.track.w);
    const nextW = Math.round(touchDrag.startVal + dx * pxPerUnit);
    onStateChange({ viewportWidth: Math.max(320, Math.min(1440, nextW)) });
    dirty = true;
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    if (touchDrag && !touchDrag.moved) {
      const pt = { x: touchDrag.startX, y: touchDrag.startY };
      const badge = hitTargets.fixBadges.find((b) => inBox(pt, b));
      if (badge) {
        onFixAction(badge.action);
        dirty = true;
      } else {
        const dc = hitTargets.deviceCards.find((d) => inBox(pt, d));
        if (dc) {
          onStateChange({ viewportWidth: dc.width });
          dirty = true;
        }
      }
    }
    touchDrag = null;
  }, { passive: true });

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", () => { drag = null; });

  // 键盘微调当前视口宽度
  canvas.addEventListener("keydown", (ev) => {
    const s = getState();
    const step = ev.shiftKey ? 80 : 24;
    if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      onStateChange({ viewportWidth: Math.max(320, s.viewportWidth - step) });
      dirty = true;
    } else if (ev.key === "ArrowRight") {
      ev.preventDefault();
      onStateChange({ viewportWidth: Math.min(1440, s.viewportWidth + step) });
      dirty = true;
    }
  });

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();

  const ctrl = loop(canvas, render);

  return {
    invalidate() {
      dirty = true;
      ctrl.draw();
    },
    destroy() {
      ro.disconnect();
    },
  };
}
